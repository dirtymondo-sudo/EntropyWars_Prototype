---
name: playtest-20261122-opus
description: 11-22 Opus playtest (2 VS-CPU matches + walked-room fight): bug list location, mondo's answers (Frozen IS a stun, use a computer-size screen), fixes shipped, how the cloud driver worked
metadata:
  type: project
  modified: 2026-11-22T22:19:34.782Z
---
Thread (owner-project id). mondo's answers 11-22: Frozen-as-stun is INTENDED (not a bug); text/HUD overlaps were my small 1600x900 window, so playtest at 1920x1080+; fix the counter label + the Sedan's second car (done in this thread); PvP maps vs story maps: leave for now.
Bug list + 20 shots: /mnt/project-files/playtest-20261122/BUGS.md.

Findings: (1) [not a bug] Frozen skips turns (data.js `frozen.blockAction:true` -> getNextBlitzUnit skips it) and lasted 2 turns, against "Frozen never stuns" + "status ends at caster's next turn end". (2) text cut-off: debrief VICTORY cut, map-select site cards, builder sticky notes, nameplate type tags overlap. (3) HUD overlaps: turn-order column over unit panel, RESISTED/CRIT banners over portraits, achievement toast over weather. (4) COUNTER!/SUPER EFFECTIVE labels on the wrong number. Unverified: held weapons not visible in cloud (units near-black, too small at 172% max zoom).

How: persistent Playwright driver via probe-fast.js with an HTTP eval/shot endpoint (scratchpad only); GAME.doMove/doSpell/doAttack per turn. canAffordSpell does NOT check MP. Never run handover probe beside it.

Related [[fresh-check-stale-checkout-20261115]].
