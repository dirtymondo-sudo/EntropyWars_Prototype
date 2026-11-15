# Tile info panel: plan (approved 2026-11-08: "Build it, open on the top thing"; built)

Mockup: `tile_info_panel_mockup.jpg` (and `.html`) in this folder. Asked 2026-11-08 in the "Plan tile info panel for terrain and objects" thread.

## What it is
Clicking a square opens a card built like the unit info panel (hud.js `_hrlgQuickCard`, the `.hrlg-thead.qp` grid), on top of today's quick action list.

**Terrain card** (the unit card's slots, reused):
- Portrait slot: the square's ground picture, one sheet tile per square (the board's density), drawn pixelated.
- Name slot: the terrain name + its coordinate.
- Vitals slot: height, squares away, and for a spell-made square "⏳ <map's own terrain> again in N rounds".
- Stats: MOVE COST and HEALING always, plus whichever the terrain has: DEF / RNG / VIS bonus, SLIDES, BLOCKS SHOTS, FLYERS ONLY.
- Status row: the effect badges (statuses it gives, HP/MP per turn end, the ×1.25 element boost, catches fire / puts out fire, zones and fire on it).
- New row: the small buttons.

**Object card** (Cube, turret / summon / zombie, standing door, deployed object, seed, grown tree, tree, prism, map object): its own sprite, its name with a YOURS / ENEMY chip, the HP or hits bar, its own numbers (range, damage), and its spell's status badges (the same badges as its spell row). Buttons: ATTACK or CHOP (with the ↳ MOVE and ENDS TURN tags they have today) plus INSPECT.

**Unit**: today's unit info panel, unchanged.

**Description bar** (the existing one under the menu): it shows the active tab's full sentence, built from the rules (no flavour text). The card stays compact and no words get squeezed.

## Tabs (mondo's question): the recommended rule
- Plain ground: no tabs.
- Something on the square: tabs run left to right from the ground up: TERRAIN · OBJECT · UNIT. A flyer over a turret gets 3 tabs.
- **It opens on the top thing**, the one you clicked to act on. Soft things (walkable forest, an open standing door) open on TERRAIN, which is today's rule for them (`objInfo.soft`).
- A tab swaps only the card and its button row. The spell / item rows underneath stay the same, because they hit the square either way. When a unit is on the square, its list stays today's unit list.
- To switch tabs: click a tab, press `[` / `]` (the victory screen's tab keys), or use D-pad ←/→ on a pad (the Horologe doesn't use menuLeft / menuRight yet).

## Buttons vs rows
- **Small buttons:** Move here, Move towards, Jump here, Take Off + Move, Climb / Move + climb, Inspect (stays gold, TILE_INSPECT_GOLD), Ward, Channel, Dig, Place block. On the object tab: Attack / Chop.
- **These stay full rows:** spells (badges, MP, power, AoE hover preview, approach ghost) and Place Capture Door (an item use).
- Each button is still a blade under the hood: the same `fire` / `hoverIn` / `hoverOut` (move arrow, slide preview, approach ghost), the same AP pips, ENDS TURN and ↳ MOVE tags, and the same cursor order (keyboard, wheel and pad step through the buttons, then the rows). An unavailable button is greyed, with its reason on a second line. The drop damage in "Move here (−24 HP)" becomes a red chip on the button.
- With Move / Inspect / Jump moved up into the button row, the spell rows lead the list.

## Data sources (no new rules, no second copy of a rule)
- Ground: `getTerrainAt`, or `getTerrainAt3D` / `getBlockAt` for the clicked level (bridges, roofs, floors), then `TERRAIN_RULES[key]`.
- Picture: a new `ThreeRenderer.tileSwatch(x, y, z)` returns the sheet + tint the board actually drew there (`getTerrainTexture` / `_ewSandUrl`, the map's `tints`, the HQ room sheets via `_hqSheetLook`). The fallback is `TERRAIN_SPRITES[key][0]`. Liquid runoff (`getLiquidFlowAt`) is drawn over it the way the board draws it.
- Effects: one battle.js `tileEffectsAt(unit, x, y, z)` that only reads what the engine already uses:
  - TERRAIN_RULES fields: moveCost, healMultiplier, enterStatus, slide, reducesVision, visionBonus, rangeBonus, defBonus, blocksRanged, flyingOnly.
  - The turn-end outcomes: lava → BURN (it grows), deep water → DROWNING, Black Ooze → GOO, Plague Flesh → POISON, Poison Bog −12 HP, Healing Spring +HP, Crystal +MP. Water → WET on landing and at every round end (`_isWetTile`, `tickWetUnits`).
  - The numbers inside those `endTurn` functions move into fields on the same row (for example `tickDamage: 12`). `endTurn` then reads them, so the card and the rule share one number. This is not a rule change.
  - `ELEMENT_TERRAINS` (×`ELEMENT_TERRAIN_MULT`), `_FLAMMABLE_TERRAIN` / `_tileSmothersFire`, `state.burningTiles`, `predictZoneStatusesAt` (spell zones), `predictMoveHazardDamage`, `terrainTimerAt`.
  - Numbers are for the unit whose turn it is, the same as the move ghost. A unit that shrugs an effect off (flyer, adapted, immune) sees that chip struck through.
- Object: `_tileQuickObjectInfo` (it already gives name, HP and desc) plus the object's sprite (sprites.js TURRET_* / seed / keg / bomb / torch URLs, OBJECT_SPRITES for map trees). `_hrlgStatusBadges(sp)` gives its spell's badges.

## Text fit (cut-off is high priority)
- Name, tab labels and button labels use `ewFitLine` (shrink to fit), never an ellipsis. This also fixes today's "POISO…" (`.hrlg-view-tab-text` has `text-overflow: ellipsis`).
- Badges and buttons wrap onto another row and the card grows down. No sideways scroll ever.
- Long words go in the description bar, which wraps.

## UI Maker
- The terrain / object card uses the **Unit info panel** piece (`quick`), so it gets the same spot, size and skins, and his p_entropy theme lands with no new setting. Every info card pops up in one place.
- New card parts in `QP_PARTS`: Tabs, Facts, Effects, Buttons. They move, size and hide like the existing parts. Tabs and buttons wear the Button / Selected skins.
- A `UIM_SPECIMENS` stand-in (a Poison Bog card) so it can be laid out without a match.
- If he wants the tile card somewhere other than the unit card, it can get a separate Layout piece. Only on his word.

## Where it applies (fix everywhere)
Every board that opens the Horologe tile menu: VS CPU, online host + guest, field fights in the explored room, HQ sites + arenas, training, holo sim, tutorial. In the editors a click paints, so they get no card (a hover card there would be a separate ask). The tutorial's Keys line ("click a tile within reach, choose INSPECT") stays true.

## Online + fog
The card is viewer-local and nothing is relayed: the guest reads its own snapshot, which already carries burningTiles, terrainTimers and liquidSprings wholesale (online.js `_REPLACE_WHOLESALE`). Object and unit tabs only show for things the viewer can see (`_isTileVisibleToViewer`). An enemy decoy still reads as the unit it fakes. Hidden enemy traps never show. Your own traps show as an effect chip.

## Build (one PR after his OK)
- hud.js: card, tabs, button row, CSS, UI Maker parts + stand-in.
- battle.js: `tileEffectsAt`.
- data.js: the `endTurn` numbers become fields on their rows.
- three-renderer.js: `tileSwatch`.
- index.html: the `?v=` bump.
- No new files.
- Proof in a real match: Poison Bog, lava, water, ice, burning grass, a zone, turret, Cube, forest, a flyer over a turret, and the online guest.

## Poison Bog (decided)
mondo 2026-11-08: "yes of course poison bog should give poison". Ending a turn in the bog now gives the real POISON status for 2 rounds (flyers and poison-proof bodies are spared), in place of the old flat 12 HP hit. The card shows the POISON badge.
