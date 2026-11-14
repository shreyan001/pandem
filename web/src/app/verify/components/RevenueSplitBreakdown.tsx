"use client";

import React, { useState, useEffect } from "react";
import { PANDEM_ESCROW_ID, SPLIT_BPS } from "@pandem/shared";
import { Card, Badge } from "../../../ui";
import { DollarSign, Shield, Cpu, Award } from "lucide-react";
import { callViewMethod } from "../../../lib/nearRpc";

interface EscrowConfig {
  owner: string;
  token_id: string;
  treasury: string;
  protocol_fees: string;
}

interface RevenueSplitBreakdownProps {
  pricePerPeriod?: string; // in raw units (e.g. 5000000 = 5 tUSDC)
}

export const RevenueSplitBreakdown: React.FC<RevenueSplitBreakdownProps> = ({
  pricePerPeriod = "5000000",
}) => {
  const [config, setConfig] = useState<EscrowConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchConfig() {
      try {
        setIsLoading(true);
        const res = await callViewMethod<[string, string, string, string]>(
          PANDEM_ESCROW_ID,
          "get_config",
          {}
        );
        if (res && Array.isArray(res) && res.length >= 4) {
          setConfig({
            owner: res[0],
            token_id: res[1],
            treasury: res[2],
            protocol_fees: res[3],
          });
        }
      } catch {
        // Fallback or offline
      } finally {
        setIsLoading(false);
      }
    }
    fetchConfig();
  }, []);

  const priceNum = Number(pricePerPeriod) / 1e6;
  const feeAmount = (priceNum * (SPLIT_BPS.PROTOCOL_FEE / 10000)).toFixed(4);
  const opsAmount = (priceNum * (SPLIT_BPS.OPS_RESERVE / 10000)).toFixed(4);
  const contingencyAmount = (priceNum * (SPLIT_BPS.CONTINGENCY_RESERVE / 10000)).toFixed(4);
  const stewardAmount = (priceNum * (SPLIT_BPS.STEWARD / 10000)).toFixed(4);
  const accumulatedFees = config?.protocol_fees
    ? (Number(config.protocol_fees) / 1e6).toFixed(4)
    : "0.0000";

  return (
    <Card className="p-6 bg-spectr-surface border-spectr-hairline space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-spectr-hairline">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-spectr-ink tracking-tight font-sans">
              2. Autonomous Revenue Split Engine
            </h3>
            <Badge variant="primary" className="font-mono text-xs">
              Live Escrow Bytecode Math
            </Badge>
          </div>
          <p className="text-xs text-spectr-muted font-mono mt-1">
            Read from <code className="text-spectr-primary">{PANDEM_ESCROW_ID}</code> (D-06 deterministic split per released period)
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="text-spectr-muted">Accumulated Protocol Fees:</span>
          <span className="text-spectr-success font-semibold px-2 py-0.5 bg-spectr-canvas border border-spectr-hairline">
            {isLoading ? "Reading..." : `${accumulatedFees} tUSDC`}
          </span>
        </div>
      </div>

      {/* Visual Split Distribution Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs font-mono">
          <span className="text-spectr-ink font-semibold">
            Period Allocation for {priceNum.toFixed(2)} tUSDC:
          </span>
          <span className="text-spectr-muted">100.00% Fully Accounted (0 Rounding Leak)</span>
        </div>

        <div className="w-full h-3 bg-spectr-canvas border border-spectr-hairline flex overflow-hidden">
          <div
            style={{ width: "2.5%" }}
            className="bg-spectr-warning h-full"
            title="Protocol Fee: 2.5%"
          />
          <div
            style={{ width: "30.0%" }}
            className="bg-spectr-primary h-full"
            title="Ops Reserve: 30.0%"
          />
          <div
            style={{ width: "20.0%" }}
            className="bg-spectr-body h-full"
            title="Contingency Reserve: 20.0%"
          />
          <div
            style={{ width: "47.5%" }}
            className="bg-spectr-success h-full"
            title="Steward Share: 47.5%"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 font-mono text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-spectr-warning inline-block" />
            <span className="text-spectr-muted">Fee (2.5%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-spectr-primary inline-block" />
            <span className="text-spectr-muted">Ops Compute (30.0%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-spectr-body inline-block" />
            <span className="text-spectr-muted">Contingency (20.0%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-spectr-success inline-block" />
            <span className="text-spectr-muted">Steward Payout (47.5%)</span>
          </div>
        </div>
      </div>

      {/* Detailed 4-Box Split Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono text-xs">
        {/* 2.5% Protocol Fee */}
        <div className="p-4 bg-spectr-canvas border border-spectr-hairline space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-spectr-muted uppercase font-semibold">Protocol Fee</span>
            <DollarSign className="w-4 h-4 text-spectr-warning" />
          </div>
          <div className="text-xl font-bold text-spectr-ink">2.5%</div>
          <div className="text-xs text-spectr-body">
            {feeAmount} tUSDC
          </div>
          <p className="text-xs text-spectr-muted border-t border-spectr-hairline/60 pt-1.5">
            Routes to protocol treasury. Only owner can withdraw via <code className="text-spectr-primary">withdraw_fees</code>.
          </p>
        </div>

        {/* 30% Ops Reserve */}
        <div className="p-4 bg-spectr-canvas border border-spectr-hairline space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-spectr-muted uppercase font-semibold">Ops Reserve</span>
            <Cpu className="w-4 h-4 text-spectr-primary" />
          </div>
          <div className="text-xl font-bold text-spectr-ink">30.0%</div>
          <div className="text-xs text-spectr-primary font-semibold">
            {opsAmount} tUSDC
          </div>
          <p className="text-xs text-spectr-muted border-t border-spectr-hairline/60 pt-1.5">
            Forwarded directly to <code className="text-spectr-primary">Pandem Budget</code> for verified AI inference draws.
          </p>
        </div>

        {/* 20% Contingency Reserve */}
        <div className="p-4 bg-spectr-canvas border border-spectr-hairline space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-spectr-muted uppercase font-semibold">Contingency</span>
            <Shield className="w-4 h-4 text-spectr-body" />
          </div>
          <div className="text-xl font-bold text-spectr-ink">20.0%</div>
          <div className="text-xs text-spectr-body">
            {contingencyAmount} tUSDC
          </div>
          <p className="text-xs text-spectr-muted border-t border-spectr-hairline/60 pt-1.5">
            Protected warranty reserve backing solve-to-pay security bounties and service continuity.
          </p>
        </div>

        {/* 47.5% Steward Share */}
        <div className="p-4 bg-spectr-canvas border border-spectr-hairline space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-spectr-muted uppercase font-semibold">Steward Payout</span>
            <Award className="w-4 h-4 text-spectr-success" />
          </div>
          <div className="text-xl font-bold text-spectr-ink">47.5%</div>
          <div className="text-xs text-spectr-success font-semibold">
            {stewardAmount} tUSDC
          </div>
          <p className="text-xs text-spectr-muted border-t border-spectr-hairline/60 pt-1.5">
            Paid to maker ONLY when a verified cryptographic heartbeat is attested on-chain.
          </p>
        </div>
      </div>
    </Card>
  );
};
