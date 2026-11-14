import { PANDEM_ESCROW_ID, PANDEM_TOKEN_ID } from "@pandem/shared";

const FALLBACK_RPCS = [
  "/api/rpc",
  "https://rpc.testnet.near.org",
  "https://testnet.neartransaction.com",
];

export async function callViewMethod<T = any>(
  accountId: string,
  methodName: string,
  args: Record<string, any> = {}
): Promise<T | null> {
  const argsBase64 =
    typeof window !== "undefined"
      ? btoa(JSON.stringify(args))
      : Buffer.from(JSON.stringify(args)).toString("base64");

  const payload = {
    jsonrpc: "2.0",
    id: `view-${methodName}`,
    method: "query",
    params: {
      request_type: "call_function",
      finality: "optimistic",
      account_id: accountId,
      method_name: methodName,
      args_base64: argsBase64,
    },
  };

  for (const rpc of FALLBACK_RPCS) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(rpc, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) continue;
      const data = await res.json();
      if (data?.result?.result) {
        const decoded = JSON.parse(
          new TextDecoder().decode(new Uint8Array(data.result.result))
        );
        return decoded as T;
      }
    } catch {
      // Silently try next fallback RPC
    }
  }
  return null;
}

export { PANDEM_ESCROW_ID, PANDEM_TOKEN_ID };
