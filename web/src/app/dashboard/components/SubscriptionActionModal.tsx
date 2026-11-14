"use client";

import React, { useState } from "react";
import { Modal, Button, Badge } from "../../../ui";
import { useNearWallet } from "../../../context/NearWalletContext";
import { ExternalLink, Check, AlertTriangle, ArrowRight } from "lucide-react";

export type ActionType = "upgrade" | "renew" | "cancel";

export interface SubscriptionActionModalProps {
  isOpen: boolean;
  action: ActionType | null;
  agreementId: number;
  productName: string;
  currentTier: string;
  pricePerPeriodYocto: string;
  remainingPeriods: number;
  onClose: () => void;
  onActionComplete?: () => void;
}

export function SubscriptionActionModal({
  isOpen,
  action,
  agreementId,
  productName,
  currentTier,
  pricePerPeriodYocto,
  remainingPeriods,
  onClose,
  onActionComplete,
}: SubscriptionActionModalProps) {
  const { sendUpgrade, sendRenew, sendCancel, isConnected, connect } = useNearWallet();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  // Renew form state
  const [renewPeriods, setRenewPeriods] = useState<number>(1);
  const [isRenewYearly, setIsRenewYearly] = useState<boolean>(false);

  // Price calculations in 6-decimal tUSDC
  const currPriceBigInt = BigInt(pricePerPeriodYocto || "5000000");
  const maxPriceBigInt = 15000000n; // 15 tUSDC
  const diffPerPeriodBigInt = maxPriceBigInt > currPriceBigInt ? maxPriceBigInt - currPriceBigInt : 0n;
  const upgradeCostBigInt = diffPerPeriodBigInt * BigInt(Math.max(1, remainingPeriods));

  // Renew cost calculations (12 months billed as 10)
  const renewBillable = isRenewYearly ? 10n : BigInt(renewPeriods);
  const renewCostBigInt = currPriceBigInt * renewBillable;

  const formatTUsdc = (raw: bigint) => {
    const whole = raw / 1000000n;
    const frac = (raw % 1000000n).toString().padStart(6, "0").slice(0, 2);
    return `${whole}.${frac}`;
  };

  const handleExecute = async () => {
    if (!isConnected) {
      await connect();
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      let hash: string | null = null;
      if (action === "upgrade") {
        hash = await sendUpgrade(agreementId, "max", upgradeCostBigInt.toString());
      } else if (action === "renew") {
        const p = isRenewYearly ? 12 : renewPeriods;
        hash = await sendRenew(agreementId, p, renewCostBigInt.toString());
      } else if (action === "cancel") {
        hash = await sendCancel(agreementId);
      }

      setTxHash(hash || "submitted");
      if (onActionComplete) onActionComplete();
    } catch (e: any) {
      setError(e?.message || "Transaction execution failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const getTitle = () => {
    switch (action) {
      case "upgrade":
        return `Upgrade Agreement #${agreementId} to Max`;
      case "renew":
        return `Renew Agreement #${agreementId} (${productName})`;
      case "cancel":
        return `Cancel Agreement #${agreementId} (${productName})`;
      default:
        return "Subscription Action";
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={getTitle()}
      maxWidth="md"
    >
      <div className="space-y-4 font-sans text-xs text-spectr-body">
        {txHash ? (
          <div className="space-y-4">
            <div className="p-4 bg-spectr-surface-raised border border-spectr-primary text-spectr-ink space-y-2">
              <div className="flex items-center gap-2 text-spectr-primary font-bold">
                <Check className="w-4 h-4" />
                <span className="capitalize">{action} Transaction Submitted to NEAR!</span>
              </div>
              <p className="font-mono text-xs break-all text-spectr-body">
                Transaction ID: {txHash}
              </p>
              {txHash !== "submitted" && (
                <a
                  href={`https://explorer.testnet.near.org/transactions/${txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-spectr-primary hover:underline font-mono"
                >
                  <span>View on NEAR Explorer</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            <Button
              type="button"
              variant="primary"
              className="w-full justify-center"
              onClick={onClose}
            >
              Done
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* UPGRADE DETAILS */}
            {action === "upgrade" && (
              <div className="space-y-3">
                <p>
                  Upgrade your subscription tier from <strong className="text-spectr-ink uppercase">{currentTier}</strong> to <strong className="text-spectr-primary uppercase">MAX</strong>. You only pay the prorated difference for remaining unreleased periods.
                </p>

                <div className="p-3 bg-spectr-canvas border border-spectr-hairline space-y-2 font-mono">
                  <div className="flex justify-between">
                    <span className="text-spectr-muted">Remaining Periods:</span>
                    <span className="text-spectr-ink font-semibold">{remainingPeriods} periods</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-spectr-muted">Rate Difference:</span>
                    <span className="text-spectr-ink">+{formatTUsdc(diffPerPeriodBigInt)} tUSDC / period</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-spectr-hairline font-bold">
                    <span className="text-spectr-ink">Total Prorated Upgrade:</span>
                    <span className="text-spectr-primary">{formatTUsdc(upgradeCostBigInt)} tUSDC</span>
                  </div>
                </div>

                <div className="text-xs text-spectr-muted font-mono">
                  Payload: <code className="text-spectr-body">msg: {`{"action":"upgrade","agreement_id":${agreementId},"tier":"max"}`}</code>
                </div>
              </div>
            )}

            {/* RENEW DETAILS */}
            {action === "renew" && (
              <div className="space-y-3">
                <p>
                  Extend your existing confidential subscription without interrupting your provisioned enclave session.
                </p>

                <div className="grid grid-cols-2 gap-2 font-mono">
                  <button
                    type="button"
                    onClick={() => {
                      setIsRenewYearly(false);
                      setRenewPeriods(1);
                    }}
                    className={`p-3 text-center border transition-colors ${
                      !isRenewYearly
                        ? "bg-spectr-surface-raised border-spectr-primary text-spectr-ink font-bold"
                        : "bg-spectr-canvas border-spectr-hairline text-spectr-body hover:text-spectr-ink"
                    }`}
                  >
                    <div>1 Month</div>
                    <div className="text-xs text-spectr-muted mt-0.5">
                      {formatTUsdc(currPriceBigInt)} tUSDC
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsRenewYearly(true);
                    }}
                    className={`p-3 text-center border transition-colors ${
                      isRenewYearly
                        ? "bg-spectr-surface-raised border-spectr-primary text-spectr-ink font-bold"
                        : "bg-spectr-canvas border-spectr-hairline text-spectr-body hover:text-spectr-ink"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>1 Year (12 Mo)</span>
                    </div>
                    <div className="text-xs text-spectr-success mt-0.5">
                      Billed as 10 mo ({formatTUsdc(currPriceBigInt * 10n)} tUSDC)
                    </div>
                  </button>
                </div>

                <div className="p-3 bg-spectr-canvas border border-spectr-hairline space-y-1 font-mono">
                  <div className="flex justify-between font-bold">
                    <span className="text-spectr-ink">Total Renewal Amount:</span>
                    <span className="text-spectr-primary">{formatTUsdc(renewCostBigInt)} tUSDC</span>
                  </div>
                </div>
              </div>
            )}

            {/* CANCEL DETAILS */}
            {action === "cancel" && (
              <div className="space-y-3">
                <div className="p-3 bg-spectr-surface border border-spectr-danger/40 space-y-2">
                  <div className="flex items-center gap-2 text-spectr-danger font-semibold">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Stop Agreement & Immediate Prorated Refund</span>
                  </div>
                  <p className="text-xs text-spectr-body leading-relaxed">
                    Cancelling stops your agreement at the end of the current period. All future unreleased escrow periods will be refunded immediately back to your wallet address.
                  </p>
                </div>

                <div className="p-3 bg-spectr-canvas border border-spectr-hairline space-y-1 font-mono text-xs">
                  <div className="flex justify-between">
                    <span className="text-spectr-muted">Current Period:</span>
                    <span className="text-spectr-ink">Runs to completion</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-spectr-muted">Future Periods Refund:</span>
                    <span className="text-spectr-success font-semibold">Immediate 100% refund</span>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 bg-spectr-surface border border-spectr-danger text-spectr-danger font-mono text-xs">
                {error}
              </div>
            )}

            <div className="pt-2 flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1 justify-center"
                onClick={onClose}
                disabled={isLoading}
              >
                Back
              </Button>
              <Button
                type="button"
                variant={action === "cancel" ? "danger" : "primary"}
                className="flex-1 justify-center gap-1.5"
                onClick={handleExecute}
                isLoading={isLoading}
              >
                <span>
                  {action === "upgrade"
                    ? `Confirm Upgrade (${formatTUsdc(upgradeCostBigInt)} tUSDC)`
                    : action === "renew"
                    ? `Confirm Renewal (${formatTUsdc(renewCostBigInt)} tUSDC)`
                    : "Confirm Cancellation"}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
