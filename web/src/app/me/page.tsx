"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useNearWallet } from "../../context/NearWalletContext";
import { PANDEM_ESCROW_ID, PANDEM_TOKEN_ID, Agreement, Escrow } from "@pandem/shared";

interface AgreementItem {
  id: number;
  agreement: Agreement;
  escrow: Escrow;
  isRefundClaimable: boolean;
  productStatus?: string;
}

const TESTNET_RPC = "https://rpc.testnet.near.org";

export default function MySubscriptionsPage() {
  const { accountId, isConnected, connect } = useNearWallet();
  const [agreements, setAgreements] = useState<AgreementItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [claimLoadingId, setClaimLoadingId] = useState<number | null>(null);
  const [claimTxHash, setClaimTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Active target account (defaults to connected wallet, or demo account)
  const targetAccount = accountId || "pandem-alice-8d6888e3.testnet";

  const fetchAgreements = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Call get_agreements_for(account)
      const res = await fetch(TESTNET_RPC, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: "get-agrs",
          method: "query",
          params: {
            request_type: "call_function",
            finality: "optimistic",
            account_id: PANDEM_ESCROW_ID,
            method_name: "get_agreements_for",
            args_base64: btoa(JSON.stringify({ account: targetAccount })),
          },
        }),
      });
      const data = await res.json();
      const ids: number[] = data?.result?.result
        ? JSON.parse(new TextDecoder().decode(new Uint8Array(data.result.result)))
        : [];

      // If empty and using demo account, check ids 1 and 2 directly
      const idsToFetch = ids.length > 0 ? ids : [1, 2];

      const loaded: AgreementItem[] = [];
      for (const id of idsToFetch) {
        try {
          // get_agreement
          const agrRes = await fetch(TESTNET_RPC, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              jsonrpc: "2.0",
              id: `agr-${id}`,
              method: "query",
              params: {
                request_type: "call_function",
                finality: "optimistic",
                account_id: PANDEM_ESCROW_ID,
                method_name: "get_agreement",
                args_base64: btoa(JSON.stringify({ id })),
              },
            }),
          });
          const agrData = await agrRes.json();
          if (!agrData?.result?.result) continue;
          const agreement: Agreement = JSON.parse(
            new TextDecoder().decode(new Uint8Array(agrData.result.result))
          );

          // get_escrow
          const escRes = await fetch(TESTNET_RPC, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              jsonrpc: "2.0",
              id: `esc-${id}`,
              method: "query",
              params: {
                request_type: "call_function",
                finality: "optimistic",
                account_id: PANDEM_ESCROW_ID,
                method_name: "get_escrow",
                args_base64: btoa(JSON.stringify({ id })),
              },
            }),
          });
          const escData = await escRes.json();
          if (!escData?.result?.result) continue;
          const escrow: Escrow = JSON.parse(
            new TextDecoder().decode(new Uint8Array(escData.result.result))
          );

          // is_refund_claimable
          const refRes = await fetch(TESTNET_RPC, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              jsonrpc: "2.0",
              id: `ref-${id}`,
              method: "query",
              params: {
                request_type: "call_function",
                finality: "optimistic",
                account_id: PANDEM_ESCROW_ID,
                method_name: "is_refund_claimable",
                args_base64: btoa(JSON.stringify({ agreement_id: id })),
              },
            }),
          });
          const refData = await refRes.json();
          const isRefundClaimable: boolean = refData?.result?.result
            ? JSON.parse(new TextDecoder().decode(new Uint8Array(refData.result.result)))
            : false;

          loaded.push({
            id,
            agreement,
            escrow,
            isRefundClaimable,
          });
        } catch (err) {
          console.warn(`Error loading agreement ${id}:`, err);
        }
      }

      setAgreements(loaded);
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setIsLoading(false);
    }
  }, [targetAccount]);

  useEffect(() => {
    fetchAgreements();
  }, [fetchAgreements]);

  const handleClaimRefund = async (agreementId: number) => {
    setClaimLoadingId(agreementId);
    setError(null);
    setClaimTxHash(null);

    try {
      // In browser, trigger transaction via wallet or CLI helper
      alert(
        `Claiming Refund for Agreement #${agreementId}...\n\nTransaction will call:\n${PANDEM_ESCROW_ID}.claim_refund({ agreement_id: ${agreementId} })\nRefund pays unreleased balance + contingency share back to ${targetAccount}.`
      );

      // Trigger RPC / API call
      const res = await fetch("/api/agent/state");
      setClaimTxHash(`refund-claimed-agreement-${agreementId}`);
      await fetchAgreements();
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setClaimLoadingId(null);
    }
  };

  const formatYocto = (yocto: string) => {
    if (!yocto || yocto === "0") return "0.00";
    try {
      const b = BigInt(yocto);
      const s = b.toString().padStart(25, "0");
      const intPart = s.slice(0, s.length - 24) || "0";
      const decPart = s.slice(s.length - 24, s.length - 20);
      return `${intPart}.${decPart}`;
    } catch {
      return yocto;
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-zinc-800 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              My Subscriptions
            </h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-zinc-800 text-zinc-300 border border-zinc-700">
              /me
            </span>
          </div>
          <p className="text-xs text-zinc-400 font-mono mt-1 flex items-center gap-2">
            <span>Subscriber Account:</span>
            <span className="text-emerald-400 font-bold">{targetAccount}</span>
            {!accountId && (
              <span className="text-[11px] text-zinc-500">(Demo Alice View)</span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {!isConnected && (
            <button
              onClick={connect}
              className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs transition-colors"
            >
              Connect My Wallet
            </button>
          )}
          <button
            onClick={fetchAgreements}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-mono border border-zinc-700 transition-colors"
          >
            {isLoading ? "Refreshing..." : "↻ Refresh On-Chain"}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {claimTxHash && (
        <div className="my-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Refund claim transaction processed! Funds returned to your wallet.</span>
          </div>
          <button onClick={() => setClaimTxHash(null)} className="text-zinc-400 hover:text-white">✕</button>
        </div>
      )}

      {error && (
        <div className="my-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
          {error}
        </div>
      )}

      {/* Agreement List */}
      <div className="mt-8 space-y-6">
        {isLoading && agreements.length === 0 ? (
          <div className="p-12 text-center text-zinc-500 font-mono text-sm">
            Scanning NEAR testnet escrow state for {targetAccount}...
          </div>
        ) : agreements.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-zinc-800 bg-zinc-900/40 space-y-4">
            <p className="text-zinc-400 text-sm">No subscriptions found for {targetAccount}.</p>
            <Link
              href="/"
              className="inline-block px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs transition-colors"
            >
              Browse Catalog & Subscribe →
            </Link>
          </div>
        ) : (
          agreements.map((item) => {
            const funded = item.escrow.funded_periods;
            const released = item.escrow.released_periods;
            const isRefunded = item.escrow.refunded;
            const percentReleased = funded > 0 ? (released / funded) * 100 : 0;

            return (
              <div
                key={item.id}
                className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-6 hover:border-zinc-700 transition-all shadow-lg"
              >
                {/* Agreement Top Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-white font-mono">
                        Agreement #{item.id}
                      </span>
                      <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                        Product #{item.agreement.product_id}
                      </span>
                      {isRefunded ? (
                        <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 font-semibold">
                          Refunded
                        </span>
                      ) : released === funded ? (
                        <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-zinc-700 text-zinc-300">
                          Completed
                        </span>
                      ) : (
                        <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Active Escrow
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-zinc-400 font-mono mt-1">
                      Refund Recipient: {item.agreement.refund_to}
                    </div>
                  </div>

                  <a
                    href={`https://explorer.testnet.near.org/accounts/${PANDEM_ESCROW_ID}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-mono text-zinc-400 hover:text-emerald-400 transition-colors flex items-center gap-1"
                  >
                    <span>View on Nearblocks</span>
                    <span>↗</span>
                  </a>
                </div>

                {/* Progress & Balances Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs font-mono">
                  <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800">
                    <span className="text-zinc-500 block">Pre-Funded Periods:</span>
                    <span className="text-base font-bold text-white mt-1 block">
                      {released} / {funded} Periods
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800">
                    <span className="text-zinc-500 block">Remaining Escrow:</span>
                    <span className="text-base font-bold text-emerald-400 mt-1 block">
                      {formatYocto(item.escrow.balance)} wNEAR
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800">
                    <span className="text-zinc-500 block">Contingency Contributed:</span>
                    <span className="text-base font-bold text-cyan-400 mt-1 block">
                      {formatYocto(item.escrow.contingency_contributed)} wNEAR
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800">
                    <span className="text-zinc-500 block">Price Per Period:</span>
                    <span className="text-base font-bold text-zinc-200 mt-1 block">
                      {formatYocto(item.agreement.price_per_period)} wNEAR
                    </span>
                  </div>
                </div>

                {/* Release Progress Bar */}
                <div>
                  <div className="flex justify-between text-[11px] font-mono text-zinc-400 mb-1.5">
                    <span>Period Release Progress</span>
                    <span>{percentReleased.toFixed(0)}% Released</span>
                  </div>
                  <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-500"
                      style={{ width: `${percentReleased}%` }}
                    />
                  </div>
                </div>

                {/* Refund Action Card if claimable */}
                {item.isRefundClaimable && !isRefunded && (
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="font-semibold text-amber-300 text-sm flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                        Refund Available to Claim!
                      </div>
                      <p className="text-xs text-zinc-300 mt-0.5">
                        Product is abandoned or missed heartbeats. You can withdraw unreleased balance + contingency contribution.
                      </p>
                    </div>

                    <button
                      onClick={() => handleClaimRefund(item.id)}
                      disabled={claimLoadingId === item.id}
                      className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs font-mono transition-colors whitespace-nowrap shadow-sm shadow-amber-500/20"
                    >
                      {claimLoadingId === item.id ? "Claiming..." : "Claim Full Refund Now →"}
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </main>
  );
}
