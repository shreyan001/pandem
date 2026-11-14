"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Drawer } from "../ui/Drawer";
import {
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  Clock,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
} from "lucide-react";

export type SupportedNetwork = "base" | "arb" | "eth" | "sol";

interface NetworkMeta {
  id: SupportedNetwork;
  name: string;
  badge: string;
  nativeToken: string;
  explorerName: string;
}

const NETWORKS: NetworkMeta[] = [
  { id: "base", name: "Base", badge: "L2", nativeToken: "ETH", explorerName: "Basescan" },
  { id: "arb", name: "Arbitrum One", badge: "L2", nativeToken: "ETH", explorerName: "Arbiscan" },
  { id: "eth", name: "Ethereum", badge: "L1", nativeToken: "ETH", explorerName: "Etherscan" },
  { id: "sol", name: "Solana", badge: "L1", nativeToken: "SOL", explorerName: "Solscan" },
];

interface QuoteData {
  success: boolean;
  isLiveApi: boolean;
  correlationId: string;
  network: SupportedNetwork;
  networkName: string;
  symbol: string;
  depositAddress: string;
  amountIn: number;
  amountInFormatted: string;
  amountOutFormatted: string;
  rate: string;
  defuserFeeRate: string;
  deadline: string;
  timeEstimate: number;
  explorerUrl: string;
  disclaimer: string;
  fallbackNotice?: string;
}

interface CrossChainQuoteDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  productName?: string;
  targetAmountUsdc?: number;
}

export function CrossChainQuoteDrawer({
  isOpen,
  onClose,
  productName = "Product Subscription",
  targetAmountUsdc = 10,
}: CrossChainQuoteDrawerProps) {
  const [network, setNetwork] = useState<SupportedNetwork>("base");
  const [amount, setAmount] = useState<number>(Math.max(1, targetAmountUsdc));
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<string>("15:00");

  // Keep amount synced if prop changes
  useEffect(() => {
    if (targetAmountUsdc > 0) {
      setAmount(targetAmountUsdc);
    }
  }, [targetAmountUsdc]);

  const fetchQuote = useCallback(
    async (targetNetwork: SupportedNetwork, targetAmt: number) => {
      try {
        setIsLoading(true);
        setError(null);

        const res = await fetch("/api/intents/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            network: targetNetwork,
            amountUsdc: targetAmt,
          }),
        });

        if (!res.ok) {
          throw new Error(`Quote service responded with HTTP ${res.status}`);
        }

        const data: QuoteData = await res.json();
        setQuote(data);
      } catch (err: any) {
        setError(err?.message || "Failed to fetch 1Click quote");
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Fetch when opened or when network changes
  useEffect(() => {
    if (isOpen) {
      fetchQuote(network, amount);
    }
  }, [isOpen, network, fetchQuote]);

  // Countdown timer for quote deadline
  useEffect(() => {
    if (!quote?.deadline) return;

    const deadlineTime = new Date(quote.deadline).getTime();
    const interval = setInterval(() => {
      const now = Date.now();
      const diff = Math.max(0, deadlineTime - now);
      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeLeft(
        `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
      );
      if (diff <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [quote?.deadline]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentNetworkMeta = NETWORKS.find((n) => n.id === network) || NETWORKS[0];

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      width="lg"
      title="Pay from another chain"
      description="Cross-chain edge deposit via NEAR Intents 1Click Defuser"
    >
      <div className="space-y-5 font-sans">
        {/* Mainnet Warning Notice */}
        <div className="p-3.5 rounded-none bg-spectr-surface-raised border border-spectr-warning/60 text-spectr-ink space-y-1.5 font-mono text-xs">
          <div className="flex items-center gap-2 text-spectr-warning font-bold uppercase tracking-wider">
            <AlertCircle className="w-4 h-4 shrink-0 text-spectr-warning" />
            <span>Mainnet quote, demo does not execute on testnet</span>
          </div>
          <p className="text-xs text-spectr-body font-sans leading-relaxed">
            NEAR Intents 1Click operates on Mainnet. Quotes below are resolved live by the 1Click Defuser market maker network.
          </p>
        </div>

        {/* Network Selection */}
        <div className="space-y-2">
          <label className="block text-xs font-mono uppercase text-spectr-muted font-medium">
            1. Select Source Network
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
            {NETWORKS.map((n) => {
              const active = network === n.id;
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => {
                    setNetwork(n.id);
                  }}
                  className={`p-2.5 text-center rounded-none border transition-colors ${
                    active
                      ? "bg-spectr-surface-raised border-spectr-primary text-spectr-ink font-bold"
                      : "bg-spectr-canvas border-spectr-hairline text-spectr-body hover:text-spectr-ink hover:border-spectr-muted"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-sans font-semibold">{n.name}</span>
                    <span className="text-xs text-spectr-muted">{n.badge}</span>
                  </div>
                  <div className="text-xs text-spectr-muted mt-1 text-left">USDC</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Deposit Amount Control */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-mono uppercase text-spectr-muted font-medium">
              2. Deposit Amount (USDC)
            </label>
            <span className="text-xs font-mono text-spectr-muted">
              Subscription: {productName}
            </span>
          </div>
          <div className="flex items-center gap-2 font-mono">
            <div className="relative flex-1">
              <input
                type="number"
                min="1"
                step="1"
                value={amount}
                onChange={(e) => {
                  const val = Math.max(1, Number(e.target.value) || 1);
                  setAmount(val);
                }}
                className="w-full bg-spectr-canvas border border-spectr-hairline text-spectr-ink px-3.5 py-2.5 text-xs font-mono rounded-none focus:outline-none focus:border-spectr-primary"
              />
              <span className="absolute right-3 top-2.5 text-xs text-spectr-muted font-mono pointer-events-none">
                USDC
              </span>
            </div>
            <button
              type="button"
              onClick={() => fetchQuote(network, amount)}
              disabled={isLoading}
              className="px-3.5 py-2.5 rounded-none bg-spectr-surface-raised hover:bg-spectr-surface border border-spectr-hairline text-spectr-ink text-xs font-mono transition-colors flex items-center gap-1.5 disabled:opacity-50"
              title="Refresh live 1Click quote"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-spectr-primary" : ""}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Error Alert if any */}
        {error && (
          <div className="p-3.5 rounded-none bg-spectr-surface border border-spectr-danger text-spectr-danger text-xs font-mono">
            {error}
          </div>
        )}

        {/* Live Quote Resolution Card */}
        {quote && (
          <div className="space-y-4">
            <div className="p-4 rounded-none bg-spectr-canvas border border-spectr-hairline space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-spectr-hairline">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-none bg-spectr-success" />
                  <span className="text-xs uppercase font-semibold text-spectr-ink">
                    1Click Solver Quote Rate
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-spectr-muted text-xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-spectr-success" />
                  <span>{quote.isLiveApi ? "Live Defuser RFQ" : "Display RFQ"}</span>
                </div>
              </div>

              {/* Conversion Display */}
              <div className="flex items-center justify-between text-spectr-body">
                <span>Exchange Rate:</span>
                <span className="text-spectr-ink font-semibold">
                  1 {currentNetworkMeta.name} USDC ≈ {quote.rate} NEAR USDC
                </span>
              </div>

              <div className="flex items-center justify-between text-spectr-body">
                <span>Total Expected Output:</span>
                <span className="text-spectr-primary text-sm font-bold">
                  {quote.amountOutFormatted} NEAR USDC
                </span>
              </div>

              <div className="flex items-center justify-between text-spectr-body">
                <span>Bridge / Defuser Fee:</span>
                <span className="text-spectr-ink">
                  {quote.defuserFeeRate} (1 bp solver fee)
                </span>
              </div>

              <div className="flex items-center justify-between text-spectr-body">
                <span>Estimated Bridge Time:</span>
                <span className="text-spectr-ink">
                  ~{quote.timeEstimate} seconds
                </span>
              </div>
            </div>

            {/* Deposit Address Box */}
            <div className="p-4 rounded-none bg-spectr-canvas border border-spectr-hairline space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span className="uppercase text-spectr-muted font-medium">
                  3. Send {amount} USDC to 1Click Deposit Address
                </span>
                <div className="flex items-center gap-1.5 text-spectr-warning">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="text-xs font-bold">{timeLeft} left</span>
                </div>
              </div>

              {/* Monospace Address with Copy */}
              <div className="p-3 bg-spectr-surface border border-spectr-hairline text-spectr-ink text-xs font-mono break-all flex items-center justify-between gap-2">
                <span className="select-all">{quote.depositAddress}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(quote.depositAddress)}
                  className="px-2.5 py-1 rounded-none bg-spectr-surface-raised hover:bg-spectr-surface border border-spectr-hairline text-spectr-ink text-xs font-mono transition-colors shrink-0 flex items-center gap-1"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-spectr-success" />
                      <span className="text-spectr-success">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between pt-1 text-spectr-muted text-xs">
                <span>Format: {network === "sol" ? "Solana Base58" : "EVM 0x (Hex)"}</span>
                <a
                  href={quote.explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-spectr-primary hover:text-spectr-primary-hover underline inline-flex items-center gap-1"
                >
                  <span>View on {currentNetworkMeta.explorerName}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* How it works info */}
            <div className="p-3.5 rounded-none bg-spectr-surface border border-spectr-hairline text-xs font-mono space-y-2 text-spectr-body">
              <div className="text-spectr-ink font-semibold flex items-center gap-1.5">
                <ArrowRight className="w-3.5 h-3.5 text-spectr-primary" />
                <span>How 1Click Resolves to Escrow</span>
              </div>
              <p className="text-spectr-muted leading-relaxed font-sans text-xs">
                Once USDC arrives at the deposit address on {currentNetworkMeta.name}, 1Click Defuser executes an atomic cross-chain swap into native NEAR USDC and forwards funds via <code className="text-spectr-primary">ft_transfer_call</code> directly to Pandem Escrow.
              </p>
            </div>
          </div>
        )}

        {/* Footer actions */}
        <div className="pt-2 flex gap-2 font-mono">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-none border border-spectr-hairline bg-spectr-surface-raised hover:bg-spectr-surface text-spectr-ink font-medium text-xs transition-colors"
          >
            Done / Close Drawer
          </button>
        </div>
      </div>
    </Drawer>
  );
}
