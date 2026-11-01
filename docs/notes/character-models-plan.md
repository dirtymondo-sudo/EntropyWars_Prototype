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
| **The Meshy-list promise** | Same thread 05:25 (`cmsg_01XWpxyTn3nnw98znVzKdFjsWYWBgehAaYzq1aEYVXh5c9`): "Nothing to make on Meshy yet. Hats, horns and the rest need to fit the MPFB body, so I'll send that list once the body is in." The bodies are in now (PRs #725-#727), so the list is due: draft in section 4 below. |
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
| 11 | **Creator step 3: MakeHuman pack clothes as picks** (real meshes made for this body, fitted in cloud Blender) — this is the "new clothes built properly" promise | same | **DONE** (this PR): all 476 garments of the system assets + 38 clothing packs fitted to all five MPFB bodies with MPFB weights; skin under each garment hidden; creator CLOTHES > "MakeHuman clothes" (MPFB bodies); CREDITS.json creator_wear | Not yet: colour/fabric tint on pack clothes, heeled-shoe foot pose, following the body sliders (11b). Coded garments stay as picks. |
| 11b | **Body sliders that shape the body** (mondo 11-01 08:13: none of height, build, chest, waist, hips, head width, jaw width work, on MPFB or classic) + **a new Bust slider**; pack clothes must follow them | same | **DONE** (PR after #738): MPFB = MakeHuman's own targets (mpfb_shapes.glb), classic = shaped in the rig; Bust added; coded + pack clothes follow; Height checked working by mouse | Tune gains if mondo wants bigger/smaller ranges (SHAPE_GAIN). |
| 11c | **Hair sway**: spring bones on the long pack hair, like the cape (PR #724) | same | **DONE**, hair sway PR | Any creator hair below the jaw gets 7 spring chains (models-assets.md THE HAIR SWAY). |
| 12 | **Clothes the packs don't have, built by Claude in cloud Blender** (capes and cloaks, lab coat, tailcoat, cassock/priest robe, police/general/firefighter uniforms, astronaut suit, loincloth, tattered skirt, petticoat, corset, wrestling singlet, martial-arts top, Robin Hood tunic, football jersey + pads, chef jacket, apron variants) — part of the same promise | none yet | **NOT STARTED** | After row 11 proves the fitting pipeline. Capes/coat tails get sway bones (row 3 tooling). |
| 13 | Creator step 4: skin / eye / brow picks from the packs (incl. skins03 zombie, alien, elf, white walker...) | Test MPFB2 bodies in the game | **DONE**, looks PR | 78 skins, 9 eye colours, 26 brows, 9 lashes, all CC0 (models-assets.md THE LOOKS). |
| 14 | Creator step 5: MPFB body as the creator default + credits list | same | **DONE**, default + credits PR | CREATE APPEARANCE / RANDOM / RESET and a new officer start on the MPFB body of the slot's gender; classic bodies stay one click away. Creator CREDITS section lists CREDITS.json by author (CC-BY first). |
| 14b | **Classic bodies with the MPFB head + skin** (mondo 11-01 09:44: "i like the old bodies, but i like the skin texture of the new bodies ... i also want the head of the new bodies on the old bodies") | Put MPFB head and skin on classic bodies (`…Wti4Bjhx5kFAAsKZ4FkzzY`) | **DONE**, classic-MPFB PR | Two new BODY buttons, MPFB CLASSIC MALE / FEMALE: bake-mpfb-classic.py reshapes the MPFB male / female below the neck onto the classic creator bases (within 1-3 mm; the classic normals carried over); MPFB head (face shapes), hands and feet stay, so every skin / eye / brow pick, the sliders and the pack clothes work (garments follow the reshape). Old MALE / FEMALE untouched. Not yet: the game plays no blinks / mouth shapes on any body (row 21). |
| 14d | Fix: MPFB CLASSIC shoulders folded + wrists pinched in poses (mondo 11-01 10:28) | same | **DONE**, idle-face PR | Joints now follow the reshaped skin (keep MPFB's place inside the limb); hands / feet re-seated on the reshaped wrists / ankles. |
| 14c | **Female chest choice** (same message: "remove the band from the female's chest model ... a nipple option and no nipple option") | same | **DONE**, same PR | "Chest" row (Band / Nipples / No nipples) on MPFB female + MPFB classic female (appearance.mhChest). The band is paint in the fixed look layer; Nipples leaves it out (the stock skins have nipples), No nipples also covers them with the skin just above. Works with every skin. |
| 15 | **The Meshy list for mondo** (solid pieces the packs don't cover) | this plan (draft in section 4) | **NOT DONE** — promised 05:25, not sent until now; draft below | The creator thread checks each pack item it is counting on (render it on an MPFB body), then the final list goes to mondo. Then **WAITING ON MONDO** to make the pieces. |
| 16 | Fitting Meshy pieces onto MPFB (pin hats/horns to Head, weight tails/wings, sway bones, merge to one mesh) | none yet | **NOT STARTED** | When mondo's first Meshy pieces arrive. |
| 17 | One full test character from parts beside its current Meshy model (report suggested the cowboy) | none yet | **NOT STARTED** | Go/no-go for rebuilding the cast. Needs hat (Meshy), coat, boots, gun belt. |
| 18 | Creature bodies: lower-body swaps (mermaid tail, ghost sheet, hooves, paw legs), creature heads with a jaw bone, skins (fur, scales, chitin, stone, bark, goo, robot) | none yet | **NOT STARTED** | After row 17. Heads/legs come from the Meshy list + animal03/04 packs. |
| 19 | Grow the creator: body type, head, skin, ears, horns, tail pickers; a saved look per race | none yet | **NOT STARTED** | After rows 11-18. |
| 20 | Wire a race to an MPFB/creator look instead of its Meshy file | none yet | **WAITING ON MONDO** (per race OK) | He picks the first race. |
| 21 | Mouths: drive visemes/jaw from the dialogue text crawl (no audio) | none yet | **NOT STARTED** (low priority) | Shapes already exist on MPFB bodies. The IDLE face (blinks, glances, brows, faint smile, jaw breath) is DONE (row 21b). |
| 21b | **Idle face** (mondo 11-01 10:18: "yes lets add the idle blinking and movements") | Put MPFB head and skin on classic bodies | **DONE**, idle-face PR | Every MPFB body (classic MPFB too) plays its own ARKit shapes: blink every 2-6 s, eye glances, brow drift/lift, faint smile, jaw breath. Cosmetic, per screen. Kill switch window.EW_DISABLE_FACE_IDLE. |
| 22 | Credits screen built from CREDITS.json | thread "Build a real game credits screen" | **DONE** (2026-11-01) | Main menu → CREDITS (map.js `_renderCredits`, data.js `EW_CREDITS`); the CREDITS.json authors moved there out of the creator. Any new CC-BY asset: bake-mpfb.py writes it into CREDITS.json and the page shows it. |
| 23 | One-offs that stay their own model (dino, dragon, kaiju, kraken, Nessie, jellyfish, starfish, deep-sea fish, voidweaver, Civic, seraphim x2, Occulus, unicorn, chess) | — | **No rebuild planned** | Can still get sway bones for tails/tentacles/wings. |

Weights to keep in mind: an MPFB body is ~2.5-2.9 MB with the face shapes; three builds a ~16 MB GPU morph texture per
body type the first time a face moves.

---

## 4. The Meshy list (DRAFT — owed to mondo since 2026-11-01 05:25)

What mondo should make on Meshy: **solid pieces only, each as its own object** (not on a character), neutral pose,
no body or skin in the model. Claude fits each one to the MPFB bodies in cloud Blender.

**How this draft was made:** the parts list in the research report, minus everything the downloaded MakeHuman packs
already cover. The pack matches are **by asset name only** (ASSET_PACKS_CATALOGUE.json), not yet rendered on an MPFB
body, so a few may move between lists once the creator thread looks at them. Status of the list: **NOT SENT / NOT
CONFIRMED**.

### 4a. Make on Meshy (packs have nothing close)

Hats and headwear
- Cowboy hat (cowboy, sheriff)
- Pirate tricorn
- Peaked officer cap (general) and police cap
- Firefighter helmet
- Football helmet
- Astronaut helmet
- Riot helmet (time cop)
- Crown (King Arthur) and ice crown (ice queen)
- Egyptian headdress (Anubis)
- Wrestling mask (luchador)
- Mushroom cap (mushroom girl)
- Beret (mime)
- Halo

Heads (animal and creature; each gets a jaw bone)
- Jackal (Anubis), bull (minotaur), goat (goatman, Krampus), eagle, shark, lizard (reptilian), gorilla (King Kong)
- Ant, mantis, moth (mothman), deep-sea fish
- Pumpkin (Jack o' lantern), skull, sack face (scarecrow), cyclops
- Robot heads (2 or 3)

Eyes
- Glowing eyes (shadow entity, mothman, ant), big black alien eyes, compound insect eyes, one giant eye (black goo,
  Occulus, cyclops)

Horns, wings, tails
- Small imp horns (goblin), overlord helmet horns
- Bat / demon wings (demon, gargoyle; the packs' dragon wing may do instead), dark feathered wings (fallen angel, nephilim, Annunaki), mech wings
- Lizard tail (reptilian, kaiju), wolf tail, shark tail, bunny puff tail

Armour (hard plates)
- Medieval breastplate, shoulder plates, gauntlets, leg plates (knight, King Arthur, valkyrie, overlord)
- Egyptian collar

Accessories
- Holster + gun belt (cowboy, sheriff, spy), bandolier
- Backpacks (firefighter, sidekick), quiver (Robin Hood), sword on the back (swordfighter)
- Sheriff star and police badge, cross necklace (nun), tool belt (Otto)

Lower bodies
- Mermaid tail, ghost sheet / wisp, hooved legs (goatman, minotaur, Krampus, demon), paw legs (werewolf, rabbit)

### 4b. Covered by the MakeHuman packs (do NOT make on Meshy unless the render check fails)

- Hats: wizard hat, witch hat, chef hat, Santa hat, top hat, bowler, trilby, flat/newsboy cap, patrol cap, beanie,
  veil (charity veil, may suit the nun), helmets (motorcycle, skull, warrior, Corinthian, templar knight, M1, horned
  viking, pith, leather, bicycle, riding)
- Masks: hero masks + hoods (domino mask), bandana mask (gangster), plague doctor, gas mask, medical mask
- Glasses + goggles (machine elves), gloves (hero, MMA, long), wireless headset (conspiracy theorist headphones)
- Horns: demon, faun (goat-like), minotaur, longhorn, gazelle, antlers, unicorn horn
- Wings: dragon, butterfly, dragonfly, fairy/moth, bone wings; tails: devil spade, cat/tigra, fluffy
- Ears + heads: cat, bunny, canine, feline ears; bear, cat, lion, tiger, wolf, dog, rabbit, cow, donkey, horse heads
- Beards: full, viking, scruffy, faun, moustaches (long white wizard beard / Santa beard may still be needed)
- Weapons and props: bow, sword, dagger, war hammer, sceptre, pistols/rifles, guitar, microphone, stethoscope,
  suitcase, tactical vest, scuba rig
- Soft clothes are all row 11 / row 12 (packs or Claude in Blender), never Meshy.
- **Render check on the MPFB bodies (2026-11-01, row 11; sheets in project files mpfb2-bodies/in-game/pack_wear_*.jpg):
  WORK** — wizard, witch, chef, top hat, bowler, trilby, patrol cap, Santa cap, motorcycle / skull / templar / horned /
  M1 helmets, plague doctor, gas mask, hero mask, bandana, headset, goggles, full + viking beards, MMA gloves, war hammer,
  sword, AKM; faun, minotaur, demon, longhorn, gazelle, unicorn horns, deer antlers; devil, tigra, cat, fluffy tails;
  dragon, butterfly, bone, fairy/moth, dragonfly wings. **NOT IN THE CLOTHING PACKS** — the cat/bunny/canine/feline
  ears and the animal heads (they are in animal01-04 / ears01, not baked yet), so they stay unconfirmed.

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
- 2026-11-01 — row 14d (classic MPFB shoulders / wrists fix) and 21b (idle face) DONE.
