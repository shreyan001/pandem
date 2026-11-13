# context/: curated reference (not product code)

**TL;DR:** This folder holds background only. Product decisions are in `docs/`. Read the file that matches your task, not the whole folder. Nothing here overrides `AGENTS.md`.

| Path | What | When to read |
|---|---|---|
| `HACKATHON.md` | Official NEAR HACKATHON agent brief (rules Q-000…Q-017, tracks, submission API), saved 13 Nov 2026 from https://nearhackathon.com/HACKATHON.md. Re-read the live one before submitting | submission, rules |
| `hackathon-page.md` | Text of the nearhackathon.com landing page (tracks, timeline, FAQ) | track wording |
| `hackathon/track-0{3,7,8}-*.md` | Official track prompts for Privacy, Agent Economy, Real-World Money (from nearai/near-hackathon-prompt-examples) | track fit |
| `STACK-VERSIONS.md` | Verified package versions, dates, sources, and the 13 Nov 2026 changelog (Orange's base + spot-checks) | before adding any dependency |
| `near/INTENTS-NOTES.md` | NEAR Intents / 1Click (mainnet edge only), stablecoin and wallet notes | lane W (edge), I |
| `NEAR-SYSTEM-RESEARCH.md` | Orange's research on contracts, agent wallets, AI Cloud billing and faucets. Its Aurora recommendation is superseded by D-01 (Rust) | stages 2–4, agent |
| `near/RESEARCH-2026-11-DECENTRALIZED.md` | Spike results: Rust escrow on testnet (works); the near-sdk-js and Aurora spikes (not used) | lane C |
| `near/spike-rs/` | Working Rust reference: `ft_on_transfer` + `ft_transfer` with a rollback callback (near-sdk 5.30.1) | lane C, M1/M2 |
| `near/llms/*.txt` | Doc indexes: docs.near-intents.org, docs.near.org, nearcatalog.xyz (the NEAR apps directory). Use them to find a page, then open that page | any NEAR lookup |
| `stillworks/README.md` | What Stillworks was and how to use it here | before porting |
| `stillworks/contracts/*.sol` | The Solidity whose rules the Rust contracts port (MockUSDT omitted) | lane C, with `docs/STILLWORKS-TO-NEAR.md` |
| `stillworks/core-essence.md`, `stillworks/prd.md` | The original product thinking (CROPS, the 30/20/47.5/2.5 split, graduation stages, walkaway) | PRD later stages |
| `stillworks/reference/walkaway.ts.txt` | The browser walkaway-bundle zip generator (pure TS) to reuse in stage 2 | stage 2 |
| `firstmate/NOTES.md` | Verified First Mate facts: agy as primary and as the default worker harness | setup, work split |
| `milestone-format/EXAMPLE_*.md` | The Maana milestone spec and launch-prompt style that `docs/MILESTONES.md` follows | writing new milestones |
| `../.agents/skills/` | NEAR agent skills (near/agent-skills), each with a Pandem note on top: `near-smart-contracts`, `near-contract-audit`, `near-cli-rs`, `near-intents`, `near-kit`, `near-api-js`, `near-dapp`, `near-ai-cloud` | per task |

## Left out on purpose
- **Full Stillworks repo snapshot:** use https://github.com/shreyan001/stillworks (`main` @ 7fc916c). A local copy, if any, goes in `context/stillworks-repo/` (gitignored).
- **Gemini master starter prompt:** it starts a separate `stillworks-near/` monorepo, which is wrong for Pandem. Its useful parts (1Click flow, NEAR AI Cloud) are already in the skills and `near/INTENTS-NOTES.md`.
- **Raw Gemini chat export (96 KB):** its NEAR Intents learnings are summarised in `near/INTENTS-NOTES.md`. If you need the raw file, put it in `context/raw/` (gitignored).
- **Milestone format v1 examples:** superseded by the v2 files kept here.
