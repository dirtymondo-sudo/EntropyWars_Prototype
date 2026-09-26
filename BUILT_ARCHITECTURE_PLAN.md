# BUILT ARCHITECTURE PLAN — maps made of things that stand ON the floor (2026-09-26)

mondo, 2026-09-26: "the maps are using raised floors too much when there need to be objects or
buildings or stairs or bridges etc that sit on top of the floor but the player can still walk on
and into. Actual architecture." The stadium (THE BOWL) and the garage (Room P1) were rebuilt
this way. This plan says what changed, why the old builds read badly, how to build the next map
the same way, and which existing maps would gain from it. It adds a family to
EXPLORABLE_AREAS_GUIDE.md §1 (**E · BUILT**); it replaces none of the others.

Details of the two rebuilds: docs/notes/areas-complexes.md "THE BOWL",
docs/notes/hq-building-rooms.md "THE PARKING GARAGE". Test: stadium-garage.test.js.

---

## 1. BEFORE AND AFTER

### The stadium
| | Before (HEAD before 2026-09-26) | After |
|---|---|---|
| Room | 72 × 58, `gen: { kind: 'rooms' }` (clearings + corridors), noise 0.06 | 85.4 × 132.2 (a real 120-yard field + stands), no `gen`, noise 0 |
| Field | grass with a path loop for touchlines; the clearings generator decided where the open ground was | one flat rectangle painted like a gridiron (`hqGridironMarks`: end zones, yard lines, hashes, numbers, logo) |
| Stands | four `plateau` blocks (3.0–3.4 m) with cliff sides and a `ramp stairs` up each | `hqStandBowl`: 14 stepped rows of seats all round a rounded rectangle, a concourse, a facade; aisles you walk up |
| Tunnels | none: you came in at the top of a plateau; the service road was a `path` round the back pockets | three tunnels THROUGH the stands; the rows carry on over them as bridge slabs, so you walk under and over |
| Press box | a 6.4 m `plateau` on a plateau | a glazed slab (bridge) over the west stand; you walk under it on the concourse |
| Patch-ups | `gen.open` circles, paths "so the walker doesn't drop into a pocket", climbs to get out of pockets, gantry decks between plateaus | none needed: check-terrain reaches every door, nothing traps |

### The garage
| | Before (THE ROUND GARAGE, 2026-09-20) | After (THE PARKING GARAGE) |
|---|---|---|
| Plan | 48 × 48 box, `gen: { kind: 'halls', open: r 22.4 }`: the round wall was the TRACE of a raster mask | no `gen`: the round wall is 96 authored wall rows on a circle, each a mitred quad (`hqRingQuad`), drawn as one smooth drum |
| Wall | jagged (the traced mask's stair-steps + `simplify`), with pockets between floor pieces you got stuck in | one smooth cylinder; the 3 doorway gaps end on jambs placed on the chord boundaries |
| Levels | three decks, a 7.8 m `plateau` core, two ramp helixes made of straight `ramp` segments with notch patches (`hqHelixRamp`) | ONE `spiral` ramp (a smooth ramp swept round the centre, 10 m wide) up to ONE `bridge` arc deck at 4.2 m, on 8 columns |
| Open space | the core plateau filled the middle; cars and features filled the annulus | an open plaza (r ~17) with the skate pieces only; the cars park round the rim |
| H-Wing | a secret door at the end of an alcove | gone (the garage is easy to reach) |

---

## 2. WHAT IN THE OLD PLANS MADE THEM BAD

1. **Every vertical thing was a raised floor.** The terrain model's only tall shapes were
   `plateau` (ground lifted with cliff sides), `ramp` (ground sloped) and a traced plan `wall`.
   So a stand became a block of raised ground, a press box a taller block, a deck a plateau.
   Raised ground is solid underneath: you can't walk UNDER it or INTO it, so there were no
   tunnels, no concourse under a press box and no space under a deck.
2. **The generators decided the shape of a built place.** `rooms` (clearings) and `halls`
   (BSP + traced mask) are right for caves, woods, sewers and dungeons (families A / A' / C).
   A stadium or a parking garage is a building with a known plan; a generator gives it random
   clearings, or a round wall made by tracing a raster circle (jagged, with pockets).
3. **Round things were made of straight pieces.** Helix ramps from straight `ramp` segments
   needed notch patches; ring walls with square ends left wedge gaps; decks were 16 chord
   bridges. Joints are where the walker snagged and where it looked cheap.
4. **Pockets, then patches.** A plateau next to a wall leaves a strip behind it that the walker
   drops into and can't climb out of (a trap). The old specs grew `gen.open` circles, service
   `path`s, rescue `climb`s and gantry decks to patch pockets. Every patch is a sign the shape
   was wrong.
5. **The sizes were board-room sizes.** 72 × 58 can't hold a football field (110 m with end
   zones); 48 × 48 with a solid core can't hold open skating. The guide's "size generously"
   rule (§3.3) was not applied to set pieces with a real-world size.
6. **No paint layer.** A football field is recognised by its markings. The only paint was
   `path` (a texture swap), so lines, numbers and bay markings could not exist.
7. **The checks were about reach, not look.** check-terrain proves doors connect and nothing
   traps. It does not say "this is a pile of plateaus". The screenshots were the only check of
   the look, and they came after the design.

---

## 3. THE NEW FAMILY — E · BUILT (what exists now, in data.js / three-renderer.js)

Use it for anything people built with a known real-world plan: stadiums, arenas, parking
garages, stations, bridges, grandstands, amphitheatres, piers, overpasses, towers with floors.
The ground stays FLAT (noise 0, no `gen`); the architecture stands on it.

| Piece | Row | What it is |
|---|---|---|
| Solid block you can stand on | `wall` with `y` (absolute top) or `h` | collision capsule + a walkable flat top; `t` its thickness |
| A block of any footprint | `wall` + `quad: [[x,z]×4]` | the drawn footprint (mitred ring chords: `hqRingQuad(w, r, t)`) |
| A sloped top | `wall` + `slopeTop: [ya, yb]` | parapets along a ramp, drawn as one sloped prism |
| Merged / tiered rows | `wall` + `tier: true` (+ `seat` colour, `front` normal) | many rows drawn as one mesh; seats instanced on the front edge |
| Collision only | `wall` + `ghost: true` | never drawn (tunnel linings, invisible edges) |
| Rails | `wall` `rail: 'front' \| false \| [y0, y1]`, or a `rail` row | grind edges, sloped rails on ramps |
| A floor you walk UNDER and ON | `bridge` (straight: `x0 z0 x1 z1 w y thick`) | a slab at a height; the ground under it stays walkable (headroom 1.95) |
| A plain box slab | `bridge` + `plain`, `drawW`, `glaze` | tunnel roofs, a press box with windows |
| A curved deck | `bridge` arc (`r0 r1 a0 a1`, `drawR0/drawR1`) | ring decks, balconies, walkways round a centre |
| A curved ramp | `spiral` (`r0 r1 a0 a1 h0 h1`) | one smooth ramp swept round a centre, no joints |
| Stands round a pitch | `hqStandBowl(o)` | rows + concourse + facade + tunnels + aisles + corner fills, in one call |
| Paint | `terrain.marks` rows (`rect`, `line`, `text`) | field lines, bay lines, lane dashes, signs on the floor; `hqGridironMarks(o)` for a gridiron |
| Skate kickers | `ramp` + `kicker: true` | drawn as a wedge with coping, not a mound |

**Rules the solver taught (keep them):**
- A `bridge` beats walls in `hqTerrainFeet`: if a deck's footprint reaches past a wall, the
  walker walks over that wall. Keep every bridge inside the walls meant to stop it.
- Ring gaps: the skip ranges of `hqRingWalls` are chord-midpoint based, so put door jambs at
  the chord boundaries, not the nominal angle, or the gap leaves a pocket.
- A row cut by a tunnel continues over it as a bridge slab only when its top is ≥ 0.3 m above
  the tunnel ceiling; below that, the tunnel cuts the row.
- A hard tape on built architecture is fine: `hqFindHardReachTerrain` finds the face where the
  roof or slab ends (2026-09-26).
- A step of ≤ 0.42 m rise is walked (the stand rows are 0.42 × 0.85); a jump reaches 1.3 m.

---

## 4. THE BUILD ORDER for a BUILT map (adds to EXPLORABLE_AREAS_GUIDE §3)

1. **Real-world size first.** Look up the real thing (a field is 110 × 49 m with end zones; a
   parking ramp is ≥ 7 m wide for two lanes at a 5–15 % grade (the garage's is 10 m at ~10 %); a stand row is ~0.85 m deep). Size
   the room to hold it plus its surroundings. No `gen`, noise 0.
2. **Draw the plan as layers, low to high:** ground paint (`marks`), solid blocks (`wall`
   rows), then everything with space under it as `bridge` / arc `bridge` / `spiral`. Ask of
   every raised surface: "is there a room, a tunnel or a walkway under this in real life?" If
   yes, it's a bridge, not a plateau.
3. **Round things are round.** Circles and arcs use `hqRingWalls` + `hqRingQuad`, arc
   bridges and `spiral`, never straight segments with patches.
4. **Leave the open space open.** Decide what the player does in the middle (skate, fight,
   look at the landmark) and keep props at the edges, parked the way the real place parks them.
5. **Paint what makes it recognisable** (`marks`): lines, numbers, arrows, bay markings.
6. **`node check-terrain.js <room>`**: every door reached, nothing traps. If a pocket shows,
   fix the SHAPE (move a jamb, pull a bridge inside a wall), never add a rescue climb.
7. **Screenshots** from the probe (`playtest_hq_offline.js`, WAIT ≥ 30 s for heavy rooms)
   from the field, from the top and from inside a tunnel, before handing over.
8. **A test** that pins the shape (no `gen`, the key rows exist, the walker proof), like
   stadium-garage.test.js.

Checklist lines for EXPLORABLE_AREAS_GUIDE §8 (added there):
- [ ] a BUILT part: no `gen`, noise 0, sized to the real thing; every raised surface with
      space under it is a `bridge` / `spiral`, not a `plateau`
- [ ] no rescue climbs or pocket-patch paths: a pocket means the shape is wrong

---

## 5. OTHER MAPS THAT WOULD GAIN (candidates; mondo picks)

These are read from the specs, not played. Each is a small rebuild of one feature, not a
new map. Check the room's note in docs/notes before touching it.

1. **Downtown streets: THE PARKING DECK** (a 3 m tier up a car ramp). Today a plateau. As a
   built deck on columns, you could drive or skate under it too, and a spiral ramp would
   replace the straight one.
2. **Cyberpunk grid: THE SKYWAY** (4.5 m up a car ramp). A raised road is the textbook bridge:
   walk under it on the street, ride it on top.
3. **Downtown mall: THE MEZZANINE** (3.4 m). A mezzanine is a balcony round an atrium: an arc
   or straight bridge along the store fronts, with the ground floor walkable under it.
4. **Camelot: the curtain walls and the keep.** Wall walks as wall rows with walkable tops and
   towers as round `hqRingWalls` drums instead of plateau tiers; the gatehouse as a bridge
   over the gate passage.
5. **The Divine Stair's switchbacks** (0 → 12 m). A spiral stair round a core would replace
   the stacked plateau + ramp switchbacks, the way the garage's spiral replaced its helix.
6. **Area 51 hangar / D.U.M.B. halls: catwalks.** Bridges at 4–5 m over the hangar floor
   (the halls generator keeps the rooms; the catwalks are built on top).
7. **Any "stand", "stage", "balcony", "gallery", "deck", "pier" or "platform" written as a
   `plateau`.** A one-off audit script could list every plateau taller than 2.3 m that sits
   inside a building (not a cliff, crag or pinnacle) as a candidate. Nature stays plateaus:
   cliffs, crags, mesas and pinnacles are raised ground in real life too.

Suggested order: 1 → 3 → 2 (the cities are where mondo skates most), then 4 and 5.

---

## 6. LOG
- 2026-09-26: written after THE BOWL + THE PARKING GARAGE (thread "stadium and garage maps",
  zip maps/ENTROPY_WARS_MAPS.zip, token 20260926-maps-01-cors). Nothing in §5 is built.
