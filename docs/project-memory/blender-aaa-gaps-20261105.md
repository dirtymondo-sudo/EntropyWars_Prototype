---
name: blender-aaa-gaps-20261105
description: 11-05 ideas doc (no code) on what cloud Blender can do for the game + AAA gaps; ranked list, awaiting mondo's pick
metadata:
  type: project
  modified: 2026-11-05T06:09:26.217Z
---
mondo 11-05 asked: now that Claude can use Blender, what next (rigging, animations, cutscenes, pre-rendered intros/Entropy
Strikes, maps/DOOR HQ as GLB), what AAA would do, what the gaps are. Thread "Plan Blender upgrades and AAA gaps"
 (thread in the owner project). Doc: https://claude.ai/artifact/AJ51krxhmmE93EMbWEkLkh . Nothing built.

Ranked list given: 1 mocap library MAL4 (retarget free CMU mocap in Blender onto Meshy bone names, per-race `lib` opt; pilot 5
races; needs his OK to download) 2 creature rigs (dragon/dinosaur/kaiju play human UAL clips today) 3 Entropy Strike Blender
set pieces played live 4 VFX noise set + mesh kit 5 Blender->EWCine camera-path bridge (pilot on Crossing intro) 6 room kit
pieces + baked AO per zone 7 onboarding VHS tape as low-res FMV (needs his script) 8 cast faces (low).
Advised AGAINST: pre-rendered battle intros/strikes (can't show the player's own units), whole rooms as GLB (grid, LOS, climb,
editor read room data). Facts: cloud box 4 cores, no GPU, bpy not preinstalled (pip bpy 5.2.3 or tarball).

**How to apply:** whichever row he picks = a fresh thread built from this doc; don't re-research.
Related [[blender-vfx-research-20261103]] [[modular-characters-plan-20261101]] [[custom-anim-proposal-20261026]] [[cinematic-camera]]

BUILT 11-05 (mondo picked row 1): PR #902 merged, token 20261105-mocap-02-cors, uploaded sprites.js + data.js + Assets/characters/animations/MOC1_CMU.glb (lib 5). Tool bake-mocap.py + mocap-clips.json (pure numpy; the game retargets). Mocap idles/walks on superhero, priest, cowboy, mad scientist, gangster + 5 creator idle picks. CMU source: git clone una-dinosauria/cmu-mocap (sparse). Notes models-assets.md "THE MOCAP LIBRARY". Check page = plain three.js + the game's retarget fns copied from three-renderer.js (scratchpad only, not in repo).
