> **Pandem note (added 13 Nov 2026):** This is the old Stillworks PRD, kept for reference only. Its Rust / `near-sdk-rs` / `cargo near` direction now matches Pandem (D-01), but its specifics are old. Product decisions live in `docs/PRD.md`, and the contract interface is in `docs/TECH-SPEC.md` §3.

# STILLWORKS: Sovereign SaaS Storefront & Autonomous Escrow Rail on NEAR
**Document Type:** Master Product Requirements Document (PRD) & Product Information Sheet  
**Target Event:** NEAR Hackathon (Tracks: Autonomous Business `#business`, Privacy & Private AI `#privacy`, Agent Economy `#agents`)  
**Sprint Window:** 10 Hours Remaining (P0 Execution Mode)

---

## 0. Executive TL;DR (Point-by-Point Kickoff Summary)

* **What Stillworks Is:** A decentralized SaaS storefront and autonomous escrow protocol combining **Product Hunt** (discovery ranked by verified MRR, uptime heartbeats, and TEE privacy audits), **Stripe** (private cross-chain recurring subscriptions via NEAR Intents), and **GitHub Issues** (a public bug-bounty portal backed by locked subscription revenue).
* **The Core Thesis ("Progressive Sovereignty"):** Developers refuse to open-source their repositories on Day 1 for free. Stillworks lets founders launch **closed-source or private SaaS** inside hardware-encrypted Trusted Execution Environments (**NEAR OutLayer** + **Phala/Shade Agent Intel TDX enclaves**). User privacy is cryptographically guaranteed today, while **open-sourcing and Walkaway Bundle decryption** are bound to either:
  1. **A Revenue Graduation Milestone** (e.g., reaching $\$50,000$ in verified cumulative escrow revenue unlocks $100\%$ of reserves upon open-sourcing), OR
  2. **A Collapse / Dead-Man's Switch** (if the founder's server misses heartbeats past the grace window, the protocol auto-refunds unspent subscription periods and decrypts the user's self-hosted **Walkaway Bundle**).
* **Component Replaceability Mandate:** Instead of demanding Day-1 open-source code, Stillworks enforces **100% Component Replaceability**. Every listed application must declare a machine-readable `ProductPassport` specifying its compute host, AI inference model, database, and storage layer so any module can be hot-swapped without breaking user state.
* **The 30 / 20 / 47.5 / 2.5 Self-Funding Split:** Every subscription dollar paid via **NEAR Intents** is split on-chain:
  * **$30\%$ Operations Reserve (`opsReserve`):** Locked in an OutLayer MPC policy wallet that autonomously pays the app's server hosting and **NEAR AI Cloud** inference bills (founders can launch with $\$0$ cloud or marketing budget).
  * **$20\%$ Contingency Bug-Bounty Vault (`contingencyVault`):** Funds public bug reports. If a critical bug is filed, the founder's payout pauses until they (or an external developer/agent) ship an attested fix.
  * **$47.5\%$ Creator Revenue (`reviewLockedAmount`):** Streams period-by-period to the founder upon valid heartbeat attestation.
  * **$2.5\%$ Protocol Keeper Fee (`platformServiceFee`):** Pays the heartbeat monitors and NEAR AI Cloud auditing agents.
* **Real-World Flagship Use Case:** **Postiz Private AI Edition** (`gitroomhq/postiz-app` social media scheduler + autonomous marketing agent) running inside a confidential container, using **NEAR AI Cloud** (`cloud-api.near.ai`) for zero-leak AI copywriting/scheduling, and accepting private cross-chain USDC/SOL/ETH subscriptions via the **NEAR Intents 1Click API** and **PingPay (`x402`)**.

---

## 1. Comprehensive Product Information Sheet

| Attribute | Specification |
| :--- | :--- |
| **Product Name** | **Stillworks** |
| **One-Line Pitch** | The sovereign software storefront where SaaS apps fund their own infrastructure, prove zero data leakage via hardware enclaves, and guarantee a pro-rata refund plus a self-hosted Walkaway Bundle if the founder ever vanishes. |
| **Target Users (Buyers)** | Everyday SaaS consumers, indie teams, and autonomous AI agents purchasing recurring software or metered APIs (`x402`) who want privacy and immunity from vendor shutdowns. |
| **Target Users (Builders)** | SaaS founders and AI builders who want instant monetization, automated OpEx management, and trust-based discovery without giving away their proprietary code on Day 1 or paying $15\%\text{--}30\%$ Web2 Merchant-of-Record rents. |
| **Core Settlement Layer** | **NEAR Protocol Mainnet / Testnet** (`near-sdk-rs` smart contracts) + **NEAR Intents (`1Click API`)** for chain-abstracted cross-chain payments (ETH, Base, Arbitrum, Solana, NEAR). |
| **Confidential AI & Audit Layer** | **NEAR AI Cloud** (`https://cloud-api.near.ai/v1`) running open-weight LLMs (`DeepSeek-V3.1`, `Qwen2.5-72B-Instruct`) inside Intel TDX + NVIDIA H100 TEEs with cryptographic hardware attestation quotes. |
| **Confidential Off-Chain Compute** | **NEAR OutLayer** (WASI Intel TDX enclaves + MPC Key Derivation Vaults) for heartbeat verification, automated OpEx bill payment, and conditional Walkaway Bundle key release; **Phala Cloud / Akash TEE** for heavy Docker Compose SaaS stacks. |
| **Censorship-Resistant Storage** | **NEAR FastFS / IPFS** for pinning the static Stillworks storefront, `ProductPassport` JSONs, and AES-256-GCM encrypted `Walkaway Bundles`. |
| **Agent Payment Standard** | **PingPay & HTTP `x402`** (`402 Payment Required`) enabling autonomous agents (OpenClaw / Hermes) to rent SaaS instances or pay per inference call without human checkout. |

---

## 2. How Stillworks Works: Progressive Sovereignty & Capital Mechanics

### 2.1 The 3-Stage Progressive Sovereignty Lifecycle
Unlike rigid frameworks that force $100\%$ open-source compliance before a product has a single customer, Stillworks aligns developer incentives with user protection across three verified stages:

1. **Stage 0 — Verified Private Launch (Closed-Source Permitted):**
   * The developer deploys their application container or binary inside an attested TEE (**OutLayer** or **Phala Confidential VM**).
   * The developer uploads an **AES-256-GCM encrypted Walkaway Bundle** (`docker-compose.yml` + build recipe + schema export script) to FastFS/IPFS, and registers the decryption key inside an **OutLayer MPC Vault** governed by the NEAR smart contract.
   * **NEAR AI Cloud** audits the deployment manifest and network egress rules, publishing a signed `auditRequestId` proving the app cannot leak user data or train on customer inputs.
2. **Stage 1 — Attested Scale & SLA Bug Portal (Revenue Streaming):**
   * Subscribers pay from any blockchain via **NEAR Intents**. Every attested heartbeat period mints a non-transferable invoice in `InvoiceRegistry`, building a verifiable on-chain MRR/ARR track record.
   * $30\%$ of incoming funds (`opsReserve`) automatically pay the app's NEAR AI Cloud inference and container hosting invoices.
   * If a subscriber submits a reproducible bug to the **Stillworks Issue Portal**, a bounty from the $20\%$ `contingencyVault` is attached. If the issue is marked `CRITICAL` and exceeds the SLA window, the founder's $47.5\%$ stream pauses until a verified patch is deployed.
3. **Stage 2 — Sovereign Graduation or Dead-Man's Exit:**
   * **Path A (Revenue Milestone Graduation):** Once cumulative verified revenue in `InvoiceRegistry` crosses the founder's declared `graduationRevenueTarget` (e.g., $\$50,000$), the founder can open-source the repository to unlock $100\%$ of unspent contingency reserves and achieve **Mature Sovereign Status**.
   * **Path B (The Sovereign Killswitch):** If the product fails to post a signed heartbeat within $\text{periodLength} + \text{graceWindow}$, the contract transitions the listing to `Abandoned`. Subscribers immediately claim a $100\%$ pro-rata refund for all unelapsed periods, and **OutLayer MPC** releases the decryption key to the **Walkaway Bundle** so users can boot the entire stack locally via `docker compose up`.

### 2.2 Trust & Ranking Formula (No Upvote Gaming)
Stillworks replaces Product Hunt upvotes with a deterministic **Sovereign Trust Score** ($S_{\text{total}} \in [0, 100]$) computed directly from on-chain state and NEAR AI Cloud attestations:

$$S_{\text{total}} = 0.35 \times L_{\text{uptime}} + 0.35 \times P_{\text{passport}} + 0.15 \times R_{\text{replaceability}} + 0.15 \times E_{\text{sla}}$$

Where:
* $L_{\text{uptime}} = \left(\frac{\text{AttestedPeriods}_{12}}{\text{ElapsedPeriods}_{12}}\right) \times 100$ (Rolling 12-period heartbeat liveness).
* $P_{\text{passport}} \in [0, 100]$ is the **NEAR AI Cloud** hardware-attested privacy and zero-leakage score.
* $R_{\text{replaceability}} \in [0, 100]$ measures how many of the 4 core stack slots (Compute, AI Inference, Database, Storage) use open standard interfaces with declared drop-in replacements.
* $E_{\text{sla}} \in [0, 100]$ is the ratio of resolved issues to total reported issues within the SLA window on the public Issue Portal.

---

## 3. Real-World Use Case: "Postiz Private AI" & Confidential AI Services

To demonstrate Stillworks in a 10-hour hackathon sprint with zero fake mocks, the storefront ships with **two live, real-world SaaS listings**:

### Use Case 1: Postiz Private AI Edition (Multi-Container Agentic SaaS)
* **The Real-World Problem:** Creators, agencies, and Web3 protocols use **Postiz** (`gitroomhq/postiz-app`) to schedule X/LinkedIn posts and run autonomous marketing agents. However:
  1. Cloud-hosted social schedulers hold raw OAuth tokens and unreleased campaign announcements in centralized Postgres databases.
  2. Their built-in AI copilot sends private brand strategy prompts to centralized LLM providers that log prompts for training.
  3. If the hosted SaaS raises prices or shuts down, users lose their scheduled queues and historical analytics.
* **How It Runs on Stillworks + NEAR:**
  1. **Deployment:** The Postiz stack (`Next.js` + `NestJS` + `PostgreSQL` + `Redis` + `Temporal`) runs inside a **Phala Cloud Intel TDX Confidential VM** (managed via a NEAR Shade Agent).
  2. **Confidential AI Inference:** Postiz's `OPENAI_BASE_URL` is pointed directly to **NEAR AI Cloud** (`https://cloud-api.near.ai/v1`). Every AI-generated social thread runs inside an NVIDIA H100 TEE and returns a verifiable cryptographic attestation quote.
  3. **Self-Paying OpEx:** When a user subscribes for $\$15/\text{month}$ in USDC on Base via **NEAR Intents**, $\$4.50$ ($30\%$) enters the `opsReserve` bucket, which automatically tops up the app's NEAR AI Cloud API credits and container compute balance.
  4. **Walkaway Continuity:** Every period, an encrypted snapshot of the user's scheduled posts, analytics SQLite/Postgres dump, and a ready-to-run `docker-compose.yml` is pinned to FastFS. If the host goes dark, the user clicks **"Claim Refund & Download Walkaway"** and starts Postiz on `localhost:4200` in 30 seconds.

### Use Case 2: ZeroLeak Contract & Research Auditor (Native NEAR AI Cloud SaaS)
* **The Real-World Problem:** Teams need an AI SaaS to summarize confidential legal agreements, M&A docs, or unreleased code without leaking data to OpenAI/Anthropic or getting locked into a $\$40/\text{month}$ subscription.
* **How It Runs on Stillworks + NEAR:**
  1. **Deployment:** Stateless frontend pinned on **NEAR FastFS**; backend logic runs inside a **NEAR OutLayer WASI enclave** calling **NEAR AI Cloud** (`deepseek-ai/DeepSeek-V3.1`).
  2. **Replaceability:** The `ProductPassport` declares two hot-swappable inference endpoints (`cloud-api.near.ai` primary, local `Ollama` fallback inside the Walkaway Bundle).
  3. **Agent-Callable (`x402`):** Exposes `/api/x402/audit` so external autonomous agents can pay $0.05$ USDC per document via **NEAR Intents / PingPay** without a human account.

---

## 4. End-to-End Deployment Locations & Component Matrix

| System Layer | Technology / Provider | Exact Deployment Location & Method | Replaceability Fallback |
| :--- | :--- | :--- | :--- |
| **1. Storefront UI & Client** | Next.js 15 (Static Export `output: 'export'`) + Tailwind CSS | Deployed to Vercel/Cloudflare for fast hackathon judging **AND** pinned immutably to **NEAR FastFS / IPFS** so it survives domain takedown. | Any IPFS gateway or local static file server (`npx serve out`). |
| **2. Escrow, Registry & Issue Portal** | Rust (`near-sdk = "5.6.0"`) compiled to WASM | Deployed to **NEAR Testnet / Mainnet** (`stillworks-v1.testnet` / `.near`) via `cargo near deploy`. | State is public on NEAR L1; any frontend can call RPC directly. |
| **3. Cross-Chain Private Checkout** | **NEAR Intents (`1Click API`)** + `@near-wallet-selector` | REST calls to `https://1click.chaindefuser.com/v0/quote` + solver settlement into the NEAR escrow contract. | Direct NEAR native `ft_transfer_call` or `near_deposit`. |
| **4. Confidential AI Audit & SaaS Inference** | **NEAR AI Cloud** (`cloud-api.near.ai`) | OpenAI-compatible SDK pointing to `https://cloud-api.near.ai/v1` + hardware attestation fetch from `/v1/attestation/report`. | Local `Ollama` / `vLLM` declared in the Walkaway Bundle `docker-compose.yml`. |
| **5. Heartbeat Worker & Key Vault** | **NEAR OutLayer** / Node.js TEE Worker | Runs as a background verifier polling SaaS `/health` endpoints, signing `heartbeat()` transactions, and releasing AES Walkaway keys when `status == Abandoned`. | Self-hosted CLI decryptor using wallet-derived WebCrypto signature. |

---

## 5. The 3-Minute Hackathon Demo Script (Build Strictly to This Path)

* **0:00 $\rightarrow$ 0:25 | The Hook & Leaderboard:** Open the Stillworks storefront. Show **Postiz Private AI** and **ZeroLeak AI Auditor** ranked by their live **Sovereign Trust Score**, verified MRR from `InvoiceRegistry`, and green **NEAR AI Cloud TEE Attestation** badges.
* **0:25 $\rightarrow$ 1:00 | Live NEAR AI Cloud Passport Audit:** Click into **Postiz Private AI**. View the **Component Replaceability Matrix** (Compute: Phala TDX, AI: NEAR AI Cloud, DB: Postgres w/ SQLite Export). Click **"Verify Privacy & Data Lineage"**—watch **NEAR AI Cloud** analyze the passport in real time and return a cryptographic Intel TDX / H100 attestation quote ID.
* **1:00 $\rightarrow$ 1:40 | Cross-Chain Subscribe via NEAR Intents (30/20/47.5/2.5 Split):** Subscribe for 3 periods using USDC via the **NEAR Intents 1Click API** modal (or NEAR wallet). Show the on-chain `SubscriptionEscrow` dashboard automatically splitting funds into **$30\%$ OpEx Reserve** (paying the app's NEAR AI Cloud inference budget), **$20\%$ Bug Bounty Vault**, **$47.5\%$ Creator Stream**, and **$2.5\%$ Keeper Fee**.
* **1:40 $\rightarrow$ 2:10 | Public Issue Portal & Economic Incentive:** File a live bug report on the Stillworks Issue Portal (`"OAuth scheduler retry timeout"`). Watch a bounty from the $20\%$ `contingencyVault` attach to the issue and pause the founder's review-locked stream until patched.
* **2:10 $\rightarrow$ 3:00 | The Sovereign Killswitch & Walkaway Bundle:** Toggle **"Simulate Founder Server Shutdown"** in the demo control bar. The heartbeat misses its grace window. Click **"Claim Pro-Rata Refund & Decrypt Walkaway Bundle"**—the smart contract refunds the 2 remaining unelapsed periods, unlocks the AES-256 Walkaway Bundle (`docker-compose.yml` + exported posts + single-file HTML Offline Reader), and opens the user's data locally with zero data loss.