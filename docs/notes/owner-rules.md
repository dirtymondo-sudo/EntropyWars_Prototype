# MONDO'S RULES — the standing rules of the game's owner

mondo owns the game and decides its design. These rules came out of his own words over many weeks and used to live
only in his Claude project's memory. They hold for EVERY developer and every Claude account that works on this repo.
Where a line names a PR, that PR is where the rule was built. The dated memory files behind each rule are in
`docs/project-memory/` (start with `INDEX.md`; grep it by topic).

If a rule here and mondo's newest word disagree, his newest word wins. Then fix this file in the same PR.

## 1. Hard rules

- **Never delete content he didn't name.** If your diagnosis disagrees with his, re-investigate before arguing.
- **Never remove a broken setting: make it work.** Never swap a site's board for another.
- **Never invent game rules, characters, names or puzzles.** Story characters already have notes and models: search first
  (DOOR_MASTER.md, DOOR_STORY.md, NEW_CHARACTERS.md, MODEL_LIST.md).
- **Fix everywhere.** A fix lands in every place the thing shows: creator, board, HQ, team room, dock, editor.
  "Fix for all spells" means audit every spell.
- **Rebuilt areas replace their old rooms** (11-15). When a plot-built area ships, retire or delete its old rooms in the
  same change (data.js `DOOR_HQ.retired`) and point saves, map and doors at the new one.
- **No tests.** No test files, no CI. Proof is a real browser picture of the real game, and every setting is proven on
  screen. Browser runs and screenshots are allowed without asking for anything visual (mondo 11-15); no browser run for
  non-visual changes, and a full match playtest only when he asks (CLAUDE.md RULE #1c).
- **Never rebake or repaint his textures.** Never use AI-made logos: the official DOOR logo is his files in
  `Assets/ui/brand/door_logo/`.
- **Art sources.** Reuse what is on R2 first (MODEL_LIST.md, `node list-models.js --r2`, packs first). Never generate or
  download art, except Meshy pieces he approved. No SFX generation. Character bodies are MPFB2 only. CC0 / CC-BY is fine.
  Buildings are walk-in architecture, not single Meshy props.
- **Never delete his IndexedDB / local saves from code**, and never reset the AI's trained weights.
- **Balance:** stats first; never remove a spell.

## 2. The world

- **Zones, no open world.** DOOR HQ is the hub; zones sit behind doors. The zone names, word for word: DOOR HQ, The Woods,
  Fairy Forest, Camelot Kingdom, Disaster City, The Beach, The Desert, The Sewers, The Estate, The D.U.M.B., Atlantis,
  The Deep, Outer Space, Heaven + Hell + Vatican, The Cavern, Leylines. H-Wing = the backrooms.
- **World vision (11-15).** The world is a parody of the real world; each area is the ULTIMATE form of its idea. DOOR HQ
  is the subconscious. Every area is plot-built (12x12 plots, districts) like Disaster City; only DOOR HQ stays handmade.
  Cyberpunk City is a future reskin of the WHOLE Disaster City, not a district. The Desert = Western Town + Giza + Area 51.
- **Disaster City** (`site_prebuilt_downtown_streets`, 144 plots): the ocean stays by Bayside + the Beach; the other map
  edges may change. PvP Downtown keeps the old board. Notes: `areas-complexes.md`.
- **Place names are plain and cheap (11-16).** mondo: "just call them woods 1 2 and 3 for all I care ... we are just trying to build the areas right now ... simple
  names instead of ... deep ai slop psuedointellectual names ... that im just gonna have to rename later". Name a plot for what stands there ("The Rocks", "The Dry
  Creek"); never spend a question to him on a name while an area is being built.
- **More NPCs** (11-16: "Disaster city feels dead right now. There need to be more NPCs"; this replaces the old "fewer NPCs"), none
  blocking a path. No followers. Units are named after their race. No factions. The NPC spawn system: `npc-system.md`.

## 3. Visuals

- Bloom and fog OFF by default. Real lights. No placeholder geometry, no procedural stairs, no grass blades.
  Generated shapes are always textured. PS1-style window UI.
- **Squares:** one tile per square; battle squares are 3.5 m ("2x everywhere"; 1.75 m is the old tile and the texture
  tile). Heights step one square per block. Textures are sized in metres.
- **Gold:** never the old flat gold texture; use the better gold.
- **Trees** stand only on grass, dirt, sand or in planters, never on concrete.
- **Prop placement (all interiors too):** barriers and blockers snap centred on whole 3.5 m squares, and multi-square
  pieces fill whole squares. Walkways are whole cells wide, nothing half across two cells. Cosmetic decor sits OFF
  centre, placed freely. Plot borders are creative mixed edges.
- **Buildings:** each one unique, purposeful and recognizable, with varied materials and real geometry. Interiors get
  working swinging doors like DOOR HQ. Big windows, but ground floors are not all window. He likes dark glass.
- Terrain: cliffs `rocks_5` (`cliff.png` is banned), lawns `grass_2`, forest floor `grass_dark_fantasy` / `dirt_2`.
  Most trees are the retro pixel trees. Nexus and spawn zones paint on the ground, never on bridge decks.
- **Gore** ("Mortal Kombat"): hits spray blood away from the attacker and stain the floor for the match; crits throw
  chunks; a kill is a gore burst with a pool and a shake. Four shared death clips. Graves survive a respawn.
- **VFX** follow the Riot VFX style guide: own side cyan-blue, enemy pink-orange. Never hide the caster, target, hit or
  number. Basic attacks never use the fist sprite. A unit turns to face its target. EXECUTED shows only on a kill.

## 4. Combat rules he set

- **AP:** a damaging spell and a basic attack cost 1 AP. Every extra AP source pays 16 Entropy gauge. Super effective,
  element weak, combo and crit each give +2 AP once per hit and turn; each resist takes 1; absorb / immune block the refund.
- **Status:** lasts until the caster's next turn ends. A killing hit applies no status. 0 HP = down. Charm: can't move but
  acts. Minimized: -2 ATK + 25% dodge. Marked: the next physical hit. Move-spells are blocked while Rooted, Charmed,
  Roped or Frozen. Possessed stays on its own team. Blind cuts own vision only.
- **Elements:** Frozen never stuns. Ice + heat = water. Water and rain put out fire. Liquid fills AoE squares, runs
  downhill and fills holes. Reactions R1-R16 (`champions-combat.md`).
- **Forced movement** is one shared system (push, pull, knockback, fling, slide, ice, bombs, tornado). Airborne units skip
  traps and bombs. The preview draws the whole chain. A push with no picked direction goes straight away from the caster.
- No self-combo. Own summons are never hit by own spells. Jump is 1-3. Never write "armour".
- Celestial arrives round 4, then every 5. The Nexus bar is 8. Preview tiles are green / red. Auto tactics turns off
  with one click. Day / night runs on a clock.

## 5. UI and input

- **Text cut off is a high-priority bug.** No sideways scrolling.
- Panels are black with a white outline. BACK is red, CONFIRM is green. One battle panel. Default theme "My Theme 3".
  Battle portraits face straight on. The party builder holds one of each unit.
- HUD: minimal, bare icons. Turn order portraits left, AP right. The action menu shows only when usable and hides for a
  whole action's animation. The combat log sits on the right, collapsible, hidden during animations.
- **Back keys (11-15):** Escape closes what is open. E leaves what E opened. Right click is the universal back button.
  Every new menu, panel or dialogue box obeys all three.
- The UI Maker (end of hud.js) themes every screen: extend it, never rebuild it (`ui-menus-audio.md` "THE UI MAKER").
- The map editor can place every model in MODEL_LIST.md.

## 6. Camera

- Persona 5 is the reference. The menu camera frames unit + target in the screen area the menus leave free. A basic
  attack gets a slight push-in, never a spin. No far zoom-outs. After a death close-up it glides, it does not cut.
- The action camera is ON by default.
- **The spell shot grammar** (he approved it 11-10; code in battle.js "THE SHOT GRAMMAR", notes in `spells-vfx.md`):
  four shots only (cast, hit, follow, reveal); cut OR move, never both; a shot opens with a cut; cut on the release and
  land on the impact; hold the hit for at least 1 s; a kill keeps the close-up; cuts at least 0.5 s apart; the 180° rule;
  one cut back home. Shared code only, never per-spell hacks.

## 7. Story

- The first quest: DOOR HQ, Room 64, Tape 1 + 2, the portal, Catgirl chased by two Shadow Entities, the fight in the
  Training Room, escort Catgirl to Rhonda (reception), Kit joins, "Walk to your office". The team is the Door Agent,
  Agent Locke and Catgirl. Notes: `story-party-progression.md`.
- Cutscene lines are his words: bake his Cutscene Editor export with `node bake-cutscenes.js`, never rewrite them.
- Unit remakes: creator clothes first, Meshy only for missing pieces, no weapons in outfits, female units as attractive
  as the originals (`meshy-remake-plan.md`).

## 8. Working with mondo

- He reads short, plain answers. Lead with the result. Own mistakes in one line.
- **Check before you claim.** Never say a fix is in the game until the live R2 files match main (CLAUDE.md RULE #1).
- Design work on UI, HUD, VFX, camera or maps: a plan and a mock-up first, then WAIT for his explicit OK.
- UI work without an on-screen proof picture gets sent back.
- He tests on Firefox on an M1 Mac (it renders brighter than the cloud browser) and plays keyboard-first. A friend plays
  online on a weak Chrome PC, so performance on weak machines matters.
- Never tell him to redeploy on Render: it deploys itself from main. If it sticks, the cause is a hung "Building" row in
  the Render dashboard, which only the dashboard owner can cancel.
- The goal right now: a PvP-only demo, plus polish on the first quest (the "vertical slice") and its cutscenes.
