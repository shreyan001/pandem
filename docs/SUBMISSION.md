# Submission checklist

**TL;DR:** The deadline is **14 Nov 2026 23:59 UTC = Sun 15 Nov 05:29 IST**, and you get one submission. You (not an agent) make the repo public, post on X, and send the form. The form text is drafted below.

Source: https://nearhackathon.com/HACKATHON.md (local copy `context/HACKATHON.md`, page text in `context/hackathon-page.md`).

## Before the form
- [ ] Repo https://github.com/shreyan001/Pandem is **public** (check it in a private browser window)
- [ ] README has: what it is, the problem, judge steps ("do X → see Y"), tx links, and the **prior-work disclosure** (Stillworks, Q-002/Q-005)
- [ ] README states what is on-chain (stage 1 escrow on testnet) and what isn't (later stages, mainnet 1Click edge) with no overclaims
- [ ] `LICENSE` file added (D-09)
- [ ] No secrets in git history: `git log -p -- . ':!.agents' | grep -E '^\+' | grep -E 'ed25519:[1-9A-HJ-NP-Za-km-z]{60,}|_KEY=[A-Za-z0-9]|sk-[A-Za-z0-9]{20,}'` returns nothing (`.agents/skills` holds only example public keys)
- [ ] Hosted demo up (optional, but a plus). Keep it up until 18 Nov, ideally 25 Nov
- [ ] Demo video under 2 min: one complete moment, subscribe with a NEAR wallet → a period released on-chain → killswitch → refund lands. No architecture slides
- [ ] X post published by you: says "built at NEAR HACKATHON" and tags **@NEARProtocol** and **#NEARHackathon** (optional @NearLegion @NearBuilders), with the video attached
- [ ] NEAR **mainnet** payout account is yours (named `*.near` or 64-char implicit). Agents never create or invent it

## Form fields (you fill these; agents never guess them)
| Field | Value |
|---|---|
| Project name (2–80) | Pandem |
| Team lead name (2–80) | _you_ |
| Contact email (≤160) | _you_ |
| Team size | `1` (solo) or your real size |
| Tracks | `realworld`, `privacy` (+ `agents` only if stretch S2 shipped) |
| NEAR wallet (mainnet) | _your account_ |
| Repository link | https://github.com/shreyan001/Pandem |
| Demo post link | _your X post URL_ |
| What you built (20–2000 chars) | draft below |
| Consent | read and tick it yourself |

### Draft: "What you built" (1254 characters; edit it to match what actually shipped)
> SaaS buyers prepay for services that can leak their data, train on it, or shut down overnight with their money. Pandem is a storefront for private and decentralized editions of SaaS, with a payment rail that holds money back until the service proves it is alive. On NEAR, a subscriber pays USDC into a Rust escrow contract with one ft_transfer_call. The contract releases one period at a time only after the provider's heartbeat for that period is on-chain, splitting it 47.5% to the steward, 30% ops reserve, 20% contingency and a 2.5% protocol fee. If heartbeats stop past the grace window, or the steward pulls the killswitch, anyone can trigger a refund of the unreleased periods plus the contingency share. The rules live in the contract, not in a server that holds the keys. A Pandem agent with only a limited function-call key runs heartbeats and upkeep, and answers users with private inference on a NEAR AI Cloud TEE model, showing the attestation. This is stage 1, live on testnet; budget, agent-wallet and registry contracts are the next stages, and a NEAR Intents 1Click on-ramp for payers on other chains is planned for mainnet. Rules are ported from our earlier Stillworks (Solidity) project; all NEAR code was written during the hackathon.

## X post draft (you post it)
> SaaS you prepay can vanish with your money and your data.
>
> Pandem: subscribe in USDC on NEAR. A Rust escrow contract pays the provider period by period only while their service proves it's alive. Heartbeat stops = anyone can trigger your refund.
>
> Agent on NEAR AI Cloud (TEE). Live on testnet.
>
> Built at NEAR HACKATHON. github.com/shreyan001/Pandem
>
> @NEARProtocol #NEARHackathon

## Submitting
- The form is at https://nearhackathon.com/#apply. An API also exists (POST `/api/applications`), but HACKATHON.md says to print the full payload and get your explicit yes first. There is **one attempt**. Fix mistakes at https://nearhackathon.com/request-changes. Don't submit twice.
- Don't commit the payload; it contains personal data (`submission-payload.json` is gitignored).
