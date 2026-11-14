"use client";

import React from "react";
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
  productName: string;
  accountId: string;
  agreement: AgreementSummary;
  challenge: ChallengePayload;
  onSignChallenge: () => void;
  isSigning: boolean;
  error: string | null;
}

export const AccessChallengeView: React.FC<AccessChallengeViewProps> = ({
  productName,
  accountId,
  agreement,
  challenge,
  onSignChallenge,
  isSigning,
  error,
}) => {
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

  return (
    <Card className="p-6 bg-spectr-surface border-spectr-hairline space-y-6 max-w-2xl mx-auto">
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

      <div className="space-y-3">
        <p className="text-xs text-spectr-body font-mono">
          An active escrow subscription was verified on-chain for <strong>{accountId}</strong>.
          To unlock the production endpoint and sandbox credentials, sign the standard NEP-413 payload below with your wallet:
        </p>

        {/* Challenge Payload Display */}
        <div className="p-3 bg-spectr-canvas border border-spectr-hairline space-y-1">
          <div className="flex items-center justify-between text-xs font-mono text-spectr-muted pb-1 border-b border-spectr-hairline">
            <span>NEP-413 Challenge Payload</span>
            <span>Recipient: {challenge.recipient}</span>
          </div>
          <pre className="text-xs font-mono text-spectr-primary overflow-x-auto p-2">
            {challengeMessage}
          </pre>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-spectr-surface border border-spectr-danger text-xs font-mono text-spectr-danger">
          ⚠ {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
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
    </Card>
  );
};
