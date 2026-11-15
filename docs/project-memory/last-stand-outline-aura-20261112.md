---
name: last-stand-outline-aura-20261112
description: 11-12 Last Stand aura redesign as anime outline aura; mock-up A/B posted, WAITING on mondo's pick, not merged
metadata:
  type: project
  modified: 2026-11-12T03:45:34.113Z
---
mondo 11-12 03:27Z: redesign the Last Stand aura "more like a dbz / one piece / demon slayer" aura around the unit's
perimeter, starting from the red/blue team outlines. Thread "Redesign Last Stand aura as anime outline"
 (thread in the owner project).

STATE (11-12 03:50Z): mock-up built on branch claude/project-thread-w4m1rf (commit 671a33d, pushed, NOT merged, no PR,
no ?v= bump). Decision card posted: A (tight, recommended) / B (taller flames = EW_LS_AURA_TUNE {width:1.15, lift:1.7})
/ changes. Do not ship before his explicit OK.

BUILD (three-renderer.js "THE LAST STAND OUTLINE AURA"): 3 extra inverted hulls on the body meshes (same per-unit
stencil mask as the team outline, so only outside the silhouette), flat bands core/mid/outer, tongues step 12x a second,
colour from the viewer's side (LS_AURA_PAL), built lazily from unit._lastStandTriggered in _updateUnitAuras
(_lsAuraWear / _lsAuraTick). TSL twin registered ('last stand aura') and proven on ?ew_gpu=webgl2 (node renderer).
Off switch window.EW_NO_LS_OUTLINE_AURA (old shroud). Flow State + spell bursts untouched.

OWED AT SHIP: sprite units (still old shroud), real WebGPU check, 2-player online look, motion check, docs/notes/
spells-vfx.md note, PR + merge + ?v= bump + `node sync-zip.js --upload`. Open questions put to him: keep ring / streaks /
crackles / light? enemy red-orange vs the 2026-08 "reads as on fire" move to icy blue; same look for Flow State?

Proof: /mnt/project-files/last-stand-aura-20261112/01_mockup_close.jpg, 02_mockup_play_distance.jpg.
Capture recipe: playtest harness `ph start --query '?ew_gpu=webgl2'`, VS CPU random team, eval sets
u._lastStandTriggered, `camera.snap({_force:true,x,y,zoom:7,tilt:62,yaw:315})` (some yaw/tile combos pop top-down),
hide HUD with a `body *{visibility:hidden}` + `#threeCanvas{visibility:visible}` style, GAME.state.fogOfWar=false to see enemies.

UPDATE 03:55Z: mondo said A and B looked the same on the enemy (true: stills shot at different animation moments) and
"yes i want to fix flow state too". Flow State (killstreak 3+) now wears the same outline aura in gold (LS_AURA_PAL.flow,
both sides; commit pushed on the branch). EW_LS_AURA_TUNE {time} freezes the flames for same-moment shots. Sheet 03
posted (A vs B = {lift:4,width:1.5}, + Flow). New card: A / B / spikier flames first (recommended). Told him I'd fix:
enemy outer band to deeper red-pink (reads yellow next to Flow gold), deeper Flow gold, lobes are round not pointed.
Lesson: compare animated VFX variants at a frozen time, never free-running stills.

UPDATE 04:00Z: he tapped "Spikier flames first". Mock-up 3 built + pushed on the branch: 6 stacked hulls + core, each
cut by a triangle-wave stripe (keep if tri*amp > shell fraction) read at the body point, so stacks narrow to points;
lift 0.30 ts. Enemy outer 0xb8104a, Flow outer 0xe07800 / mid 0xffc21a. Sheet 04_mockup_spiky_flames.jpg posted,
asked for plain OK (no card). Still WAITING on his explicit OK; owed-at-ship list unchanged.

SHIPPED 11-12 ~04:45Z: he said "okay yeah that's better" to mock-up 4 (taken as the OK). PR #1162 merged, token
20261112-lsaura-01-cors, three-renderer.js 4987b72a live on R2 (token URL checked). Sprite units done (_LS_SPR_FRAG).
Seen on classic WebGL, node WebGL2 and SwiftShader WebGPU (headless WebGPU drew fine this time, sprites compile late).
Notes: docs/notes/spells-vfx.md "THE LAST STAND OUTLINE AURA". Proof 05-07 in the project folder.
Classic gotcha: stripe coordinate must be taken at the PUSHED vertex or the flames become round lobes.
NOT SEEN: real 2-player online, boss-size unit, his Mac. Open for him: stair-stepped edges OK? enemy pink deeper?
Old ring/streaks/crackles/light are gone for these two states (he was told, did not object). Spell bursts keep the shroud.
