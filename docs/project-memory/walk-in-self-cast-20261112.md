---
name: walk-in-self-cast-20261112
description: PR #1188 (11-12) Scatter Shot + enemy-only novas now MOVE→CAST (walk-in self cast); thread, what is unchecked, harness staging tips
metadata:
  type: project
  modified: 2026-11-12T07:55:40.370Z
---
mondo 11-12: "Scatter shot wasnt moveing+casting for me". Thread (thread in the owner project). PR #1188 merged + uploaded (?v=20261112-walkincast-01-cors).

Cause: self-casts were skipped by every approach path, yet the Abilities row lit MOVE→CAST (hasReachableTarget asks the pool). Pick only offered CONFIRM on the caster, cast refused "no enemy in range and in sight to hit".

Fix (battle.js `_selfPoolSpell`, `_selfPoolHits`, `_selfPoolWalkIn`, `_selfCastNoWalk`; hud.js `_aimSelf`, target rows, enemy quick menu): random-target rows (Scatter Shot, Things That Go Bump, The Whole House Shakes, Stack Overflow, Every Eye at Once) + 31 enemy-only novas (Meow, Demonic Roar, Fear, Requiem, Quake…). With nobody in reach the list names enemies a step brings in; confirm / board click walks to the farthest square that still hits, then casts. In reach = unchanged. No rule or data.js change. Notes: docs/notes/champions-combat.md "THE WALK-IN SELF CAST".

Proven in browser (WebGL2, VS CPU Mount Shasta): Scatter Shot from Abilities (confirm + board click), enemy quick menu, plain in-range cast, Meow walk-in. NOT checked: online guest, the CPU's use, jump/height approaches for these rows, the other 4 random rows by hand (same code).

Harness tips: scatter range 4 > unit vision 2-3, so a walk-in case needs the enemy seen by an ALLY; `ph sel ".ew-clog-fold"` folds the combat log that covers board tiles; Escape with nothing armed opens pause (ph text "/RESUME/"). Related [[no-walk-first-20261107]] [[playtest-mechanics-20261107]].
