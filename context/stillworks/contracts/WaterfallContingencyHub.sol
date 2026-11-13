// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import {MockUSDT} from "./MockUSDT.sol";

interface IContingencyEscrow {
    function releaseContingencyReward(address recipient, uint256 amount) external;
    function getSubscriberWeight(address subscriber) external view returns (uint256 weight);
    function totalContingencyVault() external view returns (uint256);
}

/// @title WaterfallContingencyHub
/// @notice Implements the Waterfall Request & Contingency Proposal Reward Hub.
/// @dev Allows stewards and open-source contributors to propose bug fixes and upgrades, releasing 15-20% of contingency reserves upon weighted subscriber approval.
contract WaterfallContingencyHub {
    struct FixProposal {
        uint256 proposalId;
        uint256 productId;
        address proposer;
        string issueRef;
        bytes32 patchProofHash;
        uint256 requestedAmount;
        uint256 createdAt;
        uint256 votingDeadline;
        uint256 votesForWeight;
        uint256 votesAgainstWeight;
        bool executed;
    }

    MockUSDT public immutable usdt;
    address public platformAdmin;

    uint256 public constant MAX_TRANCHE_BPS = 2000;              // 20% max release per proposal
    uint256 public constant PROPOSAL_COOLDOWN = 7 days;          // Max 1 proposal per week
    uint256 public constant VOTING_PERIOD = 3 days;              // 72-hour review and voting window

    uint256 public proposalCount;
    mapping(uint256 => FixProposal) public proposals;
    mapping(uint256 => uint256) public lastProposalTimestamp;    // productId => timestamp
    mapping(uint256 => address) public productEscrows;           // productId => escrow
    mapping(uint256 => mapping(address => bool)) public hasVoted; // proposalId => voter => voted

    event ProposalCreated(uint256 indexed proposalId, uint256 indexed productId, address indexed proposer, uint256 amount);
    event VoteCast(uint256 indexed proposalId, address indexed voter, bool support, uint256 weight);
    event FixRewardReleased(uint256 indexed proposalId, address indexed recipient, uint256 amount);
    event ProposalRejected(uint256 indexed proposalId, uint256 votesFor, uint256 votesAgainst);

    modifier onlyAdmin() {
        require(msg.sender == platformAdmin, "Not admin");
        _;
    }

    constructor(address _usdt) {
        require(_usdt != address(0), "Zero USDT address");
        usdt = MockUSDT(_usdt);
        platformAdmin = msg.sender;
    }

    function linkProductEscrow(uint256 productId, address escrow) external onlyAdmin {
        require(escrow != address(0), "Zero escrow");
        productEscrows[productId] = escrow;
    }

    /// @notice Submit a fix or maintenance proposal (max 1 per week, 15-20% tranche)
    function submitFixProposal(
        uint256 productId,
        string calldata issueRef,
        bytes32 patchProofHash,
        uint256 requestedAmount
    ) external returns (uint256 proposalId) {
        address escrow = productEscrows[productId];
        require(escrow != address(0), "Escrow not linked");
        require(
            lastProposalTimestamp[productId] == 0 ||
            block.timestamp >= lastProposalTimestamp[productId] + PROPOSAL_COOLDOWN,
            "1 proposal per week limit"
        );

        uint256 vault = IContingencyEscrow(escrow).totalContingencyVault();
        require(vault > 0, "No contingency vault");

        uint256 maxTranche = (vault * MAX_TRANCHE_BPS) / 10000;
        require(requestedAmount <= maxTranche, "Exceeds 20% tranche limit");

        proposalCount++;
        proposalId = proposalCount;
        lastProposalTimestamp[productId] = block.timestamp;

        proposals[proposalId] = FixProposal({
            proposalId: proposalId,
            productId: productId,
            proposer: msg.sender,
            issueRef: issueRef,
            patchProofHash: patchProofHash,
            requestedAmount: requestedAmount,
            createdAt: block.timestamp,
            votingDeadline: block.timestamp + VOTING_PERIOD,
            votesForWeight: 0,
            votesAgainstWeight: 0,
            executed: false
        });

        emit ProposalCreated(proposalId, productId, msg.sender, requestedAmount);
    }

    /// @notice Vote on a fix proposal with weight tied directly to subscriber tier
    function voteOnProposal(uint256 proposalId, bool support) external {
        FixProposal storage prop = proposals[proposalId];
        require(block.timestamp <= prop.votingDeadline, "Voting deadline passed");
        require(!hasVoted[proposalId][msg.sender], "Already voted");

        address escrow = productEscrows[prop.productId];
        require(escrow != address(0), "Escrow not linked");

        uint256 weight = IContingencyEscrow(escrow).getSubscriberWeight(msg.sender);
        require(weight > 0, "No active subscription");

        hasVoted[proposalId][msg.sender] = true;
        if (support) {
            prop.votesForWeight += weight;
        } else {
            prop.votesAgainstWeight += weight;
        }

        emit VoteCast(proposalId, msg.sender, support, weight);
    }

    /// @notice Execute proposal after voting deadline passes
    function executeProposal(uint256 proposalId) external {
        FixProposal storage prop = proposals[proposalId];
        require(!prop.executed, "Already executed");
        require(block.timestamp > prop.votingDeadline, "Voting still active");

        prop.executed = true;

        if (prop.votesForWeight > prop.votesAgainstWeight && prop.votesForWeight > 0) {
            address escrow = productEscrows[prop.productId];
            IContingencyEscrow(escrow).releaseContingencyReward(prop.proposer, prop.requestedAmount);
            emit FixRewardReleased(proposalId, prop.proposer, prop.requestedAmount);
        } else {
            emit ProposalRejected(proposalId, prop.votesForWeight, prop.votesAgainstWeight);
        }
    }
}
