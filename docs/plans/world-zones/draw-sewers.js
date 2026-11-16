/* THE SEWERS, PLOT PLAN 3 (2026-11-16) — a PROPOSAL for mondo's OK. Nothing here is read by the game.
   `node docs/plans/world-zones/draw-sewers.js` writes, beside itself:
     sewers-layout-3.json     every plot (name, district, depth, what stands on it, the old room it comes from, ways) + the square map
     sewers_plot_plan_3.png   the picture (drawn as an SVG, shot with playwright; without playwright the .svg stays: open it in a browser)
   Plan 3 follows mondo's answer to plan 2 (11-16): "it overall needs to be more labyrinth like ... it doesn't have to be as big as the whole
   city ... the sewers is supposed to be a dungeon. the archetypical representation of a sewer. dark and grimy and scary. there should be wells
   or ropes. the subway station can be connected to / a part of the sewers. It's really meant to be an underground hub zone kinda like door hq,
   so it doesn't have to physically map onto disaster city." So: its own 6 x 4 block, a maze, no tie to the plots above; the Strip and the old
   Cyberpunk doors are dropped ("forget the strip and the old cyberpunk").
   Plan 2 (the L under the city's grid) was drawn by this file's version in PR #1567; its picture and json stay beside this one as history. */
'use strict';
const fs = require('fs'), path = require('path');

const DIST = {
    W: { name: 'The Sewers', col: '#2f6f62', file: 'docs/areas/sewers/districts/W.js', line: 'w' },
    T: { name: 'The Running Tunnels', col: '#4c4f9a', file: 'docs/areas/sewers/districts/T.js', line: 'j' },
    H: { name: 'The Holding Cells', col: '#7d8794', file: 'docs/areas/sewers/districts/H.js', line: 'f' },
    O: { name: 'The Old Workings', col: '#7a5a3c', file: 'docs/areas/sewers/districts/O.js', line: 'o' },
};
const CUL = 'brick culverts that bend and fork: a waded stream down the middle, a dry walkway each side, dead ends';
/* x, y = the plot's place in the 6 x 4 block. L = depth in levels of 1.75 m (0 = the main culverts). ports = walked openings to the next plot.
   j = where the plot's passages meet (plot squares 0..11). r = rooms drawn first, post = drawn last: [x0, y0, x1, y1, ch]. stubs = dead-end side passages. */
const PLOTS = [
    /* row 0 */
    { x: 0, y: 0, d: 'H', L: 1, name: 'The Guardroom', what: 'the Guardroom, the Catwalk over it (2.2 m), the Property Room, three cells', from: 'Holding Cells: THE GUARDROOM · THE CATWALK · THE PROPERTY ROOM', ports: 'E', j: [5, 6], r: [[2, 2, 9, 9, 'f']] },
    { x: 1, y: 0, d: 'H', L: 1, name: 'The Drunk Tank', what: 'three cells, the Drunk Tank and the trap under it, the Vent Stack (3.6 m)', from: 'Holding Cells: SIX CELLS · THE DRUNK TANK · THE VENT STACK', ports: 'WES', j: [6, 6], r: [[2, 2, 9, 8, 'f']] },
    { x: 2, y: 0, d: 'W', L: 0, name: 'The Precinct Drain', what: 'the cross drain behind the cells\' barred door', from: 'Sewers: THE PRECINCT DRAIN', ports: 'WS', stubs: 2 },
    { x: 3, y: 0, d: 'W', L: 0, name: 'The Pumping Station', what: 'the feeder and its stair up to the bulkhead door', from: 'Sewers: THE PUMPING STATION (a door plate)', ports: 'SE', j: [6, 3], r: [[4, 1, 8, 3, 'f']], stubs: 1 },
    { x: 4, y: 0, d: 'W', L: 0, name: 'The Pump Room', what: 'the pumps, running all night', from: 'Sewers: THE PUMP ROOM', ports: 'WE', j: [6, 7], r: [[3, 2, 9, 5, 'f']], stubs: 1 },
    { x: 5, y: 0, d: 'W', L: 1, name: 'The Inspection Gallery', what: 'a gallery 1.6 m up its stair, looking down on the culvert', from: 'Sewers: THE INSPECTION GALLERY', ports: 'WS', j: [7, 5], r: [[8, 2, 10, 8, 'f']] },
    /* row 1 */
    { x: 0, y: 1, d: 'O', L: -3, name: 'The Chimney', what: 'LANDMARK: the shaft (3.9 m); the old portcullis; the Adit up into the culverts', from: 'Old Workings: THE CHIMNEY · THE ADIT', ports: 'ES', j: [5, 6], r: [[2, 3, 8, 8, 'o']] },
    { x: 1, y: 1, d: 'O', L: -3, name: 'The Old Workings', what: 'the flooded mine: the Flood (waded), the Sump (never), the Pump Ledge; the rope ladder up into the tank', from: 'Old Workings: THE FLOOD · THE SUMP · THE PUMP LEDGE', ports: 'NW', j: [6, 5], r: [[2, 2, 10, 10, 'o']], post: [[3, 6, 9, 9, 'w']] },
    { x: 2, y: 1, d: 'W', L: 0, name: 'The Culverts', what: CUL, from: 'Sewers: THE CULVERTS', ports: 'NSE', stubs: 3 },
    { x: 3, y: 1, d: 'W', L: 0, name: 'The Culverts', what: CUL, from: 'Sewers: THE CULVERTS', ports: 'WN', stubs: 3 },
    { x: 4, y: 1, d: 'W', L: 0, name: 'The Cistern', what: 'a round tank of deep water; the Plank across it', from: 'Sewers: THE CISTERN · THE PLANK', ports: 'ES', j: [6, 6], r: [[2, 2, 10, 10, 'f']], post: [[3, 3, 9, 9, 'w'], [6, 3, 6, 9, 'b']] },
    { x: 5, y: 1, d: 'W', L: 0, name: 'The East Return', what: 'the groundsman\'s culvert under the stadium\'s east stand', from: 'Sewers: the stadium door ("the pitch drains into the east return")', ports: 'NW', stubs: 1 },
    /* row 2 */
    { x: 0, y: 2, d: 'W', L: 0, name: 'The Storm Drain', what: 'the grate through to the storm drain under the Woods', from: 'Sewers: the storm drain grate (a door plate)', ports: 'NE', west: 1, stubs: 1 },
    { x: 1, y: 2, d: 'W', L: 0, name: 'The Culverts', what: CUL, from: 'Sewers: THE CULVERTS', ports: 'WE', stubs: 3 },
    { x: 2, y: 2, d: 'W', L: 0, name: 'The Junction', what: 'LANDMARK: where the big pipes meet; the Healing Zone; you arrive here by default', from: 'Sewers: THE JUNCTION', ports: 'NWES', j: [6, 6], r: [[3, 3, 9, 9, 'f']], post: [[5, 5, 7, 7, 'w']] },
    { x: 3, y: 2, d: 'W', L: 0, name: 'The Culverts', what: CUL, from: 'Sewers: THE CULVERTS', ports: 'WE', stubs: 3 },
    { x: 4, y: 2, d: 'W', L: 0, name: 'The Culverts', what: 'bending culverts; the Maintenance Hatch stair down to the track', from: 'Sewers: THE CULVERTS · THE MAINTENANCE HATCH', ports: 'WNES', stubs: 1 },
    { x: 5, y: 2, d: 'W', L: 0, name: 'The Docks\' Outfall', what: 'the shaft up to the drowned manhole on the flooded quay', from: 'Sewers: THE DOCKS\' OUTFALL (a door plate)', ports: 'WS', j: [7, 5], r: [[6, 3, 8, 5, 'f']], stubs: 1 },
    /* row 3 */
    { x: 0, y: 3, d: 'T', L: -2, name: 'The Ghost Station', what: 'a 1 m platform nobody stops at, no stairs up; the track runs on west', from: 'Running Tunnels: THE GHOST STATION', ports: 'E', west: 1, j: [6, 6], r: [[2, 2, 9, 4, 'f']] },
    { x: 1, y: 3, d: 'T', L: -2, name: 'The Loop Line', what: 'the track; the garden well\'s rope comes down here', from: 'Running Tunnels: THE LOOP LINE', ports: 'WE', stubs: 1 },
    { x: 2, y: 3, d: 'T', L: -2, name: 'The Crossing', what: 'two lines cross; the Signal Gantry (5.2 m); the Crossover', from: 'Running Tunnels: THE CROSSING · THE CROSSOVER', ports: 'WEN', j: [6, 6], post: [[6, 7, 6, 10, 'j']] },
    { x: 3, y: 3, d: 'T', L: -2, name: 'The Loop Line', what: 'the track; one way on to the city\'s Platform', from: 'Running Tunnels: THE LOOP LINE', ports: 'WE', south: 1, stubs: 1 },
    { x: 4, y: 3, d: 'T', L: -2, name: 'The Depot', what: 'LANDMARK: two parked trains, one lit; the Maintenance Hatch stair up to the culverts', from: 'Running Tunnels: THE DEPOT · THE MAINTENANCE HATCH', ports: 'WN', j: [6, 6], r: [[1, 3, 10, 9, 'f']], post: [[2, 4, 9, 4, 'j'], [2, 8, 9, 8, 'j']] },
    { x: 5, y: 3, d: 'W', L: -1, name: 'The Outfall', what: 'LANDMARK: the Outfall Shaft (4.4 m); where every gutter pours out', from: 'Sewers: THE OUTFALL · THE OUTFALL SHAFT', ports: 'N', j: [6, 6], r: [[3, 4, 9, 10, 'f']], post: [[4, 5, 8, 9, 'w']] },
];
const COLS = 6, ROWS = 4;
const pid = (x, y) => 'P' + String(x).padStart(2, '0') + '-' + String(y).padStart(2, '0');
const at = {}; for (const p of PLOTS) { p.id = pid(p.x, p.y); at[p.id] = p; }

/* every way out of the zone: all nine are in data.js today. kind: open | hidden (secret in the data) | hq (a DOOR HQ door).
   how = what you climb (the data's own way / leaf / verb). side = where the label goes. */
const WAYS = [
    { plot: 'P03-00', sq: [8.6, 2.4], kind: 'open', to: 'Disaster City: the Pump court', how: 'a stair and a bulkhead door', today: 'door pump <> the city\'s door sewer', side: 'T' },
    { plot: 'P05-02', sq: [7.5, 4.2], kind: 'open', to: 'Disaster City: the Dock edge', how: 'the drowned manhole: a shaft, climb up', today: 'link docks_sewer', side: 'R' },
    { plot: 'P05-01', sq: [9.5, 6.5], kind: 'hidden', to: 'the Stadium (behind the east stand)', how: 'a draught in the wall', today: 'link stadium_sewers', side: 'R' },
    { plot: 'P03-03', sq: [6.5, 10.6], kind: 'open', to: 'the Platform (the city\'s subway station)', how: 'the track', today: 'link tunnels_platform', side: 'B' },
    { plot: 'P01-03', sq: [5, 9.4], kind: 'hq', to: 'DOOR HQ: the Garden well', how: 'a well: the rope', today: 'link well_garden', side: 'B' },
    { plot: 'P00-03', sq: [0.8, 6.5], kind: 'hq', to: 'DOOR HQ: the Tunnel', how: 'the track', today: 'link tunnels_works', side: 'L' },
    { plot: 'P00-02', sq: [0.8, 6.5], kind: 'hidden', to: 'The Woods: the storm drain', how: 'a grate', today: 'link sewers_drain', side: 'L' },
    { plot: 'P00-01', sq: [3, 5.5], kind: 'open', to: 'The Cavern: the Oubliette', how: 'the old portcullis', today: 'link workings_oubliette', side: 'L' },
    { plot: 'P00-00', sq: [2.6, 5.5], kind: 'hq', to: 'DOOR HQ: Room 24601 (the seventh cell)', how: 'a cell door', today: 'link cells_dungeon', side: 'L' },
];
const DROPPED = [
    { to: 'the Strip: the back lane', today: 'link strip_sewer', why: 'mondo 11-16: "forget the strip and the old cyberpunk"' },
    { to: 'Cyberpunk City: the lower street', today: 'link undercity_sewer', why: 'the same' },
];
/* openings between districts inside the one room. `isNew` = not a door in the game today (mine, for the maze: say no and it goes). */
const INNER = [
    { a: 'P01-00', b: 'P02-00', label: 'cell door', old: 'cells.sewers <> sewers.drain' },
    { a: 'P01-00', b: 'P01-01', label: 'trap: a rope ladder', old: 'cells.trap <> workings.trap (hidden)' },
    { a: 'P00-01', b: 'P00-02', label: 'the Adit: a climb', old: 'workings.sewers <> sewers.adit (hidden)' },
    { a: 'P04-02', b: 'P04-03', label: 'Maintenance Hatch: a stair', old: 'tunnels.sewers <> sewers.hatch' },
    { a: 'P02-02', b: 'P02-03', label: 'NEW: a well, a rope down', old: null, isNew: true },
];

/* ---- the square map (72 x 48 squares of 3.5 m; x = solid ground, not dug) ---- */
let seed = 1954; const rnd = () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
const NX = COLS * 12, NY = ROWS * 12, cells = [...Array(NY)].map(() => Array(NX).fill('x'));
const get = (p, x, y) => cells[p.y * 12 + y][p.x * 12 + x];
const put = (p, x, y, ch) => { if (x >= 0 && y >= 0 && x < 12 && y < 12) cells[p.y * 12 + y][p.x * 12 + x] = ch; };
const rect = (p, r) => { for (let y = r[1]; y <= r[3]; y++) for (let x = r[0]; x <= r[2]; x++) put(p, x, y, r[4]); };
for (const p of PLOTS) {
    const line = DIST[p.d].line, mid = [], j = p.j || [ri(3, 8), ri(3, 8)];
    for (const r of p.r || []) rect(p, r);
    const seg = (x0, y0, x1, y1) => { for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) mid.push([x, y]); };
    const route = s => {   // from the port, in a few squares, sideways to the meeting point's line, then to the meeting point
        const a = ri(1, 3);
        if (s === 'N') { seg(6, 0, 6, a); seg(6, a, j[0], a); seg(j[0], a, j[0], j[1]); }
        if (s === 'S') { seg(6, 11, 6, 11 - a); seg(6, 11 - a, j[0], 11 - a); seg(j[0], 11 - a, j[0], j[1]); }
        if (s === 'W') { seg(0, 6, a, 6); seg(a, 6, a, j[1]); seg(a, j[1], j[0], j[1]); }
        if (s === 'E') { seg(11, 6, 11 - a, 6); seg(11 - a, 6, 11 - a, j[1]); seg(11 - a, j[1], j[0], j[1]); }
    };
    for (const s of p.ports) route(s);
    if (p.west) route('W'); if (p.south) route('S');
    for (let i = 0; i < (p.stubs || 0); i++) { const m = mid[ri(0, mid.length - 1)], tx = ri(2, 9), ty = ri(2, 9); if (rnd() < 0.5) { seg(m[0], m[1], tx, m[1]); seg(tx, m[1], tx, ty); } else { seg(m[0], m[1], m[0], ty); seg(m[0], ty, tx, ty); } }
    for (const [x, y] of mid) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const X = x + dx, Y = y + dy; if (X >= 0 && Y >= 0 && X < 12 && Y < 12 && get(p, X, Y) === 'x') put(p, X, Y, line === 'f' ? 'f' : 'o'); }
    for (const [x, y] of mid) put(p, x, y, line);
    for (const r of p.post || []) rect(p, r);
}

/* ---- the json ---- */
const CHANGED = [
    'Its own place: a block of 6 x 4 = 24 plots (252 x 168 m). It no longer lies on the city\'s grid and no door has to stand under its city plot. Plan 2 was 31 plots in an L under the whole city.',
    'A maze, not a line: the plots join by 26 openings that make three rings (the culverts, the cells and the mine, the track), with dead ends at the Guardroom, the Ghost Station and the Outfall. Inside a culvert plot the pipes bend, fork and stop.',
    'A hub: the Junction is the middle, four ways off it. Nine ways lead out, to Disaster City (two), its subway Platform, the stadium, the Woods, the Cavern and DOOR HQ (three).',
    'The subway is part of it: the Running Tunnels are the south row, with the track on to the city\'s Platform and on to DOOR HQ\'s tunnel.',
    'Wells and ropes: the garden well\'s rope, the rope ladder under the Drunk Tank, the climb in the Adit, the shaft up to the drowned manhole. ONE new one is mine: a well with a rope from the Junction down to the Crossing (it closes the track\'s ring).',
    'The Strip\'s gutter and Cyberpunk City\'s gutter are dropped.',
    'Four depths: the cells one level up, the culverts, the track two levels down, the old mine three levels down. You change depth by rope, ladder or stair.',
];
const out = {
    area: 'The Sewers', version: 'plan-3', date: '2026-11-16', status: 'PROPOSAL: waits mondo\'s OK; nothing is built',
    squareMeters: 3.5, plotCells: 12, levelMeters: 1.75,
    frame: 'its own block of 6 x 4 plots; not tied to the city\'s plots (mondo 11-16)',
    room: { cols: COLS, rows: ROWS, dug: PLOTS.length, meters: [COLS * 42, ROWS * 42] },
    look: 'a dungeon: dark, grimy, scary; lit only by the old rooms\' own lights (bare bulbs, cave torches, a brazier, the one lit train)',
    districts: Object.fromEntries(Object.entries(DIST).map(([k, d]) => [k, { name: d.name, plots: PLOTS.filter(p => p.d === k).length, file: d.file }])),
    build: { layout: 'docs/areas/sewers/layout.json', districts: Object.values(DIST).map(d => d.file), tool: 'bake-sewers.js', room: 'one room (id chosen at the build; the four old rooms go in data.js DOOR_HQ.retired)', boardRows: 'one for the tool + shared pieces, one per district' },
    retires: ['site_prebuilt_downtown_sewers', 'site_prebuilt_downtown_tunnels', 'site_prebuilt_downtown_cells', 'site_prebuilt_downtown_workings'],
    changedFromPlan2: CHANGED,
    plots: PLOTS.map(p => ({ id: p.id, name: p.name, district: DIST[p.d].name, level: p.L, what: p.what, from: p.from, ports: [...p.ports].sort(), exits: WAYS.filter(w => w.plot === p.id).map(w => ({ to: w.to, kind: w.kind, how: w.how, today: w.today, square: w.sq })) })),
    waysDropped: DROPPED,
    waysInside: INNER.map(i => ({ between: [i.a, i.b], what: i.label, wasDoors: i.old, new: !!i.isNew })),
    cells: cells.map(r => r.join('')),
    legend: { x: 'solid ground, not dug (cannot walk)', o: 'sewer walkway / mine floor', w: 'water', f: 'concrete room', j: 'rail track', b: 'plank over water' },
};
fs.writeFileSync(path.join(__dirname, 'sewers-layout-3.json'), JSON.stringify(out, null, 1) + '\n');

/* ---- the picture ---- */
const S = 192, c = S / 12, MX = 350, MY = 170, MW = COLS * S, MH = ROWS * S, LEGX = MX + MW + 400, LEGW = 600, Wd = LEGX + LEGW + 30;
const TBY = MY + MH + 120, ROW = 21, Ht = TBY + 56 + PLOTS.length * ROW + 36;
const C = { bg: '#141614', ink: '#f2f2f2', dim: '#a2a9b0', open: '#4ef07a', hidden: '#ff7ad1', hq: '#ffc93a', id: '#ffd75e', isNew: '#59c8ff' };
const GROUND = { o: '#8a867e', w: '#3a74b4', f: '#a4a8aa', j: '#b08a5a', b: '#c9a36a' };
const o = [], esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const txt = (x, y, s, sz = 12, fill = C.ink, w = 400, anchor = 'start', extra = '') => o.push(`<text x="${x}" y="${y}" font-size="${sz}" fill="${fill}" font-weight="${w}" text-anchor="${anchor}" ${extra}>${esc(s)}</text>`);
const wrap = (s, n) => { const r = []; let l = ''; for (const w of s.split(' ')) { if ((l + ' ' + w).trim().length > n) { r.push(l); l = w; } else l = (l + ' ' + w).trim(); } if (l) r.push(l); return r; };
const tw = (s, sz) => s.length * sz * 0.63;
o.push(`<rect width="${Wd}" height="${Ht}" fill="${C.bg}"/>`);
txt(30, 44, 'THE SEWERS  ·  plot plan 3 for your OK  ·  a dungeon maze of 6 x 4 = 24 plots, 252 x 168 m  ·  the hub under Disaster City', 23, C.ink, 700);
txt(30, 70, 'Its own place now: it does not lie on the city\'s grid. Dark, grimy, scary: brick culverts that bend, fork and stop; the cells; the flooded mine; the subway line. The Junction is the middle of the hub.', 13.5, C.dim);
txt(30, 90, 'This is a plan drawing, not the game. Nothing is built. One small square = 3.5 m; one plot = 12 x 12 squares = 42 m. The exact bends inside a plot are a sketch; the build draws them properly.', 13.5, C.dim);

for (const p of PLOTS) {
    const X = MX + p.x * S, Y = MY + p.y * S, d = DIST[p.d];
    o.push(`<rect x="${X}" y="${Y}" width="${S}" height="${S}" fill="#0c0e0d"/>`, `<rect x="${X}" y="${Y}" width="${S}" height="${S}" fill="${d.col}" fill-opacity=".40"/>`);
    for (let y = 0; y < 12; y++) for (let x = 0; x < 12; x++) { const ch = get(p, x, y); if (ch !== 'x') o.push(`<rect x="${X + x * c}" y="${Y + y * c}" width="${c + 0.4}" height="${c + 0.4}" fill="${GROUND[ch]}"/>`); }
    o.push(`<rect x="${X}" y="${Y}" width="${S}" height="${S}" fill="none" stroke="#000" stroke-opacity=".55"/>`);
}
for (const p of PLOTS) {   // a white line where the next plot is another district or the edge
    const X = MX + p.x * S, Y = MY + p.y * S, nb = (dx, dy) => { const q = at[pid(p.x + dx, p.y + dy)]; return q && q.d === p.d; };
    const ln = (x1, y1, x2, y2) => o.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#fff" stroke-width="2.5"/>`);
    if (!nb(0, -1)) ln(X, Y, X + S, Y); if (!nb(0, 1)) ln(X, Y + S, X + S, Y + S); if (!nb(-1, 0)) ln(X, Y, X, Y + S); if (!nb(1, 0)) ln(X + S, Y, X + S, Y + S);
}
const label = (x, y, s, sz, fill, w = 700, anchor = 'start') => o.push(`<text x="${x}" y="${y}" font-size="${sz}" fill="${fill}" font-weight="${w}" text-anchor="${anchor}" stroke="#000" stroke-width="3.5" stroke-opacity=".9" paint-order="stroke">${esc(s)}</text>`);
for (const p of PLOTS) { const X = MX + p.x * S, Y = MY + p.y * S; label(X + 6, Y + 18, p.name, 13.5, C.ink); label(X + 6, Y + 33, `${p.id}  L${p.L}`, 10.5, C.id, 600); }
/* openings between districts */
for (const i of INNER) {
    const a = at[i.a], b = at[i.b], X = MX + ((a.x + b.x) / 2 + 0.5) * S, Y = MY + ((a.y + b.y) / 2 + 0.5) * S, col = i.isNew ? C.isNew : '#fff';
    o.push(`<rect x="${X - 7}" y="${Y - 7}" width="14" height="14" fill="${col}" stroke="#000" stroke-width="1.5" transform="rotate(45 ${X} ${Y})"/>`);
    const w = tw(i.label, 10.5) + 8, lx = a.y === b.y ? X - w / 2 : X + 14, ly = a.y === b.y ? Y + 34 : Y - 14;
    o.push(`<rect x="${lx - 3}" y="${ly - 11}" width="${w}" height="15" fill="#000" fill-opacity=".85" stroke="${col}" stroke-width=".8"/>`); txt(lx + 1, ly + 1, i.label, 10.5, col, 600);
}
/* ways out: the label sits outside the block, on the plot's side */
for (const w of WAYS) {
    const p = at[w.plot], X = MX + p.x * S + w.sq[0] * c, Y = MY + p.y * S + w.sq[1] * c, col = C[w.kind], lw = Math.max(tw(w.to, 12), tw(w.how, 10.5)) + 14;
    let lx, ly, ax, ay;
    if (w.side === 'L') { lx = MX - 22 - lw; ly = Y - 16; ax = lx + lw; ay = ly + 17; }
    if (w.side === 'R') { lx = MX + MW + 22; ly = Y - 16; ax = lx; ay = ly + 17; }
    if (w.side === 'T') { lx = X - lw / 2; ly = MY - 62; ax = X; ay = ly + 34; }
    if (w.side === 'B') { lx = X - lw / 2; ly = MY + MH + 26; ax = X; ay = ly; }
    o.push(`<line x1="${X}" y1="${Y}" x2="${ax}" y2="${ay}" stroke="${col}" stroke-width="1.8"/>`, `<circle cx="${X}" cy="${Y}" r="8.5" fill="${col}" stroke="#000" stroke-width="2"/>`);
    o.push(`<rect x="${lx}" y="${ly}" width="${lw}" height="34" fill="#000" stroke="${col}" stroke-width="1.2"/>`); txt(lx + 7, ly + 14, w.to, 12, col, 700); txt(lx + 7, ly + 28, w.how, 10.5, '#d9dde0');
}
o.push(`<rect x="${MX}" y="${MY}" width="${MW}" height="${MH}" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="1.5"/>`);

/* the legend */
let ly = MY - 60; const LX = LEGX;
const head = s => { txt(LX, ly, s, 14.5, C.ink, 700); ly += 22; };
const para = (s, n = 90, fill = '#d9dde0', sz = 11.8) => { wrap(s, n).forEach(l => { txt(LX, ly, l, sz, fill); ly += 15.5; }); };
const sw = (col, s, extra) => { o.push(`<rect x="${LX}" y="${ly - 11}" width="15" height="13" fill="${col}" stroke="#fff" stroke-opacity=".7"/>`); txt(LX + 24, ly, s, 12); if (extra) txt(LX + 24, ly + 14, extra, 10.5, C.dim); ly += extra ? 34 : 20; };
head('DISTRICTS  (one file each, from the first build PR)');
for (const [k, d] of Object.entries(DIST)) sw(d.col, `${k} · ${d.name}  (${PLOTS.filter(p => p.d === k).length} plots)`, d.file);
txt(LX, ly, 'Shared: docs/areas/sewers/layout.json + bake-sewers.js (the plan, depths, ways out, shell).', 10.5, C.dim); ly += 26;
head('GROUND');
sw(GROUND.o, 'sewer walkway / mine floor'); sw(GROUND.w, 'water (the culverts\' stream is waded; tanks are deep)'); sw(GROUND.f, 'concrete room'); sw(GROUND.j, 'rail track'); sw(GROUND.b, 'plank over water'); sw('#0c0e0d', 'solid ground between the pipes (cannot walk)'); ly += 6;
head('WAYS');
const dot = (col, s) => { o.push(`<circle cx="${LX + 7}" cy="${ly - 4}" r="7" fill="${col}" stroke="#000" stroke-width="2"/>`); txt(LX + 24, ly, s, 12); ly += 20; };
const dia = (col, s) => { o.push(`<rect x="${LX + 1}" y="${ly - 10}" width="11" height="11" fill="${col}" stroke="#000" transform="rotate(45 ${LX + 7} ${ly - 4})"/>`); txt(LX + 24, ly, s, 12); ly += 20; };
dot(C.open, 'way in or out, open (in the game today)'); dot(C.hidden, 'hidden, found later (in the game today)'); dot(C.hq, 'a DOOR HQ door (in the game today)');
dia('#fff', 'was a door between two old rooms; now an opening you walk or climb'); dia(C.isNew, 'NEW, mine: not in the game today (one: the well at the Junction)');
para('Dropped on your word: the Strip\'s gutter and Cyberpunk City\'s gutter.', 90, C.dim, 11); ly += 10;
head('DEPTHS');
para('L = the plot\'s depth in levels of 1.75 m. L0 = the main culverts. The cells are one level up (the precinct\'s basement), the track two down, the old mine three down. Every change of depth is a rope, a ladder or a stair.'); ly += 10;
head('WHAT CHANGED FROM PLAN 2  (the L under the city, 31 plots)');
for (const s of CHANGED) { const ls = wrap(s, 86); ls.forEach((l, i) => { txt(LX + (i ? 12 : 0), ly, (i ? '' : '· ') + l, 11.5, '#d9dde0'); ly += 15; }); ly += 3; }
ly += 8; head('NAMES + WHO LIVES HERE');
para('Every plot name is the game\'s own: a sub-area or a door plate of the four old rooms. Flesheater and Swamp Monster visit (the world plan\'s homes table); the old rooms\' bystanders and their lines move with their spots.');

/* the table */
txt(30, TBY, 'EVERY PLOT  ·  what stands on it  ·  which old room it comes from', 15, C.ink, 700);
const COLX = [30, 106, 330, 372, 1180];
['plot', 'name', 'L', 'what stands on it', 'comes from'].forEach((h, i) => txt(COLX[i], TBY + 26, h, 11, C.dim, 700));
PLOTS.forEach((p, i) => {
    const Y = TBY + 48 + i * ROW;
    if (i % 2 === 0) o.push(`<rect x="22" y="${Y - 14}" width="${Wd - 44}" height="${ROW}" fill="#fff" fill-opacity=".035"/>`);
    o.push(`<rect x="${COLX[0]}" y="${Y - 10}" width="10" height="11" fill="${DIST[p.d].col}" stroke="#fff" stroke-opacity=".6"/>`);
    txt(COLX[0] + 16, Y, p.id, 11.5, C.id); txt(COLX[1], Y, `${p.d} · ${p.name}`, 11.5, C.ink, 600); txt(COLX[2], Y, String(p.L), 11.5); txt(COLX[3], Y, p.what, 11.5); txt(COLX[4], Y, p.from, 11.5, '#cfd4d8');
});
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${Wd}" height="${Ht}" viewBox="0 0 ${Wd} ${Ht}" font-family="DejaVu Sans, Arial, sans-serif">${o.join('')}</svg>`;
const svgPath = path.join(__dirname, 'sewers_plot_plan_3.svg'); fs.writeFileSync(svgPath, svg);
let openings = 0; for (const p of PLOTS) openings += p.ports.length; openings /= 2;
console.log(`sewers plan 3: ${PLOTS.length} plots (${Object.keys(DIST).map(k => k + ' ' + PLOTS.filter(p => p.d === k).length).join(', ')}), ${openings} openings between plots, ${WAYS.length} ways out, ${Wd} x ${Ht}`);
for (const p of PLOTS) for (const s of p.ports) { const q = at[pid(p.x + (s === 'E') - (s === 'W'), p.y + (s === 'S') - (s === 'N'))]; if (!q || !q.ports.includes({ N: 'S', S: 'N', E: 'W', W: 'E' }[s])) console.log('  ONE-SIDED OPENING', p.id, s); }
(async () => {
    let pw; try { pw = require('playwright'); } catch (e) { try { pw = require('/opt/node-tools/node_modules/playwright'); } catch (e2) { console.log('no playwright: open the .svg in a browser and save a PNG'); return; } }
    const b = await pw.chromium.launch(); const pg = await b.newPage({ viewport: { width: Wd, height: Ht } });
    await pg.setContent(`<body style="margin:0;background:${C.bg}">${svg}</body>`); await pg.screenshot({ path: path.join(__dirname, 'sewers_plot_plan_3.png') }); await b.close(); fs.unlinkSync(svgPath);
    console.log('wrote sewers_plot_plan_3.png');
})();
