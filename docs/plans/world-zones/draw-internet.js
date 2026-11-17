/* THE INTERNET, PLOT PLAN 2 (2026-11-17; mondo: "The internet can be made a lot bigger and better and more detail. Do a new layout ...
   Lots of opportunities for unique landmarks and terrain and elevation and geography and pathways ... information highway. Moving platforms
   that are like mail ... It should be like a mix of the astral realm and a cyberpunk city"). Plan 1 (36 plots, four districts, mondo's OK
   11-17) is kept inside it: the Server Farm, the Feed, the Forums and the Dark Web stand, each grown or moved.
   `node docs/plans/world-zones/draw-internet.js` writes:
     docs/areas/internet/layout.json                  the layout bake-internet.js reads (every plot + the 108 x 108 square map)
     docs/plans/world-zones/internet_plot_plan.png    the picture (an SVG shot with playwright; `--no-png` skips it)

   WHAT IT IS: one room, 9 x 9 plots of 12 x 12 squares (378 m a side), 71 of the 81 plots built, NO GROUND (the Astral Realm's machinery:
   the void + float plateaus). Every plot is a tile hanging over a glowing grid at its own height; the ten empty plots are open sky.
   NINE DISTRICTS:
     H THE INFORMATION HIGHWAY (12 plots, level 10): a road six squares wide, a cross: west to east through the middle of the room and a
       leg north and south. Every district hangs off it. Landmark: THE EXCHANGE, the crossing.
     S THE SERVER FARM (north-west, 9): ONE floor, the data hall, level 8. You arrive at its north-west corner (the D.U.M.B.'s screen).
     M THE INBOX (5): the mail. Between the Server Farm and the Highway; the Spam Folder under it. The MAIL (moving platforms) flies from here.
     F THE FEED (north-east, 9): the BOULEVARD, level 12, giant screens down both sides; stages above it, the Comment Section below.
     V THE STREAM (east, 6): the streamers' studios (walk-in), the VR Arcade on the highest tile in the room (level 14).
     C POPUP CITY (south-east of the crossing, 8): a block of towers on one deck, every wall an ad, every corner a pop-up window.
     B THE FORUMS (south-east, 7): plazas of message boards. Landmark: the Mod Tower.
     K THE MOTHERBOARD (south-west of the crossing, 6): three terraces of circuit board, levels 8 / 6 / 4, chips for buildings.
     D THE DARK WEB (south-west, 9): UNDERNEATH: it sinks from level 8 at the Onion Gate to level 1, the Bottom, right over the grid.
   Every name here is a label of mine (plain names, owner-rules.md "Place names are plain and cheap"), marked so in `from`.
   x, y = the plot's place. L = height in levels of 1.75 m. A plot lists only its EAST and SOUTH joins (`j`): E / S = a narrow join (a
   bridge when level, floating steps when one or two levels apart), e / s = a WIDE join (the two floors run into each other, no gap);
   the other plot's side is worked out. style: slab (floor to its edges) | blvd (the Feed's boulevard) | hwy (the Highway: `ax` ew | ns |
   x) | isle | ragged | small | deck (the Motherboard's terrace: floor to the edge on its wide sides). */
'use strict';
const fs = require('fs'), path = require('path');
const REPO = path.join(__dirname, '..', '..', '..');
const DIST = {
    H: { name: 'The Information Highway', col: '#ffe040', file: 'docs/areas/internet/districts/H.js', ground: 'h', path: 'r' },
    S: { name: 'The Server Farm', col: '#3fa0ff', file: 'docs/areas/internet/districts/S.js', ground: 's', path: 'a' },
    M: { name: 'The Inbox', col: '#f4f4f4', file: 'docs/areas/internet/districts/M.js', ground: 'm', path: 'e' },
    F: { name: 'The Feed', col: '#ff5fb0', file: 'docs/areas/internet/districts/F.js', ground: 'f', path: 'v' },
    V: { name: 'The Stream', col: '#b070ff', file: 'docs/areas/internet/districts/V.js', ground: 'g', path: 'y' },
    C: { name: 'Popup City', col: '#40e0ff', file: 'docs/areas/internet/districts/C.js', ground: 'c', path: 'n' },
    B: { name: 'The Forums', col: '#ffb040', file: 'docs/areas/internet/districts/B.js', ground: 'b', path: 'p' },
    K: { name: 'The Motherboard', col: '#30c060', file: 'docs/areas/internet/districts/K.js', ground: 't', path: 'i' },
    D: { name: 'The Dark Web', col: '#a03040', file: 'docs/areas/internet/districts/D.js', ground: 'd', path: 'x' },
};
const LEGEND = { '.': 'open sky over the grid (a fall sends you back)', h: 'the Highway\'s shoulder', r: 'the Highway\'s road (a walk)', s: 'the data hall\'s raised floor', a: 'an aisle (a walk)',
    m: 'the Inbox\'s paper-white tile', e: 'a mail walk', f: 'the Feed\'s glass', v: 'the boulevard (a walk)', g: 'the Stream\'s stage floor', y: 'a Stream walk', c: 'Popup City\'s deck', n: 'a street (a walk)',
    b: 'a forum plaza', p: 'a forum walk', t: 'circuit board', i: 'a trace (a walk)', d: 'the Dark Web\'s black tile', x: 'a dark walk', k: 'a bridge or a flight of floating steps between two tiles' };
const M = '(label mine)';
const R = (x, y, d, L, name, what, j, style, o) => Object.assign({ x, y, d, L, name, what, from: M, j: j || '', style }, o || {});
const PLOTS = [
    /* S THE SERVER FARM: one data hall, wide joins all through */
    R(0, 0, 'S', 8, 'The Login Screen', 'the screen you come in through: the D.U.M.B. Control Room is behind it; the healing ring', 'es', 'slab', { way: 'dumb_internet' }),
    R(1, 0, 'S', 8, 'The Cold Aisle', 'racks facing racks, the cold air coming up through the floor', 'es', 'slab'),
    R(2, 0, 'S', 8, 'The Cooling Towers', 'the chillers and the fans the size of rooms', 's', 'slab'),
    R(0, 1, 'S', 8, 'The Hot Aisle', 'the backs of the racks: the heat, the cables', 'es', 'slab'),
    R(1, 1, 'S', 8, 'The Cloud', 'LANDMARK: the cloud everybody keeps their photos in, which is somebody else\'s computer', 'es', 'slab'),
    R(2, 1, 'S', 8, 'The Uplink', 'the trunk cables out to the Inbox and the Highway', 'sE', 'slab'),
    R(0, 2, 'S', 8, 'The Backup Tapes', 'shelves of tapes nobody has ever restored from', 'eS', 'slab'),
    R(1, 2, 'S', 8, 'The Cable Mess', 'every cable ever, under one floor tile', 'eS', 'slab'),
    R(2, 2, 'S', 8, 'The Recycle Bin', 'everything deleted, kept', '', 'slab'),
    /* M THE INBOX */
    R(3, 0, 'M', 10, 'The Outbox', 'letters leaving: the envelopes take off from here', 'S', 'isle'),
    R(3, 1, 'M', 9, 'The Inbox', '4,096 unread: a hill of envelopes', 'S', 'isle'),
    R(3, 2, 'M', 9, 'The Sorting Office', 'a walk-in mail room: pigeonholes to the ceiling', 'E', 'isle'),
    R(0, 3, 'M', 7, 'The Spam Folder', 'the junk: you have won, again', 'E', 'ragged'),
    R(1, 3, 'M', 8, 'The Mail Dock', 'where the mail platforms land and leave for the Highway', 'S', 'isle'),
    /* F THE FEED: the boulevard (row 1) + six side plots */
    R(5, 0, 'F', 13, 'The Influencer Stage', 'ring lights, a set, a live stream nobody is watching', 'S', 'isle'),
    R(6, 0, 'F', 14, 'Trending', 'the highest stage on the Feed: today\'s hashtag, tomorrow\'s nothing', 'S', 'isle'),
    R(7, 0, 'F', 13, 'The Unboxing', 'boxes opened on camera, the boxes kept', 'SE', 'isle'),
    R(5, 1, 'F', 12, 'The Timeline', 'the boulevard\'s start: the screens begin', 'eS', 'blvd'),
    R(6, 1, 'F', 12, 'The Infinite Scroll', 'the boulevard: the screens go on', 'eS', 'blvd'),
    R(7, 1, 'F', 12, 'The For You Page', 'LANDMARK: the boulevard\'s end: the biggest screen, and it is looking at you', 'S', 'blvd'),
    R(5, 2, 'F', 10, 'The Comment Section', 'a sunk pit off the boulevard: everybody shouting at once', '', 'isle'),
    R(6, 2, 'F', 11, 'Sponsored', 'the ads: a plaza that is all ads', 'S', 'isle'),
    R(7, 2, 'F', 12, 'Going Viral', 'the stage everybody wants, for fifteen minutes', 'ES', 'isle'),
    /* V THE STREAM */
    R(8, 0, 'V', 14, 'The VR Arcade', 'the highest tile in the Internet: a walk-in arcade, headsets on stands, nobody is really here', 'S', 'isle'),
    R(8, 1, 'V', 13, 'The V-Tuber Studio', 'a walk-in studio: a green wall, a rig of cameras, the avatar on the big screen', 'S', 'isle'),
    R(8, 2, 'V', 12, 'The Streamer\'s Room', 'a walk-in bedroom that is a set: the chair, the lights, the wall of figures', 'S', 'isle'),
    R(8, 3, 'V', 11, 'Character Select', 'a ring of pedestals: pick who you are today', 'S', 'isle'),
    R(7, 3, 'V', 11, 'The Lobby', 'waiting for players: the queue, the loading ring', 'E', 'isle'),
    R(6, 3, 'V', 10, 'The Chat', 'the chat going by too fast to read', 'ES', 'isle'),
    /* H THE INFORMATION HIGHWAY: level 10, wide joins end to end */
    R(4, 2, 'H', 10, 'The On-Ramp', 'the Highway\'s north end: merge', 'sE', 'hwy', { ax: 'ns', end: 'N' }),
    R(4, 3, 'H', 10, 'Bandwidth', 'the north leg: the mail lands on its west side', 's', 'hwy', { ax: 'ns' }),
    R(1, 4, 'H', 10, 'Dial-Up', 'the west end: the slow old road, the modem tower', 'eS', 'hwy', { ax: 'ew', end: 'W' }),
    R(2, 4, 'H', 10, 'The Slow Lane', 'the road east: gantries, the packets go by', 'e', 'hwy', { ax: 'ew' }),
    R(3, 4, 'H', 10, 'The Paywall', 'a toll gate across the road: subscribe to read on', 'e', 'hwy', { ax: 'ew' }),
    R(4, 4, 'H', 10, 'The Exchange', 'LANDMARK: the crossing: the router tower every packet goes through', 'es', 'hwy', { ax: 'x' }),
    R(5, 4, 'H', 10, 'Fibre', 'the road east: light in glass', 'eS', 'hwy', { ax: 'ew' }),
    R(6, 4, 'H', 10, 'Buffering', 'the traffic jam: the ring going round', 'e', 'hwy', { ax: 'ew' }),
    R(7, 4, 'H', 10, 'The Speed Test', 'a gantry that tells you how slow you are', 'eS', 'hwy', { ax: 'ew' }),
    R(8, 4, 'H', 10, 'The Last Mile', 'the east end', 'S', 'hwy', { ax: 'ew', end: 'E' }),
    R(4, 5, 'H', 10, 'The Backbone', 'the south leg', 'sE', 'hwy', { ax: 'ns' }),
    R(4, 6, 'H', 10, 'The Dead Link', 'the road ends in the air: the Globe hangs past it', 'E', 'hwy', { ax: 'ns', end: 'S' }),
    /* K THE MOTHERBOARD: three terraces */
    R(2, 5, 'K', 8, 'The Switch Bank', 'rows of switches the size of doors: on, off', 'eS', 'deck'),
    R(3, 5, 'K', 8, 'The Processor', 'LANDMARK: the chip under its fan, everything goes through it', 'S', 'deck'),
    R(2, 6, 'K', 6, 'The Memory', 'memory sticks standing like tower blocks', 'eS', 'deck'),
    R(3, 6, 'K', 6, 'The Capacitors', 'a wood of capacitors and coils', 'S', 'deck'),
    R(2, 7, 'K', 4, 'The Binary Falls', 'ones and noughts pouring off the board\'s edge', 'e', 'deck'),
    R(3, 7, 'K', 4, 'The Battery', 'the little round battery that remembers the time', '', 'deck'),
    /* D THE DARK WEB: underneath, sinking */
    R(1, 5, 'D', 8, 'The Onion Gate', 'the way in from the Highway: layers and layers', 'ES', 'ragged'),
    R(0, 5, 'D', 6, 'The Mirror Sites', 'the same stall three times', 'ES', 'ragged'),
    R(0, 6, 'D', 5, 'The Crawlers', 'the things that read every page', 'ES', 'ragged'),
    R(1, 6, 'D', 6, 'The Black Market', 'stalls selling what nobody will name', 'S', 'ragged'),
    R(0, 7, 'D', 3, 'The Forgotten Servers', 'servers nobody pays for that are still on', 'ES', 'ragged'),
    R(1, 7, 'D', 4, 'The Bazaar', 'more stalls, fewer lights', 'ES', 'ragged'),
    R(0, 8, 'D', 1, 'The Bottom', 'LANDMARK: the lowest tile in the Internet, right over the grid', 'E', 'ragged'),
    R(1, 8, 'D', 2, 'The Hacker Den', 'a walk-in den: screens in the dark and somebody typing very fast', 'E', 'ragged'),
    R(2, 8, 'D', 3, 'Page Not Found', 'a tile that is mostly missing', '', 'small'),
    /* C POPUP CITY: four plots on one deck + four round it */
    R(5, 5, 'C', 9, 'Popup Plaza', 'pop-up windows standing in the square: you are the millionth visitor', 'es', 'slab'),
    R(6, 5, 'C', 9, 'The Ad Block', 'towers that are all billboard', 'sE', 'slab'),
    R(5, 6, 'C', 9, 'Captcha Square', 'a square of nine squares: pick every one with a traffic light', 'eS', 'slab'),
    R(6, 6, 'C', 9, 'The Search Bar', 'LANDMARK: the tallest tower in the city: it finishes your question for you', 'ES', 'slab'),
    R(7, 5, 'C', 10, 'The Checkout', 'a shopping cart the size of a house, the parcels', 'ES', 'isle'),
    R(7, 6, 'C', 10, 'The Cookie Banner', 'a wall across the plaza: accept all', 'E', 'isle'),
    R(5, 7, 'C', 7, 'Clickbait Alley', 'a low back street of signs: number 7 will shock you', 'E', 'isle'),
    R(6, 7, 'C', 8, 'The Quarantine', 'the viruses, kept behind glass: do not open', 'E', 'isle'),
    /* B THE FORUMS */
    R(8, 5, 'B', 10, 'The Front Page', 'the board everybody reads first', 'S', 'isle'),
    R(8, 6, 'B', 9, 'General Discussion', 'the boards', 'S', 'isle'),
    R(8, 7, 'B', 9, 'The Flame War', 'a plaza on fire; nobody remembers what started it', 'S', 'isle'),
    R(7, 7, 'B', 8, 'Off-Topic', 'everything else', 'ES', 'isle'),
    R(7, 8, 'B', 8, 'The Archive', 'a walk-in library of threads nobody has posted in for years; somebody just did', 'E', 'isle'),
    R(6, 8, 'B', 7, 'Lurkers\' Corner', 'everybody who reads and never posts', 'E', 'small'),
    R(8, 8, 'B', 10, 'The Mod Tower', 'LANDMARK: the moderators\' tower and the ban hammer', '', 'isle'),
];
const WAYS = [
    { id: 'dumb_internet', plot: 'P00-00', side: 'N', kind: 'link', to: 'The D.U.M.B.: the Control Room\'s servers (a screen)', col: '#7fffd0' },
];
const N = 12, GX = 9, GY = 9, W = N * GX, H = N * GY;
const pid = (x, y) => 'P0' + x + '-0' + y, at = {};
PLOTS.forEach(p => { p.id = pid(p.x, p.y); if (at[p.id]) throw new Error('two plots at ' + p.id); at[p.id] = p; p.ports = ''; });
/* the joins: a plot's E / S letters give both plots their port */
const OPP = { N: 'S', S: 'N', E: 'W', W: 'E' }, DXY = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] };
for (const p of PLOTS) for (const c of p.j) { const s = c.toUpperCase(), wide = c !== s, q = at[pid(p.x + DXY[s][0], p.y + DXY[s][1])];
    if (s !== 'E' && s !== 'S') throw new Error('a plot lists only E and S joins: ' + p.id); if (!q) throw new Error('a join into the sky: ' + p.id + ' ' + s);
    p.ports += wide ? s.toLowerCase() : s; q.ports += wide ? OPP[s].toLowerCase() : OPP[s]; }
const mk = s => { let v = s >>> 0; return () => { v = (v * 1664525 + 1013904223) >>> 0; return v / 4294967296; }; };
const cells = []; for (let y = 0; y < H; y++) cells.push(new Array(W).fill('.'));
const portsOf = p => p.ports.split('').map(c => ({ s: c.toUpperCase(), wide: c !== c.toUpperCase() }));
/* THE HIGHWAY'S BAND: the road = squares 3..8 across (six, 21 m), a shoulder square each side (2 and 9) */
const B0 = 2, B1 = 9, R0 = 3, R1 = 8;
for (const p of PLOTS) {
    const rnd = mk(9173 * (p.x + 1) + 131 * (p.y + 1)), ri = (a, b) => a + Math.floor(rnd() * (b - a + 1)), D = DIST[p.d], g = [], P = portsOf(p);
    const wideOn = s => P.some(q => q.s === s && q.wide);
    for (let y = 0; y < N; y++) g.push(new Array(N).fill('.'));
    const fill = (x0, y0, x1, y1, ch) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (x >= 0 && y >= 0 && x < N && y < N) g[y][x] = ch; };
    const style = p.style;
    if (style === 'slab' || style === 'blvd' || style === 'deck') {
        /* floor to the plot's edge on a wide side, one square of sky on the others */
        const x0 = wideOn('W') ? 0 : 1, x1 = wideOn('E') ? 11 : 10, y0 = wideOn('N') ? 0 : 1, y1 = wideOn('S') ? 11 : 10;
        if (style === 'blvd') fill(x0, 1, x1, 10, D.ground); else fill(x0, y0, x1, y1, D.ground);
    } else if (style === 'hwy') {
        /* the band along the axis; the crossing = both bands + a round deck; a closed end stops two squares short of the plot's line */
        const ew = p.ax !== 'ns', ns = p.ax !== 'ew';
        if (ew) fill(p.end === 'W' ? 2 : 0, B0, p.end === 'E' ? 9 : 11, B1, D.ground);
        if (ns) fill(B0, p.end === 'N' ? 2 : 0, B1, p.end === 'S' ? 9 : 11, D.ground);
        if (p.ax === 'x') { fill(1, 1, 10, 10, D.ground); [[1, 1], [10, 1], [1, 10], [10, 10]].forEach(([x, y]) => { g[y][x] = '.'; }); }
        if (ew) for (let x = 0; x < N; x++) for (let y = R0; y <= R1; y++) if (g[y][x] !== '.') g[y][x] = D.path;
        if (ns) for (let y = 0; y < N; y++) for (let x = R0; x <= R1; x++) if (g[y][x] !== '.') g[y][x] = D.path;
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
    /* the walks. The data hall, Popup City's deck and the Motherboard: a grid of aisles (rows and columns 5-6 of every plot). The boulevard:
       a band four squares wide (rows 4-7). The Highway: its road. Everywhere else: from every port straight to the middle, two squares
       wide; a plot's edge squares at a narrow port = the bridge */
    if (style === 'slab' || style === 'deck') { for (let t = 0; t < N; t++) for (const m of [5, 6]) { if (g[m][t] !== '.') g[m][t] = D.path; if (g[t][m] !== '.') g[t][m] = D.path; } }
    if (style === 'blvd') for (let x = 0; x < N; x++) for (let y = 4; y <= 7; y++) if (g[y][x] !== '.') g[y][x] = D.path;
    for (const q of P) { if (q.wide) continue; const [dx, dy] = DXY[q.s], reach = style === 'hwy' ? 2 : 5;
        for (let t = 0; t <= reach; t++) for (const m of [5, 6]) { const X = dx ? (dx > 0 ? 11 - t : t) : m, Y = dy ? (dy > 0 ? 11 - t : t) : m; g[Y][X] = t === 0 ? 'k' : (g[Y][X] === D.path ? D.path : D.path); } }
    if (style !== 'slab' && style !== 'blvd' && style !== 'hwy' && style !== 'deck') for (const [X, Y] of [[5, 5], [6, 5], [5, 6], [6, 6]]) g[Y][X] = D.path;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) cells[p.y * N + y][p.x * N + x] = g[y][x];
}
/* the inner corners of a floor of wide-joined plots (the data hall, Popup City's deck): where four meet, the corner squares are floor */
for (const p of PLOTS) if (p.style === 'slab') for (const [lx, ly, dx, dy] of [[11, 11, 1, 1], [0, 11, -1, 1], [11, 0, 1, -1], [0, 0, -1, -1]]) {
    const q = at[pid(p.x + dx, p.y)], r = at[pid(p.x, p.y + dy)], s = at[pid(p.x + dx, p.y + dy)];
    if (q && r && s && [q, r, s].every(o => o.style === 'slab' && o.d === p.d && o.L === p.L)) cells[p.y * N + ly][p.x * N + lx] = DIST[p.d].ground; }
/* every port has its other side, of the same width */
const OPEN = [];
for (const p of PLOTS) for (const { s, wide } of portsOf(p)) { const q = at[pid(p.x + DXY[s][0], p.y + DXY[s][1])];
    const back = q && portsOf(q).find(o => o.s === OPP[s]);
    if (!back || back.wide !== wide) throw new Error('one-sided port ' + p.id + ' ' + s);
    if (Math.abs(p.L - q.L) > 2) throw new Error('too steep ' + p.id + ' ' + q.id);
    if (wide && p.L !== q.L) throw new Error('a wide join must be level: ' + p.id + ' ' + q.id);
    if (s === 'E' || s === 'S') OPEN.push({ a: p.id, b: q.id, kind: wide ? 'wide' : p.L === q.L ? 'bridge' : 'steps', cross: p.d !== q.d }); }
const layout = { area: 'The Internet', version: 'plan-2', approved: 'the first four districts: mondo 11-17 ("that is okay"); plan 2 (bigger, nine districts): mondo 11-17 "Do a new layout"; the plan itself not yet seen', squareMeters: 3.5, plotCells: N, cols: GX, rows: GY, levelMeters: 1.75,
    districts: Object.fromEntries(Object.keys(DIST).map(k => [k, DIST[k].name])), legend: LEGEND,
    plots: PLOTS.map(p => ({ id: p.id, name: p.name, d: p.d, level: p.L, what: p.what, from: p.from, ports: p.ports, style: p.style, ax: p.ax || null, end: p.end || null, way: p.way || null })),
    openings: OPEN, ways: WAYS.map(w => ({ id: w.id, plot: w.plot, side: w.side, kind: w.kind, to: w.to })), cells: cells.map(r => r.join('')),
    levelsNote: 'Every plot is a tile at level x 1.75 m over the grid. The Highway is level 10 (17.5 m) end to end; the Server Farm one floor at 8; the Feed\'s boulevard at 12, its stages to 14; the Stream 10 to 14 (the VR Arcade, the highest); Popup City\'s deck 9; the Forums 7 to 10; the Motherboard three terraces 8 / 6 / 4; the Dark Web sinks from 8 to 1 (1.75 m).' };
const json = JSON.stringify(layout, null, 0).replace(/\{"id"/g, '\n{"id"').replace(/"cells":\[/, '\n"cells":[\n').replace(new RegExp('","(?=[.a-zA-Z]{' + W + '}")', 'g'), '",\n"');
fs.mkdirSync(path.join(REPO, 'docs/areas/internet/districts'), { recursive: true });
fs.writeFileSync(path.join(REPO, 'docs/areas/internet/layout.json'), json + '\n');

/* ── the picture ── */
const COL = { '.': '#06140f', h: '#6a6a30', r: '#e8d860', s: '#5a7a96', a: '#c8dcf0', m: '#b8b8b0', e: '#ffffff', f: '#c060a0', v: '#ffe0f4', g: '#7a50c0', y: '#e0d0ff', c: '#2890a8', n: '#c0f4ff', b: '#c89040', p: '#ffe8c0', t: '#1e7a3c', i: '#a0ffc0', d: '#3a1a22', x: '#a03040', k: '#ffffff' };
const SQ = 10, OX = 60, OY = 96, Wd = OX + W * SQ + 470, Ht = OY + H * SQ + 60, o = [];
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
o.push(`<rect width="${Wd}" height="${Ht}" fill="#101614"/>`);
o.push(`<text x="${OX}" y="34" fill="#fff" font-size="21" font-weight="bold">THE INTERNET  ·  plot plan 2  ·  9 x 9 plots (71 built), every plot a tile over the grid  ·  one plot = 12 x 12 squares of 3.5 m</text>`);
o.push(`<text x="${OX}" y="58" fill="#bbb" font-size="13">No ground: tiles at their own heights over a glowing grid, joined by bridges and floating steps. The Highway crosses the middle; the Dark Web sinks to the south-west.</text>`);
o.push(`<text x="${OX}" y="78" fill="#bbb" font-size="13">L = the tile's height in levels of 1.75 m. A fall puts you back on the last ground you stood on.</text>`);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) o.push(`<rect x="${OX + x * SQ}" y="${OY + y * SQ}" width="${SQ}" height="${SQ}" fill="${COL[cells[y][x]]}"/>`);
for (const p of PLOTS) { const X = OX + p.x * N * SQ, Y = OY + p.y * N * SQ, D = DIST[p.d];
    o.push(`<rect x="${X}" y="${Y}" width="${N * SQ}" height="${N * SQ}" fill="none" stroke="${D.col}" stroke-opacity="0.6" stroke-width="1"/>`);
    o.push(`<text x="${X + 4}" y="${Y + 13}" fill="#fff" font-size="9.5" font-weight="bold" stroke="#000" stroke-width="2.6" paint-order="stroke">${esc(p.name)}</text>`);
    o.push(`<text x="${X + 4}" y="${Y + 25}" fill="#ffe9a0" font-size="8.5" stroke="#000" stroke-width="2.2" paint-order="stroke">${p.id}  L${p.L}</text>`); }
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
['Highway: the Exchange (the router tower at the crossing)', 'Server Farm: the Cloud (a cloud over the racks)', 'Inbox: the hill of envelopes', 'Feed: the For You Page (the biggest screen)', 'Stream: the VR Arcade (the highest tile)', 'Popup City: the Search Bar (the tallest tower)', 'Forums: the Mod Tower (the ban hammer)', 'Motherboard: the Processor under its fan', 'Dark Web: the Bottom (the lowest tile)', 'In the open sky: the Globe, south of the Dead Link'].forEach(s => T(s, '#ccc', 0, 11));
T('Every plot name is a label of mine. This is a plan drawing, not the game.', '#888', 0, 10);
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${Wd}" height="${Ht}" viewBox="0 0 ${Wd} ${Ht}" font-family="DejaVu Sans, Arial, sans-serif">${o.join('')}</svg>`;
console.log(`internet plan 2: ${PLOTS.length} plots (${Object.keys(DIST).map(k => k + ' ' + PLOTS.filter(p => p.d === k).length).join(', ')}), ${OPEN.length} openings (${OPEN.filter(q => q.cross).length} cross a district line), ${WAYS.length} ways`);
if (process.argv.includes('--no-png')) process.exit(0);
(async () => {
    let pw; try { pw = require('playwright'); } catch (e) { fs.writeFileSync(path.join(__dirname, 'internet_plot_plan.svg'), svg); console.log('no playwright: the .svg was written'); return; }
    let exe; try { exe = require(path.join(REPO, 'probe-fast.js')).EXE; } catch (e) {}
    const b = await pw.chromium.launch(exe ? { executablePath: exe, args: ['--no-sandbox'] } : {}); const pg = await b.newPage({ viewport: { width: Wd, height: Ht } });
    await pg.setContent(`<body style="margin:0;background:#101614">${svg}</body>`); await pg.screenshot({ path: path.join(__dirname, 'internet_plot_plan.png') }); await b.close();
    console.log('wrote internet_plot_plan.png');
})();
