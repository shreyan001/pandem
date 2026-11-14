#!/usr/bin/env bash
# Pandem Multi-Contract Testnet Deployment Script (Bash)
set -euo pipefail

echo "=== Pandem Multi-Contract Deployment to NEAR Testnet ==="

SUFFIX=$(head -c 4 /dev/urandom | xxd -p)
ESCROW_ACC="pandem-escrow-${SUFFIX}.testnet"
BUDGET_ACC="pandem-budget-${SUFFIX}.testnet"
REGISTRY_ACC="pandem-registry-${SUFFIX}.testnet"
STEWARD_ACC="pandem-steward-${SUFFIX}.testnet"
TREASURY_ACC="pandem-treasury-${SUFFIX}.testnet"
AGENT_ACC="pandem-agent-${SUFFIX}.testnet"
TOKEN_ID="wrap.testnet"

echo "Generated accounts for session (${SUFFIX}):"
echo "  Escrow:   ${ESCROW_ACC}"
echo "  Budget:   ${BUDGET_ACC}"
echo "  Registry: ${REGISTRY_ACC}"
echo "  Steward:  ${STEWARD_ACC}"
echo "  Treasury: ${TREASURY_ACC}"
echo "  Agent:    ${AGENT_ACC}"
echo "  Token:    ${TOKEN_ID}"

create_faucet_acc() {
    local acc="$1"
    echo "Creating faucet account: ${acc}..."
    near account create-account sponsor-by-faucet-service "${acc}" autogenerate-new-keypair save-to-keychain network-config testnet create
}

create_faucet_acc "${ESCROW_ACC}"
create_faucet_acc "${BUDGET_ACC}"
create_faucet_acc "${REGISTRY_ACC}"
create_faucet_acc "${STEWARD_ACC}"
create_faucet_acc "${TREASURY_ACC}"
create_faucet_acc "${AGENT_ACC}"

ESCROW_WASM="contracts/target/wasm32-unknown-unknown/release/pandem_escrow.wasm"
BUDGET_WASM="contracts/target/wasm32-unknown-unknown/release/pandem_budget.wasm"
REGISTRY_WASM="contracts/target/wasm32-unknown-unknown/release/pandem_registry.wasm"

# 1. Escrow
echo "Deploying Escrow..."
near contract deploy "${ESCROW_ACC}" use-file "${ESCROW_WASM}" without-init-call network-config testnet sign-with-keychain send
near contract call-function as-transaction "${ESCROW_ACC}" new json-args "{\"token_id\":\"${TOKEN_ID}\",\"treasury_id\":\"${TREASURY_ACC}\"}" prepaid-gas "30.0 Tgas" attached-deposit "0 NEAR" sign-as "${ESCROW_ACC}" network-config testnet sign-with-keychain send

# 2. Budget
echo "Deploying Budget..."
near contract deploy "${BUDGET_ACC}" use-file "${BUDGET_WASM}" without-init-call network-config testnet sign-with-keychain send
near contract call-function as-transaction "${BUDGET_ACC}" new json-args "{\"escrow_contract\":\"${ESCROW_ACC}\",\"token_id\":\"${TOKEN_ID}\"}" prepaid-gas "30.0 Tgas" attached-deposit "0 NEAR" sign-as "${BUDGET_ACC}" network-config testnet sign-with-keychain send

# 3. Registry
echo "Deploying Registry..."
near contract deploy "${REGISTRY_ACC}" use-file "${REGISTRY_WASM}" without-init-call network-config testnet sign-with-keychain send
near contract call-function as-transaction "${REGISTRY_ACC}" new json-args "{\"escrow_contract\":\"${ESCROW_ACC}\",\"budget_contract\":\"${BUDGET_ACC}\"}" prepaid-gas "30.0 Tgas" attached-deposit "0 NEAR" sign-as "${REGISTRY_ACC}" network-config testnet sign-with-keychain send

# 4. Storage deposits
register_storage() {
    local acc="$1"
    echo "Registering storage on ${TOKEN_ID} for ${acc}..."
    near contract call-function as-transaction "${TOKEN_ID}" storage_deposit json-args "{\"account_id\":\"${acc}\",\"registration_only\":true}" prepaid-gas "30.0 Tgas" attached-deposit "0.0125 NEAR" sign-as "${acc}" network-config testnet sign-with-keychain send
}

register_storage "${ESCROW_ACC}"
register_storage "${BUDGET_ACC}"
register_storage "${STEWARD_ACC}"
register_storage "${TREASURY_ACC}"

cat <<EOF > contracts/scripts/deployed.json
{
  "escrow_id": "${ESCROW_ACC}",
  "budget_id": "${BUDGET_ACC}",
  "registry_id": "${REGISTRY_ACC}",
  "steward_id": "${STEWARD_ACC}",
  "treasury_id": "${TREASURY_ACC}",
  "agent_id": "${AGENT_ACC}",
  "token_id": "${TOKEN_ID}",
  "deployed_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

echo "=== Deployment Successful ==="
