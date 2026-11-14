// scripts/verify_all_tx_hashes.mjs
const FASTNEAR_RPC = "https://rpc.testnet.fastnear.com";

const txList = [
  {
    step: "1. Faucet Claim Tx",
    txId: "GJM3Nke5UovC3gUik319G4MAxQgdKmMa18iDvbyfu97",
    account: "d61.test-pandem-alice-1.testnet",
  },
  {
    step: "2. Send tUSDC Tx",
    txId: "FTk6jq875AaFwhDo3deZFosPji79SaAC1k8zuHkm83pe",
    account: "test-pandem-alice-1.testnet",
  },
  {
    step: "3. Subscribe Tx (Pro Tier 2 Periods)",
    txId: "FuSkAiSVCihP9Qrkgyv7wagFy5chGPtE2PJXs8hSzAeZ",
    account: "test-pandem-alice-1.testnet",
  },
  {
    step: "4. Heartbeat & Release Tx (30% Ops to Budget)",
    txId: "7f2t1evj8sTrWZ7CkNEz3mdexwuBpjym1m6ivGoiZpT7",
    account: "test-pandem-alice-1.testnet",
  },
  {
    step: "5. Renew Tx (+1 Period)",
    txId: "GMZ4ya8KXwVWDAgmdW9HQXcJov3jM13fT4Qav62V74Ut",
    account: "test-pandem-alice-1.testnet",
  },
  {
    step: "6. Cancel & Pro-Rata Refund Tx",
    txId: "8FkaGuUcsKirk9xvjkyTXDrK3qVCWX67yLsfZywseN9C",
    account: "test-pandem-alice-1.testnet",
  },
];

async function checkTx(tx) {
  const res = await fetch(FASTNEAR_RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "tx-check",
      method: "tx",
      params: [tx.txId, tx.account],
    }),
  });
  const data = await res.json();
  if (data.error) {
    return { success: false, error: data.error };
  }
  const status = data.result.status;
  const executionSuccess = status?.SuccessValue !== undefined || status?.SuccessReceiptId !== undefined;
  return {
    success: executionSuccess,
    transaction: data.result.transaction,
    receiptsCount: data.result.receipts?.length,
    receiptsOutcomeCount: data.result.receipts_outcome?.length,
  };
}

async function run() {
  console.log("================================================================================");
  console.log("=== PANDEM F3: VERIFYING ALL DEMO JOURNEY ON-CHAIN TRANSACTIONS ===");
  console.log("================================================================================");

  let verifiedCount = 0;

  for (const item of txList) {
    console.log(`\nChecking [${item.step}]...`);
    console.log(`  Tx Hash: ${item.txId}`);
    console.log(`  Signer:  ${item.account}`);
    console.log(`  Explorer: https://explorer.testnet.near.org/transactions/${item.txId}`);
    
    const result = await checkTx(item);
    if (result.success) {
      console.log(`  ✓ STATUS: Confirmed On-Chain (Receipts: ${result.receiptsCount}, Outcome: ${result.receiptsOutcomeCount})`);
      verifiedCount++;
    } else {
      console.error(`  ❌ Failed or unconfirmed:`, result.error);
    }
  }

  console.log("\n================================================================================");
  console.log(`=== ON-CHAIN TX VERIFICATION: ${verifiedCount}/${txList.length} CONFIRMED! ===`);
  console.log("================================================================================");
}

run().catch(console.error);
