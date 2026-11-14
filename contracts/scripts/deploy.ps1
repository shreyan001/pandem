# Pandem testnet deployment script (PowerShell + near-cli-rs)
$ErrorActionPreference = "Stop"

$wasmPath = "contracts/target/near/pandem_escrow/pandem_escrow.wasm"
if (-not (Test-Path $wasmPath)) {
    Write-Error "Wasm not found at $wasmPath"
    exit 1
}

$tokenId = if ($env:TOKEN_ID) { $env:TOKEN_ID } else { "wrap.testnet" }
$randSuffix = [guid]::NewGuid().ToString().Substring(0, 8)
$escrowId = if ($env:ESCROW_ID) { $env:ESCROW_ID } else { "pandem-escrow-$randSuffix.testnet" }
$stewardId = if ($env:STEWARD_ID) { $env:STEWARD_ID } else { "pandem-steward-$randSuffix.testnet" }
$treasuryId = if ($env:TREASURY_ID) { $env:TREASURY_ID } else { "pandem-treasury-$randSuffix.testnet" }
$agentId = if ($env:AGENT_ID) { $env:AGENT_ID } else { "pandem-agent-$randSuffix.testnet" }

Write-Host "=== Pandem Testnet Deployment ==="
Write-Host "Token:    $tokenId"
Write-Host "Escrow:   $escrowId"
Write-Host "Steward:  $stewardId"
Write-Host "Treasury: $treasuryId"
Write-Host "Agent:    $agentId"
Write-Host "================================="

function Create-TestnetAccount($acc) {
    Write-Host "Creating account $acc..."
    near account create-account sponsor-by-faucet-service $acc autogenerate-new-keypair save-to-keychain network-config testnet create
}

Create-TestnetAccount $escrowId
Create-TestnetAccount $stewardId
Create-TestnetAccount $treasuryId
Create-TestnetAccount $agentId

Write-Host "Deploying contract to $escrowId..."
near contract deploy $escrowId use-file $wasmPath without-init-call network-config testnet sign-with-keychain send

Write-Host "Initializing escrow contract..."
$initArgs = "{`"owner`":`"$escrowId`",`"token_id`":`"$tokenId`",`"treasury`":`"$treasuryId`"}" -replace '"', '\"'
near contract call-function as-transaction $escrowId new json-args $initArgs prepaid-gas '100.0 Tgas' attached-deposit '0 NEAR' sign-as $escrowId network-config testnet sign-with-keychain send

Write-Host "Registering storage deposits on $tokenId..."
foreach ($acc in @($escrowId, $stewardId, $treasuryId)) {
    $depositArgs = "{`"account_id`":`"$acc`",`"registration_only`":true}" -replace '"', '\"'
    near contract call-function as-transaction $tokenId storage_deposit json-args $depositArgs prepaid-gas '50.0 Tgas' attached-deposit '0.0125 NEAR' sign-as $acc network-config testnet sign-with-keychain send
}

Write-Host "Registering demo product 1..."
$regArgs = "{`"steward`":`"$stewardId`",`"heartbeat_signer`":`"$agentId`",`"price_per_period`":`"100000000000000000000000`",`"period_ns`":300000000000,`"grace_ns`":120000000000,`"passport_root`":`"pandem-demo-passport`"}" -replace '"', '\"'
near contract call-function as-transaction $escrowId register_product json-args $regArgs prepaid-gas '50.0 Tgas' attached-deposit '0 NEAR' sign-as $escrowId network-config testnet sign-with-keychain send

Write-Host "Approving demo product 1..."
$appArgs = "{`"id`":1}" -replace '"', '\"'
near contract call-function as-transaction $escrowId approve_product json-args $appArgs prepaid-gas '50.0 Tgas' attached-deposit '0 NEAR' sign-as $stewardId network-config testnet sign-with-keychain send

$config = @{
    token_id = $tokenId
    escrow_id = $escrowId
    steward_id = $stewardId
    treasury_id = $treasuryId
    agent_id = $agentId
    product_id = 1
    price_per_period = "100000000000000000000000"
} | ConvertTo-Json

Set-Content -Path "contracts/scripts/deployed.json" -Value $config
Write-Host "✓ Deployment complete! Configuration saved to contracts/scripts/deployed.json"
