"use client";

import React from "react";
import { Card, Badge } from "../../../ui";
import { ShieldAlert, HeartPulse, Undo2, Lock, CheckCircle2 } from "lucide-react";

export const RefundGuaranteeCard: React.FC = () => {
  return (
    <Card className="p-6 bg-spectr-surface border-spectr-hairline space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-spectr-hairline">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-spectr-ink tracking-tight font-sans">
              4. Non-Custodial Refund Guarantee (Plain English)
            </h3>
            <Badge variant="success" dot>
              Cryptographically Enforced
            </Badge>
          </div>
          <p className="text-xs text-spectr-muted font-mono mt-1">
            How your money is protected on-chain by the escrow contract bytecode
          </p>
        </div>

        <span className="text-xs font-mono text-spectr-primary font-semibold px-2.5 py-1 bg-spectr-canvas border border-spectr-hairline">
          Zero Custodial Custody
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
        {/* Pillar 1: Heartbeat SLA */}
        <div className="p-4 bg-spectr-canvas border border-spectr-hairline space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-spectr-muted uppercase font-bold text-xs">01. Heartbeat SLA</span>
            <HeartPulse className="w-4 h-4 text-spectr-primary" />
          </div>
          <div className="text-sm font-bold text-spectr-ink">
            30-Day Cycle + 7-Day Grace
          </div>
          <p className="text-xs text-spectr-muted leading-relaxed">
            The steward and Pandem agent must submit an on-chain cryptographic health attestation
            every 30 days. If the service drops offline and misses the 7-day grace window, the contract
            automatically switches to <strong className="text-spectr-warning">Lapsed</strong> state.
          </p>
          <div className="pt-2 border-t border-spectr-hairline/60 flex items-center gap-1.5 text-spectr-success">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Autonomous timeout check</span>
          </div>
        </div>

        {/* Pillar 2: Permissionless Refund */}
        <div className="p-4 bg-spectr-canvas border border-spectr-hairline space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-spectr-muted uppercase font-bold text-xs">02. Claim Refund</span>
            <Undo2 className="w-4 h-4 text-spectr-success" />
          </div>
          <div className="text-sm font-bold text-spectr-ink">
            1-Click Permissionless Trigger
          </div>
          <p className="text-xs text-spectr-muted leading-relaxed">
            Once an SLA is breached or the steward trips the <code className="text-spectr-primary">abandon_product</code> killswitch,
            <strong className="text-spectr-body"> anyone</strong> can call <code className="text-spectr-primary">claim_refund(agreement_id)</code>.
            100% of remaining unreleased funds return to your wallet immediately without platform approval.
          </p>
          <div className="pt-2 border-t border-spectr-hairline/60 flex items-center gap-1.5 text-spectr-success">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>No admin keys can stop it</span>
          </div>
        </div>

        {/* Pillar 3: Self-Serve Cancel */}
        <div className="p-4 bg-spectr-canvas border border-spectr-hairline space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-spectr-muted uppercase font-bold text-xs">03. Anytime Cancel</span>
            <Lock className="w-4 h-4 text-spectr-warning" />
          </div>
          <div className="text-sm font-bold text-spectr-ink">
            Instant Future Period Return
          </div>
          <p className="text-xs text-spectr-muted leading-relaxed">
            Subscribers can invoke <code className="text-spectr-primary">cancel(agreement_id)</code> at any moment.
            The current period runs to completion so your SaaS access stays live, and all prepaid
            future unreleased periods are returned to your wallet in the same transaction.
          </p>
          <div className="pt-2 border-t border-spectr-hairline/60 flex items-center gap-1.5 text-spectr-success">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Prorated atomic settlement</span>
          </div>
        </div>
      </div>

      {/* Summary Banner */}
      <div className="p-3.5 bg-spectr-surface-raised border border-spectr-hairline flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-spectr-primary shrink-0" />
          <span className="text-spectr-ink font-semibold">
            The Pandem D-14 Non-Custodial Rule:
          </span>
          <span className="text-spectr-body">
            Steward never touches future funds until each period passes its live health attestation.
          </span>
        </div>
        <span className="text-spectr-muted">Rust Contract: contracts/escrow/src/lib.rs:728</span>
      </div>
    </Card>
  );
};
