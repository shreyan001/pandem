"use client";

import React from "react";
import { EnrichedProduct } from "@pandem/shared";

interface TreasuryAutopaymentCardProps {
  product: EnrichedProduct;
}

export function TreasuryAutopaymentCard({ product }: TreasuryAutopaymentCardProps) {
  const { treasury } = product;

  return (
    <div className="p-6 sm:p-7 rounded-none bg-[#171717] border border-[#2E2E2E] space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#2E2E2E]">
        <div>
          <h3 className="text-lg font-bold text-[#FAFAFA] flex items-center gap-2">
            <span>On-Chain Autopayment & Treasury Allocation</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-none bg-[#262626] text-[#894DEF] border border-[#2E2E2E]">
              Smart Contract Enforced
            </span>
          </h3>
          <p className="text-xs text-[#B8B8B8] mt-1">
            Non-custodial periodic release schedule on NEAR testnet with automated liveness proofs.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-[#6B6B6B]">Status:</span>
          <span className="px-2.5 py-0.5 rounded-none bg-[#262626] text-[#FAFAFA] border border-[#2E2E2E] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-none bg-[#894DEF]" />
            {treasury.dynamic_allocation_status}
          </span>
        </div>
      </div>

      {/* Explainer: Why Direct Payment Isn't Possible */}
      <div className="p-4 rounded-none bg-[#0D0D0D] border border-[#2E2E2E] text-xs text-[#B8B8B8] space-y-2">
        <div className="font-semibold text-[#FAFAFA] flex items-center gap-2">
          <span className="text-[#894DEF]">ℹ</span>
          <span>Why Direct Payment Is Defective for AI Agents & Private SaaS</span>
        </div>
        <p className="text-[#B8B8B8] leading-relaxed">
          {product.why_direct_payment_fails}
        </p>
        <p className="text-[#B8B8B8] leading-relaxed pt-1">
          When you pay a 1-year fee (e.g. $100 discounted), the funds are deposited into the NEAR smart contract treasury. The contract dynamically allocates compute costs to the AI cloud provider upon each verified uptime heartbeat, while releasing developer profit tranches in <strong className="text-[#894DEF]">7-day intervals</strong> with an active warranty reserve.
        </p>
      </div>

      {/* Treasury Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-none bg-[#0D0D0D] border border-[#2E2E2E]">
          <div className="text-[11px] font-mono text-[#6B6B6B] uppercase">Total Locked Treasury</div>
          <div className="text-xl font-mono font-bold text-[#FAFAFA] mt-1">{treasury.total_locked_usd}</div>
          <div className="text-[10px] text-[#6B6B6B] font-mono mt-0.5">Escrowed on NEAR</div>
        </div>

        <div className="p-4 rounded-none bg-[#0D0D0D] border border-[#2E2E2E]">
          <div className="text-[11px] font-mono text-[#6B6B6B] uppercase">Streamed to Provider</div>
          <div className="text-xl font-mono font-bold text-[#894DEF] mt-1">{treasury.streamed_to_provider_usd}</div>
          <div className="text-[10px] text-[#6B6B6B] font-mono mt-0.5">Verified Heartbeats</div>
        </div>

        <div className="p-4 rounded-none bg-[#0D0D0D] border border-[#2E2E2E]">
          <div className="text-[11px] font-mono text-[#B8B8B8] uppercase flex items-center gap-1">
            <span>Bug Warranty (7%)</span>
          </div>
          <div className="text-xl font-mono font-bold text-[#A273F2] mt-1">{treasury.bug_warranty_reserve_usd}</div>
          <div className="text-[10px] text-[#6B6B6B] font-mono mt-0.5">{treasury.escrow_warranty_days}-Day Wait Guarantee</div>
        </div>

        <div className="p-4 rounded-none bg-[#0D0D0D] border border-[#2E2E2E]">
          <div className="text-[11px] font-mono text-[#6B6B6B] uppercase">MRR Growth (30d)</div>
          <div className="text-xl font-mono font-bold text-[#FAFAFA] mt-1">+{treasury.mrr_growth_pct}%</div>
          <div className="text-[10px] text-[#6B6B6B] font-mono mt-0.5">Subscriber Trajectory</div>
        </div>
      </div>

      {/* Community Space & Perks */}
      <div className="p-4 rounded-none bg-[#0D0D0D] border border-[#2E2E2E] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-mono">
        <div className="space-y-1">
          <div className="text-[#FAFAFA] font-semibold flex items-center gap-2">
            <span>Subscriber Community Space & Governance Perks</span>
            <span className="px-2 py-0.5 rounded-none bg-[#262626] text-[#894DEF] border border-[#2E2E2E] text-[10px]">Active</span>
          </div>
          <p className="text-[#B8B8B8] text-[11px]">
            Active subscribers receive <strong className="text-[#FAFAFA]">3 Request Tokens / month</strong> to steer the developer roadmap, plus priority access to private enclave solver pools.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="px-3 py-1.5 rounded-none bg-[#171717] border border-[#2E2E2E] text-[#B8B8B8] text-center">
            <span className="block text-[10px] text-[#6B6B6B]">Average Sub</span>
            <span className="text-xs font-bold text-[#FAFAFA]">{treasury.average_budget_per_sub_usd}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
