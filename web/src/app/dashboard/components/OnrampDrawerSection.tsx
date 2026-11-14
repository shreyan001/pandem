"use client";

import React, { useState } from "react";
import { OnrampQuotePanel } from "../../../components/OnrampQuotePanel";
import { Card } from "../../../ui";

export const OnrampDrawerSection: React.FC = () => {
  const [showOnramp, setShowOnramp] = useState<boolean>(false);

  return (
    <Card className="rounded-none border border-spectr-hairline bg-spectr-surface overflow-hidden">
      <button
        type="button"
        onClick={() => setShowOnramp(!showOnramp)}
        className="w-full p-4 flex items-center justify-between text-left hover:bg-spectr-surface-raised transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-none bg-spectr-primary" />
          <div>
            <span className="text-xs font-bold text-spectr-ink block font-sans">
              Cross-Chain Deposit (1Click On-Ramp Simulator)
            </span>
            <span className="text-xs text-spectr-body font-sans">
              Deposit ETH, SOL, or USDC from Ethereum, Solana, or Base directly into your NEAR escrow wallet
            </span>
          </div>
        </div>
        <span className="text-xs font-mono text-spectr-primary font-medium">
          {showOnramp ? "▲ Hide 1Click Panel" : "▼ Open 1Click Simulator"}
        </span>
      </button>

      {showOnramp && (
        <div className="p-6 border-t border-spectr-hairline bg-spectr-canvas">
          <OnrampQuotePanel />
        </div>
      )}
    </Card>
  );
};
