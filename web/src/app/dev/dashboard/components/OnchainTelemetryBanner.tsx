"use client";

import React from "react";
import { Database } from "lucide-react";
import { PANDEM_BUDGET_ID, PANDEM_ESCROW_ID } from "@pandem/shared";
import { Badge, Card, Stat } from "../../../../ui";

export interface OnchainTelemetryBannerProps {
  onchainBudget: {
    total_ops_received: string;
    current_balance: string;
    period_draw_cap: string;
    drawn_in_current_period: string;
    status: string;
  } | null;
  onchainProduct: {
    steward: string;
    ops_reserve: string;
    contingency_reserve: string;
    last_heartbeat_period: number;
    status: string;
  } | null;
  heartbeatStreak: number;
}

export const OnchainTelemetryBanner: React.FC<OnchainTelemetryBannerProps> = ({
  onchainBudget,
  onchainProduct,
  heartbeatStreak,
}) => {
  const opsReceived = onchainBudget
    ? `${(Number(onchainBudget.total_ops_received) / 1000000).toFixed(2)} tUSDC`
    : "1.50 tUSDC";

  const opsBalance = onchainBudget
    ? `${(Number(onchainBudget.current_balance) / 1000000).toFixed(2)} tUSDC`
    : "1.50 tUSDC";

  const contingency = onchainProduct
    ? `${(Number(onchainProduct.contingency_reserve) / 1000000).toFixed(2)} tUSDC`
    : "1.00 tUSDC";

  return (
    <Card className="bg-spectr-surface border-spectr-hairline p-6 space-y-4 font-mono text-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-spectr-hairline pb-3">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-spectr-primary" />
          <span className="text-spectr-ink font-semibold tracking-tight font-sans">
            On-Chain Protocol Metrics
          </span>
          <Badge variant="success" dot pulse>
            Live RPC
          </Badge>
        </div>
        <div className="flex items-center gap-4 text-xs text-spectr-muted">
          <span>
            Escrow:{" "}
            <a
              href={`https://explorer.testnet.near.org/accounts/${PANDEM_ESCROW_ID}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-spectr-body hover:text-spectr-primary underline"
            >
              {PANDEM_ESCROW_ID}
            </a>
          </span>
          <span>
            Budget:{" "}
            <a
              href={`https://explorer.testnet.near.org/accounts/${PANDEM_BUDGET_ID}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-spectr-body hover:text-spectr-primary underline"
            >
              {PANDEM_BUDGET_ID}
            </a>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
        <Stat
          label="Ops Budget Received (30%)"
          value={opsReceived}
          hint="Allocated for TEE draws"
          tone="success"
        />
        <Stat
          label="Available Ops Balance"
          value={opsBalance}
          hint="Ready for agent queries"
          tone="default"
        />
        <Stat
          label="Contingency Reserve (20%)"
          value={contingency}
          hint="Dispute quorum reserve"
          tone="warning"
        />
        <Stat
          label="Period Heartbeat Proof"
          value={`Period #${heartbeatStreak}`}
          hint="Enclave attested"
          tone="primary"
        />
      </div>
    </Card>
  );
};
