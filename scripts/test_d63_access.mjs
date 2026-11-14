// scripts/test_d63_access.mjs
import fs from "fs";
import path from "path";
import os from "os";
import { signMessage, verifyMessage } from "near-api-js/nep413";
import { Account, KeyPairSigner, KeyPair, JsonRpcProvider } from "near-api-js";
import crypto from "crypto";

const SESSION_SECRET =
  process.env["PANDEM_ACCESS_SECRET"] ||
  "pandem-testnet-nep413-enclave-access-key-2026";

function base64UrlEncode(str) {
  return Buffer.from(str)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlDecode(str) {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  return Buffer.from(base64, "base64").toString("utf8");
}

function createAccessToken(payload) {
  const header = JSON.stringify({ alg: "HS256", typ: "JWT" });
  const encodedHeader = base64UrlEncode(header);
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const data = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(data)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  return `${data}.${signature}`;
}

function verifyAccessToken(token) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, signature] = parts;
    const data = `${encodedHeader}.${encodedPayload}`;
    const expectedSig = crypto
      .createHmac("sha256", SESSION_SECRET)
      .update(data)
      .digest("base64")
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");

    if (signature !== expectedSig) {
      return null;
    }

    const payload = JSON.parse(base64UrlDecode(encodedPayload));
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && now > payload.exp) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

async function callViewMethod(accountId, methodName, argsObj = {}) {
  const argsBase64 = Buffer.from(JSON.stringify(argsObj)).toString("base64");
  const res = await fetch("https://rpc.testnet.fastnear.com", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "pandem-view",
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
  const data = await res.json();
  if (data.error) throw new Error(JSON.stringify(data.error));
  const decoded = Buffer.from(data.result.result).toString("utf8");
  return JSON.parse(decoded);
}

console.log("================================================================================");
console.log("=== PANDEM D6.3: REAL ACCESS LINK & NEP-413 VERIFICATION TEST SUITE ===");
console.log("================================================================================");

const ESCROW_ID = "escrow-d6-df23.test-pandem-alice-1.testnet";
const SUBSCRIBER_ID = "test-pandem-alice-1.testnet";
const PRODUCT_ID = 1;
const PRODUCT_SLUG = "open-webui";

async function runTests() {
  let passed = 0;
  let total = 0;

  function assert(condition, name) {
    total++;
    if (condition) {
      console.log(`  ✓ PASS [${total}]: ${name}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL [${total}]: ${name}`);
      throw new Error(`Assertion failed: ${name}`);
    }
  }

  // 1. Check on-chain agreement state
  console.log("\n--- TEST 1: Live On-Chain Agreement & Escrow View Query ---");
  const agreement = await callViewMethod(ESCROW_ID, "get_agreement", { id: 1 });
  const escrow = await callViewMethod(ESCROW_ID, "get_escrow", { id: 1 });

  assert(agreement !== null, "Agreement #1 exists on-chain");
  assert(escrow !== null, "Escrow #1 exists on-chain");
  assert(agreement.subscriber === SUBSCRIBER_ID, `Subscriber matches: ${SUBSCRIBER_ID}`);
  assert(Number(agreement.product_id) === PRODUCT_ID, `Product ID matches: ${PRODUCT_ID}`);
  assert(escrow.refunded === false, "Agreement #1 is NOT refunded");
  assert(escrow.funded_periods > escrow.released_periods, "Agreement #1 has funded periods remaining");
  console.log(`    Agreement #1 Tier: ${agreement.tier_id}, Funded: ${escrow.funded_periods}, Released: ${escrow.released_periods}`);

  // 2. Query agreements for unsubscribed account
  console.log("\n--- TEST 2: Unsubscribed Account Gate Verification ---");
  const unsubsAgreements = await callViewMethod(ESCROW_ID, "get_agreements_for", { account_id: "never-subscribed-pandem.testnet" });
  assert(Array.isArray(unsubsAgreements) && unsubsAgreements.length === 0, "Unsubscribed account has 0 active agreements");

  // 3. Cryptographic Session Token Unit Tests
  console.log("\n--- TEST 3: HMAC-SHA256 Session Token Signing & Tamper Verification ---");
  const testPayload = {
    accountId: SUBSCRIBER_ID,
    productId: PRODUCT_ID,
    slug: PRODUCT_SLUG,
    agreementId: 1,
    tierId: "max",
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000),
  };

  const token = createAccessToken(testPayload);
  assert(typeof token === "string" && token.split(".").length === 3, "Session token is valid 3-part JWT format");

  const verifiedPayload = verifyAccessToken(token);
  assert(verifiedPayload !== null, "Session token verifies successfully");
  assert(verifiedPayload.accountId === SUBSCRIBER_ID, "Session token payload matches accountId");
  assert(verifiedPayload.tierId === "max", "Session token payload matches tierId");

  // Tampered token test
  const tamperedToken = token.slice(0, -4) + "XXXX";
  const tamperedResult = verifyAccessToken(tamperedToken);
  assert(tamperedResult === null, "Tampered session token is rejected");

  // Expired token test
  const expiredPayload = { ...testPayload, exp: Math.floor(Date.now() / 1000) - 10 };
  const expiredToken = createAccessToken(expiredPayload);
  const expiredResult = verifyAccessToken(expiredToken);
  assert(expiredResult === null, "Expired session token is rejected");

  // 4. Real NEP-413 Signature Creation & Fastnear RPC Verification
  console.log("\n--- TEST 4: Real NEP-413 Key Signing & Verification on Testnet RPC ---");
  const credPath = path.join(os.homedir(), ".near-credentials", "testnet", `${SUBSCRIBER_ID}.json`);
  const cred = JSON.parse(fs.readFileSync(credPath, "utf8"));
  const kp = KeyPair.fromString(cred.private_key);
  const provider = new JsonRpcProvider({ url: "https://rpc.testnet.fastnear.com" });
  const signer = new KeyPairSigner(kp);
  const account = new Account(SUBSCRIBER_ID, provider, signer);

  const nonceBytes = new Uint8Array(32);
  nonceBytes.fill(88);

  const challengeObj = {
    product_id: PRODUCT_ID,
    agreement_id: 1,
    nonce: Buffer.from(nonceBytes).toString("hex"),
    expiry: Date.now() + 15 * 60 * 1000,
  };

  const challengeMsg = JSON.stringify(challengeObj);
  const nep413Payload = {
    message: challengeMsg,
    recipient: ESCROW_ID,
    nonce: nonceBytes,
  };

  const signed = await signMessage({ signerAccount: account, payload: nep413Payload });
  assert(signed && signed.signature && signed.signature.length === 64, "Generated 64-byte Ed25519 NEP-413 signature");

  const publicKeyStr = (await signer.getPublicKey()).toString();
  console.log(`    Signer Public Key: ${publicKeyStr}`);
  console.log(`    Signature (base64): ${Buffer.from(signed.signature).toString("base64")}`);

  // Verify against fastnear RPC
  let nep413Verified = false;
  try {
    await verifyMessage({
      signerAccountId: SUBSCRIBER_ID,
      signerPublicKey: publicKeyStr,
      payload: nep413Payload,
      signature: signed.signature,
      provider,
    });
    nep413Verified = true;
  } catch (e) {
    console.error("verifyMessage error:", e);
  }
  assert(nep413Verified, "NEP-413 signature verified against testnet on-chain access key");

  // Tamper signature test
  let tamperedCaught = false;
  try {
    const badSig = new Uint8Array(signed.signature);
    badSig[0] ^= 0xff;
    await verifyMessage({
      signerAccountId: SUBSCRIBER_ID,
      signerPublicKey: publicKeyStr,
      payload: nep413Payload,
      signature: badSig,
      provider,
    });
  } catch {
    tamperedCaught = true;
  }
  assert(tamperedCaught, "Tampered NEP-413 signature is rejected");

  console.log(`\n================================================================================`);
  console.log(`=== ALL ${passed}/${total} PANDEM D6.3 TESTS PASSED SUCCESSFULLY! ===`);
  console.log(`================================================================================`);
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
