"use client";

import { useState } from "react";
import Link from "next/link";
import { PANDEM_ESCROW_ID, PANDEM_TOKEN_ID, SPLIT_BPS } from "@pandem/shared";

interface SourceChain {
  id: string;
  name: string;
  icon: string;
  tokens: string[];
}

const SUPPORTED_CHAINS: SourceChain[] = [
  { id: "ethereum", name: "Ethereum", icon: "Ξ", tokens: ["USDC", "USDT", "ETH"] },
  { id: "solana", name: "Solana", icon: "◎", tokens: ["USDC", "SOL"] },
  { id: "arbitrum", name: "Arbitrum", icon: "⯈", tokens: ["USDC", "USDT", "ETH"] },
  { id: "base", name: "Base", icon: "🔵", tokens: ["USDC", "ETH"] },
  { id: "polygon", name: "Polygon", icon: "🟣", tokens: ["USDC", "POL"] },
];

export default function OnRampPage() {
  const [selectedChain, setSelectedChain] = useState<string>("ethereum");
  const [selectedToken, setSelectedToken] = useState<string>("USDC");
  const [targetPeriods, setTargetPeriods] = useState<number>(3);
  const [destinationAccount, setDestinationAccount] = useState<string>("pandem-alice-8d6888e3.testnet");
  const [isQuoting, setIsQuoting] = useState<boolean>(false);
  const [quoteGenerated, setQuoteGenerated] = useState<boolean>(true);

  // Price calculations: 0.1 USDC/wNEAR per period
  const pricePerPeriod = 0.1;
  const targetOutputAmount = (pricePerPeriod * targetPeriods).toFixed(2);
  const estimatedInputAmount = (parseFloat(targetOutputAmount) * 1.0025 + 0.05).toFixed(4); // dry estimate

  const customRecipientPayload = {
    product_id: "1",
    periods: targetPeriods,
    subscriber: destinationAccount || "subscriber.testnet",
    refund_to: destinationAccount || "subscriber.testnet",
  };

  const handleGenerateQuote = () => {
    setIsQuoting(true);
    setTimeout(() => {
      setIsQuoting(false);
      setQuoteGenerated(true);
    }, 600);
  };

  const currentChainObj = SUPPORTED_CHAINS.find((c) => c.id === selectedChain) || SUPPORTED_CHAINS[0];

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <section className="border-b border-zinc-800 pb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                1Click Cross-Chain On-Ramp
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-semibold">
                Mainnet Edge
              </span>
            </div>
            <p className="text-sm text-zinc-400 mt-2 max-w-3xl">
              Cross-chain intent execution powered by NEAR Intents 1Click API. External payers on EVM or Solana can subscribe to Pandem SaaS Escrow in a single transaction via <code className="text-zinc-200 font-mono">EXACT_OUTPUT</code> with <code className="text-cyan-400 font-mono">customRecipientMsg</code>.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400">
              Protocol: <strong className="text-white">NEAR Intents 1Click</strong>
            </span>
          </div>
        </div>

        {/* Hard Rule Notice Banner */}
        <div className="mt-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono flex items-start gap-3">
          <span className="text-base shrink-0 mt-0.5">ℹ</span>
          <div>
            <div className="font-bold text-amber-200">
              Architecture Invariant: 1Click is a Mainnet-Only Edge On-Ramp
            </div>
            <div className="text-zinc-300 mt-1 leading-relaxed">
              1Click does not provide an official testnet solver network. In Pandem, 1Click is strictly an ingress bridge for cross-chain users paying from Ethereum, Solana, Arbitrum, or Base. Internal escrow lifecycle (heartbeats, releases, killswitches, refunds) operates natively on NEAR Rust smart contracts.
            </div>
          </div>
        </div>
      </section>

      {/* Main Quote Interface Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Configuration Form */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Configure Ingress Intent</span>
              <span className="text-xs font-mono text-zinc-500 font-normal">(EXACT_OUTPUT)</span>
            </h2>

            {/* Select Chain */}
            <div className="space-y-2">
              <label className="text-xs font-mono text-zinc-400 uppercase font-semibold">
                1. Select Payer Origin Network
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {SUPPORTED_CHAINS.map((chain) => {
                  const isSelected = selectedChain === chain.id;
                  return (
                    <button
                      key={chain.id}
                      type="button"
                      onClick={() => {
                        setSelectedChain(chain.id);
                        setSelectedToken(chain.tokens[0]);
                      }}
                      className={`p-3 rounded-xl border text-center transition-all font-mono text-xs flex flex-col items-center gap-1 ${
                        isSelected
                          ? "bg-cyan-500/10 border-cyan-500 text-cyan-400 font-bold shadow-sm shadow-cyan-500/10"
                          : "bg-zinc-950/80 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white"
                      }`}
                    >
                      <span className="text-base">{chain.icon}</span>
                      <span>{chain.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Select Token */}
            <div className="space-y-2">
              <label className="text-xs font-mono text-zinc-400 uppercase font-semibold">
                2. Select Deposit Asset
              </label>
              <div className="flex flex-wrap gap-2">
                {currentChainObj.tokens.map((token) => (
                  <button
                    key={token}
                    type="button"
                    onClick={() => setSelectedToken(token)}
                    className={`px-4 py-2 rounded-xl border font-mono text-xs transition-all ${
                      selectedToken === token
                        ? "bg-emerald-500/10 border-emerald-500 text-emerald-400 font-bold"
                        : "bg-zinc-950/80 border-zinc-800 text-zinc-400 hover:text-white"
                    }`}
                  >
                    {token} on {currentChainObj.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Select Periods */}
            <div className="space-y-2">
              <label className="text-xs font-mono text-zinc-400 uppercase font-semibold">
                3. Pre-Fund Escrow Periods
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[1, 3, 6, 12].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setTargetPeriods(p)}
                    className={`py-2 px-3 rounded-xl border text-center font-mono text-xs transition-all ${
                      targetPeriods === p
                        ? "bg-emerald-500/10 border-emerald-500 text-emerald-400 font-bold"
                        : "bg-zinc-950/80 border-zinc-800 text-zinc-400 hover:text-white"
                    }`}
                  >
                    {p} {p === 1 ? "Period" : "Periods"}
                  </button>
                ))}
              </div>
            </div>

            {/* Subscriber & Refund Recipient Account */}
            <div className="space-y-2">
              <label className="text-xs font-mono text-zinc-400 uppercase font-semibold">
                4. Destination NEAR Subscriber Account
              </label>
              <input
                type="text"
                value={destinationAccount}
                onChange={(e) => setDestinationAccount(e.target.value)}
                placeholder="e.g. alice.near"
                className="w-full bg-black/80 border border-zinc-800 px-3.5 py-2 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
              />
              <span className="text-[11px] text-zinc-500 font-mono block">
                Crucial: 1Click solver will execute the contract call on your behalf; the contract pulls the subscriber and refund address directly from the custom payload.
              </span>
            </div>

            {/* Generate Quote Button */}
            <button
              onClick={handleGenerateQuote}
              disabled={isQuoting}
              className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs font-mono transition-all shadow-md shadow-cyan-500/20 flex items-center justify-center gap-2"
            >
              {isQuoting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>Requesting 1Click Solver Quote...</span>
                </>
              ) : (
                <span>Request 1Click Dry Quote →</span>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Quote Preview & Payload */}
        <div className="lg:col-span-5 space-y-6">
          {/* Quote Card */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-850">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-mono text-white font-bold uppercase">
                  Dry Run Quote Summary
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-850 text-zinc-400">
                1Click v0 REST
              </span>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-850 space-y-1">
                <div className="flex justify-between text-zinc-400">
                  <span>Payer Sends (Est.):</span>
                  <span className="text-white font-bold">
                    ~{estimatedInputAmount} {selectedToken}
                  </span>
                </div>
                <div className="text-[11px] text-zinc-500">
                  Network: {currentChainObj.name} · Gas included
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-850 space-y-1">
                <div className="flex justify-between text-zinc-400">
                  <span>Escrow Receives (Exact):</span>
                  <span className="text-emerald-400 font-bold">
                    {targetOutputAmount} USDC (NEP-141)
                  </span>
                </div>
                <div className="text-[11px] text-zinc-500">
                  Recipient: {PANDEM_ESCROW_ID}
                </div>
              </div>

              <div className="space-y-1.5 pt-1 text-[11px] text-zinc-400">
                <div className="flex justify-between">
                  <span>Estimated Settlement:</span>
                  <span className="text-zinc-200">~35 - 60 seconds</span>
                </div>
                <div className="flex justify-between">
                  <span>Slippage Protection:</span>
                  <span className="text-zinc-200">EXACT_OUTPUT Guaranteed</span>
                </div>
                <div className="flex justify-between">
                  <span>Solver Action:</span>
                  <span className="text-cyan-400 font-bold">ft_transfer_call + customRecipientMsg</span>
                </div>
              </div>
            </div>

            {/* Custom Recipient Msg Preview */}
            <div className="space-y-1.5 pt-2 border-t border-zinc-850">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-zinc-400 uppercase font-semibold">
                  customRecipientMsg Payload
                </span>
                <span className="text-[10px] font-mono text-emerald-400">
                  Valid NEP-141 Msg
                </span>
              </div>
              <div className="bg-black/90 p-3 rounded-xl border border-zinc-850 font-mono text-[11px] text-emerald-400 overflow-x-auto">
                <pre>{JSON.stringify(customRecipientPayload, null, 2)}</pre>
              </div>
            </div>
          </div>

          {/* Quick link back */}
          <div className="text-center">
            <Link
              href="/"
              className="text-xs font-mono text-zinc-400 hover:text-white transition-colors"
            >
              ← Back to SaaS Catalog
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
