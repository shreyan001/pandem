import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { verifyMessage } from "near-api-js/nep413";
import { JsonRpcProvider } from "near-api-js";
import { redis } from "../../../lib/redis";
import { createAccessToken, verifyAccessToken } from "../../../lib/accessSession";
import { callViewMethod } from "../../../lib/nearRpc";
import { PANDEM_ESCROW_ID } from "@pandem/shared";
import catalogProducts from "../../../../../shared/catalog.json";

const TESTNET_RPCS = [
  "https://rpc.testnet.fastnear.com",
  "https://rpc.testnet.near.org",
  "https://testnet.neartransaction.com",
];

interface CatalogProduct {
  product_id: number;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  category: string;
  logo_url: string;
  hero_url: string;
  website_url: string;
  demo_url: string;
  repo_url: string;
  license: string;
  tiers?: Array<{ tier_id: string; name: string; price_monthly: string; price_yearly: string }>;
}

const productsList = catalogProducts as CatalogProduct[];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");
    const accountId = searchParams.get("accountId");
    const token = searchParams.get("token") || req.headers.get("authorization")?.replace("Bearer ", "");

    // 1. If checking existing signed session token
    if (token) {
      const session = verifyAccessToken(token);
      if (!session) {
        return NextResponse.json({ valid: false, error: "Invalid or expired session token" }, { status: 401 });
      }

      const product = productsList.find(
        (p) => p.product_id === session.productId || p.slug.toLowerCase() === (slug || session.slug).toLowerCase()
      );

      return NextResponse.json({
        valid: true,
        session,
        product: product
          ? {
              name: product.name,
              slug: product.slug,
              website_url: product.website_url,
              demo_url: product.demo_url,
              tier: session.tierId,
            }
          : null,
      });
    }

    // 2. If checking on-chain agreements for account & slug
    if (slug) {
      const product = productsList.find((p) => p.slug.toLowerCase() === slug.toLowerCase());
      if (!product) {
        return NextResponse.json({ error: `Product with slug '${slug}' not found` }, { status: 404 });
      }

      // Generate a fresh 32-byte cryptographic challenge nonce for NEP-413 sign
      const nonceBytes = crypto.randomBytes(32);
      const nonceHex = nonceBytes.toString("hex");

      let activeAgreements: any[] = [];
      if (accountId) {
        try {
          const userAgreements = await callViewMethod<any[]>(
            PANDEM_ESCROW_ID,
            "get_agreements_for",
            { account_id: accountId }
          );

          if (Array.isArray(userAgreements)) {
            for (const item of userAgreements) {
              const agreementId = item[0];
              const agreement = item[1];
              const escrow = item[2];

              if (
                Number(agreement.product_id) === product.product_id &&
                !escrow.refunded &&
                escrow.funded_periods > escrow.released_periods
              ) {
                const remainingPeriods = escrow.funded_periods - escrow.released_periods;
                const periodDays = Math.round(Number(agreement.period_ns) / (86400 * 1e9)) || 30;
                const remainingDays = remainingPeriods * periodDays;

                activeAgreements.push({
                  agreementId,
                  tierId: agreement.tier_id,
                  pricePerPeriod: agreement.price_per_period,
                  fundedPeriods: escrow.funded_periods,
                  releasedPeriods: escrow.released_periods,
                  remainingPeriods,
                  remainingDays,
                  balance: escrow.balance,
                  startNs: agreement.start_ns,
                  periodNs: agreement.period_ns,
                  graceNs: agreement.grace_ns,
                });
              }
            }
          }
        } catch (chainErr) {
          console.warn("Could not query agreements for account:", chainErr);
        }
      }

      return NextResponse.json({
        product: {
          product_id: product.product_id,
          name: product.name,
          slug: product.slug,
          category: product.category,
          website_url: product.website_url,
          demo_url: product.demo_url,
          tiers: product.tiers,
        },
        hasActiveSubscription: activeAgreements.length > 0,
        agreements: activeAgreements,
        challenge: {
          productId: product.product_id,
          nonceHex,
          nonceBytes: Array.from(nonceBytes),
          recipient: PANDEM_ESCROW_ID,
          expiry: Date.now() + 15 * 60 * 1000, // 15 min expiry
        },
      });
    }

    return NextResponse.json({ error: "Missing required slug or token query parameter" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, email, accountId, slug, publicKey, signature, message, recipient, nonce } = body;

    // Optional off-chain email capture handling
    if (action === "save_email" || (email && !signature)) {
      if (!email || typeof email !== "string" || !email.includes("@")) {
        return NextResponse.json({ error: "Invalid email address format" }, { status: 400 });
      }

      const userAcc = accountId || "anonymous";
      const productSlug = slug || "general";
      const redisKey = `pandem:subscriber_emails:${userAcc}:${productSlug}`;

      try {
        await redis.set(redisKey, JSON.stringify({
          email: email.trim(),
          accountId: userAcc,
          slug: productSlug,
          savedAt: new Date().toISOString(),
          source: "pandem-access-enclave"
        }));
      } catch (redisErr) {
        console.warn("Redis write notice (fallback to client state):", redisErr);
      }

      return NextResponse.json({
        success: true,
        message: "Email saved off-chain. Used strictly for product and enclave updates.",
        email: email.trim(),
      });
    }

    // NEP-413 Signature Verification and Session Granting
    if (!accountId || !publicKey || !signature || !message || !recipient || !nonce) {
      return NextResponse.json(
        { error: "Missing required fields for NEP-413 verification: accountId, publicKey, signature, message, recipient, nonce" },
        { status: 400 }
      );
    }

    // 1. Parse and validate message payload { product_id, agreement_id, nonce, expiry }
    let parsedMessage: { product_id: number; agreement_id: number; nonce: string; expiry: number };
    try {
      parsedMessage = typeof message === "string" ? JSON.parse(message) : message;
    } catch {
      return NextResponse.json({ error: "Message is not valid JSON string" }, { status: 400 });
    }

    const { product_id, agreement_id, expiry } = parsedMessage;
    if (!product_id || !agreement_id) {
      return NextResponse.json(
        { error: "Message must contain product_id and agreement_id" },
        { status: 400 }
      );
    }

    // 2. Check challenge expiry
    if (expiry && typeof expiry === "number" && Date.now() > expiry) {
      return NextResponse.json(
        { error: "NEP-413 signature challenge has expired. Please refresh and re-sign." },
        { status: 401 }
      );
    }

    // 3. Verify NEP-413 signature with Near RPC
    const nonceArr = Array.isArray(nonce)
      ? new Uint8Array(nonce)
      : typeof nonce === "string"
      ? new Uint8Array(Buffer.from(nonce, "hex"))
      : new Uint8Array(32);

    const sigBytes = typeof signature === "string"
      ? new Uint8Array(Buffer.from(signature, "base64"))
      : new Uint8Array(signature);

    const nep413Payload = {
      message: typeof message === "string" ? message : JSON.stringify(message),
      recipient,
      nonce: nonceArr,
    };

    let verificationPassed = false;
    let verifyError: any = null;

    for (const rpcUrl of TESTNET_RPCS) {
      try {
        const provider = new JsonRpcProvider({ url: rpcUrl });
        await verifyMessage({
          signerAccountId: accountId,
          signerPublicKey: publicKey,
          payload: nep413Payload,
          signature: sigBytes,
          provider,
        });
        verificationPassed = true;
        break;
      } catch (err: any) {
        verifyError = err;
        // If it's a signature mismatch, don't retry RPCs
        if (err?.message?.includes("Signature verification failed")) {
          break;
        }
      }
    }

    if (!verificationPassed) {
      return NextResponse.json(
        {
          error: "NEP-413 signature verification failed",
          detail: verifyError?.message || String(verifyError),
        },
        { status: 401 }
      );
    }

    // 4. Query on-chain agreement state from Escrow Contract
    const [agreement, escrow] = await Promise.all([
      callViewMethod<any>(PANDEM_ESCROW_ID, "get_agreement", { id: Number(agreement_id) }),
      callViewMethod<any>(PANDEM_ESCROW_ID, "get_escrow", { id: Number(agreement_id) }),
    ]);

    if (!agreement || !escrow) {
      return NextResponse.json(
        { error: `Agreement #${agreement_id} not found on escrow contract (${PANDEM_ESCROW_ID})` },
        { status: 404 }
      );
    }

    // Verify subscriber matches signer account
    if (agreement.subscriber !== accountId) {
      return NextResponse.json(
        { error: `Signer account '${accountId}' is not the subscriber of Agreement #${agreement_id}` },
        { status: 403 }
      );
    }

    // Verify product_id matches
    if (Number(agreement.product_id) !== Number(product_id)) {
      return NextResponse.json(
        { error: `Agreement product ID (${agreement.product_id}) does not match requested product ID (${product_id})` },
        { status: 400 }
      );
    }

    // Verify agreement is not refunded or cancelled
    if (escrow.refunded) {
      return NextResponse.json(
        { error: `Agreement #${agreement_id} has been refunded or cancelled on-chain` },
        { status: 403 }
      );
    }

    // Verify funded periods remaining
    const remainingPeriods = Number(escrow.funded_periods) - Number(escrow.released_periods);
    if (remainingPeriods <= 0) {
      return NextResponse.json(
        { error: `Agreement #${agreement_id} has expired (all funded periods released)` },
        { status: 403 }
      );
    }

    // Match product in catalog
    const product = productsList.find(
      (p) => p.product_id === Number(product_id) || p.slug.toLowerCase() === (slug || "").toLowerCase()
    );

    const productSlug = product?.slug || slug || `product-${product_id}`;
    const periodDays = Math.round(Number(agreement.period_ns) / (86400 * 1e9)) || 30;
    const remainingDays = remainingPeriods * periodDays;

    // 5. Generate short-lived signed session token (valid 1 hour)
    const nowSec = Math.floor(Date.now() / 1000);
    const sessionToken = createAccessToken({
      accountId,
      productId: Number(product_id),
      slug: productSlug,
      agreementId: Number(agreement_id),
      tierId: agreement.tier_id || "pro",
      exp: nowSec + 3600,
      iat: nowSec,
    });

    // Optional off-chain email save if included in payload
    if (email && typeof email === "string" && email.includes("@")) {
      try {
        const redisKey = `pandem:subscriber_emails:${accountId}:${productSlug}`;
        await redis.set(redisKey, JSON.stringify({
          email: email.trim(),
          accountId,
          slug: productSlug,
          savedAt: new Date().toISOString(),
          source: "pandem-access-enclave"
        }));
      } catch (redisErr) {
        console.warn("Failed to save email to Redis:", redisErr);
      }
    }

    return NextResponse.json({
      success: true,
      token: sessionToken,
      session: {
        accountId,
        productId: Number(product_id),
        slug: productSlug,
        agreementId: Number(agreement_id),
        tierId: agreement.tier_id || "pro",
        remainingPeriods,
        remainingDays,
        fundedPeriods: escrow.funded_periods,
        releasedPeriods: escrow.released_periods,
        expiresInSeconds: 3600,
      },
      product: product
        ? {
            name: product.name,
            slug: product.slug,
            category: product.category,
            website_url: product.website_url,
            demo_url: product.demo_url,
            tier: agreement.tier_id || "pro",
          }
        : null,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}
