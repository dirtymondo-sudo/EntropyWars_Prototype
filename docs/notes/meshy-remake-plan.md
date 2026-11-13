# THE MESHY REMAKE PLAN (2026-11-12)

The plan for carrying the "remade look" process through the rest of the roster. Tracker row: `character-models-plan.md` 21d
(done work) and 21e (this plan). Build notes: `models-assets.md` "THE MESHY OUTFITS". Read all three before starting a unit.

mondo 11-12 04:00Z, the goal in his words: "make the models more realistic and iron out the kinks of the meshy models and
improve them, and each one will probably need visual verification like these 3 did. Also I want to get the faces a little
more accurate, don't know if you can make custom face/body textures for them or not".

## 1. What the process is

An old Meshy unit is one fused mesh: a sealed mouth, no eyelids, clothes welded to the body. It cannot blink, talk or
change clothes. The remake keeps the unit's look and puts it on the creator's MPFB body:

1. Render the old unit from the front, send it to Meshy Image to 3D (`meshy-t2`, `smart-topology`, `texture_model meshy-n1`,
   `pose_mode a-pose`; 15 credits, about a minute). T2 returns the clothes as loose shells. T2.5 does not.
2. `bake-outfit.py` cuts the Meshy skin away, fits the shells onto `mpfb_male` / `mpfb_female`, hides the body skin under
   them, weights them to the creator rig and writes creator pieces (`ewm_t2<unit>_outfit.glb`, `_hat.glb`) for all five bodies.
3. `sprites.js` `RACE_REMADE_LOOKS` lists the look (body, hair, hair colour, idle, the pieces). The forge shows
   USE THE REMADE <RACE> LOOK. The Meshy model stays the unit's default.

Done: cowboy (M), knight (F), wizard (M). PR #1153 (in the game), #1154, #1155, #1156 (fixes from his looks).

## 2. One unit, start to finish

Work in a fresh thread branch. One to four units per PR. Never a mass remake without his OK on the batch.

| Step | What | How |
|---|---|---|
| 1 | Front render of the old unit | `/mnt/project-files/meshy-parts-20261112/scripts/headshot.py` / `render.py` (Blender, plain light, grey background, 2K) |
| 2 | Meshy T2 a-pose remake | `scripts/gen2.py` (the proxy adds the key; `Authorization: Bearer msy_dummy`). Keep the GLB in `/mnt/project-files/meshy-parts-20261112/<unit>_t2_apose_parts.glb` |
| 3 | Look at the shells before baking | Blender: separate by loose parts, list them. Coat + shirt usually one shell; the head is sometimes fused into the top (rerun the remake if so) |
| 4 | Bake | `python3 -I bake-outfit.py --name <unit> --label <Label> --gender male|female --src <t2.glb> --bodies charactercreation/mpfb` |
| 5 | Game rows | `sprites.js`: `EW_MH_WEAR` rows (copy the cowboy's), `EW_WEAR_SHELF_MOVE`, `RACE_REMADE_LOOKS.<race>.<gender>` |
| 6 | THE LOOK CHECK (section 3) | `scripts/look.js`, `TURN=1` |
| 7 | Fix what the check shows | in `bake-outfit.py` as a general rule, never a per-unit hand edit; rebake ALL remade units and recheck them |
| 8 | Deliver | `ASSET_MANIFEST.json` rows, `node list-models.js`, notes + tracker row, `?v=` bump, PR, merge, `node sync-zip.js --upload` and `--put` each wear GLB |
| 9 | His look | post the sheet, then wait. His complaints come back to the same thread |

Hair, beard, brows: creator picks (pack hair). T2 hairlines are high and there is no fringe under a hat, so T2 hair shells
are not exported.

## 3. THE LOOK CHECK (every unit, every rebake)

A unit is not done on one front still. Each of the three needed two or three rounds, and every fault was only visible
from the side, the back or mid-stride.

Probe: local server (`npm start`), Playwright Chromium, `?ew_gpu=webgl2` (headless WebGPU is black),
`UNITS=<race>:<gender> TURN=1 WAIT=30000 node look.js`. It writes front, side, back, other side, two walk frames.
`FEET=1` adds a boots close-up. `UNITS=<race>:<gender>:orig` shoots the old Meshy model for the side by side.

Look for, in this order:

1. Skin showing where cloth should be (slivers at calves, wrists, neck, waist).
2. Body or boots coming through cloth (legs through a robe, a boot through a hem).
3. Points, spikes, plates: cloth stretched to the wrong bone (skirt to a hand, cuff to the hips).
4. Feet and boots while walking (toe bend, heel, spurs).
5. Sleeves and elbows while walking.
6. Hat and hair: hat sits on the head, no scalp through the hat, no hair through the brim.
7. Stance: not crouched (creator rigs need `idle: 'Idle_11'` when the race's idle hunches).
8. Side by side with the original: same colours, same read at board distance.
9. Texture: UV not scrambled (Blender v is 1 minus glTF v).
10. Still owed on all three: one look in a real battle (board camera, a spell cast, a hit, a death).

## 4. Kinks already solved (do not solve them twice)

| What he saw | Cause | Rule now in bake-outfit.py |
|---|---|---|
| Legs through a robe | hide rays too short for a wide skirt | `RAY_LEG 0.45` |
| Boots distort on a walk | loose-cloth rule hit the boots | one-sided shells are never loose; toe weight goes to the foot |
| Points behind boots | spur horns | `SPURS` flatten |
| Robe points near the seat | skirt beside the hands took arm weights | SLEEVE TEST by mesh edges from the upper arm |
| Skin slivers at the calves | leg hidden face by face | a leg segment 70% covered is hidden whole |
| Boot through the robe front | skirt shared evenly between the legs | THE CLOTH OVER A LEG: only cloth between the legs is shared |
| Unit crouches | race idle on the creator rig | look carries `idle: 'Idle_11'` |
| Helmet left out (read as hair) | head pieces below the eyes were hair | `--headgear` keeps them as the hat, unlifted |
| One glove floating beside the hand | hand fused into a big shell failed the sleeve test | THE HAND IN A BIG SHELL (wrist seeds) |
| Fingerless gloves lost with the bare hand | hand shell dropped whole | THE GLOVE ON A BARE HAND |
| Scalp through a hood | skin between the hood's vertices | THE SCALP UNDER A HOOD |
| Thin sticks through the hands | faces stretched between bones | A TORN FACE |
| Skin chips floating by a boot | tiny loose shells | A FLAKE |

Tried and dropped: a ray test for sleeves (cuffs flared into plates), aiming the forearm (tore shoulders), cutting boot
tops under a hem (bare shin showed).

## 5. Kinks still open (the improve list)

| # | What | First thing to try |
|---|---|---|
| K1 | Softer than the originals (T2 texture is cleaner and flatter) | T2 at 2K texture; or Meshy retexture with the old unit's render as the image; compare at board distance before caring |
| K2 | Capes, skirts, coat tails do not sway | THE COAT HANG chains (`three-renderer.js COAT_HANG`) already swing Blender coats: give remade outfits the same chain roots |
| K3 | Wizard "elbows bending backwards" | not reproduced; needs his word on when (standing, walking, casting) |
| K4 | Not seen in a battle | section 3 item 10 |
| K5 | Small dark triangle on the wizard's robe front at the left thigh | a stray shell face; drop shells under a size inside other cloth |
| K6 | Only one gender per unit (wizard M, knight F, cowboy M) | remake the other gender's model the same way when the race has one |

## 6. FACES (his second ask)

Today the remade looks wear a stock MPFB face: a stock skin, light slider shaping, pack hair. That is why they read as
"a person in the unit's clothes" more than "the unit".

Can custom face and body textures be made? Yes. The mechanism is already in the game and proven once: PR #1134 (the
Morgan test) ships a custom head SHAPE (`charactercreation/mpfb/custom_shapes/<key>.json`, baked by
`node bake-custom-shape.js` into `mpfb_shapes.glb`) and a custom SKIN (`looks/skin_<key>.jpg` on the MPFB skin sheet,
listed in `EW_MH_LOOKS.skins`). Both keep the 67 face shapes working, because the mesh is still the MPFB head.

PILOT DONE 2026-11-12 (mondo: "yeah lets do face pilot and cowboy"): `bake-face.py` makes both automatically from the OLD unit's head
(face landmarks, no hand work): `cowboyFace` + skin `ew_face_cowboy`, worn by the remade cowboy look. Blink, talk, smile and frown
checked in the game. How, the rules learned and the known faults: `character-creator.md` "THE UNIT FACES". Use the OLD unit GLB as the
face source, never the T2 remake (its face is a blur). mondo 11-12 05:10Z "okay thats better" after round 2, then "yes" to faces on the knight, the wizard and the demo starters batch: knight + wizard done the same night. Faces are now part of every remake.

| Step | What | How | Risk |
|---|---|---|---|
| F1 | Head SHAPE per unit | Line the Meshy T2 head up with the MPFB head (the bake already scales by the eye shells), move each MPFB face vertex toward the nearest Meshy head surface, smooth, keep lips / lids / inner mouth untouched, save as a custom shape | Meshy heads have no lids and a sealed mouth: the eye and mouth rings must stay MPFB's or the 67 shapes break |
| F2 | Face SKIN per unit | With the shaped head in place, read the Meshy head's colour at each MPFB skin texel and paint it onto a copy of the nearest stock skin; fade to the stock skin at the neck, ears, eye rims and lips | Meshy textures have light baked in and are low detail up close; painted lashes and brows must be removed where the creator layers its own |
| F3 | Body skin | Only where it shows and matters: skin tone matched to the face, plus marks the unit has (scars, paint, tattoos, coloured skin). Clothed units need the tone only | low |
| F4 | Brows, eyes, hair, beard | Creator picks chosen to match the old unit, saved in the look | none |
| F5 | Show it | FACE CLOSE-UP shots, old unit beside the new head, neutral + blink + talk + smile from the Face Lab | — |

Pilot first: cowboy (he has a saved look, so compare three ways: old Meshy, saved look, fitted face). Go on to the others
only if he likes the pilot. If the automatic skin looks muddy, the fallback is F1 + F4 only (shape and picks, stock skin
tone matched), which is safe.

Rules that apply: the skin is made from the unit's own approved Meshy texture, so nothing new is generated; it is a NEW
file, never a repaint of one of his textures; no real-person likeness; MPFB heads only (Meshy heads cannot take the shapes).

## 7. The roster

Three groups, from `character-models-plan.md` section 4:

**STYLISED / FEMALE FACES (11-12, the knight):** a painted anime-style face is NOT fitted in full: use the SOFT FACE params of bake-face.py (character-creator.md THE UNIT FACES round 3: depth, wide, low, browfit, lipsrigid, lips) and finish with creator picks (brows, lashes, lip tint, hair that frames the face). Judge in the game viewer beside the old model before showing him.

**A. People in clothes (this process fits as is).** Done: cowboy (M), knight (F), wizard (M).
Left: angel (F), annunaki (M), antihero (M), astronaut (M), atlantean (F), barbarella (F), bunny girl (F), catgirl (F),
chef (M), clown (M), conspiracy theorist (M), cowboy (F), cult leader (M), demon (F), demon princess (F), djinn (M),
fairy (F), fallen angel (F), firefighter (M), fortune teller (M + F), gangster (M), general (M), ghost (M, F), giant (M),
glitch (M), halfdemon (M + F), hippie (M + F), homosapien (M), ice queen (F), ki fighter (F), King Arthur (M),
luchador (M), mad scientist (M + F), marksman (M + F), men in black (M), mime (F), mummy (F), mushroom girl (F),
necromancer (F), nephilim (M), nordic (M), orb of light (F), overlord (M), pirate (M + F), police officer (M),
politician (M), popstar (F), priest (M, F), professor (M), quarterback (M), ringmaster (M), robinhood (M),
santa clause (M), scarecrow (M), shaman (F), sheriff (M), sidekick (M), spy (F), succubus (F), superhero (M + F),
swordfighter (F), symbiote (F), telepath (M + F), time cop (M), valkraye (F), vampire (F), wizard (F), zombie (F).
About 80 models. Wings, horns, tails and glowing or coloured skin need an extra step (keep the shell as a solid piece
pinned to a bone; tint the skin).

**B. Creatures on a human body (needs row 18 first: a head, limbs or skin of their own).** anubis, demon (M), eagleman,
gargoyle, goatman, goblin, grey, krampus, machine elves, martian, mermaid, minotaur, mothman, rabbit, reptilian,
sharkman, werewolf. The clothes can be remade the same way, but the head cannot be an MPFB face without row 18's creature
heads, so these wait.

**C. Keep their own model (not part of this).** Section 4e: dinosaur, dragon, kaiju, robots, insects, apes and the rest.

Order: the PVP demo roster first (the 16 starters, then the unlocks; list in the demo thread), in batches of three or
four, one batch per session, his look between batches. Within a batch pick one easy unit (trousers and a jacket), one
long garment (robe, dress, cape) and one armoured or odd one, so each batch tests the rules on different shapes.
Cost: 15 Meshy credits per model, about 1,200 for group A. Each new garment shape is likely to show one new kink.

## 8. Status table (update in the same PR as the work)

| Unit | Remade | Look check | Battle check | Face fit (F1-F4) | His OK | Notes |
|---|---|---|---|---|---|---|
| cowboy (M) | PR #1153 | clean after round 4 | owed | PILOT DONE 11-12 (bake-face.py) | waiting | boots + spurs fixed #1154 |
| knight (F) | PR #1153 | clean after round 4 | owed | DONE 11-12, SOFT FACE round 3 (he called the first fit an ogre) | waiting | calf slivers fixed #1155; cape no sway |
| wizard (M) | PR #1153 | clean after round 4 | owed | DONE 11-12 | waiting | robe points #1155, boots #1156; K3, K5 open |
| zombie (F) | batch one 11-12 | clean (race walk hunches) | owed | DONE 11-12 | waiting | her bloody skin is worn as shells; skin `sohh_female_zombie_skin` |
| catgirl (F) | batch one 11-12 | skin chip by the left boot, lacing patches on the sleeves | owed | DONE 11-12 | waiting | his saved look's body + face + hair; T2 ears = separate hat piece, not in the look. Bake: `SKINISLE=200 ... --neckline` (round 4: floating skin under her crotch) |
| robinhood (M) | batch one 11-12 (second T2 run) | a few skin flecks on the hood front | owed | DONE 11-12 | waiting | hood = outfit, `hair: bald`; fingerless gloves kept. Bake: `ARMSKIN=0.35 ... --barearms` (round 4: the body's own arms, ears hidden under the hood). Left: a few small teeth where the cape's edge crosses his right shoulder |
| quarterback (M) | batch one 11-12 | clean | owed | next | waiting | `--headgear` (helmet = hat piece), `hair: bald` |
| djinn (M) | REFUSED by Meshy's safety check twice (bare chest) | | | | | not worked around; needs his word |
| mummy (F) | batch two 11-12 | clean | done (mummyFace) | next | waiting | `--longhair --bodysuit` (bandages the colour of her skin: no colour cut, head + hands cut by place), hair mh_long01. Round 2 (11-12): loose ends hang whole, chin strip + hair flecks gone. Left: the suit's collar edge is angular, not seen in a battle |
| angel (F) (mondo 11-12 playtest: he put a creator goddess dress on her himself, the T2 dress is not his pick) | batch two 11-12 | clean | done, soft (angelFace) | next | waiting | render on a DARK background (white wings on light grey came back dark blue); `--longhair --nowings --barearms --neckline`, `--repaint`, env `REPWARM=0.08 SKIN_T=0.3 LOCKT=0.3`; wings = the creator's Feathered (his OK 11-12). Round 2 (11-12): clean square neckline, whole straps, bodice hole + skirt patch gone. Round 3: the teeth behind her right arm gone (weights, not cloth). Left: small notches on the straps' outer edges, face plainer than the photo-real original |
| AGENT LOCKE (cast, F) (mondo 11-12 "remake Locke to blink") | 11-12 | clean (ISLENECK + OPENSKIN + SKINISLE=400) | done, soft (lockeFace) | creator hair mh_elvs_short_side_do | live | sprites.js CAST_CREATOR_LOOKS: board, DOOR HQ, portrait studio; not yet seen in HQ / a fight |
| politician (M) | batch 3 of 3, 11-13 | clean | owed | politicianFace | waiting | `RAY_IN=0.12 RAY_OUT=0.12 TORN=9` (jacket narrower than the body's shoulders: skin stood through). Creator glasses over the glasses painted in his face skin; hair mh_short01 |
| popstar (F) | batch 3 of 3, 11-13 | clean | owed | popstarFace, soft | waiting | CREATOR CLOTHES (crop top, mini skirt, stiletto booties, tinted white): the T2 top + skirt came out in tatters under --neckline --barearms. No T2 piece shipped |
| priest (M) | batch 3 of 3, 11-13 | clean | owed | priestFace | waiting | jacket envs as the politician |
| priest (F, the nun) | batch 3 of 3, 11-13 | clean; a leg shows in the skirt's slit mid-stride | owed | nunFace, soft | waiting | `--headgear`; the veil stayed in the outfit; `hair: bald` |
| professor (M) | batch 3 of 3, 11-13 | clean | owed | professorFace | waiting | jacket envs; creator glasses over painted ones (thick frames show under them: needs a glasses-off skin) |
| ringmaster (M) | batch 3 of 3, 11-13 | clean | owed | ringmasterFace | waiting | beard is in the skin |
| santa clause (M) | batch 3 of 3, 11-13 | one white flap on his back mid-stride; the creator beard hides under the fur collar | owed | santaFace | waiting | body mpfb_heavy; `SLEEVESEED=0.15 SLEEVER=0.24` (fur sleeves stood out in a T without it) |
| scarecrow (M) | batch 3 of 3, 11-13 | clean clothes; HEAD IS A MAN'S, not the sack | owed | none (sack head) | waiting | `--headgear` (hat = hat piece). Needs a sack head piece (creator 'bag on head' did not show on the MPFB head) |
| shaman (F) | batch 3 of 3, 11-13 | clean | owed | shamanFace, soft | waiting | hood + cloak in the outfit |
| sheriff (M) | batch 3 of 3, 11-13 | clean | owed | sheriffFace | waiting | jacket envs; CREATOR hat ewb_cowboyhat_worn (T2 fused his) |
| sidekick (M) | batch 3 of 3, 11-13 | clean | owed | none (goggles) | waiting | no eyeball shells: `EYEAT=0,-0.045,0.935`; creator hero mask |
| spy (F) | batch 3 of 3, 11-13 | clean; dark hair paint on the dress back | owed | spyFace, soft | waiting | `--neckline --barearms` |
| succubus (F) | batch 3 of 3, 11-13 | small bits float by both hands | owed | succubusFace (pink skin from her own head) | waiting | creator demon horns + devil tail; `FLAKE=120` did not catch the bits |
| superhero (M) | batch 3 of 3, 11-13 | clean | owed | superheroFace | waiting |  |
| superhero (F) | batch 3 of 3, 11-13 | CAPE: strips by the arms, bits by the hands, a flap mid-stride | owed | superherofFace, soft | waiting | second T2 run, `--longhair SLEEVER=0.07`. Next: creator cape `bcape_hero` and cut the T2 cape |
| swordfighter (F) | batch 3 of 3, 11-13 | clean | owed | swordfighterFace, soft | waiting | creator katana on her back |
| symbiote (F) | batch 3 of 3, 11-13 | clean (bare grey body) | owed | symbioteFace (grey skin from her own head) | waiting | no outfit piece: she has no clothes; body skin = her face skin's tone |
| telepath (M) | batch 3 of 3, 11-13 | clean | owed | telepathFace | waiting | `hair: bald` |
| telepath (F) | batch 3 of 3, 11-13 | clean | owed | telepathfFace, soft | waiting | CREATOR evening gown (his saved look's): T2 fused gown + arms + chest in one shell twice |
| time cop (M) | batch 3 of 3, 11-13 | clean | owed | timecopFace | waiting | `--headgear` helmet = hat piece |
| valkraye (F) | batch 3 of 3, 11-13 | greaves a little loose at the ankle | owed | valkrayeFace, soft | waiting | second T2 run, `--nowings WINGY=0.12`, creator Feathered wings, dark background render |
| vampire (F) | batch 3 of 3, 11-13 | clean | owed | vampireFace, soft | waiting | second T2 run (first had no gown back under her hair) |
| wizard (F, the witch) | batch 3 of 3, 11-13 | clean | owed | witchFace, soft | waiting | `LOCKS=0` (coat was read as a hair lock); CREATOR witch hat mhw_elvs_witchy_hallows_hat1; pieces named `ewm_t2witch_*` |
| the rest of group A | batches 1 and 2 of 3 (meshy-remake-batches.md) | | | | | |

## 9. Standing rules for any session doing this

- Meshy models STAY the unit defaults (`EW_RACE_LOOKS_ARE_DEFAULT = false`). A remade look becomes a default only on his word, per unit.
- Never delete or change his saved looks (`RACE_CREATOR_LOOKS`).
- Fit on the MPFB bodies only, never the classic ones.
- A fix is a rule in `bake-outfit.py`, then ALL remade units are rebaked and rechecked.
- Proof on screen from four sides and walking, WebGL2 backend. Say plainly what was not seen.
- No device access, no tests, no Render redeploy talk, never ask for a Meshy key.
- Pack-first still holds for props and hair: a pack piece beats a Meshy shell when it matches.

## 10. Waiting on mondo

1. His look at the three in the game after PR #1156.
2. His look at the cowboy's fitted face (yes to the face pilot given 11-12; done).
3. First batch = the demo starters (his word 11-12): from group A that is zombie (F), catgirl (F), robinhood (M), djinn (M), mummy (F), angel (F), quarterback (M); knight (F) is done. Not started.
4. Whether K1 (softer look) bothers him at board distance.
