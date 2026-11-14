import { NextRequest, NextResponse } from "next/server";

export interface IntentQuoteRequest {
  network: "base" | "arb" | "eth" | "sol";
  amountUsdc?: number;
  refundAddress?: string;
  recipient?: string;
}

const NETWORK_CONFIGS = {
  base: {
    name: "Base",
    symbol: "USDC (Base)",
    assetId: "nep141:base-0x833589fcd6edb6e08f4c7c32d4f71b54bda02913.omft.near",
    defaultRefund: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
    decimals: 6,
    explorer: "https://basescan.org/address/",
  },
  arb: {
    name: "Arbitrum One",
    symbol: "USDC (Arbitrum)",
    assetId: "nep141:arb-0xaf88d065e77c8cc2239327c5edb3a432268e5831.omft.near",
    defaultRefund: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
    decimals: 6,
    explorer: "https://arbiscan.io/address/",
  },
  eth: {
    name: "Ethereum",
    symbol: "USDC (Ethereum)",
    assetId: "nep141:eth-0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.omft.near",
    defaultRefund: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
    decimals: 6,
    explorer: "https://etherscan.io/address/",
  },
  sol: {
    name: "Solana",
    symbol: "USDC (Solana)",
    assetId: "nep141:sol-5ce3bf3a31af18be40ba30f721101b4341690186.omft.near",
    defaultRefund: "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin",
    decimals: 6,
    explorer: "https://solscan.io/account/",
  },
} as const;

// Official NEAR native USDC contract on Mainnet (used by 1Click Defuser)
const NEAR_USDC_MAINNET = "nep141:17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1";
const ONE_CLICK_API_URL = "https://1click.chaindefuser.com/v0/quote";

export async function POST(req: NextRequest) {
  try {
    const body: IntentQuoteRequest = await req.json();
    const networkKey = body.network && body.network in NETWORK_CONFIGS ? body.network : "base";
    const netConfig = NETWORK_CONFIGS[networkKey];

    const amountNum = Math.max(1, Number(body.amountUsdc) || 5);
    const amountAtomic = Math.round(amountNum * 10 ** netConfig.decimals).toString();
    const refundTo = body.refundAddress?.trim() || netConfig.defaultRefund;
    const recipient = body.recipient?.trim() || "test.near";

    const deadlineDate = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
    const deadlineIso = deadlineDate.toISOString();

    const quotePayload = {
      dry: false,
      swapType: "EXACT_INPUT",
      originAsset: netConfig.assetId,
      destinationAsset: NEAR_USDC_MAINNET,
      amount: amountAtomic,
      recipient: recipient,
      recipientType: "DESTINATION_CHAIN",
      depositType: "ORIGIN_CHAIN",
      refundTo: refundTo,
      refundType: "ORIGIN_CHAIN",
      slippageTolerance: 100, // 1%
      quoteWaitingTimeMs: 3000,
      deadline: deadlineIso,
    };

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (process.env.ONE_CLICK_API_KEY) {
      headers["Authorization"] = `Bearer ${process.env.ONE_CLICK_API_KEY}`;
    }

    let isLiveApi = false;
    let quoteData: any = null;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(ONE_CLICK_API_URL, {
        method: "POST",
        headers,
        body: JSON.stringify(quotePayload),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        quoteData = await res.json();
        if (quoteData && quoteData.quote) {
          isLiveApi = true;
        }
      }
    } catch {
      // API call failed, fallback below
    }

    if (isLiveApi && quoteData?.quote) {
      const q = quoteData.quote;
      const amountInFormatted = q.amountInFormatted || amountNum.toFixed(2);
      const amountOutFormatted = q.amountOutFormatted || (amountNum * 0.9999).toFixed(6);
      const rate = (Number(amountOutFormatted) / Number(amountInFormatted) || 0.9999).toFixed(6);

      return NextResponse.json({
        success: true,
        isLiveApi: true,
        correlationId: quoteData.correlationId || "live-1click",
        network: networkKey,
        networkName: netConfig.name,
        symbol: netConfig.symbol,
        depositAddress: q.depositAddress || "0x0000000000000000000000000000000000000000",
        amountIn: amountNum,
        amountInFormatted,
        amountOutFormatted,
        rate,
        defuserFeeRate: "0.01% (1 bp)",
        deadline: q.deadline || deadlineIso,
        timeEstimate: q.timeEstimate || 35,
        explorerUrl: `${netConfig.explorer}${q.depositAddress}`,
        disclaimer: "Mainnet quote, demo does not execute on testnet",
      });
    }

    // Graceful fallback if 1Click is rate-limited or offline
    const fallbackDeposit =
      networkKey === "sol"
        ? "5P6PUox5c8ipimaKrsZi7MGryhJQwmwaxXUAN2EjX4dd"
        : "0x17015901174DB5429C41b35dA922d5a1036F7FC4";

    return NextResponse.json({
      success: true,
      isLiveApi: false,
      fallbackNotice: "Live 1Click Defuser RFQ offline/rate-limited; display mode active",
      correlationId: "fallback-preview",
      network: networkKey,
      networkName: netConfig.name,
      symbol: netConfig.symbol,
      depositAddress: fallbackDeposit,
      amountIn: amountNum,
      amountInFormatted: amountNum.toFixed(2),
      amountOutFormatted: (amountNum * 0.9999).toFixed(6),
      rate: "0.999900",
      defuserFeeRate: "0.01% (1 bp)",
      deadline: deadlineIso,
      timeEstimate: 35,
      explorerUrl: `${netConfig.explorer}${fallbackDeposit}`,
      disclaimer: "Mainnet quote, demo does not execute on testnet",
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err?.message || "Failed to process cross-chain quote request",
      },
      { status: 500 }
    );
  }
}
