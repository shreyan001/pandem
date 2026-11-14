"use client";

import React from "react";
import { DeveloperMetrics } from "@pandem/shared";

interface DeveloperActivityCardProps {
  developer: DeveloperMetrics;
}

export function DeveloperActivityCard({ developer }: DeveloperActivityCardProps) {
  return (
    <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span>Developer Reputation & On-Chain Activity</span>
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Verifiable track record of steward responsiveness, code upgrades, and escrow compliance.
          </p>
        </div>

        <div className="text-right">
          <span className="text-[10px] font-mono text-zinc-500 block">Steward Address</span>
          <span className="text-xs font-mono text-emerald-400 font-semibold">{developer.steward_address}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Developer Reputation Score */}
        <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800">
          <div className="text-[10px] font-mono text-zinc-500 uppercase">Reputation Score</div>
          <div className="text-2xl font-mono font-bold text-emerald-400 mt-1">{developer.reputation_score}/100</div>
          <div className="text-[10px] font-mono text-zinc-500 mt-0.5">SLA & Heartbeat Uptime</div>
        </div>

        {/* Developer Wallet Score */}
        <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800">
          <div className="text-[10px] font-mono text-zinc-500 uppercase">Wallet Score</div>
          <div className="text-2xl font-mono font-bold text-cyan-400 mt-1">{developer.wallet_score}/100</div>
          <div className="text-[10px] font-mono text-zinc-500 mt-0.5">Zero Slashing History</div>
        </div>

        {/* Requests Closed */}
        <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800">
          <div className="text-[10px] font-mono text-zinc-500 uppercase">Requests Closed</div>
          <div className="text-2xl font-mono font-bold text-white mt-1">{developer.requests_closed}</div>
          <div className="text-[10px] font-mono text-zinc-500 mt-0.5">Subscriber Proposals</div>
        </div>

        {/* Upgrades Made */}
        <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800">
          <div className="text-[10px] font-mono text-zinc-500 uppercase">Upgrades Made</div>
          <div className="text-2xl font-mono font-bold text-white mt-1">{developer.upgrades_made}</div>
          <div className="text-[10px] font-mono text-zinc-500 mt-0.5">On-Chain Releases</div>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs font-mono text-zinc-400 pt-1">
        <span>Last steward activity: <strong className="text-zinc-200">{developer.last_active_at}</strong></span>
        {developer.stargazers_count && (
          <span className="flex items-center gap-1.5 text-zinc-400">
            <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span>{developer.stargazers_count.toLocaleString()} GitHub stars</span>
          </span>
        )}
      </div>
    </div>
  );
}
