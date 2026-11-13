# First Mate with Antigravity CLI (agy): verified notes

**TL;DR:** First Mate is an "agent distro": you clone it and start a supported harness inside it. Shreyan uses **Antigravity CLI (`agy`)**, the terminal CLI. It is verified as primary, secondmate and worker. Start it with `cd firstmate && agy` and talk in plain language ("ahoy", "bearings", "afk"). There is no `/firstmate` command, and agy has no verified slash-skill form. Workers mirror the primary harness when `config/crew-harness` is unset, so they run on agy with his Google sign-in and need no API key.

Source: https://github.com/kunchenguid/firstmate @ `427056c` (12 Nov 2026). Files read: README, AGENTS.md, `.agents/hooks.json`, `docs/configuration.md`, `docs/supervision-protocols/agy.md`, `harness-adapters/references/harness/agy.md`.

| Fact | Detail |
|---|---|
| Start | `cd firstmate && agy`. This is **inferred** from the README pattern ("launch a co-primary harness inside the clone"), which gives no agy-specific line, and it matches how shreyan already runs it |
| Session start | `.agents/hooks.json` runs `bin/fm-sessionstart-agy.sh`, which prints the digest. PreToolUse hooks guard shell and `cd`. The Stop hook parks on the watcher between turns, so finished workers wake the session |
| Commands | Plain language. "No verified slash-skill form; use natural language" (agy adapter). `/ahoy` typed in agy is **unverified** |
| Workers | Order of precedence: per-mate override → `crew-dispatch.json` default → `config/crew-harness` → **the primary's own harness**. Unset means agy. Launch: `agy --prompt-interactive "<brief>" --model <id> --effort <level> --dangerously-skip-permissions`. Each worktree is pre-registered as trusted in `~/.gemini/antigravity-cli/settings.json` |
| What workers load | `GEMINI.md` → `@./AGENTS.md`, plus `.agents/skills/` |
| Isolation | One treehouse worktree per task, on branch `fm/<task>` |
| Modes | `direct-PR` (chosen), `no-mistakes`, `local-only`, `no-mistakes-prod-only`. `+yolo` is off by default. Registry: `data/projects.md` |
| Requirements | git, `gh auth login`, tmux |
