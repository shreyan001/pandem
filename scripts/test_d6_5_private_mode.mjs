// scripts/test_d6_5_private_mode.mjs
import crypto from "crypto";
import { Redis } from "@upstash/redis";

console.log("================================================================================");
console.log("=== PANDEM D6.5: PRIVATE SUBSCRIPTION MODE (UI & ACCESS LAYER) TEST ===");
console.log("================================================================================");

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || "https://desired-baboon-201841.upstash.io",
  token: process.env.UPSTASH_REDIS_REST_TOKEN || "gQAAAAAAAxRxAAIgcDEyMGZlYmMxMmQxMmY0ZWEyOGFlNmFhNjhiNTRhMzhmNQ",
});

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

  // 1. Test Secret Generation (32 bytes = 64 hex chars)
  console.log("\n--- TEST 1: 32-Byte Client Secret Generation ---");
  const secretBytes = crypto.randomBytes(32);
  const secretHex = secretBytes.toString("hex");
  assert(secretHex.length === 64, `Secret length is 64 hex chars (32 bytes): ${secretHex.slice(0, 16)}...`);

  // 2. Compute Commitment Hash sha256(secret + ":" + product_id)
  console.log("\n--- TEST 2: Blind Commitment Hash Computation ---");
  const commitment = crypto
    .createHash("sha256")
    .update(`${secretHex}:${PRODUCT_ID}`)
    .digest("hex");
  assert(commitment.length === 64, `Commitment hash is valid 64-char sha256 hex: ${commitment.slice(0, 16)}...`);

  // 3. Register Commitment in Store (simulating on-chain or Redis commitment registration)
  console.log("\n--- TEST 3: Commitment Storage Registration ---");
  const commitmentKey = `pandem:commitment:${commitment}`;
  await redis.set(
    commitmentKey,
    JSON.stringify({
      commitment,
      productId: PRODUCT_ID,
      slug: PRODUCT_SLUG,
      tier: "max",
      periods: 12,
      payer: "test-pandem-alice-1.testnet",
      registeredAt: new Date().toISOString(),
    })
  );
  const storedData = await redis.get(commitmentKey);
  assert(storedData !== null, "Commitment successfully recorded in commitment storage");

  // 4. Test POST /api/access with valid private secret
  console.log("\n--- TEST 4: Unlock Gated Access via Private Secret ---");
  const accessRes = await fetch("http://localhost:3000/api/access", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      secret: secretHex,
      slug: PRODUCT_SLUG,
    }),
  });

  const accessData = await accessRes.json();
  console.log("Access response status:", accessRes.status);
  console.log("Success:", accessData.success);
  console.log("Beneficiary Account:", accessData.session?.accountId);
  console.log("Is Private:", accessData.session?.isPrivate);
  console.log("Real Website URL:", accessData.product?.website_url);
  console.log("Real Demo URL:", accessData.product?.demo_url);
  console.log("Active Tier:", accessData.session?.tierId);

  assert(accessRes.status === 200, "POST /api/access returned 200 OK");
  assert(accessData.success === true, "Verification succeeded");
  assert(accessData.session?.accountId === "private.pandem.testnet", "Account identity is anonymous (private.pandem.testnet)");
  assert(accessData.session?.isPrivate === true, "Session flagged as private blind subscription");
  assert(accessData.product?.website_url === "https://openwebui.com", "Revealed real website URL");
  assert(typeof accessData.token === "string" && accessData.token.length > 20, "Returned valid signed session token");

  // 5. Verify the Issued Session Token via GET /api/access?token=...
  console.log("\n--- TEST 5: Session Token Verification via /api/access ---");
  const tokenVerifyRes = await fetch(`http://localhost:3000/api/access?slug=${PRODUCT_SLUG}&token=${encodeURIComponent(accessData.token)}`);
  const tokenVerifyData = await tokenVerifyRes.json();
  assert(tokenVerifyRes.status === 200, "GET /api/access?token= returned 200 OK");
  assert(tokenVerifyData.valid === true, "Token is verified as active");
  assert(tokenVerifyData.session?.accountId === "private.pandem.testnet", "Token accountId matches private.pandem.testnet");

  // 6. Test with Invalid / Tampered Secret (Should be 404)
  console.log("\n--- TEST 6: Tampered / Invalid Secret Rejection ---");
  const badSecret = crypto.randomBytes(32).toString("hex");
  const badRes = await fetch("http://localhost:3000/api/access", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      secret: badSecret,
      slug: PRODUCT_SLUG,
    }),
  });
  console.log("Bad secret status (expected 404):", badRes.status);
  assert(badRes.status === 404, "Invalid secret is rejected with 404 Not Found");

  console.log(`\n================================================================================`);
  console.log(`=== ALL ${passed}/${total} PANDEM D6.5 PRIVATE MODE TESTS PASSED! ===`);
  console.log(`================================================================================`);
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
