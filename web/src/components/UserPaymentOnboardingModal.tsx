"use client";

import React, { useState } from "react";
import { useNearWallet } from "../context/NearWalletContext";

export interface OnboardedPaymentMethod {
  name: string;
  walletType: "google_passkey" | "metamask_base" | "phantom_solana" | "near_native";
  sourceChain: string;
  sourceToken: string;
  nearAccountId: string;
}

interface UserPaymentOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (data: OnboardedPaymentMethod) => void;
}

export function UserPaymentOnboardingModal({ isOpen, onClose, onComplete }: UserPaymentOnboardingModalProps) {
  const { accountId, setManualAccount } = useNearWallet();
  const [step, setStep] = useState<number>(1);
  const [userName, setUserName] = useState<string>("");
  const [walletType, setWalletType] = useState<"google_passkey" | "metamask_base" | "phantom_solana" | "near_native">("metamask_base");
  const [sourceChain, setSourceChain] = useState<string>("Base");
  const [sourceToken, setSourceToken] = useState<string>("USDC");
  const [isCreatingAccount, setIsCreatingAccount] = useState<boolean>(false);
  const [derivedNearAccount, setDerivedNearAccount] = useState<string>("");

  if (!isOpen) return null;

  const handleCreateOrConnect = async () => {
    setIsCreatingAccount(true);
    try {
      await new Promise((r) => setTimeout(r, 1000));

      let generatedAccount = "";
      if (walletType === "google_passkey") {
        const cleanHandle = userName.toLowerCase().replace(/[^a-z0-9]/g, "") || "subscriber";
        generatedAccount = `${cleanHandle}.testnet`;
      } else if (walletType === "metamask_base") {
        generatedAccount = `0x${Math.random().toString(16).substring(2, 10)}...near`;
      } else if (walletType === "phantom_solana") {
        generatedAccount = `sol_${Math.random().toString(36).substring(2, 10)}.testnet`;
      } else {
        generatedAccount = accountId || "subscriber.testnet";
      }

      setDerivedNearAccount(generatedAccount);
      if (setManualAccount) {
        setManualAccount(generatedAccount);
      }
      setStep(3);
    } finally {
      setIsCreatingAccount(false);
    }
  };

  const handleFinish = () => {
    const method: OnboardedPaymentMethod = {
      name: userName || "Anonymous Subscriber",
      walletType,
      sourceChain,
      sourceToken,
      nearAccountId: derivedNearAccount || accountId || "subscriber.testnet",
    };
    onComplete(method);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-xl bg-[#171717] border border-[#2E2E2E] shadow-2xl p-6 sm:p-8 space-y-6 text-[#FAFAFA] font-mono">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#2E2E2E] pb-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#894DEF]" />
            <div>
              <h3 className="text-sm sm:text-base font-bold uppercase tracking-wider text-[#FAFAFA]">
                Add a Payment Method • NEAR Intents
              </h3>
              <span className="text-[10px] text-[#894DEF] block">
                Pay with ANY Token • Contract Settlements Occur in USDC on NEAR
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#B8B8B8] hover:text-[#FAFAFA] text-sm p-1.5 hover:bg-zinc-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Step Indicator */}
        <div className="grid grid-cols-3 border border-[#2E2E2E] bg-[#0D0D0D] text-[11px] text-center">
          <div className={`p-2.5 border-r border-[#2E2E2E] ${step === 1 ? "bg-[#894DEF] text-white font-bold" : "text-[#B8B8B8]"}`}>
            1. Identity
          </div>
          <div className={`p-2.5 border-r border-[#2E2E2E] ${step === 2 ? "bg-[#894DEF] text-white font-bold" : "text-[#B8B8B8]"}`}>
            2. Wallet & Intents
          </div>
          <div className={`p-2.5 ${step === 3 ? "bg-[#894DEF] text-white font-bold" : "text-[#B8B8B8]"}`}>
            3. Active Guarantee
          </div>
        </div>

        {/* Step 1: User Identity */}
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-xs text-[#B8B8B8] leading-relaxed">
              Pandem connects your existing Web3 wallet or Google account to a non-custodial NEAR Escrow contract. Enter your subscriber handle to continue.
            </p>

            <div>
              <label className="block text-[11px] text-[#B8B8B8] uppercase mb-1">Subscriber Display Handle *</label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="e.g. Satoshi (or your organization name)"
                className="w-full bg-[#0D0D0D] border border-[#2E2E2E] p-2.5 text-xs text-white focus:outline-none focus:border-[#894DEF]"
              />
            </div>

            {/* Explanation callout */}
            <div className="p-3 bg-[#0D0D0D] border border-[#2E2E2E] text-[11px] text-[#B8B8B8] space-y-1">
              <span className="text-white font-bold block">How NEAR Intents 1Click Works:</span>
              <p>
                You can fund your subscriptions using <strong>ANY token</strong> (ETH, SOL, USDC, USDT) on any supported chain. The decentralized solver mesh executes atomic conversion so all on-chain escrow contracts settle in <strong>USDC on NEAR</strong>.
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setStep(2)}
                disabled={!userName.trim()}
                className="px-6 py-2.5 bg-[#894DEF] hover:bg-[#A273F2] disabled:opacity-50 text-white font-bold text-xs uppercase transition-colors"
              >
                Next: Select Payment Method →
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Choose Wallet & Source Chain */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-xs text-[#B8B8B8] leading-relaxed">
              Select your preferred funding source. You can pay with <strong className="text-white">ANY token (ETH, SOL, USDC, USDT)</strong> while contract settlements occur in USDC on NEAR.
            </p>

            <div className="space-y-2">
              <label className="block text-[11px] text-[#B8B8B8] uppercase">Supported Onboarding Methods</label>

              {/* 1. MetaMask / Base (Ethereum L2) */}
              <div
                onClick={() => {
                  setWalletType("metamask_base");
                  setSourceChain("Base");
                  setSourceToken("USDC");
                }}
                className={`p-3 border cursor-pointer flex items-center justify-between text-xs transition-colors ${
                  walletType === "metamask_base" ? "bg-[#0D0D0D] border-[#894DEF]" : "bg-[#0D0D0D] border-[#2E2E2E] hover:border-zinc-700"
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">MetaMask / Base (Ethereum L2)</span>
                    <span className="text-[9px] px-1.5 py-0.2 bg-blue-500/20 text-blue-400 border border-blue-500/30">Popular</span>
                  </div>
                  <span className="text-[10px] text-[#B8B8B8] block mt-0.5">Pay with ETH or USDC on Base; instant 1Click settlement</span>
                </div>
                <span className="text-[10px] text-[#894DEF] font-bold">EVM</span>
              </div>

              {/* 2. Solana Phantom */}
              <div
                onClick={() => {
                  setWalletType("phantom_solana");
                  setSourceChain("Solana");
                  setSourceToken("USDC");
                }}
                className={`p-3 border cursor-pointer flex items-center justify-between text-xs transition-colors ${
                  walletType === "phantom_solana" ? "bg-[#0D0D0D] border-[#894DEF]" : "bg-[#0D0D0D] border-[#2E2E2E] hover:border-zinc-700"
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">Phantom / Solana Wallet</span>
                    <span className="text-[9px] px-1.5 py-0.2 bg-purple-500/20 text-purple-400 border border-purple-500/30">Fast</span>
                  </div>
                  <span className="text-[10px] text-[#B8B8B8] block mt-0.5">Pay with SOL or USDC-SPL; sub-second cross-chain intent</span>
                </div>
                <span className="text-[10px] text-purple-400 font-bold">Solana</span>
              </div>

              {/* 3. Google Web3 Email (FastAuth) */}
              <div
                onClick={() => {
                  setWalletType("google_passkey");
                  setSourceChain("Arbitrum");
                  setSourceToken("USDC");
                }}
                className={`p-3 border cursor-pointer flex items-center justify-between text-xs transition-colors ${
                  walletType === "google_passkey" ? "bg-[#0D0D0D] border-[#894DEF]" : "bg-[#0D0D0D] border-[#2E2E2E] hover:border-zinc-700"
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">Google Web3 Email Onboarding</span>
                    <span className="text-[9px] px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">No Seed Phrase</span>
                  </div>
                  <span className="text-[10px] text-[#B8B8B8] block mt-0.5">One-click passkey sign-in; automatic non-custodial NEAR account</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-bold">Email Web3</span>
              </div>

              {/* 4. Native NEAR Wallet */}
              <div
                onClick={() => {
                  setWalletType("near_native");
                  setSourceChain("NEAR");
                  setSourceToken("tUSDC");
                }}
                className={`p-3 border cursor-pointer flex items-center justify-between text-xs transition-colors ${
                  walletType === "near_native" ? "bg-[#0D0D0D] border-[#894DEF]" : "bg-[#0D0D0D] border-[#2E2E2E] hover:border-zinc-700"
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">Native NEAR Wallet (HOT / Meteor)</span>
                  </div>
                  <span className="text-[10px] text-[#B8B8B8] block mt-0.5">Direct connection to NEAR testnet via @hot-labs/near-connect</span>
                </div>
                <span className="text-[10px] text-zinc-400 font-bold">Direct</span>
              </div>
            </div>

            {/* Source Chain & Asset Selectors */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[10px] text-[#B8B8B8] uppercase mb-1">Source Funding Chain</label>
                <select
                  value={sourceChain}
                  onChange={(e) => setSourceChain(e.target.value)}
                  className="w-full bg-[#0D0D0D] border border-[#2E2E2E] p-2 text-xs text-white focus:outline-none focus:border-[#894DEF]"
                >
                  <option value="Base">Base (L2)</option>
                  <option value="Solana">Solana</option>
                  <option value="Ethereum">Ethereum</option>
                  <option value="Arbitrum">Arbitrum</option>
                  <option value="NEAR">NEAR Testnet</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-[#B8B8B8] uppercase mb-1">Payment Token</label>
                <select
                  value={sourceToken}
                  onChange={(e) => setSourceToken(e.target.value)}
                  className="w-full bg-[#0D0D0D] border border-[#2E2E2E] p-2 text-xs text-white focus:outline-none focus:border-[#894DEF]"
                >
                  <option value="USDC">USDC (Stablecoin)</option>
                  <option value="ETH">ETH (Ether)</option>
                  <option value="SOL">SOL (Solana)</option>
                  <option value="USDT">USDT (Tether)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <button
                onClick={() => setStep(1)}
                className="px-5 py-2.5 bg-[#262626] border border-[#2E2E2E] text-white text-xs uppercase hover:bg-zinc-800 transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={handleCreateOrConnect}
                disabled={isCreatingAccount}
                className="px-6 py-2.5 bg-[#894DEF] hover:bg-[#A273F2] disabled:opacity-50 text-white font-bold text-xs uppercase transition-colors"
              >
                {isCreatingAccount ? "Configuring Onboarding..." : "Confirm Payment Method →"}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Success Confirmation */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="p-4 bg-[#0D0D0D] border border-[#2E2E2E] space-y-2">
              <span className="text-[10px] text-[#4ADE80] uppercase tracking-wider block font-bold">
                ✓ Payment Method & NEAR Account Active
              </span>
              <div className="text-xs space-y-1.5 pt-1">
                <div className="flex justify-between text-[#B8B8B8]">
                  <span>Subscriber Handle:</span>
                  <strong className="text-white">{userName}</strong>
                </div>
                <div className="flex justify-between text-[#B8B8B8]">
                  <span>Payment Method:</span>
                  <strong className="text-white">
                    {walletType === "google_passkey"
                      ? "Google Web3 Email (Passkey)"
                      : walletType === "metamask_base"
                      ? "MetaMask / Base (EVM)"
                      : walletType === "phantom_solana"
                      ? "Phantom / Solana"
                      : "Native NEAR Wallet"}
                  </strong>
                </div>
                <div className="flex justify-between text-[#B8B8B8]">
                  <span>Funding Token:</span>
                  <strong className="text-emerald-400">{sourceToken} on {sourceChain}</strong>
                </div>
                <div className="flex justify-between text-[#B8B8B8]">
                  <span>Settlement Contract:</span>
                  <strong className="text-[#894DEF]">USDC on NEAR ({derivedNearAccount})</strong>
                </div>
              </div>
            </div>

            <p className="text-xs text-[#B8B8B8] leading-relaxed">
              Your NEAR Intents payment route is confirmed. Any SaaS subscription you fund will execute through cross-chain solvers, with payouts held in the 7-day non-custodial escrow warranty.
            </p>

            <button
              onClick={handleFinish}
              className="w-full py-3 bg-[#894DEF] hover:bg-[#A273F2] text-white font-bold text-xs uppercase transition-colors"
            >
              Enter Subscriber Dashboard →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
