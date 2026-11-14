// scripts/capture-d6-3.mjs
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";
import { signMessage } from "near-api-js/nep413";
import { KeyPair, KeyPairSigner, Account, JsonRpcProvider } from "near-api-js";

const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const screensDir = path.resolve("reports/screens");

if (!fs.existsSync(screensDir)) {
  fs.mkdirSync(screensDir, { recursive: true });
}

console.log("=== Pandem D6.3 Screenshot Capture ===");

async function main() {
  const SUBSCRIBER_ID = "test-pandem-alice-1.testnet";
  const PRODUCT_SLUG = "open-webui";

  // 1. Fetch challenge and sign NEP-413 message for test-pandem-alice-1.testnet
  console.log("1. Fetching challenge and signing NEP-413 message for real active subscriber...");
  const challengeRes = await fetch(`http://localhost:3000/api/access?slug=${PRODUCT_SLUG}&accountId=${SUBSCRIBER_ID}`);
  const challengeData = await challengeRes.json();
  const challenge = challengeData.challenge;
  const agreement = challengeData.agreements[0];

  const credPath = path.join(os.homedir(), ".near-credentials", "testnet", `${SUBSCRIBER_ID}.json`);
  const cred = JSON.parse(fs.readFileSync(credPath, "utf8"));
  const kp = KeyPair.fromString(cred.private_key);
  const provider = new JsonRpcProvider({ url: "https://rpc.testnet.fastnear.com" });
  const signer = new KeyPairSigner(kp);
  const account = new Account(SUBSCRIBER_ID, provider, signer);

  const messageObj = {
    product_id: challenge.productId,
    agreement_id: agreement.agreementId,
    nonce: challenge.nonceHex,
    expiry: challenge.expiry,
  };
  const messageStr = JSON.stringify(messageObj);
  const nonceBytes = new Uint8Array(challenge.nonceBytes);

  const signed = await signMessage({
    signerAccount: account,
    payload: {
      message: messageStr,
      recipient: challenge.recipient,
      nonce: nonceBytes,
    },
  });

  const sigBase64 = Buffer.from(signed.signature).toString("base64");
  const pubKey = (await signer.getPublicKey()).toString();

  // 2. Submit signature to /api/access to obtain valid signed session token
  const verifyRes = await fetch("http://localhost:3000/api/access", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      accountId: SUBSCRIBER_ID,
      publicKey: pubKey,
      signature: sigBase64,
      message: messageStr,
      recipient: challenge.recipient,
      nonce: challenge.nonceBytes,
      slug: PRODUCT_SLUG,
      email: "subscriber.alice@pandem.testnet",
    }),
  });

  const verifyData = await verifyRes.json();
  if (!verifyData.success || !verifyData.token) {
    throw new Error("Failed to obtain verified session token");
  }
  console.log("✓ Verified session token obtained!");

  // 3. Capture Case 1: Unlocked Active Access Page (1280px)
  const unlockedUrl = `http://localhost:3000/access/${PRODUCT_SLUG}?token=${encodeURIComponent(verifyData.token)}`;
  const unlockedOut = path.join(screensDir, "access-unlocked-1280.png");
  console.log(`\n2. Capturing active subscriber unlocked view from ${unlockedUrl}...`);
  const cmdUnlocked = `"${edgePath}" --headless --disable-gpu --virtual-time-budget=6000 --window-size=1280,1400 --screenshot="${unlockedOut}" "${unlockedUrl}"`;
  execSync(cmdUnlocked, { stdio: "inherit", timeout: 25000 });
  const statUnlocked = fs.statSync(unlockedOut);
  console.log(`✓ Saved ${unlockedOut} (${(statUnlocked.size / 1024).toFixed(1)} KB)`);

  // 4. Capture Case 2: Blocked / Locked Page (Unsubscribed / Disconnected) (1280px)
  const lockedUrl = `http://localhost:3000/access/${PRODUCT_SLUG}`;
  const lockedOut = path.join(screensDir, "access-locked-1280.png");
  console.log(`\n3. Capturing locked / blocked view from ${lockedUrl}...`);
  const cmdLocked = `"${edgePath}" --headless --disable-gpu --virtual-time-budget=6000 --window-size=1280,1400 --screenshot="${lockedOut}" "${lockedUrl}"`;
  execSync(cmdLocked, { stdio: "inherit", timeout: 25000 });
  const statLocked = fs.statSync(lockedOut);
  console.log(`✓ Saved ${lockedOut} (${(statLocked.size / 1024).toFixed(1)} KB)`);

  console.log("\n✓ All D6.3 screenshots captured successfully!");
}

main().catch((err) => {
  console.error("Screenshot error:", err);
  process.exit(1);
});
