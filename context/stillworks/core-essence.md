# Stillworks: Core Product Essence & Conceptual Baseline

> **The Sovereign Software Storefront: Bilateral Escrow, Verifiable Liveness & Takedown-Proof Software Continuity**  
> *A chain-agnostic conceptual whitepaper and baseline guide for sovereign software commerce.*

---

## 1. What Stillworks Stands For: The Core Philosophy

Software-as-a-Service (SaaS) is broken for both creators and consumers:

1. **For Consumers (The Hostage Problem):**
   - **Price Escalation:** Closed SaaS tools raise subscription prices by 12–16% annually because users are trapped.
   - **Hostage Data:** Applications lock user data behind proprietary formats, opaque APIs, and export walls.
   - **Ghosting & Acquisition Death:** When a startup is acquired (e.g., Skiff shutting down after its Notion acquisition) or runs out of runway, the service terminates without warning. Paying users lose their operational workflows and historical data with zero recourse beyond credit card chargebacks.

2. **For Creators (The Monetization Dilemma):**
   - **Open Source Starvation:** High-quality open-source software (FOSS) is loved, but donations fail to pay for infrastructure and full-time maintainers.
   - **Platform Rents:** Web2 payment gateways and platforms extract 15–30% platform cuts, enforce arbitrary bans, and leave creators vulnerable to chargebacks.
   - **Speculative Distraction:** Web3 token launchpads incentivize initial speculation and hype rather than building reliable, long-running, maintainable software.

### The Purpose of Stillworks
**Stillworks is the trust rail and consumer storefront for Sovereign Software.**
It transforms open-source tools into sustainable, self-funding, censorship-resistant services:
- It eliminates the merchant-of-record middleman and replaces blind trust with **autonomous bilateral escrow**.
- Subscribers do not hand unearned capital to a creator. Instead, funds are locked in escrow and release **incrementally per period** (e.g. hourly, monthly) **only as long as** the software remains provably online and healthy.
- If the service fails, shuts down, or the founder vanishes, the subscriber automatically receives an **instant 100% pro-rata refund** of unspent funds and an encrypted **Walkaway Bundle** (their application data + an offline runtime) to run locally with zero downtime and zero data loss.
- **The system operates with local-first user privacy:** zero centralized user databases, zero trackers, and zero server-side surveillance.

---

## 2. The CROPS Framework (The 4 Pillars of Sovereign Software)

The foundation of Stillworks is the **CROPS standard** for consumer applications:

### C — Censorship Resistance
- **No Single Point of Failure:** The storefront itself survives losing its domain or centralized hosting by being pinned immutably to decentralized storage and reading directly from decentralized consensus.
- **The Sovereign Killswitch:** If a creator’s server goes dark, the user is never stranded. The escrow smart contract autonomously reimburses the user, and an exit bundle enables local or third-party redeployment.

### O — Open Source
- **100% Reproducible:** The software builds cleanly from public source code without proprietary binary blobs, undocumented backdoors, or closed APIs.
- **Verify Before Subscribe:** Users and auditing agents can verify the exact code commit, licensing, and build recipe.

### P — Privacy (The Zero-Central-DB Dual-Plane Architecture)
Stillworks strictly bifurcates the data plane into two halves:
- **Private Plane (User Device Only):** Personal notes, chat history, prompts, credentials, encryption keys, and exported files reside **strictly in the user’s local browser/device storage** (e.g., IndexedDB / local filesystem). No central database (Postgres/MongoDB) holds user identity or private application state.
- **Public Plane (Decentralized Consensus & Content Storage):** Only verifiable operational telemetry—listing terms, pricing, heartbeat proofs, uptime scores, and escrow transactions—is published publicly.

### S — Security
- **Self-Custody:** Private keys never leave the user's possession.
- **Client-Side Encryption:** Automated backups and state snapshots are encrypted client-side using wallet-derived AES-256 keys before network dispatch.

---

## 3. How Subscriptions Guarantee Future Funding for Creators

Stillworks changes subscriptions from a unilateral recurring charge into a **bilateral trust covenant**:

```
┌────────────────────────────────────────────────────────────────────────┐
│             STILLWORKS SUBSCRIPTION CAPITAL ALLOCATION                 │
├───────────────────┬───────────────────┬───────────────────┬────────────┤
│      30% OPS      │  20% CONTINGENCY  │ 47.5% REVIEW LOCK │ 2.5% HUB   │
│  INFRASTRUCTURE   │    BUG BOUNTY     │     CREATOR       │  PROTOCOL  │
│      RESERVE      │       VAULT       │   COMPENSATION    │   UPKEEP   │
└───────────────────┴───────────────────┴───────────────────┴────────────┘
```

### 1. The Escrow Mechanics
- The subscriber funds $N$ billing periods upfront into an autonomous escrow vault.
- Funds do not drop into the creator’s wallet immediately; they unlock strictly period-by-period.
- During each epoch, the creator’s service posts a signed **Heartbeat (Liveness Proof)**.
- If the heartbeat is present, the escrow unlocks that period's payment to the creator and mints a non-transferable receipt.
- **Why this guarantees future funding:** The creator has guaranteed, locked future MRR/ARR in escrow that cannot be arbitrarily cancelled or clawed back as long as their software remains online and functioning.

### 2. The 30 / 20 / 47.5 / 2.5 Stewardship Capital Split
Every unit of subscription revenue is automatically partitioned:
- **30% Operations Reserve (`opsReserve`):** Dedicated to paying infrastructure costs (hosting gas, decentralized storage pinning, compute proofs). This guarantees that even if growth temporarily stalls, the software has an autonomous runway (typically 6–12 months) to keep running without going bankrupt.
- **20% Contingency Vault (`contingencyVault`):** Reserved for community-driven maintenance. If bugs emerge or upgrades are needed, outside contributors submit proposals to earn tranches from this pool. If the founder abandons the software, this 20% pool is returned to subscribers.
- **47.5% Review-Locked Creator Payout (`reviewLockedAmount`):** The creator's direct take-home earnings. It is locked under a review period (e.g. 7 days). Once the software proves reliable for that window, funds unlock to the creator.
- **2.5% Protocol Keeper Fee (`platformServiceFee`):** Sustains automated decentralized keepers that monitor liveness, log state snapshots, and trigger automated alerts.

---

## 4. How a Proposer Performs Each Stage (Software Graduation Lifecycle)

Rather than token bonding curves that graduate on speculative volume, Stillworks software graduates across **4 verified operational milestones**:

```
Capital Unlocked
  100% ───────────────────────────────────────────┐ Stage 3: Sovereign Exit
   70% ─────────────────────────────┐             │ (Founder-optional)
   40% ───────────────┐             │ Stage 2     │
   20% ─┐             │ Stage 1     │ (Resist)    │
        │ Stage 0     │ (Private)   │             │
        │ (Genesis)   │             │             │
        └─────────────┴─────────────┴─────────────┴───────────────►
          Passport      Privacy &     Killswitch    Reproducible
          Registered    Uptime        Tested        Offline Docker
```

### Stage 0: Genesis (20% Upfront Capital Release)
- **What the Proposer Does:**
  1. Compiles the **Product Passport** (the product identity specification):
     - Open source repository URL, commit hash, and FOSS license.
     - Build recipe (Docker Compose manifest or script).
     - Storage location and data privacy declaration.
     - Third-party dependency disclosure (confirming zero external trackers).
     - Heartbeat endpoint and designated signer address.
  2. Publishes the passport to content-addressed decentralized storage.
  3. Registers the listing and links an escrow vault.
- **System State:** The listing is active. 30% of incoming subscription capital is locked into the operations reserve to guarantee hosting runway; 50% remains locked pending verification.

### Stage 1: Private (40% Upfront Capital Release)
- **What the Proposer Does:**
  1. Proves local-first client storage: demonstrates that user workspace notes, credentials, and prompts are preserved in local browser storage without server retention.
  2. Submits the software to a hardware-isolated confidential audit (TEE / zero-knowledge review) proving no data leakage.
  3. Achieves 3 consecutive verified heartbeat periods without outage.
- **System State:** Capital release ceiling increases to 40%. The product receives a verified privacy compliance badge.

### Stage 2: Resist (70% Upfront Capital Release)
- **What the Proposer Does:**
  1. Implements and rehearses the **Sovereign Killswitch**: intentionally simulates server shutdown to verify that the escrow contract unlocks pro-rata refunds.
  2. Generates and verifies **Walkaway Bundles**: provides standalone offline packages (database dump + container manifest + offline browser reader) and proves they boot successfully in an isolated sandbox.
- **System State:** Capital release ceiling increases to 70%. Subscribers have cryptographic confidence that they can exit at any moment.

### Stage 3: Sovereign Exit (100% Capital Release / Founder-Optional)
- **What the Proposer Does:**
  1. Decouples the software from their personal infrastructure.
  2. Packages the software so that it can run perpetually across decentralized compute networks (e.g. Akash, Phala, independent VPS nodes) without central administration.
  3. Validates reproducible builds where any node operator can verify the application image from source.
- **System State:** The product achieves **Mature Sovereign Status**. The founder receives 100% of unreserved subscription revenue, and the software is guaranteed to survive indefinitely even if the original creator steps down.

---

## 5. Maintenance & Succession: How the Product Never Dies

### The Waterfall Contingency Reward Hub
In traditional SaaS, users cannot fix bugs in proprietary software. In Stillworks:
- When a bug or feature need arises, any community contributor or steward can submit a **Fix Proposal**.
- **Rules of the Waterfall:**
  - Maximum 1 proposal per week per product (prevents treasury draining).
  - Maximum request: **15%–20% of the product’s accumulated contingency vault**.
  - Proposer must attach an open patch proof (git diff / container hash).
  - Active subscribers vote on the fix; voting weight is directly proportional to their subscription tier.
- If approved, the smart contract automatically remits the bounty to the contributor.

### Automated Steward Succession
What if a creator burns out, becomes unresponsive, or vanishes?
1. If the creator fails to post heartbeats for consecutive grace periods, the protocol flags the product as `Abandoned`.
2. Any active contributor can submit a **Succession Proposal** offering a new maintainer address, new frontend root, and new walkaway backup root.
3. Subscribers vote during a fast turnaround window.
4. If approved, the protocol transfers stewardship and redirects future subscription flows to the new maintainer.
5. **Outcome:** Software becomes a self-sustaining public utility.

---

## 6. The Walkaway Bundle: What the User Actually Gets

When a user elects to leave (or when the killswitch triggers), Stillworks packages a self-contained exit bundle:
1. **Container Manifest (`docker-compose.yml`):** Runs the service locally on their laptop or private server.
2. **Local Data Backup:** A sanitized, client-side export (e.g. SQLite database dump).
3. **Automated Restore Scripts:** One-click bash/batch scripts (`restore.sh`, `restore.bat`) that launch the local stack in seconds.
4. **Offline Reader:** A zero-dependency, single-file HTML/JS reader allowing the user to search, view, and export all their historical records without needing Docker or a terminal.
5. **Cryptographic Integrity Manifest:** Binds the backup to its content-addressed decentralized storage root.

---

## 7. Comparison: Stillworks vs Existing Models

| Feature | Centralized SaaS (Notion, Substack) | Lifetime Deal (AppSumo) | Token Launchpads (Pump.fun) | Stillworks (CROPS Storefront) |
| :--- | :--- | :--- | :--- | :--- |
| **Payment Model** | Unilateral monthly charge | 1-time upfront payment | Token speculation | Bilateral escrow with sequential release |
| **If Founder Ghosts** | Service dies; data lost | Cash kept; product abandoned | Rug pull; token collapses | Escrow refunds 100% pro-rata; walkaway bundle runs offline |
| **Data Privacy** | Server inspects & logs | Server inspects | Varies (mostly public) | Dual-plane: 100% local-first on user device |
| **Infra Sustainability** | Founder cloud bill | Founder runs out of money | Speculative treasury | Automated 30% operations reserve |
| **Graduation Metric** | Valuation / Venture rounds | Total units sold | Speculative trading volume | Proven uptime, killswitch & reproducible builds |
| **Community Fixes** | Impossible (closed source) | Closed source | None | 20% Contingency Vault with subscriber voting |
