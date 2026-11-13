# Maana Tracker v2: spec

Continues v0.1. Read `SPEC.md` in this folder for the existing app, then do the milestones below, starting at 7. Full design notes: `C:\Users\acer\OneDrive\Desktop\rep\int-real\1. Projects\Maana\spec\TRACKER v2 - capture + API.md`.

v2 adds fine-grained capture (clicks, copies, tab graph, dwell), fixes double-counted browser time, and gives Orange / Maana a windowed read API (`GET /api/interval?since=20m`) plus a task tree. It is still local-only: bind `127.0.0.1` only, never send data off the machine. TypeScript only.

Do not break existing routes: `GET /api/health`, `GET /api/events` (until Milestone 10, when its meaning changes and `GET /api/segments` takes the old shape), `GET /api/summary?date=`, `GET /api/focus/active`, `GET /api/blocks`, `GET /api/export`, `POST /ingest`, `POST /api/focus`, `POST /api/label`, `POST /api/blocks`, and the other v0.1 POSTs.

## Known bugs fixed in V2

- **Double counting.** Each browser visit is logged twice: the extension writes a `web` row (`app="browser"`, +15 s per heartbeat) and the window watcher writes a Comet row (+5 s per poll). `/api/summary` adds both, so today's buckets can exceed wall-clock time.
- **Comet is often not treated as a browser.** `categories.json` lists `comet.exe`, but `tracker.ts` matches that string against `activeWindow().owner.name` (usually `Comet`). `"comet".includes("comet.exe")` is false, so those minutes land in `other`.
- **`/api/summary` is per-day only.** No `?since=20m`. `/api/events` accepts ISO `since`/`until` but not relative windows, and it returns coarse app/web/afk segments, not clicks or tab events. The 20-min loop has nothing windowed to read.

## Stack additions

- Capture events go in a new `capture` table. Duration segments stay in `events` (with a new `superseded` column).
- Chrome MV3 extension, rewritten in TypeScript under `extension/src/`, compiled so it can still be loaded unpacked from `extension/`.
- `zod` validates API bodies and query params.
- All timestamps stay `YYYY-MM-DDTHH:MM:SS+05:30` (use `formatIST()`). Never `toISOString()` (`Z`).

## `since` parameter

On every v2 GET below, `since` is either a relative window (`1m`, `20m`, `1h`) or an ISO timestamp with `+05:30`. `until` is optional and defaults to now.

## Milestones (each one is done only when its check passes)

Build one milestone at a time, in order. After each, run the app, run that milestone's check, show the real HTTP output, commit `M<n>: <title>`, then stop and wait for "next".

---

### 7. Dedupe browser rows and fix Comet matching

**Goal.** One visit is counted once. Comet is a browser. While the extension is alive, window-watcher rows for browsers are kept but ignored in totals.

**Files.** `app/src/main/tracker.ts`, `app/src/main/classifier.ts`, `app/src/main/db.ts`, `app/src/main/server.ts`, `app/src/main/categories.json`, `categories.json`.

**Changes.**

- Add `isBrowser(name, path)` and use it in `tracker.ts` instead of `categoriesData.browsers.some(b => appName.toLowerCase().includes(b.toLowerCase()))`. Match against `owner.name` and the exe basename of `owner.path`, case-insensitive, with or without `.exe`. Tokens: `comet`, `chrome`, `msedge`, `edge`, `brave`, `firefox`, `chromium`, `opera`. A name of `Comet` must match. Keep the same list in both `categories.json` files (the app loads `app/src/main/categories.json`).
- Migrate `events`: `ALTER TABLE events ADD COLUMN superseded INTEGER DEFAULT 0` (and add it to new installs in `db.ts`).
- On `POST /ingest` (and later `POST /api/events`), store `last_extension_heartbeat_ms`.
- In `pollOnce`, if the active window is a browser and the heartbeat is less than 60 s old, still insert the window row (so data is not lost if the extension later dies) but set `source='app'` and `superseded=1`. If the heartbeat is 60 s or older, write browser window rows live (`superseded=0`).
- Non-browser apps are unchanged.
- `GET /api/summary` skips `superseded=1` rows. `GET /api/health` also returns `extension_heartbeat_age_s` (`null` if never seen).

**Check.** With the app and the extension running, use Comet for about 2 minutes, then:

```
curl http://127.0.0.1:5700/api/health
curl "http://127.0.0.1:5700/api/summary"
```

Expect `extension_heartbeat_age_s` under 60. Expect today's `productive_min + semi_min + waste_min + other_min` to be at most about the wall-clock minutes the laptop was on. `top` should list sites (youtube.com, x.com, github.com, …), not a huge `Comet` / `comet.exe` entry under `other`. In `GET /api/events` (default last 5 min), Comet/browser window rows have `superseded` equal to 1; extension `web` rows have `superseded` equal to 0.

---

### 8. Content-script capture

**Goal.** The extension records clicks, submits, copies, pastes, scroll depth, dwell, media, and the exact item viewed (the post, video, or page — not just the platform), and batches them to the app. No typed values. Incognito is skipped.

**Files.** `extension/manifest.json`, new `extension/src/content.ts`, rewrite `extension/background.js` as `extension/src/background.ts` plus a small compile step (esbuild is fine) that emits Load-unpacked files in `extension/`. `extension/blocked.html` and `extension/blocked.js` stay working. `app/src/main/db.ts`, `app/src/main/server.ts`, `app/package.json` (add `zod` only if you also validate the POST body here; otherwise add it in Milestone 10).

**Changes.**

- Manifest: `incognito: "not_allowed"`, content scripts on `http://*/*` and `https://*/*`, keep `tabs`, `alarms`, `storage`, `idle` as needed, and `host_permissions` for `http://127.0.0.1:5700/*`. Runtime guard: drop any tab with `tab.incognito === true`.
- New `capture` table: `id, ts, tab_id, opener_tab_id, window_id, url, domain, title, kind, payload TEXT`. Index `ts` and `kind`.
- `POST /api/events` accepts `{ events: CaptureEvent[] }` (max 500), stamps nothing off-box, stores rows. Keep `POST /ingest` working (it can also refresh the heartbeat).
- While `kinds` is present, `GET /api/events?since=&kinds=` reads from `capture`. With no `kinds`, `GET /api/events` still returns duration segments (v0.1 behaviour) until Milestone 10.
- Content script kinds: `click` (`tag`, `role`, `label` = aria-label or innerText trimmed to 80 chars, `css_path` capped at 200, `href` if any), `input_focus` (`field_name`, `field_type` only — never a value), `submit` (form id/name only), `copy` (`length`, `preview` first 200 chars), `paste` (`length` only), `scroll_depth` (max fraction 0–1, plus `dwell_s` so far), `media_play` / `media_pause` / `media_ended` (YouTube or generic video: `media_title`, `position_s`, `duration_s`), `idle` / `active`, `visibility`.
- **Dwell:** per `(tab_id, url)`, count only visible-and-focused time. Write `dwell_s` on hide, navigate-away, and close.
- Exact-item `view` events (the item, not just the platform). Also store a `content_text` field on the item for a future classifier (embedding + goal domain map); do not classify in this milestone.
  - x.com: `post_id` and post URL, `author` (handle), `text` (first 500 chars; this is `content_text`), `media_type`, `page_kind` (`home` / `search` / `status` / `profile` from the URL path: `/home`, `/search`, `/status/…`, profiles), `dwell_ms` per post that entered the viewport (IntersectionObserver), `scroll_speed`, and actions as their own events or payload fields: `like`, `bookmark`, `repost`, `copy`, `link_click`.
  - YouTube: `video_id`, `title`, `channel`, `watch_duration_s`, `entry_source` (`feed` / `search` / `autoplay` / `link`). `content_text` is the title (and channel if useful).
  - Generic pages: `url`, `title`, `h1`, `meta_description`. `content_text` is `h1` plus `meta_description` (or `title` if those are missing).
- Flush every 5 s or 50 events to `POST /api/events`. `ts` is local `+05:30`.
- Privacy: never capture typed values. If copy/paste source is a password, card, `cc-*`, or otp / one-time-code field, store `{redacted: true, length: 0, preview: null}`. Skip `chrome://`, `chrome-extension://`, `edge://`, `about:`, `devtools://`. Skip a banking-domain list in config (paypal.com, stripe.com, hdfcbank.com, icicibank.com, sbi.co.in, axisbank.com, kotak.com, onlinesbi.com, plus a few more in `extension/privacy.json` or `categories.json` — editable). On those domains, store nothing, or at most a domain-only navigate.
- Toolbar action pauses/resumes capture (one click). When paused, drop events and send nothing.

**Check.** Click a clearly labelled button on `github.com`. Within 10 seconds:

```
curl "http://127.0.0.1:5700/api/events?since=1m&kinds=click"
```

Expect a `click` event whose `label` contains that button's text or aria-label, with `ts` ending in `+05:30`, a `tab_id`, and domain `github.com`. Then copy ordinary text on the same page: `kinds=copy` shows `length` and a `preview`. A copy from a password field must be redacted or absent. `POST /ingest` and `GET /api/summary?date=` still work.

Then scroll the X home feed (`x.com/home`) for 1 minute, and:

```
curl "http://127.0.0.1:5700/api/events?since=2m&kinds=view"
```

Expect `view` rows with `post_id`, `author`, `text` and `dwell_ms`.

---

### 9. Tab graph

**Goal.** Every tab open, close, activation, and navigation is an event, with `opener_tab_id` and transition type, so a tree can be built next.

**Files.** `extension/src/background.ts`, `extension/src/content.ts` if needed, `extension/manifest.json` (tabs permission is already required).

**Changes.**

- Emit `tab_open`, `tab_close` (include `dwell_s` and `scroll_depth` of the page being left), `tab_activate` (include `dwell_s` of the tab being left, if known), and `navigate` with `transition` from Chrome's `transitionType` when available, else `"unknown"`. Include `dwell_s` / `scroll_depth` of the previous URL in that tab on `navigate`.
- Set `opener_tab_id` from `tab.openerTabId` on open and on the first navigate of a new tab. Set `tab_id` and `window_id` on every event.
- Still skip incognito and excluded URLs.

**Check.** From an existing `github.com` tab, open a link in a new tab, wait a few seconds, then:

```
curl "http://127.0.0.1:5700/api/events?since=1m&kinds=tab_open,navigate,tab_activate"
```

Expect a `tab_open` (or the first `navigate` of the new tab) whose `opener_tab_id` equals the GitHub tab's `tab_id`, a `navigate` with a `transition` string, and a `tab_activate`. All `ts` values end in `+05:30`.

---

### 10. API v2

**Goal.** Windowed, validated read API. This is what the 20-min loop will call. Do not break v0.1 routes; give the old event-segment list a new path.

**Files.** `app/src/main/server.ts`, `app/src/main/db.ts`, `app/package.json` (add `zod`).

**Changes.**

- Parse `since` as `20m` / `1m` / `1h` or ISO `+05:30` on the GET routes below.
- `GET /api/events?since=20m|ISO&kinds=` now reads the `capture` table (optional `kinds` comma list). Response:

```json
{ "since": "...+05:30", "until": "...+05:30", "events": [ { "id": 1, "ts": "...+05:30", "tab_id": 1, "opener_tab_id": null, "window_id": 1, "url": "...", "domain": "...", "title": "...", "kind": "click", "label": "..." } ] }
```

- Add `GET /api/segments?since=&until=` that returns the old duration-segment array (what `GET /api/events` used to return). Default `since` of 5 minutes if omitted, same as v0.1.
- `GET /api/summary?since=` or `?date=YYYY-MM-DD`. Keep the daily `date=` shape. With `since`, limit to that window. Skip superseded rows and `afk`. Response adds `active_title` and `switches` (tab_activate count plus non-mergeable app switches in the window):

```json
{ "since": "...", "until": "...", "productive_min": 0, "semi_min": 0, "waste_min": 0, "other_min": 0, "top": [ { "name": "github.com", "minutes": 3 } ], "active_title": "...", "switches": 0 }
```

- `GET /api/interval?since=20m` (default `20m` if omitted). The 20-min loop reads this. `branches` may be `[]` until Milestone 11, but the keys must exist:

```json
{ "since": "...+05:30", "until": "...+05:30", "active_task": null, "active_title": "...", "branches": [], "switches": 0, "top": [ { "name": "github.com", "minutes": 3 } ] }
```

`active_task` is the current `focus.goal` if a focus block is active, else `null`.
- `GET /api/health` stays, and still includes `extension_heartbeat_age_s`.
- Validate query params and `POST /api/events` bodies with zod. Invalid input returns 400 JSON `{ "error": "..." }`.
- Keep `POST /ingest`, `GET /api/summary?date=`, `POST /api/focus`, `POST /api/label`, and the other v0.1 routes as they are.

**Check.**

```
curl "http://127.0.0.1:5700/api/interval?since=20m"
curl "http://127.0.0.1:5700/api/summary?since=20m"
curl "http://127.0.0.1:5700/api/events?since=20m&kinds=click,navigate"
curl "http://127.0.0.1:5700/api/segments"
curl "http://127.0.0.1:5700/api/summary?date=2026-11-12"
```

Expect interval to include `active_task`, `active_title`, `branches`, `switches`, `top`. Expect summary `since=20m` to cover only the last 20 minutes (totals ≤ 20). Expect `kinds=` to filter capture events. Expect `/api/segments` to return the old segment array. Expect `?date=` to still return the daily object.

---

### 11. Task tree and branch close evidence

**Goal.** Tabs and apps become branches of a tree, with parent links and a close reason, and that tree is what `/api/interval` returns.

**Files.** `app/src/main/server.ts`, new `app/src/main/tree.ts`, `app/src/main/db.ts` only if you persist branches (in-memory build from `capture` + non-superseded `events` on each request is fine).

**Changes.**

- `GET /api/tree?since=` returns `{ since, until, branches }`. The same `branches` array is filled in on `GET /api/interval`.
- Each branch:

```json
{
  "branch_id": "...",
  "parent_id": null,
  "tab_id": 1,
  "app": null,
  "url": "...",
  "domain": "github.com",
  "title": "...",
  "opened_at": "...+05:30",
  "closed_at": null,
  "close_evidence": null,
  "minutes": 1.5,
  "dwell_s": 90,
  "content_text": null,
  "tier": null
}
```

- Parenting: a new tab's `parent_id` is the branch of `opener_tab_id`. Same tab + same registrable domain continues the branch. A new tab or a different domain starts a child. A non-browser app stretch is a branch (`app` set, `tab_id` null).
- Close evidence, no force-close of real tabs: `copy` if a `copy` event on that branch is followed by leave or close within 60 s; `left_after_action` if a `click` or `submit` is followed by leave or close within 60 s and there was no copy; `timeout` if the tab closed with no recent action, or there are no events on the branch for 15 minutes.
- `tier` is always `null` in this milestone. Do not invent a classifier. Items (and branches, when the data is on hand) carry a `content_text` field from Milestone 8 — post text, video title, or page h1/description — so a later classifier can embed it and score it against the goal domain map.
- `active_task` on `/api/interval` remains `focus.goal` or `null`.

**Check.** From an existing GitHub tab, open a link in a new tab, copy some text on the new page, then close or leave that tab. Within 10 seconds:

```
curl "http://127.0.0.1:5700/api/tree?since=10m"
curl "http://127.0.0.1:5700/api/interval?since=20m"
```

Expect the child branch with `parent_id` set to the opener branch, `closed_at` set, and `close_evidence` equal to `"copy"`. Expect `/api/interval` to include the same branch in `branches`.

---

### 12. Hardening and smoke test

**Goal.** Safe defaults for long-running use, a clear pause control, and one command that proves every route.

**Files.** `app/src/main/db.ts`, `app/src/main/server.ts`, `app/src/main/index.ts` if needed, `extension/src/background.ts`, `package.json` (this folder), new `scripts/smoke.ts`.

**Changes.**

- Retention: on startup and once a day, delete `capture` rows older than 30 days (make the number a `settings` key, `retention_days`, default 30). Do not delete `events` segments in this milestone.
- Pause: the extension toolbar toggle from Milestone 8 must persist across service-worker restarts, show a badge when paused, and be reflected as `paused: true` on `GET /api/health`. Optional: `POST /api/pause { "paused": true }`.
- `npm run smoke` (from this folder) starts a script that hits, at least: `GET /api/health`, `GET /api/events?since=1m`, `GET /api/events?since=20m&kinds=click`, `GET /api/segments`, `GET /api/summary`, `GET /api/summary?since=20m`, `GET /api/interval?since=20m`, `GET /api/tree?since=20m`, `GET /api/focus/active`, `POST /ingest` with a harmless `{url,title,ts}` to localhost, and `GET /api/health` again. It prints each path, status code, and a one-line pass/fail. Exit 0 only if every call returns 2xx and the JSON has the keys this spec requires. The app must already be running; the script must not start or stop it.

**Check.**

```
npm run smoke
```

Expect every route to print `pass` and the process to exit 0. Then pause the extension from the toolbar, run `curl http://127.0.0.1:5700/api/health`, and expect `paused` to be `true`. Existing v0.1 routes still respond.

---

## Out of scope for v2

LLM / Jev classification, filling `tier`, feed curation, an MCP server, changing Cold Turkey, cloud sync, capturing keystrokes or input values.

### M8 addendum (13-11-2026): no click needed + selector config
- Timeline capture works without opening posts: on x.com each post is an `article[data-testid="tweet"]` holding its permalink `a[href*="/status/"]` (post_id), author and `[data-testid="tweetText"]`. On YouTube, feed/search items (`ytd-rich-item-renderer`, `ytd-video-renderer`, shorts shelves) hold `/watch?v=` or `/shorts/` ids, title and channel. Observe them with IntersectionObserver (>=50% visible) and log dwell_ms per item.
- Put ALL platform selectors in one file `extension/selectors.json` (per site: item, id link, author, text, title), loaded at runtime with a version field, so DOM changes are a config edit, not a code change. Log a `selector_miss` event when a site yields 0 items for 30 s of scrolling.
- Done-check: scroll the X home feed 1 min without clicking; /api/events?kinds=view returns >=10 distinct post_ids with dwell_ms.
