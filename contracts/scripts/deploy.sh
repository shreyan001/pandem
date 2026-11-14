#!/usr/bin/env bash
set -euo pipefail

# Pandem testnet deployment script (near-cli-rs 0.31.1)
# Deploys Escrow contract, configures token and accounts, registers and approves demo product.

WASM_PATH="contracts/target/near/pandem_escrow/pandem_escrow.wasm"
if [ ! -f "$WASM_PATH" ]; then
    echo "Error: Wasm not found at $WASM_PATH. Run 'cargo near build non-reproducible-wasm --no-abi' first."
    exit 1
fi

TOKEN_ID="${TOKEN_ID:-wrap.testnet}"
RAND_SUFFIX=$(date +%s | cut -c 6-10)
ESCROW_ID="${ESCROW_ID:-pandem-escrow-${RAND_SUFFIX}.testnet}"
STEWARD_ID="${STEWARD_ID:-pandem-steward-${RAND_SUFFIX}.testnet}"
TREASURY_ID="${TREASURY_ID:-pandem-treasury-${RAND_SUFFIX}.testnet}"
AGENT_ID="${AGENT_ID:-pandem-agent-${RAND_SUFFIX}.testnet}"

echo "=== Pandem Testnet Deployment ==="
echo "Token:    $TOKEN_ID"
echo "Escrow:   $ESCROW_ID"
echo "Steward:  $STEWARD_ID"
echo "Treasury: $TREASURY_ID"
echo "Agent:    $AGENT_ID"
echo "================================="

create_account() {
    local acc="$1"
    echo "Creating account $acc..."
    near account create-account sponsor-by-faucet-service "$acc" autogenerate-new-keypair save-to-keychain network-config testnet create
}

# 1. Create accounts via testnet faucet
create_account "$ESCROW_ID"
create_account "$STEWARD_ID"
create_account "$TREASURY_ID"
create_account "$AGENT_ID"

# 2. Deploy Escrow Contract Wasm
echo "Deploying contract to $ESCROW_ID..."
near contract deploy "$ESCROW_ID" use-file "$WASM_PATH" without-init-call network-config testnet sign-with-keychain send

# 3. Initialize Escrow Contract
echo "Initializing escrow contract..."
near contract call-function as-transaction "$ESCROW_ID" new \
    json-args "{\"owner\":\"$ESCROW_ID\",\"token_id\":\"$TOKEN_ID\",\"treasury\":\"$TREASURY_ID\"}" \
    prepaid-gas '100.0 Tgas' attached-deposit '0 NEAR' \
    sign-as "$ESCROW_ID" network-config testnet sign-with-keychain send

# 4. Register storage deposits on NEP-141 token
echo "Registering storage deposits on $TOKEN_ID..."
for acc in "$ESCROW_ID" "$STEWARD_ID" "$TREASURY_ID"; do
    near contract call-function as-transaction "$TOKEN_ID" storage_deposit \
        json-args "{\"account_id\":\"$acc\",\"registration_only\":true}" \
        prepaid-gas '50.0 Tgas' attached-deposit '0.0125 NEAR' \
        sign-as "$acc" network-config testnet sign-with-keychain send
done

# 5. Register demo product (id=1)
# Price: 0.1 wNEAR (100000000000000000000000 yocto)
# Period: 5 mins (300000000000 ns), Grace: 2 mins (120000000000 ns)
echo "Registering demo product 1..."
near contract call-function as-transaction "$ESCROW_ID" register_product \
    json-args "{\"steward\":\"$STEWARD_ID\",\"heartbeat_signer\":\"$AGENT_ID\",\"price_per_period\":\"100000000000000000000000\",\"period_ns\":300000000000,\"grace_ns\":120000000000,\"passport_root\":\"pandem-demo-passport\"}" \
    prepaid-gas '50.0 Tgas' attached-deposit '0 NEAR' \
    sign-as "$ESCROW_ID" network-config testnet sign-with-keychain send

# 6. Approve demo product 1 by steward
echo "Approving demo product 1..."
near contract call-function as-transaction "$ESCROW_ID" approve_product \
    json-args "{\"id\":1}" \
    prepaid-gas '50.0 Tgas' attached-deposit '0 NEAR' \
    sign-as "$STEWARD_ID" network-config testnet sign-with-keychain send

# 7. Write deployment config
cat <<EOF > contracts/scripts/deployed.json
{
  "token_id": "$TOKEN_ID",
  "escrow_id": "$ESCROW_ID",
  "steward_id": "$STEWARD_ID",
  "treasury_id": "$TREASURY_ID",
  "agent_id": "$AGENT_ID",
  "product_id": 1,
  "price_per_period": "100000000000000000000000"
}
EOF

echo "✓ Deployment complete! Configuration saved to contracts/scripts/deployed.json"
