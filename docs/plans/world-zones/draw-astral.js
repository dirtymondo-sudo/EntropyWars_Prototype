/* THE ASTRAL REALM, PLOT PLAN 3 (2026-11-16) — the zone thread's redesign (mondo 11-16: the eight old zones go on plots "completely
   redesigned/reimagined", no waiting for an OK; docs/plans/ZONE_THREAD_BRIEF.md).
   `node docs/plans/world-zones/draw-astral.js` writes:
     docs/areas/astral/layout.json                          the layout bake-astral.js reads (every plot + the 72 x 72 square map)
     docs/plans/world-zones/astral-realm-layout-3.json      the same, kept beside the picture as the plan
     docs/plans/world-zones/astral-realm_plot_plan_3.png    the picture (an SVG shot with playwright)
   Plan 2 (three strips side by side on one flat floor) stays beside it as history.

   WHAT PLAN 3 IS: one room, 6 x 6 plots, and NO GROUND. Every plot is its own island hanging over the void at its own height, with open
   sky between them (mondo 09-30: "the astral realm to have floating platforms that you have to jump across"; the old Sea's own machinery:
   data.js terrain.void + float plateaus). Islands are joined only where a plot has a port: a cloud bridge (same height) or a flight of
   floating steps (a different height). So a district is crossed only where a bridge is: two crossings Library <> Sea, two Sea <> Nightmare,
   none Library <> Nightmare (mondo: "at most 2 or 3 crossings").
   THE LIBRARY (west) climbs: its islands step UP to the Stacks, the highest ground in the room. THE NIGHTMARE (east) sinks: its islands
   step DOWN to the Maw, just over the glow. THE SEA OF POSSIBILITY winds between them in an S, from the Far Shore to the Carousel.
   The Waiting Room stays the small inside you arrive in (its own room), with a frame to each district.

   x, y = the plot's place. L = height in levels of 1.75 m. ports = the sides it is joined on. style: isle (default) | small | stones | wide. */
'use strict';
const fs = require('fs'), path = require('path');
const REPO = path.join(__dirname, '..', '..', '..');
const DIST = {
    S: { name: 'The Sea of Possibility', col: '#6a4fd0', file: 'docs/areas/astral/districts/S.js', ground: 'g', path: 'm' },
    L: { name: 'The Library of Unthought Things', col: '#b58a4c', file: 'docs/areas/astral/districts/L.js', ground: 'j', path: 'c' },
    N: { name: 'The Nightmare', col: '#b83a44', file: 'docs/areas/astral/districts/N.js', ground: 'R', path: 'h' },
};
const LEGEND = { '.': 'open sky over the void (a fall sends you back)', g: 'astral ground', m: 'marble walk', j: 'library carpet', c: 'the carpet runner (a walk)', R: 'nightmare flesh', h: 'the worn walk (nightmare)',
    k: 'a cloud bridge or a flight of floating steps between two islands', w: 'still water (waded)', l: 'lava (the blood that is not blood)' };
const PLOTS = [
    /* row 0 */
    { x: 0, y: 0, d: 'L', L: 12, name: 'The Card Catalogue', what: 'drawers of ideas nobody has had; the catalogue is alphabetical and longer than the room', from: 'Library: THE CARD CATALOGUE', ports: 'ES' },
    { x: 1, y: 0, d: 'L', L: 10, name: 'The Library Frame', what: 'the frame from the Waiting Room, at the end of the nave', from: 'Library: THE FRAME · INTO THE STACKS', ports: 'WS', way: 'library' },
    { x: 2, y: 0, d: 'S', L: 7, name: 'The Frame', what: 'the frame you were called through: the Waiting Room is behind it; the healing ring', from: 'Sea: THE FRAME · BACK TO THE CHAIRS + the healing zone', ports: 'ES', way: 'waiting' },
    { x: 3, y: 0, d: 'S', L: 7, name: 'The Mirror', what: 'the other side of the looking glass: Camelot\'s Looking-Glass Garden', from: 'mondo 11-16: "a door from the looking garden to the astral sea of possibility"', ports: 'WE', way: 'mirror' },
    { x: 4, y: 0, d: 'S', L: 6, name: 'The Closet', what: 'a closet standing on its own in the field, the door ajar, coats inside, no back to it: the way down into the Nightmare', from: 'Sea: THE CLOSET · NO BACK WALL', ports: 'WES' },
    { x: 5, y: 0, d: 'S', L: 6, name: 'The Carousel', what: 'the carousel: somebody thought of it once, it has not stopped', from: 'Sea: the carousel + the pearly gate', ports: 'W', style: 'small' },
    /* row 1 */
    { x: 0, y: 1, d: 'L', L: 14, name: 'The Stacks', what: 'LANDMARK: the tallest shelves, the highest ground in the Realm; the top shelf', from: 'Library: THE STACKS', ports: 'NS' },
    { x: 1, y: 1, d: 'L', L: 10, name: 'The Reading Room', what: 'lamps, the long table, the gallery over it', from: 'Library: THE READING ROOM', ports: 'NES', style: 'wide' },
    { x: 2, y: 1, d: 'S', L: 8, name: 'The Near Shore', what: 'the first island past the frame; the steps up to the Library', from: 'new plot (label mine)', ports: 'NWES' },
    { x: 3, y: 1, d: 'S', L: 8, name: 'The Thought-Forms', what: 'LANDMARK: the home of thought-forms: four columns, the knee-deep pool, the orb', from: 'Sea: THE HOME OF THOUGHT-FORMS', ports: 'WS', style: 'wide' },
    { x: 4, y: 1, d: 'N', L: 5, name: 'The Back of the Closet', what: 'the closet from the wrong side: the coats are still yours', from: 'Nightmare: THE CLOSET · BACK THROUGH THE COATS (label mine)', ports: 'NES' },
    { x: 5, y: 1, d: 'N', L: 4, name: 'The Bad Nights', what: 'every bad night, one after another; the frame from the Waiting Room', from: 'Nightmare: THE BAD NIGHTS', ports: 'WS', way: 'nightmare' },
    /* row 2 */
    { x: 0, y: 2, d: 'L', L: 13, name: 'The Stacks, west', what: 'shelves; every fork ends in a nook', from: 'Library: THE STACKS', ports: 'NES' },
    { x: 1, y: 2, d: 'L', L: 11, name: 'The Ladders', what: 'rolling ladders to shelves nobody can reach', from: 'new plot (label mine)', ports: 'NWS' },
    { x: 2, y: 2, d: 'S', L: 8, name: 'The Open Sea', what: 'stepping islands far apart: mind the gaps', from: 'Sea: the stepping stones', ports: 'NS', style: 'stones' },
    { x: 3, y: 2, d: 'S', L: 10, name: 'The High Thought', what: 'the high island: a bench and a telescope, the good ones are higher', from: 'Sea: the 9 m plateau (bench, telescope)', ports: 'N', style: 'small' },
    { x: 4, y: 2, d: 'N', L: 4, name: 'The Stage', what: 'you are on, everybody is watching, you have not learned it', from: 'Nightmare: the stage (label mine)', ports: 'NES' },
    { x: 5, y: 2, d: 'N', L: 3, name: 'The Tanks', what: 'the tanks are warm; the people in them are also in the chairs', from: 'Nightmare: the three tanks (label mine)', ports: 'NWS' },
    /* row 3 */
    { x: 0, y: 3, d: 'L', L: 11, name: 'Not Yet Written', what: 'books with blank pages, shelved so that they are found', from: 'Library: NOT YET WRITTEN', ports: 'NES' },
    { x: 1, y: 3, d: 'L', L: 10, name: 'The Three Lecterns', what: 'what you were about to think, what you will think tomorrow, what nobody will', from: 'Library: the three lecterns (label mine)', ports: 'NWS' },
    { x: 2, y: 3, d: 'S', L: 7, name: 'The Islands', what: 'a chain of small islands; the fish go by overhead', from: 'new plot (label mine)', ports: 'NES' },
    { x: 3, y: 3, d: 'S', L: 6, name: 'The Fortune Tent', what: 'the fortune teller\'s tent: she knows what you will think next', from: 'Sea: the fortune tent', ports: 'WES' },
    { x: 4, y: 3, d: 'N', L: 4, name: 'The Stairs Down', what: 'stairs with one too many steps: the way in from the Sea', from: 'new plot (label mine)', ports: 'NWES' },
    { x: 5, y: 3, d: 'N', L: 3, name: 'The Bed', what: 'LANDMARK: the bed at the bottom of a bowl; you are in it', from: 'Nightmare: THE BED', ports: 'NWS', style: 'wide' },
    /* row 4 */
    { x: 0, y: 4, d: 'L', L: 9, name: 'The Ward Screen', what: 'the screen the D.U.M.B.\'s sleepers read through', from: 'Library: THE SCREEN · BACK TO THE WARD (label mine)', ports: 'NE', way: 'dumb_astral' },
    { x: 1, y: 4, d: 'L', L: 8, name: 'The Returns', what: 'the desk where the ideas come back unread; the steps down to the Sea', from: 'new plot (label mine)', ports: 'NWS' },
    { x: 2, y: 4, d: 'S', L: 7, name: 'The Impossible Stair', what: 'the stair that goes up and comes back to the bottom', from: 'Sea: the impossible stair', ports: 'NES' },
    { x: 3, y: 4, d: 'S', L: 6, name: 'The Still Water', what: 'a pool that shows what you were going to do instead', from: 'new plot (label mine)', ports: 'NWS' },
    { x: 4, y: 4, d: 'N', L: 2, name: 'The Thing Under It', what: 'it stood up; it is taller than you thought', from: 'Nightmare: THE THING UNDER IT', ports: 'NES' },
    { x: 5, y: 4, d: 'N', L: 3, name: 'The Attic Screen', what: 'the home movies nobody remembers shooting: the Haunted House\'s attic', from: 'Nightmare: THE SCREEN · UP INTO THE ATTIC (label mine)', ports: 'NWS', way: 'attic_nightmare' },
    /* row 5 */
    { x: 0, y: 5, d: 'S', L: 6, name: 'The Far Shore', what: 'the last island west: dead trees, a door stack, the eyes', from: 'new plot (label mine)', ports: 'E' },
    { x: 1, y: 5, d: 'S', L: 7, name: 'The Hollow Tree', what: 'the hollow tree; the steps up to the Library\'s Returns', from: 'Sea: the hollow tree', ports: 'NWE' },
    { x: 2, y: 5, d: 'S', L: 8, name: 'The Spire', what: 'the unfinished spire: somebody is still not thinking of it', from: 'Sea: THE SPIRE (its tape, its line)', ports: 'NW', style: 'small' },
    { x: 3, y: 5, d: 'S', L: 5, name: 'The Edge', what: 'where the Sea stops; the Watcher is nearest here', from: 'new plot (label mine)', ports: 'N', style: 'small' },
    { x: 4, y: 5, d: 'N', L: 1, name: 'The Blood', what: 'the blood is not blood: it is lava, do not step in it', from: 'Nightmare: the lava pool (label mine)', ports: 'NE' },
    { x: 5, y: 5, d: 'N', L: 1, name: 'The Maw', what: 'the mouth: the teeth are for whatever you were going to say; the lowest ground in the Realm', from: 'Nightmare: THE MAW', ports: 'NW', style: 'wide' },
];
const WAYS = [
    { id: 'waiting', plot: 'P02-00', kind: 'door', to: 'inside: the Waiting Room (take a number)', col: '#ffc040' },
    { id: 'library', plot: 'P01-00', kind: 'door', to: 'inside: the Waiting Room', col: '#ffc040' },
    { id: 'nightmare', plot: 'P05-01', kind: 'door', to: 'inside: the Waiting Room', col: '#ffc040' },
    { id: 'mirror', plot: 'P03-00', kind: 'door', to: 'Camelot: the Looking-Glass Garden (the mirror, two-way)', col: '#40e070' },
    { id: 'dumb_astral', plot: 'P00-04', kind: 'link', to: 'The D.U.M.B.: Dream Research (a screen)', col: '#ff70e0' },
    { id: 'attic_nightmare', plot: 'P05-04', kind: 'link', to: 'The Estate: the Haunted House attic (a screen)', col: '#ff70e0' },
];
const N = 12, GX = 6, GY = 6, W = N * GX, H = N * GY;
const pid = (x, y) => 'P0' + x + '-0' + y, at = {};
PLOTS.forEach(p => { p.id = pid(p.x, p.y); at[p.id] = p; });
const mk = s => { let v = s >>> 0; return () => { v = (v * 1664525 + 1013904223) >>> 0; return v / 4294967296; }; };
const cells = []; for (let y = 0; y < H; y++) cells.push(new Array(W).fill('.'));
const OPP = { N: 'S', S: 'N', E: 'W', W: 'E' }, DXY = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] };
for (const p of PLOTS) {
    const rnd = mk(9173 * (p.x + 1) + 131 * (p.y + 1)), ri = (a, b) => a + Math.floor(rnd() * (b - a + 1)), D = DIST[p.d], g = [];
    for (let y = 0; y < N; y++) g.push(new Array(N).fill('.'));
    const fill = (x0, y0, x1, y1, ch) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (x >= 1 && y >= 1 && x <= 10 && y <= 10) g[y][x] = ch; };
    const style = p.style || 'isle';
    if (style === 'stones') {   // a small middle island, three satellites, cloud squares between
        fill(4, 4, 7, 7, D.ground); fill(1, 1, 2, 2, D.ground); fill(9, 2, 10, 3, D.ground); fill(1, 8, 3, 9, D.ground); fill(8, 8, 10, 10, D.ground);
        g[7][3] = 'k'; g[2][3] = 'k'; g[2][4] = 'k'; g[3][7] = 'k'; g[3][8] = 'k'; g[9][7] = 'k';   // one cloud square or two from the walk to each satellite
    } else {
        let x0 = 1 + ri(0, 1), y0 = 1 + ri(0, 1), x1 = 10 - ri(0, 1), y1 = 10 - ri(0, 1);
        if (style === 'small') { x0 = 2 + ri(0, 1); y0 = 2 + ri(0, 1); x1 = 9 - ri(0, 1); y1 = 9 - ri(0, 1); }
        if (style === 'wide') { x0 = 1; y0 = 1; x1 = 10; y1 = 10; }
        fill(x0, y0, x1, y1, D.ground);
        /* the corners go (a stepped round), then one or two bites out of a side with no port */
        [[x0, y0, 1, 1], [x1, y0, -1, 1], [x0, y1, 1, -1], [x1, y1, -1, -1]].forEach(([cx, cy, sx, sy]) => { const s = style === 'wide' ? ri(2, 3) : ri(1, 3);
            for (let a = 0; a < s; a++) for (let b = 0; a + b < s; b++) { const X = cx + a * sx, Y = cy + b * sy; if (X >= 0 && Y >= 0 && X < N && Y < N) g[Y][X] = '.'; } });
        const sides = 'NESW'.split('').filter(s => !p.ports.includes(s)), nb = Math.min(sides.length, style === 'small' ? 0 : ri(1, 2));
        for (let b = 0; b < nb; b++) { const s = sides[b % sides.length], len = ri(2, 3), dep = ri(1, 2), t = ri(3, 6);
            for (let a = 0; a < len; a++) for (let d = 0; d < dep; d++) { const X = s === 'W' ? x0 + d : s === 'E' ? x1 - d : t + a, Y = s === 'N' ? y0 + d : s === 'S' ? y1 - d : t + a; g[Y][X] = '.'; } }
    }
    /* the walks: from every port straight to the middle, two squares wide; the plot's edge squares at a port are the bridge */
    for (const s of p.ports) { const [dx, dy] = DXY[s];
        for (let t = 0; t <= 5; t++) for (const m of [5, 6]) { const X = dx ? (dx > 0 ? 11 - t : t) : m, Y = dy ? (dy > 0 ? 11 - t : t) : m; g[Y][X] = t === 0 ? 'k' : D.path; } }
    if (style !== 'stones') for (const [X, Y] of [[5, 5], [6, 5], [5, 6], [6, 6]]) g[Y][X] = D.path;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) cells[p.y * N + y][p.x * N + x] = g[y][x];
}
/* every port has its other side */
const OPEN = [];
for (const p of PLOTS) for (const s of p.ports) { const q = at[pid(p.x + DXY[s][0], p.y + DXY[s][1])];
    if (!q || !q.ports.includes(OPP[s])) throw new Error('one-sided port ' + p.id + ' ' + s);
    if (Math.abs(p.L - q.L) > 2) throw new Error('too steep ' + p.id + ' ' + q.id);
    if (s === 'E' || s === 'S') OPEN.push({ a: p.id, b: q.id, kind: p.L === q.L ? 'bridge' : 'steps', cross: p.d !== q.d }); }
const layout = { area: 'The Astral Realm', version: 'plan-3', approved: 'not yet seen: built on mondo\'s standing order of 11-16 (no waiting)', squareMeters: 3.5, plotCells: N, cols: GX, rows: GY, levelMeters: 1.75,
    districts: Object.fromEntries(Object.keys(DIST).map(k => [k, DIST[k].name])), legend: LEGEND,
    plots: PLOTS.map(p => ({ id: p.id, name: p.name, d: p.d, level: p.L, what: p.what, from: p.from, ports: p.ports, style: p.style || 'isle', way: p.way || null })),
    openings: OPEN, ways: WAYS.map(w => ({ id: w.id, plot: w.plot, kind: w.kind, to: w.to })), cells: cells.map(r => r.join('')),
    levelsNote: 'Every plot is an island at level x 1.75 m over the void. The Library climbs to the Stacks (14 = 24.5 m), the Nightmare sinks to the Maw (1 = 1.75 m), the Sea winds between (5 to 10).' };
const json = JSON.stringify(layout, null, 0).replace(/\{"id"/g, '\n{"id"').replace(/"cells":\[/, '\n"cells":[\n').replace(/","(?=[.a-zA-Z]{72}")/g, '",\n"');
fs.mkdirSync(path.join(REPO, 'docs/areas/astral/districts'), { recursive: true });
fs.writeFileSync(path.join(REPO, 'docs/areas/astral/layout.json'), json + '\n');
fs.writeFileSync(path.join(__dirname, 'astral-realm-layout-3.json'), json + '\n');

/* ── the picture ── */
const COL = { '.': '#150f2a', g: '#7a62d8', m: '#e9e6f6', j: '#b08a55', c: '#7a3f58', R: '#a8323e', h: '#5c2630', k: '#ffffff', w: '#5fc8e8', l: '#ff7a1c' };
const SQ = 13, OX = 60, OY = 96, Wd = OX + W * SQ + 470, Ht = OY + H * SQ + 60, o = [];
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
o.push(`<rect width="${Wd}" height="${Ht}" fill="#16181a"/>`);
o.push(`<text x="${OX}" y="34" fill="#fff" font-size="21" font-weight="bold">THE ASTRAL REALM  ·  plot plan 3  ·  6 x 6 plots, every plot an island over the void  ·  one plot = 12 x 12 squares of 3.5 m</text>`);
o.push(`<text x="${OX}" y="58" fill="#bbb" font-size="13">No ground: islands at their own heights, joined only by cloud bridges and floating steps. The Library climbs to the Stacks, the Nightmare sinks to the Maw, the Sea winds between.</text>`);
o.push(`<text x="${OX}" y="78" fill="#bbb" font-size="13">L = the island's height in levels of 1.75 m. A fall into the void puts you back on the last ground you stood on.</text>`);
/* a faint height shade under each island: higher = lighter */
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const ch = cells[y][x]; o.push(`<rect x="${OX + x * SQ}" y="${OY + y * SQ}" width="${SQ}" height="${SQ}" fill="${COL[ch]}"/>`); }
for (const p of PLOTS) { const X = OX + p.x * N * SQ, Y = OY + p.y * N * SQ, D = DIST[p.d];
    o.push(`<rect x="${X}" y="${Y}" width="${N * SQ}" height="${N * SQ}" fill="none" stroke="${D.col}" stroke-opacity="0.55" stroke-width="1"/>`);
    o.push(`<text x="${X + 4}" y="${Y + 13}" fill="#fff" font-size="11.5" font-weight="bold" stroke="#000" stroke-width="2.6" paint-order="stroke">${esc(p.name)}</text>`);
    o.push(`<text x="${X + 4}" y="${Y + 25}" fill="#ffe9a0" font-size="9.5" stroke="#000" stroke-width="2.2" paint-order="stroke">${p.id}  L${p.L}  ${(p.L * 1.75).toFixed(1)} m</text>`); }
for (const op of OPEN) { const a = at[op.a], b = at[op.b], ns = a.x === b.x, X = OX + (ns ? a.x * N + 6 : b.x * N) * SQ, Y = OY + (ns ? b.y * N : a.y * N + 6) * SQ;
    if (op.kind === 'steps') o.push(`<text x="${X}" y="${Y + 4}" text-anchor="middle" fill="#111" font-size="10" font-weight="bold">${ns ? (a.L > b.L ? '▼' : '▲') : (a.L > b.L ? '▶' : '◀')}</text>`);
    if (op.cross) o.push(`<circle cx="${X}" cy="${Y}" r="15" fill="none" stroke="#ffe040" stroke-width="2.5"/>`); }
for (const w of WAYS) { const p = at[w.plot], X = OX + (p.x * N + 6) * SQ, Y = OY + (p.y * N + 8.5) * SQ;
    o.push(`<circle cx="${X}" cy="${Y}" r="6.5" fill="${w.col}" stroke="#000" stroke-width="1.5"/>`);
    o.push(`<text x="${X}" y="${Y + 19}" text-anchor="middle" fill="${w.col}" font-size="9.5" stroke="#000" stroke-width="2.4" paint-order="stroke">${esc(w.to.split(' (')[0])}</text>`); }
o.push(`<rect x="${OX}" y="${OY}" width="${W * SQ}" height="${H * SQ}" fill="none" stroke="#fff" stroke-width="2"/>`);
let ly = OY + 6; const LX = OX + W * SQ + 28, T = (s, c, b, sz) => { o.push(`<text x="${LX}" y="${ly}" fill="${c || '#ddd'}" font-size="${sz || 12}" ${b ? 'font-weight="bold"' : ''}>${esc(s)}</text>`); ly += (sz || 12) + 7; };
T('DISTRICTS', '#fff', 1, 14); for (const k of Object.keys(DIST)) { o.push(`<rect x="${LX}" y="${ly - 11}" width="13" height="13" fill="${DIST[k].col}" stroke="#fff"/>`); o.push(`<text x="${LX + 20}" y="${ly}" fill="#ddd" font-size="12">${k}  ${esc(DIST[k].name)}  (${PLOTS.filter(p => p.d === k).length} plots)</text>`); ly += 19; }
ly += 8; T('SQUARES', '#fff', 1, 14); for (const k of Object.keys(LEGEND)) { o.push(`<rect x="${LX}" y="${ly - 11}" width="13" height="13" fill="${COL[k]}" stroke="#888"/>`); o.push(`<text x="${LX + 20}" y="${ly}" fill="#ddd" font-size="11">${esc(LEGEND[k].slice(0, 62))}</text>`); ly += 18; }
ly += 8; T('WAYS', '#fff', 1, 14); for (const w of WAYS) { o.push(`<circle cx="${LX + 6}" cy="${ly - 4}" r="6" fill="${w.col}" stroke="#000"/>`); o.push(`<text x="${LX + 20}" y="${ly}" fill="#ddd" font-size="11">${esc(w.to.slice(0, 64))}</text>`); ly += 18; }
o.push(`<circle cx="${LX + 6}" cy="${ly - 4}" r="7" fill="none" stroke="#ffe040" stroke-width="2.5"/>`); o.push(`<text x="${LX + 20}" y="${ly}" fill="#ddd" font-size="11">a crossing between two districts (4 in all)</text>`); ly += 18;
T('▲▼◀▶ floating steps, pointing down; a plain white bridge = level', '#ddd', 0, 11);
ly += 8; T('WHO LIVES HERE', '#fff', 1, 14);
['Sea: watcher, fortune teller, telepath, siren, dreameater;', '  visitors glitch, machine elves, occulus, orb of light, voidweaver', 'Library: telepath, watcher, mad scientist, fortune teller', 'Nightmare: shadow entity, dreameater, ghoul, succubus'].forEach(s => T(s, '#ccc', 0, 11));
ly += 8; T('LANDMARKS (one a district)', '#fff', 1, 14);
['Sea: the Thought-Forms (columns, pool, orb)', 'Library: the Stacks (the highest island, 24.5 m)', 'Nightmare: the Bed (in its bowl); the Maw at the bottom'].forEach(s => T(s, '#ccc', 0, 11));
ly += 8; T('WHAT CHANGED FROM PLAN 2', '#fff', 1, 14);
['1 No floor: 36 islands over the void, not three flat strips.', '2 Heights tell the districts apart: up = Library, down = Nightmare.', '3 The Sea is an S between them, not a middle strip.', '4 Four crossings, each a bridge you can see; no walls needed.', '5 The Mirror island is the door from Camelot\'s garden.', '  The Waiting Room stays the inside, a frame to each district.'].forEach(s => T(s, '#ccc', 0, 11));
T('This is a plan drawing, not the game.', '#888', 0, 10);
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${Wd}" height="${Ht}" viewBox="0 0 ${Wd} ${Ht}" font-family="DejaVu Sans, Arial, sans-serif">${o.join('')}</svg>`;
console.log(`astral plan 3: ${PLOTS.length} plots (${Object.keys(DIST).map(k => k + ' ' + PLOTS.filter(p => p.d === k).length).join(', ')}), ${OPEN.length} openings (${OPEN.filter(q => q.cross).length} cross a district line), ${WAYS.length} ways`);
if (process.argv.includes('--no-png')) process.exit(0);
(async () => {
    let pw; try { pw = require('playwright'); } catch (e) { try { pw = require('/opt/node-tools/node_modules/playwright'); } catch (e2) { fs.writeFileSync(path.join(__dirname, 'astral-realm_plot_plan_3.svg'), svg); console.log('no playwright: the .svg was written'); return; } }
    let exe; try { exe = require(path.join(REPO, 'probe-fast.js')).EXE; } catch (e) {}
    const b = await pw.chromium.launch(exe ? { executablePath: exe, args: ['--no-sandbox'] } : {}); const pg = await b.newPage({ viewport: { width: Wd, height: Ht } });
    await pg.setContent(`<body style="margin:0;background:#16181a">${svg}</body>`); await pg.screenshot({ path: path.join(__dirname, 'astral-realm_plot_plan_3.png') }); await b.close();
    console.log('wrote astral-realm_plot_plan_3.png');
})();
