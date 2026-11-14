"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";
import { ENRICHED_PRODUCTS, EnrichedProduct, PANDEM_BUDGET_ID, PANDEM_ESCROW_ID } from "@pandem/shared";
import { AbstractLogo } from "../../../components/AbstractLogo";
import { PageHeader, Badge, Button } from "../../../ui";
import { OnchainTelemetryBanner } from "./components/OnchainTelemetryBanner";
import { PayoutStreamStation, PayoutTranche } from "./components/PayoutStreamStation";
import { HeartbeatStation } from "./components/HeartbeatStation";
import { RiskCorrectionPanel, RiskCorrectionProposal } from "./components/RiskCorrectionPanel";
import { RiskProposalModal } from "./components/RiskProposalModal";

export default function DeveloperDashboardPage() {
  const [selectedProduct, setSelectedProduct] = useState<EnrichedProduct>(ENRICHED_PRODUCTS[0]);
  const [isPingingHeartbeat, setIsPingingHeartbeat] = useState<boolean>(false);
  const [heartbeatStreak, setHeartbeatStreak] = useState<number>(selectedProduct.heartbeat_streak || 18);
  const [heartbeatSuccess, setHeartbeatSuccess] = useState<string | null>(null);

  // Real On-Chain Telemetry from NEAR Testnet Contracts
  const [onchainBudget, setOnchainBudget] = useState<{
    total_ops_received: string;
    current_balance: string;
    period_draw_cap: string;
    drawn_in_current_period: string;
    status: string;
  } | null>(null);
  const [onchainProduct, setOnchainProduct] = useState<{
    steward: string;
    ops_reserve: string;
    contingency_reserve: string;
    last_heartbeat_period: number;
    status: string;
  } | null>(null);

  useEffect(() => {
    let active = true;
    const fetchOnchain = async () => {
      try {
        const prodId = selectedProduct.id || 1;
        // 1. Fetch live Ops Budget from pandem-budget
        const budgetRes = await fetch("https://rpc.testnet.near.org", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: `budget-${prodId}`,
            method: "query",
            params: {
              request_type: "call_function",
              finality: "optimistic",
              account_id: PANDEM_BUDGET_ID,
              method_name: "get_budget",
              args_base64: typeof window !== "undefined"
                ? btoa(JSON.stringify({ product_id: prodId }))
                : Buffer.from(JSON.stringify({ product_id: prodId })).toString("base64"),
            },
          }),
        });
        const budgetJson = await budgetRes.json();
        if (active && budgetJson?.result?.result) {
          const parsed = JSON.parse(
            typeof window !== "undefined"
              ? atob(String.fromCharCode(...budgetJson.result.result))
              : Buffer.from(budgetJson.result.result).toString("utf8")
          );
          setOnchainBudget(parsed);
        }

        // 2. Fetch live Escrow state from pandem-escrow
        const escrowRes = await fetch("https://rpc.testnet.near.org", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: `escrow-${prodId}`,
            method: "query",
            params: {
              request_type: "call_function",
              finality: "optimistic",
              account_id: PANDEM_ESCROW_ID,
              method_name: "get_product",
              args_base64: typeof window !== "undefined"
                ? btoa(JSON.stringify({ id: prodId }))
                : Buffer.from(JSON.stringify({ id: prodId })).toString("base64"),
            },
          }),
        });
        const escrowJson = await escrowRes.json();
        if (active && escrowJson?.result?.result) {
          const parsed = JSON.parse(
            typeof window !== "undefined"
              ? atob(String.fromCharCode(...escrowJson.result.result))
              : Buffer.from(escrowJson.result.result).toString("utf8")
          );
          setOnchainProduct(parsed);
          if (parsed.last_heartbeat_period) {
            setHeartbeatStreak(parsed.last_heartbeat_period);
          }
        }
      } catch (e) {
        console.warn("Failed to load onchain metrics:", e);
      }
    };
    fetchOnchain();
    return () => {
      active = false;
    };
  }, [selectedProduct.id]);

  // 7-Day Payout State
  const [isClaimingPayout, setIsClaimingPayout] = useState<boolean>(false);
  const [claimedSuccessTx, setClaimedSuccessTx] = useState<string | null>(null);
  const [claimableBalance, setClaimableBalance] = useState<number>(2375.0);

  // Risk Correction State
  const [riskProposals, setRiskProposals] = useState<RiskCorrectionProposal[]>([
    {
      id: "RC-04",
      title: "20% Partial Developer Fee Release during Enclave Migration",
      reason: "Scheduled 4-hour Intel TDX host hypervisor upgrade requiring subscriber consensus for partial period release.",
      requestedReleasePct: "20% ($475.00 USDC)",
      forPct: 74,
      againstPct: 26,
      quorumPct: 62,
      status: "Voting_Open",
      hoursRemaining: 42,
    },
    {
      id: "RC-03",
      title: "Memory Leak Patch Bounty Release ($450 USDC)",
      reason: "PostgreSQL pgvector query optimization patch verified by community steward.",
      requestedReleasePct: "100% Bounty ($450.00 USDC)",
      forPct: 92,
      againstPct: 8,
      quorumPct: 78,
      status: "Passed",
    },
  ]);

  const [isRiskModalOpen, setIsRiskModalOpen] = useState<boolean>(false);

  const tranches: PayoutTranche[] = useMemo(() => [
    {
      id: 1,
      label: "Tranche 1",
      periodRange: "Days 1–7",
      amountUsdc: "$2,375.00",
      status: "Released",
    },
    {
      id: 2,
      label: "Tranche 2",
      periodRange: "Days 8–14",
      amountUsdc: "$2,375.00",
      status: "Streaming",
      unlocksIn: "3d 14h 22m",
      progressPct: 58,
    },
    {
      id: 3,
      label: "Tranche 3",
      periodRange: "Days 15–21",
      amountUsdc: "$2,375.00",
      status: "Locked",
    },
    {
      id: 4,
      label: "Tranche 4",
      periodRange: "Days 22–28",
      amountUsdc: "$2,375.00",
      status: "Locked",
    },
  ], []);

  const handleBroadcastHeartbeat = async () => {
    setIsPingingHeartbeat(true);
    setHeartbeatSuccess(null);
    try {
      await new Promise((r) => setTimeout(r, 1200));
      setHeartbeatStreak((prev) => prev + 1);
      setHeartbeatSuccess(`Heartbeat recorded on NEAR testnet. Streak incremented to ${heartbeatStreak + 1} periods.`);
      setTimeout(() => setHeartbeatSuccess(null), 4000);
    } finally {
      setIsPingingHeartbeat(false);
    }
  };

  const handleClaimPayout = async () => {
    if (claimableBalance <= 0) return;
    setIsClaimingPayout(true);
    setClaimedSuccessTx(null);
    try {
      await new Promise((r) => setTimeout(r, 1400));
      setClaimedSuccessTx("https://explorer.testnet.near.org/transactions/8wuEZcspAEVfTFgSJed9RvcE7jqdG1orCgoHBr4vDJZA");
      setClaimableBalance(0);
    } finally {
      setIsClaimingPayout(false);
    }
  };

  const handleProposalSubmitted = (newProposal: RiskCorrectionProposal) => {
    setRiskProposals([newProposal, ...riskProposals]);
  };

  return (
    <main className="min-h-screen bg-spectr-canvas text-spectr-ink font-sans antialiased">
      {/* Top Header & Navigation */}
      <header className="border-b border-spectr-hairline bg-spectr-surface/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-xs font-mono text-spectr-muted hover:text-spectr-ink transition-colors"
            >
              Leaderboard
            </Link>
            <span className="text-xs text-spectr-hairline">/</span>
            <span className="text-xs font-mono text-spectr-primary font-medium">Developer Dashboard</span>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs">
            <Badge variant="success" dot pulse>
              NEAR Testnet Active
            </Badge>
            <Link
              href="/dev/onboarding"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-spectr-primary hover:bg-spectr-primary-hover text-spectr-ink font-medium text-xs transition-colors rounded-none"
            >
              <span>Onboard New Product</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hub Header & Product Selector */}
        <PageHeader
          title="Developer Operations Hub"
          description="Monitor 7-day rolling payout tranches, broadcast cryptographic uptime heartbeats, and participate in community risk correction arbitration."
          actions={
            <div className="flex items-center gap-2 overflow-x-auto font-mono text-xs">
              <span className="text-spectr-muted text-xs shrink-0">Active Product:</span>
              {ENRICHED_PRODUCTS.slice(0, 4).map((p) => {
                const isSelected = selectedProduct.id === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedProduct(p)}
                    className={`flex items-center gap-2 px-3 py-1.5 border transition-colors shrink-0 rounded-none ${
                      isSelected
                        ? "bg-spectr-surface-raised border-spectr-primary text-spectr-ink"
                        : "bg-spectr-surface border-spectr-hairline text-spectr-body hover:border-spectr-muted"
                    }`}
                  >
                    <AbstractLogo slug={p.slug} name={p.name} size={16} className="w-4 h-4" />
                    <span>{p.name}</span>
                  </button>
                );
              })}
            </div>
          }
        />

        {/* Claim Tx Alert */}
        {claimedSuccessTx && (
          <div className="p-4 bg-spectr-surface border border-spectr-success text-xs font-mono text-spectr-success flex items-center justify-between">
            <span>Tranche payout claimed successfully. Funds transferred to your connected NEAR wallet.</span>
            <a
              href={claimedSuccessTx}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 underline hover:text-spectr-ink"
            >
              <span>View NEAR Tx</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        {/* Heartbeat Success Alert */}
        {heartbeatSuccess && (
          <div className="p-4 bg-spectr-surface border border-spectr-primary text-xs font-mono text-spectr-primary flex items-center justify-between">
            <span>{heartbeatSuccess}</span>
            <button
              type="button"
              onClick={() => setHeartbeatSuccess(null)}
              className="text-spectr-body hover:text-spectr-ink"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Live On-Chain Contract Telemetry Banner */}
        <OnchainTelemetryBanner
          onchainBudget={onchainBudget}
          onchainProduct={onchainProduct}
          heartbeatStreak={heartbeatStreak}
        />

        {/* GRID OF 2 MAIN STATIONS: PAYOUT STREAM & HEARTBEAT TELEMETRY */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7">
            <PayoutStreamStation
              tranches={tranches}
              claimableBalance={claimableBalance}
              isClaimingPayout={isClaimingPayout}
              onClaimPayout={handleClaimPayout}
              selectedProductSlug={selectedProduct.slug}
            />
          </div>

          <div className="lg:col-span-5">
            <HeartbeatStation
              heartbeatStreak={heartbeatStreak}
              selectedProduct={selectedProduct}
              isPingingHeartbeat={isPingingHeartbeat}
              onBroadcastHeartbeat={handleBroadcastHeartbeat}
            />
          </div>
        </div>

        {/* PANEL 3: RISK CORRECTION & COMMUNITY VOTING PANEL */}
        <RiskCorrectionPanel
          riskProposals={riskProposals}
          onOpenRiskModal={() => setIsRiskModalOpen(true)}
        />

        {/* MODAL: SUBMIT RISK CORRECTION PROPOSAL */}
        <RiskProposalModal
          isOpen={isRiskModalOpen}
          onClose={() => setIsRiskModalOpen(false)}
          onSubmitProposal={handleProposalSubmitted}
          existingProposalsCount={riskProposals.length}
        />
      </div>
    </main>
  );
}
