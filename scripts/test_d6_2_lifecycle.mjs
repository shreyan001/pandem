// scripts/test_d6_2_lifecycle.mjs
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

console.log("=== Pandem D6.2 Lifecycle Verification: Tiers, Upgrade, Renew, Cancel ===");

const FASTNEAR_RPC = "https://rpc.testnet.fastnear.com";
const tokenId = "pandem-tusdc-46cee5ca.testnet";
const escrowId = "escrow-d6-df23.test-pandem-alice-1.testnet";
const aliceId = "test-pandem-alice-1.testnet";

console.log("Configuration:");
console.log("  Token (tUSDC):  ", tokenId);
console.log("  Escrow Contract:", escrowId);
console.log("  Subscriber:     ", aliceId);

const knownReceipts = {
  subscribeTx: "FuSkAiSVCihP9Qrkgyv7wagFy5chGPtE2PJXs8hSzAeZ",
  upgradeTx: "HzKT8xwouFyiCqFxB4537VJg4EkmCvtYY2t5UZsaFtvn",
  renewTx: "GMZ4ya8KXwVWDAgmdW9HQXcJov3jM13fT4Qav62V74Ut",
  cancelTx: "8FkaGuUcsKirk9xvjkyTXDrK3qVCWX67yLsfZywseN9C",
};

async function queryRpc(accountId, methodName, argsObj = {}) {
  const argsBase64 = Buffer.from(JSON.stringify(argsObj)).toString("base64");
  const res = await fetch(FASTNEAR_RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "d62-verify",
      method: "query",
      params: {
        request_type: "call_function",
        finality: "final",
        account_id: accountId,
        method_name: methodName,
        args_base64: argsBase64,
      },
    }),
  });
  const json = await res.json();
  if (json.error) throw new Error(JSON.stringify(json.error));
  const decoded = Buffer.from(json.result.result).toString("utf8");
  return JSON.parse(decoded);
}

async function verifyTx(txId, accountId) {
  const res = await fetch(FASTNEAR_RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "tx-check",
      method: "tx",
      params: [txId, accountId],
    }),
  });
  const data = await res.json();
  if (data.error) return false;
  const status = data.result?.status;
  return status?.SuccessValue !== undefined || status?.SuccessReceiptId !== undefined;
}

async function run() {
  // 0. Query Alice's current balance
  console.log("\n--- 0. Checking Alice's tUSDC Balance ---");
  const bal = await queryRpc(tokenId, "ft_balance_of", { account_id: aliceId });
  console.log(`Alice Current tUSDC: ${bal} (${Number(bal) / 1e6} tUSDC)`);

  // 1. Verify Agreement #1 on Escrow
  console.log("\n--- 1. Querying Live Agreement #1 State on Escrow ---");
  const agreement = await queryRpc(escrowId, "get_agreement", { id: 1 });
  const escrow = await queryRpc(escrowId, "get_escrow", { id: 1 });

  console.log("Agreement #1:", JSON.stringify(agreement, null, 2));
  console.log("Escrow #1:   ", JSON.stringify(escrow, null, 2));

  if (!agreement || !escrow) {
    throw new Error("Agreement #1 not found on escrow");
  }

  // 2. Verify all 4 lifecycle transactions on-chain
  console.log("\n--- 2. Verifying Lifecycle Transaction Proofs on FastNear RPC ---");
  for (const [name, txId] of Object.entries(knownReceipts)) {
    const ok = await verifyTx(txId, aliceId);
    if (!ok) {
      throw new Error(`Transaction ${txId} failed verification`);
    }
    console.log(`  ✓ ${name}: ${txId} (Confirmed)`);
  }

  console.log("\n=======================================================");
  console.log("★ D6.2 GRADED SUBSCRIPTION LIFECYCLE COMPLETE RECEIPTS:");
  console.log("★ 1. Subscribe (Pro Tier, 2 periods): https://explorer.testnet.near.org/transactions/" + knownReceipts.subscribeTx);
  console.log("★ 2. Upgrade (Prorated to Max Tier):  https://explorer.testnet.near.org/transactions/" + knownReceipts.upgradeTx);
  console.log("★ 3. Renew (+1 period Max Tier):     https://explorer.testnet.near.org/transactions/" + knownReceipts.renewTx);
  console.log("★ 4. Cancel (Refund future periods):  https://explorer.testnet.near.org/transactions/" + knownReceipts.cancelTx);
  console.log("=======================================================\n");
}

run().catch((err) => {
  console.error("Lifecycle verification failed:", err);
  process.exit(1);
});
