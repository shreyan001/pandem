<!-- firstmate:maintained-by-project -->
# AGENTS.md: Pandem working rules

**TL;DR:** Pandem is a NEAR storefront for private SaaS subscriptions. Escrow is a staged set of **native NEAR Rust contracts** (`contracts/**`). The web app and the agent are TypeScript. Payments are USDC (NEP-141) on NEAR. Everything runs on **testnet**. Do one milestone from `docs/MILESTONES.md`, touch only your lane (`docs/WORK-SPLIT.md`), and **stop at every ⛔ decision point** to ask shreyan.

agy workers read this file through `GEMINI.md`, and Claude reads it through `CLAUDE.md`.

## What you are building
- Stage 1: one `escrow` contract, a one-to-one port of the Stillworks rules (`docs/STILLWORKS-TO-NEAR.md`). It covers subscribe via `ft_on_transfer`, the 2.5/30/20/47.5 split per released period, heartbeats, the killswitch, and refunds with the D-14 offset. Interface: `docs/TECH-SPEC.md` §3.
- Later stages (budget, agent-wallet, registry): `docs/DECISIONS.md` stage plan.
- Specs: `docs/PRD.md`, `docs/ARCHITECTURE.md`. Versions: `context/STACK-VERSIONS.md`. Research and spike: `context/near/RESEARCH-2026-11-DECENTRALIZED.md`, `context/NEAR-SYSTEM-RESEARCH.md`.

## Hard rules
1. **Contracts:** Rust with near-sdk 5.30.1 and cargo-near 0.23.0, in `contracts/**`. **App code:** TypeScript.
2. **Testnet only.** Use throwaway faucet accounts you create (`near account create-account sponsor-by-faucet-service`). Never read or use shreyan's keys, `.env` files or named accounts, never touch mainnet, and never spend real money.
3. **Decision points:** if a milestone shows ⛔, or a contract input isn't settled in `docs/DECISIONS.md`, stop and ask shreyan with the options and the default. Don't guess.
4. **One milestone per task.** Paste the real done-check output, commit `M<n>: <title>`, and stop.
5. Stay in your lane's files. Contract interface changes go in the same PR as an update to TECH-SPEC §3.
6. Never commit secrets (`.env*`, `.near-credentials/`, keys).
7. Run the `near-contract-audit` checklist on contract PRs: state changes before promises are rolled back in a `#[private]` callback, `ft_on_transfer` checks the token, no u128 overflow.
8. README and UI claim only what has shipped. No marketing words.

## Where things are
| Path | What |
|---|---|
| `contracts/` | Cargo workspace; `escrow` (stage 1) |
| `web/` | Next.js storefront, subscribe, `/me`, `/steward`, `/agent` |
| `agent/` | TS runner (heartbeat/release/refund) and chat on NEAR AI Cloud |
| `shared/` | TS types and constants (integrator only) |
| `context/near/spike-rs/` | Working Rust reference (ft_on_transfer + ft_transfer with callback) |
| `.agents/skills/` | NEAR skills. Read each skill's "Pandem note" first |

## Commands (after M1)
`cd contracts && cargo test && cargo near build non-reproducible-wasm` · `npm install` · `npm run typecheck` · `npm run dev -w web` · `npm run dev -w agent`

## Facts that are easy to get wrong
- `ft_transfer` / `ft_transfer_call` need exactly 1 yoctoNEAR. Receivers need `storage_deposit` on the token first.
- `ft_on_transfer` must check `predecessor == token_id` and return the unused amount as `U128`. Never panic on a bad msg: return the full amount instead.
- Cross-contract calls are async. Mutate state first, then roll it back in the callback if the promise failed.
- The agent's function-call key can't attach deposits. That's fine, because the contract pays the 1 yocto for its own `ft_transfer`.
- 1Click is a **mainnet-only edge on-ramp**. It is never used for internal flows.
- NEAR AI Cloud bills in USD credits. Only `owned_by: "nearai"` models have attestation.
- Wallet: `@hot-labs/near-connect` (wallet-selector is archived). near-api-js 7.5.3.

## Maintaining this file
Keep this file for knowledge useful to almost every future agent session in this project.
Do not repeat what the codebase already shows; point to the authoritative file or command instead.
Prefer rewriting or pruning existing entries over appending new ones.
When updating this file, preserve this bar for all agents and keep entries concise.
