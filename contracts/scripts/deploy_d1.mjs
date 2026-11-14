// contracts/scripts/deploy_d1.mjs
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

console.log("=== Pandem D1 Deployment: Fresh Escrow + Budget on tUSDC ===");

const randomHex = Math.random().toString(16).substring(2, 10);
const escrowAcc = `pandem-escrow-d1-${randomHex}.testnet`;
const budgetAcc = `pandem-budget-d1-${randomHex}.testnet`;
const tokenId = "pandem-tusdc-46cee5ca.testnet";
const registryId = "pandem-registry-v2-46cee5ca.testnet";
const stewardAcc = "pandem-steward-46cee5ca.testnet";
const treasuryAcc = "pandem-treasury-46cee5ca.testnet";
const agentAcc = "pandem-agent-46cee5ca.testnet";

console.log("Accounts:");
console.log("  Escrow:   ", escrowAcc);
console.log("  Budget:   ", budgetAcc);
console.log("  Token:    ", tokenId);
console.log("  Registry: ", registryId);
console.log("  Steward:  ", stewardAcc);
console.log("  Treasury: ", treasuryAcc);
console.log("  Agent:    ", agentAcc);

const tmpDir = path.join(os.tmpdir(), `pandem-d1-${randomHex}`);
fs.mkdirSync(tmpDir, { recursive: true });

function run(cmd) {
  console.log(`\n> ${cmd}`);
  const out = execSync(cmd, { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] });
  console.log(out.trim());
  return out;
}

// 1. Create accounts via faucet
console.log("\n--- Creating Faucet Accounts ---");
run(`near account create-account sponsor-by-faucet-service ${escrowAcc} autogenerate-new-keypair save-to-keychain network-config testnet create`);
run(`near account create-account sponsor-by-faucet-service ${budgetAcc} autogenerate-new-keypair save-to-keychain network-config testnet create`);

// 2. Deploy Contracts
console.log("\n--- Deploying Wasms ---");
const escrowWasm = "contracts/target/wasm32-unknown-unknown/release/pandem_escrow.wasm";
const budgetWasm = "contracts/target/wasm32-unknown-unknown/release/pandem_budget.wasm";

run(`near contract deploy ${escrowAcc} use-file ${escrowWasm} without-init-call network-config testnet sign-with-keychain send`);
run(`near contract deploy ${budgetAcc} use-file ${budgetWasm} without-init-call network-config testnet sign-with-keychain send`);

// 3. Initialize Escrow
console.log("\n--- Initializing Escrow ---");
const escrowArgsFile = path.join(tmpDir, "escrow_init.json");
fs.writeFileSync(
  escrowArgsFile,
  JSON.stringify({
    owner: escrowAcc,
    token_id: tokenId,
    treasury: treasuryAcc,
  })
);
run(
  `near contract call-function as-transaction ${escrowAcc} new file-args ${escrowArgsFile} prepaid-gas "30.0 Tgas" attached-deposit "0 NEAR" sign-as ${escrowAcc} network-config testnet sign-with-keychain send`
);

// 4. Initialize Budget
console.log("\n--- Initializing Budget ---");
const budgetArgsFile = path.join(tmpDir, "budget_init.json");
fs.writeFileSync(
  budgetArgsFile,
  JSON.stringify({
    owner: budgetAcc,
    token_id: tokenId,
    escrow_contract: escrowAcc,
  })
);
run(
  `near contract call-function as-transaction ${budgetAcc} new file-args ${budgetArgsFile} prepaid-gas "30.0 Tgas" attached-deposit "0 NEAR" sign-as ${budgetAcc} network-config testnet sign-with-keychain send`
);

// 5. Storage Deposits on tUSDC
console.log("\n--- Registering Storage on tUSDC ---");
function registerStorage(acc, signAs) {
  const f = path.join(tmpDir, `storage_${acc}.json`);
  fs.writeFileSync(f, JSON.stringify({ account_id: acc, registration_only: true }));
  run(
    `near contract call-function as-transaction ${tokenId} storage_deposit file-args ${f} prepaid-gas "30.0 Tgas" attached-deposit "0.0125 NEAR" sign-as ${signAs} network-config testnet sign-with-keychain send`
  );
}

registerStorage(escrowAcc, escrowAcc);
registerStorage(budgetAcc, budgetAcc);
registerStorage(stewardAcc, stewardAcc);
registerStorage(treasuryAcc, stewardAcc);
registerStorage(agentAcc, stewardAcc);

// 6. Register and Approve 12 Products
console.log("\n--- Registering 12 Products in Escrow ---");
const catalogRaw = JSON.parse(fs.readFileSync("shared/catalog.json", "utf8"));
const catalog = catalogRaw.slice(0, 12);

for (const item of catalog) {
  const pid = item.product_id;
  const regFile = path.join(tmpDir, `reg_${pid}.json`);
  // 6 decimals: 5 tUSDC = "5000000"
  const price = item.tiers?.[0]?.price_monthly || "5000000";
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

  console.log(`Registering product #${pid}: ${item.name} (${item.slug}) at ${price} tUSDC...`);
  run(
    `near contract call-function as-transaction ${escrowAcc} register_product file-args ${regFile} prepaid-gas "30.0 Tgas" attached-deposit "0 NEAR" sign-as ${escrowAcc} network-config testnet sign-with-keychain send`
  );

  const approveFile = path.join(tmpDir, `approve_${pid}.json`);
  fs.writeFileSync(approveFile, JSON.stringify({ id: pid }));
  run(
    `near contract call-function as-transaction ${escrowAcc} approve_product file-args ${approveFile} prepaid-gas "30.0 Tgas" attached-deposit "0 NEAR" sign-as ${stewardAcc} network-config testnet sign-with-keychain send`
  );
}

// 7. Update deployed.json
console.log("\n--- Updating deployed.json ---");
const deployedConfig = {
  token_id: tokenId,
  escrow_id: escrowAcc,
  budget_id: budgetAcc,
  registry_id: registryId,
  steward_id: stewardAcc,
  treasury_id: treasuryAcc,
  agent_id: agentAcc,
  product_id: 1,
  price_per_period: "5000000",
  deployed_at: new Date().toISOString(),
};
fs.writeFileSync("contracts/scripts/deployed.json", JSON.stringify(deployedConfig, null, 2));

console.log("\n✓ Deployment completed successfully!");
console.log("New deployed.json:");
console.log(JSON.stringify(deployedConfig, null, 2));
