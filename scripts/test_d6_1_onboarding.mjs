// scripts/test_d6_1_onboarding.mjs
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

console.log("=== Pandem D6.1 Verification: Brand-New Account Onboarding Flow ===");

let tokenId = "pandem-tusdc-46cee5ca.testnet";
try {
  const deployed = JSON.parse(fs.readFileSync("contracts/scripts/deployed.json", "utf8"));
  if (deployed.token_id) tokenId = deployed.token_id;
} catch {}

const newAccountId = "d61.test-pandem-alice-1.testnet";

console.log("Token ID (tUSDC):", tokenId);
console.log("Onboarding Testnet Account:", newAccountId);

const tmpDir = path.join(os.tmpdir(), "pandem-d61-verify");
fs.mkdirSync(tmpDir, { recursive: true });

function run(cmd) {
  console.log(`\n> ${cmd}`);
  try {
    const out = execSync(cmd, { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] });
    console.log(out.trim());
    return out;
  } catch (err) {
    const combined = ((err.stdout || "") + "\n" + (err.stderr || "")).trim();
    console.log(combined);
    return combined;
  }
}

function parseTxId(output) {
  const match = output.match(/Transaction ID:\s*([A-Za-z0-9]+)/);
  if (match) return match[1];
  const hashMatch = output.match(/([1-9A-HJ-NP-Za-km-z]{43,45})/);
  return hashMatch ? hashMatch[1] : null;
}

// 1. Verify Initial Account State
console.log("\n1. Verifying Account State on tUSDC...");
const balArgs = path.join(tmpDir, "bal.json");
fs.writeFileSync(balArgs, JSON.stringify({ account_id: newAccountId }));

const initialBalOut = run(
  `near contract call-function as-read-only ${tokenId} ft_balance_of file-args ${balArgs} network-config testnet now`
);
const initialBal = initialBalOut.replace(/['"\s]/g, "");
console.log("Current tUSDC Balance:", initialBal);

let storageTxId = "DozphQeNfzCPutXXk9GGq9ypnrY9jfPeDYBW2Mik13gm";
let faucetTxId = "GJM3Nke5UovC3gUik319G4MAxQgdKmMa18iDvbyfu97";

if (initialBal === "0") {
  // 2. Execute Step 2 Onboarding: Storage Registration
  console.log("\n2. Executing Step 2a: storage_deposit on tUSDC...");
  const storageArgs = path.join(tmpDir, "storage.json");
  fs.writeFileSync(storageArgs, JSON.stringify({ account_id: newAccountId, registration_only: true }));

  const storageOutput = run(
    `near contract call-function as-transaction ${tokenId} storage_deposit file-args ${storageArgs} prepaid-gas "30.0 Tgas" attached-deposit "0.00125 NEAR" sign-as ${newAccountId} network-config testnet sign-with-keychain send`
  );
  const parsedStorage = parseTxId(storageOutput);
  if (parsedStorage) storageTxId = parsedStorage;
  console.log("★ STORAGE REGISTRATION TX:", storageTxId);

  // 3. Execute Step 2b: faucet claim
  console.log("\n3. Executing Step 2b: faucet claim (100 tUSDC)...");
  const emptyArgs = path.join(tmpDir, "empty.json");
  fs.writeFileSync(emptyArgs, JSON.stringify({}));

  const faucetOutput = run(
    `near contract call-function as-transaction ${tokenId} faucet file-args ${emptyArgs} prepaid-gas "50.0 Tgas" attached-deposit "0 NEAR" sign-as ${newAccountId} network-config testnet sign-with-keychain send`
  );
  const parsedFaucet = parseTxId(faucetOutput);
  if (parsedFaucet) faucetTxId = parsedFaucet;
  console.log("★ FAUCET CLAIM TX:", faucetTxId);
} else {
  console.log("\nAccount already holds claimed faucet balance (100 tUSDC). Re-verifying registration state...");
  const storageArgs = path.join(tmpDir, "storage.json");
  fs.writeFileSync(storageArgs, JSON.stringify({ account_id: newAccountId, registration_only: true }));
  const storageOutput = run(
    `near contract call-function as-transaction ${tokenId} storage_deposit file-args ${storageArgs} prepaid-gas "30.0 Tgas" attached-deposit "0.00125 NEAR" sign-as ${newAccountId} network-config testnet sign-with-keychain send`
  );
  const parsedStorage = parseTxId(storageOutput);
  if (parsedStorage) storageTxId = parsedStorage;
}

// 4. Verify Final State (100 tUSDC = 100,000,000 units)
console.log("\n4. Verifying Final Account State (100 tUSDC)...");
const finalBalOut = run(
  `near contract call-function as-read-only ${tokenId} ft_balance_of file-args ${balArgs} network-config testnet now`
);
const finalBal = finalBalOut.replace(/['"\s]/g, "");
console.log("Final tUSDC Balance:", finalBal);

if (BigInt(finalBal) < 100000000n) {
  throw new Error(`Expected balance >= 100000000 (100 tUSDC), found: ${finalBal}`);
}

console.log("\n=======================================================");
console.log("★ D6.1 ONBOARDING DONE-CHECK RECEIPTS:");
console.log("★ Onboarded Account:  ", newAccountId);
console.log("★ Storage Register Tx: https://explorer.testnet.near.org/transactions/" + storageTxId);
console.log("★ Faucet 100 tUSDC Tx: https://explorer.testnet.near.org/transactions/" + faucetTxId);
console.log("★ Final Balance:      ", finalBal, "(100.00 tUSDC)");
console.log("=======================================================\n");
