# THE HEIGHT PLANS (world polish), one file a room

`node docs/plans/world-polish/draw-plan.js docs/plans/world-polish/plans/<zone>.js [--no-png] [--no-room] [--ascii]`

The tool reads a DATA-ONLY plan, checks it against WORLD_POLISH_PLAN.md sections A, E and F, prints every failure and writes
`<zone>.svg` + `.png` beside the plan (the picture mondo reads in chat). Exit code 1 = a check failed. `woods-clearing.js` is the worked
example (thread 6's plan 3, the same squares as `thread6/plan3.js`).

**Section A's numbers are ONE table at the top of `draw-plan.js` (`const A`).** mondo changes a number there in one line; every plan is
checked against it on the next run.

## The format (`module.exports = { … }`)

| Field | What it is |
|---|---|
| `zone`, `thread`, `title` | names for the picture |
| `room` | the real room id. The tool loads it (`load-data.js`) and checks the plan against how the room REALLY stands: every real plot is in the plan at its real place, the grid is the room's, each way out stands at the height it has today. |
| `grid: { w, h, n: 12, at: [c, r], zero }` | the room in squares; `at` = where the room's plot P00-00 stands in the plan's grid when the plan grows the room west or north; `zero` = the metres of level 0 today |
| `grows` | one line when the plan makes the room bigger (free to do, mondo 11-20) |
| `build: { frame: 'room', file }` | where a build thread writes the pieces. One World re-laid most rooms plot by plot: a way or a piece that crosses a plot line must be written in a ROOM-FRAME design file, never in a home-frame district file (thread 3's lesson). |
| `approved` | mondo's words and the date, once he OKs it. Until then the picture says "a proposal". |
| `mass`, `massHeight` | what the closed squares are (forest, corn, rock, ice) and how tall, in levels (it blocks a lookout's sight) |
| `districts: { K: { name, color, flat: 'why' } }` | `flat` = a district level on purpose (fields) |
| `plots: [[box x, box y, name, district, level today or null = new, level planned, { flat: 'why', relief: 'a bank', home: [hx, hy] }]]` | one row a plot |
| `start: [x, y]` | the square every walk is checked from |
| `steps: [...]` | the ground and the ways, IN ORDER (a later row lies over an earlier one): `['area', x0, y0, x1, y1, square, level]`, `['main', [[x, y, level], …], { name, wide: 4, why }]`, `['thin', pts, { to: 'WHERE IT LEADS' }]` (1 square), `['lane', pts, { to }]` (2 squares), `{ cont: true }` = the next piece of the trail before it, `['ramp', x, y, level, uphill dx, dy, letter]`, `['set', x, y, square, level]`, `['label', x, y, text, 'mark' or 'place' or 'note' or 'door']`, `['doors']` (lay the ways out now; rows after it lie over them) |
| squares | `p` main way, `q` thin trail, `d` lane, `g` open ground, `c` hard ground, `m` soft ground, `k` building / landmark, `r` rock face, `w` water, `f` fence, blank = the mass. `tiles: { x: [legend name, open?, [r,g,b] low, [r,g,b] high] }` adds one. |
| `doors: [[x, y, side, where to, level]]` | the ways out of the room. Their squares keep today's height (E 7). |
| `bridges: [[[x, y], [x, y]]]` | a deck from one square over to another |
| `stairs: [[[x, y], [x, y]]]` | a STAIR between two squares at any heights (real stair pieces: steeper than a ramp, e.g. cut in an ice wall); walked both ways |
| `underlay: true` | for a room that already has its height ("improve upon what's already there"): every square starts as it really stands today, read from the room (`u` = today's open ground at its real height; walls and cracks closed; water). The plan lays its ways and places over it. `underlay: { deep: 4 }` = a square this many levels under its plot is a crack, not ground. `underlay: { shift: true }` = a plot whose planned level differs from today's has its whole ground moved by the difference (the land is re-levelled plot by plot). |
| `landmarks: [{ name, at, tall }]` | `tall` in levels. One in every district. |
| `lookouts: [{ name, at, sees: landmark name, next: district }]` | one in every district. The tool draws the sight line over the ground, the mass and the buildings and FAILS it when something stands in the way. |
| `found: [{ name, from, to, kind }]` | the FOUND ways up (a climb, a ledge chain, a fallen trunk, a ladder): E 2, every level has a way you walk and a way you find |
| `flats: [{ name, rect, why, board: true }]` | every place kept level ON PURPOSE, with its reason; `board` = a fight place (8 x 8 squares on one whole level) |
| `buildings: [{ name, rect, door: N S E W, tall, inside }]` | every building that needs an outside and an inside: its squares are drawn `k`, a square in front of its door is open, `inside` says what you walk into |
| `picture`, `pictures: [{ suffix, x0, x1, y0, y1, S, title }]` | the size of the picture; more pictures of parts of the room |

## What it checks

- **A:** main way width, thin trail width, no straight leg over the limit, no two legs in one line, ramps fit, THE MAIN WAY NEVER FOLLOWS A ROW
  OR COLUMN OF PLOTS, never over 2 plots in a row on one level (unless `flat`), a thin trail every 2 plots and each says where it leads,
  district ranges, 3 levels in a district, half the plots shaped inside, a fight place every 3 plots.
- **E:** every square and every way out walked from the start with no ledge; no trap; a found way up to every level; seams at today's height;
  a landmark and a lookout in every district and the lookout really sees its landmark and the next district; fight places on one whole level.
- **F (thread 3's traps):** the plan is in the room's real frame; a room one plot wide; a way that ends on a plot side with no neighbour; a
  piece off the plots; pieces across plot lines with no room-frame design file.
- **The variety rule (mondo 11-20, same weight): WARNINGS** when nearly every plot is hilly, when nearly every way zigzags, when no level place
  is named, when the zone or a district has no real building.
- Not checked by the tool (a thread still answers them, THE CHECK in section A): "every district can be crossed by 2 different ways", the
  75 % detail bar, skate lines (E 5), waterfalls (E 6).

A rule newer than a plan mondo already OK'd is printed as a NOTE for that plan, never a stop.
