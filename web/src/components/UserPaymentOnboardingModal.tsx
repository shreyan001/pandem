"use client";

import React, { useState } from "react";
import { useNearWallet } from "../context/NearWalletContext";

interface UserPaymentOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (userData: { name: string; walletType: string; nearAccountId: string; sourceChain: string }) => void;
}

export function UserPaymentOnboardingModal({ isOpen, onClose, onComplete }: UserPaymentOnboardingModalProps) {
  const { accountId, connect, setManualAccount } = useNearWallet();
  const [step, setStep] = useState<number>(1);
  const [userName, setUserName] = useState<string>("");
  const [walletType, setWalletType] = useState<"google_passkey" | "metamask_base" | "phantom_solana" | "near_native">("google_passkey");
  const [sourceChain, setSourceChain] = useState<string>("Base");
  const [isCreatingAccount, setIsCreatingAccount] = useState<boolean>(false);
  const [derivedNearAccount, setDerivedNearAccount] = useState<string>("");

  if (!isOpen) return null;

  const handleCreateOrConnect = async () => {
    setIsCreatingAccount(true);
    try {
      await new Promise((r) => setTimeout(r, 1200));

      let generatedAccount = "";
      if (walletType === "google_passkey") {
        const cleanHandle = userName.toLowerCase().replace(/[^a-z0-9]/g, "") || "subscriber";
        generatedAccount = `${cleanHandle}.testnet`;
      } else if (walletType === "metamask_base") {
        generatedAccount = `0x${Math.random().toString(16).substring(2, 10)}...near`;
      } else if (walletType === "phantom_solana") {
        generatedAccount = `sol_${Math.random().toString(36).substring(2, 10)}.testnet`;
      } else {
        generatedAccount = accountId || "user.testnet";
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
    onComplete({
      name: userName || "Anonymous Subscriber",
      walletType,
      nearAccountId: derivedNearAccount || accountId || "user.testnet",
      sourceChain,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg bg-[#171717] border border-[#2E2E2E] shadow-2xl p-6 sm:p-8 space-y-6 text-[#FAFAFA] font-mono">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#2E2E2E] pb-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-[#894DEF]" />
            <h3 className="text-sm sm:text-base font-bold uppercase tracking-wider text-[#FAFAFA]">
              Setup Your Payment Method & NEAR Account
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-[#B8B8B8] hover:text-[#FAFAFA] text-sm p-1"
          >
            ✕
          </button>
        </div>

        {/* Step Indicator */}
        <div className="grid grid-cols-3 border border-[#2E2E2E] bg-[#0D0D0D] text-[11px] text-center">
          <div className={`p-2 border-r border-[#2E2E2E] ${step === 1 ? "bg-[#894DEF] text-white font-bold" : "text-[#B8B8B8]"}`}>
            1. Identity
          </div>
          <div className={`p-2 border-r border-[#2E2E2E] ${step === 2 ? "bg-[#894DEF] text-white font-bold" : "text-[#B8B8B8]"}`}>
            2. Wallet & Intents
          </div>
          <div className={`p-2 ${step === 3 ? "bg-[#894DEF] text-white font-bold" : "text-[#B8B8B8]"}`}>
            3. Confirmation
          </div>
        </div>

        {/* Step 1: User Identity */}
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-xs text-[#B8B8B8] leading-relaxed">
              Welcome to Pandem. To subscribe to private SaaS services, you need a non-custodial NEAR account. Enter your name or handle to begin.
            </p>

            <div>
              <label className="block text-[11px] text-[#B8B8B8] uppercase mb-1">Your Name / Display Handle</label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="e.g. Satoshi Nakamoto"
                className="w-full bg-[#0D0D0D] border border-[#2E2E2E] p-2.5 text-xs text-white focus:outline-none focus:border-[#894DEF]"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setStep(2)}
                disabled={!userName.trim()}
                className="px-6 py-2.5 bg-[#894DEF] hover:bg-[#A273F2] disabled:opacity-50 text-white font-bold text-xs uppercase transition-colors"
              >
                Next: Connect Payment Source →
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Choose Wallet & Source Chain */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-xs text-[#B8B8B8] leading-relaxed">
              Pay with any token from any chain. Pandem uses <strong className="text-white">NEAR Intents (1Click)</strong> to convert deposits into settled USDC in your escrow contract.
            </p>

            <div className="space-y-2">
              <label className="block text-[11px] text-[#B8B8B8] uppercase">Choose Your Sign-In & Wallet Method</label>

              {/* 1. Google / Passkey */}
              <div
                onClick={() => setWalletType("google_passkey")}
                className={`p-3 border cursor-pointer flex items-center justify-between text-xs transition-colors ${
                  walletType === "google_passkey" ? "bg-[#0D0D0D] border-[#894DEF]" : "bg-[#0D0D0D] border-[#2E2E2E]"
                }`}
              >
                <div>
                  <span className="font-bold text-white block">One-Click Google / Passkey (FastAuth)</span>
                  <span className="text-[10px] text-[#B8B8B8]">Creates a non-custodial NEAR account automatically</span>
                </div>
                <span className="text-[10px] text-[#894DEF] border border-[#894DEF]/40 px-2 py-0.5">Recommended</span>
              </div>

              {/* 2. MetaMask / Base */}
              <div
                onClick={() => setWalletType("metamask_base")}
                className={`p-3 border cursor-pointer flex items-center justify-between text-xs transition-colors ${
                  walletType === "metamask_base" ? "bg-[#0D0D0D] border-[#894DEF]" : "bg-[#0D0D0D] border-[#2E2E2E]"
                }`}
              >
                <div>
                  <span className="font-bold text-white block">MetaMask / Ethereum (Base, Arbitrum L2)</span>
                  <span className="text-[10px] text-[#B8B8B8]">Derives a NEAR implicit account from your EVM address</span>
                </div>
                <span className="text-[10px] text-[#B8B8B8]">Multichain</span>
              </div>

              {/* 3. Solana Phantom */}
              <div
                onClick={() => setWalletType("phantom_solana")}
                className={`p-3 border cursor-pointer flex items-center justify-between text-xs transition-colors ${
                  walletType === "phantom_solana" ? "bg-[#0D0D0D] border-[#894DEF]" : "bg-[#0D0D0D] border-[#2E2E2E]"
                }`}
              >
                <div>
                  <span className="font-bold text-white block">Phantom / Solana Wallet</span>
                  <span className="text-[10px] text-[#B8B8B8]">Pay with SOL or USDC-SPL via cross-chain solver</span>
                </div>
                <span className="text-[10px] text-[#B8B8B8]">1Click Intent</span>
              </div>

              {/* 4. Native NEAR */}
              <div
                onClick={() => setWalletType("near_native")}
                className={`p-3 border cursor-pointer flex items-center justify-between text-xs transition-colors ${
                  walletType === "near_native" ? "bg-[#0D0D0D] border-[#894DEF]" : "bg-[#0D0D0D] border-[#2E2E2E]"
                }`}
              >
                <div>
                  <span className="font-bold text-white block">Native NEAR Wallet (HOT / Meteor)</span>
                  <span className="text-[10px] text-[#B8B8B8]">Direct testnet connection via @hot-labs/near-connect</span>
                </div>
                <span className="text-[10px] text-[#B8B8B8]">Direct</span>
              </div>
            </div>

            {/* Source Chain Selector */}
            <div>
              <label className="block text-[11px] text-[#B8B8B8] uppercase mb-1">Default Source Chain to Fund From</label>
              <select
                value={sourceChain}
                onChange={(e) => setSourceChain(e.target.value)}
                className="w-full bg-[#0D0D0D] border border-[#2E2E2E] p-2.5 text-xs text-white focus:outline-none focus:border-[#894DEF]"
              >
                <option value="Base">Base (USDC / ETH)</option>
                <option value="Arbitrum">Arbitrum (USDC / ETH)</option>
                <option value="Ethereum">Ethereum Mainnet (USDC / USDT)</option>
                <option value="Solana">Solana (USDC-SPL / SOL)</option>
                <option value="NEAR">NEAR Testnet (tUSDC)</option>
              </select>
            </div>

            <div className="flex justify-between pt-2">
              <button
                onClick={() => setStep(1)}
                className="px-5 py-2.5 bg-[#262626] border border-[#2E2E2E] text-white text-xs uppercase"
              >
                ← Back
              </button>
              <button
                onClick={handleCreateOrConnect}
                disabled={isCreatingAccount}
                className="px-6 py-2.5 bg-[#894DEF] hover:bg-[#A273F2] disabled:opacity-50 text-white font-bold text-xs uppercase transition-colors"
              >
                {isCreatingAccount ? "Provisioning Account..." : "Confirm & Provision Account →"}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Success Confirmation */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="p-4 bg-[#0D0D0D] border border-[#2E2E2E] space-y-2">
              <span className="text-[10px] text-[#4ADE80] uppercase tracking-wider block font-bold">
                ✓ Account Provisioned Successfully
              </span>
              <div className="text-xs space-y-1">
                <div className="flex justify-between text-[#B8B8B8]">
                  <span>Subscriber Name:</span>
                  <strong className="text-white">{userName}</strong>
                </div>
                <div className="flex justify-between text-[#B8B8B8]">
                  <span>Controlled NEAR Account:</span>
                  <strong className="text-[#894DEF]">{derivedNearAccount}</strong>
                </div>
                <div className="flex justify-between text-[#B8B8B8]">
                  <span>Settlement Engine:</span>
                  <strong className="text-white">NEAR Intents 1Click ({sourceChain} → tUSDC)</strong>
                </div>
              </div>
            </div>

            <p className="text-xs text-[#B8B8B8] leading-relaxed">
              Your account is now ready to subscribe to private SaaS tools, allocate monthly request tokens, and participate in steward bounty programs.
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
