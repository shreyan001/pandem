# Pandem

**TL;DR:** Pandem is a storefront for private SaaS subscriptions, built natively on NEAR. You pay in USDC on NEAR straight into a **Rust escrow contract**. The contract pays the provider one period at a time while the provider's heartbeat arrives, and anyone can trigger a refund of the unspent periods when it stops or the steward pulls the killswitch. The rules are enforced on-chain, not by a server holding the keys. The contracts are built in stages: **stage 1 (the escrow) is the testnet demo**, and budget, agent-wallet and registry contracts follow. **Status:** this is the planning pack. There is no app code yet; work starts at M1.

- Repo: https://github.com/shreyan001/Pandem · Domain: pandem.xyz
- Hackathon: NEAR HACKATHON (https://nearhackathon.com). Submissions close **14 Nov 2026 23:59 UTC = Sun 15 Nov 2026 05:29 IST**.
- Target tracks: **Real-World Money (`realworld`)**, plus **Privacy & Private AI (`privacy`)**. See `docs/PRD.md`.

## What stage 1 does (planned, testnet)
1. Pick a product in the storefront, or ask the Pandem agent.
2. Connect a NEAR wallet (near-connect) and subscribe. One `ft_transfer_call` sends USDC (testnet token, `docs/DECISIONS.md` S1-1) to the escrow contract, which records your agreement in `ft_on_transfer`.
3. Each period, once the provider's heartbeat for that period is on-chain, `release_period` splits that period's payment: 47.5% to the steward, 2.5% protocol fee, 30% ops reserve, 20% contingency.
4. If heartbeats stop past the grace window, or the steward declares the product abandoned, `claim_refund` returns the unreleased periods (plus your contingency share if abandoned) to your wallet.
5. A TypeScript agent sends heartbeats and triggers releases and refunds. It holds only a function-call key. It chats through NEAR AI Cloud, and the UI shows the attestation.

## Honest limits
- Testnet only for the hackathon. Testnet USDC is a stand-in (Circle testnet USDC, `wrap.testnet`, or a mock NEP-141).
- Cross-chain payment through NEAR Intents 1Click is a **mainnet-only edge on-ramp** (1Click has no official testnet). It delivers USDC to the escrow with `customRecipientMsg`. Internal flows never use it.
- NEAR AI Cloud inference is paid with USD credits (a builders key). Stake-for-Inference is mainnet only and comes in stage 3+.
- During the hackathon the escrow account keeps a full-access key so it can be upgraded (S1-8). It is not immutable yet; removing that key is a later step.
- The heartbeat proves the provider's signer is active, not that the service is good.

## How NEAR is used
| Need | NEAR piece |
|---|---|
| Escrow, split, heartbeat, refund | Rust contract (near-sdk 5.30.1, cargo-near 0.23.0) |
| Payment | NEP-141 `ft_transfer_call` → `ft_on_transfer`, USDC on NEAR |
| Login and signing | `@hot-labs/near-connect` 0.12.0, near-api-js 7.5.3 |
| Agent | function-call key limited to heartbeat/release/refund; NEAR AI Cloud with TEE attestation |
| Cross-chain on-ramp (mainnet edge) | NEAR Intents 1Click `EXACT_OUTPUT` + `customRecipientMsg` |
| Later stages | budget, agent-wallet and registry contracts, plus a Sputnik/Trezu treasury (`docs/DECISIONS.md`) |

## Prior work disclosure (hackathon rule Q-002 / Q-005)
The escrow, heartbeat, killswitch and walkaway rules come from the author's earlier **Stillworks** project (ETHGlobal, Solidity on 0G; https://github.com/shreyan001/stillworks). It is kept for reference in `context/stillworks/`, and `docs/STILLWORKS-TO-NEAR.md` maps each Solidity function to its Rust method. All code in this repo is new NEAR Rust/TypeScript work written during the hackathon window.

## Repo layout
```
AGENTS.md            rules for every coding agent (GEMINI.md and CLAUDE.md point here)
FIRSTMATE_PROMPT.md  paste-ready kickoff for First Mate in agy
docs/                PRD, tech spec, architecture, Solidity→Rust map, milestones, work split, decisions, submission
context/             reference: stack versions, NEAR research + Rust spike (context/near/spike-rs), Stillworks source, rules, First Mate notes
.agents/skills/      NEAR agent skills, each with a "Pandem note" on top
contracts/ web/ agent/ shared/   created in milestone M1
```

## Running the build with First Mate in Antigravity CLI (`agy`)
1. **Start** with `cd firstmate && agy`. You get a session digest. Talk in plain language ("ahoy", "bearings", "afk"); there is no `/firstmate` command.
2. **Workers** run on agy with your Google sign-in by default. Leave `config/crew-harness` unset; no API key is needed.
3. **Kick off** by pasting `FIRSTMATE_PROMPT.md`. M1 is the scaffold. Then workers **stop at ⛔ DP-1** and ask you the stage 1 contract inputs (`docs/DECISIONS.md`). After you answer, the contracts (Rust), web and agent lanes run in parallel.
4. Each worker gets its own worktree on an `fm/<task>` branch and opens a PR. You approve the merges. Everything runs on testnet with throwaway accounts.

## Status
| Milestone | State |
|---|---|
| Rust escrow spike (ft_on_transfer + release via ft_transfer) | worked on testnet; see `context/near/RESEARCH-2026-11-DECENTRALIZED.md` |
| M1–M8 | not started (`docs/MILESTONES.md`) |

## License
MIT is proposed (`docs/DECISIONS.md` D-09). The hackathon asks for a LICENSE file in the public repo.
