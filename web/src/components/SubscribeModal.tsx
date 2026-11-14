"use client";

import { useState } from "react";
import Link from "next/link";
import { useNearWallet } from "../context/NearWalletContext";
import { PANDEM_ESCROW_ID, PANDEM_TOKEN_ID, SPLIT_BPS } from "@pandem/shared";
import { ExternalLink, Check, Mail, Lock } from "lucide-react";

interface SubscribeModalProps {
  product: {
    id: string;
    name: string;
    price_per_period: string; // 6-decimal tUSDC (e.g. 5000000 = 5 tUSDC)
    period_display: string;
    grace_display: string;
    slug?: string;
  };
  initialTier?: "free" | "pro" | "max";
  initialYearly?: boolean;
  onClose: () => void;
}

export function SubscribeModal({
  product,
  initialTier = "pro",
  initialYearly = true,
  onClose,
}: SubscribeModalProps) {
  const {
    accountId,
    isConnected,
    connect,
    isStorageRegistered,
    registerStorage,
    sendSubscribe,
    tokenBalance,
  } = useNearWallet();

  const [tier, setTier] = useState<"free" | "pro" | "max">(initialTier);
  const [isYearly, setIsYearly] = useState<boolean>(initialYearly);
  const [periods, setPeriods] = useState<number>(initialYearly ? 12 : 1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Off-chain email collection
  const [email, setEmail] = useState<string>("");
  const [emailSaved, setEmailSaved] = useState<boolean>(false);

  // Price calculations in 6-decimal tUSDC (BigInt safe)
  const basePricePro = BigInt(product.price_per_period || "5000000");
  const pricePerPeriodBigInt =
    tier === "free" ? 0n : tier === "max" ? basePricePro * 3n : basePricePro;
  const billablePeriods = isYearly ? 10n : BigInt(periods);
  const totalAmountBigInt =
    tier === "free" ? 0n : pricePerPeriodBigInt * billablePeriods;
  const totalAmountStr = totalAmountBigInt.toString();

  // Split calculations per period (2.5% fee, 30% ops, 20% contingency, 47.5% steward)
  const feePerPeriod = (pricePerPeriodBigInt * BigInt(SPLIT_BPS.PROTOCOL_FEE)) / BigInt(SPLIT_BPS.TOTAL);
  const opsPerPeriod = (pricePerPeriodBigInt * BigInt(SPLIT_BPS.OPS_RESERVE)) / BigInt(SPLIT_BPS.TOTAL);
  const contingencyPerPeriod = (pricePerPeriodBigInt * BigInt(SPLIT_BPS.CONTINGENCY_RESERVE)) / BigInt(SPLIT_BPS.TOTAL);
  const stewardPerPeriod = pricePerPeriodBigInt - feePerPeriod - opsPerPeriod - contingencyPerPeriod;

  // Format 6-decimal tUSDC to human-readable string
  const formatTUsdc = (raw: bigint | string) => {
    const n = typeof raw === "bigint" ? raw : BigInt(raw);
    const whole = n / 1000000n;
    const frac = (n % 1000000n).toString().padStart(6, "0").slice(0, 2);
    return `${whole}.${frac}`;
  };

  const productSlug = product.slug || product.name.toLowerCase().replace(/[^a-z0-9]/g, "-");
  const accessUrl = `https://${productSlug}.pandem.testnet/session?subscriber=${accountId || "wallet"}&tier=${tier}`;

  const handleRegisterStorage = async () => {
    try {
      setIsRegistering(true);
      setError(null);
      await registerStorage();
    } catch (e: any) {
      setError(e.message || "Failed to register storage deposit");
    } finally {
      setIsRegistering(false);
    }
  };

  const handleSubscribe = async () => {
    if (tier === "free") {
      setTxHash("free_access_activated");
      return;
    }
    if (!isConnected) {
      await connect();
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      const hash = await sendSubscribe(product.id, periods, totalAmountStr, tier);
      setTxHash(hash || "confirmed");
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "Transaction failed. Please verify wallet balance.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    try {
      // Store off-chain in localStorage for this agreement
      const key = `pandem_email_${product.id}_${accountId || "anonymous"}`;
      localStorage.setItem(key, email.trim());
      setEmailSaved(true);
    } catch {
      setEmailSaved(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-none">
      <div className="bg-spectr-surface border border-spectr-hairline rounded-none max-w-xl w-full p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-5 font-sans">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-spectr-hairline">
          <div>
            <h2 className="text-xl font-bold text-spectr-ink flex items-center gap-2">
              Subscribe to {product.name}
            </h2>
            <p className="text-xs text-spectr-muted font-mono mt-1">
              Product ID: #{product.id} · Period: {product.period_display} · Grace: {product.grace_display}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-spectr-muted hover:text-spectr-ink p-1.5 rounded-none hover:bg-spectr-surface-raised border border-transparent hover:border-spectr-hairline transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Success Banner & Post-Subscribe Access Delivery */}
        {txHash ? (
          <div className="space-y-5">
            <div className="p-4 rounded-none bg-spectr-surface-raised border border-spectr-primary text-spectr-ink space-y-3">
              <div className="flex items-center gap-2 font-semibold text-sm text-spectr-primary">
                <span className="w-2 h-2 rounded-none bg-spectr-primary" />
                Subscription Confirmed on Testnet Escrow!
              </div>
              <p className="text-xs text-spectr-body font-mono break-all">
                Tx: {txHash}
              </p>
              <div>
                <a
                  href={`https://explorer.testnet.near.org/transactions/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-spectr-primary hover:text-spectr-primary-hover font-mono underline"
                >
                  <span>View on NEAR Explorer</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Direct Access Link Box */}
            <div className="p-4 rounded-none bg-spectr-canvas border border-spectr-hairline space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-semibold uppercase text-spectr-ink flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-spectr-success" />
                  <span>Enclave Service Access Link</span>
                </span>
                <span className="text-xs font-mono px-2 py-0.5 bg-spectr-surface border border-spectr-hairline text-spectr-success">
                  Hardware Active
                </span>
              </div>
              <p className="text-xs text-spectr-body">
                Your private enclave session is provisioned. Launch the client directly inside your verified browser sandbox:
              </p>
              <div className="pt-1">
                <a
                  href={accessUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 bg-spectr-surface border border-spectr-hairline hover:border-spectr-primary flex items-center justify-between text-xs font-mono text-spectr-primary transition-colors block"
                >
                  <span className="truncate">{accessUrl}</span>
                  <ExternalLink className="w-3.5 h-3.5 shrink-0 ml-2" />
                </a>
              </div>
            </div>

            {/* Off-Chain Email Notification Field */}
            <div className="p-4 rounded-none bg-spectr-canvas border border-spectr-hairline space-y-2.5">
              <div className="flex items-center justify-between">
                <label htmlFor="sub-email" className="text-xs font-mono font-semibold uppercase text-spectr-ink flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-spectr-primary" />
                  <span>Receive Session Credentials via Email</span>
                </label>
                <span className="text-xs font-mono text-spectr-muted bg-spectr-surface border border-spectr-hairline px-1.5 py-0.5">
                  off-chain
                </span>
              </div>
              <p className="text-xs text-spectr-muted">
                Optional: Store your email to receive enclave health alerts and credential recovery links. Data remains off-chain and is never committed to blockchain storage.
              </p>
              {emailSaved ? (
                <div className="p-2.5 bg-spectr-surface border border-spectr-success text-xs font-mono text-spectr-success flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>Email saved off-chain: {email}</span>
                </div>
              ) : (
                <form onSubmit={handleSaveEmail} className="flex gap-2 pt-1">
                  <input
                    id="sub-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="developer@confidential.io"
                    className="flex-1 bg-spectr-surface border border-spectr-hairline text-spectr-ink px-3 py-2 text-xs font-mono rounded-none focus:outline-none focus:border-spectr-primary"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-spectr-surface-raised hover:bg-spectr-surface border border-spectr-hairline text-spectr-ink text-xs font-mono transition-colors"
                  >
                    Save Email
                  </button>
                </form>
              )}
            </div>

            {/* Post-Subscribe Actions */}
            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <Link
                href="/dashboard"
                onClick={onClose}
                className="flex-1 py-3 bg-spectr-primary hover:bg-spectr-primary-hover text-spectr-ink text-center text-xs font-mono font-bold rounded-none transition-colors"
              >
                Go to Subscriber Dashboard →
              </Link>
              <button
                type="button"
                onClick={onClose}
                className="py-3 px-5 border border-spectr-hairline bg-spectr-surface hover:bg-spectr-surface-raised text-spectr-body hover:text-spectr-ink text-xs font-mono rounded-none transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Storage Registration Warning if needed */}
            {isConnected && !isStorageRegistered && (
              <div className="p-3.5 rounded-none bg-spectr-surface-raised border border-spectr-hairline text-spectr-ink text-xs flex items-center justify-between gap-3 font-mono">
                <div>
                  <div className="font-semibold text-spectr-primary">Token Storage Required</div>
                  <div className="text-xs text-spectr-body mt-0.5">
                    Your wallet needs a storage deposit on {PANDEM_TOKEN_ID} (0.0125 NEAR, refundable).
                  </div>
                </div>
                <button
                  onClick={handleRegisterStorage}
                  disabled={isRegistering}
                  className="px-3.5 py-1.5 rounded-none bg-spectr-primary hover:bg-spectr-primary-hover text-spectr-ink font-medium text-xs whitespace-nowrap transition-colors"
                >
                  {isRegistering ? "Registering..." : "Deposit 0.0125 NEAR"}
                </button>
              </div>
            )}

            {/* Tier Selector */}
            <div>
              <label className="block text-xs font-mono uppercase text-spectr-muted mb-2 font-medium">
                Select Service Tier
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "free" as const, label: "Free", price: "$0" },
                  { id: "pro" as const, label: "Pro", price: "$5/mo" },
                  { id: "max" as const, label: "Max", price: "$15/mo" },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTier(t.id)}
                    className={`py-2 px-2 text-center font-mono text-xs border transition-colors ${
                      tier === t.id
                        ? "bg-spectr-surface-raised border-spectr-primary text-spectr-ink font-bold"
                        : "bg-spectr-canvas border-spectr-hairline text-spectr-body hover:text-spectr-ink"
                    }`}
                  >
                    <div>{t.label}</div>
                    <div className="text-xs text-spectr-muted mt-0.5">{t.price}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Billing Cycle Toggle */}
            {tier !== "free" && (
              <div>
                <label className="block text-xs font-mono uppercase text-spectr-muted mb-2 font-medium">
                  Billing Cycle
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsYearly(false);
                      setPeriods(1);
                    }}
                    className={`py-2 px-3 text-center font-mono text-xs border transition-colors ${
                      !isYearly
                        ? "bg-spectr-surface-raised border-spectr-primary text-spectr-ink font-bold"
                        : "bg-spectr-canvas border-spectr-hairline text-spectr-body hover:text-spectr-ink"
                    }`}
                  >
                    <div>Monthly (1 Month)</div>
                    <div className="text-xs text-spectr-muted mt-0.5">
                      {formatTUsdc(pricePerPeriodBigInt)} tUSDC
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsYearly(true);
                      setPeriods(12);
                    }}
                    className={`py-2 px-3 text-center font-mono text-xs border transition-colors ${
                      isYearly
                        ? "bg-spectr-surface-raised border-spectr-primary text-spectr-ink font-bold"
                        : "bg-spectr-canvas border-spectr-hairline text-spectr-body hover:text-spectr-ink"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Yearly (12 Months)</span>
                    </div>
                    <div className="text-xs text-spectr-success mt-0.5">
                      Billed as 10 mo ({formatTUsdc(pricePerPeriodBigInt * 10n)} tUSDC)
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Cost & Split Breakdown */}
            <div className="bg-spectr-canvas rounded-none p-4 border border-spectr-hairline space-y-2.5 font-mono">
              <div className="flex justify-between items-center text-sm font-semibold text-spectr-ink">
                <span>Total Escrow Deposit:</span>
                <span className="text-spectr-primary text-base font-bold">
                  {formatTUsdc(totalAmountBigInt)} tUSDC
                </span>
              </div>
              <div className="text-xs text-spectr-muted">
                {periods} periods × {formatTUsdc(pricePerPeriodBigInt)} tUSDC per period (30 days/period)
              </div>

              <div className="pt-2 border-t border-spectr-hairline space-y-1.5 text-xs text-spectr-body">
                <div className="flex justify-between">
                  <span>Steward Payout (47.5%):</span>
                  <span className="text-spectr-ink">
                    {formatTUsdc(stewardPerPeriod * BigInt(periods))} tUSDC
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Autonomous OpEx (30.0%):</span>
                  <span className="text-spectr-ink">
                    {formatTUsdc(opsPerPeriod * BigInt(periods))} tUSDC
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Contingency Reserve (20.0%):</span>
                  <span className="text-spectr-ink">
                    {formatTUsdc(contingencyPerPeriod * BigInt(periods))} tUSDC
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Protocol Escrow Fee (2.5%):</span>
                  <span className="text-spectr-ink">
                    {formatTUsdc(feePerPeriod * BigInt(periods))} tUSDC
                  </span>
                </div>
              </div>
            </div>

            {/* Verifiable NEP-141 Payload Preview */}
            <div className="font-mono text-xs">
              <div className="flex items-center justify-between mb-1.5">
                <label className="uppercase text-spectr-muted font-medium">
                  On-Chain ft_transfer_call Payload
                </label>
                <span className="text-xs text-spectr-muted">
                  Receiver: {PANDEM_ESCROW_ID.slice(0, 16)}...
                </span>
              </div>
              <div className="bg-spectr-canvas rounded-none p-3.5 border border-spectr-hairline text-xs text-spectr-body overflow-x-auto space-y-1">
                <div><span className="text-spectr-muted">contract:</span> {PANDEM_TOKEN_ID}</div>
                <div><span className="text-spectr-muted">method:</span> ft_transfer_call</div>
                <div><span className="text-spectr-muted">deposit:</span> 1 yoctoNEAR</div>
                <div><span className="text-spectr-muted">amount:</span> {totalAmountStr} ({formatTUsdc(totalAmountBigInt)} tUSDC)</div>
              </div>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="p-3.5 rounded-none bg-spectr-surface border border-spectr-danger text-spectr-danger text-xs font-mono">
                {error}
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2 flex gap-3 font-mono">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 rounded-none border border-spectr-hairline bg-spectr-canvas hover:bg-spectr-surface text-spectr-ink font-medium text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubscribe}
                disabled={isSubmitting}
                className="flex-1 py-3 rounded-none bg-spectr-primary hover:bg-spectr-primary-hover text-spectr-ink font-semibold text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting
                  ? "Submitting to NEAR..."
                  : tier === "free"
                  ? "Claim Free Enclave Access"
                  : !isConnected
                  ? "Connect Wallet & Subscribe"
                  : `Subscribe for ${formatTUsdc(totalAmountBigInt)} tUSDC`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
