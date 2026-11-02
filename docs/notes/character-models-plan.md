# CHARACTER MODELS PLAN — the tracker for all new character-model work

Started 2026-11-01 at mondo's ask: "We need a plan doc to keep track of all this new model stuff and any thread
working on it needs to reference it."

**Rule for every thread that touches character models** (MPFB bodies, the character creator, clothes, hair, sway,
Meshy parts, faces/mouths, wiring a race to a new model): read this file first, work from its table, and update the
row you worked on (status + what's next) in the same PR as your change. Copy the updated file to
`/mnt/project-files/character-models-plan.md` too. Technical detail stays in `models-assets.md` ("THE SWAY",
"THE MPFB BODIES") and `character-creator.md`; this file is the status board, not the notes.

Status words: **DONE** (merged and shipped), **IN PROGRESS** (a thread is on it now), **NOT STARTED**,
**WAITING ON MONDO** (needs his call or his Meshy work).

---

## 1. Where things were said (sources)

| What | Where |
|---|---|
| The original research + plan (parts list, five ways to make parts, sway, mouths, recommended path) | The modular-characters research thread `cmsg_01XWpxyTn3nnw98znVzKdFjsHxKYgEwywVd1HkgWBdc1vE`, report = Claude Doc https://claude.ai/artifact/RKFPXXHKcruZtWtR9xSQHr ; renders of all 161 rigged models = project files `character-models-plan/every_model_00..06.jpg` |
| **"The current creator clothes weren't made properly"** | Same report, section "What the models are today": the creator's garments are "GENERATED in code as a shell pushed out from the skin. That is why it took 12 revisions to stop skirts and coats tearing and poking through ... garments modelled as real meshes and fitted to the body are the normal industry method." The options table repeats it: "The creator's coded garments took 12 revisions and still look generated." Thread reply 04:54 (`cmsg_01XWpxyTn3nnw98znVzKdFjsFFQ9wkaWtr1hUnP5sUUeCS`): "Not Meshy for clothes ... A free CC0 clothing kit or your own Blender work would be better. I'd do the fitting, rigging and merging by running Blender in the cloud." |
| mondo's decision | Same thread 05:07 (`cmsg_01XWpxyTn3nnw98znVzKdFjsFm9YVB8tzybgePrRRH1nwM`): MPFB2 for base bodies + face expressions, not Quaternius ("too fortnite"); mouths not top priority but heads right from the start; "i want you to use blender in the cloud, and just tell me what to make on meshy"; go ahead with the one-character spring-bone test. |
| **The Meshy-list promise** | Same thread 05:25 (`cmsg_01XWpxyTn3nnw98znVzKdFjsWYWBgehAaYzq1aEYVXh5c9`): "Nothing to make on Meshy yet. Hats, horns and the rest need to fit the MPFB body, so I'll send that list once the body is in." The bodies are in now (PRs #725-#727); the final list is section 4 (2026-11-01). mondo's ask that prompted it, 10:22 (`cmsg_01XWpxyTn3nnw98znVzKdFjsPMuuo486qWpnh7eg1jrmxj`): "what is the updated meshy list? ... what is the gap in what the current character models have vs what is available in the character creator?" |
| MPFB body build | Thread "Build MPFB2 base character bodies" `cmsg_01XWpxyTn3nnw98znVzKdFjsUC2z1Cxfvwf2ibnT5pFeQ3`; files `/mnt/project-files/mpfb2-bodies/` (README.md, bake-mpfb.py, images) |
| MPFB in-game test, packs, creator rebuild | Thread "Test MPFB2 bodies in the game" `cmsg_01XWpxyTn3nnw98znVzKdFjsQBTj9QqYThjvG1NFQK8mz9` (PRs #725, #726, #727; the 5-step creator plan is its 06:56 reply `cmsg_01XWpxyTn3nnw98znVzKdFjs6d3EFAcerspbiNFxK7G1ft`) |
| MakeHuman asset packs | All 64 zips in project files `mhpacks/` (3.3 GB, 940 assets: 590 CC0, 350 CC-BY). Per-asset author/licence: repo `charactercreation/mpfb/ASSET_PACKS_CATALOGUE.json`. Credits used so far: `charactercreation/mpfb/CREDITS.json`. mondo is OK with a credits screen, so CC-BY is allowed, but every CC-BY asset used must be credited. |

---

## 2. Decisions mondo has made (do not re-ask)

- Base bodies + faces = **MPFB2 (MakeHuman)**. NOT Quaternius bodies.
- **Claude runs Blender headless in the cloud** (`pip install bpy==5.2.3`). No device connection, no Blender on his side.
- Claude **tells mondo what to make on Meshy**: solid pieces (hats, horns, helmets, crowns, heads, tails, wings).
  Meshy is NOT used for soft clothes (it makes closed lumps that don't fit a body).
- Clothes = **real meshes fitted to the MPFB body** (MakeHuman pack clothes, plus pieces Claude builds in cloud Blender),
  replacing the code-generated shells over time. The classic MALE / FEMALE bodies and the existing coded garments STAY
  as picks until mondo says otherwise (never delete content he didn't name).
- **Sway = spring bones**, not cloth simulation. Cosmetic, runs on each screen, nothing relayed online.
- Mouths: not top priority. MPFB heads already carry 52 ARKit face shapes + 15 visemes, so humans need no separate head.
  Creature heads will be separate pieces with a jaw bone.
- CC-BY packs are allowed; keep the credits list. Face shapes stay in (he tests on his own PC; don't cut them for the
  friend's PC).
- MPFB bodies are NOT wired to any race yet; that needs mondo's OK per race.

---

## 3. The work, piece by piece

| # | Piece of work | Owner thread | Status | What's next |
|---|---|---|---|---|
| 1 | Research: inventory all 161 rigged models, parts list, process comparison | Modular-characters research thread (`…HxKYgEwywVd1HkgWBdc1vE`) | **DONE** (report doc above) | Nothing. |
| 2 | Sway pilot 1: superhero male cape (bake-sway.py + three-renderer.js THE SWAY) | same | **DONE**, PR #724, zip 20261101-0524 | mondo to judge it in the game. |
| 3 | Sway pilots 2-5: King Arthur cape, cowboy coat, werewolf tail, bunny ears (new presets in bake-sway.py) | none yet | **NOT STARTED** | Start after mondo OKs the superhero cape. |
| 4 | Build the 5 MPFB bodies (male, female, heavy, thin, short), Meshy bone names | Build MPFB2 base character bodies (`…UC2z1Cxfvwf2ibnT5pFeQ3`) | **DONE** (handed over; merged via PR #725) | Nothing; that thread is finished. |
| 5 | Stock skins, brows, lashes, eyes, hair, 52 ARKit + 15 visemes, real in-game animation check | Test MPFB2 bodies in the game (`…QBTj9QqYThjvG1NFQK8mz9`) | **DONE**, PR #725 | Nothing. |
| 6 | Download all 64 MakeHuman packs + licence catalogue | same | **DONE**, PR #726 | Keep CREDITS.json current as assets get used. |
| 7 | MPFB bodies in the character creator + Height slider | same | **DONE**, PR #726, zip 20261101-0649 | Nothing. |
| 8 | Creator step 1: existing hair, coded clothes, layers, sliders on MPFB bodies (THE BODY MAP) | same | **DONE**, PR #727, zip 20261101-0727 | Fix the known flaw (row 9). Checked 11-01 07:40 UTC: every R2 file, the five MPFB GLBs included, matches main live. |
| 9 | Fix: long coat over a skirt/gown shows the under-layer at the lifted thigh in the wide idle; specks on coat over trousers | same | **NOT STARTED** (on its list) | Fix, or make it moot once real pack clothes replace the coded coat. |
| 10 | Creator step 2: MakeHuman pack hair as hair styles (70 styles: 35 CC0 + 35 CC-BY, hair colour picker; credits in CREDITS.json creator_hair) | Test MPFB2 bodies in the game | **DONE**, PR #730, zip 20261101-0754 | Hair sway is row 11c. |
| 10b | **Fix: pack hair that stays black / dark brown whatever colour is picked + a second hair colour** (mondo 11-01 11:31: "hair 14, curly 01, alpha 7 curly, alpha 7 long 2, double mh braid, etc") | Fix MakeHuman hair colour picking (`…YcBFp3GPRAvuhnYLMM37T6`) | **DONE**, hair colour PR | All 70 checked: ~35 textures are painted near-black and the grey mask only lifted x2.4; pack hair now takes its own texture range (models-assets.md THE PACK HAIR COLOUR). 12 styles with a separate band / tie / beads / flower get a "Second hair colour" row (Original colours / Pick a colour). |
| 11 | **Creator step 3: MakeHuman pack clothes as picks** (real meshes made for this body, fitted in cloud Blender) — this is the "new clothes built properly" promise | same | **DONE** (this PR): all 476 garments of the system assets + 38 clothing packs fitted to all five MPFB bodies with MPFB weights; skin under each garment hidden; creator CLOTHES > "MakeHuman clothes" (MPFB bodies); CREDITS.json creator_wear | Not yet: colour/fabric tint on pack clothes, heeled-shoe foot pose, following the body sliders (11b). Coded garments stay as picks. **Poses audit (11-01):** two pack garments worn together now fold the lower (z_depth; underwear always lowest) under the upper (`wearLayers`), and every coded layer is hidden under any pack garment as under a Blender coat (character-creator.md "THE POSES AUDIT"). |
| 11b | **Body sliders that shape the body** (mondo 11-01 08:13: none of height, build, chest, waist, hips, head width, jaw width work, on MPFB or classic) + **a new Bust slider**; pack clothes must follow them | same | **DONE** (PR after #738): MPFB = MakeHuman's own targets (mpfb_shapes.glb), classic = shaped in the rig; Bust added; coded + pack clothes follow; Height checked working by mouse | Tune gains if mondo wants bigger/smaller ranges (SHAPE_GAIN). **Bust fix (11-01, mondo: classic female pointy, MPFB classic female natural):** the classic FEMALE now takes MakeHuman's breast target carried across from the MPFB classic female (`node bake-classic-bust.js` -> mpfb/mpfb_classic_bust.glb, 19 KB, by vertex; the Gaussian lobes are gone); Bust is hidden and ignored on every non-female body (classic male, MPFB male/heavy/thin/short/classic male). MPFB FEMALE moved fine in our browser checks (Chrome WebGL + WebGPU) before and after. |
| 11c | **Hair sway**: spring bones on the long pack hair, like the cape (PR #724) | same | **DONE**, hair sway PR | Any creator hair below the jaw gets 7 spring chains (models-assets.md THE HAIR SWAY). **Hair on the shoulders (11-01, mondo: the cowgirl's hair clips through her shoulder):** long hair is held off the clothes worn below the jaw (hairClear) and hangs from the neck bone, not the bowing head; rev 2: hair lying on the clothes rides the garment's own weights, so it stays on the coat when posed (character-creator.md "THE HAIR ON THE SHOULDERS"). **Poses audit (11-01, mondo: "make sure all the clothes and hairs and accesorries etc also move out the way for all poses/idles"):** hair is pulled under hats / helmets / hoods / a crown mask and rides the hat; short hair rides the nape skin; hair on a raised shoulder follows the upper arm half way (character-creator.md "THE POSES AUDIT"). Known: an arm swung up through a front strand still passes through it. |
| 12 | **Clothes the packs don't have, built by Claude in cloud Blender** (real meshes modelled on the MPFB body and weighted to it, NOT shells pushed out from the skin like the classic coded clothes). Full per-race list = section 4d (capes, long coats, lab coat, tailcoat, cassock, habit, uniforms, gi, luchador mask + singlet, loincloths, ragged / leaf dresses, ghost sheet, mummy wraps...) — part of the same promise | the pilot thread (`cmsg_01XWpxyTn3nnw98znVzKdFjsN1hur7rXFTR9dmB4YyYLJV`); the 4d list thread (`cmsg_01XWpxyTn3nnw98znVzKdFjs7zrx4rDCafmx2hwFCFxDwa`) | **PILOT DONE** (trench coat), rest of 4d **IN PROGRESS** in the list thread | PILOT 11-01: `bake-garment.py` builds the trench coat from pattern pieces (wrap sheet + crossed fronts, lapels, collar, belt, buttons, epaulettes, pocket flaps, cuffs) on all five MPFB bodies and writes `charactercreation/wear/ewb_trench.glb`; creator Outer layer > "Trench coat (Blender)" (id `btrench`), next to the coded "Trench coat". Before/after shots in the creator: /mnt/project-files/blender-clothes/. The classic coded clothes are NOT replaced yet: mondo looks at the pilot first. Notes: models-assets.md "THE BLENDER COAT". Capes/coat tails get sway bones (row 3 tooling). BATCH 1 (capes) DONE 11-01: `bake-clothes.py` (imports bake-garment.py) builds the 8 capes + cloaks of 4d (Royal cape, Overlord cape, Hero cape, Sea cape, Knight cloak, Hooded cape, Leaf cloak, Fur cloak) -> `charactercreation/wear/ewb_cape_<name>.glb`; their own creator layer "Cape" (appearance.cape, MPFB bodies + the two MPFB classic bodies) over any coat, with fabric / tint / print; spring-bone sway chains (THE SWAY); fur / leaf cloaks keep their own R2 terrain tile; gold clasps / fur trims are accents. Notes: models-assets.md "THE BLENDER CAPES". BATCH 2 (long coats) DONE 11-01: 9 Outer layer picks `b<key>` -> `ewb_<key>.glb` (sprites.js EW_BLENDER_COATS): Duster (cowboy), Pirate coat, Leather coat (telepath), Long coat (homosapien), Greatcoat (marksman), Overcoat (conspiracy), Frock coat (Dorian), Tailcoat (ringmaster, the tails sway), Lab coat; a pick starts at its race's colour + fabric. Known: on MPFB heavy a few specks of the shirt show at the shoulder tops / belly, the same as the pilot trench. BATCH 3 (robes) DONE 11-01: 6 more Outer layer picks: Cassock (priest), Nun's habit (nun; no veil, that stays with 4b), White robe (cult leader), Annunaki robe, Silk robe (succubus), Ragged robe (giant). BATCH 4a (uniforms + fighter tops) DONE 11-01: 7 more Outer layer picks: Police uniform (badge, belt, chest pockets), General uniform (gold epaulettes, ribbon bars), Turnout coat (firefighter, reflective bands), Riot suit (time cop, shoulder pads, chest plate), Chef jacket, Gi (ki fighter, with the sash), Football jersey (shoulder pads, short sleeves, stripes). BATCH 4b (tight clothes) DONE 11-01: 3 more MakeHuman-clothes picks built from the body itself (each row = the body's own cross-section + a few mm): Football pants (Bottoms; knee pads, side stripes; take the Bottoms colour / fabric), Wrestling singlet (Suits; scoop neck, deep armholes, straps, side stripe, the front rises over a bust; takes the Top colour / fabric), Luchador mask (Masks; eye + mouth holes with gold trims, white stripe over the crown; its own red). Each body hides its own skin under them (ewWear.delBy). Known: on the MPFB female bodies the painted bra on the skin shows at the singlet's armholes / back scoop (a bra under a singlet); a small speck of the coded Briefs shows at the front of the singlet on MPFB classic male; hair sits over the mask (pick Bald) [fixed 11-01 by the poses audit: the hair goes under a mask that covers the crown]. BATCH 5a (costumes) DONE 11-01: 8 more Outer layer picks: Santa coat (white fur trim, fur cuffs + collar, black belt), Robin Hood tunic (dagged hem), Knight tabard (red cross, cap sleeves), Krampus fur coat (its own fur tile, crossed harness), Fringe jacket (hippie), Scarecrow tunic (patches, rope belt, torn hem), Tattered shirt (zombie's tattered edges), Clown suit (ruff, pompoms). Notes: models-assets.md "THE BLENDER COSTUMES". BATCH 5b (skirts) DONE 11-01: 4 Bottoms picks that take the Bottoms colour and sway at the hem: Ragged skirt (demon F), Valkyrie skirt, Linen kilt (Anubis), Loincloth (demon M, minotaur, goatman); + Leaf dress (fairy) as an Outer pick with its own leaf tile and loose leaves. Notes: models-assets.md "THE BLENDER SKIRTS". BATCH 5c DONE 11-01 (the 4d list is now complete): 8 more pack picks: Mummy wraps (Suits; bandage turns round the body, arms, legs, over the shoulders), Ghost sheet (Suits; over the head and the whole body, dark eye patches, the hem sways on 12 chains), Scale leggings (Bottoms, atlantean), Do-rag (Hats, gangster), Suspenders (Equipment, mime / Otto), Belly-dancer top (Tops) + Coin belt (Equipment) (fortune teller F), Off-shoulder top (Tops, necromancer). Notes: models-assets.md "THE BLENDER COSTUME PIECES". **The coat over the clothes (11-01, mondo: an outer layer makes the clothes under it clip through):** under a Blender Outer pick the coded top / bottoms / belt / glove cuffs are left out over the skin the coat hides (character-creator.md "THE COAT OVER THE CLOTHES"). |
| 12c | **Shoes built in Blender** (mondo 11-01: "what about shoes? can you redo the shoes in blender like you did the capes and stuff, or were there no shoes and footwear from those asset packs") | Rebuild creator shoes in Blender (`cmsg_01XWpxyTn3nnw98znVzKdFjsRoTjWLJoqVK6Jcna9qmAVi`) | **DONE** (2026-11-01) | The packs DO have 65 shoes / boots (shoes01-03 + system shoes01-06), already picks since row 11 (MakeHuman clothes > Shoes, MPFB bodies, no colour pick yet). The Feet row's four coded shells (Sneakers, Boots, High boots, Sandals) are now ALSO built in Blender + Cowboy boots (no pack has them): `bake-clothes.py` SHOES -> `charactercreation/wear/ewb_shoe_<key>.glb`; Feet row picks "Sneakers (Blender)" ... "Cowboy boots" (sprites.js EW_BLENDER_FEET), painted by the Feet colour / fabric / print; soles, laces, eyelets, stitching are accents. A classic Meshy base wears the coded twin. Coded picks kept. Coded trousers tuck into a Blender boot (three-renderer.js CC_MESH_TUCK). Before/after shots: /mnt/project-files/blender-clothes/shoes/. Known: a small step shows where a boot's shaft meets its foot at the front of the ankle. Not done: the cowboy race look still wears his baked coded High boots (re-export from the forge to switch); pack jeans sit over a boot shaft; heels do not lift the foot (a heel shows as a taller sole at the back). Notes: models-assets.md "THE BLENDER SHOES". |
| 12d | **A second Outer layer** (mondo 11-01: "i want to be able to add another outer layer ... with the coats and stuff. And the layers and clothes beneath it shouldn't clip through it") | Add second outer layer in creator (`cmsg_01XWpxyTn3nnw98znVzKdFjsSE75SDAn1K7i5WfiYynyy2`) | **DONE** (2026-11-01) | ＋ ADD LAYER > SECOND OUTER LAYER: every Outer pick (coded + Blender) over the Outer layer, own fabric / colour / print; coded and Blender picks layer over each other without clipping. Notes: character-creator.md "THE SECOND OUTER LAYER". Pass 2 (2026-11-02, "still getting some layers clipping through"): 26 combos x 15 poses incl. the idle picker; coded coats no longer cut open down the spine, coded/Blender/tail layers under it hidden when posed (character-creator.md "Pass 2"). |
| 12e | **Idle pose picker** (mondo 11-01: "can we also add an option to change their idle pose in the character creator?") | Add idle pose picker to creator (`cmsg_01XWpxyTn3nnw98znVzKdFjsJwF72zny2jdCVfHqURE6Dc`) | **DONE** (2026-11-01) | BODY > "Idle pose": Default (the body's own idle) + 14 standing idles already in the animation library (sprites.js EW_IDLE_POSES). Saved in the look (`appearance.idle`): EXPORT DEFAULT LOOK, bake-looks.js, the board, exploration. Notes: character-creator.md "THE IDLE POSE". |
| 12f | **Retire the classic coded clothes** (mondo 11-02: "get rid of any classic clothes and shoes ... make sure we have a replacement, except for the classic male and female bodies, make sure those stay"; + "bat wing and dragon wing models ... in the same section as the feathered wings"; card answer: the classic bodies get the new clothes fitted) | Replace classic clothes with Blender ones (`cmsg_01XWpxyTn3nnw98znVzKdFjs46xw8K2RPCWTLoUcPnsaZu`) | **DONE** 2026-11-02, PR (this thread) | Every coded Top / Bottoms / Outer / Feet / Gloves / Belt / Neckwear / Glasses pick is gone from the creator; sprites.js EW_RETIRED_CLOTHES maps each one to its replacement and normalizeCharacterAppearance (retireClassicClothes) swaps it on every read (saves, locker, race looks, online). New Blender pieces (bake-clothes.py THE BLENDER BASICS): Long-sleeve top + Henley (Tops, top layer), Sweatpants (Bottoms), Jacket / Blazer / Waistcoat / Cardigan (Outer picks bjacket/bblazer/bvest/bcardigan), Belt (Equipment, belt layer; shirts fold under it), Tie + Bow tie (Equipment, tintable). THE CLASSIC FIT: the classic MALE / FEMALE bodies wear every pack + Blender piece through bake-classic-fit.js -> mpfb/mpfb_classic_fit_<g>.glb (three-renderer ensureClassicFit). Wings row: Feathered, Bat, Dragon. Known: small shirt specks at the shoulder tops under a coat; classic MALE crotch skin patch under pack trousers in the wide stance; a long Blender shirt under an open coat on the classic bodies shows a few dark specks at its hem. |
| 12g | **Open + closed fronts, shirt collars, a tucked collared shirt, the Cowboy match** (mondo 11-02: "a lot of collars are missing ... any coat or jacket etc option needs to have an open and closed option ... long coats that i want to use for the cowboy but they are closed when his original model his coat is open ... a longsleeve collared shirt that is tucked in but with no tie ... take a look at the cowboy again") | Fix coat fronts, collars and shirts (`cmsg_01XWpxyTn3nnw98znVzKdFjsJ8iDJrE9ZPNqjdN3q6cGwV`) | **DONE** 2026-11-02 | OPEN / CLOSED: 29 Blender Outer picks have their other front baked (bake-clothes.py FRONTS -> `ewb_<coat>_open.glb` / `_closed.glb`); creator Outer + second outer show a Front OPEN / CLOSED row (appearance.outerFront / outer2Front, sprites.js EW_OUTER_FRONT / getOuterMeshUrl). Pullovers (habit, jersey, Robin Hood, tabard, clown, leaf dress) have none. SHIRTS (bake-clothes.py SHIRTS, Clothes > Tops, Top layer colour / fabric): Collared shirt (tucked, buttoned up, no tie), Open-collar shirt (tucked), Work shirt (tucked, flap chest pockets: the Cowboy's), Collared shirt (untucked), Short-sleeve shirt, Polo shirt; real turned-down collars (shirt_collar), the polo a knit one. Cowboy: a matched look (work shirt maroon, open dark duster, jeans over Blender cowboy boots, belt, beard, dark hat) is in /mnt/project-files/clothes-fronts-shirts/ as a bake-looks export, NOT baked (mondo's call). Still missing vs his Meshy model: gun belt + holster (Meshy list #2), the worn-leather look, a silver buckle. Known: on the classic body the shirt collar looks a little crumpled in the bind pose; a few shirt specks at the shoulder tops under a coat (as 12f). Notes: character-creator.md "THE OPEN + CLOSED FRONTS + THE BLENDER SHIRTS". |
| 13 | Creator step 4: skin / eye / brow picks from the packs (incl. skins03 zombie, alien, elf, white walker...) | Test MPFB2 bodies in the game | **DONE**, looks PR | 78 skins, 9 eye colours, 26 brows, 9 lashes, all CC0 (models-assets.md THE LOOKS). |
| 14 | Creator step 5: MPFB body as the creator default + credits list | same | **DONE**, default + credits PR | CREATE APPEARANCE / RANDOM / RESET and a new officer start on the MPFB body of the slot's gender; classic bodies stay one click away. Creator CREDITS section lists CREDITS.json by author (CC-BY first). |
| 14b | **Classic bodies with the MPFB head + skin** (mondo 11-01 09:44: "i like the old bodies, but i like the skin texture of the new bodies ... i also want the head of the new bodies on the old bodies") | Put MPFB head and skin on classic bodies (`…Wti4Bjhx5kFAAsKZ4FkzzY`) | **DONE**, classic-MPFB PR | Two new BODY buttons, MPFB CLASSIC MALE / FEMALE: bake-mpfb-classic.py reshapes the MPFB male / female below the neck onto the classic creator bases (within 1-3 mm; the classic normals carried over); MPFB head (face shapes), hands and feet stay, so every skin / eye / brow pick, the sliders and the pack clothes work (garments follow the reshape). Old MALE / FEMALE untouched. Not yet: the game plays no blinks / mouth shapes on any body (row 21). |
| 14d | Fix: MPFB CLASSIC shoulders folded + wrists pinched in poses (mondo 11-01 10:28) | same | **DONE**, idle-face PR | Joints now follow the reshaped skin (keep MPFB's place inside the limb); hands / feet re-seated on the reshaped wrists / ankles. |
| 14c | **Female chest choice** (same message: "remove the band from the female's chest model ... a nipple option and no nipple option") | same | **DONE**, same PR | "Chest" row (Band / Nipples / No nipples) on MPFB female + MPFB classic female (appearance.mhChest). The band is paint in the fixed look layer; Nipples leaves it out (the stock skins have nipples), No nipples also covers them with the skin just above. Works with every skin. |
| 15 | **The Meshy list for mondo** (solid pieces the packs and his R2 pieces don't cover) | Update Meshy list from creator gaps (`…2ZR9Eq91cmJWjnWTMNTfi9`) | **DONE** (list sent 2026-11-01) → **WAITING ON MONDO** to make the pieces | Section 4: 46 pieces (4a), per race (4c). Before he makes the five maybe-pieces, Claude bakes the animal-pack head / ear targets on an MPFB body (4b). Cowboy hat + gun belt first (row 17). |
| 16 | Fitting Meshy pieces onto MPFB (pin hats/horns to Head, weight tails/wings, sway bones, merge to one mesh) | Cowboy + cowgirl test (`…W8jcB8gBU1u9oGRN2t3LDe`) | **STARTED** (2026-11-01): solid hats fit | bake-clothes.py SOLIDS: mondo's own piece (.blend/.fbx + his textures, nothing generated) levelled, centred on its crown, fitted per body (hat line between eyes and crown, tilt, ease) and pinned to Head; written as a pack-wear GLB (`ewb_<id>.glb`, `solid: true`). First piece: his cowboy hat (wear/cowboyhat → `ewb_cowboyhat`, Hats). Horns / tails / wings still to do. Notes: models-assets.md "THE SOLID PIECES". 2026-11-01 THE WEAR TINT (thread `…4STDXXsdJruGdgZnuVKB7Y`): the hat and every pack piece (clothes, shoes, hats, wear) take a picked colour over their own texture's shading, or keep their original colours (appearance.wearTint, exported + baked with the look). Notes: character-creator.md "THE WEAR TINT". |
| 17 | One full test character from parts beside its current Meshy model (report suggested the cowboy) | Cowboy + cowgirl test (`…W8jcB8gBU1u9oGRN2t3LDe`) | **DONE** (2026-11-01) → **WAITING ON MONDO** go/no-go | Cowboy = MPFB classic male, cowgirl = MPFB classic female, in his cowboy hat + pack/creator clothes, revolver in hand; replaces their battle look. Edit in the forge, EXPORT DEFAULT LOOK, `node bake-looks.js <file>` bakes it into sprites.js RACE_CREATOR_LOOKS (the path for every race). USE ORIGINAL MODEL keeps the Meshy model per slot; `EW_DISABLE_RACE_LOOKS` all. SHOW ORIGINAL MODEL (stage toggle, 2026-11-01) puts the Meshy model on the creator stage as a reference, nothing saved. Gun belt (Meshy 4a #2) not made yet: the coded belt stands in. Notes: character-creator.md "THE RACE LOOKS". |
| 18 | Creature bodies on the MPFB body: the 17 races in section 4c "Creatures on a human body" (heads with a jaw bone, mermaid tail, hooves / clawed feet, tails) + coloured / fur / scale / stone skins | none yet | **NOT STARTED** | After row 17. Pieces = Meshy list 4a + the 4b checks. Insect, ape, robot and other non-human bodies keep their model (4e). |
| 19 | Grow the creator: body type, head, skin, ears, horns, tail pickers; a saved look per race | none yet | **NOT STARTED** | After rows 11-18. |
| 20 | Wire a race to an MPFB/creator look instead of its Meshy file | none yet | **WAITING ON MONDO** (per race OK) | He picks the first race. |
| 21 | Mouths: drive visemes/jaw from the dialogue text crawl (no audio) | none yet | **NOT STARTED** (low priority) | Shapes already exist on MPFB bodies. The IDLE face (blinks, glances, brows, faint smile, jaw breath) is DONE (row 21b). |
| 21b | **Idle face** (mondo 11-01 10:18: "yes lets add the idle blinking and movements") | Put MPFB head and skin on classic bodies | **DONE**, idle-face PR | Every MPFB body (classic MPFB too) plays its own ARKit shapes: blink every 2-6 s, eye glances, brow drift/lift, faint smile, jaw breath. Cosmetic, per screen. Kill switch window.EW_DISABLE_FACE_IDLE. |
| 22 | Credits screen built from CREDITS.json | thread "Build a real game credits screen" | **DONE** (2026-11-01) | Main menu → CREDITS (map.js `_renderCredits`, data.js `EW_CREDITS`); the CREDITS.json authors moved there out of the creator. Any new CC-BY asset: bake-mpfb.py writes it into CREDITS.json and the page shows it. |
| 23 | Races that keep their own model (no parts): the row's original one-offs (dino, dragon, kaiju, kraken, Nessie, jellyfish, starfish, deep-sea fish, voidweaver, Civic, seraphim x2, Occulus, unicorn, chess) + insects, apes, robots and other non-human bodies (full list section 4e; a recommendation, mondo can overrule) | — | **No rebuild planned** | Can still get sway bones for tails/tentacles/wings. |
| 24 | **Props in the hands + worn equipment** (section 6): spells hold their weapon (sword, shield, gun) instead of the board-sized prop; finishers stay big; any gear (jetpack...) worn on any model, pinned to a bone | none yet | **NOT STARTED** | 26 Meshy pieces (6b + 6c) on mondo's side; the pinning + hand-hold code and a grip pose on the MPFB fingers on Claude's. Clothes on non-MPFB models = per-model Blender refit, on request (6d). |

Weights to keep in mind: an MPFB body is ~2.5-2.9 MB with the face shapes; three builds a ~16 MB GPU morph texture per
body type the first time a face moves.

---

## 4. The Meshy list (FINAL, 2026-11-01 — per race, gaps only)

**How it was made (2026-11-01, thread "Update Meshy list from creator gaps"):** every current model was looked at in
the renders (`character-models-plan/every_model_00..06.jpg`, front / side / back), its parts listed, and everything the
creator already has was struck off:
- **Bodies + skins:** 5 MPFB bodies + 2 MPFB classic bodies, 78 stock skins (incl. zombie, grey, green alien, elf,
  white walker, Dr Manhattan blue, tigra / black fur, baboon, orc).
- **Pack pieces (render-checked on the MPFB bodies, row 11):** 476 garments incl. wizard / witch / chef / Santa / top /
  bowler / trilby / patrol / newsboy hats, 14 helmets (motorcycle, skull, templar, horned, M1, KZ45 military, pith...),
  hero masks + hoods, monk robe + hood, plague doctor, gas mask, bandana, "bag on head" sack, goggles, headset, beards,
  gloves, hand claws, faun / minotaur / demon / longhorn / gazelle / unicorn horns, antlers, devil / tigra / cat / fluffy
  tails, dragon / butterfly / bone / fairy-moth / dragonfly wings, hero suits, sci-fi armour (Helios / Jupiter7 /
  Guardian), Mars suit, wizard robe, gowns, suits, EMT, coveralls, tactical vest, bow, sword, war hammer, guns.
- **mondo's own Meshy pieces already on R2:** single angel / bat / dragon wings (`Assets/misc/wings/`, doubled and
  mirrored by `_ewWingPair`), the Occulus wings, unicorn horn, and props: revolver, pistol, shotgun, sniper rifle,
  plasma gun, master sword, shield, throwing knife, microphone, crystal ball, wooden cross, bible, skull, football,
  guitar, trumpet, voodoo doll, syringe, dynamite, grenade, burlap sack, tongs, rope.

What is left falls in three piles. Only the first is mondo's work:
1. **Meshy** (solid pieces): section 4a.
2. **Claude in cloud Blender** (soft clothes, real meshes fitted to the MPFB body): row 12, list in 4d.
3. **Claude, no new model** (colour / texture work): coloured skins (red, blue, pink, black, glowing gold, stone,
   brown / white fur, green scales, bandage wrap), tints on pack clothes (red robe, green hood...), and dark / purple /
   stone versions of the R2 angel and bat wings (fallen angel, Annunaki, nephilim, gargoyle).

**Rules for mondo on Meshy:** one object per file, no body or skin in it, neutral pose. For anything in pairs (ears,
hooves, feet, shoulder plates, gauntlets, shin plates) make **one** and Claude mirrors it, like the wings. Heads get a
mouth Claude can cut and hinge on a jaw bone.

### 4a. The Meshy shopping list (46 pieces, each made once)

Make the first two first: they are the test character's (row 17, the cowboy).

| # | Piece | Used by |
|---|---|---|
| 1 | Cowboy hat | cowboy (M + F), sheriff |
| 2 | Gun belt with a hip holster (+ a thigh-holster strap variant) | cowboy (M + F), sheriff, police officer, barbarella, spy (thigh) |
| 3 | Pirate tricorn hat | pirate (M + F) |
| 4 | Peaked officer cap | general |
| 5 | Firefighter helmet | firefighter |
| 6 | Firefighter air tank backpack | firefighter |
| 7 | Football helmet | quarterback |
| 8 | Football shoulder pads | quarterback |
| 9 | Astronaut helmet | astronaut |
| 10 | Astronaut life-support backpack | astronaut |
| 11 | Royal crown | King Arthur |
| 12 | Ice crown (spiky) | ice queen |
| 13 | Tall horned Annunaki headdress | annunaki |
| 14 | Horned overlord helmet | overlord |
| 15 | Mushroom cap hat | mushroom girl |
| 16 | Beret | mime |
| 17 | Floppy straw hat | scarecrow |
| 18 | Armour: breastplate | knight, King Arthur, valkraye, overlord, nephilim |
| 19 | Armour: shoulder plate (one) | same |
| 20 | Armour: gauntlet (one) | same |
| 21 | Armour: shin + knee plate (one) | same |
| 22 | Egyptian broad gold collar | anubis |
| 23 | Sheriff star | sheriff |
| 24 | Police badge | police officer |
| 25 | Quiver with arrows | robinhood |
| 26 | Small backpack | sidekick |
| 27 | Tool belt with pouches | Otto (cast) |
| 28 | Cross pendant necklace | priest (nun) |
| 29 | Katana in a back sheath | swordfighter |
| 30 | Trident | atlantean |
| 31 | Neck bolts (one) | Frankenstein (cast) |
| 32 | Pointed elf ear (one; Claude scales it up for the goblin) | fairy, machine elves, goblin |
| 33 | Grey alien head, big black eyes | grey, martian (green skin) |
| 34 | Jackal head with the striped pharaoh headdress | anubis |
| 35 | Goat head (horns come from the packs) | goatman, krampus |
| 36 | Eagle head | eagleman |
| 37 | Shark head | sharkman |
| 38 | Lizard head | reptilian |
| 39 | Moth head (red eyes, feelers) | mothman |
| 40 | Moth wing (one, dark) | mothman |
| 41 | Lizard tail | reptilian |
| 42 | Shark tail + dorsal fin | sharkman |
| 43 | Mermaid tail (whole lower body, waist down) | mermaid, siren (2D-only today) |
| 44 | Wolf tail (the pack's fluffy tail is a white fox tail) | werewolf |
| 45 | Hoof (one, for fur legs) | minotaur, goatman, krampus |
| 46 | Clawed beast foot (one) | demon (M), werewolf, gargoyle |

Up to five more only if the checks in 4b fail (wolf head, bull head, rabbit head, cat ear, bunny ear).

### 4b. Check first: packs that might cover these (Claude checks before mondo makes them)

The MakeHuman animal packs (animal01-04) are face **shape targets** on the MPFB head, not separate meshes, and none
are baked into the game yet. If they look right on the body they replace a Meshy head; if not, the head goes on the
list:
- Wolf head (animal03) → werewolf. Else Meshy **wolf head**.
- Cow head (animal03) + the pack minotaur horns → minotaur. Else Meshy **bull head**.
- Rabbit head (animal03) → rabbit. Else Meshy **rabbit head**.
- Cat / bunny ears (animal01 catgirl ears, animal02 feline + bunny ears) → catgirl, bunny girl, Kit (cast). They
  reshape the human ear, so they will likely NOT give ears on top of the head. Else Meshy **cat ear** and **bunny ear**
  (one each, mirrored; they get sway bones).
- Charity veil (hats03) → the nun. Else Claude builds the veil in Blender (soft).

### 4c. Per race: what each needs vs what the creator has

M / F = which models the race has today. "Pack" = MakeHuman pack piece in the creator; "R2" = mondo's piece already
on R2; "Blender" = Claude builds it (4d); "skin" = a colour / texture Claude does.

**People in clothes** (MPFB body; most need nothing from Meshy)

| Race | Meshy (the gap) | Already covered | Claude does |
|---|---|---|---|
| angel (F) | none | R2 angel wings, pack goddess dress | — |
| annunaki (M) | 13 headdress | R2 angel wings, pack beard | dark wings, Blender long robe |
| antihero (M) | none | pack hero suit, boots | Blender cape |
| astronaut (M) | 9 helmet, 10 backpack | pack Mars suit, boots | — |
| atlantean (F) | 30 trident | pack bikini top, hair | Blender long cape, scale leggings |
| barbarella (F) | 2 gun belt | pack swimsuit, boots, gloves | — |
| bunny girl (F) | bunny ears (4b) | pack bodysuit, stockings, fluffy tail, heels | — |
| catgirl (F) | cat ears (4b) | pack cat tail, crop top, shorts, fishnets, boots | — |
| chef (M) | none | pack chef hat, apron, trousers | Blender chef jacket |
| clown (M) | none | — | Blender ragged clown suit, face-paint skin |
| conspiracy theorist (M) | none | pack headset, shirt + tie, jeans | Blender overcoat |
| cowboy (M + F) | 1 hat, 2 gun belt | R2 revolver, pack jeans, boots | Blender duster coat (M) |
| cult leader (M) | none | pack hair, beard, sandals | Blender white robe |
| demon (F) | none | pack demon horns, devil tail | red skin, Blender ragged skirt |
| demon princess (F) | none | pack horns, gown, hair | — |
| djinn (M) | none | pack harem pants | blue skin |
| fairy (F) | 32 elf ear | pack fairy / butterfly wings, sandals | Blender tattered leaf dress |
| fallen angel (F) | none | R2 angel wings, pack gown | black wings |
| firefighter (M) | 5 helmet, 6 air tank | pack gloves, boots | Blender turnout coat + trousers |
| fortune teller (M + F) | none | R2 crystal ball, pack monk robe + hood, tiered skirt | red robe tint, Blender belly-dancer top + coin belt (F) |
| gangster (M) | none | pack jeans, sneakers | Blender bandana do-rag |
| general (M) | 4 officer cap | pack boots | Blender general's uniform |
| ghost (F) | none | pack gown, hair | pale see-through skin |
| ghost (M) | none | — | Blender ghost sheet (with sway) |
| giant (M) | none | pack beard, hair | Blender ragged robe + fur cloak |
| glitch (M) | none | — | blue glitch skin |
| halfdemon (M + F) | none | pack demon horns, suit, gown | — |
| hippie (M + F) | none | pack fringe dress, jeans, hair, fishing hat (M) | Blender fringe jacket |
| homosapien (M) | none | pack trousers, boots | Blender long coat |
| ice queen (F) | 12 ice crown | pack gown | pale blue tint |
| ki fighter (F) | none | pack trousers | Blender gi top + sash |
| King Arthur (M) | 11 crown, 18-21 armour | R2 master sword, pack boots | Blender cape + tunic |
| knight (F) | 18-21 armour | pack hair | Blender tabard + cloak |
| luchador (M) | none | pack boots | Blender mask + singlet (tight, built from the body) |
| mad scientist (M + F) | none | pack goggles, trousers, boots | Blender lab coat |
| marksman (M + F) | none | R2 sniper rifle, pack tactical vest, cargo pants, gloves, boots | Blender greatcoat (M) |
| men in black (M) | none | pack suit, sunglasses | — |
| mime (F) | 16 beret | pack striped shirt, skirt, shoes | Blender suspenders, white face skin |
| mummy (F) | none | pack hair | Blender bandage wraps |
| mushroom girl (F) | 15 mushroom cap | pack ruffle dress, boots | — |
| necromancer (F) | none | pack hair, slit skirt | Blender off-shoulder top |
| nephilim (M) | 18-21 armour | R2 angel wings, pack boots | purple wings, pink skin |
| nordic (M) | none | pack hair, coveralls / skinsuit | — |
| orb of light (F) | none | pack hair | glowing gold skin |
| overlord (M) | 14 helmet, 18-21 armour | — | Blender cape |
| pirate (M + F) | 3 tricorn | R2 sword, pack pirate boots, shorts | Blender pirate coat + sash |
| police officer (M) | 2 gun belt, 24 badge | pack shoes | Blender police uniform |
| politician (M) | none | pack suit + tie | — |
| popstar (F) | none | pack crop top, mini skirt, heels | — |
| priest (M) | none | pack shoes | Blender cassock |
| priest (F, nun) | 28 cross pendant | veil (4b) | Blender habit |
| professor (M) | none | pack suit | — |
| quarterback (M) | 7 helmet, 8 shoulder pads | R2 football | Blender jersey + pants |
| ringmaster (M) | none | pack top hat, trousers, boots | Blender tailcoat |
| robinhood (M) | 25 quiver | pack bow, hood, boots, gloves | green tint, Blender tunic |
| santa clause (M) | none | pack Santa hat, full beard, boots | white beard, Blender Santa coat with fur trim |
| scarecrow (M) | 17 straw hat | pack "bag on head" sack | Blender patched tunic |
| shaman (F) | none | pack hood, sandals | Blender leaf / moss cloak |
| sheriff (M) | 1 hat, 2 gun belt, 23 star | R2 revolver, pack boots | Blender jacket |
| sidekick (M) | 26 backpack | pack hero suit, domino mask, boots | — |
| spy (F) | 2 gun belt (thigh) | R2 pistol, pack dress, heels | — |
| succubus (F) | none | pack horns, devil tail | pink skin, Blender robe |
| superhero (M + F) | none | pack hero suits, boots | Blender cape |
| swordfighter (F) | 29 katana | pack jacket, shorts, boots | — |
| symbiote (F) | none | — | glossy black skin |
| telepath (M + F) | none | pack gown (F) | Blender long leather coat (M) |
| time cop (M) | none | pack KZ45 helmet, tactical vest, sci-fi armour, boots | Blender riot suit |
| valkraye (F) | 18-21 armour | R2 angel wings, pack boots | Blender short skirt |
| vampire (F) | none | pack gown, hair | — |
| wizard (M + F) | none | pack wizard hat / witch hat, wizard robe | Blender coat (F) |
| zombie (F) | none | pack zombie skin, tank, shorts | Blender tattered edges |
| cast: belle, doorman, dorian, elle, father, glass, janitor, knox, locke, mother, player, rhonda, ringer, door agent (M + F) | none | pack suits, dresses, coveralls, shoes | Blender frock coat (Dorian) |
| cast: cult 1-5 | none | pack monk robe + hood | — |
| cast: Frankenstein | 31 neck bolts | pack heavy body, boots | green skin, Blender work clothes |
| cast: Kit | cat ears (4b) | pack crop top, stockings | Blender hooded cape |
| cast: Otto | 27 tool belt | pack jeans, boots, shirt | Blender suspenders / harness |

**Creatures on a human body** (MPFB body + new head / limbs / skin; build after the test character, row 18)

| Race | Meshy (the gap) | Already covered | Claude does |
|---|---|---|---|
| anubis (M) | 34 jackal head, 22 collar | pack sandals | Blender kilt, gold arm bands |
| demon (M) | 46 clawed foot | pack demon horns, devil tail, R2 bat wings | red skin, Blender loincloth |
| eagleman (M) | 36 eagle head | pack suit, gloves | — |
| gargoyle (F) | 46 clawed foot | pack horns, devil tail, R2 bat wings | stone skin + stone wings |
| goatman (M) | 35 goat head, 45 hoof | pack horns | fur legs skin, Blender loincloth |
| goblin (M) | 32 ear (scaled up) | pack small demon horns, suit | grey skin |
| grey (M) | 33 alien head | pack grey skin, thin body | — |
| krampus (M) | 35 goat head, 45 hoof | pack longhorn / faun horns | fur skin, Blender fur coat + harness |
| machine elves (M) | 32 elf ear | pack goggles, wizard hat, short body | Blender tunic |
| martian (M) | 33 alien head | pack green alien skin | — |
| mermaid (F) | 43 mermaid tail | pack bikini top, hair | — |
| minotaur (M) | bull head (4b), 45 hoof | pack minotaur horns | brown fur skin, Blender loincloth |
| mothman (M) | 39 moth head, 40 moth wing | — | dark skin |
| rabbit (M) | rabbit head (4b) | pack fluffy tail | fur skin |
| reptilian (M) | 38 lizard head, 41 lizard tail | pack suit + tie | green scale skin |
| sharkman (M) | 37 shark head, 42 tail + fin | pack hand claws | grey skin |
| werewolf (M) | wolf head (4b), 44 wolf tail, 46 clawed foot | pack hand claws | fur skin |

**2D-only races today** (no 3D model; only if mondo wants them built from the creator): siren = 43 mermaid tail;
demon prince = pack horns + R2 bat wings, nothing new; chosen one = nothing new; skinwalker = Meshy deer-skull head
(antlers from the pack); cyclops = Meshy one-eyed head; super sentai = Meshy sentai helmet (suit from the pack);
android, droid = keep as robots (4e); watcher = needs a look at its sprite first.

### 4d. Soft clothes Claude builds in cloud Blender (row 12, from the gaps above)

Real meshes modelled on the MPFB body and weighted to it (the way the pack clothes are made), NOT the old method that
pushed a shell out from the skin. Capes, coat tails, skirts and the ghost sheet get sway bones.
- Capes and cloaks: King Arthur, overlord, superhero / antihero, atlantean, knight, Kit's hooded cape, shaman's leaf
  cloak, giant's fur cloak.
- Long coats: cowboy duster, pirate coat, telepath leather coat, homosapien coat, marksman greatcoat, conspiracy
  overcoat, Dorian's frock coat, ringmaster tailcoat, lab coat.
- Robes: cassock (priest), nun's habit (+ veil if 4b fails), cult leader's white robe, Annunaki robe, succubus robe,
  giant's ragged robe.
- Uniforms: police, general, firefighter turnout gear, time cop riot suit, football jersey + pants, chef jacket.
- Fighters: martial-arts gi + sash (ki fighter), luchador mask + singlet.
- Ragged and costume: tattered leaf dress (fairy), ragged skirt (demon F), tattered edges (zombie), clown suit,
  scarecrow tunic, ghost sheet, mummy wraps, loincloths / kilts (demon M, minotaur, goatman, anubis), belly-dancer top
  + coin belt (fortune teller F), Santa coat with fur trim, Robin Hood tunic, knight tabard, valkyrie skirt, Krampus fur
  coat + harness, fringe jacket (hippie), suspenders (mime, Otto), bandana do-rag (gangster), scale leggings
  (atlantean), off-shoulder top (necromancer).

### 4e. Keep their own model (nothing to make) — my recommendation, mondo can overrule

Their bodies are not a human body in clothes, so rebuilding them from parts would mean Meshy making the whole body
again for nothing gained. They keep their current model and can still get sway bones (tails, tentacles, wings):
dinosaur, dragon, kaiju, kraken, loch ness monster, jellyfish, starfish, deep sea fish, voidweaver, honda civic,
seraphim, occulus, unicorn, chess piece (row 23) **plus** antperson, bee queen, mantid, dreameater, flesheater, undead,
swamp monster, shadow entity, tree person, crystal guardian, golem, juggernaut, black goo, cosmic wraith, ghoul,
skeleton, jack o lantern, gnome, bligblog, mech, robot, ai, cyborg, bigfoot, yeti, king kong.
(The last three could become a heavy MPFB body + an ape head + fur skin later; that would add one Meshy **ape head**.)

---

## 6. Props in the hands + wearable equipment (2026-11-01, mondo's ask)

mondo 11-01 10:39 (`cmsg_01XWpxyTn3nnw98znVzKdFjsQu7KJc1NDNZzh4N96muKAm`): units should **hold the weapon their attack
uses** (sword, shield, gun in the model's hand) instead of the big board-sized prop the spell effect conjures today;
the big version can stay for **ultimates / finishers** and pure VFX. Equipment (the jetpack...) should be **worn on the
model**, and any model must be able to wear any gear.

**Checked:** all 185 spells in SPELL_LIBRARY and the 16 gear items (EQUIP_DEFS / GEAR_PASSIVES) against what is already
on R2 (three-vfx-effects.js `_WPN_MODELS`: revolver, pistol, plasma gun, shotgun, sniper rifle, master sword, shield,
throwing knife, spear, arrow, crystal ball, cauldron, tarot cards + deck, wooden cross, bible, skull, bones, syringe,
tongs, trumpet, microphone, dynamite, grenade, landmine, rope, voodoo doll, crystal shards, football; the eleven
instruments; the pocket watch) and the pack props (bow, dagger, crude sword, war hammer, sceptre, kali sticks, AKM,
L1A1, M1911, hand claws, suitcase, guitar). The 136 finishers stay board-sized (mondo: "cool for ultimate spells").

### 6a. Spells: already covered (no Meshy work)
- Guns: Double Pump (shotgun), Crossfire (two pistols), Precision Shot / Take Aim / Dead Eye (sniper rifle), Kneecap
  Shot + Slap Leather (revolver), Railgun (plasma gun).
- Blades: Brave Charge, Dragon Slash, Cross Slash, Sword Beam, Blade Waltz (sword; the swordfighter's katana is Meshy
  list #29), Sneak Slash (dagger), Knife Throw + Open Vein (throwing knife).
- Shield: Iron Dome, Shield Bash, Fortify. Lance: Lance (spear). Bow: Robin Hood's shots (bow + arrow).
- Others: Place Bomb (dynamite), Anthem (microphone), Lullaby / Discordance / Encore (harp, violin, guitar), Hogtie /
  Rescue Line / Rustle / Round Up / Snare (rope), Needle Work (voodoo doll), Premonition / Harbinger (crystal ball),
  Stacked Deck (tarot deck), Skull Crack (war hammer).
- Bare hands / voice / magic from the hand need no prop: fist, claw and most magic spells.

### 6b. Spells: Meshy pieces still needed (14)
| # | Piece | For |
|---|---|---|
| 47 | Potion flask / beaker | Acid Flask, Antidote, Chain Reaction (mad scientist) |
| 48 | Scalpel | Vivisection |
| 49 | Bullwhip | Crack the Whip (ringmaster) |
| 50 | Wrench | Repair |
| 51 | Blowpipe | Poison Dart |
| 52 | Smartphone | Doomscroll, Ratio'd |
| 53 | Hand mirror | Mirror Shard, Seven Years, Shattered Mirror, Hall of Mirrors |
| 54 | Old camera with a flash | Out of the Dark, Eyewitness |
| 55 | Plate of cookies + a glass of milk | Milk and Cookies (Santa) |
| 56 | Drinking cup | Dosed |
| 57 | Broken halo | Broken Halo (fallen angel) |
| 58 | Deck of playing cards | Jackpot (bunny girl) |
| 59 | Magic wand | wizard + the magic casters' basic attack (optional) |
| 60 | Wizard staff | same (optional; the pack sceptre is the stand-in) |

### 6c. Equipment worn on the model (16 gear items)
Already covered: Chrono Locket = the R2 pocket watch; Archon's Focus = an R2 crystal shard floating at the shoulder;
Mason's Gauntlets = pack gloves; Berserker's Brand = a glowing mark painted on the skin (Claude, no model).
Meshy pieces still needed (12):

| # | Piece | Gear | Worn |
|---|---|---|---|
| 61 | Jetpack | Jetpack | back |
| 62 | Binoculars | Binoculars | on a neck strap |
| 63 | Walkie talkie | Walkie Talkie | shoulder / belt clip |
| 64 | Flare gun | Signal Flare | hip |
| 65 | Small carved totem | Ward Totem | belt (the placed ward stays board-sized) |
| 66 | Collapsible spyglass | Telescope | hip |
| 67 | Talisman pendant | Martyr's Talisman | neck |
| 68 | Hanging censer on a chain | Censer of Purity | hip, swings |
| 69 | Forearm gauntlet with a grappling hook | Grapnel Gauntlet | right forearm |
| 70 | Arm band | Echo Band | upper arm |
| 71 | Stone with a hole, on a cord | Hagstone | neck |
| 72 | Forked dowsing rod | Dowsing Rod | back / belt |

Total with section 4a: **72 Meshy pieces.**

### 6d. Will gear and clothes fit every model, including the ones that keep their own model?
- **Solid pieces fit every model with no extra versions.** Every one of the 161 models, the MPFB and classic bodies
  and the 4e "keep" models alike, carries the same Meshy bone names (Hips, Spine02, Head, RightHand...). A jetpack,
  hat, helmet, backpack, gun belt, pendant or held sword is pinned to a bone (the way the creator wings ride Spine02 and
  the door gun sits in the hand), sized from the model's measured bounds. A robot gets the same jetpack file as anyone;
  only an odd shape (kraken, starfish, Civic) needs a per-model nudge of where it sits.
- **Hands:** the MPFB bodies have real finger bones, so they can close round a grip (a grip pose is new work). The
  Meshy models have no finger bones (mitten hands; only priest, bligblog, Frankenstein and swamp monster have fingers),
  so a prop sits in the closed mitt. That still reads as holding it at game distance.
- **Soft clothes do NOT bend round a different body by themselves.** A T-shirt, trousers or coat is fitted to one
  body's shape. Putting one on the robot means Claude refits it to the robot in cloud Blender: shrink-wrap the garment
  onto that model's surface and copy its bone weights across. That is automatic per model, so mondo makes nothing
  extra, but it only works on roughly human-shaped models (robot, cyborg, ai, yeti, golem...), it is one file per
  garment per model, so it is done per race on request rather than for every garment on every model, and very bulky
  shapes (King Kong, juggernaut) will look stretched. A tie, badge or medal is a solid piece and just pins to the chest.
- Online: both screens already play the cast and its effects, so a held prop is part of that same moment. When it is
  built it rides the existing cast relay (RULE #2), with no new state.

---

## 5. Log (newest last; one line per change to this file)

- 2026-11-01 — file created from the research thread, PRs #724-#727, the two MPFB threads and mhpacks/. Meshy list
  drafted (section 4), not yet confirmed or sent.
- 2026-11-01 — row 8: live R2 matches main (all scripts + the five MPFB GLBs), nothing to upload.
- 2026-11-01 — row 10 DONE (PR #730); row 11 DONE (pack clothes); rows 11b (body sliders + bust) and 11c (hair sway) added
  from mondo's 08:13 message; section 4b render-checked on the MPFB bodies.
- 2026-11-01 — row 11b DONE (body sliders + Bust).
- 2026-11-01 — row 11c DONE (hair sway).
- 2026-11-01 — row 13 DONE (skin / eye / brow / lash picks).
- 2026-11-01 — row 14 DONE (MPFB default + creator credits). Creator plan steps 1-5 all done.
- 2026-11-01 — rows 14b (classic bodies with the MPFB head + skin) and 14c (female chest choice) added and DONE.
- 2026-11-01 — section 4 rewritten as the FINAL Meshy list: every model checked against the pack pieces + mondo's R2
  pieces; 46 Meshy pieces (4a), 5 pack checks (4b), per race (4c), Blender clothes list (4d, row 12), keep-own-model
  list (4e, row 23). Rows 12, 15, 18, 23 updated.
- 2026-11-01 — row 14d (classic MPFB shoulders / wrists fix) and 21b (idle face) DONE.
- 2026-11-01 — section 6 + row 24 added (props in the hands + worn equipment): 185 spells and 16 gear items checked; 26
  more Meshy pieces (#47-72), and the answer on gear / clothes fitting models that keep their own model.
- 2026-11-01 — row 11b: Bust natural on the classic female (bake-classic-bust.js), hidden on non-female bodies.
- 2026-11-01 — row 12 pilot DONE: the trench coat built in cloud Blender (bake-garment.py, ewb_trench.glb), a creator Outer
  layer pick beside the coded one; classic clothes not replaced yet (mondo decides after the screenshots).
- 2026-11-01 — row 12 batch 1 DONE: 8 Blender capes + cloaks (bake-clothes.py, ewb_cape_*.glb) on a new creator Cape layer
  with sway chains; classic clothes still not replaced.
- 2026-11-01 — row 12 batch 2 DONE: 9 Blender long coats as Outer layer picks (bake-clothes.py COATS), tailcoat tails
  sway; long skirts on the classic body smoothed over the garment (spaceSmooth).
- 2026-11-01 — row 10b added and DONE (pack hair colour + second hair colour).
- 2026-11-01 — row 12 batch 3 DONE: 6 Blender robes as Outer layer picks (cassock, habit, white robe, Annunaki, silk,
  ragged); buttons / belts below the hips ride the hanging skirt.
- 2026-11-01 — row 12 batch 4a DONE: 7 Blender uniform / fighter tops as Outer layer picks (police, general, turnout,
  riot, chef, gi + sash, football jersey).
- 2026-11-01 — row 12 batch 4b (football pants, wrestling singlet, luchador mask: tight clothes built from the body) DONE.
- 2026-11-01 — row 12 batch 5a DONE: 8 Blender costume tops as Outer layer picks (Santa coat, Robin Hood tunic, knight
  tabard, Krampus fur coat + harness, fringe jacket, scarecrow tunic, tattered shirt, clown suit).
- 2026-11-01 — row 12 batch 5b DONE: ragged skirt, valkyrie skirt, linen kilt, loincloth (Bottoms picks, the hem sways) +
  leaf dress (Outer pick).
- 2026-11-01 — row 12 batch 5c DONE (4d list complete): mummy wraps, ghost sheet (hem sways), scale leggings, do-rag,
  suspenders, belly-dancer top + coin belt, off-shoulder top (pack picks).
- 2026-11-01 — rows 16 STARTED + 17 DONE: mondo's cowboy hat fitted as a solid piece (`ewb_cowboyhat`); cowboy + cowgirl
  rebuilt from the creator on MPFB classic, baked as race looks (bake-looks.js); old Meshy models kept (USE ORIGINAL MODEL).
- 2026-11-01 — row 17 follow-up: facial hair pick + colour on MPFB bodies (pack beards, beardTint/beardColor); the grip:
  the classic MPFB rig already has skinned finger bones, a held prop curls its hand (`_gripHand`), no hand graft needed.
- 2026-11-01 — creator FACE CAMERA: face / hair / headwear edits glide the stage camera to a face close-up, body and
  clothes edits glide back (character-creator.md "THE FACE CAMERA").
- 2026-11-01 — row 17 follow-up: the revolver is seated in the cowboy's closed fist (`_gripFrame`, hold `grip`), not at the wrist.
- 2026-11-02 — row 24 start: the door gun uses the same grip (`HQ_PORTAL_RULES.gun.grip`, 0.21 m), on creator bodies, the HQ
  walker, and Meshy hands (`_gripFrameMesh`: the handle on the palm read off the skin; fingers stay open). door-gun-skate-vehicles.md.
- 2026-11-02: row 12g added (open + closed fronts, Blender shirts with collars, Cowboy match) — thread cmsg_01XWpxyTn3nnw98znVzKdFjsJ8iDJrE9ZPNqjdN3q6cGwV.
