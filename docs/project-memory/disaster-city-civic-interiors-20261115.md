---
name: disaster-city-civic-interiors-20261115
description: Civic Center (Disaster City district C) interiors LIVE PR #1397 (11-15): what was built, the traps (floor:true, lining, hollow, instanced props), what is unseen and open
metadata:
  type: project
  modified: 2026-11-15T01:03:17.622Z
---
Thread (thread in the owner project). Follows [[disaster-city-civic-20261113]].

- LIVE PR #1397 (data.js f57ff998, token 20261115-civic-06): nine walk-ins furnished in docs/disaster-city/districts/C.js "THE INTERIORS" (Fire Station, Civil Records, City Hall, Council annex, Courthouse, Police, Time Bureau, Military, Permit). mondo OK'd the plans 11-13 21:21 (/mnt/project-files/disaster-city-civic/interiors_1_plan.jpg, interiors_2_plan.jpg). Notes: areas-complexes.md "Civic Center, THE INTERIORS".
- Traps for any district doing interiors in a `skin:false` hollow texbuilding:
  - the shell draws NO inside: add own wall quads / dado / ceiling / floor sheet (C.js `A.line`).
  - a prop inside stands on the ROOF slab unless its row has `floor: true`.
  - exterior massing blocks that meet inside the shell show their faces in the room: C.js `hollow()` drops them (box part `faces`).
  - props placed 2+ times are InstancedMesh cells: a scene walk finds their groups with zero meshes, that is normal.
  - the city room's 10 prop lights are used up (buoys, lighthouse, fountains): no lamps possible from a district file; inside props read dark. Needs a three-renderer.js change (light budget per walk-in). OPEN, told mondo.
- Cloud probe: teleport needs `y` = level x 1.75; camera heading is not always north; after ~30 s a teleported player can end on a low roof. Seen on shots: linings, partitions, cell bars, flags, chairs, cabinets. NOT seen: fire engines, desks, beds; walking in through the swing doors.
- Waiting on mondo's look on his Mac; thread open.
- WASHINGTON DC restyle LIVE PR #1421 (11-15, mondo's "Build it as drawn" on the real-cities plan, (thread in the owner project): marble/limestone + copper, City Hall taller dome + statue, plaza obelisk + pool (10.5 m only: the avenue crosses the plot) + flags + iron fence, 8-column Courthouse, Military pentagon from 7 m up over the square walk-in, Records memorial on the glasshouse crown, Library dome + lions, 4 black cars, racks. C.js `DRESS` / `BARS`; cyl parts take `ry`. Notes areas-complexes.md "Civic Center = WASHINGTON DC". OPEN, asked mondo: Meshy concept OK for the seated statue + pink blossom trees. Probe fact: the teleport camera looks SOUTH. Shots /mnt/project-files/disaster-city-civic/dc_1..3.
- 11-15 later (other threads, already on main): districts MOVED (PR #1482): Civic is now the north-west block (city cols 0-3); C.js needs no edits, plot ids are names, levels = old + 2; never convert coordinates by hand, just merge main + rebake. `flag()` in C.js also pushes `flagq` quads (PR #1462): merge main before editing C.js.
