"use client";

import React from "react";
import Link from "next/link";
import { EnrichedProduct } from "@pandem/shared";
import { AbstractLogo } from "../AbstractLogo";

interface ProductHeaderProps {
  product: EnrichedProduct;
  onSubscribeClick: () => void;
}

export function ProductHeader({ product, onSubscribeClick }: ProductHeaderProps) {
  return (
    <div className="p-6 sm:p-8 rounded-2xl bg-zinc-900/60 border border-zinc-800 shadow-2xl relative overflow-hidden backdrop-blur-sm">
      {/* Background radial glow */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />

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
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-zinc-800 text-zinc-300 border border-zinc-700">
                {product.suite}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {product.heartbeat_streak}-Period Heartbeat Streak
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                {product.tee_hardware}
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <span>{product.name}</span>
              <span className="text-xs font-mono font-normal px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-400 border border-zinc-700">
                Rank #{product.rank}
              </span>
            </h1>

            <p className="text-sm sm:text-base text-zinc-300 font-medium max-w-2xl">
              {product.tagline}
            </p>
          </div>
        </div>

        {/* Action & Score Pill */}
        <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-3 flex-shrink-0">
          <div className="flex items-center gap-3 bg-zinc-950/80 p-3 rounded-xl border border-zinc-800">
            <div className="text-right">
              <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Algorithmic Score</div>
              <div className="text-2xl font-mono font-bold text-emerald-400">{product.score}/100</div>
            </div>
            <div className="h-8 w-px bg-zinc-800" />
            <div className="text-right">
              <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">TEE Attestation</div>
              <div className="text-xs font-mono text-cyan-400 font-semibold">Verified NRAS</div>
            </div>
          </div>

          <button
            onClick={onSubscribeClick}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-sm transition-all shadow-lg shadow-emerald-500/10 active:scale-95"
          >
            Subscribe via Escrow
          </button>
        </div>
      </div>
    </div>
  );
}
