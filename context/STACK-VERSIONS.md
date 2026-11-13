# NEAR stack: verified versions (13-11-2026 17:35 IST)

**TL;DR:** Contracts are **native NEAR Rust**: near-sdk 5.30.1, cargo-near 0.23.0, near-cli-rs 0.31.1, rustc 1.100.0 (D-01). App code is TypeScript: near-api-js 7.5.3, @hot-labs/near-connect 0.12.0, Next.js 16, Node 24+. The 1Click SDK 0.1.26 is used for the mainnet edge only. NEAR AI Cloud is billed in USD credits. Orange's table below is the base. The changelogs at the end record what changed. The first changelog's "no custom contract" decision is **superseded**.

Sources: GitHub API, npm registry, official READMEs, docs.near-intents.org/llms.txt, cloud-api.near.ai, X (@NEARProtocol, @near_intents).

| Piece | Status | Use |
|---|---|---|
| near-sdk-js (JS/TS contracts) | ARCHIVED, README says "DEPRECATED, DO NOT USE, use near-sdk-rs". Last release v2.0.0 (Jun 2024) | Do not use |
| create-near-app v10.0.0 (24-10-2026) | `--contract ts` removed; contracts are Rust only | Frontend only: `npx create-near-app@latest --frontend next-app` |
| near-api-js | 7.5.3 (11-11-2026), active | Server/client RPC, signing |
| near-kit | 0.20.2 (Sep 2026) | Optional lighter client |
| near-wallet-selector | ARCHIVED, "migrate to NEAR Connect" | Do not use |
| @hot-labs/near-connect | 0.12.0 (26-10-2026), github.com/azbang/near-connect | Wallet login (+ near-connect-hooks for React) |
| @defuse-protocol/one-click-sdk-typescript | 0.1.26 (Sep 2026) | 1Click API client; base https://1click.chaindefuser.com/v0 (live, 200) |
| 1Click Confidential Swaps | in docs: confidentiality param / Confidential Intents balance | Private subscriptions |
| 1Click Reusable deposit addresses | in docs | Recurring subscription payments |
| NEAR AI Cloud | https://cloud-api.near.ai/v1 OpenAI-compatible, /models live | Private inference for the Pandem agent |
| near-cli-rs | v0.31.1 (05-11-2026) | Account creation, a binary, no Rust coding needed |

~~Implication for TS-only: no custom smart contract.~~ **Superseded: Rust is allowed, D-01.** Escrow/keeper/killswitch must be done with TypeScript server logic + NEAR accounts (near-api-js), Intents (confidential swaps, deposit addresses), or existing contracts (Sputnik DAO / Trezu multisig). D-01 spike is moot.

## Changelog: spot-checks and doc changes (13 Nov 2026, ~18:00 IST)
Method: npm registry (`npm view`), live API calls, the firstmate repo at `427056c`, docs.near-intents.org, and a few X posts. Orange's rows above were not re-researched.

### Spot-checks
| Item | Result | Source / date |
|---|---|---|
| near-api-js | 7.5.3, published 11 Nov 2026 12:37 UTC (18:07 IST). Not deprecated | `npm view`, 13 Nov 2026 |
| near-kit | 0.20.2, published 24 Sep 2026. Optional; don't mix it with near-api-js | `npm view`, 13 Nov 2026 |
| @hot-labs/near-connect | 0.12.0, published 26 Oct 2026 | `npm view` |
| @defuse-protocol/one-click-sdk-typescript | 0.1.26, published 22 Sep 2026 | `npm view` |
| @near-wallet-selector/core | 10.1.4 (4 Dec 2025). The repo is archived, so don't use it | `npm view` + Orange's row |
| next | 16.4.6 (9 Nov 2026) | `npm view` |
| openai (npm client for NEAR AI Cloud) | 7.56.0 (12 Nov 2026) | `npm view` |
| Node.js LTS | v26.13.1 (10 Nov 2026). Pandem requires >=24 | nodejs.org/dist/index.json |
| near-sandbox (npm) | 0.3.5 (4 Nov 2026). Not needed now that there is no contract | `npm view` |
| First Mate + agy | `agy` is a verified Primary, Secondmate and Crewmate/Scout (agy 1.2.0+, Linux). Primary wiring: the tracked `.agents/hooks.json` (SessionStart, PreToolUse, Stop park). Worker launch: `agy --prompt-interactive "<brief>" --dangerously-skip-permissions`. "No verified slash-skill form; use natural language." There is no `/firstmate` skill. Gemini CLI is crewmate/scout only | github.com/kunchenguid/firstmate @427056c (12 Nov 2026 23:31 PST): `harness/agy.md`, `docs/supervision-protocols/agy.md`, README |
| NEAR AI Cloud models | `/v1/models` lists 64 models. **Only `owned_by: "nearai"` models** (e.g. `Qwen/Qwen3.8-27B`, `deepseek-ai/DeepSeek-V4.1-Flash-1017`, `z-ai/glm-5.3-flash`, `Qwen/Qwen3.6-35B-A3B-FP8`) returned an attestation report. `moonshotai/kimi-k3.1-pro` returned an error. The skill's example model `deepseek-ai/DeepSeek-V3.1` is "not found" | live calls, 13 Nov 2026 ~17:50 IST; matches https://x.com/near_ai/status/2115191345468088712 |
| NEAR AI Cloud attestation | `GET /v1/attestation/report?model=<id>&signing_algo=ecdsa&nonce=<64 hex>` → `gateway_attestation`, `model_attestations[]` {`signing_address`, `signing_algo`, `signing_public_key`, `request_nonce`, `intel_quote`, `nvidia_payload`, `event_log`, `info`, `compose_manager_attestation`}, plus `ohttp_key_config`/`ohttp_attestation` (new, not yet used). The nonce was echoed | live call, 13 Nov 2026 |
| NEAR AI Cloud incident | Paused 9 Nov, back 10 Nov 2026 | https://x.com/near_ai/status/2119931564960399737, https://x.com/near_ai/status/2119996627654197384 |
| 1Click inbound (no API key) | Dry EXACT_OUTPUT 1 USDC (NEAR) ← USDC (Base) to a plain account: `amountIn` 1.010224, ~35 s. For the edge into the escrow, add `customRecipientMsg` | live dry quote, 13 Nov 2026 |
| 1Click refund route | Dry EXACT_INPUT 1 USDC (NEAR, `ORIGIN_CHAIN`) → USDC (Base) to an EVM address: out 0.997398, ~22 s | live dry quote, 13 Nov 2026 |
| Confidential Swaps | The `confidentiality:"basic"` quote returned `401 "User authentication is required for confidential intent quotes"`. It needs a `/v0/auth/authenticate` session (EVM: `erc191`) | live call + docs.near-intents.org, 13 Nov 2026; GA tweet https://x.com/NEARProtocol/status/2075968346877559026 (11 Jul 2026) |
| Reusable deposit addresses | `ANY_INPUT`, recipient = the user's own Intents account, same coin. Needs `X-API-Key` and a user session. `GET /v0/quotes` is "provisional". **Doesn't map directly to paying an escrow** | docs.near-intents.org/integration/distribution-channels/1click-api/reusable-deposit-addresses, 13 Nov 2026 |
| 1Click fees | Without a key +0.25%. With a key 0.20%, or 0.01% on stablecoin pairs. 0.0001% protocol fee. No 1Click fee on ANY_INPUT | docs.near-intents.org/resources/fees, 13 Nov 2026 |
| Treasury multisig | Trezu (NEAR DevHub) is a UI over Sputnik DAO (`sputnik-dao.near` is live on mainnet). Free setup | trezu.org, github.com/NEAR-DevHub/trezu, RPC `view_account`, 13 Nov 2026 |
| Testnet tokens | Circle testnet USDC `3e2210e1…b8af` and `usdc.fakes.testnet` both answer `ft_metadata`. The Rust spike used `wrap.testnet` | testnet RPC, 13 Nov 2026 |
| Security context | NEAR Intents exploit, 1 Oct 2026, $3.8M (Omni deposit/withdraw bug) | https://x.com/near_intents/status/2105642219357241796 |

### Doc changes made because of these (13 Nov 17:35 IST; superseded by the changelog below)
- D-01 decided: **no custom contract, custodial keeper**. M0 spike removed, milestones are now M1–M8, and lane A = `keeper/**`.
- D-03 decided: refunds go to the payer's origin chain through 1Click. D-15 to D-18 added (privacy feature, recurring payments, Trezu, SQLite).
- `customRecipientMsg` / `ft_on_transfer` removed everywhere (N/A without a contract).
- Wallet selector → `@hot-labs/near-connect` everywhere. Skills got a "Pandem note" header.
- First Mate docs: agy CLI is the primary, with plain-language commands and no `/firstmate`.

## Changelog 13-11-2026 ~19:00 IST: native NEAR staged contracts
| Piece | Version | Verified |
|---|---|---|
| near-sdk (Rust) | 5.30.1 | crates.io + Rust spike build (126 KB wasm), deployed on testnet |
| cargo-near | 0.23.0 | `cargo near build non-reproducible-wasm` |
| near-cli-rs | 0.31.1 | testnet deploy and calls |
| rustup / rustc | 1.29.3 / 1.100.0 + `wasm32-unknown-unknown` | local toolchain |
| Testnet FT | `wrap.testnet` worked end to end (`ft_transfer_call` → `ft_on_transfer` → release via `ft_transfer`) | `context/near/RESEARCH-2026-11-DECENTRALIZED.md` |

- D-01 is now **native Rust contracts in stages**. The custodial keeper is superseded. Aurora/EVM and near-sdk-js were spiked and not used.
- 1Click is edge-only (`customRecipientMsg` → `ft_on_transfer`). Refunds are native `ft_transfer`.
- Workers run on agy (default harness). No model API key is needed.
