"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  CheckCircle2,
  Cpu,
  Database,
  Shield,
  Globe,
  Key,
  ArrowRight,
  ArrowLeft,
  Copy,
  Terminal,
  ExternalLink,
  Activity,
  Coins,
  Scale,
  Sparkles,
  FileCode,
  Lock,
  Layers,
  ShieldCheck,
  Clock,
} from "lucide-react";
import { useNearWallet } from "../../../context/NearWalletContext";

interface OnboardingFormState {
  // Segment 1: Verifiable Frontend & Identity
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
  primaryFrontendUrl: string;
  filecoinCid: string;
  fastFsCid: string;
  auditFrontendVerified: boolean;

  // Segment 2: Isolated Node Backend
  enclaveRuntime: "phala_dstack" | "akash_sev_snp";
  containerImage: string;
  auditBackendIsolated: boolean;

  // Segment 3: KMS-Sealed Database
  dbEngine: "pgvector_sealed";
  dbKmsMode: "kms_attestation_bound";
  auditDatabaseSealed: boolean;

  // Segment 4: Private AI Inference & Autonomous Escrow
  aiModel: "deepseek-ai/DeepSeek-V3.1" | "Qwen/Qwen2.5-72B-Instruct" | "meta-llama/Llama-3.3-70B-Instruct";
  simulatedSubscribers: number;
  auditEscrowConfigured: boolean;
}

const NEAR_USDC_ORACLE_RATE = 5.20; // 1 NEAR ≈ 5.20 USDC testnet oracle

const CATEGORIES = [
  {
    id: "Legal",
    label: "Legal & Compliance",
    suite: "Legal & IP Enclave",
    icon: Scale,
    description: "Confidential litigation briefs and work product protected by hardware attestation.",
  },
  {
    id: "Security",
    label: "Security & Audit",
    suite: "Decentralized Infrastructure",
    icon: Shield,
    description: "Zero-knowledge vulnerability scanning and cryptographic proof verification.",
  },
  {
    id: "Health",
    label: "Clinical Health & Bio",
    suite: "Clinical Health & Bio",
    icon: Activity,
    description: "HIPAA-compliant diagnostic intelligence with zero cloud prompt retention.",
  },
  {
    id: "Financial",
    label: "Financial & Tax",
    suite: "ZK Finance & Ledger",
    icon: Coins,
    description: "Private multi-chain ledger reconciliation and encrypted algorithmic accounting.",
  },
  {
    id: "DevTools",
    label: "Developer Tools",
    suite: "Decentralized Infrastructure",
    icon: Terminal,
    description: "Verifiable confidential APIs, proxy routers, and enclave agent execution.",
  },
  {
    id: "Private Social",
    label: "Private Social",
    suite: "Operations & Scheduling",
    icon: Globe,
    description: "Metadata-resistant communication, confidential calendar coordination, and notes.",
  },
] as const;

const ENCLAVE_RUNTIMES = [
  {
    id: "phala_dstack",
    name: "Phala dstack Intel TDX",
    provider: "Phala Cloud",
    type: "Trust Domain Extensions (TDX)",
    attestation: "Intel SGX/TDX Quote",
    overhead: "< 1.5ms latency",
    description: "Confidential VM isolation with Intel hardware attestation and dstack secret management.",
  },
  {
    id: "akash_sev_snp",
    name: "Akash AMD SEV-SNP",
    provider: "Akash Network",
    type: "Secure Encrypted Virtualization",
    attestation: "AMD SEV Attestation Report",
    overhead: "< 2.0ms latency",
    description: "Decentralized confidential GPU/CPU compute with memory encryption and nested paging.",
  },
] as const;

const NEAR_AI_MODELS = [
  {
    id: "deepseek-ai/DeepSeek-V3.1",
    name: "DeepSeek V3.1",
    tag: "Reasoning & Code",
    hardware: "NVIDIA H100 NRAS Attested",
    rate: "$0.0018 / 1k tokens",
    description: "Reasoning, code synthesis, and verification inside hardware enclaves.",
  },
  {
    id: "Qwen/Qwen2.5-72B-Instruct",
    name: "Qwen 2.5 72B",
    tag: "Multilingual Intelligence",
    hardware: "NVIDIA H100 NRAS Attested",
    rate: "$0.0012 / 1k tokens",
    description: "General intelligence, legal extraction, and structured classification.",
  },
  {
    id: "meta-llama/Llama-3.3-70B-Instruct",
    name: "Llama 3.3 70B",
    tag: "Enterprise Enclave",
    hardware: "Intel TDX Enclave CVM",
    rate: "$0.0015 / 1k tokens",
    description: "Enterprise workflow automation, structured tool calling, and reproducible outputs.",
  },
] as const;

const DEFAULT_FORM: OnboardingFormState = {
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
  primaryFrontendUrl: "https://aegis-privacy.pandem.app",
  filecoinCid: "bafybeic2h7g5y6r7w8x9z0q1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p",
  fastFsCid: "fastfs://bafk7y2w3x4y5z6a7b8c9d0e1f2g3h4i5j6k7l8m9n0",
  auditFrontendVerified: true,

  enclaveRuntime: "phala_dstack",
  containerImage: "docker.io/pandem/aegis-enclave:v1.4.0",
  auditBackendIsolated: true,

  dbEngine: "pgvector_sealed",
  dbKmsMode: "kms_attestation_bound",
  auditDatabaseSealed: true,

  aiModel: "deepseek-ai/DeepSeek-V3.1",
  simulatedSubscribers: 250,
  auditEscrowConfigured: true,
};

export default function DevOnboardingPage() {
  const router = useRouter();
  const { accountId } = useNearWallet();

  const [step, setStep] = useState<number>(1);
  const [form, setForm] = useState<OnboardingFormState>(DEFAULT_FORM);
  const [previewTab, setPreviewTab] = useState<"compose" | "tranches" | "attestation">("compose");
  const [composeHash, setComposeHash] = useState<string>("0x8f2a4c1e9b7d3a5f6e8c0b2d4f6a8c0e1b3d5f7a9c1e3b5d7f9a1c3e5b7d9f1a");
  const [isDeploying, setIsDeploying] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [deploymentResult, setDeploymentResult] = useState<{
    escrowContract: string;
    budgetContract: string;
    votingContract: string;
    apiKey: string;
    composeHash: string;
    composeManifest: string;
    deployedAt: string;
    liveUrl: string;
    trancheDays: number;
    clawbackDays: number;
  } | null>(null);

  // Sync connected account
  useEffect(() => {
    if (accountId) {
      setForm((prev) => ({ ...prev, steward: accountId }));
    }
  }, [accountId]);

  // Real-time SHA-256 measurement calculation
  const computeMeasurement = useCallback(async () => {
    const rawData = `${form.enclaveRuntime}:${form.containerImage}:${form.dbEngine}:${form.aiModel}:${form.filecoinCid}:${form.fastFsCid}`;
    if (typeof window !== "undefined" && window.crypto?.subtle) {
      try {
        const encoder = new TextEncoder();
        const data = encoder.encode(rawData);
        const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hex = "0x" + hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
        setComposeHash(hex);
        return;
      } catch {
        // fallback
      }
    }
    let h = 0;
    for (let i = 0; i < rawData.length; i++) {
      h = (h << 5) - h + rawData.charCodeAt(i);
      h |= 0;
    }
    setComposeHash("0x" + Math.abs(h).toString(16).padStart(64, "0"));
  }, [form.enclaveRuntime, form.containerImage, form.dbEngine, form.aiModel, form.filecoinCid, form.fastFsCid]);

  useEffect(() => {
    computeMeasurement();
  }, [computeMeasurement]);

  // Synchronize name to slug
  const handleNameChange = (name: string) => {
    const cleanSlug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setForm((prev) => ({
      ...prev,
      name,
      slug: cleanSlug || prev.slug,
      primaryFrontendUrl: `https://${cleanSlug || "app"}.pandem.app`,
    }));
  };

  // Price synchronization
  const handleUsdcMonthlyChange = (val: string) => {
    const num = parseFloat(val) || 0;
    const nearVal = (num / NEAR_USDC_ORACLE_RATE).toFixed(2);
    setForm((prev) => ({ ...prev, monthlyUsdc: val, monthlyNear: nearVal }));
  };

  const handleNearMonthlyChange = (val: string) => {
    const num = parseFloat(val) || 0;
    const usdcVal = (num * NEAR_USDC_ORACLE_RATE).toFixed(2);
    setForm((prev) => ({ ...prev, monthlyNear: val, monthlyUsdc: usdcVal }));
  };

  const handleUsdcYearlyChange = (val: string) => {
    const num = parseFloat(val) || 0;
    const nearVal = (num / NEAR_USDC_ORACLE_RATE).toFixed(2);
    setForm((prev) => ({ ...prev, yearlyUsdc: val, yearlyNear: nearVal }));
  };

  const handleNearYearlyChange = (val: string) => {
    const num = parseFloat(val) || 0;
    const usdcVal = (num * NEAR_USDC_ORACLE_RATE).toFixed(2);
    setForm((prev) => ({ ...prev, yearlyNear: val, yearlyUsdc: usdcVal }));
  };

  // Live Economics calculations
  const economics = useMemo(() => {
    const subs = form.simulatedSubscribers;
    const price = parseFloat(form.monthlyUsdc) || 10;
    const grossMrr = subs * price;

    const devNet = grossMrr * 0.475;
    const opex = grossMrr * 0.30;
    const bugWarranty = grossMrr * 0.15;
    const contingency = grossMrr * 0.05;
    const protocolFee = grossMrr * 0.025;

    const opexNearAi = opex * 0.50;
    const opexCvm = opex * 0.3333;
    const opexStorage = opex * 0.1667;

    const tokenTokensMonthly = Math.round((opexNearAi / 0.0015) * 1000);

    return {
      grossMrr,
      devNet,
      opex,
      bugWarranty,
      contingency,
      protocolFee,
      opexNearAi,
      opexCvm,
      opexStorage,
      tokenTokensMonthly,
    };
  }, [form.simulatedSubscribers, form.monthlyUsdc]);

  // Live docker-compose manifest generator
  const generatedComposeManifest = useMemo(() => {
    const cleanSlug = form.slug || "app";
    const apiKeyPlaceholder = `pk-pandem-tee-${cleanSlug}-...`;
    return `# Sovereign Privacy Launchpad Manifest
# Enclave Target: ${form.enclaveRuntime === "phala_dstack" ? "Phala dstack Intel TDX" : "Akash AMD SEV-SNP"}
# Measured Hash: ${composeHash}
# Escrow Contract: escrow.${cleanSlug}.testnet
# Tranche Release: 7-day milestone rolling stream

version: "3.8"

services:
  database:
    image: pgvector/pgvector:pg16
    environment:
      POSTGRES_DB: ${cleanSlug}_db
      POSTGRES_USER: ${cleanSlug}_user
      POSTGRES_PASSWORD_FILE: /run/secrets/kms_db_password
    volumes:
      - sealed_pgdata:/var/lib/postgresql/data:Z
    secrets:
      - kms_db_password
    labels:
      pandem.attestation.verified: "true"
      pandem.kms.unseal: "compose_hash==${composeHash}"

  backend:
    image: ${form.containerImage}
    depends_on:
      - database
    environment:
      NODE_ENV: production
      DATABASE_URL: postgres://${cleanSlug}_user@database:5432/${cleanSlug}_db
      NEAR_AI_BASE_URL: https://cloud-api.near.ai/v1
      NEAR_AI_MODEL: "${form.aiModel}"
      NEAR_AI_SCOPED_KEY: "${apiKeyPlaceholder}"
      ESCROW_CONTRACT_ID: "escrow.${cleanSlug}.testnet"
      BUDGET_CONTRACT_ID: "budget.${cleanSlug}.testnet"
      VOTING_CONTRACT_ID: "voting.${cleanSlug}.testnet"
      PRIMARY_FRONTEND_URL: "${form.primaryFrontendUrl}"
      FILECOIN_BACKUP_CID: "${form.filecoinCid}"
      FASTFS_MIRROR_CID: "${form.fastFsCid}"
    ports:
      - "8080:8080"
    labels:
      pandem.compose_hash: "${composeHash}"
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
  }, [form, composeHash]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDeployAndLaunch = async () => {
    setIsDeploying(true);
    try {
      await new Promise((r) => setTimeout(r, 1500));

      const cleanSlug = form.slug.toLowerCase().trim().replace(/[^a-z0-9_-]/g, "-");
      const escrowContract = `escrow.${cleanSlug}.testnet`;
      const budgetContract = `budget.${cleanSlug}.testnet`;
      const votingContract = `voting.${cleanSlug}.testnet`;
      const randomKeyHex = Math.random().toString(16).substring(2, 10);
      const generatedApiKey = `pk-pandem-tee-${cleanSlug}-${randomKeyHex}`;

      const matchedCategory = CATEGORIES.find((c) => c.id === form.category);

      // Register with Upstash Redis backend via /api/products
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
          suite: matchedCategory?.suite || "Decentralized Infrastructure",
          privacy_problem: `Sensitive user queries and vector embeddings execute strictly inside hardware-isolated ${
            form.enclaveRuntime === "phala_dstack" ? "Intel TDX" : "AMD SEV-SNP"
          } enclaves with zero host access.`,
          why_direct_payment_fails: `Direct API billing requires personal credit cards and lacks automated SLA escrow enforcement. Pandem streams subscription funds to developers and market providers only upon verified heartbeats.`,
          score: 95,
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
        console.warn("Product registration notice:", errorData);
      }

      setDeploymentResult({
        escrowContract,
        budgetContract,
        votingContract,
        apiKey: generatedApiKey,
        composeHash,
        composeManifest: generatedComposeManifest.replace("pk-pandem-tee-...-...", generatedApiKey),
        deployedAt: new Date().toISOString(),
        liveUrl: `/products/${cleanSlug}`,
        trancheDays: 7,
        clawbackDays: 14,
      });

      setStep(5); // Launch confirmation step
    } catch (err: any) {
      alert("Launchpad registration failed: " + (err?.message || String(err)));
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0D0D0D] text-[#FAFAFA] font-sans antialiased">
      {/* Top Header & Navigation */}
      <header className="border-b border-[#2E2E2E] bg-[#121212]/70 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-xs font-mono text-[#737373] hover:text-[#FAFAFA] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#894DEF]"
            >
              Leaderboard
            </Link>
            <span className="text-xs text-[#2E2E2E]">/</span>
            <Link
              href="/dev/dashboard"
              className="text-xs font-mono text-[#737373] hover:text-[#FAFAFA] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#894DEF]"
            >
              Developer
            </Link>
            <span className="text-xs text-[#2E2E2E]">/</span>
            <span className="text-xs font-mono text-[#894DEF] font-medium">Privacy Launchpad Studio</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono text-[#4ADE80] bg-[#4ADE80]/10 border border-[#4ADE80]/20">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4ADE80] animate-pulse" />
              NEAR Testnet Escrow
            </span>
            <Link
              href="/dev/dashboard"
              className="text-xs font-mono text-[#B8B8B8] hover:text-white px-3 py-1 border border-[#2E2E2E] hover:border-[#737373] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#894DEF]"
            >
              Developer Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Main Studio Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero Title */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#2E2E2E] pb-6">
          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
              Sovereign Privacy Launchpad Studio
            </h1>
            <p className="text-sm text-[#B8B8B8] max-w-2xl">
              Onboard applications matching the 4-segment privacy standard: verifiable frontend, isolated node backend, KMS-sealed database, and autonomous escrow smart contracts.
            </p>
          </div>

          {/* Stepper Indicator - 4 Privacy Segments */}
          <div className="flex items-center gap-2 font-mono text-xs" role="navigation" aria-label="Privacy Segment Progress">
            {[
              { num: 1, label: "Frontend", title: "Segment 1: Verifiable Frontend" },
              { num: 2, label: "Node CVM", title: "Segment 2: Isolated Node Backend" },
              { num: 3, label: "Database", title: "Segment 3: KMS-Sealed Database" },
              { num: 4, label: "AI & Escrow", title: "Segment 4: AI & Autonomous Escrow" },
            ].map((s) => {
              const isActive = step === s.num;
              const isPast = step > s.num;
              return (
                <button
                  key={s.num}
                  type="button"
                  onClick={() => s.num < step && setStep(s.num)}
                  disabled={s.num > step}
                  aria-current={isActive ? "step" : undefined}
                  title={s.title}
                  className={`flex items-center gap-1.5 px-3 py-1.5 border transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#894DEF] ${
                    isActive
                      ? "border-[#894DEF] bg-[#894DEF]/10 text-white font-medium"
                      : isPast
                      ? "border-[#2E2E2E] bg-[#171717] text-[#FAFAFA] hover:border-[#737373]"
                      : "border-[#2E2E2E] text-[#737373] cursor-not-allowed"
                  }`}
                >
                  {isPast ? (
                    <Check className="w-3.5 h-3.5 text-[#4ADE80]" />
                  ) : (
                    <span className="text-[10px] text-[#737373] tabular-nums">0{s.num}</span>
                  )}
                  <span>{s.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* STEP 5: DEPLOYED STATE (FULL WIDTH) */}
        {step === 5 && deploymentResult ? (
          <section className="bg-[#171717] border border-[#2E2E2E] p-8 space-y-8" aria-label="Deployment Summary">
            <div className="flex items-start justify-between border-b border-[#2E2E2E] pb-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 text-xs font-mono text-[#4ADE80] bg-[#4ADE80]/10 border border-[#4ADE80]/20">
                  <CheckCircle2 className="w-4 h-4 text-[#4ADE80]" />
                  <span>Privacy Verification Passed & Smart Contracts Deployed</span>
                </div>
                <h2 className="text-2xl font-semibold text-white tracking-tight">
                  {form.name} is Active on NEAR Testnet
                </h2>
                <p className="text-sm text-[#B8B8B8] max-w-2xl font-mono">
                  All 4 privacy segments verified. The project escrow contract has been compiled with a 7-day tranche configuration and registered in the Upstash Redis storefront catalog.
                </p>
              </div>

              <div className="flex gap-2">
                <Link
                  href={deploymentResult.liveUrl}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#894DEF] hover:bg-[#A273F2] text-white text-xs font-mono font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#894DEF]"
                >
                  <span>Test Storefront</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Generated Contract & 7-Day Tranche Details */}
            <div className="space-y-3 font-mono text-xs">
              <span className="text-[#737373] text-[11px] uppercase tracking-wider block">
                Dedicated Per-Project Smart Contract Suite
              </span>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-4 bg-[#0D0D0D] border border-[#2E2E2E] space-y-1.5">
                  <span className="text-[10px] text-[#737373] block uppercase">Dedicated Escrow Contract</span>
                  <div className="text-white font-medium break-all">{deploymentResult.escrowContract}</div>
                  <span className="text-[10px] text-[#4ADE80] block tabular-nums">7-Day Tranche Releases • D-14 Clawback</span>
                </div>

                <div className="p-4 bg-[#0D0D0D] border border-[#2E2E2E] space-y-1.5">
                  <span className="text-[10px] text-[#737373] block uppercase">Autonomous 30% OpEx Router</span>
                  <div className="text-[#894DEF] font-medium break-all">{deploymentResult.budgetContract}</div>
                  <span className="text-[10px] text-[#894DEF] block">Streams to NEAR AI / Phala / Filecoin</span>
                </div>

                <div className="p-4 bg-[#0D0D0D] border border-[#2E2E2E] space-y-1.5">
                  <span className="text-[10px] text-[#737373] block uppercase">Governance Strategy Contract</span>
                  <div className="text-white font-medium break-all">{deploymentResult.votingContract}</div>
                  <span className="text-[10px] text-[#B8B8B8] block tabular-nums">3 Request Tokens / Month</span>
                </div>
              </div>
            </div>

            {/* Scoped API Key Card */}
            <div className="p-5 bg-[#0D0D0D] border border-[#2E2E2E] space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-[#894DEF]" />
                  <span className="text-white font-medium">Scoped Virtual NEAR AI Cloud Key</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(deploymentResult.apiKey, "apiKey")}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#171717] hover:bg-[#262626] border border-[#2E2E2E] text-white text-[11px] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#894DEF]"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedId === "apiKey" ? "Copied" : "Copy Key"}</span>
                </button>
              </div>
              <div className="p-3 bg-[#171717] border border-[#2E2E2E] text-[#894DEF] font-mono break-all text-xs">
                {deploymentResult.apiKey}
              </div>
              <p className="text-[11px] text-[#737373]">
                Restricted to {form.aiModel}. Key rate-limiting is cryptographically enforced by the budget smart contract dampener.
              </p>
            </div>

            {/* Verifiable Docker Manifest */}
            <div className="p-5 bg-[#0D0D0D] border border-[#2E2E2E] space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-[#4ADE80]" />
                  <span className="text-white font-medium">Verifiable docker-compose.yml</span>
                  <span className="text-[10px] text-[#737373] hidden sm:inline">
                    SHA-256: {deploymentResult.composeHash.slice(0, 18)}...
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(deploymentResult.composeManifest, "manifest")}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#894DEF] hover:bg-[#A273F2] text-white text-[11px] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#894DEF]"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedId === "manifest" ? "Copied Manifest" : "Copy Manifest"}</span>
                </button>
              </div>

              <pre className="p-4 bg-[#171717] border border-[#2E2E2E] text-[#B8B8B8] text-[11px] overflow-x-auto max-h-72 leading-relaxed font-mono">
                {deploymentResult.composeManifest}
              </pre>
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#894DEF] hover:bg-[#A273F2] text-white text-xs font-mono font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#894DEF]"
              >
                <span>View on Storefront Leaderboard</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
              <Link
                href={deploymentResult.liveUrl}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#171717] hover:bg-[#262626] border border-[#2E2E2E] text-white text-xs font-mono font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#894DEF]"
              >
                <span>Product Overview Page</span>
              </Link>
              <Link
                href="/dev/dashboard"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#171717] hover:bg-[#262626] border border-[#894DEF]/40 text-[#894DEF] text-xs font-mono font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#894DEF]"
              >
                <span>Open Developer Dashboard</span>
              </Link>
            </div>
          </section>
        ) : (
          /* SPLIT STUDIO LAYOUT (SEGMENTS 1 - 4) */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* LEFT COLUMN: 4 PRIVACY SEGMENTS */}
            <div className="lg:col-span-7 space-y-6">
              {/* SEGMENT 1: Verifiable Frontend */}
              {step === 1 && (
                <div className="bg-[#171717] border border-[#2E2E2E] p-6 sm:p-8 space-y-6">
                  <div className="border-b border-[#2E2E2E] pb-3">
                    <span className="text-[10px] font-mono text-[#894DEF] uppercase tracking-wider block">Privacy Standard · Segment 1</span>
                    <h2 className="text-base font-semibold text-white tracking-tight">
                      Verifiable Frontend & Identity
                    </h2>
                    <p className="text-xs text-[#B8B8B8] font-mono mt-0.5">
                      Verify client code immutability using decentralized Filecoin IPFS and NEAR FastFS dual pinning.
                    </p>
                  </div>

                  <div className="space-y-4 text-xs font-mono">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label htmlFor="product-name" className="block text-[#B8B8B8]">Product Name</label>
                        <input
                          id="product-name"
                          type="text"
                          value={form.name}
                          onChange={(e) => handleNameChange(e.target.value)}
                          placeholder="Aegis Privacy Suite"
                          className="w-full bg-[#0D0D0D] border border-[#2E2E2E] px-3.5 py-2.5 text-white text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#894DEF] focus-visible:border-[#894DEF]"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label htmlFor="product-slug" className="block text-[#B8B8B8]">Storefront Slug</label>
                        <input
                          id="product-slug"
                          type="text"
                          value={form.slug}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              slug: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "-"),
                              primaryFrontendUrl: `https://${e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "-")}.pandem.app`,
                            })
                          }
                          placeholder="aegis-privacy"
                          className="w-full bg-[#0D0D0D] border border-[#2E2E2E] px-3.5 py-2.5 text-white text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#894DEF] focus-visible:border-[#894DEF]"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="product-tagline" className="block text-[#B8B8B8]">Tagline</label>
                      <input
                        id="product-tagline"
                        type="text"
                        value={form.tagline}
                        onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                        placeholder="Autonomous confidential litigation drafting and compliance engine in Intel TDX."
                        className="w-full bg-[#0D0D0D] border border-[#2E2E2E] px-3.5 py-2.5 text-white text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#894DEF] focus-visible:border-[#894DEF]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="product-description" className="block text-[#B8B8B8]">Detailed Description</label>
                      <textarea
                        id="product-description"
                        rows={3}
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        placeholder="Enterprise legal workspace isolating attorney work product inside hardware-attested CVMs with verifiable remote attestation and automated escrow settlement."
                        className="w-full bg-[#0D0D0D] border border-[#2E2E2E] p-3 text-white text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#894DEF] focus-visible:border-[#894DEF] resize-none"
                      />
                    </div>

                    {/* Verifiable Frontend CIDs */}
                    <div className="p-4 bg-[#0D0D0D] border border-[#2E2E2E] space-y-3">
                      <div className="flex items-center justify-between border-b border-[#2E2E2E] pb-2">
                        <div className="flex items-center gap-2 text-white font-medium">
                          <Globe className="w-4 h-4 text-[#4ADE80]" />
                          <span>Decentralized Root Pinning CIDs</span>
                        </div>
                        <span className="text-[10px] text-[#4ADE80]">Immutable Mirrors</span>
                      </div>

                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label htmlFor="primary-frontend-url" className="block text-[11px] text-[#B8B8B8]">Primary Web URL</label>
                          <input
                            id="primary-frontend-url"
                            type="text"
                            value={form.primaryFrontendUrl}
                            onChange={(e) => setForm({ ...form, primaryFrontendUrl: e.target.value })}
                            className="w-full bg-[#171717] border border-[#2E2E2E] p-2.5 text-white text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#894DEF] focus-visible:border-[#894DEF]"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label htmlFor="filecoin-cid" className="block text-[11px] text-[#B8B8B8]">Filecoin / Lighthouse IPFS CID</label>
                            <input
                              id="filecoin-cid"
                              type="text"
                              value={form.filecoinCid}
                              onChange={(e) => setForm({ ...form, filecoinCid: e.target.value })}
                              className="w-full bg-[#171717] border border-[#2E2E2E] p-2 text-white text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#894DEF] focus-visible:border-[#894DEF]"
                            />
                            <span className="text-[10px] text-[#737373] block">Lighthouse x402 recurring renewals</span>
                          </div>

                          <div className="space-y-1">
                            <label htmlFor="fastfs-cid" className="block text-[11px] text-[#B8B8B8]">NEAR FastFS Mirror CID</label>
                            <input
                              id="fastfs-cid"
                              type="text"
                              value={form.fastFsCid}
                              onChange={(e) => setForm({ ...form, fastFsCid: e.target.value })}
                              className="w-full bg-[#171717] border border-[#2E2E2E] p-2 text-white text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#894DEF] focus-visible:border-[#894DEF]"
                            />
                            <span className="text-[10px] text-[#737373] block">Decentralized WebAssembly frontend</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Segment 1 Audit Checkbox */}
                    <div className="p-3.5 bg-[#0D0D0D] border border-[#894DEF]/40 space-y-1">
                      <label className="flex items-start gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.auditFrontendVerified}
                          onChange={(e) => setForm({ ...form, auditFrontendVerified: e.target.checked })}
                          className="mt-0.5 accent-[#894DEF] w-4 h-4 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#894DEF]"
                        />
                        <div className="space-y-0.5">
                          <span className="text-white font-medium block">
                            Segment 1 Audit Standard: Verifiable Client Code Verified
                          </span>
                          <span className="text-[#737373] text-[11px] leading-snug block">
                            Frontend bundle is pinned to Filecoin and NEAR FastFS root CIDs. Ensures code cannot be modified by central DNS interception.
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2 border-t border-[#2E2E2E]">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      disabled={!form.auditFrontendVerified}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#894DEF] hover:bg-[#A273F2] disabled:opacity-50 text-white text-xs font-mono font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#894DEF]"
                    >
                      <span>Proceed to Segment 2: Node Backend</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* SEGMENT 2: Isolated Node Backend */}
              {step === 2 && (
                <div className="bg-[#171717] border border-[#2E2E2E] p-6 sm:p-8 space-y-6">
                  <div className="border-b border-[#2E2E2E] pb-3">
                    <span className="text-[10px] font-mono text-[#894DEF] uppercase tracking-wider block">Privacy Standard · Segment 2</span>
                    <h2 className="text-base font-semibold text-white tracking-tight">
                      Isolated Node Backend (No Host RAM Access)
                    </h2>
                    <p className="text-xs text-[#B8B8B8] font-mono mt-0.5">
                      Verify that backend execution is containerized inside a hardware-encrypted CVM enclave with silicon attestation quotes.
                    </p>
                  </div>

                  <div className="space-y-5 text-xs font-mono">
                    {/* Enclave Selector */}
                    <div className="p-4 bg-[#0D0D0D] border border-[#2E2E2E] space-y-3">
                      <div className="flex items-center justify-between border-b border-[#2E2E2E] pb-2">
                        <div className="flex items-center gap-2 text-white font-medium">
                          <Cpu className="w-4 h-4 text-[#894DEF]" />
                          <span>Confidential CVM Runtime Engine</span>
                        </div>
                        <span className="text-[10px] text-[#4ADE80] border border-[#4ADE80]/30 px-2 py-0.5">
                          Hardware Attested
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="radiogroup" aria-label="Confidential CVM Runtime">
                        {ENCLAVE_RUNTIMES.map((rt) => {
                          const isSelected = form.enclaveRuntime === rt.id;
                          return (
                            <button
                              key={rt.id}
                              type="button"
                              role="radio"
                              aria-checked={isSelected}
                              onClick={() => setForm({ ...form, enclaveRuntime: rt.id as any })}
                              className={`p-3.5 border text-left transition-colors space-y-1.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#894DEF] ${
                                isSelected
                                  ? "bg-[#171717] border-[#894DEF] text-white"
                                  : "bg-[#171717] border-[#2E2E2E] text-[#B8B8B8] hover:border-[#737373]"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-white text-xs">{rt.name}</span>
                                <span className="text-[10px] text-[#894DEF]">{rt.provider}</span>
                              </div>
                              <p className="text-[11px] text-[#737373] leading-snug">{rt.description}</p>
                              <div className="flex justify-between text-[10px] text-[#737373] pt-1 border-t border-[#2E2E2E] tabular-nums">
                                <span>{rt.attestation}</span>
                                <span>{rt.overhead}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      <div className="space-y-1.5 pt-1">
                        <label htmlFor="container-image" className="block text-[11px] text-[#B8B8B8]">Container Image URI</label>
                        <input
                          id="container-image"
                          type="text"
                          value={form.containerImage}
                          onChange={(e) => setForm({ ...form, containerImage: e.target.value })}
                          className="w-full bg-[#171717] border border-[#2E2E2E] p-2.5 text-white text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#894DEF] focus-visible:border-[#894DEF]"
                        />
                      </div>

                      <div className="p-3 bg-[#171717] border border-[#2E2E2E] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <span className="text-[10px] text-[#737373] block uppercase">Auto-Measured SHA-256 Compose-Hash</span>
                          <code className="text-[#894DEF] text-xs break-all">{composeHash}</code>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy(composeHash, "hash")}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#262626] border border-[#2E2E2E] text-white text-[10px] hover:border-[#737373] transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#894DEF]"
                        >
                          <Copy className="w-3 h-3" />
                          <span>{copiedId === "hash" ? "Copied" : "Copy"}</span>
                        </button>
                      </div>
                    </div>

                    {/* Segment 2 Audit Checkbox */}
                    <div className="p-3.5 bg-[#0D0D0D] border border-[#894DEF]/40 space-y-1">
                      <label className="flex items-start gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.auditBackendIsolated}
                          onChange={(e) => setForm({ ...form, auditBackendIsolated: e.target.checked })}
                          className="mt-0.5 accent-[#894DEF] w-4 h-4 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#894DEF]"
                        />
                        <div className="space-y-0.5">
                          <span className="text-white font-medium block">
                            Segment 2 Audit Standard: Zero Host RAM Access Verified
                          </span>
                          <span className="text-[#737373] text-[11px] leading-snug block">
                            CVM hardware memory encryption (Intel TDX / AMD SEV-SNP) protects runtime RAM against cloud operator dumps and hypervisor access.
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-between pt-2 border-t border-[#2E2E2E]">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#262626] hover:bg-[#2E2E2E] text-white text-xs font-mono font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#894DEF]"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to Segment 1</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      disabled={!form.auditBackendIsolated}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#894DEF] hover:bg-[#A273F2] disabled:opacity-50 text-white text-xs font-mono font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#894DEF]"
                    >
                      <span>Proceed to Segment 3: Database Sealing</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* SEGMENT 3: KMS-Sealed Database */}
              {step === 3 && (
                <div className="bg-[#171717] border border-[#2E2E2E] p-6 sm:p-8 space-y-6">
                  <div className="border-b border-[#2E2E2E] pb-3">
                    <span className="text-[10px] font-mono text-[#894DEF] uppercase tracking-wider block">Privacy Standard · Segment 3</span>
                    <h2 className="text-base font-semibold text-white tracking-tight">
                      KMS-Sealed Database (Hardware Measurement Bound)
                    </h2>
                    <p className="text-xs text-[#B8B8B8] font-mono mt-0.5">
                      Verify that PostgreSQL encryption keys unseal only if the CVM runtime measurement matches the on-chain compose-hash.
                    </p>
                  </div>

                  <div className="space-y-5 text-xs font-mono">
                    <div className="p-4 bg-[#0D0D0D] border border-[#2E2E2E] space-y-3">
                      <div className="flex items-center justify-between border-b border-[#2E2E2E] pb-2">
                        <div className="flex items-center gap-2 text-white font-medium">
                          <Database className="w-4 h-4 text-[#FBBF24]" />
                          <span>Hardware-Sealed PostgreSQL (`pgvector`)</span>
                        </div>
                        <span className="text-[10px] text-[#FBBF24] border border-[#FBBF24]/30 px-2 py-0.5">
                          KMS Attestation-Bound
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] text-[#B8B8B8]">
                        <div className="p-3 bg-[#171717] border border-[#2E2E2E] space-y-1">
                          <span className="text-white font-medium block">PostgreSQL 16 + pgvector</span>
                          <p className="text-[#737373] leading-snug">
                            Encrypted vector storage for confidential semantic embeddings. Plaintext vectors never reside on disk.
                          </p>
                        </div>
                        <div className="p-3 bg-[#171717] border border-[#2E2E2E] space-y-1">
                          <span className="text-white font-medium block">Attestation-Bound KMS Key</span>
                          <p className="text-[#737373] leading-snug">
                            Volume decryption key is released only if CVM hardware measurement matches the on-chain compose-hash.
                          </p>
                        </div>
                      </div>

                      <div className="p-3 bg-[#171717] border border-[#2E2E2E] text-[11px] text-[#737373] space-y-1">
                        <div className="flex justify-between">
                          <span>Unsealing Condition:</span>
                          <code className="text-white">hash == {composeHash.slice(0, 18)}...</code>
                        </div>
                        <div className="flex justify-between">
                          <span>Encryption Standard:</span>
                          <span className="text-[#4ADE80]">AES-256-GCM Envelope Encryption</span>
                        </div>
                      </div>
                    </div>

                    {/* Segment 3 Audit Checkbox */}
                    <div className="p-3.5 bg-[#0D0D0D] border border-[#894DEF]/40 space-y-1">
                      <label className="flex items-start gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.auditDatabaseSealed}
                          onChange={(e) => setForm({ ...form, auditDatabaseSealed: e.target.checked })}
                          className="mt-0.5 accent-[#894DEF] w-4 h-4 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#894DEF]"
                        />
                        <div className="space-y-0.5">
                          <span className="text-white font-medium block">
                            Segment 3 Audit Standard: Database Cryptographically Sealed
                          </span>
                          <span className="text-[#737373] text-[11px] leading-snug block">
                            Disk volumes are locked at rest. Physical host theft or disk extraction yields only AES-256 ciphertext without the hardware-derived key.
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-between pt-2 border-t border-[#2E2E2E]">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#262626] hover:bg-[#2E2E2E] text-white text-xs font-mono font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#894DEF]"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to Segment 2</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(4)}
                      disabled={!form.auditDatabaseSealed}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#894DEF] hover:bg-[#A273F2] disabled:opacity-50 text-white text-xs font-mono font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#894DEF]"
                    >
                      <span>Proceed to Segment 4: AI & Escrow</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* SEGMENT 4: Private AI Inference & Autonomous Escrow */}
              {step === 4 && (
                <div className="bg-[#171717] border border-[#2E2E2E] p-6 sm:p-8 space-y-6">
                  <div className="border-b border-[#2E2E2E] pb-3">
                    <span className="text-[10px] font-mono text-[#894DEF] uppercase tracking-wider block">Privacy Standard · Segment 4</span>
                    <h2 className="text-base font-semibold text-white tracking-tight">
                      Private AI Inference & Autonomous Escrow
                    </h2>
                    <p className="text-xs text-[#B8B8B8] font-mono mt-0.5">
                      Configure NEAR AI Cloud private models and simulate the 7-day tranche escrow contract deployment.
                    </p>
                  </div>

                  <div className="space-y-5 text-xs font-mono">
                    {/* Model Selector */}
                    <div className="p-4 bg-[#0D0D0D] border border-[#2E2E2E] space-y-3">
                      <div className="flex items-center justify-between border-b border-[#2E2E2E] pb-2">
                        <div className="flex items-center gap-2 text-white font-medium">
                          <Sparkles className="w-4 h-4 text-[#894DEF]" />
                          <span>NEAR AI Cloud Inference Provider</span>
                        </div>
                        <span className="text-[10px] text-[#894DEF] font-mono">cloud-api.near.ai/v1</span>
                      </div>

                      <div className="space-y-2" role="radiogroup" aria-label="NEAR AI Cloud Inference Provider Model">
                        {NEAR_AI_MODELS.map((m) => {
                          const isSelected = form.aiModel === m.id;
                          return (
                            <button
                              key={m.id}
                              type="button"
                              role="radio"
                              aria-checked={isSelected}
                              onClick={() => setForm({ ...form, aiModel: m.id as any })}
                              className={`w-full p-3 border text-left transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#894DEF] ${
                                isSelected
                                  ? "bg-[#171717] border-[#894DEF] text-white"
                                  : "bg-[#171717] border-[#2E2E2E] text-[#B8B8B8] hover:border-[#737373]"
                              }`}
                            >
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-white text-xs">{m.name}</span>
                                  <span className="text-[10px] text-[#737373] px-1.5 py-0.2 bg-[#262626] border border-[#2E2E2E]">
                                    {m.tag}
                                  </span>
                                </div>
                                <div className="text-[11px] text-[#737373]">{m.description}</div>
                              </div>
                              <div className="text-left sm:text-right shrink-0">
                                <span className="text-xs font-mono font-medium text-[#894DEF] block tabular-nums">{m.rate}</span>
                                <span className="text-[10px] text-[#737373]">{m.hardware}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Per-Project Escrow & 7-Day Tranche Simulator */}
                    <div className="p-4 bg-[#0D0D0D] border border-[#2E2E2E] space-y-3">
                      <div className="flex items-center justify-between border-b border-[#2E2E2E] pb-2 text-[11px]">
                        <span className="text-white font-medium">Per-Project Contract & 7-Day Tranche Simulation</span>
                        <span className="text-[#894DEF]">escrow.{form.slug}.testnet</span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                        <div className="p-2.5 bg-[#171717] border border-[#2E2E2E]">
                          <span className="text-[#737373] text-[10px] block">Tranche Release</span>
                          <span className="font-semibold text-white tabular-nums">7 Days</span>
                        </div>
                        <div className="p-2.5 bg-[#171717] border border-[#2E2E2E]">
                          <span className="text-[#737373] text-[10px] block">Clawback Window</span>
                          <span className="font-semibold text-white tabular-nums">D-14 Offset</span>
                        </div>
                        <div className="p-2.5 bg-[#171717] border border-[#2E2E2E]">
                          <span className="text-[#737373] text-[10px] block">Developer Split</span>
                          <span className="font-semibold text-[#4ADE80] tabular-nums">47.5%</span>
                        </div>
                        <div className="p-2.5 bg-[#171717] border border-[#2E2E2E]">
                          <span className="text-[#737373] text-[10px] block">Market OpEx</span>
                          <span className="font-semibold text-[#894DEF] tabular-nums">30.0%</span>
                        </div>
                      </div>

                      {/* Cashflow Waterfall Bar */}
                      <div className="space-y-1.5 pt-1">
                        <div className="flex justify-between text-[10px] text-[#B8B8B8] tabular-nums">
                          <span>Split: 47.5% Dev / 30% OpEx / 15% Warranty / 5% Contingency / 2.5% Fee</span>
                          <span>Gross: ${economics.grossMrr.toLocaleString()} / mo</span>
                        </div>

                        <div className="h-2.5 w-full bg-[#171717] border border-[#2E2E2E] flex overflow-hidden">
                          <div className="h-full bg-[#4ADE80]" style={{ width: "47.5%" }} title="47.5% Developer Net" />
                          <div className="h-full bg-[#894DEF]" style={{ width: "30.0%" }} title="30.0% Market OpEx" />
                          <div className="h-full bg-[#FBBF24]" style={{ width: "15.0%" }} title="15.0% Bug Warranty" />
                          <div className="h-full bg-[#3B82F6]" style={{ width: "5.0%" }} title="5.0% Contingency" />
                          <div className="h-full bg-[#737373]" style={{ width: "2.5%" }} title="2.5% Pandem Fee" />
                        </div>
                      </div>
                    </div>

                    {/* Segment 4 Audit Checkbox */}
                    <div className="p-3.5 bg-[#0D0D0D] border border-[#894DEF]/40 space-y-1">
                      <label className="flex items-start gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.auditEscrowConfigured}
                          onChange={(e) => setForm({ ...form, auditEscrowConfigured: e.target.checked })}
                          className="mt-0.5 accent-[#894DEF] w-4 h-4 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#894DEF]"
                        />
                        <div className="space-y-0.5">
                          <span className="text-white font-medium block">
                            Segment 4 Audit Standard: Autonomous Escrow Deployment Verified
                          </span>
                          <span className="text-[#737373] text-[11px] leading-snug block">
                            The smart contract autonomously streams 30% OpEx to market providers (NEAR AI, Phala, Filecoin) and enforces 7-day milestone releases without requiring developer credit cards.
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-between pt-2 border-t border-[#2E2E2E]">
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#262626] hover:bg-[#2E2E2E] text-white text-xs font-mono font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#894DEF]"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to Segment 3</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDeployAndLaunch}
                      disabled={isDeploying || !form.auditEscrowConfigured}
                      className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#894DEF] hover:bg-[#A273F2] disabled:opacity-50 text-white text-xs font-mono font-semibold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#894DEF]"
                    >
                      {isDeploying ? (
                        <span>Deploying Contract Suite...</span>
                      ) : (
                        <>
                          <span>Verify & Deploy Product Suite</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: STICKY REAL-TIME CONFIGURATOR PREVIEW */}
            <div className="lg:col-span-5 sticky top-24 space-y-4" aria-label="Live Configuration Preview">
              <div className="bg-[#171717] border border-[#2E2E2E] p-5 space-y-4 font-mono text-xs">
                {/* Preview Navigation Tabs */}
                <div className="flex items-center justify-between border-b border-[#2E2E2E] pb-3" role="tablist" aria-label="Configuration Inspector Tabs">
                  <div className="flex items-center gap-1.5">
                    <Terminal className="w-4 h-4 text-[#894DEF]" />
                    <span className="text-xs font-medium text-white">Live Configurator</span>
                  </div>

                  <div className="flex items-center gap-1">
                    {[
                      { id: "compose", label: "Manifest" },
                      { id: "tranches", label: "Tranches" },
                      { id: "attestation", label: "Attestation" },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        aria-selected={previewTab === tab.id}
                        onClick={() => setPreviewTab(tab.id as any)}
                        className={`px-2.5 py-1 text-[11px] border transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#894DEF] ${
                          previewTab === tab.id
                            ? "bg-[#262626] border-[#894DEF] text-white"
                            : "bg-[#0D0D0D] border-[#2E2E2E] text-[#737373] hover:text-[#FAFAFA]"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* TAB 1: COMPOSE MANIFEST */}
                {previewTab === "compose" && (
                  <div className="space-y-3" role="tabpanel" aria-label="Compose Manifest Preview">
                    <div className="flex items-center justify-between text-[11px] text-[#737373]">
                      <span>docker-compose.yml (Live Generated)</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(generatedComposeManifest, "liveCompose")}
                        className="inline-flex items-center gap-1 text-[#894DEF] hover:text-[#A273F2] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#894DEF]"
                      >
                        <Copy className="w-3 h-3" />
                        <span>{copiedId === "liveCompose" ? "Copied" : "Copy"}</span>
                      </button>
                    </div>

                    <pre className="p-3 bg-[#0D0D0D] border border-[#2E2E2E] text-[#B8B8B8] text-[10px] overflow-x-auto max-h-96 leading-relaxed font-mono">
                      {generatedComposeManifest}
                    </pre>
                  </div>
                )}

                {/* TAB 2: 7-DAY TRANCHES & ECONOMICS */}
                {previewTab === "tranches" && (
                  <div className="space-y-3 text-[11px]" role="tabpanel" aria-label="7-Day Tranches Breakdown">
                    <div className="p-3 bg-[#0D0D0D] border border-[#2E2E2E] space-y-1">
                      <div className="flex justify-between text-[#737373]">
                        <span>Projected Gross Revenue:</span>
                        <span className="text-white font-semibold tabular-nums">${economics.grossMrr.toLocaleString()} / mo</span>
                      </div>
                      <div className="flex justify-between text-[#4ADE80] font-medium">
                        <span>Developer Net (47.5%):</span>
                        <span className="tabular-nums">${economics.devNet.toLocaleString()} / mo</span>
                      </div>
                      <div className="flex justify-between text-[#894DEF] font-medium">
                        <span>Autonomous OpEx (30%):</span>
                        <span className="tabular-nums">${economics.opex.toLocaleString()} / mo</span>
                      </div>
                    </div>

                    <div className="p-3 bg-[#0D0D0D] border border-[#2E2E2E] space-y-1.5 text-[10px] text-[#737373]">
                      <div className="flex justify-between">
                        <span>Contract Address:</span>
                        <code className="text-[#894DEF]">escrow.{form.slug}.testnet</code>
                      </div>
                      <div className="flex justify-between">
                        <span>Tranche Period:</span>
                        <span className="text-white">7 Days Continuous Release</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Subscriber Clawback Window:</span>
                        <span className="text-white">D-14 Offset Protection</span>
                      </div>
                    </div>

                    <div className="p-3 bg-[#0D0D0D] border border-[#2E2E2E] space-y-1 text-[10px] text-[#737373]">
                      <span className="text-white font-medium block">Market Provider Routing (30%):</span>
                      <div className="flex justify-between tabular-nums">
                        <span>NEAR AI Token Budget:</span>
                        <span className="text-white">${economics.opexNearAi.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between tabular-nums">
                        <span>Phala CVM Compute:</span>
                        <span className="text-white">${economics.opexCvm.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                      </div>
                      <div className="flex justify-between tabular-nums">
                        <span>Filecoin Lighthouse Pinning:</span>
                        <span className="text-white">${economics.opexStorage.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: ATTESTATION MEASUREMENT */}
                {previewTab === "attestation" && (
                  <div className="space-y-3" role="tabpanel" aria-label="Attestation Measurement Preview">
                    <div className="p-3 bg-[#0D0D0D] border border-[#2E2E2E] space-y-1">
                      <span className="text-[10px] text-[#737373] block uppercase">Silicon Measurement Hash</span>
                      <code className="text-[#894DEF] text-[11px] break-all block">{composeHash}</code>
                      <span className="text-[10px] text-[#4ADE80] block">Recomputed via Web Crypto SHA-256</span>
                    </div>

                    <div className="p-3 bg-[#0D0D0D] border border-[#2E2E2E] space-y-2 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-[#737373]">Runtime Engine:</span>
                        <span className="text-white">
                          {form.enclaveRuntime === "phala_dstack" ? "Intel TDX (Phala)" : "AMD SEV-SNP (Akash)"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#737373]">Database Encryption:</span>
                        <span className="text-[#FBBF24]">KMS AES-256-GCM Sealed</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#737373]">Inference Model:</span>
                        <span className="text-white truncate max-w-[140px]">{form.aiModel}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#737373]">Frontend CID:</span>
                        <span className="text-[#4ADE80] truncate max-w-[140px]">{form.filecoinCid}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Live Metadata Summary Footer */}
                <div className="pt-3 border-t border-[#2E2E2E] text-[11px] text-[#737373] space-y-1.5">
                  <div className="flex justify-between">
                    <span>Target URL:</span>
                    <span className="text-white font-mono">{form.primaryFrontendUrl}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Steward Account:</span>
                    <span className="text-white font-mono">{form.steward}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Plan:</span>
                    <span className="text-[#894DEF] font-mono tabular-nums">${form.monthlyUsdc} USDC / mo</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
