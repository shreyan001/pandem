// contracts/scripts/deploy_d6_escrow.mjs
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

console.log("=== Pandem D6.2 Deployment: Fresh Escrow-D6 on Testnet ===");

const deployed = JSON.parse(fs.readFileSync("contracts/scripts/deployed.json", "utf8"));
const parentAcc = "test-pandem-alice-1.testnet";
const randomHex = Math.random().toString(16).substring(2, 6);
const escrowAcc = `escrow-d6-${randomHex}.${parentAcc}`;
const tokenId = deployed.token_id || "pandem-tusdc-46cee5ca.testnet";
const budgetAcc = deployed.budget_id || "pandem-budget-d1-8f199e48.testnet";
const registryId = deployed.registry_id || "pandem-registry-v2-46cee5ca.testnet";
const stewardAcc = deployed.steward_id || "pandem-steward-46cee5ca.testnet";
const treasuryAcc = deployed.treasury_id || "pandem-treasury-46cee5ca.testnet";
const agentAcc = deployed.agent_id || "pandem-agent-46cee5ca.testnet";

console.log("Configuration:");
console.log("  New Escrow Account: ", escrowAcc);
console.log("  Parent Account:     ", parentAcc);
console.log("  Token (tUSDC):      ", tokenId);
console.log("  Steward Account:    ", stewardAcc);
console.log("  Agent Account:      ", agentAcc);

const tmpDir = path.join(os.tmpdir(), `pandem-d62-${randomHex}`);
fs.mkdirSync(tmpDir, { recursive: true });

function run(cmd) {
  console.log(`\n> ${cmd}`);
  const out = execSync(cmd, { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] });
  console.log(out.trim());
  return out;
}

// 1. Create subaccount via fund-myself (bypasses helper faucet rate limits)
console.log("\n--- 1. Creating Subaccount with 3.5 NEAR ---");
run(
  `near account create-account fund-myself ${escrowAcc} "3.5 NEAR" autogenerate-new-keypair save-to-keychain sign-as ${parentAcc} network-config testnet sign-with-keychain send`
);

// 2. Deploy compiled wasm
console.log("\n--- 2. Deploying Escrow-D6 WASM ---");
const wasmPath = "contracts/target/near/pandem_escrow/pandem_escrow.wasm";
run(
  `near contract deploy ${escrowAcc} use-file ${wasmPath} without-init-call network-config testnet sign-with-keychain send`
);

// 3. Initialize Escrow contract
console.log("\n--- 3. Initializing Escrow-D6 Contract ---");
const initFile = path.join(tmpDir, "init.json");
fs.writeFileSync(
  initFile,
  JSON.stringify({
    owner: escrowAcc,
    token_id: tokenId,
    treasury: treasuryAcc,
  })
);
run(
  `near contract call-function as-transaction ${escrowAcc} new file-args ${initFile} prepaid-gas "30.0 Tgas" attached-deposit "0 NEAR" sign-as ${escrowAcc} network-config testnet sign-with-keychain send`
);

// 4. Storage Deposit on tUSDC
console.log("\n--- 4. Registering Storage on tUSDC ---");
const storageFile = path.join(tmpDir, "storage.json");
fs.writeFileSync(storageFile, JSON.stringify({ account_id: escrowAcc, registration_only: true }));
run(
  `near contract call-function as-transaction ${tokenId} storage_deposit file-args ${storageFile} prepaid-gas "30.0 Tgas" attached-deposit "0.0125 NEAR" sign-as ${parentAcc} network-config testnet sign-with-keychain send`
);

// 5. Register and approve all 12 products
console.log("\n--- 5. Registering and Approving 12 Listings ---");
const catalogRaw = JSON.parse(fs.readFileSync("shared/catalog.json", "utf8"));
const catalog = catalogRaw.slice(0, 12);

for (const item of catalog) {
  const pid = item.product_id;
  const regFile = path.join(tmpDir, `reg_${pid}.json`);
  const price = item.tiers?.[0]?.price_monthly || "5000000"; // 5 tUSDC default
  fs.writeFileSync(
    regFile,
    JSON.stringify({
      steward: stewardAcc,
      heartbeat_signer: agentAcc,
      price_per_period: price,
      period_ns: 2592000000000000, // 30 days
      grace_ns: 604800000000000,    // 7 days
      passport_root: `QmPandemEnclavePassportRoot_${item.slug}`,
    })
  );

  console.log(`Registering #${pid}: ${item.name} (${item.slug}) Pro=${price}...`);
  run(
    `near contract call-function as-transaction ${escrowAcc} register_product file-args ${regFile} prepaid-gas "30.0 Tgas" attached-deposit "0 NEAR" sign-as ${escrowAcc} network-config testnet sign-with-keychain send`
  );

  const approveFile = path.join(tmpDir, `approve_${pid}.json`);
  fs.writeFileSync(approveFile, JSON.stringify({ id: pid }));
  run(
    `near contract call-function as-transaction ${escrowAcc} approve_product file-args ${approveFile} prepaid-gas "30.0 Tgas" attached-deposit "0 NEAR" sign-as ${stewardAcc} network-config testnet sign-with-keychain send`
  );
}

// 6. Update deployed.json
console.log("\n--- 6. Updating deployed.json ---");
const updated = {
  ...deployed,
  escrow_id: escrowAcc,
  deployed_at: new Date().toISOString(),
};
fs.writeFileSync("contracts/scripts/deployed.json", JSON.stringify(updated, null, 2));

console.log("\n=======================================================");
console.log("★ ESCROW-D6 DEPLOYED & CONFIGURED SUCCESSFULLY:");
console.log("★ Escrow Account: ", escrowAcc);
console.log("★ Token:          ", tokenId);
console.log("=======================================================\n");
