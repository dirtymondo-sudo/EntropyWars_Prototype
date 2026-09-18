# DOOR HEADQUARTERS — BUILD PLAN
### The walkable facility that replaces the Play menu · rev 63 — THE THIRD RING + 7.7 WAVE 2 BEGINS, local, not uploaded (2026-09-16): the rotunda's THIRD LEVEL — `shell.ring3` on the hall, a second ring slab 3.3 m over the mezzanine (the same radii), ONE curved flight off the mezzanine's walkway at 278°–312°, the four EXPLORATION doors (Arcane Engineering, IT, the Observatorium, the Executive Suite) rode up and the mezzanine keeps the bays and the elevator (8.4 / 9.3 "the crowding"); every rotunda level reader goes through `_hqLevelY` / `_hqLevelR` / `_hqLevelOf` and the ring is a LAYER of `_hqSurface` (`_hqRing3At`), a mass in the air and a wall to the boom; `hq-ring3.test.js` climbs it. And the FIRST WAVE-2 SITE: **345 · THE BERMUDA TRIANGLE** (Hollow) — two right triangles of shoal meeting at a deep hypotenuse, the sandbar at the centre the one crossing on foot, the corner buoys, the lighthouse on the 90° corner, the sea streaming at half the Dutchman's pace with the storm from round 3; the 7.10 checklist end to end (full map, Δ, meta, site file, threshold, the site room on the Dutchman's moat recipe, `_NR_BUILDERS.bermuda`, MAP_POOL, two tapes re-homed) and THE WEIR — Room 8's infinity pool goes over the edge into it (`links.weir_bermuda`, a `pool` way at both ends, route THE DEEP). Not built: the waterspout, Flight 19's flyover, the yacht as the quay. §9 2026-09-16 (rev 63). Previous: rev 62 — 9.2 stage 4 THE URBAN BLOCK ships, local, not uploaded (2026-09-16): the fifth and sixth complexes in one delivery — THE STRIP's board room keeps the boulevard and THE CHAPEL (a drive-through wedding chapel behind the motel door on its one free north lane: the altar on its dais behind the rail, six pews, the register open at your surname, the King officiating) opens onto THE CASINO FLOOR (eight machines that spin on a ticker — a new `slot_machine` proc — two blackjack tables, the cage, the bar, three eyes in the sky, no clock, no window, one door); DOWNTOWN's board room keeps the intersection and THE TOWER LOBBY (on its EAST wall — the north wall carries the highway's three doors: the front desk, the couch, two columns, the cordon before the stair that is gone, the clock at 1954) has the stair down to THE PLATFORM, the subway route's third station (`links.subway_downtown`: the train stands FREE on the platform's own track — a link end on a complex part — and its far end is a plain stair mouth on Cyberpunk's last free north lane, the first `way` link with a `leaf` at one end; three `turnstile` gates, a new proc). Four tapes re-homed from the floors (the garage, the kitchen, the cold room, the dungeon); the platform's finds pinned off the track. `hq-urban.test.js`. §9 2026-09-16. Previous: rev 61 — 9.4 THE ENCOUNTER STAGE 2 ships, local, not uploaded (2026-09-15 rev 24): THE EYE — the first battle frame is the walker's own camera (`ThreeCamera.seedPose`, the one new entry point in three-camera.js; data.js `hqEncounterEye` turns the renderer's eye into board tiles; no VS card, no cinematic, an eased 1.4 s move onto the match's frame), THE CLEARED ROOM — a native you beat is gone from the room until tomorrow (`door.hq.cleared`, `hqEncounterCleared`) and THE GUARDED ENVELOPE it sat on glows (`hqRoomGuarded` → `guard` on the pay row), THE WARD'S CHART reads RECOVERING the day you were exited. The `spawnSide` mirror is NOT built for a reason (§9 rev 24). Previous: rev 60 — 9.8 SKATEBOARDING STAGE 1 ships, local, not uploaded (2026-09-15 rev 23): B drops the user's deck — momentum, the ollie, grinds locked to every rail the builders publish (the mezzanine's round railings first), the quarter pipe (a real curved surface; two face each other in the garage), flips / rolls / spins / the grab in the air, the trick line and the banked best on the OFFICER sheet; a walker mode, nothing on state (§9 rev 23; Part C row 32 DECIDED). Previous: rev 59 — 9.3 THE SEAMS, THE SECOND BATCH ships, local, not uploaded (2026-09-15 rev 22): six more entryways that are not doors — the MIRROR (Occam's Barbershop ⇄ E4 the Looking-Glass, a FREE end on the marble strip: the last site joins the world), the PLUNGE POOL (the natatorium's deep end ⇄ 1717's bilge), two PAINTINGS (the Lodge ⇄ Olympus; the Bureau ⇄ the Vatican, the Bureau's own gate on it), the HEARTH (the North Pole ⇄ the Haunted House's hall, the flame goes green), the SCREEN (Room 360 ⇄ Room 0) and the CLOSET (Nuketown ⇄ the house upstairs) — `DOOR_HQ.ways` ×6, seven `links` rows on THE SEAMS, six `_hqWayBuilders`, five sounds; `hqDoorNo` reads a room numbered on its own door. `phonebox` waits on A14. §9 2026-09-15 rev 22. Previous: rev 58 — THE VEHICLE BATCH + 9.3 THE TRAIN ships, local, not uploaded (2026-09-15 rev 21): nine Meshy vehicles (`_VEHICLE_KIT` / `_hzVehicle`) park in Room P1 and on the five URBAN settings; the `train` way is the third seam kind — THE SUBWAY route, the tunnel's platform ⇄ Cyberpunk, the train ARRIVES (§9). Previous: rev 57 — 9.2 stage 2 THE GALLERY ships, local, not uploaded (2026-09-15 rev 20): two floors in ONE box room — `shell.gallery = { h, side, w, stairAt, rail }` (three-renderer.js `_hqGalleryFrame` / `_hqGalleryAt` / `_hqBuildGallery`) hangs a slab along one wall with a closed-string flight at one end and a banister on the open edge; the walker reads it as a LAYER of `_hqSurface` (the flight → the slab → the floor under it), a door on the gallery's wall stands on the slab (`_hqDoorFloorY`), the boom and a jump know both, `stairAt: null` is the door gun's ledge. The first is THE HALL of the Haunted House: THE LANDING at 2.9 m along the north wall (the room grew to 5.8 m), the staircase door standing on it, the stair / banister props retired; `hq-gallery.test.js` CLIMBS it by the step rule alone. Also fixed: a box door was found by the rotunda's level (the stairwell's landing door at y 6 was unreachable) — it is found by height now. §9 2026-09-15 rev 20. rev 56 — 9.2 stage 3 THE FLYING DUTCHMAN COMPLEX ships, local, not uploaded (2026-09-15 rev 19): Room 1717 is THE MAIN DECK on its quay plus three decks below — THE GUN DECK (four of the ship's own guns run out, the misc bucket's cannon as a catalogue prop), THE CAPTAIN'S CABIN aft (the stern windows, the table, the log open at tomorrow) and THE HOLD (the ballast tiers, the bilge, the spare anchor, and THE DEEP's hatch to Atlantis moved off the deck BELOW THE WATERLINE — a link end on a complex part, the spaceship's rule); `siteRooms.backDoors.prebuilt_revenge`, four misc-kit catalogue rows (`ship_cannon` / `sea_chest` / `ship_anchor` / `ship_lantern`), three tapes re-homed from the floors (the hundred stays a hundred); `hq-dutchman.test.js`. §9 2026-09-15 rev 19. rev 55 — 9.2 stage 2 THE SPACESHIP COMPLEX ships, local, not uploaded (2026-09-15 rev 18): Room 426 is the DORSAL DECK plus three compartments — THE AIRLOCK (the Lunar route's two docking collars moved off the deck into it, as 9.3 stage 1 promised), THE CARGO HOLD (the crates, the cryo pod still running), THE BRIDGE (the viewport is the sun); `siteRooms.backDoors.prebuilt_derelict`, three tapes re-homed from the floors (the hundred stays a hundred); `hq-spaceship.test.js`. Same delivery: THE CHECKLIST BUG — `mergeProgressBlobs` refused any unlock key with a colon, so the server sync two seconds after every match commit dropped the `site:<map>:<cond>` flags and un-ticked the stabilization checklist; fixed in data.js, and a sudden-death Key win now files THE KEYS (`state._winCause`). §9 2026-09-15 rev 18. rev 54 — 9.4 THE CLICK (the user's correction, 2026-09-15 rev 17: the door gun holstered, LEFT CLICK is the attack — at a native, the room is the board; drawn, the click places a door; the 1–4 keys are gone; §9 2026-09-15 rev 17); rev 53 — 9.4 THE ENCOUNTER stage 1 ships, PLAYER-INITIATED (the user's rule: never random; §9 2026-09-15 rev 16); rev 52 — PHASE 8 STAGE 2 ships, local, not uploaded (2026-09-15 rev 14): TWO MORE FLOORS on the car — 2 · THE WORKS (the door works with its belts and arms, the incinerator, the autopsy room, the door garden, the control room, the lost and found, THE STAIRWELL that loops you back to its own top landing, THE TUNNEL, THE MIDWAY at the end of the line) and 4 · THE LABS (the dream lab and its tank, THE MANDELA ROOM that is a different room on every entry, the upside-down room, Supply Closet 4B behind its L6 blast door, Clone Disposal with the other one of you in the chair); a box door may carry `y`, a prop may `flip`, a spot may `say` (ROOM DIALOGUE — the conspiracy theorist at the sink) or be your `clone`, a variant may roll on `each` entry. §8.6, `hq-stage2.test.js`. See §9. rev 51 — THE DOOR GUN ships, local, not uploaded (2026-09-15 rev 13): Phase 9.5 stage 1 — THE PORTABLE THRESHOLD: F draws it, a ghost frame follows the aim over the room's own walkable surface set (green / red with a reason), LEFT CLICK places THRESHOLD A, then B, then A moves (Portal's rule), Q holsters; walk into one, step out of the other (a hop in the same room, the ordinary room change to another); ONE profile record (`door.hq.portal`, data.js `hqPortalStatus` / `hqPortalPlace` / `hqPortalIssue`) rebuilt on every entry and cleared on a fresh arrival from Play; the Quartermaster issues it at KEYHOLDER for 24 Keys (row 31 REC), `?portal` forces it; the placed door is a FREE box-wall `_hq.doors` record so the scan, the swing, the press-in, the landing and the camera blocker read it unchanged. `hq-portal.test.js`. See §9. rev 50 — THE FINDS + THE TAPES ship, local, not uploaded (2026-09-15 rev 12): Phase 9.1 stage 1 — `DOOR_TAPES` (the hundred, T001…T100, two per site with one ON THE BOARD and `hard` on a wall cell, one per complex part, one per floor room), `DOOR_HQ.finds` generated by `hqBuildFinds` / `hqFindSpot` (the far corner clear of every blocker), a daily pay envelope per room, `hqCollectFind` (one profile transaction), the renderer's sparkle + `hq.takeFind`, map.js `_hqTakeFind` + the toast + the `#hqTapes` pill, THE SHELF in Room 360 (a CRT that plays a found tape's clip; blanks play static); potions / items / cubes reserved. `hq-finds.test.js`. See §9. rev 49 — THE DUNGEON ships, local, not uploaded (2026-09-15 rev 11): every cave chamber is a CAVE GRID (`cave.rows` — rock, floor at half-tile levels, 24 ramp letters, bridges, water, lava; `hqCaveCompile` / `hqCaveFeet` / `hqCaveDoorY` / `hqCaveReach` in data.js, `_hqBuildCave` + `_hqSiteFloorY` in three-renderer.js); THE CAVERN is 52 × 42 m on three tiers with its six doors scattered up them, the well heads on three tiers; hq-cave.test.js SOLVES every chamber with the walker's own step rule. See §9. rev 48 — THE WELLS AND THE CAVE ship, local, not uploaded (2026-09-15 rev 10): every well in the world drops into ONE cave — Hollow Earth's complex of seven chambers (THE WELL ROOM with a head per well, THE GALLERY, the fissure into Hell, LEVEL −6 into D.U.M.B., the crystal adit into Agartha, the mouth onto Hollow Earth, and THE OUBLIETTE whose back wall is Room 24601's — the eighth secret door); six wells (the garden, the cellar re-pointed, Camelot, the ranch, Nuketown, Göbekli) on the new dashed route THE UNDERCROFT; a link end may name its own plate line and verb (CLIMB UP) and `hqRefreshComplexLinks` now serves hand-authored rooms too. `hq-cave.test.js`. See §9. rev 47 — THE SUITES ship, local, not uploaded (2026-09-15 rev 9): a department gets ONE hall door onto its own lobby — THE MEDICAL WING (210° → Room 1111, Room 5150 behind it, Room 1984), THE RECORDS WING (240° → Room 42, Room 247) and THE EXECUTIVE SUITE (315° → Room 111, the Bureau, whose gate and CONTESTED number stay on its OWN door). −2 on the ground ring (225°, 255°), −1 upstairs (290°). `hq-suites.test.js`. See §9. rev 46 — Phase 9 grows again (2026-09-15 rev 8, docs only, nothing built): THE WELLS lead to THE CAVE (the garden's well, the cellar's well and more wells all drop into one cave system whose exits are Hell, D.U.M.B., Agartha and Hollow Earth — 9.3), three new places (THE ROOFTOP of the headquarters — "not what you'd expect"; 1812 · TARTARIA; 345 · THE BERMUDA TRIANGLE — "it's a right triangle" — 7.3 / 7.4 / 7.7), and, super optional after skateboarding, WATER POLO in the natatorium from the user's water polo repo (9.9). Part C rows 33–36 owed. See §9. rev 45 — Phase 9.3 THE ROUTES + THE WORLD TAB ship, local, not uploaded (2026-09-15 rev 7): 32 links on nine lines (every built site but the Looking-Glass a station), `DOOR_HQ.routes`, `hqLinkLive` / `hqWorldRoutes`, the directory's subway map (`_hqWorldHtml`). See §9. rev 44 — Phase 9.3 THE SEAMS THAT ARE NOT DOORS ship (first two), local, not uploaded (2026-09-15 rev 6): the WARDROBE upstairs in the Haunted House climbs into Camelot's snow, the WELL in its cellar goes down to Hollow Earth — `DOOR_HQ.ways` (the kinds' catalogue and gate), `way` link rows with a free-standing end, `_hqWayBuilders` + `_hqBuildWay` in the renderer, the verb on the prompt, two sounds. See §9. rev 43 — Phase 9.2 stage 1 SHIPPED LOCALLY (2026-09-15): THE HAUNTED HOUSE COMPLEX — Room 13 is four rooms behind its board room (the hall, upstairs, the attic, the cellar), `siteRooms.backDoors` an array, `hqSiteComplex` / `hqRoomSite` / `hqComplexRoomId`, a `{ site, part }` link end. See §9 and the implementation review below.

Previous revision history: rev 42 (2026-09-14 local / 2026-09-15 UTC — Phase 9.3 Lunar pilot implemented locally: Moon ⇄ Derelict ⇄ Saturn through ordinary bulkhead doors in the three existing board rooms, `DOOR_HQ.links` / `hqLinkDoors` / `hqWorldGraph`, `siteRooms.backDoors` accepting an array; §9); rev 41 (2026-09-15 rev 5 — Phase 9 grew THE SEAMS THAT ARE NOT DOORS (a `way` on a link: the wardrobe into Camelot, the mirror, the well, the pool, the painting, the hearth, the phone box, the screen, the train — ten kinds, each with a first seam) and 9.8 OPTIONAL SKATEBOARDING (a walker mode: `_hqRide`, grinds on the published rails — the round railings are the point — ramps, tricks, THE PARK RULE for every new room; Part C row 32); rev 40 2026-09-15 rev 4 — PHASE 9 PLANNED, nothing shipped: THE WORLD — the user's five-part brief (glowing hidden FINDS and a hundred collectible TAPES carrying the user's own anomaly clips; sites that are whole BUILDINGS — the Haunted House as a mansion with an upstairs, an attic and a cellar, the Dutchman's and the Spaceship's decks, the urban block; the WORLD GRAPH — a door in one site that leads to a related site, the Moon ⇄ the Spaceship ⇄ Saturn, the Dutchman's hold ⇄ Atlantis, ten routes across all 29 sites, and SUITES + a third-ring GALLERY to thin the hall; the ENCOUNTER — a roamer in a wild room, attack it and the room becomes the board with the walker's own camera as the first frame; THE DOOR GUN — two placeable freestanding thresholds, reach puzzles and the escape rope) — §4 Phase 9, Part C rows 25–31 for the user; §9 2026-09-15 rev 4; rev 39 2026-09-15 rev 2 — 4.4 THE BUREAU OF CONTINUITY + THE MOTTO PLAQUE SHIPPED: the Canon Office is a box room behind the mezzanine's house door at 315° (the GATEKEEPER + 24 Keys gate and the number № — CONTESTED stay on the door), THE MOTTO PLAQUE on its north wall is THE REALITY BAROMETER (MASTER A7: the plaque reads the chapter band — the clearance until 4.1 lands — L1–2 DO OBSERVE OTHER REALITIES · L3–4 DON'T. OPEN. OBSERVE. REPORT. · L5–6 DO OPEN OUR REALITY; data.js `hqMottoBarometer` / `HQ_MOTTO_BANDS`, the story hook `door.mottoForm` / `_doorSetMotto(n)`, the dev override `?motto=`), every fresh arrival files the reading (`hqMottoObserve` → `door.hq.motto`) so a wording the plaque no longer reads is what YOU REMEMBER and nobody else does, CANON NOTICES on the east wall is every retcon the building has made (`hqCanonNotices`, generated: the motto, one CORRECTION per remembered wording, the ladder, no 13, Bay 6, the front door, H-Wing, today's cleared Code Red, Room 86 after hours), the notices are ON THE BUREAU'S DOOR in the hall (readable at any rank) and the motto is on the loading card; the Canon Officer, the Continuity Clerk, the one clock that is right; §9 2026-09-15 rev 2; rev 38 2026-09-15 — 7.4 THE FOURIER FOYER SHIPPED, the last row of the register's department table: the vestibule between the main menu and the hall — a box room SOUTH of the egress behind the kit's revolving door at 195° (the one free stretch of the lower wall, between the Training Room and Medical), THE FRONT DOOR on its south wall whose street side IS the main menu (the strip's EXIT as a door), the seal inlaid in the terrazzo (`door_seal`: the department's name and the Customs & Admissions slogan round the rim, a door in a square in a circle in the middle), CORNER INSPECTION on the east wall (the loading card's "verifying your corners…" as a desk and a by-id panel — four, ninety, PASS; data.js `hqCornerInspection`), the mat that says WIPE YOUR CORNERS, the umbrella stand, the visitors' bench, the inspector and the doorman; and THE SPAWN-IN-THE-FOYER DECISION taken the way the row said it would be — a fresh arrival from Play stands just inside the front door and walks IN through the revolving door (map.js `_hqArrivalRoom`; `?nofoyer` / `ew_hq_foyer='off'` / `EW_HQ_NO_FOYER` land in the hall as before; returns from a screen or a match still land where you left); no number (a foyer, 7.0 rule 2); §9 2026-09-15; rev 37 2026-09-14 rev 4 — 5.5 H-WING STAGE 1 SHIPPED, built OPEN as end-game (the user's rule: everything unlocked now, the gates later): the forbidden straight corridor beneath the facility — THE STAIR down from the garage's west wall (P2, the level the ramp does not go to) into the H-WING lobby (the floor plan, the car's door that the car never arrives at: H is on no button), THE WEST LEG (48 m, straight, beige carpet, drywall, fluorescents, blank plates, four office doors, the EXIT at the end = the Backrooms crossing, C-12 — it walks into Room 90's site room, whose new BACK DOOR (`siteRooms.backDoors`) comes back, never through sealed Bay 6), THE CROSSBAR (HOME — the childhood-home threshold as SCAFFOLDING: the hallway only, the stairs that end at the ceiling, the phone that rings with ANSWER disabled until A14 Q5 is written, the kitchen door that opens onto the front door — THE TYPING POOL with six SQUARE cubicles and the online shift at them, THE BREAK ROOM), THE EAST LEG (four more office doors, the far end opening onto the west leg's start — the corridor repeats, A0 #8 — and its near end the room at the end's SECOND wall that is not a wall, the sixth secret door), and THE OFFICE — ONE room behind all eight office doors whose way out is always the first door of the west leg; two procs (`square_cubicle`, `house_stairs`), two by-id panels (the floor plan, the phone), no numbers anywhere (a wing, 7.0 rule 2), the wing's plain leaf is `leaf_coffee` (never the L2 rank leaf); THE DOOR THAT OPENED THE SETTINGS fixed (every room entry re-appended the shared canvas into the host, moving a pointer-locked element drops the lock, and C-28 read that loss as the eaten ESC — the canvas is appended only when absent now and a loss inside the swap window is never an ESC); §9 2026-09-14 rev 4; rev 36 2026-09-14 rev 3 — PHASE 8 STAGE 1 SHIPPED: THE EXPLORATION FLOORS — the elevator is THE CAR (a room; its FLOOR PANEL rides to B · G · M · 3 · PH, the PH button wearing the old KEYHOLDER + 12 Keys gate, `DOOR_HQ.elevator.stops`), three new floors and an undercroft on no button: G · THE GARAGE (Room P1 and THE RAMP, the first landmark — daylight behind a barrier arm you cannot pass; the loading dock beside it up into the laundry), B · SERVICES (the kitchen 350 under the Cafeterium with a stair up into it, the cold room −18 whose back panel is a SECRET DOOR, the laundry 60, Service Corridor A, the boiler room 451, Service Corridor B — thirty metres of dark with one red EXIT sign at the end — the room at the end, the server room 127 under IT with a stair up), B2 · THE UNDERCROFT (the dungeon 24601, the ritual room 333, the sacrifice room 322 with FORM 322 the waiver, Room X and the object that floats) and 3 · THE ANNEX (the lecture hall 314 with the type wheel on the board, the cubicle floor 9-5 where the online shift sits, the bathroom WC whose third stall is a secret door into a crawlspace with a ladder down to Room 322, the locker room 26, the natatorium 50M, the garden 1618 — open air under Olympus's sky, a fountain, a hedge ring, and the gate at the back an L5 opens into Room X); five secret doors, nine loops, forty-four new procs; ONE HOME PER FUNCTION (C-27: the ID card at Reception only, the leaderboard at the hall's board only, the shop at the Quartermaster only, Challenge at Medical only, the achievements at Room 111 only, the case file at Room 101 only — the duplicate counters are panels or props now); THE PAUSE (C-28: P = ESC, and a pointer-lock loss the game did not ask for IS the ESC the browser ate — in the building and in Strike Mode); §9 2026-09-14 rev 3; rev 35 2026-09-14 rev 2 — 5.4 STAGE 1 + 7.4 ROOMS 4C + 8 SHIPPED: the ELEVATOR rides — KEYHOLDER rank + 12 Keys at the mezzanine door, unchanged — to THE PENTHOUSE, the executive lobby (no number; a floor): THE FLOOR PANEL by the car (sixteen buttons, two lit — M is the way down, PH is where you stand, there is no 13), the assistant, the guard, and two doors off it — Room 4C · THE CORNER OFFICE (your office once the ladder passed L3: THE IN-TRAY is the closet’s case file moved up, THE PLAQUES are the achievements engraved on the wall, THE WINDOW that should not exist looks out on the seven bays with the count on file for each; the closet and its rank door stay yours) and Room 8 · THE INFINITY POOL (an OPEN room under Heaven’s own sky behind a knee-high parapet, the cloud plain running out past it over the void, the raised basin with a weir the water goes over, loungers, umbrellas, palms, THE EDGE, THE RANKING → the leaderboard, the online shift on the loungers); §9 2026-09-14 rev 2; rev 34 2026-09-14 — 7.4 ROOM 1 SHIPPED: RECEPTION is a walkable intake office behind the window door at 120° — THE INTAKE WINDOW (the profile: the ID card, the callsign, the desk, the stamps), THE LAMINATOR (the intake sheet the card was printed from, data.js `hqIntakeCard`: employee number, clearance, rank, issue date, the photo on file, visits, reissues, the LOST CARD FEE never collected), NOW SERVING (the sign in red digits — the first half of your employee number — and the dispenser under it: your ticket is the second half, the office is working through the gap); the clerk, the guard, the new hire on number four; §9 2026-09-14; rev 33 2026-09-13 rev 3 — 7.4 ROOMS 1111 + 5150 SHIPPED: MEDICAL is a walkable ward behind the hospital door at 210° — THE SERVICES DESK (Challenge mode), THE CHART at the foot of the bed (your record off the career stats: crossings, released, EXITED, the CONDITION line — INTAKE / FIT FOR DUTY / UNDER OBSERVATION / ADMINISTRATIVE LEAVE, data.js `hqMedicalRecord`), two cots, the nurse, the orderly, a patient; and the cell door at the back of the ward into Room 5150 · THE PADDED ROOM — one cell, three walls of tufted vinyl (`wall_padding` proc), a cot, a drain, THE HOLD (a panel that repeats the condition; leave is served here when the story serves it); §9 2026-09-13 rev 3; rev 32 2026-09-13 rev 2 — 7.4 ROOMS 42 + 1337 SHIPPED: RECORDS is a walkable room behind its wired double door at 240° — the stacks, THE READING DESK (the Codex), THE CARD CATALOGUE (the unfiled sites: community maps, a modal over the paused building), the service stair up to Room 360's projector (the door's old REPLAY alt, now a door you walk through); IT is a box room off the mezzanine at 120°, inside Arcane Engineering's stretch — the user's Hacker Room as a door, not a map: THE LIBRARY (the Spell Library, whose Back now comes home to the building), THE BENCH (the balance lab), THE RACKS (the AI training lab), three `server_rack`s, the keypad inside by the way out (the hollow-core leaf is L2's, so the fourth door that wasn't there yesterday is the holographic one); §9 2026-09-13 rev 2; rev 31 2026-09-13 — 7.6 WAVE 1 SHIPPED, all six: Room 13 · THE HAUNTED HOUSE (Terrestrial — the mansion's ground floor cut open across the board with the graveyard on both sides; the gothic point of entry: ghost, werewolf, vampire, ghoul), Room 33 · THE LODGE (Terrestrial, indoors — the temple: the sanctum behind thin damask walls, the pillars, the altar, the Tomb sunk in the floor; politician, general, marksman), Room 0 · THE SINGULARITY (CELESTIAL, not Quarantined — like E4, the sealed bay is unplayable; two spiral arms of shards over nothing; watcher, cosmic wraith), Room 6 · SATURN (Celestial — the hexagon plateau in the storm, oil lakes, the cubes; grey, black goo), Room 21 · THE STRIP (Urban — the boulevard at night, the chapel, the marquees, the Luxor; conspiracy theorist, honda civic), Room 1954 · DOWNTOWN (Urban, daylight — the intersection, the rubble, the collapsed tower; superhero, antihero, zombie, king kong). Each = full 16×16 + Δ + site file + threshold + bay + a walkable room with its setting + server MAP_POOL rows (now parity-checked); `env.ambience` names a still map's bed; §9 2026-09-13 wave 1; rev 30 2026-09-13 — 7.4 ROOMS 111 + 1984 SHIPPED: THE TROPHY CASE is a box room off the MEZZANINE at 290°, over EMPLOYEE OF THE MONTH — two lit glass cabinets (`trophy_case` proc: plaques gold for the engraved ones, `hqTrophyCount` reads the achievements ledger), THE CABINET counter opens the profile ON its Achievements tab (`_mountReactTrophies`); THE INTERROGATION ROOM is a box room off the ground ring at 255°, between RECORDS and BAY 1 — a steel table (`steel_table` proc), two folding chairs, one lamp, the round observation window as the one-way mirror, and THE TABLE counter opens the CPU TRAINING TRANSCRIPT (map.js `_hqTranscriptHtml`: the imitation ledger — matches watched, decisions scored, agreement, every weight moved off default, the last report) — the one function that had no physical home; §9 2026-09-13; rev 29 2026-09-12 — MOVING MAPS: three sites whose world streams past the board, faster every round — Room 1717 · QUEEN ANNE'S REVENGE (Hollow; the 7.7 Pirate Bay number, the ship itself instead of a cove), Room 426 · THE DERELICT (Celestial, new), Room E4 · THE LOOKING-GLASS (7.6 #6, shipped to DIPLOMATIC because Bay 6 is sealed until a chapter); `env.motion` on the meta row → three-renderer.js MOTION (streaming far roster, a sliding sea, a storm that builds, the sun / moon swelling on a close pass), each Δ with its own bed; Heaven drifts; §9 2026-09-12; rev 28 (2026-09-11 rev 5 — 7.4 ROOM 360 SHIPPED: THE OBSERVATORIUM is a box room off the MEZZANINE at 240°, directly above Records (a holographic door between Bay 3 and Bay 6): a planetarium — the PROJECTOR in the middle is the tape library's projection (Replay moved up from Records' door panel; Records' alt now leads upstairs), the PROJECTED SKY on the ceiling is every threshold in the building as a star in its lamp's colour (seven constellations, one per bay, Bay 1 at twelve — data.js `hqStarChart`, ONE layout read by three-renderer.js `star_dome`, the wall `star_chart` and the panel), and THE STAR CHART counter opens the star-map (map.js `_hqStarmapHtml`): point at a star and its threshold's OWN door panel opens from here (`_hqOpenThreshold` — CROSS ▸ Δ / DEEP / WALK IN, ◂ THE CHART back), a fast route to any site, nothing about match setup bypassed; a box shell can now be painted down (`wallColor` / `dadoColor` / `ceilColor` / `ceilTile`); rev 27 2026-09-11 rev 4 — 7.4 ROOM 1287 SHIPPED: OCCAM'S BARBERSHOP is a box room off the ground ring at 105° (a glass door between the Quartermaster and Reception, the pole in the hall), and THE CHAIR answers D13 — sit and walk the building as the recruit, your most-played vessel, a D.O.O.R. agent or any declassified rigged vessel (data.js `hqAvatarPref` / `hqSetAvatar` → `door.hq.avatar`, map.js `_hqAvatar` reads it, three-renderer.js `hq.setAvatar` swaps the model in place), the mirror is the ID card and the card's photo follows the chair; rev 3 2026-09-11 — 7.9 + 7.4 ROOM 247 SHIPPED, logged from the code (the 00:39 upload carried no entry): THE CLOCK ROOM at 225° with the world clocks that disagree, the punch clock (the login streak, `hqPunchIn` from the front door) and FORM 365 — Daily Office Operations Requirements, three lines a day seeded like the Code Red (`hqDailyOps`), judged at the match commit (`hqDailyOpsJudge`), 💰 120 a line + 💰 150 the sheet, the count on the strip; rev 26 2026-09-11 rev 2 — 7.4 ROOM 86 SHIPPED + 5.1's FIRST VARIANT: THE CAFETERIUM is a box room off the ground ring at 75° (the serving line, the hot side that was the hall's break nook, two long tables, the notice board → the leaderboard, the till → the Quartermaster, the roster on break, the other operatives on shift from the lobby's online count), and after hours the same door reads MÖBIUS STRIP CLUB (`rooms.cafeteria.variants.after_hours`: the bar is one lathe with one side, pink light, a bartender — `hqRollRoomVariants` per visit, `?hqvariant=after_hours`); rev 25 2026-09-08 rev 5 — 5.4a stage 2 SHIPPED: THE CONTAINMENT RING is ONE CORRIDOR PER FLOOR — the bays of a floor are segments of a single hallway framed just outside the egress drum (ground ring r 21.5–25.5 behind Bays 1 and 4, mezzanine ring r 24.5–28.5 behind Bays 2 · 5 · 7 · 3 · 6), every egress bay door is the ring's inner-wall door at the same angle, the thresholds spread along the outer wall either side of it, no rebuild between bays, the caps wear the fire door to each other across the service side; data.js `bayShell.corridor`, `hqRingLayout` / `hqRingRoom` / `hqBayEntry` / `hqBayNo` / `hqRingSectorAt` / `hqRingSpot`, `hqBayId(sector)` → the floor's ring; the renderer learns only `shell.full`; map.js lands through `hqBayEntry`; the cast's bay spots carry over; kill-switch `corridor.on: false`; rev 24 2026-09-08 rev 4 — 7.2 stage 6 SHIPPED: THE REST OF THE REGISTER — every launch map is a walkable room: Rooms 14179 · SHASTA, 56 · STONEHENGE, 444 · GIZA, 777 · HEAVEN, 2047 · CYBERPUNK CITY, 11 · BABEL, 12 · OLYMPUS, 4 · MARS, 51 · AREA 51, 512 · SKINWALKER RANCH, 180 · HOLLOW EARTH, 420 · FAIRY FOREST, 1969 · MOON, 888 · VATICAN CITY, 23 · BOHEMIAN GROVE, 9600 · GÖBEKLI TEPE, 1225 · NORTH POLE and 2D · FLAT LANDS are outdoor rooms behind their bay thresholds, each with its map's setting inside it at 1:1 and its sky overhead (Flat Lands opts out of its fourteen-tile setting), four consoles off the west wall, Babel's terraces as stands, the Moon under a 3 m berm; data-only — `siteRooms.built` / `near` / `shells` / `flavour`, no renderer change; doorhq.test.js now insists every site in the register has a room; rev 23 2026-09-08 rev 3 — 7.2 stage 5 SHIPPED: THE SETTING IN THE ROOM — every walkable site room now runs its map's own MAP SETTINGS near builder inside it at 1:1 (D.U.M.B.'s server racks and blast door, CERN's beamline and terminals, the Backrooms' partitions and stalk fluorescents, Nuketown's picket fence, houses, road and buses, the Stadium's tiers and floodlights, Camelot's curtain wall with its towers and drawbridge, Atlantis' colonnade and kelp, Hell's spires and braziers, Technoticlan's temple tiers and torches, Agartha's crystal spires, Antarctica's ice ridges and igloo) — the room grows to the setting's apron (`siteRooms.near[key].w` tiles, + the moat's gap), the kit's enclosure primitives are no-ops in the room (the shell is those), every piece is culled clear of the way in and the console and becomes a blocker, natives and props are nudged off the houses and the stands, and four consoles moved to the north wall (`shells[id].console`); `hqSiteRoom` `near`, three-renderer.js `_hqBuildSetting` / `_hqSettingFreeSpot`, `_nrKit` `ctx.hq`; rev 22 2026-09-08 rev 2 — 7.2 stage 4 SHIPPED: the MOAT rooms — Rooms i · CAMELOT, H-20 · ATLANTIS, 666 · HELL, 2012 · TECHNOTICLAN, 88 · AGARTHA and 90S · ANTARCTICA are outdoor sites whose walkway is a QUAY: the ring between the island and the quay is the map's own liquid one level down in the battle's animated fluid sheet, board-edge canals open into it, a causeway either way (the south one is the way in), deep water and lava never entered; `shells[id].moat`, `hqSiteRoom` → `shell.moat`, three-renderer.js `_hqSiteOnCauseway` / `_hqTickMoat`, and a site room's floor is now a FRAME so every board pit finally shows; rev 21 2026-09-08 — 7.2 stage 3 SHIPPED: the first OUTDOOR rooms — Room 1945 · NUKETOWN and Room 50 · FOOTBALL STADIUM are walkable sites with no ceiling, the map's own sky on the battle's firmament dome, its far roster drifting round the room, lamp masts on the walkway corners, a fence / the bowl's wall for a perimeter and the ground running out past it; `shells[id].open`, `shell.sky`, three-renderer.js `_hqBuildSky` / `_hqTickSky`, `_hqTex` reads terrain keys; rev 20 2026-09-07 rev 5 — 7.2 stage 2 SHIPPED: Rooms 999 · CERN and 90 · BACKROOMS are walkable sites, each in its own LIGHT (`siteRooms.shell.mood`: lamps, strips, sign palettes, `signLines`; the Backrooms under a low yellow ceiling with no conduits, the almond water tinted); rev 19 2026-09-07 rev 4 — 7.2 stage 1 SHIPPED: the first WALKABLE SITE — Room 555 · D.U.M.B. is a room behind its bay threshold, its own Δ board in the middle at 1:1 (steps climbed, blocks solid, the cell walls, the specimen tubes, the nexus ring), the CROSSING console files the crossing, the natives loiter on the walkway; `hqSiteRoom` / `hqSiteBoardInfo`, the renderer's `_hqBuildSiteBoard` + the board layer in `_hqSurface`; rev 18 2026-09-07 rev 3 — 7.5 SHIPPED + THE CONTAINMENT RING (new 5.4a) stage 1: Bay 7 · URBAN on the mezzanine, the rebalance (C-22 + C-23 DECIDED), and every bay's end caps wear fire doors into the next bay on its floor — 1 ⇄ 4 downstairs, 2 → 5 → 7 → 3 → 6 → 2 upstairs; rev 17 2026-09-07 rev 2 — 7.1 SHIPPED, the numbers are on the doors: `roomNo` on every threshold and numbered room, `hqRoomNo` / `hqRoomRegister`, the plate · the panels · the SITE FILE header · the result stamp · the loading card · the directory's register; the elevator skips 13; rev 16 2026-09-07 — the ROOM REGISTER: Phase 7 — a number on every site and HQ room, seven new sites for wave 1, the walkable-site mechanism, seven bays, the dailies, §5.6 assets; rev 15 2026-09-06 rev 2 — the cast PLAYTESTED and re-seated: pinXZ sitting, Rhonda in the round desk, held props, playtest_hq.js, §9; rev 14 2026-09-06 — the CAST moves in: fifteen rigged story characters at their posts, the Player as the avatar; rev 13 2026-09-04 — 6.3 rev 2: the Key pickup celebration + emoji purge)

Read CLAUDE.md first (RULE #1 delivery, #1b cache-bust, #1c no playtest,
#2 online parity), then `DOOR_MASTER.md` Part A5 (the department → room
table) and Part C (decisions). This file is the step-by-step plan for
building the D.O.O.R. headquarters as a real 3D place you walk through in
third or first person: what to build, in what order, in which existing
files, and exactly which 3D assets the user makes. It is the anti-"start
over" memory for the HQ. **Append to §9 (build log) every session that
touches the HQ.**

**Rev 2 supersedes rev 1's "pre-rendered rooms + hotspots" approach.** The
user is making 3D assets and wants the facility walkable from the start, so
the painted-background layer is dropped. What survives from rev 1: the room
graph as data, the door-state rules, the mission launcher, the back-button
plumbing, the dev layout editor, and the reference-art protocol.

---

## 0. The vision, and how it is built

**Vision.** Pressing **Play** shows a loading screen (clearance check, a
memo card) and puts the player, in third person, on the floor of the
Central Egress: a round two-tier hall, a black cube hanging from the dome,
a round dispatch desk in the middle, doors with red / amber / green lamps
around both levels. You walk. Ranked play is answering a BELL call at the
dispatch desk; VS CPU is walking through a mission door; the Shop is the
Quartermaster's window; the Codex is the Archives door; your Profile is the
ID card on the Reception counter; the story is the in-tray in your office
(a janitor's closet, at first); the tutorial is the only square room in the
building, down the stairs. Doors light from real data. Later the building
changes when you are not looking.

**How.** The facility is NOT a battle map and does NOT use the voxel tile
renderer. It is a small three.js scene built from:
1. **Procedural architecture** — floor ring, walls, dado, trim, mezzanine,
   railings, dome, stairs, light strips: lathe/extrude geometry that Claude
   generates in code from a polar layout table (`DOOR_HQ` in data.js) and
   wraps in tileable textures. A round hall is a handful of meshes. Because
   it is parametric, moving a door or a vending machine is a data edit —
   which is the unreliable-layout mechanic for free.
2. **Authored props** (user-made GLBs, §5): the cube, the dispatch desk,
   door leaves, furniture, fixtures, signage blanks, machinery. Placed by
   the same layout table, instanced when repeated.
3. **The existing character pipeline** for NPCs (rigged GLBs + the shared
   animation library, CLAUDE.md recipe) — DOOR agents in black, your
   recruited vessels on break.
4. **The existing camera rigs** — Strike Mode's third-person boom with
   collision and its first-person eye, pointer-lock mouse look — and the
   existing free-roam controller for movement.
5. **DOM overlays for interaction** — the existing screens (Shop, Codex,
   Party Builder, Profile, lobby…) open as overlays when you use a counter
   or door, exactly like talking to a shopkeeper in any RPG. Door panels,
   nameplates and prompts are DOM/CSS2D, so text stays crisp and dynamic.

**Performance, stated honestly.** Rev 1 cited ROADMAP §4's "~1,800 objects
in an 8×8 match" as a ceiling. That number is a property of how the BATTLE
BOARD is built (every tile is its own Mesh with a 6-material box, stacked
columns bypass the material cache, no instancing — ROADMAP §4 item 1), not
of three.js or WebGL, and the facility never touches that code. A kit-built
hall is roughly 10 architecture meshes + 60–80 instanced prop draw calls +
8–12 rigged NPCs: less than a match. The user's instinct is correct: a
PS2-era environment is cheap here.

---

## 1. Decisions (all decided 2026-09-03 unless marked)

| # | Decision | Resolution |
|---|---|---|
| D1 | Approach | **Walkable 3D facility from Phase 1**, procedural shell + authored prop kit, third person default with a first-person toggle. No painted rooms, no voxels. |
| D2 | Quick Play / Friendly | At the **dispatch desk** in the egress (Quick Play = answer a BELL call; Friendly = the desk phone, room code). `Q` hotkey anywhere in the building. |
| D3 | Mission doors | Walk through → door panel → VS CPU on that map's **8×8 Δ board, 4v4, enemy pool = the map's native entities** (`doorSiteCrossings`); "DEEP CROSSING" option = full map. |
| D4 | Sector bays | Six (MASTER A10). In the egress each bay is one door on the ground ring; the bay itself is a short curved corridor with its threshold doors (Phase 2). |
| D5 | Main menu | Phase 1: unchanged except Play → HQ. As rooms/counters come online their buttons go. End state: Play / Settings / Profile card / Quit. `?nohq` + localStorage `ew_hq='off'` keep the old hub reachable for one release. |
| D6 | Settings | Overlay (gear / Esc). Not a place. |
| D7 | Back buttons | The 12 `_showTitlePage('mainMenuPage')` sites + the result overlay's Main Menu button return to the building (`_hqReturnOrMenu`); post-match you re-enter where you launched from. |
| D8 | Door art | Door **leaves** are authored GLBs (one per type); door **frames + lamp housings** are procedural so every door in the building shares one frame and the leaf is the variable. |
| D9 | Mastery (green lamp) | v1: a win on that map by every win condition its mode offers, persisted monotonically in `progress.unlocked` (`site:<mapId>:<winCondition>`). v2 may add "all native entities declassified". |
| D10 | Rank titles | DOORMAT / DOORSTOP / KNOCKER / KEYHOLDER / GATEKEEPER / THE DOORMAN (MASTER C-1); data.js strings change with the first data.js delivery of Phase 1. |
| D11 | Reference images | Commit under `docs/door-hq/ref/` (§5.1). They are the art direction for the modeler and for Claude's procedural shell (colours, proportions). |
| D12 | Story gating | Hybrid (MASTER B3): SP from every mode incl. PvP + single-player field requirements inside the building. |
| D13 | Character in the hub | **Answered by THE CHAIR (2026-09-11, Room 1287 · Occam's Barbershop, §9).** The default is the recruit — the Player model (since 2026-09-06); the officer may sit and walk out as their most-played vessel, a D.O.O.R. agent, or any declassified vessel with a rigged file (`door.hq.avatar`), and the ID card's photo follows. Was: the vessel vs an officer avatar. |

---

## 2. What already exists (build on it)

Verified 2026-09-03. Line numbers drift; search the symbol.

**Menu / page system.** Every menu screen is a `<div class="title-page">`
in `#startOverlay` (index.html:576-1015); `map.js` `_showTitlePage(id)`
toggles them. `map.js:98` `_goToPlayHub()` is what **Play** calls — the
seam that becomes `_hqEnter()`. Every function a counter or door needs is
already a `window.*` entry point: `_goToQuickPlay` / `_goToFriendlyMatch` /
`_goToVsCpu` / `_goToMysteryDungeon` / `_goToCodex` / `_goToTeamBuilder` /
`_goToCampaign` / `_goToMapEditor` (map.js), `_goToShop` (ui.js:8412),
`_mountReactProfile` / `_mountLeaderboard` / `_mountCommunityMaps`
(profile.js:2601+), `_ewReplayLastMatch` (online.js:4854),
`_openMainMenuSettings`. Return-to-menu sites: `_showTitlePage(
'mainMenuPage')` ×12 (map.js 10, ui.js 1, battle.js 1) and the result
overlay's `#mainMenuBtn` (battle.js:30168, ui.js:12024).

**Match launch.** match-select `_msConfirm` (map.js:1755) → `applyGameMode`
(state.js:1168) → party builder → `startMatch` (battle.js:32592). No
"preselect a map" API yet (`_msSelectedMap` is an index into
`MS_MAP_LIST`); Phase 1 adds `window._hqPreselect`.

**Loading screen.** `showBattleLoadingScreen` (battle.js:31460) plus the
`.ls-*` kit and `_lsDoorHints()` (memo / canon-notice cards) — reusable for
the HQ loading screen without the unit warmers.

**3D engine facts that matter for the facility.**
- World scale: `BASE_TILE = 128` (data.js:5) world units per tile; a
  `heightRatio: 1.0` character renders `ts * UNIT_SPRITE_SIZE_RATIO(=1.0)`
  = 128 units tall (three-renderer.js:495, ~10287). So **1 tile ≈ one
  person tall ≈ 1.75 m → 73 world units per metre.** Model in metres;
  Claude applies one scale factor at load.
- GLB loading + caching exists twice: `_loadUnitGLB` (three-renderer.js
  ~9637, rigged units, clones via SkeletonUtils) and the misc static-model
  path (`_R2_MISC`, `_miscModelCache`, ~20545: OBJ + GLB props, loaded
  once, cached, cloned, filled in asynchronously). The prop kit uses the
  second path.
- Procedural monuments (`_MON_BUILDERS`, three-renderer.js ~6240): pyramid,
  ziggurat, obelisk, greek, rings, flag, lightpillar, exitsign, lenticular,
  holoboard, jumbotron, tablet, biodome, whalebones, innersun, fairyring,
  holopyramid, censer, greytube, beamring, securitycam, dumpster, mushroom,
  woodcross, fleshmound, igloo — `securitycam`, `exitsign`, `dumpster`,
  `greytube` are reusable dressing; the rest shows the style of code Claude
  writes for procedural geometry.
- Terrain textures already on R2 that suit an office block (sprites.js
  `_T`): `tilefloor`, `tilefloor_2`, `concrete_floor`, `checkerboard*`,
  `marble`, `marble_2`, `marble_light`, `carpet`…`carpet_4`,
  `drywall`…`drywall_5`, `gunmetal`, `gunmetal_2`, `metal*`, `aluminium`,
  `wood_planks`, `brokenglass`, `wallpaper`. Phase 1 placeholders come from
  here.
- Movement: `_freeRoamStart(uid, opts)` (three-renderer.js ~18725) —
  WASD/arrows + gamepad stick, Shift run, Space hop, continuous `fx/fy`
  with per-tile collision via `opts.tileAllowed(tx,ty)` and an `onTile`
  callback; camera follow via `window._mdFreeRoamCam` → `camera.snap`.
  The hub reuses it with a `tileAllowed` that reads an occupancy grid
  rasterised from the layout (annulus + door openings + stair ramps +
  prop footprints) at half-tile resolution.
- Cameras: Strike Mode's third-person rig with boom collision
  (three-camera.js ~174-310, `cam._tpsCollide`), the FIRST-PERSON EYE
  (~211), pointer lock (battle.js ~14288), `ShooterControls` owning the
  keyboard when active.
- Nameplates: CSS2DRenderer is already loaded (index.html:247) and used
  for unit plates — door nameplates and prompts use it.
- Post stack (three-post.js): grain / scanlines / chromatic aberration —
  the PS1 look for the hub comes free.
- Guild Hub runtime (the prototype): `_mdOnBattlePrepared` drops the CPU
  team and seats roster NPCs (`_mdSpawnHubNpcs`, `unit._mdNpc`), starts
  `ThreeRenderer.hubFreeRoam`, `_mdCheckStairs` is the entrance trigger
  (battle.js ~27960-28060). The HQ generalises these under a
  `state._hqWalk` flag instead of `_isDungeonMode()`.

---

## 3. Architecture

### 3.1 Files (RULE #1: no new game files)
| File | What goes there |
|---|---|
| `data.js` | `DOOR_HQ`: the layout (rooms, ring geometry, doors and props in polar coords, sectors, prop catalogue with URLs/scales/footprints) + pure helpers `doorSiteState`, `hqRoomUnlocked`, `hqOccupancy(layout)`. |
| `three-renderer.js` | `HQ` builder: procedural shell (`_hqBuildShell`), prop placement (`_hqPlaceProps` via the misc-model loader), lamps (`_hqLampMaterial(state)`), CSS2D nameplates, trigger volumes, the hub scene lifecycle (`ThreeRenderer.hq.enter/leave`). |
| `three-camera.js` | third-person / first-person hub mode on the existing rigs; toggle. |
| `map.js` | Flow: `_hqEnter`, `_hqLoading`, `_hqTrigger(id)` (what a door/counter does), `_hqReturn` / `_hqReturnOrMenu`, `_hqLaunchMission`, the door panel + prompt DOM, the directory. |
| `battle.js` | `startHqScene()` beside `startMatch` (no units except the player + NPCs, no turn engine); generalised `_mdSpawnHubNpcs` → `_hqSpawnNpcs`; mastery flag write at match commit; post-match return. |
| `state.js` | `GS.HQ`; `state._hqWalk`, `_hqRoom`, `_hqLaunchRoom` (UI-only → `_serializeState` skip list). |
| `styles-base.css` | `.hq-*` DOM: panel, prompt, strip, directory, lamp/tape/planks in panels. |
| `audio.js` | ambience key, `doorMuzak` slot, wire `doorBuzz` / `paChime` / `fax`. |
| `ui.js` | dev layout editor (`_hqEdit`: nudge props/doors around the ring, export JSON). |
| `profile.js` | `door.hq = {lastRoom, visited, variantSeed, keys}` backfill. |
| `door-hq.test.js` | validates `DOOR_HQ` headlessly via `load-data.js`. |

### 3.2 Layout data (`DOOR_HQ` in data.js)
```js
const DOOR_HQ = {
  units: 73,                                  // world units per metre (128 / 1.75)
  rooms: {
    central_egress: {
      label: 'CENTRAL EGRESS', kind: 'rotunda',
      shell: { radius: 21, mezz: { radius: 24, height: 4.2, width: 3.5 }, wallH: 9, domeH: 6,
               floor: 'terrazzo', dado: 'oxblood', wall: 'stone_speckle', trim: 'teal_metal', ceiling: 'panels' },
      stairs: [{ deg: 150, level: 0, to: 1, side: 'cw' }, { deg: 30, level: 0, to: 1, side: 'ccw' }],
      doors: [                                  // polar: degrees clockwise from north, level 0 = floor, 1 = mezzanine
        { id: 'bay_terrestrial', deg: 200, level: 0, leaf: 'door_institutional', label: 'BAY 1 · TERRESTRIAL', sector: 'terrestrial', action: { room: 'bay_terrestrial' } },
        { id: 'records',         deg: 235, level: 0, leaf: 'door_wiredglass',     label: 'RECORDS',              action: { fn: '_goToCodex' } },
        { id: 'elevator',        deg: 90,  level: 1, leaf: 'door_elevator',       label: 'ELEVATOR', minClearance: 4, action: { room: 'executive' } },
        ...
      ],
      props: [                                  // catalogue key + polar position; r in metres from centre
        { key: 'dispatch_wedge', deg: 0, r: 0, level: 0, repeat: 8, step: 45 },   // 8 wedges = the round desk
        { key: 'hq_cube',        deg: 0, r: 0, level: 'hang', y: 7.5 },
        { key: 'table_round',    deg: 250, r: 12, level: 0 }, { key: 'chair_office', deg: 250, r: 13.2, level: 0, rot: 180 },
        { key: 'lamp_globe',     deg: 160, r: 9, level: 0 },
        { key: 'cabinet_file',   deg: 100, r: 19.5, level: 1, rot: 'wall' },
        ...
      ],
      counters: [                               // walk-up interactions that are not doors
        { id: 'dispatch', deg: 0, r: 3.5, label: 'DISPATCH', action: { fn: '_hqDispatch' } },
        { id: 'board',    deg: 300, r: 20, label: 'EMPLOYEE OF THE MONTH', action: { fn: '_mountLeaderboard' } },
      ],
      npcSpots: [{ deg: 20, r: 8 }, { deg: 210, r: 14 }, ...],
      spawn: { deg: 180, r: 16, level: 0 },
      variants: [],                             // Phase 5: alternate door/prop tables
    },
    ...
  },
  catalogue: {                                  // every authored asset, once
    hq_cube:        { url: 'Assets/hq/hq_cube.glb',        footprint: null, scale: 1 },
    dispatch_wedge: { url: 'Assets/hq/dispatch_wedge.glb', footprint: 'wedge', scale: 1 },
    door_institutional: { url: 'Assets/hq/doors/door_institutional.glb', hinge: 'left' },
    ...
    _placeholder:   { proc: 'box' },            // used for any key without a file yet
  },
  sectors: { terrestrial: { label: 'TERRESTRIAL', maps: [...] }, ... },
};
```
Actions are exactly one of `{room}`, `{fn}`, `{mission: mapId}`,
`{overlay}`. Doors and counters carry optional `minClearance`,
`minChapter`, `requiresKeys`, `tip`. Catalogue keys without a file resolve
to a procedural placeholder (a labelled box of the right footprint), so the
building is complete on day one and fills in as assets arrive.

### 3.3 Building the shell (procedural, three-renderer.js)
- **Floor**: `RingGeometry`/lathe for the terrazzo disc with inlaid bands
  (the reference's dark-teal / oxblood rings) as separate thin rings.
- **Walls**: a cylinder wall per level split into N facets; door openings
  are cut by building the wall as segments between door frames (simple
  quads), so no CSG. Dado band and trim are extruded rings. Blank
  nameplate quads above every door for CSS2D labels.
- **Mezzanine**: an annulus slab at `mezz.height` with a railing (posts +
  rails instanced around the ring), two curved stair flights (a helix of
  steps — each step a box).
- **Dome**: a lathe with a ring of light strips (emissive quads).
- **Lamps**: one emissive box per door, material tinted by
  `doorSiteState` (off / red / amber / green / strobe), plus a soft
  `PointLight`-free glow sprite so lighting stays cheap.
- **Textures**: tileable maps with repeat; Phase 1 uses existing terrain
  textures, Phase 2 swaps to the user's (§5.2). Baked-in ambient
  occlusion is optional; the PS1 look tolerates flat lighting + the post
  grain. One `HemisphereLight` + one `DirectionalLight`, no shadows in the
  hub (the battle shadow pass is what ROADMAP §4 warns about).
- **Collision**: rasterise the layout into a half-tile occupancy grid
  (annulus walkable, stair ramps as height, prop footprints blocked,
  door openings open) → `tileAllowed`. Height comes from level, not from
  a heightfield.

### 3.4 Walking, camera, interaction
- Enter: `startHqScene()` → build shell + props → spawn the player's
  vessel (D13) at `spawn` → `ThreeRenderer.hubFreeRoam.start(uid, {
  tileAllowed, onTile })` → third-person rig follows; `V` toggles first
  person; gamepad works (the free-roam already merges a virtual stick).
- **Triggers**: a door or counter has a trigger arc (polar range + level);
  entering it shows the CSS2D prompt ("▸ RECORDS — E to enter") and the
  door panel (site file stamp, FIRST CROSSING date, native entity chips,
  mastery checklist, ENTER / DEEP CROSSING). `E` / click / gamepad A
  activates; the free-roam stops (`hubFreeRoam.stop`), the DOM screen
  opens as an overlay; closing it resumes the walk where you stood.
- **Back**: `_hqReturnOrMenu` for the 12 sites; post-match returns you to
  `state._hqLaunchRoom` at the door you left through. Esc = settings; Esc
  twice = the directory (text list of every place + function, also the
  accessibility fallback). EXIT on the strip leaves to the main menu.
- **NPCs**: `_hqSpawnNpcs` — DOOR agents at fixed spots (the desk, the
  board) + recruited vessels at `npcSpots`; idle clips from the shared
  library; bump/`E` → a one-line micro-scene.

### 3.5 Door state (`doorSiteState(mapId, profile)`)
| State | Lamp | Dressing | Rule |
|---|---|---|---|
| `sealed` | off | planks over the frame | sector `minChapter` not reached (Phase 4; never sealed before then) |
| `clearance` | red | tape, "CLEARANCE REQUIRED" | `profile.door.clearance < minClearance` **or `requiresKeys` short** (`hqKeysShort`, shipped 3.2) — the panel names which |
| `unstable` | amber, slow pulse | — | playable, not mastered |
| `stabilized` | green | "STABILIZED" plate | mastered (D9) |
| `codered` | red strobe | doorbell icon | the day's Code Red (`hqCodeRed(profile)`, shipped 3.3): the threshold of the picked site AND its bay door in the egress, until `door.hq.codeRed` records a win on that site today. The leaf still opens (you are being sent through it). |

### 3.6 Loading screen
`_hqLoading(onDone)` reuses the `.ls-*` kit (grain, motes, the memo /
canon-notice card via `_lsDoorHints`) with "D.O.O.R. HEADQUARTERS ·
CLEARANCE CHECK" and the officer chip; waits for the shell textures + the
catalogue entries the current room uses (misc-model cache) + the player's
vessel GLB; minimum 900 ms; click to skip once ready. A mission door shows
the same screen with "CROSSING…" before `startMatch`'s own loading screen.

### 3.7 Missions (D3) — `_hqLaunchMission(mapId, {delta:true, teamSize:4})`
Sets `window._msCpuOnly = true`, `window._hqPreselect = {mapId, delta,
teamSize, roster}` and opens `modePage`; `_msRenderAll` consumes
`_hqPreselect` once (map card, Arena, team size, CPU roster pinned to the
native pool from `doorSiteCrossings`, padded from biome neighbours when
fewer than 4). The party builder still runs; nothing about match setup is
bypassed.

### 3.8 Online parity (RULE #2)
The building is single-player and local. Quick Play / Friendly hand off to
the untouched lobby pages; nothing in the HQ runs during a match. All
`state._hq*` fields are UI-only → `_serializeState` skip list. The result
overlay stays local on both clients.

### 3.9 Dev layout editor (`_hqEdit`, ui.js dev panel)
Select any door/prop/counter in the hub, nudge it (`deg`, `r`, `rot`,
level) with keys or a small form, add/remove entries, `_hqExport()` copies
the room's JSON. The user pastes it into chat; Claude merges into
`DOOR_HQ`. This replaces the rev-1 hotspot editor.

### 3.10 Performance budget
Shell ≤ 12 meshes; props via instancing (repeat entries) ≤ 80 draw calls;
NPCs ≤ 12 rigged; textures ≤ 1024² each, ≤ 24 distinct; no shadow pass;
post stack as in battle. Target 60 fps on the machines that run matches.
If a room ever exceeds this, the fix is prop count, not architecture.

---

## 4. Phases

Effort in Claude sessions. ⚙ = Claude can finish with no new art; 🧊 =
needs the user's 3D assets (§5); each step ends with `npm test` and files
handed over per RULE #1 with an index.html bump.

### Phase 0 — Plan ✅ (this session, rev 1 → rev 2)

### Phase 1 — The shell you can walk (2 sessions, ⚙)
Goal: Play → loading → you stand in a procedural Central Egress in third
person; every existing function reachable from doors/counters; door lamps
real; back buttons return you to the hall.
- 1.1 ⚙ `DOOR_HQ` (data.js): the egress layout (shell, 2 stairs, ~14
  doors across two levels, dispatch desk + counters, ~30 props from the
  catalogue as placeholders, npc spots, spawn) + `doorSiteState` +
  `hqOccupancy`. `door-hq.test.js`.
- 1.2 ⚙ `startHqScene` / `ThreeRenderer.hq` / shell builder / placeholder
  props / lamps / CSS2D nameplates / occupancy + free-roam / third-person
  rig + first-person toggle / triggers + prompt + door panel DOM.
- 1.3 ⚙ ✅ (2026-09-03, §9) Flow: `_hqEnter` (Play), `_hqLoading`, `_hqTrigger`,
  `_hqReturnOrMenu` at the 12 sites + result overlay, `_hqLaunchMission`
  + `_hqPreselect` in match-select, `GS.HQ`, skip-list entries, `?nohq`.
- 1.4 ⚙ ✅ Mastery flag write at match commit; lamps from it; strip counts.
- 1.5 ⚙ ✅ Audio: room-tone placeholder, `doorBuzz` on doors, `paChime`
  reserved; `doorMuzak` slot silent until a track exists.
- 1.6 ⚙ ✅ Rank strings → DOORMAT…THE DOORMAN (rode the 1.1 data.js delivery).
- Exit: the hall works end to end; `npm test` green; online flows unchanged.
  Phase 1 is complete — remaining Phase-1-era wishes (gamepad, the §3.9
  in-game layout editor) moved to the §9 next-steps list.

### Phase 2 — The kit lands (2 sessions, 🧊 as assets arrive)
Each delivery from the user swaps placeholders for real props; nothing
else changes. Order of impact: cube → dispatch wedge → door leaves →
lamp/frame details → furniture → fixtures → machinery.
- 2.1 🧊 Textures (§5.2) replace the terrain placeholders on the shell.
- 2.2 ✅ (2026-09-03, §9) Hero props: globe lamp, round table, chairs were in
  since 1.2; the **dispatch wedge is retired** — the user keeps the
  procedural ring desk, so the three wedge GLBs dress the hall instead
  (reception counter, two mezzanine clerk stations, the briefing
  half-ring). The cube stays procedural (no `hq_cube` was made).
- 2.3 🧊 Door leaves: the six office doors + the institutional set.
- 2.4 🧊 Dressing: cabinets, shelving, boxes, CRTs, vents, clocks, signs,
  extinguisher, vending machine, water cooler, plant.
- 2.5 🧊 NPCs: DOOR agent (male/female) rigged via the CLAUDE.md recipe —
  also usable later as the playable DOOR officer race.
- 2.6 ✅ (2026-09-03, §9) The six **bays** as short curved corridors
  (generated rooms `bay_<sector>`: `hqBayRoom`), one threshold door per
  map with its own leaf (`DOOR_HQ.thresholds`), the site file + entity
  chips + checklist on every threshold panel; `_hqGoRoom` walks between
  rooms and returns rebuild the room you launched from.
- 2.7 ✅ (2026-09-03, §9) The **janitor's closet** as the first interior:
  `rooms.office`, the first `kind: 'box'` room (Cartesian frame, four
  flat walls), the closet kit + ten procedural stand-ins for what the kit
  lacks, the IN-TRAY counter on the desk (the case-file screen 4.1 grows
  from it), the way out wearing the rank door.
- 2.8 🧊 Ambience loop + muzak (user-made).

### Phase 3 — Doors that mean something (1 session, ⚙)
- 3.1 ✅ (2026-09-03, §9) Mastery v1 on every threshold (1.4); the
  per-condition checklist in the bay door panel; the STABILIZED plate chip
  (1.2); the result-screen THRESHOLD STABILIZED tag.
- 3.2 ✅ (2026-09-04, §9) Keys: `hqKeys(profile)` = the `hourglasses`
  achievement counter (all buckets) + `door.hq.keys` (Department grants);
  KEYS on the strip + in-tray; `requiresKeys` on the elevator (12) and the
  Bureau of Continuity (24) on top of their rank gates; the panel says what
  is short.
- 3.3 ✅ (2026-09-04, §9) Code Red: `hqCodeRed(profile)` — one stabilized
  site a day (date + employee no.), an entity filed elsewhere; the bay door
  + threshold strobe; `doorbell` rings on the way into the egress; the
  strip pill + brief; RESPOND pins the entity to the CPU roster
  (`hqCodeRedPool`); a same-day win clears it and pays `codeRed.bonusGold`
  (200) with a CODE RED CLEARED tag on the result stamp. SP bonus waits
  for the SP meter (4.1). Dev: `?codered=<mapId>`.
- 3.4 ✅ (2026-09-04, §9) Office door = rank (the leaf half shipped with
  2.7) **and the promotion moment**: the building compares
  `doorClearance` to `door.hq.seenClearance` on entry → `paChime`, the
  PERSONNEL NOTICE panel, a PROMOTED stamp on the card back, the new leaf
  already hung. What promotes is still the story track (4.1);
  `window._doorPromote(n)` is the dev / story hook.
- Exit: Phase 3 is complete — every lamp state in §3.5 is reachable.

### Phase 4 — Story lives in the building (1–2 sessions, ⚙)
- 4.1 The office in-tray = case-file screen: SP meter, chapters, pending
  directive, AWAITING FIELD WORK (`requires`), memos (`dotMatrix`),
  commendations; `fax` on arrival. Hooks already waiting: Code Red clears
  (`door.hq.codeRedsCleared`) as a commendation + SP bonus; promotion via
  `promoteTo` lands on `_hqCheckPromotion` for free.
- 4.2 First-visit micro-scenes per place (`playCutscene`); the handler.
- 4.3 ✅ (2026-09-13, §9 rev 4) Orientation in the Training Room: the VHS
  tape (ident CSS kit, `doorTapePlay`), "please do not turn around", the
  scripted lessons on the Phase 6 board (main menu → TUTORIAL → the shelf;
  the RANGE console in Room 64). The narration is a draft for the user; the
  lamination / Directive 1 beat is still open.
- 4.4 ⚙ ✅ (2026-09-15 rev 2, §9) The motto plaque reads the chapter band;
  canon notices on the Bureau of Continuity door. THE BUREAU is a room
  (`rooms.continuity`, behind the house door at 315°; the gate and the
  CONTESTED number stay on the door); THE MOTTO PLAQUE is the barometer
  (`hqMottoBarometer`: the band = the clearance until 4.1 lands, the story
  hook `door.mottoForm` / `_doorSetMotto(n)` over it), a fresh arrival
  files the reading (`hqMottoObserve` — a wording the plaque no longer
  reads is REMEMBERED by the officer alone, A7), CANON NOTICES is
  `hqCanonNotices` (generated), the top notices + the motto sit on the
  Bureau's door panel in the hall, the motto on the loading card. Open:
  the band from the STORY TRACK (4.1) instead of the rank; the notices'
  copy is a draft (A15).
- 4.5 `minChapter` sealing (planks); rings gate on rank.

### Phase 5 — The building is not reliable (1 session, ⚙ + 🧊 optional)
- 5.1 Variants: alternate door/prop tables per room, rolled per visit
  after chapter N (seeded by `variantSeed` + day). Nobody comments.
  **First shipped 2026-09-11 (§9, with Room 86):** `rooms.<id>.variants`
  on the sheet, `hqVariantRoll` (the clock, else a seeded roll per
  visit), `hqApplyRoomVariant` (swaps `DOOR_HQ.rooms[id]`, re-plates the
  doors into it), `hqRollRoomVariants` from map.js `_hqEnter` on a fresh
  arrival; `?hqvariant=<id>` forces one. No chapter gate yet (A14).
- 5.2 Department swaps; the directory insists it was always so.
- 5.3 Stabilized doors as shortcuts into deeper rings.
- 5.4 Rings: Support / Operations / Executive as further rotunda instances
  reached by the elevator (a small room with buttons); the office moves up
  at L4.
  **Stage 1 ⚙ ✅ (2026-09-14 rev 2, §9) — the elevator rides.** Not a
  third rotunda: the car (the mezzanine door at 0°, its gate unchanged)
  lands in `rooms.executive`, THE PENTHOUSE — one lobby (a box room, no
  number) with THE FLOOR PANEL (a counter with no action: the sixteen
  buttons, M and PH lit; M is a `data-room` button back to the elevator
  door), the assistant’s desk, and the two Executive rooms off it (4C on
  the east wall, 8 on the north). The office moves up at L4 in the sense
  that matters: 4C carries the same in-tray overlay; the closet (101)
  keeps the rank door. The rings as rotunda instances stay open.
- 5.4a **THE CONTAINMENT RING** (added 2026-09-07, the user's ask: "the
  hallways with the different doors can be made longer and go all the way
  around, or at least halfway"). Today each bay is an isolated arc that
  only connects back to the desk; the ring makes the bays one continuous
  hallway around the rotunda. Two stages:
  - **Stage 1 ⚙ ✅ (2026-09-07, §9) — the caps link.** Every bay's two end
    caps wear a fire door (`bayShell.ringLeaf`, the institutional wired
    double) into the NEXT bay on the same floor of the egress, ordered by
    the bays' egress-door angles and wrapping: downstairs Bay 1 ⇄ Bay 4 (a
    two-room loop), upstairs 2 → 5 → 7 → 3 → 6 → 2. `hqBayRing(sector)`
    (data.js) computes the neighbours; `hqBayRoom` hangs the doors (`cap:
    'cw' | 'ccw'`, id `cap_cw` / `cap_ccw`); the renderer places a cap door
    as a FLAT wall (`_hqCapWall`, the same shape as a box-room wall, so
    targeting / E / the spawn-at-door all work unchanged); the action is
    the neighbour's SECTOR with `at` = the far side's matching cap, so the
    door wears the neighbour bay's lamp (sealed into Quarantined until its
    chapter, strobing on its Code Red), the panel is the neighbour's bay
    panel, and you arrive on the far side walking the same way round. The
    transition is the existing door-blink rebuild. Kill-switch:
    `bayShell.ring: false` restores the dead-end caps. doorhq.test.js walks
    every ring and checks the reciprocity.
  - **Stage 2 ⚙ ✅ (2026-09-08 rev 5, §9) — one continuous corridor.** The
    bays are re-framed in the egress's polar frame just outside its drum:
    the ground ring at r 21.5–25.5 (behind the lower wall, r 21), the
    mezzanine ring at r 24.5–28.5 (behind the upper drum, r 24) — one
    room per floor (`ring_g` / `ring_m`, still `kind: 'bay'`: the arc
    shell, the annulus walk and the door placement took any span, so the
    renderer learned only `shell.full`). `hqRingLayout(level)` lays each
    bay out as a SEGMENT: its egress door is the ring's inner-wall door
    at the SAME angle (`egress_<sector>`), its thresholds a door run
    `spacing` apart on the outer wall centred on it — runs that would
    collide are relaxed apart (Diplomatic 150 → 146.0, Urban 180 →
    178.7, Hollow 210 → 215.3 on the mezzanine; the egress doors stay
    put), the ring's break is the widest gap between runs, the arc is
    the outermost runs plus `endPadM` (2.2 m) each way: downstairs 239°
    → 374° (Bays 1 and 4, 55 m), upstairs 17° → 282° (2 · 5 · 7 · 3 · 6,
    123 m). `hqRingRoom(level)` hangs the doors, the per-segment
    dressing (extinguisher / breaker / clock at each way out, cabinets
    and boxes in the gaps and at the caps), the bays' own flavour props
    and guards carried over by `hqRingSpot` (angle scaled by the radius
    so the distance along the corridor is kept), the overheard lines per
    segment (map.js picks the bay you stand in via `hqRingSectorAt`).
    `hqBayId(sector)` resolves to the floor's ring and `hqBayEntry
    (sector)` to its door, so the egress doors, the site rooms' way back,
    the panels, the directory, Code Red and the cast (Sedaniel's bay spot
    → `hqCastSpotRoom`) all followed; `hqBayNo(sector)` replaced every
    read of `room.bayNo`. The caps: with `corridor.close` each wears the
    stage-1 fire door to the OTHER cap (`{ room: ring, at: cap_* }` — a
    door-blink across the service side, "not on the plan and not lit");
    `corridor.arc[level] = [a, a + 360]` closes a ring by hand (no caps,
    `full`). Kill-switch `corridor.on: false` = the stage-1 bays (still
    registered as `bay_<sector>` and still tested). doorhq.test.js: five
    new tests (+ the stage-1 block re-pointed at `bay_*`).
- 5.5 H-Wing: a straight corridor kit (drywall, carpet, fluorescent,
  cubicles) — the only place with right angles; the childhood-home door;
  the Backrooms crossing.
  **Stage 1 ⚙ ✅ (2026-09-14 rev 4, §9) — the wing is walkable, OPEN.**
  `DOOR_HQ.hwing` (data.js) is the sheet: eight rooms (`hwing_lobby` ·
  `hwing_w` · `hwing_bar` · `hwing_e` · `hwing_office` · `hwing_pool` ·
  `hwing_break` · `hwing_home`), two entrances (the garage's `p2` stair,
  the room at the end's second secret wall), the crossing
  (`prebuilt_backrooms`). No number anywhere (7.0 rule 2), no gate anywhere
  (the user's rule 2026-09-14: build as end-game, lock later — the gates
  go on `garage/p2`, `deadend/hwing` and the site room's back door as
  `minClearance` when the chapter says so). What waits inside HOME is
  still A14 Q5: the hallway is scaffolding, ANSWER on the phone is
  disabled, nothing in it is canon. Not built: the rooms' own ambience
  bed (the hum — rooms have no `env.ambience` yet, 8.4), a room VARIANT
  that re-rolls the office's props per visit (5.1), the Tesseract (4D,
  7.3 held) as what the wing becomes, the Doorman's door at the end of
  it (A0 #5).

### Phase 6 — Engine-side pieces (1 session each, ⚙)
- 6.1 (split 2026-09-04, §9) — the Training Facility is TWO boards and one
  room, all on the voxel path, and both boards are ✅:
  - 6.1a ⚙ ✅ (2026-09-04, §9) **the walkable Training Room**
    (`DOOR_HQ.rooms.training`, a box room off the egress door at 180°): the
    8×8 pit in the middle as room geometry, the booths, the VHS CRT, the
    RANGE console that launches ORIENTATION (6.1b) / PRACTICE (6.1c — the
    Holo Sim IS the practice floor, decided here). Reuses the enclosure
    vocabulary from 6.1b (`_hqBuildTrainingPit` beside `_hzTrainingRoom`).
  - 6.1b ✅ **`prebuilt_training` — the Training Room board.** A Δ board
    (DELTA FORGE house rules, the shared lava→dirt bed, 4v4) authored flat
    and open like `training_room_v1`: warm plaster-concrete SLABS (the
    `training_floor` terrain, drawn at load — rev 3); the lit seams,
    corner lights, four scorch stars and the whole enclosure are the
    `training_room` scenery theme (walkway ring with A–H / 1–8, maroon
    barriers with red post lamps, solid double-sided walls with dado + trims +
    fluorescent strips, green-lit N/S doors, observation booths W/E, corner
    machinery, clocks, red lamps, the signs). Cutscenes (4.3) play here.
  - 6.1c ✅ **`prebuilt_holosim` — the Holo Sim board.** Arcane
    Engineering's simulation floor from the `holo_sim_v1` refs: `holo` /
    `holo_red` tiles (new terrains, pixel-art data-URI textures, self-lit
    rims via `_EMISSIVE_TERRAIN`) over the same bed, black starfield, a
    fading holographic apron grid + corner beams (`holosim` near builder),
    neon rings + dark ring-glyph monoliths in the far roster. Purpose TBD
    (rec. the practice / loadout-testing floor).
  Both ride the Δ list in match select and friendly online rooms
  (`EW_MAP_META` rows with `isDelta: true, facility: true`); never sites
  (no bay, no leaf, no native pool, no ranked rotation).
- 6.2 ✅ (2026-09-04, §9) Black Cube: the tower was ALREADY the Cube in
  model and label (user: "the towers are already cubes"); this session
  added the missing announcer line ("⬡ THRESHOLD CLOSED — …") and the
  CUBE mastery label. No model work was ever needed.
- 6.3 ✅ (2026-09-04, §9) Keys: every player-facing hourglass label/icon/
  log/banner → Key/🗝 (code identifiers untouched, Hazard Pay precedent);
  the Keys win announces "🗝 THRESHOLD STABILIZED".
- 6.4 (MASTER C-5) Nexus hold → double Cube damage instead of a win.
- 6.5 Battle-board draw-call work (ROADMAP §4 items 1–3) — unrelated to
  the hub, listed here so nobody conflates the two again.

### Phase 7 — THE ROOM REGISTER: every site a numbered room (planned 2026-09-07, ⚙ mostly)
The user's brief (2026-09-07): "eventually all the maps become walkable
rooms inside the HQ just like the Training Room", every map gets a room
number that means something, and the HQ grows the rooms a building needs
(a cafeteria, a trophy case, a barbershop…). The user handed over a list of
~75 room ideas; this phase is the curated version — what stays, what
merges, what is cut, what number each place wears, what each one is built
from — and the mechanism that makes a site walkable. Numbers are the
user's wherever they gave one; **REC** marks a number or a change Claude
proposes and the user has not ruled on (MASTER Part C rows 22–24).

#### 7.0 Rules of the register
1. **One number, one place.** A number is a plate over a door, a line on
   the site file, a row in the building directory. Duplicates were
   resolved below; nothing shares a number.
2. **A number needs a hook or it stays blank.** Alphanumerics are fine
   (Room i, E4, 2D, 4D, 4C, 90S, H-20) — the plate machine does not care.
   A few places are better without one (the Foyer, H-Wing, the Quartermaster's
   vault) and the Canon Office's plate reads `ROOM № — CONTESTED`, which is a
   joke and a policy.
3. **A room is a site or it is a department; never both.** Sites are launch
   maps: full map + Δ board + site file + threshold in a bay + ranked rows.
   Departments host existing functions (A5). The Training Room (64) and the
   Holo Sim (404) are the two facility boards and stay facility boards.
4. **Repetitive ideas fold into the site they overlap** as its DEEP
   CROSSING nickname, its threshold note, or a piece of its setting —
   the idea survives as flavour instead of costing a map.
5. **Nothing is built by this phase on its own.** 7.1 is a data edit (✅
   shipped 2026-09-07, §9); 7.2 is the engine piece; the rooms and sites are
   one session each and the user picks the order.

#### 7.1 ⚙ ✅ (2026-09-07, §9) Numbers on the doors (one data.js + doorhq.test.js delivery)
- `roomNo` on every `DOOR_HQ.thresholds[mapId]` entry (sites) and on any
  door / counter entry in `DOOR_HQ.rooms.*` (departments, amenities);
  `hqRoomNo(idOrMapId)` helper. doorhq.test.js: every launch map has a
  `roomNo`, no two places share one, alphanumerics allowed.
- Where it shows: the plate over the threshold (`ROOM 56` in small caps
  above `STONEHENGE`, the bay sub-line under it); the bay door panel and
  the match-select SITE FILE header (`SITE_FILE_LABELS` gains `ROOM`); the
  result stamp's case line (`CASE EW-nnnn · ROOM 56`); the building
  directory, sorted numerically with alphanumerics last; the loading
  screen's site-file card. The Training Room already does this by hand
  (`ROOM 64 · ORTHOGONAL GEOMETRY EXPOSURE AREA`) — it moves onto the field.
- The elevator's floor panel skips 13 (Room 13 is filed in Bay 1, not on a
  floor). One line of procedural text; the joke is free.

#### 7.2 ⚙ The walkable site (the engine piece) — stage 1 ✅ (2026-09-07, §9: D.U.M.B.) · stage 2 ✅ (2026-09-07 rev 5, §9: CERN + Backrooms, the room's `mood`) · stage 3 ✅ (2026-09-08, §9: Nuketown + the Stadium, the OUTDOOR room — `open`, the sky, the masts) · stage 4 ✅ (2026-09-08 rev 2, §9: the six MOAT rooms — `moat`, the quay, the causeways, the fluid sheet) · stage 5 ✅ (2026-09-08 rev 3, §9: THE SETTING IN THE ROOM — the map's near builder at 1:1, `siteRooms.near`, `_hqBuildSetting`) · stage 6 ✅ (2026-09-08 rev 4, §9: THE REST OF THE REGISTER — the eighteen remaining sites, all outdoor rooms; every launch map is walkable) — 7.2 is COMPLETE
**What shipped** (rev 4): the mechanism and the first room. A site in
`DOOR_HQ.siteRooms.built` gets `hqSiteRoom(mapId)` → a **box** room
(`kind: 'box', fx: 'site', site: mapId` — the Training Room's pattern
reused whole, so shell / doors / counters / props / collision / camera
came for free; the `kind: 'site'` name below is kept for the OUTDOOR
rooms that will need a sky and the map's far roster). The board is read
by `hqSiteBoardInfo(mapId)` from the finished Δ (`PREBUILT_MAPS`) — cells
with a level relative to the Δ baseline, `walk` from `TERRAIN_RULES` +
`HQ_SITE_HAZARDS`, `fluid`, the Δ's tints; the edge walls; the monuments;
the objects; the nexus anchor — and drawn by three-renderer.js
`_hqBuildSiteBoard` (never the battle mesher): one InstancedMesh of cell
quads per terrain, one instanced box per raised cell, a sunk pit + sheet
per lake / lava cell, the thin edge walls, the monuments through the
shared `_monBuilders`, the nexus ring, the Training Room's lit seams and
A–H / 1–8. Walking: `_hqSurface` gained a board layer (`_hq.site`,
`_hqSiteCellAt`) — a +1 step is climbed (the jump-1 rule: raised cells are
rect blockers with `step` = one level), a +2 block is a wall, an edge wall
is a thin blocker, shallow water is a −1 pit you drop into and wade, lava /
deep water are never entered or overflown. The way in is the threshold
leaf from the other side on the SOUTH wall (P1's lane), landing back at the
bay's threshold door; the CROSSING console (west wall, the tanker desk) is
the way on — map.js `_hqCrossingHtml` opens the same site-file panel
(CROSS ▸ Δ / DEEP / Code Red RESPOND) and post-match you stand at the
console. A threshold whose site has a room is walked INTO on E
(`_hqDoorDirectAction`; sealed / clearance doors keep their panel); the
directory GOes into the room; the register's site row carries `siteRoom`.
The room wears no `roomNo` — `hqRoomNo(roomId)` and the console's plate
resolve to the threshold's (7.0 rule 1). The natives stand on the walkway
(`npcSpots` with a `race` hint from `hqMissionPool`; a race with no rigged
model falls back to the roster draw). **Stage 3 (2026-09-08): the
OUTDOOR room.** `shells[id].open: true` makes the box room a compound
under the sky: no ceiling, no conduits, no fluorescents; the four walls
are the site's perimeter (`wall` / `floor` / `dado` may be battle TERRAIN
keys — `_hqTex` falls through to the terrain sheet, tiled at one battle
tile = 1.75 m); an `apron` of ground runs 16 m out past the walls over a
dark `skirt`; `shell.sky` is the map's EW_MAP_META `env` (tint / stars /
nebula / fog / far-roster `scenery` / `density`) plus `night` from the
mood; the four `lights` move to the walkway corners and become lamp
MASTS (pole, head, lens and glow in the mood's colour, a blocker each).
The renderer's `_hqBuildSky` hangs a SECOND firmament dome in the HQ
scene wearing the battle's dome shader and its shared uniforms
(`_hqTickSky` drives uMapTint / stars / nebula / fog / day-night from
`shell.sky` every frame; the battle overwrites them again the moment it
renders, and `_hqLeave` re-arms its fog) and the map's far roster round
the room at the battle's scale — the same body builders (the default
list is now `_hzCosmicRoster()`, shared), the same haze stamp, graded
once, drifting under the HQ loop (`_hq.sky.floaters`), with three of the
Department's lone doors and a few haloes like every outdoor battle
roster. The battle's own horizon group, key cache and floaters are never
touched. Lighting is the sky's: a hemisphere in its tint, a sun by day
or a cool fill by night, the masts' point lights, and the map's fog
colour as the distance fog. Still to do per site: the map's `near`
setting inside the room (today: the generic dressing + the site's signs,
per-site props in `siteRooms.flavour`), the cast lines (A15). **Adding a
site room = one id in `siteRooms.built`** (+ optional `shells[id]` —
textures, `h`, `pipes`, a `mood` for its light, `open` + `apron` /
`skirt` for an outdoor one — / `flavour[id]`);
doorhq.test.js checks the room against its threshold, its bay door, its
board and the register (an open room: a sky that is the map's, masts on
the walkway, nothing hung from a ceiling, a wall tall enough for the leaf).
**Stage 4 (2026-09-08 rev 2): the MOAT room.** `shells[id].moat = { key,
gap, bank, bed, deck, causeways }` on an open room makes its walkway a
QUAY (`pad` grows to quay + gap; the quay keeps the 2.4 m every prop,
native, mast, the guard and the console already stand on): the ring
between the board (the island) and the quay is sunk one level and filled
with the map's own liquid — `hqSiteRoom` fills in `walk` (TERRAIN_RULES +
`HQ_SITE_HAZARDS`, exactly a board lake's rule: water wades, deep water
and lava are never entered), `tint` (the Δ's `terrainTints` for the key,
water falling back to the board's water tint) and `quay`, and hands the
renderer `shell.moat`. three-renderer.js `_hqBuildSiteBoard` draws it as
the near kit's `_nrMoat` brought indoors: one sheet per side in the
battle's own animated fluid material (`_buildFluidTopMat(key)`, the tint
set on it, lava's emissive up; a translucent basic sheet if the shader
is unavailable), the bed under it, the quay's face + coping and the
island's face per dry edge cell in the bank texture (an InstancedMesh),
corner posts, a deck with kerbs across the gap per causeway (the south
one is the way in and always exists; the north one matches the near
kit's pair), four glow sprites on a lava moat — and every board-edge
lake cell of the same liquid OPENS into the moat (its pit box and sheet
are dropped, the moat's sheet covers it, a bank stands only on the
sides that meet a dry cell), so Atlantis's canals and Antarctica's bays
run out into the ring. Walking: `_hqSiteCellAt` returns the moat as one
more pseudo-cell (`_hq.site.moat.cell`: top −1 level, walk from the
data) anywhere in the ring that is not a causeway (`_hqSiteOnCauseway`),
so `_hqSurface` / `_hqAirOK` / the landing / `_hqCamBlocked` treat it
like a board lake with no new branches; climbing out of any pit onto the
walkway is one level (`curY < -0.5` extends the board tolerance). The
water animates under the HQ loop (`_hqTickMoat`: the shared fluid
clock, the key's drift offsets, caustic tile = one cell). The A–H / 1–8
labels and the hazard plate move onto the quay. **A fix that came with
it**: a site room's floor is now a FRAME round the board (or round the
moat) instead of one plane over everything — before this the plane hid
every board pit (D.U.M.B.'s and the Backrooms' water sat under it). Six
rooms: i (grass quay, the curtain wall, a plank drawbridge, torchlight),
H-20 (marble under a ruined wall, the canals' teal moat at night), 666
(scorched ground, obsidian, a lava moat, basalt causeways, red light),
2012 (cobbles, the glyph wall, the calendar's cyan canal, torches), 88
(marble under the cavern wall, the inner sea, crystal light by day), 90S
(snow under the ice wall, deep water, an ice bridge, polar day).

**Stage 6 (2026-09-08 rev 4): THE REST OF THE REGISTER.** The eighteen
sites that had no room got one each — a data batch, no renderer change,
because stages 3–5 made a site room `built` + `shells[id]` + a `near`
row + `flavour[id]`: 14179 Shasta (a cliff wall, the pines in the room),
56 Stonehenge (the sarsen ring on the walkway, violet night), 444 Giza
(casing-stone walls, the pyramids over them), 777 Heaven (cloud
underfoot, the north Gate — the south one is the hotel door), 2047
Cyberpunk City (the towers right behind a 12.6 m tenement wall, neon
strips), 11 Babel (the terraces as `stands`, the console on the north
wall — the north terraces make way for it), 12 Olympus, 4 Mars, 51 Area
51 (the fence and the towers inside, the console on the north wall
because the west hangar has the west), 512 Skinwalker Ranch, 180 Hollow
Earth (the inner sun overhead), 420 Fairy Forest (the console on the
east wall; the spring has the west), 1969 Moon (a 3.0 m regolith berm —
the door had no wall; Records built one), 888 Vatican City (the
basilica front across the north strip, the dome over the wall), 23
Bohemian Grove, 9600 Göbekli Tepe, 1225 North Pole (the workshop has
the west wall; console north), and 2D Flat Lands — the one room WITHOUT
its setting (`setting: false`, `pad: 7`): the plane's builder hands
`_nrKit` a fourteen-tile apron, which would make a 63 m room for one
dead tree, so it keeps a 7 m walkway and its emptiness. None of the
eighteen boards holds lava, void or an edge lake worth opening, so none
is a moat room (Shasta's lake and the Grove's creek lie OUTSIDE the
kit's apron in the battle, and `_nrMoat` is a no-op in the room). Day
or night per room follows the map's sky. **7.2 is complete: every
launch map in the register is a room you walk.** Known and accepted:
the setting cull drops what stands in the console's run or the way in
(Vatican's obelisk stands on the south lane; Babel's north terraces),
and a GLB prop that has not loaded when `_hqBuildSetting` runs (the
obelisks, the mushrooms, the dumpsters) has no bounds yet and so is
neither culled nor a blocker — it lands where the battle puts it.

The Training Room is already the pattern: a `kind: 'box'` room whose floor
carries the 8×8 pit (`shell.grid`, one 1.75 m cell per battle tile — a
battle tile IS 128 world units = 1.75 m at `DOOR_HQ.units` 73, so a Δ
board drops into an HQ room at 1:1 with no rescale), the RANGE console
launching the board, the enclosure drawn by the same vocabulary as the
board's scenery theme. Generalise it:
- **`kind: 'site'` rooms are generated, never hand-edited** —
  `hqSiteRoom(mapId)` beside `hqBayRoom(sector)`: the site's Δ board in
  the middle as WALKABLE terrain, the map's `near` setting around it, the
  way in (the threshold leaf from the bay, seen from the other side), the
  way ON (a CROSSING console — or the far spawn lane's D.O.O.R. threshold
  from THE CROSSING cinematic, standing on the apron — that launches
  `_hqLaunchMission(mapId)` / DEEP CROSSING exactly as the bay panel does
  today), and the site's native entities loitering as NPCs.
- **The board as room geometry, within the §0 / §6 guardrail** (the hub
  never uses the battle-board builder or its shadow pass). Draw the Δ the
  way the HQ already draws its stairs and light strips: ONE
  `InstancedMesh` per terrain texture (64 cells → typically 3–6 draw
  calls), per-instance height from the board's height grid, the fluid
  tiles as one `_buildFluidTopMat` sheet each (the moat kit does this
  already), objects / monuments through the near kit's `_nrProp` and the
  foliage loader (`_nrTrees`). This is a static Δ builder, not the tile
  renderer; it also happens to be ROADMAP §4 item 1's fix, so the work
  pays twice.
- **Walking it**: `hqOccupancy` gains a board layer — a cell is walkable
  when `TERRAIN_RULES` says so AND the step from the neighbour is ≤ 1
  (the jump-1 rule the boards are already authored to), water and lava
  block, `void` / `chasm` are the walk-off edges the controls rework
  already handles. Height comes from the board, not from `level`.
- **Outdoor sites** need a sky: `kind: 'site'` rooms carry the map's
  `env` (firmament tint / stars / nebula / fog) and its far roster
  (`env.scenery`) — the renderer already builds both from `state.mapEnv`;
  the HQ drives them from the room instead. Indoor sites (D.U.M.B., CERN,
  Backrooms — near builders that are already `_nrRoom`s) are plain box
  rooms and are the cheapest to do first.
- **Flow**: a threshold door in a bay opens INTO the site room (a real
  door-blink transition) instead of straight to match-select; the crossing
  is launched from inside. `_hqLaunchRoom` remembers the site room, so
  post-match you stand on the apron where you left. Nothing about match
  setup is bypassed (§3.7 still holds).
- **The cast on site**: `doorSiteCrossings(label)` already names the
  natives; spawn 2–3 of them at `npcSpots` on the apron with idle clips
  from the shared library (every one of the 96 races has a rigged model or
  a sprite) — talking to one opens its Codex dossier. Fog rules do not
  apply (nothing here runs during a match, RULE #2 §3.8).
- Order of construction (cheapest first, each ⚙): 555 D.U.M.B. → 999 CERN
  → 90 Backrooms (box rooms) → 64's neighbours 1945 Nuketown and 50
  Stadium (flat, no water) → the moat maps (Camelot, Atlantis, Hell,
  Technoticlan, Agartha, Antarctica) once the fluid sheet is in → the rest.

#### 7.3 THE REGISTER — sites (29 shipped + 2 facility boards)
Bay = the containment bay after the 7.5 rebalance. **REC** = Claude's
number; everything else is the user's.

| Room | Site | Bay | Why this number |
|---|---|---|---|
| **0** | The Singularity *(new, 7.6 #7)* | Quarantined | the user's Void (0) and Singularity (1) merged — a point of zero volume |
| **2D** | Flat Lands | Quarantined | REC — Abbott's *Flatland* is two-dimensional; pairs with 4D |
| **4** | Mars | Celestial | fourth planet |
| **4D** | The Tesseract *(hold, 7.7)* | Quarantined | the hypercube |
| **6** | Saturn *(new, 7.6 #5)* | Celestial | sixth planet; the black cube in the egress is already "the Saturnian black cube" (data.js `shell.cube`) |
| **11** | Tower of Babel | Ancient | REC — Genesis 11 |
| **12** | Mount Olympus | Diplomatic | REC — the Twelve Olympians |
| **13** | The Haunted House *(new, 7.6 #1)* | Terrestrial | the floor hotels leave out; the elevator (7.1) skips it |
| **21** | The Strip *(new, 7.6 #3)* | Urban | blackjack |
| **23** | Bohemian Grove | Terrestrial | the 23 enigma |
| **27** | Club 27 *(hold, 7.7)* | Urban | the 27 Club; the user's concert / dive bar / disco / studio, merged |
| **33** | The Lodge *(new, 7.6 #2)* | Terrestrial | the 33rd degree; Skull & Bones (322) is its basement |
| **50** | Football Stadium | Urban | REC — the 50-yard line (the user's 42 has no football hook; see 42 under departments) |
| **51** | Area 51 | Terrestrial | itself; Roswell 1947 folds in — the saucer on the rig IS the wreck, the plate reads `EST. 1947` |
| **56** | Stonehenge | Ancient | the 56 Aubrey holes |
| **64** | Training Room *(facility)* | — | ✅ shipped; 8×8 |
| **80** | The Colosseum *(hold, 7.7)* | Ancient | REC — inaugurated AD 80 (the user's 300 is Spartan, and Greek; alt) |
| **88** | Agartha | Hollow | the user's; the plate reads as ∞ stacked on ∞ — the world inside the world |
| **90** | Backrooms | Quarantined | the user's "Off Limits" — it's 90 degrees. The one place in the register made of right angles; beyond H-Wing when H-Wing exists (MASTER C-12) |
| **90S** | Antarctica | Hollow | 90° south |
| **180** | Hollow Earth | Hollow | REC for the user's blank 180 — "the floor on the far side is the ceiling" (its own threshold note) |
| **222** | Mitosis *(hold, 7.7)* | Quarantined | cells divide 2→2→2 |
| **343** | The Mothership *(hold, 7.7)* | Celestial | the user's alien ship; the saucer from Area 51, inside |
| **345** | The Bermuda Triangle *(new, 7.7 wave 2 · the user 2026-09-15 rev 8)* | Hollow | REC — 3-4-5, the first right triangle; the user's own joke ("it's a right triangle") is the plate: `∠ 90°` under the number |
| **369** | Tesla's Lab *(hold, 7.7)* | Terrestrial | REC — 3-6-9 (the user's 333 as alt; the quote is apocryphal, which is on brand) |
| **404** | Holo Sim *(facility)* | — | the user's "room not found" — the Simulation is a projection, not a room |
| **411** | The National Park *(hold, 7.7)* | Terrestrial | Missing 411 |
| **420** | Fairy Forest | Diplomatic | the user's Enchanted Forest; the mushrooms are not that kind |
| **432** | The Cathedral *(hold, 7.7)* | Diplomatic | the user's Resonance Chamber — 432 Hz, the organ |
| **444** | Pyramids of Giza | Ancient | four faces, three times |
| **451** | The Library of Alexandria *(hold, 7.7)* | Ancient | Fahrenheit 451 — the one library Records did not keep |
| **512** | Skinwalker Ranch | Terrestrial | REC — the ranch is 512 acres |
| **555** | D.U.M.B. | Terrestrial | the user's Pentagon / military base, folded onto the deep underground military base — five sides above ground, the sixth is down |
| **666** | Hell | Diplomatic | — |
| **711** | The Gas Station *(hold, 7.7)* | Urban | 7-Eleven |
| **777** | Heaven | Diplomatic | — |
| **888** | Vatican City | Diplomatic | the user's; moves bays (7.5) |
| **999** | CERN | Terrestrial | 666 upside down; also the Swiss emergency number is not 999, which Records finds suspicious |
| **1225** | North Pole | Hollow | Dec 25 |
| **1600** | The White House *(hold, 7.7)* | Terrestrial | REC — 1600 Pennsylvania Ave (the user's 1776 as alt) |
| **1717** | Pirate Bay *(hold, 7.7)* | Hollow | the year of the pirates' pardon; also the year the first Grand Lodge sat, which Room 33 will not confirm |
| **1812** | Tartaria *(new, 7.7 wave 2 · the user 2026-09-15 rev 8)* | Ancient | REC — the mud flood's year in the lore; alt 1666 (the reset) or 1908 (the last world's fair — the buildings "they" tore down). The Bureau of Continuity's plaque already argues about this |
| **1945** | Nuketown | Terrestrial | the test; the user's 90210 Suburb folds in (Nuketown IS the suburb) |
| **1954** | Downtown *(new, 7.6 #4)* | Urban | REC — the first kaiju film; the user's 911 "Disaster City" (MASTER C-24: 911 + a ruined metropolis reads as 9/11 to a lot of players — the comedy supports the danger, A12 #2, but that is the wrong danger; alt 1933, Kong) |
| **1969** | Moon | Celestial | the user's Lunar Soundstage — the site file already says the footprints are from missions that never happened |
| **2001** | Jupiter *(hold, 7.7)* | Celestial | the monolith; Saturn first |
| **2012** | Technoticlan | Ancient | the calendar |
| **2047** | Cyberpunk City | Urban | the user's (2049 / 2077 alts); moves bays (7.5) |
| **9600** | Göbekli Tepe | Ancient | 9600 BC |
| **14179** | Mount Shasta | Hollow | REC — the summit elevation in feet, like a trailhead sign (alt: 7, one of the seven sacred mountains) |
| **E4** | The Looking-Glass *(new, 7.6 #6)* | Quarantined | the king's pawn — the user's Chess Board and House of Cards / Wonderland merged |
| **H-20** | Atlantis | Hollow | the user's; sub-line `DEEP OCEAN ORICHALCUM RESEARCH` (the user's research-station idea is Atlantis's own name, not a second map) |
| **i** | Camelot | Ancient | the imaginary kingdom (√−1) |

#### 7.4 THE REGISTER — departments, amenities, counters (the HQ side)
Each is a `kind: 'box'` room from the existing kit plus counters onto
functions that already exist, unless marked. ⚙ throughout; 🧊 only for
the hero prop named in §5.6.

| Room | Place | Ring | Hosts | Number's hook |
|---|---|---|---|---|
| **1** | Reception · Intake ✅ (2026-09-14, §9) | Operations | ✅ SHIPPED — `rooms.reception`, the window door at 120° walks in (it was a door straight to the profile). THE INTAKE WINDOW → `_mountReactProfile` (the ID card: callsign, desk stripe, photo, the stamps on the back); THE LAMINATOR (`laminator` proc on the second desk, a card half out of it) → `overlay: 'intake'` (map.js `_hqIntakeHtml`, data.js `hqIntakeCard`: employee number, callsign, desk, clearance, rank, issue date, photo on file, visits · days, reissues, the LOST CARD FEE 💰 86 — collected to date: 0); NOW SERVING (`now_serving` wall proc: red digits = the first half of the officer's employee number, the dispenser bolted under it) → a panel: your ticket is the second half, AHEAD OF YOU is the gap. The queue lane, four folding chairs, the files, the clerk at the window, the guard, the new hire holding number four. The hall's intake wedge at 128° stays (it is the window from the hall side) | REC — "one foot in the door" (A0 #1); forms start at 1 |
| **4C** | The Corner Office ✅ (2026-09-14 rev 2, §9) | Executive (L4+) | ✅ SHIPPED — `rooms.corner`, the executive-glass door on the lobby’s east wall. THE IN-TRAY (counter `intray` on the `exec_desk` proc) → `overlay: 'intray'` — the closet’s case file, the same sheet; THE PLAQUES (two `wall_plaques` procs on the south wall, gold per `hqTrophyCount` at build) → `_mountReactTrophies`; THE WINDOW (counter `view`, `action: {}`) → a panel: the seven bays, `hqSiteMastery` summed per bay (`_hqCounterPanelHtml` by id). Two `false_window` procs (north + east — a corner has two outside walls), the `exec_chair`, the requisitioned mini fridge, two visitor chairs. The closet stays yours; its door is still the rank door | the user's; a corner office in a round building — one dimension short of Room 4D, and a Form 90 problem |
| **8** | The Infinity Pool ✅ (2026-09-14 rev 2, §9) | Executive (L4+) | ✅ SHIPPED — `rooms.pool`, the glass door on the lobby’s north wall. An OPEN room (`shell.open`, `edge: 'low'` = the parapet, the 7.2-stage-3 shell on a hand-authored room for the first time) under Heaven’s own sky (`shell.sky` = the `prebuilt_heaven` env row: tint, fog, the divine roster, daylight; doorhq.test.js diffs them) with the cloud plain (`apron: 'cloud_2'`) running out past the parapet over the void; the `infinity_pool` proc (a raised basin, marble coping, a weir on the far side the water goes over, the ladder, two lamps) is the first prop with a RECT blocker (catalogue `rect: { hw, hd }`, room axes — both prop-blocker sites pass it through); `pool_lounger` ×6 (the `onlineSpots` take three, the top of the board sits on one), `pool_umbrella` ×2, palms, the lamps as `shell.lights`. THE EDGE (counter, `action: {}`) → a panel: the void, the punch clock’s streak as ON BREAK, the engraved count; THE RANKING → `_mountLeaderboard`. Its own board: still optional later | the user's; ∞ on its side |
| **42** | Records · Archives ✅ (2026-09-13 rev 2, §9) | Support | ✅ SHIPPED — `rooms.records`, the wired double door at 240° walks in (it was a screen door with two alts). THE READING DESK → `_goToCodex` (the dossiers), THE CARD CATALOGUE (`card_catalogue` proc: six columns of little drawers, one left open) → `_mountCommunityMaps` (a modal over the paused building — map.js `_HQ_MODAL`), the service stair `tapes` on the north wall → Room 360's projector (the tape library, directly overhead); the stacks (six shelves), the archivist at the desk, the clerk at the stacks | REC — if the stadium takes 50, 42 goes to the room that has the answer to everything and only keeps the file |
| **86** | The Cafeterium ✅ (2026-09-11, §9) | Support | ✅ SHIPPED — `rooms.cafeteria`, the door at 75° on the ground ring; the roster ON BREAK (`npcSpots`), online silhouettes from `#mmOnlineCount` (§8 open question — this is where they go), the vending machine that was on the other side yesterday, the notice board (mirrors 247's sheet). **After hours (a Phase 5.1 variant, rolled per visit) the door reads `MÖBIUS STRIP CLUB`** — same room, the bar counter is a Möbius loop (one lathe), nobody comments | the user's; 86'd — the menu is always out of it |
| **101** | Your office (the closet) | Support | ✅ shipped | the user's; Orwell's room holds your worst fear, and yours is a closet |
| **111** | The Trophy Case ✅ (2026-09-13, §9) | mezzanine, over EMPLOYEE OF THE MONTH | ✅ SHIPPED — `rooms.trophycase`, the mezzanine door at 290° (between Bay 6 and the Bureau; the board at 288° is directly below). THE CABINET → `_mountReactTrophies` = the profile opened on its Achievements tab (profile.js `ProfilePage({ initialTab })`); two `trophy_case` procs (a lit glass cabinet, three rows of plaques — gold for the engraved ones, `hqTrophyCount(profile)` reads the ledger — the cups on the top shelf); the curator | the user's; first place, three times over |
| **247** | The Clock Room ✅ (2026-09-11, §9 rev 3) | Support | ✅ SHIPPED — `rooms.clockroom`, the door at 225° (between Medical and Records). **D.O.O.R. = Daily Office Operations Requirements** (the user's) as `FORM 365` (7.9 ✅): three lines a day seeded like Code Red, Hazard Pay (SP when the meter exists, 4.1); the punch clock (the login streak); the canon-date clock; today's Code Red posted. Every clock in the room disagrees on purpose (five on the rail, four on the walls at four heights) | the user's 247 and 365 merged — 24/7, and the form number is the year |
| **360** | The Observatorium ✅ (2026-09-11, §9 rev 5) | mezzanine | ✅ SHIPPED — `rooms.observatorium`, the mezzanine door at 240° (directly above Records, between Bay 3 and Bay 6). **THE STAR CHART** (counter → `overlay: 'starmap'`): every threshold a star, seven constellations (one per bay, Bay 1 at twelve), point at one and its OWN door panel opens from here (CROSS ▸ Δ / DEEP / WALK IN / the Code Red brief, ◂ THE CHART back) — data.js `hqStarChart` is the ONE layout the ceiling (`star_dome`), the wall chart (`star_chart`) and the panel share, the stars in their lamps' colours, sized by the mastery count. **THE PROJECTOR** (counter → `_ewReplayLastMatch`): Replay moved up from Records (its door's alt now leads here, `alt.room`). The dome is a painted ceiling (the `void` sheet) under the projected sky; the telescope is pointed at the paint | the user's; 360° |
| **1111** | Medical ✅ (2026-09-13 rev 3, §9) | Support | ✅ SHIPPED — `rooms.medical`, the hospital door at 210° walks into the ward (it was a door straight to Challenge mode). THE SERVICES DESK → `_goToCampaign` (revives, retries, the ladder); THE CHART (a `clipboard` on the east wall between the two cots) → `overlay: 'chart'` (map.js `_hqChartHtml`, data.js `hqMedicalRecord`: crossings on file, RELEASED, EXITED — processed, not dead — healing, dodges, crits, the punch clock's days, and the CONDITION line); the cell door `padded` on the north wall → Room 5150. The nurse at the desk, the orderly by the cell door, a patient on the far cot, a native waiting on the folding chair | the user's |
| **5150** | The Padded Room ✅ (2026-09-13 rev 3, §9) | off Medical | ✅ SHIPPED — `rooms.padded`, 3.6 × 3.6 behind the ward's `leaf_cell`: three walls of tufted vinyl (new wall proc `wall_padding`), the fourth is the door's, a cot bolted down, a drain, one tube, the hold order on a clipboard by the door. THE HOLD (counter, `action: {}`) is a panel that repeats the chart's condition — SERVE IT when `door.leave` is set, NOT TODAY otherwise. Story: administrative leave (`DOOR_STORY.md` §4) is served here when the story serves it (nothing sets `door.leave` yet; the hearing is Room 1984's, 4.2, A15) | the user's; California's involuntary hold |
| **1287** | Occam's Barbershop ✅ (2026-09-11, §9 rev 4) | Support | ✅ SHIPPED — `rooms.barbershop`, the door at 105° (between the Quartermaster and Reception). The user's "change your appearance": THE CHAIR picks the HQ avatar (the recruit / your most-played vessel / a D.O.O.R. agent / any declassified rigged vessel — `door.hq.avatar`, swapped in place), THE MIRROR is the ID card and its photo follows the chair; the callsign is still edited on the card (Reception's). "The simplest cut" | William of Ockham, b. c. 1287 (Claude's fill, decided with C-22) |
| **1337** | IT (inside Arcane Engineering) ✅ (2026-09-13 rev 2, §9) | Operations | ✅ SHIPPED — `rooms.it`, the mezzanine door at 120° (between the research offices at 90° and Bay 5 at 150°; the round cabinet moved to 113°). The user's Hacker Room as a door, not a map: THE LIBRARY → `_goToSpellLibrary` (the editor + the Spell Lab; `_spellLibraryBack` comes home to the building), THE BENCH → `_launchBalanceSim` (the balance lab), THE RACKS → `_launchAITraining` (the champion / challenger rig) — A5's dev surfaces have a physical home. Three `server_rack` procs (LEDs, the glow on the floor), the `keypad` proc INSIDE by the way out with the code on a sticky note. The plan's hollow-core leaf is L2's rank leaf, so the door is `leaf_holographic` — the fourth door that wasn't there yesterday | the user's |
| **1984** | The Interrogation Room ✅ (2026-09-13, §9) | Support | ✅ SHIPPED — `rooms.interrogation`, the ground door at 255° (between Records and Bay 1; a cell door). The steel table (`steel_table` proc), two folding chairs face to face, the desk lamp, the file, the kit's round observation window on the north wall as the one-way mirror. THE TABLE → `overlay: 'transcript'` (map.js `_hqTranscriptHtml`): what the CPU learned from watching you play — the TRAINING MATCH imitation ledger (battle.js `_ewImitationSnapshot`), the last session's full report. THE GLASS → a panel, no action. Story (the leave hearing, 4.2 micro-scenes) still waits on the user's lines (A15) | the user's |
| — | The Fourier Foyer ✅ (2026-09-15, §9) | the front door | ✅ SHIPPED — `rooms.foyer`, a box room behind the revolving door at 195° on the lower wall (between the Training Room and Medical; the cooler and the round picture moved off its panel). THE FRONT DOOR (south wall, `leaf_entrance`) → `_hqExitToMenu`: the street is the main menu, the strip's EXIT as a door; the revolving door (north wall, the same leaf as the hall's) walks you in; THE SEAL in the terrazzo (`door_seal` proc — the department's name, EVERY CROSSING IS INSPECTED · EVERY ENTITY IS FILED, a door in a square in a circle); CORNER INSPECTION (counter `inspection`, a by-id panel off data.js `hqCornerInspection`: four corners, ninety degrees, PASS / PENDING, the visit count, the punch, the orientation motto, the canon date); the mat (WIPE YOUR CORNERS), the umbrella stand, the bench, the inspector, the doorman. **The spawn-in-the-foyer decision: taken** — a fresh arrival from Play stands inside the front door and walks in (`_hqArrivalRoom`; `?nofoyer` / `ew_hq_foyer='off'` restore the hall) | no number — it's a foyer |
| **№ — CONTESTED** | The Bureau of Continuity ✅ (2026-09-15 rev 2, §9 — plan 4.4) | Executive (L5+, 24 Keys) | ✅ SHIPPED — `rooms.continuity`, the house door at 315° on the mezzanine walks in (the gate and the number stay on the door). THE MOTTO PLAQUE (north wall, `motto_plaque` proc reading `hqMottoBarometer` at build) → a by-id panel: the reality barometer — which of A7's three forms the plaque reads (the chapter band = the clearance until 4.1), which orientation taught, what you REMEMBER it reading (`hqMottoObserve` files every arrival's reading; a changed wording goes on the officer's remembered list); CANON NOTICES (east wall, two boards) → a by-id panel: `hqCanonNotices` — every retcon the building has made, dated the day it was always true. The Canon Officer at the desk, the Continuity Clerk at the cabinets, the ONE clock that is right | the user's (`why: 'a joke, and a policy'`) — the number is contested, so the room has none |
| **R** | THE ROOFTOP *(new, the user 2026-09-15 rev 8: "it's not what you'd expect")* | above the penthouse | ○ planned — the elevator's unlabelled top button (`DOOR_HQ.elevator.stops` gains `R` above PH, lit only at KEYHOLDER + the penthouse's 12 Keys — the penthouse's gate reads through) or the penthouse's fire stair. The OPEN room (`shell.open`, the Infinity Pool's recipe) on the dome's crown: the helipad ring, the plant room, the water tank, the aerials, the rail round the edge (THE PARK RULE: the rail is the grind of the building; the plant-room roof is the ramp). **THE TWIST is the user's to write** (A15 — Claude drafts three, the user picks or replaces): (a) the sky over the roof is NOT the sky the front door opens onto — the foyer's street is a desert at noon, the roof is under the Antarctic night (the building is not where it says it is; the Bureau's notices already argue about the floors); (b) the roof is a FLOOR — the ground ring's floor plan painted on the concrete, the same doors as painted outlines, one of them real (the elevator skipped 13; this is 13); (c) the roof is THE BOARD — the helipad is a Δ battle map (`prebuilt_rooftop`, Urban, the seventh bay's home site) with the city rim around it, and the encounter (9.4) authored for the facility's ONE wild room (the roof is outside). REC (a) + the rail. | the elevator's button that has no label; the sign on the door reads `ROOF ACCESS · AUTHORISED PERSONNEL` and the door is not locked |
| — | Quartermaster, Arcane Engineering, the Elevator, H-Wing | — | as A5 | no number; the elevator skips 13; H-Wing is a wing |
| Bay 1–7 | the containment bays | Operations | as 7.5 | bay numbers, not room numbers |

#### 7.5 ⚙ ✅ (2026-09-07, §9) Seven bays (the sector rebalance; MASTER C-23 DECIDED)
Terrestrial holds 8 sites and every good new idea is terrestrial; the
Quarantined bay holds 2. A seventh bay door is a data edit (doorhq.test.js
wants one bay door per sector; the two curved stairs hug the lower wall
at 18–62° and 298–342°, so the ground ring is only free at ~75° between
the east stair's top and the Quartermaster — the mezzanine at 180°, above
the training door and opposite the elevator, is clean once two boxes
move) and two moves are on-lore:
- **BAY 7 · URBAN** ("cities · the strip · the night shift", REC on the
  mezzanine at 180°, `leaf_glass` — a shopfront): Cyberpunk City (from
  Celestial), Football Stadium (from Terrestrial), The Strip, Downtown;
  later Club 27, the Gas Station.
- **Vatican City → DIPLOMATIC** — it is a sovereign state; "immunity
  claimed" is literally its position.
- **Atlantis → HOLLOW** and the bay's sub-line becomes `inner earth · polar
  · the deep`; Pirate Bay joins it later.
Resulting bays after wave 1 (36 sites): Terrestrial 8 (1945, 51, 512, 23,
555, 999, 33, 13) · Urban 4 (2047, 50, 21, 1954) · Ancient 6 (56, 444, 11,
9600, i, 2012) · Hollow 6 (14179, 180, 88, 90S, 1225, H-20) · Celestial 3
(4, 1969, 6) · Diplomatic 5 (777, 666, 12, 420, 888) · Quarantined 4 (90,
2D, 0, E4).
**Shipped 2026-09-07 (§9):** `sectors.urban` (Cyberpunk City + the
Stadium today; the wave-1 sites join here), `bay_urban` at 180° on the
mezzanine wearing `leaf_glass` (the shopfront; the two boxes that stood
there moved to 133°), Vatican City → Diplomatic, Atlantis → Hollow (sub
`inner earth · polar · the deep`), the bay guards' lines follow their
sites. Bays today (29 sites): Terrestrial 6 · Ancient 6 · Hollow 6 ·
Celestial 2 · Diplomatic 5 · Quarantined 2 · Urban 2.

#### 7.6 New sites — wave 1 (seven, one session each, ⚙ + 🧊 the hero prop)
Chosen for: a roster gap (races with no home of their own), a silhouette
none of the 29 has, buildable from the existing tiles / objects /
monuments / near kit, and a number that lands. Each = the checklist in 7.10.

1. **Room 13 · THE HAUNTED HOUSE** (gothic; Terrestrial). ✅ SHIPPED 2026-09-13 (§9). The gap: seven
   races carry the `gothic` tag (wizard, ghost, werewolf, gargoyle, vampire,
   necromancer, ghoul) and none has a gothic point of entry — they are
   filed at the Grove, the Forest, the Backrooms, the Vatican, Stonehenge,
   Hell. Board: the ground floor of a mansion cut open (Camelot's
   hollow-voxel technique — `bricks_2` / `wood` / `carpet_2` rooms, edge
   walls, doorways), the graveyard out back (`gravestone`, `bone_pile`,
   `dark_woods`, `tree_5`). Near: `_nrHouse` gables around the board as
   the rest of the house, an iron `_nrFence`, dead trees, the pumpkin patch
   and the coven's bonfire (the user's Halloween Town / Witch's Coven, 31,
   folded in as the setting), a `woodcross`. Far: `dark` (Camelot's).
   Ambience: `ambNight` + `thunderAmbience` exist. Threshold leaf:
   `leaf_hotel` — the plate says 13, the door says 237 (the user's Hotel
   folds in: one of the doors inside is the Overlook's, the film's number).
2. **Room 33 · THE LODGE** (clandestine, indoor; Terrestrial). ✅ SHIPPED 2026-09-13 (§9). The mosaic
   pavement is the `checkerboard` tile; the two pillars are `column_1` /
   `column_2` flanking the nexus; the altar a `tablet`; the all-seeing eye is
   the `eyeball` OBJ that already floats in the `eyes` roster, hung over the
   board as the lamp; `damask` wallpaper and a `wood` dado through
   `_nrRoom`; `torch`es and a `censer`. Distinct from the Grove (redwoods,
   outdoors) as a temple interior. The user's Skull & Bones (322) is its
   DEEP CROSSING — "THE TOMB, sub-basement". Natives: men in black,
   general, politician, conspiracy theorist, marksman, halfdemon, fortune
   teller (biome neighbours until retagged). Leaf: `leaf_vault`.
3. **Room 21 · THE STRIP** (urban / neon; Urban). ✅ SHIPPED 2026-09-13 (§9). Not a casino floor (no
   slot-machine object exists) — the boulevard: `urban_street` +
   `_nrRoadLines`, the fountain (`_nrPool` with the Vatican's jets), palms
   (`tree_3`), the wedding chapel (the `church` object), `lamp_post` and
   `traffic_light` objects, the Luxor (the `Pyramid` GLB + an `obelisk` —
   "Las Vegas has a pyramid; Records has questions"). Near: `_nrBlocks`
   towers with lit windows, text neon (`_hzTextTex`), `jumbotron` marquees,
   `_nrLamps`. Far: `city`. Natives: homosapien, politician, conspiracy
   theorist, superhero, antihero, honda civic, zombie. Leaf: `leaf_motel`.
4. **Room 1954 · DOWNTOWN** (urban, monster-movie; Urban). ✅ SHIPPED 2026-09-13 (§9). The gap: kaiju,
   king kong, superhero, super sentai, antihero, zombie have no downtown
   (their entries are Antarctica, Hollow Earth, Cyberpunk, Technoticlan,
   Nuketown). Board: `urban_street` / `concrete_floor` / `rubble_1..4`,
   `building_1..11` and `abandoned_building_*` objects, `stairs`,
   `traffic_light`, `lamp_post`. Near: the Cyberpunk block recipe in daylight
   concrete, one tower collapsed across the apron (a tilted `K.box`),
   `dumpster`s, a `securitycam`. Far: `city`. Ambience: `ambDay`. Leaf:
   `leaf_revolving` (a lobby door, revolving the wrong way).
5. **Room 6 · SATURN** (space; Celestial). ✅ SHIPPED 2026-09-13 (§9). The Cube's home. Board: the
   north-pole hexagon storm — a hex-ish plateau of `moon_3` / `mars_2`
   tinted ochre, `oil` tiles as the hydrocarbon lakes, `storm` /
   `cloud_thick` at the rim (Olympus's cloud-sea vocabulary), `tower_cube`
   objects as cover ("smaller cubes; do not stack"). Far: `space` with the
   `rings` monument as the ring plane cutting the sky and a `lenticular`.
   Natives: martian, cosmic wraith, voidweaver, mantid, barbarella, black
   goo, grey, nordic. Leaf: `leaf_bulkhead` (the Mars airlock's twin,
   frost on the other side). Nothing to model.
6. **Room E4 · THE LOOKING-GLASS** (astral; Quarantined). ✅ SHIPPED 2026-09-12
   as a MOVING MAP in DIPLOMATIC (Bay 6 is sealed until a chapter; the Queen
   claims immunity) — the board flies through the void of shapes instead of
   sitting in a hedge maze; the giant pieces are the rim's props and the
   roster's bodies (a lathe, `_hzChessPiece`; the knight is boxes until §5.6
   models a head), the card soldiers stand on the rim; see §9 2026-09-12.
   The plan as written: the Δ board is
   8×8 — this is the purest one: `checkerboard` / `checkerboard_2` marble,
   giant pieces as monuments (pawn / rook / bishop / queen / king are lathe
   and extrude geometry Claude generates — new `_MON_BUILDERS` keys; the
   KNIGHT needs a horse head, §5.6). Near: a hedge maze (`_nrTrees` boxes
   in `leaves_*`), the card soldiers (flat planes with a canvas-drawn face —
   the user's House of Cards, 52, folded in), the `mushroom` monument at
   oversize, a teacup or two. Natives: glitch, machine elves, dreameater,
   fortune teller, telepath, occulus, and the knights (knight, king arthur —
   "the knight's move"). Leaf: `leaf_frame_only`, mirrored.
7. **Room 0 · THE SINGULARITY** (astral / space; Quarantined). ✅ SHIPPED 2026-09-13 to CELESTIAL (§9; the sealed bay rule, as E4). The user's
   Void and Singularity as one map: a spiral of rock shards (`moon_3`,
   `crystal`) over nothing (`void` / `chasm` tiles are the gaps), falling
   toward the nexus. Far: `space` at high density with a `beamring` +
   `lightpillar` at the centre as the accretion light. Cheapest of the
   seven — tiles and far scenery only. Distinct from Flat Lands (an empty
   plane) and the Holo Sim (a grid). Natives: voidweaver, cosmic wraith,
   glitch, dreameater, black goo, occulus, the watcher. Leaf:
   `leaf_frame_only` — "a frame; there is no other side".

#### 7.7 New sites — wave 2 (hold; good, not urgent — TARTARIA and THE BERMUDA TRIANGLE added by the user 2026-09-15 rev 8; THE ROOFTOP is an HQ room, 7.4)
| Room | Site | Bay | One line |
|---|---|---|---|
| 4D | The Tesseract | Quarantined | nested cubes (`tower_cube`, `holo`, `beamring`); the single best lore fit (what H-Wing becomes) — held only because 0, 90 and 404 already cover "abstract"; take it before 222 |
| 27 | Club 27 | Urban | the user's concert + dive bar (27) + disco (69) + recording studio (808) as ONE venue: the lit `checkerboard_3` dance floor, a `jumbotron` LED wall for the stage, the bar; **the booth (808) is a counter = the jukebox — pick the battle theme from the 29-track battle pool** (a real function, and the reason to build it) |
| 80 | The Colosseum | Ancient | the user's Gladiator Arena: sand (`dirt_3`), `column_*`, the hypogeum (`chasm`); near = the Stadium's `_nrTiers` in stone + `_nrColonnade` arches; natives minotaur, cyclops, giant, golem, chosen one, nephilim |
| 451 | The Library of Alexandria | Ancient | the fire spreading as `lava` / `scorched` (Hell's vocabulary, orange), `bricks_1`, `tablet` monuments as scroll racks, `torch`; the Pharos as a far `_nrTower`; "We only keep the file" |
| 711 | The Gas Station | Urban | night, `urban_street`, `_nrLamps`, an `_nrHouse` canopy, `dumpster`, `traffic_light`; far `eyes`; natives cowboy, scarecrow, conspiracy theorist, zombie, mothman, and the honda civic — Sedaniel is paid in oil changes |
| 1600 | The White House | Terrestrial | the Vatican recipe: lawn, `_nrColonnade` + `_nrHouse` facade, fence, `_nrPool`; natives politician, general, men in black, marksman |
| 1812 | Tartaria | Ancient | the user's lost advanced civilization (2026-09-15 rev 8): a world's-fair city of domes and star forts half BURIED — the ground floor is under the mud (the board sits one level down in a `dirt_3` / `sand` bowl, the doors at head height, the `rise` motion with `dir: -1` SINKING the world past the board as the rounds go — MOVING MAPS rev 2's Hell recipe, slower), free-energy TOWERS (`lightpillar` + `beamring` on `copper` — Tesla's Lab's vocabulary, so this takes that site's kit and Tesla's Lab drops further down the hold list), a star fort as the near builder (`_nrWall` in a bastioned ring, the Vatican's colonnade in red brick), the far roster the fair's domes and a cathedral with no history; every plate on the board reads a date that does not match its style. The Bureau of Continuity's CANON NOTICES get a Tartaria row (RETCON: `THIS SITE IS 200 YEARS OLDER THAN FILED`) — the reality barometer's first site. Routes: THE LEY LINE (Babel ⇄ Tartaria — the tower's other stair goes there; Giza ⇄ Tartaria) and a `painting` seam from the Bureau's canon office (9.3's `way` table already reserves the Bureau's painting — Tartaria is the better picture than the Vatican's archive). Natives king, nordic, politician, ai; the mud flood as the `flood` terrain event at round 10 (a Δ rule, like the Cube's) |
| 345 | The Bermuda Triangle ✅ 2026-09-16 (rev 63 — the first wave-2 site; shipped: the two-triangle board with the deep hypotenuse + the sandbar, the corner buoys, the lighthouse on the 90° corner, the `sea` motion at half pace + the storm from round 3, the site room, THE WEIR from Room 8; NOT yet: the waterspout hazard, Flight 19's flyover, the yacht as the quay, the HUD compass) | Hollow | the user's (2026-09-15 rev 8): "it's a right triangle" — and it IS: the Δ board's playable water is a RIGHT TRIANGLE of tiles (the hypotenuse a diagonal of `deep` from (0,7) to (7,0); the two legs the shoals; a 90° corner buoy where the legs meet, the plate reads `∠ 90°`), the rest open sea under the `sea` MOVING MAP (the Dutchman's motion row at half speed, a storm from round 3, the compass spinning in the HUD's meta pill — cosmetic), Flight 19 flying over as a FLYOVER craft (`getDescentFlyover` kit, five Avengers in formation, never landing), the misc kit's shark and the wrecks in the far roster, a waterspout as the map's hazard (`storm` terrain in a 2×2 that walks one tile a round). Near builder: the `sea` recipe (`_nrMoat({ stream: true })` to the horizon, `sea: true`), a lone lighthouse on the 90° corner; the site room's quay is the deck of a becalmed yacht (the setting is the boat). Routes: THE DEEP (the Dutchman ⇄ the Triangle ⇄ Atlantis — the Dutchman's hold already reaches Atlantis; the Triangle is where ships go IN) and a `pool` seam from the Infinity Pool's weir (9.3's table has the weir ⇄ Atlantis — REC re-point it here: you go over the edge into the Triangle and surface at the yacht). Natives siren, atlantean, marksman (the pilot), grey (the ones who take the planes). Δ + full board; `prebuilt_bermuda` |
| 1717 | ~~Pirate Bay~~ → **THE FLYING DUTCHMAN** (was Queen Anne's Revenge until rev 2 the same day) ✅ 2026-09-12 | Hollow | shipped as a MOVING MAP: the galleon itself under way (the deck is the board, the hull / masts / sails the setting, the sea streaming past into a storm) rather than a cove; the cove's pieces (gangplanks, the wrecked hull, whalebones) can still join a later shore site; natives pirate (+ Atlantis's siren / mermaid / kraken as biome neighbours) — §9 2026-09-12 |
| 411 | The National Park | Terrestrial | the fourth forest (Shasta, Fairy, Grove exist): Shasta's pines + a ranger cabin + a campfire + trail `_nrSign`s + a `securitycam` on a tree — Agent Forrest's woods, "invaded by cameras" (DOOR_STORY §2 #17) |
| 343 | The Mothership | Celestial | the saucer, inside: `aluminium` / `metal_3` / `holo`, `federation_beacon`, `tower_cube`; the D.U.M.B. room recipe in silver; natives grey, nordic, mantid, black goo, symbiote |
| 2001 | Jupiter | Celestial | gas-giant cloud tops (`cloud_2`, `storm`, `cloud_gap`) with the monolith; after Saturn |
| 432 | The Cathedral | Diplomatic | a nave (checkerboard marble), pews as `barrier_*`, the organ as a procedural monument (pipes are cylinders), stained glass through `_nrWindowTex`; natives priest, ghost, gargoyle, vampire |
| 222 | Mitosis | Quarantined | inside a body: `flesh` / `flesh_2` / `flesh_3`, `skin`, `poison_bog`, the `fleshmound` — all exist; the roster is thin (black goo, symbiote, zombie) |
| 369 | Tesla's Lab | Terrestrial | `copper` / `gunmetal`, `lightpillar` + `beamring`, arcs from three-lightning.js; natives mad scientist, ai, telepath; overlaps CERN + D.U.M.B. — last |

#### 7.8 Cut, or folded into something that stays
| User's idea | Verdict |
|---|---|
| 1 Singularity + 0 Void | one map, Room 0 (7.6 #7) |
| 31 Halloween Town / Witch's Coven | the Haunted House's setting (13) |
| 52 House of Cards / Wonderland | the Looking-Glass's setting (E4) |
| 237 Hotel | a door inside the Haunted House; the plate on 13's leaf |
| 300 Gladiator Arena | Room 80 (7.7), 300 kept as alt |
| 322 Skull and Bones | the Lodge's DEEP CROSSING (33) |
| 333 Tesla | Room 369 (7.7), 333 kept as alt |
| 365 | the dailies' form number in the Clock Room (247) |
| 555 Pentagon / military base | D.U.M.B. is already the base — it takes 555 |
| 69 Disco · 808 Recording Studio · 27 Concert | one venue, Club 27 (7.7); 808 is its jukebox booth |
| 747 Airport | cut — Area 51 already owns the runway and the tarmac |
| 911 Disaster City | Downtown, Room 1954 (7.6 #4; MASTER C-24) |
| 1337 Hacker Room | a door in Arcane Engineering (7.4), not a map |
| 1776 White House | Room 1600 (7.7), 1776 kept as alt |
| 1947 Roswell | Area 51's plate (`EST. 1947`) and its saucer |
| 90210 Suburb | Nuketown (1945) is the suburb |
| 5150 · 1984 · 111 · 247 · 360 · 86 · 1111 · 8 · Corner Office · Occam's Barbershop · Fourier Foyer | HQ rooms / counters (7.4), not sites |
| Deep Ocean Orichalcum Research | Atlantis's sub-line (H-20) |
| Möbius Strip Club | the Cafeterium after hours (86, a Phase 5.1 variant) |
| Infinity Pool (listed twice) | once, Room 8 (Executive) |
| Daily Office Operations Requirements | the dailies (247 / FORM 365; engine 7.9 below) |
| 42 Football Stadium | 50 (REC); 42 offered to Records |
| 180, 365 (blank) | 180 → Hollow Earth; 365 → the form |

#### 7.9 ⚙ ✅ (2026-09-11, §9 rev 3) Daily Office Operations Requirements (engine, 1 session)
**Shipped as FORM 365 with Room 247.** data.js `hqDailyOpsRows` /
`hqDailyOps` / `hqDailyRowMet` / `hqDailyOpsJudge` (the block after
`hqCodeRed`; `DOOR_HQ.dailyOps = { pay: 120, allBonus: 150, count: 3,
force }`), eight templates (site · cond · keys · exits · native · strike ·
delta · codered), progress in `door.hq.dailies`, judged by battle.js
`commitAchProgress` after the Code Red commit, the count on the strip
(`#hqForm365`) and on Room 86's notice board, the sheet on the Clock
Room's east wall. The plan as written:
`hqDailyOps(profile)` beside `hqCodeRed`: three requirements a day, seeded
from the local date + employee number like Code Red (the same sheet all day,
a new one tomorrow), drawn from templates over real counters — win on a
named site, secure N Keys, a win by a named condition, respond to the Code
Red, declassify one entity, a Δ win with a team of the day's bay. Rewards:
Hazard Pay + SP when the meter exists (4.1); the sheet is `FORM 365` on the
Clock Room wall (247) and mirrored on the strip. ROADMAP §8.1 wanted
exactly this; the building gives it a wall.

#### 7.10 Adding a site — the checklist (what the 29 each already have)
1. data.js: `_MF_BUILDERS.prebuilt_<id>` (the full map) +
   `_MF_DELTA_BUILDERS.prebuilt_<id>` (the hand-authored 8×8 Δ — DELTA
   FORGE house rules, delta-maps.test.js; bump its hard-coded 29) +
   the `EW_MAP_META` row (`id, label, w, h, teamSize, tier, base, biomes,
   deltaPad, near, desc, env`) — everything downstream (presets, match
   select, compatible modes) is generated from the row.
2. data.js `DOOR_TEXT.SITE_FILES[id]` (tone / status / jurisdiction /
   summary — the B2 voice rule: the real place, ~300 chars, an officer
   with an opinion) and `POINT_OF_ENTRY` retags for its natives (a race
   has ONE point of entry; moving it changes the dossier's stamp — until
   retagged the new site pads its CPU pool from biome neighbours, §3.7).
   `doorSiteCanonDate` gives the FIRST CROSSING date for free.
3. three-renderer.js `_NR_BUILDERS.<near>` (the MAP SETTINGS block) and,
   if none of the 12 far rosters fits, a `_HZ_THEME_ROSTERS` entry.
4. data.js `DOOR_HQ.thresholds[id]` (leaf + `roomNo` + note) and the
   sector's `maps` list (doorhq.test.js: the partition, the leaf exists,
   rank leaves untouched, the corridor's door spacing).
5. server.js `MAP_POOL` rows (Δ + full) for ranked — hand-synced; since
   2026-09-13 check-data-parity.js (#6) diffs it against EW_MAP_META, so a
   missing row fails `npm test`.
6. `npm test`; index.html bump; deliver data.js + three-renderer.js (+
   server.js for ranked) per RULE #1.
7. THE DIRECTORY (2026-09-16, the user's rule): nothing to draw — the map,
   the register and the world tab are generated from the doors and the
   threshold — but hq-map.test.js THE DIRECTORY GUARD fails, naming the
   room, if the new site room / any new room is not reachable from the
   foyer along doors or a `links` row. A room you add must be walked to.

#### 7.11 ⚙ ✅ (2026-09-10, §9) THE PROP KIT — thirty models, and Room 86's furniture arrives early
The user uploaded thirty Meshy GLBs to R2 `Assets/door/models/` on
2026-09-10. All thirty are wired into `DOOR_HQ.catalogue` in the same
session; twenty-six are new keys, four RETIRE a procedural prop.

**The four that graduated (plan 2.7 always said they could).** Giving a
`proc` entry a `file` upgrades every existing placement for free — the
closet (101) and the Training Room (64) got real art without moving a
prop:

| key | model | was |
|---|---|---|
| `hook_rail` | `coat_hook_rail_0910054259` | `proc: 'hook_rail'` |
| `vent_grille` | `vent_0910054228` | `proc: 'vent_grille'` |
| `floor_drain` | `water_drain_0910054212` | `proc: 'floor_drain'` |
| `rotary_phone` | `analog_phone_0910054719` | `proc: 'rotary_phone'` |

`clipboard` STAYS procedural: the model the user made
(`office_clipboard_0910054838`) is authored FACE-UP — a bbox of
0.73 × 0.35 × 1.00 is a clipboard lying on a desk, not one hanging on a
wall — so it went in as a separate key, `clipboard_flat`, and the wall
clipboards in 101 keep the builder. Six procedural props remain
(`tanker_desk`, `wall_shelf`, `metal_shelving`, `broom`,
`toilet_paper`, `clipboard`).

**Sizing.** Every target was read off the GLB's own bbox — Meshy
normalises the longest axis to 1, so the ratios name the pose. Three
could not be read from the numbers alone and are the ones to check first
on the next walkthrough: `manila_folder` (0.74 : 0.92 : 1.00 — tapered,
possibly open), `round_fridge` (a true 1 : 1 : 1 cube, so it went in
squat at h 1.05) and `mars_rover` (span 2.40). If one lands wrong, its
`h` / `span` (or a `lay: true`) is the only edit — never a renderer
change.

**Where they went today.**
- **Central egress, ground** — THE BREAK NOOK beside the vending machine
  at 98–107°: `round_fridge` with the `microwave` and `coffee_maker` on
  top of it, `coffee_mug`, `solo_cup`, `hook_rail_long`, `trash_bin`.
  This is Room 86 standing in the hall until Room 86 exists; when 86 is
  built, the nook is what moves.
- **Central egress, ground** — the LOST CARD FEE finally has a till:
  `cash_register` on the reception wedge's transaction ledge, with a
  `clipboard_flat` and a bin. Two `palm_tree`s in the lobby at 68° / 292°.
  THE CUBICLE POOL: two `round_cubicle`s at 325° / 337° (the only right
  angles in the building are inside them, and they are round on the
  outside, so Form 90 was never filed) with a chair each.
  `retro_speakers` on top of the lockers — the building's muzak has a
  source now. Three `picture_round_*` frames on the lower wall, all
  empty; Records has the photographs and is not releasing them.
- **Central egress, mezzanine** — the clerks' coffee (`coffee_maker`,
  `coffee_mug`, `stapler` at 100°; `retro_radio`, `manila_folders` at
  325°), a `trash_bin`, a `hook_rail_long` at 342°, two more frames.
  Nothing NEW with a footprint went on the slab (the walkable-band check
  at doorhq.test.js — the round cubicle in particular can never go up
  there, its disc is 1 m and the slab is 2.2 m wide).
- **Desk tops** — `stapler`, `manila_folders`, `manila_folder`,
  `clipboard_flat`, `coffee_mug` on the dispatch ring.
- **101 · your office** — `mini_fridge` (requisitioned; nobody has
  asked), `meal_tray` on the cot, `retro_radio` on the shelf above the
  sink, `clipboard_flat` + `coffee_mug` + `trash_bin` at the desk,
  `manila_folders` on the locker, `picture_round_b` on the south wall.
- **64 · Training Room** — THE FORTY-FOUR-MINUTE CORNER by the water
  cooler, because the instructor's line already promised it: a crate for
  a counter, the `coffee_maker`, a `solo_cup`, a `molded_chair` and a
  `cafeteria_chair` signed out of 86 and never signed back in; a
  `trash_bin`, a `hook_rail` by the lockers, a `vent_grille`, and the
  `clipboard_flat` at the end of the range.
- **Site rooms** — `mars_rover` on the walkway of Mars's room,
  `lunar_lander` in the corner of the Moon's, two `palm_tree`s in Giza's.
  doorhq.test.js's ceiling check now exempts a free-standing prop in an
  OUTDOOR room (`shell.open`): the lander is 3.2 m and the Moon's
  perimeter wall is 3.0 m, which is correct — a MOUNTED prop still has
  to fit under its wall.

**Held for Room 86 (7.4) — the kit is on the shelf, the room is not
built.** `meal_tray_empty`, and second helpings of `cafeteria_chair`,
`molded_chair`, `meal_tray`, `microwave`, `coffee_maker`,
`cash_register`, `mini_fridge`, `round_fridge`, `coffee_mug`,
`solo_cup`, `trash_bin`, `hook_rail_long`. When 86 is built it is a
`kind: 'box'` room off the egress and needs nothing new from the user:

| the room | built from |
|---|---|
| the serving line | `reception_wedge` (§5.6's own fallback), `cash_register` at the till end, `meal_tray` / `meal_tray_empty` stacked along it, the sneeze guard = an `observation_window` laid on the counter |
| the hot side | `microwave` and `coffee_maker` on a `tanker_desk` behind the line, `round_fridge` + `mini_fridge` against the back wall, `hook_rail_long` for the aprons |
| the floor | `conference_table` ×2 with `cafeteria_chair` / `molded_chair` around them, `meal_tray` + `coffee_mug` + `solo_cup` on the tables, `trash_bin` by the door, `rug_office`, `potted_plant`, a `palm_tree` in the corner |
| the walls | `picture_round_*` (still empty), the notice board (mirrors 247's sheet — `proc: 'board'`, as the leaderboard counter does), `wall_clock` ×2 that disagree, `exit_sign`, `vent_grille` |
| the door | plate `ROOM 86`, sub `SUPPORT SERVICES`; the after-hours variant reads `MÖBIUS STRIP CLUB` and the bar counter is one lathe |
| the people | `npcSpots` for the roster ON BREAK, the online silhouettes from `#mmOnlineCount` (§8's open question — this is where they go) |

Two things 86 still wants from the user: the serving counter itself
(§5.6's hero prop — everything else on that row is now delivered), and
the cafeteria clatter bed on §5.6's audio list.

---

### Phase 8 — THE EXPLORATION FLOORS: more floors, hallways, secret passages, landmarks (planned + stage 1 shipped 2026-09-14)
The user's brief (2026-09-14): "More floors, hallways, elevators, secret
passages, shortcuts, maze like, dungeon like. Rooms leading to other rooms.
Random rooms for exploration" — fifteen named rooms (a classroom / lecture
hall, a small metal room with a floating orb, a bathroom, a cubicle room, a
server room, a kitchen, a circular garden, a locker room, a swimming pool, a
parking garage, weird isolated creepy hallways and rooms, a ritual room, a
sacrifice room, a laundry room, a dungeon) — "each place should feel like
its own vibe … they don't all need a purpose or menu option", built from
the 3D assets we have; and the Disney-park LANDMARK idea: "down most paths
you see the big castle … go down this other path and some other landmark
is revealed … encourage exploration with the architecture and layout" —
more floors than the two of the rotunda, or "riding the elevator lets you
see out the window and you see more unexplored rooms".

**8.1 The rules this phase adds.**
- **ONE HOME PER FUNCTION (C-27, decided by the user's "too many rooms or
  interactive objects that do the same thing").** Every launch (`fn`) and
  every overlay has exactly ONE counter or door in the building. The
  duplicates became PANELS (a by-id panel that says what it is and where
  the home is) or PROPS (the till). Home table: the ID card = Reception's
  INTAKE WINDOW; the achievements = Room 111's CABINET; the leaderboard =
  the hall's EMPLOYEE OF THE MONTH; the shop = the Quartermaster's door;
  Challenge mode = Medical's SERVICES DESK; the case file = Room 101's
  IN-TRAY; the Codex = Records; the character creator = the barbershop
  mirror; Replay = Room 360's projector; community maps = Records' card
  catalogue; Code Red = the Clock Room's board (the strip pill is UI, not a
  place). hq-floors.test.js fails on a second home. The panels' YOUR CARD
  shortcut buttons went with it (only Reception's own SIGN IN AT THE WINDOW
  stays, because it points home).
- **THE LANDMARK RULE.** A big room shows you something lit at its far end
  that you cannot walk straight to. Shipped: THE RAMP in the garage
  (daylight at the top, a barrier arm across the foot, LOT FULL); the one
  red EXIT sign at the end of Service Corridor B's thirty metres of dark
  (the room behind it is three metres square and its far wall is not a
  wall); the fountain in the garden with the iron GATE behind it (an L5
  opens it — and it opens onto Room X in the undercroft); the shaft window
  in the car (lit landings and DARK ones stream past — B2 is a landing the
  panel does not list). The rooms are still one scene each (a door is a
  rebuild), so a landmark must live INSIDE the room that shows it; the
  cross-room vista (a glass wall onto the next room) is the unbuilt half
  of the idea — see 8.4.
- **SECRET DOORS.** A door with `secret: true` (data.js) is a wall panel
  on a hinge: the renderer hangs no leaf, no lamp, no plate; the frame and
  the slab wear the shell's wall (tinted like it); the prompt reads
  A DRAUGHT and the panel swings when you stand at it. `hqSecretDoors()`
  lists them. Five shipped: the cold room's back panel ⇄ Service
  Corridor B, the wall the chair faces in the room at the end → the
  dungeon, the bathroom's third stall ⇄ the crawlspace.
- **THE ELEVATOR IS A ROOM.** `rooms.car` has no doors: its FLOOR PANEL
  (counter `panel`, map.js `_hqFloorPanelHtml`) is the ride, reading
  `DOOR_HQ.elevator.stops` through `hqElevatorStops(profile, fromRoom)` —
  a button per stop, YOU ARE HERE on the floor the car was boarded from
  (map.js `window._hqCarFrom`), a red chip where a stop is gated (PH wears
  the mezzanine door's old KEYHOLDER + 12 Keys; the door itself is open to
  everyone now), the other eleven buttons dim. Every lobby's `elevator`
  door (`proc: 'elevator'`) leads back into the car at `panel`. B2 is on
  no button on purpose.
- **PROC LIGHTS + TICKERS + DIM ROOMS.** A catalogue proc may carry
  `light: { color, intensity, dist, y }` (a point light the placer adds,
  capped at `HQ_PROP_LIGHT_MAX` = 10 per room) — the torches, the bulbs,
  the boiler, the candles, the orb, the fountain; a builder that moves
  pushes a ticker (`_hq.tickers`, run by `_hqTickWorld`) — the orb bobs
  and turns, the torches gutter, the tubes flicker, the shaft streams. A
  shell may say `strips: false` (no fluorescent strip) and `mood.ambient`
  (0.3–0.8 dims the hemisphere / key fill) — the undercroft, the cold
  room, the corridors, the boiler room, the crawlspace are lit by their
  own props only.
- **THE PAUSE (C-28, the user's "how am I supposed to press the pause
  button").** With the pointer locked (the building's mouse-look, Strike
  Mode's aim) the browser consumes ESC to release the cursor and the page
  never sees the key; the strip's buttons cannot be clicked with a frozen
  cursor. Fixed twice over: **P** is ESC (the building: the settings; a
  battle: the pause menu, and it closes it again — ui.js), and **a
  pointer-lock loss the game did not ask for IS the ESC the browser ate**
  (three-renderer.js `_hqOnLockChange`: a loss outside the 2.5 s leave
  window while not paused → `onEscape`; battle.js Strike Mode: a loss
  outside its own 1.5 s release stamp → `togglePauseMenu`). An alt-tab
  lands there too, which is a pause as well.

**8.2 The floors as shipped (stage 1).** `DOOR_HQ.rooms` (data.js, the
block after the Training Room). Numbers are Claude's (REC — the user
rules; every `why` is on the room). Un-numbered rooms are lobbies and
corridors (the register skips them, like the penthouse).
| Floor | Room | № | What is in it | Doors |
|---|---|---|---|---|
| — | THE CAR (`car`) | — | the buttons (`car_panel`), the shaft window (`shaft_window`, a ticker), a handrail, a camera | none: the panel is the ride |
| G | THE GARAGE (`garage`) | P1 | 30 × 20 m, eight pillars, five Sedans (the honda civic GLB — MODEL_INDEX), painted bays, oil, THE RAMP + the booth (a panel: LOT FULL) | elevator; the dock (n) |
| G | THE LOADING DOCK (`dock`) | — | roller shutters, shelving, a cart, the manifest nobody ticked | the garage (s); the laundry (n) |
| B | B · SERVICES (`services`) | — | the lobby: the porter, the notice board, a cooler, a vending machine | elevator; the stair up to Room 64 (w); the corridor (w); the kitchen (n); the laundry (e) |
| B | THE KITCHEN (`kitchen`) | 350 | two ranges under hoods, two prep tables, the sink, the fridges, a pot rack, the cook and the dishwasher | the lobby (s); the cold room (e); the service stair up to Room 86 (n) |
| B | THE COLD ROOM (`coldroom`) | −18 | three carcasses on hooks, frost, one bulb, the temperature log | the kitchen (w); **secret** → Corridor B (e) |
| B | THE LAUNDRY (`laundry`) | 60 | three washers, three dryers, the folding table, two carts, the laundress | the lobby (w); the dock (e) |
| B | SERVICE CORRIDOR A (`corridor_a`) | — | 22 m, three tubes that flicker, a fallen sign, a dead camera | the lobby (s); the boiler (e); Corridor B (n) |
| B | THE BOILER ROOM (`boiler`) | 451 | two boilers with fireboxes, gauges, a stopped clock, the stoker | Corridor A (w) |
| B | SERVICE CORRIDOR B (`corridor_b`) | — | 30 m, two lights, a chair facing the wall, a crooked picture, the EXIT sign at the end | Corridor A (s); the server room (e); **secret** → the cold room (w); the room at the end (n) |
| B | THE ROOM AT THE END (`deadend`) | — | a chair, a bulb, NOTHING TO SEE on a clipboard | Corridor B (s); **secret** → the dungeon (n) |
| B | THE SERVER ROOM (`server`) | 127 | eight racks in two rows, the cold aisle, the night sysadmin | the stair up to IT (e); Corridor B (w) |
| B2 | THE DUNGEON (`dungeon`) | 24601 | three cells behind bars, chains, the stocks, four torches, the turnkey, the keys on the floor | the room at the end (s); the ritual room (e); Room X (n, a portcullis) |
| B2 | THE RITUAL ROOM (`ritual`) | 333 | the sigil on the floor, thirteen candles, the altar, the celebrant, three chairs | the dungeon (w); the sacrifice room (n, the hell arch) |
| B2 | THE SACRIFICE ROOM (`sacrifice`) | 322 | the altar and the drain, chains, a hook, THE ALTAR panel = FORM 322 (the waiver, your callsign already on it; SIGN is disabled: the pen has never worked) | the ritual room (s); a ladder up (n) |
| B2 | ROOM X (`orb`) | X | the object (`floating_orb`: it floats, turns, lights the room blue), a rail, the terminal; THE OBJECT panel (readings that never repeat) | the dungeon (s); the garden gate (e, L5) |
| 3 | 3 · THE ANNEX (`annex`) | — | the lobby: five doors, the floor warden | elevator; the garden (n); the lecture hall + the cubicles (e); the bathroom + the locker room (w) |
| 3 | THE LECTURE HALL (`classroom`) | 314 | the chalkboard with THE TYPE WHEEL on it (TYPE_CHART at build), the lectern, three tiers the walker climbs (`riser_1..3`), nine desks, the instructor; THE BOARD panel = the lesson | the annex (w) |
| 3 | THE CUBICLE FLOOR (`cubicles`) | 9-5 | six round cubicles, the shift at them (six `onlineSpots`), the supervisor on the phone | the annex (w) |
| 3 | THE BATHROOM (`bathroom`) | WC | three stalls, two urinals, three basins under a mirror, a tube that flickers | the annex (e); **secret** → the crawlspace (the third stall) |
| 3 | THE CRAWLSPACE (`crawlspace`) | — | low, pipes, a bulb, a map the crawlspace is not on | **secret** → the bathroom (n); the ladder down to Room 322 (s) |
| 3 | THE LOCKER ROOM (`locker`) | 26 | sixteen lockers, two benches, two showers, the rota | the annex (e); the pool (w) |
| 3 | THE NATATORIUM (`natatorium`) | 50M | six lanes with ropes and starting blocks (`lap_pool`), the lifeguard chair, clerestory windows, the OTHER lifeguard | the locker room (e); the garden (w) |
| 3 | THE GARDEN (`garden`) | 1618 | OPEN under Olympus's sky (by hand), a hedge ring with four gaps, the gravel ring, the fountain, six foliage trees, benches, lamps, the groundskeeper | the annex (s); the pool (e); THE GATE (n, L5 → Room X) |

**8.3 The loops (the maze).** Room 64 ⇄ B (the training room's south door
is the service stair now — Challenge mode lives at Medical); Room 86 ⇄
Room 350 (the kitchen's saloon door is the stair up to the serving line);
G ⇄ the dock ⇄ Room 60 (round the car); Room 1337 ⇄ Room 127 ⇄ Corridor B
(the mezzanine to B without the hall); the cold room ⇄ Corridor B (a
secret); the room at the end → the dungeon (a secret); Room 322 ⇄ the
crawlspace ⇄ the bathroom (three floors by ladder); the pool ⇄ the garden
⇄ the annex; the garden gate ⇄ Room X (L5). Every door's landing is
checked by the test.

**8.4 Not built (stage 2, for the user to rank).**
- **A third ring on the rotunda.** ✅ SHIPPED 2026-09-16 (rev 63) as THE
  GALLERY: `shell.ring3 = { h, inner, outer, thick, railH, stair }` on the
  hall (data.js) — the renderer's level readers went through `_hqLevelY`
  / `_hqLevelR` / `_hqLevelOf`, the ring is a layer of `_hqSurface`
  (`_hqRing3At` / `_hqRing3Air` / `_hqRing3Cam`), `_hqBuildRing3` builds
  it; the four exploration doors wear `level: 2`. §9 2026-09-16 rev 63.
- **The cross-room vista** (the second half of the landmark idea): a
  door-shaped GLASS WALL that shows a painted card of the room beyond (a
  rendered screenshot of it, `false_window`-style) — cheap and honest:
  the rooms stay one scene each. First candidates: the annex lobby's
  north wall onto the garden; Corridor B onto the server room's racks;
  the dungeon's portcullis onto Room X's glow.
- **The window in the car**: the shaft texture is painted; a live view of
  the floors (the lobbies' plates streaming past) would want the same
  painted-card trick.
- **Variants** (5.1) for the new rooms: after hours the cubicle floor is
  empty and one monitor is on; the pool at night; the garden in rain.
- **Cast**: nobody from the cast sheet stands on the new floors yet (the
  agents are anonymous D.O.O.R. agents; their lines are Claude's drafts —
  A15: the user rewrites).
- **Sounds**: the boiler's hum, the dryers, the pool's echo, the garden's
  birds (`env.ambience` beds exist for maps; rooms have none yet).

**8.5 Assets that would help (the user asked).** Everything shipped is
procedural or the kit; these would replace a proc by giving its catalogue
row a `file` (the register's rule) — in the order they pay off:
1. **A hooded robe** (rigged, or a static one on a hanger) — the ritual
   room has a rail and no robes; the celebrant is in a suit.
2. **A car** other than the Sedan — the garage parks five of the same
   civic.
3. **A washing machine / dryer** pair, a **kitchen range**, a **toilet +
   stall**, a **sink** row — the Meshy office kit has none of these; the
   procs are boxes with the right silhouette.
4. **A floating crystal / orb** with a bake — the object is an emissive
   sphere.
5. **A pool ladder + starting block**, a **lifeguard chair**, a **park
   bench**, a **fountain** (the fountain is a lathe).
6. **Iron bars / a cell gate** (the `cell_bars` proc is cylinders), **a
   torch with a bracket** (the battle's torch model could be re-homed —
   `_makeTorchModel` — if the user prefers it to the proc's cone).
7. **Textures**: a hedge / topiary tile (the ring uses `leaves_2`), a
   locker-room tile in a colour that is not white, a raised-floor tile
   for the server room, a rubber gym floor, wet concrete for the garage,
   frost / ice for the cold room's walls (it uses `ice_1` on the floor and
   tinted aluminium on the walls).

**8.6 STAGE 2 as shipped (2026-09-15, rev 14 — the user's list: "add some
stuff to stage 2 before we do encounters").** Two more floors on the car
(`DOOR_HQ.elevator.stops`: `4` above 3, `2` between 3 and M — seven
stops; the car's plate and the hall door's text name them; the car panel
lights whatever the stops list). `hqStage2Rooms()` lists the rooms by
floor; every number is Claude's (REC — the user rules; the `why` is on
the room); `hq-stage2.test.js` guards all of it. Every line and every
`say` is a DRAFT (A15).
| Floor | Room | № | What is in it | Doors |
|---|---|---|---|---|
| 2 | 2 · THE WORKS (`works`) | — | the lobby: the shop steward, a pallet of leaves by the car, the robot on break | elevator; the works floor (n, wide); the control room (e); lost and found (w); THE STAIRWELL (w) |
| 2 | THE DOOR WORKS (`warehouse`) | 1000 | 20 × 12 × 6 m: two belts with leaves riding them (`conveyor`, a ticker), three `robot_arm`s opening and closing one door for ever, the stacks, the foreman's desk under THE LINE (a panel: the register's tally), the fitter, the android who watched the arm for six hours | the lobby (s); the incinerator (e); the autopsy room (w); the door garden (n) |
| 2 | THE INCINERATOR (`incinerator`) | −1 | the furnace with a door-shaped mouth (`door_furnace`: leaves slide in and flare, its own light), the belt into it, the radiation signs, THE MANIFEST (a panel: every SEALED site in the register — closed for good), the operator, a demon who finds it warm | the works (w) |
| 2 | THE AUTOPSY ROOM (`autopsy`) | Y | the slab (`autopsy_table`: knob · handle · doorbell · window · boards · knocker · hinges · letterbox · peephole · chain, each tagged), the light box with the X-ray (`door_xray`), THE PARTS (a panel: `hqDoorParts`, one part missing from every door), the examiner, a ghoul | the works (e) |
| 2 | THE DOOR GARDEN (`doorgarden`) | ½ | the greenhouse: four beds (`planter`) with trellises of vines and tiny doors at the stem ends that sway and swing (`door_vine`), five purple `grow_lamp`s (the room's only light), THE BEDS (the growth log), the gardener, the fairy whose house one opens onto, the gnome | the works (s) |
| 2 | THE CONTROL ROOM (`control`) | 24/7 | three `monitor_stack`s (nine CRTs each on a room off the register, the feeds swap, one is dead), the night watch, THE FEEDS (a panel: `hqSecurityFeeds` — one row per numbered room, SIGNAL / NO SIGNAL / LIVE for the room you stand in), the camera pointed at the screens | the works (w) |
| 2 | LOST AND FOUND (`lostfound`) | ? | four `lost_shelf`s (a crown, a fishbowl, a teapot, an umbrella, a football, a sock, a small door, a ring), the clerk who needs it described, THE CLAIMS BOOK (a panel: `hqClaimsBook` — the day's page, one line yours: ONE (1) SOCK, not lost yet), a djinn | the works (e) |
| 2 | THE STAIRWELL (`stairwell`) | — | 5 × 7 × 8 m: THE TOP LANDING six metres up (a `stair_landing` platform; its door carries `y: 6`), three flights of real treads (`stair_step` / `stair_step_x` stacked by `y`, 0.25 m a tread, two half landings), the bulbs, the inspection card (FLIGHTS 3 · FLOORS ∞). **THE LOOP**: DOWN at the bottom lands on the top landing of the same room | the works (n, y 6); DOWN (n, → `stairwell@landing`); the tunnel (w) |
| 2 | THE TUNNEL (`tunnel`) | — | 8 × 36 m: the track bed and the yellow line, THE TRAIN at the platform with its doors open and nobody aboard (`train_car`, lit), the route map that is `DOOR_HQ.routes` (`tube_map`), DEPARTURES (a panel + `departures_board`: every line, DELAYED), the conductor, the zombie and the skeleton who are waiting | the stairwell (s); THE END OF THE LINE (n → the midway); the garage (e, a new service hatch behind the ramp) |
| 2 | THE MIDWAY (`carnival`) | 1893 | 22 × 16 × 8 m under the big top (`bigtop`): the wheel that turns (`ferris_wheel`, lit), the carousel (`carousel`, the horses rise), the fortune teller's tent, the high striker with the rank ladder painted on it, the ticket booth (a panel: ADMIT ONE), the popcorn cart, two festoons, the bleachers (the ramp) and the queue rails, the ringmaster and the barker, the strongman who IS the bell, the lady who knows, the mermaid between shows, a catgirl with a small door she won, the gnome who runs the wheel | the tunnel (s); THE HALL OF MIRRORS (e → Room *) |
| 4 | 4 · THE LABS (`labs`) | — | the lobby: the floor warden, the radiation sign before 4B, the mad scientist who designed the upside-down room | elevator; the dream lab (n); the Mandela room + the upside-down room (w); Supply Closet 4B + Clone Disposal (e) |
| 4 | THE DREAM LAB (`dreamlab`) | REM | four cots with `eeg_rack`s drawing a trace, two `dream_screen`s drawing what the sleepers see (this room, from above), the sleep tech, THE DREAM LOG (a panel: the last roster as SUBJECTS, `_ewLoadLastParty`), the subjects: a succubus, a mad scientist, a dreameater, a voidweaver, a telepath | the labs (s); the tank (e) |
| 4 | THE TANK (`tank`) | 0dB | the pod with its lid ajar and the blue light inside (`iso_tank`, it breathes), the float log, THE LID (a panel: FLOAT · 60 MIN is disabled — session 3 is still in there) | the dream lab (w) |
| 4 | THE MANDELA ROOM (`mandela`) | * | **a different room every time you enter**: the sheet is a waiting room; `variants.library` / `.nursery` / `.office` carry `when: { each: true }` — rolled on EVERY entry (`hqVariantRollEach`: the sheet + the three, never twice the same in a row, seeded by the profile + the day + the entry count; map.js `_hqEnter` applies it and files `window._hqMandelaLast`; the visit roll skips it), the door plate outside re-plates with it (the directory insists it was always so), THE FRAME (a panel: what you remember — the last room it was, which nobody else remembers) | the labs (s); THE HALL OF MIRRORS (n → the midway) |
| 4 | THE UPSIDE-DOWN ROOM (`upsidedown`) | 9 | an office on the ceiling — `flip: true` on the desk, the chair, the terminal, the cabinets, the chairs, the plant, the cooler, the rug, the clock, the board, the picture (hung upside down, no blocker); the strip light on the floor; THE NOTE ON THE FLOOR (a panel); one rail the right way up; the floor wears the ceiling tile and the ceiling the carpet; a ghost who is the right way up | the labs (w) |
| 4 | SUPPLY CLOSET 4B (`closet4b`) | 4B | the vestibule: four radiation signs, two ARMED GUARDS, the striped line you do not cross, the keypad, THE BLAST DOOR (`leaf_vault`, wide, **`minClearance: 6`** — the gate is on the blast door, the vestibule is open to everyone), EVACUATION (a panel: the button — EVACUATE walks you to the foyer with every bell ringing; a room move, never a second home for the exit) | the labs (s); the blast door (n → `supply`) |
| 4 | THE SUPPLY CLOSET (`supply`) | — | behind the blast door: shelves of toilet paper (400 rolls; the log says 399), a mop, a broom, a bucket, one bulb, the step stool | the blast door (s) |
| 4 | CLONE DISPOSAL (`disposal`) | II | a steel table with a lone gun on it (`lone_gun`), the garbage chute in the wall, two chairs facing each other, and in one of them THE OTHER ONE — `clone: true` on the spot spawns the walker's OWN vessel (race / gender / creator look) — THE CHUTE (a panel: FORM II, two lines for names, both yours; DISPOSE is disabled) | the labs (w) |

**Rules this stage added.** (1) A box door may carry **`y`** (metres): it
stands at that height (three-renderer.js `_hqDoorFloorY`; the build, the
landing spot and the camera blocker read it) — put a platform of blockers
under it. (2) A blocker's base is the prop's own `y` (`y: y0 + p.y`), and
the step rule skips a raised blocker only when it is above the floor AND
above the walker (`b.y > curY + 1.2`) — so stacked treads are a
staircase (0.25 m a tread, under HQ_STEP_TOL 0.62) and the floor under a
landing stays a floor. (3) **`flip: true`** on a prop hangs it from the
ceiling upside down (a ceiling prop stands on the floor upside down):
rotation.z = π in its own frame, a wall prop's `mount` measured down
from the ceiling, no blocker. (4) **ROOM DIALOGUE**: a spot in
`npcSpots` may carry **`say`** (a line or a list) — whoever stands
there (a race-hinted native or the roster draw) says THAT, in the room's
own terms, before any roster line (it rides `_hqSpawnCharacter` as
`line`; map.js reads `t.line` first); the conspiracy theorist is at the
bathroom sink now ("They really need a filter on this"), Room X has a
watcher, the cubicle floor a politician; **`clone: true`** spawns the
walker's own vessel. (5) A variant with **`when: { each: true }`** is
rolled on EVERY entry (`hqVariantRollEach`), never on the visit roll.
(6) THE PARK RULE: a `railing_1m` run and a `riser_*` (or the stair's
own treads) in every room — the test insists. (7) Thirty-seven new procs
(`Object.assign(_hqProcBuilders, {…})` "PHASE 8 STAGE 2", with
`_hqMiniDoor` — the small leaf the belts, the arms, the stacks, the vines,
the furnace and the shelf reuse); fourteen by-id panels in map.js
`_hqCounterPanelHtml`; the data reads `hqSecurityFeeds` / `hqClaimsBook`
/ `hqDoorParts` / `hqWorksTally` / `hqStage2Rooms`. Not built: the tapes
for the new rooms (9.1's sheet is fixed at a hundred — the next hundred
starts here), a train that arrives (the `train` way kind), the hall of
mirrors as mirrors, cast members on the new floors, sounds. UNSEEN LIVE
(RULE #1c): all of it — first to eyeball: the stairwell's treads under the
walker and the camera boom on the landing, the belts' pace, the flipped
office, the Mandela room's swap on re-entry, the clone's face.

### Phase 9 — THE WORLD: finds, complexes, the world graph, encounters, the door gun (planned 2026-09-15; stages 9.1–9.5 + 9.8 SHIPPED LOCALLY revs 43–63, not uploaded; the ACTIVE SPECIFICATION is `PHASE9_QUALITY_PLAN.md` §1)
> **READ FIRST (2026-09-16 reconciliation).** This section was written as a proposal and
> patched by appending, so it still carries superseded instructions. The one current answer
> per behaviour — the player-initiated click, the any-surface two-button two-colour door gun,
> standard issue for the gun and the deck, the site's Δ as every encounter's board, THE EYE,
> the unbuilt dissolve and spawn mirror — is the table in **`PHASE9_QUALITY_PLAN.md` §1**.
> Bullets marked `[SUPERSEDED — see PHASE9_QUALITY_PLAN.md §1]` below are history: never
> implement from them. The confirmed defects (positional tape ids, hazard pay lost to the
> server sync, "the room is the board" copy in a complex part) and the staged plans for the
> rooms ↔ boards look and for THE FIELD (anywhere becomes the 8×8) are there too (§4, §10, §11).
The user's brief (2026-09-15), five things in one message: **(1)** glowing,
sparkling hidden objects to pick up — hazard pay, healing potions, held
items — and a COLLECTIBLE scattered over the whole world, a hundred of
them, Rubik's Cubes or VHS TAPES, the tapes being clues about the parents
or "actual anomaly evidence I can upload gifs of" (ghost encounters, UFO
footage); **(2)** rooms that are WHOLE OTHER BUILDINGS — the Haunted House
as a mansion with two floors and a basement or an attic, the urban maps
a lot bigger, the Spaceship and the Flying Dutchman with several decks;
**(3)** "too many rooms / doors crowding the hallways" — a third ring
floor would help, but what is really wanted is CONNECTION between rooms:
a door in one map that leads to a related map (the Moon ⇄ the Spaceship
⇄ Saturn; the bottom of the Flying Dutchman ⇄ Atlantis) — "make this game
feel like its own WORLD and not just a bunch of rooms", a good mix of
bigger rooms, two-floor rooms, rooms with indoor and outdoor sections;
**(4)** eventually: exploring a room, SEEING AN ENEMY ROAMING, attacking
it, and the area you stand in BECOMING the 8×8 battle map in a near-
seamless transition — limited to rooms that are not the facility (the
foyer and the corridors stay safe); **(5)** a way to PLACE TWO DOORS like a
portal gun — puzzle solving in the Portal manner but with doors (reach a
doorway or a shiny object you can see but cannot climb to), or park one
door by a safe area, explore, and when in trouble place the other and go
back — an escape rope.

**Current implementation — Phase 9.5 stage 1: THE DOOR GUN, local delivery
(2026-09-15 rev 13). [SUPERSEDED by 9.5 REV 2 (§9 2026-09-15 rev 19: any surface, LEFT = A / RIGHT = B, two colours) and by standard issue (rev 15, `HQ_PORTAL_RULES.free`) — see PHASE9_QUALITY_PLAN.md §1]** THE PORTABLE THRESHOLD as 9.5 specifies: the aim ray
against the walkable surface set, the ghost, A / B / A-moves, the hop and
the cross-room landing, the profile record, the Quartermaster's issue at
KEYHOLDER + 24 Keys. See §9 2026-09-15 rev 13 for what stage 2 still owes
(declared roofs, the galleries, the tutorial lesson).

**Previous implementation — Phase 9.1 stage 1: THE FINDS + THE TAPES, local
delivery (2026-09-15 rev 12).** TAPES + PAY only (potions / items / cubes
are RESERVED kinds `hqCollectFind` refuses until an inventory owner
exists). `DOOR_TAPES` = the hundred (T001…T100: two per built site — one
on the walkway, one ON THE BOARD, `hard` when its cell is a wall two
levels up — one per complex part, one per exploration-floor room; never
the hall, the foyer, a lobby or a corridor; titles and captions Claude's
DRAFT, `clip: null` until the file is on R2). `DOOR_HQ.finds` is
GENERATED (`hqBuildFinds` → `hqFindSpot`: the free grid point farthest
from the way in, clear of every blocker / native / counter / landing /
mast, on a reachable dry cell in a cave, off the board on a board room;
`hqFindBoardSpot` for the board; `DOOR_HQ.findSpots` pins a spot by
hand). ONE daily pay cache per tape room (`hqHash(date|id) % 3`). The
renderer builds each as its proc under a SPARKLE (`_hqPlaceFinds`), the
scan offers it as kind `find` within 1.6 m, E → map.js `_hqTakeFind`:
load → `hqCollectFind` (the claim and the pay into the same profile
object) → ONE save → the beat (chime, stamp, a strip toast) → `hq.
takeFind` drops it in place. THE SHELF = Room 360's new counter `shelf`
(overlay `tapes`, `_hqTapesHtml`): a CRT frame that plays a found tape's
clip (an `<img>` / `<video>`; a blank cassette plays static), the
hundred as spines, LAST SEEN on an unfound spine once another tape of
the same site is on file. The strip pill `#hqTapes`; the OFFICER sheet's
row. `hq-finds.test.js` guards it. Still open in 9.1: the reserved
kinds, the `hard` finds' reach (9.5), a TV that plays the last tape.

**Previous implementation — Phase 9.3 expansion: THE ROUTES + THE WORLD
TAB, local delivery (2026-09-15 rev 7).** The world is WALKED: `DOOR_HQ.links`
carries 32 live links (the pilot's two, the two seams, and 28 new ordinary
doors) on nine lines named in **`DOOR_HQ.routes`** (`lunar` · `deep` ·
`divine` · `bases` · `woods` · `ley` · `highway` · `wonderland` · `seams`;
label / sub / colour / `dashed`). Every built site but the Looking-Glass
is a station (its room is nine metres across — a north door would land
on the board; it joins when its room grows or 9.5 reaches it). Every link
door stands on its board room's NORTH wall west of the console lane, ≤ 3
per room, lanes ≥ 4.4 m apart, and lands 2.4 m in on the dry walkway
(the production landing test). **`hqLinkLive(link)`** is the ONE liveness
rule (both ends built, well-formed, catalogued wear) that `hqLinkDoors`
and **`hqWorldRoutes(curRoom)`** share; the latter chains a line's legs
into stations (a station is a SITE — a seam off a complex's part is the
house's; an end first; a station on two lines is an interchange; `here`
= the viewer's room or site). THE DIRECTORY grew THE WORLD (map.js
`_hqWorldHtml`, under the register): a subway map per line in its ink, a
dot per site with its number, a leg per link (dashed = a seam), a double
ring at an interchange, the room you stand in filled, GO to any other
station. Still open in 9.3: the suites, the star chart's route lines, the
other eight `way` kinds, the airlock ends. `hq-world.test.js` guards it.

**Previous implementation — Phase 9.2 stage 1, local delivery (2026-09-15).**
THE HAUNTED HOUSE is the first complex: four hand-authored box rooms
(`site_prebuilt_haunted_hall` / `_upstairs` / `_attic` / `_cellar`, each
`site: 'prebuilt_haunted'` + `part`, no number) behind THE FRONT DOOR on
the board room's north wall at x −7.5 (`siteRooms.backDoors.prebuilt_haunted`,
now an ARRAY — one row stays legal). Reads: `hqComplexRoomId` /
`hqRoomSite` / `hqRoomPart` / `hqSiteComplex` / `hqComplexRooms`;
`hqLinkRoom` resolves a `{ site, part }` end ONLY to an authored room;
`hqRefreshComplexLinks()` gives the parts the same link-door append the
generated rooms take (once at load, never accumulating). The two-floor
room (`shell.gallery`) SHIPPED 2026-09-15 rev 20 (see the 9.2 stage 2
paragraph below): the hall wears THE LANDING; upstairs stays its own box
room (the bedrooms) through the doorway on it.
THE PARK RULE is met in the stage-1 reading: a `railing_1m` run in every
room (the banister, the landing rail, the well's guard, the sawn-off
banister in the attic) and `riser_*` tiers in every big room (the dais,
the landing's step, the coal chute) — a SLOPED ramp waits on 9.8's
registry. `hq-complex.test.js` guards it. Nothing authored beyond stage
directions and overheard lines (Claude's DRAFT, A15 — the user rewrites).

**Previous implementation — Phase 9.3 stage 1, local delivery.** The user asked
for a review, fixes and a start on the first phase. The first slice is the
user's Moon ⇄ spaceship ⇄ Saturn route, through ordinary doors in the
three EXISTING board rooms. Four generated door ends, matching return
landings, unchanged bay exits and crossing consoles. The spaceship's
ends move to its airlock only after that room is built. No authored
story text, new prices, collectible counts or optional skate rewards
are approved by this technical implementation.

**Reviewed order [SUPERSEDED — every stage below has shipped locally; the open work is PHASE9_QUALITY_PLAN.md §8]:** 9.3 stage 1 (multiple exits + a reversible pilot — DONE) →
9.2 stage 1 (first complex — DONE, the Haunted House) → 9.3 expansion (routes — DONE rev 7, WORLD tab — DONE rev 7; suites and the star chart's lines open)
→ 9.1 finds (stage 1 DONE, rev 12: tapes + pay) → 9.5 portable thresholds → 9.4 encounters. THE SUITES are DONE
(rev 9, 2026-09-15). THE WELLS + THE
CAVE (9.3, rev 8 → shipped rev 10 / 11) are DONE. NEXT: 9.5 THE DOOR GUN (the `hard`
finds wait on it), then 9.4. Optional 9.8
has no dependency priority; 9.9 (water polo) is optional on optional, after 9.8. Each stage needs its own acceptance; these
are not promises of one-session completion.

**Implementation review and corrected constraints:**
- **Inventory:** the current `siteRooms.built` contains **38** sites, not
  29. Two tapes per site would consume 76 of 100, leaving 24 for complex
  and facility rooms. Allocate from actual built rooms; do not promise
  two per site plus ~30 complex tapes and extra facility tapes. Route
  coverage must also use the current register, not a hard-coded count.
- **Unbuilt destinations:** the route table includes the airlock, hold,
  cellar, archive, crypt and subway before those rooms exist. Publish
  only complete pairs with built destinations. Stage 1 supports `a/b`
  endpoints `{ site, wall, x }` on north/south walls, **`z` on east/west**.
  Future explicit `{ room, wall, x|z }` endpoints identify complex or HQ
  rooms without inventing a site for a facility room. `part` is not an
  implicit room-name generator. Explicit rooms still need the shared
  link append step when their authoring stage is implemented.
- **Direction:** stage 1 is two-way only. One-way routes need a separate
  arrival anchor and a verified escape path, not a nonexistent return
  door id. The Saturn drop is deferred. Unsupported `way` rows are held
  back; a wardrobe needs collision, interaction, safe landing, audio and
  cleanup integration as well as geometry. HOME remains subject to A14.
- **Crowding:** the proposed suites remove **two** ground doors (Clock
  and Interrogation) and one upstairs door (two become one), not three
  ground doors. Suiting rooms must preserve incoming `at` ids, return
  routes, counter homes, cast locations, gates and remembered landings.
  Suite moves and a directory WORLD tab are separate from this pilot.
- **Graph:** `hqWorldGraph()` currently reports registered rooms and
  directed navigable door actions, including sector and built mission
  door destinations. It does not yet model elevator-panel buttons,
  overlay travel, gate-dependent reachability or variants as separate
  states, and does not add a WORLD tab. Full foyer reachability is a
  later acceptance gate; the pilot verifies both-direction route travel.
- **Geometry:** a clear wall slot alone does not prove a safe arrival.
  Check the renderer's 2.4 m inward landing, body clearance, dry walkway,
  props, people and setting exclusion lanes. New large rooms must still
  include a rideable rail and ramp. A box gallery and third rotunda ring
  share concepts but need separate surface, camera and stair work.
- **Find ownership:** `creditLocalGold` reloads and saves the active
  profile. Mutating an older profile object and then saving it can lose
  either the claim or the reward. Use one claim/reward save transaction;
  server-backed economy rewards need an authoritative claim path and
  retry idempotency. The Quartermaster buys unit unlocks; a persistent
  potion/item inventory cannot be assumed. Defer rewards until ownership
  and persistence are defined. Placeholder tapes need not have clips;
  missing media must remain unavailable instead of loading fake URLs.
- **Encounters:** complex parts have no corresponding battle boards.
  Build an explicit room-to-board mapping before claiming the room becomes
  the board; otherwise label it a separate arena encounter. Engagement
  needs range plus line of sight (remove E-from-any-distance). Use a
  per-launch camera/intro option, not a global intro switch, and clear
  encounter state on cancel, loss, return and restart. Keep HQ safe and
  online matches outside the encounter launch path.
- **Portable doors:** store height and a surface identity as well as room,
  x/z/yaw. Validate both exit body volumes after rebuilding the destination;
  a visible ray hit alone is insufficient. Add re-entry cooldown, safe
  fallback, scene ownership and explicit fresh-visit versus modal/match
  return semantics. Use an ordinary leaf: `leaf_hollow_core` is an
  exclusive rank leaf. Build new features open under the user's current
  end-game rule; proposed prices and rank gates remain proposals.
- **Skating:** use time-based friction (for example the equivalent of
  `pow(0.985, dt * 60)`), not per-frame decay. Reset momentum, rail locks,
  held keys and delayed bail callbacks across pause and room changes.
  The renderers' existing stairs are not automatically rideable ramps.
  Input conflicts, registry geometry and surface transitions need tests;
  a best-combo reward remains optional and unimplemented.

**9.0 What this phase builds on (already shipped — do not rebuild).**
- A room is ONE scene; a door is a rebuild with a landing (`action:
  { room, at }`). A site room is GENERATED (`hqSiteRoom`, 7.2) with its
  Δ board on the floor at 1:1 and its map's setting inside it (stage 5);
  `siteRooms.backDoors[mapId]` already appends a SECOND door row to a
  site room (H-Wing → the Backrooms, C-12) and `_hqBuildSetting` keeps
  every room door's lane clear. Phase 9 generalises that one row.
- The walker climbs +1 on a board (`_hqSiteCellAt`), never +2; jumps
  (`HQ_JUMP_V`, apex ≈ 1.46 m); walks off a drop ≤ `HQ_DROP_MAX` (1.6 m);
  wades a fluid cell; left click only grabs the pointer lock (free for
  9.5); E is the one interact key (`_hqInteractTarget`: door / counter /
  notice / npc — 9.1 adds `find`).
- A freestanding threshold already exists: the CROSSING's `_introBuildDoor`
  (frame, seal, case line, the map's catalogue leaf) stands on the apron
  in every match intro and on the main menu's flat kit. 9.5's doors ARE
  that builder on the HQ scene; the Door Agent race's board doors (rev 2)
  are the same leaf in a DOOR-issue frame — the kit has thirty doors,
  never a procedural plank.
- A launch from a room: `_hqLaunchMission(mapId, { delta, doorId,
  counterId, variant })` → `_hqPreselect` (+ `_hqCpuPool`) → the terminal
  → `_msConfirm` → `startMatch`; the post-match return lands at the
  console. THE LAST ROSTER (`loadLastParty`, 2026-09-15) is a full party
  the encounter can start with, no builder.
- The Key pickup CELEBRATION kit (6.3 rev 2) is the pickup beat 9.1
  reuses; `hqHash(date | …)` seeding (Form 365) is how a daily subset is
  chosen; `creditLocalGold` (profile.js) is how hazard pay lands;
  `door.hq.*` on the profile is where every viewer-local record goes.
- The natives (`npcSpots` with a `race` hint) already stand on every
  site's walkway — 9.4's roamer is one of them that moves.
- 3.10's budget is PER ROOM. A complex of six rooms costs no more at
  once than one room; the cost is authoring.

**9.1 THE FINDS — hidden objects and THE TAPES.**
- **Data.** `DOOR_HQ.finds` (data.js), one row per hiding place: `{ id,
  room, x, z, y?, kind: 'pay' | 'potion' | 'item' | 'tape' | 'cube',
  amount? (pay), item? (an ITEM_RULES id), tape? (a `DOOR_TAPES` id),
  daily?: true, hard?: true, why }`. `y` is only for a shelf / a ledge;
  the default is the surface (`_hqSurface`). `hard: true` marks a spot
  the walker cannot reach on foot (9.5 reaches it; the test asserts a
  hard find has no walkable path — stage 2, once the door gun exists).
  `DOOR_TAPES` = the hundred: `{ id: 'T001'…, title, where (the room the
  cassette lies in), clip (an R2 path under `Assets/door/tapes/`, gif /
  webm / mp4), caption, kind: 'evidence' | 'parents' | 'facility' }` —
  the TITLES and CAPTIONS are the user's (A15; Claude drafts `T001`–`T100`
  as placeholders with the room and a one-line stage direction each).
- **Rules.** `hqFindsInRoom(roomId, profile, now)` = the rows in this
  room minus the taken ones; a `daily` row is LIVE only on the days
  `hqHash(date | id) % 3 === 0` (a third of the pay / potion caches per
  day — the building restocks) and is taken once per day; a tape / cube /
  item row is taken ONCE EVER. `hqCollectFind(profile, id, now)` writes
  `door.hq.finds = { taken: { [id]: dateOrTrue }, tapes: [ids], cubes:
  n }`, credits pay through `creditLocalGold`, a potion / item into the
  account's inventory by the same path the Quartermaster's till uses (read
  that site before wiring — one owner), returns the beat to play.
  `hqTapeShelf(profile)` = the hundred with `found: bool` for the shelf.
  Viewer-local; nothing on `state`, nothing relayed (RULE #2).
- **Renderer.** One proc, `find_glow` (`_hqProcBuilders`): the object's
  own small model where the kit has one (a potion = the item sprite on a
  card, a cassette = a 10 × 6 × 2 cm box with the label, a cube = the
  3 × 3 tinted cells, a pay cache = a manila envelope) under a SPARKLE
  (an additive sprite ring + 6 motes on a ticker, a point light with the
  find's colour — pay gold, potion red, item white, tape magenta, cube
  the six colours cycling) so it reads from across a dark room. Placed
  by `_hqPlaceProps` from `hqFindsInRoom` at build (a room is rebuilt per
  entry, so a taken find is simply not built). Interaction: a new target
  kind `find` in the walker's scan (radius 1.6 m, the prompt reads TAKE ·
  <kind>), E → `hqCollectFind` → the pickup beat: the Key celebration's
  kit for a tape / cube / item (the star chime, the stamp, a strip toast
  "TAPE 17 / 100 · <title>"), a coin chime + the gold float for pay, and
  the proc is dropped in place (no rebuild). `EW_HQ_FINDS_ALL` (dev)
  builds every find regardless.
- **THE TAPE ROOM.** The tapes play at Room 360's PROJECTOR (the
  Observatorium is "the tape library's projection" — one home, C-27): the
  projector counter grows a second verb, THE SHELF (`overlay: 'tapes'`,
  map.js `_hqTapesHtml`): a 10 × 10 grid of cassette spines, found ones
  labelled, a click plays the clip in the panel as a DOM `<img>` /
  `<video loop muted>` inside a CRT frame (the terminal's `.ms-crt`
  chrome, the tape's OSD counter, the tracking bar — the ident kit already
  has the look) with the caption typed under it; unfound spines read the
  ROOM they lie in once you have found `hint` tapes in that room's
  complex (the collectible's own hint system, no map marker). Nothing
  3D: a gif on a wall in the scene would want `THREE.VideoTexture` and a
  decode per frame per tape — the panel is cheap and honest; a single TV
  proc that plays the LAST tape found (a `VideoTexture` on the Cafeterium
  set) is a stage-3 nicety.
- **Where a hundred go.** REC: 2 per site room (76 across the current 38 rooms — one
  in plain sight on the walkway, one `hard`), 1 per complex room (9.2's
  rooms), with only 24 remaining slots shared by complexes and the facility's exploration floors (Phase 8's
  rooms; never the hall, the foyer, the corridors — the finds are the
  reward for going somewhere). The pay / potion caches: ~60 `daily`
  rows over the same rooms. `door.hq.finds` is the record; the count on
  the strip (a `#hqTapes` pill beside the Keys) and on the OFFICER page
  of the pause menu.
- **The cube (if the user wants both).** A Rubik's Cube is the Black
  Cube's cousin — REC: 12 cubes (one per bay-and-then-some), each a
  SOLVED face short, found in the places the story cares about (Room X,
  the closet, H-Wing's office, the Bureau …); the twelfth turns a tape
  in the shelf from evidence to the parents' — a story hook the user can
  wire later. Or no cubes: the tapes are the hundred (Part C row 26).
- **Assets (the user).** The tapes' clips: gif / webm / mp4, 4:3 or 1:1,
  ≤ 2 MB each, ≤ 8 s looping, to R2 `Assets/door/tapes/T001.gif …`;
  a `portrait.png`-style thumbnail is optional (the spine shows the
  title). A VHS cassette GLB and a potion bottle GLB replace the procs
  by the register's `file` rule.
- **Tests.** `hq-finds.test.js`: every find's room exists and the spot
  is inside it and not in a wall / a blocker (the flavour-prop check);
  `DOOR_TAPES` is exactly 100 with unique ids and clips; the daily roll
  never lights a tape; `hqCollectFind` is idempotent; the source sites
  (the `find` kind in the scan, the proc, the shelf overlay, the strip
  pill).

**9.2 THE COMPLEXES — a site that is several rooms.**
- **Rule.** A site's GENERATED room stays the board room (the crossing
  console, the battle marker, the way back to the bay). A COMPLEX is
  hand-authored rooms around it in `DOOR_HQ.rooms` with ids
  `site_<id>_<part>` (the H-Wing pattern: `hwing_*`), joined to the
  board room by door rows in **`siteRooms.backDoors[mapId]`, which
  becomes an ARRAY** (one row stays legal). A complex room is a box room
  like any other — `kind: 'box'`, its own shell, procs, natives, lines,
  finds — and wears `site: mapId` + `part: '<name>'` so `hqRoomNo` reads
  the threshold's number through it (the register lists the site once)
  and 9.4 knows it is wild. `hqSiteComplex(mapId)` lists the board room
  + its parts; `hqRoomSite(roomId)` answers the site of any room.
- **Indoor + outdoor in one site.** The board room is already `open`
  where the map is; a complex mixes: the Haunted House's board room is
  the ground floor cut open under the sky (as shipped) and its UPSTAIRS,
  ATTIC and CELLAR are indoor box rooms behind the house's own doors; the
  Strip's board room is the boulevard and THE CHAPEL / THE CASINO FLOOR
  are indoors; the Spaceship's deck is open to space and THE BRIDGE /
  ENGINEERING / THE AIRLOCK are sealed. An outdoor complex room = the
  same `shell.open` + `sky` + `edge` rules as a site room (Room 8 is the
  precedent for a hand-authored open room).
- **Two floors in ONE room (stage 2, renderer) — SHIPPED 2026-09-15 rev
  20.** `shell.gallery = { h, side: 'n'|'e'|'s'|'w', w, stairAt:
  'start'|'end'|null, rail }` (data.js) builds a SLAB along one wall at
  height `h`, `w` deep, with a straight closed-string flight at the
  named end of the strip (its LOW end at the wall's corner, its foot open
  at the side, twelve risers of 0.24 m over 3.36 m for 2.9 m — `rise` /
  `run` override) and a banister on the open edge. three-renderer.js:
  `_hqGalleryFrame(room)` = the frame (`_hq.gallery`; s ALONG the
  wall from its start corner, t INTO the room; `local` / `world`),
  `_hqGalleryAt(x, z, curY)` = THE LAYER `_hqSurface`'s box branch reads
  (a tread / the slab; `null` = the flight's mass from below or the rail
  from above; `undefined` = the floor under the slab — a free query is
  always the floor's), `_hqGalleryFloor` (a jump lands on the slab or a
  tread — `_hqBlockerFloor` seeds from it, the portal aim too),
  `_hqGalleryAir` (`_hqAirOK`: the slab's volume, the flight's mass and
  the rail are solid in the air), `_hqGalleryCam` (`_hqCamBlocked`: the
  boom never enters the slab or the flight), `_hqBuildGallery` (the deck
  in the floor sheet, the underside in the ceiling sheet, a trim fascia,
  the treads with a nosing, posts + top + mid rail, a sloped rail up the
  flight; `_hq.rails` gets both runs and `_hq.ramps` the flight's pitch —
  the park rule's registers). A door on the gallery's wall STANDS ON THE
  SLAB (`_hqDoorFloorY`; an explicit `y: 0` puts it under), `_hqGoTo`
  lands 2.4 m in on it, and `_hqFindTarget` finds a box door by HEIGHT
  now (the rotunda's level test made the stairwell's landing door at y 6
  unreachable too). Props stand on the slab with `y: h`, wall props above
  it with `mount` measured from the floor. `stairAt: null` = no stair:
  9.5's first "seen but out of reach" ledge, the door gun is the way up.
  `rail: false` draws no rail — the edge stays a balcony (the step rule
  refuses a 2.9 m drop). 8.4's THIRD RING on the rotunda SHIPPED 2026-09-16 (rev 63:
  `shell.ring3`, the same idea as a layer — hq-ring3.test.js). NOT BUILT: natives on the slab, a
  gallery on a site / cave room, a landing that turns (a half-landing
  flight). `hq-gallery.test.js` climbs the hall's flight and crosses the
  slab to the door's landing by the step rule alone.
- **The first four complexes (REC; the user picks the order).**
  | Site | Parts (rooms) | Doors | Why |
  |---|---|---|---|
  | 13 · THE HAUNTED HOUSE | `_hall` (the front hall, the staircase up, the cellar door), `_upstairs` (the landing, four bedrooms as one room with a `gallery` over the hall — the first two-floor room), `_attic` (low, one bulb, the trunk, a `hard` tape), `_cellar` (the furnace, the wine racks, the well — the link to the woods, 9.3) | the board room's front door (n wall) → `_hall`; `_hall` stairs → `_upstairs`; `_upstairs` ladder → `_attic`; `_hall` cellar door → `_cellar` | the user's own example; four rooms, one of them two floors |
  | 1717 · THE FLYING DUTCHMAN | `_gundeck` (the cannon deck, the hammocks), `_hold` (flooding — a wading floor, the cargo, THE HATCH below the waterline), `_cabin` (the captain's, the chart table, the stern windows onto the streaming sea) | the deck's companionway (the board room's back door) → `_gundeck`; `_gundeck` → `_hold` (down) and → `_cabin` (aft) | decks; the hold's hatch is the Atlantis link |
  | 426 · THE SPACESHIP | `_bridge` (the viewport onto the sun-swing, the dead captain's chair), `_engineering` (the three burning bells from inside, the breach with the sparking cables), `_airlock` (the docking collar — the Moon / Saturn links) | the deck's hatch → `_engineering`; `_engineering` → `_bridge` (fore) and → `_airlock` (the collar) | decks; the airlock is the Celestial hub |
  | 21 · THE STRIP + 1954 · DOWNTOWN | the Strip: `_chapel` (the drive-through window, the Elvis), `_casino` (the floor, the slots as procs, the cage); Downtown: `_lobby` (the collapsed tower's ground floor), `_subway` (the platform — the highway link's underground) | the boulevard's chapel + casino doors; Downtown's tower door + the subway stairs | "the urban maps could be a lot bigger" — the block, not just the intersection **SHIPPED 2026-09-16 (stage 4)**: `site_prebuilt_strip_chapel` / `_casino`, `site_prebuilt_downtown_lobby` / `_subway`; the chapel's door is the Strip's back door (north, x −0.2 — its one free lane), the casino is behind the chapel (one door, no clock, no window); the tower's door is Downtown's back door on its EAST wall (the north wall is full — three highway doors), the platform is down the stair off the lobby and is THE SUBWAY's third station (`links.subway_downtown`, a `train` way FREE on the platform's track; the far end a `leaf_frame_only` stair mouth on Cyberpunk's north wall at x −0.2 — the first `way` link with a plain door back). `hq-urban.test.js`. |
  Then, as the user asks: the Lodge's basement, Area 51's hangar
  interior + THE TUNNEL (→ D.U.M.B.), CERN's ring tunnel, the Vatican's
  archive + crypt, Camelot's keep, Atlantis's sunken hall.
- **Renderer.** Nothing new for stage 1 (box rooms + the H-Wing's
  patterns); the `backDoors` array is a data.js change + one loop in
  `hqSiteRoom`; the Dutchman's streaming sea in `_cabin`'s stern windows
  is a `false_window`-style card until the moving-map sky is asked into a
  box room (it is `shell.sky` on an open room today — a box room with a
  `sky` behind a window opening is a stage-2 ask).
- **Tests.** doorhq.test.js: every `backDoors` row lands, every complex
  room wears `site` and a `part`, no complex room wears a `roomNo`, the
  register still lists each site once, the flavour-prop bounds hold in
  the new rooms.

**9.3 THE WORLD GRAPH — a door in one site leads to a related site.**
- **Data.** `DOOR_HQ.links` (data.js), one row per seam: `{ id, a:
  { site, part?, wall, x }, b: { site, part?, wall, x }, leaf, labelA,
  labelB, subA?, subB?, why, note, gate?: { minClearance?, requiresKeys?
  } }`. `hqSiteRoom` (for the board room) and the complex rooms (through
  a shared `hqLinkDoors(roomId)`) append one door per link end with the
  SAME leaf on both sides, `action: { room: <the other end's room>, at:
  'link_<id>' }`, the plate reading ROOM № · NAME · `sub` (the plate
  rule, 2026-09-12: "→ ROOM 1969 · THE MOON" is the function). A `room`
  door is never sector-gated (C-12: the H-Wing → Backrooms precedent) —
  a link may reach INTO a sealed bay's site; `gate` is the link's own
  and reads like a rank door. `hqWorldGraph()` = every room and every
  door as edges, for the directory's new WORLD MAP tab and for the test
  (connected, no dangling `at`).
- **The seams (REC — the user strikes or adds; each has a `why` because
  the register rule says every door explains itself).**
  | Route | Seam | The door |
  |---|---|---|
  | THE LUNAR ROUTE | 1969 the Moon ⇄ 426 the Spaceship `_airlock` | the lander's hatch ⇄ the docking collar (the misc kit's docking ring is already on the roster) |
  | | 426 `_airlock` ⇄ 6 Saturn | the second collar, onto the hexagon plateau |
  | | 4 Mars ⇄ 1969 the Moon | the rover bay's hatch (the rover stands on Mars's board already) |
  | | 6 Saturn ⇄ 0 the Singularity | the drop off the plateau's edge — a `leaf_frame_only` with nothing behind it (one way: it lands you at the Singularity, whose way back is its bay) |
  | THE DEEP | 1717 the Dutchman `_hold` ⇄ H-20 Atlantis | the hatch below the waterline (`leaf_bulkhead`, wet) |
  | | H-20 Atlantis ⇄ 180 Hollow Earth ⇄ 88 Agartha | the drowned stair down; the crystal adit |
  | | 90S Antarctica ⇄ 1225 the North Pole | the two ends of one hole (the polar entrance — one door, the leaf in both ice walls) |
  | | 14179 Shasta ⇄ 88 Agartha | the Lemurian tunnel |
  | THE DIVINE STAIR | 777 Heaven ⇄ 12 Olympus | the stair that only goes up (a gate of cloud) |
  | | 888 the Vatican `_archive` ⇄ 777 Heaven; 888 `_crypt` ⇄ 666 Hell | the elevator that only goes up; the crypt's back wall |
  | | 666 Hell ⇄ 180 Hollow Earth | the way down IS the way in |
  | THE BASES | 51 Area 51 `_tunnel` ⇄ 555 D.U.M.B. ⇄ 999 CERN | "five sides above ground; the sixth is down" — the tunnel every base is on |
  | | 999 CERN ⇄ 90 the Backrooms | the ring tunnel's noclip (the second way into Bay 6's site, beside H-Wing) |
  | THE WOODS | 13 the Haunted House `_cellar` ⇄ 512 Skinwalker Ranch ⇄ 23 Bohemian Grove ⇄ 420 Fairy Forest | the same woods, four gates in one fence |
  | THE LEY LINE | 56 Stonehenge ⇄ 9600 Göbekli Tepe ⇄ 444 Giza ⇄ 11 Babel | the line the stones stand on (a frame at each end) |
  | | 11 Babel ⇄ 2012 Technoticlan; i Camelot ⇄ 33 the Lodge | the tower's other stair; the Round Table's other room |
  | THE HIGHWAY | 1945 Nuketown ⇄ 1954 Downtown `_subway` ⇄ 21 the Strip ⇄ 2047 Cyberpunk City | one road, a century long; 50 the Stadium ⇄ Downtown by the parking structure |
  | THE WONDERLAND | E4 the Looking-Glass ⇄ 2D Flat Lands ⇄ 90 the Backrooms | a board onto a plane onto a carpet |
  Every launch site is on at least one route; no route crosses the hall.
  The bays stay the CUSTOMS face (the thresholds are how a crossing is
  filed) — the links are how the world is WALKED.
- **THE SEAMS THAT ARE NOT DOORS (the user, 2026-09-15 rev 5: "a
  wardrobe in the haunted house or other suburban house leading to
  Camelot … like the lion, the witch and the wardrobe. More doors like
  that that aren't really doors but other sorts of entryways").** A link
  row may carry **`way: '<kind>'`** instead of a `leaf`: the renderer
  builds the ENTRYWAY from `_hqWayBuilders[kind]` (a proc with an opening
  the walker steps into — the trigger is the same `onEnterDoor` path, the
  plate hangs on the object, the prompt reads the kind's verb: CLIMB IN ·
  DIVE · STEP THROUGH · CRAWL) and the DOOR sound kit is swapped for the
  way's own (a creak, a splash, a hum). The kinds, each with its first
  seam (REC — the user strikes / adds):
  | `way` | What it is | First seam |
  |---|---|---|
  | `wardrobe` | a tall wardrobe, both doors open, coats to push through, a lamp post's light at the back | 13 the Haunted House `_upstairs` ⇄ i CAMELOT (the winter wood beyond the coats — the user's own) |
  | `mirror` | a full-length mirror that does not reflect the room | **SHIPPED 2026-09-15 rev 22**: 1287 the Barbershop's east wall (by the sink; the towels moved over the waiting chairs) ⇄ E4 the Looking-Glass, a FREE end on its north marble strip (an 18 m room has no north lane — the first free `way` on a site room; the counter mirror stays the ID card) |
  | `well` / `hole` | a well head, a hole in the ground, a rabbit hole | the Haunted House `_cellar`'s well ⇄ 180 Hollow Earth; the Grove's owl hollow ⇄ 420 Fairy Forest |
  | `pool` | a pool of water you dive into and surface from elsewhere | **SHIPPED 2026-09-15 rev 22**: the natatorium's PLUNGE POOL at the deep end (a free end; the south-west drain moved) ⇄ 1717 the Dutchman's hold, THE BILGE (a free end in the floor, under the lantern). Room 8's weir ⇄ H-20 Atlantis waits: Atlantis's north wall carries three wide hatches and has no fourth lane |
  | `painting` | a framed picture you step INTO | **SHIPPED 2026-09-15 rev 22**: 33 the Lodge ⇄ 12 Olympus (both north lanes at x −0.2); the Bureau's north wall (x −1.7, the nameplate moved west) ⇄ 888 the Vatican's north lane — the link wears the Bureau's OWN gate (GATEKEEPER + 24 Keys at both ends), so the square is no way round the door |
  | `fireplace` | a hearth you walk into, Floo-style | **SHIPPED 2026-09-15 rev 22**: 1225 the North Pole's north lane (x −10) ⇄ the Haunted House `_hall`'s EAST wall (z 0.1 — the north wall is the landing's; the fire burns orange and goes GREEN as you come up) |
  | `phonebox` / `elevator` | a booth or a lift that goes where the building does not | H-Wing HOME's phone ⇄ (A14 Q5 — the story rules it); the garage ramp's LOT FULL barrier ⇄ 21 the Strip (the car is the way: sit in the Sedan) |
  | `screen` | a CRT you crawl through (the ring's own kit) | **SHIPPED 2026-09-15 rev 22**: Room 360's pull-down projection screen on the west wall (z 3.4; the coats moved north, the round picture to the north wall) ⇄ 0 the Singularity's north lane — the static has a shape in it that opens |
  | `train` / `subway` | a platform; the train arrives and the next station is another map | **SHIPPED 2026-09-15 rev 21**: Room 2's tunnel (the platform, a FREE end on the track) ⇄ 2047 Cyberpunk (the north wall, half inside it) on THE SUBWAY route. **2026-09-16 (9.2 stage 4)**: 1954 Downtown's PLATFORM (a complex part; the train FREE on its own track) ⇄ Cyberpunk's last north lane (x −0.2) as a plain stair mouth — a second train on that wall would have run through the Strip's door; CERN still waits on a free north lane |
  | `tent` / `closet` | a closet with a back, a tent bigger inside | **SHIPPED 2026-09-15 rev 22** (`closet`): 1945 Nuketown's north lane (x −0.2) ⇄ the Haunted House `_upstairs`'s WEST wall (z 0.4, the picture moved to the north wall) — a single leaf, three coats, no back wall. `tent` is not built |
  The renderer cost is one proc per kind (the opening + the trigger); the
  data cost is one row per seam. **SHIPPED 2026-09-15 rev 6: `wardrobe`
  and `well` (the Haunted House's two, both ends the same object) —
  `DOOR_HQ.ways` is the catalogue + the gate, a link end may stand FREE
  (`wall: 'free', x, z, face`), an end may override the wear (`leaf` = a
  plain door back). The other eight kinds are builders + rows to come.** **2026-09-15 rev 22: six of them SHIPPED (mirror · pool · painting · fireplace · screen · closet — see the rows); `phonebox` waits on A14 (HOME's phone), `tent` on a site that wants one.** Rule: a `way` seam is still a LINK (both
  ends in `hqWorldGraph()`, the directory's subway map draws it dashed),
  and it lands the walker facing AWAY from the way it came out of — you
  climb OUT of a wardrobe into Camelot's snow, you do not stand in it.
  hq-world.test.js: every `way` names a builder, every `way` seam has a
  return (the same object at the far end, or a plain door back).

- **THE WELLS AND THE CAVE (the user, 2026-09-15 rev 8: "the well should
  be in the garden and lead to the cellar or a cave system or underground
  dungeon which can have different exits which lead to Hell, the DUMB,
  Agartha or Hollow Earth, etc. We can still keep the well in the haunted
  house cellar too but it should lead to the cave. There can be more than
  one well to make it easier").** The `well` seam stops being a point-to-
  point pipe (cellar ⇄ Hollow Earth, rev 6) and becomes a HUB: every well
  in the world drops into ONE CAVE SYSTEM, and the cave has several ways
  out.
  - **THE CAVE is a complex, not a site (REC).** `site_prebuilt_hollow_earth_
    cave_*` — hand-authored box rooms wearing `site: 'prebuilt_hollow_earth'`
    + `part`, no number, the 9.2 shape exactly (Hollow Earth is the one
    site whose whole premise is "the inside of the earth", so the cave is
    its complex and is WILD by construction — `hqRoomSite` answers 180;
    nothing new for 9.4's test). Alt: its own site and number (a `prebuilt_
    caves` launch map with a Δ board — then it wants the 7.10 checklist,
    two `MAP_POOL` rows and a bay; REC no, the cave is a place you WALK,
    the battles are at its exits). Parts (REC, the user renames): `_shaft`
    (THE WELL ROOM — the bottom of every well: one stone well head per
    well in the world, each a `way: 'well'` end standing FREE on the floor
    and facing its own wall, so climbing OUT of the wrong one is how you
    learn the map; water to the ankle, `HQ_WADE_M`), `_gallery` (the long
    cave — stalactites, a stream, the crossroads sign nobody trusts), and
    the four EXIT chambers, each a `links` row to a built site:
    | Exit | The way | The seam |
    |---|---|---|
    | 666 HELL | `_vent`, a fissure that glows; the heat haze; the ground the colour of the map's `lava` | a `leaf_hell_arch` in the rock ⇄ Hell's board room north wall |
    | 555 D.U.M.B. | `_blast`, the base's SIXTH side — the rock cut square, a `leaf_bulkhead` blast door with the plate `LEVEL −6`, a dead camera | ⇄ D.U.M.B.'s board room (the base is already on THE BASES; the cave is its back door) |
    | 88 AGARTHA | `_adit`, the crystal adit (the misc kit's bluestones / `crystal` terrain), a warm light | ⇄ Agartha's board room |
    | 180 HOLLOW EARTH | `_mouth`, the cave mouth — the cave OPENS onto Hollow Earth's board room (this is the complex's own way in / out; the rev 6 well head by the cave wall becomes this chamber's) | the board room's north door ⇄ `_mouth` |
    "Etc." is a `links` row each (REC later: the Backrooms — a noclip in the
    dark; Antarctica — the ice cave; Room X — the undercroft's ladder from
    the crawlspace already goes DOWN, and the dungeon is a dungeon). Every
    exit is TWO-WAY (the return is the same object). The routes table gains
    **THE UNDERCROFT** (`DOOR_HQ.routes.undercroft`, dashed like `seams`):
    the wells + the four exits; THE DEEP keeps its drowned stair (Atlantis ⇄
    Hollow Earth ⇄ Agartha is a different way down).
  - **THE WELLS (more than one, to make it easier).** Every well is a
    `way: 'well'` link whose far end is THE WELL ROOM. In order of value:
    | # | Where | Why here |
    |---|---|---|
    | 1 | **THE GARDEN (1618)**, on the gravel ring beside the fountain, a free end (`wall: 'free'`) | the user's first ask — the facility's own well; the only way DOWN from the building that is not the elevator or a secret door. The garden is a FACILITY room (safe), the cave is wild: the well is the seam between them, like the H-Wing → Backrooms precedent (C-12; never gated by a sector lock). |
    | 2 | **THE HAUNTED HOUSE `_cellar`** (shipped rev 6) | kept — RE-POINTED from Hollow Earth to the well room (one row edit; the cellar's guard rail and the well head stay). |
    | 3 | **CAMELOT**'s courtyard (i) | the castle well — the wardrobe already lands you there; a second way out of the snow |
    | 4 | **SKINWALKER RANCH** (512) | the ranch's well, in the yard, boarded over (the boards are the way) |
    | 5 | **NUKETOWN** (1945) | the suburban wishing well on the lawn (the A10 anchor gets a way down) |
    | 6 | **GÖBEKLI TEPE** (9600) | the cistern — the oldest well, the ley line's way under |
    The well room has one head per row; a head's plate reads the well it
    is the bottom of (THE GARDEN WELL · CLIMB UP). REC six for stage 1
    (the garden + the cellar are the must-haves; 3–6 are one row each).
  - **THE DUNGEON under the cave (the user: "or underground dungeon").**
    The cave is the LOOP, the dungeon is the DEAD END: `_oubliette`, a
    room off the gallery behind a portcullis with cells, chains, a rack,
    the tapes' best hiding place (9.1: three tapes, one `hard`), a ROAMER
    (9.4: the first encounter authored for a complex — the cave is wild),
    and one secret wall into Room 24601's back (the HQ dungeon; a second
    secret door into the facility, like the room at the end's). No number
    (a part); THE PARK RULE holds in every part (the stream's bank is a
    rail; the adit's scree is a ramp; the well room's rim is a grind).
  - **Renderer.** Nothing new for stage 1: the rooms are box rooms with
    `strips: false` + `lights: []` + torches / crystals / the glow (the
    Haunted House's lighting rule), a cave WALL texture (a `shells[id]`
    wall key; `dirt_3` / `rock` from the terrain sheet through `_hqTex`,
    a `wallColor`), the `well` builder from rev 6 (free ends only — every
    head stands on a floor), the four seams the leaves already in the
    catalogue (`leaf_hell_arch`, `leaf_bulkhead`, the crystal adit a
    `leaf_frame_only` with the glow behind it). Stage 2 wants a ROCK
    shell (`kind: 'cave'` — a ruffled box like THE WORLD's `cavern` wall,
    an uneven floor the walker reads through `_hqSurface`) and a stream
    (`_nrMoat`'s sheet at floor level, waded).
  - **Data.** `links` rows (one per well, four per exit); the complex
    rooms in the block after the Haunted House; `routes.undercroft`;
    `siteRooms.backDoors.prebuilt_hollow_earth = [the mouth]`. Every well
    is in `hqWorldRoutes` as a `seams` leg to the same station (HOLLOW
    EARTH — a station with six dashed legs in the directory's map: the
    well room is drawn once, as the site's).
  - **Tests (hq-world.test.js).** Every `well` row's far end is the well
    room (or the well room is the near end); the well room has exactly
    one head per well row and no two heads within 1.6 m; every exit is a
    pair; the complex is connected from the mouth; the production landing
    clears every head; the garden's well stands in a hedge gap's clear
    (never in the fountain's blocker); the park rule.
  - **Decision (Part C row 33).** The cave as Hollow Earth's complex
    (REC) or its own site; which wells (REC the six); which exits beyond
    the four; whether the dungeon has a roamer before 9.4 ships (it
    cannot — the cell is empty until then).
- **The crowding (the hall).** The ground ring wears 13 doors, the
  mezzanine 11. Two moves, both data: **(a) SUITES** — a department gets
  ONE hall door onto its own lobby: MEDICAL WING (the hospital door at
  210° → a lobby → Medical, the Padded Room, the Interrogation Room —
  the interrogation door at 255° leaves the hall), RECORDS WING (240° →
  a lobby → Records, the Clock Room at 225° leaves the hall, the
  Observatorium's service stair), EXECUTIVE (the mezzanine: the Trophy
  Case at 290° and the Bureau at 315° behind one house door). That is
  −2 on the ground ring and −1 upstairs with nothing lost (one more
  door to walk for four rooms; the Annex is the precedent). **(b) THE
  GALLERY** — 8.4's third ring, the renderer stage that 9.2's box
  gallery pays for: a level-2 ring inside the dome with its own stair
  from the mezzanine, where the EXPLORATION doors go (the Observatorium,
  the Trophy Case, the Bureau, IT — the mezzanine keeps the bays and the
  elevator). REC: suites in the same delivery as the links (data only);
  the gallery when the box gallery ships.
- **The directory.** The directory panel gets a WORLD tab: the routes as
  a subway map (an SVG like the star chart's, one line per route, the
  stations the room numbers, a dot for the room you stand in), read from
  `hqWorldGraph()`; the Observatorium's star chart draws the routes as
  faint lines between the stars (the constellations are per bay today).
- **Tests.** `hq-world.test.js`: every link end names a built room and
  a free stretch of wall (no door overlap — the ring-layout check's
  rule), both ends land, the graph is connected from the foyer, every
  launch site is on a route, a `gate` reads like a rank door.

**9.4 THE ENCOUNTER — the room becomes the board.**
- **THE USER'S RULE (2026-09-15 rev 16, decided — Part C row 35; rev 17
  corrected the controls): NO RANDOM ENCOUNTERS. The officer starts every
  fight: with THE DOOR GUN HOLSTERED, LEFT CLICK is the walker's ATTACK
  animation — at a native in reach → the room is the board. Press F and
  wield the gun and the click places a threshold instead (9.5). No
  number keys (rev 16's 1 · 2 · 3 · 4 were a misreading — removed). E
  still talks to a native. STAGE 1 SHIPPED
  (local) on that rule: data.js `HQ_ENCOUNTER_RULES` / `hqEncounterRoomOk`
  / `hqEncounterCharOk` / `hqEncounterGesture` / `hqEncounterConfig` /
  `hqEncounterLaunch` / `hqEncounterRecord` / `hqEncounterLog`;
  three-renderer.js `_hqStrikeClick` (the one-shot on the walker's rig,
  the strike frame) / `_hqEncounterAim` (reach · cone · `_hqLosClear`) /
  `hq.strike` / `hq.encounterAim`; map.js `_hqEncounterFire` →
  `_hqEncounterStart` (THE LAST ROSTER seated inside `_msConfirm` through
  `window._hqEncounterParty`, the sticky config `ew_hq_encounter_cfg`
  the terminal files, no roster → the terminal once); battle.js skips
  the intro PER LAUNCH (`window._hqEncounterRun.noIntro`) and records the
  result on the commit; a loss lands in Medical (`_hqReturnOrMenu`).
  The roamer / patrol / hostile-run / stinger / Settings-row bullets
  below are SUPERSEDED by the rule — kept for the record. STAGE 2 SHIPPED
  (local, 2026-09-15 rev 24): seam (2) THE EYE — `ThreeCamera.seedPose`
  (the one new three-camera.js entry point) starts the first battle frame
  at the walker's own camera (data.js `hqEncounterEye` converts the
  renderer's eye + the room's board into tiles; battle.js seeds it in
  `showVSSplash` and skips the card — no VS card, no cinematic, an eased
  1.4 s move that survives the start's snap); THE CLEARED ROOM
  (`door.hq.cleared[roomId] = { date, ids }` written by `hqEncounterRecord`
  on a win, read by `hqEncounterCleared`; `_hqSpawnPopulation` leaves the
  beaten native out until tomorrow); THE GUARDED ENVELOPE (`hqRoomGuarded`
  = a wild room with a race-hinted spot → `guard: true` on its pay row;
  `hqFindsInRoom` hides it until the room is cleared today); the ward's
  CONDITION line (`hqMedicalRecord` → RECOVERING the day you were exited).
  NOT BUILT, with the reason: the `spawnSide` mirror — the spawn ZONES and
  the nexus points are keyed by SEAT + ROW (map.js `state.spawnZones[1]`
  = P1's row), never by `SPAWNS`, so a lane swap would seat P1 on P2's
  spawn nexus and break the Arena lockout; it waits on a zone-system
  mirror. Seam (3) the dissolve is still open (the loading card is the
  cut).**
- **Where.** Only a WILD room: the board room of a site and its complex
  parts (`hqRoomSite(roomId)` non-null). The facility, the foyer, the
  corridors, the rings, H-Wing are SAFE by construction (the user's rule)
  — never a flag to forget on a facility room.
- **The roamer.** [SUPERSEDED — no roamers, no random or contact encounters (Part C row 35 / PHASE9_QUALITY_PLAN.md §1)] `room.roamers = [{ race, gender?, spot: {x, z}, patrol:
  [{x, z}…], sight: 7, speed: 1.4, fights: <mapId> }]` (REC: 1–2 per
  wild room, drawn from the site's CPU pool — the natives that stand on
  the walkway today are the pool made visible). The renderer spawns a
  roamer like a native (`_hqSpawnPopulation`) with a PATROL ticker (walks
  the loop, idles at each node); within `sight` with line of sight (the
  camera-blocker set, `_hqCamBlocked`, is the LOS set) it turns HOSTILE:
  the reticle over it goes red, the Code Red stinger plays once, it runs
  at the walker. Contact, or E within interaction range and line of sight (the prompt reads
  ENGAGE — attacking first is the player's initiative: P1 acts first in
  the opening order), fires the encounter. `EW_HQ_NO_ROAMERS` (dev) and
  a Settings row (ROAMERS: On / Off — the building must stay a menu for
  anyone who wants a menu).
- **The launch.** [SUPERSEDED — see `_hqEncounterStart` (map.js) and PHASE9_QUALITY_PLAN.md §1; `spawnSide` is NOT built] `_hqEncounter(roamer)` → `_hqLaunchMission(site, {
  delta: true, encounter: { race, side, x, z }, doorId: 'crossing' })`
  with NO terminal: the config is the STICKY one (the last mode / team
  size / rounds the terminal filed, else Arena · 4 · the site's default),
  the party is THE LAST ROSTER (`loadLastParty`; none on file → the
  terminal opens as today, once), the CPU pool is the roamer's race first
  + the site's pool, `_hqPreselect.spawnSide` = the lane nearest the
  walker (the board's south half → P1 spawns south; the north half → the
  seats' lanes are mirrored, which `applyGameMode` must learn: today P1
  is always the south row), the roamer's team on the far lane. RULE #2:
  VS-CPU only (the tutorial's precedent — an online seat never encounters).
- **The seam.** [PARTLY SHIPPED — (1) and (2) are built (rev 24); (3) the dissolve is open: PHASE9_QUALITY_PLAN.md §8 item 7 / §11] Three cuts make it near-seamless without a new scene:
  **(1)** the intro cinematic is off for an encounter
  (`EW_DISABLE_INTRO_CINE`'s path, per launch — the teams are already
  here); **(2)** the battle's first camera pose is the WALKER's: the HQ
  camera's position / yaw / pitch converted to board space (one tile =
  1.75 m; the board's origin is `hqSiteBoardInfo(mapId)`'s corner) and
  handed to three-camera.js as an initial pose that eases to the default
  frame over ~1.2 s (three-camera.js has no initial-pose API — that is
  the one new entry point); **(3)** the site's setting and sky are the
  same builders at the same scale on both sides of the cut, so the walls,
  the trees, the ship stay put; the room's walkway, quay, console and
  natives are not in the battle — they DISSOLVE (the crossing's dissolve
  shader on the HQ scene for 0.6 s, then the swap). The loading card
  still shows for the model warm-up — the seam is an eased cut, not a
  hidden load.
- **After.** [SHIPPED as written but for the roamer — the beaten NATIVE is gone until tomorrow (`door.hq.cleared`); the return lands at the console, PHASE9_QUALITY_PLAN.md D1 proposes the swing spot] A win: back at the room's console as today, the roamer
  gone (`door.hq.cleared[roomId] = date`; the room repopulates tomorrow
  — the daily rule), the find it guarded (a `roamer` field on a find
  row: built only once the room is cleared today) now glows. A loss: the
  ward — EXITED lands you in Medical's cot with the CONDITION line
  updated (`hqMedicalRecord.exits` already counts it), the Padded Room's
  hook; no hazard pay lost (Part C row 30 — the user rules the cost).
- **Tests.** [SUPERSEDED — hq-encounter.test.js (17) tests the click rule, the launch, THE EYE, the cleared room; nothing about roamers or `spawnSide`] `hq-encounter.test.js`: no facility room carries roamers, a
  roamer's race is in the site's pool, the patrol stays inside the room,
  the launch opts serialize, `spawnSide` mirrors the lanes in
  `applyGameMode` (a vm run), the pose conversion round-trips.

**9.5 THE DOOR GUN — two doors you place.**
- **The object.** [SUPERSEDED by 9.5 REV 2 (§9 2026-09-15 rev 19): ANY surface — floor set, wall, ceiling — the door flat in the surface's plane; LEFT CLICK = THRESHOLD A, RIGHT CLICK = THRESHOLD B, F / Q holster; `leaf_coffee` in the facility] THE PORTABLE THRESHOLD, DOOR issue: two freestanding
  leaves (the CROSSING's `_introBuildDoor` on the HQ scene — the frame,
  the seal, the case line, the leaf being the map's own threshold leaf
  in a site room and `leaf_coffee` in the facility (rank leaves stay exclusive)) that you place on
  any WALKABLE SURFACE you can see: a raycast from the eye against the
  room's surface set (the floor, the board's cells and their tops, the
  quay, a gallery slab, a `riser`, a roof the room declares walkable —
  never a wall, never a fluid cell, never inside a blocker) → the door
  stands on `_hqSurface(x, z)` there, facing you. A ghost door follows
  the aim (green = legal, red = refused); LEFT CLICK places A, the next
  click places B, the third moves A (Portal's rule — the pair is always
  the last two); Q holsters (the ghost goes). Walk through A → out of B
  (the door-blink); same room = a teleport within the scene, another
  room = a room change landing at the other door (a door persists across
  rebuilds: `door.hq.portal = { a: { room, x, y, z, yaw, surfaceId }, b: {…} }`,
  rebuilt by `_hqBuildDoors` from the record; leaving the building keeps
  the pair, a fresh arrival from Play clears it — the escape rope is for
  one visit). Viewer-local, nothing on `state`, nothing relayed (RULE
  #2); the Door Agent's Knock Knock is the same object in a battle and
  stays the race's.
- **Reach.** "Seen but out of reach" = a walkable surface with no walk
  path: 9.2's galleries without a stair (`stairAt: null`), the site
  boards' +2 columns and pillar tops (the walker climbs +1 only), roofs
  (`shells[id].roofs = [{ x, z, w, d, y }]` — a declared walkable slab
  the surface set includes), the far side of a moat with no causeway,
  the other bank of a pit. A `hard` find sits on one of those. The test
  for `hard` (9.1) is exactly "no walk path, a door sees it".
- **The escape rope.** A door left in a SAFE room (the foyer, the hall,
  a lobby) is the way back from anywhere: place B in a wild room with a
  roamer closing and step through — the roamer does not follow (the
  encounter needs contact or E). A pair with one end in the facility and
  one in a site is the user's own use case; nothing special is needed
  beyond the cross-room landing.
- **Issue.** [SUPERSEDED — STANDARD ISSUE for the test (rev 15, `HQ_PORTAL_RULES.free: true`); `free: false, cost: 24, rank: 4` restores the Quartermaster's signature] Who has it and when is Part C row 31. REC: the Quartermaster
  ISSUES it (a counter on the shop's page: PORTABLE THRESHOLD · DOOR
  ISSUE · 24 Keys, one per officer, Keyholder rank — L2 is the door rank
  by name) and the first door is free at intake so the tutorial can
  teach it; alt: day one, both doors, no gate — the puzzles are the
  gate.
- **Renderer.** [SHIPPED under different names — `_hqPortalAim` / `_hqPortalBasis` / `_hqPortalBuild` / `_hqTickPortalCross` / `_hqPortalHop`; the record is `door.hq.portal`] `_hqPortal` (three-renderer.js): the two placed doors as
  `_introBuildDoor` groups on the HQ scene with a `_hqCamInDoorway`-style
  blocker each and an ENTER trigger (the door's own `onEnterDoor` path —
  walking into an open placed door fires the step-through, exactly the
  Door Agent's `doorStepThrough` rule on the board), the ghost, the
  raycast against a surface list the room builder publishes
  (`_hq.walkables`: every surface `_hqSurface` reads, as meshes or
  boxes). The leaf swings on approach like every room door; the seal
  buzzes on place (the DOOR sound kit).
- **Tests.** `hq-portal.test.js`: the record round-trips, the landing
  is a walkable surface, a fluid / wall / blocker hit is refused, a
  cross-room pair lands in the other room, the source sites.

**9.6 Assets (the user), in the order they pay off.**
1. The TAPES' clips — the hundred gifs / webms (9.1; every other part is
   procedural).
2. A VHS cassette, a potion bottle, a manila envelope (small GLBs — the
   procs stand in).
3. The mansion's interior kit: a staircase with a banister, a four-poster,
   a wardrobe, a trunk, a furnace, wine racks (the Meshy office kit has
   none of these; Phase 8's procs are boxes with the right silhouette).
4. The ship's below-decks: a hammock, a cannon on a truck (the rail
   cannon exists — `_hzMiscKit`), barrels, a chart table; the Spaceship's
   bridge chair and console (the crt_terminal proc stands in).
5. Slot machines, a chapel altar, a subway turnstile (9.2's urban block).
6. A hooded roamer? No — the roamers are the races' own rigged models.

**9.7 Decisions for the user (Part C rows 25–31).**
- **25 · the order.** REC 9.3 → 9.2 → 9.1 → 9.5 → 9.4 (above).
- **26 · the hundred.** Tapes (the hundred, carrying the user's clips)
  + twelve cubes as the story's collectible — or tapes only.
- **27 · the crowd.** Suites now (data) + the gallery later (renderer);
  which doors leave the hall (REC: the Interrogation Room, the Clock
  Room, the Trophy Case, the Bureau behind three suite doors).
- **28 · the seams.** Strike / add links in the 9.3 table; the one-way
  drop off Saturn; the NOT-A-DOOR seams (the wardrobe into Camelot, the
  mirror, the well, the pool, the painting, the hearth, the screen, the
  train — 9.3's `way` table).
- **29 · the complexes' order.** The Haunted House first (the user's
  example; the two-floor room) — then the Dutchman, the Spaceship, the
  urban block.
- **30 · the encounter's cost.** A loss = the ward and nothing else
  (REC), or hazard pay docked, or a day's leave (`profile.door.leave`).
- **31 · the door gun's issue.** The Quartermaster at Keyholder for 24
  Keys with the first door free, or both doors on day one.
- **32 · skateboarding (9.8, optional) — DECIDED by the user 2026-09-15
  rev 23: YES, NOW.** Stage 1 shipped: the deck is the user's own Meshy
  GLB (standard issue while `HQ_SKATE_RULES.free`, else the find in Room
  26), the reward is the trick line on the strip and the best line on the
  OFFICER sheet, nothing gates. Still open: a soundtrack slot, graffiti,
  the garage's `skate` variant (stage 2).
- **33 · the wells and the cave (9.3, 2026-09-15 rev 8).** The cave as
  Hollow Earth's complex (REC) or its own numbered site; the six wells
  (REC) or fewer; the exits beyond Hell / D.U.M.B. / Agartha / Hollow
  Earth; the oubliette's roamer waits on 9.4.
- **35 · encounters are never random (9.4, 2026-09-15 rev 16 — DECIDED
  by the user; rev 17 corrected the controls).** The officer initiates:
  LEFT CLICK with the door gun HOLSTERED is the attack, at a native in
  reach; with the gun drawn (F) the click places a door. The number keys
  are gone. Still open: whether a won room should stay quiet for the day.
- **34 · the Rooftop's twist (7.4 row R).** (a) the wrong sky (REC), (b)
  the painted floor plan with one real door, (c) the helipad is a board
  — or the user's own; and whether the elevator's unlabelled button or
  the penthouse's fire stair is the way up.
- **35 · Tartaria + the Bermuda Triangle (7.7).** Numbers (REC 1812 /
  345), bays (Ancient / Hollow), wave 2's order (REC the Triangle first —
  the `sea` kit is built; Tartaria wants the sinking bowl), the Bureau's
  Tartaria notice, the weir's re-point to the Triangle.
- **36 · water polo (9.9, super optional, after 9.8).** Yes / no / later;
  which sim port (REC the `waterpolo` repo's `src/sim` verbatim as one
  block in map.js — RULE #1 forbids a new game file); the pool's cut
  (the natatorium re-lined to 30 × 20 m, or a short-course 25 × 12.5 m
  with the rules scaled); 1P vs CPU only (REC) or a second seat later;
  any reward (REC the lifeguard's line and one achievement, nothing else).
- Also owed: the tapes' titles and captions (A15), the roamers' bark
  lines, the seams' door notes (Claude drafts every one as `draft: true`).


**9.8 OPTIONAL — SKATEBOARDING — STAGE 1 SHIPPED 2026-09-15 rev 23 (see §9;
the brief below stands as written; what differs: the ramps' launch is the
quarter pipe's coping and a rise taken at speed, the deck is the user's GLB,
the B key, the arrows are the trick keys, standard issue for the test).**
(the user, 2026-09-15 rev 5: "very
unnecessary but I feel like the game is really asking for it"; Tony
Hawk's American Wasteland / Jet Set Radio Future).** The rotunda's round
railings, the mezzanine's rail arcs, the containment rings, the ramp in
the garage, the natatorium's empty-lane blocks, the Strip's boulevard and
the Stadium's tiers are already a skate park with no board. This is a
walker MODE, not a game mode: nothing on `state`, nothing relayed, no
scoring that gates anything (a trick counter on the strip and a best-
combo line on the OFFICER page at most).
- **THE BOARD.** A prop you pick up (a `find` of kind `deck` in the
  locker room, Room 26 — or the Quartermaster's; Part C row 32) and a key
  to drop it (REC: **B**; the walker's keys are WASD · space · E · ESC · P
  · Q for the door gun). On the board the walker is a RIDER: momentum
  (`_hqRide`: velocity, friction time-based, equivalent to ~0.985 at 60 Hz, push = W on a cadence,
  brake = S, carve = A/D leaning into the camera yaw), the jump is an
  OLLIE (the existing `HQ_JUMP_V` with the board), landing squash, a
  bail (fall off > `HQ_DROP_MAX` × 1.5 or a wall at speed → the walker,
  the deck skids away and comes back to your feet in 2 s).
- **GRINDS + RAMPS.** The room builder publishes **`_hq.rails`** (every
  rail arc / straight it built: the mezzanine railing, the gallery rail,
  the pool's parapet, the quay's edge, the ship's bulwark, a catalogue
  prop with `rail: true`) and **`_hq.ramps`** (every sloped surface the
  walker already reads: the garage ramp, the stairs' pitch, the
  natatorium's blocks, the lecture hall's risers, a `quarter_pipe` proc).
  An ollie that lands within 0.35 m of a rail LOCKS to it (a grind: the
  rider slides the rail's polyline at speed with a spark ticker; balance
  is A/D against a drift; the ring's rail is a 130 m circle — the round
  railings ARE the point); a ramp lip at speed launches (the parabola off
  the lip's normal); air = a trick key (the arrow keys — kickflip /
  heelflip / 360 / grab, the clip library's `jump` with a roll on the
  board bone; the rider model needs no new animation for stage 1, a
  board under the feet and a spin is the trick). Combo = grinds and
  airs chained without a foot down; the strip shows the name and the
  multiplier in the Horologe's font.
- **THE PARK RULE (design, in force from now for every new room).** When
  authoring a room, ask what it gives a rider: at least one RAIL (a
  railing, a ledge, a kerb, a pew back, a pipe) and one RAMP (a stair, a
  slope, a bank, a quarter pipe) per big room; a line that loops (the
  rings, the garage, the boulevard) is worth more than a jump. Phase 9's
  complexes carry it from the start: the mansion's banister is a grind
  from the landing to the hall; the Dutchman's gun deck is a half-pipe
  between the gunwales; the Spaceship's deck plate has a lip; the Strip's
  boulevard has kerbs, planters and the chapel's steps; Downtown's subway
  has the platform edge and the stair. The site BOARDS already have the
  +1 steps (a ramp) and edge-wall slabs (a rail); a Δ author may mark a
  rail on a monument row later (a stage-2 ask).
- **JSRF / THW flavour (stage 2, all optional).** A SOUNDTRACK slot
  (audio.js: the ride's own bed while on the board — the user's track);
  GRAFFITI: a spray-tag `find` kind that marks a wall in the room's
  flavour (viewer-local decals); a `skate` VARIANT (5.1) of the garage
  after hours with the cars gone and the barrier up; the online shift
  seen riding in the cubicle floor (an `onlineSpots` pose `hqRide`).
- **Cost.** Stage 1 is `_hqRide` (the momentum walker), the rails /
  ramps registries (the builders already have the geometry), the deck
  prop and the B key, plus collision, lifecycle and input validation. Nothing else in Phase 9
  waits on it, and it changes nothing for anyone who never presses B.
  Kill-switch `EW_HQ_NO_SKATE`. `hq-skate.test.js`: the registries name
  real props, every new complex room has a rail and a ramp (the park
  rule as a test), the ride record stays off `state`.
- **Decisions (Part C row 32).** Yes / no / later; where the deck comes
  from; whether the ride has any reward at all (REC: a trick line on the
  OFFICER page and one achievement, nothing else).


**9.9 SUPER OPTIONAL — WATER POLO in the natatorium (the user, 2026-09-15
rev 8: "super optional after skateboarding … there is a water polo git
repo too, we can use stuff from that to add a water polo mini game in the
natatorium").** The natatorium (Room 50M, floor 3) is a six-lane lap
pool with starting blocks and the OTHER lifeguard; the user's
`dirtymondo-sudo/waterpolo` repository is a working Three.js water polo
game whose one rule is the same as ours: **the simulation is the source
of truth, rendering is a view of it** — `src/sim/` is headless, plain
serializable data, stepped at a fixed 60 Hz by `step(state, commands,
dt)` from an accumulator; input becomes command objects
(`src/input/commands.js`); the AI emits the SAME command shape as a
human. Milestones 0–3 are DONE there: a 30 × 20 m FINA pool
(`config/rules.js` POOL), 7v7 with a goalie, ball ballistics, passing,
three charge shots (normal / skip / lob), the goalie's save, goals + the
score + a 30 s shot clock, a referee state machine (swimOff → play → goal
→ … → periodEnd → fullTime, four periods of 120 s arcade), formation AI
(`sim/formations.js` slot tables), exclusion fouls + man-up, a steal, Tab
to switch, a gamepad map (Switch Pro by LABEL). ~1,500 lines of sim.
That is the mini game — the port is the SIM, never the render.
- **What comes over, and where (RULE #1: no new game file).** `src/sim/*`
  (step · world · movement · ball · ai · formations · rules/referee) +
  `config/rules.js` + `config/tunables.js` as ONE block in **map.js**
  (`// ===== WATER POLO (port of dirtymondo-sudo/waterpolo src/sim, <commit>)`
  — ESM `import`s become the block's own consts; `WP_TUNABLES`,
  `WP_POOL`, `wpStep(state, commands, dt)`, `wpNewMatch()`; nothing
  reads `three`), the port's commit hash in the banner so a later sync
  is a diff. The render side is NOT ported (r171 there, r128 here, its
  water shader and camera rig are its own): the natatorium's own
  builders draw the match — the pool the room already has, the players
  the HQ's rigs (the cast's `swim`-less library plays `idle` at the
  waist under `HQ_WADE_M`, the arms as the `push` / `reach` poses per
  command — stage 1 accepts bobbing torsos; a real swim clip is an asset
  ask), the ball a `_hqProcBuilders` sphere with a ticker reading the
  sim's ball, the goals two `_hqProc` cages on the end walls, the score
  + clock on the natatorium's clerestory as a `_hzTextTex` plane (the
  now-serving sign's recipe). The sim state lives in `_hq.wp`, never on
  `state` (RULE #2 has nothing to relay — VS CPU, viewer-local).
- **The pool.** The lap pool is lanes; water polo wants 30 × 20 m of
  open water. Two cuts (row 36): re-line the natatorium as a POLO POOL
  (a `variant` (5.1) `polo` — the lane ropes lifted, the blocks
  replaced by the goals, the OTHER lifeguard blowing the whistle; the
  room's floor plan grows to fit 30 × 20 + the deck) — REC; or play
  SHORT COURSE in the lanes as they are (25 × 12.5, `WP_POOL` scaled,
  the lane ropes the sidelines). Either way the sim's numbers are the
  repo's tunables, changed in that one object.
- **Controls = the walker's + the repo's.** You WALK to the pool edge
  and press E on the lifeguard's chair (the counter `whistle` →
  `overlay: 'polo'`: PLAY · the rules · STEP AWAY); in the water the
  walker is a SWIMMER (`_hqSwim` mode, like `_hqRide` for the board):
  WASD swim, SHIFT sprint (the repo's stamina), SPACE shoot / E skip /
  Q lob (hold to charge — the repo's three shots), F pass, TAB switch,
  ESC = the pause menu (the match pauses with the building). The camera
  is the walker's own third person pulled back (the repo's broadcast
  cam is not ported). Gamepad: the repo's `gamepad.js` is a pure poll
  that maps by Nintendo label — it can come over as-is into the same
  map.js block if the HQ ever reads a pad (it does not today; stage 2).
- **Stage 1 (one session).** The port + `wpStep` ticked from `_hqTickWorld`
  at the fixed rate, the polo variant of the natatorium, seven rigs a
  side from the anonymous-agent pool (the online shift's `onlineSpots`
  rule — real online players fill the far team's seats as bodies only,
  the CPU drives them), the ball, the goals, the board, one full match
  vs the CPU, the walker in and out of the water. `hq-waterpolo.test.js`:
  the ported block runs headlessly (the repo's `scripts/shot-test.mjs`
  idea — all three trajectories land, a match reaches fullTime under AI
  vs AI in the vm sandbox), the block's hash matches the named commit's
  `src/sim` (a drift guard, like the tutorial's), nothing on `state`.
- **Stage 2 (optional on optional).** A second human seat (the repo's
  `src/net/` intent: the command objects are wire-ready — an online
  friendly in the natatorium through the relay, host-authoritative like
  everything else, RULE #2), the gamepad, a swim clip, the repo's water
  shader as the natatorium's sheet (r128 port), an after-hours `polo`
  league on the cubicle floor's notice board.
- **Reward (REC, row 36).** The lifeguard's line and ONE achievement
  (a goal scored); no hazard pay, no economy hook. Kill-switch
  `EW_HQ_NO_POLO`. Nothing else in Phase 9 waits on it; it changes
  nothing for anyone who never gets in the water.
- **Sync rule.** The repo stays the SOURCE: tune the feel there
  (`src/config/tunables.js`), re-port the sim block, update the commit
  in the banner. Never fork the rules in map.js.
## 5. Assets

### 5.1 Reference images (commit to `docs/door-hq/ref/`, names in the README)
*Reality check 2026-09-04: the images live in `door_reference_images/` under
their raw filenames (`training_room_v1` = `ChatGPT Image Sep 3, 2026 at
02_08_16 AM (1).png`, `concept_board_v1` = `…02_08_48 AM.png`; `D.O.O.R.
Reality Door Rotunda.png` is a byte-identical duplicate of `…02_08_07 AM
(1).png`). Renaming to the names below is optional housekeeping.*
| File | What it shows | Drives |
|---|---|---|
| `central_egress_v1` | Two-tier round hall: mezzanine ring with five doors (green/amber/red lamps) and curved stairs both sides; ground ring with five more; a huge black cube with the DOOR square-spiral glyph hanging from the dome; round dispatch desk piled with CRTs and boxes; round tables, cabinets, globe lamps on pedestals; an agent in black at the desk. Cool speckled stone, oxblood dado, teal trim, terrazzo floor with inlaid rings. | shell proportions + palette (1.2), prop list (§5.3) |
| `office_doors_sheet_v1` | Six doors in curved-wall panels with a lamp above, silhouette for scale: peeling wooden closet door with vent · plain hollow-core · blue-grey wired-glass institutional · black security door with keypad · brushed-steel frosted · glass biometric threshold. | the six office leaves (2.3) |
| `training_room_v1` | Top-down 8×8 lit grid on cracked concrete, four scorch stars, red lamps, wall clocks, glass observation booths, corner machinery, green-lit doors top and bottom, two agents outside the grid. | 6.1 map, 4.3 backdrop |
| `janitor_closet_v1` | The L1 office: door ajar onto the curved hall, mop bucket and broom, sink, cleaning shelves, breaker panel, desk with beige CRT + phone + lamp, clipboards, locker with toilet paper on top, folding chair, round rug, floor drain, army cot. | 2.7 interior |
| `holo_sim_v1` (4 phone captures, `IMG_2998/2999/3004/3005.PNG`, added 2026-09-04) | A Tron-style battle floor: wireframe cells with glowing cyan/blue rims floating in a black starfield, red warning cells with a triangle glyph, yellow highlighted cells (in-game highlights), chromatic-split neon rings and dark speaker-cabinet monoliths behind, glitch scanlines. | 6.1c the Holo Sim board (`holo` / `holo_red` tiles, the `holosim` theme) |
| `concept_board_v1` | Labelled egress doors (SUBURBAN SECTOR 12 / OCEANIC / MEDIEVAL / ASTRAL / QUARANTINED), the top-down ring map (Reception/Intake, Quartermaster, Archives, Personnel, Medical, Central Egress, TO TRAINING FACILITY), the training room with signs (ORTHOGONAL GEOMETRY EXPOSURE AREA · MAX OCCUPANCY 45 MINUTES · REALITY LEAKS POSSIBLE), five door-state chips, the four-ring vertical diagram. | door-state vocabulary, ring plan, sign copy |

### 5.2 Export rules for every 3D asset (read this before modelling)
- **Format:** `.glb`, textures embedded, **Y up**, front facing **−Z**,
  **real-world metres** (a door leaf is ~0.9 × 2.1 m; a chair seat is 0.45 m
  high). Claude scales everything by one factor (73 units/m). Do not
  pre-scale to the game.
- **Pivot:** at the base, centred (the point that touches the floor). Door
  leaves: pivot on the hinge edge, at the base. Wall-mounted items (vents,
  clocks, cabinets against a wall): pivot at the back face, base.
- **Static props are boneless** — the `_generate` / `_texture` stage
  output that CLAUDE.md forbids for characters is exactly right here. Only
  NPCs get rigs.
- **Budgets:** small props ≤ 3k tris, furniture ≤ 6k, hero pieces (cube,
  dispatch wedge, machinery) ≤ 15k; one 1024² texture per prop (2048² only
  for the cube and the wedge); one material per prop where possible.
- **Emissive parts** (screens, lamp lenses, the cube's glyph lines) as a
  separate material named `emissive_*` so Claude can drive their colour.
- **Naming:** `hq_<thing>.glb` (props), `door_<type>.glb` (leaves),
  `tex_<surface>.png` (tileables). Upload to R2 `Assets/hq/`,
  `Assets/hq/doors/`, `Assets/hq/tex/`. New version = new filename.
- **Style:** match the references — worn institutional 1980s government,
  PS1/PS2 fidelity (chunky silhouettes read better than detail; the post
  grain hides the rest). No baked text on nameplates (blank plates; text
  is DOM).
- **Tileable textures:** 1024², seamless, albedo PNG (+ optional normal).
  Claude sets repeat per surface.

### 5.3 The asset list, in the order it pays off
**A. Tileable textures (8)** — the shell is procedural, these make it look
like the reference: `tex_stone_speckle` (hall walls), `tex_dado_oxblood`,
`tex_terrazzo` (floor), `tex_teal_metal` (trim, railings, door frames),
`tex_ceiling_panel`, `tex_concrete_cracked` (training room / bays),
`tex_drywall_beige` + `tex_carpet_office` (H-Wing, later). Until they
exist Claude uses `marble_light` / `gunmetal` / `drywall` / `carpet` from
the terrain set.

**B. Hero props (5)** — `hq_cube` (black basalt cube with the square-spiral
glyph on every face as `emissive_glyph`, ~4 m; hangs on a chain/rod — model
the rod), `hq_dispatch_wedge` (one 45° wedge of the round desk: counter
top, front panel, a CRT + keyboard + a box or two — repeated 8× makes the
desk; keep the seam edges clean), `hq_lamp_globe` (frosted sphere on a
stone pedestal, emissive sphere), `hq_table_round`, `hq_chair_office`
(teal), `hq_chair_folding`.

**C. Door leaves (12 first)** — the six office doors from the sheet:
`door_closet_wood`, `door_hollow_core`, `door_wired_glass`,
`door_security_keypad`, `door_steel_frosted`, `door_glass_biometric`; then
the institutional set for the egress: `door_double_institutional`,
`door_elevator` (closed pair), `door_bulkhead` (submarine, for Atlantis),
`door_portcullis` (Camelot), `door_suburban_closet` (Nuketown),
`door_exit_unknown` (Backrooms). More thresholds per map later (motel
door glowing, freestanding Moon door, Mars airlock, Heaven service gate,
Hell furnace hatch, CERN blast door, Area 51 hangar door, ranch gate,
redwood lodge door, stadium turnstile…) — Claude will keep the per-map
list in `DOOR_HQ.catalogue`.

**D. Dressing (≈18)** — `hq_cabinet_file` (2-drawer), `hq_shelf_boxes`
(unit with boxes), `hq_box_cardboard` (×2 sizes), `hq_crt_terminal`,
`hq_desk_lamp`, `hq_vent_grille`, `hq_wall_clock`, `hq_extinguisher`,
`hq_vending_machine` (the Mandela prop), `hq_water_cooler`,
`hq_plant_potted`, `hq_sign_wetfloor`, `hq_fluorescent_fixture`,
`hq_bench`, `hq_railing_segment` (1 m of rail with a post — instanced;
procedural fallback exists), `hq_stair_newel`, `hq_nameplate_blank`,
`hq_pipe_run` (1 m straight + 1 elbow).

**E. Closet (7)** — `hq_cot`, `hq_sink`, `hq_mop_bucket`, `hq_broom`,
`hq_locker`, `hq_breaker_panel`, `hq_rug_round` (a textured quad is fine).

**F. Training room (4)** — `hq_observation_window` (frame + glass),
`hq_machinery_corner` (×2 variants), `hq_grid_puck` (floor light emitter,
instanced), `hq_clock_large`.

**G. Characters (3)** — `door_agent_male`, `door_agent_female` (black suit,
tie, lanyard; rigged, via the CLAUDE.md character recipe so the shared
animation library retargets them), `door_janitor` (coveralls, the
Doorman-in-waiting). Optional: `door_handler` (or keep the redaction-bar
silhouette).
✅ **Superseded 2026-09-06:** the user made the whole CAST instead —
fifteen rigged Meshy characters in R2 `Assets/Sprites/Races/
maincharacters/` (sprites.js `DOOR_CAST_MODELS`, data.js `DOOR_CAST`,
§9). The generic agents in black stay as the MIB roster model. Still
wanted: a 128×128 `portrait.png` per cast member for the panels.

**H. Audio (2)** — hall room tone loop (HVAC hum, distant phones, the
occasional doorbell), DOOR muzak loop for the dispatch queue.

### 5.4 When each is needed
| Step | Needs | Without it |
|---|---|---|
| 1.x | nothing | placeholders (labelled boxes, terrain textures) |
| 2.1 | A | terrain textures stay |
| 2.2 | B | boxes stay |
| 2.3 | C (first six + double + elevator) | a generic procedural door |
| 2.4 | D | boxes |
| 2.5 | G | the fortune teller stands in |
| 2.6 | the six threshold leaves in C | generic door |
| 2.7 | E | boxes |
| 2.8 | H | synth room tone |
| 4.3 | nothing | — |
| 5.5 | A (drywall/carpet) | terrain textures |
| 6.1 | F (optional) | procedural |

---

### 5.5 Inventory as uploaded (2026-09-03) — what the kit actually contains
The user uploaded to R2 **`Assets/door/textures/`** and **`Assets/door/models/`**
(NOT the `Assets/hq/…` paths §5.2 asked for — the data now points at the real
paths; filenames are Meshy's own, kept verbatim in `DOOR_HQ.catalogue`, URL-
encoded at load because one contains a `°`). Against the §5.3 list:
- **A. Tileables — all 8** (`aged_acoustic_ceiling_panel`, `aged_beige_office_
  drywall`, `aged_cracked_concrete`, `aged_oxblood_plaster_wall`,
  `aged_teal_metal_trim`, `mid_century_terrazzo_floor`,
  `muted_taupe_office_carpet`, `seamless_speckled_hallway_stone`).
- **B. Hero props** — globe lamp ✓, round table ✓ (`A_round_office_desk`),
  teal / office / folding chairs ✓, coffee table + oval conference table +
  two curved couches (bonus). **No `hq_cube`** → the cube is procedural (a
  black box with a canvas-drawn square-spiral emissive glyph on a rod).
  **Desk wedges ×3** (`one_45°_wedge_of_a_reception_desk`, two
  `wedge_of_a_round_office_desk`) — measured 2026-09-03 from the GLBs the
  user committed to the repo root (a node script rendered top / front /
  iso views and fitted the sector edges; see §9): the "reception wedge"
  is really a corner reception counter (curved banded front, raised
  ledge, 1.0 × 0.67 × 0.87 model units); wedge A is a solid kidney
  workstation; wedge B is a true 45.3° annular sector (outer r 1.075,
  inner r 0.398, arc centre 1.087 × depth behind the bbox centre). The
  user prefers the procedural dispatch ring, so `desk.mode` stays
  `'procedural'` and the wedges are furniture (`ring: {n, start}` props
  repeat wedge B around a spot).
- **C. Door leaves — 18**: the six office doors (warped closet, hollow
  core, office door, security, frosted, futuristic = L1–L6, wired to
  `DOOR_TEXT.CLEARANCE[i].door`, EXCLUSIVE since 2026-09-04), plus exit,
  wired double, shabby wood, suburban ×2, vault, portcullis, revolving,
  bulkhead, plain closet ×2, bare frame (the shared pool).
  No elevator leaf → procedural brushed pair with an X brace.
- **D. Dressing** — filing cabinet, round cabinet, lockers ×2, boxes ×2,
  CRT terminal, tube TV, desk lamp, table lamp, wall clock, extinguisher,
  vending machine, water cooler, plants ×2, wet-floor sign, fluorescent
  fixture, breaker panel, pipe run, 1 m railing (unused — railings are
  procedural), blank nameplate, desk fan, papers/pens/keys. No vent grille,
  bench, newel.
- **E. Closet kit** — cot, sink, mop, mop bucket, lockers, breaker, two
  round rugs ✓ (interior itself is Phase 2.7).
- **F. Training room** — round observation window only.
- **G. Characters** — none yet; D.O.O.R. agents are the *men in black*
  race's rigged models (black suits already), the avatar is the profile's
  most-played rigged vessel (falls back to the male agent).
- **H. Audio** — none; the hall is silent except `doorBuzz` on entry.

### 5.6 Assets for the Room Register (2026-09-07) — what Claude generates, what exists, what the user makes
**Claude generates (no art needed):** every board (tiles from the 160
terrain keys, the 59 board objects, the 28 procedural monuments plus new
lathe/extrude ones — chess pieces, organ pipes, a Möbius bar counter, a
barber chair, a punch clock, a gas pump), every setting (the `_nr*` kit),
every room shell (the box / rotunda / bay builders), all plates and signs
(CSS2D + canvas: neon text, card faces, stained glass via `_nrWindowTex`,
the calendar, the star-map), the walkable-Δ builder (7.2), the dailies.
**Already on R2, reused as-is:** the 32 door leaves (7.6 / 7.7 name one
per site; the HQ rooms take `leaf_cell` for 5150, `leaf_hospital` for
1111, `leaf_revolving` for the Foyer, `leaf_glass_exec` for 4C, `leaf_saloon`
for 711 and Club 27, `leaf_stall` / `leaf_bathroom` for the club's restroom
gag, `leaf_holographic` for 4D, `leaf_vault` for the Lodge, `leaf_hotel` /
`leaf_motel` for 13 / 21); the office kit (62 catalogue props, 52 GLB + 10 procedural — tables, chairs,
lockers, CRTs, lamps, plants, the water cooler, the vending machine, the
round observation window); the 8 DOOR tileables (drywall + carpet dress
5150 / 1984 / 4C); the roster's rigged race models (about 79 of the 96 races; the rest are sprites) as site NPCs and props (the
honda civic at the Gas Station, a gargoyle posed as a statue on the
Haunted House, the greys aboard the Mothership); the misc OBJ/GLBs (the
`Pyramid` = the Luxor, the `eyeball` = the Lodge's lamp, the street lamp);
the 6 ambience beds (`ambNight` + `thunderAmbience` for 13, `ambDay` for
1954, `ambCavern` for 33 / 451, `ambWindHigh` for 6 / 0) and the 33 music
keys (Club 27's jukebox).
**The user makes (Meshy, §5.2 export rules) — only the ONE hero prop per
place that procedural geometry will not sell, in the order the places are
built:**
| Place | Hero prop (🧊) | Procedural fallback meanwhile |
|---|---|---|
| 13 Haunted House | a chandelier + a grandfather clock; optional: a wrought-iron gate | a lathe chandelier; the kit's wall clock |
| 33 The Lodge | the twin pillars with globes (Boaz / Jachin) + the lectern | `column_*` objects + a `tablet` |
| 21 The Strip | a slot machine (instanced ×8) + a roulette table | none — the wave-1 board is the boulevard, not the floor; these dress the DEEP CROSSING later |
| 1954 Downtown | a collapsed-building chunk + a crushed car | a tilted `K.box`; the honda civic model, upside down |
| 6 Saturn | nothing | — |
| E4 Looking-Glass | the KNIGHT (a horse head on a base, ~2 m) | the other five pieces are lathe / extrude |
| 0 Singularity | nothing | — |
| 1717 Pirate Bay | a ship's wheel + a cannon (instanced) + a treasure chest | cylinders |
| 80 Colosseum | a lion statue or a chariot | none needed |
| 711 Gas Station | two gas pumps + a price sign | boxes + a canvas sign |
| 411 National Park | a tent + a picnic table | `_nrHouse` at tent scale |
| 432 Cathedral | the organ console | pipes are cylinders; the console is a tanker desk |
| 86 Cafeterium | ✅ **DELIVERED 2026-09-10** (7.11): the coffee maker, both meal trays, the 1980s microwave, the cash register, two chairs, both fridges, the mug and the solo cup. Only the serving counter itself is still missing | the reception wedge is the counter |
| 247 Clock Room | a punch clock + a large wall calendar (canvas) | ✅ shipped procedural 2026-09-11: `world_clocks`, `punch_clock`, `form_sheet` — a user GLB replaces any of them by giving the catalogue entry a `file` |
| 360 Observatorium | the planetarium projector (the star ball) + a telescope | a lathe ball on a tripod |
| 1111 Medical | a gurney, an IV stand, a curtain rail | the cot; a pipe run |
| 5150 Padded Room | **`tex_padded_vinyl`** (the one new tileable) | `drywall_4` tinted |
| 1984 Interrogation | a metal table; an ashtray | the conference table; two folding chairs exist |
| 1287 Barbershop | a barber chair + a mirror | ✅ shipped procedural 2026-09-11: `barber_chair`, `barber_mirror` (vanity bulbs), `barber_pole` — a user GLB replaces any of them by giving the entry a `file` (the mirror cannot reflect: no environment map in the building) |
| 4C Corner Office | an executive desk + a leather chair | the tanker desk; the teal chair with the `leather` texture |
| 8 Infinity Pool | a lounger (instanced) | folding chairs |
| Fourier Foyer ✅ | nothing (the revolving door exists); a brass seal inlay would replace the `door_seal` canvas decal; a real coir mat the `doormat` proc | — |
**Audio the user could make (2.8 is still open):** a cafeteria clatter bed
(86), a slot-floor bed (21), a crowd murmur (80 / 1954 / 50), rain (13),
an organ drone (432), a lounge loop (Club 27), and the DOOR muzak everything
has been waiting for.
**Textures:** apart from `tex_padded_vinyl`, nothing — parquet (`wood`),
mosaic (`checkerboard`), casino carpet (`carpet_4`), pool tile
(`tilefloor_2`) and veined marble (`marble_2`) already exist in the
terrain set.

## 6. Guardrails (repeat every session)
- RULE #1: no new game .js files (§3.1 placement). `door-hq.test.js` is
  tooling and allowed.
- RULE #1b: any R2 .js/.css delivery ⇒ `?v=` bump + index.html in the same
  message. GLB/PNG assets cache-bust by filename.
- RULE #1c: no playtesting unless asked. `npm test`; `load-data.js` can
  evaluate `DOOR_HQ`; a node script can validate a GLB's JSON chunk
  (PLAYTEST_NOTES "Rigged 3D unit models") to check scale/pivot before
  wiring.
- RULE #2: the building never runs during a match; `state._hq*` is UI-only.
- Don't rename game words. The Shop is the Shop at the Quartermaster.
- The hub never uses the tile/voxel renderer or its shadow pass (§0).
- Every function keeps one physical home + the directory. A missing asset
  is a placeholder, never a missing interaction.
- Play → ranked stays ≤ 3 inputs (Play, skip loading, `Q`/dispatch).

## 7. What changed from rev 1 and why
Rev 1 proposed painted rooms first because it assumed a 2D-image asset
pipeline and over-read ROADMAP §4's battle-board draw-call numbers as an
engine limit. Both were wrong for this user: the assets are 3D, and the
draw-call problem belongs to the voxel board builder (per-tile meshes,
per-tile materials, no instancing), which the facility does not use. The
Guild Hub was the prototype; this plan is the building.

## 8. Open questions
- ~~D13: walk as your vessel or as a DOOR officer avatar?~~ Answered by the
  chair in Room 1287 (2026-09-11): the recruit by default, the officer's
  choice after.
- Should other online players appear in the egress (silhouettes at the
  desk from `#mmOnlineCount`)? Rec: yes, cheap.
- Does the Guild Hub (Mystery Dungeon) get re-dressed as a DOOR field
  office, or is the "condemned crossing" door explanation enough? Rec: the
  door + a memo for now.
- Hazard Pay wallet on the strip vs only at the Quartermaster. Rec: strip.

## 9. Build log (append per session)

### 2026-09-16 — 9.3 STAGE 3: THE WOODS (the forest on the cave grid) + THE DIRECTORY GUARD (local delivery, not uploaded)
The user's brief: "The Woods needs to be like the cave — a big forest area with different paths to the fairy
forest (→ Camelot), Bohemian Grove, a random staircase, Dead Man's Cave (a sewer with graffiti onto the
tunnel / subway), a cult ritual spot, Skinwalker Ranch, Mount Shasta; Shasta and Camelot as WEENIES on the
horizon; and the map / room directory must always be flagged for update when rooms are added." Shipped:
- **THE WOODS**, the Fairy Forest's complex (seven `site_prebuilt_fairy_forest_*` parts on the cave grid, OPEN
  under one sky — `hqWoodsShell`): THE CLEARING (the crossroads, seven doors), THE MOUNTAIN TRAIL (two tiers,
  the mountain's door up top), THE REDWOOD TRAIL, THE BACK PASTURE (the ranch's gate + the house's garden gate
  in one fence), THE STAIRCASE (four wooden risers to a landing and an EXIT door onto THE STAIRWELL),
  DEAD MAN'S CAVE (a crag, the storm drain, `graffiti_wall`, a barred grate onto THE TUNNEL — the subway's
  fourth station) and THE RITUAL GROUND (eight standing stones, the circle that is Room 333's).
- **THE TREE CELL** (`T` / `D` / `R` in HQ_CAVE_STD; a legend may raise one): a wall to the walker, the floor
  under it, rock (in the `forest` sheet) to the field's raster; planted by `_hqBuildCave` with the near kit's
  foliage. No stalactites under an open sky.
- **THE LINKS**: rev 7's three fence gates re-pointed onto the parts (`woods_haunted` / `woods_skinwalker` /
  `woods_grove`), `woods_shasta`, `woods_stair` (→ stairwell), `woods_sewer` (→ tunnel, route SUBWAY),
  `woods_ritual` (→ Room 333), `fairy_camelot` (a `pool` seam, both ends free on the north strips).
- **THE WEENIES**: `shell.sky.landmarks` → `_hqBuildLandmarks` / `_hqLandmarkBuilders.peak` (Shasta, NNW) and
  `.castle` (Camelot, SSE) — fixed on the horizon over the treeline, never drifting.
- **THE DIRECTORY GUARD** (hq-map.test.js): every room reachable and placed, every site / part / threshold on
  the map, the register and the world tab in agreement — or the test names the room. 7.10 grew row 7.
- Tapes: seven re-homed (the garden's `1618` and six sites' second tapes); a built site keeps ≥ 1.
Tests: `hq-woods.test.js` (9), the guard, eight pins updated (hq-cave / hq-finds / hq-field / hq-world /
hq-stage2 / hq-urban / doorhq). NOT BUILT: a `hard` board tape for the six one-tape sites, a variant beat for
the woods (D7), natives on the tiers, the Grove's owl as a third weenie (the user's call — see the chat's
weenie list), the tape titles' rewrite (A15). UNSEEN LIVE (RULE #1c): all of it — the trees' scale and count
(~150 clones in the clearing), the wedge ramps as trails, the wooden risers, the two landmarks' size and haze,
the graffiti, the pool seams, the tunnel's grate against the platform's furniture.

### 2026-09-16 — PHASE 9 QUALITY REVIEW: the brief reconciled against rev 63 (PHASE9_QUALITY_PLAN.md; docs only, nothing uploaded)
The user's Phase 9 quality brief (2026-09-15, written against rev 60) was read against the
code at HEAD and revs 61–63. `npm test`: 1438 pass / 0 fail / 4 skipped. Nothing in the game
files changed. Findings, each labelled confirmed / documented-unfinished / recommendation /
requires-playtest, with the status table, the backlog, the delivery sequence and the two
programmes the user asked for, are in **`PHASE9_QUALITY_PLAN.md`**. In one paragraph:
- CONFIRMED (ship before the finds go live): tape ids are POSITIONAL (`DOOR_TAPES` numbers
  by `siteRooms.built` + sheet order; claims are `tape:Tnnn` — every re-home since rev 18
  renumbered the shelf); hazard pay is a LOCAL credit the server wallet overwrites at the
  next `/api/progress/sync`, and `door.hq.*` never syncs; the strike toast says "THE ROOM IS
  THE BOARD" in a complex part / a cave where the launch is the SITE'S Δ and the eye seed is
  null. Also the plan's 9.7 numbers two decisions "35".
- OUTDATED IN THE BRIEF: THE EYE, the cleared room, the guarded envelope and the ward hook
  are built (rev 24); the gun is any-surface / two-button / two-colour and standard issue.
- RECOMMENDED: return the win to the swing spot; pin the native's identity as P2 seat 1; the
  refusal reason on the ghost + an A/B shape cue; a hatch-loop cap + hold-F ESCAPE; discovered
  routes drawn dotted (GO stays); one landmark / reveal per complex; six door-gun situations.
- THE LOOK (rooms ↔ boards): the room board is Phong + emissive through its own `siteMat`,
  the battle is Lambert through `K.mat` / `_evTintMat` with `TERRAIN_BASE_TINT`; the room's
  sun is an HQ constant, the battle's the env row; the room has no THE WORLD; the battle has
  none of the room's furniture. Four stages (§10).
- THE FIELD (anywhere becomes the 8×8): the grid is a WINDOW on the room's own lattice (the
  Δ at 1.7534 m, the cave at 1.75 m / half-levels, a box room in metres); in/out cells,
  heights clamped so walker-reachable ⇒ unit-reachable, props by `top`, the gallery as +2 with
  +1 treads, units SNAP to cell centres at the strike frame, explicit spawn cells per seat
  (which also unblocks `spawnSide`), the battle built at the room's transform behind a 0.6 s
  dissolve, the return to seat 1's last cell. Five stages A–E (§11); user decisions in §14.
This section's heading and superseded bullets are marked in place (never deleted).

### 2026-09-16 (rev 63) — THE THIRD RING ships + 7.7 WAVE 2 begins: 345 · THE BERMUDA TRIANGLE (data.js, three-renderer.js, map.js, server.js, index.html; hq-ring3.test.js, doorhq / hq-suites / hq-cave / hq-stage2 / hq-world / motion-maps / delta-maps tests; local, not uploaded)
Baseline: the rev 62 tree (the urban block, the visual pass, the mixer).
The user: "continue with the DOOR HQ build plan — the third rotunda ring
and the start of the stage 2 sites." Two things, one delivery.

**THE THIRD RING (8.4, and 9.3's "the crowding" (b)).** The hall knows
three levels now. Data: `central_egress.shell.ring3 = { h: 3.3, inner:
20.6, outer: 24, thick: 0.35, railH: 1.05, stair: { id: 'stair_g', from:
278, to: 312, rIn: 22.6, steps: 20 } }` — the same radii as the
mezzanine (it overhangs the hall the same way), 3.3 m up (the upper drum
grew 5.4 → 6.6 so the ring keeps 3.3 m of wall over it and the cone
starts above the doors; the cube's rod recomputes), ONE curved flight off
the mezzanine's walkway between Bay 6 (270°) and the old executive door
(315°): its band 22.6 → the drum, so the walkway passes beside it at
r 20.9–22.35, and its mass stands on the mezzanine — nothing else may
stand in that arc on level 1 (the plant at 300°, the box at 309° and the
round picture at 281° moved to 265° / 258° / 247°; doorhq.test.js's
door-spacing and prop-band tests know the flight now). The four
EXPLORATION doors wear `level: 2` — Arcane Engineering (90°), IT (120°),
the Observatorium (240°), the Executive Suite (315°, the Bureau's gate
still on the Bureau's own door inside) — and the mezzanine keeps the five
bays and the elevator (hq-suites.test.js: 11 / 6 / 4). Four globe lamps,
two plants, two frames and an extinguisher stand on the ring; THE GALLERY
WATCH (an agent at 318°) has a line (Claude's draft, A15). The car has no
gallery stop — the flight is the way (like H-Wing).

Renderer: three helpers every rotunda level reader goes through —
`_hqLevelY(S, level)` (0 / wallH / wallH + ring3.h), `_hqLevelR(S,
level)` (the lower drum, or the upper drum for both upper levels) and
`_hqLevelOf(S, y)`; `_hqWallR`, `_hqBuildDoors`, `_hqBuildCounters`,
`_hqPlaceProps`, `_hqSpawnCharacter`, `_hqGoTo`'s counter spot, the
teleport, the debug readout and the portal record all read them (the
test insists no bare `level ? S.wallH` survives). The ring is a LAYER of
`_hqSurface`'s rotunda branch read FIRST (`_hqRing3At(x, z, curY)`: a
tread of the flight (from either level — the same tread rule as the
ground flights), the slab for a walker already up there (`curY > wallH +
h/2` — a free query is never the ring's, the mezzanine's the floor's), the
rail band from the slab side, undefined over the void so the floor below
decides and the 7.5 m drop is refused), a mass in the air
(`_hqRing3Air`: the slab, the rail, the flight) and a wall to the boom
(`_hqRing3Cam`: under the slab from below, at the rail from above, the
flight). `_hqBuildRing3` (called at the end of `_hqBuildShell`): the
slab as two sectors — the full band off the flight's arc and the STRIP
inside the flight's band over it — with undersides, the fascia, the inner
rail full round (posts + two arcs; the flight arrives inside the band, so
no gap), the strip's own rail on its edge over the treads, the flight
(instanced treads from wallH to the slab, the sloped inner rail); the
ring's rail joins `_hq.rails` (SKATEBOARDING 9.8). `_hqCeilY` at level 1
is the slab's underside now (a ceiling prop on the mezzanine hangs from
it). Four point lights under the cone over the walkway. map.js: the
directory reads THE GALLERY · for level 2. Key: it is `shell.ring3`, not
`shell.gallery` — the box room's two-floor slab owns that key and
`_hqEnter` frames it (`_hqGalleryFrame` refuses a rotunda, but the
gallery test's "any other must be a box room" would not).

`hq-ring3.test.js` (7 tests): the sheet (radii, headroom over and under,
a tread is a step, the flight clear of every level-1 door and prop, the
four doors up, the bays and the elevator down), the helpers, THE CLIMB (a
walker on the mezzanine walks into the flight, climbs every tread by the
step rule alone, walks the ring all the way round at the doors' landing
radius and stands on every exploration door's landing), the walls, the
air and the boom, the builder on a stub scene (4 sectors, the fascia, 4
rail arcs, the treads + posts instanced, the sloped rail, the grind
register), the source sites.

**345 · THE BERMUDA TRIANGLE (7.7 wave 2, the plan's REC first — the
`sea` kit was built).** The 7.10 checklist end to end. THE BOARD: "it's a
right triangle" — and it is, twice: the board is TWO right triangles of
shoal (`desert`) meeting at a diagonal of `deep_water` from the
north-east corner to the south-west (each shoal's hypotenuse; the legs
the board's edges; the 90° corners at the north-west (P2's) and the
south-east (P1's), a lantern buoy (the floor torch) on each) — the deep
runs the whole diagonal but for a two-tile SANDBAR at the centre, the one
crossing a ground unit has; flyers cross anywhere. The Δ (8×8, seed 8420)
puts the sandbar on the nexus tiles (3,4) / (4,3) — exactly the two
node-disjoint routes the forge insists on — with the wreck (a `wood` hull
two high, its deck one), a rock, two tide pools (`water`, waded) a side;
delta-maps.test.js passes it (cover 2/4/10, 39 boards now). The full map
(16×16, seed 345): the wreck, rocks, sandbars (`dirt_2` +1), tide pools,
lanterns down the legs, `spawnEdges('s', 6)` — both spawn rows fall on
their own shoal. Bed: the sea under rock under sand. META: Hollow bay,
biomes deep_sea + tropical, tier 2, `near: 'bermuda'`, `env.world
{ plain, sea: true, root: false }`, `scenery: 'sea'` (the Dutchman's
roster — the wreck, the kraken, the shark, the palm isle, the lighthouse),
`motion { sea, speed 2.5, ramp 0.2, max 3.5, storm 3 → 10, ambience
ambWindHigh }` — half the Dutchman's pace (motion-maps.test.js's rev 3
pace rule is the three travellers' only; the Triangle is a mover, not a
traveller). SITE FILE (B2 voice, deny / NO FIXED POSITION), THRESHOLD
`{ roomNo: '345', leaf: 'leaf_white_wood' }` (the yacht's cabin door;
"3-4-5"), the hollow sector's eighth map (the ring layout relaxes),
`siteRooms.built`, the shell on the Dutchman's moat recipe in daylight
(`desert` quay, `rocks_1` bank, the sea `deep_water`, sign palettes),
`near.bermuda { w: 1.6 }`, the flavour (agent + five lines, Claude's
drafts), two TAPES re-homed from the sacrifice room and Room X (the
hundred stays a hundred), server.js MAP_POOL ×2 (check-data-parity #6).
`_NR_BUILDERS.bermuda` (three-renderer.js, before the MOVING MAPS
block): the shoal = a full-depth sand apron on a rock skirt, the streaming
sea (`_nrMoat({ stream: true })` + THE WORLD's `sea: true`), the
LIGHTHOUSE (`_hzLighthouse`, scaled to the build's tile — it sizes itself
off CONFIG.tileSize) on its rock off the north-west corner, the lantern
BUOY (a red can on the swell, a lamp on its mast, pulsing) off the
south-east with the ∠ 90° · NO FIXED POSITION plate on a post, rocks in
the shallows, two faint streaks of current; in the site room (K.hq) the
lighthouse and the buoy stand on the quay's corners and nothing else.
THE WEIR (9.3, the plan's REC re-point of Room 8's weir from Atlantis to
the Triangle): `links.weir_bermuda` on THE DEEP, a `pool` way at both
ends — free on Room 8's west parapet corner (x −4.2, z −3.4, facing
south; the west loungers, umbrella, table and cup moved 0.8 m south and
the wet-floor sign to (−2.2, 2.2) so the landing is clear — a displaced
prop MOVES) and free on the Triangle's north strip (x −7.5, z −11,
facing east, off the console's lane) — hq-world.test.js lands both ends
in the production renderer and the Triangle is a station on THE DEEP
(the Dutchman ⇄ Atlantis line). Tests repinned: hq-world's seam list,
motion-maps' movers list, doorhq's "one door" count in Room 8 (a link
appends), delta-maps' 39.

NOT BUILT (named in 7.7's row): the WATERSPOUT (a walking `storm` 2×2 is
engine work — a Δ rule like the Cube's), Flight 19 as a FLYOVER craft
(`getDescentFlyover` wants a spell to ride), the site room's quay as a
YACHT (the recipe is the Dutchman's hull under `!HQ`; today the quay is
sand), the HUD compass. Next in 7.7 (the plan's order): Tartaria (the
sinking bowl — Hell's `rise` with `dir: −1`, the ley line, the Bureau's
retcon notice), then the Tesseract "before 222".

UNSEEN LIVE (RULE #1c): the ring's fascia and rail against the upper
drum's stone, the flight's treads on the mezzanine, the boom under the
slab, the plates at 7.5 m from the floor, the four lamps; the Triangle's
shoal against the streaming sea, the lighthouse's scale, the buoy on the
swell, the deep hypotenuse's colour against the tide pools, the way's
basin on Room 8's parapet. `npm test`: 1438 pass, 0 fail.

### 2026-09-16 — 9.2 stage 4: THE URBAN BLOCK ships — the Strip's chapel and casino floor, Downtown's tower lobby and platform (data.js, three-renderer.js, index.html; hq-urban.test.js, hq-world.test.js, doorhq.test.js; local, not uploaded)
Baseline: the rev 24 tree (the encounter's stage 2) plus the visual pass
of 2026-09-16. The user: "continue with the DOOR HQ build plan" — every
Phase 9 stage 1 and 2 had shipped; the plan's own complexes table
(9.2, "the first four complexes") had one row left: the urban block.
- **THE STRIP (Room 21).** Its generated board room stays THE BOULEVARD.
  `siteRooms.backDoors.prebuilt_strip` = THE CHAPEL's motel door
  (`leaf_motel`, the site's own leaf) on the north wall at x −0.2 — the
  Strip's ONE free north lane (the highway's doors hold −5 and −10; the
  lane rule is ≥ 4.4 m and clear of the x 5 signboard, and −0.2 is the
  lane the stadium's door already uses on Downtown). `site_prebuilt_strip_
  chapel` (10 × 14 m): the altar against the north wall on a `riser_1`
  dais behind a four-rail altar rail (THE PARK RULE's rail + ramp), six
  `park_bench` pews facing it, the lectern with the register open at
  your surname, a till with the licences, the DRIVE-THROUGH WINDOW
  (`false_window` on the west wall), the King (`chosen one`) officiating
  with a `say` line, a politician marrying again; lit by six candle
  rings. Its east wall's saloon door opens onto `site_prebuilt_strip_
  casino` (18 × 14 m): eight `slot_machine`s in two banks, two blackjack
  `round_desk`s with chairs, THE CAGE (a steel table + register behind a
  three-rail run), the `mobius_bar`, a `riser_2` stage with the act's
  speakers, three `security_camera`s (THE EYE IN THE SKY), an ATM, and
  ONE door — no clock, no window (the test insists); lit by the machines
  (their catalogue `light`, eight ≤ HQ_PROP_LIGHT_MAX). Natives: the
  dealer (a politician — the site's own line), a conspiracy theorist at
  the machines, a gangster as the pit boss; one `onlineSpots` seat at the
  slots.
- **DOWNTOWN (Room 1954).** Its board room stays THE INTERSECTION. Its
  north wall carries THREE link doors (nuketown / strip / stadium at −5 /
  −10 / −0.2 — the lane rule's full ration in a 26.65 m room), so THE
  TOWER's lobby door (`leaf_entrance`, the site's own leaf) is the first
  back door on an EAST wall (z 0): the collapsed tower stands across the
  intersection. `site_prebuilt_downtown_lobby` (14 × 12 m): the front
  desk (a round desk with the phone that rings for the evacuation, the
  1954 sign-in sheet, the receptionist's empty chair), the waiting area
  (the curved couch, the coffee table, the 1954 magazines), two of the
  four `concrete_pillar`s, THE CORDON (`warning_tape` + three rails)
  before the `riser_1` that is the foot of the stair that is not there,
  the rubble boxed by Facilities, THE LOBBY CLOCK at 1954, the tubes and
  bulbs that survived; a superhero who held it up for a year, a zombie
  waiting for the receptionist. Its north door (`leaf_frame_only`, the
  stair mouth) goes down to `site_prebuilt_downtown_subway` (8 × 30 m,
  the tunnel's proportions): `track_bed` + `platform_edge` on the west,
  three `turnstile` gates at the foot of the stair, the departures board,
  the map, benches, the platform clock that agrees with the lobby's, the
  rails and step at the north end (THE PARK RULE).
- **THE SUBWAY's third station.** `DOOR_HQ.links.subway_downtown`
  (`route: 'subway'`, `way: 'train'`): end `a` is the platform PART
  (`{ site: 'prebuilt_downtown', part: 'subway', wall: 'free', x: −1.5,
  z: 3, face: 90 }` — the spaceship's rule, a link end on a complex part;
  the train's body (front car + cart, local x −9..15.4 = room z 12..−12.4)
  stands over the track bed inside the 30 m room and ARRIVES from the
  north end); end `b` is Cyberpunk's north wall at x −0.2 wearing
  **`leaf: 'leaf_frame_only'`** — the first `way` link whose far end is a
  PLAIN DOOR BACK (`hqLinkEndWear`: an end that names a leaf takes a
  door, never the object). Why not a second train: Cyberpunk's train
  stands at −10 as a wall end (the front car alone, x −9..3 from the
  mark); a second at −0.2 would run through the Strip's door at −5, and
  −14.5 is outside a 25 m room; Downtown's own north wall is full.
  `hqWorldRoutes` chains the line tunnel — Cyberpunk — Downtown (Downtown
  an interchange with the highway). The Cyberpunk-end door wears `verb:
  'GO DOWN'` and its plate reads 1954; the train's plate reads 2047.
- **Two procs (three-renderer.js, appended to the Phase 8 stage 2 block).**
  `slot_machine`: a cabinet on a plinth, a lit top box (THE HOUSE · ROOM
  21 · PAYS 3:2), three reels behind glass that spin every 5.5–8.5 s and
  stop one by one on a ticker, a lever, a coin tray; catalogue `light` +
  `glow`, `rect` + `block`. `turnstile`: two posts, a tripod on a hub
  that turns a third when the walker stands within 0.9 m and eases home
  (a ticker reading `_hq.player`). Both stand in for the user's GLBs
  (plan 9.6 #5 — a slot machine, a chapel altar, a turnstile).
- **The tapes.** One per part (the 9.1 rule): the garage, the kitchen,
  the cold room and the dungeon gave theirs (I DO · THE HOUSE · THE LOBBY
  CLOCK · THE LAST TRAIN, drafts, A15) — the hundred stays a hundred;
  three floor rooms still carry a bonus tape (the sacrifice room, Room X,
  the garden). `DOOR_HQ.findSpots.site_prebuilt_downtown_subway` pins the
  platform's tape + envelope onto the PLATFORM: the generator's far
  corner from the stair is the north end of the track, and a `way`'s
  blockers are laid at build, invisible to `hqFindFree`.
- **Tests.** `hq-urban.test.js` (6): the sheets (site + part, no number,
  each site listed once, WILD), both back doors (lanes, the site's leaf,
  the pair, the production landing clear of the console, the masts and
  every prop / native — and the assertion that Downtown's north wall IS
  full), the subway link (both ends, the wear, the train inside the room
  and off every prop, the chain, the interchange), reversibility +
  connectivity (the casino's one door, the platform's one stair), the
  production landing on every door in every part, THE PARK RULE + the
  light + the two procs + the tapes + the pins + the source rows.
  hq-world.test.js: the SEAMS list names `subway_downtown`; the seam
  test accepts a plain-door far end (the rule the plan states — "the
  same object at the far end, or a plain door back"). doorhq.test.js: a
  `slot_machine` counts as a room's light. Full suite 1,431 pass / 0
  fail / 4 pre-existing skips.
- **Not built.** The Strip's second chapel and the casino's upper
  floor; Downtown's department store (the board's own building) as a
  part; a subway car that carries you (the train is the way — a room
  change with the arrival beat); CERN's platform (no free north lane);
  the chapel altar / slot machine / turnstile GLBs (procs stand in).
- **Unseen live (RULE #1c).** The machines' reels and the top-box glow
  under the casino's carpet light, the tripod's turn as the walker comes
  up, the train's arrival along a 30 m platform (the tunnel's is 36), the
  motel door on the boulevard's north wall beside the highway's two, the
  lobby door on Downtown's east wall against the setting's buildings
  (`_hqBuildSetting` clears a lane for every room door — the first east
  lane on a site room), the frame-only stair mouth on Cyberpunk's wet
  street.

### 2026-09-15 (rev 24) — 9.4 THE ENCOUNTER stage 2: THE EYE, THE CLEARED ROOM, THE GUARDED ENVELOPE, THE WARD'S CHART (three-camera.js, three-renderer.js, data.js, battle.js, map.js, index.html; hq-encounter.test.js; local, not uploaded)
Baseline: the rev 23 tree (skateboarding + the control correction). The
user: "continue with the DOOR HQ build plan" — every Phase 9 stage 1 had
shipped; the plan's own next line was 9.4's seam.
- **THE EYE (seam 2).** three-camera.js grows ONE entry point,
  `ThreeCamera.seedPose(seed, easeS)` (+ `seedState()` for probes): a
  pending pose in TILE units — `{ tx, tz }` the eye over the board, `up`
  tiles above the ground under that column (read through the camera's own
  `_groundYWorld`, so `_camGroundPx`'s edge clamp applies), the gaze as a
  unit vector, `look` tiles ahead. The next `sync()` (either branch — the
  orbit rig and Strike Mode's eye) starts the SMOOTHED state there instead
  of snapping to the ideal frame, renders that frame as the seed itself,
  then damps home with a slow time constant (easeS / 3) until the window
  ends; `snapImmediate()` is IGNORED inside the window (a match start
  snaps the camera home — the seed must survive it; a probe proved the
  cut-free ease in a vm: monotone toward home, within a tenth of a tile
  after ~1.6 s). The renderer's `onEncounter` payload carries `eye`
  (`_hqEncounterEye`: the HQ camera's position + gaze in room metres and
  the ground under the eye's column, the walker's feet when the eye hangs
  in a wall) and `board` (`_hqEncounterBoard`: `{ N, C, half }` — null in
  a cave or a complex part); data.js **`hqEncounterEye(ev)`** (pure) turns
  them into the seed (clamped two tiles past the rim, never under the
  ground, a zero gaze looks north-down); map.js files it on the run marker
  (`eye`; the walker's raw pose moved to `walker`); battle.js
  `showVSSplash` seeds it and returns before the card — an encounter has
  NO VS card now (the teams are already here) — a room with no board
  seeds nothing and opens on the match's own frame.
- **THE CLEARED ROOM.** `hqEncounterRecord` files a WIN under the room:
  `door.hq.cleared[roomId] = { date, ids }` (the native's spawn id —
  `hq-native-<spot>` / `hq-npc-<draw>` — rides the run marker as `id`
  and the commit hands it on); `hqEncounterCleared(profile, roomId, now)`
  answers today's clearing or null (yesterday's lapses — the daily rule).
  `_hqSpawnPopulation` leaves those ids out: the native you beat is gone
  until tomorrow, the room repopulates on its own.
- **THE GUARDED ENVELOPE.** `hqRoomGuarded(roomId)` = a wild room with a
  race-hinted `npcSpots` row (the site's own natives; a roster draw is a
  passer-by, never a guard) — 51 rooms today. `hqBuildFinds` marks their
  pay row `guard: true`; `hqFindsInRoom` hides a guarded row until the
  room is cleared today, so the envelope GLOWS after the win (a room is
  rebuilt on the return). REC: the user strikes `guard` with one line if
  the pay should stand regardless.
- **THE WARD'S CHART.** `hqMedicalRecord` reads the encounter log: exited
  from a wild room TODAY → CONDITION `RECOVERING` (tone unstable, the site
  and the native in the note; `exited` on the record); leave still
  outranks it; a win or an old exit leaves the chart as it was.
- **NOT BUILT, and why.** The `spawnSide` mirror: map.js's spawn zones
  (`state.spawnZones[1].push({ x: col, y: p1Row })`) and the Arena's
  `spawn1` / `spawn2` nexus points are keyed by SEAT + ROW, never by
  `SPAWNS` — swapping the lanes would seat P1 on P2's spawn nexus (the
  lockout, the home-team perks, the respawn zones all misread). The
  mirror needs the zone system mirrored with it: a later stage, if the
  user wants it. Seam (3) the dissolve stays open (the loading card is the
  cut today).
- **Tests.** hq-encounter.test.js +6: the eye conversion, the camera seed
  in a vm (the seeded frame, the ignored snap, the monotone ease, a snap
  past the window), the cleared record, the guarded envelope on the real
  finds + a live day, the ward's chart, and the source sites (both sync
  branches, the battle's card skip, the renderer's payload + population,
  the run marker, and the zone-row line that pins the spawnSide reason).
- **Unseen live (RULE #1c).** The eased move from the walker's boom to
  the match frame (the seed is the third-person eye, not the walker's
  head — a boom pulled in by a wall seeds close), the first frame's fog
  over the board, the cleared room's emptier walkway, the envelope after
  a win.

### 2026-09-15 — Skateboard direction, steering and camera correction (local, not uploaded)

The first push now converts camera forward `(sin(yaw), -cos(yaw))` to the
rider's +Z-front heading. A/D carve left/right in the direction of travel.
Carves and rail bends turn the camera by the opposite yaw delta, preserving
manual mouse-look offset and leaving airborne trick spins independent of the
camera. Heading wrap uses the shortest angle. Grinds update the visible rider
position and facing before returning from the movement tick.

Changed runtime files: `three-renderer.js` (R2), `index.html` (Render), shared
cache token `20260915-skate-controls-02-cors`. No battle state or relay change;
skateboarding remains local HQ movement for each player. Regression checks in
`hq-skate.test.js` cover six view angles, both steering directions, camera
tracking, manual look offset, angle wrap, airborne spins and curved-rail pose.
The quarter-pipe fixture now uses camera yaw PI for +Z, matching the camera.
No browser playtest was run; visual feel remains to be checked in game.


### 2026-09-15 (rev 23) — 9.8 SKATEBOARDING STAGE 1 SHIPS: the rider, the grinds, the ramps, the tricks, the line (three-renderer.js, data.js, map.js, audio.js, styles-base.css, index.html; hq-skate.test.js, hq-finds.test.js, MODEL_INDEX.md; local, not uploaded)
Baseline: the rev 22 tree as synced to the repo, plus the user's skateboard
GLB (`Meshy_AI_a_skateboard_0915212313_texture.glb`, the repo root and R2
`Assets/misc/`). The user: "start on skateboarding … move fast, ollie,
grind, kickflip, and make the character do flips and rolls and stuff in
the air. Very arcade skating game like, number/score counter for tricks."
Part C row 32 is DECIDED by that: yes, now; the deck is the user's model;
the reward is a trick line on the strip, the best line on the OFFICER
sheet, nothing that gates anything.
**What shipped.** A walker MODE, exactly as 9.8 said: nothing on `state`,
nothing relayed (hq-skate.test.js reads the block for `state.` and
online.js for the word). **B** drops the deck / picks it up (the arrows
became their own keys — the walker still reads them as WASD, the rider
reads them as tricks; B sits before V in the walker's key line so the
door gun's and P's test pins hold). On the board (`_hq.ride`, the block
"SKATEBOARDING — THE RIDER" before the per-frame section): MOMENTUM — a
speed along a heading, W pushes on a 0.42 s cadence (+3 m/s, the first
push goes where the camera looks), S brakes, A / D carve (the turn scales
with speed), friction 0.99 per 60 Hz frame applied time-based (a long
coast; the pushes settle near the 12.5 m/s cap); the mouse keeps the
camera. THE OLLIE = SPACE at the walker's own jump speed. GRINDS: an
ollie that comes down within 0.6 m of a rail's line with the feet in the
band LOCKS to it — the rider slides the rail's polyline or arc at speed
(`_hqRailAt` / `_hqRailNearest` — one geometry for a straight run and an
arc), A / D balance against a random drift, the end of the run hops off,
SPACE ollies off, sparks under the trucks; the line names the rail (RING
GRIND on the mezzanine's arcs, BANISTER GRIND on a gallery, ROPE GRIND on
a cave bridge, 50-50 GRIND on a railing). RAMPS: THE QUARTER PIPE is a
new proc + catalogue row (`ramp: { w, len, h, prof: 'qp' }`) whose curve
is a REAL SURFACE the walker reads (`_hqRampSurfaceAt`, a layer of
`_hqSurface` after the gallery's; `_hqAirOK` treats its mass as solid) —
ridden at speed the rider climbs it and LAUNCHES off the coping with the
roll turned upward; the flat registers (the cave's wedges, the gallery
flight, the risers — `riser_*` carry `ramp` now) turn a rise taken at
speed into a hop when the ground runs out. TRICKS in the air: ←
KICKFLIP · → HEELFLIP · ↑ FRONT FLIP · ↓ BACKFLIP · W CORKSCREW · A / D
a 180 each (they stack: 360, 540 — an odd count lands FAKIE, the stance
turned, the roll going on) · SHIFT held = INDY GRAB. Every trick is a
rotation on the rider's own model (order YXZ, about a pivot at its
centre — `_hqRidePose`) and the deck; no new clip (the library's `jump`
in the air, a `run` stride on the push, `idle` as the stance). THE
COMBO: grinds and airs chained without a clean landing, pts × the number
of tricks, shown live on THE TRICK LINE (`#hqTrick`, top centre, the
Horologe's Cormorant) and BANKED on the landing — map.js files it on the
profile in ONE transaction (`hqSkateBank`: the best line with its words
and its day, the total, the count; a bail counts). THE BAIL: a trick
still turning when the ground comes up, a spin landed off-axis, a wall
at speed (progress along the heading — a head-on stop or bail, a
glancing wall scrubs speed), a rail lost, a walk-off fall past
HQ_DROP_MAX × 1.5: the line is lost, the body tumbles once, the deck is
away for two seconds. THE PARK RULE's REGISTERS: `_hq.rails` /
`_hq.ramps` start empty on every entry and every builder pushes — the
mezzanine's rail arcs (new), the gallery's banister and flight, the
cave's rope bridges and wedges (already there), and the prop placer
registers any catalogue row with `rail` (`railing_1m`, h 0.98 — every
room that met the park rule with a railing is grindable by construction)
or `ramp`, at both its sites. THE HALF-PIPE: two quarter pipes facing
each other down the east side of Room P1 (THE GARAGE). THE DECK: the
user's GLB, loaded once per visit as a child of the walker's group,
fitted by span to 0.84 m and pre-turned to the rider's +Z, over a
stand-in that hides when the file lands (MODEL_INDEX §3d). THE ISSUE:
data.js `HQ_SKATE_RULES` is the ONE table (`free: true` = STANDARD ISSUE
for the test, the door gun's precedent; `free: false` puts THE DECK back
in Room 26 as a find of kind `deck` leaning on a locker, filed by
`hqCollectFind` as `door.hq.skate.deck`); `hqSkateStatus` is the ONE
read (the strip's pill `#hqSkate` — click = B — the OFFICER sheet's THE
BOARD row, the renderer's `opts.skate.issued`). Sounds: six audio.js
recipes (push · ollie · land · grind · bail · bank). Dev: `?skate` /
`window.EW_HQ_SKATE` = issued, `window.EW_HQ_NO_SKATE` = off; API
`hq.skate(on) / skating() / skateIssued(on) / ride() / rails() / ramps()`.
**Tests.** hq-skate.test.js (8): the table (and the renderer's default
carries the same keys), the record + the deck find, the rail and ramp
geometry, THE RIDE ITSELF in a vm sandbox on a flat floor — a push rolls
where the camera looks, friction, the brake, the carve, an ollie, a
kickflip banked at 100, a front flip pressed too late = a bail, an ollie
onto a rail = a 50-50 grind that slides and hops off the end and banks
with its seconds, a 180 lands fakie, a wall at speed = a bail, the
quarter pipe launches the rider above its coping — THE PARK RULE's
registers and every source site. hq-finds.test.js learned the third
kind. `npm test`: everything green.
**Not built (stage 2, all optional, 9.8's own list).** A soundtrack slot
for the ride, graffiti, the garage's `skate` variant, the online shift
riding, a manual, revert / switch stance tricks, the bail's deck actually
skidding across the floor (it hides and returns), a rail on a site
board's edge-wall slabs, a quarter pipe anywhere but P1, the score on the
leaderboard (never — nothing gates).
**Unseen live (RULE #1c).** All of it: the deck's scale and facing under
the feet, the flips' pivot on a tall vessel, the grind's height on the
mezzanine arc (the feet at the rail's top, 1.07 m over the mezzanine
floor), the quarter pipe's look and the launch's feel, the trick line's
size against the strip, the sounds' levels, the camera on a fast roll
(the mouse still owns it — a follow may be wanted), a rider through a
door at speed.

### 2026-09-15 (rev 22) — 9.3 THE SEAMS, THE SECOND BATCH: six more entryways that are not doors (data.js, three-renderer.js, audio.js, index.html; hq-world.test.js, doorhq.test.js, hq-dutchman.test.js; local, not uploaded)
Baseline: the rev 21 tree as synced to the repo. The user: "Continue with
the DOOR HQ Build Plan." Rev 21's own NEXT line led with the other seam
kinds, so this delivery is the plan's `way` table, six rows of it.

**THE KINDS** (`DOOR_HQ.ways`, data.js): `mirror` (STEP THROUGH · 0.9 ×
2.0), `pool` (DIVE · 1.6 × 0.6), `painting` (STEP IN · 1.3 × 1.7),
`fireplace` (STEP INTO THE FIRE · 1.4 × 1.5), `screen` (CRAWL THROUGH ·
1.3 × 1.4), `closet` (STEP IN · 1.0 × 2.1). Each has a builder in
three-renderer.js `_hqWayBuilders` on the same contract as the wardrobe /
well / train (the door's local frame, `{ g, motion, ow, oh, plateY }`,
the way rig's `tick(k)`, an idle ticker) and, but for the closet (which
creaks like the wardrobe — `wayCreak`), its own sound in audio.js
(`wayMirror` the glass note swelling the wrong way and the chime as the
surface gives · `waySplash` the plop, the wash, the bubbles · `wayCanvas`
the linen stretching and the dry pop · `wayFloo` the crackle, the whoosh
rising, the roar · `wayStatic` the set's hum, the frame buzz, the sync
tearing, the cut). Only the geometry kinds the stub scene knows (the test
runs every builder headlessly, free and on a wall): THE MIRROR is a gilt
frame (its own two feet when free) showing a checkerboard floor under a
sky with a ripple that spreads as you come up; THE POOL a tiled plunge
pool sunk in the floor (coping, tiled walls a hand's breadth down, the
deep end's light under the sheet, a chrome ladder on the walker's side,
the ripple); THE PAINTING a deep frame at eye height with a mountain, a
snow cap and a city glow on its shoulder — the canvas eases toward you
and the frame's light spills; THE FIREPLACE a stone breast proud of the
wall with a mantel, andirons, logs, three orange tongues that die as
three green ones rise; THE SCREEN a pull-down sheet off its housing, the
`noise` sheet's static laid over it, a black shape with a rim of signal
that opens; THE CLOSET a narrow door on its hinge, a shelf, a rail of
three coats and the warm light of another bedroom where the back should
be.

**THE ROWS** (seven, all on THE SEAMS, dashed): `mirror_lookingglass`
(Occam's Barbershop, east wall z 0.6 — the long hook rail moved to the
south wall over the waiting chairs — ⇄ E4 the Looking-Glass: **a FREE
end on its north marble strip** at (−7.2, −8.0) facing east. The room is
18 m across and its board 14, so a north-wall door's 2.4 m landing sits
on the board; the strip is 2.1 m and the mirror stands on it. The first
free `way` on a site room; hq-world.test.js's landing test learned the
case (off the board, inside the walls, facing away from the object) and
the lane rule skips a free end. **Every built site is a station now.**)
· `natatorium_dutchman` (the natatorium's PLUNGE POOL, free at (−7.6,
3.4) beside the lap pool's west end facing north — the south-west drain
moved to (−8.3, 5.2) — ⇄ THE BILGE, free in the hold's floor at (−3.2,
−0.4) under the port lantern, facing east; hq-dutchman.test.js's landing
harness reads a free end's inward off its `face`) · `lodge_olympus` (33
⇄ 12, both north lanes at x −0.2) · `bureau_vatican` (the Bureau's north
wall at x −1.7, the nameplate moved to −3.0, ⇄ 888's north lane at x
−0.2; **the link wears `gate: { minClearance: 5, requiresKeys: 24 }` —
the Bureau's own — so both ends read CLEARANCE and the square is no way
round the Gatekeeper's door**; doorhq.test.js's "dead end" count filters
`!d.link`) · `northpole_haunted` (1225's north lane at x −10 ⇄ the
house's HALL, east wall z 0.1 — the north wall is the landing's slab)
· `observatorium_singularity` (Room 360's west wall z 3.4 — the hook
rail moved to z −2.4, the round picture to the north wall at x −5.6 — ⇄
Room 0's north lane at x −0.2) · `nuketown_haunted` (1945's north lane at
x −0.2 ⇄ the house's UPSTAIRS, west wall z 0.4 — the picture moved to the
north wall at x −6.5). Every displaced prop MOVED, none deleted; the test
checks each is still in its room and off the seam's spot. Every `why` /
`note` is Claude's DRAFT (A15).

**hqDoorNo** (data.js): a door into a room that wears its number on its
own DOOR (the Bureau's `№ — CONTESTED` hangs on the executive suite's
door) reads it through — the Vatican's painting plate — by scanning for
an entry that CARRIES a `roomNo` and never through `hqRoomNo` (the first
cut chased its own tail through the rooms' doors — a door into a
numberless room recursed until the stack went).

**NOT BUILT**: `phonebox` (HOME's phone is A14's; the garage barrier ⇄
the Strip wants the car as the way), `tent`, Room 8's weir ⇄ Atlantis
(Atlantis's north wall has no fourth lane), the star chart's route lines,
9.8. **Tests**: hq-world.test.js (the seam list, the unlisted-kind probe
is `phonebox` now, the free-end landing, the station list, the SEAMS
line's fourteen stops, and a new rev 22 test: every new end resolves,
lands clear of props / people / counters, the moved props, the wall fit,
the pool off the lap pool, the mirror on the strip, the gate at both
ends, the plate's number); doorhq.test.js (the Bureau); hq-dutchman
.test.js (the free bilge). Full `npm test` green (1386 pass, 4 skips).

**UNSEEN LIVE (RULE #1c)**: all six objects — the mirror's glass against
the barbershop's light and on the Looking-Glass's marble, the plunge
pool's sheet over the natatorium floor (the basin is a hand's breadth
deep, not a metre: the floor plane would hide a real sink), the painting's
cone mountain, the fireplace's green, the screen's `noise` sheet, the
closet's swing; the press-in on a knee-height hole (the screen) and on a
floor-level pool; the sounds' levels against the wardrobe's.

**NEXT**: `tent` / `phonebox` when the story rules them, Room 8's weir when
Atlantis has a lane (or as a free end on its quay), the star chart's route
lines, Downtown's and CERN's platforms, 8.4's third ring, 9.8
skateboarding.

### 2026-09-15 (rev 21) — THE VEHICLE BATCH + 9.3 THE TRAIN: nine vehicles park, and the tunnel's train arrives (three-renderer.js, data.js, map.js, audio.js, index.html; misc-models.test.js, hq-world.test.js, hq-stage2.test.js, MODEL_INDEX.md; local, not uploaded)
Baseline: the rev 20 tree as synced to the repo. The user uploaded nine
Meshy vehicles to R2 `Assets/misc/` (a black SUV, a black Cadillac, a cop
car, a cyberpunk car, a fire truck, a school bus, a subway front + cart,
an ambulance): "use them where appropriate; in the parking garage, in
the urban maps, etc. Continue with the DOOR HQ Build Plan." The plan's
own open line beside the vehicles was 9.3's `train` way ("a train that
arrives") — the subway cars are that train.

**THE KIT** (three-renderer.js, after `_hzMiscKit`): the nine files in
`_MISC_GLB`; `_VEHICLE_KIT` = per vehicle the length (`m`), the nose
pre-turn (`yaw`), the collision foot, the stand-in box, the self-lit
lift, `beacon` for the emergency vehicles; `_hzVehicle(kind, o)` = ONE
call (`_hzMiscKit` with `fit: 'span'` along the length, the kit's yaw +
the caller's, `_hzVehicleProc` as the fallback — a lit box on four wheels
in the vehicle's colour, so EW_PERF_LOW and a missing loader still show a
car — and the beacon's red-blue glow pulse on the board only). The
facings are TARGETS: the CDN is egress-blocked here, so no contact sheet
was made; if a nose lands backward the edit is `yaw: Math.PI` on that
row, sideways ±π/2 — one field (MODEL_INDEX §3c).

**THE SETTINGS**: Nuketown's two yellow boxes are gone — the school bus
on the south verge and the Cadillac in the east house's drive; Cyberpunk
two cyberpunk cars kerbside and the cop car across the north road; the
Stadium the team bus along the south wall and the ambulance at the south
end zone; the Strip the Cadillac cruising the north road and the cop car
at the chapel's kerb; Downtown THE EVACUATION — the fire truck across
the north road, the ambulance and the cop car at the south barriers, the
SUV on the east kerb. All through `_nrProp`, so the site rooms inherit
them with blockers (the foot rides `_ew_footM` before the GLB lands).

**ROOM P1**: five cars still (the attendant's count) — the Sedan, and
four `DOOR_HQ.catalogue` rows with `base: 'misc'` + `vehicle: true`
(`car_suv` the agents', `car_cadillac` the executive's, `car_cop`,
`car_ambulance` Medical's); `car_cyber`, `fire_truck` (3.4 m — never
under P1's 2.8 m ceiling) and `school_bus` are catalogued for a room
with the headroom. map.js's booth counts `parked_car` + every
`vehicle: true` prop.

**THE TRAIN** (9.3 `way: 'train'`): `DOOR_HQ.ways.train` (BOARD · THE
TRAIN · DOORS OPEN · `wayTrain` · 1.4 × 2.1 — the opening is ONE car
door), `DOOR_HQ.routes.subway` (THE SUBWAY, the yellow line) and the link
`tunnel_cyberpunk`: `a` = Room 2's tunnel, a FREE end on the track bed
(x −1.5, z 6, face 90 — the doors face the platform, the body stands on
the track behind its own plane, inside the west wall), `b` = Cyberpunk's
north wall at x −10 (its one free lane — Downtown's three are taken,
CERN's console lane sits at x 0). A facility room seaming into a wild
one is the garden-well precedent (never gated). The builder
(`_hqWayBuilders.train`): the front car (`subway_front`, nose −X — the
doorway at x 0 is its rear door) and the cart (`subway_cart`) trailing at
+X, through `_hzVehicle` with a lit procedural car as the fallback; a
wall end adds the platform lip + the yellow line, stands the body half
inside the wall (the wall is the tunnel; the doors are 0.9 m proud, the
2.4 m landing is clear) and stands the FRONT CAR ALONE (x −9..3 — a
full train would have run through the Strip door's lane 5 m along the
same wall; the rest of the train is in the tunnel); THE ARRIVAL = a
ticker rolls the train in from 26 m up the line (local +X: the tunnel's
north end, the street's east) over 3.2 s, nose first, braking to its
mark; the way
rig's tick slides the two door leaves apart and lights the interior; the
press-in at 0.55 is the step aboard. `_hqBuildWay` now places a way's
`blockers` (discs in the object's own frame → the room's) so the walker
cannot walk through a subway car sideways. audio.js `wayTrain` = the
brakes' squeal, the air hiss, the two-note door chime, the rubber thud.
The tunnel's `train_car` prop is retired (the proc stays for
hq-stage2.test.js's builder list; nothing places it).

**Tests**: misc-models.test.js grew the vehicle block (every file in
`_MISC_GLB` once, every kind in `_VEHICLE_KIT` and placed, the catalogue
rows, the index); hq-world.test.js's seam list + the stub-scene run take
the train (the production landing on Cyberpunk's end passes as is);
hq-stage2.test.js's tunnel has four ends. Full `npm test` green.

**UNSEEN LIVE (RULE #1c)**: every vehicle's facing and scale against the
board's buildings, the beacon glows, the Sedan beside a Meshy SUV, the
train's arrival pace and its stop against the platform edge, the doors'
slide, the half-buried body on Cyberpunk's wall, the blockers' fit.

**NEXT**: the other seam kinds (mirror · pool · painting · fireplace ·
phonebox · screen · closet), Downtown's and CERN's platforms when a lane
frees, the fire truck's and the bus's rooms (the works' warehouse has
the headroom), 8.4's third ring, 9.8 skateboarding.

### 2026-09-15 (rev 20) — 9.2 stage 2: THE GALLERY ships — two floors in one room, THE LANDING in the Haunted House's hall (three-renderer.js, data.js, index.html; hq-gallery.test.js, hq-complex.test.js; local, not uploaded)
Baseline: the rev 19 tree as synced to the repo. The user: "Let's continue
with the DOOR HQ build plan" — the plan's own next line was the gallery.
- **THE GALLERY (renderer)** — `shell.gallery = { h, side, w, stairAt,
  rail }` on a box room. three-renderer.js, the block right before
  `_hqSurface`: `_hqGalleryFrame` (the frame: s along the wall from its
  start corner, t into the room; twelve risers for 2.9 m at 0.28 m a run;
  the flight at the named end with its low end at the corner, the slab the
  rest of the wall), `_hqGalleryTread`, `_hqGalleryAt` (THE LAYER —
  `_hqSurface`'s box branch reads it after the site cell: a number is the
  surface, `null` a wall, `undefined` "not mine, the floor"; the rail band
  is 0.15 m + the body's radius and is solid only from the slab or a tread
  above a step, so the foot of the flight is entered from the side),
  `_hqGalleryFloor` (seeds `_hqBlockerFloor`: a jump lands on the slab /
  a tread, the portal aim lifts to them), `_hqGalleryAir` (`_hqAirOK`),
  `_hqGalleryCam` (`_hqCamBlocked`). `_hqBuildGallery` (after
  `_hqBuildBoxShell`; `_hqEnter` sets `_hq.gallery` BEFORE the shell
  build so nothing reads a surface without the frame) draws the deck,
  the underside, the fascia, the treads (solid boxes from the floor — a
  closed string; the mass under the flight is a wall, as the surface
  says), the nosings, the posts + top + mid rail, the sloped rail up the
  flight from the first tread above a step, the newels, and registers
  `_hq.rails` (two runs) + `_hq.ramps` (the flight) for 9.8.
- **A door on the gallery's wall stands on the slab**: `_hqDoorFloorY`
  returns `gallery.h` for a door on `gallery.side` (an explicit `y: 0`
  puts a door under it; a numeric `y` still wins). `_hqGoTo` lands 2.4 m
  in at that height; `_hqCamInDoorway` already read `y0`.
- **THE FIX that came with it**: `_hqFindTarget` matched a box door by the
  rotunda's LEVEL (`pl.y > wallH × 0.6` vs `door.level`), so a box door
  standing at a height was never offered — the gallery's doorway, and the
  stairwell's `landing` door at y 6 (Phase 8 stage 2, unseen live) alike.
  A box door is found by HEIGHT now (|walker − door| ≤ 1.2 m); the
  rotunda keeps its level test.
- **THE HALL (data.js `site_prebuilt_haunted_hall`)**: h 4.0 → 5.8 (a
  two-storey hall), `gallery: { h: 2.9, side: 'n', w: 3.0, stairAt: 'end',
  rail: true }` — THE LANDING along the north wall, the flight rising out
  of the east corner; the `stairs` door (→ upstairs) moved from x 4.5 to
  x 1.0 ON THE LANDING (clear of the flight's head at x 3.64), relabelled
  THE LANDING · UP THE STAIRS · THE BEDROOMS; the `house_stairs` prop and
  the three banister `railing_1m` are gone (the gallery's own); the dais
  stays under the landing (the clock dropped to mount 2.1 under the slab);
  on the landing: two torches and two pictures on the north wall above
  the slab, a lamp, the paperwork (moved up from the floor) and a box at
  `y: 2.9`. Upstairs is unchanged (its own box room, the bedrooms; its
  `stairs` door comes back to `hall@stairs` = the landing).
- **Tests**: `hq-gallery.test.js` (7): the sheet, the frame on all four
  walls (round trips, the flight's geometry), THE CLIMB (a walker from the
  floor beside the foot climbs the flight one riser at a time and crosses
  the slab to the door's landing spot by `_hqGalleryAt` alone — the
  dungeon's solver rule, applied to the house), the walls / the free query
  / the landing / the air / the camera reads, a stair-less gallery, the
  builder on a stub scene (twelve treads, the slab at its height, the
  sloped rail, the two rail runs and the ramp), the source sites.
  hq-complex.test.js: the landing harness reads the production
  `_hqDoorFloorY` (a door on the gallery lands AT its height, inside the
  slab's depth, clear of the flight), the park rule accepts the gallery's
  banister and flight. `npm test`: 1384 tests, 1380 pass, 0 fail, 4 skips (hq-stage2.test.js's `door.y` source guard follows the new line).
- **Files**: three-renderer.js, data.js → R2; index.html
  (`?v=20260915-gallery-01-cors`) → Render; hq-gallery.test.js,
  hq-complex.test.js, this file, CLAUDE.md → the repo.
- **Unseen live (RULE #1c)**: the slab's deck texture at the room's
  repeat, the underside from below, the treads' wood against the plank
  floor, the sloped rail's joints at the newels, the walker's first step
  onto the foot from the side, the boom on the landing, the doorway's
  plate at 2.9 m + door height, the two torches over the slab.
- **Next in 9.2**: the urban maps "a lot bigger" (Downtown / the Strip
  as complexes). Then 8.4's third ring on the rotunda (the same layer).
  Still open elsewhere: 9.3's other eight `way` kinds + the star chart's
  route lines, 9.4 stage 2, 9.5 stage 2, 9.1's reserved kinds.

### 2026-09-15 (rev 19) — 9.2 stage 3: THE FLYING DUTCHMAN COMPLEX ships (data.js, index.html; hq-dutchman.test.js, hq-world.test.js, doorhq.test.js, MODEL_INDEX.md; local, not uploaded)
Baseline: the rev 18 tree as synced to the repo. The user: "Let's continue
with the DOOR HQ build plan" — the plan's own next line was the Dutchman.
- **THE FLYING DUTCHMAN COMPLEX (9.2 stage 3)** — the other half of the
  user's brief (2): "the Spaceship and the Flying Dutchman with several
  decks". Three hand-authored box rooms in `DOOR_HQ.rooms` (the block right
  after the spaceship's bridge, before H-WING), `site: 'prebuilt_revenge'` +
  `part`, no `roomNo`: `site_prebuilt_revenge_gundeck` (16 × 10 × 2.7 —
  four `ship_cannon`s run out two a side through the port and starboard
  walls, THE MAGAZINE STEP (`riser_2`) with its rail along the north side,
  the shot locker, the breeching chains, the slow match as a `wall_torch`,
  three lanterns from the beams; a pirate and a skeleton), `_cabin` (10 × 8
  × 2.8 — `false_window` on the WEST wall = THE STERN WINDOWS (the bow is
  +x, so aft is west), the round table with the candles and THE LOG open at
  tomorrow, the bunk, the sea chest, a portrait, a radio that should not be
  there; the ghost), `_hold` (14 × 10 × 3 — THE BALLAST TIERS + rail, the
  spare `ship_anchor`, two `sea_chest`s, the cargo, THE BILGE as drains and
  stains with Records' wet-floor sign; a mermaid and a siren). Ship frame:
  bow east, aft west, port north, starboard south. Every deck lights itself
  (`strips: false`, `lights: []`). THE COMPANIONWAY = `siteRooms.backDoors.
  prebuilt_revenge` (north wall x −5 — the lane the Atlantis hatch hung on —
  `leaf_shabby_wood`, the site's own leaf, single) → `gundeck@deck`.
- **THE DEEP goes below the waterline**: `links.revenge_atlantis.a` is
  `{ site: 'prebuilt_revenge', part: 'hold', wall: 'w', z: 0, sub: 'THE HATCH
  BELOW THE WATERLINE · TO ATLANTIS' }` — the spaceship's rule (rev 18) for
  every "below decks" seam: a link end on a complex PART; the main deck
  carries one door again; the site stays ONE station (`hqWorldRoutes` walks
  the line from 1717 as before; standing in the hold reads `here`).
  hq-world.test.js's link-only reach of the deep line now starts at the
  hold (the deck reaches the hatch by an ordinary door, not a link) and
  insists no link leaves the main deck.
- **THE SHIP'S OWN KIT BELOW DECKS**: four catalogue rows read the SHARED
  misc bucket (`base: 'misc'`, the files `_MISC_GLB` names — the same-thing
  rule, MODEL_INDEX §9): `ship_cannon` (span 2.2, foot 0.9, block; muzzle
  −X at face 0 → face 0 runs out to port, 180 to starboard), `sea_chest`,
  `ship_anchor`, `ship_lantern` (`ceil` + a warm `light`; doorhq.test.js's
  room-light rule lists it). Nothing new on R2. hq-dutchman.test.js diffs
  each row's file against `_MISC_GLB`.
- **Tapes**: one per deck (`HQ_TAPE_SHEET` rows → T091–T093); the boiler
  room, the server room and the ritual room gave theirs up (a floor room's
  tape is a bonus, a deck's is the 9.1 rule; the hundred stays a hundred).
- **Files**: data.js → R2; index.html (`?v=20260915-dutchman-01-cors`) →
  Render; hq-dutchman.test.js, hq-world.test.js, doorhq.test.js,
  MODEL_INDEX.md, this file, CLAUDE.md → the repo. `npm test`: 1373 pass,
  0 fail, 4 skips.
- **Unseen live (RULE #1c)**: the guns' facing (the misc GLB's muzzle is −X
  per its contact sheet; if a gun points INTO the deck, swap the two `face`
  values in the four rows), the lantern hanging from a 2.7 m beam (h 0.5,
  `light.y` −0.3), the stern window's glow on a wooden wall, the shabby
  leaf on the companionway from the quay side.
- **Next in 9.2**: the gallery (`shell.gallery`, renderer — a two-floor
  room for the Haunted House's hall / upstairs); the urban maps "a lot
  bigger" (Downtown / the Strip as complexes). Still open elsewhere: 9.3's
  other eight `way` kinds + the star chart's route lines, 9.4 stage 2, 9.5
  stage 2 (roofs, galleries, the lesson), 9.1's reserved kinds.

### 2026-09-15 (rev 18) — 9.2 stage 2: THE SPACESHIP COMPLEX ships + THE CHECKLIST BUG (data.js, battle.js, index.html; hq-spaceship.test.js, hq-world.test.js, achievements.test.js; local, not uploaded)
Baseline: the rev 17 tree. The user: "1st a quick bug fix and then continue
with the plan. I just won a match by finding the keys and the stabilize
threshold checklist did not update."
- **THE BUG (data.js `mergeProgressBlobs`)**: the flag writer was fine
  (battle.js commitAchProgress writes `site:<mapId>:hourglasses_collected`
  on a Keys win, and `hqSiteMastery` reads it) — but the progress SYNC that
  `profileSaveProgress` schedules two seconds after every commit re-merges
  the local blob through `mergeProgressBlobs`, whose unlock-key regex
  (`KEY_RE`) allowed letters, digits, `_ . ' & -` and a space — no COLON.
  Every `site:` flag was dropped on the way through, on the client AND on
  the server (server.js runs the same function off data.js at boot), so a
  logged-in officer's checklist ticked for two seconds and then un-ticked.
  `KEY_RE` accepts `:` now; achievements.test.js merges a blob of site
  flags and reads it back through `hqSiteMastery`. **Also**: a Key picked
  up in Arena SUDDEN DEATH ends the match as `sudden_death`, which is no
  checklist row — battle.js sets `state._winCause = 'hourglasses_collected'`
  beside the label and the flag writer files the CAUSE (`_winCause` is
  reset with `_winCondition` at every reset site). The result stamp and
  the history keep saying SUDDEN DEATH.
- **THE SPACESHIP COMPLEX (9.2 stage 2)** — the user's brief (2): "the
  Spaceship and the Flying Dutchman with several decks". Three hand-
  authored box rooms in `DOOR_HQ.rooms` (the block right before H-WING),
  `site: 'prebuilt_derelict'` + `part`, no `roomNo`: `site_prebuilt_
  derelict_airlock` (8 × 10 — the inner hatch aft to the deck, the forward
  hatch to the hold, THE PORT COLLAR on the west wall and THE STARBOARD
  COLLAR on the east: the Lunar route's `moon_derelict.b` and
  `derelict_saturn.a` ends are `{ site, part: 'airlock', wall, z, sub }` now,
  each with its own plate line — the deck's north wall carries ONE door
  again, the old crowding gone), `_hold` (16 × 12 × 5 — the strapped
  freight, THE CRYO POD (`iso_tank`, lit, not on the manifest), the
  loading tiers under the bridge hatch = the park rule's ramp, the rail on
  them), `_bridge` (12 × 8 — `false_window` on the north wall is THE
  VIEWPORT, two `monitor_stack`s, the nav console on a `tanker_desk`, the
  warm chair; the end of the ship: one door). THE AIRLOCK back door on the
  deck = `siteRooms.backDoors.prebuilt_derelict` (north wall x −6, the
  lane the Moon collar hung on, `leaf_bulkhead` + `wide: true` — the
  bulkhead is a wide leaf, doorhq.test.js insists every bulkhead door
  says so, and a wide panel needs 1.65 m of wall each side: the bridge
  hatch stands at x −3.6, not −5). Natives: a grey in the airlock, a
  symbiote and the black goo in the hold, the AI on the bridge. Lines are
  Claude's DRAFT (A15). Tapes: one per compartment (`HQ_TAPE_SHEET`
  rows T088–T090); the hundred stays a hundred — the laundry, the locker
  room and the lecture hall gave theirs up (numbers are REC; a floor
  room's tape is a bonus, a compartment's is the 9.1 rule). hq-world.
  test.js: a link end may be a PART (the board room of its site keeps the
  egress + the marker), and the per-end-leaf probe strips the collar's
  own `sub`.
- **Files**: data.js, battle.js → R2; index.html
  (`?v=20260915-spaceship-01-cors`) → Render — AND data.js to the Render
  repo too (server.js derives `mergeProgressBlobs` from data.js at boot:
  the server keeps dropping the flags until it is redeployed with the
  fixed file); hq-spaceship.test.js, hq-world.test.js,
  achievements.test.js, this file, CLAUDE.md → the repo. `npm test`:
  1364 pass, 0 fail, 4 skips.
- **Unseen live (RULE #1c)**: the three compartments (the gunmetal
  ceiling as a box ceiling, the cryo pod's glow in a 5 m hold, the
  collars as bulkhead leaves on 10 m walls), the checklist ticking and
  STAYING ticked after the sync (open the threshold panel two seconds
  after the result screen).
- **Next in 9.2**: THE FLYING DUTCHMAN's decks (the gun deck, the hold ⇄
  Atlantis — the `deep` route's end moves below decks the same way) — DONE
  rev 19 — then the gallery (`shell.gallery`, renderer). Still open elsewhere: 9.3's
  other eight `way` kinds + the star chart's route lines, 9.4 stage 2, 9.5
  stage 2 (roofs, galleries, the lesson), 9.1's reserved kinds.

### 2026-09-15 (rev 17) — 9.4 THE ENCOUNTER: the click, not the number keys (data.js, three-renderer.js, map.js, index.html, hq-encounter.test.js; local, not uploaded)
Baseline: the rev 16 tree. The user: "I think I was misunderstood about the
door gun thing. When you are not wielding the gun, clicking should do the
attack. When you press F and wield the gun, then clicking obviously places
a door instead. I don't want the 1, 2, 3, 4 controls."
- **The controls now**: door gun HOLSTERED → LEFT CLICK = the walker's
  attack clip (`_hqStrikeClick`), the encounter if a native is under the
  aim; F draws the gun → LEFT CLICK places a threshold, RIGHT CLICK / Q
  holsters (unchanged, 9.5). The `1`–`4` keys are removed from
  `_hqKeyName` and the keydown handler; `_hqStrikeKey` is gone (the API
  `hq.strike()` now takes no key). One gesture, `attack` — the cast
  chains stay in the renderer for the forge preview but no HQ key
  reaches them.
- **The click rule** (`H.onMouseDown`): the drawn gun still reads the
  click FIRST; holstered, a left click with the pointer already locked
  strikes at once; the first click (unlocked) only grabs the pointer as
  before; if the lock is refused, a left click that did not drag strikes
  on mouseup (`H.drag.strike`, `H.onMouseUp`). The cooldown
  (`cooldownMs` 1400) stops a double swing.
- **Data**: `HQ_ENCOUNTER_RULES` drops `gun` + `keys`, gains `trigger:
  'click'` + `gesture: 'attack'`; `hqEncounterGesture('click')` →
  `'attack'`, any key → null. map.js `_hqEncounterFire` refuses while the
  gun is DRAWN (the inverse of rev 16); the prompt aims holstered and reads
  `[CLICK] ATTACK · ENGAGE`; the hint `CLICK attack = ENGAGE a native` is
  always shown (it needs no gun).
- Files: data.js, three-renderer.js, map.js → R2; index.html
  (`?v=20260915-encounter-02-cors`) → Render; hq-encounter.test.js, this
  file, DOOR_MASTER.md, CLAUDE.md → the repo. `npm test` green. Unseen
  live (RULE #1c): the first click's grab vs the second click's swing —
  if it feels like "the first click does nothing", that is the pointer
  grab; the strike on an unlocked click is the fallback only.

### 2026-09-15 (rev 16) — 9.4 THE ENCOUNTER stage 1 ships, player-initiated (data.js, three-renderer.js, map.js, battle.js, index.html, hq-encounter.test.js; local, not uploaded)
Baseline: the rev 15 tree (the promotion ladder). The user: "continue with
the DOOR HQ Build plan. I think we are on encounters. I do not want random
encounters, they must be initiated by the player. They can do their attack
animation or one of their spell animations to trigger the encounter,
probably not when they are not holding their door gun though."
- **The rule** (Part C row 35): no roamer, no patrol, no hostile run, no
  stinger. A native stands where it stood; the officer draws the door gun
  (F), aims, and presses **1** (the walker's own basic-attack clip — the
  def's `basicAttackKind` chain) or **2 · 3 · 4** (the magic / area /
  capstone cast chains) — the one-shot plays on the walker's rig
  (`ch.strike`, LoopOnce, the walker squares up on the camera's aim) and
  the encounter fires on the clip's STRIKE FRAME (sprites.js `strikeAt`,
  else 380 ms). Holstered, the same keys are a flourish. The target is
  `_hqEncounterAim`: the nearest `hqEncounterCharOk` character (a native
  or a roster draw; never the cast, an agent, the shift, the clone)
  within `HQ_ENCOUNTER_RULES.reach` 3.4 m, inside the 55° aim cone, with
  line of sight (`_hqLosClear`: furniture / setting blockers — people
  never — rock and raised cells, a doorway's wall). The prompt reads
  `▸ NAME · [1] ATTACK · [2–4] CAST · ENGAGE` while the gun is drawn and
  a native is in reach (the prompt loop asks `hq.encounterAim()` only
  then).
- **The launch** (map.js `_hqEncounterFire` → data.js `hqEncounterLaunch`
  → `_hqEncounterStart`): only a WILD room (`hqEncounterRoomOk` =
  `hqRoomSite` — the one test the door gun's safe-room rule shares);
  never online (RULE #2); the site's Δ; the STICKY CONFIG = what the
  terminal last filed from the building (`ew_hq_encounter_cfg`: mode ·
  team size · rounds, sanitised by `hqEncounterConfig`; Clash / Gauntlet
  fall back to Arena · 4); the CPU pool = the native's race first, then
  `hqMissionPool`; THE LAST ROSTER seats P1 with NO builder — the party
  rides `window._hqEncounterParty` into `_msConfirm`, which runs every
  config rule as today and then (instead of `dismissTitleScreen`) applies
  the roster, randomises the CPU, `applyPartyBuild(false)` +
  `startMatch()` (the tutorial's recipe). No roster on file → the
  terminal opens once, the native's race leading its pool. The way back
  is the console (`doorId: 'crossing'`).
- **The seam, stage 1**: the intro cinematic is off PER LAUNCH
  (`window._hqEncounterRun.noIntro`, read by `_introCineEligible` and the
  leaf warm-up — never the global switch). The walker's eye rides the
  `onEncounter` event (`x z y yaw pitch`) for seam (2) later.
- **After**: the commit (battle.js, before the Code Red block) consumes
  the run marker win or lose → `hqEncounterRecord` → `door.hq.encounters
  = { count, wins, losses, last }`, a 🚪 log line, and
  `window._hqEncounterResult`; `_hqReturnOrMenu` reads it — a loss
  re-enters at MEDICAL's spawn (the ward, row 30), a win at the console;
  a toast either way. The OFFICER sheet shows ENCOUNTERS · held / exited.
- **Tests**: hq-encounter.test.js (the rules, the wild-room test against
  every room, who may be engaged, the gestures, the config, the launch —
  pure and serialisable, a complex part launching its site — the record,
  and the source sites on every side of the cut). `npm test` 1357 pass.
- **Unseen live** (RULE #1c): the one-shot on a cast rig (the Player
  model's attack chain), the strike-frame timing against the launch, the
  prompt's flicker at the reach edge, the builder-less start's first
  frame, the ward's landing.
- **Next in 9.4**: seam (2) the walker's eye as the first frame
  (three-camera.js initial-pose API), the `spawnSide` mirror, seam (3)
  the dissolve; the user's open questions in row 35.

### 2026-09-15 (rev 14) — Phase 8 stage 2: TWO MORE FLOORS ship — 2 · THE WORKS and 4 · THE LABS (data.js, three-renderer.js, map.js, styles-base.css, index.html; hq-stage2.test.js; local, not deployed)
Baseline: the rev 13 tree (the door gun). The user: "continue with the DOOR
HQ build plan. I want to add some stuff to stage 2 before we do
encounters" — a carnival / circus room; an endless stairwell that loops
you back to the top; a door manufacturing warehouse with conveyor belts
(robotic arms opening and closing a door repeatedly; a door incinerator
closing dangerous realities for good; a door autopsy room with the parts
laid out — knob, handle, doorbell, window, boards, knocker; a door garden
of tiny doors on vines and stems); a control / security room with a stack
of CRTs looking at the rooms; an interdimensional lost and found; clone
disposal (a near-empty room, a lone gun, a garbage chute); a dream lab
(succubus, mad scientist, dreameater, voidweaver…); a sensory deprivation
tank; a Mandela room that is different every time you enter; a tunnel /
subway; an upside-down room with the furniture on the ceiling; Supply
Closet 4B (maximum clearance, a blast door, armed guards, radiation
warnings, an evacuation button); and ROOM-SPECIFIC DIALOGUE — the
conspiracy theorist in the bathroom at the sink, "they really need a
filter", something in character about the room they are in.
- **Where they went:** two floors the car never listed — **2 · THE WORKS**
  (the factory and what hangs off it, the fire stair, the tunnel under
  everything, the midway at the end of the line) and **4 · THE LABS**
  (research; 4B is on the fourth floor because it says so). Eighteen
  rooms; §8.6 has the table, the numbers (REC) and the rules.
- **THE STAIRWELL LOOPS for real.** The walker enters at THE TOP LANDING
  six metres up (a box door carries `y` now), walks down three flights of
  real treads (stacked `stair_step` blockers, 0.25 m each — the step rule
  learned that a blocker's base is the prop's own `y` and that a raised
  blocker is a wall only when you are not standing on it) and the door at
  the bottom marked DOWN opens onto the top landing of the same room. The
  tunnel is off the bottom; the garage grew a service hatch onto the
  platform; THE END OF THE LINE is the midway; the midway's HALL OF
  MIRRORS opens into THE MANDELA ROOM three floors up with no stairs
  between (9.3's "rooms leading to rooms", the user's loop request).
- **THE MANDELA ROOM** is 5.1's variants with a new clock: `when: { each:
  true }` rolls on EVERY entry (never the visit roll, never twice the
  same in a row); the plate outside re-plates; THE FRAME tells you what
  you remember and nobody else does (4.4's Mandela effect, per room).
- **ROOM DIALOGUE** is one field: `say` on a spot. Whoever stands there
  says the room's line before any roster line. Drafts (A15) on every
  new room and on three old spots (the sink, Room X, the cubicles).
  `clone: true` on a spot is the other one of you (Room II).
- **THE UPSIDE-DOWN ROOM** is one field too: `flip: true` on a prop.
- **Supply Closet 4B**: the user asked for maximum clearance; the gate
  (L6) is on the BLAST DOOR, not the vestibule, so a recruit walks in,
  reads the warnings, meets the guards and does not go in — the joke is
  the closet behind it (400 rolls; the log says 399). The evacuation
  button works: it walks you to the foyer with the bells ringing.
- **Thirty-seven procs**, all procedural, all catalogued (a user GLB
  replaces any by giving its row a `file`); the ones that move push a
  ticker (the belts, the arms, the furnace, the vines, the monitors, the
  wheel, the carousel, the traces, the dream screen, the tank's lid).
- **Fourteen by-id panels**, none launching a screen (C-27 holds; the
  test checks). `hqSecurityFeeds` reads the register; `hqClaimsBook`
  seeds the day; `hqDoorParts` is the slab; `hqWorksTally` the line.
- **Tests:** `hq-stage2.test.js` (twelve tests: the rooms and numbers,
  every door and its way back, the stops, THE LOOP with the tread chain
  and the overlap check, the renderer rules, the dialogue, the variants,
  4B's gate, the procs ↔ builders ↔ panels, C-27, the park rule, the
  PRODUCTION landing on the raised door with the suites harness). hq-
  floors.test.js takes seven stops; doorhq.test.js accepts the new light
  procs. Full suite 1340 / 0 / 4 skips; syntax 155 / 155.
- **Not done / next:** tapes for the new rooms (the sheet is fixed at a
  hundred; the second hundred starts on these floors), a train that
  arrives (the `train` way), cast on the new floors, sounds, the hall of
  mirrors as mirrors. Then, as the user said: **9.4 THE ENCOUNTER**.
- UNSEEN LIVE (RULE #1c): all of it. Delivered as
  `ENTROPY_WARS_STAGE2_ROOMS.zip`; token `20260915-hq-stage2-01-cors`.

### 2026-09-15 (rev 13) — Phase 9.5 stage 1: THE DOOR GUN ships — THE PORTABLE THRESHOLD, two doors you place (data.js, three-renderer.js, map.js, index.html, styles-base.css; hq-portal.test.js; local, not deployed)
Baseline: the rev 12 tree (the finds). The user: "continue with the door
hq build plan". The REC order (row 25) after 9.3 → 9.2 → 9.1 is **9.5 THE
DOOR GUN**, and its stage 1 ships as the section specifies — the object,
the aim, the placement, the step-through, the persistence, the issue.
- **The brief (9.5):** place two doors like a portal gun — reach a doorway
  or a shiny object you can see but cannot climb to; or park one door by a
  safe area, explore, and when in trouble place the other and go back — an
  escape rope.
- **Built — the data (data.js, the block right before THE ROOM
  REGISTER):** `HQ_PORTAL_RULES` (cost 24 Keys · rank 2 KEYHOLDER · reach
  14 m · minGap 1.6 · minFromWalker 1.2 · footprint 0.62 · leaf
  `leaf_coffee` · slots a / b · labels). ONE profile record,
  `door.hq.portal = { issued, issuedAt, a: { room, x, y, z, face, leaf,
  at }, b, last }` — `hqPortalRecord` (a malformed row reads as empty),
  **`hqPortalStatus(profile, { force })`** = the ONE read (issued / forced
  / level / keys / cost / canIssue / reason / a / b / last / placed / next
  / paired), `hqPortalNextSlot` = PORTAL'S RULE (an empty slot first, A
  then B, else the OLDER of the two — the one that was not placed last),
  `hqPortalIssue(profile)` (KEYHOLDER + the Keys, spent from the ISSUED
  ledger `door.hq.keys` so the recovered count is untouched; once),
  **`hqPortalPlace(profile, spec, { force })`** (the issue, a real room,
  finite numbers, the gap from a twin in the same room; the heading
  normalised; the leaf = `hqPortalLeaf(room)`: a site room's — or a
  complex part's — own threshold leaf when it swings, `leaf_coffee`
  everywhere else, NEVER a rank leaf), `hqPortalClear` (the pair goes,
  the issue stays), `hqPortalDoorsIn(profile, roomId)`, `hqPortalTwin`,
  `hqPortalSafeRoom` (= not `hqRoomSite` — the facility is safe by
  construction, 9.4's rule shared).
- **Built — the renderer (three-renderer.js, the block after
  `_hqTakeFind`):** **`_hqPortalAim`** — the camera's own ray marched at
  0.12 m against the room's WALKABLE SURFACE SET: `_hqPortalSurf` =
  `_hqSurface(x, z, null, true)` (the floor / a cell's feet / a pit's bed)
  lifted to `_hqBlockerFloor` (a furniture top, a raised site cell); the
  ray ENDS at a wall / rock / off the room (surface null) and at the side
  of a blocker (`_hqAirClearOfBlockers`); the first sample under the
  surface is the hit, the opening faces the officer. Refusals, worst
  first: `fluid` (a liquid cell — the moat included), `near` (< 1.2 m from
  the feet), `twin` (< 1.6 m from the other placed door), `door` (inside
  1.7 m of a room door's own lane), `room` (the frame's footprint — five
  points either side and a step in front — must carry the same height ±
  14 cm and no fluid). **THE GHOST** (`_hqPortalGhost`): two jambs, a
  lintel, a floor ring and an arrow pointing at the officer, additive,
  green legal / red refused, breathing; `_hqPortalTickAim` each frame
  while drawn (from `_hqTickWorld`, after the auto-enter). **THE PLACED
  DOOR** (`_hqPortalBuild(slot, spec)`): the DOOR frame in the
  headquarters' teal + stone, the seal plate (the crossing's own
  `_introSealTex`, both faces), THRESHOLD A / B on the lintel both faces,
  a slot-coloured strip up each jamb (cyan A, amber B) and a glow at the
  sill, the catalogue leaf on a swing pivot (the same loader + fit as
  `_hqBuildDoors`; a plain panel when no catalogue is loaded — the
  probes), a CSS2D plate — pushed into `_hq.doors` as a FREE box-wall
  record (`_hqBoxWall(room, 'free', …)`) wearing `door: { id:
  'portal:<slot>', portal, verb: 'STEP THROUGH', action: { portal } }`,
  so the scan (`_hqFindTarget`), the swing (`_hqTickDoors`), the press-in
  (`_hqTickAutoEnter`), the landing (`_hqGoTo`) and the doorway camera
  blocker (`_hqCamInDoorway`) read it with no change; three discs along
  the leaf line (`portal: slot` on the blocker) make the shut door a WALL
  from behind (one-sided, like Portal's — the press-in fires in front of
  them); a placing burst of motes. `_hqPortalRemove(slot)` drops the
  record, the group and its blockers. **`_hqBuildPortals(room, opts)`**
  rebuilds the pair's doors standing in THIS room from `opts.portal` on
  every entry. **`_hqPortalHop(slot)`** = the twin is here: `_hqGoTo
  ('portal:<slot>', true)` (2.4 m in front, facing away), the latch set so
  the landing never re-fires, a flash. Input: **F** draws / holsters
  (`_hqPortalDraw`; refused with `unissued` when the record says so),
  **Q** holsters a drawn one before it rings the bell, **LEFT CLICK**
  places (`_hqPortalPlaceAim` → `opts.onPortalPlace(spec)` → the slot →
  build), **RIGHT CLICK** holsters. API: `hq.portalDraw / portalDrawn /
  portalIssued / portalAim / portalPlace / portalHop / portalRemove /
  portalDoors`.
- **Built — the flow (map.js, the block before `_hqTakeFind`):**
  `_hqPortalOpts(opts, profile)` hands the renderer `{ issued, a, b,
  next }` on every entry — a FRESH arrival from Play hands no pair (and
  `_hqRecordVisit(null)` files the clear: the rope is for one visit);
  **`_hqPortalPlaced(spec)`** = the filer, ONE transaction (load →
  `hqPortalPlace` → save → the toast PLACED / MOVED · the pair stands /
  its twin waits in <room>); `_hqPortalRefused(reason)` = one line per
  refusal, throttled; `_hqPortalEvent` (draw on / off → the pill, the
  hint, a toast); **`window._hqPortalStep(slot)`** (E or the walk-in on a
  placed door — `_hqInteractTarget` / `_hqWalkThroughDoor` read
  `t.door.portal` first): no twin → NO TWIN; the twin in this room →
  `hq.portalHop` (no rebuild); another room → `_hqGoRoom(twin.room,
  'portal:<slot>')` — the ordinary room change, landing at the twin.
  **`window._hqPortalIssue()`** = the Quartermaster's signature: the
  QUARTERMASTER door panel in the hall grew a row (⌂ THE PORTABLE
  THRESHOLD · DOOR ISSUE · KEYHOLDER + 24 KEYS · YOU HOLD n · AVAILABLE /
  KEYHOLDER ONLY / KEYS SHORT / ON YOUR MANIFEST · SIGN FOR IT ▸ −24
  KEYS, `[data-portal-issue]`), the walker learns it in place
  (`hq.portalIssued(true)`). The prompt reads [E] STEP THROUGH. The strip
  pill **`#hqPortal`** (⌂ THRESHOLD A·B · DRAWN; click = draw / holster,
  `window._hqPortalDraw`) shows once issued; the pause menu's OFFICER
  sheet has a THE THRESHOLD row; the hints strip shows F · CLICK · Q
  while drawn (`.hq-hints.portal`). Dev: `?portal` / `window.
  EW_HQ_PORTAL` force the issue (`_hqPortalForce`; the forced record
  files `issued` on the first placement so it reads whole).
- **Decided the way the section said (row 31 REC):** the Quartermaster
  issues it at KEYHOLDER for 24 Keys. NOT taken: "the first door free at
  intake so the tutorial can teach it" — one door alone opens onto
  nothing, and the tutorial has no door-gun lesson yet; when 4.3 grows
  one, `hqPortalStatus`'s `force` is the hook. The alt (both doors on
  day one, the puzzles are the gate) is one line: `issued: true` by
  default in `hqPortalRecord`.
- **Not built (9.5 stage 2+):** the `hard` finds' reach is REAL now
  (a wall cell two levels up is a surface the ray lands on) but UNSEEN —
  `hq-finds.test.js`'s `hard` rule is still "two levels up"; declared
  roofs (`shells[id].roofs`) and 9.2's galleries (`stairAt: null`) wait on
  their own stages; the leaf swing's sound on a placed door is the buzz
  only; no placement on a bay ring's curved floor was refused by rule (the
  ray reads `_hqSurface`, which answers the corridor) — untested live; the
  Door Agent's Knock Knock stays the race's own object.
- **Tests:** `hq-portal.test.js` (8): the rules, the record + Portal's
  order, the issue (rank / keys / once / the ledger / the force), a
  placement (the issue, the room, finite numbers, the twin gap, A → B →
  A moves, the twin rides back, the leaf, the forced issue files itself),
  the leaf rule over every room (never a rank leaf, always a swing), the
  clear + the safe-room rule, the renderer's sites (the surface set, the
  blocker stop, every refusal, the free box-wall record, the blockers and
  their removal, the hop + latch, the rebuild, the tick, the API, the
  keys and the clicks), map.js's sites (one save, the step's two paths,
  E + the walk-in, the guarded enter opts — scene-lifecycle.test.js evals
  `_hqEnter` alone, the fresh-arrival clear, the Quartermaster's button,
  the pill, the prompt, the force, the officer row), index.html + CSS.
  `npm test`: 1332 tests, 1328 pass, 0 fail, 4 skips (the four
  pre-existing). hq-floors.test.js pins the walker's key line — F sits
  before Q in it.
- **Unseen live (RULE #1c):** the ghost's read against a lit floor, the
  frame's scale beside a room door, the leaf's swing on approach, the
  cross-room landing's heading, the hop's flash, a door placed on a
  climbed site cell or a couch top, the pill's states. PLAYTEST_NOTES
  "THE DOOR GUN" says what to walk first.
- **Delivery:** `ENTROPY_WARS_HQ_DOOR_GUN.zip` — data.js,
  three-renderer.js, map.js, styles-base.css → R2; index.html
  (`?v=20260915-hq-portal-01-cors`) → Render; hq-portal.test.js, this
  file, DOOR_MASTER.md, PLAYTEST_NOTES.md, CLAUDE.md → the repo.

### 2026-09-15 (rev 12) — Phase 9.1 stage 1: THE FINDS + THE TAPES ship — a hundred cassettes and the envelopes, the shelf in Room 360 (data.js, three-renderer.js, map.js, index.html, styles-base.css; hq-finds.test.js; local, not deployed)
Baseline: the rev 11 tree (the dungeon). The user: "Continue the DOOR HQ
Build Plan". The reviewed order's next row after the wells and the cave
is **9.1 THE FINDS**, and its stage 1 ships as REC'd: TAPES + PAY only.
- **The brief (9.1):** glowing, sparkling hidden objects to pick up —
  hazard pay, potions, held items — and a COLLECTIBLE over the whole
  world, a hundred of them: VHS TAPES carrying the user's clips (anomaly
  evidence, the parents).
- **Built — the data (data.js, the block after `hqCaveFitRooms()`):**
  `HQ_TAPE_SHEET` (per site two tapes, per complex part one, per
  exploration-floor room one — [title, caption, kind]; Claude's DRAFT,
  every row `draft: true`, A15) → **`DOOR_TAPES`** (T001…T100 in
  siteRooms.built order, then the parts, then the floors: 38 × 2 + 11 +
  13 = 100; `where` = the room, `site` = the site for the hint rule,
  `clip: null` until the file is on R2 — `hqTapeClipUrl` never invents a
  path). **`hqBuildFinds()`** → `DOOR_HQ.finds`: per tape room a
  `tape:Tnnn` row and ONE `pay:<room>` row (`daily: true`, 30 on a board
  room's walkway, 45 off the board rooms). Spots are GENERATED —
  `hqFindSpot` walks a 0.5 m grid and takes the free point FARTHEST from
  the way in (the first door's landing, else the spawn): free = inside
  the walls, off every floor prop's footprint (the flavour-prop rule),
  every native / agent / online seat, every counter's reach, every
  door's 2.4 m landing, the spawn, a mast, and (a cave) on a walkable
  cell the first door reaches, (a board room) off the board + the moat;
  the rules RELAX in two steps for a small room (`HQ_FIND_RELAX`); the
  cold room (4 × 4, hooks over the floor) is hand-pinned in
  `DOOR_HQ.findSpots` — the envelope on its shelving (`y`). A site's
  SECOND tape is ON THE BOARD (`hqFindBoardSpot`: a WALL cell two levels
  up when the board has one — **`hard: true`**, the walker cannot climb
  it, 9.5's door gun will — else the highest climbed cell, else a plain
  cell far from the way in; never a fluid, a monument, an object or the
  battle marker; `cell` + `y` = the cell's top). 29 of the 38 are hard.
  `potion` / `item` / `cube` are RESERVED kinds: `hqCollectFind`
  refuses them (`unsupported`) until an inventory owner exists — the
  review's "find ownership" row; nothing fakes a reward.
- **Built — the rules:** `hqFindsInRoom(roomId, profile, now)` = the
  rows minus the taken minus the dark dailies (`hqFindLiveToday`:
  `hqHash(date|id) % 3 === 0`); **`hqCollectFind(profile, id, now)`**
  writes the claim AND the pay into the profile object handed in
  (`door.hq.finds = { taken: { id: true | date }, tapes: [ids], pay }`,
  `account.gold += amount`) and returns the beat — the CALLER saves once
  (map.js `_hqTakeFind`: load → collect → `saveProfile` → wallet
  refresh; never `creditLocalGold`'s second load — the review's one
  transaction). `hqTapeCount` (the pill), `hqTapeShelf` (the hundred
  with `found` / `hint` / room / clip: an unfound spine reads its ROOM
  once another tape of the same SITE is on file — the sibling on the
  board, the cave's other chambers).
- **Built — the renderer (three-renderer.js):** procs `find_tape` (a
  cassette on its long edge, leaning back, spool windows, a label with a
  magenta band), `find_pay` (a manila envelope, the red string clasp, a
  stamp), `tape_shelf` (the library's shelving: five shelves of
  instanced spines in cassette blacks, labels on half, gaps where a tape
  is out, a card on top); **`_hqPlaceFinds(room)`** after the props:
  each row's proc under a SPARKLE (`_hqFindSparkle`: an additive ring, a
  white core, six orbiting motes on a ticker, a point light in the
  kind's colour — magenta / gold — `HQ_FIND_LIGHT_MAX` 4 per room), a
  walkway find nudged off a setting's pieces (`_hqSettingFreeSpot`), a
  board find on its cell's top, a cave find on its cell, a pinned `y` on
  its shelf; `_hq.finds` records them; `_hqFindTarget` offers the
  nearest within `HQ_FIND_REACH` (1.6 m, |Δy| ≤ 1.8 — a wall find two
  levels up is never offered) as kind **`find`**; `hq.takeFind(id)`
  drops it in place with a burst (twelve motes up and out, a flash, 0.7
  s) — no rebuild. Dev: `EW_HQ_FINDS_ALL` builds every row of the room,
  `EW_HQ_NO_FINDS` none.
- **Built — the flow (map.js):** E on a find → `_hqTakeFind` (no panel,
  the walk never pauses): the transaction, then the beat — a tape: the
  level-up chime + the DOOR stamp + a strip TOAST (`#hqToast`, "TAPE n /
  100 · title · FILED"); pay: the confirm chime + "+n HAZARD PAY". The
  prompt reads **[E] TAKE**. The strip pill **`#hqTapes`** (TAPES n /
  100; click = the shelf from anywhere, `_hqOpenTapes`). **THE SHELF**:
  Room 360 grew a counter `shelf` (east wall, by the astronomer's desk;
  the south shelving became the `tape_shelf` prop) → `overlay: 'tapes'`
  → `_hqTapesHtml`: a CRT frame (the set: a found tape's clip as an
  `<img>` / `<video loop muted>` with the OSD + tracking bar; a blank
  cassette plays STATIC — "NO CLIP ON FILE"; an unfound one "NOT ON
  FILE" with its LAST SEEN room when hinted), the cassette's card (title
  · room · kind · caption), the hundred as a 10 × 10 grid of spines
  (found = labelled, banded by kind; hinted = gold dashes; missing =
  dim), a click puts that cassette in the set (the panel re-renders in
  place). The pause menu's OFFICER sheet has a THE TAPES row. ONE home
  (C-27): the projector still replays, the shelf is the tapes'.
- **Not built (9.1 stage 2+):** potions / items / cubes (reserved kinds
  — the Quartermaster's inventory contract first; Part C row 26 for the
  cubes), the `hard` finds' reach (9.5), the TV proc that plays the last
  tape (a VideoTexture — a stage-3 nicety), thumbnails, the tapes'
  clips (the user's, R2 `Assets/door/tapes/`), the real titles and
  captions (the user's, A15).
- **Tests:** `hq-finds.test.js` (8): the hundred (ids in order, real
  rooms, never the hall / the foyer / a lobby / a corridor, two per
  built site, one per part, drafts, no invented clip), every tape's find
  + every room's cache + only the two kinds, every spot inside its room
  clear of every blocker / native / counter / landing / mast and apart,
  a cave find on a reachable dry cell, a board find on its cell with
  `hard` ⇔ two levels up and off the marker + the monuments, the daily
  roll (a tape always live, a cache on ~a third of the days), the
  collector (once ever / once a day / dark day / the pay into the SAME
  object / reserved + unknown refused), the shelf's hint rule, and the
  source sites (the renderer's placer / scan / API / three procs;
  map.js collect → save → drop with no `creditLocalGold`; the pill, the
  toast, the CSS, the catalogue, the shelf as ONE home). `npm test`:
  1324 tests, 1320 pass, 0 fail, 4 skips (the four pre-existing skips).
- **Unseen live (RULE #1c):** the sparkle's read across a dark room, the
  cassette's lean, the shelf's spines against the Observatorium's
  light, the toast over the prompt, a `<video>` in the panel's CRT once
  a clip lands, the burst. PLAYTEST_NOTES "THE FINDS" says what to walk
  first.
- **Delivery:** `ENTROPY_WARS_HQ_FINDS.zip` — data.js,
  three-renderer.js, map.js, styles-base.css → R2; index.html
  (`?v=20260915-hq-finds-01-cors`) → Render; hq-finds.test.js, this
  file, DOOR_MASTER.md, PLAYTEST_NOTES.md, CLAUDE.md → the repo.

### 2026-09-15 (rev 11) — Phase 9.3 stage 2: THE DUNGEON — every cave chamber is a CAVE GRID (data.js, three-renderer.js, index.html; hq-cave.test.js, doorhq.test.js; local, not deployed)
- **The brief (the user, with Pokémon Victory Road maps and an
  isometric dungeon):** the cave was "all the doors just by each other
  in an open area"; the dungeons should be the 3D Victory Road —
  branching routes, several entrances and exits, bridges, waterfalls,
  ledges you find the ramp or stairs for, running water and lava, big
  open caves you get lost in and see the tunnels off, with the portal
  gun and skateboarding in mind. Get the underground right first.
- **Built — the engine:** a `kind: 'box'` room may carry `cave: { rows,
  legend, floor, ledge, rock }`, an ASCII grid that IS its floor.
  `hqCaveCompile` (data.js, after the links refresh) compiles it: one
  cell a tile (1.75 m), one LEVEL half a tile (0.875 m — the walker
  climbs one per step, so a ledge two levels up needs its ramp); the
  standard legend `HQ_CAVE_STD` (rock · floor 0–9 · `~` waded water ·
  `W` deep · `L` lava · `P` the terrace pool · `Y` the lava lake · `=` /
  `B` / `H` bridges · `@` / `O` obsidian · `K` crystal · the 24 ramp
  letters a–x by direction and base level). `hqCaveFeet` is the walker's
  feet (a ramp interpolates, a pool wades, a bridge is its deck),
  `hqCaveDoorY` a door's sill (its lane's level — a door on a ledge is a
  door you climb to), `hqCaveReach` the walker's step rule as a BFS.
  three-renderer.js `_hqBuildCave`: instanced tops / ledges / a jittered
  rock border to the ceiling, ramp wedges, bridge decks with rope rails
  (`_hq.rails` — 9.8's first registry), fluid pits with the battle's
  animated sheet per key (water and lava ticked together), waterfalls
  where a sheet meets a lower one, one point light per lava lake,
  crystal glows, stalactites; `_hqSiteFloorY` is the ONE feet read for
  `_hqSurface` / `_hqAirOK` / the landing / the camera (the boom never
  enters rock); doors, ways, counters, props and natives stand on their
  cell; the box shell draws no floor under a grid. Procs `cave_torch`,
  `crystal_cluster`.
- **Built — the dungeon:** THE CAVERN (52 × 42 m, 30 × 24 cells, 11 m
  high) on three tiers: the SW floor (the well room's door, the
  portcullis), the ramps up to THE TERRACE with its pool, the pool's
  stream cutting the terrace and FALLING to split the floor (the ford
  under the fall is the dry-shod way to the SE floor and the adit's
  door), the ramps up to THE WEST SHELF and up again to THE HIGH TIER
  with LEVEL −6's bulkhead, the rope bridge over the pool to the spur of
  THE HOT SHELF, its lava lake, the obsidian bridge and the causeway to
  the fissure's arch, THE HALL under the shelf with the river along its
  edge, the stair up to the terrace's east end, THE LONG RAMP up the
  east wall, the river's south leg with the plank bridge to the east
  bank and the mouth's door. THE WELL ROOM on three tiers (the cellar's
  and the garden's wells on the north shelf, the wishing well and the
  ranch's on the floor round the sump, the castle's and the cistern on
  the crag — the wells' link ends moved). THE FISSURE: a lava channel
  with two obsidian causeways. LEVEL −6: the cut with its poured
  platforms. THE CRYSTAL ADIT: a stream with one plank. THE MOUTH: the
  floor, a pool, the ramp up to THE LIP where the exit stands (the link's
  near end moved to the east wall). THE OUBLIETTE: cells sunk a level
  either side of the walk, a ramp down into the first. THE PARK RULE in
  a cave = a rail run + a slope cell.
- **Tests:** hq-cave.test.js grew THE DUNGEON: the sheet (every chamber
  a grid the shell fits, the rock border open only at lanes, the legend
  complete, every sheet known), the solver (from every door every other
  door under the walker's rule; every lane three dry cells at the sill's
  level; the spawn, the natives and every floor prop on walkable cells;
  ≥ 3 doors on ledges; the cavern wears all of it; the wells on three
  tiers), the renderer sites and the wedge. doorhq.test.js: the wade
  guard moved to `_hqSiteFloorY`; the two new lights. `npm test`: see
  the delivery line.
- **Unseen live (RULE #1c):** all of it — PLAYTEST_NOTES "THE DUNGEON"
  says what to walk first. A scratch build on real three r128 ran every
  chamber (the cavern: 343 meshes, 562 instances).
- **Still open:** a rock CEILING mesh (the box ceiling + stalactites
  stand in), flowing streams (the sheets drift in place), the door gun's
  surface set from the grid (9.5), the roamer (9.4), the tapes (9.1).
- **Delivery:** `ENTROPY_WARS_CAVE_DUNGEON.zip` — data.js,
  three-renderer.js → R2; index.html (`?v=20260915-hq-dungeon-01-cors`)
  → Render; hq-cave.test.js, doorhq.test.js, this file, DOOR_MASTER.md,
  PLAYTEST_NOTES.md, CLAUDE.md → the repo.

### 2026-09-15 (rev 10) — Phase 9.3: THE WELLS AND THE CAVE ship — every well drops into one cave with four ways out (data.js, map.js, index.html; hq-cave.test.js, hq-world.test.js, hq-complex.test.js, hq-floors.test.js, doorhq.test.js; local, not deployed)
Baseline: the rev 9 tree (the suites). The user: "let's continue with the
DOOR HQ build plan". The reviewed order's next row after the suites is
THE WELLS + THE CAVE (rev 8's 9.3 stage), and it shipped as REC'd: the
cave is a COMPLEX of Hollow Earth's, not a site of its own.

**THE CAVE** — seven hand-authored box rooms in `DOOR_HQ.rooms`
(data.js, the block right before H-WING), every one wearing `site:
'prebuilt_hollow_earth'` + `part` and NO `roomNo` (`hqRoomNo` reads the
threshold's 180 through `site`; the register still lists Hollow Earth
once; `hqRoomSite` answers 180, so 9.4 knows all of it is WILD):
- **`_shaft` · THE WELL ROOM** (16 × 12) — six stone well heads standing
  FREE on the floor, one per well in the world, each facing its own way
  out so climbing out of the wrong one is how you learn the map; the
  gallery through the west wall.
- **`_gallery` · THE GALLERY** (24 × 10) — the crossroads: the well room
  west, the fissure and the blast door north, the adit and the
  portcullis south, the mouth east; the crossroads sign nobody trusts,
  the stream's rail, the scree ramp, an EXIT sign Facilities will not
  explain.
- **`_vent` · THE FISSURE** → Room 666 · HELL (a `leaf_hell_arch` in the
  rock, obsidian floor, the draught going the wrong way).
- **`_blast` · LEVEL −6** → Room 555 · D.U.M.B. (the rock cut square, a
  `leaf_bulkhead`, a dead camera whose light is on, a keypad, a sign-in
  sheet whose last date is the base's first).
- **`_adit` · THE CRYSTAL ADIT** → Room 88 · AGARTHA (a `leaf_frame_only`,
  the crystal floor, the warm light that is not a torch; they cut toward
  the cave and stopped a metre short, and something opened the last metre
  from this side).
- **`_mouth` · THE CAVE MOUTH** → Room 180 · HOLLOW EARTH's own board
  room — the complex's way in and out, under the inner sun.
- **`_oubliette` · THE OUBLIETTE** — the dead end behind the portcullis:
  two cells, the chains, the stocks, the crates (9.1's best hiding place),
  and THE FOURTH CELL NOBODY COUNTS, a secret wall shared with Room
  24601's west side (the dungeon's cells moved to z −3.2 / −1.0 / 1.2 to
  free the panel at z 2.7; the eighth secret door).

**THE WELLS (six, `route: 'undercroft'`, `way: 'well'`)** — the garden
(1618, a free end on the gravel ring beside the fountain: the facility's
own way down, the H-Wing → Backrooms precedent for a safe room seaming
into a wild one), the Haunted House's cellar (rev 6's row RE-POINTED, not
duplicated — `haunted_hollow` is now `well_cellar` and lands in the well
room), Camelot's courtyard, Skinwalker Ranch's yard, Nuketown's wishing
well and Göbekli Tepe's cistern (the four sites on their board rooms'
free north lanes). Two small engine additions carried it: a link END may
name its own **`sub`** and **`verb`** (`hqLinkDoors`; the heads read THE
GARDEN WELL · CLIMB UP instead of the kind's DOWN THE ROPE — map.js's
prompt reads `t.door.verb` first), and **`hqRefreshComplexLinks` now also
refreshes any hand-authored room a link names outright** (`end.room`), so
the garden grows its well door the same way a complex part does.

**THE UNDERCROFT** (`DOOR_HQ.routes.undercroft`, dashed) is the tenth
line: ten legs, every one touching HOLLOW EARTH — a hub, drawn in the
directory's WORLD tab like any other line. 41 links now.

**The lane rules that moved.** Agartha carries FOUR link doors (the
fourth at x −14.5, 4.5 m clear of the third and inside its 35 m room), so
hq-world.test.js's cap is ≤ 4 with an explicit ≥ 4.4 m lane check on
every pair; and a `way` on a site room may hang in ANY free lane west of
centre (it was `x ≤ −4`, written when the only far-end seam was at −5).

**Tests.** New `hq-cave.test.js` (8 tests): the sheet, the wells (one head
per row, no two heads within 1.6 m, the plate line + CLIMB UP, the
re-pointed cellar, the garden's landing clear of the fountain), the four
exits (a live pair each, the far lane legal and uncrowded), the complex
connected from the mouth with nothing leaving it but a `links` row or the
one secret door, THE UNDERCROFT (ten legs, all on the hub, both graph
edges per link), the PRODUCTION landing on every door AND every well head
(inside the walls, facing along the doorway's normal, clear of every
blocker and native, never on another head), THE PARK RULE + the cave's own
light, and the fourth cell (eight secret doors, the pair, the cells off
the panel, the landing). Updated: hq-world.test.js (the seams are the
wardrobe + six wells; the lane rules; the graph's well edge), hq-complex
.test.js (the house's parts are filtered by site; the cave is asserted as
the second complex), hq-floors.test.js (eight secret doors and the new
pairs string). Full suite **1,309 pass / 0 fail / 4 skips**; syntax
152/152.

**Not done / next.** (SHIPPED as rev 11, above: the cave grids — a `cave.rows` on a box room, not a `kind: 'cave'`.) The cave's stage 2 (a ROCK shell — `kind: 'cave'` —
and the stream as a waded sheet; the shaft's ankle-deep water is a note,
not geometry, today); the oubliette's ROAMER waits on 9.4 and its tapes
on 9.1; the star chart's route lines; the other eight `way` kinds; the box
GALLERY (8.4's third ring). UNSEEN LIVE (RULE #1c): all seven chambers —
six well heads in one room (the rig is the rev 6 `well` builder, never
tested six at once), the cave_wall / cave_floor terrain sheets on a box
shell, the portcullis and hell arch as interior doors, and the fourth
cell's slab in Room 24601's tinted dungeon wall.

### 2026-09-15 (rev 9) — Phase 9.3: THE SUITES ship — three department lobbies, three doors off the rings (data.js, map.js, index.html; hq-suites.test.js, doorhq.test.js; local, not deployed)
Baseline: repository main `69ef93b` (the routes and the WORLD tab are in
it). The user: "let's continue with the DOOR HQ build plan". The reviewed
order's open item after the routes is THE SUITES — the crowding move the
9.3 section calls for and the review sized at −2 ground / −1 mezzanine.

**What shipped.** Three hand-authored box LOBBIES in `DOOR_HQ.rooms`
(data.js, the block right after `padded`), each wearing NO `roomNo` — a
lobby, like the foyer and the penthouse, so `hqRoomRegister` skips it:
- **`medwing` · THE MEDICAL WING** (9 × 5.2 m, the ward's hospital green
  carried into the corridor) behind the ground ring's hospital door at
  **210°**. Doors: `ward` (north) → Room 1111, `interrogation` (east) →
  Room 1984, `egress` (west) → the hall. Room 5150 stays behind the
  ward's own cell door — a room keeps its back rooms.
- **`recwing` · THE RECORDS WING** (9 × 5.2 m, Room 42's manila over
  green linoleum) behind the wired double door at **240°**. Doors:
  `records` (north) → Room 42, `clockroom` (east) → Room 247.
- **`execwing` · THE EXECUTIVE SUITE** (8 × 5 m, claret carpet) behind
  the mezzanine's house door at **315°**. Doors: `trophycase` (west) →
  Room 111, `continuity` (north) → the Bureau.

**What did NOT move** (the review's rule — "suiting rooms must preserve
incoming `at` ids, return routes, counter homes, cast locations, gates
and remembered landings"): every moved room keeps its own `egress` door
id, its leaf, its `wide`, its counters, its cast and its number — only
the FAR END of that door changed, from `central_egress@<id>` to the
wing. The three hall doors keep their ids (`medical` / `records`; the
mezzanine's is the new `executive`), so a remembered landing still
resolves. **THE BUREAU'S GATE AND NUMBER STAY ON THE BUREAU'S OWN DOOR**
(GATEKEEPER + 24 Keys, `№ — CONTESTED`), which now hangs on the suite's
north wall: the suite itself is ungated, so a recruit walks it, reads the
notices and still does not go in — exactly the 4.4 reading. `hqRoomNo
('continuity')` still finds that number (the helper scans every room's
doors), and the register lists it once, under `execwing`.

**The one non-data change.** map.js's door panel put the motto and the
canon notices on `d.id === 'continuity'` — "readable from the hall at any
rank" (rev 2's promise). The Bureau's door is one room deeper now, so the
condition is `d.id === 'continuity' || d.id === 'executive'`: the suite's
door in the hall carries the same three rows.

**The rings.** Ground: 13 → **11 doors** (225° and 255° are free wall —
the Clock Room's and the Interrogation Room's angles). Mezzanine: 11 →
**10** (290° free — the Trophy Case's). Nothing was added to fill them;
the piers are simply longer, and the tests now assert the gaps instead of
the old two-metre piers.

**Tests.** New `hq-suites.test.js` (6 tests): the lobbies and the
register, one hall door per department + the three freed angles + the
door counts, full reversibility (every room's way out lands on the lobby
door that opened it, same leaf both sides, the plate reading its number),
the gate and the number on the Bureau's door + the map.js notice rule,
C-27 (a lobby launches nothing; Challenge / Codex / achievements / Form
365 / the transcript each still exactly one home), and the PRODUCTION
landing on all nine lobby doors (`_hqBoxWall` + `_hqGoTo` on a stub
scene: inside the walls, facing into the room, clear of every prop, agent
and spot) plus THE PARK RULE (a `railing_1m` run in each; the ramp waits
on 9.8). Eight assertions in `doorhq.test.js` moved from the ring to the
wing that now holds the door; the Records plate test asserts BOTH that
the wing's inner door reads 42 and that the hall door reads nothing (a
wing wears no number). One layout fix the landing test caught: the
suite's couch / table / rug sat in the Bureau door's lane at x 2.2 and
moved to 2.7. Full suite **1,305 / 1,301 pass / 0 fail / 4 skips**;
syntax 151/151.

**Not done / next.** THE WELLS + THE CAVE (rev 8's 9.3 stage — the next
row in the reviewed order); the star chart's route lines; the other eight
`way` kinds; the box GALLERY (8.4's third ring, which is the renderer
half of this crowding move and still waits on 9.2 stage 2); 9.1 finds.
UNSEEN LIVE (RULE #1c): all three lobbies — the hospital green in a
corridor, the executive suite's two house doors (the suite's and the
Bureau's, which is the joke the Bureau has already corrected once), the
landing through a WIDE door (the wing's wired double and frosted doors
are the first wide doors in a small box room), and how the extra press of
E reads on the way to a room you used to reach in one.

### 2026-09-15 (rev 8) — Phase 9 grows: THE WELLS + THE CAVE, THE ROOFTOP, TARTARIA, THE BERMUDA TRIANGLE, and (super optional) WATER POLO (docs only; no game files touched)
The user, one message: the well belongs in the GARDEN and should lead to
the cellar or a CAVE SYSTEM / underground dungeon with several exits —
Hell, D.U.M.B., Agartha, Hollow Earth, etc.; the Haunted House's cellar
well stays but leads to the cave too; more than one well "to make it
easier". Three more places: the DOOR HQ ROOFTOP ("it's not what you'd
expect"), TARTARIA (the lost advanced civilization), THE BERMUDA
TRIANGLE ("it's a right triangle"). And, super optional after
skateboarding, WATER POLO in the natatorium using the user's water polo
repository.
- **9.3** gained THE WELLS AND THE CAVE: the `well` seam becomes a hub
  — every well drops into one cave complex (REC Hollow Earth's,
  `site_prebuilt_hollow_earth_cave_*`, wild by construction) with a WELL
  ROOM (one head per well, climb out of any), a gallery, four exit
  chambers (Hell's fissure, D.U.M.B.'s sixth side, Agartha's adit, the
  cave mouth onto Hollow Earth), an oubliette for the tapes and 9.4's
  first authored roamer, and a new dashed route THE UNDERCROFT. Six
  wells REC (the garden, the cellar re-pointed, Camelot, Skinwalker,
  Nuketown, Göbekli). Tests named. Nothing new in the renderer for
  stage 1.
- **7.3 / 7.7**: 1812 · TARTARIA (Ancient; the buried fair city, the
  sinking bowl, the free-energy towers, the Bureau's first site notice)
  and 345 · THE BERMUDA TRIANGLE (Hollow; the board's water IS a right
  triangle, the `sea` moving map, Flight 19 as a flyover, the weir's
  re-point). **7.4**: R · THE ROOFTOP above the penthouse, the twist
  the user's to write (three drafts: the wrong sky, the painted floor
  plan, the helipad board).
- **9.9** (new): WATER POLO — port the `waterpolo` repo's `src/sim`
  (headless, fixed-step, command-driven — the same architecture rule as
  ours) as one block in map.js, draw it with the natatorium's own
  builders and rigs, a `polo` variant of the room, the walker as a
  swimmer, VS CPU, viewer-local; a drift guard against the repo's commit.
- **9.7** rows 33–36 added; the header bumped to rev 46; DOOR_MASTER
  Part C rows 33–36 + a Part D entry. Nothing built, nothing decided.

### 2026-09-15 (rev 7) — Phase 9.3 expansion: THE ROUTES and THE WORLD TAB ship — 28 more doors, nine lines, a subway map in the directory (data.js, map.js, styles-base.css, index.html; hq-world.test.js, doorhq.test.js, hq-complex.test.js, hwing.test.js; local, not deployed)
Baseline: repository main `bc07ddb` (the seams are in it). The user:
"continue with the DOOR HQ build plan". The reviewed order's next stage
after the first complex is the 9.3 EXPANSION — routes, suites, directory.
This delivery is the routes and the directory; the suites wait (a data
move that touches cast spots, gates and remembered landings — its own
delivery).
**What shipped.** `DOOR_HQ.links` (data.js) is the whole route table now:
32 rows — the pilot's two, the two seams, and 28 ordinary reversible
doors, every one with a `why` (Claude's DRAFT, A15). THE LUNAR ROUTE
gained Mars ⇄ the Moon (the rover bay's hatch) and Saturn ⇄ the
Singularity (a `leaf_frame_only` — the drop is the door; two-way, the
review's rule: no one-way route without a verified way back). THE DEEP:
the Dutchman ⇄ Atlantis (the hatch below the waterline — from the deck
until the hold is built), Atlantis ⇄ Hollow Earth, Atlantis ⇄ Agartha
(the drowned stair), Shasta ⇄ Agartha (the Lemurian tunnel), Hollow Earth
⇄ Hell (the way down is the way in), Antarctica ⇄ Agartha (the entrance
under the ice — added so the polar hole is on the line, not an island),
Antarctica ⇄ the North Pole (the two ends of one hole, a frame in both
ice walls). THE DIVINE STAIR: Heaven ⇄ Olympus (a gate of cloud), the
Vatican ⇄ Heaven (the archive's one-button elevator, `leaf_vault`), the
Vatican ⇄ Hell (the crypt's warm wall, `leaf_hell_arch`). THE BASES: Area
51 ⇄ D.U.M.B. ⇄ CERN (`leaf_wired_double`), CERN ⇄ the Backrooms (the
noclip, `leaf_frosted` — the second way into Bay 6's site beside H-Wing,
C-12; a `room` door is never sector-gated). THE WOODS: the Haunted House's
board room ⇄ Skinwalker Ranch (the garden gate, `leaf_barn`; the cellar
already has the well) ⇄ Bohemian Grove ⇄ the Fairy Forest. THE LEY LINE:
Stonehenge ⇄ Göbekli Tepe ⇄ Giza ⇄ Babel (frames), Babel ⇄ Technoticlan
(the other stair), Camelot ⇄ the Lodge (the Round Table's other room,
`leaf_saloon`). THE HIGHWAY: Nuketown ⇄ Downtown ⇄ the Strip ⇄ Cyberpunk,
the Stadium ⇄ Downtown (the parking structure). THE WONDERLAND: Flat
Lands ⇄ the Backrooms. **The Looking-Glass is on no line**: its room is
9.1 m across, a north door's 2.4 m landing sits on the board, and the
landing test refuses it — it joins when its room grows or the door gun
reaches it (9.5). The Derelict's two ends stay on its deck (the airlock
is unbuilt). No rank leaf on any link (doorhq's exclusivity test). Slots
were chosen by a scratch scan of every board room's north wall through
the production `_hqBoxWall` + `_hqGoTo` landing and the test's blocker
rules (≤ 3 link doors per room at x −0.2 / −5 / −10, lanes ≥ 4.4 m,
clear of the corner masts, the signboard at x 5 and the console lane).
**`DOOR_HQ.routes`** (before `links`) names the nine lines: `{ label,
sub, color, dashed? }`. **`hqLinkLive(link)`** (data.js, before
`hqLinkDoors`, on `window`) is the ONE liveness rule the door generator
and the routes share → `{ a, b, wearA, wearB }` or null (held at both
ends). **`hqWorldRoutes(curRoom)`** (after `hqWorldGraph`, on `window`)
= one row per route with a live link: `{ id, label, sub, color, dashed,
stations: [{ room, no, label, site, here, lines }], legs: [{ from, to,
fromRoom, toRoom, link, way, leaf, why, note }] }` — a STATION is a site's
board room (a seam off a complex's part is charged to the house: Room 13
is one station on two lines), the stations are walked depth-first from
an END of the line (a branch lists after the trunk), `lines.length > 1`
= an interchange, `here` = the viewer's room or anywhere in that site.
**THE WORLD TAB** (map.js `_hqWorldHtml`, called by `_hqDirectoryHtml`
under the register): per line a `.hq-world-line` card in the line's ink
(`--hq-line`), an SVG subway map (stations evenly spaced, a straight leg
between neighbours, a curved leg for a branch, `.hq-world-dashed` for a
seam / the seams line, a `.hq-world-ring` at an interchange, `.here`
filled, the room number under each dot, the leg's `why` as its title)
and the stations as rows (`_hqNoTag` + label · STOP / INTERCHANGE · the
other lines · GO = `data-room="site_<id>" data-at="egress"` — the
register's own rule; YOU ARE HERE for the viewer's). CSS: the "THE
WORLD" block before `.hq-starmap` in styles-base.css. `index.html` token
`20260915-hq-world-routes-01-cors`.
**Tests.** hq-world.test.js (+5, 14 total): every link live, no rank
leaf, every `route` named, every `why` written; every built site but the
Looking-Glass on a line, ≤ 3 link doors per board room on the north wall
in the slot band, `wide` agreeing with the leaf; `hqWorldRoutes` — a leg
per link, a station per SITE, the seams line `i,13,180` with the house an
interchange on `woods` + `seams`, `here` from the cellar / none from the
foyer / none for null, the Dutchman the deep line's end, Hell on two
lines, no station twice, every leg on its line; the world is ONE PIECE
(from the foyer every board room and every part along doors; the woods,
the deep and the lunar route end to end along links alone); `_hqWorldHtml`
extracted from map.js and RUN with the real `hqWorldRoutes` (an SVG per
line, a leg per link, the Moon filled once, YOU ARE HERE, GO to Saturn,
dashed seams, INTERCHANGE, no `undefined` / `NaN`) + the CSS classes. The
pilot test's hard counts became rules (4 lunar links; edges = links × 2).
Three older counts learned that links append after a room's own doors
(doorhq's `data-at="egress"` literal count 2 → 3; hq-complex's and
hwing's door lists filter `!d.link`). Full suite 1,299 / 1,295 pass /
0 fail / 4 skips.
**Not done / next.** THE SUITES (Medical, Records, Executive — data,
their own delivery); the star chart's route lines; the other eight `way`
kinds; the Dutchman / Spaceship complexes (the airlock takes the lunar
ends, the hold takes the Atlantis hatch); the box gallery; 9.1 finds.
UNSEEN LIVE (RULE #1c): every new leaf on its north wall (28 doors in 26
rooms — the frame-only leaves over an open edge, the wired double on
D.U.M.B.'s wall, the saloon door on Camelot's curtain wall), the WORLD
cards' length in the directory panel (nine SVGs + rows — a long scroll;
a tab strip is the next ask if it reads long), the subway map's ink on
the dark panel.

### 2026-09-15 (rev 6) — Phase 9.3: THE SEAMS THAT ARE NOT DOORS ship — the wardrobe into Camelot, the well into Hollow Earth (data.js, three-renderer.js, map.js, audio.js, styles-base.css, index.html; hq-world.test.js, hq-complex.test.js, doorhq.test.js; local, not deployed)
Baseline: repository main `6b3f36a` (the Haunted House complex is in it).
The user: "let's continue with the DOOR HQ build plan". The complex's log
left two props standing where 9.3's `way` seams would hang — the
wardrobe upstairs and the well in the cellar. They are seams now.
**What shipped.** `DOOR_HQ.ways` (data.js, before `links`) is the
catalogue of entryway kinds — `{ verb, sub, sfx, w, h }` — and the GATE:
`hqLinkDoors` holds back any `way` it does not list (never half a seam:
one unknown end holds the whole link back). Two rows: `wardrobe`
(CLIMB IN · THE WARDROBE · THROUGH THE COATS · `wayCreak`) and `well`
(CLIMB DOWN · THE WELL · DOWN THE ROPE · `wayWell`). Two links, route
`seams`: **haunted_camelot** — upstairs' east wall at z 0.4 (where the
office locker stood) ⇄ Camelot's north wall at x −5; **haunted_hollow** —
FREE in the cellar's floor at (−2.6, 1.6) facing east (where the fountain
stood, inside its guard rail) ⇄ Hollow Earth's north wall at x −5. Both
ends wear the same object (a wardrobe against Camelot's curtain wall; a
well head by Hollow Earth's cave wall — the far side is the ceiling, a
well can go up). `hqLinkEndOk` (a wall end, or `wall: 'free'` + x / z /
`face`) and `hqLinkEndWear` (the row's `way` / `leaf`, an end may
override with its own `leaf` = a plain door back, or its own `way`) are
the two new reads, on `window`. A seam door row carries `way`, `leaf:
null`, the kind's `sub`, the link's `why` / `note`, and for a free end
`x` / `z` / `face`. **Renderer**: `_hqBoxWall` answers a `'free'` wall
with the same { wx, wz, nx, nz, yaw } record (the object's own plane, its
heading the inward normal) so the scan, the press-in, `_hqGoTo`'s landing
and `_hqCamInDoorway` read it unchanged; `_hqWayBuilders` (right before
`_hqBuildDoors`) = `wardrobe` (a dark-wood carcass, two leaves on hinges,
a rail of six coats, a cold panel + glow behind them with a lamp post's
warm point in it, snow before the doors) and `well` (the stone head, the
frame the walker steps between, the windlass, the rope, the bucket, a
crystal light in the shaft); `_hqBuildWay` places the object at the wall
plane or the free spot, hangs the plate (`.hq-plate-way`) and pushes a
door record with `way`, no lamp (`_hqLampApply` guards the lens) and a
`motion` of `mode: 'way'` + `tick(k)` — `_hqTickDoors` drives it at 1.5/s
when the walker stands at it (the doors swing open, the bucket goes down
and the light rises) and the press-in fires at 0.55 like any swinging
leaf. **map.js**: the prompt reads the kind's VERB (`_hqWayCat`), the room
change plays its `sfx` (the strike plate's buzz is muted anyway).
**audio.js**: `wayCreak` (the hinge, the coats' brush, a breath of cold
wind) and `wayWell` (the ratchet, the rope, the fall of air, the far wet
note) at gains under the muted buzz's. `index.html` token
`20260915-hq-way-seams-01-cors`.
**Tests.** hq-world.test.js: the Lunar test reads its route; the far-end
landing test takes board rooms only and insists a seam stands on the
north wall west of the console lane; the held-back test now proves BOTH
ends are held when one is unknown, a listed kind builds, a per-end leaf
makes a plain door back, a free end without a face is malformed; THE
SEAMS test (catalogue ↔ builders diffed from the renderer source, the
recipes + gains in audio.js and not muted, every end paired with the same
object, the plate reading the far site's number, the props the seams
replaced gone and the rail kept, the free well's production landing 2.4 m
east of the ring facing east on nothing, the wardrobe's landing 2.4 m in
facing west, the renderer + map + CSS sites); the world graph carries 8
link edges and the house reaches Camelot; and the builders RUN on a stub
scene (a group, the rig, the opening ≈ the catalogue, the tick moves it).
hq-complex.test.js learned that a seam leaves the site through a `links`
row, reads the far number, and is never walked; doorhq.test.js accepts a
free-standing seam. Full suite 1,294 / 1,290 pass / 0 fail / 4 skips.
**Not done / next.** The other eight `way` kinds (mirror · pool ·
painting · fireplace · phonebox · screen · train · closet) each want a
builder + a catalogue row + a link; the WORLD tab; the suites; the
Dutchman / Spaceship complexes; the box gallery. UNSEEN LIVE (RULE #1c):
the wardrobe's doors clearing the cots, the coats' colours, the well's
ring under the walker's feet, the far well against Hollow Earth's cave
wall, the sounds' levels, the plate over a 2.3 m wardrobe in a 3 m room.

### 2026-09-15 — Phase 9.2 stage 1: THE HAUNTED HOUSE COMPLEX (data.js; hq-complex.test.js, hwing.test.js; local, not deployed)
Baseline: repository main `a8fb08f` (the 9.3 Lunar pilot is in it). The
user: "let's continue with the DOOR HQ build plan, The World". The
reviewed order's next stage is the first complex, the user's own example
(Part C row 29: the Haunted House first).
**What shipped (data only).** Four box rooms behind Room 13's board room,
in the block right before H-WING in `DOOR_HQ.rooms`: THE HALL (14 × 12 ×
4 m — the staircase up along the north wall with a three-metre banister,
the dais, the cellar door under the stairs, the hall table with its
candles, three torches, the ghoul), UPSTAIRS (15 × 8 — the landing with
its rail, the four beds as one room, THE WARDROBE on the east wall where
the 9.3 `way: wardrobe` seam to Camelot will stand, the pull-down ladder,
the ghost), THE ATTIC (8 × 6 × 2.4 — one bare bulb, the trunk for 9.1's
`hard` tape, a banister sawn off and stored) and THE CELLAR (12 × 10 —
THE FURNACE lit, the racks, THE WELL with its guard rail where the `way:
well` seam to Hollow Earth will stand, the coal chute's two tiers, a box
on trestles, the vampire). Doors: the board room's `house` (n wall, x
−7.5, `leaf_wooden` — the threshold's own leaf) ⇄ the hall's `front`;
the hall's `stairs` (an opening, `leaf: null`) ⇄ upstairs; upstairs'
`attic` (an opening) ⇄ the attic's `hatch`; the hall's `cellar`
(`leaf_coffee`) ⇄ the cellar's `stairs`. Every door is a pair; every
part is reachable from the board room; nothing in a part leaves the site
(a site ⇄ site seam is a `links` row, never a door row). Every plate in
the house reads ROOM 13 (`hqRoomNo` through `site`; the register lists
the house once). The rooms light themselves (`strips: false`, no
fluorescents, ≤ 10 prop lights each).
**The helpers** (data.js, the block before the built-rooms loop):
`hqComplexRoomId(mapId, part)`, `hqRoomSite(roomId)` (9.4's WILD read —
the facility is safe by construction: no `site` on it), `hqRoomPart`,
`hqSiteComplex(mapId)` = the board room + the parts in sheet order,
`hqComplexRooms()`, `hqRefreshComplexLinks()`. `hqLinkRoom({ site,
part })` now resolves to `site_<id>_<part>` when that room is authored
and to null otherwise (the review's rule: never manufactured). All on
`window` — `hqLinkRoom` / `hqLinkDoors` / `hqWorldGraph` were not
exported by the pilot and are now.
**Tests.** `hq-complex.test.js` (7): the sheet, the front door's lane on
the board room (the console, the signboard at x 5, the corner mast — the
hq-world harness's production `_hqBoxWall` + `_hqGoTo` landing),
reversibility + connectivity, every landing and spawn and native clear of
every blocker (catalogue rects and feet, `rect: false` honoured), THE
PARK RULE, the link hooks (a probe link on the cellar appears once
however often the refresh runs and leaves nothing behind), the source
sites. hwing.test.js's back-door loop accepts the array shape. Full
suite 1,292 / 1,288 pass / 0 fail / 4 skips.
**Not done / next.** The gallery (a two-floor room) — stage 2 renderer;
the Dutchman, the Spaceship (its airlock takes the Lunar ends), the urban
block; the seams that stand here as props (the wardrobe, the well) wait
on 9.3's `way`; the finds (9.1) have their spots (the trunk). UNSEEN
LIVE (RULE #1c): the wallpaper tints, the `leaf: null` openings, the
banister's facing, the boiler's glow in a 2.7 m cellar, the ladder
against the hatch.

### 2026-09-14 local / 2026-09-15 UTC — Phase 9 review and 9.3 Lunar pilot (local, not deployed)
Baseline: repository main `12f972aa9e733273aeaffcd2ce538ba117895a38`.
Reviewed recent Phase 9 additions against current data, navigation, renderer
and profile code. The implementation review at the start of Phase 9
supersedes optimistic cost, count and dependency assumptions below it.

`data.js`: `DOOR_HQ.links`, `hqLinkRoom`, `hqLinkDoors`, `hqWorldGraph`;
multiple `siteRooms.backDoors` with the legacy single-row shape preserved.
Moon ⇄ Derelict ⇄ Saturn are four ordinary bulkhead door ends on free
north-wall slots. Door labels and numbers derive from existing metadata;
no new dialogue. Both ends use the same link id as their return landing.
The generator omits unresolved/unsupported endpoints; repeated generation
clones actions and does not accumulate doors. Existing renderer landing
and setting-clearance paths are reused unchanged. New routes are open.
This is viewer-local HQ navigation for either player's client; no battle
state, network relay or economy fields changed.

Validation is recorded in HQ_VALIDATION.md. Browser appearance, GLB load
completion and actual controller traversal remain untested under the
repository's no-playtest-without-request rule. This is an upload package,
not a commit or deployment. Phase 9.3 remains PARTIAL: next, author the
first complex and its park features, then expand paired routes and move
the spaceship endpoints into the airlock. Suites, WORLD tab, third ring,
non-door entryways, finds, portal gun, encounters and skating remain.


### 2026-09-15 (rev 5) — Phase 9 grows: the seams that are not doors; optional skateboarding (docs only)
The user, two more: a wardrobe in the haunted house (or another suburban
house) that leads to Camelot, and "more doors like that that aren't
really doors" — and, optional, SKATEBOARDING: "the round railings and
rooms are perfect for grinding or making ramps and doing tricks in …
keep that in mind when designing new maps". Added to 9.3 a `way` kind
on a link row (wardrobe · mirror · well · pool · painting · fireplace ·
phonebox · screen · train · closet, one proc each, the same enter
trigger, ten first seams — the wardrobe upstairs in the Haunted House
opens on Camelot's snow) and a new 9.8: a walker MODE, never a game mode
— `_hqRide` momentum, grinds locked to the rails the builders already
make (`_hq.rails` / `_hq.ramps` registries), ollies off lips, trick keys
in the air, a combo line on the strip, nothing on `state`; and THE PARK
RULE, in force for every new room from now: a rail and a ramp per big
room, a loop worth more than a jump. Part C rows 28 and 32 updated.
Nothing built.

### 2026-09-15 (rev 4) — PHASE 9 PLANNED: THE WORLD (docs only; no game files touched)
The user's brief, five things: hidden glowing pickups and a hundred
collectible tapes or cubes (the tapes his own gifs of ghost / UFO
footage, or clues about the parents); sites that are whole buildings
(the mansion with floors, the ship's decks, a bigger urban block); too
many doors in the hall — a third ring, but really CONNECTION: a door in
one map that leads to a related map (the Moon ⇄ the Spaceship ⇄ Saturn,
the Dutchman's bottom ⇄ Atlantis), "make this game feel like its own
WORLD"; eventually a roaming enemy you attack and the room you stand in
becomes the 8×8 board; and two placeable doors like a portal gun —
puzzles and an escape rope. Written up as **§4 Phase 9** with the data
shapes, the renderer stages, the tests, the assets and seven decisions
(Part C rows 25–31). What it builds on, verified in the code this
session: `siteRooms.backDoors` already appends a second door to a site
room (it becomes an array); a room is one scene and a door a rebuild
(so a complex costs nothing at once); the crossing's `_introBuildDoor`
is the freestanding threshold the door gun needs; left click in the
walker only grabs the pointer lock (free); `loadLastParty` is a whole
party for an encounter to start with; the natives already stand on
every walkway with a race hint; `hqHash` seeding and the Key celebration
kit are the finds' roll and beat; three-camera.js has no initial-pose
API (the one new entry point the seam needs). The hall's count today:
13 ground doors, 11 mezzanine. REC order 9.3 (the graph + suites, data
only) → 9.2 (the complexes; the box-room gallery is the renderer stage
that also pays for the third ring) → 9.1 (the finds) → 9.5 (the door
gun) → 9.4 (the encounter). Nothing built; DOOR_MASTER Part C rows
25–31 + Part D carry the decisions and the log.

### 2026-09-15 (rev 3) — THE PAUSE MENU, THE LAST ROSTER, THE LANDING (map.js, state.js, battle.js, three-renderer.js, index.html, styles-base.css; hq-pause.test.js)
The user, three things: "Escape pauses the game, but something still has
control of my mouse and I can't click anything"; "a completely new
redesigned pause menu — standard AAA JRPG, matching the aesthetic — with my
current party (whoever I took into battle last), click them for stats and
spells"; "whenever I walk through doors, the door I came through is
covering the screen and I have to move forward a little".
**The mouse.** ESC ran `_hqOpenSettings` → `_openMainMenuSettings` →
`_showTitlePage('settingsPage')`: the Settings PAGE slid over the HQ PAGE,
the HQ page went `exit-left` (opacity 0, a fade) under it, and the walk was
suspended with the pointer lock released — a page swap under a live 3D
host, with the settings page's focus trap and the walker's late lock
requests in the mix. Replaced outright: the menu is an OVERLAY inside
`#hqPage` (`#hqPause`, z 35), the walk pauses in place (`_hqSuspend` →
`setPaused(true)` → the lock is released; `exitPointerLock` again for a
late grant; `_hqOnLockChange` already returns a lock that lands while
paused), the overlay owns the cursor (`cursor: default; pointer-events:
auto`). No page moves.
**The menu** (`_hqOpenPause`, `_HQ_PAUSE_CMDS`): a head strip (PAUSED · the
room · officer + clearance · Hazard Pay · Keys · Stabilized · day streak ·
the canon date), a command column on the left (RESUME · PARTY · OFFICER ·
SETTINGS · DIRECTORY · EXIT, the cursor row lit gold, EXIT red at the
foot), the sheet on the right, a key-hint foot. PARTY is a grid of round
portrait cards (portrait, else the R2 sprite) → a member's sheet: the face
large, identity + Lv, the eight stat bars, MOVE / RANGE / INSPECT, type
chips, ABILITIES (category-coloured rows: MP · AP · RNG · PWR + the desc),
PASSIVES, GEAR, ITEMS; ◂ ▸ walk the roster. OFFICER is the file with
buttons into the ID card / the trophies / the board. SETTINGS is the main
menu's own settings body rendered INTO the overlay (`_renderMainMenuSettings`
takes `window._hqPauseSettingsBody`; `_openMainMenuSettings` — the buttons'
rerender hook — re-renders in place while the menu is up). DIRECTORY drops
the menu for the directory panel; EXIT is the strip's EXIT.
**The roster.** Nothing recorded "the party you took into battle last", so
state.js `recordLastParty` / `loadLastParty` (`ew_last_party_v1`) now do,
called from battle.js `startMatch` for a standard match (the human seat —
online the local seat). The menu rebuilds each member with the real
`createUnit` so the sheet shows what the engine would field (level, sec
job, tree-legal spells, gear bonuses).
**The landing.** `_hqGoTo` stood the walker 1.6 m in front of the door; the
third-person boom (3.6 m back) marched in to the first clear point, and
`_hqCamBlocked` only knew the WALL plane — so the eye stopped in the
doorway, behind the open leaf. Now `_hqCamInDoorway` blocks a slab 1.5 m
deep on the room side of every door (opening + swing wide, door height) and
the landing is 2.4 m in (2.6 on a curved wall): the eye stands in the room
on arrival and eases back as you walk.
Tests: `hq-pause.test.js` runs the recorder (seat rule, blank-slot drop,
online seat) and the doorway blocker (a flat-wall door and a rotunda door,
both sides, over the door) in vm sandboxes, then guards every site;
doorhq.test.js's `onEscape` prefix still matches. UNSEEN LIVE (RULE #1c):
all of it — first eyeball ESC from a pointer-locked walk (the cursor must
be back at once), the party cards' portraits, the settings body inside the
sheet, a landing through the foyer's revolving door and a bay's wide door.

### 2026-09-15 (rev 2) — 4.4 SHIPPED: THE BUREAU OF CONTINUITY and THE MOTTO PLAQUE, the reality barometer (data.js, three-renderer.js, map.js, index.html, styles-base.css; doorhq.test.js, hq-floors.test.js)
The row the foyer left for "whoever builds the barometer" (its seal
deliberately does not carry the motto, because a cached decal cannot
change wording). Phase 4's 4.4 — "the motto plaque reads the chapter
band; canon notices on the Bureau of Continuity door" — both halves.
- **The room.** `DOOR_HQ.rooms.continuity` (data.js, before the closet),
  `kind: 'box'`, 8 × 5.5 × 3.2 m, the mezzanine's carpet-and-drywall
  finishes repainted to a colour that has been repainted before
  (`wallColor` 0xcfc6b4). The hall door at 315° (`leaf_suburban_house`,
  the house door on an office) now walks in at the room's way out (its
  action grew `at: 'egress'`); the GATE (`minClearance: 5, requiresKeys:
  24`) and the number (`roomNo: '№ — CONTESTED'`) STAY ON THE DOOR — the
  room wears none, `hqRoomNo('continuity')` reads the door's through and
  the register keeps its one CONTESTED line. Inside: the way out is the
  same house door, ungated (a dead end: one door, on purpose). NORTH: THE
  MOTTO PLAQUE (the new `motto_plaque` wall proc under its own little
  lamp), the plate, two filing cabinets (the record of the wording, which
  has never changed), the boxes marked PREVIOUS WORDINGS with the label
  crossed out. EAST: CANON NOTICES — two notice boards, the camera over
  them, the bin the notices never go in. SOUTH: the Canon Officer's
  tanker desk facing the plaque (the CRT, the folders, the stapler, the
  rotary phone, the lamp), his grey chair, the ONE clock in the building
  that is right (nobody has checked), a round frame, the extinguisher.
  WEST: the EXIT sign, a locker of things that never happened, the globe
  lamp, a plant, the rug. THE CANON OFFICER (hqSit, at the desk) and THE
  CONTINUITY CLERK (hqReach, at the cabinets); a native reading the
  notices again; four overheard lines (Claude's drafts, A15).
- **The barometer** (data.js, the block right after `hqCornerInspection`;
  everything on `window`). MASTER A7: one motto, three wordings, the
  current one a reality barometer. `HQ_MOTTO_BANDS` maps a CHAPTER BAND
  to a form — and until the story track (4.1) lands, the band is the
  clearance (`doorClearance` says as much: "L1 until the story track
  lands"): L1–L2 → DO OBSERVE OTHER REALITIES (early, Act I) · L3–L4 →
  DON'T. OPEN. OBSERVE. REPORT. (middle, Act II — the form orientation
  taught; the foyer's inspection desk keeps printing it) · L5–L6 → DO
  OPEN OUR REALITY (crisis, Act III). So a recruit's plaque already
  disagrees with the orientation form (the drift is the joke: employees
  insist the middle form was taught); a GATEKEEPER, the first rank that
  can enter the room, finds the crisis form on the wall. **`hqMottoBarometer
  (profile, opts)`** is the ONE read: `{ idx, form, forms, band, act, tone,
  level, title, source (band | story | forced), taught, drift, last,
  since, changed, previous, remembered, reading (STEADY | REVISED |
  CHANGED), note }`. Overrides, strongest first: `opts.force` (the dev
  override — `?motto=0|1|2` or `window.EW_HQ_MOTTO`, read through map.js
  `_hqMottoForce()`; the plaque proc reads `window.EW_HQ_MOTTO` itself),
  then `profile.door.mottoForm` (THE STORY HOOK — `window._doorSetMotto
  (n)` writes it and re-enters the room; null = follow the band; the
  story track sets it when a chapter says the wording changed), then the
  band. **`hqMottoObserve(profile)`** is the ONE write: map.js
  `_hqRecordVisit(null)` calls it on every fresh arrival (beside the punch
  clock) and files today's reading in `door.hq.motto = { form, since,
  remembered: [{ form, until }] }` — when the plaque reads a form it did
  not read last time, the old wording goes on the REMEMBERED list (one
  entry per wording, never the current one, newest first; a demotion
  files the same way). That list is A7's Mandela effect made mechanical:
  the officer is the only one who remembers the plaque reading anything
  else, and the Bureau insists it always read this. Nothing is relayed
  (RULE #2 — viewer-local, like the punch clock).
- **The notices.** `hqCanonNotices(profile)` — the Bureau's board,
  GENERATED from the profile on every read and never stored: THE MOTTO
  (STANDING, or RETCON when it changed since your last visit — "it has
  always read this"), one CORRECTION per remembered wording ("Reports
  that the plaque read X are in error … report to Medical, Room 1111,
  where their corners will be re-verified"), WORDING when the story set
  the form, THE LADDER ("there have always been six ranks … it has
  always been L n"), THE FLOORS (no 13), BAY 6 (sealed: "has never been
  open"), CODE RED (today's, once cleared: "the entity was never at this
  threshold"), THE FRONT DOOR ("officers who remember arriving in the
  hall arrived through the front door and do not remember it, which is
  the front door working as designed"), H-WING ("there is no H-Wing …
  the wall at the end of Service Corridor B is a wall"), ROOM 86 (only
  while the after-hours variant is up: "not, and never has been, a
  club"). Each row is dated today with the canon date, stamped RETCON /
  STANDING / NOTICE. The copy is Claude's DRAFT (A15 — the user owns the
  voice; the mechanism is what shipped).
- **Where it reads** (the four readers). (1) THE PLAQUE ITSELF:
  three-renderer.js `motto_plaque` (the Phase 8 proc block, after
  `wall_plaques`) — a walnut board, a brass plate engraved by `_hzTextTex`
  with the department, the form and IT HAS ALWAYS READ THIS, four screws,
  a hood lamp; it reads the barometer AT BUILD (a room is rebuilt on every
  entry, so a promotion re-engraves it the next time you walk in) and
  caches the texture per form (`hq_motto_plaque_<idx>`, so the three
  wordings are three textures, never a stale one). (2) THE PLAQUE PANEL
  (counter `plaque`, by id in `_hqCounterPanelHtml`): THE PLAQUE READS ·
  THE BAND (act, clearance, SET BY THE BUREAU / DEV OVERRIDE) · the three
  forms as chips with the current one lit · READING (STEADY / REVISED /
  CHANGED with "it read X when you were last here") · AS TAUGHT AT
  ORIENTATION (agrees / disagrees) · one YOU REMEMBER row per remembered
  wording; the button reads IT HAS ALWAYS READ THIS when it changed.
  (3) THE NOTICES PANEL (counter `notices`): every notice as a row with
  its stamp. (4) **THE DOOR** (plan 4.4's second half): the Bureau's door
  panel in the hall — the one a DOORMAT can open even though the door
  is GATEKEEPER's — now carries THE MOTTO row and the top three notices
  (retcons first). And a poster: the LOADING CARD (`#hqLoadMotto` under
  "verifying your corners…", `.hq-load-motto` in styles-base.css) shows
  the current form on every entry — A7: "posters, plaques, loading
  screens".
- **Tests.** doorhq.test.js: the room (the door at 315° walks in, the
  gate and the number on the door, a recruit reads `clearance` and a
  GATEKEEPER with the Keys `open`, the way out ungated, one door, the two
  by-id panels at their walls, the plaque under the counter, two boards,
  ONE clock, the catalogue row, `boxPropProblems`, the spawn, the cast,
  no second register entry), the helpers (the three bands, the early /
  middle / crisis reads by clearance, the taught form ≡ the foyer's,
  the story hook and the dev override winning in order, a form selected
  by its own words, the first reading filed, a promotion → CHANGED then
  REVISED with the old wording remembered, a demotion, one memory per
  wording, the notices dated / stamped / worded, one CORRECTION per
  memory, the WORDING notice only under the story hook, nothing written
  to the profile by the notices), the source sites (the proc's build-time
  read and per-form cache, both panels, the door panel, the arrival
  reading, `_hqMottoForce`, `_doorSetMotto`, the loading card + its
  style). hq-floors.test.js dropped its "the Bureau's door waits on a
  chapter" exception — every door in the building lands somewhere now.
  `npm test`: 1272 tests, 1268 pass, 0 fail, 4 skipped (the standing
  skips).
- **Unseen live (RULE #1c):** the plaque's engraving size from eye
  height (the `_hzTextTex` width fit caps the form's line), the hood
  lamp's glow strip, the house door on a box-room wall, the loading
  card's motto line under the blink, the door panel's three rows on a
  DOORMAT's screen. Dev: `?motto=2` / `window.EW_HQ_MOTTO = 2` to see
  the crisis form at any rank; `window._doorSetMotto(2)` to set it on the
  profile (`_doorSetMotto(null)` follows the band again);
  `window._doorPromote(3)` then re-enter to watch the plaque change and
  the old wording land on YOU REMEMBER.
- **Open after this:** the band from the story track once 4.1 ships
  (`door.mottoForm` is the seam — the chapter sets it, nothing else
  changes); the notices' voice (A15); a `paChime` / PERSONNEL NOTICE
  moment when the plaque changes (today it is the door panel's REVISED
  chip and the button's line — quiet on purpose: nobody comments); 5.2
  department swaps could post their own notices through the same board.
- **Delivery:** `ENTROPY_WARS_HQ_BUREAU.zip` — data.js, three-renderer.js,
  map.js, styles-base.css → R2; index.html (`?v=20260915-hq-bureau-01-cors`)
  → Render; doorhq.test.js, hq-floors.test.js, this file, DOOR_MASTER.md,
  CLAUDE.md → the repo.

### 2026-09-15 — 7.4 THE FOURIER FOYER SHIPPED: the front door, the seal, the corners verified (data.js, three-renderer.js, map.js, index.html; doorhq.test.js)
The last row of the 7.4 department table, and the spawn-in-the-foyer
decision it waited on. The row said "spawn here after 7.2, walk in";
7.2 shipped six stages ago, so the decision is taken the way the row
wrote it, with a kill-switch for the user to overrule (`?nofoyer`,
localStorage `ew_hq_foyer='off'`, `window.EW_HQ_NO_FOYER` — Play lands
in the hall as before). Flag for the user: this adds one door-blink to
every Play press (the walk from the front door to the revolving door is
~4 m); if that is one too many, the switch is the answer, or the foyer
stays and the spawn moves back with one line (`_hqArrivalRoom`).
- **Where.** The lower wall was full: the west stair excludes
  291°–349°, the east stair 11°–69°, Bay 4's wide panel eats 0° ± 14.5°
  against another wide door, the board hangs at 288° under Room 111. The
  ONE free stretch is 181°–209° between the Training Room and Medical —
  15° each way, 5.5 m of wall, the same pier Room 86 sits on (the test's
  2 m rule holds on both sides). It is also the RIGHT side: the arrival
  spawn at 180° faces the desk, so the hall's south side is the street
  side and the front door stands where your back was. The water cooler
  (196° → 204°) and the round picture (188° → 186°) moved off the panel.
- **The room** (`DOOR_HQ.rooms.foyer`, `kind: 'box'`, 10 × 6 × 4 m, the
  hall's own finishes — terrazzo, stone, the oxblood dado, teal trim —
  it is the front of the same building; no `roomNo`, the register skips
  it like the penthouse). NORTH: the revolving door (`leaf_revolving`,
  wide — the same leaf the hall wears at 195°, plate CENTRAL EGRESS ·
  INTO THE MAIN HALL, lands at the hall door). SOUTH: THE FRONT DOOR
  (`leaf_entrance`, the 2× door from the 2026-09-14 kit batch; plate THE
  FRONT DOOR · LEAVE THE BUILDING · MAIN MENU) whose action is
  `fn: '_hqExitToMenu'` — the strip's EXIT as a door, labelled in
  `_HQ_FN_LABELS`; one home (hq-floors.test.js counts it). The EXIT sign
  hangs over it — correctly, for once. EAST: CORNER INSPECTION — a tanker
  desk, the CRT, the corner log on a clipboard, the lamp, the mug, the
  inspector in the grey chair facing the wall, the clock, a camera.
  WEST: the visitors' bench (a `park_bench` indoors, `rect: false`), the
  hook rail, the notice board, a plant. FLOOR: THE SEAL at the centre,
  four stanchions making a lane to the revolving door, the mat inside
  the front door. The doorman stands beside the front door; a native
  waits on the bench. Four overheard lines (Claude's drafts, A15).
- **The seal** (`door_seal`, three-renderer.js, the Phase 8 proc block):
  a 1024² canvas decal on a 3.6 m plane like the ritual circle, cached
  by key — a navy disc, a brass double ring, a teal ring, the
  department's name round the top of the rim and EVERY CROSSING IS
  INSPECTED · EVERY ENTITY IS FILED round the bottom (MASTER A7: the
  Customs & Admissions slogan stays; the motto that changes with reality
  is the Bureau's plaque, 4.4 — not painted here, where it would be
  cached at one wording), and the device in the middle: a circle, a
  square, a door (corners make doors). `doormat` (coir, WIPE YOUR
  CORNERS woven in) and `umbrella_stand` (brass, three umbrellas, one of
  which is not) are the other two procs; three catalogue rows.
- **CORNER INSPECTION** (counter `inspection`, `action: {}` → map.js
  `_hqCounterPanelHtml` by id) reads data.js **`hqCornerInspection
  (profile)`** (on `window`, beside `hqIntakeCard`) = `{ onFile, empNo,
  callsign, corners: 4, angle: 90, verdict PASS | PENDING, tone, visits,
  days, streak, punched, date, canon, motto, mottoForms, note }`. Rows:
  CORNERS 4 · ANGLE 90° · FILE (the number and the callsign, PASS; NO
  CARD ON FILE, PENDING) · VISIT (the count; "the clock punched you in
  today · streak n" when Room 247 took today's punch) · THE MOTTO (the
  orientation form, DON'T. OPEN. OBSERVE. REPORT., and the canon date).
  `HQ_MOTTO_FORMS` holds A7's three forms for whoever builds the
  barometer. PROCEED closes it; nothing is written, nothing relayed.
- **The arrival** (map.js): `_hqEnter({ from: 'play' })` lands in
  `_hqArrivalRoom()` — the foyer when the switch is on and the room
  exists, else the hall; `opts.room`, returns and walks are untouched,
  and the dev entries (`?hq`, `_hqEnter()`) still land in the hall. The
  Code Red doorbell rings on the way in through the foyer as well (the
  front door's bell — the walk into the hall is a `walk`, which never
  rings); the promotion check and the variant roll already keyed on "a
  fresh arrival", so they run in the foyer too. The punch clock was
  always `_hqRecordVisit(null)`'s — it punches you in at the front door
  now in fact as well as in name.
- **Tests.** doorhq.test.js: the revolving-door ration excludes the
  foyer's two faces of one door and insists on exactly two; a room test
  (the box, no number, the hall door's angle / leaf / gate / piers, the
  moved wall props, the way out, the street door, the panel, the procs,
  the seal at the centre, everything inside the walls, the spawn, the
  helper on a visitor and on a recruit, the three motto forms); a
  source-site test (the arrival room and its switches, the doorbell,
  the fn label, the panel, the three proc builders, the seal's text).
  `npm test`: see the delivery note.
- **Unseen live (RULE #1c):** the revolving leaf on a box-room wall (it
  has only ever hung on the upper drum), the entrance door's 2× scale
  against a 4 m wall, the seal's text size from eye height, the mat's
  weave, the lane's stanchions against the seal, the walk from the spawn
  to the revolving door (the doorman stands 1.7 m left of the line).
- **Delivery:** `ENTROPY_WARS_HQ_FOYER.zip` — data.js, three-renderer.js,
  map.js → R2; index.html (`?v=20260915-hq-foyer-01-cors`) → Render;
  doorhq.test.js, this file, DOOR_MASTER.md, CLAUDE.md → the repo.

### 2026-09-04 (6.3 rev 2) — the Key pickup CELEBRATION; the emojis go
User feedback on rev 1: "Why not make like an animation with the glb keys?
i dont want god damn emojis infesting the game… like in mario 64 when you
find a star… max 3-5 seconds" — a rename alone was not the ask. Token
`20260904l-cors` → `20260904m-cors` (supersedes rev 1's l batch); files
data.js, battle.js, ui.js, hud.js, three-renderer.js, online.js,
profile.js, index.html. 113/114 green.

**The celebration (three-renderer.js `keyPickupFx(tx, ty)` + `keyFxWarm`,
exported).** A real 3D key rises out of the securing unit and spins in a
gold glow — total ~2.6 s, NON-BLOCKING (no camera move, no input lock —
Keys land mid-competitive-match, so it plays over live play): 450 ms pop-in
rise with overshoot + fast spin → 1650 ms hover (bob, slow spin, pulsing
gold PointLight, a sparkle drip every 240 ms) → 420 ms burst-out (spin-up,
shrink, 18-ember + flash burst). At spawn: a world-mode `shockwave` ground
ring + a 12-ember ring via ThreeVFX (same board-pixel convention as
`_spawnGroundPuff`). The mesh is the DOOR kit's OWN key GLB
(`DOOR_HQ.catalogue.key` = `Meshy_AI_a_key_…`, via `_loadMiscModel` /
`_miscModelInstance` span-fit to 0.5 tile; a flat-lying Meshy bake is
detected by its bbox and stood upright, then recentred so the spin axis
runs through it). Until the GLB is cached a chunky procedural gold key
(torus bow + hex shaft + two teeth, Lambert + emissive, cached geometry)
stands in — and `showBattleLoadingScreen` pre-warms the GLB whenever the
mode has Keys (`CONFIG.winHourglasses > 0`), so match one pickup one
normally shows the real model. Tick rides the frame loop next to
`_updateDeathTweens`; parent-check reaps fx across scene rebuilds.

**Wiring (RULE #2 done properly).** battle.js `playKeySecuredFx(x, y, n)`
(defined beside `_isTileVisibleToViewer`): devsim-suppressed, and
FOG-GATED VIEWER-LOCALLY — an enemy securing a Key inside your fog plays
nothing positional (the screen-level KEY SECURED banner still reports the
event, as before). Called from the one live collection site (the
inspect-scan collect, ~battle.js 43070). online.js wraps it
(host/recording emits `relay {type:'key-fx', x, y, n}`) and the guest
dispatcher re-runs it locally where the GUEST's own fog gate decides —
the followUnitFall pattern.

**Emoji purge (the game already had an emoji habit; the Key never joins
it).** data.js `createKeyIconDataUri()` draws a real 16×16 pixel-art key
(crispEdges SVG rects — bow ring, shaft, two teeth, highlight; same
rounded-box frame as the status icons) → `KEY_ICON_URI` +
`keyIconHtml(px)` (window-exported). It replaces 🗝 at: STATUS_DEFS
`hourglass` iconSrc (log badges/status rows), roster count, scoreboard
Keys row, trade-dialog row, the hidden-pickup dialog icon, the Arena
score tally row, the 3D nameplate KEY+n badge, and the two sidebar
held-count icons (index.html ships `.mini-hourglass` EMPTY; ui.js fills
the background once per element). Text-only spots use the word: floating
text `+1 KEY`, HUD chip `KEY+n`, banner `KEY SECURED!`; the 🗝 prefixes
came OFF the logs, the win message and the result label, and
`decorateTextWithIcons`' 🗝 rule was deleted (no emitters left).
Achievement catalog icons (Keyring/Locksmith) stay emoji — that catalog
is emoji-styled end to end and renders through React as text.
Pre-existing 🗝️ in Mystery Dungeon strings is MD flavor, untouched.

**Tune here:** `_KEYFX_RISE/_KEYFX_HOLD/_KEYFX_OUT` (450/1650/420 ms),
hover height `ts*1.05`, light color 0xffd070, sparkle cadence 240 ms —
all in the `keyPickupFx` block, three-renderer.js. Not verifiable here
(CDN blocked): the GLB's real orientation/texture — if the kit key spins
sideways, the bbox stand-up heuristic at `onDone` is the knob.

### 2026-09-04 (6.3 + 6.2) — hourglasses are Keys; the Cube gets its announcer
User: "let's do the keys. The towers are already cubes." (Story work — 4.1
case-file screen, 4.3 tape, 4.2 micro-scenes — is ON HOLD until the user
writes the outline; do not start it without them.) Token `20260904k-cors` →
`20260904l-cors`; files data.js, state.js, battle.js, ui.js, hud.js, map.js,
three-renderer.js, profile.js, index.html. `npm test` 113/114 green (server
smoke skips).

**The rule (B1's Hazard Pay precedent).** Player-facing text/icons only.
Code identifiers are UNTOUCHED and must stay: `state.hourglasses`,
`unit.hourglasses`, `hourglassBuff`, `winHourglasses`, `hasHourglasses`,
`hourglasses_collected`, the `hourglasses` / `wins_hourglass` achievement
metrics (hqKeys reads them), SFX keys `playerHourglass`/`enemyHourglass`,
CSS classes `.hourglass-text` / `.mini-hourglass`, XP/GOLD constants, the
STATUS_DEFS key `hourglass`. Time-semantic ⏳ stays ⏳ (cooldowns, END OF
ROUND, WAITING FOR OPPONENT, Opponent's Turn, the TIME desk stamp).

**What changed (🗝 everywhere a player reads it):**
- data.js: STATUS_DEFS.hourglass → icon/glyph 🗝, short KEY, label Key
  (same gold palette); the status blurb; achievements renamed 'Sands of
  Time'→'Keyring' ('Secure Keys') and 'Timekeeper'→'Locksmith'; Plunder
  desc; masteryLabels HOURGLASSES→KEYS and TOWER→CUBE.
- battle.js: pickup banner '🗝 Key Secured!' + float '🗝 +N' + 'Key Charge
  Lv.N' (was Temporal Buff); inspection/scanner logs ('Key resonance', 'A
  Key is very close!'); scatter/materialize/reset logs; result-screen
  label '🗝 Keys Secured' + details row 'Keys'; Arena intro + composite
  breakdown + sudden-death line; plunder log; the Keys win message is now
  '🗝 THRESHOLD STABILIZED — Player N secures every Key!' and (6.2's last
  piece) the Cube win is '⬡ THRESHOLD CLOSED — Player N destroys the
  enemy Cube!'; decorateTextWithIcons converts 🗝 (was ⏳) and the log
  colorizer highlights capital-K Key/Keys (was any-case hourglass; capital
  only, so prose "key" never lights up); the FIELD MANUAL loading hint.
- ui.js: roster 🗝N, scoreboard 🗝 row, objective label 'Keys · … · Win by
  Cube Destruction', Inspect/Hint/Keys help text, hidden-pickup dialog
  (🗝, 'Something orthogonal is buried here.'), trade dialog row
  Key/🗝 + trade logs, CPU-difficulty blurb (Cubes/Keys).
- hud.js + three-renderer.js: the ⏳+N chip/badge → 🗝+N 'Key Charge'.
- map.js: Arena mode desc (Cube/Keys), the drop log, the HQ strip Keys
  tooltip ('recovered in the field'), the in-tray KEYS row sub FIELD, and
  RECENT CASES chips now print masteryLabels (KEYS, CUBE) instead of raw
  win-condition ids.
- profile.js: achievements category '🗝 Objectives'. index.html: the two
  sidebar mini-hourglass ⏳ → 🗝 (class name kept).

**Parity (RULE #2):** every changed string renders locally on both clients
from the same file version — no relay surface touched. Mismatched client
versions during the rollout window would just read differently; harmless.
**Not done / later:** no 3D Key model exists because loose hourglasses
never had a board model either (they are hidden pickups — logs, scans,
banners); if a visible pickup model ever lands, it lands as a Key. 6.4
(Nexus → double Cube damage) still awaits the user's engine call.

### 2026-09-04 (6.1a) — the walkable Training Room ships
User: "Let's build the walkable training room inside the facility." Token
`20260904j-cors` → `20260904k-cors`; files data.js, three-renderer.js,
map.js, index.html; doorhq.test.js +1 (114 total, 113 pass, server smoke
skips). No mid-match surface → no relay work (RULE #2); the room is
single-player and local like the rest of the building.

**The room (data.js `rooms.training`).** The egress TRAINING FACILITY door
(180°) now opens into the second `kind: 'box'` room: 20 × 20 m, 5 m
ceiling (the 8×8 grid is 14 m at 1.75 m per battle tile + 3 m of walkway
each side), concrete floor / stone walls / oxblood dado / teal trim.
`fx: 'training'` on the room + `shell.grid: {cells: 8, cell: 1.75}` are
what the renderer reads. Doors: the way out is CENTRED ON THE NORTH WALL so
the pit's barrier gap lines up with it (in from the egress, straight onto
the grid; `at` round-trips both ways); the south gap door is the CHALLENGE
RANGE (`_goToCampaign`, the wired institutional double); the east wall has
the CONDEMNED CROSSING (`_goToMysteryDungeon`, the shabby wooden door,
"somebody keeps oiling the hinges"). The egress door's alt/alt2 shortcut
buttons are GONE — the facility is those functions' physical home now
(guardrail: one physical home + the directory). Props: the tanker desk on
the west wall wearing the signature CRT + rotary phone + papers is the
RANGE console's body; the VHS CRT (tube_tv on a crate, aimed at the grid)
sits beside it for 4.3; observation window, two clocks, extinguisher,
water cooler, lockers, folding chairs, wet-floor sign standing over the SW
crack, two ceiling fluorescents. Two agents watch the grid (one is timing
their break); up to three roster vessels spawn — two of the spots are ON
the grid, sparring.

**The pit (three-renderer.js `_hqBuildTrainingPit`).** Runs after
`_hqBuildBoxShell` when `room.fx === 'training'`; metres × U in the room
frame, reusing the 6.1b enclosure vocabulary and its canvas caches
(`_hzTex('training_floor')` slabs — the data-URI terrain, no CDN;
`_hzLineGridMesh` seams + corner lights; `_hzScorchTex` / `_hzCrackTex`
multiply decals with toneMapped off; `_hzStripeTex` hazard plates;
`_hzTextTex` A–H / 1–8 and the four signs, same copy, shifted off the
doors that now occupy the wall centres). The grid is FLUSH with the floor
(rev 3's no-moat rule): what fences it is the maroon barriers (yellow lip,
posts, breathing red lamps) with gaps at the N/S doors. New collision:
barrier segments push RECT blockers (`rect: {hw, hd}`) that `_hqSurface`'s
box branch now understands — the pit is really fenced, the gaps really
admit you, and you can walk every cell. Overhead: glass observation booths
on the W/E walls at 2.4 m (desk, glowing screen, inner light — never
reachable), corner machinery (drum + crate + wall pipe + red lamp, disc
blockers), seven red wall lamps, eight fluorescent strips, four point
lights over the grid (the box-room lighting alone was sized for a closet).
Pulses live in `_hq.fxPulse`, ticked by `_hqTickWorld` — the battle
`_hzGlowPulse` list never runs under the HQ loop. Also: `_hqGoTo`'s
box-counter branch now stands you in FRONT of a counter that declares
`face` (the office in-tray keeps its old south-side behaviour).

**The console (map.js).** Counter overlay `training` → `_hqTrainingHtml`:
the tape label ("D.O.O.R. ORIENTATION · TAPE 1 OF 1 · 1987 · BE KIND,
REWIND", "please do not turn around"), ORIENTATION ▸ TRAINING ROOM · 4v4
and PRACTICE ▸ HOLO SIM · 4v4 (`data-range`), NOTED. `_hqLaunchMission`
takes `o.roster` now: `[]` = nothing pinned (`_msConfirm` only pins a
non-empty roster), so both launches draw a free CPU pool instead of
`hqMissionPool`'s biome-neighbour padding — they are INTERNAL, no site
file, no mastery, no Code Red. Post-match you re-enter the training room
standing at the console (`doorId: 'range'` rides the existing
`_hqLastDoor` plumbing; `goTo` handles box counters). **Decision recorded:
the Holo Sim's purpose is PRACTICE** (the §9 6.1b open question).

**Tests (doorhq.test.js +1).** The generic box-room checks picked the room
up by themselves (panels fit, props inside walls, mounts clear the
ceiling, lit by a fluorescent); the new test pins the contract: fx +
8×8 grid + ≥2 m walkway, the egress door round-trip through `at`, the
way out / challenge doors centred on the barrier gaps, no rank leaves, no
leftover alt/alt2 shortcuts, the RANGE console at the tanker desk with the
tube_tv present, and both launch ids present as `isDelta + facility` rows.
One data fix the suite caught: the challenge door needed `wide: true` to
agree with its double leaf.

**Could not verify here (CDN blocked):** the kit GLBs in the room (the
observation window's first-ever placement — if it faces the wall, flip its
`rot`), texture read on the walls vs the slab grid, booth glass against
the fog. First things to eyeball live: (1) walk in from the egress —
straight through the gap onto the grid; (2) barriers block everywhere but
the two gaps; (3) E at the console → ORIENTATION lands match select on
TRAINING ROOM, PRACTICE on HOLO SIM, and the CPU roster is NOT pinned
(different races per reroll); (4) post-match you stand at the console; (5)
the sparring vessels on the grid; (6) sign / lamp / clock placement (all
single numbers in `_hqBuildTrainingPit` / the props table).

**Next (in order):** 4.1 the case-file screen; 4.3 the orientation tape
playing on the VHS CRT before ORIENTATION's first run; 6.3 Keys wording;
§3.9 the layout editor; gamepad; 4.2 the desk micro-scene.

### 2026-09-04 (rev 3 of the Training Room) — the room was there all along; the slab floor
User (with a live capture): "still don't really know what's going on with
the training room and why all the outer stuff is invisible… I don't like
the texture you chose for the tiles… refer to the build plan and the
reference images before moving on to the walkable version." Token
`20260904g-cors` → `20260904h-cors`; files three-renderer.js, sprites.js,
data.js, map.js, index.html; `npm test` 113/113. Verified with a headless
render of the real match (this environment blocks the CDN, so every
script was served from the repo and R2 sprites/textures were absent —
flat colours, no units — enough to see the enclosure and the new floor).
- **Root cause of the "invisible" room: the retro fog.** The enclosure was
  fully built (headless census: the same 217 pieces, correct positions,
  Lambert + sun/hemi/ambient all present). But `_applyHorizonFog` injects
  the per-fragment HORIZON-ALTITUDE fog (`_injectHorizonFog`) into every
  material under `_horizonGroup`, and the pause-menu retro fog is ON by
  default (three-post `_retro.fogEnabled`, uFogAmount ≈ 0.98). That fog is
  keyed on the view ray's altitude — anything below the horizon line
  dissolves ~95% into the fog colour — and the whole room stands below the
  horizon at the board's rim. So walls, walkway, barriers and booths were
  drawn as 5% ghosts over the (also fogged) dome: exactly the faint slanted
  quads in the capture. Fix: near builders now run through
  `_hzRunNearBuilder` into a `facilityNear` sub-group and every material
  they make is tagged `_ew_hzNear`; `_applyHorizonFog` skips those (no
  injection, no forced `fog:false`), so lit pieces haze with the board
  through ordinary `scene.fog` and the additive glows / sprites stay
  unfogged as they declare. The map's own env fog (0.22) never touched the
  room either way. Holo Sim's apron gets the same exemption.
- **The floor: `training_floor`, a new terrain.** The reference grid is big
  flat plaster-concrete slabs with a dark grout rim, not cobbles.
  sprites.js `_mkTrainingSlabURI` draws one 256² slab into a canvas at load
  (seeded — identical on every client): warm plaster `#bca98a`, soft
  light/dark stains, elongated damp patches, fine grain, a few pale
  scuffs, a vignette, a 3px grout rim with a bevel highlight top-left and a
  shadow bottom-right. `TRAINING_SLAB_URI` feeds `TERRAIN_SPRITES.training_floor`
  (falls back to concrete_floor.png without a DOM). Registered like the
  holo floors: TERRAIN rule (Training Slab / TRN), EW_TERRAIN_COLORS,
  MF_TID and map.js ME_TERRAIN_IDS (append-only, index-for-index), the
  editor's Floors palette. `prebuilt_training` now builds on it and drops
  the old concrete tint.
- **Perimeter texture.** Follow-up in the same session: the walkway ring and
  the walls had still been wearing concrete_floor.png; per the user they now
  use `tilefloor` (R2 terrain folder) — one `_hzTex` key in `_hzTrainingRoom`.
  Token → `20260904i-cors`.
- **Decals.** The scorch stars showed as dark translucent SQUARES: a
  multiply plate's white base is tone-mapped below 1.0 by the exposure
  grade. Decal materials are now `toneMapped = false`. Two crack decals
  (`_hzCrackTex`, branching random walks) lie in the NE and SW corners like
  the reference. Seams, corner lights, everything else unchanged.
- Camera note for 6.1a: the default battle camera sits INSIDE the room's
  footprint above the wall tops; only very low tilts put a wall between
  the camera and the board, and even then it clips the bottom of the frame,
  not the grid — no cutaway needed.
- **Unverifiable here:** textured walls / booths / units (R2 blocked). First
  thing to eyeball live: wall brightness vs the floor, and whether the slab
  should be warmer or paler under the sun grade (one hex in
  `_mkTrainingSlabURI`).

### 2026-09-04 (later) — 6.1b + 6.1c: the Training Room and Holo Sim boards
User: brainstorm on the 8×8 training room ("can the map BE the room, with
the lava layers underneath? a facility-style renderer, or keep the voxel
engine?"), then "continue building the board… build both of them as two
distinct things… both maps should become selectable in match select",
with four new phone captures of a Tron-style holographic floor as the
second reference. Decision recorded: **keep the voxel engine** — what makes
the facility read better is textures, lighting and props layered on plain
boxes, all of which can be added per map; a second map renderer would mean
re-implementing fog, highlights, decals, water, buildings and every camera.
`npm test` 113 (112 pass, server smoke skips), cache token
`20260904e-cors` → `20260904f-cors`. Files: data.js, sprites.js,
three-renderer.js, map.js, index.html; delta-maps.test.js, doorhq.test.js;
this file, DOOR_MASTER Part D. No mid-match surface → no relay work (RULE
#2): maps, env presets and the new terrains are data both clients load.

**How they register (data.js `EW_FACILITY_BUILDERS` / `EW_FACILITY_META` /
`_mfRegisterFacility`, after `_mfRegisterAll`).** Each is built with
`_mfDeltaNew` (so it gets the shared lava → cave → cave wall → dirt → dirt
bed under a z5 surface, the Δ spawn rows, the centre nexus and
`finishDelta`'s protections) and pushed onto `EW_MAP_META` as a row with
`isDelta: true, facility: true, teamSize 4, tier 3`. That one flag does the
rest: state.js generates the GAME_MODES entry and puts them in every
online mode's `compatibleMaps` (not Gauntlet); map.js MS_MAP_LIST lists
them as `8×8 Δ` after the 29 Δ boards; match-select shows them under the
default Δ filter with their own SITE_FILES (INTERNAL / SIMULATION, grey
stamps); everything that means "a site" (`hqMissionPool`, mastery, the
sector partition, threshold leaves, Code Red) already filters on
`!isDelta`, so the building ignores them. The ranked `MAP_POOL` in
server.js is hand-maintained and untouched, so they are never queued.
Tests: delta-maps.test.js validates them under the full house rules (bed,
symmetry, protected tiles, two disjoint routes) minus the cover minimum for
`facility` rows (the Training Room is an empty grid on purpose); the
roster tests count 29 + 2; doorhq.test.js's "launch map" is now `!isDelta`
like every other check in the file.

**prebuilt_training — the board.** `concrete_floor` tinted warm
(`#cbb99a`), flat, nothing on it. Everything else is the new
three-renderer `training_room` scenery theme (a NEAR builder — see below):
`_hzBoardSeams` draws the lit seams at each tile's own height plus a bright
light at every grid corner (one additive vertex-coloured mesh), four scorch
stars are multiply-blended canvas decals; a walkway ring of thin concrete
slabs meets the board edge (rev 2: no moat — the player only sees the
tops, covering the board's sides is fine); row letters A–H and column numbers 1–8 lie on the walkway; maroon
pit barriers with a yellow lip, posts and pulsing red lamps line the rim
(door gaps N/S); the four walls are double-sided planes running from the
bed's floor to 3.2 tiles above the room floor (dado + upper panel + teal
trims + two fluorescent strips each) — rev 2 dropped the inward-only
"dollhouse" culling: nothing pops as the camera moves; N/S double doors with a dark
reveal, lit window slits, lintel and a pulsing green lamp; hazard-stripe
plates on the walkway in front of them; observation booths off the W and E
walls (glass, frame, desk, screen, interior glow); corner machinery (drum,
console, wall pipe, crate, red lamp) in all four corners; wall clocks on
N/S; eight red wall lamps; four canvas-text signs (ORTHOGONAL GEOMETRY
EXPOSURE AREA · AUTHORIZED PERSONNEL ONLY / D.O.O.R. TRAINING FACILITY ·
ROOM 8×8 · REALITY LEAKS POSSIBLE / MAX OCCUPANCY 45 MINUTES / REALITY
LEAKS POSSIBLE). Lit pieces are Lambert (they share the board's sun and
hemisphere light, not the far scenery's day/night grade). Env: near-black
dome, no stars, light fog, `scenery: 'training_room'`, no far roster.
Headless census (real three r128): 185 meshes + 32 sprites, ~3.9k tris.

**prebuilt_holosim — the board.** Two NEW terrains, `holo` and `holo_red`
(TERRAIN rules, MF_TID 158/159 mirrored into map.js ME_TERRAIN_IDS — which
already carried `swamp`/`oil` at 156/157 that MF_TID lacked; both lists
now agree index-for-index — EW_TERRAIN_COLORS, the editor's Floors
palette). Their textures are 128² pixel-art PNGs embedded in sprites.js as
data URIs (`HOLO_TILE_URI`, `HOLO_RED_TILE_URI`: a dark navy plate with a
cyan rim and a faint sub-grid; a red twin with a warning triangle) — nothing
to upload, `_ewCorsBust` ignores non-CDN URLs. three-renderer
`_EMISSIVE_TERRAIN` gives those keys the tile texture as an emissiveMap in
`buildBoxMaterials`, so only the rim pixels glow and bloom while the plate
stays dark (sides too, so a riser is a glowing wire cube). The board: two +1
holo risers, flat otherwise — rev 2 removed the permanent red cells: the
red warning square is the DELAYED-ATTACK telegraph (below), not terrain;
`holo_red` stays registered as an editor terrain. Env: black dome with strong stars, `scenery: 'holosim'`,
density 1.2. The `holosim` theme = a far roster (`_hzHoloRing`: thin
additive tori with a chromatic twin, tumbling; `_hzHoloMonolith`: dark
slabs wearing glowing ring glyphs and edge lights; `_hzAstralOrbs`) plus
the `_hzHoloApron` near builder: the projected grid continues five cells
past the board and fades into the void (per-vertex brightness, one mesh),
corner dots, and four faint projector beams rising from the board corners.
The obsidian sacred-ring haloes that every map gets are skipped for both
facility themes.

**Renderer plumbing.** `_HZ_NEAR_BUILDERS = { training_room, holosim }`;
`_buildHorizonScenery` runs the near builder after the `'none'` early-out
— alone when the theme has no roster (indoors), after the roster scatter
otherwise — inside the same `_horizonGroup` / key cache, so it rebuilds
with the map and disposes with it. Helpers: `_hzLit` (Lambert), `_hzTextTex`
(cached canvas plates), `_hzStripeTex`, `_hzScorchTex`, `_hzLineGridMesh`,
`_hzBoardSeams`. Kill-switch `window.EW_NO_FACILITY_SCENERY = true` (bare
boards). Known soft spots: seams are drawn at the heights the board had
when the scenery was built (a terrain spell that raises a tile buries its
seams — harmless); `_rerollMapForNextMatch` (battle.js) rotates Δ boards
among ALL `isDelta` rows, so "Find Next Match" can land on a facility
board (left as is — cheap to exclude on `facility` if unwanted); the
match-select size chip still reads "Δ map · hand-authored 8×8 board" for
them (cosmetic, match-select.js untouched).

**First-run checklist for the user:** (1) Play → any bay or Back → match
select: the Δ list ends with TRAINING ROOM (stamp INTERNAL) and HOLO SIM
(stamp SIMULATION); their site files read; VS CPU launches both; (2)
Training Room: warm concrete, lit seams with a light at every corner, four
scorch stars, A–H / 1–8 on the walkway, maroon barriers with red post
lamps, the N/S doors with green lamps, the four signs legible from the
default camera, booths W/E, drums in the corners, clocks; orbit low and
outside the walls — the room stays solid, nothing pops;
(3) Holo Sim: black starfield, dark cells with glowing cyan rims (bloom),
two wire-cube risers (no red cells), the apron grid
fading out past the board, four faint beams at the corners, neon rings and
dark monoliths drifting far out; (4) map editor → Floors: Holo Floor /
Holo Warning paint and play-test; (5) a friendly online room offers both
maps and the guest sees the same scenery (data-driven); (6) report scale
(walls too tall / low vs units?), seam brightness, lamp glow, sign
legibility, booth glass — all are single numbers in `_hzTrainingRoom`.

**Next (in order):** 6.1a the walkable Training Room (box room, the pit as
geometry, ORIENTATION counter → `prebuilt_training`); decide the Holo Sim's
purpose (rec.: PRACTICE from the Training Facility door — free loadout
testing vs CPU, no stamps); 4.1 the case-file screen; 6.3 Keys wording;
§3.9 the layout editor; gamepad; 4.2 desk micro-scene.

### 2026-09-04 (Phase 3 close) — Code Red, Keys, the promotion moment
User: "continue with the DOOR master doc and the HQ build plan". Next in
the standing list were 3.3 → 3.2 → 3.4; all three shipped, so **Phase 3
is complete** and every §3.5 lamp state is now reachable. `npm test` 113
(112 pass, the server smoke skips without node_modules; doorhq.test.js
+8, three older checks updated for the new rules). Cache token
`20260904c-cors` → `20260904d-cors`. Files: data.js, map.js, battle.js,
three-renderer.js, audio.js, styles-base.css, index.html, doorhq.test.js.
No mid-match surface → no relay work (RULE #2); everything reads the
local profile.

**3.3 Code Red (data.js `hqCodeRed`, `hqCodeRedPool`, `hqToday`,
`hqHash`, `DOOR_HQ.codeRed`).** Once a day one STABILIZED threshold goes
wrong. Candidates = the profile's mastered launch maps in unlocked sectors
(nothing is reported until at least one lamp is green — a Code Red is a
green door misbehaving); the pick is `hqHash(localDate | employeeNo |
'codered') % candidates`, so it is the same all day and different
tomorrow. The out-of-place entity is a race whose POINT OF ENTRY is some
OTHER site and never one of this site's natives (rigged-3D filter when
the sprite table is loaded, like `hqMissionPool`). `doorSiteState`
returns `codered` for that site's threshold AND its bay door in the
egress (the strobe already existed in the renderer; the plate chip reads
CODE RED) until `door.hq.codeRed = {date, site, race, cleared}` matches
today. Flow (map.js): the strip grows a strobing **CODE RED · SITE**
pill (`#hqCodeRed`, click → the brief overlay with WALK / ENTER THE BAY);
the threshold panel and the bay-door row carry the brief + **RESPOND ▸
CROSS · ENTITY PINNED** (`data-codered`); `_hqLaunchMission` treats ANY
launch onto the Code Red site today (CROSS, DEEP or RESPOND) as the
response: it builds the roster from `hqCodeRedPool` (the entity
first, `natives = 1`, so `randomizePartyIdentities` always draws it,
then the site's own pool) and sets `window._hqCodeRedRun = {date, site,
race, label, bonus}`; `_msConfirm` keeps the marker only while the
launched card is still that site, `_msBack` / `_goToVsCpu` / any
`_hqEnter` clear it. **audio.js `doorbell`**: a household ding-dong
(E5→C5, bar-chime partials) rung twice, the second a little harder and
flat — plays 1.4 s after entering the egress from Play or a return, once
per Code Red per session (`_hqBellRungFor`), never on room-to-room walks;
file override key `doorDoorbell`. **battle.js commit**
(`commitAchProgress`, after the mastery flag): a WIN with the marker on
the same site + date writes `door.hq.codeRed` cleared, bumps
`door.hq.codeRedsCleared`, `creditLocalGold(200)` (local mirror, like
tier gold) and sets `window._lastHqCodeRed`; `_stampHqSite` shows
**CODE RED CLEARED · SITE · 💰 +200 HAZARD PAY** (red tag) in place of
the mastery tag. The marker is consumed win or lose. Renderer:
`HQ_DOOR_LOCKED` drops `codered` — the breach door opens for the
responder. Dev: `?codered=<mapId>` (or `DOOR_HQ.codeRed.force`) puts it
on any site with no mastery.

**3.2 Keys (data.js `hqKeys`, `hqKeysShort`, `DOOR_HQ.keys`).** Keys are
hourglasses (MASTER A9): `keys = pickups + issued`, pickups = the
`hourglasses` achievement counter summed over pvp / cpu / legacy
(monotonic, already synced), issued = `door.hq.keys` (story grants, none
yet). `requiresKeys` on a door → `clearance` (red) while short, on top of
`minClearance`: the **elevator asks 12**, the **Bureau of Continuity
24** (both still rank-gated too; thresholds and bays never ask — a test
enforces it). The strip shows **KEYS n** (`#hqKeys`), the in-tray has a
KEYS SECURED row, the panel's disabled button and note say exactly what
is short (`_hqGateLabel` / `_hqGateText`: "CLEARANCE L4 + 12 KEYS
REQUIRED", "12 KEYS REQUIRED · 9 SHORT"). Engine-side "Keys" wording on
the pickups (6.3) is still open.

**3.4 the promotion moment (map.js `_hqCheckPromotion`,
`_hqNoticePanelHtml`, `window._doorPromote`).** Nothing in the game
promotes yet (that is the story track, 4.1); what shipped is the
building's reaction so any writer of `door.clearance` gets the ceremony
for free. On every non-walk entry: if `doorClearance(p).level >
door.hq.seenClearance` → ~1.7 s after entry (the load card is gone)
`paChime`, then 1.5 s later the **PERSONNEL NOTICE** panel (kicker
EFFECTIVE IMMEDIATELY · canon date, the new title large, "CLEARANCE L2 ·
FORMERLY L1 DOORMAT", a thunking PROMOTED stamp, the memo line naming
the new leaf, SEE THE DOOR ▸ YOUR OFFICE / YOUR CARD / NOTED) with a
`stamp` thunk; `door.cardStamps` gains `{word:'PROMOTED', ink:'admit',
note:'L2 · DOORSTOP · <canon>', kind:'promotion', level}` (the card back
already renders these); `seenClearance` is saved. A profile seen for the
first time is acknowledged silently at its current level (no ceremony
for legacy L1s). The leaf itself needs no work: scenes rebuild on enter
and `rankDoor` doors already wear `doorClearance().door`. Dev / story
hook: `window._doorPromote(3)` → KNOCKER, re-enters the egress when it is
open so the notice plays.

**First-run checklist for the user:** (1) `index.html?codered=prebuilt_
mars` → Play: the doorbell rings ~1.4 s in, the strip shows CODE RED ·
MARS strobing, BAY 4 · CELESTIAL's lamp strobes; (2) click the pill: the
brief names an entity and its point of entry, WALK TO BAY 4 works; (3) E
at Bay 4 → the row for Mars reads CODE RED with RESPOND ▸ Δ; ENTER THE
BAY → the Mars threshold strobes, its leaf still opens as you approach,
its panel leads with the red brief; (4) RESPOND: match select is
pre-filled on Mars Δ, and after CONFIRM the CPU party's first unit is the
named entity; (5) win it: the result stamp carries CODE RED CLEARED · 💰
+200, the wallet grew by 200 beyond the match, and back in the building
the pill reads CLEARED (green) and Bay 4 is green again; a LOSS leaves it
strobing and RESPOND re-arms; (6) `?codered=` off, with a real mastered
site the Code Red only appears once a threshold is green; (7) Keys: the
strip's KEYS count equals your hourglass pickups on the achievements
page; the ELEVATOR panel's disabled button reads CLEARANCE L4 + 12 KEYS
REQUIRED; (8) console `_doorPromote(2)`: chime → PERSONNEL NOTICE
DOORSTOP → PROMOTED stamp → the office door is the hollow-core leaf;
`_doorPromote(1)` puts it back (no notice for a demotion).

**Next (in order):** 4.1 the case-file screen proper (SP meter,
`DOOR_TEXT.CHAPTERS`, `promoteTo` → `_hqCheckPromotion`, memos,
commendations — Code Red clears and stabilized counts are the first
two); 6.3 Keys wording on the hourglass pickups + THRESHOLD STABILIZED;
§3.9 the in-game layout editor; gamepad in the hall; a first-visit
micro-scene at the desk (4.2); the training room (6.1) as the next box
room. Open: should a Code Red ALSO pay SP once the meter exists (yes,
rec. +5); whether Code Red should pick among UNSTABLE sites too once a
profile has stabilized ≥ 6 (rec. no — the joke is the green lamp).

### 2026-09-04 (batch 2) — fourteen more leaves, the whole rank ladder moves
User uploaded the wishlist to `/doors` (14 GLBs, all single leaves, one
mesh, unit-scaled, no frame except the hell arch). Parsed + rendered
offline; hinge side read from the handle. `npm test` 104 pass. Cache
token `20260904b-cors` → `20260904c-cors`. data.js only.
- **Catalogue +14**: barn .684 · saloon .572 · frosted_single .480 ·
  stable .516 · bathroom .387 · stall .588 · cell .709 · hell_arch .734
  (static, frame) · glass .439 · glass_exec .487 · holographic .609
  (slide) · hospital .498 · hotel .508 · motel .533. `leaf_frosted` (the
  pair) lost its rank and joined the pool.
- **L5 GATEKEEPER = `leaf_frosted_single`** — six of six rank doors now
  open (L1–L5 swing, L6 slides).
- **Re-homed**: reception → glass, medical → hospital, engineering →
  glass_exec, bay_quarantined → cell; thresholds nuketown → motel,
  skinwalker → stable, bohemian_grove → saloon, babel → barn, cyberpunk →
  holographic, heaven → hotel, hell → hell_arch (single opening, the dark
  plate shows through the arch). Unassigned pool: bathroom, stall,
  suburban, closet, closet_alt, shabby_wood, frosted pair.

### 2026-09-04 (later) — doors fit their frames, rank leaves exclusive, doors open
User: doors were different sizes, did not fill their frames or looked
awkward; the 18 GLBs were committed to `/doors`. Parsed + rendered offline
(one mesh each, unit-scaled, no animation). `npm test` 104 pass. Cache
token `20260904a-cors` → `20260904b-cors`.
- **Measured catalogue** (data.js): every leaf has `aspect` (W/H from the
  GLB bbox), `wide` (opening class — THE LEAF DECIDES), `yaw: 90` on the
  hollow-core door (authored edge-on), `open: 'swing' | 'slide'` +
  `hinge`, `frame` (jambs baked into the mesh — informational) and `rank`
  (1–6, exclusive). Aspects: closet_warped .604 · hollow_core .545 (after
  yaw) · office .490 · security .686 · frosted .785 · futuristic .547 ·
  closet .454 · closet_alt .477 · exit .451 · shabby .525 · suburban .433
  · suburban_house .453 · wired_double .908 · vault 1.0 · portcullis .846
  · revolving 1.143 · bulkhead 1.0 · frame_only .637.
- **`_hqBuildDoors`** (three-renderer.js): opening width = aspect × opening
  height, clamped (single 0.95–1.6 m, wide 1.9–2.5 m); the panel (2.5 /
  3.3 m) is unchanged so the jambs absorb the difference. The leaf is
  height-fitted then X-stretched the last few percent (`g.scale.x`), Z
  scaled with it. A `swing` leaf hangs on a hinge pivot at the jamb edge
  and opens ~83° TOWARD the walker (behind it is the wall); a `slide`
  leaf rides a carrier into the `hinge`-side jamb with a world-space
  `THREE.Plane` clip at the jamb edge (`renderer.localClippingEnabled`),
  cloned materials so the plane never leaks to the same model on another
  door. The elevator halves pocket the same way. `rec.ow` (real opening)
  drives `_hqFindTarget`'s box-room reach.
- **`_hqTickDoors`**: the current interaction target opens (ease in-out,
  ~0.5 s) and closes when the target changes; `sealed` / `clearance` /
  `codered` stay shut. Static leaves have no `motion`.
- **Re-homed doors** (rank leaves freed): reception → closet_alt, medical
  → closet, engineering → suburban, continuity → suburban_house, bay 4 →
  bulkhead, bay 3 → wired_double, bay 6 → exit; thresholds area51 →
  closet, cern → bulkhead, vatican → closet_alt, technoticlan → portcullis,
  cyberpunk → closet (single now), heaven → suburban_house, hell →
  bulkhead (wide now), flatlands → frame_only. `hqBayRoom` fallback →
  `leaf_closet_alt`. L3 KNOCKER = `leaf_office`.
- **doorhq.test.js +3**: measured aspect / legal motion per leaf; rank
  exclusivity (+ at least four rank doors move); door `wide` flags agree
  with the leaf; the revolving door stays sparing.
- **Asset wishlist** (handed to the user): a SINGLE-leaf frosted executive
  glass door (so L5 can swing), a motel/hotel room door with a number
  plate, a hospital ward door with a porthole, a rusted steel hatch that
  is a leaf only (no ring), a saloon/lodge door, a cell door with a slot,
  a barn/stable door — all as ONE leaf, NO frame, hinge edge flush, front
  face +Z. Avoid doubles, sliders and anything with the frame in the mesh.

### 2026-09-04 — closet polish: the rug lies flat, the sink hangs at waist height
User (with a screenshot): the round rug stood on edge and the sink was
bathtub-sized on the floor. `npm test` 101 pass. Cache token
`20260903e-cors` → `20260904a-cors`.
- **Sink** (data.js catalogue): was `h: 0.85` — a height fit on a shallow
  basin scaled it to ~3 m wide. Now `span: 0.75, mount: 0.60` (underside;
  rim ≈ 0.85 m, the shelves above it at 1.55 / 2.0 clear it) with the new
  `block: true` so it keeps its `foot` blocker even though it is mounted.
- **Rugs** (data.js catalogue): `rug_round` / `rug_office` get `lay: true`;
  `rug_round` span 1.8 → 1.5 for the closet.
- **three-renderer.js `_hqPlaceProps`**: catalogue `lay` — after the GLB
  fit, the thinnest bbox axis is turned upright (z-thin → tip back on x,
  x-thin → tip on z, already-flat → no-op) and the group re-seated on the
  floor with a 4 mm lift against z-fighting. Catalogue `block` forces the
  floor blocker regardless of `mount` / `ceil` / `y`.
- Could not verify the GLB bboxes (cdn.entropywars.net is blocked from the
  agent): the sink `span`/`mount` are eyeballed from the screenshot — tune
  `mount` (0.55–0.65) and `span` (0.65–0.85) in place if the rim is off.

### 2026-09-03 — Phase 2.7: the janitor's closet (the first interior, the first box room)
User: "continue with the build plan". `npm test` 102 (101 pass, the server
smoke skips without node_modules); 3 new checks in `doorhq.test.js`.

**The room (data.js `rooms.office`).** YOUR OFFICE is the first room with
right angles: `kind: 'box'`, a Cartesian frame (x east, z south, metres
from the room centre), 5.6 × 4.6 m, 3.4 m ceiling (door panels are 3.5 m
to the plate, so box rooms clamp the lintel / cap / lamp under `h − 0.25`
— a lower ceiling still works). Doors and wall props name a `wall`
(`n | e | s | w`) and the spot along it (`x` on n / s, `z` on e / w); free
props sit at `x, z` and `face` the heading their front points (deg cw
from north); `rot` is extra yaw as before. Layout after
`janitor_closet_v1`: the way out on the west wall (z −0.5) with the
cleaning shelves beside it; the north wall left → right: hook rail with
the broom and mop under it, the sink under two shelves of bottles, the
breaker panel, the tanker desk (CRT, rotary phone, desk lamp, papers,
pen, notebook, two clipboards above), the vent; the east wall: the locker
(toilet paper on top), the cot, a shelf with the desk fan; the south wall:
the clock, the extinguisher, boxes; the floor: mop bucket by the sink,
the drain, the round rug; one fluorescent. Spawn just inside the door
facing east. No NPCs (it is your closet).

**Procedural props.** Catalogue entries may now carry `proc: '<builder>'`
instead of `file` (`depth` = stand-off for wall-hung ones; the test
accepts either). three-renderer.js `_hqProcBuilders` builds them in
metres, base on y = 0, front +Z: `tanker_desk`, `floor_drain`,
`vent_grille`, `wall_shelf` (with bottles), `metal_shelving` (with
cans / boxes), `hook_rail`, `broom`, `rotary_phone`, `toilet_paper`,
`clipboard`. Give any of them a `file` and the GLB takes over.

**Renderer (three-renderer.js).** `HQ_WALLS` / `_hqBoxWall(room, wall,
spec)` → the wall point, inward normal and the yaw that faces a +Z-front
object into the room; `_hqHeadingOf`. `_hqBuildBoxShell`: floor + ceiling
planes, four wall slabs with dado + three trims, two conduits + brackets
across the ceiling with a cross pipe and a corner drop, a procedural
fluorescent strip + glow at `shell.light`, the room plate (CSS2D) at
`shell.plate`. Box branches in `_hqBuildDoors` (flat-wall placement,
`rec.box`), `_hqBuildCounters` (`x, z, face`, plate only), `_hqPlaceProps`
(rewritten around one `place(depth)` closure: box wall / box free / polar
wall / polar free; proc props placed synchronously), `_hqSpawnCharacter`
(`x, z` specs), `_hqSurface` (inside the four walls, prop discs),
`_hqCamBlocked`, `_hqFindTarget` (2.6 m in front of the panel, inside its
width), `_hqGoTo` (1.6 m in front, facing it / away; box counters: 1 m
south of the spot), `_hqEnter` (lights: dim hemisphere, the fluorescent
point, a warm pool at every `desk_lamp` / `table_lamp`; the boom starts at
0.6 × d). **Rank door (3.4, leaf half):** a `rankDoor` wears
`doorClearance(profile).door` and widens when that leaf is wide (L5
frosted pair; since 2026-09-04 the leaf decides every opening) — the egress office door and the closet's way
out both, so it is the same door from both sides. Scenes rebuild on every
enter, so a promotion shows the next time you walk in.

**Flow (map.js).** The egress office door's action is `{ room: 'office',
at: 'egress' }` — the panel's INTERIOR NOT YET BUILT button became GO
THROUGH ▸ YOUR OFFICE by itself (the room id exists now). Inside, the way
out is `{ room: 'central_egress', at: 'office' }`. The **IN-TRAY** counter
(`overlay: 'intray'`, prompt verb READ via the new counter `verb` key)
opens `_hqInTrayHtml`: OFFICER + EMPLOYEE NO., CLEARANCE + the door it
issues, NEXT DOOR (AWAITING FIELD WORK), the six-rung ladder as chips,
DIRECTIVE (`profile.door.pendingDirective` or NONE PENDING), VISITS TO HQ,
THRESHOLDS STABILIZED, MEMOS READ · STAMPS ON CARD, RECENT CASES (the
last four `matchHistory` rows: site · CLOSED / OPEN · condition), then
ANSWER A BELL CALL / YOUR CARD ▸ PROFILE (the modal pauses the closet
underneath and resumes on close) / NOTED. Reads the profile only. The
directory labels a box room's doors WALL N / E / S / W.

**Files (RULE #1 placement):** data.js (proc catalogue entries,
`rooms.office`, the office door action), three-renderer.js (`HQ_WALLS`,
`_hqBoxWall`, `_hqHeadingOf`, `_hqBuildBoxShell`, `_hqProcBuilders` /
`_hqProcProp`, `_hqRankLeaf`, box branches everywhere above, door-panel
clamps), map.js (`_hqInTrayHtml`, counter verbs, directory walls),
styles-base.css (`.hq-row-tray`), index.html (`?v=20260903e-cors`),
doorhq.test.js (+3: the office ↔ egress door pair and every rank leaf;
box doors on a named wall with a panel that fits; box props inside the
walls, mounts under the ceiling, the reference kit present, the in-tray
within reach of the desk). Docs: this file, DOOR_MASTER Part D. No
mid-match surface → no relay work (RULE #2).

**First-run checklist for the user:** (1) E at YOUR OFFICE (150°) → GO
THROUGH: do you stand just inside the closet with the door at your back,
facing the desk wall? (2) is the door's leaf the warped closet door on
BOTH sides (L1)? (3) walk the room: do the desk, chair, locker, cot and
shelving block you where they should, and is the boom camera usable in a
5.6 m room (WHEEL in if not)? (4) do the wall props face into the room
(sink, locker, breaker, extinguisher, clock — `EW_HQ_FLIP_LEAVES` does not
touch props; report which ones are backwards and Claude flips their
`rot`)? (5) does the cot run along the east wall (if it runs across the
room its long axis is the other one — set `face: 0`)? (6) E at the desk →
IN-TRAY reads your card; YOUR CARD opens the profile and closing it
resumes the closet; (7) E at the door → back in the egress with the office
door behind you; (8) `?hqdebug` positions are box-local (x z metres, the
deg / r are about the room centre).

**Next (in order):** 3.3 Code Red; 3.2 Keys; 3.4's promotion moment
(`paChime`, the card stamp, the new leaf); 4.1 the case-file screen
proper (SP meter, chapters, memos) growing out of the in-tray; §3.9 the
in-game layout editor; gamepad in the hall; a first-visit micro-scene at
the desk (4.2); the training room (6.1) as the next box room. Open: the
egress bay-door panel's quick-dispatch rows; whether the closet gets a
curved back wall (it sits in the ring — cosmetic, collision stays a box).

### 2026-09-03 — Phase 2.6: the six bays as walkable corridors
User: "continue with the build plan". `npm test` 99 (98 pass, the server
smoke skips without node_modules); 3 new checks in `doorhq.test.js`.

**Rooms.** The building has more than one room now. `DOOR_HQ.rooms`
gains six generated `bay_<sector>` rooms (`kind: 'bay'`) built at load
by data.js `hqBayRoom(sector)` from three tables — never hand-edit the
generated rooms:
- `DOOR_HQ.bayShell` — the corridor: an annular sector r 8.5 → 12.5
  (4 m wide) around its own centre, 4.2 m tall (the egress ground-floor
  height, so the 3.76 m door caps and the nameplates above them clear the
  ceiling), `spacing` 3.9 m of outer wall per threshold, `endPad` 9° of
  blank wall before each end cap, `minHalf` ±24°. The arc is ±(n·17.9°/2
  + 9): TERRESTRIAL (8 maps) ±80.5°, ANCIENT ±71.6°, HOLLOW ±53.7°,
  DIPLOMATIC ±44.8°, CELESTIAL ±35.8°, QUARANTINED ±26.9°.
- `DOOR_HQ.thresholds[mapId] = { leaf, wide, note }` — which of the 18
  leaves hangs on each of the 29 thresholds (Moon / Stonehenge / Göbekli /
  Hollow Earth / Olympus = the bare frame, Atlantis / Mars / D.U.M.B. /
  Antarctica = the bulkhead, Camelot = the portcullis, Backrooms = the EXIT
  door, …) plus a one-line "THE DOOR:" note for the panel. The test
  requires an entry for every launch map and no strays.
- `DOOR_HQ.bays[sector] = { agent, lines, props }` — the bay guard's
  line, overheard lines, and a few extra props in the bay's local frame.

Local polar frame per bay: deg 0 = **the way out** (door id `egress`) on
the INNER wall, wearing the same leaf as the bay door shows in the egress
(the same door from both sides), `action: { room: 'central_egress', at:
<the egress bay door id> }`. Thresholds (`site_<mapId>`, `action: {
mission: mapId }`) are spread evenly along the OUTER wall; for an odd
count one sits straight across from the way out. Standard dressing:
`fluorescent` fixtures every 3.2 m along the ceiling centreline (the
first `ceil` props — the renderer now hangs `cat.ceil`/`p.ceil` props
from `_hqCeilY`), extinguisher + breaker panel flanking the way out, a
clock, site-file cabinets at the ends (papers on one), boxes in a corner,
the guard by the outer wall just past the way in. Spawn: deg 0, r 10.7,
facing the thresholds. New door / prop key: `side: 'in'` = hangs on the
inner wall and faces OUTWARD (`_hqWallR(room, level, side)`); the test
insists every wall prop in a bay names `side: 'in'` (the outer wall is
thresholds).

**Renderer (three-renderer.js).** `_hqBuildBayShell`: floor + ceiling
sectors (concrete / acoustic panel), `_hqArcBand` partial-cylinder walls
(outer BackSide, inner FrontSide) with dado + three trims each, two end
caps with their own dado/trim strips, a teal guide line down the middle
and an oxblood hazard band along the threshold wall, procedural
fluorescent strips + glow, a two-conduit pipe run with brackets high on
the inner wall, and the bay stencil (CSS2D) at the far end. Side-aware
`_hqBuildDoors` / `_hqPlaceProps` / `_hqFindTarget` / `_hqGoTo` (an
inner-wall door is faced by heading toward the arc centre; `goTo(id,
faceAway)` still means "door at your back"). `_hqSurface` / `_hqCamBlocked`
gained a corridor branch (between the wall arcs, short of the end caps,
prop blockers as before). Bay lighting is cooler: a flatter hemisphere,
point lights along the centreline. `ThreeRenderer.hq.room()` reports the
live room. Side fix: `_hqSectorMesh(..., down)` used `rotateX(+90°)`,
which mirrors the sector through X — the stair-landing undersides were
drawn at the mirrored angle (hidden by the symmetric layout); it now
mirrors Y, which flips the winding without moving the arc.

**Flow (map.js).** `_hqCurRoom` / `_hqLastRoom` beside `_hqLastDoor`;
`_hqRoom()` is the live room. `window._hqGoRoom(roomId, at)` rebuilds the
scene for another room under the loading card ("admitting you to bay 1 ·
terrestrial…") and stands you at door `at` with it at your back. Door
actions: `{ sector }` (the egress bay doors) walks into `bay_<sector>` at
its `egress` door; `{ room, at }` walks anywhere a room exists (the
office / training / continuity / executive doors stay "INTERIOR NOT YET
BUILT" until their rooms exist — the panel enables itself the moment a
room id appears in `DOOR_HQ.rooms`). The egress bay-door panel keeps its
quick-dispatch rows (CROSS / DEEP per threshold, the checklists) and
gains **ENTER THE BAY ▸ WALK THE THRESHOLDS** on top; the user can drop
the rows later if the corridor should be the only way. Inside a bay, a
threshold's panel (`_hqThresholdPanelHtml`) is the site file: the customs
stamp, JURISDICTION, FIRST DOCUMENTED CROSSING (`doorSiteCanonDate`) +
case number, the file summary, the field description, THE DOOR note,
ENTITIES ON FILE chips (`hqMissionPool` natives), the ☑/☐ checklist, then
CROSS ▸ Δ BOARD · 4v4 / DEEP CROSSING ▸ FULL SITE · nvn. The prompt reads
[E] OPEN on a threshold. `_hqLaunchMission` records the room, so the
post-match return rebuilds THAT bay at THAT threshold; `_hqReturnOrMenu`
passes `room: _hqLastRoom`. Play always starts on the egress floor.
`Q` (dispatch) and the strip's DIRECTORY work from a bay by borrowing the
egress counter definitions; the directory lists the live room's doors
(INNER WALL / THRESHOLD) with WALK. `doorSiteState` handles `{ mission }`
(the site's own mastery; a locked sector seals its thresholds).
`profile.door.hq.lastRoom` joins `lastDoor` (profile.js backfill).

**Files (RULE #1 placement):** data.js (`bayShell`, `thresholds`,
`bays`, `hqBayId`, `hqBayRoom`, generated rooms, `doorSiteState`),
three-renderer.js (`_hqArcBand`, `_hqWallR`, `_hqCeilY`,
`_hqBuildBayShell`, side-aware doors/props/targets/goTo, corridor
surface + camera, bay lights, `hq.room()`), map.js (rooms, `_hqGoRoom`,
threshold panel, room-aware directory / counters / return), profile.js
(`lastRoom`), styles-base.css (`.hq-site*`, `.hq-chips`, `.hq-chip`,
`.hq-plate-bay`), index.html (`?v=20260903d-cors`), doorhq.test.js (+3).
Docs: this file, DOOR_MASTER Part D. No mid-match surface → no relay work
(RULE #2); the building is still never alive during a match.

**First-run checklist for the user:** (1) E at BAY 1 · TERRESTRIAL →
ENTER THE BAY: do you stand facing the thresholds with the suburban door
at your back? (2) walk the arc: do the door leaves face into the corridor
(else `EW_HQ_FLIP_LEAVES=true` — same convention as the egress)? (3) do
the wall props on the inner wall face you (they use the same +Z
convention flipped by `side: 'in'`)? (4) E at the way out: do you land in
the egress with the bay door behind you? (5) open a threshold, CROSS, play,
and confirm the result screen's D.O.O.R. HQ button re-admits you INTO the
bay at that threshold; (6) Q from inside a bay opens Dispatch; (7) the
fluorescent fixtures hang at the ceiling (if they float or sink, the
`fluorescent` catalogue span is the knob). Report `?hqdebug` positions
(they are bay-local: deg 0 = the way out).

**Next (in order):** 2.7 the closet interior (kit uploaded — `kind:
'box'` room, the same room plumbing now exists); 3.3 Code Red; 3.2 Keys;
§3.9 the in-game layout editor; gamepad in the hall; a first-visit
micro-scene at the desk (4.2). Open: whether the egress bay-door panel
should lose its quick-dispatch rows now that the corridor exists.

### 2026-09-03 — Phase 2.2 (wedge kit re-homed) + Phase 3.1 (mastery checklists)
User: "continue with the build plan; I uploaded the round wedge desks to
the repo for their dimensions, but I like the generated circular desk —
use the desk models somewhere else." `npm test` 96 (95 pass, the server
smoke skips without node_modules); 3 new checks in `doorhq.test.js`.

**Measuring the wedges (no R2 access from the sandbox).** The three
GLBs sit at the repo root. A scratch node script parsed each JSON chunk
+ POSITION accessor, rasterised top / front / iso views to PNG (a 90-line
software rasteriser — no browser, RULE #1c) and least-squares-fitted the
straight edge of the top surface. Findings, model units (Meshy
normalises the longest axis to 1.0):
- `reception_wedge` (…0903105549): 1.000 × 0.674 × 0.865 — NOT a 45°
  sector: a corner reception counter whose two straight sides meet at the
  −x/−z corner, a banded curved front bulging to +x/+z with a raised
  transaction ledge along it; the work surface sits at ≈ 0.70 × height
  (0.77 m at the 1.10 m target).
- `desk_wedge_a` (…0903105601): 1.000 × 0.637 × 0.686 — a solid
  kidney-shaped workstation, convex side −z, concave (worker) side +z.
- `desk_wedge_b` (…0903105612): 1.000 × 0.639 × 0.678 — a 45.3° annular
  sector on two leg frames; edge fit x = 0.417 z − 0.307 → apex at
  z = 0.737, outer r 1.075, inner r 0.398 → at the 0.76 m target
  (s = 1.19) a ring of 8 would be r 1.28 m / hole r 0.47 m.

**Where they went (data.js `central_egress.props`).**
- RECEPTION · INTAKE (door @120°): the reception counter at 128° / r 17.9,
  `rot: 45` so the curved front faces the hall and the clerk's
  `office_chair` (129° / 18.95) sits on the wall side; `crt_terminal`,
  `papers_a`, `pen` on the 0.77 m work surface. `foot: 0.85`.
- The **briefing table**: `desk_wedge_b` with `ring: { n: 4, start:
  -67.5 }` at 20° / r 14.5 — a half-ring (r 1.28 m) opening toward the
  hall; four `folding_chair`s at the sectors' bisectors 0.5 m off the
  outer edge (13.8°/15.27, 17.6°/16.16, 22.4°/16.16, 26.2°/15.27, `rot`
  ±61 / ±20 = facing the ring centre); papers on top.
- Two **mezzanine clerk stations** (`desk_wedge_a`, `rot: 180`, convex
  side to the hall) against the upper wall at 100° (Arcane Engineering,
  CRT + papers, office chair) and 325° (Bureau of Continuity, table lamp
  + notebook, teal chair). The slab is only 2.2 m walkable, so the chairs
  sit BESIDE the desks (±2.7°), never in front — a new test asserts every
  mezzanine floor prop leaves ≥ 2 × HQ_BODY_R of the band free (the
  existing globe lamps pass by 6 cm).
- Orientation assumption: Meshy fronts are +z (the filing cabinets face
  the hall at `rot: 0`); CRTs at the new stations use `rot: 0` = the same
  screen-to-operator relation the dispatch desk's `rot: 180` CRTs have
  (operator on the far side from the hall there, the near side here). If
  a screen faces the wrong way, flip that prop's `rot` by 180 in data.js.

**Ring props (three-renderer.js `_hqPlaceWedgeRing`).** A prop with
`ring` and a catalogue `wedge: { deg, apex, rOut, rIn }` builds n copies
under one group at the spot: copy i is a sub-group yawed −(start +
i·deg) with the instance pushed `apex × depth × s` along −z so the arc
centre sits on the sub-group origin; yaw 0 points the outer arc away from
the hall (local −z). Each copy gets its own collision disc (radius 0.45 ×
its longest span) placed as a bare Object3D directly in `propGroup`,
because `_hqSurface` reads a blocker's own position without parent
transforms.

**Mastery checklist (3.1).** data.js `hqSiteMastery(mapId, profile)` →
`{ have, done, total, missing, mastered }` (flags first, then match
history, Δ-aware); `hqMapMastered` now wraps it; `DOOR_HQ.masteryLabels`
names the conditions (WIPEOUT · TOWER · HOURGLASSES — engine-true words
until Phase 6.2/6.3 rename the tower and hourglasses). The bay door panel
(map.js `_hqDoorPanelHtml`) shows a ☑/☐ row per threshold under its
CROSS / DEEP buttons and the lamp chip reads `n/3` until STABILIZED
(`.hq-row-checks`, `.hq-check` in styles-base.css). The result screen's
D.O.O.R. stamp grows a tag (battle.js `_stampHqSite`, `.drs-site`):
green **THRESHOLD STABILIZED · <site>** when this match completed the
set, amber **FILED · <condition> · <site> n/3** when it logged a new one.
It reads the viewer-local `window._lastHqSiteFlag` (written by
`commitAchProgress`, now reset per commit and on no-contest, consumed by
the tag) — never on `state`, so nothing rides state-sync (RULE #2); the
tag is local on both clients like the stamp itself.

**Files (RULE #1 placement):** data.js (catalogue wedge geometry, props,
`masteryLabels`, `hqSiteMastery`), three-renderer.js (`_hqPlaceWedgeRing`
+ the ring branch in `_hqPlaceProps`), map.js (checklist row), battle.js
(flag reset, `_stampHqSite`), styles-base.css (checks + stamp tag),
index.html (`?v=20260903c-cors`), doorhq.test.js (+3). Docs: this file,
DOOR_MASTER Part D.

**Next (in order):** 2.6 the six bays as corridors with their threshold
doors; 2.7 the closet interior (kit uploaded); 3.3 Code Red; 3.2 Keys;
§3.9 the in-game layout editor; gamepad in the hall; a first-visit
micro-scene at the desk (4.2). Open: the wedge models are in the repo
root — they must also be on R2 under `Assets/door/models/` with the
catalogue filenames (they were listed there in the 1.1 inventory).

### 2026-09-03 — Phase 1.3 + 1.4 + 1.5: Play enters the building
User: "continue with the build plan". The isolated egress became the Play
hub. Every flow rule below is in map.js unless stated; `npm test` 92 pass
(4 new checks in `doorhq.test.js` — note the real filename has no hyphen).

**Play → HQ (D5).** `_goToPlayHub` calls `_hqEnter({from:'play'})` when
`_hqEnabled()`; the classic hub survives via `?nohq`, localStorage
`ew_hq='off'`, `window.EW_DISABLE_HQ`, the new **Settings → D.O.O.R.
Headquarters** toggle (`_hqToggleHome`), and as the automatic fallback when
the 3D enter fails (no WebGL). Main-menu buttons are otherwise unchanged;
only the Play card's description changed. The battle renderer stays alive
behind the menu after a match (only the map editor ever `deactivate()`d
it) and the HQ needs the shared canvas, so `_hqEnter` parks it first when
`state.phase !== 'battle'` — `startMatch` re-activates (it already checks
`isActive`). The playtest harnesses call `_goToVsCpu()` directly and are
unaffected.

**Return plumbing (D7).** `window._hqReturnOrMenu(fallbackPage)` is the
way back from every screen: while `_hqHome` is set (the player came in
through Play) it re-enters the building at `_hqLastDoor` (the door last
walked through, avatar placed with the door at its back —
`ThreeRenderer.hq.goTo(id, faceAway)`), else it shows the classic page.
Rewired sites: `_mdCharBack`, `_settingsBack`, `_codexBack`,
`_teamBuilderBack`, `_challengePickBack`, the Challenge run's exit, both
map-editor exits, `_msBack` + `_lobbyBack` + online.js
`lobbyBackToPlayHub` (fallback `playHubPage`), ui.js `_shopBack`, and
battle.js `backToMainMenu` (post-match; the result overlay's button reads
**D.O.O.R. HQ** via `_hqRelabelMenuButtons`, called again after
`_restoreResultOverlayButtons` rebuilds the bar). EXIT on the strip clears
`_hqHome` — Back buttons land on the main menu again until the next Play.
Two kinds of screen: **page screens and matches leave the building** and
rebuild it on return (the loading card covers the ~1 s); **pure DOM modals
(Profile / ID card, Leaderboard) and the Settings page keep it alive
underneath, paused** (`_hqSuspend` / `_hqResume`; the modal's `_unmount*`
is wrapped once so closing it resumes, deferred a tick so a launch path
would win). Community Maps is deliberately a leave (its PLAY starts a
match). ESC in the hall now opens Settings over the paused building
(D6); `Q` opens the dispatch panel from anywhere (D2, three-renderer
`onHotkey`); the strip gained a DIRECTORY button and a `STABILIZED n / 29`
count; hints updated.

**Mission launcher (D3 / §3.7).** Bay-door panels are live: every
threshold row has **CROSS ▸ Δ** (Arena, 4v4 on the site's 8×8 Δ board) and
**DEEP** (the full map at its own team size); sealed / clearance-gated bays
show them disabled with the reason. `_hqLaunchMission(mapId, {delta,
doorId, doorLabel})` sets `window._hqPreselect = {mapId, launchId, delta,
teamSize, gm:'arena', roster, doorId, doorLabel}` + `_msCpuOnly`, buzzes,
leaves the building and opens `modePage`. `_msRenderAll` remounts the
MatchSelect React root once while a fresh preselect is pending, and the
component's initial state reads it (mode / map / Δ filter / team size) and
shows a "DISPATCHED FROM <door> · 4v4 Δ BOARD · CPU FIELDS THE SITE'S
NATIVE ENTITIES" line in the FIELD ASSIGNMENT slip. Nothing about match
setup is bypassed: the player can still change anything, CONFIRM files
the form, the party builder runs. `_msConfirm` reads the preselect once:
`window._hqCpuPool = roster` only if the launched map is still that site
(else null); `_msBack` / `_goToVsCpu` clear it. **CPU roster pinning**
(state.js): `randomizePartyIdentities(count, ownedOnly, pool)` /
`randomizeIdentity(ownedOnly, forceRace)` — `optimizeRandomizeParty(2)`
and `rerollOpponentForNextMatch` pass `window._hqCpuPool`; the natives are
shuffled among themselves, padding races only appear when they run out;
a pinned race must be real and 3D-ready, ownership never applies to the
CPU. **Pool** (data.js `hqMissionPool(mapId, n)`): the site's natives
(`doorSiteCrossings`), then maps sharing a biome (most shared first), then
the rest of the sector, then any launch map, until ≥ n distinct;
`pool.natives` = how many lead entries are true natives. Filtered by
`isRace3DReady` when sprites.js is loaded (not in the headless test).

**Mastery (D9 / 1.4).** battle.js writes `prog.unlocked['site:<site>:
<winCondition>'] = Date.now()` inside the existing achievements commit
(same `saveProgress` / server sync) for a standard-match win whose
condition is in `DOOR_HQ.masteryConditions` and whose map is a bay
threshold; the Δ suffix is stripped (`hqSiteId`) so a Δ-board win counts
for the site; PvP wins count (MASTER B3). `hqMapMastered` now strips the
suffix on history rows too; `hqMasteryCount(profile)` feeds the strip.
Side fix: profile.js `buildProfileMatchSummary` recorded `mapId:
'unknown'` for every match (`st._mapPresetId` was never written anywhere)
— it now falls back to `activeGameMode`, so match history finally knows
the map. `window._lastHqSiteFlag` (viewer-local) notes a freshly written
flag for a later "THRESHOLD STABILIZED" stamp on the result screen.

**Audio (1.5).** audio.js `startDoorRoomTone()` / `stopDoorRoomTone()`: a
synthesized hall loop (looped noise through a wobbling low-pass = HVAC,
60/120/180 Hz hum, a faint ballast hiss) riding the Ambience slider
(`applyAmbienceVolumeMix` → `_doorRoomToneApplyVol`), started on enter /
resume, stopped on leave / suspend; `EW_DISABLE_AMBIENCE` kills it.
`doorBuzz` fires on every door use (`_hqDoAction`, `_hqLaunchMission`) and
on the way in from Play, not on returns. `syncMusicToState` plays
`doorMuzak` in the HQ once `audioTracks.doorMuzak` exists (user-made,
MASTER B4) and `mainTheme` until then. `paChime` stays reserved for the
promotion moment (Phase 3.4).

**Profile.** `door.hq = {visits, lastDoor, variantSeed, keys}` backfilled
(`defaultDoor`); `visits` counts entries from Play, `lastDoor` is the last
door walked through (`_hqRecordVisit`). Data only.

**Files (RULE #1 placement):** data.js (`hqSiteId`, `hqMasteryCount`,
`hqMissionPool`, `hqMapMastered` Δ-aware), state.js (pool-aware party
randomizer), battle.js (mastery flag, HQ return, relabel hook), profile.js
(`door.hq`, `mapId`), ui.js (`_shopBack`), online.js
(`lobbyBackToPlayHub`), three-renderer.js (`Q` hotkey → `onHotkey`,
`goTo(id, faceAway)`), audio.js (room tone), match-select.js (preselect
+ dispatched line), map.js (everything above), styles-base.css
(`.hq-row-bay`, `.hq-row-btns`, `.hq-strip-stat`), index.html (Play
text, strip DIRECTORY + mastery, hints, `?v=20260903b-cors`),
doorhq.test.js (+4 tests). No mid-match surface changed → no relay work
(RULE #2); the building is still never alive during a match.

**Next (in order):** 2.2 wedge desk once the wedge dimensions are known;
2.6 the six bays as corridors with their threshold doors; 2.7 the closet
interior (kit uploaded); 3.1 mastery checklist inside the door panel +
the result-screen THRESHOLD STABILIZED stamp (reads
`window._lastHqSiteFlag`); 3.3 Code Red; §3.9 the in-game layout editor;
gamepad in the hall; a first-visit micro-scene at the desk (4.2).

### 2026-09-03 — Phase 1.1 + 1.2 shipped as an ISOLATED build (Play untouched)
User: "build/design the facility isolated before connecting it to the main
menu buttons"; uploaded the textures + most models (§5.5) and committed the
reference art under `door_reference_images/` (not `docs/door-hq/ref/` —
fine, the plan's file names in §5.1 map onto them by content).

**How to enter (dev only, nothing on Play changed):**
- `index.html?hq` — skips the ident + title, lands on the egress floor.
- `window._hqEnter()` in the console from the main menu.
- `?hqdev` once → a purple "🚪 D.O.O.R. HQ · DEV BUILD" pill sticks to the
  main menu (localStorage `ew_hqdev`; `localStorage.removeItem('ew_hqdev')`
  hides it). `window._hqExitToMenu()` / ESC / the strip's EXIT leave.
- Controls: WASD/arrows walk, SHIFT run, SPACE hop, E/Enter use, V first
  person (click locks the mouse), drag = orbit, wheel = boom, ESC = close
  panel / leave. Gamepad not wired yet.
- Tuning loop: `?hq&hqdebug` prints `deg · r · y · level · x z` bottom-right.
  Report positions like "water cooler → deg 196 r 19.6" and Claude edits
  `DOOR_HQ`; the §3.9 in-game editor is still to do.
- Console switches: `EW_HQ_FLIP_LEAVES=true` (every leaf 180° — use this if
  doors show their backs), `EW_HQ_NO_PROPS` (shell only), `EW_HQ_NO_POST`
  (bypass the retro/bloom stack), `EW_HQ_AVATAR='race'|{race,gender}`,
  `EW_HQ_DEBUG`, `EW_HQ_DEV`. All read at `_hqEnter` time except the first.

**Files (RULE #1 placement, all existing):**
- `data.js` — `DOOR_HQ` (units, R2 asset roots, the 8 textures, a 70-entry
  catalogue with target sizes in metres + collision radii + wall/mount/glow
  flags, the six sectors, `masteryConditions`, the `central_egress` room:
  shell numbers, procedural desk, 2 stairs, 15 doors, 3 counters, ~75 props,
  3 agents, 5 npc spots, 6 overheard lines, spawn) + helpers `hqPolar`,
  `hqSectorOfMap`, `hqMapMastered`, `doorSiteState`. C-1 rank strings
  landed (DOORMAT…THE DOORMAN) with a `door` leaf key per rank.
- `three-renderer.js` — the HQ module (search `D.O.O.R. HEADQUARTERS`),
  exported as `ThreeRenderer.hq = {enter, leave, active, setPaused,
  interact, toggleView, isFirstPerson, refreshLamps, goTo, target, pos,
  stateLabel}`. Own `THREE.Scene` + camera + `setAnimationLoop` on the
  shared renderer; the canvas + CSS2D overlay are re-parented into
  `#hqStage` for the visit. Procedural: floor + inlaid bands + 8 spokes,
  lower drum (wall/dado/three trims), mezzanine slab (top/underside/fascia)
  + instanced posts + torus rail arcs with gaps at the landings, upper
  drum, ceiling cone + lid + 24 instanced light strips with glow sprites,
  the cube (canvas glyph emissive, slow yaw) on its rod, two curved stairs
  (one InstancedMesh each, sloped inner rail, top landing sector with
  rails), the two-ring dispatch desk with the seal decal + a point light,
  door frames (jambs/lintel/back plate/dado/cap/teal reveal + lamp housing
  + lens + glow), the elevator pair, the EMPLOYEE OF THE MONTH board, the
  directory kiosk. Kit props via `_miscModelInstance` (misc-model cache),
  materials re-wrapped as linear Lambert, sizes auto-normalised from the
  measured bounds, wall props pushed back to touch the wall once their
  depth is known, glow sprites for lamps/screens. Leaves fitted by height
  and clamped to the opening width. Characters = `createUnit` +
  `_attachUnitModel` (shared animation library retargeting) with mixers
  ticked in the HQ loop; silhouette/outline twins hidden.
  Walking: polar walkable query (`_hqSurface`: stairs → landings → slab →
  floor, ±0.62 m step tolerance = the railings, prop footprints as
  circles), axis-separated slide, camera-relative input, idle/walk/run/
  jump clips, lean + landing bounce. Camera: third-person orbit with a
  12-sample boom march against walls/slab/ceiling/floor and auto-follow
  behind the runner; first-person eye with pointer lock. Lamps from
  `doorSiteState` (amber pulse, red, green, off; strobe reserved for Code
  Red). CSS2D nameplates fade with distance. Interaction targets: door arc
  (±6° within 3.4 m of the wall), counter radius, character within 1.75 m.
- `three-post.js` — `ThreePost.renderScene(scene, cam)`: renders any scene
  through the composer (bloom for the lenses, FXAA, grain/dither/levels
  retro pass) with the tilt-shift DoF, night grade and unit pixel mask
  switched off for the frame; everything restored after.
- `map.js` — `_hqEnter/_hqLeave/_hqExitToMenu/_hqClosePanel/_hqDoAction/
  _hqDevPillRefresh` (window.*), prompt + panel builders: room doors (ENTER
  → the screen's own `_goTo*` / `_mount*` entry, ALT buttons for Party
  Builder / Replay / Community Maps / Challenge / Mystery Dungeon), bay
  doors (the sector's thresholds with site-file stamps + UNSTABLE/
  STABILIZED chips, launch buttons DISABLED until Phase 1.3), dispatch
  (Quick Play / Friendly), the board (Leaderboard), the directory (every
  place + WALK teleport), agent/vessel one-liners. `_showTitlePage` hides
  the menu-bg canvas on `hqPage` and refreshes the dev pill.
- `index.html` — `#hqPage` (stage, strip with seal/officer chip/wallet/
  EXIT, hints, prompt, debug, panel, loading card) + the dev pill; `?v=`
  → `20260903a-cors`. `styles-base.css` — `.hq-*`. `state.js` — `GS.HQ`.
  `ui.js` — `?hq` autostart after `_gameReady`. `door-hq.test.js` — 11
  headless checks (catalogue shape, key resolution, door spacing vs stair
  arcs, sector partition of the 29 launch maps, walkable radii, rank
  ladder, `doorSiteState`/`hqMapMastered`). `npm test`: 89 pass.

**Layout as built (metres; deg cw from north; north = the far wall from
the spawn):** ground drum r 21, wall 4.2; mezzanine slab r 20.6→24 at 4.2;
upper drum to 9.6; cone to 12.8; cube 3.6 m centred at 7.4 m. Desk rings
r 2.6/5.6, 1.05 high. Stairs: E 18°→62°, W 342°→298°, treads r 19.35–20.6,
24 steps, landings 6° past the top. Ground doors: 0 BAY 4 CELESTIAL
(futuristic), 90 QUARTERMASTER (vault → Shop / Party Builder), 120
RECEPTION (office → Profile), 150 YOUR OFFICE (warped closet, rank door),
180 TRAINING FACILITY (exit door + EXIT sign; alts Challenge / Mystery
Dungeon), 210 MEDICAL (office → Challenge), 240 RECORDS (wired double →
Codex; alts Replay / Community Maps), 270 BAY 1 TERRESTRIAL (suburban).
Mezzanine: 0 ELEVATOR (proc, L4), 45 BAY 2 ANCIENT (portcullis), 90
ARCANE ENGINEERING (office → Map Editor), 150 BAY 5 DIPLOMATIC
(revolving), 210 BAY 3 HOLLOW (bulkhead), 270 BAY 6 QUARANTINED (security,
sealed), 315 BUREAU OF CONTINUITY (frosted, L5). Counters: DISPATCH (180°,
r 6.9), EMPLOYEE OF THE MONTH (288°, wall), DIRECTORY (165°, r 19.6).
Spawn 180° r 15.4 facing the desk. Agents at the desk centre, the board,
and the ANCIENT bay.

**Deviations / decisions taken:** asset paths (above); no `state._hq*`
fields (state lives in the renderer module, so no `_serializeState` skip
entry was needed); the model-front convention follows the unit pipeline
(+Z toward the hall) — Meshy static exports may face the other way, hence
`EW_HQ_FLIP_LEAVES`; prop target sizes are educated guesses per catalogue
entry (`h`/`span` in metres) — expect a tuning pass; wall props ignore `r`
unless given (the EXIT sign uses `r` + `mount` to sit on the lintel).

**First-run checklist for the user:** (1) do leaves face the hall? (2) do
props look the right size (globe lamp ≈ head height, CRT ≈ 40 cm)? (3) walk
both stairs up and down, cross the mezzanine, try the railing; (4) E at
every door / the desk / the board / the kiosk / an agent; (5) V for first
person; (6) does the cube read? (7) FPS with the retro pass on vs
`EW_HQ_NO_POST`. Report with `?hqdebug` positions.

**Next (in order):** 1.3 Play → HQ + `_hqReturnOrMenu` at the 12 sites +
result overlay, `_hqLaunchMission` + `_hqPreselect` in match-select (bay
doors go live); 1.4 mastery flag write at match commit (`progress.unlocked`
`site:<mapId>:<cond>`); 1.5 room tone + `paChime`; 2.2 wedge desk once
the wedge dimensions are known; 2.6 bays as corridors; 2.7 the closet
interior (kit is uploaded); §3.9 the in-game layout editor; gamepad.

### 2026-09-03 — rev 2: pivot to the walkable 3D facility from Phase 1
User: the doors lead to maps anyway; wants to walk the building in third/
first person; is making 3D assets; challenged the perf claim. Verified:
`BASE_TILE = 128` (1 tile ≈ one character ≈ 1.75 m), a misc static-model
loader already exists (`_R2_MISC`, OBJ + GLB, cached/cloned), Strike Mode
has TPS + first-person rigs with pointer lock, CSS2DRenderer is loaded,
and ROADMAP §4's object count is the voxel board builder's, not an engine
ceiling. Rewrote §0–§7: procedural shell + authored prop kit + DOM
overlays; §5.3 is the asset list with export rules. Reference images still
awaiting commit to `docs/door-hq/ref/`.

### 2026-09-03 — rev 1.1: user decisions
Pre-rendered first (now superseded), walkable end state, rank titles
DOORMAT…THE DOORMAN, hybrid story gating (MASTER C-4 / B3).

### 2026-09-03 — rev 1: plan written, no game files touched
Research: the Play hub is `_goToPlayHub` (map.js:98); every menu function
has a `window.*` entry point; the Guild Hub is a working walkable hub
(free-roam + roster NPCs + entrance trigger); `matchHistory` stores `mapId`
+ `winCondition` per match so mastery needs no new tracking;
`EW_MAP_META.biomes` groups the 29 maps into six bays; `doorSiteCrossings`
gives each map its native enemy pool; the Δ boards are the brief's
4v4-on-8×8 format.

### 2026-09-04 (rev 2 of the boards) — danger cells over the whole footprint; the room goes solid
User feedback on the first build: the Holo Sim's red squares are the
DELAYED-ATTACK marker, not board terrain, and should cover the attack's
entire area of effect; the Training Room's inward-only walls and the moat
were "weird occlusion stuff" — the player only sees the tile tops, so
covering the board's sides is fine. Token `20260904f-cors` →
`20260904g-cors`; files data.js, three-renderer.js, index.html (map.js and
sprites.js from the first build stand). `npm test` 113 (112 pass).
- **Delayed attacks paint every tile.** three-renderer `_getZoneIconTex('cell')`
  is a new canvas plate (red rim, faint red wash, warning triangle) and
  `_renderDangerCells(tiles, small, pulseSpeed)` lays one on EVERY tile of
  a pending blast's footprint (`_buildZoneBorderEdges`' Chebyshev square,
  the same tiles the detonation hits), pushed onto `_zoneBorderMats` so
  they blink at the telegraph's 3.4 countdown speed; the AoE border stays.
  A laser mark (Headshot) is a one-tile footprint that follows its target.
  Works on every map; `state._delayedSpells` already rides state-sync, so
  the guest sees the same cells (RULE #2, no relay needed).
- **Holo Sim board:** the three `holo_red` cells (and mirrors) are gone;
  two risers remain. `holo_red` stays as an editor terrain.
- **Training Room:** walls are double-sided and run from the bed's floor
  (y 0) to 3.2 tiles above the room floor; the walkway meets the board edge
  (no moat, its top a hair under the tile tops so the rim never z-fights);
  barriers sit on the rim. Nothing is culled as the camera moves.

### 2026-09-04 (rev 4 of the Training Room) — see-through walls; the Holo Sim floor goes black
- **Training Room walls fade, not the units.** The enclosure was a solid
  box the occlusion raycaster never saw, so from any outside camera angle
  the wall in front swallowed the grid and every unit behind it dropped to
  its red/blue x-ray hologram. `_hzTrainingRoom` now sets
  `group._ew_occNear`, which `_hzRunNearBuilder` turns into
  `_facilityNearGroup`: an occluder container for `_occComputeBlockers`
  (each direct child is one occluder, `_occHitFadeable` always accepts a
  `_ew_occWall` root, `_occCollect` takes the wall's glow sprites too).
  Each wall — panel, dado, trims, light strips, doors, signs, clocks, red
  lamps, the observation booth — is ONE group (`tr_wall_n/s/w/e`), so it
  fades as a whole to `_ew_occFadeTarget` 0.04 (near-invisible; terrain
  keeps `OCC_FADE_TARGET` 0.10). Barriers, drums, consoles and crates stay
  individual occluders. On a facility board the grid itself is always a
  fade subject (centre + four inner corners, beside the active unit /
  focal tile), so the board reads from every angle, not only the tile the
  active unit stands on. Reverts the rev-2 "nothing is culled or hidden"
  stance — walls hide themselves now, never the board.
- **Holo Sim floor is black.** The `holo` plate's fill was a dark navy
  (8,16,34) that `_EMISSIVE_TERRAIN` + bloom lifted into a solid blue
  floor, drowning the move/attack/danger overlays; the embedded PNG's fill
  is (2,2,3) with (7,8,11) inner lines now — only the cyan rim glows.
  `holo_red` untouched.
- Files: three-renderer.js, sprites.js, index.html (`?v=20260904j-cors`);
  DOOR_MASTER.md Part D.

### 2026-09-05 — controls rework (user feedback): mouse-look TP camera, E walks through doors, door-blink room transitions, a real jump
- **Camera:** third person is pointer-lock mouse-look now, same as FP — click
  the canvas once to capture, the mouse aims (yaw free, pitch clamped
  −1.15…0.85 in TP), WHEEL still zooms, V still toggles FP. Click-drag orbit
  remains only as the unlocked fallback. `setPaused(true)` (any panel/modal)
  releases the lock so the cursor works; walking through a door KEEPS it
  (`_hqKeepLock` holds the lock through the leave/enter rebuild since the
  shared canvas is the same element). Auto-follow only runs while unlocked.
- **Doors:** `_hqInteractTarget` (map.js) fronts `_hqOpenPanel`: E on an
  unlocked single-outcome door (`action.room` with a built interior,
  `action.sector` with a built bay, or `action.fn`) fires `_hqDoAction`
  directly — no panel. Panels remain for thresholds (`action.mission`),
  locked states (sealed/clearance/off — the panel explains the gate),
  `alt`/`alt2` doors, unbuilt interiors, counters, NPCs, notices.
- **Transitions:** `_hqEnter({from:'walk'})` adds `walk` to `#hqLoad` — the
  card is hidden (styles-base.css `.hq-load.walk`), the overlay is a plain
  0.26 s black blink, min-wait 150 ms (was 900 ms), fade-back 320 ms. First
  entry from Play and post-match returns keep the full clearance-check card.
  Props still stream in async on a first bay visit (browser-cached after) —
  acceptable; full seamlessness would mean all rooms in one scene with real
  doorways (collision + occlusion + memory work), logged as a later phase.
- **Jump:** replaced the cosmetic hop with physics: `HQ_JUMP_V` 7.25,
  `HQ_GRAV` 18 → apex ≈ 1.46 m, ~0.8 s air. Space (grounded) sets
  `pl.air/vy`; airborne horizontal moves check `_hqAirOK` (hard walls, arcs,
  stair masses; the mezz railing band crossable only with feet above
  wallH+1.15) and ignore blockers; descent lands on
  `_hqSurface(x,z,null,true)` (0 fallback under the band edges).
  `_hqSurface` learned two surfaces on the rotunda desk: the counter top
  (`desk.h`) and the hollow-centre plinth (0.05 m) — STEP_TOL still forbids
  walking on/off, so the counter/middle are jump-only, as asked ("jump into
  the middle circular table area"). Landing inside a blocker footprint is
  escapable (`_hqInBlocker` → probes skip blockers until clear). `_hqGoTo`
  resets air state. Anim: `jumpT` ≥ 0 still drives the jump clip + landing
  squash.
- Hints line updated (SPACE jump · E enter/use · CLICK aim · MOUSE look).
- Files: three-renderer.js, map.js, styles-base.css, index.html
  (`?v=20260905a-cors`); DOOR_MASTER.md Part D.

### 2026-09-05 (rev 2) — feedback pass: click-free look, walk-through doors, one-shot jump clip
- **Mouse look with zero clicks.** Unlocked mousemove over the scene (the
  canvas or the CSS2D nameplate layer) steers the camera via movementX/Y —
  works the instant you move the mouse; the cursor goes quiet over UI
  elements. Pointer lock is grabbed opportunistically on every available
  gesture (the Play/door click that entered the room via `_hqBindInput`,
  WASD/SPACE keydowns throttled to one try per 1.5 s, canvas clicks, panel-
  closing clicks via `setPaused(false)`) and simply takes over when granted,
  removing the screen-edge limit. ESC still frees the cursor.
- **Walk-through doors.** `_hqTickAutoEnter` (per-frame, after the target
  scan): when the targeted door has `motion`, is unlocked, and has swung
  open (openT ≥ 0.55), pressing into the doorway while moving toward it
  (within the opening width, ≤0.9 m off the wall plane, heading dot > 0.35)
  fires `opts.onEnterDoor` once per approach (latch re-arms when you step
  out). map.js `_hqWalkThroughDoor` runs the same direct set as E
  (`_hqDoorDirectAction`, shared refactor); panel-only doors no-op — and
  static leaves (vault, portcullis, revolving, wired doubles, bulkheads)
  never swing, so exactly those still want E, per the user's rule.
- **Jump fires once.** Two causes fixed: the jump clip looped (LoopRepeat)
  because the physics airtime (0.81 s) outlived the short clip — the HQ
  player's jump action is now LoopOnce + clampWhenFinished with timeScale
  sized to `HQ_JUMP_AIR`, holding the last frame on long falls; and held
  SPACE re-fired the arc on landing — `pl._jumpLatch` makes it one jump per
  press.
- Files: three-renderer.js, map.js, index.html (`?v=20260905b-cors`).

### 2026-09-05 (rev 3) — camera snap, walk-off edges, solid furniture; the MD door replaces the Guild Hub
- **Camera no longer fights the mouse.** The walker's auto-follow (swing
  the camera behind the runner 1.4 s after the last mouse move) is gone —
  that swing was the "snap" the user saw while walking with hover-look.
  The mouse (hover-look / pointer lock) owns the yaw outright.
- **Edges are walked off.** `_hqSurface`'s step rule is one-sided: only
  CLIMBING is limited (`HQ_STEP_TOL` 0.62); a drop up to `HQ_DROP_MAX`
  (1.6 m) is allowed and the walker goes airborne with no upward speed
  (`_hqWalkerSetY`, `HQ_FALL_MIN` 0.5 — stair treads are still walked).
  So the dispatch counter (1.05 m) is jumped ONTO and walked OFF — into
  the well (0.05 m plinth) or back to the hall — no second jump. The
  4.2 m mezzanine is above the drop limit, so every slab / landing edge
  stays railed (plus an explicit landing inner-rail check); the jump over
  the railing is unchanged.
- **Furniture has a top.** Every blocker carries `top` (metres): the
  catalogue `h` at placement, the fitted GLB height once loaded
  (`onDone`), fixed values for the pit barriers (0.79), drum (1.52),
  crate (0.75), directory stand (1.55); NPCs are 2.6 m (never a floor).
  `_hqBlockersUnder` / `_hqBlkTop` / `_hqAirClearOfBlockers` /
  `_hqBlockerFloor` replace the old disc-only checks: a footprint's top
  is a floor when you stand on it or can step up onto it (boxes, crates,
  the couch you jumped on), anything taller than a step is a wall, a
  blocker's SIDE is solid in the air until the feet clear its top, and a
  jump lands on the top (not at floor level inside the prop). The old
  "landed inside a footprint → ignore all blockers until clear" hack —
  the walk-through-everything bug — is gone; the escape hatch only opens
  when the current spot is invalid (`skipB` = current surface is null).
- **Mystery Dungeon = the Condemned Crossing door.** The 8×8 Guild Hub
  free-roam board is out of the flow: the HQ is the hub. The delver page
  (map.js `_mdRenderCharSelect`) now carries the party menu that sat at
  the hub's cave gate — hero job select, roster companions with a job
  each (3 max, `_mdCharSel.party`), the fresh-save first-companion pick
  joins automatically — and ENTER goes straight to Floor 1 via
  battle.js `window._mdLaunchRun(cfg)` (`_mdStartRun(cfg, immediate)`).
  The run's end has one button, "Return to Headquarters"
  (`_mdReturnToHub` → `_mdExitToMenu` → `backToMainMenu` →
  `_hqReturnOrMenu`, landing at the door). `md_hub` (board, mode,
  `hubFreeRoam`, `_mdOpenPartySelect`, the `mdParty` dialog) stays
  registered and unused. Recruit / roster strings say "headquarters".
- Files: three-renderer.js, map.js, battle.js, index.html
  (`?v=20260905c-cors`); DOOR_MASTER.md Part D, PLAYTEST_NOTES.md.

### 2026-09-05 (rev 4) — the camera snap on A: a pointer-lock artifact, not the auto-follow
- Diagnosis: with the mouse still, a keypress cannot touch the yaw (only the
  mouse handlers write it — verified headlessly). What does fire on a
  keypress since rev 2 is the pointer-lock grab, and Chrome reports the
  cursor's jump to the lock origin as one huge movementX/Y on the first
  mousemove after the lock engages (and again as the cursor reappears on
  release). That single delta was the snap on A.
- Fix: `H.onPointerLock` stamps the transition; `_hqMouseDelta` drops the
  first two mousemoves after it and everything inside `HQ_LOCK_GRACE`
  (180 ms), and rejects any single delta over `HQ_MOVE_MAX` (220 px) as an
  artifact. Applies to the locked and the hover-look branches alike.
- `_hqTryLock` funnels every lock request (entry, WASD/SPACE keydown, canvas
  click, panel close, V) and swallows the rejected promise newer Chrome
  returns ("a user gesture is required" / "already locked") — one uncaught
  rejection per keypress otherwise.
- Camera boom eased (`c.f`): 32-step march, pulls in over 40 ms, eases back
  out over 450 ms — passing the desk / a pillar / the stair mass no longer
  pops the eye a metre in a frame.
- Files: three-renderer.js, index.html (`?v=20260905d-cors`).

### 2026-09-05 (rev 5) — the walking 180° snap, root-caused for real: battle.js was releasing the HQ's pointer lock
- Symptom (user): hold W, walk a few steps, the camera snaps ~180° and the
  walk reverses (WASD is camera-relative, so a yaw flip reverses travel).
  Rev 4's delta gates did not stop it.
- Root cause: battle.js's Strike Mode module (the TPS/FPS rig for shooter
  battles and the MD Guild Hub roam) listens to `pointerlockchange` on the
  renderer's SHARED canvas and set its `locked` flag for ANY lock on it.
  Its permanent rAF `_frame` then runs "release a stale pointer lock when
  the mode ends" (`locked && !_enabled()`), and `_enabled()` is false in
  the HQ — so every HQ lock (entry click, canvas click, the WASD/SPACE
  grab) was exited ONE FRAME after it engaged, and its capture-phase
  mousemove swallow ate the HQ's aim while it lasted. The HQ keydown grab
  re-requests every 1.5 s while unlocked, so walking produced a lock →
  release cycle every 1.5 s ("a few steps"). Each cycle warps the OS
  cursor (to the lock origin, then back to where it was); that jump
  arrives in the HQ's UNLOCKED hover-look branch as one huge movementX —
  up to half the screen width, ≈ 180° at 0.0032 rad/px. Verified by
  reading: `_canvas()` is `ThreeRenderer.getCanvas()`, the loop starts at
  load, and only the mouse handlers / room entry write `H.cam.yaw`.
- Fix (battle.js): `locked = el === _canvas() && _enabled()` — the module
  owns a lock only while it is live, so it never releases or swallows the
  HQ's. Its own stale-lock release still works (the flag was set while
  enabled).
- Bandaids removed (three-renderer.js): rev 4's `HQ_LOCK_GRACE`,
  `HQ_MOVE_MAX`, `_hqMouseDelta`, the `pointerlockchange` stamp handler
  and the drop-first-two-moves logic are gone; movementX/Y are used raw in
  both the locked and hover-look branches. Those gates also swallowed real
  fast flicks (>220 px per coalesced event). `_hqTryLock` (the promise-
  rejection swallow) and the eased camera boom stay — neither is a
  workaround for this bug.
- Rev 4's diagnosis in this log ("Chrome's first-mousemove jump") was
  wrong on the cause; the cursor jump was real but it was OUR lock churn
  producing it.
- Files: battle.js, three-renderer.js, index.html (`?v=20260905e-cors`);
  DOOR_MASTER.md Part D.

### 2026-09-06 — the cast moves in: fifteen rigged characters at their posts, the Player as the avatar
- **What the user delivered**: the story cast (DOOR_MASTER A16 /
  `DOOR_STORY.md` §2) and fifteen rigged Meshy models in R2
  `Assets/Sprites/Races/maincharacters/` — verified this session with
  HEAD requests and a JSON-chunk rig check (1 skin, 24 joints, `Hips`
  root, 1.70 m normalised bounds on every one; `Agent_Glass` and
  `Janitor` are named WITHOUT `_biped`, everything else with it; `kit` is
  lowercase). No Forrest / Sedaniel GLB exists there (404s on the obvious
  names) — they borrow the roster bigfoot and Honda Civic.
- **sprites.js `DOOR_CAST_MODELS`** (after `getRace3DModel`): `_mkCast
  (prefix, {heightRatio, female, file, lib})` = the roster's `_mk3d` on
  the `maincharacters` folder + every building pose + the female
  idle/walk where marked (the roster's gendered sweep only covers
  RACE_MODELS_3D). `_CAST_POSES` = ten library slots the building can
  ask for: hqSit `Sitting_Idle_Loop`, hqSitTalk `Sitting_Talking_Loop`,
  hqTalk `Idle_Talking_Loop`, hqPhone `Idle_TalkingPhone_Loop`, hqArms
  `Idle_FoldArms_Loop`, hqFix `Fixing_Kneeling`, hqPush `Push_Loop`,
  hqReach `PickUp_Table`, hqCrouch `Crouch_Idle_Loop`, hqNo
  `Idle_No_Loop` (UAL1 = lib 0, UAL2 = lib 1 — both inventories are now
  listed in doorhq.test.js). Heights: humans 0.94–1.04, Kit 0.88 (the
  roster catgirl), the Doorman and the Janitor both 1.0 on purpose.
  `getCastModel(id)`; `EW_DISABLE_CAST` (console) removes the whole cast
  and the Player avatar at once.
- **data.js `DOOR_CAST`** (before the DOOR_HQ window exports): per
  member name / title / dept / `model` or `race` / gender / `base` (the
  roster race the unit template is borrowed from) / `hidden` / `lines`
  (USER-authored, A15) / `spots`. A spot is a room + a polar (deg, r,
  level), box (x, z) or bay-local (deg, r) position + `face` + optional
  `pose`, `reach` (talk radius, 1.75 default — Rhonda's is 3.4 so the
  counter is not in the way), `rad` (blocker radius; Sedaniel 1.5), `p`
  (weight; the member's weights summing under 1 = sometimes nowhere),
  `minClearance` / `maxClearance` (wired, unused), `doing` (the stage
  direction the panel shows). `hqCastInRoom(roomId, profile, {salt,
  clearance})` draws ONE spot per member per session (seeded with
  `hqHash(id | salt)`, the salt is rolled once per page load) — so a
  character stays where you found them until reload, and is never in two
  rooms at once. `hqCastLine(id)`.
  - Rhonda `129°/18.95 m` on the reception chair, face 309 (the centre),
    hqSit, reach 3.4 · Kit `123.5°/16.4` crouched at the counter's public
    side (p .65) or `245°/19.5` at the Records door (p .35) · the Janitor
    `146.5°/18.55` mopping (hqPush, face 244, p .7; a `mop` prop now
    leans on the bucket at 143.8°/19.2) or IN THE OFFICE at `(−0.95,
    1.45)` facing the west shelves (hqReach, p .3) · Locke `20°/12.7` on
    the hall side of the briefing half-ring, face 20, hqTalk · Belle on
    the teal chair `246°/12.1` (face 246 = the chair's rot 180, p .6) or
    the couch `58.5°/15.55` (p .4), hqSit · Glass `199.5°/19.35` by the
    water cooler, hqArms · Knox on the Training Room's folding chair
    `(8.6, 2.4)` face 260, hqSit (p .6) or `152.5°/19.5` outside the
    office door (p .4) · Ringer `(8.2, −4.6)` face 250, hqArms · Elle
    `351.5°/22.4 L1` by the elevator, face 172, hqPhone (p .5) · Otto
    `307.5°/22.9 L1` at the Canon Office door or `82°/22.9 L1` beside
    Arcane Engineering, hqFix, a `cardboard_box` crate at 304.8°/22.95
    and 79.2°/22.95 (r chosen to pass the mezzanine-band test) · Forrest
    `200.5°/22.35 L1` face 200 (the wall) · Sedaniel bay_terrestrial
    `−38°/10.6` face 52 (along the corridor). All checked against the
    prop table for collisions (≥ 0.7 m from every foot) and against door
    trigger arcs (Otto is 7.5° off his doors so the door prompt does not
    fight his).
  - The Training Room's plate reads ROOM 64 · …; the egress door's desc
    names it.
- **three-renderer.js**: `_hqSpawnCharacter(spec)` takes `spec.def`
  (a cast member brings its own model def — the roster lookup is the
  fallback), `spec.sub / reach / pose / rad / cast / doing`; new
  `_hqSpawnCast(room, opts)` runs after the agents and before the roster
  vessels; `_hqTickChars` plays `ch.pose` for a non-player once
  `e.actions[pose]` exists (the bake is async — idle until then); the
  target picker uses `ch.reach` and carries `sub / cast / doing` into the
  target. **The avatar**: `opts.avatar.cast` → `getCastModel(cast)` as the
  player's def (map.js `_hqAvatar` returns `{cast: 'player', race: 'men
  in black', gender: 'male'}` unless `EW_HQ_AVATAR` is set; `'vessel'`
  keeps the old most-played rule).
- **map.js** `_hqNpcPanelHtml`: `kind === 'cast'` → name / title header,
  the member's own line (`hqCastLine`) in the big serif when there is
  one, the `doing` stage direction in the desc font, NOTED. The E-prompt
  says TALK with the member's title as the sub-line (the target's `sub`).
- **Seating**: a seated member stands at the CHAIR's spot facing the
  chair's heading (deg + 180 + rot for a polar chair) — the library
  sitting clip lowers the hips in-clip, so no y offset is needed; the
  chair's own blocker plus the NPC blocker keep you off their lap.
- **Tests** (`doorhq.test.js`, +4): registry parity (every `DOOR_CAST`
  model id is a `_mkCast` entry in sprites.js SOURCE — sprites.js does
  not evaluate headlessly on its own; every wired model is named by a
  member), every pose clip is in its library's listed inventory, every
  spot is a real room on walkable floor (ring / slab band / corridor /
  box), the draw's invariants over 40 salts (one room per member, hidden
  never, Elle sometimes away, the Janitor seen in both his rooms,
  Rhonda never leaves), the code hooks by source scan.
- **Not done**: no story gating (`minClearance` unused), no cutscenes, no
  walking NPCs (poses are static loops), no squeak on the office door
  (DOOR_MASTER C-18), Kit is not in the party (C-20), no portraits for
  the cast (no `portrait.png` in the folder — a 128×128 per member would
  give the panel a face). Playtest not run (RULE #1c).
- Files: sprites.js, data.js, three-renderer.js, map.js, doorhq.test.js,
  index.html (`?v=20260906a-cors`); docs: this file, DOOR_MASTER.md (rev
  16), DOOR_STORY.md (rev 1), CLAUDE.md, PLAYTEST_NOTES.md.

### 2026-09-06 (rev 2) — the cast PLAYTESTED: seats, the round desk, the mop, Room 64
User feedback on rev 1 (with permission to playtest): Rhonda belongs INSIDE
the round dispatch desk; nobody was sitting on chairs properly; Belle faced
the wall; the Janitor was "pushing nothing". Every placement was then
screenshot-driven — `playtest_hq.js` (repo tooling, see below) enters a
room with the LOCAL edits, forces each member to a chosen spot, walks a
first-person eye in front of / over the shoulder of every character and
saves the frames to `shots/hq/`.
- **Why nobody sat properly — and the fix**: the UAL sitting clip slides
  the pelvis ~0.5 m BEHIND the root (the character's feet stay put, the
  hips move back onto an imaginary chair). Retargeted as-is, a member
  placed at a chair's spot sat half a metre behind it (Rhonda vanished
  behind her chair back; Belle only looked right because the teal chair
  faced the other way). New bake flag **`pinXZ`** (three-renderer.js
  `_libBakeClips`, sprites.js `_mk3d` lib merge): keep the clip's
  VERTICAL hips travel, pin the ground-plane travel to the rest spot. The
  hips now drop straight onto the seat (measured with `dev.bone`: hips
  0.53–0.56 m up, ≤ 5 cm off the spot). Applied to hqSit / hqSitTalk /
  hqFix / hqPush / hqReach / hqCrouch. The chairs were never too small —
  the seat heights match (office/teal 0.96 m tall → ~0.48 seat; folding
  0.84 → ~0.42).
- **Rhonda inside the dispatch desk**: an `office_chair` on the well floor
  (`y: 0.05`, deg 180 r 2.05, facing the BELL console side), Rhonda seated
  on it facing south, reach 5.0 (the console still wins the prompt when
  you stand at it; she takes over as you slide round the counter), a
  `papers_b` stack on the counter above her. The "Take a number" agent in
  the well now faces north so they work opposite halves. The reception
  wedge keeps a SEATED **INTAKE CLERK** (a generic agent: room `agents[]`
  entries accept `pose` / `gender` / `label` / `reach` / `y` now; an agent
  with a pose borrows the MIB def with the cast poses merged, and the bake
  cache key includes the slot count so the HQ bake and the battle bake of
  the same MIB model never collide).
- **Belle** sits on the teal chair at 257°/13.9 (the one facing the hall,
  face 77) — she sees every door; the couch spot (p .4) faces the centre.
- **Kit** — the crouch clip retargeted as a hover; replaced by a
  `folding_chair` at 158°/6.7 by the dispatch counter, Kit seated on it
  facing Rhonda. The Records-door scratching spot is dropped for now (no
  clean "scratching" clip; `Interact` loops as a reach — try it later).
- **The Janitor leans on his mop**: new **held props** — `spots[].hold =
  { key, bone, upright, pos, rot, h }` parents a catalogue GLB to a hand
  bone once the rig is in (`_hqAttachHeld`); `upright: true` re-aims the
  holder to the world axes every frame (`_hqTickChars`), so the prop
  hangs plumb from the hand at real size and only rides the hand's
  position — pos/rot are then WORLD-space. Pose `hqLean` (`Idle_Rail_Loop`,
  forearms forward at ~1.1 m) + the mop GLB (which stands on its HEAD:
  base = bristles) at pos [0, −1.05, 0] → both hands on the handle, head
  on the floor. `hqStaff` (`Sword_Idle`) stays wired as the alternative.
  The standalone egress `mop` prop is gone (it is in his hand). His office
  spot keeps `hqReach` at the shelves — reads as rummaging.
- **Otto** kneels AT the door jambs now (312.5°/23.1 at the Canon Office
  door, 87.5°/23.1 at Arcane Engineering — 1 m off the door centre, 0.55 m
  off the wall), the crates beside him (309° / 84°, r 22.95).
- **Room 64**: the training room's procedural wall sign reads
  `ROOM 64` (was `ROOM 8×8`; both the Holo-Sim board's and the walkable
  room's `sign('tr_south', …)`).
- **Dev API** (three-renderer.js `ThreeRenderer.hq.dev`): `teleport({deg,r
  | x,z, level, y, face, pitch, dist, fp})`, `lookAt(x, z, pitch)`,
  `chars()` (id/kind/label/pos/deg/r/face/pose/anim/actions/attached),
  `bone(charId, name)` (world + root-relative position, scale),
  `props()`. data.js `hqCastInRoom(room, profile, {force: {id: spotIdx}})`
  pins members for the probe (−1 = absent).
- **`playtest_hq.js`** (repo root, `node playtest_hq.js <room> [force-json]
  [tag]`, server on :3000): serves sprites.js / data.js / three-renderer.js
  / map.js from the repo; every other CDN asset is fetched NODE-SIDE
  (`NODE_USE_ENV_PROXY=1`) into `.asset-cache/` and fulfilled, because in
  this sandbox Chromium cannot reach the CDN through the proxy (connection
  resets) while Node's fetch can — the browser runs with
  `--proxy-server=direct://`. Waits for every character's model + baked
  actions (a static model like the Honda Civic has 0 actions — the wait
  gives up after 4 min, harmless), prints `chars()` + hips/hand bones,
  shoots `<room>_<tag>_<char>_{front,34|ots,ots2}.png` (over-the-shoulder
  angles when the front eye would be inside a wall) and a third-person
  `spawn_tp`. NOTE `ThreeRenderer` is a script-scope const — test it with
  a bare identifier in `page.evaluate`, never `window.ThreeRenderer`.
- Verified in frames: Rhonda seated in the well (head + shoulders over the
  counter), the intake clerk seated at the wedge, Belle on the hall-facing
  chair and on the couch, Kit on her folding chair, Knox on the Room 64
  chair and outside the office door, Ringer arms folded at the lockers,
  Locke talking at the half-ring, Glass at the cooler, Elle on the phone
  by the elevator, Otto kneeling at both doors, Forrest nose to the wall,
  the Janitor leaning on the mop / rummaging the closet shelves, Sedaniel
  parked in Bay 1, the Player model in third person in every room, the
  ROOM 64 sign.
- Files: sprites.js, data.js, three-renderer.js (map.js unchanged since
  rev 1), doorhq.test.js, index.html (`?v=20260906b-cors`), playtest_hq.js
  (new, repo-only), this file, DOOR_MASTER.md Part D, PLAYTEST_NOTES.md.

### 2026-09-07 — the Room Register (docs only; no game files touched)
The user handed over ~75 room / map ideas ("eventually all the maps become
walkable rooms inside the HQ just like the Training Room"; every map gets a
room number that makes sense; trim the repeats; say what assets are
needed). Written up as **Phase 7 (§4)** + **§5.6 (assets)**:
- **The register** (7.3 / 7.4): a number for all 29 sites + the two
  facility boards + 15 HQ rooms / counters — the user's numbers kept
  wherever given (i, 4, 23, 51, 56, 64, 88, 90S, 101, 404, 420, 444, 666,
  777, 888, 999, 1225, 1945, 1969, 2012, 2047, 9600, H-20 …); Claude filled
  the blanks (180 → Hollow Earth, 2D Flat Lands, 11 Babel, 12 Olympus, 512
  Skinwalker, 14179 Shasta, 1 Reception, 42 Records) and proposes three
  swaps for the user's yes/no (MASTER C-22): stadium 42 → 50, Disaster City
  911 → 1954 (C-24), Gladiator 300 → 80.
- **Seven new sites, wave 1** (7.6): 13 Haunted House (the gothic gap), 33
  The Lodge, 21 The Strip, 1954 Downtown (the kaiju / superhero gap), 6
  Saturn (the Cube's home), E4 The Looking-Glass, 0 The Singularity — each
  with its board, setting, natives, leaf and hero prop. Thirteen more on
  hold (7.7); the rest cut or folded into what stays (7.8).
- **The walkable site** (7.2): the Training Room pattern generalised —
  `kind: 'site'` rooms generated by `hqSiteRoom(mapId)`, the Δ as
  `InstancedMesh`-per-texture room geometry (within the no-tile-renderer
  guardrail; it is ROADMAP §4 item 1's fix too), the near setting around
  it, the map's sky, natives as NPCs, the crossing launched from inside.
- **Seven bays** (7.5, MASTER C-23): BAY 7 · URBAN; Vatican → Diplomatic;
  Atlantis → Hollow.
- **Dailies** (7.9): Daily Office Operations Requirements = `FORM 365` in
  the Clock Room (247), seeded like Code Red.
- The adding-a-site checklist (7.10) records that server.js `MAP_POOL` is
  hand-synced and unchecked — a parity gap to close with the first new site.
- Files: this file (rev 16), DOOR_MASTER.md (A10 note, Part C rows 22–24,
  Part D). Nothing shipped; `npm test` green on the untouched game files.

### 2026-09-07 (rev 2) — 7.1 SHIPPED: the numbers are on the doors
Phase 7's entry step, exactly as 7.1 specified it — a data edit, a helper,
and the number printed wherever a site or a room is named. No new files,
no art, no engine work (7.2 is untouched).
- **data.js — the register itself.** `roomNo` (a STRING, so `i`, `2D`,
  `90S`, `H-20` ride the same field) + `why` (the one-clause hook from
  the 7.3 table) on all 29 `DOOR_HQ.thresholds`; Atlantis carries
  `sub: 'DEEP OCEAN ORICHALCUM RESEARCH'` (a threshold's `sub` now replaces
  the bay's THRESHOLD · SECTOR sub-line, via `hqBayRoom`). The numbered HQ
  places (7.4): `rooms.office.roomNo = '101'`, `rooms.training.roomNo =
  '64'` (the hand-written `ROOM 64 ·` left the training room's `sub` — it
  is on the field now), and on the egress doors with no interior yet:
  Reception **1**, Records **42**, Medical **1111**, the Bureau of
  Continuity **№ — CONTESTED** (7.0 rule 2: a joke and a policy). Bays wear
  bay numbers, not room numbers; the Quartermaster, Arcane Engineering and
  the elevator stay blank. New `DOOR_HQ.facility`: the two facility boards
  wear the room they are projected in — `prebuilt_training → { room:
  'training' }` (so the board and the room are ONE place, one 64) and
  `prebuilt_holosim → 404`. The elevator door carries `floors: ['B', 'G',
  'M', '2' … '12', '14', 'PH']` — there is no 13.
- **Helpers** (window.*): `hqRoomNo(idOrMapId)` — a launch map (Δ suffix
  stripped, so the Δ board wears the site's number), a facility board, a
  room id, or any door / counter id in the building; `hqDoorNo(entry)` —
  what a PLATE shows: the entry's own `roomNo`, else its mission's, else
  the room it opens into (the egress door to the Training Room says ROOM 64
  without carrying a second copy of the number); `hqRoomNoCompare` —
  plain numbers ascending, then the alphanumerics; `hqRoomRegister()` —
  every numbered place, sorted, with kind / room / bay / why (36 today).
- **Where it shows.** three-renderer.js: `<em>ROOM 56</em>` in small caps
  over the name on every door plate (`_hqPlateNo`), counter plate and box
  room plate (`.hq-plate em`); the Training Room's south sign reads the
  room's `roomNo`. map.js: the strip's room name (`ROOM 64 · TRAINING
  ROOM · …`), the [E] prompt, the threshold panel header (number + hook:
  `ROOM 56 · the 56 Aubrey holes`), the department door header, the bay
  door panel's rows, the elevator panel's FLOOR PANEL line ("There is no
  13. Room 13 is filed in Bay 1, not on a floor."), and the BUILDING
  DIRECTORY: the current room's rows carry their number, and below them
  THE ROOM REGISTER — every numbered place in the building in register
  order, with WALK (in this room) / GO (into the bay at that threshold,
  the training room at the RANGE console for 404, the egress at a
  department door). match-select.js: the SITE FILE kicker prints
  `ROOM 56` after the case number (`SITE_FILE_LABELS.room`). battle.js:
  the result stamp's case line is `CASE No. EW-nnnn · ROOM 56`; the loading
  screen's site-file card is filed as `SITE FILE · ROOM 56 · STONEHENGE`.
  Both are derived locally from `activeGameMode` on either client — no
  relay (RULE #2 satisfied by construction).
- **doorhq.test.js** (five new tests): every launch map has a string
  `roomNo` and a `why`; the Δ board resolves to the site; the facility
  boards are 64 / 404 and never sites; the register is UNIQUE (one number,
  one place), every row round-trips through `hqRoomNo`, every site appears
  once with its bay, the order is numeric-then-alphanumeric; bay doors and
  doors into numbered rooms carry no number of their own; Atlantis's
  sub-line; the elevator skips 13; a source scan for every surface above.
  `npm test`: 130 tests, all green. index.html bumped to `20260907d-cors`.
- **REC still open** (MASTER C-22): the stadium ships as **50** and Records
  as **42** — the user's yes/no can flip either with a one-field edit.
  Not playtested (RULE #1c); what to eyeball first: a bay threshold plate
  (ROOM line over the name), the directory's register, the result stamp.
  Next: 7.5 (Bay 7 · URBAN, a data edit + the mezzanine placement, awaiting
  C-23) or 7.2 (the walkable site, the engine piece — D.U.M.B. first).

### 2026-09-07 (rev 3) — 7.5 SHIPPED + THE CONTAINMENT RING stage 1: seven bays, and the bays join hands
The user's yes to C-22 and C-23, and the ask that started the session:
"the hallways with the different doors can be made longer and go all the
way around, or at least halfway." No new files; one data.js delivery with
its renderer and map.js companions; docs.
- **7.5 — Bay 7 · URBAN (data.js).** `DOOR_HQ.sectors.urban` (`cities ·
  the strip · the night shift`) takes Cyberpunk City from Celestial and the
  Stadium from Terrestrial; Vatican City → Diplomatic; Atlantis → Hollow
  (its sub-line gains `the deep`). The seventh egress door hangs on the
  mezzanine at 180° (`bay_urban`, `leaf_glass` — the shopfront, per 7.5),
  30° clear of Bays 5 and 3; the two cardboard boxes that stood there moved
  to 133° / 136°. The bay guard's line and three overheard lines for the
  urban bay, and the guards whose sites moved say so (Terrestrial no longer
  lists a stadium, Diplomatic counts five, the Atlantis drip line moved to
  Hollow, the Cyberpunk complaint line to Urban) — Claude-written bay
  flavour in the Phase 2.6 register, **the user may rewrite any of it**
  (A15). No map, threshold, room number or server row changed:
  `hqSectorOfMap` / `doorSiteState` / the Code Red pool / the register all
  derive from `sectors`, so the moves are one edit.
- **5.4a stage 1 — the ring (data.js + three-renderer.js + map.js).**
  `bayShell.ring: true` + `ringLeaf: 'leaf_wired_double'`. New
  `hqBayRing(sector)` → `{ level, count, cw, ccw }`: the bays on the same
  floor of the egress sorted by their door angle, wrapping; null with the
  ring off or a bay alone on its floor. `hqBayRoom` adds two doors per
  linked bay — `cap_cw` at +half and `cap_ccw` at −half, `cap: 'cw'|'ccw'`,
  the wide fire door, `action: { sector: <neighbour>, at: <the far side's
  opposite cap> }`, `ring: true` — and steps the cap-side dressing back 2°
  so the frame (a 3.3 m panel on the 4 m cap, protruding 0.5 m) is clear.
  The room carries `level` and `ring`. Renderer: `_hqCapWall(room, door)`
  returns the flat-wall shape `_hqBoxWall` returns (`wx, wz, nx, nz, yaw`
  — the slab's inward face at 0.15 m, the normal = the arc's tangent back
  into the corridor), and `_hqBuildDoors` uses it for `door.cap` on a bay,
  so the panel, the plate, `_hqFindTarget`, `_hqTickAutoEnter` and
  `_hqGoTo` (spawn 1.6 m in front, door at your back) all take the
  existing box-door path. The leaf is static, so E walks through (as with
  the vault / portcullis). map.js: a sector door's `at` is honoured in
  `_hqDoorDirectAction` and the bay panel's button (`THROUGH THE RING ▸
  <SECTOR>` on a cap door; the panel itself is the neighbour bay's — its
  sites, checklists and Code Red brief). Rings today: downstairs 1 ⇄ 4;
  upstairs 2 → 5 → 7 → 3 → 6 → 2 — with Quarantined locked, the doors INTO
  Bay 6 from 3 and 2 read SEALED (the lamp is the neighbour's), so the
  mezzanine ring is open from 2 round to 3 until the chapter opens 6.
- **doorhq.test.js** (four new tests; the Atlantis sub-line test follows
  it to Hollow): seven sectors, Bay 7 on the mezzanine at 180° with
  nothing in its panel, the rebalance; every linked bay wears two cap doors
  on its caps, wide, unnumbered, leading to `hqBayRing`'s neighbours on the
  same floor, reciprocated exactly by the far cap, wearing the neighbour's
  lamp, with no dressing inside the frame; one clockwise lap from any bay
  comes home having visited every bay on its floor once; the ring switches
  off cleanly; a source scan for `_hqCapWall` and the two map.js `at`
  sites. `npm test`: 137 tests, all green. index.html → `20260907i-cors`.
- Not playtested (RULE #1c). What to eyeball first: stand in Bay 2 and
  walk clockwise to the cap — the fire door, its plate (`BAY 5 ·
  DIPLOMATIC · CONTAINMENT RING · CLOCKWISE`), E, arrive in Bay 5 at its
  counter-clockwise cap with the door at your back, keep walking. Then Bay
  7's glass door on the mezzanine at 180° over the training door.
- Next: 7.2 (the walkable site — D.U.M.B. first), then 5.4a stage 2 (one
  continuous ring corridor) once the site rooms hang off it; 7.9 dailies;
  4.1 the case-file screen.

### 2026-09-07 (rev 4) — 7.2 stage 1 SHIPPED: Room 555 is a room you walk
The plan's next step ("7.2, D.U.M.B. first"). No new files; data.js +
three-renderer.js + map.js + doorhq.test.js + index.html; docs.
- **The decision**: a site room is a **box room** (`kind: 'box', fx:
  'site', site: <mapId>`), not a new `kind: 'site'`. The renderer branches
  on `kind === 'box'` in a dozen places (shell, flat-wall doors, counters,
  props, `_hqSurface`, `_hqAirOK`, the camera boom, `_hqGoTo`); forking
  them for an indoor site would have bought nothing. `kind: 'site'` stays
  reserved for the outdoor rooms that need the map's sky and far roster.
- **data.js.** `DOOR_HQ.siteRooms` (`built`, `shell` defaults, `shells[id]`
  texture overrides, `flavour[id]` = guard line + overheard lines + extra
  props — Claude-written placeholders, the user may rewrite, A15).
  `hqSiteRoomId(mapId)` → `site_<id>`; `hqSiteBoard(mapId)` (the finished
  Δ, a facility board under its own id); `hqSiteBoardInfo(mapId)` → `{ w,
  h, base, cells[y][x]: { key, lvl, walk, fluid, tint }, walls, mons, objs,
  nexus }` with `HQ_SITE_HAZARDS` / `HQ_SITE_FLUIDS`; `hqSiteRoom(mapId)`
  → the room: a 22 m box (8 × 1.75 + 4 m walkway each side, h 4.4), the
  way in on the south wall wearing the threshold's leaf (`action: { room:
  bay_<sector>, at: 'site_<id>' }`), the CROSSING console (`action: {
  overlay: 'crossing' }`, `site: id`, verb CROSS) at a tanker desk on the
  west wall with the CRT / phone / papers / clipboard, four fluorescents
  (`shell.lights`, one strip + point light per quarter), lockers, clock,
  breaker, extinguisher, boxes, chair, the wet-floor sign, one guard, three
  walkway spots hinted with the natives (`hqMissionPool(id, 3)`: mad
  scientist, telepath, black goo for D.U.M.B.), the spawn on the walkway
  facing the board. `hqRoomNo` resolves a site room to its site's number,
  `hqDoorNo` resolves a door INTO a site room and a counter with `site` the
  same way, the register's site row carries `siteRoom`. Rooms are
  generated at load from `siteRooms.built` (`['prebuilt_dumb']`).
- **three-renderer.js.** `_hqBuildSiteBoard(room)` (after the training
  pit; wired in `_hqEnter` on `fx === 'site'`): the cell tops as one
  InstancedMesh per terrain/tint (PlaneGeometry, one repeat per cell, the
  Δ tint multiplied, a 12% self-lit lift), raised cells as one instanced
  unit box per group scaled to the level height (`fillAbove: 'surface'`
  look) — each a rect blocker `{ top: lvl × 1.75, step: 1.81 }` — lakes as
  a BackSide box sunk one level with a translucent sheet at −0.3 m (lava
  orange + glow, oil black, bogs purple, water blue), edge walls as 0.14 m
  slabs with a cap (blockers with no top; `low` walls are steppable, `see`
  walls translucent), monuments via `_monBuilders()[kind](_monRng(seed))`
  fitted foot / maxH like the battle's classic branch and seated on the
  cell top (solid ones block), trees as trunk + crown, the nexus as two
  rings + a glow at the 2×2 centre, the lit seam grid, A–H / 1–8, the
  hazard plate before the way in, two signs (the site's name + ROOM № over
  the board, the site file's status by the door), eight red corner lamps
  and the fluorescent strips. The walker: `_hq.site = { N, C, half, cells
  }` + `_hqSiteCellAt(x, z)`; `_hqSurface`'s box branch returns the cell's
  top for pits and null for `walk: false`, the climb tolerance on a board
  cell is one level (+0.06) and the drop tolerance one level (+0.1), and
  the blocker loop honours a per-blocker `step` (`b.step ||
  HQ_STEP_TOL`); `_hqAirOK` refuses hazards and a pit's floor; the landing
  over a pit is the pit's floor; `_hqCamBlocked` keeps the boom out of
  raised cells and above a pit. Box shells draw a strip per `shell.lights`
  entry and `_hqEnter` hangs a point light per entry; the box plate reads
  the site's number when the room has none. `_hqSpawnPopulation` honours a
  spot's `race` hint (a rigged native spawns as `hq-native-<i>`; hinted
  races leave the roster draw).
- **map.js.** `_hqSiteRoomId` helper; `_hqDoorDirectAction`: a threshold
  with a room → `{ room, at: 'egress' }` (the prompt says ENTER, not OPEN);
  `_hqCrossingHtml` builds the threshold panel for the room's site from
  the console (`doorSiteState` on a synthetic mission door, the note / why
  / roomNo from the threshold); the launch buttons from that panel pass
  `doorId: 'crossing'` so `_hqReturnOrMenu` rebuilds the site room at the
  console; the Code Red overlay offers WALK TO THE CONSOLE inside the site;
  the directory's site row GOes into the room (YOU ARE HERE when in it);
  the bay threshold panel (still shown for sealed / clearance doors and by
  RESPOND) gains WALK IN ▸ ROOM №.
- **doorhq.test.js** (three new tests): the board info for D.U.M.B. (4
  steps, 2 blocks, 8 cell walls, the two grey tubes, the nexus at 3,3, no
  trees; Backrooms' almond water wades, Hell's lava never walks); every
  built site is a launch map with a threshold and generates the room —
  kind / fx / site / sector, no roomNo but `hqRoomNo` resolves, the grid
  at 1:1, ≥ 2 m walkway, textures, four lights, the way in on the south
  wall wearing the threshold leaf (wide agreeing with the catalogue) and
  landing at the bay's threshold door, the console at the desk with the
  site's number, native hints from the pool standing on the walkway, the
  spawn facing the board, the register row's `siteRoom`; a source scan of
  the renderer and map.js hooks. `npm test`: 140 green (141 with the
  server smoke test skipped — no node_modules here). index.html →
  `20260907j-cors`.
- Not playtested (RULE #1c). What to eyeball first: Bay 1, the bulkhead
  (ROOM 555), E — you should stand on the south walkway facing the board,
  the plate reading ROOM 555 · D.U.M.B. over the far wall, the tram-rail
  tint on rows 3–4, the two +2 bulkhead cubes and four server-bank steps
  (walk up a step, walk off it), the holding cell's four walls (solid),
  the specimen tubes at A3 / H6, the teal nexus ring at the centre, three
  natives on the walkways, the guard by the door. Then the console: E →
  the site file with CROSS ▸ Δ / DEEP; cross, win or lose, and you should
  come back standing at the console. Then Bay 1's door panel from the
  Code Red row (RESPOND) still launches directly.
- Next: the plan's order — 999 CERN and 90 Backrooms (indoor, one id each
  in `siteRooms.built` + a `shells` / `flavour` entry), then 1945 Nuketown
  and 50 Stadium (outdoor: the sky + far roster, the `kind: 'site'` work);
  the map's `near` setting inside the room; 5.4a stage 2 once the site
  rooms hang off the ring; 7.9 dailies; 4.1 the case-file screen.

### 2026-09-07 (rev 5) — 7.2 stage 2 SHIPPED: Rooms 999 and 90, each in its own light
The plan's next step ("999 CERN and 90 Backrooms, one id each in
`siteRooms.built`"). No new files; data.js + three-renderer.js +
doorhq.test.js + index.html; docs.
- **data.js.** `siteRooms.built` → `['prebuilt_dumb', 'prebuilt_cern',
  'prebuilt_backrooms']`. The generator was already general — the work was
  making the two rooms not look like D.U.M.B. with the number changed, so
  the shell grew a **`mood`**: `lamp` / `glow` (the containment lamps in
  the corners), `strip` (the wall strips), `light` (the fluorescents' point
  lights and the box shell's strip + glow), `signN` / `signS` (the two
  signs' palettes) and an optional `signLines` (`{ n: [3 lines], s: [3
  lines] }` replacing a sign's text outright). The default mood in
  `siteRooms.shell` IS D.U.M.B. (red lamps, white strips); `hqSiteRoom`
  merges the site's `shells[id].mood` over it into `shell.mood`.
  - **999 · CERN**: speckled stone over concrete, teal dado + trim,
    acoustic ceiling, h 4.6, conduits on; blue lamps (`0x6ac8ff`), blue
    strips and light, the north sign in the collider's palette, the south
    warning in red. Flavour: the control bank in the NE corner (two round
    cabinets wearing CRTs, an office chair), spares shelving on the east
    wall, two vent grilles, the pipe runs at 4.1, a box. Guard + five
    overheard lines (Claude placeholders, A15).
  - **90 · BACKROOMS**: office carpet, beige drywall for wall / dado /
    trim (the kit has no wallpaper — the Δ's own +2 wallpaper blocks bring
    the yellow), acoustic tile, **h 3.9** (the board's 3.5 m blocks clear
    it; the signs and lamps now hang from `S.h` instead of fixed heights),
    dado 0.7, **`pipes: false`**; yellow lamps and strips, warm light, both
    signs in the yellow palette with `signLines` (`LEVEL 0 · NO EXIT` /
    `THE EXIT SIGN IS A LIE`). Flavour: an office chair facing the NE
    corner, three EXIT signs over walls with no door in them (n / w / e —
    the way in is the `leaf_exit` on the south), a water cooler, a filing
    cabinet, an office plant, loose paper on the carpet, a desk fan on the
    floor, four more ceiling fluorescents on the walkway (the hum). Guard +
    five lines.
- **three-renderer.js.** `_hqBuildSiteBoard`: `var mood = S.mood || {}` →
  `lampC` / `glowC` / `stripC`, `signY = S.h − 0.9`, `lampY = S.h − 1.0`,
  the sign palettes merged over the old defaults, `signLines` honoured;
  **water wears the Δ's tint** on its sheet when it has one (the Backrooms'
  almond water was rendering blue; lava / oil / bogs unchanged). The box
  shell's fluorescent strip + glow and `_hqEnter`'s point lights take
  `S.mood.light` when a room has one (plain box rooms unchanged).
- **doorhq.test.js.** The built-site test now requires CERN + Backrooms,
  no duplicates, a mood on every room (four colours, two palettes,
  `signLines` shape), the ceiling clearing the tallest CELL (monuments are
  fitted by the builder, not by maxH — the first draft counted them and
  D.U.M.B.'s tubes failed it), every prop in the catalogue and on a wall /
  the ceiling / the floor inside the room; per-room checks (CERN's wide
  bulkhead, blue lamps, the control bank; the Backrooms' EXIT leaf, no
  pipes, the lower carpeted ceiling, the three lying EXIT signs, the two
  solid monoliths, the tinted water, the Quarantined bay); the source scan
  covers the mood reads, `signLines`, the lamp / strip colours, the
  ceiling-relative heights, the water tint and the point-light colour.
  `npm test`: 151 green (the server smoke test skipped — no node_modules).
  index.html → `20260907p-cors`.
- Not playtested (RULE #1c). What to eyeball first: Bay 1, the second
  bulkhead (ROOM 999), E — blue corner lamps, the beamline's copper cells,
  the two aluminium arcs, the terminal steps, the checkerboard dais, the
  control bank in the far right corner; then Bay 6, the EXIT door (ROOM
  90), E — yellow light, a low ceiling, the wallpaper partitions and
  blocks, the almond water (wade it), the two monoliths, the chair in the
  corner, EXIT signs over blank walls. Both consoles should file the
  crossing and return you to the desk.
- Next: 1945 Nuketown and 50 Stadium — the OUTDOOR rooms (the `kind:
  'site'` work: the map's sky from `env`, its far roster, no ceiling);
  then the moat maps once a fluid sheet edge is in; the map's `near`
  setting inside the room; 5.4a stage 2; 7.9 dailies; 4.1 the case-file
  screen.

### 2026-09-08 — 7.2 stage 3 SHIPPED: Rooms 1945 and 50, the first OUTDOOR rooms
The plan's next step ("1945 Nuketown and 50 Stadium — the OUTDOOR rooms:
the map's sky from `env`, its far roster, no ceiling"). No new files;
data.js + three-renderer.js + doorhq.test.js + index.html; docs. The
`kind: 'site'` room the plan sketched is NOT a new kind: an outdoor site
is still the `kind: 'box'` room (shell / doors / counters / props /
collision / camera all unchanged) with `shell.open` — the box builder
skips its ceiling and the site builder swaps its indoor kit for masts.
- **data.js.** `siteRooms.built` → `[…, 'prebuilt_nuketown',
  'prebuilt_stadium']`. `shells[id]` grew `open`, `apron`, `skirt`,
  `apronColor` / `floorColor` and `mood.night`; `hqSiteRoom` reads them
  into `shell.open` / `sky` (the map's `env` + `night`) / `apron` /
  `skirt`, nulls the ceiling and the pipes, moves the four `lights` to
  the walkway corners (±(half − 1.3)) and leaves the wall clock, the
  lockers and the ceiling fluorescents out of the props.
  - **1945 · NUKETOWN**: `wood_planks` for the fence (h 3.2 — the motel
    leaf and its lintel need 2.9), `grass_2` underfoot and for the apron
    over a `dirt` skirt, a concrete coping; dusk (`night: 0`) under the
    map's khaki sky and its `orbs` roster; sodium masts (`0xffd890`);
    the north sign green-and-cream (`NUKETOWN · ROOM 1945 · POP. 0 · TEST
    SITE`), the south one `CONDEMNED · THE FENCE IS THE WALL`. Flavour:
    the observation post on the east lawn (a tube TV, a folding chair,
    the mannequins' box), a plant, a mop bucket. Guard + five lines.
  - **50 · FOOTBALL STADIUM**: `concrete_floor` for the bowl's inner
    wall (h 4.2 — the wide turnstile leaf), turf (`grass_2` tinted
    `0x5ec46a` like the near kit's apron) over a concrete apron and
    skirt; night (`night: 1`) under the map's navy sky and its `city`
    roster; floodlight masts (`0xeaf4ff`); the north sign a scoreboard
    (`HOME 0 · AWAY 0 · Q1`), the south one `NO RE-ENTRY WITHOUT A
    STAMP`. Flavour: the home bench on the east wall (three folding
    chairs, the water cooler), the ground crew's bucket by the turnstile,
    a crate of game balls, a plant. Guard + five lines.
- **three-renderer.js.** `_hqTex(name)`: a name missing from
  `DOOR_HQ.textures` resolves to `TERRAIN_SPRITES[name][0]` (same
  loader, same cache key) so a room can wear grass, planks or concrete.
  `_hqBuildBoxShell`: `S.open` → no ceiling plane, terrain textures tile
  at 1.75 m, the floor takes `S.floorColor`, a 16 m apron plane
  (`S.apron`, `S.apronColor`) at −0.9 and a 3 m dark skirt box under it,
  no fluorescent strips. `_hqBuildSiteBoard`: `S.open` → masts at
  `S.lights` (pole to `S.h + 2`, head leaning in over the board, lens
  `_hzGlowMat(lampC)`, glow sprite, a 0.22 m blocker) instead of the
  containment lamps and the wall strips; signs and the plate unchanged
  (they hang from `S.h` — on the fence at 2.3 m). New `_hqBuildSky`
  (after the site board) and `_hqTickSky` (from `_hqTickWorld`), above.
  `_hqEnter`: an open room is lit by its sky (hemisphere in the sky's
  tint, a sun / night fill, the masts' point lights at `S.h + 1.8`, the
  map's fog colour as FogExp2 0.00005). `_hqCamBlocked`: no ceiling
  outdoors. `_hqLeave`: `_horizonFogDirty = true` when a sky was up.
  The battle's default roster literal moved into `_hzCosmicRoster()`
  (`_buildHorizonScenery` calls it — identical rows).
- **doorhq.test.js.** The box-room props test lets an open room be lit
  by masts; the built-site test requires the two new rooms, reads
  `TERRAIN_RULES` out of the sandbox to accept terrain keys, checks an
  open room's sky against `EW_MAP_META` (scenery, tint, fog), the apron /
  skirt textures, masts on the walkway, no ceiling / pipes / hung props,
  and every room's wall tall enough for the leaf + lintel; an indoor room
  must have no sky; per-room checks (Nuketown: dusk, orbs, the fence, the
  motel leaf, the TV, no lockers; the Stadium: night, city, the concrete
  wall ≥ 4 m, the wide turnstile, the bench + cooler); the source scan
  covers `_hqBuildSky` / `_hqTickSky` / `_hzCosmicRoster` / the terrain
  fall-through / the boom / the fog re-arm / no containment lamps
  outdoors. `npm test`: 151 green. index.html → `20260908a-cors`.
- Not playtested (RULE #1c). What to eyeball first: Bay 1, the motel
  door (ROOM 1945), E — you should be on a lawn inside a board fence
  under a khaki dusk with orbs and lone doors drifting past the fence
  line, four sodium masts, the TV in the far right corner; walk the
  street, climb a dumpster. Then Bay 7 (the mezzanine shopfront), the
  turnstile (ROOM 50), E — night, floodlights, the city's monoliths and
  haloes over the bowl wall, the bench on the right. Both consoles file
  the crossing and return you to the desk. If the sky is black: the
  console says `[HQ] sky:` with a body count when it built; a missing
  line means `_envUni` never initialised (the battle scene's
  `_initEnvironment` runs from the HQ now if it has not).
- Next: the moat maps once a fluid sheet edge is in (Camelot, Atlantis,
  Hell, Technoticlan, Agartha, Antarctica — they are outdoor rooms too,
  `open` + a lake that reaches the walls); the map's `near` setting
  inside the room; 5.4a stage 2; 7.9 dailies; 4.1 the case-file screen.

### 2026-09-08 (rev 2) — 7.2 stage 4 SHIPPED: the six MOAT rooms — the walkway is a quay
The plan's next step ("the moat maps once a fluid sheet edge is in —
Camelot, Atlantis, Hell, Technoticlan, Agartha, Antarctica — outdoor
rooms too, `open` + a lake that reaches the walls"). No new files;
data.js + three-renderer.js + doorhq.test.js + index.html; docs. The
"lake that reaches the walls" became a MOAT with a QUAY: the water fills
the ring from the board's edge out to a 2.4 m dry strip along the walls
(that strip is where every prop, native, mast, the guard and the console
already stood, so nothing in the shipped room recipe moved — the room
just grew 2 m and the ring between sank), bridged by a causeway on the
way-in side and its opposite, exactly the near kit's `_nrMoat` + the
spawn-row causeways brought indoors. That reading keeps the room walkable
without rails or a swim, and keeps "reaches the walls" for the water's
look along the north side, where nothing stands between the moat's
coping and the wall but the sign.
- **data.js.** `siteRooms.built` gains the six. Each `shells[id]` is an
  open room with `pad: 5.0` and `moat: { key, gap: 2.6, bank, bankColor,
  bed, (bedColor), deck, deckColor, causeways: ['s', 'n'] }` plus its own
  perimeter / floor / apron / skirt / mood / signs (comment block above
  the six has the field list). `hqSiteRoom`: `moat = defaults ← shell.moat`,
  then `walk` (TERRAIN_RULES passable AND not in `HQ_SITE_HAZARDS` — the
  same rule as a board lake: water wades, deep_water / lava never),
  `tint` (the Δ's `terrainTints[key]`; a water key falls back to the
  board's `water` / `deep_water` tint — Antarctica's deep water wears
  the board's water blue), `quay` (= pad − gap), and 's' is forced into
  `causeways` (the way in always has a bridge); `shell.moat` carries it.
  Six flavour entries (agent + five lines + quay props; the lines are
  Claude placeholders, A15).
- **three-renderer.js.** `_hqSiteCellAt`: outside the board, a moat room
  returns `_hq.site.moat.cell` (`{ top: -depth, walk, fluid, key, moat }`)
  anywhere inside the quay's inner edge that is not a causeway — new
  `_hqSiteOnCauseway(x, z)` (the deck is `deckW` wide, centred on its
  side, from the island's edge to the quay). Every site consumer
  (`_hqSurface`, `_hqAirOK`, the landing, `_hqCamBlocked`) therefore
  treats the moat as one more board lake with no new branch. `_hqSurface`:
  the one-level climb tolerance also applies when `curY < -0.5` (out of
  the moat onto the quay — the target is not a board cell). `_hqBuildBoxShell`:
  a site room's floor is a FRAME (`siteHole` = board half + the moat's
  gap; four bands) — the fix for a bug the stages before never saw
  without a playtest: the single floor plane at y 0 sat OVER every board
  pit (D.U.M.B.'s tubes were fine, but the Backrooms' almond water and
  every −1 lake were hidden under the floor). `_hqBuildSiteBoard`: the
  MOAT block before the pits — merged edge cells (`moatMerged`: a
  board-edge pit of the same liquid family), `_hq.site.moat`, the bank /
  bed / deck materials through `siteMat`, `_buildFluidTopMat(M.key)` with
  the Δ tint set on `color` (the material's `_evTintMat` may have read a
  stale `state.terrainTints`) and lava's emissive at 0.85 (fallback: the
  cells' translucent basic sheet, pulsed), `_hq.moatTick = { key, tile:
  CM }`; the ring as four bed + four sheet rectangles (`_hzTileUV` per
  cell so the wave layers repeat), the quay's face + coping in one or two
  runs per side (a causeway breaks the run), the island's face as an
  InstancedMesh of one segment per dry edge cell plus corner posts, the
  merged cells' sheet + banks on dry sides only, the deck (0.3 m thick,
  top at +0.012 m) with two kerbs per causeway, four pulsing glows on a
  lava moat. The pits loop skips merged cells. The A–H / 1–8 labels sit
  at the quay's edge and the hazard plate before the causeway. New
  `_hqTickMoat(dt)` (before `_hqTickWorld`, which calls it when
  `H.moatTick`): advances `_fluidTimeSec` / `_fluidTimeUniform`, sets
  `_fluidTileUniform` to one cell, drives the key's `_off1` / `_off2`
  drift — the battle resets all three the moment it renders.
- **doorhq.test.js.** The built-site test requires the six; `dryFrom(S)`
  (board half + gap) replaces the board half in the walkway checks for
  masts, natives, the spawn and (new) the guard; floor props in a moat
  room must stand on the quay, the island or a causeway (`onCauseway`);
  a moat block: the key is in `HQ_SITE_FLUIDS` and TERRAIN_RULES, `walk`
  equals the board-lake rule, gap / depth / deck minimums, the quay ≥ 2 m
  and equal to the room's (to 2 cm — the size is rounded to centimetres),
  the south causeway, the textures, the tint rule; an indoor room has no
  moat. Per-room checks (Camelot: dry board + plank drawbridge + the
  portcullis + torchlight; Atlantis: canals on the board, the #49c2d8
  tint; Hell: lava never waded, obsidian decks, red light, the
  extinguisher; Technoticlan: the cyan tint, the terminal in the corner;
  Agartha: the inner sea, day, three plants; Antarctica: deep water never
  entered, the water tint, an ice bridge, the cot). Source scan: the
  causeway helper, the moat cell, the climb-out tolerance, the fluid
  sheet, the merge skip, `_hqTickMoat` + its call, the floor frame. The
  test caught one placement on the first run (an Agartha paper sheet in
  the water — moved). `npm test`: 152 tests, 151 green + 1 skip.
  index.html → `20260908b-cors`.
- Not playtested (RULE #1c). What to eyeball first: Bay 2 (the mezzanine
  portcullis), Room i, E — you should be on a lawn quay inside a brick
  curtain wall at night under Camelot's dark sky, the plank drawbridge
  ahead crossing a water moat to the castle board (the board's wall
  slabs and plank lanes); walk the drawbridge, step off it into the moat
  (you wade at −1.75 m, climb out onto the island or the quay), lap the
  quay — the north side is coping, water, wall, sign. Then Bay 5, Room
  666: the lava moat glows and refuses you at the coping; Bay 3, Room
  H-20: the board's canals run out into the moat with no wall between.
  If the water is a flat blue sheet with no ripples, `_buildFluidTopMat`
  threw (the fallback) — the console has no line for it, so check
  `_hq.moatTick` in the console (null = fallback). If a board pit still
  looks covered anywhere, the floor frame is the suspect (`siteHole`).
- Next: the map's `near` setting inside the room (per-site dressing
  beyond the generic quay kit); the remaining sites one session each (the
  plan's order: the rest); 5.4a stage 2; 7.9 dailies; 4.1 the case-file
  screen.

### 2026-09-08 (rev 3) — 7.2 stage 5 SHIPPED: THE SETTING IN THE ROOM — the rooms look like their maps
The user's ask ("I imagined the walkable rooms of the maps inside the HQ
to look more like their battle maps") = the plan's standing next step
("the map's `near` setting inside the room"). No new files; data.js +
three-renderer.js + doorhq.test.js + index.html; docs. The reading: the
battle already dresses every Δ board with a MAP SETTINGS near builder
(three-renderer.js `_NR_BUILDERS`, keyed by the map's EW_MAP_META
`near`) — so the room runs THE SAME BUILDER inside itself at 1:1, and
grows to the builder's apron so the setting's own enclosure lands on
the room's walls. Nothing is redrawn by hand; a site room is now the
battle's setting with a roof (or the map's sky) and a door.
- **data.js.** `DOOR_HQ.siteRooms.near[key] = { w, h?, stands? }` — one
  row per builder the built sites use (11): `w` MUST equal the `w` the
  builder hands `_nrKit` (doorhq.test.js reads the renderer source and
  fails on drift), `h` (indoor: dumb 3.4, cern 3.6 tiles) becomes the
  room's height so the kit's pipes / lamps / trays fit under the
  ceiling, `stands` (stadium, technoticlan) says the setting's tiers
  fill the w/e strips. `hqSiteRoom`: `pad = w × tile + the moat's gap`
  (the shell's `pad` is the fallback when there is no setting or
  `shells[id].setting: false`), `shell.near = { key, w, gap (tiles),
  stands }`, `shell.h` from `near.h`. The CROSSING console can leave the
  west wall: `shells[id].console = { wall: 'n' | 'e', at }` — the desk
  layout (console, tanker desk, CRT, phone, papers, clipboard) is the
  west one turned (`W(along, depth)` / `WA(along)` / faces + ROT); CERN
  (n · 0 — the beamline runs down both flanks), Nuketown (n · +6 — the
  houses stand on the flanks; the road sign is on the other side), the
  Stadium (n · −7) and Technoticlan (n · +6) (the tiers fill the
  flanks). `stands` moves the natives' spots, the file boxes and the
  guard's chair to the n/s strips. Flavour props keep their DISTANCE
  TO THE WALL when the room grows (`fit`: a coordinate past the old dry
  edge shifts by the growth; `flavour[id].fitted: true` = placed for
  this room — the Stadium's bench is on the south strip by the
  turnstile now, the cooler on the south wall; Technoticlan's calendar
  terminal on the north strip's east end). Rooms: D.U.M.B. 24.55 m ·
  h 5.96, CERN 25.25 · 6.31, Backrooms 28.05 (h 4.3 — the partitions
  are 4.2), Nuketown / Stadium 29.81, the four w-4 moat rooms 33.25, Agartha /
  Antarctica 35.01.
- **three-renderer.js.** `_nrKit(group, ctx, o)` takes `ctx.hq = { w,
  gap, B, tints }`: the apron width and gap are the ROOM's (so X0..X1 is
  the walls), the base level is the Δ's (not `_hLevelAt`, which reads
  the last battle), the tints are the board's (not `state.terrainTints`),
  `_nrLastKit` is left alone (the crossing's facts stay the battle's),
  `K.hq` set. Under `K.hq` the enclosure primitives are no-ops:
  `_nrApron` (the floor frame + apron), `_nrMoat` (the room's own moat),
  `_nrRoom` (the shell), `_nrSign` (the mood's signs). New
  `_hqBuildSetting(room)` (before `_hqBuildSky`; called from `_hqEnter`
  right after `_hqBuildSiteBoard`): builds into its own group with a
  seeded rng, shifts it by (−N·ts/2, −B·elev, −N·ts/2) so the kit's
  board lands on the room's, splices the builder's `_hzGlowPulse`
  entries into `H.fxPulse` (the HQ loop breathes them), unfogs the
  additive / sprite materials like `_hzRunNearBuilder`, then walks the
  PIECES (direct children, or the children of an occlusion wall group)
  by world bounds: DROPPED when it doubles the perimeter (thinner than
  0.9 m, longer than 6 m, hugging the room's wall — the Stadium's bowl
  wall) or stands in the way in (the south lane ±2.2 m at the wall —
  D.U.M.B.'s south blast door) or at the console (a 5.6 × 2.4 m run on
  its wall); else a BLOCKER — a rect from the bounds with `top` (a
  house, a bus, a tier, a wall run, a fence panel), or a disc at the
  foot for a slender piece (taller than 1.2 × its width: a tree, a
  stalk fluorescent, a tower, a mast) — unless flat (< 0.35 m: the
  road, the chalk lines, the stripes), overhead (bottom above 1.5 m: the
  pipes, the trays, the banners, the aurora), over the board / the moat,
  or wider than 40 m. `_hqSettingFreeSpot(x, z)`: a floor spot inside a
  setting blocker slides along the wall it stands by (0.5 m steps, 9 m
  either way) to the nearest free one — applied to the natives and the
  roster NPCs in `_hqSpawnPopulation` and to floor props in
  `_hqPlaceProps` (never wall / ceiling / desk-top props). `_hqTickWorld`
  polls the foliage swaps (`_nrPollPending`, factored out of
  `_animateFloaters`) so the trees land. `_hq.setting = { group, key,
  kept, dropped, blockers }` (a console line reports the three counts).
  Kill-switches: `window.EW_HQ_NO_SETTING`, `EW_NO_FACILITY_SCENERY`.
- **doorhq.test.js.** The setting table vs the renderer source (`w` per
  builder), every built site with a `near` key carries `shell.near`, the
  walkway equals the setting's apron (to 2 cm), the gap is the moat's,
  the room height is the setting's where it has one; the console's wall
  from `shells[id].console`, never the south, the desk on that wall with
  the three desk props by it, the console on the walkway; the Stadium's
  bench and cooler on the south, natives + console on the n/s strips;
  source scan for `_hqBuildSetting`, its call, `ctx.hq`, `_nrLastKit`
  guarded, the four no-ops, `_hqSettingFreeSpot` + both nudges, the
  poll, the blocker tag, the kill-switch. `npm test`: 152 tests, 151
  green + 1 skip. index.html → `20260908c-cors`.
- Not playtested (RULE #1c). What to eyeball first: Bay 1, Room 555 —
  you should walk in past the extinguisher into a 24.5 m red room with
  the server racks along both flanks (LEDs blinking), the north blast
  door across the board, the pipes overhead under a 6 m ceiling; the
  console on the west wall between two racks (two were culled for it).
  Then Bay 2, Room i: the portcullis opens onto the LAWN OUTSIDE the
  curtain wall — the crenellated wall with its corner towers and gate
  towers is 3.85 m in from the board with the drawbridge through its
  south gate; walk round it to the console on the west wall past the
  trees and braziers (you cannot walk through the wall; the gates are
  the way). Room 50: the tiers rise on both flanks, the goalposts and
  the jumbotron at the ends; the bench and the natives are on the south
  strip. If a room is EMPTY of setting, the console line `[HQ] setting
  <key> — pieces: … dropped: … blockers: …` is missing (the builder threw
  — the error is logged just before) or the kill-switch is set. If you
  can walk through something, it was skipped as flat / overhead / wide
  (`_hq.blockers.filter(b => b.setting).length` in the console). If a
  native stands inside a house, `_hqSettingFreeSpot` found nothing free
  within 9 m along that wall.
- Next: the remaining sites one session each (the plan's order: the
  rest — each is now one id in `siteRooms.built` + a shell + a `near`
  row); 5.4a stage 2; 7.9 dailies; 4.1 the case-file screen.

### 2026-09-08 (rev 4) — 7.2 stage 6 SHIPPED: THE REST OF THE REGISTER — every launch map is a room
The plan's standing next step ("the remaining sites one session each")
done as ONE batch, because stages 3–5 had made a site room a data
entry: `siteRooms.built` + `shells[id]` + a `near` row + `flavour[id]`.
No renderer change; data.js + doorhq.test.js + index.html; docs.
- **data.js.** `siteRooms.built` gains the eighteen (29 sites in the
  register, 29 rooms). `siteRooms.near` gains seventeen rows — `w` per
  builder read off the renderer (shasta / stonehenge / giza / heaven /
  area51 / hollow_earth / fairy_forest / vatican / northpole 4.5, olympus
  4.0, cyberpunk 3.2, mars / skinwalker / moon / bohemian_grove / gobekli
  5.0, babel 4.5 `stands`); Flat Lands has no row. Eighteen `shells`,
  all `open` (no board in the batch holds lava, void or a lake worth
  opening — Shasta's lake and the Grove's creek stand outside the kit's
  apron in the battle), each in the map's own terrain keys (a cliff, a
  dry-stone wall, casing stone, marble with gold at its foot, tenement
  wall, brick, rock, metal, timber, cave wall, a wall of leaves, a
  regolith berm, bark, planks, earth), its own light (`mood`, day / night
  per the sky), its own two signs (`signLines`: the north sign wears the
  number). Consoles: Babel n·0 (the terraces fill w/e/n; the north tier
  is what the cull removes for it), Area 51 n·5 (the west hangar), Fairy
  Forest e·8 (the spring on the west), North Pole n·0 (the workshop on
  the west). The Moon's wall is 3.0 m (the lowest the leaf + lintel
  allow: 2.65 + 0.25). Flat Lands: `setting: false`, `pad: 7.0`, `h:
  3.0` — a 28 m room instead of the 63 m the fourteen-tile apron would
  make. Eighteen `flavour` entries (guard line, five overheard lines,
  two to six props each, `fitted: true`, on the walkway clear of the way
  in / the console's run / the guard). Rooms: Cyberpunk 25.2 m, Olympus
  28, the 4.5s 29.75, the 5.0s 31.5, Flat Lands 28.
- **doorhq.test.js.** The stale "the Moon is not walkable yet" gives
  way to: every threshold id is in `built` and the lists are the same
  length; every bay site's register row knows its room (the Holo Sim
  facility row does not count); each stage-6 room is outdoors without
  a moat, its north sign says `ROOM <no>`, its south sign ends at the
  console, its flavour is `fitted`; the four console walls; Babel's
  stands (natives + console on the n/s strips); Flat Lands' opt-out
  (no `near`, no `near.flatlands`, under 30 m); the Moon's 3.0 m berm,
  frame leaf, night; seven day/night spot checks. `npm test`: 152
  tests, 151 green + 1 skip. index.html → `20260908d-cors`.
- Not playtested (RULE #1c). What to eyeball first: Bay 2 (ANCIENT),
  Room 56 — through the empty frame onto the down at night, the sarsen
  ring standing mid-walkway round the board, the trilithons at two
  corners, the console on the west wall between stones. Bay 1, Room 51 —
  the chain fence and the floodlight towers inside a metal wall, the
  hangar half-cylinders on the flanks, the saucer on its rig in the
  north-east, the console under the RESTRICTED AREA sign on the north
  wall (a fence panel or two are culled for it). Bay 4, Room 1969 — a
  waist-high berm, the lander and the flag on the north-east, the
  monolith in the south-east corner, the Earth in the roster. Bay 5,
  Room 777 — the north Gate across the board, the colonnades on the
  flanks; the cloud mounds hug the wall and are rect blockers (the same
  as Antarctica's drifts). Bay 6, Room 2D — a near-empty 28 m room, one
  chair, one sheet of paper, the eyes overhead. If a native stands
  inside a piece of setting, `_hqSettingFreeSpot` found nothing free
  within 9 m along that wall (the Skinwalker barn on the east wall is
  the likely one). If Babel's north terraces are still there, the
  console zone did not reach them (they should be culled).
- Decisions the user may reverse: Flat Lands without its setting
  (alternative: a `near.flatlands` row `{ w: 14 }` and a 63 m room);
  the Moon's berm at 3.0 m (a taller wall hides less sky); Babel with
  `stands` and the north terraces culled (alternative: `setting:
  false`).
- Next: 5.4a stage 2 (the ring corridor); 7.9 dailies; 4.1 the
  case-file screen; the cast lines for the site rooms (A15, the user's);
  wave 1 of the new sites (7.6) — each is now a room the moment its
  threshold exists.

### 2026-09-08 (rev 5) — 5.4a stage 2 SHIPPED: THE CONTAINMENT RING is one corridor per floor
The plan's standing next step after 7.2. The user's original ask
("the hallways with the different doors can be made longer and go all
the way around, or at least halfway") is now a hallway, not a chain of
rooms: data.js + three-renderer.js + map.js + doorhq.test.js +
index.html; docs.
- **data.js.** `bayShell.corridor = { on, rings: { 0: { rIn: 21.5,
  rOut: 25.5, id: 'ring_g' }, 1: { rIn: 24.5, rOut: 28.5, id: 'ring_m'
  } }, endPadM: 2.2, gapM: 2.6, arc: { 0: null, 1: null }, close: true
  }`. `hqRingLayout(level)`: the bay doors of that floor of the egress
  sorted by angle; each a door run of n × `spacing` metres on the outer
  wall centred on its egress angle; runs closer than `gapM` pushed apart
  half each until none touch; the break = the widest gap between runs
  (the order starts after it, angles run past 360 where they must); the
  arc = first run's start − pad … last run's end + pad, or `arc[level]`
  by hand (≥ 360 − gap → `full`); segment bounds at the gap midpoints.
  `hqRingRoom(level)` → a `kind: 'bay'` room (`corridor: true`,
  `segments`, `shell.full`, `sub: '<FLOOR> · BAYS 1 · 4'`): per segment
  the `egress_<sector>` door (inner wall, the egress leaf, back to
  `central_egress` at that door), the `site_<id>` thresholds (outer
  wall; leaf / roomNo / why / note as the stage-1 bay's), extinguisher
  + breaker (+ a clock on a wide segment) flanking the way out, the
  bay's `bays[sector].props` through `hqRingSpot`, one guard with the
  bay's line; along the whole arc the fluorescents every 3.2 m; in each
  gap ≥ 4 m two cabinets, boxes and papers; at the caps the old cap
  dressing stepped 0.5 m further back when the cap wears a door; the
  two cap doors (`cap_cw` at arc[1] → `at: 'cap_ccw'`, and back) when
  the ring is not full and `close` is on. `hqBayId(sector)` → the
  floor's ring in corridor mode (else `bay_<sector>`), `hqBayEntry
  (sector)` → `egress_<sector>` (else `egress`), `hqBayNo(sector)` off
  the egress door's label, `hqBayLevel`, `hqRingId`, `hqRingSectorAt
  (room, deg)`, `hqRingSpot(sector, spot)` (deg' = c + deg · rOut₁/rOut₂,
  r' = rIn₂ + (r − rIn₁), face' = face + c; `src` / `bay` on the copy).
  The stage-1 rooms stay registered as `bay_<sector>` (kill-switch,
  tests, playtest_hq.js). `hqSiteRoom`'s sub-line and `hqRoomRegister`
  read `hqBayNo`; `hqCastInRoom` resolves a `bay_*` spot through
  `hqCastSpotRoom` and hands the renderer the carried copy. Computed
  today — ground: Terrestrial c 270 (52.6°), Celestial c 360 (17.5°),
  arc [238.77, 373.71]; mezzanine: Ancient 45, Diplomatic 146.02, Urban
  178.69, Hollow 215.28, Quarantined 270, arc [17.06, 282.26].
- **three-renderer.js.** `_hqBuildBayShell` skips the cap slabs on
  `S.full`; `_hqSurface` / `_hqAirOK` / `_hqCamBlocked` skip the cap
  check on `S.full`; the bay lighting spaces its point lights ~12 m
  apart (4–8) on a corridor over 40 m instead of one per 32° of arc.
  Nothing else — the arc band, the sector mesh, the strips, the pipe
  run, `_hqCapWall`, the door placement and `_hqGoTo` took the wider
  arc and the larger radii as they were.
- **map.js.** `_hqBayEntry(sector)` replaces the four hard-coded
  `'egress'` landings (the Code Red panel's ENTER / GO TO THE BAY, the
  bay door panel's button, `_hqDoorDirectAction`, `_hqDoAction`); the
  Code Red WALK TO THE THRESHOLD button also fires when the ring's
  segments include the sector; the directory's row prefix names the
  bay (`d.bay`) and END CAP; the overheard line is the segment's
  (`_hqRingSegHere` → `hqRingSectorAt` on `ThreeRenderer.hq.pos().deg`).
- **doorhq.test.js** (157 tests, 156 green + 1 skip): the stage-1 block
  re-pointed at `bay_*`; five new tests — two rings framed 0.3–1.5 m
  outside the drum, 4 m wide, one segment per bay door in door order
  ([1, 4], [2, 5, 7, 3, 6]), each segment holding its egress angle and
  its whole run; every launch map exactly once on the rings with the
  stage-1 door's leaf / number / hook, nothing overlapping, `gapM`
  between bays, `endPadM` past the outermost run, props and guards
  inside the corridor and in their bay, `hqRingSectorAt` naming every
  door's and guard's bay, the lines on the segments; the caps' doors
  reciprocal within the ring, unnumbered, dressing ≥ 0.75 m clear, a
  hand `[0, 360]` closing the mezzanine with the same thresholds; the
  site rooms' way back landing at their threshold on the ring, the
  register's bay numbers, Sedaniel carried to the same side of the way
  in, the flavour TV with him, the source scans; the kill-switch. index
  → `20260908e-cors`.
- Not playtested (RULE #1c). What to eyeball first: Bay 1's door on the
  egress, E — you stand at `egress_terrestrial` on the ground ring
  facing the outer wall, six thresholds curving away to the left and
  right, and the corridor continuing clockwise past two cabinets to
  Bay 4's way out and the Mars / Moon doors, a fire door at each end
  (E on one lands you at the other, same way round). Upstairs, Bay 2's
  portcullis: the mezzanine ring runs 123 m clockwise past 21
  thresholds and four more ways out; the Diplomatic and Hollow runs
  sit a few metres off-centre of their egress doors (the relaxation),
  the Urban pair between them. Sedaniel is parked a corridor-width left
  of Bay 1's way out. If a threshold plate reads the wrong bay, or a
  guard stands in another bay's run, `hqRingLayout` is the place.
- Decisions the user may reverse: the ring wraps only the bays' arcs
  (alternative: `corridor.arc[0] = [150, 510]` walks the ground ring
  behind Medical / Training / the Office / Reception too, with no doors
  on that stretch); the cap doors as a door-blink across the service
  side (`close: false` = dead-end caps); the radii (a wider ring makes
  room for wave-1 sites without any run moving).
- Next: 7.9 dailies; 4.1 the case-file screen; the cast lines for the
  site rooms (A15, the user's); wave 1 of the new sites (7.6) — each is
  now a segment's extra door the moment its threshold exists.

### 2026-09-08 (rev 7) — THE TERMINAL (the console's screen replaces the match-select page)
- Shipped: map.js `_hqOpenTerminal(spec)` / `window._hqTerminalClose(o)`
  / `_hqTermDrop` / `_hqConsoleTerminal` / `_hqRangeTerminal` /
  `_hqDeskTerminal`; `_hqLaunchMission` files on the screen (`o.variant`,
  `o.counterId`, `o.presets`; `o.terminal === false` = the page);
  `_msBack` / `_msConfirm` / the walker's `onEscape` check `_hqTerm`;
  `_hqClosePanel({ keepPaused })`. three-renderer.js `_hq.props`
  records, `_hqFocusScreen` / `_hqUnfocus` (`hq.focusScreen` /
  `hq.unfocus` / `hq.focused`), the focus blend in `_hqTickCamera`, the
  avatar hidden under the push, `_hqOnLockChange` + `_hqLockStaleAt`.
  match-select.js rewritten as the CRT (`.ms-crt` / `.ms-tty-*`,
  styles-base.css "THE TERMINAL" block), `_mountReactMatchSelect({ host,
  variant, frame, pre })` with one root per host. index.html
  `#hqTerminal` (between the panel and the load card), token
  `20260908j-cors`. doorhq.test.js "the terminal" source scan.
- Tuning knobs: the push — `hq.focusScreen` `dist` 0.62 m out from the
  CRT's base along its yaw, `screenY` 0.21 m up, `ms` 720, `reach` 3.4 m
  from the counter; the mount delay 430 ms (map.js `_hqOpenTerminal`);
  the power-on/off rasters (`msCrtOn` 0.62 s / `msCrtOff` 0.3 s); the
  glass inset (22 / 28 / 34 px) and the phosphor palette (`.ms-crt`
  custom properties).
- Not playtested (RULE #1c). What to eyeball first: walk into any bay
  threshold's room, E at the CROSSING console — the camera should slide
  onto the CRT on the tanker desk (the avatar vanishes as it passes), the
  raster opens, the site's name sits top-left of the screen with its stamp,
  BOARD Δ / FULL on the right; ESC pulls back to the desk with the cursor
  free; FILE stamps and leaves for the party builder; the result overlay's
  D.O.O.R. HQ button lands you at the console. Then the Training Room's
  RANGE console (the FULL desk, Training Room selected, two preset chips
  above the site cards) and DISPATCH → THE DESK'S SCREEN (the push targets
  the CRT at deg 200 on the dispatch desk — if it looks at the wrong
  monitor, `reach` / the CRT rows in DOOR_HQ.rooms.central_egress.props).
  If the screen is dark, check the console for a React error — the page
  fallback is only for a missing host.
- Decisions the user may reverse: bay-threshold launches (the ring) also
  use the SITE screen (alternative: `terminal: false` there → the page);
  Clash is not offered on a site (its stage is its own); DISPATCH keeps its
  panel (Quick Play / Friendly) with the desk's screen as a third button
  rather than lighting the screen on E.
- Next: an idle screensaver on the CRT in the room (the site's name
  scrolling) before the push; the RANGE console's own boot text; a
  `steward`-style boot line for each console (the room's number).


### 2026-09-09 — Adversarial review: scene handoff and settings input (local delivery, not uploaded)

- Implemented in existing files: `three-renderer.js` retires registered battle
  unit plates during deactivation before HQ reuses the CSS2D layer; unrelated
  labels and existing health/mana bar history are preserved. `map.js` owns the
  HQ loading card by entry generation and cancels fade/hide timers on entry,
  leave, or failure. Stale callbacks cannot dismiss the next entry's card;
  duplicate readiness is ignored. Renderer-entry exceptions now use the
  existing main-menu failure fallback. Normal/walking fade durations remain.
- Settings input: `state.js` gives visible settings controller navigation
  priority over the broad title/HQ flag; `ui.js` leaves Tab to menu/dialog
  focus navigation instead of changing battle targets underneath.
- Validation: full package test command (`node --test *.test.js`) executed
  with available Node v24.19.0: 208 tests, 206 passed, zero failures, two
  expected skips (absent animation GLBs and server dependencies). Includes
  eight new production-function regression tests in `scene-lifecycle.test.js`
  and repository-wide JS syntax checks. npm was unavailable; its exact test
  script was run directly. No browser playtest, game simulation, FPS capture,
  or host/guest runtime acceptance was performed. These local UI/lifecycle
  changes add no state-sync fields, gameplay rules, or relay payloads.
- Complete files for upload: `map.js`, `three-renderer.js`, `state.js`, `ui.js`
  to R2; `index.html` to Render, token `20260910-033727-review-cors`.
  Sync these plus the new test, this log, the other HQ/master log, and
  `ENTROPY_WARS_ADVERSARIAL_REVIEW_PLAN.md` to the repository. Nothing committed,
  pushed, or deployed. No canon, room definitions, assets, or story changed.
- Still open: texture readiness/black-material diagnosis, actual battle → HQ
  → battle visual checks for both viewers, modal focus trap/restore and full
  shared pause presentation. Continue UX-01 in the review plan, then reconnect
  and effect boundaries. Story track remains ON HOLD under A14.

### 2026-09-09 — Settings keyboard focus continuation (local delivery)

The shared Settings page in `map.js` now owns keyboard focus, retains the focused control on redraw, releases focus on page exits, and restores an eligible launcher/destination control through the existing HQ-or-menu Back route. Spell Library return reacquires Settings focus. Existing HQ suspension/resume and pointer-lock behavior are unchanged; no canon, rooms, cast or assets changed.

Baseline: repository main `e92ee26153b65c2047963544c56310ea838220bb`. Full suite: 215 passed, 0 failed, 2 expected skips, including five new Settings focus regression tests and the JavaScript syntax check. Browser/HQ/controller acceptance remains pending. The review plan records the newly confirmed PAUSE-06 controller page-visibility/root gap as the next batch. Complete `map.js` goes to R2, refreshed `index.html` to Render; these logs, tests and review plan are repository-only. Nothing deployed.

### 2026-09-10 — 7.11 SHIPPED: thirty models into the building, and Room 86's furniture arrives before Room 86

The user uploaded thirty Meshy GLBs to R2 `Assets/door/models/` (the
cafeteria kit, an office kit, and three mission pieces). All thirty are
wired in one data.js delivery — HQ plan §7.11 has the full table.

- **Catalogue (`DOOR_HQ.catalogue`, data.js).** Twenty-six new keys in a
  `THE 2026-09-10 BATCH` block; four EXISTING procedural entries were
  given a `file` and retired their builder — `hook_rail`, `vent_grille`,
  `floor_drain`, `rotary_phone`. That upgrades every placement already
  standing in 101 and 64 without moving a prop, which is exactly what
  plan 2.7's "replace any of them by giving the entry a `file`" was for.
  Six procedural props remain. `clipboard` is deliberately NOT one of
  the four: the user's clipboard model is authored FACE-UP (bbox
  0.73 × 0.35 × 1.00 is a clipboard lying on a desk), so it went in as
  `clipboard_flat` and the wall clipboards keep the builder.
- **Sizing was measured, not guessed.** Each GLB's JSON chunk was pulled
  off the CDN with a range request and its POSITION accessor min/max
  read; Meshy normalises the longest axis to 1, so the ratios name the
  pose (`analog_phone` at 1 : 0.49 : 0.73 is a desk phone; `microwave`
  at 1 : 0.61 : 0.72 is a microwave; `coffee_maker` at 0.51 : 1 : 1 is
  upright). Three were unreadable from the numbers and are flagged in
  7.11 for the next walkthrough: `manila_folder`, `round_fridge`,
  `mars_rover`.
- **Placed today.** THE BREAK NOOK in the egress at 98–107° (round
  fridge + microwave + coffee maker + mug + solo cup + coat rail + bin)
  — Room 86 standing in the hall until Room 86 exists. A cash register
  on the reception ledge for the LOST CARD FEE. Two palms in the lobby.
  THE CUBICLE POOL at 325° / 337° (round cubicles, ground floor only —
  the 1 m disc can never go on the 2.2 m slab). Retro speakers on the
  lockers. Five empty round frames. The clerks' coffee, radio, stapler,
  folders and bin on the mezzanine desks. 101 got a mini fridge, a meal
  tray on the cot, a radio on the shelf and a frame on the south wall.
  64 got THE FORTY-FOUR-MINUTE CORNER by the water cooler, which the
  instructor's existing line had already promised. The Mars room got the
  rover, the Moon room the lander, Giza two date palms.
- **One test refinement.** doorhq.test.js's "mounts through the ceiling"
  check now exempts a FREE-STANDING prop in an OUTDOOR room
  (`shell.open`) — the Moon's lander is 3.2 m and the Moon's perimeter
  wall is 3.0 m, which is right. A MOUNTED prop still has to fit under
  its wall everywhere.
- **Held for 86.** `meal_tray_empty` plus second helpings of the whole
  cafeteria kit. 7.11 has the room's build sheet — every piece of it
  comes from the existing catalogue, so building 86 needs nothing new
  from the user except the serving counter itself (§5.6's hero prop, now
  the only unticked item on that row) and the cafeteria clatter bed.
- **Validation.** `npm test` — 249 tests, 248 pass, 0 fail, 1 expected
  skip (server deps). No playtest (RULE #1c); no renderer, map.js or
  online.js change, so RULE #2 is unaffected — the HQ is single-player
  and no `state.*` field moved.
- **Delivery (RULE #1 / #1b).** `data.js` to R2, `index.html` to Render,
  token `20260910-071500-door-props-cors`. `doorhq.test.js`, this log
  and the plan are repository-only. Nothing committed or pushed.

### 2026-09-11 (rev 2) — 7.4 ROOM 86 SHIPPED: THE CAFETERIUM, and the building's first VARIANT (5.1) — after hours it is the MÖBIUS STRIP CLUB

The next unticked row of the register with its kit already on the shelf
(7.11 held the whole cafeteria batch for it). Built from the existing
catalogue plus two procedural pieces; nothing new from the user.

- **The door (data.js `central_egress.doors`).** `cafeteria` at 75° on
  the ground ring — the one free stretch, between the east stair's top
  (62° + the 7° margin) and the Quartermaster's vault at 90° (7.5 measured
  it for a bay and gave the bay to the mezzanine). 15° is 5.5 m of wall
  at r 21 for two panels needing 2.9, so doorhq.test.js's "≥ 25° apart"
  rule became what it was a proxy for: 25°, OR ≥ 2 m of pier between the
  panel edges at the wall radius. `leaf_saloon` (the doors swing both
  ways). The plate reads ROOM 86 through `hqDoorNo` (the room's number,
  one place). The potted plant at 76° moved to 84°.
- **The room (`rooms.cafeteria`, `kind: 'box'`, 12 × 9 × 3.7, terrazzo /
  drywall / oxblood dado, an acoustic ceiling with NO conduits).** The
  serving line on the north wall: four `tanker_desk`s, the curved till
  (a `reception_wedge`) with the `cash_register` on it, trays along the
  line, the `observation_window` as the kitchen hatch (the kitchen is not
  on the plan). The hot side on the east wall is THE BREAK NOOK moved in
  from the hall — round fridge with the `retro_speakers` on it, microwave,
  coffee maker, mug, cup, coat rail, bin — plus a `vending_machine` ("the
  one that was on the other side yesterday"; the hall keeps its own, which
  has always been there). Two `conference_table`s with twelve chairs
  (`cafeteria_chair` / `molded_chair`), trays and cups on them, someone's
  papers (working through lunch). The south wall: the NOTICE BOARD (new
  proc `notice_board` — the leaderboard counter's look as a wall prop:
  teal frame, cork, seven pinned sheets), two empty round frames, a
  clock; a second clock on the north wall that disagrees. `exit_sign`
  over the door, the rug inside it, a wet-floor sign, a palm in the SE
  corner, three fluorescents.
- **The counters.** `notice` → `_mountLeaderboard` (EMPLOYEE OF THE
  MONTH until the Clock Room's FORM 365 exists, 7.9); `till` →
  `_goToShop` (the Quartermaster's satellite counter). map.js's counter
  panel button now reads the counter's `verb` ("PAY AT THE TILL ▸ SHOP")
  instead of the hard-coded "READ THE BOARD".
- **The people.** Five `npcSpots` (the queue, the aisles) for the roster
  on break (the renderer draws three); one D.O.O.R. agent, THE CASHIER,
  at the till. **`onlineSpots` (new, plan §8's open question answered):
  one anonymous D.O.O.R. agent per online player besides you** — online.js
  `_updateCounterUI` now publishes `window._ewOnlineCount` (the lobby's
  live `#mmOnlineCount`, connected 1.5 s after load on every page) and
  three-renderer.js `_hqSpawnPopulation` seats `min(count − 1, spots)`
  agents labelled OPERATIVE · ON SHIFT / ONLINE · ANOTHER TERMINAL.
  `window.EW_HQ_ONLINE = n` forces a crowd for a screenshot. Overheard
  lines are Claude placeholders (A15 — the user may rewrite).
- **AFTER HOURS — the first ROOM VARIANT (plan 5.1).** `rooms.cafeteria
  .variants.after_hours`: `when: { hours: [22, 5], p: 0.2 }` (the local
  clock wins; otherwise one visit in five, seeded by the profile's
  `variantSeed` — set once per profile by map.js `_hqRecordVisit` — plus
  the day plus the visit count, so the roll is per VISIT and re-entering
  the room in the same visit is the same room), `label` MÖBIUS STRIP
  CLUB, `door` re-plates the hall door (label / sub / desc), `shell.mood
  .light` 0xff4f9a (the fluorescents and the room lights go pink — the
  renderer already read `S.mood.light` for site rooms), `drop` sends the
  serving line, the tables, the chairs, the trays and the paperwork
  home, `add` stands the **`mobius_bar`** (new proc: a 1.5 m ring band
  with a half twist at 1.05 m, `DoubleSide`, three chrome posts, a brass
  foot rail, a pink strip light and a point light; `foot` 1.4 + `block`
  so the walker stays on the one side there is), six chairs round it,
  cups on the band, two globe lamps, floor speakers, the coat check (two
  folding chairs); `counters` = the board + THE BAR (→ the shop);
  `agents` = THE BARTENDER; its own lines and npcSpots. The mechanism:
  `hqRoomBase(id)` (the sheet, kept in `DOOR_HQ.roomsBase`),
  `hqVariantRoll(id, profile, { force, now })`, `hqApplyRoomVariant(id,
  vid)` — swaps `DOOR_HQ.rooms[id]` for a merged copy (same `roomNo`,
  `kind`, `doors`; `shell` merged over) and patches every door whose
  action leads into the room, keeping the sheet's plate in `d._base` and
  restoring it on the next apply — and `hqRollRoomVariants(profile,
  opts)` for every room with variants. map.js `_hqEnter` rolls on a
  FRESH arrival only (not a return from a screen / match, not a walk
  between rooms); `?hqvariant=after_hours` / `window.EW_HQ_VARIANT`
  force one (`none` = the sheet). Because every reader goes through
  `DOOR_HQ.rooms[id]`, the renderer, the panels, the register and the
  directory all see the variant with no special case — "the directory
  insists it was always so" (5.2) came free. No chapter gate yet (the
  story track is on hold, A14). Nobody comments.
- **Tests.** doorhq.test.js: the relaxed door rule; "Room 86" (the door,
  the way back, the number, the pier to the vault, the nook gone from the
  hall, every row of 7.11's build sheet, the props / spots inside the
  walls and under the ceiling, the counters and what they reach, the two
  procs, the register row); "room variants" (ids, the forced / clocked /
  seeded roll, the applied room and its re-plated door, the register's
  night label, idempotence, the restore, the building-wide roll); a
  source scan of the two builders, the online seats, the `_hqEnter` roll
  order, the seed and the published count. `npm test`: 577 pass, 0 fail,
  2 expected skips.
- **Not done / to look at on the next walkthrough.** No playtest (RULE
  #1c). The `reception_wedge` at the end of the line and the two
  `conference_table`s are placed by catalogue size, not by eye — if the
  wedge's curve faces the wrong way, its `face` is the only edit; if the
  tables' long axis runs north–south, swap the chairs' x / z. The
  Möbius band's material is the oxblood plaster tinted — a laminate
  texture would read better. §5.6's serving counter (the hero prop) and
  the cafeteria clatter bed are still the user's; the line is four steel
  desks until then. RULE #2: single-player only (no `state.*`, nothing
  relayed).
- **Delivery (RULE #1 / #1b).** `data.js` + `three-renderer.js` +
  `map.js` + `online.js` to R2, `index.html` to Render, token
  `20260911-room86-cafeterium-01-cors`. `doorhq.test.js`, this log,
  DOOR_MASTER Part D and CLAUDE.md are repository-only. Nothing
  committed or pushed.

### 2026-09-11 — THE EDGE: the outdoor sites lose their facility walls; the real rover, lander and palms stand on the boards

The user's brief: the doorways are doorways to the ACTUAL places, so a
site room should not be four facility walls unless the place is indoors
(or walled by itself — a fence, a tree line, a building is fine); and the
three mission GLBs (`mars_rover`, `lunar_lander`, `palm_tree`) should be
used on Mars, the Moon and Atlantis.

- **`shells[id].edge` (data.js `DOOR_HQ.siteRooms`, read by hqSiteRoom →
  `shell.edge`, `shell.roam`).** Three values. `'open'` — the default for
  every `open` room — draws NOTHING at the bound but a flush paving line
  (`HQ_EDGE_KERB_H` 0.05 m in the trim texture); the ground runs out under
  the map's sky, the way in is the threshold's own 3.3 m door panel
  standing alone (the crossing's lone door — `_hqBuildDoors` unchanged),
  both signs become freestanding SIGNBOARDS (two posts, a rail, a dark
  back, the board at 2.55 m), the console's tanker desk stands free, and
  the walker may ROAM `shell.roam` = 5 m past the old wall line onto the
  apron (`_hqRoamM` in `_hqSurface` / `_hqAirOK` / `_hqCamBlocked`).
  `'low'` — a knee-high field wall (`HQ_EDGE_LOW_H` 0.95 m, the shell's
  wall texture, capped, broken at the door panel, a rect blocker per run):
  Stonehenge, Göbekli Tepe, Flat Lands (the plane's "low earth wall").
  `'walls'` — the full box, forced on every indoor room and set by hand on
  the outdoor places whose enclosure is a building or a cavern: the
  Stadium's bowl, Camelot's curtain wall, Cyberpunk's tenements, Babel's
  court, Agartha and Hollow Earth (caverns). Everything else outdoors is
  open: Nuketown (the picket fence is the wall now), Atlantis, Hell,
  Technoticlan, Antarctica, Shasta, Giza, Heaven, Olympus, Mars, Area 51
  (the wire and the towers), Skinwalker (the rail fence), Fairy Forest,
  the Moon, the Vatican (the colonnade arms), Bohemian Grove, North Pole.
- **The props that needed a wall went with it.** `hqSitePropStands(p)`:
  a `wall` prop survives only if its catalogue entry STANDS (a `foot`, no
  `mount`) — lockers, shelving, the cooler, the tanker desk keep their
  place at the old wall line; clipboards, extinguishers, breakers, clocks,
  shelves, rails, vents, frames, the Backrooms' exit signs are dropped in
  a wall-less room (Hell's compliance extinguisher included — the test
  notes it is still on the flavour sheet).
- **The setting keeps its own perimeter.** `_hqBuildSetting`'s
  "perimeter doubled" cull (`hugX` / `hugZ`) now runs only on a walled
  room — on an open / low room the fence, the wire, the tree line ARE
  the natural walls. A D.O.O.R.-kit GLB still loading gets its collision
  disc from `_ew_footM` at cull time (an empty box used to be skipped —
  the walker would have walked through the rover until it landed).
- **The real models on the boards (battle AND room, since the room runs
  the same builder).** three-renderer.js `_hzDoorKitGLB(key, o)` loads a
  `DOOR_HQ.catalogue` prop as a lit board prop (fit to metres, seated on
  y = 0, `fallback` = the procedural builder when the catalogue / loader
  is missing). `_NR_BUILDERS.mars` swaps `_hzRover` for the rover (2.6 m);
  `_NR_BUILDERS.moon` swaps the foil-and-legs box for the lander (3.2 m,
  the flag still beside it); `_NR_BUILDERS.atlantis` grows four palms
  on the quay corners (3.2 / 3.7 m). The room props `mars_rover` (Mars's
  walkway) and `lunar_lander` (the Moon's corner) placed 2026-09-10 are
  REMOVED — one rover, one lander, the site's own. Giza's and the lobby's
  palms stay. The Moon's procedural LRV stays (the rover is Mars's).
- **Copy.** The Moon guard: "The door stands without a wall. Records
  built one once; the footage disagreed." (the old line said Records
  built one). Shell comments for Mars / the Moon / Agartha updated.
- **Tests.** doorhq.test.js "the edge": every built room's `edge` is
  walls | open | low, indoor ⇒ walls, the six walled outdoor rooms and
  the three low rooms named, `roam` 5 iff open, no mounted prop survives
  a wall-less room (the console desk, the CRT and the sill sign do), the
  lone door still on the south line, `hqSitePropStands` truth table, the
  Moon's line, no doubled rover / lander, the three kit keys, and source
  scans of the shell / roam / cull / signboards / the three builders.
  `npm test`: 465 tests, 463 pass, 0 fail, 2 expected skips.
- **Not done / to look at on the next walkthrough.** No playtest (RULE
  #1c). The rover's and the lander's authored FACING is unread (the
  `ry` values are the procedural ones); if either lands sideways, the
  `ry` in its `_nrProp` call is the only edit. The room plate (CSS2D)
  still floats at the north edge at wall height — harmless, but a lower
  `plate.y` on open rooms would read better.
- **Delivery (RULE #1 / #1b).** `data.js` + `three-renderer.js` to R2,
  `index.html` to Render, token `20260911-open-sites-01-cors`.
  `doorhq.test.js`, this log, DOOR_MASTER Part D and CLAUDE.md are
  repository-only. Nothing committed or pushed.

### 2026-09-11 (rev 3) — 7.9 + 7.4 ROOM 247 SHIPPED: THE CLOCK ROOM and FORM 365 — logged from the shipped code

The 2026-09-11 00:39 upload (data.js, battle.js, map.js, three-renderer.js,
styles-base.css, index.html, doorhq.test.js, playtest_hq.js; token
`20260911-room247-form365-01-cors`) shipped Room 247 and the dailies
without a §9 entry, a Part D entry or a CLAUDE.md section. This entry is
reconstructed from the code in the repo (every claim below is a line in
the files, and doorhq.test.js's four "Room 247" / "FORM 365" / "punch
clock" / source-scan tests pass on it); nothing was re-shipped.

- **The door (data.js `central_egress.doors`).** `clockroom` at 225° on
  the ground ring, between MEDICAL (210°) and RECORDS (240°) — a pier to
  each under the 2 m rule; `leaf_frosted` (wide; "the frosted glass says
  CLOCK ROOM backwards from this side, which is the right way round for the
  clocks"). The plate reads ROOM 247 through `hqDoorNo`.
- **The room (`rooms.clockroom`, `kind: 'box'`, 9 × 7 × 3.4, terrazzo /
  drywall / oxblood, an acoustic ceiling, no conduits).** The north wall:
  the timekeeper's tanker desk under the WORLD CLOCKS (new proc
  `world_clocks`: five faces on one teal rail — SHASTA · GIZA · LOCAL ·
  CERN · THE MOON — every one set to a different time), the CRT, the
  rotary phone, papers, the stapler, two filing cabinets, boxes, a vent.
  The east wall: FORM 365 (new proc `form_sheet`: a clipboard board, the
  header, three ruled lines with a box each, a DUE TODAY stamp), the PUNCH
  CLOCK (new proc `punch_clock`: the machine with a card in its slot, the
  dial at 8:47, the red button, the rack with seven cards — the eighth is
  in the machine), a clock, the chair where you wait to punch in, a bin.
  The south wall: today's Code Red on a `notice_board`, two more clocks,
  the breaker, the extinguisher, the water cooler and a chair. The west
  wall: the way out under the exit sign, a fifth wall clock nobody has
  set, a frame, the rug, a plant. Every `wall_clock` hangs at its own
  `mount` (the test insists). Two fluorescents.
- **The counters.** `form365` → `overlay: 'form365'` (map.js
  `_hqForm365Html`: the sheet — DUE TODAY / IN PROGRESS / COMPLETE, the
  date and the day's CANON date (`hqCanonToday`), the officer and
  employee number, the pay, the three rows FILED / OPEN, the punch-clock
  chips, a GO TO BAY button for a line that names one, ANSWER A BELL CALL,
  THE PUNCH CLOCK); `punch` → `overlay: 'punch'` (`_hqPunchHtml`:
  punched in today, days in a row, best streak, days on the clock, last
  punch); `codered` → the hall's Code Red panel, posted on the board.
- **FORM 365 — Daily Office Operations Requirements (7.9).** data.js
  `DOOR_HQ.dailyOps = { pay: 120, allBonus: 150, count: 3, force: null }`;
  `hqDailyOpsRows(profile, opts)` draws three lines from eight templates
  (`HQ_DAILY_TEMPLATES`: **site** — win a crossing at a named room in a
  named bay; **cond** — win by a named mastery condition; **keys** —
  secure 2–3 Keys in one crossing, win or lose; **exits** — 3–5 confirmed
  exits, win or lose; **native** — win with a native of a named bay on the
  roster; **strike** — fire an Entropy Strike; **delta** — win a Δ
  crossing; **codered** — respond to today's Code Red, present only when
  one is), the order and every parameter seeded by `hqHash(date | employee
  no | 'form365')` — the same sheet all day for one officer, a new one
  tomorrow, a different one for the next desk; `hqDailyOps` overlays the
  profile's `door.hq.dailies` (date-matched, else blank) and returns
  `done / total / allDone / allPaid / paid`; `hqDailyRowMet(row, ev)` is
  the rule per template (lines that say WIN need a win); `hqDailyOpsJudge
  (profile, ev)` marks the lines a finished match meets, pays each once
  and the sheet bonus once, counts `dailiesFiled` / `sheetsCompleted`,
  and returns null for a dungeon run or a campaign. battle.js
  `commitAchProgress` builds `ev` from the same per-unit fold the
  achievements use (won, mapId via `hqSiteId`, Δ, the win condition, the
  roster's races, kills, hourglasses, entropy strikes, `codeRedCleared`),
  runs the judge AFTER the Code Red commit (so a cleared Code Red counts
  the same match), credits the Hazard Pay locally (`creditLocalGold`,
  like the Code Red bonus), logs a 📋 line and hands the result stamp
  `window._lastHqForm365` (`_stampHqSite`: "FORM 365 · <lines> · 2/3 ·
  💰 +240" in its own blue, `.drs-site.form365`; a cleared Code Red
  outranks it and carries it). map.js: the strip pill `#hqForm365` ("FORM
  365 **2** / 3", green when complete, the rows in its tooltip, click →
  `window._hqOpenForm365`); Room 86's notice board mirrors the count with
  a button to the sheet. Dev: `?form365=site,keys,strike` /
  `DOOR_HQ.dailyOps.force`. Standard matches only; viewer-local; nothing
  on `state` (RULE #2).
- **The punch clock = the login streak.** `hqPunchIn(profile)` from
  map.js `_hqRecordVisit(null)` — the fresh arrival from Play — once a
  day (`door.hq.punch = { last, streak, best, days }`: a consecutive day
  continues the streak, any other day starts it over, the best is kept);
  `hqPunchClock(profile)` reads the card (`lapsed` when the last punch
  is older than yesterday). "There is no button for it, and the red one
  does nothing."
- **The people.** THE TIMEKEEPER seated at the desk ("Which clock?" "The
  right one." "They are all the right one. That is the job."), three
  `npcSpots`, two `onlineSpots`, five overheard lines (Claude
  placeholders, A15).
- **Repo tooling in the same upload.** playtest_hq.js serves every repo
  script and every cached CDN asset over a LOCAL HTTP MIRROR (:3999) and
  only redirects the page's requests there — fulfilling multi-megabyte
  GLBs through `route.fulfill()` pushed them down Chromium's DevTools
  pipe and the browser exited ~10 s after launch on every warm-cache run.
- **Tests.** doorhq.test.js: "Room 247" (the door, the piers, the way
  back, the build sheet, the counters and where their props hang, the
  timekeeper on the chair, the three procs, the register row), "FORM 365"
  (the seed, the day, the desk, every template's rule, the judge's
  marking / paying / bonus / MD-and-campaign refusal / tomorrow), "the
  punch clock", and a source scan of the builders, the panels, the strip,
  the CSS, the judge's place in the commit and the stamp.
- **Delivery.** Already on R2 / Render (`20260911-room247-form365-01-cors`).
  This session: docs only for 247 (this entry, DOOR_MASTER Part D,
  CLAUDE.md). Nothing committed or pushed.

### 2026-09-11 (rev 5) — 7.4 ROOM 360 SHIPPED: THE OBSERVATORIUM — the sky on file, a star for every door

The 7.4 row that carried the biggest REAL function still unbuilt and
needed nothing from the user: the site star-map — "every crossing is a
star; point at one and its door panel opens, a fast route to any site" —
and the tape library's move upstairs. A planetarium on the mezzanine.

- **The door (data.js `central_egress.doors`).** `observatorium` at 240°
  on the MEZZANINE (level 1), directly above Records, between BAY 3 ·
  HOLLOW (210°) and BAY 6 · QUARANTINED (270°): 30° each way is 12.6 m of
  the upper drum at r 24 for panels needing 3.3 / 2.5. `leaf_holographic`
  (the Cyberpunk tenement wears the same; leaves are not exclusive below
  rank). The office locker that stood at 240° moved to 232° (the test
  checks the doorway and that the mezzanine keeps its locker). The plate
  reads ROOM 360 through `hqDoorNo`.
- **The room (`rooms.observatorium`, `kind: 'box'`, 13 × 13 × 5.6).** A
  DARK room on purpose: carpet, drywall and oxblood painted down
  (`shell.floorColor` / `wallColor` / `dadoColor` — the renderer's
  `_hqBuildBoxShell` learned `wallColor` / `dadoColor` / `ceilColor` /
  `ceilTile` this session; `floorColor` already existed), the ceiling is
  the `void` terrain sheet (a nebula, tiled at 4.5 m), no conduits, ONE
  fluorescent over the way in at the shell's strip, tinted blue through
  `shell.mood.light` (the box shell already read it for site rooms). In
  the middle THE PROJECTOR (new proc `star_projector`: a drum base, a
  column, a chrome yoke, an axle tilted 28° with a star ball at each end
  — the lenses are one InstancedMesh per ball — cage rings, a control
  box, and a cool point light that is the room's light; the catalogue
  `glow` is its halo). Three `curved_couch`es round it, facing it (the
  test derives the compass heading from the seat to the middle and
  insists). THE PROJECTED SKY over it (new proc `star_dome`, `ceil:
  true`): 720 seeded faint stars over a 6 m disc, and over them
  `hqStarChart`'s layout — every threshold a big star in its lamp's
  colour (stabilized green with a halo, unstable amber, Code Red red,
  sealed grey), the constellation lines, the room number beside each
  star on a small plane facing down (its top to the north, so a viewer
  facing north reads it). THE STAR CHART on the north wall (new proc
  `star_chart`: a teal frame, the same sky on paper — `_hqStarChartTex`
  draws the rings, the seven spokes, the bay labels, the stars with
  their numbers, the lines — unlit so it reads in the dark; a brass
  plate THE SKY ON FILE · ROOM 360; cached by the lamps it shows so a
  rebuild after a win redraws it). THE TELESCOPE by the south-east
  corner (new proc: a chrome tripod, a navy refractor tilted 35° from
  vertical, the finder, the eyepiece — pointed at the ceiling, which is
  painted). The east wall: the astronomer's tanker desk with the CRT,
  the papers, a mug, a lamp; the tape library — two `metal_shelving`s,
  a filing cabinet with the viewing `tube_tv` on it, the boxes of tapes
  that did not fit; a clock (sidereal: four minutes fast a day). The
  south wall: the round `observation_window` (a porthole onto the
  mezzanine; never cleaned), the breaker panel, the extinguisher, a
  plant that has never seen the sun. The west wall: the way out under
  the exit sign, the coats, a frame. Two globe lamps in the west corners.
- **THE STAR CHART = `hqStarChart(profile)` (data.js, the block before
  Keys).** ONE layout, read by the ceiling, the wall chart and the panel:
  a unit disc (x east, z south — the room's floor frame from above) cut
  into equal wedges in bay order, Bay 1 at twelve o'clock and clockwise;
  a bay's sites strung along its wedge from the rim inward in roster
  order, alternating left / right of the wedge's spine with a seeded
  jitter (`hqHash(id | 'star')` — nothing from the clock; a zigzag, so
  neighbours never crowd: the closest two stars in the sky are 0.14
  apart on the unit disc) and joined in that order (the constellation's
  stick figure). Every star: `{ id, no, label, sector, bayNo, i, x, z, r,
  ang, st, done, total, siteRoom }` — `st` is `doorSiteState`'s word for
  the threshold (a synthesized `{ action: { mission } }` door: stabilized
  / unstable / codered / sealed), `done / total` the mastery count. The
  same sky for every officer; only the lamps are theirs.
- **The panel (map.js `_hqStarmapHtml`, counter `chart` → `overlay:
  'starmap'`).** The chart as an SVG (styles-base.css `.hq-starmap` /
  `.hq-sky-*` / `.hq-star`): the disc, three rings, the seven spokes,
  BAY n at each wedge's mouth, a polyline per constellation, a star per
  threshold (`data-star`, its lamp's class, its radius the mastery
  count, its number beside it, a `<title>`; the red one blinks) — and
  under it the key, tonight's red star when there is one, and the
  register by bay (ROOM n · name · A ROOM · WALK IT / THRESHOLD · the
  lamp chip · POINT ▸). **Point at a star** (`[data-star]`, read in the
  panel's click handler before the function buttons) → `window
  ._hqOpenThreshold(mapId, { star: true })`: the threshold's OWN door
  panel — `_hqThresholdPanelHtml` on a door synthesized from the
  threshold row exactly as the CROSSING console does it (the site file,
  the jurisdiction, the first crossing, the Code Red brief when it is
  today's, the entities on file, the checklist, CROSS ▸ Δ / DEEP /
  WALK IN) — plus **◂ THE CHART · ROOM 360** (`[data-starmap]` →
  `window._hqOpenStarmap`, the same open-by-id pattern as
  `_hqOpenForm365`). The synthesized door's id is `chart`, so the launch
  buttons carry the chart counter as the door (`_hqLaunchMission
  ({ doorId: 'chart' })` → `_hqLastDoor` / `_hqLastRoom`) and
  post-match you stand at the chart again. Nothing about match setup is
  bypassed — the launch is the door panel's own, through the terminal.
- **THE PROJECTOR (counter `projector` → `fn: '_ewReplayLastMatch'`).**
  The tape library's projection: Replay moved UP from Records' door
  panel — Records' `alt` is now `{ label: 'THE TAPE LIBRARY ▸ ROOM 360
  (UPSTAIRS)', room: 'observatorium', at: 'projector' }` and
  `_hqDoorPanelHtml` learned that a door's alt may lead into a ROOM
  (`a.room` / `a.at` → a `data-room` button) — the test insists Replay
  is not on Records' panel twice. The counter panel carries one line
  (DO NOT REWIND).
- **The people.** THE ASTRONOMER seated at the desk (`hqSit`: "I chart
  them. I don't open them. Point at one and take it up with the door."),
  THE USHER standing by the way in (`hqTalk`: "Mind the step. There
  isn't one. People mind it anyway."), three `npcSpots` (looking up; one
  at the chart), two `onlineSpots`, four overheard lines — all Claude
  placeholders (A15).
- **Not done / to look at on the next walkthrough.** No playtest (RULE
  #1c). The dome is a disc of Points 0.1–0.3 m under a 5.6 m ceiling —
  if the nebula sheet fights the stars, `shell.ceilColor` darkens it
  (0x606880 is a first guess), and the sky's `R` (6.0) is the one number
  for its spread. The number labels under the stars are 0.42 × 0.16 m
  planes — legible from the seats by the numbers, unverified. The
  `tube_tv` on the filing cabinet sits at `y: 1.33` (the cabinet's
  catalogue height) at `x: 6.15` — if it floats or sinks, that one row
  moves. The wall chart is a 1024 × 1182 canvas — sharp enough at 1.3 m;
  the profile's lamps are read at BUILD (the room rebuilds on every
  visit, and the panel reads live). The seats are couches, not
  planetarium recliners (§5.6 would take a reclined seat GLB). The
  ceiling's `void` sheet is a battle terrain texture — `_hqTex` already
  falls through to the terrain sheet for any room. RULE #2: single-
  player, viewer-local, nothing on `state`, nothing relayed.
- **Tests.** doorhq.test.js: "Room 360" (the mezzanine door at 240°
  above Records and its piers to Bays 3 and 6, the locker moved, the way
  back, the number, the build sheet, the projector under the dome, the
  couches facing it with a walker's gap, the two counters on their
  props, Records' alt upstairs and Replay not twice, the astronomer on
  the desk chair, the usher, spots clear of the furniture, the four
  procs, the register row), "the star chart" (seven constellations in
  bay order with equal abutting wedges from twelve, every threshold a
  star once — JSON-compared, the sandbox's arrays are another realm's —
  inside its wedge and the disc, its room number, a lamp word, no two
  stars within 0.05, the lamps from the profile while the layout is
  the same for everyone, deterministic), and a source scan (the four
  builders, the chart on paper, the colour rule, the painted shell, the
  panel, the threshold-from-anywhere, the two clicks in order, ◂ THE
  CHART on a pointed-at threshold, a door's alt into a room, the chart
  as the launch's door, the CSS). Also fixed in the box-room test's
  wake: nothing — the room wears its one fluorescent like every indoor
  room. `npm test`: 594 tests, 592 pass, 0 fail, 2 expected skips.
- **Delivery (RULE #1 / #1b).** `data.js` + `three-renderer.js` +
  `map.js` + `styles-base.css` to R2, `index.html` to Render, token
  `20260911-room360-observatorium-01-cors`. `doorhq.test.js`, this log,
  DOOR_MASTER Part D and CLAUDE.md are repository-only. Nothing
  committed or pushed.

### 2026-09-11 (rev 4) — 7.4 ROOM 1287 SHIPPED: OCCAM'S BARBERSHOP — the chair is who you walk the building as (D13 answered)

The next 7.4 row that needed nothing from the user and carried a real
function: the plan's "change your appearance" — the HQ avatar, until now
a console switch (`EW_HQ_AVATAR`), becomes a chair in a room.

- **The door (data.js `central_egress.doors`).** `barbershop` at 105° on
  the ground ring, between the QUARTERMASTER (90°, the vault door) and
  RECEPTION (120°): 15° each way is 5.5 m of wall at r 21 for panels
  needing 2.9 / 2.5 — 2.6 m and 3.0 m of pier under the Room 86 rule.
  `leaf_glass` (a shop door; Reception wears the same, leaves are not
  exclusive below rank). The VENDING MACHINE that stood at 105° moved to
  98° (the hall keeps it; the test checks). A `barber_pole` hangs in the
  hall at 111°, beside the door. The plate reads ROOM 1287 through
  `hqDoorNo`.
- **The room (`rooms.barbershop`, `kind: 'box'`, 8 × 6 × 3.3, a
  CHECKERBOARD floor — a battle terrain key, which `_hqTex` already
  reads off the terrain sheet for any room — drywall, oxblood dado, no
  conduits).** The north wall: two `barber_mirror`s (new proc: a chrome
  frame, a hard-shined dark pane with a sheen — the building has no
  environment map, so it cannot reflect — six vanity bulbs, the
  catalogue's `glow` as their light), a `wall_shelf` under each with the
  comb jar, a mug, the price list face down; two `barber_chair`s (new
  proc: chrome base, pump, column, padded seat, back, headrest, armrests,
  footrest; `foot` 0.48 + `block`) facing them. The east wall: the sink,
  the towel rail, a clock that is early, a bin. The south wall: the bench
  (three folding chairs), a shelf with the magazines (all from before)
  and the radio, a frame, the extinguisher, a plant. The west wall: the
  way out under the exit sign, a second `barber_pole` (new proc: a
  bracket, the drum in a canvas-helix stripe texture that is seamless
  round it, chrome caps, a glass globe — it does not turn; it has not
  since 1287), a frame, the rug. Two fluorescents.
- **THE CHAIR (counter `chair` → `overlay: 'barber'`).** map.js
  `_hqBarberHtml`: ON FILE (the profile's pick) and IN THE MIRROR (what is
  actually standing there — they differ under a dev override), then THE
  STANDING ORDERS — THE RECRUIT (the Player cast model, the default since
  2026-09-06; disabled if its file has not loaded), MOST-PLAYED VESSEL ·
  <name> (disabled until a rigged vessel has plays), A D.O.O.R. AGENT —
  and DECLASSIFIED VESSELS · n WITH A RIGGED FILE: one button per unlocked
  race per rigged, animated gender (`profile.account.unlockedUnits`, the
  same `walks` rule the lunch queue uses, so the parked sedan is never
  offered; `_DEV_UNLOCK_ALL` opens the roster). A pick → `window
  ._hqPickAvatar(spec)` → data.js `hqSetAvatar(profile, choice)`
  (validates the mode and the roster, writes `door.hq.avatar = { mode,
  race?, gender? }`, counts `door.hq.cuts` on a change) → the profile is
  saved → the stamp SFX → `ThreeRenderer.hq.setAvatar(_hqAvatar
  (profile))` → the panel re-renders with the tick moved. `hqAvatarPref
  (profile)` is the read (an unknown mode or a race off the roster is
  the recruit); `hqAvatarLabel(pref)` the wording. map.js `_hqAvatar`
  now reads the pref after the dev override (`EW_HQ_AVATAR = 'vessel'`
  still forces the most-played rule; a `race` whose model is missing
  falls through to the recruit, then the other gender first).
- **The swap in place (three-renderer.js `hq.setAvatar(av)`).** The
  walker's `hq-player` record keeps its spot, heading, camera, air state:
  the old rig record is evicted (`_unitModelRigs` / `_modelAnimState`,
  the id is reused), its group disposed, and `_hqSpawnCharacter` spawns
  the new model under the same id at `(x, z, y)`, `yaw` / `facing`
  copied over. No room rebuild, no door-blink — you watch yourself
  change in the chair.
- **THE MIRROR (counter `mirror` → `_mountReactProfile`).** The ID card.
  profile.js `doorCardPortrait` now lets a `race` / `agent` pick lead
  the photo (the recruit and the vessel modes keep the most-played rule)
  — "the photo on your card follows the chair". The callsign stays
  Reception's (edited on the card, as before).
- **The people.** THE BARBER standing between the chairs (`hqTalk`: "Two
  ways to explain how you look. I only do the shorter one."), THE REGULAR
  seated on the bench ("Same as last time." "Last time you were a
  different person." "Same as that, then."), three `npcSpots` (waiting;
  next for the second chair), one `onlineSpot`, four overheard lines —
  all Claude placeholders (A15). The in-tray shows a WALKS AS row with
  the cuts on file.
- **Not done / to look at on the next walkthrough.** No playtest (RULE
  #1c). The chair's proportions and the mirror's height are by the
  numbers (a 1.75 m sitter's eyes at ~1.2 m on a 0.59 m seat; the pane
  runs 1.05–2.4 m) — if the bulbs sit too high, `barber_mirror.mount` is
  the one edit. The shelf props sit at `mount + 0.03` (the plank's top).
  Nobody sits in the chair to be cut — the pick is instant; a sit beat
  (the `hqSit` pose on the chair, a cape, a 1.5 s hold) is a later
  polish. §5.6's barber chair + mirror GLBs would replace the procs by a
  `file` on the entry. RULE #2: single-player, cosmetic, nothing on
  `state`, nothing relayed.
- **Tests.** doorhq.test.js: "Room 1287" (the door and its piers, the
  way back, the number, the vending machine and the pole in the hall,
  the build sheet, the two counters on their props, the chairs facing
  their mirrors, the barber and the regular, the three procs, the
  register row), "the chair" (the four modes, the roster check, the
  default, the cuts — JSON-compared: the sandbox's objects are another
  realm's), and a source scan (the builders, `setAvatar` respawning the
  same id after evicting its rig, `_hqAvatar` reading the pref, the
  panel, the pick, the click read before `data-fn`, the card's read
  ahead of the most-played rule). `npm test`: 591 tests, 589 pass, 0
  fail, 2 expected skips.
- **Delivery (RULE #1 / #1b).** `data.js` + `three-renderer.js` +
  `map.js` + `profile.js` to R2, `index.html` to Render, token
  `20260911-room1287-barbershop-01-cors`. `doorhq.test.js`, this log,
  DOOR_MASTER Part D and CLAUDE.md are repository-only. Nothing committed
  or pushed.

### 2026-09-12 — THE PLATES SAY WHAT THE ROOM DOES + THE BATTLE MARKER (user request)
The user: too many rooms wore two names and neither said what the room
does ("RECEPTION · INTAKE / HUMAN RESOURCES"). Every plate in the building
now reads **ROOM № · ONE NAME · THE GAME FUNCTION** — the number from the
register as before, the name kept (Reception, the Cafeterium, Occam's
Barbershop…), the sub-line replaced by what pressing E gets you:
- Hall doors: RECEPTION → VIEW PROFILE · QUARTERMASTER → SHOP · RECORDS →
  CODEX · MEDICAL → CHALLENGE MODE · ARCANE ENGINEERING → MAP EDITOR ·
  TRAINING ROOM → PRACTICE · GAUNTLET · DUNGEON · THE CLOCK ROOM → DAILY
  TASKS · LOGIN STREAK · OCCAM'S BARBERSHOP → CHANGE AVATAR · THE
  CAFETERIUM → LEADERBOARD · SHOP · THE OBSERVATORIUM → MAP SELECT ·
  REPLAY · YOUR OFFICE → STORY · CASE FILE · ELEVATOR → EXECUTIVE FLOORS ·
  KEYHOLDER RANK · BUREAU OF CONTINUITY → STORY CANON · GATEKEEPER RANK ·
  every bay → BATTLE MAPS. Counters: DISPATCH → QUICK PLAY · ONLINE MATCH,
  BUILDING DIRECTORY → ROOM LIST · FAST TRAVEL.
- Inside the rooms the same rule (THE CHAIR → CHANGE AVATAR, MIRROR →
  VIEW PROFILE, FORM 365 → DAILY TASKS, PUNCH CLOCK → LOGIN STREAK, CODE
  RED → TODAY'S BONUS BATTLE, THE STAR CHART → MAP SELECT, THE PROJECTOR →
  REPLAY LAST BATTLE, RANGE CONSOLE → PRACTICE BATTLE, CHALLENGE RANGE →
  GAUNTLET, CONDEMNED CROSSING → MYSTERY DUNGEON, IN-TRAY → STORY · READ
  THE CASE FILE, NOTICE BOARD → LEADERBOARD · DAILY TASKS, THE TILL / THE
  BAR → SHOP). Every way-back door → BACK TO THE MAIN HALL / BACK TO THE
  BAY; ring cap doors → NEXT BAY · CLOCKWISE; ring threshold doors →
  BATTLE SITE (Atlantis lost its second title — `thresholds[id].sub` still
  overrides, none uses it); the site room's own line → BATTLE SITE · BAY n;
  the console → BATTLE SETUP (map.js `_hqCrossingHtml` matches). Room
  sub-lines (the strip, the room sign) follow the same wording.
- **THE BATTLE MARKER**: every playable site room has a glowing beacon at
  its board centre — data.js `hqSiteRoom` adds counter `battle` (`x: 0,
  z: 0`, `proc: 'battle_marker'`, `verb: 'BATTLE'`, `overlay: 'crossing'`,
  plate ROOM № · BATTLE · <SITE>); three-renderer.js `_hqBuildCounters`
  builds it via `_hqBuildBattleMarker` (amber floor ring + cyan outer ring
  + a light column + a spinning, bobbing octahedron with a glow sprite, all
  on the centre cell's own top via `_hqSiteCellAt`; `_hqTickWorld` turns
  it, `_hq.fxPulse` breathes it). E opens the SAME crossing terminal the
  console does (`_hqConsoleTerminal` — no CRT within reach, so no camera
  push) and post-match returns you to the marker. The console stays.
- doorhq.test.js: the Atlantis pin → BATTLE SITE, plus the marker per site.
- **Delivery (RULE #1 / #1b).** `data.js` + `three-renderer.js` + `map.js`
  to R2, `index.html` to Render, token `20260912-hq-plates-battle-01-cors`.
  `doorhq.test.js`, this log, DOOR_MASTER Part D and CLAUDE.md are
  repository-only. Nothing committed or pushed. Not browser-playtested
  (RULE #1c) — the marker's look is worth one screenshot.

### 2026-09-12 — MOVING MAPS: three sites whose world streams past the board (data.js, three-renderer.js, audio.js, server.js, index.html; motion-maps.test.js, delta-maps.test.js)
The user asked for maps where the background moves fast to make it
intense — a pirate ship on the ocean, a half-broken spaceship through
space, a chessboard through a void of shapes — faster as the rounds go,
maybe orbiting the sun or the moon, without tanking the frame rate. Design
calls were left to Claude.
- **The three sites** (7.10 each): **Room 1717 · QUEEN ANNE'S REVENGE**
  (`prebuilt_revenge`, Hollow; the 7.7 Pirate Bay number — the ship itself
  under way, not a cove; leaf_shabby_wood, "the year the Revenge was
  taken"), **Room 426 · THE DERELICT** (`prebuilt_derelict`, Celestial, a
  new number — LV-426, "the signal was a warning"; leaf_bulkhead, wide),
  **Room E4 · THE LOOKING-GLASS** (`prebuilt_lookingglass`, 7.6 #6 — shipped
  to DIPLOMATIC, not Quarantined: a locked bay's thresholds read SEALED and
  map.js refuses them until a story chapter, and the map must be playable;
  the Queen claims immunity; leaf_frame_only, "the first move"). Full
  16×16 maps + hand-authored Δ boards; SITE_FILES; natives retagged
  (pirate → the Revenge; cosmic wraith + symbiote → the Derelict;
  dreameater + occulus → the Looking-Glass; voidweaver stays on the Moon —
  doorhq.test.js pins the Moon's three); walkable rooms (the Revenge a
  MOAT room: the deck on a quay over deep water; the wreck on hull plate;
  the board on its marble rim) with the settings inside at 1:1; server
  MAP_POOL rows. The Δ FORGE takes a per-board bed (`cfg.strata` /
  `underTop` → `entry.bed`; delta-maps.test.js reads it: deep water + wood
  under the deck, void + gunmetal under the wreck, void + marble under the
  board — the shared lava bed stays the default for the 29).
- **MOTION** (three-renderer.js): `env.motion` on the meta row — kind ·
  axis · speed · ramp · max · sea + seaDepth · sky · storm { from, to } ·
  orbit { body, period, near } · ambience. The board never moves; the far
  roster is laid along the travel band and wraps, the moat sheet slides one
  tile and wraps, the caustic web flows, wake textures scroll, motes streak
  past stretched by the speed, the dome's clouds stream, a sea map's storm
  builds with the rounds, and the sun (the Derelict) or the moon (the
  Looking-Glass) swells on a cosine over `period` tiles travelled — sooner
  each time as the speed climbs. Speed reads `state.round` (synced online,
  nothing relayed). Heaven got a gentle drift. Kill-switch
  `EW_NO_MAP_MOTION`; readout `ThreeRenderer.motion()`.
- **In the building**: a setting must skip under `K.hq` whatever would
  register as a walk blocker on the quay (the galleon's rigging and wake,
  the wreck's plating and girders, the board's keel and loose shapes);
  the wreck's ribs stand with their ends above head height so the room
  reads them as overhead. Still sky in the rooms (`_hqTickSky` zeroes
  the motion uniforms).
- **Tests**: `motion-maps.test.js` (rows, beds, rooms, bays, natives,
  MAP_POOL, the renderer's MOTION symbols, the three settings' `w` ↔ the
  near rows, the sea depth ↔ the meta row); delta-maps.test.js 29 → 32 with
  per-board beds. `npm test`: 836 pass, 0 fail, 2 skipped.
- **Delivery (RULE #1 / #1b)**: `data.js` + `three-renderer.js` +
  `audio.js` to R2, `server.js` + `index.html` to Render, token
  `20260912-moving-maps-01-cors`. Tests, this log, DOOR_MASTER Part D,
  PLAYTEST_NOTES and CLAUDE.md are repository-only. Nothing committed or
  pushed. NOT browser-playtested (RULE #1c) — PLAYTEST_NOTES "MOVING MAPS"
  lists what to eyeball first (the round-1 speed and the cap, the sea's
  level under the hull, the sun at perigee).

### 2026-09-12 (rev 2) — MOVING MAPS: the Flying Dutchman, the starship, the pieces, wheel + rise
Room 1717 renamed THE FLYING DUTCHMAN (id unchanged). Faster travel
(×3, cap 5×). `_nrLoft` / `_nrShipPlan` (three-renderer.js) — the
galleon's box apron is a lofted hull with a bulwark and rail torches
(`_nrTorch`); the Derelict is a fuselage with engines, nacelles, a bridge
and a breach; both hulls battle-only (`!HQ`) so the site rooms' quays are
untouched. The Looking-Glass's Δ and full board carry `chess_*`
monuments (map.js / renderer `_MON_GRID`, `MF_DELTA_SOLID_MONS`, the
forge's `M.pieceSym`). New `env.motion` kinds `wheel` (Stonehenge, Area
51 — `uSkyYaw` turns the dome) and `rise` (Babel up, Hell down —
`uSkyLift`). `_ew_occSkip` keeps a hull out of the line-of-sight fade.
Full notes: CLAUDE.md "MOVING MAPS", PLAYTEST_NOTES "MOVING MAPS rev 2".


### 2026-09-13 — 7.4 ROOMS 111 + 1984 SHIPPED: THE TROPHY CASE and THE INTERROGATION ROOM (data.js, three-renderer.js, map.js, profile.js, battle.js, index.html; doorhq.test.js)

Two 7.4 rows that needed nothing from the user, each with a real function
behind its counter (the guardrail: every function keeps one physical home).

- **Room 111 · THE TROPHY CASE (the mezzanine at 290°).** Between Bay 6
  (270°) and the Bureau (315°) on the upper drum — 20° and 25° of wall at
  r 24 for panels needing 2.5 / 3.3 — directly over EMPLOYEE OF THE MONTH
  (the board counter at 288° on the floor below: the board is the six
  photographs, this room is everyone else). `leaf_glass_exec` (Engineering's
  leaf; not a rank leaf). The picture frame that hung at 288° moved to
  281°. The room (`rooms.trophycase`, 8 × 5.5 × 3.2, carpet, the walls
  painted lighter than the hall — the cases are the light): the north wall
  wears two `trophy_case` procs (new, three-renderer.js: a teal plinth,
  chrome sides, a glass pane at 16 %, three shelves, four bulbs under the
  top — the catalogue's `glow` is the cabinet's light; the back panel
  carries THREE ROWS OF THREE PLAQUES, GOLD for the engraved ones, brass
  blanks for the rest; three cups on the top shelf) with the nameplate
  between; a filing cabinet, a clock and a plant on the east; the curved
  couch facing the cases over a coffee table on the south; the globe lamp by
  the way out. THE CABINET (counter `cabinet`, verb OPEN) → profile.js
  **`_mountReactTrophies`** = `_mountReactProfile({ tab: 'achievements' })`:
  `ProfilePage` now takes `initialTab` (every other caller still lands on
  the overview); map.js `_HQ_MODAL` maps the new mount to the profile's
  unmount so the building pauses under it and resumes when it closes;
  `_HQ_FN_LABELS` names it. **`hqTrophyCount(profile)`** (data.js, on
  `window`): `{ done, total, champs, feats, lines }` from the achievements
  ledger (`progress.unlocked` — '<line>.<tier>' counted against the
  catalogue's tiers, a tier the catalogue no longer has is ignored;
  'champ.*' and 'feat_*' counted apart) — the cabinet's panel states the
  count, the proc reads it once at build for the gold (the room is rebuilt
  on every visit). The curator's line and the overheard lines are Claude
  placeholders (A15).
- **Room 1984 · THE INTERROGATION ROOM (the ground ring at 255°).** Between
  RECORDS (240°, wide) and BAY 1 (270°): Internal Affairs keeps its room
  next to the file. `leaf_cell` (Bay 6's; leaves are not exclusive below
  rank). The frame at 250° moved to 247°, the extinguisher at 258° to 262°,
  the boxes at 256° (r 19.3, in front of the door) to 263°. The room
  (`rooms.interrogation`, 7 × 6 × 3, concrete, institutional green over
  grey through the paint-down fields, conduits ON, one strip over the
  table, a tired light): the **`steel_table`** proc (new: a brushed top on
  four square legs, a cross brace, the ring bolt; `foot` 0.75, `block`)
  in the middle with two folding chairs face to face across it, the desk
  lamp, the file (folders, a clipboard, a pen, a mug, the rotary phone);
  the kit's round `observation_window` on the north wall as the ONE-WAY
  MIRROR (plan 7.4's own call); the metal shelving with the tube TV on its
  middle shelf (the recording), a filing cabinet and a rail on the east; the
  breaker, the extinguisher and the third chair nobody sits in on the
  south; the drain. Two counters: **THE TABLE** (`overlay: 'transcript'`,
  verb SIT) → map.js **`_hqTranscriptHtml`**: TRAINING MATCHES ON FILE ·
  DECISIONS SCORED · CPU AGREEMENT (%, chip green ≥ 60) · WEIGHTS MOVED OFF
  DEFAULT, then every moved weight as a row (label, default → current, the
  range, ▲ / ▼), and THE LAST SESSION ▸ FULL REPORT — `[data-transcript]`
  in the panel click handler opens battle.js's own report panel
  (`_ewImitationReport`, z 1200, over the building; the panel stays up) —
  enabled only while a report is on file this session (battle.js
  **`_ewImitationHasReport`** / `_ewImitationLastReport`, two new one-line
  hooks beside `_ewImitationReport`). No ledger yet → the panel says how to
  start one (CPU TEMPO: ⚡ Training). **THE GLASS** (verb LOOK, `action:
  {}`) → a panel, a line, and nothing else; the interviewer sits in the
  far chair, Internal Affairs stands by the wall — their lines and the
  overheard lines are Claude placeholders (A15). The story the plan wanted
  here (the leave hearing, 4.2 micro-scenes) waits on the user's lines.
- **RULE #2:** both rooms are viewer-local (the achievements ledger and the
  imitation ledger are the viewer's own); nothing on `state`, nothing
  relayed. **Tests:** doorhq.test.js +4 (each room: the door, the piers,
  the moved props, the register, `boxPropProblems`; `hqTrophyCount`
  against a synthetic ledger; the source sites in map.js / profile.js /
  three-renderer.js / battle.js). `npm test`: 950 pass, 0 fail, 3 skips.
  Not screenshotted (RULE #1c) — first things to eyeball live: the gold on
  the plaques for a veteran card, the glass pane's opacity, the table's
  height under the lamp, and whether the cell door reads as a door from
  the hall.
- **Delivery:** `ENTROPY_WARS_HQ_ROOMS_111_1984.zip` — data.js,
  three-renderer.js, map.js, profile.js, battle.js → R2; index.html
  (`?v=20260913-hq111-01-cors`) → Render; doorhq.test.js, this file,
  CLAUDE.md → the repo.

### 2026-09-12 (rev 3) — THE MISC KIT: the user's 28 Meshy props on the moving maps + Room 247
The moving-maps art batch (R2 `Assets/misc/`) wired through one helper,
three-renderer.js `_hzMiscKit` (fit / yaw / hang / sink / lift / foot /
fallback), with every GLB's facing measured off a Playwright contact
sheet first. The Dutchman carries the iron cannon ×8, the helm, the
anchor, the chest, yard lanterns, a towed rowboat and two kraken arms; the
Derelict its nacelles, the mast dish, a docked escape pod, the torn plate,
a dead astronaut and a docking collar; the Looking-Glass its tea party
(teapot, cups, caterpillar, flamingo, the open watch); Stonehenge the
bluestones (GLB trilithons); Babel the scaffold crane; Area 51 the saucer
on its gear; D.U.M.B. the bank vault as both blast doors (and the
`blastdoor` monument on D.U.M.B. / CERN). The `sea` / `wreckage` /
`wonder` rosters carry GLB rows. The Cannonball spell fires the same
cannon (`_WPN_MODELS.cannon`). **HQ**: `DOOR_HQ.catalogue` entries may
carry `base: 'misc'` (`_hqModelUrl`); Room 247 hangs the pocket watch on
its north wall and lays its twin on the tanker desk. The site rooms wear
the settings' new pieces through `_hqBuildSetting` unchanged (the
battle-only pieces — hulls, the sea, the kraken — stay out of the rooms).
`MODEL_INDEX.md` (new) is the register of every model family; `npm test`
runs `misc-models.test.js` (849 pass, 0 fail). Delivery: `three-renderer.js`
+ `three-vfx-effects.js` + `data.js` to R2, `index.html` to Render (token
`20260912-misc-models-01-cors`); tests + docs repository-only. Nothing
committed or pushed; NOT browser-playtested (RULE #1c) — eyeball first the
cannon's facing on the rails, the nacelle bells pointing astern, the
lanterns' height under the yards, and the kraken's size off the port quarter.

### 2026-09-13 — 7.6 WAVE 1 SHIPPED: the six new sites (one session)
The whole wave in one delivery, each site the 7.10 checklist end to end:
a full 16×16 6v6 map + a hand-authored Δ (`_MF_BUILDERS` /
`_MF_DELTA_BUILDERS`), the EW_MAP_META row, a SITE_FILE, the natives
retagged in POINT_OF_ENTRY, the threshold (leaf + roomNo + why + note),
the bay, a walkable room (`siteRooms.built` / `near` / `shells` /
`flavour`), a MAP SETTINGS near builder (`_NR_BUILDERS.<key>`) and the
server's MAP_POOL rows.
- **Room 13 · THE HAUNTED HOUSE** (`prebuilt_haunted`, Terrestrial,
  `leaf_hotel` — the plate says 13, the door says 237). The ground floor
  of the mansion cut open across the MIDDLE of the board (the parlour, the
  hall under its chandelier, the library) between two graveyards, one per
  team — thin `M.wall` bricks-outside / wallpaper-inside with two front
  doors (x 3 / 12) and windows (`see: true` — shoot through, not walk),
  hearths (+2), a piano and a reading table (+1), the crypt, the bog, the
  lone `door` monument numbered 237 in the parlour, the coven's brazier.
  Setting `haunted`: two-storey gabled wings west and east with lit
  windows, the turret with the widow's walk, an iron fence with gates at
  the lanes, DeadTree models, the pumpkin patch (carved ones lit), the
  bonfire, the wooden cross, candle lamps. Room: open edge, the console
  moved to the north wall (the wings stand west). Natives: ghost (from
  the Backrooms), werewolf (Fairy Forest), vampire (the Grove), ghoul
  (Hell) — the gothic point of entry the plan asked for. `env.ambience:
  'ambNight'` — audio.js now reads a still map's bed off the row.
- **Room 33 · THE LODGE** (`prebuilt_lodge`, Terrestrial, `leaf_vault`).
  Indoors (`world.kind: 'room'`, scenery none): the mosaic pavement, the
  lodge hall at each end (oak, the runner, benches +1), the sanctum in the
  middle behind thin damask walls with the great doors at x 7..8, the two
  pillars (`column_1` / `column_2`), the altar (`tablet`), plinths (+2),
  censers, the Tomb (322) sunk into the ambulatory either side (a dip with
  a `skull`). Setting `lodge` (w 3.4, h 3.6): damask over an oak dado,
  the ambulatory colonnade, torches in brackets, banners, censers, tablets,
  and the ALL-SEEING EYE (the `eyes` roster's eyeball OBJ) hung over the
  board as the lamp — battle only. Natives: politician, general, marksman.
- **Room 0 · THE SINGULARITY** (`prebuilt_singularity`, CELESTIAL,
  `leaf_frame_only` — "a frame; there is no other side"). Shipped to
  Celestial for the reason E4 went to Diplomatic: a locked bay's
  thresholds read SEALED and the map must be playable. Two spiral arms of
  rock (`keep(x, y)`: angle − 0.5·r mod π, point-symmetric) over
  `M.hole(x, y, 'void')` columns, crystal shards (+1 / +2), the
  checkerboard core with the `holo` point, a `beamring` + `lightpillar`
  at the centre; the Δ sinks its void as depth-2 lakes (no holes on a Δ).
  Setting `singularity`: leaning shards lit violet, an accretion ring
  and a light pillar hung UNDER the board (battle only), the `space`
  roster at density 1.3. Natives: watcher, cosmic wraith.
- **Room 6 · SATURN** (`prebuilt_saturn`, Celestial, `leaf_bulkhead`).
  The hexagon: a real hexagon mask (`hex(x, y, R)`) one step up in
  ochre `mars_2`, the storm wall of `storm` round it (slow), cloud-gap
  holes at the corners, `oil` lakes sunk into the plateau, `tower_cube`
  objects and one gunmetal block as the cubes, a firm `mars_2` landing
  under the spawn rows, the `rings` at the eye, lenticulars. Setting
  `saturn` (w 5.0): thick-cloud and storm mounds, cubes off the rim, the
  storm's flicker, and the RING PLANE — a wide flat annulus tilted off
  level with the Cassini division, battle only. Natives: grey, black goo.
- **Room 21 · THE STRIP** (`prebuilt_strip`, Urban, `leaf_motel`). The
  boulevard N–S down the middle with a planted median and sidewalks,
  crosswalks, fountain plazas (a water dip), palms, lamp posts and
  traffic lights, the wedding chapel and a storefront (roof-walkable
  `church` / `building_3` on +1 plinths), the casino's side wall (+2)
  with the `jumbotron` marquee on it, the `obelisk`, the sign's `rings`
  over the centre. Setting `strip`: neon storefront blocks on the flanks
  (CASINO · LUXOR · WEDDINGS · 24H · …), lamps and palms on the lanes, the
  fountain pools with jets, the chapel with its steeple and a pulsing
  heart, and the Luxor off the far corner — the Pyramid GLB, an obelisk,
  the beam (battle only). Edge `walls` (the storefronts). Natives:
  conspiracy theorist, honda civic. `ambNight`.
- **Room 1954 · DOWNTOWN** (`prebuilt_downtown`, Urban, `leaf_glass` —
  the revolving door is rationed to Bay 5 by doorhq.test.js). Daylight:
  the avenue and the cross street, roof-walkable blocks (`building_1`,
  `building_8`, `abandoned_building_2`), the rubble where the kaiju
  walked (+1 / +2 steps), a dumpster in every alley (2×1, twins by hand),
  a security camera, a fallen sign still lit. Setting `downtown`: the
  Cyberpunk block recipe in light concrete (warm windows, no neon), rubble
  mounds, dumpsters, traffic lights on poles at the lanes, and the tower
  COLLAPSED across the apron on a heap of rubble with its smoke (battle
  only). Edge `walls`. Natives: superhero, antihero, zombie, king kong.
  `ambDay`.
- **Plumbing**: `env.ambience` on a meta row names a still map's bed
  (audio.js, after the moving-map rule); check-data-parity.js #6 diffs
  server.js MAP_POOL against EW_MAP_META (ids, sizes, team) — plan 7.10
  #5 is no longer "not parity-checked"; delta-maps.test.js expects 38 Δ
  boards; doorhq.test.js pins Bay 7's four maps and lists the Strip and
  Downtown among the walled outdoor rooms. Tests: 950 pass, 0 fail.
- **Not done / to eyeball live** (RULE #1c — nothing rendered): the
  house's thin walls and windows on the board, the eye's height over the
  Lodge, the Singularity's arms from the gameplay camera (the far tiles
  are a drop — no fence), Saturn's ring plane against the dome, the
  Luxor's pyramid scale, the collapsed tower's lean. The Δ boards passed
  the forge's headless rules (routes, symmetry, protected tiles). Cast
  lines and site-room lines are Claude placeholders (A15).

### 2026-09-13 (rev 2) — 7.4 ROOMS 42 + 1337 SHIPPED: RECORDS becomes a room, IT opens (data.js, three-renderer.js, map.js, index.html; doorhq.test.js)

Two more 7.4 rows that need nothing from the user and put a real function
behind every counter (the guardrail: one physical home per function).

- **Room 42 · RECORDS (the ground ring at 240°).** The wired double door
  was a screen door — `_goToCodex` with two alts (the tape library
  upstairs, the community maps). It is now the way INTO `rooms.records`
  (10 × 7 × 3.4, an acoustic ceiling, manila over green linoleum through
  the paint-down fields, warm light): six `metal_shelving` STACKS along
  the north wall with the overflow boxed on them, **THE READING DESK**
  (a `tanker_desk` on the south wall with the CRT, the lamp, the folders,
  the phone; counter `codex`, verb READ → `_goToCodex` — the Codex's own
  Back already came home through `_hqReturnOrMenu`), **THE CARD
  CATALOGUE** (new proc `card_catalogue`, three-renderer.js: a wood
  cabinet, six columns × eight rows of little drawers with brass pulls
  and a label card each, one drawer left open with a card sticking up;
  counter `unfiled`, verb SEARCH → `_mountCommunityMaps` — added to
  map.js `_HQ_MODAL` with the page's own `_unmountCommunityMaps`, so the
  building pauses under it and resumes when it closes), and **THE
  SERVICE STAIR** (door `tapes` on the north wall, `leaf_exit`) up to
  the Observatorium AT the projector — the old REPLAY alt as a door you
  walk through (`_hqGoTo` already resolves a counter id in a box room).
  Two cabinets, the breaker, a plant on the east; the clock, a frame,
  the returns pile on the floor, the boxes on the south; the cooler and
  the globe lamp by the way in. The archivist sits at the desk, the clerk
  reaches into the stacks, a native reads standing up. The number moved
  from the door onto the room (`hqDoorNo` reads it through; the register
  lists ONE Room 42, kind `room`). Nothing in the hall moved.
- **Room 1337 · IT (the mezzanine at 120°).** Inside Arcane Engineering's
  stretch of the upper drum — 30° (12.6 m at r 24) from the research
  offices at 90° and from Bay 5 at 150°; the `round_cabinet` that stood
  at 120° moved to 113°. The plan wanted a hollow-core door with a
  keypad; `leaf_hollow_core` is the L2 RANK leaf (rank leaves are
  exclusive), so the door is `leaf_holographic` — Engineering's plate
  now says the fourth door that wasn't there yesterday is IT, and the
  KEYPAD hangs INSIDE by the way out (new proc `keypad`: twelve keys, a
  green LED, the sticky note with the code, DO NOT SHARE). The room
  (`rooms.it`, 8 × 6 × 3.0, a cold server room: the conduits ON as the
  cable trays, the strip's light the racks' green): three **`server_rack`**
  procs along the north wall (a dark 42U cabinet, the units as slabs with
  green LEDs and one amber, a loom out the top; the catalogue's `glow`
  is the rack's light on the floor), two `tanker_desk`s on the east wall,
  the shelf of spares, the cooler that leaks (the wet-floor sign; the
  ticket is open). Three consoles — A5's dev surfaces get their physical
  home: **THE LIBRARY** (`library`, LOG IN → `_goToSpellLibrary`: the
  spell / ability editor + the Spell Lab; `_spellLibraryBack` now comes
  home to the building when `_hqHome`, else to Settings as before),
  **THE BENCH** (`bench`, RUN → `_launchBalanceSim`: AI vs AI with equal
  weights, the dashboard) and **THE RACKS** (`racks`, RUN →
  `_launchAITraining`: the champion / challenger A/B rig — the racks are
  what the CPU trains on). The labs launch matches the way every page fn
  does (`_hqLeave`, the result overlay returns you to the console). The
  sysadmin sits at the library, the intern is on the phone to Facilities
  about the door. `_HQ_FN_LABELS` names all three.
- **The panel**: a counter with a `desc` and no panel of its own now
  states it (`_hqCounterPanelHtml`, before the fn button) — the five new
  counters read their line on the way in; every older counter without a
  desc is unchanged.
- **RULE #2:** both rooms are viewer-local; nothing on `state`, nothing
  relayed. **Tests:** doorhq.test.js +3 (each room: the door, the piers,
  the moved prop, the counters ↔ their props, `boxPropProblems`, the
  register; the source sites in map.js / three-renderer.js / profile.js)
  and the Observatorium test re-pointed at the stair (Records' door has no
  alt any more). `npm test`: 956 pass, 0 fail, 4 skips. Not screenshotted
  (RULE #1c) — first things to eyeball live: the catalogue's drawers at
  the east wall, the racks' LEDs under the green strip, the keypad's
  height beside the holographic door, and whether the service stair's
  `leaf_exit` reads as a way UP from inside Records.
- **Still open in 7.4:** Room 1 (Reception as a room), 4C + 8 (Executive,
  behind the elevator's L4 gate), 1111 (Medical as a room) + 5150 (the
  Padded Room off it), the Fourier Foyer (waits on 7.2's spawn-in-the-
  foyer decision). 4.2's micro-scenes for 1984 still wait on the user's
  lines (A15).
- **Delivery:** `ENTROPY_WARS_HQ_ROOMS_42_1337.zip` — data.js,
  three-renderer.js, map.js → R2; index.html
  (`?v=20260913-hq42-01-cors`) → Render; doorhq.test.js, this file,
  CLAUDE.md → the repo.

### 2026-09-13 (rev 3) — 7.4 ROOMS 1111 + 5150 SHIPPED: MEDICAL becomes a ward, THE PADDED ROOM opens off it (data.js, three-renderer.js, map.js, index.html; doorhq.test.js)

The next two 7.4 rows that need nothing from the user: the hospital door
was the last department door on the ground ring that led straight to a
screen, and the Padded Room was planned as one cell behind it.

- **Room 1111 · MEDICAL (the ground ring at 210°).** The hospital door
  was `_goToCampaign` with a `roomNo` on the door. It is now the way INTO
  `rooms.medical` (8 × 6 × 3.2, an acoustic ceiling, hospital green over
  pale terrazzo through the paint-down fields, cold white light): the
  WARD along the east wall — two `cot`s, the visitor's folding chair
  nobody sits in, an untouched meal tray, the locker; **THE SERVICES
  DESK** (a `tanker_desk` on the south wall with the CRT, the lamp, the
  phone, the folders; counter `desk`, verb CHECK IN → `_goToCampaign` —
  revives, retries, the ladder); **THE CHART** (a `clipboard` on the east
  wall between the cots; counter `chart`, verb READ → `overlay: 'chart'`
  → map.js `_hqChartHtml`): the ward's record of the operative read
  through **data.js `hqMedicalRecord(profile)`** (on `window`) off
  `profile.career` (the battle stats profile.js mirrors after every
  match) + the punch clock — CROSSINGS ON FILE, RELEASED (the wins, with
  the rate), EXITED (the losses: "processed, not dead — the desk files
  the retry"), HEALING ON FILE, DODGED · CRITICAL, DAYS ON THE CLOCK, and
  ONE CONDITION LINE: INTAKE (no crossing on file) / FIT FOR DUTY / UNDER
  OBSERVATION (more exits than wins; a tie is fit) / ADMINISTRATIVE LEAVE
  (`profile.door.leave` truthy — the story's hook, DOOR_STORY §4; nothing
  sets it yet). The chart's panel checks you in at the desk from the ward.
  The north wall: the sink under its two shelves, the vent, the breaker,
  the hook rail, the supplies shelving, and **the cell door** (`padded`,
  `leaf_cell`, at x 2.6 with an EXIT sign over it that is not one) →
  `{ room: 'padded', at: 'egress' }`. The west wall: the way in, the
  plate, the cabinet, the cooler, two waiting chairs and a magazine from
  1987. The nurse sits at the desk, the orderly stands by the cell door
  with his arms folded, the patient sits on the far cot ("I feel
  processed"), a native waits on the first chair. The number moved from
  the door onto the room (`hqDoorNo` reads it through; the register lists
  ONE Room 1111, kind `room`). Nothing in the hall moved (the door was
  already there).
- **Room 5150 · THE PADDED ROOM (off the ward).** `rooms.padded`, 3.6 ×
  3.6 × 3.2, cream on cream: three walls wear the new wall proc
  **`wall_padding`** (three-renderer.js `_hqProcBuilders`: a backing slab
  and 4 × 3 tufted vinyl cushions, each pressed in at a button; front +z,
  mount 0.1; catalogue `wall: true`, no block — the walls are the
  blockers), the fourth wall is the door's (the same `leaf_cell`, back to
  the ward AT its cell door); one cot bolted down along the north wall,
  one drain, one tube, the hold order on a `clipboard` beside the door.
  **THE HOLD** (counter `hold`, `action: {}` — `_hqCounterPanelHtml`
  renders it by id like Room 1984's glass): the desc, the chart's
  CONDITION row, and SERVE IT / NOT TODAY. No agents ("nobody is serving
  leave today"); two overheard lines. Story: administrative leave is
  served here when the story serves it; the hearing is Room 1984's (4.2,
  waits on the user's lines, A15).
- **RULE #2:** both rooms are viewer-local; nothing on `state`, nothing
  relayed. **Tests:** doorhq.test.js +4 (the ward: the door, the way
  out, the cell door and its clear doorway, the desk ↔ the tanker desk,
  the chart ↔ the clipboard, the cots along the east wall, the nurse on
  the chair, the patient on a cot, `boxPropProblems`, the register; the
  cell: the padding on the three non-door walls, the hold's empty action,
  one cot, no agents, the register; `hqMedicalRecord`'s four conditions
  + the tie; the source sites in map.js / three-renderer.js / data.js).
  Two assertions were rewritten on the way: `deepStrictEqual` against an
  array from the vm sandbox fails on identical contents (a different
  `Array` realm) — compare `.join(',')` / `.length` instead. `npm test`:
  960 pass, 0 fail, 4 skips. Not screenshotted (RULE #1c) — first things
  to eyeball live: the padding's tufts under the one tube, the cell door
  in the ward's north wall beside the shelving, the patient's seat height
  on the cot (the sitting clip is pinned at chair height; a cot is 0.46
  m), and whether the chart's clipboard reads at 1.4 m between the cots.
- **Still open in 7.4:** Room 1 (Reception as a room), 4C + 8 (Executive,
  behind the elevator's L4 gate), the Fourier Foyer (waits on 7.2's
  spawn-in-the-foyer decision). 4.2's micro-scenes for 1984 / 5150 wait
  on the user's lines (A15); `door.leave` is the hook the story will set.
- **Delivery:** `ENTROPY_WARS_HQ_ROOMS_1111_5150.zip` — data.js,
  three-renderer.js, map.js → R2; index.html
  (`?v=20260913-hq1111-01-cors`) → Render; doorhq.test.js, this file,
  CLAUDE.md → the repo.

### 2026-09-13 (rev 4) — 4.3 ORIENTATION SHIPPED: the tape, the shelf, nine scripted lessons in Room 64 (data.js, ui.js, battle.js, state.js, hud.js, map.js, index.html, styles-base.css, styles-cinematic.css; tutorial.test.js, check-tutorial-drift.js)

The user: "start working on the tutorial… 1-3 scripted battle slices that
explain the main mechanics, then 5-10 optional tutorials… any future changes
made to these mechanics, the tutorial needs to be flagged for update…
available as a button on the main menu… completely optional… all of this
should take place in the training room… do the beginning training video
sequence as well". Token `20260913-hq1111-01-cors` → `20260913-tutorial-01-cors`.

- **The shelf (main menu → TUTORIAL, `#tutorialPage`).** THE ORIENTATION
  TAPE (▶ PLAY · THEN TAPE 1 / REWATCH), THE CORE (three tapes, in order),
  OPTIONAL READING (six, any order); every card FILED off
  `profile.door.tutorial` (data.js `tutorialProgress` / `tutorialMarkDone`).
  Nothing is filed as a match: no career, no achievements, no result
  overlay — a lesson ends itself with a LESSON COMPLETE card (NEXT TAPE /
  THE SHELF). In Room 64 the RANGE console grew ORIENTATION ▸ THE TAPE +
  LESSON 1 (`data-tutorial`, back to the console after) and LESSONS ▸ THE
  SHELF; the old free 4v4 is SPARRING now.
- **The tape (`doorTapePlay`, `#doorTape`).** Ten beats on drawn SVG slides
  — the film leader, the seal, PART 1 the corner (parallel lines vs the
  right angle and the door), PART 2 the round facility with its one square
  room, PART 3 the Entropy Wars (thresholds popping on a globe), PART 4 the
  vessels (four a side, eight by eight), PART 5 the turn (the clock, two AP,
  the weakness), PART 6 the three ways a crossing closes, PART 7 the Room 64
  card, then "please do not turn around" over three knocks — a typed caption
  per beat, the ident kit's power-on / tracking bar / OSD, SPACE next, ESC
  skip, prefers-reduced-motion honoured, crtOn in / vhsEject out.
  **The narration is a DRAFT (`TUTORIAL_TAPE.draft`)** — the user owns the
  tape's words (A11); the slides are keyed by `art` so the copy can change
  without touching ui.js. The scaffolding gags (A0) were NOT used.
- **The lessons (data.js `TUTORIAL_LESSONS`).** Each a scripted crossing:
  pinned races / jobs / tiles / spells for both sides, the initiative
  forced, the Department's dummies on a per-step plan, the player's verbs
  gated per step (the ladder reads LATER, a refused click nudges the coach),
  a goal the engine's own events satisfy. CORE 1 FIRST STEPS (move · the
  AP pips · attack ends the turn · range · their turn · the round · guard +
  overwatch · two moves / END TURN), CORE 2 THE PRESS (the six-type wheel ·
  SMITE on the unholy dummy → WEAKNESS +2 AP → the second cast · the grey
  RESISTS → −1 AP · the gauge filled for training · ⚛ ENTROPY, REVELATIONS),
  CORE 3 THE THREE WAYS OUT (Arena · a Key scanned with 🔍 INSPECT · the
  centre Nexus stepped + channelled to four · the Cube struck under SIEGE ·
  the wipe). Optional: THE HIGH GROUND (Room 404's risers), FOG &
  AWARENESS, FACING & OVERWATCH (the back arc, the reaction shot), ABILITIES
  & MP (a buff keeps the turn, one cast a turn), ITEMS, THE HOROLOGE (a tour).
- **The runtime (ui.js "THE TUTORIAL RUNTIME").** The spell lab's launch
  recipe generalised; hooks are one-liners guarded by `window._tutActive` in
  battle.js (the gates + `_tutEvent` reports at doMove / doAttack / doSpell /
  doItem / doInspect / doEntropyStrike / applyPressTurn / the Cube branch /
  the activation / runComputerTurn → `_tutCpuTurn`; checkWin blind), ui.js
  (doGuard / triggerEndTurn / channelNexus / chooseActionMenu), state.js
  (`buildBlitzTurnOrder` → `_tutTurnOrder`), hud.js (`_tutFilterBlades`, the
  `.tut` glow, `data-pid` on the pushers), map.js (`_hqReturnOrMenu` honours
  `_tutReturnPage`). THE COACH is a DOM card top-right (`#tutCoach`).
- **THE DRIFT REGISTER (`TUTORIAL_MECHANICS` + `check-tutorial-drift.js` +
  tutorial.test.js).** The user's rule made mechanical: every number a lesson
  states is a pin read from source; every rule function a lesson describes is
  fingerprinted; the type wheel and the arena row are diffed. A drift fails
  `npm test` naming the lesson; `--stamp` re-stamps after the re-read.
- **Tests.** tutorial.test.js (9): the register clean, teaches ↔ lessons,
  every `{{fact}}` resolves, the wheel, every lesson legal on the 8×8 (races,
  jobs, spells, tiles, verbs, goals, plans, equal sides), the arena / press
  lessons teach the real rules, the ledger, the wiring source-scan, one
  cache token. doorhq.test.js unchanged (the RANGE presets keep their shape).

**Could not verify here (RULE #1c — no playtest).** The coach card over the
HUD at 1280 × 720 (it sits top-right under the scoreboard, clear of the rig
and the dock — nudge `.tut-coach { top/right }` if it covers the objectives),
the tape's beat timings (all in `TUTORIAL_TAPE.beats[].ms`), the dummies'
pacing (`_tutCpuTurn` waits `actionMs(560)` then acts), whether SMITE on the
zombie always reads WEAK (bonusVsUnholy rides the damage, the press reads
the type tier — it should), the marksman's reach on the 8×8 (Sniper range 5
+ 1 — SCOPE shoots DUMMY B from the spawn row), the `visible` goal under fog.
First things to eyeball live: (1) the TUTORIAL button → the shelf; (2) ▶
PLAY → the tape → TAPE 1 boots into Room 64 with BLADE active and the coach
up; (3) MOVE greys everything else; the attack step's two clicks; (4) the
dummies' turn; (5) LESSON COMPLETE → NEXT TAPE; (6) THE PRESS: +2 AP after
Smite, the ⚛ pusher after the gauge fill; (7) the console in Room 64 → the
tape → lesson → back at the console.

**Next (in order):** the user's narration on the tape; a walkable tutorial
beat IN the room (the coach as a cast member is A15 — the voice stays
SYSTEM until the user writes it); Directive 1 / the lamination at the end
of TAPE 3 (plan 4.3's last clause); 4.1 the case-file screen.

### 2026-09-14 — the map-builder buildings in the landscape; the foliage everywhere
The user: use building_1..8 more in the urban maps' landscapes; the
Cyberpunk horizon's buildings read wrong; the Haunted House's background
trees were the weird ones; Bohemian Grove's walkable room stood the old
3D trees. Shipped (three-renderer.js only, + tests / docs): `_nrSpriteBuilding`
/ `_nrSpriteBlocks` (the board's building prism, stackable) in the
Cyberpunk / Strip / Downtown settings and on every `city` world rim;
`_WD_RIM.trees` → `_nrTree` (the foliage OBJs); `_hqBuildSiteBoard`'s board
trees → `_nrTree` on a bare kit (they were a trunk + a sphere — THE cause of
the grove's old trees in the room); the grove's redwood ring → tall
`_nrTree`s; `K._wdFog` + `_nrInjectWorld` so late fills join the haze;
`_hqTickWorld` polls `_nrPollPending` unconditionally. Unseen live: the
prisms' scale, the trim landing, the rim tree load on the Haunted House.

### 2026-09-14 — 7.4 ROOM 1 SHIPPED: RECEPTION becomes the intake office (data.js, three-renderer.js, map.js, index.html; doorhq.test.js)
The last 7.4 row that needed nothing from the user. The window door at
120° on the ground ring (between Occam's Barbershop at 105° and Your
Office at 150°) was a door straight to `_mountReactProfile`; it is now
the way INTO `rooms.reception`, an 8 × 6 box room with the hall's oxblood
dado carried inside and the plaster gone cream. The number `1` moved
onto the room (`hqDoorNo` reads it through the door's `action.room`; the
register lists one row, kind `room`).
- **THE INTAKE WINDOW** (counter `window`, the desk on the north wall,
  the clerk on the blue chair facing it) → `_mountReactProfile` — the
  profile IS the ID card (DOOR_DESIGN §3.1): the callsign and the desk
  are still edited there; nothing about the card moved.
- **THE LAMINATOR** (counter `laminator`, the second desk; the `laminator`
  tabletop proc — a beige body, the feed tray, a card half out of the
  slot with the SPACE stripe on it, the READY lamp always on) →
  `overlay: 'intake'` → map.js `_hqIntakeHtml`, which reads **data.js
  `hqIntakeCard(profile)`** (on `window`, beside `hqMedicalRecord`) =
  `{ onFile, status (NO FILE / NEW ISSUE / ON FILE), tone, note, empNo
  (doorEmployeeNo), callsign, desk { key, label, color, ink } | null
  (DOOR_TEXT.DESKS), clearance { level, title } (doorClearance), rank
  (profile.js getRankInfo when loaded), issued (createdAt as a date),
  photo (the mirror's look, else hqAvatarLabel of the chair's pick),
  visits, days (the punch clock), reissues (door.hq.cuts + a look on
  file), fee (HQ_LOST_CARD_FEE 86), feeCharged (0, always), serving /
  ticket (the two halves of the employee number), queue (their gap) }`
  — the ONE read for the sheet and the dispenser.
- **NOW SERVING** (counter `ticket`, `action: {}` — `_hqCounterPanelHtml`
  renders its panel by id): the `now_serving` wall proc over the desks —
  a black housing, `NOW SERVING` + three red digits on a lit plane
  (`_hzTextTex`, keyed by the digits; the sign reads the ACTIVE profile's
  `hqIntakeCard` at build, `000` without one), the green lamp, and the
  steel dispenser under it with a paper tongue out. The panel: NOW
  SERVING (the sign), YOUR NUMBER (the second half; NO CARD without a
  profile), AHEAD OF YOU (the gap — "YOU ARE BEING SERVED. NOBODY HAS
  SAID SO." at 0), SIGN IN AT THE WINDOW ▸ PROFILE, WAIT.
- The room: the queue lane (three `railing_1m` between the door and the
  desks), four folding chairs along the south wall with a magazine older
  than the chair, the low table with the forms you take a number for,
  two filing cabinets and the FORMS, MISC box on the east, the notice
  board, the cooler, the security camera over the window (the door-kit
  batch), the rug at the way in, two fluorescents. Agents: THE INTAKE
  CLERK (seated), THE GUARD (arms folded by the door), THE NEW HIRE
  (seated, holding number four; they are serving number four). One
  native waits on the first chair. Four overheard lines.
- The hall's intake wedge at 128° (Rhonda's misfiled paperwork, Kit's
  chair) is untouched — it is the window from the hall side; the test
  insists it stays.
- **Tests** (doorhq.test.js, three new): the room (the door in and out,
  the number on the room not the door, the three counters over their
  desks / sign, the two procs' catalogue rows, the build sheet, the
  seated clerk and new hire, the register row), the sheet (`hqIntakeCard`
  with no profile / a fresh file / a file with matches: the employee
  number is the card's, the halves rejoin it, the desk row, the fee never
  charged), the source sites (the overlay dispatch, the ticket panel, the
  procs, the label, the modal map, the window export). `npm test`: 997
  pass, 0 fail, 4 skips.
- **Unseen live (RULE #1c)**: the sign's digits at 2.15 m over the desks
  (legible from the door?), the laminator's scale on the tanker desk, the
  queue rails' facing (`railing_1m` at face 0 runs along x — if it stands
  crosswise, `face: 90`), the guard's spot against the wet-floor sign
  that moved to the east side.
- **Still open in 7.4:** 4C + 8 (Executive, behind the elevator's L4
  gate — waits on 5.4), the Fourier Foyer (waits on 7.2's
  spawn-in-the-foyer decision). Every other 7.4 row is shipped.
- **Delivery:** `ENTROPY_WARS_HQ_ROOM_1.zip` — data.js,
  three-renderer.js, map.js → R2; index.html
  (`?v=20260914-hq-room1-01-cors`) → Render; doorhq.test.js, this file,
  DOOR_MASTER.md, CLAUDE.md → the repo.

### 2026-09-14 (rev 4) — 5.5 H-WING STAGE 1 SHIPPED + THE DOOR THAT OPENED THE SETTINGS (data.js, three-renderer.js, map.js, index.html; hq-floors.test.js, hwing.test.js)

**The bug first.** "Entering any room now just opens the pause menu." Root
cause, read from the code: `_hqEnter` (three-renderer.js) re-parents the
shared canvas into the HQ host on EVERY entry — `host.appendChild(canvas)`
— and appendChild on an element that is already the host's child removes
it and re-inserts it; a pointer-locked element removed from the document
loses its lock, and the browser fires `pointerlockchange`. Before Phase 8
that loss was harmless (the walk re-grabbed the lock on the next gesture).
Since C-28 (rev 3, yesterday) a lock loss the game did not ask for IS the
ESC the browser ate → `onEscape` → the settings. So every door, every
room. Two fixes, both in the renderer: the canvas and the CSS2D layer are
appended only when their parent is not already the host (the lock now
survives a door as the `_hqKeepLock` comment always claimed), and the
room-to-room swap stamps `_hqRebuildAt` so a lock loss inside 2.5 s of it
is never read as an ESC (belt and braces: a browser that drops the lock
on the scene teardown anyway). The C-28 line itself is untouched;
hq-floors.test.js still pins it and hwing.test.js pins the two fixes.
Unseen live (RULE #1c) — the user walks a door and does not get the
settings.

**H-WING.** The user: "let me know how far away we are from building
H-Wing … we are building the game as if it is end game, with everything
already open and unlocked … let's just get it built." Answer: it was one
session away and it is built — as Phase 8 rooms, since that is what the
plan's 5.5 kit now is (a box room, a shell of terrain keys, procs, doors).
Canon honoured (MASTER A0 #4 / #8, A6): beneath the facility, ONE straight
section, right angles, beige carpet, fluorescents, cubicles, many doors,
older and more stable than the rotunda, the Backrooms beyond it (C-12),
the fractal repeat. The shape is an H — two 48 m legs and a 12 m bar:

| Room | What is in it | Doors |
|---|---|---|
| H-WING (`hwing_lobby`, 8 × 6) | THE FLOOR PLAN (a by-id panel: an H drawn in monospace, the dot moved), a cooler, plants, blank plates, the honest EXIT sign over the stair | THE STAIR (s) ⇄ the garage's new `p2` door on its west wall; ELEVATOR (e) → the car (it comes; H is on no button so it never stops here on its own); THE CORRIDOR (n) → the west leg |
| H-WING · WEST (`hwing_w`, 3 × 48) | eight fluorescents (two flicker), blank plates by every door, two clocks that agree, a damp patch, one level picture, a dead camera | the lobby (s); four AN OFFICE doors; THE CROSSBAR (e, z 0); **EXIT** (n, `leaf_exit`) → `site_prebuilt_backrooms@hwing` |
| THE CROSSBAR (`hwing_bar`, 12 × 3) | the coat rail and the mat by HOME | WEST (w), EAST (e); **HOME** (n, `leaf_suburban_house`); THE TYPING POOL (s, glass); THE BREAK ROOM (s) |
| H-WING · EAST (`hwing_e`, 3 × 48) | the mirror of the west: the same chair facing the wall, the same picture on the other wall | THE ROOM AT THE END (s, `leaf_cell`) ⇄ `deadend`'s new **secret** west wall; four AN OFFICE doors; THE CROSSBAR (w); **H-WING** (n) → `hwing_w@lobby` — the corridor repeats |
| AN OFFICE (`hwing_office`, 5 × 4.5) | the tanker desk, the CRT, the phone, two cabinets, the clerk (“Which office is this?” “This one.”) | ONE door → `hwing_w@office_1` — the way out is the first door whichever of the eight you came in by |
| THE TYPING POOL (`hwing_pool`, 12 × 9) | six `square_cubicle`s, the online shift at them (`onlineSpots` ×6 — the same shift as 9-5 upstairs), the supervisor on the phone, an EXIT sign over a wall | THE CROSSBAR (n) |
| THE BREAK ROOM (`hwing_break`, 6 × 5) | the machine, a fridge, the table and three molded chairs, the microwave and the coffee maker on a steel table, a radio, a WORLD'S BEST mug | THE CROSSBAR (n) |
| HOME (`hwing_home`, 4 × 7) | `house_stairs` up to the ceiling against the east wall, three pictures, the hook rail, the hall table with the rotary phone (counter `phone`: RINGING · ANSWER disabled), a bulb with no shade, a stopped clock; its own carpet + wallpaper, dim | THE FRONT DOOR (s) ⇄ the bar; THE KITCHEN (n) → `hwing_home@hall` — opens onto the front door |

Rules that came with it: **`DOOR_HQ.siteRooms.backDoors[mapId]`** — a
second door on a generated site room, appended by `hqSiteRoom` after the
way in (the Backrooms' `hwing` EXIT on the south wall at x 6; the
renderer's `_hqBuildSetting` now keeps EVERY room door's lane clear of
the setting, not only the way in); a `room` door is never gated by the
sector lock (`doorSiteState` → open), which is exactly C-12: Bay 6 stays
sealed and H-Wing is the other way to Room 90. **The wing's plain leaf
is `leaf_coffee`** — the first cut used `leaf_hollow_core` and doorhq's
rank-leaf test refused it (it is L2's, exclusive). Every room is
un-numbered (the register skips the wing; `hqRoomNo` reads ''),
`hqHWingRooms()` / `hqHWingEntries()` list it. Two procs in the Phase 8
block: `square_cubicle` (three fabric partitions in a U, the desk, a
beige CRT, the chair; rect 2.0 × 1.8) and `house_stairs` (eight
carpeted treads, stringers, newel, rail; ends at 2.4 m). Two by-id
panels in map.js `_hqCounterPanelHtml`: `wingplan`, `phone`. The
hq-floors secret-door test moved 5 → 6 (`deadend→hwing_e`). `npm test`
runs `hwing.test.js`.

**Open (the user's calls):** the gates (where and at what rank — the two
entrances and the site room's back door carry no `minClearance` today);
what waits inside HOME (A14 Q5 — the hallway is a draft, the phone's
ANSWER is disabled on purpose); whether the wing gets the Tesseract (4D,
held) at its far end; the room lines are Claude's drafts (A15). Unseen
live (RULE #1c): the fluorescent tone on beige carpet, the square
cubicles' scale beside the round ones, the stairs' pitch against the
ceiling, the two secret walls in a 3 × 3 room, the EXIT lane through the
Backrooms' partitions (`_hqBuildSetting` culls it — eyeball that the
door is reachable), the suburban leaf as HOME's front door.

### 2026-09-14 (rev 3) — PHASE 8 STAGE 1 SHIPPED: THE EXPLORATION FLOORS — the car, three floors, the undercroft, five secret doors, one home per function, the pause (data.js, three-renderer.js, map.js, battle.js, ui.js, index.html; doorhq.test.js, door-kit-batch.test.js, hq-floors.test.js)
The user's brief, in one session: too many places open the same screen
("how many different places bring up the profile card? Totally
unnecessary"), the pause button cannot be pressed while the mouse aims,
and the building should grow — floors, hallways, elevators, secret
passages, shortcuts, a maze, fifteen named rooms, each its own vibe, and
landmarks that pull you down a path. The audit first: the ID card opened
from FIVE places (Reception's window, and YOUR CARD buttons on the
promotion panel, the barber's, the in-tray's and the corner office's
window); the achievements from two (Room 111, 4C's plaques); the
leaderboard from three (the hall's board, Room 86's notice board, the
pool's ranking); the shop from two (the Quartermaster, Room 86's till);
Challenge from two (Medical's desk, the Training Room's south door); the
case file from two (101 and 4C). Phase 8 (§4) is the plan; this is stage 1.
- **ONE HOME PER FUNCTION (C-27).** data.js: Room 86's `notice` is a
  panel (`action: {}` — Form 365's lines + three notices) and its `till`
  is gone (the register stays a prop); the after-hours `notice` / `bar`
  are panels (the bar is a menu); 4C's `intray` counter is gone (the desk
  stays) and its `plaques` are a panel (the count + "the cabinet is Room
  111"); Room 8's `ranking` is gone (the board stays a prop); the
  Training Room's `challenge` door is `stairs` (down to B). map.js: the
  four YOUR CARD buttons and the edge panel's leaderboard button are
  gone. hq-floors.test.js counts homes.
- **THE PAUSE (C-28).** three-renderer.js: `p` in `_hqKeyName` → the
  same as ESC (`onEscape`); `_hqOnLockChange` watches for a LOSS of the
  lock (`_hqHadLock`) that the walker did not request (outside
  `_hqLockStaleAt`'s 2.5 s, not paused — `setPaused(true)` releases the
  lock itself before the event) and calls `onEscape` on the next tick.
  battle.js (Strike Mode): `_strikeLockReleasedAt` stamps the mode's own
  releases (`_clearInput(true)`, the mode-end release); the
  `pointerlockchange` handler opens the pause menu on a loss outside
  that 1.5 s. ui.js: `P` toggles the pause menu in a battle (never in an
  input; closes it too). index.html hints: "ESC / P settings".
- **THE CAR.** The mezzanine `elevator` door → `{ room: 'car', at:
  'panel' }`, ungated; `DOOR_HQ.elevator.stops` (PH · 3 · M · G · B, PH
  with the old `minClearance: 4, requiresKeys: 12`); data.js
  `hqElevatorStops(profile, fromRoom)` judges each stop through
  `doorSiteState` on a synthesized door; map.js `_hqFloorPanelHtml`
  draws it for the car's `panel` AND the penthouse's `floorpanel`;
  `_hqGoRoom` stamps `window._hqCarFrom` on the way in. The penthouse's
  car door leads into the car too.
- **THE ROOMS** (§8.2's table; data.js, the block after the Training
  Room, ~1,500 lines) with their doors, props, agents, spots and lines
  (Claude's drafts, A15). The Cafeterium grew a `kitchen` door on its
  north wall at 4.6 (the rail, the clock, the vent and the boxes moved
  for it); IT grew a `server` door on its south wall at 0.3 (the sign
  and the bin moved). Every new door wears a plain leaf — the six rank
  leaves are exclusive (doorhq.test.js), so the service doors are the
  closet, the white / beige / birch / coffee / orange wood leaves.
- **THE PROCS** (three-renderer.js, `Object.assign(_hqProcBuilders,
  {…})` before `_hqProcProp`, 44 builders): `car_panel`, `shaft_window`
  (a canvas of landings, scrolled by a ticker), `concrete_pillar`,
  `parking_bay`, `parked_car` (the Sedan — `getRace3DModel('honda
  civic')`, five tints), `garage_ramp` (the slab, the daylight plane,
  the arm, LOT FULL), `roller_shutter`, `kitchen_range`, `range_hood`,
  `pot_rack`, `meat_hook`, `washer` / `dryer` (one builder), `laundry_
  cart`, `flicker_tube` (a ticker on a seeded pattern), `bare_bulb`,
  `boiler`, `cell_bars`, `wall_chains`, `stocks`, `wall_torch` (a cone
  flame that gutters), `candle_ring` (thirteen), `ritual_circle` (a
  canvas sigil), `stone_altar`, `floor_stain`, `floating_orb` (bobs,
  turns, breathes), `chalkboard` (the type wheel written from
  TYPE_CHART), `lectern`, `riser_1/2/3` (0.3 m steps the walker climbs),
  `school_desk`, `toilet_stall`, `urinal`, `sink_row`, `hand_dryer`,
  `locker_bench`, `shower_stall`, `lap_pool` (six lanes, ropes, blocks),
  `lifeguard_chair`, `garden_ring` (the hedge registers its own
  blockers — place it at 0,0), `fountain`, `park_bench`, `garden_tree`
  (`_nrTree` on a bare `_nrKit`, the site boards' recipe; a proc trunk
  if it throws). New placer rules: catalogue `light` → a PointLight on
  the prop (`HQ_PROP_LIGHT_MAX` 10); a placement's `rect: false` refuses
  the catalogue rect (a bench turned 90°); `_hq.tickers` run in
  `_hqTickWorld`; `mood.ambient` scales the box fill; `shell.strips:
  false` drops the fluorescent strip.
- **SECRET DOORS** (`_hqBuildDoors`): `door.secret` → no leaf / lamp /
  plate / surround, the jambs + lintel + a swinging slab in `wallMatS`
  (the shell's wall, `wallColor`-tinted) and `dadoMatS`, the cap / sill
  / frames hidden, the leaf group flush with the wall face. door-kit-
  batch.test.js's surround regex learnt the `secret ? null :`.
- **Tests.** doorhq.test.js: the elevator gate reads the PH stop; a
  torch / bulb / tube / candle / orb room counts as lit; the training
  stair; the Keys test includes the stops; Room 86, the variant, the
  executive floor, 4C, Room 8 and the source sites updated. New
  `hq-floors.test.js` (10 tests): the rooms and numbers, every landing,
  the car and the stops, the secret doors, the loops, ONE HOME PER
  FUNCTION, the procs / lights / rects / the sedan / no utility box,
  the secret door's renderer, the pause in all four files, the by-id
  panels. `npm test`: 1030 pass, 0 fail, 4 skips.
- **Unseen live (RULE #1c):** everything — the car's panel at 1.1 m, the
  shaft texture's scroll speed, the ramp's daylight plane against the
  sodium light, the Sedan's fit at 1.42 m in five tints, the orb's glow
  against a metal room, the hedge's blockers (walk the ring), the risers
  as steps (HQ_STEP_TOL 0.62 — three 0.3 m steps), the secret slab's
  seam, the torches' cone flames, the chalkboard's text at 1024 px, the
  garden's foliage OBJs landing, the P key against any hud hotkey, the
  lock-loss pause on Firefox (its ESC handling differs from Chrome's).
- **Delivery:** `ENTROPY_WARS_HQ_FLOORS.zip` — data.js, three-renderer.js,
  map.js, battle.js, ui.js → R2; index.html
  (`?v=20260914-hq-floors-01-cors`) → Render; doorhq.test.js,
  door-kit-batch.test.js, hq-floors.test.js, this file, CLAUDE.md,
  MODEL_INDEX.md → the repo.

### 2026-09-14 (rev 2) — 5.4 STAGE 1 + 7.4 ROOMS 4C + 8 SHIPPED: THE PENTHOUSE — the elevator rides (data.js, three-renderer.js, map.js, index.html; doorhq.test.js)
The last two 7.4 rows waited on 5.4's elevator; the elevator door on the
mezzanine had pointed at a room called `executive` since 2026-09-03 and the
panel said INTERIOR NOT YET BUILT. Now it rides. Not the plan's third
rotunda — one floor, one lobby, two rooms; the rings stay open.
- **THE PENTHOUSE** (`rooms.executive`, no number — it is a floor; the
  register skips it): a 9 × 6 box room in a claret carpet under cream
  plaster. The way in is the egress elevator (its gate — KEYHOLDER + 12
  Keys — unchanged; the door gained `at: 'elevator'`), the way down is
  the car on the lobby's south wall (`proc: 'elevator'` on a box-room
  door — the procedural leaf's branch never cared which room kind it
  stood in; the halves pocket as in the hall), never gated. **THE FLOOR
  PANEL** (counter `floorpanel`, `action: {}`; the `floor_panel` wall
  proc beside the car — a brass plate, sixteen buttons in two columns
  with the legend beside each, M and PH lit amber) → a panel: the floors
  as chips (the two that work lit), `M ▸ DOWN` = a `data-room` button to
  `central_egress` at the elevator, `PH ▸ YOU ARE HERE` closes it; the
  note says there is no 13. The assistant at the tanker desk (seated),
  the Director's guard by the corner office door, two teal chairs and the
  annual report on the coffee table, the cooler, the files, a native
  waiting for a meeting that is not on the panel. Four overheard lines.
- **ROOM 4C · THE CORNER OFFICE** (`rooms.corner`, 6.4 × 5.2, a brown
  carpet, cream plaster, a walnut dado): the executive-glass door on the
  lobby's east wall (§5.6's leaf), the way back the same leaf. **THE
  IN-TRAY** (counter `intray`) → `overlay: 'intray'` — the closet's
  case file, the same sheet, on the new `exec_desk` proc (a walnut slab
  on two pedestals with drawers, a leather inlay, a brass rail; top at
  0.76 so every desk prop sits where it does on a tanker desk) with the
  `exec_chair` (a high leather back on a five-star base) behind it.
  **THE PLAQUES** (counter `plaques`) → `_mountReactTrophies` — the
  profile on its Achievements tab, as Room 111's cabinet; two
  `wall_plaques` procs on the south wall (four rows of three walnut
  shields, the first `hqTrophyCount().lines.length` gold, read once at
  build). **THE WINDOW** (counter `view`, `action: {}`) → a panel: a
  corner office has two outside walls, the building is round — the view
  is the seven bays, one row per bay in bay order with `hqSiteMastery`
  summed over its thresholds (`done / total`, the chip green when the
  bay is stabilized); two `false_window` procs (north + east: a walnut
  frame, a pale pane with a horizon and a sun, blinds half drawn). The
  requisitioned mini fridge from the closet, two visitor chairs, the
  globe lamp, the files. **The closet stays yours**: Room 101 is
  untouched and its door is still the rank door; 4C's is not (the test
  insists on both). No agents — it is your office.
- **ROOM 8 · THE INFINITY POOL** (`rooms.pool`, 12 × 9): the FIRST
  hand-authored OPEN room — `shell.open` + `edge: 'low'` (the 7.2
  stage-3 / EDGE shell: no ceiling, a knee-high parapet in the marble
  sheet, the apron running 16 m out past it) with `shell.sky` set BY
  HAND to Heaven's `env` row (tint 0xfff3d0, the cream fog, the
  `divine` roster, `night: 0`; doorhq.test.js diffs the three against
  `EW_MAP_META` so the row cannot drift) and `apron: 'cloud_2'` — the
  cloud plain runs out under the parapet over the void. The shell reads
  terrain sheet keys (`tilefloor_2` floor, `marble_light` parapet) like
  every outdoor room. **THE POOL** = the `infinity_pool` proc against the
  north parapet: a raised basin 6 × 3.6 (marble coping on three sides, a
  WEIR on the far side a hand lower than the water, the water a
  translucent Phong sheet at the coping with a fall over the weir and a
  glint line, the tile bed, the ladder, two coping lamps) — and the
  first prop with a **RECT blocker**: catalogue `rect: { hw, hd }`
  (metres, room axes — place it at `face` 0 / 180) is passed through at
  both prop-blocker sites in `_hqPlaceProps`, and `_hqBlkContains`
  already honoured `b.rect` (the site rooms' walls use it). Six
  `pool_lounger`s (slats on a tube frame, a towel over the foot; the
  seat at 0.42 for `hqSit`), two `pool_umbrella`s (eight cream / blue
  panels tilted to the sun), three palms and a globe lamp at the
  corners, the shell's four point lights over them (an open room has no
  fluorescents), the wet-floor sign, the towels on a hook rail. **THE
  EDGE** (counter `edge`, `action: {}`) → a panel: the void (∞), ON
  BREAK = the punch clock's streak (`hqPunchClock`: day N of the streak
  · best; LAPSED when it is), ON THE BOARD = the engraved count, THE
  RANKING ▸ LEADERBOARD. **THE RANKING** (counter `ranking`, the notice
  board standing on the south parapet) → `_mountLeaderboard`. THE TOP OF
  THE BOARD sits on the south lounger, THE LIFEGUARD stands at the
  basin with her arms folded (certified for the pool, not the edge),
  one native on break, three `onlineSpots` on the loungers (Room 86's
  rule: one silhouette per online player). Nobody stands in the water
  (the test checks every person and floor prop against the rect).
- **map.js**: three by-id panels in `_hqCounterPanelHtml` (`floorpanel`
  / `view` / `edge`) before the cabinet's; nothing new in
  `_HQ_FN_LABELS` / `_HQ_MODAL` (the trophies and the leaderboard were
  already mounts). The lobby's "GO THROUGH" on the egress elevator panel
  now works because the room exists (`_hqRoomExists`).
- **Tests** (doorhq.test.js, four new): the ride (the egress door, its
  gate, the car, the two doors and their ways back, the number on each,
  the floor panel, the sixteen floors without 13, the eight procs, the
  build sheet, the seated assistant, nothing in three doorways, the
  register skipping the lobby), 4C (the in-tray's overlay equals Room
  101's, the plaques, the two windows, the desk props at 0.76, the
  blockers, the rank door still the closet's), Room 8 (open + low +
  Heaven's env diffed, the terrain sheet keys, the rect blocker at least
  the basin's size and inside the parapet, the loungers / umbrellas /
  palms, the two counters at their props, the online shift on the
  loungers, nobody in the water), the source sites (the three panels,
  the eight procs, both rect pass-throughs, the walker's rect test). The
  pool test reads the terrain sheet keys off sprites.js's source
  (`EW_TERRAIN_COLORS` lists no `tilefloor_2`; the renderer's `_hqTex`
  reads `TERRAIN_SPRITES`). `npm test`: 1020 pass, 0 fail, 4 skips.
- **Unseen live (RULE #1c)**: the pocketing car doors on a box-room
  wall, the pool's water sheet against the marble (a plain Phong — if it
  reads flat, `_buildFluidTopMat` is the upgrade), the divine roster
  hung round a 12 m room, the umbrella's canopy against the sky's
  light, the plaques' gold count on a profile with achievements, the
  floor panel's legend size at 1.0 m.
- **Still open in 7.4:** the Fourier Foyer only (waits on 7.2's
  spawn-in-the-foyer decision — TAKEN and SHIPPED 2026-09-15, §9). Every numbered 7.4 row is shipped. 5.4's
  rings as rotunda instances are not built and are not needed for any
  numbered room.
- **Delivery:** `ENTROPY_WARS_HQ_EXECUTIVE_FLOOR.zip` — data.js,
  three-renderer.js, map.js → R2; index.html
  (`?v=20260914-hq-executive-01-cors`) → Render; doorhq.test.js, this
  file, DOOR_MASTER.md, CLAUDE.md → the repo.

### 2026-09-15 rev 19 — 9.5 REV 2: THE DOOR GUN TAKES ANY SURFACE
The user's brief, in full: the gun places a door on whatever surface it is
aimed at (floor · WALL · CEILING), the door lies FLAT in that surface's
own plane, two buttons place the two thresholds separately, and the pair
is always two colours.
- **The aim** (three-renderer.js `_hqPortalAim(slot)`): three surface
  kinds off one ray march — the room's ceiling plane (`_hqPortalCeil`: a
  box room's `shell.h`, a bay's `wallH`; an open room / the dome have
  none), the walkable floor set (`_hqPortalSurf`), and the WALL, bisected
  by `_hqPortalWallHit` with the normal read off the solidness gradient
  (`_hqPortalSolidAt`) either side in x and z. `_hqPortalFits` carries the
  footprint rule per kind. A ceiling is never refused for being overhead,
  and the twin gap is 3D — floor under ceiling is a COLUMN, the point of
  the whole thing.
- **Flat on the surface**: `_hqPortalBasis(face, surf)` (local +Z = the
  surface normal, local +Y = the door's up) → the frame's quaternion. The
  WALL case reproduces the old `rotation.y` exactly (verified headlessly
  against real three), so a standing door is unchanged; a flat door drops
  its sill / cap / seal, keeps its leaf standing open and lays NO
  blockers.
- **The crossing**: `_hqTickPortalCross` (feet for a floor hatch, head for
  a ceiling one) → `opts.onPortalCross` → map.js `_hqPortalStep`;
  `_hqPortalHop(slot, opts)` leaves along the twin's own normal carrying
  the entry speed (clamped 2–18 m/s), and the mouth you came out of is
  HELD until you leave it. Headless simulation with the shipped numbers:
  a floor hatch at 0 under a ceiling hatch at 2.7 m is a fall that never
  lands, terminal in ~1 s, ~30 crossings/s — so map.js throttles the
  crossing's SFX to one per 260 ms.
- **Two buttons / two colours**: LEFT CLICK = A, RIGHT CLICK = B (F / Q
  holster); the slot rides `spec.slot` into data.js `hqPortalPlace`, so a
  named slot moves its own row and never blocks itself.
  `HQ_PORTAL_COLORS` (A cyan, B amber) paints the frame tint, both jamb
  lamps, the mouth glow and the new APERTURE pane; `HQ_PORTAL_RULES`
  gained `surfaces` / `colors` / `colorNames` / `buttons`, the plate wears
  `.hq-plate-portal-a` / `-b`.
- **Tests**: `hq-portal.test.js` 11 tests (3 new). Full suite 1367 pass /
  0 fail / 4 skips.
- **Delivery:** `ENTROPY_WARS_DOOR_GUN_SURFACES.zip` — three-renderer.js,
  data.js, map.js, styles-base.css → R2; index.html
  (`?v=20260915-doorgun-surfaces-01-cors`) → Render; hq-portal.test.js,
  this file, CLAUDE.md → the repo.
- **Unseen live (RULE #1c):** all of it — the ghost on a wall and a
  ceiling, the aperture's brightness, the open leaf lying in the floor,
  the fall's speed in a tall room, a wall door's drop to the floor, and
  the two colours against each room's own light.

### 2026-09-16 — THE VISUAL PASS: backwards desks, floating props, the sideways train, the half-size cars (three-renderer.js, data.js, index.html; hq-visual-pass.test.js, playtest_hq_offline.js)

The user's second look at the building: "people sitting at backwards desks, items
floating off desks in the air, food trays floating off the counter, the subways
turned sideways, the vehicles too small on their maps." Every one of those was a
CONVENTION the placer assumed and nobody measured. Four rules replace the guesses:
- **THE KIT TILE** (three-renderer.js `_hzKitTs` / `_hzKitTile()`): every misc-kit,
  door-kit and vehicle helper sized itself against `CONFIG.tileSize` — the BATTLE's
  tile (58 px on the menu). A walkable site room builds its setting at ITS tile
  (1.75 m × 73 = 127.75), so every vehicle, utility box, rover, lander and palm in
  a site room landed at ~45 % of its size. `_hqBuildSetting` sets the kit tile
  round the near builder (try / finally); `_hzMiscKit` / `_hzDoorKitGLB` /
  `_hzVehicleProc` / the beacon read it first. Measured offline (the stand-in
  boxes at the room's tile): the Downtown SUV is 4.91 m long in the room now.
- **THE VEHICLE TURN** (`_VEHICLE_KIT` `yaw: Math.PI / 2` on all nine; catalogue
  `car_*` rows `turn: 90`): the batch shipped as "nose +Z" and the subway lay
  ACROSS the tunnel's track. Every long Meshy piece this project has measured
  lies along X with its front at −X (the cannon, the rowboat, the wreck, the
  crane, the skateboard), so the whole batch turns +90°. UNMEASURED (RULE #1c —
  the CDN is blocked from the sandbox): a nose that lands backward is `-π/2` on
  its kit row / `turn: -90` on its catalogue row — one field.
- **THE FRONT OFF THE MESH** (`_hqAutoFrontYaw(inst, mode)`, catalogue `front`):
  a GLB's facing is MEASURED off its own vertices once it lands — `'back'` (every
  chair and couch: the backrest is the centroid of the band above 62 % of the
  height; the front is the other way) or `'open'` (the round cubicle: the side
  band with the least geometry between desk and partition height is the
  opening) — and the instance is turned so that front is local +Z, the placer's
  contract, snapped to 90°. Verified on synthetic chairs / cubicles facing all
  four ways with real three r128 (hq-visual-pass.test.js). The cubicle floor's
  rows now say which way the mouth points (`face` 180 north row / 0 south row)
  and the shift sits AT the mouth (z ±0.85 / 0.95, chairs = spots).
- **THE TABLETOP SEAT** (`_hqSeatTabletops` / `_hqSeatLater`, `_hq.tabletops`):
  a raised small prop (`y` ≥ 0.25, `foot` ≤ 0.35, not a wall / ceiling prop) is
  registered and, once the furniture has landed (procs at once, GLBs as they
  arrive, debounced), a ray from 0.45 m above its authored height finds the
  nearest surface within ±0.3 m and the prop drops / lifts onto it — a desk top,
  a tray rail, a shelf; never the floor, never a shelf a metre off. `EW_HQ_DEBUG`
  logs the rows that have NOTHING under them (the offline probe prints them).
- **THE ROOMS RE-LAID**: Room 86's serving line is a real `serving_line` proc
  (a 3 m stainless counter: hot wells under warm lamps, a sneeze guard on chrome
  posts, THE TRAY SLIDE at 0.85 m on three tube rails; two runs; the trays ON the
  slide — they were four tanker desks with the trays typed 0.55 m in front of them
  in the air); Room 4C's `exec_desk` is CENTRED and a FLOOR prop with the
  drawers on the Director's side and the modesty panel to the room (it was built
  0…D as a wall proc, so it stood half a metre out with its drawer pulls toward
  the visitors, and the two visitor chairs faced the door — they face the
  Director now); Room ?'s clerk sat in FRONT of a wall desk facing the room with
  the found things typed at her chair — the desk is a floor prop across the
  room, the clerk behind it, the things on it, the claims counter on the
  visitors' side; the orphans typed past their desk's end (the foyer lamp and
  mug, the Bureau's phone and lamp, the H-Wing office, the break room's radio,
  the dream lab's clipboard, Records' shelf overflow) moved onto their furniture.
- **Screenshots (offline)**: `playtest_hq_offline.js` (repo tooling — the
  CDN is blocked from the sandbox now: libs from node_modules, stand-in
  textures, GLBs 404, `--nogltf` = the kit's procedural stand-ins) photographed
  the serving line, the executive desk and the claims desk; the vehicle stand-in
  measured in the Downtown room. The GLB chairs, the cubicle, the cars and the
  train themselves are UNSEEN (RULE #1c).
- **Tests**: `hq-visual-pass.test.js` (6); doorhq.test.js's cafeteria list and
  corner-office rows updated. Full suite green.
- **Delivery:** `ENTROPY_WARS_HQ_VISUAL_PASS.zip` — three-renderer.js, data.js →
  R2; index.html (`?v=20260916-hq-visual-pass-01-cors`) → Render;
  hq-visual-pass.test.js, doorhq.test.js, playtest_hq_offline.js, this file,
  MODEL_INDEX.md, PLAYTEST_NOTES.md, CLAUDE.md → the repo.
- **Unseen live (RULE #1c):** the measured chair fronts on the real Meshy chairs
  (a chair with arms as tall as its back would read as symmetric and stay as
  placed), the round cubicle's opening, every car's nose, the train arriving
  nose first, the serving line's chrome under the real sheet, the seat pass on
  the span-fitted tables.

### 2026-09-16 — PHASE 9 DELIVERY 1 · THE LEDGER + THE OPEN EDGE + THE WORKS WEAR THE KIT (rev 65, local delivery)
PHASE9_QUALITY_PLAN.md §9's Delivery 1 and two rules of the user's, in one zip.
- **B1 THE STABLE TAPE ID** (data.js `DOOR_TAPES`): `id` = `<sheetKey>#<slot>`,
  `num` / `no` the display number recomputed per build; `hqTapeLegacyId` /
  `hqFindLegacyId` migrate a positional claim on every read (`hqFindsRecord`).
  The shelf prints `num`, files `id`. Adding a site never renumbers a shelf.
- **B2 THE LEDGER**: `progress.hq.finds.taken` rides the synced blob
  (`mergeProgressBlobs`: union, `true` beats a date, the later date wins,
  `FIND_RE`, cap 4000); `hqCollectFind(…, { serverPays })` writes both records
  and leaves a server account's wallet alone; map.js `_hqTakeFind` schedules
  the push; server.js pays each newly-merged `pay:` claim once through data.js
  `hqFindsSyncPay` (on the first sync too); profile.js folds the local record
  into the blob on every `profileLoadProgress` and exports
  `scheduleProgressSync`. A profile without a v2 blob never gets one invented.
- **Hardening**: `_hqEncounterRun.armed` — battle.js `startMatch` spends it on
  its own launch and drops a stale marker on any later match.
- **B3 copy**: map.js `_hqEncounterBoardCopy(board)` — THE SITE IS THE BOARD
  from a complex part or a cave chamber.
- **THE OPEN EDGE** (the user: "battle rooms that are areas outside should not
  have walls"): `hqSiteRoom` reads an open shell's `edge: 'walls'` as `'open'`
  — the Stadium, Camelot, Cyberpunk, Babel, Agartha, Hollow Earth, the Strip
  and Downtown stand in the open; the eight shells keep their `edge: 'walls'`
  text as history only. The `'low'` field wall stays on Stonehenge, Göbekli
  Tepe and Flat Lands (one line in `hqSiteRoom` drops it too if wanted).
  doorhq.test.js refuses `'walls'` on any open site room; hq-world's Camelot
  line reads the room's edge.
- **THE WORKS WEAR THE KIT** (the user: "the doors in the works need to be the
  GLB doors, not procedurally generated ones — visual consistency"):
  three-renderer.js `_hqWorksLeaf` clones a catalogue leaf (`_HQ_WORKS_LEAVES`,
  16 plain wooden / glass leaves — the same files the building's doors wear,
  never a rank leaf) through `_miscModelInstance` + `_hqPropMatPick`, fitted to
  w × h on its bottom edge facing +Z; `_hqMiniDoor` is the hidden stand-in
  until the file lands. The belt (4), the gripper (1), the pallet (6), the
  furnace (1), the vine (6 at 0.2 m), the shelf (1 at 0.26 m). MODEL_INDEX §9.
- **Tests**: hq-finds.test.js (+ THE LEDGER, 9), achievements.test.js (the
  export + the server wiring + the merge shape), hq-stage2.test.js (the kit
  leaf guard), doorhq / hq-world (the edge). Full suite 1439 / 0 / 4 skipped.
- **Delivery:** `ENTROPY_WARS_PHASE9_LEDGER.zip` — data.js, three-renderer.js,
  map.js, battle.js, profile.js → R2 (data.js → Render too: server.js runs the
  merge off it); server.js, index.html (`?v=20260916-phase9-ledger-01-cors`)
  → Render; the five tests + this file, PHASE9_QUALITY_PLAN.md, MODEL_INDEX.md,
  CLAUDE.md → the repo.
- **Unseen live (RULE #1c):** the eight open rooms without their walls (the
  link doors, the wardrobe and the back doors stand alone on the room's line,
  like the crossing's lone panel), the kit leaves on the belt and the vine at
  their small scale, the ledger's toast on a server account, the sync's pay
  landing at the next commit.

### 2026-09-16 · PHASE 9 DELIVERY 2 — THE ENCOUNTER'S TRUTH (PHASE9_QUALITY_PLAN §8 items 3 + 7)
- **D1 · RETURN TO WHERE YOU SWUNG.** data.js `hqEncounterReturnSpot(run)` turns the
  run marker's `walker` (feet + camera yaw at the strike, the dead field until now)
  into `{ x, z, y, face°, swing: true }`; battle.js's commit carries `walker` home on
  `_hqEncounterResult`; map.js `_hqReturnOrMenu` makes it `_hqLastDoor` on a WIN
  whose room is the return room (a loss is still the ward, another room still the
  console); three-renderer.js `_hqGoTo` takes the FREE-SPOT form (an object with
  x / z — the walkable surface at the recorded level, the recorded heading,
  `faceAway` ignored) before the door scan. You stand where you swung, looking at
  the empty spot (THE CLEARED ROOM leaves the native out).
- **D2 · THE NATIVE'S IDENTITY.** `hqEncounterLaunch(...).encounter.name` = the room's
  label for the native; data.js `hqEncounterLead(enc)` = `{ race, gender, name, id }`
  validated against the roster / the race's genders; state.js
  `optimizeRandomizeParty(2)` reads `_hqPreselect.encounter` through it and pins
  SEAT 1 (`randomizeIdentity(false, race)` + the gender; the name through
  `sanitizeUnitName`) — the enemy's lead IS the character you hit, named as the
  room named it. The pool still leads the rest of the party.
- **THE DISSOLVE (seam 3).** three-renderer.js `_hqLeave(opts)` → `_hqDissolveStart`:
  the room's last frame rendered once more and copied into a 2D canvas laid over
  the WebGL canvas in the same task (the drawing buffer is not preserved across
  tasks), the room disposed as always, the copy HELD 150 ms and FADED 600 ms over
  the battle's first frames — with THE EYE seeding the camera from the walker's
  own viewpoint, the room dissolves into the board from one eye. map.js
  `window._hqLeave(opts)` passes it through; only `_hqEncounterStart` asks
  (`{ dissolve: true }`) — a screen / a menu exit still cuts. Off:
  `window.EW_HQ_NO_DISSOLVE`, `prefers-reduced-motion`. NOT the material dissolve
  the plan named: keeping the HQ scene alive over the battle's own render pass
  (shared renderer, ThreePost chain, depth, the sky uniforms) risks the battle's
  frame for a beat no one has seen (RULE #1c); revisit once this one is eyeballed.
- **Tests:** hq-encounter.test.js +5 (the lead, the return spot, the source sites
  on all four files, the dissolve's rules); scene-lifecycle / hq-pause anchors
  follow `_hqLeave`'s new signature. Full suite 1444 / 0 / 4 skipped.
- **Delivery:** `ENTROPY_WARS_PHASE9_ENCOUNTER.zip` — data.js, state.js, battle.js,
  map.js, three-renderer.js → R2 (data.js → Render too); index.html
  (`?v=20260916-phase9-encounter-02-cors`) → Render; the three tests + this file,
  PHASE9_QUALITY_PLAN.md, CLAUDE.md → the repo.
- **Unseen live (RULE #1c):** the crossfade's feel (the hold, the fade length, a
  slow board build showing under a half-faded room), the swing-spot landing on a
  gallery / a cave tier, the lead's nameplate wearing a race label as a name.


### 2026-09-16 · PHASE 9 DELIVERY 3 — THE GUN READS + THE GUN ITSELF (PHASE9_QUALITY_PLAN §8 items 5 + 6; data.js, sprites.js, three-renderer.js, three-vfx-effects.js, battle.js, audio.js, map.js, index.html; hq-portal.test.js; MODEL_INDEX §3b; local, not uploaded)
The user uploaded the door gun (a Meshy retro ray gun, R2 `Assets/door/models/`, repo `doors/`) and asked for it in the
officer's hand, in every Door Agent's hand in battle, and for the door to SHOOT out of it with juice. Shipped: the
catalogue row `door_gun`; `HQ_PORTAL_RULES.gun / shot / shapes / reasons / recallMs / rearmMs / exitNudgeM`; the held
gun while drawn (the mop's holder), the laser sight, the stance, the reason word (D3a), the shot that flies and unfolds
with a muzzle flash + recoil kick + the ranged clip, the landing beat (shock ring in the surface's plane, a breath of
light), A ● / B ■ (D3b), the re-arm cap + the F-hold recall that flies both doors back into the gun and clears the pair
(D3c), the exit nudge (D4); on the board every Door Agent carries it (`_unitAttachHeld`) and every placement is
`raceDoorGun:shot` from the caster's hand (relayed geometry; the two cues voiced inside the recipe). Three synth cues.
NOT built: D3d (playtest first), item 9's `hard` test, a hip holster. UNSEEN LIVE: the grip / muzzle on the Player and
Belle rigs — `HQ_PORTAL_RULES.gun.pos / rot / muzzle` are the edits; the muzzle's −X reading is unmeasured.

### 2026-09-16 · PHASE 9 DELIVERY 4 — THE MAP REMEMBERS (PHASE9_QUALITY_PLAN §8 items 8 + 9; data.js, three-renderer.js, map.js, profile.js, styles-base.css, index.html; hq-map-remembers.test.js, check-find-spots.js; local, not uploaded)
**D6 discovered routes.** A world-graph link is CHARTED the first time the officer walks one of its doors: map.js
`_hqRecordVisit` on a `link_<id>` door → data.js `hqLinkSee(profile, id)` writes `door.hq.links.seen[id] = date` AND
`progress.hq.links.seen` (the synced blob — `mergeProgressBlobs` carries the key, EARLIER day wins, cap 512; profile.js
folds the local record in on every read like the finds) in the visit's one transaction; a first sighting toasts
ROUTE CHARTED · <line>. `hqWorldRoutes(curRoom, { profile })` marks every leg `seen` and every station `known` (here,
a facility room, or touched by a charted leg — `hqWorldApplyKnown`); `hqWorldCharted(profile)` counts. THE WORLD
tab draws an unseen leg DOTTED (`.hq-world-unseen`), an unknown stop as a hollow `?` with an UNCHARTED row — GO
stays on every stop (the user's convenience rule, §14 row G). A read without `opts` carries no marks (older readers).
**D7 the reveals.** Each complex's ONE landmark / idea / reveal, as they stand: the Haunted House — the hall's
landing (the gallery), the wardrobe, the well; the Spaceship — THE SUN through the bridge's viewport (NEW:
`sun_viewport`, a wall proc whose ticker swells the disc and its corona, flares the rim near perihelion and slides
the stars over a 36 s pass; replaces the `false_window` on the bow wall) + the airlock's collars; the Dutchman —
the guns run out on the gun deck + the bilge's plunge pool; the Strip — the casino with no clock; Downtown — the
platform and the train's arrival; the cave — the six well heads in one room. Quiet rooms: `room.quiet = true` on
the attic and the airlock → `hqBuildFinds` lays the tape and NO envelope (not every room reads tape + envelope +
rail + exit). Not built: variant-driven beats for the Dutchman / the Strip / Downtown.
**Item 9 · THE LIP.** `hqFindHardReach(row)` (data.js) is the proof that a `hard` board find (a wall cell two levels
up) has a legal shot from a walkway point. Run against the gun as it stood it FAILED everywhere: a 1.6 m eye never
sees a 3.5 m top (a horizontal surface is invisible from below), and a wall door's exit lands at the door's BASE. So
the rule: `HQ_PORTAL_RULES.ledgeSnapM` (0.9) — three-renderer.js `_hqPortalLedgeSnap` turns a WALL hit on a raised
board cell's side (a `site` blocker with a finite top) within 0.9 m of that top into a FLOOR door ON the top, 0.55 m
in from the edge (a cave ledge is climbable and never snaps); the ghost reads THE LIP · ON TOP. The proof: an open
face, the aim in the band under the top, inside `reach`, over every other cell / monument, from a free walkway point —
all 30 `hard` finds pass (d 1–7.5 m). The way down is the twin, or ESC → DIRECTORY.
**D8 the learning sequence.** `HQ_GUN_LESSONS` (six rows, draft copy A15) + `hqGunLessons()`; catalogue
`lesson_plaque` (wall) / `lesson_sign` (a post, for the open room) → proc `lesson_plaque(U, p)` — `_hqProcProp(name,
p)` now hands a proc ITS OWN ROW (`p.lesson`); the plate wears the title, three lines, the number and the A ● / B ■
glyphs in the two colours. Placed: (1) THE FLOOR — the Training Room's west wall by the RANGE console; (2) THE LEDGE —
the Haunted House hall's east wall under the landing (the flight is the other way up) and the hall's tape PINNED on
the slab at (2.6, −4.9, 2.9); (3) TWO ROOMS — the foyer's west wall (↔ the hall, safe both ends); (4) THE CEILING —
Room 9's south wall, the right way up like the rail; (5) THE FALL — the stairwell's east wall (a floor hatch at the
bottom, a ceiling hatch on the top landing; hold F); (6) THE LIP — a post on the Singularity's walkway at (12.4, −2).
**D9 the audit.** `node check-find-spots.js [--suggest] [--json] [room]` dumps every find: spot, relax pass, distance
from the way in, the lesson it teaches as it stands (observation · navigation · portal · fight · evidence), the
pins, and the case for a hand pin. Today: 160 finds, 0 relaxed, 1 near the way in, 3 pinned; the ~20 pins are the
user's call (§14 row E). Tests: hq-map-remembers.test.js (8); achievements / hq-finds / hq-spaceship / hq-world
amended for the blob key, the quiet rooms, the viewport and the profile-aware directory. `npm test` 1468 / 1464 /
0 / 4 skipped.
- **Delivery:** `ENTROPY_WARS_PHASE9_MAP_REMEMBERS.zip` — data.js → R2 AND Render (the server merges the blob off
  it), three-renderer.js / map.js / profile.js / styles-base.css → R2, index.html → Render
  (`20260916-map-remembers-04-cors`), tests / tool / docs → the repo. UNSEEN LIVE (RULE #1c): the dotted legs on
  the directory, the plates' legibility at 1.1 × 0.7 m, the post in the open, the sun's pass through the porthole,
  the lip snap's feel (aim at the lip from 1–3 m; a corner hit reads NO ROOM — aim at the centre of the face).

### 2026-09-16 · PHASE 9 POLISH — THE DOOR GUN rev 4: THE HOLD, THE HAND, ONE TRIGGER, THE WALL, THE CARRY (data.js, sprites.js, three-renderer.js, map.js, index.html; hq-portal.test.js, hq-skate.test.js, playtest_gun_offline.js; local, not uploaded)
The user's five: the gun held upside down · no holding animation · no hand in first person · right click should
be AIM, not the other door · walls refuse doors they should take · you stop dead on the far side of a door.
**THE HOLD (measured, not guessed).** A scratch probe (now `playtest_gun_offline.js`) serves the repo's own GLBs
— the UAL / MAL libraries, the creator base, the ray gun — so the walker is a POSED rig holding the real gun,
photographed from the front / the sides by turning `hq.dev.playerGroup()`. Read off the shots: the hand bone's +Y
runs down the fingers, its −Z is the back of the hand; the gun's +X is the barrel (the grip is the −X end, the
lowest part of the silhouette), +Y its top. `HQ_PORTAL_RULES.gun` = `rot [0, −90, 90]` (barrel → +Y, top → −Z; the
old `[0, 90, 0]` hung it barrel-down, the mirror `[0, 90, 90]` hangs it under the hand), `pos [0, 0.05, 0.06]` (the
grip in the palm, not at the wrist; `[0, 0.2, 0.07]` floated it past the fingertips), `span 0.36` (the catalogue's
0.62 was a rifle — `_hqGunAttach` passes `h: G.span` now; the holder used to read the catalogue). The same row
rides the Door Agent's board hold. A held prop is never frustum-culled (its bounding spheres sit under a 0.01-scaled
bone and the gun vanished from some angles). **THE HOLDING ANIMATION.** sprites.js `HQ_GUN_CLIPS` = UAL1's
`Pistol_Aim_Neutral` (loop) + `Pistol_Shoot`; `_hqSpawnCharacter` bakes them onto the walker's rig as `hqAim` /
`hqShoot` beside `hqRide`; drawn + standing = `hqAim` (the two-hand hold, level, squared on the aim — walking keeps
the walk / run clips with the gun in the hand); the shot plays `hqShoot` first, the quick-draw chain behind it. The
Pistol idles were retired for the ROSTER in 2026-08-09 — the walker holding a real gun is the one case that wants
them. **THE HAND (first person).** The body is hidden in FP, so the gun rides the CAMERA: `_hqViewmodel` — the same
catalogue GLB at the rules' span, the barrel turned forward, a black GLOVE closed round its grip (fist, four fingers,
the thumb inside) and the sleeve's cuff running off the bottom-right of the frame — a child of `H.camera` (added to
the scene for it), at `viewmodel.pos` (metres right / up / forward of the eye), bobbed by the walk, pushed back by the
shot (`vmKickAt`), swung to `adsPos` by the ADS ease; `_hqGunMuzzle` answers the viewmodel's muzzle in FP so the sight
and the shot leave from it. **ONE TRIGGER (the user's question).** LEFT CLICK shoots the SELECTED threshold
(`H.portal.slot`, A first; the ghost, the sight and the word wear its colour; the ghost judges THAT slot, so it reads
THE TWIN in red over the other door), every shot auto-advances the selector so two clicks lay a pair, R flips A ⇄ B,
1 / 2 pick outright (`_hqPortalSelect` → map.js says which lays next; the pill reads NEXT A ● / B ■). RIGHT CLICK held
= AIM DOWN SIGHTS (`_hqPortalAds`, `adsK` eased over `ads.ms`): the lens 52° → `ads.fov` 34°, the mouse × `ads.sens`
0.55 (`_hqLookGain`), the third-person boom in to `ads.boom` 1.4 m, the viewmodel to the centre; the button up,
holstering, blur all drop it. `_hqKeyName` knows R / 1 / 2 (before Q, so the pinned line holds). **THE WALL (the
"collision is wrong").** Two real bugs: (1) the march reads the WALKABLE set, which stops HQ_BODY_R + 0.08 short of
every shell wall — a wall hit landed 0.42 m in front of the wall, the frame floated off it and "behind must be
solid" read air → `_hqPortalWallSnap` moves a hit within 0.6 m of a box room's perimeter plane (or a rotunda's
drum) ONTO it; (2) the fit tested corners a third of a door UNDER a low aim (inside the floor) and padded every
blocker by a walker's body (a coat rack a body's width from the frame refused the wall) → the aim now computes the
wall door's OWN centre (base on the floor in front when the aim is low, under the ceiling when high — the record,
the ghost and the fit read one number), the fit tests the FRAME's corners (a hand inside top / bottom) with a
frame-sized front test 0.45 m out (`_hqPortalFrontSolidAt`, a 6 cm pad — a picture / a notice board under the frame
is covered, a bench against the wall still refuses), TOO CLOSE is a floor door under you (a wall at arm's length is
fine; only standing IN the frame refuses), the lane on the wall is 1.45 m, and in third person the march starts at
the officer's head (a desk the boom hung over used to catch the ray). Measured in the Medical Wing: both long walls
take a door at eye level; the doors the room's own doors sit in still read A DOOR'S LANE. **THE CARRY ("I need to
carry my momentum").** No new physics engine: the walker already had gravity (`vy`) — it lacked horizontal momentum.
`_hqTickWalker` measures the frame's displacement as `velX / velZ / velY` and the walk's INTENDED velocity as
`pushX / pushZ`; a WALL door is crossed by TOUCH now (`_hqPortalWallTouch`: the centre inside the opening, within
`carry.touchM` 1.05 m of the plane — the discs hold a body ~0.85 m off it — moving or PUSHING into it); the crossing
files the velocity VECTOR; `_hqPortalMapCarry(v, A, B)` (pure, tested in a vm) reads it in A's frame
(`_hqPortalFrame`, the plain twin of `_hqPortalBasis`) — the part INTO A becomes the part OUT of B, up stays up,
sideways mirrors — never below `carry.minOut` 2.4 out of a wall (a walk-in is a walk-out), never above `carry.max`
18; the walker keeps it as `pl.mvx / mvz` (+ `vy`), `_hqTickCarry` runs it with the walk's own slide / step rules,
run off on the ground over `carry.groundS` 0.55 s, kept in the air (a fall into a floor hatch is a 9 m/s shot out of
a wall door; a run into a wall door is a leap out of a floor hatch). `_hqPortalWallExit` stands you clear of the
twin's discs facing out; wall → wall keeps the mouse's offset off the entry heading, anything else looks the way out;
across a ROOM CHANGE map.js hands the twin's row to `hq.portalCarryFor(twin)` before `_hqGoRoom` and
`_hqGoTo('portal:x')` spends `_hqPortalCarryMem` on the landing. Measured (Medical Wing, A north / B south): walked
north into A, out of B at 2.4 m/s still heading north, the camera turned to match, the carry ran off over ~2 s.
**Tests**: hq-portal.test.js (+5 rev 4 tests: the rules, the clips, the trigger / ADS, the hand, the wall, the carry
mapping with numbers — 20 / 20), hq-skate.test.js's key pin. `npm test` 1474 / 0. **UNSEEN LIVE (RULE #1c)**: the
grip on the Player / Belle CAST rigs (the probe posed the creator base — `gun.pos` is the edit if the cast hand sits
differently), the ADS feel and its boom in third person, the viewmodel's scale at the real FOV, the bob, the fling
through a ceiling hatch at speed, the lane rule against a room's every door. NOT built: a holstered gun on the hip,
a reload / inspect idle, the crosshair (the laser dot is the reticle), D3d (the boom's pitch clamp in a loop).

### 2026-09-16 · PHASE 9 DELIVERY 5 — THE SYNCED BUILDING + THE THREE REVEALS (PHASE9_QUALITY_PLAN §6 D5 + D7; data.js, profile.js, index.html; hq-synced-building.test.js; local, not uploaded)
**D5 the synced building.** Three more of the building's records ride the progress blob beside the finds and the
links, MONOTONIC like the counters: `hq.cleared` = `{ '<roomId>': { date, ids } }` (the LATER day wins; the same day
unions the beaten natives' ids; caps 256 rooms × 32 ids), `hq.encounters` = `{ count, wins, losses, last }`
(per-field max; `last` = the later day, a HELD over an EXITED on the same day) and `hq.skate` = `{ best: { score,
text, date }, total, lines, bails }` (the best by score, the tallies by max). data.js `mergeProgressBlobs` carries
them (sanitised, the shape always there); `hqClearedUnion` / `hqEncountersUnion` / `hqSkateUnion` are the joins,
`hqEncounterLog` / `hqEncounterCleared` / `hqSkateRecord` READ the union of the local record and the blob (a second
device sees the room you cleared today, the log, the best line), `hqEncounterRecord` / `hqSkateBank` continue from
the union and WRITE both (`hqSyncedHq` never invents a v2 blob), profile.js `profileLoadProgress` folds the local
record in on every read through `hqDoorSyncFold` (a pre-blob record reaches the server on the next push). The join
is the counters' — right under full-blob pushes; two devices fighting at the same minute lose one count, the same
as every counter. `portal` (a visit's rope) and `punch` (a day's clock) stay local. **data.js → Render as well as
R2** (the server merges off it).
**D7 the last three reveals**, as room VARIANTS on the complex parts (the same room, the same doors, the roll on a
fresh arrival like Room 86's; the way in re-plated): the Dutchman's gun deck — **BATTLE STATIONS** (`hours [21, 5]`,
else `p 0.25`: the crew that is not there stands inboard of every gun, the lanterns burn red, the powder is up from
the hold, the second match lit, the gunnery table signed); the Strip's casino floor — **THE DEAD HOUR** (`hours [3,
6]`: the tables empty, the dealer dealing to the room, the one who never left at his machine, the floor being done)
and **JACKPOT** (`p 0.2`: the east bank has paid, the pit boss over the winner, a crowd of roster draws, the cage
paying out in forms); Downtown's platform — **RUSH HOUR** (`hours [7, 10]`: a crowd at the edge, every bench taken,
the shift on the clock, the papers dropped) and **LAST TRAIN** (`hours [0, 5]`: the tubes dropped, one bulb, the
zombie alone). The floor with no clock now tells you the hour by what is happening on it — the identity, kept: no
clock and no window in any beat, one door, eight machines, the dealer never leaves the table; the platform's people
stay off the track; the four guns stand where they stand. Every line is Claude's DRAFT (A15). doorhq.test.js's
building-wide roll pin reads the cafeteria's key (the roll names every room with a visit variant now);
achievements.test.js's empty-blob shape grew the three keys. Tests: hq-synced-building.test.js (6: the merge, the
union reads, the dual writes + the fold, the sheets through the urban / Dutchman prop rules, the identities, the
roll by the clock). `npm test` 1480 / 1476 / 0 / 4 skipped.
- **Delivery:** `ENTROPY_WARS_PHASE9_SYNCED_BUILDING.zip` — data.js → R2 AND Render, profile.js → R2, index.html →
  Render (`20260916-synced-building-06-cors`), tests / docs → the repo. NOT built: D3d (the boom's pitch clamp in a
  loop — playtest first); §8 item 10 is the user's playtest. UNSEEN LIVE (RULE #1c): the red gun deck under the
  2.7 m beam, the crowd at the machine, the platform at rush hour against the train's arrival, the second device's
  first read of a cleared room.


### 2026-09-16 · THE USER'S FIVE — the gallery's edge, Room X's landing, the car, THE PLANET IN THE ROOM, THE ISLANDS (data.js, three-renderer.js, index.html; local, not uploaded)
- **The user:** "the third floor of the rotunda — the railing looks like it's floating and I can't see the floor of it
  until I go up the stairs and walk on it; Room X soft locks me; the elevator looks really bad, don't use that metal
  texture on it; the Moon, Mars and Saturn rooms should look more like their battle maps now; how is there no water
  in the Bermuda Triangle? it's all sand — it should be a lot of water, it can double as an island / buried treasure map."
- **THE GALLERY'S EDGE (three-renderer.js `_hqBuildRing3`):** measured offline (playtest_hq_offline.js from the
  mezzanine and the floor): the slab's sector meshes exist and render, but its FASCIA was a `_hqBand` at the slab's
  inner radius with `FrontSide` — a cylinder's front faces OUTWARD, so it faced the drum and never the hall — and the
  underside is a foreshortened sliver from any eye below it; all the hall saw was the rail's posts on the stone. The
  fascia is `BackSide` now and DEEPER than the slab (a 0.25 m soffit lip, `lipD`): the dado's oxblood between two
  teal trims, closed under by a ring, the read the mezzanine's edge has against the drum's top trim. The mezzanine's
  own fascia had the same outward face (hidden behind the lower wall's trim) — `BackSide` too.
- **ROOM X (data.js `rooms.orb`, three-renderer.js `_hqGoTo`):** the soft lock was the LANDING — 2.4 m in from a wall
  (THE LANDING, 2026-09-15) is past the middle of a 5 m room, so both of Room X's doors stood the walker INSIDE the
  orb's collision disc (`floating_orb` foot 0.7, block) and the step rule refused every way out (the railings are
  `foot: 0` — they never blocked anything). Two fixes: `_hqGoTo`'s box landing is clamped to the room's own depth
  along the door's normal (`min(2.4, depth/2 − 0.9)`, never under 0.9) and then walked BACK toward the door in 0.2 m
  steps until it stands on no blocker (a raised landing over its head, a top under its floor, do not count); and the
  room is 7 × 7 with the orb ring north of centre (the gate at z 1.6, the desk on the north wall, the watcher west).
- **THE CAR (data.js `rooms.car`, three-renderer.js `_hqBuildDoors`):** the `metal_3` grate is gone from the car's
  walls and dado (brushed `aluminium` walls over a darker aluminium dado, the deck sheet the Spaceship wears) and the
  elevator LEAVES are brushed aluminium with a satin finish instead of the TRIM sheet tinted grey (`_hqMat('aluminium',
  0.9, 2.4, …)` — the teal trim's pattern under a grey tint was the "bad metal"). Room X keeps its `metal_3` walls (not
  asked; one field each if wanted).
- **THE PLANET IN THE ROOM (data.js `hqSiteRoom` → `shell.planet` + `shell.world`; three-renderer.js):** a site room
  whose map's WORLD is a planet (`env.world.kind === 'planet'`: Mars, the Moon, Saturn) stands on THE WORLD's own
  planet mesh now. `_nrApron({ planet: true })` under `K.hq` records the craters on the KIT (`K.planet`; `_nrCrater`
  reads it, `K.inCrater` too) and `_nrKit` rides the kit on `ctx.kit`; `_hqBuildSetting` hands the kit every spot
  that must stay FLAT as keep-outs (the door lanes and the console — the cleared zones, hoisted above the build —
  plus the room's doors, counters, floor props, natives, online spots, the lamp masts, the spawn, the finds), runs
  the builder, then **`_hqBuildPlanetGround(room, g, K)`**: `_wdBuildPlanet` on the room's kit (the collar round
  the board, the flat island to the room's corners, the far ring curving off to `min(row.r, 64)` tiles, the near
  craters CARVED, Saturn's bands + hexagon as vertex colours — `K.planet.hexR` from the builder), the map's rim
  builders (`_WD_RIM` craters → hills, peaks) on the curve past the shore, the haze (`_wdInject` with `dissolve:
  false`; the shared world uniforms pinned grounded: `uWdC` = the room's origin, `uWdStab` 1, `uWdKeep` 1e8, the
  fog amount off `shell.sky.fog`), `_wd.mats` truncated back and `_wd.hasGround` untouched (`o.hq` in
  `_wdBuildPlanet`) — a room never touches the battle's world state. The box shell's flat floor bands / apron / skirt
  are built as before but tagged `_ew_hqGround` and HIDDEN once the planet lands (the fallback when the setting is
  off). **The walker reads the carved bowls**: `_hq.planet.yAt(x, z)` is a layer of `_hqSurface`'s box branch read
  before the board's cells (a bowl is a slope, walked in and out; the rim a step). Saturn's storm walls and THE
  RINGS come indoors (their `!HQ` gate dropped — they are the sky, past the room's roam; a 43 m wall plane is
  skipped by the piece rule's 40 m sheet test). Sheets: Mars's floor + apron = `moon_2` × #c88a5a and Saturn's =
  `cloud_thick` × #c8a870 (the boards' own, as the battle's one surface); the Moon already wore its own.
- **THE ISLANDS (data.js `_MF_BUILDERS.prebuilt_bermuda` / `_MF_DELTA_BUILDERS.prebuilt_bermuda`, the meta desc,
  Room 345's sign + a line; three-renderer.js `_NR_BUILDERS.bermuda`):** the two desert triangles are the OPEN SEA:
  the full board is a sheet (`ROWS`, the top half, `sym180`) — a beach each side (the spawn rows), shallows (`water`,
  a wade) round every shore, the deep between (`deep_water`, a swim that drowns), the treasure island at the centre
  with the X on it (`dirt_2`, the 2 × 2 across the centre), a west sandbar dry the whole way, a wreck (+2 hull, +1
  deck) on a rock islet each side, the corner buoys and beach torches; the Δ the same in eight (`M.lake` water 1 /
  deep 2, a rock step, the wreck block at (7,1) — no spawn neighbour). The near builder builds NO sand apron: the
  sea (`_nrMoat` deep_water at **depth 1** = the board's own water level, so the board's edge water opens into it)
  runs to the horizon (`env.world.sea`), the two BEACH TONGUES continue past the spawn rows to the kit's edge (the
  crossing's doors stand on them), the lighthouse stands on its own rock, the buoy rides the sea, `_nrRocks` takes a
  `y` (tiles) so the shore rocks break the surface, the chest (`_hzMiscKit('chest')`) sits beside the X at (6,6) /
  (2,2) and four `palm_tree` GLBs stand on the island and the beaches (the full board only). The site room: the
  quay is the beach, the moat the sea — the island reads across it.
- **Tests:** `npm test` 1480 / 1480 / 0. Screenshotted offline: the hall from the
  mezzanine and the floor (the gallery's edge reads), Room X's landing, the Mars / Saturn / Bermuda rooms
  (stand-in textures — the SHEETS are unseen, RULE #1c).
- **Delivery:** `ENTROPY_WARS_HQ_FIXES.zip` — data.js → R2 AND Render (hqSiteRoom is read by the server's data
  load too), three-renderer.js → R2, index.html → Render (`20260916-hq-fixes-07-cors`), docs → the repo. UNSEEN
  LIVE (RULE #1c): the fascia's oxblood against the real stone, the elevator's aluminium under the car's warm lamp,
  the crater bowls under the walker's feet, Saturn's rings from the quay, the real sea sheet against the beach
  tongues, the chest's scale on the X.

### 2026-09-16 — PHASE 9 DELIVERY 6 · THE FIELD, STAGE A (the seamless encounter)
- **The brief (the user):** "after an encounter there is no way to just return to where I was
  exploring; there is still a pre-fight VS screen; encounters can be TDM, a Cube / Code Red
  fight Arena; a loss wakes you in your office or the infirmary; forget spawn zones — start us
  up close, slid to the nearest square tile during the transition."
- **battle.js:** `_encMatch` latches the run at `startMatch` (the VS card, the intro gate, the
  warm-up, the eye and the commit all read `_encRun()`); `_encounterResultButtons()` = the
  one-button card (▸ BACK TO THE ROOM / ▸ WAKE UP → `backToMainMenu`); the standard bar is
  restored for the next plain match; `window._ewEncounterField()`.
- **data.js:** `HQ_ENCOUNTER_RULES` gm `tdm` / `gmCodeRed` `arena` / `tileM` / `snapMs`;
  `hqEncounterConfig(raw, ctx)`; `hqEncounterField`, `hqEncounterSeats`,
  `hqEncounterEyeFromSeats` (through `hqEncounterEye(field, seats)`), `hqEncounterWakeRoom`.
- **map.js:** `_hqEncounterFire` reads the day's Code Red, files the field, asks the renderer
  for THE SLIDE and starts from its callback with the eye re-read; the run marker carries the
  field + the mode; a Code Red encounter sets `_hqCodeRedRun` (it IS the response); no roster
  → a stand-in squad (`party.fallback`); `_hqReturnOrMenu` lands a loss in the ward / the
  office by turns; `autoGenerateSpawnZones` → `_encounterPlaceSeats()` seats both parties
  from the field and the row relocation skips them (the zones + SPAWNS stand for respawns).
- **three-renderer.js:** `H.snap` / `_hqTickSnap` / `_hqEncounterSnap`; API `encounterSnap`,
  `encounterEye`, `snapping`.
- **Tests:** hq-encounter.test.js 30 (the field, the seats, the eye off the seats, the wake
  room, the slide in a vm, the source sites). `npm test` 1484 / 0 / 4 skipped.
- **Delivery:** `ENTROPY_WARS_PHASE9_FIELD_A.zip` — data.js → R2 AND Render, map.js /
  battle.js / three-renderer.js → R2, index.html → Render (`20260916-encounter-field-08-cors`),
  the test + docs → the repo. UNSEEN LIVE (RULE #1c): the slide under the strike clip, the
  first frame easing off P1's seat, the one-button card, the stand-in squad.
- **Still open in stage A:** the battle built at the room's transform with the room's
  furniture as the setting (§10 stage 4), explicit spawn zones per seat; then B–E (the
  rasteriser on the cave and the box rooms — the two systems unified).

### 2026-09-16 — PHASE 9 DELIVERY 7 · THE FIELD, STAGE A rev 2 (the seats are the zones, the board untouched)
- **The defect it closes:** Delivery 6 seated the parties on their cells but let the zone
  builder run its ROW pass first — `_clearSpawnZoneTiles` flattened the site board's two
  edge rows and `_ensureEgressRow` rewrote the rows inside them, so the fight's board was
  not the room's board (the walker had just crossed those tiles); a TDM respawn came home
  to an edge row nobody had stood on, and a Code Red Arena fight registered spawn nexuses on
  rows the seats never touched.
- **data.js:** `hqFieldTransform(board)` — THE ONE room-metre ↔ tile rule (`toTile` /
  `toRoom` / `cellOf` / `centre` / `inside`); `hqEncounterField` and `hqEncounterEye` read
  it (the snap, the seats and the eye seed agree to the millimetre — stage A's acceptance);
  `hqEncounterZones(seats)` = the seats as EXPLICIT PER-SEAT zones (`{ 1, 2, field: true }`).
- **map.js:** `autoGenerateSpawnZones` takes THE FIELD branch right after the custom-map
  one: the seats are the zones, `_spawnIndex` = the seat, `SPAWNS` = the seats, and it
  RETURNS — no row, no flatten, no egress rewrite, no `_initArenaSpawnNexuses`.
  `isFieldSpawnZones()` (on `window`) is the ONE read every zone PERK gates on:
  `getSpawnZoneOwnerAt` → 0 (so the end-of-round regen / scorch skips — the nexus branch
  is untouched), the Arena spawn nexuses stand down. The respawn readers
  (`getRespawnZoneFor`, recall, Gauntlet reinforcements) keep the tiles: a respawn comes
  home to the seat you started on.
- **three-renderer.js:** the spawn wash, the sanctuary curtain and the minimap tint skip a
  `field` zone record (their serials still stamp).
- **Tests:** hq-encounter.test.js 33 (+ the transform's 1 mm round trip on four boards,
  the zones from the seats, the source order: the field returns before the flatten).
- **Delivery:** `ENTROPY_WARS_PHASE9_FIELD_ZONES.zip` — data.js → R2 AND Render, map.js /
  three-renderer.js → R2, index.html → Render (`20260916-field-zones-09-cors`), the test +
  docs → the repo. UNSEEN LIVE (RULE #1c): a respawn landing back on a mid-board seat
  beside the enemy (Spawn Guard covers the round), the Code Red Arena fight with only the
  centre nexus to hold.
- **Still open in stage A:** the battle built at the room's transform with the room's
  furniture as the setting (§10 stage 4 — the renderer bridge); §14 B (the party's ARRIVAL
  — today the nearest free cells); then the playtest, then B–E.

### 2026-09-16 — PHASE 9 DELIVERY 8 · THE FIELD, STAGE B (the rasteriser on the cave)
PHASE9_QUALITY_PLAN §11.3 B, in code and measured. A cave chamber had no board under the walker, so an
encounter there fought the site's Δ from the centre with no eye; now THE CAVE GRID IS THE LATTICE and THE
WINDOW — the 8 × 8 of that grid holding both feet with the most of the walker's reach inside it — is
rasterised into a Δ-shaped map entry the ordinary launch plays under `field:<roomId>:<ox>,<oz>`.
- **data.js** (the block after `hqEncounterWakeRoom`): `HQ_FIELD_RULES`, `hqFieldRoomOk`, `hqFieldId` /
  `hqFieldParse`, `hqFieldCellTile`, `hqFieldRaster`, `hqFieldReach`, `hqFieldWindow`, `hqFieldBuild`,
  `hqFieldLayout`, `hqFieldRegister` (all on `window`). Rule §3 (in / out): `#` and off-grid = rock at
  max(3, tallest IN + 2); a hazard fluid is OUT but drawn as the liquid (sight passes). Rule §4 (heights):
  a cave level is half a battle level — round() never splits a walker's step, proven on every window.
  Rule §7 (explicit spawns): the entry's `spawns` are `hqEncounterSeats` over the IN cells. Rule §10: the
  entry rides PREBUILT_MAPS; `hqSiteId('field:…')` = the room's site. `hqFieldTransform` takes `x0` / `z0`.
- **map.js**: `_hqEncounterFire` → `hqFieldWindow` → `ev.board = win.board`, `L.field = win`;
  `_hqEncounterStart` → `_hqFieldRegister` (GAME_MODES + a hidden MS_MAP_LIST row) → the field id;
  `_hqEncounterBoardCopy` says THE CAVE IS THE BOARD. **match-select.js**: the card filter drops `m.field`.
- **THE PROBE** (`playtest_field_offline.js`, repo tooling): the gallery, 1.3 m west of the Gnome, `hq.strike()`
  → `activeGameMode = field:site_prebuilt_hollow_earth_gallery:3,7`, 8 × 8, TDM, `spawnZones.field`, P1 seat 1
  (4,5) = the walker's cell, P2 seat 1 (5,5) = the Gnome ("Gnome"), heights `77777777 / 77777555 / … /
  66666666` (the shelf at +2, the ledge the walker stood on at +1), the camera seeded. Two bugs it found:
  **the frame ticked a disposed room** (THE SLIDE's callback runs inside `_hqTickWalker` and `_hqLeave`s —
  `_hqFrame` returns when `_hq !== H`), and **D2's seat-1 pin never fired** (`_msConfirm` nulled the
  preselect first — the lead rides `window._hqEncounterLead`, spent after the draw). The Gnome had landed
  at P2 seat 4 / seat 2 by the pool's chance on the first two runs.
- **Tests**: hq-field.test.js (6: the rules, the id, the raster on 2910 windows — rock, keys, THE GUARANTEE
  edge by edge and as a BFS against the engine's move mirror — the window's choice from every door landing,
  the build + the registries, the source sites); hq-encounter.test.js's D2 guard reads the marker.
- NOT built: stage C (box rooms — the complex parts still fight the site's Δ from the centre), stage D (the
  thin walls, a door on the frame's edge), stage E (the HUD of the field), §10 stage 4. Unseen live: the
  real cave sheets on the field's voxel columns, the rock's height, the eye's first frame in a cave.

### 2026-09-16 — PHASE 9 DELIVERY 9 · THE FIELD, STAGE C (the rasteriser on the box rooms)
PHASE9_QUALITY_PLAN §11.3 C's first half, in code and measured on every part. A complex part (a box room —
the hall, the hold, the casino, the platform…) had no board under the walker, so an encounter there fought
the site's Δ from the centre with no eye; now THE BOX LATTICE IS THE ROOM'S OWN (rule §2: cells of a battle
tile on the room's axes, edges at off + k·1.75 m from the centre, the offset per axis 0 or half a cell —
whichever puts the most cells inside) and THE WINDOW is chosen and rasterised exactly as on a cave.
- **data.js** (the stage B block, grown): `HQ_FIELD_RULES.box` (cell · cover 0.5 · margin 0.4 · the three
  bands low 0.5 / high 2.2 · footMin 0.7 · climbM 1.46 = the walker's jump apex · dropM = HQ_DROP_MAX ·
  galleryRise / galleryRun = the renderer's), `hqFieldRoomOk` (stage C: a wild box room that is not a site's
  BOARD room), `hqFieldBoxTile` (rule §5's bands), `hqFieldGallery` (three-renderer.js `_hqGalleryFrame`'s
  frame in data: the strip, the flight from the named end, the tread height at a cell's run), `hqFieldBoxInfo`
  (the lattice; THE COVERS = every floor prop the renderer BLOCKS — `foot > 0` and `block` or standing, top =
  `y + cat.h || 1`, the renderer's own read at both placer sites — as a box in room axes, a disc as the
  square of its area and ignored under footMin; a cover ≥ 50 % of a cell sets its top; the slab a +2, the
  treads +1 then +2; `seat: false` on any cover; cached per room OBJECT so a variant swap re-rasterises),
  `hqFieldLattice` (ONE shape over the cave grid and the box lattice — `walk(gx, gy)`), `hqFieldNearestWalk`
  (a foot in a partial edge cell / on a slope scores from the nearest walkable), `hqFieldRasterBox` (OUT = the
  room's WALL, a rock column in the shell's wall sheet; IN = the floor sheet at its band), `hqFieldBoxStep`
  (up ≤ climbM, down ≤ dropM, the flight + the slab one run), `hqFieldReach` dispatching on `R.box`,
  `hqFieldWindow` on the lattice (the board record wears `box: true`). THE GUARANTEE holds by the bands (a
  climb ≤ 1.46 m never crosses two bands) and the test proves it edge by edge and as a BFS on every window of
  every part. `hqFieldLayout(site, base, { box })`: a box field is INDOORS — the site's `near` setting and
  `motion` are dropped and THE WORLD is inert (`kind: 'room'`); the site's sky and far roster stand until §10
  stage 4 draws the room itself round the field.
- **map.js**: `_hqEncounterBoardCopy` reads `hqFieldRoomOk` — THE ROOM IS THE BOARD in a part; the fire /
  start comments name stage C. Nothing else moved: the stage B path (`hqFieldRoomOk` → `hqFieldWindow` →
  `_hqFieldRegister` → the field id) carries a box room unchanged, THE SLIDE reads `_hqSurface`, the seats /
  the eye read `hqFieldTransform` with the window's origin.
- **Measured** (every part, the window from the centre): the hall 8 × 7 lattice, 56 IN, heights 0 / 1 / 2 (39
  / 3 / 14 — the landing two rows deep at +2, the flight's two treads 0.97 → +1 and 2.42 → +2 at the east
  corner, the couch a +1), the cellar 42 IN with the boiler a +2, the hold 56 IN with the iso tank +1, the
  gun deck 48 IN with the cannons +1, the casino 64 IN with the bar / the table +1, the lobby 56 IN, the
  platform the corridor case (5 cells wide inside rock, 40 IN), the attic 15 IN (a 4 × 3 m usable floor —
  the plan's "≥ 24 IN per part" was written before the rooms were measured; the test pins ≥ 12 and the six
  two-height parts). Every window seats 4 + 4 on free floor cells; every IN cell reachable from the centre.
- **Tests**: hq-field.test.js (13: + the box rules vs the renderer's constants, the lattice on every part with
  the covers diffed against the renderer's blocking rule, the hall's landing, the raster + THE GUARANTEE on
  every window of every part, the window from every door landing + the nudge, the build + the indoor layout,
  the acceptance numbers, the source sites).
- NOT built: §10 stage 4 (the room drawn as the battle's setting — a box field today stands as a rock-walled
  8 × 8 under the site's sky), stage D (the thin walls on cell edges, a door on the frame's edge as a
  threshold), stage E (the HUD of the field). Unseen live (RULE #1c): the wall sheet as rock columns
  (drywall / gunmetal / urban wall / tile), the floor sheet on the columns, the +2 landing's columns, the
  eye's first frame in a box room.

### 2026-09-16 — PHASE 9 DELIVERY 10 · THE ROOM ROUND THE FIELD (§10 stage 4) — local delivery
PHASE9_QUALITY_PLAN §10 stage 4 / §11.2 rule 9: an encounter's battle is built INSIDE the room the
officer struck from. Before: a site room's strike fought the site's Δ under its setting and sky (the
walkway, the console, the signboards, the masts, the doors gone at the cut); a complex part's strike
(stage C) fought a rock-walled 8 × 8 under the site's sky with nothing round it.
- **three-renderer.js — the bridge** (`THE ROOM ROUND THE FIELD`, right before `_hqEnter`):
  `_hqBattleRoom()` reads battle.js's marker (`_ewEncounterRoom()` — the latched run's `room`, `field`
  (the window's frame: N · C · x0 · z0) and `fieldId`; cached on the run's content, the scenery key asks
  every frame) and answers `{ room, T (hqFieldTransform), site, base, field (the raster's cells) }` for a
  BOX room that is not a cave; a site room only when the board is its Δ (the console can file the FULL
  site from the room — that match stands on its own). `_hqBattleRoomMatrix(R, ts)` = ONE matrix: scale
  `(ts / C) / U`, translation `(−x0 · ts / C, base · elev, −z0 · ts / C)` — cell (0,0)'s NW corner lands
  on tile (0,0)'s, the room's floor on the base level's top (hq-room-in-battle.test.js proves the corner,
  the centre, a cell and a wall top). `_hqBuildRoomInBattle(ctx)` (called from `_buildHorizonScenery`
  at its three `scene.add` sites, after `_worldBuild`; `_hqBattleRoomKey()` rides the horizon key, so a
  plain match on the same map never wears the room and a new window rebuilds it): a SCRATCH `_hq`
  record (every list the builders push to, `propLights` pre-spent to `HQ_PROP_LIGHT_MAX −
  HQ_BATTLE_ROOM_LIGHTS` (4) — every point light recompiles every material once), the builders run in
  a try / finally that restores the live record — `_hqGalleryFrame` + `_hqBuildBoxShell` +
  `_hqBuildGallery` + (a site) `_hqBuildSiteDressing` + `_hqBuildDoors` + `_hqBuildCounters` (the
  `battle` marker filtered off the copy — it stood on the board) + `_hqPlaceProps`; then every direct
  child of the shell / door / prop groups is FILTERED (a CSS2D plate, a `_ew_hqPart` the room drops, a
  site room's `_ew_hqGround`, a PROP on a COVER cell of the raster — `_hqBattleRoomCoverAt`: '2'..'9'
  in `entry.field.cells`, the column stands for it), `applyMatrix4(M)`-baked, and hung: a piece wearing
  `_ew_hqWall` into its side's occlusion group (`_ew_occWall` / `_ew_occFadeTarget` 0.04 — the wall
  between the eye and a unit fades, the Training Room's rule), the rest as its own occluder root. The
  group is `_facilityNearGroup` (or its children join the map's own when an `occ` near builder made
  one — then a `walls` site room drops the shell's walls, the builder's stand). Materials wear
  `_ew_hzNear` (the altitude fog leaves them), additive / sprite fog off, shadows off; the room's
  `fxPulse` glows go into `_hzGlowPulse` (the battle's tick tolerates the HQ shape; cleared with the
  scenery). What a SITE room drops: floor · ceil · pipe · strip (+ wall with an enclosure) — the battle's
  setting is the ground; what a PART drops: the ceiling only (the battle looks in from above), its floor
  CUT TO THE WINDOW. Kill-switch `window.EW_HQ_NO_ROOM_IN_BATTLE`; `EW_HQ_DEBUG` logs kept / dropped.
- **`_hqBuildBoxShell`**: every piece wears `_ew_hqPart` (floor · ceil · wall / edge (+ `_ew_hqWall` =
  the side, set in `slab()`) · pipe · strip); a scratch record's `floorHole` (a room-metre rect) draws
  the floor as FOUR BANDS round the window, each clipped to the room (a window past a wall leaves that
  band out) — the field's own columns fill the hole. `_hqBuildDoors` / `_hqBuildWay` / `_hqPlaceProps`
  tag a box-wall door / seam / wall prop with `_ew_hqWall` so it fades with its wall.
- **`_hqBuildSiteDressing(room)`** — the site board's tail (the signs, the freestanding signboards,
  the lamp masts, the containment lamps, the strips) split off `_hqBuildSiteBoard` (which calls it
  last; same code, same order) so the bridge can stand the dressing round a battle whose board is the
  battle's own. The test proves it reads none of the board's locals.
- **battle.js**: `window._ewEncounterRoom()` beside `_ewEncounterField` — `{ room, field, fieldId,
  site }` off the latch, null outside an encounter.
- **data.js**: `hqFieldLayout`'s stage C comment (the room is drawn now).
- **NOT built**: a CAVE chamber round a cave field (its grid IS its floor — the ledges / pits / falls
  would have to be cut to the window like the box floor; the cavern world + Hollow Earth's setting
  stand, as in stage B); the console's crossing (the marker is the encounter's latch — a crossing filed
  at the console from a site room fights the Δ under the setting as before; one marker on
  `_hqTerminalClose({ launch })` would bring it in); a cover cell's column dressed as the prop it stands
  for (a table is a floor-sheet plinth today); the rock columns of OUT cells past a box room's walls
  (stage D's chasm / thin-wall rule); the prop / door leaf tickers (a belt stands still in battle).
- **Tests**: hq-room-in-battle.test.js (8 — the marker, the reader in a vm on the real sheet, the
  matrix, the cover rule on the hall's window, the scenery hook, the part tags, the dressing split,
  the data comment). `npm test` 1508 / 0 / 4 skipped.
- **UNSEEN LIVE (RULE #1c)**: all of it — the walls' fade from the eye's first frame (the south wall
  stands between the boom and the board), the floor bands meeting the field's columns at the base top,
  the door leaves (the GLBs land after the build; the swing never runs — they stand as hung), the
  props' scale against the units, a site room's kerb / signboards / masts on the battle's apron beside
  the setting's own pieces (nothing culls a house standing where the console does), the light cap, the
  covers as plinths.


### 2026-09-16 — PHASE 9 DELIVERY 11 · THE SWOOP + THE CAVE ROUND THE FIELD (the encounter's seam, polish) — local delivery
The user's three notes on the encounters, in order: (1) "the battles start with the esoteric background sky
stuff, even though that is not in the cave at all — the maps are supposed to start normal and only get there
as the entropy gauge fills"; (2) "I am still seeing a loading screen before the battles"; (3) "one single camera
swoop from the third-person exploring angle to the overhead battle angle — smooth", with the Mystery Dungeon
free-roam as the feel to steer by (the place you walk IS the place you fight).
- **THE DARK CEILING (1)**: a cave field inherited Hollow Earth's whole env — `stars` 0.9, `nebula` 1.0, the
  `crystals` far roster floating round the board, the `hollow_earth` near builder (its apron + spires) and THE
  WORLD's `cavern` — none of which stood in the chamber. data.js `hqFieldLayout(site, base, { cave })` treats a
  cave like a box field now (no `near`, no `motion`, `world: { kind: 'room' }`) AND turns the sky off:
  `scenery: 'none'` (the 'none' theme = an empty void), `stars: 0`, `nebula: 0`; the site's fog + tint stay (the
  dark the cave reads under). The site's own EW_MAP_META row is untouched (the Δ from the console still has its
  sky). THE WORLD's entropy dissolve was never the culprit — `_wd.stab` starts AT its target (grounded) — the
  floating roster was the site's, not the gauge's.
- **THE CAVE ROUND THE FIELD**: three-renderer.js `_hqBattleRoom` accepts a cave chamber (`R.cave`), and
  `_hqBuildRoomInBattle` runs `_hqBuildCave(copy)` on the scratch record BEFORE the shell (it sets `H.site`, which
  the doors' lane height reads); `_hqBuildCave` reads the scratch record's `floorHole` (the window, room metres)
  and draws NO floor / ledge / ramp / bridge / pool / glow inside it (the field's own columns stand there) — its
  ROCK is still drawn inside the window: the crag to the ceiling encloses the field's short rock column, so the
  window's rim reads as the chamber's wall, not a step; stalactites hang outside the window only. The box shell's
  walls stand behind the rock as the occlusion fade's side groups; the ceiling is dropped as in every room (the
  battle looks in from above — the sky over it is now black). Measured on a stub scene: the gallery's window
  (14,13) cuts 64 instanced cells + 14 pieces out of the chamber's 562 + 382.
- **NO LOADING CARD (2)**: battle.js `showBattleLoadingScreen` — a latched encounter (`_encMatch`) takes the
  auto-sim path: the warmers still fire, the board boots on a microtask, the renderer swaps the party's GLBs in
  as they land (a cold model is a stand-in for a moment, never a card). VS-CPU only, so no start barrier is skipped.
- **THE SWOOP (3)**: three-camera.js — while the seed eases, the camera is TWEENED (`_seedFrom` → the frame's
  ideal, smoothstep over the window, `_seedT0 / _seedEase`) instead of damped: a damp started fast and settled
  slow, which read as a jump then a drift; the tween is one continuous crane from the walker's eye up to the
  board's angle, landing exactly at the window's end (1.4 s from battle.js `seedPose(eye, 1.4)`), the ordinary
  damp after. THE DISSOLVE is no longer a crossfade on a timer: `_hqDissolveStart(H, { onFrame: true, hold, ms })`
  HOLDS the room's last frame until the battle's FIRST frame has rendered (`renderFrame` → `_hqDissolveFrame`;
  `hold` 1500 is the cap) and only then fades it over 220 ms — so the gap while the board builds is the room's
  own frame, and the fade lands over the battle's first frame from THE EYE (the same viewpoint). map.js
  `_hqEncounterStart` asks for exactly that.
- **NOT built**: the room's fluid sheets ticked in battle (the battle's fluid material animates on its own
  shared uniform; the cave's own `_hqTickMoat` does not run — unseen); the crag's height against the field's
  rock columns at the window's rim (a cave rock cell inside the window is drawn by BOTH — the crag box hides the
  column; a grazing angle may show a seam at the base); the console's crossing; stage D / E.
- **Tests**: hq-field.test.js (the cave layout: inert world, no roster, no stars), hq-room-in-battle.test.js
  (the reader takes a cave; the build order + the hole guards), hq-encounter.test.js (the on-frame dissolve,
  the no-card path, the tween). `npm test` 1512 / 1508 / 0 / 4 skipped.
- **UNSEEN LIVE (RULE #1c)**: the swoop's feel (1.4 s smoothstep from a 1.6 m eye to the boom — `seedPose`'s
  second argument is the edit), the held frame's fade over the first battle frame (an HQ boom vs the battle's
  FOV frames the same eye differently — a visible pop is possible), the party's GLBs popping in without the
  card, the black sky over the chamber (a fog colour edit on Hollow Earth's row if it reads too flat), the
  crag inside the window, the stalactites' fade under the boom.

### 2026-09-16 — PHASE 9 DELIVERY 12 · THE FIELD, STAGES D + E (THE EDGE + THE HUD OF THE FIELD) — local delivery
PHASE9_QUALITY_PLAN §11.3 D and E, the last two stages of THE FIELD. The room is the geometry, the 8 × 8 is a
window laid over it (§11.2 rule 1) — stage D is about where the window's RIM falls against the room's real walls.
- **THE BUG THE EDGE FIXES**: a box room's lattice offset per axis was 0 or half a cell, whichever gave the most
  cells. An OUT partial cell is a ROCK COLUMN filling its whole cell, so its inside share stands INSIDE the room in
  front of the true wall (a step of "wall" the eye sees before the real one; a door in that wall buried behind it).
  The hold (16 m = 9 cells + 0.25) got 9 cells with a METRE of rock proud of BOTH long walls; the most-cells rule
  preferred that to 8 flush cells. **THE ALIGNMENT** (data.js `hqFieldBoxInfo`'s `axis`): candidates = the exact
  alignments (the lo wall on an edge, the hi wall on an edge, the two partials shared, 0, half a cell) then a
  0.05 m sweep; score = Σ proud × (1 + `doorWeight` × the doors on that wall), then the most IN cells, then the
  smallest offset; an exact alignment wins any tie. Proved (hq-field.test.js "THE FRAME'S ALIGNMENT"): proud ≤
  `proudMax` 0.8 on every part (measured 0.75 max, the attic's and the subway's short axes), at most one proud wall
  per axis (a residue r < 0.8 m goes on one wall, the other exact; r ≥ 0.8 splits into two IN partials with
  nothing proud), a wall with doors flush whenever the opposite wall has none, never worse than the old rule.
  `bi.edges = { w, e, n, s: { proud, flush, doors, at } }` is the record; `bi.colsX / colsZ` the columns.
- **THE RIM + THE DOORS ON THE FRAME** (`hqFieldRimBox`, run by `hqFieldRasterBox`): every OUT cell with an IN
  cardinal neighbour wears `edge: 'wall'` and `proud` (the rock inside the room past the wall — 0 off the lattice
  or on an exact edge); `R.doors` = every room door whose landing (the first IN cell inward from its wall, in the
  door's own column) lies in the window: `{ id, wall, rim, x, y (the rim cell), inX, inY, proud, flush, link,
  wide }`, the rim cell marked `door`. NOTHING of it reaches the engine (rule §10): the rim IS rock. It is the
  record the dump, the test and any future reader take (`entry.field.doors / edges / dump`).
- **NOT built, by decision**: (1) the THIN-WALL primitive on the rim (§11.2 rule 3's `M.wall`) — the engine
  vaults a 1–2 cell thin wall (jump-2 races), hovers over it (flyers, outside Mystery Dungeon) and breaches it
  (a heavy body, `_tryBreachThinWall`), so a floor strip beyond the true wall fenced by one is not sealed and a
  unit could stand in the void behind the room's wall; the rock column is the honest cell and the true wall is
  what §10 stage 4 draws — the alignment above is what makes them agree. (2) the door as the party's ARRIVAL
  threshold (rule 7's first text): superseded by the user's seat rule (Delivery 6 — the parties stand on the cells
  beside their leads); the rim doors are recorded, not walked. (3) a CHASM cell (an open room's edge): every wild
  box room today is walled; the rule waits for the first open complex part.
- **THE DUMP** (stage D's acceptance): `hqFieldDump(R, { walker, target, seats })` → eight lines ('#' rock ·
  '%' rock proud of the wall by more than `edgeSnap` 0.3 · '.' the floor · '1' / '2' a level up · '!' a hazard ·
  'D' a door's rim cell · W / T / a / b the walker, the target, the seats), on every built entry as
  `field.dump`; **`node check-field-windows.js [--all] [--json] [room]`** prints every wild room's window from
  its first (every) door landing with the walls' proud, the rim doors, the reach and the seats, and exits 1 on a
  window without a legal field (none today — 21 rooms, 0 without). READ IT: the grids are the user's review.
- **LEGALITY FROM EVERYWHERE** (hq-field.test.js): from every cell the walker can stand on (a cave: every walkable
  cell; a box: every IN cell that is the floor or a top within the jump's reach) in every wild room, with the
  native on a neighbouring floor cell, the window holds both feet, the walker's cell is IN, the reach is ≥ 8 and
  both squads of four seat (≥ 1500 windows). One rule fixed on the way — **a lead never displaces the other
  lead** (`hqEncounterSeats`): the walker nudged off a table top used to take the native's own cell; the native's
  wish is held while the walker is seated. The tool's run is part of the test.
- **STAGE E — THE HUD OF THE FIELD**: the scoreboard's mode line reads **THE FIELD · TEAM DEATHMATCH** (or ·
  ARENA on a Code Red) while an encounter is live — hud.js reads battle.js `_ewEncounterField()` (the latched run;
  null in every ordinary match) and `HQ_FIELD_RULES.hudLabel`; the result stamp's site line reads **HELD /
  EXITED · THE ENCOUNTER · THE HAUNTED HOUSE · THE HALL · <the native>** with the mastery flag it filed after it
  (battle.js `_stampHqSite` READS `window._hqEncounterResult`, never consumes it — the return spends it; a Code
  Red cleared still outranks); the pause menu's OFFICER row reads `LAST GHOST IN THE CAVE · THE FISSURE (HELD)`.
  **`hqEncounterRoomLabel(roomId)`** (data.js, on `window`) is the ONE wording: a room's own label, a site's
  board room the site's label, never a room id.
- **Files**: data.js (the rules, the lattice, the rim, the dump, the seat rule, the label; R2), battle.js (the
  stamp), map.js (the OFFICER row), hud.js (the scoreboard line), index.html (`20260916-field-edge-14-cors`);
  repo: hq-field.test.js (+5 tests, 18), check-field-windows.js, PHASE9_QUALITY_PLAN.md, CLAUDE.md, this log.
- **UNSEEN LIVE (RULE #1c)**: the rim against the real wall in a part with a residue (the attic's north wall, the
  casino's east, the subway's north — 0.25–0.75 m of the wall sheet standing in front of the true wall), the
  scoreboard line's width with the tag, the stamp's length on the result card.

### 2026-09-16 — THE MAP · the directory as a subway map (discovery, the reveal) — local delivery
The user: "a map for exploration, it can also be the Directory (the current directory is just a huge list) —
interactable, subway nodes trying to make sense of the impossible architecture; undiscovered rooms don't show
or show a question mark; every open after a discovery animates the question marks into room numbers, zooms out
to reveal more, draws a node line between two previously unconnected points."
- **THE LEDGER**: `hqRoomSee` / `hqRoomsSeenRecord` (data.js) — a room is on the map once the officer has STOOD
  in it; both records, the synced blob `hq.rooms.seen` (merge + fold, like the links). map.js `_hqEnter` files it.
- **THE GRAPH + THE LAYOUT** (`hqMapGraph` / `hqMapLayout`): 134 rooms reachable from the foyer, 200 typed edges;
  a deterministic, collision-free placement (the hall, the rings, the hall's doors at their angle, the sites at their
  thresholds' angles, the shaft with a band per floor, H-Wing under it, the rest walked into free cells).
- **THE MODEL** (`hqMapModel`): here / seen / `?` / off the sheet; a secret door only once both rooms are seen;
  a seam charted by walking it. **THE PANEL**: the SVG, pan + zoom, the card with GO, the register + the lines
  folded under `<details>`. **THE REVEAL** (`_hqMapAfterRender`): the diff against `door.hq.map` — flip / pop /
  qin / draw + the zoom-out.
- Files: data.js (→ R2 AND Render), map.js, styles-base.css → R2; index.html → Render (`20260916-the-map-15-cors`);
  repo: hq-map.test.js (7), achievements.test.js (the empty-merge pin grows `rooms`), CLAUDE.md, this log.
- **UNSEEN LIVE (RULE #1c)**: the whole look. First things to eyeball: the ring circles against the nodes at the fit
  zoom, the labels' size, the `?` flip's timing, the zoom-out from a one-room map to the hall's, the drag under the
  panel's scroll.

### 2026-09-16 — THE WOODS FIXES · the trees, the flight, the storm drain (the user's visual pass) — local delivery
The user: "There are no woods. Where are all the trees? Use the glb trees. Dead Man's Cave needs to literally be a
sewer like a narrow hallway. The stairway in the woods should not be made out of terrain blocks when we already have
stairs in the game." Photographed offline before and after (`playtest_hq_offline.js`, stand-in textures, the OBJ
foliage 404s so the trunk-and-sphere stand-ins are what the shots show).
- **WHY THERE WERE NO TREES**: three-renderer.js `_hqBuildCave` handed `_nrTree` a bare `{ ts, rng }` — the
  procedural stand-in reads `K.cyl / K.mat / K.lit`, threw, and the `try / catch` round the call swallowed it, so
  not one tree cell in the seven rooms was ever planted (and the OBJ swap never had a group to land in). The kit is
  a REAL `_nrKit` on the shell group now (the site board's own rule, `hq: { w: 0, gap: 0, B: 1 }`), each broadleaf
  cell also grows a smaller second tree (undergrowth), and **THE TREELINE**: `hqWoodsShell` wears `forest: { depth
  10.5, spacing 2.5, rows 2.3, start 1.4 }` (metres) → rings of the same foliage models on the apron PAST the grid,
  jittered, dead trees + redwoods mixed in, every door's lane kept clear for the first 4.6 m (the panel stands on the
  shell wall). The clearing plants ~314 past its grid + its cells (the trail ~190); `EW_PERF_LOW` halves the rings.
  Six more `T` cells inside the clearing's grid. **The models are the foliage OBJs** (`Assets/foilage/OBJ/Tree_1…`
  — the only tree the kit has; there is no tree GLB in any bucket, see the wish-list below).
- **THE FLIGHT**: a cave legend row may carry `stair: '<sheet>'` (+ `stairSide`) on a SLOPE cell — `hqCaveCompile`
  carries it, `_hqBuildCave`'s ramp pass draws that cell as the board's OWN barrier_passage flight
  (`_buildStairMesh`: STAIR_STEPS treads + risers, the side strings, the back wall) rising one level toward the slope
  side; the walker climbs it as the slope it is. The staircase room's `E G I M` are four such cells in `wood_planks`
  (lvl 0→1→2→3→4) up to the `J` landing (lvl 4, the door's sill 3.5 m). Never a skate ramp.
- **THE STORM DRAIN**: `site_prebuilt_fairy_forest_deadmans` is the woods' one INDOOR part — a closed box (h 3.0, no
  sky, the service corridors' concrete, `pipes: false`, lit by three `bare_bulb`s + two `flicker_tube`s) on a 20 × 13
  cave grid that is BRICK (`rock: 'bricks_2'`, to the ceiling) but for a 3-cell culvert west → east: the channel `~`
  down its middle (waded), a walkway either side, THE SUMP halfway (a 6 × 5 chamber, the channel widening south, an
  inspection ledge lvl 1 with the ramp `m` = the park rule's ramp, its rail), the grate (`links.woods_sewer`, z 0
  now) at the east end. `cave.stalactites: false` (the renderer's `nSt` reads it — no stalactites of concrete). Four
  graffiti tags against the brick, the ghoul on the walkway, the gangster by the grate.
- Files: three-renderer.js, data.js → R2 (data.js → Render too, as always since the ledger); index.html → Render
  (`20260916-the-woods-18-cors`); repo: hq-woods.test.js (10 — the sewer's rules, the flight, the kit, the
  treeline), playtest_hq_offline.js (drops the pause menu before a shot), CLAUDE.md, PLAYTEST_NOTES.md, this log.
- **UNSEEN LIVE (RULE #1c)**: the foliage OBJs at these heights and this density (the stand-ins are what was
  photographed), the treeline's draw-call cost on a low machine (`forest.depth` / `spacing` are the dials), the
  wood sheet on the treads, the sump's water under the bulbs.
- **WISH-LIST (Meshy GLBs that would carry the woods)**: a broadleaf tree + a pine/fir + a dead snag (the OBJ set is
  ten low-poly trunks with the leaves sheet wrapped on; a textured GLB canopy would read at walker scale), a fallen
  log, a stump, a bush / fern clump, a boulder pair, a wooden signpost with arms, a rope-and-plank footbridge, a
  campfire ring with logs, a standing stone (the ritual ground's `S` cells are terrain blocks), a storm-drain grate +
  a culvert mouth, a brick arch section, a rusted ladder, a wooden staircase section (the flight is the board's
  procedural treads; a GLB flight on posts would let the landing float instead of standing on a 3.5 m plank block).

### 2026-09-16 — THE SHIP'S ONE DOOR · THE PLANET FLOOR · THE ROCKS · THE PYRAMID ON MARS — local delivery
The user's four: "Spaceship — one door to the destination planet, must set destination in pilot room / cockpit, then
the door will lead to that planet. Planets are missing floor. Mars needs the glb pyramid. I don't like these pointy
cone things, they don't look realistic at all — use the boulders or asteroids or stones instead and tint them to match
the landscape / planet / map."
- **THE SHIP'S ONE DOOR** (data.js `DOOR_HQ.ship`, the ship block before `hqWorldGraph`; map.js THE NAV CONSOLE): the
  airlock's two collars are ONE — `collar` on the port wall, an authored door whose action is `{ ship: true }`. Both
  Lunar-route ends are DOCKED on it (`{ site, part: 'airlock', door: 'collar' }` — a link end that names the room's
  own door: `hqLinkEndOk` accepts it, `hqLinkEndWear` reads the door's leaf, `hqLinkDoors` generates NOTHING at that
  end and lands the far end AT the door; only a ship door takes a dock — `hqLinkDockedDoor`). The bridge's new counter
  `nav` (THE NAV CONSOLE, overlay `nav`, map.js `_hqNavHtml`) lists every destination (`hqShipDestinations()` = every
  link docked on the collar, in sheet order: room · landing door · the site's label + number) with SET COURSE
  (`[data-course]` → `window._hqSetCourse` → `hqShipSetCourse`, one profile transaction, `door.hq.ship = { dest,
  set }`, viewer-local, never synced) and CLEAR THE COURSE. The collar: `_hqDoorDirectAction` resolves `act.ship`
  through `hqShipResolve(profile)` → straight through to the course's room at its own link door (the walk charts the
  link — `_hqDoAction` records `link_<id>`); no course → the panel, which lists the ports and names the bridge.
  `hqShipApplyCourse(profile)` re-plates the collar on every room entry (`_hqEnter`): `COURSE LAID IN · ROOM 1969 ·
  MOON`, and `hqDoorNo` reads the destination's number off `_courseNo` (never `roomNo` — the register would list the
  port twice). `hqWorldGraph` gives the collar one edge per destination, so THE MAP and the directory guard still reach
  both planets from the ship; the Lunar line's stations are unchanged. hq-spaceship.test.js and hq-world.test.js own
  the contract (a dock on a non-ship door holds the link; a docked end never names a wall). Adding a port = one
  `links` row docked on the collar.
- **THE PLANET FLOOR** (three-renderer.js `_hqBuildSetting`): the planet ground (`_wdBuildPlanet` under `o.hq` — the
  island and the far ring, carved and curved so never `flat`) was CULLED by the setting's "in a door zone" rule the
  moment it was built — every planet room stood on the sky (the flat floor had been hidden under a mesh that was
  gone; the collar survived because it is flat). The meshes wear `_ew_hqPlanet` now and the cull keeps them. Measured
  offline (`playtest_hq_offline.js site_prebuilt_mars`: before, only `world:collar` in the scene; after, collar +
  island + planet, the regolith to the horizon). The planet ground + its rim now build at the ROOM's tile
  (`_hzKitTs`), and `K._wdFog` is set there so a rim GLB that lands later joins the haze.
- **THE ROCKS** (three-renderer.js `_hzRock`, before `_nrMounds`): no cone anywhere a mountain, mesa, stalagmite or
  spire stood — `_nrPeaks`, `_nrSpires`, `_WD_RIM.peaks` (a mesa = the boulder squashed to 0.6 of its height),
  `_WD_RIM.spires` place the user's rock GLBs (`asteroid_a` = the boulder, `asteroid_b` = the crag, `standingstone` =
  the tall stone) wearing a TINTED Lambert (`_hzRockPick`: the bake as the grain, the map's colour over it — the same
  `K.mat` tint the cone wore, so THE ONE TINT rule holds — the rim's self-lit lift), sized by span (the old cone's
  foot), stretched toward the old cone's height (`grp.scale.y`, clamped 0.55–2.4), sunk 16 % into the ground, turned
  any way, a snow cap (a squashed sphere on the top) where the row had one; `_hzDoorKitGLB` / `_hzMiscKit` take
  `matPick` + `onDone` for it; the walkable site room gets a collision foot before the GLB lands (`_ew_footM`). The
  fallback (no loader / EW_PERF_LOW) is a jostled dodecahedron in the same sheet — a rock, never a cone. Kept as they
  were: the pyramids (`_WD_RIM.pyramids`, Technoticlan / Giza) and the icebergs.
- **THE PYRAMID ON MARS** (`_NR_BUILDERS.mars`): the Cydonia pyramid — `_hzModelPyramid(rng, { h: 9.5, color:
  0xc27a56, lift: 0.22, cap: false })` off the far north-west corner past the big mesa (11.5 × 9.5 tiles out), a keep-
  out so no crater is carved under it, half a tile sunk; the helper takes options now (a LIT tinted Lambert when
  `color` is given; the plain call is still the unlit sandstone the rosters hang) and sizes against THE KIT TILE, so
  the site room inherits it at the room's scale.
- UNSEEN LIVE (RULE #1c): the rock GLBs' silhouettes against the horizon (the offline shots show the dodecahedron
  fallback), the tint on the bake (a rock that reads too dark = `lift` on the row), the standing stone as a stalagmite,
  the pyramid's size against the mesas, the collar's plate wording, the nav console's rows on the CRT.


### 2026-09-16 — THE HQ HUD PASS · the exploring HUD wears the battle HUD's themes — local delivery
- The user's brief: the HQ HUD "has gotten ridiculous … a dark box with a gold or purple outline"; use the battle
  HUD's colour themes + rounded aesthetic; the room's name replaces D.O.O.R. HEADQUARTERS top-left (no grey box); no
  skate score / tapes count on the strip unless live; no main-menu button; M opens the map; a map node click takes
  you there.
- styles-base.css "THE HQ HUD PASS" (appended at the end, the battle HUD's own "restyle after, never upstream"
  rule): `#hqPage` maps `--hq-*` onto hud.js's `--ew-*` theme tokens; strip / prompt / toast / trick line / panel
  card / pause frame + blades / map stage + card / buttons / door plates restyled. hud.js injects its stylesheet at
  script load (the tokens must exist before any battle).
- index.html: `#hqRoomTitle` (the room) + `#hqRoomName` (the building · number · sub); DIRECTORY / EXIT buttons
  removed (the pause menu's); hint `M map`. map.js: `_hqStripFlash` / `_hqStripPillLive` (tapes on a find, threshold
  on a shot, Form 365 on arrival / a ticking return; skate while riding only); `onHotkey('m')` toggles the directory;
  a second click on the picked node = `_hqDoAction({ room, at })`. three-renderer.js: `m` in `_hqKeyName` (after `d`),
  the M branch before the pause gate, the battle marker's plate wears its class only.
- UNSEEN LIVE (RULE #1c): the whole look — the plates' material under each room's light, the floating door labels
  against pale walls, the strip's wrap at narrow widths, the pills' fade, the light themes (parchment) in the building.

### 2026-09-17 — THE TERRAIN ROOMS · the cave and the woods as smooth height fields (9.3 stage 4) + THE WOODS BATCH — local delivery
- The user's brief (verbatim, the priority): "forget trying to make the complex areas seamless with the battle maps.
  Make the exploratory areas more complex with different smooth elevations like ridges and ledges and winding
  pathways and inclines and hills and dips and walls … 3D platforming for door gun puzzles and ramp-like obstacles
  and tall platforms for skateboarding tricks and big huge jumps. Difficult to get to / hard to see areas for the
  VHS tapes. Redo the cave and the woods (the ASCII map generation) … the battle map should still look like the
  area but it is not a priority that the explorable area map to a grid." Phase 9's §11 THE FIELD (the room as the
  8×8) is therefore CLOSED for these rooms: `hqFieldRoomOk` refuses a terrain room and the encounter fights the
  site's Δ. The box parts (the house, the ship, the Dutchman, the Strip, Downtown) keep their windows.
- data.js: `terrain` on a box room (the feature vocabulary, the pads, the walker's rule, the solver, the dump) —
  CLAUDE.md "THE TERRAIN ROOMS" has the whole contract. Fourteen rooms re-authored; the shells sized by hand (the
  grid no longer fits them); the tier doors carry `y` (the cavern's blast 5.25 / vent 3.5; the link ends of the
  fissure / LEVEL −6 / the mouth 1.75, Shasta's and the EXIT door 3.5 — `hqLinkDoors` copies an end's `y`).
- three-renderer.js: `_hqBuildTerrain` + `_hqTerrainMat` + `_hqPlantTreeline` (shared); the walker / air / camera /
  sill / landing / ground reads; `_hqPortalLedgeSnap`'s terrain branch (the lip on a pinnacle); `_hqTreeWay`
  (the two ways); the near settings dressed with the batch.
- THE WOODS BATCH: MODEL_INDEX §3e. The seams: the fairy forest's way in is THE HOLLOW TREE (both ends); the
  pasture's garden gate is THE DEAD TREE (both ends); a new `deadtree_lookingglass` link (the ritual ground ⇄ the
  Looking-Glass's north strip, both ends free).
- Tests: hq-terrain.test.js (new), hq-cave / hq-woods rewritten for the fields, hq-field (stage B vacuous, stage D's
  sweep over the box parts), hq-finds, hq-room-in-battle (a synthetic cave), hq-world (the seams), doorhq (the mast
  rule). `node check-terrain.js` dumps every field. Full suite 1536 / 0 / 6 skipped.
- NOT BUILT: waterfalls where a stream steps down a tier; the footbridge GLB standing on its deck (the decks are
  drawn planks; the GLB is catalogued); the rider's grind on a SLOPED rail (a rail registers at its mean height);
  a room's furniture in the site Δ fight (§10 stage 4 stands for the box parts only). The user's follow-up: "the
  8×8 with the floating battle icon can be specific rooms inside those places, eventually."
- UNSEEN LIVE (RULE #1c): everything — the field's look (the cliff / path blend, the water sheets, the crag at
  the walls), the walker on the ramps and off the ledges, the drop off THE HIGH TIER, the stair ramp's treads,
  the fence walls under the rider, the tree ways' GLBs (hole facing), the batch's scales, the lip snap.

### 2026-09-17 — THE FLOOR PLANS (9.3 stage 5) + THE ROOM LOOKS + THE VIDEO SETTINGS EVERYWHERE (local delivery)
- The user: room / hallway generation (cellular automata, random room placing) instead of big boxes; the square edge of
  the landscape shows where the fog should be; the whole area outlined in wood planks; keep making the woods and the
  cave better (an exploratory, nostalgic, mysterious fantasy retro vibe — NeverEnding Story / Princess Bride / Oz /
  Wind Waker / Ocarina); graphics settings per map; the video settings in the pause menu outside a battle.
- `terrain.gen` on thirteen rooms (data.js `_hqTGenerate`, `HQ_TERRAIN_GEN`): the seven cave chambers wear a
  cellular-automata plan (rock to 3.2 m between the authored tiers — the cavern grew rock masses across its plain, the
  well room keeps its tiers and pools with rock leaning on them), the six open woods rooms a clearings-and-corridors
  plan (a 1.7 m thicket bank with the forest on it — the Lost Woods' hedge). Every authored feature is forced open;
  every door still reaches every other (a corridor is carved along the walker's own path where it would not); open =
  reachable. `node check-terrain.js` prints each plan's open share (51–75 %).
- The fog: the woods' sky carries a per-metre density now (0.03); the cave chambers a warm dark haze of their own; the
  paving kerb and the flat apron are gone under a field — the field's own ground runs 54 m out, rolling and falling
  away under the fog, the treeline on it.
- THE LOOKS (`HQ_ROOM_LOOKS`, `shell.look`, `env.look` → `ThreePost.setSceneLook`): the woods Dreamy + a vignette + the
  bloom up; the cave the amber; the drain / the Haunted House green; the Backrooms faded; Hell amber. An overlay over
  the player's own settings, never a saved preference; Settings → Graphics → Map Looks refuses them.
- THE VIDEO SETTINGS EVERYWHERE: ui.js `_buildVideoSettingsHTML` — the battle pause menu's VIDEO tab, the main menu's
  Settings and the HQ pause menu's SETTINGS render one sheet (the battle-only rows gated).
- Tests: hq-floor-plan.test.js (new); hq-terrain / hq-cave / hq-woods / hq-finds / hq-map-remembers / the settings
  tests pass unchanged. Token `20260917-floor-plans-01-cors`.
- NOT BUILT: a plan on the site BOARD rooms (the walkway round a Δ is the console's); pillars / stalagmites standing
  on the cave plan's islands (the rock masses are bare); ferns along the thicket's foot; a plan seed per VISIT (the
  seed is the room's — the map is stable so the tapes stay where the officer left them).
- UNSEEN LIVE (RULE #1c): all of it — the rock masses' sheet and shading, the thicket banks under the trees, the outer
  ground's swell, the fog density, each look's strength, the settings sheet in the pause overlay.

### 2026-09-17 — THE DIVINE STAIR (complex candidate #4: HEAVEN · HELL · THE VATICAN · THE CATACOMBS · THE STAIRWAY), local delivery
The first complex after the blueprint rule — chosen because it needs no new site (the 7.10 checklist stays shut)
and every room is a terrain room the kit already draws. Four parts on three sites, joined by seams:
- **THE CATACOMBS** (`site_prebuilt_vatican_catacombs`, 38.5 × 31.5 m, closed, brick, `gen: cave`, the teal
  `catacombs` look under candles): the crypt stair down from the Vatican's north wall at x −10 (THE WAY IN);
  the ossuary shelf (1.75 m) up a brick stair with cell bars over the loculi; THE SUNKEN CHAPEL — a bowl round a
  waded font, the altar and the lectern on its rim; two sarcophagus rows (low marble walls the rider grinds);
  THE SKULL STACK (3.4 m, the door gun's tape); the warm wall on the east (the crypt link, re-pointed), the foot
  of the stair on the north (`links.catacombs_stair`, `leaf_frame_only` — "nobody has ever wanted to shut it").
- **THE PIT** (`site_prebuilt_hell_pit`, 35 × 35 m, closed, obsidian, `gen: cave`, the `hell` look): the mouth
  from Hell's north wall at x −10; THE LAVA RIVER across the south with THE CAUSEWAY (an obsidian deck spanning
  both banks); THE BOWL (a 2.4 m dip) walked down round the lava at its heart; THE GALLERY LEDGE up a ramp kept
  outside the bowl; THE PLINTH (3.6 m, the colossus's chains running to the wall — the tape); the basalt wall.
- **THE STAIRWAY** (`site_prebuilt_heaven_stair`, 31.5 × 42 m, OPEN under Heaven's sky via `hqDivineShell`,
  `gen: rooms` with `thicket: false` = cloud banks, no trees; the `heaven` look, bloom up, no night): FOUR
  FLIGHTS of cloud stairs in switchbacks — 0 → 3.5 (the first landing, the healing pool, the fountain) → 7 → 10
  → 12 (the top landing, the gate's door ON it at `y: 12`, the seraph at the book); THE PINNACLE (5.2 m) off the
  first landing — the tape the door gun reaches; columns at the foot, the landing and the gate.
- **THE CLOUD FIELDS** (`site_prebuilt_heaven_gate`, 42 × 35 m, open, `gen: rooms`, no thicket): the top of the
  stair on the south; cloud islands joined by cloud bridges; THE RIFT (`deep_water`, bottomless) with THE PLANK
  over it; THE DAIS (1.75 m) with THE PEARLY WALLS either side of the steps (walls the rider jumps onto) and THE
  GATE — Room 777's hotel door — at its back, out onto Heaven's board (its north wall at x −0.2); THE PILLAR OF
  LIGHT (4.6 m, the tape); two healing pools; the book beside the gate.
- THE SEAMS: `links.vatican_hell` RE-POINTED from the two board rooms (n x −10 both) onto the catacombs' east
  wall ⇄ the pit's west wall (the id kept — a charted route stays charted; both lanes went to the back doors);
  `links.catacombs_stair` new. The divine line reads four legs; hq-world / hq-map / the directory guard pass.
- THE TWO RAMP RULES the solver taught (both flights refused at first): a flight ENDS 0.3 m INSIDE the upper
  landing's edge (past it there is a hole between the ramp's end and the tier's 0.35 m edge blend) and STARTS
  ≥ 0.4 m inside the lower one (the ramp tolerates only 0.18 m before its own start). Written into the rooms.
- Tests: `hq-divine.test.js` (8); hq-floor-plan's "solid stands high" rule now measures against the AUTHORED
  floor under the cell (`info.hFn`) — a row-walk to the nearest open cell judged a cloud bank at the floor
  against a 12 m landing; its thicket rule reads `gen.thicket !== false`; hq-terrain's tree rule is the woods'
  only; the counts are 18 / 17. Full suite 1553 / 0 / 6 skipped. Token `20260917-divine-stair-01-cors`.
- ASSETS THAT WOULD LIFT IT (MODEL_INDEX §3f — stand-ins today): a SKULL WALL / ossuary panel and a SKULL PILE
  (the stack is a `cloud_thick`-less brick pinnacle; the loculi are `cell_bars`), a SARCOPHAGUS (the rows are
  low marble walls), a CANDELABRA / bone chandelier (the `ship_lantern` hangs there), a CONFESSIONAL booth, an
  ANGEL STATUE and a PEARLY GATE (the gate is `leaf_hotel` on a marble wall — the canon says frosted for
  modesty, so a hotel door is defensible), a HARP, a CLOUD PUFF prop, a CHAINED COLOSSUS / demon statue for the
  plinth, a BRAZIER, a broken COLUMN, a bone-and-obsidian STAIR SEGMENT. Every one lands as a `DOOR_HQ.catalogue`
  row with `base: 'misc'` + a prop line; nothing in the renderer.
- NOT BUILT: a fifth part (THE CONFESSIONAL as a room off the catacombs; the choir loft over the fields); the
  colossus itself (the plinth is bare); a `way` seam (a mirror in the chapel ⇄ the Looking-Glass); the Vatican's
  own interior (the basilica floor, the archive) — the next rooms of this complex if the user wants it grown.
- UNSEEN LIVE (RULE #1c): all of it — the cloud banks in `cloud_thick` (if they read as walls, the sheet on
  `terrain.cliff` is the edit), the treads at 12 m and the boom over the void, the lava under the causeway, the
  frame-only foot, the teal grade on brick, the column GLB's scale (`greek_column.h`).

### 2026-09-17 — THE DIVINE STAIR, second delivery: THE VATICAN (five parts), THE FALL, THE RETURN GUARANTEE, THE VATICAN BATCH
The user: "use these assets [24 GLBs in Assets/misc] to continue improving the divine complex; the Vatican needs to be
a bigger building — library, mass, courtyard; catacombs underneath it; the stairway at the top dome room, in the
observatory with the telescope — activating it lets you see the stairway in the sky and enter it; the stairway
entrance should NOT be in the catacombs; there is a part in the clouds where you can fall and get trapped between
walls of cloud — make sure that doesn't happen during room generation; multiple levels of pathways in the same area,
falling down you have to find your way back up; clouds are perfect for floating platforming."
- **THE RETURN GUARANTEE** (data.js `_hqTReturnGuarantee`, run by `_hqTGenerate` AFTER the door guarantee on the RISEN
  field, and by `hqTerrainCompile` for a room with no plan): every cell the walker can reach from the door pads WITH
  ITS JUMP (`HQ_TERRAIN_RULES.jump` 1.3 — a hop onto a low bank counts, a cliff does not; any drop) must reach a pad
  again the same way. A TRAP component gets A RESCUE RAMP (`_hqTRescuePath`: the shortest way over the field from the
  trap to returning ground whose rise fits `rescueSlope` 0.7 — phase 1 never crosses returning ground, phase 2 may
  notch through it; the cut (`_hqTLayRamp`) opens the plan's solid and fills lower ground up to the incline but never
  lowers higher open ground beside the path; a cut that breaks a door route is undone and its landing banned, six
  tries) — else the trap is SEALED (solid; a forced cell only as a last resort, `info.sealedCells`; never a pad; a
  seal that cuts a door off is undone). Repeated until nothing traps; `info.rescues` lists the ramps. Reads:
  **`hqTerrainTraps(info)`** (empty = the room passes; hq-terrain.test.js insists on it for every room; check-terrain.js
  prints TRAPS / rescue ramps cut). Found on the way: every cloud room and cave chamber had pockets (the stairway's
  ground under the flights, the cavern's floor slots); the pit's GALLERY LEDGE was never reachable (its ramp ended
  0.3 m short); THE RAMP RULE is sharper — a ramp ends **0.7 m inside** its tier's rect (past the 0.35 m edge blend
  AND the next 0.5 m sample; a 0.3 m end sampled a hole) — hq-divine.test.js proves every ramp's top is walked to.
- **THE VATICAN** (data.js, the block before THE PIT): `site_prebuilt_vatican_basilica` (mass — the nave 36 × 52 × 16,
  the chancel 0.9, the altar steps, TWO TRIFORIUM GALLERIES at 4.6 up stairs behind the chancel, the altar rail a
  step, the organ loft 6.4 = the tape; pews, columns, the podium, the cathedra, the cross, six windows, the carpet, the
  confessionals, the braziers; doors: the piazza s, the archive w, the cortile e, THE CRYPT n on the chancel at y 0.9),
  `_library` (THE SECRET ARCHIVE — `gen: cave` in the `wood` sheet = the stacks 5.6 m, `crag: false`; the reading well,
  the gallery at 4.0 up the east stair, THE DOME STAIR's door on it at y 4; the high shelf 6.2 = the tape), `_courtyard`
  (THE CORTILE — `hqVaticanShell`: open behind a parapet under the Vatican's own sky; `gen: rooms` with a cypress
  thicket = the garden maze; the fountain's bowl, THE TERRACE 1.2 under the `church_building` façade, the palace wings,
  the arcade, the campanile's stump 4.4 = the tape; THE CISTERN — a `way: 'well'` DOOR ROW (free, hand-authored, the
  first inside a site) down into the catacombs' north), `_observatory` (THE DOME — `hqVaticanShell({ night: true })`,
  the dais 1.2, the finial 4.4 = the tape, THE TELESCOPE at the dais's heart, THE STAIRWAY IN THE SKY hung due north:
  `shell.sky.landmarks: [{ kind: 'stairway' }]` → three-renderer.js `_hqLandmarkBuilders.stairway`). The catacombs'
  way in is the basilica's crypt door now (the board's white door opens on THE BASILICA: `backDoors.prebuilt_vatican`
  id `basilica`); its north link door is gone.
- **THE TELESCOPE IS THE SEAM**: `links.observatory_stair` (route `divine`, `way: 'telescope'`) — a `wall: 'free'` end
  on the observatory part (the eyepiece to the south, face 180) ⇄ the stair's south wall with `leaf: 'leaf_frame_only'`
  (a plain door back). `DOOR_HQ.ways.telescope` (verb LOOK, sfx `wayScope`), `_hqWayBuilders.telescope` (the tripod, the
  tube aimed −Z and up, the lens; the GLB `brass_telescope` over it; the press-in tilts the tube onto the stair and the
  lens flares), audio.js `wayScope`. `links.catacombs_stair` is GONE (the user's rule). The divine line still reads four
  legs (heaven_olympus · vatican_heaven · vatican_hell · observatory_stair).
- **THE STAIRWAY rebuilt (40 × 54 × 18)**: the four flights kept (0 → 3.5 → 7 → 10 → 12) + THE FALL — THE LOWER SHELF
  (2 m, east, its own incline from the foot), THE LONG WAY (a winding incline up the west to THE WEST SHELF at 6 m and
  three steps onto the second landing — the way back for whoever falls west), THE STEPPING CLOUDS (hop-high columns:
  the shelf → the first landing, the first landing → the west shelf, a lookout beside flight C), THE PINNACLE on the
  lower shelf (6 m, the tape; `findSpots` moved to (17, 8)), `white_cloud` props hung in the air (`y`, foot 0) and
  scattered on the floor. The compiler still cut nine rescue ramps between the cloud banks — every fall returns.
- **THE VATICAN BATCH** (MODEL_INDEX §3g): 24 `_MISC_GLB` rows + 24 `DOOR_HQ.catalogue` rows (`base: 'misc'`); the
  catacombs took the skull piles, the sarcophagi (on the tomb rows), the bone walls, the booth; the pit the demon and
  the braziers; the fields THE PEARLY GATE (open in the gap of the pearly walls; the hotel door stays the leaf), the
  angels, the clouds. Tapes: four re-homed (Camelot's, Agartha's, CERN's, Area 51's second) — every site keeps one.
  Looks: `HQ_ROOM_LOOKS.basilica` / `.archive` / `.observatory`.
- Tests: hq-divine.test.js rewritten (9 — the eight parts, THE FALL, the return guarantee, the batch); hq-terrain's
  count 22 and its crag rule (`crag: false` / no plan opt out); hq-floor-plan's count 19 and the sealed-cell exemption;
  hq-world's seam list. `npm test` — see CLAUDE.md's entry for the numbers. Token `20260917-vatican-divine-01-cors`.
- UNSEEN LIVE (RULE #1c): all of it — the GLBs' scale and facing (the pews' fronts, the throne's `front: 'back'`, the
  church building's size against the terrace, the italian wings half through the parapet, the telescope's tube), the
  stacks in the wood sheet, the cypress banks, the stairway landmark's size from the dome (`landmarks[0].s / dist / y`
  are the edits), the rescue cuts' look between the cloud banks, the stepping clouds under the jump.

### 2026-09-17 — DISASTER CITY (complex candidate #1: DOWNTOWN · THE STRIP · CYBERPUNK · THE STADIUM · THE METRO · THE MALL), local delivery
The user: "Disaster City next: downtown, the strip, cyberpunk city (accessible through a time machine somewhere in a
building in the city, not just a regular door), the football stadium, metro station, and a new place called The Mall —
inspired by the Miami Mall incident, just an average American shopping mall. A gutter or sewer entrance to the
underground tunnels. Ideally NPC cars driving down the streets. The main city area big — enough to be a Mario Kart-like
track for a mini racing game, even if just with the skateboards for now. Use whatever Meshy assets fit; tell me what new
ones would be good for a second pass."
- **THE THIRD FLOOR-PLAN KIND — `city`** (data.js `HQ_TERRAIN_GEN.city`, the branch in `_hqTGenerate`): `gen.streets`
  are the corridors (`{ pts, w, loop }`; a 2.4 m SIDEWALK band `walkW` either side with a 12 cm `kerb` step the walker
  takes and the rider hops — never on a forced cell), everything else the solid = THE BLOCKS, risen `wallH` (3.2 m — the
  podium every building stands on, in the cliff sheet; the mall's 5 m store units). **A city's rise is a MAX, never a
  stack**: an authored roof / mezzanine inside a block keeps its own height (the cave's additive rise put a 3 m parapet
  round a 4 m roof). After the rise the solid is cut into LOTS by GREEDY PACKING (`info.lots`: `lotW` a side, `storeys`
  1–4, `lowP` = a flat roof with its plant, a key of `building_1..8`) and every lot edge with the street past it is a
  FRONT (`info.fronts`, the façade standing where the rise begins — `frontOff`). `info.gen.sidewalk / kerb / fronts /
  prisms` ride to the renderer. THE ROUTES and THE CIRCUIT ride the info too (`terrain.traffic`, `terrain.race`, with
  defaults). `hqTerrainCompile`'s plan test in hq-floor-plan.test.js walks only from cells THE WALKER REACHES now (a hard
  tape's roof is an open tier inside the solid — its top is the door gun's, not a walk's start).
- **THE STREETS** (`site_prebuilt_downtown_streets`, 112 × 88 m, open under Downtown's sky through `hqCityShell`, asphalt
  underfoot, a fog per metre, `HQ_ROOM_LOOKS.city` = the disaster-movie print): THE RING ROAD (a loop at ±40 / ±29 with
  a chicane on the east leg and a bend on the south — THE CIRCUIT), THE AVENUE and THE CROSS STREET (w 10, a parking lane
  either side), THE PLAZA (the fountain waded, four trees), THE PARKING DECK (a 3 m tier up a car ramp the walker climbs,
  a rail round its roof — the grind — two quarter pipes), THE COLLAPSE (a rubble mound with the tower's fallen pillars,
  the barrel fires), THE ROOFTOP (a 4 m low building flush with the ring road's west sidewalk — the tape on it is the
  door gun's; `hqFindHardReachTerrain` proves the shot from the sidewalk), six parked cars on the parking lanes, the
  benches / bins / signposts scattered on the sidewalks. Doors: `tower` (w wall z −8 ⇄ the lobby's new `avenue` doors
  on its EAST wall — the lobby clock moved to z −4), `mall` (s wall x 0), `metro` (n wall x 12 ⇄ the platform's new
  `street` stair on its north wall at x 2.2 — the departures board moved over the track). Every door's side street is a
  `path` (a forced corridor).
- **THE MALL** (`site_prebuilt_downtown_mall`, 66 × 46 × 7.6 m, closed, `HQ_ROOM_LOOKS.mall` = the security camera's
  tape): a `city` plan too — THE CONCOURSE cross (w 10 / 9), THE ATRIUM (r 9, the fountain full of pennies), THE FOOD
  COURT (r 8 — tables, the shift at lunch), THE ARCADE (r 7.5 — five `slot_machine` cabinets) with THE TIME MACHINE
  free-standing against its back; the store units the solid (5 m, `fronts: 'store'`, `prisms: false`); THE MEZZANINE
  (3.4 m over the north wing's mouth) up THE ESCALATOR (`stairs: true`, 7.2 m along the concourse's north side — a
  tread a metre, 0.49 a step; **THE RAMP RULE's other half**: a ramp is never INSIDE its tier's rect while it is still
  low — the first draft ran diagonally into the rect at 60 % height and met a 1.5 m step); THE STORE ROOF on the west
  concourse's north side (5 m, the tape — its face IS the concourse wall, so the shot is from the floor). Natives: the
  zombie shopper, the conspiracy theorist ("ten feet tall, nobody filmed it in FOCUS"), the mad scientist by the
  cabinet at the back. Lines are Claude's DRAFT (A15).
- **THE RENDERER** (three-renderer.js, the block before `_hqBuildSiteBoard`): `_hqBuildCityLots` (the map-builder
  sprite prisms on the podiums via `_nrSpriteBuilding` on the terrain's `_nrKit`, a flat roof's parapet + AC + tank on a
  `low` lot; the FRONTS — `'window'`: windows, a door, an awning on every third, a shop sign on some; `'store'`: a lit
  sign band naming a store from `_HQ_STORE_NAMES`, the glass, the mullion, the door, a shutter half down on every
  third), `_hqBuildStreetLamps` (the street lamp OBJ on the kerbs of every street of the plan, alternating sides every
  14 m, clear of the door pads), the SIDEWALK painted in the path sheet through the blend (`info.gen.sidewalk`).
  **NPC TRAFFIC**: `_hqBuildTraffic` stands `_hzVehicle`s (at the room's tile — `_hzKitTs` set round the build, the
  visual-pass rule) with headlights and tail lights on `info.traffic` routes, spaced along each; `_hqTickTraffic` drives
  them on the right (`lane`), following the car ahead (never closer than a length and 1.4 m), a car off the end of an
  open route back on at its start, the body's yaw the route's heading (nose +Z); **THE HIT**: the walker inside a car's
  box is shoved along its heading with a hop (the carry momentum, `pl.mvx / mvz`, + `pl.vy` 3.4) and a rider is thrown
  (`_hqRideBail(R, pl, 'car')` → THE TRAFFIC); `carhit` reaches map.js (a toast). Kill-switch `EW_HQ_NO_TRAFFIC`;
  `EW_PERF_LOW` halves the cars and the lamps. **THE CIRCUIT**: `_hqBuildRace` lays `race.gates` (8) at the loop's
  mid-segments (never at a corner — a gate whose plane the approach runs along is never crossed), a START / FINISH
  banner with the label on the first, striped posts + a glow on the rest; `_hqTickRace` (a ticker; the rider only)
  times the gates in order — `lapstart` at the banner, a `gate` beat each, `laptick` at 4 Hz, a `lap` at the banner
  again with its ms and `best`, `lapdrop` when the board is dropped; the wrong way never counts; `minLapMs` 8 s.
  `HQ_SKATE_RULES.race` / `HQ_SKATE_DEFAULT.race` = `{ hw, tickMs, minLapMs }` (hq-skate.test.js diffs the keys).
  **THE WAYS**: `_hqWayBuilders.timemachine` (a brass cage on a round dais, the console with its dial and lever, THE
  DISC standing behind — spun up by the press-in, the light through the cage with it; blockers at the console and the
  disc) and `.gutter` (the kerb inlet box with its slot and the drain's green light, the grate in the road in front).
- **map.js**: `_hqSkateEvent` hears `carhit` / `lapstart` / `gate` / `laptick` / `lap` / `lapdrop`; the lap timer rides
  the trick line (`_hqLapFmt` m:ss.t; a live combo beats it — `_hqComboLive`); a lap is filed through `_hqSkateFile({ lap
  })` → data.js `hqSkateBank` keeps THE BEST LAP PER ROOM (`door.hq.skate.laps[room] = { ms, date }`, `lapsRun`) — LOCAL
  like the deck, never in the synced blob; `hqSkateStatus` reads `laps`; the pause menu's OFFICER sheet lists THE CIRCUIT
  rows. audio.js: `wayTime` (the disc spinning up to a chord and the snap of the year), `wayGutter` (the grate, the drop,
  the splash).
- **THE SEAMS** (`DOOR_HQ.links`): `streets_strip` (highway, `leaf_motel`: the streets' west wall z 18 ⇄ the chapel's
  WEST wall z 5 — the altar holds the north), `streets_stadium` (highway, `leaf_wired_double`: n x −24 ⇄ Room 50's last
  free north lane x −10), `timemachine_cyberpunk` (seams, `way: 'timemachine'` at BOTH ends: free in the arcade ⇄ free
  on Cyberpunk's north strip at (9, −9.4) set for 1954 — **the ONLY way from the city into Cyberpunk**; Cyberpunk's
  three wall lanes were full, a `way` stands free), `streets_drain` (a NEW line **`routes.sewers`**, dashed — the
  tunnels' first seam, candidate #3: `way: 'gutter'` free in the east kerb at (46.2, 14) ⇄ the storm drain's own
  `leaf_cell` grate on its north wall at x −13, CLIMB UP). Two new `DOOR_HQ.ways`: `timemachine` (STEP IN · SET FOR
  2077) and `gutter` (CLIMB DOWN). Tapes: the Stadium's HALF-TIME → the streets, Cyberpunk's THE NOODLE STAND → the
  mall's food court (the hundred stays a hundred, every site keeps ≥ 1). `findSpots` pins both hard tapes.
- **Tests**: `hq-city.test.js` (10: the sheet, the plan, the ways in, the seams, ONE PIECE, THE SOLVER + THE RETURN
  GUARANTEE + the production landing on every door incl. the free ways, THE PARK RULE + the hard tapes, the traffic +
  the circuit's data, THE CIRCUIT run in a vm — a rider round the loop twice, the wrong way, the drop, the bank — and
  the source sites); hq-terrain (24 rooms; a mall's walls are its store units — no crag), hq-floor-plan (21 plans, the
  `city` kind, the reach-restricted walk), hq-urban (Downtown's parts are four; the platform's two stairs; a seam on a
  part pairs; Cyberpunk's fourth link door stands free), hq-world (the seams list + THE SEAMS' 17 stations).
- **NOT BUILT / SECOND PASS**: real building models on the lots (the prisms are flat sprites on a concrete podium —
  MODEL_INDEX §3h lists the wishlist: a low-poly city block kit, a storefront unit, the user's own time machine, a
  storm inlet, an escalator, the mall's fountain / tables / kiosk / cabinets, the kerb furniture, the collapse's crashed
  car, the metro canopy, Gate C's turnstiles, a truck and a taxi for the traffic); the race as a MODE (a start
  countdown, a ghost, opponents on decks — the lap timer and the record are the v1); cars as blockers (they shove, they
  never stop for you); THE METRO as its own concourse (the platform is the station); a `way` for the stadium (Gate C is
  a door); the Strip's and Cyberpunk's own street rooms (their board rooms stand as they were).
- **UNSEEN LIVE (RULE #1c)**: everything — first the prisms' scale against the podiums and the fronts' planes on the
  slope, the kerb under the walker, the cars' pace and the follow gap on the chicane, the hit's shove, the banner at the
  first gate, the lap line over the trick line, the store signs' legibility, the time machine's cage against the
  cabinets, the gutter's slot at road level, the Cyberpunk end on the strip against the setting's parked cars.

### 2026-09-17 — DISASTER CITY, THE SECOND PASS + CYBERPUNK CITY (complex candidate #1 continued), local delivery

The user's notes on the first pass: "I do not like how the buildings are on
raised plateaus, they should be street level"; "the cyberpunk city is supposed
to be another big area, basically a reskin of disaster city but cyberpunk";
"the time machine should be in a random basement or supply closet of the mall";
the bin is for outside and the trash bin for inside; the city batch of Meshy
models uploaded to R2 `Assets/misc/` (four committed to the repo for their
scale); "keep improving the overall feel of city and making the different areas
feel more interconnected and part of the same city/world".

**STREET LEVEL.** The `city` plan's rise (3.2 m in the concrete sheet) was the
podium every building stood on. Two changes: the compiler (data.js, the city
branch of `_hqTGenerate`) starts the rise `riseIn` (0.1 m) INSIDE the mask
boundary instead of 0.2 m outside it, and the LOTS are a TERRACE — laid along
every street FACE (the corridor's edge + the sidewalk) shoulder to shoulder, a
lot's face standing `frontOut` (0.35 m) OUTSIDE the boundary over the sampled
ramp (the field is sampled every 0.5 m, so the drawn ramp spans a cell either
side of the line whatever `edge` says — the face must stand past it), its depth
capped at half the block when a street lies on the far side (the ring road's
inner faces and the cross street's faces share their blocks) and short of any
feature otherwise, every lot wearing `rot` (the face's yaw), `base` (the
sidewalk's ground under its front) and `face` (the street index); the fronts
hang on the lots' own edges (the main one always, a corner lot's side when the
street lies past it). The renderer (`_hqBuildCityLots`) stands every prism FROM
THE GROUND — `_nrSpriteBuilding` took a depth (`o.d`) so the box is w × d,
turned by `ry` — and a LOW lot is a one-storey concrete box with its parapet and
plant; the 'window' front on a prism lot keeps only the awning and the shop sign
(the sprite's own ground floor shows), a low lot's ground floor keeps the
windows + door and takes the user's `storefront` GLB over them; the mall's
'store' front takes the `storefront_unit` GLB over its glass (the sign band
stays). Measured (hq-city.test.js): every lot's base ≈ the kerb (0.08–0.14 m on
the streets, ≈ 0 in the mall), the rise ≥ 60 % of wallH 1.5 m inside every
face, 44 lots on the streets / 13 units in the mall / 41 on the grid, ≥ 55 %
of the street lots touching a neighbour on their face (the blocks are full of
features: the deck, the collapse, the chicane — that is the plan's own limit).

**THE ROAD TILES.** The user's straight road and quarter-turn GLBs (1 × 1
squares — the straight one's dashes along Z with kerbs on the X sides, the turn
a quarter circle joining two adjacent edges; measured) are laid by
`_hqBuildRoadTiles` (three-renderer.js, after the lots) along every street of a
sidewalked `city` plan: a straight tile every street width along each segment
(fitted by span to the street's width, squashed to a kerb — scale.y 0.3 — 2 cm
over the field), a quarter tile ON every right-angle vertex with the runs
stopping half a width short, nothing inside another street's corridor (an
intersection is plain asphalt) or beside a bend that is not a right angle.
Kill-switches EW_HQ_NO_ROAD_TILES / EW_PERF_LOW.

**THE CITY BATCH** (MODEL_INDEX §3i): nineteen `_MISC_GLB` rows + fourteen
catalogue rows (`base: 'misc'`); the taxi and the truck in `_VEHICLE_KIT` and in
both cities' traffic; `city_bin` outside / `mall_bin` inside; the crashed cars
under THE COLLAPSE and on the chicane; cones, barrels, cinder blocks, hydrants,
manholes scattered; two bus shelters per city; the escalator over the mezzanine
ramp (the treads under it stay the walker's); the time machine GLB over the
brass cage in the `timemachine` way, the round drain over the `gutter`'s grate;
`_hzBasilicaDome` GLB-first (the Vatican setting, the `basilicadome`
monument; `_hzBasilicaDomeProc` the stand-in) and a `dome` landmark builder.

**THE SUPPLY CLOSET** (`site_prebuilt_downtown_closet`, 7 × 7 × 3 — four cells
a side so THE FIELD's lattice sits flush): the service door at the end of the
mall's north wing, the shelves, the mop, THE TIME MACHINE free against its back
wall. **THE TIME MACHINE** (`links.timemachine_cyberpunk`) now runs closet ⇄
the noodle bar's back room — both FREE ends on complex parts, both a building
in the city; the arcade and the board room's strip gave it up.

**CYBERPUNK CITY · THE GRID** (`site_prebuilt_cyberpunk_streets`, 104 × 84,
`hqCityShell({ neon: true })` — Cyberpunk's own violet night and magenta fog,
the wet asphalt darker, the neon mood, `HQ_ROOM_LOOKS.neon` — Dreamy, night
mood 0.9, bloom 0.55): the same `city` plan with `gen.neon` (a neon name in its
own ink on every main front, a hologram over every tall lot, the sprites lit
brighter): THE LOOP (THE NEON GRAND PRIX — 8 gates; cybercars, taxis, cop cars,
trucks both ways), THE BOULEVARD and THE CROSS, THE HOLO-PLAZA (a mound), THE
SKYWAY (4.5 m up a car ramp, three rails, two quarter pipes), THE BILLBOARD ROOF
(5 m, never climbed — the hard tape with a shot), THE PUDDLE (waded), THE MARKET
ALLEY (the vending machines, the pachinko parlour's cabinets, the barrel fire),
THE STATION (a siding west of the loop where the tunnel's train now ARRIVES —
`links.tunnel_cyberpunk.b` is a free end on the grid; the Downtown platform's
stair comes up on the grid's north wall — `links.subway_downtown.b`), the
board room's back gate (`siteRooms.backDoors.prebuilt_cyberpunk`, n x −10 — the
lane the train stood on; the board room keeps the highway alone). **THE NOODLE
BAR** (`site_prebuilt_cyberpunk_noodle`, 8.75 × 7): the back door on the market
alley, the far end of the machine, set for 1954. Three tapes re-homed
(Technoticlan's THE UPLINK → the grid, Stonehenge's THE WHEEL → the noodle bar,
the Flat Lands' THE FOURTH CORNER → the closet); the hundred stays a hundred.

**Rules that came with it:** a lot's row is rounded to a centimetre, so
neighbours are laid with a 4 cm seam (two touching lots must never round into
an overlap); a spawn or a native never stands in a traffic lane (the first
probe spawned in the ring road's west leg and was HIT BY A CAR at once); a part
that a link end names is `site_<mapId>_<part>` — `hqComplexRoomId` — never a
longer id. Tests: hq-city.test.js (re-pinned), hq-city-2.test.js (new),
hq-urban / hq-terrain / hq-floor-plan / hq-stage2 / hq-visual-pass pins moved.
`node check-terrain.js` on the three city rooms: every door reached, nothing
traps. **Screenshotted offline** (playtest_hq_offline.js now serves the repo's
GLBs from disk): the escalator on the mezzanine, the road tiles, the buildings
at the kerb — stand-in textures, so the sprite prisms read as grey blocks; the
real sheets, the neon inks and every batch facing are UNSEEN (RULE #1c).

### THE COMPLEX CANDIDATES (the user's list, 2026-09-17) — build each on THE CAVE / THE WOODS blueprint
The cave and the woods are the blueprint for every complex from here: a generated floor plan (`terrain.gen`),
the ground running out under a real fog, a `shell.look` grade tuned to the vibe, the room's own light, THE PARK
RULE, the hard tapes, `check-terrain.js` before any claim. The aesthetic is the deliverable, not the room count.
1. **DISASTER CITY** — Downtown, Cyberpunk, the Strip, the Metro (the subway stations) as ONE city: streets as
   corridors, blocks as rooms, the metro joining them below.
   **STARTED 2026-09-17 (DISASTER CITY, the entry below): THE STREETS + THE MALL shipped locally on Room 1954 — the
   `city` floor-plan kind, the ring-road circuit with its lap timer, the NPC traffic, the time machine into Cyberpunk,
   the metro stair, the Strip's and the Stadium's seams, the gutter into the storm drain.**
2. **CAMELOT CASTLE** — the exterior (moats, gardens, the curtain wall) and an interior of several floors;
   possibly a castle in the sky (Howl's moving castle).
   **STARTED 2026-09-18 (CAMELOT CASTLE, the entry at the end of this file): five parts shipped locally on Room i —
   THE OUTER WARD (the moat, the drawbridge, the curtain wall's parapet walk, the bailey, the keep tower), THE GREAT HALL,
   THE KEEP (the great stair to the battlements), MERLIN'S UNDERCROFT, THE CASTLE IN THE SKY (three floating flights, the
   sky bridge onto the stairway to heaven) — three families in one complex; the board room bypassed.**
3. **THE TUNNELS / THE DUNGEONS** — every subway tunnel, the sewer system (the storm drain), the dungeons
   (24601, the oubliette) joined into one underworld.
4. **HEAVEN · HELL · THE VATICAN · THE CATACOMBS · THE STAIRWAY TO HEAVEN** — one epic-fantasy complex, the
   stairway the spine from the Vatican's dome to the clouds. **STARTED 2026-09-17 (THE DIVINE STAIR, the two
   entries above): eight parts shipped locally — the basilica, the archive, the cortile, the observatory, the
   catacombs, the pit, the stairway, the cloud fields.**
5. **D.U.M.B.** — Area 51, CERN, the padded rooms, the dream lab, clone disposal: the base under the base.
   **STARTED 2026-09-17 (D.U.M.B., the entry at the end of this file): seven parts shipped locally — the motor
   pool, sub-level 7, dream research, clone research, the war room, the bunker, CERN's ring — on the new
   `halls` floor plan (family C's generator).** The user's brief, verbatim: "The DUMB is kind of a catch all for
   all black budget projects and organizations. Area 51, CERN, Dream Research, Psychic Training, Clone Research,
   A Billionaire Bunker, Government War Room, it's all there" — and "the most Portal map".
6. **DOOR MANUFACTURING** — the service hallways, the warehouse, the Works: what keeps D.O.O.R. running.
#1 has its second pass and CYBERPUNK CITY (the entry above); #2, #4 and #5 started; #3 and #6 not. Each needs its own `HQ_ROOM_LOOKS` row, its own sky / fog, its links on the
world graph and the 7.10 checklist for any new site it introduces.


### 2026-09-17 — Disaster City geometry, entrances and pedestrian traffic repair (local delivery)

Based on GitHub main c65341886eb7a4bd5f895d9d8618dfa6d393d57f. Not uploaded or deployed.

- Straight road GLB has baked vertical extent 0.478515 on its unit footprint. Road tiles now fit to 0.035 m thickness after loading, independently of road width, and sit 0.01 m over the field. This also keeps quarter-turn tiles at the same thickness.
- Inspected the storefront_unit asset: width along X, front toward +Z, depth 0.660156. Removed the assumed quarter-turn, recessed the back half-depth into the store, and fitted height below the existing sign band. The model no longer occupies the concourse. Procedural fronts remain available while loading / at low detail.
- The mezzanine ramp is now marked escalator with smooth collision and no lateral terrain rounding. Its visible terrain triangles are omitted under the escalator. _hqBuildEscalators places the supplied two-lane escalator at the lower floor rather than on the ramp midpoint, fits its width/run/rise, and retains a metal-step/handrail fallback when the model is unavailable. Removed the duplicate catalogue prop. Explicit noise amp:0 is now respected (the mall previously inherited 0.15 m noise).
- _hqBuildCityEntrances gives every normal outdoor city area door its own sprite building at the end of its existing approach street, aligned directly behind the working door, with a canopy, surround and destination sign. Shared by Disaster City and Cyberpunk. Door coordinates/actions and return landings are preserved. Special ways such as the gutter and train keep their existing forms; indoor doors already have walls.
- Disaster City traffic: 17 -> 8 vehicles; ring-road speed 4.5 m/s, avenue speed 3.5 m/s. Shared traffic yields to walkers/skaters along a sampled upcoming path, including corners and route respawns. Following gaps use the actual lead vehicle length. A three-second player-wide hit cooldown prevents successive cars from repeatedly shoving the player.
- Existing files only for runtime: data.js, three-renderer.js, index.html. Shared token 20260917-city-repair-03-cors. data.js belongs on both R2 and Render; three-renderer.js on R2; index.html on Render. No model files changed and no additional asset upload required.
- Validation: Node v24-compatible bundled runtime; package test command `node --test *.test.js`: 1,584 tests, 1,578 passed, 6 skipped, 0 failed. Syntax checks passed for edited runtime JS. 42 focused city/terrain/floor-plan tests passed; terrain connectivity and return checks run in that suite. New hq-city-repair.test.js covers mesh fit callbacks, entrance alignment, escalator fit/fallback, yielding through bends/respawn, lead-vehicle spacing, density and zero noise. Updated old assertions that required the removed stepped ramp and 0.3 road squash.
- HQ rendering/traffic changes apply to each player's local exploration; battle simulation and online relay are unchanged. No browser playtest performed. Final visual feel, escalator tread alignment and sign readability remain for in-game confirmation.


### 2026-09-17 — Room directory navigation and zoom readability (local delivery, not deployed)

- Verified the source files against GitHub main blob hashes before editing; includes the city repair already on main.
- map.js now activates a node with one click/tap or Enter/Space. Pointer-up retains the original pressed node even when SVG pointer capture retargets the event. A pan or cancelled pointer never travels. All travel uses the existing _hqDoAction / _hqMapAt path. FIT replaces the conflicting double-click reset.
- _hqMapLabelPlan prioritizes the current/hovered/focused room, hall/rings and major sites at overview scale, adds facility names at 1.55x and complex parts at 2.4x. Labels use screen-sized type and collision avoidance, recomputed during pan, zoom, resize and discovery animation. Uncharted names remain undisclosed.
- Search matches charted room names, numbers and area/site names. Results travel directly. Larger hit targets, visible keyboard focus, quieter map lines, no scanline overlay on the directory frame, and readable two-column door rows improve navigation. Existing room graph, authored names and discovery ledger stay authoritative; no new runtime module, story, battle state or network relay.
- Runtime upload: map.js and styles-base.css to R2; index.html to Render with shared token 20260917-directory-01-cors. Repository-only: hq-map.test.js and the three updated build/history documents.
- Validation: syntax checked map.js; map tests cover captured clicks, drag/cancel, keyboard travel, progressive labels, label separation and discovery privacy. No browser playtest was performed; final visual appearance remains to be checked in game.

Full suite: tests 1586; pass 1580; fail 0; skipped 6. Executed package.json’s test command directly with the bundled Node runtime (`node --test *.test.js`); npm is unavailable.

### 2026-09-17 — EXPLORABLE_AREAS_GUIDE.md + STREET LEVEL rev 2: the city's solid is a MASS (local delivery)

The user's review of the four complexes: the cellular rule works for the cavern and the woods and fails for a city; three
families of generation (natural / prefab / rooms-and-hallways) plus the streets kind, mixed across a complex's parts; areas
with floors and platforms (D.U.M.B. as Portal); the Δ site rooms abandoned as a look (the crystal stays); discovery — a
cleared map plays Otto finishing a new door. **`EXPLORABLE_AREAS_GUIDE.md`** (repo root) is now THE guide: the families
and the code that is each one, the research to borrow from, the build order, the city rule, the multi-floor plan, the Δ
rework, the discovery design, the checklist, a log. Read it before any new area; append to its §10.

**The fix (data.js only)**: the `city` plan no longer raises its blocks — `HQ_TERRAIN_GEN.city.podium: false` skips the
rise (`if (solidMass) return;` in `applyRise`); the mask refuses the walker (`hqTerrainSolidAt` in `hqTerrainFeet`,
`solidPad` 0.3); the air and the boom meet `info.solidTop` (`hqTerrainSolidTop` — `storeyH` 3.4 per storey over a lot,
`wallH` over the yard); YARD WALLS (`info.yardWalls`, 19 on the streets / 20 on the grid, `bricks_2`, 2.4 m) close every
frontage run no lot covers, never in front of a tier (the rooftop / the deck keep their cliffs for the LIP snap). The mall
keeps `podium: true` (its units are the mass). `check-terrain.js`: both cities every door reached, traps 0, open 61 % /
59 %. Tests amended: hq-city (the per-lot rule, the block flat + refused, the yard walls, the mall's podium), hq-city-2
(the mass inside a lot), hq-floor-plan (a mass city's deep solid judged by the walker's rule). Delivery:
`ENTROPY_WARS_STREET_LEVEL_2.zip` — data.js → R2 + Render, index.html → Render (`20260917-street-level-02-cors`), the
guide + tests + docs → the repo. UNSEEN LIVE: the yard walls, the flat yards from the deck, the outer ground past the
outer blocks. NEXT (the guide §4): minor roads through the blocks, corner lots, interior fill, roof access; then §6's
pilot (one site room per family) and §7's discovery.

### 2026-09-17 — THE URBAN PACK: Disaster City in the pack + THE ROADS OUT (local delivery)

The user's 320 tileables (128 px = one battle tile) registered (sprites.js `URBAN_TEXTURES`, the `urban:<Name>` key through
`_hzTex` / `_hqTex`). THE STREETS: the asphalt is the field's floor sheet, the pavement its path sheet (+ THE PLAZA as a
21 m path), the yards its cliff sheet (and the outer ground); `_hqBuildRoadMarkings` = the dashes, the edge lines, the
zebras + stop lines, the kerb stones, the manholes, the speed plates, the NO ENTRY; the GLB road tiles are opt-in
(`EW_HQ_ROAD_TILES`). THE HOARDINGS: the yard walls in the corrugated sheet, 1.75 m, with the pack's plates. THE
TEXTURED BUILDINGS: `gen.texP` 0.5 of the lots + every low lot through `_hqTexBuilding` (a 1.75 m facade grid, five
styles, `gen.ruinP` ruined, the -Glow twins under neon, one merged batch per sheet); the sprite prisms keep the rest.
THE ROADS OUT: `DOOR_HQ.ways.road` — the highway's four links land on the streets' ENDS (the cross street east →
Nuketown, west → the Strip; the avenue north → the Stadium; the Strip's road → the grid's cross street east) as roads
under a gantry that names the next town; Gate C retired. The platform, the lobby, the casino, the chapel, the mall,
the closet and the noodle bar wear the pack. Verified with `playtest_city.js` (the real sheets through the proxy):
the streets from the kerb, the plaza, the ring, the three roads out, the grid at night. NOT DONE: the pack on
D.U.M.B. / CERN / Area 51 / the Δ boards (the key is the edit), a window-lit interior behind the glass, the sprite
prisms' own ground floors in the pack. Delivery: ENTROPY_WARS_URBAN_PACK.zip.

### 2026-09-17 — DISASTER CITY, THE THIRD PASS: the look yields, the two-floor mall, the kerb rule, the mitre, CYBERPUNK CITY IS THE GRID + THE STRIP its own area (local delivery)

The user's notes on the mall and the streets, every one answered in the existing files:

- **THE LOOK YIELDS TO THE PLAYER** (three-post.js): "when I change the settings in the menu it doesn't change anything." A map's / a room's look (`HQ_ROOM_LOOKS`, `env.look`, `shell.look`) used to win over every setting it named. Now it fills in ONLY the settings still at their FACTORY default (`_RETRO_FACTORY` / `_CIN_FACTORY` / `BLOOM_FACTORY` / `EXPOSURE_FACTORY` / `DOF_FACTORY` / `NIGHT_FACTORY`, captured before the saved preference lands); any slider or toggle the player has moved wins everywhere (`_lkNum` / `_lkRetro` / `_lkCin` read `_lkSame(setting, factory)`; a look's preset re-seeds levels / tint only while the player owns none of the three). `ThreePost.getSceneLookOwned()` lists the keys the player owns; the Map Looks hint (ui.js) says "a slider you move wins".
- **THE MALL, THE THIRD PASS** (data.js `site_prebuilt_downtown_mall`): no floor plan, no store-unit MASS ("the shop buildings are poking out the sides of the walls"). ONE open box 96 × 64 × 12 with TWO FLOORS: the galleries at 4.6 m along the north and south walls (cut by the entrance hall and the north wing) joined by THE EAST BRIDGE (the food court); the shops are `terrain.shops` rows — FRONTS drawn on the galleries' cliff faces (the ground floor) and on the room's own walls (the upper floor) by three-renderer.js **`_hqBuildShopfronts`** (bays of ~6.4 m: pilasters, the pack's tall glass with its glow twin, a door, one bay in three shuttered in the corrugated sheet, a fascia sign per bay from `_hzTextTex`, the balcony lip's fascia + edge quad over the field's 0.35 m slope; merged per sheet, every piece `_ew_hqPart: 'wall'`). THE PARK: two escalators at the west end (12 m of smooth hidden ramp, fitted GLBs, **`_hqEscalatorBalustrades`** — solid side panels from below the floor to a metre over the treads that hide the field's sampled skirt: "the stretched tile texture up the side of the escalator"), two 12-m stairs at the east (a stair's last tread must stand within a climb of the tier before the tier's own 0.35 m edge overtakes it — 9 m stairs jumped 1.02 m at the top), grind rails on every lip, THE FUN BOX (0.9 m, a ramp either side), two GRIND LEDGES (0.45 m walls), THE HALF PIPE (two quarter pipes across the west concourse), THE CLOCK TOWER (8.5 m, the hard tape — `findSpots`). The directory notice board hangs on the south wall (it floated at x 0 z 14 as a wall proc placed on the floor). hq-city / hq-city-2 / hq-city-repair amended; disaster-city-3.test.js proves the upper floor is walked up all four ways.
- **THE SCATTER RULES** (data.js `hqTerrainCompile` freeFor): nothing stands on a RAMP / a stair / an escalator or the field's skirt beside it (the plant pot on the escalator); seeded furniture refuses a slope over 0.25 (a row with its own centre — the collapse's rubble — keeps 0.5); **THE KERB RULE** — in a city plan a seeded row (bins, hydrants, cones, signposts, benches) stands ON THE SIDEWALK: `rad + 0.35 ≤ maskD ≤ sidewalk − rad/2`, never in the roadway, never deep in a yard (`kerb` opt; `f.road: true` or an explicit centre opts out).
- **THE TINT**: `HQ_TEXB.tint` 0xa8a49c / `tintNeon` 0x62627a on every textured building's sheet (they read lighter than the sprite prisms). One number each.
- **THE MITRE** (`_hqBuildRoadMarkings`): at a same-street corner an offset line on the INNER side is trimmed by off·tan(θ/2) before the vertex and the OUTER one extended by the same, so the two segments' kerbs and edge lines meet at one point (they crossed inside and gapped outside every right angle). An open end or a junction with another street gets 0.
- **THE OVERLAP SWEEP** (`_hqTGenerate` city): a lot laid on one face that overlaps an earlier lot on another (the chicane's angled face against a side street's) is dropped before the fronts are laid; the bay door's new street on Downtown's south wall exposed it.
- **CYBERPUNK CITY IS THE GRID · THE STRIP IS ITS OWN AREA · DISASTER CITY IS THE LARGER AREA**: `DOOR_HQ.siteRooms.entry` names the part that stands for a site — every door, threshold, GO on the map and post-match return that would land in `site_prebuilt_cyberpunk` / `_strip` / `_downtown` lands in `site_prebuilt_cyberpunk_streets` / `site_prebuilt_strip_streets` (NEW) / `site_prebuilt_downtown_streets` instead (map.js `_hqEnter` → data.js `hqSiteEntry(roomId, at)`: an `at` the part has is kept, the rest land at the part's `bay` door; the board room is marked seen too). `hqApplySiteEntries()` (at load, after the board rooms are generated) hangs the board room's own egress on the part as its `bay` door (`wall` / `x` from the sheet; the leaf, the label, the bay action and `site` — the plate reads the site's number). The grid's tenement door is gone (the bay door stands where it stood). **THE STRIP** (`site_prebuilt_strip_streets`, `hqCityShell({ strip: true })` — the Strip's own night off its EW_MAP_META row, `HQ_ROOM_LOOKS.strip`): THE BOULEVARD (14 m, the roads out at both ends — `downtown_strip` / `strip_cyberpunk` re-pointed onto the part), THE BACK LANE loop (= THE STRIP GRAND PRIX), two cross streets, the fountain plaza, THE VALET DECK (2.4 m, a ramp, a rail, a quarter pipe), THE MARQUEE ROOF (4.5 m, the hard tape), the chapel's motel door on the north wall (the chapel's `street` door comes back onto the boulevard). THE LUXOR BEAM tape re-homed onto it. Labels: every part reads `DISASTER CITY · <place>` (DOWNTOWN, THE MALL, THE STRIP, CYBERPUNK CITY, THE CHAPEL, THE CASINO FLOOR, THE TOWER LOBBY, THE PLATFORM, THE NOODLE BAR, SUPPLY CLOSET).
- Tests: `disaster-city-3.test.js` (8); hq-city, hq-city-2, hq-city-repair, hq-terrain (26 rooms), hq-floor-plan, hq-urban, urban-pack amended. `node check-terrain.js site_prebuilt_downtown_mall` / `site_prebuilt_strip_streets` solve.
- UNSEEN LIVE (RULE #1c): the shopfronts' read under the mall's light (the glass tint, the sign colours, the shutter share `HQ_SHOP.shutterP`), the balustrades against the fitted escalator GLB, the stairs' treads under the walker, the kerb rule's density on the sidewalks, the mitred corners on the chicane's 45° bends, the Strip's neon lots at night, the bay door on each part.

### 2026-09-17 — D.U.M.B. (THE COMPLEX CANDIDATES #5): THE HALLS FLOOR PLAN + seven parts on Rooms 555 and 999 (local delivery)

The user: "The next one I recommend doing is the DUMB which would bring some areas/rooms together and be the most
'Portal' map. The DUMB is kind of a catch all for all black budget projects and organizations. Area 51, CERN, Dream
Research, Psychic Training, Clone Research, A Billionaire Bunker, Government War Room, it's all there." Built on the
guide (EXPLORABLE_AREAS_GUIDE §1 family C, §5 item 2 THE CHAMBER CHAIN), which needed a generator first.

**THE STORY BEATS (§3 step 1):** Room 555's blast door → the freight lift (the board's north wall at x −5) → THE
MOTOR POOL (arrive: the tram lit at the end of the hall — the weenie; the tunnel out both ways) → the stair to
SUB-LEVEL 7 (the level that does not exist: THE TOWER at the hub's centre, the tape nobody can climb to, four
numbered chambers to learn the verbs — climb THE DROP, cross THE CATWALK's plank, walk down and out of THE PIT,
climb OBSERVATION's deck behind the round windows) → the four departments off the hub (the ward and the range,
the vats and the furnace, the war room's board, the billionaire's screens) → back out by the tram to Area 51's
hangar or on to CERN's ring (walk the whole octagon; the detector hall's orb).

**THE HALLS FLOOR PLAN (data.js `HQ_TERRAIN_GEN.halls`, the `halls` branch in `_hqTGenerate`,
`_hqTTraceMaskWalls`, `_hqTRdp`):** family C's generator — a BSP of the shell into leaves (`leafMin` 8 ..
`leafMax` 19 m) with a rectangular room in each (`roomInset`, ≥ `roomMin`, snapped to `roomSnap`), plus the
AUTHORED rooms (`gen.rooms` — the prefab chambers; a BSP room whose centre lands in one is dropped) and the
AUTHORED halls (`gen.halls` polylines with `loop`; `bsp: false` = those alone), every room centre / door pad / hall
vertex a node on a Prim tree (Manhattan distance; the hall vertices start in the tree as one component) + `loops`
extra edges, each edge an L-SHAPED corridor (`corridor` [2.6, 3.4] m, square-capped — right angles, never a
rounded end). The solid is MASS (the city's rule: `solidMass`, the walker refused by `solidPad`, `info.solidTop` =
the shell's h — the walls reach the ceiling), never a rise; a two-pass TOOTH CLEANUP (a solid cell with three open
neighbours opens, an open nub with one closes; never a forced cell) before THE GUARANTEE; then the mask's boundary
is TRACED into `info.planWalls`: every open/solid face is a unit edge on the half-cell lattice (skipped within
`wallInner` 0.75 m of the shell — the box shell's own wall serves), chained, simplified by Ramer–Douglas–Peucker at
`simplify` 0.5 m, and each segment becomes a wall row `wallT` 0.5 m thick in `wallKey` (an `urban:` sheet) pushed
into the solid by t/2 PLUS its own chain's reach toward the open side — the drawn face never protrudes past the
boundary the mask refuses at (a 2-cells-run stair deviates 0.45 m from its chord; the tolerance had to be 0.5, and
the push keeps the walker off the box). The renderer (three-renderer.js `_hqBuildTerrain`) draws them through the
one wall path (`drawWall`, a keyed material cache — hundreds of rows in one sheet) tagged `_ew_hqPart: 'wall'`, and
`_hqBuildHallsLights` hangs an emissive tube every 6.5 m down every corridor and hall and one over each BSP room
(`EW_HQ_NO_HALL_LIGHTS`). `check-terrain.js` prints `traced walls n`. The ring traced 544 rows before the RDP
rewrite, 131 after; the hub 152.

**THE PARTS (data.js, the block before H-WING; `hqBunkerShell(o)` beside the city shell; four looks
`HQ_ROOM_LOOKS.dumb / warroom / bunker / cern`):**
- `site_prebuilt_dumb_motorpool` 64 × 40 × 6 — the tram hall (authored, 50 × 14) with THE PLATFORM (a 1 m tier,
  two stairs, the edge rail), four `track_bed`s and the `train_car` lit at the east end (the near weenie), the
  bays (30 × 12) with `car_suv` / `car_cop`, a quarter pipe, the kerb ledge; THE SIGNAL GANTRY pinnacle (4.4 m,
  the tape). Doors: `lift` (s) ⇄ the board room's new back door (`siteRooms.backDoors.prebuilt_dumb`, n x −5,
  `leaf_bulkhead` wide), `seven` (n) ⇄ sub-level 7; **`links.area51_dumb.b` and `links.dumb_cern.a` RE-POINTED
  here** (the west and the east wall, `sub` per end) — the board room keeps `cave_dumb` alone on its north wall.
- `site_prebuilt_dumb_sublevel7` 96 × 72 × 8 — the hub (26 × 26) with THE TOWER (r 1.7, 6.5 m — the tape, the
  near weenie), CH01 THE DROP (a 3.5 m tier up an eight-tread stair + rail), CH02 THE CATWALK (two 4 m towers, a
  `deck` plank between, one stair), CH03 THE PIT (a `dip` r 6 × 2.2 m — walked down, climbed out — and a grind
  ledge), CH04 OBSERVATION (a 2.4 m deck up a stair, two `observation_window`s free-standing on its face); the
  five spokes: `motorpool` (s), `dream` / `clone` (w, z ∓18), `war` (e z −18, `leaf_vault`) / `bunker` (e z 18,
  `leaf_hotel`). The `MetalSubwayGrill` ceiling.
- `site_prebuilt_dumb_dreamlab` 48 × 36 × 4.2 (subway tile) — the ward (four cots, four traces, two pods, two
  screens), the range (THE OBJECT: a `floating_orb`, the spoons), the booth up a step; THE DREAM TOWER (3.6 m, the
  tape). Natives: two telepaths, a dreameater. Small BSP leaves (6..12) = the training rooms round the ward.
- `site_prebuilt_dumb_clonevats` 56 × 40 × 6.5 (corrugated) — six `iso_tank` vats in two rows under THE GANTRY
  (2.8 m, a stair, the rail), the `door_furnace` free-standing in the disposal bay, the chute, the kerb;
  THE VAT STACK (4.4 m, the tape); **THE OTHER ONE** — a `clone: true` native between the vats (Room II's rule).
- `site_prebuilt_dumb_warroom` 44 × 32 × 9 — family B, its own floor: the pit with two `conference_table`s and
  the phones, two 3 m galleries up two stairs with rails, THE BIG BOARD (three `dream_screen`s + two
  `monitor_stack`s on the north wall over the gallery), the world clocks, THE PROJECTION BOOTH (5.5 m, the tape).
  The one room that hangs props on the shell (no plan).
- `site_prebuilt_dumb_bunker` 60 × 40 × 5 (marble, painted plaster, the amber look) — the great room with
  three `false_window`s free-standing on the plan walls (the near weenie: daylight eighty metres down), the couch,
  the throne, the speakers, THE LOFT (2.6 m, a stair, a rail), the pool (a `pool` feature, waded), the cellar
  (three racks, the round fridge, the keypad for the panic room the BSP makes), THE SAFE STACK (3.8 m, the tape).
- `site_prebuilt_cern_ring` 100 × 100 × 5.5 — `bsp: false`: one authored loop hall (an octagon r 40, 5.5 m wide)
  + two spurs to the doors, the detector hall (22 × 24 on the east vertex: THE BEAM = the orb, six racks, the
  gantry 3.2 m up a stair) and the control room (18 × 14 on the north vertex); THE BEAM DUMP (4.2 m, the tape).
  CERN's board room opens on it by a new back door (`backDoors.prebuilt_cern`, n x −5); the tunnel from the
  motor pool lands on its west wall. Open share 19 % — `HQ_TERRAIN_GEN.halls.minOpen` 0.12 (a tunnel is
  mostly wall; hq-floor-plan.test.js reads `minOpen` per kind now).

**Tapes:** seven re-homed with new titles for the rooms they landed in (the base keeps its own two on the board —
the tape shelf's test reads the first built site's pair) — Antarctica's second → THE TRAM, 00:00 (the motor pool),
the North Pole's second → SUB-LEVEL 7, the Singularity's → REM, NIGHT 40, Mars's →
BATCH 12, Saturn's → THE HEXAGON (the war room), the Moon's → EARTHRISE (the bunker), Giza's → BEAM ON (the ring);
the hundred stays a hundred. `findSpots` pins the seven; every one `hard` with a door gun shot
(`hqFindHardReachTerrain` ok in all seven).

**Rules learned (in the guide's log too):** THE RAMP RULE's second half for STAIRS — a tread's rise plus the
tier's own 0.35 m edge step must stay under the slope rule (1.0) at the edge, so a stair wants ≤ ~0.45 m a tread
(L ≥ 2.2 × h) AND ends 0.7 m inside its tier (a 1.2 m overrun buries the last tread under the tier: a 1.0 m step
the walker refuses — THE DROP and the ring's gantry both failed on it); a plan room hangs NOTHING on the shell —
every wall prop stands FREE on a plan wall (`x, z, face, mount`; a `wall: true` catalogue row placed without
`p.wall` stands at its spot at `mount` height); `leaf_security` is the L4 rank leaf (the war room wears
`leaf_vault`); never `utility_box` as a room prop (door-kit-batch.test.js) — `traffic_barrel`.

**NOT built:** a chamber TEMPLATE library (`gen.rooms[].tpl` stamping features at the room's frame — every
chamber's features are authored by hand today), doors on the BSP rooms (a corridor opens straight into a room —
no leaf, no lock), a dropped corridor ceiling, THE SHAFT ROOM (§5 item 1), Area 51's hangar as a prefab part
(its board room keeps the saucer), the pack on the two board rooms, the psychic training as a mechanic (the
range is dressing), weenies on the sky (every part is closed).

**Tests:** `hq-dumb.test.js` (8: the sheet, the ways in + the tunnel, one piece, THE HALLS PLAN itself — BSP
rooms, authored rooms / halls kept open, L-corridors of right angles in range, the mass rule in every solid cell,
the traced walls on the boundary, no teeth, determinism — the solver + the return guarantee + the production
landing, the rooms' climbs, the park rule + the lights + the hard tapes, the helpers + the source sites +
check-terrain on all seven); hq-floor-plan (the kind, the per-kind `minOpen`, 28 planned), hq-terrain (33
rooms) and hq-finds (the shelf hints every other tape of a site — the first built site is a complex now) amended. `node check-terrain.js` solves all seven (every door, traps 0).

**Delivery:** `ENTROPY_WARS_DUMB.zip` — data.js → R2 AND Render (the finds ledger), three-renderer.js → R2,
index.html → Render (`20260917-dumb-01-cors`), the test, check-terrain.js and the docs → the repo. UNSEEN LIVE
(RULE #1c): all of it — the traced walls' read at the corridor corners (the RDP diagonals on the ring), the
strip lights' brightness (`_hqBuildHallsLights`: the tube colour is the mood's `strip`), the pack's concrete at
the tile, the tram's scale on its rails, the plank between the catwalk towers, the pit's slope under the walker,
the free-standing windows and screens, the furnace's mouth, the pool's water in marble, the orb on the ring's
vertex, the two new back doors' plates.

### 2026-09-18 — D.U.M.B. CONTINUED: THE CYCLE RULE, THE BASES BYPASSED, LEVEL P3 + THE RAMP, THE LOOPS, AREA 51 (three parts) (local delivery)

The user's five: "the room generation looks decent but there is a little too much dead ends or rooms
that don't connect anywhere else"; "I don't know if I like the motor pool being a thing when there is
already a parking garage, maybe connect them or call it P2 or something"; "we don't need the board maps
if the place already has an area, like CERN has a ring now"; "still need to add the Area 51 with the
hangar and white padded rooms and other stuff"; "keep improving the D.U.M.B. overall".

**THE CYCLE RULE** (data.js `_hqTGenerate`, the `halls` branch after the loops; `HQ_TERRAIN_GEN.halls.minDegree`
2): a Prim tree is a tree — every leaf of it was a room with one way in. Every ROOM node (BSP or authored) now
takes an L-corridor to the nearest node it is not joined to until it has two, preferring a node that is not its
neighbour's neighbour (six metres dearer) so the second way out goes somewhere else. `info.genPlan.edges` /
`.deadEnds` are the readout (check-terrain's JSON prints `deadEnds`; hq-dumb / hq-area51 insist on 0). Measured
on the five BSP rooms: the tree left 2 / 2 / 2 dead-end rooms in the hub, the ward and the bunker; none now
(+2 / +2 / +1 corridors). `gen.minDegree: 1` restores the tree for a room that WANTS a spur.

**THE BASES BYPASSED** (`siteRooms.entry` rows for `prebuilt_dumb` / `prebuilt_cern` / `prebuilt_area51`): the
freight lift lands you in the motor pool, the blast door on the ring, the hangar man-door in HANGAR 18 — each
part wearing the board's egress as its `bay` door on its south wall; the parts' own doors back to the boards are
gone (the grid's tenement-door rule). Every link that stood on those boards moved onto a part the same day
(a link door in a bypassed room would land at the bay door): `area51_dumb.a` → the hangar's EAST wall (the
floor lift), `cern_backrooms.a` → the ring's north wall at x −12 (a service bay off the control room),
`cave_dumb.b` → SUB-LEVEL 7's north wall (LEVEL −6 by the cave's count IS the level that does not exist by
the lift's). The boards still exist (the console, the marker, the register's number, the map's node) — nobody
walks them. KNOWN: the board rooms' own TAPES (D.U.M.B.'s two, CERN's, Area 51's) are unreachable on foot
now, exactly as Cyberpunk's / the Strip's / Downtown's have been since the third pass — hq-finds' 1–2-per-site
rule keeps them there; a rule that files a bypassed board's tape in its entry part is the next thing to do.

**LEVEL P3 + THE RAMP**: the motor pool is `D.U.M.B. · LEVEL P3` — P1 the garage, P2 the stair H-Wing took,
P3 the level the panel never had — and `links.garage_motorpool` (route `bases`, `leaf_bulkhead`) joins THE
GARAGE's west wall (z −2.5, lanes clear of the H-Wing stair at z 6.5) to the motor pool's south wall (x −16 —
x −14 left a corridor parallel to the bays whose thin wall the boundary test reads as open both sides): a
facility room seaming into a wild one, the garden well's precedent, never gated. The garage's `why` says so.

**THE LOOPS** (the cycle rule at the complex's own scale): every department has two ways out — THE SERVICE
CORRIDOR (dream `service` s x −6 ⇄ clone `service` n x 12, `leaf_frosted` wide — x 12 clears the gantry's
cliff, x −6 would have carved into it) and THE PRIVATE STAIR (war `stair` s x 8 `y: 3.0` — the door stands ON
the south gallery — ⇄ bunker `stair` n x 16, `leaf_coffee`). `leaf_frosted_single` is the L5 rank leaf — never
on a department door.

**AREA 51** (data.js, the block before D.U.M.B.'s; `hqAirbaseShell(o)` beside the bunker shell; looks
`HQ_ROOM_LOOKS.hangar` / `.white` / `.flightline`): **HANGAR 18** (`site_prebuilt_area51_hangar`, 72 × 48 × 9,
`halls` seed 51 round ONE authored hall — the BSP wraps it with offices and stores; THE RIG 1.2 m up a stair
with the `saucer_rig` proc on it (three-renderer.js: the tripod cradle, the lens, the dome, THE TARP breathing,
four floodlights aimed up — the near weenie; catalogue `light` / `glow`), THE CATWALK 5.5 m along the north
side up a 13 m stair, THE CRANE HOOK 8 m (the tape), the specimen tanks, the fire truck; doors: the bay (s),
the floor lift (e, the tunnel), `white` (w z −12), `flightline` (n x 18)); **THE WHITE ROOMS**
(`site_prebuilt_area51_ward`, 44 × 30 × 4.6, white plaster / tile / ceiling tile, `halls` seed 5150 with FINE
leaves 5.5–9 m = the cells and closets; the dayroom, the station, two padded cells — six `wall_padding` procs
standing FREE on the plan walls (`foot 0`, never a blocker), THE OBSERVATION DECK 2.2 m, THE CAGE 3.8 m (the
tape); doors: `hangar` (e z −12), `yard` (n x −14, `leaf_cell`) onto the flight line); **THE FLIGHT LINE**
(`site_prebuilt_area51_flightline`, 96 × 64 OPEN under the base's own night — hqAirbaseShell copies the
EW_MAP_META row's sky by hand (hq-area51.test.js diffs them), the Groom range as a `peak` landmark; a `rooms`
plan with no thicket, `wallH` 1.6 = the blast berms between the aprons; RUNWAY 33 a 9 m `path` in the city's
asphalt sheet, THE TOWER 4.5 m up a 10.5 m stair with the beacon (`floating_orb`) on it, THE MAST 8 m (the
tape), the revetments, the crater, the crew bus, the shelter, the fire truck, the wreck; four `flood_mast`
procs (new — an outdoor terrain room lights ITSELF, `shell.lights` must be empty; doorhq.test.js insists);
doors `hangar` (s x 18) + `ward` (s x −30)). Every part has two ways out: hangar ⇄ ward ⇄ flight line ⇄
hangar. Tapes: three re-homed (Gobekli's, Nuketown's, Bermuda's second — the hundred stays a hundred; THE
BADGE PHOTO stays on the board); `findSpots` pins the three hard tapes. Not built: a saucer GLB (the proc
stands in — MODEL_INDEX §8), the base's fence and gate as a road out, the runway lights as a ticker.

**Tests:** `hq-area51.test.js` (8: the sheet, the entry + the tunnel, one piece + the loop, the plans + the
cycle rule, the solver + the return guarantee + the production landing, the rooms' climbs, the park rule + the
lights + the hard tapes, the helper + the procs + check-terrain on all three); hq-dumb amended (the entry, the
five links, the loops, the cycle rule, the bay feet); hq-floor-plan (31 planned), hq-terrain (36 rooms),
disaster-city-3 (six entries). `npm test`: 1618 / 1612 / 0 / 6 skipped. `node check-terrain.js` solves all
ten (every door, traps 0, dead ends 0).

**Delivery:** `ENTROPY_WARS_DUMB_AREA51.zip` — data.js → R2 AND Render (the finds ledger), three-renderer.js →
R2, index.html → Render (`20260918-dumb-area51-01-cors`), the tests, check-terrain.js and the docs → the repo.
UNSEEN LIVE (RULE #1c): all of it — the second corridors' read (a room's two doors may sit close together
where the nearest node was round the corner anyway), the ramp's plate in the garage, the saucer under its
tarp at the rig's scale, the padding standing free of the plan walls (a corridor may still enter a cell on a
padded side — the panel is `foot 0`), the white grade's overexposure, the berms' read in `wasteland` at
1.6 m, the flood masts' throw at 26 m, the runway sheet under the wheel of lights.

### 2026-09-18 — THE DIVINE STAIR, second pass: the boards bypassed, THE FLOATING PIECES, the way down to Hell, the basilica to scale, the archive lit (local delivery)

The user: "get rid of the board rooms since each place is supposed to be its own area; try using the stairways
from the map builder (a floating staircase with floating steps) or something similar along with cloud platforms;
the path to hell the player should feel like they are going down — inclines in the catacombs and other hell areas;
the basilica needs a lot of work, sizes and scales are off; the library area is too dark to see anything".
- **THE BOARDS BYPASSED** (`siteRooms.entry` rows for `prebuilt_vatican` → THE BASILICA (the bay door at s x 0,
  the narthex), `prebuilt_hell` → THE PIT with `y: 5` (the mouth ON THE RIM — an entry door's `y` is its sill),
  `prebuilt_heaven` → THE CLOUD FIELDS with `wall: 'n', y: 1.75` (Room 777's hotel door ON THE DAIS: you arrive
  at the top of everything and every stair goes down to the dome)). The parts' own doors back to the boards
  (`piazza` / `mouth` / `heaven`) are gone; the three `backDoors` rows name `at: 'bay'`. Every link that stood on
  the three boards moved onto a part FIRST (the rule): `hollow_hell.b` / `cave_hell.b` → the pit's east wall
  (z 7 / z −3), `heaven_olympus.a` → the fields' east wall, `vatican_heaven` → the archive's west wall ⇄ the
  fields' west wall (the elevator is IN the archive), `bureau_vatican.b` → the cortile's east wall (the square in
  the painting), and `vatican_hell.b` → the pit's NORTH wall at `y: 2.5` (THE WARM LEDGE — the crypt comes out
  high in Hell and goes down again).
- **THE FLOATING PIECES**: a `plateau` or a stair `ramp` may wear `float: true` (data.js `hqTerrainCompile` →
  `info.floats`; the height rule untouched). three-renderer.js `_hqBuildTerrain` cuts the field's flank away
  round a float plateau (its own top — the sheet, the pool, the path — stays) and everything under a float
  flight but its foot and its mouth, and **`_hqBuildFloats`** hangs the pieces: a rounded slab in the cliff
  sheet (the thick cloud) with a ring of puffs under a platform's rim; one marble tread (the path sheet) per
  compiled step of a flight, 10 % apart, a puff under each — the map builder's floating staircase in the
  room's own kit. THE STAIRWAY: all five flights + every landing but the summit + the stepping clouds + the
  pinnacle float; THE CLOUD FIELDS: the dais's steps, the pillar of light and three new stepping clouds up to
  THE LOOKOUT (3.4 m) over the dais.
- **THE WAY DOWN**: THE CATACOMBS' crypt stair comes down onto THE LANDING (3.2 m, the door's sill) → THE
  DESCENT (two brick flights in a switchback down the south-west corner, 3.2 → 1.6 → the gallery floor) → the
  galleries → the sunken chapel; the shell is 6.6 m, the plan's rock 4 m. THE PIT: the mouth ON THE RIM (5 m)
  → three flights down the west side (5 → 3.4 → 1.6 → the floor) → THE BOWL (−2.4) → the lava; the warm
  wall's ledge (2.5 m) with its own ramp down over THE LAVA RIVER as the causeway; the gallery ledge east; the
  plinth north-west; the shell 10 m, the rock 5.5 m. **THE RAMP RULE at a descent**: a DESCENDING flight's
  HIGH end starts 0.7 m INSIDE its tier's rect (0.4 left a trench between the tier's edge blend and the first
  tread — the pit's second landing was unclimbable from the floor until the solver was run from every door).
- **THE BASILICA TO SCALE**: the pews 2.6 m (the catalogue; was 3.6), 2.2 m apart with a crossing at z 10; the
  nave's columns `h: 8.5` per row (the catalogue's 3.6 was a garden ornament under the 16 m vault); the
  windows `h: 5.5, mount: 7`; the cross 5 m; the carpet GLB stands UPRIGHT (it read as a tapestry) so it IS
  one — `holy_tapestry` (the same file, a wall row) ×4; the aisle is the terrain's carpet path; the nave lit
  (ambient 0.56, the incense fog a third and warmer), four more candle rings (ten lights, the cap).
- **THE ARCHIVE LIT**: ambient 0.62, the fog 0.011 (was 0.03 — the dark), the wood lighter, ten lights,
  `HQ_ROOM_LOOKS.archive` without the night mood / heavy vignette.
- hq-divine.test.js: THE WAYS IN = THE ENTRY, THE FLOATING PIECES, the descent walked down AND back up in
  both undercrofts, the scale pins; hq-world / disaster-city-3 amended. Ship data.js to Render too.
UNSEEN LIVE (RULE #1c): all of it — the puffs' read under a landing, the treads' gap at 60 fps, the cut's
edge where a float flight meets its tier, the tapestries' facing on the walls (`mount` / `h` are the edits),
the 8.5 m columns' girth, the pews' new size against the walker, the rim's height over the pit, the lava
under the causeway, the archive's new light against the wood.

### 2026-09-18 — THE DOOR GUN rev 5: the user's new model, Portal's two buttons, the far preview, the leaf swung open, the fling (local delivery)
The user's brief: the new Meshy model (`Meshy_AI__0916054803_texture.glb`, R2 `Assets/misc/` + the repo) as the default door
gun; no right-click aim-down-sights — LEFT CLICK = one door, RIGHT CLICK = the other, straight from Portal (blue on the left
button, orange on the right); the forecast preview must reach any valid surface however far; the placed door swung open
more so a crossing from the side never meets the leaf; and Portal's physics — speedy thing goes in, speedy thing comes out.
- **THE GUN**: `DOOR_HQ.catalogue.door_gun` → the new file, `base: 'misc'`. MEASURED off the vertex profile: the grip hangs
  at +X (the opposite end from the first gun), so `HQ_PORTAL_RULES.gun.turn: 180` pre-turns the INSTANCE in `_hqAttachHeld`
  (the walker), `_unitAttachHeld` (the Door Agent on the board) and `_hqViewmodel` (first person) — the glove, the muzzle
  and the shot keep their +X-barrel frame; `muzzle` y 0.11 = the new barrel line. The first gun stays in its folder unreferenced.
- **TWO TRIGGERS**: `_hqPortalFire(slot)` — `H.onMouseDown` fires 'a' on button 0 and 'b' on button 2; `_hqPortalSelect`,
  `_hqPortalAds`, `_hqLookGain`, the R / 1 / 2 keys, `adsK`, the lens narrowing + the boom pull in `_hqTickCamera`, the
  ADS event in map.js and the `ads` / `adsPos` rules are GONE. The ghost judges the surface for EITHER button (`_hqPortalAim
  (null)` — THE TWIN only when neither door could take the spot) and wears the verdict's green; the placed frame wears its
  button's colour as before. `HQ_PORTAL_RULES.buttons = { a: 'LEFT CLICK', b: 'RIGHT CLICK' }`; the hint / toasts / the
  OFFICER row say LEFT CLICK = A ● · RIGHT CLICK = B ■.
- **THE REACH**: `reach` 14 → 160 m (the whole of Disaster City); the march's step GROWS with the distance
  (`HQ_PORTAL_STEP_K` 0.03 × t, capped at `HQ_PORTAL_STEP_MAX` 0.9 — ~250 samples to 160 m against the old 117 to 14 m);
  the wall hit was already bisected between the last two samples, and a FLOOR hit is now stepped back onto the surface
  (`bk = (surf − py) / dir.y`) so a coarse far sample never lands the frame past the true point.
- **THE LEAF**: a placed WALL door swings `leafOpenDeg` 150 (near flat against the wall beside the frame — the leaf's tip
  stands 0.5 × the opening's width out from the wall, never inside it) and stands open from the landing (`leafAlways`;
  `_hqTickDoors` reads it — Portal's doors are always open). The room's own doors keep their 83° on the press-in.
- **THE FLING**: out of a floor hatch the whole entry speed comes out (`Math.min(C.max, up)`; it was capped at 12 m/s) —
  `_hqPortalMapCarry` already turned the vector and held the magnitude (hq-portal.test.js now proves it on a 14 m/s fall
  into a floor door with a wall twin: 14 m/s out, horizontal). Air control was already the walk's own WASD in the air.
- hq-portal.test.js: the rev 4 ONE TRIGGER test is replaced by three REV 5 tests (the buttons, the gun, the reach / leaf /
  fling). UNSEEN LIVE (RULE #1c): the new gun's grip and barrel in the hand (`gun.turn` / `pos` / `rot` are the edits — a
  barrel that still lands backward is `turn: 0`), its size in the viewmodel, the 150° leaf against each wall sheet, the far
  ghost's legibility at 100 m, the fling's feel out of a wall twin.

### 2026-09-18 — CAMELOT CASTLE (THE COMPLEX CANDIDATES #2): five parts on Room i, three families, the board bypassed (local delivery)

The user's brief (the candidate list): "the exterior (moats, gardens, the curtain wall) and an interior of several floors;
possibly a castle in the sky (Howl's moving castle)". Built on THE CAVE / THE WOODS blueprint and EXPLORABLE_AREAS_GUIDE
§3's build order: the story beats first, a family per part, the weenies before the plan, `node check-terrain.js` before
any claim.

**THE STORY BEATS**: arrive through the portcullis on the approach south of the moat → see THE CASTLE IN THE SKY over the
wall (the far weenie) and THE KEEP TOWER at the end of the avenue (the near one) → cross THE DRAWBRIDGE through THE
GATEHOUSE → the bailey: THE SWORD IN THE STONE, THE WELL (the undercroft's seam), the rampart stairs up to THE PARAPET WALK →
THE GREAT HALL (THE ROUND TABLE, the throne, the gallery) → THE KEEP's GREAT STAIR up to THE SOLAR and THE BATTLEMENTS →
the opening in the battlements' back wall → THE CASTLE IN THE SKY (three floating flights up to the keep in the air and its
dragon; THE SKY BRIDGE onto the stairway to heaven) — or down the dungeon stair to MERLIN'S UNDERCROFT (THE ORB, the
cistern, the ossuary) and out under the moat by THE SALLY PORT. The complex is a cycle (ward → hall → keep → ward; keep ⇄
undercroft ⇄ ward; keep ⇄ sky ⇄ heaven's stair).

**THE PARTS** (data.js, the block before AREA 51's; `hqCastleShell(o)` beside the airbase shell — Camelot's own night off
its EW_MAP_META row, a fog per metre, grass, the castle wall as the cliff sheet, a treeline, torchlight, the `skycastle`
landmark; `sky: true` = dawn above the clouds, cloud underfoot, the floating-islands roster, Camelot on the horizon below):
- `site_prebuilt_camelot_ward` — THE OUTER WARD, 96 × 80, open, `rooms` (rMin 7 / rMax 14, the hedges and the orchard the
  thicket). THE MOAT = a `deep_water` stream in a U round the bailey (never entered); THE DRAWBRIDGE = a `deck` spanning both
  banks; THE CURTAIN WALL = four `wall` rows (5.5 m, `castle_wall`) whose tops are a floor once the feet reach them — two
  rampart stairs up to wall-top terraces at the south corners make THE PARAPET WALK (walked end to end on both long walls
  and along the south wall, 5.6 m; a grind the whole way); THE GATEHOUSE = two plateau towers (8 m) on the gap; THE KEEP
  TOWER (9 m, the tape) beside the hall door; the sword's knoll; the tracks outside the moat to the wardrobe's snow (west
  wall) and the sally port. `weenie: { far: skycastle (deg 28, y 0.3), near: THE KEEP TOWER, seen from: bay }`.
- `site_prebuilt_camelot_hall` — THE GREAT HALL, 26 × 52 × 12, closed, NO plan (family B): THE DAIS (0.9) with the throne
  under the rose window, THE ROUND TABLE (the new proc) with its candle ring, THE MINSTRELS' GALLERY (3.5 m along the east
  wall up its stair), THE LOFT over it (8 m — the tape, shot from the gallery), the trestle bench (a low wall — the rider's
  ledge), the Lodge's saloon door + the keep's stable door on the west wall. `weenie: { near: the throne under the lit
  window, seen from: ward }`.
- `site_prebuilt_camelot_keep` — THE KEEP, 44 × 44 × 14, closed, `halls` round THE GUARDROOM and THE STAIRHALL (the BSP
  fills the stores round them; THE CYCLE RULE holds): THE GREAT STAIR 0 → 4.5 (THE SOLAR) → 9 (THE BATTLEMENTS, against the
  north wall — the sky's door stands on them, `y: 9`), THE TOWER TOP (12.5 m — the tape). `weenie: { near: the braziers at
  the stair's foot and the light of the sky door above, seen from: ward }`.
- `site_prebuilt_camelot_dungeon` — MERLIN'S UNDERCROFT, 48 × 36 × 6, closed, `cave` bricked to the ceiling (`bricks_2`
  the cliff sheet): THE CISTERN (waded) behind its kerb, THE GAOLER'S LEDGE (1.6) up its stair, MERLIN'S WORKSHOP on a
  raised floor with THE ORB and the crystals, THE OSSUARY SHELF (4.2 m — the tape). `weenie: { near: THE ORB, seen from:
  keep }`.
- `site_prebuilt_camelot_sky` — THE CASTLE IN THE SKY, 64 × 52 × 20, open, `rooms` with no thicket (the divine rule):
  THE FLOATING PIECES (`float: true`) — FLIGHT A → THE LOWER COURT (3, the fountain), FLIGHT B → THE BAILEY IN THE AIR
  (6.5), FLIGHT C → THE KEEP IN THE AIR (10, the gargoyles, the dragon), THE SPIRE (14 — the tape); every fall lands on the
  cloud deck and walks back to the first flight (two rescue ramps cut). `weenie: { far: castle (Camelot below, deg 180),
  near: THE SPIRE over the keep in the air, seen from: keep }`.

**THE ENTRY**: `siteRooms.entry.prebuilt_camelot` → the ward (bay s x 0); `backDoors.prebuilt_camelot` = the gatehouse arch
on the board's freed lane (n x −10). **THE SEAMS RE-POINTED** (one row edit each, never a duplicate): `fairy_camelot.b` = a
FREE pool on the moat's west bank in the ward; `haunted_camelot.b` = the ward's west wall (z 28, the snow in the trees);
`well_camelot.a` = FREE in the bailey; `camelot_lodge.a` = the hall's west wall. **NEW**: `links.skycastle_stair` (route
`divine`, `leaf_frame_only`) — the sky castle's east wall ⇄ the stairway's west wall (z 21, by the long way's foot): the
divine line gains a station.

**RULES LEARNED**: (1) **a terrain `wall`'s top is the HIGHEST ground under it + h** (`hqTerrainCompile`: `gmax + w.h`) —
a wall that runs through a plateau's footprint stands that plateau's height too tall along its WHOLE run (the south curtain
walls ran through the gatehouse towers and read 13.5 m; they end at the towers' OUTER edges now, the towers fill the gap) and a wall on a moat's bank sags with the bank (the long walls moved 2 m in); (2) the parapet walk works by the
step rule alone — a plateau at the wall's height abutting the wall, then the top is a floor; (3) a door landing 2.4 m in
must not stand on a low `wall` row (the hall's bench moved south of its two west doors).

**THE KIT** (three-renderer.js `_hqProcBuilders`): `round_table` · `banner` (wall) · `armour_stand` · `sword_stone` (lit);
`_hqLandmarkBuilders.skycastle` = the castle builder on a cloud isle. Catalogue rows in data.js. MODEL_INDEX §3l has the
wishlist (a portcullis, a drawbridge, battlement sections, a gargoyle).

**LOOKS**: `HQ_ROOM_LOOKS.camelot` (dream, blue night, bloom 0.3) · `greathall` (amber) · `keep` (faded stone) ·
`undercroft` (green-dark) · `skycastle` (dream, bloom 0.5, no night).

**TAPES**: one per part, five re-homed (the Backrooms' THE EXIT SIGN, Atlantis's THE PEARL DIVER, the Dutchman's THE
CAPTAIN'S TABLE, the Spaceship's CRYO, the Looking-Glass's THE MIRROR — every donor keeps one; the hundred stays a hundred);
`findSpots` pins the five hard tapes (the keep tower, the loft, the tower top, the ossuary shelf, the spire); every one
unreached by the walker with a shot from reached ground (`hqFindHardReachTerrain`). The board keeps THE ROUND TABLE (the
bypassed-board rule — filing it into the ward is still the next thing to do for every bypassed site).

**TESTS**: `hq-camelot.test.js` (9: the sheet, the weenies, the entry + the seams, one piece, the plans, the solver + the
return guarantee + the production landing, the rooms — the parapet walk, the tiers, the tapes — the park rule + the lights +
the hard tapes, the helper + the procs + the landmark + check-terrain on all five); amended: hq-terrain (41 rooms),
hq-floor-plan (35 planned), disaster-city-3 (the entry list), hq-woods (the pool on the ward), hq-world (the wardrobe's
edge). `check-terrain.js`: every door reached in all five, traps 0, the keep 0 dead ends. Focused run: hq-camelot 9 / 9; the sixteen suites the change touches + doorhq + hq-divine 116 / 116 after two amendments (the false `wide` on `leaf_shabby_wood`, the divine line's fifth leg). The full `node --test *.test.js` result is recorded in the commit that follows this one.

**DELIVERY**: `ENTROPY_WARS_CAMELOT_CASTLE.zip` — data.js → R2 AND Render (the finds ledger), three-renderer.js → R2,
index.html → Render (`20260918-camelot-castle-01-cors`), hq-camelot.test.js + the amended tests + CLAUDE.md +
DOOR_HQ_BUILD_PLAN.md + EXPLORABLE_AREAS_GUIDE.md + MODEL_INDEX.md → the repo.

**UNSEEN LIVE (RULE #1c)**: all of it — first the parapet walk's read on the wall tops (the wall's top is drawn at the
compiled `top`; the field under the terraces), the moat's stone banks in `castle_wall`, the drawbridge deck over deep
water, the gatehouse towers' scale against the 5.5 m wall, the sky castle's size and height over the ward (`s` 0.6 / `y`
0.3 on the landmark row are the edits), the round table's chairs against the cast rigs, the banners' colours, the sword's
glow, THE GREAT STAIR's second flight crossing the stairhall in the air, the floating pieces in `castle_wall` on their
clouds, Camelot on the sky castle's horizon, the brick cave under the green grade.
