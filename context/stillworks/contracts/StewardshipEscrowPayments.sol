// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import {MockUSDT} from "./MockUSDT.sol";
import {StillworksHub} from "./StillworksHub.sol";

/// @title StewardshipEscrowPayments
/// @notice Implements bilateral CROPS escrow with USDT billing, platform upkeep service fees, and the 30/20/50 stewardship model.
contract StewardshipEscrowPayments {
    enum Tier { FreePreview, ProMonthly, PremiumAnnual }
    enum Status { Active, Deprecated, Abandoned }

    struct Subscription {
        bytes32 agreementId;
        address subscriber;
        Tier tier;
        uint256 depositTimestamp;
        uint256 reviewUnlockTimestamp; // +7 days
        uint256 totalDeposited;
        uint256 opsReserve;            // 30%
        uint256 contingencyVault;      // 20%
        uint256 reviewLockedAmount;    // ~47.5%
        uint256 platformServiceFee;    // 2.5%
        bool reviewReleased;
        bool refunded;
    }

    StillworksHub public immutable hub;
    MockUSDT public immutable usdt;
    uint256 public immutable productId;
    address public steward;
    address public successorSteward;
    Status public status;

    // Prices in 6-decimal USDT
    uint256 public constant PRO_MONTHLY_PRICE = 10 * 10**6;    // 10 USDT
    uint256 public constant PREMIUM_ANNUAL_PRICE = 7 * 10**6;   // 7 USDT (prepaid)
    uint256 public constant REVIEW_PERIOD = 7 days;
    uint256 public constant PLATFORM_SERVICE_FEE_BPS = 250;     // 2.5% (250 basis points)

    mapping(bytes32 => Subscription) public subscriptions;
    bytes32[] public activeAgreements;
    bool private _locked;

    event SubscriptionCreated(bytes32 indexed agreementId, address indexed subscriber, Tier tier, uint256 amount);
    event ReviewFundsReleased(bytes32 indexed agreementId, address indexed steward, uint256 amount);
    event OpsExpenseClaimed(address indexed steward, uint256 amount);
    event ContingencyRefundClaimed(bytes32 indexed agreementId, address indexed subscriber, uint256 amount);
    event StewardshipTransferred(address indexed oldSteward, address indexed newSteward);
    event ModuleAbandoned(uint256 indexed productId, string reason);
    event PlatformServiceFeeRemitted(uint256 indexed productId, uint256 amount);

    modifier nonReentrant() {
        require(!_locked, "Reentrancy");
        _locked = true;
        _;
        _locked = false;
    }

    modifier onlySteward() {
        require(msg.sender == steward, "Not steward");
        _;
    }

    constructor(address _hub, address _usdt, uint256 _productId, address _steward) {
        require(_hub != address(0) && _usdt != address(0) && _steward != address(0), "Zero address");
        hub = StillworksHub(_hub);
        usdt = MockUSDT(_usdt);
        productId = _productId;
        steward = _steward;
        status = Status.Active;
    }

    /// @notice Subscribe with USDT (Pro $10 or Premium $7)
    function subscribe(Tier tier) external nonReentrant returns (bytes32 agreementId) {
        require(status == Status.Active, "Module not active");
        uint256 cost = 0;
        if (tier == Tier.ProMonthly) {
            cost = PRO_MONTHLY_PRICE;
        } else if (tier == Tier.PremiumAnnual) {
            cost = PREMIUM_ANNUAL_PRICE;
        } else {
            // Free preview tier costs 0 USDT
            cost = 0;
        }

        uint256 serviceFee = 0;
        uint256 ops = 0;
        uint256 contingency = 0;
        uint256 reviewLock = 0;

        if (cost > 0) {
            require(usdt.transferFrom(msg.sender, address(this), cost), "USDT transfer failed");

            // Calculate fee allocations
            serviceFee = (cost * PLATFORM_SERVICE_FEE_BPS) / 10000; // 2.5% platform upkeep fee
            ops = (cost * 30) / 100;                                 // 30% operations reserve
            contingency = (cost * 20) / 100;                         // 20% contingency reserve
            reviewLock = cost - serviceFee - ops - contingency;     // remaining 47.5% locked for review

            // Remit platform upkeep service fee to StillworksHub
            if (serviceFee > 0) {
                usdt.approve(address(hub), serviceFee);
                hub.receiveServiceFee(productId, serviceFee);
                emit PlatformServiceFeeRemitted(productId, serviceFee);
            }
        }

        agreementId = keccak256(abi.encodePacked(msg.sender, productId, block.timestamp, activeAgreements.length));

        subscriptions[agreementId] = Subscription({
            agreementId: agreementId,
            subscriber: msg.sender,
            tier: tier,
            depositTimestamp: block.timestamp,
            reviewUnlockTimestamp: block.timestamp + REVIEW_PERIOD,
            totalDeposited: cost,
            opsReserve: ops,
            contingencyVault: contingency,
            reviewLockedAmount: reviewLock,
            platformServiceFee: serviceFee,
            reviewReleased: false,
            refunded: false
        });

        activeAgreements.push(agreementId);
        emit SubscriptionCreated(agreementId, msg.sender, tier, cost);
    }

    /// @notice Releases the review lock to the developer after the 7-day review period
    function releaseReviewFunds(bytes32 agreementId) external nonReentrant {
        Subscription storage sub = subscriptions[agreementId];
        require(!sub.reviewReleased && !sub.refunded, "Already processed");
        require(block.timestamp >= sub.reviewUnlockTimestamp, "Review period not elapsed");
        require(status != Status.Abandoned, "Module abandoned");

        sub.reviewReleased = true;
        uint256 amount = sub.reviewLockedAmount;
        if (amount > 0) {
            require(usdt.transfer(steward, amount), "USDT payout failed");
        }
        emit ReviewFundsReleased(agreementId, steward, amount);
    }

    /// @notice Steward claims operational expenses to subsidize 0G Storage Turbo or Galileo gas
    function claimOpsReserve(bytes32 agreementId, uint256 amount) external onlySteward nonReentrant {
        Subscription storage sub = subscriptions[agreementId];
        require(amount <= sub.opsReserve, "Exceeds ops reserve");
        sub.opsReserve -= amount;
        require(usdt.transfer(steward, amount), "USDT payout failed");
        emit OpsExpenseClaimed(steward, amount);
    }

    /// @notice If developer abandons stewardship or misses heartbeats, subscriber claims 20% contingency + unreleased funds
    function claimContingencyAndRefund(bytes32 agreementId) external nonReentrant {
        Subscription storage sub = subscriptions[agreementId];
        require(msg.sender == sub.subscriber, "Not subscriber");
        require(!sub.refunded, "Already refunded");

        // Check if module is declared abandoned locally or on StillworksHub
        bool isAbandoned = (status == Status.Abandoned);
        if (!isAbandoned) {
            (StillworksHub.HealthStatus health, ) = hub.getProductHealth(productId);
            if (health == StillworksHub.HealthStatus.Abandoned) {
                status = Status.Abandoned;
                isAbandoned = true;
            }
        }
        require(isAbandoned, "Steward not abandoned");

        sub.refunded = true;
        uint256 refundAmount = sub.contingencyVault;
        if (!sub.reviewReleased) {
            refundAmount += sub.reviewLockedAmount;
        }

        if (refundAmount > 0) {
            require(usdt.transfer(msg.sender, refundAmount), "USDT refund failed");
        }
        emit ContingencyRefundClaimed(agreementId, msg.sender, refundAmount);
    }

    /// @notice Mark module as abandoned (callable by steward or successor)
    function declareAbandoned(string calldata reason) external {
        require(msg.sender == steward || msg.sender == successorSteward, "Unauthorized");
        status = Status.Abandoned;
        emit ModuleAbandoned(productId, reason);
    }

    /// @notice Transfer stewardship to successor
    function transferStewardship(address newSteward) external onlySteward {
        require(newSteward != address(0), "Zero address");
        address old = steward;
        steward = newSteward;
        emit StewardshipTransferred(old, newSteward);
    }

    /// @notice View total number of subscriptions
    function totalSubscriptions() external view returns (uint256) {
        return activeAgreements.length;
    }
}
