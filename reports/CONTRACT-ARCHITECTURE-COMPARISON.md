# NEAR Rust Contracts vs Traditional EVM vs "Rush" Hackathon Contracts

This report documents the architectural, cryptographic, and economic nuances of developing native NEAR Protocol smart contracts in Rust, contrasting them with traditional EVM (Solidity) contracts and detailing why "rush" hackathon contracts fail in real-world decentralized subscription models.

---

## 1. High-Level Architectural Comparison

| Dimension | Traditional EVM (Solidity) | "Rush" Hackathon Contract | Native NEAR Escrow (Pandem) |
|---|---|---|---|
| **Execution Model** | **Synchronous**: Reversible atomic execution within a single block. High risk of reentrancy. | **Naive Synchronous**: Treats async calls as immediate, breaks when promises resolve later. | **Asynchronous**: Cross-contract calls return promises. State changes must be committed or rolled back via `#[private]` callbacks. |
| **Token Transfer Pattern** | **ERC-20 `approve` + `transferFrom`**: 2 separate transactions, awkward UX, infinite approval vulnerabilities. | **Hardcoded Transfers**: Naive transfer calls without checking sender or storage balances. | **NEP-141 `ft_transfer_call` + `ft_on_transfer`**: 1 atomic UX action. Unused tokens returned directly via `U128` return value. |
| **State Storage Economics** | **Gas per SLOAD/SSTORE**: State is permanently stored; users pay transaction gas once. | **Ignored Storage**: Omits storage deposits, leading to silent transaction panics when transferring tokens. | **Storage Staking**: Accounts must hold `storage_deposit` (0.0125 NEAR on `wrap.testnet`). Pandem checks and funds receiver storage beforehand. |
| **Key Permissioning** | **All-or-Nothing Private Key**: Signer has complete control over wallet and all contract approvals. | **Exposed Admin Key**: Hardcoded root keys in runner scripts, causing catastrophic credential leaks. | **Function-Call Access Keys**: Agent enclaves hold scoped keys restricted *only* to `heartbeat`, `release_period`, and `claim_refund` with zero deposit allowance. |
| **Split & Fee Arithmetic** | **Solidity Floating/Integer**: Often leaves rounding dust or overflows uint256 if not using SafeMath. | **Truncated Division**: Loses fractional satoshis/yocto to rounding error or division by zero. | **Zero-Leak Integer Math**: 2.5% protocol fee, 30.0% ops, 20.0% contingency, and 47.5% steward calculated with remainder assignment. |
| **Liveness Verification** | **Oracle Or Push Heartbeat**: Relies on centralized off-chain keepers (Chainlink Automation, Gelato). | **No Verification**: Timers run purely on block timestamps without validating AI service availability. | **Confidential TEE Attestation**: Intel TDX & NVIDIA NRAS remote quotes bound to cryptographic nonces, verifying uncompromised AI execution. |

---

## 2. Deep Dive: Why Native NEAR Differs from EVM

### 2.1 Asynchronous Execution & Callback Rollbacks

On Ethereum, contract `A` calls contract `B` synchronously. If `B` fails, the entire transaction reverts automatically.  
On NEAR, cross-contract calls are **asynchronous promises**. When contract `A` calls `wrap.testnet` via `ext_ft::ext(token).ft_transfer(...)`:
1. Contract `A` dispatches the promise and immediately finishes its execution turn.
2. In a future block, `wrap.testnet` executes the transfer.
3. If Contract `A` specified a callback (`#[private] pub fn on_ft_transfer(...)`), Contract `A` executes again to handle the outcome.

#### The "Rush" Contract Failure
Hackathon contracts frequently mutate state *inside* the callback, or worse, mutate state before the promise and forget to implement a callback. If the token transfer fails (e.g. receiver lacks storage deposit or is locked), the escrow assumes funds were sent, creating an irrecoverable state divergence.

#### Pandem's Hardened Solution
Pandem mutates agreement state to advance the release counter, dispatches the `ft_transfer`, and attaches a `#[private]` callback `on_release_transfer`:
```rust
#[private]
pub fn on_release_transfer(
    &mut self,
    agreement_id: AgreementId,
    period_to_release: u32,
    #[callback_result] result: Result<(), near_sdk::PromiseError>,
) {
    if result.is_err() {
        // Roll back state: decrement released_periods so the period can be retried or refunded
        if let Some(mut agr) = self.agreements.get(&agreement_id) {
            agr.released_periods = period_to_release.saturating_sub(1);
            self.agreements.insert(&agreement_id, &agr);
            env::log_str(&format!("Transfer failed for agreement {}. Rolled back release.", agreement_id));
        }
    }
}
```

---

### 2.2 NEP-141 Storage Deposit Requirement

On NEAR, NEP-141 fungible tokens (like USDC or wNEAR) require accounts to register for storage by depositing NEAR before they can receive tokens.
- Minimum storage deposit: `0.0125 NEAR` (12500000000000000000000 yoctoNEAR).
- If an escrow tries to pay a steward or subscriber who has never touched the token, the transaction fails with:
  `The account is not registered to receive this token`.

#### Pandem's Implementation
Pandem contracts enforce storage readiness checks in both automated testnet deployment scripts (`contracts/scripts/deploy.ps1`) and the web client modal (`web/src/components/SubscribeModal.tsx`), warning users and executing `storage_deposit` before `ft_transfer_call`.

---

### 2.3 The NEP-141 Receiver Interface (`ft_on_transfer`)

In Ethereum, a user must first call `token.approve(escrow, amount)`, wait for confirmation, then call `escrow.subscribe(amount)`.  
In NEAR, the subscriber calls `token.ft_transfer_call(escrow, amount, msg)` in a single transaction.

#### Critical Security Invariants in `ft_on_transfer`:
1. **Predecessor Validation**: Must verify `env::predecessor_account_id() == self.token_id`. If anyone else calls `ft_on_transfer`, it must panic.
2. **Never Panic on Bad Msg**: If the subscriber passes invalid JSON in `msg`, the contract **must not panic**. If it panics, the token contract assumes all tokens were consumed and burns them or traps them! Instead, the contract logs an error and returns the full `amount` as `U128(amount)`, cleanly returning funds to the sender.
3. **Return Unused Balance**: The return value of `ft_on_transfer` tells the NEP-141 contract how many tokens were *not* used. Pandem returns `U128(0)` on success (keeping the exact deposit) and `U128(amount)` on error.

```rust
pub fn ft_on_transfer(&mut self, sender_id: AccountId, amount: U128, msg: String) -> PromiseOrValue<U128> {
    require!(env::predecessor_account_id() == self.token_id, "Only accepted token");
    let payload: Result<SubscribeMsg, _> = near_sdk::serde_json::from_str(&msg);
    match payload {
        Ok(data) => {
            self.internal_subscribe(sender_id, amount.0, data);
            PromiseOrValue::Value(U128(0))
        }
        Err(e) => {
            env::log_str(&format!("Invalid msg payload: {}. Refunding full deposit.", e));
            PromiseOrValue::Value(amount) // Full refund
        }
    }
}
```

---

### 2.4 Autonomous Agent Execution via Scoped Function-Call Keys

Traditional smart contracts require a bot to hold an externally owned account (EOA) with full private key permissions, spending gas and risking wallet drain if compromised.

On NEAR:
- An account can create a **Function-Call Access Key** with a specific allowance and a strict whitelist of callable methods:
  - Whitelisted methods: `["heartbeat", "release_period", "claim_refund"]`
  - Allowance: `0.25 NEAR`
  - Cannot attach deposits (0 deposit allowed).
- Because `ft_transfer` requires 1 yoctoNEAR deposit, how does the agent release funds?
  **The escrow contract itself attaches the 1 yoctoNEAR deposit from its own balance!** The caller's key only pays the few Tgas needed to trigger the method.
- This enables autonomous, decentralized AI enclaves (e.g. running inside confidential compute on NEAR AI Cloud) to service subscriptions securely without human intervention.

---

### 2.5 Zero-Leak Integer Math

In subscription escrows, funds are divided across 4 distinct stakeholders:
- Protocol Treasury: `2.5%`
- Operational Reserve: `30.0%`
- Contingency Buffer: `20.0%`
- Service Steward: `47.5%`

Using naive floating-point division in Solidity or Rust causes fractional rounding errors (e.g. `amount * 25 / 1000`), leaking tokens over hundreds of period releases.

Pandem implements mathematically proven zero-leak remainder preservation:
```rust
let protocol_fee = (period_amount * 25) / 1000;
let ops_reserve = (period_amount * 300) / 1000;
let contingency = (period_amount * 200) / 1000;
// Steward receives the exact remaining balance, guaranteeing sum == period_amount
let steward_share = period_amount - protocol_fee - ops_reserve - contingency;
```
Unit test `test_split_calculation` validates that for every arbitrary amount (including primes and small deposits), the sum of the components equals the exact period amount down to 1 single yocto.

---

## 3. Summary: Why This Report & Workflow Matters

Hackathon submissions frequently struggle when judges look under the hood: contracts are often brittle, lack automated tests, panic on edge cases, or skip the unique async properties of the underlying chain.

By creating this structured workflow, Pandem establishes:
1. **Audit-Ready Architecture**: Every contract method conforms to the `near-contract-audit` safety checklist.
2. **Deterministic Reproducibility**: Deployable via standardized PowerShell and Bash scripts with verified transaction receipts.
3. **Decentralized AI Integration**: Real TEE hardware attestation (Intel TDX & NVIDIA NRAS) rather than simulated prompt engineering.
4. **Clean Handoff & Governance**: Complete transparency for developers, judges, and future maintainers.
