# Pandem: Comprehensive Project Report

**Project Title**: Pandem — Trust-Minimized SaaS Subscription Escrow on NEAR  
**Repository**: [github.com/shreyan001/pandem](https://github.com/shreyan001/pandem)  
**Track 1 (Primary)**: Real-World Money  
**Track 2 (Secondary)**: Privacy & Private AI  
**Deployment**: NEAR Testnet (`pandem-escrow-46cee5ca.testnet`)  
**Date**: November 14, 2026  

---

## 1. Executive Summary

Pandem solves the fundamental trust dilemma of Software-as-a-Service (SaaS) and AI agent subscriptions in Web3.

In traditional finance, SaaS subscriptions rely on centralized payment processors (e.g. Stripe) that store credit cards and give billing power entirely to the vendor. In Web3, subscriptions are typically replaced by either irreversible upfront crypto payments (which leave buyers with no recourse if the service degrades or shuts down) or custodial escrow vaults that introduce counterparty risk.

**Pandem introduces a decentralized, non-custodial subscription escrow engine natively built on NEAR Protocol.**  
Subscribers lock NEP-141 tokens (e.g., USDC or wNEAR) into a smart contract that releases funds periodically (e.g., every 14 days or monthly) across a four-way deterministic split (47.5% Steward, 30.0% Ops Reserve, 20.0% Contingency Buffer, 2.5% Protocol Treasury). Each release is strictly gated on cryptographic liveness heartbeats from an autonomous runner executing inside a Hardware Trusted Execution Environment (Intel TDX & NVIDIA NRAS TEE) on NEAR AI Cloud.

If the service fails to provide uptime, or if the steward invokes the emergency killswitch, all unreleased periods and the unused contingency buffer are instantly refundable to the subscriber with a single click.

---

## 2. Problem Statement & Market Wedge

### The SaaS Subscription Paradox
1. **The Web2 Problem**: Credit card fraud, chargeback penalties (up to $25 per dispute), cross-border payment friction (3-5% FX fees), and unilateral account terminations by banking rails.
2. **The Web3 Dilemma**:
   - *Irreversible Transfers*: If a subscriber pays for 1 year upfront and the developer abandons the project on day 15, the subscriber loses 100% of their capital.
   - *Custodial Intermediaries*: Multi-sig escrows require human governance, introducing delays, fees, and regulatory exposure.
   - *AI Agent Service Opacity*: When subscribing to autonomous AI agents, users have no cryptographic proof that their prompts and inference workloads are running confidentially on uncompromised hardware.

### Pandem's Wedge
Pandem provides **programmable consumer protection** for recurring software services:
- **No Chargebacks**: Settles natively in NEP-141 stablecoins.
- **Pro-Rata Downside Protection**: Unreleased periods remain locked in escrow until the service proves liveness for that specific window.
- **Hardware-Attested Confidentiality**: AI workloads are executed in verifiable TEE enclaves.
- **1Click Cross-Chain On-Ramp**: Subscribers from Ethereum, Solana, Base, and Arbitrum can subscribe in one transaction via NEAR Intents 1Click Defuser.

---

## 3. System Architecture & Component Interactions

```
+---------------------------------------------------------------------------------------------------+
|                                        PANDEM ARCHITECTURE                                        |
+---------------------------------------------------------------------------------------------------+

     [Cross-Chain User] (Ethereum / Solana / Base / Arbitrum)
             |
             v
     [1Click Defuser Solver] (NEAR Intents)
             |  (Cross-chain swap to USDC / wNEAR on NEAR)
             v
      [Subscriber (Alice)]
             |
             | 1. ft_transfer_call(deposit, { agreement_id, product_id, periods })
             v
+----------------------------- [pandem-escrow-46cee5ca.testnet] ----------------------------------+
|                                                                                                  |
|   - Stores Agreements & Products                                                                 |
|   - NEP-141 Receiver (ft_on_transfer)                                                            |
|   - Gated Release Logic: requires last_heartbeat_period >= period_to_release                      |
|   - 4-Way Split Engine:                                                                          |
|       * 47.5% -> Steward (Service Creator)                                                       |
|       * 30.0% -> Operational Reserve (Stage 2: Budget Contract)                                  |
|       * 20.0% -> Contingency Buffer (Refundable upon abandonment)                                |
|       *  2.5% -> Protocol Treasury                                                               |
|   - Killswitch (declare_abandoned) & Pro-Rata Refund Engine                                      |
+--------------------------------------------------------------------------------------------------+
        ^                                 ^                                       |
        | 2. Heartbeat                    | 3. Release Period                     | 4. Pro-Rata Refund
        |    (period n liveness)          |    (payout split)                     |    (unreleased + 20% buf)
        |                                 |                                       v
+-------------------------------+         |                             [Subscriber (Alice)]
|   [Autonomous Agent Runner]   |---------+                             Refund: 0.22 wNEAR
|   (NEAR AI Cloud TEE Enclave) |
|   - Intel TDX Remote Quote    |
|   - NVIDIA NRAS Token (H100)  |
|   - Scoped Function-Call Key  |
+-------------------------------+
```

---

## 4. Milestone-by-Milestone Verification

### Milestone M1: Project Scaffolding
- **Objective**: Establish production monorepo structure, TypeScript tooling, and Cargo configuration.
- **Artifacts**: Root workspace configuration (`package.json`), TypeScript packages (`shared`, `agent`, `web`), Rust workspace (`contracts/Cargo.toml`, `contracts/escrow/Cargo.toml`).
- **Verification**: `npm run typecheck` passed with 0 errors.

### Decision Point ⛔ DP-1: Protocol Stage 1 Defaults
- **Objective**: Formalize economic parameters before deploying contracts.
- **Certified Parameters**:
  - Minimum agreement duration: 3 periods $\times$ 14 days = 42 days.
  - Protocol Fee: 2.5% (`25 / 1000`).
  - Operational Reserve: 30.0% (`300 / 1000`).
  - Contingency Buffer: 20.0% (`200 / 1000`).
  - Steward Direct Share: 47.5% (`steward_share = period_amount - fee - ops - contingency`).

### Milestone M2: Escrow Smart Contract Core
- **Objective**: Implement native NEAR Rust contract meeting `docs/TECH-SPEC.md` §3 and `near-contract-audit` standards.
- **Code**: `contracts/escrow/src/lib.rs`.
- **Key Methods**:
  - `register_product`: Steward registers product specs and pricing.
  - `approve_product`: Governance approves product for storefront.
  - `ft_on_transfer`: Handles incoming NEP-141 deposits, validates sender, parses `SubscribeMsg`, and cleanly refunds invalid payloads without panic.
  - `heartbeat`: Restricted to authorized agent; advances verifiable period liveness.
  - `release_period`: Releases single period funds to steward, treasury, and ops. Rollback state if transfer fails.
  - `declare_abandoned`: Steward killswitch marking agreement abandoned.
  - `claim_refund`: Calculates pro-rata unreleased balance plus unused contingency buffer.
- **Verification**: 7/7 unit tests passing in 0.32s; compiled to 197.2 KB Wasm via `cargo near build non-reproducible-wasm`.

### Milestone M3: Storefront & Subscription UI
- **Objective**: Next.js 14 App Router client with responsive design and wallet integration.
- **Code**: `web/src/context/NearWalletContext.tsx`, `web/src/components/CatalogCard.tsx`, `web/src/components/SubscribeModal.tsx`.
- **Features**: Live NEP-141 storage deposit detection, interactive subscription duration slider, and live 4-way split breakdown preview before signing.

### Milestone M4: Testnet Deployment & Scripted Lifecycle Verification
- **Objective**: End-to-end deployment to NEAR testnet with automated bash/PowerShell verification scripts.
- **Contract Account**: `pandem-escrow-46cee5ca.testnet`.
- **Executed Lifecycle Receipts**:
  - Deploy & Init: [Tx: 88Ms1iCu...](https://explorer.testnet.near.org/transactions/88Ms1iCuq3uC7qbNfWm7wgQ4uQd5icUAb1eSac3KAtts)
  - NEP-141 Storage Registration: [Tx: Dp2gMwqF...](https://explorer.testnet.near.org/transactions/Dp2gMwqF2wT5pa8QCKHpVGM6FdbdDiyYB1sdink3SJHo)
  - Subscribe Deposit (0.3 wNEAR): [Tx: 5XnsktfXTa...](https://explorer.testnet.near.org/transactions/5XnsktfXTa6Df8NrghXAiEfUUeGjpy5Gy7KK7oF5J3Fc)
  - Agent Heartbeat: [Tx: C9eRiuYd...](https://explorer.testnet.near.org/transactions/C9eRiuYdcjeGwAonoNjt3JfYozAdC9ya7nVDwg2HLcBb)
  - Period Release (0.0475 wNEAR to steward): [Tx: AyfiTDb2...](https://explorer.testnet.near.org/transactions/AyfiTDb2PVWL3QeBypyDTbFGttvLRpS5cUs2R9R7m9fc)
  - Steward Killswitch: [Tx: CxgAEmPT...](https://explorer.testnet.near.org/transactions/CxgAEmPTJNSYd5pGzaQr57dR2DVqJge32NmiJCuiBpLE)
  - Refund Claim (0.22 wNEAR returned to subscriber): [Tx: 5vL5sXN1...](https://explorer.testnet.near.org/transactions/5vL5sXN1eutgZcBaBbJFHMkayjRJdBSPNzU8E7QKYgRk)

### Milestone M5: Agent Runner & Hardware TEE Attestation
- **Objective**: Autonomous agent runner with function-call access key and cryptographic hardware TEE verification.
- **Code**: `agent/src/runner.ts`, `agent/src/attestation.ts`, `agent/src/chat.ts`.
- **Attestation Features**: Fetches Intel TDX and NVIDIA NRAS remote quote for `Qwen/Qwen3.8-27B` on NEAR AI Cloud, verifying cryptographic signature against fresh nonces.

### Milestone M6: End-to-End Application Routing & Dashboards
- **Objective**: Complete user surfaces for all three participants (Subscriber, Steward, Agent Enclave).
- **Pages**:
  - `/me`: Subscriber agreements view, period progress bars, and pro-rata refund button.
  - `/steward`: Provider dashboard, operational reserve balances, and `declare_abandoned` killswitch button.
  - `/agent`: Confidential AI enclave dashboard, runner health monitor, and hardware attestation viewer.

### Milestone M7: Stage 2 Architecture, 1Click On-Ramp & Component Testbed
- **Objective**: Formalize multi-stage evolution, integrate cross-chain edge on-ramp, and build interactive design system testbed.
- **Deliverables**:
  - `docs/STAGE-2.md`: 707-line architecture specification for `contracts/budget`, yearly agreements (12 monthly periods), 7-day grace windows, and dynamic inference dampeners.
  - `web/src/app/onramp/page.tsx` & `OnrampQuotePanel.tsx`: 1Click Defuser dry-quote simulator for cross-chain swaps (ETH, SOL, Base, Arb, BTC to USDC on NEAR).
  - `web/src/app/components/page.tsx`: Interactive testbed showcasing every UI primitive, button states, split calculators, and modals.
  - `web/src/components/Navbar.tsx`: Responsive navigation with 1-click testnet persona switching.

### Milestone M8: Project Reports & Submission Dossier
- **Objective**: Consolidate complete project report, hackathon submission documentation, video script, and architectural comparison in `reports/`.

---

## 5. Security & Contract Audit Matrix

| Audit Check | Status | Verification Detail |
|---|---|---|
| **Reentrancy Protection** | **PASSED** | NEAR async model eliminates synchronous EVM reentrancy. State is mutated before promise dispatch. |
| **Promise Rollback Handling** | **PASSED** | Implemented `#[private]` callback `on_release_transfer` that decrements `released_periods` if the token transfer promise fails. |
| **NEP-141 Token Authentication** | **PASSED** | `ft_on_transfer` asserts `env::predecessor_account_id() == self.token_id`. |
| **No-Panic on Bad Transfer Msg** | **PASSED** | If JSON parsing fails in `ft_on_transfer`, the contract returns `PromiseOrValue::Value(amount)`, cleanly refunding all funds rather than locking them. |
| **Arithmetic Overflow / Rounding** | **PASSED** | Integer division with explicit remainder preservation (`steward_share = period - fee - ops - contingency`). |
| **Access Control** | **PASSED** | `heartbeat` requires registered agent account; `declare_abandoned` requires product steward; `withdraw_fees` requires protocol owner. |
| **Storage Deposit Readiness** | **PASSED** | Escrow, steward, and subscribers verify 0.0125 NEAR storage registration before executing `ft_transfer`. |

---

## 6. Hackathon Track Alignment

### Primary Track: Real-World Money
- Solves recurring payments—the largest missing building block in Web3 commerce.
- Settles in real fiat-pegged stablecoins (USDC) on NEAR.
- 1Click Defuser on-ramp allows mainstream users from any chain to subscribe without manual bridging or gas token acquisition.
- Programmable consumer protection: guarantees pro-rata refunds without centralized credit card chargebacks.

### Secondary Track: Privacy & Private AI
- Confidential agent workloads running in Intel TDX / NVIDIA NRAS Hardware TEEs on NEAR AI Cloud.
- Cryptographic attestation verification ensuring models and user prompts are never logged or inspected by third parties.
- Enclave-gated heartbeats: funds are only unlocked if the private AI agent verifies hardware integrity.
