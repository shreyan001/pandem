import { NextRequest, NextResponse } from "next/server";
import { redis } from "../../../lib/redis";
import { ENRICHED_PRODUCTS, EnrichedProduct } from "@pandem/shared";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");
    const format = searchParams.get("format");

    // Fetch custom products stored in Redis set `pandem:custom_products`
    let customProducts: EnrichedProduct[] = [];
    try {
      const rawCustom = await redis.smembers("pandem:custom_products");
      if (Array.isArray(rawCustom)) {
        for (const item of rawCustom) {
          try {
            const parsed = typeof item === "string" ? JSON.parse(item) : item;
            if (parsed && typeof parsed === "object" && parsed.slug) {
              customProducts.push(parsed as EnrichedProduct);
            }
          } catch {
            // ignore malformed entry
          }
        }
      }
    } catch (redisErr) {
      console.warn("Failed to fetch custom products from Redis:", redisErr);
    }

    // Merge static seed catalog with Redis custom products (custom products take precedence on slug match)
    const productMap = new Map<string, EnrichedProduct>();
    for (const prod of ENRICHED_PRODUCTS) {
      productMap.set(prod.slug.toLowerCase(), prod);
    }
    for (const prod of customProducts) {
      productMap.set(prod.slug.toLowerCase(), prod);
    }

    const mergedProducts = Array.from(productMap.values());

    if (slug) {
      const product = productMap.get(slug.toLowerCase());
      if (!product) {
        return NextResponse.json({ error: `Product with slug '${slug}' not found` }, { status: 404 });
      }
      return NextResponse.json(product);
    }

    if (format === "object") {
      return NextResponse.json({ products: mergedProducts, total: mergedProducts.length });
    }

    return NextResponse.json(mergedProducts);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, slug, tagline, description, category, steward } = body;

    if (!name || !slug || !tagline || !description || !category || !steward) {
      return NextResponse.json(
        {
          error: "Missing required fields: name, slug, tagline, description, category, steward",
        },
        { status: 400 }
      );
    }

    const cleanSlug = String(slug).toLowerCase().trim().replace(/[^a-z0-9_-]/g, "-");

    // 1. Check if slug exists in static seed catalog
    const existsInStatic = ENRICHED_PRODUCTS.some((p) => p.slug.toLowerCase() === cleanSlug);
    if (existsInStatic) {
      return NextResponse.json(
        { error: `Product slug '${cleanSlug}' already exists in static catalog` },
        { status: 409 }
      );
    }

    // 2. Validate duplicate slugs via Redis `sismember` on `pandem:slugs`
    const isMember = await redis.sismember("pandem:slugs", cleanSlug);
    if (isMember === 1) {
      return NextResponse.json(
        { error: `Product slug '${cleanSlug}' already exists` },
        { status: 409 }
      );
    }

    // Construct enriched product object
    const newProduct: EnrichedProduct = {
      id: `custom-${Date.now()}`,
      product_id: Date.now(),
      slug: cleanSlug,
      name: String(name).trim(),
      suite: body.suite || (category === "Confidential AI" ? "Legal & IP Enclave" : "Decentralized Infrastructure"),
      tagline: String(tagline).trim(),
      description: String(description).trim(),
      category: String(category).trim(),
      privacy_problem:
        body.privacy_problem ||
        `Confidential computing required for ${String(name).trim()} workloads with zero persistent telemetry.`,
      why_direct_payment_fails:
        body.why_direct_payment_fails ||
        `Direct SaaS payments lack uptime escrow guarantees and automated warranty protections. Pandem releases funds on verified heartbeats.`,
      score: typeof body.score === "number" ? body.score : 88,
      score_inputs_hash: "0x" + Math.random().toString(16).substring(2, 18) + Math.random().toString(16).substring(2, 18),
      upvotes: 0,
      rank: ENRICHED_PRODUCTS.length + 1,
      heartbeat_healthy: true,
      heartbeat_streak: 1,
      last_heartbeat_timestamp: "Just now",
      tee_hardware: body.tee_hardware || "Intel TDX Enclave",
      tee_model: body.tee_model || "Self-Hosted Enclave",
      steward: String(steward).trim(),
      tiers:
        Array.isArray(body.tiers) && body.tiers.length > 0
          ? body.tiers
          : [
              {
                tier_id: "pro",
                name: "Pro",
                price_monthly: "5000000",
                price_yearly: "50000000",
                description: "Standard subscription tier with decentralized escrow guarantee.",
              },
            ],
      developer: {
        steward_address: String(steward).trim(),
        reputation_score: 90,
        wallet_score: 90,
        requests_closed: 0,
        upgrades_made: 1,
        last_active_at: "Just now",
        stargazers_count: 0,
      },
      treasury: {
        total_locked_usd: "$0.00",
        streamed_to_provider_usd: "$0.00",
        bug_warranty_reserve_usd: "$0.00",
        contingency_reserve_usd: "$0.00",
        average_budget_per_sub_usd: "$50.00 / yr",
        mrr_growth_pct: 0,
        escrow_warranty_days: 70,
        dynamic_allocation_status: "Streaming",
      },
      proposals: [],
      bug_reports: [],
      roadmap: [
        {
          title: "Initial Launch",
          description: "Deploy verifiable instance under Pandem escrow billing.",
          target_date: "2026-Q4",
          completed: true,
        },
      ],
      decentralization_checks: [
        { check_id: "open_source", title: "Open Source Codebase", passed: true },
        { check_id: "non_custodial", title: "Non-Custodial Escrow Billing", passed: true },
      ],
    };

    // Add slug to Redis slug index set and add product to custom products set
    await redis.sadd("pandem:slugs", cleanSlug);
    await redis.sadd("pandem:custom_products", JSON.stringify(newProduct));

    return NextResponse.json({ success: true, product: newProduct }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}
