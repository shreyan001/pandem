# Pandem Multi-Contract Testnet Deployment Script
# Deploys Escrow, Budget, and Registry contracts to NEAR Testnet

$ErrorActionPreference = "Stop"

Write-Host "=== Pandem Multi-Contract Deployment to NEAR Testnet ===" -ForegroundColor Cyan

# 1. Generate unique session suffix for throwaway testnet accounts
$suffix = [System.Guid]::NewGuid().ToString().Substring(0, 8)
$escrowAcc = "pandem-escrow-$suffix.testnet"
$budgetAcc = "pandem-budget-$suffix.testnet"
$registryAcc = "pandem-registry-$suffix.testnet"
$stewardAcc = "pandem-steward-$suffix.testnet"
$treasuryAcc = "pandem-treasury-$suffix.testnet"
$agentAcc = "pandem-agent-$suffix.testnet"
$tokenId = "wrap.testnet"

Write-Host "Generated accounts for deployment session ($suffix):" -ForegroundColor Yellow
Write-Host "  Escrow:   $escrowAcc"
Write-Host "  Budget:   $budgetAcc"
Write-Host "  Registry: $registryAcc"
Write-Host "  Steward:  $stewardAcc"
Write-Host "  Treasury: $treasuryAcc"
Write-Host "  Agent:    $agentAcc"
Write-Host "  Token:    $tokenId"

# 2. Helper to create faucet accounts
function Create-FaucetAccount($acc) {
    Write-Host "Creating faucet account: $acc ..."
    near account create-account sponsor-by-faucet-service $acc autogenerate-new-keypair save-to-keychain network-config testnet create
}

Create-FaucetAccount $escrowAcc
Create-FaucetAccount $budgetAcc
Create-FaucetAccount $registryAcc
Create-FaucetAccount $stewardAcc
Create-FaucetAccount $treasuryAcc
Create-FaucetAccount $agentAcc

# 3. Wasm file paths
$escrowWasm = "contracts/target/wasm32-unknown-unknown/release/pandem_escrow.wasm"
$budgetWasm = "contracts/target/wasm32-unknown-unknown/release/pandem_budget.wasm"
$registryWasm = "contracts/target/wasm32-unknown-unknown/release/pandem_registry.wasm"

# 4. Deploy and Initialize Escrow
Write-Host "Deploying Escrow Contract..." -ForegroundColor Cyan
near contract deploy $escrowAcc use-file $escrowWasm without-init-call network-config testnet sign-with-keychain send

$escrowArgsFile = [System.IO.Path]::GetTempFileName()
@{
    token_id = $tokenId
    treasury_id = $treasuryAcc
} | ConvertTo-Json | Set-Content $escrowArgsFile

near contract call-function as-transaction $escrowAcc new file-args $escrowArgsFile prepaid-gas "30.0 Tgas" attached-deposit "0 NEAR" sign-as $escrowAcc network-config testnet sign-with-keychain send
Remove-Item $escrowArgsFile

# 5. Deploy and Initialize Budget Contract
Write-Host "Deploying Budget Contract..." -ForegroundColor Cyan
near contract deploy $budgetAcc use-file $budgetWasm without-init-call network-config testnet sign-with-keychain send

$budgetArgsFile = [System.IO.Path]::GetTempFileName()
@{
    escrow_contract = $escrowAcc
    token_id = $tokenId
} | ConvertTo-Json | Set-Content $budgetArgsFile

near contract call-function as-transaction $budgetAcc new file-args $budgetArgsFile prepaid-gas "30.0 Tgas" attached-deposit "0 NEAR" sign-as $budgetAcc network-config testnet sign-with-keychain send
Remove-Item $budgetArgsFile

# 6. Deploy and Initialize Registry Contract
Write-Host "Deploying Registry Contract..." -ForegroundColor Cyan
near contract deploy $registryAcc use-file $registryWasm without-init-call network-config testnet sign-with-keychain send

$registryArgsFile = [System.IO.Path]::GetTempFileName()
@{
    escrow_contract = $escrowAcc
    budget_contract = $budgetAcc
} | ConvertTo-Json | Set-Content $registryArgsFile

near contract call-function as-transaction $registryAcc new file-args $registryArgsFile prepaid-gas "30.0 Tgas" attached-deposit "0 NEAR" sign-as $registryAcc network-config testnet sign-with-keychain send
Remove-Item $registryArgsFile

# 7. NEP-141 Storage Registration (0.0125 NEAR deposit per receiver)
function Register-Storage($acc) {
    Write-Host "Registering storage on $tokenId for $acc..."
    $stArgsFile = [System.IO.Path]::GetTempFileName()
    @{
        account_id = $acc
        registration_only = $true
    } | ConvertTo-Json | Set-Content $stArgsFile
    near contract call-function as-transaction $tokenId storage_deposit file-args $stArgsFile prepaid-gas "30.0 Tgas" attached-deposit "0.0125 NEAR" sign-as $acc network-config testnet sign-with-keychain send
    Remove-Item $stArgsFile
}

Register-Storage $escrowAcc
Register-Storage $budgetAcc
Register-Storage $stewardAcc
Register-Storage $treasuryAcc

# 8. Save deployed configuration
$deployedConfig = @{
    escrow_id = $escrowAcc
    budget_id = $budgetAcc
    registry_id = $registryAcc
    steward_id = $stewardAcc
    treasury_id = $treasuryAcc
    agent_id = $agentAcc
    token_id = $tokenId
    deployed_at = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
}
$deployedConfig | ConvertTo-Json | Set-Content "contracts/scripts/deployed.json"

Write-Host "=== Pandem Multi-Contract Suite Successfully Deployed ===" -ForegroundColor Green
Write-Host "Deployed manifest saved to contracts/scripts/deployed.json" -ForegroundColor Green
