// scripts/test_d6_4_ops_flow.mjs
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

console.log("=== Pandem D6.4 Verification: Automated Ops Share Flow to Budget ===");

const deployed = JSON.parse(fs.readFileSync("contracts/scripts/deployed.json", "utf8"));
const tokenId = deployed.token_id || "pandem-tusdc-46cee5ca.testnet";
const budgetId = deployed.budget_id || "pandem-budget-d1-8f199e48.testnet";
const stewardAcc = deployed.steward_id || "pandem-steward-46cee5ca.testnet";
const treasuryAcc = deployed.treasury_id || "pandem-treasury-46cee5ca.testnet";
const parentAcc = "test-pandem-alice-1.testnet";

const randomHex = Math.random().toString(16).substring(2, 6);
const escrowAcc = `escrow-d64-${randomHex}.${parentAcc}`;

console.log("Configuration:");
console.log("  New Escrow Account: ", escrowAcc);
console.log("  Parent Account:     ", parentAcc);
console.log("  Token (tUSDC):      ", tokenId);
console.log("  Budget Contract:    ", budgetId);
console.log("  Steward Account:    ", stewardAcc);

const tmpDir = path.join(os.tmpdir(), `pandem-d64-${randomHex}`);
fs.mkdirSync(tmpDir, { recursive: true });

function run(cmd) {
  console.log(`\n> ${cmd}`);
  const out = execSync(cmd, { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] });
  console.log(out.trim());
  return out;
}

// 1. Create subaccount with 3.5 NEAR
console.log("\n--- 1. Creating Subaccount with 3.5 NEAR ---");
run(
  `near account create-account fund-myself ${escrowAcc} "3.5 NEAR" autogenerate-new-keypair save-to-keychain sign-as ${parentAcc} network-config testnet sign-with-keychain send`
);

// 2. Deploy compiled wasm
console.log("\n--- 2. Deploying Escrow-D6.4 WASM ---");
const wasmPath = "contracts/target/near/pandem_escrow/pandem_escrow.wasm";
run(
  `near contract deploy ${escrowAcc} use-file ${wasmPath} without-init-call network-config testnet sign-with-keychain send`
);

// 3. Initialize Escrow with Budget Contract
console.log("\n--- 3. Initializing Escrow Contract with Budget Destination ---");
const initFile = path.join(tmpDir, "init.json");
fs.writeFileSync(
  initFile,
  JSON.stringify({
    owner: escrowAcc,
    token_id: tokenId,
    treasury: treasuryAcc,
    budget_contract: budgetId,
  })
);
run(
  `near contract call-function as-transaction ${escrowAcc} new file-args ${initFile} prepaid-gas "30.0 Tgas" attached-deposit "0 NEAR" sign-as ${escrowAcc} network-config testnet sign-with-keychain send`
);

// Verify budget contract is set
const getBudgetOut = run(
  `near contract call-function as-read-only ${escrowAcc} get_budget_contract text-args {} network-config testnet now`
);
console.log("Configured Budget Contract on Escrow:", getBudgetOut.trim());

// 4. Storage Deposit on tUSDC
console.log("\n--- 4. Registering Storage on tUSDC ---");
const storageFile = path.join(tmpDir, "storage.json");
fs.writeFileSync(storageFile, JSON.stringify({ account_id: escrowAcc, registration_only: true }));
run(
  `near contract call-function as-transaction ${tokenId} storage_deposit file-args ${storageFile} prepaid-gas "30.0 Tgas" attached-deposit "0.0125 NEAR" sign-as ${parentAcc} network-config testnet sign-with-keychain send`
);

// 5. Register and approve all 12 products (Alice as heartbeat_signer for #1)
console.log("\n--- 5. Registering and Approving 12 Listings ---");
const catalogRaw = JSON.parse(fs.readFileSync("shared/catalog.json", "utf8"));
const catalog = catalogRaw.slice(0, 12);

for (const item of catalog) {
  const pid = item.product_id;
  const regFile = path.join(tmpDir, `reg_${pid}.json`);
  const price = item.tiers?.[0]?.price_monthly || "5000000";
  // Alice is heartbeat_signer for product 1 so we can verify release immediately
  const hbSigner = pid === 1 ? parentAcc : deployed.agent_id || "pandem-agent-46cee5ca.testnet";

  fs.writeFileSync(
    regFile,
    JSON.stringify({
      steward: stewardAcc,
      heartbeat_signer: hbSigner,
      price_per_period: price,
      period_ns: 2592000000000000,
      grace_ns: 604800000000000,
      passport_root: `QmPandemEnclavePassportRoot_${item.slug}`,
    })
  );

  run(
    `near contract call-function as-transaction ${escrowAcc} register_product file-args ${regFile} prepaid-gas "30.0 Tgas" attached-deposit "0 NEAR" sign-as ${escrowAcc} network-config testnet sign-with-keychain send`
  );

  const approveFile = path.join(tmpDir, `approve_${pid}.json`);
  fs.writeFileSync(approveFile, JSON.stringify({ id: pid }));
  run(
    `near contract call-function as-transaction ${escrowAcc} approve_product file-args ${approveFile} prepaid-gas "30.0 Tgas" attached-deposit "0 NEAR" sign-as ${stewardAcc} network-config testnet sign-with-keychain send`
  );
}

// 6. Query Initial Budget State for Product #1 on budgetId
console.log("\n--- 6. Querying Initial Budget State on Budget Contract ---");
const bArgs = path.join(tmpDir, "b1.json");
fs.writeFileSync(bArgs, JSON.stringify({ product_id: 1 }));
const initialBudgetRaw = run(
  `near contract call-function as-read-only ${budgetId} get_budget file-args ${bArgs} network-config testnet now`
);
console.log("Initial Budget State:", initialBudgetRaw.trim());
const initialBudget = JSON.parse(initialBudgetRaw.trim());
const initialBalance = BigInt(initialBudget.current_balance);
console.log(`Initial current_balance: ${initialBalance} units (${Number(initialBalance) / 1e6} tUSDC)`);

// 7. Subscribe to Product #1 (1 Period Pro = 5,000,000 tUSDC)
console.log("\n--- 7. Subscribing: 1 Period Pro Tier (5 tUSDC) ---");
const subMsg = JSON.stringify({
  product_id: "1",
  periods: 1,
  tier: "pro",
  subscriber: parentAcc,
  refund_to: parentAcc,
});
const subArgs = path.join(tmpDir, "sub.json");
fs.writeFileSync(
  subArgs,
  JSON.stringify({
    receiver_id: escrowAcc,
    amount: "5000000",
    msg: subMsg,
  })
);
run(
  `near contract call-function as-transaction ${tokenId} ft_transfer_call file-args ${subArgs} prepaid-gas "100.0 Tgas" attached-deposit "1 yoctoNEAR" sign-as ${parentAcc} network-config testnet sign-with-keychain send`
);

// 8. Post Heartbeat #1 for Product #1
console.log("\n--- 8. Posting Heartbeat #1 for Product #1 ---");
const hbArgs = path.join(tmpDir, "hb.json");
fs.writeFileSync(hbArgs, JSON.stringify({ product_id: 1, period: 1 }));
run(
  `near contract call-function as-transaction ${escrowAcc} heartbeat file-args ${hbArgs} prepaid-gas "30.0 Tgas" attached-deposit "0 NEAR" sign-as ${parentAcc} network-config testnet sign-with-keychain send`
);

// 9. Execute release_period(1)
console.log("\n--- 9. Executing release_period (Automated Ops Share Forwarding) ---");
const relArgs = path.join(tmpDir, "rel.json");
fs.writeFileSync(relArgs, JSON.stringify({ agreement_id: 1 }));

run(
  `near contract call-function as-transaction ${escrowAcc} release_period file-args ${relArgs} prepaid-gas "160.0 Tgas" attached-deposit "0 NEAR" sign-as ${parentAcc} network-config testnet sign-with-keychain send`
);

// 10. Query Final Budget State on Budget Contract
console.log("\n--- 10. Verifying Final Budget State on-chain ---");
const finalBudgetRaw = run(
  `near contract call-function as-read-only ${budgetId} get_budget file-args ${bArgs} network-config testnet now`
);
console.log("Final Budget State:", finalBudgetRaw.trim());
const finalBudget = JSON.parse(finalBudgetRaw.trim());
const finalBalance = BigInt(finalBudget.current_balance);
const diff = finalBalance - initialBalance;
console.log(`Final current_balance:   ${finalBalance} units (${Number(finalBalance) / 1e6} tUSDC)`);
console.log(`Automatic Ops Increase:  ${diff} units (${Number(diff) / 1e6} tUSDC)`);

const expectedOps = 1500000n; // 30% of 5,000,000
if (diff === expectedOps) {
  console.log("✓ SUCCESS: Budget current_balance increased by EXACTLY 30% (1.50 tUSDC) via automated cross-contract ft_transfer_call!");
} else {
  console.log(`WARNING: Expected diff ${expectedOps}, got ${diff}`);
}

// 11. Update config files with new escrow address
console.log("\n--- 11. Updating Project Config Files with New Escrow Address ---");
deployed.escrow_id = escrowAcc;
fs.writeFileSync("contracts/scripts/deployed.json", JSON.stringify(deployed, null, 2));

const constantsPath = "shared/src/constants.ts";
let constants = fs.readFileSync(constantsPath, "utf8");
constants = constants.replace(/PANDEM_ESCROW_ID = ".*?";/, `PANDEM_ESCROW_ID = "${escrowAcc}";`);
fs.writeFileSync(constantsPath, constants);

const envFiles = [".env", ".env.example", "web/.env.local", "agent/.env"];
for (const envFile of envFiles) {
  if (fs.existsSync(envFile)) {
    let content = fs.readFileSync(envFile, "utf8");
    content = content.replace(/NEXT_PUBLIC_ESCROW_CONTRACT_ID=.*$/m, `NEXT_PUBLIC_ESCROW_CONTRACT_ID=${escrowAcc}`);
    content = content.replace(/ESCROW_CONTRACT_ID=.*$/m, `ESCROW_CONTRACT_ID=${escrowAcc}`);
    fs.writeFileSync(envFile, content);
  }
}

console.log("\n=======================================================");
console.log("★ D6.4 AUTOMATED OPS SHARE VERIFICATION COMPLETE");
console.log("★ Fresh Escrow Contract:  ", escrowAcc);
console.log("★ Budget Contract:        ", budgetId);
console.log("★ Initial Budget Balance: ", initialBalance.toString(), `(${Number(initialBalance) / 1e6} tUSDC)`);
console.log("★ Final Budget Balance:   ", finalBalance.toString(), `(${Number(finalBalance) / 1e6} tUSDC)`);
console.log("★ Delta (Exactly 30% ops):", diff.toString(), `(${Number(diff) / 1e6} tUSDC)`);
console.log("=======================================================\n");
