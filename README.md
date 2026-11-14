# Pandem

**TL;DR:** Pandem is a decentralized storefront for private SaaS subscriptions, built natively on NEAR Protocol. Subscribers deposit NEP-141 tokens (USDC or wNEAR) into a **native Rust escrow contract**. The contract releases payments period by period while the service's heartbeat arrives. If heartbeats cease past the grace window or the steward triggers the killswitch, any subscriber can claim an instant pro-rata refund of all unspent periods plus the 20% contingency buffer. All rules are enforced on-chain.

- **Repo**: [https://github.com/shreyan001/pandem](https://github.com/shreyan001/pandem)
- **Hackathon**: NEAR HACKATHON
- **Primary Track**: Real-World Money (`realworld`)
- **Secondary Track**: Privacy & Private AI (`privacy`)
- **Deployed Testnet Contract**: [`pandem-escrow-46cee5ca.testnet`](https://explorer.testnet.near.org/accounts/pandem-escrow-46cee5ca.testnet)

---

## What Has Shipped

| Milestone | Scope | Status | Verifiable Receipts |
|---|---|---|---|
| **M1** | Scaffolding & Tooling | **Shipped** | Clean TypeScript workspaces (`shared`, `agent`, `web`), Cargo workspace (`contracts/escrow`). |
| **⛔ DP-1** | Stage 1 Decision Gate | **Approved** | 3 periods $\times$ 14-day duration, 2.5% protocol fee, 30% ops reserve, 20% contingency, 47.5% steward. |
| **M2** | Escrow Contract Core | **Shipped** | Rust contract with 7/7 unit tests passing, zero-leak integer math, optimized 197.2 KB Wasm build. |
| **M3** | Storefront & Subscribe UI | **Shipped** | Next.js 14 App Router, `@hot-labs/near-connect`, interactive duration slider & 4-way split breakdown. |
| **M4** | Testnet Deploy & Demo | **Shipped** | Deployed to `pandem-escrow-46cee5ca.testnet`. Verified full lifecycle: Subscribe $\to$ Heartbeat $\to$ Release $\to$ Killswitch $\to$ Refund. |
| **M5** | Agent Runner & TEE | **Shipped** | Node/TS daemon with function-call access key; Intel TDX & NVIDIA NRAS TEE attestation on NEAR AI Cloud. |
| **M6** | Dashboards & E2E Routing | **Shipped** | `/me` (Subscriber agreements & refunds), `/steward` (Provider controls & killswitch), `/agent` (Confidential AI chat & TEE quote). |
| **M7** | Stage 2, 1Click & Testbed | **Shipped** | Authored `docs/STAGE-2.md`, built 1Click cross-chain solver panel (`/onramp`), and interactive design testbed (`/components`). |
| **M8** | Project Reports & Dossier | **Shipped** | Full project report, submission dossier, demo script, and EVM vs NEAR contract comparison in `reports/`. |

---

## Verifiable Testnet Transactions

- **Escrow Contract Deploy & Init**: [`88Ms1iCuq3uC...`](https://explorer.testnet.near.org/transactions/88Ms1iCuq3uC7qbNfWm7wgQ4uQd5icUAb1eSac3KAtts)
- **Token Storage Registration**: [`Dp2gMwqF2wT5...`](https://explorer.testnet.near.org/transactions/Dp2gMwqF2wT5pa8QCKHpVGM6FdbdDiyYB1sdink3SJHo)
- **Product Approval**: [`DMv1jw1S9tpC...`](https://explorer.testnet.near.org/transactions/DMv1jw1S9tpCJcdRfoRJf3yZbjdph1ZbGenAwtHgsjdy)
- **Subscription Deposit (`ft_transfer_call`)**: [`5XnsktfXTa6D...`](https://explorer.testnet.near.org/transactions/5XnsktfXTa6Df8NrghXAiEfUUeGjpy5Gy7KK7oF5J3Fc)
- **Agent Heartbeat**: [`C9eRiuYdcjeG...`](https://explorer.testnet.near.org/transactions/C9eRiuYdcjeGwAonoNjt3JfYozAdC9ya7nVDwg2HLcBb)
- **Period 1 Fund Release**: [`AyfiTDb2PVWL...`](https://explorer.testnet.near.org/transactions/AyfiTDb2PVWL3QeBypyDTbFGttvLRpS5cUs2R9R7m9fc)
- **Steward Killswitch (`declare_abandoned`)**: [`CxgAEmPTJNSY...`](https://explorer.testnet.near.org/transactions/CxgAEmPTJNSYd5pGzaQr57dR2DVqJge32NmiJCuiBpLE)
- **Subscriber Refund Claim**: [`5vL5sXN1eutg...`](https://explorer.testnet.near.org/transactions/5vL5sXN1eutgZcBaBbJFHMkayjRJdBSPNzU8E7QKYgRk)

---

## Project Documentation & Deliverables

All submission documents, handoff records, and architectural evaluations are located in [`reports/`](reports/):
- **[PROJECT-REPORT.md](reports/PROJECT-REPORT.md)**: Full hackathon technical report, problem-solution analysis, and milestone breakdown.
- **[SUBMISSION.md](reports/SUBMISSION.md)**: Hackathon submission dossier, tracks, pitch copy, and judge evaluation instructions.
- **[DEMO-VIDEO-SCRIPT.md](reports/DEMO-VIDEO-SCRIPT.md)**: Scene-by-scene 4-minute demo recording script and storyboard.
- **[CONTRACT-ARCHITECTURE-COMPARISON.md](reports/CONTRACT-ARCHITECTURE-COMPARISON.md)**: Technical analysis of native NEAR Rust escrow vs EVM Solidity vs rush hackathon anti-patterns.
- **[Latest Handoff Block](reports/handoffs/2026-11-14T02-25Z_milestones-m1-m7-handoff.md)**: Timestamped milestone audit and runtime state.

---

## Quickstart

### 1. Verify Smart Contracts
```bash
cd contracts/escrow
cargo test
cargo near build non-reproducible-wasm
```

### 2. Verify TypeScript Workspaces
```bash
npm install
npm run typecheck
```

### 3. Launch Development Servers
```bash
# Terminal 1: Web Application (Storefront, Dashboards, On-Ramp, Testbed)
npm run dev -w web

# Terminal 2: Autonomous Agent Runner
npm run dev -w agent
```

### 4. Interactive Web Pages
- `http://localhost:3000/`: Storefront catalog
- `http://localhost:3000/onramp`: 1Click Cross-Chain Defuser On-Ramp
- `http://localhost:3000/components`: Design System & Component Testbed
- `http://localhost:3000/me`: Subscriber agreements & refund claim
- `http://localhost:3000/steward`: Provider controls & killswitch
- `http://localhost:3000/agent`: Confidential AI enclave & TEE hardware attestation

---

## License

MIT License. See [LICENSE](LICENSE) for details.
