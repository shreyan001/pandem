// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

/// @title ProductHealthReceiver
/// @notice Receives and stores BFT health attestations forwarded by Chainlink CRE or Sovereign Sidecar.
contract ProductHealthReceiver {
    struct Attestation {
        bytes32 merkleRoot;
        uint64 timestamp;
        bool isHealthy;
        uint256 receivedAt;
    }

    address public forwarder;
    address public steward;
    Attestation public latestAttestation;

    event HealthAttested(
        bytes32 indexed merkleRoot,
        uint64 timestamp,
        bool isHealthy,
        uint256 receivedAt
    );
    event ForwarderUpdated(address indexed oldForwarder, address indexed newForwarder);

    modifier onlyAuthorized() {
        require(msg.sender == forwarder || msg.sender == steward, "Unauthorized report sender");
        _;
    }

    constructor(address _forwarder, address _steward) {
        require(_steward != address(0), "Zero address");
        forwarder = _forwarder;
        steward = _steward;
    }

    function setForwarder(address newForwarder) external {
        require(msg.sender == steward, "Not steward");
        address old = forwarder;
        forwarder = newForwarder;
        emit ForwarderUpdated(old, newForwarder);
    }

    /// @notice Entrypoint invoked by CRE KeystoneForwarder / MockForwarder / Sovereign Sidecar
    function onReport(bytes calldata /* metadata */, bytes calldata report) external onlyAuthorized {
        (bytes32 merkleRoot, uint64 timestamp, bool isHealthy) =
            abi.decode(report, (bytes32, uint64, bool));

        latestAttestation = Attestation({
            merkleRoot: merkleRoot,
            timestamp: timestamp,
            isHealthy: isHealthy,
            receivedAt: block.timestamp
        });

        emit HealthAttested(merkleRoot, timestamp, isHealthy, block.timestamp);
    }
}
