"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Clock,
  Coins,
  Activity,
  ShieldAlert,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  Sliders,
  ExternalLink,
  Cpu,
  Lock,
  Scale,
  Terminal,
  AlertTriangle,
  Check,
  ChevronRight,
} from "lucide-react";
import { ENRICHED_PRODUCTS, EnrichedProduct } from "@pandem/shared";
import { AbstractLogo } from "../../../components/AbstractLogo";

interface PayoutTranche {
  id: number;
  label: string;
  periodRange: string;
  amountUsdc: string;
  status: "Released" | "Streaming" | "Locked";
  unlocksIn?: string;
  progressPct?: number;
}

interface RiskCorrectionProposal {
  id: string;
  title: string;
  reason: string;
  requestedReleasePct: string;
  forPct: number;
  againstPct: number;
  quorumPct: number;
  status: "Voting_Open" | "Passed" | "Rejected";
  hoursRemaining?: number;
}

export default function DeveloperDashboardPage() {
  const [selectedProduct, setSelectedProduct] = useState<EnrichedProduct>(ENRICHED_PRODUCTS[0]);
  const [isPingingHeartbeat, setIsPingingHeartbeat] = useState<boolean>(false);
  const [heartbeatStreak, setHeartbeatStreak] = useState<number>(selectedProduct.heartbeat_streak || 18);
  const [heartbeatSuccess, setHeartbeatSuccess] = useState<string | null>(null);

  // 7-Day Payout State
  const [isClaimingPayout, setIsClaimingPayout] = useState<boolean>(false);
  const [claimedSuccessTx, setClaimedSuccessTx] = useState<string | null>(null);
  const [claimableBalance, setClaimableBalance] = useState<number>(2375.0);

  // Risk Correction State
  const [riskProposals, setRiskProposals] = useState<RiskCorrectionProposal[]>([
    {
      id: "RC-04",
      title: "20% Partial Developer Fee Release during Enclave Migration",
      reason: "Scheduled 4-hour Intel TDX host hypervisor upgrade requiring subscriber consensus for partial period release.",
      requestedReleasePct: "20% ($475.00 USDC)",
      forPct: 74,
      againstPct: 26,
      quorumPct: 62,
      status: "Voting_Open",
      hoursRemaining: 42,
    },
    {
      id: "RC-03",
      title: "Memory Leak Patch Bounty Release ($450 USDC)",
      reason: "PostgreSQL pgvector query optimization patch verified by community steward.",
      requestedReleasePct: "100% Bounty ($450.00 USDC)",
      forPct: 92,
      againstPct: 8,
      quorumPct: 78,
      status: "Passed",
    },
  ]);

  const [isRiskModalOpen, setIsRiskModalOpen] = useState<boolean>(false);
  const [riskTitle, setRiskTitle] = useState<string>("");
  const [riskReason, setRiskReason] = useState<string>("");
  const [riskPct, setRiskPct] = useState<string>("20");

  const tranches: PayoutTranche[] = useMemo(() => [
    {
      id: 1,
      label: "Tranche 1",
      periodRange: "Days 1–7",
      amountUsdc: "$2,375.00",
      status: "Released",
    },
    {
      id: 2,
      label: "Tranche 2",
      periodRange: "Days 8–14",
      amountUsdc: "$2,375.00",
      status: "Streaming",
      unlocksIn: "3d 14h 22m",
      progressPct: 58,
    },
    {
      id: 3,
      label: "Tranche 3",
      periodRange: "Days 15–21",
      amountUsdc: "$2,375.00",
      status: "Locked",
    },
    {
      id: 4,
      label: "Tranche 4",
      periodRange: "Days 22–28",
      amountUsdc: "$2,375.00",
      status: "Locked",
    },
  ], []);

  const handleBroadcastHeartbeat = async () => {
    setIsPingingHeartbeat(true);
    setHeartbeatSuccess(null);
    try {
      await new Promise((r) => setTimeout(r, 1200));
      setHeartbeatStreak((prev) => prev + 1);
      setHeartbeatSuccess(`Heartbeat recorded on NEAR testnet. Streak incremented to ${heartbeatStreak + 1} periods.`);
      setTimeout(() => setHeartbeatSuccess(null), 4000);
    } finally {
      setIsPingingHeartbeat(false);
    }
  };

  const handleClaimPayout = async () => {
    if (claimableBalance <= 0) return;
    setIsClaimingPayout(true);
    setClaimedSuccessTx(null);
    try {
      await new Promise((r) => setTimeout(r, 1400));
      setClaimedSuccessTx("https://explorer.testnet.near.org/transactions/8wuEZcspAEVfTFgSJed9RvcE7jqdG1orCgoHBr4vDJZA");
      setClaimableBalance(0);
    } finally {
      setIsClaimingPayout(false);
    }
  };

  const handleCreateRiskProposal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!riskTitle.trim() || !riskReason.trim()) return;

    const newProposal: RiskCorrectionProposal = {
      id: `RC-0${riskProposals.length + 3}`,
      title: riskTitle.trim(),
      reason: riskReason.trim(),
      requestedReleasePct: `${riskPct}% Release`,
      forPct: 100,
      againstPct: 0,
      quorumPct: 12,
      status: "Voting_Open",
      hoursRemaining: 72,
    };

    setRiskProposals([newProposal, ...riskProposals]);
    setRiskTitle("");
    setRiskReason("");
    setIsRiskModalOpen(false);
  };

  return (
    <main className="min-h-screen bg-[#0D0D0D] text-[#FAFAFA] font-sans antialiased">
      {/* Top Header & Navigation */}
      <header className="border-b border-[#2E2E2E] bg-[#121212]/70 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-xs font-mono text-[#737373] hover:text-[#FAFAFA] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#894DEF]"
            >
              Leaderboard
            </Link>
            <span className="text-xs text-[#2E2E2E]">/</span>
            <span className="text-xs font-mono text-[#894DEF] font-medium">Developer Dashboard</span>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[#4ADE80] bg-[#4ADE80]/10 border border-[#4ADE80]/20">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4ADE80] animate-pulse" />
              NEAR Testnet Active
            </span>
            <Link
              href="/dev/onboarding"
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#894DEF] hover:bg-[#A273F2] text-white font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#894DEF]"
            >
              <span>Onboard New Product</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hub Header & Product Selector */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-[#2E2E2E] pb-6">
          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
              Developer Operations Hub
            </h1>
            <p className="text-sm text-[#B8B8B8] max-w-2xl font-mono">
              Monitor 7-day rolling payout tranches, broadcast cryptographic uptime heartbeats, and participate in community risk correction arbitration.
            </p>
          </div>

          {/* Product Switcher Bar */}
          <div className="flex items-center gap-2 overflow-x-auto font-mono text-xs">
            <span className="text-[#737373] text-[11px] shrink-0">Active Product:</span>
            {ENRICHED_PRODUCTS.slice(0, 4).map((p) => {
              const isSelected = selectedProduct.id === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedProduct(p)}
                  className={`flex items-center gap-2 px-3 py-1.5 border transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#894DEF] ${
                    isSelected
                      ? "bg-[#262626] border-[#894DEF] text-white"
                      : "bg-[#171717] border-[#2E2E2E] text-[#B8B8B8] hover:border-[#737373]"
                  }`}
                >
                  <AbstractLogo slug={p.slug} name={p.name} size={16} className="w-4 h-4" />
                  <span>{p.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Claim Tx Alert */}
        {claimedSuccessTx && (
          <div className="p-4 bg-[#14532D]/30 border border-[#166534] text-xs font-mono text-[#4ADE80] flex items-center justify-between">
            <span>Tranche payout claimed successfully. Funds transferred to your connected NEAR wallet.</span>
            <a
              href={claimedSuccessTx}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 underline hover:text-white"
            >
              <span>View NEAR Tx</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        {/* Heartbeat Success Alert */}
        {heartbeatSuccess && (
          <div className="p-4 bg-[#894DEF]/10 border border-[#894DEF]/40 text-xs font-mono text-[#894DEF] flex items-center justify-between">
            <span>{heartbeatSuccess}</span>
            <button
              onClick={() => setHeartbeatSuccess(null)}
              className="text-[#B8B8B8] hover:text-white"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* GRID OF 2 MAIN STATIONS: PAYOUT STREAM & HEARTBEAT TELEMETRY */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* STATION 1: 7-DAY ROLLING PAYOUT STREAM (7 COLS) */}
          <section className="lg:col-span-7 bg-[#171717] border border-[#2E2E2E] p-6 sm:p-8 space-y-6" aria-label="7-Day Rolling Payout Stream">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2E2E2E] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-[#894DEF]" />
                  <h2 className="text-base font-semibold text-white tracking-tight">
                    7-Day Rolling Payout Stream
                  </h2>
                </div>
                <p className="text-xs text-[#B8B8B8] font-mono mt-0.5">
                  Subscription escrow vests continuously across 7-day milestone tranches with D-14 clawback protection.
                </p>
              </div>

              <div className="text-left sm:text-right font-mono">
                <span className="text-[10px] text-[#737373] block uppercase">Available to Claim</span>
                <span className="text-lg font-bold text-[#4ADE80] tabular-nums">
                  ${claimableBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC
                </span>
              </div>
            </div>

            {/* Tranches Grid */}
            <div className="space-y-3 font-mono text-xs">
              {tranches.map((t) => (
                <div
                  key={t.id}
                  className="p-4 bg-[#0D0D0D] border border-[#2E2E2E] space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">{t.label}</span>
                      <span className="text-[11px] text-[#737373]">({t.periodRange})</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 border ${
                          t.status === "Released"
                            ? "bg-[#14532D]/40 border-[#166534] text-[#4ADE80]"
                            : t.status === "Streaming"
                            ? "bg-[#894DEF]/20 border-[#894DEF] text-[#894DEF]"
                            : "bg-[#262626] border-[#2E2E2E] text-[#737373]"
                        }`}
                      >
                        {t.status}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="font-semibold text-white tabular-nums">{t.amountUsdc}</span>
                    </div>
                  </div>

                  {t.status === "Streaming" && t.unlocksIn && (
                    <div className="space-y-1 pt-1 border-t border-[#2E2E2E]">
                      <div className="flex justify-between text-[11px] text-[#737373]">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#894DEF]" />
                          <span>Unlocks in {t.unlocksIn}</span>
                        </span>
                        <span className="tabular-nums">{t.progressPct}% Vested</span>
                      </div>
                      <div className="h-1.5 w-full bg-[#171717] overflow-hidden">
                        <div
                          className="h-full bg-[#894DEF]"
                          style={{ width: `${t.progressPct}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Claim Action Bar */}
            <div className="p-4 bg-[#0D0D0D] border border-[#2E2E2E] flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono text-xs">
              <div className="space-y-0.5">
                <span className="text-white font-medium block">Non-Custodial Claim Station</span>
                <span className="text-[11px] text-[#737373] block">
                  Contract: escrow.{selectedProduct.slug}.testnet
                </span>
              </div>

              <button
                type="button"
                onClick={handleClaimPayout}
                disabled={claimableBalance <= 0 || isClaimingPayout}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[#894DEF] hover:bg-[#A273F2] disabled:opacity-50 text-white font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#894DEF]"
              >
                {isClaimingPayout ? (
                  <span>Claiming from Escrow...</span>
                ) : (
                  <>
                    <span>Claim Unlocked Payout (${claimableBalance.toFixed(0)} USDC)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </section>

          {/* STATION 2: HEARTBEAT & UPTIME STATION (5 COLS) */}
          <section className="lg:col-span-5 bg-[#171717] border border-[#2E2E2E] p-6 sm:p-8 space-y-6" aria-label="Heartbeat and Uptime Station">
            <div className="border-b border-[#2E2E2E] pb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#4ADE80]" />
                <h2 className="text-base font-semibold text-white tracking-tight">
                  Heartbeat & Uptime Station
                </h2>
              </div>
              <p className="text-xs text-[#B8B8B8] font-mono mt-0.5">
                Cryptographic liveness proofs verify hardware enclave uptime to sustain continuous escrow streaming.
              </p>
            </div>

            {/* Streak & Status Meter */}
            <div className="p-4 bg-[#0D0D0D] border border-[#2E2E2E] space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#737373] uppercase">Active Liveness Streak</span>
                <span className="text-xs text-[#4ADE80] font-medium flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4ADE80] animate-pulse" />
                  Verified Online
                </span>
              </div>

              <div className="text-3xl font-bold text-white tabular-nums">
                {heartbeatStreak} <span className="text-xs font-normal text-[#737373]">Periods</span>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-[#2E2E2E] text-[11px] text-[#B8B8B8]">
                <div className="flex justify-between">
                  <span className="text-[#737373]">Hardware Target:</span>
                  <span className="text-white">{selectedProduct.tee_hardware}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#737373]">Enclave Model:</span>
                  <span className="text-white truncate max-w-[150px]">{selectedProduct.tee_model}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#737373]">Last Attestation:</span>
                  <span className="text-[#4ADE80]">Valid Intel TDX Quote</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#737373]">Telemetry Latency:</span>
                  <span className="text-white tabular-nums">&lt; 1.5ms overhead</span>
                </div>
              </div>
            </div>

            {/* Broadcast Heartbeat Action */}
            <div className="space-y-2 font-mono text-xs">
              <button
                type="button"
                onClick={handleBroadcastHeartbeat}
                disabled={isPingingHeartbeat}
                className="w-full inline-flex items-center justify-center gap-2 py-3 bg-[#262626] hover:bg-[#2E2E2E] border border-[#2E2E2E] text-white font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#894DEF]"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[#894DEF] ${isPingingHeartbeat ? "animate-spin" : ""}`} />
                <span>{isPingingHeartbeat ? "Broadcasting to NEAR..." : "Broadcast Cryptographic Heartbeat"}</span>
              </button>
              <p className="text-[10px] text-[#737373] text-center">
                Signs and dispatches an on-chain heartbeat transaction to escrow.{selectedProduct.slug}.testnet.
              </p>
            </div>
          </section>
        </div>

        {/* PANEL 3: RISK CORRECTION & COMMUNITY VOTING PANEL */}
        <section className="bg-[#171717] border border-[#2E2E2E] p-6 sm:p-8 space-y-6" aria-label="Risk Correction and Community Voting">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2E2E2E] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#FBBF24]" />
                <h2 className="text-base font-semibold text-white tracking-tight">
                  Risk Correction & Community Voting Panel
                </h2>
              </div>
              <p className="text-xs text-[#B8B8B8] font-mono mt-0.5">
                Arbitrate maintenance downtime and dispute releases through subscriber request-token consensus.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsRiskModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#262626] hover:bg-[#2E2E2E] border border-[#2E2E2E] text-white text-xs font-mono font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#894DEF]"
            >
              <Scale className="w-3.5 h-3.5 text-[#894DEF]" />
              <span>Submit Risk Correction Proposal</span>
            </button>
          </div>

          {/* Proposals List */}
          <div className="space-y-3 font-mono text-xs">
            {riskProposals.map((prop) => (
              <div
                key={prop.id}
                className="p-5 bg-[#0D0D0D] border border-[#2E2E2E] space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[#894DEF] font-bold">#{prop.id}</span>
                      <span className="text-white font-medium">{prop.title}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 border ${
                          prop.status === "Voting_Open"
                            ? "bg-[#FBBF24]/10 border-[#FBBF24]/40 text-[#FBBF24]"
                            : "bg-[#14532D]/40 border-[#166534] text-[#4ADE80]"
                        }`}
                      >
                        {prop.status === "Voting_Open" ? `Voting Open (${prop.hoursRemaining}h remaining)` : "Passed & Executed"}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#B8B8B8] leading-relaxed max-w-3xl">
                      {prop.reason}
                    </p>
                  </div>

                  <div className="text-left sm:text-right shrink-0">
                    <span className="text-[10px] text-[#737373] block uppercase">Requested Allocation</span>
                    <span className="text-white font-semibold">{prop.requestedReleasePct}</span>
                  </div>
                </div>

                {/* Vote Tally Bar */}
                <div className="space-y-1.5 pt-2 border-t border-[#2E2E2E] text-[11px]">
                  <div className="flex justify-between text-[#737373] tabular-nums">
                    <span>Vote Outcome: {prop.forPct}% In Favor · {prop.againstPct}% Against</span>
                    <span>Quorum: {prop.quorumPct}% (50% Required)</span>
                  </div>
                  <div className="h-2 w-full bg-[#171717] overflow-hidden flex">
                    <div className="h-full bg-[#4ADE80]" style={{ width: `${prop.forPct}%` }} title="In Favor" />
                    <div className="h-full bg-[#EF4444]" style={{ width: `${prop.againstPct}%` }} title="Against" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* MODAL: SUBMIT RISK CORRECTION PROPOSAL */}
        {isRiskModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="risk-modal-title">
            <div className="bg-[#171717] border border-[#2E2E2E] max-w-xl w-full p-6 sm:p-8 space-y-6 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-[#2E2E2E] pb-3">
                <h3 id="risk-modal-title" className="text-sm font-semibold text-white tracking-tight">
                  Submit Risk Correction Proposal
                </h3>
                <button
                  type="button"
                  onClick={() => setIsRiskModalOpen(false)}
                  className="text-[#737373] hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#894DEF]"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateRiskProposal} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="risk-proposal-title" className="block text-[#B8B8B8]">Proposal Title</label>
                  <input
                    id="risk-proposal-title"
                    type="text"
                    required
                    value={riskTitle}
                    onChange={(e) => setRiskTitle(e.target.value)}
                    placeholder="e.g. 20% Partial Fee Release during CVM Host Migration"
                    className="w-full bg-[#0D0D0D] border border-[#2E2E2E] p-2.5 text-white text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#894DEF] focus-visible:border-[#894DEF]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="risk-proposal-reason" className="block text-[#B8B8B8]">Technical Incident & Rationale</label>
                  <textarea
                    id="risk-proposal-reason"
                    rows={4}
                    required
                    value={riskReason}
                    onChange={(e) => setRiskReason(e.target.value)}
                    placeholder="Document maintenance window, hardware attestation report status, and mitigation steps for subscribers..."
                    className="w-full bg-[#0D0D0D] border border-[#2E2E2E] p-2.5 text-white text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#894DEF] focus-visible:border-[#894DEF] resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="risk-percentage" className="block text-[#B8B8B8]">Requested Developer Fee Release (%)</label>
                  <select
                    id="risk-percentage"
                    value={riskPct}
                    onChange={(e) => setRiskPct(e.target.value)}
                    className="w-full bg-[#0D0D0D] border border-[#2E2E2E] p-2.5 text-white text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#894DEF] focus-visible:border-[#894DEF]"
                  >
                    <option value="10">10% Partial Period Release</option>
                    <option value="20">20% Partial Period Release</option>
                    <option value="30">30% Partial Period Release</option>
                    <option value="50">50% Maintenance Grace Period Release</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-[#2E2E2E]">
                  <button
                    type="button"
                    onClick={() => setIsRiskModalOpen(false)}
                    className="px-4 py-2 bg-[#262626] hover:bg-[#2E2E2E] text-white transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#894DEF]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#894DEF] hover:bg-[#A273F2] text-white font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#894DEF]"
                  >
                    Submit to Subscriber Voting
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
