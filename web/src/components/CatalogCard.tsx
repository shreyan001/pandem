"use client";

import { useEffect, useState } from "react";
import { CatalogItem } from "@pandem/shared";
import { PANDEM_ESCROW_ID } from "@pandem/shared";
import { callViewMethod } from "../lib/nearRpc";

interface CatalogCardProps {
  item: CatalogItem;
  onSubscribe: (item: CatalogItem) => void;
}

export function CatalogCard({ item, onSubscribe }: CatalogCardProps) {
  const [onChainState, setOnChainState] = useState<{
    status: string;
    last_heartbeat_period: number;
    ops_reserve: string;
    contingency_reserve: string;
  } | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchLiveState = async () => {
      try {
        const parsed = await callViewMethod<{
          status: string;
          last_heartbeat_period: number;
          ops_reserve: string;
          contingency_reserve: string;
        }>(PANDEM_ESCROW_ID, "get_product", { id: Number(item.id) });

        if (isMounted && parsed) {
          setOnChainState(parsed);
        }
      } catch {
        // Fallback to static catalog item status
      }
    };

    fetchLiveState();
    return () => {
      isMounted = false;
    };
  }, [item.id]);

  const displayStatus = onChainState?.status || item.status;
  const isActive = displayStatus === "Active";

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 flex flex-col justify-between hover:border-zinc-700 transition-all hover:shadow-xl hover:shadow-emerald-500/5 group">
      <div>
        {/* Category & Status */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-mono font-medium px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
            {item.category}
          </span>
          <span
            className={`text-xs font-mono px-2 py-0.5 rounded-full flex items-center gap-1.5 border ${
              isActive
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                : "bg-amber-500/10 text-amber-400 border-amber-500/30"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isActive ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
              }`}
            />
            {displayStatus}
          </span>
        </div>

        {/* Product Name & Tagline */}
        <h3 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors">
          {item.name}
        </h3>
        <p className="text-xs text-zinc-400 mt-1 line-clamp-2">
          {item.tagline}
        </p>

        {/* Price & Period display */}
        <div className="mt-5 p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80 flex items-baseline justify-between">
          <div>
            <span className="text-2xl font-bold font-mono text-white">
              {item.price_display}
            </span>
            <span className="text-xs text-zinc-400 font-mono ml-1.5">
              / {item.period_display}
            </span>
          </div>
          <div className="text-[11px] font-mono text-zinc-500 text-right">
            grace: {item.grace_display}
          </div>
        </div>

        {/* Live On-Chain Telemetry */}
        {onChainState && (
          <div className="mt-3 py-2 px-3 rounded-lg bg-emerald-950/20 border border-emerald-900/30 text-[11px] font-mono text-zinc-400 space-y-1">
            <div className="flex justify-between">
              <span className="text-zinc-500">On-Chain Heartbeat:</span>
              <span className="text-emerald-400">
                Period #{onChainState.last_heartbeat_period}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Ops / Contingency:</span>
              <span className="text-zinc-300">
                {onChainState.ops_reserve !== "0" || onChainState.contingency_reserve !== "0"
                  ? "Reserves Funded"
                  : "Standby"}
              </span>
            </div>
          </div>
        )}

        {/* Features Checklist */}
        <ul className="mt-5 space-y-2 text-xs text-zinc-300">
          {item.features.map((feat, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold shrink-0">✓</span>
              <span>{feat}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Subscribe Button */}
      <div className="mt-6 pt-4 border-t border-zinc-800">
        <button
          onClick={() => onSubscribe(item)}
          className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-sm transition-all shadow-md shadow-emerald-500/10 flex items-center justify-center gap-2 group-hover:scale-[1.01]"
        >
          <span>Subscribe via Escrow</span>
          <span className="font-mono text-xs opacity-75">→</span>
        </button>
      </div>
    </div>
  );
}
