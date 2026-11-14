// contracts/scripts/test_money_path.mjs
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

console.log("=== Pandem D1 Verification: Faucet + Subscribe on Testnet ===");

const deployed = JSON.parse(fs.readFileSync("contracts/scripts/deployed.json", "utf8"));
const tokenId = deployed.token_id;
const escrowId = deployed.escrow_id;
const stewardId = deployed.steward_id;

console.log("Using Deployed Contracts:");
console.log("  Token (tUSDC): ", tokenId);
console.log("  Escrow:        ", escrowId);
console.log("  Steward:       ", stewardId);

const randomHex = Math.random().toString(16).substring(2, 8);
const aliceId = `pandem-alice-d1-${randomHex}.testnet`;
console.log("\nFresh Subscriber Wallet:", aliceId);

const tmpDir = path.join(os.tmpdir(), `pandem-test-${randomHex}`);
fs.mkdirSync(tmpDir, { recursive: true });

function run(cmd) {
  console.log(`\n> ${cmd}`);
  const out = execSync(cmd, { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] });
  console.log(out.trim());
  return out;
}

// 1. Create Alice's testnet wallet via faucet
console.log("\n--- 1. Creating Alice's Fresh Account ---");
run(`near account create-account sponsor-by-faucet-service ${aliceId} autogenerate-new-keypair save-to-keychain network-config testnet create`);

// 2. Call Faucet on tUSDC
console.log("\n--- 2. Calling Faucet on tUSDC (Real Faucet Transaction) ---");
const emptyArgsFile = path.join(tmpDir, "empty.json");
fs.writeFileSync(emptyArgsFile, JSON.stringify({}));

const faucetOutput = run(
  `near contract call-function as-transaction ${tokenId} faucet file-args ${emptyArgsFile} prepaid-gas "50.0 Tgas" attached-deposit "0 NEAR" sign-as ${aliceId} network-config testnet sign-with-keychain send`
);

const faucetTxMatch = faucetOutput.match(/Transaction ID:\s*([A-Za-z0-9]+)/);
const faucetTxId = faucetTxMatch ? faucetTxMatch[1] : null;
console.log("\n★ REAL FAUCET TX ID:", faucetTxId);
console.log(`★ EXPLORER LINK: https://explorer.testnet.near.org/transactions/${faucetTxId}`);

// 3. Verify Alice's tUSDC balance
console.log("\n--- 3. Checking Alice's tUSDC Balance ---");
const balFile = path.join(tmpDir, "bal.json");
fs.writeFileSync(balFile, JSON.stringify({ account_id: aliceId }));
const balOutput = run(
  `near contract call-function as-read-only ${tokenId} ft_balance_of file-args ${balFile} network-config testnet now`
);
console.log("Alice tUSDC balance:", balOutput);

// 4. Subscribe to Product #1 (Open-WebUI, 1 period = 5,000,000 tUSDC)
console.log("\n--- 4. Executing ft_transfer_call Subscription (Real Subscribe Transaction) ---");
const subMsg = JSON.stringify({
  product_id: "1",
  periods: 1,
  tier_id: "pro",
  subscriber: aliceId,
  refund_to: aliceId,
});
const subArgsFile = path.join(tmpDir, "sub.json");
fs.writeFileSync(
  subArgsFile,
  JSON.stringify({
    receiver_id: escrowId,
    amount: "5000000", // 5 tUSDC (6 decimals)
    msg: subMsg,
  })
);

const subOutput = run(
  `near contract call-function as-transaction ${tokenId} ft_transfer_call file-args ${subArgsFile} prepaid-gas "100.0 Tgas" attached-deposit "1 yoctoNEAR" sign-as ${aliceId} network-config testnet sign-with-keychain send`
);

const subTxMatch = subOutput.match(/Transaction ID:\s*([A-Za-z0-9]+)/);
const subTxId = subTxMatch ? subTxMatch[1] : null;
console.log("\n★ REAL SUBSCRIBE TX ID:", subTxId);
console.log(`★ EXPLORER LINK: https://explorer.testnet.near.org/transactions/${subTxId}`);

// 5. Query Escrow to verify Agreement #1 was created
console.log("\n--- 5. Verifying Agreement on Escrow Contract ---");
const agrFile = path.join(tmpDir, "agr.json");
fs.writeFileSync(agrFile, JSON.stringify({ id: 1 }));
const agrOutput = run(
  `near contract call-function as-read-only ${escrowId} get_agreement file-args ${agrFile} network-config testnet now`
);
console.log("Agreement #1:", agrOutput);

// 6. Query Escrow State
const escOutput = run(
  `near contract call-function as-read-only ${escrowId} get_escrow file-args ${agrFile} network-config testnet now`
);
console.log("Escrow State #1:", escOutput);

console.log("\n========================================================");
console.log("DONE-CHECK RECEIPTS:");
console.log("(a) Escrow Config:", escrowId, "uses token", tokenId);
console.log("(b) Faucet Tx:", `https://explorer.testnet.near.org/transactions/${faucetTxId}`);
console.log("(c) Subscribe Tx:", `https://explorer.testnet.near.org/transactions/${subTxId}`);
console.log("========================================================");
