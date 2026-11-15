---
name: fresh-check-stale-checkout-20261115
description: Why a thread tested a weeks-old game on 2026-11-15 (stale local origin/main ref in the container) and the fresh-check guard, PR #1446
metadata:
  type: project
  modified: 2026-11-15T15:10:07.213Z
---

2026-11-15: mondo furious that a thread (elevator) posted a proof picture of an out-of-date game (old theme).

CAUSE (confirmed by that thread's reflog, and seen in this thread's own container): cloud containers start with a SHALLOW clone whose local `origin/main` ref is days old (pointed at d930886 = PR #1082, 2026-11-09) while HEAD looks current. `git checkout -B <branch> origin/main` without `git fetch origin main` first gives the 11-09 game. The harnesses serve the checkout's .js/.css + index.html, so the test browser ran old code. A later merge says "refusing to merge unrelated histories" until `git fetch --deepen=300 origin main`.

FIX (PR #1446, CLAUDE.md RULE #1d): `fresh-check.js` + server.js (off Render only). A checkout missing a PR that merged >60 min ago serves a red STALE CHECKOUT page instead of the game; a fresh page logs `[EW BUILD] HEAD … main … N PRs behind` (window.EW_BUILD) and shows a red CODE MISMATCH screen if any cdn.entropywars.net game script the page ran differs from the checkout. `.claude/hooks/session-start.sh` fetches main at session start. `EW_ALLOW_STALE=1` only for a bisect.

**How to apply:** first command in every thread and before any browser proof: `git fetch origin main && git merge origin/main`. Proof replies state the [EW BUILD] HEAD. Threads started before PR #1446 only get the guard once they merge main; coordinator should tell working threads to do that. Never work around the red screens.
