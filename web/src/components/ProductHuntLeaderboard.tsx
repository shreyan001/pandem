"use client";

import React, { useState } from "react";
import { CatalogItem } from "@pandem/shared";
import { ScoreBadge, ScoringExplainer } from "./ScoringExplainer";
import { AbstractLogo } from "./AbstractLogo";
import { Badge, Button, Card } from "../ui";
import {
  Trophy,
  ChevronUp,
  Database,
  Layers,
  ChevronDown,
} from "lucide-react";

interface ProductHuntLeaderboardProps {
  products: CatalogItem[];
  onSelectProduct: (product: CatalogItem) => void;
}

const KNOWN_COVERS: Record<string, string> = {
  "open-webui": "/covers/open-webui.png",
  "localai": "/covers/localai.png",
  "searxng": "/covers/searxng.png",
  "vaultwarden": "/covers/vaultwarden.png",
  "immich": "/covers/immich.png",
  "nextcloud": "/covers/nextcloud.png",
};

function getProductCover(slug?: string, id?: string): string | null {
  const s = (slug || id || "").toLowerCase().replace(/[^a-z0-9-]/g, "");
  for (const key of Object.keys(KNOWN_COVERS)) {
    if (s.includes(key)) return KNOWN_COVERS[key];
  }
  return null;
}

export function ProductHuntLeaderboard({
  products,
  onSelectProduct,
}: ProductHuntLeaderboardProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [timeFilter, setTimeFilter] = useState<string>("Today");
  const [showScoringExplainer, setShowScoringExplainer] = useState<boolean>(false);
  const [upvotesState, setUpvotesState] = useState<Record<string, { count: number; voted: boolean }>>(() => {
    const init: Record<string, { count: number; voted: boolean }> = {};
    products.forEach((p) => {
      init[p.id] = { count: p.upvotes || 100, voted: false };
    });
    return init;
  });

  const categories = ["All", "Confidential AI", "Zero-Knowledge", "Developer Tools"];

  const filteredProducts = products.filter((p) => {
    if (selectedCategory === "All") return true;
    return p.category.toLowerCase().includes(selectedCategory.toLowerCase());
  });

  const productOfTheDay = products.find((p) => p.isProductOfTheDay) || products[0];

  const handleUpvote = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setUpvotesState((prev) => {
      const cur = prev[id] || { count: 100, voted: false };
      const voted = !cur.voted;
      const count = voted ? cur.count + 1 : cur.count - 1;
      return { ...prev, [id]: { count, voted } };
    });
  };

  const getProductMetrics = (id: string, index: number) => {
    const streaks: Record<string, number> = { "1": 12, "2": 9, "3": 6, "4": 4 };
    const tvls: Record<string, number> = { "1": 15, "2": 12, "3": 8, "4": 6 };
    return {
      streak: streaks[id] ?? (10 - index * 2),
      tvl: tvls[id] ?? (14 - index * 3),
    };
  };

  const getStackPrivacyAudit = (p: CatalogItem, index: number) => {
    const frontend = index % 2 === 0 ? "Frontend: Filecoin Pin" : "Frontend: FastFS CID";
    const backend = "Node: Isolated Runtime";
    const database = "Database: KMS Sealed";
    return { frontend, backend, database };
  };

  return (
    <div className="space-y-6 font-sans">
      {/* 1. Featured Product Spotlight Card with 16:9 Banner */}
      {productOfTheDay && (() => {
        const podAudit = getStackPrivacyAudit(productOfTheDay, 0);
        const upvoteData = upvotesState[productOfTheDay.id] || {
          count: productOfTheDay.upvotes || 348,
          voted: false,
        };
        const coverUrl = getProductCover((productOfTheDay as any).slug || productOfTheDay.id, productOfTheDay.id);

        return (
          <Card
            onClick={() => onSelectProduct(productOfTheDay)}
            className="group relative bg-spectr-surface border-spectr-hairline hover:border-spectr-muted transition-all cursor-pointer overflow-hidden rounded-none"
          >
            {/* 16:9 Cover Banner */}
            {coverUrl ? (
              <div className="relative aspect-[16/9] max-h-72 w-full overflow-hidden bg-spectr-surface border-b border-spectr-hairline rounded-none">
                <img
                  src={coverUrl}
                  alt={productOfTheDay.name}
                  className="w-full h-full object-cover object-center rounded-none"
                />
              </div>
            ) : (
              <div className="relative aspect-[16/9] max-h-48 w-full overflow-hidden bg-gradient-to-br from-spectr-surface-raised via-spectr-surface to-spectr-canvas border-b border-spectr-hairline flex items-center justify-center rounded-none">
                <AbstractLogo slug={(productOfTheDay as any).slug || productOfTheDay.id} name={productOfTheDay.name} size={64} />
              </div>
            )}

            {/* Feature Content Body */}
            <div className="p-5 sm:p-7">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-start gap-4 sm:gap-5">
                  <AbstractLogo
                    slug={(productOfTheDay as any).slug || productOfTheDay.id}
                    name={productOfTheDay.name}
                    size={48}
                    className="shrink-0 hidden sm:inline-flex"
                  />

                  <div className="space-y-2 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="primary">
                        <Trophy className="w-3 h-3 text-spectr-primary mr-1" aria-hidden="true" />
                        <span>Product of the Day</span>
                      </Badge>

                      <ScoreBadge
                        upvotes={upvoteData.count}
                        isTeeVerified={Boolean(productOfTheDay.teeHardware)}
                        streak={12}
                        tvl={15}
                      />

                      <Badge variant="success" dot>
                        {podAudit.frontend}
                      </Badge>

                      <Badge variant="default" className="hidden sm:inline-flex">
                        {podAudit.backend}
                      </Badge>
                    </div>

                    <h3 className="text-xl sm:text-2xl font-bold text-spectr-ink tracking-tight group-hover:text-spectr-primary transition-colors font-sans">
                      {productOfTheDay.name}
                    </h3>

                    <p className="text-xs sm:text-sm text-spectr-body max-w-2xl leading-relaxed font-sans line-clamp-2">
                      {productOfTheDay.tagline}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-spectr-muted pt-1 font-mono">
                      <span>Price: <span className="font-mono text-spectr-ink font-bold tabular-nums">{productOfTheDay.price_display}</span></span>
                      <span>·</span>
                      <span>Billing: <span className="text-spectr-ink">{productOfTheDay.period_display}</span></span>
                      <span>·</span>
                      <span>Steward: <span className="text-spectr-primary">{productOfTheDay.steward?.slice(0, 16)}...</span></span>
                      <span className="hidden sm:inline">·</span>
                      <span className="text-spectr-success hidden sm:inline">7-Day Refund Escrow</span>
                    </div>
                  </div>
                </div>

                {/* Fixed Upvote Button (40x48) + Primary CTA */}
                <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
                  <button
                    type="button"
                    onClick={(e) => handleUpvote(e, productOfTheDay.id)}
                    className={`flex flex-col items-center justify-center w-10 h-12 rounded-none border font-mono transition-colors focus:outline-none focus:ring-1 focus:ring-spectr-primary shrink-0 ${
                      upvoteData.voted
                        ? "bg-spectr-primary text-spectr-ink border-spectr-primary"
                        : "bg-spectr-surface-raised border-spectr-hairline hover:border-spectr-primary text-spectr-body hover:text-spectr-ink"
                    }`}
                    aria-label={`Upvote ${productOfTheDay.name}`}
                    title="Upvote product"
                  >
                    <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
                    <span className="font-mono text-xs font-bold mt-0.5 tabular-nums">
                      {upvoteData.count}
                    </span>
                  </button>

                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectProduct(productOfTheDay);
                    }}
                  >
                    Inspect Enclave & Subscribe
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        );
      })()}

      {/* Filter and Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1" role="tablist" aria-label="Category Filters">
          {categories.map((cat) => (
            <button
              type="button"
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-mono font-medium rounded-none transition-colors border ${
                selectedCategory === cat
                  ? "bg-spectr-surface-raised text-spectr-ink border-spectr-primary font-bold"
                  : "bg-spectr-surface text-spectr-muted hover:text-spectr-ink border-spectr-hairline"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowScoringExplainer(!showScoringExplainer)}
            className={`px-3 py-1.5 text-xs font-mono font-medium border rounded-none transition-colors flex items-center gap-1.5 ${
              showScoringExplainer
                ? "bg-spectr-surface-raised text-spectr-ink border-spectr-primary"
                : "bg-spectr-surface text-spectr-body hover:text-spectr-ink border-spectr-hairline"
            }`}
            aria-expanded={showScoringExplainer}
          >
            <Layers className="w-3.5 h-3.5 text-spectr-primary" aria-hidden="true" />
            <span>Scoring Engine</span>
            {showScoringExplainer ? (
              <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
            )}
          </button>

          <div className="flex items-center gap-1 bg-spectr-surface p-1 border border-spectr-hairline rounded-none font-mono text-xs">
            {["Today", "This Week", "All Time"].map((tab) => (
              <button
                type="button"
                key={tab}
                onClick={() => setTimeFilter(tab)}
                className={`px-2.5 py-1 text-xs rounded-none transition-colors ${
                  timeFilter === tab
                    ? "bg-spectr-surface-raised text-spectr-ink font-bold"
                    : "text-spectr-muted hover:text-spectr-ink"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Scoring Explainer Panel */}
      {showScoringExplainer && (
        <div>
          <ScoringExplainer />
        </div>
      )}

      {/* 2. Dense Ranked Feed Rows */}
      <div className="space-y-2">
        {filteredProducts.map((p, idx) => {
          const rank = p.rank || idx + 1;
          const upvoteData = upvotesState[p.id] || { count: p.upvotes || 100, voted: false };
          const { streak, tvl } = getProductMetrics(p.id, idx);
          const audit = getStackPrivacyAudit(p, idx);

          return (
            <div
              key={p.id}
              onClick={() => onSelectProduct(p)}
              className="group p-3 sm:p-4 bg-spectr-surface border border-spectr-hairline hover:border-spectr-muted hover:bg-spectr-surface-raised transition-all cursor-pointer flex items-center justify-between gap-3 sm:gap-4 rounded-none"
            >
              <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                {/* Rank Badge */}
                <span
                  className={`w-7 text-center font-mono text-xs font-bold tabular-nums shrink-0 ${
                    rank === 1
                      ? "text-spectr-primary"
                      : rank === 2
                      ? "text-spectr-ink"
                      : "text-spectr-muted"
                  }`}
                >
                  #{rank}
                </span>

                {/* 40-48px Logo */}
                <AbstractLogo
                  slug={(p as any).slug || p.id}
                  name={p.name}
                  size={44}
                  className="shrink-0"
                />

                {/* Info Container */}
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm sm:text-base font-bold text-spectr-ink group-hover:text-spectr-primary transition-colors truncate font-sans">
                      {p.name}
                    </h4>

                    <ScoreBadge
                      upvotes={upvoteData.count}
                      isTeeVerified={Boolean(p.teeHardware)}
                      streak={streak}
                      tvl={tvl}
                    />

                    <Badge variant="category" className="hidden sm:inline-flex">
                      {p.category}
                    </Badge>

                    <Badge variant="success" dot className="hidden md:inline-flex">
                      {audit.frontend}
                    </Badge>
                  </div>

                  {/* One-line Tagline (body-xs) */}
                  <p className="text-xs text-spectr-body truncate font-sans">
                    {p.tagline}
                  </p>

                  {/* Mono Price & Streak Line */}
                  <div className="flex items-center gap-2 text-xs text-spectr-muted font-mono flex-wrap">
                    <span className="font-mono text-xs text-spectr-ink font-bold tabular-nums">
                      {p.price_display}
                    </span>
                    <span>/ {p.period_display}</span>
                    <span>·</span>
                    <span className="text-spectr-success">{streak}d streak</span>
                    <span className="hidden sm:inline">·</span>
                    <span className="hidden sm:inline text-spectr-muted">TVL {tvl} wNEAR</span>
                  </div>
                </div>
              </div>

              {/* Fixed 40x48 Upvote Button on Right */}
              <div className="shrink-0 pl-1">
                <button
                  type="button"
                  onClick={(e) => handleUpvote(e, p.id)}
                  className={`flex flex-col items-center justify-center w-10 h-12 rounded-none border font-mono transition-colors focus:outline-none focus:ring-1 focus:ring-spectr-primary ${
                    upvoteData.voted
                      ? "bg-spectr-primary text-spectr-ink border-spectr-primary"
                      : "bg-spectr-surface-raised border-spectr-hairline hover:border-spectr-primary text-spectr-body hover:text-spectr-ink"
                  }`}
                  aria-label={`Upvote ${p.name}`}
                  title="Upvote product"
                >
                  <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
                  <span className="font-mono text-xs font-bold mt-0.5 tabular-nums">
                    {upvoteData.count}
                  </span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
