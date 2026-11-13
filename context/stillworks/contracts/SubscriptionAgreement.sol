// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import {ProductRegistry} from "./ProductRegistry.sol";

/// @notice Records bilateral subscription terms between a subscriber and a registered product.
contract SubscriptionAgreement {
    struct Agreement {
        uint256 productId;
        address subscriber;
        uint256 pricePerPeriod;
        uint256 periodLength;
        uint256 graceWindow;
        uint256 startTime;
        bytes32 walkawayRoot;
        bool exists;
        bool cancelled;
    }

    ProductRegistry public immutable registry;
    uint256 public nextAgreementId = 1;
    mapping(uint256 => Agreement) private _agreements;

    event AgreementCreated(
        uint256 indexed agreementId,
        uint256 indexed productId,
        address indexed subscriber,
        uint256 pricePerPeriod,
        uint256 periodLength,
        uint256 graceWindow,
        uint256 startTime
    );
    event AgreementCancelled(uint256 indexed agreementId);
    event WalkawayRequested(uint256 indexed agreementId, address indexed subscriber);
    event WalkawayRootUpdated(uint256 indexed agreementId, bytes32 newRoot);

    error ZeroAddress();
    error ZeroAmount();
    error ZeroPeriod();
    error UnknownAgreement();
    error ProductNotActive();
    error NotSubscriber();
    error NotFounder();
    error AlreadyCancelled();

    constructor(address registryAddress) {
        if (registryAddress == address(0)) revert ZeroAddress();
        registry = ProductRegistry(registryAddress);
    }

    /// @notice Create an agreement for an active product
    function create(
        uint256 productId,
        uint256 pricePerPeriod,
        uint256 periodLength,
        uint256 graceWindow
    ) external returns (uint256 agreementId) {
        if (pricePerPeriod == 0) revert ZeroAmount();
        if (periodLength == 0) revert ZeroPeriod();

        ProductRegistry.Product memory product = registry.getProduct(productId);
        if (product.status != ProductRegistry.Status.Active) revert ProductNotActive();

        agreementId = nextAgreementId++;
        Agreement storage ag = _agreements[agreementId];
        ag.productId = productId;
        ag.subscriber = msg.sender;
        ag.pricePerPeriod = pricePerPeriod;
        ag.periodLength = periodLength;
        ag.graceWindow = graceWindow;
        ag.startTime = block.timestamp;
        ag.exists = true;

        emit AgreementCreated(
            agreementId,
            productId,
            msg.sender,
            pricePerPeriod,
            periodLength,
            graceWindow,
            block.timestamp
        );
    }

    /// @notice Subscriber cancels agreement to stop future renewal
    function cancel(uint256 agreementId) external {
        Agreement storage ag = _existing(agreementId);
        if (msg.sender != ag.subscriber) revert NotSubscriber();
        if (ag.cancelled) revert AlreadyCancelled();
        ag.cancelled = true;
        emit AgreementCancelled(agreementId);
    }

    /// @notice Subscriber requests the latest encrypted walkaway bundle
    function requestWalkaway(uint256 agreementId) external {
        Agreement storage ag = _existing(agreementId);
        if (msg.sender != ag.subscriber) revert NotSubscriber();
        emit WalkawayRequested(agreementId, msg.sender);
    }

    /// @notice Founder updates the pinned 0G Storage walkaway bundle root
    function updateWalkawayRoot(uint256 agreementId, bytes32 newRoot) external {
        Agreement storage ag = _existing(agreementId);
        ProductRegistry.Product memory product = registry.getProduct(ag.productId);
        if (msg.sender != product.founder) revert NotFounder();
        ag.walkawayRoot = newRoot;
        emit WalkawayRootUpdated(agreementId, newRoot);
    }

    function getAgreement(uint256 agreementId) external view returns (Agreement memory) {
        return _existing(agreementId);
    }

    function _existing(uint256 agreementId) private view returns (Agreement storage ag) {
        ag = _agreements[agreementId];
        if (!ag.exists) revert UnknownAgreement();
    }
}
