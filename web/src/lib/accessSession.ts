import crypto from "crypto";

export interface AccessSessionPayload {
  accountId: string;
  productId: number;
  slug: string;
  agreementId: number;
  tierId: string;
  exp: number; // Unix timestamp in seconds
  iat: number; // Unix timestamp in seconds
}

const SESSION_SECRET =
  process.env["PANDEM_ACCESS_SECRET"] ||
  "pandem-testnet-nep413-enclave-access-key-2026";

function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  return Buffer.from(base64, "base64").toString("utf8");
}

export function createAccessToken(payload: AccessSessionPayload): string {
  const header = JSON.stringify({ alg: "HS256", typ: "JWT" });
  const encodedHeader = base64UrlEncode(header);
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const data = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(data)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  return `${data}.${signature}`;
}

export function verifyAccessToken(token: string): AccessSessionPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, signature] = parts;
    const data = `${encodedHeader}.${encodedPayload}`;
    const expectedSig = crypto
      .createHmac("sha256", SESSION_SECRET)
      .update(data)
      .digest("base64")
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");

    if (signature !== expectedSig) {
      return null;
    }

    const payload: AccessSessionPayload = JSON.parse(base64UrlDecode(encodedPayload));
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && now > payload.exp) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
