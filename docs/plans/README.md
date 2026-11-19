# docs/plans — recent plan documents (copied from the owner's project files, 2026-11-15)

These were written in the owner's Claude project and lived outside the repo. They are copied here so any account can
read them. PROPOSALS are not approved until the owner says so; check the matching `docs/notes/` file and
`docs/project-memory/` for his answers before building anything.

## The world and its zones
| File | What it is |
|---|---|
| `../../ZONES_PLAN.md` | The plan of record: DOOR HQ + zones behind doors (its §12 is the log). |
| `world-areas/world-areas-proposal.md` | The world as plot-built areas (14 areas, every unit given a home). Revision 2 holds the owner's answers. The Woods pilot plans sit beside it. |
| `world-zones/zone-layout-proposals.md` | Plot layouts for the 11 zones not yet built + the whole-world map (`world_layout.png`). One `<zone>-layout.json` + `<zone>_plot_plan.png` per zone, the Mountains included. |
| `other/zones-and-rooms.md` | Every zone and the rooms it holds today. |
| `world-polish/PLAN.md` | THE WORLD POLISH PLAN (2026-11-19, a proposal): the audit of every zone, district and plot (too small / cramped / flat / bare), the verticality pass, the order of work. `audit.js` measures the world again; `AUDIT_DATA.md`, `plots.csv`, `need-map.svg` are its tables. |
| `../areas/<woods, camelot, desert>/layout.json` | The built plot areas (baked by `bake-woods.js`, `bake-camelot.js`, `bake-desert.js`). |

## Disaster City
| File | What it is |
|---|---|
| `../disaster-city/plan-design.md`, `plan-direction.md` | The owner's 144-plot plan (nine districts, 216 buildings, the Bayside opening). |
| `../disaster-city/city-layout.json`, `move.js`, `pack-claims.md`, `districts/` | The built city: layout, the district move, who claimed which pack pieces, one file per district. |
| `disaster-city/plan_map_144.jpg` | The 144-plot plan as one picture. |
| `disaster-city/city_built_map.jpg`, `city_relayout_plan.jpg`, `city_roads_joined.jpg`, `levels-proposed.json` | The district re-layout (coast = Entertainment, Bayside, Industrial; Southside in the south). |
| `disaster-city/traffic_plan_map.jpg` | The traffic plan. |
| `disaster-city/residents-plan.md`, `bedrooms-brief.md` | Who lives where, and the bedroom interiors brief. |
| `../notes/areas-complexes.md` | The build log: "DISASTER CITY, THE 144 PLOTS", "THE DISTRICT MOVE". |
| `../PLOT_DUNGEONS_PLAN.md` | The plot dungeons. |

## NPCs
| File | What it is |
|---|---|
| `npc-encounters/HANDOFF.md` | READ FIRST for any NPC encounters work (2026-11-17): where it stands, what is live, mondo's decisions, what waits for him, the next steps. |
| `npc-encounters/PLAN.md` | NPC ENCOUNTERS (2026-11-17): mondo's concept fitted to the game: tempers per race, the strike ladder, awareness, offers, NPC escape, onlookers, joining fights; built / partly / new per part, a Fable or Opus pick per step, 18 open questions. His original: `npc-encounters/concept-v0.3.md`. Sits on top of `../notes/npc-system.md`. |
| `npc-encounters/REVIEW.md` | The review of that plan (2026-11-17): step 0's findings in code, the critique from the player's side, a changed build order (Bayside first), 12 questions for mondo. |
| `npc-encounters/STEP-1A.md` | STEP 1A (2026-11-17), design only, for mondo to mark up: Bayside's seven units with a temper, their groups, the room mix, 9 spoken lines, the three marks over a head (mock-up pictures `step-1a-marks-*`), what a lost fight costs, 7 questions. Nothing is built before his marks. |
| `npc-encounters/RACE-HOMES.md` | EVERY RACE AND WHERE IT LIVES (2026-11-17), for mondo to mark up: all 157 races, the written home, where the game places each today, which 22 are placed nowhere. Made after he found the Bayside list wrong. |

## Quests, story, cutscenes
| File | What it is |
|---|---|
| `../notes/story-party-progression.md` "THE QUESTS" | The quest system and the first quest as built (data.js `STORY_QUESTS`). A new quest is a data row. |
| Same file, "THE CUTSCENE EDITOR" | The cutscene editor and `bake-cutscenes.js`. |
| `../../DOOR_MASTER.md`, `DOOR_STORY.md` | The story and world canon. |

## Other recent plans
| File | What it is |
|---|---|
| `../notes/character-models-plan.md`, `meshy-remake-plan.md`, `meshy-remake-batches.md` | Character models and the unit remakes. |
| `other/ELEMENT_REACTIONS_PROPOSALS_20261107.md` | Element reactions R1-R16. |
| `other/GRADES_PROPOSAL.md` | Race grades. |
| `other/PVP_PLAYTEST_REPORT.md` | The 11-09 PvP playtest report. |
| `other/TILE_INFO_PANEL_PLAN.md` | The tile info panel. |
| `other/SPACESHIP_REDESIGN_HANDOFF.md` | The spaceship redesign hand-off. |

## Camelot Kingdom (added 2026-11-15, evening)
| File | What it is |
|---|---|
| `camelot/camelot_plot_plan_3.png`, `camelot-layout-3.json` | Plan 3, approved and built (castle, village, town wall, moat, woods ring). Built source: `../areas/camelot/layout.json` + `bake-camelot.js`. |
| `camelot/camelot_castle_redesign_2.png`, `draw-castle2.py` | Castle redesign 2 (one palace on a two-step hill, centred). A MOCK-UP waiting for the owner's OK; not built. |
| `../notes/areas-complexes.md` "CAMELOT KINGDOM ON PLOTS" | The build log. Still old: Keep upper floors, Undercroft, Sky Castle. |

## The Mountains and The Woods
Both are built. Mountains: `../areas/mountains/layout.json` + `bake-mountains.js`, notes "THE MOUNTAINS ON PLOTS".
Woods: `../areas/woods/layout.json` + `bake-woods.js`, notes "THE WOODS ON PLOTS". What is left on each is listed at the
end of its notes section and in `../project-memory/` (`mountains-plots-20261115.md`, `woods-*`, `camelot-kingdom-plots-20261115.md`).

## Hand-off prompts (2026-11-15)
`HANDOFF_PROMPTS.md`: one ready-to-paste prompt per piece of open work (zones, Disaster City districts, the first
quest cutscenes, frame rate). Pictures they point at: `desert/`, `cutscenes/`, `door-hq/`, `disaster-city/civic-dc/`.
