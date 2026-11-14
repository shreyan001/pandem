"use client";

import { useState, useId } from "react";
import Link from "next/link";
import { PANDEM_ESCROW_ID, PANDEM_TOKEN_ID, SPLIT_BPS } from "@pandem/shared";

export interface SourceAsset {
  symbol: string;
  name: string;
  assetId: string;
  decimals: number;
  usdPrice: number;
}

export interface SourceChain {
  id: string;
  name: string;
  iconText: string;
  iconBg: string;
  textColor: string;
  borderColor: string;
  assets: SourceAsset[];
  estimatedGasUsd: number;
  defaultAddress: string;
  explorerName: string;
}

const SUPPORTED_CHAINS: SourceChain[] = [
  {
    id: "ethereum",
    name: "Ethereum",
    iconText: "ETH",
    iconBg: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    textColor: "text-blue-400",
    borderColor: "border-blue-500/40",
    estimatedGasUsd: 5.2,
    defaultAddress: "0x71C8705a2B88e608257053e19dB22919315A4eD8",
    explorerName: "Etherscan",
    assets: [
      {
        symbol: "USDC",
        name: "USD Coin",
        assetId: "ethereum:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
        decimals: 6,
        usdPrice: 1.0,
      },
      {
        symbol: "ETH",
        name: "Ether",
        assetId: "ethereum:native",
        decimals: 18,
        usdPrice: 3100.0,
      },
    ],
  },
  {
    id: "solana",
    name: "Solana",
    iconText: "SOL",
    iconBg: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    textColor: "text-purple-400",
    borderColor: "border-purple-500/40",
    estimatedGasUsd: 0.01,
    defaultAddress: "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin",
    explorerName: "Solscan",
    assets: [
      {
        symbol: "USDC",
        name: "USD Coin (SPL)",
        assetId: "solana:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        decimals: 6,
        usdPrice: 1.0,
      },
      {
        symbol: "SOL",
        name: "Solana",
        assetId: "solana:native",
        decimals: 9,
        usdPrice: 180.0,
      },
    ],
  },
  {
    id: "base",
    name: "Base",
    iconText: "BASE",
    iconBg: "bg-sky-500/20 text-sky-400 border-sky-500/30",
    textColor: "text-sky-400",
    borderColor: "border-sky-500/40",
    estimatedGasUsd: 0.15,
    defaultAddress: "0x4200000000000000000000000000000000000006",
    explorerName: "Basescan",
    assets: [
      {
        symbol: "USDC",
        name: "USD Coin",
        assetId: "base:0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
        decimals: 6,
        usdPrice: 1.0,
      },
      {
        symbol: "ETH",
        name: "Ether (Base)",
        assetId: "base:native",
        decimals: 18,
        usdPrice: 3100.0,
      },
    ],
  },
  {
    id: "arbitrum",
    name: "Arbitrum",
    iconText: "ARB",
    iconBg: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    textColor: "text-cyan-400",
    borderColor: "border-cyan-500/40",
    estimatedGasUsd: 0.2,
    defaultAddress: "0x912CE59144191C1204E64559FE8253a0e49E6548",
    explorerName: "Arbiscan",
    assets: [
      {
        symbol: "USDC",
        name: "USD Coin (Native)",
        assetId: "arbitrum:0xaf88d065e77c8cc2239327c5edb3a432268e5831",
        decimals: 6,
        usdPrice: 1.0,
      },
      {
        symbol: "ETH",
        name: "Ether (Arb One)",
        assetId: "arbitrum:native",
        decimals: 18,
        usdPrice: 3100.0,
      },
    ],
  },
  {
    id: "bitcoin",
    name: "Bitcoin",
    iconText: "BTC",
    iconBg: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    textColor: "text-amber-400",
    borderColor: "border-amber-500/40",
    estimatedGasUsd: 3.5,
    defaultAddress: "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq",
    explorerName: "Mempool.space",
    assets: [
      {
        symbol: "BTC",
        name: "Bitcoin",
        assetId: "bitcoin:native",
        decimals: 8,
        usdPrice: 88000.0,
      },
    ],
  },
  {
    id: "polygon",
    name: "Polygon",
    iconText: "POL",
    iconBg: "bg-violet-500/20 text-violet-400 border-violet-500/30",
    textColor: "text-violet-400",
    borderColor: "border-violet-500/40",
    estimatedGasUsd: 0.02,
    defaultAddress: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
    explorerName: "PolygonScan",
    assets: [
      {
        symbol: "USDC",
        name: "USD Coin (Native)",
        assetId: "polygon:0x3c499c542cef5e3811e1192ce70d8cc03d5c3359",
        decimals: 6,
        usdPrice: 1.0,
      },
      {
        symbol: "POL",
        name: "Polygon Ecosystem Token",
        assetId: "polygon:native",
        decimals: 18,
        usdPrice: 0.42,
      },
    ],
  },
];

const PERIOD_OPTIONS = [1, 2, 3, 6, 12];
const NEAR_USD_PRICE = 5.0; // Reference price: 1 wNEAR = $5.00 USD
const PRICE_PER_PERIOD_WNEAR = 0.1; // 0.1 wNEAR = $0.50 USD

type SimulationStep =
  | "idle"
  | "rfq"
  | "origin_lock"
  | "relayer_bridge"
  | "escrow_deposit"
  | "confirmed";

export function OnrampQuotePanel() {
  const [selectedChainId, setSelectedChainId] = useState<string>("base");
  const [selectedAssetSymbol, setSelectedAssetSymbol] = useState<string>("USDC");
  const [periods, setPeriods] = useState<number>(3);
  const [isPartnerTier, setIsPartnerTier] = useState<boolean>(true);
  const [customOriginAddress, setCustomOriginAddress] = useState<string>("");
  const [copiedPayload, setCopiedPayload] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"quote" | "payload" | "solver">("quote");

  // Simulation State
  const [simStep, setSimStep] = useState<SimulationStep>("idle");
  const [simTxHash, setSimTxHash] = useState<string | null>(null);

  const chain = SUPPORTED_CHAINS.find((c) => c.id === selectedChainId) || SUPPORTED_CHAINS[0];
  const asset =
    chain.assets.find((a) => a.symbol === selectedAssetSymbol) || chain.assets[0];

  const originAddress = customOriginAddress.trim() || chain.defaultAddress;

  // Pricing calculations
  const totalWNearRequired = periods * PRICE_PER_PERIOD_WNEAR;
  const totalUsdRequired = totalWNearRequired * NEAR_USD_PRICE;

  // Solver fee bps: Partner = 1 bp (0.01%), Standard = 25 bps (0.25%)
  const feeBps = isPartnerTier ? 1 : 25;
  const feeRate = feeBps / 10000;
  const solverFeeUsd = totalUsdRequired * feeRate;
  const totalGrossUsd = totalUsdRequired + solverFeeUsd;

  // Required input tokens in source asset
  const requiredAssetUnits = totalGrossUsd / asset.usdPrice;
  const estimatedGasAssetUnits = chain.estimatedGasUsd / (chain.assets.find(a => a.symbol === chain.assets[chain.assets.length - 1].symbol)?.usdPrice || asset.usdPrice);

  // Exact 1Click customRecipientMsg payload object
  const customRecipientMsgObj = {
    product_id: "1",
    periods: periods,
    subscriber: originAddress,
    refund_to: originAddress,
  };

  const customRecipientMsgStr = JSON.stringify(customRecipientMsgObj);

  // Full 1Click POST /v0/quote payload for EXACT_OUTPUT
  const oneClickQuotePayload = {
    dry: true,
    swapType: "EXACT_OUTPUT",
    originAsset: asset.assetId,
    destinationAsset: `near:${PANDEM_TOKEN_ID}`,
    amount: (BigInt(Math.round(totalWNearRequired * 10)) * BigInt("10000000000000000000000")).toString(), // in yocto (24 decimals)
    recipient: PANDEM_ESCROW_ID,
    refundTo: originAddress,
    depositType: "ORIGIN_CHAIN",
    recipientType: "DESTINATION_CHAIN",
    refundType: "ORIGIN_CHAIN",
    customRecipientMsg: customRecipientMsgStr,
    referral: "pandem-protocol",
    appFees: isPartnerTier ? [{ recipient: "pandem-treasury.testnet", fee: 1 }] : [],
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  const handleChainChange = (newChainId: string) => {
    setSelectedChainId(newChainId);
    const newChain = SUPPORTED_CHAINS.find((c) => c.id === newChainId);
    if (newChain) {
      // Keep USDC if supported, else switch to first asset
      const hasUsdc = newChain.assets.some((a) => a.symbol === "USDC");
      setSelectedAssetSymbol(hasUsdc ? "USDC" : newChain.assets[0].symbol);
    }
  };

  const runSimulation = async () => {
    setSimStep("rfq");
    await new Promise((r) => setTimeout(r, 700));

    setSimStep("origin_lock");
    await new Promise((r) => setTimeout(r, 900));

    setSimStep("relayer_bridge");
    await new Promise((r) => setTimeout(r, 1100));

    setSimStep("escrow_deposit");
    await new Promise((r) => setTimeout(r, 900));

    // Generate random simulated tx hash
    const randHex = Array.from({ length: 32 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join("");
    setSimTxHash(`0x${randHex}`);
    setSimStep("confirmed");
  };

  const resetSimulation = () => {
    setSimStep("idle");
    setSimTxHash(null);
  };

  // Escrow reserve splits for confirmation view
  const feeAmountWNear = (totalWNearRequired * SPLIT_BPS.PROTOCOL_FEE) / SPLIT_BPS.TOTAL;
  const opsAmountWNear = (totalWNearRequired * SPLIT_BPS.OPS_RESERVE) / SPLIT_BPS.TOTAL;
  const contAmountWNear = (totalWNearRequired * SPLIT_BPS.CONTINGENCY_RESERVE) / SPLIT_BPS.TOTAL;
  const stewardAmountWNear = totalWNearRequired - feeAmountWNear - opsAmountWNear - contAmountWNear;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Banner / Environment Badge */}
      <div className="rounded-none bg-[#171717] border border-[#2E2E2E] p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg shadow-none">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-none bg-[#262626] border border-[#2E2E2E] flex items-center justify-center shrink-0 mt-0.5">
            <span className="text-[#894DEF] font-mono text-sm font-bold">1C</span>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono font-bold tracking-wider text-[#894DEF] uppercase">
                1Click Cross-Chain Solver Integration
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-none bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                Dry-Quote Simulation Mode
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-none bg-zinc-800 text-zinc-300 border border-zinc-700">
                Testnet Hackathon Environment
              </span>
            </div>
            <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
              1Click Defuser resolves cross-chain liquidity across Ethereum, Solana, Bitcoin, Base, & Arbitrum.
              It executes atomic <code className="text-[#894DEF] bg-[#262626] px-1 py-0.2 rounded-none font-mono">ft_transfer_call</code> deposits directly into Pandem Escrow on NEAR Testnet.
            </p>
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-2 self-end sm:self-center">
          <a
            href="https://1click.chaindefuser.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-mono text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 px-3 py-1.5 rounded-none border border-zinc-700 transition-colors inline-flex items-center gap-1"
          >
            1Click Specs ↗
          </a>
        </div>
      </div>

      {/* Main Interactive On-Ramp Box */}
      <div className="rounded-none border border-zinc-800 bg-zinc-950/90 shadow-2xl overflow-hidden backdrop-blur-sm">
        {/* Step Tabs Navigation */}
        <div className="border-b border-zinc-800 px-6 pt-4 pb-0 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveTab("quote")}
              className={`pb-3 text-sm font-medium border-b-2 transition-all flex items-center gap-2 ${
                activeTab === "quote"
                  ? "border-[#894DEF] text-white"
                  : "border-transparent text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <span>1. Solver Dry-Quote</span>
              <span className="text-[10px] font-mono bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded-none">
                Live
              </span>
            </button>
            <button
              onClick={() => setActiveTab("payload")}
              className={`pb-3 text-sm font-medium border-b-2 transition-all flex items-center gap-2 ${
                activeTab === "payload"
                  ? "border-cyan-400 text-white"
                  : "border-transparent text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <span>2. Verifiable customRecipientMsg</span>
              <span className="text-[10px] font-mono bg-cyan-950 text-cyan-400 border border-cyan-800/40 px-1.5 py-0.5 rounded-none">
                JSON
              </span>
            </button>
            <button
              onClick={() => setActiveTab("solver")}
              className={`pb-3 text-sm font-medium border-b-2 transition-all flex items-center gap-2 ${
                activeTab === "solver"
                  ? "border-purple-400 text-white"
                  : "border-transparent text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <span>3. Defuser Solver Specs</span>
            </button>
          </div>

          <div className="pb-3 flex items-center gap-2">
            <span className="text-xs text-zinc-400 font-mono">Fee Tier:</span>
            <div className="inline-flex rounded-none bg-zinc-900 p-0.5 border border-zinc-800">
              <button
                onClick={() => setIsPartnerTier(true)}
                className={`px-2 py-0.5 text-xs font-mono rounded-none ${
                  isPartnerTier
                    ? "bg-[#262626] text-[#FAFAFA] border border-[#2E2E2E] font-bold"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
                title="Pandem Protocol Authenticated Tier (1 bp / 0.01%)"
              >
                Partner (0.01%)
              </button>
              <button
                onClick={() => setIsPartnerTier(false)}
                className={`px-2 py-0.5 text-xs font-mono rounded-none ${
                  !isPartnerTier
                    ? "bg-zinc-800 text-white font-bold"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
                title="Standard Unauthenticated Tier (25 bps / 0.25%)"
              >
                Standard (0.25%)
              </button>
            </div>
          </div>
        </div>

        {/* Tab 1: Dry-Quote Interface */}
        {activeTab === "quote" && (
          <div className="p-6 space-y-6">
            {/* 1. Source Chain Selector */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-none bg-[#894DEF]" />
                  Select Source Origin Chain
                </label>
                <span className="text-xs text-zinc-400 font-mono">
                  Solvers handle cross-chain routing
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                {SUPPORTED_CHAINS.map((c) => {
                  const isSelected = c.id === selectedChainId;
                  return (
                    <button
                      key={c.id}
                      onClick={() => handleChainChange(c.id)}
                      className={`p-3 rounded-none border text-left transition-all flex flex-col justify-between ${
                        isSelected
                          ? `bg-zinc-900 border-[#894DEF]/80 shadow-md shadow-none`
                          : "bg-zinc-900/40 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/70"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <span
                          className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-none border ${c.iconBg}`}
                        >
                          {c.iconText}
                        </span>
                        {isSelected && (
                          <span className="w-2 h-2 rounded-none bg-[#894DEF]" />
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-white">{c.name}</div>
                        <div className="text-[11px] font-mono text-zinc-400 mt-0.5">
                          Gas: ~${c.estimatedGasUsd.toFixed(2)}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Source Asset & Target Subscription Periods */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* Asset Selector */}
              <div className="rounded-none border border-zinc-800/80 bg-zinc-900/50 p-4 space-y-3">
                <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider block">
                  Source Asset ({chain.name})
                </label>
                <div className="flex gap-2">
                  {chain.assets.map((a) => {
                    const isSelected = a.symbol === asset.symbol;
                    return (
                      <button
                        key={a.symbol}
                        onClick={() => setSelectedAssetSymbol(a.symbol)}
                        className={`flex-1 py-2 px-3 rounded-none border text-sm font-mono flex items-center justify-between transition-all ${
                          isSelected
                            ? "bg-zinc-800 border-[#894DEF] text-white font-bold shadow-sm"
                            : "bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
                        }`}
                      >
                        <span>{a.symbol}</span>
                        <span className="text-xs text-zinc-400 font-normal">
                          ${a.usdPrice >= 100 ? a.usdPrice.toLocaleString() : a.usdPrice.toFixed(2)}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Origin Payer Address */}
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-mono text-zinc-400">
                      Origin Wallet Address ({chain.name}):
                    </span>
                    <button
                      onClick={() => setCustomOriginAddress(chain.defaultAddress)}
                      className="text-[10px] font-mono text-[#894DEF] hover:underline"
                    >
                      Reset Default
                    </button>
                  </div>
                  <input
                    type="text"
                    value={customOriginAddress || chain.defaultAddress}
                    onChange={(e) => setCustomOriginAddress(e.target.value)}
                    className="w-full bg-black/60 border border-zinc-700 rounded-none px-3 py-1.5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-[#894DEF]"
                    placeholder={`e.g. ${chain.defaultAddress}`}
                  />
                  <p className="text-[10px] text-zinc-400 mt-1 font-mono">
                    Used as the <span className="text-zinc-300">subscriber</span> identifier and fallback refund recipient if swap fails.
                  </p>
                </div>
              </div>

              {/* Subscription Period Selector */}
              <div className="rounded-none border border-zinc-800/80 bg-zinc-900/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
                    Escrow Subscription Periods
                  </label>
                  <span className="text-xs font-mono text-[#894DEF]">
                    Product #1 (0.1 wNEAR / period)
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {PERIOD_OPTIONS.map((p) => {
                    const isSelected = p === periods;
                    return (
                      <button
                        key={p}
                        onClick={() => setPeriods(p)}
                        className={`py-2 px-1 rounded-none border text-center text-xs font-mono transition-all ${
                          isSelected
                            ? "bg-[#262626] border-[#894DEF] text-[#FAFAFA] font-bold"
                            : "bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
                        }`}
                      >
                        <div>{p} {p === 1 ? "Period" : "Periods"}</div>
                        <div className="text-[10px] text-zinc-400 mt-0.5">
                          {(p * PRICE_PER_PERIOD_WNEAR).toFixed(1)} wN
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Target Product Summary */}
                <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-zinc-400 font-mono">Target Service: </span>
                    <span className="text-white font-medium">PrivateGPT Enclave Edition</span>
                  </div>
                  <div className="font-mono text-zinc-300">
                    ~{(periods * 5)} mins of service
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Live Solver Dry-Quote Matrix */}
            <div className="rounded-none border border-zinc-800 bg-black/40 p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-none bg-cyan-400 animate-pulse" />
                  <span className="text-xs font-mono uppercase tracking-wider text-white font-bold">
                    Defuser Solver Route · EXACT_OUTPUT Dry-Quote
                  </span>
                </div>
                <div className="text-xs font-mono text-zinc-400 flex items-center gap-1.5">
                  <span>Quote Status:</span>
                  <span className="text-[#894DEF] font-bold bg-[#262626] px-2 py-0.5 rounded-none border border-[#2E2E2E]">
                    PREVIEW READY
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Guaranteed Output */}
                <div className="bg-zinc-900/60 rounded-none p-3 border border-zinc-800/80">
                  <span className="text-[11px] font-mono text-zinc-400 block mb-1">
                    Guaranteed Minimum Output
                  </span>
                  <div className="text-lg font-mono font-bold text-[#894DEF] flex items-baseline gap-1">
                    <span>{totalWNearRequired.toFixed(4)}</span>
                    <span className="text-xs text-zinc-400">wNEAR</span>
                  </div>
                  <span className="text-[11px] font-mono text-zinc-400 mt-0.5 block">
                    ≈ ${totalUsdRequired.toFixed(2)} USD value
                  </span>
                </div>

                {/* 2. Source Deposit Amount */}
                <div className="bg-zinc-900/60 rounded-none p-3 border border-zinc-800/80">
                  <span className="text-[11px] font-mono text-zinc-400 block mb-1">
                    Estimated Source In ({asset.symbol})
                  </span>
                  <div className="text-lg font-mono font-bold text-white flex items-baseline gap-1">
                    <span>
                      {requiredAssetUnits < 0.001
                        ? requiredAssetUnits.toFixed(6)
                        : requiredAssetUnits < 1
                        ? requiredAssetUnits.toFixed(4)
                        : requiredAssetUnits.toFixed(2)}
                    </span>
                    <span className="text-xs text-zinc-400">{asset.symbol}</span>
                  </div>
                  <span className="text-[11px] font-mono text-zinc-400 mt-0.5 block">
                    ≈ ${totalGrossUsd.toFixed(4)} USD gross
                  </span>
                </div>

                {/* 3. Solver Fee */}
                <div className="bg-zinc-900/60 rounded-none p-3 border border-zinc-800/80">
                  <span className="text-[11px] font-mono text-zinc-400 block mb-1">
                    Solver Execution Fee
                  </span>
                  <div className="text-lg font-mono font-bold text-cyan-300 flex items-baseline gap-1">
                    <span>{(feeRate * 100).toFixed(2)}%</span>
                    <span className="text-xs text-zinc-400">({feeBps} bps)</span>
                  </div>
                  <span className="text-[11px] font-mono text-zinc-400 mt-0.5 block">
                    +${solverFeeUsd.toFixed(4)} USD
                  </span>
                </div>

                {/* 4. Est. Network Gas */}
                <div className="bg-zinc-900/60 rounded-none p-3 border border-zinc-800/80">
                  <span className="text-[11px] font-mono text-zinc-400 block mb-1">
                    Estimated Origin Gas ({chain.name})
                  </span>
                  <div className="text-lg font-mono font-bold text-zinc-200 flex items-baseline gap-1">
                    <span>~${chain.estimatedGasUsd.toFixed(2)}</span>
                    <span className="text-xs text-zinc-400">USD</span>
                  </div>
                  <span className="text-[11px] font-mono text-zinc-400 mt-0.5 block">
                    Paid on {chain.name}
                  </span>
                </div>
              </div>

              {/* Settlement Route Path */}
              <div className="pt-2 text-xs font-mono text-zinc-300 bg-zinc-900/30 rounded-none p-3 border border-zinc-800/50 flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-zinc-400">Solver Route:</span>
                  <span className="px-2 py-0.5 rounded-none bg-zinc-800 text-zinc-200">
                    {chain.name} ({asset.symbol})
                  </span>
                  <span className="text-zinc-500">→</span>
                  <span className="px-2 py-0.5 rounded-none bg-purple-950 text-purple-300 border border-purple-800/40">
                    1Click Defuser Network
                  </span>
                  <span className="text-zinc-500">→</span>
                  <span className="px-2 py-0.5 rounded-none bg-[#262626] text-[#FAFAFA] border border-[#2E2E2E]">
                    NEAR {PANDEM_TOKEN_ID}
                  </span>
                  <span className="text-zinc-500">→</span>
                  <span className="px-2 py-0.5 rounded-none bg-cyan-950 text-cyan-300 border border-cyan-800/40 font-mono">
                    pandem-escrow.testnet
                  </span>
                </div>
                <div className="text-zinc-400 whitespace-nowrap">
                  Est. Settlement: <span className="text-[#894DEF] font-bold">~15-30s</span>
                </div>
              </div>
            </div>

            {/* 4. Verifiable customRecipientMsg Card */}
            <div className="rounded-none border border-zinc-800 bg-zinc-950 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-white">
                    Verifiable 1Click <code className="text-cyan-400">customRecipientMsg</code> Preview
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.2 rounded-none bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    Passed to ft_transfer_call
                  </span>
                </div>
                <button
                  onClick={() => handleCopy(customRecipientMsgStr)}
                  className="text-xs font-mono text-zinc-400 hover:text-white px-2.5 py-1 rounded-none bg-zinc-900 border border-zinc-800 transition-colors flex items-center gap-1"
                >
                  {copiedPayload ? (
                    <span className="text-[#894DEF]">✓ Copied</span>
                  ) : (
                    <span>Copy JSON</span>
                  )}
                </button>
              </div>
              <pre className="bg-black/80 rounded-none p-3 text-xs font-mono text-[#894DEF] overflow-x-auto border border-zinc-800/80">
                {JSON.stringify(customRecipientMsgObj, null, 2)}
              </pre>
              <p className="text-[11px] text-zinc-400 font-mono">
                When the solver fulfills your swap, it invokes NEAR token{" "}
                <code className="text-zinc-300">ft_transfer_call(receiver: "{PANDEM_ESCROW_ID}", msg: ...)</code>.
                The Escrow contract reads your origin address <code className="text-zinc-300">{originAddress.slice(0, 10)}...</code>, initializes your agreement, and locks funds into split reserves.
              </p>
            </div>

            {/* 5. Action Button & Simulator Trigger */}
            <div className="pt-2">
              {simStep === "idle" && (
                <button
                  onClick={runSimulation}
                  className="w-full py-3.5 px-6 rounded-none font-medium text-sm bg-[#894DEF] hover:bg-[#A273F2] text-[#FAFAFA] border border-[#FAFAFA] font-mono font-bold transition-colors flex items-center justify-center gap-2 group"
                >
                  <span>Simulate 1Click Swap & Deposit</span>
                  <span className="text-black/70 group-hover:translate-x-1 transition-transform">
                    →
                  </span>
                </button>
              )}

              {/* Multi-Step Simulation Modal / Progress View */}
              {simStep !== "idle" && (
                <div className="rounded-none border border-[#2E2E2E] bg-zinc-900/90 p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-none bg-[#894DEF] animate-pulse" />
                      <span className="text-sm font-mono font-bold text-white">
                        {simStep === "confirmed"
                          ? "1Click Solver Deposit Confirmed!"
                          : "Simulating Cross-Chain Solver Execution..."}
                      </span>
                    </div>
                    {simStep === "confirmed" && (
                      <button
                        onClick={resetSimulation}
                        className="text-xs font-mono text-zinc-400 hover:text-white px-2 py-1 rounded-none bg-zinc-800"
                      >
                        Run Again
                      </button>
                    )}
                  </div>

                  {/* Step Progression Bar */}
                  <div className="space-y-3 font-mono text-xs">
                    {/* Step 1: RFQ */}
                    <div
                      className={`flex items-center justify-between p-2.5 rounded-none border transition-all ${
                        simStep === "rfq"
                          ? "bg-zinc-800/80 border-[#2E2E2E] text-white"
                          : simStep === "origin_lock" ||
                            simStep === "relayer_bridge" ||
                            simStep === "escrow_deposit" ||
                            simStep === "confirmed"
                          ? "bg-zinc-900/40 border-zinc-800 text-zinc-400"
                          : "opacity-40 border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[#894DEF] font-bold">1.</span>
                        <span>Broadcast Intent to 1Click Solver Mesh (POST /v0/quote)</span>
                      </div>
                      <span className="text-[11px]">
                        {simStep === "rfq" ? "Matching Solvers..." : "✓ Solvers Locked"}
                      </span>
                    </div>

                    {/* Step 2: Origin Lock */}
                    <div
                      className={`flex items-center justify-between p-2.5 rounded-none border transition-all ${
                        simStep === "origin_lock"
                          ? "bg-zinc-800/80 border-[#2E2E2E] text-white"
                          : simStep === "relayer_bridge" ||
                            simStep === "escrow_deposit" ||
                            simStep === "confirmed"
                          ? "bg-zinc-900/40 border-zinc-800 text-zinc-400"
                          : "opacity-40 border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[#894DEF] font-bold">2.</span>
                        <span>
                          Origin Chain Deposit ({requiredAssetUnits.toFixed(4)} {asset.symbol} on {chain.name})
                        </span>
                      </div>
                      <span className="text-[11px]">
                        {simStep === "origin_lock" ? "Confirming Lock..." : simStep === "rfq" ? "Pending" : "✓ Locked"}
                      </span>
                    </div>

                    {/* Step 3: Relayer Delivery */}
                    <div
                      className={`flex items-center justify-between p-2.5 rounded-none border transition-all ${
                        simStep === "relayer_bridge"
                          ? "bg-zinc-800/80 border-[#2E2E2E] text-white"
                          : simStep === "escrow_deposit" || simStep === "confirmed"
                          ? "bg-zinc-900/40 border-zinc-800 text-zinc-400"
                          : "opacity-40 border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[#894DEF] font-bold">3.</span>
                        <span>Solver executes ft_transfer_call with customRecipientMsg</span>
                      </div>
                      <span className="text-[11px]">
                        {simStep === "relayer_bridge" ? "Relaying on NEAR..." : simStep === "escrow_deposit" || simStep === "confirmed" ? "✓ Delivered" : "Pending"}
                      </span>
                    </div>

                    {/* Step 4: Escrow Ingestion */}
                    <div
                      className={`flex items-center justify-between p-2.5 rounded-none border transition-all ${
                        simStep === "escrow_deposit"
                          ? "bg-zinc-800/80 border-[#2E2E2E] text-white"
                          : simStep === "confirmed"
                          ? "bg-zinc-900/40 border-zinc-800 text-zinc-400"
                          : "opacity-40 border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[#894DEF] font-bold">4.</span>
                        <span>Pandem Escrow ft_on_transfer: Invariants & Reserves Verified</span>
                      </div>
                      <span className="text-[11px]">
                        {simStep === "escrow_deposit" ? "Verifying splits..." : simStep === "confirmed" ? "✓ Active" : "Pending"}
                      </span>
                    </div>
                  </div>

                  {/* Confirmation Receipt */}
                  {simStep === "confirmed" && (
                    <div className="rounded-none bg-[#171717] border border-[#2E2E2E] p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-[#894DEF]">
                          ✓ Subscription Agreement Created on NEAR Testnet
                        </span>
                        <span className="text-[10px] font-mono text-zinc-400">
                          Block Finalized
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                        <div className="bg-black/50 p-2 rounded-none">
                          <span className="text-zinc-500 block text-[10px]">Subscriber</span>
                          <span className="text-white truncate block" title={originAddress}>
                            {originAddress.slice(0, 10)}...{originAddress.slice(-4)}
                          </span>
                        </div>
                        <div className="bg-black/50 p-2 rounded-none">
                          <span className="text-zinc-500 block text-[10px]">Funded Periods</span>
                          <span className="text-[#894DEF] font-bold">{periods} Periods</span>
                        </div>
                        <div className="bg-black/50 p-2 rounded-none">
                          <span className="text-zinc-500 block text-[10px]">Escrow Deposit</span>
                          <span className="text-white font-bold">{totalWNearRequired.toFixed(2)} wNEAR</span>
                        </div>
                        <div className="bg-black/50 p-2 rounded-none">
                          <span className="text-zinc-500 block text-[10px]">Escrow Status</span>
                          <span className="text-[#894DEF] font-bold">Active</span>
                        </div>
                      </div>

                      {/* Split Breakdown */}
                      <div className="bg-black/40 rounded-none p-2.5 text-[11px] font-mono text-zinc-300">
                        <div className="text-zinc-400 mb-1 font-bold">Reserve Splits Allocated:</div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <div>Steward (47.5%): <span className="text-white">{stewardAmountWNear.toFixed(4)} wN</span></div>
                          <div>Ops (30%): <span className="text-white">{opsAmountWNear.toFixed(4)} wN</span></div>
                          <div>Contingency (20%): <span className="text-white">{contAmountWNear.toFixed(4)} wN</span></div>
                          <div>Fee (2.5%): <span className="text-white">{feeAmountWNear.toFixed(4)} wN</span></div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 text-xs font-mono">
                        <span className="text-zinc-400 truncate max-w-xs">
                          Simulated Tx: <code className="text-zinc-300">{simTxHash?.slice(0, 18)}...</code>
                        </span>
                        <div className="flex gap-2">
                          <Link
                            href="/me"
                            className="px-3 py-1 rounded-none bg-[#894DEF] hover:bg-[#A273F2] text-[#FAFAFA] border border-[#FAFAFA] font-bold transition-colors"
                          >
                            View in /me →
                          </Link>
                          <a
                            href={`https://explorer.testnet.near.org/accounts/${PANDEM_ESCROW_ID}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1 rounded-none bg-zinc-800 hover:bg-zinc-700 text-white transition-colors"
                          >
                            Escrow Explorer ↗
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Verifiable customRecipientMsg Full Specs */}
        {activeTab === "payload" && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-mono font-bold text-white">
                  1Click REST API: POST /v0/quote Payload
                </h3>
                <p className="text-xs text-zinc-400 font-mono mt-0.5">
                  Exact schema submitted to 1Click Defuser for automated cross-chain subscription fulfillment.
                </p>
              </div>
              <button
                onClick={() => handleCopy(JSON.stringify(oneClickQuotePayload, null, 2))}
                className="text-xs font-mono text-zinc-300 hover:text-white px-3 py-1.5 rounded-none bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 transition-colors"
              >
                {copiedPayload ? "✓ Copied Full Payload" : "Copy Full Payload"}
              </button>
            </div>

            <pre className="bg-black/90 rounded-none p-4 text-xs font-mono text-[#894DEF] overflow-x-auto border border-zinc-800">
              {JSON.stringify(oneClickQuotePayload, null, 2)}
            </pre>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="rounded-none bg-zinc-900/60 border border-zinc-800 p-3 text-xs font-mono text-zinc-300 space-y-1">
                <span className="text-white font-bold block">Why EXACT_OUTPUT?</span>
                <p className="text-zinc-400 text-[11px] leading-relaxed">
                  Escrow subscriptions require exact funding amounts (e.g. 0.3 wNEAR for 3 periods). With <code className="text-[#894DEF]">EXACT_OUTPUT</code>, the solver guarantees the destination receives the exact required token balance. Any excess input on the origin chain is returned to <code className="text-zinc-300">refundTo</code>.
                </p>
              </div>
              <div className="rounded-none bg-zinc-900/60 border border-zinc-800 p-3 text-xs font-mono text-zinc-300 space-y-1">
                <span className="text-white font-bold block">How customRecipientMsg Works</span>
                <p className="text-zinc-400 text-[11px] leading-relaxed">
                  NEAR NEP-141 tokens support <code className="text-[#894DEF]">ft_transfer_call</code>, which carries a stringified <code className="text-cyan-400">msg</code> to the receiver contract. Pandem Escrow parses this string to identify the subscriber address and product ID, without requiring the payer to sign a NEAR transaction.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Defuser Solver Architecture */}
        {activeTab === "solver" && (
          <div className="p-6 space-y-4 text-xs font-mono text-zinc-300">
            <h3 className="text-sm font-bold text-white mb-2">
              NEAR Intents & 1Click Defuser Architecture for Pandem
            </h3>
            
            <div className="space-y-3">
              <div className="p-3.5 rounded-none bg-zinc-900/70 border border-zinc-800">
                <div className="text-[#894DEF] font-bold mb-1">1. Decentralized Solver RFQ (Request For Quote)</div>
                <p className="text-zinc-400 leading-relaxed text-[11px]">
                  When a subscriber initiates an on-ramp from Base, Ethereum, Solana, or Bitcoin, 1Click broadcasts an Intent to a competitive network of independent market makers (solvers). Solvers compete to provide the tightest exchange rates and fastest fulfillment times.
                </p>
              </div>

              <div className="p-3.5 rounded-none bg-zinc-900/70 border border-zinc-800">
                <div className="text-cyan-400 font-bold mb-1">2. Atomic Escrow Delivery</div>
                <p className="text-zinc-400 leading-relaxed text-[11px]">
                  Unlike bridge tokens that require manual claiming or wrapping, the winning solver delivers native NEP-141 tokens directly into <code className="text-white">pandem-escrow-d1-8f199e48.testnet</code>. The entire multi-chain interaction settles in a single atomic pipeline.
                </p>
              </div>

              <div className="p-3.5 rounded-none bg-zinc-900/70 border border-zinc-800">
                <div className="text-purple-400 font-bold mb-1">3. Non-Custodial Refund Invariant</div>
                <p className="text-zinc-400 leading-relaxed text-[11px]">
                  If the origin deposit fails or the solver is unable to deliver the exact required output before the deadline (~10 minutes), the solver protocol automatically refunds the deposit on the origin chain. Once delivered, Pandem's native smart contract enforces automated pro-rata refunds upon missed heartbeats.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
