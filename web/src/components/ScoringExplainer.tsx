"use client";

import { useState } from "react";

export interface ScoreParameters {
  upvotes: number;
  isTeeVerified: boolean;
  heartbeatStreak: number;
  escrowTvl: number;
}

export interface ScoreBreakdown extends ScoreParameters {
  baseVoteScore: number;
  teeMultiplier: number;
  voteScoreWithTee: number;
  heartbeatBonus: number;
  tvlBonus: number;
  totalScore: number;
}

/**
 * Computes the Pandem Product Hunt Algorithmic Composite Score:
 * Score = (Upvotes * 1.0) * (TEE_Multiplier: 2.0 if verified, 1.0 otherwise) + (Heartbeat_Streak * 10) + (Escrow_TVL_Bonus)
 */
export function calculateProductScore(params: ScoreParameters): ScoreBreakdown {
  const baseVoteScore = params.upvotes * 1.0;
  const teeMultiplier = params.isTeeVerified ? 2.0 : 1.0;
  const voteScoreWithTee = Math.round(baseVoteScore * teeMultiplier);
  const heartbeatBonus = params.heartbeatStreak * 10;
  const tvlBonus = Math.floor(params.escrowTvl * 5); // 5 points per wNEAR locked
  const totalScore = voteScoreWithTee + heartbeatBonus + tvlBonus;

  return {
    ...params,
    baseVoteScore,
    teeMultiplier,
    voteScoreWithTee,
    heartbeatBonus,
    tvlBonus,
    totalScore,
  };
}

export function ScoringExplainer() {
  const [upvotes, setUpvotes] = useState<number>(348);
  const [isTeeVerified, setIsTeeVerified] = useState<boolean>(true);
  const [heartbeatStreak, setHeartbeatStreak] = useState<number>(12);
  const [escrowTvl, setEscrowTvl] = useState<number>(15);

  const breakdown = calculateProductScore({
    upvotes,
    isTeeVerified,
    heartbeatStreak,
    escrowTvl,
  });

  return (
    <div className="rounded-none border border-[#2E2E2E] bg-[#171717] p-6 sm:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#2E2E2E]">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-none bg-[#894DEF]" />
            <h3 className="text-xl font-bold text-[#FAFAFA] tracking-tight flex items-center gap-2">
              Algorithmic Product Hunt Scoring Engine
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-none bg-[#262626] text-[#894DEF] border border-[#2E2E2E] font-semibold">
              Sybil-Resistant
            </span>
          </div>
          <p className="text-xs text-[#B8B8B8] font-mono mt-1">
            Coupling community sentiment with cryptographic silicon proof and on-chain escrow liveness.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="text-[#6B6B6B]">Live Formula:</span>
          <code className="text-[#FAFAFA] bg-[#0D0D0D] px-2.5 py-1 rounded-none border border-[#2E2E2E]">
            (Votes × 1.0) × TEE + (Streak × 10) + TVL_Bonus
          </code>
        </div>
      </div>

      {/* Formula 3-Pillar Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Pillar 1: Upvotes & TEE Multiplier */}
        <div className="p-4 rounded-none bg-[#0D0D0D] border border-[#2E2E2E] space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-[#894DEF] font-bold">1. TEE-Weighted Upvotes</span>
            <span className="text-[#6B6B6B]">2.0x Boost</span>
          </div>
          <div className="text-lg font-bold text-[#FAFAFA] font-mono">
            (Upvotes × 1.0) × {isTeeVerified ? "2.0x" : "1.0x"}
          </div>
          <p className="text-[11px] text-[#B8B8B8] leading-relaxed">
            Hardware-attested services (Intel TDX / NVIDIA H100) earn a <strong className="text-[#FAFAFA]">2.0x multiplier</strong> on all community upvotes.
          </p>
        </div>

        {/* Pillar 2: Heartbeat Streak */}
        <div className="p-4 rounded-none bg-[#0D0D0D] border border-[#2E2E2E] space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-[#FAFAFA] font-bold">2. Liveness Streak</span>
            <span className="text-[#6B6B6B]">+10 pts / period</span>
          </div>
          <div className="text-lg font-bold text-[#FAFAFA] font-mono">
            Streak × 10 Points
          </div>
          <p className="text-[11px] text-[#B8B8B8] leading-relaxed">
            Every consecutive heartbeat successfully posted on NEAR testnet adds <strong className="text-[#FAFAFA]">10 points</strong>.
          </p>
        </div>

        {/* Pillar 3: Escrow TVL */}
        <div className="p-4 rounded-none bg-[#0D0D0D] border border-[#2E2E2E] space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-[#A273F2] font-bold">3. Escrow TVL Stake</span>
            <span className="text-[#6B6B6B]">+5 pts / wNEAR</span>
          </div>
          <div className="text-lg font-bold text-[#FAFAFA] font-mono">
            TVL × 5 Points
          </div>
          <p className="text-[11px] text-[#B8B8B8] leading-relaxed">
            Real subscriber demand locked inside the non-custodial contract provides <strong className="text-[#FAFAFA]">5 bonus points per wNEAR</strong>.
          </p>
        </div>
      </div>

      {/* Interactive Simulator Section */}
      <div className="rounded-none border border-[#2E2E2E] bg-[#0D0D0D] p-5 space-y-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-[#FAFAFA] font-bold uppercase tracking-wider flex items-center gap-2">
            <span>⚙ Interactive Score Simulator</span>
          </span>
          <span className="text-xs font-mono text-[#B8B8B8]">
            Simulated Composite Score: <strong className="text-[#894DEF] text-sm font-extrabold">{breakdown.totalScore} pts</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
          {/* Upvotes Slider */}
          <div className="space-y-1.5 p-3 rounded-none bg-[#171717] border border-[#2E2E2E]">
            <div className="flex justify-between text-[#B8B8B8]">
              <span>Upvotes:</span>
              <span className="text-[#FAFAFA] font-bold">{upvotes}</span>
            </div>
            <input
              type="range"
              min="0"
              max="500"
              value={upvotes}
              onChange={(e) => setUpvotes(Number(e.target.value))}
              className="w-full accent-[#894DEF] cursor-pointer"
            />
            <div className="text-[10px] text-[#6B6B6B] text-right">
              Yield: +{breakdown.voteScoreWithTee} pts
            </div>
          </div>

          {/* TEE Verification Toggle */}
          <div className="space-y-2 p-3 rounded-none bg-[#171717] border border-[#2E2E2E]">
            <div className="flex justify-between text-[#B8B8B8]">
              <span>TEE Enclave:</span>
              <span className={isTeeVerified ? "text-[#894DEF] font-bold" : "text-[#6B6B6B]"}>
                {isTeeVerified ? "Verified (2.0x)" : "Standard (1.0x)"}
              </span>
            </div>
            <button
              onClick={() => setIsTeeVerified(!isTeeVerified)}
              className={`w-full py-1.5 rounded-none text-xs font-mono transition-all border ${
                isTeeVerified
                  ? "bg-[#262626] text-[#FAFAFA] border-[#894DEF] font-bold"
                  : "bg-[#0D0D0D] text-[#B8B8B8] border-[#2E2E2E] hover:text-[#FAFAFA]"
              }`}
            >
              {isTeeVerified ? "✓ TEE Attested" : "✕ Unverified"}
            </button>
            <div className="text-[10px] text-[#6B6B6B] text-right">
              Multiplier: {isTeeVerified ? "2.0x" : "1.0x"}
            </div>
          </div>

          {/* Heartbeat Streak Slider */}
          <div className="space-y-1.5 p-3 rounded-none bg-[#171717] border border-[#2E2E2E]">
            <div className="flex justify-between text-[#B8B8B8]">
              <span>Heartbeat Streak:</span>
              <span className="text-[#FAFAFA] font-bold">{heartbeatStreak} periods</span>
            </div>
            <input
              type="range"
              min="0"
              max="24"
              value={heartbeatStreak}
              onChange={(e) => setHeartbeatStreak(Number(e.target.value))}
              className="w-full accent-[#894DEF] cursor-pointer"
            />
            <div className="text-[10px] text-[#6B6B6B] text-right">
              Yield: +{breakdown.heartbeatBonus} pts
            </div>
          </div>

          {/* Escrow TVL Slider */}
          <div className="space-y-1.5 p-3 rounded-none bg-[#171717] border border-[#2E2E2E]">
            <div className="flex justify-between text-[#B8B8B8]">
              <span>Escrow TVL:</span>
              <span className="text-[#A273F2] font-bold">{escrowTvl} wNEAR</span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              value={escrowTvl}
              onChange={(e) => setEscrowTvl(Number(e.target.value))}
              className="w-full accent-[#894DEF] cursor-pointer"
            />
            <div className="text-[10px] text-[#6B6B6B] text-right">
              Yield: +{breakdown.tvlBonus} pts
            </div>
          </div>
        </div>

        {/* Calculation Step-by-Step Breakdown */}
        <div className="p-3.5 rounded-none bg-[#171717] border border-[#2E2E2E] font-mono text-xs flex flex-wrap items-center justify-between gap-3 text-[#B8B8B8]">
          <div className="flex items-center gap-2 flex-wrap">
            <span>Score =</span>
            <span className="text-[#894DEF] font-semibold">({upvotes} × {breakdown.teeMultiplier})</span>
            <span>+</span>
            <span className="text-[#FAFAFA] font-semibold">({heartbeatStreak} × 10)</span>
            <span>+</span>
            <span className="text-[#A273F2] font-semibold">({escrowTvl} × 5)</span>
            <span>=</span>
            <span className="text-[#FAFAFA] font-extrabold text-sm bg-[#262626] px-2.5 py-0.5 rounded-none border border-[#894DEF]">
              {breakdown.totalScore} Points
            </span>
          </div>

          <div className="text-[11px] text-[#6B6B6B]">
            Rank weight: {((breakdown.voteScoreWithTee / (breakdown.totalScore || 1)) * 100).toFixed(0)}% votes ·{" "}
            {(((breakdown.heartbeatBonus + breakdown.tvlBonus) / (breakdown.totalScore || 1)) * 100).toFixed(0)}% cryptographic liveness
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Visual Score Badge with hover tooltip showing exact composite score breakdown
 */
export function ScoreBadge({
  upvotes,
  isTeeVerified = true,
  streak = 8,
  tvl = 10,
  showLabel = true,
}: {
  upvotes: number;
  isTeeVerified?: boolean;
  streak?: number;
  tvl?: number;
  showLabel?: boolean;
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  const score = calculateProductScore({
    upvotes,
    isTeeVerified,
    heartbeatStreak: streak,
    escrowTvl: tvl,
  });

  return (
    <div
      className="relative inline-flex items-center"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-none bg-[#171717] text-[#FAFAFA] border border-[#2E2E2E] hover:border-[#894DEF] font-mono text-xs font-bold transition-colors cursor-help">
        <span className="text-[#894DEF] text-[11px]">⚡</span>
        <span>{score.totalScore}</span>
        {showLabel && <span className="text-[10px] text-[#B8B8B8] font-normal">pts</span>}
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 rounded-none bg-[#171717] border border-[#2E2E2E] z-50 text-[11px] font-mono text-[#B8B8B8] space-y-1.5 pointer-events-none">
          <div className="flex justify-between pb-1 border-b border-[#2E2E2E] text-[#FAFAFA] font-bold">
            <span>Algorithmic Score</span>
            <span className="text-[#894DEF]">{score.totalScore} pts</span>
          </div>
          <div className="flex justify-between text-[#B8B8B8]">
            <span>Upvotes ({upvotes} × {score.teeMultiplier}x TEE):</span>
            <span className="text-[#FAFAFA]">+{score.voteScoreWithTee}</span>
          </div>
          <div className="flex justify-between text-[#B8B8B8]">
            <span>Heartbeat Streak ({streak} × 10):</span>
            <span className="text-[#FAFAFA]">+{score.heartbeatBonus}</span>
          </div>
          <div className="flex justify-between text-[#B8B8B8]">
            <span>Escrow TVL ({tvl} N × 5):</span>
            <span className="text-[#A273F2]">+{score.tvlBonus}</span>
          </div>
          <div className="pt-1 border-t border-[#2E2E2E] text-[10px] text-[#6B6B6B] text-center">
            Verified by NEAR Testnet Escrow Invariants
          </div>
        </div>
      )}
    </div>
  );
}
