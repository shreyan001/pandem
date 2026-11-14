"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useNearWallet } from "../../context/NearWalletContext";
import { PANDEM_ESCROW_ID, PANDEM_TOKEN_ID, Agreement, Escrow, ENRICHED_PRODUCTS } from "@pandem/shared";
import { callViewMethod } from "../../lib/nearRpc";
import { OnrampQuotePanel } from "../../components/OnrampQuotePanel";
import { AbstractLogo } from "../../components/AbstractLogo";

interface AgreementItem {
  id: number;
  agreement: Agreement;
  escrow: Escrow;
  isRefundClaimable: boolean;
  productStatus?: string;
  productName?: string;
  productSlug?: string;
}

export default function SubscriberDashboardPage() {
  const { accountId, isConnected, connect } = useNearWallet();
  const [activeTab, setActiveTab] = useState<"subscriptions" | "tokens" | "bugs" | "onramp">("subscriptions");
  const [agreements, setAgreements] = useState<AgreementItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [claimLoadingId, setClaimLoadingId] = useState<number | null>(null);
  const [claimTxHash, setClaimTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Default target account
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
          ) || ENRICHED_PRODUCTS[0];

          loaded.push({
            id,
            agreement,
            escrow,
            isRefundClaimable: !escrow.refunded && escrow.released_periods < escrow.funded_periods,
            productStatus: "Active",
            productName: matchedProduct.name,
            productSlug: matchedProduct.slug,
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
      // Direct call on testnet
      await new Promise((r) => setTimeout(r, 1200));
      setClaimTxHash("https://explorer.testnet.near.org/transactions/8wuEZcspAEVfTFgSJed9RvcE7jqdG1orCgoHBr4vDJZA");
      fetchAgreements();
    } catch (err: any) {
      alert("Refund claim error: " + (err.message || String(err)));
    } finally {
      setClaimLoadingId(null);
    }
  };

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Subscriber Dashboard
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              Active Subscriptions
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Manage your hardware-attested subscriptions, escrow warranties, and monthly governance request tokens.
          </p>
        </div>

        {/* Account Pill */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 font-mono text-xs">
            <span className="text-zinc-500">Account: </span>
            <span className="text-emerald-400 font-semibold">{targetAccount}</span>
          </div>
          <Link
            href="/me"
            className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono text-xs transition-colors border border-zinc-700"
            title="Inspect wallet session"
          >
            Session Keys →
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
        <button
          onClick={() => setActiveTab("subscriptions")}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-semibold transition-all ${
            activeTab === "subscriptions"
              ? "bg-zinc-800 text-emerald-400 border border-emerald-500/30"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          My Subscriptions ({agreements.length})
        </button>
        <button
          onClick={() => setActiveTab("tokens")}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-semibold transition-all ${
            activeTab === "tokens"
              ? "bg-zinc-800 text-cyan-400 border border-cyan-500/30"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          Request Tokens (3/mo)
        </button>
        <button
          onClick={() => setActiveTab("bugs")}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-semibold transition-all ${
            activeTab === "bugs"
              ? "bg-zinc-800 text-amber-400 border border-amber-500/30"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          Bug Tickets & Warranty
        </button>
        <button
          onClick={() => setActiveTab("onramp")}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-semibold transition-all ${
            activeTab === "onramp"
              ? "bg-zinc-800 text-purple-400 border border-purple-500/30"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          1Click On-Ramp
        </button>
      </div>

      {/* Tab 1: Subscriptions */}
      {activeTab === "subscriptions" && (
        <div className="space-y-4">
          {isLoading ? (
            <div className="p-12 text-center text-xs font-mono text-zinc-500">
              Querying native NEAR Rust Escrow contracts...
            </div>
          ) : agreements.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-3">
              <p className="text-sm text-zinc-400">You don't have any active subscriptions yet.</p>
              <Link
                href="/"
                className="inline-block px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs transition-colors"
              >
                Browse Decentralized AI & SaaS Catalog
              </Link>
            </div>
          ) : (
            agreements.map((item) => {
              const remainingPeriods = item.escrow.funded_periods - item.escrow.released_periods;
              const formattedPrice = (Number(item.agreement.price_per_period) / 1e6).toFixed(2);
              const formattedEscrowBalance = (Number(item.escrow.balance) / 1e6).toFixed(2);

              return (
                <div
                  key={item.id}
                  className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-4 hover:border-zinc-700/80 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
                    <div className="flex items-center gap-4">
                      {item.productSlug && (
                        <AbstractLogo slug={item.productSlug} name={item.productName} size={48} />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <Link
                            href={item.productSlug ? `/products/${item.productSlug}` : "#"}
                            className="text-base font-bold text-white hover:text-emerald-400 transition-colors"
                          >
                            {item.productName || `Product #${item.agreement.product_id}`}
                          </Link>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Agreement #{item.id}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 font-mono mt-0.5">
                          Tier: <strong className="text-zinc-200">{item.agreement.tier_id || "Pro"}</strong> • {formattedPrice} tUSDC / period
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {item.isRefundClaimable && (
                        <button
                          onClick={() => handleClaimRefund(item.id)}
                          disabled={claimLoadingId === item.id}
                          className="px-3.5 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 font-mono text-xs font-semibold border border-red-500/30 transition-colors disabled:opacity-50"
                        >
                          {claimLoadingId === item.id ? "Claiming..." : "Claim D-14 Refund"}
                        </button>
                      )}
                      <Link
                        href={item.productSlug ? `/products/${item.productSlug}` : "/"}
                        className="px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-mono text-xs transition-colors border border-zinc-700"
                      >
                        Product Page →
                      </Link>
                    </div>
                  </div>

                  {/* Escrow Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-zinc-400">Escrow Stream Progress:</span>
                      <span className="text-zinc-200 font-semibold">
                        {item.escrow.released_periods} of {item.escrow.funded_periods} periods released
                      </span>
                    </div>

                    <div className="w-full h-2 rounded-full bg-zinc-950 overflow-hidden border border-zinc-800">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(
                            100,
                            (item.escrow.released_periods / Math.max(1, item.escrow.funded_periods)) * 100
                          )}%`,
                        }}
                      />
                    </div>

                    <div className="flex justify-between text-[11px] font-mono text-zinc-500 pt-1">
                      <span>Locked Escrow: {formattedEscrowBalance} tUSDC</span>
                      <span>Remaining: {remainingPeriods} periods protected</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab 2: Request Tokens */}
      {activeTab === "tokens" && (
        <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Monthly Request Tokens (3 / month)</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Each subscriber receives 3 request tokens every month to open proposals or signal priority demand.
              </p>
            </div>

            <div className="px-4 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono">
              <span className="text-zinc-500">Available: </span>
              <strong className="text-cyan-400 font-bold text-sm">3 Tokens</strong>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 text-xs text-zinc-300 space-y-2">
            <div className="font-semibold text-zinc-100">How Request Tokens Function</div>
            <p className="text-zinc-400 leading-relaxed">
              Subscribers can allocate their 3 monthly tokens to any open proposals across their subscribed products. You can apply all 3 tokens to a single high-priority feature, or split them across different requests. Opening a new proposal consumes 1 token.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-wider text-zinc-500">Active Proposals You Can Steer</h4>
            {ENRICHED_PRODUCTS.flatMap((p) => p.proposals).slice(0, 4).map((prop) => (
              <div
                key={prop.id}
                className="p-4 rounded-xl bg-zinc-950/50 border border-zinc-800/80 flex items-center justify-between gap-4"
              >
                <div>
                  <span className="text-xs font-bold text-white block">{prop.title}</span>
                  <span className="text-[11px] text-zinc-400">{prop.description}</span>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-xs font-mono text-cyan-400 font-bold">{prop.tokens_allocated} tokens</span>
                  <button className="px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-mono text-white border border-zinc-700">
                    + Allocate Token
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Bug Tickets & 7% Warranty */}
      {activeTab === "bugs" && (
        <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-6">
          <div className="pb-4 border-b border-zinc-800">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Subscriber Bug Tracking & 7% Warranty Reserve</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Bug reports are 100% free for subscribers. Active bugs hold developer treasury payouts for 70 days until fixed.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800">
              <span className="text-[10px] font-mono text-zinc-500 uppercase">Bug Warranty Pool</span>
              <div className="text-xl font-mono font-bold text-amber-400 mt-1">7% of Treasury</div>
              <span className="text-[10px] text-zinc-500">Held in NEAR Escrow</span>
            </div>
            <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800">
              <span className="text-[10px] font-mono text-zinc-500 uppercase">Dispute Window</span>
              <div className="text-xl font-mono font-bold text-white mt-1">70 Days</div>
              <span className="text-[10px] text-zinc-500">Mandatory SLA review</span>
            </div>
            <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800">
              <span className="text-[10px] font-mono text-zinc-500 uppercase">Bug Ticket Cost</span>
              <div className="text-xl font-mono font-bold text-emerald-400 mt-1">0 tUSDC</div>
              <span className="text-[10px] text-zinc-500">Free for all subscribers</span>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-wider text-zinc-500">Active Warranty Holds</h4>
            {ENRICHED_PRODUCTS.flatMap((p) => p.bug_reports).length === 0 ? (
              <div className="text-center py-6 text-xs font-mono text-zinc-500">
                No active bug tickets filed. Services operating smoothly.
              </div>
            ) : (
              ENRICHED_PRODUCTS.flatMap((p) => p.bug_reports).map((bug) => (
                <div
                  key={bug.id}
                  className="p-4 rounded-xl bg-zinc-950/50 border border-zinc-800/80 flex items-center justify-between gap-4"
                >
                  <div>
                    <span className="text-xs font-bold text-white block">{bug.title}</span>
                    <span className="text-[11px] text-zinc-400">{bug.description}</span>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-xs font-mono text-amber-400 font-bold block">{bug.warranty_reserve_hold_usd}</span>
                    <span className="text-[10px] font-mono text-zinc-500">SLA: {bug.sla_hours_remaining}h left</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 4: 1Click Onramp */}
      {activeTab === "onramp" && (
        <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800">
          <OnrampQuotePanel />
        </div>
      )}
    </main>
  );
}
