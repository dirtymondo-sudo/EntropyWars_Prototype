# Disaster City — adventure-first layout, revision 2

This replaces the first uniform city layout. It is a proposed playable blockout specification, not a finished level or a change to established story canon.

## What changed

The city is now designed as a connected adventure dungeon: recognizable hubs, routes that bend out of sight, optional branches, enclosed encounters, rooftop alternatives, and shortcuts that make return trips shorter.

The draft contains **144 plots across nine districts**, each 12×12 cells. At the working scale of 4 meters per cell, the city is 576×576 meters and each district occupies 192×192 meters. The older 16×16 city size was an assistant proposal, so this revision reduces it to 12×12 plots to make the initial playable area more deliberate.

There are **216 buildings** distributed across:

- 23 open-space/circulation plots.
- 45 single-building plots.
- 57 two-building plots.
- 19 three-building plots.

Building footprints range from **8 to 64 cells**, or 128–1,024 square meters. These are footprint areas, not total floor area. The largest footprint is 32×32 meters inside a 48×48-meter plot. Small roadside structures, compact clusters, larger landmarks, and building-free spaces now coexist.

Buildings stay inside their plots. A district, outdoor complex, road, or exploration route can span plots. A plot is an assembly unit, not a room, arena, or mandatory encounter.

## Requirements preserved

- 12×12-cell modular plots; cells approximately 3–4 meters; finer geometry placement. This revision uses 4 meters.
- Drivable streets, sidewalks, alleys, and accessible vertical circulation.
- Everyday, RPG, and tactical functions for buildings.
- Story exploration can become combat in place. Competitive PvP remains secondary.
- All 39 expanded modern roster entries have proposed anchors in the new map.
- A future version can reuse the city's route structure. Dinosaurs belong to that future storyline.
- Bayside needs an extensive police/helicopter response outside. The shadow beings are **approximately 10 feet tall, inside the mall**.
- Church in the city; haunted house/graveyard remain in the Woods; Vampire and deep-ocean cast remain outside this city.
- The latest request adds varied building sizes, up to two or three buildings in a plot, maze-like adventure progression, meaningful alleys, and walkable rooftops.

All new geography, quest passes, reward placements, bridges, floor counts, and scene sequencing below are proposals.

## The player experience

### A legible city with complicated local routes

Keep the major road network understandable. Players should be able to return to a main street and orient themselves. The maze develops **inside and between blocks**: a visible destination is reached through a shop yard, stair, roof bridge, service entrance, or courtyard loop.

The plan has 210 ground connections between plots, including 49 road connections. Roads occupy strips inside mixed-use plots instead of taking every cell of an entire plot. The main vehicle network is connected, but vehicle turning radii, deliveries, parking maneuvers, and traffic behavior still need engine tests.

Closed plot edges represent authored walls, fences, retaining boundaries, or adjoining private lots. They must look like believable city construction, not invisible barriers. The boundary cells are coarse collision bands; actual walls should use fine placement. Final dressing must disguise the modular grid.

District boundaries are organizational. The player should encounter changing architecture, sound, people, and activity rather than a giant border wall between themes.

### Loops, not repeated errands

Each district has a local circulation loop and branching connections. The layout avoids requiring a single long walk back along the exact route the player just used. Optional building interiors supply short dead ends with a person, clue, service, view, or reward.

Use four recurring experiences in different proportions:

1. **Arrival:** establish a landmark and a reliable return point.
2. **Problem:** make the destination visible but complicate the route.
3. **Discovery:** an alley, interior, stair or roof reveals a different approach.
4. **Return:** open a useful connection and see a familiar place from a new direction.

These are design beats, not a requirement for four quests in every district.

### Streets, alleys, interiors, roofs

- **Streets:** orientation, travel, large response scenes, long sightlines.
- **Alleys:** service access, quieter conversations, ambush possibilities, alternate approaches.
- **Interiors:** compressed encounters, social access, clues, doors that link different sides of a building.
- **Roofs:** observation and route discovery, movement over blocked ground boundaries, access to selected upper-floor destinations.

The selected network includes **33 supported roof crossings** in nine district routes. Most routes have four crossings; Downtown has two and Bayside has three. A roof route belongs to particular buildings, not every roof in the city.

Bridges span 8–16 meters in this draft. These are catwalks or supported pedestrian bridges, **not assumed jump distances**. Stairs connect the participating roofs to their building interiors. Upper floors, railings, bridge supports and landings need actual blockout geometry. The navigation check models the stairs/bridges as declared links; it does not validate their 3D shape.

Avoid precision platforming unless the movement system is deliberately built for it. The whole party needs to follow, and turn-based combat needs clear elevation transitions. A roof can be a useful alternative without requiring a new movement ability.

## District plan

| District | Exploration identity | Landmark | Proposed payoff |
|---|---|---|---|
| Residential / Southside | Backyards, shop clusters, social access, low roofs | Church bell tower | Community gate and a familiar route home |
| Civic Center | Public square versus staff/service access | City Hall dome | Records lead and rear civic route |
| Financial | Controlled entrances, staff corridors, exposed roof paths | Goblin Bank arch | Private-club route and vault lead |
| University | Courtyard loops, observation, research clues | Observatory dome | Research-annex connection |
| Downtown / Hero Plaza | City orientation hub and reversible shortcuts | Superhero Tower | Routes toward neighboring districts |
| Entertainment | Front-of-house and backstage routes | Concert marquee | A backstage-to-street shortcut |
| Industrial | Freight barriers, yards, maintenance routes | Port crane / hangar | Freight gate and aerospace access |
| Sports / Culture | Event circulation, terraces, back-of-house | Wrestling hall roof | Museum/arena service route |
| Bayside | Opening dungeon around a public cordon | Cinema sign / mall arch | Short route through the mall entrance |

### Residential / Southside

Two- and three-building plots make local services feel like a neighborhood. Give one yard an everyday reason to be open and another a clear private boundary. The church offers orientation and a social destination without importing the haunted Woods theme.

The main loop links the canal-side approach, bus stop, kitchen/church area, shops, backyard market, and homes. Roof crossings let the player inspect yards before descending. Small interiors provide optional recruitment scenes rather than mandatory combat.

### Civic Center

The plaza is open and easy to read; routes behind the civic buildings are more constrained. Let a public-facing entrance reveal the objective, while an annex, dispatch area, or records garden supplies a quieter approach.

Access should come from story context or a staff interaction rather than an unexplained locked door. Keep police and fire circulation practical. Bureaucratic satire belongs in dialogue and signs; wayfinding should remain clear.

### Financial

Contrast large prestigious buildings with small service premises. The Goblin Bank is a substantial footprint, while caterers, tailor shops, and worker facilities form tighter clusters.

The public street, service side, and roof route reveal different aspects of the district. Put the halfdemons in the social world of the members club. Any future status check or vault key is an optional proposed quest mechanic, not implemented gating in the current data.

### University

Alternate large research/teaching footprints with smaller student-facing buildings. Use the observatory as a navigational anchor and an upper viewpoint to foreshadow a lab destination.

The player can investigate courtyards and side rooms before committing to the research interior. Conspiracy clues should connect recognizable evidence, not require guessing an arbitrary sequence of doors.

### Downtown / Hero Plaza

This is the clearest navigation space, with fewer rooftop crossings than other districts. The tower, plaza, workshop, memorial, and transit court orient the player.

Several district routes return here. Preserve clear entrances and short paths to services; the central hub should not become another exhausting maze. The giant skyline landmark is an orientation aid, not a replacement for street-level signs.

### Entertainment

Street-facing venues and backstage spaces form two interlocking routes. A restaurant kitchen, costume shop, crew stair, and service yard make the route believable.

Use different operating hours or a performance to change how spaces feel without automatically removing access to critical recruits. Those schedule mechanics are not yet implemented. Stage doors and alleys are natural opportunities for short return connections.

### Industrial

Freight and maintenance routes should be visually distinct. Crane silhouettes and the hangar identify destinations through fog; lamps, rails, and marked walkways guide the approach.

The selected upper route uses supported industrial walkways, not unexplained jumps across warehouse roofs. A moving machinery puzzle is a possible later addition; the current cell layout has static traversal.

### Sports / Culture

The public park provides a calmer route between encounters. The wrestling hall and museum contrast with smaller clubhouse, clinic, locker-room, and equipment buildings.

Back-of-house access supports event or recruitment stories. The practice court remains a compact local facility; a regulation football stadium is not represented or silently squeezed into one plot.

### Bayside

The waterfront is a strong edge and return landmark. The mall is a connected outdoor complex with separate enclosed buildings. Keep the main shadow encounter **inside the concourse building**, with doors, people, and ceiling heights establishing its scale.

The police-response footprint surrounds the adventure route instead of consuming it. Some open staging plots are intentionally generous; not every plot needs buildings.

## Bayside opening quest: specific playable route

| Beat | Plot | What the player does |
|---|---|---|
| Arrival | P08-10 | Arrive on the response road; see the mall/cinema landmark |
| Blocked direct route | P09-10 | Discover the public cordon; understand the destination |
| Side-route discovery | P08-09 | Explore the market and find mall staff |
| Preparation | P09-09 | Food hall encounter provides a service pass |
| Controlled entry | P10-09 | Use the pass at the security/service route |
| Main encounter | P10-10 | Enter the mall concourse; investigate the 10-foot shadow beings |
| Short return | P09-10 | After the encounter, open the direct connection to the arrival side |
| Optional exit | P11-10 | Open the east-shop shutter toward the boardwalk |

The direct connection from P09-10 to P10-10 starts closed. The service connection from P10-09 to P10-10 requires the pass. The east-shop connection also starts closed and opens after the mall encounter.

**Verified in the cell graph:** at arrival the food hall is reachable but the concourse plot is not; after finding the pass the concourse is reachable; after clearing the mall the direct return opens. The selected roof network does not bypass these gates.

The initial service route crosses four plot connections from arrival to objective. The cleared-mall route crosses two. These are route-graph counts, not a claim about playtime.

The pass is a blockout placeholder for a useful interaction, not a final story script. It could become staff permission or another appropriate narrative condition.

### Cinematic and encounter space

- Police staging: P08-11.
- Loading/parking: P09-11.
- Medical/evacuation staging: P10-11.
- Boardwalk exit: P11-11.
- North–south response street: x=08.
- Southern response street: y=11.
- Eastern response return: x=11, connecting the southern street to the road at y=07.

These connected roads allow the multi-block police response to be framed outside the mall. Stage cars along selected segments, preserve one usable emergency lane, and keep intersections readable. Helicopter paths are an overhead cinematic layer, not rooftop walking links. Exact cars, cameras, crowd movement and aircraft trajectories remain to be placed.

The interior encounter should offer a forward entry, readable cover, a visible locked return, and an optional post-encounter exit. Avoid spawning enemies between the player and the only usable door without a deliberate encounter plan.

## Cell, edge, and building rules

### Coordinates

- City: 12×12 plots. Plot IDs Pxx-yy start in the northwest.
- Plot: 12×12 cells. Local x increases east; y increases south.
- North/south profiles read west to east. East/west profiles read north to south.
- Each plot declares four twelve-character edge profiles.

### Cell codes

| Code | Meaning |
|---|---|
| # | Closed boundary collision band: wall, fence, retaining edge, or authored obstruction |
| . | Walkable external ground / court / setback |
| P | Reserved pedestrian route |
| R | Vehicle carriageway |
| I | Building interior floor |
| D | Declared door cell |

Building walls are defined by the building footprint and door crossings. An I cell being walkable does not allow passing through its perimeter anywhere: the navigation check permits crossing that boundary only through a declared door.

Walls and doors use finer placement than the tactical cell size. A four-meter tactical cell does not imply a four-meter-wide door or wall. The current model uses four-neighbor cell movement; diagonal movement and corner-cutting are engine decisions.

Walking edge openings use cells 5–6. Road openings use cells 4–7, with pedestrian edge cells 3 and 8. Adjacent edges match exactly. Interior routes can narrow to one tactical cell.

Road surface cells are included in the current pedestrian reachability test. Traffic right-of-way, designated crossings, moving cars, and safety behavior are **not simulated**.

### Varied templates

- Large single building: an outer pedestrian route connects ports around a larger interior.
- Two-building cluster: unequal footprints and a service gap create multiple exterior corners.
- Three-building cluster: smaller shops/homes/workspaces with shared circulation.
- Roadside plot: carriageway and sidewalk continue through the plot while small premises occupy available space.
- Open plot: park, plaza, lookout, staging, practice space or transport junction.
- Roof-route plot: selected buildings participate in a continuous upper route with declared stairs and bridge endpoints.

Templates create buildable starting points. They still need hand-authored interior rooms and furnishings; variation in footprint alone is not enough to finish a level.

## Combat and exploration pacing

Proposed targets for the next blockout pass:

- One main story encounter and a few optional encounter-ready spaces per district; do not turn every plot into a compulsory fight.
- Put a safe orientation/social space before a difficult route.
- Show an important gate or destination before asking the player to find its approach.
- Give a short optional branch a clear payoff.
- Keep encounter boundaries understandable when combat begins in a street, interior, or on a roof.
- Make every roof encounter's stairs and retreat route legible.
- Recruits should add tactical options; mandatory traversal should not accidentally require a particular party composition.
- Use lights, sound, silhouettes, and sightlines to support the nostalgic low-poly aesthetic. Heavy fog must not hide the only route clue.

Time-to-traverse targets need playtesting. No minute estimates are treated as verified.

## Modern and future versions

Treat route topology as the reusable foundation. Future facade changes, retro-futurist equipment and elevated transit should respect critical street openings, stair access, bridge clearance and quest connections.

The dinosaur invasion can alter selected routes as an authored state: a broken bridge, a blocked freight street, or an emergency evacuation path. Every closure needs a tested alternative or a deliberate story gate. Those future-state alterations are not implemented in this revision.

## What is complete and what needs blockout testing

Complete in this delivery:

- Nine district definitions and 144 named plots.
- 216 building footprints with dimensions, floors, doors, and three functions.
- 20,736 cell positions, four edge profiles per plot, 210 ground connections.
- 33 selected roof crossings and their building/stair endpoints.
- All 39 modern roster anchors.
- Bayside gate-state checks and a navigable atlas.
- Ten vector maps: whole city and one per district.

Validated: all 264 adjacent plot-edge pairs match; all 144 plots and all 216 building entrances are reachable after the relevant gates open; arrival/pass/cleared quest states behave as described.

Not yet validated: full 3D geometry, actual upper-floor layouts, stair lengths, animation and party-following, line of sight, cover balance, vehicle turning, camera framing, streaming or performance. Roof links in the reachability test represent proposed stairs and bridges, not measured walking distances.

The city perimeter is the edge of this blockout, with closed boundaries. Connections to the wider world and final coastal/terrain geometry still need authored gateways.

**Next build priority:** implement the eight Bayside route plots and adjacent staging streets as graybox geometry, then test (1) whether players find the staff detour, (2) whether the interior gate and exit read clearly, (3) whether the shortcut feels useful, and (4) whether the police aerial conveys several blocks without obscuring playable routes.

## Files

- atlas.html — self-contained interactive city, district, and cell views; plot selection, roof layer, quest states.
- city-map.svg / district-R.svg through district-B.svg — editable vector maps.
- city-layout.json — complete structured layout and progression data.
- plots.csv / buildings.csv / connections.csv — editable inventories.
- validation.json — results of the navigation and edge checks.
