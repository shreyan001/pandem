"use client";

import React from "react";
import { EnrichedProduct } from "@pandem/shared";
import { AbstractLogo } from "../AbstractLogo";

interface ProductHeaderProps {
  product: EnrichedProduct;
  onSubscribeClick: () => void;
}

export function ProductHeader({ product, onSubscribeClick }: ProductHeaderProps) {
  return (
    <div className="p-6 sm:p-8 rounded-none bg-[#171717] border border-[#2E2E2E] relative overflow-hidden">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
        <div className="flex items-start gap-5">
          {/* Monochrome Abstract Protocol Diagram Logo */}
          <AbstractLogo
            slug={product.slug}
            name={product.name}
            className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0"
            size={72}
          />

          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-none text-[11px] font-mono font-medium bg-[#0D0D0D] text-[#B8B8B8] border border-[#2E2E2E]">
                {product.suite}
              </span>
              <span className="px-2.5 py-0.5 rounded-none text-[11px] font-mono font-medium bg-[#262626] text-[#FAFAFA] border border-[#2E2E2E] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-none bg-[#894DEF]" />
                {product.heartbeat_streak}-Period Heartbeat Streak
              </span>
              <span className="px-2.5 py-0.5 rounded-none text-[11px] font-mono font-medium bg-[#262626] text-[#894DEF] border border-[#2E2E2E]">
                {product.tee_hardware}
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-[#FAFAFA] tracking-tight flex items-center gap-3">
              <span>{product.name}</span>
              <span className="text-xs font-mono font-normal px-2.5 py-1 rounded-none bg-[#0D0D0D] text-[#B8B8B8] border border-[#2E2E2E]">
                Rank #{product.rank}
              </span>
            </h1>

            <p className="text-sm sm:text-base text-[#B8B8B8] font-medium max-w-2xl">
              {product.tagline}
            </p>
          </div>
        </div>

        {/* Action & Score Pill */}
        <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-3 flex-shrink-0">
          <div className="flex items-center gap-3 bg-[#0D0D0D] p-3.5 rounded-none border border-[#2E2E2E]">
            <div className="text-right">
              <div className="text-[10px] font-mono text-[#6B6B6B] uppercase tracking-wider">Algorithmic Score</div>
              <div className="text-2xl font-mono font-bold text-[#894DEF]">{product.score}/100</div>
            </div>
            <div className="h-8 w-px bg-[#2E2E2E]" />
            <div className="text-right">
              <div className="text-[10px] font-mono text-[#6B6B6B] uppercase tracking-wider">TEE Attestation</div>
              <div className="text-xs font-mono text-[#FAFAFA] font-semibold">Verified NRAS</div>
            </div>
          </div>

          <button
            onClick={onSubscribeClick}
            className="w-full sm:w-auto px-6 py-3 rounded-none bg-[#894DEF] hover:bg-[#A273F2] text-[#FAFAFA] border border-[#FAFAFA] font-semibold text-sm transition-colors"
          >
            Subscribe via Escrow
          </button>
        </div>
      </div>
    </div>
  );
}
