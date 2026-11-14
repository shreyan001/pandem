"use client";

import { useState } from "react";
import { CatalogItem } from "@pandem/shared";
import { ScoreBadge, ScoringExplainer } from "./ScoringExplainer";

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

  // Simulated streak and TVL per product id for scoring engine demonstration
  const getProductMetrics = (id: string, index: number) => {
    const streaks: Record<string, number> = { "1": 12, "2": 9, "3": 6, "4": 4 };
    const tvls: Record<string, number> = { "1": 15, "2": 12, "3": 8, "4": 6 };
    return {
      streak: streaks[id] ?? (10 - index * 2),
      tvl: tvls[id] ?? (14 - index * 3),
    };
  };

  return (
    <div className="space-y-8">
      {/* Featured #1 Product of the Day Spotlight Card */}
      {productOfTheDay && (
        <div
          onClick={() => onSelectProduct(productOfTheDay)}
          className="relative rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/30 via-zinc-900 to-zinc-950 p-6 sm:p-8 cursor-pointer hover:border-emerald-500/50 transition-all shadow-xl hover:shadow-emerald-500/10 group"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-start gap-4 sm:gap-6">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center font-mono font-extrabold text-2xl sm:text-3xl text-black shadow-lg shadow-emerald-500/20 shrink-0 group-hover:scale-105 transition-transform">
                {productOfTheDay.name.charAt(0)}
              </div>
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    🏆 #1 Product of the Day
                  </span>

                  {/* Algorithmic Score Badge */}
                  <ScoreBadge
                    upvotes={upvotesState[productOfTheDay.id]?.count ?? productOfTheDay.upvotes ?? 348}
                    isTeeVerified={Boolean(productOfTheDay.teeHardware)}
                    streak={12}
                    tvl={15}
                  />

                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                    {productOfTheDay.teeHardware || "Intel TDX + NVIDIA H100"}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-zinc-800 text-zinc-400 border border-zinc-700">
                    {productOfTheDay.category}
                  </span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight group-hover:text-emerald-400 transition-colors">
                  {productOfTheDay.name}
                </h3>
                <p className="text-xs sm:text-sm text-zinc-300 max-w-2xl leading-relaxed">
                  {productOfTheDay.tagline}
                </p>
                <div className="flex items-center gap-3 text-xs font-mono text-zinc-400 pt-1">
                  <span>Price: <strong className="text-white">{productOfTheDay.price_display}</strong></span>
                  <span>•</span>
                  <span>Period: <strong className="text-zinc-300">{productOfTheDay.period_display}</strong></span>
                  <span>•</span>
                  <span>Steward: <strong className="text-emerald-400">{productOfTheDay.steward?.slice(0, 16)}...</strong></span>
                </div>
              </div>
            </div>

            {/* Right side CTA & Upvote */}
            <div className="flex items-center sm:self-center gap-3 shrink-0">
              <button
                onClick={(e) => handleUpvote(e, productOfTheDay.id)}
                className={`flex flex-col items-center justify-center w-16 h-20 rounded-2xl border transition-all ${
                  upvotesState[productOfTheDay.id]?.voted
                    ? "bg-emerald-500 text-black border-emerald-400 font-bold shadow-lg shadow-emerald-500/20"
                    : "bg-zinc-900 border-zinc-700 hover:border-emerald-500/40 text-zinc-300 hover:text-white"
                }`}
                title="Upvote product"
              >
                <span className="text-base leading-none">▲</span>
                <span className="font-mono text-xs font-bold mt-1">
                  {upvotesState[productOfTheDay.id]?.count ?? productOfTheDay.upvotes}
                </span>
                <span className="text-[9px] uppercase tracking-wider font-mono opacity-80">
                  {upvotesState[productOfTheDay.id]?.voted ? "Upvoted" : "Upvote"}
                </span>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectProduct(productOfTheDay);
                }}
                className="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs sm:text-sm font-mono transition-colors shadow-lg shadow-emerald-500/20 whitespace-nowrap"
              >
                Inspect TEE & Subscribe →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter, Time Controls and Scoring Engine Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-zinc-800">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-colors shrink-0 ${
                selectedCategory === cat
                  ? "bg-zinc-200 text-black font-bold shadow-sm"
                  : "bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Time Tabs & Scoring Explainer Trigger */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setShowScoringExplainer(!showScoringExplainer)}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono border transition-all flex items-center gap-1.5 ${
              showScoringExplainer
                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 font-bold"
                : "bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200 border-zinc-800"
            }`}
          >
            <span>⚡ Scoring Engine</span>
            <span className="text-[10px] opacity-70">
              {showScoringExplainer ? "▲" : "▼"}
            </span>
          </button>

          <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
            {["Today", "This Week", "All Time"].map((tab) => (
              <button
                key={tab}
                onClick={() => setTimeFilter(tab)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors ${
                  timeFilter === tab
                    ? "bg-zinc-800 text-white font-semibold"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Collapsible Algorithmic Scoring Explainer */}
      {showScoringExplainer && (
        <div className="animate-fade-in">
          <ScoringExplainer />
        </div>
      )}

      {/* Leaderboard Feed */}
      <div className="space-y-3">
        {filteredProducts.map((p, idx) => {
          const rank = p.rank || idx + 1;
          const upvoteData = upvotesState[p.id] || { count: p.upvotes || 100, voted: false };
          const { streak, tvl } = getProductMetrics(p.id, idx);

          return (
            <div
              key={p.id}
              onClick={() => onSelectProduct(p)}
              className="group p-4 sm:p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 transition-all cursor-pointer flex items-center justify-between gap-4 shadow-sm hover:shadow-md"
            >
              {/* Left side: Rank + Avatar + Details */}
              <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                {/* Rank Badge */}
                <div className="flex flex-col items-center justify-center w-7 shrink-0">
                  <span className={`font-mono text-sm sm:text-base font-extrabold ${
                    rank === 1 ? "text-amber-400" : rank === 2 ? "text-zinc-300" : rank === 3 ? "text-amber-600" : "text-zinc-500 group-hover:text-emerald-400"
                  }`}>
                    #{rank}
                  </span>
                </div>

                {/* Monogram / Icon */}
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700 flex items-center justify-center font-mono font-bold text-lg text-white group-hover:border-emerald-500/40 transition-colors shrink-0">
                  {p.name.charAt(0)}
                </div>

                {/* Name, Tagline & Badges */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors truncate">
                      {p.name}
                    </h4>

                    {/* Algorithmic Composite Score Badge */}
                    <ScoreBadge
                      upvotes={upvoteData.count}
                      isTeeVerified={Boolean(p.teeHardware)}
                      streak={streak}
                      tvl={tvl}
                    />

                    {p.isProductOfTheDay && (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        Product of the Day
                      </span>
                    )}
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hidden sm:inline">
                      {p.teeHardware || "Hardware TEE"}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-400 truncate mt-0.5">
                    {p.tagline}
                  </p>

                  <div className="flex items-center gap-2 mt-1 text-[11px] font-mono text-zinc-500 flex-wrap">
                    <span className="text-emerald-400 font-semibold">{p.price_display}</span>
                    <span>/ {p.period_display}</span>
                    <span className="hidden sm:inline">•</span>
                    <span className="hidden sm:inline text-zinc-400">{p.category}</span>
                    <span className="hidden md:inline">•</span>
                    <span className="hidden md:inline text-zinc-500">
                      Streak: <strong className="text-zinc-300">{streak}</strong> · TVL: <strong className="text-zinc-300">{tvl} wN</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Right side: Upvote Button */}
              <button
                onClick={(e) => handleUpvote(e, p.id)}
                className={`flex flex-col items-center justify-center w-14 h-16 rounded-xl border transition-all shrink-0 ${
                  upvoteData.voted
                    ? "bg-emerald-500 text-black border-emerald-400 font-bold shadow-md shadow-emerald-500/20"
                    : "bg-zinc-950 border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white"
                }`}
              >
                <span className="text-xs leading-none">▲</span>
                <span className="font-mono text-xs font-bold mt-1">
                  {upvoteData.count}
                </span>
                <span className="text-[9px] uppercase tracking-wider font-mono opacity-80">
                  {upvoteData.voted ? "Voted" : "Upvote"}
                </span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
