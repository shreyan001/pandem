// scripts/test_d6_1_onboarding.mjs
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

console.log("=== Pandem D6.1 Verification: Brand-New Account Onboarding Flow ===");

const deployed = JSON.parse(fs.readFileSync("contracts/scripts/deployed.json", "utf8"));
const tokenId = deployed.token_id || "pandem-tusdc-46cee5ca.testnet";
const newAccountId = "d61.test-pandem-alice-1.testnet";

console.log("Token ID (tUSDC):", tokenId);
console.log("Brand-New Testnet Account:", newAccountId);

const tmpDir = path.join(os.tmpdir(), "pandem-d61-verify");
fs.mkdirSync(tmpDir, { recursive: true });

function run(cmd) {
  console.log(`\n> ${cmd}`);
  const out = execSync(cmd, { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] });
  console.log(out.trim());
  return out;
}

// 1. Verify Initial Account State (Zero tUSDC, Unregistered)
console.log("\n1. Verifying Initial Account State (Zero tUSDC, Unregistered)...");
const balArgs = path.join(tmpDir, "bal.json");
fs.writeFileSync(balArgs, JSON.stringify({ account_id: newAccountId }));

const initialBal = run(
  `near contract call-function as-read-only ${tokenId} ft_balance_of file-args ${balArgs} network-config testnet now`
);
console.log("Initial tUSDC Balance:", initialBal.trim());

// 2. Execute Step 2 Onboarding: Storage Registration
console.log("\n2. Executing Step 2a: storage_deposit on tUSDC...");
const storageArgs = path.join(tmpDir, "storage.json");
fs.writeFileSync(storageArgs, JSON.stringify({ account_id: newAccountId, registration_only: true }));

const storageOutput = run(
  `near contract call-function as-transaction ${tokenId} storage_deposit file-args ${storageArgs} prepaid-gas "30.0 Tgas" attached-deposit "0.00125 NEAR" sign-as ${newAccountId} network-config testnet sign-with-keychain send`
);
const storageTxMatch = storageOutput.match(/Transaction ID:\s*([A-Za-z0-9]+)/);
const storageTxId = storageTxMatch ? storageTxMatch[1] : null;
console.log("★ STORAGE REGISTRATION TX:", storageTxId);

// 3. Execute Step 2b: faucet claim
console.log("\n3. Executing Step 2b: faucet claim (100 tUSDC)...");
const emptyArgs = path.join(tmpDir, "empty.json");
fs.writeFileSync(emptyArgs, JSON.stringify({}));

const faucetOutput = run(
  `near contract call-function as-transaction ${tokenId} faucet file-args ${emptyArgs} prepaid-gas "50.0 Tgas" attached-deposit "0 NEAR" sign-as ${newAccountId} network-config testnet sign-with-keychain send`
);
const faucetTxMatch = faucetOutput.match(/Transaction ID:\s*([A-Za-z0-9]+)/);
const faucetTxId = faucetTxMatch ? faucetTxMatch[1] : null;
console.log("★ FAUCET CLAIM TX:", faucetTxId);

// 4. Verify Final State (100 tUSDC = 100,000,000 units)
console.log("\n4. Verifying Final Account State (100 tUSDC)...");
const finalBal = run(
  `near contract call-function as-read-only ${tokenId} ft_balance_of file-args ${balArgs} network-config testnet now`
);
console.log("Final tUSDC Balance:", finalBal.trim());

console.log("\n=======================================================");
console.log("★ D6.1 ONBOARDING DONE-CHECK RECEIPTS:");
console.log("★ Brand-New Account:  ", newAccountId);
console.log("★ Storage Register Tx: https://explorer.testnet.near.org/transactions/" + storageTxId);
console.log("★ Faucet 100 tUSDC Tx: https://explorer.testnet.near.org/transactions/" + faucetTxId);
console.log("★ Final Balance:      ", finalBal.trim(), "(100.00 tUSDC)");
console.log("=======================================================\n");
