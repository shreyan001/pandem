"use client";

import { useState, useId } from "react";
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

  // Form State for Submit Proposal Modal
  const [formProductId, setFormProductId] = useState<string>("1");
  const [formTitle, setFormTitle] = useState<string>("");
  const [formRecipient, setFormRecipient] = useState<string>("");
  const [formAmount, setFormAmount] = useState<string>("0.05");
  const [formDescription, setFormDescription] = useState<string>("");
  const [formError, setFormError] = useState<string | null>(null);

  const selectedProductObj = AVAILABLE_PRODUCTS.find((p) => p.id === formProductId) || AVAILABLE_PRODUCTS[0];

  const handleVote = (proposalId: string, choice: "YES" | "NO") => {
    setUserVotes((prev) => {
      const existingVote = prev[proposalId];
      if (existingVote === choice) return prev; // already voted this way

      setProposals((propList) =>
        propList.map((p) => {
          if (p.id !== proposalId) return p;

          let newYes = p.yesVotesWeight;
          let newNo = p.noVotesWeight;

          if (existingVote === "YES") newYes -= 1.0;
          if (existingVote === "NO") newNo -= 1.0;

          if (choice === "YES") newYes += 1.0;
          if (choice === "NO") newNo += 1.0;

          return {
            ...p,
            yesVotesWeight: Math.round(newYes * 10) / 10,
            noVotesWeight: Math.round(newNo * 10) / 10,
            totalVoters: existingVote ? p.totalVoters : p.totalVoters + 1,
          };
        })
      );

      setVoteFeedback(`Vote recorded: ${choice} on ${proposalId}`);
      setTimeout(() => setVoteFeedback(null), 3000);

      return { ...prev, [proposalId]: choice };
    });
  };

  const handleSubmitProposal = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const amt = parseFloat(formAmount);
    if (isNaN(amt) || amt <= 0) {
      setFormError("Requested amount must be a positive number.");
      return;
    }

    if (amt > selectedProductObj.maxCap) {
      setFormError(
        `Requested amount (${amt} wNEAR) exceeds the 20% contingency pool limit (${selectedProductObj.maxCap} wNEAR) for this product.`
      );
      return;
    }

    if (!formTitle.trim()) {
      setFormError("Proposal title is required.");
      return;
    }

    if (!formRecipient.trim()) {
      setFormError("Target recipient account is required.");
      return;
    }

    const newProposal: ContingencyProposal = {
      id: `PROP-00${proposals.length + 1}`,
      productId: formProductId,
      productName: selectedProductObj.name,
      title: formTitle.trim(),
      description: formDescription.trim() || "Emergency infrastructure fix proposal.",
      targetRecipient: formRecipient.trim(),
      requestedAmountWNear: amt,
      maxAllowedWNear: selectedProductObj.maxCap,
      contingencyPoolTotal: selectedProductObj.maxCap * 5,
      status: "Active Voting",
      timeRemaining: "3d 00h 00m",
      yesVotesWeight: 1.0,
      noVotesWeight: 0.0,
      totalVoters: 1,
      quorumThresholdPct: 50,
      createdAt: new Date().toISOString().slice(0, 10),
    };

    setProposals([newProposal, ...proposals]);
    setIsSubmitModalOpen(false);
    setFormTitle("");
    setFormRecipient("");
    setFormDescription("");
    setVoteFeedback(`Proposal ${newProposal.id} successfully created and entered into voting!`);
    setTimeout(() => setVoteFeedback(null), 4000);
  };

  const filteredProposals = proposals.filter((p) => {
    if (filterStatus === "All") return true;
    return p.status === filterStatus;
  });

  return (
    <div className="space-y-8">
      {/* Top Banner & Governance Description */}
      <div className="rounded-3xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-pulse" />
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                WaterfallContingencyHub
              </span>
              <span className="text-xs font-mono text-zinc-500">20% Escrow Reserve</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Contingency Fix-Proposal Voting
            </h2>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              Every subscription continuously channels <strong>20.0% into the product contingency reserve</strong>. When unforeseen outages, security vulnerabilities, or failovers occur, stewards and subscribers vote on community fix proposals to disburse remediation funds without touching subscriber escrow.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              onClick={() => setIsSubmitModalOpen(true)}
              className="px-5 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs sm:text-sm font-mono transition-all shadow-lg shadow-purple-600/20 flex items-center justify-center gap-2"
            >
              <span>+ Submit Fix Proposal</span>
            </button>
          </div>
        </div>

        {/* Live Voting Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-zinc-800/80 text-xs font-mono">
          <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-850">
            <span className="text-zinc-500 block text-[11px]">Active Proposals:</span>
            <span className="text-white font-bold text-base mt-0.5 block">
              {proposals.filter((p) => p.status === "Active Voting").length}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-850">
            <span className="text-zinc-500 block text-[11px]">Contingency Buffer Cap:</span>
            <span className="text-purple-400 font-bold text-base mt-0.5 block">
              20.0% Max
            </span>
          </div>

          <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-850">
            <span className="text-zinc-500 block text-[11px]">Quorum Required:</span>
            <span className="text-emerald-400 font-bold text-base mt-0.5 block">
              ≥ 50% Participation
            </span>
          </div>

          <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-850">
            <span className="text-zinc-500 block text-[11px]">Voting Period:</span>
            <span className="text-cyan-400 font-bold text-base mt-0.5 block">
              72 Hours (3 Days)
            </span>
          </div>
        </div>
      </div>

      {/* Action Feedback Banner */}
      {voteFeedback && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono flex items-center gap-2 animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>{voteFeedback}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {["All", "Active Voting", "Passed", "Rejected"].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterStatus(tab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-colors shrink-0 ${
                filterStatus === tab
                  ? "bg-zinc-200 text-black font-bold shadow-sm"
                  : "bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <span className="text-xs font-mono text-zinc-500 hidden sm:inline">
          Showing {filteredProposals.length} Proposals
        </span>
      </div>

      {/* Proposal Cards Grid */}
      <div className="space-y-6">
        {filteredProposals.map((proposal) => {
          const totalVotes = proposal.yesVotesWeight + proposal.noVotesWeight;
          const yesPct = totalVotes > 0 ? Math.round((proposal.yesVotesWeight / totalVotes) * 100) : 0;
          const noPct = totalVotes > 0 ? 100 - yesPct : 0;
          const quorumCurrentPct = Math.min(100, Math.round((proposal.totalVoters / 30) * 100)); // normalized quorum
          const isQuorumReached = quorumCurrentPct >= proposal.quorumThresholdPct;
          const currentVote = userVotes[proposal.id];
          const isActive = proposal.status === "Active Voting";

          return (
            <div
              key={proposal.id}
              className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-6 sm:p-7 space-y-6 hover:border-zinc-700 transition-all shadow-lg"
            >
              {/* Proposal Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-zinc-800">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-zinc-400">
                      {proposal.id}
                    </span>
                    <span className="text-zinc-600">•</span>
                    <span className="text-xs font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                      Product #{proposal.productId}: {proposal.productName}
                    </span>
                    <span
                      className={`text-xs font-mono px-2.5 py-0.5 rounded-full border font-semibold flex items-center gap-1.5 ${
                        isActive
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                          : proposal.status === "Passed"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                          : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isActive
                            ? "bg-amber-400 animate-pulse"
                            : proposal.status === "Passed"
                            ? "bg-emerald-400"
                            : "bg-rose-400"
                        }`}
                      />
                      {proposal.status}
                    </span>
                  </div>

                  <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                    {proposal.title}
                  </h3>

                  <p className="text-xs text-zinc-300 leading-relaxed max-w-3xl">
                    {proposal.description}
                  </p>
                </div>

                {/* Amount Requested Badge */}
                <div className="text-right shrink-0 p-3 rounded-2xl bg-zinc-950 border border-zinc-800">
                  <span className="text-[10px] font-mono text-zinc-500 block uppercase">Requested Allocation</span>
                  <div className="text-lg font-mono font-extrabold text-white">
                    {proposal.requestedAmountWNear} <span className="text-xs font-normal text-zinc-400">wNEAR</span>
                  </div>
                  <span className="text-[10px] font-mono text-purple-400 block mt-0.5">
                    (Max: {proposal.maxAllowedWNear} wN cap)
                  </span>
                </div>
              </div>

              {/* Target & Time Information */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-850">
                  <span className="text-zinc-500 block text-[11px]">Disbursement Recipient:</span>
                  <span className="text-cyan-400 font-bold mt-0.5 block truncate">
                    {proposal.targetRecipient}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-850">
                  <span className="text-zinc-500 block text-[11px]">Voting Window:</span>
                  <span className={`font-bold mt-0.5 block ${isActive ? "text-amber-400" : "text-zinc-400"}`}>
                    {isActive ? `⏳ ${proposal.timeRemaining} remaining` : proposal.timeRemaining}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-850">
                  <span className="text-zinc-500 block text-[11px]">Total Participation:</span>
                  <span className="text-white font-bold mt-0.5 block">
                    {proposal.totalVoters} Subscribers ({totalVotes.toFixed(1)} wN voting weight)
                  </span>
                </div>
              </div>

              {/* Quorum & Approval Progress Bars */}
              <div className="space-y-4 p-4 rounded-2xl bg-zinc-950/80 border border-zinc-850">
                {/* 1. Approval Ratio Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                      <span>✓ Support (YES):</span>
                      <strong>{yesPct}%</strong>
                      <span className="text-zinc-500">({proposal.yesVotesWeight.toFixed(1)} wN)</span>
                    </span>
                    <span className="text-rose-400 font-semibold flex items-center gap-1.5">
                      <span>✕ Reject (NO):</span>
                      <strong>{noPct}%</strong>
                      <span className="text-zinc-500">({proposal.noVotesWeight.toFixed(1)} wN)</span>
                    </span>
                  </div>

                  {/* Dual Bar */}
                  <div className="h-3 w-full bg-zinc-900 rounded-full overflow-hidden flex border border-zinc-800">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                      style={{ width: `${yesPct}%` }}
                    />
                    <div
                      className="h-full bg-gradient-to-r from-rose-500 to-rose-600 transition-all duration-500"
                      style={{ width: `${noPct}%` }}
                    />
                  </div>
                </div>

                {/* 2. Quorum Threshold Bar */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-zinc-400 flex items-center gap-1.5">
                      <span>Quorum Progress:</span>
                      <strong className={isQuorumReached ? "text-emerald-400" : "text-amber-400"}>
                        {quorumCurrentPct}% / {proposal.quorumThresholdPct}% Required
                      </strong>
                    </span>
                    <span className={`text-[10px] px-2 py-0.2 rounded ${
                      isQuorumReached
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    }`}>
                      {isQuorumReached ? "Quorum Threshold Reached" : "Quorum Pending"}
                    </span>
                  </div>

                  <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-800 relative">
                    <div
                      className={`h-full transition-all duration-500 ${
                        isQuorumReached ? "bg-emerald-400" : "bg-amber-400"
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
                      <span className="flex items-center gap-2 text-white font-semibold">
                        <span>Your Current Vote:</span>
                        <span
                          className={`px-2.5 py-1 rounded-lg border font-bold ${
                            currentVote === "YES"
                              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                              : "bg-rose-500/20 text-rose-300 border-rose-500/40"
                          }`}
                        >
                          {currentVote === "YES" ? "✓ Voted YES (Support)" : "✕ Voted NO (Reject)"}
                        </span>
                      </span>
                    ) : (
                      <span className="text-zinc-400">
                        Cast your subscriber vote using your connected NEAR testnet wallet:
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleVote(proposal.id, "YES")}
                      className={`px-4 py-2 rounded-xl font-mono text-xs font-bold transition-all flex items-center gap-1.5 shadow-md ${
                        currentVote === "YES"
                          ? "bg-emerald-500 text-black shadow-emerald-500/20 scale-[1.02]"
                          : "bg-zinc-800 hover:bg-emerald-500/20 hover:text-emerald-400 hover:border-emerald-500/40 text-zinc-200 border border-zinc-700"
                      }`}
                    >
                      <span>✓ Vote YES (Support)</span>
                    </button>

                    <button
                      onClick={() => handleVote(proposal.id, "NO")}
                      className={`px-4 py-2 rounded-xl font-mono text-xs font-bold transition-all flex items-center gap-1.5 shadow-md ${
                        currentVote === "NO"
                          ? "bg-rose-600 text-white shadow-rose-600/20 scale-[1.02]"
                          : "bg-zinc-800 hover:bg-rose-500/20 hover:text-rose-400 hover:border-rose-500/40 text-zinc-200 border border-zinc-700"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <span>Submit Contingency Fix Proposal</span>
                </h3>
                <p className="text-xs text-zinc-400 font-mono mt-0.5">
                  Propose an emergency allocation from the 20% contingency pool.
                </p>
              </div>
              <button
                onClick={() => setIsSubmitModalOpen(false)}
                className="text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmitProposal} className="space-y-4 text-xs font-mono">
              {/* Product Select */}
              <div className="space-y-1.5">
                <label className="text-zinc-400 block font-semibold uppercase">
                  1. Target Product
                </label>
                <select
                  value={formProductId}
                  onChange={(e) => setFormProductId(e.target.value)}
                  className="w-full bg-black/80 border border-zinc-700 px-3.5 py-2.5 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-purple-500"
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
                <label className="text-zinc-400 block font-semibold uppercase">
                  2. Proposal Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Failover Worker Provisioning for Sentinel"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full bg-black/80 border border-zinc-700 px-3.5 py-2.5 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Target Recipient */}
              <div className="space-y-1.5">
                <label className="text-zinc-400 block font-semibold uppercase">
                  3. Target Recipient Testnet Account
                </label>
                <input
                  type="text"
                  placeholder="e.g. security-team.testnet"
                  value={formRecipient}
                  onChange={(e) => setFormRecipient(e.target.value)}
                  className="w-full bg-black/80 border border-zinc-700 px-3.5 py-2.5 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Requested Amount (with 20% limit check) */}
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <label className="text-zinc-400 font-semibold uppercase">
                    4. Requested Allocation (wNEAR)
                  </label>
                  <span className="text-purple-400">
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
                  className="w-full bg-black/80 border border-zinc-700 px-3.5 py-2.5 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Fix Description */}
              <div className="space-y-1.5">
                <label className="text-zinc-400 block font-semibold uppercase">
                  5. Technical Justification & Remediation Plan
                </label>
                <textarea
                  rows={3}
                  placeholder="Explain why this contingency allocation is necessary to restore heartbeat compliance..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full bg-black/80 border border-zinc-700 px-3.5 py-2 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-zinc-700 bg-zinc-800 text-zinc-300 font-medium text-xs hover:bg-zinc-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs font-mono transition-colors shadow-lg shadow-purple-600/20"
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
