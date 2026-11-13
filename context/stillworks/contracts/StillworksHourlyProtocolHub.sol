// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import {MockUSDT} from "./MockUSDT.sol";

interface IStewardshipEscrow {
    function releaseOpsReserveForInference(address provider, uint256 amount) external;
    function transferStewardship(address newSteward) external;
}

/// @title StillworksHourlyProtocolHub
/// @notice Central hourly upkeep registry, protocol treasury, and autonomous inference paymaster for 0G Galileo.
/// @dev Enforces 1-hour CROPS checkpoints, maintains a verifiable snapshot ring buffer, and handles automated steward succession.
contract StillworksHourlyProtocolHub {
    enum HealthStatus { Active, GracePeriod, Abandoned }

    struct ProductListing {
        uint256 productId;
        bytes32 slugHash;
        address steward;
        address escrowContract;
        address inferenceProvider;     // 0G compute provider / broker
        bytes32 latest0GStorageHash;
        uint256 lastHeartbeat;
        uint256 totalServiceFeesContributed;
        HealthStatus status;
        bool registered;
    }

    struct SuccessionProposal {
        uint256 proposalId;
        uint256 productId;
        address proposer;
        address proposedSteward;
        bytes32 proposedFrontend0GRoot;
        bytes32 proposedWalkawayRoot;
        uint256 votesFor;
        uint256 createdAt;
        uint256 deadline;
        bool executed;
    }

    MockUSDT public immutable usdt;
    address public platformAdmin;
    address public creKeeper;

    // Optimal 1-Hour Cadence Parameters
    uint256 public constant EPOCH_INTERVAL = 1 hours;             // 3,600s optimal frequency
    uint256 public constant HEARTBEAT_TIMEOUT = 1 hours;          // 1 missed hour -> GracePeriod
    uint256 public constant ABANDONMENT_TIMEOUT = 2 hours;        // 2 missed hours -> Abandoned
    uint256 public constant PROPOSAL_VOTING_PERIOD = 24 hours;    // Fast succession turnaround

    // Protocol State & Metrics
    uint256 public totalProtocolFeesCollected;
    uint256 public currentEpoch;
    uint256 public lastUpkeepTimestamp;
    bytes32 public latestPlatformSnapshotHash;

    // Verifiable Snapshot History (Historical Proofs)
    mapping(uint256 => bytes32) public epochSnapshotHashes;
    mapping(uint256 => uint256) public epochTimestamps;

    // Registry & Escrows
    uint256 public productCount;
    mapping(uint256 => ProductListing) public listings;
    mapping(bytes32 => uint256) public slugHashToProductId;
    mapping(address => bool) public authorizedEscrows;

    // Governance & Succession Proposals
    uint256 public proposalCount;
    mapping(uint256 => SuccessionProposal) public proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    // Events
    event ListingRegistered(uint256 indexed productId, bytes32 indexed slugHash, address indexed steward, address escrow);
    event HeartbeatRecorded(uint256 indexed productId, uint256 timestamp, bytes32 newStorageHash);
    event ServiceFeeReceived(uint256 indexed productId, address indexed escrow, uint256 amount);
    event HourlyUpkeepPerformed(uint256 indexed epoch, bytes32 snapshotHash, uint256 feePoolBalance, uint256 timestamp);
    event HealthStatusChanged(uint256 indexed productId, HealthStatus newStatus);
    event InferenceQuotaReplenished(uint256 indexed productId, address indexed provider, uint256 amount);
    event ProposalSubmitted(uint256 indexed proposalId, uint256 indexed productId, address indexed proposer, address proposedSteward);
    event ProposalVoted(uint256 indexed proposalId, address indexed voter, uint256 weight);
    event SuccessionExecuted(uint256 indexed proposalId, uint256 indexed productId, address indexed newSteward);
    event KeeperUpdated(address indexed oldKeeper, address indexed newKeeper);

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

    /// @notice Register a sovereign software product listing on the hourly hub
    function registerListing(
        bytes32 slugHash,
        address steward,
        address escrowContract,
        address inferenceProvider,
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
            inferenceProvider: inferenceProvider,
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

    /// @notice Receive platform service fee (2.5%) from authorized escrow
    function receiveServiceFee(uint256 productId, uint256 amount) external {
        require(authorizedEscrows[msg.sender], "Unauthorized escrow");
        require(listings[productId].registered, "Product not registered");

        require(usdt.transferFrom(msg.sender, address(this), amount), "Fee transfer failed");

        totalProtocolFeesCollected += amount;
        listings[productId].totalServiceFeesContributed += amount;

        emit ServiceFeeReceived(productId, msg.sender, amount);
    }

    /// @notice Record periodic liveness heartbeat and walkaway snapshot root
    function recordHeartbeat(uint256 productId, bytes32 newStorageHash) external {
        ProductListing storage listing = listings[productId];
        require(listing.registered, "Not registered");
        require(
            msg.sender == listing.steward || msg.sender == creKeeper || msg.sender == platformAdmin,
            "Unauthorized heartbeat signer"
        );

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

    /// @notice Perform hourly upkeep: anchors catalog snapshot hash and sweeps product health
    function performHourlyUpkeep(bytes32 snapshotHash) external onlyKeeper {
        require(snapshotHash != bytes32(0), "Zero snapshot");
        currentEpoch++;
        latestPlatformSnapshotHash = snapshotHash;
        lastUpkeepTimestamp = block.timestamp;

        // Save into verifiable history ring buffer
        epochSnapshotHashes[currentEpoch] = snapshotHash;
        epochTimestamps[currentEpoch] = block.timestamp;

        // Upkeep sweeps health status across all registered listings
        for (uint256 i = 1; i <= productCount; i++) {
            _evaluateHealth(i);
        }

        uint256 feePool = usdt.balanceOf(address(this));
        emit HourlyUpkeepPerformed(currentEpoch, snapshotHash, feePool, block.timestamp);
    }

    /// @notice Autonomous Inference Replenishment (Zero Steward Dependency)
    /// @dev Called by keeper or automation bot when inference compute credits drop below threshold.
    ///      Commands the product escrow to remit funds from its Ops Reserve directly to the 0G compute provider.
    function replenishInferenceQuota(uint256 productId, uint256 amount) external onlyKeeper {
        ProductListing storage listing = listings[productId];
        require(listing.registered, "Product not registered");
        require(listing.escrowContract != address(0), "No escrow contract");
        require(listing.inferenceProvider != address(0), "No inference provider configured");
        require(listing.status == HealthStatus.Active, "Product not active");

        // Instruct escrow to release ops funds directly to provider
        IStewardshipEscrow(listing.escrowContract).releaseOpsReserveForInference(
            listing.inferenceProvider,
            amount
        );

        emit InferenceQuotaReplenished(productId, listing.inferenceProvider, amount);
    }

    /// @notice Submit a community succession proposal when a steward is unresponsive
    function submitSuccessionProposal(
        uint256 productId,
        address proposedSteward,
        bytes32 proposedFrontend0GRoot,
        bytes32 proposedWalkawayRoot
    ) external returns (uint256 proposalId) {
        ProductListing storage listing = listings[productId];
        require(listing.registered, "Product not registered");
        require(proposedSteward != address(0), "Zero steward");
        require(listing.status == HealthStatus.Abandoned || listing.status == HealthStatus.GracePeriod, "Module still healthy");

        proposalCount++;
        proposalId = proposalCount;

        proposals[proposalId] = SuccessionProposal({
            proposalId: proposalId,
            productId: productId,
            proposer: msg.sender,
            proposedSteward: proposedSteward,
            proposedFrontend0GRoot: proposedFrontend0GRoot,
            proposedWalkawayRoot: proposedWalkawayRoot,
            votesFor: 1, // Proposer votes by default
            createdAt: block.timestamp,
            deadline: block.timestamp + PROPOSAL_VOTING_PERIOD,
            executed: false
        });

        hasVoted[proposalId][msg.sender] = true;

        emit ProposalSubmitted(proposalId, productId, msg.sender, proposedSteward);
    }

    /// @notice Vote on an active succession proposal
    function voteOnProposal(uint256 proposalId) external {
        SuccessionProposal storage proposal = proposals[proposalId];
        require(!proposal.executed, "Proposal already executed");
        require(block.timestamp <= proposal.deadline, "Voting closed");
        require(!hasVoted[proposalId][msg.sender], "Already voted");

        hasVoted[proposalId][msg.sender] = true;
        proposal.votesFor += 1;

        emit ProposalVoted(proposalId, msg.sender, 1);
    }

    /// @notice Execute succession proposal after voting deadline passes with quorum
    function executeSuccession(uint256 proposalId) external {
        SuccessionProposal storage proposal = proposals[proposalId];
        require(!proposal.executed, "Already executed");
        require(block.timestamp > proposal.deadline, "Voting still active");
        require(proposal.votesFor >= 1, "Insufficient votes");

        ProductListing storage listing = listings[proposal.productId];
        address oldSteward = listing.steward;
        listing.steward = proposal.proposedSteward;
        listing.latest0GStorageHash = proposal.proposedWalkawayRoot;
        listing.status = HealthStatus.Active;
        listing.lastHeartbeat = block.timestamp;
        proposal.executed = true;

        // If escrow supports transfer, transfer stewardship
        if (listing.escrowContract != address(0)) {
            try IStewardshipEscrow(listing.escrowContract).transferStewardship(proposal.proposedSteward) {} catch {}
        }

        emit SuccessionExecuted(proposalId, proposal.productId, proposal.proposedSteward);
        emit HealthStatusChanged(proposal.productId, HealthStatus.Active);
    }

    function _evaluateHealth(uint256 productId) internal {
        ProductListing storage listing = listings[productId];
        if (listing.status == HealthStatus.Abandoned) return;

        uint256 elapsed = block.timestamp - listing.lastHeartbeat;
        if (elapsed > ABANDONMENT_TIMEOUT) {
            listing.status = HealthStatus.Abandoned;
            emit HealthStatusChanged(productId, HealthStatus.Abandoned);
        } else if (elapsed > HEARTBEAT_TIMEOUT && listing.status != HealthStatus.GracePeriod) {
            listing.status = HealthStatus.GracePeriod;
            emit HealthStatusChanged(productId, HealthStatus.GracePeriod);
        }
    }

    /// @notice Check product health and elapsed seconds
    function getProductHealth(uint256 productId) external view returns (HealthStatus currentStatus, uint256 secondsSinceHeartbeat) {
        ProductListing storage listing = listings[productId];
        require(listing.registered, "Not registered");
        currentStatus = listing.status;
        secondsSinceHeartbeat = block.timestamp - listing.lastHeartbeat;
    }

    /// @notice Retrieve snapshot hash for a given epoch from historical ring buffer
    function getHistoricalSnapshot(uint256 epoch) external view returns (bytes32 snapshotHash, uint256 timestamp) {
        require(epoch <= currentEpoch && epoch > 0, "Invalid epoch");
        return (epochSnapshotHashes[epoch], epochTimestamps[epoch]);
    }

    function setKeeper(address newKeeper) external onlyAdmin {
        require(newKeeper != address(0), "Zero address");
        emit KeeperUpdated(creKeeper, newKeeper);
        creKeeper = newKeeper;
    }
}
