> **Format example from another project (Maana).** Copy its structure only. Its language rules don't apply to Pandem; Pandem's rules are in `AGENTS.md`.

Paste this into Antigravity, run from inside this folder:

---
You are building **Maana Tracker v2** in this existing Electron + TypeScript repo. Read `SPEC.md` (for v0.1 context) and `SPEC_V2.md` in this folder first. `SPEC_V2.md` is the source of truth for this work. Don't add anything it leaves out.

Rules:
- The app already exists. Do not scaffold a new project. Work in the current tree.
- Build **one milestone at a time**, in order, starting at Milestone 8 (Milestone 7, dedupe and Comet matching, is already committed). After each one, run the app, run that milestone's done-check, and show me the actual output. Commit with the message `M<n>: <title>`, then stop and wait for me to say "next".
- TypeScript only. Never Rust. Keep it small. No extra libraries unless one is truly needed (zod is required in Milestone 10), and say why if you add one. Use strict TypeScript.
- Bind only to 127.0.0.1. Never send data off the machine.
- Never capture typed values. Never capture values from password, card, cc-*, or otp fields. Copy may store length + first 200 characters only when the source is not one of those fields.
- Milestone 8 must record the exact item viewed, not just the platform: on x.com a `view` event with `post_id`, `author`, `text` (first 500 chars) and `dwell_ms`; on YouTube `video_id`, title, channel, watch duration and entry source; on generic pages URL, title, h1 and meta description. Privacy rules above still apply.
- Do not break existing routes: `GET /api/health`, `GET /api/summary?date=`, `POST /ingest`, `POST /api/focus`, `POST /api/label`, `GET`/`POST /api/blocks`, and the rest of the v0.1 API must keep working. From Milestone 10, the old `GET /api/events` segment list moves to `GET /api/segments`.
- If something fails, show me the real error. Don't fake success.

Start with Milestone 8.
---

After Milestone 12: reload the unpacked `extension/` in Comet (chrome://extensions, Developer mode, Load unpacked). Tell Orange the tracker now serves `GET http://127.0.0.1:5700/api/interval?since=20m`.
