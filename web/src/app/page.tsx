"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ProductHuntLeaderboard } from "../components/ProductHuntLeaderboard";
import { ProductDetailModal } from "../components/ProductDetailModal";
import { SubscribeModal } from "../components/SubscribeModal";
import { CatalogItem } from "@pandem/shared";
import catalogData from "../../../shared/catalog.json";
import { useNearWallet } from "../context/NearWalletContext";
import {
  Shield,
  Cpu,
  Database,
  Lock,
  Server,
  Check,
  X,
  AlertTriangle,
  Search,
  Activity,
  Layers,
  Terminal,
  ExternalLink,
  ChevronRight,
  UserCheck,
  Code2,
} from "lucide-react";

export default function Home() {
  const router = useRouter();
  const { accountId, isConnected, connect } = useNearWallet();
  const [detailProduct, setDetailProduct] = useState<CatalogItem | null>(null);
  const [subscribeProduct, setSubscribeProduct] = useState<CatalogItem | null>(null);
  const [catalog, setCatalog] = useState<CatalogItem[]>(() => catalogData as unknown as CatalogItem[]);
  const [searchQuery, setSearchQuery] = useState("");
  const [monthlySimAmount, setMonthlySimAmount] = useState<number>(50);
  const [inspectorTab, setInspectorTab] = useState<"allocation" | "telemetry" | "settlement">("allocation");

  // Dynamic catalog fetch from API
  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const mapped: CatalogItem[] = data.map((item: any, idx: number) => {
            const monthlyPrice = item.tiers?.[0]?.price_monthly
              ? `$${(Number(item.tiers[0].price_monthly) / 1000000).toFixed(0)}/mo`
              : item.price_display || "$5.00/mo";
            return {
              id: String(item.id || item.slug || idx + 1),
              name: item.name,
              tagline: item.tagline,
              description: item.description,
              price_per_period: item.price_per_period || item.tiers?.[0]?.price_monthly || "5000000",
              price_display: monthlyPrice,
              period_seconds: item.period_seconds || 2592000,
              period_display: item.period_display || "30 days",
              grace_seconds: item.grace_seconds || 604800,
              grace_display: item.grace_display || "7 days",
              category: item.category || "Confidential AI",
              status: item.status || "Active",
              features: item.features || ["Intel TDX Hardware Enclave", "Confidential Intent Settlement", "KMS-Sealed DB"],
              upvotes: typeof item.upvotes === "number" ? item.upvotes : 100,
              rank: item.rank || idx + 1,
              isProductOfTheDay: idx === 0,
              steward: item.steward || item.developer?.steward_address || "developer.testnet",
              teeHardware: item.tee_hardware || item.teeHardware || "Intel TDX Enclave",
              teeModel: item.tee_model || item.teeModel || "DeepSeek V3 (671B)",
            };
          });
          setCatalog(mapped);
        }
      })
      .catch((err) => console.warn("Dynamic catalog load failed:", err));
  }, []);

  const handleSelectProduct = (product: CatalogItem) => {
    setDetailProduct(product);
  };

  const handleLaunchSubscribe = (product: CatalogItem, periods: number) => {
    setDetailProduct(null);
    setSubscribeProduct(product);
  };

  const handleUserPathway = () => {
    if (isConnected) {
      router.push("/dashboard");
    } else {
      const el = document.getElementById("storefront");
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  const handleDeveloperPathway = () => {
    if (isConnected) {
      router.push("/dev/dashboard");
    } else {
      router.push("/dev/onboarding");
    }
  };

  const filteredCatalog = useMemo(() => {
    if (!searchQuery.trim()) return catalog;
    const q = searchQuery.toLowerCase();
    return catalog.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.tagline.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }, [catalog, searchQuery]);

  // Escrow split calculation
  const devShare = (monthlySimAmount * 0.475).toFixed(2);
  const opexShare = (monthlySimAmount * 0.30).toFixed(2);
  const shieldShare = (monthlySimAmount * 0.20).toFixed(2);
  const protocolShare = (monthlySimAmount * 0.025).toFixed(2);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-24 bg-[#0D0D0D] text-[#FAFAFA] font-sans">
      {/* 1. Hero & Persona Launchpad Section */}
      <section className="space-y-8 pt-4">
        {/* Connected Account Banner */}
        {isConnected && accountId && (
          <div className="p-3 bg-[#141414] border border-[#222222] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-[#8A8A8A]">
              <span className="w-2 h-2 bg-[#22C55E]" aria-hidden="true" />
              <span>Signed in as</span>
              <span className="font-mono text-[#FAFAFA] font-medium">{accountId}</span>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="text-[#894DEF] hover:text-[#A273F2] font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#894DEF]"
              >
                Subscriber Dashboard
              </Link>
              <span className="text-[#333333]">|</span>
              <Link
                href="/dev/dashboard"
                className="text-[#FAFAFA] hover:text-[#894DEF] font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#894DEF]"
              >
                Developer Console
              </Link>
            </div>
          </div>
        )}

        {/* Hero Title & Description */}
        <div className="max-w-3xl space-y-4">
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-[#FAFAFA] [text-wrap:balance] leading-[1.08]">
            The launchpad for confidential software on NEAR
          </h1>

          <p className="text-base sm:text-lg text-[#8A8A8A] leading-relaxed max-w-2xl">
            Build, host, and monetize applications where code, databases, and AI inference execute inside verified hardware enclaves. Subscriptions lock in native escrow and release on verified heartbeats.
          </p>
        </div>

        {/* Persona Pathway Selector Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
          {/* Persona 1: Subscriber */}
          <div className="p-6 bg-[#121212] border border-[#222222] flex flex-col justify-between space-y-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium tracking-wide uppercase text-[#8A8A8A] bg-[#161616] px-2.5 py-1 border border-[#222222]">
                  Subscriber Access
                </span>
                <Shield className="w-4 h-4 text-[#894DEF]" aria-hidden="true" />
              </div>
              <h2 className="text-xl font-bold text-[#FAFAFA]">
                Browse Private Software
              </h2>
              <p className="text-xs text-[#8A8A8A] leading-relaxed">
                Subscribe to zero-knowledge AI models, confidential document vaults, and private developer tooling. Your prompts never train models, queries are never retained, and subscriptions are protected in native escrow.
              </p>
              <div className="flex flex-wrap gap-2 pt-1 text-[11px] text-[#737373]">
                <span className="bg-[#161616] px-2 py-0.5 border border-[#222222]">Zero Prompt Retention</span>
                <span className="bg-[#161616] px-2 py-0.5 border border-[#222222]">Intel TDX Attested</span>
                <span className="bg-[#161616] px-2 py-0.5 border border-[#222222]">7-Day Refund Guarantee</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2 border-t border-[#1C1C1C]">
              <button
                type="button"
                onClick={handleUserPathway}
                className="bg-[#894DEF] hover:bg-[#7839DF] text-white px-5 py-2.5 text-xs sm:text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#894DEF]"
              >
                {isConnected ? "Go to Subscriber Dashboard" : "Browse Directory"}
              </button>
              <a
                href="#storefront"
                className="text-xs text-[#8A8A8A] hover:text-[#FAFAFA] font-medium px-3 py-2 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#894DEF]"
              >
                View Catalog
              </a>
            </div>
          </div>

          {/* Persona 2: Developer */}
          <div className="p-6 bg-[#121212] border border-[#222222] flex flex-col justify-between space-y-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium tracking-wide uppercase text-[#8A8A8A] bg-[#161616] px-2.5 py-1 border border-[#222222]">
                  Developer Studio
                </span>
                <Cpu className="w-4 h-4 text-[#C084FC]" aria-hidden="true" />
              </div>
              <h2 className="text-xl font-bold text-[#FAFAFA]">
                Launch a Confidential App
              </h2>
              <p className="text-xs text-[#8A8A8A] leading-relaxed">
                Deploy your full stack into Intel TDX enclaves with turn-key NEAR AI Cloud private inference, KMS-sealed storage, and Filecoin frontend backups. Every product gets an autonomous escrow contract with 7-day payouts.
              </p>
              <div className="flex flex-wrap gap-2 pt-1 text-[11px] text-[#737373]">
                <span className="bg-[#161616] px-2 py-0.5 border border-[#222222]">NEAR AI Cloud H100</span>
                <span className="bg-[#161616] px-2 py-0.5 border border-[#222222]">KMS-Sealed Storage</span>
                <span className="bg-[#161616] px-2 py-0.5 border border-[#222222]">7-Day Payout Streams</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2 border-t border-[#1C1C1C]">
              <button
                type="button"
                onClick={handleDeveloperPathway}
                className="bg-[#141414] hover:bg-[#181818] text-[#FAFAFA] border border-[#222222] hover:border-[#333333] px-5 py-2.5 text-xs sm:text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#894DEF]"
              >
                {isConnected ? "Open Developer Console" : "Launch a Product"}
              </button>
              <Link
                href="/dev/onboarding"
                className="text-xs text-[#8A8A8A] hover:text-[#FAFAFA] font-medium px-3 py-2 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#894DEF]"
              >
                Developer Onboarding
              </Link>
            </div>
          </div>
        </div>

        {/* Hero Centerpiece: Contract & Enclave Inspector */}
        <div className="border border-[#222222] bg-[#121212]">
          {/* Header Bar */}
          <div className="px-5 py-3.5 bg-[#141414] border-b border-[#222222] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-xs">
              <span className="w-2 h-2 bg-[#22C55E]" aria-hidden="true" />
              <span className="font-mono text-[#FAFAFA] font-medium">escrow.aegis-legal.testnet</span>
              <span className="text-[#525252]">|</span>
              <span className="text-[#8A8A8A]">Active Escrow Contract</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setInspectorTab("allocation")}
                className={`px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#894DEF] ${
                  inspectorTab === "allocation"
                    ? "bg-[#1E1E1E] text-[#FAFAFA]"
                    : "text-[#737373] hover:text-[#FAFAFA]"
                }`}
              >
                Revenue Allocation
              </button>

              <button
                type="button"
                onClick={() => setInspectorTab("telemetry")}
                className={`px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#894DEF] ${
                  inspectorTab === "telemetry"
                    ? "bg-[#1E1E1E] text-[#FAFAFA]"
                    : "text-[#737373] hover:text-[#FAFAFA]"
                }`}
              >
                Hardware Attestation
              </button>

              <button
                type="button"
                onClick={() => setInspectorTab("settlement")}
                className={`px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#894DEF] ${
                  inspectorTab === "settlement"
                    ? "bg-[#1E1E1E] text-[#FAFAFA]"
                    : "text-[#737373] hover:text-[#FAFAFA]"
                }`}
              >
                Settlement Routing
              </button>
            </div>
          </div>

          {/* Inspector Body */}
          <div className="p-6 sm:p-8">
            {inspectorTab === "allocation" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#222222]">
                  <div>
                    <h3 className="text-sm font-semibold text-[#FAFAFA]">
                      Autonomous Split & Compute Outflow
                    </h3>
                    <p className="text-xs text-[#8A8A8A] mt-0.5">
                      Payments distribute automatically on release without developer custody.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[#8A8A8A]">Monthly Fee:</span>
                    <span className="font-mono text-sm font-semibold text-[#FAFAFA] tabular-nums">
                      ${monthlySimAmount} USDC
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <input
                    type="range"
                    min={10}
                    max={200}
                    step={5}
                    value={monthlySimAmount}
                    onChange={(e) => setMonthlySimAmount(Number(e.target.value))}
                    className="w-full accent-[#894DEF] bg-[#222222] h-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#894DEF]"
                    aria-label="Simulated Monthly Fee"
                  />
                  <div className="flex justify-between text-[11px] text-[#525252] font-mono tabular-nums">
                    <span>$10</span>
                    <span>$100</span>
                    <span>$200</span>
                  </div>
                </div>

                {/* 4 Payout Columns */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                  <div className="p-4 bg-[#161616] border border-[#222222] space-y-1">
                    <div className="text-[11px] text-[#737373]">Developer Share (47.5%)</div>
                    <div className="font-mono text-lg font-bold text-[#FAFAFA] tabular-nums">${devShare}</div>
                    <div className="text-xs text-[#8A8A8A] pt-1">Held in 7-day rolling timelock</div>
                  </div>

                  <div className="p-4 bg-[#161616] border border-[#222222] space-y-1">
                    <div className="text-[11px] text-[#C084FC]">Autonomous OpEx (30.0%)</div>
                    <div className="font-mono text-lg font-bold text-[#C084FC] tabular-nums">${opexShare}</div>
                    <div className="text-xs text-[#8A8A8A] pt-1">Direct stream to H100 & CVM</div>
                  </div>

                  <div className="p-4 bg-[#161616] border border-[#222222] space-y-1">
                    <div className="text-[11px] text-[#22C55E]">Contingency Reserve (20.0%)</div>
                    <div className="font-mono text-lg font-bold text-[#22C55E] tabular-nums">${shieldShare}</div>
                    <div className="text-xs text-[#8A8A8A] pt-1">Automated refund guarantee pool</div>
                  </div>

                  <div className="p-4 bg-[#161616] border border-[#222222] space-y-1">
                    <div className="text-[11px] text-[#737373]">Protocol Reserve (2.5%)</div>
                    <div className="font-mono text-lg font-bold text-[#737373] tabular-nums">${protocolShare}</div>
                    <div className="text-xs text-[#8A8A8A] pt-1">Contract state maintenance</div>
                  </div>
                </div>

                {/* Provider Outflow Status */}
                <div className="p-4 bg-[#141414] border border-[#222222] flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                  <span className="font-medium text-[#FAFAFA]">Direct Infrastructure Outflow:</span>
                  <div className="flex flex-wrap items-center gap-4 text-[#8A8A8A]">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-[#22C55E]" aria-hidden="true" />
                      <span>cloud-api.near.ai (H100)</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-[#22C55E]" aria-hidden="true" />
                      <span>dstack.phala.network (TDX CVM)</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-[#22C55E]" aria-hidden="true" />
                      <span>lighthouse.storage (Filecoin x402)</span>
                    </span>
                  </div>
                </div>
              </div>
            )}

            {inspectorTab === "telemetry" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#222222]">
                  <h3 className="text-sm font-semibold text-[#FAFAFA]">
                    Hardware Measurement & Quote Verification
                  </h3>
                  <span className="text-xs text-[#22C55E] flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Quote Verified Active</span>
                  </span>
                </div>

                <div className="bg-[#0A0A0A] p-4 font-mono text-xs space-y-2 overflow-x-auto border border-[#222222]">
                  <div className="text-[#525252]">// Intel TDX Quote v4 Telemetry</div>
                  <div><span className="text-[#894DEF]">hardware_cpu:</span> <span className="text-[#FAFAFA]">&quot;Intel Xeon Platinum 8488C (TDX Enabled)&quot;</span></div>
                  <div><span className="text-[#894DEF]">hardware_gpu:</span> <span className="text-[#FAFAFA]">&quot;NVIDIA H100 SXM5 80GB (Confidential Compute Mode)&quot;</span></div>
                  <div><span className="text-[#894DEF]">mr_enclave:</span>   <span className="text-[#FAFAFA]">&quot;0x9f83ea0182470fbe76a0c0e74f826315&quot;</span></div>
                  <div><span className="text-[#894DEF]">mr_signer:</span>    <span className="text-[#FAFAFA]">&quot;0x44c8d371109a471b0294b30171a81230&quot;</span></div>
                  <div><span className="text-[#894DEF]">attestation:</span>  <span className="text-[#22C55E]">&quot;Signature Validated by Intel PCS and NVIDIA NRAS&quot;</span></div>
                  <div><span className="text-[#894DEF]">host_access:</span>  <span className="text-[#22C55E]">&quot;Hypervisor Ring -1 Memory Inspection Prohibited&quot;</span></div>
                </div>

                <p className="text-xs text-[#8A8A8A] leading-relaxed">
                  Memory encryption keys are generated directly by the processor on boot. Cloud host operators and system administrators cannot inspect enclave RAM, extract encryption keys, or read customer session state.
                </p>
              </div>
            )}

            {inspectorTab === "settlement" && (
              <div className="space-y-4">
                <div className="pb-3 border-b border-[#222222]">
                  <h3 className="text-sm font-semibold text-[#FAFAFA]">
                    Confidential Intent Settlement
                  </h3>
                  <p className="text-xs text-[#8A8A8A] mt-0.5">
                    Zero-knowledge balance routing protects subscriber identity.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-[#161616] border border-[#222222] space-y-2">
                    <div className="text-xs font-semibold text-[#FAFAFA]">Shielded Intent Shard</div>
                    <p className="text-xs text-[#8A8A8A] leading-relaxed">
                      Transfers settle on NEAR Confidential Intents private shards. Token balances and transfer amounts remain concealed from public block explorers.
                    </p>
                  </div>

                  <div className="p-4 bg-[#161616] border border-[#222222] space-y-2">
                    <div className="text-xs font-semibold text-[#FAFAFA]">Blind Commitment Storage</div>
                    <p className="text-xs text-[#8A8A8A] leading-relaxed">
                      The escrow contract stores <code className="font-mono text-[#FAFAFA]">sha256(secret + product_id)</code>. Account names are never associated with purchased tools.
                    </p>
                  </div>

                  <div className="p-4 bg-[#161616] border border-[#222222] space-y-2">
                    <div className="text-xs font-semibold text-[#FAFAFA]">Remote-Attested Login</div>
                    <p className="text-xs text-[#8A8A8A] leading-relaxed">
                      Your client proves ownership of the local secret directly to the Intel TDX enclave via RA-TLS, establishing a session without exposing your wallet.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 2. Architecture & Security Matrix */}
      <section className="space-y-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-[#FAFAFA] tracking-tight">
            Architecture and Security Matrix
          </h2>
          <p className="text-xs sm:text-sm text-[#8A8A8A]">
            Technical verification across five architectural layers.
          </p>
        </div>

        <div className="overflow-x-auto border border-[#222222] bg-[#121212]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#161616] text-[#FAFAFA] border-b border-[#222222]">
              <tr>
                <th className="py-3.5 px-4 font-semibold text-[#8A8A8A]">Stack Layer</th>
                <th className="py-3.5 px-4 font-semibold text-[#737373]">Traditional SaaS</th>
                <th className="py-3.5 px-4 font-semibold text-[#737373]">Unsealed Crypto VPS</th>
                <th className="py-3.5 px-4 font-semibold text-[#C084FC] bg-[#181818]">Pandem Enclave</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222222] text-[#8A8A8A]">
              <tr className="hover:bg-[#161616] transition-colors">
                <td className="py-3.5 px-4 font-medium text-[#FAFAFA]">LLM Inference</td>
                <td className="py-3.5 px-4 text-[#EF4444] flex items-center gap-1.5">
                  <X className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>Plaintext API logs & retention</span>
                </td>
                <td className="py-3.5 px-4 text-[#EAB308]">
                  <span className="flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>Stateless API only</span>
                  </span>
                </td>
                <td className="py-3.5 px-4 font-medium text-[#FAFAFA] bg-[#181818]">
                  <span className="text-[#22C55E] flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>NEAR AI Cloud H100 TEE</span>
                  </span>
                </td>
              </tr>

              <tr className="hover:bg-[#161616] transition-colors">
                <td className="py-3.5 px-4 font-medium text-[#FAFAFA]">Agent Runtime</td>
                <td className="py-3.5 px-4 text-[#EF4444] flex items-center gap-1.5">
                  <X className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>Plaintext cloud RAM dumps</span>
                </td>
                <td className="py-3.5 px-4 text-[#EAB308]">
                  <span className="flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>Exposed in founder memory</span>
                  </span>
                </td>
                <td className="py-3.5 px-4 font-medium text-[#FAFAFA] bg-[#181818]">
                  <span className="text-[#22C55E] flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>Intel TDX Enclave CVM</span>
                  </span>
                </td>
              </tr>

              <tr className="hover:bg-[#161616] transition-colors">
                <td className="py-3.5 px-4 font-medium text-[#FAFAFA]">User Database</td>
                <td className="py-3.5 px-4 text-[#EF4444] flex items-center gap-1.5">
                  <X className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>Datacenter operators can dump DB</span>
                </td>
                <td className="py-3.5 px-4 text-[#EAB308]">
                  <span className="flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>Unencrypted disk storage</span>
                  </span>
                </td>
                <td className="py-3.5 px-4 font-medium text-[#FAFAFA] bg-[#181818]">
                  <span className="text-[#22C55E] flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>KMS-Sealed Enclave PostgreSQL</span>
                  </span>
                </td>
              </tr>

              <tr className="hover:bg-[#161616] transition-colors">
                <td className="py-3.5 px-4 font-medium text-[#FAFAFA]">Frontend Hosting</td>
                <td className="py-3.5 px-4 text-[#EF4444] flex items-center gap-1.5">
                  <X className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>Mutable centralized DNS</span>
                </td>
                <td className="py-3.5 px-4 text-[#EAB308]">
                  <span className="flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>Single server IP address</span>
                  </span>
                </td>
                <td className="py-3.5 px-4 font-medium text-[#FAFAFA] bg-[#181818]">
                  <span className="text-[#22C55E] flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>Filecoin + FastFS Pinning</span>
                  </span>
                </td>
              </tr>

              <tr className="hover:bg-[#161616] transition-colors">
                <td className="py-3.5 px-4 font-medium text-[#FAFAFA]">Payment Trail</td>
                <td className="py-3.5 px-4 text-[#EF4444] flex items-center gap-1.5">
                  <X className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>Credit card identity tracked</span>
                </td>
                <td className="py-3.5 px-4 text-[#EAB308]">
                  <span className="flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>Public block explorer history</span>
                  </span>
                </td>
                <td className="py-3.5 px-4 font-medium text-[#FAFAFA] bg-[#181818]">
                  <span className="text-[#22C55E] flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>NEAR Confidential Intents</span>
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 3. Live Storefront Directory */}
      <section id="storefront" className="space-y-6 pt-4 border-t border-[#222222] scroll-mt-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#222222]">
          <div>
            <h2 className="text-2xl font-bold text-[#FAFAFA] tracking-tight">
              Storefront Directory
            </h2>
            <p className="text-xs text-[#8A8A8A] mt-0.5">
              Verified services running inside hardware enclaves with on-chain subscription escrow.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#737373] absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
              <input
                type="text"
                placeholder="Search services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-[#141414] border border-[#222222] focus:border-[#894DEF] text-xs text-[#FAFAFA] placeholder-[#525252] outline-none w-48 sm:w-60 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#894DEF]"
                aria-label="Search services"
              />
            </div>

            <span className="text-xs text-[#737373] font-mono tabular-nums whitespace-nowrap">
              {filteredCatalog.length} Enclaves Active
            </span>
          </div>
        </div>

        <ProductHuntLeaderboard
          products={filteredCatalog}
          onSelectProduct={handleSelectProduct}
        />
      </section>

      {/* Product Detail Modal */}
      {detailProduct && (
        <ProductDetailModal
          product={detailProduct}
          isOpen={!!detailProduct}
          onClose={() => setDetailProduct(null)}
          onSubscribe={handleLaunchSubscribe}
        />
      )}

      {/* Subscribe Execution Modal */}
      {subscribeProduct && (
        <SubscribeModal
          product={{
            id: subscribeProduct.id,
            name: subscribeProduct.name,
            price_per_period: subscribeProduct.price_per_period,
            period_display: subscribeProduct.period_display,
            grace_display: subscribeProduct.grace_display,
          }}
          onClose={() => setSubscribeProduct(null)}
        />
      )}
    </main>
  );
}
