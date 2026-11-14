// web/src/lib/pandem-intents-and-keys.ts
import crypto from "crypto";

const ONE_CLICK_API = "https://1click.chaindefuser.com/v0";
const NEAR_AI_CLOUD_ENDPOINT = "https://cloud-api.near.ai/v1";

export interface PandemSubscriptionIntentInput {
  originAssetId: string; // e.g. "nep141:base-0x833589fcd6edb6e08f4c7c32d4f71b54bda02913.omft.near" or "nep141:wrap.near"
  amountAtomic: string;  // e.g. "20000000" for 20 USDC (6 decimals)
  productId: string;
  subscriberLocalSecret: string;
  refundAddress: string;
}

/**
 * 1. Requests a Confidential NEAR Intent Quote (`confidentiality: "advanced"`)
 * Breaks the on-chain link between the user's wallet and the Pandem Tripartite Contract.
 */
export async function createPandemPrivateSubscriptionQuote(
  input: PandemSubscriptionIntentInput
) {
  const blindCommitmentHash = crypto
    .createHash("sha256")
    .update(`${input.subscriberLocalSecret}:${input.productId}`)
    .digest("hex");

  const body = {
    dry: false,
    swapType: "EXACT_INPUT",
    slippageTolerance: 50,
    originAsset: input.originAssetId,
    depositType: "ORIGIN_CHAIN",
    destinationAsset:
      "nep141:17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1", // Official NEAR USDC
    amount: input.amountAtomic,
    recipient: process.env.NEXT_PUBLIC_PANDEM_CONTRACT_ID || "pandem-tripartite.near",
    recipientType: "DESTINATION_CHAIN",
    refundTo: input.refundAddress,
    refundType: "ORIGIN_CHAIN",
    confidentiality: "advanced", // Routes through NEAR Confidential Intents Private Shard
    customRecipientMsg: JSON.stringify({
      product_id: input.productId,
      blind_commitment_hash: blindCommitmentHash,
      duration_sec: 2592000, // 30 days
    }),
    deadline: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
  };

  const res = await fetch(`${ONE_CLICK_API}/quote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Pandem Confidential Intent quote error: ${res.statusText}`);
  }

  const data = await res.json();
  return {
    quoteId: data.id,
    shieldedDepositAddress: data.quote?.depositAddress,
    blindCommitmentHash,
  };
}

/**
 * 2. Generates a Pandem-Managed Scoped API Key for a Developer's Attested Enclave
 */
export function issuePandemScopedApiKey(productId: string, teeComposeHash: string) {
  const secret = process.env.PANDEM_GATEWAY_SECRET || "pandem-tee-master-secret";
  const token = crypto
    .createHmac("sha256", secret)
    .update(`${productId}:${teeComposeHash}:${Date.now()}`)
    .digest("hex")
    .slice(0, 32);

  const apiKey = `pk-pandem-tee-${productId}-${token}`;
  const apiKeyHash = crypto.createHash("sha256").update(apiKey).digest("hex");

  return {
    apiKey,
    apiKeyHash,
    proxyBaseUrl: "https://gateway.pandem.near.page/v1",
    upstreamNearAiCloudUrl: NEAR_AI_CLOUD_ENDPOINT,
  };
}
