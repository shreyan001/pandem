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
  const catalog = catalogData as unknown as CatalogItem[];

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

      {/* Real-World Crisis Solved: Private Inference Problem Domains */}
      <section className="mt-16 pt-12 border-t border-zinc-800/80">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 font-mono text-xs mb-3">
            <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
            Why Public AI & Centralized Web2 Violate Privacy
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Problems Requiring Hardware-Attested Private Inference
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-zinc-400">
            Current Web2 applications log proprietary prompts, sell medical records, and leak executive calendar metadata. Pandem enforces mathematical zero-knowledge privacy backed by smart contract escrow.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-3 hover:border-zinc-700 transition-all flex flex-col justify-between">
            <div className="space-y-2">
              <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider block">Legal & Intellectual Property</span>
              <h3 className="text-base font-bold text-white">Attorney-Client Privilege Waiver</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Submitting confidential contracts, M&A term sheets, or litigation briefs to OpenAI waives legal privilege. Third-party providers cache prompts and train models on user data.
              </p>
            </div>
            <Link
              href="/products/aegis-legal"
              className="text-xs font-mono text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1.5 pt-2"
            >
              <span>Explore Aegis Legal AI (Intel TDX)</span>
              <span>→</span>
            </Link>
          </div>

          <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-3 hover:border-zinc-700 transition-all flex flex-col justify-between">
            <div className="space-y-2">
              <span className="text-[10px] font-mono text-red-400 uppercase tracking-wider block">Medical & Diagnostics</span>
              <h3 className="text-base font-bold text-white">HIPAA Breaches & Health Profiling</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Entering rare pathology symptoms or psychotherapy session transcripts into public LLMs exposes patients to insurance blacklisting and unencrypted cloud storage breaches.
              </p>
            </div>
            <Link
              href="/products/pulsemed-tee"
              className="text-xs font-mono text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1.5 pt-2"
            >
              <span>Explore PulseMed AI (NVIDIA TEE)</span>
              <span>→</span>
            </Link>
          </div>

          <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-3 hover:border-zinc-700 transition-all flex flex-col justify-between">
            <div className="space-y-2">
              <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block">Executive Operations</span>
              <h3 className="text-base font-bold text-white">Calendar Metadata & Espionage</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Automated executive scheduling bots that connect to Google or Outlook leak board meetings, travel itineraries, and acquisition talks to central crawlers.
              </p>
            </div>
            <Link
              href="/products/chrono-executive"
              className="text-xs font-mono text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1.5 pt-2"
            >
              <span>Explore ChronoSchedule AI</span>
              <span>→</span>
            </Link>
          </div>

          <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-3 hover:border-zinc-700 transition-all flex flex-col justify-between">
            <div className="space-y-2">
              <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider block">Finance & Tax</span>
              <h3 className="text-base font-bold text-white">Ledger De-Anonymization</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Connecting multi-chain wallets to SaaS accounting platforms exposes full trading history, off-ramps, and proprietary strategies to centralized telemetry databases.
              </p>
            </div>
            <Link
              href="/products/ciphertax-ai"
              className="text-xs font-mono text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1.5 pt-2"
            >
              <span>Explore CipherTax AI (ZK Enclave)</span>
              <span>→</span>
            </Link>
          </div>

          <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-3 hover:border-zinc-700 transition-all flex flex-col justify-between">
            <div className="space-y-2">
              <span className="text-[10px] font-mono text-purple-400 uppercase tracking-wider block">Whistleblower & Press</span>
              <h3 className="text-base font-bold text-white">Subpoena-Vulnerable Drop-Boxes</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Whistleblower disclosures submitted through standard cloud SaaS leave IP logs, browser fingerprints, and unencrypted database copies vulnerable to government subpoenas.
              </p>
            </div>
            <Link
              href="/products/krypton-enclave"
              className="text-xs font-mono text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1.5 pt-2"
            >
              <span>Explore Krypton Enclave</span>
              <span>→</span>
            </Link>
          </div>

          <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-3 hover:border-zinc-700 transition-all flex flex-col justify-between">
            <div className="space-y-2">
              <span className="text-[10px] font-mono text-blue-400 uppercase tracking-wider block">Decentralized Intelligence</span>
              <h3 className="text-base font-bold text-white">Corporate Espionage via Search</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Search engines build persistent dossiers tracking every corporate research inquiry, patent exploration, and competitor inquiry.
              </p>
            </div>
            <Link
              href="/products/searxng-tee"
              className="text-xs font-mono text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1.5 pt-2"
            >
              <span>Explore SearXNG TEE Proxy</span>
              <span>→</span>
            </Link>
          </div>
        </div>
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
