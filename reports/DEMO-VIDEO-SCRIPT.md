# Pandem: Demo Video Script & Storyboard

**Target Duration**: 4 minutes  
**Target Tracks**: Real-World Money & Privacy/Private AI  
**Presenter**: Solo or Screen Narrator  
**Resolution**: 1080p / 60fps  
**Deployed Testnet Contracts**:
- Escrow: [`escrow-d64-40ba.test-pandem-alice-1.testnet`](https://explorer.testnet.near.org/accounts/escrow-d64-40ba.test-pandem-alice-1.testnet)
- Budget: [`pandem-budget-d1-8f199e48.testnet`](https://explorer.testnet.near.org/accounts/pandem-budget-d1-8f199e48.testnet)
- Registry: [`pandem-registry-v2-46cee5ca.testnet`](https://explorer.testnet.near.org/accounts/pandem-registry-v2-46cee5ca.testnet)
- Token (tUSDC): [`pandem-tusdc-46cee5ca.testnet`](https://explorer.testnet.near.org/accounts/pandem-tusdc-46cee5ca.testnet)
- Steward: [`pandem-steward-46cee5ca.testnet`](https://explorer.testnet.near.org/accounts/pandem-steward-46cee5ca.testnet)
- Central Agent: [`pandem-agent-46cee5ca.testnet`](https://explorer.testnet.near.org/accounts/pandem-agent-46cee5ca.testnet)

---

## Storyboard Overview

| Scene | Time | Focus Area | Visual on Screen |
|---|---|---|---|
| **Scene 1** | 0:00 - 0:45 | Problem Pitch & 1-Flow Onboarding | Spectr landing page (`http://localhost:3000`), collapsed hero, dense directory, Onboarding Drawer (1-click account, storage, testnet faucet) and in-wallet Send tUSDC modal |
| **Scene 2** | 0:45 - 1:30 | Product Catalog, Graded Tiers & PricingTable | Product detail page (`/products/open-webui`), 16:9 cover banner, PricingTable (Free/Pro/Max, monthly/yearly toggle), Subscribe modal with 4-way split, Private Mode, and 1Click cross-chain quotes |
| **Scene 3** | 1:30 - 2:15 | NEP-413 Gated Access & Verify-It-Yourself Matrix | Access gate (`/access/open-webui`) with NEP-413 Ed25519 signature session, Verify page (`/verify`) auditing live FastNEAR RPC code hash matrix against repo build hashes |
| **Scene 4** | 2:15 - 3:00 | Automated 30% Ops Forwarding & Autonomous AI Billing | `/dev/dashboard` showing live streaming MRR, automated cross-contract release forwarding 30% tUSDC directly to `pandem-budget`, and agent TEE inference draw station |
| **Scene 5** | 3:00 - 3:45 | Dashboard Actions: Upgrade, Renew, Cancel & Killswitch | Subscriber Dashboard (`/dashboard`) showing active agreements, Prorated Upgrade to Max, Renew, anytime Cancel with immediate future period refund, and Steward killswitch pro-rata refund |
| **Scene 6** | 3:45 - 4:15 | Smart Contract Suite, Test Coverage & Explorer Receipts | Terminal showing `cargo test` (46/46 tests passed), clean Next.js build (24 routes), Spectr design linter (0 errors), and live NEAR testnet explorer receipts |

---

## Detailed Script & Actions

### Scene 1: The Problem & 1-Flow Onboarding (0:00 - 0:45)
- **Visual**: Show opening view of `http://localhost:3000` (or `https://pandem-xi.vercel.app`). Click **"Get Started"** to open `OnboardingDrawer`.
- **Action**: Connect wallet (`test-pandem-alice-1.testnet`), execute atomic `setupPaymentsBatch` (storage deposit + 100 tUSDC faucet claim), and show balance updating in Navbar. Click **"Send tUSDC"** to demonstrate in-wallet transfers.
- **Narration**:
  > *"Every month, the global economy spends hundreds of billions on software subscriptions and autonomous AI agents. But in Web3, subscriptions are broken. Either users pay upfront for a whole year—taking on 100% of the counterparty risk if the developer abandons the service—or they rely on centralized payment processors like Stripe that extract fees, dispute penalties, and censor accounts.*
  >
  > *Meet Pandem: the first non-custodial SaaS and AI subscription escrow engine natively built on NEAR Protocol. Pandem protects subscribers by locking payments into smart escrow, releasing funds period-by-period as services prove liveness, and guaranteeing instant, pro-rata refunds if service uptime or privacy fails.*
  >
  > *Getting started takes one step: our onboarding drawer registers NEP-141 token storage and mints testnet USDC directly to the user's wallet in a single flow, with built-in Send tUSDC transfers right from the navbar."*

---

### Scene 2: Product Catalog, Graded Tiers & PricingTable (0:45 - 1:30)
- **Visual**: Navigate to `http://localhost:3000/products/open-webui`.
- **Action**: Highlight the 16:9 banner cover, Raycast-style product header, and `PricingTable` displaying Free ($0), Pro ($5/mo), and Max ($15/mo) tiers. Toggle between monthly and yearly billing (12 months billed as 10, saving 17%). Click **"Subscribe"** on Pro tier.
- **Narration**:
  > *"Here on the product page, services offer graded tiers—Free, Pro, and Max—with transparent monthly or yearly pricing.*
  >
  > *When we subscribe, our payment is not sent directly to the developer's wallet. Instead, it enters Pandem's native Rust escrow contract.*
  >
  > *The smart contract enforces a mathematical 4-way split per period: 47.5% to the developer steward, 30% to an operational reserve for ongoing compute costs, 20% to an emergency contingency buffer, and 2.5% to the protocol escrow fee.*
  >
  > *Subscribers can also toggle Private Mode, submitting a blind commitment `sha256(secret:product_id)` that hides which service they subscribed to, or open the NEAR Intents 1Click drawer to quote cross-chain deposits from Base, Arbitrum, Ethereum, or Solana."*

---

### Scene 3: NEP-413 Gated Access & Verify-It-Yourself Matrix (1:30 - 2:15)
- **Visual**: Navigate to `http://localhost:3000/access/open-webui`. Click **"Unlock with Wallet"** to sign NEP-413 message. Then navigate to `http://localhost:3000/verify`.
- **Action**: Show NEP-413 Ed25519 signature verification granting an authenticated session. On `/verify`, show live FastNEAR RPC `view_code` hashes matching `cargo near build` hashes for all four deployed contracts.
- **Narration**:
  > *"Once subscribed, accessing the service requires no username or password. The user signs a NEP-413 Ed25519 message in their wallet. Our server verifies the signature on-chain against active escrow agreements and unlocks a private session link.*
  >
  > *And because trust requires proof, Pandem features a dedicated Verify-It-Yourself page (`/verify`). It queries live on-chain bytecode hashes directly from FastNEAR RPC and compares them with reproducible build hashes in our repository—verifying that the contract bytecode has never been altered, protocol fees are strictly capped at 2.5%, and subscriber funds cannot be drained."*

---

### Scene 4: Developer Telemetry & Automated Ops Forwarding (2:15 - 3:00)
- **Visual**: Navigate to `http://localhost:3000/dev/dashboard`.
- **Action**: Show live on-chain MRR stream and the Ops Budget Station. Highlight the automated 30% ops release forward from escrow to `pandem-budget-d1-8f199e48.testnet`.
- **Narration**:
  > *"For developers and AI builders, Pandem provides the Maker Console on `/dev/dashboard`.*
  >
  > *Instead of manual payouts, revenue streams period by period. With our automated ops pipeline, the 30% operational share transfers automatically from escrow directly into `pandem-budget` via `ft_transfer_call` whenever a period releases.*
  >
  > *Our autonomous agent runner draws inference compute payments directly from this ops budget on-chain using `draw_ops_funds`, paying for confidential AI inference inside Intel TDX and NVIDIA NRAS TEE enclaves without ever touching developer profits."*

---

### Scene 5: Subscription Management, Cancel & Pro-Rata Refunds (3:00 - 3:45)
- **Visual**: Navigate to `http://localhost:3000/dashboard`.
- **Action**: Show the active agreement card. Open `SubscriptionActionModal` and demonstrate:
  1. **Upgrade**: Prorate difference to Max tier via `ft_transfer_call`.
  2. **Renew**: Add an additional period.
  3. **Cancel**: Immediate refund of all future unreleased periods back to wallet.
  4. **Killswitch**: Trigger `declare_abandoned` on dev console and click **"Claim Pro-Rata Refund"** on subscriber dashboard.
- **Narration**:
  > *"On the Subscriber Dashboard (`/dashboard`), users have full control over their subscriptions.*
  >
  > *Need more compute? Click 'Upgrade Tier' to pay only the prorated difference to Max tier. Need more time? Click 'Renew' to extend periods.*
  >
  > *Want to stop? Click 'Cancel'—the smart contract immediately cancels future renewals and refunds all unreleased periods directly back to your wallet.*
  >
  > *And if a service breaches its SLA or triggers the emergency killswitch (`declare_abandoned`), the subscriber can claim an instant pro-rata refund of all remaining periods plus the unused 20% contingency buffer in a single transaction. No chargebacks. No banking disputes. Guaranteed by math."*

---

### Scene 6: Architecture & Testnet Verification (3:45 - 4:15)
- **Visual**: Show the terminal with `cargo test` passing all 46 tests across all crates, `npm run lint:design` passing with 0 errors, Next.js 16 compiling 24 routes, and NEAR Testnet Explorer receipts.
- **Narration**:
  > *"Pandem is built with native Rust smart contracts compiling to WebAssembly on NEAR, with 46 passing contract tests, clean TypeScript typechecks, and a responsive Spectr design system on Next.js 16.*
  >
  > *Every transaction and contract you saw today is live and verified on NEAR Testnet. Visit pandem-xi.vercel.app or inspect our open-source contracts on GitHub. Thank you."*
