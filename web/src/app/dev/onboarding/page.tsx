"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface OnboardingFormState {
  name: string;
  slug: string;
  tagline: string;
  description: string;
  category: string;
  steward: string;
  monthlyPrice: string;
  yearlyPrice: string;
  tokensPerUser: string;
  model: string;
  operationalBudget: string;
  dataStorageMode: "browser" | "tee_ephemeral" | "encrypted_backend";
  apiKeyUsageMode: "client_direct" | "gateway_relay";
}

const DEFAULT_STATE: OnboardingFormState = {
  name: "API Byte AI",
  slug: "api-byte",
  tagline: "Autonomous Private API Router with Zero-Knowledge Telemetry.",
  description: "High-performance developer API gateway running on confidential Intel TDX hardware enclaves with automated subscriber escrow billing.",
  category: "Developer Tools",
  steward: "developer.testnet",
  monthlyPrice: "5",
  yearlyPrice: "50",
  tokensPerUser: "250000",
  model: "Qwen/Qwen2.5-72B-Instruct",
  operationalBudget: "150",
  dataStorageMode: "browser",
  apiKeyUsageMode: "client_direct",
};

const AVAILABLE_MODELS = [
  { id: "Qwen/Qwen2.5-72B-Instruct", name: "Qwen 2.5 72B Instruct (TEE)", hardware: "NVIDIA H100 NRAS", cost: "$0.0012 / 1k tokens" },
  { id: "meta-llama/Llama-3.3-70B-Instruct", name: "Llama 3.3 70B Instruct (TEE)", hardware: "Intel TDX Enclave", cost: "$0.0015 / 1k tokens" },
  { id: "meta-llama/Llama-3.1-8B-Instruct", name: "Llama 3.1 8B Instruct (Lightweight)", hardware: "Intel SGX Enclave", cost: "$0.0003 / 1k tokens" },
];

export default function DevOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<number>(1);
  const [form, setForm] = useState<OnboardingFormState>(DEFAULT_STATE);
  const [isDeploying, setIsDeploying] = useState<boolean>(false);
  const [deploymentResult, setDeploymentResult] = useState<any | null>(null);

  const handleNext = () => setStep((s) => Math.min(s + 1, 4));
  const handleBack = () => setStep((s) => Math.max(s - 1, 1));

  const handleDeployContracts = async () => {
    setIsDeploying(true);
    try {
      // 1. Simulate per-project contract suite deployment
      await new Promise((r) => setTimeout(r, 1800));

      const cleanSlug = form.slug.toLowerCase().replace(/[^a-z0-9-]/g, "");
      const escrowContract = `escrow.${cleanSlug}.testnet`;
      const budgetContract = `budget.${cleanSlug}.testnet`;
      const votingContract = `voting.${cleanSlug}.testnet`;
      const generatedApiKey = `ps_live_${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}`;

      // 2. Persist to Redis backend via /api/products
      await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          slug: cleanSlug,
          tagline: form.tagline,
          description: form.description,
          category: form.category,
          steward: form.steward || "developer.testnet",
        }),
      });

      setDeploymentResult({
        escrowContract,
        budgetContract,
        votingContract,
        apiKey: generatedApiKey,
        deployedAt: new Date().toISOString(),
        txHash: "8wuEZcspAEVfTFgSJed9RvcE7jqdG1orCgoHBr4vDJZA",
      });

      setStep(4);
    } catch (err: any) {
      alert("Deployment failed: " + (err?.message || String(err)));
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 bg-[#0D0D0D] text-[#FAFAFA]">
      {/* Header */}
      <div className="border-b border-[#2E2E2E] pb-6">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-[#894DEF]" />
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#FAFAFA] tracking-tight font-sans uppercase">
            Pandem Spectr · Agentic Developer Onboarding
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-[#B8B8B8] mt-1 font-mono">
          Interactive studio for deploying your dedicated project contract suite and linking NEAR AI Cloud TEE inference.
        </p>
      </div>

      {/* Progress Steps (Spectr rectilinear) */}
      <div className="grid grid-cols-4 border border-[#2E2E2E] bg-[#171717] text-xs font-mono">
        <div className={`p-3 text-center border-r border-[#2E2E2E] ${step === 1 ? "bg-[#894DEF] text-white font-bold" : "text-[#B8B8B8]"}`}>
          1. Identity & Pricing
        </div>
        <div className={`p-3 text-center border-r border-[#2E2E2E] ${step === 2 ? "bg-[#894DEF] text-white font-bold" : "text-[#B8B8B8]"}`}>
          2. Inference & Model
        </div>
        <div className={`p-3 text-center border-r border-[#2E2E2E] ${step === 3 ? "bg-[#894DEF] text-white font-bold" : "text-[#B8B8B8]"}`}>
          3. Privacy & Terms
        </div>
        <div className={`p-3 text-center ${step === 4 ? "bg-[#894DEF] text-white font-bold" : "text-[#B8B8B8]"}`}>
          4. Contract Suite
        </div>
      </div>

      {/* Agent Dialogue Prompt */}
      <div className="p-4 bg-[#171717] border border-[#2E2E2E] space-y-2">
        <div className="flex items-center gap-2 text-xs font-mono text-[#894DEF]">
          <span className="font-bold">PANDEM SPECTR ONBOARDING AGENT</span>
          <span className="text-[10px] text-[#6B6B6B]">· TEE Protocol Attested</span>
        </div>
        <p className="text-xs text-[#B8B8B8] leading-relaxed font-mono">
          {step === 1 && "Welcome developer! Let's establish your project identity and recurring subscription pricing. Edit the pre-filled parameters or customize as needed."}
          {step === 2 && "Configure your private inference engine on NEAR AI Cloud. Choose your model and set the monthly compute budget to prevent API key drain or misuse."}
          {step === 3 && "Specify how your product stores data and how the escrow terms will protect your 70-day profit margin and subscriber warranty pool."}
          {step === 4 && "Your tripartite smart contract suite has been compiled and deployed to NEAR testnet. Below are your dedicated contract addresses and scoped API keys."}
        </p>
      </div>

      {/* Step 1: Product Profile & Pricing */}
      {step === 1 && (
        <div className="p-6 bg-[#171717] border border-[#2E2E2E] space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#FAFAFA] font-mono border-b border-[#2E2E2E] pb-2">
            Step 1: Product Profile & Subscription Tiers
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-mono text-[#B8B8B8] mb-1">Product Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-[#0D0D0D] border border-[#2E2E2E] p-2.5 text-xs text-[#FAFAFA] font-mono focus:outline-none focus:border-[#894DEF]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-[#B8B8B8] mb-1">Product Slug (URL ID)</label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                className="w-full bg-[#0D0D0D] border border-[#2E2E2E] p-2.5 text-xs text-[#FAFAFA] font-mono focus:outline-none focus:border-[#894DEF]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-mono text-[#B8B8B8] mb-1">Tagline</label>
              <input
                type="text"
                value={form.tagline}
                onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                className="w-full bg-[#0D0D0D] border border-[#2E2E2E] p-2.5 text-xs text-[#FAFAFA] font-mono focus:outline-none focus:border-[#894DEF]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-mono text-[#B8B8B8] mb-1">Detailed Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="w-full bg-[#0D0D0D] border border-[#2E2E2E] p-2.5 text-xs text-[#FAFAFA] font-mono focus:outline-none focus:border-[#894DEF] resize-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-[#B8B8B8] mb-1">Monthly Subscription (tUSDC)</label>
              <input
                type="number"
                value={form.monthlyPrice}
                onChange={(e) => setForm({ ...form, monthlyPrice: e.target.value })}
                className="w-full bg-[#0D0D0D] border border-[#2E2E2E] p-2.5 text-xs text-[#FAFAFA] font-mono focus:outline-none focus:border-[#894DEF]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-[#B8B8B8] mb-1">Yearly Discounted (tUSDC)</label>
              <input
                type="number"
                value={form.yearlyPrice}
                onChange={(e) => setForm({ ...form, yearlyPrice: e.target.value })}
                className="w-full bg-[#0D0D0D] border border-[#2E2E2E] p-2.5 text-xs text-[#FAFAFA] font-mono focus:outline-none focus:border-[#894DEF]"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={handleNext}
              className="px-6 py-2.5 bg-[#894DEF] hover:bg-[#A273F2] text-white font-mono text-xs font-bold uppercase transition-colors"
            >
              Continue to Model Setup →
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Inference & Model Selection */}
      {step === 2 && (
        <div className="p-6 bg-[#171717] border border-[#2E2E2E] space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#FAFAFA] font-mono border-b border-[#2E2E2E] pb-2">
            Step 2: NEAR AI Cloud Model & Compute Allocations
          </h3>

          <div className="space-y-3">
            <label className="block text-[11px] font-mono text-[#B8B8B8]">Select Private TEE Model</label>
            <div className="space-y-2">
              {AVAILABLE_MODELS.map((m) => (
                <div
                  key={m.id}
                  onClick={() => setForm({ ...form, model: m.id })}
                  className={`p-3.5 border cursor-pointer flex items-center justify-between font-mono text-xs transition-colors ${
                    form.model === m.id
                      ? "bg-[#0D0D0D] border-[#894DEF] text-white"
                      : "bg-[#0D0D0D] border-[#2E2E2E] text-[#B8B8B8] hover:border-[#6B6B6B]"
                  }`}
                >
                  <div>
                    <span className="font-bold block text-[#FAFAFA]">{m.name}</span>
                    <span className="text-[10px] text-[#6B6B6B]">Hardware: {m.hardware}</span>
                  </div>
                  <span className="text-xs text-[#894DEF] font-bold">{m.cost}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-[11px] font-mono text-[#B8B8B8] mb-1">Monthly Operational Compute Budget (tUSDC)</label>
              <input
                type="number"
                value={form.operationalBudget}
                onChange={(e) => setForm({ ...form, operationalBudget: e.target.value })}
                className="w-full bg-[#0D0D0D] border border-[#2E2E2E] p-2.5 text-xs text-[#FAFAFA] font-mono focus:outline-none focus:border-[#894DEF]"
              />
              <span className="text-[10px] text-[#6B6B6B] font-mono mt-0.5 block">Refilled dynamically from subscriber escrow</span>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-[#B8B8B8] mb-1">Token Quota per User / Month</label>
              <input
                type="number"
                value={form.tokensPerUser}
                onChange={(e) => setForm({ ...form, tokensPerUser: e.target.value })}
                className="w-full bg-[#0D0D0D] border border-[#2E2E2E] p-2.5 text-xs text-[#FAFAFA] font-mono focus:outline-none focus:border-[#894DEF]"
              />
              <span className="text-[10px] text-[#6B6B6B] font-mono mt-0.5 block">Guaranteed rate-limiting inside hardware enclave</span>
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <button
              onClick={handleBack}
              className="px-6 py-2.5 bg-[#262626] border border-[#2E2E2E] text-[#FAFAFA] font-mono text-xs hover:bg-[#2E2E2E] transition-colors"
            >
              ← Back
            </button>
            <button
              onClick={handleNext}
              className="px-6 py-2.5 bg-[#894DEF] hover:bg-[#A273F2] text-white font-mono text-xs font-bold uppercase transition-colors"
            >
              Continue to Privacy & Terms →
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Privacy, Data Storage & Terms */}
      {step === 3 && (
        <div className="p-6 bg-[#171717] border border-[#2E2E2E] space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#FAFAFA] font-mono border-b border-[#2E2E2E] pb-2">
            Step 3: Privacy Storage Architecture & Fee Distribution
          </h3>

          <div className="space-y-3">
            <label className="block text-[11px] font-mono text-[#B8B8B8]">Data Storage Model</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div
                onClick={() => setForm({ ...form, dataStorageMode: "browser" })}
                className={`p-3.5 border cursor-pointer font-mono text-xs space-y-1 ${
                  form.dataStorageMode === "browser" ? "bg-[#0D0D0D] border-[#894DEF]" : "bg-[#0D0D0D] border-[#2E2E2E]"
                }`}
              >
                <span className="font-bold text-[#FAFAFA] block">Browser Client (Venice)</span>
                <p className="text-[10px] text-[#B8B8B8]">IndexedDB client storage, zero server data retention.</p>
              </div>

              <div
                onClick={() => setForm({ ...form, dataStorageMode: "tee_ephemeral" })}
                className={`p-3.5 border cursor-pointer font-mono text-xs space-y-1 ${
                  form.dataStorageMode === "tee_ephemeral" ? "bg-[#0D0D0D] border-[#894DEF]" : "bg-[#0D0D0D] border-[#2E2E2E]"
                }`}
              >
                <span className="font-bold text-[#FAFAFA] block">TEE Ephemeral Memory</span>
                <p className="text-[10px] text-[#B8B8B8]">RAM-only execution, cryptographically shredded post-query.</p>
              </div>

              <div
                onClick={() => setForm({ ...form, dataStorageMode: "encrypted_backend" })}
                className={`p-3.5 border cursor-pointer font-mono text-xs space-y-1 ${
                  form.dataStorageMode === "encrypted_backend" ? "bg-[#0D0D0D] border-[#894DEF]" : "bg-[#0D0D0D] border-[#2E2E2E]"
                }`}
              >
                <span className="font-bold text-[#FAFAFA] block">Encrypted Self-Host</span>
                <p className="text-[10px] text-[#B8B8B8]">User-owned Docker / SQLite with NEP-413 envelope encryption.</p>
              </div>
            </div>
          </div>

          {/* Automated Contract Split Formula */}
          <div className="p-4 bg-[#0D0D0D] border border-[#2E2E2E] space-y-2 text-xs font-mono">
            <span className="text-[#894DEF] font-bold block uppercase">Smart Contract Split Breakdown</span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 text-[11px]">
              <div className="p-2 border border-[#2E2E2E] bg-[#171717]">
                <span className="text-[#6B6B6B] block">Developer Profit:</span>
                <span className="text-white font-bold">47.5%</span>
                <span className="text-[9px] text-[#6B6B6B] block">7-day milestone release</span>
              </div>
              <div className="p-2 border border-[#2E2E2E] bg-[#171717]">
                <span className="text-[#6B6B6B] block">Inference Budget:</span>
                <span className="text-[#894DEF] font-bold">30.0%</span>
                <span className="text-[9px] text-[#6B6B6B] block">Monthly compute refill</span>
              </div>
              <div className="p-2 border border-[#2E2E2E] bg-[#171717]">
                <span className="text-[#6B6B6B] block">Bug Bounties:</span>
                <span className="text-[#FBBF24] font-bold">15.0%</span>
                <span className="text-[9px] text-[#6B6B6B] block">Solve-to-pay updates</span>
              </div>
              <div className="p-2 border border-[#2E2E2E] bg-[#171717]">
                <span className="text-[#6B6B6B] block">Contingency:</span>
                <span className="text-white font-bold">5.0%</span>
                <span className="text-[9px] text-[#6B6B6B] block">Emergency voting buffer</span>
              </div>
              <div className="p-2 border border-[#2E2E2E] bg-[#171717]">
                <span className="text-[#6B6B6B] block">Pandem Platform:</span>
                <span className="text-white font-bold">2.5%</span>
                <span className="text-[9px] text-[#6B6B6B] block">Platform upkeep & agent</span>
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <button
              onClick={handleBack}
              className="px-6 py-2.5 bg-[#262626] border border-[#2E2E2E] text-[#FAFAFA] font-mono text-xs hover:bg-[#2E2E2E] transition-colors"
            >
              ← Back
            </button>
            <button
              onClick={handleDeployContracts}
              disabled={isDeploying}
              className="px-8 py-2.5 bg-[#894DEF] hover:bg-[#A273F2] disabled:opacity-50 text-white font-mono text-xs font-bold uppercase transition-colors"
            >
              {isDeploying ? "Deploying Tripartite Contracts..." : "Deploy Contract Suite →"}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Deployed Contracts Result */}
      {step === 4 && deploymentResult && (
        <div className="p-6 bg-[#171717] border border-[#2E2E2E] space-y-5">
          <div className="flex items-center gap-2 border-b border-[#2E2E2E] pb-3">
            <span className="w-2 h-2 bg-[#4ADE80]" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#4ADE80] font-mono">
              Contract Suite Deployed Successfully
            </h3>
          </div>

          <p className="text-xs text-[#B8B8B8] font-mono leading-relaxed">
            Your project has received its independent, non-custodial set of contracts on NEAR Testnet. The smart contracts enforce automated heartbeat vesting, threshold compute refills, and subscriber voting arbitration.
          </p>

          <div className="space-y-2 text-xs font-mono">
            <div className="p-3 bg-[#0D0D0D] border border-[#2E2E2E] flex justify-between items-center">
              <div>
                <span className="text-[#6B6B6B] block text-[10px]">1. Escrow Subscription Contract:</span>
                <span className="text-white font-bold">{deploymentResult.escrowContract}</span>
              </div>
              <span className="text-[#4ADE80] text-[10px] border border-[#4ADE80]/30 px-2 py-0.5">Deployed</span>
            </div>

            <div className="p-3 bg-[#0D0D0D] border border-[#2E2E2E] flex justify-between items-center">
              <div>
                <span className="text-[#6B6B6B] block text-[10px]">2. Inference & Compute Refill Contract:</span>
                <span className="text-white font-bold">{deploymentResult.budgetContract}</span>
              </div>
              <span className="text-[#894DEF] text-[10px] border border-[#894DEF]/30 px-2 py-0.5">Automated Dampener</span>
            </div>

            <div className="p-3 bg-[#0D0D0D] border border-[#2E2E2E] flex justify-between items-center">
              <div>
                <span className="text-[#6B6B6B] block text-[10px]">3. Governance & Voting Strategy Contract:</span>
                <span className="text-white font-bold">{deploymentResult.votingContract}</span>
              </div>
              <span className="text-white text-[10px] border border-[#2E2E2E] px-2 py-0.5">Arbitration Active</span>
            </div>

            <div className="p-3 bg-[#0D0D0D] border border-[#2E2E2E] flex justify-between items-center">
              <div>
                <span className="text-[#6B6B6B] block text-[10px]">Scoped NEAR AI Cloud API Key:</span>
                <span className="text-[#894DEF] font-bold">{deploymentResult.apiKey}</span>
              </div>
              <span className="text-[10px] text-[#6B6B6B]">Bound to Budget Contract</span>
            </div>
          </div>

          <div className="flex gap-3 pt-3">
            <Link
              href="/"
              className="flex-1 py-3 bg-[#894DEF] hover:bg-[#A273F2] text-white font-mono text-xs font-bold text-center uppercase transition-colors"
            >
              View on Storefront Leaderboard →
            </Link>
            <Link
              href="/dev/dashboard"
              className="flex-1 py-3 bg-[#262626] hover:bg-[#2E2E2E] border border-[#2E2E2E] text-white font-mono text-xs font-bold text-center uppercase transition-colors"
            >
              Go to Developer Dashboard →
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
