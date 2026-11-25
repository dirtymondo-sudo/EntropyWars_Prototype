---
name: weapons-in-hands-20261122
description: 11-22 weapon-holding MPFB units: mondo's decisions, 11 new wp_* weapon models, 22 units grip weapons (PR #2402 + #2406), six new MPFB looks, what is still open
metadata:
  type: project
  modified: 2026-11-22T15:40:14.329Z
---
Thread (owner-project id) ("Make units hold their weapons"). Full notes: repo docs/notes/character-models-plan.md section 6e.

mondo 11-22 (his words): MPFB versions only "for characters where holding a weapon is a big part of their identity ... hold their weapons correctly with their fingers and have their weapon models separate". Order: "get the models made and fingers holding the weapons first", THEN he wants the spell/attack animation redo split into separate threads. "after i approve them they can become the default for these units" (MPFB look stays non-default until his OK). Samurai Slug keeps his model with a separate katana, "it just needs to look good". Meshy credits topped to ~3000 on 11-22.

Done PR #2402 (token 20261122-weaponhands-02-cors, uploaded): 11 Meshy weapons at R2 Assets/world/props/meshy/weapons/ (data.js wp_war_fan, wp_cutlass, wp_shuriken, wp_gladiator_net, wp_taser, wp_pepper_spray, wp_harpoon_gun, wp_sickle, wp_deneuralizer, wp_gladius, wp_excalibur); sprites.js RACE_CREATOR_LOOK_DEFS[race].hold for swordfighter, knight, king arthur, pirate, sheriff, marksman, gangster, spy, barbarella, police officer, popstar, scarecrow, men in black; robinhood wears pack bow + quiver; new grip.cant in three-renderer.js _gripTurnTo.

Tools in /mnt/project-files/weapon-hands/: batch1.json + gen.py + models.py (concepts/models), scripts/glbprofile.js (find a handle), scripts/hold.js (look probe on probe-fast.js; UNITS=race:gender TURN=1 TAGS=front,side,side2; serves new weapons from MIRROR=/tmp/w/mirror). Judge grips from the SIDE.

Batch 2 PR #2406 (token 20261122-weaponhands-03-cors, uploaded): six first-pass MPFB looks, stock faces, NON-default (RACE_REMADE_LOOKS): swordfighter M, shogun, gladiator M+F, ninja M+F (ewm_t2<unit>_outfit/_hat; T2 sources in weapon-hands/units/). Holds: shogun katana + war fan (new def.hold2 = second hand), gladiator gladius, ninja shuriken, wizard staff upright (his answer: "staff but ... we will do the animations later"), time cop revolver at rest (his answer: "his weapon should switch depending which one he is/which spell he uses" = spell threads).

Open: WAITING on his approval before any MPFB look becomes default; then he splits attack/spell animation redo into separate threads. First-pass flaws: gladiators' jagged cape/skin edges + hole in her cape, swordfighter M collar/sleeve slits, ninja F neckline; no unit faces (bake-face.py); second holds (shields, net, taser); valkraye spear is FBX; Robin Hood outfit has a bow on its back + pirate outfit a loose disc (rebake with DROPAT); Samurai Slug separate katana not done; not seen in a battle.

Flaw round (his 11-22 "go ahead and fix those issues ... would blender be easier": it IS Blender by script, bake-outfit.py). PR #2412: new env SHOWRING=2 (skin shown under every cloth edge: the jagged dark bands were hidden body skin, not the cloth), EDGECLEAN=6, HOLEFILL=24; gladiators M+F clean. PR #2414: ninja F REGENERATED (first T2 run had skin fused into the top; second run units/ninjaf_t2b.glb clean), look drops ewm_t2ninjaf_hat. LESSON: skin fused into a garment shell = regenerate first, do not fight it with cuts (CUTCOL left see-through bands). Not SHOWRING on a loose kimono (shoulders come through). Still open: swordfighter M collar V, gladiator F knee guards + hip hole, ninja F small bits by collarbones/neck. Details: character-models-plan.md 6e.
PR #2415: swordfighter M + gladiator F also regenerated (units/*_t2b.glb) and rebaked, ninja F loose strands dropped (DROP). PR #2421: swordfighter M armpit skin holes closed (bake env HIDETORSO=1 TORN=9: hide trunk skin under a robe). Open: his pointed shoulders; stock faces on all six; no battle check. Waiting on mondo's approval of the looks.
