// scripts/test_d63_route_api.mjs
import fs from "fs";
import path from "path";
import os from "os";
import { signMessage } from "near-api-js/nep413";
import { Account, KeyPairSigner, KeyPair, JsonRpcProvider } from "near-api-js";
import { GET, POST } from "../web/src/app/api/access/route.ts";
import { NextRequest } from "next/server";

console.log("=== Testing /api/access Route Handler Directly ===");

async function testRoute() {
  const ESCROW_ID = "escrow-d6-df23.test-pandem-alice-1.testnet";
  const SUBSCRIBER_ID = "test-pandem-alice-1.testnet";
  const PRODUCT_SLUG = "open-webui";

  // 1. Test GET /api/access?slug=open-webui&accountId=test-pandem-alice-1.testnet
  console.log("\n1. Testing GET /api/access with active subscriber...");
  const getReq = new NextRequest(`http://localhost:3000/api/access?slug=${PRODUCT_SLUG}&accountId=${SUBSCRIBER_ID}`);
  const getRes = await GET(getReq);
  const getData = await getRes.json();

  console.log("GET response status:", getRes.status);
  console.log("hasActiveSubscription:", getData.hasActiveSubscription);
  console.log("agreements found:", getData.agreements?.length);
  if (!getData.hasActiveSubscription || getData.agreements?.length === 0) {
    throw new Error("Expected active subscription for test-pandem-alice-1.testnet");
  }

  const challenge = getData.challenge;
  console.log("Challenge product ID:", challenge.productId);
  console.log("Challenge nonce (hex):", challenge.nonceHex);

  // 2. Sign the challenge with subscriber keypair
  console.log("\n2. Signing challenge with subscriber keypair...");
  const credPath = path.join(os.homedir(), ".near-credentials", "testnet", `${SUBSCRIBER_ID}.json`);
  const cred = JSON.parse(fs.readFileSync(credPath, "utf8"));
  const kp = KeyPair.fromString(cred.private_key);
  const provider = new JsonRpcProvider({ url: "https://rpc.testnet.fastnear.com" });
  const signer = new KeyPairSigner(kp);
  const account = new Account(SUBSCRIBER_ID, provider, signer);

  const messageObj = {
    product_id: challenge.productId,
    agreement_id: getData.agreements[0].agreementId,
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

  // 3. Test POST /api/access with valid signature
  console.log("\n3. Testing POST /api/access with valid NEP-413 signature...");
  const postReq = new NextRequest("http://localhost:3000/api/access", {
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
      email: "subscriber.alice@pandem-test.io",
    }),
  });

  const postRes = await POST(postReq);
  const postData = await postRes.json();
  console.log("POST response status:", postRes.status);
  console.log("Success:", postData.success);
  console.log("Real website URL:", postData.product?.website_url);
  console.log("Real demo URL:", postData.product?.demo_url);
  console.log("Active Tier:", postData.session?.tierId);
  console.log("Remaining Periods:", postData.session?.remainingPeriods);
  console.log("Remaining Days:", postData.session?.remainingDays);
  console.log("Issued Session Token:", postData.token?.slice(0, 32) + "...");

  if (!postData.success || !postData.token || postData.product?.website_url !== "https://openwebui.com") {
    throw new Error("POST /api/access did not return expected verified session data");
  }

  // 4. Test GET /api/access?token=... with issued token
  console.log("\n4. Testing GET /api/access?token=<session_token>...");
  const verifyTokenReq = new NextRequest(`http://localhost:3000/api/access?slug=${PRODUCT_SLUG}&token=${encodeURIComponent(postData.token)}`);
  const verifyTokenRes = await GET(verifyTokenReq);
  const verifyTokenData = await verifyTokenRes.json();
  console.log("Verify token status:", verifyTokenRes.status);
  console.log("Valid session:", verifyTokenData.valid);
  console.log("Session account:", verifyTokenData.session?.accountId);
  if (!verifyTokenData.valid || verifyTokenData.session?.accountId !== SUBSCRIBER_ID) {
    throw new Error("Token verification failed");
  }

  // 5. Test POST /api/access with tampered signature (should be 401)
  console.log("\n5. Testing POST /api/access with tampered signature (should reject)...");
  const badSig = Buffer.from("bad_signature_bytes_123456789012345678901234567890").toString("base64");
  const badPostReq = new NextRequest("http://localhost:3000/api/access", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      accountId: SUBSCRIBER_ID,
      publicKey: pubKey,
      signature: badSig,
      message: messageStr,
      recipient: challenge.recipient,
      nonce: challenge.nonceBytes,
      slug: PRODUCT_SLUG,
    }),
  });
  const badPostRes = await POST(badPostReq);
  const badPostData = await badPostRes.json();
  console.log("Bad sig status (expected 401):", badPostRes.status, "Error:", badPostData.error);
  if (badPostRes.status !== 401) {
    throw new Error("Expected 401 status for bad signature");
  }

  // 6. Test GET /api/access with unsubscribed account
  console.log("\n6. Testing GET /api/access for unsubscribed account...");
  const unsubsReq = new NextRequest(`http://localhost:3000/api/access?slug=${PRODUCT_SLUG}&accountId=never-subscribed.testnet`);
  const unsubsRes = await GET(unsubsReq);
  const unsubsData = await unsubsRes.json();
  console.log("Unsubscribed hasActiveSubscription (expected false):", unsubsData.hasActiveSubscription);
  if (unsubsData.hasActiveSubscription !== false) {
    throw new Error("Expected hasActiveSubscription: false for unsubscribed account");
  }

  console.log("\n✓ ALL /api/access ROUTE TESTS PASSED PERFECTLY!");
}

testRoute().catch((e) => {
  console.error("Test error:", e);
  process.exit(1);
});
