---
name: building-interiors-plan-20261123
description: mondo 11-23 "every door must open" + Hero Tower/Hotel loading screens + mystery-dungeon hotel + more Disaster City high-rises: the plan, audit numbers, status
metadata:
  type: project
  modified: 2026-11-23T16:33:03.611Z
---
Thread (owner-project id) "Plan building interiors and a bigger Disaster City". APPROVED 11-23 16:42.
Plan doc: https://claude.ai/artifact/RVPh8wvd9u6uAPj6QubPnd · pictures /mnt/project-files/building-interiors-plan/1..5_*.png.

- mondo 11-23 (rule): EVERY BUILDING WITH A DOOR MUST BE WALK-IN ("very important for a game called DOOR HQ").
- Audit (main 6851eae, script over data.js): Disaster City 94 walk-in, 99 closed (88 drawn Door*/MetalShutter sheets in arch fronts with no hollow row + 11 solid `city_*` pack props: 4 pizzerias, diner, burgerpiz, laundry, vhs, 2 houses, quequis); 36 walk-ins also show extra painted doors. Other zones ~50 closed, nearly all pack props (outhouses, Babel houses x12, stilt houses, huts, cabins, lighthouses, 2 gas stores). Arch-only buildings in other zones can't be counted by script.
- Heights: 216 of 242 city buildings < 20 m; only Superhero Tower (P06-04-B1, 70 m) > 60 m.
- Perf finding: closed interiors barely draw (F3 "rooms 2/106"); dips are loading/residents; BUT closed Industrial walk-ins (Port office P00-10-B1, Power station P02-08-B1, Aerospace lab P03-09-B1) re-record in bursts -> fix before adding ~100 more rooms. Loading screen only for 3+ furnished floors; extend the fight's PARKED ROOM to building doors so leaving doesn't reload the city.
- Proposed: Hotel (Financial Luxury hotel P08-00-B1, 28x28 m) = mystery dungeon, seeded maze floors built at load like pdInstall, reuse Mystery Dungeon mode rules (data.js MD_DUNGEONS/generateMdFloor; old mode stays). Hero Tower = stacked room behind lift (like bake-camelot-castle.js), raised to 175 m. ~24 towers 45-150 m in core. Step 1 = 4 parallel threads (kits + find-doors.js + chain insides; hotel; tower; skyline mock-up), step 2 = district threads (C held by second account).
- 11-23 16:38 mondo PICKED THE HOTEL as the mystery dungeon. 16:42 GO-AHEAD on the whole plan; his rule: UNREACHABLE DOORS become windows OR move to a side that opens onto walkable ground. Coordinator asked to start the 4 step-1 threads. Assumed (not asked again): Financial hotel, bigger on the inside from floor 5, tower floor list = draft.
- 11-23 HOTEL DUNGEON SHIPPED (PR #2479, live, (thread in the owner project)): data.js HOTEL-MD block, rooms site_prebuilt_hotel_f1..f10 rebuilt per lift ride; lobby door `hotel_lift` injected at load (no bake). Not yet: boss suite, floor kinds, guest book, levels rising per floor.
- STEP 1 KITS THREAD DONE PR #2487 (11-23): find-doors.js, docs/interiors/kits.js (`kit:'shop'` on a city row), chain insides (every city_pizzeria / city_gas_store walk-in via HQ_WALK_IN_PROPS), parked city (HQ_PARK_DOOR). Known: Hero Plaza colonnade columns stand inside the plaza pizzeria's front (H district's arch); parked-city way back unproven in cloud (browser crashes with two rooms). Step 2 = district threads open doors with these tools.
