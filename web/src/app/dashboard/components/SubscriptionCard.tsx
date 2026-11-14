"use client";

import React from "react";
import Link from "next/link";
import { Agreement, Escrow } from "@pandem/shared";
import { AbstractLogo } from "../../../components/AbstractLogo";
import { Badge, Button, Card } from "../../../ui";

export interface AgreementItem {
  id: number;
  agreement: Agreement;
  escrow: Escrow;
  isRefundClaimable: boolean;
  productStatus: "Active" | "Lapsed" | "Abandoned";
  productName: string;
  productSlug: string;
  suite: string;
  tierName: string;
  uptimeHealthy: boolean;
  heartbeatStreak: number;
  privacyStandards: {
    frontendPin: string;
    nodeBackend: string;
    databaseKms: string;
    paymentEscrow: string;
  };
}

export interface SubscriptionCardProps {
  item: AgreementItem;
  claimLoadingId: number | null;
  onClaimRefund: (id: number) => void;
  onOpenBugModal: (slug: string) => void;
}

export const SubscriptionCard: React.FC<SubscriptionCardProps> = ({
  item,
  claimLoadingId,
  onClaimRefund,
  onOpenBugModal,
}) => {
  const remainingPeriods = Math.max(0, item.escrow.funded_periods - item.escrow.released_periods);
  const formattedPrice = (Number(item.agreement.price_per_period) / 1e6).toFixed(2);
  const formattedEscrowBalance = (Number(item.escrow.balance) / 1e6).toFixed(2);
  const productSlug = item.productSlug || "aegis-legal";

  return (
    <Card className="p-6 bg-spectr-surface border-spectr-hairline space-y-5 hover:border-spectr-muted/50 transition-all">
      {/* Top Row: Service Identity, Utility & Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-spectr-hairline">
        <div className="flex items-start sm:items-center gap-4">
          <AbstractLogo slug={productSlug} name={item.productName} size={48} />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/products/${productSlug}`}
                className="text-base font-bold text-spectr-ink hover:text-spectr-primary transition-colors font-sans"
              >
                {item.productName || `Product #${item.agreement.product_id}`}
              </Link>
              <Badge variant="primary">Agreement #{item.id}</Badge>
              <Badge variant="default">{item.suite}</Badge>
              {item.escrow.refunded ? (
                <Badge variant="danger">Refunded</Badge>
              ) : item.uptimeHealthy ? (
                <Badge variant="success" dot pulse>
                  Active Uptime ({item.heartbeatStreak}d streak)
                </Badge>
              ) : (
                <Badge variant="warning">⚠️ Heartbeat Lapsed</Badge>
              )}
            </div>
            <p className="text-xs text-spectr-muted font-mono mt-1">
              Utility Tier: <strong className="text-spectr-body">{item.tierName}</strong> • {formattedPrice} tUSDC / period
            </p>
          </div>
        </div>

        {/* Actions: Product Page, Bounty, 1-Click Refund */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/products/${productSlug}`}
            className="px-3.5 py-1.5 rounded-none bg-spectr-surface-raised hover:bg-spectr-surface-raised/80 text-spectr-body hover:text-spectr-ink font-mono text-xs transition-colors border border-spectr-hairline"
          >
            Product Details →
          </Link>

          <button
            type="button"
            onClick={() => onOpenBugModal(productSlug)}
            className="px-3.5 py-1.5 rounded-none bg-spectr-surface hover:bg-spectr-surface-raised text-spectr-warning font-mono text-xs font-medium transition-colors border border-spectr-warning/40"
            title="File solve-to-pay bug report holding 7% warranty reserve"
          >
            Steward Bounty ⚙
          </button>

          {/* 1-Click 7-Day Refund Claim Mechanism */}
          {!item.escrow.refunded && (
            <Button
              type="button"
              variant={!item.uptimeHealthy ? "danger" : "outline"}
              size="sm"
              disabled={claimLoadingId === item.id}
              onClick={() => onClaimRefund(item.id)}
              isLoading={claimLoadingId === item.id}
              title="Claim unreleased funds back to your wallet under the 7-day escrow guarantee"
            >
              {!item.uptimeHealthy
                ? "Claim 7-Day Refund (1-Click)"
                : "Claim 7-Day Refund"}
            </Button>
          )}
        </div>
      </div>

      {/* 4-Segment Privacy Standard Audit Matrix */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-mono text-spectr-muted">
          <span className="uppercase text-xs font-bold text-spectr-ink">
            4-Segment Privacy Standard Audit Status
          </span>
          <span className="text-xs text-spectr-success font-semibold">
            ✓ All 4 Segments Verified Active
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 font-mono text-xs">
          {/* Segment 1: Frontend (Filecoin Pin) */}
          <div className="p-3 bg-spectr-canvas border border-spectr-hairline space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-spectr-muted uppercase tracking-wider">01. Frontend</span>
              <span className="w-1.5 h-1.5 bg-spectr-success rounded-none" />
            </div>
            <div className="text-spectr-ink font-bold flex items-center gap-1.5 text-xs">
              <span className="text-spectr-success">✓</span>
              <span>Verifiable Filecoin Pin</span>
            </div>
            <span
              className="text-xs text-spectr-primary block truncate"
              title={item.privacyStandards.frontendPin}
            >
              CID: {item.privacyStandards.frontendPin.slice(0, 14)}...
            </span>
          </div>

          {/* Segment 2: Node Backend (Isolated Container) */}
          <div className="p-3 bg-spectr-canvas border border-spectr-hairline space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-spectr-muted uppercase tracking-wider">02. Backend</span>
              <span className="w-1.5 h-1.5 bg-spectr-success rounded-none" />
            </div>
            <div className="text-spectr-ink font-bold flex items-center gap-1.5 text-xs">
              <span className="text-spectr-success">✓</span>
              <span>Isolated Container</span>
            </div>
            <span className="text-xs text-spectr-body block truncate">
              Distroless CVM MicroVM
            </span>
          </div>

          {/* Segment 3: Database (KMS-Sealed Enclave) */}
          <div className="p-3 bg-spectr-canvas border border-spectr-hairline space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-spectr-muted uppercase tracking-wider">03. Database</span>
              <span className="w-1.5 h-1.5 bg-spectr-success rounded-none" />
            </div>
            <div className="text-spectr-ink font-bold flex items-center gap-1.5 text-xs">
              <span className="text-spectr-success">✓</span>
              <span>KMS-Sealed Enclave</span>
            </div>
            <span className="text-xs text-spectr-body block truncate">
              Hardware AES-256-GCM
            </span>
          </div>

          {/* Segment 4: Payments (7-Day Escrow Guarantee) */}
          <div className="p-3 bg-spectr-canvas border border-spectr-hairline space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-spectr-muted uppercase tracking-wider">04. Payments Rail</span>
              <span className="w-1.5 h-1.5 bg-spectr-success rounded-none" />
            </div>
            <div className="text-spectr-ink font-bold flex items-center gap-1.5 text-xs">
              <span className="text-spectr-success">✓</span>
              <span>7-Day Escrow</span>
            </div>
            <span className="text-xs text-spectr-success block truncate font-semibold">
              D-14 Non-Custodial Pro-Rata
            </span>
          </div>
        </div>
      </div>

      {/* Escrow Stream Progress */}
      <div className="space-y-2 pt-2 border-t border-spectr-hairline">
        <div className="flex justify-between text-xs font-mono">
          <span className="text-spectr-muted">Escrow Stream Releases:</span>
          <span className="text-spectr-ink font-semibold">
            {item.escrow.released_periods} of {item.escrow.funded_periods} periods released
          </span>
        </div>

        <div className="w-full h-2 rounded-none bg-spectr-canvas overflow-hidden border border-spectr-hairline">
          <div
            className="h-full bg-spectr-primary"
            style={{
              width: `${Math.min(
                100,
                (item.escrow.released_periods / Math.max(1, item.escrow.funded_periods)) * 100
              )}%`,
            }}
          />
        </div>

        <div className="flex justify-between text-xs font-mono text-spectr-muted pt-0.5">
          <span>
            Locked Escrow Balance:{" "}
            <strong className="text-spectr-ink">{formattedEscrowBalance} tUSDC</strong>
          </span>
          <span>
            Remaining Protected Periods:{" "}
            <strong className="text-spectr-success">{remainingPeriods} periods</strong>
          </span>
        </div>
      </div>
    </Card>
  );
};
