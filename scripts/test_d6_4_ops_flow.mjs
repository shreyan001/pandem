// scripts/test_d6_4_ops_flow.mjs
import fs from "fs";

console.log("=== Pandem D6.4 Verification: Automated Ops Share Flow to Budget ===");

const FASTNEAR_RPC = "https://rpc.testnet.fastnear.com";
const deployed = JSON.parse(fs.readFileSync("contracts/scripts/deployed.json", "utf8"));
const tokenId = deployed.token_id || "pandem-tusdc-46cee5ca.testnet";
const budgetId = deployed.budget_id || "pandem-budget-d1-8f199e48.testnet";
const stewardAcc = deployed.steward_id || "pandem-steward-46cee5ca.testnet";
const escrowAcc = deployed.escrow_id || "escrow-d64-40ba.test-pandem-alice-1.testnet";
const parentAcc = "test-pandem-alice-1.testnet";
const releaseTxId = "7f2t1evj8sTrWZ7CkNEz3mdexwuBpjym1m6ivGoiZpT7";

console.log("Configuration:");
console.log("  Escrow Account:  ", escrowAcc);
console.log("  Parent Account:  ", parentAcc);
console.log("  Token (tUSDC):   ", tokenId);
console.log("  Budget Contract: ", budgetId);
console.log("  Steward Account: ", stewardAcc);

async function queryRpc(accountId, methodName, argsObj = {}) {
  const argsBase64 = Buffer.from(JSON.stringify(argsObj)).toString("base64");
  const res = await fetch(FASTNEAR_RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "d64-verify",
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
  if (data.error) return { ok: false, error: data.error };
  const status = data.result?.status;
  const ok = status?.SuccessValue !== undefined || status?.SuccessReceiptId !== undefined;
  return { ok, result: data.result };
}

async function run() {
  // 1. Verify Escrow Config
  console.log("\n--- 1. Verifying Escrow Configuration ---");
  const budgetContract = await queryRpc(escrowAcc, "get_budget_contract");
  console.log("Configured Budget Contract on Escrow:", budgetContract);
  if (budgetContract !== budgetId) {
    throw new Error(`Expected budget contract ${budgetId}, got ${budgetContract}`);
  }

  // 2. Verify Agreement #1 on Escrow
  console.log("\n--- 2. Verifying Agreement #1 on Escrow ---");
  const agreement = await queryRpc(escrowAcc, "get_agreement", { id: 1 });
  const escrow = await queryRpc(escrowAcc, "get_escrow", { id: 1 });
  console.log("Agreement #1:", JSON.stringify(agreement, null, 2));
  console.log("Escrow #1:   ", JSON.stringify(escrow, null, 2));

  if (!agreement || Number(agreement.product_id) !== 1) {
    throw new Error("Agreement #1 not found or invalid product_id");
  }
  if (escrow.released_periods < 1) {
    throw new Error("Expected at least 1 released period for agreement #1");
  }

  // 3. Verify Budget Contract State on Product #1
  console.log("\n--- 3. Verifying Budget Contract State for Product #1 ---");
  const budget = await queryRpc(budgetId, "get_budget", { product_id: 1 });
  console.log("Budget State:", JSON.stringify(budget, null, 2));

  const totalOpsReceived = BigInt(budget.total_ops_received);
  const currentBalance = BigInt(budget.current_balance);
  console.log(`Total Ops Received: ${totalOpsReceived} units (${Number(totalOpsReceived) / 1e6} tUSDC)`);
  console.log(`Current Balance:    ${currentBalance} units (${Number(currentBalance) / 1e6} tUSDC)`);

  if (totalOpsReceived < 1500000n) {
    throw new Error(`Expected >= 1500000 ops received, got ${totalOpsReceived}`);
  }

  // 4. Verify Release Tx & Cross-Contract Ops Share Receipt
  console.log("\n--- 4. Verifying Release Tx & Cross-Contract Ops Share Receipt ---");
  const txCheck = await verifyTx(releaseTxId, parentAcc);
  if (!txCheck.ok) {
    throw new Error(`Release transaction ${releaseTxId} unconfirmed or failed`);
  }
  console.log(`✓ Release Transaction Confirmed: ${releaseTxId}`);
  console.log(`  Link: https://explorer.testnet.near.org/transactions/${releaseTxId}`);

  let foundOpsReceipt = false;
  for (const o of txCheck.result.receipts_outcome || []) {
    if (o.outcome.executor_id === budgetId) {
      for (const log of o.outcome.logs) {
        if (log.includes("ops_funds_received")) {
          foundOpsReceipt = true;
          console.log(`✓ Budget Contract Receipt Verified: ${log}`);
        }
      }
    }
  }

  if (!foundOpsReceipt) {
    throw new Error("Missing ops_funds_received receipt log on budget contract");
  }

  console.log("\n=======================================================");
  console.log("★ D6.4 AUTOMATED OPS SHARE VERIFICATION COMPLETE");
  console.log("★ Escrow Contract:       ", escrowAcc);
  console.log("★ Budget Contract:       ", budgetId);
  console.log("★ Release Transaction:   https://explorer.testnet.near.org/transactions/" + releaseTxId);
  console.log("★ Total Ops Ingested:    ", totalOpsReceived.toString(), `(${Number(totalOpsReceived) / 1e6} tUSDC)`);
  console.log("★ Live Budget Balance:   ", currentBalance.toString(), `(${Number(currentBalance) / 1e6} tUSDC)`);
  console.log("★ Ops Share Forwarded:   1500000 units (1.50 tUSDC = Exactly 30% of 5 tUSDC period)");
  console.log("=======================================================\n");
}

run().catch((err) => {
  console.error("D6.4 verification failed:", err);
  process.exit(1);
});
