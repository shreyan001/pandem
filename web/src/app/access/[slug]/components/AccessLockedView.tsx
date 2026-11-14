"use client";

import React from "react";
import Link from "next/link";
import { Badge, Button, Card } from "../../../../ui";

export interface LockedProductInfo {
  product_id?: number;
  name: string;
  slug: string;
  category?: string;
  website_url?: string;
  demo_url?: string;
  tiers?: Array<{ tier_id: string; name: string; price_monthly: string; price_yearly: string }>;
}

interface AccessLockedViewProps {
  product: LockedProductInfo;
  accountId: string | null;
  onConnectWallet: () => void;
  reason?: "not_subscribed" | "cancelled_or_refunded" | "wallet_disconnected" | "expired";
}

export const AccessLockedView: React.FC<AccessLockedViewProps> = ({
  product,
  accountId,
  onConnectWallet,
  reason = "not_subscribed",
}) => {
  const getReasonText = () => {
    switch (reason) {
      case "wallet_disconnected":
        return "Connect your NEAR wallet to verify on-chain subscription ownership.";
      case "cancelled_or_refunded":
        return "Your subscription agreement was cancelled or refunded. Re-subscribe to restore enclave access.";
      case "expired":
        return "All funded subscription periods have elapsed. Renew your agreement to unlock access.";
      case "not_subscribed":
      default:
        return `No active subscription agreement on escrow-d6-df23.test-pandem-alice-1.testnet was found for account ${accountId || "anonymous"}.`;
    }
  };

  return (
    <Card className="p-8 bg-spectr-surface border-spectr-hairline space-y-6 text-center max-w-2xl mx-auto">
      {/* Locked Enclave Icon & Status */}
      <div className="space-y-3">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-spectr-surface-raised border border-spectr-hairline">
          <span className="text-xl">🔒</span>
        </div>
        <div className="space-y-1">
          <Badge variant="warning" className="font-mono">
            Access Gated • Subscription Required
          </Badge>
          <h2 className="text-2xl font-bold text-spectr-ink font-sans">
            Subscribe to Unlock {product.name}
          </h2>
          <p className="text-xs text-spectr-muted font-mono max-w-lg mx-auto">
            {getReasonText()}
          </p>
        </div>
      </div>

      {/* Feature Guarantee Callouts */}
      <div className="p-4 bg-spectr-canvas border border-spectr-hairline text-left space-y-3">
        <span className="text-xs font-mono font-semibold uppercase text-spectr-ink block">
          What Subscribing Unlocks
        </span>
        <ul className="text-xs text-spectr-body space-y-2 font-mono">
          <li className="flex items-start gap-2">
            <span className="text-spectr-primary">✓</span>
            <span>Direct access to production web client and private interactive sandbox</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-spectr-primary">✓</span>
            <span>Cryptographic NEP-413 signed authentication token</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-spectr-primary">✓</span>
            <span>Continuous heartbeat SLA protection backed by on-chain escrow</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-spectr-primary">✓</span>
            <span>1-Click 7-Day full refund guarantee if steward goes offline</span>
          </li>
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        {!accountId ? (
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={onConnectWallet}
            className="w-full sm:w-auto"
          >
            Connect Wallet to Check Access
          </Button>
        ) : (
          <Link
            href={`/products/${product.slug}`}
            className="w-full sm:w-auto px-6 py-2.5 rounded-none bg-spectr-primary hover:bg-spectr-primary-hover text-spectr-ink font-mono text-xs font-semibold transition-colors border border-spectr-primary block text-center"
          >
            Subscribe to Unlock ({product.name}) →
          </Link>
        )}

        <Link
          href={`/products/${product.slug}`}
          className="w-full sm:w-auto px-4 py-2.5 rounded-none bg-spectr-surface-raised hover:bg-spectr-surface-raised/80 text-spectr-body hover:text-spectr-ink font-mono text-xs transition-colors border border-spectr-hairline block text-center"
        >
          View Pricing Tiers →
        </Link>
      </div>
    </Card>
  );
};
