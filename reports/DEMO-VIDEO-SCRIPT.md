# Pandem: Demo Video Script & Storyboard

**Target Duration**: 4 minutes  
**Target Tracks**: Real-World Money & Privacy/Private AI  
**Presenter**: Solo or Screen Narrator  
**Resolution**: 1080p / 60fps  

---

## Storyboard Overview

| Scene | Time | Focus Area | Visual on Screen |
|---|---|---|---|
| **Scene 1** | 0:00 - 0:45 | Problem Pitch | Title slide / Diagram: Stripe vs Crypto Upfront Payments |
| **Scene 2** | 0:45 - 1:30 | Storefront & Subscription | `http://localhost:3000` (Catalog & Subscribe Modal) |
| **Scene 3** | 1:30 - 2:15 | 1Click Cross-Chain On-Ramp | `http://localhost:3000/onramp` (Solver Dry-Quote & Intent Payload) |
| **Scene 4** | 2:15 - 3:00 | Privacy & Hardware TEE | `http://localhost:3000/agent` (Intel TDX & NVIDIA NRAS Attestation) |
| **Scene 5** | 3:00 - 4:00 | Lifecycle: Release, Killswitch, Refund | `http://localhost:3000/steward` & `/me` (Killswitch & Refund) |
| **Scene 6** | 4:00 - 4:30 | Conclusion & Architecture | Testnet Explorer receipts & GitHub repo |

---

## Detailed Script & Actions

### Scene 1: The Problem (0:00 - 0:45)
- **Visual**: Show slide or opening view of `http://localhost:3000`.
- **Narration**:
  > *"Every month, the global economy spends billions on software subscriptions and autonomous AI services. But in Web3, subscriptions are broken. Either users pay upfront for a whole year—taking on 100% of the counterparty risk if the developer abandons the project—or they rely on centralized payment processors like Stripe that extract fees and censor accounts.*
  >
  > *Meet Pandem: the first trust-minimized, non-custodial SaaS subscription escrow natively built on NEAR Protocol. Pandem protects users by locking payments into smart escrow, releasing funds only as discrete periods elapse, and guaranteeing instant, pro-rata refunds if service uptime or privacy fails."*

---

### Scene 2: The Storefront & 4-Way Escrow Split (0:45 - 1:30)
- **Visual**: Navigate to `http://localhost:3000`. Click on the **"DeepSearch AI Pro"** catalog card and open the **"Subscribe"** modal.
- **Action**: Adjust the duration slider from 3 periods to 6 periods. Hover over the 4-way split breakdown.
- **Narration**:
  > *"Here on the Pandem storefront, users can subscribe to decentralized services using NEP-141 tokens like USDC or wNEAR.*
  >
  > *Notice what happens when we subscribe: our payment isn't sent directly to the creator's wallet. Instead, it enters Pandem's native Rust escrow contract.*
  >
  > *The smart contract enforces a mathematical 4-way split per period: 47.5% goes directly to the service steward, 30% is directed to an operational reserve for ongoing compute costs, 20% is held in an emergency contingency buffer, and 2.5% sustains the protocol treasury. Most importantly, funds are only unlocked period by period as the service proves liveness."*

---

### Scene 3: Cross-Chain 1Click On-Ramp (1:30 - 2:15)
- **Visual**: Click **"On-Ramp"** in the top navigation bar to go to `http://localhost:3000/onramp`.
- **Action**: Switch input token from Ethereum ETH to Solana SOL. Type in `50 USDC`. Click **"Simulate 1Click Swap"** to watch the solver simulation steps.
- **Narration**:
  > *"Real-world adoption requires meeting users where their capital lives. With Pandem's 1Click Cross-Chain On-Ramp powered by NEAR Intents, users don't need to manually bridge or configure testnet RPCs.*
  >
  > *A user holding ETH on Ethereum or SOL on Solana can simply request an intent quote. The Defuser solver network settles the swap on NEAR and forwards the deposit directly into the escrow agreement in a single transaction. The UI displays the exact custom recipient message that triggers the contract deposit."*

---

### Scene 4: Hardware TEE Attestation & Confidential AI (2:15 - 3:00)
- **Visual**: Click **"Agent"** in the navbar to open `http://localhost:3000/agent`.
- **Action**: Scroll to the **"Hardware Attestation Verification"** card. Expand the raw quote view. Type a query into the confidential chat box.
- **Narration**:
  > *"Pandem was designed from the ground up for the Privacy and Private AI track. Behind every agreement runs an autonomous agent inside a Trusted Execution Environment on NEAR AI Cloud.*
  >
  > *Before any periodic payout can occur, the agent must sign an on-chain heartbeat. The contract only accepts this heartbeat if the agent holds a verified function-call key bound to an Intel TDX and NVIDIA NRAS hardware enclave.*
  >
  > *Here, you can see the cryptographic quote signed by the physical silicon on the host machine. This guarantees that subscriber queries, inference data, and proprietary model weights remain 100% confidential and tamper-proof."*

---

### Scene 5: Liveness, Killswitch & Pro-Rata Refunds (3:00 - 4:00)
- **Visual**: Switch testnet persona using the persona tray to `Steward` (`pandem-steward-47c388e3.testnet`) and go to `http://localhost:3000/steward`. Then switch to `Alice` and go to `http://localhost:3000/me`.
- **Action**: On `/steward`, show the active agreement and click the **"declare_abandoned (Killswitch)"** button. Confirm the action. Then navigate to `/me`, show the status change to **"Abandoned"**, and click **"Claim Pro-Rata Refund"**.
- **Narration**:
  > *"Now let's see consumer protection in action. Suppose a provider needs to sunset their service or suffers infrastructure failure.*
  >
  > *On the Steward dashboard, the provider triggers `declare_abandoned`. Instantly, the smart contract transitions into the abandoned state and halts all future releases.*
  >
  > *Now let's switch back to the subscriber dashboard on `/me`. The subscriber immediately sees that the agreement has terminated. With a single click on 'Claim Refund', the escrow contract returns all unreleased periods PLUS the 20% contingency buffer—returning 0.22 wNEAR directly to the subscriber's wallet.*
  >
  > *No chargeback disputes. No waiting on bank investigations. Complete mathematical fairness enforced by code."*

---

### Scene 6: Conclusion & Architecture (4:00 - 4:30)
- **Visual**: Show the NEAR Testnet Explorer transaction receipt for contract `pandem-escrow-46cee5ca.testnet` and the GitHub repository.
- **Narration**:
  > *"Every transaction you've seen today is live and verified on the NEAR Testnet. The escrow contract is written in native Rust with 100% test coverage and strict `near-contract-audit` compliance.*
  >
  > *Pandem bridges Real-World Money with Hardware-Attested Private AI—delivering the missing billing rail for the next generation of decentralized applications.*
  >
  > *Check out the repo at github.com/shreyan001/pandem and explore the live contracts on NEAR testnet today. Thank you!"*
