# Pandem V2 upgrade: fields, Product Hunt-style UX, design system

**TL;DR:** The V1 contracts work on testnet. V2 is product polish: a real listing data model (Stillworks fields without the clutter), test USDC with a faucet, an agent-computed decentralization score, a Product Hunt-simple storefront that hides Web3 details behind a toggle, a maker dashboard with real on-chain numbers, and the Spectr design system (`design.md`). Must-have V1–V6 is about 15 h, and V7–V8 are stretch goals. Ship by **Sun 15-11 03:30 IST** (deadline 05:29 IST).

Source of truth for visuals: `design.md` (Spectr). Don't restyle outside its tokens: sharp corners (radius 0), canvas #0D0D0D, surface #171717, hairline #2E2E2E, primary #894DEF, Inter.

## 1. What V1 has (verified on main @ 7daf7ea)
- Contracts: escrow, budget and registry, with 23 tests passing. Testnet ids are in `contracts/scripts/deployed.json` (token is `wrap.testnet`, not USDC).
- Web: Next 16, Tailwind 3 with **no theme** (default config, Arial). About 6.3k lines in pages and components. `app/components/page.tsx` (56 KB) and `OnrampQuotePanel.tsx` (47 KB) are oversized.
- Listing data: `shared/catalog.json` is static, with hard-coded upvotes and ranks. `registry.ProductListing` has only name, steward, tee_model, tee_verified, upvotes, heartbeat_streak and contingency_reserve.
- **Honesty risk for judges:** `agent/src/cloudPayment.ts` and `web/src/app/api/agent/inference-payment/route.ts` make **random "realistic" tx hashes** for simulated receipts, and `OnrampQuotePanel.tsx` makes random tx hashes. `ProductHuntLeaderboard.tsx` simulates streak and TVL. These must be removed or clearly labelled.

## 2. Stillworks peak: keep vs drop
Stillworks (`Desktop\stillworks`, main @ 7fc916c) had a richer `Product`, a launch form and a maker console.
**Keep (port to NEAR):**
- Identity fields: slug, name, tagline, pitch, category, logo.
- Links: website URL, repo URL, license.
- Status (launching, live, graduated or abandoned) and launch date (shown as age).
- Heartbeat healthz endpoint and uptime.
- Split percentages (ops, contingency, review lock, upkeep).
- MRR, treasury/vault, backers (subscribers), score.
- Decentralization checklist with evidence (the CROPS idea), pricing, attestation log and governance params.

**Drop (the clutter):** 0G storage and compute panels, Redis telemetry banner, pitch page, sandbox modal, storage explorer, AgentPass, walkaway-zip UI, and sponsor-track copy.

## 3. Revised scope (shreyan, Sat 14-11 10:42 IST)
- **Testnet money:** a mock NEP-141 **tUSDC** (6 decimals). `faucet()` gives each account 100 tUSDC once per 24 h and handles storage itself. The web app shows a small "Get test USDC" button after wallet connect. Escrow and budget are re-pointed from wrap.testnet to tUSDC.
- **Score (decentralization criteria), 0–100, recomputed by the Pandem agent backend and written on-chain with an inputs hash:**
  - billing-attached services: how many of the product's services are paid through escrow or budget
  - developer activity: commits in the last 3 months and days since the last release, from GitHub
  - growth: change in stars and subscribers
  - decentralization checks: open source, self-hostable, private-AI TEE, non-custodial payments, heartbeat
  - Upvotes rank the feed but don't count in the score.
- **Verifiable subscriptions:** every subscription page lists its contracts, all related txs (subscribe, releases, heartbeats, inference draws, refunds) with explorer links, kept for as long as the user holds or subscribes.
- **Access:** connect a wallet plus an invite code (allowlist). After subscribing, the user gets an access link and an email field (stored only; no mail sent in the MVP). Gmail sign-in is a **stretch** goal.
- **Pandem agent:** a central agent with its own wallet and treasury. It scores listings and pays its own inference from the budget contract. The UI has a "Connect your Pandem agent" indicator that is visible but disabled for now.
- **Listing data source (real, no generating):** [awesome-selfhosted-data](https://github.com/awesome-selfhosted/awesome-selfhosted-data), with about 1,000 YAML files. Each has name, website_url, description, licenses, source_code_url, demo_url, **icon_url** (real logos), stargazers_count, current_release and a monthly **commit_history**. Import about 12 privacy/AI-relevant products. Use icon_url for the big logo and the site's og:image for the hero. Pricing and tiers are Pandem's own demo values, and the UI marks them as such.

## 4. Milestones (v2, prioritised; each stops at ⛔ so the agent asks before moving on)
Every milestone follows the same rules: build only that milestone, paste the real done-check output, commit `V<n>: <title>`, then ⛔ stop and ask. Testnet only. No fake tx hashes.

| # | Milestone | h | Needs |
|---|---|---|---|
| V1 | tUSDC mock token with faucet; registry V2 listing fields (slug, name, tagline, description, category, logo_url, hero_url, website_url, repo_url, demo_url, license, launched_at, steward, roadmap[], tiers[] with monthly/yearly prices, decentralization checks with evidence urls, score + score_inputs_hash); escrow takes tUSDC and a tier id | 3 | DP-U1 tiers |
| V2 | Import + scorer: script pulls ~12 listings from awesome-selfhosted-data, then seeds registry and `shared/catalog.json`; agent backend scorer computes the score per §3 and calls `update_score`, with inference paid from budget (a real tx or none, never a fake one) | 2 | V1 |
| V3 | Design system: `design.md` tokens plus primitives from shreyan's repos in `web/src/ui/`; the `/components` gallery; every page uses only these | 2.5 | DP-U2 repos |
| V4 | Product landing template `/p/[slug]` and feed: very big logo, product + developer, short description, stats (score breakdown, subscribers, roadmap), monthly/yearly + Pro/Max pricing, links, Subscribe, then success with the access link and email field; "Verify on-chain" section | 3 | V2, V3 |
| V5 | Dashboards: user `/me` (subscriptions, service health, private-service usage, inference txs, refund) and developer `/console/[slug]` (treasury, MRR, subscribers, ops burn, uptime); Pandem-agent indicator (disabled); invite-code gate | 3 | V4 |
| V6 | Truth pass + ship: remove random-hash code, label demo data, redeploy all, update README/SUBMISSION/demo script | 1.5 | V5 |
| V7 *(stretch)* | Imagix demo service: N AI images per period, each one an on-chain inference draw shown in `/me` | 2 | DP-U3 image model |
| V8 *(stretch)* | Gmail sign-in | 1.5 | — |

Must-have V1–V6 is about 15 h. **Cut line:** V7–V8 happen only if V6 is done by Sun 01:30 IST.

### Done-checks
- **V1:** cargo test passes (faucet once per 24 h, subscribe with a tier in tUSDC, steward-only listing edit, one upvote per account); cargo near build; npm run typecheck.
- **V2:** import log shows 12 listings with real URLs; `near view <registry> get_listing` shows score + inputs hash for each; scorer tx links.
- **V3:** web build passes; no rounded- classes and no raw hex outside tokens; `/components` screenshot.
- **V4:** product page screenshots at 1280 px and 390 px; subscribe on testnet works end to end with the tx link.
- **V5:** `/me` and `/console` screenshots whose numbers match `near view` output.
- **V6:** `rg -n "randomBytes|Math.random" web/src agent/src` is clean in tx code; new deployed.json; README updated.
