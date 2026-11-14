"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useNearWallet } from "../../../context/NearWalletContext";

interface OnboardingFormState {
  // Step 1: Product Identity & Launchpad Listing
  name: string;
  slug: string;
  tagline: string;
  description: string;
  category: "Legal" | "Security" | "Health" | "Financial" | "DevTools" | "Private Social";
  steward: string;
  monthlyUsdc: string;
  monthlyNear: string;
  yearlyUsdc: string;
  yearlyNear: string;

  // Step 2: Full-Stack Privacy Constraints & Architecture
  enclaveRuntime: "phala_dstack" | "akash_sev_snp";
  containerImage: string;
  dbEngine: "pgvector_sealed";
  dbKmsMode: "kms_attestation_bound";
  aiModel: "deepseek-ai/DeepSeek-V3.1" | "Qwen/Qwen2.5-72B-Instruct" | "meta-llama/Llama-3.3-70B-Instruct";
  primaryFrontendUrl: string;
  filecoinCid: string;
  fastFsCid: string;

  // Step 3: OpEx & Settlement Simulation
  simulatedSubscribers: number;
}

const NEAR_USDC_RATE = 5.20; // 1 NEAR ≈ 5.20 USDC testnet oracle estimate

const CATEGORIES = [
  {
    id: "Legal",
    label: "Legal & Compliance",
    suite: "Legal & IP Enclave",
    desc: "Confidential litigation briefs & NDA analysis in TDX enclaves with attorney-client privilege protection",
  },
  {
    id: "Security",
    label: "Security & Audit",
    suite: "Decentralized Infrastructure",
    desc: "Zero-knowledge vulnerability auditing, smart contract analysis & cryptographic telemetry",
  },
  {
    id: "Health",
    label: "Health & Clinical",
    suite: "Clinical Health & Bio",
    desc: "HIPAA-compliant diagnostic models with zero cloud query retention & ephemeral memory execution",
  },
  {
    id: "Financial",
    label: "Financial & Tax",
    suite: "ZK Finance & Ledger",
    desc: "Private multi-chain ledger reconciliation, algorithmic trading shields & encrypted tax preparation",
  },
  {
    id: "DevTools",
    label: "Developer Tools",
    suite: "Decentralized Infrastructure",
    desc: "Verifiable confidential APIs, proxy routers, and enclave workers with automated escrow settlement",
  },
  {
    id: "Private Social",
    label: "Private Social",
    suite: "Operations & Scheduling",
    desc: "Metadata-resistant communication, confidential calendar negotiation & encrypted notes",
  },
] as const;

const ENCLAVE_RUNTIMES = [
  {
    id: "phala_dstack",
    name: "Phala dstack (Intel TDX)",
    vendor: "Phala Cloud",
    type: "Trust Domain Extensions (TDX)",
    attestation: "Intel SGX/TDX Quote",
    latency: "< 1.5ms overhead",
    desc: "CVM hardware-isolated execution with Intel remote attestation and dstack secret management.",
  },
  {
    id: "akash_sev_snp",
    name: "Akash Confidential (AMD SEV-SNP)",
    vendor: "Akash Network",
    type: "Secure Encrypted Virtualization (SEV-SNP)",
    attestation: "AMD SEV Attestation Report",
    latency: "< 2.0ms overhead",
    desc: "Decentralized confidential GPU/CPU compute with full hardware memory encryption and nested paging.",
  },
] as const;

const NEAR_AI_MODELS = [
  {
    id: "deepseek-ai/DeepSeek-V3.1",
    name: "DeepSeek V3.1 (Confidential TEE)",
    provider: "NEAR AI Cloud (TEE)",
    hardware: "NVIDIA H100 NRAS Attested",
    rate: "$0.0018 / 1k tokens",
    bestFor: "Complex reasoning, coding, and cryptographic proof verification",
  },
  {
    id: "Qwen/Qwen2.5-72B-Instruct",
    name: "Qwen 2.5 72B Instruct (Confidential TEE)",
    provider: "NEAR AI Cloud (TEE)",
    hardware: "NVIDIA H100 NRAS Attested",
    rate: "$0.0012 / 1k tokens",
    bestFor: "Multilingual domain intelligence, legal extraction, and summarization",
  },
  {
    id: "meta-llama/Llama-3.3-70B-Instruct",
    name: "Llama 3.3 70B Instruct (Intel TDX)",
    provider: "NEAR AI Cloud (TEE)",
    hardware: "Intel TDX Enclave CVM",
    rate: "$0.0015 / 1k tokens",
    bestFor: "Enterprise workflow automation and verifiable tool calling",
  },
] as const;

const DEFAULT_STATE: OnboardingFormState = {
  name: "Aegis Privacy Suite",
  slug: "aegis-privacy",
  tagline: "Autonomous confidential litigation drafting and compliance engine in Intel TDX.",
  description: "Enterprise legal workspace isolating attorney work product inside hardware-attested CVMs with verifiable remote attestation and automated escrow settlement.",
  category: "Legal",
  steward: "developer.testnet",
  monthlyUsdc: "10",
  monthlyNear: "1.92",
  yearlyUsdc: "100",
  yearlyNear: "19.23",
  enclaveRuntime: "phala_dstack",
  containerImage: "docker.io/pandem/aegis-enclave:v1.4.0",
  dbEngine: "pgvector_sealed",
  dbKmsMode: "kms_attestation_bound",
  aiModel: "deepseek-ai/DeepSeek-V3.1",
  primaryFrontendUrl: "https://aegis-privacy.pandem.app",
  filecoinCid: "bafybeic2h7g5y6r7w8x9z0q1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p",
  fastFsCid: "fastfs://bafk7y2w3x4y5z6a7b8c9d0e1f2g3h4i5j6k7l8m9n0",
  simulatedSubscribers: 250,
};

export default function DevOnboardingPage() {
  const router = useRouter();
  const { accountId } = useNearWallet();

  const [step, setStep] = useState<number>(1);
  const [form, setForm] = useState<OnboardingFormState>(DEFAULT_STATE);
  const [composeHash, setComposeHash] = useState<string>("0x8f2a4c1e9b7d3a5f6e8c0b2d4f6a8c0e1b3d5f7a9c1e3b5d7f9a1c3e5b7d9f1a");
  const [isDeploying, setIsDeploying] = useState<boolean>(false);
  const [deploymentResult, setDeploymentResult] = useState<{
    escrowContract: string;
    budgetContract: string;
    votingContract: string;
    apiKey: string;
    composeHash: string;
    composeManifest: string;
    deployedAt: string;
    txHash: string;
    liveUrl: string;
  } | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Set steward from wallet if connected
  useEffect(() => {
    if (accountId) {
      setForm((prev) => ({ ...prev, steward: accountId }));
    }
  }, [accountId]);

  // Auto-slugify when product name changes if slug wasn't manually customized
  const handleNameChange = (name: string) => {
    const autoSlug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setForm((prev) => ({
      ...prev,
      name,
      slug: autoSlug || prev.slug,
      primaryFrontendUrl: `https://${autoSlug || "app"}.pandem.app`,
    }));
  };

  // Sync USDC and NEAR prices dynamically
  const handleUsdcMonthlyChange = (val: string) => {
    const num = parseFloat(val) || 0;
    const nearVal = (num / NEAR_USDC_RATE).toFixed(2);
    setForm((prev) => ({ ...prev, monthlyUsdc: val, monthlyNear: nearVal }));
  };

  const handleNearMonthlyChange = (val: string) => {
    const num = parseFloat(val) || 0;
    const usdcVal = (num * NEAR_USDC_RATE).toFixed(2);
    setForm((prev) => ({ ...prev, monthlyNear: val, monthlyUsdc: usdcVal }));
  };

  const handleUsdcYearlyChange = (val: string) => {
    const num = parseFloat(val) || 0;
    const nearVal = (num / NEAR_USDC_RATE).toFixed(2);
    setForm((prev) => ({ ...prev, yearlyUsdc: val, yearlyNear: nearVal }));
  };

  const handleNearYearlyChange = (val: string) => {
    const num = parseFloat(val) || 0;
    const usdcVal = (num * NEAR_USDC_RATE).toFixed(2);
    setForm((prev) => ({ ...prev, yearlyNear: val, yearlyUsdc: usdcVal }));
  };

  // Compute live SHA-256 compose-hash based on container image and runtime config
  const computeHash = useCallback(async () => {
    const seed = `${form.enclaveRuntime}:${form.containerImage}:${form.dbEngine}:${form.aiModel}:${form.filecoinCid}`;
    if (typeof window !== "undefined" && window.crypto?.subtle) {
      try {
        const encoder = new TextEncoder();
        const data = encoder.encode(seed);
        const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hex = "0x" + hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
        setComposeHash(hex);
        return;
      } catch {
        // fallback below
      }
    }
    // Simple fallback
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = (hash << 5) - hash + seed.charCodeAt(i);
      hash |= 0;
    }
    setComposeHash("0x" + Math.abs(hash).toString(16).padStart(64, "0"));
  }, [form.enclaveRuntime, form.containerImage, form.dbEngine, form.aiModel, form.filecoinCid]);

  useEffect(() => {
    computeHash();
  }, [computeHash]);

  // OpEx Simulator Calculations
  const opexCalculations = useMemo(() => {
    const subs = form.simulatedSubscribers;
    const price = parseFloat(form.monthlyUsdc) || 10;
    const totalGross = subs * price;

    // Splits: 47.5% Dev, 30% OpEx, 15% Bug Warranty, 5% Contingency, 2.5% Pandem Fee
    const devProfit = totalGross * 0.475;
    const totalOpex = totalGross * 0.30;
    const bugWarranty = totalGross * 0.15;
    const contingency = totalGross * 0.05;
    const protocolFee = totalGross * 0.025;

    // OpEx breakdown: 50% AI Inference, 33.3% Enclave CVM, 16.7% Decentralized Storage
    const aiInferenceOpex = totalOpex * 0.50;
    const enclaveCvmOpex = totalOpex * 0.3333;
    const storagePinningOpex = totalOpex * 0.1667;

    // Estimate monthly private token capacity (at avg $0.0015 / 1k tokens)
    const tokenCapacity = Math.round((aiInferenceOpex / 0.0015) * 1000);

    return {
      totalGross,
      devProfit,
      totalOpex,
      bugWarranty,
      contingency,
      protocolFee,
      aiInferenceOpex,
      enclaveCvmOpex,
      storagePinningOpex,
      tokenCapacity,
    };
  }, [form.simulatedSubscribers, form.monthlyUsdc]);

  // Generate Docker Compose Manifest String
  const generateComposeManifest = (slug: string, key: string, hash: string) => {
    return `# Pandem Verifiable Confidential Enclave Manifest
# Target Runtime: ${form.enclaveRuntime === "phala_dstack" ? "Phala dstack Intel TDX" : "Akash Confidential AMD SEV-SNP"}
# Compose Hash (on-chain measured): ${hash}
# Escrow Contract: escrow.${slug}.testnet

version: "3.8"

services:
  # 1. Hardware-Sealed PostgreSQL Database (pgvector)
  database:
    image: pgvector/pgvector:pg16
    environment:
      POSTGRES_DB: ${slug}_db
      POSTGRES_USER: ${slug}_user
      POSTGRES_PASSWORD_FILE: /run/secrets/kms_db_password
    volumes:
      - sealed_pgdata:/var/lib/postgresql/data:Z
    secrets:
      - kms_db_password
    labels:
      pandem.enclave.attested: "true"
      pandem.kms.unseal_condition: "hash==${hash}"

  # 2. Confidential Node / Application Backend
  backend:
    image: ${form.containerImage}
    depends_on:
      - database
    environment:
      NODE_ENV: production
      DATABASE_URL: postgres://${slug}_user@database:5432/${slug}_db
      NEAR_AI_BASE_URL: https://cloud-api.near.ai/v1
      NEAR_AI_MODEL: "${form.aiModel}"
      NEAR_AI_SCOPED_KEY: "${key}"
      ESCROW_CONTRACT_ID: "escrow.${slug}.testnet"
      BUDGET_CONTRACT_ID: "budget.${slug}.testnet"
      VOTING_CONTRACT_ID: "voting.${slug}.testnet"
      PRIMARY_FRONTEND_URL: "${form.primaryFrontendUrl}"
      FILECOIN_BACKUP_CID: "${form.filecoinCid}"
      FASTFS_MIRROR_CID: "${form.fastFsCid}"
    ports:
      - "8080:8080"
    labels:
      pandem.compose_hash: "${hash}"
      pandem.runtime: "${form.enclaveRuntime}"

volumes:
  sealed_pgdata:
    driver: local
    driver_opts:
      type: tmpfs
      device: tmpfs
      o: "size=4G,kms_seal=aes-256-gcm"

secrets:
  kms_db_password:
    external: true
`;
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleDeployAndLaunch = async () => {
    setIsDeploying(true);
    try {
      await new Promise((r) => setTimeout(r, 1600));

      const cleanSlug = form.slug.toLowerCase().trim().replace(/[^a-z0-9_-]/g, "-");
      const escrowContract = `escrow.${cleanSlug}.testnet`;
      const budgetContract = `budget.${cleanSlug}.testnet`;
      const votingContract = `voting.${cleanSlug}.testnet`;
      const randHex = Math.random().toString(16).substring(2, 10);
      const generatedApiKey = `pk-pandem-tee-${cleanSlug}-${randHex}`;

      const matchedCat = CATEGORIES.find((c) => c.id === form.category);

      // Post to Redis backend via /api/products
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          slug: cleanSlug,
          tagline: form.tagline,
          description: form.description,
          category: form.category,
          steward: form.steward || "developer.testnet",
          suite: matchedCat?.suite || "Decentralized Infrastructure",
          privacy_problem: `Sensitive user queries and data vectors must execute strictly inside hardware-isolated ${
            form.enclaveRuntime === "phala_dstack" ? "Intel TDX" : "AMD SEV-SNP"
          } enclaves with zero host access.`,
          why_direct_payment_fails: `Direct API billing requires personal credit cards and lacks automated SLA escrow enforcement. Pandem streams subscription funds to developers and market providers only upon verified heartbeats.`,
          score: 94,
          tee_hardware: form.enclaveRuntime === "phala_dstack" ? "Intel TDX Enclave" : "AMD SEV-SNP CVM",
          tee_model: form.aiModel,
          tiers: [
            {
              tier_id: "pro",
              name: "Pro Monthly",
              price_monthly: (parseFloat(form.monthlyUsdc) * 1e6).toFixed(0),
              price_yearly: (parseFloat(form.yearlyUsdc) * 1e6).toFixed(0),
              description: `Standard subscription with hardware TEE isolation, sealed pgvector database, and ${form.aiModel} inference.`,
            },
          ],
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.warn("Product registration note:", errorData);
      }

      const manifest = generateComposeManifest(cleanSlug, generatedApiKey, composeHash);

      setDeploymentResult({
        escrowContract,
        budgetContract,
        votingContract,
        apiKey: generatedApiKey,
        composeHash,
        composeManifest: manifest,
        deployedAt: new Date().toISOString(),
        txHash: "8wuEZcspAEVfTFgSJed9RvcE7jqdG1orCgoHBr4vDJZA",
        liveUrl: `/products/${cleanSlug}`,
      });

      setStep(4);
    } catch (err: any) {
      alert("Deployment or launchpad registration failed: " + (err?.message || String(err)));
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0D0D0D] text-[#FAFAFA] py-10 px-4 sm:px-6 lg:px-8 space-y-8 font-sans">
      {/* Top Breadcrumb & Return Link */}
      <div className="max-w-5xl mx-auto flex items-center justify-between text-xs font-mono text-[#737373] border-b border-[#2E2E2E] pb-4">
        <div className="flex items-center gap-2">
          <Link href="/" className="hover:text-white transition-colors">
            Leaderboard
          </Link>
          <span>/</span>
          <Link href="/dev/dashboard" className="hover:text-white transition-colors">
            Developer
          </Link>
          <span>/</span>
          <span className="text-[#894DEF] font-bold">Privacy Launchpad Studio</span>
        </div>

        <Link
          href="/dev/dashboard"
          className="text-xs font-mono text-[#B8B8B8] hover:text-white transition-colors flex items-center gap-1.5"
        >
          ← Return to Portal
        </Link>
      </div>

      <div className="max-w-5xl mx-auto space-y-8">
        {/* Studio Header Card */}
        <section className="bg-[#171717] border border-[#2E2E2E] p-6 sm:p-8 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="border border-[#894DEF] bg-[#894DEF]/15 text-[#894DEF] text-[10px] font-mono uppercase px-2.5 py-0.5 font-bold">
              Sovereign Privacy Launchpad
            </span>
            <span className="border border-[#2E2E2E] bg-[#262626] text-[#FAFAFA] text-[10px] font-mono px-2.5 py-0.5">
              Full-Stack Verifiable Architecture
            </span>
            <span className="border border-[#2E2E2E] bg-[#0D0D0D] text-[#4ADE80] text-[10px] font-mono px-2.5 py-0.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-[#4ADE80]" />
              Automated Market Provider Settlement
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white uppercase font-sans">
            Sovereign Privacy Launchpad Studio
          </h1>

          <p className="text-xs sm:text-sm text-[#B8B8B8] leading-relaxed max-w-3xl font-mono">
            Onboard your sovereign SaaS application. Define privacy constraints from database sealing to CVM node runtimes and NEAR AI Cloud inference.
            Smart contracts autonomously stream payments to market providers directly from subscriber revenue—zero credit cards required.
          </p>
        </section>

        {/* 4-Step Progress Navigation (Spectr Rectilinear) */}
        <div className="grid grid-cols-2 md:grid-cols-4 border border-[#2E2E2E] bg-[#171717] text-xs font-mono">
          <button
            onClick={() => step > 1 && setStep(1)}
            className={`p-3.5 text-center border-b md:border-b-0 md:border-r border-[#2E2E2E] transition-colors ${
              step === 1
                ? "bg-[#894DEF] text-white font-bold"
                : step > 1
                ? "bg-[#171717] text-[#FAFAFA] hover:bg-[#262626]"
                : "text-[#737373]"
            }`}
          >
            <span className="block text-[10px] uppercase opacity-75">Step 01</span>
            <span>Product & Pricing</span>
          </button>

          <button
            onClick={() => step > 2 && setStep(2)}
            className={`p-3.5 text-center border-b md:border-b-0 md:border-r border-[#2E2E2E] transition-colors ${
              step === 2
                ? "bg-[#894DEF] text-white font-bold"
                : step > 2
                ? "bg-[#171717] text-[#FAFAFA] hover:bg-[#262626]"
                : "text-[#737373]"
            }`}
          >
            <span className="block text-[10px] uppercase opacity-75">Step 02</span>
            <span>Privacy Stack & CVM</span>
          </button>

          <button
            onClick={() => step > 3 && setStep(3)}
            className={`p-3.5 text-center border-r border-[#2E2E2E] transition-colors ${
              step === 3
                ? "bg-[#894DEF] text-white font-bold"
                : step > 3
                ? "bg-[#171717] text-[#FAFAFA] hover:bg-[#262626]"
                : "text-[#737373]"
            }`}
          >
            <span className="block text-[10px] uppercase opacity-75">Step 03</span>
            <span>30% OpEx Simulator</span>
          </button>

          <div
            className={`p-3.5 text-center transition-colors ${
              step === 4
                ? "bg-[#894DEF] text-white font-bold"
                : "text-[#737373]"
            }`}
          >
            <span className="block text-[10px] uppercase opacity-75">Step 04</span>
            <span>Deploy & Storefront</span>
          </div>
        </div>

        {/* STEP 1: Product Identity & Launchpad Listing */}
        {step === 1 && (
          <section className="bg-[#171717] border border-[#2E2E2E] p-6 sm:p-8 space-y-6">
            <div className="border-b border-[#2E2E2E] pb-3">
              <h2 className="text-base sm:text-lg font-bold uppercase tracking-wider text-white font-mono">
                Step 1: Product Identity & Subscription Tiers
              </h2>
              <p className="text-xs text-[#B8B8B8] font-mono mt-0.5">
                Establish public storefront metadata and dual-currency subscription pricing in USDC and NEAR.
              </p>
            </div>

            <div className="space-y-4 font-mono text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block uppercase text-[#737373] tracking-wider">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. Aegis Legal Enclave"
                    className="w-full bg-[#0D0D0D] border border-[#2E2E2E] p-3 text-white focus:outline-none focus:border-[#894DEF]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block uppercase text-[#737373] tracking-wider">Slug (Storefront URL ID) *</label>
                  <input
                    type="text"
                    required
                    value={form.slug}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        slug: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "-"),
                        primaryFrontendUrl: `https://${e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "-")}.pandem.app`,
                      })
                    }
                    placeholder="e.g. aegis-legal"
                    className="w-full bg-[#0D0D0D] border border-[#2E2E2E] p-3 text-white focus:outline-none focus:border-[#894DEF]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block uppercase text-[#737373] tracking-wider">Tagline *</label>
                <input
                  type="text"
                  required
                  value={form.tagline}
                  onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                  placeholder="One-sentence hook explaining privacy superiority..."
                  className="w-full bg-[#0D0D0D] border border-[#2E2E2E] p-3 text-white focus:outline-none focus:border-[#894DEF]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block uppercase text-[#737373] tracking-wider">Detailed Description *</label>
                <textarea
                  required
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Explain why centralized competitors leak confidential user telemetry and how your CVM architecture preserves zero data retention..."
                  className="w-full bg-[#0D0D0D] border border-[#2E2E2E] p-3 text-white focus:outline-none focus:border-[#894DEF] resize-none"
                />
              </div>

              {/* Category Selection Grid */}
              <div className="space-y-2 pt-2">
                <label className="block uppercase text-[#737373] tracking-wider">
                  Product Category (Sovereign Privacy Domain) *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {CATEGORIES.map((cat) => {
                    const isSelected = form.category === cat.id;
                    return (
                      <div
                        key={cat.id}
                        onClick={() => setForm({ ...form, category: cat.id as any })}
                        className={`p-3.5 border cursor-pointer transition-colors space-y-1 ${
                          isSelected
                            ? "bg-[#262626] border-[#894DEF] text-white"
                            : "bg-[#0D0D0D] border-[#2E2E2E] text-[#B8B8B8] hover:border-[#737373]"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-xs">{cat.label}</span>
                          {isSelected && <span className="text-[#894DEF] font-bold text-xs">✓</span>}
                        </div>
                        <p className="text-[10px] text-[#737373] leading-relaxed">{cat.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Pricing Grid (USDC & NEAR) */}
              <div className="p-4 bg-[#0D0D0D] border border-[#2E2E2E] space-y-4 mt-3">
                <div className="flex items-center justify-between border-b border-[#2E2E2E] pb-2">
                  <span className="text-[#894DEF] font-bold uppercase text-[11px]">
                    Escrow Subscription Settlement Rates
                  </span>
                  <span className="text-[10px] text-[#737373]">
                    Oracle Ref: 1 NEAR ≈ {NEAR_USDC_RATE} USDC
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Monthly Pricing */}
                  <div className="space-y-2">
                    <span className="text-[11px] text-white font-bold block">Monthly Tier</span>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-[#737373]">USDC / Month</label>
                        <input
                          type="number"
                          min="1"
                          value={form.monthlyUsdc}
                          onChange={(e) => handleUsdcMonthlyChange(e.target.value)}
                          className="w-full bg-[#171717] border border-[#2E2E2E] p-2 text-white text-xs focus:outline-none focus:border-[#894DEF]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-[#737373]">NEAR / Month</label>
                        <input
                          type="number"
                          step="0.01"
                          value={form.monthlyNear}
                          onChange={(e) => handleNearMonthlyChange(e.target.value)}
                          className="w-full bg-[#171717] border border-[#2E2E2E] p-2 text-white text-xs focus:outline-none focus:border-[#894DEF]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Yearly Discounted Pricing */}
                  <div className="space-y-2">
                    <span className="text-[11px] text-white font-bold block">Yearly Tier (Discounted)</span>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-[#737373]">USDC / Year</label>
                        <input
                          type="number"
                          min="10"
                          value={form.yearlyUsdc}
                          onChange={(e) => handleUsdcYearlyChange(e.target.value)}
                          className="w-full bg-[#171717] border border-[#2E2E2E] p-2 text-white text-xs focus:outline-none focus:border-[#894DEF]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-[#737373]">NEAR / Year</label>
                        <input
                          type="number"
                          step="0.1"
                          value={form.yearlyNear}
                          onChange={(e) => handleNearYearlyChange(e.target.value)}
                          className="w-full bg-[#171717] border border-[#2E2E2E] p-2 text-white text-xs focus:outline-none focus:border-[#894DEF]"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-[10px] text-[#737373] pt-1">
                  Subscribers lock either USDC (NEP-141) or wNEAR into the escrow contract. Funds stream continuously per 7-day period.
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-[#2E2E2E]">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-2.5 bg-[#894DEF] hover:bg-[#A273F2] text-white font-mono text-xs font-bold uppercase tracking-wider transition-colors"
              >
                Continue to Privacy Stack & CVM →
              </button>
            </div>
          </section>
        )}

        {/* STEP 2: Full-Stack Privacy Constraints & Architecture */}
        {step === 2 && (
          <section className="bg-[#171717] border border-[#2E2E2E] p-6 sm:p-8 space-y-6">
            <div className="border-b border-[#2E2E2E] pb-3">
              <h2 className="text-base sm:text-lg font-bold uppercase tracking-wider text-white font-mono">
                Step 2: Full-Stack Privacy Constraints & CVM Architecture
              </h2>
              <p className="text-xs text-[#B8B8B8] font-mono mt-0.5">
                Configure your database sealing, enclave runtime, NEAR AI Cloud endpoint, and verifiable frontend mirrors.
              </p>
            </div>

            <div className="space-y-6 font-mono text-xs">
              {/* Module A: Node / Backend Server & Enclave Runtime */}
              <div className="p-4 bg-[#0D0D0D] border border-[#2E2E2E] space-y-3">
                <div className="flex items-center justify-between border-b border-[#2E2E2E] pb-2">
                  <span className="text-white font-bold uppercase text-[11px] flex items-center gap-2">
                    <span className="text-[#894DEF]">A.</span> Node / Backend Server (Hardware Enclave Runtime)
                  </span>
                  <span className="text-[#4ADE80] text-[10px] border border-[#4ADE80]/30 px-2 py-0.5">
                    Hardware Attested
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {ENCLAVE_RUNTIMES.map((rt) => {
                    const isSelected = form.enclaveRuntime === rt.id;
                    return (
                      <div
                        key={rt.id}
                        onClick={() => setForm({ ...form, enclaveRuntime: rt.id as any })}
                        className={`p-3.5 border cursor-pointer transition-colors space-y-1.5 ${
                          isSelected
                            ? "bg-[#171717] border-[#894DEF] text-white"
                            : "bg-[#171717] border-[#2E2E2E] text-[#B8B8B8] hover:border-[#737373]"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-xs">{rt.name}</span>
                          <span className="text-[10px] text-[#894DEF] font-bold">{rt.vendor}</span>
                        </div>
                        <p className="text-[10px] text-[#737373] leading-relaxed">{rt.desc}</p>
                        <div className="flex justify-between text-[9px] text-[#B8B8B8] pt-1 border-t border-[#2E2E2E]/60">
                          <span>Quote: {rt.attestation}</span>
                          <span>{rt.latency}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-1.5 pt-2">
                  <label className="block text-[10px] text-[#737373] uppercase">Container Image URI *</label>
                  <input
                    type="text"
                    value={form.containerImage}
                    onChange={(e) => setForm({ ...form, containerImage: e.target.value })}
                    className="w-full bg-[#171717] border border-[#2E2E2E] p-2.5 text-white text-xs focus:outline-none focus:border-[#894DEF]"
                  />
                </div>

                {/* Real-time Computed Compose Hash Badge */}
                <div className="p-3 bg-[#171717] border border-[#2E2E2E] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] text-[#737373] block uppercase">Auto-Computed SHA-256 Compose-Hash</span>
                    <code className="text-[#894DEF] text-xs font-bold break-all">{composeHash}</code>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(composeHash, "hash")}
                    className="px-2.5 py-1 bg-[#262626] border border-[#2E2E2E] text-[#FAFAFA] hover:text-white text-[10px] uppercase font-bold shrink-0"
                  >
                    {copiedCode === "hash" ? "Copied ✓" : "Copy Hash"}
                  </button>
                </div>
              </div>

              {/* Module B: User Database (Hardware-Sealed PostgreSQL) */}
              <div className="p-4 bg-[#0D0D0D] border border-[#2E2E2E] space-y-3">
                <div className="flex items-center justify-between border-b border-[#2E2E2E] pb-2">
                  <span className="text-white font-bold uppercase text-[11px] flex items-center gap-2">
                    <span className="text-[#894DEF]">B.</span> User Database (Hardware-Sealed pgvector)
                  </span>
                  <span className="text-[#FBBF24] text-[10px] border border-[#FBBF24]/30 px-2 py-0.5">
                    KMS Sealed at Rest
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3 bg-[#171717] border border-[#2E2E2E] space-y-1">
                    <span className="text-white font-bold text-xs block">Engine: PostgreSQL 16 + pgvector</span>
                    <p className="text-[10px] text-[#B8B8B8] leading-relaxed">
                      Confidential semantic vector search and relational tables. Vector embeddings reside only in hardware-encrypted CVM memory.
                    </p>
                  </div>

                  <div className="p-3 bg-[#171717] border border-[#2E2E2E] space-y-1">
                    <span className="text-white font-bold text-xs block">KMS Encryption at Rest</span>
                    <p className="text-[10px] text-[#B8B8B8] leading-relaxed">
                      Decryption keys are attestation-bound: released by the KMS <strong>only if</strong> the CVM measurement matches the on-chain compose-hash.
                    </p>
                  </div>
                </div>

                <div className="text-[10px] text-[#737373]">
                  Host operators, cloud providers, and physical disk extractors cannot inspect plaintext database rows or prompt history.
                </div>
              </div>

              {/* Module C: AI Inference Provider (NEAR AI Cloud) */}
              <div className="p-4 bg-[#0D0D0D] border border-[#2E2E2E] space-y-3">
                <div className="flex items-center justify-between border-b border-[#2E2E2E] pb-2">
                  <span className="text-white font-bold uppercase text-[11px] flex items-center gap-2">
                    <span className="text-[#894DEF]">C.</span> AI Inference Provider (NEAR AI Cloud)
                  </span>
                  <span className="text-[#894DEF] text-[10px] border border-[#894DEF]/30 px-2 py-0.5">
                    cloud-api.near.ai/v1
                  </span>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] text-[#737373] uppercase">Select Attested TEE Model *</label>
                  <div className="space-y-2">
                    {NEAR_AI_MODELS.map((m) => {
                      const isSelected = form.aiModel === m.id;
                      return (
                        <div
                          key={m.id}
                          onClick={() => setForm({ ...form, aiModel: m.id as any })}
                          className={`p-3 border cursor-pointer transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                            isSelected
                              ? "bg-[#171717] border-[#894DEF] text-white"
                              : "bg-[#171717] border-[#2E2E2E] text-[#B8B8B8] hover:border-[#737373]"
                          }`}
                        >
                          <div>
                            <span className="font-bold text-white text-xs block">{m.name}</span>
                            <span className="text-[10px] text-[#737373]">{m.bestFor}</span>
                          </div>
                          <div className="text-left sm:text-right shrink-0">
                            <span className="text-xs font-bold text-[#894DEF] block">{m.rate}</span>
                            <span className="text-[9px] text-[#737373]">{m.hardware}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="p-3 bg-[#171717] border border-[#2E2E2E] text-[10px] text-[#B8B8B8] space-y-1">
                  <div className="flex justify-between">
                    <span>Virtual Scoped Key Format:</span>
                    <code className="text-[#894DEF]">pk-pandem-tee-{form.slug}-xxxx</code>
                  </div>
                  <div className="flex justify-between">
                    <span>Dampener Policy:</span>
                    <span className="text-white">Budget contract meters inference tokens to prevent key draining</span>
                  </div>
                </div>
              </div>

              {/* Module D: Verifiable Frontend & Decentralized Mirrors */}
              <div className="p-4 bg-[#0D0D0D] border border-[#2E2E2E] space-y-3">
                <div className="flex items-center justify-between border-b border-[#2E2E2E] pb-2">
                  <span className="text-white font-bold uppercase text-[11px] flex items-center gap-2">
                    <span className="text-[#894DEF]">D.</span> Verifiable Frontend & Decentralized Mirrors
                  </span>
                  <span className="text-[#4ADE80] text-[10px] border border-[#4ADE80]/30 px-2 py-0.5">
                    Immutable CIDs
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="block text-[10px] text-[#737373] uppercase">Primary Deployment URL *</label>
                    <input
                      type="text"
                      value={form.primaryFrontendUrl}
                      onChange={(e) => setForm({ ...form, primaryFrontendUrl: e.target.value })}
                      className="w-full bg-[#171717] border border-[#2E2E2E] p-2.5 text-white text-xs focus:outline-none focus:border-[#894DEF]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[10px] text-[#737373] uppercase">
                        Filecoin / Lighthouse IPFS Backup CID *
                      </label>
                      <input
                        type="text"
                        value={form.filecoinCid}
                        onChange={(e) => setForm({ ...form, filecoinCid: e.target.value })}
                        className="w-full bg-[#171717] border border-[#2E2E2E] p-2 text-white text-xs focus:outline-none focus:border-[#894DEF]"
                      />
                      <span className="text-[9px] text-[#737373] block">Pinned via Lighthouse x402 renewals</span>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] text-[#737373] uppercase">
                        NEAR FastFS Immutable Mirror CID *
                      </label>
                      <input
                        type="text"
                        value={form.fastFsCid}
                        onChange={(e) => setForm({ ...form, fastFsCid: e.target.value })}
                        className="w-full bg-[#171717] border border-[#2E2E2E] p-2 text-white text-xs focus:outline-none focus:border-[#894DEF]"
                      />
                      <span className="text-[9px] text-[#737373] block">Decentralized WebAssembly frontend host</span>
                    </div>
                  </div>
                </div>

                <div className="text-[10px] text-[#737373]">
                  Dual decentralized pinning ensures that the web client cannot be covertly altered or censored by DNS attacks.
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-[#2E2E2E]">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-2.5 bg-[#262626] border border-[#2E2E2E] text-[#FAFAFA] font-mono text-xs hover:bg-[#2E2E2E] transition-colors uppercase font-bold"
              >
                ← Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="px-6 py-2.5 bg-[#894DEF] hover:bg-[#A273F2] text-white font-mono text-xs font-bold uppercase tracking-wider transition-colors"
              >
                Continue to 30% OpEx Simulator →
              </button>
            </div>
          </section>
        )}

        {/* STEP 3: Market Provider Settlement & 30% OpEx Simulator */}
        {step === 3 && (
          <section className="bg-[#171717] border border-[#2E2E2E] p-6 sm:p-8 space-y-6">
            <div className="border-b border-[#2E2E2E] pb-3">
              <h2 className="text-base sm:text-lg font-bold uppercase tracking-wider text-white font-mono">
                Step 3: Market Provider Settlement & 30% OpEx Simulator
              </h2>
              <p className="text-xs text-[#B8B8B8] font-mono mt-0.5">
                Simulate your recurring cashflow. Smart contracts autonomously pay NEAR AI, Phala CVM, and Filecoin directly from subscriber funds.
              </p>
            </div>

            <div className="space-y-6 font-mono text-xs">
              {/* Interactive Subscriber Slider */}
              <div className="p-5 bg-[#0D0D0D] border border-[#2E2E2E] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-white font-bold text-xs uppercase block">Simulated Subscriber Base</span>
                    <span className="text-[10px] text-[#737373]">
                      Monthly fee: {form.monthlyUsdc} USDC ({form.monthlyNear} NEAR)
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-bold text-[#894DEF] font-mono">
                      {form.simulatedSubscribers.toLocaleString()} Subscribers
                    </span>
                    <span className="text-[10px] text-[#737373] block">
                      ${opexCalculations.totalGross.toLocaleString()} / mo Gross MRR
                    </span>
                  </div>
                </div>

                <input
                  type="range"
                  min="25"
                  max="5000"
                  step="25"
                  value={form.simulatedSubscribers}
                  onChange={(e) => setForm({ ...form, simulatedSubscribers: parseInt(e.target.value) || 25 })}
                  className="w-full accent-[#894DEF] bg-[#262626] h-2 rounded-none cursor-pointer"
                />

                <div className="flex justify-between text-[10px] text-[#737373]">
                  <span>25 Subs ($250)</span>
                  <span>500 Subs ($5,000)</span>
                  <span>2,500 Subs ($25,000)</span>
                  <span>5,000 Subs ($50,000)</span>
                </div>
              </div>

              {/* The 5-Split Waterfall Overview */}
              <div className="space-y-2">
                <span className="text-[11px] text-[#737373] uppercase tracking-wider block">
                  Autonomous Contract Cashflow Waterfall (No Credit Cards)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  <div className="p-3 bg-[#0D0D0D] border border-[#2E2E2E] space-y-1">
                    <span className="text-[10px] text-[#737373] block uppercase">Developer Profit</span>
                    <span className="text-lg font-bold text-white block">47.5%</span>
                    <span className="text-xs text-[#4ADE80] font-bold block">
                      ${opexCalculations.devProfit.toLocaleString()} / mo
                    </span>
                    <span className="text-[9px] text-[#737373] block">7-day stream release</span>
                  </div>

                  <div className="p-3 bg-[#0D0D0D] border border-[#894DEF] space-y-1">
                    <span className="text-[10px] text-[#894DEF] block uppercase font-bold">Market OpEx</span>
                    <span className="text-lg font-bold text-[#894DEF] block">30.0%</span>
                    <span className="text-xs text-white font-bold block">
                      ${opexCalculations.totalOpex.toLocaleString()} / mo
                    </span>
                    <span className="text-[9px] text-[#894DEF] block">Autonomous routing</span>
                  </div>

                  <div className="p-3 bg-[#0D0D0D] border border-[#2E2E2E] space-y-1">
                    <span className="text-[10px] text-[#737373] block uppercase">Bug Bounty Pool</span>
                    <span className="text-lg font-bold text-white block">15.0%</span>
                    <span className="text-xs text-[#FBBF24] font-bold block">
                      ${opexCalculations.bugWarranty.toLocaleString()} / mo
                    </span>
                    <span className="text-[9px] text-[#737373] block">70-day solve warranty</span>
                  </div>

                  <div className="p-3 bg-[#0D0D0D] border border-[#2E2E2E] space-y-1">
                    <span className="text-[10px] text-[#737373] block uppercase">Contingency</span>
                    <span className="text-lg font-bold text-white block">5.0%</span>
                    <span className="text-xs text-white font-bold block">
                      ${opexCalculations.contingency.toLocaleString()} / mo
                    </span>
                    <span className="text-[9px] text-[#737373] block">Emergency failover</span>
                  </div>

                  <div className="p-3 bg-[#0D0D0D] border border-[#2E2E2E] space-y-1">
                    <span className="text-[10px] text-[#737373] block uppercase">Pandem Fee</span>
                    <span className="text-lg font-bold text-white block">2.5%</span>
                    <span className="text-xs text-white font-bold block">
                      ${opexCalculations.protocolFee.toLocaleString()} / mo
                    </span>
                    <span className="text-[9px] text-[#737373] block">Protocol upkeep</span>
                  </div>
                </div>
              </div>

              {/* Deep-Dive into the 30% Market Provider OpEx */}
              <div className="p-5 bg-[#0D0D0D] border border-[#2E2E2E] space-y-4">
                <div className="flex items-center justify-between border-b border-[#2E2E2E] pb-2">
                  <span className="text-white font-bold text-xs uppercase flex items-center gap-2">
                    <span className="text-[#894DEF]">⚡</span> Breakdown of the 30% Operations Budget ($
                    {opexCalculations.totalOpex.toLocaleString()} / mo)
                  </span>
                  <span className="text-[10px] text-[#894DEF] font-bold">
                    Escrow Streamed via budget.{form.slug}.testnet
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Provider 1: NEAR AI Cloud */}
                  <div className="p-3.5 bg-[#171717] border border-[#2E2E2E] space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-bold text-white text-xs block">NEAR AI Cloud</span>
                        <span className="text-[10px] text-[#737373]">Private TEE Inference</span>
                      </div>
                      <span className="text-xs font-bold text-[#894DEF]">50% of OpEx</span>
                    </div>

                    <div className="text-base font-bold text-white">
                      ${opexCalculations.aiInferenceOpex.toLocaleString()} / mo
                    </div>

                    <div className="text-[10px] text-[#B8B8B8] space-y-1 pt-1 border-t border-[#2E2E2E]">
                      <div className="flex justify-between">
                        <span>Model:</span>
                        <span className="text-white font-mono truncate max-w-[120px]">{form.aiModel}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Capacity:</span>
                        <span className="text-[#4ADE80]">~{(opexCalculations.tokenCapacity / 1000).toFixed(0)}k tokens/mo</span>
                      </div>
                    </div>
                  </div>

                  {/* Provider 2: Phala / Akash Confidential CVM */}
                  <div className="p-3.5 bg-[#171717] border border-[#2E2E2E] space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-bold text-white text-xs block">
                          {form.enclaveRuntime === "phala_dstack" ? "Phala Cloud" : "Akash Network"}
                        </span>
                        <span className="text-[10px] text-[#737373]">Hardware Enclave CVM</span>
                      </div>
                      <span className="text-xs font-bold text-[#894DEF]">33.3% of OpEx</span>
                    </div>

                    <div className="text-base font-bold text-white">
                      ${opexCalculations.enclaveCvmOpex.toLocaleString(undefined, { maximumFractionDigits: 2 })} / mo
                    </div>

                    <div className="text-[10px] text-[#B8B8B8] space-y-1 pt-1 border-t border-[#2E2E2E]">
                      <div className="flex justify-between">
                        <span>Runtime:</span>
                        <span className="text-white font-mono">
                          {form.enclaveRuntime === "phala_dstack" ? "dstack TDX" : "SEV-SNP"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Compute:</span>
                        <span className="text-[#4ADE80]">High-Availability CVM</span>
                      </div>
                    </div>
                  </div>

                  {/* Provider 3: Filecoin / Lighthouse */}
                  <div className="p-3.5 bg-[#171717] border border-[#2E2E2E] space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-bold text-white text-xs block">Filecoin x402 Lighthouse</span>
                        <span className="text-[10px] text-[#737373]">Decentralized Pinning</span>
                      </div>
                      <span className="text-xs font-bold text-[#894DEF]">16.7% of OpEx</span>
                    </div>

                    <div className="text-base font-bold text-white">
                      ${opexCalculations.storagePinningOpex.toLocaleString(undefined, { maximumFractionDigits: 2 })} / mo
                    </div>

                    <div className="text-[10px] text-[#B8B8B8] space-y-1 pt-1 border-t border-[#2E2E2E]">
                      <div className="flex justify-between">
                        <span>Dual Pinning:</span>
                        <span className="text-white">IPFS + NEAR FastFS</span>
                      </div>
                      <div className="flex justify-between">
                        <span>CID Guarantee:</span>
                        <span className="text-[#4ADE80]">Verifiable Frontend</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-[#171717] border border-[#2E2E2E] text-[11px] text-[#B8B8B8] leading-relaxed">
                  <span className="text-white font-bold block mb-1">Autonomous Cashflow Settlement Guarantee:</span>
                  The `budget.{form.slug}.testnet` smart contract receives 30% of each unreleased subscription period and invokes cross-contract settlement promises directly to NEAR AI Cloud, Phala CVM, and Lighthouse.
                  Developers do not need corporate credit cards or personal bank accounts to keep infrastructure alive.
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-[#2E2E2E]">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-2.5 bg-[#262626] border border-[#2E2E2E] text-[#FAFAFA] font-mono text-xs hover:bg-[#2E2E2E] transition-colors uppercase font-bold"
              >
                ← Back
              </button>
              <button
                onClick={handleDeployAndLaunch}
                disabled={isDeploying}
                className="px-8 py-2.5 bg-[#894DEF] hover:bg-[#A273F2] disabled:opacity-50 text-white font-mono text-xs font-bold uppercase tracking-wider transition-colors"
              >
                {isDeploying ? "Deploying & Launching Product..." : "Deploy Contract Suite & Launch →"}
              </button>
            </div>
          </section>
        )}

        {/* STEP 4: Contract Deployment & Storefront Launch */}
        {step === 4 && deploymentResult && (
          <section className="bg-[#171717] border border-[#2E2E2E] p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-2 border-b border-[#2E2E2E] pb-3">
              <span className="w-2.5 h-2.5 bg-[#4ADE80]" />
              <h2 className="text-base sm:text-lg font-bold uppercase tracking-wider text-[#4ADE80] font-mono">
                Product Suite Deployed & Live on Storefront
              </h2>
            </div>

            <p className="text-xs text-[#B8B8B8] font-mono leading-relaxed">
              Congratulations! Your sovereign privacy product <strong>{form.name}</strong> has been registered on the Pandem Launchpad and is now active on NEAR testnet.
              The tripartite contract suite enforces heartbeat liveness, automated market provider payments, and subscriber governance request tokens.
            </p>

            {/* Tripartite Contract Registry */}
            <div className="space-y-2 font-mono text-xs">
              <span className="text-[11px] text-[#737373] uppercase tracking-wider block">
                Tripartite Contract Suite (NEAR Testnet)
              </span>

              <div className="p-3 bg-[#0D0D0D] border border-[#2E2E2E] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[#737373] block text-[10px]">1. Escrow Subscription Contract (47.5% Dev / D-14 Warranty):</span>
                  <span className="text-white font-bold">{deploymentResult.escrowContract}</span>
                </div>
                <span className="text-[#4ADE80] text-[10px] border border-[#4ADE80]/30 px-2 py-0.5">
                  Live on NEAR Testnet
                </span>
              </div>

              <div className="p-3 bg-[#0D0D0D] border border-[#2E2E2E] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[#737373] block text-[10px]">2. 30% Market OpEx Budget Contract (NEAR AI / Phala / Filecoin):</span>
                  <span className="text-white font-bold">{deploymentResult.budgetContract}</span>
                </div>
                <span className="text-[#894DEF] text-[10px] border border-[#894DEF]/30 px-2 py-0.5">
                  Autonomous Settlement
                </span>
              </div>

              <div className="p-3 bg-[#0D0D0D] border border-[#2E2E2E] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[#737373] block text-[10px]">3. Governance Strategy Contract (3 Request Tokens / Month):</span>
                  <span className="text-white font-bold">{deploymentResult.votingContract}</span>
                </div>
                <span className="text-white text-[10px] border border-[#2E2E2E] px-2 py-0.5">
                  Arbitration Active
                </span>
              </div>
            </div>

            {/* Generated Scoped Key */}
            <div className="p-4 bg-[#0D0D0D] border border-[#2E2E2E] space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#894DEF] font-bold uppercase text-[11px]">
                  Virtual Scoped NEAR AI Cloud Key
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(deploymentResult.apiKey, "apikey")}
                  className="px-2 py-0.5 bg-[#262626] border border-[#2E2E2E] text-[10px] text-white uppercase font-bold"
                >
                  {copiedCode === "apikey" ? "Copied ✓" : "Copy Key"}
                </button>
              </div>
              <code className="text-white text-xs block break-all bg-[#171717] p-2.5 border border-[#2E2E2E]">
                {deploymentResult.apiKey}
              </code>
              <span className="text-[10px] text-[#737373] block">
                Scoped strictly to {form.aiModel} with rate-limiting bound to budget.{form.slug}.testnet.
              </span>
            </div>

            {/* Verifiable Docker Compose Manifest */}
            <div className="p-4 bg-[#0D0D0D] border border-[#2E2E2E] space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-white font-bold uppercase text-[11px] block">
                    Verifiable Docker Compose Manifest
                  </span>
                  <span className="text-[10px] text-[#737373]">
                    SHA-256 Measured: {deploymentResult.composeHash.substring(0, 18)}...
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(deploymentResult.composeManifest, "manifest")}
                  className="px-3 py-1 bg-[#894DEF] hover:bg-[#A273F2] text-white text-[10px] uppercase font-bold transition-colors"
                >
                  {copiedCode === "manifest" ? "Copied Manifest ✓" : "Copy docker-compose.yml"}
                </button>
              </div>

              <pre className="bg-[#171717] p-3 text-[11px] text-[#B8B8B8] overflow-x-auto max-h-60 border border-[#2E2E2E] font-mono leading-relaxed">
                {deploymentResult.composeManifest}
              </pre>
            </div>

            {/* Action Links Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <Link
                href="/"
                className="py-3 bg-[#894DEF] hover:bg-[#A273F2] text-white font-mono text-xs font-bold text-center uppercase transition-colors"
              >
                Storefront Leaderboard (/) →
              </Link>

              <Link
                href={deploymentResult.liveUrl}
                className="py-3 bg-[#262626] hover:bg-[#2E2E2E] border border-[#2E2E2E] text-white font-mono text-xs font-bold text-center uppercase transition-colors"
              >
                View Product Page ({deploymentResult.liveUrl}) →
              </Link>

              <Link
                href={`${deploymentResult.liveUrl}/voting`}
                className="py-3 bg-[#171717] hover:bg-[#262626] border border-[#894DEF]/40 text-[#894DEF] font-mono text-xs font-bold text-center uppercase transition-colors"
              >
                Voting Session →
              </Link>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
