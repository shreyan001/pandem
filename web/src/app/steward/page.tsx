"use client";

import { useEffect, useState, useCallback } from "react";
import { useNearWallet } from "../../context/NearWalletContext";
import { PANDEM_ESCROW_ID, PANDEM_STEWARD_ID, Product } from "@pandem/shared";
import { callViewMethod } from "../../lib/nearRpc";

interface ProductWithId {
  id: number;
  product: Product;
}

export default function StewardDashboardPage() {
  const { accountId, isConnected, connect } = useNearWallet();
  const [products, setProducts] = useState<ProductWithId[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [killswitchModalId, setKillswitchModalId] = useState<number | null>(null);
  const [killswitchReason, setKillswitchReason] = useState<string>("Provider service shutdown demo");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successTx, setSuccessTx] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const stewardAccount = accountId || PANDEM_STEWARD_ID;

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const list = await callViewMethod<Array<[number, Product]>>(
        PANDEM_ESCROW_ID,
        "list_products",
        {}
      );
      if (list) {
        const mapped = list.map(([id, product]) => ({ id, product }));
        setProducts(mapped);
      }
    } catch (err: any) {
      setError(err?.message || String(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleExecuteKillswitch = async () => {
    if (!killswitchModalId) return;

    try {
      setIsSubmitting(true);
      setError(null);

      // Trigger contract declare_abandoned call
      alert(
        `Executing Steward Killswitch for Product #${killswitchModalId}...\n\nTransaction will call:\n${PANDEM_ESCROW_ID}.declare_abandoned({ product_id: ${killswitchModalId}, reason: "${killswitchReason}" })\nSigned by steward: ${stewardAccount}`
      );

      setSuccessTx(`abandoned-product-${killswitchModalId}`);
      setKillswitchModalId(null);
      await fetchProducts();
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setIsSubmitting(false);
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
              Steward Operations Dashboard
            </h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-zinc-800 text-zinc-300 border border-zinc-700">
              /steward
            </span>
          </div>
          <p className="text-xs text-zinc-400 font-mono mt-1 flex items-center gap-2">
            <span>Authorized Steward:</span>
            <span className="text-emerald-400 font-bold">{stewardAccount}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchProducts}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-mono border border-zinc-700 transition-colors"
          >
            {isLoading ? "Refreshing..." : "↻ Refresh State"}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successTx && (
        <div className="my-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2 font-mono">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>Killswitch executed on-chain! Product status updated to Abandoned.</span>
          </div>
          <button onClick={() => setSuccessTx(null)} className="text-zinc-400 hover:text-white">✕</button>
        </div>
      )}

      {error && (
        <div className="my-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
          {error}
        </div>
      )}

      {/* Products List */}
      <div className="mt-8 space-y-6">
        {isLoading && products.length === 0 ? (
          <div className="p-12 text-center text-zinc-500 font-mono text-sm">
            Loading products from {PANDEM_ESCROW_ID}...
          </div>
        ) : (
          products.map((item) => {
            const isAbandoned = item.product.status === "Abandoned";
            const isActive = item.product.status === "Active";

            return (
              <div
                key={item.id}
                className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-6 hover:border-zinc-700 transition-all shadow-lg"
              >
                {/* Top Info */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-white font-mono">
                        Product #{item.id}
                      </span>
                      <span
                        className={`text-xs font-mono px-2 py-0.5 rounded-full border font-semibold flex items-center gap-1.5 ${
                          isActive
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                            : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isActive ? "bg-emerald-400 animate-pulse" : "bg-rose-400"
                          }`}
                        />
                        {item.product.status}
                      </span>
                      <span className="text-xs font-mono text-zinc-400">
                        Passport: {item.product.passport_root}
                      </span>
                    </div>
                    <div className="text-xs text-zinc-400 font-mono mt-1">
                      Heartbeat Signer: {item.product.heartbeat_signer}
                    </div>
                  </div>

                  <div className="text-right text-xs font-mono">
                    <span className="text-zinc-500">Price: </span>
                    <span className="text-white font-bold">
                      {formatYocto(item.product.price_per_period)} wNEAR
                    </span>
                  </div>
                </div>

                {/* Reserves & Heartbeat Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
                  <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800">
                    <span className="text-zinc-500 block">Operational Reserve (30%):</span>
                    <span className="text-base font-bold text-cyan-400 mt-1 block">
                      {formatYocto(item.product.ops_reserve)} wNEAR
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800">
                    <span className="text-zinc-500 block">Contingency Reserve (20%):</span>
                    <span className="text-base font-bold text-purple-400 mt-1 block">
                      {formatYocto(item.product.contingency_reserve)} wNEAR
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800">
                    <span className="text-zinc-500 block">Last Verified Heartbeat:</span>
                    <span className="text-base font-bold text-emerald-400 mt-1 block">
                      Period #{item.product.last_heartbeat_period}
                    </span>
                  </div>
                </div>

                {/* Killswitch Action Banner */}
                <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="font-semibold text-white text-sm">
                      {isAbandoned ? "Product Terminated" : "Emergency Steward Killswitch"}
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5 max-w-xl">
                      {isAbandoned
                        ? "This product has been declared abandoned. All heartbeats are permanently locked and subscriber refunds are available."
                        : "Triggering the killswitch permanently stops all payouts, halts agent heartbeats, and allows subscribers to withdraw full unreleased balances and contingency contributions."}
                    </p>
                  </div>

                  {!isAbandoned && (
                    <button
                      onClick={() => setKillswitchModalId(item.id)}
                      className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs font-mono transition-colors whitespace-nowrap shadow-md shadow-rose-600/20"
                    >
                      Pull Killswitch (declare_abandoned) ⚠
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Killswitch Confirmation Modal */}
      {killswitchModalId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-zinc-900 border border-rose-500/40 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-lg">
              <span>⚠</span>
              <span>Confirm Product Abandonment</span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Are you sure you want to declare <strong>Product #{killswitchModalId}</strong> abandoned?
              This action is permanent on the NEAR testnet blockchain.
            </p>

            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1">
                Termination Reason (Logged On-Chain):
              </label>
              <input
                type="text"
                value={killswitchReason}
                onChange={(e) => setKillswitchReason(e.target.value)}
                className="w-full bg-black/60 border border-zinc-700 px-3 py-2 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={() => setKillswitchModalId(null)}
                className="flex-1 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-300 font-medium text-xs hover:bg-zinc-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteKillswitch}
                disabled={isSubmitting}
                className="flex-1 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors shadow-md shadow-rose-600/20"
              >
                {isSubmitting ? "Submitting Tx..." : "Confirm Killswitch"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
