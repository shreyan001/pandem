"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ENRICHED_PRODUCTS, EnrichedProduct } from "@pandem/shared";
import { AbstractLogo } from "../../../components/AbstractLogo";

export default function DeveloperDashboardPage() {
  const [selectedProduct, setSelectedProduct] = useState<EnrichedProduct>(ENRICHED_PRODUCTS[0]);
  const [isPingingHeartbeat, setIsPingingHeartbeat] = useState<boolean>(false);
  const [heartbeatSuccess, setHeartbeatSuccess] = useState<string | null>(null);
  const [releaseNotes, setReleaseNotes] = useState<string>("");
  const [versionTag, setVersionTag] = useState<string>("");
  const [upgradeSuccess, setUpgradeSuccess] = useState<string | null>(null);

  const handleBroadcastHeartbeat = async () => {
    setIsPingingHeartbeat(true);
    setHeartbeatSuccess(null);
    try {
      // Simulate/trigger on-chain heartbeat
      await new Promise((r) => setTimeout(r, 1000));
      setHeartbeatSuccess(`Heartbeat recorded on testnet! Streak updated to ${selectedProduct.heartbeat_streak + 1} periods.`);
      setTimeout(() => setHeartbeatSuccess(null), 4000);
    } finally {
      setIsPingingHeartbeat(false);
    }
  };

  const handleLogUpgrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!versionTag.trim() || !releaseNotes.trim()) return;
    setUpgradeSuccess(`Upgrade ${versionTag} recorded on NEAR! Developer activity score updated.`);
    setVersionTag("");
    setReleaseNotes("");
    setTimeout(() => setUpgradeSuccess(null), 4000);
  };

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Developer & Steward Portal
            </h1>
            <span className="px-2.5 py-0.5 rounded-none text-[10px] font-mono font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              /dev/dashboard
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Broadcast cryptographic uptime heartbeats, manage streaming treasury payouts, and resolve subscriber bug tickets.
          </p>
        </div>

        {/* Steward Actions & Reputation */}
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/dev/onboarding"
            className="px-4 py-2 bg-[#894DEF] hover:bg-[#A273F2] text-white font-mono text-xs font-bold uppercase transition-colors"
          >
            + Onboard New Product →
          </Link>
          <div className="p-2.5 px-4 rounded-none bg-zinc-900 border border-zinc-800 text-right">
            <span className="block text-[10px] font-mono text-zinc-500 uppercase">Developer Wallet Score</span>
            <span className="text-sm font-mono font-bold text-[#894DEF]">{selectedProduct.developer.wallet_score}/100</span>
          </div>
          <div className="p-2.5 px-4 rounded-none bg-zinc-900 border border-zinc-800 text-right">
            <span className="block text-[10px] font-mono text-zinc-500 uppercase">Reputation Score</span>
            <span className="text-sm font-mono font-bold text-cyan-400">{selectedProduct.developer.reputation_score}/100</span>
          </div>
        </div>
      </div>

      {/* Product Selector */}
      <div className="p-4 rounded-none bg-zinc-900/40 border border-zinc-800 flex items-center gap-3 overflow-x-auto">
        <span className="text-xs font-mono text-zinc-500 flex-shrink-0">Your Products:</span>
        {ENRICHED_PRODUCTS.slice(0, 4).map((p) => (
          <button
            key={p.id}
            onClick={() => setSelectedProduct(p)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-none text-xs font-mono transition-all flex-shrink-0 border ${
              selectedProduct.id === p.id
                ? "bg-zinc-800 text-white border-[#2E2E2E] shadow-sm"
                : "bg-zinc-950/60 text-zinc-400 border-zinc-800 hover:text-white"
            }`}
          >
            <AbstractLogo slug={p.slug} name={p.name} size={20} className="w-5 h-5 p-0.5" />
            <span>{p.name}</span>
          </button>
        ))}
      </div>

      {/* Heartbeat Station & Treasury Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Heartbeat Broadcaster */}
        <div className="p-6 rounded-none bg-zinc-900/40 border border-zinc-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-none bg-[#894DEF] animate-pulse" />
              <span>Heartbeat Station</span>
            </h3>
            <span className="text-[10px] font-mono text-[#894DEF] bg-[#262626] px-2 py-0.5 rounded-none border border-[#2E2E2E]">
              Healthy
            </span>
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed">
            Broadcasting regular cryptographic heartbeats confirms your AI agent or private SaaS service is online. Payouts stream only while heartbeats remain valid.
          </p>

          <div className="p-3 rounded-none bg-zinc-950 border border-zinc-800 space-y-1 text-xs font-mono">
            <div className="flex justify-between text-zinc-400">
              <span>Liveness Streak:</span>
              <strong className="text-white">{selectedProduct.heartbeat_streak} Periods</strong>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Last Heartbeat:</span>
              <strong className="text-[#894DEF]">{selectedProduct.last_heartbeat_timestamp}</strong>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>TEE Enclave:</span>
              <strong className="text-cyan-400">{selectedProduct.tee_hardware}</strong>
            </div>
          </div>

          {heartbeatSuccess && (
            <div className="p-2.5 rounded-none bg-[#262626] border border-[#2E2E2E] text-xs font-mono text-[#FAFAFA]">
              {heartbeatSuccess}
            </div>
          )}

          <button
            onClick={handleBroadcastHeartbeat}
            disabled={isPingingHeartbeat}
            className="w-full py-2.5 rounded-none bg-[#894DEF] hover:bg-[#A273F2] disabled:opacity-50 text-black font-semibold font-mono text-xs transition-all"
          >
            {isPingingHeartbeat ? "Broadcasting to NEAR..." : "Broadcast Heartbeat Ping"}
          </button>
        </div>

        {/* Treasury Stream Monitor */}
        <div className="p-6 rounded-none bg-zinc-900/40 border border-zinc-800 space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div>
              <h3 className="text-sm font-bold text-white">Dynamic Autopayment & Treasury Monitor</h3>
              <p className="text-xs text-zinc-400">Smart contract escrow breakdown for {selectedProduct.name}.</p>
            </div>
            <span className="text-xs font-mono text-[#894DEF] font-bold">{selectedProduct.treasury.dynamic_allocation_status}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-none bg-zinc-950 border border-zinc-800">
              <span className="text-[10px] font-mono text-zinc-500 uppercase">Total Escrow Locked</span>
              <div className="text-lg font-mono font-bold text-white mt-0.5">{selectedProduct.treasury.total_locked_usd}</div>
            </div>
            <div className="p-3 rounded-none bg-zinc-950 border border-zinc-800">
              <span className="text-[10px] font-mono text-zinc-500 uppercase">Earned & Streamed</span>
              <div className="text-lg font-mono font-bold text-[#894DEF] mt-0.5">{selectedProduct.treasury.streamed_to_provider_usd}</div>
            </div>
            <div className="p-3 rounded-none bg-zinc-950 border border-zinc-800">
              <span className="text-[10px] font-mono text-amber-400 uppercase">Bug Warranty Pool (7%)</span>
              <div className="text-lg font-mono font-bold text-amber-400 mt-0.5">{selectedProduct.treasury.bug_warranty_reserve_usd}</div>
            </div>
          </div>

          <div className="p-3.5 rounded-none bg-zinc-950/60 border border-zinc-800/80 text-xs font-mono text-zinc-400 flex items-center justify-between">
            <span>Payout & Warranty Release Interval: <strong className="text-white">7 Days</strong></span>
            <span>MRR Growth: <strong className="text-cyan-400">+{selectedProduct.treasury.mrr_growth_pct}%</strong></span>
          </div>
        </div>
      </div>

      {/* Subscriber Proposals Backlog */}
      <div className="p-6 rounded-none bg-zinc-900/40 border border-zinc-800 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div>
            <h3 className="text-sm font-bold text-white">Subscriber Proposals (Ranked by Request Tokens)</h3>
            <p className="text-xs text-zinc-400">High-demand feature proposals submitted by paying subscribers.</p>
          </div>
          <span className="text-xs font-mono text-cyan-400 font-semibold">{selectedProduct.proposals.length} Open Requests</span>
        </div>

        <div className="space-y-3">
          {selectedProduct.proposals.map((prop) => (
            <div
              key={prop.id}
              className="p-4 rounded-none bg-zinc-950/60 border border-zinc-800 flex items-start justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">{prop.title}</span>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-none bg-zinc-800 text-zinc-400 border border-zinc-700">
                    {prop.status}
                  </span>
                </div>
                <p className="text-xs text-zinc-400">{prop.description}</p>
                <div className="text-[10px] font-mono text-zinc-500 pt-1">
                  By: {prop.author} • {prop.created_at}
                </div>
              </div>

              <div className="text-right flex-shrink-0 space-y-2">
                <span className="px-2.5 py-1 rounded-none bg-cyan-500/10 text-cyan-400 font-mono text-xs font-bold border border-cyan-500/20 block">
                  {prop.tokens_allocated} Tokens
                </span>
                <button className="px-3 py-1 rounded-none bg-zinc-800 hover:bg-zinc-700 text-white font-mono text-[10px]">
                  Mark In-Progress
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bug Ticket Resolution Center */}
      <div className="p-6 rounded-none bg-zinc-900/40 border border-zinc-800 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div>
            <h3 className="text-sm font-bold text-white">Bug Ticket Resolution Center</h3>
            <p className="text-xs text-zinc-400">Resolve subscriber bugs to unlock warranty reserves from the 7% pool.</p>
          </div>
          <span className="text-xs font-mono text-amber-400">{selectedProduct.bug_reports.length} Active Holds</span>
        </div>

        {selectedProduct.bug_reports.length === 0 ? (
          <div className="text-center py-6 text-xs font-mono text-zinc-500">
            No pending bug tickets! Full warranty reserve releases continuously across 7-day milestone intervals.
          </div>
        ) : (
          selectedProduct.bug_reports.map((bug) => (
            <div
              key={bug.id}
              className="p-4 rounded-none bg-zinc-950/60 border border-zinc-800 flex items-start justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded-none bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    {bug.severity}
                  </span>
                  <span className="text-xs font-bold text-white">{bug.title}</span>
                </div>
                <p className="text-xs text-zinc-400">{bug.description}</p>
                <div className="text-[10px] font-mono text-zinc-500">
                  Hold: <strong className="text-amber-400">{bug.warranty_reserve_hold_usd}</strong> • SLA: {bug.sla_hours_remaining}h
                </div>
              </div>

              <button className="px-3.5 py-1.5 rounded-none bg-[#894DEF] hover:bg-[#A273F2] text-[#FAFAFA] border border-[#FAFAFA] font-mono font-semibold text-xs flex-shrink-0">
                Resolve & Release Hold
              </button>
            </div>
          ))
        )}
      </div>

      {/* Upgrade & Release Logger */}
      <div className="p-6 rounded-none bg-zinc-900/40 border border-zinc-800 space-y-4">
        <h3 className="text-sm font-bold text-white">Log Software Upgrade / Release</h3>
        <p className="text-xs text-zinc-400">
          Recording releases on-chain boosts your Developer Reputation Score and proves continuous product maintenance.
        </p>

        {upgradeSuccess && (
          <div className="p-2.5 rounded-none bg-[#262626] border border-[#2E2E2E] text-xs font-mono text-[#FAFAFA]">
            {upgradeSuccess}
          </div>
        )}

        <form onSubmit={handleLogUpgrade} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-mono text-zinc-400 mb-1">Version Tag</label>
              <input
                type="text"
                value={versionTag}
                onChange={(e) => setVersionTag(e.target.value)}
                placeholder="v2.4.0-tee"
                className="w-full px-3 py-2 rounded-none bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-mono text-zinc-400 mb-1">Release Highlights</label>
              <input
                type="text"
                value={releaseNotes}
                onChange={(e) => setReleaseNotes(e.target.value)}
                placeholder="Added Intel TDX v3 attestation report verification"
                className="w-full px-3 py-2 rounded-none bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                required
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-5 py-2 rounded-none bg-cyan-500 hover:bg-cyan-400 text-black font-semibold font-mono text-xs transition-colors"
            >
              Record On-Chain Upgrade
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
