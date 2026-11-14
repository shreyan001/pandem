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

  const getProductMetrics = (id: string, index: number) => {
    const streaks: Record<string, number> = { "1": 12, "2": 9, "3": 6, "4": 4 };
    const tvls: Record<string, number> = { "1": 15, "2": 12, "3": 8, "4": 6 };
    return {
      streak: streaks[id] ?? (10 - index * 2),
      tvl: tvls[id] ?? (14 - index * 3),
    };
  };

  const getLaunchpadMeta = (p: CatalogItem, index: number) => {
    const hardware = p.teeHardware || (index % 2 === 0 ? "Intel TDX Enclave" : "NVIDIA H100 TEE");
    const model = p.teeModel || (index % 3 === 0 ? "DeepSeek V3 (671B)" : index % 3 === 1 ? "Qwen 2.5 (72B)" : "Llama 3.3 (70B)");
    const storage = index % 2 === 0 ? "Filecoin x402 / FastFS" : "Phala dstack / KMS";
    return { hardware, model, storage };
  };

  return (
    <div className="space-y-8">
      {/* Featured #1 Product of the Day Spotlight Card */}
      {productOfTheDay && (() => {
        const podMeta = getLaunchpadMeta(productOfTheDay, 0);
        return (
        <div
          onClick={() => onSelectProduct(productOfTheDay)}
          className="relative rounded-none border border-[#2E2E2E] bg-[#171717] p-6 sm:p-8 cursor-pointer hover:border-[#894DEF] transition-colors group shadow-lg"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-start gap-5">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-none bg-[#894DEF] border border-[#FAFAFA] flex items-center justify-center font-mono font-extrabold text-2xl sm:text-3xl text-[#FAFAFA] shrink-0">
                {productOfTheDay.name.charAt(0)}
              </div>
              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-none text-xs font-mono font-bold bg-[#262626] text-[#FAFAFA] border border-[#894DEF]">
                    🏆 #1 Product of the Day
                  </span>

                  {/* Algorithmic Score Badge */}
                  <ScoreBadge
                    upvotes={upvotesState[productOfTheDay.id]?.count ?? productOfTheDay.upvotes ?? 348}
                    isTeeVerified={Boolean(productOfTheDay.teeHardware)}
                    streak={12}
                    tvl={15}
                  />

                  {/* Hardware TEE Badge */}
                  <span className="px-2.5 py-0.5 rounded-none text-xs font-mono bg-[#171717] text-[#4ADE80] border border-[#2E2E2E] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-none bg-[#4ADE80] animate-pulse" />
                    <span>TEE: {podMeta.hardware}</span>
                  </span>

                  {/* AI Model Badge */}
                  <span className="px-2.5 py-0.5 rounded-none text-xs font-mono bg-[#171717] text-[#FAFAFA] border border-[#2E2E2E]">
                    ⚡ {podMeta.model}
                  </span>

                  {/* Storage Badge */}
                  <span className="px-2.5 py-0.5 rounded-none text-xs font-mono bg-[#171717] text-[#B8B8B8] border border-[#2E2E2E]">
                    📦 {podMeta.storage}
                  </span>

                  {/* Category Badge */}
                  <span className="px-2.5 py-0.5 rounded-none text-xs font-mono bg-[#0D0D0D] text-[#894DEF] border border-[#894DEF]/50 font-bold">
                    {productOfTheDay.category}
                  </span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-extrabold text-[#FAFAFA] tracking-tight group-hover:text-[#894DEF] transition-colors">
                  {productOfTheDay.name}
                </h3>
                <p className="text-xs sm:text-sm text-[#B8B8B8] max-w-2xl leading-relaxed">
                  {productOfTheDay.tagline}
                </p>

                <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-[#B8B8B8] pt-1">
                  <span>Price: <strong className="text-[#FAFAFA]">{productOfTheDay.price_display}</strong></span>
                  <span>•</span>
                  <span>Period: <strong className="text-[#FAFAFA]">{productOfTheDay.period_display}</strong></span>
                  <span>•</span>
                  <span>Steward: <strong className="text-[#894DEF]">{productOfTheDay.steward?.slice(0, 16)}...</strong></span>
                  <span>•</span>
                  <span className="text-[#4ADE80]">✓ 7-Day Misuse Lock</span>
                  <span>•</span>
                  <span className="text-[#FBBF24]">30% OpEx Autopay</span>
                </div>
              </div>
            </div>

            {/* Right side CTA & Upvote */}
            <div className="flex items-center sm:self-center gap-3 shrink-0">
              <button
                onClick={(e) => handleUpvote(e, productOfTheDay.id)}
                className={`flex flex-col items-center justify-center w-16 h-20 rounded-none border transition-colors ${
                  upvotesState[productOfTheDay.id]?.voted
                    ? "bg-[#894DEF] text-[#FAFAFA] border-[#FAFAFA] font-bold"
                    : "bg-[#0D0D0D] border-[#2E2E2E] hover:border-[#894DEF] text-[#B8B8B8] hover:text-[#FAFAFA]"
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
                className="px-6 py-3.5 rounded-none bg-[#894DEF] hover:bg-[#A273F2] text-[#FAFAFA] border border-[#FAFAFA] font-bold text-xs sm:text-sm font-mono transition-colors whitespace-nowrap"
              >
                Inspect TEE & Subscribe →
              </button>
            </div>
          </div>
        </div>
        );
      })()}

      {/* Filter, Time Controls and Scoring Engine Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-[#2E2E2E]">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-none text-xs font-mono font-medium transition-colors shrink-0 border ${
                selectedCategory === cat
                  ? "bg-[#894DEF] text-[#FAFAFA] border-[#FAFAFA] font-bold"
                  : "bg-[#171717] hover:bg-[#262626] text-[#B8B8B8] hover:text-[#FAFAFA] border-[#2E2E2E]"
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
            className={`px-3.5 py-2 rounded-none text-xs font-mono border transition-colors flex items-center gap-1.5 ${
              showScoringExplainer
                ? "bg-[#262626] text-[#FAFAFA] border-[#894DEF] font-bold"
                : "bg-[#171717] hover:bg-[#262626] text-[#B8B8B8] hover:text-[#FAFAFA] border-[#2E2E2E]"
            }`}
          >
            <span>⚡ Scoring Engine</span>
            <span className="text-[10px] text-[#894DEF]">
              {showScoringExplainer ? "▲" : "▼"}
            </span>
          </button>

          <div className="flex items-center gap-1 bg-[#0D0D0D] p-1 rounded-none border border-[#2E2E2E]">
            {["Today", "This Week", "All Time"].map((tab) => (
              <button
                key={tab}
                onClick={() => setTimeFilter(tab)}
                className={`px-3 py-1 rounded-none text-xs font-mono transition-colors ${
                  timeFilter === tab
                    ? "bg-[#262626] text-[#FAFAFA] font-semibold"
                    : "text-[#B8B8B8] hover:text-[#FAFAFA]"
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
        <div>
          <ScoringExplainer />
        </div>
      )}

      {/* Leaderboard Feed */}
      <div className="space-y-3">
        {filteredProducts.map((p, idx) => {
          const rank = p.rank || idx + 1;
          const upvoteData = upvotesState[p.id] || { count: p.upvotes || 100, voted: false };
          const { streak, tvl } = getProductMetrics(p.id, idx);
          const meta = getLaunchpadMeta(p, idx);

          return (
            <div
              key={p.id}
              onClick={() => onSelectProduct(p)}
              className="group p-5 rounded-none bg-[#171717] border border-[#2E2E2E] hover:border-[#894DEF] transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              {/* Left side: Rank + Avatar + Details */}
              <div className="flex items-start sm:items-center gap-4 flex-1 min-w-0">
                {/* Rank Badge */}
                <div className="flex flex-col items-center justify-center w-8 shrink-0 pt-1 sm:pt-0">
                  <span
                    className={`font-mono text-sm sm:text-base font-extrabold ${
                      rank === 1
                        ? "text-[#894DEF]"
                        : rank === 2
                        ? "text-[#FAFAFA]"
                        : rank === 3
                        ? "text-[#A273F2]"
                        : "text-[#6B6B6B] group-hover:text-[#FAFAFA]"
                    }`}
                  >
                    #{rank}
                  </span>
                </div>

                {/* Monogram / Icon */}
                <div className="w-12 h-12 rounded-none bg-[#262626] border border-[#2E2E2E] flex items-center justify-center font-mono font-bold text-lg text-[#FAFAFA] group-hover:border-[#894DEF] transition-colors shrink-0">
                  {p.name.charAt(0)}
                </div>

                {/* Name, Tagline & Badges */}
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-base font-bold text-[#FAFAFA] group-hover:text-[#894DEF] transition-colors truncate">
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
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-none bg-[#262626] text-[#894DEF] border border-[#894DEF]/40 font-bold">
                        Product of the Day
                      </span>
                    )}

                    {/* Launchpad Metadata Badges */}
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-none bg-[#0D0D0D] text-[#4ADE80] border border-[#2E2E2E] flex items-center gap-1">
                      <span className="w-1 h-1 rounded-none bg-[#4ADE80]" />
                      <span>{meta.hardware}</span>
                    </span>

                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-none bg-[#0D0D0D] text-[#FAFAFA] border border-[#2E2E2E] hidden md:inline">
                      ⚡ {meta.model}
                    </span>

                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-none bg-[#0D0D0D] text-[#B8B8B8] border border-[#2E2E2E] hidden lg:inline">
                      📦 {meta.storage}
                    </span>

                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-none bg-[#171717] text-[#894DEF] border border-[#2E2E2E] hidden sm:inline">
                      {p.category}
                    </span>
                  </div>

                  <p className="text-xs text-[#B8B8B8] truncate">
                    {p.tagline}
                  </p>

                  <div className="flex items-center gap-2 text-[11px] font-mono text-[#6B6B6B] flex-wrap pt-0.5">
                    <span className="text-[#FAFAFA] font-semibold">{p.price_display}</span>
                    <span>/ {p.period_display}</span>
                    <span className="hidden sm:inline">•</span>
                    <span className="hidden sm:inline text-[#B8B8B8]">{p.category}</span>
                    <span className="hidden md:inline">•</span>
                    <span className="hidden md:inline text-[#6B6B6B]">
                      Streak: <strong className="text-[#FAFAFA]">{streak}</strong> · TVL:{" "}
                      <strong className="text-[#FAFAFA]">{tvl} wN</strong>
                    </span>
                    <span className="hidden lg:inline">•</span>
                    <span className="hidden lg:inline text-[#4ADE80]">
                      Escrow: 47.5% Dev / 30% OpEx / 20% Shield
                    </span>
                  </div>
                </div>
              </div>

              {/* Right side: Upvote Button */}
              <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                <button
                  onClick={(e) => handleUpvote(e, p.id)}
                  className={`flex flex-col items-center justify-center w-14 h-16 rounded-none border transition-colors shrink-0 ${
                    upvoteData.voted
                      ? "bg-[#894DEF] text-[#FAFAFA] border-[#FAFAFA] font-bold"
                      : "bg-[#0D0D0D] border-[#2E2E2E] hover:border-[#894DEF] text-[#B8B8B8] hover:text-[#FAFAFA]"
                  }`}
                  title="Upvote product"
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
            </div>
          );
        })}
      </div>
    </div>
  );
}
