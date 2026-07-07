# Terrain & Spell Mechanics Overhaul — Phased Plan (2026-07-07)

Distilled from the ChatGPT design notes + user priorities. Goal: make the
battlefield itself a weapon/resource ("tactical terraforming") while building
ON TOP of what already exists — never parallel systems. Everything below reuses
the voxel column grid (`state.boardColumns`), the `terrainCreate`/`bomb`
spell-kind plumbing, the element→terrain reaction system, and the team `lumber`
resource seed.

**User's stated priorities** (from the request):
1A. Readable previews for terrain spells — understand any click in 2 seconds; calm the loud highlights.
1. Water that flows/sinks; more spell↔terrain interplay; units crashing through blocks.
2. Minecraft-style block placing + salvaging materials from destruction.
3. Trap spells beyond Place Bomb.
4. Prebuilt voxel structures (bridge, tower, fortress, stairs).
5. Official weight & height per race, used in calculations.

Explicitly NOT in scope (rejected or deferred from the notes): full fluid
simulation, block support/collapse-chain physics, undo-for-movement (exists via
turn undo), accuracy/hit-chance previews (damage is deterministic), climbing
vines, invisible air bridges, enemy AI building fortifications (AI gets scoring
for the new kinds, not new strategic behaviors).

---

## Phase 1 — Terrain-spell preview overhaul (`three-renderer.js`, `ui.js`, `battle.js`)

**Ghost blocks.** New renderer API `showTerrainGhost(changes)` / `clearTerrainGhost()`:
translucent voxel boxes with crisp edge lines at every tile a terrain spell will
change. `raise` = stacked cyan ghost boxes at the exact new height; `lower` =
red-tinted volume marking what gets carved away; `paint` = flat tinted decal in
the terrain family's color (water blue, fire orange, ice pale, poison green).
Driven by a new pure function `predictTerrainSpellChanges(unit, spell, tx, ty)`
in battle.js that mirrors the real handlers (`terrainCreate`, `terrainDeform`,
`placeBlock`, `buildStructure`, reshape) — the preview and the execution share
the same footprint math so they can never disagree.

**Calmer highlights.** In `_hlFragmentShader`: base fill 0.55→0.34, the
wash-toward-white `mix(..., 0.75)` cap →0.45, pulse amplitude halved. Range
overlay pulse floor 0.4→0.7 (less throb). AoE previews for terrain spells stop
being generic red — they use the terrain family color, so "what will this do"
is answered by color alone.

## Phase 2 — Material identity + salvage economy (`battle.js`, `hud.js`)

- `getTerrainMaterial(terrain)` classifier: wood / stone / metal / crystal / ice
  families over the EXISTING terrain keys (wood_planks, cobblestone, metal,
  crystal, ice, bricks…). No new textures needed.
- Per-team bank `state.matBank = {1:{wood,stone,metal}, 2:{…}}` (small starting
  stock so build spells work turn 1). `gainMaterial` / `spendMaterials` /
  `getMaterials` on `GAME`. `state.lumber` (Harvester) stays untouched.
- Salvage: chop tree → +1 wood (on top of existing lumber); smash a raised
  column → its material (stone default); destroy a building → +2 stone +1 metal;
  kill a turret → +2 metal. Logged with running totals.
- `canAffordSpell` gains a material gate; HUD spell rows show "Need 1 Stone".
- New element reactions (extends the lightning/water system):
  - ⚡ **lightning + metal**: conducts across the connected metal-family surface,
    zapping every unit standing on it (mirror of water conduction) → "build a
    steel tower, call lightning onto it".
  - 💥 **fire/lightning + crystal**: connected crystal shatters (→ rubble) and
    deals burst damage to units on/adjacent.

## Phase 3 — Block building + crash-through + water settle (`battle.js`, `data.js`)

- New spell kind **`placeBlock`**: place one voxel of a material at range —
  `Timber Block` (1 wood, Harvester), `Stone Block` (1 stone, Engineer),
  `Steel Block` (1 metal, Engineer). Stacks +1 on land (lifting any occupant —
  raise a pillar under your sniper), or converts a water surface into a stepping
  stone. Steel conducts (phase 2), timber burns, stone is durable.
- **Crash-through**: pushed/knocked-back units now SMASH through weak 1-high
  lips instead of stopping: trees get felled, wood/ice/crystal blocks shatter,
  the unit takes small crash damage and keeps flying. (Weight-gated in phase 6.)
- **Water settles**: whenever ground is lowered (fissure, tremor trap, smash,
  reshape, crash-through) next to standing water, the water floods the lowered
  tiles (deep water if 2+ below the surface). Dig a trench beside a lake → moat;
  then electrify it.

## Phase 4 — Prebuilt structure spells (`data.js`, `battle.js`, `ai.js`)

`STRUCTURE_TEMPLATES` + new spell kind **`buildStructure`** (oriented by
caster→target direction, footprint shown as ghost blocks before the click):
- **Field Bridge** (2 wood, Engineer): 4-tile deck at the caster's height across
  water/chasm.
- **Watchtower** (2 stone, Engineer): +2 tower with a +1 step, top is
  `mountain_top` (existing +1 range bonus) → instant sniper nest.
- **Timber Steps** (1 wood, Harvester/Engineer): +1/+2 staircase to reach high
  ground.
- **Bulwark Ring** (4 stone, Engineer, cooldown): 8-tile +2 stone ring around a
  point — box in a boss, shield a flag carrier. Enemies counter with smash /
  jump / their own blocks.
- A shared race variant (`sharedBulwarkRing`-style) for a few earth-flavored
  races (golem, giant, minotaur).

## Phase 5 — Trap arsenal (`data.js`, `battle.js`, `sprites.js`, `three-renderer.js`, `ai.js`)

New kind **`placeTrap`** + `state.traps`, reusing the bomb/warp-rune step
triggers (enemy steps on it; airborne immune; owner-only sigil decal rendered
like warp runes, inline-SVG so no asset uploads):
- **Snare Trap** (Agent/Harvester): damage + `root` 2 — hold ground, protect flags.
- **Frost Mine** (Black Mage + icy races): damage + stun + paints the 3×3 to ice
  (combos: shatter / slide / melt).
- **Tremor Charge** (Engineer): drops the ground −2 under the victim — fall
  damage + a pit (+ water settle if beside water = instant moat trap).
- **Magnet Mine** (tech races): shock + yanks everything within 2 tiles toward
  the mine (cluster them, then AoE).

## Phase 6 — Official race physique (`data.js`, `battle.js`, `state.js`, `hud.js`)

`RACE_PHYSIQUE`: every one of the 95 races gets canonical `height (m)` and
`weight (kg)`, shown in the inspect panel. Weight class derives from kg
(feather &lt; 30 ≤ light &lt; 80 ≤ medium &lt; 250 ≤ heavy &lt; 1000 ≤ colossal) and feeds:
- **Push/pull physics**: feather units fly +1 tile further; heavy −1; colossal
  units cannot be displaced at all.
- **Fall damage**: ×0.5 feather / ×0.75 light / ×1.0 medium / ×1.25 heavy /
  ×1.5 colossal (flyers still immune).
- **Crash-through**: heavier units break through more (colossal even through
  stone lips); feather units bounce off instead of breaking anything.

## Delivery & verification

Per repo rules: edit files in place, `node --check` every JS, bump the `?v=`
token in index.html, hand ALL edited files + index.html over in chat in one
message. AI support = scoring/target-picker branches in ai.js for the new kinds
(`placeBlock`, `buildStructure`, `placeTrap`) so the CPU actually uses them.
No playtest run unless requested.
