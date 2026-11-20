/* KATANA ISLAND, THE LAYOUT (world polish thread 21; mondo OK 11-20): the plots, levels, ways and ledges. Read by bake-katana.js and the plan pictures (docs/plans/world-polish/thread21/).
   Everything is on WHOLE 3.5 m SQUARES. A plot is 12 x 12 squares. The island's own frame: 7 x 7 plots = 84 x 84 squares, x east, y south;
   in the room it stands one plot in from every side (a ring of sea plots: the room's box is 9 x 9). 1 level = 1.75 m.
   WAYS are lists of corner squares: every leg runs along the grid, every turn is a right angle, no leg is longer than 8 squares (checked). */
'use strict';
const N = 12, COLS = 7, ROWS = 7, W = COLS * N, H = ROWS * N;
/* district letter: B Katana Bay, C the City, L the Village, W the Woods, J the Jungle, V the Volcano. [x, y, district, level, name] */
const PLOTS = [
    [2, 0, 'V', 9, 'The Black Cape'], [2, 1, 'V', 13, 'The West Flank'], [3, 1, 'V', 18, 'The Crater'], [4, 1, 'V', 12, 'The East Flank'], [3, 2, 'V', 13, 'The Lava Field'],
    [1, 1, 'W', 9, 'The Old Wood'], [1, 2, 'W', 8, 'The Bamboo Wood'], [2, 2, 'W', 10, 'The Cherry Wood'], [3, 3, 'W', 7, 'The Hot Spring'],
    [0, 1, 'C', 8, 'The Palace'], [0, 2, 'C', 7, 'The Castle Garden'], [0, 3, 'C', 8, 'The Castle'], [0, 4, 'C', 4, 'The Samurai Quarter'], [1, 3, 'C', 6, 'The High Town'], [2, 3, 'C', 5, 'The Temple Quarter'], [2, 4, 'C', 3, 'The Merchants’ Town'],
    [1, 4, 'B', 1, 'The Waterfront'], [0, 5, 'B', 1, 'The West Quay'], [0, 6, 'B', 2, 'The Lantern Head'], [2, 5, 'B', 1, 'The East Quay'], [2, 6, 'B', 0, 'The Fishing Beach'],
    [3, 4, 'L', 1, 'The Paddies'], [3, 5, 'L', 1, 'The Shore Hamlet'], [4, 4, 'L', 3, 'The Village'], [4, 3, 'L', 5, 'The Terraces'],
    [5, 3, 'J', 3, 'The Jungle'], [5, 2, 'J', 2, 'The Dinosaur Park'], [6, 2, 'J', 1, 'The East Shore'], [4, 2, 'J', 6, 'The Jungle Rise'], [5, 1, 'J', 5, 'The Jungle, north'],
];
const BAY = [[1, 5], [1, 6]];   // Katana Bay's water: the inlet the boat sails up
const DIST = { B: ['KATANA BAY', '#b9c3c9'], C: ['THE CITY', '#d9a441'], L: ['THE VILLAGE', '#8fbf4d'], W: ['THE WOODS', '#f08fb4'], J: ['THE JUNGLE', '#1f9d55'], V: ['THE VOLCANO', '#e2572b'] };
const plot = {}; PLOTS.forEach(p => { plot[p[0] + ':' + p[1]] = { x: p[0], y: p[1], d: p[2], level: p[3], name: p[4] }; });
const plotAt = (sx, sy) => (sx < 0 || sy < 0 || sx >= W || sy >= H) ? null : plot[Math.floor(sx / N) + ':' + Math.floor(sy / N)] || null;
const isBay = (px, py) => BAY.some(b => b[0] === px && b[1] === py);
/* the shore: a land plot's squares near open sea are trimmed to water or sand by a fixed noise, so the coast is not a row of boxes.
   The quays (the Waterfront, both Quays) keep a straight stone edge on the bay. High plots end in a cliff, not a beach. */
const hash = (x, y) => { let h = (x * 374761393 + y * 668265263) >>> 0; h = ((h ^ (h >>> 13)) * 1274126177) >>> 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const noise = (x, y, s) => { const gx = x / s, gy = y / s, x0 = Math.floor(gx), y0 = Math.floor(gy), fx = gx - x0, fy = gy - y0, sm = t => t * t * (3 - 2 * t);
    const a = hash(x0, y0), b = hash(x0 + 1, y0), c = hash(x0, y0 + 1), d = hash(x0 + 1, y0 + 1); return a + (b - a) * sm(fx) + (c - a) * sm(fy) + (a - b - c + d) * sm(fx) * sm(fy); };
const QUAY = { '1:4': 1, '0:5': 1, '2:5': 1, '0:4': 1, '2:4': 1 };
const R = 5, solid = (sx, sy, quay) => { const px = Math.floor(sx / N), py = Math.floor(sy / N); return plot[px + ':' + py] || (quay && isBay(px, py)) ? 1 : 0; };
const blur = (sx, sy, quay) => { let a = 0, n = 0; for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) { if (dx * dx + dy * dy > R * R + 1) continue; a += solid(sx + dx, sy + dy, quay); n++; } return a / n; };
/* square kinds: 'sea', 'sand', 'cliff' (a rock edge at the water), 'land' */
const KIND = [], LEVEL = [];
for (let y = 0; y < H; y++) { KIND.push([]); LEVEL.push([]); for (let x = 0; x < W; x++) { const p = plotAt(x, y); let k = 'sea';
    if (p) { const v = blur(x, y, !!QUAY[p.x + ':' + p.y]), n = noise(x + 40, y + 17, 6); k = v < 0.52 + (n - 0.5) * 0.3 ? 'sea' : 'land'; }
    KIND[y].push(k); LEVEL[y].push(-1); } }
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { if (KIND[y][x] === 'sea') continue; const p = plotAt(x, y), high = p.level >= 4, r = high ? 1 : 2; let wet = false;
    for (let dy = -r; dy <= r && !wet; dy++) for (let dx = -r; dx <= r; dx++) { const X = x + dx, Y = y + dy, q = plotAt(X, Y); if (X < 0 || Y < 0 || X >= W || Y >= H || (!q && !(QUAY[p.x + ':' + p.y] && isBay(Math.floor(X / N), Math.floor(Y / N))))) { wet = true; break; } if (q && KIND[Y][X] === 'sea') { wet = true; break; } }
    if (wet && !QUAY[p.x + ':' + p.y]) { KIND[y][x] = high ? 'cliff' : 'sand'; LEVEL[y][x] = high ? p.level : 0; } else LEVEL[y][x] = p.level; }
/* ── THE WAYS. [name, width in squares, corner squares...]. Width 3 = a main way, 2 = a lane, 1 = a thin trail. ── */
const WAYS = [
    ['THE MOUNTAIN ROAD (main way: the pier to the crater)', 3, [[17, 58], [17, 55], [21, 55], [21, 52], [27, 52], [27, 49], [33, 49], [33, 45], [27, 45], [27, 40], [21, 40], [21, 37], [15, 37], [15, 31], [20, 31], [20, 27], [27, 27], [27, 31], [32, 31], [32, 25], [28, 25], [28, 20], [33, 20], [33, 15], [28, 15], [28, 13], [34, 13], [34, 17], [39, 17], [39, 14]]],
    ['The Castle Road (the High Town to the castle yard, through the east gate)', 3, [[15, 37], [10, 37], [10, 41], [5, 41]]],
    ['The Shore Road (the Waterfront to the Village to the Jungle)', 2, [[22, 57], [25, 57], [25, 64], [31, 64], [31, 68], [38, 68], [38, 62], [43, 62], [43, 56], [50, 56], [50, 51], [55, 51], [55, 45], [55, 42], [62, 42], [62, 37], [67, 37], [67, 31]]],
    ['The West Steps + the Main Gate (the Waterfront, the Samurai Quarter, the castle’s south gate)', 2, [[13, 55], [8, 55], [8, 51], [4, 51], [4, 46], [5, 46], [5, 41]]],
    ['The Wild Way (the Dinosaur Park up the volcano’s east flank to the crater)', 1, [[67, 31], [64, 31], [64, 28], [64, 22], [58, 22], [58, 18], [52, 18], [52, 21], [47, 21], [47, 17], [46, 17]]],
    ['The East Shore trail', 1, [[67, 31], [74, 31], [74, 28], [79, 28]]],
    ['The Palace Walk (the castle garden up to the palace\u2019s gate)', 2, [[10, 29], [10, 24], [6, 24], [6, 21]]],
    ['The Postern (the castle garden to the Bamboo Wood)', 1, [[5, 41], [5, 37], [5, 33], [10, 33], [10, 29], [15, 29], [15, 31]]],
    ['The Old Wood trail (the Bamboo Wood, the hidden shrine, the Black Cape)', 1, [[20, 27], [20, 20], [15, 20], [15, 16], [22, 16], [26, 16], [26, 9], [31, 9], [31, 5]]],
    ['The Hot Spring trail (the Cherry Wood, the Lava Field, the Hot Spring, the Terraces)', 1, [[32, 28], [38, 28], [38, 34], [41, 34], [41, 40], [41, 42], [47, 42], [47, 45], [51, 45], [55, 45]]],
    ['The Lantern Head path', 1, [[9, 60], [9, 66], [8, 66], [8, 72], [8, 75], [3, 75], [3, 79]]],
    ['The Fishing Beach path', 1, [[25, 64], [25, 70], [29, 70], [29, 76]]],
];
/* ── THE LEDGES: a drop you walk off and cannot jump back up (the walker's jump tops out at 1.46 m; every ledge is 2 levels = 3.5 m or more).
   [x0, y0, x1, y1 (a line along square edges, in squares), the way you fall: 'S' 'W' 'E' 'N', from level, to level] ── */
const LEDGES = [
    [41, 24, 44, 24, 'S', 18, 13], [40, 36, 43, 36, 'S', 13, 7], [40, 48, 43, 48, 'S', 7, 1],
    [32, 24, 35, 24, 'S', 13, 10], [29, 36, 32, 36, 'S', 10, 5], [28, 48, 31, 48, 'S', 5, 3], [32, 60, 35, 60, 'S', 3, 1],
    [18, 36, 20, 36, 'S', 8, 6], [16, 48, 18, 48, 'S', 6, 1],
    [52, 48, 55, 48, 'S', 5, 3], [48, 53, 48, 56, 'W', 3, 1], [60, 28, 60, 31, 'E', 6, 2], [48, 40, 48, 43, 'W', 5, 7].slice(0, 0),
    [7, 78, 7, 81, 'E', 3, 0],
].filter(q => q.length);
/* landmarks: [square x, y, label] */
const MARKS = [[4, 38, 'THE CASTLE KEEP'], [6, 16, 'THE PALACE'], [30, 42, 'the pagoda'], [17, 78, 'THE GREAT GATE in the water'], [5, 79, 'the lantern tower'], [41, 17, 'THE CRATER'], [41, 43, 'the hot spring'],
    [66, 28, 'the dinosaur park'], [54, 52, 'the village square'], [15, 34, 'the shrine stair'], [15, 15, 'the hidden shrine'], [31, 4, 'the cape'], [17, 62, 'the pier (the boat lands)']];
/* the check: every leg on the grid and 8 squares or shorter, every way square on dry ground */
function check() { const bad = [];
    WAYS.forEach(w => { const pts = w[2], half = (w[1] - 1) / 2;
        for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i]; if (a[0] !== b[0] && a[1] !== b[1]) bad.push(w[0] + ': a leg off the grid at ' + a + ' -> ' + b);
            const len = Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]); if (len > 8) bad.push(w[0] + ': a straight leg of ' + len + ' squares at ' + a + ' -> ' + b); }
        waySquares(w).forEach(q => { if (q[0] < 0 || q[1] < 0 || q[0] >= W || q[1] >= H || KIND[q[1]][q[0]] === 'sea') bad.push(w[0] + ': a square in the sea at ' + q); }); void half; });
    return bad; }
function waySquares(w) { const pts = w[2], wd = w[1], lo = -Math.floor((wd - 1) / 2), hi = Math.ceil((wd - 1) / 2), seen = new Set(), out = [];
    const put = (x, y) => { for (let dy = lo; dy <= hi; dy++) for (let dx = lo; dx <= hi; dx++) { const k = (x + dx) + ':' + (y + dy); if (!seen.has(k)) { seen.add(k); out.push([x + dx, y + dy]); } } };
    for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i], sx = Math.sign(b[0] - a[0]), sy = Math.sign(b[1] - a[1]); let x = a[0], y = a[1]; put(x, y); while (x !== b[0] || y !== b[1]) { x += sx; y += sy; put(x, y); } }
    return out; }
module.exports = { N, COLS, ROWS, W, H, PLOTS, BAY, DIST, plot, plotAt, isBay, KIND, LEVEL, WAYS, LEDGES, MARKS, check, waySquares, noise, hash };
if (require.main === module) { const bad = check(); console.log(PLOTS.length + ' plots; ' + WAYS.length + ' ways; ' + LEDGES.length + ' ledges'); console.log(bad.length ? bad.join('\n') : 'every leg on the grid, 8 squares or shorter, on dry ground'); }
