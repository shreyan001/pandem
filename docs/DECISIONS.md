# Decisions and decision points

**TL;DR:** Pandem is a set of **native NEAR Rust contracts**, built in stages, with TypeScript for the web app and the agent. All of it runs on **testnet**. The custodial keeper (the old D-01) is **superseded**. Each stage has **decision points** (the S1-x, S2-x… lists below). First Mate workers must **stop and ask shreyan** at each one, because they are contract inputs he researches and finalizes. Stage 1 can start coding only after S1-1…S1-8 are answered or explicitly defaulted.

## Decided (13 Nov 2026)
| ID | Decision | Notes |
|---|---|---|
| D-01 | **Decentralized: native NEAR contracts in Rust** (near-sdk 5.30.1, cargo-near 0.23.0, rustc 1.100, near-cli-rs 0.31.1). App code (web, agent) is TypeScript | Verified by the testnet spike (`context/near/RESEARCH-2026-11-DECENTRALIZED.md`, `context/near/spike-rs/`). **Superseded:** D-01 "custodial TS keeper" (13 Nov, earlier), plus the near-sdk-js and Aurora options |
| D-02 | Money is NEP-141 **USDC on NEAR**. Mainnet native USDC `17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1`. Testnet token: see S1-1 | The token id is an init parameter |
| D-03 | **NEAR Intents / 1Click is only the edge on-ramp** for payers on other chains (mainnet only, no official testnet). Every internal flow (release, refund, fees, ops, agent payments) is a contract call or `ft_transfer` on NEAR | — |
| D-04 | Stage 1 is **one escrow contract** (`contracts/escrow`). It merges the Stillworks ProductRegistry heartbeat, SubscriptionEscrow and StewardshipEscrowPayments logic. Later stages split it into collaborating contracts | A smaller blast radius for the demo |
| D-05 | The split is **2.5% fee / 30% ops / 20% contingency / 47.5% steward**, applied per released period, with the same integer math as the Solidity | — |
| D-06 | D-14 offset fix: `start_product_period = last_heartbeat_period + 1`, and period `p` is releasable only if `last_heartbeat_period ≥ start_product_period + p − 1` | — |
| D-07 | The agent is a TypeScript service with its own NEAR testnet account. It signs with a **function-call key** limited to the escrow's no-deposit methods. Its inference is paid in NEAR AI Cloud **USD credits** (the $10 NEAR Builders key). **Stake-for-Inference is mainnet only**, so it is roadmap here | NEAR-SYSTEM-RESEARCH §3 |
| D-08 | First Mate: the primary is `agy`, and workers are agy too (the default when `config/crew-harness` is unset), using shreyan's Google sign-in. No API key is needed. Project mode `direct-PR`, yolo off | context/firstmate/NOTES.md |
| D-09 | License: MIT (proposed) | **confirm** |
| D-10 | **Testnet only.** Agents use throwaway faucet accounts, never shreyan's keys or `.env`. Shreyan does any mainnet step himself | — |

## Stage plan
| Stage | Contracts | What it adds | Demo by deadline? |
|---|---|---|---|
| **1** | `escrow` (Rust) + an existing testnet NEP-141 token | Products (register, approve), `ft_on_transfer` subscribe, heartbeat, `release_period` with the split, `declare_abandoned` killswitch, `claim_refund` (walkaway, plus a contingency share when abandoned), D-14, NEP-297 events | **Yes** |
| 2 | `budget` (ops) | A subscription funds the full yearly term up front. The ops share is allocated to a per-product budget, which the agent draws from within caps and which is re-allocated when inference cost changes. Also the 7-day review lock (`release_review_funds`) and `claim_ops_reserve` | Design only, or a stretch |
| 3 | `agent-wallet` (agent treasury) | The agent's own contract, seeded with small starting capital. It pays operators and providers on-chain in USDC under allowlists and per-period caps, and records inference spend. Option: Shade Agent contract (Chain Signatures). Mainnet: Stake-for-Inference | Later |
| 4 | `registry` + factory | A listing registry with passports, a factory that deploys one escrow per product as a sub-account, steward succession, contingency fix-proposal voting (WaterfallContingencyHub), and a treasury DAO (Sputnik/Trezu) | Later |
| Edge | — | A mainnet 1Click on-ramp: `EXACT_OUTPUT` + `customRecipientMsg` → `ft_transfer_call` → `escrow.ft_on_transfer` | Dry quote in the demo; a real payment only if shreyan deploys on mainnet |

## Decision points (workers STOP and ask shreyan)
### ⛔ DP-1, Stage 1 (asked after M1; blocks M2; M1, M3 and M5 may proceed on the defaults shown)
| ID | Input to finalize | Default if he says "defaults OK" |
|---|---|---|
| S1-1 | Testnet token: Circle testnet USDC `3e2210e1184b45b64c8a434c0a7e7b23cc04ea7eb7a6c3c32520d03d4afcb8af` (6 decimals; faucet.circle.com reportedly gives NEAR testnet USDC, **unverified**), `usdc.fakes.testnet`, `wrap.testnet` (24 decimals, verified in the spike), or our own mock NEP-141 | Circle testnet USDC if the faucet works, otherwise `wrap.testnet` |
| S1-2 | Accounts (shreyan creates them): escrow contract, steward (demo provider), fee treasury, agent | `pandem-escrow.testnet`, `pandem-steward.testnet`, `pandem-treasury.testnet`, `pandem-agent.testnet` |
| S1-3 | Demo pricing and timing: price per period, period length, grace, max periods per subscription | 1 USDC, 5 min, 2 min, 12 |
| S1-4 | The split and where the reserves live in stage 1 | 2.5/30/20/47.5. Ops and contingency are kept as an internal ledger in the escrow until stage 2 |
| S1-5 | Who may call `release_period` / `claim_refund` | Anyone (permissionless). Funds only go to stored recipients |
| S1-6 | Who may heartbeat, and who may pull the killswitch | Heartbeat: the product's `heartbeat_signer` (the agent account). Killswitch: the steward |
| S1-7 | Storage: who pays for agreement storage (`ft_on_transfer` can't receive NEAR) | The contract pays from its own balance, with a cap of N agreements per product |
| S1-8 | Upgrades: keep a full-access key for redeploys, or lock the contract | Keep the key (shreyan holds it) during the hackathon, plus a `version` view |

### ⛔ DP-2, Stage 2 (asked after M6)
- S2-1 Yearly term: the number of periods and the period length.
- S2-2 Ops budget formula: the initial allocation per subscription, and the per-period draw cap.
- S2-3 The inference-cost input: who posts the cost (agent-signed, steward, or an oracle), how often, and the bounds on adjustments.
- S2-4 Review-lock duration (Stillworks: 7 days), and what happens to locked funds when a product is abandoned.
- S2-5 Rules for claiming the ops reserve.

### ⛔ DP-3, Stage 3 (before any stage 3 work)
- S3-1 Agent wallet type: a plain contract with policies, or a Shade Agent contract (TEE plus Chain Signatures).
- S3-2 Starting capital amount and source.
- S3-3 Payee allowlist and per-period caps.
- S3-4 The inference payment route: USD credits, or Stake-for-Inference on mainnet (amount staked).
- S3-5 Where inference logs live: hashes on-chain and full logs off-chain (IPFS or a file).

### ⛔ DP-4, Stage 4 (before any stage 4 work)
- S4-1 Who may list a product (open, curated, or staked).
- S4-2 Factory and sub-account naming, plus storage funding.
- S4-3 Succession and fix-proposal voting rules: weights, quorum, the 20% cap, the 3-day vote.
- S4-4 Treasury DAO: Sputnik or Trezu, and the members.

### ⛔ DP-2, Edge (mainnet; asked after M6)
- E-1 Deploy a mainnet escrow at all? (shreyan signs.)
- E-2 The 1Click partner key: without a key 1Click adds 0.25%; with a key it is 0.01% on stablecoin pairs.
- E-3 Refund destination for EVM payers: a NEAR account passed in `msg`, or an origin-chain refund through 1Click.

## Superseded
- D-01 (custodial keeper, 13 Nov 2026 ~17:30 IST): replaced by native contracts.
- Earlier near-sdk-js and Aurora paths: both work on testnet, but neither is used (see the research file).
