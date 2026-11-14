# PLOT DUNGEONS — the plan (puzzle dungeon vertical slices, a standalone test build)

*Plan document, 2026-11-14, amended the same day with mondo's answers (§1, §13). Nothing in the game is built yet. Thread "Plan the puzzle dungeon
vertical slices". Copies: repo `docs/PLOT_DUNGEONS_PLAN.md` and `/mnt/project-files/dungeons/PLOT_DUNGEONS_PLAN.md`. Slices 5.1-5.5,
start and solved, on one sheet: `/mnt/project-files/dungeons/boards_start_solved.png`; the other five are drawn in the source packs.*

**Read this first if you are a fresh chat picking this up.** This doc is enough to start. It tells you what mondo asked, what the two
source packs said, what changed to fit Entropy Wars, which files and functions to touch, the phases in order with their checks, and
what is decided. **The direction is approved** (mondo 2026-11-14 09:32 UTC: build all of them so he can test them, go with the
recommendations, naming and wiring into the game are low priority). §13 holds the decisions. Start at Phase 0.

---

## 0. In one paragraph

Ten small puzzle dungeons, every design from mondo's two packs, each a 3 × 3 board of Disaster City-sized plots (42 m, a 12 × 12 battle
board each, 126 m a side). You walk in third person as the officer, work an in-world 3 × 3 model of the board, and whole plots turn or
slide (with you standing on them when the puzzle needs it). A few hold one fixed fight on their own plot, fought on that plot as a normal
exploration battle. **This is a standalone test build, not a mode of its own:** dungeons will later be part of story mode and connect to
it, but for now each one opens on its own from **Settings > Developer > Open Plot Dungeons** so mondo can check that the puzzles play
well. Names, menu wiring, story links and final enemies come later and are low priority. The engine idea is to build each plot as its
own **stage part** (the system that already joins DOOR HQ's wings with no loading card) and move a part by changing its pose at
runtime. Phase 0 proves that before any content is built.

---

## 1. What mondo asked, and the sources

- **His ask (2026-11-14 03:00 UTC, this thread):** "make a plan for how to implement these prototype vertical slice puzzle dungeons as a
  standalone thing from main menu or settings. These plans didnt have the context you do on the plots and districts we just made for
  disaster city and all their rules and layers, so you should make the plan more tailored for entropy wars and the codebase so a fresh
  chat could read the plan and pick it up no problem. But basically review these prototypes and plans and improve upon them and make
  one plan doc combining everything."
- **His answers (2026-11-14 09:32 UTC, this thread):** "We are just testing out the puzzles dungeons right now, they will eventually be in
  the game, but right now i just want to make sure the puzzles play well before wiring them into the game and naming them and all that,
  that stuff is low priority at this stage. Dungeons is not a separate mode, it will be a part of the stoy mode and connect, but right now
  we just need a standalone versions of the dungeon so i can test. I dont want any swaps, just build all of them so i can test them. The
  enemies would just depend on what zone the dungeon is in and who i wanna out in there, once again not a huge priority right now. And
  we are going to put different types of dungones in different places, so dont get attached that this type of dungeon has to have these
  enemies. Basically im saying a lot of your questions are just kinda up in the air and dont matter at this poiint. We are in the building
  and experimenting phase, so just go with your recommended. Amend the doc to reflect all this"
- **Source A**, `dungeon_vertical_slices.pdf` ("PLOT DUNGEONS / VERTICAL SLICE ATLAS", 6 pages). Five slices: 01 ROTATE *The Turning
  Tomb* (catacombs), 02 SLIDE *The Missing Street* (Disaster City), 03 ROUTE *Three Little Worlds* (fairy forest, marbles),
  04 CONNECT *Two to Open* (circuit, two locks), 05 STAGE *The Procession* (catacombs or H-Wing, a guardian moved by a bell).
- **Source B**, `dungeon-district-design-pack.html` ("Five Plot-Based Dungeon Districts", interactive state maps). Five slices:
  1 *Turning Crypt* (catacombs), 2 *Missing Channel* (sewers, slide), 3 *Three-Rail Crossing* (Disaster City, elevated rails),
  4 *Root That Remembers* (fairy forest, a plot that grows a ramp and carries it), 5 *Traveling Door* (slide a stairwell).
- Both were made in another chat with no knowledge of the codebase. Copies of both, plus the two solver scripts used in §3, are in
  `/mnt/project-files/dungeons/source/` and `/mnt/project-files/dungeons/solver/`.
- Both agree on most rules: 12 × 12 plots, 3 × 3 districts, two-square corridors with ports in the middle of each edge, a 4 × 4
  centre chamber, plots frozen during fights, party clear of seams before a move, a physical 3 × 3 model at the entrance, reset keeps
  keys and won fights, sightline to the exit, 5 to 10 minutes per slice.

---

## 2. House rules that bind this work (read before designing anything)

These come from mondo, CLAUDE.md and team memory. Each one changes something in the source packs.

| Rule | What it means here |
|---|---|
| Older docs (ZONES_PLAN.md, LEVEL_DESIGN_PLAN.md, EDITOR_PLAN D6) say "no puzzles" in the story zones. | **Out of date for this work (mondo 2026-11-14):** these puzzle dungeons will become part of story mode. A fresh chat must not let those old lines stop or shrink this work. For now the dungeons are a standalone test build, not reachable from DOOR HQ, a zone, the directory or the quest log; wiring them in is a later plan. |
| Never invent names or logos. | The slice titles are **working titles from his two packs**; naming is low priority (mondo 11-14). "DOOR Works" becomes the game's real HQ floor **THE WORKS** (`works`, "2 · THE WORKS"). "Catacombs" is the real room **THE CATACOMBS** (`site_prebuilt_vatican_catacombs`). The test launcher's label is **PLOT DUNGEONS** (the PDF's own title) until he names it. UI words stay plain labels (TURN LEFT, SLIDE NORTH, UNDO, RESET, BACK, CONFIRM). |
| Only roster units. | "Tomb guardians", "sentries", "scavengers", "security units", "creatures" and the "stone guardian" become real races from `AVAILABLE_RACES`, picked from each look's own area-unit list as placeholders. A dungeon's real enemies follow the zone it ends up in and who mondo wants there; a puzzle type is never tied to a place or to enemies (mondo 11-14). Units are named after their race. No new characters. |
| Never repaint or rebake his textures. Gold = the `gold` terrain key (gilt.png), never the gold*.png files. | Each slice borrows the shell sheets, mood, fog and look of an existing room (§6.2). Tints only where the district threads already tint (a tint multiplies a sheet). |
| Reuse R2 assets, pack first. Meshy only with his approval. No SFX generation. | Every piece in §8 is checked against MODEL_LIST.md and the pack name list first. Missing pieces go to him as a list. Sounds come from the existing sfx (`playSfx`, `playDoorSfx`). |
| 1 tile per square, battle squares 3.5 m. Blockers centred on whole squares; walkways whole squares wide; nothing half across two squares; decor off centre. | The source packs used 3.65 m cells. Here a cell **is** a 3.5 m battle square, so a plot is 42 m and a board is 126 m (§4). |
| Interiors get working swing doors like DOOR HQ. | Every doorway that is a door hangs a catalogue leaf (§6.6). Exit gates are doors with a locked state. |
| Fewer NPCs, none blocking, no followers. | The walk is the officer alone (the party is not drawn following). Only the enemies of the fights and the one escorted guardian are bodies. "The party rides the plot" = the officer rides it. |
| PS1 window UI: panels black with a white outline, BACK red, CONFIRM green, no text cut off, no sideways scroll. | The 3 × 3 model's panel and the slice list follow it (§6.5). |
| Bloom and fog off, real lights, no placeholder geometry. | Shapes drawn in code are only allowed where a district thread already uses `k: 'arch'` parts for architecture. Props are models. |
| Every distinct complaint is its own thread; design needs his OK; every delivery posted. | One thread per phase (§9). mondo's 11-14 answer is the OK for the ten test boards as drawn in the two packs and here: build them, post each as it lands, and let his play-testing drive the changes. A new look or layout he has not seen still gets a mock-up first. |
| NO TESTS, no CI; `node --check` the JS you touched. No playtest unless mondo asks in the thread (RULE #1c). | Proof is offline (§10). Screens only when he asks for a playtest himself. |
| Never create new GAME .js files. Repo-root tooling is fine. | Runtime code goes into data.js, three-renderer.js, map.js, index.html (and ui.js / hud.js if a panel needs it). The tool `bake-dungeons.js` sits at the repo root. |
| Online PvP parity (RULE #2). | The test build is single player and never online. Its fights are local exploration battles with no guest, so nothing is relayed. Say so in each PR. |
| Never delete content he did not name. | **Mystery Dungeon** (main menu, `_goToMysteryDungeon`, the 10-floor crawl) stays exactly as it is. Plot dungeons are a separate thing. |

---

## 3. Review of the two packs: what holds, what changed

### 3.1 Every listed solution was checked

The board logic of all ten slices was checked at the port level with two small solvers (`/mnt/project-files/dungeons/solver/slide.py`,
`rot.py`: breadth-first search over board states). Every listed solution is valid. Minimal move counts:

| Slice (source) | Verb | Listed moves | Minimal | Notes |
|---|---|---|---|---|
| Turning Tomb (A01) / Turning Crypt (B1) | rotate | 2 turns | 2 quarter turns | Both directions reach the solved state (SW → SE → NE, or SW → NW → NE). A tutorial-sized puzzle. |
| Missing Street (A02) | slide | 4 | 4 | The listed sequence is the shortest. |
| Missing Channel (B2) | slide | 3 | 3 | Shortest. |
| Traveling Door (B5) | slide | 5 | 5 | Shortest; the "it looks worse first" move is required. |
| Two to Open (A04) | rotate (no ride) | 4 | 4 clicks | A3 can go one left or three right. |
| The Procession (A05) | rotate + escort | 2 bells, 1 turn | same | With the two detents (SW, NE) no static route exists from C2 to B3 in either state, so the turn with the guardian aboard is required. The rule works. |
| Three Little Worlds (A03) | route | 3 releases | 3 | A matching task, little search. |
| Root That Remembers (B4) | grow + carry | 1 grow, 1 turn | same | Valid once B2's ground is made a four-arm cross (see 3.2). |
| Three-Rail Crossing (B3) | rotate (no ride) | 3 alignments | 3 | B1 and B3 need a half turn each. |

### 3.2 What changed to fit Entropy Wars

1. **Scale.** 3.65 m cells → **3.5 m battle squares** (HQ_ARENA_RULES.squareDefault). Plot 43.8 m → **42 m**, board 131.4 m → **126 m**.
   The upper level +7.3 m → **+7.0 m** (two 3.5 m storeys, the same as Disaster City's roof routes, `ROOF_H = 7.0` in
   bake-disaster-city.js). Heights move in whole 1.75 m blocks (docs/disaster-city/levels.js uses 1 level = 1.75 m).
2. **Coordinates.** Squares count **0 to 11** from the plot's north-west corner, as in docs/disaster-city/city-layout.json (the packs
   counted 1 to 12). So the packs' "ports at cells 6-7" are squares **5-6**, and "the chamber at 5-8" is squares **4-7**. Disaster City's
   own plot edges already use exactly this gap: an edge profile of `#####PP#####` opens squares 5-6.
3. **The plot centre is a grid corner.** 12 is even, so the centre of a plot is the corner shared by squares (5,5), (5,6), (6,5) and
   (6,6). A quarter turn about that point maps every whole square onto a whole square. That is why a plot can rotate and still obey the
   whole-square rules: a blocker centred on a square stays centred on a square, a two-square corridor stays two squares wide.
4. **The fight is the plot, not an 8 × 8 inside it.** Exploration battles already fight on the room itself (EXPLORATION_BATTLES Phase
   1: `hqFieldFrame` takes the whole lattice up to 24 × 24). A plot is a 12 × 12 lattice, so the fight frame is the whole plot with no
   new frame code. Each fight plot keeps an **8 × 8 open hall** (squares 2-9) so it meets the editor's audit (`HQ_FIELD_RULES.fieldMinSeats`
   = 48 seats in one region; `hqPlanFieldSeats`). A 4 × 4 chamber (16 squares) is too small for a fight.
5. **Unused plots are not rooms.** "Inaccessible mass" plots get no room at all: the board's backdrop (the look's wall sheet or trees
   standing as mass) closes them.
6. **Empty slots.** A vacancy is a real drop with visible depth, closed by railings on the neighbours' edges. Nothing walks it.
7. **No followers.** "The party rides" becomes the officer rides. The seam rule is simple: the officer stands inside the moving plot's
   4 × 4 chamber, or off the board on a fixed gallery.
8. **Rails.** Three-Rail Crossing's grind-only route becomes a walkable catwalk with a grind rail on it (`_hq.rails`, the skateboard
   grinds). Walking always works; the skateboard is the fun way. It stays an alternate (§5.6).
9. **Root That Remembers.** Source B calls B2's ground "rotationally symmetrical" but draws it as a south-west elbow. It is made a
   **four-arm cross** here so its ground ports never change when it turns. Only the grown ramp changes direction.
10. **Marbles** (Three Little Worlds) roll on **scripted paths** along authored rail curves (no physics engine). Kept as an alternate.
11. **Names and units** follow §2.
12. **Overlap.** Both packs have a rotating catacomb hub with a key. They merge into one slice (5.1): source B's layout and fight, source
    A's dial, preview, sightline and "the dial always works".
13. **All ten are built** (mondo 11-14: "no swaps, just build all of them"). The two rotating crypts (A01, B1) stay two separate layouts
    on the same engine, so both versions can be played. The looks below are only the packs' own places for testing; any dungeon type can
    stand in any zone later.

---

## 4. The build kit (shared by every slice)

### 4.1 Sizes and frames

| Thing | Value |
|---|---|
| Battle square | 3.5 m (one tile per square) |
| Plot | 12 × 12 squares = 42 m. Local metres run −21 … +21, centre (0, 0) |
| Board | 3 × 3 plots = 126 m. Slots A1 … C3, rows A-C north to south, columns 1-3 west to east. Slot centres at −42, 0, +42 m |
| Square *i* (0-11) spans | x from −21 + 3.5·*i* to −21 + 3.5·(*i*+1) |
| Port (edge opening) | squares 5-6 = −3.5 … +3.5 m along the edge (7 m wide), on any of the four edges |
| Centre chamber | squares 4-7 = −7 … +7 m (14 m square) |
| Fight hall | squares 2-9 = −14 … +14 m (8 × 8 squares) |
| Upper level | +7.0 m (two 3.5 m storeys); ramps and stairs climb in 1.75 m blocks |
| Turn | a quarter turn about the plot centre, ~1.5 s |
| Slide | one slot (42 m), ~2 s |

### 4.2 The plot grammar (written by hand in the layout files, read by the tool)

Each plot is 12 strings of 12 characters, the same shape as `cells` in docs/disaster-city/city-layout.json:

| Char | Meaning |
|---|---|
| `#` | solid mass (the look's wall to the ceiling, or trees, or rock: `terrain.gen = { kind: 'plan', look: 'walls' \| 'trees' \| 'rock' }`) |
| `.` | floor, walked |
| `o` | a whole-square blocker (cover, a sarcophagus, a machine). Several `o` in a row = one piece filling whole squares |
| `=` | upper deck at +7 m |
| `/` | ramp or stair square (its climb direction in the plot's `marks`) |
| `~` | water |
| ` ` (space) | void, a drop |

Everything else (the dial, the model, the key, the gate, a spawn, an enemy seat, a sight window, a lamp) is a **mark**: `{ k, x, y }` in
squares, off the cell strings, like the city's `poi` list. Decor is never a cell; it is placed off centre by the tool.

Three worked pieces (Turning Crypt):

```
B2 ROTOR, arrival (ports S + W)   B3 KEY CRYPT (port W, 8x8 hall)   C2 ENTRY (ports N + the way in, S)
############                      ############                      #####..#####
############                      ############                      #####..#####
############                      ##........##                      #####..#####
############                      ##........##                      #####..#####
####....####                      ##.oo..oo.##                      ###......###
........####                      ..........##                      ###......###
........####                      ..........##                      ###......###
####....####                      ##.oo..oo.##                      ###......###
#####..#####                      ##........##                      ###......###
#####..#####                      ##........##                      ###......###
#####..#####                      ############                      #####..#####
#####..#####                      ############                      #####..#####
```

The four `oo` pairs in B3 are the four sarcophagi (each fills two whole squares) that split the hall into a centre lane (squares 5-6)
and two flanks. The hall holds 56 free squares (+4 in the corridor), above the 48 the field audit wants.

### 4.3 The rules every plot obeys (the tool checks them, §6.1)

1. Every port is squares 5-6 of its edge, two squares wide, at ground or at +7 m. A port meets a port only at the same height.
2. A plot that turns is drawn so that each of its four quarter-turn poses is legal (its cells rotate square for square, §3.2 item 3).
3. Every walkway is one whole square wide or more; every corridor between ports is two.
4. Blockers fill whole squares, centred. Decor (lamps, bones, candles, vines, signs) is off centre, on walls, in corners or overhead,
   kept 0.4 m off walls (the district threads' `R.put` rule).
5. An unmatched edge is closed: a wall of the look, a railing at a drop, or trees. Never one uniform fence everywhere (mondo 11-13).
6. Nothing moves while the officer stands on a seam: a turn needs the officer inside the turning plot's 4 × 4 chamber or off the
   board; a slide needs the officer off the board (on the overlook or gallery).
7. Nothing moves during a fight. A fight is only ever on a fixed plot.
8. Reset puts the puzzle pieces back. It never takes away a key, an item or a won fight.
9. The dial or console that moves a plot is always usable from where the officer stands, so no move can strand the officer.
10. The exit is seen before it can be reached: a tall lit landmark, a light shaft, a window or a sightline (Disaster City's weenie rule:
    every walk ends at a clear silhouette).

### 4.4 The in-world model (every slice)

At each slice's entrance (and at each control point) stands a waist-high **3 × 3 model of the board**: nine small plates in the look's
own material, each showing its plot's current ports as raised lines, moving plots tinted, the officer's position as a dot. E on it
opens the panel (§6.5): the moves you can make from here, a **preview** (the moved plot's new ports drawn in outline on the model and
the joins it would make glowing), CONFIRM, UNDO, RESET, BACK. Nothing needs an overhead camera.

---

## 5. The ten slices (all built)

Each slice lists: the look it borrows for the test, the board, the moves, the solution (checked), the fight, the first view, and what it
needs. Enemies are **placeholders** from the look's own area-unit list (data.js `hqRoomNatives(<room>)`), set in the slice's layout file
so mondo can change them in one line. A slice's place, look and enemies are not part of its puzzle: the same board can be dressed for any
zone later. Order: 5.1-5.5 are the first five designed in full; 5.6-5.10 the other five.

### 5.1 ROTATE · *The Turning Crypt* (working title; source B1, with source A's dial, preview and sightline)

- **Look:** `site_prebuilt_vatican_catacombs` (THE CATACOMBS): floor `dungeon`, walls `bricks_3`, dado `bricks_2`, trim `marble`, teal
  retro look, candle rings, fog off per the visual rules.
- **Board (arrival):**

| | 1 | 2 | 3 |
|---|---|---|---|
| **A** | sealed | EXIT (port S, locked gate, the light shaft) | sealed |
| **B** | MEMORIAL (port E, an inscription) | ROTOR (ports S + W, 4 × 4 chamber, the dial) | KEY CRYPT (port W, fight hall, the key) |
| **C** | sealed | ENTRY (ports N + the way in, the model, a barred window high in the north wall) | sealed |

- **Moves:** only B2 turns, a quarter turn left or right per press, from the dial in its own chamber (the officer rides it). The entrance
  model shows the board and can RESET it (only while the officer is off B2).
- **Solution (2 quarter turns):** walk C2 → B2 → B1 and read the memorial (it teaches that the rotor's arms point at what they join).
  Back in B2, turn left: the arms go from S + W to S + E. Walk east into B3, win the fight, take the key. Back in B2, turn left again:
  S + E becomes E + N. Walk north to A2 and open the gate with the key. Turning right twice from arrival (W + N, then N + E) also
  works. Either way it is two presses.
- **Fight (B3, fixed):** three units on the 8 × 8 hall. Placeholder: **undead** × 2 (melee, start near the west door) + **necromancer**
  (ranged, behind the rear pair of sarcophagi). Alternatives from the room's list: ghoul, gargoyle, ghost. Party starts in the west
  corridor squares and the hall's west column. The key lies on the hall's east wall and is taken after the win.
- **First view:** from C2 the barred window high in the north wall frames the light shaft over A2's gate (`light_shaft` prop, the room's
  `candle_ring`). The window cannot be climbed.
- **Next difficulty (later):** a second rotor (B1 turns too).

### 5.2 SLIDE · *The Missing Street* (working title; source A02, Disaster City rules)

- **Look:** Disaster City (`site_prebuilt_downtown_streets`): the urban pack sheets, kerbs, lamps on square lines, open sky, the city's
  district materials. The board is a collapsed block of the city: three street plots and five rubble plots in a pit, one slot empty.
- **Board (scrambled start):** A1 rubble, A2 **empty**, A3 rubble · B1 rubble, B2 street, B3 street · C1 rubble, C2 street, C3 rubble.
  Street plots run west-east on squares 5-6 (a two-square pedestrian street with pavement edges, kerb stones, a lamp on a square line).
  Rubble plots cannot be walked. Every unmatched edge is a railing over the drop.
- **Overlook:** a fixed platform outside the board's west edge, beside B1 (a 42 × 14 m part). It holds the model and the controls. A
  retractable bridge joins it to B1's west port once the middle row is a street. The refuge gate (exit) stands on B3's east edge with a
  bright stripe painted at the overlook's height so the eye links the two.
- **Moves:** any plot next to the vacancy slides into it (the officer stays on the overlook, so nobody rides). The board is frozen while
  the officer is on the bridge or on the board.
- **Solution (4 slides, shortest):** A1 rubble east into A2; B1 rubble north into A1; B2 street west into B1; C2 street north into B2.
  The middle row is street, street, street; walk B1 west to B3 east. The goal is a route, not a tile order (any street in each slot).
- **Fight:** none on the board (source A). A fixed fight past the refuge is a later step.
- **What Disaster City lends:** the plot grammar itself (a street plot here is a 144-plot street plot cut to one 2-square route), the
  kerb rule, the lamp positions on the line between squares, `k: 'arch'` facades for the rubble's broken buildings (no tilted parts:
  rubble is stepped boxes and models), the city door leaves where a building front has a door.

### 5.3 CONNECT · *Two to Open* (working title; source A04)

- **Look:** THE WORKS (`works`, DOOR HQ's second floor): `concrete_floor`, `drywall`, dado `gunmetal`, trim `teal`, pipes on, strip lights.
  The board is a machine hall seen from a gallery.
- **Board:** C2 BATTERY (the source, port N) · B2 FEED (straight) · A2 SPLITTER (T) · A1 and A3 CORNERS (elbows) · B1 LOCK L and B3 LOCK R
  (receivers, port N each) · C1 ENTRY / MODEL · C3 EXIT GATE. The current runs in **traces** across the plots (thin lit lines on the floor
  plates and up the machines), not walkways.
- **Walk:** a fixed gallery along the board's south edge from C1 to the exit door in C3. The gallery never moves.
- **Moves:** only A1, A2, A3 and B2 turn (no rider: the officer is on the gallery). Start → target: B2 EW → NS; A2 NES → ESW (right);
  A1 NE → ES (right); A3 NW → WS (left).
- **Solution (4 presses, shortest):** turn B2, A2 right, A1 right, A3 left. The battery feeds B2 → A2 → both corners → both locks. Each lock
  lights on its own; the gate opens only while both are lit (one simple AND), and the controls freeze while the officer crosses.
- **Feedback:** current animates only along joined traces; a lit lock shows its own lamp. A sign beside the gate says BOTH LIGHTS OPEN
  DOOR (plain label from source A; his OK).
- **Fight:** none in this slice. A fixed fight at the entry is a later step.

### 5.4 GROW AND CARRY · *Root That Remembers* (working title; source B4)

- **Look:** the fairy forest (`site_prebuilt_fairy_forest_glade`): open sky, `grass_2`, `leaves_3`, tree walls (`look: 'trees'`, the
  walker never enters the trees).
- **Board:** C2 ENTRY (ground S + W + N) · C1 PATH (E + N) · B1 SPRING (S + E, the fight, the valve) · B2 TRELLIS (a four-arm ground cross
  + one trellis arm that can grow) · A2 EXIT (+7 m only) · B3 CACHE (+7 m only, optional) · A1, A3, C3 trees (no room).
- **Moves:** B2 turns (the officer rides, from its centre control). Watering is an interaction at the spring.
- **Solution:** walk C2 → C1 → B1; win the fight at the spring; open the valve: water runs east into B2's west arm and the dormant trellis
  grows into a climbable **root ramp** up to +7 m (the plot gains a feature it keeps). Stand in B2's centre, turn it so the ramp points
  north; climb to A2's exit. Pointing it east reaches B3's cache.
- **Fight (B1, fixed):** three units, a shallow channel across the hall with two crossings and roots as cover. Placeholder: **goblin** × 2 +
  **swamp monster**. Alternatives from the glade's list: gnome, mushroom girl, tree person.
- **Rule taught:** a plot can gain a permanent traversal feature and carry it into another useful pose. The growth stays inside B2 and
  never stretches across a seam.

### 5.5 ESCORT · *The Procession* (working title; source A05)

- **Look:** H-Wing (`hwing_floor`, the backrooms): `carpet_4`, `wallpaper`, plan walls, low ceiling, flat light.
- **Board:** C1 ENTRY / BELL (the model, the bell, the recall) · C2 GUARDIAN BAY · B2 TWO-STOP HUB (4 × 4 holding chamber H) · B1 CAPPED
  BRANCH (false lead) · B3 PLATE (a large plate with the guardian's footprints) · C3 EXIT GATE · A1-A3 walls. A fixed gallery on the
  board's south side (squares 10-11 of row C) joins C1 to C3; railings keep the officer out of the guardian's lanes.
- **The guardian:** a roster unit walking as a body, not a fighter: **golem** (a layout-file line; gargoyle or chess piece also fit).
- **Moves:** the bell sends the guardian one chamber along the hub's connected port; B2 turns only between its **two detents, SW and NE**
  (it cannot stop at SE or NW), and only while the guardian stands wholly inside H. Arrows on the model preview where the next bell sends
  it. RECALL puts the guardian back in C2 and the hub to SW.
- **Solution (checked, no static route):** with the hub at SW ring once: the guardian walks C2 → H and waits. Turn the hub to NE (the
  guardian rides it). Ring again: H → B3, onto the plate. Its weight opens the gate; walk the gallery to C3.
- **Fight:** none.

### 5.6 ROTATE · *The Turning Tomb* (working title; source A01)

- **Look:** THE CATACOMBS, as 5.1. Same rotor engine, a different board, so the two can be compared in play.
- **Board:** C2 FOYER (ports N + the way in, the model, the barred sight window) · B2 HUB (4 × 4 chamber, two-arm L, starts S + E, the dial
  at its centre) · B1 KEY CRYPT (dead end, port E, the gold key on square (5,5)) · B3 EXIT HALL (ports W + E, the locked gate on its east
  edge) · every other plot sealed.
- **Solution (2 quarter turns):** enter B2 from C2 (the east gate is locked). Turn right: S + E becomes S + W. Walk west into B1, take the
  key. Back in B2, turn left: S + W becomes S + E. Walk east through B3 and unlock the gate.
- **Fight:** optional, in C2 before the controls wake: the party on squares (4-7, 9), two sentries on (3,3) and (8,3), low cover on (3,5)
  and (8,5) (source A's numbers less one). Placeholder sentries: **skeleton** × 2.
- **Next difficulty (later):** a second hub.

### 5.7 SLIDE · *Missing Channel* (working title; source B2)

- **Look:** the sewers (`site_prebuilt_downtown_sewers`): `urban:ConcreteStriped2c` floor, `bricks_2` walls, plan walls, no sky.
- **Board:** A1, A2 masonry (sealed) · A3 PUMP (S + N, the exit beyond it) · B1 ELBOW (S + E, fixed) · B2 ELBOW (W + N, slides) · B3 empty ·
  C1 INLET (S + N, the fight and the console) · C2 empty · C3 STRAIGHT (W + E, slides). Only slots B2, B3, C2, C3 take part. Each moving
  plot carries a pipe and its own maintenance walkway, so water and the walk join together.
- **Solution (3 slides, shortest):** elbow B2 → B3; straight C3 → C2; straight C2 → B2. Open the water and follow it C1 → B1 → B2 → B3 → A3
  to the pump and the exit.
- **Fight (C1, fixed, before the console wakes):** three units round a central pump housing (full cover) and two equipment banks.
  Placeholder: **zombie** × 2 + **gangster**.
- **Water:** a scripted stream along joined pipes only (`stream` rows switched on per joined plot); it washes debris off a small recess
  in C1 (a find).

### 5.8 SLIDE WITH HEIGHT · *Traveling Door* (working title; source B5)

- **Look:** THE WORKS, as 5.3 (a second board on the same floor's look).
- **Board:** C1 ENTRY (S + E, the console, the fight) · A2 EXIT (+7 m, port S high) · A1 records, A3 office, B1 machinery (sealed) ·
  moving slots B2, B3, C2, C3 hold one empty slot, a T hall (W + N + S), a straight passage (W + E) and a **stairwell** (south door at
  ground, north door at +7 m). Start: B2 empty, B3 hall, C2 passage, C3 stairs.
- **Solution (5 slides, shortest):** hall B3 → B2; stairs C3 → B3; passage C2 → C3; hall B2 → C2; stairs B3 → B2. Walk C1 east into the
  hall, north into the stairs, climb to A2. The first move makes it look worse on purpose.
- **Fight (C1, fixed):** three units, a security desk as centre cover, machinery blocking one sightline, a side aisle. Placeholder:
  **men in black** × 2 + **droid**.

### 5.9 ROTATE, NO RIDER, ELEVATED · *Three-Rail Crossing* (working title; source B3)

- **Look:** Disaster City, as 5.2 (roof level of a collapsed block).
- **Board:** C1 ENTRY (S + N + E, the fight, the console) · B1 LAUNCH (stairs from its south port up to +7 m; its rail piece bends) · B2 RAIL
  (straight) · B3 LANDING (bends) · C2 UNDERPASS (W + E, the lower recovery loop) · C3 EXIT at +7 m · A1-A3 roofs (sealed, scenery).
- **Moves:** B1, B2, B3 turn their elevated pieces from the console in C1 (nobody rides).
- **Solution (3 alignments):** B1 to S + E (a half turn), B2 to W + E (a quarter), B3 to W + S (a half). Climb B1's launch stairs, cross
  the middle row on the catwalk (walk it, or grind its rail on the skateboard), come down into C3's high exit.
- **Recovery:** a fall lands in the underpass, which leads back to the launch stairs; the alignment stays.
- **Fight (C1, fixed):** three units among wrecks, one raised firing position. Placeholder: **gangster** × 2 + **marksman** (on the
  raised spot).

### 5.10 ROUTE · *Three Little Worlds* (working title; source A03)

- **Look:** the fairy forest, as 5.4 (a second board in the same look).
- **Board:** C1 ENTRY (the southern gallery, the model, the loader) · B1 DISPENSER (a fixed chute from its lip into the bowl at B2's centre) ·
  B2 JUNCTION (one radial downhill track from the centre to an edge; turns to aim N, E or S; west is a return gutter) · A2 BLUE TRIANGLE,
  B3 RED CIRCLE, C2 YELLOW SQUARE (receiving bowls on fixed tracks) · C3 EXIT WALK · A1, A3 roots (sealed).
- **Moves:** at C1 load a colour, turn B2 (the bowl holds the marble while it turns), press RELEASE. Turning is locked while a marble
  rolls. A right socket keeps its marble; a wrong one sends it back.
- **Solution (3 releases):** blue, aim north; red, aim east; yellow, aim south. The three symbols over the exit light; walk the gallery
  to C3.
- **Heights (in 1.75 m blocks, from source A's +6 / +5 / +4 / +3 m):** source lip +5.25 m, bowl +5.25 m, every outlet +3.5 m, receivers
  +1.75 m above the gallery's floor. The outlet height is the same in every pose, so the rails never change shape.
- **The marbles** roll on scripted paths along authored curves (§3.2 item 10). No fight.

---

## 6. How it fits the codebase

### 6.1 Data: the layout files and the tool

Follow the Disaster City pattern exactly (one source of truth in docs/, one tool that writes data.js between markers, never hand-edit
the written block).

- **`docs/dungeons/<slice>.json`** — one file per slice: `{ id, label (working title), look: '<source room id>', verb, plots: { A1: {
  role, cells[12], marks[], ports: { ground: 'NESW', upper: '' }, moves: 'turn'|'turn2'|'slide'|null, variants? }, ... }, start: {
  pose per slot }, goal, controls: [...], fights: [...], items: [...], exit: {...}, overlook? , gallery? }`.
- **`bake-dungeons.js`** (new, repo root, tooling only, like bake-disaster-city.js). `node bake-dungeons.js [slice…] [--dry-run]`.
  It:
  1. reads the layout files;
  2. checks §4.3 rules 1-5 on every plot and every pose of a turning plot, every square of every blocker whole, every walkway ≥ 1
     square, every corridor 2;
  3. replays the listed solution and runs a breadth-first search over board states (the solver in /mnt/project-files/dungeons/solver/
     as the reference), printing the minimal move count and failing if the listed solution does not solve it;
  4. checks each fight plot with `hqPlanFieldSeats` (≥ 48 seats in one region) through load-data.js;
  5. writes, between `PD-BEGIN` / `PD-END` markers in data.js: one `DOOR_HQ.rooms` entry per plot room (`pd_<slice>_<slot>`, plus
     variants such as `pd_root_B2_grown`), the `HQ_WORLD.zones` row for each slice (`pd_<slice>`: parts at their start frames, no static
     joins), and the `PD_DUNGEONS` table (the board logic rows the runtime reads).
  Each room copies its look room's `shell` sheets, `mood`, `look`, light colour and music key, sized 42 × 42 m, with `terrain.gen =
  { kind: 'plan', look }` and `space` / `hall` features drawn from the cells (the editor's E5 layout rows), props from marks, ghost
  walls for blockers, and `pd: '<slice>'` on every room.
- **Not on the story side yet** (until the later wiring plan): rooms with `pd` have no door from any story room, are never charted in the directory, carry no `site`
  unless the fight path needs one (see 6.4), and `bake-arenas.js` must skip them (add `if (room.pd) continue` and check with
  `node bake-arenas.js --dry-run` that no pick changes).

### 6.2 The looks (borrowed, never repainted)

| Slice | Look room | Sky | Gen look |
|---|---|---|---|
| Turning Crypt | `site_prebuilt_vatican_catacombs` | none | walls |
| Missing Street | `site_prebuilt_downtown_streets` (+ the urban sheets the district files use) | open | walls (rubble mass) |
| Two to Open | `works` (and the rest of the THE WORKS floor's props) | none | walls |
| Root That Remembers | `site_prebuilt_fairy_forest_glade` | open | trees |
| The Procession | `hwing_floor` | none | walls |

### 6.3 The moving plots (the engine piece Phase 0 proves)

**Primary approach: each plot is a stage part with a live pose.**

What exists (data.js, three-renderer.js):
- `HQ_WORLD.zones[zone] = { parts: { roomId: { x, z, y, rot } }, joins: [...] }` places box rooms on one stage. `HQ_STAGE_RULES.zones`
  lists the staged zones. `hqWorldFrame(roomId)` reads a part's frame; `hqStageRel(fromId, toId)` gives one part's pose seen from
  another (`rot` in quarter turns, and **a fraction of a quarter turn is already allowed**: THE ROUND JOIN uses free angles through
  `_hqStageCS`).
- The renderer keeps the **current** part at the scene origin and places the others with `_hqStageRootPlace(H, E)` (`partRoot.position`,
  `rotation.y = rot·π/2`). Crossing a join swaps the current part (`_hqStageCrossed` in map.js). The walker's ground, walls and
  blockers in a neighbour are asked in that part's own metres (`_hqStageOwner(x, z)`, `_hqStageAsk`), and a room edge only lets the body
  through where a join's span opens it (`_hqStageEdgeOpen` → `hqStageSpanAt`). `hqStageNeighbours(roomId)` turns joins into spans.
- So each plot is compiled once in its own frame. Moving a plot only changes its pose and the joins.

What Phase 0 adds:
1. **A live board.** `hqWorldFrame` reads a pd zone's frames from the live board (`PD_DUNGEONS` + the runtime state), not from the static
   row. `pdJoins(slice, board)` computes the zone's joins (kind `hall`, side, span −3.5 … +3.5) from the ports that meet at the same
   height. After a move: clear every cached `E.rel`, re-run `_hqStageRootPlace`, rebuild the spans.
2. **The tween.** A turn tweens `rot` through fractions over ~1.5 s; a slide tweens `x` / `z`. While the officer rides the current part,
   the *other* parts and the sky turn the opposite way about it (the current part is the origin), which looks the same as the plot
   turning. Input is held during the tween; the camera boom keeps its blockers (`_hqCamInDoorway`).
3. **Build every part.** The stage builds one-hop neighbours and drops parts past `HQ_STAGE_RULES.partsBuilt` (3). A pd board must build and
   draw **all** its parts at all times, joined or not (the vacancy view, the exit sightline, the slide board seen from the overlook).
   Add a per-zone rule (`pdAll: true`), not a change to DOOR HQ's numbers.
4. **Check the per-part draw paths:** the static batch, the instance pass (`HQ_ENGINE_RULES.instanceCell`), the chunk cull
   (`_hqChunkTick`), shadows (the static shadow refresh), lamps (`_hqStagePick`), CSS2D plates (`_hqStageCssShow`). Each must follow a
   part whose `partRoot` moves. Any that bakes world positions needs that part kept out of it (a flag on moving parts only).

**Fallback if Phase 0 fails: one room per slice, moves under a blink.** The moving plot's meshes are one group tagged by slot; the move
plays as a tween of that group (the officer's body parented to it while riding), then the room's rows are rewritten for the new board
and the room re-enters with the walk's door-blink (`ThreeRenderer.hq.enter({ walk: true, … })`, the same blink as walking through a
door). Reliable, but each move costs a short black dip. Kill switch `window.EW_PD_BLINK = true` forces this path even when the primary
works, for comparison.

**Why most slices are easy either way.** Only three slices change the ground under the officer while the officer stands on it (5.1, 5.4,
5.6). In the other seven the officer stands on a fixed overlook, gallery or console plot while plots move, so those moves are drawn only;
the walked ground changes once (a bridge opens, a gate opens, the arranged plots join).

### 6.4 The fights

- A fight plot holds the enemies as bodies standing in the hall. The fight starts the way exploration fights already start: walking
  into their area or striking one with the door gun drawn (`hqEncounterLaunch` → map.js `_hqEncounterFire`), and the field is the plot
  (`hqFieldFrame(roomId, feet)`: the plot's 12 × 12 lattice is under the 24 cap, so it is taken whole). The named enemy set and pinned
  seats come from the slice's `fights` row, in the shape QUEST_FIGHTS already uses (`enemies: [{ race, gender }]`, `seats`).
  This is SEAMLESS_FIELD_PLAN §8.3 step 9, **THE SWITCH**, which was planned and never built: "get into position, press the button, the
  field turns into battle mode, the enemies are where you need to be". Build it once here, as a general piece.
- `hqEncounterRoomOk(roomId)` needs `hqRoomSite(roomId)`. Either give the fight room its look room's `site` (and keep bake-arenas.js
  skipping `pd` rooms) or let the PD fight row name the site directly. Decide in Phase 1 by reading `hqEncounterLaunch`.
- The party is a saved team from the Squad Desk (map.js `_openSquadDesk`, the same desk Play VS CPU uses), every vessel unlocked like
  Play VS CPU (decided, §13). Wipeout to win; a loss or retreat keeps the puzzle state and puts the officer at the fight plot's door.
- While a fight runs, every move is frozen. After the win the plot's controls wake (Turning Crypt: the key can be taken).
- Story XP, levels and capture are not touched (the fight is not a story fight). Online: none.

### 6.5 Controls, panel and save (map.js)

- **Counters.** The model and each dial or console is a room counter with `proc: 'pd_model'` or `proc: 'pd_control'`. map.js
  `_hqInteractTarget(t)` routes them to `_pdPanel(t)` (beside the existing `battle_marker` branch). The renderer draws the model:
  `_hqPdModel(counter)` builds the nine plates and redraws them on every board change.
- **The panel** (`_pdPanel`): a PS1 window, black with a white outline. Lists the moves allowed from where the officer stands (TURN LEFT,
  TURN RIGHT, SLIDE NORTH…, RING, RECALL), PREVIEW on the model, CONFIRM (green), UNDO, RESET, BACK (red). Words fit (no cut-off, no
  sideways scroll); test the longest label in his theme ("My Theme 3").
- **Gates.** An exit gate is a normal door with a leaf (`leaf_portcullis` for the crypt, the look's own leaf elsewhere). data.js
  `doorSiteState(door, profile)` gets a branch: a door with `pd` reads the PD save (`sealed` until the slice's condition holds, then
  `open`). The lamp labels already exist (HQ_LAMP_LABEL).
- **Items.** A key is a find (`_hqTakeFind`'s path: E on a glowing object takes it) recorded in the PD save, not the story bag.
- **Save.** localStorage `ew-pd-save-v1`: `{ slices: { <id>: { board, items, fights, solved, at } } }`, like Mystery Dungeon's
  `ew-md-save-v1`. No migration of old shapes (mondo does not care about old saves).
- **Console helpers** for checks (like `Quests.state()`): `PD.state()`, `PD.reset(slice)`, `PD.solve(slice)` (plays the listed solution).

### 6.6 Doors, props and facing

- Box-room doors hang catalogue leaves through `_hqBuildDoors` (DOOR_HQ.catalogue swing leaves: `leaf_lobby_glass_double`,
  `leaf_shabby_wood`, `leaf_security`, `leaf_office`, `leaf_exit`, `leaf_white_wood`, `leaf_portcullis`…). A walk-in building front in the
  Missing Street rubble uses the city's `texbuilding` `hollow: true` + `_hqBuildTexDoors` (the city doors), or no doorway at all.
- **Facing (the bugs the district threads hit, check every one):** a row's `rot` is degrees clockwise and its front is +z; the city's
  `face: 90` looks at +x; an arch `quad` with `ry: 90` faces −x and `ry: 270` faces +x; shelves, racks and files along a side wall faced
  INTO the wall when 'l' gave 270 (now 'l' = 90, 'r' = 270); `psx_bed_5`'s head is at the model's +x; two display cases stood one behind the
  other. On a turning plot the facing must survive all four poses: write facings in the plot's own frame and let the part's pose turn them.
- A catalogue `wall` piece hangs at `mount` + `y` (give the height as `mount`). A room's ceiling is the shell `h`; lamps hang under it.

### 6.7 NPCs and nav

- The two fights' enemies stand as bodies on their seats (the rounds' rigs, `_hqSpawnRounds`), no routines, nobody in a corridor.
- **The guardian** (5.5) is one body walking authored lanes: chamber centre to chamber centre (the lanes are straight two-square corridors,
  no A* needed), its feet from `_hqNavQuery`, walk / idle clips as the residents use (`_hqTickResidents`, THE RESIDENTS). It is a
  child of its part while the hub turns, so it rides it. Disaster City's `hqCityGrid` / `hqResidentTimeline` are the model for a real
  walk map if a later slice needs one.

### 6.8 How the test build starts and ends

- **Settings > Developer > Open Plot Dungeons** (map.js, beside "Open Spell Library": `<button class="pm-set-btn"
  onclick="window._goToPlotDungeons()">`). No main-menu button: dungeons are not a mode of their own. When they join story mode they
  will be entered from the zones; that wiring is a later plan.
- `window._goToPlotDungeons()` shows a slice list page (`pdSelectPage` in index.html: all ten slices, each with its look and SOLVED
  mark; PS1 window).
- `_pdEnter(slice)` enters like `window._hqEditEnter` does (map.js): `state.gameState = GS.HQ`, `_showTitlePage('hqPage')`, then
  `ThreeRenderer.hq.enter({ host, room: <entry plot room>, profile, avatar: _hqAvatar(profile), onPrompt, onInteract: _pdInteract,
  onEnterDoor, onEscape, onEncounter … })`. Esc opens a small pause (RESUME, RESET SLICE, LEAVE).
- `_pdLeave()` leaves like `_hqEditLeave` (back to the main menu, music synced).
- `?pd=<slice>` in the URL boots straight into a slice (like `?edit`), for checks.
- Kill switches and readers: `window.EW_PD_BLINK` (the fallback path), `ThreeRenderer.hq.dev.pd()` (the live board, the joins, the
  officer's slot and seam state).
- **Built to move later:** keep the board logic (data.js `pd*`) and the plot rooms free of anything test-only, so the same rooms can be
  given doors from a zone when mondo wires them in. Only `_goToPlotDungeons`, `pdSelectPage` and the pause are test-only.

### 6.9 The R2 / CDN pipeline (every phase that ships)

CLAUDE.md RULE #1 and #1b, unchanged:
1. Edit the existing files; commit on the thread branch; `git fetch origin main` and merge it in (keep both sides of any conflict; data.js
   blocks written by a tool: take either side, then rerun the tool, as the DC144 block is handled); PR; merge.
2. Bump the `?v=` token in index.html in the same PR (keep the `-cors` suffix).
3. `node sync-zip.js --upload` right after the merge; new R2-only assets with `node sync-zip.js --put <file> <R2 key>`. Reply with each
   file and its sha256[:8].
4. A new model: R2 under `Assets/world/props/...` (or the pack's folder), `npm run optimize -- <dir>` for the `.opt.glb`, the catalogue
   row in data.js, `npm run manifest` so ASSET_MANIFEST.json lists its sha, a SOURCES row in list-models.js if it is a new pack or
   maker, `node list-models.js`, commit MODEL_LIST.md in the same PR.
5. Notes go in docs/notes/areas-complexes.md under "PLOT DUNGEONS" (one section per phase); this plan's §14 log gets one line per phase.

---

## 7. What Disaster City taught (apply all of it)

1. A plot is a 12 × 12 battle board of 3.5 m squares; the 1.75 m figure is the old tile / texture tile, not the fight square.
2. Plots must not read as fenced boxes: no uniform wall on plot lines. Mix edges (buildings back to back, trees, railings, rubble).
3. Blockers centred on whole squares; walkways whole squares; nothing half across two squares; decor off centre (mondo 11-13, all interiors).
4. A texbuilding's `w` runs along its FRONT (east / west facing buildings stood a quarter turn off once). Pack shop blocks keep 0.9 to 1.15
   of true size (`packFit`); a hand-written pack row's `w` must match.
5. Every walk-in building gets a swinging leaf (`_hqBuildTexDoors`, kill switch `EW_NO_CITY_DOORS`).
6. Arch rows (`k: 'arch'`) are drawn only; collision stays with the texbuilding / plateau / ghost wall rows. A tint multiplies the sheet;
   pale tints on pale sheets. No lettering part: signs are plain panels or the shared `txt:` key. No tilted parts.
7. A roof is not ground (`archGround`): an arch row over a plateau takes the ground under it.
8. Trees within 2.5 m of a walk-in are moved to the nearest clear square, never dropped. Never delete content mondo did not name.
9. A building spanning plots needs those plots on one level. After merging main, rerun the tool that wrote a block.
10. The static batch only goes live once every asset has landed; before that the draw count is ~10 × higher. Measure after.
11. Big rooms compile slowly unless the generator skips the per-node scan (`gen.allOpen`); 42 m plots compile fast, but time it.
12. Facing bugs are the most common prop fault: check every prop's front against its walkway (§6.6).
13. The Meshy claims list (`/mnt/project-files/meshy/interior-claims.md`) is shared by every thread: read it, reuse what another thread
    made, add a "Plot dungeons" section before making anything new.
14. Chunks: in a room ≥ 200 m wide the plot is the cull chunk (`HQ_ENGINE_RULES.chunkM = 42`). A 126 m board is under that, so all of
    it draws; at 42 m a part that is all one plot is already its own chunk.

---

## 8. Models and assets per slice (pack first)

**Method (MODEL_LIST.md "PACK-FIRST", mondo 11-04):** look in MODEL_LIST §6 / §7 (in the game), §13 (on R2, not wired), then
`/mnt/project-files/asset-packs/contents-lists/object_names_in_every_downloaded_pack.json`. Cut pack pieces with `bake-pack-pieces.py`.
Only then a Meshy row, naming the packs checked, added to the claims list, and **only with mondo's approval**. While the puzzles are
being tested, a missing piece stands in as the nearest existing model; the Meshy list goes to him once the puzzles play well. Pizza Doggy PSX pack
pieces carry a no-AI licence: never feed them or their renders to Meshy.

| Slice | Needs | In the game already (check first) | Packs to check | Likely missing |
|---|---|---|---|---|
| Turning Crypt | sarcophagi (4), memorial slab, key, gate, dial, light shaft, candles, bones | `sarcophagus`, `trap_sarcophagus_box` + `_lid`, `trap_coffin_wood`, `leaf_portcullis`, `light_shaft`, `candle_ring`, `angel_statue` | bv_graveyard (Coffin, IronGate, Tombstone), gothic (807 names: walls, stairs, doors, posts), castlefort (ruined walls, gates), dreamkit / psx (bones, skull) | a floor dial with a lever post; a key model if no pack key fits |
| Missing Street | rubble plots, kerbs, lamps, railings at the drop, a retractable bridge, the refuge gate | the urban sheets, city lamps, `item_police_barricade`, `traffic_cone`, `wreckage`, the stairs pack railings, `city_*` pack buildings | ebd_sewers (debris), ebd_roads-procedural (Bridge), castlefort (ruined walls), gothic (GuardRail) | collapsed building rubble pile(s) |
| Two to Open | battery, two locks, splitter / corner machines, traces, consoles, gate | psx batteries (`psx_battery_*`, `psx_car_battery_1`), `gate_valve`, `signal_lever_frame`, `cable_drum`, psx pipes (straight / corner / cross / valve holder) | moltenmaps (Battery colours, Generator, Command Console, Wall Pipe, Wall Lights), ebd_mine (Cables, Generator), alxlab (WideDoorsLocked) | a lock receiver with a lamp |
| Root That Remembers | trellis (dormant / grown), root ramp, spring + valve, channel, cache | the glade's own trees, `stream` rows, `gate_valve` | ebd_vegetation, ebd_trees-psx, ebd_arboles | trellis and root ramp in two states |
| The Procession | bell, plate with footprints, cable, railings, gate | `ships_bell`, the stairs pack railings, `cable_drum` | gothic (GuardRail), metro (Railing), alxlab (Rail) | the floor plate with footprints |
| Turning Tomb | as Turning Crypt + low cover | as Turning Crypt | as Turning Crypt | as Turning Crypt |
| Missing Channel | pipes (straight, elbow), maintenance walkways, pump, valve, debris | psx pipes (straight / corner / cross / valve holder), `gate_valve`, `centrifugal_pump` | ebd_sewers (Pipe, debris), moltenmaps (Wall Pipe) | pump house if `centrifugal_pump` does not read |
| Traveling Door | stairwell, T hall, security desk, machinery | THE WORKS floor's props, Industrial's `maintenance_stairs` | gothic (Stair pieces), ebd_metro (Stairs, Railing) | none expected |
| Three-Rail Crossing | elevated catwalk + rail, launch stairs, wrecks | `railing_1m` (a grind rail), `wreckage`, city cars | ebd_mine (Rails), gothic (Stair, GuardRail) | a catwalk deck piece if the stairs pack has none |
| Three Little Worlds | chute, bowl, curved tracks, marbles, three sockets with symbols | `pipe` rows (`k: 'rail'`, model `pipe`) for tracks | ebd_vegetation, ebd_trees-psx | the bowl and the marble sockets |

Everything placed goes through the catalogue (data.js HQ_CATALOGUE_ALL) and therefore the editor can place it too (mondo: every
MODEL_LIST model placeable).

---

## 9. The phases (one thread each, in this order)

Every phase: read this doc + docs/notes/areas-complexes.md "PLOT DUNGEONS"; post a checklist; deliver per §6.9; write the phase's notes;
post each slice the moment it is playable (mondo tests it) and end with what he should try. The ten boards are approved as drawn
(mondo 11-14), so a slice phase goes straight to building; his play-testing drives changes. Dressing is test-grade: the look's sheets and
existing models, no new art.

### Phase 0 — The moving plot (engine proof, no content)

- **Build:** a dev-only zone of three 42 m test plots (plain look, behind `?pd=spike`) and the live-board pieces of §6.3: `hqWorldFrame`
  live frames for a pd zone, `pdJoins`, the rot / x / z tween, build-all for the zone, cache clears, `ThreeRenderer.hq.dev.pd()`.
- **Files:** data.js (hqWorldFrame, hqStageNeighbours path, a tiny `PD_DUNGEONS` spike row), three-renderer.js (`_hqStageRootPlace`,
  the ring / build-all, a `_hqPdMove` tween, `_hqPdTick`), map.js (`?pd=` boot).
- **Accept (offline):** `node --check` on the three files; load-data.js: `pdJoins` gives the right spans for all four poses of an elbow
  next to a straight; `hqStageRel` with fractional `rot` round-trips `hqStageToRoom` / `hqStageFromRoom`.
- **Accept (on screen, only if mondo asks for a playtest):** turn a plot with the officer in its chamber: no fall, no wall clip, the
  joined corridor walks straight through after the turn, no black dip, frame rate at or above the walk's; slide a plot with the officer
  on a fixed part; every part drawn; shadows and lamps follow.
- **Decision recorded:** primary works, or switch to the fallback (§6.3). Post it to mondo either way.

### Phase 1 — The test launcher + the kit

- **Build:** `bake-dungeons.js` (all of §6.1, with one tiny test slice), the `PD-BEGIN` / `PD-END` blocks, `pd` rooms skipped by
  bake-arenas.js and the directory, Settings > Developer > Open Plot Dungeons, `_goToPlotDungeons` + `pdSelectPage`, `_pdEnter` /
  `_pdLeave`, the pause, `ew-pd-save-v1`, the `pd_model` / `pd_control` counters, `_hqPdModel`, `_pdPanel` (preview, confirm, undo,
  reset), the seam rule, `doorSiteState`'s `pd` branch, the `PD` console helpers, THE SWITCH (pinned fight with named enemies on a fixed
  plot), the token bump.
- **Files:** bake-dungeons.js (new tooling), data.js, three-renderer.js, map.js, index.html, bake-arenas.js (skip `pd`).
- **Accept (offline):** `node bake-dungeons.js --dry-run` passes the test slice and fails a deliberately broken copy (a half-square
  blocker, a port off squares 5-6, a wrong solution); `node bake-arenas.js --dry-run` shows no pick change; `node --check` on every
  edited file; load-data.js compiles every pd room (`hqTerrainCompile`) and times it.
- The panel and the slice list follow the PS1 window rules; post a screenshot only if mondo asks for one.

### Phase 2 — ROTATE WITH A RIDER: 5.1 *The Turning Crypt* + 5.6 *The Turning Tomb*

- Both layout files → bake → the catacombs look (sheets, candles, bones, the light shaft) → the rotor and its dial → the fights (THE
  SWITCH) → the key (a find) → the gate (`leaf_portcullis`, pd state) → the memorial (no text; a carved image only, decided).
- **Accept:** the tool replays both solutions (2 turns each); each fight plot's field audit ≥ 48; `PD.solve('crypt')` / `PD.solve('tomb')`
  reach SOLVED in load-data.js; posted for his test.

### Phase 3 — SLIDE: 5.2 *The Missing Street*, 5.7 *Missing Channel*, 5.8 *Traveling Door*

- The slide tween, the vacancy pit + railings, the overlook / console plots, joins made by the arranged plots. Missing Street: the
  retractable bridge and the refuge gate. Missing Channel: the scripted water along joined pipes, the inlet fight. Traveling Door: ports
  at two heights (the stairwell), the security fight.
- **Accept:** shortest solutions 4, 3 and 5 printed by the tool; a join only opens when the arranged route is whole; slides refused while
  the officer stands on the board.

### Phase 4 — MOVES WITH NO RIDER: 5.3 *Two to Open*, 5.9 *Three-Rail Crossing*, 5.10 *Three Little Worlds*

- Two to Open: the traces (lit only along joined paths), two lock lamps, the AND gate, controls frozen while crossing (decided).
- Three-Rail Crossing: the +7 m catwalk with a grind rail, the launch stairs, the underpass recovery, the fight with a raised spot.
- Three Little Worlds: the loader, the scripted marbles on authored curves, the turn lock while a marble rolls, sockets that keep or
  return a marble, the three lit symbols.
- **Accept:** 4 presses, 3 alignments and 3 releases minimal; each lock lights alone; a fall from the catwalk always leads back to the
  launch stairs; a wrong socket always returns its marble.

### Phase 5 — STATE THAT TRAVELS: 5.4 *Root That Remembers*

- The part variant swap (`pd_root_B2` → `pd_root_B2_grown`, rebuilt once, behind the growth animation), the water from the spring, the
  ramp to +7 m, the upper exit and cache, the fight at the spring.
- **Accept:** the ramp only grows when the arm faces the spring; the grown ramp keeps its growth through every turn; the cache is
  reachable only with the ramp east.

### Phase 6 — ESCORT: 5.5 *The Procession*

- The guardian body and its lanes, the bell (one chamber per ring), the two detents, RECALL, the plate opening the gate, railings on the
  gallery.
- **Accept:** the hub refuses to turn unless the guardian is wholly inside H; the bell refuses a lane with no connected port; RECALL
  restores both.

### Phase 7 — Tune from his tests

- Fix what mondo's play-testing finds (pace, readability, camera on a turning plot, panel words). Then, when he says so: the Meshy list for
  missing pieces, lighting and atmosphere per look, MODEL_LIST.md, and the later plan for wiring dungeons into story mode (doors from
  zones, names, enemies per zone).
- **Accept:** every slice solvable from a fresh save; leave and come back keeps the board; every text fits in his theme.

---

## 10. Proof without a browser, and the headless limits

- **Default proof (no browser):** `node --check` on every edited JS; `node bake-dungeons.js --dry-run` (rules, solutions, minimal counts,
  field seats); load-data.js runs of the pure board functions (`pdJoins`, `pdApplyMove`, `pdSolved`) and `hqTerrainCompile` per room;
  Blender renders for any new model. Each PR says plainly what was **not seen on screen**.
- **Browser runs only when mondo asks for one in the thread** (RULE #1c; the auto-mode classifier refused headless runs in several
  Disaster City threads without his ask). When he does:
  - The cloud browser is WebGL 2 under swiftshader (his game defaults to WebGPU; his Mac renders brighter). Use the existing harness
    pattern (`playtest.js`, `ignoreHTTPSErrors`, `--use-gl=swiftshader`), Chromium already installed, `--trace off`.
  - Assets take about 5 minutes to land headless; the static batch only goes live at zero pending files. Judge frame counts after that.
  - GLB cars never draw headless (shadows only); don't chase that.
  - `ThreeRenderer.hq.dev.teleport` further than ~110 m puts the camera underground; teleport in short hops.
  - Screenshots take 15 to 40 s each; a timed effect needs a long hold. A headless window blurs on every evaluate and drops held keys:
    use `ThreeRenderer.hq.dev.press(key, on)` for walking.
- Ask mondo for his own look on: the turn (does riding read well, §13 item 7), the panel, the frame rate on the weak Chrome PC his friend uses.

---

## 11. Risks

| Risk | Where it bites | What to do |
|---|---|---|
| A draw path bakes world positions (static batch, instances, shadows) | Phase 0 | Keep moving parts out of that path with a flag; fall back to §6.3's blink if needed |
| `partsBuilt` and the one-hop ring | Phase 0 | Per-zone build-all for pd zones only |
| The current part is the origin, so the world turns round a rider | Phase 0, 2 | Turn the sky and every other part (decided, §13); mondo judges it in play |
| The fight path needs a `site` | Phase 1 | Decide by reading `hqEncounterLaunch`; keep bake-arenas.js skipping `pd` |
| A test room showing up in story mode before it is wired | Phase 1 | `pd` rooms never charted until the wiring plan; check the directory list and `hqWorldGraph` |
| The listed solution is not the only one | every slice | The tool prints the minimal count; mondo decides if a shortcut is OK |
| A soft lock | every slice | Rule 4.3.9: a control is always reachable; RESET always works |
| Facing faults | every slice | §6.6 checklist; facings in the plot's own frame |
| Missing art | Phases 2-6 | Pack first; plain stand-ins from existing models while testing; one Meshy list to mondo when the puzzles play well |

---

## 12. Files and functions, at a glance

| File | Existing pieces this work reads or extends | New pieces (names proposed) |
|---|---|---|
| data.js | `DOOR_HQ.rooms`, `HQ_WORLD.zones`, `HQ_STAGE_RULES`, `hqWorldFrame`, `hqStageRel`, `hqStageNeighbours`, `hqStageSpanAt`, `hqTerrainCompile`, `_hqTGenerate` (plan gen), `hqPlanFieldSeats`, `HQ_FIELD_RULES`, `hqFieldFrame`, `hqEncounterLaunch`, `hqRoomSite`, `doorSiteState`, `QUEST_FIGHTS` (shape), `hqRoomNatives` | `PD_DUNGEONS` (+ `PD-BEGIN/END` block), `PD_RULES`, `pdBoard`, `pdMoves`, `pdApplyMove`, `pdJoins`, `pdConnected`, `pdSolved`, `pdFrame` |
| three-renderer.js | `_hqEnter`, `_hqStageRootPlace`, `_hqStageRing`, `_hqStageOwner`, `_hqStageAsk`, `_hqStageEdgeOpen`, `_hqBuildDoors`, `_hqBuildCounters`, `_hqPlaceProps`, `_hqTickWalker`, `_hqSurface`, `_hqNavQuery`, `_hqSpawnRounds`, `_hqTickResidents`, `_hqChunkTick`, `hq.dev` | `_hqPdMove`, `_hqPdTick`, `_hqPdModel`, `_hqPdTraces`, `_hqPdGuardian`, `hq.pd`, `hq.dev.pd` |
| map.js | `_hqEditEnter` / `_hqEditLeave` (the template), `_hqInteractTarget`, `_hqOpenPanel`, `_hqEncounterFire`, `_hqStageCrossed`, `_openSquadDesk`, the Settings > Developer block (`_toggleRemadeLooks` pattern) | `_goToPlotDungeons`, `_pdEnter`, `_pdLeave`, `_pdInteract`, `_pdPanel`, `_pdSave` / `_pdLoad`, `_pdFight`, `PD` helpers, `?pd=` boot |
| index.html | the pages, the `?v=` token | `pdSelectPage` |
| bake-arenas.js | the site loop | skip rooms with `pd` |
| bake-dungeons.js (new tooling) | patterns from bake-disaster-city.js | the whole tool |
| docs/dungeons/*.json (new) | the shape of docs/disaster-city/city-layout.json | one layout per slice |

---

## 13. Decisions (mondo 2026-11-14 09:32 UTC: "just go with your recommended")

Settled; build on these. Change one only if mondo says so.

1. **Where they go:** a standalone test build now; part of story mode later (the old "no puzzles" lines in other docs do not apply). Not reachable
   from story.
2. **Entry:** Settings > Developer > Open Plot Dungeons. No main-menu button. Working titles from his packs; naming later.
3. **Slices:** all ten, no swaps (§5.1-5.10). The two crypt versions are two layouts on one engine.
4. **Fight party:** a saved team from the Squad Desk, every vessel unlocked (like Play VS CPU).
5. **Enemies:** placeholders from each look's area-unit list, one line each in the layout files: crypt undead × 2 + necromancer; tomb
   skeleton × 2; spring goblin × 2 + swamp monster; channel zombie × 2 + gangster; traveling door men in black × 2 + droid; rail crossing
   gangster × 2 + marksman. Real enemies follow the zone a dungeon ends up in and mondo's picks. No dungeon type is tied to a place or to
   enemies.
6. **Guardian:** golem.
7. **Riding camera:** the camera turns with the rider (the world swings round). mondo judges it in play.
8. **Two to Open:** the controls freeze while the officer crosses the gate.
9. **Art:** stand-ins from existing models while testing; the Meshy list goes to mondo once the puzzles play well.
10. **The memorial:** a carved image, no text.
11. **Proof:** offline checks per phase; a browser run only when mondo asks for a playtest in the thread.

Later, low priority (not for now): the names, wiring dungeons into story mode and its zones, final enemies per zone.

---

## 14. Log

- 2026-11-14 03:15 UTC: plan written. Both packs reviewed, all ten solutions checked, five slices picked, nothing built.
- 2026-11-14 09:32 UTC: mondo's answers. Amended: a standalone test build (dungeons join story mode later), all ten slices built, the
  recommendations taken as decisions (§13), enemies are zone placeholders. Next: Phase 0.
