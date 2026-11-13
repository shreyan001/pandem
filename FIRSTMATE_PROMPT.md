# Round-one kickoff (paste into First Mate running in agy)

**TL;DR:** Run `cd firstmate && agy`, wait for the session digest, then paste the block below as a normal message. There is no `/firstmate` command. Workers run on agy with your Google sign-in (leave `config/crew-harness` unset), so no API key is needed. The block registers Pandem, runs the scaffold, stops to ask you the Stage 1 contract inputs, and then runs the contracts, web and agent lanes in parallel. Everything stays on testnet.

**Step 1, in a terminal:**
```
cd firstmate && agy
```
**Step 2, paste this as a message:**
```
ahoy! New project: github.com/shreyan001/Pandem. Register it as Pandem [direct-PR], yolo off. Workers use agy (default harness).
Every task first reads AGENTS.md, its own milestone in docs/MILESTONES.md, docs/WORK-SPLIT.md, docs/DECISIONS.md, and the "Pandem note" at the top of each skill it uses in .agents/skills/.
Rules: contracts are native NEAR Rust (near-sdk 5.30.1, cargo-near 0.23.0) in contracts/**; web and agent are TypeScript. TESTNET ONLY: use throwaway faucet accounts (near account create-account sponsor-by-faucet-service); never read or use my keys or .env files (only the throwaway testnet keys you create yourself), never touch mainnet, never spend. Touch only your lane's files. Paste real done-check output in the PR, commit "M<n>: <title>", stop at the done-check.
DECISION POINTS: whenever a milestone hits a ⛔ in docs/MILESTONES.md, or a contract input is not settled in docs/DECISIONS.md, STOP and ask me with the options and the default. Don't guess.

Round 1 (one worker, integrator lane I):
M1 scaffold: contracts/ Cargo workspace with contracts/escrow started from context/near/spike-rs; npm workspaces web/agent/shared; CI; LICENSE. Done-check: cargo near build non-reproducible-wasm succeeds, npm install && npm run typecheck exits 0, agent /health ok. Open the PR, then ⛔ DP-1: post the S1-1..S1-8 table from docs/DECISIONS.md and wait for my answers.

Round 2, after I merge M1 (parallel):
- Lane C (contracts/** only, Rust): M2 escrow core + unit tests. Start ONLY after my DP-1 answers; then M4 testnet deploy + scripted demo on throwaway accounts.
- Lane W (web/** except web/src/app/api/agent/**): M3 storefront + subscribe UI with @hot-labs/near-connect and ft_transfer_call (mock contract id until M4).
- Lane A (agent/** and web/src/app/api/agent/**): M5 agent runner (function-call key on a throwaway testnet account, only heartbeat/release_period/claim_refund) + chat/attestation on NEAR AI Cloud.
Then M6 (W + A) killswitch → refund end to end, then ⛔ DP-2 (ask me E-1, E-2, S2-x) before M7.
Merge order: C, W, A. After each merge run: cd contracts && cargo test, and npm install && npm run typecheck. Give me bearings when round 2 is in review.
```
