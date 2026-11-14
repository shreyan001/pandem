"use client";

import { useState } from "react";
import { useNearWallet } from "../context/NearWalletContext";
import { PANDEM_ESCROW_ID, PANDEM_TOKEN_ID, SPLIT_BPS } from "@pandem/shared";

interface SubscribeModalProps {
  product: {
    id: string;
    name: string;
    price_per_period: string; // yocto wNEAR (e.g. 100000000000000000000000 = 0.1)
    period_display: string;
    grace_display: string;
  };
  onClose: () => void;
}

export function SubscribeModal({ product, onClose }: SubscribeModalProps) {
  const {
    accountId,
    isConnected,
    connect,
    isStorageRegistered,
    registerStorage,
    sendSubscribe,
    tokenBalance,
  } = useNearWallet();

  const [periods, setPeriods] = useState<number>(3);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Price calculations in yocto (BigInt safe)
  const pricePerPeriodBigInt = BigInt(product.price_per_period);
  const totalAmountBigInt = pricePerPeriodBigInt * BigInt(periods);
  const totalAmountStr = totalAmountBigInt.toString();

  // Split calculations per period (2.5% fee, 30% ops, 20% contingency, 47.5% steward)
  const feePerPeriod = (pricePerPeriodBigInt * BigInt(SPLIT_BPS.PROTOCOL_FEE)) / BigInt(SPLIT_BPS.TOTAL);
  const opsPerPeriod = (pricePerPeriodBigInt * BigInt(SPLIT_BPS.OPS_RESERVE)) / BigInt(SPLIT_BPS.TOTAL);
  const contingencyPerPeriod = (pricePerPeriodBigInt * BigInt(SPLIT_BPS.CONTINGENCY_RESERVE)) / BigInt(SPLIT_BPS.TOTAL);
  const stewardPerPeriod = pricePerPeriodBigInt - feePerPeriod - opsPerPeriod - contingencyPerPeriod;

  // Format to NEAR string (24 decimals)
  const formatYocto = (yocto: bigint) => {
    const s = yocto.toString().padStart(25, "0");
    const intPart = s.slice(0, s.length - 24) || "0";
    const decPart = s.slice(s.length - 24, s.length - 20);
    return `${intPart}.${decPart}`;
  };

  // The exact NEP-141 ft_on_transfer msg JSON string
  const subscribeMsgPayload = {
    product_id: product.id,
    periods,
    subscriber: accountId ?? "your-wallet.testnet",
    refund_to: accountId ?? "your-wallet.testnet",
  };
  const subscribeMsgJson = JSON.stringify(subscribeMsgPayload, null, 2);

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
    if (!isConnected) {
      await connect();
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      const hash = await sendSubscribe(product.id, periods, totalAmountStr);
      setTxHash(hash || "confirmed");
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "Transaction failed. Please verify wallet balance.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Subscribe to {product.name}
            </h2>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">
              Product ID: #{product.id} · Period: {product.period_display} · Grace: {product.grace_display}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Success Banner */}
        {txHash && (
          <div className="my-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <div className="flex items-center gap-2 font-semibold text-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Subscription Confirmed on Testnet!
            </div>
            <p className="text-xs text-zinc-300 mt-1 font-mono break-all">
              Tx: {txHash}
            </p>
            <div className="mt-3 flex gap-2">
              <a
                href={`https://explorer.testnet.near.org/transactions/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs bg-emerald-500 hover:bg-emerald-400 text-black font-medium px-3 py-1.5 rounded-lg transition-colors inline-block"
              >
                View on Explorer →
              </a>
              <button
                onClick={onClose}
                className="text-xs bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-1.5 rounded-lg transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="my-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
            {error}
          </div>
        )}

        {!txHash && (
          <div className="space-y-5 my-4">
            {/* Storage Registration Warning if needed */}
            {isConnected && !isStorageRegistered && (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between gap-3">
                <div>
                  <div className="font-semibold">Token Storage Required</div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">
                    Your wallet needs a storage deposit on {PANDEM_TOKEN_ID} (0.0125 NEAR, refundable).
                  </div>
                </div>
                <button
                  onClick={handleRegisterStorage}
                  disabled={isRegistering}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-medium font-mono text-xs whitespace-nowrap transition-colors"
                >
                  {isRegistering ? "Registering..." : "Deposit 0.0125 NEAR"}
                </button>
              </div>
            )}

            {/* Period Selector */}
            <div>
              <label className="block text-xs font-mono uppercase text-zinc-400 mb-2 font-medium">
                Select Pre-Funded Periods
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 6].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPeriods(p)}
                    className={`py-2 px-3 rounded-xl text-center font-mono text-sm border transition-all ${
                      periods === p
                        ? "bg-emerald-500/10 border-emerald-500 text-emerald-400 font-bold shadow-sm shadow-emerald-500/10"
                        : "bg-zinc-800/60 border-zinc-700 text-zinc-300 hover:border-zinc-500"
                    }`}
                  >
                    {p} {p === 1 ? "Period" : "Periods"}
                  </button>
                ))}
              </div>
            </div>

            {/* Cost & Split Breakdown */}
            <div className="bg-zinc-950/70 rounded-xl p-4 border border-zinc-800/80 space-y-2.5">
              <div className="flex justify-between items-center text-sm font-semibold text-white">
                <span>Total Escrow Deposit:</span>
                <span className="font-mono text-emerald-400 text-base">
                  {formatYocto(totalAmountBigInt)} wNEAR
                </span>
              </div>
              <div className="text-[11px] text-zinc-500 font-mono">
                {periods} × {formatYocto(pricePerPeriodBigInt)} wNEAR per period
              </div>

              <div className="pt-2 border-t border-zinc-800/80 space-y-1.5 text-xs text-zinc-400">
                <div className="flex justify-between font-mono">
                  <span>Steward Payout (47.5%):</span>
                  <span className="text-zinc-200">
                    {formatYocto(stewardPerPeriod * BigInt(periods))} wNEAR
                  </span>
                </div>
                <div className="flex justify-between font-mono">
                  <span>Ops Reserve (30.0%):</span>
                  <span className="text-zinc-200">
                    {formatYocto(opsPerPeriod * BigInt(periods))} wNEAR
                  </span>
                </div>
                <div className="flex justify-between font-mono">
                  <span>Contingency Reserve (20.0%):</span>
                  <span className="text-zinc-200">
                    {formatYocto(contingencyPerPeriod * BigInt(periods))} wNEAR
                  </span>
                </div>
                <div className="flex justify-between font-mono">
                  <span>Protocol Fee (2.5%):</span>
                  <span className="text-zinc-200">
                    {formatYocto(feePerPeriod * BigInt(periods))} wNEAR
                  </span>
                </div>
              </div>
            </div>

            {/* Verifiable NEP-141 Payload Preview */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-mono uppercase text-zinc-400 font-medium">
                  On-Chain ft_transfer_call Payload
                </label>
                <span className="text-[10px] font-mono text-zinc-500">
                  Receiver: {PANDEM_ESCROW_ID.slice(0, 16)}...
                </span>
              </div>
              <div className="bg-black/80 rounded-xl p-3 border border-zinc-800 font-mono text-[11px] text-zinc-300 overflow-x-auto space-y-1">
                <div><span className="text-zinc-500">contract:</span> {PANDEM_TOKEN_ID}</div>
                <div><span className="text-zinc-500">method:</span> ft_transfer_call</div>
                <div><span className="text-zinc-500">deposit:</span> 1 yoctoNEAR</div>
                <div><span className="text-zinc-500">amount:</span> {totalAmountStr}</div>
                <div className="text-zinc-500 pt-1">msg (JSON payload):</div>
                <pre className="text-emerald-400 text-[10px] pl-2 border-l border-zinc-700">
                  {subscribeMsgJson}
                </pre>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-zinc-700 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 font-medium text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubscribe}
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-emerald-500/20"
              >
                {isSubmitting
                  ? "Submitting to NEAR..."
                  : !isConnected
                  ? "Connect Wallet & Subscribe"
                  : `Subscribe for ${formatYocto(totalAmountBigInt)} wNEAR`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
