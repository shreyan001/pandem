import { NextRequest, NextResponse } from "next/server";

const AGENT_URL = process.env["AGENT_URL"] || "http://localhost:8787";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const nonce = searchParams.get("nonce") || undefined;
    const url = nonce ? `${AGENT_URL}/attestation?nonce=${encodeURIComponent(nonce)}` : `${AGENT_URL}/attestation`;
    
    const res = await fetch(url);
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
