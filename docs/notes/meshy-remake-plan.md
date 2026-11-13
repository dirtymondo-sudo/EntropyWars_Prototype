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
| BATCH 1 OF 3 (11-13, meshy-remake-batches.md; mondo: "creator clothes first, Meshy for the pieces we don't have"). All: first pass, one look from four sides + a walk frame, NOT seen in a battle, no round of fixes yet | | | | | waiting | bakes: `EYE=` from `bake-t2-eyes.py` on every unit (see models-assets.md "BATCH 1 OF 3") |
| batch 1 review round | 11-13 | his 12 pinned notes fixed (collar, real hands, ears, hair under hats, chain, helmet) | | | waiting | flags: models-assets.md "BATCH 1, HIS REVIEW" |
| batch 1 review round 2 | 11-13 | snug trousers (gangster, conspiracy, general, clown), bunny girl in creator top + shorts + boots, demon princess horn mirrored | | | waiting | models-assets.md "BATCH 1, REVIEW ROUND 2" |
| annunaki (M) | 11-13 | clean | owed | annunakiFace (beard is in the skin) | waiting | creator Anunnaki headdress + Egyptian collar + Feathered wings (tinted brown); T2 robe `--nowings` |
| astronaut (M) | 11-13 | clean | owed | none (stock face behind the visor) | waiting | creator Astronaut helmet + backpack; T2 suit `--headgear` (its own helmet shell not used) |
| barbarella (F) | 11-13, creator clothes only | see sheet | owed | barbarellaFace, soft | waiting | T2 leotard came out ragged at the hips: one-piece swimsuit + knee boots tinted white, gloves, gun belt, thigh holster |
| bunny girl (F) | 11-13 | skin patches on the thighs, strap ends by the hips | owed | bunnygirlFace, soft (anime face does not carry) | waiting | T2 ears = hat piece; `--longhair --barearms` |
| chef (M) | 11-13, creator clothes only | clean | owed | chefFace | waiting | his saved chef look (coat, trousers, shoes, chef hat) moved to mpfb_male; the T2 whites showed the shoulders through |
| clown (M) | 11-13 | clean | owed | clownFace (the paint carries well) | waiting | `RAY_IN=0.12 RAY_OUT=0.12 TORN=9` (batch 3's jacket envs) + `SKIN_T=0.1` (his white face paint is near the jacket's grey) |
| conspiracy theorist (M) | 11-13 | clean | owed | conspiracyFace | waiting | creator wireless headset; `RAY_IN=0.12 RAY_OUT=0.12 TORN=9` (batch 3's jacket envs) |
| cowboy (F) | 11-13 | clean | owed | cowgirlFace, soft | waiting | creator cowboy hat; T2 keeps her red hair shell; `RAY_IN=0.12 RAY_OUT=0.12` |
| cult leader (M) | 11-13 | clean | owed | cultleaderFace | waiting | all T2 |
| demon (F) | 11-13 | clean | owed | his saved look's face | waiting | his saved demon look (red skin, faun horns, elf ears) + the T2 skirt, top and sleeves in place of its creator clothes |
| demon princess (F) | 11-13 | skin patches at the shoulders, hair shards | owed | demonprincessFace, soft | waiting | `LOCKS=0` (with `--longhair` the bodice went with the hair: black on black); T2 horns = hat piece |
| fairy (F) | 11-13 | clean | owed | fairyFace, soft | waiting | creator Fairy moth wings (the original's are brown and veined: his pick); `--nowings` |
| fallen angel (F) | 11-13 | pale patch in the skirt's slit | owed | fallenangelFace, soft | waiting | creator Feathered wings tinted black; `--nowings` |
| firefighter (M) | 11-13 | clean | owed | firefighterFace | waiting | creator Firefighter helmet + air tank; T2 coat + trousers |
| fortune teller (F) | 11-13 | clean | owed | fortunetellerfFace, soft | waiting | `--longhair` |
| gangster (M) | 11-13 | clean (his tattoos are gone: bare body skin) | owed | gangsterFace | waiting | T2 trousers + sneakers only (`SKIN_T=0.45 ARMX=0 --barearms`), no do-rag (the creator one sat above his head) |
| general (M) | 11-13 | clean | owed | generalFace | waiting | creator Officer cap; `RAY_IN=0.12 RAY_OUT=0.12 TORN=9` (batch 3's jacket envs) |
| ghost (F) | 11-13 | clean | owed | ghostFace, soft (pale blue tone) | waiting | `--longhair`; she is not see-through like the original |
| giant (M) | 11-13 | clean | owed | giantFace | waiting | all T2; normal height (the race is 1.7x) |
| antihero (M) | HELD BACK 11-13 | the old head stays inside the suit, body leans | | fitted, not shipped | | head + suit are one T2 shell; rerun the T2 or cut by place |
| atlantean (F) | HELD BACK 11-13 | her old body stays inside the clothes | | fitted, not shipped | | trident + cape move Meshy's centre; bare midriff is part of the shell |
| fortune teller (M) | HELD BACK 11-13 | bald old head behind the hood, holes in the cloak's back | | fitted, not shipped | | |
| ghost (M) | not a Meshy model (pack sheet ghost) | | | | | left as is |
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
| the rest of group A | batch 2 of 3 (meshy-remake-batches.md) | | | | | |
| **BATCH 2 of 3 (11-13, meshy-remake-batches.md, thread "Remake unit models, batch 2 of 3"): FIRST PASS, one front look each + four sides, his visual pass is next** | | | | | | sources `/mnt/project-files/meshy-remake-b2/`; creator pieces first, Meshy for the rest |
| glitch (M) | 11-13 | rough | owed | none (no face on the old model) | waiting | T2 body worn as a suit: `LOCKS=0 ... --bodysuit`; head = stock skin `culturalibre_dr_manhattan` (plain blue, not his circuit pattern) |
| halfdemon (M + F) | 11-13, NO Meshy | front ok | owed | M full, F soft | waiting | saved look's clothes (overcoat / evening gown, pack horns) on `mpfb_male` / `mpfb_female` + the unit's face; M beard piece off (it is in the skin) |
| hippie (M + F) | 11-13 | front ok | owed | M full (`hairrgb=150,115,70 hairtol=50`), F soft | waiting | M: `RAY_IN=0.12 RAY_OUT=0.12` (shoulder skin came through the jacket's back; NOT `TORN=9`, it webs the trouser legs); hat = pack `mhw_mindfront_fishing_hat_01` tinted (the T2 run fused his hat into the hair) |
| homosapien (M) | 11-13 | skin fleck on the coat's left shoulder | owed | full (`hairrgb=15,15,15 hairtol=30`) | waiting | `SKIN_T=0.12 RAY_IN=0.12 RAY_OUT=0.12` (shoulders through the coat's back) |
| ice queen (F) | 11-13 | front ok | owed | soft | waiting | `LOCKS=0` (the bodice is the colour of her hair and went as a hair lock); crown = creator `ewm_icecrown` |
| ki fighter (F) | 11-13 | front ok, face reads older than the original | owed | soft | waiting | defaults |
| King Arthur (M) | 11-13 | front ok | owed | full (`hairrgb=95,70,45 hairtol=40`) | waiting | crown = the T2 one (`ewm_t2kingarthur_hat`): the creator's `ewm_royalcrown` sank into the hair |
| luchador (M) | 11-13 | front ok | owed | full (his mask is painted in the skin under the mask piece) | waiting | mask = creator `ewb_luchador`; singlet + boots = T2 |
| mad scientist (M + F) | 11-13, NO Meshy | front ok | owed | M full (`hairrgb=235,235,235 hairtol=40 tonepct=25`), F soft | waiting | saved look's clothes (lab coat) on the MPFB bodies + the unit's face; M beard piece off |
| marksman (M + F) | 11-13 | M ok; F spikes at the wrists, rough arm edges | owed | M full (`hairrgb=20,20,20 hairtol=30`), F soft | waiting | M: `RAY_IN=0.12 RAY_OUT=0.12 TORN=9` (shoulders through the coat). F: her top is PAINTED on the T2 body shell and the MPFB bust came through it: `LOCKS=0 RAY_IN=0.09 ... --barearms` + the creator's `mhw_elvs_lara_tank1` (black) over it |
| men in black (M) | 11-13, NO Meshy | front ok | owed | soft (painted sunglasses smeared a full fit) | waiting | saved look's suit + sunglasses on `mpfb_male` |
| mime (F) | 11-13 | front ok | owed | soft (her white face paint is the toned skin) | waiting | beret = creator `ewm_beret` |
| mushroom girl (F) | 11-13 | round 8: lace neckline, large cap, wavy hair, creator boots | owed | soft | waiting | cap = `ewm_mushroomcap_big` (creator cap reshaped; the T2 cap shell is read as hair) |
| necromancer (F) | 11-13 | front ok | owed | soft | waiting | defaults |
| nephilim (M) | 11-13 | front ok | owed | full, pink (`hairrgb=60,30,70 hairtol=45`) | waiting | `--nowings`, wings = creator Feathered tinted purple; height 1.15 (the creator's top; his Meshy model is 1.5) |
| nordic (M) | 11-13 | front ok | owed | full (`hairrgb=225,210,160 hairtol=50`) | waiting | dark background render |
| orb of light (F) | 11-13 | ROUGH: the body shows through the gold suit at the chest, a loose strip by her right arm | owed | soft, gold tint | waiting | `--bodysuit --longhair`; skin `skinTint: pick` gold |
| overlord (M) | 11-13 | front ok | owed | none (helmet: no face found), stock skin | waiting | `LOCKS=0`; helmet = creator `ewm_overlordhelm` (the T2 one lost its shell); height 1.15 (Meshy 1.3) |
| pirate (M + F) | 11-13 | front ok | owed | M full, F soft | waiting | M: second T2 run, no eye shells: `EYEH=0.873` (new, off by default); hat = creator `ewm_tricorn`. F: hat = T2 (`ewm_t2piratef_hat`, it has her skull) |
| police officer (M) | 11-13 (second T2 run) | front ok | owed | full (stock `middleage_caucasian_male` toned down to him) | waiting | `RAY_IN=0.12 RAY_OUT=0.12 TORN=9` (shoulders through the shirt's back) + creator `ewm_policebadge` |
| batches 1 and 3 | their threads | | | | | |

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

### Batch 2 review fixes, round 1 (2026-11-13, mondo's pinned comments on the batch 2 overview)

- NO WEAPONS IN AN OUTFIT (his rule: "characters will hold those weapons, dont make them part of the outfit"): `bake-outfit.py` env `DROPAT='x,y,z,r;...'`
  (off by default; `SHELLS=1` prints every loose shell's middle, size and colour). pirate M `DROPAT="0.05,0.18,1.38,0.05;0.38,0.18,1.81,0.05;0.28,0.2,1.65,0.05;0.18,0.04,1.91,0.05" EYEH=0.873`
  (sword, hilt, guard, the T2 hat's feather), pirate F `DROPAT=0.23,-0.01,0.8,0.05 --neckline`.
- halfdemon F: her OWN dress from a T2 run (`ewm_t2halfdemonf_outfit`, defaults), pack skin `toigo_light_skin_with_natural_makeup` + liner + shadow, bust / waist / hips; no unit face (it read plain).
- marksman F: creator pieces only (`mhw_elvs_lara_tank1` + `mhw_cortu_cargo_pants` + `mhw_mindfront_shoes_biker_boots_female`), same made-up face; the T2 outfit stays in the creator, unworn.
- ki fighter hair `mh_elvs_short_daisy_hair`; king arthur `--neckline` + creator `ewm_royalcrown`; homosapien second T2 run (`SKIN_T=0.12 RAY_IN=0.12 RAY_OUT=0.12`);
  necromancer `--neckline`; mime `RAY_IN=0.12 RAY_OUT=0.12`; orb of light = the gold-tinted body, `mhChest: smooth`, no outfit (the T2 suit tore).
- STILL OPEN: halfdemon M + men in black tie (the creator `ewb_tie` lets the shirt through, also on his saved classic-body looks: bake-clothes.py `tie` ease, needs the MPFB add-on here),
  mushroom girl neckline (`--neckline --repaint` did not cure it), pirate F bits between the legs, overlord gauntlet fingertips, hippie M trousers, a white cop + a female cop (his ask).
  Second T2 runs of king arthur, necromancer and hippie M were worse than the first and are not used.

### Batch 2 review fixes, round 2 (2026-11-13)
- TIE (halfdemon M, men in black, every look with `ewb_tie`): the shirt came through the creator tie. bake-clothes.py tie `ease` 0.019 -> 0.032, `ewb_tie.glb` rebaked.
- HAIR UNDER A HAT (King Arthur bald in front under `ewm_royalcrown`): three-renderer.js hairUnderHats pulled hair BELOW the hat's lowest outer point up into it (a crown rim's normals point down and out). Hair below `hatLow` now stays. All hats.
- Homosapien: `SKIN_T=0.12 RAY_IN=0.12 RAY_OUT=0.12 TORN=9` (holes behind the coat shoulders were torn faces; front stays open on this one).
- Hippie M: T2 trousers dropped (`DROPAT=0,0,0.5,0.05 RAY_IN=0.12 RAY_OUT=0.12`), wears creator `mhw_elvs_gored_elephant_pants` tinted `#6a94c8`.
- Men in black: remade look drops the coded blazer + shirt + trousers for pack `mhw_toigo_male_suit_tie_and_jacket` with black `ewb_tie` over its tie (a tint on the suit also colours its shirt, so the suit stays charcoal; a sliver of the suit's own tie shows beside the black one).
- STILL OPEN: overlord fingertips, mushroom girl neckline, pirate F between the legs, necromancer slit, white cop + female cop.

### Batch 2 review fixes, round 3 (2026-11-13)
- Men in black: "the tie should not be outside his suit". New piece `mhw_toigo_male_suit_black.glb` = the pack suit `mhw_toigo_male_suit_tie_and_jacket` with its texture's cloth darkened and its tie made black (a NEW file, the pack file is untouched); the look wears it without `ewb_tie`.
- Homosapien: head looked cut off in the walk (neck skin hidden under the coat collar). Rebake adds `--neckline` (`SKIN_T=0.12 RAY_IN=0.12 RAY_OUT=0.12 TORN=9 --neckline`).
- King Arthur: hair `mh_long01` (hair004 parts off the forehead and read as a receding hairline). `--neckline --barearms` was tried and dropped (it ate the shoulder armour and most of the cape). STILL OPEN: cape edge at the neck line, jagged bracers seen from behind.
- Police officer: THE REMADE ALTS. sprites.js `RACE_REMADE_ALTS` + `getRaceRemadeAlts`, party-builder.js one button per alt. White officer = same outfit, stock `young_caucasian_male`. Female officer = the male T2 baked on the female body (`LOCKS=0 RAY_IN=0.12 RAY_OUT=0.12 TORN=9`, `ewm_t2policeofficerf_outfit`), make-up face. The buttons were not seen on screen.
- STILL OPEN: halfdemon M coat hip in the walk, overlord fingertips, mushroom girl neckline, pirate F between the legs, necromancer slit.
- Round 4 (2026-11-13), King Arthur: the Meshy cape (one 4,051-face shell that also carried the shoulder armour and chest strap, ragged at the neck line) is dropped (`DROPAT=-0.01,0.07,1.18,0.06 --neckline`); the look wears the creator Royal cape `bcape_king`, `capeColor #6a1fa0`, `capeFabric silk` (velvet is a red cloth and stays crimson under a purple tint). Lost with the shell: white shoulder armour + chest strap (creator `ewm_shoulderpads` is a football pad set, not used).
- Round 5 (2026-11-13). King Arthur (mondo: "the crown and the hair and the head are still just not working", "yes i want the chest strap back", "arms disconnected"):
  - HAIR UNDER A HAT, second fix: three-renderer.js hairUnderHats, hair below the hat's rim (`hatLow`) also skips the SMOOTHED pull (it dragged the hair on the forehead and temples under the scalp: a bald band under any crown). Checked on the hippie's hat and the pirate's tricorn.
  - new off-by-default bake-outfit.py knob `CUTCOL='x,y,z,r,R,G,B,tol[,ymax];...'`: in the named shell, the faces near that colour (and behind ymax) go, then islands under `CUTISLE` 30 faces. Arthur: `DROPAT="-0.53,-0.12,1.04,0.06;0.52,-0.12,1.04,0.06" CUTCOL="-0.01,0.07,1.18,0.06,0.33,0.0,0.38,0.22,0.03;-0.01,0.07,1.18,0.06,0.8,0.72,0.42,0.22" --neckline` = the cape's purple + gold trim + the strap's back half cut out, the chest strap + shoulder armour kept, the ragged T2 bracers dropped for creator `ewm_gauntlets` (`#d8d8d4`).
  - Overlord: `BSCHIP=200 LOCKS=0 --bodysuit` (the fingertips were chips over the 40-triangle limit; the T2 glove scraps went with them), hands wear `mhw_toigo_gloves_short` `#18181a`.
- Round 6 (2026-11-13). King Arthur (mondo: "crown is still fucked up, its too small, his forehead looks huge", "gloves are not turned the right way", "hair clips through the cape white part"): new hat `ewm_kingcrown.glb` = `ewm_royalcrown` 1.25 wider, 1.3 taller, 12 mm lower and 12 mm forward (round 7b: the first cut, x1.22 and 35 mm lower, let his skull through the velvet) (sits on the brow; made by a small script, POSITION only, the per-body deltas kept); hair back to `hair004` (ends above the cape's fur collar); `ewm_gauntlets` off (their cuffs flare sideways on the MPFB forearm), bare forearms; bake `DROPAT="-0.53,-0.12,1.04,0.06;0.52,-0.12,1.04,0.06;-0.15,0.11,1.34,0.03;0.14,0.12,1.36,0.03" CUTCOL="-0.01,0.07,1.18,0.06,0.33,0.0,0.38,0.22,-0.01;-0.01,0.07,1.18,0.06,0.8,0.72,0.42,0.22" --neckline`. LESSON: judge a head in a CLOSE-UP beside the original's head, never in the full-body row. Left: a skin patch where the creator cape meets his left shoulder at the back.
- Round 7 (2026-11-13). Pirate F "weird pieces in between her legs": slivers of the T2 leg-skin shells; with those dropped the T2 boots showed holes at the back and the knees were hidden. Now `DROPAT="0.23,-0.01,0.8,0.05;-0.01,-0.14,0.93,0.04;0.12,-0.14,0.62,0.04;-0.12,-0.14,0.63,0.04;0.2,-0.16,0.12,0.04;-0.21,-0.16,0.12,0.04;-0.17,-0.11,0.37,0.04;0.16,-0.11,0.37,0.04" --neckline` (sword, shorts, leg skin, boots + cuffs out; one of the two thigh straps went with a leg shell) and the look wears creator `mhw_punkduck_female_short_jeans` + `mhw_grinsegold_female_pirate_boots` (`#3a2a1e`).
- Round 8 (2026-11-13). Pirate F (mondo: "her coat is too far forward compared to everything else, its clipping through her body"): the WHOLE T2 outfit stood 10 cm in front of the body (Meshy centred the model with the long coat tail, so its eyes were 10 cm ahead of the body's; her bare back came out behind the coat). Fix = `--nowings` with `WINGY=9` (re-centres the remake on the body's eyes in depth, no shell read as a wing). The DROPAT points move back 0.10 with it, plus four loose black hair slivers behind the neck: `DROPAT="0.23,0.09,0.8,0.05;-0.01,-0.04,0.93,0.04;0.12,-0.04,0.62,0.04;-0.12,-0.04,0.63,0.04;0.2,-0.06,0.12,0.04;-0.21,-0.06,0.12,0.04;-0.17,-0.01,0.37,0.04;0.16,-0.01,0.37,0.04;0.15,0.2,1.24,0.03;0,0.16,1.23,0.03;0.24,0.15,1.27,0.03;0.09,0.16,1.33,0.03" WINGY=9 ... --neckline --nowings`. LESSON: when cloth sits in front of the body on every side view, compare the outfit GLB's chest front/back with the body's before touching ray lengths; a quick sweep of all `ewm_t2*_outfit` files showed no other batch 2 unit off like this.
- Round 8, mushroom girl (mondo: "not sure if thats a necklace or her neck line is messed up"; cap + hair + boots found by me beside the original). The brown zigzag was her curls painted on the lace of the dress top AND on the inside of the dress back seen through the neck opening. Cutting it (CUTCOL, new optional 10th number zmin) left bites and body holes, so new off-by-default knob `PAINTCOL='x,y,z,r,R,G,B,tol,zmin,R2,G2,B2[,ymin]'`: those faces take the UVs of the shell's face nearest the second colour (no texture repainted). Bake: `HANDCUT=1 DROPAT="0.1,-0.27,0.84,0.03;0,0.02,0.42,0.05" PAINTCOL="-0.01,0,0.68,0.06,0.25,0.13,0.03,0.6,1.15,0.85,0.8,0.72,0.0"` (DROPAT = a sash scrap that stood out like a blade + the T2 legs and boots: the body's legs stood beside them; HANDCUT = specks past the fingertips). Look: hair `mh_elvs_hazel_hair`, boots `mhw_grinsegold_female_pirate_boots` `#4a2e1c`, cap `ewm_mushroomcap_big` = the creator mushroom reshaped by a throwaway script (cap 2.1 wider and 1.4 taller, stalk kept, rim drooped 6 cm, tilted back) because a plain scale-up floated over the head on its stalk. LESSON: a hat that is a whole object (stalk and all) cannot be scaled as one piece; and a "band at the neckline" can be the INSIDE of the back seen through the neck, check with the hair off.
