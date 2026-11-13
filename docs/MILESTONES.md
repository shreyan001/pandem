# Milestones

**TL;DR:** M1–M8 deliver **Stage 1 on testnet** before the deadline (Sun 15 Nov 05:29 IST; written Fri 13 Nov ~18:15 IST, so about 35 h). There are about 25 working hours of work, and lanes run in parallel. Each milestone has a goal, files, a done-check and a stop. **⛔ DP** marks a decision point: the worker stops and asks shreyan (inputs listed in `docs/DECISIONS.md`). Stage 2+ contracts are design only unless there's time left.

Rules for every milestone:
- Build only that milestone.
- Paste the real done-check output.
- Commit `M<n>: <title>`.
- Stop.
- Testnet only, with throwaway faucet accounts. Never use shreyan's keys.
- Run the `near-contract-audit` checklist on contract PRs.

| # | Milestone | Lane | Hours | Depends on |
|---|---|---|---|---|
| M1 | Scaffold | I | 1.5 | — |
| ⛔ DP-1 | Stage 1 inputs S1-1…S1-8 | shreyan | — | M1 PR open |
| M2 | Escrow core + unit tests | C | 6 | DP-1 |
| M3 | Storefront + subscribe UI | W | 4 | M1 (mock data until M4) |
| M4 | Testnet deploy + scripted demo | C | 2 | M2 |
| M5 | Agent runner + chat/attestation | A | 4 | M1 (contract calls after M4) |
| M6 | Killswitch → refund end to end, `/me`, `/steward` | W + A | 3 | M3, M4, M5 |
| ⛔ DP-2 | Edge E-1/E-2 + Stage 2 inputs S2-x | shreyan | — | M6 |
| M7 | Stage 2 design + optional 1Click dry-quote panel | I (+W) | 2 | DP-2 |
| M8 | Ship | I | 2 | all; by **Sat 14 Nov 23:00 UTC (Sun 04:30 IST)** |

---
### M1. Scaffold (integrator)
**Files:**
- `contracts/Cargo.toml` (workspace) and `contracts/escrow/{Cargo.toml,src/lib.rs}`. Start from `context/near/spike-rs`, with near-sdk 5.30.1.
- `contracts/rust-toolchain.toml` (stable).
- Root `package.json` (npm workspaces web, agent, shared).
- `web/` (`npx create-next-app@latest web --ts --app --tailwind --src-dir --use-npm`).
- `agent/` (health only).
- `shared/src/{types,constants}.ts`.
- `.github/workflows/ci.yml` (cargo test + typecheck).
- `LICENSE`.

**Done-check:**
- `cd contracts && cargo near build non-reproducible-wasm` succeeds.
- `npm install && npm run typecheck` exits 0.
- `curl localhost:8787/health` returns ok.

**Stop:** commit `M1: scaffold`, open the PR, then **⛔ DP-1**: post the S1-1…S1-8 table and wait for shreyan's answers.

### M2. Escrow core (contracts lane, Rust)
**Goal:** implement TECH-SPEC §3 exactly, using the defaults or shreyan's DP-1 answers.
**Files:** `contracts/escrow/**`.
**Done-check:** `cargo test` passes the 6 behaviour groups in `docs/STILLWORKS-TO-NEAR.md` §C (paste the output), and `cargo near build non-reproducible-wasm` prints the size.
**Stop:** commit `M2: escrow core`. If an input is unclear (price units, decimals, who may call), **⛔ stop and ask** instead of guessing.

### M3. Storefront + subscribe UI (web lane)
**Files:** `web/src/**` (except `web/src/app/api/agent/**`).
**Changes:**
- Catalog grid from `shared/catalog.json` and a listing page.
- near-connect login.
- A Subscribe button that sends `ft_transfer_call` to `PANDEM_ESCROW_ID` (it stays disabled until the M4 contract id exists).
- A storage-registration check.

**Done-check:** `npm run dev -w web` → connect a testnet wallet → the Subscribe dialog shows the amount and the msg JSON. Screenshot.
**Stop:** commit `M3: storefront`.

### M4. Testnet deploy + scripted demo (contracts lane)
**Files:** `contracts/scripts/{deploy,demo}.sh` (near-cli-rs 0.31.1).
**Changes:**
- Create a throwaway faucet account (or use the account names shreyan gives).
- Deploy and run `new`.
- `storage_deposit` on the token for the escrow, steward and treasury.
- Register and approve a demo product.
- Subscribe via `ft_transfer_call`, then heartbeat, `release_period`, `declare_abandoned` and `claim_refund`.

**Done-check:** paste the tx ids and the before/after balances, showing the steward got 47.5% of a period and the subscriber got back the unreleased periods plus the contingency share.
**Stop:** commit `M4: testnet demo`.

### M5. Agent (agent lane)
**Files:** `agent/**`, `web/src/app/api/agent/**`.
**Changes:**
- A runner (TECH-SPEC §5) that signs with a function-call key on a throwaway agent account, limited to `heartbeat`, `release_period` and `claim_refund`.
- `/chat` and `/attestation` on NEAR AI Cloud (`NEARAI_API_KEY` comes from shreyan's local env; never commit it).

**Done-check:**
- The runner log shows a heartbeat and a release tx on testnet.
- `curl localhost:8787/attestation` shows that the nonce matches.

**Stop:** commit `M5: agent`.

### M6. Killswitch end to end (web + agent)
**Changes:**
- `/me`: agreements with released/refundable amounts and nearblocks testnet links.
- `/steward`: a killswitch button (`declare_abandoned`).
- The agent stops heartbeats when `agent/.killswitch` exists.

**Done-check:** in the UI, subscribe → watch one release → killswitch → the refund arrives. Screen recording.
**Stop:** commit `M6: stage 1 demo`. **This is the MVP.** Then **⛔ DP-2**.

### M7. Stage 2 design (+ optional edge)
**Changes:**
- Write `docs/STAGE-2.md`: the budget contract interface from shreyan's S2 answers.
- If E-1/E-2 are approved: a 1Click **dry** quote panel (mainnet, `customRecipientMsg`) in `web/src/app/onramp/**`.

**Stop:** commit `M7: stage 2 design`.

### M8. Ship (integrator)
**Changes:**
- README judge steps and testnet tx links.
- `LICENSE`.
- Deploy `web/` to Vercel.
- A demo video under 2 min.
- Shreyan posts on X and submits the form himself.

**Done-check:** on a clean clone, `cargo test` and `npm run typecheck` pass.
**Stop:** commit `M8: ship`.
