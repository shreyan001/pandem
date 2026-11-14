"use client";

import React, { useState, useEffect } from "react";
import { Card, Badge, Button } from "../../../ui";
import { ExternalLink, CheckCircle, Clock } from "lucide-react";

export interface TransactionRecord {
  hash: string;
  method: string;
  targetContract: string;
  description: string;
  amount?: string;
  timestamp: string;
  status: "Finalized" | "Pending";
}

const VERIFIED_TX_RECORDS: TransactionRecord[] = [
  {
    hash: "3oW6x2wivZWKpC1ydtoi75cHTbzAv3HBhhBhFmUTNjxs",
    method: "ft_transfer_call (subscribe)",
    targetContract: "escrow-d6-df23.test-pandem-alice-1.testnet",
    description: "Yearly subscription commitment (12 periods) locked in escrow",
    amount: "60.00 tUSDC",
    timestamp: "Sat 14-11 17:58 IST",
    status: "Finalized",
  },
  {
    hash: "Fzr4Qtc9ngoRgGqYzN2UfknG9dHUt3f5rFejM7zoA2Eo",
    method: "claim_refund",
    targetContract: "escrow-d6-df23.test-pandem-alice-1.testnet",
    description: "1-Click autonomous refund claimed back to subscriber wallet",
    amount: "60.00 tUSDC",
    timestamp: "Sat 14-11 17:58 IST",
    status: "Finalized",
  },
  {
    hash: "DJuY5Jzj45RQMjn7EtBPqkGDHLZVwfW3wpzuJe7rnxh3",
    method: "draw_ops_funds",
    targetContract: "pandem-budget-d1-8f199e48.testnet",
    description: "Pandem Agent drew AI inference compute funds from Ops reserve",
    amount: "0.50 tUSDC",
    timestamp: "Sat 14-11 17:58 IST",
    status: "Finalized",
  },
  {
    hash: "HHfYAU7XBXu54SWrvQMY1z6CcJt8w6da3YDyVp6nYMyG",
    method: "ft_transfer (ops_share)",
    targetContract: "pandem-budget-d1-8f199e48.testnet",
    description: "30% ops revenue stream routed autonomously to budget contract",
    amount: "1.50 tUSDC",
    timestamp: "Sat 14-11 16:33 IST",
    status: "Finalized",
  },
  {
    hash: "DvCav8Bgays4LvHHoiRoxsw6TqBVKPNF4eQJhSwRwRTr",
    method: "faucet",
    targetContract: "pandem-tusdc-46cee5ca.testnet",
    description: "Testnet USDC mint from sovereign daily faucet",
    amount: "100.00 tUSDC",
    timestamp: "Sat 14-11 17:58 IST",
    status: "Finalized",
  },
  {
    hash: "YJbKbNUQHXCbFJWb38Aaz51MySYKKtuX18ayGRd7CjP",
    method: "storage_deposit",
    targetContract: "pandem-tusdc-46cee5ca.testnet",
    description: "Account registration and NEP-141 storage bond",
    amount: "0.0125 NEAR",
    timestamp: "Sat 14-11 17:58 IST",
    status: "Finalized",
  },
  {
    hash: "Fw1dEp1rnBjSHxCYEKCNPYzjFGi97w5QvHYAoCAtWrbH",
    method: "abandon_product",
    targetContract: "escrow-d6-df23.test-pandem-alice-1.testnet",
    description: "Steward killswitch triggered; SLA lapsed unlocking permissionless refunds",
    amount: "0 NEAR",
    timestamp: "Sat 14-11 17:58 IST",
    status: "Finalized",
  },
];

interface UserTransactionsTableProps {
  userAccountId?: string | null;
}

export const UserTransactionsTable: React.FC<UserTransactionsTableProps> = ({
  userAccountId,
}) => {
  const [transactions, setTransactions] = useState<TransactionRecord[]>(VERIFIED_TX_RECORDS);
  const [filter, setFilter] = useState<"all" | "escrow" | "budget" | "token">("all");

  useEffect(() => {
    // Check if user has session transactions stored locally
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("pandem_user_transactions");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setTransactions([...parsed, ...VERIFIED_TX_RECORDS]);
          }
        }
      } catch {
        // Fallback to static verified records
      }
    }
  }, [userAccountId]);

  const filtered = transactions.filter((t) => {
    if (filter === "escrow") return t.targetContract.includes("escrow");
    if (filter === "budget") return t.targetContract.includes("budget");
    if (filter === "token") return t.targetContract.includes("tusdc");
    return true;
  });

  return (
    <Card className="p-6 bg-spectr-surface border-spectr-hairline space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-spectr-hairline">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-spectr-ink tracking-tight font-sans">
              3. Verifiable Transaction Audit Trail
            </h3>
            <Badge variant="outline" className="font-mono text-xs">
              {filtered.length} On-Chain Receipts
            </Badge>
          </div>
          <p className="text-xs text-spectr-muted font-mono mt-1">
            Every transaction links directly to <span className="text-spectr-body font-semibold">testnet.nearblocks.io/txns/</span>
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
          <Button
            variant={filter === "all" ? "primary" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            All
          </Button>
          <Button
            variant={filter === "escrow" ? "primary" : "outline"}
            size="sm"
            onClick={() => setFilter("escrow")}
          >
            Escrow
          </Button>
          <Button
            variant={filter === "budget" ? "primary" : "outline"}
            size="sm"
            onClick={() => setFilter("budget")}
          >
            Budget
          </Button>
          <Button
            variant={filter === "token" ? "primary" : "outline"}
            size="sm"
            onClick={() => setFilter("token")}
          >
            Token
          </Button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left font-mono text-xs">
          <thead>
            <tr className="border-b border-spectr-hairline text-spectr-muted uppercase">
              <th className="py-2.5 px-3">Method / Action</th>
              <th className="py-2.5 px-3">Target Contract</th>
              <th className="py-2.5 px-3">Amount</th>
              <th className="py-2.5 px-3">Transaction Hash</th>
              <th className="py-2.5 px-3 text-right">Receipt Link</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-spectr-hairline/60">
            {filtered.map((tx) => (
              <tr key={tx.hash} className="hover:bg-spectr-canvas/60 transition-colors">
                <td className="py-3 px-3">
                  <div className="font-semibold text-spectr-ink">{tx.method}</div>
                  <div className="text-spectr-muted text-xs truncate max-w-xs">{tx.description}</div>
                </td>
                <td className="py-3 px-3">
                  <span className="text-spectr-body truncate block max-w-[200px]" title={tx.targetContract}>
                    {tx.targetContract}
                  </span>
                </td>
                <td className="py-3 px-3">
                  {tx.amount ? (
                    <span className="text-spectr-success font-semibold">{tx.amount}</span>
                  ) : (
                    <span className="text-spectr-muted">—</span>
                  )}
                </td>
                <td className="py-3 px-3">
                  <span className="text-spectr-muted truncate block max-w-[140px]" title={tx.hash}>
                    {tx.hash.slice(0, 8)}...{tx.hash.slice(-8)}
                  </span>
                </td>
                <td className="py-3 px-3 text-right">
                  <a
                    href={`https://testnet.nearblocks.io/txns/${tx.hash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-spectr-surface-raised hover:bg-spectr-primary/20 text-spectr-primary border border-spectr-hairline hover:border-spectr-primary/50 transition-colors text-xs font-semibold"
                  >
                    <span>nearblocks</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
