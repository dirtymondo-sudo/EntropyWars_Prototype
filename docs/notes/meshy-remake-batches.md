# THE MESHY REMAKE BATCHES (2026-11-13)

mondo 11-13 13:25Z: "start some threads to make new models for all of the units, the same way we did cowboy and robin hood ...
use what is available from the clothes in the character creator ... meshy for parts and pieces we don't have ... Do a pass on
all of the characters first". Three threads share the work. This file is THE split: every thread takes its share from here.
Plan + method: `meshy-remake-plan.md`. Status per unit goes in that file's section 8 table, in the same PR as the work.

The list = `meshy-remake-plan.md` section 7 group A "Left", in the doc's order, minus the ones already done
(angel, catgirl, mummy, quarterback, robinhood, zombie) and djinn (Meshy refused it twice; mondo 11-12 "skip djinn for now").
Groups B (creatures, wait on row 18 heads) and C (keep their own model) are NOT part of this. Seraphim is done.
A unit with two genders is one entry: the same thread does both.

RULE FOR ALL THREE (his words): creator clothes FIRST (the creator's quarterback helmet beat the Meshy one). Look through
`EW_MH_WEAR` / MODEL_LIST.md for pieces that fit the unit before any Meshy call; Meshy only for the pieces the creator lacks.

STATUS 11-13: batch 1 first pass shipped (19 looks; antihero, atlantean, fortune teller M held back; ghost M is a pack model, left). `mpfb_shapes.glb`: after merging main ALWAYS rerun `node bake-custom-shape.js` (it rebuilds from every custom_shapes/*.json), never pick one side's file. New bake tools for all threads: `EYE=` (bake-outfit.py) + `cy=top0.155` (bake-face.py), notes in models-assets.md "BATCH 1 OF 3".

## BATCH 1 of 3 (thread "Remake unit models, batch 1 of 3", branch claude/project-thread-4vyqdm)
1. annunaki (M)
2. antihero (M)
3. astronaut (M)
4. atlantean (F)
5. barbarella (F)
6. bunny girl (F)
7. chef (M)
8. clown (M)
9. conspiracy theorist (M)
10. cowboy (F)
11. cult leader (M)
12. demon (F)
13. demon princess (F)
14. fairy (F)
15. fallen angel (F)
16. firefighter (M)
17. fortune teller (M + F)
18. gangster (M)
19. general (M)
20. ghost (M, F)
21. giant (M)

## BATCH 2 of 3
22. glitch (M)
23. halfdemon (M + F)
24. hippie (M + F)
25. homosapien (M)
26. ice queen (F)
27. ki fighter (F)
28. King Arthur (M)
29. luchador (M)
30. mad scientist (M + F)
31. marksman (M + F)
32. men in black (M)
33. mime (F)
34. mushroom girl (F)
35. necromancer (F)
36. nephilim (M)
37. nordic (M)
38. orb of light (F)
39. overlord (M)
40. pirate (M + F)
41. police officer (M)

## BATCH 3 of 3
42. politician (M)
43. popstar (F)
44. priest (M, F)
45. professor (M)
46. ringmaster (M)
47. santa clause (M)
48. scarecrow (M)
49. shaman (F)
50. sheriff (M)
51. sidekick (M)
52. spy (F)
53. succubus (F)
54. superhero (M + F)
55. swordfighter (F)
56. symbiote (F)
57. telepath (M + F)
58. time cop (M)
59. valkraye (F)
60. vampire (F)
61. wizard (F)

## Shared files: how not to trample each other
- `sprites.js` (EW_MH_WEAR, RACE_REMADE_LOOKS), `ASSET_MANIFEST.json`, `MODEL_LIST.md`, `index.html` `?v=`: all three threads
  edit these. Merge main before every PR, keep BOTH sides, re-bump the token.
- `bake-outfit.py`: a new rule must be OFF by default (a flag or env) so the other threads' units do not change under them.
- Piece names: `ewm_t2<unit>_outfit.glb` / `_hat.glb` as before; the unit name keeps the files apart.

## BATCH 3 STATUS (2026-11-13, thread "Remake unit models, batch 3 of 3")
All 23 models (20 units) have a remade look in `RACE_REMADE_LOOKS` (sprites.js block "REMAKE BATCH 3 OF 3"); per-unit rows + bake
settings: meshy-remake-plan.md section 8. 27 Meshy T2 runs (405 credits). Faces: 21 fitted with bake-face.py from the old heads
(men in full, women SOFT). Creator pieces used in place of Meshy: popstar's whole outfit, telepath F's gown, sheriff's hat, the
witch's hat, valkraye's wings, succubus horns + tail, swordfighter's katana, sidekick's mask, glasses, Santa's beard.
Weakest, for the next pass: superhero F's cape, scarecrow's head (needs a sack), succubus bits by the hands, professor's painted glasses.
Probe lesson: the look probe at half size (450 x 550 viewport) is about 3x faster and survives two browsers; the first unit of a run
is shot while still loading, so put a throwaway unit first. Not seen: any of them in a battle, on WebGPU, or on the other four bodies.

### Batch 3, mondo's review of sheet 1 (2026-11-13, same thread)
- Popstar ("surely theres a bra ... in the underwear section", "her feet are poking out of her heels"): top = creator `mhw_joepal_plain_bra`
  tinted white. THE FOOT IN THE HEEL (three-renderer.js skinCover): the skin a SHOE's own delete list names is hidden whole (a pack heel
  is made round a foot on tiptoe; the flat forefoot lay outside it). Every pack shoe, every body.
- Santa ("make his head bigger or add a head size slider"): THE HEAD SIZE = FACE > Head > Size (`appearance.headSize`, -1..1 = 50..150 %,
  the head BONE scaled in the rig's tick, so hair / beard / hats / eyes follow). Santa 0.8. A random face leaves it at 0.
- Priest ("add a cross necklace"): creator `ewm_crosspendant`.
- Nun ("hair or hood looks messed up"): her head was bare under the coif; creator `mh_short01` brown under the veil.
- Spy ("dress straps are messed up, hand looks disconnected"): her halter straps are painted on the T2 skin and went with it. Bake
  `TOPCUT=0.30` (dress cut level), `ARMALLX=0.3` (painted bracelet off the bare arm), `DROP` (shoulder lump, loose bracelet, underarm
  pouch); straps = creator `mhw_punkduck_brazilian_bikini_bra` tinted red under the dress. Six creator dresses tried: all worse.
- Politician ("neck or shirt seam looks jagged"): NOT FIXED. The collar piece is smooth at rest; the body's wider neck crosses the cloth cup
  Meshy closes the collar with. Tried and thrown away: smoothing the collar's edge (no change), hiding the neck under it (the hidden
  skin's edge scallops), laying the cup on the neck (z-fight at the throat). Next: a creator shirt + tie under a T2 jacket, or a new T2 run.
- NO WEAPONS IN AN OUTFIT (mondo 11-13 16:57, on batch 2: "dont give her a sword ... characters will hold those weapons, dont make them part
  of the outfit"): swordfighter's creator `ewm_katana` out of her look; bake `DROP` leaves out the holstered pistols (time cop, sidekick) and
  the sheriff's holster + revolver. The spy's thigh pouch and the sheriff's lasso stay (not weapons to hold).
- THE MESHY HANDS (coordinator, from batch 1: "fingers look messed up"): bake `HANDCUT=1` cuts a bare hand fused to its sleeve so the
  body's hand shows: politician, priest, shaman, superhero F. Gloved units keep their gloves.
- REVIEW ROUND 2 (mondo 11-13 17:08, pins on the round 1 sheet). Superhero F "super jagged sleeves and cape": her Meshy cape is one shell
  with the suit, so bake `DROPCOL="0.667,0,0.188,0.35"` cuts it out by colour (shaded folds too) and the look wears the creator's
  `bcape_hero`; `CUFF=1 CUFFIN=0.03` saws the sleeve ends straight across the arm. Shaman "juts out at a right angle": cape cloth within
  16 cm of the arm line followed the arm (`SLEEVER=0.07` stops it) and 22 loose leaf patches on the cape drew as black squares (bake
  `DROP`, the shoulder leaves stay). Nun "hair still messed up": no hair, the creator's `mhw_punkduck_swim_cap` in white is her coif under
  the veil. Popstar "more dolled up": `mh_elvs_island_princess_hair` (ten tried on screen).
