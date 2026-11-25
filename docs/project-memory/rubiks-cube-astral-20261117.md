---
name: rubiks-cube-astral-20261117
description: THE CUBE (Rubik's cube battle map, all six faces) — battle PR #1965 + Astral Realm placement PR #1971 merged 11-17
metadata:
  type: project
---
mondo 11-17 asked for a 7x7/8x8 Rubik's cube map in the Astral Realm, from his doc "Two Worlds, One Combat Grid" (Map B; Map A
sphere went to Outer Space). Thread (owner-project id). Plan + pics /mnt/project-files/rubiks-cube/.
His rules: turning the cube MUST move units ("rewrite everything if we must"); sight = own face, + edge face, corner 3 faces, team
vision unchanged; floating in Astral, broken-off pieces + missing pieces as terrain; the piece-stair must ASCEND (cube high up).
BATTLE SIDE MERGED PR #1965 (11-17, uploaded): 8x8x8, VS CPU map "The Cube" (TDM). Engine = FRAME (cross net round the acting face,
re-laid each activation, state remapped) + slice turn each round end; renderer folds per object. Notes areas-complexes.md "THE CUBE".
Probe script: scratchpad cube_probe.js (lost with container; pattern = playtest_maps.js launch + probe-fast).
KNOWN: CPU ignores the warned slice; end-of-round spawn-zone rings on hidden faces float flat.
ASTRAL PLACEMENT MERGED PR #1971 (11-17): bake-astral.js THE CUBE (2 plots S of Cloud Bridge middle, 23-square rising stair lv9->21, walkable top, room `cube` rect -> hqEncounterLaunch 'the_cube'); procs ew_rubiks_cube/ew_cube_piece (stickers tinted Rubik colours, _ew_noBatch). Claims row freed. Unchecked: walking the stair end to end, fight launch from top. HQ scene probe = ThreeRenderer.hq.dev.hqScene() (dev.scene() is the battle scene).
ONE LOOK PR #1973 (mondo angry 11-17: lava/water rules on battle faces + two different cube looks): faces' rule ground = tilefloor; both cubes draw via three-renderer _cubeFaceMat/_cubeCore. Never give the cube two looks. Stickers = marble_light tinted, NEVER lava/water even as a picture (PR #1974).
Related [[world-zones-plan-20261115]].
PASS 2 PR #1985 (11-17, (thread in the owner project)): previews polygon-offset over stickers; human's fighter
on another face -> relaid as top mid-turn (_cubeSettleTick); orbit tilt cap 82; round-end slice: camera pull-back + banner + 1.5 s swing
(first slice was never animated); TURN CUBE verb (row/column, 1 AP, once a turn, my pick: asked him) + CPU uses it (_cubeAiPick).
Still open: spawn-zone rings / loose VFX on hidden faces float unfolded; ROUND banner overlaps the swing.
TURN ARROWS PR #1992: TURN CUBE choices colour-coded (up cyan, down pink, left yellow, right green), rows named by on-screen slide direction (8 words, follow camera, NOT fighter facing), big arrows on board + conveyor arrows along the ring. ThreeRenderer is a script const, never window.ThreeRenderer.
