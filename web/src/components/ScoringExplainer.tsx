"use client";

import { useState } from "react";
import { Zap } from "lucide-react";

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
    <div className="rounded-none border border-spectr-hairline bg-spectr-surface p-6 sm:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-spectr-hairline">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-none bg-spectr-primary" />
            <h3 className="text-xl font-bold text-spectr-ink tracking-tight flex items-center gap-2 font-sans">
              Algorithmic Product Hunt Scoring Engine
            </h3>
            <span className="text-xs font-mono px-2 py-0.5 rounded-none bg-spectr-surface-raised text-spectr-primary border border-spectr-hairline font-semibold">
              Sybil-Resistant
            </span>
          </div>
          <p className="text-xs text-spectr-body font-mono mt-1">
            Coupling community sentiment with cryptographic silicon proof and on-chain escrow liveness.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="text-spectr-muted">Live Formula:</span>
          <code className="text-spectr-ink bg-spectr-canvas px-2.5 py-1 rounded-none border border-spectr-hairline">
            (Votes × 1.0) × TEE + (Streak × 10) + TVL_Bonus
          </code>
        </div>
      </div>

      {/* Formula 3-Pillar Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Pillar 1: Upvotes & TEE Multiplier */}
        <div className="p-4 rounded-none bg-spectr-canvas border border-spectr-hairline space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-spectr-primary font-bold">1. TEE-Weighted Upvotes</span>
            <span className="text-spectr-muted">2.0x Boost</span>
          </div>
          <div className="text-lg font-bold text-spectr-ink font-mono">
            (Upvotes × 1.0) × {isTeeVerified ? "2.0x" : "1.0x"}
          </div>
          <p className="text-xs text-spectr-body leading-relaxed font-sans">
            Hardware-attested services (Intel TDX / NVIDIA H100) earn a <strong className="text-spectr-ink">2.0x multiplier</strong> on all community upvotes.
          </p>
        </div>

        {/* Pillar 2: Heartbeat Liveness Streak */}
        <div className="p-4 rounded-none bg-spectr-canvas border border-spectr-hairline space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-spectr-ink font-bold">2. Liveness Streak</span>
            <span className="text-spectr-muted">+10 pts / period</span>
          </div>
          <div className="text-lg font-bold text-spectr-ink font-mono">
            {heartbeatStreak} periods × 10 = +{breakdown.heartbeatBonus} pts
          </div>
          <p className="text-xs text-spectr-body leading-relaxed font-sans">
            Every consecutive heartbeat successfully posted on NEAR testnet adds <strong className="text-spectr-ink">10 points</strong>.
          </p>
        </div>

        {/* Pillar 3: Escrow TVL Stake */}
        <div className="p-4 rounded-none bg-spectr-canvas border border-spectr-hairline space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-spectr-primary-hover font-bold">3. Escrow TVL Stake</span>
            <span className="text-spectr-muted">+5 pts / wNEAR</span>
          </div>
          <div className="text-lg font-bold text-spectr-ink font-mono">
            {escrowTvl} wNEAR × 5 = +{breakdown.tvlBonus} pts
          </div>
          <p className="text-xs text-spectr-body leading-relaxed font-sans">
            Real subscriber demand locked inside the non-custodial contract provides <strong className="text-spectr-ink">5 bonus points per wNEAR</strong>.
          </p>
        </div>
      </div>

      {/* Interactive Simulator */}
      <div className="rounded-none border border-spectr-hairline bg-spectr-canvas p-5 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-spectr-hairline">
          <span className="text-xs font-mono text-spectr-ink font-bold uppercase tracking-wider flex items-center gap-2">
            <span>⚙</span>
            <span>Interactive Simulator: Test Product Score Output</span>
          </span>
          <span className="text-xs font-mono text-spectr-body">
            Simulated Composite Score: <strong className="text-spectr-primary text-sm font-extrabold">{breakdown.totalScore} pts</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
          {/* Slider 1: Upvotes */}
          <div className="space-y-1.5 p-3 rounded-none bg-spectr-surface border border-spectr-hairline">
            <div className="flex justify-between text-spectr-body">
              <span>Upvotes:</span>
              <span className="text-spectr-ink font-bold">{upvotes}</span>
            </div>
            <input
              type="range"
              min={10}
              max={1000}
              step={10}
              value={upvotes}
              onChange={(e) => setUpvotes(Number(e.target.value))}
              className="w-full accent-spectr-primary cursor-pointer rounded-none"
            />
            <div className="text-xs text-spectr-muted text-right">
              Raw: {upvotes} pts
            </div>
          </div>

          {/* Toggle: TEE Verified */}
          <div className="space-y-2 p-3 rounded-none bg-spectr-surface border border-spectr-hairline">
            <div className="flex justify-between text-spectr-body">
              <span>TEE Enclave:</span>
              <span className={isTeeVerified ? "text-spectr-primary font-bold" : "text-spectr-muted"}>
                {isTeeVerified ? "2.0x Boosted" : "1.0x Standard"}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsTeeVerified(!isTeeVerified)}
              className={`w-full py-1.5 text-xs transition-colors border rounded-none ${
                isTeeVerified
                  ? "bg-spectr-surface-raised text-spectr-ink border-spectr-primary font-bold"
                  : "bg-spectr-canvas text-spectr-body border-spectr-hairline hover:text-spectr-ink"
              }`}
            >
              {isTeeVerified ? "✓ TEE Attested (2.0x)" : "✗ Standard VPS (1.0x)"}
            </button>
            <div className="text-xs text-spectr-muted text-right">
              Multiplier: {isTeeVerified ? "2.0x" : "1.0x"}
            </div>
          </div>

          {/* Slider 2: Heartbeat Streak */}
          <div className="space-y-1.5 p-3 rounded-none bg-spectr-surface border border-spectr-hairline">
            <div className="flex justify-between text-spectr-body">
              <span>Heartbeat Streak:</span>
              <span className="text-spectr-ink font-bold">{heartbeatStreak} periods</span>
            </div>
            <input
              type="range"
              min={0}
              max={50}
              step={1}
              value={heartbeatStreak}
              onChange={(e) => setHeartbeatStreak(Number(e.target.value))}
              className="w-full accent-spectr-primary cursor-pointer rounded-none"
            />
            <div className="text-xs text-spectr-muted text-right">
              Bonus: +{breakdown.heartbeatBonus} pts
            </div>
          </div>

          {/* Slider 3: Escrow TVL */}
          <div className="space-y-1.5 p-3 rounded-none bg-spectr-surface border border-spectr-hairline">
            <div className="flex justify-between text-spectr-body">
              <span>Escrow TVL:</span>
              <span className="text-spectr-primary-hover font-bold">{escrowTvl} wNEAR</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={escrowTvl}
              onChange={(e) => setEscrowTvl(Number(e.target.value))}
              className="w-full accent-spectr-primary cursor-pointer rounded-none"
            />
            <div className="text-xs text-spectr-muted text-right">
              Bonus: +{breakdown.tvlBonus} pts
            </div>
          </div>
        </div>

        {/* Live Calculation Bar */}
        <div className="p-3.5 rounded-none bg-spectr-surface border border-spectr-hairline font-mono text-xs flex flex-wrap items-center justify-between gap-3 text-spectr-body">
          <div className="flex items-center gap-2 flex-wrap">
            <span>Formula:</span>
            <span className="text-spectr-primary font-semibold">({upvotes} × {breakdown.teeMultiplier})</span>
            <span>+</span>
            <span className="text-spectr-ink font-semibold">({heartbeatStreak} × 10)</span>
            <span>+</span>
            <span className="text-spectr-primary-hover font-semibold">({escrowTvl} × 5)</span>
            <span>=</span>
            <span className="text-spectr-ink font-extrabold text-sm bg-spectr-surface-raised px-2.5 py-0.5 rounded-none border border-spectr-primary">
              {breakdown.totalScore} Points
            </span>
          </div>

          <div className="text-xs text-spectr-muted">
            Score determines leaderboard positioning
          </div>
        </div>
      </div>
    </div>
  );
}

export function ScoreBadge({
  upvotes,
  isTeeVerified = true,
  streak = 10,
  tvl = 10,
  showLabel = false,
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
      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-none bg-spectr-surface text-spectr-ink border border-spectr-hairline hover:border-spectr-primary font-mono text-xs font-bold transition-colors cursor-help">
        <Zap className="w-3 h-3 text-spectr-primary" />
        <span>{score.totalScore}</span>
        {showLabel && <span className="text-xs text-spectr-body font-normal">pts</span>}
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 rounded-none bg-spectr-surface border border-spectr-hairline z-50 text-xs font-mono text-spectr-body space-y-1.5 pointer-events-none shadow-xl">
          <div className="flex justify-between pb-1 border-b border-spectr-hairline text-spectr-ink font-bold">
            <span>Algorithmic Score</span>
            <span className="text-spectr-primary">{score.totalScore} pts</span>
          </div>
          <div className="flex justify-between text-spectr-body">
            <span>Upvotes ({upvotes} × {score.teeMultiplier}x TEE):</span>
            <span className="text-spectr-ink">+{score.voteScoreWithTee}</span>
          </div>
          <div className="flex justify-between text-spectr-body">
            <span>Heartbeat Streak ({streak} × 10):</span>
            <span className="text-spectr-ink">+{score.heartbeatBonus}</span>
          </div>
          <div className="flex justify-between text-spectr-body">
            <span>Escrow TVL ({tvl} N × 5):</span>
            <span className="text-spectr-primary-hover">+{score.tvlBonus}</span>
          </div>
          <div className="pt-1 border-t border-spectr-hairline text-xs text-spectr-muted text-center">
            Verified by NEAR Testnet Escrow Invariants
          </div>
        </div>
      )}
    </div>
  );
}
