"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
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
  Terminal,
  Activity,
  Layers,
  Search,
  Code,
  Sparkles,
  ArrowRight,
  ExternalLink,
} from "lucide-react";

export default function Home() {
  const { accountId, isConnected } = useNearWallet();
  const [detailProduct, setDetailProduct] = useState<CatalogItem | null>(null);
  const [subscribeProduct, setSubscribeProduct] = useState<CatalogItem | null>(null);
  const [activeConsoleTab, setActiveConsoleTab] = useState<"settlement" | "tee" | "storage">("settlement");
  const [catalog, setCatalog] = useState<CatalogItem[]>(() => catalogData as unknown as CatalogItem[]);
  const [searchQuery, setSearchQuery] = useState("");
  const [monthlySimAmount, setMonthlySimAmount] = useState<number>(50);
  const [quoteVerified, setQuoteVerified] = useState<boolean>(true);

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

  // Settlement calculations
  const devShare = (monthlySimAmount * 0.475).toFixed(2);
  const opexShare = (monthlySimAmount * 0.30).toFixed(2);
  const shieldShare = (monthlySimAmount * 0.20).toFixed(2);
  const protocolShare = (monthlySimAmount * 0.025).toFixed(2);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-24 bg-[#0D0D0D] text-[#FAFAFA] font-sans">
      {/* 1. Hero Section */}
      <section className="space-y-10 pt-4">
        <div className="max-w-4xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#141414] border border-[#262626] text-xs text-[#A1A1A1]">
            <span className="w-1.5 h-1.5 bg-[#22C55E]" />
            <span>NEAR Confidential Intents</span>
            <span className="text-[#525252]">·</span>
            <span>Intel TDX</span>
            <span className="text-[#525252]">·</span>
            <span>NVIDIA H100 TEE</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-semibold tracking-[-0.03em] text-[#FAFAFA] leading-[1.08]">
            Software subscriptions that settle in complete secrecy.
          </h1>

          <p className="text-base sm:text-lg text-[#A1A1A1] max-w-3xl leading-relaxed">
            Standard software asks you to trust a written privacy policy while exposing your database, memory state, and payment trail.
            Pandem is the sovereign software storefront where subscriptions settle via NEAR Confidential Intents, applications self-fund their AI and compute infrastructure through smart contract escrow, and hardware enclaves guarantee that no one can inspect your data.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <a
              href="#storefront"
              className="bg-[#894DEF] hover:bg-[#7839DF] text-white px-6 py-3 text-sm font-medium transition-colors"
            >
              Explore Storefront
            </a>

            <Link
              href="/dev/onboarding"
              className="bg-[#141414] hover:bg-[#1A1A1A] text-[#FAFAFA] border border-[#2A2A2A] hover:border-[#383838] px-6 py-3 text-sm font-medium transition-colors"
            >
              Launch an Application
            </Link>
          </div>
        </div>

        {/* Role Navigation Banner */}
        {isConnected && accountId ? (
          <div className="p-4 bg-[#141414] border border-[#2A2A2A] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[#22C55E]" />
              <span className="text-[#737373]">Active wallet:</span>
              <span className="font-mono text-[#FAFAFA] font-medium">{accountId}</span>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/dashboard"
                className="px-3 py-1.5 bg-[#1A1A1A] hover:bg-[#222222] text-[#FAFAFA] border border-[#2E2E2E] transition-colors"
              >
                Subscriber Dashboard
              </Link>
              <Link
                href="/dev/dashboard"
                className="px-3 py-1.5 bg-[#894DEF] hover:bg-[#7839DF] text-white transition-colors"
              >
                Developer Dashboard
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <a
              href="#storefront"
              className="p-5 bg-[#141414] border border-[#222222] hover:border-[#383838] hover:bg-[#181818] transition-colors group"
            >
              <div className="text-[#22C55E] font-medium text-xs">For Subscribers</div>
              <div className="text-sm font-medium text-[#FAFAFA] mt-1 group-hover:text-[#C084FC] transition-colors">
                Subscribe privately with zero-knowledge credentials
              </div>
              <p className="text-xs text-[#737373] mt-1.5 leading-relaxed">
                Transactions settle on shielded shards. No credit card records, public wallet linkages, or behavioral tracking.
              </p>
            </a>

            <Link
              href="/dev/onboarding"
              className="p-5 bg-[#141414] border border-[#222222] hover:border-[#383838] hover:bg-[#181818] transition-colors group"
            >
              <div className="text-[#C084FC] font-medium text-xs">For Developers</div>
              <div className="text-sm font-medium text-[#FAFAFA] mt-1 group-hover:text-[#C084FC] transition-colors">
                Launch confidential SaaS with automated OpEx streaming
              </div>
              <p className="text-xs text-[#737373] mt-1.5 leading-relaxed">
                Deploy LangGraph & Postgres inside hardware enclaves. Smart contracts provision scoped inference keys automatically.
              </p>
            </Link>
          </div>
        )}

        {/* 2. Hero Centerpiece: Hardware Enclave Architecture Viewer */}
        <div className="border border-[#222222] bg-[#141414]">
          {/* Console Header Tabs */}
          <div className="flex items-center justify-between border-b border-[#222222] px-4 bg-[#111111] overflow-x-auto">
            <div className="flex items-center">
              <button
                onClick={() => setActiveConsoleTab("settlement")}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-medium border-b-2 transition-colors ${
                  activeConsoleTab === "settlement"
                    ? "border-[#894DEF] text-[#FAFAFA]"
                    : "border-transparent text-[#737373] hover:text-[#FAFAFA]"
                }`}
              >
                <Lock className="w-3.5 h-3.5 text-[#894DEF]" />
                <span>Confidential Settlement</span>
              </button>

              <button
                onClick={() => setActiveConsoleTab("tee")}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-medium border-b-2 transition-colors ${
                  activeConsoleTab === "tee"
                    ? "border-[#894DEF] text-[#FAFAFA]"
                    : "border-transparent text-[#737373] hover:text-[#FAFAFA]"
                }`}
              >
                <Cpu className="w-3.5 h-3.5 text-[#22C55E]" />
                <span>Hardware TEE Verification</span>
              </button>

              <button
                onClick={() => setActiveConsoleTab("storage")}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-medium border-b-2 transition-colors ${
                  activeConsoleTab === "storage"
                    ? "border-[#894DEF] text-[#FAFAFA]"
                    : "border-transparent text-[#737373] hover:text-[#FAFAFA]"
                }`}
              >
                <Database className="w-3.5 h-3.5 text-[#EAB308]" />
                <span>Verifiable Web & DB</span>
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-[11px] text-[#737373]">
              <span className="w-1.5 h-1.5 bg-[#22C55E]" />
              <span>NEAR Testnet Invariant Active</span>
            </div>
          </div>

          {/* Tab 1 Content: Confidential Settlement */}
          {activeConsoleTab === "settlement" && (
            <div className="p-6 sm:p-8 space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-7 space-y-5">
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-[#FAFAFA] tracking-tight">
                      Tripartite Escrow & OpEx Streaming
                    </h3>
                    <p className="text-sm text-[#A1A1A1] leading-relaxed">
                      When a user subscribes, payment never touches the developer directly. Funds flow through an autonomous smart contract (<code className="font-mono text-[#FAFAFA]">pandem-escrow.testnet</code>) that distributes capital according to verifiable protocol rules.
                    </p>
                  </div>

                  {/* Flow Steps */}
                  <div className="space-y-3 pt-2">
                    <div className="p-4 bg-[#181818] border border-[#262626] space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-[#FAFAFA]">1. Shielded Subscription Intent</span>
                        <span className="text-[#22C55E] text-[11px]">Zero Public Link</span>
                      </div>
                      <p className="text-xs text-[#737373] leading-relaxed">
                        Subscriber routes funds via <code className="font-mono text-[#FAFAFA]">intents.near</code>. The contract records a blind commitment hash <code className="font-mono text-[#FAFAFA]">sha256(secret + product_id)</code>. Your wallet is never linked to the product.
                      </p>
                    </div>

                    <div className="p-4 bg-[#181818] border border-[#262626] space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-[#FAFAFA]">2. Autonomous 30% Compute Provisioning</span>
                        <span className="text-[#894DEF] text-[11px]">Direct to TEE</span>
                      </div>
                      <p className="text-xs text-[#737373] leading-relaxed">
                        30% of funds stream directly to compute providers (<code className="font-mono text-[#FAFAFA]">cloud-api.near.ai</code> and Phala <code className="font-mono text-[#FAFAFA]">dstack</code>). The developer cannot divert or misuse inference funds.
                      </p>
                    </div>

                    <div className="p-4 bg-[#181818] border border-[#262626] space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-[#FAFAFA]">3. 7-Day Misuse Protection</span>
                        <span className="text-[#EAB308] text-[11px]">compose-hash Verified</span>
                      </div>
                      <p className="text-xs text-[#737373] leading-relaxed">
                        Developer revenue is locked for 7 rolling days. If the developer alters the enclave container or attempts prompt exfiltration, the hardware measurement changes and funds automatically claw back.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Live Interactive Split Calculator */}
                <div className="lg:col-span-5 bg-[#181818] border border-[#262626] p-6 space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-[#262626]">
                    <span className="text-xs font-semibold text-[#FAFAFA]">
                      Escrow Split Simulator
                    </span>
                    <span className="text-xs text-[#737373] font-mono">
                      Per Subscription Period
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-[#A1A1A1]">Subscription Amount:</span>
                      <span className="font-mono text-[#FAFAFA] font-semibold">${monthlySimAmount} USDC</span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={200}
                      step={5}
                      value={monthlySimAmount}
                      onChange={(e) => setMonthlySimAmount(Number(e.target.value))}
                      className="w-full accent-[#894DEF] bg-[#262626] h-1.5 cursor-pointer"
                    />
                    <div className="flex justify-between text-[11px] text-[#525252] font-mono">
                      <span>$10</span>
                      <span>$100</span>
                      <span>$200</span>
                    </div>
                  </div>

                  <div className="space-y-2.5 pt-2">
                    <div className="flex items-center justify-between p-3 bg-[#141414] border border-[#222222] text-xs">
                      <div>
                        <div className="font-medium text-[#FAFAFA]">Developer Revenue (47.5%)</div>
                        <div className="text-[11px] text-[#737373]">7-Day rolling timelock</div>
                      </div>
                      <span className="font-mono text-[#FAFAFA] font-semibold">${devShare}</span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-[#141414] border border-[#222222] text-xs">
                      <div>
                        <div className="font-medium text-[#894DEF]">Autonomous OpEx (30.0%)</div>
                        <div className="text-[11px] text-[#737373]">Direct to H100 & CVM compute</div>
                      </div>
                      <span className="font-mono text-[#894DEF] font-semibold">${opexShare}</span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-[#141414] border border-[#222222] text-xs">
                      <div>
                        <div className="font-medium text-[#22C55E]">Contingency Shield (20.0%)</div>
                        <div className="text-[11px] text-[#737373]">Automated refund buffer</div>
                      </div>
                      <span className="font-mono text-[#22C55E] font-semibold">${shieldShare}</span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-[#141414] border border-[#222222] text-xs">
                      <div>
                        <div className="font-medium text-[#737373]">Protocol Maintenance (2.5%)</div>
                        <div className="text-[11px] text-[#525252]">On-chain contract operations</div>
                      </div>
                      <span className="font-mono text-[#737373]">${protocolShare}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2 Content: Hardware TEE Verification */}
          {activeConsoleTab === "tee" && (
            <div className="p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#222222]">
                <div>
                  <h3 className="text-lg font-semibold text-[#FAFAFA] tracking-tight">
                    Cryptographic Remote Attestation Quote
                  </h3>
                  <p className="text-xs text-[#A1A1A1] mt-1">
                    Verified through Intel PCS and NVIDIA Remote Attestation Service (NRAS)
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setQuoteVerified(true)}
                    className="px-3.5 py-1.5 bg-[#181818] hover:bg-[#222222] border border-[#2A2A2A] text-xs font-medium text-[#FAFAFA] transition-colors flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5 text-[#22C55E]" />
                    <span>Verified Active</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-[#181818] border border-[#262626] space-y-2">
                  <div className="text-xs text-[#737373]">Processor Architecture</div>
                  <div className="text-sm font-medium text-[#FAFAFA]">Intel Xeon Scalable (4th Gen)</div>
                  <div className="text-xs text-[#22C55E] flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5" />
                    <span>TDX Trust Domain Extensions enabled</span>
                  </div>
                </div>

                <div className="p-4 bg-[#181818] border border-[#262626] space-y-2">
                  <div className="text-xs text-[#737373]">Inference Accelerator</div>
                  <div className="text-sm font-medium text-[#FAFAFA]">NVIDIA H100 SXM5 80GB</div>
                  <div className="text-xs text-[#22C55E] flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5" />
                    <span>Confidential Compute Mode active</span>
                  </div>
                </div>
              </div>

              {/* Code Snippet Box */}
              <div className="bg-[#0A0A0A] border border-[#262626] p-4 font-mono text-xs text-[#A1A1A1] space-y-1.5 overflow-x-auto">
                <div className="text-[#525252]">// Intel TDX Quote v4 Signature Verification</div>
                <div><span className="text-[#894DEF]">mr_enclave:</span> <span className="text-[#FAFAFA]">&quot;0x9f83ea0182470fbe76a0c0e74f826315&quot;</span></div>
                <div><span className="text-[#894DEF]">mr_signer:</span>  <span className="text-[#FAFAFA]">&quot;0x44c8d371109a471b0294b30171a81230&quot;</span></div>
                <div><span className="text-[#894DEF]">isv_svn:</span>    <span className="text-[#FAFAFA]">&quot;0x0002&quot;</span></div>
                <div><span className="text-[#894DEF]">quote_status:</span> <span className="text-[#22C55E]">&quot;200 OK — Hardware Signature Validated by Intel PCS&quot;</span></div>
                <div><span className="text-[#894DEF]">host_privileges:</span> <span className="text-[#EF4444]">&quot;Ring -1 Root Host Access Blocked by CPU Microcode&quot;</span></div>
              </div>

              <p className="text-xs text-[#737373] leading-relaxed">
                Because memory encryption keys are generated randomly inside the CPU on boot and never exposed outside the silicon package, neither the cloud datacenter administrator nor any host process can dump enclave memory or inspect prompts.
              </p>
            </div>
          )}

          {/* Tab 3 Content: Verifiable Web & DB */}
          {activeConsoleTab === "storage" && (
            <div className="p-6 sm:p-8 space-y-6">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-[#FAFAFA] tracking-tight">
                  Decentralized Web & Walkaway Portability
                </h3>
                <p className="text-xs text-[#A1A1A1]">
                  Self-healing storage, KMS-sealed databases, and zero proprietary cloud lock-in.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-5 bg-[#181818] border border-[#262626] space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#FAFAFA]">Decentralized Web Hosting</span>
                    <span className="text-[#22C55E]">Filecoin x402</span>
                  </div>
                  <p className="text-xs text-[#A1A1A1] leading-relaxed">
                    Product frontends are pinned to IPFS and Filecoin via Lighthouse x402 micro-renewals. Domains cannot be revoked or redirected by single DNS authorities.
                  </p>
                  <div className="p-2.5 bg-[#141414] border border-[#222222] font-mono text-[11px] text-[#737373]">
                    CID: bafybeid5q27vovh7n6wq3k2m...
                  </div>
                </div>

                <div className="p-5 bg-[#181818] border border-[#262626] space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#FAFAFA]">Walkaway & Fork Guarantee</span>
                    <span className="text-[#894DEF]">Sovereign Export</span>
                  </div>
                  <p className="text-xs text-[#A1A1A1] leading-relaxed">
                    Every service publishes a signed Docker Compose bundle. If a developer abandons maintenance, subscribers can export their KMS-decrypted database and run the agent in their private enclave.
                  </p>
                  <div className="p-2.5 bg-[#141414] border border-[#222222] font-mono text-[11px] text-[#737373]">
                    $ docker compose -f pandem-export.yml up
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 3. Hardware Privacy Benchmark */}
      <section className="space-y-8">
        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-semibold text-[#FAFAFA] tracking-tight">
            Hardware Isolation vs. Policy Privacy
          </h2>
          <p className="text-sm text-[#A1A1A1] max-w-3xl leading-relaxed">
            Written terms of service and marketing privacy claims offer no technical barrier against insider threats, subpoena orders, or memory scraping. Hardware enclaves enforce privacy at the physical layer.
          </p>
        </div>

        <div className="overflow-x-auto border border-[#222222] bg-[#141414]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#111111] text-[#FAFAFA] border-b border-[#222222]">
              <tr>
                <th className="py-4 px-5 font-semibold text-[#A1A1A1]">Stack Layer</th>
                <th className="py-4 px-5 font-semibold text-[#737373]">Traditional SaaS (Stripe + AWS)</th>
                <th className="py-4 px-5 font-semibold text-[#737373]">Typical Crypto AI (Plaintext VPS)</th>
                <th className="py-4 px-5 font-semibold text-[#C084FC] bg-[#1A1A1A]">Pandem Hardware Enclave</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222222] text-[#A1A1A1]">
              <tr className="hover:bg-[#181818] transition-colors">
                <td className="py-4 px-5 font-medium text-[#FAFAFA]">LLM Inference</td>
                <td className="py-4 px-5 text-[#EF4444] flex items-center gap-1.5">
                  <X className="w-3.5 h-3.5 shrink-0" />
                  <span>Plaintext API logs & retention</span>
                </td>
                <td className="py-4 px-5 text-[#EAB308]">
                  <span className="flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>Private API only (stateless)</span>
                  </span>
                </td>
                <td className="py-4 px-5 font-medium text-[#FAFAFA] bg-[#1A1A1A]">
                  <span className="text-[#22C55E] flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 shrink-0" />
                    <span>NEAR AI Cloud H100 TEE</span>
                  </span>
                </td>
              </tr>

              <tr className="hover:bg-[#181818] transition-colors">
                <td className="py-4 px-5 font-medium text-[#FAFAFA]">Agent Memory & State</td>
                <td className="py-4 px-5 text-[#EF4444] flex items-center gap-1.5">
                  <X className="w-3.5 h-3.5 shrink-0" />
                  <span>Plaintext cloud RAM dumps</span>
                </td>
                <td className="py-4 px-5 text-[#EAB308]">
                  <span className="flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>Leaked in founder VPS memory</span>
                  </span>
                </td>
                <td className="py-4 px-5 font-medium text-[#FAFAFA] bg-[#1A1A1A]">
                  <span className="text-[#22C55E] flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 shrink-0" />
                    <span>Intel TDX Enclave CVM</span>
                  </span>
                </td>
              </tr>

              <tr className="hover:bg-[#181818] transition-colors">
                <td className="py-4 px-5 font-medium text-[#FAFAFA]">Application Database</td>
                <td className="py-4 px-5 text-[#EF4444] flex items-center gap-1.5">
                  <X className="w-3.5 h-3.5 shrink-0" />
                  <span>Host datacenter can dump Postgres</span>
                </td>
                <td className="py-4 px-5 text-[#EAB308]">
                  <span className="flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>Unencrypted disk storage</span>
                  </span>
                </td>
                <td className="py-4 px-5 font-medium text-[#FAFAFA] bg-[#1A1A1A]">
                  <span className="text-[#22C55E] flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 shrink-0" />
                    <span>KMS-Sealed Enclave PostgreSQL</span>
                  </span>
                </td>
              </tr>

              <tr className="hover:bg-[#181818] transition-colors">
                <td className="py-4 px-5 font-medium text-[#FAFAFA]">Web Frontend Delivery</td>
                <td className="py-4 px-5 text-[#EF4444] flex items-center gap-1.5">
                  <X className="w-3.5 h-3.5 shrink-0" />
                  <span>Mutable Vercel / Cloudflare DNS</span>
                </td>
                <td className="py-4 px-5 text-[#EAB308]">
                  <span className="flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>Single centralized IP address</span>
                  </span>
                </td>
                <td className="py-4 px-5 font-medium text-[#FAFAFA] bg-[#1A1A1A]">
                  <span className="text-[#22C55E] flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 shrink-0" />
                    <span>Filecoin + FastFS Pinning</span>
                  </span>
                </td>
              </tr>

              <tr className="hover:bg-[#181818] transition-colors">
                <td className="py-4 px-5 font-medium text-[#FAFAFA]">Subscription Settlement</td>
                <td className="py-4 px-5 text-[#EF4444] flex items-center gap-1.5">
                  <X className="w-3.5 h-3.5 shrink-0" />
                  <span>Stripe KYC links identity to app</span>
                </td>
                <td className="py-4 px-5 text-[#EAB308]">
                  <span className="flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>Public block explorer history</span>
                  </span>
                </td>
                <td className="py-4 px-5 font-medium text-[#FAFAFA] bg-[#1A1A1A]">
                  <span className="text-[#22C55E] flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 shrink-0" />
                    <span>NEAR Confidential Intents</span>
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-[#141414] border border-[#222222] text-xs text-[#737373] leading-relaxed">
          <strong className="text-[#FAFAFA]">Why end-to-end sealing matters:</strong> If a developer uses a private LLM API but runs their agent memory on an unsealed cloud server, your private prompts and business data are exposed in plaintext memory before and after inference. Pandem closes every seam in the stack.
        </div>
      </section>

      {/* 4. Live Storefront Directory */}
      <section id="storefront" className="space-y-6 pt-4 border-t border-[#222222] scroll-mt-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#222222]">
          <div>
            <h2 className="text-2xl sm:text-3xl font-semibold text-[#FAFAFA] tracking-tight">
              Storefront Directory
            </h2>
            <p className="text-xs text-[#737373] mt-1">
              Curated hardware-attested services. Vote for launches, inspect remote attestation proofs, and subscribe via native escrow.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#737373] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-[#141414] border border-[#262626] focus:border-[#894DEF] text-xs text-[#FAFAFA] placeholder-[#525252] outline-none w-48 sm:w-60 transition-colors"
              />
            </div>

            <span className="text-xs text-[#737373] whitespace-nowrap">
              {filteredCatalog.length} Live
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
