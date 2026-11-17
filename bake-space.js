#!/usr/bin/env node
/* bake-space.js — OUTER SPACE ON PLOTS (2026-11-16, mondo: the eight zones still on old rooms are "completely redesigned/reimagined with plots
   and districts ... let's just get the world built, we can figure that part [where the ship leaves from] out later"; no OK needed first).
   SINCE 2026-11-17 ONE ROOM: THE SOLAR SYSTEM (see THE ONE ROOM below): the four worlds are built as before, then stood as blocks in
   `site_prebuilt_moon_plots`; the Mars / Saturn / Singularity room ids below are retired. Before that, FOUR ROOMS, ONE A WORLD (plot plan 3,
   docs/plans/world-zones/outer-space_plot_plan_3.png), each on plots of 12 x 12 squares of 3.5 m:
     THE MOON         site_prebuilt_moon_plots          5 x 4   districts M The Mare · C The Crater · F The Far Side
     MARS             site_prebuilt_mars_plots          5 x 4   Y Cydonia · V The Canyon · R The Rover Bay
     SATURN           site_prebuilt_saturn_plots        4 x 4   H The Hexagon · G The Ring Shard
     THE SINGULARITY  site_prebuilt_singularity_plots   4 x 4   D The Drop · A The Accretion Rim
   THE SPACESHIP stays handmade (its four rooms are not written here); its one collar still opens on the world the bridge lays in: the three
   collar links' world ends are places in these rooms (data.js DOOR_HQ.links, checked below).
   Reads docs/areas/space/layout.json (written by docs/plans/world-zones/draw-space.js: every plot, the square maps, the heights, the ways)
   and writes the four rooms into data.js between SPACE72-BEGIN / SPACE72-END. `node bake-space.js` writes; `--dry-run` prints the counts;
   `SPACE_DUMP=moon|mars|saturn|singularity` prints that world's walked map. Never hand-edit between the markers.
   Notes: docs/notes/areas-complexes.md "OUTER SPACE ON PLOTS" + "OUTER SPACE, THE ZONE KIT" + "OUTER SPACE, THE SOLAR SYSTEM" (11-17).

   THE DISTRICT FILES: what stands in a district is written in docs/areas/space/districts/<LETTER>.js, one thread a file (the ten letters are
   unique across the four worlds). A file may export `plan`, `build`, `dress`, `people` (each called with that district's ctx) and
   `airZones(ctx)`. This tool keeps what is shared: the plan, the heights, the rock, the paint, the ways out, the sky, the checks.

   THE SQUARE MAP: x = rock (the wall: terrain.gen plan / look rock), everything else is walked. `.` ground · p track · c crater / canyon /
   bowl floor · m a top · r a ramp · t a pyramid tier · l a pad · i ring ice · h the hole's floor · e rim / lip / dunes · B a building.
   THE HEIGHTS ARE THE MAP (the Beach's way): terrain.slope.cells carries four corners a square. A step over 0.62 m between two squares is
   a cliff; a ramp rises 0.3 at most; a `stairs` row of the layout is a `ramp` feature with treads. Squares are (sx west to east, sy north
   to south) in their world; gcx / gcz = a square's middle in metres. */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const REPO = __dirname, DRY = process.argv.includes('--dry-run');
const PLAN = JSON.parse(fs.readFileSync(path.join(REPO, 'docs/areas/space/layout.json'), 'utf8'));
const C = 3.5, N = 12, PART = 'plots';
const r2 = v => Math.round(v * 100) / 100;
const J = v => JSON.stringify(v).replace(/"([a-zA-Z_][a-zA-Z0-9_]*)":/g, '$1:').replace(/'/g, "\\'").replace(/"/g, "'");
const D = require('./load-data.js').loadGameData();
const Q = s => JSON.parse(vm.runInContext('JSON.stringify(' + s + ')', D) || 'null');
const CAT = vm.runInContext('DOOR_HQ.catalogue', D), RACES = vm.runInContext('AVAILABLE_RACES', D);
const mkRnd = s => { let v = s >>> 0; return () => { v = (v * 1664525 + 1013904223) >>> 0; return v / 4294967296; }; };

/* what each world wears: the ground sheets by square char (0 = the room's floor), the rock, the look of its room */
const WEAR = {
    moon: { label: 'THE MOON', sub: 'THE MARE · THE CRATER · THE FAR SIDE · 20 PLOTS', floor: 'moon', cliff: 'moon_3', path: 'moon_2', wallH: 4.2, noise: 0.12,
        pal: { d: 'moon_3', p: 'moon_3', c: 'moon_3', e: 'moon_2', m: 'moon_3', r: 'moon_2', l: 'urban:MetalDiamondPlate1a', B: 'urban:MetalDiamondPlate1a' },   // pilot pass 1: the tracks are the darker sheet (obsidian on the crater floors was tried: black squares with stepped edges; out)
        parti: 'A sea of dust with one lander on it, one big crater north of that with the ship\'s collar on a terrace over it, and a ridge to the west with two passes through to the side nobody is shown.' },
    mars: { label: 'MARS', sub: 'CYDONIA · THE CANYON · THE ROVER BAY · 20 PLOTS', floor: 'mars', cliff: 'mars_2', path: 'moon_2', wallH: 5, noise: 0.14,
        pal: { d: 'mars_2', w: 'ice', p: 'moon_2', c: 'mars_2', e: 'desert', m: 'mars_2', r: 'moon_2', t: 'mars_2', l: 'urban:MetalDiamondPlate1a', B: 'urban:MetalDiamondPlate1a' },
        parti: 'The Face and the Pyramid stand on the north plain, a canyon cuts the map in two under an arch between two mesas, and the rover\'s tracks end at a bay on the south plain.' },
    saturn: { label: 'SATURN', sub: 'THE HEXAGON · THE RING SHARD · 16 PLOTS', floor: 'desert', cliff: 'storm', path: 'moon_3', wallH: 7, noise: 0.1,   // (2026-11-17: the deck was mars_2, a brown ball; now sand gold with pale cloud belts, `b`)
        pal: { b: 'cloud_thick', d: 'mars_2', k: 'storm', p: 'moon_3', c: 'storm', h: 'void', m: 'cloud_thick', r: 'moon_3', i: 'ice' },
        parti: 'A six-sided plateau inside six walls of storm: a rim walk round it, the storm\'s eye sunk in its middle, a splinter of ring ice across the east rim.' },
    singularity: { label: 'THE SINGULARITY', sub: 'THE DROP · THE ACCRETION RIM · 16 PLOTS', floor: 'moon_3', cliff: 'obsidian', path: 'crystal', wallH: 6, noise: 0.1,
        pal: { p: 'crystal', c: 'obsidian', h: 'void', e: 'lava', r: 'obsidian', m: 'crystal' },
        parti: 'A bowl that falls in three shelves to a point in its middle; the bright rim round it, one straight way down, and a screen on a ledge that watches.' },
};

/* ── the buildings and drawn pieces (the Estate's helper: a hollow `texbuilding` you walk into + its look as an `arch` parts list) ── */
const U = n => 'urban:' + n, HULL = U('MetalWallRibbed1a'), PLATE = U('MetalDiamondPlate1a'), PANEL = U('MetalCorrugatedPainted1a'), GRILL = U('MetalSubwayGrill1a'), TRUSS = U('MetalTruss1a'), GLS = U('GlassWindowTall1a'), STRIPE = U('MetalWarningStripe1');
const ROT = { S: 0, W: 90, N: 180, E: 270 };
function sheet() {
    const P = [];
    const add = (o, key, tint, x) => { if (key) o.key = key; if (tint != null) o.tint = tint; if (x) Object.assign(o, x); if (/GlassWindow/.test(key || '') && o.glow == null) o.glow = 0.3; P.push(o); return o; };
    const A = { P,
        box: (x, y, z, w, h, d, key, tint, o) => add({ s: 'box', p: [r2(x), r2(y), r2(z)], size: [r2(w), r2(h), r2(d)] }, key, tint, o),
        cyl: (x, y, z, r, h, key, tint, o) => add({ s: 'cyl', p: [r2(x), r2(y), r2(z)], r, h }, key, tint, o),
        quad: (x, y, z, w, h, key, tint, o) => add({ s: 'quad', p: [r2(x), r2(y), r2(z)], size: [r2(w), r2(h)] }, key, tint, o),
        roof: (form, x, y, z, w, h, d, key, tint, o) => { add({ s: 'box', p: [x, y, z], size: [w, 0.02, d], sides: false, top: false, under: true, roof: true, ry: (o && o.ry) || 0 }, HULL, 0x3a3e46);
            return add({ s: 'roof', form, p: [x, y, z], size: [w, h, d], roof: true }, key, tint, o); },
        shell(w, h, d, key, tint, door, uv, ex) { const e = 0.05, Wd = w + 2 * e, Dp = d + 2 * e, x = Object.assign(uv ? { uv } : {}, ex || {});
            add({ s: 'box', p: [0, 0, 0], size: [Wd, h, Dp], top: false, faces: 'blr' }, key, tint, x);
            add({ s: 'quad', p: [0, 0, r2(Dp / 2)], size: [Wd, h], ry: 0, hole: [r2(door.lx), r2(door.cw), 2.2] }, key, tint, x); },
        frame(door, d, key, tint) { A.box(door.lx - door.cw / 2 - 0.1, 0, d / 2 + 0.1, 0.2, 2.4, 0.2, key, tint); A.box(door.lx + door.cw / 2 + 0.1, 0, d / 2 + 0.1, 0.2, 2.4, 0.2, key, tint); A.box(door.lx, 2.25, d / 2 + 0.1, door.cw + 0.5, 0.2, 0.2, key, tint); },
        sign(words, x, y, z, w, h, fg, bg, font, o) { P.push(Object.assign({ s: 'quad', p: [r2(x), r2(y), r2(z)], size: [w, h], key: 'txt:' + words + '|' + fg + '|' + bg + '|' + r2(w / h) + '||' + font, uv: 'fit', kind: 'wall' }, o || {})); } };
    return A;
}
function texbDoor(w, door) { const L = Math.max(2, w) - 0.12, cols = Math.max(1, Math.round(L / 1.75)), cw = L / cols; let col = Math.floor((cols - 1) / 2); if (door >= 1) col = Math.min(cols - 1, Math.round(door) - 1); return { lx: -L / 2 + (col + 0.5) * cw, cw }; }

const DIR = path.join(REPO, 'docs/areas/space/districts');
const DISTRICTS = (() => { const o = {}; if (fs.existsSync(DIR)) fs.readdirSync(DIR).filter(f => /^[A-Z]\.js$/.test(f)).sort().forEach(f => { o[f[0]] = require(path.join(DIR, f)); }); return o; })();
const STAGES = ['plan', 'build', 'dress', 'people'];
const WANT = [], BLOCK = [], TOTAL = {}, DECALROWS = [];

function bakeWorld(R) {
    const WR = WEAR[R.id], GX = R.cols, GY = R.rows, W = N * GX, Hh = N * GY, HX = W * C / 2, HZ = Hh * C / 2;
    const gx = c => r2(-HX + c * C), gz = c => r2(-HZ + c * C), gcx = c => r2(-HX + (c + 0.5) * C), gcz = c => r2(-HZ + (c + 0.5) * C);
    const cell = R.cells.map(r => r.split(''));
    if (cell.length !== Hh || cell.some(r => r.length !== W)) throw new Error(R.id + ': cells: want ' + Hh + ' rows of ' + W);
    const sb = Buffer.from(R.slope, 'base64'), H4 = []; for (let i = 0; i < W * Hh; i++) H4.push([0, 1, 2, 3].map(k => sb.readInt16LE(i * 8 + k * 2) / 100));
    const h4 = (x, y) => H4[y * W + x], hC = (x, y) => { const q = h4(x, y); return (q[0] + q[1] + q[2] + q[3]) / 4; };
    const plot = {}; R.plots.forEach(p => { p.x = +p.id.slice(1, 3); p.y = +p.id.slice(4, 6); p.sx = p.x * N; p.sy = p.y * N; if (!R.districts[p.d]) throw new Error('district? ' + p.id); plot[p.id] = p; });
    const plotAt = (sx, sy) => plot['P' + String(Math.max(0, Math.min(GX - 1, Math.floor(sx / N)))).padStart(2, '0') + '-' + String(Math.max(0, Math.min(GY - 1, Math.floor(sy / N)))).padStart(2, '0')], distAt = (sx, sy) => plotAt(sx, sy).d;
    const open = (x, y) => x >= 0 && y >= 0 && x < W && y < Hh && cell[y][x] !== 'x';
    const F = [], ARCH = [], props = [], doors = [], npc = [], count = {}, taken = new Set(), errs = [], strays = [], flats = [], BUILT = {}, MARKS = [], DECALS = [];
    const feat = o => { F.push(o); return o; };
    const OLD = Q('(r => r ? { n: r.npcSpots || [], l: r.lines || [], d: r.doors || [], shell: r.shell } : null)(DOOR_HQ.rooms.' + R.old + ')');
    if (!OLD) throw new Error('the old room ' + R.old + ' is gone from data.js (its shell, people and lines are read from it)');
    const sayOf = (race, i) => (OLD.n.filter(n => n.race === race)[i || 0] || {}).say;
    let curD = null;
    function spot(sx, sy, what, shared) { if (sx < 0 || sy < 0 || sx >= W || sy >= Hh) { errs.push(R.id + ': ' + what + ' off the map at ' + sx + ',' + sy); return; }
        if (curD && distAt(sx, sy) !== curD) strays.push(curD + ': ' + what + ' at ' + sx + ',' + sy + ' (' + distAt(sx, sy) + ')');
        if (cell[sy][sx] === 'x') { errs.push(R.id + ': ' + what + ' stands in the rock at ' + sx + ',' + sy); return; }
        if (!shared) { if (taken.has(sx + ':' + sy)) errs.push(R.id + ': ' + what + ': square ' + sx + ',' + sy + ' is taken'); taken.add(sx + ':' + sy); } }
    const MID = q => Object.defineProperty(q, '_mid', { value: true });   // stood on a square's middle (a round world's carry snaps it to the ball's square)
    const P = (key, sx, sy, o) => { spot(sx, sy, key); props.push(MID(Object.assign({ key, x: gcx(sx), z: gcz(sy) }, o || {}))); };
    const decWith = rnd => (key, sx, sy, o) => { spot(sx, sy, key, true); props.push(Object.assign({ key, x: r2(gcx(sx) + (rnd() - 0.5) * 1.6), z: r2(gcz(sy) + (rnd() - 0.5) * 1.6), face: Math.round(rnd() * 360) }, o || {})); };
    const native = (race, sx, sy, face, say) => { spot(sx, sy, race); const n = { x: gcx(sx), z: gcz(sy), face: face || 0, race }; if (say) n.say = say; npc.push(MID(n)); };
    /* a building on squares x0..x1 x y0..y1 (the end exclusive), its front on `side`; the ground under it is levelled */
    function building(id, q, h, o, parts) {
        const [sx0, sy0, sx1, sy1, side] = q, ew = side === 'E' || side === 'W', fw = (ew ? sy1 - sy0 : sx1 - sx0) * C, fd = (ew ? sx1 - sx0 : sy1 - sy0) * C, cx = gx((sx0 + sx1) / 2), cz = gz((sy0 + sy1) / 2), rot = ROT[side];
        const row = Object.assign({ k: 'texbuilding', id: 'spc:' + R.id + ':' + id, seed: 1, x: cx, z: cz, w: fw, d: fd, rot, storeys: Math.max(1, Math.floor(h / 3.5 + 0.01)), h, skin: false, hollow: true, leaf: 'leaf_bulkhead', leafDouble: false, keyIn: HULL, floorIn: PLATE }, o || {});
        Object.keys(row).forEach(k => { if (row[k] === undefined) delete row[k]; });
        feat(row); flats.push([sx0, sy0, sx1, sy1]);
        for (let y = sy0; y < sy1; y++) for (let x = sx0; x < sx1; x++) { if (curD && distAt(x, y) !== curD) strays.push(curD + ': building ' + id + ' at ' + x + ',' + y); if (cell[y][x] === 'x') errs.push(R.id + ': building ' + id + ' stands in the rock at ' + x + ',' + y); cell[y][x] = 'B'; taken.add(x + ':' + y); }
        const a = sheet(), door = texbDoor(fw, row.door); parts(a, fw, fd, door);
        ARCH.push({ k: 'arch', id: 'spc:' + R.id + ':' + id + ':look', x: cx, z: cz, rot, parts: a.P });
        const t = rot * Math.PI / 180, c = Math.cos(t), s = Math.sin(t); count.buildings = (count.buildings || 0) + 1;
        return (BUILT[id] = { at: (lx, lz) => [r2(cx + lx * c - lz * s), r2(cz + lx * s + lz * c)], face: f => (f + rot) % 360, fw, fd, door, cx, cz, rot });
    }
    const put = (B, key, lx, lz, o) => { const p = B.at(lx, lz), r = Object.assign({ key, x: p[0], z: p[1] }, o || {}); if (r.face != null) r.face = B.face(r.face); props.push(r); };
    /* a drawn piece on open ground (an `arch` row): parts in its own frame, y up from the ground at its middle */
    const look = (id, sx, sy, rot, fn, o) => { const a = sheet(); fn(a); ARCH.push(Object.assign({ k: 'arch', id: 'spc:' + R.id + ':' + id + ':look', x: r2(-HX + sx * C), z: r2(-HZ + sy * C), rot: rot || 0, parts: a.P }, o || {})); };

    const CTX = {};
    Object.keys(R.districts).forEach(k => { if (!DISTRICTS[k]) throw new Error('district file missing: docs/areas/space/districts/' + k + '.js'); const rnd = mkRnd(7919 * k.charCodeAt(0));
        const sq = (id, lx, ly) => { const p = plot[id]; if (!p) throw new Error(R.id + ': plot? ' + id); return [p.sx + lx, p.sy + ly]; };
        CTX[k] = { d: k, world: R.id, C, N, W, H: Hh, gx, gz, gcx, gcz, r2, R, plot, plots: R.plots.filter(p => p.d === k), cell, open, distAt, feat, props, npc, taken, rnd, sq, OLD, sayOf, BUILT,
            U, HULL, PLATE, PANEL, GRILL, TRUSS, GLS, STRIPE, sheet, building, put, look,
            /* a blocker on a square's middle · decor off it (several may share a square) · a unit. Squares are the WORLD's (sx, sy); ctx.sq(plotId, lx, ly) gives them from a plot's own 0..11 */
            P, dec: decWith(rnd), native, on: (key, sx, sy, o) => { spot(sx, sy, key, true); props.push(MID(Object.assign({ key, x: gcx(sx), z: gcz(sy) }, o || {}))); },   // `on` = exactly on a square's middle, sharing it (a terminal on a table)
            hAt: (sx, sy) => r2(hC(sx, sy)), ways: R.ways,
            /* a line painted on the ground (terrain.marks: tyre tracks, footprints, a pad's edge), in square units (2.5 = the middle of square 2), w in metres */
            line: (x0, y0, x1, y1, w, color) => MARKS.push({ k: 'line', x0: r2(-HX + x0 * C), z0: r2(-HZ + y0 * C), x1: r2(-HX + x1 * C), z1: r2(-HZ + y1 * C), w, color }),
            /* a floor decal: kind 'scorch' | 'oil' | 'grime' | 'puddle' | 'blood' (three-renderer.js _hqDecalTex), on a square, r metres */
            grime: (kind, sx, sy, r) => DECALS.push({ kind, x: gcx(sx), z: gcz(sy), y: r2(hC(sx, sy)), r: r || 1.4, rot: Math.round(rnd() * 360) }),
            free: (sx, sy) => open(sx, sy) && !taken.has(sx + ':' + sy),
            /* every square of a plot whose char is in `chars` (default: plain ground), in reading order, world squares */
            squares: (id, chars) => { const p = plot[id], out = []; for (let ly = 0; ly < N; ly++) for (let lx = 0; lx < N; lx++) if ((chars || '.').includes(cell[p.sy + ly][p.sx + lx])) out.push([p.sx + lx, p.sy + ly]); return out; },
            /* level a rectangle of squares (the end exclusive) to one height (default: its middle's) and give it a char */
            flatten: (sx0, sy0, sx1, sy1, h, ch) => { const ref = h != null ? h : hC(Math.floor((sx0 + sx1) / 2), Math.floor((sy0 + sy1) / 2)); for (let y = sy0; y < sy1; y++) for (let x = sx0; x < sx1; x++) { H4[y * W + x] = [ref, ref, ref, ref]; if (ch) cell[y][x] = ch; } return r2(ref); } }; });
    const run = stage => Object.keys(R.districts).forEach(k => { const m = DISTRICTS[k]; if (m && typeof m[stage] === 'function') { curD = k; try { m[stage](CTX[k]); } finally { curD = null; } } });

    /* ── THE WAYS (all in the game before the rebuild; none is new): the bay door, the ship's collar, the links. Each is a free-standing door
       on its square; the square in front of it is kept clear. ── */
    const WAY = {}; Object.keys(R.ways).forEach(k => { const w = R.ways[k]; if (!open(w.sx, w.sy)) throw new Error(R.id + ': the way ' + k + ' stands in the rock'); const f = w.face * Math.PI / 180, fx = w.sx + Math.round(Math.sin(f)), fy = w.sy - Math.round(Math.cos(f));
        if (!open(fx, fy)) throw new Error(R.id + ': the way ' + k + ' faces the rock'); taken.add(w.sx + ':' + w.sy); taken.add(fx + ':' + fy); WAY[k] = { x: gcx(w.sx), z: gcz(w.sy), face: w.face, sx: w.sx, sy: w.sy, fx, fy }; });
    taken.add(R.spawn[0] + ':' + R.spawn[1]); taken.add(R.marker[0] + ':' + R.marker[1]);

    run('plan'); run('build');
    /* the ground under every building is level */
    flats.forEach(([x0, y0, x1, y1]) => { const ref = hC(Math.floor((x0 + x1) / 2), Math.floor((y0 + y1) / 2)); for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) H4[y * W + x] = [ref, ref, ref, ref]; });
    run('dress'); run('people');
    if (strays.length) console.log(R.id + ': pieces a district stood on another district\'s squares (ask that district\'s thread):\n  ' + strays.join('\n  '));
    if (errs.length) throw new Error('misplaced:\n  ' + errs.join('\n  '));

    /* ── the stairs and bridges of the layout ── */
    const STAIR = (R.stairs || []).map(s => { const ns = s.up === 'n' || s.up === 's', xm = r2(-HX + (s.sx0 + s.sx1 + 1) / 2 * C), zm = r2(-HZ + (s.sy0 + s.sy1 + 1) / 2 * C);
        const foot = s.up === 'n' ? gz(s.sy1 + 1) : s.up === 's' ? gz(s.sy0) : s.up === 'w' ? gx(s.sx1 + 1) : gx(s.sx0), head = s.up === 'n' ? gz(s.sy0) : s.up === 's' ? gz(s.sy1 + 1) : s.up === 'w' ? gx(s.sx0) : gx(s.sx1 + 1);
        return ns ? { k: 'ramp', x0: xm, z0: foot, x1: xm, z1: head, w: (s.sx1 - s.sx0 + 1) * C, h0: s.h0, h1: s.h1, stairs: true } : { k: 'ramp', x0: foot, z0: zm, x1: head, z1: zm, w: (s.sy1 - s.sy0 + 1) * C, h0: s.h0, h1: s.h1, stairs: true }; });
    const BRIDGE = (R.bridges || []).map(b => ({ k: 'bridge', x0: gcx(b.sx0), z0: b.sy0 === b.sy1 ? gcz(b.sy0) : gz(b.sy0), x1: gcx(b.sx1), z1: b.sy0 === b.sy1 ? gcz(b.sy1) : gz(b.sy1 + 1), w: C, y: b.y }));
    const onStair = (x, y) => (R.stairs || []).some(s => x >= s.sx0 && x <= s.sx1 && y >= s.sy0 && y <= s.sy1);

    /* ── THE OPEN GROUND: every square that is not rock, as `space` rows (greedy rectangles) ── */
    const spaces = [];
    { const used = new Uint8Array(W * Hh);
      for (let cy = 0; cy < Hh; cy++) for (let cx = 0; cx < W; cx++) { if (!open(cx, cy) || used[cy * W + cx]) continue;
          let w = 1; while (cx + w < W && !used[cy * W + cx + w] && open(cx + w, cy)) w++;
          let h = 1; rows: while (cy + h < Hh) { for (let i = 0; i < w; i++) if (used[(cy + h) * W + cx + i] || !open(cx + i, cy + h)) break rows; h++; }
          for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) used[(cy + j) * W + cx + i] = 1;
          spaces.push({ k: 'space', x: r2(gx(cx) + w * C / 2), z: r2(gz(cy) + h * C / 2), w: w * C, d: h * C }); } }
    /* ── THE PAINT + THE SLOPE ── */
    const PAL = [], palOf = key => { let i = PAL.indexOf(key); if (i < 0) { PAL.push(key); i = PAL.length - 1; } return i + 1; }, paint = new Uint8Array(W * Hh);
    for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) { const key = WR.pal[cell[y][x]]; paint[y * W + x] = key ? palOf(key) : 0; }
    const slope = Buffer.alloc(W * Hh * 8); H4.forEach((q, i) => q.forEach((h, k) => slope.writeInt16LE(Math.round(h * 100), i * 8 + k * 2)));

    /* ── checks: every prop key and unit exists; every plot, way and unit is walked to from the spawn. A move between two squares is made
       when their shared edge differs by 0.62 m at most (and neither tilts more than a ramp), or along a stair. ── */
    props.forEach(p => { if (!CAT[p.key]) throw new Error('not in the catalogue: ' + p.key); const sx = Math.floor((p.x + HX) / C), sy = Math.floor((p.z + HZ) / C); if (!open(sx, sy)) throw new Error(R.id + ': ' + p.key + ' stands in the rock at ' + sx + ',' + sy); });
    npc.forEach(n => { if (RACES.indexOf(n.race) < 0) throw new Error('not a unit: ' + n.race); });
    const SP = R.spawn, walk = (x, y) => open(x, y) && cell[y][x] !== 'B', seen = new Uint8Array(W * Hh);
    { const edge = (x, y, dx, dy) => { const q = h4(x, y); return dx === 1 ? (q[1] + q[3]) / 2 : dx === -1 ? (q[0] + q[2]) / 2 : dy === 1 ? (q[2] + q[3]) / 2 : (q[0] + q[1]) / 2; }, tilt = (x, y) => { const q = h4(x, y); return (Math.max.apply(null, q) - Math.min.apply(null, q)) / C; };
      if (!walk(SP[0], SP[1])) throw new Error(R.id + ': the spawn is not open'); const st = [SP]; seen[SP[1] * W + SP[0]] = 1; let steep = 0;
      while (st.length) { const [x, y] = st.pop(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + dx, Y = y + dy; if (!walk(X, Y) || seen[Y * W + X]) continue;
          const stair = onStair(x, y) || onStair(X, Y);
          if (!stair && (Math.abs(edge(x, y, dx, dy) - edge(X, Y, -dx, -dy)) > 0.62 || tilt(X, Y) > 0.5)) { steep++; continue; } seen[Y * W + X] = 1; st.push([X, Y]); } }
      const cold = R.plots.filter(p => { for (let ly = 0; ly < N; ly++) for (let lx = 0; lx < N; lx++) if (seen[(p.sy + ly) * W + p.sx + lx]) return false; return true; }).map(p => p.id);
      if (process.env.SPACE_DUMP === R.id) console.log(cell.map((r, y) => r.map((ch, x) => walk(x, y) && !seen[y * W + x] ? '!' : ch === 'x' ? ' ' : ch).join('')).join('\n'));
      if (cold.length) throw new Error(R.id + ': plots not reached on foot: ' + cold.join(' '));
      Object.keys(WAY).forEach(k => { if (!seen[WAY[k].fy * W + WAY[k].fx]) throw new Error(R.id + ': the way ' + k + ' is not reached on foot'); });
      npc.forEach(n => { const sx = Math.floor((n.x + HX) / C), sy = Math.floor((n.z + HZ) / C); if (!seen[sy * W + sx]) throw new Error(R.id + ': ' + n.race + ' at ' + sx + ',' + sy + ' is not reached on foot'); });
      let op = 0, un = 0; for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) if (walk(x, y)) { op++; if (!seen[y * W + x]) un++; }
      Object.assign(count, { plots: R.plots.length, openSquares: op, unreachedSquares: un, cliffEdges: steep }); }
    const features = spaces.concat(STAIR, BRIDGE, F, ARCH);
    Object.assign(count, { spaces: spaces.length, features: features.length, props: props.length, natives: npc.length });
    TOTAL[R.id] = count;

    /* THE AIR BY DISTRICT (the Estate's way): a district file's `airZones(ctx)` = [{ sx0, sy0, sx1, sy1 (world squares, the end exclusive), kind, color, n, speed, wind }] */
    const AIR = [].concat(...Object.keys(R.districts).filter(k => typeof DISTRICTS[k].airZones === 'function').map(k => (DISTRICTS[k].airZones(CTX[k]) || []).map(z => { const q = Object.assign({}, z, { x0: gx(z.sx0), z0: gz(z.sy0), x1: gx(z.sx1), z1: gz(z.sy1) }); delete q.sx0; delete q.sy0; delete q.sx1; delete q.sy1; return q; })));

    /* THE ONE ROOM (2026-11-17): the world is handed to compose() in its own frame; compose() stands it in the solar system */
    return { R, WR, W, Hh, HX, HZ, gcx, gcz, cell, H4, hC, props, npc, features: STAIR.concat(BRIDGE, F, ARCH), F, ARCH, flats, MARKS, DECALS, AIR, WAY, OLD, SP };
}

/* ══ THE ROUND WORLDS, CARRIED (2026-11-17, mondo: "go ahead and do the other ones"): Mars, Saturn and the Singularity are built on their
   flat maps as before (the layout's `flat`: the districts keep their own squares), then the whole world is carried onto its ball's net
   (the layout's `cells` / `slope`, docs/plans/world-zones/space-ball.js): the ground is read again from the map AFTER the districts
   built on it (the levelled ground under a building goes with it), every piece lands where its spot lands on the ball and turns with the
   ground there. Pieces stood on a square's middle (blockers, units) land on the middle of the ball's square under them (the next free one
   when that is taken); decor lands where it falls. A building keeps its squares: its middle is carried, its turn is snapped to a quarter
   turn, and everything inside it goes with it. The doors are the layout's (draw-space.js carried them the same way). ══ */
const BALL = require('./docs/plans/world-zones/space-ball.js');
function toBall(P0, R) {
    const o = BALL.ROUNDS[R.id], K = BALL.rmKit(o.fq, o.center, P0.W, P0.Hh);
    if (K.W !== R.cols * N || K.H !== R.rows * N) throw new Error(R.id + ': the net is ' + K.W + ' x ' + K.H + ', the layout ' + R.cols * N + ' x ' + R.rows * N);
    const W = K.W, Hh = K.H, HX = W * C / 2, HZ = Hh * C / 2, WR = P0.WR;
    const gx = c => r2(-HX + c * C), gz = c => r2(-HZ + c * C), gcx = c => r2(-HX + (c + 0.5) * C), gcz = c => r2(-HZ + (c + 0.5) * C);
    const g = BALL.sampleNet(o, K, { W: P0.W, H: P0.Hh, cell: (x, y) => P0.cell[y][x], h4: (x, y) => P0.H4[y * P0.W + x] }, ch => ch === 'B' ? '.' : ch);
    /* the layout's ground (draw-space.js read the map before the districts built) gives the rock + the ways' cleared fronts; ours gives the rest */
    const cell = g.cell.map((r, y) => r.map((ch, x) => R.cells[y][x] === 'x' ? 'x' : ch === 'x' ? R.cells[y][x] : ch));
    const H4 = []; g.H4.forEach(r => r.forEach(q => H4.push(q)));
    const h4 = (x, y) => H4[y * W + x], hC = (x, y) => { const q = h4(x, y); return (q[0] + q[1] + q[2] + q[3]) / 4; };
    const open = (x, y) => x >= 0 && y >= 0 && x < W && y < Hh && cell[y][x] !== 'x';
    const taken = new Set(), errs = [];
    const at = (x, z) => { const q = K.pt((x + P0.HX) / C, (z + P0.HZ) / C); return { x: r2(-HX + q.X * C), z: r2(-HZ + q.Y * C), X: q.X, Y: q.Y, turn: q.turn }; };
    const turnF = (f, t) => Math.round((((f || 0) + t) % 360 + 360) % 360);
    /* the ways (the layout's), the spawn and the marker: kept clear */
    const WAY = {}; Object.keys(R.ways).forEach(k => { const w = R.ways[k], f = w.face * Math.PI / 180, fx = w.sx + Math.round(Math.sin(f)), fy = w.sy - Math.round(Math.cos(f));
        if (!open(w.sx, w.sy) || !open(fx, fy)) throw new Error(R.id + ': the way ' + k + ' on the ball stands in or faces the rock');
        taken.add(w.sx + ':' + w.sy); taken.add(fx + ':' + fy); WAY[k] = { x: gcx(w.sx), z: gcz(w.sy), face: w.face, sx: w.sx, sy: w.sy, fx, fy }; });
    taken.add(R.spawn[0] + ':' + R.spawn[1]); taken.add(R.marker[0] + ':' + R.marker[1]);
    /* the buildings: their squares, re-laid square to the ball's grid */
    const P0HX = P0.HX, P0HZ = P0.HZ, BLD = [];
    P0.flats.forEach(([x0, y0, x1, y1]) => {
        const ocx = -P0HX + (x0 + x1) / 2 * C, ocz = -P0HZ + (y0 + y1) / 2 * C, q = K.pt((x0 + x1) / 2, (y0 + y1) / 2), qt = ((Math.round(q.turn / 90) % 4) + 4) % 4;
        let w = x1 - x0, h = y1 - y0; if (qt % 2) { const t = w; w = h; h = t; }
        const X0 = Math.round(q.X - w / 2), Y0 = Math.round(q.Y - h / 2), X1 = X0 + w, Y1 = Y0 + h;
        const ref = hC(Math.floor((X0 + X1) / 2), Math.floor((Y0 + Y1) / 2));
        for (let y = Y0; y < Y1; y++) for (let x = X0; x < X1; x++) { if (!open(x, y)) errs.push(R.id + ': a building lands on the rock at ' + x + ',' + y); else cell[y][x] = 'B'; H4[y * W + x] = [ref, ref, ref, ref]; taken.add(x + ':' + y); }
        BLD.push({ ox0: -P0HX + x0 * C, ox1: -P0HX + x1 * C, oz0: -P0HZ + y0 * C, oz1: -P0HZ + y1 * C, ocx, ocz, ncx: r2(-HX + (X0 + X1) / 2 * C), ncz: r2(-HZ + (Y0 + Y1) / 2 * C), d: qt * 90 }); });
    const inB = (x, z) => BLD.find(b => x > b.ox0 - 0.01 && x < b.ox1 + 0.01 && z > b.oz0 - 0.01 && z < b.oz1 + 0.01);
    const inside = (b, x, z) => { const t = b.d * Math.PI / 180, c = Math.cos(t), s = Math.sin(t), dx = x - b.ocx, dz = z - b.ocz; return [r2(b.ncx + dx * c - dz * s), r2(b.ncz + dx * s + dz * c)]; };
    /* the next free open square to (X, Y) on the ball */
    const near = (X, Y, shared) => { for (let r = 0; r <= 4; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        const x = X + dx, y = Y + dy; if (open(x, y) && cell[y][x] !== 'B' && (shared || !taken.has(x + ':' + y))) return [x, y]; } return null; };
    const carry = (q0, isUnit) => { const q = Object.assign({}, q0), b = inB(q.x, q.z);
        if (b) { const p = inside(b, q.x, q.z); q.x = p[0]; q.z = p[1]; if (q.face != null || isUnit) q.face = turnF(q.face, b.d); return q; }
        const m = at(q.x, q.z);
        if (q0._mid) { const s = near(Math.floor(m.X), Math.floor(m.Y), !isUnit && q0.key && false); if (!s) { errs.push(R.id + ': no square on the ball for ' + (q.key || q.race)); return q; }
            taken.add(s[0] + ':' + s[1]); q.x = gcx(s[0]); q.z = gcz(s[1]); }
        else { let X = Math.floor(m.X), Y = Math.floor(m.Y); if (!open(X, Y) || cell[Y][X] === 'B') { const s = near(X, Y, true); if (s) { q.x = gcx(s[0]); q.z = gcz(s[1]); } } else { q.x = m.x; q.z = m.z; } }
        if (q.face != null || isUnit) q.face = turnF(q.face, m.turn); return q; };
    const props = P0.props.map(q => carry(q, false)), npc = P0.npc.map(q => carry(q, true));
    /* the buildings' rows + their looks; the free looks (a flag, the solar rows) carried and turned with the ground */
    const ROWS = P0.F.concat(P0.ARCH).map(f0 => { const f = Object.assign({}, f0);
        if (f.k === 'texbuilding' || (f.k === 'arch' && P0.F.some(b => b.k === 'texbuilding' && f.id === b.id + ':look'))) { const b = inB(f.x, f.z); if (!b) throw new Error(R.id + ': building row ' + f.id + ' is on no building');
            f.x = b.ncx; f.z = b.ncz; f.rot = turnF(f.rot, b.d); return f; }
        if (f.x == null || f.z == null) throw new Error(R.id + ': a row the carry does not know: ' + JSON.stringify(f).slice(0, 80));
        const m = at(f.x, f.z); f.x = m.x; f.z = m.z; if (f.rot != null || f.k === 'arch') f.rot = turnF(f.rot, m.turn); return f; });
    const MARKS = P0.MARKS.map(l => { const a = at(l.x0, l.z0), b = at(l.x1, l.z1); return Object.assign({}, l, { x0: a.x, z0: a.z, x1: b.x, z1: b.z }); }).filter(l => Math.hypot(l.x1 - l.x0, l.z1 - l.z0) < 40);
    const DECALS = P0.DECALS.map(d => { const m = at(d.x, d.z), X = Math.max(0, Math.min(W - 1, Math.floor(m.X))), Y = Math.max(0, Math.min(Hh - 1, Math.floor(m.Y))); return Object.assign({}, d, { x: m.x, z: m.z, y: r2(hC(X, Y)), rot: turnF(d.rot, m.turn) }); });
    const AIR = P0.AIR.map(z => { const cs = [at(z.x0, z.z0), at(z.x1, z.z0), at(z.x0, z.z1), at(z.x1, z.z1)]; return Object.assign({}, z, { x0: Math.min(...cs.map(c => c.x)), x1: Math.max(...cs.map(c => c.x)), z0: Math.min(...cs.map(c => c.z)), z1: Math.max(...cs.map(c => c.z)) }); });
    if (errs.length) throw new Error('the carry onto the ball:\n  ' + errs.join('\n  '));
    /* the stairs and bridges (the layout's, already on the ball) */
    const STAIR = (R.stairs || []).map(s => { const ns = s.up === 'n' || s.up === 's', xm = r2(-HX + (s.sx0 + s.sx1 + 1) / 2 * C), zm = r2(-HZ + (s.sy0 + s.sy1 + 1) / 2 * C);
        const foot = s.up === 'n' ? gz(s.sy1 + 1) : s.up === 's' ? gz(s.sy0) : s.up === 'w' ? gx(s.sx1 + 1) : gx(s.sx0), head = s.up === 'n' ? gz(s.sy0) : s.up === 's' ? gz(s.sy1 + 1) : s.up === 'w' ? gx(s.sx0) : gx(s.sx1 + 1);
        return ns ? { k: 'ramp', x0: xm, z0: foot, x1: xm, z1: head, w: (s.sx1 - s.sx0 + 1) * C, h0: s.h0, h1: s.h1, stairs: true } : { k: 'ramp', x0: foot, z0: zm, x1: head, z1: zm, w: (s.sy1 - s.sy0 + 1) * C, h0: s.h0, h1: s.h1, stairs: true }; });
    const BRIDGE = (R.bridges || []).map(b => ({ k: 'bridge', x0: gcx(b.sx0), z0: b.sy0 === b.sy1 ? gcz(b.sy0) : gz(b.sy0), x1: gcx(b.sx1), z1: b.sy0 === b.sy1 ? gcz(b.sy1) : gz(b.sy1 + 1), w: C, y: b.y }));
    const onStair = (x, y) => (R.stairs || []).some(s => x >= s.sx0 && x <= s.sx1 && y >= s.sy0 && y <= s.sy1);
    /* the walk from the spawn: every plot, way and unit reached; a plot of the ball no foot reaches is left out (said here) */
    const walk = (x, y) => open(x, y) && cell[y][x] !== 'B', seen = new Uint8Array(W * Hh), SP = R.spawn;
    const edge = (x, y, dx, dy) => { const q = h4(x, y); return dx === 1 ? (q[1] + q[3]) / 2 : dx === -1 ? (q[0] + q[2]) / 2 : dy === 1 ? (q[2] + q[3]) / 2 : (q[0] + q[1]) / 2; }, tilt = (x, y) => { const q = h4(x, y); return (Math.max.apply(null, q) - Math.min.apply(null, q)) / C; };
    if (!walk(SP[0], SP[1])) throw new Error(R.id + ': the spawn on the ball is not open');
    { const st = [SP]; seen[SP[1] * W + SP[0]] = 1;
      while (st.length) { const [x, y] = st.pop(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + dx, Y = y + dy; if (!walk(X, Y) || seen[Y * W + X]) continue;
          if (!(onStair(x, y) || onStair(X, Y)) && (Math.abs(edge(x, y, dx, dy) - edge(X, Y, -dx, -dy)) > 0.62 || tilt(X, Y) > 0.5)) continue; seen[Y * W + X] = 1; st.push([X, Y]); } } }
    const plots = R.plots.filter(p => { p.x = +p.id.slice(1, 3); p.y = +p.id.slice(4, 6); p.sx = p.x * N; p.sy = p.y * N; for (let ly = 0; ly < N; ly++) for (let lx = 0; lx < N; lx++) if (seen[(p.sy + ly) * W + p.sx + lx]) return true; return false; });
    if (plots.length < R.plots.length) console.log(R.id + ': plots of the ball no foot reaches, left out: ' + R.plots.filter(p => plots.indexOf(p) < 0).map(p => p.id + ' (' + p.name + ')').join(', '));
    Object.keys(WAY).forEach(k => { if (!seen[WAY[k].fy * W + WAY[k].fx]) throw new Error(R.id + ': the way ' + k + ' is not reached on foot on the ball'); });
    npc.forEach(n => { const sx = Math.floor((n.x + HX) / C), sy = Math.floor((n.z + HZ) / C); if (!seen[sy * W + sx]) console.log(R.id + ': ' + n.race + ' at ' + sx + ',' + sy + ' on the ball is not reached on foot'); });
    if (process.env.SPACE_DUMP === R.id) console.log(cell.map((r, y) => r.map((ch, x) => walk(x, y) && !seen[y * W + x] ? '!' : ch === 'x' ? ' ' : ch).join('')).join('\n'));
    const R2 = Object.assign({}, R, { plots });
    TOTAL[R.id] = Object.assign({}, TOTAL[R.id], { ballPlots: plots.length, ballProps: props.length, ballNatives: npc.length });
    return { R: R2, WR, W, Hh, HX, HZ, gcx, gcz, cell, H4, hC, props, npc, features: STAIR.concat(BRIDGE, ROWS), MARKS, DECALS, AIR, WAY, OLD: P0.OLD, SP };
}

/* ══ THE ONE ROOM: THE SOLAR SYSTEM YOU FLY THROUGH (2026-11-17, mondo: "the plan was to be able to fly to these planets in outer space";
   "connected/bigger rooms is better. If the room is smaller than disaster city ... just make it one room"; his OK on the flying plan
   /mnt/project-files/space-one-world/outer_space_flying_plan.png, 10:19 UTC). ONE room of 12 x 12 plots (504 m, Disaster City's size):
   the four worlds stand in it as they were built (every plot, every piece, moved as one block, nothing turned or cut) over THE VOID
   (open space: no ground between them, data.js terrain.void), each on a planet ball (`space.planets`); Low Orbit, one new plot in the
   middle, is where the Spaceship waits. THE SHIP (catalogue `spaceship_fly`, `vehicle: 'ship'`) is flown by hand (three-renderer.js
   THE SPACESHIP: W / S thrust, A / D turn, SPACE / C up / down); a gold BEACON over each district's landing (`space.beacons`) sets it
   down there. The room keeps the Moon's id (`site_prebuilt_moon_plots`, the old saves and links); the Mars, Saturn and Singularity
   rooms are retired into it (DOOR_HQ.retired). ══ */
/* BIGGER (2026-11-17, mondo: "make the room bigger"): every world round, so the room holds four nets (where their ground lies for the
   walk; nothing is drawn there) and the balls hang well apart in a taller sky: 24 x 15 plots, 380 m up */
/* FAR APART + BIGGER (2026-11-17, mondo: "The planets are way too close together ... i wouldnt mind if they were bigger, especially relative
   to each other (saturn should be bigger than the moon obviously)"): the nets (the walk's ground; nothing is drawn there) are packed in a room
   of 46 x 19 plots, and the balls hang in a far bigger box of open space (`space.box`, the ship's limits: the room's own box no longer holds
   the ship). ROUNDC = each ball's middle, metres. From the berth: the Moon 420 m, Mars 900 m, the Singularity 1,600 m, Saturn 1,900 m (they
   were 150 to 400 m apart, ring to ball). */
const SYS = { cols: 46, rows: 19, place: { saturn: [1, 1], mars: [26, 1], singularity: [26, 10], moon: [39, 10] },   // (a plot of void round every net: two nets that touch share their edge's ground, drawn as a slab stretched between two balls)
    room: 'site_prebuilt_moon_plots', site: 'prebuilt_moon', VOID: -60, ceil: 900,
    box: { x0: -1750, x1: 1500, z0: -1350, z1: 1750, y0: -260 } };
/* THE ROUND WORLDS: where each round world's ball hangs (metres; out in the open, far from each other) */
const ROUNDC = { saturn: [-950, 400, 300], mars: [60, 300, -640], singularity: [-150, 120, 1050], moon: [640, 210, 60] };
const PL_FACES = [[[-1, 0, 0], [0, 0, 1], [0, -1, 0]], [[0, 0, 1], [1, 0, 0], [0, -1, 0]], [[1, 0, 0], [0, 0, -1], [0, -1, 0]],
    [[0, 0, -1], [-1, 0, 0], [0, -1, 0]], [[0, -1, 0], [1, 0, 0], [0, 0, -1]], [[0, 1, 0], [1, 0, 0], [0, 0, 1]]];
/* the flat net's (x, y, z) → its point on the ball (= three-renderer.js _ewPlBendFace) */
function plBend(p, x, y, z) {
    const col = Math.max(0, Math.min(2, Math.floor((x - p.x0) / p.L))), row = Math.max(0, Math.min(1, Math.floor((z - p.z0) / p.L))), F = PL_FACES[row * 3 + col];
    const a = (x - p.x0 - col * p.L) / p.L * 2 - 1, b = (z - p.z0 - row * p.L) / p.L * 2 - 1, ta = Math.tan(a * Math.PI / 4), tb = Math.tan(b * Math.PI / 4);
    const d = [0, 1, 2].map(i => F[0][i] + F[1][i] * ta + F[2][i] * tb), l = Math.hypot(d[0], d[1], d[2]), rr = Math.max(p.R + y, p.R * 0.3);
    return [0, 1, 2].map(i => p.c[i] + d[i] / l * rr);
}
const BAY = { moon: 'bay', mars: 'bay_mars', saturn: 'bay_saturn', singularity: 'bay_singularity' };
const PIECES = PLAN.rooms.map(R => R.flat ? toBall(bakeWorld(Object.assign({}, R, R.flat)), R) : bakeWorld(R));
{
    const BW = SYS.cols * N, BH = SYS.rows * N, BHX = BW * C / 2, BHZ = BH * C / 2;
    const bgx = c => r2(-BHX + c * C), bgz = c => r2(-BHZ + c * C), bgcx = c => r2(-BHX + (c + 0.5) * C), bgcz = c => r2(-BHZ + (c + 0.5) * C);
    const cell = []; for (let y = 0; y < BH; y++) cell.push(new Array(BW).fill('v'));
    const H4 = new Array(BW * BH).fill(null).map(() => [SYS.VOID, SYS.VOID, SYS.VOID, SYS.VOID]);
    const key = new Array(BW * BH).fill(null);
    const names = [], props = [], npc = [], features = [], MARKS = [], DECALS = [], AIR = [], lines = [], ways = {}, planets = [], beacons = [], mesas = [], round = [];
    const sh = (o, dx, dz) => { const q = Object.assign({}, o);
        if (q.pts || q.off) throw new Error('compose: a piece with pts / off: ' + JSON.stringify(o).slice(0, 80));
        ['x', 'x0', 'x1'].forEach(k => { if (typeof q[k] === 'number') q[k] = r2(q[k] + dx); });
        ['z', 'z0', 'z1'].forEach(k => { if (typeof q[k] === 'number') q[k] = r2(q[k] + dz); });
        return q; };
    const PLANET = { moon: { tex: 'moon', color: 0xc8c8c8 }, mars: { tex: 'mars', color: 0xc8643a }, saturn: { tex: 'cloud_thick', color: 0xd9b77a, ring: { tex: 'ice', color: 0xe8d3a0 } }, singularity: { tex: 'obsidian', color: 0x18101e, rim: 0xff9a40 } };
    PIECES.forEach(P => { const [pc, pr] = SYS.place[P.R.id], sx0 = pc * N, sy0 = pr * N, dx = r2(-BHX + sx0 * C + P.HX), dz = r2(-BHZ + sy0 * C + P.HZ);
        for (let y = 0; y < P.Hh; y++) for (let x = 0; x < P.W; x++) { const ch = P.cell[y][x], i = (sy0 + y) * BW + sx0 + x; cell[sy0 + y][sx0 + x] = ch; H4[i] = P.H4[y * P.W + x].slice(); key[i] = P.WR.pal[ch] || P.WR.floor; }
        P.R.plots.forEach(p => names.push(['P' + String(pc + p.x).padStart(2, '0') + '-' + String(pr + p.y).padStart(2, '0'), p.name, p.d, p.level]));
        P.props.forEach(o => props.push(sh(o, dx, dz))); P.npc.forEach(o => npc.push(sh(o, dx, dz))); P.features.forEach(o => features.push(sh(o, dx, dz)));
        P.MARKS.forEach(o => MARKS.push(sh(o, dx, dz))); P.DECALS.forEach(o => DECALS.push(sh(o, dx, dz))); P.AIR.forEach(o => AIR.push(sh(o, dx, dz)));
        (P.OLD.l || []).forEach(l => lines.push(l));
        /* the world's ball: wholly under its block (its top 3 m under the lowest ground that is not void), as wide as the block, so the
           districts stand on the top of a planet like a plateau and the ball curves away under them */
        /* A ROUND WORLD (2026-11-17, THE ROUND WORLDS): its block is a net of six faces the game bends onto a ball out in the open
           (`space.round`: x0 z0 = the net's north-west corner, L = a face's side, R = the ball's radius, so one face = a quarter turn,
           c = its middle, top = its highest ground); no plateau ball, no rock flank */
        if (P.R.round) { let top = 0; P.H4.forEach(q => q.forEach(h => { if (h > top) top = h; }));
            const fq = P.W / 3, L = fq * C, c = ROUNDC[P.R.id]; if (!c) throw new Error('compose: no ball place for the round ' + P.R.id);
            if (P.W !== 3 * fq || P.Hh !== 2 * fq || fq % N) throw new Error('compose: a round world is 3 x 2 faces of whole plots: ' + P.R.id);
            const pl = PLANET[P.R.id], rw = { id: P.R.id, name: P.WR.label, x0: r2(-BHX + sx0 * C), z0: r2(-BHZ + sy0 * C), L, R: r2(L * 2 / Math.PI), c, top: r2(top) };
            if (pl.ring) rw.ring = pl.ring; if (pl.rim != null) rw.rim = pl.rim; round.push(rw);
            Object.keys(P.WAY).forEach(k => { const w = P.WAY[k]; ways[k + '@' + P.R.id] = { id: k, world: P.R.id, x: r2(w.x + dx), z: r2(w.z + dz), face: w.face, y: r2(P.hC(w.sx, w.sy)), fx: r2(P.gcx(w.fx) + dx), fz: r2(P.gcz(w.fy) + dz), fy: r2(P.hC(w.fx, w.fy)) }; });
            return; }
        let lowG = 0; P.H4.forEach(q => q.forEach(h => { if (h > -20 && h < lowG) lowG = h; }));
        const half = Math.hypot(P.HX, P.HZ), r = r2(half * 1.05), pl = PLANET[P.R.id];
        planets.push(Object.assign({ id: P.R.id, name: P.WR.label, x: dx, z: dz, y: r2(lowG - 3 - r), r }, pl));
        /* the block's rock flank (`space.mesas`): from the lowest ground on its edge down into the ball, so a world stands on its planet
           like a mesa (the field itself stops sharp at the void, terrain.void.sharp) */
        let edgeLo = 99; for (let y = 0; y < P.Hh; y++) for (let x = 0; x < P.W; x++) { if (x && y && x < P.W - 1 && y < P.Hh - 1) continue; P.H4[y * P.W + x].forEach(h => { if (h > -20 && h < edgeLo) edgeLo = h; }); }
        const bot = r2(lowG - 3 - r + Math.sqrt(Math.max(0, r * r - half * half * 0.72)));
        mesas.push({ x: dx, z: dz, hx: P.HX, hz: P.HZ, top: r2(Math.min(0, edgeLo) - 0.1), bottom: bot, taper: 0.85, rock: 'moon_3' });
        Object.keys(P.WAY).forEach(k => { const w = P.WAY[k]; ways[k + '@' + P.R.id] = { id: k, world: P.R.id, x: r2(w.x + dx), z: r2(w.z + dz), face: w.face, y: r2(P.hC(w.sx, w.sy)), fx: r2(P.gcx(w.fx) + dx), fz: r2(P.gcz(w.fy) + dz), fy: r2(P.hC(w.fx, w.fy)) }; });
    });
    /* THE BERTH (2026-11-17, pass 2): the Spaceship waits on its pad on the top of the Moon (draw-space.js moon(): squares 62..67 x 27..32). It
       stood on "Low Orbit", a square plot of rock hanging by itself: the one flat square map left in a room of balls. The Bridge's stick and
       the berth's hatch are the Moon's own ways now (`ship_stick`, `orbit_derelict`); the Earth still hangs under it all. */
    { const M = PIECES.find(P => P.R.id === 'moon'), [pc, pr] = SYS.place.moon, mdx = r2(-BHX + pc * N * C + M.HX), mdz = r2(-BHZ + pr * N * C + M.HZ);
      const cx = r2(-M.HX + 65 * C + mdx), cz = r2(-M.HZ + 30 * C + mdz), gy = r2(M.hC(64, 29));
      SYS.berth = { x: cx, z: cz };
      props.push({ key: 'spaceship_fly', x: cx, z: cz, face: 0 });
      planets.push({ id: 'earth', name: 'EARTH', x: 929, z: -182, y: -345, r: 290, tex: 'ocean', color: 0x3c78d2, land: 0x4d8a45 });   // (290 m: it was 55 m, smaller than the Moon)
      const bc = { id: 'orbit', label: 'THE MOON · THE BERTH', x: cx, z: cz, ground: gy, pad: { x: cx, z: cz, yaw: 0 } };
      const rw = round.find(q => q.id === 'moon'), B = plBend(rw, cx, gy, cz), u = [B[0] - rw.c[0], B[1] - rw.c[1], B[2] - rw.c[2]], ul = Math.hypot(u[0], u[1], u[2]); bc.ball = B.map(r2); bc.up = u.map(v => r2(v / ul));
      beacons.push(bc);
    }
    /* the Sun: far off, a ball of light (never reached) */
    const SUN = { x: 2760, z: 1725, y: 1210, r: 300, color: 0xffc46a };   // (2026-11-17: far off to the east and high: where the balls' daylight comes from, three-renderer.js _hqBuildSpace)
    /* THE BEACONS: one over each district's landing (the collar spots of draw-space.js; the bay doors are not landings) */
    const LANDING = { mare_derelict: 'THE MOON · THE MARE', moon_derelict: 'THE MOON · THE CRATER', farside_derelict: 'THE MOON · THE FAR SIDE', cydonia_derelict: 'MARS · CYDONIA',
        canyon_derelict: 'MARS · THE CANYON', mars_derelict: 'MARS · THE ROVER BAY', hexagon_derelict: 'SATURN · THE HEXAGON', derelict_saturn: 'SATURN · THE RING SHARD',
        rim_derelict: 'THE SINGULARITY · THE ACCRETION RIM', drop_derelict: 'THE SINGULARITY · THE DROP' };
    Object.keys(LANDING).forEach(k => { const w = Object.values(ways).find(q => q.id === k); if (!w) throw new Error('no landing way ' + k);
        const yaw = (w.face * Math.PI / 180);
        const bc = { id: k, label: LANDING[k], x: w.fx, z: w.fz, ground: w.fy, pad: { x: w.fx, z: w.fz, yaw: r2(yaw) } };
        const rw = round.find(q => q.id === w.world); if (rw) { const B = plBend(rw, w.fx, w.fy, w.fz), u = [B[0] - rw.c[0], B[1] - rw.c[1], B[2] - rw.c[2]], ul = Math.hypot(u[0], u[1], u[2]); bc.ball = B.map(r2); bc.up = u.map(v => r2(v / ul)); }
        beacons.push(bc); });
    /* the open ground (greedy rectangles, the void squares too: they are the sky, never rock) */
    const open = (x, y) => cell[y][x] !== 'x';
    const spaces = []; { const used = new Uint8Array(BW * BH);
      for (let cy = 0; cy < BH; cy++) for (let cx = 0; cx < BW; cx++) { if (!open(cx, cy) || used[cy * BW + cx]) continue;
          let w = 1; while (cx + w < BW && !used[cy * BW + cx + w] && open(cx + w, cy)) w++;
          let h = 1; rows: while (cy + h < BH) { for (let i = 0; i < w; i++) if (used[(cy + h) * BW + cx + i] || !open(cx + i, cy + h)) break rows; h++; }
          for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) used[(cy + j) * BW + cx + i] = 1;
          spaces.push({ k: 'space', x: r2(bgx(cx) + w * C / 2), z: r2(bgz(cy) + h * C / 2), w: w * C, d: h * C }); } }
    const PAL = [], palOf = k => { let i = PAL.indexOf(k); if (i < 0) { PAL.push(k); i = PAL.length - 1; } return i + 1; }, paint = new Uint8Array(BW * BH);
    /* the walk's ground draws EIGHT sheets at most (three-renderer.js: paint.pal.slice(0, 8); a ninth falls back to the floor, so the
       round Singularity drew as moon dust): the room's floor and the void take 0, and four rare sheets give way to a near one */
    const MERGE = { moon: null, void: null, moon_2: 'moon_3', ice: 'cloud_thick', storm: 'obsidian', lava: 'crystal' };   // (2026-11-17: desert is its own sheet again, Saturn's gold deck and Mars' dunes; the two grey dusts share one)
    /* THE NETS' EDGES (2026-11-17): the void square beside a net wears its neighbour's sheet (it is never drawn; the paint blends half a
       square across a line, so every cut seam of a ball showed a pale line of the room's floor sheet, moon dust, over black glass or gold cloud) */
    { const k2 = key.slice(); for (let y = 0; y < BH; y++) for (let x = 0; x < BW; x++) { const i = y * BW + x; if (key[i] != null || cell[y][x] !== 'v') continue;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) { const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= BW || Y >= BH || cell[Y][X] === 'v' || key[Y * BW + X] == null) continue; k2[i] = key[Y * BW + X]; break; } }
      for (let i = 0; i < BW * BH; i++) key[i] = k2[i]; }
    for (let i = 0; i < BW * BH; i++) { let k = key[i]; if (k && k in MERGE) k = MERGE[k]; paint[i] = k ? palOf(k) : 0; }
    if (PAL.length > 8) throw new Error('compose: the ground has ' + PAL.length + ' sheets, the renderer draws 8: ' + PAL.join(' '));
    const slope = Buffer.alloc(BW * BH * 8); H4.forEach((q, i) => q.forEach((h, k) => slope.writeInt16LE(Math.round(h * 100), i * 8 + k * 2)));
    if (!CAT.spaceship_fly) throw new Error('catalogue: spaceship_fly (the flown ship) is missing');
    const sing = PIECES.find(P => P.R.id === 'singularity'), moon = PIECES.find(P => P.R.id === 'moon');
    const SPM = { x: ways['ship_stick@moon'].x, z: r2(ways['ship_stick@moon'].z + 2) };
    const sky = Object.assign({}, sing.OLD.shell.sky, { scenery: 'deepspace', tint: 0x101830, tintAmt: 0.25, stars: 2.4, nebula: 1.2, fog: { color: 0x05060c, amount: 0.06, top: 0.02, band: 0.3, density: 0.0004 } });   // (density: was 0.0015, set for worlds 300 m apart; at 2 km Saturn went grey-green)
    const shell = Object.assign({}, moon.OLD.shell, { w: 2 * BHX, d: 2 * BHZ, h: SYS.ceil, wallH: 9, sky, look: sing.OLD.shell.look, plate: { x: SPM.x, z: SPM.z, y: 4.4 } });
    if (AIR.length) shell.atmos = { kind: AIR[0].kind, tier: 'open', zones: AIR };
    /* THE TWO SECRET WAYS that joined two worlds (links cydonia_mare, saturn_singularity until 2026-11-17) have both ends in this room now: a door pair of
       the room's own (a link cannot have both ends in one room). Walking in still takes you to the other end, as before. */
    const PAIRS = { 'cydonia_mare@mars': ['bore_face', 'bore_farside', 'leaf_bulkhead', 'THE FACE’S MOUTH · THE BORE TO THE FAR SIDE', true], 'cydonia_mare@moon': ['bore_farside', 'bore_face', 'leaf_bulkhead', 'THE FAR SIDE · THE BORE TO THE FACE', true],
        'saturn_singularity@saturn': ['frame_rim', 'frame_singularity', 'leaf_frame_only', 'THE RIM WALK · THE DROP’S FRAME', false], 'saturn_singularity@singularity': ['frame_singularity', 'frame_rim', 'leaf_frame_only', 'THE ACCRETION RIM · THE FRAME', false] };
    const roomDoors = [];
    Object.keys(PAIRS).forEach(k => { const w = ways[k], q = PAIRS[k]; if (!w) throw new Error('no way ' + k);
        const d = { id: q[0], wall: 'free', x: w.x, z: w.z, face: w.face }; if (Math.abs(w.y) > 0.3) d.y = w.y;
        Object.assign(d, { leaf: q[2], label: q[4] ? 'THE BORE' : 'THE FRAME', sub: q[3], action: { room: SYS.room, at: q[1] } }); if (q[4]) d.secret = true;
        roomDoors.push(d); delete ways[k]; });
    const L = BLOCK;
    L.push("        /* SPACE72-BEGIN — OUTER SPACE, THE SOLAR SYSTEM (2026-11-17; was four rooms on plots, 2026-11-16): written by `node bake-space.js` from docs/areas/space/layout.json + districts/<LETTER>.js. Never hand-edit between the markers; edit the tool, the plan script (docs/plans/world-zones/draw-space.js) or a district file and rerun. */");
    L.push("        " + SYS.room + ": {");
    L.push("            label: 'OUTER SPACE',");
    L.push("            sub: 'THE MOON · MARS · SATURN · THE SINGULARITY · FLY THE SHIP BETWEEN THEM',");
    L.push("            kind: 'box', site: '" + SYS.site + "', part: '" + PART + "',");
    L.push("            world: { hub: 'space', layer: 'off', zx: 0, zy: 0, note: 'THE SOLAR SYSTEM' },");
    L.push("            shell: " + J(shell) + ",");
    L.push("            parti: 'Four round worlds hanging far apart in the dark, each a ball you walk all the way round: the small Moon over the Earth, the Spaceship\\'s berth on its top, Mars twice its size to the north-west, the Singularity with its burning disc to the south-west, and Saturn, four Moons across, with its rings far out west. You fly the ship from one to the next (SHIFT = the burner) and set it down on a beacon.',");
    L.push("            typology: 'grid',");
    L.push("            plots: { cell: " + C + ", plot: " + (N * C) + ", nx: " + SYS.cols + ", nz: " + SYS.rows + ", names: " + J(names) + ", mask: " + J((() => { const m = []; for (let r = 0; r < SYS.rows; r++) { let s = ''; for (let c = 0; c < SYS.cols; c++) s += names.some(n => n[0] === 'P' + String(c).padStart(2, '0') + '-' + String(r).padStart(2, '0')) ? '#' : '.'; m.push(s); } return m; })()) + " },");
    L.push("            /* THE SOLAR SYSTEM: what three-renderer.js THE SPACESHIP draws and flies by (the balls, the Sun, the beacons, the ceiling) */");
    L.push("            space: " + J({ ceil: SYS.ceil - 10, box: SYS.box, sun: SUN, planets, mesas, round, beacons, berth: SYS.berth, launch: { x: ways['ship_stick@moon'].x, z: ways['ship_stick@moon'].z } }) + ",");
    L.push("            terrain: {");
    L.push("                res: 1.75, tileM: 168, floor: 'moon', cliff: 'moon_3', path: 'moon_2',");   // (res: was 0.875, a quarter of the triangles now; tileM: the ground in 168 m tiles, three-renderer.js _hqTerrainTiles: a tenth of the draws)
    L.push("                noise: { amp: 0.1, scale: 10 }, crag: false, outer: false,");
    L.push("                /* THE VOID: every square between the worlds is open space (its ground lies at " + SYS.VOID + " m, under the lip); a fall puts the walker back on the last ground */");
    L.push("                void: { lip: -20, fall: -24, rock: 'moon_3', glow: 0x0a0c18, glowY: -90, sharp: true },");
    L.push("                slope: { cells: { res: " + C + ", x0: " + bgx(0) + ", z0: " + bgz(0) + ", nx: " + BW + ", nz: " + BH + ", d: '" + slope.toString('base64') + "' } },");
    if (MARKS.length) L.push("                marks: " + J(MARKS) + ",");
    L.push("                paint: { pal: " + J(PAL) + ", t: 'u8', res: " + C + ", x0: " + bgcx(0) + ", z0: " + bgcz(0) + ", nx: " + BW + ", nz: " + BH + ", d: '" + Buffer.from(paint).toString('base64') + "' },");
    L.push("                /* every square that is not a `space` is rock (the worlds' rims, ridges and storm walls) */");
    L.push("                gen: { kind: 'plan', look: 'rock', wallH: 5, edge: 2.0, jitter: 0.4, topNoise: 1.1, rim: 0, forceGrow: 0 },");
    L.push("                features: [");
    spaces.concat(features).forEach(f => L.push("                    " + J(f) + ","));
    L.push("                ],");
    L.push("            },");
    L.push("            doors: [");
    roomDoors.forEach(d => L.push("                " + J(d) + ","));
    L.push("            ],");
    L.push("            counters: [],");
    L.push("            props: [");
    for (let i = 0; i < props.length; i += 4) L.push("                " + props.slice(i, i + 4).map(J).join(", ") + ",");
    L.push("            ],");
    L.push("            agents: [],");
    L.push("            npcSpots: " + J(npc) + ",");
    L.push("            onlineSpots: [],");
    L.push("            lines: " + J(lines) + ",");
    L.push("            spawn: { x: " + SPM.x + ", z: " + SPM.z + ", face: 0 },");
    L.push("        },");
    L.push("        /* SPACE72-END */");
    /* the rows in data.js that name a place in this room (written by hand there) */
    Object.keys(ways).forEach(kk => { let k = kk; const w = ways[kk], at = "wall: 'free', x: " + w.x + ", z: " + w.z + ", face: " + w.face + (Math.abs(w.y) > 0.3 ? ', y: ' + w.y : '');
        k = w.id;
        if (k === 'bay') { const site = 'prebuilt_' + w.world; WANT.push([site + ": { room: '" + SYS.room + "', door: { id: '" + BAY[w.world] + "', " + at + " } }", 'siteRooms.entry.' + site, { entry: site }]); }
        else WANT.push(["{ site: '" + SYS.site + "', part: '" + PART + "', " + at + ",", 'link ' + k + ' (the ' + w.world + ' end)', { link: k }]); });
    DECALROWS.push("    " + SYS.room + ": " + J(DECALS.slice(0, 60)) + ",   // SPACE72-DECALS: written by bake-space.js\n");
    WANT.push([SYS.room + ": { x: " + SPM.x + ", z: " + SPM.z + " }", 'HQ_AREA_MARKERS.' + SYS.room, { marker: 1 }]);
    TOTAL.system = { plots: names.length, props: props.length, natives: npc.length, features: spaces.length + features.length, spaces: spaces.length, planets: planets.length, beacons: beacons.length };
}
Object.keys(DISTRICTS).forEach(k => { if (!PLAN.rooms.some(R => R.districts[k])) throw new Error('districts/' + k + '.js is no district of the layout'); });
const block = BLOCK.join('\n') + '\n';
console.log(JSON.stringify(TOTAL));
const file = path.join(REPO, 'data.js'); let src = fs.readFileSync(file, 'utf8');
/* `--rows` (2026-11-17): the rows in data.js that name a place in this room (the links' world ends, the bays, the area marker) are moved
   to where the worlds stand now (a world that grew or moved shifts every one of them); without it they are only checked, as before */
if (process.argv.includes('--rows')) { let n = 0; const esc = t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    WANT.forEach(w => { const k = w[2]; if (!k || src.replace(/ +/g, ' ').indexOf(w[0]) >= 0) return; let done = false;
        if (k.link) { const i = src.indexOf("{ id: '" + k.link + "',"); if (i >= 0) { const j = src.indexOf("\n        { id: '", i + 5), seg = src.slice(i, j < 0 ? i + 2000 : j);
            const seg2 = seg.replace(new RegExp("\\{ site: '" + SYS.site + "', part: '" + PART + "', wall: 'free', x: [-0-9.]+, z: [-0-9.]+, face: [-0-9.]+(, y: [-0-9.]+)?,"), w[0]); if (seg2 !== seg) { src = src.slice(0, i) + seg2 + src.slice(i + seg.length); done = true; } } }
        else if (k.entry) { const re = new RegExp(esc(k.entry) + ": \\{ room: '" + SYS.room + "', door: \\{[^}]*\\} \\}"); if (re.test(src)) { src = src.replace(re, w[0]); done = true; } }
        else if (k.marker) { const re = new RegExp("(\\n    )" + SYS.room + ": \\{ x: [-0-9.]+, z: [-0-9.]+ \\}"); if (re.test(src)) { src = src.replace(re, '$1' + w[0]); done = true; } }
        if (done) n++; else console.log('--rows: could not place ' + w[1]); });
    console.log('--rows: ' + n + ' row(s) of data.js moved'); }
const flat = src.replace(/ +/g, ' '), missing = WANT.filter(w => flat.indexOf(w[0]) < 0);
if (missing.length) { console.log('data.js rows to write by hand:'); missing.forEach(w => console.log('  ' + w[1] + ':  ' + w[0])); if (!DRY) throw new Error('data.js does not point at these rooms yet (see the rows above)'); }
if (DRY) process.exit(0);
const END = '        /* SPACE72-END */\n', b0 = src.indexOf('        /* SPACE72-BEGIN'), b1 = src.indexOf(END);
if (b0 >= 0 && b1 > b0) src = src.slice(0, b0) + block + src.slice(b1 + END.length);
else { const a = src.indexOf('        /* ESTATE36-BEGIN'); if (a < 0) throw new Error('anchor (ESTATE36-BEGIN) not found in data.js'); src = src.slice(0, a) + block + src.slice(a); }
/* the rooms' floor decals: one row a room in DOOR_HQ.decals (written before the Sewers' own row) */
{ src = src.split('\n').filter(l => l.indexOf('SPACE72-DECALS') < 0).join('\n');
  const a = src.indexOf('    site_prebuilt_downtown_underworld: ['); if (a < 0 || src.slice(a, src.indexOf('\n', a)).indexOf('SEWERS24-DECALS') < 0) throw new Error('DOOR_HQ.decals anchor (the Sewers\' row) not found');
  src = src.slice(0, a) + DECALROWS.join('') + src.slice(a); }
fs.writeFileSync(file, src);
console.log('data.js: the solar system written (' + block.length + ' bytes)');
