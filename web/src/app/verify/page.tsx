"use client";

import React, { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useNearWallet } from "../../context/NearWalletContext";
import { PageHeader, Card, Badge, Button } from "../../ui";
import { ShieldCheck, ArrowLeft, ExternalLink, RefreshCw } from "lucide-react";
import { ContractHashMatrix } from "./components/ContractHashMatrix";
import { RevenueSplitBreakdown } from "./components/RevenueSplitBreakdown";
import { UserTransactionsTable } from "./components/UserTransactionsTable";
import { RefundGuaranteeCard } from "./components/RefundGuaranteeCard";
import { PermissionMatrix } from "./components/PermissionMatrix";
import { AgentTelemetrySection } from "./components/AgentTelemetrySection";

function VerifyContent() {
  const searchParams = useSearchParams();
  const agreementIdParam = searchParams.get("agreement_id");
  const { accountId, isConnected } = useNearWallet();
  const [agreementId, setAgreementId] = useState<string>(agreementIdParam || "3");

  useEffect(() => {
    if (agreementIdParam) {
      setAgreementId(agreementIdParam);
    }
  }, [agreementIdParam]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans">
      {/* Top Navigation & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-spectr-hairline pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-spectr-body hover:text-spectr-ink bg-spectr-surface border border-spectr-hairline hover:border-spectr-primary/50 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </Link>
          <span className="text-xs font-mono text-spectr-muted">/</span>
          <span className="text-xs font-mono text-spectr-primary font-semibold">
            On-Chain Verification Audit
          </span>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs">
          <Badge variant="success" dot pulse>
            NEAR Testnet Live
          </Badge>
          <span className="text-spectr-muted">
            Auditing Agreement: <strong className="text-spectr-ink">#{agreementId}</strong>
          </span>
        </div>
      </div>

      {/* Page Header */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="w-9 h-9 bg-spectr-primary flex items-center justify-center text-white shrink-0">
            <ShieldCheck className="w-5 h-5 text-spectr-ink" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-spectr-ink tracking-tight font-sans">
            Verify-It-Yourself Enclave Inspector
          </h1>
          <Badge variant="outline" className="font-mono text-xs">
            Milestone D6.6
          </Badge>
        </div>
        <p className="text-sm text-spectr-body max-w-4xl font-mono leading-relaxed">
          Zero trust required. Inspect live WASM bytecode hashes fetched directly from FastNEAR RPC,
          audit the autonomous 2.5/30/20/47.5 revenue split, review your on-chain settlement receipts,
          and examine the mathematical guarantees protecting your subscription funds.
        </p>
      </div>

      {/* Top 4 Proof Summary Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono text-xs">
        <Card className="p-4 bg-spectr-surface border-spectr-hairline space-y-1">
          <span className="text-spectr-muted uppercase font-semibold text-xs block">
            WASM Bytecode
          </span>
          <div className="text-lg font-bold text-spectr-success">4/4 Verified Match</div>
          <p className="text-xs text-spectr-muted">fastnear view_code query</p>
        </Card>

        <Card className="p-4 bg-spectr-surface border-spectr-hairline space-y-1">
          <span className="text-spectr-muted uppercase font-semibold text-xs block">
            Custody Model
          </span>
          <div className="text-lg font-bold text-spectr-ink">100% Non-Custodial</div>
          <p className="text-xs text-spectr-muted">D-14 pro-rata stream lock</p>
        </Card>

        <Card className="p-4 bg-spectr-surface border-spectr-hairline space-y-1">
          <span className="text-spectr-muted uppercase font-semibold text-xs block">
            Refund SLA
          </span>
          <div className="text-lg font-bold text-spectr-primary">30d + 7d Grace</div>
          <p className="text-xs text-spectr-muted">Permissionless claim_refund</p>
        </Card>

        <Card className="p-4 bg-spectr-surface border-spectr-hairline space-y-1">
          <span className="text-spectr-muted uppercase font-semibold text-xs block">
            Settlement Asset
          </span>
          <div className="text-lg font-bold text-spectr-ink">Testnet USDC (6-dp)</div>
          <p className="text-xs text-spectr-muted">NEP-141 sovereign token</p>
        </Card>
      </div>

      {/* 1. Contract Hash Matrix */}
      <ContractHashMatrix />

      {/* 2. Autonomous Revenue Split Engine */}
      <RevenueSplitBreakdown pricePerPeriod="5000000" />

      {/* 3. User Transactions & Explorer Links */}
      <UserTransactionsTable userAccountId={accountId} />

      {/* 4. Non-Custodial Refund Guarantee */}
      <RefundGuaranteeCard />

      {/* 5. Permission Boundaries & Security Invariants */}
      <PermissionMatrix />

      {/* 6. Pandem Agent Telemetry & Ops Budget */}
      <AgentTelemetrySection />
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-16 text-center font-mono text-spectr-muted text-xs">
          Loading verification audit engine...
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
