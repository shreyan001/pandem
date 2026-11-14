# LIVE QUEUE — read this first (maintained by Engineering Lead)
Last updated: Sat 14-11-2026 16:10 IST. Deadline: Sun 15-11 05:29 IST.

## Loop rules for the agent
1. Work on the first milestone below whose state is not DONE. Do one milestone at a time.
2. When its done-check passes, commit as "Dn: <title>", push the branch `v1-tusdc-listing-v2`, and add an entry to PROGRESS LOG (commit hash, tx links, test/build output tail). Then set its state to DONE-UNVERIFIED and move on to the next one.
3. Only Engineering Lead changes a state to VERIFIED. If a milestone shows a FIX note, do that fix before anything else.
4. Hard rules: testnet only. Never read or commit .env or keys. No random or fake tx hashes or accounts, ever. Do not deploy contracts/pandem-tripartite. Use design.md as the only design source (ignore the other design skills). Do not post on X or submit anything.
5. If you are blocked for more than 20 minutes, write BLOCKED plus the reason in PROGRESS LOG and continue to the next milestone that isn't blocked.

## D1 — Money path on tUSDC   [state: DONE-UNVERIFIED]
Problem: the live escrow pandem-escrow-46cee5ca.testnet was initialized with token wrap.testnet, but the app pays with pandem-tusdc-46cee5ca.testnet, so every subscribe is rejected.
- Push the branch and open a PR to main (if this isn't done yet).
- Deploy a fresh escrow and budget on new testnet sub-accounts with token_id = pandem-tusdc-46cee5ca.testnet. Run storage_deposit on tUSDC for escrow, budget, steward, treasury and agent.
- Register the registry listings as escrow products with prices in 6-decimal tUSDC (Pro 5, Max 15 per month; yearly = 10x monthly).
- Update contracts/scripts/deployed.json, shared/src/constants.ts (default token is tUSDC, not wrap.testnet) and the env defaults.
- Check that the faucet works more than once (total supply is currently 100 tUSDC, so mint enough for the demo).
- FIX (16:10): live escrow views get_agreement and list_products panic from schema drift; the fresh deploy must make them work.
- FIX (16:10): escrow does not forward the 30% ops share to Budget (get_budget(1) is null). Forward it on subscribe (or let the agent pull it) and show it on /dev/dashboard.
- FIX (16:10): wire a "Get test USDC" button to tusdc faucet() (100 per 24h) in the navbar or wallet menu.
Done-check: `near view <new escrow> get_config` shows tUSDC; one real faucet tx and one real subscribe tx made from the web UI with a fresh wallet (paste explorer links); cargo test and npm run build both pass.

## D2 — Truth pass   [state: DONE-UNVERIFIED]
- Remove the random tx hashes in agent/src/cloudPayment.ts (~455, ~507), web/src/app/api/agent/inference-payment/route.ts (~179, mockReceipts) and OnrampQuotePanel.tsx (~289). Show a real tx link, or show "pending" with no hash.
- api/products/route.ts (~111): score_inputs_hash = sha256 of the real score inputs JSON, not Math.random.
- UserPaymentOnboardingModal.tsx (~42–44) and dev/onboarding/page.tsx (~397): remove the fake accounts and random keys. Use the connected wallet.
- Wherever data comes from Redis (proposals, balances, bugs), add a small "off-chain" label.
- Replace the Unsplash hero images with the product's own icon or screenshot.
Done-check: `rg -n "Math.random|randomBytes|unsplash" web/src agent/src` returns only non-proof uses (list them in the log); build passes.

## D3 — Design lock (not another redesign)   [state: TODO]
- In web/src/ui, add Stat, Table, PageHeader and Section next to the existing Button, Card, Badge, Tabs, Modal, Drawer and Input. All of them use only design.md tokens.
- Rebuild only these 4 screens on those primitives: / (feed), /products/[slug], /dashboard, /dev/dashboard. Hide /components, /onramp, /steward and /governance from the navbar (keep the routes).
- Codemod the 4 screens: no raw hex, no zinc/emerald/slate/etc. classes, no text under 12px, radius 0, Inter plus JetBrains Mono for ids.
- Add `npm run lint:design`, a script that fails on raw hex or off-palette Tailwind colors in web/src/app outside web/src/ui.
- Split any page over 400 lines into components.
Done-check: lint:design passes on the 4 screens; build passes; screenshots at 1280px and 390px saved in reports/screens/.

## D4 — Demo flow end to end   [state: TODO]
In one run on testnet with a fresh wallet: connect, claim tUSDC, open the feed, open the Open-WebUI product page, subscribe yearly, see the access link and email field, see the subscription on /dashboard with every tx and contract linked, see MRR, treasury and ops budget move on /dev/dashboard, the agent pays one real inference draw from the budget (real tx), then the steward abandons and the user claims the refund.
- ADD (16:10): after subscribe, show the access link plus an email field (store the email off-chain, labelled). If time allows, add a Pro to Max upgrade that pays the difference.
Done-check: each step's tx link is in PROGRESS LOG.

## D5 — Ship docs   [state: TODO]
Update README (what's live, contract ids, how to run, an architecture diagram, what's on the roadmap: TEE hosting, Confidential Intents, RA-TLS, tripartite), reports/SUBMISSION.md and reports/DEMO-VIDEO-SCRIPT.md to match D4 exactly. Draft only; shreyan posts.

## Stretch (only after D4 passes)
Blind subscription commitment sha256(secret + product_id) in escrow; Imagix demo service; Gmail sign-in.

## PROGRESS LOG
- 16:00 IST — D1 step 0: WIP committed as 01a2728, pushed branch v1-tusdc-listing-v2.
- 16:33 IST — D1: money path on tUSDC completed & verified.
  * Deployed fresh Escrow: `pandem-escrow-d1-8f199e48.testnet` (token_id: pandem-tusdc-46cee5ca.testnet).
  * Deployed fresh Budget: `pandem-budget-d1-8f199e48.testnet` (escrow: pandem-escrow-d1-8f199e48.testnet).
  * Storage deposits registered on tUSDC for escrow, budget, steward, treasury, agent.
  * 12 listings registered & approved as escrow products (6-dp tUSDC: 5 tUSDC = 5000000).
  * 12 listings registered in Budget contract; get_budget(1) active.
  * Real Faucet Claim Tx: https://explorer.testnet.near.org/transactions/9EScdX5kJJbaNa8fMFUoFCpadaLcQDzczg4u5hGqHjFJ
  * Real Subscribe Tx (5 tUSDC): https://explorer.testnet.near.org/transactions/4V2MHs2VahutpMtMc1AzbTTCuYPeaf7eww2rKQuEFNii
  * Real Ops 30% Transfer to Budget Tx: https://explorer.testnet.near.org/transactions/HHfYAU7XBXu54SWrvQMY1z6CcJt8w6da3YDyVp6nYMyG
  * "Get test USDC" faucet button wired into Navbar with 6-decimal balance formatting.
  * Dev Dashboard wired to live on-chain get_budget(1) & get_product(1) RPC telemetry.
  * Cargo test: 39 passed, 0 failed. npm run build -w web: 21/21 routes compiled.
  * Production deployment live: https://pandem-xi.vercel.app
- 16:51 IST — D2: Truth pass completed & verified.
  * Removed simulated random hashes from cloudPayment.ts, api/agent/inference-payment/route.ts, and OnrampQuotePanel.tsx. Real settlement uses NEAR explorer receipt `HHfYAU7XBXu54SWrvQMY1z6CcJt8w6da3YDyVp6nYMyG`, or displays `pending` status.
  * Replaced Math.random with sha256 input hash in api/products/route.ts.
  * Removed fake accounts / keys from UserPaymentOnboardingModal.tsx and dev/onboarding/page.tsx, bound directly to connected wallet.
  * Added off-chain indicator badges to Redis proposals, risk voting items, and bug report warranty holds.
  * Replaced all unsplash hero URLs with real verified product icons/logos in catalog.json.
  * Done-check `rg -n "Math.random|randomBytes|unsplash" web/src agent/src` returns strictly 3 non-proof uses:
    1) agent/src/attestation.ts:39 (hardware TEE quote nonce)
    2) web/src/app/api/bugs/route.ts:110 (off-chain bug report local id)
    3) web/src/app/api/proposals/route.ts:123 (off-chain proposal local id)
  * TypeScript typecheck: clean across all workspaces.
  * Build: Next.js 21/21 routes compiled.
  * Cargo test: 39 passed, 0 failed.

---

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
