"use client";

import React from "react";
import { EnrichedProduct } from "@pandem/shared";

interface TreasuryAutopaymentCardProps {
  product: EnrichedProduct;
}

export function TreasuryAutopaymentCard({ product }: TreasuryAutopaymentCardProps) {
  const { treasury } = product;

  return (
    <div className="p-6 sm:p-7 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span>On-Chain Autopayment & Treasury Allocation</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              Smart Contract Enforced
            </span>
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Non-custodial periodic release schedule on NEAR testnet with automated liveness proofs.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-zinc-500">Status:</span>
          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {treasury.dynamic_allocation_status}
          </span>
        </div>
      </div>

      {/* Explainer: Why Direct Payment Isn't Possible */}
      <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/80 text-xs text-zinc-300 space-y-2">
        <div className="font-semibold text-zinc-100 flex items-center gap-2">
          <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Why Direct Payment Is Defective for AI Agents & Private SaaS</span>
        </div>
        <p className="text-zinc-400 leading-relaxed">
          {product.why_direct_payment_fails}
        </p>
        <p className="text-zinc-400 leading-relaxed pt-1">
          When you pay a 1-year fee (e.g. $100 discounted), the funds are deposited into the NEAR smart contract treasury. The contract dynamically allocates compute costs to the AI cloud provider upon each verified uptime heartbeat, while continuously holding back <strong className="text-emerald-400">7% in a Bug Fix & Warranty Reserve</strong> with a <strong className="text-cyan-400">70-day dispute window</strong>.
        </p>
      </div>

      {/* Treasury Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-zinc-950/50 border border-zinc-800/80">
          <div className="text-[11px] font-mono text-zinc-500 uppercase">Total Locked Treasury</div>
          <div className="text-xl font-mono font-bold text-white mt-1">{treasury.total_locked_usd}</div>
          <div className="text-[10px] text-zinc-500 font-mono mt-0.5">Escrowed on NEAR</div>
        </div>

        <div className="p-4 rounded-xl bg-zinc-950/50 border border-zinc-800/80">
          <div className="text-[11px] font-mono text-zinc-500 uppercase">Streamed to Provider</div>
          <div className="text-xl font-mono font-bold text-emerald-400 mt-1">{treasury.streamed_to_provider_usd}</div>
          <div className="text-[10px] text-zinc-500 font-mono mt-0.5">Verified Heartbeats</div>
        </div>

        <div className="p-4 rounded-xl bg-zinc-950/50 border border-zinc-800/80">
          <div className="text-[11px] font-mono text-amber-400/90 uppercase flex items-center gap-1">
            <span>Bug Warranty (7%)</span>
          </div>
          <div className="text-xl font-mono font-bold text-amber-400 mt-1">{treasury.bug_warranty_reserve_usd}</div>
          <div className="text-[10px] text-zinc-500 font-mono mt-0.5">{treasury.escrow_warranty_days}-Day Wait Guarantee</div>
        </div>

        <div className="p-4 rounded-xl bg-zinc-950/50 border border-zinc-800/80">
          <div className="text-[11px] font-mono text-zinc-500 uppercase">MRR Growth (30d)</div>
          <div className="text-xl font-mono font-bold text-cyan-400 mt-1">+{treasury.mrr_growth_pct}%</div>
          <div className="text-[10px] text-zinc-500 font-mono mt-0.5">Subscriber Trajectory</div>
        </div>
      </div>

      {/* Community Space & Perks */}
      <div className="p-4 rounded-xl bg-zinc-950/40 border border-zinc-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-mono">
        <div className="space-y-1">
          <div className="text-zinc-200 font-semibold flex items-center gap-2">
            <span>Subscriber Community Space & Governance Perks</span>
            <span className="px-2 py-0.2 rounded bg-cyan-500/10 text-cyan-400 text-[10px]">Active</span>
          </div>
          <p className="text-zinc-400 text-[11px]">
            Active subscribers receive <strong className="text-zinc-200">3 Request Tokens / month</strong> to steer the developer roadmap, plus priority access to private enclave solver pools.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 text-center">
            <span className="block text-[10px] text-zinc-500">Average Sub</span>
            <span className="text-xs font-bold text-white">{treasury.average_budget_per_sub_usd}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
