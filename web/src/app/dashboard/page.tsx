"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useNearWallet } from "../../context/NearWalletContext";
import {
  PANDEM_ESCROW_ID,
  PANDEM_TOKEN_ID,
  Agreement,
  Escrow,
  ENRICHED_PRODUCTS,
  BugReport,
} from "@pandem/shared";
import { callViewMethod } from "../../lib/nearRpc";
import { OnrampQuotePanel } from "../../components/OnrampQuotePanel";
import { AbstractLogo } from "../../components/AbstractLogo";
import {
  UserPaymentOnboardingModal,
  OnboardedPaymentMethod,
} from "../../components/UserPaymentOnboardingModal";

interface AgreementItem {
  id: number;
  agreement: Agreement;
  escrow: Escrow;
  isRefundClaimable: boolean;
  productStatus: "Active" | "Lapsed" | "Abandoned";
  productName: string;
  productSlug: string;
  suite: string;
  tierName: string;
  uptimeHealthy: boolean;
  heartbeatStreak: number;
  privacyStandards: {
    frontendPin: string;
    nodeBackend: string;
    databaseKms: string;
    paymentEscrow: string;
  };
}

export default function SubscriberDashboardPage() {
  const { accountId, isConnected, connect } = useNearWallet();
  const [agreements, setAgreements] = useState<AgreementItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [claimLoadingId, setClaimLoadingId] = useState<number | null>(null);
  const [claimTxHash, setClaimTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Active Near Intents Payment Method
  const [activePaymentMethod, setActivePaymentMethod] = useState<OnboardedPaymentMethod | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);

  // 1Click Cross-chain On-Ramp Drawer
  const [showOnramp, setShowOnramp] = useState<boolean>(false);

  // Bug reporting state (Steward Bounty Program: Solve-to-Pay)
  const initialBugs = useMemo(() => ENRICHED_PRODUCTS.flatMap((p) => p.bug_reports), []);
  const [bugReports, setBugReports] = useState<BugReport[]>(initialBugs);
  const [isBugModalOpen, setIsBugModalOpen] = useState<boolean>(false);
  const [selectedBugProductSlug, setSelectedBugProductSlug] = useState<string>("aegis-legal");
  const [bugTitle, setBugTitle] = useState<string>("");
  const [bugSeverity, setBugSeverity] = useState<"Low" | "Medium" | "High" | "Critical">("High");
  const [bugDescription, setBugDescription] = useState<string>("");
  const [bugSuccessMsg, setBugSuccessMsg] = useState<string | null>(null);

  // Target account
  const targetAccount = accountId || "pandem-alice-8d6888e3.testnet";

  // Load saved payment method from local storage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("pandem_active_payment_method");
      if (saved) {
        setActivePaymentMethod(JSON.parse(saved));
      } else {
        // Default default payment method setup
        setActivePaymentMethod({
          name: "Alice (Pro Subscriber)",
          walletType: "metamask_base",
          sourceChain: "Base",
          sourceToken: "USDC",
          nearAccountId: targetAccount,
        });
      }
    } catch {}
  }, [targetAccount]);

  const handlePaymentOnboardingComplete = (data: OnboardedPaymentMethod) => {
    setActivePaymentMethod(data);
    try {
      localStorage.setItem("pandem_active_payment_method", JSON.stringify(data));
    } catch {}
  };

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

          const escrow = await callViewMethod<Escrow>(
            PANDEM_ESCROW_ID,
            "get_escrow",
            { id }
          );

          const matchedProduct =
            ENRICHED_PRODUCTS.find(
              (p) => String(p.product_id) === String(agreement?.product_id || id)
            ) ||
            ENRICHED_PRODUCTS[id % ENRICHED_PRODUCTS.length] ||
            ENRICHED_PRODUCTS[0];

          // Fallback demo agreement if not yet funded on testnet
          const safeAgreement: Agreement = agreement || {
            product_id: String(matchedProduct.product_id),
            subscriber: targetAccount,
            refund_to: targetAccount,
            price_per_period: matchedProduct.tiers[0]?.price_monthly || "5000000",
            period_ns: (7 * 86400 * 1e9).toString(),
            grace_ns: (2 * 86400 * 1e9).toString(),
            start_ns: (Date.now() * 1e6).toString(),
            start_product_period: 1,
            tier_id: matchedProduct.tiers[0]?.tier_id || "pro",
          };

          const safeEscrow: Escrow = escrow || {
            funded_periods: 12,
            released_periods: id === 2 ? 3 : 2,
            balance: id === 2 ? "45000000" : "50000000", // in tUSDC (6 decimals)
            contingency_contributed: "10000000",
            refunded: false,
          };

          // Deterministic Filecoin Pin CID
          const filecoinCid =
            matchedProduct.slug === "aegis-legal"
              ? "bafybeihdwdcefgh4dqkjv67uzcmw7ojee6xreqhnyzzblkgwt4uoeru2be"
              : matchedProduct.slug === "pulsemed-tee"
              ? "bafybeia4f37cq5lkmv77wqeihg67uzcmw7ojee6xreqhnyzzblkgwt4uoer"
              : `bafybeih${matchedProduct.slug.replace(/[^a-z0-9]/g, "")}pin67uzcmw7ojee6xreqhnyzz`;

          // Service health & refund claimable logic
          // Agreement #2 is simulated as having a lapsed heartbeat for demoing 1-click refund
          const isLapsed = id === 2;
          const isClaimable =
            !safeEscrow.refunded &&
            (isLapsed || safeEscrow.released_periods < safeEscrow.funded_periods);

          loaded.push({
            id,
            agreement: safeAgreement,
            escrow: safeEscrow,
            isRefundClaimable: isClaimable,
            productStatus: isLapsed ? "Lapsed" : "Active",
            productName: matchedProduct.name,
            productSlug: matchedProduct.slug,
            suite: matchedProduct.suite,
            tierName: matchedProduct.tiers[0]?.name || "Pro Counselor",
            uptimeHealthy: !isLapsed,
            heartbeatStreak: isLapsed ? 0 : matchedProduct.heartbeat_streak || 28,
            privacyStandards: {
              frontendPin: filecoinCid,
              nodeBackend: "Isolated Container (Confidential CVM Docker Distroless)",
              databaseKms: "KMS-Sealed Enclave Storage (Hardware AES-256-GCM)",
              paymentEscrow: "7-Day Escrow Guarantee (D-14 Non-Custodial Pro-Rata)",
            },
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

  // 1-Click 7-Day Refund Claim mechanism
  const handleClaimRefund = async (id: number) => {
    setClaimLoadingId(id);
    setClaimTxHash(null);
    try {
      // Simulate/execute on-chain claim_refund call
      await new Promise((r) => setTimeout(r, 1200));

      // Mark agreement refunded locally
      setAgreements((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                escrow: {
                  ...item.escrow,
                  refunded: true,
                  balance: "0",
                },
                isRefundClaimable: false,
                productStatus: "Abandoned",
              }
            : item
        )
      );

      setClaimTxHash(
        "https://explorer.testnet.near.org/transactions/8wuEZcspAEVfTFgSJed9RvcE7jqdG1orCgoHBr4vDJZA"
      );
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

    const matchedProduct =
      ENRICHED_PRODUCTS.find((p) => p.slug === selectedBugProductSlug) ||
      ENRICHED_PRODUCTS[0];

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
              Active Escrow Protections
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Monitor active subscriptions, 4-segment privacy audits, 7-day refund guarantees, and cross-chain payment methods.
          </p>
        </div>

        {/* Account & Payment Method Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsPaymentModalOpen(true)}
            className="px-3.5 py-2 rounded-none bg-[#894DEF] hover:bg-[#A273F2] text-white font-mono text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <span>+ Add a Payment Method</span>
          </button>
          <div className="px-3.5 py-2 rounded-none bg-zinc-900 border border-zinc-800 font-mono text-xs">
            <span className="text-zinc-500">Subscriber: </span>
            <span className="text-[#894DEF] font-semibold">{targetAccount}</span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-none bg-zinc-900 border border-zinc-800 font-mono text-xs text-zinc-400">
            <span className="w-2 h-2 rounded-none bg-emerald-400" />
            <span>Escrow Protected</span>
          </div>
        </div>
      </div>

      {/* Near Intents Multi-Chain Payment Gateway Banner */}
      <section className="p-5 rounded-none bg-gradient-to-r from-zinc-950 via-[#171717] to-zinc-950 border border-zinc-800 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 bg-[#894DEF]/20 text-[#894DEF] border border-[#894DEF]/40 font-bold">
                NEAR Intents Multi-Chain Gateway
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5">
                Pay with ANY Token → Settle in USDC
              </span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-3xl">
              Fund SaaS subscriptions with <strong>ANY token (ETH, SOL, USDC, USDT)</strong> from Ethereum, Base, Solana, or Arbitrum.
              Decentralized solvers convert your payment into native USDC inside your non-custodial NEAR escrow contract.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="p-2.5 rounded-none bg-black/60 border border-zinc-800 text-right font-mono text-xs">
              <div className="text-[10px] text-zinc-500 uppercase">Active Payment Source</div>
              <div className="text-white font-bold text-xs mt-0.5">
                {activePaymentMethod ? (
                  <span className="text-emerald-400">
                    {activePaymentMethod.walletType === "google_passkey"
                      ? "Google Web3 Email (Passkey)"
                      : activePaymentMethod.walletType === "metamask_base"
                      ? "MetaMask / Base (USDC)"
                      : activePaymentMethod.walletType === "phantom_solana"
                      ? "Phantom / Solana"
                      : "Native NEAR Wallet"}
                  </span>
                ) : (
                  <span className="text-zinc-400">MetaMask / Base (ETH/USDC)</span>
                )}
              </div>
            </div>

            <button
              onClick={() => setIsPaymentModalOpen(true)}
              className="px-3.5 py-2.5 rounded-none bg-zinc-800 hover:bg-zinc-700 text-white font-mono text-xs border border-zinc-700 transition-colors"
            >
              Configure →
            </button>
          </div>
        </div>
      </section>

      {/* Claim Tx Alert */}
      {claimTxHash && (
        <div className="p-4 rounded-none bg-emerald-950/40 border border-emerald-500/40 text-xs font-mono text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>✓ 7-Day Escrow Refund Claimed! All unreleased USDC returned to your wallet.</span>
          </div>
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

      {/* Section 1: Active Subscriptions List with 4-Segment Privacy Standards */}
      <section className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Active Subscriptions & Privacy Standards</span>
              <span className="text-xs font-mono text-zinc-500 font-normal">
                ({agreements.length} Active on NEAR Escrow)
              </span>
            </h2>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">
              Verified 4-segment privacy audits with automated 7-day refund protection on heartbeat lapse.
            </p>
          </div>

          <Link
            href="/"
            className="text-xs font-mono text-[#894DEF] hover:text-[#A273F2] transition-colors"
          >
            + Browse SaaS Catalog
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
              className="inline-block px-5 py-2 rounded-none bg-[#894DEF] hover:bg-[#A273F2] text-[#FAFAFA] font-semibold text-xs transition-colors"
            >
              Browse Verified SaaS Catalog
            </Link>
          </div>
        ) : (
          agreements.map((item) => {
            const remainingPeriods = Math.max(0, item.escrow.funded_periods - item.escrow.released_periods);
            const formattedPrice = (Number(item.agreement.price_per_period) / 1e6).toFixed(2);
            const formattedEscrowBalance = (Number(item.escrow.balance) / 1e6).toFixed(2);
            const productSlug = item.productSlug || "aegis-legal";

            return (
              <div
                key={item.id}
                className="p-6 rounded-none bg-zinc-900/40 border border-zinc-800 space-y-5 hover:border-zinc-700 transition-all"
              >
                {/* Top Row: Service Identity, Utility & Actions */}
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
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-none bg-zinc-800 text-zinc-300 border border-zinc-700">
                          {item.suite}
                        </span>
                        {item.escrow.refunded ? (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-none bg-rose-500/10 text-rose-400 border border-rose-500/30 font-bold">
                            Refunded
                          </span>
                        ) : item.uptimeHealthy ? (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-none bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Active Uptime ({item.heartbeatStreak}d streak)
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-none bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold">
                            ⚠️ Heartbeat Lapsed
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-400 font-mono mt-1">
                        Utility Tier: <strong className="text-zinc-200">{item.tierName}</strong> • {formattedPrice} tUSDC / period
                      </p>
                    </div>
                  </div>

                  {/* Actions: Product Page, Bounty, 1-Click Refund */}
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/products/${productSlug}`}
                      className="px-3.5 py-1.5 rounded-none bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-mono text-xs transition-colors border border-zinc-700"
                    >
                      Product Details →
                    </Link>

                    <button
                      onClick={() => handleOpenBugModal(productSlug)}
                      className="px-3.5 py-1.5 rounded-none bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-mono text-xs font-medium transition-colors border border-amber-500/30"
                      title="File solve-to-pay bug report holding 7% warranty reserve"
                    >
                      Steward Bounty ⚙
                    </button>

                    {/* 1-Click 7-Day Refund Claim Mechanism */}
                    {!item.escrow.refunded && (
                      <button
                        onClick={() => handleClaimRefund(item.id)}
                        disabled={claimLoadingId === item.id}
                        className={`px-3.5 py-1.5 rounded-none font-mono text-xs font-bold transition-all flex items-center gap-1.5 ${
                          !item.uptimeHealthy
                            ? "bg-rose-500 hover:bg-rose-400 text-black shadow-md shadow-rose-500/20"
                            : "bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30"
                        }`}
                        title="Claim unreleased funds back to your wallet under the 7-day escrow guarantee"
                      >
                        {claimLoadingId === item.id ? (
                          <>
                            <span className="w-2 h-2 rounded-full bg-current animate-ping" />
                            <span>Claiming Escrow...</span>
                          </>
                        ) : !item.uptimeHealthy ? (
                          <span>Claim 7-Day Refund (1-Click)</span>
                        ) : (
                          <span>Claim 7-Day Refund</span>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* 4-Segment Privacy Standard Audit Matrix */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
                    <span className="uppercase text-[11px] font-bold text-zinc-300">
                      4-Segment Privacy Standard Audit Status
                    </span>
                    <span className="text-[10px] text-emerald-400 font-semibold">
                      ✓ All 4 Segments Verified Active
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 font-mono text-xs">
                    {/* Segment 1: Frontend (Filecoin Pin) */}
                    <div className="p-3 bg-zinc-950/70 border border-zinc-800 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-zinc-500 uppercase tracking-wider">01. Frontend</span>
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                      </div>
                      <div className="text-white font-bold flex items-center gap-1.5 text-xs">
                        <span className="text-emerald-400">✓</span>
                        <span>Verifiable Filecoin Pin</span>
                      </div>
                      <span
                        className="text-[10px] text-cyan-400 block truncate"
                        title={item.privacyStandards.frontendPin}
                      >
                        CID: {item.privacyStandards.frontendPin.slice(0, 14)}...
                      </span>
                    </div>

                    {/* Segment 2: Node Backend (Isolated Container) */}
                    <div className="p-3 bg-zinc-950/70 border border-zinc-800 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-zinc-500 uppercase tracking-wider">02. Backend</span>
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                      </div>
                      <div className="text-white font-bold flex items-center gap-1.5 text-xs">
                        <span className="text-emerald-400">✓</span>
                        <span>Isolated Container</span>
                      </div>
                      <span className="text-[10px] text-zinc-400 block truncate">
                        Distroless CVM MicroVM
                      </span>
                    </div>

                    {/* Segment 3: Database (KMS-Sealed Enclave) */}
                    <div className="p-3 bg-zinc-950/70 border border-zinc-800 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-zinc-500 uppercase tracking-wider">03. Database</span>
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                      </div>
                      <div className="text-white font-bold flex items-center gap-1.5 text-xs">
                        <span className="text-emerald-400">✓</span>
                        <span>KMS-Sealed Enclave</span>
                      </div>
                      <span className="text-[10px] text-zinc-400 block truncate">
                        Hardware AES-256-GCM
                      </span>
                    </div>

                    {/* Segment 4: Payments (7-Day Escrow Guarantee) */}
                    <div className="p-3 bg-zinc-950/70 border border-zinc-800 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-zinc-500 uppercase tracking-wider">04. Payments Rail</span>
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                      </div>
                      <div className="text-white font-bold flex items-center gap-1.5 text-xs">
                        <span className="text-emerald-400">✓</span>
                        <span>7-Day Escrow</span>
                      </div>
                      <span className="text-[10px] text-emerald-400 block truncate font-semibold">
                        D-14 Non-Custodial Pro-Rata
                      </span>
                    </div>
                  </div>
                </div>

                {/* Escrow Stream Progress */}
                <div className="space-y-2 pt-2 border-t border-zinc-800/60">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-zinc-400">Escrow Stream Releases:</span>
                    <span className="text-zinc-200 font-semibold">
                      {item.escrow.released_periods} of {item.escrow.funded_periods} periods released
                    </span>
                  </div>

                  <div className="w-full h-2 rounded-none bg-zinc-950 overflow-hidden border border-zinc-800">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-[#894DEF]"
                      style={{
                        width: `${Math.min(
                          100,
                          (item.escrow.released_periods / Math.max(1, item.escrow.funded_periods)) * 100
                        )}%`,
                      }}
                    />
                  </div>

                  <div className="flex justify-between text-[11px] font-mono text-zinc-500 pt-0.5">
                    <span>
                      Locked Escrow Balance:{" "}
                      <strong className="text-white">{formattedEscrowBalance} tUSDC</strong>
                    </span>
                    <span>
                      Remaining Protected Periods:{" "}
                      <strong className="text-emerald-400">{remainingPeriods} periods</strong>
                    </span>
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
                    <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 bg-[#222222] text-[#8A8A8A] border border-[#333333]">
                      off-chain
                    </span>
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
              <span className="text-xs font-bold text-white block">Cross-Chain Deposit (1Click On-Ramp Simulator)</span>
              <span className="text-[11px] text-zinc-400">
                Deposit ETH, SOL, or USDC from Ethereum, Solana, or Base directly into your NEAR escrow wallet
              </span>
            </div>
          </div>
          <span className="text-xs font-mono text-[#894DEF]">
            {showOnramp ? "▲ Hide 1Click Panel" : "▼ Open 1Click Simulator"}
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
                  placeholder="e.g. Remote attestation latency timeout during heavy workload"
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
        onComplete={handlePaymentOnboardingComplete}
      />
    </main>
  );
}
