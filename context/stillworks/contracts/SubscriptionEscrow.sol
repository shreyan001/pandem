// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import {ProductRegistry} from "./ProductRegistry.sol";
import {SubscriptionAgreement} from "./SubscriptionAgreement.sol";
import {InvoiceRegistry} from "./InvoiceRegistry.sol";

/// @notice Bilateral escrow: funds locked upfront, released per attested period,
///         pro-rata refund claimed immediately when founder misses heartbeat past grace window.
contract SubscriptionEscrow {
    struct EscrowState {
        uint256 fundedPeriods;
        uint256 releasedPeriods;
        uint256 balance;
        bool refunded;
    }

    ProductRegistry public immutable registry;
    SubscriptionAgreement public immutable agreementContract;
    InvoiceRegistry public invoiceRegistry;
    address public steward;

    mapping(uint256 => EscrowState) private _escrows;
    bool private _locked;

    event Funded(uint256 indexed agreementId, uint256 periods, uint256 amount, uint256 totalFundedPeriods);
    event Released(uint256 indexed agreementId, uint256 indexed period, uint256 amount, address indexed recipient);
    event RefundClaimable(uint256 indexed agreementId, uint256 missedPeriod, uint256 refundAmount);
    event RefundClaimed(uint256 indexed agreementId, address indexed subscriber, uint256 refundAmount);
    event InvoiceRegistryUpdated(address indexed newInvoiceRegistry);

    error ZeroAddress();
    error ZeroPeriods();
    error InsufficientPayment();
    error Reentrancy();
    error AlreadyRefunded();
    error AgreementCancelled();
    error NotSequentialPeriod();
    error PeriodNotFunded();
    error HeartbeatMissing();
    error GraceWindowNotElapsed();
    error HeartbeatPresent();
    error NothingToRefund();
    error TransferFailed();
    error NotSteward();

    modifier nonReentrant() {
        if (_locked) revert Reentrancy();
        _locked = true;
        _;
        _locked = false;
    }

    constructor(address registryAddress, address agreementAddress, address stewardAddress) {
        if (registryAddress == address(0) || agreementAddress == address(0) || stewardAddress == address(0)) {
            revert ZeroAddress();
        }
        registry = ProductRegistry(registryAddress);
        agreementContract = SubscriptionAgreement(agreementAddress);
        steward = stewardAddress;
    }

    function setInvoiceRegistry(address _invoiceRegistry) external {
        if (msg.sender != steward) revert NotSteward();
        invoiceRegistry = InvoiceRegistry(_invoiceRegistry);
        emit InvoiceRegistryUpdated(_invoiceRegistry);
    }

    /// @notice Subscriber deposits funds for N periods
    function fund(uint256 agreementId, uint256 periods) external payable nonReentrant {
        if (periods == 0) revert ZeroPeriods();

        SubscriptionAgreement.Agreement memory ag = agreementContract.getAgreement(agreementId);
        if (ag.cancelled) revert AgreementCancelled();

        EscrowState storage esc = _escrows[agreementId];
        if (esc.refunded) revert AlreadyRefunded();

        uint256 requiredAmount = periods * ag.pricePerPeriod;
        if (msg.value < requiredAmount) revert InsufficientPayment();

        esc.fundedPeriods += periods;
        esc.balance += requiredAmount;

        // Refund any accidental excess value
        if (msg.value > requiredAmount) {
            (bool refundOk, ) = msg.sender.call{value: msg.value - requiredAmount}("");
            if (!refundOk) revert TransferFailed();
        }

        emit Funded(agreementId, periods, requiredAmount, esc.fundedPeriods);
    }

    /// @notice Anyone can trigger release of the next sequential period for an agreement
    function releasePeriod(uint256 agreementId) external nonReentrant returns (uint256 invoiceId) {
        EscrowState storage esc = _escrows[agreementId];
        return _release(agreementId, esc.releasedPeriods + 1, bytes32(0), "");
    }

    /// @notice Releases the next sequential period with heartbeatTx and auditRequestId metadata
    function releasePeriod(
        uint256 agreementId,
        bytes32 heartbeatTx,
        string calldata auditRequestId
    ) external nonReentrant returns (uint256 invoiceId) {
        EscrowState storage esc = _escrows[agreementId];
        return _release(agreementId, esc.releasedPeriods + 1, heartbeatTx, auditRequestId);
    }

    /// @notice Anyone can trigger release of 1 period to founder after heartbeat is attested
    function release(uint256 agreementId, uint256 period) external nonReentrant returns (uint256 invoiceId) {
        return _release(agreementId, period, bytes32(0), "");
    }

    /// @notice Release a specific period with heartbeatTx and auditRequestId metadata
    function release(
        uint256 agreementId,
        uint256 period,
        bytes32 heartbeatTx,
        string calldata auditRequestId
    ) external nonReentrant returns (uint256 invoiceId) {
        return _release(agreementId, period, heartbeatTx, auditRequestId);
    }

    function _release(
        uint256 agreementId,
        uint256 period,
        bytes32 heartbeatTx,
        string memory auditRequestId
    ) internal returns (uint256 invoiceId) {
        EscrowState storage esc = _escrows[agreementId];
        if (esc.refunded) revert AlreadyRefunded();

        if (period != esc.releasedPeriods + 1) revert NotSequentialPeriod();
        if (period > esc.fundedPeriods) revert PeriodNotFunded();

        SubscriptionAgreement.Agreement memory ag = agreementContract.getAgreement(agreementId);
        ProductRegistry.Product memory prod = registry.getProduct(ag.productId);

        if (prod.lastHeartbeatPeriod < period) revert HeartbeatMissing();

        esc.releasedPeriods = period;
        esc.balance -= ag.pricePerPeriod;

        (bool success, ) = prod.founder.call{value: ag.pricePerPeriod}("");
        if (!success) revert TransferFailed();

        emit Released(agreementId, period, ag.pricePerPeriod, prod.founder);

        if (address(invoiceRegistry) != address(0)) {
            invoiceId = invoiceRegistry.mint(
                agreementId,
                period,
                ag.pricePerPeriod,
                prod.founder,
                ag.subscriber,
                heartbeatTx,
                auditRequestId
            );
        }
    }

    /// @notice Subscriber claims pro-rata refund of all remaining unreleased periods if heartbeat missed
    function claimRefund(uint256 agreementId) external nonReentrant {
        EscrowState storage esc = _escrows[agreementId];
        if (esc.refunded) revert AlreadyRefunded();
        if (esc.releasedPeriods >= esc.fundedPeriods) revert NothingToRefund();

        SubscriptionAgreement.Agreement memory ag = agreementContract.getAgreement(agreementId);
        ProductRegistry.Product memory prod = registry.getProduct(ag.productId);

        uint256 nextPeriod = esc.releasedPeriods + 1;
        uint256 deadline = ag.startTime + (nextPeriod * ag.periodLength) + ag.graceWindow;

        if (block.timestamp <= deadline) revert GraceWindowNotElapsed();
        if (prod.lastHeartbeatPeriod >= nextPeriod) revert HeartbeatPresent();

        uint256 unreleasedPeriods = esc.fundedPeriods - esc.releasedPeriods;
        uint256 refundAmount = unreleasedPeriods * ag.pricePerPeriod;

        esc.refunded = true;
        esc.balance = 0;

        emit RefundClaimable(agreementId, nextPeriod, refundAmount);

        (bool success, ) = ag.subscriber.call{value: refundAmount}("");
        if (!success) revert TransferFailed();

        emit RefundClaimed(agreementId, ag.subscriber, refundAmount);
    }

    /// @notice Helper for frontends and agents to check refund status
    function isRefundClaimable(uint256 agreementId) external view returns (bool claimable, uint256 refundAmount) {
        EscrowState memory esc = _escrows[agreementId];
        if (esc.refunded || esc.releasedPeriods >= esc.fundedPeriods) {
            return (false, 0);
        }

        SubscriptionAgreement.Agreement memory ag = agreementContract.getAgreement(agreementId);
        ProductRegistry.Product memory prod = registry.getProduct(ag.productId);

        uint256 nextPeriod = esc.releasedPeriods + 1;
        uint256 deadline = ag.startTime + (nextPeriod * ag.periodLength) + ag.graceWindow;

        if (block.timestamp > deadline && prod.lastHeartbeatPeriod < nextPeriod) {
            return (true, (esc.fundedPeriods - esc.releasedPeriods) * ag.pricePerPeriod);
        }

        return (false, 0);
    }

    function getEscrow(uint256 agreementId) external view returns (EscrowState memory) {
        return _escrows[agreementId];
    }
}
