"use client";

import React, { useState, useEffect } from "react";
import {
  PANDEM_ESCROW_ID,
  PANDEM_BUDGET_ID,
  PANDEM_REGISTRY_ID,
  PANDEM_TOKEN_ID,
  REPO_BUILD_HASHES,
} from "@pandem/shared";
import { Card, Badge, Button } from "../../../ui";
import { CheckCircle2, AlertTriangle, RefreshCw, ExternalLink } from "lucide-react";

export interface ContractInfo {
  accountId: string;
  name: string;
  role: string;
  expectedHash: string;
  liveHash: string | null;
  status: "loading" | "matched" | "mismatched" | "error";
  description: string;
}

const CONTRACT_SPECS = [
  {
    accountId: PANDEM_ESCROW_ID,
    name: "Pandem Escrow (V2)",
    role: "Autonomous Multi-Period Escrow & Payout Vault",
    description: "Enforces 2.5/30/20/47.5 split, D-14 offset, 30d heartbeat SLA, and permissionless claim_refund.",
  },
  {
    accountId: PANDEM_BUDGET_ID,
    name: "Pandem Budget",
    role: "Agent Ops & AI Inference Compute Vault",
    description: "Receives 30% ops share on period release; powers NEAR AI Cloud TEE inference draws.",
  },
  {
    accountId: PANDEM_REGISTRY_ID,
    name: "Pandem Registry (V2)",
    role: "Decentralized Product Directory & Score Engine",
    description: "Maintains 12 audited self-hosted listings, TEE attestations, and immutable score hashes.",
  },
  {
    accountId: PANDEM_TOKEN_ID,
    name: "Testnet USDC (tUSDC)",
    role: "NEP-141 Settlement Token & Daily Faucet",
    description: "6-decimal sovereign stablecoin asset for non-custodial subscription payments.",
  },
];

const RPCS = [
  "https://test.rpc.fastnear.com",
  "https://rpc.testnet.near.org",
  "https://testnet.neartransaction.com",
];

export const ContractHashMatrix: React.FC = () => {
  const [contracts, setContracts] = useState<ContractInfo[]>(() =>
    CONTRACT_SPECS.map((c) => ({
      ...c,
      expectedHash: REPO_BUILD_HASHES[c.accountId] || "4FB9YmW5ydnBkfD7GGLcmHPugkzv42ZVK7ZDwr5HeBi5",
      liveHash: null,
      status: "loading",
    }))
  );
  const [isVerifying, setIsVerifying] = useState(false);
  const [lastVerifiedAt, setLastVerifiedAt] = useState<string | null>(null);

  const verifyAllContracts = async () => {
    setIsVerifying(true);
    const updated = [...contracts];

    for (let i = 0; i < updated.length; i++) {
      const item = updated[i];
      let fetchedHash: string | null = null;

      for (const rpc of RPCS) {
        try {
          const res = await fetch(rpc, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              jsonrpc: "2.0",
              id: `verify-code-${item.accountId}`,
              method: "query",
              params: {
                request_type: "view_code",
                finality: "final",
                account_id: item.accountId,
              },
            }),
          });
          if (!res.ok) continue;
          const data = await res.json();
          if (data?.result?.hash) {
            fetchedHash = data.result.hash;
            break;
          }
        } catch {
          // Fall through to next RPC
        }
      }

      if (fetchedHash) {
        item.liveHash = fetchedHash;
        item.status = fetchedHash === item.expectedHash ? "matched" : "mismatched";
      } else {
        item.status = "error";
      }
    }

    setContracts([...updated]);
    setIsVerifying(false);
    setLastVerifiedAt(new Date().toLocaleTimeString());
  };

  useEffect(() => {
    verifyAllContracts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const allMatched = contracts.every((c) => c.status === "matched");

  return (
    <Card className="p-6 bg-spectr-surface border-spectr-hairline space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-spectr-hairline">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-spectr-ink tracking-tight font-sans">
              1. On-Chain Bytecode & Code Hash Verification
            </h3>
            {allMatched ? (
              <Badge variant="success" dot>
                All 4 Contracts Verified Match
              </Badge>
            ) : (
              <Badge variant="warning">
                RPC Verifying...
              </Badge>
            )}
          </div>
          <p className="text-xs text-spectr-muted font-mono mt-1">
            Live query via <code className="text-spectr-primary">view_code</code> against{" "}
            <span className="text-spectr-body font-semibold">https://test.rpc.fastnear.com</span> vs repository build hash
          </p>
        </div>

        <div className="flex items-center gap-3">
          {lastVerifiedAt && (
            <span className="text-xs text-spectr-muted font-mono hidden md:inline">
              Checked at {lastVerifiedAt}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={verifyAllContracts}
            isLoading={isVerifying}
            className="font-mono text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Re-verify RPC
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {contracts.map((c) => (
          <div
            key={c.accountId}
            className="p-4 bg-spectr-canvas border border-spectr-hairline space-y-3"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold text-spectr-ink font-sans">
                    {c.name}
                  </span>
                  <Badge variant="outline" className="font-mono text-xs">
                    {c.role}
                  </Badge>
                  {c.status === "matched" && (
                    <Badge variant="success" className="font-mono text-xs">
                      <CheckCircle2 className="w-3 h-3 mr-1 inline text-spectr-success" />
                      Verified Match
                    </Badge>
                  )}
                  {c.status === "mismatched" && (
                    <Badge variant="danger" className="font-mono text-xs">
                      <AlertTriangle className="w-3 h-3 mr-1 inline text-spectr-danger" />
                      Hash Mismatch
                    </Badge>
                  )}
                  {c.status === "loading" && (
                    <Badge variant="warning" className="font-mono text-xs">
                      Checking RPC...
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-spectr-muted">{c.description}</p>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`https://explorer.testnet.near.org/accounts/${c.accountId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 text-xs font-mono text-spectr-muted hover:text-spectr-primary border border-spectr-hairline bg-spectr-surface flex items-center gap-1 transition-colors"
                >
                  <span>Explorer</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <a
                  href={`https://testnet.nearblocks.io/address/${c.accountId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 text-xs font-mono text-spectr-muted hover:text-spectr-primary border border-spectr-hairline bg-spectr-surface flex items-center gap-1 transition-colors"
                >
                  <span>Nearblocks</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-spectr-hairline/60 font-mono text-xs">
              <div className="space-y-0.5">
                <span className="text-spectr-muted text-xs block">Account ID:</span>
                <span className="text-spectr-ink font-semibold truncate block" title={c.accountId}>
                  {c.accountId}
                </span>
              </div>

              <div className="space-y-0.5">
                <span className="text-spectr-muted text-xs block">Live On-Chain Code Hash:</span>
                <span
                  className={`truncate block font-semibold ${
                    c.status === "matched" ? "text-spectr-success" : "text-spectr-warning"
                  }`}
                  title={c.liveHash || "Fetching..."}
                >
                  {c.liveHash ? c.liveHash : "Querying view_code..."}
                </span>
              </div>

              <div className="space-y-0.5">
                <span className="text-spectr-muted text-xs block">Repo Build Hash (deployed.json):</span>
                <span className="text-spectr-body truncate block font-semibold" title={c.expectedHash}>
                  {c.expectedHash}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
