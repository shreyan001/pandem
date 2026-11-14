// scripts/audit_live_rpc.mjs
const FASTNEAR_RPC = "https://rpc.testnet.fastnear.com";

async function queryRpc(accountId, methodName, argsObj = {}) {
  const argsBase64 = Buffer.from(JSON.stringify(argsObj)).toString("base64");
  const res = await fetch(FASTNEAR_RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "audit-f3",
      method: "query",
      params: {
        request_type: "call_function",
        finality: "final",
        account_id: accountId,
        method_name: methodName,
        args_base64: argsBase64,
      },
    }),
  });
  if (!res.ok) throw new Error(`RPC HTTP error: ${res.statusText}`);
  const json = await res.json();
  if (json.error) return { error: json.error };
  if (!json.result || !json.result.result) return { result: null, raw: json.result };
  const decoded = Buffer.from(json.result.result).toString("utf8");
  try {
    return JSON.parse(decoded);
  } catch {
    return decoded;
  }
}

async function run() {
  console.log("================================================================================");
  console.log("=== PANDEM F3: LIVE CONTRACT RPC AUDIT ===");
  console.log("================================================================================");

  // 1. Token ft_metadata
  console.log("\n[1] Token (pandem-tusdc-46cee5ca.testnet) -> ft_metadata:");
  const tokenMetadata = await queryRpc("pandem-tusdc-46cee5ca.testnet", "ft_metadata");
  console.log(JSON.stringify(tokenMetadata, null, 2));

  // 2. Escrow get_config & get_budget_contract
  console.log("\n[2a] Escrow (escrow-d64-40ba.test-pandem-alice-1.testnet) -> get_config:");
  const escrowConfig = await queryRpc("escrow-d64-40ba.test-pandem-alice-1.testnet", "get_config");
  console.log(JSON.stringify(escrowConfig, null, 2));

  console.log("\n[2b] Escrow (escrow-d64-40ba.test-pandem-alice-1.testnet) -> get_budget_contract:");
  const budgetContract = await queryRpc("escrow-d64-40ba.test-pandem-alice-1.testnet", "get_budget_contract");
  console.log(JSON.stringify(budgetContract, null, 2));

  // 3. Budget get_budget(1)
  console.log("\n[3] Budget (pandem-budget-d1-8f199e48.testnet) -> get_budget(1):");
  const productBudget = await queryRpc("pandem-budget-d1-8f199e48.testnet", "get_budget", { product_id: 1 });
  console.log(JSON.stringify(productBudget, null, 2));

  // 4. Registry get_listing(1)
  console.log("\n[4] Registry (pandem-registry-v2-46cee5ca.testnet) -> get_listing(1):");
  const registryListing = await queryRpc("pandem-registry-v2-46cee5ca.testnet", "get_listing", { product_id: 1 });
  console.log(JSON.stringify(registryListing, null, 2));
}

run().catch(console.error);
