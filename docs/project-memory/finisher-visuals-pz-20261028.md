---
name: finisher-visuals-pz-20261028
description: 2026-10-28 finisher look pass, P–Z races — what was swapped, helpers used, the cineWitnessCam fix, missing models flagged
metadata:
  type: project
  modified: 2026-10-28T14:46:31.387Z
---
mondo (10-28): finishers had blobs / bigger crude copies of units and crude walls; "use the actual unit", real textures, list missing models. Split across three threads by race initial (A–F, G–O, P–Z); shared scripts belong to the alphabetically first race's thread.

P–Z thread: PR #649 merged 10-28, sync zip ENTROPY_WARS_SYNC_20261028-1552 (battle.js, three-renderer.js, three-vfx-effects.js):
- Bodies: `ThreeRenderer.raceActor(race, ts*_bodyK(), {slot})` + new `play(slot,{once})` on the actor. Caster races hard-coded per script (spy, police officer, swordfighter, symbiote, skeleton, valkraye, mech for Megazord, homosapien referee). Victim copies via `_finRaceAt(tx,ty)` (Observed ghosts, Keelhaul).
- Skinwalker has no 3D model: Wearing You uses its RACE_SPRITES art as a Sprite.
- Textures: `_finTerrainMat(key, col, extra)` = a TERRAIN_SPRITES sheet material (Mind over Matter sides, Avalanche, Farewell Tour, Drain cape, Abracadabra hat, Unmasking serpent, Last Verse sea, Full Moon fur).
- GLBs: church_building, catholic_pew/church_pew/church_podium, field_goal_post, white_cloud, skull_pile, arrow, pistol, mic; angel wings on Valhalla's horse.
- `_wpnDrip` warms 'race:<r>' (retries until the bake lands) for races not on the board.
- battle.js cineWitnessCam(center, exclude, opts) now accepts (victim, optsObject): ~40 directors called it that way and threw, so witness cuts never ran.

Missing models flagged to mondo (not faked): top hat, magic wand, dove (Abracadabra); serpent (Unmasking); wine glass/goblet (The Drain); gavel (Motion Carries); archery target (Split the Arrow). Calls flagged: Megazord = mech model; referee = homo sapien; skeleton chorus 22→14; church pews as parliament benches.
