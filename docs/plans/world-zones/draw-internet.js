/* THE INTERNET, PLOT PLAN 1 (2026-11-17, One World phase 4.4; mondo approved the four districts 11-17: "that is okay" to
   "The Feed: a long boulevard of giant scrolling screens · The Forums: plazas of message boards · The Server Farm: aisles of racks and
   cables · The Dark Web: a lower, darker level underneath", reached from the D.U.M.B.'s server rooms).
   `node docs/plans/world-zones/draw-internet.js` writes:
     docs/areas/internet/layout.json                  the layout bake-internet.js reads (every plot + the 72 x 72 square map)
     docs/plans/world-zones/internet_plot_plan.png    the picture (an SVG shot with playwright; `--no-png` skips it)

   WHAT IT IS: one room, 6 x 6 plots of 12 x 12 squares, NO GROUND (the Astral Realm's machinery: the void + float plateaus). The Internet
   is "beyond" on the One World sheet, beside the Astral Realm: one is what people imagine, the other is what they post. Every plot is a
   flat tile hanging over a glowing grid at its own height, joined to the next where a plot has a port: a bridge (same height) or a flight
   of floating steps (two levels at most).
     THE SERVER FARM (north-west, 9 plots) is ONE floor, the data hall, level 8: rows of racks with aisles between (a grid of walks two
       squares wide). You arrive at its north-west corner through the D.U.M.B. Control Room's screen. Landmark: THE CLOUD (label mine).
     THE FEED (north-east, 9 plots): the BOULEVARD, three plots long and four squares wide, level 10, giant screens down both sides; six side
       plots off it (higher stages, a sunk comment pit). Landmark: the For You Page at the boulevard's end.
     THE FORUMS (south-east, 9 plots): plazas of message boards, levels 8 to 11. Landmark: the Mod Tower.
     THE DARK WEB (south-west, 9 plots): UNDERNEATH: it sinks from level 7 at the Onion Gate (the way in, from Off-Topic) to level 1, 12 m
       under the Server Farm's floor, which hangs over it. Ragged dark tiles. Landmark: the Bottom.
   Every name here is a label of mine, marked so in `from`.
   x, y = the plot's place. L = height in levels of 1.75 m. ports = the sides it is joined on; a lower-case port letter = a WIDE join (the
   two plots' floors run into each other, no gap). style: slab (the plot is floor to its edges) | blvd | isle | ragged | small. */
'use strict';
const fs = require('fs'), path = require('path');
const REPO = path.join(__dirname, '..', '..', '..');
const DIST = {
    S: { name: 'The Server Farm', col: '#3fa0ff', file: 'docs/areas/internet/districts/S.js', ground: 's', path: 'a' },
    F: { name: 'The Feed', col: '#ff5fb0', file: 'docs/areas/internet/districts/F.js', ground: 'f', path: 'v' },
    B: { name: 'The Forums', col: '#ffb040', file: 'docs/areas/internet/districts/B.js', ground: 'b', path: 'p' },
    D: { name: 'The Dark Web', col: '#a03040', file: 'docs/areas/internet/districts/D.js', ground: 'd', path: 'x' },
};
const LEGEND = { '.': 'open sky over the grid (a fall sends you back)', s: 'the data hall\'s raised floor', a: 'an aisle (a walk)', f: 'the Feed\'s glass', v: 'the boulevard (a walk)',
    b: 'a forum plaza', p: 'a forum walk', d: 'the Dark Web\'s black tile', x: 'a dark walk', k: 'a bridge or a flight of floating steps between two tiles' };
const M = '(label mine)';
const PLOTS = [
    /* THE SERVER FARM: one data hall, wide joins all through */
    { x: 0, y: 0, d: 'S', L: 8, name: 'The Login Screen', what: 'the screen you come in through: the D.U.M.B. Control Room is behind it; the healing ring', from: 'the way in ' + M, ports: 'es', style: 'slab', way: 'dumb_internet' },
    { x: 1, y: 0, d: 'S', L: 8, name: 'The Cold Aisle', what: 'racks facing racks, the cold air coming up through the floor', from: M, ports: 'wes', style: 'slab' },
    { x: 2, y: 0, d: 'S', L: 8, name: 'The Cooling Towers', what: 'the chillers and the fans the size of rooms', from: M, ports: 'ws', style: 'slab' },
    { x: 0, y: 1, d: 'S', L: 8, name: 'The Hot Aisle', what: 'the backs of the racks: the heat, the cables', from: M, ports: 'nes', style: 'slab' },
    { x: 1, y: 1, d: 'S', L: 8, name: 'The Cloud', what: 'LANDMARK: the cloud everybody keeps their photos in, which is somebody else\'s computer', from: M, ports: 'nwes', style: 'slab' },
    { x: 2, y: 1, d: 'S', L: 8, name: 'The Uplink', what: 'the trunk cables up to the Feed', from: M, ports: 'nwsE', style: 'slab' },
    { x: 0, y: 2, d: 'S', L: 8, name: 'The Backup Tapes', what: 'shelves of tapes nobody has ever restored from', from: M, ports: 'ne', style: 'slab' },
    { x: 1, y: 2, d: 'S', L: 8, name: 'The Cable Mess', what: 'every cable ever, under one floor tile', from: M, ports: 'nwe', style: 'slab' },
    { x: 2, y: 2, d: 'S', L: 8, name: 'The Recycle Bin', what: 'everything deleted, kept', from: M, ports: 'nwE', style: 'slab' },
    /* THE FEED: the boulevard (row 1) + six side plots */
    { x: 3, y: 0, d: 'F', L: 11, name: 'The Influencer Stage', what: 'ring lights, a set, a live stream nobody is watching', from: M, ports: 'S', style: 'isle' },
    { x: 4, y: 0, d: 'F', L: 12, name: 'Trending', what: 'the highest stage on the Feed: today\'s hashtag, tomorrow\'s nothing', from: M, ports: 'S', style: 'isle' },
    { x: 5, y: 0, d: 'F', L: 11, name: 'The Unboxing', what: 'boxes opened on camera, the boxes kept', from: M, ports: 'S', style: 'isle' },
    { x: 3, y: 1, d: 'F', L: 10, name: 'The Timeline', what: 'the boulevard\'s start: the screens begin', from: M, ports: 'WNSe', style: 'blvd' },
    { x: 4, y: 1, d: 'F', L: 10, name: 'The Infinite Scroll', what: 'the boulevard: the screens go on', from: M, ports: 'wNSe', style: 'blvd' },
    { x: 5, y: 1, d: 'F', L: 10, name: 'The For You Page', what: 'LANDMARK: the boulevard\'s end: the biggest screen, and it is looking at you', from: M, ports: 'wNS', style: 'blvd' },
    { x: 3, y: 2, d: 'F', L: 8, name: 'The Comment Section', what: 'a sunk pit off the boulevard: everybody shouting at once', from: M, ports: 'NW', style: 'isle' },
    { x: 4, y: 2, d: 'F', L: 9, name: 'Sponsored', what: 'the ads: a plaza that is all ads', from: M, ports: 'NS', style: 'isle' },
    { x: 5, y: 2, d: 'F', L: 10, name: 'Going Viral', what: 'the stage everybody wants, for fifteen minutes', from: M, ports: 'NS', style: 'isle' },
    /* THE FORUMS */
    { x: 3, y: 3, d: 'B', L: 10, name: 'The Front Page', what: 'the board everybody reads first', from: M, ports: 'ES', style: 'isle' },
    { x: 4, y: 3, d: 'B', L: 9, name: 'General Discussion', what: 'the boards; the way up to the Feed', from: M, ports: 'NWES', style: 'isle' },
    { x: 5, y: 3, d: 'B', L: 8, name: 'The Flame War', what: 'a plaza on fire; nobody remembers what started it', from: M, ports: 'NWS', style: 'isle' },
    { x: 3, y: 4, d: 'B', L: 9, name: 'Off-Topic', what: 'everything else; the steps down to the Dark Web', from: M, ports: 'NWES', style: 'isle' },
    { x: 4, y: 4, d: 'B', L: 9, name: 'The Help Desk', what: 'have you tried turning it off and on again', from: M, ports: 'NWS', style: 'isle' },
    { x: 5, y: 4, d: 'B', L: 8, name: 'The Archive', what: 'threads nobody has posted in for years; somebody just did', from: M, ports: 'NS', style: 'isle' },
    { x: 3, y: 5, d: 'B', L: 11, name: 'The Mod Tower', what: 'LANDMARK: the moderators\' tower and the ban hammer', from: M, ports: 'N', style: 'isle' },
    { x: 4, y: 5, d: 'B', L: 10, name: 'The Rules', what: 'the rules board: rule one is read the rules', from: M, ports: 'NE', style: 'isle' },
    { x: 5, y: 5, d: 'B', L: 9, name: 'Lurkers\' Corner', what: 'everybody who reads and never posts', from: M, ports: 'NW', style: 'small' },
    /* THE DARK WEB: underneath, sinking */
    { x: 2, y: 4, d: 'D', L: 7, name: 'The Onion Gate', what: 'the way in from Off-Topic: layers and layers', from: M, ports: 'ES', style: 'ragged' },
    { x: 2, y: 5, d: 'D', L: 5, name: 'The Black Market', what: 'stalls selling what nobody will name', from: M, ports: 'NW', style: 'ragged' },
    { x: 1, y: 5, d: 'D', L: 3, name: 'The Hacker Den', what: 'screens in the dark and somebody typing very fast', from: M, ports: 'NWE', style: 'ragged' },
    { x: 0, y: 5, d: 'D', L: 1, name: 'The Bottom', what: 'LANDMARK: the lowest tile in the Internet, right over the grid', from: M, ports: 'NE', style: 'ragged' },
    { x: 1, y: 4, d: 'D', L: 3, name: 'The Bazaar', what: 'more stalls, fewer lights', from: M, ports: 'NWS', style: 'ragged' },
    { x: 0, y: 4, d: 'D', L: 1, name: 'The Forgotten Servers', what: 'servers nobody pays for that are still on', from: M, ports: 'NES', style: 'ragged' },
    { x: 1, y: 3, d: 'D', L: 3, name: 'The Crawlers', what: 'the things that read every page', from: M, ports: 'WES', style: 'ragged' },
    { x: 0, y: 3, d: 'D', L: 1, name: 'Page Not Found', what: 'a tile that is mostly missing', from: M, ports: 'ES', style: 'small' },
    { x: 2, y: 3, d: 'D', L: 5, name: 'The Mirror Sites', what: 'the same stall three times', from: M, ports: 'W', style: 'ragged' },
];
const WAYS = [
    { id: 'dumb_internet', plot: 'P00-00', side: 'N', kind: 'link', to: 'The D.U.M.B.: the Control Room\'s servers (a screen)', col: '#7fffd0' },
];
const N = 12, GX = 6, GY = 6, W = N * GX, H = N * GY;
const pid = (x, y) => 'P0' + x + '-0' + y, at = {};
PLOTS.forEach(p => { p.id = pid(p.x, p.y); at[p.id] = p; });
const mk = s => { let v = s >>> 0; return () => { v = (v * 1664525 + 1013904223) >>> 0; return v / 4294967296; }; };
const cells = []; for (let y = 0; y < H; y++) cells.push(new Array(W).fill('.'));
const OPP = { N: 'S', S: 'N', E: 'W', W: 'E' }, DXY = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] };
const portsOf = p => p.ports.split('').map(c => ({ s: c.toUpperCase(), wide: c !== c.toUpperCase() }));
for (const p of PLOTS) {
    const rnd = mk(9173 * (p.x + 1) + 131 * (p.y + 1)), ri = (a, b) => a + Math.floor(rnd() * (b - a + 1)), D = DIST[p.d], g = [], P = portsOf(p);
    const wideOn = s => P.some(q => q.s === s && q.wide);
    for (let y = 0; y < N; y++) g.push(new Array(N).fill('.'));
    const fill = (x0, y0, x1, y1, ch) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (x >= 0 && y >= 0 && x < N && y < N) g[y][x] = ch; };
    const style = p.style;
    if (style === 'slab' || style === 'blvd') {
        /* floor to the plot's edge on a wide side, one square of sky on the others */
        const x0 = wideOn('W') ? 0 : 1, x1 = wideOn('E') ? 11 : 10, y0 = wideOn('N') ? 0 : 1, y1 = wideOn('S') ? 11 : 10;
        if (style === 'slab') fill(x0, y0, x1, y1, D.ground);
        else fill(x0, 1, x1, 10, D.ground);
        /* the corner where four slab plots meet is floor too (the hall is one floor) */
    } else if (style === 'small') { fill(3, 3, 8, 8, D.ground); g[3][3] = g[3][8] = g[8][3] = g[8][8] = '.'; }
    else if (style === 'isle') { fill(1, 1, 10, 10, D.ground); [[1, 1], [10, 1], [1, 10], [10, 10]].forEach(([x, y]) => { g[y][x] = '.'; }); }
    else {   /* ragged: a smaller tile, its corners stepped, one or two bites out of a side with no port */
        const x0 = 1 + ri(0, 1), y0 = 1 + ri(0, 1), x1 = 10 - ri(0, 1), y1 = 10 - ri(0, 1); fill(x0, y0, x1, y1, D.ground);
        [[x0, y0, 1, 1], [x1, y0, -1, 1], [x0, y1, 1, -1], [x1, y1, -1, -1]].forEach(([cx, cy, sx, sy]) => { const s = ri(1, 2);
            for (let a = 0; a < s; a++) for (let b = 0; a + b < s; b++) { const X = cx + a * sx, Y = cy + b * sy; if (X >= 0 && Y >= 0 && X < N && Y < N) g[Y][X] = '.'; } });
        const sides = 'NESW'.split('').filter(s => !P.some(q => q.s === s)), nb = Math.min(sides.length, 1);
        for (let b = 0; b < nb; b++) { const s = sides[b % sides.length], len = ri(2, 3), dep = 1, t = ri(3, 6);
            for (let a = 0; a < len; a++) for (let d = 0; d < dep; d++) { const X = s === 'W' ? x0 + d : s === 'E' ? x1 - d : t + a, Y = s === 'N' ? y0 + d : s === 'S' ? y1 - d : t + a; g[Y][X] = '.'; } }
    }
    /* the walks. The data hall: a grid of aisles (rows and columns 5-6 of every plot). The boulevard: a band four squares wide (rows 4-7)
       end to end. Everywhere else: from every port straight to the middle, two squares wide; a plot's edge squares at a narrow port = the bridge */
    if (style === 'slab') { for (let t = 0; t < N; t++) for (const m of [5, 6]) { if (g[m][t] !== '.') g[m][t] = D.path; if (g[t][m] !== '.') g[t][m] = D.path; } }
    if (style === 'blvd') for (let x = 0; x < N; x++) for (let y = 4; y <= 7; y++) if (g[y][x] !== '.') g[y][x] = D.path;
    for (const q of P) { if (q.wide) continue; const [dx, dy] = DXY[q.s];
        for (let t = 0; t <= 5; t++) for (const m of [5, 6]) { const X = dx ? (dx > 0 ? 11 - t : t) : m, Y = dy ? (dy > 0 ? 11 - t : t) : m; g[Y][X] = t === 0 ? 'k' : D.path; } }
    if (style !== 'slab' && style !== 'blvd') for (const [X, Y] of [[5, 5], [6, 5], [5, 6], [6, 6]]) g[Y][X] = D.path;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) cells[p.y * N + y][p.x * N + x] = g[y][x];
}
/* the data hall's inner corners: where four slab plots meet, the corner squares are floor */
for (const p of PLOTS) if (p.style === 'slab') for (const [lx, ly, dx, dy] of [[11, 11, 1, 1], [0, 11, -1, 1], [11, 0, 1, -1], [0, 0, -1, -1]]) {
    const q = at[pid(p.x + dx, p.y)], r = at[pid(p.x, p.y + dy)], s = at[pid(p.x + dx, p.y + dy)];
    if (q && r && s && [q, r, s].every(o => o.style === 'slab')) cells[p.y * N + ly][p.x * N + lx] = DIST.S.ground; }
/* every port has its other side, of the same width */
const OPEN = [];
for (const p of PLOTS) for (const { s, wide } of portsOf(p)) { const q = at[pid(p.x + DXY[s][0], p.y + DXY[s][1])];
    const back = q && portsOf(q).find(o => o.s === OPP[s]);
    if (!back || back.wide !== wide) throw new Error('one-sided port ' + p.id + ' ' + s);
    if (Math.abs(p.L - q.L) > 2) throw new Error('too steep ' + p.id + ' ' + q.id);
    if (wide && p.L !== q.L) throw new Error('a wide join must be level: ' + p.id + ' ' + q.id);
    if (s === 'E' || s === 'S') OPEN.push({ a: p.id, b: q.id, kind: wide ? 'wide' : p.L === q.L ? 'bridge' : 'steps', cross: p.d !== q.d }); }
const layout = { area: 'The Internet', version: 'plan-1', approved: 'the four districts: mondo 11-17 ("that is okay"); this plan: not yet seen', squareMeters: 3.5, plotCells: N, cols: GX, rows: GY, levelMeters: 1.75,
    districts: Object.fromEntries(Object.keys(DIST).map(k => [k, DIST[k].name])), legend: LEGEND,
    plots: PLOTS.map(p => ({ id: p.id, name: p.name, d: p.d, level: p.L, what: p.what, from: p.from, ports: p.ports, style: p.style, way: p.way || null })),
    openings: OPEN, ways: WAYS.map(w => ({ id: w.id, plot: w.plot, side: w.side, kind: w.kind, to: w.to })), cells: cells.map(r => r.join('')),
    levelsNote: 'Every plot is a tile at level x 1.75 m over the grid. The Server Farm is one floor at 8 (14 m); the Feed\'s boulevard at 10, its stages to 12; the Forums 8 to 11; the Dark Web sinks from 7 to 1 (1.75 m), under the Server Farm.' };
const json = JSON.stringify(layout, null, 0).replace(/\{"id"/g, '\n{"id"').replace(/"cells":\[/, '\n"cells":[\n').replace(/","(?=[.a-zA-Z]{72}")/g, '",\n"');
fs.mkdirSync(path.join(REPO, 'docs/areas/internet/districts'), { recursive: true });
fs.writeFileSync(path.join(REPO, 'docs/areas/internet/layout.json'), json + '\n');

/* ── the picture ── */
const COL = { '.': '#06140f', s: '#5a7a96', a: '#c8dcf0', f: '#c060a0', v: '#ffe0f4', b: '#c89040', p: '#ffe8c0', d: '#3a1a22', x: '#a03040', k: '#ffffff' };
const SQ = 13, OX = 60, OY = 96, Wd = OX + W * SQ + 470, Ht = OY + H * SQ + 60, o = [];
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
o.push(`<rect width="${Wd}" height="${Ht}" fill="#101614"/>`);
o.push(`<text x="${OX}" y="34" fill="#fff" font-size="21" font-weight="bold">THE INTERNET  ·  plot plan 1  ·  6 x 6 plots, every plot a tile over the grid  ·  one plot = 12 x 12 squares of 3.5 m</text>`);
o.push(`<text x="${OX}" y="58" fill="#bbb" font-size="13">No ground: tiles at their own heights over a glowing grid, joined by bridges and floating steps. The Server Farm is one floor; the Dark Web sinks under it.</text>`);
o.push(`<text x="${OX}" y="78" fill="#bbb" font-size="13">L = the tile's height in levels of 1.75 m. A fall puts you back on the last ground you stood on.</text>`);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) o.push(`<rect x="${OX + x * SQ}" y="${OY + y * SQ}" width="${SQ}" height="${SQ}" fill="${COL[cells[y][x]]}"/>`);
for (const p of PLOTS) { const X = OX + p.x * N * SQ, Y = OY + p.y * N * SQ, D = DIST[p.d];
    o.push(`<rect x="${X}" y="${Y}" width="${N * SQ}" height="${N * SQ}" fill="none" stroke="${D.col}" stroke-opacity="0.6" stroke-width="1"/>`);
    o.push(`<text x="${X + 4}" y="${Y + 13}" fill="#fff" font-size="11.5" font-weight="bold" stroke="#000" stroke-width="2.6" paint-order="stroke">${esc(p.name)}</text>`);
    o.push(`<text x="${X + 4}" y="${Y + 25}" fill="#ffe9a0" font-size="9.5" stroke="#000" stroke-width="2.2" paint-order="stroke">${p.id}  L${p.L}  ${(p.L * 1.75).toFixed(1)} m</text>`); }
for (const op of OPEN) { if (op.kind === 'wide') continue; const a = at[op.a], b = at[op.b], ns = a.x === b.x, X = OX + (ns ? a.x * N + 6 : b.x * N) * SQ, Y = OY + (ns ? b.y * N : a.y * N + 6) * SQ;
    if (op.kind === 'steps') o.push(`<text x="${X}" y="${Y + 4}" text-anchor="middle" fill="#111" font-size="10" font-weight="bold">${ns ? (a.L > b.L ? '▼' : '▲') : (a.L > b.L ? '▶' : '◀')}</text>`);
    if (op.cross) o.push(`<circle cx="${X}" cy="${Y}" r="15" fill="none" stroke="#ffe040" stroke-width="2.5"/>`); }
for (const w of WAYS) { const p = at[w.plot], X = OX + (p.x * N + 3) * SQ, Y = OY + (p.y * N + 2) * SQ;
    o.push(`<circle cx="${X}" cy="${Y}" r="6.5" fill="${w.col}" stroke="#000" stroke-width="1.5"/>`); }
o.push(`<rect x="${OX}" y="${OY}" width="${W * SQ}" height="${H * SQ}" fill="none" stroke="#fff" stroke-width="2"/>`);
let ly = OY + 6; const LX = OX + W * SQ + 28, T = (s, c, b, sz) => { o.push(`<text x="${LX}" y="${ly}" fill="${c || '#ddd'}" font-size="${sz || 12}" ${b ? 'font-weight="bold"' : ''}>${esc(s)}</text>`); ly += (sz || 12) + 7; };
T('DISTRICTS', '#fff', 1, 14); for (const k of Object.keys(DIST)) { o.push(`<rect x="${LX}" y="${ly - 11}" width="13" height="13" fill="${DIST[k].col}" stroke="#fff"/>`); o.push(`<text x="${LX + 20}" y="${ly}" fill="#ddd" font-size="12">${k}  ${esc(DIST[k].name)} (${PLOTS.filter(p => p.d === k).length})</text>`); ly += 19; }
ly += 8; T('SQUARES', '#fff', 1, 14); for (const k of Object.keys(LEGEND)) { o.push(`<rect x="${LX}" y="${ly - 11}" width="13" height="13" fill="${COL[k]}" stroke="#888"/>`); o.push(`<text x="${LX + 20}" y="${ly}" fill="#ddd" font-size="11">${esc(LEGEND[k].slice(0, 62))}</text>`); ly += 18; }
ly += 8; T('WAYS', '#fff', 1, 14); for (const w of WAYS) { o.push(`<circle cx="${LX + 6}" cy="${ly - 4}" r="6" fill="${w.col}" stroke="#000"/>`); o.push(`<text x="${LX + 20}" y="${ly}" fill="#ddd" font-size="11">${esc(w.to.slice(0, 64))}</text>`); ly += 18; }
o.push(`<circle cx="${LX + 6}" cy="${ly - 4}" r="7" fill="none" stroke="#ffe040" stroke-width="2.5"/>`); o.push(`<text x="${LX + 20}" y="${ly}" fill="#ddd" font-size="11">a crossing between two districts (${OPEN.filter(q => q.cross).length} in all)</text>`); ly += 18;
T('▲▼◀▶ floating steps, pointing down; a plain white bridge = level', '#ddd', 0, 11);
ly += 8; T('LANDMARKS (one a district)', '#fff', 1, 14);
['Server Farm: the Cloud (a cloud over the racks)', 'Feed: the For You Page (the biggest screen)', 'Forums: the Mod Tower (the ban hammer)', 'Dark Web: the Bottom (the lowest tile)'].forEach(s => T(s, '#ccc', 0, 11));
T('Every plot name is a label of mine. This is a plan drawing, not the game.', '#888', 0, 10);
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${Wd}" height="${Ht}" viewBox="0 0 ${Wd} ${Ht}" font-family="DejaVu Sans, Arial, sans-serif">${o.join('')}</svg>`;
console.log(`internet plan 1: ${PLOTS.length} plots (${Object.keys(DIST).map(k => k + ' ' + PLOTS.filter(p => p.d === k).length).join(', ')}), ${OPEN.length} openings (${OPEN.filter(q => q.cross).length} cross a district line), ${WAYS.length} ways`);
if (process.argv.includes('--no-png')) process.exit(0);
(async () => {
    let pw; try { pw = require('playwright'); } catch (e) { fs.writeFileSync(path.join(__dirname, 'internet_plot_plan.svg'), svg); console.log('no playwright: the .svg was written'); return; }
    let exe; try { exe = require(path.join(REPO, 'probe-fast.js')).EXE; } catch (e) {}
    const b = await pw.chromium.launch(exe ? { executablePath: exe, args: ['--no-sandbox'] } : {}); const pg = await b.newPage({ viewport: { width: Wd, height: Ht } });
    await pg.setContent(`<body style="margin:0;background:#101614">${svg}</body>`); await pg.screenshot({ path: path.join(__dirname, 'internet_plot_plan.png') }); await b.close();
    console.log('wrote internet_plot_plan.png');
})();
