# CYBERPUNK CITY, THE PLAN (2026-11-18, owner side; PLAN ONLY, nothing built)

mondo 11-18: "we need to start a thread to start making a plan to do the new cyberpunk city which is a reskin/reimagining of
current disaster city". 11-15: "cyberpunk city is not a district, it is going to be a reskin of the entire disaster city. Same
city but in the future." 09-17: "basically a reskin of disaster city but cyberpunk". 11-15: "Tokyo = for the Cyberpunk reskin".

**STATE (11-18): mondo answered the eight questions the same day (section 8). THE PILOT IS BUILT (section 9): the look for
Entertainment, behind the dev switch `?hqvariant=future`. It waits his look. Nothing wider is built before his OK.**

## 1. What was found

- **A neon switch already exists** (`hqCityShell({ neon: true })` + `terrain.gen.neon`, data.js / three-renderer.js, made 09-17
  for the old 208 x 168 m Cyberpunk room). Tried on today's Disaster City in a probe only (`--pre`, no file changed):
  `today_vs_test.jpg`, `test_neon_switch_street.jpg`. It gives a purple night and darker walls and NOTHING else: no neon names,
  no holograms, no lit windows. Why: the switch dresses the generator's own buildings, and Disaster City's buildings are the
  district files' `arch` rows, which it does not reach.
- **What is in small tables today** (cheap to give a second value): sky, fog, mood, grade (`hqCityShell`, `HQ_ROOM_LOOKS`),
  weather (`HQ_ATMOS_SITES`), music (`MUSIC_SITE_MOODS`), street lamps per district (the bake's `LOOKS`), ground sheets
  (`urban-decay.js` `GROUND` / `PAL`, `terrain.zones`), sign fonts (`sign-fonts.js`), kerb dressing (`props.js`), traffic kinds.
- **What is not**: the walls, the sign words and colours, about 25,000 tints, 6,300 glow parts and the district-placed props are
  written inline in about 1.3 MB of district files. Nobody rewrites those by hand; they are changed by RULE (see 2).
- **The room is already the heaviest in the game**: 3.8 MB of data.js, 240 s to load on the cloud probe, 7,609 draw calls,
  3.4 GB held (areas-complexes.md "ONE WORLD PHASE 5" numbers). Its id is named in 37 places (residents, links, the Sewers / Beach /
  Mountains tools, the map).
- **Art on R2** (MODEL_LIST.md searched: cyberpunk, neon, sci-fi, future, hologram, sign, billboard, drone, hover, robot, vending,
  arcade): NO cyberpunk pack, no neon sign / billboard / hologram / drone / flying car / tower model. What exists: `car_cyber`
  (one Meshy car), `leaf_holographic`, `leaf_futuristic`, `holo_projector`, `cyber_dish` and the other Internet pieces,
  `arcade_cabinet`, `pinball_machine`, `claw_machine`, `paper_lantern`, `jukebox`, `mirror_ball`, four vending machines,
  `robot_arm`, `iso_tank`, the cryo tube, the Metro PSX station pieces; code-drawn pieces: the neon name list
  (`_HQ_NEON_NAMES`), the hologram over a tall lot, `_hzHoloboard`, `_hzHoloPyramid`, puddle reflections, rain; four unused
  "night cities" skyline pictures (`Assets/world/sky/night_cities/`); the two cyberpunk police skins; units: ai, android, cyborg,
  droid, glitch, mech, robot, virus, tech ceo, time cop.
- **Story already written** (nothing invented here): Downtown is Room 1954, Cyberpunk City is Room 2047 ("the year on the
  lease"; one old comment says 2077). The way in mondo chose 09-17 was THE TIME MACHINE, "not just a regular door", in "a random
  basement or supply closet of the mall"; it is cut today (it jumped to the old room) and still stands as scenery.
  `docs/disaster-city/plan-direction.md` line 13: a time-machine glitch lets dinosaurs overrun the future city, robots and kaiju
  against them (not confirmed since). `docs/plans/npc-encounters/RACE-HOMES.md` homes eight races in "the future city": Ai,
  Android, Catgirl, Cyborg, Droid, Gangster, Mech, Robot.

## 2. What "reskin" means in the game: three options

| | A. One room, a second LOOK (recommended) | B. A second baked room | C. Only the existing switch |
|---|---|---|---|
| What it is | `site_prebuilt_downtown_streets` stays the only room. One new look file (`docs/disaster-city/future.js`) holds tables and rules; the bake writes them as a small `looks.future` block on the room; the game applies it when the room is entered in the future year | `bake-disaster-city.js --look future` writes a whole second room | sky + mood + tint, as in the test picture |
| data.js | + a few hundred KB | + 3.8 MB (every player parses it at boot) | + nothing |
| Memory / load in the city | as today (one look in memory at a time; the look reuses the sheets already loaded) | as today per visit | as today |
| District work reused | all of it; the nine district files (+ N, W, Q, L) are not edited | all of it at bake time, but every later district edit must be baked twice | all |
| The 37 places that name the room | untouched | each needs a second row (residents, links, three other tools' doors, map) | untouched |
| How deep the change can go | walls, signs, lights, props, people, by rule + by table; a district can add future-only rows in the look file | anything | not enough (see the picture) |

**A, the rules that reach the inline rows** (so nobody rewrites 25,000 tints): a tint rule per district (darker, cooler, wet);
glass parts glow; every `txt:` sign keeps its words and place and gets neon inks + glow (a table renames the ones that should
change); a sheet table by district and role (the `urban-decay.js swap()` pattern); a prop table `key -> key` (lamp, bench, bin,
bus shelter, vending machine, car kinds) plus add / drop rows; holograms over the tall buildings and roof beacons from the code
that already draws them. Engine work: the room variant code (`hqApplyRoomVariant`, shell + props today) learns to reach
`terrain` (arch parts, lamps, paint, traffic); three-renderer.js arch build reads the look. No new game files.

## 3. How the player gets there (the door audit's rules hold)

Recommended: **a year of the same city, not a place on the map.** The mall's supply-closet time machine (his own idea, already
standing as scenery) is switched back on: you step out of the same closet, on the same square, in 2047. No door crosses the
map (rule 1), it is a closet in a real building (rule 4). The year is one flag on the profile; every door, road and stair of the
city works the same in both years. It still needs his OK (a way that was cut comes back in a new form).
Other ways weighed: the clock (the city turns future at night: loses the present city's night), a story switch (the city turns
future for good: loses the present city), a subway train (a second way; could be added later).

## 4. What changes, layer by layer

| Layer | Today | Future look | Where it is set |
|---|---|---|---|
| Sky, weather | clock day / night, clear | its own night and its own smog day on the same clock; rain; the skyline pictures on the far edge | look: shell, atmos, dayLook |
| Ground | asphalt, pavement, 6 sheets | the same sheets wet and darker, puddle reflections, lit road paint | look: ground table |
| Walls | district arch rows, 119 urban sheets | same shapes; tint rule per district; a sheet table (metal, dark glass, tile); glass glows | look: rules + table |
| Signs, neon | 560 painted signs | same signs lit in neon inks; extra neon names, holograms on tall buildings, roof beacons, holo billboards | look: rules + rows |
| Lights | 288 lamps, a colour per district | magenta / cyan / amber by district; strip lights along kerbs | look: lamp table |
| Street props | benches, bins, shelters, hydrants | table swap to what exists (vending machines, holo projectors, arcade pieces, lanterns in the Tokyo lane); nothing new modelled without his OK | look: prop table |
| Vehicles | suv, cadillac, cop car, taxi, truck, bus | `cybercar` added; the rest stay until he approves more | look: traffic kinds |
| Who lives there | 150 residents, 9 districts | a second `people` list: the eight future-city races + the cyberpunk police skins, the same jobs and homes | data.js spawn rules (the NPC row is the second side's: board note first) |
| Music | `urban` | `cyber`, `electronic`, `urban` | look: music |
| Subway | (planned) five stations, one platform room | the platform room wears the same year: neon strip lights, a holo timetable, the same Metro pieces; the street stair heads get a lit sign; trains do not change the year | a look on the platform room |
| PvP | Downtown board, old Cyberpunk board | untouched (the old two rooms stay the Cyberpunk board's source) | nothing |

## 5. What stays the same

The street grid, the 144 plots, every building's shape, floors and insides, every door and link, the heights, the Hills, the
beach and the sea by Bayside, the ways out to the other zones, the map, the district files, the fight boards.

## 6. Build order (each step ends in a proof picture; no step starts before the one before it is OK'd)

0. His answers to the questions.
1. THE PILOT: the look for ONE district, Entertainment (it has the Little Tokyo lane and the arcade pieces), behind a dev
   switch only (players cannot reach it). Proof: day + night pictures from the street and from above, beside today's, with
   the draw-call and memory numbers beside today's.
2. The engine piece the pilot needs, in the same PRs (the variant reaches terrain; the arch build reads the look).
3. The shared layers for the whole city: sky, weather, ground, lamps, traffic, music.
4. District by district, one section of the look file each: F, H, C, U, B, S, I, R, then the Hills and the beach.
5. Who lives there (with the NPC holder).
6. The subway platform's look (after the door audit thread's loop is built).
7. The way in is switched on for players (the time machine), the map shows the year. Last.

## 7. Questions for mondo (asked in chat 11-18)

1. One room with a second look (A), not a second room?
2. The way in: the mall closet's time machine, stepping out in the same closet in the future?
3. The year: 2047?
4. In the future year, do the roads out of the city work as usual, with the rest of the world unchanged?
5. The dinosaurs in the future city (plan-direction.md): still wanted?
6. The sky: blue-black with the neon giving the colour, or the purple haze of the test picture? Clock or always night?
7. Missing art (flying car, drone, future lamp, big sign frames): go without, or a short Meshy list?
8. The pilot: Entertainment?

## 8. mondo's answers (2026-11-18, in chat)

1. A: one room with a second look. 2. Yes: the mall closet's time machine, the same closet in the future. 3. "2047 for now".
4. "Yes for now": the roads out work, the rest of the world is unchanged. 5. The dinosaurs: "Yes but we can add the dinosaurs
when we get to that quest". 6. THE SKY DOES NOT CHANGE: "Just keep the sky the same as it is now, the sky wouldn't change just
bc its the future, day is still day and night is still night" (so: no neon shell, no purple, no locked night, no rain added;
section 4's sky row is void). 7. "Approve short meshy list or make stand ins (a billboard is just a rectangle, surely you can
make that)". 8. Yes: Entertainment.

## 9. THE PILOT, as built (2026-11-18)

- data.js only, no new file, no district file or baked row edited: `HQ_CITY_LOOKS.future` (the table) + `hqCityLookTerrain()`
  (the rules) + one line in `hqApplyRoomVariant` (a variant with a `look` gets its terrain made by rule) + the city's one variant
  `future` (set outside the baked block, so a rebake keeps it). The look file of section 2 became this data.js table: simpler,
  and nothing has to be baked.
- The dev switch is the room variants' own: `?hqvariant=future` or `window.EW_HQ_VARIANT = 'future'`. The variant has no `when`,
  so it is never rolled: players cannot reach it.
- What the rules do inside a district's box (`boxes`, one box = one district; the pilot's is Entertainment): every unlit part's
  colour x (0.56, 0.58, 0.76); glass lit from inside, one colour a building; every painted sign relit (a neon ink, a dark board);
  signs that were neon already, cloth banners, decals and gold are left; every building with a footprint row gets a neon line
  round its roof and, when 5 m wide or more, a lit billboard on two posts (the words are the old Cyberpunk room's own sign
  words). Every second `suv` in traffic is the cyberpunk car.
- Counted: 125 rows re-dressed, 60 signs relit, 111 glass parts lit, 22 billboards.
- To give a district the look: add its box to `HQ_CITY_LOOKS.future.boxes`.

## 10. PASS 2 (2026-11-18, after mondo saw the pilot)

mondo: "almost all of the brick building textures need to be replaced, needs to be futuristic and sci-fi and chrome and neon and
metal and glass and like cyberpunk 2047 or 2001 a space odyssey retro futurism. this isn't nearly enough yet, at all. needs to
look like futuristic version of Tokyo."
- The tint rule is gone. Every old wall sheet (brick, plaster, stucco, concrete, wood, corrugated iron, roof tiles, marble,
  truss: `wallRe`) is REPLACED by the building's finish, one of five by the row's hash (`finishes`): chrome `MetalPanel2a`, white
  `MetalPanelPainted1a`, blue glass `GlassGeneric3a`, brushed steel `MetalGeneric1a`, black steel `MetalPanel1a` (all Urban Decay
  sheets already on R2). Sheetless parts go steel grey. 2,787 parts refinished in Entertainment.
- New part field `shine` (three-renderer.js, the arch build): a polished part's shininess and a cool highlight.
- Per building: a neon line round the roof, round every storey and down the four corners; a lit fascia over the ground floor; a
  roof billboard (29); a blade sign of stacked lit kana squares (24); a hologram word over a roof 6.5 m or taller (14, two faces
  so it never reads mirrored). Entertainment's lamps are cyan.
- A building's plan and height are measured on its own wall parts (a footprint row can stand turned or off centre from its arch
  row: the first cut drew cages in the air beside buildings).
- Pictures: `pass2_*.jpg`. Known limits: the engine has no reflections, so chrome reads as bright steel; the buildings' shapes,
  the ground and the palms are the old city's; long blank side walls stay blank.

## 11. PASS 3, HEIGHT (2026-11-18)

mondo, offered height / ground + trees / reflections: "let's just do 1 (height) for now".
- `HQ_CITY_LOOKS.future.tower`: a tower stands OVER 23 of Entertainment's 29 buildings, on four legs, 3.5 m clear of the old roof
  (the roof, its stairs and its routes are not closed or moved; the tower has no collision). 5 to 16 storeys by the row's hash
  (2 to 4 on a plan under 7 m); from 8 storeys the top 40 % steps in. Lit window sheets (Urban Decay, on R2), steel corners in
  the building's finish, a neon line every second storey, a cap, a mast + beacon from 10 storeys, the building's sign on the
  tower's two long faces, a hologram over the tall ones, a lit soffit over the old roof.
- `sky`: 19 glass skyways, each tower to its nearest tall neighbour (9 to 46 m), rows of their own (`look:sky:<i>:<j>`).
- A row's frame to the room's: `wx = row.x + lx cos(-rot) + lz sin(-rot)`, `wz = row.z - lx sin(-rot) + lz cos(-rot)`.
- Pictures: `pass3_*.jpg`. Not measured: draw calls and memory (the cloud browser crashed on several runs, with and without
  the look). Not done on his word: ground, trees, reflections.

## 12. THE WHOLE CITY + NO SIGNS (2026-11-18)

mondo: "go ahead and do this look on the rest of the city districts, at least on the buildings it makes sense. also the big neon
2047 signs is fucking retarded. I am going to do a neon sign and font pass later so stop making stuff we are gonna have to undo
later".
- **THE LOOK WRITES NO WORDS.** The holograms, roof billboards, blade signs and tower signs of passes 1 to 3 are removed, and the
  old city's own signs are no longer relit or recoloured: they stand exactly as their districts wrote them, for his sign and
  font pass. Do not add sign content to the look.
- `boxes`: all nine districts (C F E / U H B / R S I), each with `p` (share of buildings a tower stands over) and `n` (storeys):
  Hero Plaza and Financial tallest, Industrial low. The Hills, the Shore and the Quay have no box.
- "The buildings it makes sense": `keepPlots` (a row whose id holds one of these plot names stays the old city's: the Church, the
  Fire Station, City Hall, the Civic plaza, the Courthouse, the Public library, the Goblin Bank, the Observatory, the old campus,
  the Science museum, the Hero plaza, the Memorial walk, the Museum, the Wrestling hall, the parks, the Marina lookout),
  `keepRows` (street pieces, monuments, weeds, fires, subway heads, piers, cranes, tanks, and every INSIDE row `:in` / `-in`),
  `noTowerPlots` (re-clad, no tower: the Superhero Tower, the Power station, the Transformer yard, the Concert hall).
- A building = an arch row whose id shares its name token (`P08-04-B1`, `in76`) with a `texbuilding` row.
- What the look adds (lines, fascia, towers, skyways) goes into ONE row a district, `look:add:<d>`, in the room's own metres, so
  every building's parts of one colour are one mesh. A tower is never taller than 2.6 x its building's narrow side.
- Counted: 217 rows re-clad, 304 kept, 4,497 wall parts refinished, 623 glass parts lit, 102 towers, 56 skyways.
- Pictures: `city_*.jpg`.

## Pictures in this folder

`today_day.jpg` (the city today, above the main road), `test_neon_switch_above.jpg` + `test_neon_switch_street.jpg` (the same
city with only the existing switch, probe only), `today_vs_test.jpg` (side by side). `[EW BUILD] HEAD 545a085`.
The probe line: `node playtest_city.js site_prebuilt_downtown_streets '<views with "y">' --pre='<js that sets the room's shell
sky / mood / look from hqCityShell({neon:true}), terrain.gen.neon = true, and locks the hour>'`.
