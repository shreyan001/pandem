import { NextRequest, NextResponse } from "next/server";
import { redis } from "../../../lib/redis";
import { ENRICHED_PRODUCTS, SubscriberProposal } from "@pandem/shared";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");
    const accountId = searchParams.get("accountId");
    const format = searchParams.get("format");

    if (!slug) {
      return NextResponse.json(
        { error: "slug query parameter is required" },
        { status: 400 }
      );
    }

    const proposalsKey = `pandem:proposals:${slug.toLowerCase()}`;
    const rawProposals = await redis.lrange(proposalsKey, 0, -1);

    const redisProposals: SubscriberProposal[] = [];
    if (Array.isArray(rawProposals)) {
      for (const item of rawProposals) {
        try {
          const parsed = typeof item === "string" ? JSON.parse(item) : item;
          if (parsed && typeof parsed === "object" && parsed.id) {
            redisProposals.push(parsed as SubscriberProposal);
          }
        } catch {
          // ignore malformed
        }
      }
    }

    // Static seed proposals for this product
    const staticProduct = ENRICHED_PRODUCTS.find(
      (p) => p.slug.toLowerCase() === slug.toLowerCase()
    );
    const staticProposals = staticProduct?.proposals || [];

    // Merge Redis proposals first (newest), followed by static seed proposals without ID duplication
    const seenIds = new Set<string>();
    const merged: SubscriberProposal[] = [];

    for (const prop of redisProposals) {
      if (!seenIds.has(prop.id)) {
        seenIds.add(prop.id);
        merged.push(prop);
      }
    }
    for (const prop of staticProposals) {
      if (!seenIds.has(prop.id)) {
        seenIds.add(prop.id);
        merged.push(prop);
      }
    }

    // Check user token allocation if accountId provided
    let remainingTokens: number | null = null;
    if (accountId) {
      const userTokensKey = `pandem:user_tokens:${accountId}`;
      const rawTokens = await redis.get<number>(userTokensKey);
      remainingTokens = rawTokens === null || rawTokens === undefined ? 3 : Number(rawTokens);
    }

    if (format === "object" || remainingTokens !== null) {
      return NextResponse.json({
        proposals: merged,
        total: merged.length,
        userTokens: remainingTokens ?? 3,
      });
    }

    return NextResponse.json(merged);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { slug, title, description, accountId, tokens } = body;

    if (!slug || !title || !description || !accountId) {
      return NextResponse.json(
        { error: "Missing required fields: slug, title, description, accountId" },
        { status: 400 }
      );
    }

    const cleanSlug = String(slug).toLowerCase().trim();
    const tokensToDeduct = typeof tokens === "number" && tokens > 0 ? tokens : 1;

    // Check user tokens allocation (3 tokens/mo allocation)
    const userTokensKey = `pandem:user_tokens:${accountId}`;
    const rawTokens = await redis.get<number>(userTokensKey);
    const currentTokens = rawTokens === null || rawTokens === undefined ? 3 : Number(rawTokens);

    if (currentTokens < tokensToDeduct) {
      return NextResponse.json(
        {
          error: "Insufficient request tokens for this billing period",
          availableTokens: currentTokens,
          requiredTokens: tokensToDeduct,
        },
        { status: 403 }
      );
    }

    // Deduct tokens and save new balance
    const newBalance = currentTokens - tokensToDeduct;
    await redis.set(userTokensKey, newBalance);

    // Resolve product_id from static seed or fallback to 1
    const staticProduct = ENRICHED_PRODUCTS.find(
      (p) => p.slug.toLowerCase() === cleanSlug
    );
    const productId = staticProduct?.product_id || 1;

    const newProposal: SubscriberProposal = {
      id: `prop-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      product_id: productId,
      title: String(title).trim(),
      description: String(description).trim(),
      tokens_allocated: tokensToDeduct,
      author: String(accountId).trim(),
      created_at: "Just now",
      status: "Open",
    };

    // Store proposal in Redis list `pandem:proposals:{slug}`
    const proposalsKey = `pandem:proposals:${cleanSlug}`;
    await redis.lpush(proposalsKey, JSON.stringify(newProposal));

    return NextResponse.json(
      {
        success: true,
        proposal: newProposal,
        remainingTokens: newBalance,
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}
