import { NextRequest, NextResponse } from "next/server";
import { redis } from "../../../lib/redis";
import { ENRICHED_PRODUCTS, BugReport } from "@pandem/shared";

function calculateWarrantyHoldAndSla(severity: string): { holdUsd: string; slaHours: number } {
  switch (severity) {
    case "Critical":
      return { holdUsd: "$350.00", slaHours: 24 };
    case "High":
      return { holdUsd: "$200.00", slaHours: 48 };
    case "Medium":
      return { holdUsd: "$120.00", slaHours: 72 };
    case "Low":
    default:
      return { holdUsd: "$50.00", slaHours: 120 };
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");
    const format = searchParams.get("format");

    if (!slug) {
      return NextResponse.json(
        { error: "slug query parameter is required" },
        { status: 400 }
      );
    }

    const bugsKey = `pandem:bugs:${slug.toLowerCase()}`;
    const rawBugs = await redis.lrange(bugsKey, 0, -1);

    const redisBugs: BugReport[] = [];
    if (Array.isArray(rawBugs)) {
      for (const item of rawBugs) {
        try {
          const parsed = typeof item === "string" ? JSON.parse(item) : item;
          if (parsed && typeof parsed === "object" && parsed.id) {
            redisBugs.push(parsed as BugReport);
          }
        } catch {
          // ignore malformed
        }
      }
    }

    // Static seed bug reports for this product
    const staticProduct = ENRICHED_PRODUCTS.find(
      (p) => p.slug.toLowerCase() === slug.toLowerCase()
    );
    const staticBugs = staticProduct?.bug_reports || [];

    // Merge Redis bugs first (newest), followed by static seed bugs without ID duplication
    const seenIds = new Set<string>();
    const merged: BugReport[] = [];

    for (const bug of redisBugs) {
      if (!seenIds.has(bug.id)) {
        seenIds.add(bug.id);
        merged.push(bug);
      }
    }
    for (const bug of staticBugs) {
      if (!seenIds.has(bug.id)) {
        seenIds.add(bug.id);
        merged.push(bug);
      }
    }

    if (format === "object") {
      return NextResponse.json({
        bug_reports: merged,
        total: merged.length,
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
    const { slug, title, description, reporter, severity } = body;

    if (!slug || !title || !description || !reporter) {
      return NextResponse.json(
        { error: "Missing required fields: slug, title, description, reporter" },
        { status: 400 }
      );
    }

    const cleanSlug = String(slug).toLowerCase().trim();
    const validSeverity: "Low" | "Medium" | "High" | "Critical" =
      severity === "Critical" || severity === "High" || severity === "Low" ? severity : "Medium";

    const { holdUsd, slaHours } = calculateWarrantyHoldAndSla(validSeverity);

    // Resolve product_id from static seed or fallback to 1
    const staticProduct = ENRICHED_PRODUCTS.find(
      (p) => p.slug.toLowerCase() === cleanSlug
    );
    const productId = staticProduct?.product_id || 1;

    const newBug: BugReport = {
      id: `bug-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      product_id: productId,
      title: String(title).trim(),
      severity: validSeverity,
      description: String(description).trim(),
      status: "Investigating",
      warranty_reserve_hold_usd: holdUsd,
      submitted_by: String(reporter).trim(),
      submitted_at: "Just now",
      sla_hours_remaining: slaHours,
    };

    // Save bug report to Redis list `pandem:bugs:{slug}`
    const bugsKey = `pandem:bugs:${cleanSlug}`;
    await redis.lpush(bugsKey, JSON.stringify(newBug));

    return NextResponse.json(
      {
        success: true,
        bug: newBug,
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}
