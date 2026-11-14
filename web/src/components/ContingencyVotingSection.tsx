"use client";

import { useState } from "react";
import { useNearWallet } from "../context/NearWalletContext";
import { PANDEM_ESCROW_ID } from "@pandem/shared";

export interface ContingencyProposal {
  id: string;
  productId: string;
  productName: string;
  title: string;
  description: string;
  targetRecipient: string;
  requestedAmountWNear: number;
  maxAllowedWNear: number; // 20% contingency cap
  contingencyPoolTotal: number;
  status: "Active Voting" | "Passed" | "Rejected";
  timeRemaining: string;
  yesVotesWeight: number;
  noVotesWeight: number;
  totalVoters: number;
  quorumThresholdPct: number;
  createdAt: string;
}

const INITIAL_PROPOSALS: ContingencyProposal[] = [
  {
    id: "PROP-001",
    productId: "3",
    productName: "DeepSearch Sentinel Agent",
    title: "Proposal #1: Failover Redundant Compute Node for DeepSearch Sentinel",
    description:
      "Deploy an automated standby NVIDIA H100 confidential worker on NEAR AI Cloud to prevent heartbeat drops during high-volume query bursts and maintain uninterrupted SLA guarantees.",
    targetRecipient: "deepsearch-infra.testnet",
    requestedAmountWNear: 0.05,
    maxAllowedWNear: 0.12,
    contingencyPoolTotal: 0.60,
    status: "Active Voting",
    timeRemaining: "2d 18h 34m",
    yesVotesWeight: 14.8,
    noVotesWeight: 5.2,
    totalVoters: 24,
    quorumThresholdPct: 50,
    createdAt: "2026-11-13",
  },
  {
    id: "PROP-002",
    productId: "2",
    productName: "SafeSync Zero-Knowledge Vault",
    title: "Proposal #2: Memory-leak Patch & Retrievability Proof for SafeSync",
    description:
      "Audit and patch high-concurrency buffer memory leak in the storage proof verifier daemon to preserve 100% heartbeat streak reliability and avoid triggering false-positive subscriber refund cascades.",
    targetRecipient: "safesync-security.testnet",
    requestedAmountWNear: 0.08,
    maxAllowedWNear: 0.16,
    contingencyPoolTotal: 0.80,
    status: "Active Voting",
    timeRemaining: "1d 06h 15m",
    yesVotesWeight: 22.4,
    noVotesWeight: 3.1,
    totalVoters: 31,
    quorumThresholdPct: 50,
    createdAt: "2026-11-12",
  },
  {
    id: "PROP-000",
    productId: "1",
    productName: "PrivateGPT Enclave Edition",
    title: "Proposal #0: Cold-Start Enclave Pre-warming for PrivateGPT",
    description:
      "Pre-allocate Intel TDX guest memory allocations to reduce latency jitter below the 120s grace threshold. Successfully executed and disbursed from 20% contingency pool.",
    targetRecipient: "privategpt-steward.testnet",
    requestedAmountWNear: 0.04,
    maxAllowedWNear: 0.20,
    contingencyPoolTotal: 1.00,
    status: "Passed",
    timeRemaining: "Concluded",
    yesVotesWeight: 38.5,
    noVotesWeight: 1.5,
    totalVoters: 45,
    quorumThresholdPct: 50,
    createdAt: "2026-11-10",
  },
];

const AVAILABLE_PRODUCTS = [
  { id: "1", name: "PrivateGPT Enclave Edition", maxCap: 0.20 },
  { id: "2", name: "SafeSync Zero-Knowledge Vault", maxCap: 0.16 },
  { id: "3", name: "DeepSearch Sentinel Agent", maxCap: 0.12 },
  { id: "4", name: "HyperIndex Graph RPC", maxCap: 0.10 },
];

export function ContingencyVotingSection() {
  const { accountId, isConnected, connect } = useNearWallet();
  const [proposals, setProposals] = useState<ContingencyProposal[]>(INITIAL_PROPOSALS);
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [userVotes, setUserVotes] = useState<Record<string, "YES" | "NO">>({});
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState<boolean>(false);
  const [voteFeedback, setVoteFeedback] = useState<string | null>(null);

  // Submit Modal Form State
  const [formProductId, setFormProductId] = useState<string>("1");
  const [formTitle, setFormTitle] = useState<string>("");
  const [formRecipient, setFormRecipient] = useState<string>("");
  const [formAmount, setFormAmount] = useState<string>("0.05");
  const [formDescription, setFormDescription] = useState<string>("");
  const [formError, setFormError] = useState<string | null>(null);

  const selectedProductObj =
    AVAILABLE_PRODUCTS.find((p) => p.id === formProductId) || AVAILABLE_PRODUCTS[0];

  const handleVote = (proposalId: string, vote: "YES" | "NO") => {
    if (!isConnected) {
      connect();
      return;
    }

    const previousVote = userVotes[proposalId];
    setUserVotes((prev) => ({ ...prev, [proposalId]: vote }));

    setProposals((prev) =>
      prev.map((p) => {
        if (p.id !== proposalId) return p;

        let newYes = p.yesVotesWeight;
        let newNo = p.noVotesWeight;
        let voterDelta = previousVote ? 0 : 1;

        if (previousVote === "YES") newYes -= 1.0;
        if (previousVote === "NO") newNo -= 1.0;

        if (vote === "YES") newYes += 1.0;
        if (vote === "NO") newNo += 1.0;

        return {
          ...p,
          yesVotesWeight: newYes,
          noVotesWeight: newNo,
          totalVoters: p.totalVoters + voterDelta,
        };
      })
    );

    setVoteFeedback(
      `Vote recorded! Cast ${vote} on ${proposalId} using wallet ${accountId}.`
    );
    setTimeout(() => setVoteFeedback(null), 4000);
  };

  const handleSubmitProposal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setFormError("Please provide a proposal title.");
      return;
    }
    if (!formRecipient.trim() || !formRecipient.includes(".")) {
      setFormError("Recipient must be a valid NEAR account (e.g. team.testnet).");
      return;
    }

    const numAmount = parseFloat(formAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setFormError("Amount must be greater than 0 wNEAR.");
      return;
    }
    if (numAmount > selectedProductObj.maxCap) {
      setFormError(
        `Amount exceeds the 20% contingency cap (${selectedProductObj.maxCap} wNEAR) for product #${selectedProductObj.id}.`
      );
      return;
    }

    const newProposal: ContingencyProposal = {
      id: `PROP-00${proposals.length + 1}`,
      productId: selectedProductObj.id,
      productName: selectedProductObj.name,
      title: formTitle.trim(),
      description: formDescription.trim() || "Community remediation proposal.",
      targetRecipient: formRecipient.trim(),
      requestedAmountWNear: numAmount,
      maxAllowedWNear: selectedProductObj.maxCap,
      contingencyPoolTotal: selectedProductObj.maxCap * 5,
      status: "Active Voting",
      timeRemaining: "3d 00h 00m",
      yesVotesWeight: 1.0,
      noVotesWeight: 0.0,
      totalVoters: 1,
      quorumThresholdPct: 50,
      createdAt: new Date().toISOString().split("T")[0],
    };

    setProposals([newProposal, ...proposals]);
    setIsSubmitModalOpen(false);
    setFormTitle("");
    setFormRecipient("");
    setFormDescription("");
    setFormError(null);
    setVoteFeedback(`Proposal ${newProposal.id} published for active community voting!`);
    setTimeout(() => setVoteFeedback(null), 5000);
  };

  const filteredProposals = proposals.filter((p) => {
    if (filterStatus === "All") return true;
    return p.status === filterStatus;
  });

  return (
    <div className="space-y-8">
      {/* Top Banner & Governance Description */}
      <div className="rounded-none border border-[#2E2E2E] bg-[#171717] p-6 sm:p-8 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-none bg-[#894DEF]" />
              <span className="px-2.5 py-0.5 rounded-none text-xs font-mono font-bold bg-[#262626] text-[#894DEF] border border-[#2E2E2E]">
                WaterfallContingencyHub
              </span>
              <span className="text-xs font-mono text-[#6B6B6B]">20% Escrow Reserve</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#FAFAFA] tracking-tight">
              Contingency Fix-Proposal Voting
            </h2>
            <p className="text-xs sm:text-sm text-[#B8B8B8] leading-relaxed">
              Every subscription continuously channels <strong>20.0% into the product contingency reserve</strong>. When unforeseen outages, security vulnerabilities, or failovers occur, stewards and subscribers vote on community fix proposals to disburse remediation funds without touching subscriber escrow.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              onClick={() => setIsSubmitModalOpen(true)}
              className="px-5 py-3 rounded-none bg-[#894DEF] hover:bg-[#A273F2] text-[#FAFAFA] border border-[#FAFAFA] font-bold text-xs sm:text-sm font-mono transition-colors flex items-center justify-center gap-2"
            >
              <span>+ Submit Fix Proposal</span>
            </button>
          </div>
        </div>

        {/* Live Voting Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-[#2E2E2E] text-xs font-mono">
          <div className="p-3.5 rounded-none bg-[#0D0D0D] border border-[#2E2E2E]">
            <span className="text-[#6B6B6B] block text-[11px]">Active Proposals:</span>
            <span className="text-[#FAFAFA] font-bold text-base mt-0.5 block">
              {proposals.filter((p) => p.status === "Active Voting").length}
            </span>
          </div>

          <div className="p-3.5 rounded-none bg-[#0D0D0D] border border-[#2E2E2E]">
            <span className="text-[#6B6B6B] block text-[11px]">Contingency Buffer Cap:</span>
            <span className="text-[#894DEF] font-bold text-base mt-0.5 block">
              20.0% Max
            </span>
          </div>

          <div className="p-3.5 rounded-none bg-[#0D0D0D] border border-[#2E2E2E]">
            <span className="text-[#6B6B6B] block text-[11px]">Quorum Required:</span>
            <span className="text-[#FAFAFA] font-bold text-base mt-0.5 block">
              ≥ 50% Participation
            </span>
          </div>

          <div className="p-3.5 rounded-none bg-[#0D0D0D] border border-[#2E2E2E]">
            <span className="text-[#6B6B6B] block text-[11px]">Voting Period:</span>
            <span className="text-[#A273F2] font-bold text-base mt-0.5 block">
              72 Hours (3 Days)
            </span>
          </div>
        </div>
      </div>

      {/* Action Feedback Banner */}
      {voteFeedback && (
        <div className="p-3.5 rounded-none bg-[#262626] border border-[#894DEF] text-[#FAFAFA] text-xs font-mono flex items-center gap-2">
          <span className="w-2 h-2 rounded-none bg-[#894DEF]" />
          <span>{voteFeedback}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {["All", "Active Voting", "Passed", "Rejected"].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterStatus(tab)}
              className={`px-3.5 py-1.5 rounded-none text-xs font-mono font-medium transition-colors shrink-0 border ${
                filterStatus === tab
                  ? "bg-[#894DEF] text-[#FAFAFA] border-[#FAFAFA] font-bold"
                  : "bg-[#171717] hover:bg-[#262626] text-[#B8B8B8] hover:text-[#FAFAFA] border-[#2E2E2E]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <span className="text-xs font-mono text-[#6B6B6B] hidden sm:inline">
          Showing {filteredProposals.length} Proposals
        </span>
      </div>

      {/* Proposal Cards Grid */}
      <div className="space-y-6">
        {filteredProposals.map((proposal) => {
          const totalVotes = proposal.yesVotesWeight + proposal.noVotesWeight;
          const yesPct = totalVotes > 0 ? Math.round((proposal.yesVotesWeight / totalVotes) * 100) : 0;
          const noPct = totalVotes > 0 ? 100 - yesPct : 0;
          const quorumCurrentPct = Math.min(100, Math.round((proposal.totalVoters / 30) * 100));
          const isQuorumReached = quorumCurrentPct >= proposal.quorumThresholdPct;
          const currentVote = userVotes[proposal.id];
          const isActive = proposal.status === "Active Voting";

          return (
            <div
              key={proposal.id}
              className="rounded-none border border-[#2E2E2E] bg-[#171717] p-6 sm:p-7 space-y-6 hover:border-[#894DEF] transition-colors"
            >
              {/* Proposal Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-[#2E2E2E]">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-[#6B6B6B]">
                      {proposal.id}
                    </span>
                    <span className="text-[#2E2E2E]">•</span>
                    <span className="text-xs font-mono text-[#894DEF] bg-[#262626] px-2 py-0.5 rounded-none border border-[#2E2E2E]">
                      Product #{proposal.productId}: {proposal.productName}
                    </span>
                    <span
                      className={`text-xs font-mono px-2.5 py-0.5 rounded-none border font-semibold flex items-center gap-1.5 ${
                        isActive
                          ? "bg-[#262626] text-[#FAFAFA] border-[#894DEF]"
                          : proposal.status === "Passed"
                          ? "bg-[#262626] text-[#FAFAFA] border-[#2E2E2E]"
                          : "bg-[#262626] text-rose-400 border-rose-800"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-none ${
                          isActive
                            ? "bg-[#894DEF]"
                            : proposal.status === "Passed"
                            ? "bg-[#FAFAFA]"
                            : "bg-rose-400"
                        }`}
                      />
                      {proposal.status}
                    </span>
                  </div>

                  <h3 className="text-lg sm:text-xl font-bold text-[#FAFAFA] tracking-tight">
                    {proposal.title}
                  </h3>

                  <p className="text-xs text-[#B8B8B8] leading-relaxed max-w-3xl">
                    {proposal.description}
                  </p>
                </div>

                {/* Amount Requested Badge */}
                <div className="text-right shrink-0 p-3.5 rounded-none bg-[#0D0D0D] border border-[#2E2E2E]">
                  <span className="text-[10px] font-mono text-[#6B6B6B] block uppercase">Requested Allocation</span>
                  <div className="text-lg font-mono font-extrabold text-[#FAFAFA]">
                    {proposal.requestedAmountWNear} <span className="text-xs font-normal text-[#B8B8B8]">wNEAR</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#894DEF] block mt-0.5">
                    (Max: {proposal.maxAllowedWNear} wN cap)
                  </span>
                </div>
              </div>

              {/* Target & Time Information */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                <div className="p-3 rounded-none bg-[#0D0D0D] border border-[#2E2E2E]">
                  <span className="text-[#6B6B6B] block text-[11px]">Disbursement Recipient:</span>
                  <span className="text-[#FAFAFA] font-bold mt-0.5 block truncate">
                    {proposal.targetRecipient}
                  </span>
                </div>

                <div className="p-3 rounded-none bg-[#0D0D0D] border border-[#2E2E2E]">
                  <span className="text-[#6B6B6B] block text-[11px]">Voting Window:</span>
                  <span className={`font-bold mt-0.5 block ${isActive ? "text-[#894DEF]" : "text-[#B8B8B8]"}`}>
                    {isActive ? `⏳ ${proposal.timeRemaining} remaining` : proposal.timeRemaining}
                  </span>
                </div>

                <div className="p-3 rounded-none bg-[#0D0D0D] border border-[#2E2E2E]">
                  <span className="text-[#6B6B6B] block text-[11px]">Total Participation:</span>
                  <span className="text-[#FAFAFA] font-bold mt-0.5 block">
                    {proposal.totalVoters} Subscribers ({totalVotes.toFixed(1)} wN voting weight)
                  </span>
                </div>
              </div>

              {/* Quorum & Approval Progress Bars */}
              <div className="space-y-4 p-4 rounded-none bg-[#0D0D0D] border border-[#2E2E2E]">
                {/* 1. Approval Ratio Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-[#FAFAFA] font-semibold flex items-center gap-1.5">
                      <span>✓ Support (YES):</span>
                      <strong className="text-[#894DEF]">{yesPct}%</strong>
                      <span className="text-[#6B6B6B]">({proposal.yesVotesWeight.toFixed(1)} wN)</span>
                    </span>
                    <span className="text-[#B8B8B8] font-semibold flex items-center gap-1.5">
                      <span>✕ Reject (NO):</span>
                      <strong>{noPct}%</strong>
                      <span className="text-[#6B6B6B]">({proposal.noVotesWeight.toFixed(1)} wN)</span>
                    </span>
                  </div>

                  {/* Dual Bar */}
                  <div className="h-3 w-full bg-[#171717] rounded-none overflow-hidden flex border border-[#2E2E2E]">
                    <div
                      className="h-full bg-[#894DEF] transition-all duration-300"
                      style={{ width: `${yesPct}%` }}
                    />
                    <div
                      className="h-full bg-[#262626] transition-all duration-300"
                      style={{ width: `${noPct}%` }}
                    />
                  </div>
                </div>

                {/* 2. Quorum Threshold Bar */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-[#B8B8B8] flex items-center gap-1.5">
                      <span>Quorum Progress:</span>
                      <strong className={isQuorumReached ? "text-[#FAFAFA]" : "text-[#894DEF]"}>
                        {quorumCurrentPct}% / {proposal.quorumThresholdPct}% Required
                      </strong>
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-none border ${
                      isQuorumReached
                        ? "bg-[#262626] text-[#FAFAFA] border-[#894DEF]"
                        : "bg-[#262626] text-[#B8B8B8] border-[#2E2E2E]"
                    }`}>
                      {isQuorumReached ? "Quorum Threshold Reached" : "Quorum Pending"}
                    </span>
                  </div>

                  <div className="h-2 w-full bg-[#171717] rounded-none overflow-hidden border border-[#2E2E2E]">
                    <div
                      className={`h-full transition-all duration-300 ${
                        isQuorumReached ? "bg-[#894DEF]" : "bg-[#262626]"
                      }`}
                      style={{ width: `${quorumCurrentPct}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Voting Action Controls */}
              {isActive && (
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="text-xs font-mono">
                    {currentVote ? (
                      <span className="flex items-center gap-2 text-[#FAFAFA] font-semibold">
                        <span>Your Current Vote:</span>
                        <span
                          className={`px-2.5 py-1 rounded-none border font-bold ${
                            currentVote === "YES"
                              ? "bg-[#262626] text-[#894DEF] border-[#894DEF]"
                              : "bg-[#262626] text-rose-400 border-rose-700"
                          }`}
                        >
                          {currentVote === "YES" ? "✓ Voted YES (Support)" : "✕ Voted NO (Reject)"}
                        </span>
                      </span>
                    ) : (
                      <span className="text-[#B8B8B8]">
                        Cast your subscriber vote using your connected NEAR testnet wallet:
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleVote(proposal.id, "YES")}
                      className={`px-4 py-2 rounded-none font-mono text-xs font-bold transition-colors flex items-center gap-1.5 border ${
                        currentVote === "YES"
                          ? "bg-[#894DEF] text-[#FAFAFA] border-[#FAFAFA]"
                          : "bg-[#0D0D0D] hover:bg-[#262626] text-[#FAFAFA] border-[#2E2E2E] hover:border-[#894DEF]"
                      }`}
                    >
                      <span>✓ Vote YES (Support)</span>
                    </button>

                    <button
                      onClick={() => handleVote(proposal.id, "NO")}
                      className={`px-4 py-2 rounded-none font-mono text-xs font-bold transition-colors flex items-center gap-1.5 border ${
                        currentVote === "NO"
                          ? "bg-rose-700 text-white border-white"
                          : "bg-[#0D0D0D] hover:bg-[#262626] text-[#B8B8B8] border-[#2E2E2E] hover:border-rose-600"
                      }`}
                    >
                      <span>✕ Vote NO (Reject)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Submit Proposal Modal */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-none">
          <div className="bg-[#171717] border border-[#2E2E2E] rounded-none max-w-xl w-full p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#2E2E2E]">
              <div>
                <h3 className="text-xl font-bold text-[#FAFAFA] flex items-center gap-2">
                  <span>Submit Contingency Fix Proposal</span>
                </h3>
                <p className="text-xs text-[#B8B8B8] font-mono mt-0.5">
                  Propose an emergency allocation from the 20% contingency pool.
                </p>
              </div>
              <button
                onClick={() => setIsSubmitModalOpen(false)}
                className="text-[#B8B8B8] hover:text-[#FAFAFA] p-1 rounded-none hover:bg-[#262626] transition-colors"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3.5 rounded-none bg-[#262626] border border-rose-700 text-rose-400 text-xs font-mono">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmitProposal} className="space-y-4 text-xs font-mono">
              {/* Product Select */}
              <div className="space-y-1.5">
                <label className="text-[#B8B8B8] block font-semibold uppercase">
                  1. Target Product
                </label>
                <select
                  value={formProductId}
                  onChange={(e) => setFormProductId(e.target.value)}
                  className="w-full bg-[#0D0D0D] border border-[#2E2E2E] px-3.5 py-2.5 rounded-none text-[#FAFAFA] font-mono text-xs focus:outline-none focus:border-[#894DEF]"
                >
                  {AVAILABLE_PRODUCTS.map((prod) => (
                    <option key={prod.id} value={prod.id}>
                      #{prod.id} - {prod.name} (Max Cap: {prod.maxCap} wNEAR)
                    </option>
                  ))}
                </select>
              </div>

              {/* Proposal Title */}
              <div className="space-y-1.5">
                <label className="text-[#B8B8B8] block font-semibold uppercase">
                  2. Proposal Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Failover Worker Provisioning for Sentinel"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full bg-[#0D0D0D] border border-[#2E2E2E] px-3.5 py-2.5 rounded-none text-[#FAFAFA] font-mono text-xs focus:outline-none focus:border-[#894DEF]"
                />
              </div>

              {/* Target Recipient */}
              <div className="space-y-1.5">
                <label className="text-[#B8B8B8] block font-semibold uppercase">
                  3. Target Recipient Testnet Account
                </label>
                <input
                  type="text"
                  placeholder="e.g. security-team.testnet"
                  value={formRecipient}
                  onChange={(e) => setFormRecipient(e.target.value)}
                  className="w-full bg-[#0D0D0D] border border-[#2E2E2E] px-3.5 py-2.5 rounded-none text-[#FAFAFA] font-mono text-xs focus:outline-none focus:border-[#894DEF]"
                />
              </div>

              {/* Requested Amount */}
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <label className="text-[#B8B8B8] font-semibold uppercase">
                    4. Requested Allocation (wNEAR)
                  </label>
                  <span className="text-[#894DEF]">
                    Max Allowed: {selectedProductObj.maxCap} wNEAR (20% Cap)
                  </span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={selectedProductObj.maxCap}
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  className="w-full bg-[#0D0D0D] border border-[#2E2E2E] px-3.5 py-2.5 rounded-none text-[#FAFAFA] font-mono text-xs focus:outline-none focus:border-[#894DEF]"
                />
              </div>

              {/* Fix Description */}
              <div className="space-y-1.5">
                <label className="text-[#B8B8B8] block font-semibold uppercase">
                  5. Technical Justification & Remediation Plan
                </label>
                <textarea
                  rows={3}
                  placeholder="Explain why this contingency allocation is necessary to restore heartbeat compliance..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full bg-[#0D0D0D] border border-[#2E2E2E] px-3.5 py-2 rounded-none text-[#FAFAFA] font-mono text-xs focus:outline-none focus:border-[#894DEF]"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="flex-1 py-2.5 rounded-none border border-[#2E2E2E] bg-[#0D0D0D] text-[#B8B8B8] hover:text-[#FAFAFA] font-medium text-xs hover:bg-[#262626] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-none bg-[#894DEF] hover:bg-[#A273F2] text-[#FAFAFA] border border-[#FAFAFA] font-bold text-xs font-mono transition-colors"
                >
                  Submit for On-Chain Voting →
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
