"use client";

import React from "react";
import { Activity, RefreshCw } from "lucide-react";
import { EnrichedProduct } from "@pandem/shared";
import { Badge, Button, Card } from "../../../../ui";

export interface HeartbeatStationProps {
  heartbeatStreak: number;
  selectedProduct: EnrichedProduct;
  isPingingHeartbeat: boolean;
  onBroadcastHeartbeat: () => void;
}

export const HeartbeatStation: React.FC<HeartbeatStationProps> = ({
  heartbeatStreak,
  selectedProduct,
  isPingingHeartbeat,
  onBroadcastHeartbeat,
}) => {
  return (
    <Card className="bg-spectr-surface border-spectr-hairline p-6 sm:p-8 space-y-6">
      <div className="border-b border-spectr-hairline pb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-spectr-success" />
          <h2 className="text-base font-semibold text-spectr-ink tracking-tight font-sans">
            Heartbeat & Uptime Station
          </h2>
        </div>
        <p className="text-xs text-spectr-body font-mono mt-0.5">
          Cryptographic liveness proofs verify hardware enclave uptime to sustain continuous escrow streaming.
        </p>
      </div>

      {/* Streak & Status Meter */}
      <div className="p-4 bg-spectr-canvas border border-spectr-hairline space-y-3 font-mono text-xs rounded-none">
        <div className="flex items-center justify-between">
          <span className="text-xs text-spectr-muted uppercase tracking-wider">Active Liveness Streak</span>
          <Badge variant="success" dot pulse>
            Verified Online
          </Badge>
        </div>

        <div className="text-3xl font-bold text-spectr-ink tabular-nums">
          {heartbeatStreak} <span className="text-xs font-normal text-spectr-muted">Periods</span>
        </div>

        <div className="space-y-1.5 pt-2 border-t border-spectr-hairline text-xs text-spectr-body">
          <div className="flex justify-between">
            <span className="text-spectr-muted">Hardware Target:</span>
            <span className="text-spectr-ink">{selectedProduct.tee_hardware}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-spectr-muted">Enclave Model:</span>
            <span className="text-spectr-ink truncate max-w-[180px]">{selectedProduct.tee_model}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-spectr-muted">Last Attestation:</span>
            <span className="text-spectr-success">Valid Intel TDX Quote</span>
          </div>
          <div className="flex justify-between">
            <span className="text-spectr-muted">Telemetry Latency:</span>
            <span className="text-spectr-ink tabular-nums">&lt; 1.5ms overhead</span>
          </div>
        </div>
      </div>

      {/* Broadcast Heartbeat Action */}
      <div className="space-y-2 font-mono text-xs">
        <Button
          type="button"
          variant="secondary"
          size="md"
          fullWidth
          onClick={onBroadcastHeartbeat}
          disabled={isPingingHeartbeat}
          isLoading={isPingingHeartbeat}
          leftIcon={<RefreshCw className="w-3.5 h-3.5 text-spectr-primary" />}
        >
          <span>{isPingingHeartbeat ? "Broadcasting to NEAR..." : "Broadcast Cryptographic Heartbeat"}</span>
        </Button>
        <p className="text-xs text-spectr-muted text-center font-sans">
          Signs and dispatches an on-chain heartbeat transaction to escrow.{selectedProduct.slug}.testnet.
        </p>
      </div>
    </Card>
  );
};
