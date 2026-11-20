// World map redesign concept v7: ON THE GRID. Every zone, island and route is whole plots.
// Plot units: x east, y south, 1 = one 12x12 plot (12 battle squares, 42 m). Disaster City's NW corner = 0,0.
// The disc's centre = 0,12 (the city's SW corner); radius 44 plots = 528 battle squares. Run: node gen.js
const fs = require('fs');
// v12 (mondo 11-17, "too big, go back to a smaller size but keep these changes"): K = 1 is the pre-grow size; every v11 place
// written in the grown (K = 2) frame below is pulled back through F, round its centre, keeping its own size
const K = 1, PIV = [14.5, 7];
const F = (x, y) => [PIV[0] + (x - PIV[0]) * K / 2, PIV[1] + (y - PIV[1]) * K / 2];
const FR = (x, y, w = 0, h = 0) => { const c = F(x + w / 2, y + h / 2); return [Math.round(c[0] - w / 2), Math.round(c[1] - h / 2)]; };
const CEN = F(-14, 17).map(Math.round), RAD = 44 * K; // K = 1: radius 44 plots = 528 battle squares (1.85 km)
const S = 16 / K;
const OX = 800 - CEN[0] * S, OY = 800 - CEN[1] * S;
const P = (x, y) => [OX + x * S, OY + y * S];
const W = 1600, H = 1600;
const r1 = n => Math.round(n * 10) / 10;

const BIOME = { city: '#7d808a', snow: '#dfe8ef', forest: '#2f5a34', dark: '#27402a', farm: '#9a9446', desert: '#cfa660', sea: '#1d4e74', holy: '#c9bfa8', rock: '#7a6d60', ancient: '#b98d58', ice: '#cfeaf5' };
const SURF = [
  { id: 'np', x: 0, y: -28, w: 4, h: 4, b: 'snow' },
  { id: 'mtn', x: -14, y: -18, w: 12, h: 4, b: 'snow' },
  { id: 'shasta', x: -5, y: -14, w: 2, h: 4, b: 'snow' },
  { id: 'hills', x: 0, y: -3, w: 13, h: 3, b: 'rock' },
  { id: 'city', x: 0, y: 0, w: 12, h: 12, b: 'city' },
  { id: 'vat', x: -12, y: -6, w: 6, h: 4, b: 'holy' },
  { id: 'col', x: -11, y: -9, w: 3, h: 3, b: 'holy' },
  { id: 'cam', x: -28, y: -4, w: 8, h: 8, b: 'forest' },
  { id: 'woods', x: -14, y: 2, w: 6, h: 6, b: 'dark' },
  { id: 'estate', x: -15, y: 15, w: 6, h: 6, b: 'farm' },
  // THE DESERT, spread out: its four districts stand apart, joined by its own Highway plots
  { id: 'circus', x: 6, y: 21, w: 3, h: 3, b: 'desert' },
  { id: 'wt', x: -4, y: 26, w: 4, h: 4, b: 'desert' },
  { id: 'a51', x: 2, y: 33, w: 4, h: 4, b: 'desert' },
  { id: 'giza', x: 13, y: 29, w: 4, h: 4, b: 'desert' },
  { id: 'beach', x: 12, y: 2, w: 8, h: 10, b: 'sea' },
  { id: 'ley', x: 23, y: 30, w: 6, h: 3, b: 'ancient' },
  { id: 'ley2', x: 23, y: 33, w: 9, h: 4, b: 'ancient' },
  // STONEHENGE leaves Leylines (its 3 x 3 north-east corner) for the plain north-west of Camelot, below the mountains
  { id: 'stone', x: -31, y: -9, w: 3, h: 3, b: 'ancient' },
  { id: 'ant', x: 0, y: 46, w: 6, h: 6, b: 'ice' },
];
const ISL = [
  { id: 'volcano', name: 'VOLCANO ISLAND', x: 22, y: -19, w: 6, h: 6, fill: '#3a4a33' },
  { id: 'tri', name: 'BERMUDA TRIANGLE', x: 34, y: 0, w: 6, h: 6, fill: 'rgba(40,90,130,.45)', dash: true },
  { id: 'cove', name: 'PIRATES’ COVE', x: -30, y: 31, w: 3, h: 3, fill: '#d9c08a' },
  { id: 'frozen', name: 'THE FROZEN SEA', x: 0, y: -30, w: 4, h: 2, fill: '#e8f1f6' },
];
// ── THE GROW (v10): every place keeps its size, the distances between them double ──
const T = (x, y) => [PIV[0] + K * (x - PIV[0]), PIV[1] + K * (y - PIV[1])];
const TG = (x, y) => T(x, y);
const TI = (x, y) => [PIV[0] + (x - PIV[0]) / K, PIV[1] + (y - PIV[1]) / K];
const GROUPOF = { hills: 'city', beach: 'city', shasta: 'mtn', col: 'vat', ley2: 'ley', frozen: 'np' };
const ANCHOR = { city: [14.5, 7], cam: [-28, 0], ley: [32, 34], a51: [4, 37], np: [2, -28] }; // coast points that must stay on the coast
const GB = {};
for (const z of [...SURF, ...ISL]) { const k = GROUPOF[z.id] || z.id; const q = GB[k] || (GB[k] = { x0: 1e9, y0: 1e9, x1: -1e9, y1: -1e9 }); q.x0 = Math.min(q.x0, z.x); q.y0 = Math.min(q.y0, z.y); q.x1 = Math.max(q.x1, z.x + z.w); q.y1 = Math.max(q.y1, z.y + z.h); }
const OFF = {}; for (const k in GB) { const q = GB[k], a = ANCHOR[k] || [(q.x0 + q.x1) / 2, (q.y0 + q.y1) / 2], t = T(...a); OFF[k] = [Math.round(t[0] - a[0]), Math.round(t[1] - a[1])]; }
for (const z of [...SURF, ...ISL]) { const o = OFF[GROUPOF[z.id] || z.id]; z.x += o[0]; z.y += o[1]; }
// ── THE SPREAD (v11, mondo 11-17): a zone's districts stand apart across its own country, joined by the zone's trails ──
// absolute plot coords (after the grow); each district keeps its plot count; the first id keeps the zone's id so the routes still land on it
const SPREAD = {
  woods: [['woods', 'The Clearing', -39, 1, 3, 3, 'dark'], ['woodsT', 'The Redwood Trail', -50, -25, 3, 3, 'dark'], ['woodsG', 'The Ritual Ground', -57, 15, 3, 3, 'dark'], ['woodsM', 'Dead Man’s Cave', -32, 10, 3, 3, 'dark']],
  cam: [['cam', 'Castle + Village', -69, -10, 6, 6, 'forest'], ['camN', 'The Snowy Pines', -62, -31, 4, 2, 'snow'], ['camL', 'Looking-Glass Garden', -80, -5, 3, 2, 'forest'], ['camF', 'The Fairy Forest', -57, 0, 2, 3, 'forest'], ['camW', 'The Forest', -70, 9, 4, 2, 'forest']],
  estate: [['estate', 'The Lake', -40, 26, 3, 3, 'farm'], ['estC', 'The Corn Fields', -24, 34, 3, 3, 'farm'], ['estH', 'Haunted House', -54, 28, 3, 3, 'farm'], ['estR', 'The Ranch', -44, 40, 3, 3, 'farm']],
  mtn: [['mtn', 'Mount Olympus', -37, -40, 4, 3, 'snow'], ['mtnP', 'The Snowy Pass', -28, -51, 4, 3, 'snow'], ['mtnK', 'The Ski Lodge', -58, -43, 4, 3, 'snow'], ['shasta', 'Mount Shasta', -12, -45, 4, 5, 'snow']],
  ley: [['ley', 'Göbekli Tepe', 27, 55, 3, 3, 'ancient'], ['leyY', 'The Ley Line', 33, 56, 9, 1, 'ancient'], ['ley2', 'Babel', 45, 53, 4, 3, 'ancient'], ['leyB', 'Bug Colony', 36, 64, 3, 3, 'ancient'], ['leyZ', 'Technoticlan', 47, 63, 5, 3, 'ancient']],
};
const OVR1 = { ley: [19, 29], leyY: [22, 30], ley2: [31, 29], leyB: [23, 34], leyZ: [28, 34] }; // at K = 1 Leylines' plateau is too short for a straight pull-back
const SPREAD_TRAILS = { woods: [['woods', 'woodsT'], ['woods', 'woodsG'], ['woods', 'woodsM']], cam: [['cam', 'camN'], ['cam', 'camL'], ['cam', 'camF'], ['cam', 'camW']],
  estate: [['estate', 'estC'], ['estate', 'estH'], ['estate', 'estR']], mtn: [['mtnK', 'mtn'], ['mtn', 'mtnP'], ['mtnP', 'shasta']], ley: [['ley', 'leyY'], ['leyY', 'ley2'], ['ley', 'leyB'], ['leyB', 'leyZ'], ['ley2', 'leyZ']] };
const ZONEOF = {}; const DNAME = {};
{ const drop = new Set(['woods', 'cam', 'estate', 'mtn', 'shasta', 'ley', 'ley2']);
  for (let i = SURF.length - 1; i >= 0; i--) if (drop.has(SURF[i].id)) SURF.splice(i, 1);
  // ── THE PLOT SHAPES (v13, mondo 11-17: "move plots, not only whole districts; some of these woods are the alternative paths") ──
// every plot of these districts placed on its own: [plot name (the district file's own name), x, y]; K = 1 coordinates
var SHAPES = {
  // THE WOODS: the Clearing is the hub; the Redwood Trail climbs north to the Snowy Pass; Dead Man's Cave follows the creek east to the
  // city; the Ritual Ground is a loop round its lake deep in the west, where Camelot's forest road and the Haunted House drive meet it
  woods: [['Stair', -14, 0], ['Old Tree', -15, 1], ['Crossroads', -14, 1], ['Deep woods, east', -13, 1], ['Trail West', -16, 1], ['Deep woods, west', -17, 1], ['Campfire', -14, 2], ['Deep woods, south', -14, 3], ['Fence Line', -14, 4]],
  woodsT: [['Snowline', -17, -9], ['Shelf', -17, -8], ['Falls', -17, -7], ['Old Trees, north', -17, -6], ['Meadow', -17, -5], ['Creek, upper', -16, -5], ['Old Trees, south', -16, -4], ['Trail', -16, -3], ['Creek, lower', -16, -2]],
  woodsM: [['Culvert', -12, 1], ['Dry Creek, upper', -11, 1], ['Rocks', -11, 0], ['Dry Creek, lower', -10, 1], ['Hollow', -9, 1], ['Gully', -8, 1], ['Sewer Mouth', -7, 1], ['Tunnel Way', -7, 2], ['Storm Drain', -6, 1]],
  woodsG: [['Mound', -22, 6], ['Lake, west shore', -21, 6], ['Lake, east shore', -20, 6], ['Tents', -22, 7], ['Owl', -20, 7], ['Fire', -22, 8], ['Stones', -21, 8], ['Dead Tree', -20, 8], ['Stage', -19, 7]],
  // CAMELOT: the walled castle + village stay one block; its four outer districts leave by the four gates as roads into the country
  camN: [['Snowfield', -26, -4], ['Sleigh Road', -26, -5], ['Snowfield, east', -26, -6], ['Snowfield, west', -26, -7], ['Snowy Pines, west', -25, -7], ['Snowy Pines, east', -25, -8], ['Snowy pines, north-west', -25, -9], ['Snowy pines, north-east', -25, -10]],
  camL: [['Lawn', -30, 0], ['Chessboard', -31, 0], ['Hedges, north', -31, -1], ['Mirror', -32, 0], ['Hedges, south', -31, 1], ['Tea Party', -33, 0]],
  camF: [['Knoll, north', -23, -1], ['Pond', -23, 0], ['Fairy Ring', -22, 0], ['Knoll, south', -22, 1], ['Woods Trail', -21, 0], ['Spring', -20, 0]],
  camW: [['Crown’s Road', -26, 3], ['Forest Road', -26, 4], ['Glade, west', -26, 5], ['Forest Road, west', -26, 6], ['Dead Tree’s Hole', -26, 7], ['Glade, east', -25, 5], ['Forest Road, east', -24, 5], ['Deep forest, south-east', -23, 5]],
  // THE ESTATE: the Woods Gate opens straight onto the corn, the corn runs south to the Lake, the Ranch runs on towards the Desert,
  // and the Haunted House sits alone up its own drive in the forest
  estC: [['Woods Gate', -14, 5], ['Tall Corn', -14, 6], ['Scarecrow', -13, 6], ['Circles, west', -14, 7], ['Circles', -13, 7], ['Farm Track', -14, 8], ['Rows, west', -14, 9], ['Rows, east', -13, 9], ['Hub', -14, 10]],
  estate: [['Reeds', -12, 15], ['North Shore', -11, 15], ['Boathouse', -10, 15], ['Dock', -12, 16], ['Lake', -11, 16], ['Lake, east', -10, 16], ['South Shore', -12, 17], ['Lake, south', -11, 17], ['Marsh', -10, 17]],
  estH: [['Iron Gate', -21, 11], ['Drive', -21, 12], ['Lawn', -21, 13], ['Haunted House', -21, 14], ['Gazebo', -22, 14], ['Treehouse', -20, 14], ['Graveyard', -21, 15], ['Family Plot', -22, 15], ['Crypt', -22, 16]],
  estR: [['Ranch Gate', -11, 18], ['Yard', -11, 19], ['Barn', -10, 19], ['Farmhouse', -12, 19], ['Paddock', -11, 20], ['Windmill', -10, 20], ['Pasture', -11, 21], ['Hay Field', -12, 21], ['Cow Field', -11, 22]],
  // THE MOUNTAINS: Olympus' summit with its way down to the Colosseum; the Pass climbs the range from the tree line to the ridge;
  // the Ski Lodge's runs come down to the lodge; Shasta's summit with its switchbacks down the west side
  mtn: [['Twelve Thrones', -12, -18], ['Temple', -11, -18], ['Grand Stair', -10, -18], ['Stadium', -12, -17], ['Colonnade', -11, -17], ['Cloud Line', -10, -17], ['Sacred Way', -11, -16], ['Terraces', -11, -15], ['Amphitheatre', -10, -15], ['Olive Grove', -11, -14], ['Goat Track', -12, -14], ['Pilgrim Stair', -11, -13]],
  mtnP: [['Tree Line, west', -16, -14], ['Tree Line', -15, -14], ['Warming Hut', -15, -15], ['Sleigh Bend', -15, -16], ['Frozen Tarn', -15, -17], ['Rope Bridge', -15, -18], ['Pass Gate', -15, -19], ['Switchbacks', -15, -20], ['High Pass', -15, -21], ['Ridge, west', -16, -22], ['Ridge', -15, -22], ['Ridge, east', -14, -22]],
  mtnK: [['Black Run, top', -23, -21], ['Top Station', -22, -21], ['Half-Pipe', -21, -21], ['Black Run', -23, -20], ['Big Jump', -22, -20], ['Slalom', -21, -20], ['Run-Out', -23, -19], ['Chairlift', -22, -19], ['Bunny Slope', -21, -19], ['Rental Hut', -22, -18], ['Ski Lodge', -22, -17], ['Lodge Yard', -22, -16]],
  shasta: [['Shastina', 0, -21], ['Summit', 1, -21], ['Glacier', 2, -21], ['Red Banks', 0, -20], ['Helen Lake', 1, -20], ['Steam Vents', 2, -20], ['Avalanche Gulch', 0, -19], ['Fork', 1, -19], ['Scree', 2, -19], ['Bunny Flat', 0, -18], ['Panther Meadows', 1, -18], ['Old Lava', 2, -18], ['Last Trees', 0, -17], ['Spring', 1, -17], ['Switchback, upper', -1, -17], ['Lookout', -2, -17], ['Switchback, lower', -2, -16], ['Boulder Field', -3, -16], ['Trailhead', -3, -15], ['Upper Shelf', -4, -15]],
};
// the wild links: within a zone, and the cross-zone paths through the wilderness (nearest plot to nearest plot, 1 plot wide)
var LINKS = [['woods', 'woods', 'woodsT'], ['woods', 'woods', 'woodsG'], ['woods', 'woodsT', 'mtnP'], ['woods', 'camF', 'woods'], ['woods', 'woodsG', 'estH'],
  ['cam', 'camN', 'mtnK'], ['cam', 'camW', 'woodsG'],
  ['estate', 'estC', 'estate'],
  ['mtn', 'mtnK', 'mtnP'], ['mtn', 'mtnP', 'mtn'], ['mtn', 'mtn', 'shasta'],
  ['ley', 'ley', 'leyY'], ['ley', 'leyY', 'ley2'], ['ley', 'ley', 'leyB'], ['ley', 'leyB', 'leyZ'], ['ley', 'ley2', 'leyZ']];

for (const zk in SPREAD) for (const [id, nm, x0, y0, w, h, b] of SPREAD[zk]) { const [x, y] = (K === 1 && OVR1[id]) || FR(x0, y0, w, h); SURF.push({ id, x, y, w, h, b }); ZONEOF[id] = zk; DNAME[id] = nm; } }
for (const z of SURF) if (K === 1 && SHAPES[z.id]) { const c = SHAPES[z.id]; z.was = z.w * z.h; const xs = c.map(q => q[1]), ys = c.map(q => q[2]); z.x = Math.min(...xs); z.y = Math.min(...ys); z.w = Math.max(...xs) - z.x + 1; z.h = Math.max(...ys) - z.y + 1; z.cells = new Set(c.map(q => q[1] + ',' + q[2])); z.plots = c; }
let UGMAP = null; // set while drawing the underground
function MAP(x, y) {
  if (UGMAP) for (const u of UGMAP) if (x >= u.x0 - 2 && x <= u.x1 + 2 && y >= u.y0 - 2 && y <= u.y1 + 2) return [x + u.o[0], y + u.o[1]];
  for (const k in GB) { const q = GB[k]; if (x >= q.x0 - 1.5 && x <= q.x1 + 1.5 && y >= q.y0 - 1.5 && y <= q.y1 + 1.5) return [x + OFF[k][0], y + OFF[k][1]]; }
  return T(x, y);
}
const PO = (x, y) => P(...MAP(x, y));
const ZB = id => SURF.find(z => z.id === id) || ISL.find(z => z.id === id);
function edgeStart(z, v) { const cx = z.x + z.w / 2, cy = z.y + z.h / 2, dx = v[0] - cx, dy = v[1] - cy;
  const clx = Math.max(z.x, Math.min(z.x + z.w - 2, Math.round(v[0] - 1))), cly = Math.max(z.y, Math.min(z.y + z.h - 2, Math.round(v[1] - 1)));
  if (Math.abs(dx) / z.w > Math.abs(dy) / z.h) return { p: dx < 0 ? [z.x - 2, cly] : [z.x + z.w, cly], v: false };
  return { p: dy < 0 ? [clx, z.y - 2] : [clx, z.y + z.h], v: true }; }
function routePts(A, B, vias) {
  const V = vias.map(p => T(...p).map(Math.round)).map(([x, y]) => [x - 1, y - 1]);
  const za = ZB(A), zb = B && ZB(B);
  const s = edgeStart(za, V[0] ? [V[0][0] + 1, V[0][1] + 1] : [zb.x + zb.w / 2, zb.y + zb.h / 2]);
  const e = zb && edgeStart(zb, V.length ? [V[V.length - 1][0] + 1, V[V.length - 1][1] + 1] : [za.x + za.w / 2, za.y + za.h / 2]);
  const pts = [s.p, ...V]; if (e) pts.push(e.p);
  const out = [pts[0]];
  for (let i = 1; i < pts.length; i++) { const p = out[out.length - 1], q = pts[i];
    if (p[0] !== q[0] && p[1] !== q[1]) { const vertFirst = (i === 1 && s.v) || (i === pts.length - 1 && e && !e.v); out.push(vertFirst ? [p[0], q[1]] : [q[0], p[1]]); }
    out.push(q); }
  return out; }

// ROUTES: bands 2 plots wide on the plot grid. Each point = the band's top-left plot; consecutive points share x or y,
// a leg covers the rectangle between them, 2 plots thick. [id, name, legs, landmark text]
// ROUTES (v10): each joins two rooms through open country; vias are old-map points, grown with the world; the router lays a 2-plot band on the grid
const ROUTE_SPEC = [
  ['R1', 'River Road', 'vat', 'city', [[-3, -3]], 'the bridge over the Tiber into Civic Center'],
  ['R2', 'Canyon Trail', 'hills', 'shasta', [[0, -8]], 'up behind the Hollywood sign to Shasta’s foot; a ranger station'],
  ['R3', 'Pilgrim Way', 'col', 'mtn', [[-9, -12]], 'shrines on the climb from the Colosseum to Olympus'],
  ['R4', 'Old Road', 'cam', 'vat', [[-17, -1], [-14, -4]], 'a crossroads inn and standing stones between Came A Lot and the Vatican'],
  ['R4b', '', 'woods', null, [[-17, -1]], ''],
  ['R5', 'Polar Trail', 'mtnP', 'np', [[-12.5, -22], [-6, -26]], 'a frozen lake and a mountain hut on the way up to the Pole'],
  ['R6', 'Valley Road', 'woods', 'city', [[-5, 5]], 'a covered bridge over the Tiber; the city’s skyline ahead'],
  ['R7', 'County Lane', 'woods', 'estate', [[-12, 11]], 'farm fields and a scarecrow row down to the Lake'],
  ['R8', 'Ranch Road', 'estate', 'wt', [[-6, 21]], 'cattle ranges and a crop circle, into Western Town'],
  ['R9', 'Badlands Highway', 'city', 'circus', [[7, 16]], 'the chain gas station, a motel, billboards (Exit 1), to the Circus'],
  ['R10', 'Coast Road', 'beach', 'giza', [[15.5, 15], [16.5, 22]], 'cliff tunnel, surf coves, a lookout over the sea'],
  ['R12', 'Stone Path', 'stone', 'cam', [], 'from Came A Lot’s north woods up onto the plain to the stones'],
  ['R11', 'Delta Causeway', 'giza', 'ley', [[20, 32]], 'reed flats; the ley line runs across it'],
];
// THE DESERT'S HIGHWAY: its districts' own Highway plots (district R, 87 today) as the loop between them; the grown world needs more
const DESERT_SPEC = [
  ['Circus–Western Town', 'circus', 'wt', [[1, 23]]],
  ['Western Town–Area 51', 'wt', 'a51', [[-1, 33]]],
  ['Area 51–Giza', 'a51', 'giza', [[10, 34]]],
  ['Giza–Circus', 'giza', 'circus', [[12.5, 25]]],
];
const DIST = [
  ['Snowy Pass', -12.5, -16.9], ['Ski Lodge', -9.5, -15.1], ['Olympus', -6.5, -16.9], ['Shasta', -3.5, -15.1],
  ['Civic Center', 1.8, 1.4], ['Bayside', 10.4, 6.5], ['Southside', 2, 10.6], ['Hero Plaza', 6, 6.4],
  ['Fairy Forest', -21, 0], ['the Castle', -24, 0.5], ['Snowy Pines', -24, -3.4], ['the Village', -24, 2.6],
  ['Corn', -13.5, 16.4], ['Haunted House', -13.5, 19.6], ['Ranch', -10.4, 17.6],
  ['Circus', 7.5, 23.4], ['Western Town', -2, 29.4], ['the Highway', 6.6, 26.6], ['Area 51', 4, 36.4], ['Giza', 15, 29.6],
  ['the Shore', 13, 4], ['the Harbour', 15.6, 6.6], ['the islet', 18.4, 3.6],
  ['Göbekli Tepe', 24.5, 30.7], ['Bug Colony', 27.6, 32.4], ['Babel', 25, 35.4], ['Technoticlan', 29.6, 35.4],
];
const CITIES = [['Disaster City', 6, 3, 'mega'], ['Vatican City', -9, -4.4, 'holy'], ['Came A Lot', -24, -1.4, 'castle'], ['Western Town', -2, 27.6, 'town'],
  ['North Pole', 2, -26.4, 'town'], ['Babel', 25, 34.4, 'tower'], ['Technoticlan', 29.6, 34.4, 'town']];
const LAND = [[-32, -14], [-22, -23], [-15, -27.4], [-6, -27.6], [-2, -29], [0, -27.8], [1.6, -29.8], [3.4, -28.4], [5.4, -29.2], [6.2, -27], [7, -25], [8.4, -23.6], [9.6, -21], [8.6, -17], [8, -14], [11, -12.6], [14, -9], [14.8, -6.6], [16.2, -5.4], [15, -4], [15.8, -1.6], [14.6, 1], [15.4, 3.2], [14.4, 6], [14.6, 12], [16.4, 13.4], [18, 15], [17.2, 18.6], [18.6, 22], [20, 27], [23, 27.2], [26, 28.4], [33, 28.4], [35.6, 32], [34.6, 38.6], [31, 40.4], [28, 40], [25, 38.6], [23, 40.6], [21, 38.4], [17, 39.8], [14, 38.6], [11, 41], [8, 40.6], [5, 42], [2, 40.4], [-2, 39], [-5, 36.4], [-8, 35.2], [-10, 32], [-14, 30], [-16, 26], [-20, 23.6], [-22, 20], [-26, 12], [-28.6, 10.6], [-30, 7], [-29.4, 4.4], [-33, 3], [-34.6, -1.4], [-32.6, -4.2], [-34, -7], [-33.4, -10.4]];
// ── the plot grid: band cells, the land mask ──
const ROUTES = ROUTE_SPEC.map(([id, nm, A, B, vias, txt]) => [id, nm, routePts(A, B, vias), txt]);
const DESERT_HW = DESERT_SPEC.map(([nm, A, B, vias]) => [nm, routePts(A, B, vias)]);
function bandCells(pts, w = 2) {
  const c = new Set();
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1], [bx, by] = pts[i];
    for (let x = Math.min(ax, bx); x < Math.max(ax, bx) + w; x++) for (let y = Math.min(ay, by); y < Math.max(ay, by) + w; y++) c.add(x + ',' + y);
  }
  return c;
}
function inPoly(x, y, poly) { let ins = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) ins = !ins; } return ins; }
const ZCELLS = new Set();
for (const z of SURF) if (z.id !== 'beach' && z.id !== 'ant') { if (z.cells) { for (const k of z.cells) ZCELLS.add(k); continue; } for (let x = z.x; x < z.x + z.w; x++) for (let y = z.y; y < z.y + z.h; y++) ZCELLS.add(x + ',' + y); }
const RCELLS = {}; for (const [id, , pts] of ROUTES) { RCELLS[id] = new Set([...bandCells(pts)].filter(k => !ZCELLS.has(k))); }
RCELLS.R4.forEach(k => RCELLS.R4b.delete(k));
const TCELLS = {}; const TRAILPTS = []; // the wild links (v13): nearest plot to nearest plot
const LINKPLOTS = []; // --plots: one row a wild link
const cellsOf = id => { const z = ZB(id); if (z.cells) return [...z.cells].map(k => k.split(',').map(Number)); const o = []; for (let x = z.x; x < z.x + z.w; x++) for (let y = z.y; y < z.y + z.h; y++) o.push([x, y]); return o; };
{ const all = new Set(); for (const id in RCELLS) for (const k of RCELLS[id]) all.add(k);
  for (const [zk, a, b] of LINKS) { const c = TCELLS[zk] = TCELLS[zk] || new Set(); let best = null;
    for (const p of cellsOf(a)) for (const q of cellsOf(b)) { const d = Math.abs(p[0] - q[0]) + Math.abs(p[1] - q[1]); if (!best || d < best[0]) best = [d, p, q]; }
    const [, [ax, ay], [bx, by]] = best; const pts = Math.abs(bx - ax) > Math.abs(by - ay) ? [[ax, ay], [bx, ay], [bx, by]] : [[ax, ay], [ax, by], [bx, by]];
    const own = []; // --plots: this link's own plots (the ones no district, route or earlier link of its zone already holds)
    TRAILPTS.push(pts); for (const k of bandCells(pts, 1)) if (!ZCELLS.has(k) && !all.has(k)) { if (!c.has(k)) own.push(k); c.add(k); }
    LINKPLOTS.push({ zone: zk, a, b, pts, own, band: [...bandCells(pts, 1)] }); } }
const HCELLS = new Set(); for (const [, pts] of DESERT_HW) for (const k of bandCells(pts)) if (!ZCELLS.has(k)) HCELLS.add(k);
const LANDC = new Set();
for (let x = CEN[0] - RAD; x <= CEN[0] + RAD; x++) for (let y = CEN[1] - RAD; y <= CEN[1] + RAD; y++) if (inPoly(...TI(x + .5, y + .5), LAND)) LANDC.add(x + ',' + y);
for (const k of ZCELLS) LANDC.add(k); for (const id in RCELLS) for (const k of RCELLS[id]) LANDC.add(k); for (const k of HCELLS) LANDC.add(k); for (const zk in TCELLS) for (const k of TCELLS[zk]) LANDC.add(k);
for (let x = 12; x < 14; x++) for (let y = 3; y < 11; y++) LANDC.add(x + ',' + y);
function cellsOutline(set) { let d = ''; for (const k of set) { const [x, y] = k.split(',').map(Number); const [a, b] = P(x, y);
    if (!set.has(x + ',' + (y - 1))) d += 'M' + a + ',' + b + 'h' + S; if (!set.has(x + ',' + (y + 1))) d += 'M' + a + ',' + (b + S) + 'h' + S;
    if (!set.has((x - 1) + ',' + y)) d += 'M' + a + ',' + b + 'v' + S; if (!set.has((x + 1) + ',' + y)) d += 'M' + (a + S) + ',' + b + 'v' + S; } return d; }
function cellsPath(set) { // one path of row runs
  const rows = {}; for (const k of set) { const [x, y] = k.split(',').map(Number); (rows[y] = rows[y] || []).push(x); }
  let d = '';
  for (const y in rows) { const xs = rows[y].sort((a, b) => a - b); let s0 = xs[0], p = xs[0];
    for (let i = 1; i <= xs.length; i++) { if (i < xs.length && xs[i] === p + 1) { p = xs[i]; continue; } const [a, b] = P(s0, +y); d += `M${a},${b}h${(p - s0 + 1) * S}v${S}h${-(p - s0 + 1) * S}z`; if (i < xs.length) s0 = p = xs[i]; } }
  return d;
}
const COUNTS = {}; let routeTotal = 0; for (const id in RCELLS) { COUNTS[id] = RCELLS[id].size; routeTotal += RCELLS[id].size; }
COUNTS.R4 += COUNTS.R4b; delete COUNTS.R4b;
console.log('routes', JSON.stringify(COUNTS), 'total', routeTotal, '| desert highway plots', HCELLS.size);
console.log('zone trails', JSON.stringify(Object.fromEntries(Object.entries(TCELLS).map(([k, v]) => [k, v.size]))));
// the grid's outside: the 144-square lines run faint to the sheet's edge, numbered along the top and down the right (battle squares from the centre)
function gridFrame(txt = '#9fb6c4') {
  const [cx, cy] = P(...CEN); let s = '';
  for (let k = -84; k <= 84; k += 12) {
    const t = (k > 0 ? '+' : k < 0 ? '−' : '') + Math.abs(k * 12);
    s += `<line x1="${cx + k * S}" y1="64" x2="${cx + k * S}" y2="${H}" stroke="rgba(255,255,255,.13)" stroke-dasharray="2 4"/><text x="${cx + k * S}" y="58" text-anchor="middle" font-size="9" class="dl" fill="${txt}">${t}</text>`;
    if (cy + k * S < H - 6) s += `<line x1="0" y1="${cy + k * S}" x2="${W - 62}" y2="${cy + k * S}" stroke="rgba(255,255,255,.13)" stroke-dasharray="2 4"/><text x="${W - 58}" y="${cy + k * S + 3}" font-size="9" class="dl" fill="${txt}">${t}</text>`;
  }
  s += `<text x="${cx}" y="40" text-anchor="middle" font-size="8.5" class="dl" fill="${txt}">BATTLE SQUARES FROM THE CENTRE · THICK LINE = 144 SQUARES (12 PLOTS) · THIN LINE = 1 PLOT (12 SQUARES)</text>`;
  return s;
}
// the grid drawn over a sheet: a thin line every plot, a thick line every 12 plots (144 squares), numbered in battle squares from the centre
function gridOverlay(minor = 'rgba(255,255,255,.07)', major = 'rgba(255,255,255,.32)', txt = '#9fb6c4') {
  const [cx, cy] = P(...CEN), R = RAD * S; let s = `<clipPath id="disc${minor.length}"><circle cx="${cx}" cy="${cy}" r="${R}"/></clipPath><g clip-path="url(#disc${minor.length})">`;
  for (let k = -RAD; k <= RAD; k++) {
    const isM = k % 12 === 0, col = isM ? major : minor, sw = isM ? 1.1 : .5;
    s += `<line x1="${cx + k * S}" y1="${cy - R}" x2="${cx + k * S}" y2="${cy + R}" stroke="${col}" stroke-width="${sw}"/><line x1="${cx - R}" y1="${cy + k * S}" x2="${cx + R}" y2="${cy + k * S}" stroke="${col}" stroke-width="${sw}"/>`;
  }
  s += `</g>`;
  return s;
}
const ZNAME = { np: 'NORTH POLE', mtn: 'THE MOUNTAINS', hills: 'DISASTER HILLS', city: 'DISASTER CITY', vat: 'THE VATICAN', col: 'THE COLOSSEUM', cam: 'CAME A LOT KINGDOM', woods: 'THE WOODS', estate: 'THE ESTATE', desert: 'THE DESERT', beach: 'THE BEACH', ley: 'LEYLINES', ant: 'ANTARCTICA' };
function plen(pts) { let L = 0; for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return L; }
function rect(z, fill, stroke, extra = '') {
  if (z.cells) return `<path shape-rendering="crispEdges" d="${cellsPath(z.cells)}" fill="${fill}"/><path d="${cellsOutline(z.cells)}" fill="none" stroke="${stroke}" ${extra}/>`;
  const [x, y] = P(z.x, z.y);
  return `<rect x="${x}" y="${y}" width="${z.w * S}" height="${z.h * S}" fill="${fill}" stroke="${stroke}" ${extra}/>`;
}
function grid(z, col = 'rgba(0,0,0,.18)') {
  if (z.cells) { let s = ''; for (const k of z.cells) { const [x, y] = k.split(',').map(Number); const [a, b] = P(x, y); s += `<rect x="${a}" y="${b}" width="${S}" height="${S}" fill="none" stroke="${col}" stroke-width=".6"/>`; } return s; }
  let s = '';
  for (let i = 1; i < z.w; i++) { const [x, y] = P(z.x + i, z.y); s += `<line x1="${x}" y1="${y}" x2="${x}" y2="${y + z.h * S}" stroke="${col}" stroke-width=".6"/>`; }
  for (let j = 1; j < z.h; j++) { const [x, y] = P(z.x, z.y + j); s += `<line x1="${x}" y1="${y}" x2="${x + z.w * S}" y2="${y}" stroke="${col}" stroke-width=".6"/>`; }
  return s;
}
function smooth(pts, closed = true) { // Catmull-Rom to bezier
  const p = pts.map(([x, y]) => PO(x, y)); const n = p.length; let d = `M${r1(p[0][0])},${r1(p[0][1])}`;
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = p[(i - 1 + n) % n], p1 = p[i], p2 = p[(i + 1) % n], p3 = p[(i + 2) % n];
    const a = closed || i > 0 ? p0 : p1, b = closed || i + 2 < n ? p3 : p2;
    d += ` C${r1(p1[0] + (p2[0] - a[0]) / 6)},${r1(p1[1] + (p2[1] - a[1]) / 6)} ${r1(p2[0] - (b[0] - p1[0]) / 6)},${r1(p2[1] - (b[1] - p1[1]) / 6)} ${r1(p2[0])},${r1(p2[1])}`;
  }
  return d + (closed ? 'Z' : '');
}
function label(txt, x, y, o = {}) {
  const [px, py] = o.raw ? P(x, y) : PO(x, y); const fs = o.size || 9; const w = txt.length * fs * 0.66 + 10;
  const box = o.box ? `<rect x="${r1(px - w / 2)}" y="${r1(py - fs + 1)}" width="${r1(w)}" height="${fs + 6}" fill="#0b0f16" stroke="${o.stroke || '#fff'}" stroke-width="1"/>` : '';
  return `${box}<text x="${r1(px)}" y="${r1(py + 3)}" text-anchor="middle" font-size="${fs}" fill="${o.fill || '#fff'}" class="${o.cls || 'lbl'}">${txt}</text>`;
}
function glyph(kind, x, y) {
  const [px, py] = PO(x, y);
  const g = { mega: `<path d="M${px - 7},${py + 5}v-8h3v-5h3v9h2v-12h3v16z" fill="#ffd36a" stroke="#0b0f16" stroke-width="1"/>`,
    holy: `<path d="M${px},${py - 8}v14M${px - 4},${py - 4}h8" stroke="#ffd36a" stroke-width="2.4"/>`,
    castle: `<path d="M${px - 6},${py + 5}v-9h2v2h2v-2h4v2h2v-2h2v9z" fill="#ffd36a" stroke="#0b0f16" stroke-width="1"/>`,
    town: `<path d="M${px - 6},${py + 4}v-5l3,-3l3,3v5zM${px},${py + 4}v-6l3,-3l3,3v6z" fill="#ffd36a" stroke="#0b0f16" stroke-width="1"/>`,
    tower: `<path d="M${px - 5},${py + 5}l2,-12h6l2,12z" fill="#ffd36a" stroke="#0b0f16" stroke-width="1"/>` }[kind];
  return g;
}
function mountains(x0, x1, y0, y1, n, col = '#f4f7fa') {
  let s = ''; let seed = 7; const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  for (let i = 0; i < n; i++) {
    const x = x0 + rnd() * (x1 - x0), y = y0 + rnd() * (y1 - y0), h = 0.7 + rnd() * 0.9;
    const [a, b] = PO(x, y);
    s += `<path d="M${r1(a - h * S * .7)},${r1(b)} L${r1(a)},${r1(b - h * S)} L${r1(a + h * S * .7)},${r1(b)}" fill="#8f877f" stroke="#3a332d" stroke-width=".8"/><path d="M${r1(a - h * S * .25)},${r1(b - h * S * .64)} L${r1(a)},${r1(b - h * S)} L${r1(a + h * S * .25)},${r1(b - h * S * .64)}Z" fill="${col}"/>`;
  }
  return s;
}
function trees(x0, x1, y0, y1, n, col = '#1f4426', seed0 = 3) {
  let s = ''; let seed = seed0; const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  for (let i = 0; i < n; i++) { const [a, b] = PO(x0 + rnd() * (x1 - x0), y0 + rnd() * (y1 - y0)); s += `<path d="M${r1(a - 3)},${r1(b + 3)}L${r1(a)},${r1(b - 4)}L${r1(a + 3)},${r1(b + 3)}Z" fill="${col}"/>`; }
  return s;
}


// ── 1. THE SURFACE (v9): one terrain model on the plot grid, drawn three ways ──
function blob(pts, fill, op = 1) { return `<path d="${smooth(pts)}" fill="${fill}" opacity="${op}"/>`; }
const hsh = (x, y, k = 0) => { let n = (x * 374761393 + y * 668265263 + k * 2147483647) | 0; n = (n ^ (n >>> 13)) * 1274126177 | 0; return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
function vnoise(x, y, k) { const x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0, s = t => t * t * (3 - 2 * t);
  const a = hsh(x0, y0, k), b = hsh(x0 + 1, y0, k), c = hsh(x0, y0 + 1, k), d = hsh(x0 + 1, y0 + 1, k);
  return a + (b - a) * s(fx) + (c - a) * s(fy) + (a - b - c + d) * s(fx) * s(fy); }
function segDist(px, py, pts) { let best = 1e9; for (let i = 1; i < pts.length; i++) { const [ax, ay] = pts[i - 1], [bx, by] = pts[i]; const dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy; let t = L ? ((px - ax) * dx + (py - ay) * dy) / L : 0; t = Math.max(0, Math.min(1, t)); best = Math.min(best, Math.hypot(px - ax - t * dx, py - ay - t * dy)); } return best; }
// rivers (plot units): the Tiber (Shasta to the Salt Lake), the city canal (the Hills reservoir to Bayside), the Nile (to its delta),
// and a western river (the range to Camelot bay: the continent's one estuary on the west)
const RIVERS = {
  tiber: [[-4, -10], [-5, -7], [-5.4, -3.4], [-4.4, 1], [-5.6, 6], [-7.4, 10], [-9.2, 13.4], [-10.4, 16]],
  canal: [[3, -8], [4, -6], [5, -2.4], [5.4, 1.5], [7.5, 4.8], [10, 6.8], [12.6, 7.2]],
  nile: [[19.4, 27.6], [18.4, 30], [18.6, 34], [20, 38.6]],
  west: [[-19, -13], [-21, -9], [-24, -6.5], [-27.5, -5], [-30, -3.5], [-32.6, -0.6]],
};
const RIDGES = [ // [polyline, height, width]
  [[[-34, -12], [-26, -15], [-18, -17], [-10, -16.5], [-4, -15], [2, -16], [8, -17], [12, -14]], 1.0, 3.0],
  [[[0, -2.5], [6, -3.2], [13, -2.4]], 0.5, 1.4],            // the Hollywood Hills
  [[[-9, 24], [-7, 29], [-6, 33]], 0.42, 1.5],               // the desert mesas west of Western Town
  [[[24, 29], [30, 28.6]], 0.3, 1.2],                        // the Leylines plateau's lip
];
const PASSES = [[-12, -21, 1.6, .5], [-1, -11, 1.4, .42], [-8, -12, 1.2, .3], [-26, -13, 1.6, .38]]; // [x, y, width, depth]
const TOWNS = [[-9, -4], [-24, 0], [-12, 18], [6, 6], [-2, 28], [27, 35]]; // farmland grows round these
function terrainAt(x, y) { // x, y = a plot's centre
  let E = 0;
  for (const [pts, h, w] of RIDGES) { const d = segDist(x, y, pts); E = Math.max(E, h * Math.exp(-d * d / (2 * w * w))); }
  for (const [px, py, w, dep] of PASSES) E -= dep * Math.exp(-((x - px) ** 2 + (y - py) ** 2) / (2 * w * w));
  E += (vnoise(x / 3.2, y / 3.2, 1) - .5) * .18;
  const dd = Math.hypot(x - 6, y - 30);
  let M = .86 - .25 * (x + 34) / 70 - .78 * Math.exp(-dd * dd / (2 * 12.5 * 12.5)) + (vnoise(x / 4, y / 4, 2) - .5) * .16;
  let river = 1e9; for (const k in RIVERS) river = Math.min(river, segDist(x, y, RIVERS[k]));
  if (river < 1.6) M += .28;
  const salt = Math.hypot(x + 10.6, y - 16.6);
  return { E, M, river, salt };
}
// biome per land plot; transitions come out of the same two numbers, so every edge has a band between
const BIOMES = {
  peak: ['#eef3f6', 'Snow peaks'], rock: ['#9a928a', 'Bare rock'], alpine: ['#aab5a4', 'Alpine slopes'], foot: ['#8d9466', 'Foothills'],
  tundra: ['#b7c4b6', 'Tundra'], forest: ['#2f5a34', 'Forest'], wood: ['#4f7c43', 'Open woodland'], meadow: ['#7aa25a', 'River meadow'],
  grass: ['#93a95e', 'Grassland'], farm: ['#b0a656', 'Farmland'], scrub: ['#ab9c63', 'Dry scrub'], bad: ['#b78258', 'Badlands'],
  desert: ['#d8b46c', 'Desert'], dunes: ['#e6c680', 'Dunes'], marsh: ['#5f8d72', 'Wetland'], saltflat: ['#d9d4c2', 'Salt flats'],
  sand: ['#e8d49a', 'Beach'], cliff: ['#7d7468', 'Sea cliffs'],
};
const BIO = {}; const TER = {};
for (const k of LANDC) {
  const [x, y] = k.split(',').map(Number); const t = terrainAt(...TI(x + .5, y + .5)); TER[k] = t; const { E, M } = t;
  let b;
  if (E > .8) b = 'peak'; else if (E > .64) b = 'rock'; else if (E > .5) b = 'alpine'; else if (E > .36) b = 'foot';
  else if (TI(x, y)[1] < -21) b = 'tundra';
  else if (t.salt < 2.6) b = 'saltflat';
  else if (t.river < 1.1 && M > .55) b = (TI(x, y)[1] > 26 ? 'marsh' : 'meadow');
  else if (M > .74) b = 'forest'; else if (M > .62) b = 'wood';
  else if (M > .42) b = TOWNS.some(([tx, ty]) => Math.hypot(TI(x, y)[0] - tx, TI(x, y)[1] - ty) < 7.5) && hsh(x, y, 5) < .8 ? 'farm' : 'grass';
  else if (M > .3) b = 'scrub'; else if (M > .19) b = 'bad'; else if (M > .06) b = 'desert'; else b = 'dunes';
  BIO[k] = b;
}
// the coast: sand where it is dry and low, cliffs where it is high, reeds at the Nile's mouth
const isLand = (x, y) => LANDC.has(x + ',' + y);
for (const k of LANDC) { const [x, y] = k.split(',').map(Number); if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => !isLand(x + a, y + b))) {
  const t = TER[k]; if (BIO[k] === 'marsh' || BIO[k] === 'meadow') continue;
  if (t.E > .4) BIO[k] = "cliff"; else if (t.M < .62 && TI(x, y)[1] > -21) BIO[k] = "sand"; } }
// scenery islets (not plots): a reef chain in the south-west, skerries off the north-east, a pair off the south coast
const ISLETS0 = [[-27, 27], [-26, 28], [-24, 30], [-23, 30], [-21, 33], [-33, 18], [-34, 19], [16, -20], [17, -21], [19, -23], [12, 41], [13, 42], [-12, 38], [26, 41], [30, 18], [31, 19]];
const ISLETS = []; for (const [x, y] of ISLETS0) { const [a, b] = T(x, y).map(Math.round); ISLETS.push([a, b], [a + 1, b], [a, b + 1]); }
// THE ORDINARY WORLD (all my ideas, generic names): what feeds, supplies and links the famous places. Seen from the routes unless walkable.
const PLACES = [
  ['vineyards', -13, -1.4, 'farm'], ['monastery', -15, -11, 'monastery'], ['market town', -17, -2.4, 'town'], ['water mill', -6.6, 3.2, 'mill'],
  ['logging camp', -19.6, 9, 'camp'], ['homestead', -21, 13.6, 'farm'], ['abandoned village', -9.6, 11.6, 'ruin'], ['fishing village', -31.4, 5.4, 'fish'],
  ['silver mine', -7.6, -10.4, 'mine'], ['reservoir', 3, -8.6, 'dam'], ['wind farm', 1.6, 15.6, 'wind'], ['grain farms', -5, 14.4, 'farm'],
  ['well', 3.4, 30.4, 'well'], ['well', 9.6, 28.6, 'well'], ['caravan stop', 12.6, 23.4, 'camp'], ['oasis', 20.8, 27.2, 'oasis'],
  ['stone quarry', 10.6, 32.6, 'mine'], ['salt works', -8, 17.6, 'mine'], ['fishing village', -6.8, 36.4, 'fish'], ['port', 31.6, 38.6, 'port'],
  ['whaling station', 6.8, -26.6, 'fish'], ['reindeer camp', -6, -24.4, 'camp'], ['ski village', -20.75, -15.5, 'town'], ['lumber mill', -26.6, 7.6, 'mill'],
];
const PORTS = [['the Harbour', 15.4, 7], ['Came A Lot bay', -32.6, 1.4], ['Pirates’ Cove', -28.5, 32.5], ['south port', 31.6, 38.6], ['Antarctic port', 3, 45], ['Pole landing', 2, -30.6]];
const ROADCLASS = { R1: 'major', R4: 'major', R9: 'major', R6: 'regional', R7: 'regional', R8: 'regional', R10: 'regional', R11: 'regional', R2: 'trail', R3: 'trail', R5: 'trail', R12: 'trail', R4b: 'trail' };
const ROADSTYLE = { major: { w: 5, col: '#2b2622', edge: '#f3d58a', dash: '' }, regional: { w: 3.2, col: '#7a5a34', edge: '#e8c890', dash: '' }, trail: { w: 1.8, col: '#f2ead2', edge: 'none', dash: '4 3' } };
function placeGlyph(kind, x, y) {
  const [a, b] = PO(x, y); const st = 'stroke="#0b0f16" stroke-width=".8"';
  return `<g transform="translate(${a},${b}) scale(1.6) translate(${-a},${-b})">` + ({ farm: `<rect x="${a - 3}" y="${b - 2}" width="6" height="4" fill="#e9d38a" ${st}/>`,
    town: `<path d="M${a - 5},${b + 3}v-4l2.5,-2.5l2.5,2.5v4zM${a},${b + 3}v-5l2.5,-2.5l2.5,2.5v5z" fill="#f4e2b0" ${st}/>`,
    monastery: `<path d="M${a - 4},${b + 3}v-5h8v5zM${a},${b - 2}v-5M${a - 2},${b - 5}h4" fill="#e8e0cc" ${st}/>`,
    mill: `<circle cx="${a}" cy="${b}" r="3.2" fill="#c9b48a" ${st}/><path d="M${a - 4},${b}h8M${a},${b - 4}v8" ${st}/>`,
    camp: `<path d="M${a - 4},${b + 3}l4,-7l4,7z" fill="#d9c49a" ${st}/>`,
    ruin: `<path d="M${a - 4},${b + 3}v-5h2v3h2v-4h2v6z" fill="#8a8478" ${st}/>`,
    fish: `<path d="M${a - 4},${b}q4,-4 8,0q-4,4 -8,0zM${a + 4},${b}l3,-2v4z" fill="#bfe0ef" ${st}/>`,
    mine: `<path d="M${a - 4},${b + 3}a4,4 0 0 1 8,0z" fill="#3a3430" ${st}/>`,
    dam: `<rect x="${a - 5}" y="${b - 1.5}" width="10" height="3" fill="#c8c8c8" ${st}/>`,
    wind: `<path d="M${a},${b + 4}v-6M${a},${b - 2}l-4,-2M${a},${b - 2}l4,-2M${a},${b - 2}v-4" stroke="#fff" stroke-width="1.1"/>`,
    well: `<circle cx="${a}" cy="${b}" r="2.6" fill="#5fb4ee" ${st}/>`,
    oasis: `<circle cx="${a}" cy="${b}" r="3.4" fill="#5fb4ee" ${st}/><path d="M${a + 3},${b - 1}l1,-6M${a + 4},${b - 7}l-3,1M${a + 4},${b - 7}l3,1" stroke="#2f7a3a" stroke-width="1.2"/>`,
    port: `<path d="M${a},${b - 5}v9M${a - 3},${b + 2}q3,3 6,0M${a - 2.4},${b - 3}h4.8" fill="none" stroke="#fff" stroke-width="1.3"/>` }[kind] || '') + '</g>';
}
const GROUPS = {}; for (const k in BIO) (GROUPS[BIO[k]] = GROUPS[BIO[k]] || new Set()).add(k);
function seaBase(defsExtra = '') {
  const [cx, cy] = P(...CEN), R = RAD;
  let s = `<defs>
    <radialGradient id="sea" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#1f5a84"/><stop offset=".8" stop-color="#123a5c"/><stop offset="1" stop-color="#0b2740"/></radialGradient>
    <pattern id="hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="5" height="5" fill="rgba(60,52,30,.85)"/><line x1="0" y1="0" x2="0" y2="5" stroke="#ffd36a" stroke-width="1.8"/></pattern>
    <pattern id="fields" width="10" height="10" patternUnits="userSpaceOnUse"><rect width="10" height="10" fill="#b0a656"/><path d="M0,5h10M5,0v5" stroke="#8e8740" stroke-width=".7"/></pattern>
    <filter id="glow"><feGaussianBlur stdDeviation="2.4"/></filter>${defsExtra}
  </defs>`;
  s += `<rect width="${W}" height="${H}" fill="#06080c"/>`;
  return s;
}
function discRing() { const [cx, cy] = P(...CEN), R = RAD; let s = `<circle cx="${cx}" cy="${cy}" r="${(R + 1.4) * S}" fill="#cfeaf5" stroke="#fff" stroke-width="2"/>`;
  for (let a = 0; a < 360; a += 2.5) { const t = a * Math.PI / 180; s += `<line x1="${r1(cx + Math.cos(t) * R * S)}" y1="${r1(cy + Math.sin(t) * R * S)}" x2="${r1(cx + Math.cos(t) * (R + 1.4) * S)}" y2="${r1(cy + Math.sin(t) * (R + 1.4) * S)}" stroke="#8fbdd4" stroke-width="1"/>`; }
  return s + `<circle cx="${cx}" cy="${cy}" r="${R * S}" fill="url(#sea)" stroke="#e8f6ff" stroke-width="1.5"/>`; }
function shallows() { // sea plots next to land, one shade lighter; and the islets
  const sh = new Set(); const isl = new Set(ISLETS.map(([x, y]) => x + ',' + y));
  for (let x = CEN[0] - RAD; x <= CEN[0] + RAD; x++) for (let y = CEN[1] - RAD; y <= CEN[1] + RAD; y++) { const k = x + ',' + y; if (LANDC.has(k) || isl.has(k)) continue;
    if ([[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]].some(([a, b]) => LANDC.has((x + a) + ',' + (y + b)) || isl.has((x + a) + ',' + (y + b))) && Math.hypot(x + .5 - CEN[0], y + .5 - CEN[1]) < RAD - .6) sh.add(k); }
  return `<path shape-rendering="crispEdges" d="${cellsPath(sh)}" fill="#2f7aa6" opacity=".55"/><path shape-rendering="crispEdges" d="${cellsPath(isl)}" fill="#e3cf94"/><path d="${cellsOutline(isl)}" fill="none" stroke="#f4ecd0" stroke-width=".6"/>`;
}
function terrainCells(mute = 0) {
  let s = '';
  for (const b in GROUPS) s += `<path shape-rendering="crispEdges" d="${cellsPath(GROUPS[b])}" fill="${b === 'farm' ? 'url(#fields)' : BIOMES[b][0]}"/>`;
  s += `<path d="${cellsOutline(LANDC)}" fill="none" stroke="#efe6c8" stroke-width=".9"/>`;
  // relief + vegetation drawn on the plots that carry it: denser forest, thinner woodland, peaks on the range
  for (const k in BIO) { const [x, y] = k.split(',').map(Number); const b = BIO[k], r = hsh(x, y, 9), [a, c] = P(x + .5, y + .7);
    if ((b === 'peak' || b === 'rock') && r < .7) { const h = 6 + r * 6; s += `<path d="M${r1(a - h * .7)},${r1(c)}L${r1(a)},${r1(c - h)}L${r1(a + h * .7)},${r1(c)}Z" fill="#7c746c" stroke="#3a332d" stroke-width=".6"/><path d="M${r1(a - h * .26)},${r1(c - h * .63)}L${r1(a)},${r1(c - h)}L${r1(a + h * .26)},${r1(c - h * .63)}Z" fill="#fbfdff"/>`; }
    else if (b === 'alpine' && r < .4) s += `<path d="M${a - 4},${c}L${a},${c - 5}L${a + 4},${c}Z" fill="#8f978a" stroke="#4e554a" stroke-width=".5"/>`;
    else if (b === 'foot' && r < .35) s += `<path d="M${a - 5},${c}q5,-6 10,0" fill="none" stroke="#5f6646" stroke-width="1.1"/>`;
    else if (b === 'forest' && r < .85) s += `<path d="M${a - 3},${c}L${a},${c - 7}L${a + 3},${c}Z" fill="#1c3e22"/>` + (r < .4 ? `<path d="M${a - 6},${c - 2}L${a - 3.4},${c - 8}L${a - .8},${c - 2}Z" fill="#244a2a"/>` : '');
    else if (b === 'wood' && r < .45) s += `<circle cx="${a}" cy="${c - 3}" r="2.6" fill="#2f5a30"/>`;
    else if (b === 'scrub' && r < .3) s += `<circle cx="${a}" cy="${c - 2}" r="1.3" fill="#6f6a3a"/>`;
    else if (b === 'dunes' && r < .55) s += `<path d="M${a - 5},${c - 2}q2.5,-3 5,0q2.5,-3 5,0" fill="none" stroke="#c9a45c" stroke-width=".9"/>`;
    else if (b === 'bad' && r < .3) s += `<path d="M${a - 4},${c}v-4h8v4" fill="#9a6a44"/>`;
    else if (b === 'tundra' && r < .25) s += `<path d="M${a - 3},${c}h6" stroke="#eef4f6" stroke-width="1.2"/>`;
    else if (b === 'marsh' && r < .6) s += `<path d="M${a - 2},${c}v-4M${a},${c}v-5M${a + 2},${c}v-4" stroke="#2c5a3e" stroke-width=".8"/>`; }
  if (mute) s += `<path shape-rendering="crispEdges" d="${cellsPath(LANDC)}" fill="#0b0f16" opacity="${mute}"/>`;
  return s;
}
function riversAndLakes(w = 1) { let s = '';
  const riv = (pts, k) => `<path d="${smooth(pts, false)}" fill="none" stroke="#5fb4ee" stroke-width="${k * w}" stroke-linecap="round"/>`;
  s += riv(RIVERS.tiber, 3.4) + riv(RIVERS.canal, 2.6) + riv(RIVERS.nile, 3.6) + riv(RIVERS.west, 2.8);
  { const [a, b] = PO(-10.6, 16.6); s += `<ellipse cx="${a}" cy="${b}" rx="${1.7 * S}" ry="${1.3 * S}" fill="#5fb4ee" stroke="#d8f0ff"/>`; }
  { const [a, b] = PO(3, -8.2); s += `<ellipse cx="${a}" cy="${b}" rx="${1.1 * S}" ry="${.7 * S}" fill="#5fb4ee" stroke="#d8f0ff"/>`; }
  { const [a, b] = PO(-12, -21.6); s += `<ellipse cx="${a}" cy="${b}" rx="${1.2 * S}" ry="${.8 * S}" fill="#cfeefa" stroke="#fff"/>`; } // the frozen lake on the Polar Trail
  return s; }
function seaDecor() { let s = '';
  s += blob([[-12, -28.6], [-2, -31.4], [8, -31], [14, -27], [10, -24.6], [6, -27.6], [-2, -28], [-10, -25.4]], '#b9d6e4', .55);
  const isl = z => { const [a, b] = P(z.x + z.w / 2, z.y + z.h / 2); return (z.dash ? '' : `<ellipse cx="${a}" cy="${b}" rx="${(z.w / 2 + 1) * S}" ry="${(z.h / 2 + 1) * S}" fill="#2f6f8f" opacity=".55"/>`) + rect(z, z.fill, z.dash ? '#9fe0ff' : '#fff', z.dash ? 'stroke-width="1.4" stroke-dasharray="5 3"' : 'stroke-width="1.4"') + grid(z, 'rgba(0,0,0,.2)'); };
  for (const z of ISL) s += isl(z);
  { const [a, b] = PO(25, -16.4); s += `<path d="M${a - 14},${b + 8}L${a - 4},${b - 9}h8L${a + 14},${b + 8}Z" fill="#5a4a44" stroke="#1b1412"/><path d="M${a - 4},${b - 9}h8l-2,4h-4z" fill="#ff6a2a"/>`; }
  s += trees(22.2, 27.8, -13.8, -13.2, 10, '#7fd07a', 31) + trees(22.2, 23.4, -18.6, -14, 6, '#7fd07a', 33);
  { const [a, b] = PO(37, 3); s += `<path d="M${a},${b - 25}L${a + 22},${b + 15}L${a - 22},${b + 15}Z" fill="none" stroke="#ff9a6a" stroke-width="1.2" stroke-dasharray="4 3"/><circle cx="${a}" cy="${b}" r="26" fill="none" stroke="#9fe0ff" stroke-dasharray="3 4"/>`; }
  s += trees(-38.8, -35.2, 0.2, 3.8, 10, '#c0e0a0', 21);
  { const [a, b] = PO(-37, 2); s += `<ellipse cx="${a}" cy="${b}" rx="34" ry="28" fill="rgba(235,240,255,.22)"/>`; }
  // storm belt round the Triangle, reef line, currents
  { const [a, b] = PO(37, 3); s += `<circle cx="${a}" cy="${b}" r="62" fill="none" stroke="rgba(255,154,106,.35)" stroke-width="10" stroke-dasharray="2 10"/>`; }
  const arrow = (x, y, ang) => { const [a, b] = PO(x, y); return `<g transform="translate(${a},${b}) rotate(${ang})"><path d="M-9,0h14M2,-4l5,4l-5,4" fill="none" stroke="#9fd8f5" stroke-width="1.3" opacity=".8"/></g>`; };
  for (const [x, y, g] of [[-37, -12, -70], [-38, 12, 80], [-14, 42, 10], [14, 46, 0], [36, 24, -100], [34, -12, -120], [12, -32, 180]]) s += arrow(x, y, g);
  return s; }
const LOOP = [[16, 9.5], [21, 2], [20, -10], [18, -21], [12, -27.6], [3, -31.4], [-8, -30], [-22, -25], [-30, -17], [-37, -6], [-37, 6], [-34, 16], [-28.5, 27], [-20, 34], [-10, 40], [0, 44], [9, 44], [20, 42], [30, 39.6], [37, 33], [36, 22], [27, 17], [21, 13], [16, 9.5]];
function voyage() { let s = `<path d="${smooth(LOOP)}" fill="none" stroke="#e8f6ff" stroke-width="1.8" stroke-dasharray="2 5"/>`;
  s += `<path d="${smooth([[32, 20], [34, 12], [36.4, 6.4]], false)}" fill="none" stroke="#ff9a6a" stroke-width="1.4" stroke-dasharray="2 4"/>`;
  s += `<path d="${smooth([[-34.6, -1], [-33.2, 3.6], [-34, 8]], false)}" fill="none" stroke="#e8f6ff" stroke-width="1.4" stroke-dasharray="1 3"/>`; // the inside passage off Camelot's coast
  s += `<path d="${smooth([[0, -26.6], [-14, -27], [-24, -18], [-25.4, -5]], false)}" fill="none" stroke="#ffe08a" stroke-width="1.4" stroke-dasharray="1 4"/>`;
  return s; }
const mark = (x, y, k) => { const [a, b] = PO(x, y); return { whale: `<path d="M${a - 12},${b}q12,-12 24,0q-12,6 -24,0zM${a + 12},${b}l6,-6v10z" fill="#3c5f78" stroke="#cfe"/>`,
  spout: `<path d="M${a},${b + 8}q-6,-12 2,-26q-10,10 -2,26z" fill="none" stroke="#cfeaff" stroke-width="2"/>`,
  kraken: `<path d="M${a - 12},${b + 6}q-4,-14 4,-18q-2,10 2,18M${a},${b + 6}q-2,-18 8,-20q-6,10 -4,20M${a + 10},${b + 6}q2,-10 10,-10q-6,4 -6,10" fill="none" stroke="#e0607a" stroke-width="3"/>`,
  kaiju: `<path d="M${a - 18},${b + 6}l6,-8l4,4l5,-10l5,8l4,-6l6,12z" fill="#2b3b2b" stroke="#9fe0a0"/>`,
  berg: `<path d="M${a - 10},${b + 5}l4,-10l5,3l4,-7l7,14z" fill="#f0fbff" stroke="#8fbdd4"/>`,
  light: `<path d="M${a - 3},${b + 7}l1,-14h4l1,14z" fill="#fff" stroke="#333"/><path d="M${a},${b - 8}l26,-8v16z" fill="rgba(255,240,160,.35)"/>`,
  wreck: `<path d="M${a - 12},${b + 2}h22l-4,6h-14zM${a - 2},${b + 2}v-14l8,8" fill="#5a4630" stroke="#d8c8a0"/>` }[k]; };
const MARKS = [[19, 0.4, 'whale'], [17, -12, 'spout'], [-34, 22, 'kraken'], [22, 40, 'kaiju'], [-10, 41.6, 'berg'], [-8, -31, 'berg'], [9, -29.6, 'berg'], [-6, 43, 'berg'], [34.4, 28.6, 'light'], [38.4, 1.4, 'wreck'], [35.4, 4.6, 'wreck'], [-36.4, -10, 'whale'], [-28.6, 32.8, 'wreck']];
function roadLines(scale = 1) { let s = '';
  const centre = pts => pts.map(([x, y]) => [x + 1, y + 1]);
  const line = (pts, st) => { const d = 'M' + centre(pts).map(p => P(...p).join(',')).join('L');
    return (st.edge !== 'none' ? `<path d="${d}" fill="none" stroke="${st.edge}" stroke-width="${(st.w + 2) * scale}" stroke-linejoin="round" stroke-linecap="round"/>` : '') + `<path d="${d}" fill="none" stroke="${st.col}" stroke-width="${st.w * scale}" stroke-linejoin="round" stroke-linecap="round" ${st.dash ? `stroke-dasharray="${st.dash}"` : ''}/>`; };
  for (const cls of ['trail', 'regional', 'major']) { for (const [id, , pts] of ROUTES) if (ROADCLASS[id] === cls) s += line(pts, ROADSTYLE[cls]);
    if (cls === 'major') for (const [, pts] of DESERT_HW) s += line(pts, ROADSTYLE.major); }
  return s; }
function zoneTrails() { let s = ''; for (const pts of TRAILPTS) { const d = 'M' + pts.map(([x, y]) => P(x + .5, y + .5).join(',')).join('L'); s += `<path d="${d}" fill="none" stroke="#f6e7b0" stroke-width="1.3" stroke-dasharray="1.5 2.5"/>`; } return s; }
function compass() { return `<g transform="translate(${W - 50},${H - 60})"><circle r="24" fill="#0b0f16" stroke="#fff"/><path d="M0,-18L5,0L0,18L-5,0Z" fill="#fff"/><text y="-28" text-anchor="middle" font-size="10" class="lbl" fill="#fff">N</text></g>`; }
function scaleBar() { return `<g transform="translate(30,${H - 30})"><rect width="${10 * S}" height="5" fill="#fff"/><text y="-6" font-size="9" fill="#fff" class="dl">10 PLOTS · 120 SQUARES · 420 M</text></g>`; }
const BIG = [['THE MOUNTAINS', -11, -13.2], ['NORTH POLE', 2, -23.2], ['DISASTER HILLS', 6.5, -1.5], ['DISASTER CITY', 6, 4.8], ['THE VATICAN', -9, -2.6], ['THE COLOSSEUM', -9.5, -10.6], ['CAME A LOT KINGDOM', -24, 4.9], ['THE WOODS', -11, 8.9], ['THE ESTATE', -12, 21.9], ['THE DESERT', 7.5, 29.6], ['THE BEACH', 16, 1.2], ['LEYLINES', 27.5, 37.9], ['ANTARCTICA', 3, 52.9], ['STONEHENGE', -27.4, -10.1]];
{ const gone = new Set(['Snowy Pass', 'Ski Lodge', 'Olympus', 'Shasta', 'Fairy Forest', 'the Castle', 'Snowy Pines', 'the Village', 'Corn', 'Haunted House', 'Ranch', 'Göbekli Tepe', 'Bug Colony', 'Babel', 'Technoticlan']);
  for (let i = DIST.length - 1; i >= 0; i--) if (gone.has(DIST[i][0])) DIST.splice(i, 1);
  for (const id in DNAME) { const z = ZB(id); if (z.plots) { const m = z.plots[Math.floor(z.plots.length / 2)]; DIST.push([DNAME[id], m[1] + .5, m[2] + 1.6, true]); continue; } DIST.push([DNAME[id], z.x + z.w / 2, z.y + z.h + .9, true]); }
  const goneB = new Set(['THE MOUNTAINS', 'CAME A LOT KINGDOM', 'THE WOODS', 'THE ESTATE', 'LEYLINES']);
  for (let i = BIG.length - 1; i >= 0; i--) if (goneB.has(BIG[i][0])) BIG.splice(i, 1);
  for (const [t, x, y] of [['THE MOUNTAINS', -47, -48], ['CAME A LOT KINGDOM', -66, -12], ['THE WOODS', -46, -4], ['THE ESTATE', -40, 33.5], ['LEYLINES', 38, 51]]) BIG.push([t, ...F(x, y), true]);
  for (let i = CITIES.length - 1; i >= 0; i--) if (['Babel', 'Technoticlan'].includes(CITIES[i][0])) CITIES.splice(i, 1); }
const ISLBL = [['VOLCANO ISLAND', 25, -20], ['BERMUDA TRIANGLE', 37, -1], ['PIRATES’ COVE', -28.5, 35], ['THE FROZEN SEA', 2, -31]];

// SHEET A: THE LAND (geography only: terrain, water, relief; no rooms, no roads)
function terrainSheet() {
  let s = seaBase() + discRing() + shallows() + terrainCells() + riversAndLakes();
  for (const [t, x, y] of [['THE NORTH RANGE', -16, -19.4], ['THE TUNDRA', -2, -22.6], ['THE WESTERN FOREST', -26, 9.6], ['THE HEARTLAND', -6, 9.4], ['THE TIBER VALLEY', -1.6, -4.6], ['THE BADLANDS', 5, 17], ['THE GREAT DESERT', 4, 26.4], ['THE NILE DELTA', 22, 39.2], ['THE EAST COAST', 17.8, 18], ['THE SALT LAKE', -10.6, 14.2], ['THE STONE PLAIN', -30, -8.6], ['THE MESAS', -10.6, 30], ['THE LEY PLATEAU', 28, 31.6]])
    s += label(t, x, y, { size: 11, fill: '#fff', cls: 'riv' });
  s += label('THE OCEAN', 28, -2, { size: 11, fill: '#9fd0f0', cls: 'sea' }) + label('THE WEST SEA', -38, 13, { size: 9, fill: '#9fd0f0', cls: 'sea' }) + label('THE SOUTHERN SEA', 10, 40, { size: 9, fill: '#9fd0f0', cls: 'sea' }) + label('THE ARCTIC', 10, -27, { size: 8, fill: '#9fd0f0', cls: 'sea' });
  for (const [t, x, y] of [['Tiber', -3.6, 3], ['the canal', 9, 3.4], ['Nile', 20.8, 35], ['the west river', -25.4, -8], ['reservoir', 5.4, -9.2], ['frozen lake', -12, -23.6]]) s += label(t, x, y, { size: 6.5, fill: '#cfeaff', cls: 'dl' });
  // legend
  const keys = ['peak', 'rock', 'alpine', 'foot', 'tundra', 'forest', 'wood', 'meadow', 'grass', 'farm', 'scrub', 'bad', 'desert', 'dunes', 'marsh', 'saltflat', 'sand', 'cliff'];
  s += `<g transform="translate(14,96)"><rect x="-6" y="-14" width="112" height="${keys.length * 13 + 20}" fill="#0b0f16" opacity=".85" stroke="#fff" stroke-width=".6"/><text y="-2" font-size="8" class="dl" fill="#fff">EACH PLOT IS ONE OF</text>`;
  keys.forEach((k, i) => { s += `<rect y="${6 + i * 13}" width="10" height="10" fill="${k === 'farm' ? 'url(#fields)' : BIOMES[k][0]}" stroke="#fff" stroke-width=".4"/><text x="15" y="${14 + i * 13}" font-size="8" class="dl" fill="#eee">${BIOMES[k][1]}</text>`; });
  s += `</g>`;
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="The land: terrain on the plot grid">${s + compass() + scaleBar()}</svg>`;
}
// SHEET B: TRAVEL (roads by class, settlements, ports, sea lanes; the land muted)
function travelSheet() {
  let s = seaBase() + discRing() + shallows() + terrainCells(.42) + riversAndLakes(.8) + seaDecor() + voyage();
  for (const z of SURF) { if (z.id === 'beach') continue; s += rect(z, 'rgba(255,255,255,.08)', 'rgba(255,255,255,.55)', 'stroke-width="1"'); }
  s += roadLines(1.3) + zoneTrails();
  for (const [t, x, y, k] of PLACES) s += placeGlyph(k, x, y);
  for (const [t, x, y] of PORTS) s += placeGlyph('port', x, y);
  for (const [t, x, y, k] of CITIES) s += glyph(k, x, y);
  for (const [t, x, y, raw] of BIG) s += label(t, x, y, { size: 10, box: true, raw });
  for (const [t, x, y] of ISLBL) s += label(t, x, y, { size: 7.5, box: true, stroke: '#9fe0ff' });
  for (const [t, x, y] of PLACES) s += label(t, x, y + .8, { size: 8.5, fill: '#f6efd8', cls: 'dl' });
  for (const [t, x, y, raw] of DIST) if (raw) s += label(t, x, y, { size: 7, fill: '#ffe9a8', cls: 'dl', raw });
  s += label('THE ROUND VOYAGE (sea route round the world)', -18, -29.4, { size: 7, fill: '#e8f6ff', cls: 'riv' });
  s += label('storm belt', 37, 10.4, { size: 6.5, fill: '#ffc0a0', cls: 'dl' }) + label('inside passage', -31.2, 9.6, { size: 6.5, fill: '#e8f6ff', cls: 'dl' }) + label('the reefs', -24, 28.6, { size: 6.5, fill: '#e8f6ff', cls: 'dl' }) + label('the sleigh flies', -19.6, -22.8, { size: 6.5, fill: '#ffe08a', cls: 'dl' });
  // legend
  const L = [['major', 'Highway: joins the cities'], ['regional', 'Road: towns, farms, ports'], ['trail', 'Trail: wild places, passes']];
  s += `<g transform="translate(14,96)"><rect x="-6" y="-14" width="196" height="166" fill="#0b0f16" opacity=".88" stroke="#fff" stroke-width=".6"/><text y="-2" font-size="8" class="dl" fill="#fff">HOW YOU TRAVEL</text>`;
  L.forEach(([c, t], i) => { const st = ROADSTYLE[c], y = 12 + i * 14; s += (st.edge !== 'none' ? `<path d="M0,${y}h22" stroke="${st.edge}" stroke-width="${(st.w + 2) * 1.3}"/>` : '') + `<path d="M0,${y}h22" stroke="${st.col}" stroke-width="${st.w * 1.3}" ${st.dash ? `stroke-dasharray="${st.dash}"` : ''}/><text x="28" y="${y + 3}" font-size="8" class="dl" fill="#eee">${t}</text>`; });
  s += `<path d="M0,56h22" stroke="#e8f6ff" stroke-width="1.8" stroke-dasharray="2 5"/><text x="28" y="59" font-size="8" class="dl" fill="#eee">The Round Voyage (sailed)</text>`;
  s += `<path d="M0,142h22" stroke="#f6e7b0" stroke-width="1.3" stroke-dasharray="1.5 2.5"/><text x="28" y="145" font-size="8" class="dl" fill="#eee">Zone trail: between a zone's districts</text>`;
  s += `<g transform="translate(11,72)">${placeGlyph('town', 0, 0).replace(/P\(/g, '')}</g>`;
  const g2 = (k, y, t) => { const [a, b] = PO(0, 0); return `<g transform="translate(${11 - a},${y - b})">${placeGlyph(k, 0, 0)}</g><text x="28" y="${y + 3}" font-size="8" class="dl" fill="#eee">${t}</text>`; };
  s = s.replace(`<g transform="translate(11,72)">${placeGlyph('town', 0, 0).replace(/P\(/g, '')}</g>`, '');
  s += g2('town', 72, 'Town or village') + g2('farm', 86, 'Farms') + g2('mine', 100, 'Mine, quarry, works') + g2('fish', 114, 'Fishing village') + g2('port', 128, 'Port (the voyage stops)');
  s += `</g>`;
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Travel map: roads, towns, ports">${s + compass() + scaleBar()}</svg>`;
}
// SHEET C: THE MASTER (the developer map: every room, route band, plot and grid number)
function surface() {
  let s = seaBase() + gridFrame() + discRing() + shallows() + terrainCells(.18) + riversAndLakes() + seaDecor() + voyage();
  for (const z of SURF) {
    if (z.id === 'beach') { s += rect(z, 'rgba(70,150,190,.2)', '#fff', 'stroke-width="1.4" stroke-dasharray="5 3"') + grid(z, 'rgba(255,255,255,.08)'); continue; }
    s += rect(z, BIOME[z.b], '#fff', 'stroke-width="1.4"') + grid(z);
  }
  s += rect({ x: 12, y: 3, w: 2, h: 8 }, '#e1c98a', 'none') + grid({ x: 12, y: 3, w: 2, h: 8 });
  { const [a, b] = PO(-9.5, -7.5); s += `<ellipse cx="${a}" cy="${b}" rx="12" ry="9" fill="#d9c7a0" stroke="#5a4630" stroke-width="2"/><ellipse cx="${a}" cy="${b}" rx="6" ry="4" fill="#b89a68" stroke="#5a4630"/>`; }
  for (const [x, y, k] of [[14.3, 31.6, 1], [15.6, 30.6, 1.3], [16.2, 32.1, .8]]) { const [a, b] = PO(x, y); s += `<path d="M${r1(a - k * 9)},${r1(b + k * 5)}L${r1(a)},${r1(b - k * 7)}L${r1(a + k * 9)},${r1(b + k * 5)}Z" fill="#e8c27a" stroke="#6b4e24" stroke-width="1"/>`; }
  { const d = 'M' + (() => { const c = id => { const z = ZB(id); return [z.x + z.w / 2, z.y + z.h / 2]; }; return [c('giza'), c('ley'), c('ley2'), c('leyZ'), c('leyB'), c('ley')]; })().map(p => P(...p).join(',')).join('L'); s += `<path d="${d}" fill="none" stroke="#ff6ad5" stroke-width="5" filter="url(#glow)"/><path d="${d}" fill="none" stroke="#ffd0f2" stroke-width="1.4"/>`; }
  // route bands, coloured by class (all walkable, 2 plots wide)
  const BAND = { major: '#3a332c', regional: '#7a5a34', trail: '#c9bd98' };
  for (const id in RCELLS) s += `<path shape-rendering="crispEdges" d="${cellsPath(RCELLS[id])}" fill="${BAND[ROADCLASS[id]]}" opacity=".92"/><path shape-rendering="crispEdges" d="${cellsPath(RCELLS[id])}" fill="url(#hatch)" opacity="${ROADCLASS[id] === 'major' ? .55 : .25}"/>`;
  s += `<path shape-rendering="crispEdges" d="${cellsPath(HCELLS)}" fill="${BAND.major}" opacity=".92"/><path shape-rendering="crispEdges" d="${cellsPath(HCELLS)}" fill="url(#hatch)" opacity=".55"/>`;
  for (const zk in TCELLS) s += `<path shape-rendering="crispEdges" d="${cellsPath(TCELLS[zk])}" fill="#d9cfa6" opacity=".85"/>`;
  for (const [t, x, y, k] of PLACES) s += placeGlyph(k, x, y);
  for (const [t, x, y] of PORTS) s += placeGlyph('port', x, y);
  for (const [x, y, k] of MARKS) s += mark(x, y, k);
  { const [a, b] = P(...F(-35, -42.5)); s += `<ellipse cx="${a}" cy="${b}" rx="${5 * S}" ry="${1.4 * S}" fill="rgba(255,255,255,.14)" stroke="#fff" stroke-dasharray="3 3"/>`; }
  s += label('HEAVEN, ABOVE', ...F(-35, -42.6), { size: 7.5, raw: true });
  s += gridOverlay();
  for (const [t, x, y, raw] of DIST) s += label(t, x, y, { size: 6.5, fill: '#f2f2f2', cls: 'dl', raw });
  for (const [t, x, y, k] of CITIES) s += glyph(k, x, y);
  for (const [t, x, y, raw] of BIG) s += label(t, x, y, { size: 8.5, box: true, raw });
  for (const [t, x, y] of ISLBL) s += label(t, x, y, { size: 7.5, box: true, stroke: '#9fe0ff' });
  for (const [id, nm, pts] of ROUTES) { if (!nm) continue; const m = pts[Math.floor(pts.length / 2)]; s += label(`${id} ${nm}`, m[0] + 1, m[1] - .6, { size: 7, cls: 'buf', raw: true }); }
  { const m = DESERT_HW[1][1][1]; s += label('DESERT HIGHWAY', m[0] - 4, m[1] + 1, { size: 7, cls: 'buf', raw: true }); }
  s += label('THE ICE WALL', CEN[0] - 24, CEN[1] - RAD + 1.6, { size: 12, fill: '#123044', cls: 'wall', raw: true });
  s += label('THE COLLAR', 3, 45, { size: 7, box: true, stroke: '#ffd36a' });
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Master map: every room, route and plot on the grid">${s + compass() + scaleBar()}</svg>`;
}

const UGSTATS = {};
// ── 2. THE UNDERGROUND (v11): every underground zone's districts spread under the land they belong to ──
// [zone, id, district name, x, y, w, h, plots (true count), colour]; absolute plot coords, the same grid as the surface
const UGD = [
  ['sew', 'sewW', 'The Sewers', 3, 4, 6, 3, 18, '#5d6b4a'], ['sew', 'sewT', 'The Running Tunnels', 9, 6, 1, 6, 6, '#6d7b5a'], ['sew', 'sewH', 'The Holding Cells', 1, 1, 2, 1, 2, '#5d6b4a', -2.6],
  ['sew', 'sewO', 'The Old Workings', 1, 10, 2, 1, 2, '#5d6b4a'], ['sew', 'sewR', 'The Radioactive Drain', 10, 1, 2, 1, 2, '#7a9a3a', -2.6],
  ['cat', 'cat', 'The Catacombs', -34, -17, 3, 2, 6, '#8a7f6a'],
  ['hell', 'hell', 'the Rim, Descent, Bowl, Walkways', -33, -25, 4, 4, 16, '#8a2a1e', -6.4],
  ['cav', 'cavK', 'The Cavern', -35, 15, 4, 3, 13, '#5b4a6e'], ['cav', 'cavH', 'Hollow Earth', -17, 14, 4, 3, 11, '#a0603a'], ['cav', 'cavA', 'Agartha', -50, -29, 4, 3, 12, '#3a8a7a', -5.2],
  ['dumb', 'dP', 'Level P3', 5, 14, 2, 4, 7, '#56606e'], ['dumb', 'dC', 'Command', -7, 64, 3, 3, 7, '#56606e'], ['dumb', 'dR', 'Research', -44, 41, 3, 3, 7, '#56606e'],
  ['dumb', 'dS', 'Sub-Level 7', -11, -44, 3, 2, 6, '#3e4652'], ['dumb', 'dK', 'CERN, the Ring', -58, -27, 6, 7, 22, 'ring'],
  ['deep', 'deepA', 'Atlantis (Citadel + Rings)', 57, -3, 5, 4, 21, '#1c5f6e'], ['deep', 'deepS', 'The Sea Floor', 23, 4, 3, 3, 9, '#24707e'], ['deep', 'deepT', 'The Trench', 68, 20, 2, 5, 10, '#0e3a48'],
];
// pull the v11 (grown-frame) underground places back to this size; the Sewers + Level P3 are city-local and stay
const UOVR1 = { cavH: [-6, 10], dK: [-30, -10], dR: [-11, 19] }; // dR: Research right under the Barn // at K = 1: Hollow Earth beside the Sewers, the Ring under Stonehenge
for (const u of UGD) if (u[0] !== 'sew' && u[1] !== 'dP') { const [x, y] = (K === 1 && UOVR1[u[1]]) || FR(u[3], u[4], u[5], u[6]); u[3] = x; u[4] = y; }
const UGZ = { sew: 'THE SEWERS · −1', cat: 'CATACOMBS · −1', hell: 'HELL · −5', cav: 'THE CAVERN · −3/−4', dumb: 'THE D.U.M.B. · −2 to −7', deep: 'THE DEEP · SEA FLOOR' };
const UGZPOS = { sew: [6, -1.4], cat: [-32.5, -18.4], hell: [-31, -26.4], cav: [-24, 21], dumb: [-30, 52], deep: [52, 8] };
for (const k in UGZPOS) if (k !== 'sew') UGZPOS[k] = F(...UGZPOS[k]);
if (K === 1) { UGZPOS.cav = [-13, 19.6]; UGZPOS.cat = [-14.6, -3.4]; }
// tunnels you WALK (1 plot wide, the zone's own plots) and lines you RIDE (a train or a sub between stations: no plots)
const UGWALK = [['sewW', 'sewT'], ['sewW', 'sewH'], ['sewW', 'sewO'], ['sewW', 'sewR'], ['sewT', 'dP'], ['cat', 'hell'], ['cavK', 'cavH'], ['cavK', F(-44, 16).map(Math.round)], [F(-44, 16).map(Math.round), 'cavA'], ['cavK', F(-31, 12).map(Math.round)], ['cavK', F(-40, 27).map(Math.round)]];
if (K === 1) { // v13: the walks meet the new plot paths: the wells come down at the corn Hub, the tunnel way in the creek
  UGWALK.splice(UGWALK.length - 2, 2, ['cavK', [-14, 10]], ['cavK', [-7, 2]]);
  UGWALK.push(['sewH', [-7, 2]]); }
// v13 LOOPS: a secret walk, an outfall walk, and a late-game ride [a, b, name, kind]
const UGLOOP = K === 1 ? [['cat', 'cavH', 'the Bone Passage (secret)', 'secret'], ['sewW', 'deepS', 'the Outfall', 'walk'], ['sewR', 'dS', 'the Freight Line (late game)', 'late']] : [];
const UGRIDE = [['dP', 'dC', 'U1 Maglev'], ['dC', 'dR', 'the tube'], ['dR', 'dK', 'the tube'], ['dK', 'dS', 'the tube'], ['dS', 'dP', 'the tube'], ['cavH', 'leyZ', 'the deep road to Technoticlan'], ['deepS', 'deepA', 'the sub'], ['deepA', 'deepT', 'the sub']];
// ways down from the surface [x, y, text]
const UGWAYS = [[-48.5, -24.6, 'Lemuria adit ↑ the Redwood Trail'], [-39.5, 27.6, 'wells ↑ the Estate'], [-30.5, 12, 'tunnel way ↑ Dead Man’s Cave'], [-35, -15.5, 'stairs ↑ the Vatican'],
  [-10, -45.5, 'lift ↑ Shasta'], [-6, 63, 'hangar lift ↑ Area 51'], [-43, 41, 'barn hatch ↑ the Ranch'], [-56, -28, 'quarry shaft ↑ Stonehenge'], [-8, 87.5, 'Polar Opening ↑ Antarctica'], [24, 3, 'Dutchman’s hold ↑ the Harbour'], [59, -4, 'the vortex ↑ the Triangle']];
const WAY1 = { quarry: [-27, -10.6], wells: [-13.5, 10.5], tunnel: [-6.5, 2.5], barn: [-9.5, 19.5] };
for (const w of UGWAYS) { const k = w[2].split(' ')[0]; const [x, y] = (K === 1 && WAY1[k]) ? WAY1[k] : F(w[0], w[1]); w[0] = x; w[1] = y; }
// the walked tunnels' plots, one row a walk (the sheet draws them; --plots lists them). A tunnel holds the plots no
// district and no earlier tunnel holds.
function ugCells() {
  const UB = id => { const r = UGD.find(u => u[1] === id); if (r) return { x: r[3], y: r[4], w: r[5], h: r[6] }; return ZB(id); };
  const cen = id => { if (Array.isArray(id)) return id; const z = UB(id); return [Math.floor(z.x + z.w / 2), Math.floor(z.y + z.h / 2)]; };
  const occ = new Set(); for (const u of UGD) for (let x = u[3]; x < u[3] + u[5]; x++) for (let y = u[4]; y < u[4] + u[6]; y++) occ.add(x + ',' + y);
  const WALK = new Set(), wpts = [], rows = [];
  for (const [a, b] of UGWALK) { const [ax, ay] = cen(a), [bx, by] = cen(b); const pts = Math.abs(bx - ax) > Math.abs(by - ay) ? [[ax, ay], [bx, ay], [bx, by]] : [[ax, ay], [ax, by], [bx, by]]; wpts.push(pts); const own = [];
    for (const k of bandCells(pts, 1)) if (!occ.has(k)) { if (!WALK.has(k)) own.push(k); WALK.add(k); } rows.push({ a, b, kind: 'walk', pts, own }); }
  const LOOPW = new Set(), SECW = new Set();
  for (const [a, b, nm, k] of UGLOOP) { if (k === 'late') { rows.push({ a, b, kind: 'late', name: nm }); continue; } const [ax, ay] = cen(a), [bx, by] = cen(b); const pts = (k === 'secret' || Math.abs(bx - ax) > Math.abs(by - ay)) ? [[ax, ay], [bx, ay], [bx, by]] : [[ax, ay], [ax, by], [bx, by]]; const own = [], set = k === 'secret' ? SECW : LOOPW;
    for (const c of bandCells(pts, 1)) if (!occ.has(c) && !WALK.has(c)) { if (!set.has(c)) own.push(c); set.add(c); } rows.push({ a, b, kind: k, name: nm, pts, own }); }
  return { UB, cen, occ, WALK, wpts, LOOPW, SECW, rows };
}
function underground() {
  const { cen, WALK, LOOPW, SECW } = ugCells();
  for (const c of LOOPW) WALK.add(c);
  UGSTATS.loops = LOOPW.size + SECW.size; UGSTATS.secret = SECW.size;
  UGSTATS.walk = WALK.size + SECW.size; UGSTATS.rooms = UGD.reduce((a, u) => a + u[7], 0);
  const [cx, cy] = P(...CEN), R = RAD;
  let s = `<defs><radialGradient id="sun" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ffe9a0" stop-opacity=".95"/><stop offset=".35" stop-color="#ff9a40" stop-opacity=".45"/><stop offset="1" stop-color="#ff9a40" stop-opacity="0"/></radialGradient>
  <pattern id="hatch2" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="5" height="5" fill="#2a2618"/><line x1="0" y1="0" x2="0" y2="5" stroke="#ffd36a" stroke-width="1.8"/></pattern></defs>`;
  s += `<rect width="${W}" height="${H}" fill="#07060a"/>` + gridFrame('#7b8a96');
  s += `<circle cx="${cx}" cy="${cy}" r="${(R + 1.4) * S}" fill="#151a20" stroke="#4a5a66" stroke-width="2"/><circle cx="${cx}" cy="${cy}" r="${R * S}" fill="#0b1a26"/>`;
  s += `<path shape-rendering="crispEdges" d="${cellsPath(LANDC)}" fill="#1d1813" stroke="none"/><path d="${cellsOutline(LANDC)}" fill="none" stroke="#3a3026" stroke-width=".8"/>`;
  // the surface rooms, faint, so you can see what is overhead
  for (const z of SURF) s += rect(z, 'none', 'rgba(255,255,255,.14)', 'stroke-dasharray="2 3"');
  { const [a, b] = P(...(() => { const u = UGD.find(q => q[1] === 'cavH'); return [u[3] + u[5] / 2, u[4] + u[6] / 2]; })()); s += `<circle cx="${a}" cy="${b}" r="${7 * K * S}" fill="url(#sun)"/>`; }
  // rides first (under), then the walked tunnels
  for (const [a, b, nm] of UGRIDE) { const [ax, ay] = cen(a), [bx, by] = cen(b); const [p, q] = P(ax + .5, ay + .5), [u, v] = P(bx + .5, by + .5);
    const col = nm.includes('sub') ? '#7fd8ff' : nm.includes('deep road') ? '#d8c6ff' : '#ffd36a';
    s += `<path d="M${p},${q}L${u},${v}" stroke="${col}" stroke-width="2.2" stroke-dasharray="7 4" opacity=".9"/>`; }
  for (const [a, b, nm, k] of UGLOOP) if (k === 'late') { const [ax, ay] = cen(a), [bx, by] = cen(b); const [p, q] = P(ax + .5, ay + .5), [u, v] = P(bx + .5, by + .5); s += `<path d="M${p},${q}L${u},${v}" stroke="#ff5a4a" stroke-width="2.4" stroke-dasharray="3 3"/>`; }
  s += `<path shape-rendering="crispEdges" d="${cellsPath(WALK)}" fill="#b9a982" opacity=".9"/>`;
  s += `<path shape-rendering="crispEdges" d="${cellsPath(SECW)}" fill="#e8dcc0" opacity=".35"/><path d="${cellsOutline(SECW)}" fill="none" stroke="#e8dcc0" stroke-width="1.2" stroke-dasharray="3 2"/>`;
  for (const u of UGD) { const z = { x: u[3], y: u[4], w: u[5], h: u[6] };
    if (u[8] === 'ring') { const [a, b] = P(z.x + z.w / 2, z.y + z.h / 2); s += `<ellipse cx="${a}" cy="${b}" rx="${z.w / 2 * S}" ry="${z.h / 2 * S}" fill="none" stroke="#9fb0c4" stroke-width="${S * .9}"/><ellipse cx="${a}" cy="${b}" rx="${z.w / 2 * S}" ry="${z.h / 2 * S}" fill="none" stroke="#fff" stroke-width=".8"/>`; continue; }
    s += rect(z, u[8], '#fff', 'stroke-width="1.3"') + grid(z, 'rgba(0,0,0,.25)'); }
  { const [a, b] = P(...(() => { const u = UGD.find(q => q[1] === 'cavH'); return [u[3] + u[5] / 2, u[4] + u[6] / 2]; })()); s += `<circle cx="${a}" cy="${b}" r="4" fill="#fff6c8"/>`; }
  for (const [x, y, t] of UGWAYS) { const [a, b] = P(x, y); s += `<path d="M${a},${b - 6}v10M${a - 3},${b + 1}l3,3l3,-3" stroke="#fff" stroke-width="1.2" fill="none"/>`; s += label(t, x, y - 1.6, { size: 6.5, fill: '#ddd', cls: 'dl', raw: true }); }
  s += gridOverlay('rgba(255,255,255,.05)', 'rgba(255,255,255,.22)', '#7b8a96');
  for (const u of UGD) s += label(u[2], u[3] + u[5] / 2, u[4] + u[6] + 1 + (u[9] || 0), { size: 6.8, fill: '#f2f2f2', cls: 'dl', raw: true });
  for (const k in UGZ) s += label(UGZ[k], ...UGZPOS[k], { size: 8.5, box: true, raw: true });
  { const m = cen('dC'), n = cen('dP'); s += label('U1 MAGLEV (ride)', (m[0] + n[0]) / 2 + 3, (m[1] + n[1]) / 2, { size: 7, cls: 'buf', raw: true }); }
  for (const [a, b, nm, k] of UGLOOP) { const m = cen(a), n = cen(b); const lp = k === 'secret' ? [n[0] + 0.5, 6.2] : [(m[0] + n[0]) / 2 + (k === 'walk' ? 0 : 1.2), (m[1] + n[1]) / 2 + (k === 'walk' ? -1 : 0)]; s += label(k === 'secret' ? 'Bone Passage (secret)' : nm, lp[0], lp[1], { size: 7, cls: k === 'walk' ? 'buf' : 'dl', raw: true, fill: k === 'late' ? '#ff8a7a' : '#f2e8d0' }); }
  s += label('THE TUBE (ride): the D.U.M.B.’s bases', ...F(-28, 2), { size: 7, cls: 'buf', raw: true });
  // key
  s += `<g transform="translate(14,96)"><rect x="-6" y="-14" width="196" height="104" fill="#0b0f16" opacity=".88" stroke="#fff" stroke-width=".6"/><text y="-2" font-size="8" class="dl" fill="#fff">BELOW</text>
    <rect y="6" width="12" height="8" fill="#b9a982"/><text x="18" y="13" font-size="8" class="dl" fill="#eee">Tunnel you walk (the zone’s plots)</text>
    <path d="M0,24h22" stroke="#ffd36a" stroke-width="2.2" stroke-dasharray="7 4"/><text x="28" y="27" font-size="8" class="dl" fill="#eee">Line you ride (train, no plots)</text>
    <path d="M0,38h22" stroke="#7fd8ff" stroke-width="2.2" stroke-dasharray="7 4"/><text x="28" y="41" font-size="8" class="dl" fill="#eee">The sub (The Deep, under the sea)</text>
    <path d="M6,48v8M3,53l3,3l3,-3" stroke="#fff" stroke-width="1.2" fill="none"/><text x="28" y="55" font-size="8" class="dl" fill="#eee">Way down from the surface</text>
    <rect y="62" width="12" height="8" fill="rgba(232,220,192,.35)" stroke="#e8dcc0" stroke-dasharray="3 2"/><text x="18" y="69" font-size="8" class="dl" fill="#eee">Secret tunnel (walk, found later)</text>
    <path d="M0,80h22" stroke="#ff5a4a" stroke-width="2.4" stroke-dasharray="3 3"/><text x="28" y="83" font-size="8" class="dl" fill="#eee">Late-game ride (opens after the D.U.M.B.)</text></g>`;
  s += label('ROCK UNDER THE CONTINENT', ...F(-62, 50), { size: 8, fill: '#7b6a54', cls: 'sea', raw: true }) + label('UNDER THE OCEAN', ...F(50, 34), { size: 8, fill: '#3d8aa0', cls: 'sea', raw: true });
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Underground map: districts spread under the land">${s}</svg>`;
}

// ── 2b. THE CROSS-SECTION (west → east through the middle) ──
function section() {
  const w = 1000, h = 380; let s = `<rect width="${w}" height="${h}" fill="#07060a"/>`;
  const y0 = 120; // ground line
  s += `<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0f2a4a"/><stop offset="1" stop-color="#3a6a9a"/></linearGradient><radialGradient id="sun2"><stop offset="0" stop-color="#fff2b0"/><stop offset=".4" stop-color="#ff9a40" stop-opacity=".5"/><stop offset="1" stop-color="#ff9a40" stop-opacity="0"/></radialGradient></defs>`;
  s += `<rect x="0" y="0" width="${w}" height="${y0}" fill="url(#sky)"/>`;
  // ground profile: mountains west, city, desert, sea east
  s += `<path d="M0,${y0}L60,${y0 - 6}L110,${y0 - 70}L150,${y0 - 30}L190,${y0 - 85}L235,${y0 - 20}L280,${y0 - 4}L520,${y0}L560,${y0 - 3}L700,${y0}L720,${y0 + 14}L1000,${y0 + 14}L1000,${h}L0,${h}Z" fill="#2a2119"/>`;
  s += `<rect x="720" y="${y0 + 2}" width="280" height="12" fill="#1f5a84"/><path d="M720,${y0 + 14}L780,${y0 + 40}L860,${y0 + 46}L900,${y0 + 120}L940,${y0 + 46}L1000,${y0 + 46}" fill="none" stroke="#3d8aa0" stroke-width="1.5"/>`;
  s += `<path d="M720,${y0 + 14}L780,${y0 + 40}L860,${y0 + 46}L900,${y0 + 120}L940,${y0 + 46}L1000,${y0 + 46}L1000,${y0 + 14}Z" fill="#123a5c"/>`;
  const box = (x, y, bw, bh, c, t, sub) => `<rect x="${x}" y="${y}" width="${bw}" height="${bh}" fill="${c}" stroke="#fff" stroke-width="1.2"/><text x="${x + bw / 2}" y="${y + bh / 2 - (sub ? 2 : -3)}" text-anchor="middle" font-size="10" class="lbl" fill="#fff">${t}</text>${sub ? `<text x="${x + bw / 2}" y="${y + bh / 2 + 11}" text-anchor="middle" font-size="8" class="dl" fill="#ddd">${sub}</text>` : ''}`;
  // surface tags
  const tag = (x, t) => `<text x="${x}" y="${y0 - 10}" text-anchor="middle" font-size="9" class="lbl" fill="#fff">${t}</text>`;
  s += tag(150, 'MT OLYMPUS · SHASTA') + tag(270, 'VATICAN') + tag(420, 'DISASTER CITY') + tag(610, 'DESERT · AREA 51') + tag(850, 'THE OCEAN');
  s += `<ellipse cx="190" cy="20" rx="70" ry="14" fill="rgba(255,255,255,.18)" stroke="#fff" stroke-dasharray="3 3"/><text x="190" y="24" text-anchor="middle" font-size="9" class="lbl" fill="#fff">HEAVEN</text>`;
  s += `<path d="M190,${y0 - 85}L190,36" stroke="#fff" stroke-dasharray="2 3"/><text x="198" y="68" font-size="8" class="dl" fill="#fff">Grand Stair</text>`;
  // depth bands
  const bands = [['−1 MAN-MADE', y0 + 8], ['−2 DEEP WORKS', y0 + 62], ['−3 / −4 THE HOLLOW', y0 + 118], ['−5 THE PIT', y0 + 200]];
  for (const [t, y] of bands) s += `<line x1="0" y1="${y}" x2="715" y2="${y}" stroke="rgba(255,255,255,.08)"/><text x="8" y="${y + 12}" font-size="8" class="dl" fill="#8a7a66">${t}</text>`;
  s += box(222, y0 + 10, 96, 28, '#8a7f6a', 'CATACOMBS') + box(380, y0 + 10, 110, 34, '#5d6b4a', 'THE SEWERS', 'subway = Running Tunnels');
  s += `<rect x="470" y="${y0 + 44}" width="12" height="40" fill="#ffd36a"/><path d="M482,${y0 + 80}L560,${y0 + 80}" stroke="#ffd36a" stroke-width="5"/><text x="520" y="${y0 + 74}" text-anchor="middle" font-size="8" class="buf">U1 MAGLEV</text>`;
  s += box(560, y0 + 64, 120, 40, '#56606e', 'THE D.U.M.B.', 'CERN ring round it');
  s += `<circle cx="430" cy="${y0 + 170}" r="90" fill="url(#sun2)"/>`;
  s += box(340, y0 + 120, 180, 70, 'rgba(91,74,110,.85)', 'THE CAVERN', 'Hollow Earth · Agartha · inner sun');
  s += box(200, y0 + 205, 90, 40, '#8a2a1e', 'HELL', 'under the Vatican');
  s += box(820, y0 + 50, 120, 34, '#1c5f6e', 'THE DEEP', 'Atlantis · Trench');
  s += `<path d="M150,${y0 - 40}C200,${y0 + 40} 300,${y0 + 120} 345,${y0 + 140}" fill="none" stroke="#bbb" stroke-dasharray="5 4"/><text x="214" y="${y0 + 62}" font-size="8" class="dl" fill="#ccc">Lemuria Stair</text>`;
  s += `<path d="M345,${y0 + 180}C320,${y0 + 200} 300,${y0 + 210} 290,${y0 + 220}" fill="none" stroke="#ff7a5a" stroke-dasharray="5 4"/>`;
  s += `<path d="M520,${y0 + 160}C560,${y0 + 150} 600,${y0 + 120} 610,${y0 + 104}" fill="none" stroke="#bbb" stroke-dasharray="5 4"/><text x="560" y="${y0 + 150}" font-size="8" class="dl" fill="#ccc">Level −6</text>`;
  s += `<text x="${w - 10}" y="${h - 10}" text-anchor="end" font-size="8" class="dl" fill="#6a6a6a">not to scale · west → east</text>`;
  return `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Cross-section of the world's layers">${s}</svg>`;
}

// ── 3. BEYOND THE MAP ──
// [world, x, y, colour, [[district, plots, angle on the globe]]]: the sheet draws these, --plots lists them
const BEYOND_WORLDS = [
  ['THE MOON', 140, 150, '#cfcfcf', [['The Mare', 7, 180], ['The Crater', 9, -55], ['The Far Side', 4, 80]]],
  ['MARS', 375, 150, '#c8643a', [['Cydonia', 10, 180], ['The Canyon', 5, -55], ['The Rover Bay', 5, 80]]],
  ['SATURN', 620, 150, '#d9b77a', [['The Hexagon', 12, -90], ['The Ring Shard', 4, 20]]],
  ['THE SINGULARITY', 862, 150, '#000', [['The Accretion Rim', 12, -60], ['The Drop', 4, 90]]],
];
function beyond() {
  const w = 1000, h = 820; let s = `<rect width="${w}" height="${h}" fill="#05050a"/>`;
  let seed = 4; const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  for (let i = 0; i < 180; i++) s += `<circle cx="${r1(rnd() * w)}" cy="${r1(rnd() * 300)}" r="${r1(rnd() * 1.3 + .2)}" fill="#fff" opacity="${r1(.3 + rnd() * .6)}"/>`;
  const T = (x, y, t, o = {}) => `<text x="${x}" y="${y}" text-anchor="${o.a || 'middle'}" font-size="${o.fs || 8}" class="${o.c || 'dl'}" fill="${o.f || '#eee'}">${t}</text>`;
  // OUTER SPACE: four worlds, each district a landing site of its own on the globe; the ship flies between sites
  s += T(500, 26, 'OUTER SPACE · ONE FLIGHT, EACH DISTRICT ITS OWN LANDING', { fs: 12, c: 'lbl', f: '#ffd36a' });
  const worlds = BEYOND_WORLDS;
  const sites = [];
  for (const [n, x, y, c, ds] of worlds) {
    const R = 58;
    if (n === 'SATURN') s += `<ellipse cx="${x}" cy="${y}" rx="${R * 1.75}" ry="${R * .34}" fill="none" stroke="#e8d3a0" stroke-width="3" opacity=".7"/>`;
    s += `<circle cx="${x}" cy="${y}" r="${R}" fill="${c}" stroke="${n === 'THE SINGULARITY' ? '#ff9a40' : '#fff'}" stroke-width="${n === 'THE SINGULARITY' ? 4 : 1.2}"/>`;
    if (n === 'THE SINGULARITY') s += `<circle cx="${x}" cy="${y}" r="${R + 8}" fill="none" stroke="#ff9a40" stroke-width="1" stroke-dasharray="2 3" opacity=".7"/>`;
    s += T(x, y + R + 18, n, { fs: 10, c: 'lbl', f: '#fff' });
    for (const [dn, plots, ang] of ds) { const t = ang * Math.PI / 180, px = r1(x + Math.cos(t) * R * .62), py = r1(y + Math.sin(t) * R * .62);
      sites.push([px, py]);
      s += `<rect x="${px - 6}" y="${py - 6}" width="12" height="12" fill="#0b0f16" stroke="#ffd36a" stroke-width="1.6"/>` + T(px, py + 18, `${dn} · ${plots}`, { fs: 7.5, f: '#fff' }); }
  }
  // the flight: Collar → every landing in turn
  s += `<path d="M${sites.map(p => p.join(',')).join(' L')}" fill="none" stroke="#ffd36a" stroke-width="1.2" stroke-dasharray="5 4" opacity=".75"/>`;
  // the dome + the disc
  s += `<path d="M110,540 A390,290 0 0 1 890,540" fill="rgba(120,180,255,.05)" stroke="#9fc6ff" stroke-width="1.4" stroke-dasharray="5 4"/>` + T(160, 470, 'THE FIRMAMENT', { f: '#9fc6ff' });
  s += `<ellipse cx="500" cy="540" rx="390" ry="58" fill="#123a5c" stroke="#cfeaf5" stroke-width="6"/><ellipse cx="490" cy="538" rx="220" ry="32" fill="#4d6b45"/>`;
  s += T(490, 544, 'THE SURFACE', { fs: 11, c: 'lbl', f: '#fff' }) + T(800, 590, 'the Ice Wall', { f: '#cfeaf5' });
  s += `<path d="M170,570 Q500,700 830,570" fill="#1d1813" stroke="#5a4c3a"/>` + T(500, 625, 'THE UNDERGROUND (its own sheet)', { fs: 9, c: 'lbl', f: '#c9b08a' });
  s += `<path d="M640,560 C900,520 960,320 880,215" fill="none" stroke="#ffd36a" stroke-width="2"/>` + `<text x="935" y="440" font-size="8" class="dl" fill="#ffd36a" transform="rotate(-72 935 440)">the Spaceship leaves through the Collar</text>`;
  // HEAVEN: its districts spread over the clouds above Olympus and the Vatican
  const cloud = (x, y, rx, t, n) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${rx * .3}" fill="rgba(255,255,255,.17)" stroke="#fff"/>` + T(x, y + 3, `${t} · ${n}`, { fs: 8.5, c: 'lbl', f: '#fff' });
  s += `<path d="M330,518 L345,395" stroke="#fff" stroke-width="2.4" stroke-dasharray="3 3"/>` + T(305, 470, 'The Stairway · 8', { fs: 8.5, f: '#fff' }) + T(305, 482, 'up from Olympus', { fs: 7, f: '#ccc' });
  s += `<path d="M345,385 C420,350 470,350 520,365 M590,370 C650,345 700,330 745,330" stroke="#fff" stroke-width="1.2" stroke-dasharray="1 4" fill="none"/>`;
  s += cloud(345, 385, 60, 'The Gate', 4) + cloud(560, 372, 70, 'The Cloud Fields', 4) + cloud(790, 330, 80, 'The City', 4);
  s += T(560, 320, 'HEAVEN · districts spread over the clouds, cloud paths between', { fs: 9, c: 'lbl', f: '#fff' });
  // THE INTERNET
  s += `<g transform="translate(120,385)">`;
  for (let i = 0; i < 5; i++) s += `<path d="M${-60 + i * 30},-36L${-60 + i * 30},36M-60,${-36 + i * 18}L60,${-36 + i * 18}" stroke="#2fe0a0" stroke-width=".8" opacity=".55"/>`;
  s += `<rect x="-60" y="-36" width="120" height="72" fill="rgba(20,80,60,.25)" stroke="#7fffd0" stroke-width="1.6"/>` + T(0, -2, 'THE INTERNET', { fs: 12, c: 'lbl', f: '#7fffd0' }) + T(0, 14, 'unchanged (my proposal)', { f: '#bfffe8' }) + `</g>`;
  s += `<path d="M150,425 C240,520 380,600 470,640" fill="none" stroke="#7fffd0" stroke-width="1.4" stroke-dasharray="4 4"/>` + T(250, 548, 'the D.U.M.B.’s server rooms', { f: '#7fffd0' });
  // THE ASTRAL REALM: three districts on islands far apart in the void, two crossings
  s += `<g transform="translate(40,690)">`;
  s += `<ellipse cx="90" cy="40" rx="78" ry="24" fill="#5a3f9a" stroke="#d8c6ff"/>` + T(90, 44, 'The Sea of Possibility · 16', { fs: 8, f: '#fff' });
  s += `<ellipse cx="250" cy="-8" rx="58" ry="18" fill="#6b4fb0" stroke="#d8c6ff"/>` + T(250, -4, 'The Library · 10', { fs: 8, f: '#fff' });
  s += `<ellipse cx="395" cy="46" rx="58" ry="18" fill="#3a2350" stroke="#ff7ab0"/>` + T(395, 50, 'The Nightmare · 10', { fs: 8, f: '#fff' });
  s += `<path d="M160,30 L196,0 M306,0 L340,38" stroke="#d8c6ff" stroke-width="1.6" stroke-dasharray="3 3"/>`;
  s += T(240, 96, 'THE ASTRAL REALM · three islands, two crossings', { fs: 10, c: 'lbl', f: '#d8c6ff' }) + `</g>`;
  // DOOR HQ
  s += `<g transform="translate(820,730)"><rect x="-90" y="-36" width="180" height="72" fill="#0b0f16" stroke="#fff" stroke-width="2"/>` + T(0, -8, 'DOOR HQ', { fs: 13, c: 'lbl', f: '#fff' }) + T(0, 10, 'the subconscious: handmade,', { f: '#ccc' }) + T(0, 22, 'a door to every layer', { f: '#ccc' }) + `</g>`;
  for (const [x, y] of [[700, 545], [560, 640], [560, 380], [862, 215], [300, 690], [180, 400]]) s += `<path d="M820,694 L${x},${y}" stroke="#ffd36a" stroke-width="1" stroke-dasharray="1 4"/>`;
  return `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Off-world layers with their districts spread">${s}</svg>`;
}


// ── v13 CLOSE-UP: the west half, every plot of the shaped districts named (one cell = one plot = 12 x 12 squares) ──
function closeup() {
  const X0 = -35, X1 = 5, Y0 = -24, Y1 = 25, C = 40, PAD = 44, TOP = 70;
  const Q = (x, y) => [PAD + (x - X0) * C, TOP + (y - Y0) * C];
  const W2 = PAD * 2 + (X1 - X0) * C, H2 = TOP + PAD + (Y1 - Y0) * C;
  const inR = (x, y) => x >= X0 && x < X1 && y >= Y0 && y < Y1;
  const cell = (k, fill, extra = '') => { const [x, y] = k.split(',').map(Number); if (!inR(x, y)) return ''; const [a, b] = Q(x, y); return `<rect x="${a}" y="${b}" width="${C}" height="${C}" fill="${fill}" ${extra}/>`; };
  const LIGHT = { snow: 1, ice: 1, holy: 1, desert: 1, farm: 1, ancient: 1 };
  const wrap = (t, n = 9) => { const w = t.split(' '), L = ['']; for (const x of w) { if ((L[L.length - 1] + ' ' + x).trim().length > n && L[L.length - 1]) L.push(x); else L[L.length - 1] = (L[L.length - 1] + ' ' + x).trim(); } return L.slice(0, 3); };
  let s = `<rect width="${W2}" height="${H2}" fill="#0d1a24"/>`;
  for (const k of LANDC) s += cell(k, '#3b3428');
  for (const id in RCELLS) for (const k of RCELLS[id]) s += cell(k, ROADCLASS[id] === 'major' ? '#4a4038' : '#8a6a40');
  for (const k of HCELLS) s += cell(k, '#4a4038');
  for (const zk in TCELLS) for (const k of TCELLS[zk]) s += cell(k, '#d9cfa6', 'opacity=".55"');
  let t = '';
  for (const z of SURF) {
    const col = BIOME[z.b] || '#555', dark = LIGHT[z.b];
    if (z.plots) {
      for (const [nm, x, y] of z.plots) { if (!inR(x, y)) continue; const [a, b] = Q(x, y);
        s += `<rect x="${a}" y="${b}" width="${C}" height="${C}" fill="${col}" stroke="#fff" stroke-width=".8"/>`;
        const L = wrap(nm.replace(/^The /, '')); L.forEach((ln, i) => { t += `<text x="${a + C / 2}" y="${b + C / 2 - (L.length - 1) * 4 + i * 8 + 2.5}" text-anchor="middle" font-size="7" fill="${dark ? '#1a1a1a' : '#f4f4f4'}" font-family="monospace">${ln}</text>`; }); }
      continue; }
    // whole blocks: draw the clipped rectangle and its name once
    const x0 = Math.max(z.x, X0), y0 = Math.max(z.y, Y0), x1 = Math.min(z.x + z.w, X1), y1 = Math.min(z.y + z.h, Y1); if (x0 >= x1 || y0 >= y1) continue;
    const [a, b] = Q(x0, y0); s += `<rect x="${a}" y="${b}" width="${(x1 - x0) * C}" height="${(y1 - y0) * C}" fill="${z.id === 'beach' ? 'rgba(70,150,190,.3)' : col}" stroke="#fff" stroke-width="1.2" opacity=".75"/>`;
    for (let x = x0; x < x1; x++) for (let y = y0; y < y1; y++) { const [p, q] = Q(x, y); s += `<rect x="${p}" y="${q}" width="${C}" height="${C}" fill="none" stroke="rgba(0,0,0,.18)" stroke-width=".6"/>`; }
    const nm = (DNAME[z.id] || z.name || ZNAME[z.id] || ({ stone: 'STONEHENGE' })[z.id] || z.id).replace(/^The /, ''); const [m, n] = Q((x0 + x1) / 2, (y0 + y1) / 2);
    t += `<text x="${m}" y="${n + 4}" text-anchor="middle" font-size="11" font-weight="bold" fill="${dark ? '#1a1a1a' : '#fff'}" font-family="monospace" style="paint-order:stroke;stroke:${dark ? 'rgba(255,255,255,.6)' : '#0b0f16'};stroke-width:2.5px">${nm}</text>`;
  }
  // district names over their paths
  for (const z of SURF) if (z.plots && DNAME[z.id]) { const m = z.plots[0]; if (!inR(m[1], m[2])) continue; const [a, b] = Q(m[1], m[2]);
    t += `<text x="${a + C / 2}" y="${b - 4}" text-anchor="middle" font-size="10" font-weight="bold" fill="#ffd36a" font-family="monospace" style="paint-order:stroke;stroke:#0b0f16;stroke-width:3px">${DNAME[z.id].replace(/^The /, '').toUpperCase()}</text>`; }
  // plot grid + coordinates
  for (let x = X0; x <= X1; x++) { const [a] = Q(x, Y0); s += `<line x1="${a}" y1="${TOP}" x2="${a}" y2="${H2 - PAD}" stroke="rgba(255,255,255,${x % 12 === 0 ? .35 : .06})"/>`; if (x < X1 && x % 2 === 0) t += `<text x="${a + C / 2}" y="${TOP - 6}" text-anchor="middle" font-size="8" fill="#9fb6c4" font-family="monospace">${x}</text>`; }
  for (let y = Y0; y <= Y1; y++) { const [, b] = Q(X0, y); s += `<line x1="${PAD}" y1="${b}" x2="${W2 - PAD}" y2="${b}" stroke="rgba(255,255,255,${y % 12 === 0 ? .35 : .06})"/>`; if (y < Y1 && y % 2 === 0) t += `<text x="${PAD - 6}" y="${b + C / 2 + 3}" text-anchor="end" font-size="8" fill="#9fb6c4" font-family="monospace">${y}</text>`; }
  t += `<text x="${PAD}" y="26" font-size="16" font-weight="bold" fill="#fff" font-family="Georgia,serif">CLOSE-UP: THE WEST HALF, EVERY PLOT NAMED</text>`;
  t += `<text x="${PAD}" y="46" font-size="10" fill="#ddd" font-family="monospace">One cell = one plot = 12 x 12 battle squares (42 m). Gold = the district. Pale path = a wild link between districts. Brown = a road. Numbers = plots from Disaster City's corner.</text>`;
  return `<svg viewBox="0 0 ${W2} ${H2}" width="${W2}" height="${H2}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Close-up of the west half with every plot named">${s + t}</svg>`;
}
// ── --plots: THE EXTRACT (One World foundation, 2026-11-17). `node gen.js --plots` writes plots.json beside this file and nothing
// else: every district's plots (name + world plot x, y, and where the plot stands in the game today), every route, wild link
// and underground walk as plot lists, every way down / up, every island, the ground kind of every plot of the disc. The zone
// threads read plots.json, never this file. The plot names + `was` come from the game's own rooms (data.js through the repo's
// load-data.js), so a renamed or missing plot stops the extract instead of slipping through. ──
if (process.argv.includes('--plots')) { plotsExtract(); process.exit(0); }
function plotsExtract() {
  const path = require('path'), vm = require('vm');
  const REPO = path.join(__dirname, '../../..');
  const G = require(path.join(REPO, 'load-data.js')).loadGameData();
  const ROOMS = G.DOOR_HQ.rooms, ZM = vm.runInContext('HQ_ZONE_MAP', G);
  const key = (x, y) => x + ',' + y, xy = k => k.split(',').map(Number);
  const fail = m => { console.error('plots: ' + m); process.exit(1); };
  const norm = n => String(n).replace(/[’']/g, "'").replace(/^the\s+/i, '').replace(/\s*\(label mine\)/i, '').trim().toLowerCase();
  // today's plots of a room, by district letter: [{ id, n, gx, gy }]
  const todayOf = (room, letters) => {
    const R = ROOMS[room]; if (!R) fail('no room ' + room);
    if (room === 'site_prebuilt_downtown_streets') { const row = ZM.zones.city.rooms[0]; return row.plots.filter(q => letters.includes(q[2])).map(q => ({ id: q[0], n: q[1], gx: q[3], gy: q[4] })); }
    return (R.plots.names || []).filter(q => letters.includes(q[2])).map(q => { const m = /^P(\d+)-(\d+)$/.exec(q[0]); return { id: q[0], n: q[1], gx: +m[1], gy: +m[2] }; });
  };
  // ── every district: [hub (data.js DOOR_HQ.hubs), zone name, district name, state, today's room, today's district letters] ──
  // state: 'stays' = the room keeps its shape, only gets its world position (phase 1); 'moves' = a zone thread re-lays it
  // (phase 3); 'new' = no plots in the game yet (phase 4); 'reroute' = the Desert: BUILD_PLAN counts it as staying, but this
  // sheet stands its four districts apart with the Highway re-routed between them (phase 4.2 decides); 'shrinks' = the Beach:
  // its first 8 columns stay at the city, the Triangle and the Volcano Island leave for their islands (phase 4.3).
  // hub / room / letters are the game's own keys.
  const MT = 'site_prebuilt_shasta_mountains', WD = 'site_prebuilt_fairy_forest_plots', CM = 'site_prebuilt_camelot_kingdom', ES = 'site_prebuilt_skinwalker_estate',
    LY = 'site_prebuilt_gobekli_ancient', DS = 'site_prebuilt_area51_desert', BC = 'site_prebuilt_bermuda_beach', CT = 'site_prebuilt_downtown_streets';
  const DMETA = {
    np: ['mountains', 'The Mountains', 'The North Pole', 'stays', 'site_prebuilt_northpole_plots', ['The North Pole village']],
    hills: ['city', 'Disaster City', 'The Hollywood Hills', 'stays', CT, ['N']],
    city: ['city', 'Disaster City', 'Disaster City', 'stays', CT, ['C', 'F', 'E', 'U', 'H', 'B', 'R', 'S', 'I']],
    vat: ['divine', 'The Vatican', 'The Vatican', 'stays', 'site_prebuilt_vatican_plots', ['G', 'P', 'S', 'B', 'C']],
    col: ['divine', 'The Vatican', 'The Colosseum', 'new', null, []],
    circus: ['desert', 'The Desert', 'The Circus', 'reroute', DS, ['C']], wt: ['desert', 'The Desert', 'Western Town', 'reroute', DS, ['W']],
    a51: ['desert', 'The Desert', 'Area 51', 'reroute', DS, ['A']], giza: ['desert', 'The Desert', 'Giza', 'reroute', DS, ['G']],
    beach: ['beach', 'The Beach', 'The Beach (the Shore, the Harbour, the near sea)', 'shrinks', BC, ['S', 'H', 'O']],
    stone: ['ley', 'Leylines', 'Stonehenge', 'moves', LY, ['S']],
    ant: ['antarctica', 'Antarctica', 'Antarctica', 'stays', 'site_prebuilt_antarctica_plots', ['H', 'W', 'C', 'O', 'S', 'F']],
    woods: ['woods', 'The Woods', 'The Clearing', 'moves', WD, ['C']], woodsT: ['woods', 'The Woods', 'The Redwood Trail', 'moves', WD, ['T']],
    woodsG: ['woods', 'The Woods', 'The Ritual Ground', 'moves', WD, ['G']], woodsM: ['woods', 'The Woods', 'Dead Man’s Cave', 'moves', WD, ['M']],
    cam: ['kingdom', 'Came A Lot Kingdom', 'Castle + Village', 'moves', CM, ['K', 'T']], camN: ['kingdom', 'Came A Lot Kingdom', 'The Snowy Pines', 'moves', CM, ['N']],
    camL: ['kingdom', 'Came A Lot Kingdom', 'The Looking-Glass Garden', 'moves', CM, ['L']], camF: ['kingdom', 'Came A Lot Kingdom', 'The Fairy Forest', 'moves', CM, ['F']],
    camW: ['kingdom', 'Came A Lot Kingdom', 'The Forest', 'moves', CM, ['W']],
    estate: ['ranch', 'The Estate', 'The Lake', 'moves', ES, ['L']], estC: ['ranch', 'The Estate', 'The Corn Fields', 'moves', ES, ['C']],
    estH: ['ranch', 'The Estate', 'The Haunted House', 'moves', ES, ['H']], estR: ['ranch', 'The Estate', 'The Ranch', 'moves', ES, ['R']],
    mtn: ['mountains', 'The Mountains', 'Mount Olympus', 'moves', MT, ['Mount Olympus']], mtnP: ['mountains', 'The Mountains', 'The Snowy Pass', 'moves', MT, ['The Snowy Pass']],
    mtnK: ['mountains', 'The Mountains', 'The Ski Lodge', 'moves', MT, ['The Ski Lodge + slopes']], shasta: ['mountains', 'The Mountains', 'Mount Shasta', 'moves', MT, ['Mount Shasta']],
    ley: ['ley', 'Leylines', 'Göbekli Tepe', 'moves', LY, ['G']], leyY: ['ley', 'Leylines', 'The Ley Line', 'moves', LY, ['Y']], ley2: ['ley', 'Leylines', 'Babel', 'moves', LY, ['T']],
    leyB: ['ley', 'Leylines', 'Bug Colony', 'moves', LY, ['B']], leyZ: ['ley', 'Leylines', 'Technoticlan', 'moves', LY, ['Z']],
  };
  const SW = 'site_prebuilt_downtown_underworld', CV = 'site_prebuilt_hollow_earth_cavern', DB = 'site_prebuilt_dumb_base', DP = 'site_prebuilt_atlantis_deep', HL = 'site_prebuilt_hell_plots';
  const UMETA = {
    sewW: ['underworld', 'The Sewers', 'moves', SW, ['W']], sewT: ['underworld', 'The Sewers', 'moves', SW, ['T']], sewH: ['underworld', 'The Sewers', 'moves', SW, ['H']],
    sewO: ['underworld', 'The Sewers', 'moves', SW, ['O']], sewR: ['underworld', 'The Sewers', 'moves', SW, ['R']],
    cat: ['divine', 'The Catacombs', 'stays', 'site_prebuilt_vatican_under', ['K']], hell: ['divine', 'Hell', 'stays', HL, ['R', 'D', 'L', 'W']],
    cavK: ['cavern', 'The Cavern', 'moves', CV, ['K']], cavH: ['cavern', 'The Cavern', 'moves', CV, ['H']], cavA: ['cavern', 'The Cavern', 'moves', CV, ['A']],
    dP: ['dumb', 'The D.U.M.B.', 'moves', DB, ['P']], dC: ['dumb', 'The D.U.M.B.', 'moves', DB, ['C']], dR: ['dumb', 'The D.U.M.B.', 'moves', DB, ['R']],
    dS: ['dumb', 'The D.U.M.B.', 'moves', DB, ['S']], dK: ['dumb', 'The D.U.M.B.', 'moves', DB, ['K']],
    deepA: ['deep', 'The Deep', 'moves', DP, ['C', 'R']], deepS: ['deep', 'The Deep', 'moves', DP, ['S']], deepT: ['deep', 'The Deep', 'moves', DP, ['T']],
  };
  // a district's plot rows. Shaped (SHAPES): each of gen.js' plots matched to the game's plot of the same name. A block that is
  // the game's own shape: the game's plots, carried over corner to corner. Any other block: the rect, and today's plots listed
  // without a place (`loose`): the zone thread lays them inside the rect.
  const rowsFor = (id, rect, shaped, room, letters) => {
    const today = room ? todayOf(room, letters) : [];
    if (shaped) {
      if (today.length !== shaped.length) fail(id + ': ' + shaped.length + ' plots here, ' + today.length + ' in the game');
      const left = today.slice();
      return { plots: shaped.map(([n, x, y]) => { const i = left.findIndex(t => norm(t.n) === norm(n)); if (i < 0) fail(id + ': no plot named "' + n + '" in ' + room + ' ' + letters); const t = left.splice(i, 1)[0]; return { n: t.n, x, y, was: t.id }; }) };
    }
    if (id === 'beach') { const plots = []; for (let gy = 0; gy < rect.h; gy++) for (let gx = 0; gx < rect.w; gx++) { const t = today.find(q => q.gx === gx && q.gy === gy), was = 'P' + String(gx).padStart(2, '0') + '-' + String(gy).padStart(2, '0');
        plots.push(t ? { n: t.n, x: rect.x + gx, y: rect.y + gy, was } : { x: rect.x + gx, y: rect.y + gy, was }); } return { plots, at: [0, 0] }; }
    if (!today.length) { const plots = []; for (let y = rect.y; y < rect.y + rect.h; y++) for (let x = rect.x; x < rect.x + rect.w; x++) plots.push({ x, y }); return { plots, unnamed: true }; }
    const gx0 = Math.min(...today.map(t => t.gx)), gy0 = Math.min(...today.map(t => t.gy)), gw = Math.max(...today.map(t => t.gx)) - gx0 + 1, gh = Math.max(...today.map(t => t.gy)) - gy0 + 1;
    if (gw === rect.w && gh === rect.h) return { plots: today.map(t => ({ n: t.n, x: rect.x + t.gx - gx0, y: rect.y + t.gy - gy0, was: t.id })).sort((a, b) => a.y - b.y || a.x - b.x), at: [gx0, gy0] };
    return { loose: today.map(t => ({ n: t.n, was: t.id })), todayBox: [gx0, gy0, gw, gh] };
  };
  const districts = [], owner = {}; // owner: surface plot -> what stands on it
  for (const z of SURF) {
    const m = DMETA[z.id]; if (!m) fail('no DMETA row for ' + z.id);
    const r = rowsFor(z.id, z, z.plots, m[4], m[5]);
    const d = { id: z.id, hub: m[0], zone: m[1], name: m[2], state: m[3], layer: 'surface', x: z.x, y: z.y, w: z.w, h: z.h, shape: z.plots ? 'path' : 'block', count: r.plots ? r.plots.length : r.loose.length };
    if (m[4]) d.today = { room: m[4], districts: m[5] }; if (r.at) d.today.at = r.at; if (r.todayBox) d.today.box = r.todayBox;
    if (r.plots) d.plots = r.plots; if (r.loose) { d.loose = r.loose; d.note = 'today’s shape is not this rect: the zone thread lays these plots inside it'; } if (r.unnamed) d.note = 'no plots in the game yet';
    districts.push(d);
    for (const q of (r.plots || [])) owner[key(q.x, q.y)] = { t: 'district', id: z.id };
    if (!r.plots) for (let x = z.x; x < z.x + z.w; x++) for (let y = z.y; y < z.y + z.h; y++) owner[key(x, y)] = { t: 'district', id: z.id };
  }
  // ── plot lists in walking order: along each leg in turn, across the band ──
  const along = (pts, w, keep) => { const out = [], seen = new Set();
    for (let i = 1; i < pts.length; i++) { const [ax, ay] = pts[i - 1], [bx, by] = pts[i], horiz = ay === by, leg = [];
      for (let x = Math.min(ax, bx); x < Math.max(ax, bx) + w; x++) for (let y = Math.min(ay, by); y < Math.max(ay, by) + w; y++) leg.push([x, y]);
      leg.sort((p, q) => horiz ? (bx >= ax ? p[0] - q[0] : q[0] - p[0]) || p[1] - q[1] : (by >= ay ? p[1] - q[1] : q[1] - p[1]) || p[0] - q[0]);
      for (const p of leg) { const k = key(...p); if (keep.has(k) && !seen.has(k)) { seen.add(k); out.push(p); } } }
    if (out.length !== keep.size) fail('a plot list lost plots: ' + out.length + ' of ' + keep.size); return out; };
  const LOOKOF = { major: 'highway', regional: 'road', trail: 'trail' };
  const routes = [];
  for (const [id, nm, pts, txt] of ROUTES) {
    const spec = ROUTE_SPEC.find(r => r[0] === id);
    if (!RCELLS[id].size) continue; // R4b, the fork to the Woods: every plot of it is already R4's
    const row = { id, name: nm, look: LOOKOF[ROADCLASS[id]], wide: 2, from: spec[2], to: spec[3], onTheWay: txt, legs: pts, plots: along(pts, 2, RCELLS[id]) };
    if (id === 'R4') row.note = 'the fork to the Woods (R4b on the sheet) lies inside this band: the Old Road passes the Clearing’s Stair';
    routes.push(row);
    for (const p of row.plots) { const k = key(...p); if (!owner[k]) owner[k] = { t: 'route', id }; else (owner[k].also = owner[k].also || []).push(id); }
  }
  const highway = { id: 'DH', name: 'The Desert Highway', look: 'highway', wide: 2, state: 'stays', today: { room: DS, districts: ['R'] }, todayCount: todayOf(DS, ['R']).length,
    note: 'the Desert’s own Highway plots (district R) as the loop between its four districts: re-route only, no new plots',
    legs: DESERT_HW.map(([nm, pts]) => { const keep = new Set([...bandCells(pts)].filter(k => !ZCELLS.has(k))); return { name: nm, legs: pts, plots: along(pts, 2, keep) }; }), count: HCELLS.size };
  for (const k of HCELLS) { if (!owner[k]) owner[k] = { t: 'highway', id: 'DH' }; else (owner[k].also = owner[k].also || []).push('DH'); }
  const links = LINKPLOTS.map((L, i) => { const row = { id: 'L' + (i + 1), zone: DMETA[L.a][1], hub: DMETA[L.a][0], look: 'trail', wide: 1, from: L.a, to: L.b, fromPlot: L.pts[0], toPlot: L.pts[L.pts.length - 1], legs: L.pts, plots: along(L.pts, 1, new Set(L.own)) };
    const shared = L.band.filter(k => !L.own.includes(k) && !ZCELLS.has(k)); if (shared.length) row.shares = shared.map(k => ({ at: xy(k), with: (owner[k] || {}).id || 'an earlier link' }));
    for (const p of row.plots) owner[key(...p)] = { t: 'link', id: row.id }; return row; });
  // what each route / link plot touches (a district plot, another route): the stitching list
  const touch = plots => { const out = []; for (const [x, y] of plots) for (const [dx, dy, side] of [[0, -1, 'n'], [1, 0, 'e'], [0, 1, 's'], [-1, 0, 'w']]) { const o = owner[key(x + dx, y + dy)]; if (o && o.t === 'district') out.push({ plot: [x, y], side, district: o.id, at: [x + dx, y + dy] }); } return out; };
  for (const r of routes) r.meets = touch(r.plots); for (const l of links) l.meets = touch(l.plots); for (const l of highway.legs) l.meets = touch(l.plots);
  // ── the ground: one letter a plot ──
  const GKEY = { peak: ['P', 'snow'], rock: ['R', 'rock'], alpine: ['A', 'rock'], foot: ['F', 'grass'], tundra: ['T', 'snow'], forest: ['f', 'forest'], wood: ['w', 'forest'], meadow: ['m', 'grass'], grass: ['g', 'grass'], farm: ['a', 'grass'],
    scrub: ['s', 'scrub'], bad: ['b', 'rock'], desert: ['d', 'desert'], dunes: ['D', 'desert'], marsh: ['M', 'grass'], saltflat: ['S', 'desert'], sand: ['n', 'desert'], cliff: ['c', 'rock'] };
  const gkey = { '~': { kind: 'sea', label: 'The sea' }, 'i': { kind: 'ice', label: 'Ice (Antarctica, the Frozen Sea)', kit: 'snow' }, '#': { kind: 'wall', label: 'The Ice Wall and past it' } };
  for (const k in GKEY) gkey[GKEY[k][0]] = { kind: k, label: BIOMES[k][1], kit: GKEY[k][1] };
  const X0 = CEN[0] - RAD - 2, Y0 = CEN[1] - RAD - 2, GW = 2 * RAD + 5, GH = 2 * RAD + 5, grows = [];
  const isl = {}; for (const z of ISL) for (let x = z.x; x < z.x + z.w; x++) for (let y = z.y; y < z.y + z.h; y++) isl[key(x, y)] = z.id;
  const ISLG = { volcano: 'f', cove: 'n', frozen: 'i', tri: '~' }; const islet = new Set(ISLETS.map(p => key(...p)));
  const ant = SURF.find(z => z.id === 'ant');
  for (let y = Y0; y < Y0 + GH; y++) { let row = '';
    for (let x = X0; x < X0 + GW; x++) { const k = key(x, y); let c;
      if (BIO[k]) c = GKEY[BIO[k]][0]; else if (x >= ant.x && x < ant.x + ant.w && y >= ant.y && y < ant.y + ant.h) c = 'i'; else if (isl[k]) c = ISLG[isl[k]]; else if (islet.has(k)) c = 'n';
      else c = Math.hypot(x + .5 - CEN[0], y + .5 - CEN[1]) > RAD ? '#' : '~';
      row += c; }
    grows.push(row); }
  // ── below ──
  const U = ugCells();
  const under = { districts: [], walks: [], rides: [], ways: [] };
  for (const u of UGD) { const [zk, id, nm, x, y, w, h, n] = u, m = UMETA[id]; if (!m) fail('no UMETA row for ' + id);
    const r = rowsFor(id, { x, y, w, h }, null, m[3], m[4]); const cnt = r.plots ? r.plots.length : r.loose.length;
    if (cnt !== n) fail(id + ': the sheet says ' + n + ' plots, the game has ' + cnt);
    const d = { id, hub: m[0], zone: m[1], name: nm, state: m[2], layer: 'under', x, y, w, h, shape: u[8] === 'ring' ? 'ring' : 'block', count: n, today: { room: m[3], districts: m[4] } };
    if (r.at) d.today.at = r.at; if (r.todayBox) d.today.box = r.todayBox; if (r.plots) d.plots = r.plots; if (r.loose) { d.loose = r.loose; d.note = 'today’s shape is not this rect: the zone thread lays these plots inside it'; }
    under.districts.push(d); }
  const endOf = a => Array.isArray(a) ? { plot: a } : { district: a };
  U.rows.forEach((r, i) => { if (r.kind === 'late') { under.rides.push({ name: r.name, from: r.a, to: r.b, kind: 'late', note: 'a ride, no plots; opens after the D.U.M.B.' }); return; }
    under.walks.push({ id: 'U' + (i + 1), kind: r.kind === 'walk' && r.name ? 'loop' : r.kind, name: r.name || null, look: 'tunnel', wide: 1, from: endOf(r.a), to: endOf(r.b), legs: r.pts, plots: along(r.pts, 1, new Set(r.own)) }); });
  for (const [a, b, nm] of UGRIDE) under.rides.push({ name: nm, from: a, to: b, kind: 'ride', note: 'a ride between stations, no plots' });
  // every way down / up: [first word of the sheet's label, the surface end, the end below]. The ends are the page's ("New ways
  // down", sheet 4) and the game's own doors; a plot = [x, y] where the sheet pins one.
  const WAYEND = { Lemuria: ['woodsT', 'cavA'], wells: ['estC', 'cavK', [-14, 10]], tunnel: ['woodsM', 'cavK', [-7, 2]], stairs: ['vat', 'cat'], lift: ['shasta', 'dS'], hangar: ['a51', 'dC'], barn: ['estR', 'dR', [-10, 19]],
    quarry: ['stone', 'dK'], Polar: ['ant', 'cavH'], 'Dutchman’s': ['beach', 'deepS'], the: ['tri', 'deepA'] };
  for (const [x, y, t] of UGWAYS) { const e = WAYEND[t.split(' ')[0]]; if (!e) fail('no way ends for "' + t + '"'); const row = { name: t.split(' ↑ ')[0], sheet: [r1(x), r1(y)], up: e[0], down: e[1] }; if (e[2]) row.plot = e[2]; under.ways.push(row); }
  under.ways.find(w => w.name.startsWith('tunnel')).alsoDown = 'sewH';
  // ── beyond the map (the sheet's layouts; no plot coordinates yet) ──
  const beyond = {
    space: BEYOND_WORLDS.map(([n, , , , ds]) => ({ world: n, hub: 'space', landings: ds.map(([dn, plots]) => ({ name: dn, plots })) })),
    heaven: { hub: 'divine', room: 'site_prebuilt_heaven_plots', up: { from: 'mtn', plot: 'Grand Stair', name: 'The Stairway, up from Olympus' }, districts: [['The Stairway', 8], ['The Gate', 4], ['The Cloud Fields', 4], ['The City', 4]].map(([name, plots]) => ({ name, plots })), note: 'cloud districts apart above the Vatican, cloud paths between' },
    astral: { hub: 'astral', room: 'site_prebuilt_lookingglass_realm', islands: [['The Sea of Possibility', 16], ['The Library', 10], ['The Nightmare', 10]].map(([name, plots]) => ({ name, plots })), crossings: 2 },
    internet: { plots: 36, state: 'new', way: 'the D.U.M.B.’s server rooms' }, colosseum: { plots: 9, state: 'new', district: 'col' },
    spaceship: { way: 'the Collar, Antarctica (district H)', note: 'the Spaceship stays handmade; it flies between the landings' },
  };
  const islands = ISL.map(z => { const m = { volcano: ['moves', BC, 'The Volcano, The Volcano Island, The Landing, The Village (district O today) grow to 6 x 6'], tri: ['moves', BC, 'district T today (25 plots); the Maelstrom drops to Atlantis'], cove: ['new', null, 'idea'], frozen: ['new', null, 'pack ice round the Pole'] }[z.id];
    const plots = []; for (let y = z.y; y < z.y + z.h; y++) for (let x = z.x; x < z.x + z.w; x++) plots.push([x, y]);
    const row = { id: z.id, name: z.name.replace(/’/g, '’'), state: m[0], x: z.x, y: z.y, w: z.w, h: z.h, count: plots.length, note: m[2], plots }; if (m[1]) row.today = { room: m[1] }; return row; });
  // ── the counts the page states: stop if the extract disagrees with the sheets ──
  const sum = a => a.reduce((n, r) => n + r.plots.length, 0);
  const tot = { routes: sum(routes), links: sum(links), highway: HCELLS.size, underDistricts: under.districts.reduce((n, d) => n + d.count, 0), underWalks: sum(under.walks), islands: islands.reduce((n, z) => n + z.count, 0),
    surfaceDistricts: districts.reduce((n, d) => n + d.count, 0) };
  underground();
  const want = { routes: routeTotal, links: Object.values(TCELLS).reduce((n, v) => n + v.size, 0), underWalks: UGSTATS.walk, underDistricts: UGSTATS.rooms };
  for (const k in want) if (tot[k] !== want[k]) fail(k + ': the extract has ' + tot[k] + ', the sheets ' + want[k]);
  const outp = {
    about: 'One World v13: every walkable plot. Written by `node docs/plans/one-world/gen.js --plots`; never edit by hand. Read docs/plans/one-world/README.md + docs/notes/areas-complexes.md "ONE WORLD, THE ZONE MOVES".',
    v: 13, plot: { squares: 12, metres: 42, square: 3.5 }, coords: 'x east, y south, in plots; Disaster City’s first city plot (north-west corner) = 0,0; a plot [x, y] covers x..x+1, y..y+1',
    disc: { cx: CEN[0], cy: CEN[1], r: RAD }, totals: tot,
    ground: { x0: X0, y0: Y0, w: GW, h: GH, key: gkey, rows: grows, note: 'rows[y - y0][x - x0] = the plot’s ground letter; key[letter].kit = the route kit’s ground kind (forest, scrub, snow, grass, desert, rock)' },
    districts, routes, highway, links, islands, under, beyond,
    scenery: { note: 'not plots: seen past the edges', rivers: RIVERS, places: PLACES.map(([name, x, y, kind]) => ({ name, x, y, kind, idea: true })), ports: PORTS.map(([name, x, y]) => ({ name, x, y })), islets: ISLETS, roundVoyage: LOOP },
  };
  // one row a line, so a diff shows the plot that moved
  const line = v => JSON.stringify(v);
  const arr = (a, ind) => '[\n' + a.map(v => ind + '  ' + line(v)).join(',\n') + '\n' + ind + ']';
  const big = d => { const o = Object.assign({}, d), keep = {}; for (const k of ['plots', 'loose', 'meets']) if (o[k]) { keep[k] = o[k]; delete o[k]; } let t = line(o).slice(0, -1); for (const k in keep) t += ',\n      "' + k + '": ' + arr(keep[k], '      '); return t + '}'; };
  const list = a => '[\n' + a.map(d => '    ' + big(d)).join(',\n') + '\n  ]';
  let t = '{\n';
  for (const k of ['about', 'v', 'plot', 'coords', 'disc', 'totals']) t += '  "' + k + '": ' + line(outp[k]) + ',\n';
  t += '  "ground": {"x0":' + X0 + ',"y0":' + Y0 + ',"w":' + GW + ',"h":' + GH + ',"note":' + line(outp.ground.note) + ',\n    "key": ' + line(gkey) + ',\n    "rows": ' + arr(grows, '    ') + '},\n';
  t += '  "districts": ' + list(districts) + ',\n  "routes": ' + list(routes) + ',\n';
  t += '  "highway": ' + line(Object.assign({}, highway, { legs: undefined })).slice(0, -1) + ',\n    "legs": ' + list(highway.legs).replace(/\n/g, '\n  ') + '},\n';
  t += '  "links": ' + list(links) + ',\n  "islands": ' + list(islands) + ',\n';
  t += '  "under": {\n  "districts": ' + list(under.districts) + ',\n  "walks": ' + list(under.walks) + ',\n  "rides": ' + arr(under.rides, '  ') + ',\n  "ways": ' + arr(under.ways, '  ') + '},\n';
  t += '  "beyond": ' + line(beyond) + ',\n  "scenery": ' + line(outp.scenery) + '\n}\n';
  JSON.parse(t);
  fs.writeFileSync(__dirname + '/plots.json', t);
  console.log('plots.json', JSON.stringify(tot));
}
const out = { closeup: closeup(), terrain: terrainSheet(), travel: travelSheet(), surface: surface(), underground: underground(), section: section(), beyond: beyond() };
fs.writeFileSync(__dirname + '/svgs.json', JSON.stringify(out));
for (const k in out) fs.writeFileSync(__dirname + '/' + k + '.svg', out[k].replace('<svg ', '<svg style="font-family:monospace" '));
console.log('ok');
// data for the page's tables
fs.writeFileSync(__dirname + '/mapdata.json', JSON.stringify({ SURF, ISL, COUNTS, HW: HCELLS.size, UG: UGSTATS, TRAILS: Object.fromEntries(Object.entries(TCELLS).map(([k, v]) => [k, v.size])), DNAME, ZONEOF, ROUTES: ROUTES.map(r => [r[0], r[1], r[3]]), ROADCLASS, PLACES, CEN, RAD, ZOFF: OFF }));
