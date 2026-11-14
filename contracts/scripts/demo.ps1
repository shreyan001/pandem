# Pandem testnet demo script (PowerShell + near-cli-rs)
$ErrorActionPreference = "Stop"

$deployedFile = "contracts/scripts/deployed.json"
if (-not (Test-Path $deployedFile)) {
    Write-Error "$deployedFile not found. Run deploy script first."
    exit 1
}

$cfg = Get-Content $deployedFile | ConvertFrom-Json
$tokenId = $cfg.token_id
$escrowId = $cfg.escrow_id
$stewardId = $cfg.steward_id
$treasuryId = $cfg.treasury_id
$agentId = $cfg.agent_id
$productId = $cfg.product_id

$randSuffix = [guid]::NewGuid().ToString().Substring(0, 8)
$aliceId = if ($env:ALICE_ID) { $env:ALICE_ID } else { "pandem-alice-$randSuffix.testnet" }
$tmpDir = Join-Path $env:TEMP "pandem-demo-$randSuffix"
New-Item -ItemType Directory -Force -Path $tmpDir | Out-Null

Write-Host "=== Pandem Testnet End-to-End Demo ==="
Write-Host "Escrow:     $escrowId"
Write-Host "Subscriber: $aliceId"
Write-Host "Steward:    $stewardId"
Write-Host "Agent:      $agentId"
Write-Host "======================================"

Write-Host "Creating subscriber $aliceId..."
near account create-account sponsor-by-faucet-service $aliceId autogenerate-new-keypair save-to-keychain network-config testnet create
Start-Sleep -Seconds 2

Write-Host "Registering storage deposit for subscriber..."
$storageFile = Join-Path $tmpDir "storage.json"
Set-Content -Path $storageFile -Value "{`"account_id`":`"$aliceId`",`"registration_only`":true}"
near contract call-function as-transaction $tokenId storage_deposit file-args $storageFile prepaid-gas '50.0 Tgas' attached-deposit '0.0125 NEAR' sign-as $aliceId network-config testnet sign-with-keychain send

Write-Host "Wrapping 0.5 NEAR into wNEAR..."
$emptyFile = Join-Path $tmpDir "empty.json"
Set-Content -Path $emptyFile -Value "{}"
near contract call-function as-transaction $tokenId near_deposit file-args $emptyFile prepaid-gas '50.0 Tgas' attached-deposit '0.5 NEAR' sign-as $aliceId network-config testnet sign-with-keychain send

$balAliceFile = Join-Path $tmpDir "bal_alice.json"
$balStewardFile = Join-Path $tmpDir "bal_steward.json"
$balEscrowFile = Join-Path $tmpDir "bal_escrow.json"
Set-Content -Path $balAliceFile -Value "{`"account_id`":`"$aliceId`"}"
Set-Content -Path $balStewardFile -Value "{`"account_id`":`"$stewardId`"}"
Set-Content -Path $balEscrowFile -Value "{`"account_id`":`"$escrowId`"}"

Write-Host "--- Initial wNEAR Balances ---"
Write-Host "Alice:   $(near contract call-function as-read-only $tokenId ft_balance_of file-args $balAliceFile network-config testnet now)"
Write-Host "Steward: $(near contract call-function as-read-only $tokenId ft_balance_of file-args $balStewardFile network-config testnet now)"
Write-Host "Escrow:  $(near contract call-function as-read-only $tokenId ft_balance_of file-args $balEscrowFile network-config testnet now)"

Write-Host "Subscribing (0.3 wNEAR for 3 periods)..."
$subFile = Join-Path $tmpDir "subscribe.json"
$subPayload = @{
    receiver_id = $escrowId
    amount = "300000000000000000000000"
    msg = "{`"product_id`":`"$productId`",`"periods`":3}"
} | ConvertTo-Json
Set-Content -Path $subFile -Value $subPayload
near contract call-function as-transaction $tokenId ft_transfer_call file-args $subFile prepaid-gas '100.0 Tgas' attached-deposit '1 yoctoNEAR' sign-as $aliceId network-config testnet sign-with-keychain send

Write-Host "Agent sending heartbeat for period..."
$hbFile = Join-Path $tmpDir "hb.json"
Set-Content -Path $hbFile -Value "{`"product_id`":$productId,`"period`":1}"
near contract call-function as-transaction $escrowId heartbeat file-args $hbFile prepaid-gas '50.0 Tgas' attached-deposit '0 NEAR' sign-as $agentId network-config testnet sign-with-keychain send

Write-Host "Releasing period 1 for agreement 1..."
$relFile = Join-Path $tmpDir "rel.json"
Set-Content -Path $relFile -Value "{`"agreement_id`":1}"
near contract call-function as-transaction $escrowId release_period file-args $relFile prepaid-gas '100.0 Tgas' attached-deposit '0 NEAR' sign-as $aliceId network-config testnet sign-with-keychain send

Write-Host "--- Balances after Period 1 Release ---"
Write-Host "Alice:   $(near contract call-function as-read-only $tokenId ft_balance_of file-args $balAliceFile network-config testnet now)"
Write-Host "Steward: $(near contract call-function as-read-only $tokenId ft_balance_of file-args $balStewardFile network-config testnet now)"
Write-Host "Escrow:  $(near contract call-function as-read-only $tokenId ft_balance_of file-args $balEscrowFile network-config testnet now)"

Write-Host "Steward declaring product abandoned (killswitch)..."
$killFile = Join-Path $tmpDir "kill.json"
Set-Content -Path $killFile -Value "{`"product_id`":$productId,`"reason`":`"Provider service shutdown demo`"}"
near contract call-function as-transaction $escrowId declare_abandoned file-args $killFile prepaid-gas '50.0 Tgas' attached-deposit '0 NEAR' sign-as $stewardId network-config testnet sign-with-keychain send

Write-Host "Alice claiming refund for agreement 1..."
near contract call-function as-transaction $escrowId claim_refund file-args $relFile prepaid-gas '100.0 Tgas' attached-deposit '0 NEAR' sign-as $aliceId network-config testnet sign-with-keychain send

Write-Host "--- Final Balances after Refund ---"
Write-Host "Alice:   $(near contract call-function as-read-only $tokenId ft_balance_of file-args $balAliceFile network-config testnet now)"
Write-Host "Steward: $(near contract call-function as-read-only $tokenId ft_balance_of file-args $balStewardFile network-config testnet now)"
Write-Host "Escrow:  $(near contract call-function as-read-only $tokenId ft_balance_of file-args $balEscrowFile network-config testnet now)"

Remove-Item -Recurse -Force $tmpDir -ErrorAction SilentlyContinue
Write-Host "✓ Demo completed successfully!"
