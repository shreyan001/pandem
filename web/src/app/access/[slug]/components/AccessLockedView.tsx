"use client";

import React, { useState, useEffect } from "react";
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
  onUnlockWithSecret?: (secret: string) => Promise<void>;
  isVerifyingSecret?: boolean;
  secretError?: string | null;
  reason?: "not_subscribed" | "cancelled_or_refunded" | "wallet_disconnected" | "expired";
}

export const AccessLockedView: React.FC<AccessLockedViewProps> = ({
  product,
  accountId,
  onConnectWallet,
  onUnlockWithSecret,
  isVerifyingSecret = false,
  secretError = null,
  reason = "not_subscribed",
}) => {
  const [showSecretPanel, setShowSecretPanel] = useState(false);
  const [secretInput, setSecretInput] = useState("");
  const [hasStorageSecret, setHasStorageSecret] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`pandem:secret:${product.slug}`);
      if (saved) {
        setSecretInput(saved);
        setHasStorageSecret(true);
      }
    } catch {
      // ignore
    }
  }, [product.slug]);

  const handleSecretSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!secretInput.trim() || !onUnlockWithSecret) return;
    onUnlockWithSecret(secretInput.trim());
  };

  const getReasonText = () => {
    switch (reason) {
      case "wallet_disconnected":
        return "Connect your NEAR wallet or provide your private subscription secret to unlock.";
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
            <span>Cryptographic NEP-413 or Private Secret signed authentication token</span>
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

      {/* Private Secret Unlock Panel */}
      {onUnlockWithSecret && (
        <div className="pt-4 border-t border-spectr-hairline text-left space-y-3">
          <button
            type="button"
            onClick={() => setShowSecretPanel(!showSecretPanel)}
            className="w-full flex items-center justify-between text-xs font-mono text-spectr-muted hover:text-spectr-ink transition-colors"
          >
            <span className="flex items-center gap-2">
              <span className="text-spectr-primary">🔑</span>
              <span>Subscribed in Private Mode? Unlock with Secret</span>
            </span>
            <span>{showSecretPanel ? "▲ Hide" : "▼ Enter Secret"}</span>
          </button>

          {showSecretPanel && (
            <form onSubmit={handleSecretSubmit} className="p-4 bg-spectr-canvas border border-spectr-hairline space-y-3">
              <div className="flex items-center justify-between">
                <label htmlFor="locked-secret" className="text-xs font-mono uppercase text-spectr-ink font-semibold">
                  Paste 32-Byte Client Secret
                </label>
                {hasStorageSecret && (
                  <span className="text-xs font-mono text-spectr-success bg-spectr-surface border border-spectr-success px-1.5 py-0.5">
                    Found in localStorage
                  </span>
                )}
              </div>

              <input
                id="locked-secret"
                type="text"
                required
                value={secretInput}
                onChange={(e) => {
                  setSecretInput(e.target.value);
                  setHasStorageSecret(false);
                }}
                placeholder="4f9b2a1c8e7d6f5a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a"
                className="w-full px-3 py-2 bg-spectr-surface border border-spectr-hairline text-spectr-ink font-mono text-xs focus:outline-none focus:border-spectr-primary"
              />

              {secretError && (
                <div className="p-2.5 bg-spectr-surface border border-spectr-danger text-xs font-mono text-spectr-danger">
                  ⚠ {secretError}
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isVerifyingSecret}
                disabled={!secretInput.trim()}
                className="w-full sm:w-auto"
              >
                {isVerifyingSecret ? "Verifying..." : "Unlock with Secret →"}
              </Button>
            </form>
          )}
        </div>
      )}
    </Card>
  );
};
