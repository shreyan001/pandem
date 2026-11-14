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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-none">
      <div className="bg-[#171717] border border-[#2E2E2E] rounded-none max-w-xl w-full p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#2E2E2E]">
          <div>
            <h2 className="text-xl font-bold text-[#FAFAFA] flex items-center gap-2">
              Subscribe to {product.name}
            </h2>
            <p className="text-xs text-[#B8B8B8] font-mono mt-1">
              Product ID: #{product.id} · Period: {product.period_display} · Grace: {product.grace_display}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[#B8B8B8] hover:text-[#FAFAFA] p-1.5 rounded-none hover:bg-[#262626] border border-transparent hover:border-[#2E2E2E] transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Success Banner */}
        {txHash && (
          <div className="p-4 rounded-none bg-[#262626] border border-[#894DEF] text-[#FAFAFA] space-y-2">
            <div className="flex items-center gap-2 font-semibold text-sm">
              <span className="w-2 h-2 rounded-none bg-[#894DEF]" />
              Subscription Confirmed on Testnet!
            </div>
            <p className="text-xs text-[#B8B8B8] font-mono break-all">
              Tx: {txHash}
            </p>
            <div className="mt-3 flex gap-2">
              <a
                href={`https://explorer.testnet.near.org/transactions/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs bg-[#894DEF] hover:bg-[#A273F2] text-[#FAFAFA] font-medium px-3.5 py-2 rounded-none border border-[#FAFAFA] transition-colors inline-block"
              >
                View on Explorer →
              </a>
              <button
                onClick={onClose}
                className="text-xs bg-[#171717] hover:bg-[#0D0D0D] text-[#FAFAFA] px-3.5 py-2 rounded-none border border-[#2E2E2E] transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-none bg-[#262626] border border-red-700 text-red-400 text-xs">
            {error}
          </div>
        )}

        {!txHash && (
          <div className="space-y-5">
            {/* Storage Registration Warning if needed */}
            {isConnected && !isStorageRegistered && (
              <div className="p-3.5 rounded-none bg-[#262626] border border-[#2E2E2E] text-[#FAFAFA] text-xs flex items-center justify-between gap-3">
                <div>
                  <div className="font-semibold text-[#894DEF]">Token Storage Required</div>
                  <div className="text-[11px] text-[#B8B8B8] mt-0.5">
                    Your wallet needs a storage deposit on {PANDEM_TOKEN_ID} (0.0125 NEAR, refundable).
                  </div>
                </div>
                <button
                  onClick={handleRegisterStorage}
                  disabled={isRegistering}
                  className="px-3.5 py-1.5 rounded-none bg-[#894DEF] hover:bg-[#A273F2] text-[#FAFAFA] font-medium font-mono text-xs whitespace-nowrap transition-colors"
                >
                  {isRegistering ? "Registering..." : "Deposit 0.0125 NEAR"}
                </button>
              </div>
            )}

            {/* Period Selector */}
            <div>
              <label className="block text-xs font-mono uppercase text-[#B8B8B8] mb-2 font-medium">
                Select Pre-Funded Periods
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 6].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPeriods(p)}
                    className={`py-2.5 px-3 rounded-none text-center font-mono text-sm border transition-colors ${
                      periods === p
                        ? "bg-[#262626] border-[#894DEF] text-[#FAFAFA] font-bold"
                        : "bg-[#0D0D0D] border-[#2E2E2E] text-[#B8B8B8] hover:text-[#FAFAFA] hover:border-[#894DEF]"
                    }`}
                  >
                    {p} {p === 1 ? "Period" : "Periods"}
                  </button>
                ))}
              </div>
            </div>

            {/* Cost & Split Breakdown */}
            <div className="bg-[#0D0D0D] rounded-none p-4 border border-[#2E2E2E] space-y-2.5">
              <div className="flex justify-between items-center text-sm font-semibold text-[#FAFAFA]">
                <span>Total Escrow Deposit:</span>
                <span className="font-mono text-[#894DEF] text-base font-bold">
                  {formatYocto(totalAmountBigInt)} wNEAR
                </span>
              </div>
              <div className="text-[11px] text-[#6B6B6B] font-mono">
                {periods} × {formatYocto(pricePerPeriodBigInt)} wNEAR per period
              </div>

              <div className="pt-2 border-t border-[#2E2E2E] space-y-1.5 text-xs text-[#B8B8B8]">
                <div className="flex justify-between font-mono">
                  <span>Steward Payout (47.5%):</span>
                  <span className="text-[#FAFAFA]">
                    {formatYocto(stewardPerPeriod * BigInt(periods))} wNEAR
                  </span>
                </div>
                <div className="flex justify-between font-mono">
                  <span>Ops Reserve (30.0%):</span>
                  <span className="text-[#FAFAFA]">
                    {formatYocto(opsPerPeriod * BigInt(periods))} wNEAR
                  </span>
                </div>
                <div className="flex justify-between font-mono">
                  <span>Contingency Reserve (20.0%):</span>
                  <span className="text-[#FAFAFA]">
                    {formatYocto(contingencyPerPeriod * BigInt(periods))} wNEAR
                  </span>
                </div>
                <div className="flex justify-between font-mono">
                  <span>Protocol Fee (2.5%):</span>
                  <span className="text-[#FAFAFA]">
                    {formatYocto(feePerPeriod * BigInt(periods))} wNEAR
                  </span>
                </div>
              </div>
            </div>

            {/* Verifiable NEP-141 Payload Preview */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-mono uppercase text-[#B8B8B8] font-medium">
                  On-Chain ft_transfer_call Payload
                </label>
                <span className="text-[10px] font-mono text-[#6B6B6B]">
                  Receiver: {PANDEM_ESCROW_ID.slice(0, 16)}...
                </span>
              </div>
              <div className="bg-[#0D0D0D] rounded-none p-3.5 border border-[#2E2E2E] font-mono text-[11px] text-[#B8B8B8] overflow-x-auto space-y-1">
                <div><span className="text-[#6B6B6B]">contract:</span> {PANDEM_TOKEN_ID}</div>
                <div><span className="text-[#6B6B6B]">method:</span> ft_transfer_call</div>
                <div><span className="text-[#6B6B6B]">deposit:</span> 1 yoctoNEAR</div>
                <div><span className="text-[#6B6B6B]">amount:</span> {totalAmountStr}</div>
                <div className="text-[#6B6B6B] pt-1">msg (JSON payload):</div>
                <pre className="text-[#FAFAFA] text-[10px] pl-2 border-l border-[#2E2E2E]">
                  {subscribeMsgJson}
                </pre>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 rounded-none border border-[#2E2E2E] bg-[#0D0D0D] hover:bg-[#262626] text-[#FAFAFA] font-medium text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubscribe}
                disabled={isSubmitting}
                className="flex-1 py-3 rounded-none bg-[#894DEF] hover:bg-[#A273F2] text-[#FAFAFA] border border-[#FAFAFA] font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
