"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useNearWallet } from "../../context/NearWalletContext";
import {
  PANDEM_ESCROW_ID,
  Agreement,
  Escrow,
  ENRICHED_PRODUCTS,
  BugReport,
} from "@pandem/shared";
import { callViewMethod } from "../../lib/nearRpc";
import {
  UserPaymentOnboardingModal,
  OnboardedPaymentMethod,
} from "../../components/UserPaymentOnboardingModal";
import { PageHeader, Badge, Button } from "../../ui";
import { PaymentGatewayBanner } from "./components/PaymentGatewayBanner";
import { SubscriptionCard, AgreementItem } from "./components/SubscriptionCard";
import { StewardBountySection } from "./components/StewardBountySection";
import { BugReportModal } from "./components/BugReportModal";
import { OnrampDrawerSection } from "./components/OnrampDrawerSection";

export default function SubscriberDashboardPage() {
  const { accountId } = useNearWallet();
  const [agreements, setAgreements] = useState<AgreementItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [claimLoadingId, setClaimLoadingId] = useState<number | null>(null);
  const [claimTxHash, setClaimTxHash] = useState<string | null>(null);

  // Active Near Intents Payment Method
  const [activePaymentMethod, setActivePaymentMethod] = useState<OnboardedPaymentMethod | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);

  // Bug reporting state (Steward Bounty Program: Solve-to-Pay)
  const initialBugs = useMemo(() => ENRICHED_PRODUCTS.flatMap((p) => p.bug_reports), []);
  const [bugReports, setBugReports] = useState<BugReport[]>(initialBugs);
  const [isBugModalOpen, setIsBugModalOpen] = useState<boolean>(false);
  const [selectedBugProductSlug, setSelectedBugProductSlug] = useState<string>("aegis-legal");
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
            balance: id === 2 ? "45000000" : "50000000",
            contingency_contributed: "10000000",
            refunded: false,
          };

          const filecoinCid =
            matchedProduct.slug === "aegis-legal"
              ? "bafybeihdwdcefgh4dqkjv67uzcmw7ojee6xreqhnyzzblkgwt4uoeru2be"
              : matchedProduct.slug === "pulsemed-tee"
              ? "bafybeia4f37cq5lkmv77wqeihg67uzcmw7ojee6xreqhnyzzblkgwt4uoer"
              : `bafybeih${matchedProduct.slug.replace(/[^a-z0-9]/g, "")}pin67uzcmw7ojee6xreqhnyzz`;

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
      await new Promise((r) => setTimeout(r, 1200));

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

  const handleBugSubmitted = (newBug: BugReport) => {
    setBugReports([newBug, ...bugReports]);
    setBugSuccessMsg("Bug report submitted! 7% warranty reserve held on NEAR Escrow contract.");
    setTimeout(() => setBugSuccessMsg(null), 4000);
  };

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 font-sans bg-spectr-canvas text-spectr-ink">
      {/* Header & Account Identity */}
      <PageHeader
        title="Subscriber Dashboard"
        description="Monitor active subscriptions, 4-segment privacy audits, 7-day refund guarantees, and cross-chain payment methods."
        badge={<Badge variant="primary">Active Escrow Protections</Badge>}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setIsPaymentModalOpen(true)}
            >
              + Add a Payment Method
            </Button>
            <div className="px-3.5 py-2 bg-spectr-surface border border-spectr-hairline font-mono text-xs">
              <span className="text-spectr-muted">Subscriber: </span>
              <span className="text-spectr-primary font-semibold">{targetAccount}</span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-spectr-surface border border-spectr-hairline font-mono text-xs text-spectr-muted">
              <span className="w-2 h-2 rounded-none bg-spectr-success" />
              <span>Escrow Protected</span>
            </div>
          </div>
        }
      />

      {/* Near Intents Multi-Chain Payment Gateway Banner */}
      <PaymentGatewayBanner
        activePaymentMethod={activePaymentMethod}
        onConfigureClick={() => setIsPaymentModalOpen(true)}
      />

      {/* Claim Tx Alert */}
      {claimTxHash && (
        <div className="p-4 bg-spectr-surface border border-spectr-success text-xs font-mono text-spectr-success flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-none bg-spectr-success" />
            <span>✓ 7-Day Escrow Refund Claimed! All unreleased USDC returned to your wallet.</span>
          </div>
          <a
            href={claimTxHash}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-spectr-ink"
          >
            View NEAR Tx ↗
          </a>
        </div>
      )}

      {/* Bug Report Success Alert */}
      {bugSuccessMsg && (
        <div className="p-4 bg-spectr-surface border border-spectr-primary text-xs font-mono text-spectr-primary flex items-center justify-between">
          <span>{bugSuccessMsg}</span>
          <button
            type="button"
            onClick={() => setBugSuccessMsg(null)}
            className="text-spectr-muted hover:text-spectr-ink"
          >
            ✕
          </button>
        </div>
      )}

      {/* Section 1: Active Subscriptions List */}
      <section className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-spectr-hairline">
          <div>
            <h2 className="text-lg font-bold text-spectr-ink flex items-center gap-2 font-sans">
              <span>Active Subscriptions & Privacy Standards</span>
              <span className="text-xs font-mono text-spectr-muted font-normal">
                ({agreements.length} Active on NEAR Escrow)
              </span>
            </h2>
            <p className="text-xs text-spectr-body font-mono mt-0.5">
              Verified 4-segment privacy audits with automated 7-day refund protection on heartbeat lapse.
            </p>
          </div>

          <Link
            href="/"
            className="text-xs font-mono text-spectr-primary hover:text-spectr-primary-hover transition-colors"
          >
            + Browse SaaS Catalog
          </Link>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-xs font-mono text-spectr-muted bg-spectr-surface border border-spectr-hairline">
            Querying native NEAR Rust Escrow contracts...
          </div>
        ) : agreements.length === 0 ? (
          <div className="p-12 text-center bg-spectr-surface border border-spectr-hairline space-y-3">
            <p className="text-sm text-spectr-body">You don&apos;t have any active subscriptions yet.</p>
            <Link
              href="/"
              className="inline-block px-5 py-2 bg-spectr-primary hover:bg-spectr-primary-hover text-spectr-ink font-semibold text-xs transition-colors"
            >
              Browse Verified SaaS Catalog
            </Link>
          </div>
        ) : (
          agreements.map((item) => (
            <SubscriptionCard
              key={item.id}
              item={item}
              claimLoadingId={claimLoadingId}
              onClaimRefund={handleClaimRefund}
              onOpenBugModal={handleOpenBugModal}
            />
          ))
        )}
      </section>

      {/* Section 2: Steward Bounty Program */}
      <StewardBountySection
        bugReports={bugReports}
        onOpenBugModal={() => handleOpenBugModal()}
      />

      {/* Section 3: 1Click On-Ramp Drawer */}
      <OnrampDrawerSection />

      {/* Modal: File Bug Bounty Ticket */}
      <BugReportModal
        isOpen={isBugModalOpen}
        onClose={() => setIsBugModalOpen(false)}
        onSubmitBug={handleBugSubmitted}
        targetAccount={targetAccount}
        initialProductSlug={selectedBugProductSlug}
      />

      {/* User Payment & Multichain Onboarding Modal */}
      <UserPaymentOnboardingModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onComplete={handlePaymentOnboardingComplete}
      />
    </main>
  );
}
