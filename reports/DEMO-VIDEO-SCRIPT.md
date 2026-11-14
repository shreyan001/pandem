# Pandem: Demo Video Script & Storyboard

**Target Duration**: 4 minutes  
**Target Tracks**: Real-World Money & Privacy/Private AI  
**Presenter**: Solo or Screen Narrator  
**Resolution**: 1080p / 60fps  

---

## Storyboard Overview

| Scene | Time | Focus Area | Visual on Screen |
|---|---|---|---|
| **Scene 1** | 0:00 - 0:45 | Problem Pitch | Spectr landing page (`http://localhost:3000`), Developer Launchpad, Security Matrix |
| **Scene 2** | 0:45 - 1:30 | Product Catalog & 4-Way Escrow Split | Product detail page (`/products/open-webui`), 6-decimal tUSDC pricing, Yearly Pro/Max tiers, Subscribe Modal |
| **Scene 3** | 1:30 - 2:15 | Access Link & Off-Chain Email Credential | Subscribe success state, Enclave Access Link, off-chain email storage, `/dashboard` agreement station |
| **Scene 4** | 2:15 - 3:00 | Developer Telemetry & Ops Budget Draw | `/dev/dashboard`, On-chain MRR stream, 30% ops reserve, Agent drawing inference compute via `draw_ops_funds` |
| **Scene 5** | 3:00 - 3:45 | Steward Killswitch & 1-Click Refund | `/dev/dashboard` Killswitch Panel (`declare_abandoned`), `/dashboard` refund station, 1-click `claim_refund` returning 100% of funds |
| **Scene 6** | 3:45 - 4:15 | Multi-Contract Architecture & Receipts | Testnet Explorer receipts (`pandem-escrow-d1-8f199e48.testnet`, `pandem-budget-d1-8f199e48.testnet`, `pandem-tusdc-46cee5ca.testnet`) |

---

## Detailed Script & Actions

### Scene 1: The Problem (0:00 - 0:45)
- **Visual**: Show opening view of `http://localhost:3000` (or `https://pandem-xi.vercel.app`).
- **Narration**:
  > *"Every month, the global economy spends hundreds of billions on software subscriptions and autonomous AI services. But in Web3, subscriptions are broken. Either users pay upfront for a whole year—taking on 100% of the counterparty risk if the developer abandons the project—or they rely on centralized payment processors like Stripe that extract fees, dispute penalties, and censor accounts.*
  >
  > *Meet Pandem: the first trust-minimized, non-custodial SaaS and AI subscription escrow natively built on NEAR Protocol. Pandem protects subscribers by locking payments into smart escrow, releasing funds period-by-period as services prove liveness, and guaranteeing instant, pro-rata refunds if service uptime or privacy fails."*

---

### Scene 2: Product Catalog & 4-Way Escrow Split (0:45 - 1:30)
- **Visual**: Navigate to `http://localhost:3000/products/open-webui`. Open the **"Subscribe"** modal.
- **Action**: Show 6-decimal tUSDC pricing (5 tUSDC/month Pro, 15 tUSDC/month Max). Switch duration to 12 periods (yearly = 60 tUSDC).
- **Narration**:
  > *"Here on the Pandem catalog, users subscribe using native NEP-141 tUSDC.*
  >
  > *When we subscribe, our payment is not sent directly to the developer's wallet. Instead, it enters Pandem's native Rust escrow contract.*
  >
  > *The smart contract enforces a mathematical 4-way split per period: 47.5% to the developer steward, 30% to an operational reserve for ongoing compute costs, 20% to an emergency contingency buffer, and 2.5% to the protocol escrow fee. Funds remain non-custodial and are unlocked only as periods elapse."*

---

### Scene 3: Access Link & Subscriber Dashboard (1:30 - 2:15)
- **Visual**: Show the subscribe transaction confirmation, the Enclave Access Link, and the off-chain email field. Then navigate to `http://localhost:3000/dashboard`.
- **Action**: Enter subscriber email in the modal, click copy on the Enclave Access URL, and navigate to `/dashboard` showing the live agreement card with all contract links.
- **Narration**:
  > *"Upon subscription on NEAR testnet, the subscriber receives an instant enclave access URL and can provide an off-chain email credential.*
  >
  > *On the Subscriber Dashboard (`/dashboard`), the user sees every active agreement, the funded vs released periods, the exact smart contracts holding their deposit, and real-time explorer links for every transaction."*

---

### Scene 4: Developer Telemetry & Autonomous Ops Draws (2:15 - 3:00)
- **Visual**: Navigate to `http://localhost:3000/dev/dashboard`.
- **Action**: Hover over the live on-chain MRR stream and the Ops Budget Station. Show the agent drawing compute funds.
- **Narration**:
  > *"For developers and AI builders, Pandem provides the Maker Console on `/dev/dashboard`.*
  >
  > *Instead of opaque monthly payouts, developers stream revenue in 7-day intervals. The 30% operational reserve streams directly into `pandem-budget`.*
  >
  > *Our autonomous agent runner draws inference compute payments directly from this ops budget on-chain using `draw_ops_funds`, paying for confidential inference without ever touching developer earnings."*

---

### Scene 5: The Killswitch & 1-Click Consumer Refund (3:00 - 3:45)
- **Visual**: On `/dev/dashboard`, scroll to the **"Risk Correction & Killswitch Station"**. Trigger `declare_abandoned`. Then switch back to `/dashboard` and click **"Claim Pro-Rata Refund"**.
- **Action**: Confirm `declare_abandoned` on-chain. On `/dashboard`, show the agreement status update to `Abandoned` and click `Claim Refund`.
- **Narration**:
  > *"Now let's see consumer protection in action. Suppose an infrastructure provider sunsets their service or breaches privacy SLAs.*
  >
  > *On the Developer Dashboard, the steward triggers `declare_abandoned`. The smart contract instantly transitions into the abandoned state and halts all future releases.*
  >
  > *On the Subscriber Dashboard, the user sees that the agreement has terminated. With a single click on 'Claim Refund', the escrow contract returns all unreleased funds directly back to the subscriber's wallet—returning 60 tUSDC in a single transaction.*
  >
  > *No chargeback disputes. No bank investigation wait times. Absolute mathematical fairness enforced by code."*

---

### Scene 6: Architecture & Testnet Verification (3:45 - 4:15)
- **Visual**: Show the terminal with `cargo test` passing 39/39 tests, `reports/d4-demo-receipts.json`, and the GitHub repository.
- **Narration**:
  > *"Pandem is fully implemented in native Rust with 39 passing smart contract tests, compiled to WebAssembly on NEAR, and completely integrated into our Spectr design system on Next.js 16.*
  >
  > *Every transaction you saw today is live and verified on NEAR Testnet. Visit pandem-xi.vercel.app or inspect our contracts on GitHub. Thank you."*
