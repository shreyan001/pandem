"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useNearWallet } from "../context/NearWalletContext";
import { Drawer, Button, Badge, Card, CardHeader, CardTitle, CardContent, Stat } from "../ui";
import { Wallet, ShieldCheck, CheckCircle2, ArrowRight, ExternalLink, RefreshCw } from "lucide-react";
import { PANDEM_TOKEN_ID } from "@pandem/shared";

export interface OnboardingDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function OnboardingDrawer({ isOpen, onClose, onSuccess }: OnboardingDrawerProps) {
  const {
    accountId,
    isConnected,
    connect,
    tokenBalance,
    isStorageRegistered,
    refreshBalances,
    setupPaymentsBatch,
  } = useNearWallet();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isSettingUp, setIsSettingUp] = useState<boolean>(false);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [storageTx, setStorageTx] = useState<string | null>(null);
  const [faucetTx, setFaucetTx] = useState<string | null>(null);
  const [batchTx, setBatchTx] = useState<string | null>(null);

  // Parse 6-decimal balance into human readable number
  const rawBalanceBigInt = BigInt(tokenBalance || "0");
  const has50OrMore = rawBalanceBigInt >= 50000000n;

  const formatBalance = (raw: string) => {
    if (!raw || raw === "0") return "0.00";
    try {
      const len = raw.length;
      if (len <= 6) {
        const padded = raw.padStart(6, "0");
        return `0.${padded.slice(0, 2)}`;
      }
      const whole = raw.slice(0, len - 6);
      const frac = raw.slice(len - 6, len - 4);
      return `${whole}.${frac}`;
    } catch {
      return raw;
    }
  };

  // State auto-detection on open or wallet change
  useEffect(() => {
    if (!isOpen) return;

    if (!isConnected || !accountId) {
      setStep(1);
    } else if (isStorageRegistered && has50OrMore) {
      // Returning funded user skips directly to ready step
      setStep(3);
    } else {
      // Connected but needs payments setup
      setStep(2);
    }
  }, [isOpen, isConnected, accountId, isStorageRegistered, has50OrMore]);

  const handleConnectWallet = async () => {
    setSetupError(null);
    try {
      await connect();
    } catch (e: any) {
      setSetupError(e?.message || "Failed to connect wallet");
    }
  };

  const handleSetupPayments = async () => {
    setIsSettingUp(true);
    setSetupError(null);

    try {
      const res = await setupPaymentsBatch();
      if (res.batchTx) {
        setBatchTx(res.batchTx);
        setStorageTx(res.storageTx || res.batchTx);
        setFaucetTx(res.faucetTx || res.batchTx);
      } else {
        if (res.storageTx) setStorageTx(res.storageTx);
        if (res.faucetTx) setFaucetTx(res.faucetTx);
      }

      await refreshBalances();
      setStep(3);
      if (onSuccess) onSuccess();
    } catch (e: any) {
      setSetupError(e?.message || "Payment setup failed. Please try again.");
    } finally {
      setIsSettingUp(false);
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Get Started with Pandem"
      description="Onboard in 3 simple steps: connect your NEAR wallet, set up test payments, and unlock private SaaS subscriptions."
      width="md"
    >
      <div className="space-y-6 font-sans">
        {/* Progress Tracker (3-step indicator) */}
        <div className="grid grid-cols-3 border border-spectr-hairline bg-spectr-canvas font-mono text-xs">
          <div
            className={`p-2.5 text-center border-r border-spectr-hairline transition-colors ${
              step === 1
                ? "bg-spectr-primary text-spectr-ink font-bold"
                : isConnected
                ? "text-spectr-ink font-medium bg-spectr-surface-raised/40"
                : "text-spectr-muted"
            }`}
          >
            1. Connect
          </div>
          <div
            className={`p-2.5 text-center border-r border-spectr-hairline transition-colors ${
              step === 2
                ? "bg-spectr-primary text-spectr-ink font-bold"
                : isStorageRegistered && has50OrMore
                ? "text-spectr-ink font-medium bg-spectr-surface-raised/40"
                : "text-spectr-muted"
            }`}
          >
            2. Payments
          </div>
          <div
            className={`p-2.5 text-center transition-colors ${
              step === 3
                ? "bg-spectr-primary text-spectr-ink font-bold"
                : "text-spectr-muted"
            }`}
          >
            3. Ready
          </div>
        </div>

        {/* STEP 1: Connect Wallet */}
        {step === 1 && (
          <div className="space-y-5">
            <Card className="border-spectr-hairline">
              <CardHeader className="pb-3 space-y-1">
                <div className="flex items-center justify-between">
                  <Badge variant="primary">Step 1</Badge>
                  <Wallet className="w-4 h-4 text-spectr-primary" aria-hidden="true" />
                </div>
                <CardTitle className="text-base">Connect Your NEAR Wallet</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-xs text-spectr-body">
                <p>
                  Connect any supported NEAR wallet using <span className="text-spectr-ink font-mono font-medium">near-connect</span>. Supported wallets include HOT Wallet, Meteor, MyNearWallet, and mobile/email web3 wallets.
                </p>

                <div className="p-3 bg-spectr-canvas border border-spectr-hairline space-y-2 font-mono text-xs">
                  <div className="flex items-center justify-between text-spectr-muted">
                    <span>Network:</span>
                    <span className="text-spectr-ink">NEAR Testnet</span>
                  </div>
                  <div className="flex items-center justify-between text-spectr-muted">
                    <span>Protocol Token:</span>
                    <span className="text-spectr-ink">tUSDC (6 Decimals)</span>
                  </div>
                </div>

                {setupError && (
                  <div className="p-3 bg-spectr-surface border border-spectr-danger text-spectr-danger font-mono text-xs">
                    {setupError}
                  </div>
                )}

                <Button
                  type="button"
                  variant="primary"
                  className="w-full justify-center gap-2"
                  onClick={handleConnectWallet}
                >
                  <Wallet className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Connect NEAR Wallet</span>
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* STEP 2: Set up payments */}
        {step === 2 && (
          <div className="space-y-5">
            <Card className="border-spectr-hairline">
              <CardHeader className="pb-3 space-y-1">
                <div className="flex items-center justify-between">
                  <Badge variant="primary">Step 2</Badge>
                  <ShieldCheck className="w-4 h-4 text-spectr-primary" aria-hidden="true" />
                </div>
                <CardTitle className="text-base">Set Up Testnet Payments</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-xs text-spectr-body">
                <p>
                  To subscribe without transaction failures, your wallet requires token storage registration and testnet funds on the NEP-141 USDC contract.
                </p>

                <div className="p-3 bg-spectr-canvas border border-spectr-hairline space-y-2.5 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-spectr-muted">Account:</span>
                    <span className="text-spectr-ink font-bold truncate max-w-[200px]">{accountId}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-spectr-muted">Storage Registered:</span>
                    <span className={isStorageRegistered ? "text-spectr-success font-medium" : "text-spectr-danger font-medium"}>
                      {isStorageRegistered ? "Registered ✓" : "Needs Registration (0.00125 NEAR)"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-spectr-muted">tUSDC Balance:</span>
                    <span className="text-spectr-ink font-medium">{formatBalance(tokenBalance)} tUSDC</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-spectr-muted">Token Contract:</span>
                    <span className="text-spectr-muted text-xs truncate max-w-[180px]">{PANDEM_TOKEN_ID}</span>
                  </div>
                </div>

                <div className="p-3 bg-spectr-surface-raised border border-spectr-hairline text-xs space-y-1">
                  <div className="font-semibold text-spectr-ink flex items-center gap-1.5">
                    <span>1-Click Batch Transaction</span>
                  </div>
                  <p className="text-spectr-body text-xs leading-relaxed">
                    {!isStorageRegistered && !has50OrMore
                      ? "Executes both storage_deposit and faucet() in a single atomic batch transaction to fund 100 tUSDC."
                      : !isStorageRegistered
                      ? "Registers your account storage on the tUSDC contract."
                      : "Claims 100 tUSDC test tokens from the contract faucet."}
                  </p>
                </div>

                {setupError && (
                  <div className="p-3 bg-spectr-surface border border-spectr-danger text-spectr-danger font-mono text-xs">
                    {setupError}
                  </div>
                )}

                <div className="pt-2 flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 justify-center"
                    onClick={() => setStep(1)}
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    className="flex-1 justify-center gap-2"
                    disabled={isSettingUp}
                    onClick={handleSetupPayments}
                  >
                    {isSettingUp ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                        <span>Signing Batch...</span>
                      </>
                    ) : (
                      <>
                        <span>Set Up Payments</span>
                        <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* STEP 3: You're ready */}
        {step === 3 && (
          <div className="space-y-5">
            <Card className="border-spectr-hairline">
              <CardHeader className="pb-3 space-y-1">
                <div className="flex items-center justify-between">
                  <Badge variant="success" dot>Setup Complete</Badge>
                  <CheckCircle2 className="w-4 h-4 text-spectr-success" aria-hidden="true" />
                </div>
                <CardTitle className="text-base">You're Ready to Subscribe</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-xs text-spectr-body">
                <p>
                  Your wallet is fully initialized and funded for autonomous subscription escrow on NEAR.
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <Stat
                    label="Account"
                    value={accountId ? `${accountId.slice(0, 10)}...` : "Connected"}
                    hint="Signed in on testnet"
                  />
                  <Stat
                    label="Available Balance"
                    value={`${formatBalance(tokenBalance)} tUSDC`}
                    hint="NEP-141 liquid tokens"
                  />
                </div>

                {/* Real Verified Transaction Links */}
                <div className="p-3 bg-spectr-canvas border border-spectr-hairline space-y-2.5 font-mono text-xs">
                  <div className="text-spectr-muted uppercase font-bold text-[11px] pb-1 border-b border-spectr-hairline">
                    Verified On-Chain Transactions
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-spectr-muted">Storage Registration:</span>
                    {storageTx && storageTx !== "already_registered" && storageTx !== "submitted" ? (
                      <a
                        href={`https://explorer.testnet.near.org/transactions/${storageTx}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-spectr-primary hover:underline flex items-center gap-1"
                      >
                        <span>{storageTx.slice(0, 8)}...</span>
                        <ExternalLink className="w-3 h-3" aria-hidden="true" />
                      </a>
                    ) : (
                      <span className="text-spectr-success">Pre-registered ✓</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-spectr-muted">Faucet Claim (100 tUSDC):</span>
                    {faucetTx && faucetTx !== "already_funded" && faucetTx !== "submitted" ? (
                      <a
                        href={`https://explorer.testnet.near.org/transactions/${faucetTx}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-spectr-primary hover:underline flex items-center gap-1"
                      >
                        <span>{faucetTx.slice(0, 8)}...</span>
                        <ExternalLink className="w-3 h-3" aria-hidden="true" />
                      </a>
                    ) : has50OrMore ? (
                      <span className="text-spectr-success">Funded ({formatBalance(tokenBalance)} tUSDC) ✓</span>
                    ) : (
                      <span className="text-spectr-muted">Completed</span>
                    )}
                  </div>

                  {batchTx && batchTx !== "already_funded" && batchTx !== "submitted" && (
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-spectr-hairline">
                      <span className="text-spectr-muted">Single Batch Tx:</span>
                      <a
                        href={`https://explorer.testnet.near.org/transactions/${batchTx}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-spectr-primary hover:underline flex items-center gap-1 font-bold"
                      >
                        <span>{batchTx.slice(0, 10)}...</span>
                        <ExternalLink className="w-3 h-3" aria-hidden="true" />
                      </a>
                    </div>
                  )}
                </div>

                <div className="pt-2 flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 justify-center"
                    onClick={onClose}
                  >
                    Close
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    className="flex-1 justify-center gap-2"
                    onClick={() => {
                      onClose();
                      const storefront = document.getElementById("storefront");
                      if (storefront) storefront.scrollIntoView({ behavior: "smooth" });
                    }}
                  >
                    <span>Browse Storefront</span>
                    <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Drawer>
  );
}
