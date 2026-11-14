"use client";

import React from "react";
import { DeveloperMetrics } from "@pandem/shared";

interface DeveloperActivityCardProps {
  developer: DeveloperMetrics;
}

export function DeveloperActivityCard({ developer }: DeveloperActivityCardProps) {
  return (
    <div className="p-6 rounded-none bg-[#171717] border border-[#2E2E2E] space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-[#2E2E2E]">
        <div>
          <h3 className="text-lg font-bold text-[#FAFAFA] flex items-center gap-2">
            <span>Developer Reputation & On-Chain Activity</span>
          </h3>
          <p className="text-xs text-[#B8B8B8] mt-1">
            Verifiable track record of steward responsiveness, code upgrades, and escrow compliance.
          </p>
        </div>

        <div className="text-right">
          <span className="text-[10px] font-mono text-[#6B6B6B] block">Steward Address</span>
          <span className="text-xs font-mono text-[#894DEF] font-semibold">{developer.steward_address}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Developer Reputation Score */}
        <div className="p-4 rounded-none bg-[#0D0D0D] border border-[#2E2E2E]">
          <div className="text-[10px] font-mono text-[#6B6B6B] uppercase">Reputation Score</div>
          <div className="text-2xl font-mono font-bold text-[#894DEF] mt-1">{developer.reputation_score}/100</div>
          <div className="text-[10px] font-mono text-[#6B6B6B] mt-0.5">SLA & Heartbeat Uptime</div>
        </div>

        {/* Developer Wallet Score */}
        <div className="p-4 rounded-none bg-[#0D0D0D] border border-[#2E2E2E]">
          <div className="text-[10px] font-mono text-[#6B6B6B] uppercase">Wallet Score</div>
          <div className="text-2xl font-mono font-bold text-[#FAFAFA] mt-1">{developer.wallet_score}/100</div>
          <div className="text-[10px] font-mono text-[#6B6B6B] mt-0.5">Zero Slashing History</div>
        </div>

        {/* Requests Closed */}
        <div className="p-4 rounded-none bg-[#0D0D0D] border border-[#2E2E2E]">
          <div className="text-[10px] font-mono text-[#6B6B6B] uppercase">Requests Closed</div>
          <div className="text-2xl font-mono font-bold text-[#FAFAFA] mt-1">{developer.requests_closed}</div>
          <div className="text-[10px] font-mono text-[#6B6B6B] mt-0.5">Subscriber Proposals</div>
        </div>

        {/* Upgrades Made */}
        <div className="p-4 rounded-none bg-[#0D0D0D] border border-[#2E2E2E]">
          <div className="text-[10px] font-mono text-[#6B6B6B] uppercase">Upgrades Made</div>
          <div className="text-2xl font-mono font-bold text-[#FAFAFA] mt-1">{developer.upgrades_made}</div>
          <div className="text-[10px] font-mono text-[#6B6B6B] mt-0.5">On-Chain Releases</div>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs font-mono text-[#B8B8B8] pt-1">
        <span>Last steward activity: <strong className="text-[#FAFAFA]">{developer.last_active_at}</strong></span>
        {developer.stargazers_count && (
          <span className="flex items-center gap-1.5 text-[#B8B8B8]">
            <span className="text-[#894DEF]">★</span>
            <span>{developer.stargazers_count.toLocaleString()} GitHub stars</span>
          </span>
        )}
      </div>
    </div>
  );
}
