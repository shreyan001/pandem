"use client";

import { useState } from "react";
import Link from "next/link";
import { ProductHuntLeaderboard } from "../components/ProductHuntLeaderboard";
import { ProductDetailModal } from "../components/ProductDetailModal";
import { SubscribeModal } from "../components/SubscribeModal";
import { CatalogItem } from "@pandem/shared";
import catalogData from "../../../shared/catalog.json";
import { useNearWallet } from "../context/NearWalletContext";

export default function Home() {
  const { accountId, isConnected } = useNearWallet();
  const [detailProduct, setDetailProduct] = useState<CatalogItem | null>(null);
  const [subscribeProduct, setSubscribeProduct] = useState<CatalogItem | null>(null);
  const [activeXrayStep, setActiveXrayStep] = useState<number>(0);
  const catalog = catalogData as unknown as CatalogItem[];

  const handleSelectProduct = (product: CatalogItem) => {
    setDetailProduct(product);
  };

  const handleLaunchSubscribe = (product: CatalogItem, periods: number) => {
    setDetailProduct(null);
    setSubscribeProduct(product);
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-20 bg-[#0D0D0D] text-[#FAFAFA] font-sans">
      {/* 2.1 Above-the-Fold Hero Section */}
      <section className="text-center pt-8 pb-12 border-b border-[#2E2E2E] space-y-8">
        {/* Eyebrow Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-none bg-[#171717] border border-[#2E2E2E] text-xs font-mono tracking-wider">
          <span className="w-2 h-2 rounded-none bg-[#894DEF]" />
          <span className="text-[#894DEF] font-bold">PANDEM PROTOCOL</span>
          <span className="text-[#6B6B6B]">·</span>
          <span className="text-[#B8B8B8]">NEAR CONFIDENTIAL INTENTS</span>
          <span className="text-[#6B6B6B]">·</span>
          <span className="text-[#B8B8B8]">INTEL TDX</span>
          <span className="text-[#6B6B6B]">·</span>
          <span className="text-[#B8B8B8]">NEAR AI CLOUD</span>
        </div>

        {/* Hero Headline (H1) */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#FAFAFA] tracking-tight max-w-5xl mx-auto leading-tight sm:leading-none uppercase">
          Subscribe in Complete Secrecy. <br className="hidden sm:inline" />
          <span className="text-[#894DEF]">Run Inside Hardware Enclaves.</span> <br className="hidden sm:inline" />
          Own Your Agentic Stack.
        </h1>

        {/* Hero Sub-headline */}
        <p className="text-sm sm:text-base lg:text-lg text-[#B8B8B8] max-w-3xl mx-auto leading-relaxed">
          Standard SaaS asks you to trust a privacy policy while exposing your LangGraph state, user database, and payment trail.
          Pandem is the sovereign software storefront where subscriptions settle invisibly via NEAR Confidential Intents, apps self-fund
          their own AI and database enclaves through a Tripartite Smart Contract, and neither the developer nor the cloud host can ever inspect your data.
        </p>

        {/* Primary Call-to-Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <a
            href="#storefront"
            className="w-full sm:w-auto px-8 py-4 rounded-none bg-[#894DEF] hover:bg-[#A273F2] text-[#FAFAFA] border border-[#FAFAFA] font-bold text-sm font-mono tracking-wide transition-colors flex items-center justify-center gap-2"
          >
            <span>Explore Pandem Storefront</span>
            <span>↓</span>
          </a>

          <Link
            href="/dev/onboarding"
            className="w-full sm:w-auto px-8 py-4 rounded-none bg-[#171717] hover:bg-[#262626] text-[#FAFAFA] border border-[#2E2E2E] hover:border-[#894DEF] font-bold text-sm font-mono tracking-wide transition-colors flex items-center justify-center gap-2"
          >
            <span>Launch a Product (Get Instant AI & DB Credits)</span>
            <span>→</span>
          </Link>
        </div>

        {/* Role Routing Selector */}
        <div className="pt-4 max-w-2xl mx-auto">
          {isConnected && accountId ? (
            <div className="p-4 rounded-none bg-[#171717] border border-[#894DEF] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono text-left">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-none bg-[#894DEF]" />
                <span className="text-[#B8B8B8]">Connected as:</span>
                <strong className="text-[#FAFAFA]">{accountId}</strong>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href="/dashboard"
                  className="px-3 py-1.5 rounded-none bg-[#262626] hover:bg-[#0D0D0D] text-[#FAFAFA] border border-[#2E2E2E] hover:border-[#894DEF] transition-colors"
                >
                  Subscriber Dashboard →
                </Link>
                <Link
                  href="/dev/dashboard"
                  className="px-3 py-1.5 rounded-none bg-[#894DEF] text-[#FAFAFA] border border-[#FAFAFA] font-semibold transition-colors"
                >
                  Developer Portal →
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono text-left">
              <a
                href="#storefront"
                className="p-4 rounded-none bg-[#171717] border border-[#2E2E2E] hover:border-[#894DEF] transition-colors group"
              >
                <div className="text-[10px] text-[#894DEF] font-bold uppercase">Browse as Subscriber</div>
                <div className="text-sm font-bold text-[#FAFAFA] mt-1 group-hover:text-[#894DEF] transition-colors">
                  Explore Zero-Knowledge Apps
                </div>
                <p className="text-[11px] text-[#B8B8B8] mt-1">
                  View TEE hardware proofs, anonymous intent subscription quotes, and walkaway exports.
                </p>
              </a>

              <Link
                href="/dev/onboarding"
                className="p-4 rounded-none bg-[#171717] border border-[#2E2E2E] hover:border-[#894DEF] transition-colors group"
              >
                <div className="text-[10px] text-[#894DEF] font-bold uppercase">Browse as Developer</div>
                <div className="text-sm font-bold text-[#FAFAFA] mt-1 group-hover:text-[#894DEF] transition-colors">
                  Deploy Enclave SaaS & Get Credits
                </div>
                <p className="text-[11px] text-[#B8B8B8] mt-1">
                  Connect LangGraph & Postgres. Contract automatically provisions scoped AI inference keys.
                </p>
              </Link>
            </div>
          )}
        </div>

        {/* Interactive Hero Visual ("Pandem Live Privacy & Escrow X-Ray") */}
        <div className="pt-6 text-left">
          <div className="flex items-center justify-between pb-3 border-b border-[#2E2E2E] mb-4">
            <span className="text-xs font-mono font-bold text-[#FAFAFA] uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-none bg-[#894DEF]" />
              <span>Interactive Privacy & Escrow X-Ray Architecture</span>
            </span>
            <span className="text-[11px] font-mono text-[#6B6B6B]">
              3-Layer Physical Enclave Isolation
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Panel 1 */}
            <div
              onClick={() => setActiveXrayStep(0)}
              className={`p-6 rounded-none bg-[#171717] border transition-colors cursor-pointer space-y-3 ${
                activeXrayStep === 0 ? "border-[#894DEF]" : "border-[#2E2E2E] hover:border-[#6B6B6B]"
              }`}
            >
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="px-2 py-0.5 rounded-none bg-[#262626] text-[#894DEF] font-bold border border-[#2E2E2E]">
                  01 · PAYMENT
                </span>
                <span className="text-[#6B6B6B]">Confidential Intent</span>
              </div>
              <h3 className="text-base font-bold text-[#FAFAFA]">Invisible Payment Routing</h3>
              <div className="p-3 rounded-none bg-[#0D0D0D] border border-[#2E2E2E] font-mono text-xs text-[#B8B8B8] space-y-1">
                <div>Subscriber Wallet (Shielded Shard)</div>
                <div className="text-[#894DEF]">↓ intents.near (Private Shard)</div>
                <div>↓ pandem-tripartite.near</div>
                <div className="text-[10px] text-[#FAFAFA] pt-1 font-bold">
                  ✓ 0 Public Wallet Links Recorded
                </div>
              </div>
              <p className="text-xs text-[#B8B8B8] leading-relaxed">
                Blind commitment hash <code className="text-[#FAFAFA]">sha256(secret + product_id)</code> is stored on-chain. Nobody can scan your wallet to discover what tools you subscribe to.
              </p>
            </div>

            {/* Panel 2 */}
            <div
              onClick={() => setActiveXrayStep(1)}
              className={`p-6 rounded-none bg-[#171717] border transition-colors cursor-pointer space-y-3 ${
                activeXrayStep === 1 ? "border-[#894DEF]" : "border-[#2E2E2E] hover:border-[#6B6B6B]"
              }`}
            >
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="px-2 py-0.5 rounded-none bg-[#262626] text-[#894DEF] font-bold border border-[#2E2E2E]">
                  02 · COMPUTE
                </span>
                <span className="text-[#6B6B6B]">Tripartite OpEx</span>
              </div>
              <h3 className="text-base font-bold text-[#FAFAFA]">Autonomous 30% OpEx & Scoped Key</h3>
              <div className="p-3 rounded-none bg-[#0D0D0D] border border-[#2E2E2E] font-mono text-xs text-[#B8B8B8] space-y-1">
                <div>Contract mints pk-pandem-tee-...</div>
                <div className="text-[#894DEF]">↓ cloud-api.near.ai (H100 TEE)</div>
                <div>↓ Phala dstack Postgres Enclave</div>
                <div className="text-[10px] text-[#FAFAFA] pt-1 font-bold">
                  ✓ Hardware Sealed RAM & Disk
                </div>
              </div>
              <p className="text-xs text-[#B8B8B8] leading-relaxed">
                Contract streams USDC via intents.near directly to compute providers. Developer never gets custody of inference credits or raw database keys.
              </p>
            </div>

            {/* Panel 3 */}
            <div
              onClick={() => setActiveXrayStep(2)}
              className={`p-6 rounded-none bg-[#171717] border transition-colors cursor-pointer space-y-3 ${
                activeXrayStep === 2 ? "border-[#894DEF]" : "border-[#2E2E2E] hover:border-[#6B6B6B]"
              }`}
            >
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="px-2 py-0.5 rounded-none bg-[#262626] text-[#894DEF] font-bold border border-[#2E2E2E]">
                  03 · ESCROW
                </span>
                <span className="text-[#6B6B6B]">7-Day Shield</span>
              </div>
              <h3 className="text-base font-bold text-[#FAFAFA]">7-Day Credit Misuse Shield</h3>
              <div className="p-3 rounded-none bg-[#0D0D0D] border border-[#2E2E2E] font-mono text-xs text-[#B8B8B8] space-y-1">
                <div>50% Dev Payout: 7-Day Timelock</div>
                <div className="text-[#894DEF]">↓ Hardware Telemetry Monitor</div>
                <div>↓ compose-hash verification</div>
                <div className="text-[10px] text-[#FAFAFA] pt-1 font-bold">
                  ✓ Auto-Clawback if Container Altered
                </div>
              </div>
              <p className="text-xs text-[#B8B8B8] leading-relaxed">
                If the developer tampers with the container or attempts prompt exfiltration, the compose-hash changes and locked funds claw back to subscribers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2.2 Comparison Table: Policy Privacy vs. Standard Crypto AI vs. Pandem Hardware Privacy */}
      <section className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-none text-xs font-mono font-bold bg-[#171717] text-[#894DEF] border border-[#2E2E2E]">
              SECURITY AUDIT BENCHMARK
            </span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-[#FAFAFA] tracking-tight">
            Policy Privacy vs. Pandem Hardware Privacy
          </h2>
          <p className="text-xs sm:text-sm text-[#B8B8B8] max-w-3xl leading-relaxed">
            Even when a developer uses a private inference API (or when a provider like Claude states they do not train on customer data), running LangGraph and the user database on a standard server exposes every node transition, prompt, and user record in plaintext RAM before and after the LLM call. Pandem seals the entire loop inside verifiable hardware enclaves and content-addressed storage.
          </p>
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto rounded-none border border-[#2E2E2E] bg-[#171717]">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#0D0D0D] text-[#FAFAFA] border-b border-[#2E2E2E]">
              <tr>
                <th className="py-3.5 px-4 font-bold uppercase tracking-wider">Stack Layer</th>
                <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-[#6B6B6B]">Web2 Policy Privacy</th>
                <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-[#B8B8B8]">Standard Crypto AI App</th>
                <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-[#894DEF] bg-[#262626]/50">Pandem Privacy Suite</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2E2E2E] text-[#B8B8B8]">
              <tr className="hover:bg-[#262626]/30 transition-colors">
                <td className="py-3.5 px-4 font-bold text-[#FAFAFA]">LLM Inference</td>
                <td className="py-3.5 px-4 text-[#6B6B6B]">Plaintext API logs & retention</td>
                <td className="py-3.5 px-4 text-[#B8B8B8]">Private API only (stateless)</td>
                <td className="py-3.5 px-4 font-bold text-[#FAFAFA] bg-[#262626]/30 flex items-center gap-1.5">
                  <span className="text-[#894DEF]">✓</span> NEAR AI Cloud H100 TEE
                </td>
              </tr>
              <tr className="hover:bg-[#262626]/30 transition-colors">
                <td className="py-3.5 px-4 font-bold text-[#FAFAFA]">LangGraph Node</td>
                <td className="py-3.5 px-4 text-[#6B6B6B]">Plaintext cloud RAM</td>
                <td className="py-3.5 px-4 text-[#B8B8B8]">Leaked on founder VPS</td>
                <td className="py-3.5 px-4 font-bold text-[#FAFAFA] bg-[#262626]/30">
                  <span className="text-[#894DEF]">✓</span> Intel TDX Enclave CVM
                </td>
              </tr>
              <tr className="hover:bg-[#262626]/30 transition-colors">
                <td className="py-3.5 px-4 font-bold text-[#FAFAFA]">User Database</td>
                <td className="py-3.5 px-4 text-[#6B6B6B]">Host datacenter can dump DB</td>
                <td className="py-3.5 px-4 text-[#B8B8B8]">Plaintext Postgres disk</td>
                <td className="py-3.5 px-4 font-bold text-[#FAFAFA] bg-[#262626]/30">
                  <span className="text-[#894DEF]">✓</span> KMS-Sealed Enclave DB (dstack)
                </td>
              </tr>
              <tr className="hover:bg-[#262626]/30 transition-colors">
                <td className="py-3.5 px-4 font-bold text-[#FAFAFA]">Frontend Host</td>
                <td className="py-3.5 px-4 text-[#6B6B6B]">Mutable Vercel / Cloudflare DNS</td>
                <td className="py-3.5 px-4 text-[#B8B8B8]">Centralized domain endpoint</td>
                <td className="py-3.5 px-4 font-bold text-[#FAFAFA] bg-[#262626]/30">
                  <span className="text-[#894DEF]">✓</span> Filecoin + FastFS Pinning
                </td>
              </tr>
              <tr className="hover:bg-[#262626]/30 transition-colors">
                <td className="py-3.5 px-4 font-bold text-[#FAFAFA]">Payment Trail</td>
                <td className="py-3.5 px-4 text-[#6B6B6B]">Stripe KYC tracks identity</td>
                <td className="py-3.5 px-4 text-[#B8B8B8]">Public wallet history indexed</td>
                <td className="py-3.5 px-4 font-bold text-[#FAFAFA] bg-[#262626]/30">
                  <span className="text-[#894DEF]">✓</span> NEAR Confidential Intents
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 2.3 Private Subscriptions Section ("How Pandem Hides Who You Are & What You Buy") */}
      <section className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-none text-xs font-mono font-bold bg-[#171717] text-[#894DEF] border border-[#2E2E2E]">
              ZERO-KNOWLEDGE ARCHITECTURE
            </span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-[#FAFAFA] tracking-tight">
            How Pandem Hides Who You Are & What You Buy
          </h2>
          <p className="text-xs sm:text-sm text-[#B8B8B8] max-w-2xl leading-relaxed">
            Complete cryptographic anonymity from payment to execution. Neither your credit card, wallet address, nor browsing fingerprint is ever linked on-chain.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-6 rounded-none bg-[#171717] border border-[#2E2E2E] space-y-3">
            <div className="w-8 h-8 rounded-none bg-[#262626] border border-[#2E2E2E] font-mono text-xs font-bold text-[#894DEF] flex items-center justify-center">
              1
            </div>
            <h3 className="text-base font-bold text-[#FAFAFA]">Confidential Intent Routing</h3>
            <p className="text-xs text-[#B8B8B8] leading-relaxed">
              Pay in USDC or native NEAR. The transaction settles via NEAR&apos;s Confidential Intents private shard, where balances and transfers are mathematically shielded from public block explorers.
            </p>
          </div>

          <div className="p-6 rounded-none bg-[#171717] border border-[#2E2E2E] space-y-3">
            <div className="w-8 h-8 rounded-none bg-[#262626] border border-[#2E2E2E] font-mono text-xs font-bold text-[#894DEF] flex items-center justify-center">
              2
            </div>
            <h3 className="text-base font-bold text-[#FAFAFA]">Blind Commitment Storage</h3>
            <p className="text-xs text-[#B8B8B8] leading-relaxed">
              Instead of recording <code className="text-[#FAFAFA]">alice.near subscribed to app-x</code>, the solver passes a blind commitment hash (<code className="text-[#FAFAFA]">sha256(secret + product_id)</code>) to <code className="text-[#FAFAFA]">pandem-tripartite.near</code>.
            </p>
          </div>

          <div className="p-6 rounded-none bg-[#171717] border border-[#2E2E2E] space-y-3">
            <div className="w-8 h-8 rounded-none bg-[#262626] border border-[#2E2E2E] font-mono text-xs font-bold text-[#894DEF] flex items-center justify-center">
              3
            </div>
            <h3 className="text-base font-bold text-[#FAFAFA]">Zero-Knowledge RA-TLS Login</h3>
            <p className="text-xs text-[#B8B8B8] leading-relaxed">
              To use the app, your browser proves ownership of <code className="text-[#FAFAFA]">local_secret</code> directly over Remote-Attested TLS to the Intel TDX enclave—never revealing your wallet identity to anyone.
            </p>
          </div>
        </div>
      </section>

      {/* 2.4 Agentic Privacy Suite & Progressive Decentralization Section */}
      <section className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-none text-xs font-mono font-bold bg-[#171717] text-[#894DEF] border border-[#2E2E2E]">
              SOVEREIGNTY & PROGRESSIVE DECENTRALIZATION
            </span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-[#FAFAFA] tracking-tight">
            Agentic Privacy Suite & Walkaway Sovereignty
          </h2>
          <p className="text-xs sm:text-sm text-[#B8B8B8] max-w-2xl leading-relaxed">
            Software you cannot fork or export is not sovereign. Pandem guarantees that subscribers can walk away with their agent stack at any time.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-none bg-[#171717] border border-[#2E2E2E] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#FAFAFA]">User-Forkable Agent Offerings</h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-none bg-[#262626] text-[#894DEF] border border-[#2E2E2E]">
                Self-Hostable
              </span>
            </div>
            <p className="text-xs text-[#B8B8B8] leading-relaxed">
              Every product listed on Pandem publishes an encrypted <strong>Walkaway & Fork Bundle</strong> (Docker Compose manifest + schema + migration script).
              If a developer abandons an app or increases pricing, any subscriber can export their KMS-decrypted database and run the exact same agent in their private local enclave.
            </p>
            <div className="p-3.5 rounded-none bg-[#0D0D0D] border border-[#2E2E2E] font-mono text-[11px] text-[#B8B8B8] space-y-1">
              <div>$ docker compose -f pandem-bundle.yml up</div>
              <div className="text-[#894DEF]">✓ KMS volumes mounted locally</div>
              <div className="text-[10px] text-[#6B6B6B]">Zero proprietary cloud lock-in</div>
            </div>
          </div>

          <div className="p-6 rounded-none bg-[#171717] border border-[#2E2E2E] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#FAFAFA]">Public Bug & Upgrade Portal (17.5% Buffer)</h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-none bg-[#262626] text-[#FAFAFA] border border-[#2E2E2E]">
                17.5% Bounty Pool
              </span>
            </div>
            <p className="text-xs text-[#B8B8B8] leading-relaxed">
              Subscribers post bug reports or feature requests directly to Pandem&apos;s public portal. Because <strong>50% of revenue sits in a 7-day review lock</strong>, developers have immediate incentive to push attested fixes—or external contributors can submit PRs and claim automated bounties from the 17.5% Update Buffer.
            </p>
            <div className="p-3.5 rounded-none bg-[#0D0D0D] border border-[#2E2E2E] font-mono text-[11px] text-[#B8B8B8] space-y-1">
              <div>Solve-to-Pay Contract Logic</div>
              <div className="text-[#894DEF]">✓ 17.5% Allocated for Verified Patches</div>
              <div className="text-[10px] text-[#6B6B6B]">Guaranteed response SLA without customer support bureaucracy</div>
            </div>
          </div>
        </div>
      </section>

      {/* 2.5 Live Storefront & Leaderboard (id="storefront") */}
      <section id="storefront" className="pt-8 border-t border-[#2E2E2E] space-y-6 scroll-mt-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#2E2E2E]">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-none bg-[#894DEF]" />
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#FAFAFA] tracking-tight">
                Sovereign Software Storefront
              </h2>
            </div>
            <p className="text-xs text-[#B8B8B8] font-mono mt-1">
              Vote for products, inspect cryptographic hardware TEE attestation, and subscribe via native tripartite escrow.
            </p>
          </div>
          <span className="text-xs font-mono text-[#6B6B6B] hidden sm:inline">
            {catalog.length} Verified Services Live
          </span>
        </div>

        <ProductHuntLeaderboard
          products={catalog}
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
