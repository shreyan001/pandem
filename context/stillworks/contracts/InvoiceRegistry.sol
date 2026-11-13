// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

/// @notice Non-transferable receipt records for escrow release events.
///         Immutable invoice snapshots documenting agreement terms, period,
///         founder and subscriber addresses, amount, heartbeat tx, and 0G audit trace.
contract InvoiceRegistry {
    struct Invoice {
        uint256 agreementId;
        uint256 period;
        uint256 amount;
        uint256 timestamp;
        address founder;
        address subscriber;
        bytes32 heartbeatTx;
        string auditRequestId;
    }

    address public escrow;
    address public steward;
    uint256 public nextInvoiceId = 1;

    mapping(uint256 => Invoice) private _invoices;

    event InvoiceMinted(
        uint256 indexed invoiceId,
        uint256 indexed agreementId,
        string auditRequestId,
        bytes32 heartbeatTx
    );
    event EscrowUpdated(address indexed newEscrow);
    event StewardUpdated(address indexed newSteward);

    error ZeroAddress();
    error NotEscrow();
    error NotSteward();
    error UnknownInvoice();

    modifier onlyEscrow() {
        if (msg.sender != escrow) revert NotEscrow();
        _;
    }

    modifier onlySteward() {
        if (msg.sender != steward) revert NotSteward();
        _;
    }

    constructor(address escrowAddress, address stewardAddress) {
        if (stewardAddress == address(0)) revert ZeroAddress();
        escrow = escrowAddress;
        steward = stewardAddress;
    }

    /// @notice Steward can update the authorized escrow contract
    function setEscrow(address newEscrow) external onlySteward {
        if (newEscrow == address(0)) revert ZeroAddress();
        escrow = newEscrow;
        emit EscrowUpdated(newEscrow);
    }

    /// @notice Steward can update the steward address
    function setSteward(address newSteward) external onlySteward {
        if (newSteward == address(0)) revert ZeroAddress();
        steward = newSteward;
        emit StewardUpdated(newSteward);
    }

    /// @notice Mints an immutable invoice record for an escrow period release
    function mint(
        uint256 agreementId,
        uint256 period,
        uint256 amount,
        address founder,
        address subscriber,
        bytes32 heartbeatTx,
        string calldata auditRequestId
    ) external onlyEscrow returns (uint256 invoiceId) {
        invoiceId = nextInvoiceId++;
        _invoices[invoiceId] = Invoice({
            agreementId: agreementId,
            period: period,
            amount: amount,
            timestamp: block.timestamp,
            founder: founder,
            subscriber: subscriber,
            heartbeatTx: heartbeatTx,
            auditRequestId: auditRequestId
        });

        emit InvoiceMinted(invoiceId, agreementId, auditRequestId, heartbeatTx);
    }

    /// @notice View an existing invoice record
    function getInvoice(uint256 invoiceId) external view returns (Invoice memory) {
        if (invoiceId == 0 || invoiceId >= nextInvoiceId) revert UnknownInvoice();
        return _invoices[invoiceId];
    }
}
