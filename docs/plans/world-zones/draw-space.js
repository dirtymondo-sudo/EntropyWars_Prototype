/* OUTER SPACE, PLOT PLAN 3 (2026-11-16) — the redesign on plots (mondo 11-16: "completely redesigned/reimagined with plots and districts ...
   let's just get the world built, we can figure that part [the ship] out later").
   `node docs/plans/world-zones/draw-space.js` writes:
     docs/areas/space/layout.json                       the layout bake-space.js reads (every plot, the square maps, the heights, the ways)
     docs/plans/world-zones/outer-space-layout-3.json   the same plots and ways without the height data (the plan's own record)
     docs/plans/world-zones/outer-space_plot_plan_3.png the picture (an SVG shot with playwright; without playwright the .svg stays)
   Plan 2 (one 12 x 12 solar system, 108 plots of empty space you fly through) is history: flying the ship and floating are new mechanics
   and are NOT built. Plan 3: FOUR ROOMS, ONE A WORLD, each on plots of 12 x 12 squares of 3.5 m with districts of its own; you reach each
   exactly as today (the ship's collar, the bays, the links).
     THE MOON         5 x 4 plots   M The Mare · C The Crater · F The Far Side
     MARS             5 x 4         Y Cydonia · V The Canyon · R The Rover Bay
     SATURN           4 x 4         H The Hexagon · G The Ring Shard
     THE SINGULARITY  4 x 4         D The Drop · A The Accretion Rim
   THE SQUARE MAP (one char a square): x rock / storm wall / nothing (never walked) · `.` ground · p track · c crater, canyon or bowl floor ·
   m a mesa, terrace or platform top · r a ramp · t a pyramid tier · l a pad · i ring ice / crystal · h the hole's floor · e a rim or lip.
   THE HEIGHTS: four corners a square (the game's terrain.slope.cells). A step over 0.62 m between two squares is a cliff nobody walks;
   ramps rise 0.3 at most. Nothing here is read by the game: bake-space.js is. */
'use strict';
const fs = require('fs'), path = require('path');
const N = 12, C = 3.5, REPO = path.join(__dirname, '..', '..', '..');
const hash = (x, y, s) => { let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const vnoise = (x, y, s) => { const xi = Math.floor(x), yi = Math.floor(y), u = x - xi, v = y - yi, f = t => t * t * (3 - 2 * t);
    return (hash(xi, yi, s) * (1 - f(u)) + hash(xi + 1, yi, s) * f(u)) * (1 - f(v)) + (hash(xi, yi + 1, s) * (1 - f(u)) + hash(xi + 1, yi + 1, s) * f(u)) * f(v); };

function world(o) {
    const W = o.cols * N, H = o.rows * N, cell = [], H4 = [];
    for (let y = 0; y < H; y++) { cell.push(new Array(W).fill('.')); H4.push(new Array(W).fill(null)); }
    const A = { W, H, cell, H4, o,
        each(fn) { for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) fn(x, y); },
        set(x0, y0, x1, y1, ch) { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (x >= 0 && y >= 0 && x < W && y < H) cell[y][x] = ch; },
        /* a flat hard top (its own four equal corners) */
        flat(x0, y0, x1, y1, h, ch) { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (x >= 0 && y >= 0 && x < W && y < H) { H4[y][x] = [h, h, h, h]; if (ch) cell[y][x] = ch; } },
        /* a ramp over a rectangle: dir = the way UP ('n' 's' 'e' 'w'), from h0 at its foot to h1 at its head */
        ramp(x0, y0, x1, y1, dir, h0, h1, ch) { const len = (dir === 'e' || dir === 'w') ? x1 - x0 + 1 : y1 - y0 + 1;
            for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const t = c => { const k = dir === 'e' ? c[0] - x0 : dir === 'w' ? x1 + 1 - c[0] : dir === 's' ? c[1] - y0 : y1 + 1 - c[1]; return h0 + (h1 - h0) * k / len; };
                H4[y][x] = [t([x, y]), t([x + 1, y]), t([x, y + 1]), t([x + 1, y + 1])]; cell[y][x] = ch || 'r'; } },
        /* the soft ground: every square with no corners yet takes them from one surface f(x, y) (square units) */
        soft(f) { A.each((x, y) => { if (!H4[y][x]) H4[y][x] = [f(x, y), f(x + 1, y), f(x, y + 1), f(x + 1, y + 1)]; }); },
    };
    return A;
}
const bowl = (x, y, cx, cy, R, d) => { const r = Math.hypot(x - cx, y - cy); return r < R ? -d * (1 - (r / R) * (r / R)) : 0; };
const lip = (x, y, cx, cy, R, wdt, h) => { const r = Math.hypot(x - cx, y - cy); return (r >= R && r < R + wdt) ? h * Math.sin(Math.PI * (r - R) / wdt) : 0; };
/* the rock round a room: `th` squares + up to `nz` more by the dice */
const border = (A, th, nz, seed) => A.each((x, y) => { const d = Math.min(x, y, A.W - 1 - x, A.H - 1 - y); if (d < th + Math.floor(vnoise(x / 3.1, y / 3.1, seed) * (nz + 1))) A.cell[y][x] = 'x'; });
/* ROUND (2026-11-17): a round world is laid as a net of six faces, 3 x 2, each 24 x 24 squares (2 x 2 plots); the game bends it onto a
   ball (three-renderer.js THE ROUND WORLDS, the same face table). Where the flat net does not join two faces that meet on the ball (a cut
   seam) the ground must meet itself: every corner on a cut seam takes the mean of all the ground that meets there on the ball, and the
   change runs out over the next three squares into each face. */
const PL_FACES = [[[-1, 0, 0], [0, 0, 1], [0, -1, 0]], [[0, 0, 1], [1, 0, 0], [0, -1, 0]], [[1, 0, 0], [0, 0, -1], [0, -1, 0]],
    [[0, 0, -1], [-1, 0, 0], [0, -1, 0]], [[0, -1, 0], [1, 0, 0], [0, 0, -1]], [[0, 1, 0], [1, 0, 0], [0, 0, 1]]];
const PLF = 24;
function roundSeams(A) {
    const PI4 = Math.PI / 4, dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    const dirOf = (k, X, Y) => { const f = PL_FACES[k], a = (X - (k % 3) * PLF) / PLF * 2 - 1, b = (Y - Math.floor(k / 3) * PLF) / PLF * 2 - 1, ta = Math.tan(a * PI4), tb = Math.tan(b * PI4);
        const d = [0, 1, 2].map(i => f[0][i] + f[1][i] * ta + f[2][i] * tb), l = Math.hypot(d[0], d[1], d[2]); return d.map(v => v / l); };
    const entries = (k, X, Y) => { const c = k % 3, r = Math.floor(k / 3), out = []; for (const [dx, dy] of [[0, 0], [-1, 0], [0, -1], [-1, -1]]) { const x = X + dx, y = Y + dy;
        if (x < c * PLF || x >= c * PLF + PLF || y < r * PLF || y >= r * PLF + PLF) continue; out.push([x, y, (Y - y) * 2 + (X - x)]); } return out; };
    const H0 = A.H4.map(r => r.map(q => q.slice())), groups = {};
    for (let k = 0; k < 6; k++) { const c = k % 3, r = Math.floor(k / 3);
        for (let Y = r * PLF; Y <= r * PLF + PLF; Y++) for (let X = c * PLF; X <= c * PLF + PLF; X++) {
            if (X !== c * PLF && X !== c * PLF + PLF && Y !== r * PLF && Y !== r * PLF + PLF) continue;
            const d = dirOf(k, X, Y), key = d.map(v => Math.round(v * 1e5)).join(','); (groups[key] = groups[key] || []).push([k, X, Y]); } }
    let cut = 0;
    Object.values(groups).forEach(G => {
        if (G.every(m => m[1] === G[0][1] && m[2] === G[0][2])) return;   // joined on the flat net
        let sum = 0, n = 0; G.forEach(([k, X, Y]) => entries(k, X, Y).forEach(([x, y, ci]) => { sum += H0[y][x][ci]; n++; }));
        if (!n) return; const tgt = sum / n; cut++;
        G.forEach(([k, X, Y]) => { const E = entries(k, X, Y); if (!E.length) return; const own = E.reduce((a, e) => a + H0[e[1]][e[0]][e[2]], 0) / E.length, dl = tgt - own; if (Math.abs(dl) < 1e-4) return;
            E.forEach(([x, y, ci]) => { A.H4[y][x][ci] = tgt; });
            const c = k % 3, r = Math.floor(k / 3), ins = []; if (X === c * PLF) ins.push([1, 0]); if (X === c * PLF + PLF) ins.push([-1, 0]); if (Y === r * PLF) ins.push([0, 1]); if (Y === r * PLF + PLF) ins.push([0, -1]);
            ins.forEach(([ix, iy]) => { for (let t = 1; t <= 3; t++) entries(k, X + ix * t, Y + iy * t).forEach(([x, y, ci]) => { A.H4[y][x][ci] += dl * (1 - t / 4); }); }); }); });
    return cut;
}
const plots = (cols, rows, rowsOf) => { const out = []; for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) { const q = rowsOf[y][x]; out.push({ id: 'P' + String(x).padStart(2, '0') + '-' + String(y).padStart(2, '0'), name: q[1], d: q[0], level: q[2] || 0, what: q[3] || '', from: q[4] || 'new plot (label mine)' }); } return out; };

/* ═══ THE MOON — "one small step": the sea of dust, the one big crater, and the side nobody is shown ═══ */
function moon() {
    /* ROUND (2026-11-17, mondo's two-maps design doc + his pick "round worlds first"): 6 x 4 plots = the six faces of a ball, 2 x 2 plots
       a face (see ROUND below); no rock border (there is no edge: walk off one face and you are on the next). The new column (P05-..) is
       plain dust. */
    const A = world({ cols: 6, rows: 4 }), CR = { x: 30, y: 21, R: 10, d: 5 };
    /* (the limb, a straight rock ridge between the far side and the side you are shown, is GONE, 2026-11-17: mondo: "a ridge or mountain range ... that looks
       leftover from the boundaries of a square perimeter, the whole planet should be walkable outside of things that are actually meant to be walls") */
    /* THE TERRACE (the collar stands on it: a door you climb to) and its two ramps; THE ANTENNA PLATFORM under the rim and its ramp */
    A.flat(22, 3, 33, 6, 3.5, 'm'); A.ramp(18, 5, 21, 6, 'e', 0, 3.5); A.ramp(34, 5, 37, 6, 'w', 0, 3.5); A.set(18, 3, 21, 4, 'x'); A.set(34, 3, 37, 4, 'x');
    A.flat(40, 3, 44, 6, 5.25, 'm'); A.ramp(41, 7, 42, 11, 'n', 0, 5.25);
    /* THE DISH's platform, THE LANDER's pad, the bay door's pad */
    A.flat(50, 5, 53, 8, 1.75, 'm'); A.ramp(51, 9, 52, 10, 'n', 0, 1.75);
    A.flat(37, 38, 41, 42, 0.35, 'l');
    /* THE BERTH (2026-11-17, pass 2): the Spaceship's pad, on the top of the Moon (it stood on a square of rock of its own, "Low Orbit"; mondo: "I still
       see a square map, wtf is that. Its supposed to be a planet") */
    A.flat(62, 27, 67, 32, 0.35, 'l');
    /* the crater: its floor, its lip, its central peak; the Dig on the far side; the Overlook; small craters */
    const SMALL = [[46, 28, 3, 0.8], [20, 38, 2.5, 0.6], [52, 34, 2.5, 0.7], [47, 15, 2, 0.5], [17, 24, 2, 0.5], [27, 41, 2, 0.5], [6, 38, 2.5, 0.7], [5, 6, 2, 0.5], [55, 21, 2, 0.5]];
    A.soft((x, y) => { let h = bowl(x, y, CR.x, CR.y, CR.R, CR.d) + lip(x, y, CR.x, CR.y, CR.R, 3, 0.9) + bowl(x, y, 6, 19, 3.5, 1.8);
        { const r = Math.hypot(x - 46, y - 33); if (r < 4.5) h += 2.2 * (1 - (r / 4.5) * (r / 4.5)); }
        SMALL.forEach(s => { h += bowl(x, y, s[0], s[1], s[2], s[3]); }); return h; });
    A.each((x, y) => { if (A.cell[y][x] !== '.') return; const r = Math.hypot(x + 0.5 - CR.x, y + 0.5 - CR.y); if (r < CR.R - 0.3) A.cell[y][x] = 'c'; else if (r < CR.R + 3) A.cell[y][x] = 'e';
        if (Math.hypot(x + 0.5 - 6, y + 0.5 - 19) < 3.4) A.cell[y][x] = 'c'; SMALL.forEach(s => { if (Math.hypot(x + 0.5 - s[0], y + 0.5 - s[1]) < s[2] - 0.4) A.cell[y][x] = 'c'; }); });
    A.set(29, 20, 30, 21, 'x');
    /* the tracks: the standing door > the Lander > the Habitat > the Dish; the Lander > the crater's south lip; the south pass to the far side */
    const tr = (pts) => { for (let i = 0; i + 1 < pts.length; i++) { let [x, y] = pts[i]; const [X, Y] = pts[i + 1]; for (;;) { if ('.ce'.includes(A.cell[y][x])) A.cell[y][x] = 'p'; if (x === X && y === Y) break; if (x !== X) x += Math.sign(X - x); else y += Math.sign(Y - y); } } };
    tr([[30, 43], [36, 43]]); tr([[42, 40], [51, 40], [51, 19]]); tr([[51, 15], [51, 11]]); tr([[39, 37], [39, 35]]); tr([[30, 43], [14, 43], [14, 29], [8, 29]]); tr([[8, 29], [8, 40]]); tr([[8, 29], [6, 29], [6, 23]]); tr([[14, 10], [8, 10], [8, 8]]);
    /* THE MARIA (pass 2): dark seas of dust by a slow noise read on the ball (so they run on over every seam): the Moon's face from afar */
    { const K = require('./space-ball.js').rmKit(24, 1, A.W, A.H), vn = require('./space-ball.js').vnoise;
      A.each((x, y) => { if (A.cell[y][x] !== '.') return; const d = K.dirAt(Math.floor(y / 24) * 3 + Math.floor(x / 24), x + 0.5, y + 0.5), n = vn(d[0] * 2.1 + 5, d[1] * 2.1 + d[2] * 1.7 + 9, 41) * 0.7 + vn(d[0] * 5.3, d[2] * 5.3 + d[1] * 4.1, 43) * 0.3; if (n > 0.57) A.cell[y][x] = 'd'; }); }
    const F = 'F', Cc = 'C', M = 'M';
    roundSeams(A);
    return { id: 'moon', room: 'site_prebuilt_moon_plots', site: 'prebuilt_moon', old: 'site_prebuilt_moon_mare', name: 'The Moon', cols: 6, rows: 4, A, round: true,
        districts: { M: 'The Mare', C: 'The Crater', F: 'The Far Side' },
        plots: plots(6, 4, [
            [[F, 'The Saucer', 0, 'a saucer on its landing gear in a hollow nobody photographs', 'new plot (label mine): the far-side secrets'], [Cc, 'The Rim, west', 0, 'the west foot of the terrace', 'The Mare: THE RIM'], [Cc, 'The Terrace', 2, 'LANDMARK of the north: the terrace you climb to, the ship\'s collar on it', 'The Mare: THE TERRACE'], [Cc, 'The Antenna Platform', 3, 'the platform under the rim, the antenna', 'The Mare: THE ANTENNA PLATFORM · THE CATWALK'], [M, 'The Dish', 1, 'the dish on its platform', 'The Mare: THE DISH'], [M, 'The Limb, east', 0, 'open dust where the Moon turns away', 'new plot (label mine): the round Moon']],
            [[F, 'The Dig', 0, 'a pit somebody dug, floodlit; the thing they found stands in it', 'new plot (label mine): the far-side secrets'], [Cc, 'The Crater, west', 0, 'the lip and the west wall of the bowl', 'The Mare: THE CRATER'], [Cc, 'The Crater', -3, 'LANDMARK: the one big crater, 70 m across, its central peak', 'The Mare: THE BIG CRATER'], [Cc, 'The Crater, east', 0, 'the lip and the east wall of the bowl', 'The Mare: THE CRATER'], [M, 'The Habitat', 0, 'the habitat, rated for six: a walk-in module', 'The Mare: THE HABITAT'], [M, 'The Limb, south-east', 0, 'open dust where the Moon turns away', 'new plot (label mine): the round Moon']],
            [[F, 'The Bore', 0, 'the draught: the bore that comes out under the Face on Mars', 'The Mare: THE FAR SIDE'], [Cc, 'The Crater, south-west', 0, 'the south lip', 'The Mare: THE CRATER'], [Cc, 'The Crater, south', 0, 'the south lip, the track up from the Lander', 'The Mare: THE CRATER'], [Cc, 'The Overlook', 1, 'the mound over the crater', 'The Mare: THE OVERLOOK'], [M, 'The Tracks', 0, 'the rover\'s tracks, the rover at the end of them', 'The Mare: the rover'], [M, 'The Berth', 0, 'open dust on the top of the ball', 'new plot (label mine): the round Moon']],
            [[F, 'The Sound Stage', 0, 'a second lander, lights and a camera on a patch of raked dust', 'new plot (label mine): Room 1969 "the footage"'], [M, 'The Mare, west', 0, 'open dust, small craters: room to fight', 'The Mare'], [M, 'The Standing Door', 0, 'the bay\'s door standing without a wall; footprints lead to it', 'the bay door (Room 1969)'], [M, 'The Lander', 0, 'LANDMARK: the lander on its pad, the flag, the footprints', 'The Mare: THE LANDER'], [M, 'The Mare, east', 0, 'open dust under the east rim', 'The Mare'], [M, 'The Top, south', 0, 'open dust on the top of the ball', 'new plot (label mine): the round Moon']],
        ]),
        ways: { bay: { sx: 30, sy: 44, face: 0, kind: 'bay door (Room 1969)' }, moon_derelict: { sx: 28, sy: 3, face: 180, kind: 'the ship\'s collar, on the Terrace' }, cydonia_mare: { sx: 3, sy: 29, face: 90, kind: 'hidden: the bore to Mars (the Face\'s mouth)' } },
        spawn: [30, 42], marker: [33, 36],
        who: 'Barbarella (her home); the old room\'s greys and men in black',
        pal: { '.': '#b9bcc4', d: '#8a8d96', p: '#d8d9dd', c: '#7d8088', e: '#a2a5ad', m: '#8f96a6', r: '#c7b98f', l: '#6f7a86', x: '#4a4c55' } };
}

/* ═══ MARS — Cydonia: the Face, the Pyramid, the canyon between the mesas, the canals, the rover's tracks ═══ */
function mars() {
    const A = world({ cols: 5, rows: 4 }), TOP = 5.25, CAN = -5.25;
    /* (round since 2026-11-17: no border; the dunes run on all the way round the ball) */
    /* THE FACE: a mesa in the shape of a face, seen whole only from above. Brow, two eye sockets, the nose's ridge, the mouth: a trench with the bore in it */
    const FX = 12, FY = 12.5, inFace = (x, y) => { const u = (x + 0.5 - FX) / 8.6, v = (y + 0.5 - FY) / 10.2; return u * u + v * v < 1; };
    A.each((x, y) => { if (inFace(x, y)) A.flat(x, y, x, y, TOP, 'm'); });
    A.flat(7, 9, 9, 10, 2.6, 'c'); A.flat(14, 9, 16, 10, 2.6, 'c');               // the eye sockets
    A.flat(12, 9, 12, 14, 7, 'm'); A.flat(11, 13, 13, 14, 6.4, 'm');               // the nose
    A.flat(8, 17, 15, 18, 3.5, 'c'); A.ramp(16, 17, 17, 18, 'w', TOP, 3.5); A.flat(18, 17, 18, 18, TOP, 'm');   // the mouth: you walk down into it from its east corner
    A.ramp(21, 11, 25, 12, 'w', 0, TOP);                                             // the way up: the east cheek
    /* THE PYRAMID: seven tiers of 1.75 m, a stair up its south face */
    const PX = 41, PY = 5;   // its north-west square; 14 x 14
    for (let i = 0; i < 7; i++) A.flat(PX + i, PY + i, PX + 13 - i, PY + 13 - i, (i + 1) * 1.75, 't');
    /* THE MESAS: a low table rock in the north; the two mesas either side of the canyon, THE ARCH between them over your head */
    A.flat(27, 4, 34, 8, 3.5, 'm'); A.ramp(28, 9, 29, 12, 'n', 0, 3.5);
    A.flat(27, 17, 35, 22, 7, 'm'); A.ramp(20, 19, 26, 20, 'e', 0, 7);
    A.flat(27, 32, 35, 36, 7, 'm'); A.ramp(36, 33, 42, 34, 'w', 0, 7);
    /* THE CANYON: a cut across the whole map, 5.25 m deep, four squares wide; ways down at both ends and one in the middle; THE CANALS: three dead-straight cuts off it */
    const cy0 = (x) => 27 + Math.round(Math.sin(x / 7) * 1.5);
    for (let x = 4; x < 56; x++) { const y0 = cy0(x); A.flat(x, y0, x, y0 + 3, CAN, 'c'); }
    A.ramp(4, cy0(4) - 5, 5, cy0(4) - 1, 'n', CAN, 0); A.ramp(54, cy0(54) + 4, 55, cy0(54) + 8, 's', CAN, 0);
    A.ramp(22, cy0(22) + 4, 23, cy0(22) + 8, 's', CAN, 0);
    A.flat(46, 21, 46, cy0(46) - 1, CAN, 'c'); A.flat(50, 21, 50, cy0(50) - 1, CAN, 'c'); A.flat(48, cy0(48) + 4, 48, 36, CAN, 'c');
    for (let y = 13; y <= 18; y++) A.set(47, y, 48, y, 'r');                          // the Pyramid's stair (a `ramp` row with treads: `stairs` below)
    /* THE ROVER BAY's apron, the dunes, the tracks */
    A.flat(38, 39, 46, 43, 0.35, 'l');
    A.soft((x, y) => { let h = 0; if (x < 24 && y > 33) h += 1.5 * vnoise(x / 3.2, y / 3.2, 9) * Math.min(1, (y - 33) / 3) * Math.min(1, (24 - x) / 3); h += bowl(x, y, 50, 36, 3, 0.8) + bowl(x, y, 26, 23, 2.5, 0.6); return h; });
    A.each((x, y) => { if (A.cell[y][x] === '.' && x < 24 && y > 34) A.cell[y][x] = 'e'; });
    const tr = (pts) => { for (let i = 0; i + 1 < pts.length; i++) { let [x, y] = pts[i]; const [X, Y] = pts[i + 1]; for (;;) { if ('.e'.includes(A.cell[y][x])) A.cell[y][x] = 'p'; if (x === X && y === Y) break; if (x !== X) x += Math.sign(X - x); else y += Math.sign(Y - y); } } };
    tr([[30, 44], [37, 44]]); tr([[47, 41], [56, 41], [56, 36]]); tr([[30, 44], [30, 37], [23, 37]]); tr([[30, 37], [12, 37]]); tr([[47, 20], [47, 19]]); tr([[48, 20], [48, 19]]);
    const Y = 'Y', V = 'V', R = 'R';
    return { id: 'mars', room: 'site_prebuilt_mars_plots', site: 'prebuilt_mars', old: 'site_prebuilt_mars_cydonia', name: 'Mars', cols: 5, rows: 4, A,
        districts: { Y: 'Cydonia', V: 'The Canyon', R: 'The Rover Bay' },
        plots: plots(5, 4, [
            [[Y, 'The Face, brow', 3, 'LANDMARK: the Face, a mesa 60 m long; a face from above, a hill from the ground', 'Cydonia: THE FACE'], [Y, 'The Face, east cheek', 3, 'the way up the cheek', 'Cydonia: THE FACE'], [Y, 'The Mesas', 4, 'the north mesa', 'Cydonia: THE MESAS'], [Y, 'The Pyramid, west', 7, 'LANDMARK: the Pyramid, seven tiers', 'Cydonia: THE PYRAMID'], [Y, 'The Pyramid', 7, 'the Pyramid\'s east half', 'Cydonia: THE PYRAMID']],
            [[Y, 'The Face, mouth', 3, 'the mouth: a trench with the bore to the Moon in it', 'Cydonia: THE FACE (the mouth)'], [Y, 'The Face, chin', 0, 'the foot of the Face', 'Cydonia: THE FACE'], [Y, 'The Arch', 4, 'the south mesa; the arch joins the two over your head', 'Cydonia: THE ARCH · THE MESAS'], [Y, 'The Pyramid, stair', 0, 'the stair up the south face; the low mesa', 'Cydonia: THE PYRAMID'], [Y, 'The Pyramid, east foot', 0, 'the Pyramid\'s south-east foot', 'Cydonia: THE PYRAMID']],
            [[V, 'The Canyon, west', -3, 'the canyon\'s west end and the way down', 'Cydonia: THE CANYON'], [V, 'The Canyon', -3, 'the canyon floor; the middle way down', 'Cydonia: THE CANYON'], [V, 'The Canyon under the Arch', -3, 'the canyon floor under the arch', 'Cydonia: THE CANYON'], [V, 'The Canals', -3, 'two dead-straight cuts off the canyon', 'new plot (label mine): the canals'], [V, 'The Canyon Mouth', -3, 'the canyon\'s east end and the way down', 'plan 1: The Canyon Mouth']],
            [[R, 'The Dunes', 0, 'dunes: room to fight', 'plan 1: The Dunes'], [R, 'The Dunes, east', 0, 'dunes, the tripod standing in them', 'new plot (label mine): the Martian\'s tripod (spell prop)'], [R, 'The Airlock', 0, 'the bay\'s airlock; red dust in the seal', 'the bay door (Room 4)'], [R, 'The Rover Bay', 0, 'LANDMARK of the south: the rover bay, walk-in; the ship\'s collar is its hatch', 'Cydonia: THE ROVER BAY\'S HATCH'], [R, 'The Tracks', 0, 'the rover at the end of its tracks', 'Cydonia: the rover\'s tracks']],
        ]),
        ways: { bay: { sx: 30, sy: 45, face: 0, kind: 'bay door (Room 4)' }, mars_derelict: { sx: 42, sy: 38, face: 180, kind: 'the ship\'s collar: the rover bay\'s hatch' }, cydonia_mare: { sx: 8, sy: 17, face: 90, kind: 'hidden: the Face\'s mouth, the bore to the Moon\'s far side' } },
        spawn: [30, 43], marker: [33, 40],
        stairs: [{ sx0: 47, sy0: 13, sx1: 48, sy1: 18, up: 'n', h0: 0, h1: 12.25 }], bridges: [{ sx0: 31, sy0: 23, sx1: 31, sy1: 31, y: 7 }],
        who: 'the Martian and the Droid (their home); the old room\'s greys',
        pal: { '.': '#b4603c', d: '#7c3f2a', w: '#f0f0f4', p: '#d08a5c', c: '#6e3626', e: '#c9a070', m: '#8c4a30', r: '#c9976a', t: '#a8744c', l: '#6f7a86', x: '#4f2a20' } };
}

/* ═══ SATURN — the Hexagon: a six-sided plateau the storm built round its own eye, under the rings ═══ */
function saturn() {
    const A = world({ cols: 4, rows: 4 }), CX = 24, CY = 24;
    /* a regular hexagon, flat top and bottom: apothem 20 squares */
    const hexR = (x, y) => { const dx = Math.abs(x - CX), dy = Math.abs(y - CY); return Math.max(dy, dy * 0.5 + dx * 0.8660254); };
    A.each((x, y) => { const r = hexR(x + 0.5, y + 0.5); if (r >= 20) A.cell[y][x] = 'x'; else if (r >= 15) { A.flat(x, y, x, y, 3.5, 'm'); } });   // THE RIM WALK: the outer hexagon, 3.5 m up, five squares wide
    /* the rim walk is cut into six sides at the corners east and west (the storm comes through), and three ramps go down to the plateau */
    A.ramp(22, 9, 25, 12, 's', 0, 3.5); A.flat(22, 5, 25, 8, 3.5, 'm');          // north: from the Docking Shelf
    A.ramp(9, 30, 12, 31, 'w', 0, 3.5); A.ramp(35, 30, 38, 31, 'e', 0, 3.5);     // south-west, south-east
    A.ramp(22, 36, 25, 39, 'n', 0, 3.5);                                           // south: from the airlock's side
    /* THE WAYS UP FROM THE CLOUD DECK (2026-11-17: the storm walls are gone, the whole ball is walked): a ramp onto the rim walk, north and south */
    A.ramp(26, 0, 29, 3, 's', -2, 3.5); A.ramp(26, 44, 29, 47, 'n', -2, 3.5);
    /* THE RING SHARD: a splinter of ring ice fallen across the east rim, 7 m, never climbed */
    for (let i = 0; i < 9; i++) A.flat(36 + Math.floor(i / 3), 13 + i, 37 + Math.floor(i / 3), 13 + i, 7 + (i % 3) * 0.6, 'i');
    /* THE EYE: the storm's eye, a bowl 4 m deep with a floor nobody stands on */
    A.soft((x, y) => bowl(x, y, CX, CY, 7, 4));
    A.each((x, y) => { const r = Math.hypot(x + 0.5 - CX, y + 0.5 - CY); if (A.cell[y][x] === '.' && r < 7) A.cell[y][x] = r < 2.2 ? 'h' : 'c'; });
    const tr = (pts) => { for (let i = 0; i + 1 < pts.length; i++) { let [x, y] = pts[i]; const [X, Y] = pts[i + 1]; for (;;) { if (A.cell[y][x] === '.') A.cell[y][x] = 'p'; if (x === X && y === Y) break; if (x !== X) x += Math.sign(X - x); else y += Math.sign(Y - y); } } };
    tr([[23, 35], [23, 32]]); tr([[23, 13], [23, 16]]); tr([[13, 30], [16, 30], [16, 24]]); tr([[34, 30], [31, 30], [31, 24]]);
    const Hd = 'H', G = 'G';
    return { id: 'saturn', room: 'site_prebuilt_saturn_plots', site: 'prebuilt_saturn', old: 'site_prebuilt_saturn_hexagon', name: 'Saturn', cols: 4, rows: 4, A,
        districts: { H: 'The Hexagon', G: 'The Ring Shard' },
        plots: plots(4, 4, [
            [[Hd, 'The Storm Walls, north-west', 2, 'a wall of storm; the rim walk under it', 'The Hexagon: THE STORM WALLS'], [Hd, 'The Storm Walls, north', 2, 'the rim walk, the north ramp', 'The Hexagon: THE STORM WALLS'], [G, 'The Docking Shelf', 2, 'the shelf on the rim: the ship\'s collar', 'The Hexagon: THE DOCKING SHELF'], [G, 'The Ring Shard, north', 2, 'the rim walk under the rings', 'The Hexagon: THE RING SHARD']],
            [[Hd, 'The Rim Walk', 2, 'the west rim: the Drop\'s frame, a frame with nothing in it', 'The Hexagon: THE RIM WALK · THE DROP\'S FRAME'], [Hd, 'The Eye, north-west', 0, 'LANDMARK: the Eye, the storm\'s own eye in the middle of the plateau', 'The Hexagon: THE EYE'], [Hd, 'The Eye, north-east', 0, 'the Eye', 'The Hexagon: THE EYE'], [G, 'The Ring Shard', 2, 'LANDMARK of the east: a splinter of ring ice across the rim', 'The Hexagon: THE RING SHARD']],
            [[Hd, 'The Camp', 2, 'the camp, upwind of the Eye', 'The Hexagon: the camp'], [Hd, 'The Eye, south-west', 0, 'the Eye; the plateau: room to fight', 'The Hexagon: THE PLATEAU'], [Hd, 'The Eye, south-east', 0, 'the Eye; the plateau', 'The Hexagon: THE PLATEAU'], [G, 'The Ring Plane', 2, 'the south-east rim: fallen ring ice', 'new plot (label mine): "mind the ring plane"']],
            [[Hd, 'The Storm Walls, south-west', 2, 'a wall of storm', 'The Hexagon: THE STORM WALLS'], [Hd, 'The Airlock', 2, 'the bay\'s airlock, the Mars airlock\'s twin; frost on it', 'the bay door (Room 6)'], [Hd, 'The Plateau', 2, 'the south rim and its ramp', 'The Hexagon: THE PLATEAU'], [Hd, 'The Storm Walls, south-east', 2, 'a wall of storm', 'The Hexagon: THE STORM WALLS']],
        ]),
        ways: { bay: { sx: 22, sy: 43, face: 0, kind: 'bay door (Room 6)' }, derelict_saturn: { sx: 25, sy: 5, face: 180, kind: 'the ship\'s collar, on the Docking Shelf' }, saturn_singularity: { sx: 5, sy: 23, face: 90, kind: 'the Drop\'s frame: to the Singularity' } },
        spawn: [22, 41], marker: [24, 33],
        who: 'the Grey and the Black Goo (their home); the old room\'s watcher and android',
        pal: { '.': '#d9c08a', b: '#efe6cf', d: '#a5814e', k: '#1c1712', p: '#efe0b8', c: '#a88c5a', h: '#2a2420', m: '#c2a468', r: '#e8d49c', i: '#9fe0e8', x: '#5a4a3a' } };
}

/* ═══ THE SINGULARITY — the edge of everything: a bowl that falls to a point; nothing comes back up ═══ */
function singularity() {
    const A = world({ cols: 4, rows: 4 }), CX = 24, CY = 24;
    /* the bright rim, then three shelves, each lower, each leaning to the drop; the floor round the hole */
    const prof = r => r >= 17 ? 0 : r >= 15 ? -2.1 * (17 - r) / 2 : r >= 12 ? -2.1 : r >= 10 ? -2.1 - 2.1 * (12 - r) / 2 : r >= 7 ? -4.2 : r >= 5 ? -4.2 - 2.1 * (7 - r) / 2 : -6.3;
    A.each((x, y) => { const r = Math.hypot(x + 0.5 - CX, y + 0.5 - CY); if (r >= 22) A.cell[y][x] = 'x'; });
    A.soft((x, y) => prof(Math.hypot(x - CX, y - CY)));
    A.each((x, y) => { if (A.cell[y][x] === 'x') return; const r = Math.hypot(x + 0.5 - CX, y + 0.5 - CY); A.cell[y][x] = r >= 17 ? 'e' : r < 2.6 ? 'h' : r < 5 ? 'c' : (r >= 15 || (r >= 10 && r < 12) || (r >= 5 && r < 7)) ? 'r' : '.'; });
    /* THE DROP: the one straight way in, from the east rim to the hole; THE SCREEN's ledge on the north-east rim */
    for (let x = 27; x <= 43; x++) for (let y = 23; y <= 24; y++) if (A.cell[y][x] !== 'x' && A.cell[y][x] !== 'h') A.cell[y][x] = 'p';
    A.flat(34, 5, 38, 8, 1.75, 'm'); A.ramp(35, 9, 36, 10, 'n', 0, 1.75);
    const Dd = 'D', Ac = 'A';
    return { id: 'singularity', room: 'site_prebuilt_singularity_plots', site: 'prebuilt_singularity', old: 'site_prebuilt_singularity_horizon', name: 'The Singularity', cols: 4, rows: 4, A,
        districts: { D: 'The Drop', A: 'The Accretion Rim' },
        plots: plots(4, 4, [
            [[Ac, 'The Accretion Rim, north-west', 0, 'the bright rim', 'The Horizon: THE ACCRETION RIM'], [Ac, 'The Frame', 0, 'the frame from Saturn: a frame with nothing in it', 'The Horizon: the frame'], [Ac, 'The Accretion Rim, north', 0, 'the bright rim, the first shelf under it', 'The Horizon: THE ACCRETION RIM'], [Ac, 'The Screen', 1, 'the screen on its ledge, watching the drop: SIGNAL LOST', 'The Horizon: THE SCREEN']],
            [[Ac, 'The Accretion Rim, west', 0, 'the bright rim and the shelves', 'The Horizon: THE ACCRETION RIM'], [Dd, 'Zero Volume, north-west', -4, 'the lowest shelf and the floor', 'The Horizon: ZERO VOLUME'], [Dd, 'The Drop', -4, 'the one straight way in; nothing comes back up', 'The Horizon: THE DROP'], [Ac, 'The Camp', 0, 'the camp, upstream of the drop', 'The Horizon: the camp']],
            [[Ac, 'The Accretion Rim, south-west', 0, 'the bright rim and the shelves', 'The Horizon: THE ACCRETION RIM'], [Dd, 'Zero Volume', -4, 'LANDMARK: the hole, a point of no volume', 'The Horizon: ZERO VOLUME'], [Dd, 'Zero Volume, south-east', -4, 'the lowest shelf and the floor', 'The Horizon: ZERO VOLUME'], [Ac, 'The Accretion Rim, east', 0, 'the bright rim: the head of the Drop', 'The Horizon: THE ACCRETION RIM']],
            [[Ac, 'The Accretion Rim, south-west end', 0, 'the bright rim', 'The Horizon: THE ACCRETION RIM'], [Ac, 'The Standing Frame', 0, 'the bay\'s frame; there is no other side', 'the bay door (Room 0)'], [Ac, 'The Accretion Rim, south', 0, 'the bright rim', 'The Horizon: THE ACCRETION RIM'], [Ac, 'The Accretion Rim, south-east', 0, 'the bright rim', 'The Horizon: THE ACCRETION RIM']],
        ]),
        ways: { bay: { sx: 22, sy: 44, face: 0, kind: 'bay door (Room 0)' }, saturn_singularity: { sx: 18, sy: 4, face: 180, kind: 'the frame from Saturn' }, observatorium_singularity: { sx: 36, sy: 5, face: 180, kind: 'hidden: the screen, DOOR HQ\'s observatory' } },
        spawn: [22, 42], marker: [30, 41],
        who: 'the Cosmic Wraith (its home); the old room\'s watcher, shadow entity, occulus',
        pal: { '.': '#5a4a78', p: '#b8f0e8', c: '#3a2a50', h: '#07060a', e: '#e0b060', r: '#4a3a66', m: '#8a7ab0', x: '#15101c' } };
}

/* ═══ write ═══ */
const WORLDS = [moon(), mars(), saturn(), singularity()];
/* THE LANDINGS (2026-11-17, One World v13, BUILD_PLAN phase 3: "each world's districts become landing sites the Spaceship flies between"):
   every district gets the ship's collar of its own. The Crater (the Terrace), the Rover Bay and the Ring Shard (the Docking Shelf) had one;
   these seven are new, each a DOOR_HQ.links row docked on the collar (`<district>_derelict`), on a level clear square of its own district. */
const LANDINGS = {
    moon: { ship_stick: { sx: 64, sy: 33, face: 180, kind: 'the berth: the Bridge\'s stick lands you here, aboard' }, orbit_derelict: { sx: 60, sy: 33, face: 0, kind: 'the berth\'s hatch: back into the ship\'s airlock' }, mare_derelict: { sx: 50, sy: 41, face: 180, kind: 'the ship\'s collar: the Mare, by the Lander' }, farside_derelict: { sx: 8, sy: 6, face: 180, kind: 'the ship\'s collar: the Far Side, by the Saucer' } },
    mars: { cydonia_derelict: { sx: 37, sy: 8, face: 180, kind: 'the ship\'s collar: Cydonia, under the Pyramid' }, canyon_derelict: { sx: 53, sy: 25, face: 180, kind: 'the ship\'s collar: the Canyon Mouth' } },
    saturn: { hexagon_derelict: { sx: 15, sy: 28, face: 180, kind: 'the ship\'s collar: the Hexagon, by the Eye' } },
    singularity: { rim_derelict: { sx: 4, sy: 22, face: 90, kind: 'the ship\'s collar: the Accretion Rim, west' }, drop_derelict: { sx: 29, sy: 17, face: 180, kind: 'the ship\'s collar: the Drop, on the last shelf' } },
};
WORLDS.forEach(w => Object.assign(w.ways, LANDINGS[w.id] || {}));
/* no way out stands in the border rock: the door's square, the two beside it and three squares in front of it are open */
WORLDS.forEach(w => Object.keys(w.ways).forEach(k => { const q = w.ways[k], f = q.face * Math.PI / 180, dx = Math.round(Math.sin(f)), dy = -Math.round(Math.cos(f));
    for (let i = 0; i <= 3; i++) for (let m = -1; m <= 1; m++) { const x = q.sx + dx * i + (dy ? m : 0), y = q.sy + dy * i + (dx ? m : 0); if (x > 0 && y > 0 && x < w.A.W - 1 && y < w.A.H - 1 && w.A.cell[y][x] === 'x') w.A.cell[y][x] = '.'; } }));
/* ══ THE ROUND WORLDS, LAID ONTO THEIR BALLS (2026-11-17, mondo: "okay go ahead and do the other ones and make the room bigger").
   Mars, Saturn and the Singularity keep the map they were drawn on (above), and that map is laid onto a ball: its middle on the middle of
   one face (`center`: Mars on the face you meet first, Saturn's hexagon on the NORTH POLE, the Singularity's bowl on the SOUTH POLE),
   spread round the ball at its true size (the azimuthal equidistant layout: every distance from the middle kept). Each square of the
   ball's net (3 x 2 faces of `fq` squares) takes the ground of the map under it, the ground beyond the map is `fill` (Mars: dunes all the
   way round; Saturn: the cloud deck outside the storm walls; the Singularity: the bright rim). Because each square is read from the ball,
   the ground meets itself over every seam with no stitching. The district files keep their own squares (the map's): bake-space.js carries
   every piece, unit, building and door onto the ball with `remap` (where it lands, turned with the ground). The Moon keeps its flat net. */
const { ROUNDS, rmKit, sampleNet, wayOnNet } = require('./space-ball.js');   // THE ROUND WORLDS' MAP KIT (shared with bake-space.js)
function roundRemap(w) {
    const o = ROUNDS[w.id]; if (!o) return; const A0 = w.A, K = rmKit(o.fq, o.center, A0.W, A0.H), fq = o.fq;
    const A = world({ cols: 3 * fq / N, rows: 2 * fq / N });
    const inMap = (x, y) => x >= 0 && y >= 0 && x < A0.W && y < A0.H;
    { const g = sampleNet(o, K, { W: A0.W, H: A0.H, cell: (x, y) => A0.cell[y][x], h4: (x, y) => A0.H4[y][x] }); A.each((X, Y) => { A.cell[Y][X] = g.cell[Y][X]; A.H4[Y][X] = g.H4[Y][X]; }); }
    /* the flat map stays in the layout (`flat`): bake-space.js builds the districts on it, then carries the whole of it onto the ball */
    w.flat = { cols: w.cols, rows: w.rows, spawn: w.spawn.slice(), marker: w.marker.slice(), ways: JSON.parse(JSON.stringify(w.ways)), stairs: JSON.parse(JSON.stringify(w.stairs || [])), bridges: JSON.parse(JSON.stringify(w.bridges || [])), plots: JSON.parse(JSON.stringify(w.plots)), A: A0 };
    /* the ways, the spawn, the marker: onto the ball, turned with it */
    const mv = (x, y) => { const q = K.sq(x, y); return [Math.max(0, Math.min(A.W - 1, q.x)), Math.max(0, Math.min(A.H - 1, q.y)), q.turn]; };
    Object.keys(w.ways).forEach(k => { const q = w.ways[k], m = wayOnNet(K, q.sx, q.sy, q.face); q.sx = m.sx; q.sy = m.sy; q.face = m.face;
        const f = q.face * Math.PI / 180, dx = Math.round(Math.sin(f)), dy = -Math.round(Math.cos(f));
        for (let i = 0; i <= 2; i++) for (let s2 = -1; s2 <= 1; s2++) { const x = q.sx + dx * i + (dy ? s2 : 0), y = q.sy + dy * i + (dx ? s2 : 0); if (x >= 0 && y >= 0 && x < A.W && y < A.H && A.cell[y][x] === 'x') A.cell[y][x] = '.'; } });
    { const m = mv(w.spawn[0], w.spawn[1]); w.spawn = [m[0], m[1]]; const k = mv(w.marker[0], w.marker[1]); w.marker = [k[0], k[1]]; }
    /* the stairs (the Pyramid's) and the bridges (the Arch): their middle carried, turned by whole quarter turns, their size kept */
    const sides = ['n', 'e', 's', 'w'];
    w.stairs = (w.stairs || []).map(s0 => { const cx = (s0.sx0 + s0.sx1 + 1) / 2, cy = (s0.sy0 + s0.sy1 + 1) / 2, q = K.sq(cx - 0.5, cy - 0.5), qt = ((Math.round(q.turn / 90) % 4) + 4) % 4;
        let w2 = s0.sx1 - s0.sx0 + 1, h2 = s0.sy1 - s0.sy0 + 1; if (qt % 2) { const t = w2; w2 = h2; h2 = t; }
        const x0 = Math.round(q.X - w2 / 2), y0 = Math.round(q.Y - h2 / 2), up = sides[(sides.indexOf(s0.up) + qt) % 4];
        /* the run between the stair's foot and head keeps its heights: the squares under it are its ramp */
        return { sx0: x0, sy0: y0, sx1: x0 + w2 - 1, sy1: y0 + h2 - 1, up, h0: s0.h0, h1: s0.h1 }; });
    w.bridges = (w.bridges || []).map(b => { const a = K.sq(b.sx0, b.sy0), c = K.sq(b.sx1, b.sy1), vert = Math.abs(c.Y - a.Y) >= Math.abs(c.X - a.X), mx = Math.round((a.x + c.x) / 2), my = Math.round((a.y + c.y) / 2);
        return vert ? { sx0: mx, sy0: Math.min(a.y, c.y), sx1: mx, sy1: Math.max(a.y, c.y), y: b.y } : { sx0: Math.min(a.x, c.x), sy0: my, sx1: Math.max(a.x, c.x), sy1: my, y: b.y }; });
    /* the plots: every plot of the net with ground you can reach takes the district + name of the map's plot most of its squares come
       from; a plot wholly beyond the map is open ground (district of the nearest map plot; label mine) */
    const oldPlot = {}; w.plots.forEach(p => { oldPlot[p.id] = p; });
    const oldAt = (x, y) => oldPlot['P' + String(Math.floor(x / N)).padStart(2, '0') + '-' + String(Math.floor(y / N)).padStart(2, '0')];
    const out = [], GX = A.W / N, GY = A.H / N; let open = 0;
    for (let py = 0; py < GY; py++) for (let px = 0; px < GX; px++) {
        const tally = {}; let any = false, best = null, bd = 1e9, mid = null;
        for (let y = py * N; y < py * N + N; y++) for (let x = px * N; x < px * N + N; x++) { if (A.cell[y][x] !== 'x') any = true;
            const k = Math.floor(y / fq) * 3 + Math.floor(x / fq), [ox, oy] = K.back(K.dirAt(k, x + 0.5, y + 0.5));
            if (inMap(Math.floor(ox), Math.floor(oy)) && A0.cell[Math.floor(oy)][Math.floor(ox)] !== 'x') { const op = oldAt(ox, oy); if (op) tally[op.id] = (tally[op.id] || 0) + 1; }
            if (x === px * N + 6 && y === py * N + 6) mid = [ox, oy]; }
        if (!any) continue;
        const ids = Object.keys(tally).sort((a, b) => tally[b] - tally[a]);
        if (ids.length) { const op = oldPlot[ids[0]]; out.push({ id: 'P' + String(px).padStart(2, '0') + '-' + String(py).padStart(2, '0'), name: op.name, d: op.d, level: op.level, what: op.what, from: op.from + ' (on the ball)' }); continue; }
        w.plots.forEach(p => { const x = +p.id.slice(1, 3) * N + 6, y = +p.id.slice(4, 6) * N + 6, dd = Math.hypot(x - mid[0], y - mid[1]); if (dd < bd) { bd = dd; best = p; } });
        open++; out.push({ id: 'P' + String(px).padStart(2, '0') + '-' + String(py).padStart(2, '0'), name: w.name + ', open ground ' + open, d: best.d, level: 0, what: 'open ground round the ball', from: 'new plot (label mine): the round ' + w.name });
    }
    w.plots = out; w.A = A; w.cols = GX; w.cols0 = A0.W; w.rows0 = A0.H; w.rows = GY; w.round = true; w.remap = { fq, center: o.center, W0: A0.W, H0: A0.H };
}
WORLDS.forEach(roundRemap);
const i16 = A => { const b = Buffer.alloc(A.W * A.H * 8); for (let y = 0; y < A.H; y++) for (let x = 0; x < A.W; x++) A.H4[y][x].forEach((h, k) => b.writeInt16LE(Math.round(h * 100), (y * A.W + x) * 8 + k * 2)); return b.toString('base64'); };
const strip = (w, full) => Object.assign({ id: w.id, name: w.name, round: !!w.round, remap: w.remap || null, room: w.room, site: w.site, old: w.old, cols: w.cols, rows: w.rows, districts: w.districts, who: w.who, spawn: w.spawn, marker: w.marker, ways: w.ways, stairs: w.stairs || [], bridges: w.bridges || [], plots: w.plots,
    cells: w.A.cell.map(r => r.join('')) }, full ? { slope: i16(w.A) } : {},
    full && w.flat ? { flat: Object.assign({}, w.flat, { A: undefined, cells: w.flat.A.cell.map(r => r.join('')), slope: i16(w.flat.A) }) } : {});
const head = { area: 'Outer Space', version: 'plan-3', squareMeters: C, plotCells: N,
    note: 'Four rooms, one a world. Written by docs/plans/world-zones/draw-space.js; bake-space.js reads docs/areas/space/layout.json. Never hand-edit: edit the script and rerun.',
    legend: { x: 'rock / storm wall / nothing (never walked)', '.': 'ground', p: 'track', c: 'crater, canyon or bowl floor', m: 'mesa, terrace or platform top', r: 'ramp', t: 'pyramid tier', l: 'pad', i: 'ring ice', b: 'cloud belt', d: 'dark country (a mare, a dark belt)', k: 'black storm', w: 'polar ice', h: 'the hole\'s floor', e: 'rim, lip or dunes' },
    notBuilt: ['flying the Spaceship between worlds', 'floating outside the ship', 'the Sun, Earth, the asteroid belt and Low Orbit as places (plan 2)'] };
fs.mkdirSync(path.join(REPO, 'docs/areas/space'), { recursive: true });
fs.writeFileSync(path.join(REPO, 'docs/areas/space/layout.json'), JSON.stringify(Object.assign({}, head, { rooms: WORLDS.map(w => strip(w, true)) }), null, 0).replace(/\{"id":"(moon|mars|saturn|singularity)"/g, '\n{"id":"$1"').replace(/"cells":\[/g, '\n"cells":[\n').replace(/","(?=[x.pcmrtlihe]{40,})/g, '",\n"') + '\n');
fs.writeFileSync(path.join(__dirname, 'outer-space-layout-3.json'), JSON.stringify(Object.assign({}, head, { rooms: WORLDS.map(w => strip(w, false)) }), null, 1) + '\n');

/* the picture */
const S = 6, PAD = 34, GAPX = 40, DCOL = { M: '#cfd3dc', C: '#8d93a3', F: '#5d6272', Y: '#d0744a', V: '#7a3a2a', R: '#d9a56c', H: '#e0c080', G: '#8fdde6', D: '#7a50c8', A: '#e6b45a' };
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const o = []; let ox = PAD, rowH = 0, oy = 96; const place = [];
WORLDS.forEach((w, i) => { if (i === 2) { ox = PAD; oy += rowH + 150; rowH = 0; } place.push([ox, oy]); ox += w.A.W * S + GAPX + 330; rowH = Math.max(rowH, w.A.H * S); });
const Wd = Math.max(...WORLDS.map((w, i) => place[i][0] + w.A.W * S + 330)) + PAD; const Ht = oy + rowH + 150;
o.push(`<rect width="${Wd}" height="${Ht}" fill="#14161a"/>`);
o.push(`<text x="${PAD}" y="34" fill="#fff" font-size="22" font-weight="bold">OUTER SPACE · plot plan 3 · the redesign · four worlds, a room each · 72 plots, ten districts</text>`);
o.push(`<text x="${PAD}" y="58" fill="#b8bcc6" font-size="13">Each world is the ultimate version of what people picture there. You reach each exactly as today: the Spaceship's collar, the bays, the links. Flying the ship and floating in space are new mechanics: listed, not built. One square = 3.5 m; a plot = 12 x 12 squares.</text>`);
WORLDS.forEach((w, i) => { const [X, Y] = place[i], A = w.A;
    o.push(`<text x="${X}" y="${Y - 12}" fill="#fff" font-size="17" font-weight="bold">${esc(w.name.toUpperCase())} · ${w.cols} x ${w.rows} plots · ${A.W * C} x ${A.H * C} m</text>`);
    for (let y = 0; y < A.H; y++) for (let x = 0; x < A.W; x++) { const ch = A.cell[y][x]; let col = w.pal[ch] || '#f0f';
        /* shade by height so the forms read */
        if (ch !== 'x') { const h = A.H4[y][x].reduce((a, b) => a + b, 0) / 4, k = Math.max(-0.35, Math.min(0.35, h / 22)); const c = parseInt(col.slice(1), 16), f = v => Math.max(0, Math.min(255, Math.round(v * (1 + k * 1.6)))); col = `rgb(${f(c >> 16)},${f((c >> 8) & 255)},${f(c & 255)})`; }
        o.push(`<rect x="${X + x * S}" y="${Y + y * S}" width="${S}" height="${S}" fill="${col}"/>`); }
    w.plots.forEach(p => { const px = +p.id.slice(1, 3), py = +p.id.slice(4, 6), x = X + px * N * S, y = Y + py * N * S;
        o.push(`<rect x="${x}" y="${y}" width="${N * S}" height="${N * S}" fill="none" stroke="${DCOL[p.d]}" stroke-width="2" stroke-opacity="0.9"/>`);
        o.push(`<text x="${x + 4}" y="${y + 12}" fill="#fff" font-size="9.5" font-weight="bold" stroke="#000" stroke-width="2.4" paint-order="stroke">${esc(p.name)}</text>`);
        o.push(`<text x="${x + 4}" y="${y + 23}" fill="#ffe9a8" font-size="8" stroke="#000" stroke-width="2" paint-order="stroke">${p.id} · ${p.d} · L${p.level}</text>`); });
    Object.keys(w.ways).forEach(k => { const q = w.ways[k], hid = /hidden/.test(q.kind), cx = X + (q.sx + 0.5) * S, cy = Y + (q.sy + 0.5) * S;
        o.push(`<circle cx="${cx}" cy="${cy}" r="7" fill="${hid ? '#ff7ad9' : '#4dff7a'}" stroke="#000" stroke-width="2"/>`);
        o.push(`<text x="${cx + 10}" y="${cy + 4}" fill="${hid ? '#ff9ee4' : '#8dffa8'}" font-size="10" font-weight="bold" stroke="#000" stroke-width="2.6" paint-order="stroke">${esc(q.kind)}</text>`); });
    o.push(`<rect x="${X}" y="${Y}" width="${A.W * S}" height="${A.H * S}" fill="none" stroke="#fff" stroke-width="2"/>`);
    let ly = Y + 6; const lx = X + A.W * S + 14, line = (t, c, b) => { o.push(`<text x="${lx}" y="${ly}" fill="${c || '#cfd3dc'}" font-size="11"${b ? ' font-weight="bold"' : ''}>${esc(t)}</text>`); ly += 15; };
    line('DISTRICTS', '#fff', true); Object.keys(w.districts).forEach(d => { o.push(`<rect x="${lx}" y="${ly - 10}" width="11" height="11" fill="${DCOL[d]}"/>`); o.push(`<text x="${lx + 16}" y="${ly}" fill="#cfd3dc" font-size="11">${d} · ${esc(w.districts[d])} (${w.plots.filter(p => p.d === d).length} plots) · districts/${d}.js</text>`); ly += 15; });
    ly += 6; line('LANDMARKS', '#fff', true); w.plots.filter(p => /LANDMARK/.test(p.what)).forEach(p => line('· ' + p.name));
    ly += 6; line('WHO LIVES HERE', '#fff', true); w.who.split('; ').forEach(s => line(s));
    ly += 6; line('GROUND', '#fff', true); Object.keys(w.pal).forEach(ch => { o.push(`<rect x="${lx}" y="${ly - 10}" width="11" height="11" fill="${w.pal[ch]}" stroke="#666"/>`); o.push(`<text x="${lx + 16}" y="${ly}" fill="#cfd3dc" font-size="10">${esc(head.legend[ch])}</text>`); ly += 14; }); });
{ const y = Ht - 118, t = (s, k) => o.push(`<text x="${PAD}" y="${y + k * 16}" fill="#b8bcc6" font-size="12">${esc(s)}</text>`);
  t('WAYS (green = open, pink = hidden): the Spaceship\'s one collar opens on the Moon\'s Terrace, Mars\' Rover Bay or Saturn\'s Docking Shelf, whichever the bridge lays in (and on Antarctica); Moon <> Mars by the bore (the Far Side <> the Face\'s mouth);', 0);
  t('Saturn <> the Singularity by the frame on the rim walk; the Singularity\'s screen <> DOOR HQ\'s observatory; one bay door a world. THE SPACESHIP stays handmade (its four rooms are not on this plan).', 1);
  t('Brighter = higher. A step you cannot walk is a cliff (the terrace, the mesas, the Face, the pyramid\'s tiers, the canyon, the rim walk, the shelves\' ramps are the ways). Every flat stretch is room to fight.', 2);
  t('NOT BUILT, LISTED: flying the ship by hand between worlds · floating outside it · the Sun, Earth, the asteroid belt and Low Orbit as places (plan 2\'s open space).', 3);
  t('Labels marked "(label mine)" in the json are plain labels for plots the old rooms had no name for. This is a plan drawing, not the game.', 4); }
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${Wd}" height="${Ht}" viewBox="0 0 ${Wd} ${Ht}" font-family="DejaVu Sans, Arial, sans-serif">${o.join('')}</svg>`;
const svgPath = path.join(__dirname, 'outer-space_plot_plan_3.svg'); fs.writeFileSync(svgPath, svg);
(async () => {
    let pw; try { pw = require('playwright'); } catch (e) { try { pw = require('/opt/node-tools/node_modules/playwright'); } catch (e2) { console.log('no playwright: open the .svg in a browser'); return; } }
    const b = await pw.chromium.launch(fs.existsSync('/opt/pw-browsers/chromium') ? { executablePath: '/opt/pw-browsers/chromium' } : {}); const pg = await b.newPage({ viewport: { width: Wd, height: Ht } });
    await pg.setContent(`<body style="margin:0;background:#14161a">${svg}</body>`); await pg.screenshot({ path: path.join(__dirname, 'outer-space_plot_plan_3.png') }); await b.close(); fs.unlinkSync(svgPath);
    console.log('wrote outer-space_plot_plan_3.png ' + Wd + 'x' + Ht);
})();
