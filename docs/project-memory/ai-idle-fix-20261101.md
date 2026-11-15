---
name: ai-idle-fix-20261101
description: 11-01 fix for CPU units idling in corners/edges (path field walk, Guard-over-hit, longer last-seen hunt); causes, numbers, probe location
metadata:
  type: project
  modified: 2026-11-01T01:19:48.482Z
---
11-01 mondo: "enemy AI ... will just go to the corner and do nothing ... Have it Walk towards last seen enemy". Thread "Stop enemy AI idling in corners".

Causes found (CPU vs CPU Strength Test in Chromium, every AI decision logged):
1. Walk aimed at the A* path's FIRST STEP → 1 square per move behind any wall.
2. Tile pick traded 10/square progress against 0.08×threat → walked sideways/back toward the edge while carrying full goal score (siege/approach in circles on the edge).
3. Guard exempt from end-square danger (`_noDanger`) → Guard beat a better hit from the same square (~60% of Guards).
Also: last-seen hunt (already existed since 10-09) fell under advance_to_mid after 2-3 rounds and expired at 4.

Fix (ai.js only, weights untouched): `_goalField`/`_goalProgress` path field (only closer squares count), IDLE GUARD rule in rankCandidates (`c._stayPut`), hunt_last_seen kept 8 rounds with floor 75×weight, fallback never moves onto own square. Notes: docs/notes/champions-combat.md "THE IDLE CPU FIX".
Numbers: stuck units (3 rounds, no hit, ≤2 squares, enemy ≥5 away) Arena 102/8,075 turns → 11/14,582; TDM 110/9,542 → 10/10,142.
Probe scripts: /mnt/project-files/ai-idle/probe/ (idle.js runs N workers of the Strength Test with an instrumented ai.js copy at EW_REPO; instr.py adds the hooks; an.js/guard.js/mv0.js analyse). Never `pkill -f`/`pgrep -f` a pattern that appears in the same shell command (kills the shell).
Not fixed (known gap): CPU never Jumps/Climbs, so a unit on a ledge can still be boxed in.

[[ai-training-rework-20261029]] [[sandbox-playtest-speed]]
