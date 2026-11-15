---
name: seed-farming-plant-monsters-20261112
description: Seed rework (watered seeds, plant monsters, Bee Queen pollen): his answers, what shipped in PR #1216 + #1224, what is next
metadata:
  type: project
  modified: 2026-11-12T14:49:05.848Z
---
mondo 2026-11-12 asked for a PLAN ONLY: seeds must be watered to sprout (rain, water spells); Leech Seed -> thorny-vine plant
turret; Poison Seed -> poison-gas AoE plant; Healing Seed -> healing flower or apple tree (zone heal or drops apples/potions);
Bee Queen collects the flower's pollen; Bumper Crop maybe too strong; tree chopping stays; new 3D models replace the 2D seed sprites.
Thread (thread in the owner project). Doc (Claude Doc): https://claude.ai/artifact/2hDVKXrT82a2FfypmiKwdV
Pointer file: /mnt/project-files/seed-farming-20261112/README.md. He OK'd the build 11-12.

Facts read from code (main at PR #1213):
- Units with seed spells (Agriculture family): bee queen, chef, hippie, jack o lantern, scarecrow, shaman, tree person, antperson
  (antperson = Bumper Crop + Green Thumb only; hippie no Poison Seed; tree person no Healing Seed). Starting kits: hippie
  (Healing Seed), chef (Healing Seed, Bumper Crop). Only tree person has Green Thumb + Trunk Throw together.
- NONE of those eight owns a water spell or rain weather (18 of 135 units have a water spell).
- No battle walk-over healing item exists (bombs, traps, capture doors only): apples need a new system.

HIS ANSWERS 11-12 15:14 (doc section 8): flower AND apple tree eventually (apple tree = a real tree; he may add a new FARMER
character to plant apple trees); dry seed keeps under-foot effect; Watering Can yes; Bee Queen Pollinate + Honey, pollen also
boosts her ATK + speed; Bumper Crop option 1 (seeds need water); plants have a REAL HP BAR; cap 2 per type per planter, upgrades
raise it; plants don't block sight; Blood Rain does not water; thorn vine reach 2, upgrade can lengthen.
Bigfoot fact told to him: no seed spells, no Green Thumb -> no tree loop today. OPEN: who plants real trees (I proposed an Apple
Seed spell); whether Bigfoot gets planting. Concepts he OK'd: /mnt/project-files/seed-farming-20261112/plant_concepts.jpg.

SHIPPED PR #1216 (11-12, token 20261112-garden-02-cors): seeds need water; Healing Flower / Gas Plant / Thorn Vine as
state.turrets `plant` rows (real HP 35% of planter max HP, cap 2); Watering Can (Agriculture T1, id wateringCan); Bumper Crop
seeds need water (dry ones wither after 2 rounds); 3D seed + sprout; Meshy models on R2 Assets/world/props/meshy/ew_plant_*.glb
(he OK'd the 4 concepts 15:22; apple tree = existing tree + pack apples, his word). Notes: champions-combat.md "THE GARDEN".
Proof /mnt/project-files/seed-farming-20261112/garden_on_board.jpg. Test tip: plant model loads need {front:true} on _loadMiscModel; headless round end = processEndOfRoundZonesAndSeeds(function(){}).

SHIPPED PR #1224 (11-12, token 20261112-pollen-03-cors): THE POLLEN. Healing Flower holds 1 pollen, regrows each round end; Bee
Queen gathers ending a move beside one or at round end (any side's flower, max 3, `unit.pollen`); Honey +8 ATK / spell power / SPD
per pollen; Pollinate (Royal Hive T1, id pollinate): 1 pollen, seed grows now or plant mended 50%. Chip POLLEN n/3. Also FIXED a
#1216 bug: plants only acted while a seed was on the board. My picks told to him (8/8, max 3, any side, 50%). Not built: Drones
fetching pollen. Proof /mnt/project-files/seed-farming-20261112/pollen_on_board.jpg. 
SHIPPED PR #1226 (11-12, token 20261112-appletree-01-cors): THE APPLE TREE. Apple Seed (id appleSeed, Agriculture T2, kind seedHeal +
seedType 'apple') -> real tree (plantedTrees row `apple`), drops an apple every 2 rounds (max 2 lying), any hurt unit eats +20% max HP
(state.apples). Meshy apple Assets/world/props/meshy/ew_plant_apple.glb (no pack has one). Tree = board's stock tree (a pine look).
NEXT: upgrade rows for plant cap + vine reach (hooks plantCapBonus / plantRangeBonus). Unchecked overall: CPU, online guest, his Mac.
