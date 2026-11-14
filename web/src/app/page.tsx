"use client";

import { useState } from "react";
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
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12 bg-[#0D0D0D]">
      {/* Minimalist Authoritative Hero */}
      <section className="text-center py-10 sm:py-16 border-b border-[#2E2E2E]">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-none bg-[#171717] border border-[#2E2E2E] text-[#894DEF] font-mono text-xs mb-6">
          <span className="w-2 h-2 rounded-none bg-[#894DEF]" />
          <span>NEAR Testnet Escrow Protocol</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-[#FAFAFA] tracking-tight max-w-4xl mx-auto leading-none uppercase">
          Decentralized SaaS & AI{" "}
          <span className="text-[#894DEF]">
            TEE Escrow
          </span>
        </h1>

        <p className="mt-5 text-sm sm:text-base text-[#B8B8B8] max-w-2xl mx-auto font-sans leading-relaxed">
          Discover top-ranked decentralized software and private AI agents. Subscriptions are locked in non-custodial escrow, releasing funds only upon verified hardware heartbeats.
        </p>

        {/* Minimalist Metrics Bar */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-xs font-mono">
          <div className="px-3.5 py-2 rounded-none bg-[#171717] border border-[#2E2E2E] text-[#B8B8B8]">
            <span className="text-[#6B6B6B]">Escrow: </span>
            <span className="text-[#FAFAFA] font-bold">{PANDEM_ESCROW_ID}</span>
          </div>
          <div className="px-3.5 py-2 rounded-none bg-[#171717] border border-[#2E2E2E] text-[#B8B8B8]">
            <span className="text-[#6B6B6B]">Token: </span>
            <span className="text-[#894DEF] font-bold">{PANDEM_TOKEN_ID}</span>
          </div>
          <div className="px-3.5 py-2 rounded-none bg-[#171717] border border-[#2E2E2E] text-[#B8B8B8]">
            <span className="text-[#6B6B6B]">Split: </span>
            <span className="text-[#FAFAFA]">47.5% Steward · 30% Ops · 20% Contingency · 2.5% Fee</span>
          </div>
        </div>
      </section>

      {/* Product Hunt Style Leaderboard Feed */}
      <section className="py-4">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#2E2E2E]">
          <div>
            <h2 className="text-2xl font-extrabold text-[#FAFAFA] tracking-tight flex items-center gap-3">
              <span>Leaderboard</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded-none bg-[#171717] text-[#894DEF] border border-[#2E2E2E]">
                Product Hunt
              </span>
            </h2>
            <p className="text-xs text-[#B8B8B8] font-mono mt-1">
              Vote for products, inspect hardware TEE attestation, and subscribe via native escrow.
            </p>
          </div>
          <span className="text-xs font-mono text-[#6B6B6B] hidden sm:inline">
            {catalog.length} Verified Services
          </span>
        </div>

        <ProductHuntLeaderboard
          products={catalog}
          onSelectProduct={handleSelectProduct}
        />
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
