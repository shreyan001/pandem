#!/usr/bin/env bash
set -euo pipefail

# Pandem testnet demo script (near-cli-rs 0.31.1)
# Demonstrates full lifecycle: subscribe → heartbeat → release → killswitch → claim refund.

DEPLOYED_FILE="contracts/scripts/deployed.json"
if [ ! -f "$DEPLOYED_FILE" ]; then
    echo "Error: $DEPLOYED_FILE not found. Run deploy.sh first."
    exit 1
fi

TOKEN_ID=$(jq -r '.token_id' "$DEPLOYED_FILE")
ESCROW_ID=$(jq -r '.escrow_id' "$DEPLOYED_FILE")
STEWARD_ID=$(jq -r '.steward_id' "$DEPLOYED_FILE")
TREASURY_ID=$(jq -r '.treasury_id' "$DEPLOYED_FILE")
AGENT_ID=$(jq -r '.agent_id' "$DEPLOYED_FILE")
PRODUCT_ID=$(jq -r '.product_id' "$DEPLOYED_FILE")
PRICE_PER_PERIOD=$(jq -r '.price_per_period' "$DEPLOYED_FILE")

RAND_SUFFIX=$(date +%s | cut -c 6-10)
ALICE_ID="${ALICE_ID:-pandem-alice-${RAND_SUFFIX}.testnet}"
TMP_DIR=$(mktemp -d)
trap 'rm -rf "$TMP_DIR"' EXIT

echo "=== Pandem Testnet End-to-End Demo ==="
echo "Escrow:     $ESCROW_ID"
echo "Subscriber: $ALICE_ID"
echo "Steward:    $STEWARD_ID"
echo "Agent:      $AGENT_ID"
echo "======================================"

# 1. Create subscriber account
echo "Creating subscriber $ALICE_ID..."
near account create-account sponsor-by-faucet-service "$ALICE_ID" autogenerate-new-keypair save-to-keychain network-config testnet create
sleep 2

# 2. Storage deposit for subscriber on token
echo "Registering storage deposit for subscriber..."
cat <<EOF > "$TMP_DIR/storage.json"
{"account_id":"$ALICE_ID","registration_only":true}
EOF
near contract call-function as-transaction "$TOKEN_ID" storage_deposit \
    file-args "$TMP_DIR/storage.json" \
    prepaid-gas '50.0 Tgas' attached-deposit '0.0125 NEAR' \
    sign-as "$ALICE_ID" network-config testnet sign-with-keychain send

# 3. Subscriber wraps 0.5 NEAR into wNEAR
echo "Wrapping 0.5 NEAR into wNEAR..."
cat <<EOF > "$TMP_DIR/empty.json"
{}
EOF
near contract call-function as-transaction "$TOKEN_ID" near_deposit \
    file-args "$TMP_DIR/empty.json" \
    prepaid-gas '50.0 Tgas' attached-deposit '0.5 NEAR' \
    sign-as "$ALICE_ID" network-config testnet sign-with-keychain send

echo "--- Initial wNEAR Balances ---"
cat <<EOF > "$TMP_DIR/bal_alice.json"
{"account_id":"$ALICE_ID"}
EOF
cat <<EOF > "$TMP_DIR/bal_steward.json"
{"account_id":"$STEWARD_ID"}
EOF
cat <<EOF > "$TMP_DIR/bal_escrow.json"
{"account_id":"$ESCROW_ID"}
EOF
echo "Alice:   $(near contract call-function as-read-only "$TOKEN_ID" ft_balance_of file-args "$TMP_DIR/bal_alice.json" network-config testnet now)"
echo "Steward: $(near contract call-function as-read-only "$TOKEN_ID" ft_balance_of file-args "$TMP_DIR/bal_steward.json" network-config testnet now)"
echo "Escrow:  $(near contract call-function as-read-only "$TOKEN_ID" ft_balance_of file-args "$TMP_DIR/bal_escrow.json" network-config testnet now)"

# 4. Subscriber deposits 0.3 wNEAR for 3 periods via ft_transfer_call
echo "Subscribing (0.3 wNEAR for 3 periods)..."
cat <<EOF > "$TMP_DIR/subscribe.json"
{
  "receiver_id": "$ESCROW_ID",
  "amount": "300000000000000000000000",
  "msg": "{\"product_id\":\"$PRODUCT_ID\",\"periods\":3}"
}
EOF
near contract call-function as-transaction "$TOKEN_ID" ft_transfer_call \
    file-args "$TMP_DIR/subscribe.json" \
    prepaid-gas '100.0 Tgas' attached-deposit '1 yoctoNEAR' \
    sign-as "$ALICE_ID" network-config testnet sign-with-keychain send

# 5. Agent sends heartbeat
cat <<EOF > "$TMP_DIR/hb.json"
{"product_id":$PRODUCT_ID,"period":1}
EOF
echo "Agent sending heartbeat for product $PRODUCT_ID..."
near contract call-function as-transaction "$ESCROW_ID" heartbeat \
    file-args "$TMP_DIR/hb.json" \
    prepaid-gas '50.0 Tgas' attached-deposit '0 NEAR' \
    sign-as "$AGENT_ID" network-config testnet sign-with-keychain send

# 6. Release period 1
echo "Releasing period 1 for agreement 1..."
cat <<EOF > "$TMP_DIR/rel.json"
{"agreement_id":1}
EOF
near contract call-function as-transaction "$ESCROW_ID" release_period \
    file-args "$TMP_DIR/rel.json" \
    prepaid-gas '100.0 Tgas' attached-deposit '0 NEAR' \
    sign-as "$ALICE_ID" network-config testnet sign-with-keychain send

echo "--- Balances after Period 1 Release ---"
echo "Alice:   $(near contract call-function as-read-only "$TOKEN_ID" ft_balance_of file-args "$TMP_DIR/bal_alice.json" network-config testnet now)"
echo "Steward: $(near contract call-function as-read-only "$TOKEN_ID" ft_balance_of file-args "$TMP_DIR/bal_steward.json" network-config testnet now)"
echo "Escrow:  $(near contract call-function as-read-only "$TOKEN_ID" ft_balance_of file-args "$TMP_DIR/bal_escrow.json" network-config testnet now)"

# 7. Steward declares abandoned (killswitch)
echo "Steward declaring product abandoned (killswitch)..."
cat <<EOF > "$TMP_DIR/abandon.json"
{"product_id":$PRODUCT_ID,"reason":"Demo killswitch: provider service shutdown"}
EOF
near contract call-function as-transaction "$ESCROW_ID" declare_abandoned \
    file-args "$TMP_DIR/abandon.json" \
    prepaid-gas '50.0 Tgas' attached-deposit '0 NEAR' \
    sign-as "$STEWARD_ID" network-config testnet sign-with-keychain send

# 8. Alice claims refund (2 unreleased periods + contingency return)
echo "Alice claiming refund for agreement 1..."
near contract call-function as-transaction "$ESCROW_ID" claim_refund \
    file-args "$TMP_DIR/rel.json" \
    prepaid-gas '100.0 Tgas' attached-deposit '0 NEAR' \
    sign-as "$ALICE_ID" network-config testnet sign-with-keychain send

echo "--- Final Balances after Refund ---"
echo "Alice:   $(near contract call-function as-read-only "$TOKEN_ID" ft_balance_of file-args "$TMP_DIR/bal_alice.json" network-config testnet now)"
echo "Steward: $(near contract call-function as-read-only "$TOKEN_ID" ft_balance_of file-args "$TMP_DIR/bal_steward.json" network-config testnet now)"
echo "Escrow:  $(near contract call-function as-read-only "$TOKEN_ID" ft_balance_of file-args "$TMP_DIR/bal_escrow.json" network-config testnet now)"

echo "✓ Demo completed successfully!"
