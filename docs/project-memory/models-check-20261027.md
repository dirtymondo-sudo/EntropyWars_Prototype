---
name: models-check-20261027
description: 10-27 models check (PR #594): which "missing" spell models already existed, what was swapped, mondo's true still-needed list
metadata:
  type: project
  modified: 2026-10-27T07:07:46.573Z
---
mondo 10-27 sent his to-make list from the spell VFX audit ([[spell-vfx-audit-20261026]]) and said UFO, bomb, knife, pen, Camelot throne, zombie already exist.
PR #594 merged, token 20261027-models-01-cors, zip r2-sync/ENTROPY_WARS_SYNC_20261027-0707.zip (three-renderer.js, three-vfx-effects.js).
Proof sheet /mnt/project-files/models-check/models_on_screen.jpg.

- Probe ALREADY flew the Triangle UFO GLB (custom-anim doc [[custom-anim-proposal-20261026]] was wrong to say hand-built).
- Swaps: Deneuralizer = HQ catalogue `pen` + glow bulb at tip; Throne of Ashes = catalogue `royal_throne` rising behind the caster;
  Shambling Horde = 6 clones of the zombie race model on its run slot via new `ThreeRenderer.raceActor(race, height, o)`.
- Truly absent anywhere (code, catalogue, xmas/metro packs): knife/dagger (only proj_knife.png sprite), a bomb FILE (Plant Bomb's
  bomb is hand-built `_makeBombProp`; told mondo no bomb needed), sack, rope, mic, trumpet, piano. Instruments upload has no brass.
- Covered by other packs 10-27: bear trap (traps thread), spear, Brood drone = bumblebee, spirit animal = wolf, hawk = eagle.
- Harness gotcha: sv-run doesn't warm the spell library — pass --opts pre "ThreeVFXEffects.warmSpellLibrary()" + wait 25000;
  in sv-ctl never leave the clock paused before SA.boot (hangs). ThreeVFXEffects.fireGeometry / fire('burst',…) fire a look directly.
