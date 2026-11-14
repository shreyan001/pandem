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
    <div className="rounded-none border border-[#2E2E2E] bg-[#171717] p-6 flex flex-col justify-between hover:border-[#894DEF] transition-colors group">
      <div>
        {/* Category & Status */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-mono font-medium px-2.5 py-1 rounded-none bg-[#0D0D0D] text-[#B8B8B8] border border-[#2E2E2E]">
            {item.category}
          </span>
          <span
            className={`text-xs font-mono px-2 py-0.5 rounded-none flex items-center gap-1.5 border ${
              isActive
                ? "bg-[#262626] text-[#FAFAFA] border-[#894DEF]"
                : "bg-[#262626] text-[#B8B8B8] border-[#2E2E2E]"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-none ${
                isActive ? "bg-[#894DEF]" : "bg-[#6B6B6B]"
              }`}
            />
            {displayStatus}
          </span>
        </div>

        {/* Product Name & Tagline */}
        <h3 className="text-xl font-bold text-[#FAFAFA] group-hover:text-[#894DEF] transition-colors">
          {item.name}
        </h3>
        <p className="text-xs text-[#B8B8B8] mt-1 line-clamp-2">
          {item.tagline}
        </p>

        {/* Price & Period display */}
        <div className="mt-5 p-3.5 rounded-none bg-[#0D0D0D] border border-[#2E2E2E] flex items-baseline justify-between">
          <div>
            <span className="text-2xl font-bold font-mono text-[#FAFAFA]">
              {item.price_display}
            </span>
            <span className="text-xs text-[#B8B8B8] font-mono ml-1.5">
              / {item.period_display}
            </span>
          </div>
          <div className="text-[11px] font-mono text-[#6B6B6B] text-right">
            grace: {item.grace_display}
          </div>
        </div>

        {/* Live On-Chain Telemetry */}
        {onChainState && (
          <div className="mt-3 py-2.5 px-3 rounded-none bg-[#0D0D0D] border border-[#2E2E2E] text-[11px] font-mono text-[#B8B8B8] space-y-1">
            <div className="flex justify-between">
              <span className="text-[#6B6B6B]">On-Chain Heartbeat:</span>
              <span className="text-[#894DEF] font-semibold">
                Period #{onChainState.last_heartbeat_period}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B6B6B]">Ops / Contingency:</span>
              <span className="text-[#FAFAFA]">
                {onChainState.ops_reserve !== "0" || onChainState.contingency_reserve !== "0"
                  ? "Reserves Funded"
                  : "Standby"}
              </span>
            </div>
          </div>
        )}

        {/* Features Checklist */}
        <ul className="mt-5 space-y-2 text-xs text-[#B8B8B8]">
          {item.features.map((feat, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="text-[#894DEF] font-bold shrink-0">✓</span>
              <span>{feat}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Subscribe Button */}
      <div className="mt-6 pt-4 border-t border-[#2E2E2E]">
        <button
          onClick={() => onSubscribe(item)}
          className="w-full py-3 rounded-none bg-[#894DEF] hover:bg-[#A273F2] text-[#FAFAFA] border border-[#FAFAFA] font-semibold text-sm transition-colors flex items-center justify-center gap-2"
        >
          <span>Subscribe via Escrow</span>
          <span className="font-mono text-xs opacity-90">→</span>
        </button>
      </div>
    </div>
  );
}
