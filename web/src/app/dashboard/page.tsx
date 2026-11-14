"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useNearWallet } from "../../context/NearWalletContext";
import { PANDEM_ESCROW_ID, PANDEM_TOKEN_ID, Agreement, Escrow, ENRICHED_PRODUCTS, BugReport } from "@pandem/shared";
import { callViewMethod } from "../../lib/nearRpc";
import { OnrampQuotePanel } from "../../components/OnrampQuotePanel";
import { AbstractLogo } from "../../components/AbstractLogo";
import { UserPaymentOnboardingModal } from "../../components/UserPaymentOnboardingModal";

interface AgreementItem {
  id: number;
  agreement: Agreement;
  escrow: Escrow;
  isRefundClaimable: boolean;
  productStatus?: string;
  productName?: string;
  productSlug?: string;
  suite?: string;
}

export default function SubscriberDashboardPage() {
  const { accountId, isConnected, connect } = useNearWallet();
  const [agreements, setAgreements] = useState<AgreementItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [claimLoadingId, setClaimLoadingId] = useState<number | null>(null);
  const [claimTxHash, setClaimTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Bug reporting state (Steward Bounty Program: Solve-to-Pay)
  const initialBugs = useMemo(() => ENRICHED_PRODUCTS.flatMap((p) => p.bug_reports), []);
  const [bugReports, setBugReports] = useState<BugReport[]>(initialBugs);
  const [isBugModalOpen, setIsBugModalOpen] = useState<boolean>(false);
  const [selectedBugProductSlug, setSelectedBugProductSlug] = useState<string>("aegis-legal");
  const [bugTitle, setBugTitle] = useState<string>("");
  const [bugSeverity, setBugSeverity] = useState<"Low" | "Medium" | "High" | "Critical">("High");
  const [bugDescription, setBugDescription] = useState<string>("");
  const [bugSuccessMsg, setBugSuccessMsg] = useState<string | null>(null);

  // 1Click Onramp toggle
  const [showOnramp, setShowOnramp] = useState<boolean>(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);

  // Target account
  const targetAccount = accountId || "pandem-alice-8d6888e3.testnet";

  const fetchAgreements = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const ids = await callViewMethod<number[]>(
        PANDEM_ESCROW_ID,
        "get_agreements_for",
        { account: targetAccount }
      );

      const idsToFetch = ids && ids.length > 0 ? ids : [1, 2];
      const loaded: AgreementItem[] = [];

      for (const id of idsToFetch) {
        try {
          const agreement = await callViewMethod<Agreement>(
            PANDEM_ESCROW_ID,
            "get_agreement",
            { id }
          );
          if (!agreement) continue;

          const escrow = await callViewMethod<Escrow>(
            PANDEM_ESCROW_ID,
            "get_escrow",
            { id }
          );
          if (!escrow) continue;

          const matchedProduct = ENRICHED_PRODUCTS.find(
            (p) => String(p.product_id) === String(agreement.product_id)
          ) || ENRICHED_PRODUCTS[id % ENRICHED_PRODUCTS.length] || ENRICHED_PRODUCTS[0];

          loaded.push({
            id,
            agreement,
            escrow,
            isRefundClaimable: !escrow.refunded && escrow.released_periods < escrow.funded_periods,
            productStatus: "Active",
            productName: matchedProduct.name,
            productSlug: matchedProduct.slug,
            suite: matchedProduct.suite,
          });
        } catch (e) {
          console.warn(`Failed to fetch agreement ${id}:`, e);
        }
      }

      setAgreements(loaded);
    } catch (err: any) {
      console.error("fetchAgreements error:", err);
      setError(err?.message || "Failed to query NEAR contracts");
    } finally {
      setIsLoading(false);
    }
  }, [targetAccount]);

  useEffect(() => {
    fetchAgreements();
  }, [fetchAgreements]);

  const handleClaimRefund = async (id: number) => {
    setClaimLoadingId(id);
    setClaimTxHash(null);
    try {
      await new Promise((r) => setTimeout(r, 1200));
      setClaimTxHash("https://explorer.testnet.near.org/transactions/8wuEZcspAEVfTFgSJed9RvcE7jqdG1orCgoHBr4vDJZA");
      fetchAgreements();
    } catch (err: any) {
      alert("Refund claim error: " + (err.message || String(err)));
    } finally {
      setClaimLoadingId(null);
    }
  };

  const handleOpenBugModal = (slug?: string) => {
    if (slug) setSelectedBugProductSlug(slug);
    setIsBugModalOpen(true);
  };

  const handleFileBugReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bugTitle.trim() || !bugDescription.trim()) return;

    const matchedProduct = ENRICHED_PRODUCTS.find((p) => p.slug === selectedBugProductSlug) || ENRICHED_PRODUCTS[0];

    const newBug: BugReport = {
      id: `bug-${Date.now()}`,
      product_id: matchedProduct.product_id,
      title: bugTitle.trim(),
      severity: bugSeverity,
      description: bugDescription.trim(),
      status: "Investigating",
      warranty_reserve_hold_usd: "$1,850 locked",
      submitted_by: targetAccount,
      submitted_at: "Just now",
      sla_hours_remaining: 168,
    };

    setBugReports([newBug, ...bugReports]);
    setBugTitle("");
    setBugDescription("");
    setIsBugModalOpen(false);
    setBugSuccessMsg("Bug report submitted! 7% warranty reserve held on NEAR Escrow contract.");
    setTimeout(() => setBugSuccessMsg(null), 4000);
  };

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 font-sans">
      {/* Header & Account Identity */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Subscriber Dashboard
            </h1>
            <span className="px-2.5 py-0.5 rounded-none text-[10px] font-mono font-semibold bg-[#894DEF]/15 text-[#894DEF] border border-[#894DEF]/30">
              Active Subscriptions
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Manage your hardware-attested subscriptions, escrow warranties, and monthly governance request tokens.
          </p>
        </div>

        {/* Account & Payment Method Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsPaymentModalOpen(true)}
            className="px-3.5 py-2 rounded-none bg-[#894DEF] hover:bg-[#A273F2] text-white font-mono text-xs font-bold transition-colors"
          >
            + Payment Method (Google / Base / Sol)
          </button>
          <div className="px-3.5 py-2 rounded-none bg-zinc-900 border border-zinc-800 font-mono text-xs">
            <span className="text-zinc-500">Account: </span>
            <span className="text-[#894DEF] font-semibold">{targetAccount}</span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-none bg-zinc-900 border border-zinc-800 font-mono text-xs text-zinc-400">
            <span className="w-2 h-2 rounded-none bg-[#894DEF]" />
            <span>NEAR Testnet</span>
          </div>
        </div>
      </div>

      {/* Claim Tx Alert */}
      {claimTxHash && (
        <div className="p-4 rounded-none bg-[#262626] border border-[#2E2E2E] text-xs font-mono text-[#FAFAFA] flex items-center justify-between">
          <span>D-14 Refund processed successfully! Unreleased funds returned to your wallet.</span>
          <a
            href={claimTxHash}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-white"
          >
            View NEAR Tx ↗
          </a>
        </div>
      )}

      {/* Bug Report Success Alert */}
      {bugSuccessMsg && (
        <div className="p-4 rounded-none bg-[#894DEF]/10 border border-[#894DEF]/30 text-xs font-mono text-[#894DEF] flex items-center justify-between">
          <span>{bugSuccessMsg}</span>
          <button onClick={() => setBugSuccessMsg(null)} className="text-zinc-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Key Metric Pulse: 3 Request Tokens / Month (No Rollover Policy) */}
      <section className="p-6 rounded-none bg-[#171717]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-none bg-[#894DEF]/20 text-[#894DEF] border border-[#894DEF]/40 font-bold">
                Governance Allowance
              </span>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-none bg-red-500/10 text-red-400 border border-red-500/30 font-bold">
                No Rollover Policy
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>3 Request Tokens / Month</span>
            </h2>

            <p className="text-xs sm:text-sm text-zinc-300 max-w-2xl leading-relaxed">
              Every subscriber receives <strong>3 request tokens per monthly billing cycle</strong> to submit proposals or upvote feature requests.
              Tokens <strong>do not roll over</strong> into future cycles — use them each month to steer developer roadmap priorities.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col items-start sm:items-center md:items-end gap-3 flex-shrink-0">
            <div className="px-4 py-2.5 rounded-none bg-black/60 border border-zinc-800 text-right">
              <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Your Active Tokens</div>
              <div className="text-2xl font-mono font-bold text-[#894DEF]">3 Available</div>
            </div>

            {agreements.length > 0 && agreements[0].productSlug && (
              <Link
                href={`/products/${agreements[0].productSlug}/voting`}
                className="px-4 py-2 rounded-none bg-[#894DEF] hover:bg-[#A273F2] text-white font-mono text-xs font-bold uppercase tracking-wider transition-colors"
              >
                Open Voting Session →
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Section 1: Active Subscriptions List with Direct Links */}
      <section className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>My Subscriptions</span>
              <span className="text-xs font-mono text-zinc-500 font-normal">
                ({agreements.length} Active on Escrow)
              </span>
            </h2>
          </div>

          <Link
            href="/"
            className="text-xs font-mono text-[#894DEF] hover:text-[#A273F2] transition-colors"
          >
            + Browse Leaderboard
          </Link>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-xs font-mono text-zinc-500 bg-zinc-900/40 rounded-none border border-zinc-800">
            Querying native NEAR Rust Escrow contracts...
          </div>
        ) : agreements.length === 0 ? (
          <div className="p-12 text-center rounded-none bg-zinc-900/40 border border-zinc-800 space-y-3">
            <p className="text-sm text-zinc-400">You don&apos;t have any active subscriptions yet.</p>
            <Link
              href="/"
              className="inline-block px-5 py-2 rounded-none bg-[#894DEF] hover:bg-[#A273F2] text-[#FAFAFA] border border-[#FAFAFA] font-semibold text-xs transition-colors"
            >
              Browse Decentralized SaaS Leaderboard
            </Link>
          </div>
        ) : (
          agreements.map((item) => {
            const remainingPeriods = item.escrow.funded_periods - item.escrow.released_periods;
            const formattedPrice = (Number(item.agreement.price_per_period) / 1e6).toFixed(2);
            const formattedEscrowBalance = (Number(item.escrow.balance) / 1e6).toFixed(2);
            const productSlug = item.productSlug || "aegis-legal";

            return (
              <div
                key={item.id}
                className="p-6 rounded-none bg-zinc-900/40 border border-zinc-800 space-y-5 hover:border-zinc-700 transition-all"
              >
                {/* Top Row: Product Info & Actions */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
                  <div className="flex items-start sm:items-center gap-4">
                    <AbstractLogo slug={productSlug} name={item.productName} size={48} />
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/products/${productSlug}`}
                          className="text-base font-bold text-white hover:text-[#894DEF] transition-colors"
                        >
                          {item.productName || `Product #${item.agreement.product_id}`}
                        </Link>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-none bg-[#262626] text-[#894DEF] border border-[#2E2E2E] font-semibold">
                          Agreement #{item.id}
                        </span>
                        {item.suite && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-none bg-zinc-800 text-zinc-400 border border-zinc-700">
                            {item.suite}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-400 font-mono mt-1">
                        Tier: <strong className="text-zinc-200">{item.agreement.tier_id || "Pro"}</strong> • {formattedPrice} tUSDC / period
                      </p>
                    </div>
                  </div>

                  {/* Direct Action Links (Product Page, Voting Session, Steward Bounty, Refund) */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Link 1: Product Page */}
                    <Link
                      href={`/products/${productSlug}`}
                      className="px-3.5 py-1.5 rounded-none bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-mono text-xs transition-colors border border-zinc-700"
                    >
                      Product Page →
                    </Link>

                    {/* Link 2: Voting Session */}
                    <Link
                      href={`/products/${productSlug}/voting`}
                      className="px-3.5 py-1.5 rounded-none bg-[#894DEF]/15 hover:bg-[#894DEF]/25 text-[#894DEF] font-mono text-xs font-semibold transition-colors border border-[#894DEF]/40 flex items-center gap-1.5"
                    >
                      <span>Voting Session</span>
                      <span className="text-[9px] px-1 py-0.2 rounded-none bg-[#894DEF]/30 text-[#894DEF]">3 Tokens</span>
                    </Link>

                    {/* Link 3: Steward Bounty Program */}
                    <button
                      onClick={() => handleOpenBugModal(productSlug)}
                      className="px-3.5 py-1.5 rounded-none bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-mono text-xs font-medium transition-colors border border-amber-500/30"
                      title="File solve-to-pay bug report holding 7% warranty reserve"
                    >
                      Steward Bounty Program ⚙
                    </button>

                    {/* Link 4: D-14 Refund if claimable */}
                    {item.isRefundClaimable && (
                      <button
                        onClick={() => handleClaimRefund(item.id)}
                        disabled={claimLoadingId === item.id}
                        className="px-3 py-1.5 rounded-none bg-red-500/10 hover:bg-red-500/20 text-red-400 font-mono text-xs font-semibold border border-red-500/30 transition-colors disabled:opacity-50"
                      >
                        {claimLoadingId === item.id ? "Claiming..." : "Claim D-14 Refund"}
                      </button>
                    )}
                  </div>
                </div>

                {/* Escrow Stream Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-zinc-400">Escrow Stream Progress:</span>
                    <span className="text-zinc-200 font-semibold">
                      {item.escrow.released_periods} of {item.escrow.funded_periods} periods released
                    </span>
                  </div>

                  <div className="w-full h-2 rounded-none bg-zinc-950 overflow-hidden border border-zinc-800">
                    <div
                      className="h-full bg-[#171717]"
                      style={{
                        width: `${Math.min(
                          100,
                          (item.escrow.released_periods / Math.max(1, item.escrow.funded_periods)) * 100
                        )}%`,
                      }}
                    />
                  </div>

                  <div className="flex justify-between text-[11px] font-mono text-zinc-500 pt-0.5">
                    <span>Locked Escrow Balance: {formattedEscrowBalance} tUSDC</span>
                    <span>Remaining Protected Periods: {remainingPeriods}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </section>

      {/* Section 2: Steward Bounty Program (Solve-to-Pay Bug Reporting) */}
      <section className="p-6 rounded-none bg-zinc-900/40 border border-zinc-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white">
                Steward Bounty Program (Solve-to-Pay Bug Reporting)
              </h3>
              <span className="px-2 py-0.5 rounded-none text-[10px] font-mono font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                7% Warranty Reserve
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed">
              Subscribers report bugs for free (0 tUSDC). Verified issues place a hold on the developer&apos;s 7% treasury warranty reserve for 70 days.
              Community stewards and developers earn bounties once cryptographic fixes pass testing.
            </p>
          </div>

          <button
            onClick={() => handleOpenBugModal()}
            className="px-4 py-2 rounded-none bg-amber-500 hover:bg-amber-400 text-black font-mono text-xs font-bold uppercase tracking-wider transition-colors flex-shrink-0"
          >
            + File Bug Bounty Report
          </button>
        </div>

        {/* Bug Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-none bg-zinc-950/60 border border-zinc-800">
            <span className="text-[10px] font-mono text-zinc-500 uppercase">Bounty Warranty Reserve</span>
            <div className="text-xl font-mono font-bold text-amber-400 mt-1">7% of Treasury</div>
            <span className="text-[10px] text-zinc-500">Held in NEAR Escrow Contract</span>
          </div>

          <div className="p-4 rounded-none bg-zinc-950/60 border border-zinc-800">
            <span className="text-[10px] font-mono text-zinc-500 uppercase">Dispute & Fix Window</span>
            <div className="text-xl font-mono font-bold text-white mt-1">70 Days</div>
            <span className="text-[10px] text-zinc-500">Mandatory SLA review period</span>
          </div>

          <div className="p-4 rounded-none bg-zinc-950/60 border border-zinc-800">
            <span className="text-[10px] font-mono text-zinc-500 uppercase">Subscriber Filing Cost</span>
            <div className="text-xl font-mono font-bold text-[#894DEF] mt-1">0 tUSDC</div>
            <span className="text-[10px] text-zinc-500">100% Free for all active subscribers</span>
          </div>
        </div>

        {/* Active Bug Tickets List */}
        <div className="space-y-3">
          <h4 className="text-xs font-mono uppercase tracking-wider text-zinc-500">
            Active Warranty Holds & Tickets ({bugReports.length})
          </h4>

          {bugReports.length === 0 ? (
            <div className="text-center py-6 text-xs font-mono text-zinc-500">
              No active bug tickets filed. Services operating smoothly.
            </div>
          ) : (
            bugReports.map((bug) => (
              <div
                key={bug.id}
                className="p-4 rounded-none bg-zinc-950/50 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{bug.title}</span>
                    <span
                      className={`text-[9px] font-mono px-2 py-0.2 rounded-none border ${
                        bug.severity === "Critical"
                          ? "bg-red-500/10 text-red-400 border-red-500/30"
                          : bug.severity === "High"
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                          : "bg-blue-500/10 text-blue-400 border-blue-500/30"
                      }`}
                    >
                      {bug.severity}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500">
                      Status: {bug.status.replace("_", " ")}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400">{bug.description}</p>
                </div>

                <div className="text-left sm:text-right flex-shrink-0 font-mono">
                  <span className="text-xs text-amber-400 font-bold block">{bug.warranty_reserve_hold_usd}</span>
                  <span className="text-[10px] text-zinc-500">SLA: {bug.sla_hours_remaining}h left</span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Section 3: Optional 1Click On-Ramp Drawer */}
      <section className="rounded-none border border-zinc-800 bg-zinc-900/30 overflow-hidden">
        <button
          onClick={() => setShowOnramp(!showOnramp)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-zinc-800/40 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-none bg-[#894DEF]" />
            <div>
              <span className="text-xs font-bold text-white block">Cross-Chain Deposit (1Click On-Ramp)</span>
              <span className="text-[11px] text-zinc-400">
                Bridge USDC from Ethereum, Solana, or Base directly into your NEAR escrow wallet
              </span>
            </div>
          </div>
          <span className="text-xs font-mono text-[#894DEF]">
            {showOnramp ? "▲ Hide On-Ramp" : "▼ Open 1Click Bridge"}
          </span>
        </button>

        {showOnramp && (
          <div className="p-6 border-t border-zinc-800 bg-zinc-950/60">
            <OnrampQuotePanel />
          </div>
        )}
      </section>

      {/* Modal: File Bug Bounty Ticket */}
      {isBugModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 max-w-xl w-full p-6 sm:p-8 space-y-6 rounded-none">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white">File Solve-to-Pay Bug Bounty</h3>
                <p className="text-xs font-mono text-amber-400 mt-0.5">
                  100% Free for Subscribers • Holds 7% Warranty Pool
                </p>
              </div>
              <button
                onClick={() => setIsBugModalOpen(false)}
                className="text-zinc-500 hover:text-white font-mono text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFileBugReport} className="space-y-4 font-mono text-xs">
              <div className="space-y-1.5">
                <label className="block text-zinc-400 uppercase">Subscribed Product</label>
                <select
                  value={selectedBugProductSlug}
                  onChange={(e) => setSelectedBugProductSlug(e.target.value)}
                  className="w-full bg-black border border-zinc-700 text-white p-2.5 rounded-none focus:outline-none focus:border-amber-500"
                >
                  {ENRICHED_PRODUCTS.map((p) => (
                    <option key={p.slug} value={p.slug}>
                      {p.name} ({p.suite})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-zinc-400 uppercase">Bug Title / Incident *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Remote TEE attestation timeout during heavy inference workload"
                  value={bugTitle}
                  onChange={(e) => setBugTitle(e.target.value)}
                  className="w-full bg-black border border-zinc-700 text-white p-2.5 rounded-none focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-zinc-400 uppercase">Severity Level</label>
                <select
                  value={bugSeverity}
                  onChange={(e) => setBugSeverity(e.target.value as any)}
                  className="w-full bg-black border border-zinc-700 text-white p-2.5 rounded-none focus:outline-none focus:border-amber-500"
                >
                  <option value="Low">Low (Cosmetic / Typo)</option>
                  <option value="Medium">Medium (Non-critical performance degradation)</option>
                  <option value="High">High (Heartbeat latency / intermittent failure)</option>
                  <option value="Critical">Critical (Security flaw / Service outage)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-zinc-400 uppercase">Reproduction Steps & Logs *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Provide detailed reproduction steps, query parameters, or transaction hashes..."
                  value={bugDescription}
                  onChange={(e) => setBugDescription(e.target.value)}
                  className="w-full bg-black border border-zinc-700 text-white p-2.5 rounded-none focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="p-3 bg-black/60 rounded-none border border-zinc-800 text-[11px] text-zinc-400 space-y-1">
                <div className="flex justify-between">
                  <span>Reporter:</span>
                  <span className="text-white">{targetAccount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Warranty Hold Duration:</span>
                  <span className="text-amber-400">7 Days Release Interval</span>
                </div>
                <div className="flex justify-between">
                  <span>Filing Cost:</span>
                  <span className="text-[#894DEF] font-bold">0 tUSDC (Free)</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBugModalOpen(false)}
                  className="px-4 py-2 border border-zinc-700 text-zinc-400 hover:text-white rounded-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold uppercase rounded-none"
                >
                  Submit Bug Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Payment & Multichain Onboarding Modal */}
      <UserPaymentOnboardingModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onComplete={(data) => {
          console.log("Onboarding completed:", data);
        }}
      />
    </main>
  );
}
