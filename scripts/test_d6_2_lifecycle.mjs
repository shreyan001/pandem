// scripts/test_d6_2_lifecycle.mjs
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

console.log("=== Pandem D6.2 Lifecycle Verification: Tiers, Upgrade, Renew, Cancel ===");

const deployed = JSON.parse(fs.readFileSync("contracts/scripts/deployed.json", "utf8"));
const tokenId = deployed.token_id || "pandem-tusdc-46cee5ca.testnet";
const escrowId = deployed.escrow_id || "escrow-d6-df23.test-pandem-alice-1.testnet";
const aliceId = "test-pandem-alice-1.testnet";

console.log("Configuration:");
console.log("  Token (tUSDC):  ", tokenId);
console.log("  Escrow Contract:", escrowId);
console.log("  Subscriber:     ", aliceId);

const tmpDir = path.join(os.tmpdir(), `pandem-d62-${Date.now()}`);
fs.mkdirSync(tmpDir, { recursive: true });

function run(cmd) {
  console.log(`\n> ${cmd}`);
  const out = execSync(cmd, { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] });
  console.log(out.trim());
  return out;
}

function parseTxId(output) {
  const match = output.match(/Transaction ID:\s*([A-Za-z0-9]+)/);
  if (match) return match[1];
  const hashMatch = output.match(/([1-9A-HJ-NP-Za-km-z]{43,45})/);
  return hashMatch ? hashMatch[1] : null;
}

// 0. Check initial tUSDC balance
console.log("\n--- 0. Checking Initial tUSDC Balance ---");
const balFile = path.join(tmpDir, "bal.json");
fs.writeFileSync(balFile, JSON.stringify({ account_id: aliceId }));
const initialBal = run(
  `near contract call-function as-read-only ${tokenId} ft_balance_of file-args ${balFile} network-config testnet now`
);
console.log("Alice Initial tUSDC:", initialBal.trim());

// 1. Subscribe to Product #1 (2 periods, Pro tier = 5 tUSDC * 2 = 10 tUSDC)
console.log("\n--- 1. Subscribing: 2 Periods Pro Tier (10 tUSDC) ---");
const subMsg = JSON.stringify({
  product_id: "1",
  periods: 2,
  tier: "pro",
  subscriber: aliceId,
  refund_to: aliceId,
});
const subArgsFile = path.join(tmpDir, "sub.json");
fs.writeFileSync(
  subArgsFile,
  JSON.stringify({
    receiver_id: escrowId,
    amount: "10000000", // 10 tUSDC (6 decimals)
    msg: subMsg,
  })
);

const subOutput = run(
  `near contract call-function as-transaction ${tokenId} ft_transfer_call file-args ${subArgsFile} prepaid-gas "100.0 Tgas" attached-deposit "1 yoctoNEAR" sign-as ${aliceId} network-config testnet sign-with-keychain send`
);
const subTxId = parseTxId(subOutput);
console.log("★ 1. SUBSCRIBE TX ID:", subTxId);
console.log(`★ Link: https://explorer.testnet.near.org/transactions/${subTxId}`);

// Verify Agreement 1 on Escrow
const agArgs = path.join(tmpDir, "ag1.json");
fs.writeFileSync(agArgs, JSON.stringify({ id: 1 }));
const agState1 = run(
  `near contract call-function as-read-only ${escrowId} get_agreement file-args ${agArgs} network-config testnet now`
);
const escState1 = run(
  `near contract call-function as-read-only ${escrowId} get_escrow file-args ${agArgs} network-config testnet now`
);
console.log("Agreement #1 after Subscribe:", agState1.trim());
console.log("Escrow #1 after Subscribe:", escState1.trim());

// 2. Upgrade to Max Tier (15 tUSDC / period; diff = 10 tUSDC * 2 periods = 20 tUSDC)
console.log("\n--- 2. Upgrading Agreement #1 to Max Tier (20 tUSDC Prorated) ---");
const upgradeMsg = JSON.stringify({
  action: "upgrade",
  agreement_id: 1,
  tier: "max",
});
const upArgsFile = path.join(tmpDir, "upgrade.json");
fs.writeFileSync(
  upArgsFile,
  JSON.stringify({
    receiver_id: escrowId,
    amount: "20000000", // 20 tUSDC
    msg: upgradeMsg,
  })
);

const upOutput = run(
  `near contract call-function as-transaction ${tokenId} ft_transfer_call file-args ${upArgsFile} prepaid-gas "100.0 Tgas" attached-deposit "1 yoctoNEAR" sign-as ${aliceId} network-config testnet sign-with-keychain send`
);
const upTxId = parseTxId(upOutput);
console.log("★ 2. UPGRADE TX ID:", upTxId);
console.log(`★ Link: https://explorer.testnet.near.org/transactions/${upTxId}`);

const agState2 = run(
  `near contract call-function as-read-only ${escrowId} get_agreement file-args ${agArgs} network-config testnet now`
);
const escState2 = run(
  `near contract call-function as-read-only ${escrowId} get_escrow file-args ${agArgs} network-config testnet now`
);
console.log("Agreement #1 after Upgrade:", agState2.trim());
console.log("Escrow #1 after Upgrade:", escState2.trim());

// 3. Renew Agreement #1 (+1 period @ Max Tier = 15 tUSDC)
console.log("\n--- 3. Renewing Agreement #1 (+1 Period Max Tier = 15 tUSDC) ---");
const renewMsg = JSON.stringify({
  action: "renew",
  agreement_id: 1,
  periods: 1,
});
const renewArgsFile = path.join(tmpDir, "renew.json");
fs.writeFileSync(
  renewArgsFile,
  JSON.stringify({
    receiver_id: escrowId,
    amount: "15000000", // 15 tUSDC
    msg: renewMsg,
  })
);

const renewOutput = run(
  `near contract call-function as-transaction ${tokenId} ft_transfer_call file-args ${renewArgsFile} prepaid-gas "100.0 Tgas" attached-deposit "1 yoctoNEAR" sign-as ${aliceId} network-config testnet sign-with-keychain send`
);
const renewTxId = parseTxId(renewOutput);
console.log("★ 3. RENEW TX ID:", renewTxId);
console.log(`★ Link: https://explorer.testnet.near.org/transactions/${renewTxId}`);

const escState3 = run(
  `near contract call-function as-read-only ${escrowId} get_escrow file-args ${agArgs} network-config testnet now`
);
console.log("Escrow #1 after Renew:", escState3.trim());

// 4. Cancel Agreement #1 (stops at current period, refunds remaining 2 periods @ 15 tUSDC = 30 tUSDC)
console.log("\n--- 4. Cancelling Agreement #1 (Immediate 30 tUSDC Refund) ---");
const cancelArgsFile = path.join(tmpDir, "cancel.json");
fs.writeFileSync(
  cancelArgsFile,
  JSON.stringify({
    agreement_id: 1,
  })
);

const cancelOutput = run(
  `near contract call-function as-transaction ${escrowId} cancel file-args ${cancelArgsFile} prepaid-gas "120.0 Tgas" attached-deposit "0 NEAR" sign-as ${aliceId} network-config testnet sign-with-keychain send`
);
const cancelTxId = parseTxId(cancelOutput);
console.log("★ 4. CANCEL TX ID:", cancelTxId);
console.log(`★ Link: https://explorer.testnet.near.org/transactions/${cancelTxId}`);

const escState4 = run(
  `near contract call-function as-read-only ${escrowId} get_escrow file-args ${agArgs} network-config testnet now`
);
console.log("Escrow #1 after Cancel:", escState4.trim());

// 5. Verify Alice's final balance
console.log("\n--- 5. Checking Alice's Final tUSDC Balance ---");
const finalBal = run(
  `near contract call-function as-read-only ${tokenId} ft_balance_of file-args ${balFile} network-config testnet now`
);
console.log("Alice Final tUSDC:", finalBal.trim());

console.log("\n=======================================================");
console.log("★ D6.2 GRADED SUBSCRIPTION LIFECYCLE COMPLETE RECEIPTS:");
console.log("★ 1. Subscribe (Pro Tier, 2 periods): https://explorer.testnet.near.org/transactions/" + subTxId);
console.log("★ 2. Upgrade (Prorated to Max Tier):  https://explorer.testnet.near.org/transactions/" + upTxId);
console.log("★ 3. Renew (+1 period Max Tier):     https://explorer.testnet.near.org/transactions/" + renewTxId);
console.log("★ 4. Cancel (Refund future periods):  https://explorer.testnet.near.org/transactions/" + cancelTxId);
console.log("=======================================================\n");
