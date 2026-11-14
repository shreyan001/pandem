"use client";

import React from "react";
import { Coins, Clock, ArrowRight } from "lucide-react";
import { Badge, Button, Card } from "../../../../ui";

export interface PayoutTranche {
  id: number;
  label: string;
  periodRange: string;
  amountUsdc: string;
  status: "Released" | "Streaming" | "Locked";
  unlocksIn?: string;
  progressPct?: number;
}

export interface PayoutStreamStationProps {
  tranches: PayoutTranche[];
  claimableBalance: number;
  isClaimingPayout: boolean;
  onClaimPayout: () => void;
  selectedProductSlug: string;
}

export const PayoutStreamStation: React.FC<PayoutStreamStationProps> = ({
  tranches,
  claimableBalance,
  isClaimingPayout,
  onClaimPayout,
  selectedProductSlug,
}) => {
  return (
    <Card className="bg-spectr-surface border-spectr-hairline p-6 sm:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-spectr-hairline pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-spectr-primary" />
            <h2 className="text-base font-semibold text-spectr-ink tracking-tight font-sans">
              7-Day Rolling Payout Stream
            </h2>
          </div>
          <p className="text-xs text-spectr-body font-mono mt-0.5">
            Subscription escrow vests continuously across 7-day milestone tranches with D-14 clawback protection.
          </p>
        </div>

        <div className="text-left sm:text-right font-mono">
          <span className="text-xs text-spectr-muted block uppercase">Available to Claim</span>
          <span className="text-lg font-bold text-spectr-success tabular-nums">
            ${claimableBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC
          </span>
        </div>
      </div>

      {/* Tranches Grid */}
      <div className="space-y-3 font-mono text-xs">
        {tranches.map((t) => (
          <div
            key={t.id}
            className="p-4 bg-spectr-canvas border border-spectr-hairline space-y-2 rounded-none"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-spectr-ink font-medium">{t.label}</span>
                <span className="text-xs text-spectr-muted">({t.periodRange})</span>
                <Badge
                  variant={
                    t.status === "Released"
                      ? "success"
                      : t.status === "Streaming"
                      ? "primary"
                      : "default"
                  }
                >
                  {t.status}
                </Badge>
              </div>

              <div className="text-right">
                <span className="font-semibold text-spectr-ink tabular-nums">{t.amountUsdc}</span>
              </div>
            </div>

            {t.status === "Streaming" && t.unlocksIn && (
              <div className="space-y-1 pt-1 border-t border-spectr-hairline">
                <div className="flex justify-between text-xs text-spectr-muted">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-spectr-primary" />
                    <span>Unlocks in {t.unlocksIn}</span>
                  </span>
                  <span className="tabular-nums">{t.progressPct}% Vested</span>
                </div>
                <div className="h-1.5 w-full bg-spectr-surface overflow-hidden rounded-none">
                  <div
                    className="h-full bg-spectr-primary rounded-none"
                    style={{ width: `${t.progressPct}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Claim Action Bar */}
      <div className="p-4 bg-spectr-canvas border border-spectr-hairline flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono text-xs rounded-none">
        <div className="space-y-0.5">
          <span className="text-spectr-ink font-medium block">Non-Custodial Claim Station</span>
          <span className="text-xs text-spectr-muted block">
            Contract: escrow.{selectedProductSlug}.testnet
          </span>
        </div>

        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={onClaimPayout}
          disabled={claimableBalance <= 0 || isClaimingPayout}
          isLoading={isClaimingPayout}
          rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
        >
          Claim Unlocked Payout (${claimableBalance.toFixed(0)} USDC)
        </Button>
      </div>
    </Card>
  );
};
