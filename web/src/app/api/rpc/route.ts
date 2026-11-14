import { NextRequest, NextResponse } from "next/server";

const RPC_ENDPOINTS = [
  "https://rpc.testnet.near.org",
  "https://testnet.neartransaction.com",
  "https://rpc.testnet.fastnear.com",
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    let lastError: any = null;
    for (const endpoint of RPC_ENDPOINTS) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          return NextResponse.json(data);
        }
      } catch (err) {
        lastError = err;
        // Try next fallback endpoint
      }
    }

    return NextResponse.json(
      { jsonrpc: "2.0", id: body?.id ?? "error", error: { code: -32000, message: "RPC fallbacks exhausted", detail: String(lastError) } },
      { status: 502 }
    );
  } catch (e: any) {
    return NextResponse.json(
      { jsonrpc: "2.0", id: "error", error: { code: -32603, message: e?.message || "Internal error" } },
      { status: 500 }
    );
  }
}
