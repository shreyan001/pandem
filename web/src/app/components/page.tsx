"use client";

import { useState } from "react";
import Link from "next/link";
import { SubscribeModal } from "../../components/SubscribeModal";
import { useNearWallet } from "../../context/NearWalletContext";
import { PANDEM_ESCROW_ID, PANDEM_TOKEN_ID, SPLIT_BPS } from "@pandem/shared";

export default function ComponentTestbedPage() {
  const { accountId, isConnected, connect, disconnect, tokenBalance, isStorageRegistered, setManualAccount } = useNearWallet();

  // Button interactive states
  const [primaryLoading, setPrimaryLoading] = useState(false);
  const [destructiveLoading, setDestructiveLoading] = useState(false);
  const [warningLoading, setWarningLoading] = useState(false);
  const [actionLog, setActionLog] = useState<string[]>([
    "Testbed initialized · Ready for component stress testing",
  ]);

  const logAction = (msg: string) => {
    setActionLog((prev) => [
      `[${new Date().toLocaleTimeString()}] ${msg}`,
      ...prev.slice(0, 7),
    ]);
  };

  // Metric Split interactive state (in wNEAR)
  const [splitAmountInput, setSplitAmountInput] = useState<string>("10.0");
  const parsedAmount = parseFloat(splitAmountInput) || 0;
  const splitSteward = (parsedAmount * 0.475).toFixed(4);
  const splitOps = (parsedAmount * 0.30).toFixed(4);
  const splitContingency = (parsedAmount * 0.20).toFixed(4);
  const splitFee = (parsedAmount * 0.025).toFixed(4);

  // Progress Bar interactive slider state
  const [progressVal, setProgressVal] = useState<number>(66);

  // Modals state
  const [isSubscribeModalOpen, setIsSubscribeModalOpen] = useState(false);
  const [isKillswitchModalOpen, setIsKillswitchModalOpen] = useState(false);
  const [killswitchReason, setKillswitchReason] = useState("Component testbed simulation shutdown");
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);

  // Banner dismissible state
  const [showSuccessBanner, setShowSuccessBanner] = useState(true);
  const [showWarningBanner, setShowWarningBanner] = useState(true);
  const [showDestructiveBanner, setShowDestructiveBanner] = useState(true);
  const [showTeeProof, setShowTeeProof] = useState(true);
  const [expandRawProof, setExpandRawProof] = useState(false);

  // Custom dev account input
  const [customDevInput, setCustomDevInput] = useState("");

  const sampleProduct = {
    id: "1",
    name: "Pandem Confidential Analytics",
    price_per_period: "100000000000000000000000", // 0.1 wNEAR
    period_display: "24 Hours",
    grace_display: "48 Hours",
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Testbed Header */}
      <section className="border-b border-zinc-800 pb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-none bg-[#894DEF] animate-ping" />
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Design System & Component Testbed
              </h1>
              <span className="px-2.5 py-0.5 rounded-none text-xs font-mono bg-[#262626] text-[#894DEF] border border-[#2E2E2E] font-semibold">
                v1.0 Baseline
              </span>
            </div>
            <p className="text-sm text-zinc-400 mt-2 max-w-3xl">
              Interactive testbed for every atomic UI element, button state, metric card, progress bar, alert banner,
              and modal in the Pandem protocol. Built on strict dark tokens (<code className="text-zinc-200">bg-black</code>,{" "}
              <code className="text-zinc-200">border-[#2E2E2E]</code>, <code className="text-[#894DEF]">#894DEF</code> accents).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href="#buttons"
              className="px-2.5 py-1 rounded-none bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors"
            >
              #buttons
            </a>
            <a
              href="#badges"
              className="px-2.5 py-1 rounded-none bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors"
            >
              #badges
            </a>
            <a
              href="#metrics"
              className="px-2.5 py-1 rounded-none bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors"
            >
              #metrics
            </a>
            <a
              href="#progress"
              className="px-2.5 py-1 rounded-none bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors"
            >
              #progress
            </a>
            <a
              href="#alerts"
              className="px-2.5 py-1 rounded-none bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors"
            >
              #alerts
            </a>
            <a
              href="#modals"
              className="px-2.5 py-1 rounded-none bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors"
            >
              #modals
            </a>
            <a
              href="#wallet"
              className="px-2.5 py-1 rounded-none bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors"
            >
              #wallet
            </a>
          </div>
        </div>

        {/* Live Interaction Log */}
        <div className="mt-6 p-3 rounded-none bg-zinc-950 border border-zinc-850 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
            <span className="text-zinc-500">Live Log:</span>
            <span className="text-[#894DEF]">{actionLog[0]}</span>
          </div>
          <span className="text-zinc-600 text-[11px] shrink-0 ml-4 hidden sm:inline">
            {actionLog.length} events logged
          </span>
        </div>
      </section>

      {/* SECTION A: BUTTONS */}
      <section id="buttons" className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-none bg-[#894DEF]" />
            A. Action Buttons & States
          </h2>
          <p className="text-xs text-zinc-400 font-mono mt-1">
            Standard action primitives: Primary (Spectr Purple), Secondary (Zinc), Destructive (Rose killswitch), Warning (Amber refund).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Primary Spectr Purple */}
          <div className="rounded-none border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-[#894DEF] font-semibold uppercase">
                Primary (Spectr Purple)
              </span>
              <span className="text-[10px] font-mono text-zinc-500">Subscribe / Execute</span>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => logAction("Clicked Primary Spectr Purple (Enabled)")}
                className="w-full py-2.5 px-4 rounded-none bg-[#894DEF] hover:bg-[#A273F2] text-[#FAFAFA] border border-[#FAFAFA] font-semibold text-xs transition-all shadow-md shadow-none flex items-center justify-center gap-2"
              >
                <span>Subscribe via Escrow</span>
                <span className="font-mono text-xs">→</span>
              </button>

              <button
                disabled
                className="w-full py-2.5 px-4 rounded-none bg-[#894DEF]/40 text-black/60 font-semibold text-xs cursor-not-allowed"
              >
                Primary Disabled
              </button>

              <button
                onClick={() => {
                  setPrimaryLoading(!primaryLoading);
                  logAction(`Toggled Primary Loading state: ${!primaryLoading}`);
                }}
                className="w-full py-2 px-3 rounded-none border border-dashed border-zinc-700 bg-zinc-950 text-zinc-400 hover:text-white font-mono text-[11px] transition-colors"
              >
                {primaryLoading ? "Stop Loading" : "Simulate Loading"}
              </button>

              {primaryLoading && (
                <button
                  disabled
                  className="w-full py-2.5 px-4 rounded-none bg-[#894DEF] text-black font-semibold text-xs flex items-center justify-center gap-2 cursor-wait"
                >
                  <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-none animate-spin" />
                  <span>Submitting to NEAR...</span>
                </button>
              )}
            </div>
          </div>

          {/* Secondary Zinc */}
          <div className="rounded-none border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-zinc-300 font-semibold uppercase">
                Secondary (Zinc)
              </span>
              <span className="text-[10px] font-mono text-zinc-500">Refresh / Nav</span>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => logAction("Clicked Secondary Zinc (Solid)")}
                className="w-full py-2.5 px-4 rounded-none bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium text-xs font-mono border border-zinc-700 transition-colors"
              >
                ↻ Refresh State
              </button>

              <button
                onClick={() => logAction("Clicked Secondary Zinc (Ghost/Outline)")}
                className="w-full py-2.5 px-4 rounded-none border border-zinc-800 bg-zinc-950/60 hover:bg-zinc-800/60 text-zinc-300 font-mono text-xs transition-colors"
              >
                View Transaction Log ↗
              </button>

              <button
                disabled
                className="w-full py-2.5 px-4 rounded-none border border-zinc-800 bg-zinc-900/40 text-zinc-600 font-mono text-xs cursor-not-allowed"
              >
                Secondary Disabled
              </button>
            </div>
          </div>

          {/* Destructive Rose */}
          <div className="rounded-none border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-rose-400 font-semibold uppercase">
                Destructive (Rose)
              </span>
              <span className="text-[10px] font-mono text-zinc-500">Killswitch</span>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => {
                  logAction("Clicked Destructive Rose (Killswitch Action)");
                  setIsKillswitchModalOpen(true);
                }}
                className="w-full py-2.5 px-4 rounded-none bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs font-mono transition-colors shadow-md shadow-rose-600/20 flex items-center justify-center gap-1.5"
              >
                <span>Pull Killswitch ⚠</span>
              </button>

              <button
                onClick={() => {
                  setDestructiveLoading(!destructiveLoading);
                  logAction(`Toggled Destructive Loading: ${!destructiveLoading}`);
                }}
                className="w-full py-2 px-3 rounded-none border border-dashed border-rose-900/50 bg-zinc-950 text-rose-400 hover:text-rose-300 font-mono text-[11px] transition-colors"
              >
                {destructiveLoading ? "Reset Loading" : "Simulate Abort..."}
              </button>

              {destructiveLoading && (
                <button
                  disabled
                  className="w-full py-2.5 px-4 rounded-none bg-rose-600/80 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-wait font-mono"
                >
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-none animate-spin" />
                  <span>Terminating Product...</span>
                </button>
              )}
            </div>
          </div>

          {/* Warning Amber */}
          <div className="rounded-none border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-amber-400 font-semibold uppercase">
                Warning (Amber)
              </span>
              <span className="text-[10px] font-mono text-zinc-500">Refund / Storage</span>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => {
                  logAction("Clicked Warning Amber (Claim Refund)");
                  setIsRefundModalOpen(true);
                }}
                className="w-full py-2.5 px-4 rounded-none bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs font-mono transition-colors shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5"
              >
                <span>Claim Refund (Pro-Rata)</span>
              </button>

              <button
                onClick={() => {
                  setWarningLoading(!warningLoading);
                  logAction(`Toggled Warning Loading: ${!warningLoading}`);
                }}
                className="w-full py-2 px-3 rounded-none border border-dashed border-amber-900/50 bg-zinc-950 text-amber-400 hover:text-amber-300 font-mono text-[11px] transition-colors"
              >
                {warningLoading ? "Reset Loading" : "Simulate Deposit..."}
              </button>

              {warningLoading && (
                <button
                  disabled
                  className="w-full py-2.5 px-4 rounded-none bg-amber-500 text-black font-semibold text-xs flex items-center justify-center gap-2 cursor-wait font-mono"
                >
                  <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-none animate-spin" />
                  <span>Depositing 0.0125 NEAR...</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION B: STATUS BADGES */}
      <section id="badges" className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-none bg-cyan-400" />
            B. Status Badges & Indicators
          </h2>
          <p className="text-xs text-zinc-400 font-mono mt-1">
            Status representations indicating on-chain escrow states, contract verification, and TEE confidential attestation.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Active Badge */}
          <div className="rounded-none border border-zinc-800 bg-zinc-900/50 p-4 space-y-3">
            <div className="text-[11px] font-mono text-zinc-400">Escrow State: Active</div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono px-3 py-1 rounded-none bg-[#262626] text-[#894DEF] border border-[#2E2E2E] font-semibold flex items-center gap-1.5 shadow-sm shadow-none">
                <span className="w-2 h-2 rounded-none bg-[#894DEF] animate-pulse" />
                Active
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 font-mono">
              Liveness verified. Heartbeats advancing normally.
            </p>
          </div>

          {/* Abandoned Badge */}
          <div className="rounded-none border border-zinc-800 bg-zinc-900/50 p-4 space-y-3">
            <div className="text-[11px] font-mono text-zinc-400">Escrow State: Terminated</div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono px-3 py-1 rounded-none bg-rose-500/10 text-rose-400 border border-rose-500/30 font-semibold flex items-center gap-1.5 shadow-sm shadow-rose-500/10">
                <span className="w-2 h-2 rounded-none bg-rose-400" />
                Abandoned
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 font-mono">
              Killswitch pulled. Unreleased periods claimable.
            </p>
          </div>

          {/* Pending Badge */}
          <div className="rounded-none border border-zinc-800 bg-zinc-900/50 p-4 space-y-3">
            <div className="text-[11px] font-mono text-zinc-400">Liveness: Grace Window</div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono px-3 py-1 rounded-none bg-amber-500/10 text-amber-400 border border-amber-500/30 font-semibold flex items-center gap-1.5 shadow-sm shadow-amber-500/10">
                <span className="w-2 h-2 rounded-none bg-amber-400 animate-pulse" />
                Pending Heartbeat
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 font-mono">
              Within 48h grace. Waiting for runner check-in.
            </p>
          </div>

          {/* TEE Hardware Verified */}
          <div className="rounded-none border border-zinc-800 bg-zinc-900/50 p-4 space-y-3">
            <div className="text-[11px] font-mono text-zinc-400">Hardware Attestation</div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono px-3 py-1 rounded-none bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-semibold flex items-center gap-1.5 shadow-sm shadow-cyan-500/10">
                <span className="text-[11px]">⛉</span>
                TEE Verified
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 font-mono">
              Intel TDX + NVIDIA H100 confidential enclave verified.
            </p>
          </div>

          {/* Testnet Escrow Badge */}
          <div className="rounded-none border border-zinc-800 bg-zinc-900/50 p-4 space-y-3">
            <div className="text-[11px] font-mono text-zinc-400">Network Scope</div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono px-3 py-1 rounded-none bg-zinc-800 text-zinc-300 border border-zinc-700 font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-none bg-[#894DEF]" />
                Testnet Escrow
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 font-mono">
              Non-custodial NEAR Rust contract at {PANDEM_ESCROW_ID.slice(0, 10)}...
            </p>
          </div>
        </div>
      </section>

      {/* SECTION C: STAT / METRIC CARDS */}
      <section id="metrics" className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-none bg-purple-400" />
            C. Stat / Metric Cards & Split Calculator
          </h2>
          <p className="text-xs text-zinc-400 font-mono mt-1">
            Display metrics for locked escrow, operational reserve (30%), contingency reserve (20%), and interactive four-way split calculation.
          </p>
        </div>

        {/* 4 Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-none bg-zinc-900/60 border border-zinc-800 space-y-2">
            <div className="text-xs font-mono text-zinc-400 flex items-center justify-between">
              <span>Total Escrow Locked</span>
              <span className="text-[#894DEF] font-bold">● Live</span>
            </div>
            <div className="text-2xl font-extrabold text-white font-mono tracking-tight">
              142.5000 <span className="text-xs font-normal text-zinc-400">wNEAR</span>
            </div>
            <div className="text-[11px] text-zinc-500 font-mono">
              6 agreements active · Zero custody leak
            </div>
          </div>

          <div className="p-5 rounded-none bg-zinc-900/60 border border-zinc-800 space-y-2">
            <div className="text-xs font-mono text-cyan-400 flex items-center justify-between">
              <span>Ops Reserve (30.0%)</span>
              <span className="text-zinc-500 text-[10px]">PANDEM SPLIT</span>
            </div>
            <div className="text-2xl font-extrabold text-cyan-400 font-mono tracking-tight">
              42.7500 <span className="text-xs font-normal text-zinc-400">wNEAR</span>
            </div>
            <div className="text-[11px] text-zinc-500 font-mono">
              Earmarked for hosting, runner compute & APIs
            </div>
          </div>

          <div className="p-5 rounded-none bg-zinc-900/60 border border-zinc-800 space-y-2">
            <div className="text-xs font-mono text-purple-400 flex items-center justify-between">
              <span>Contingency Pool (20.0%)</span>
              <span className="text-zinc-500 text-[10px]">REFUND BUFFER</span>
            </div>
            <div className="text-2xl font-extrabold text-purple-400 font-mono tracking-tight">
              28.5000 <span className="text-xs font-normal text-zinc-400">wNEAR</span>
            </div>
            <div className="text-[11px] text-zinc-500 font-mono">
              Pro-rata returned to subscribers on killswitch
            </div>
          </div>

          <div className="p-5 rounded-none bg-zinc-900/60 border border-zinc-800 space-y-2">
            <div className="text-xs font-mono text-amber-400 flex items-center justify-between">
              <span>Verified Heartbeat</span>
              <span className="text-[#894DEF] text-[10px]">SYNCED</span>
            </div>
            <div className="text-2xl font-extrabold text-white font-mono tracking-tight">
              Period #4 <span className="text-xs font-normal text-zinc-400">/ 24h</span>
            </div>
            <div className="text-[11px] text-zinc-500 font-mono">
              Signed by {PANDEM_ESCROW_ID.slice(0, 10)}... (TEE key)
            </div>
          </div>
        </div>

        {/* Interactive Split Formula Calculator Card */}
        <div className="rounded-none border border-zinc-800 bg-zinc-950/80 p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-850">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Four-Way Split Formula Calculator</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-none bg-[#262626] text-[#894DEF] border border-[#2E2E2E]">
                  Exact Math
                </span>
              </h3>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">
                Stillworks rule: 47.5% Steward, 30.0% Ops, 20.0% Contingency, 2.5% Treasury. Zero rounding leak.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-zinc-400">Input Deposit:</span>
              <div className="relative">
                <input
                  type="number"
                  step="0.5"
                  min="0.1"
                  value={splitAmountInput}
                  onChange={(e) => setSplitAmountInput(e.target.value)}
                  className="bg-black/80 border border-zinc-700 px-3 py-1.5 rounded-none text-white font-mono text-xs w-32 focus:outline-none focus:border-[#894DEF]"
                />
                <span className="absolute right-2.5 top-1.5 text-xs text-zinc-500 font-mono">wNEAR</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs font-mono">
            <div className="p-3.5 rounded-none bg-zinc-900 border border-zinc-800">
              <div className="text-zinc-400 flex justify-between">
                <span>Steward Payout</span>
                <span className="text-white font-bold">47.5%</span>
              </div>
              <div className="text-lg font-bold text-white mt-1">
                {splitSteward} <span className="text-xs font-normal text-zinc-500">wNEAR</span>
              </div>
            </div>

            <div className="p-3.5 rounded-none bg-zinc-900 border border-zinc-800">
              <div className="text-zinc-400 flex justify-between">
                <span>Ops Reserve</span>
                <span className="text-cyan-400 font-bold">30.0%</span>
              </div>
              <div className="text-lg font-bold text-cyan-400 mt-1">
                {splitOps} <span className="text-xs font-normal text-zinc-500">wNEAR</span>
              </div>
            </div>

            <div className="p-3.5 rounded-none bg-zinc-900 border border-zinc-800">
              <div className="text-zinc-400 flex justify-between">
                <span>Contingency Reserve</span>
                <span className="text-purple-400 font-bold">20.0%</span>
              </div>
              <div className="text-lg font-bold text-purple-400 mt-1">
                {splitContingency} <span className="text-xs font-normal text-zinc-500">wNEAR</span>
              </div>
            </div>

            <div className="p-3.5 rounded-none bg-zinc-900 border border-zinc-800">
              <div className="text-zinc-400 flex justify-between">
                <span>Protocol Treasury</span>
                <span className="text-[#894DEF] font-bold">2.5%</span>
              </div>
              <div className="text-lg font-bold text-[#894DEF] mt-1">
                {splitFee} <span className="text-xs font-normal text-zinc-500">wNEAR</span>
              </div>
            </div>
          </div>

          <div className="text-[11px] font-mono text-zinc-500 flex items-center justify-between">
            <span>Formula check: 47.5% + 30.0% + 20.0% + 2.5% = 100.00%</span>
            <span className="text-[#894DEF]">Sum: {parsedAmount.toFixed(4)} wNEAR (Balanced)</span>
          </div>
        </div>
      </section>

      {/* SECTION D: PROGRESS BARS */}
      <section id="progress" className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-none bg-teal-400" />
            D. Progress Bars & Period Releases
          </h2>
          <p className="text-xs text-zinc-400 font-mono mt-1">
            Visual representations of pre-funded period releases (0%, 33%, 66%, 100%) and interactive release scrubbing.
          </p>
        </div>

        <div className="rounded-none border border-zinc-800 bg-zinc-900/60 p-6 space-y-6">
          {/* Preset Demonstrations */}
          <div className="space-y-5">
            <div>
              <div className="flex justify-between text-xs font-mono mb-1.5">
                <span className="text-zinc-300">0% Released (Initial Escrow Deposit)</span>
                <span className="text-zinc-500">0 / 3 Periods Released</span>
              </div>
              <div className="h-3 w-full bg-zinc-950 rounded-none overflow-hidden border border-zinc-800">
                <div className="h-full bg-[#894DEF] rounded-none transition-all duration-500" style={{ width: "0%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono mb-1.5">
                <span className="text-zinc-300">33.3% Released (1 Period Heartbeat Verified)</span>
                <span className="text-[#894DEF] font-bold">1 / 3 Periods Released</span>
              </div>
              <div className="h-3 w-full bg-zinc-950 rounded-none overflow-hidden border border-zinc-800">
                <div className="h-full bg-[#171717]" style={{ width: "33.33%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono mb-1.5">
                <span className="text-zinc-300">66.6% Released (2 Periods Heartbeat Verified)</span>
                <span className="text-[#894DEF] font-bold">2 / 3 Periods Released</span>
              </div>
              <div className="h-3 w-full bg-zinc-950 rounded-none overflow-hidden border border-zinc-800">
                <div className="h-full bg-[#171717]" style={{ width: "66.66%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono mb-1.5">
                <span className="text-zinc-300">100% Completed (All Periods Fully Released)</span>
                <span className="text-[#894DEF] font-bold">3 / 3 Periods Released</span>
              </div>
              <div className="h-3 w-full bg-zinc-950 rounded-none overflow-hidden border border-zinc-800">
                <div className="h-full bg-[#894DEF] rounded-none transition-all duration-500" style={{ width: "100%" }} />
              </div>
            </div>
          </div>

          {/* Interactive Scrub Bar */}
          <div className="pt-6 border-t border-zinc-800 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-white font-bold">Interactive Release Simulator:</span>
              <span className="text-[#894DEF] font-bold">{progressVal}% Released</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={progressVal}
              onChange={(e) => setProgressVal(Number(e.target.value))}
              className="w-full accent-[#894DEF] cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-zinc-500 font-mono">
              <span>0% (Full Refundable Balance)</span>
              <span>50%</span>
              <span>100% (Fully Settled)</span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION E: ALERTS / BANNERS */}
      <section id="alerts" className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-none bg-amber-400" />
            E. Alerts, Banners & TEE Attestation Proof Card
          </h2>
          <p className="text-xs text-zinc-400 font-mono mt-1">
            System notices, on-chain confirmation banners, storage alerts, and cryptographic enclave attestation evidence.
          </p>
        </div>

        <div className="space-y-4">
          {/* Success Banner */}
          {showSuccessBanner && (
            <div className="p-4 rounded-none bg-[#262626] border border-[#2E2E2E] text-[#894DEF] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg shadow-none">
              <div className="space-y-1">
                <div className="flex items-center gap-2 font-semibold text-sm">
                  <span className="w-2 h-2 rounded-none bg-[#894DEF] animate-ping" />
                  <span>Subscription Confirmed on Testnet!</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-none bg-[#262626] text-[#FAFAFA] font-mono">
                    FINALIZED
                  </span>
                </div>
                <p className="text-xs text-zinc-300 font-mono break-all">
                  Tx: 4uKq8mP17vXeG2n9RtW3yZbJ8oLaMqSdFxC4vKp2n9Re
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href="https://explorer.testnet.near.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs bg-[#894DEF] hover:bg-[#A273F2] text-[#FAFAFA] border border-[#FAFAFA] font-semibold px-3 py-1.5 rounded-none transition-colors font-mono"
                >
                  View on Explorer →
                </a>
                <button
                  onClick={() => setShowSuccessBanner(false)}
                  className="text-xs text-zinc-400 hover:text-white px-2 py-1 rounded-none"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {/* Warning Banner */}
          {showWarningBanner && (
            <div className="p-4 rounded-none bg-amber-500/10 border border-amber-500/30 text-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 font-semibold text-sm">
                  <span>⚠</span>
                  <span>Token Storage Deposit Required</span>
                </div>
                <div className="text-xs text-zinc-300 mt-1 font-mono">
                  Account needs a 0.0125 NEAR storage registration on {PANDEM_TOKEN_ID} to receive NEP-141 transfers or refunds.
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => logAction("Simulated Storage Deposit Executed")}
                  className="px-3 py-1.5 rounded-none bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs font-mono transition-colors"
                >
                  Deposit 0.0125 NEAR
                </button>
                <button
                  onClick={() => setShowWarningBanner(false)}
                  className="text-xs text-zinc-400 hover:text-white px-2 py-1 rounded-none"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {/* Destructive Banner */}
          {showDestructiveBanner && (
            <div className="p-4 rounded-none bg-rose-500/10 border border-rose-500/30 text-rose-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 font-semibold text-sm text-rose-400">
                  <span>🛑</span>
                  <span>Emergency Killswitch Active: Product Terminated</span>
                </div>
                <p className="text-xs text-zinc-300 mt-1 font-mono">
                  Product #1 was declared abandoned on-chain. Heartbeats are locked and subscriber refunds are open.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href="/me"
                  className="px-3 py-1.5 rounded-none bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs font-mono transition-colors shadow-md shadow-rose-600/20"
                >
                  Claim My Refund →
                </Link>
                <button
                  onClick={() => setShowDestructiveBanner(false)}
                  className="text-xs text-zinc-400 hover:text-white px-2 py-1 rounded-none"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {/* TEE Attestation Proof Card */}
          {showTeeProof && (
            <div className="rounded-none border border-zinc-800 bg-zinc-950/90 p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-zinc-850 gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-none bg-cyan-400 animate-pulse" />
                  <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                    TEE Hardware Enclave Attestation Proof
                    <span className="text-[10px] px-2 py-0.5 rounded-none bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      INTEL TDX + NVIDIA NRAS
                    </span>
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-zinc-500">
                  Provider: NEAR AI Cloud (owned_by: nearai)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-3 rounded-none bg-zinc-900 border border-zinc-800">
                  <span className="text-zinc-500 block text-[11px]">Hardware Enclave:</span>
                  <span className="text-white font-bold mt-0.5 block">NVIDIA H100 SXM5 80GB</span>
                  <span className="text-[10px] text-zinc-400">Intel Xeon TDX Enclave</span>
                </div>

                <div className="p-3 rounded-none bg-zinc-900 border border-zinc-800">
                  <span className="text-zinc-500 block text-[11px]">Signing Key:</span>
                  <span className="text-cyan-400 font-bold mt-0.5 block truncate">
                    ed25519:6s9Gk2xQpL7n...
                  </span>
                  <span className="text-[10px] text-zinc-400">Curve Ed25519 Non-Custodial</span>
                </div>

                <div className="p-3 rounded-none bg-zinc-900 border border-zinc-800">
                  <span className="text-zinc-500 block text-[11px]">Cryptographic Nonce:</span>
                  <span className="text-[#894DEF] font-bold mt-0.5 block truncate">
                    0x8f3c7a21b4e99f02
                  </span>
                  <span className="text-[10px] text-zinc-400">Replay Protected</span>
                </div>

                <div className="p-3 rounded-none bg-zinc-900 border border-zinc-800">
                  <span className="text-zinc-500 block text-[11px]">Quote Status:</span>
                  <span className="text-[#894DEF] font-bold mt-0.5 block">
                    ✓ Hardware Attested
                  </span>
                  <span className="text-[10px] text-zinc-400">Verified by Intel Root CA</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  onClick={() => setExpandRawProof(!expandRawProof)}
                  className="text-xs font-mono text-zinc-400 hover:text-white transition-colors"
                >
                  {expandRawProof ? "▲ Hide Raw Quote" : "▼ Inspect Raw Remote Quote Payload"}
                </button>
                <button
                  onClick={() => logAction("Copied TEE Attestation Evidence to Clipboard")}
                  className="px-3 py-1 rounded-none bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-mono text-xs transition-colors"
                >
                  Copy Proof JSON
                </button>
              </div>

              {expandRawProof && (
                <div className="bg-black/90 p-3 rounded-none border border-zinc-800 font-mono text-[11px] text-zinc-400 overflow-x-auto space-y-1">
                  <div><span className="text-zinc-500">enclave_model:</span> meta-llama/Llama-3.3-70B-Instruct</div>
                  <div><span className="text-zinc-500">intel_tdx_quote:</span> 0400000000000000938472910fbc...</div>
                  <div><span className="text-zinc-500">nras_token:</span> eyJhbGciOiJSUzI1NiIsImtpZCI6Im52aWRpY...</div>
                  <div><span className="text-zinc-500">attestation_verified:</span> <span className="text-[#894DEF]">true</span></div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* SECTION F: INTERACTIVE MODALS */}
      <section id="modals" className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-none bg-blue-400" />
            F. Interactive Modal Triggers
          </h2>
          <p className="text-xs text-zinc-400 font-mono mt-1">
            Trigger live overlay modals with full reactive states: SubscribeModal (NEP-141 flow) and Killswitch Confirmation Modal.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-none border border-zinc-800 bg-zinc-900/60 p-6 space-y-4">
            <div className="text-sm font-bold text-white">SubscribeModal Flow</div>
            <p className="text-xs text-zinc-400">
              Opens the real non-custodial subscription modal, allowing period selection, split breakdown preview, and ft_transfer_call simulation.
            </p>
            <button
              onClick={() => {
                logAction("Opened SubscribeModal");
                setIsSubscribeModalOpen(true);
              }}
              className="w-full py-2.5 px-4 rounded-none bg-[#894DEF] hover:bg-[#A273F2] text-[#FAFAFA] border border-[#FAFAFA] font-semibold text-xs font-mono transition-colors shadow-md shadow-none"
            >
              Launch SubscribeModal
            </button>
          </div>

          <div className="rounded-none border border-zinc-800 bg-zinc-900/60 p-6 space-y-4">
            <div className="text-sm font-bold text-white">Steward Killswitch Modal</div>
            <p className="text-xs text-zinc-400">
              Opens the dangerous state confirmation dialog for stewards to terminate a product and lock on-chain heartbeats with a logged reason.
            </p>
            <button
              onClick={() => {
                logAction("Opened Killswitch Confirmation Modal");
                setIsKillswitchModalOpen(true);
              }}
              className="w-full py-2.5 px-4 rounded-none bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs font-mono transition-colors shadow-md shadow-rose-600/20"
            >
              Launch Killswitch Modal
            </button>
          </div>

          <div className="rounded-none border border-zinc-800 bg-zinc-900/60 p-6 space-y-4">
            <div className="text-sm font-bold text-white">Pro-Rata Refund Modal</div>
            <p className="text-xs text-zinc-400">
              Demonstrates subscriber refund calculations: unreleased periods refund plus proportional contingency reserve claim.
            </p>
            <button
              onClick={() => {
                logAction("Opened Refund Modal");
                setIsRefundModalOpen(true);
              }}
              className="w-full py-2.5 px-4 rounded-none bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs font-mono transition-colors shadow-md shadow-amber-500/20"
            >
              Launch Refund Modal
            </button>
          </div>
        </div>
      </section>

      {/* SECTION G: LIVE WALLET CARD */}
      <section id="wallet" className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-none bg-[#894DEF]" />
            G. Live Wallet Card & Account Switcher
          </h2>
          <p className="text-xs text-zinc-400 font-mono mt-1">
            Simulate and inspect NearConnector states, testnet faucet accounts, and token balances in real time.
          </p>
        </div>

        <div className="rounded-none border border-zinc-800 bg-zinc-900/60 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-850 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">Active Testnet Wallet</span>
                <span
                  className={`text-xs font-mono px-2 py-0.5 rounded-none border ${
                    isConnected
                      ? "bg-[#262626] text-[#894DEF] border-[#2E2E2E]"
                      : "bg-zinc-800 text-zinc-400 border-zinc-700"
                  }`}
                >
                  {isConnected ? "Connected" : "No Wallet Connected"}
                </span>
              </div>
              <div className="text-xs text-zinc-400 font-mono mt-1">
                Account ID: <span className="text-white font-bold">{accountId ?? "pandem-alice-8d6888e3.testnet"}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isConnected ? (
                <button
                  onClick={() => {
                    disconnect();
                    logAction("Disconnected Wallet");
                  }}
                  className="px-3 py-1.5 rounded-none bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-mono transition-colors border border-zinc-700"
                >
                  Sign Out
                </button>
              ) : (
                <button
                  onClick={() => {
                    connect();
                    logAction("Triggered Connect Wallet");
                  }}
                  className="px-4 py-1.5 rounded-none bg-[#894DEF] hover:bg-[#A273F2] text-[#FAFAFA] border border-[#FAFAFA] font-semibold text-xs font-mono transition-colors shadow-sm shadow-none"
                >
                  Connect Wallet
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
            <div className="p-4 rounded-none bg-zinc-950 border border-zinc-800">
              <span className="text-zinc-500 block text-[11px]">NEP-141 Token Balance:</span>
              <span className="text-lg font-bold text-[#894DEF] mt-1 block">
                {tokenBalance && tokenBalance !== "0" ? tokenBalance : "100.0000"} wNEAR
              </span>
              <span className="text-[10px] text-zinc-500">{PANDEM_TOKEN_ID}</span>
            </div>

            <div className="p-4 rounded-none bg-zinc-950 border border-zinc-800">
              <span className="text-zinc-500 block text-[11px]">Storage Deposit Status:</span>
              <span className="text-lg font-bold text-white mt-1 block flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-none ${isStorageRegistered ? "bg-[#894DEF]" : "bg-amber-400"}`} />
                {isStorageRegistered ? "Registered (0.0125 N)" : "Action Required"}
              </span>
              <span className="text-[10px] text-zinc-500">Refundable storage lock</span>
            </div>

            <div className="p-4 rounded-none bg-zinc-950 border border-zinc-800">
              <span className="text-zinc-500 block text-[11px]">Network & Contract:</span>
              <span className="text-lg font-bold text-zinc-200 mt-1 block truncate">
                testnet · {PANDEM_ESCROW_ID.slice(0, 10)}...
              </span>
              <span className="text-[10px] text-zinc-500">RPC: rpc.testnet.near.org</span>
            </div>
          </div>

          {/* Quick Persona Switcher in Card */}
          <div className="pt-2 border-t border-zinc-800 space-y-3">
            <span className="text-xs font-mono text-zinc-400 font-semibold block">
              Testnet Persona Switcher:
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  setManualAccount("pandem-alice-8d6888e3.testnet");
                  logAction("Switched to Alice (Subscriber)");
                }}
                className="px-3 py-1.5 rounded-none bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-mono text-xs border border-zinc-700 transition-colors"
              >
                Alice (Subscriber)
              </button>
              <button
                onClick={() => {
                  setManualAccount("pandem-steward-47c388e3.testnet");
                  logAction("Switched to Steward (Provider)");
                }}
                className="px-3 py-1.5 rounded-none bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-mono text-xs border border-zinc-700 transition-colors"
              >
                Steward (Provider)
              </button>
              <button
                onClick={() => {
                  setManualAccount("pandem-agent-12a488e3.testnet");
                  logAction("Switched to Agent (Heartbeat Enclave)");
                }}
                className="px-3 py-1.5 rounded-none bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-mono text-xs border border-zinc-700 transition-colors"
              >
                Agent (Heartbeat Enclave)
              </button>
            </div>

            <div className="flex items-center gap-2 max-w-lg mt-2">
              <input
                type="text"
                placeholder="Enter custom testnet account ID"
                value={customDevInput}
                onChange={(e) => setCustomDevInput(e.target.value)}
                className="bg-black/70 border border-zinc-700 px-3 py-1.5 rounded-none text-white font-mono text-xs flex-1 focus:outline-none focus:border-[#894DEF]"
              />
              <button
                onClick={() => {
                  if (customDevInput.trim()) {
                    setManualAccount(customDevInput.trim());
                    logAction(`Set custom account: ${customDevInput.trim()}`);
                    setCustomDevInput("");
                  }
                }}
                className="px-3 py-1.5 rounded-none bg-[#894DEF] hover:bg-[#A273F2] text-[#FAFAFA] border border-[#FAFAFA] font-semibold font-mono text-xs transition-colors"
              >
                Set Active
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* MODAL 1: SubscribeModal Popup */}
      {isSubscribeModalOpen && (
        <SubscribeModal
          product={sampleProduct}
          onClose={() => {
            setIsSubscribeModalOpen(false);
            logAction("Closed SubscribeModal");
          }}
        />
      )}

      {/* MODAL 2: Killswitch Modal Simulation */}
      {isKillswitchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-zinc-900 border border-rose-500/40 rounded-none max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-lg">
              <span>⚠</span>
              <span>Steward Killswitch Simulation</span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              This modal triggers <code className="text-white">declare_abandoned</code> on the escrow smart contract.
              All heartbeats are locked and subscribers can immediately claim unreleased funds.
            </p>

            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1">
                Termination Reason (Logged on NEAR):
              </label>
              <input
                type="text"
                value={killswitchReason}
                onChange={(e) => setKillswitchReason(e.target.value)}
                className="w-full bg-black/60 border border-zinc-700 px-3 py-2 rounded-none text-white font-mono text-xs focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={() => setIsKillswitchModalOpen(false)}
                className="flex-1 py-2.5 rounded-none border border-zinc-700 bg-zinc-800 text-zinc-300 font-medium text-xs hover:bg-zinc-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  logAction(`Confirmed Killswitch: ${killswitchReason}`);
                  setIsKillswitchModalOpen(false);
                }}
                className="flex-1 py-2.5 rounded-none bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors shadow-md shadow-rose-600/20"
              >
                Confirm Killswitch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Refund Modal Simulation */}
      {isRefundModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-zinc-900 border border-amber-500/40 rounded-none max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-lg">
              <span>↺</span>
              <span>Subscriber Pro-Rata Refund Claim</span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Calculates non-custodial refund for unreleased agreement periods plus remaining contingency reserve shares.
            </p>

            <div className="bg-zinc-950 p-3.5 rounded-none border border-zinc-800 space-y-2 text-xs font-mono">
              <div className="flex justify-between text-zinc-400">
                <span>Unreleased Periods (2 × 0.1 N):</span>
                <span className="text-white">0.2000 wNEAR</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Contingency Pool Return:</span>
                <span className="text-purple-400">0.0400 wNEAR</span>
              </div>
              <div className="pt-2 border-t border-zinc-850 flex justify-between font-bold">
                <span className="text-zinc-200">Total Refund Claim:</span>
                <span className="text-[#894DEF]">0.2400 wNEAR</span>
              </div>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={() => setIsRefundModalOpen(false)}
                className="flex-1 py-2.5 rounded-none border border-zinc-700 bg-zinc-800 text-zinc-300 font-medium text-xs hover:bg-zinc-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  logAction("Claimed Pro-Rata Refund of 0.2400 wNEAR");
                  setIsRefundModalOpen(false);
                }}
                className="flex-1 py-2.5 rounded-none bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs transition-colors shadow-md shadow-amber-500/20 font-mono"
              >
                Execute Refund
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
