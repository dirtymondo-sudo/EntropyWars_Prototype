# DOOR HQ 2.0 · THE FLOOR PLANS (2026-11-26, thread 2)

mondo's redesign of DOOR HQ. The plan doc: https://claude.ai/artifact/69S69c6y5uBALhoQmiYsCY. The look of each level:
`LOOK_BOOK.md`. These five pictures are the layout every room thread builds from. mondo's word on them: lobby level
"looks good" (11-25), the other four "okay looks good" (11-25), with one change: NO DREAM LAB in DOOR HQ (the way to the
Astral Realm is the D.U.M.B.'s own Dream Lab, `docs/areas/dumb/districts/R.js`).

They are CONCEPT plans: where a room sits, what it touches and how big it is against its neighbours. A room thread turns
its piece into whole 3.5 m squares; it may move a wall by a square, never a room to another place.

| Picture | Level |
|---|---|
| `plans/1_lobby_level_plan.png` | The Lobby's floor, the Training Room, the Ring and its rooms |
| `plans/2_lobby_upper_level_penthouse.png` | The Lobby's upper level (no name in the game) and the Penthouse |
| `plans/3_garage_works_top.png` | Garage, and the Works' top level: the factory |
| `plans/4_works_middle_bottom.png` | The Works' middle (labs + holding block) and bottom (ritual rooms + Incinerator) |
| `plans/5_h_wing.png` | H-Wing |

## The building, top to bottom
One round building around ONE column: the Incinerator's flue. It is the column behind Rhonda's desk in the Lobby and the
shaft at the centre of every level of the Works.

1. **Penthouse** (lift only, locked until late): one long room, the Corner Office (its window should not exist), the
   Infinity Pool with an edge over nothing.
2. **The Lobby, upper level**: a 7 m gallery round the open floor. Behind glass, seen from the floor: Cryptid Division
   (Agent Forrest), Spirit Realm Division, Extraterrestrial Division, the Bureau of Continuity, the Observatory. The Cube
   hangs in the void. Reached by the curved stair and the glass lift. Which of Ringer / Glass leads which division is NOT
   settled by mondo (the pictures say Ringer = Spirit Realm, Glass = Extraterrestrial: a guess, ask before a nameplate).
3. **The Lobby** (49 m across): the main line runs Foyer > Rhonda's desk > the north passage > THE TRAINING ROOM
   (63 x 63 m, the most important room in DOOR HQ: never a side room). Open fronts on the floor, no doors: the Door Store,
   Medical, the Cafeteria (Kitchen behind it). Vending machines sell potions.
4. **The Ring**: the staff corridor round the Lobby, 7 m wide. Outside it: IT, Lost and Found, the Locker Room, the
   Bathroom, the Stair to the Woods, Your Office, Records, the Clock Room, the Barbershop, the Lecture Hall, the Cubicle
   Floor. It has one door too many: the plain door into H-Wing.
5. **Garage**: round car park, the lift, the taxi to Disaster City, the Subway platform. The roller door at its back is
   the front door of the Works.
6. **The Works, top (the factory)**: Loading Dock > Warehouse > the Line > the Chute (rejected doors go into the flue),
   then the Door Garden, the Autopsy Room, the Control Room, the Boiler Room, the Laundry. Service corridors ring it:
   they are the Works' hallways on every level. A freight ramp goes down.
7. **The Works, middle (the labs + the holding block)**: the Tank, Clone Disposal, Room X, the Server Room, Supply
   Closet 4B; then the Interrogation Room (its mirror is a window), the Hold, the Cells (the way to the Sewers). A stair
   goes down with more flights than it has coming back up.
8. **The Works, bottom**: the Ritual Room and the Sacrifice Room either side of the Incinerator: 28 m across, over 20 m
   tall, a catwalk round the furnace. The big story moment.
9. **H-Wing** (on no level): yellowed halls laid out like a dungeon, one plain door on every level above, so it is also
   the shortcut network. Its rooms: vignettes of other places with a lone door (desert at dusk, snowy pines, corn field,
   the Moon) and the building's own uncanny rooms (Swimming Pool, Garden, Home, the Thirteenth Floor, the Mandela Room,
   the Upside-Down Room).

## The rules every room thread keeps (mondo's list, 11-25)
- ONE name a room, no subtitle, no extra text. The upper level has no name.
- Higher ceilings everywhere; no hall under 7 m wide on the Lobby level and the gallery; no room as small as the old
  Hold or the old Room at the End.
- Nothing and nobody in a doorway: `node find-doorways.js <room>` before the PR. No table in front of a door.
- No men in black walking about, no Kit seated at Rhonda's desk, no Quartermaster, no Reception room, no dev tools in
  any room (they live in the main menu), no CPU training in the Interrogation Room.
- The Door Store is called only "Door Store" and sells doors (the capture items, CAPTURE_PLAN.md): no race buying and
  no party builder in story mode.
- Sitting looks right or the seat is not used.
- Fewer cards: a level is one piece wherever the engine allows (threads 6 and 7 make the joins and the impossible doors).
- Dress from `LOOK_BOOK.md` and MODEL_LIST.md; think like a director scouting a location.
