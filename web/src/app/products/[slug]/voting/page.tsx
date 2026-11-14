"use client";

import { use, useState, useMemo } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ENRICHED_PRODUCTS, SubscriberProposal } from "@pandem/shared";
import catalogData from "../../../../../../shared/catalog.json";
import { useNearWallet } from "../../../../context/NearWalletContext";
import { AbstractLogo } from "../../../../components/AbstractLogo";

interface VotingPageProps {
  params: Promise<{ slug: string }>;
}

export default function ProductVotingPage({ params }: VotingPageProps) {
  const { slug } = use(params);
  const { accountId, isConnected, connect } = useNearWallet();

  // Find product from ENRICHED_PRODUCTS or fallback to catalogData
  const product = useMemo(() => {
    const enriched = ENRICHED_PRODUCTS.find(
      (p) => p.slug.toLowerCase() === slug.toLowerCase()
    );
    if (enriched) return enriched;

    // Check catalog.json fallback (e.g. open-webui)
    const catalogItem = (catalogData as any[]).find(
      (c) => c.slug.toLowerCase() === slug.toLowerCase()
    );
    if (!catalogItem) return null;

    // Synthesize structured product with realistic proposals
    return {
      id: `prod-${catalogItem.product_id}`,
      product_id: catalogItem.product_id,
      slug: catalogItem.slug,
      name: catalogItem.name,
      suite: "Decentralized Infrastructure",
      tagline: catalogItem.tagline || "Hardware-attested private AI execution",
      description: catalogItem.description || "",
      category: catalogItem.category || "Private AI",
      privacy_problem: "Centralized SaaS retains telemetry and unencrypted query payloads.",
      why_direct_payment_fails: "No SLA recourse or automated refund protection.",
      score: 94,
      score_inputs_hash: "0x9f4a...88c1",
      upvotes: 420,
      rank: 2,
      heartbeat_healthy: true,
      heartbeat_streak: 18,
      last_heartbeat_timestamp: "2 mins ago",
      tee_hardware: "Intel TDX Enclave",
      tee_model: "Ollama Llama 3 8B TEE",
      steward: catalogItem.steward || "pandem-steward.testnet",
      tiers: [],
      developer: {
        github_handle: "open-webui",
        commits_last_30d: 84,
        release_cadence_days: 7,
        wallet_score: 96,
        steward_tier: "Gold_Steward" as const,
        verified_tee_deployments: 3,
        audit_status: "Verified_Reproducible_Wasm" as const,
      },
      treasury: {
        total_staked_usd: "$128,400",
        monthly_mrr_usd: "$14,500",
        mrr_growth_pct: 18.4,
        escrow_warranty_days: 70,
        dynamic_allocation_status: "Streaming" as const,
      },
      proposals: [
        {
          id: "prop-owui-1",
          product_id: catalogItem.product_id,
          title: "Confidential TEE Inference Engine Integration",
          description: "Direct zero-knowledge prompt processing inside Intel TDX enclaves with verifiable remote attestation.",
          tokens_allocated: 14,
          author: "alice.testnet",
          created_at: "2 days ago",
          status: "Open" as const,
        },
        {
          id: "prop-owui-2",
          product_id: catalogItem.product_id,
          title: "NEP-413 Key Signing Authentication for Multi-Tenant Workspaces",
          description: "Authenticate sessions using near-api-js cryptographic signature headers without centralized passwords.",
          tokens_allocated: 9,
          author: "steward.testnet",
          created_at: "5 days ago",
          status: "In_Review" as const,
        },
        {
          id: "prop-owui-3",
          product_id: catalogItem.product_id,
          title: "Streaming RAG Pipeline with End-to-End Encryption",
          description: "Client-side document embedding chunking with hardware-encrypted vector store queries.",
          tokens_allocated: 6,
          author: "crypto-researcher.testnet",
          created_at: "1 week ago",
          status: "Accepted" as const,
        },
      ],
      bug_reports: [],
      roadmap: [],
      decentralization_checks: [],
    };
  }, [slug]);

  if (!product) {
    notFound();
  }

  // State management
  const [proposals, setProposals] = useState<SubscriberProposal[]>(product.proposals);
  const [userTokens, setUserTokens] = useState<number>(3); // 3 tokens / month (no rollover)
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"DEMAND" | "NEWEST">("DEMAND");
  const [isSubmitOpen, setIsSubmitOpen] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState<string>("");
  const [formDescription, setFormDescription] = useState<string>("");
  const [formImpact, setFormImpact] = useState<string>("");

  const activeAccount = accountId || "pandem-alice-8d6888e3.testnet";

  const totalTokensAllocated = useMemo(() => {
    return proposals.reduce((acc, p) => acc + p.tokens_allocated, 0);
  }, [proposals]);

  const filteredProposals = useMemo(() => {
    let list = [...proposals];
    if (filterStatus !== "ALL") {
      list = list.filter((p) => p.status.toUpperCase() === filterStatus);
    }
    if (sortBy === "DEMAND") {
      list.sort((a, b) => b.tokens_allocated - a.tokens_allocated);
    } else {
      list.sort((a, b) => b.id.localeCompare(a.id));
    }
    return list;
  }, [proposals, filterStatus, sortBy]);

  const showNotification = (text: string, type: "success" | "error" = "success") => {
    setFeedback({ text, type });
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleAllocateToken = (proposalId: string) => {
    if (userTokens <= 0) {
      showNotification("You have consumed all 3 Request Tokens for this monthly billing cycle.", "error");
      return;
    }

    setUserTokens((prev) => prev - 1);
    setProposals((prev) =>
      prev.map((p) =>
        p.id === proposalId
          ? { ...p, tokens_allocated: p.tokens_allocated + 1 }
          : p
      )
    );
    showNotification("Allocated 1 Request Token to signal subscriber demand!");
  };

  const handleCreateProposal = (e: React.FormEvent) => {
    e.preventDefault();
    if (userTokens <= 0) {
      showNotification("You need at least 1 Request Token to submit a proposal.", "error");
      return;
    }
    if (!formTitle.trim() || !formDescription.trim()) {
      showNotification("Please provide both a proposal title and description.", "error");
      return;
    }

    const newProposal: SubscriberProposal = {
      id: `prop-${Date.now()}`,
      product_id: product.product_id,
      title: formTitle.trim(),
      description: formImpact.trim()
        ? `${formDescription.trim()} [Impact: ${formImpact.trim()}]`
        : formDescription.trim(),
      tokens_allocated: 1,
      author: activeAccount,
      created_at: "Just now",
      status: "Open",
    };

    setUserTokens((prev) => prev - 1);
    setProposals([newProposal, ...proposals]);
    setFormTitle("");
    setFormDescription("");
    setFormImpact("");
    setIsSubmitOpen(false);
    showNotification("Proposal submitted successfully! 1 Request Token consumed.");
  };

  return (
    <main className="min-h-screen bg-[#0D0D0D] text-[#FAFAFA] py-10 px-4 sm:px-6 lg:px-8 space-y-8 font-sans">
      {/* Breadcrumb Navigation - Spectr Rectilinear */}
      <div className="max-w-6xl mx-auto flex items-center justify-between text-xs font-mono text-[#737373] border-b border-[#2E2E2E] pb-4">
        <div className="flex items-center gap-2">
          <Link href="/" className="hover:text-[#FAFAFA] transition-colors">
            Leaderboard
          </Link>
          <span>/</span>
          <Link href={`/products/${product.slug}`} className="hover:text-[#FAFAFA] transition-colors">
            {product.name}
          </Link>
          <span>/</span>
          <span className="text-[#894DEF] font-bold">Voting & Proposals</span>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href={`/products/${product.slug}`}
            className="text-xs font-mono text-[#B8B8B8] hover:text-white transition-colors flex items-center gap-1.5"
          >
            ← Back to Product Overview
          </Link>
          <Link
            href="/dashboard"
            className="text-xs font-mono text-[#894DEF] hover:text-[#A273F2] transition-colors"
          >
            Dashboard →
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Hero Card - Spectr Sharp Styling */}
        <section className="bg-[#171717] border border-[#2E2E2E] p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-start gap-5">
              <AbstractLogo
                slug={product.slug}
                name={product.name}
                size={64}
                className="w-16 h-16 flex-shrink-0"
              />
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="border border-[#2E2E2E] bg-[#262626] text-[#FAFAFA] text-[10px] font-mono uppercase px-2 py-0.5">
                    {product.suite}
                  </span>
                  <span className="border border-[#894DEF] text-[#894DEF] text-[10px] font-mono uppercase px-2 py-0.5 font-bold">
                    Subscriber Governance Session
                  </span>
                  <span className="border border-[#2E2E2E] bg-[#171717] text-[#4ADE80] text-[10px] font-mono px-2 py-0.5 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-[#4ADE80]" />
                    TEE {product.tee_hardware}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
                  {product.name} Feature Proposals
                </h1>

                <p className="text-sm text-[#B8B8B8] max-w-2xl leading-relaxed">
                  Steer engineering priorities and demand signaling for {product.name}. Allocating request tokens binds developer treasury releases to community-voted milestones.
                </p>
              </div>
            </div>

            {/* Subscriber Token Meter - 3 Tokens / Month Policy */}
            <div className="bg-[#0D0D0D] border border-[#2E2E2E] p-5 flex flex-col items-start sm:items-end justify-between min-w-[280px]">
              <div className="flex items-center justify-between w-full pb-3 border-b border-[#2E2E2E]">
                <span className="text-[10px] font-mono uppercase text-[#737373] tracking-wider">
                  Request Tokens
                </span>
                <span className="text-xs font-mono font-bold text-[#894DEF]">
                  {userTokens} / 3 Available
                </span>
              </div>

              <div className="w-full my-3">
                <div className="h-2 w-full bg-[#262626] overflow-hidden">
                  <div
                    className="h-full bg-[#894DEF] transition-all duration-300"
                    style={{ width: `${(userTokens / 3) * 100}%` }}
                  />
                </div>
              </div>

              <div className="w-full text-[11px] font-mono text-[#737373] space-y-1">
                <div className="flex justify-between text-[#B8B8B8]">
                  <span>Allowance:</span>
                  <span className="text-white font-semibold">3 Tokens / Month</span>
                </div>
                <div className="flex justify-between text-[#B8B8B8]">
                  <span>Rollover:</span>
                  <span className="text-[#EF4444] font-semibold">No Rollover Policy</span>
                </div>
              </div>

              <button
                onClick={() => setIsSubmitOpen(true)}
                className="w-full mt-4 bg-[#894DEF] hover:bg-[#A273F2] text-white text-xs font-mono font-bold uppercase tracking-wider py-2.5 transition-colors"
              >
                + Submit Proposal (1 Token)
              </button>
            </div>
          </div>
        </section>

        {/* Feedback Alert Banner */}
        {feedback && (
          <div
            className={`p-4 border font-mono text-xs flex items-center justify-between ${
              feedback.type === "success"
                ? "bg-[#14532D66] border-[#166534] text-[#4ADE80]"
                : "bg-[#450A0A66] border-[#7F1D1D] text-[#EF4444]"
            }`}
          >
            <span>{feedback.text}</span>
            <button
              onClick={() => setFeedback(null)}
              className="text-[#737373] hover:text-white px-2"
            >
              ✕
            </button>
          </div>
        )}

        {/* Policy Explainer Callout - Spectr Sharp */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#171717] border border-[#2E2E2E] p-4 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-mono text-[#894DEF] font-bold">
              <span>01</span>
              <span>3 Tokens / Month Policy</span>
            </div>
            <p className="text-xs text-[#B8B8B8] leading-relaxed">
              Every active subscriber receives 3 request tokens at each billing cycle. Unused tokens expire at cycle reset (no rollover).
            </p>
          </div>

          <div className="bg-[#171717] border border-[#2E2E2E] p-4 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-mono text-[#4ADE80] font-bold">
              <span>02</span>
              <span>Signal High Priority Demand</span>
            </div>
            <p className="text-xs text-[#B8B8B8] leading-relaxed">
              Allocate tokens to back existing proposals or concentrate all 3 on a single urgent feature to signal critical product demand.
            </p>
          </div>

          <div className="bg-[#171717] border border-[#2E2E2E] p-4 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-mono text-[#FBBF24] font-bold">
              <span>03</span>
              <span>Developer Roadmap Sprints</span>
            </div>
            <p className="text-xs text-[#B8B8B8] leading-relaxed">
              Top-ranked requests move to the active sprint. Verified GitHub releases unlock developer treasury payouts on NEAR testnet.
            </p>
          </div>
        </section>

        {/* Proposals Filter & Stats Bar */}
        <section className="bg-[#171717] border border-[#2E2E2E] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1">
            {["ALL", "OPEN", "IN_REVIEW", "ACCEPTED", "CLOSED"].map((status) => {
              const isActive = filterStatus === status;
              return (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition-colors ${
                    isActive
                      ? "bg-[#894DEF] text-white font-bold border border-[#894DEF]"
                      : "bg-[#0D0D0D] text-[#737373] hover:text-[#FAFAFA] border border-[#2E2E2E]"
                  }`}
                >
                  {status.replace("_", " ")}
                </button>
              );
            })}
          </div>

          {/* Stats & Sorting */}
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="text-[#737373]">
              <span>Demand Pool: </span>
              <strong className="text-white">{totalTokensAllocated} Tokens</strong>
            </div>

            <div className="flex items-center gap-2 border-l border-[#2E2E2E] pl-4">
              <span className="text-[#737373]">Sort:</span>
              <button
                onClick={() => setSortBy("DEMAND")}
                className={`px-2 py-1 ${
                  sortBy === "DEMAND" ? "text-[#894DEF] font-bold" : "text-[#737373] hover:text-white"
                }`}
              >
                Demand
              </button>
              <span className="text-[#2E2E2E]">|</span>
              <button
                onClick={() => setSortBy("NEWEST")}
                className={`px-2 py-1 ${
                  sortBy === "NEWEST" ? "text-[#894DEF] font-bold" : "text-[#737373] hover:text-white"
                }`}
              >
                Newest
              </button>
            </div>
          </div>
        </section>

        {/* Proposals List */}
        <section className="space-y-4">
          {filteredProposals.length === 0 ? (
            <div className="bg-[#171717] border border-[#2E2E2E] p-12 text-center space-y-3">
              <p className="text-sm text-[#737373] font-mono">
                No feature proposals found under the &quot;{filterStatus}&quot; filter.
              </p>
              <button
                onClick={() => setIsSubmitOpen(true)}
                className="bg-[#894DEF] hover:bg-[#A273F2] text-white text-xs font-mono font-bold uppercase tracking-wider px-5 py-2 transition-colors"
              >
                Open the First Proposal
              </button>
            </div>
          ) : (
            filteredProposals.map((prop) => {
              const demandPercentage = totalTokensAllocated > 0
                ? Math.round((prop.tokens_allocated / totalTokensAllocated) * 100)
                : 0;

              return (
                <div
                  key={prop.id}
                  className="bg-[#171717] border border-[#2E2E2E] p-6 hover:border-[#894DEF]/50 transition-colors space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Status Badge */}
                        <span
                          className={`text-[10px] font-mono uppercase px-2 py-0.5 border font-semibold ${
                            prop.status === "Accepted"
                              ? "border-[#166534] bg-[#14532D66] text-[#4ADE80]"
                              : prop.status === "In_Review"
                              ? "border-[#92400E] bg-[#78350F66] text-[#FBBF24]"
                              : prop.status === "Closed"
                              ? "border-[#2E2E2E] bg-[#262626] text-[#737373]"
                              : "border-[#894DEF] bg-[#894DEF26] text-[#894DEF]"
                          }`}
                        >
                          {prop.status.replace("_", " ")}
                        </span>
                        <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 bg-[#222222] text-[#8A8A8A] border border-[#333333]">
                          off-chain
                        </span>

                        <span className="text-[11px] font-mono text-[#737373]">
                          by <strong className="text-[#B8B8B8]">{prop.author}</strong>
                        </span>
                        <span className="text-[11px] font-mono text-[#737373]">• {prop.created_at}</span>
                      </div>

                      <h3 className="text-lg font-bold text-white tracking-tight">
                        {prop.title}
                      </h3>

                      <p className="text-xs sm:text-sm text-[#B8B8B8] leading-relaxed">
                        {prop.description}
                      </p>
                    </div>

                    {/* Voting Action Box */}
                    <div className="bg-[#0D0D0D] border border-[#2E2E2E] p-4 flex sm:flex-col items-center justify-between sm:justify-center gap-3 sm:min-w-[170px] flex-shrink-0">
                      <div className="text-center">
                        <div className="text-xl font-mono font-bold text-[#894DEF]">
                          {prop.tokens_allocated}
                        </div>
                        <div className="text-[10px] font-mono uppercase text-[#737373]">
                          Tokens Allocated
                        </div>
                      </div>

                      <button
                        onClick={() => handleAllocateToken(prop.id)}
                        disabled={userTokens <= 0 || prop.status === "Closed"}
                        className="bg-[#894DEF] hover:bg-[#A273F2] disabled:bg-[#262626] disabled:text-[#737373] disabled:border-[#2E2E2E] text-white text-xs font-mono font-bold uppercase tracking-wider px-3.5 py-1.5 transition-colors border border-[#894DEF] w-full"
                        title={userTokens <= 0 ? "No tokens remaining this month" : "Allocate 1 token"}
                      >
                        + Allocate Token
                      </button>
                    </div>
                  </div>

                  {/* Demand Distribution Bar */}
                  <div className="space-y-1 pt-2 border-t border-[#2E2E2E]/60">
                    <div className="flex justify-between text-[10px] font-mono text-[#737373]">
                      <span>Subscriber Priority Share</span>
                      <span>{demandPercentage}% of total demand</span>
                    </div>
                    <div className="h-1.5 w-full bg-[#262626] overflow-hidden">
                      <div
                        className="h-full bg-[#894DEF]"
                        style={{ width: `${Math.max(4, Math.min(100, demandPercentage))}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </section>

        {/* Modal: Submit Proposal */}
        {isSubmitOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-[#171717] border border-[#2E2E2E] max-w-xl w-full p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between border-b border-[#2E2E2E] pb-4">
                <div>
                  <h3 className="text-lg font-bold text-white uppercase tracking-tight">
                    Submit Subscriber Proposal
                  </h3>
                  <p className="text-xs font-mono text-[#894DEF] mt-0.5">
                    Consumes 1 of your 3 monthly Request Tokens
                  </p>
                </div>
                <button
                  onClick={() => setIsSubmitOpen(false)}
                  className="text-[#737373] hover:text-white font-mono text-sm"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateProposal} className="space-y-4 font-mono text-xs">
                <div className="space-y-1.5">
                  <label className="block uppercase text-[#737373] tracking-wider">
                    Proposal Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Automated Intel TDX Heartbeat Failover with ZK Proofs"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full bg-[#0D0D0D] border border-[#2E2E2E] text-[#FAFAFA] p-3 focus:outline-none focus:border-[#894DEF]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block uppercase text-[#737373] tracking-wider">
                    Specification & User Story *
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Describe the exact functionality, why it benefits subscribers, and how it preserves confidentiality..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full bg-[#0D0D0D] border border-[#2E2E2E] text-[#FAFAFA] p-3 focus:outline-none focus:border-[#894DEF]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block uppercase text-[#737373] tracking-wider">
                    Expected Business / Security Impact
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Eliminates 99% of cloud vendor leakage risk for legal teams"
                    value={formImpact}
                    onChange={(e) => setFormImpact(e.target.value)}
                    className="w-full bg-[#0D0D0D] border border-[#2E2E2E] text-[#FAFAFA] p-3 focus:outline-none focus:border-[#894DEF]"
                  />
                </div>

                <div className="bg-[#0D0D0D] border border-[#2E2E2E] p-3 text-[11px] text-[#B8B8B8] space-y-1">
                  <div className="flex justify-between">
                    <span>Submitting Account:</span>
                    <strong className="text-white">{activeAccount}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Cost:</span>
                    <strong className="text-[#894DEF]">1 Request Token</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Remaining Tokens After:</span>
                    <strong className="text-white">{Math.max(0, userTokens - 1)} Tokens</strong>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsSubmitOpen(false)}
                    className="px-4 py-2 border border-[#2E2E2E] text-[#737373] hover:text-white uppercase font-bold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={userTokens <= 0}
                    className="px-5 py-2 bg-[#894DEF] hover:bg-[#A273F2] disabled:bg-[#262626] text-white uppercase font-bold transition-colors border border-[#894DEF]"
                  >
                    Submit Proposal
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
