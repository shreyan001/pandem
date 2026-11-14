"use client";

import React, { useState, useEffect } from "react";
import { Badge, Button, Card } from "../../../../ui";

export interface AgreementSummary {
  agreementId: number;
  tierId: string;
  pricePerPeriod: string;
  fundedPeriods: number;
  releasedPeriods: number;
  remainingPeriods: number;
  remainingDays: number;
}

export interface ChallengePayload {
  productId: number;
  nonceHex: string;
  nonceBytes: number[];
  recipient: string;
  expiry: number;
}

interface AccessChallengeViewProps {
  slug: string;
  productName: string;
  accountId: string;
  agreement: AgreementSummary;
  challenge: ChallengePayload;
  onSignChallenge: () => void;
  onUnlockWithSecret: (secret: string) => Promise<void>;
  isSigning: boolean;
  error: string | null;
}

export const AccessChallengeView: React.FC<AccessChallengeViewProps> = ({
  slug,
  productName,
  accountId,
  agreement,
  challenge,
  onSignChallenge,
  onUnlockWithSecret,
  isSigning,
  error,
}) => {
  const [activeTab, setActiveTab] = useState<"wallet" | "secret">("wallet");
  const [secretInput, setSecretInput] = useState<string>("");
  const [isSecretFromStorage, setIsSecretFromStorage] = useState<boolean>(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`pandem:secret:${slug}`);
      if (saved) {
        setSecretInput(saved);
        setIsSecretFromStorage(true);
      }
    } catch {
      // ignore
    }
  }, [slug]);

  const formattedPrice = (Number(agreement.pricePerPeriod) / 1e6).toFixed(2);
  const challengeMessage = JSON.stringify(
    {
      product_id: challenge.productId,
      agreement_id: agreement.agreementId,
      nonce: challenge.nonceHex,
      expiry: challenge.expiry,
    },
    null,
    2
  );

  const handleSecretSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!secretInput.trim()) return;
    onUnlockWithSecret(secretInput.trim());
  };

  return (
    <Card className="p-6 bg-spectr-surface border-spectr-hairline space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-spectr-hairline">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-spectr-ink font-sans">
              Verify Subscription Access
            </h2>
            <Badge variant="success">Agreement #{agreement.agreementId}</Badge>
          </div>
          <p className="text-xs text-spectr-muted font-mono mt-1">
            Product: {productName} · Tier: <strong className="text-spectr-ink">{agreement.tierId}</strong> ({formattedPrice} tUSDC)
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs font-mono text-spectr-success block">
            {agreement.remainingPeriods} Period{agreement.remainingPeriods !== 1 ? "s" : ""} Active
          </span>
          <span className="text-xs font-mono text-spectr-muted">
            ~{agreement.remainingDays} days remaining
          </span>
        </div>
      </div>

      {/* Mode Selection Tabs */}
      <div className="grid grid-cols-2 gap-2 border-b border-spectr-hairline pb-4 font-mono text-xs">
        <button
          type="button"
          onClick={() => setActiveTab("wallet")}
          className={`py-2 px-3 border transition-colors text-center ${
            activeTab === "wallet"
              ? "bg-spectr-surface-raised border-spectr-primary text-spectr-ink font-bold"
              : "bg-spectr-canvas border-spectr-hairline text-spectr-muted hover:text-spectr-body"
          }`}
        >
          1. Wallet NEP-413 Signature
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("secret")}
          className={`py-2 px-3 border transition-colors text-center ${
            activeTab === "secret"
              ? "bg-spectr-surface-raised border-spectr-primary text-spectr-ink font-bold"
              : "bg-spectr-canvas border-spectr-hairline text-spectr-muted hover:text-spectr-body"
          }`}
        >
          2. Unlock with Private Secret
        </button>
      </div>

      {/* Tab 1: Wallet NEP-413 Challenge */}
      {activeTab === "wallet" && (
        <div className="space-y-4">
          <p className="text-xs text-spectr-body font-mono">
            An active escrow subscription was verified on-chain for <strong>{accountId}</strong>.
            Sign the standard NEP-413 payload below with your connected NEAR wallet:
          </p>

          <div className="p-3 bg-spectr-canvas border border-spectr-hairline space-y-1">
            <div className="flex items-center justify-between text-xs font-mono text-spectr-muted pb-1 border-b border-spectr-hairline">
              <span>NEP-413 Challenge Payload</span>
              <span>Recipient: {challenge.recipient}</span>
            </div>
            <pre className="text-xs font-mono text-spectr-primary overflow-x-auto p-2">
              {challengeMessage}
            </pre>
          </div>

          <div className="pt-2">
            <Button
              type="button"
              variant="primary"
              size="md"
              isLoading={isSigning}
              onClick={onSignChallenge}
              className="w-full sm:w-auto"
            >
              {isSigning ? "Signing with Wallet..." : "Sign NEP-413 & Unlock Access →"}
            </Button>
          </div>
        </div>
      )}

      {/* Tab 2: Unlock with Private Secret */}
      {activeTab === "secret" && (
        <form onSubmit={handleSecretSubmit} className="space-y-4">
          <div className="flex items-center justify-between">
            <label htmlFor="secret-input" className="text-xs font-mono uppercase text-spectr-ink font-semibold">
              Enter 32-Byte Client Secret
            </label>
            {isSecretFromStorage && (
              <span className="text-xs font-mono text-spectr-success bg-spectr-surface border border-spectr-success px-1.5 py-0.5">
                Found in localStorage
              </span>
            )}
          </div>

          <p className="text-xs text-spectr-body font-mono">
            If you subscribed using Private Subscription Mode, paste your backup secret below.
            Pandem recomputes your commitment on-chain without exposing your wallet identity.
          </p>

          <div className="space-y-2">
            <input
              id="secret-input"
              type="text"
              required
              value={secretInput}
              onChange={(e) => {
                setSecretInput(e.target.value);
                setIsSecretFromStorage(false);
              }}
              placeholder="e.g. 4f9b2a1c8e7d6f5a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a"
              className="w-full px-3 py-2 bg-spectr-canvas border border-spectr-hairline text-spectr-ink font-mono text-xs focus:outline-none focus:border-spectr-primary"
            />
            <p className="text-xs text-spectr-muted font-mono">
              Commitment = sha256(secret : product_id)
            </p>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSigning}
              disabled={!secretInput.trim()}
              className="w-full sm:w-auto"
            >
              {isSigning ? "Verifying Secret..." : "Unlock with Private Secret →"}
            </Button>
          </div>
        </form>
      )}

      {/* Error Banner */}
      {error && (
        <div className="p-3 bg-spectr-surface border border-spectr-danger text-xs font-mono text-spectr-danger">
          ⚠ {error}
        </div>
      )}
    </Card>
  );
};
