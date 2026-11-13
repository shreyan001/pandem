# PRD: Pandem

**TL;DR:** The hackathon deliverable is **stage 1 on testnet**: one native NEAR Rust escrow contract. A subscriber pays USDC (NEP-141) with `ft_transfer_call`. The contract releases one period at a time while the provider's heartbeat is on-chain, applies the 2.5/30/20/47.5 split, and lets anyone trigger a refund when the heartbeats stop or the steward pulls the killswitch. A TypeScript agent with only a function-call key runs heartbeats and upkeep, and chats through NEAR AI Cloud. Later stages add budget, agent-wallet and registry contracts. Funds sit in the contract, not in an operator's account (an upgrade key stays on testnet, S1-8).

## 1. Problem
- **Buyers** of SaaS carry the risk of data leaks, of their data being used to train models, of breaches of data law, of lock-in, and of shutdowns that take prepaid money and data with them.
- **Providers** who would sell a private or decentralized edition at a higher price have no trusted way to prove they deliver it, or to get paid against that proof.
- **Escrow you have to trust** is no better than prepaying. The rules must be enforced by code that no one can change quietly.

## 2. Users
| User | Wants |
|---|---|
| Subscriber (NEAR wallet; mainnet later: any chain through the 1Click edge) | Pay once, get the money back if the service dies |
| Provider / steward | List a private edition, get paid in USDC on NEAR, prove liveness cheaply |
| Pandem agent | Send heartbeats, trigger releases and refunds, answer users with private inference |
| Judge | Follow "do X, see Y" steps in the README, with testnet tx links |

## 3. Stage 1 scope (by the deadline, testnet)
1. Storefront with one or two demo listings (static catalog, and the product registered on the escrow).
2. Subscribe: near-connect → `ft_transfer_call(escrow, price×periods, msg)` → the agreement appears.
3. The `escrow` contract (rules ported from Stillworks, `docs/STILLWORKS-TO-NEAR.md`):
   - register/approve product
   - heartbeat
   - sequential `release_period` with the D-14 offset and the split
   - `declare_abandoned` (the killswitch)
   - `claim_refund` (pro-rata, plus the contingency share when abandoned)
   - `withdraw_fees`
4. Agent: a runner using a function-call key, plus `/chat` on NEAR AI Cloud with an attestation panel.
5. Killswitch demo: stop the heartbeat or press the killswitch, and the refund lands in the subscriber's wallet (testnet tx links).

## 4. Later stages (each one starts with a ⛔ decision point, `docs/DECISIONS.md`)
| Stage | Contract(s) | Adds |
|---|---|---|
| 2 | `budget` | Yearly term funding. Ops budget adjusted when inference costs change. 7-day review lock on the creator share. Ops-reserve claims. Cancel and walkaway |
| 3 | `agent-wallet` | The agent's own treasury with small starting capital. It pays operators and providers on-chain within caps and allowlists. Optional Shade Agent key. Stake-for-Inference (mainnet only) |
| 4 | `registry` + factory, treasury DAO | One escrow per product, passport proposals, succession and contingency voting, Sputnik/Trezu treasury |
| Edge | none (front end) | Mainnet 1Click on-ramp: pay from any chain → USDC → `ft_transfer_call` into the escrow (`customRecipientMsg`) |

## 5. User stories (stage 1)
- As a subscriber, I subscribe for N periods with one wallet confirmation, and I see my agreement on `/me`.
- As a subscriber, I can see the released periods and whether my refund is claimable, and claim it myself if the agent doesn't.
- As a steward, I get 47.5% of each released period in USDC just by keeping the heartbeat alive. I can pull the killswitch.
- As a user, I ask the agent about a listing and get a TEE-attested answer with a "verified" panel.

## 6. Non-goals (stage 1)
- Mainnet deploys, mainnet payments, or anything signed with shreyan's keys by an agent.
- A token. Governance. Provider self-serve onboarding.
- Cross-chain checkout in the demo flow. 1Click has no testnet, so it appears only as a mainnet dry-quote edge if time allows.
- Claiming the heartbeat proves service quality.

## 7. Hackathon track
**Primary: Real-World Money (`realworld`).** A stablecoin escrow rail for recurring SaaS revenue, enforced on-chain. Source: `context/HACKATHON.md`.
**Also: Privacy & Private AI (`privacy`).** The agent runs on NEAR AI Cloud (a `nearai`-owned model in a TEE, with the attestation checked against a fresh nonce). Payments themselves are public on-chain, so say that.
**Candidate: Agent Economy (`agents`)**, only if a stage 3 agent-wallet that pays for its own inference ships.

## 8. Success metrics
- Testnet: subscribe → release → killswitch → refund, with the amounts matching the split and refund formula (cargo tests plus tx links).
- A judge runs `cargo test` and opens the hosted demo in under 10 minutes.
- Submitted before 14 Nov 23:59 UTC with a public repo, an X demo post by shreyan, and his NEAR payout account.
