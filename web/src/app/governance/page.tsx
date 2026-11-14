"use client";

import { ContingencyVotingSection } from "../../components/ContingencyVotingSection";
import { ScoringExplainer } from "../../components/ScoringExplainer";
import { PANDEM_ESCROW_ID, PANDEM_TOKEN_ID, SPLIT_BPS } from "@pandem/shared";

export default function GovernancePage() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Governance Hero Header */}
      <section className="border-b border-zinc-800 pb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-pulse" />
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Protocol Governance & Waterfall Contingency Hub
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-purple-500/10 text-purple-400 border border-purple-500/20 font-semibold">
                NEAR Testnet
              </span>
            </div>
            <p className="text-sm text-zinc-400 mt-2 max-w-3xl leading-relaxed">
              Decentralized oversight for the 20.0% contingency reserve. Review, submit, and vote on emergency fix proposals, failover worker provisioning, and memory leak patches without exposing subscriber escrow balances to risk.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
            <div className="px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300">
              <span className="text-zinc-500">Escrow: </span>
              <span className="text-emerald-400">{PANDEM_ESCROW_ID.slice(0, 16)}...</span>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300">
              <span className="text-zinc-500">Contingency Split: </span>
              <span className="text-purple-400 font-bold">20.0% (2000 BPS)</span>
            </div>
          </div>
        </div>

        {/* Governance Invariants Callout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-850 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 font-bold">
              <span>01</span>
              <span>Subscriber Vote Weighting</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Voting power is proportional to active funded periods locked in the escrow contract, aligning decisions with committed users.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-850 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-mono text-purple-400 font-bold">
              <span>02</span>
              <span>20% Hard Buffer Cap</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              No proposal can ever withdraw more than the 20.0% contingency reserve. The 47.5% steward and 30.0% ops allocations remain mathematically isolated.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-850 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 font-bold">
              <span>03</span>
              <span>72-Hour Timelock & Quorum</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Voting windows are open for exactly 72 hours with a mandatory 50% quorum threshold before any on-chain promise execution takes place.
            </p>
          </div>
        </div>
      </section>

      {/* Primary Section: Contingency Voting Section */}
      <section>
        <ContingencyVotingSection />
      </section>

      {/* Secondary Section: Product Hunt Algorithmic Scoring Engine Explainer */}
      <section className="pt-8 border-t border-zinc-800">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Community Ranking & Scoring Architecture</span>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Sybil Defense
            </span>
          </h2>
          <p className="text-xs text-zinc-400 font-mono mt-1">
            How decentralized ranking coordinates community curation with hardware TEE verification and uptime streaks.
          </p>
        </div>

        <ScoringExplainer />
      </section>
    </main>
  );
}
