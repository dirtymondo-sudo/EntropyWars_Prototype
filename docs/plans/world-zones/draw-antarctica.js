/* ANTARCTICA, PLOT PLAN 2 (2026-11-16, second side, the Antarctica zone thread) — the REDESIGN mondo ordered 11-16 ("most of them I want
   completely redesigned/reimagined with plots and districts etc. like we did for disaster city or Camelot"). Built without waiting for his OK
   (his standing order); his word on this picture wins and the zone is reworked.
   `node docs/plans/world-zones/draw-antarctica.js` writes:
     docs/plans/world-zones/antarctica-layout-2.json   every plot (name, district, level, what stands on it, where the name comes from, ways) + the square map
     docs/plans/world-zones/antarctica_plot_plan_2.png the picture (an SVG shot with playwright; without playwright the .svg stays)
     docs/areas/antarctica/layout.json                 the same plan, the copy `bake-antarctica.js` reads
   Plan 1 (4 x 3, one district; antarctica-layout.json + antarctica_plot_plan.png) stays beside it as history.

   THE IDEA: the frozen end of the world, walked from the sea to what is behind the wall. South to north, each row one idea:
     the sea and the shelf ice · the station · the crevasse right across the traverse · the Ice Wall · the hull in the ice behind it.
   Squares: 72 x 72 of 3.5 m (252 m a side), 36 plots of 12 x 12. Square (0,0) is the north-west corner. */
'use strict';
const fs = require('fs'), path = require('path');
const N = 12, G = 6, W = N * G;

const DIST = {
    H: { name: 'The Hull in the Ice', col: '#5d6f8f', file: 'docs/areas/antarctica/districts/H.js' },
    W: { name: 'The Ice Wall', col: '#3f9fc8', file: 'docs/areas/antarctica/districts/W.js' },
    C: { name: 'The Crevasse', col: '#2b4f9a', file: 'docs/areas/antarctica/districts/C.js' },
    S: { name: 'The Station', col: '#c8643c', file: 'docs/areas/antarctica/districts/S.js' },
    O: { name: 'The Polar Openings', col: '#3f9a6a', file: 'docs/areas/antarctica/districts/O.js' },
    F: { name: 'The Shelf Ice', col: '#8fb8c8', file: 'docs/areas/antarctica/districts/F.js' },
};
const MINE = ' (label mine)';
/* x, y = the plot's place. L = its level (1 = 1.75 m over the sea). from = where the name comes from. */
const PLOTS = [
    /* row 0: BEHIND THE WALL */
    { x: 0, y: 0, d: 'H', L: 12, name: 'The Drift', what: 'deep snow in the lee of the wall, a snow cave', from: 'plan 1: The Drift' + MINE },
    { x: 1, y: 0, d: 'H', L: 11, name: 'The Dig Camp' + MINE, what: 'the diggers\' tents, fires and spoil', from: 'The Station: the four tents and the campfires by the hull' },
    { x: 2, y: 0, d: 'H', L: 10, name: 'The Hull in the Ice', what: 'LANDMARK: a ship\'s hull rising out of the ice, the dig trench along it', from: 'The Station: THE HULL IN THE ICE' },
    { x: 3, y: 0, d: 'H', L: 10, name: 'The Collar', what: 'the dock on the hull: the airlock door of the Spaceship', from: 'The Station: THE COLLAR', way: ['The Spaceship: the Airlock', 'open'] },
    { x: 4, y: 0, d: 'H', L: 11, name: 'The Survey Line' + MINE, what: 'the 1947 survey\'s stakes and markers across the buried hull', from: 'The Station: the Man in Black\'s line ("The 1947 survey marked the hull")' },
    { x: 5, y: 0, d: 'H', L: 12, name: 'The Blue Ice' + MINE, what: 'bare blue ice swept clean by the wind, a lookout', from: 'new plot' },
    /* row 1: THE ICE WALL */
    { x: 0, y: 1, d: 'W', L: 11, name: 'The Ice Wall, far west' + MINE, what: 'the wall\'s foot, fallen blocks', from: 'The Station: THE ICE WALL' },
    { x: 1, y: 1, d: 'W', L: 11, name: 'The Ice Wall, west', what: 'the wall\'s foot, the west face', from: 'The Station: THE ICE WALL; plan 1' },
    { x: 2, y: 1, d: 'W', L: 11, name: 'The Gap' + MINE, what: 'the one cut through the wall, two squares wide, a gate post each side', from: 'new plot: the way to what is behind the wall' },
    { x: 3, y: 1, d: 'W', L: 11, name: 'The Ice Wall', what: 'LANDMARK: the wall at the end of the world, 35 m sheer; the watch post under it', from: 'The Station: THE ICE WALL' },
    { x: 4, y: 1, d: 'W', L: 11, name: 'The Ice Wall, east', what: 'the wall\'s foot, the floodlit face', from: 'The Station: THE ICE WALL; plan 1' },
    { x: 5, y: 1, d: 'W', L: 11, name: 'The Ice Wall, far east' + MINE, what: 'the wall\'s foot, the icefall', from: 'The Station: THE ICE WALL' },
    /* row 2: THE CREVASSE */
    { x: 0, y: 2, d: 'C', L: 10, name: 'The Ice Bridge' + MINE, what: 'the west crossing: a bridge of old ice', from: 'new plot' },
    { x: 1, y: 2, d: 'C', L: 10, name: 'The Crevasse, west', what: 'the crack, roped off', from: 'The Station: THE CREVASSE' },
    { x: 2, y: 2, d: 'C', L: 10, name: 'The Plank', what: 'the one way over that the station built', from: 'The Station: "the only way over it is a plank"' },
    { x: 3, y: 2, d: 'C', L: 10, name: 'The Crevasse', what: 'LANDMARK: the crack at its widest, the lowering rig over it', from: 'The Station: THE CREVASSE' },
    { x: 4, y: 2, d: 'C', L: 10, name: 'The Snow Bridge' + MINE, what: 'the east crossing: drifted snow over the crack', from: 'new plot' },
    { x: 5, y: 2, d: 'C', L: 10, name: 'The Crevasse, east', what: 'the crack runs out under the east ridge', from: 'The Station: THE CREVASSE' },
    /* row 3: THE STATION (north) + the openings */
    { x: 0, y: 3, d: 'O', L: 6, name: 'The Admiral\'s Tunnel', what: 'the tunnel mouth in the west ice, down to Agartha', from: 'link antarctica_polar: THE POLAR OPENING · THE ADMIRAL\'S TUNNEL', way: ['The Cavern: Agartha, the Crystal City', 'hidden'] },
    { x: 1, y: 3, d: 'S', L: 6, name: 'The Ice Core', what: 'the drill rig and the core store', from: 'The Station\'s tape: THE ICE CORE' },
    { x: 2, y: 3, d: 'S', L: 6, name: 'The Huts', what: 'LANDMARK: the station\'s huts (walk-in): bunk hut, mess hut, lab', from: 'The Station: THE HUTS' },
    { x: 3, y: 3, d: 'S', L: 6, name: 'The Radio Mast' + MINE, what: 'the mast, the dishes, the radio hut (walk-in)', from: 'The Station: the dishes, the radio, the terminal' },
    { x: 4, y: 3, d: 'S', L: 6, name: 'The Garage' + MINE, what: 'the vehicle shed (walk-in), the truck and the SUV', from: 'The Station: the truck, the SUV' },
    { x: 5, y: 3, d: 'O', L: 6, name: 'The Polar Opening', what: 'warm ice and a hole going down, to the Inner Sun', from: 'link hollow_byrd: THE POLAR OPENING', way: ['The Cavern: the Inner Sun', 'hidden'] },
    /* row 4: THE STATION (south) + the openings' approaches */
    { x: 0, y: 4, d: 'O', L: 4, name: 'The Fuel Drums', what: 'the fuel dump the tunnel starts behind', from: 'link antarctica_polar: "it starts behind the fuel drums on the station\'s west side"' },
    { x: 1, y: 4, d: 'S', L: 4, name: 'The Tank Farm' + MINE, what: 'the five tanks, the generator shed', from: 'The Station: the five tanks, the boiler' },
    { x: 2, y: 4, d: 'S', L: 4, name: 'The Station Yard', what: 'the door of DOOR HQ standing in the snow, sledges, crates, the sign post', from: 'The Station: THE STATION YARD (the bay door, the arena marker)', way: ['DOOR HQ: Bay 3, door 90S', 'hq'] },
    { x: 3, y: 4, d: 'S', L: 4, name: 'The Flag Line', what: 'a line of marker flags down to the shelf', from: 'plan 1: The Flag Line' + MINE },
    { x: 4, y: 4, d: 'S', L: 4, name: 'The Weather Field' + MINE, what: 'instrument masts, the telescope, the balloon shed', from: 'The Station: the brass telescope' },
    { x: 5, y: 4, d: 'O', L: 4, name: 'The East Berm', what: 'the berm the opening is behind', from: 'link hollow_byrd: "the opening is behind the station\'s east berm"' },
    /* row 5: THE SHELF ICE */
    { x: 0, y: 5, d: 'F', L: 1, name: 'The Shelf Ice', what: 'flat ice to the sea', from: 'plan 1: The Shelf Ice' + MINE },
    { x: 1, y: 5, d: 'F', L: 1, name: 'The Seal Beach' + MINE, what: 'seals hauled out on the ice foot', from: 'new plot' },
    { x: 2, y: 5, d: 'F', L: 1, name: 'The Ice Pier' + MINE, what: 'a tongue of ice into the sea where the icebreaker ties up', from: 'the bay door\'s plate: "Customs by icebreaker"' },
    { x: 3, y: 5, d: 'F', L: 1, name: 'The Landing' + MINE, what: 'cargo off the ship: containers, pallets, sledges', from: 'new plot' },
    { x: 4, y: 5, d: 'F', L: 1, name: 'The Floes' + MINE, what: 'broken shelf: floes you walk between leads of open water', from: 'new plot' },
    { x: 5, y: 5, d: 'F', L: 1, name: 'The Calving Face' + MINE, what: 'the shelf\'s broken edge, bergs off it', from: 'new plot' },
];
const pid = (x, y) => 'P0' + x + '-0' + y;
PLOTS.forEach(p => { p.id = pid(p.x, p.y); });

/* ── THE SQUARE MAP ── s snow · i blue ice · p packed track · f timber / steel pad · b plank · x the Ice Wall · r ice ridge · k deep drift · a the crevasse · z the sea · h the hull */
const cell = []; for (let y = 0; y < W; y++) cell.push(new Array(W).fill('s'));
const set = (x, y, ch) => { if (x >= 0 && y >= 0 && x < W && y < W) cell[y][x] = ch; };
const rect = (x0, y0, x1, y1, ch) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y, ch); };
const rnd = (() => { let v = 90 >>> 0; return () => { v = (v * 1664525 + 1013904223) >>> 0; return v / 4294967296; }; })();
const blob = (cx, cy, r, ch, only) => { for (let y = Math.floor(cy - r); y <= cy + r; y++) for (let x = Math.floor(cx - r); x <= cx + r; x++) { const d = Math.hypot(x - cx, (y - cy) * 1.15) + (Math.sin(x * 1.7 + y * 2.3) * 0.5); if (d <= r && (!only || (cell[y] && only.includes(cell[y][x])))) set(x, y, ch); } };

/* the sea and the shelf's edge (south) */
const shore = x => 67.2 + 1.6 * Math.sin(x / 5.3) + 0.9 * Math.sin(x / 2.1 + 1.3);
for (let x = 0; x < W; x++) for (let y = 60; y < W; y++) { if (y >= shore(x)) set(x, y, 'z'); else if (y >= 61) set(x, y, 'i'); }
rect(30, 62, 31, 70, 'i'); rect(29, 68, 32, 70, 'i');                         // The Ice Pier: a tongue two squares wide, a head four wide
blob(52, 68, 2.6, 'i', 'z'); blob(57, 69, 2.2, 'i', 'z'); blob(49, 70, 1.6, 'i', 'z'); set(54, 67, 'i'); set(55, 68, 'i'); set(50, 69, 'i'); set(51, 69, 'i');   // The Floes, joined by necks
blob(53, 64, 1.2, 'z'); blob(58, 65, 1.4, 'z'); rect(55, 63, 55, 65, 'z');                                                              // leads of open water in the shelf
blob(66, 66, 2.4, 'z'); blob(63, 68.5, 1.5, 'i', 'z');                                                                                     // The Calving Face: a bite out of the shelf, a berg off it
/* the Ice Wall and the Gap */
rect(0, 12, W - 1, 17, 'x'); rect(30, 12, 31, 17, 'i');
for (let x = 0; x < W; x++) { const j = Math.round(0.9 * Math.sin(x / 4.1) + 0.6 * Math.sin(x / 1.9 + 2)); if (j > 0 && !(x >= 28 && x <= 33)) set(x, 18, 'x'); if (j < 0 && !(x >= 28 && x <= 33)) set(x, 11, 'x'); }   // the faces step in and out
/* the crevasse, right across */
const crack = x => 29.6 + 1.7 * Math.sin(x / 7.0) + 0.9 * Math.sin(x / 3.1 + 1);
for (let x = 1; x < W - 1; x++) { const c = crack(x), wide = (x >= 38 && x <= 46) ? 2.4 : 1.5; for (let y = 24; y < 36; y++) if (Math.abs(y - c) <= wide) set(x, y, 'a'); }
const cross = (x0, ch) => { for (let y = 24; y < 36; y++) for (const x of [x0, x0 + 1]) if (cell[y][x] === 'a') set(x, y, ch); };
cross(30, 'b'); cross(8, 'i'); cross(55, 's');
/* the rim: ridges west, east and north (the land past them is the range) */
rect(0, 0, W - 1, 0, 'r'); for (let y = 0; y < 66; y++) { if (cell[y][0] !== 'x') set(0, y, 'r'); if (cell[y][W - 1] !== 'x') set(W - 1, y, 'r'); }
for (let y = 1; y < 62; y++) { if (cell[y][1] === 's' && Math.sin(y / 3.3) > 0.2) set(1, y, 'r'); if (cell[y][W - 2] === 's' && Math.sin(y / 2.9 + 1) > 0.2) set(W - 2, y, 'r'); }
/* BEHIND THE WALL: the hull (north middle), the drifts in the corners */
rect(26, 1, 45, 4, 'h'); rect(36, 0, 37, 5, 'f'); rect(26, 5, 45, 6, 'f');     // the hull, the dig trench along it (steel plates), the collar's slot
blob(4, 3, 3.2, 'k', 's'); blob(9, 8, 1.8, 'k', 's'); blob(66, 3, 2.6, 'r', 's'); blob(60, 8, 1.6, 'r', 's'); blob(18, 2, 1.8, 'r', 's'); blob(52, 2.5, 1.6, 'r', 's');
rect(61, 4, 66, 8, 'i');                                                       // The Blue Ice
/* THE STATION: the berms that part it from the openings, the pads, the tracks */
for (let y = 37; y < 60; y++) { if (!(y >= 46 && y <= 49)) { set(11, y, 'r'); if (Math.sin(y / 2.3) > -0.2) set(12, y, 'r'); set(60, y, 'r'); if (Math.sin(y / 2.7 + 2) > -0.2) set(59, y, 'r'); } }
blob(20, 42, 1.5, 'r', 's'); blob(43, 53, 1.4, 'r', 's'); blob(17, 56, 1.6, 'r', 's'); blob(52, 39, 1.3, 'r', 's'); blob(40, 44, 1.1, 'r', 's');
blob(5, 40, 2.2, 'r', 's'); blob(4, 54, 1.8, 'r', 's'); blob(66, 43, 2.0, 'r', 's'); blob(67, 55, 1.8, 'r', 's');
blob(15, 21.5, 1.3, 'r', 's'); blob(47, 22, 1.2, 'r', 's'); blob(63, 21, 1.5, 'r', 's'); blob(22, 33.5, 1.2, 'r', 's'); blob(62, 34, 1.3, 'r', 's'); blob(14, 64, 1.3, 'r', 'i'); blob(40, 63.5, 1.1, 'r', 'i'); blob(7, 63, 1.2, 'r', 'i');
rect(64, 38, 67, 41, 'i');                                                     // The Polar Opening: warm, bare ice round the hole
const track = (x0, y0, x1, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if ('sikr'.includes(cell[y][x])) set(x, y, 'p'); };
track(30, 6, 31, 61);                                                          // the Traverse: the pier, the yard, the Plank, the Gap, the hull
track(2, 47, 69, 48);                                                          // the station's cross track, berm to berm and on to the openings
track(2, 20, 69, 21);                                                          // the track along the wall's foot
track(8, 22, 9, 46); track(55, 22, 56, 46);                                    // up to the two other crossings
track(14, 7, 57, 8);                                                           // behind the wall, along the dig
track(3, 39, 4, 46); track(65, 42, 66, 46);                                    // to the tunnel mouth, to the opening
track(42, 49, 43, 61); track(18, 49, 19, 61);                                  // the Flag Line, the seal track
cross(30, 'b');
const PADS = [[21, 38, 28, 44], [33, 38, 40, 43], [45, 38, 52, 44], [14, 38, 18, 43], [14, 51, 22, 56], [46, 51, 51, 55], [26, 51, 35, 57], [15, 9, 22, 10]];
PADS.forEach(q => { for (let y = q[1]; y <= q[3]; y++) for (let x = q[0]; x <= q[2]; x++) if ('sr'.includes(cell[y][x])) set(x, y, 'f'); });

/* every plot's ports: the sides it is walked out of */
const MASS = 'xrkazh', open = (x, y) => x >= 0 && y >= 0 && x < W && y < W && !MASS.includes(cell[y][x]);
PLOTS.forEach(p => { const x0 = p.x * N, y0 = p.y * N, s = [];
    for (let i = 0; i < N; i++) { if (p.y > 0 && open(x0 + i, y0) && open(x0 + i, y0 - 1) && !s.includes('N')) s.push('N'); if (p.y < G - 1 && open(x0 + i, y0 + N - 1) && open(x0 + i, y0 + N) && !s.includes('S')) s.push('S');
        if (p.x > 0 && open(x0, y0 + i) && open(x0 - 1, y0 + i) && !s.includes('W')) s.push('W'); if (p.x < G - 1 && open(x0 + N - 1, y0 + i) && open(x0 + N, y0 + i) && !s.includes('E')) s.push('E'); }
    p.ports = s; });
/* check: every plot is walked to from the Station Yard */
{ const seen = new Uint8Array(W * W), st = [[30, 54]]; seen[54 * W + 30] = 1;
  while (st.length) { const [x, y] = st.pop(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + dx, Y = y + dy; if (open(X, Y) && !seen[Y * W + X]) { seen[Y * W + X] = 1; st.push([X, Y]); } } }
  const cold = PLOTS.filter(p => { for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (seen[(p.y * N + y) * W + p.x * N + x]) return false; return true; });
  let un = 0; for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) if (open(x, y) && !seen[y * W + x]) un++;
  console.log('plots not reached: ' + (cold.map(p => p.id).join(' ') || 'none') + ' · open squares not reached: ' + un); }

const LEGEND = { s: 'snow', i: 'blue ice', p: 'packed track', f: 'timber / steel pad', b: 'plank over the crevasse', x: 'the Ice Wall (cannot walk; 35 m)', r: 'ice ridge (cannot walk)', k: 'deep drift (cannot walk)', a: 'the crevasse (a drop)', z: 'the sea', h: 'the hull (cannot walk)' };
const WAYS = [
    { plot: 'P03-00', sq: [0.5, 0], side: 'T', kind: 'open', to: 'THE SPACESHIP · the Airlock', how: 'the collar on the hull (link antarctica_derelict)' },
    { plot: 'P00-03', sq: [0, 3.5], side: 'L', kind: 'hidden', to: 'THE CAVERN · Agartha', how: 'the Admiral\'s Tunnel (link antarctica_polar)' },
    { plot: 'P05-03', sq: [12, 4.5], side: 'R', kind: 'hidden', to: 'THE CAVERN · the Inner Sun', how: 'the Polar Opening (link hollow_byrd)' },
    { plot: 'P02-04', sq: [6.5, 5.5], side: 'B', kind: 'hq', to: 'DOOR HQ · Bay 3', how: 'door 90S, standing in the Station Yard' },
];
const layout = { area: 'Antarctica', version: 'plan-2', approved: 'not yet seen by mondo (built on his 11-16 standing order; his word wins)', squareMeters: 3.5, plotCells: N, cols: G, rows: G, levelMeters: 1.75,
    districts: Object.fromEntries(Object.entries(DIST).map(([k, d]) => [k, d.name])), legend: LEGEND,
    rooms: [{ room: 'Antarctica', cols: G, rows: G, plots: PLOTS.map(p => ({ id: p.id, name: p.name, district: DIST[p.d].name, d: p.d, level: p.L, what: p.what, from: p.from, ports: p.ports, exit: p.way || null })), cells: cell.map(r => r.join('')) }],
    ways: WAYS };
const out = JSON.stringify(layout, null, 0).replace(/\{"id"/g, '\n{"id"').replace(/"cells":\[/, '\n"cells":[\n').replace(/","(?=[a-z]{72})/g, '",\n"') + '\n';
fs.writeFileSync(path.join(__dirname, 'antarctica-layout-2.json'), out);
fs.mkdirSync(path.join(__dirname, '../../areas/antarctica/districts'), { recursive: true });
fs.writeFileSync(path.join(__dirname, '../../areas/antarctica/layout.json'), out);

/* ── THE PICTURE ── */
const C = { bg: '#0d1218', ink: '#f2f5f8', dim: '#9aa6b2', id: '#c9d3dc', open: '#ffd24a', hidden: '#c58cff', hq: '#ff8a5c' };
const GROUND = { s: '#eef3f7', i: '#a9d8ee', p: '#cfd6dc', f: '#a87f55', b: '#6b4a2c', x: '#2f86b8', r: '#7fb4d0', k: '#dfe6ee', a: '#0f1d3a', z: '#1d4a66', h: '#2b2f38' };
const S = 150, c = S / N, MX = 330, MY = 160, MW = G * S, MH = G * S, LEGX = MX + MW + 250, Wd = LEGX + 640, TBY = MY + MH + 120, ROW = 19, Ht = TBY + 60 + PLOTS.length * ROW + 30;
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const o = [], txt = (x, y, s, sz = 12, fill = C.ink, w = 400) => o.push(`<text x="${x}" y="${y}" font-size="${sz}" fill="${fill}" font-weight="${w}">${esc(s)}</text>`);
const tw = (s, sz) => s.length * sz * 0.58;
const wrap = (s, n) => { const ws = s.split(' '), ls = []; let l = ''; ws.forEach(w => { if ((l + ' ' + w).length > n) { ls.push(l); l = w; } else l = l ? l + ' ' + w : w; }); if (l) ls.push(l); return ls; };
txt(30, 44, 'ANTARCTICA · PLOT PLAN 2 · the redesign (36 plots, six districts)', 24, C.ink, 700);
txt(30, 70, 'North is up. One square = 3.5 m, one plot = 12 x 12 squares, the zone = 252 m a side. L = level (1.75 m each) over the sea: the land climbs from the shelf (L1) to the foot of the wall (L11). Not yet seen by mondo: built on his 11-16 order, reworked on his word.', 12.5, C.dim);
for (const p of PLOTS) { const X = MX + p.x * S, Y = MY + p.y * S;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) o.push(`<rect x="${X + x * c}" y="${Y + y * c}" width="${c + 0.4}" height="${c + 0.4}" fill="${GROUND[cell[p.y * N + y][p.x * N + x]]}"/>`);
    o.push(`<rect x="${X}" y="${Y}" width="${S}" height="${S}" fill="${DIST[p.d].col}" fill-opacity=".16"/>`, `<rect x="${X}" y="${Y}" width="${S}" height="${S}" fill="none" stroke="#000" stroke-opacity=".45"/>`); }
const at = {}; PLOTS.forEach(p => { at[p.id] = p; });
for (const p of PLOTS) { const X = MX + p.x * S, Y = MY + p.y * S, nb = (dx, dy) => { const q = at[pid(p.x + dx, p.y + dy)]; return q && q.d === p.d; };
    const ln = (x1, y1, x2, y2) => o.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${DIST[p.d].col}" stroke-width="4"/>`, `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#000" stroke-width="1"/>`);
    if (!nb(0, -1)) ln(X, Y, X + S, Y); if (!nb(0, 1)) ln(X, Y + S, X + S, Y + S); if (!nb(-1, 0)) ln(X, Y, X, Y + S); if (!nb(1, 0)) ln(X + S, Y, X + S, Y + S); }
const label = (x, y, s, sz, fill, w = 700) => o.push(`<text x="${x}" y="${y}" font-size="${sz}" fill="${fill}" font-weight="${w}" stroke="#000" stroke-width="3.5" stroke-opacity=".9" paint-order="stroke">${esc(s)}</text>`);
for (const p of PLOTS) { const X = MX + p.x * S, Y = MY + p.y * S, ls = wrap(p.name.replace(MINE, ''), 19); ls.forEach((l, i) => label(X + 6, Y + 18 + i * 15, l, 12.5, C.ink)); label(X + 6, Y + 20 + ls.length * 15, `${p.d} · ${p.id} · L${p.L}`, 10, C.id, 600); }
for (const w of WAYS) { const p = at[w.plot], X = MX + p.x * S + w.sq[0] * c, Y = MY + p.y * S + w.sq[1] * c, col = C[w.kind], lw = Math.max(tw(w.to, 12), tw(w.how, 10.5)) + 14; let lx, ly, ax, ay;
    if (w.side === 'L') { lx = MX - 22 - lw; ly = Y - 16; ax = lx + lw; ay = ly + 17; } if (w.side === 'R') { lx = MX + MW + 22; ly = Y - 16; ax = lx; ay = ly + 17; }
    if (w.side === 'T') { lx = X - lw / 2; ly = MY - 62; ax = X; ay = ly + 34; } if (w.side === 'B') { lx = X - lw / 2 + 170; ly = MY + MH + 26; ax = lx + 20; ay = ly; }
    o.push(`<line x1="${X}" y1="${Y}" x2="${ax}" y2="${ay}" stroke="${col}" stroke-width="1.8"/>`, `<circle cx="${X}" cy="${Y}" r="8.5" fill="${col}" stroke="#000" stroke-width="2"/>`, `<rect x="${lx}" y="${ly}" width="${lw}" height="34" fill="#000" stroke="${col}" stroke-width="1.2"/>`);
    txt(lx + 7, ly + 14, w.to, 12, col, 700); txt(lx + 7, ly + 28, w.how, 10.5, '#d9dde0'); }
o.push(`<rect x="${MX}" y="${MY}" width="${MW}" height="${MH}" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="1.5"/>`);
txt(MX - 4, MY + MH + 92, 'past the west, north and east lines: the range (mountains with snow)   ·   past the south line: the open sea', 11.5, C.dim);
let ly = MY - 40; const LX = LEGX;
const head = s => { txt(LX, ly, s, 14.5, C.ink, 700); ly += 22; };
const para = (s, n = 88, fill = '#d9dde0', sz = 11.8) => { wrap(s, n).forEach(l => { txt(LX, ly, l, sz, fill); ly += 15.5; }); };
const sw = (col, s, extra) => { o.push(`<rect x="${LX}" y="${ly - 11}" width="15" height="13" fill="${col}" stroke="#fff" stroke-opacity=".7"/>`); txt(LX + 24, ly, s, 12); if (extra) txt(LX + 24, ly + 14, extra, 10.5, C.dim); ly += extra ? 34 : 20; };
head('DISTRICTS  (one file each)');
for (const [k, d] of Object.entries(DIST)) sw(d.col, `${k} · ${d.name}  (${PLOTS.filter(p => p.d === k).length} plots)`, d.file);
txt(LX, ly, 'Shared: docs/areas/antarctica/layout.json + bake-antarctica.js (plan, heights, ways out, sky).', 10.5, C.dim); ly += 26;
head('GROUND'); Object.keys(LEGEND).forEach(k => sw(GROUND[k], LEGEND[k])); ly += 6;
head('WAYS  (all four are in the game today; none is new)');
const dot = (col, s) => { o.push(`<circle cx="${LX + 7}" cy="${ly - 4}" r="7" fill="${col}" stroke="#000" stroke-width="2"/>`); txt(LX + 24, ly, s, 12); ly += 20; };
dot(C.open, 'open'); dot(C.hidden, 'hidden, found later'); dot(C.hq, 'a DOOR HQ door'); ly += 8;
head('WHAT CHANGED FROM PLAN 1  (4 x 3, one district)');
['A zone of its own size: 36 plots in six districts (plan 1: 12 plots, one district). Each row is one idea, so you always know how far south you are.',
 'The Ice Wall is a real wall right across the zone, 35 m sheer, with ONE cut through it (the Gap). Plan 1 had it as three plots on the north edge.',
 'What is behind the wall is the hull: the Spaceship\'s collar moved from the station to the far side of the wall, the last thing you reach.',
 'The crevasse runs across the whole traverse (the old room\'s own idea) with three crossings: the Plank, an ice bridge, a snow bridge.',
 'The two ways down (the Admiral\'s Tunnel, the Polar Opening) stand where their own text puts them: behind the fuel drums west of the station, behind the east berm.',
 'New: the shelf ice and the sea on the south side (pier, landing, seals, floes). No front door of DOOR HQ, no reveal, no story gate: built like any zone.',
].forEach(s => { wrap(s, 86).forEach((l, i) => { txt(LX + (i ? 12 : 0), ly, (i ? '' : '· ') + l, 11.5, '#d9dde0'); ly += 15; }); ly += 3; });
ly += 8; head('NAMES + WHO LIVES HERE');
para('Names with "(label mine)" in the table are plain labels, yours to rename; the others are the old room\'s own words. Nordic, Yeti and Kaiju have Antarctica as their point of entry; the old room\'s Yeti and two Men in Black keep their lines.');
txt(30, TBY, 'EVERY PLOT  ·  what stands on it  ·  where the name comes from', 15, C.ink, 700);
const COLX = [30, 106, 356, 392, 1010];
['plot', 'name', 'L', 'what stands on it', 'comes from'].forEach((h, i) => txt(COLX[i], TBY + 26, h, 11, C.dim, 700));
PLOTS.forEach((p, i) => { const Y = TBY + 48 + i * ROW; if (i % 2 === 0) o.push(`<rect x="22" y="${Y - 14}" width="${Wd - 44}" height="${ROW}" fill="#fff" fill-opacity=".035"/>`);
    o.push(`<rect x="${COLX[0]}" y="${Y - 10}" width="10" height="11" fill="${DIST[p.d].col}" stroke="#fff" stroke-opacity=".6"/>`);
    txt(COLX[0] + 16, Y, p.id, 11.5, C.id); txt(COLX[1], Y, `${p.d} · ${p.name}`, 11.5, C.ink, 600); txt(COLX[2], Y, String(p.L), 11.5); txt(COLX[3], Y, p.what, 11.5); txt(COLX[4], Y, p.from, 11.5, '#cfd4d8'); });
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${Wd}" height="${Ht}" viewBox="0 0 ${Wd} ${Ht}" font-family="DejaVu Sans, Arial, sans-serif">${o.join('')}</svg>`;
const svgPath = path.join(__dirname, 'antarctica_plot_plan_2.svg'); fs.writeFileSync(svgPath, svg);
console.log(`antarctica plan 2: ${PLOTS.length} plots (${Object.keys(DIST).map(k => k + ' ' + PLOTS.filter(p => p.d === k).length).join(', ')}), ${Wd} x ${Ht}`);
(async () => {
    let pw; try { pw = require('playwright'); } catch (e) { try { pw = require('/opt/node-tools/node_modules/playwright'); } catch (e2) { console.log('no playwright: open the .svg in a browser and save a PNG'); return; } }
    const exe = '/opt/pw-browsers/chromium'; const b = await pw.chromium.launch(fs.existsSync(exe) ? { executablePath: exe, args: ['--headless', '--no-sandbox'] } : {});
    const pg = await b.newPage({ viewport: { width: Wd, height: Ht } });
    await pg.setContent(`<body style="margin:0;background:${C.bg}">${svg}</body>`); await pg.screenshot({ path: path.join(__dirname, 'antarctica_plot_plan_2.png') }); await b.close(); fs.unlinkSync(svgPath);
    console.log('wrote antarctica_plot_plan_2.png');
})();
