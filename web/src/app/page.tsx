"use client";

import { useState } from "react";
import Link from "next/link";
import { CatalogCard } from "../components/CatalogCard";
import { SubscribeModal } from "../components/SubscribeModal";
import { PANDEM_ESCROW_ID, PANDEM_TOKEN_ID, CatalogItem } from "@pandem/shared";
import catalogData from "../../../shared/catalog.json";

export default function Home() {
  const [selectedProduct, setSelectedProduct] = useState<CatalogItem | null>(null);
  const catalog = catalogData as CatalogItem[];

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Hero Header */}
      <section className="text-center py-12 sm:py-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs mb-6">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Native Rust Escrow Contract Live on Testnet
        </div>
        <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight max-w-4xl mx-auto leading-tight">
          SaaS Subscriptions backed by{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
            Cryptographic Escrow
          </span>
        </h1>
        <p className="mt-5 text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto">
          Subscribers pay via NEP-141 tokens. Funds are released period-by-period only when on-chain
          heartbeats prove uptime. Missed heartbeats or steward killswitch trigger automated pro-rata refunds.
        </p>

        {/* Live Metrics Bar */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs font-mono">
          <div className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300">
            <span className="text-zinc-500">Contract: </span>
            <span className="text-emerald-400">{PANDEM_ESCROW_ID}</span>
          </div>
          <div className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300">
            <span className="text-zinc-500">Token: </span>
            <span className="text-cyan-400">{PANDEM_TOKEN_ID}</span>
          </div>
          <div className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300">
            <span className="text-zinc-500">Split Formula: </span>
            <span className="text-white">47.5% Steward / 30% Ops / 20% Contingency / 2.5% Fee</span>
          </div>
        </div>
      </section>

      {/* Catalog Grid Section */}
      <section className="py-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Verified SaaS Catalog
            </h2>
            <p className="text-xs text-zinc-400 font-mono mt-1">
              Select an attested service to review terms and subscribe via non-custodial escrow.
            </p>
          </div>
          <span className="text-xs font-mono text-zinc-500 hidden sm:inline">
            Showing {catalog.length} services
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {catalog.map((item) => (
            <CatalogCard
              key={item.id}
              item={item}
              onSubscribe={(product) => setSelectedProduct(product)}
            />
          ))}
        </div>
      </section>

      {/* Protocol Architecture & Features */}
      <section className="mt-20 pt-12 border-t border-zinc-800/80">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            How Stillworks Rules Protect Subscribers
          </h2>
          <p className="mt-3 text-sm text-zinc-400">
            Ported directly from Stillworks specifications to native NEAR Rust smart contracts.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center font-mono font-bold text-emerald-400">
              01
            </div>
            <h3 className="text-lg font-bold text-white">Staged Period Releases</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Subscribers pre-fund N periods into the escrow contract. The steward cannot withdraw the full sum upfront. Each period is released sequentially only after an authorized agent posts a strictly increasing on-chain heartbeat.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center font-mono font-bold text-cyan-400">
              02
            </div>
            <h3 className="text-lg font-bold text-white">Four-Way Split & Reserves</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Every released period allocates exactly 47.5% to the steward, 30% to the product operational reserve, 20% to the contingency reserve, and 2.5% to protocol treasury. Zero rounding leak.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center font-mono font-bold text-purple-400">
              03
            </div>
            <h3 className="text-lg font-bold text-white">Killswitch & Pro-Rata Refund</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              If heartbeats fail beyond the grace window, or if the steward triggers the killswitch (<code className="text-zinc-300">declare_abandoned</code>), subscribers immediately claim permissionless refunds for all unreleased periods plus their contingency contribution.
            </p>
          </div>
        </div>
      </section>

      {/* Quick Access Dashboards */}
      <section className="mt-16 p-8 rounded-2xl bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="text-xl font-bold text-white">
            Experience the End-to-End Escrow Lifecycle
          </h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-xl">
            Test the live contract directly on testnet: subscribe, observe agent heartbeats, execute period releases, test the steward killswitch, and claim automated refunds.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/me"
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-medium text-xs font-mono transition-colors"
          >
            My Agreements →
          </Link>
          <Link
            href="/steward"
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-medium text-xs font-mono transition-colors"
          >
            Steward Killswitch →
          </Link>
          <Link
            href="/agent"
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs font-mono transition-colors"
          >
            Agent AI & TEE →
          </Link>
        </div>
      </section>

      {/* Subscribe Modal popup */}
      {selectedProduct && (
        <SubscribeModal
          product={{
            id: selectedProduct.id,
            name: selectedProduct.name,
            price_per_period: selectedProduct.price_per_period,
            period_display: selectedProduct.period_display,
            grace_display: selectedProduct.grace_display,
          }}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </main>
  );
}
