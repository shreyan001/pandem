# Pandem UI Polish Brief (45-minute pass)

Do not add features or dependencies. Use only Spectr tokens in `design.md` / `web/src/ui/tokens.ts` and primitives in `web/src/ui` (Button, Card, Badge, Tabs, Modal, Drawer, Input, Stat, Table, PageHeader, Section). Radius 0. Canvas `#0D0D0D`, surface `#171717`, hairline `#2E2E2E`, primary `#894DEF`, ink `#FAFAFA`, body `#B8B8B8`. Spacing: `xs` 8 / `sm` 12 / `md` 16 / `lg` 24 / `band` 48. Type: section titles `heading-lg` (24/700), names `heading-md` (20/700), taglines `body-sm` (15/500), labels `caption-xs` or `code-sm` (JetBrains Mono). Screenshots in `reports/screens/` still show the older "Aegis Legal AI" copy; layout problems below still apply to the current catalog (Open-WebUI, LocalAI, …). Covers: `/workspace/pandem-design/covers/<slug>.png` (1600×900). Banner `covers/banner.png` is for the X post/README only — do not put it in the app.

**Mobbin:** `user-Mobbin` is connected but every search returned "Mobbin MCP requires a paid plan." Refs below are official public fallbacks in `/workspace/pandem-design/refs/`. Intended Mobbin queries: Product Hunt homepage ranked cards; Raycast Store listing; SaaS product page with logo/stats/tiers; Stripe billing subscription manage; Vercel/Linear developer console; wallet-connect drawer.

## Do in this order (highest visual impact first)

1. Collapse the `/` hero and put the ranked directory above the fold so product cards are the first thing a judge sees.
2. Place `covers/<slug>.png` as a 16:9 banner on the featured feed card and on the product-page header (object-cover, radius 0, hairline border).
3. Restyle feed rows as dense ranked rows: 40–48px logo, name, one-line tagline, rank Badge, upvote control on the right (`feed-1.png`, Product Hunt pattern).
4. Product header like `product-1.png`: big logo on the cover, Stat row, one primary `Button` ("Subscribe"); move `PricingTable` immediately under the header (`product-2.png` / `product-3.png`).
5. Dashboard: subscriptions first; replace the "Querying native NEAR Rust Escrow contracts..." box with a surface skeleton and a real empty state + Browse `Button`; keep Upgrade / Renew / Cancel / Refund on each `SubscriptionCard`; demote payment banner and bounty (`dashboard-1.png`).
6. `OnboardingDrawer`: opaque full-viewport `surface` sheet on 390px, one primary `Button` per step, `Stat` for tUSDC balance, success with explorer links; no hero bleed-through (`wallet-1.png`).
7. Dev dashboard: `PageHeader` + product `Tabs` (not checkbox chips), `Stat` row for balances, fix 390px header overflow (`dev-1.png`).
8. Global 390px nav: do not let "Launch Product" collide with "Connect Wallet"; truncate mono account IDs; one primary CTA per header.

## 1. Feed `/` (`page.tsx`, `HeroPersonaLaunchpad`, `ProductHuntLeaderboard`)

**Weak now:** `feed-1280.png` / `feed-390.png` are a long manifesto. Above the fold is only the headline, two pathway Cards, and the contract inspector. `space-y-24` plus Security Matrix bury `#storefront`. No covers, no visible ranked products. Off-token colors in the leaderboard (`#141414`, `#C084FC`). Mobile nav is cramped.

**Copy:** `refs/feed-1.png` and `refs/feed-2.png` (Raycast Store) — search + featured cards on a dark canvas. Product Hunt row pattern (upvote fixed on the right, one-line tagline, 16px gaps) even though PH itself was Cloudflare-blocked here.

**Changes:** Shrink the hero to one `PageHeader` band (`display-sm` or `heading-xl`, 2-line max subhead, two `Button`s: Browse Directory + Launch Product). Move `#storefront` directly under it. Optional: hide Contract inspector + Security Matrix behind a `Tabs` panel or below the directory. Featured card: full-width `Card`, cover image 16:9 on top, logo + name + tagline + primary `Button`. Remaining products: vertical list, `md` padding, hairline dividers, logo 40–48px, name `heading-xs`, tagline one line `body-xs`, price in mono, upvote `Button` 40×48 on the right. Category filter as `Tabs`. Loading: 6 hairline skeleton rows. Empty search: one line + clear `Button`. Replace raw hex with tokens. Mobile: 1 column, upvote stays trailing.

## 2. Product `/products/[slug]` (`ProductHeader`, `ProductDetailClient`, `PricingTable`)

**Weak now:** `product-1280.png` / `product-390.png` — 64–80px generic shield, no cover, badge pile, "Subscribe via Escrow" uses a raw `<button>` with a white border. A long "Real-Life Crisis" manifesto sits above `PricingTable`, so tiers are below the fold. Treasury stats are even lower. Mobile stacks score above a full-width CTA with no price shown.

**Copy:** `refs/product-1.png` (Raycast × Linear: logo, name, one-line tagline, installs-style stats, CTA right, gallery under header). `refs/product-2.png` (Linear Pricing) and `refs/product-3.png` (Vercel Pricing) for the 3-tier grid, yearly toggle, "Popular" `Badge`.

**Changes:** Breadcrumbs stay `code-sm`. Header `Card`: cover as the top 16:9 plane; `AbstractLogo` 72–80px sitting on the cover's bottom-left (`lg` inset); name `heading-lg`/`display-xs` on desktop; tagline one line; `Badge`s limited to category, rank, TEE. Right column: two `Stat`s (Score, Heartbeat) + primary `Button` "Subscribe · {price}". Wire it to existing `onSubscribeClick`. Delete or collapse the manifesto `Card` (move one sentence under the tagline). `PricingTable` next, `md:grid-cols-3`, Pro marked `Badge` "Popular" and hairline/`primary` border; yearly `Tabs` or the existing toggle; each footer is a `Button`. Keep Treasury / Activity / Requests / Bugs below, `Section` + `band` gaps. Loading: header + 3 tier skeletons.

## 3. Subscriber dashboard `/dashboard`

**Weak now:** `dashboard-1280.png` / `dashboard-390.png` — header is a badge pile plus a full testnet account id; "Add a Payment Method" is the primary CTA even when the job is managing subs. Payment-gateway banner and Steward Bounty out-shout the subscription list. The list is a hollow surface with tiny muted "Querying native NEAR Rust Escrow contracts...". Upgrade/Renew/Cancel already exist on `SubscriptionCard` but never appear in the shot because loading never resolves visually.

**Copy:** `refs/dashboard-1.png` (Stripe Billing: the plan object comes first). `refs/dashboard-2.png` (Linear plans) for upgrade comparison. Pattern: each sub is a row/card with product, plan, price, status, and actions on the right.

**Changes:** `PageHeader` title "Subscriptions", short description, actions = truncated account `code-sm` + success `Badge` "Escrow protected". Default header CTA = "Browse catalog" when empty, else no competing primary. Render the agreement list first. Loading: 2 skeleton `Card`s (`surface`, hairline, 24px padding), not a one-line mono dump. Empty: one sentence + primary `Button` to `/#storefront`. Each `SubscriptionCard`: logo, name, tier `Badge`, amount + period in mono, status `Badge`, then `Button`s Upgrade / Renew / Cancel / Claim refund (already wired). Hide or move PaymentGatewayBanner and StewardBounty below the list. Success: existing claim-tx alert is fine (success border + explorer link).

## 4. Developer `/dev/dashboard` and `/dev/onboarding`

**Weak now:** `dev-dashboard-1280.png` / `dev-dashboard-390.png` — "Developer Operations Hub" plus a paragraph, product switcher as checkbox chips, long contract ids, four metric boxes with mixed green/gold/violet, dense jargon. At 390px "Onboard New Product" collides with "NEAR Testnet Active". No `/dev/onboarding` screenshot; that page is 1369 lines and will read heavy next to Linear/Raycast.

**Copy:** `refs/dev-1.png` (Linear console: sidebar / main / rail, tight type). `refs/dev-2.png` (Raycast Developers: dark grid, labeled structure, whitespace).

**Changes:** `PageHeader` "Dashboard", one-line description, actions = success `Badge` + primary `Button` "Onboard product". Product switcher → `Tabs`. Metric row → four `Stat`s (Ops received, Ops available, Update buffer, Heartbeat period); `code-sm` contract ids truncated with a copy/explorer control. Keep Payout stream + Heartbeat as two `Card`s (`lg:grid-cols-12` 7/5 is fine) but cut body copy in half; use `Badge` for Released / Streaming / Locked. Mobile: stack, hide the breadcrumb trail, let the onboard `Button` wrap under the title. Onboarding: one vertical stepper, one `Input` group per step, one primary `Button`, `Section` gaps — no new steps.

## 5. Wallet / onboarding drawer (`OnboardingDrawer`, `Drawer`)

**Weak now:** `onboarding-drawer-390.png` — "Get Started with Pandem" and the 1/2/3 stepper sit on top of the feed hero; the sheet is not an opaque full-viewport flow. Steps and page content compete.

**Copy:** `refs/wallet-1.png` (RainbowKit): one task, short title, helper line, primary action, everything else secondary.

**Changes:** On `<390–640px`, render `Drawer` as a full-viewport `surface` sheet (or `position="bottom"` with `max-h` ~100vh) so canvas never bleeds through; keep the existing `bg-black/80` backdrop. Title stays; shorten the description to one line. Stepper: 3 equal cells, only the current step is `primary`. Step 1: one `Button` "Connect NEAR wallet". Step 2: one `Button` "Claim test USDC" (existing `setupPaymentsBatch`); show a `Stat` for balance after refresh. Step 3: success `Badge`, balance `Stat`, explorer links for storage/faucet/batch txs, `Button` "Browse storefront" that closes the drawer and jumps to `/#storefront`. Error: danger text + retry `Button`. Do not change the on-chain path.

## Guardrails

Replace leftover raw hex in `ProductHeader` and `ProductHuntLeaderboard` with tokens. No rounded classes. No new pages, APIs, or packages. Copy covers into `web/public/covers/` (or the existing public images folder) as `open-webui.png`, `localai.png`, `searxng.png`, `vaultwarden.png`, `immich.png`, `nextcloud.png`. If a listing has no cover, fall back to `AbstractLogo` on `surface`.
