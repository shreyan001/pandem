import { NextResponse } from "next/server";

const AGENT_URL = process.env["AGENT_URL"] || "http://localhost:8787";

export async function GET() {
  try {
    const res = await fetch(`${AGENT_URL}/runner/state`);
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
