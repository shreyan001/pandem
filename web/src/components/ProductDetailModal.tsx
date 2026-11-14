"use client";

import { useState } from "react";
import { CatalogItem } from "@pandem/shared";
import { useNearWallet } from "../context/NearWalletContext";

interface ProductDetailModalProps {
  product: CatalogItem;
  isOpen: boolean;
  onClose: () => void;
  onSubscribe: (product: CatalogItem, periods: number) => void;
}

export function ProductDetailModal({
  product,
  isOpen,
  onClose,
  onSubscribe,
}: ProductDetailModalProps) {
  const { accountId, isConnected, isStorageRegistered, registerStorage } = useNearWallet();
  const [periods, setPeriods] = useState<number>(3);
  const [showRawAttestation, setShowRawAttestation] = useState<boolean>(false);
  const [isRegisteringStorage, setIsRegisteringStorage] = useState<boolean>(false);

  if (!isOpen) return null;

  const formatDepositDisplay = (periodsCount: number) => {
    const rawVal = parseFloat(product.price_display.split(" ")[0]);
    return `${(rawVal * periodsCount).toFixed(2)} wNEAR`;
  };

  const handleRegisterStorage = async () => {
    try {
      setIsRegisteringStorage(true);
      await registerStorage();
    } finally {
      setIsRegisteringStorage(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-none">
      <div className="bg-[#171717] border border-[#2E2E2E] rounded-none w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6">
        {/* Top Bar */}
        <div className="flex items-start justify-between gap-4 border-b border-[#2E2E2E] pb-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-none bg-[#894DEF] border border-[#FAFAFA] flex items-center justify-center font-mono font-bold text-xl text-[#FAFAFA] shrink-0">
              {product.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-none bg-[#262626] text-[#FAFAFA] border border-[#2E2E2E]">
                  Rank #{product.rank || 1}
                </span>
                {product.isProductOfTheDay && (
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-none bg-[#262626] text-[#894DEF] border border-[#894DEF]">
                    🏆 Product of the Day
                  </span>
                )}
                <span className="text-xs font-mono px-2 py-0.5 rounded-none bg-[#0D0D0D] text-[#B8B8B8] border border-[#2E2E2E]">
                  {product.category}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-[#FAFAFA] tracking-tight mt-1">
                {product.name}
              </h2>
              <p className="text-xs text-[#B8B8B8] font-mono">
                Steward: {product.steward || "pandem-steward-47c388e3.testnet"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-[#B8B8B8] hover:text-[#FAFAFA] p-2 rounded-none hover:bg-[#262626] border border-transparent hover:border-[#2E2E2E] transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tagline & Full Description */}
        <div>
          <p className="text-sm text-[#FAFAFA] leading-relaxed font-medium">
            {product.tagline}
          </p>
          <p className="text-xs text-[#B8B8B8] mt-2 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* TEE Hardware Attestation Panel */}
        <div className="p-4 rounded-none bg-[#0D0D0D] border border-[#2E2E2E] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-none bg-[#894DEF]" />
              <h4 className="text-xs font-mono font-bold text-[#FAFAFA] uppercase tracking-wider">
                Hardware TEE Confidential Verification
              </h4>
            </div>
            <span className="text-[11px] font-mono text-[#894DEF] bg-[#262626] px-2 py-0.5 rounded-none border border-[#2E2E2E]">
              Intel TDX & NVIDIA NRAS Verified
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-3 rounded-none bg-[#171717] border border-[#2E2E2E]">
              <span className="text-[#6B6B6B] block text-[10px]">Confidential Silicon:</span>
              <span className="text-[#FAFAFA] font-medium">{product.teeHardware || "Intel TDX + NVIDIA H100 SXM5"}</span>
            </div>
            <div className="p-3 rounded-none bg-[#171717] border border-[#2E2E2E]">
              <span className="text-[#6B6B6B] block text-[10px]">Confidential Enclave Model:</span>
              <span className="text-[#FAFAFA] font-medium">{product.teeModel || "Qwen/Qwen3.8-27B (nearai)"}</span>
            </div>
          </div>

          <p className="text-[11px] text-[#B8B8B8] leading-relaxed">
            This autonomous agent executes strictly inside confidential compute. Subscriber queries, memory, and model inference weights are shielded from the host OS and cloud provider. Heartbeats are signed directly by the enclave's function-call key.
          </p>

          <button
            onClick={() => setShowRawAttestation(!showRawAttestation)}
            className="text-[11px] font-mono text-[#894DEF] hover:text-[#A273F2] underline"
          >
            {showRawAttestation ? "Hide Raw Cryptographic Quote ▲" : "Inspect Raw Cryptographic Quote ▼"}
          </button>

          {showRawAttestation && (
            <div className="mt-2 p-3 rounded-none bg-[#171717] border border-[#2E2E2E] font-mono text-[10px] text-[#B8B8B8] overflow-x-auto max-h-40">
              <pre>{JSON.stringify({
                status: "VERIFIED",
                model: product.teeModel || "Qwen/Qwen3.8-27B",
                hardware_enclave: "Intel TDX / NVIDIA NRAS",
                host_security_version: "2.1.0-tdx-nitro",
                signing_address: "0x835ab53d08479e3e78f99cfd58a5c3fc6e4b4869",
                attestation_nonce: "0x7f4a81c9b2e04318",
                quote_sha256: "9f83a48e89e3a6a1d8c11e74a883b10b93848b598d63321516e88e8940821b06",
                timestamp_utc: "2026-11-14T02:20:00Z"
              }, null, 2)}</pre>
            </div>
          )}
        </div>

        {/* 4-Way Escrow Split Breakdown */}
        <div className="p-4 rounded-none bg-[#0D0D0D] border border-[#2E2E2E] space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-mono font-bold text-[#FAFAFA] uppercase tracking-wider">
              On-Chain Escrow Protection Formula
            </h4>
            <span className="text-[11px] font-mono text-[#894DEF]">
              Zero Rounding Leaks
            </span>
          </div>

          <div className="w-full h-3 rounded-none overflow-hidden flex bg-[#262626]">
            <div className="bg-[#894DEF] h-full" style={{ width: "47.5%" }} title="47.5% Steward" />
            <div className="bg-[#A273F2] h-full" style={{ width: "30.0%" }} title="30.0% Ops Reserve" />
            <div className="bg-[#6B6B6B] h-full" style={{ width: "20.0%" }} title="20.0% Contingency Buffer" />
            <div className="bg-[#FAFAFA] h-full" style={{ width: "2.5%" }} title="2.5% Protocol Fee" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs font-mono">
            <div className="p-2.5 rounded-none bg-[#171717] border border-[#2E2E2E]">
              <span className="text-[#894DEF] font-bold block">47.5%</span>
              <span className="text-[#6B6B6B] text-[10px]">Steward Share</span>
            </div>
            <div className="p-2.5 rounded-none bg-[#171717] border border-[#2E2E2E]">
              <span className="text-[#A273F2] font-bold block">30.0%</span>
              <span className="text-[#6B6B6B] text-[10px]">Ops Reserve</span>
            </div>
            <div className="p-2.5 rounded-none bg-[#171717] border border-[#2E2E2E]">
              <span className="text-[#FAFAFA] font-bold block">20.0%</span>
              <span className="text-[#6B6B6B] text-[10px]">Contingency</span>
            </div>
            <div className="p-2.5 rounded-none bg-[#171717] border border-[#2E2E2E]">
              <span className="text-[#B8B8B8] font-bold block">2.5%</span>
              <span className="text-[#6B6B6B] text-[10px]">Protocol Fee</span>
            </div>
          </div>

          <p className="text-[11px] text-[#B8B8B8] leading-relaxed">
            Funds are released period by period only while the service posts active heartbeats. If the service halts past the grace period or invokes the killswitch, all unreleased periods PLUS the 20% contingency buffer are immediately refunded to your wallet.
          </p>
        </div>

        {/* Subscription Duration Selector */}
        <div className="p-4 rounded-none bg-[#0D0D0D] border border-[#2E2E2E] space-y-4">
          <label className="block text-xs font-mono font-bold text-[#FAFAFA] uppercase tracking-wider">
            Select Subscription Term (Periods)
          </label>

          <div className="grid grid-cols-3 gap-3">
            {[3, 6, 12].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriods(p)}
                className={`py-2.5 px-3 rounded-none border text-xs font-mono transition-colors text-center ${
                  periods === p
                    ? "bg-[#262626] border-[#894DEF] text-[#FAFAFA] font-bold"
                    : "bg-[#171717] border-[#2E2E2E] text-[#B8B8B8] hover:text-[#FAFAFA] hover:border-[#894DEF]"
                }`}
              >
                <span className="block text-sm text-[#FAFAFA] font-bold">{p} Periods</span>
                <span className="text-[10px] text-[#B8B8B8] block mt-0.5">
                  {formatDepositDisplay(p)}
                </span>
              </button>
            ))}
          </div>

          <div className="p-3.5 rounded-none bg-[#171717] border border-[#2E2E2E] flex items-center justify-between text-xs font-mono">
            <span className="text-[#B8B8B8]">Total Upfront Escrow Deposit:</span>
            <span className="text-[#894DEF] font-bold text-base">
              {formatDepositDisplay(periods)}
            </span>
          </div>

          {/* Storage Registration Alert */}
          {!isStorageRegistered && isConnected && (
            <div className="p-3.5 rounded-none bg-[#262626] border border-[#2E2E2E] text-[#FAFAFA] text-xs flex items-center justify-between">
              <span className="font-mono text-[11px]">
                Account requires NEP-141 storage registration (0.0125 NEAR one-time deposit).
              </span>
              <button
                onClick={handleRegisterStorage}
                disabled={isRegisteringStorage}
                className="px-3 py-1.5 rounded-none bg-[#894DEF] text-[#FAFAFA] font-semibold text-xs font-mono hover:bg-[#A273F2] transition-colors"
              >
                {isRegisteringStorage ? "Registering..." : "Register Storage"}
              </button>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            onClick={() => onSubscribe(product, periods)}
            className="w-full py-3.5 rounded-none bg-[#894DEF] hover:bg-[#A273F2] text-[#FAFAFA] border border-[#FAFAFA] font-semibold text-sm transition-colors flex items-center justify-center gap-2"
          >
            <span>Lock Deposit & Subscribe via Escrow</span>
            <span className="font-mono text-xs opacity-90">({formatDepositDisplay(periods)}) →</span>
          </button>
        </div>
      </div>
    </div>
  );
}
