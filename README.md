# Pandem

**Decentralized SaaS & AI Agent Subscription Escrow on NEAR Protocol**

[![NEAR Testnet](https://img.shields.io/badge/NEAR-Testnet-blue?logo=near)](https://explorer.testnet.near.org/accounts/escrow-d64-40ba.test-pandem-alice-1.testnet)
[![Contracts](https://img.shields.io/badge/Contracts-Rust%20near--sdk%205.30.1-orange?logo=rust)](contracts/)
[![Tests](https://img.shields.io/badge/Tests-46%2F46%20Passed-brightgreen)](contracts/)
[![Next.js](https://img.shields.io/badge/Next.js-16%20(React%2019)-black?logo=next.js)](web/)
[![Design System](https://img.shields.io/badge/Spectr-Sharp%20Corners-purple)](design.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

- **Repository**: [https://github.com/shreyan001/pandem](https://github.com/shreyan001/pandem)
- **Live Production App**: [https://pandem-xi.vercel.app](https://pandem-xi.vercel.app)
- **Primary Track**: Real-World Money (`realworld`)
- **Secondary Track**: Privacy & Private AI (`privacy`)
- **Deployed Contracts (NEAR Testnet)**:
  - Escrow (V2 Live): [`escrow-d64-40ba.test-pandem-alice-1.testnet`](https://explorer.testnet.near.org/accounts/escrow-d64-40ba.test-pandem-alice-1.testnet)
  - Budget: [`pandem-budget-d1-8f199e48.testnet`](https://explorer.testnet.near.org/accounts/pandem-budget-d1-8f199e48.testnet)
  - Registry: [`pandem-registry-v2-46cee5ca.testnet`](https://explorer.testnet.near.org/accounts/pandem-registry-v2-46cee5ca.testnet)
  - Testnet Token (tUSDC): [`pandem-tusdc-46cee5ca.testnet`](https://explorer.testnet.near.org/accounts/pandem-tusdc-46cee5ca.testnet)
  - Protocol Steward: [`pandem-steward-46cee5ca.testnet`](https://explorer.testnet.near.org/accounts/pandem-steward-46cee5ca.testnet)
  - Central Agent: [`pandem-agent-46cee5ca.testnet`](https://explorer.testnet.near.org/accounts/pandem-agent-46cee5ca.testnet)

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
+----------------------- [escrow-d64-40ba.test-pandem-alice-1.testnet] ----------------------------+
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
| **`pandem-escrow`** | [`contracts/escrow/src/lib.rs`](contracts/escrow/src/lib.rs) | [`escrow-d64-40ba.test-pandem-alice-1.testnet`](https://explorer.testnet.near.org/accounts/escrow-d64-40ba.test-pandem-alice-1.testnet) | 15/15 pass | 12 product listings, graded tiers (Free/Pro/Max), yearly billing discounts (12 mo billed as 10), prorated upgrades, renew, cancel with immediate future-period refund, automated 30% ops forwarding to budget, NEP-141 `ft_on_transfer` deposit locking on 6-decimal tUSDC, 4-way deterministic split, heartbeat gating, killswitch (`declare_abandoned`), and pro-rata refunds. |
| **`pandem-budget`** | [`contracts/budget/src/lib.rs`](contracts/budget/src/lib.rs) | [`pandem-budget-d1-8f199e48.testnet`](https://explorer.testnet.near.org/accounts/pandem-budget-d1-8f199e48.testnet) | 9/9 pass | Operational budget streaming (30% share), period draw caps, direct agent inference draws, and on-chain telemetry. |
| **`pandem-registry`** | [`contracts/registry/src/lib.rs`](contracts/registry/src/lib.rs) | [`pandem-registry-v2-46cee5ca.testnet`](https://explorer.testnet.near.org/accounts/pandem-registry-v2-46cee5ca.testnet) | 9/9 pass | 12 privacy/AI SaaS directory listings, algorithmic composite scoring, and Waterfall Contingency Hub. |
| **`pandem-mock-tusdc`** | [`contracts/mock_tusdc/src/lib.rs`](contracts/mock_tusdc/src/lib.rs) | [`pandem-tusdc-46cee5ca.testnet`](https://explorer.testnet.near.org/accounts/pandem-tusdc-46cee5ca.testnet) | 5/5 pass | Mock NEP-141 USDC token with self-registering faucet (100 tUSDC / 24h). |
| **`pandem-tripartite`** *(Experimental)* | [`contracts/pandem-tripartite/src/lib.rs`](contracts/pandem-tripartite/src/lib.rs) | Not deployed (Stage 2 experimental) | 8/8 pass | Experimental contract targeting mainnet intents.near with 50/30/17.5/2.5 split and dispute voting. Not wired for Stage 1 D1 money path. |

**Total Test Coverage:** **46 passed, 0 failed, 0 errors** (`cd contracts && cargo test`: 15 escrow, 9 budget, 9 registry, 5 mock_tusdc, 8 tripartite).

---

## 3. Verifiable Testnet Explorer Receipts (D1, D4 & D6 End-to-End)

Every operational state transition is executed and persistently verified on NEAR Testnet:

| Action / Capability | Transaction ID / Explorer Receipt | Value / Outcome |
|---|---|---|
| **tUSDC Storage Deposit (Onboarding)** | [`DozphQeNfzCP...`](https://explorer.testnet.near.org/transactions/DozphQeNfzCPutXXk9GGq9ypnrY9jfPeDYBW2Mik13gm) | Subscriber registered storage on `pandem-tusdc-46cee5ca.testnet` via Onboarding Drawer |
| **tUSDC Faucet Claim (100 tUSDC)** | [`GJM3Nke5UovC...`](https://explorer.testnet.near.org/transactions/GJM3Nke5UovC3gUik319G4MAxQgdKmMa18iDvbyfu97) | 100 tUSDC claimed to fresh subscriber account `d61.test-pandem-alice-1.testnet` |
| **In-Wallet Send tUSDC** | Verified via `scripts/test_f2_send_usdc.mjs` | 21/21 assertions passed; 6-decimal `ft_transfer` with 1 yocto deposit & balance safety guard |
| **Pro Tier Subscribe (`ft_transfer_call`)** | [`FuSkAiSVCihP...`](https://explorer.testnet.near.org/transactions/FuSkAiSVCihP9Qrkgyv7wagFy5chGPtE2PJXs8hSzAeZ) | 10 tUSDC locked into Escrow for 2 periods (Agreement #1, Pro tier) |
| **Prorated Tier Upgrade (`ft_transfer_call`)** | [`HzKT8xwouFyi...`](https://explorer.testnet.near.org/transactions/HzKT8xwouFyiCqFxB4537VJg4EkmCvtYY2t5UZsaFtvn) | Prorated upgrade from Pro to Max (+20 tUSDC) |
| **Agreement Renewal (`ft_transfer_call`)** | [`GMZ4ya8KXwVW...`](https://explorer.testnet.near.org/transactions/GMZ4ya8KXwVWDAgmdW9HQXcJov3jM13fT4Qav62V74Ut) | +1 period Max tier renewal (15 tUSDC) |
| **Agreement Cancellation & Refund** | [`8FkaGuUcsKirk...`](https://explorer.testnet.near.org/transactions/8FkaGuUcsKirk9xvjkyTXDrK3qVCWX67yLsfZywseN9C) | 30 tUSDC unreleased future periods refunded immediately to subscriber |
| **Automated Ops Flow to Budget** | [`7f2t1evj8sTr...`](https://explorer.testnet.near.org/transactions/7f2t1evj8sTrWZ7CkNEz3mdexwuBpjym1m6ivGoiZpT7) | Automated cross-contract `ft_transfer_call` release; budget increased by +1.50 tUSDC (30%) |
| **Ops Budget Funding (`ft_transfer_call`)** | [`HyzVjFL5LkfZ...`](https://explorer.testnet.near.org/transactions/HyzVjFL5LkfZcwShGC37PKReiVTuXTxFxHKDJCfXFd7C) | 1.5 tUSDC seeded to `pandem-budget-d1-8f199e48.testnet` for Product #2 |
| **Yearly Subscribe (`ft_transfer_call`)** | [`3oW6x2wivZWK...`](https://explorer.testnet.near.org/transactions/3oW6x2wivZWKpC1ydtoi75cHTbzAv3HBhhBhFmUTNjxs) | 60 tUSDC locked into Escrow for 12 periods (Agreement #3) |
| **Agent AI Inference Draw** | [`DJuY5Jzj45RQ...`](https://explorer.testnet.near.org/transactions/DJuY5Jzj45RQMjn7EtBPqkGDHLZVwfW3wpzuJe7rnxh3) | 0.5 tUSDC drawn by `pandem-agent-46cee5ca.testnet` from Ops Budget |
| **Steward Killswitch Triggered** | [`Fw1dEp1rnBjS...`](https://explorer.testnet.near.org/transactions/Fw1dEp1rnBjSHxCYEKCNPYzjFGi97w5QvHYAoCAtWrbH) | `declare_abandoned` executed on Product #2 by Steward |
| **1-Click Subscriber Refund** | [`Fzr4Qtc9ngoR...`](https://explorer.testnet.near.org/transactions/Fzr4Qtc9ngoRgGqYzN2UfknG9dHUt3f5rFejM7zoA2Eo) | Full 60 tUSDC unreleased funds refunded directly to subscriber |
| **Final Restored Balance** | *On-chain verified: 98.5 tUSDC* | 100% refund of unreleased subscription verified on testnet RPC |
| **Enclave Agent Heartbeat** | [`C9eRiuYdcjeG...`](https://explorer.testnet.near.org/transactions/C9eRiuYdcjeGwAonoNjt3JfYozAdC9ya7nVDwg2HLcBb) | Cryptographic liveness heartbeat for period #1 |
| **Period 1 Fund Release** | [`AyfiTDb2PVWL...`](https://explorer.testnet.near.org/transactions/AyfiTDb2PVWL3QeBypyDTbFGttvLRpS5cUs2R9R7m9fc) | Released 0.0475 wNEAR to steward + treasury/ops |
| **Registry Product Listing #1** | [`ERa8k4ktcCNS...`](https://explorer.testnet.near.org/transactions/ERa8k4ktcCNSBSVmPnk8uh67NFutpBhQEfi29X2ujKyr) | Registered `DeepSearch AI Pro` with TEE enclave flag |
| **Contingency Reserve Update** | [`GifbYk1neaxd...`](https://explorer.testnet.near.org/transactions/GifbYk1neaxd4nVheJfYqqaozwrVx64hvnkUwcH7z17Q) | Funded contingency reserve pool to 1.0 wNEAR |
| **Contingency Proposal #1 Creation** | [`BqNZuy17iDo1...`](https://explorer.testnet.near.org/transactions/BqNZuy17iDo1PNcEvsVK21NoKuYWxXioDYKJc7Egt9Rc) | Created failover infrastructure proposal for 0.05 wNEAR |
| **Contingency Proposal #1 Vote** | [`FJvojngvT2Ed...`](https://explorer.testnet.near.org/transactions/FJvojngvT2Eddn9J74vG3qGPLBiT6HJkVNkkWToXnVaE) | Cast affirmative vote on Proposal #1 on-chain |
| **Live Bytecode Matrix (/verify)** | FastNEAR RPC `view_code` verified | Code hashes on testnet match `contracts/scripts/deployed.json` build hashes |

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
| **D1–D6** | Full User Journey & Real Payments | 1-flow onboarding drawer, graded subscriptions (Free/Pro/Max), NEP-413 gated access, automated 30% ops forwarding to Budget, private commitment mode, `/verify` live bytecode matrix, and NEAR Intents 1Click cross-chain quotes. | **Shipped** (Explorer receipts verified) |
| **F1–F4** | Final Polish & Freeze | Graded subscriptions on live escrow (`escrow-d64-40ba.test-pandem-alice-1.testnet`), in-wallet Send tUSDC modal, Spectr visual polish (collapsed hero, cover banners, mobile drawer), end-to-end dry run, and code freeze. | **Shipped & Verified** (46/46 tests, 24 routes) |

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

### 2. Verify Smart Contract Suite (46 Tests Pass)
```bash
cd contracts
cargo test
cd ..
```

### 3. Verify Design Lock Linter & TypeScript Typechecks
```bash
npm run lint:design
npm run typecheck
```

### 4. Launch Local Development Daemons
```bash
# Terminal 1: Launch Web Application (Next.js 16)
npm run dev -w web

# Terminal 2: Launch Autonomous Agent Runner Service
npm run dev -w agent
```

### 5. Interactive Pages & Workflows
Open your browser to:
- `http://localhost:3000/`: Spectr Design feed, developer launchpad, enclave inspector, and security matrix.
- `http://localhost:3000/products/[slug]`: Verifiable product page, monthly/yearly Pro & Max tiers, and subscription modal with off-chain email capture.
- `http://localhost:3000/dashboard`: Subscriber dashboard, agreement telemetry, upgrade/renew/cancel actions, and 1-click refund button.
- `http://localhost:3000/dev/dashboard`: Developer telemetry, live on-chain MRR, ops budget station, and killswitch panel.
- `http://localhost:3000/verify`: Live FastNEAR RPC code hash audit vs build hashes, deterministic split breakdown, and refund SLA guarantee.
- `http://localhost:3000/access/[slug]`: NEP-413 Ed25519 signature session gated access page.
- `http://localhost:3000/agent`: Confidential AI chat, Intel TDX attestation quote, and cloud compute ledger.

---

## 8. Future Roadmap

1. **Hardware TEE Enclave Hosting**: Autonomous verifiable container orchestration on Phala / Marlin / NEAR AI Cloud TEEs, deploying service frontends to decentralized storage (Filecoin / IPFS) with verifiable CIDs.
2. **Confidential Intents**: Zero-knowledge private order intents using the NEAR Intents 1Click Defuser solver to eliminate public mempool transaction tracking for high-privacy subscriptions.
3. **RA-TLS (Remote Attestation TLS)**: End-to-end cryptographic channel directly terminating inside the TEE enclave, guaranteeing TLS traffic cannot be intercepted even by the host machine hypervisor.
4. **Tripartite Mainnet Protocol (`contracts/pandem-tripartite`)**: Mainnet settlement contract deploying the 50/30/17.5/2.5 split with multi-party dispute arbitration and automated community risk voting.

---

## 9. Documentation & Submission Deliverables

All detailed reports, submission dossiers, and architectural analyses are located in [`reports/`](reports/):
- **[PROJECT-REPORT.md](reports/PROJECT-REPORT.md)**: Comprehensive technical report and milestone retrospective.
- **[SUBMISSION.md](reports/SUBMISSION.md)**: Official hackathon submission dossier with track alignment and pitch copy.
- **[DEMO-VIDEO-SCRIPT.md](reports/DEMO-VIDEO-SCRIPT.md)**: Scene-by-scene 4-minute demo recording storyboard.
- **[CONTRACT-ARCHITECTURE-COMPARISON.md](reports/CONTRACT-ARCHITECTURE-COMPARISON.md)**: Technical breakdown comparing native NEAR Rust contracts vs EVM Solidity vs rush hackathon patterns.
- **[Latest Handoff Block](reports/handoffs/2026-11-14T04-05Z_full-contracts-voting-cloudpayments.md)**: Timestamped milestone audit and runtime state.

---

## 10. License

MIT License. See [LICENSE](LICENSE) for details.
