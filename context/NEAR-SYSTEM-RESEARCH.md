> **Superseded in part (13-11-2026 ~19:00 IST):** shreyan allowed Rust. Pandem uses **native NEAR Rust contracts** (D-01, `docs/DECISIONS.md`). The Aurora/Solidity recommendation below is kept as research only. The findings still in use: NEAR AI Cloud billing, Shade Agents (a stage 3 option), the testnet tokens, and "1Click has no testnet".

# NEAR system research for Pandem: contracts, agent wallets, inference, payments

Researched 13-11-2026, 17:50–18:40 IST, by Orange / Coordinator. Every claim has a source. **[UNVERIFIED]** marks anything I couldn't confirm live.
Deadline: Sun 15-11-2026 05:29 IST (= 14-11-2026 23:59 UTC).
Out of scope here, because Engineering Lead owns them: hands-on deploy tests (near-sdk-js on testnet, Stillworks Solidity on Aurora) and reading other teams' hackathon repos (item 8).

**TL;DR:** The only decentralized, non-Rust contract path that works today is **Solidity on Aurora** (NEAR's EVM). It lets Pandem reuse the Stillworks contracts almost as they are. The Pandem agent should be a **Shade Agent**: a TypeScript service running in a TEE, with an agent contract on NEAR testnet and Chain Signatures giving it its own EVM/Aurora wallet. You can deploy the agent contract from a published global contract hash, so nobody writes Rust. **NEAR AI Cloud can't be paid with testnet tokens.** It bills in USD credits (card, crypto, the $10 NEAR Builders key, or mainnet "Stake for Inference"). Intents has no official testnet. **Tidepool**, a community 1Click-compatible sandbox, bridges test USDC to NEAR testnet *and* Aurora testnet.

---

## Stack versions (checked 13-11-2026)

| Piece | Version / status | Source |
|---|---|---|
| near-sdk-js (JS/TS contracts) | 2.0.0 (Jun 2024). Repo **archived** | npm `near-sdk-js`; api.github.com/repos/near/near-sdk-js (`archived: true`) |
| near-sdk-as (AssemblyScript) | npm still at 3.2.3 (May 2022), official repo archived. A **community revival** lives at github.com/gagdiez/near-sdk-as (last push 06-08-2026, 3 stars, not on npm) | npm; api.github.com/repos/gagdiez/near-sdk-as; https://x.com/vinibarbosabr/status/2082420083389845886 |
| Official contract quickstart | Rust only (`cargo near new`) | https://docs.near.org/smart-contracts/quickstart.md |
| Aurora Engine (EVM on NEAR) | Active (pushed 13-11-2026). Testnet chain id 1313161555, live | api.github.com/repos/aurora-is-near/aurora-engine; `eth_chainId` on https://testnet.aurora.dev returned `0x4e454153` |
| hardhat | 3.22.0 (12-11-2026) | npm |
| @nomicfoundation/hardhat-toolbox | 7.0.0 (14-09-2026) | npm |
| viem | 2.57.19 (13-11-2026) | npm |
| @neardefi/shade-agent-js | 2.2.0 (04-06-2026) | npm; github.com/NearDeFi/shade-agent-framework (pushed 14-10-2026) |
| @neardefi/shade-agent-cli | 2.4.0 (04-06-2026) | npm |
| chainsig.js (Chain Signatures client) | 1.1.16 (12-05-2026) | npm |
| @nearai/inference-sdk (verified NEAR AI calls) | 0.3.0 (08-11-2026). Needs Node ≥ 24.22.1 | npm; https://docs.near.ai/cloud/inference-sdk/javascript.md |
| near-api-js | 7.5.3 (11-11-2026) | npm (also in STACK-VERSIONS.md) |
| near-cli-rs | active (pushed 13-11-2026). `npm i -g near-cli-rs@latest` | https://docs.near.org/getting-started/tools-for-ai.md |
| MPC signer (Chain Signatures) | mainnet `v1.signer`, testnet `v1.signer-prod.testnet` (contract deployed) | https://docs.near.org/chain-abstraction/chain-signatures.md; testnet RPC `view_account`, 13-11-2026 |

---

## 1. Non-Rust ways to write and deploy contracts (docs-only comparison)

| Option | Language | Status 13-11-2026 | Verdict |
|---|---|---|---|
| **Aurora** (EVM is the `aurora` contract on NEAR) | Solidity (Hardhat / Foundry / viem) | Live on mainnet and testnet, actively developed | **Recommended** |
| near-sdk-js | JS/TS (bundles a JS interpreter into Wasm) | Archived. Large contracts, hard to debug (https://x.com/guillewrotethis/status/2081852920908181838) | Avoid. EL is testing whether it still deploys |
| near-sdk-as revival | AssemblyScript (TS-like, compiles to Wasm) | Community fork, not on npm. Its own author says "just don't" (https://x.com/guillewrotethis/status/2116291650003653028) | Too risky for a 1.5-day deadline |
| OutLayer (FastNEAR) | **Rust** → WASI, runs off-chain in Intel TDX | Live. Offers verifiable compute, secrets, MPC vaults, USDC payment keys, encrypted storage (https://docs.near.org/primitives/off-chain-compute/outlayer.md) | Not a contract language, and it's Rust. Skip for stage 1 |
| Existing NEAR contracts (Sputnik DAO / Trezu, FT, MPC signer, Shade agent contract) | Call or reuse them, no code needed | Live | Use them for the treasury and the agent |

**Why Aurora:**
- **Reuse.** StewardshipEscrowPayments.sol, SubscriptionEscrow.sol, ProductHealthReceiver.sol (heartbeat) and MockUSDT.sol already exist in `context/stillworks-repo/contracts/src` (Foundry project).
- **TypeScript-only tooling.** Hardhat 3 or Foundry, with viem and wagmi on the frontend, and MetaMask works as-is.
- **Reaching NEAR.** Aurora contracts can call native NEAR contracts through the **XCC precompile** `0x516Cded1D16af10CAd47D6D49128E2eB7d27b372` with `AuroraSdk.sol`. Each EVM caller gets a NEAR sub-account `<addr>.aurora`. The first use needs 2 wNEAR approved for storage. Calls are async, so results come back via callbacks (https://github.com/aurora-is-near/aurora-contracts-sdk/blob/main/docs/NearFromAurora.md).
- **Chain Signatures from Solidity.** Aurora publishes a reference contract that calls the MPC signer from Solidity (https://github.com/aurora-is-near/chain-signatures-signer/blob/main/src/ChainSignaturesSigner.sol).
- **Judging risk.** Q-011 says "Own contract on NEAR that fits the track is enough" (HACKATHON.md). Aurora *is* a NEAR contract, but judges may see Solidity as "not NEAR-native". The README must say plainly that the escrow runs on Aurora, which runs on NEAR, and must show the NEAR-native pieces: Shade agent contract, Chain Signatures, Intents.

## 2. Deploy and testnet tokens (recommended path)

**NEAR testnet (agent contract, payout, NEAR accounts)**
- `npm i -g near-cli-rs@latest`
- `near create-account pandem-agent.testnet --useFaucet --networkId testnet` (https://docs.near.org/smart-contracts/quickstart.md)
- Faucets: built-in at https://docs.near.org/getting-started/faucet, or https://near-faucet.io (NEAR, USDT, more) (https://docs.near.org/getting-started/faucet.md)
- Testnet USDC: **Circle faucet** https://faucet.circle.com gives 20 USDC on NEAR testnet every 2 h (same doc). Contract `3e2210e1184b45b64c8a434c0a7e7b23cc04ea7eb7a6c3c32520d03d4afcb8af`, live. The testnet Ref swap is also an option (https://testnet.ref.finance), as is `usdc.fakes.testnet` (live).
- RPC: `https://rpc.testnet.fastnear.com` and `https://rpc.testnet.near.org` (both answered `status` 13-11-2026)

**Aurora testnet (escrow contracts)**
- Chain id `1313161555`, RPC `https://testnet.aurora.dev` (live), explorer https://testnet.aurorascan.dev (https://thirdweb.com/aurora-testnet)
- Gas is ETH. Faucet https://aurora.dev/faucet gives 0.001 ETH a request. More: bridge Sepolia ETH via testnet.rainbowbridge.app (https://aurora.dev/faucet)
- Hardhat network block: `auroraTestnet: { type: "http", chainId: 1313161555, url: "https://testnet.aurora.dev", accounts: [process.env.DEPLOYER_KEY] }`. Hardhat 3 needs `type: "http"`. **[UNVERIFIED on Hardhat 3 by me; EL is testing]**
- Foundry: `forge script script/Deploy3_StewardshipEscrow.s.sol --rpc-url https://testnet.aurora.dev --broadcast --legacy`. The `--legacy` flag is a common Aurora requirement. **[UNVERIFIED]**
- Test USDC on Aurora: no Circle faucet for Aurora found. Two options:
  - (a) Deploy Stillworks `MockUSDT.sol` as test USDC. This is the simplest.
  - (b) The **Tidepool faucet** https://app.usetidepool.tech/faucet. Its "Tokens" tab with chain `aurora` gives 100 test USDC+USDT, 1 claim every 7 days per address. Tidepool's Aurora vault was live and holding 199,844 USDC (https://www.usetidepool.tech/v0/health, 13-11-2026 ~18:00 IST).

## 3. Agent wallets: Shade Agents + Chain Signatures

- **How it works.** A Shade Agent has two parts: an off-chain **agent**, a TypeScript service running in a TEE (Phala Cloud / Dstack by default), and an on-chain **agent contract** on NEAR that "decides who can act". The agent registers with a TEE attestation, and the contract checks approved code measurements. It then signs transactions for most chains through the MPC signer (`v1.signer`) (https://github.com/NearDeFi/shade-agent-framework/blob/main/docs/concepts/framework-overview.md).
- **Keys.** The agent never holds a long-lived private key. Its foreign addresses (EVM/Aurora, BTC, Solana) are **derived** from the agent-contract account plus a path, e.g. `aurora-1`, using `domain_id 0` (secp256k1) or `1` (ed25519). Use a separate path per chain (https://docs.near.org/chain-abstraction/chain-signatures.md).
- **TS stack.** `npm i @neardefi/shade-agent-js` (2.2.0). CLI: `npm i -g @neardefi/shade-agent-cli` (2.4.0), then `shade auth set all testnet create-new`, then `shade deploy`. The template is TypeScript + Hono (https://github.com/NearDeFi/shade-agent-template).
- **No Rust needed.** `deployment.yaml` takes `use_global_by_hash` (example hash `8eHvv9q4eovoUgDXYEduwv3dbcfXkCyPP9TSmhUSxkcm`) as one of three options, so you can deploy the reference agent contract without building it. The other two options, build from source and prebuilt wasm, need the Rust template. **[UNVERIFIED that the example hash exists on testnet]** (https://raw.githubusercontent.com/NearDeFi/shade-agent-template/main/deployment.yaml)
- **Costs.** About 8 testnet NEAR to fund the agent contract (yaml `funding_amount: 8`), plus a free Phala Cloud account and API key and Docker. **Local mode** (`environment: local`, `requires_tee: false`) runs without a TEE, which is fine for the demo. TEE mode is the upgrade.
- **Audit status.** The framework is "not yet undergone a formal audit" (README).
- **Funding the agent.** Its contract account holds NEAR for gas. Its derived Aurora address holds ETH for gas plus USDC for spending. Starting capital is a one-time transfer from shreyan's testnet account. Guardrails such as per-tx caps and allowed targets go in the agent contract or the agent code. Note that the reference contract's policy surface is whatever the template provides. **[UNVERIFIED which limits it has]**
- **Alternatives.**
  - **Agents-on-Intents Agent API**: a "policy-bound wallet" per agent with a demo key (https://partners.demo.agentsonintents.com/dashboard, base https://api.demo.agentsonintents.com). Demo keys rotate (track-07 prompt, `context/hackathon/track-07-agents.md`).
  - **Tidepool agent API**: a free `naa_` key from `POST https://www.usetidepool.tech/v1/keys`, testnet policy-bound wallets (https://www.usetidepool.tech/llms-full.txt).
  - **Shore**, "Bank accounts for AI agents, built on NEAR Intents" (https://nearcatalog.xyz/project/shore).

## 4. NEAR AI Cloud billing

- **Testnet:** **no testnet billing exists.** Nothing in the docs or OpenAPI mentions testnet. Billing is in **USD credits**, where 1 credit = $1. The API reports costs in nano-USD via `POST /v1/billing/costs` (https://docs.near.ai/llms.txt; https://docs.near.ai/api-reference/openapi.json).
- **Ways to pay:**
  1. Buy credits with a card or crypto at https://cloud.near.ai, under Credits (https://docs.near.ai/cloud/quickstart.md; HACKATHON.md Q-000).
  2. **$10 free** via NEAR Builders (https://nearbuilders.org/join, then the dashboard). This gives a separate API key with a $10 balance (HACKATHON.md Q-000).
  3. **Stake for Inference** on mainnet. You stake NEAR, the staking *rewards* accrue as credits per second, and the principal stays withdrawable. The flow is sign in, then Credits > Stake NEAR, then connect wallet (https://docs.near.ai/cloud/staking-for-inference/overview.md; https://x.com/near_ai/status/2112953664495349830, 21-10-2026). Over 1M NEAR is staked (https://x.com/near_ai/status/2112953657356632415).
- **Can the agent pay for its own inference on-chain?** Partly, and only on mainnet. Staking is wallet transactions, and an org is bound to a "staking farm" source (`POST /v1/organizations/{org_id}/staking/farm/bind`, `/sync`; House of Stake farm config). So a mainnet agent account could stake its starting capital and live off the yield. **[UNVERIFIED that a contract or agent account (vs. a human wallet) can be bound]** Per-request payment in USDC on-chain doesn't exist. The credit endpoints are org-level and marked "Deprecated: moving to cloud-platform".
- **Private models and attestation.** Open models run in GPU TEEs, and a hardware-signed attestation comes back in under 30 s. Frontier models go through a TEE gateway (https://docs.near.ai/cloud/staking-for-inference/overview.md). Use `owned_by: "nearai"` models for attestation (STACK-VERSIONS.md live check). `@nearai/inference-sdk/node` verifies the gateway TLS and response signatures.
- **For Pandem:**
  - Testnet demo: the agent uses the $10 NEAR Builders key, and the agent contract records a spend ledger in "credits" that the operator tops up.
  - Mainnet story: the agent stakes its treasury NEAR for inference. This is "funds its own inference" in the literal sense, but it needs real NEAR.

## 5. Storage: on-chain vs off-chain

- **NEAR storage staking** costs 1E19 yocto/byte, so **1 NEAR per 100 KB**, plus 40 bytes overhead per record. 770 bytes are free per account (https://docs.near.org/protocol/storage/storage-staking.md). Full inference logs on-chain are a bad idea.
- **Aurora** stores EVM state under the `aurora` account, and the user pays ETH gas. Events/logs are cheap and indexable.
- **Off-chain options:**
  - IPFS and Web4.near (https://nearcatalog.xyz/project/ipfs, /project/web4-near).
  - OutLayer encrypted persistent storage (Rust) (OutLayer doc above).
  - NEAR AI Cloud's "Stateless Responses API" stores no conversation server-side (https://docs.near.ai/cloud/guides/stateless-responses.md). That's good for privacy, but it means **we** must store what we want to keep.
- **MVP requirement:**
  - On-chain: only money state plus **hashes**, i.e. agreement status and the heartbeat timestamp in the Aurora contract, and an `inferenceReceipt(hash, costMicroUSD)` event or a log in the agent contract.
  - Off-chain: full prompts, outputs and attestation reports go in the agent's SQLite / JSON. Optionally pin them to IPFS later. Each record carries the NEAR AI `inference-id` and its attestation nonce, so anyone can re-verify.

## 6. Backend ops (a typical NEAR app today)

- **RPC.** FastNEAR (`rpc.testnet.fastnear.com`, `rpc.mainnet.fastnear.com`) and the public `rpc.*.near.org` (https://docs.near.org/api/rpc/providers, HACKATHON.md Q-009). Aurora uses `testnet.aurora.dev`.
- **Data.** Neardata (FastNEAR block stream over HTTP), BigQuery, The Graph, SubQuery, GoldSky, and Covalent for Aurora (https://docs.near.org/data-infrastructure/data-services.md). NearBlocks covers explorer and API (https://nearcatalog.xyz/project/near-blocks).
- **Typical shape.** The contracts are the source of truth. A frontend (Next.js + `@hot-labs/near-connect`, wagmi/viem for EVM) signs user transactions. A small TS backend or agent does keeper work: heartbeats, reading events by polling RPC or viem `watchContractEvent`, and calling 1Click. An indexer is optional at MVP size.
- **For Pandem.** No custodial server. The "keeper" becomes the Shade agent, which only calls *permissionless* contract functions (`releaseReviewFunds`, `declareAbandoned` when the heartbeat is stale) and its own wallet. Anyone could run the same calls.

## 7. NEAR Intents into contracts

- **Official testnet:** none exists or is planned for Intents. Use mainnet `dry: true` quotes (HACKATHON.md Q-007).
- **Into a NEAR-native contract.** 1Click `customRecipientMsg` is **HIGHLY EXPERIMENTAL**. It makes 1Click use `ft_transfer_call` instead of `ft_transfer`, and "Funds will be lost if used with non NEP-141 tokens, in case of insufficient `storage_deposit` or if the recipient does not implement `ft_on_transfer`" (https://1click.chaindefuser.com/docs/v0/openapi.yaml). That route needs a Wasm contract, which means Rust.
- **Into Aurora.** The live `/v0/tokens` list (230 tokens, 13-11-2026) has **no `aurora` blockchain entries**. The OpenAPI does have `virtualChainRecipient` / `virtualChainRefundRecipient`, described as "EVM address of a transfer recipient in a virtual chain". Aurora's own "Aurora Intents" product lists Aurora as a source and destination (https://docs.intents.aurora.dev/intents-deposits/supported-chains). **[UNVERIFIED: whether mainnet 1Click can pay USDC straight to an Aurora contract address]**
- **Testnet stand-in.** **Tidepool** (https://www.usetidepool.tech) is a community 1Click-compatible sandbox. It runs a real `near/intents` v0.4.5 verifier on testnet and has bridges for Base/Arb/Eth Sepolia, **Aurora testnet** (payouts are plain ERC-20 transfers), Solana devnet and more. Its trust model: one maker, server-derived deposit keys, "Not affiliated with NEAR, Defuse or 1Click" (https://github.com/Watchmeecryt/tidepool-examples; /v0/health live 13-11-2026).
- **Fit with a contract escrow.** A plain ERC-20 transfer gives the contract no callback. So the escrow should use one of two patterns:
  - **(a) Two-step:** Intents delivers USDC to the *payer's own* Aurora address, then the payer calls `approve` + `subscribe()`. This matches Stillworks today.
  - **(b) Deposit-then-claim:** add `subscribeFor(payer, tier)`, which pulls from a balance already credited to the contract.

  Pattern (a) is the safest for stage 1. Refunds are on-chain transfers back to the payer's Aurora address, and the payer can exit to any chain through Intents.

## 9. Relevant products from nearcatalog.xyz/llms.txt

| Need | Product | Note |
|---|---|---|
| Agent wallets | Shade Agent Framework (docs.near.org) · Chain Signatures · **Shore** ("bank accounts for AI agents", /project/shore) · HOT Wallet / HOT Protocol (chain-signature wallet) · Sender AI | Shade = recommended |
| Private inference | **NEAR AI Cloud** (/project/near-ai) · IronClaw (TEE agent harness on NEAR AI Cloud, /project/ironclaw) · OLLM confidential AI gateway · Phala Network (TEE host for Shade) · Nillion | NEAR AI Cloud = recommended |
| Agent commerce | **NEAR AI Agent Market** ("escrow-protected, paid in USDC", market.near.ai) · Near Neighbors Network (agent registry + trust badges) · Trace Commons (earn NEAR AI credits) | Pandem could list its agent on the Market later |
| Storage | IPFS · Web4.near · OutLayer (encrypted storage, Rust) | IPFS optional |
| Payments / subscriptions | NEAR Intents · **Ping Pay** ("payment layer", Agent Pay x402 facilitator) · HOT Pay (non-custodial merchant payments) · NEAR Business (confidential treasury) · Request Finance (invoicing) | None does on-chain recurring subscriptions out of the box |
| Dev tooling | **Tidepool** (free 1Click testnet sandbox, /project/tidepool) · NEAR faucet · FastNEAR · NearBlocks · Aurora | Tidepool is how Intents works on testnet |
| Treasury | Trezu / Sputnik DAO (STACK-VERSIONS.md) | For the steward/fee share |

---

## Recommended Pandem architecture (stage 1)

**Principle:** money and rules live in contracts, the agent is a TEE-run TypeScript service with its own derived wallets, and there is no custodial server.

**Contracts (stage 1, deliberately small):**
1. **Aurora testnet: `PandemEscrow.sol`**, ported from Stillworks `StewardshipEscrowPayments.sol` + `ProductHealthReceiver.sol`. It handles subscribe (approve + transferFrom on test USDC), the review window, `releaseReviewFunds`, `heartbeat()` restricted to the steward/agent, a permissionless `declareAbandoned` when the heartbeat is stale, and `claimContingencyAndRefund`. Events carry every state change.
2. **Aurora testnet: `MockUSDC`** (Stillworks `MockUSDT.sol`), or Tidepool's Aurora test USDC.
3. **NEAR testnet: the Shade agent contract** (reference implementation via `use_global_by_hash`, no Rust). It owns the agent's identity and its Chain-Signature wallets.
4. Later stages, to be debated with shreyan: product registry, subscription tiers, revenue split / waterfall (`WaterfallContingencyHub.sol`), a Trezu DAO for the fee share, and NEAR-native contracts if a TS path becomes viable.

**Agent wallet setup:**
- `pandem-agent.testnet` holds the agent contract.
- The derived EVM address (path `aurora-1`) is the agent's Aurora wallet, which is also the escrow's `steward/keeper`. It is seeded with Aurora test ETH (faucet) and some test USDC as starting capital.
- The agent runs locally in `local` mode for the demo. Phala TEE deploy is the stretch goal.

**Payments flow (testnet demo):**
1. Payer on Base Sepolia sends test USDC through Tidepool, which bridges it to the payer's Aurora testnet address.
2. Payer calls `approve` + `subscribe()` on PandemEscrow.
3. The agent sends heartbeats and later calls the permissionless release.
4. If the heartbeat goes stale, anyone can call `declareAbandoned`, and the payer refunds through `claimContingencyAndRefund`.
5. The mainnet story uses the same flow with 1Click. Show it with a `dry: true` quote in the UI.

**Inference funding:**
- **Testnet:** the agent calls NEAR AI Cloud (`owned_by: "nearai"` model, attestation verified with `@nearai/inference-sdk`) using the $10 NEAR Builders key. Each call's `inference-id`, nano-USD cost and attestation hash go to a local log, and the hash is emitted on-chain.
- **Mainnet:** the agent's treasury NEAR is staked for inference so the yield pays for its compute. That's truly self-funding, but needs real NEAR and the binding check above.

**Open questions for shreyan:**
1. **Aurora/Solidity for the escrow (recommended), or wait for EL's near-sdk-js test?** Aurora accepts some judge risk for "not NEAR-native" and depends on the Wasm path.
2. **Agent wallet:** Shade Agent, local mode now and TEE later (recommended), or the simpler Agents-on-Intents / Tidepool policy wallet?
3. **Inference funding:** use the $10 NEAR Builders key for the demo and only *describe* Stake-for-Inference, or put a little real mainnet NEAR into staking to show the self-funding loop live?
4. Is it OK to rely on Tidepool, a community and unofficial service, for the cross-chain testnet demo, or should we show mainnet `dry` quotes only?
5. Which Stillworks contract goes first: StewardshipEscrowPayments (one-time) or SubscriptionEscrow (recurring)?
