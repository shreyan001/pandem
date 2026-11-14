// contracts/scripts/resume_d4.mjs
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

console.log("================================================================================");
console.log("=== RESUMING PANDEM D4 TESTNET DEMO RUN (STEPS 3 - 10) ===");
console.log("================================================================================");

const deployed = JSON.parse(fs.readFileSync("contracts/scripts/deployed.json", "utf8"));
const tokenId = deployed.token_id;
const escrowId = deployed.escrow_id;
const budgetId = deployed.budget_id;
const stewardId = deployed.steward_id;
const agentId = deployed.agent_id;

const productId = 2;
const productName = "LocalAI";
const productSlug = "localai";
const subscriberId = "test-pandem-check-1.testnet";
const agreementId = 3;

// Previous verified receipts
const receipts = {
  subscriberAccount: subscriberId,
  productId,
  productName,
  escrowContract: escrowId,
  budgetContract: budgetId,
  tokenContract: tokenId,
  storageTx: "YJbKbNUQHXCbFJWb38Aaz51MySYKKtuX18ayGRd7CjP",
  faucetTx: "DvCav8Bgays4LvHHoiRoxsw6TqBVKPNF4eQJhSwRwRTr",
  subscribeTx: "3oW6x2wivZWKpC1ydtoi75cHTbzAv3HBhhBhFmUTNjxs",
  accessUrl: `https://${productSlug}.pandem.testnet/session?subscriber=${subscriberId}&tier=pro`,
  subscriberEmail: "subscriber.check1@confidential-saas.io",
  agreementId,
};

const tmpDir = path.join(os.tmpdir(), `pandem-d4-resume-${Date.now()}`);
fs.mkdirSync(tmpDir, { recursive: true });

function run(cmd) {
  console.log(`\n> ${cmd}`);
  const out = execSync(`${cmd} 2>&1`, { encoding: "utf8" });
  console.log(out.trim());
  return out;
}

function extractTxId(output) {
  const m = output.match(/Transaction ID:\s*([A-Za-z0-9]+)/i) || output.match(/transactions\/([A-Za-z0-9]+)/i);
  return m ? m[1] : null;
}

try {
  // ---------------------------------------------------------------------------
  // STEP 3: Seed Ops Budget for Product #2 with action: "receive_ops_funds"
  // ---------------------------------------------------------------------------
  console.log("\n---------------------------------------------------------------------------");
  console.log(`STEP 3: Seeding 1.5 tUSDC to Ops Budget for ${productName} (Product #${productId})...`);
  console.log("---------------------------------------------------------------------------");
  const seedMsg = JSON.stringify({ action: "receive_ops_funds", product_id: productId });
  const seedFile = path.join(tmpDir, "seed.json");
  fs.writeFileSync(
    seedFile,
    JSON.stringify({
      receiver_id: budgetId,
      amount: "1500000", // 1.5 tUSDC
      msg: seedMsg,
    })
  );
  const seedOut = run(
    `near contract call-function as-transaction ${tokenId} ft_transfer_call file-args "${seedFile}" prepaid-gas "100.0 Tgas" attached-deposit "1 yoctoNEAR" sign-as ${subscriberId} network-config testnet sign-with-legacy-keychain send`
  );
  receipts.opsSeedTx = extractTxId(seedOut);
  console.log("★ REAL OPS BUDGET SEED TX:", receipts.opsSeedTx);
  console.log(`  Explorer Link: https://explorer.testnet.near.org/transactions/${receipts.opsSeedTx}`);

  // ---------------------------------------------------------------------------
  // STEP 7: Verify Budget State on Budget Contract (Product #2)
  // ---------------------------------------------------------------------------
  console.log("\n---------------------------------------------------------------------------");
  console.log(`STEP 7: Checking Protocol Budget State on Budget Contract (Product #${productId})...`);
  console.log("---------------------------------------------------------------------------");
  const budgetProdFile = path.join(tmpDir, "prod.json");
  fs.writeFileSync(budgetProdFile, JSON.stringify({ product_id: productId }));
  const budgetBeforeOut = run(
    `near contract call-function as-read-only ${budgetId} get_budget file-args "${budgetProdFile}" network-config testnet now`
  );
  console.log("Budget State before agent draw:\n", budgetBeforeOut.trim());

  // ---------------------------------------------------------------------------
  // STEP 8: Agent Draws Real Inference Funds from Ops Budget
  // ---------------------------------------------------------------------------
  console.log("\n---------------------------------------------------------------------------");
  console.log("STEP 8: Agent draws real AI inference payment from Ops Budget Contract...");
  console.log("---------------------------------------------------------------------------");
  const drawFile = path.join(tmpDir, "draw.json");
  fs.writeFileSync(
    drawFile,
    JSON.stringify({
      product_id: productId,
      amount: "500000", // 0.5 tUSDC
      recipient: agentId,
    })
  );
  const drawOut = run(
    `near contract call-function as-transaction ${budgetId} draw_ops_funds file-args "${drawFile}" prepaid-gas "100.0 Tgas" attached-deposit "0 NEAR" sign-as ${agentId} network-config testnet sign-with-keychain send`
  );
  receipts.agentDrawTx = extractTxId(drawOut);
  console.log("★ REAL AGENT INFERENCE DRAW TX:", receipts.agentDrawTx);
  console.log(`  Explorer Link: https://explorer.testnet.near.org/transactions/${receipts.agentDrawTx}`);

  // ---------------------------------------------------------------------------
  // STEP 9: Steward Declares Abandonment (Killswitch Triggered)
  // ---------------------------------------------------------------------------
  console.log("\n---------------------------------------------------------------------------");
  console.log(`STEP 9: Steward declares ${productName} abandoned (Killswitch Triggered)...`);
  console.log("---------------------------------------------------------------------------");
  const abandonFile = path.join(tmpDir, "abandon.json");
  fs.writeFileSync(
    abandonFile,
    JSON.stringify({
      product_id: productId,
      reason: `Pandem D4 Demo Killswitch: Steward maintenance & privacy SLA test for ${productName}`,
    })
  );
  const abandonOut = run(
    `near contract call-function as-transaction ${escrowId} declare_abandoned file-args "${abandonFile}" prepaid-gas "50.0 Tgas" attached-deposit "0 NEAR" sign-as ${stewardId} network-config testnet sign-with-keychain send`
  );
  receipts.abandonTx = extractTxId(abandonOut);
  console.log("★ REAL STEWARD KILLSWITCH TX:", receipts.abandonTx);
  console.log(`  Explorer Link: https://explorer.testnet.near.org/transactions/${receipts.abandonTx}`);

  // ---------------------------------------------------------------------------
  // STEP 10: Subscriber Claims 1-Click Refund from Escrow
  // ---------------------------------------------------------------------------
  console.log("\n---------------------------------------------------------------------------");
  console.log(`STEP 10: Subscriber claims 1-click refund for Agreement #${agreementId}...`);
  console.log("---------------------------------------------------------------------------");
  const refundFile = path.join(tmpDir, "refund.json");
  fs.writeFileSync(refundFile, JSON.stringify({ agreement_id: agreementId }));
  const refundOut = run(
    `near contract call-function as-transaction ${escrowId} claim_refund file-args "${refundFile}" prepaid-gas "100.0 Tgas" attached-deposit "0 NEAR" sign-as ${subscriberId} network-config testnet sign-with-legacy-keychain send`
  );
  receipts.refundTx = extractTxId(refundOut);
  console.log("★ REAL SUBSCRIBER REFUND TX:", receipts.refundTx);
  console.log(`  Explorer Link: https://explorer.testnet.near.org/transactions/${receipts.refundTx}`);

  // Final balance check
  const balFile = path.join(tmpDir, "bal.json");
  fs.writeFileSync(balFile, JSON.stringify({ account_id: subscriberId }));
  const balFinalOut = run(`near contract call-function as-read-only ${tokenId} ft_balance_of file-args "${balFile}" network-config testnet now`);
  console.log("Subscriber tUSDC balance after refund:", balFinalOut.trim());
  receipts.finalBalance = balFinalOut.trim();

  // ---------------------------------------------------------------------------
  // FINAL RECEIPTS SUMMARY
  // ---------------------------------------------------------------------------
  console.log("\n================================================================================");
  console.log("=== PANDEM D4 TESTNET DEMO COMPLETED SUCCESSFULLY ===");
  console.log("================================================================================");
  console.log("1. Subscriber Account: ", subscriberId);
  console.log("2. Product Tested:     ", `#${productId} (${productName})`);
  console.log("3. Storage Deposit Tx: ", `https://explorer.testnet.near.org/transactions/${receipts.storageTx}`);
  console.log("4. Faucet Claim Tx:    ", `https://explorer.testnet.near.org/transactions/${receipts.faucetTx}`);
  console.log("5. Ops Budget Seed Tx: ", `https://explorer.testnet.near.org/transactions/${receipts.opsSeedTx}`);
  console.log("6. Yearly Subscribe Tx:", `https://explorer.testnet.near.org/transactions/${receipts.subscribeTx}`);
  console.log("7. Enclave Access Link:", receipts.accessUrl);
  console.log("8. Email (Off-Chain):  ", receipts.subscriberEmail);
  console.log("9. Agreement ID:       ", `#${receipts.agreementId}`);
  console.log("10. Agent Inference Tx:", `https://explorer.testnet.near.org/transactions/${receipts.agentDrawTx}`);
  console.log("11. Steward Killswitch:", `https://explorer.testnet.near.org/transactions/${receipts.abandonTx}`);
  console.log("12. Escrow Refund Tx:  ", `https://explorer.testnet.near.org/transactions/${receipts.refundTx}`);
  console.log("13. Final Balance:     ", receipts.finalBalance);
  console.log("================================================================================");

  // Write receipts to reports/d4-demo-receipts.json
  fs.writeFileSync("reports/d4-demo-receipts.json", JSON.stringify(receipts, null, 2));
  console.log("Receipts saved to reports/d4-demo-receipts.json");
} catch (err) {
  console.error("D4 Run Error:", err.message);
  if (err.stdout) console.log("Stdout:", err.stdout);
  if (err.stderr) console.log("Stderr:", err.stderr);
  process.exit(1);
}
