# Pandem: Hackathon Submission Dossier

**Project Name**: Pandem  
**Repository**: [https://github.com/shreyan001/pandem](https://github.com/shreyan001/pandem)  
**Primary Track**: Real-World Money  
**Secondary Track**: Privacy & Private AI  
**Deployed Testnet Contract**: `pandem-escrow-46cee5ca.testnet`  
**Testnet Explorer Link**: [https://explorer.testnet.near.org/accounts/pandem-escrow-46cee5ca.testnet](https://explorer.testnet.near.org/accounts/pandem-escrow-46cee5ca.testnet)  

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
- **Non-Custodial Subscription Locking**: Users deposit NEP-141 tokens (USDC / wNEAR) via standard `ft_transfer_call`.
- **Hardware-Gated Periodic Releases**: Payments are unlocked in discrete periods (e.g. 14 days or monthly). Each release is strictly conditioned on a cryptographic heartbeat signed by an autonomous agent runner inside an Intel TDX & NVIDIA NRAS TEE on NEAR AI Cloud.
- **Automated 4-Way Payout Split**:
  - `47.5%` to Service Steward (Developer)
  - `30.0%` to Operational Reserve (Infrastructure costs)
  - `20.0%` to Contingency Buffer (Security guarantee)
  - `2.5%` to Protocol Treasury
- **Pro-Rata Downside Protection**: If the service dies or triggers the killswitch (`declare_abandoned`), the subscriber instantly claims back 100% of unreleased periods *plus* the unused 20% contingency buffer.
- **1Click Cross-Chain On-Ramp**: Users holding funds on Ethereum, Solana, Arbitrum, Base, or Bitcoin can subscribe directly in one transaction using the NEAR Intents 1Click Defuser solver engine.

---

## 4. Live Testnet Artifacts & Explorer Receipts

| Action | Transaction Hash / Receipt | Outcome |
|---|---|---|
| **Contract Deploy & Init** | [`88Ms1iCuq3uC...`](https://explorer.testnet.near.org/transactions/88Ms1iCuq3uC7qbNfWm7wgQ4uQd5icUAb1eSac3KAtts) | Deployed Rust escrow to `pandem-escrow-46cee5ca.testnet` |
| **Product Approval** | [`DMv1jw1S9tpC...`](https://explorer.testnet.near.org/transactions/DMv1jw1S9tpCJcdRfoRJf3yZbjdph1ZbGenAwtHgsjdy) | Approved `prod-deepsearch-m4` for storefront listing |
| **Subscription Deposit** | [`5XnsktfXTa6D...`](https://explorer.testnet.near.org/transactions/5XnsktfXTa6Df8NrghXAiEfUUeGjpy5Gy7KK7oF5J3Fc) | Alice deposited 0.3 wNEAR for 3 periods |
| **Enclave Agent Heartbeat** | [`C9eRiuYdcjeG...`](https://explorer.testnet.near.org/transactions/C9eRiuYdcjeGwAonoNjt3JfYozAdC9ya7nVDwg2HLcBb) | Liveness verified for Period 1 |
| **Period 1 Fund Release** | [`AyfiTDb2PVWL...`](https://explorer.testnet.near.org/transactions/AyfiTDb2PVWL3QeBypyDTbFGttvLRpS5cUs2R9R7m9fc) | 0.0475 wNEAR paid to steward |
| **Steward Killswitch** | [`CxgAEmPTJNSY...`](https://explorer.testnet.near.org/transactions/CxgAEmPTJNSYd5pGzaQr57dR2DVqJge32NmiJCuiBpLE) | Triggered `declare_abandoned` |
| **Subscriber Refund** | [`5vL5sXN1eutg...`](https://explorer.testnet.near.org/transactions/5vL5sXN1eutgZcBaBbJFHMkayjRJdBSPNzU8E7QKYgRk) | Returned 0.22 wNEAR to Alice (2 periods + contingency) |

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
