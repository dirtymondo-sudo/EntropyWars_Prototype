---
name: playtest-vscpu-r10-20261028
description: 10-28 hands-on VS CPU Arena playtest on Hell Arena to round 10 then forfeit (report only); doc link + top findings
metadata:
  type: project
  modified: 2026-10-28T22:59:31.205Z
---

10-28 (main 2fe6d65, PR #653): mondo asked for a VS CPU playtest to round 10, then forfeit, documenting bugs/friction/biggest improvements. Played by hand with the harness ([[sandbox-playtest-speed]]): Party Builder team Bigfoot/Angel/Astronaut/Anubis vs CPU Astronaut/Swamp Monster/Martian/Ice Queen, Arena, Hell Arena 12x12, Cinematic. Forfeited R10 leading 250-104, kills 3-2. Report (Claude Doc): https://claude.ai/artifact/NCiLJ86xC19Y671braQ6aR ; shots + match export /mnt/project-files/playtest-r10-20261028/. Nothing fixed.

Top findings: default battle camera after a move sits so high units show as small-plate portrait cards most of the match (likely past the UI Maker small-plate line); spell shots frame the caster, target off-frame; Big Kick shot framed the pre-picked first-row target, and Big Kick never pushed; Pisces zodiac pan = black screen in Hell room; clicking a tile under a flying ally opens the ally menu + its info card covers the P1 score bar; target list stacks over the Abilities list; hover highlight louder than the CONFIRM pick (Mana Potion); heal rows and Cube rows have no forecast number; cooldown spells vanish from Abilities; damage floats coloured by element (green Entangling Roots reads as heal); doubled log lines (Nexus burn 363 vs 234, fall, per-target Whirlpool); Drought + Blood Rain at once; CPU Martian guarded 4 of 6 turns. Forecasts all within 8%. Entropy gauge never filled in 10 rounds, so no finisher/fangs seen.

Harness tips learned: SPACE end turn needs two presses within 1.6 s; clicking an already-armed target row commits at once (then CONFIRM fires a second action); left-panel BUILD/CHANNEL/INSPECT/LAND are not in `ph menu`, click by coordinates from a screenshot.

10-29 follow-up: mondo answered per item. Shots 1-3 (camera height/plates, green damage float, stacked menus) "don't worry for now". Fixes split by the coordinator into threads: flyer vs tile clicks, spell camera shows the hit (incl. Mummify look + LAST STAND clip), ceiling fade for sky/celestial, robust previews (heals too), weather interactions, log double lines (bugs 4/5), map site screenshots. Code findings: Mummify = traps-pack sarcophagus GLB + 42 flat PlaneGeometry linen strips (three-vfx-effects.js _afWraps3D), not loading; float pops (three-renderer.js _layoutFloatTexts) stack upward with no screen/letterbox/HUD clamp.
