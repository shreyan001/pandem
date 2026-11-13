// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import {MockUSDT} from "./MockUSDT.sol";

/// @title StillworksHub
/// @notice Central platform upkeep, listing registry, and service fee treasury on 0G Galileo.
/// @dev Enforces EF CROPS compliance, tracks listing heartbeats, and receives protocol service fees from escrow contracts.
contract StillworksHub {
    enum HealthStatus { Active, GracePeriod, Abandoned }

    struct ProductListing {
        uint256 productId;
        bytes32 slugHash;
        address steward;
        address escrowContract;
        bytes32 latest0GStorageHash;
        uint256 lastHeartbeat;
        uint256 totalServiceFeesContributed;
        HealthStatus status;
        bool registered;
    }

    MockUSDT public immutable usdt;
    address public platformAdmin;
    address public creKeeper;
    uint256 public constant HEARTBEAT_TIMEOUT = 2 hours;
    uint256 public constant GRACE_PERIOD_TIMEOUT = 24 hours;

    // Protocol Treasury
    uint256 public totalProtocolFeesCollected;
    uint256 public currentEpoch;
    bytes32 public latestPlatformSnapshotHash;
    uint256 public lastUpkeepTimestamp;

    // Registry
    uint256 public productCount;
    mapping(uint256 => ProductListing) public listings;
    mapping(bytes32 => uint256) public slugHashToProductId;
    mapping(address => bool) public authorizedEscrows;

    event ListingRegistered(uint256 indexed productId, bytes32 indexed slugHash, address indexed steward, address escrow);
    event HeartbeatRecorded(uint256 indexed productId, uint256 timestamp, bytes32 newStorageHash);
    event ServiceFeeReceived(uint256 indexed productId, address indexed escrow, uint256 amount);
    event UpkeepPerformed(uint256 indexed epoch, bytes32 snapshotHash, uint256 feePoolBalance, uint256 timestamp);
    event HealthStatusChanged(uint256 indexed productId, HealthStatus newStatus);
    event KeeperUpdated(address indexed oldKeeper, address indexed newKeeper);
    event AdminUpdated(address indexed oldAdmin, address indexed newAdmin);

    modifier onlyAdmin() {
        require(msg.sender == platformAdmin, "Not admin");
        _;
    }

    modifier onlyKeeper() {
        require(msg.sender == creKeeper || msg.sender == platformAdmin, "Not keeper or admin");
        _;
    }

    constructor(address _usdt, address _creKeeper) {
        require(_usdt != address(0), "Zero USDT address");
        usdt = MockUSDT(_usdt);
        platformAdmin = msg.sender;
        creKeeper = _creKeeper != address(0) ? _creKeeper : msg.sender;
        lastUpkeepTimestamp = block.timestamp;
    }

    /// @notice Register a sovereign software product listing on the hub
    function registerListing(
        bytes32 slugHash,
        address steward,
        address escrowContract,
        bytes32 initialStorageHash
    ) external returns (uint256 productId) {
        require(steward != address(0), "Zero steward");
        require(slugHash != bytes32(0), "Zero slug");
        require(slugHashToProductId[slugHash] == 0, "Slug already registered");

        productCount++;
        productId = productCount;

        listings[productId] = ProductListing({
            productId: productId,
            slugHash: slugHash,
            steward: steward,
            escrowContract: escrowContract,
            latest0GStorageHash: initialStorageHash,
            lastHeartbeat: block.timestamp,
            totalServiceFeesContributed: 0,
            status: HealthStatus.Active,
            registered: true
        });

        slugHashToProductId[slugHash] = productId;
        if (escrowContract != address(0)) {
            authorizedEscrows[escrowContract] = true;
        }

        emit ListingRegistered(productId, slugHash, steward, escrowContract);
    }

    /// @notice Authorize an escrow contract to remit service fees
    function setEscrowAuthorization(address escrow, bool authorized) external onlyAdmin {
        authorizedEscrows[escrow] = authorized;
    }

    /// @notice Escrow contracts remit service fees (e.g. 2.5% of subscription) to platform upkeep
    function receiveServiceFee(uint256 productId, uint256 amount) external {
        require(listings[productId].registered, "Product not registered");
        require(amount > 0, "Zero amount");

        // Transfer USDT from caller escrow to hub
        require(usdt.transferFrom(msg.sender, address(this), amount), "Fee transfer failed");

        listings[productId].totalServiceFeesContributed += amount;
        totalProtocolFeesCollected += amount;

        emit ServiceFeeReceived(productId, msg.sender, amount);
    }

    /// @notice Record product heartbeat with updated 0G storage Merkle root
    function recordHeartbeat(uint256 productId, bytes32 newStorageHash) external {
        ProductListing storage listing = listings[productId];
        require(listing.registered, "Not registered");
        require(msg.sender == listing.steward || msg.sender == creKeeper || msg.sender == platformAdmin, "Unauthorized heartbeat");

        listing.lastHeartbeat = block.timestamp;
        if (newStorageHash != bytes32(0)) {
            listing.latest0GStorageHash = newStorageHash;
        }

        if (listing.status != HealthStatus.Active) {
            listing.status = HealthStatus.Active;
            emit HealthStatusChanged(productId, HealthStatus.Active);
        }

        emit HeartbeatRecorded(productId, block.timestamp, newStorageHash);
    }

    /// @notice Central platform upkeep triggered by Chainlink CRE or decentralized keeper
    /// @dev Updates the global snapshot Merkle root and audits heartbeat liveness
    function performUpkeep(bytes32 snapshotHash) external onlyKeeper {
        currentEpoch++;
        latestPlatformSnapshotHash = snapshotHash;
        lastUpkeepTimestamp = block.timestamp;

        // Audit heartbeat status across registered products
        for (uint256 i = 1; i <= productCount; i++) {
            ProductListing storage item = listings[i];
            if (!item.registered) continue;

            uint256 elapsed = block.timestamp - item.lastHeartbeat;
            if (elapsed > GRACE_PERIOD_TIMEOUT) {
                if (item.status != HealthStatus.Abandoned) {
                    item.status = HealthStatus.Abandoned;
                    emit HealthStatusChanged(i, HealthStatus.Abandoned);
                }
            } else if (elapsed > HEARTBEAT_TIMEOUT) {
                if (item.status != HealthStatus.GracePeriod) {
                    item.status = HealthStatus.GracePeriod;
                    emit HealthStatusChanged(i, HealthStatus.GracePeriod);
                }
            }
        }

        emit UpkeepPerformed(currentEpoch, snapshotHash, usdt.balanceOf(address(this)), block.timestamp);
    }

    /// @notice Check live health status of a product
    function getProductHealth(uint256 productId) external view returns (HealthStatus currentStatus, uint256 secondsSinceHeartbeat) {
        ProductListing memory item = listings[productId];
        require(item.registered, "Product not registered");
        secondsSinceHeartbeat = block.timestamp - item.lastHeartbeat;

        if (secondsSinceHeartbeat > GRACE_PERIOD_TIMEOUT) {
            currentStatus = HealthStatus.Abandoned;
        } else if (secondsSinceHeartbeat > HEARTBEAT_TIMEOUT) {
            currentStatus = HealthStatus.GracePeriod;
        } else {
            currentStatus = HealthStatus.Active;
        }
    }

    /// @notice Admin can withdraw platform upkeep funds to subsidize keeper transactions or 0G storage nodes
    function withdrawProtocolFees(address recipient, uint256 amount) external onlyAdmin {
        require(recipient != address(0), "Zero recipient");
        require(amount <= usdt.balanceOf(address(this)), "Exceeds balance");
        require(usdt.transfer(recipient, amount), "USDT transfer failed");
    }

    /// @notice Update CRE keeper address
    function setKeeper(address newKeeper) external onlyAdmin {
        require(newKeeper != address(0), "Zero keeper");
        address old = creKeeper;
        creKeeper = newKeeper;
        emit KeeperUpdated(old, newKeeper);
    }

    /// @notice Transfer platform administration
    function setAdmin(address newAdmin) external onlyAdmin {
        require(newAdmin != address(0), "Zero admin");
        address old = platformAdmin;
        platformAdmin = newAdmin;
        emit AdminUpdated(old, newAdmin);
    }
}
