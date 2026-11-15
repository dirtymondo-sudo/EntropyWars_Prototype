---
name: cpu-self-aoe-aim-20261106
description: PR #961 (11-06) fixed CPU casting self-centred area spells (Crowd Surge, Exhaust Cloud) at nobody; how to prove CPU spell picks in the browser
metadata:
  type: project
  modified: 2026-11-06T15:00:37.660Z
---
Playtest G1/H1/G2 fixed in PR #961 (merged + uploaded 11-06, ?v=20261106-selfaoe-01-cors). Cause: ai.js `_reaimSpellTarget` re-aimed aoeOriginSelf spells at drum enemies; doSpell snaps them to the caster, so they hit 0. Self-centred spells now keep the picker's aim; aoePull/zoneDebuff score from the caster square. Notes: docs/notes/champions-combat.md "THE SELF-CENTRED AIM".

Proof recipe that worked: VS CPU, your own team carries the spell, Pause-free **Tactics > Fight** per unit makes the CPU play that unit (real CPU decisions on your side). Read-only `window._aiPlanCandidates(unit)` lists the CPU's candidates; an old ai.js can be loaded side by side via the harness (copy `git show origin/main:ai.js` to repo root, fetch it from `https://cdn.entropywars.net/<name>` inside the page, run with `new Function('window', src)(Proxy)` so its window writes stay local). Delete the copy after.

Related [[playtest-battles-20261105]] [[ai-audit-20261101]] [[sandbox-playtest-speed]]
