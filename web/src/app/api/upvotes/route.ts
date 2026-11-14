import { NextRequest, NextResponse } from "next/server";
import { redis } from "../../../lib/redis";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { productId, accountId } = body;

    if (!productId || !accountId) {
      return NextResponse.json(
        { error: "productId and accountId are required" },
        { status: 400 }
      );
    }

    const key = `pandem:upvotes:${productId}`;

    // Check if account already upvoted
    const isVoted = await redis.sismember(key, accountId);

    if (isVoted === 1) {
      // Toggle off: remove account from set
      await redis.srem(key, accountId);
      const totalUpvotes = await redis.scard(key);
      return NextResponse.json({ upvoted: false, totalUpvotes });
    } else {
      // Toggle on: add account to set
      await redis.sadd(key, accountId);
      const totalUpvotes = await redis.scard(key);
      return NextResponse.json({ upvoted: true, totalUpvotes });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");
    const accountId = searchParams.get("accountId");

    if (!productId) {
      return NextResponse.json({ error: "productId query parameter is required" }, { status: 400 });
    }

    const key = `pandem:upvotes:${productId}`;
    const totalUpvotes = await redis.scard(key);
    const upvoted = accountId ? (await redis.sismember(key, accountId)) === 1 : false;

    return NextResponse.json({ upvoted, totalUpvotes });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}
