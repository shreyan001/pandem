// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

/// @notice One listing: who owns it, where its passport lives, and who may post a heartbeat.
///         Subscriptions, escrow, and invoices are separate contracts.
contract ProductRegistry {
    enum Status {
        Pending,
        Active
    }

    struct Product {
        address founder;
        address steward;
        address heartbeatSigner;
        bytes32 passportRoot;
        bytes32 frontendRoot;
        bytes32 proposedRoot;
        Status status;
        uint256 lastHeartbeatPeriod;
        bool exists;
        bool hasProposal;
    }

    uint256 public nextProductId = 1;
    mapping(uint256 => Product) private _products;

    event Registered(
        uint256 indexed productId,
        address indexed founder,
        address steward,
        address heartbeatSigner,
        bytes32 passportRoot,
        bytes32 frontendRoot
    );
    event PassportProposed(uint256 indexed productId, bytes32 newRoot);
    event PassportApproved(uint256 indexed productId, bytes32 passportRoot);
    event Heartbeat(uint256 indexed productId, uint256 period, bytes32 statusHash);

    error ZeroAddress();
    error UnknownProduct();
    error NotFounder();
    error NotSteward();
    error NotHeartbeatSigner();
    error PeriodNotNew();
    error NothingProposed();

    function register(
        bytes32 passportRoot,
        bytes32 frontendRoot,
        address heartbeatSigner,
        address steward
    ) external returns (uint256 productId) {
        if (heartbeatSigner == address(0) || steward == address(0)) revert ZeroAddress();

        productId = nextProductId++;
        Product storage product = _products[productId];
        product.founder = msg.sender;
        product.steward = steward;
        product.heartbeatSigner = heartbeatSigner;
        product.passportRoot = passportRoot;
        product.frontendRoot = frontendRoot;
        product.status = Status.Pending;
        product.exists = true;

        emit Registered(productId, msg.sender, steward, heartbeatSigner, passportRoot, frontendRoot);
    }

    /// @notice Founder stores a new passport root. It does not go live until the steward approves it.
    function proposePassport(uint256 productId, bytes32 newRoot) external {
        Product storage product = _existing(productId);
        if (msg.sender != product.founder) revert NotFounder();
        product.proposedRoot = newRoot;
        product.hasProposal = true;
        emit PassportProposed(productId, newRoot);
    }

    /// @notice Steward copies the proposed root into the live passport and marks the listing active.
    function approvePassport(uint256 productId) external {
        Product storage product = _existing(productId);
        if (msg.sender != product.steward) revert NotSteward();
        if (!product.hasProposal) revert NothingProposed();
        product.passportRoot = product.proposedRoot;
        product.hasProposal = false;
        product.status = Status.Active;
        emit PassportApproved(productId, product.passportRoot);
    }

    /// @notice The heartbeat signer posts the next period. The contract stores the hash and does not interpret it.
    function heartbeat(uint256 productId, uint256 period, bytes32 statusHash) external {
        Product storage product = _existing(productId);
        if (msg.sender != product.heartbeatSigner) revert NotHeartbeatSigner();
        if (period <= product.lastHeartbeatPeriod) revert PeriodNotNew();
        product.lastHeartbeatPeriod = period;
        emit Heartbeat(productId, period, statusHash);
    }

    function getProduct(uint256 productId) external view returns (Product memory) {
        return _existing(productId);
    }

    function _existing(uint256 productId) private view returns (Product storage product) {
        product = _products[productId];
        if (!product.exists) revert UnknownProduct();
    }
}
