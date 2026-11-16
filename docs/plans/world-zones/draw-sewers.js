/* THE SEWERS, PLOT PLAN 2 (2026-11-16) — a PROPOSAL for mondo's OK. Nothing here is read by the game.
   `node docs/plans/world-zones/draw-sewers.js` writes, beside itself:
     sewers-layout-2.json     every plot (name, district, height, what stands on it, the old room it comes from, ways) + the square map
     sewers_plot_plan_2.png   the picture (drawn as an SVG, shot with playwright; without playwright the .svg stays: open it in a browser)
   It READS the built city (docs/disaster-city/city-layout.json, move.js, levels.js) so the faint outline over the plan is the city as it
   stands after THE DISTRICT MOVE, never a copy. It changes nothing there.
   The frame: the Sewers use the city's own 12 x 12 plot grid. Sewer plot Pcc-rr lies under the city plot STANDING at column cc, row rr. */
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', '..', '..');
const city = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/disaster-city/city-layout.json'), 'utf8'));
const move = require(path.join(ROOT, 'docs/disaster-city/move.js'));
const levels = require(path.join(ROOT, 'docs/disaster-city/levels.js'));

/* ---- the city as it stands ---- */
const cdist = {}; for (const d of city.districts) cdist[d.id] = d;
const above = [...Array(12)].map(() => Array(12));
for (const p of city.plots) { const d = cdist[p.d], t = move.to[p.d]; above[t[1] * 4 + p.y - d.gy * 4][t[0] * 4 + p.x - d.gx * 4] = p; }
const CITY_NAME = { R: 'SOUTHSIDE', C: 'CIVIC CENTER', F: 'FINANCIAL', U: 'UNIVERSITY', H: 'HERO PLAZA', E: 'ENTERTAINMENT', I: 'INDUSTRIAL', S: 'SPORTS + CULTURE', B: 'BAYSIDE' };

/* ---- the plan ---- */
const DIST = {
    W: { name: 'The Sewers', col: '#2f6f62', off: -3, file: 'docs/areas/sewers/districts/W.js' },
    T: { name: 'The Running Tunnels', col: '#4c4f9a', off: -5, file: 'docs/areas/sewers/districts/T.js' },
    H: { name: 'The Holding Cells', col: '#7d8794', off: -2, file: 'docs/areas/sewers/districts/H.js' },
    O: { name: 'The Old Workings', col: '#7a5a3c', off: -6, file: 'docs/areas/sewers/districts/O.js' },
};
const CUL = 'brick culvert: a waded stream down the middle, a dry walkway each side';
/* x, y = the city place it lies under. ports = walked openings to the next plot. r = rooms drawn on the square map [x0,y0,x1,y1,ch] (plot squares 0..11). */
const PLOTS = [
    /* H · The Holding Cells (the precinct basement) */
    { x: 0, y: 2, d: 'H', name: 'The Guardroom', what: 'the Guardroom, the Catwalk over it (2.2 m), the Property Room, three cells', from: 'Holding Cells: THE GUARDROOM · THE CATWALK · THE PROPERTY ROOM', ports: 'E', r: [[2, 2, 10, 9, 'f']] },
    { x: 1, y: 2, d: 'H', name: 'The Drunk Tank', what: 'three cells, the Drunk Tank (the trap under it), the Vent Stack (3.6 m)', from: 'Holding Cells: SIX CELLS · THE DRUNK TANK · THE VENT STACK', ports: 'WES', r: [[1, 2, 9, 9, 'f']] },
    /* O · The Old Workings (the mine under the precinct) */
    { x: 1, y: 3, d: 'O', name: 'The Old Workings', what: 'the flooded mine: the Flood (waded), the Sump (never), the Pump Ledge; the rope ladder up into the tank', from: 'Old Workings: THE FLOOD · THE PUMP LEDGE', ports: 'NE', r: [[1, 2, 10, 10, 'o']], post: [[3, 6, 8, 9, 'w']] },
    { x: 2, y: 3, d: 'O', name: 'The Chimney', what: 'LANDMARK: the shaft (3.9 m); the old portcullis; the Adit up into the culverts', from: 'Old Workings: THE CHIMNEY', ports: 'WN', r: [[2, 3, 9, 9, 'o']] },
    /* T · The Running Tunnels */
    { x: 0, y: 3, d: 'T', name: 'The Loop Line', what: 'the track: one way on to the city\'s Platform, one way on to DOOR HQ\'s tunnel', from: 'Running Tunnels: THE LOOP LINE', ports: 'S', west: 'j', r: [] },
    { x: 0, y: 4, d: 'T', name: 'The Ghost Station', what: 'a 1 m platform nobody stops at; the garden well\'s rope comes down here', from: 'Running Tunnels: THE GHOST STATION', ports: 'NS', r: [[8, 2, 10, 9, 'f']] },
    { x: 0, y: 5, d: 'T', name: 'The Crossing', what: 'two lines cross; the Signal Gantry (5.2 m); the Crossover', from: 'Running Tunnels: THE CROSSING · THE CROSSOVER', ports: 'NS', r: [], post: [[2, 5, 10, 6, 'j']] },
    { x: 0, y: 6, d: 'T', name: 'The Depot', what: 'LANDMARK: two parked trains, one lit; the Maintenance Hatch stair up to the culverts', from: 'Running Tunnels: THE DEPOT · THE MAINTENANCE HATCH', ports: 'NS', r: [[1, 2, 10, 9, 'f']], post: [[2, 3, 2, 8, 'j'], [9, 3, 9, 8, 'j']] },
    /* W · The Sewers: the north end */
    { x: 2, y: 2, d: 'W', name: 'The Precinct Drain', what: 'the cross drain behind the cells\' barred door; the Adit down into the old mine', from: 'Sewers: THE PRECINCT DRAIN · THE ADIT', ports: 'WES', r: [] },
    { x: 3, y: 2, d: 'W', name: 'The Culverts', what: CUL, from: 'Sewers: THE CULVERTS', ports: 'WS', r: [] },
    { x: 3, y: 3, d: 'W', name: 'The Inspection Gallery', what: 'a gallery 1.6 m up its stair, over the culvert', from: 'Sewers: THE INSPECTION GALLERY', ports: 'NS', r: [[8, 3, 10, 8, 'f']] },
    /* under the west avenue */
    { x: 3, y: 4, d: 'W', name: 'The Culverts', what: CUL, from: 'Sewers: THE CULVERTS', ports: 'NS', r: [] },
    { x: 3, y: 5, d: 'W', name: 'The Undercity\'s Gutter', what: 'culvert; the grate up to Cyberpunk City\'s lower street', from: 'Sewers: THE UNDERCITY\'S GUTTER (a door plate)', ports: 'NS', r: [[8, 5, 9, 7, 'f']] },
    { x: 3, y: 6, d: 'W', name: 'The Culverts', what: CUL, from: 'Sewers: THE CULVERTS', ports: 'NS', r: [] },
    { x: 3, y: 7, d: 'W', name: 'The Junction', what: 'LANDMARK: where the big pipes meet; the Healing Zone; you arrive here by default', from: 'Sewers: THE JUNCTION', ports: 'NWS', r: [[3, 3, 9, 9, 'f']], post: [[5, 5, 7, 7, 'w']] },
    /* the west spur under the cross street */
    { x: 2, y: 7, d: 'W', name: 'The Culverts', what: CUL, from: 'Sewers: THE CULVERTS', ports: 'WE', r: [] },
    { x: 1, y: 7, d: 'W', name: 'The Culverts', what: CUL, from: 'Sewers: THE CULVERTS', ports: 'WE', r: [] },
    { x: 0, y: 7, d: 'W', name: 'The Storm Drain', what: 'the grate through to the storm drain under the Woods; the Strip\'s gutter; the hatch stair down to the track', from: 'Sewers: the storm drain grate · THE STRIP\'S GUTTER (door plates)', ports: 'EN', west: 'w', r: [] },
    /* down the avenue to the south street */
    { x: 3, y: 8, d: 'W', name: 'The Culverts', what: CUL, from: 'Sewers: THE CULVERTS', ports: 'NS', r: [] },
    { x: 3, y: 9, d: 'W', name: 'The Culverts', what: CUL, from: 'Sewers: THE CULVERTS', ports: 'NS', r: [] },
    { x: 3, y: 10, d: 'W', name: 'The Culverts', what: CUL, from: 'Sewers: THE CULVERTS', ports: 'NS', r: [] },
    { x: 3, y: 11, d: 'W', name: 'The Culverts', what: CUL + '; the bend east', from: 'Sewers: THE CULVERTS', ports: 'NE', r: [] },
    { x: 4, y: 11, d: 'W', name: 'The Culverts', what: CUL, from: 'Sewers: THE CULVERTS', ports: 'WE', r: [] },
    { x: 5, y: 11, d: 'W', name: 'The Cistern', what: 'a round tank of deep water; the Plank across it', from: 'Sewers: THE CISTERN · THE PLANK', ports: 'WEN', r: [[3, 2, 9, 9, 'f']], post: [[4, 3, 8, 8, 'w'], [6, 3, 6, 8, 'b']] },
    { x: 5, y: 10, d: 'W', name: 'The East Return', what: 'the groundsman\'s culvert under the stadium\'s east stand', from: 'Sewers: the stadium door ("the pitch drains into the east return")', ports: 'S', r: [[4, 3, 8, 6, 'f']] },
    { x: 6, y: 11, d: 'W', name: 'The Culverts', what: CUL, from: 'Sewers: THE CULVERTS', ports: 'WE', r: [] },
    { x: 7, y: 11, d: 'W', name: 'The Culverts', what: CUL, from: 'Sewers: THE CULVERTS', ports: 'WE', r: [] },
    { x: 8, y: 11, d: 'W', name: 'The Docks\' Outfall', what: 'the grate up to the drowned manhole on the flooded quay', from: 'Sewers: THE DOCKS\' OUTFALL (a door plate)', ports: 'WE', r: [[5, 3, 7, 4, 'f']] },
    { x: 9, y: 11, d: 'W', name: 'The Pump Room', what: 'the pumps, running all night', from: 'Sewers: THE PUMP ROOM', ports: 'WE', r: [[3, 1, 9, 4, 'f']] },
    { x: 10, y: 11, d: 'W', name: 'The Pumping Station', what: 'the feeder and its stair up to the bulkhead door', from: 'Sewers: THE PUMPING STATION (a door plate)', ports: 'WE', south: 'o', r: [] },
    { x: 11, y: 11, d: 'W', name: 'The Outfall', what: 'LANDMARK: the Outfall Shaft (4.4 m); where every gutter pours out to the bay', from: 'Sewers: THE OUTFALL · THE OUTFALL SHAFT', ports: 'W', east: 'w', r: [[4, 3, 9, 9, 'f']], post: [[5, 4, 8, 8, 'w']] },
];
const pid = (x, y) => 'P' + String(x).padStart(2, '0') + '-' + String(y).padStart(2, '0');
const at = {}; for (const p of PLOTS) { p.id = pid(p.x, p.y); at[p.id] = p; const a = above[p.y][p.x]; p.under = { plot: a.id, name: a.name, district: a.d, level: levels.grid[p.y][p.x] }; p.level = p.under.level + DIST[p.d].off; }

/* every way out of the zone: the door or link in data.js today, where it lands today, where the plan puts it. sq = plot square of the marker.
   kind: open | hidden (secret in the data) | hq (a DOOR HQ door). lab = [dx, dy] of the label from the marker, in pixels. */
const WAYS = [
    { plot: 'P10-11', sq: [6.5, 11.4], kind: 'open', to: 'Disaster City: the Pump court', today: 'door pump <> city door sewer (THE PUMPING STATION)', note: 'the city door stands on the Pump court\'s south edge, square 6: straight above', lab: [-150, 62] },
    { plot: 'P08-11', sq: [6.5, 6.5], kind: 'open', to: 'Disaster City: the Dock edge (the drowned manhole)', today: 'link docks_sewer', note: 'the manhole stands on the Dock edge, square 6, 6: straight above', lab: [-110, -118] },
    { plot: 'P00-03', sq: [1.2, 5.2], kind: 'open', to: 'the Platform (the city\'s metro)', today: 'link tunnels_platform', note: 'the Platform is the inside behind the metro stair on this same city plot', west: 1, lab: [0, -6] },
    { plot: 'P00-03', sq: [1.2, 7.6], kind: 'hq', to: 'DOOR HQ: the Tunnel (the track)', today: 'link tunnels_works', note: 'DOOR HQ is not on the map', west: 1, lab: [0, 22] },
    { plot: 'P00-02', sq: [2.4, 6], kind: 'hq', to: 'DOOR HQ: Room 24601 (the seventh cell)', today: 'link cells_dungeon', note: 'DOOR HQ is not on the map', west: 1, lab: [0, -6] },
    { plot: 'P00-04', sq: [9, 5.5], kind: 'hq', to: 'DOOR HQ: the Garden well', today: 'link well_garden', note: 'DOOR HQ is not on the map', west: 1, lab: [0, -6] },
    { plot: 'P00-07', sq: [0.6, 6.5], kind: 'hidden', to: 'The Woods: the storm drain', today: 'link sewers_drain (the Woods\' east side)', note: 'the Woods lie west of the city: the west edge', west: 1, lab: [0, -6] },
    { plot: 'P00-07', sq: [3.2, 9.4], kind: 'open', to: 'the Strip: the back lane (keep?)', today: 'link strip_sewer', note: 'the Strip\'s road leaves the city on this plot\'s west side; the Strip is still an old room', west: 1, lab: [0, 30] },
    { plot: 'P03-05', sq: [8.6, 6.5], kind: 'open', to: 'Cyberpunk City: the lower street (keep?)', today: 'link undercity_sewer', note: 'Cyberpunk City has no place on the city map; this spot is mine', lab: [44, -6] },
    { plot: 'P05-10', sq: [6.5, 3.6], kind: 'hidden', to: 'the Stadium (behind the east stand)', today: 'link stadium_sewers', note: 'the pitch stands on the four plots here; this is its east half', lab: [62, -22] },
    { plot: 'P02-03', sq: [5.5, 8], kind: 'open', to: 'The Cavern: the Oubliette', today: 'link workings_oubliette', note: 'the Cavern is below', lab: [-165, 80] },
];
/* ways that were doors between the four old rooms and become walked openings inside the one room */
const INNER = [
    { a: 'P01-02', b: 'P02-02', label: 'cell door', old: 'cells.sewers <> sewers.drain' },
    { a: 'P01-02', b: 'P01-03', label: 'trap + rope ladder', at: [-128, -15], old: 'cells.trap <> workings.trap (hidden)' },
    { a: 'P02-03', b: 'P02-02', label: 'the Adit', at: [-58, -15], old: 'workings.sewers <> sewers.adit (hidden)' },
    { a: 'P00-06', b: 'P00-07', label: 'Maintenance Hatch', old: 'tunnels.sewers <> sewers.hatch' },
];

/* ---- the square map (144 x 144 squares of 3.5 m; x = solid ground, not dug) ---- */
const N = 144, cells = [...Array(N)].map(() => Array(N).fill('x'));
const ARM = { W: ['o', 'w', 'o'], T: ['j', 'j', 'o'], H: ['f', 'f', 'f'], O: ['o', 'o', 'o'] };
function put(p, x, y, ch) { if (x < 0 || y < 0 || x > 11 || y > 11) return; cells[p.y * 12 + y][p.x * 12 + x] = ch; }
function rect(p, r) { for (let y = r[1]; y <= r[3]; y++) for (let x = r[0]; x <= r[2]; x++) put(p, x, y, r[4]); }
function arm(p, side, pat) {
    for (let i = 0; i < 3; i++) for (let t = 0; t <= 7; t++) {
        if (side === 'N') put(p, 5 + i, t, pat[i]); if (side === 'S') put(p, 5 + i, 11 - t + (t > 6 ? 1 : 0), pat[i]);
        if (side === 'W') put(p, t, 5 + i, pat[i]); if (side === 'E') put(p, 11 - t + (t > 6 ? 1 : 0), 5 + i, pat[i]);
    }
}
for (const p of PLOTS) {
    for (const r of p.r) rect(p, r);
    for (const s of p.ports) arm(p, s, ARM[p.d]);
    if (p.west) arm(p, 'W', p.west === 'j' ? ARM.T : ['o', 'w', 'o']);
    if (p.east) arm(p, 'E', ['o', 'w', 'o']);
    if (p.south) arm(p, 'S', ['o', 'o', 'o']);
    for (const r of p.post || []) rect(p, r);
}

/* ---- the json ---- */
const CHANGED = [
    'The frame is the city\'s own 12 x 12 plot grid: sewer plot Pcc-rr lies under the city plot standing at column cc, row rr. Plan 1 was a strip of 8 x 2 with no tie to the plots above.',
    '31 plots are dug (plan 1: 16). The doors up stand at the city\'s north-west corner (the precinct, the metro) and its south-east corner (the Dock edge, the Pump court); one room that reaches both cannot be smaller than 21 plots. 11 of the 31 are plain culvert under a street.',
    'The Pump court and Dock doors moved with Industrial to the city\'s south-east (columns 10 and 8, row 11). Plan 1 had them at the strip\'s two ends, the Pump court in the west.',
    'The Holding Cells are plots now (district H, under Civic Center\'s Police desk and Holding annex), no longer an inside behind a door: all four old rooms retire.',
    'The Old Workings lie beside and below the cells ("the mine under the precinct"), under the Public library and the Military offices.',
    'The Running Tunnels run from under the Transit square (the metro stair\'s plot) south down the city\'s west edge.',
    'The main culvert runs under real streets: the west avenue (column 3), the cross street (row 7), the south street (row 11).',
    'The Woods\' storm drain is on the west edge (the Woods lie west of the city), not at the east end.',
    'Heights follow the city: each plot lies a fixed number of levels under the plot above, so the water runs from the precinct (level 9) down to the Outfall at the bay (level -3).',
    'Four districts, one file each from the first build PR: W, T, H, O.',
];
const out = {
    area: 'The Sewers', version: 'plan-2', date: '2026-11-16', status: 'PROPOSAL: waits mondo\'s OK; nothing is built',
    squareMeters: 3.5, plotCells: 12, levelMeters: 1.75,
    frame: 'the city\'s 12 x 12 plot grid (docs/disaster-city/city-layout.json + move.js): sewer plot Pcc-rr lies under the city plot standing at column cc, row rr',
    room: { cols: 12, rows: 12, dug: PLOTS.length, meters: [504, 504] },
    districts: Object.fromEntries(Object.entries(DIST).map(([k, d]) => [k, { name: d.name, plots: PLOTS.filter(p => p.d === k).length, levelsUnderTheCity: -d.off, file: d.file }])),
    build: { layout: 'docs/areas/sewers/layout.json', districts: Object.values(DIST).map(d => d.file), tool: 'bake-sewers.js', room: 'one room (id chosen at the build; the four old rooms go in data.js DOOR_HQ.retired)', boardRows: 'one for the tool + shared pieces, one per district' },
    retires: ['site_prebuilt_downtown_sewers', 'site_prebuilt_downtown_tunnels', 'site_prebuilt_downtown_cells', 'site_prebuilt_downtown_workings'],
    changedFromPlan1: CHANGED,
    plots: PLOTS.map(p => ({ id: p.id, name: p.name, district: DIST[p.d].name, level: p.level, under: p.under, what: p.what, from: p.from, ports: [...p.ports].sort(), exits: WAYS.filter(w => w.plot === p.id).map(w => ({ to: w.to, kind: w.kind, today: w.today, square: w.sq, note: w.note })) })),
    waysInside: INNER.map(i => ({ between: [i.a, i.b], what: i.label, wasDoors: i.old })),
    cells: cells.map(r => r.join('')),
    legend: { x: 'solid ground, not dug (cannot walk)', o: 'sewer walkway / mine floor', w: 'water', f: 'concrete room', j: 'rail track', b: 'plank / deck over water' },
};
fs.writeFileSync(path.join(__dirname, 'sewers-layout-2.json'), JSON.stringify(out, null, 1) + '\n');

/* ---- the picture ---- */
const S = 120, c = S / 12, MX = 340, MY = 118, LEGX = MX + 12 * S + 44, LEGW = 600, Wd = LEGX + LEGW + 30;
const TBY = MY + 12 * S + 96, ROW = 21, Ht = TBY + 56 + PLOTS.length * ROW + 36;
const C = { bg: '#181a18', ink: '#f2f2f2', dim: '#a2a9b0', faint: '#6f7680', open: '#4ef07a', hidden: '#ff7ad1', hq: '#ffc93a', id: '#ffd75e' };
const GROUND = { o: '#8d8a84', w: '#3f7fc4', f: '#a9adb0', j: '#b08a5a', b: '#c9a36a' };
const CCOL = { R: '#b58a5a', C: '#9aa7b8', F: '#c2b25a', U: '#6fa6c9', H: '#c96f6f', E: '#b56fc9', I: '#8f8f8f', S: '#6fc98a', B: '#5ab5b5' };
const o = [], esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const txt = (x, y, s, sz = 12, fill = C.ink, w = 400, anchor = 'start', extra = '') => o.push(`<text x="${x}" y="${y}" font-size="${sz}" fill="${fill}" font-weight="${w}" text-anchor="${anchor}" ${extra}>${esc(s)}</text>`);
const wrap = (s, n) => { const out = []; let l = ''; for (const w of s.split(' ')) { if ((l + ' ' + w).trim().length > n) { out.push(l); l = w; } else l = (l + ' ' + w).trim(); } if (l) out.push(l); return out; };
const tw = (s, sz) => s.length * sz * 0.63;
o.push(`<rect width="${Wd}" height="${Ht}" fill="${C.bg}"/>`);
txt(30, 44, 'THE SEWERS  ·  plot plan 2 for your OK  ·  31 plots dug in the city\'s own 12 x 12 grid  ·  under Disaster City as it stands after the district move', 23, C.ink, 700);
txt(30, 70, 'North is up. The faint grid is the built city above (its 144 plots and nine districts, read from the city\'s files). A bright plot is sewer, lying straight under the city plot it is drawn on, so every door up comes out where you expect.', 13.5, C.dim);
txt(30, 90, 'This is a plan drawing, not the game. Nothing is built. One small square = 3.5 m; one plot = 12 x 12 squares = 42 m.', 13.5, C.dim);

/* the city above, faint */
for (let y = 0; y < 12; y++) for (let x = 0; x < 12; x++) {
    const a = above[y][x], X = MX + x * S, Y = MY + y * S;
    o.push(`<rect x="${X}" y="${Y}" width="${S}" height="${S}" fill="${CCOL[a.d]}" fill-opacity=".07" stroke="#ffffff" stroke-opacity=".10"/>`);
    if (!at[pid(x, y)]) { wrap(a.name, 16).forEach((l, i) => txt(X + S / 2, Y + S - 22 + i * 12, l, 10, C.faint, 400, 'middle')); txt(X + 5, Y + 13, `${x},${y}`, 8.5, '#565c64'); }
}
const NAMEAT = { C: [2, 0.62], F: [6, 2], E: [10, 2], U: [2, 5.1], H: [6, 6], B: [10, 6], R: [1.5, 9.6], S: [6, 9], I: [10, 9.6] };
for (const [k, t] of Object.entries(move.to)) {
    o.push(`<rect x="${MX + t[0] * 4 * S}" y="${MY + t[1] * 4 * S}" width="${4 * S}" height="${4 * S}" fill="none" stroke="${CCOL[k]}" stroke-opacity=".55" stroke-width="2" stroke-dasharray="10 7"/>`);
    txt(MX + NAMEAT[k][0] * S, MY + NAMEAT[k][1] * S, CITY_NAME[k], 21, CCOL[k], 700, 'middle', 'fill-opacity=".34" letter-spacing="2"');
}
/* the sea: east and south of Industrial / Bayside */
txt(MX + 12 * S + 8, MY + 10.2 * S, 'the bay', 11, '#5d8fc4', 400, 'start', `transform="rotate(90 ${MX + 12 * S + 8} ${MY + 10.2 * S})"`);

/* the dug plots */
for (const p of PLOTS) {
    const X = MX + p.x * S, Y = MY + p.y * S, d = DIST[p.d];
    o.push(`<rect x="${X}" y="${Y}" width="${S}" height="${S}" fill="#101312"/>`);
    o.push(`<rect x="${X}" y="${Y}" width="${S}" height="${S}" fill="${d.col}" fill-opacity=".42"/>`);
    for (let y = 0; y < 12; y++) for (let x = 0; x < 12; x++) { const ch = cells[p.y * 12 + y][p.x * 12 + x]; if (ch !== 'x') o.push(`<rect x="${X + x * c}" y="${Y + y * c}" width="${c}" height="${c}" fill="${GROUND[ch]}"/>`); }
}
for (const p of PLOTS) {   // district-coloured outline where the neighbour is not the same district
    const X = MX + p.x * S, Y = MY + p.y * S, d = DIST[p.d];
    const nb = (dx, dy) => { const q = at[pid(p.x + dx, p.y + dy)]; return q && q.d === p.d; };
    const ln = (x1, y1, x2, y2) => o.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#ffffff" stroke-width="2.5"/>`);
    if (!nb(0, -1)) ln(X, Y, X + S, Y); if (!nb(0, 1)) ln(X, Y + S, X + S, Y + S); if (!nb(-1, 0)) ln(X, Y, X, Y + S); if (!nb(1, 0)) ln(X + S, Y, X + S, Y + S);
    o.push(`<rect x="${X}" y="${Y}" width="${S}" height="${S}" fill="none" stroke="#000" stroke-opacity=".5"/>`);
}
const label = (x, y, s, sz, fill, w = 700, anchor = 'start') => o.push(`<text x="${x}" y="${y}" font-size="${sz}" fill="${fill}" font-weight="${w}" text-anchor="${anchor}" stroke="#000" stroke-width="3" stroke-opacity=".85" paint-order="stroke">${esc(s)}</text>`);
for (const p of PLOTS) {
    const X = MX + p.x * S, Y = MY + p.y * S;
    const nl = wrap(p.name, 15); nl.forEach((l, i) => label(X + 5, Y + 15 + i * 13, l, 11.5, C.ink));
    label(X + 5, Y + 15 + nl.length * 13, `${p.id}  L${p.level}`, 9.5, C.id, 600);
    label(X + S - 4, Y + S - 6, `under ${p.under.name}`.slice(0, 26), 8.6, '#d5dade', 400, 'end');
}
/* ways inside the room (old doors between the four rooms) */
for (const i of INNER) {
    const a = at[i.a], b = at[i.b], X = MX + ((a.x + b.x) / 2 + 0.5) * S, Y = MY + ((a.y + b.y) / 2 + 0.5) * S + (a.y === b.y ? 0 : 0);
    o.push(`<rect x="${X - 6}" y="${Y - 6}" width="12" height="12" fill="#fff" stroke="#000" transform="rotate(45 ${X} ${Y})"/>`);
    const w = tw(i.label, 9.5) + 8, lx = i.at ? X + i.at[0] : a.y === b.y ? X - w / 2 : X + 12, ly = i.at ? Y + i.at[1] : a.y === b.y ? Y + 30 : Y + 3;
    o.push(`<rect x="${lx - 3}" y="${ly - 10}" width="${w}" height="14" fill="#000" fill-opacity=".8"/>`); txt(lx + 1, ly + 1, i.label, 9.5, '#fff', 600);
}
/* ways out */
for (const w of WAYS) {
    const p = at[w.plot], X = MX + p.x * S + w.sq[0] * c, Y = MY + p.y * S + w.sq[1] * c, col = C[w.kind];
    const lw = tw(w.to, 11) + 12, lx = w.west ? MX - 16 - lw : X + w.lab[0], ly = Y + w.lab[1], ax = (w.west || w.lab[0] < 0) ? lx + lw : lx, ay = ly - 4;
    o.push(`<line x1="${X}" y1="${Y}" x2="${Math.abs(w.lab[0]) < 160 && Math.abs(w.lab[1]) > 40 ? lx + lw / 2 : ax}" y2="${Math.abs(w.lab[1]) > 40 ? (w.lab[1] > 0 ? ly - 13 : ly + 4) : ay}" stroke="${col}" stroke-width="1.6"/>`);
    o.push(`<circle cx="${X}" cy="${Y}" r="7.5" fill="${col}" stroke="#000" stroke-width="2"/>`);
    o.push(`<rect x="${lx}" y="${ly - 13}" width="${lw}" height="17" fill="#000" stroke="${col}" stroke-width="1"/>`); txt(lx + 6, ly, w.to, 11, col, 600);
}
/* frame */
o.push(`<rect x="${MX}" y="${MY}" width="${12 * S}" height="${12 * S}" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1.5"/>`);
for (let i = 0; i < 12; i++) { txt(MX + i * S + S / 2, MY - 8, 'col ' + i, 10.5, C.dim, 400, 'middle'); txt(MX + 12 * S + 22, MY + i * S + S / 2 + 4, 'row ' + i, 10.5, C.dim, 400, 'start'); }

/* the legend */
let ly = MY + 6; const LX = LEGX + 40;
const head = s => { txt(LX, ly, s, 14.5, C.ink, 700); ly += 22; };
const para = (s, n = 88, fill = '#d9dde0', sz = 11.8) => { wrap(s, n).forEach(l => { txt(LX, ly, l, sz, fill); ly += 15.5; }); };
const sw = (col, s, extra) => { o.push(`<rect x="${LX}" y="${ly - 11}" width="15" height="13" fill="${col}" stroke="#fff" stroke-opacity=".7"/>`); txt(LX + 24, ly, s, 12); if (extra) txt(LX + 24, ly + 14, extra, 10.5, C.dim); ly += extra ? 34 : 20; };
head('DISTRICTS  (one file each, from the first build PR)');
for (const [k, d] of Object.entries(DIST)) sw(d.col, `${k} · ${d.name}  (${PLOTS.filter(p => p.d === k).length} plots, ${-d.off} levels under the city)`, d.file);
txt(LX, ly, 'Shared: docs/areas/sewers/layout.json + bake-sewers.js (the plan, heights, ways out, shell).', 10.5, C.dim); ly += 26;
head('GROUND');
sw(GROUND.o, 'sewer walkway / mine floor'); sw(GROUND.w, 'water (the culvert\'s stream is waded; tanks are deep)'); sw(GROUND.f, 'concrete room'); sw(GROUND.j, 'rail track'); sw(GROUND.b, 'plank over water'); sw('#101312', 'solid ground between the tunnels (cannot walk)'); ly += 6;
head('WAYS');
const dot = (col, s) => { o.push(`<circle cx="${LX + 7}" cy="${ly - 4}" r="7" fill="${col}" stroke="#000" stroke-width="2"/>`); txt(LX + 24, ly, s, 12); ly += 20; };
dot(C.open, 'way in or out, open (in the game today)'); dot(C.hidden, 'hidden, found later (in the game today)'); dot(C.hq, 'a DOOR HQ door (in the game today)');
o.push(`<rect x="${LX + 1}" y="${ly - 10}" width="11" height="11" fill="#fff" stroke="#000" transform="rotate(45 ${LX + 7} ${ly - 4})"/>`); txt(LX + 24, ly, 'was a door between two of the old rooms; now you walk through', 12); ly += 20;
para('No new way was added. All 11 ways out are the 11 in the game today.', 88, C.dim, 11); ly += 10;
head('HEIGHTS');
para('L = the plot\'s level; one level = 1.75 m; 0 = the sea. Each plot lies a fixed number of levels under the city plot above it, so the sewer falls with the city: from the precinct (L9) down the avenue to the Outfall at the bay (L-3). Follow the water and you reach the sea.'); ly += 10;
head('WHAT CHANGED FROM PLAN 1  (8 x 2 = 16 plots)');
for (const s of CHANGED.slice(0, 9)) { const ls = wrap(s, 84); ls.forEach((l, i) => { txt(LX + (i ? 12 : 0), ly, (i ? '' : '· ') + l, 11.5, '#d9dde0'); ly += 15; }); ly += 3; }
ly += 8; head('WHO LIVES HERE');
para('Flesheater and Swamp Monster as visitors (the world plan\'s homes table). No unit has the Sewers as its home today. The old rooms\' twelve bystanders and their lines move with their spots.'); ly += 10;
head('NAMES');
para('Every plot name is the game\'s own: a sub-area or a door plate of the four old rooms. The 11 plain tunnel plots are all "The Culverts". No label is mine.');

/* the table */
txt(30, TBY, 'EVERY PLOT  ·  what stands on it  ·  which old room it comes from', 15, C.ink, 700);
const COLX = [30, 106, 318, 360, 610, 1330];
['plot', 'name', 'L', 'under (city plot, district)', 'what stands on it', 'comes from'].forEach((h, i) => txt(COLX[i], TBY + 26, h, 11, C.dim, 700));
PLOTS.forEach((p, i) => {
    const Y = TBY + 48 + i * ROW;
    if (i % 2 === 0) o.push(`<rect x="22" y="${Y - 14}" width="${Wd - 44}" height="${ROW}" fill="#fff" fill-opacity=".035"/>`);
    o.push(`<rect x="${COLX[0]}" y="${Y - 10}" width="10" height="11" fill="${DIST[p.d].col}" stroke="#fff" stroke-opacity=".6"/>`);
    txt(COLX[0] + 16, Y, p.id, 11.5, C.id); txt(COLX[1], Y, `${p.d} · ${p.name}`, 11.5, C.ink, 600); txt(COLX[2], Y, String(p.level), 11.5);
    txt(COLX[3], Y, `${p.under.name} (${CITY_NAME[p.under.district].toLowerCase()})`, 11.5, '#cfd4d8'); txt(COLX[4], Y, p.what, 11.5); txt(COLX[5], Y, p.from, 11.5, '#cfd4d8');
});
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${Wd}" height="${Ht}" viewBox="0 0 ${Wd} ${Ht}" font-family="DejaVu Sans, Arial, sans-serif">${o.join('')}</svg>`;
fs.writeFileSync(path.join(__dirname, 'sewers_plot_plan_2.svg'), svg);
console.log(`sewers plan 2: ${PLOTS.length} plots (${Object.entries(DIST).map(([k]) => k + ' ' + PLOTS.filter(p => p.d === k).length).join(', ')}), ${WAYS.length} ways out, ${Wd} x ${Ht}`);
(async () => {
    let pw; try { pw = require('playwright'); } catch (e) { try { pw = require('/opt/node-tools/node_modules/playwright'); } catch (e2) { console.log('no playwright: open the .svg in a browser and save a PNG'); return; } }
    const b = await pw.chromium.launch(); const pg = await b.newPage({ viewport: { width: Wd, height: Ht } });
    await pg.setContent(`<body style="margin:0;background:${C.bg}">${svg}</body>`); await pg.screenshot({ path: path.join(__dirname, 'sewers_plot_plan_2.png') }); await b.close(); fs.unlinkSync(path.join(__dirname, 'sewers_plot_plan_2.svg'));
    console.log('wrote sewers_plot_plan_2.png');
})();
