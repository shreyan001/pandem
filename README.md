# Pandem

**Decentralized SaaS & AI Agent Subscription Escrow on NEAR Protocol**

[![NEAR Testnet](https://img.shields.io/badge/NEAR-Testnet-blue?logo=near)](https://explorer.testnet.near.org/accounts/pandem-escrow-46cee5ca.testnet)
[![Contracts](https://img.shields.io/badge/Contracts-Rust%20near--sdk%205.30.1-orange?logo=rust)](contracts/)
[![Tests](https://img.shields.io/badge/Tests-23%2F23%20Passed-brightgreen)](contracts/)
[![Next.js](https://img.shields.io/badge/Next.js-16%20(React%2019)-black?logo=next.js)](web/)
[![TEE](https://img.shields.io/badge/TEE-Intel%20TDX%20%7C%20NVIDIA%20NRAS-purple)](agent/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

- **Repository**: [https://github.com/shreyan001/pandem](https://github.com/shreyan001/pandem)
- **Primary Track**: Real-World Money (`realworld`)
- **Secondary Track**: Privacy & Private AI (`privacy`)
- **Deployed Contracts (Testnet)**:
  - Escrow: [`pandem-escrow-46cee5ca.testnet`](https://explorer.testnet.near.org/accounts/pandem-escrow-46cee5ca.testnet)
  - Budget: [`pandem-budget-46cee5ca.testnet`](https://explorer.testnet.near.org/accounts/pandem-budget-46cee5ca.testnet)
  - Registry: [`pandem-registry-46cee5ca.testnet`](https://explorer.testnet.near.org/accounts/pandem-registry-46cee5ca.testnet)
  - Testnet Token: [`wrap.testnet`](https://explorer.testnet.near.org/accounts/wrap.testnet)

---

## 1. Executive Summary

Pandem solves the fundamental trust dilemma of Software-as-a-Service (SaaS) and autonomous AI agent subscriptions in Web3.

In traditional finance, recurring SaaS subscriptions rely on centralized payment processors (such as Stripe) that store credit card details, expose merchants to chargeback disputes ($15–$25 penalties), and unilaterally freeze accounts. In Web3, subscriptions have historically defaulted to irreversible upfront payments—leaving subscribers with 100% counterparty loss if a project degrades or is abandoned—or custodial multi-sigs that introduce governance delays.

**Pandem introduces a decentralized, non-custodial subscription escrow engine natively built on NEAR Protocol.**

Subscribers deposit NEP-141 tokens (USDC / wNEAR) via standard `ft_transfer_call`. The native Rust escrow contract locks the deposit and releases funds period by period (e.g. 14 days or monthly) across a deterministic 4-way split:
- **`47.5%`** to Service Steward (Developer revenue)
- **`30.0%`** to Operational Reserve (Managed by `pandem-budget` for ongoing compute & infra costs)
- **`20.0%`** to Contingency Buffer (Governed by `pandem-registry` for community proposals or 100% refund upon abandonment)
- **`2.5%`** to Protocol Treasury

Each release is strictly gated on cryptographic liveness heartbeats from an autonomous runner executing inside a Hardware Trusted Execution Environment (Intel TDX & NVIDIA NRAS TEE) on NEAR AI Cloud.

If service uptime fails or the steward triggers the killswitch (`declare_abandoned`), the subscriber can immediately claim a pro-rata refund of all unspent periods plus the unused 20% contingency buffer in a single transaction.

---

## 2. Multi-Contract Architecture

Pandem is architected as a modular suite of three native Rust smart contracts compiling to WebAssembly on NEAR:

```
+---------------------------------------------------------------------------------------------------+
|                                        PANDEM ARCHITECTURE                                        |
+---------------------------------------------------------------------------------------------------+

     [Cross-Chain User] (Ethereum / Solana / Base / Arbitrum / Bitcoin)
             |
             v
     [1Click Defuser Solver] (NEAR Intents)
             |  (Cross-chain swap to USDC / wNEAR on NEAR Testnet)
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
|   - 4-Way Deterministic Split Engine:                                                            |
|       * 47.5% -> Steward (Service Creator)                                                       |
|       * 30.0% -> Operational Reserve (Forwarded to pandem-budget)                                |
|       * 20.0% -> Contingency Buffer (Forwarded to pandem-registry pool)                          |
|       *  2.5% -> Protocol Treasury                                                               |
|   - Emergency Killswitch (declare_abandoned) & Pro-Rata Refund Engine                            |
+--------------------------------------------------------------------------------------------------+
        ^                       |                                 |                       |
        | 2. Heartbeat          | 30% Ops Stream                  | 20% Contingency       | Pro-Rata Refund
        |    (period n)         v                                 v                       v
+-----------------------+ +-----------------------------+ +-----------------------------+ [Subscriber]
| [Autonomous Agent]    | | [pandem-budget]             | | [pandem-registry]           | Refund: unreleased
| (NEAR AI Cloud TEE)   | | - Burst Draw Cap: 120%      | | - Product Hunt Leaderboard  | + 20% buffer
| - Intel TDX Quote     | | - Direct Inference Compute  | | - Composite Scoring Engine  |
| - NVIDIA NRAS Token   | |   Draws by Operator Key     | | - Waterfall Contingency Hub |
| - Scoped Function Key | | - ±15% Cost Dampener        | |   * 50% Quorum Voting       |
+-----------------------+ | - 7-Day Review Lock         | |   * 20% Max Buffer Cap      |
                          +-----------------------------+ +-----------------------------+
```

### The Smart Contracts

| Contract | Source | Testnet Account | Tests | Role & Capabilities |
|---|---|---|---|---|
| **`pandem-escrow`** | [`contracts/escrow/src/lib.rs`](contracts/escrow/src/lib.rs) | [`pandem-escrow-46cee5ca.testnet`](https://explorer.testnet.near.org/accounts/pandem-escrow-46cee5ca.testnet) | 7/7 pass | Product registry, NEP-141 `ft_on_transfer` deposit locking, 4-way split, heartbeat gating, killswitch (`declare_abandoned`), and pro-rata refunds. |
| **`pandem-budget`** | [`contracts/budget/src/lib.rs`](contracts/budget/src/lib.rs) | [`pandem-budget-46cee5ca.testnet`](https://explorer.testnet.near.org/accounts/pandem-budget-46cee5ca.testnet) | 9/9 pass | Operational budget streaming (30% share), 120% burst period draw caps, direct agent inference draws, ±15% inference cost dampener, and 7-day review lock. |
| **`pandem-registry`** | [`contracts/registry/src/lib.rs`](contracts/registry/src/lib.rs) | [`pandem-registry-46cee5ca.testnet`](https://explorer.testnet.near.org/accounts/pandem-registry-46cee5ca.testnet) | 7/7 pass | Product Hunt style directory, algorithmic composite scoring, and Waterfall Contingency Hub (proposal voting with 50% quorum, 3-day vote windows, and 20% contingency pool caps). |

**Total Test Coverage:** **23 passed, 0 failed, 0 errors** (`cd contracts && cargo test`).

---

## 3. Verifiable Testnet Explorer Receipts

Every operational state transition is deployed and verified on NEAR Testnet:

| Action / Capability | Transaction Hash / Receipt | Target / Details |
|---|---|---|
| **Escrow Contract Deploy & Init** | [`88Ms1iCuq3uC...`](https://explorer.testnet.near.org/transactions/88Ms1iCuq3uC7qbNfWm7wgQ4uQd5icUAb1eSac3KAtts) | Deployed `contracts/escrow` to `pandem-escrow-46cee5ca.testnet` |
| **Budget Contract Deploy & Init** | [`59JVrLeFwsBC...`](https://explorer.testnet.near.org/transactions/59JVrLeFwsBCQoP8YYSyY7Z8bnWWb7JBq756n5fsF1ox) | Deployed `contracts/budget` to `pandem-budget-46cee5ca.testnet` |
| **Budget Token Storage Registration** | [`5KPKY5gTdyqz...`](https://explorer.testnet.near.org/transactions/5KPKY5gTdyqza51iZ7uT9vhgrRas3CxQGqpAWA4AkXit) | Registered `pandem-budget-46cee5ca.testnet` on `wrap.testnet` |
| **Registry Contract Deploy & Init** | [`Gi6qzGSg7tjc...`](https://explorer.testnet.near.org/transactions/Gi6qzGSg7tjchAmKRhNJAfSLKTQPMHUhhh9iUeMRUmqZ) | Deployed `contracts/registry` to `pandem-registry-46cee5ca.testnet` |
| **Product Approval** | [`DMv1jw1S9tpC...`](https://explorer.testnet.near.org/transactions/DMv1jw1S9tpCJcdRfoRJf3yZbjdph1ZbGenAwtHgsjdy) | Approved product #1 (`prod-deepsearch-m4`) for subscription |
| **Subscription Deposit (`ft_transfer_call`)** | [`5XnsktfXTa6D...`](https://explorer.testnet.near.org/transactions/5XnsktfXTa6Df8NrghXAiEfUUeGjpy5Gy7KK7oF5J3Fc) | Deposited 0.3 wNEAR for 3 periods into escrow |
| **Enclave Agent Heartbeat** | [`C9eRiuYdcjeG...`](https://explorer.testnet.near.org/transactions/C9eRiuYdcjeGwAonoNjt3JfYozAdC9ya7nVDwg2HLcBb) | Cryptographic liveness heartbeat for period #1 |
| **Period 1 Fund Release** | [`AyfiTDb2PVWL...`](https://explorer.testnet.near.org/transactions/AyfiTDb2PVWL3QeBypyDTbFGttvLRpS5cUs2R9R7m9fc) | Released 0.0475 wNEAR to steward + treasury/ops |
| **Registry Product Listing #1** | [`ERa8k4ktcCNS...`](https://explorer.testnet.near.org/transactions/ERa8k4ktcCNSBSVmPnk8uh67NFutpBhQEfi29X2ujKyr) | Registered `DeepSearch AI Pro` with TEE enclave flag |
| **Contingency Reserve Update** | [`GifbYk1neaxd...`](https://explorer.testnet.near.org/transactions/GifbYk1neaxd4nVheJfYqqaozwrVx64hvnkUwcH7z17Q) | Funded contingency reserve pool to 1.0 wNEAR |
| **Contingency Proposal #1 Creation** | [`BqNZuy17iDo1...`](https://explorer.testnet.near.org/transactions/BqNZuy17iDo1PNcEvsVK21NoKuYWxXioDYKJc7Egt9Rc) | Created failover infrastructure proposal for 0.05 wNEAR |
| **Contingency Proposal #1 Vote** | [`FJvojngvT2Ed...`](https://explorer.testnet.near.org/transactions/FJvojngvT2Eddn9J74vG3qGPLBiT6HJkVNkkWToXnVaE) | Cast affirmative vote on Proposal #1 on-chain |
| **Steward Killswitch (`declare_abandoned`)** | [`CxgAEmPTJNSY...`](https://explorer.testnet.near.org/transactions/CxgAEmPTJNSYd5pGzaQr57dR2DVqJge32NmiJCuiBpLE) | Triggered emergency shutdown on agreement |
| **Subscriber Pro-Rata Refund Claim** | [`5vL5sXN1eutg...`](https://explorer.testnet.near.org/transactions/5vL5sXN1eutgZcBaBbJFHMkayjRJdBSPNzU8E7QKYgRk) | Returned 0.22 wNEAR (2 unreleased periods + 20% contingency) |

---

## 4. Key Systems & Innovations

### 1. Product Hunt Style Discovery & Composite Scoring
The storefront (`/`) features an algorithmic leaderboard:
- **Product of the Day Spotlight**: Top-ranked service highlighted with real-time stats.
- **Rank Badges**: Daily rankings (#1–#4), category tags, and interactive upvoting (`▲ 348`).
- **Deterministic Composite Score**:
  $$\text{Score} = (\text{Upvotes} \times 1.0) \times (\text{TEE\_Multiplier: } 2.0) + (\text{Heartbeat\_Streak} \times 10) + \text{TVL\_Bonus}$$
- Interactive score explainer simulation on `/` showcasing how verified TEE attestation doubles discovery weight.

### 2. Waterfall Contingency Hub & Decentralized Governance (`/governance`)
The 20% contingency buffer does not sit idle. In `pandem-registry`, subscribers govern the pool:
- **Emergency Fix Proposals**: Stewards or operators propose emergency compute failovers or bug bounties.
- **20% Cap Rule**: No single proposal can request more than 20% of the active contingency reserve.
- **Quorum & Voting Windows**: Requires 50% subscriber quorum over a 3-day voting window. If rejected or expired, funds remain protected for subscriber refunds.

### 3. Hardware TEE Attestation & Cloud Inference Payments (`/agent`)
- **Intel TDX & NVIDIA NRAS Attestation**: Verifies remote hardware quotes for `Qwen/Qwen3.8-27B` hosted on NEAR AI Cloud.
- **Autonomous Cloud Compute Billing**: The agent runner (`agent/src/cloudPayment.ts`) measures prompt/completion tokens and GPU compute time, computing exact inference cost.
- **On-Chain Budget Draws**: Automatically draws payment from `contracts/budget` using a scoped operator key, enforcing a ±15% dampener against budget spikes and generating verifiable SHA-256 cost receipts.

### 4. 1Click Cross-Chain Solver On-Ramp (`/me` & `/onramp`)
Subscribers holding native tokens on Ethereum, Solana, Arbitrum, Base, or Bitcoin can subscribe directly in one transaction. Powered by NEAR Intents 1Click Defuser, the solver swaps to USDC/wNEAR on NEAR and executes the deposit callback.

---

## 5. Milestone Delivery Summary

| Milestone | Scope | Deliverables | Verification Status |
|---|---|---|---|
| **M1** | Scaffolding & Tooling | Monorepo structure, Cargo workspace, TypeScript workspaces (`shared`, `agent`, `web`). | **Shipped** (Clean typecheck) |
| **⛔ DP-1** | Stage 1 Decision Gate | Agreement duration (3 $\times$ 14d), 4-way split (47.5 / 30 / 20 / 2.5), fee recipients. | **Approved** |
| **M2** | Escrow Contract Core | Rust contract, `ft_on_transfer`, heartbeat gating, killswitch, pro-rata refund math. | **Shipped** (7/7 tests pass) |
| **M3** | Storefront & Subscribe UI | Next.js 16 App Router, `@hot-labs/near-connect`, split slider, deposit modal. | **Shipped** (Live at localhost:3000) |
| **M4** | Testnet Deploy & Demo | Full operational lifecycle executed on NEAR Testnet (`pandem-escrow-46cee5ca.testnet`). | **Shipped** (Explorer receipts verified) |
| **M5** | Agent Runner & TEE | Autonomous runner with function key, Intel TDX / NVIDIA NRAS attestation quote viewer. | **Shipped** (Active runner daemon) |
| **M6** | Dashboards & E2E Routing | `/me` (Subscriber agreements & refunds), `/steward` (Provider controls), `/agent` (Confidential chat). | **Shipped** (Full routing live) |
| **M7** | Multi-Contract Expansion | Developed `contracts/budget` and `contracts/registry`, 1Click on-ramp panel, component testbed. | **Shipped** (All contracts compiled) |
| **M8** | Testnet Deploys, Voting & Reports | Deployed Budget & Registry to testnet, verified on-chain voting, cloud payments, and reports dossier. | **Shipped** (23/23 tests pass, clean git) |

---

## 6. Security & Contract Audit Standards

All smart contracts have been reviewed against the `near-contract-audit` checklist:
- **No Synchronous Reentrancy**: Native NEAR async promise model ensures state mutations occur before cross-contract promises are dispatched.
- **Promise Rollback Invariant**: `#[private]` callbacks (e.g. `on_release_transfer`) decrement counters and restore balances if a token transfer promise fails.
- **NEP-141 Predecessor Assertion**: `ft_on_transfer` strictly verifies `env::predecessor_account_id() == self.token_id`.
- **Zero Panic on Invalid Msg**: Malformed JSON payloads return `PromiseOrValue::Value(amount)`, safely returning 100% of the deposit to the sender rather than locking funds.
- **Integer Arithmetic Safety**: Integer division preserves exact remainders (`steward_share = period_amount - fee - ops - contingency`), preventing token leaks.
- **Strict Access Control**: `heartbeat` is locked to the registered agent account; `declare_abandoned` is locked to the product steward; `withdraw_fees` is locked to the protocol owner.
- **Storage Deposit Invariant**: Contracts verify 0.0125 NEAR NEP-141 storage registration prior to invoking transfers.

---

## 7. Quickstart (Test in Under 2 Minutes)

### Prerequisites
- Node.js 18+ and Rust 1.80+ with `wasm32-unknown-unknown` target.

### 1. Clone & Install
```bash
git clone https://github.com/shreyan001/pandem.git
cd pandem
npm install
```

### 2. Verify Smart Contract Suite (23 Tests Pass)
```bash
cd contracts
cargo test
cd ..
```

### 3. Verify TypeScript Typechecks
```bash
npm run typecheck
```

### 4. Launch Local Development Daemons
```bash
# Terminal 1: Launch Web Application
npm run dev -w web

# Terminal 2: Launch Autonomous Agent Runner Service
npm run dev -w agent
```

### 5. Interactive Pages & Workflows
Open your browser to:
- `http://localhost:3000/`: Product Hunt style leaderboard, upvoting, and composite score simulator.
- `http://localhost:3000/governance`: Waterfall Contingency Hub (active proposal voting and quorum tracking).
- `http://localhost:3000/me`: Subscriber agreement tracker, refund claims, and embedded 1Click on-ramp.
- `http://localhost:3000/steward`: Provider console, reserve telemetry, and emergency killswitch.
- `http://localhost:3000/agent`: Confidential AI chat, Intel TDX attestation quote, and cloud compute ledger.
- `http://localhost:3000/components`: Atomic design system testbed.
- `http://localhost:3000/onramp`: Standalone 1Click cross-chain solver simulator.

---

## 8. Documentation & Submission Deliverables

All detailed reports, submission dossiers, and architectural analyses are located in [`reports/`](reports/):
- **[PROJECT-REPORT.md](reports/PROJECT-REPORT.md)**: Comprehensive technical report and milestone retrospective.
- **[SUBMISSION.md](reports/SUBMISSION.md)**: Official hackathon submission dossier with track alignment and pitch copy.
- **[DEMO-VIDEO-SCRIPT.md](reports/DEMO-VIDEO-SCRIPT.md)**: Scene-by-scene 4-minute demo recording storyboard.
- **[CONTRACT-ARCHITECTURE-COMPARISON.md](reports/CONTRACT-ARCHITECTURE-COMPARISON.md)**: Technical breakdown comparing native NEAR Rust contracts vs EVM Solidity vs rush hackathon patterns.
- **[Latest Handoff Block](reports/handoffs/2026-11-14T04-05Z_full-contracts-voting-cloudpayments.md)**: Timestamped milestone audit and runtime state.

---

## 9. License

MIT License. See [LICENSE](LICENSE) for details.
