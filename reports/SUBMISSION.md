# Pandem: Hackathon Submission Dossier

**Project Name**: Pandem  
**Repository**: [https://github.com/shreyan001/pandem](https://github.com/shreyan001/pandem)  
**Live Production App**: [https://pandem-xi.vercel.app](https://pandem-xi.vercel.app)  
**Primary Track**: Real-World Money  
**Secondary Track**: Privacy & Private AI  
**Deployed Testnet Contracts**:
- Escrow: [`pandem-escrow-d1-8f199e48.testnet`](https://explorer.testnet.near.org/accounts/pandem-escrow-d1-8f199e48.testnet)
- Budget: [`pandem-budget-d1-8f199e48.testnet`](https://explorer.testnet.near.org/accounts/pandem-budget-d1-8f199e48.testnet)
- Registry: [`pandem-registry-v2-46cee5ca.testnet`](https://explorer.testnet.near.org/accounts/pandem-registry-v2-46cee5ca.testnet)
- Token (tUSDC): [`pandem-tusdc-46cee5ca.testnet`](https://explorer.testnet.near.org/accounts/pandem-tusdc-46cee5ca.testnet)

---

## 1. Short Pitch (Tagline)

**Pandem is a decentralized, non-custodial SaaS and AI subscription escrow engine on NEAR that protects users with hardware-attested periodic releases, 1Click cross-chain on-ramps, and guaranteed pro-rata refunds.**

---

## 2. The Problem We Solve

Subscriptions power the modern $300B+ software and AI economy. Yet bringing subscriptions on-chain has failed for two key reasons:
1. **The Crypto Payment Dilemma**: Upfront token transfers are completely irreversible. If a user pays 1 year in advance and the service disappears 2 weeks later, the subscriber has zero recourse.
2. **The Chargeback Trap**: Centralized processors like Stripe penalize developers with chargeback fees ($15-$25 per dispute) and unilateral account bans, while locking out unbanked or international users.
3. **The AI Confidentiality Gap**: Users who pay for autonomous AI agents have no proof that their data, prompts, or proprietary logic are kept private.

---

## 3. The Pandem Solution

Pandem replaces centralized billing and blunt upfront payments with **Programmable Escrow Protection**:
- **Non-Custodial Subscription Locking**: Users deposit NEP-141 tokens (6-decimal tUSDC) via standard `ft_transfer_call`.
- **Hardware-Gated Periodic Releases**: Payments are unlocked in discrete periods (e.g. 30 days or yearly). Each release is strictly conditioned on a cryptographic heartbeat signed by an autonomous agent runner inside an Intel TDX & NVIDIA NRAS TEE on NEAR AI Cloud.
- **Automated 4-Way Payout Split**:
  - `47.5%` to Service Steward (Developer revenue)
  - `30.0%` to Operational Reserve (Infrastructure & AI compute costs managed by `pandem-budget`)
  - `20.0%` to Contingency Buffer (Community governance / 100% refund upon abandonment)
  - `2.5%` to Protocol Escrow Fee
- **Pro-Rata Downside Protection**: If the service dies or triggers the killswitch (`declare_abandoned`), the subscriber instantly claims back 100% of unreleased periods *plus* the unused 20% contingency buffer in a single transaction.
- **1Click Cross-Chain On-Ramp**: Users holding funds on Ethereum, Solana, Arbitrum, Base, or Bitcoin can subscribe directly using the NEAR Intents 1Click Defuser solver engine.

---

## 4. Live Testnet Artifacts & Explorer Receipts (Verified D1 & D4)

Every single operational step has been executed and persistently verified on NEAR Testnet:

| Action / Capability | Transaction ID / Explorer Receipt | Outcome & Telemetry |
|---|---|---|
| **tUSDC Storage Deposit** | [`YJbKbNUQHXCb...`](https://explorer.testnet.near.org/transactions/YJbKbNUQHXCbFJWb38Aaz51MySYKKtuX18ayGRd7CjP) | Subscriber `test-pandem-check-1.testnet` registered on token contract |
| **tUSDC Faucet Claim** | [`DvCav8Bgays4...`](https://explorer.testnet.near.org/transactions/DvCav8Bgays4LvHHoiRoxsw6TqBVKPNF4eQJhSwRwRTr) | 100 tUSDC minted via testnet faucet to fresh wallet |
| **Ops Budget Funding (`ft_transfer_call`)** | [`HyzVjFL5LkfZ...`](https://explorer.testnet.near.org/transactions/HyzVjFL5LkfZcwShGC37PKReiVTuXTxFxHKDJCfXFd7C) | 1.5 tUSDC seeded to `pandem-budget-d1-8f199e48.testnet` for Product #2 |
| **Yearly Subscribe (`ft_transfer_call`)** | [`3oW6x2wivZWK...`](https://explorer.testnet.near.org/transactions/3oW6x2wivZWKpC1ydtoi75cHTbzAv3HBhhBhFmUTNjxs) | 60 tUSDC locked into Escrow for 12 periods (Agreement #3, Pro tier) |
| **Enclave Access Link & Email** | *https://localai.pandem.testnet/session* | Verified access link provisioned; subscriber email captured off-chain |
| **Agent AI Inference Draw** | [`DJuY5Jzj45RQ...`](https://explorer.testnet.near.org/transactions/DJuY5Jzj45RQMjn7EtBPqkGDHLZVwfW3wpzuJe7rnxh3) | 0.5 tUSDC drawn by `pandem-agent-46cee5ca.testnet` from Ops Budget |
| **Steward Killswitch Triggered** | [`Fw1dEp1rnBjS...`](https://explorer.testnet.near.org/transactions/Fw1dEp1rnBjSHxCYEKCNPYzjFGi97w5QvHYAoCAtWrbH) | `declare_abandoned` executed on Product #2 by Steward |
| **1-Click Subscriber Refund** | [`Fzr4Qtc9ngoR...`](https://explorer.testnet.near.org/transactions/Fzr4Qtc9ngoRgGqYzN2UfknG9dHUt3f5rFejM7zoA2Eo) | Full 60 tUSDC unreleased funds refunded directly to subscriber |
| **Final Restored Balance** | *On-chain verified: 98.5 tUSDC* | 100% refund of unreleased subscription verified on testnet RPC |

---

## 5. Quickstart for Judges (Test in Under 2 Minutes)

### Prerequisites
- Node.js 18+ & Rust 1.80+ installed.

### Step 1: Clone & Install
```bash
git clone https://github.com/shreyan001/pandem.git
cd pandem
npm install
```

### Step 2: Run Unit Tests (Rust Contract & Typechecks)
```bash
# Verify Escrow Smart Contract tests (7/7 pass)
cd contracts/escrow && cargo test

# Verify TypeScript typechecks across all 3 workspaces
cd ../.. && npm run typecheck
```

### Step 3: Launch Local Frontends
```bash
# Terminal 1: Launch Next.js Storefront & Dashboards
npm run dev -w web

# Terminal 2: Launch Autonomous Agent Enclave Service
npm run dev -w agent
```

### Step 4: Explore the Live Application
Open your browser to:
- `http://localhost:3000/`: Browse catalog and subscribe.
- `http://localhost:3000/onramp`: Test the 1Click cross-chain solver dry-quote simulation.
- `http://localhost:3000/components`: Explore the complete interactive design system testbed.
- `http://localhost:3000/me`: View subscriber agreements, period progress, and trigger refunds.
- `http://localhost:3000/steward`: Inspect reserves and trigger the emergency killswitch.
- `http://localhost:3000/agent`: Inspect the live Intel TDX & NVIDIA NRAS TEE hardware attestation quote.

---

## 6. Technology Stack

- **Smart Contracts**: Rust (`near-sdk 5.30.1`, `cargo-near 0.23.0`).
- **Frontend**: Next.js 14 (App Router), Tailwind CSS, TypeScript, Lucide Icons.
- **Wallet Connection**: `@hot-labs/near-connect` (Modern non-custodial NEAR wallet integration).
- **Autonomous Agent**: Node.js / TypeScript, `near-api-js 7.5.3`.
- **Confidential Compute**: NEAR AI Cloud (`Qwen/Qwen3.8-27B` with Intel TDX remote attestation and NVIDIA H100 NRAS verification).
- **Cross-Chain Edge On-Ramp**: NEAR Intents 1Click Defuser protocol specification.
