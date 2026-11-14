"use client";

import { useState } from "react";
import { CatalogItem } from "@pandem/shared";
import { ScoreBadge, ScoringExplainer } from "./ScoringExplainer";
import {
  Trophy,
  Zap,
  Database,
  ChevronUp,
  ShieldCheck,
  Cpu,
  Layers,
  ChevronDown,
} from "lucide-react";

interface ProductHuntLeaderboardProps {
  products: CatalogItem[];
  onSelectProduct: (product: CatalogItem) => void;
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
    const escrow = "7-Day Refund Escrow";
    return { frontend, backend, database, escrow };
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Featured Product Spotlight Card */}
      {productOfTheDay && (() => {
        const podAudit = getStackPrivacyAudit(productOfTheDay, 0);
        const upvoteData = upvotesState[productOfTheDay.id] || {
          count: productOfTheDay.upvotes || 348,
          voted: false,
        };

        return (
          <div
            onClick={() => onSelectProduct(productOfTheDay)}
            className="group relative bg-[#141414] border border-[#222222] hover:border-[#383838] hover:bg-[#181818] p-6 sm:p-7 transition-colors cursor-pointer"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex items-start gap-5">
                <div className="w-14 h-14 bg-[#1A1A1A] border border-[#2A2A2A] group-hover:border-[#894DEF] flex items-center justify-center font-bold text-xl text-[#FAFAFA] shrink-0 transition-colors">
                  {productOfTheDay.name.charAt(0)}
                </div>

                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium bg-[#1F172B] text-[#C084FC] border border-[#894DEF]/30">
                      <Trophy className="w-3 h-3 text-[#C084FC]" aria-hidden="true" />
                      <span>Product of the Day</span>
                    </span>

                    <ScoreBadge
                      upvotes={upvoteData.count}
                      isTeeVerified={Boolean(productOfTheDay.teeHardware)}
                      streak={12}
                      tvl={15}
                    />

                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs text-[#22C55E] bg-[#141F18] border border-[#22C55E]/30">
                      <span className="w-1.5 h-1.5 bg-[#22C55E]" aria-hidden="true" />
                      <span>{podAudit.frontend}</span>
                    </span>

                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs text-[#FAFAFA] bg-[#181818] border border-[#2A2A2A]">
                      <span className="w-1.5 h-1.5 bg-[#894DEF]" aria-hidden="true" />
                      <span>{podAudit.backend}</span>
                    </span>

                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs text-[#A1A1A1] bg-[#181818] border border-[#2A2A2A] hidden sm:inline-flex">
                      <Database className="w-3 h-3" aria-hidden="true" />
                      <span>{podAudit.database}</span>
                    </span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-semibold text-[#FAFAFA] tracking-tight group-hover:text-[#C084FC] transition-colors">
                    {productOfTheDay.name}
                  </h3>

                  <p className="text-sm text-[#A1A1A1] max-w-2xl leading-relaxed">
                    {productOfTheDay.tagline}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-[#737373] pt-1">
                    <span>Price: <span className="font-mono text-[#FAFAFA] tabular-nums">{productOfTheDay.price_display}</span></span>
                    <span>·</span>
                    <span>Billing: <span className="font-mono text-[#FAFAFA]">{productOfTheDay.period_display}</span></span>
                    <span>·</span>
                    <span>Steward: <span className="font-mono text-[#894DEF]">{productOfTheDay.steward?.slice(0, 16)}...</span></span>
                    <span>·</span>
                    <span className="text-[#22C55E]">7-Day Misuse Protection</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
                <button
                  type="button"
                  onClick={(e) => handleUpvote(e, productOfTheDay.id)}
                  className={`flex flex-col items-center justify-center w-14 h-16 border transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#894DEF] ${
                    upvoteData.voted
                      ? "bg-[#894DEF] text-white border-[#894DEF]"
                      : "bg-[#181818] border-[#2A2A2A] hover:border-[#894DEF] text-[#A1A1A1] hover:text-[#FAFAFA]"
                  }`}
                  aria-label={`Upvote ${productOfTheDay.name}`}
                  title="Upvote product"
                >
                  <ChevronUp className="w-4 h-4" aria-hidden="true" />
                  <span className="font-mono text-xs font-semibold mt-0.5 tabular-nums">
                    {upvoteData.count}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider font-sans opacity-70">
                    {upvoteData.voted ? "Voted" : "Vote"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectProduct(productOfTheDay);
                  }}
                  className="px-5 py-3.5 bg-[#894DEF] hover:bg-[#7839DF] text-white text-xs sm:text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#894DEF]"
                >
                  Inspect Enclave & Subscribe
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Filter and Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1" role="tablist" aria-label="Category Filters">
          {categories.map((cat) => (
            <button
              type="button"
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors border focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#894DEF] ${
                selectedCategory === cat
                  ? "bg-[#1A1A1A] text-[#FAFAFA] border-[#894DEF]"
                  : "bg-[#141414] text-[#737373] hover:text-[#FAFAFA] border-[#222222] hover:border-[#2A2A2A]"
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
            className={`px-3 py-1.5 text-xs font-medium border transition-colors flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#894DEF] ${
              showScoringExplainer
                ? "bg-[#1A1A1A] text-[#FAFAFA] border-[#894DEF]"
                : "bg-[#141414] text-[#A1A1A1] hover:text-[#FAFAFA] border-[#222222] hover:border-[#2A2A2A]"
            }`}
            aria-expanded={showScoringExplainer}
          >
            <Layers className="w-3.5 h-3.5 text-[#894DEF]" aria-hidden="true" />
            <span>Scoring Engine</span>
            {showScoringExplainer ? (
              <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
            )}
          </button>

          <div className="flex items-center gap-1 bg-[#141414] p-1 border border-[#222222]">
            {["Today", "This Week", "All Time"].map((tab) => (
              <button
                type="button"
                key={tab}
                onClick={() => setTimeFilter(tab)}
                className={`px-2.5 py-1 text-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#894DEF] ${
                  timeFilter === tab
                    ? "bg-[#1E1E1E] text-[#FAFAFA] font-medium"
                    : "text-[#737373] hover:text-[#FAFAFA]"
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

      {/* Leaderboard Product Feed */}
      <div className="space-y-2.5">
        {filteredProducts.map((p, idx) => {
          const rank = p.rank || idx + 1;
          const upvoteData = upvotesState[p.id] || { count: p.upvotes || 100, voted: false };
          const { streak, tvl } = getProductMetrics(p.id, idx);
          const audit = getStackPrivacyAudit(p, idx);

          return (
            <div
              key={p.id}
              onClick={() => onSelectProduct(p)}
              className="group p-4 sm:p-5 bg-[#141414] border border-[#222222] hover:border-[#383838] hover:bg-[#181818] transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start sm:items-center gap-4 flex-1 min-w-0">
                <div className="flex flex-col items-center justify-center w-6 shrink-0 pt-1 sm:pt-0">
                  <span
                    className={`font-mono text-sm font-semibold tabular-nums ${
                      rank === 1
                        ? "text-[#C084FC]"
                        : rank === 2
                        ? "text-[#FAFAFA]"
                        : rank === 3
                        ? "text-[#A1A1A1]"
                        : "text-[#525252]"
                    }`}
                  >
                    #{rank}
                  </span>
                </div>

                <div className="w-11 h-11 bg-[#1A1A1A] border border-[#2A2A2A] group-hover:border-[#894DEF] flex items-center justify-center font-bold text-base text-[#FAFAFA] shrink-0 transition-colors">
                  {p.name.charAt(0)}
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-base font-semibold text-[#FAFAFA] group-hover:text-[#C084FC] transition-colors truncate">
                      {p.name}
                    </h4>

                    <ScoreBadge
                      upvotes={upvoteData.count}
                      isTeeVerified={Boolean(p.teeHardware)}
                      streak={streak}
                      tvl={tvl}
                    />

                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] text-[#22C55E] bg-[#141F18] border border-[#22C55E]/30">
                      <span className="w-1.5 h-1.5 bg-[#22C55E]" aria-hidden="true" />
                      <span>{audit.frontend}</span>
                    </span>

                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] text-[#FAFAFA] bg-[#181818] border border-[#2A2A2A] hidden sm:inline-flex">
                      <span className="w-1.5 h-1.5 bg-[#894DEF]" aria-hidden="true" />
                      <span>{audit.backend}</span>
                    </span>

                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] text-[#737373] bg-[#181818] border border-[#2A2A2A] hidden lg:inline-flex">
                      <Database className="w-3 h-3" aria-hidden="true" />
                      <span>{audit.database}</span>
                    </span>
                  </div>

                  <p className="text-xs text-[#A1A1A1] truncate">
                    {p.tagline}
                  </p>

                  <div className="flex items-center gap-2 text-xs text-[#737373] flex-wrap pt-0.5">
                    <span className="font-mono text-[#FAFAFA] font-medium tabular-nums">{p.price_display}</span>
                    <span>/ {p.period_display}</span>
                    <span>·</span>
                    <span className="text-[#A1A1A1]">{p.category}</span>
                    <span>·</span>
                    <span>Streak: <span className="font-mono text-[#FAFAFA] tabular-nums">{streak}</span></span>
                    <span>·</span>
                    <span>Escrow TVL: <span className="font-mono text-[#FAFAFA] tabular-nums">{tvl} wNEAR</span></span>
                  </div>
                </div>
              </div>

              {/* Upvote Button */}
              <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                <button
                  type="button"
                  onClick={(e) => handleUpvote(e, p.id)}
                  className={`flex flex-col items-center justify-center w-12 h-14 border transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#894DEF] ${
                    upvoteData.voted
                      ? "bg-[#894DEF] text-white border-[#894DEF]"
                      : "bg-[#181818] border-[#2A2A2A] hover:border-[#894DEF] text-[#A1A1A1] hover:text-[#FAFAFA]"
                  }`}
                  aria-label={`Upvote ${p.name}`}
                  title="Upvote product"
                >
                  <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
                  <span className="font-mono text-xs font-semibold mt-0.5 tabular-nums">
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
