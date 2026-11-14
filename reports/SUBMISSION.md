# Pandem: Hackathon Submission Dossier

**Project Name**: Pandem  
**Repository**: [https://github.com/shreyan001/pandem](https://github.com/shreyan001/pandem)  
**Live Production App**: [https://pandem-xi.vercel.app](https://pandem-xi.vercel.app)  
**Primary Track**: Real-World Money  
**Secondary Track**: Privacy & Private AI  
**Deployed Testnet Contracts**:
- Escrow (V2 Live): [`escrow-d64-40ba.test-pandem-alice-1.testnet`](https://explorer.testnet.near.org/accounts/escrow-d64-40ba.test-pandem-alice-1.testnet)
- Budget: [`pandem-budget-d1-8f199e48.testnet`](https://explorer.testnet.near.org/accounts/pandem-budget-d1-8f199e48.testnet)
- Registry: [`pandem-registry-v2-46cee5ca.testnet`](https://explorer.testnet.near.org/accounts/pandem-registry-v2-46cee5ca.testnet)
- Token (tUSDC): [`pandem-tusdc-46cee5ca.testnet`](https://explorer.testnet.near.org/accounts/pandem-tusdc-46cee5ca.testnet)
- Protocol Steward: [`pandem-steward-46cee5ca.testnet`](https://explorer.testnet.near.org/accounts/pandem-steward-46cee5ca.testnet)
- Central Agent: [`pandem-agent-46cee5ca.testnet`](https://explorer.testnet.near.org/accounts/pandem-agent-46cee5ca.testnet)

---

## 1. Short Pitch (Tagline)

**Pandem is a decentralized, non-custodial SaaS and AI subscription escrow engine on NEAR that protects users with hardware-attested periodic releases, graded tier subscriptions, 1Click cross-chain on-ramps, and guaranteed pro-rata refunds.**

---

## 2. The Problem We Solve

Subscriptions power the modern $300B+ software and AI economy. Yet bringing subscriptions on-chain has failed for three fundamental reasons:
1. **The Crypto Payment Dilemma**: Upfront token transfers are completely irreversible. If a user pays 1 year in advance and the service degrades or disappears 2 weeks later, the subscriber has 100% counterparty loss.
2. **The Chargeback Trap**: Centralized processors like Stripe penalize developers with chargeback fees ($15–$25 per dispute) and unilateral account bans, while locking out unbanked or international users.
3. **The AI Confidentiality Gap**: Users who pay for autonomous AI agents have no cryptographic proof that their prompts, data, or proprietary weights are kept private in an attested enclave.

---

## 3. The Pandem Solution

Pandem replaces centralized billing and blunt upfront payments with **Programmable Escrow Protection**:
- **Non-Custodial Subscription Locking**: Users deposit NEP-141 tokens (6-decimal tUSDC) via standard `ft_transfer_call`.
- **1-Flow Onboarding Drawer**: Brand-new testnet accounts register NEP-141 storage and mint faucet funds in a single streamlined batch with instant wallet balance detection.
- **Graded Tier Subscriptions**: Native support for Free (0 tUSDC), Pro (5 tUSDC), and Max (15 tUSDC) tiers with yearly billing discounts (12 months billed as 10).
- **Prorated Upgrades & Renewals**: Subscribers can upgrade tiers mid-cycle (paying only the prorated difference) or renew additional periods via `ft_transfer_call`.
- **Anytime Cancellation & Pro-Rata Refunds**: Subscribers can cancel at any time—future unreleased periods are immediately refunded to the user's wallet. If the steward triggers the killswitch (`declare_abandoned`), unspent periods plus the unused 20% contingency buffer are refunded in 1 click.
- **Hardware-Gated Periodic Releases**: Payments unlock period by period (e.g. 14 days or monthly), strictly gated on cryptographic liveness heartbeats from an autonomous agent running inside an Intel TDX & NVIDIA NRAS TEE on NEAR AI Cloud.
- **Automated 4-Way Payout Split with Direct Ops Forwarding**:
  - `47.5%` to Service Steward (Developer revenue)
  - `30.0%` to Operational Reserve (Forwarded automatically to `pandem-budget` via `ft_transfer_call` for infra & AI compute)
  - `20.0%` to Contingency Buffer (Community governance / 100% refund upon abandonment)
  - `2.5%` to Protocol Escrow Fee
- **In-Wallet Send tUSDC**: Built-in modal enabling users to transfer testnet USDC to any account with 6-decimal precision and balance validation.
- **NEP-413 Gated Service Access**: Subscribers authenticate to gated service sessions (`/access/[slug]`) using cryptographic Ed25519 message signatures verified on-chain against active agreements.
- **Verify-It-Yourself Bytecode Matrix**: Dedicated `/verify` page querying live on-chain `code_hash` via FastNEAR RPC against repo build hashes, proving zero bytecode tampering and non-custodial ownership.
- **1Click Cross-Chain Solver On-Ramp**: Direct integration with NEAR Intents 1Click Defuser RFQ API, enabling users on Base, Arbitrum One, Ethereum, and Solana to quote cross-chain USDC deposits into NEAR.
- **Private Subscription Mode**: Optional blind commitment mode (`sha256(secret:product_id)`) shielding product identity while maintaining full refund rights via secret preimage.

---

## 4. Live Testnet Artifacts & Explorer Receipts (Verified D1, D4 & D6)

Every operational capability is executed and persistently verified on NEAR Testnet:

| Action / Capability | Transaction ID / Explorer Receipt | Outcome & Telemetry |
|---|---|---|
| **tUSDC Storage Deposit (Onboarding)** | [`DozphQeNfzCP...`](https://explorer.testnet.near.org/transactions/DozphQeNfzCPutXXk9GGq9ypnrY9jfPeDYBW2Mik13gm) | Subscriber registered storage on `pandem-tusdc-46cee5ca.testnet` via Onboarding Drawer |
| **tUSDC Faucet Claim (100 tUSDC)** | [`GJM3Nke5UovC...`](https://explorer.testnet.near.org/transactions/GJM3Nke5UovC3gUik319G4MAxQgdKmMa18iDvbyfu97) | 100 tUSDC minted via testnet faucet to fresh account `d61.test-pandem-alice-1.testnet` |
| **In-Wallet Send tUSDC** | Verified via `scripts/test_f2_send_usdc.mjs` | 21/21 assertions passed; 6-decimal `ft_transfer` with 1 yocto deposit & balance safety guard |
| **Pro Tier Subscribe (`ft_transfer_call`)** | [`FuSkAiSVCihP...`](https://explorer.testnet.near.org/transactions/FuSkAiSVCihP9Qrkgyv7wagFy5chGPtE2PJXs8hSzAeZ) | 10 tUSDC locked into Escrow for 2 periods (Agreement #1, Pro tier) |
| **Prorated Tier Upgrade (`ft_transfer_call`)** | [`HzKT8xwouFyi...`](https://explorer.testnet.near.org/transactions/HzKT8xwouFyiCqFxB4537VJg4EkmCvtYY2t5UZsaFtvn) | Prorated upgrade from Pro to Max (+20 tUSDC) |
| **Agreement Renewal (`ft_transfer_call`)** | [`GMZ4ya8KXwVW...`](https://explorer.testnet.near.org/transactions/GMZ4ya8KXwVWDAgmdW9HQXcJov3jM13fT4Qav62V74Ut) | +1 period Max tier renewal (15 tUSDC) |
| **Agreement Cancellation & Refund** | [`8FkaGuUcsKirk...`](https://explorer.testnet.near.org/transactions/8FkaGuUcsKirk9xvjkyTXDrK3qVCWX67yLsfZywseN9C) | 30 tUSDC unreleased future periods refunded immediately to subscriber |
| **Automated Ops Flow to Budget** | [`7f2t1evj8sTr...`](https://explorer.testnet.near.org/transactions/7f2t1evj8sTrWZ7CkNEz3mdexwuBpjym1m6ivGoiZpT7) | Automated cross-contract `ft_transfer_call` release; budget increased by +1.50 tUSDC (30%) |
| **Ops Budget Funding (`ft_transfer_call`)** | [`HyzVjFL5LkfZ...`](https://explorer.testnet.near.org/transactions/HyzVjFL5LkfZcwShGC37PKReiVTuXTxFxHKDJCfXFd7C) | 1.5 tUSDC seeded to `pandem-budget-d1-8f199e48.testnet` for Product #2 |
| **Yearly Subscribe (`ft_transfer_call`)** | [`3oW6x2wivZWK...`](https://explorer.testnet.near.org/transactions/3oW6x2wivZWKpC1ydtoi75cHTbzAv3HBhhBhFmUTNjxs) | 60 tUSDC locked into Escrow for 12 periods (Agreement #3, Pro tier) |
| **Enclave Access Link & Email** | *https://localai.pandem.testnet/session* | Verified access link provisioned; subscriber email captured off-chain |
| **Agent AI Inference Draw** | [`DJuY5Jzj45RQ...`](https://explorer.testnet.near.org/transactions/DJuY5Jzj45RQMjn7EtBPqkGDHLZVwfW3wpzuJe7rnxh3) | 0.5 tUSDC drawn by `pandem-agent-46cee5ca.testnet` from Ops Budget |
| **Steward Killswitch Triggered** | [`Fw1dEp1rnBjS...`](https://explorer.testnet.near.org/transactions/Fw1dEp1rnBjSHxCYEKCNPYzjFGi97w5QvHYAoCAtWrbH) | `declare_abandoned` executed on Product #2 by Steward |
| **1-Click Subscriber Refund** | [`Fzr4Qtc9ngoR...`](https://explorer.testnet.near.org/transactions/Fzr4Qtc9ngoRgGqYzN2UfknG9dHUt3f5rFejM7zoA2Eo) | Full 60 tUSDC unreleased funds refunded directly to subscriber |
| **Final Restored Balance** | *On-chain verified: 98.5 tUSDC* | 100% refund of unreleased subscription verified on testnet RPC |
| **Live Bytecode Matrix (/verify)** | FastNEAR RPC `view_code` verified | Code hashes on testnet match `contracts/scripts/deployed.json` build hashes |

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

### Step 2: Run Unit Tests (Rust Contract Suite & Typechecks)
```bash
# Verify all 46 Smart Contract unit tests pass (15 escrow, 9 budget, 9 registry, 5 mock_tusdc, 8 tripartite)
cd contracts && cargo test && cd ..

# Verify TypeScript typechecks across all 3 workspaces
npm run typecheck

# Verify Spectr Design System linter (0 errors)
npm run lint:design
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
- `http://localhost:3000/`: Product Hunt style directory with collapsed hero, dense feed rows, category pills, and TEE score multipliers.
- `http://localhost:3000/products/open-webui`: Verifiable product page, 16:9 cover banner, Raycast-style header, PricingTable (Free/Pro/Max, monthly/yearly toggle), and Subscribe modal.
- `http://localhost:3000/dashboard`: Subscriber dashboard with active agreement cards, Upgrade/Renew/Cancel actions, explorer transaction links, and 1-click refund button.
- `http://localhost:3000/dev/dashboard`: Developer telemetry, live on-chain MRR stream, ops budget station, and killswitch panel.
- `http://localhost:3000/verify`: Live FastNEAR RPC code hash audit vs build hashes, deterministic split breakdown, and refund SLA guarantee.
- `http://localhost:3000/access/open-webui`: NEP-413 Ed25519 signature session gated access page.
- `http://localhost:3000/agent`: Confidential AI chat, Intel TDX attestation quote, and cloud compute ledger.

---

## 6. Technology Stack

- **Smart Contracts**: Rust (`near-sdk 5.30.1`, `cargo-near 0.23.0`).
- **Frontend**: Next.js 16 (App Router, Turbopack), React 19, Tailwind CSS, TypeScript, Spectr Design System (`design.md`).
- **Wallet Connection**: `@hot-labs/near-connect` (Modern non-custodial NEAR wallet integration supporting HOT, Meteor, and MyNearWallet).
- **Autonomous Agent**: Node.js / TypeScript, `near-api-js 7.5.3`.
- **Confidential Compute**: NEAR AI Cloud (`Qwen/Qwen3.8-27B` with Intel TDX remote attestation and NVIDIA H100 NRAS verification).
- **Cross-Chain Edge On-Ramp**: NEAR Intents 1Click Defuser RFQ protocol integration.
