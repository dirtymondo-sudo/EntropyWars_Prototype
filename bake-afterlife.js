#!/usr/bin/env node
/* bake-afterlife.js — HEAVEN + HELL + VATICAN ON PLOTS (2026-11-16, the zone thread on mondo's order: "completely redesigned/reimagined with
   plots and districts ... like we did for disaster city or Camelot"; docs/plans/ZONE_THREAD_BRIEF.md).
   FOUR ROOMS, 66 plots of 12 x 12 squares of 3.5 m, 14 districts:
     HELL            site_prebuilt_hell_plots      4 x 4   R the Rim · D the Descent · L the Bowl · W the Walkways
     THE CATACOMBS   site_prebuilt_vatican_under   3 x 2   K the Catacombs
     THE VATICAN     site_prebuilt_vatican_plots   6 x 4   B the Basilica · S the Square · P the Palace · C the Cloister · G the Gardens
     HEAVEN          site_prebuilt_heaven_plots    4 x 5   T the Stairway · A the Gate · F the Cloud Fields · Y the City
   Reads docs/areas/afterlife/layout.json (written by docs/plans/world-zones/draw-afterlife.js: THAT file is the map; change a square there,
   run it, run this) and writes the four rooms into data.js between AFTERLIFE-<ROOM>-BEGIN / END. `node bake-afterlife.js` writes; `--dry-run`
   prints the counts; `AFTERLIFE_DUMP=<room key>` prints the walked map. Never hand-edit between the markers.
   THE DISTRICTS' CONTENT IS NOT HERE: docs/areas/afterlife/districts/<LETTER>.js, one thread a file (THE DISTRICT FILES below). This tool holds
   what is shared: the squares, the heights, the paint, the water / the lava / the sky, the stairs, the bridges, the ways out, the shells, the
   checks. Nobody edits it without a dated note at the bottom of docs/notes/claims.md.
   HOW A ROOM IS MADE — THE HEIGHTS ARE THE MAP (the Beach's way): `terrain.slope.cells` carries every square's four corners; a step taller
   than the walker climbs is the wall (the Vatican's wall, a hedge, Hell's rock). Rows over it wear `absY: true`.
     HELL      lava = `pool` / `stream` rows at 0 over squares sunk to -2 (a walker who steps in is put back); land that stands INSIDE a lava
               row's outline (the platforms, the Plinth's island) is written again as `plateau` rows after it (a pool carves).
     HEAVEN    a VOID room (terrain.void): no height grid; every run of cloud is a FLOATING `plateau` (a puff under it), the four flights
               are floating stairs, the wall of cloud is solid. Stepping off is a fall back to the last cloud stood on.
     THE CATACOMBS  a closed shell (a brick roof at 7 m); solid squares stand to the roof.
   Squares are (sx west to east, sy north to south); R.gx / R.gz = a square's west / north line in metres, R.mx / R.mz = its middle.
   Notes: docs/notes/areas-complexes.md "HEAVEN + HELL + VATICAN ON PLOTS" + "THE AFTERLIFE, THE ZONE KIT". */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const REPO = __dirname, DRY = process.argv.includes('--dry-run');
const LAYOUT = JSON.parse(fs.readFileSync(path.join(REPO, 'docs/areas/afterlife/layout.json'), 'utf8'));
const C = 3.5, N = 12, PL = N * C;
const r2 = v => Math.round(v * 100) / 100;
const J = v => JSON.stringify(v).replace(/"([a-zA-Z_][a-zA-Z0-9_]*)":/g, '$1:').replace(/'/g, "\\'").replace(/"/g, "'");
const D = require('./load-data.js').loadGameData();
const CAT = vm.runInContext('DOOR_HQ.catalogue', D), RACES = vm.runInContext('AVAILABLE_RACES', D);
/* the old rooms' people keep their own lines and the old doors their plates: read from the old literals (they must stay in data.js) */
const OLDR = id => JSON.parse(vm.runInContext('JSON.stringify((r => r ? { n: r.npcSpots || [], l: r.lines || [], d: (r.doors || []).map(d => ({ id: d.id, label: d.label, sub: d.sub, desc: d.desc, leaf: d.leaf })), c: r.counters || [] } : { n: [], l: [], d: [], c: [] })(DOOR_HQ.rooms.' + id + '))', D));
const OLD = {}; ['vatican_catacombs', 'vatican_basilica', 'vatican_library', 'vatican_courtyard', 'vatican_observatory', 'hell_pit', 'hell_walkways', 'heaven_stair', 'heaven_gate'].forEach(k => { OLD[k] = OLDR('site_prebuilt_' + k); });
const say = (room, race, i, gender) => (OLD[room].n.filter(n => n.race === race && (!gender || n.gender === gender))[i || 0] || {}).say;
const mkRnd = s => { let v = s >>> 0; return () => { v = (v * 1664525 + 1013904223) >>> 0; return v / 4294967296; }; };

/* ── THE SHEETS ── */
const U = n => 'urban:' + n, GLS = U('GlassWindowTall1a');
/* a parts list (three-renderer.js _hqArchGeometry): the Estate's helper */
function sheet() {
    const P = [], add = (o, key, tint, x) => { if (key) o.key = key; if (tint != null) o.tint = tint; if (x) Object.assign(o, x); P.push(o); return o; };
    const A = { P,
        box: (x, y, z, w, h, d, key, tint, o) => add({ s: 'box', p: [r2(x), r2(y), r2(z)], size: [r2(w), r2(h), r2(d)] }, key, tint, o),
        cyl: (x, y, z, r, h, key, tint, o) => add({ s: 'cyl', p: [r2(x), r2(y), r2(z)], r: r2(r), h: r2(h) }, key, tint, o),
        dome: (x, y, z, r, h, key, tint, o) => add({ s: 'dome', p: [r2(x), r2(y), r2(z)], r: r2(r), h: r2(h) }, key, tint, o),
        roof: (form, x, y, z, w, h, d, key, tint, o) => add({ s: 'roof', form, p: [r2(x), r2(y), r2(z)], size: [r2(w), r2(h), r2(d)], roof: true }, key, tint, o),
        quad: (x, y, z, w, h, key, tint, o) => add({ s: 'quad', p: [r2(x), r2(y), r2(z)], size: [r2(w), r2(h)] }, key, tint, o),
        poly: (pts, y, h, key, tint, o) => add({ s: 'poly', p: [0, r2(y), 0], pts: pts.map(q => [r2(q[0]), r2(q[1])]), h: r2(h) }, key, tint, o),
        sign: (words, x, y, z, w, h, fg, bg, font, o) => { P.push(Object.assign({ s: 'quad', p: [r2(x), r2(y), r2(z)], size: [w, h], key: 'txt:' + words + '|' + fg + '|' + bg + '|' + r2(w / h) + '||' + (font || 'serif'), uv: 'fit', kind: 'wall' }, o || {})); } };
    return A;
}

/* ── THE ROOMS' OWN SETTINGS: which letters are walked, the paint, the shell ── */
const SET = {
    vatican: { site: 'prebuilt_vatican', part: 'plots', mark: 'VATICAN', sub: 'THE BASILICA · THE SQUARE · THE PALACE · THE CLOISTER · THE GARDENS', solid: 'XhT', wet: 'w', hole: 'q',
        pal: ['cobblestone', 'marble_light', 'marble', 'grass_2', 'dirt_2', 'leaves_3', 'bricks_3', 'gold', 'marble_2', 'dungeon'],
        paint: { c: 1, m: 2, k: 3, o: 9, w: 3, B: 3, s: 2, g: 4, d: 5, h: 6, T: 7, t: 2, X: 7, q: 10 },
        terrain: "res: 1.75, floor: 'cobblestone', cliff: 'bricks_3', path: 'marble_light', base: 0, noise: { amp: 0.02, scale: 9 }, crag: false,",
        shell: R => "hqVaticanShell({ w: " + R.WM + ", d: " + R.DM + ", fogD: 0.006, plate: " + J(R.plate) + R.atmos() + " })",
        parti: 'The holy city as the real one stands: the Basilica in the west under its dome, the oval Square east of it inside two arcs of columns, the gate in the east wall, the palace north, the cloister south, the gardens behind the apse.' },
    catacombs: { site: 'prebuilt_vatican', part: 'under', mark: 'CATACOMBS', sub: 'THE CRYPT · THE DESCENT · THE LOCULI · THE CISTERN · THE FONT · THE WARM WALL', solid: 'X', wet: 'w', hole: '',
        pal: ['dungeon', 'bricks_3', 'cobblestone'], paint: { f: 1, s: 3, X: 2, w: 1 },
        terrain: "res: 1.75, floor: 'dungeon', cliff: 'bricks_3', path: 'cobblestone', base: 0, noise: { amp: 0.02, scale: 8 }, crag: false,",
        shell: R => "{ w: " + R.WM + ", d: " + R.DM + ", h: 7, wallH: 7, dadoH: 1, floor: 'dungeon', wall: 'bricks_3', dado: 'bricks_2', trim: 'marble', ceiling: 'bricks_3', floorColor: 0x8a8078, wallColor: 0x8a7a68, dadoColor: 0x6a5e52, ceilColor: 0x4a4038, pipes: false, strips: false, lights: [], mood: { light: 0xffc890, ambient: 0.34 }, plate: " + J(R.plate) + ", fog: { color: 0x0c0a08, density: 0.028 }, look: HQ_ROOM_LOOKS.catacombs" + R.atmos() + " }",
        parti: 'The dungeon under the Basilica: the crypt under the altar, two flights down to galleries of graves, a font, the foot of the cistern, and a hall whose far wall is warm.' },
    hell: { site: 'prebuilt_hell', part: 'plots', mark: 'HELL', sub: 'THE RIM · THE DESCENT · THE BOWL · THE WALKWAYS', solid: 'R', wet: '', hole: '', lava: 'L',
        pal: ['scorched', 'rocks_3', 'obsidian', 'rocks_5', 'rubble_3', 'lava'], paint: { r: 1, p: 2, o: 3, R: 4, a: 5, s: 2, L: 6 },
        terrain: "res: 1.75, floor: 'scorched', cliff: 'rocks_5', path: 'rocks_3', base: 0, noise: { amp: 0.12, scale: 5 }, crag: false,",
        shell: R => "{ w: " + R.WM + ", d: " + R.DM + ", h: 10, wallH: 10, dadoH: 1.05, open: true, edge: 'low', floor: 'scorched', wall: 'obsidian', dado: 'rocks_3', trim: 'obsidian', ceiling: 'obsidian', apron: 'scorched', skirt: 'obsidian', apronColor: 0x5a2a1c, floorColor: 0xc07050, wallColor: 0x5a3828, dadoColor: 0x4a3028, pipes: false, strips: false, lights: [], mood: { light: 0xff7a40, ambient: 0.5 }, " +
            "sky: { night: 1, tint: 0x4a0e06, tintAmt: 0.75, stars: 0, nebula: 0.25, fog: { color: 0x1c0604, amount: 0.7, top: 0.08, band: 0.6, density: 0.012 }, scenery: 'none', density: 0.5, landmarks: [] }, plate: " + J(R.plate) + ", look: HQ_ROOM_LOOKS.hell" + R.atmos() + " }",
        parti: 'One pit: a rim, a terrace, the bowl and a lake of lava with the Plinth on its island; the east side has fallen into a sea of lava, crossed on platforms and walkways.' },
    heaven: { site: 'prebuilt_heaven', part: 'plots', mark: 'HEAVEN', sub: 'THE STAIRWAY · THE GATE · THE CLOUD FIELDS · THE CITY', solid: 'K', wet: 'w', hole: '', sky: '.', float: true,
        top: { c: 'cloud_2', m: 'marble_light', B: 'marble_light', w: 'marble_light', K: 'cloud_thick', s: 'marble_light' },
        terrain: "res: 1.75, floor: 'cloud_2', cliff: 'cloud_thick', path: 'marble_light', base: 0, noise: { amp: 0, scale: 13 }, crag: false, void: { lip: 1, fall: -10, glow: 0xfff2d0, glowY: -30 },",
        shell: R => "hqDivineShell({ w: " + R.WM + ", d: " + R.DM + ", plate: " + J(R.plate) + R.atmos() + " })",
        parti: 'One climb: the foot of the stair in the sky, four floating flights, the Gate in a wall of cloud, the Cloud Fields behind it and the city on the highest cloud.' },
};

/* ── ONE ROOM ── */
const BLOCKS = {}, ROOMS = {}, COUNTS = {};
function makeRoom(PLAN) {
    const S = SET[PLAN.key], W = PLAN.cols * N, H = PLAN.rows * N, HW = W * C / 2, HD = H * C / 2;
    const gx = c => r2(-HW + c * C), gz = c => r2(-HD + c * C), mx = c => gx(c + 0.5), mz = c => gz(c + 0.5);
    const cell = PLAN.cells.map(r => r.split('')), hh = PLAN.heights.map(r => r.split(',').map(v => +v / 100));
    const plot = {}; PLAN.plots.forEach(p => { p.x = +p.id.slice(1, 3); p.y = +p.id.slice(4, 6); p.sx = p.x * N; p.sy = p.y * N; plot[p.id] = p; });
    const plotAt = (sx, sy) => plot['P' + String(Math.floor(sx / N)).padStart(2, '0') + '-' + String(Math.floor(sy / N)).padStart(2, '0')];
    const inb = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
    const F = [], LATE = [], ARCH = [], props = [], doors = [], npc = [], counters = [], marks = [], air = [], errs = [], strays = [], taken = new Set(), count = {};
    const R = { key: PLAN.key, id: PLAN.room, PLAN, S, W, H, HW, HD, WM: 2 * HW, DM: 2 * HD, C, N, gx, gz, mx, mz, r2, cell, hh, plot, plotAt, inb, F, ARCH, props, doors, npc, counters, marks, taken, count, anchors: {} };
    const walk = (x, y) => inb(x, y) && S.solid.indexOf(cell[y][x]) < 0 && (S.sky || '').indexOf(cell[y][x]) < 0 && (S.lava || '').indexOf(cell[y][x]) < 0 && (S.hole || '').indexOf(cell[y][x]) < 0;
    R.walk = walk; R.hAt = (sx, sy) => hh[Math.max(0, Math.min(H - 1, sy))][Math.max(0, Math.min(W - 1, sx))];
    const feat = o => { F.push(o); return o; }; R.feat = feat;
    let curD = null;
    function spot(sx, sy, what, shared) { if (!inb(sx, sy)) { errs.push(what + ' is off the room at ' + sx + ',' + sy); return; }
        if (curD && plotAt(sx, sy).d !== curD) strays.push(curD + ': ' + what + ' at ' + sx + ',' + sy + ' (' + plotAt(sx, sy).d + ')');
        if (!walk(sx, sy) || S.wet.indexOf(cell[sy][sx]) >= 0) { errs.push(PLAN.key + ': ' + what + ' stands where nobody walks, at ' + sx + ',' + sy + ' (' + cell[sy][sx] + ')'); return; }
        if (!shared) { if (taken.has(sx + ':' + sy)) errs.push(PLAN.key + ': ' + what + ': square ' + sx + ',' + sy + ' is taken'); taken.add(sx + ':' + sy); } }
    R.take = (sx, sy) => taken.add(sx + ':' + sy);
    /* a blocker on a square's middle (P), decor off it (dec), people (native). Heaven's clouds hang: every piece there carries its floor's height */
    const yOf = () => null;   // (a piece with no `y` stands on the field, and the field carries the clouds; a piece on a BRIDGE passes its own y)
    R.P = (key, sx, sy, o) => { spot(sx, sy, key); props.push(Object.assign({ key, x: mx(sx), z: mz(sy) }, yOf(sx, sy, o), o || {})); };
    R.decWith = rnd => (key, sx, sy, o) => { spot(sx, sy, key, true); props.push(Object.assign({ key, x: r2(mx(sx) + (rnd() - 0.5) * 1.6), z: r2(mz(sy) + (rnd() - 0.5) * 1.6), face: Math.round(rnd() * 360) }, yOf(sx, sy, o), o || {})); };
    R.at = (key, x, z, o) => { props.push(Object.assign({ key, x: r2(x), z: r2(z) }, o || {})); };   // a piece at a place in metres (a wall piece, a thing on a table): the district answers for it
    R.native = (race, sx, sy, face, sayLines, o) => { spot(sx, sy, race); const n = Object.assign({ x: mx(sx), z: mz(sy), face: face || 0, race }, yOf(sx, sy), o || {}); if (sayLines) n.say = sayLines; npc.push(n); };
    R.tree = (sx, sy, kind, h, r) => { spot(sx, sy, 'tree'); if ('gd'.indexOf(cell[sy][sx]) < 0) errs.push('a tree off the grass at ' + sx + ',' + sy); feat({ k: 'tree', x: mx(sx), z: mz(sy), kind, h, r: r || 0.8 }); };
    R.look = (id, x, z, rot, y, fn) => { const a = sheet(); fn(a); const row = { k: 'arch', id: 'aft:' + PLAN.key + ':' + id, x: r2(x), z: r2(z), rot: rot || 0, parts: a.P }; if (y != null) row.y = r2(y); ARCH.push(row); return row; };
    /* a wall the walker bumps, drawn or not (the castle's kit): from (x0, z0) to (x1, z1) in metres, its foot at y0, h tall */
    R.wall = (x0, z0, x1, z1, y0, h, o) => feat(Object.assign({ k: 'wall', absY: true, x0: r2(x0), z0: r2(z0), x1: r2(x1), z1: r2(z1), t: 0.4, h: r2(h), y: r2(y0 + h), ghost: true, rail: false }, o || {}));
    R.rail = (x0, z0, x1, z1, y, model) => feat(Object.assign({ k: 'rail', x0: r2(x0), z0: r2(z0), x1: r2(x1), z1: r2(z1), model: model || 'balusters_d' }, y != null ? { y: r2(y) } : {}));
    R.mark = m => marks.push(m);
    R.say = say; R.OLD = OLD; R.sheet = sheet; R.U = U; R.GLS = GLS;
    /* a walk-in building on whole squares (the Estate's helper): a hollow `texbuilding` (walls, doorway, swinging leaf, inside) with its own
       outside switched off + its look as an `arch` parts list. q = [sx0, sy0, sx1, sy1, side its front is on]; parts frame: x along the front,
       +z out of the front, y up from its floor. */
    const ROT = { S: 0, W: 90, N: 180, E: 270 };
    R.BUILT = {};
    R.building = (id, q, h, o, parts) => {
        const [sx0, sy0, sx1, sy1, side] = q, ew = side === 'E' || side === 'W', fw = (ew ? sy1 - sy0 : sx1 - sx0) * C, fd = (ew ? sx1 - sx0 : sy1 - sy0) * C, cx = gx((sx0 + sx1) / 2), cz = gz((sy0 + sy1) / 2), rot = ROT[side];
        const row = Object.assign({ k: 'texbuilding', id: 'aft:' + id, seed: 1, x: cx, z: cz, w: fw, d: fd, rot, storeys: Math.max(1, Math.floor(h / 3.5 + 0.01)), h, skin: false, hollow: true, leaf: 'leaf_wooden', leafDouble: true, keyIn: 'marble_light', floorIn: 'marble' }, S.float ? { base: hh[sy0][sx0], absY: true } : {}, o || {});
        Object.keys(row).forEach(k => { if (row[k] === undefined) delete row[k]; });
        (S.float ? LATE : F).push(row);
        for (let y = sy0; y < sy1; y++) for (let x = sx0; x < sx1; x++) taken.add(x + ':' + y);
        const L = Math.max(2, fw) - 0.12, cols = Math.max(1, Math.round(L / 1.75)), cw = L / cols; let col = Math.floor((cols - 1) / 2); if (row.door >= 1) col = Math.min(cols - 1, Math.round(row.door) - 1);
        const door = { lx: -L / 2 + (col + 0.5) * cw, cw }, a = sheet(); parts(a, fw, fd, door);
        const lk = { k: 'arch', id: 'aft:' + id + ':look', x: cx, z: cz, rot, parts: a.P }; if (S.float) lk.y = hh[sy0][sx0]; ARCH.push(lk);
        const t = rot * Math.PI / 180, c = Math.cos(t), s = Math.sin(t); count.buildings = (count.buildings || 0) + 1;
        return (R.BUILT[id] = { at: (lx, lz) => [r2(cx + lx * c - lz * s), r2(cz + lx * s + lz * c)], face: f => (f + rot) % 360, fw, fd, door, cx, cz, rot, y: hh[sy0][sx0] });
    };
    R.put = (B, key, lx, lz, o) => { const p = B.at(lx, lz), r = Object.assign({ key, x: p[0], z: p[1] }, S.float ? { y: B.y } : {}, o || {}); if (r.face != null) r.face = B.face(r.face); props.push(r); };
    R.airZone = z => air.push(Object.assign({}, z, { x0: gx(z.sx0), z0: gz(z.sy0), x1: gx(z.sx1), z1: gz(z.sy1), sx0: undefined, sy0: undefined, sx1: undefined, sy1: undefined }));
    R.atmos = () => air.length ? ", atmos: " + J({ kind: air[0].kind, n: air[0].n, zones: air.map(z => { const q = {}; Object.keys(z).forEach(k => { if (z[k] !== undefined) q[k] = z[k]; }); return q; }) }) : "";
    R._ = { spot, errs, strays, LATE, setD: d => { curD = d; } };
    return R;
}

/* ── THE SHARED PIECES OF A ROOM, after its districts have built: the heights, the paint, the liquids, the stairs, the bridges ── */
function finish(R) {
    const { PLAN, S, W, H, gx, gz, mx, mz, cell, hh, F, walk, count } = R, T = [];   // T = the shared terrain rows, written BEFORE the districts' rows
    const rects = (test, same) => { const used = new Uint8Array(W * H), out = [];
        for (let cy = 0; cy < H; cy++) for (let cx = 0; cx < W; cx++) { if (used[cy * W + cx] || !test(cx, cy)) continue;
            let w = 1; while (cx + w < W && !used[cy * W + cx + w] && test(cx + w, cy) && same(cx, cy, cx + w, cy)) w++;
            let h = 1; rows: while (cy + h < H) { for (let i = 0; i < w; i++) if (used[(cy + h) * W + cx + i] || !test(cx + i, cy + h) || !same(cx, cy, cx + i, cy + h)) break rows; h++; }
            for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) used[(cy + j) * W + cx + i] = 1;
            out.push([cx, cy, cx + w, cy + h]); }
        return out; };
    const stairSq = new Set(); PLAN.stairs.forEach(s => { for (let y = s.y0; y < s.y1; y++) for (let x = s.x0; x < s.x1; x++) stairSq.add(x + ':' + y); });
    /* THE STAIRS: a drawn flight a `stairs` row of the layout; it rises toward `dir`. Its foot starts on the low floor's line, its head lands 0.4 m into the high floor */
    PLAN.stairs.forEach((s, i) => { const ns = s.dir === 'N' || s.dir === 'S', w = (ns ? s.x1 - s.x0 : s.y1 - s.y0) * C, m = ns ? gx((s.x0 + s.x1) / 2) : gz((s.y0 + s.y1) / 2);
        const lo = s.dir === 'N' ? gz(s.y1) : s.dir === 'S' ? gz(s.y0) : s.dir === 'W' ? gx(s.x1) : gx(s.x0), hi = s.dir === 'N' ? gz(s.y0) - 0.4 : s.dir === 'S' ? gz(s.y1) + 0.4 : s.dir === 'W' ? gx(s.x0) - 0.4 : gx(s.x1) + 0.4;
        const row = { k: 'ramp', absY: true, x0: ns ? m : lo, z0: ns ? lo : m, x1: ns ? m : r2(hi), z1: ns ? r2(hi) : m, w, h0: s.h0, h1: s.h1, stairs: true, edge: 0.1 };
        if (s.float) row.float = true; else { row.model = s.model || 'stone'; row.built = true; } if (s.key) { row.key = s.key; row.side = s.side || s.key; }
        T.push(row); });
    let slope = null, paint = null;
    if (S.float) {
        /* HEAVEN: every run of cloud of one height and one sheet is a floating plateau; the wall of cloud is solid */
        rects((x, y) => (S.sky.indexOf(cell[y][x]) < 0) && !stairSq.has(x + ':' + y), (a, b, c, d) => cell[b][a] === cell[d][c] && hh[b][a] === hh[d][c]).forEach(q => { const ch = cell[q[1]][q[0]], h = hh[q[1]][q[0]];
            const row = { k: 'plateau', x: gx((q[0] + q[2]) / 2), z: gz((q[1] + q[3]) / 2), w: r2((q[2] - q[0]) * C + 0.1), d: r2((q[3] - q[1]) * C + 0.1), h, edge: 0.15, top: S.top[ch] || 'cloud_2' };
            if (S.solid.indexOf(ch) < 0) { row.float = true; row.under = 'cloud'; } T.push(row); });
        count.clouds = T.length;
    } else {
        /* THE HEIGHTS: four corners a square (cm). A stair's / a slope's squares carry its grade */
        const cor = (x, y) => { const v = hh[y][x]; return [v, v, v, v]; }, grade = {};
        PLAN.stairs.concat(PLAN.slopes || []).forEach(s => { for (let y = s.y0; y < s.y1; y++) for (let x = s.x0; x < s.x1; x++) { const ns = s.dir === 'N' || s.dir === 'S', n = ns ? s.y1 - s.y0 : s.x1 - s.x0, i = ns ? y - s.y0 : x - s.x0;
            const t0 = (s.dir === 'S' || s.dir === 'E') ? i / n : 1 - i / n, t1 = (s.dir === 'S' || s.dir === 'E') ? (i + 1) / n : 1 - (i + 1) / n, a = s.h0 + (s.h1 - s.h0) * t0, b = s.h0 + (s.h1 - s.h0) * t1;
            grade[x + ':' + y] = ns ? [a, a, b, b] : [a, b, a, b]; } });
        slope = Buffer.alloc(W * H * 8);
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const q = grade[x + ':' + y] || cor(x, y), o = (y * W + x) * 8; q.forEach((v, k) => slope.writeInt16LE(Math.round(v * 100), o + k * 2)); }
        paint = new Uint8Array(W * H); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const p = S.paint[cell[y][x]]; if (p == null) throw new Error(PLAN.key + ': no paint for `' + cell[y][x] + '`'); paint[y * W + x] = p; }
    }
    /* THE WATER: every block of `w` squares is one round pool in its basin */
    if (S.wet) { const seen = new Set();
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { if (S.wet.indexOf(cell[y][x]) < 0 || seen.has(x + ':' + y)) continue;
            let x0 = x, x1 = x, y0 = y, y1 = y; const st = [[x, y]]; seen.add(x + ':' + y);
            while (st.length) { const [a, b] = st.pop(); x0 = Math.min(x0, a); x1 = Math.max(x1, a); y0 = Math.min(y0, b); y1 = Math.max(y1, b);
                [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => { const X = a + dx, Y = b + dy; if (R.inb(X, Y) && S.wet.indexOf(cell[Y][X]) >= 0 && !seen.has(X + ':' + Y)) { seen.add(X + ':' + Y); st.push([X, Y]); } }); }
            const row = { k: 'pool', absY: true, round: true, x: gx((x0 + x1 + 1) / 2), z: gz((y0 + y1 + 1) / 2), r: r2((x1 - x0 + 1) * C / 2 - 0.25), rz: r2((y1 - y0 + 1) * C / 2 - 0.25), y: r2(hh[y][x] + 0.42), depth: 0.42, key: 'water', bank: 0.3 };
            (S.float ? R._.LATE : T).push(row); count.pools = (count.pools || 0) + 1; } }
    /* THE LAVA (Hell): the sea = one wide `stream`, the lake = one `pool`; then every piece of land inside their outlines again, as plateaus */
    if (S.lava) {
        const isL = (x, y) => R.inb(x, y) && S.lava.indexOf(cell[y][x]) >= 0, rows = [];
        const sea = { k: 'stream', absY: true, pts: [[mx(40.5), gz(1.4)], [mx(40.5), gz(46.6)]], w: 10 * C + 0.4, y: 0, depth: 2, key: 'lava', bank: 0.3 };
        const lake = { k: 'pool', absY: true, x: gx(29), z: gz(28), r: r2(6.5 * C + 0.3), rz: r2(6 * C + 0.3), y: 0, depth: 2, key: 'lava', bank: 0.3 };
        rows.push(sea, lake); T.push(sea, lake);
        const inside = (x, y) => { const px = mx(x), pz = mz(y); return (Math.abs(px - mx(40.5)) < 5 * C + 2.4 && y >= 1 && y <= 46) || (Math.pow((px - lake.x) / (lake.r + 2.2), 2) + Math.pow((pz - lake.z) / (lake.rz + 2.2), 2) <= 1); };
        rects((x, y) => !isL(x, y) && inside(x, y) && !stairSq.has(x + ':' + y), (a, b, c, d) => hh[b][a] === hh[d][c]).forEach(q => T.push({ k: 'plateau', absY: true, x: gx((q[0] + q[2]) / 2), z: gz((q[1] + q[3]) / 2), w: (q[2] - q[0]) * C, d: (q[3] - q[1]) * C, h: hh[q[1]][q[0]], edge: 0.05 }));
        let n = 0; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (isL(x, y) && !inside(x, y)) n++; if (n) R._.errs.push('hell: ' + n + ' lava squares lie outside the two lava rows');
    }
    /* THE BRIDGES + THE CLIMBS */
    PLAN.bridges.forEach((b, i) => { const ns = (b.y1 - b.y0) > (b.x1 - b.x0), w = (ns ? b.x1 - b.x0 : b.y1 - b.y0) * C, m = ns ? gx((b.x0 + b.x1) / 2) : gz((b.y0 + b.y1) / 2), a = ns ? gz(b.y0) - 0.5 : gx(b.x0) - 0.5, e = ns ? gz(b.y1) + 0.5 : gx(b.x1) + 0.5;
        T.push({ k: 'bridge', absY: true, id: 'aft:' + PLAN.key + ':bridge' + (i + 1), x0: ns ? m : r2(a), z0: ns ? r2(a) : m, x1: ns ? m : r2(e), z1: ns ? r2(e) : m, w, y: b.y, thick: 0.9, rails: !!b.rails, key: b.key || 'rocks_3' }); });
    (PLAN.climbs || []).forEach(c => T.push({ k: 'climb', x: r2(mx(c.sx) - (c.face === 90 ? 1.45 : 0)), z: mz(c.sy), face: c.face, look: c.look || 'ladder' }));
    /* ── the check: every plot is walked to from the spawn; a step over 1.1 m is a wall; a flight, a bridge and a climb carry the walker ── */
    const hC = (x, y) => hh[y][x], seen = new Uint8Array(W * H), sp = R.spawnSq, st = [sp], link = {};
    const join = (a, b) => { (link[a] = link[a] || []).push(b); (link[b] = link[b] || []).push(a); };
    PLAN.bridges.forEach(b => { const ns = (b.y1 - b.y0) > (b.x1 - b.x0); if (ns) for (let x = b.x0; x < b.x1; x++) join(x + ':' + (b.y0 - 1), x + ':' + b.y1); else for (let y = b.y0; y < b.y1; y++) join((b.x0 - 1) + ':' + y, b.x1 + ':' + y); });
    PLAN.stairs.forEach(s => { const ns = s.dir === 'N' || s.dir === 'S'; if (ns) for (let x = s.x0; x < s.x1; x++) join(x + ':' + (s.y0 - 1), x + ':' + s.y1); else for (let y = s.y0; y < s.y1; y++) join((s.x0 - 1) + ':' + y, s.x1 + ':' + y); });
    (PLAN.climbs || []).forEach(c => join((c.sx - 1) + ':' + c.sy, c.sx + ':' + c.sy));
    if (!walk(sp[0], sp[1])) throw new Error(PLAN.key + ': the spawn square ' + sp + ' is not walked');
    seen[sp[1] * W + sp[0]] = 1;
    while (st.length) { const [x, y] = st.pop(), nb = [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]].filter(q => walk(q[0], q[1]) && !stairSq.has(q[0] + ':' + q[1]) && !stairSq.has(x + ':' + y) && Math.abs(hC(q[0], q[1]) - hC(x, y)) <= 1.1);
        (link[x + ':' + y] || []).forEach(k => { const q = k.split(':').map(Number); if (walk(q[0], q[1])) nb.push(q); });
        nb.forEach(q => { if (!seen[q[1] * W + q[0]]) { seen[q[1] * W + q[0]] = 1; st.push(q); } }); }
    const cold = PLAN.plots.filter(p => { let any = false; for (let ly = 0; ly < N; ly++) for (let lx = 0; lx < N; lx++) { if (walk(p.sx + lx, p.sy + ly) && !stairSq.has((p.sx + lx) + ':' + (p.sy + ly))) any = true; if (seen[(p.sy + ly) * W + p.sx + lx]) return false; } return any; }).map(p => p.id);
    if (process.env.AFTERLIFE_DUMP === PLAN.key) console.log(cell.map((r, y) => r.map((ch, x) => stairSq.has(x + ':' + y) ? '/' : walk(x, y) && !seen[y * W + x] ? '!' : ch).join('')).join('\n'));
    if (cold.length) R._.errs.push(PLAN.key + ': plots not reached on foot: ' + cold.join(' '));
    let op = 0, un = 0; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (walk(x, y) && !stairSq.has(x + ':' + y)) { op++; if (!seen[y * W + x]) un++; }
    Object.assign(count, { walked: op, unreached: un });
    return { T, slope, paint };
}

/* ── THE DISTRICT FILES: docs/areas/afterlife/districts/<LETTER>.js, one per district, one thread a file. A file exports any of the stages
   `build(ctx)` (terrain rows, buildings, drawn pieces), `dress(ctx)` (props), `people(ctx)`, `air(ctx)` (ctx.airZone). Each is called with
   the district's own ctx: its room's helpers (R above) + its own dice (ctx.rnd, ctx.dec) + ctx.d. A piece a district stands on another
   district's squares is printed, not refused. Stages run in the order of the layout's `districts`. ── */
const DIR = path.join(REPO, 'docs/areas/afterlife/districts'), DISTRICTS = {};
Object.keys(LAYOUT.districts).forEach(k => { const f = path.join(DIR, k + '.js'); if (!fs.existsSync(f)) throw new Error('district file missing: docs/areas/afterlife/districts/' + k + '.js'); DISTRICTS[k] = require(f); });

/* ── THE WAYS (every one was in the game before the rebuild; the link rows in data.js DOOR_HQ.links hold the place, WANT checks them) ── */
const wallAt = (R, w) => w.wall === 'n' || w.wall === 's' ? { wall: w.wall, x: R.gx(w.sx) } : { wall: w.wall, z: R.gz(w.sy) };   // a wall way is two squares wide: its middle is the line between them
const freeAt = (R, w) => ({ wall: 'free', x: R.mx(w.sx), z: R.mz(w.sy), face: w.face });
const WAYS = {};

LAYOUT.rooms.forEach(PLAN => { const R = makeRoom(PLAN); ROOMS[PLAN.key] = R;
    PLAN.ways.forEach(w => { const a = w.wall === 'free' ? freeAt(R, w) : wallAt(R, w); WAYS[PLAN.key + ':' + w.id] = a; if (w.wall === 'free') R.take(w.sx, w.sy); }); });
const V = ROOMS.vatican, K = ROOMS.catacombs, L = ROOMS.hell, HV = ROOMS.heaven;
V.spawnSq = [50, 24]; K.spawnSq = [19, 3]; L.spawnSq = [18, 45]; HV.spawnSq = [6, 53];
V.plate = { x: V.mx(50), z: V.mz(24), y: 4.6 }; K.plate = { x: K.mx(19), z: K.mz(3), y: 7.6 }; L.plate = { x: L.mx(18), z: L.mz(44), y: 22 }; HV.plate = { x: HV.mx(6), z: HV.mz(53), y: 8 };
/* the doors between the Vatican and its Catacombs (the old rooms' own plates) */
{ const o = id => OLD.vatican_basilica.d.find(d => d.id === id) || {}, c = id => OLD.vatican_courtyard.d.find(d => d.id === id) || {}, k = id => OLD.vatican_catacombs.d.find(d => d.id === id) || {};
  V.doors.push(Object.assign({ id: 'crypt' }, WAYS['vatican:crypt'], { leaf: 'leaf_wooden', label: 'THE CATACOMBS', sub: o('crypt').sub || 'THE CRYPT STAIR · DOWN · BEHIND THE ALTAR', action: { room: K.id, at: 'stair' }, desc: o('crypt').desc || '' }));
  V.doors.push(Object.assign({ id: 'well' }, WAYS['vatican:well'], { way: 'well', label: 'THE CATACOMBS', sub: c('well').sub || 'THE WELL · DOWN THE ROPE · THE CATACOMBS', action: { room: K.id, at: 'well' }, desc: c('well').desc || '' }));
  K.doors.push(Object.assign({ id: 'stair' }, WAYS['catacombs:stair'], { leaf: 'leaf_wooden', label: 'THE VATICAN · THE BASILICA', sub: k('stair').sub || 'THE CRYPT STAIR · UP · BEHIND THE ALTAR', action: { room: V.id, at: 'crypt' }, desc: k('stair').desc || '' }));
  K.doors.push(Object.assign({ id: 'well' }, WAYS['catacombs:well'], { way: 'well', label: 'THE VATICAN · THE CISTERN', sub: k('well').sub || 'THE CISTERN · UP THE ROPE · THE COURTYARD', action: { room: V.id, at: 'well' }, desc: k('well').desc || '' })); }
/* the BATTLE markers (the old Basilica's, the old Pit's and the old Cloud Fields' own counters: each site's arena) */
[[V, 'vatican_basilica', 33, 24], [L, 'hell_pit', 18, 27], [HV, 'heaven_gate', 24, 21]].forEach(([R, old, sx, sy]) => { const c = OLD[old].c.find(c => c.id === 'battle'); if (c) { R.counters.push(Object.assign({}, c, { x: R.mx(sx), z: R.mz(sy) })); R.take(sx, sy); } });
/* the Healing Zone at the foot of the stair (the old Stairway's own counter) */
{ const hz = OLD.heaven_stair.c.find(c => c.id === 'healzone'); if (hz) HV.counters.push(Object.assign({}, hz, { x: HV.mx(8), z: HV.mz(55) })); HV.take(8, 55); }

const STAGES = ['build', 'dress', 'people', 'air'];
STAGES.forEach(stage => Object.keys(LAYOUT.districts).forEach(k => { const m = DISTRICTS[k], R = ROOMS[LAYOUT.districts[k].room]; if (typeof m[stage] !== 'function') return;
    const rnd = (R['rnd' + k] = R['rnd' + k] || mkRnd(7919 * k.charCodeAt(0))), ctx = Object.assign(Object.create(R), { d: k, rnd, dec: R.decWith(rnd), plots: R.PLAN.plots.filter(p => p.d === k) });
    R._.setD(k); try { m[stage](ctx); } finally { R._.setD(null); } }));

const file = path.join(REPO, 'data.js'); let src = fs.readFileSync(file, 'utf8');
const LINES = { vatican: OLD.vatican_basilica.l.concat(OLD.vatican_library.l, OLD.vatican_courtyard.l, OLD.vatican_observatory.l), catacombs: OLD.vatican_catacombs.l, hell: OLD.hell_pit.l.concat(OLD.hell_walkways.l), heaven: OLD.heaven_stair.l.concat(OLD.heaven_gate.l) };
LAYOUT.rooms.forEach(PLAN => { const R = ROOMS[PLAN.key], S = R.S, fin = finish(R), Ln = [];
    R.props.forEach(p => { if (!CAT[p.key]) R._.errs.push('not in the catalogue: ' + p.key); });
    R.npc.forEach(n => { if (RACES.indexOf(n.race) < 0) R._.errs.push('not a unit: ' + n.race); });
    if (R._.strays.length) console.log(PLAN.key + ': pieces a district stood on another district\'s squares:\n  ' + R._.strays.join('\n  '));
    if (R._.errs.length) throw new Error('misplaced:\n  ' + R._.errs.join('\n  '));
    Object.assign(R.count, { features: fin.T.length + R.F.length + R._.LATE.length + R.ARCH.length, props: R.props.length, doors: R.doors.length, natives: R.npc.length });
    const SPM = { x: R.mx(R.spawnSq[0]), z: R.mz(R.spawnSq[1]) }, M = 'AFTERLIFE-' + S.mark;
    Ln.push("        /* " + M + "-BEGIN — HEAVEN + HELL + VATICAN ON PLOTS (2026-11-16): written by `node bake-afterlife.js` from docs/areas/afterlife/layout.json + districts/. Never hand-edit between the markers. */");
    Ln.push("        " + R.id + ": {");
    Ln.push("            label: '" + PLAN.label + "',");
    Ln.push("            sub: '" + S.sub + "',");
    Ln.push("            kind: 'box', site: '" + S.site + "', part: '" + S.part + "',");
    Ln.push("            shell: " + S.shell(R) + ",");
    Ln.push("            parti: '" + S.parti.replace(/'/g, "\\'") + "',");
    Ln.push("            typology: 'grid',");
    Ln.push("            plots: { cell: " + C + ", plot: " + PL + ", n: " + PLAN.cols + ", nz: " + PLAN.rows + ", names: " + J(PLAN.plots.map(p => [p.id, p.name.replace(' (label mine)', ''), p.d, p.level])) + " },");
    Ln.push("            terrain: {");
    Ln.push("                " + S.terrain);
    if (R.marks.length) Ln.push("                marks: " + J(R.marks) + ",");
    if (fin.slope) Ln.push("                slope: { cells: { res: " + C + ", x0: " + R.gx(0) + ", z0: " + R.gz(0) + ", nx: " + R.W + ", nz: " + R.H + ", d: '" + fin.slope.toString('base64') + "' } },");
    if (fin.paint) Ln.push("                paint: { pal: " + J(S.pal) + ", t: 'u8', res: " + C + ", x0: " + R.mx(0) + ", z0: " + R.mz(0) + ", nx: " + R.W + ", nz: " + R.H + ", d: '" + Buffer.from(fin.paint).toString('base64') + "' },");
    Ln.push("                features: [");
    fin.T.concat(R.F, R._.LATE, R.ARCH).forEach(f => Ln.push("                    " + J(f) + ","));
    Ln.push("                ],");
    Ln.push("            },");
    Ln.push("            doors: [");
    R.doors.forEach(d => Ln.push("                " + J(d) + ","));
    Ln.push("            ],");
    Ln.push("            counters: " + J(R.counters) + ",");
    Ln.push("            props: [");
    for (let i = 0; i < R.props.length; i += 4) Ln.push("                " + R.props.slice(i, i + 4).map(J).join(", ") + ",");
    Ln.push("            ],");
    Ln.push("            agents: [],");
    Ln.push("            npcSpots: " + J(R.npc) + ",");
    Ln.push("            onlineSpots: [],");
    Ln.push("            lines: " + J(LINES[PLAN.key]) + ",");
    Ln.push("            spawn: { x: " + SPM.x + ", z: " + SPM.z + ", face: " + (PLAN.key === 'vatican' ? 270 : 0) + " },");
    Ln.push("        },");
    Ln.push("        /* " + M + "-END */");
    BLOCKS[PLAN.key] = Ln.join('\n') + '\n'; COUNTS[PLAN.key] = R.count; });
console.log(JSON.stringify(COUNTS));

/* the rows in data.js that name a place in these rooms (written by hand there): the tool refuses to bake when one has drifted */
const end = (site, part, a, sub) => "{ site: '" + site + "', part: '" + part + "', wall: '" + a.wall + "'" + (a.x != null ? ", x: " + a.x : "") + (a.z != null ? ", z: " + a.z : "") + (a.y != null ? ", y: " + a.y : "") + (a.face != null ? ", face: " + a.face : "") + (sub ? ", " : "");
const bay = (k, R) => { const a = WAYS[k + ':bay']; return "{ room: '" + R.id + "', door: { id: 'bay', wall: 'free', x: " + a.x + ", z: " + a.z + (a.y != null ? ", y: " + a.y : "") + ", face: " + a.face + " } }"; };
const WANT = [
    ["a: " + end('prebuilt_heaven', 'plots', WAYS['heaven:link_heaven_olympus'], 1), 'link heaven_olympus (a)'],
    ["a: " + end('prebuilt_vatican', 'plots', WAYS['vatican:link_vatican_olympus'], 1), 'link vatican_olympus (a)'],
    ["a: " + end('prebuilt_vatican', 'under', WAYS['catacombs:link_vatican_hell'], 1), 'link vatican_hell (a)'],
    ["b: " + end('prebuilt_hell', 'plots', WAYS['hell:link_vatican_hell'], 1), 'link vatican_hell (b)'],
    ["a: " + end('prebuilt_vatican', 'plots', WAYS['vatican:link_observatory_stair'], 1), 'link observatory_stair (a)'],
    ["b: " + end('prebuilt_heaven', 'plots', WAYS['heaven:link_observatory_stair'], 1), 'link observatory_stair (b)'],
    ["b: " + end('prebuilt_heaven', 'plots', WAYS['heaven:link_skycastle_stair'], 1), 'link skycastle_stair (b)'],
    ["b: " + end('prebuilt_vatican', 'plots', WAYS['vatican:link_bureau_vatican'], 1), 'link bureau_vatican (b)'],
    ["b: " + end('prebuilt_hell', 'plots', WAYS['hell:link_cave_hell'], 1), 'link cave_hell (b)'],
    ["prebuilt_vatican: " + bay('vatican', V), 'siteRooms.entry.prebuilt_vatican'],
    ["prebuilt_hell: " + bay('hell', L), 'siteRooms.entry.prebuilt_hell'],
    ["prebuilt_heaven: " + bay('heaven', HV), 'siteRooms.entry.prebuilt_heaven'],
];
const flat = src.replace(/ +/g, ' '), missing = WANT.filter(w => flat.indexOf(w[0]) < 0);
if (missing.length) { console.log('data.js rows to write by hand:'); missing.forEach(w => console.log('  ' + w[1] + ':  ' + w[0])); if (!DRY) throw new Error('data.js does not point at these rooms yet (see the rows above)'); }
if (DRY) process.exit(0);
['hell', 'catacombs', 'vatican', 'heaven'].forEach(k => { const M = 'AFTERLIFE-' + SET[k].mark, END = '        /* ' + M + '-END */\n', b0 = src.indexOf('        /* ' + M + '-BEGIN'), b1 = src.indexOf(END);
    if (b0 >= 0 && b1 > b0) src = src.slice(0, b0) + BLOCKS[k] + src.slice(b1 + END.length);
    else { const anchor = '        site_prebuilt_vatican_catacombs: {', i = src.indexOf(anchor), a = src.lastIndexOf('        /*', i); if (i < 0 || a < 0) throw new Error('anchor not found in data.js'); src = src.slice(0, a) + BLOCKS[k] + src.slice(a); } });
fs.writeFileSync(file, src);
console.log('data.js: the four rooms written (' + Object.keys(BLOCKS).map(k => k + ' ' + BLOCKS[k].length).join(', ') + ' bytes)');
