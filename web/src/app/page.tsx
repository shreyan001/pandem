"use client";

import { useState } from "react";
import Link from "next/link";
import { ProductHuntLeaderboard } from "../components/ProductHuntLeaderboard";
import { ProductDetailModal } from "../components/ProductDetailModal";
import { SubscribeModal } from "../components/SubscribeModal";
import { PANDEM_ESCROW_ID, PANDEM_TOKEN_ID, CatalogItem } from "@pandem/shared";
import catalogData from "../../../shared/catalog.json";

export default function Home() {
  const [detailProduct, setDetailProduct] = useState<CatalogItem | null>(null);
  const [subscribeProduct, setSubscribeProduct] = useState<CatalogItem | null>(null);
  const catalog = catalogData as CatalogItem[];

  const handleSelectProduct = (product: CatalogItem) => {
    setDetailProduct(product);
  };

  const handleLaunchSubscribe = (product: CatalogItem, periods: number) => {
    setDetailProduct(null);
    setSubscribeProduct(product);
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Top Banner / Hero */}
      <section className="text-center py-8 sm:py-12 border-b border-zinc-800/80 mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs mb-5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Native Rust Escrow Contract Live on NEAR Testnet
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight max-w-4xl mx-auto leading-tight">
          Decentralized SaaS & AI Agent Subscriptions backed by{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
            Hardware TEE Escrow
          </span>
        </h1>

        <p className="mt-4 text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto">
          Discover top-ranked decentralized software and private AI agents. Subscriptions are locked in non-custodial escrow, releasing funds only when hardware-attested heartbeats verify liveness.
        </p>

        {/* Live Metrics Bar */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs font-mono">
          <div className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300">
            <span className="text-zinc-500">Escrow: </span>
            <span className="text-emerald-400">{PANDEM_ESCROW_ID}</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300">
            <span className="text-zinc-500">Settlement Token: </span>
            <span className="text-cyan-400">{PANDEM_TOKEN_ID}</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300">
            <span className="text-zinc-500">Split Formula: </span>
            <span className="text-white">47.5% Steward / 30% Ops / 20% Contingency / 2.5% Fee</span>
          </div>
        </div>
      </section>

      {/* Product Hunt Style Leaderboard Feed */}
      <section className="py-2">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <span>Leaderboard & Product Listings</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Product Hunt Format
              </span>
            </h2>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">
              Vote for products, inspect cryptographic hardware TEE attestation, and subscribe via native escrow.
            </p>
          </div>
          <span className="text-xs font-mono text-zinc-500 hidden sm:inline">
            {catalog.length} Verified Services
          </span>
        </div>

        <ProductHuntLeaderboard
          products={catalog}
          onSelectProduct={handleSelectProduct}
        />
      </section>

      {/* Protocol Architecture Cards */}
      <section className="mt-16 pt-12 border-t border-zinc-800/80">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Consumer Protection Enforced by Native Code
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-zinc-400">
            Stillworks escrow specifications ported to native NEAR Rust smart contracts.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center font-mono font-bold text-emerald-400">
              01
            </div>
            <h3 className="text-base font-bold text-white">Staged Period Releases</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Subscribers pre-fund N periods into the escrow contract. The creator cannot withdraw upfront. Funds unlock sequentially only after an autonomous agent posts a strictly increasing on-chain heartbeat.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center font-mono font-bold text-cyan-400">
              02
            </div>
            <h3 className="text-base font-bold text-white">Hardware TEE Verification</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              AI inference runs inside Intel TDX and NVIDIA NRAS enclaves on NEAR AI Cloud. Heartbeats are signed by scoped function-call keys bound to physical silicon nonces, guaranteeing tamper-proof privacy.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center font-mono font-bold text-amber-400">
              03
            </div>
            <h3 className="text-base font-bold text-white">Guaranteed Pro-Rata Refunds</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              If heartbeats lapse past the grace window or the provider invokes the killswitch, any subscriber can immediately claim 100% of all unreleased periods plus the 20% contingency buffer with zero disputes.
            </p>
          </div>
        </div>
      </section>

      {/* Product Detail Modal */}
      {detailProduct && (
        <ProductDetailModal
          product={detailProduct}
          isOpen={!!detailProduct}
          onClose={() => setDetailProduct(null)}
          onSubscribe={handleLaunchSubscribe}
        />
      )}

      {/* Subscribe Execution Modal */}
      {subscribeProduct && (
        <SubscribeModal
          product={{
            id: subscribeProduct.id,
            name: subscribeProduct.name,
            price_per_period: subscribeProduct.price_per_period,
            period_display: subscribeProduct.period_display,
            grace_display: subscribeProduct.grace_display,
          }}
          onClose={() => setSubscribeProduct(null)}
        />
      )}
    </main>
  );
}
