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
- **THE MODEL LIST FIRST (mondo 11-16, after a graveyard was built without the game's own corpses, body parts and coffins: "every thread working
  on a district needs to know it needs to look at the model list").** Before you build or dress ANY room, district or zone: open `MODEL_LIST.md`
  and search it for your theme (every word a player would use for the place), read the sections of every pack that fits, and list the pieces of
  the pack FILES themselves (a pack file often holds more pieces than the prop catalogue has rows: section 7e, `node list-models.js --r2`). A
  piece with no catalogue row gets one (then `node list-models.js`). "The catalogue had nothing" is never a reason: the catalogue is not the list.
- **Art sources.** Reuse what is on R2 first (MODEL_LIST.md, `node list-models.js --r2`, packs first). Never generate or
  download art, except Meshy pieces he approved. No SFX generation. Character bodies are MPFB2 only. CC0 / CC-BY is fine.
  Buildings are walk-in architecture, not single Meshy props.
- **Never delete his IndexedDB / local saves from code**, and never reset the AI's trained weights.
- **Balance:** stats first; never remove a spell.

## 2. The world

- **Zones, no open world.** DOOR HQ is the hub; zones sit behind doors. The zone names, word for word: DOOR HQ, The Woods,
  Fairy Forest, Came A Lot Kingdom (was Camelot Kingdom; see the renames below), Disaster City, The Beach, The Desert, The Sewers, The Estate, The D.U.M.B., Atlantis,
  The Deep, Outer Space, Heaven + Hell + Vatican, The Cavern, Leylines. H-Wing = the backrooms.
- **THE DOORS (11-18, the door audit; the full list is `world-layout.md` "THE DOOR AUDIT").** One World is walked: roads, trails, boats,
  stairs and wells down to what lies underneath; no door jumps across the map. DOOR HQ has three public ways out (the Stair to the Woods, the
  Taxi to Disaster City, the Subway) and a few secrets. **No bay doors** ("they just look like random doors in the middle of areas ... you
  don't have to work for them"), and nothing is earned by stabilizing a site. **A secret or shortcut is hard to find or mundane**: "a random
  janitor's closet down a sideway in a building, or a random bathroom in a building, or down a small side trail that wouldn't get noticed at
  first glance, or somewhere where it is hard to reach vertically or at the end of a maze"; never a free-standing framed door out in the open.
  A new way between two places needs his OK and a row in data.js beside `DOOR_HQ.cut`'s rules.
- **THE PARODY RENAMES (11-18, mondo: "to avoid copyright and because i think it's funny").** On screen the Men in Black are the
  **Men in Slacks** (one: Man in Slacks) and Camelot is **Came A Lot** (Came A Lot Kingdom, Came A Lot Castle, Walls of Came A Lot).
  Display text only: the race id stays `'men in black'` and every room id stays `site_prebuilt_camelot_*`, so saves, plots and
  marker comments (`CAMELOT-KINGDOM-BEGIN`) are unchanged. New player-visible text uses the new names.
- **World vision (11-15).** The world is a parody of the real world; each area is the ULTIMATE form of its idea. DOOR HQ
  is the subconscious. Every area is plot-built (12x12 plots, districts) like Disaster City; only DOOR HQ stays handmade.
  Cyberpunk City is a future reskin of the WHOLE Disaster City, not a district. The Desert = Western Town + Giza + Area 51.
- **Disaster City** (`site_prebuilt_downtown_streets`, 144 plots + the Hollywood Hills on its north side, one room: "the whole point is to be able
  to look over the city", 11-16): the ocean stays by Bayside + the Beach; the other map
  edges may change. PvP Downtown keeps the old board. Notes: `areas-complexes.md`.
- **Place names are plain and cheap (11-16).** mondo: "just call them woods 1 2 and 3 for all I care ... we are just trying to build the areas right now ... simple
  names instead of ... deep ai slop psuedointellectual names ... that im just gonna have to rename later". Name a plot for what stands there ("The Rocks", "The Dry
  Creek"); never spend a question to him on a name while an area is being built.
- **NPC counts depend on the space** (mondo 11-16: "the fewer npcs rule was meant for small indoor rooms, not for big outdoor
  spaces"): FEWER NPCs in small indoor rooms; MORE are wanted in big outdoor spaces ("Disaster city feels dead right now. There need
  to be more NPCs"). **Outdoor areas show 20 bodies, the nearest to the player, and a race may stand more than once** (11-18: "raise the body cap, I thought
  it was 20 anyway? and there is no one per race rule, there are already multiple of the same units in disaster city"; `npc-system.md`). None ever blocking a path. No followers. **NPC behaviour is the same on every machine** (11-17: "if you have a bad pc
then tough shit. The player experience should be the same"): no weak-PC cut may change who sees you or who fights. Units are named after their race. No factions. The NPC spawn system: `npc-system.md`.

## 3. Visuals

- Bloom and fog OFF by default. Real lights. No placeholder geometry, no procedural stairs, no grass blades.
  Generated shapes are always textured. PS1-style window UI.
- **Squares:** one tile per square; battle squares are 3.5 m ("2x everywhere"; 1.75 m is the old tile and the texture
  tile). Heights step one square per block. Textures are sized in metres.
- **Gold:** never the old flat gold texture; use the better gold.
- **Smoke is never modelled in 3D** (11-16: "don't 3d model smoke, it looks terrible"). **Torches are variants of the torches already in
  the game** (`cave_torch`, `wall_torch`, the taller `tiki_torch`), never drawn stand-ins. **A model never stands cut off by water or
  ground**: tentacles are the symbiote's black spell tendrils (the catalogue's `goo_tendril`, as in the Sewers' sludge and the Beach's sea), never the Meshy kraken arm models (`tentacle`, `tentacle2`: "messed up").
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
- **Every lost fight costs money** (11-17: "every loss should lose you money"). Story fights, quest fights too: 8 gold x the strongest
  enemy's level, never more than held; a retreat costs nothing. BUILT 11-18 (NPC encounters step 4: data.js `hqNpcLossGold`,
  `HQ_NPC_TEMPERS.lossGoldPerLevel`; battle.js the encounter commit). The party is still healed after a loss.
- **NPCs start fights** (11-17/18, replaces "never random"): Brutes at sight, a Territorial after its warning, muggers (a flat chance per
  game day, PAY or FIGHT). Never one 8 or more levels under the party, never in DOOR HQ, a cutscene or online (`npc-system.md` "NPC-STARTED FIGHTS").
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
- **He cannot see the repo's files** (11-17: "if you need my answer or approval of something then you need to send it in chat, i cant see the plan"): put every question, table, line or picture that needs his OK in the chat itself, in full; a path to a doc is not asking him.
- **Check before you claim.** Never say a fix is in the game until the live R2 files match main (CLAUDE.md RULE #1).
- Design work on UI, HUD, VFX, camera or maps: a plan and a mock-up first, then WAIT for his explicit OK.
- UI work without an on-screen proof picture gets sent back.
- He tests on Firefox on an M1 Mac (it renders brighter than the cloud browser) and plays keyboard-first. A friend plays
  online on a weak Chrome PC, so performance on weak machines matters.
- Never tell him to redeploy on Render: it deploys itself from main. If it sticks, the cause is a hung "Building" row in
  the Render dashboard, which only the dashboard owner can cancel.
- The goal right now: a PvP-only demo, plus polish on the first quest (the "vertical slice") and its cutscenes.
