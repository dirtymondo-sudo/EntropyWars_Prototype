#!/usr/bin/env node
/* bake-deep.js — THE DEEP ON PLOTS (2026-11-16, the Deep zone thread, on mondo's order of that day: the eight zones still on old handmade rooms
   are put on plots as a full redesign, without waiting for his OK; "yes underwater room", "No deep to Area 51").
   Two rooms, written into data.js between DEEP40-BEGIN / DEEP40-END:
     site_prebuilt_atlantis_deep     THE DEEP: 8 x 5 plots of 12 x 12 squares (336 x 210 m), a DROWNED room (terrain.sea.under: the walker swims from
                                     the first frame, the water is the room's air). Four districts: C Atlantis, the Citadel · R Atlantis, the Rings ·
                                     S The Sea Floor · T The Trench.
     site_prebuilt_atlantis_pocket   THE TEMPLE OF THE DEEP: the dry inside under the dome, 18 x 18 squares, behind the vault door on the Agora.
   Reads docs/areas/deep/layout.json (written by docs/plans/world-zones/make-deep.py: every plot, the square map `cells`, the level map `levels`).
   `node bake-deep.js` writes; `--dry-run` prints the counts; `DEEP_DUMP=1` prints the square map. Never hand-edit between the markers.
   Notes: docs/notes/areas-complexes.md "THE DEEP ON PLOTS".
   THE DISTRICT FILES: what stands in a district is written in docs/areas/deep/districts/<C R S T>.js, one thread a file. A file may export the
   stages `plan(ctx)` (change squares / levels), `build(ctx)` (terrain rows, drawn pieces), `dress(ctx)` (props, animals), `people(ctx)`, and
   `airZones(ctx)`; district C also exports `inside(ctx)` (the Temple's dry room). This tool keeps what is shared: the plan, the heights, the
   paint, the sea, the ways out, the shell, the checks.
   THE HEIGHTS ARE THE MAP (the Beach's way): terrain.slope.cells carries every square's four corners. Sand, kelp floor and trench silt are one
   soft surface; paving ramps between its levels; the rings' terraces, the canal beds, the city wall, podiums and decks are flat with a step at
   their edge; rock and reef are crags. Nothing is a wall to the roof: a swimmer goes over anything, never through it.
   Squares: sx 0..95 west to east, sy 0..59 north to south. gx / gz = a square's west / north line in metres, cx / cz = its middle. */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const REPO = __dirname, DRY = process.argv.includes('--dry-run');
const PLAN = JSON.parse(fs.readFileSync(path.join(REPO, 'docs/areas/deep/layout.json'), 'utf8'));
const C = 3.5, N = PLAN.plotCells, GX = PLAN.cols, GZ = PLAN.rows, W = GX * N, H = GZ * N, HX = W * C / 2, HZ = H * C / 2, LEVEL = PLAN.levelMeters, PL = N * C;
const ROOM = 'site_prebuilt_atlantis_deep', INSIDE = 'site_prebuilt_atlantis_pocket';
const SEA_Y = 47.25;   // the surface: 26 m over the Agora (the old Abyss had 26 m over its floor); the swimmer's cap is a metre under it
const r2 = v => Math.round(v * 100) / 100, gx = c => r2(-HX + c * C), gz = c => r2(-HZ + c * C), cx = c => r2(-HX + (c + 0.5) * C), cz = c => r2(-HZ + (c + 0.5) * C);
const J = v => JSON.stringify(v).replace(/"([a-zA-Z_][a-zA-Z0-9_]*)":/g, '$1:').replace(/'/g, "\\'").replace(/"/g, "'");
const D = require('./load-data.js').loadGameData();
/* the old rooms' people, lines and door texts are read from the old literals (they stay in data.js: the PvP boards are cut from them) */
const OLDR = id => JSON.parse(vm.runInContext('JSON.stringify((r => r ? { n: r.npcSpots || [], l: r.lines || [], d: r.doors || [] } : { n: [], l: [], d: [] })(DOOR_HQ.rooms.' + id + '))', D));
const O_ABYSS = OLDR('site_prebuilt_atlantis_abyss'), O_TEMPLE = OLDR('site_prebuilt_atlantis_temple');
const sayOf = (R, race, i) => (R.n.filter(n => n.race === race)[i || 0] || {}).say;
const B36 = '0123456789abcdefghijklmnopqrstuvwxyz';
const cell = PLAN.cells.map(r => r.split('')), lv = PLAN.levels.map(r => r.split('').map(ch => B36.indexOf(ch)));
const plot = {}; PLAN.plots.forEach(p => { p.x = +p.id.slice(1, 3); p.y = +p.id.slice(4, 6); if (!PLAN.districts[p.d]) throw new Error('district? ' + p.d); plot[p.id] = p; });
const inb = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
const Pxy = (x, y) => plot['P0' + Math.max(0, Math.min(GX - 1, x)) + '-0' + Math.max(0, Math.min(GZ - 1, y))];
const distAt = (x, y) => Pxy(Math.floor(x / N), Math.floor(y / N)).d;
const F = [], ARCH = [], props = [], doors = [], npc = [], count = {}, taken = new Set(), errs = [], strays = [];
const feat = o => { F.push(o); return o; };
let curD = null;
const setSq = (x, y, ch, level) => { if (!inb(x, y)) return; if (curD && distAt(x, y) !== curD) strays.push(curD + ': a square changed at ' + x + ',' + y + ' (' + distAt(x, y) + ')'); if (ch) cell[y][x] = ch; if (level != null) lv[y][x] = level; };
const setRect = (x0, y0, x1, y1, ch, level) => { for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) setSq(x, y, ch, level); };
const hSq = (x, y) => lv[Math.max(0, Math.min(H - 1, y))][Math.max(0, Math.min(W - 1, x))] * LEVEL;   // a square's own height, metres

/* ── the drawn pieces (arch rows: drawn only, walked / swum round): the Estate's sheet, with marble for timber ── */
const MB = 'marble_light', RU = 'ruins', RK = 'rocks_5';
function sheet() {
    const P = [];
    const add = (o, key, tint, x) => { if (key) o.key = key; if (tint != null) o.tint = tint; if (x) Object.assign(o, x); P.push(o); return o; };
    const A = { P,
        box: (x, y, z, w, h, d, key, tint, o) => add({ s: 'box', p: [r2(x), r2(y), r2(z)], size: [r2(w), r2(h), r2(d)] }, key, tint, o),
        cyl: (x, y, z, r, h, key, tint, o) => add({ s: 'cyl', p: [r2(x), r2(y), r2(z)], r, h }, key, tint, o),
        dome: (x, y, z, r, h, key, tint, o) => add({ s: 'dome', p: [r2(x), r2(y), r2(z)], r, h }, key, tint, o),
        roof: (form, x, y, z, w, h, d, key, tint, o) => add({ s: 'roof', form, p: [r2(x), r2(y), r2(z)], size: [r2(w), r2(h), r2(d)], roof: true }, key, tint, o),
        quad: (x, y, z, w, h, key, tint, o) => add({ s: 'quad', p: [r2(x), r2(y), r2(z)], size: [r2(w), r2(h)] }, key, tint, o),
        /* a Greek column: a drum base, a tapered shaft, a square capital (h = its whole height) */
        column(x, y, z, h, r, tint, o) { r = r || 0.45; A.cyl(x, y, z, r * 1.35, 0.3, MB, tint, o); A.cyl(x, y + 0.3, z, r, h - 0.75, MB, tint, Object.assign({ r2: r * 0.84, seg: 12 }, o || {})); A.box(x, y + h - 0.45, z, r * 2.7, 0.45, r * 2.7, MB, tint, o); },
        /* a broken column: a stump */
        stump(x, y, z, h, r, tint) { r = r || 0.45; A.cyl(x, y, z, r * 1.35, 0.3, MB, tint); A.cyl(x, y + 0.3, z, r, h, MB, tint, { seg: 12 }); },
    };
    return A;
}
function look(id, x, z, rot, fn, y) { const a = sheet(); fn(a); const row = { k: 'arch', id: 'deep:' + id + ':look', x: r2(x), z: r2(z), rot: rot || 0, parts: a.P }; if (y != null) row.y = r2(y); ARCH.push(row); return row; }

/* ── placing things: a blocker on a square's middle (P), decor off it (dec), a swimmer over a square (swim), people (native) ── */
function spot(sx, sy, what, shared) { if (!inb(sx, sy)) { errs.push(what + ' is off the map at ' + sx + ',' + sy); return; } if (curD && distAt(sx, sy) !== curD) strays.push(curD + ': ' + what + ' at ' + sx + ',' + sy + ' (' + distAt(sx, sy) + ')');
    if (!shared) { if (taken.has(sx + ':' + sy)) errs.push(what + ': square ' + sx + ',' + sy + ' is taken'); taken.add(sx + ':' + sy); } }
const P = (key, sx, sy, o) => { spot(sx, sy, key); const r = Object.assign({ key, x: cx(sx), z: cz(sy) }, o || {}); props.push(r); return r; };
const decWith = rnd => (key, sx, sy, o) => { spot(sx, sy, key, true); const r = Object.assign({ key, x: r2(cx(sx) + (rnd() - 0.5) * 1.8), z: r2(cz(sy) + (rnd() - 0.5) * 1.8), face: Math.round(rnd() * 360) }, o || {}); props.push(r); return r; };
const swim = (key, sx, sy, y, o) => { if (!inb(sx, sy)) { errs.push(key + ' swims off the map'); return; } const r = Object.assign({ key, x: cx(sx), z: cz(sy), y }, o || {}); props.push(r); return r; };   // y = metres off the floor
const native = (race, sx, sy, face, say) => { spot(sx, sy, race); const n = { x: cx(sx), z: cz(sy), face: face || 0, race }; if (say) n.say = say; npc.push(n); return n; };
const scatter = (key, n, sx, sy, rSq, seed, o) => feat(Object.assign({ k: 'scatter', key, n, x: cx(sx), z: cz(sy), r: r2(rSq * C), seed, sea: true }, o || {}));

/* ── THE DISTRICT FILES ── */
const mkRnd = s => { let v = s >>> 0; return () => { v = (v * 1664525 + 1013904223) >>> 0; return v / 4294967296; }; };
const DISTRICTS = (() => { const dir = path.join(REPO, 'docs/areas/deep/districts'), o = {}; fs.readdirSync(dir).filter(f => /^[A-Z]\.js$/.test(f)).sort().forEach(f => { o[f[0]] = require(path.join(dir, f)); }); return o; })();
Object.keys(PLAN.districts).forEach(k => { if (!DISTRICTS[k]) throw new Error('district file missing: docs/areas/deep/districts/' + k + '.js'); });
const CTX = {};
Object.keys(DISTRICTS).forEach(k => { const rnd = mkRnd(7919 * k.charCodeAt(0));
    CTX[k] = { d: k, C, N, GX, GZ, W, H, HX, HZ, LEVEL, SEA_Y, gx, gz, cx, cz, r2, PLAN, plot, cell, lv, inb, distAt, setSq, setRect, hSq, feat, props, npc, taken, look, sheet, MB, RU, RK,
        P, dec: decWith(rnd), swim, native, scatter, rnd, sayOf, O_ABYSS, O_TEMPLE,
        squares: id => { const p = plot[id], o = []; for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) o.push([p.x * N + x, p.y * N + y]); return o; },
        sq: (id, lx, ly) => [plot[id].x * N + lx, plot[id].y * N + ly] }; });
const run = stage => Object.keys(DISTRICTS).forEach(k => { const m = DISTRICTS[k]; if (typeof m[stage] === 'function') { curD = k; try { m[stage](CTX[k]); } finally { curD = null; } } });

run('plan');       // what a district changes on the square map (its own plots only)

/* ── THE WAYS (the tool's: a district file never moves one). Squares from the layout's `ways`. ── */
const WAY = {}; PLAN.ways.forEach(w => { WAY[w.id] = w; });
const at = w => ({ x: cx(w.sx), z: cz(w.sy) });
const UPW = Object.assign(at(WAY.upwelling), { face: 180 });        // link `bermuda_abyss`, the Upwelling under the Triangle's Maelstrom
const HATCH = Object.assign(at(WAY.wreck), { face: 90 });           // link `revenge_atlantis`, the hatch in the wreck's hull
const VAULT = { x: gx(42), z: r2(gz(24) + 0.6), face: 180 };        // the vault door in the temple's front, on the Agora
const STAIR = Object.assign(at(WAY.drownedstair), { face: 0 });     // the drowned stair's foot, in the canal behind the temple
const SPAWN = { x: gx(42), z: cz(WAY.spawn.sy), face: 0 };
[WAY.upwelling, WAY.wreck, WAY.drownedstair].forEach(w => taken.add(w.sx + ':' + w.sy));
['41:24', '42:24', '41:25', '42:25', '41:27', '42:27'].forEach(k => taken.add(k));
{ const o = O_ABYSS.d.find(d => d.id === 'temple') || {}, s = O_ABYSS.d.find(d => d.id === 'drownedstair') || {};
  doors.push({ id: 'temple', wall: 'free', x: VAULT.x, z: VAULT.z, face: VAULT.face, leaf: 'leaf_vault', wide: true, label: 'ATLANTIS · THE TEMPLE OF THE DEEP', sub: 'THE VAULT DOOR · INTO THE AIR POCKET',
      action: { room: INSIDE, at: 'deep' }, desc: o.desc || '' });
  doors.push({ id: 'drownedstair', wall: 'free', x: STAIR.x, z: STAIR.z, face: STAIR.face, secret: true, leaf: null, label: 'A DRAUGHT', sub: 'THE DROWNED STAIR · UP INTO THE TEMPLE',
      action: { room: INSIDE, at: 'drownedstair' }, desc: s.desc || '', draft: true }); }

run('build');      // terrain rows and drawn pieces
run('dress');      // props and animals
run('people');
if (strays.length) console.log('pieces a district put on another district\'s squares (ask that district\'s thread):\n  ' + strays.slice(0, 40).join('\n  '));
if (errs.length) throw new Error('misplaced:\n  ' + errs.join('\n  '));

/* ── THE HEIGHTS ── */
const SOFT = 'skdv', group = ch => SOFT.includes(ch) ? 's' : ch === 'm' ? 'm' : ch === 'x' ? 'x' : ch === 'r' ? 'r' : null;
const hc = new Float32Array(W * H);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const ch = cell[y][x]; if (!PLAN.legend[ch]) throw new Error('a square nobody knows: ' + ch + ' at ' + x + ',' + y); hc[y * W + x] = lv[y][x] * LEVEL; }
function corner(qx, qy, g) { let s = 0, n = 0; for (const [dx, dy] of [[-1, -1], [0, -1], [-1, 0], [0, 0]]) { const X = qx + dx, Y = qy + dy; if (inb(X, Y) && group(cell[Y][X]) === g) { s += hc[Y * W + X]; n++; } } return s / n; }
const cornerH = (x, y, qx, qy) => { const g = group(cell[y][x]); return g ? corner(x + qx, y + qy, g) : hc[y * W + x]; };
const slope = Buffer.alloc(W * H * 8);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const o = (y * W + x) * 8; [[0, 0], [1, 0], [0, 1], [1, 1]].forEach((q, k) => slope.writeInt16LE(Math.round(cornerH(x, y, q[0], q[1]) * 100), o + k * 2)); }
/* ── THE PAINT: one sheet a square (0 = the room's own sand) ── */
const PAL = [MB, 'cobblestone', 'rocks_1', RK, RU, 'dirt_2', 'urban:MetalCorrugated1a'];
const PAINT = { s: 0, m: 1, t: 2, c: 3, w: 1, B: 1, k: 6, r: 4, x: 4, d: 3, v: 4, f: 7 };
const paint = new Uint8Array(W * H);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) paint[y * W + x] = PAINT[cell[y][x]];

/* ── checks: every prop key and unit exists; a blocker never stands on a way's square (the taken set) ── */
const CAT = vm.runInContext('DOOR_HQ.catalogue', D), RACES = vm.runInContext('AVAILABLE_RACES', D);
props.forEach(p => { if (!CAT[p.key]) throw new Error('not in the catalogue: ' + p.key); if (Math.abs(p.x) > HX || Math.abs(p.z) > HZ) throw new Error(p.key + ' stands outside the room'); });
npc.forEach(n => { if (RACES.indexOf(n.race) < 0) throw new Error('not a unit: ' + n.race); });
F.forEach(f => { if (f.k === 'scatter' && !CAT[f.key]) throw new Error('scatter, not in the catalogue: ' + f.key); });
const lights = props.filter(p => CAT[p.key].light).length;
Object.assign(count, { features: F.length + ARCH.length, parts: ARCH.reduce((s, a) => s + a.parts.length, 0), props: props.length, lit: lights, doors: doors.length, natives: npc.length });
if (process.env.DEEP_DUMP) console.log(cell.map(r => r.join('')).join('\n'));

/* THE AIR BY DISTRICT (three-renderer.js _hqBuildAtmos `shell.atmos.zones`): a file's airZones(ctx) = [{ sx0, sy0, sx1, sy1, kind, color, n, ... }] */
const AIR = [].concat(...Object.keys(DISTRICTS).filter(k => typeof DISTRICTS[k].airZones === 'function').map(k => (DISTRICTS[k].airZones(CTX[k]) || []).map(z => { const q = Object.assign({}, z, { x0: gx(z.sx0), z0: gz(z.sy0), x1: gx(z.sx1), z1: gz(z.sy1) });
    delete q.sx0; delete q.sy0; delete q.sx1; delete q.sy1; return q; })));
const ATMOS = AIR.length ? " atmos: " + J({ kind: 'none', zones: AIR }) + "," : "";

/* ── THE INSIDE: the Temple of the Deep's dry room (district C's file writes what stands in it) ── */
const IN = { n: 18, half: 31.5, F: [], ARCH: [], props: [], npc: [], doors: [], shafts: [] };
{ const g = c => r2(-IN.half + c * C), m = c => r2(-IN.half + (c + 0.5) * C), k = 'C';
  const ictx = Object.assign({}, CTX[k], { n: IN.n, half: IN.half, g, m, feat: o => { IN.F.push(o); return o; },
      P: (key, sx, sy, o) => { const r = Object.assign({ key, x: m(sx), z: m(sy) }, o || {}); IN.props.push(r); return r; },
      put: (key, x, z, o) => { const r = Object.assign({ key, x: r2(x), z: r2(z) }, o || {}); IN.props.push(r); return r; },
      native: (race, sx, sy, face, say) => { const n = { x: m(sx), z: m(sy), face: face || 0, race }; if (say) n.say = say; IN.npc.push(n); },
      look: (id, x, z, rot, fn, y) => { const a = sheet(); fn(a); const row = { k: 'arch', id: 'pocket:' + id + ':look', x: r2(x), z: r2(z), rot: rot || 0, parts: a.P }; if (y != null) row.y = r2(y); IN.ARCH.push(row); },
      shaft: o => IN.shafts.push(o) });
  if (typeof DISTRICTS.C.inside !== 'function') throw new Error('district C must export inside(ctx): the Temple of the Deep\'s dry room');
  DISTRICTS.C.inside(ictx);
  IN.props.forEach(p => { if (!CAT[p.key]) throw new Error('inside, not in the catalogue: ' + p.key); }); IN.npc.forEach(n => { if (RACES.indexOf(n.race) < 0) throw new Error('not a unit: ' + n.race); });
  const o = O_TEMPLE.d.find(d => d.id === 'abyss') || {}, s = O_TEMPLE.d.find(d => d.id === 'drownedstair') || {};
  IN.doors.push({ id: 'deep', wall: 's', x: 0, leaf: 'leaf_vault', wide: true, label: 'ATLANTIS · THE AGORA', sub: 'THE VAULT DOOR · OUT INTO THE SEA', action: { room: ROOM, at: 'temple' }, desc: o.desc || '' });
  IN.doors.push({ id: 'drownedstair', wall: 'w', z: 0, secret: true, leaf: null, label: 'A DRAUGHT', sub: 'THE DROWNED STAIR · DOWN INTO THE SEA', action: { room: ROOM, at: 'drownedstair' }, desc: s.desc || '', draft: true });
  Object.assign(count, { insideFeatures: IN.F.length + IN.ARCH.length, insideProps: IN.props.length }); }

/* ── the rooms ── */
const L = [];
L.push("        /* DEEP40-BEGIN — THE DEEP ON PLOTS (2026-11-16): written by `node bake-deep.js` from docs/areas/deep/layout.json + docs/areas/deep/districts/*.js. Never hand-edit between the markers; edit the tool, the layout or a district file and rerun. */");
L.push("        " + ROOM + ": {");
L.push("            label: 'THE DEEP',");
L.push("            sub: 'ATLANTIS · THE SEA FLOOR · THE TRENCH · 40 PLOTS',");
L.push("            kind: 'box', site: 'prebuilt_atlantis', part: 'deep',");
L.push("            shell: hqAbyssShell({ w: " + (2 * HX) + ", d: " + (2 * HZ) + ", h: " + (SEA_Y + 2) + ", wallH: " + (SEA_Y + 2) + ", plate: { x: " + SPAWN.x + ", z: " + SPAWN.z + ", y: " + r2(hSq(42, 27) + 6) + " }," + ATMOS + " }),");
L.push("            parti: 'A ring city under the sea: an island with the Agora and the Temple of the Deep, two canals, two rings and a wall with four gates; the sea floor round it; east of it the floor falls into the Trench.',");
L.push("            typology: 'grid',");
L.push("            plots: { cell: " + C + ", plot: " + PL + ", n: " + GX + ", nx: " + GX + ", nz: " + GZ + ", names: " + J(PLAN.plots.map(p => [p.id, p.name, p.d, p.level])) + " },");
L.push("            terrain: {");
L.push("                res: 1.75, floor: 'desert', cliff: '" + RK + "', path: '" + MB + "',");
L.push("                base: 0, noise: { amp: 0.25, scale: 9 }, crag: false,");
L.push("                sea: { y: " + SEA_Y + ", key: 'deep_water', under: true },   // DROWNED: the surface over the roof, the walker swims everywhere");
L.push("                outer: { m: 60 },");
L.push("                /* THE HEIGHTS ARE THE MAP: the rings, the canals, the wall, the trench's drops are all this grid */");
L.push("                slope: { cells: { res: " + C + ", x0: " + gx(0) + ", z0: " + gz(0) + ", nx: " + W + ", nz: " + H + ", d: '" + slope.toString('base64') + "' } },");
L.push("                paint: { pal: " + J(PAL) + ", t: 'u8', res: " + C + ", x0: " + cx(0) + ", z0: " + cz(0) + ", nx: " + W + ", nz: " + H + ", d: '" + Buffer.from(paint).toString('base64') + "' },");
L.push("                features: [");
F.concat(ARCH).forEach(f => L.push("                    " + J(f) + ","));
L.push("                ],");
L.push("            },");
L.push("            doors: [");
doors.forEach(d => L.push("                " + J(d) + ","));
L.push("            ],");
L.push("            counters: [],");
L.push("            props: [");
for (let i = 0; i < props.length; i += 4) L.push("                " + props.slice(i, i + 4).map(J).join(", ") + ",");
L.push("            ],");
L.push("            agents: [],");
L.push("            npcSpots: " + J(npc) + ",");
L.push("            onlineSpots: [],");
L.push("            lines: " + J(O_ABYSS.l) + ",");
L.push("            spawn: " + J(SPAWN) + ",");
L.push("        },");
L.push("        " + INSIDE + ": {");
L.push("            label: 'ATLANTIS · THE TEMPLE OF THE DEEP',");
L.push("            sub: 'THE AIR POCKET · THE DAIS · THE ORACLE',");
L.push("            kind: 'box', site: 'prebuilt_atlantis', part: 'pocket',");
L.push("            shell: { w: " + (2 * IN.half) + ", d: " + (2 * IN.half) + ", h: 14, wallH: 14, dadoH: 1.4, open: false,");
L.push("                     floor: 'marble_light', wall: 'marble_light', dado: 'ruins', trim: 'gold', ceiling: 'marble_light', ceilTile: 1.75,");
L.push("                     floorColor: 0xb8c8c8, wallColor: 0x9ab0b4, dadoColor: 0x7a9098, ceilColor: 0x6a8890,");
L.push("                     pipes: false, strips: false, lights: [],");
L.push("                     mood: { lamp: 0x7fe0ea, glow: 0x9ff0ff, strip: 0xdff8ff, light: 0xbfe8f0, ambient: 0.42 },");
L.push("                     fog: { color: 0x0a2830, density: 0.02 },");
L.push("                     plate: { x: 0, z: " + r2(-IN.half + 0.2) + ", y: 5.2 },");
L.push("                     look: HQ_ROOM_LOOKS.temple },");
L.push("            terrain: {");
L.push("                floor: 'marble_light', cliff: 'marble_light', path: 'marble_light', noise: { amp: 0 }, crag: false, levelM: 3.5, res: 0.5,");
L.push("                features: [");
IN.F.concat(IN.ARCH).forEach(f => L.push("                    " + J(f) + ","));
L.push("                ],");
L.push("            },");
L.push("            doors: [");
IN.doors.forEach(d => L.push("                " + J(d) + ","));
L.push("            ],");
L.push("            counters: [],");
L.push("            props: [");
for (let i = 0; i < IN.props.length; i += 4) L.push("                " + IN.props.slice(i, i + 4).map(J).join(", ") + ",");
L.push("            ],");
L.push("            agents: [],");
L.push("            npcSpots: " + J(IN.npc) + ",");
L.push("            onlineSpots: [],");
L.push("            lines: " + J(O_TEMPLE.l) + ",");
L.push("            spawn: { x: " + r2(IN.half - 7) + ", z: 0, face: 270 },");
L.push("        },");
L.push("        /* DEEP40-END */");
const block = L.join('\n') + '\n';
console.log(JSON.stringify(count));
/* the rows in data.js that name a place in these rooms (written by hand there): the tool refuses to bake when one has drifted */
const WANT = [
    ["b: { site: 'prebuilt_atlantis', part: 'deep', wall: 'free', x: " + HATCH.x + ", z: " + HATCH.z + ", face: " + HATCH.face + ",", 'link revenge_atlantis (its b end)'],
    ["b: { site: 'prebuilt_atlantis', part: 'deep', wall: 'free', x: " + UPW.x + ", z: " + UPW.z + ", face: " + UPW.face + ", way: 'upwelling',", 'link bermuda_abyss (its b end)'],
    ["prebuilt_atlantis: { room: '" + INSIDE + "', door: { id: 'bay', wall: 'e', z: 0 } }", 'siteRooms.entry.prebuilt_atlantis'],
    ["deep: { label: 'THE DEEP', room: '" + ROOM + "',", 'hubs.deep'],
    ["deep: { room: '" + ROOM + "', x: " + r2(SPAWN.x + 7) + ", z: " + SPAWN.z + ", face: 270 }", 'HQ_HEAL_ZONE.rooms.deep'],
    ["site_prebuilt_atlantis_abyss: '" + ROOM + "', site_prebuilt_atlantis_temple: '" + INSIDE + "'", 'DOOR_HQ.retired'],
];
const file = path.join(REPO, 'data.js'); let src = fs.readFileSync(file, 'utf8');
const flat = src.replace(/ +/g, ' '), missing = WANT.filter(w => flat.indexOf(w[0]) < 0);
if (missing.length) { console.log('data.js rows to write by hand:'); missing.forEach(w => console.log('  ' + w[1] + ':  ' + w[0])); if (!DRY) throw new Error('data.js does not point at these rooms yet (see the rows above)'); }
if (DRY) process.exit(0);
const END = '        /* DEEP40-END */\n', b0 = src.indexOf('        /* DEEP40-BEGIN'), b1 = src.indexOf(END);
if (b0 >= 0 && b1 > b0) src = src.slice(0, b0) + block + src.slice(b1 + END.length);
else { const anchor = '        site_prebuilt_atlantis_abyss: {', a = src.indexOf(anchor); if (a < 0) throw new Error('anchor not found in data.js'); src = src.slice(0, a) + block + src.slice(a); }
/* the Temple's light shafts: the room's row in DOOR_HQ.lightShafts */
{ const m0 = '    /* DEEP40-SHAFTS-BEGIN */\n', m1 = '    /* DEEP40-SHAFTS-END */\n', row = m0 + "    " + INSIDE + ": " + J(IN.shafts) + ",\n" + m1, a0 = src.indexOf(m0), a1 = src.indexOf(m1);
  if (a0 >= 0 && a1 > a0) src = src.slice(0, a0) + row + src.slice(a1 + m1.length);
  else { const anchor = '    site_prebuilt_atlantis_temple: [   // the two west windows and the two east', a = src.indexOf(anchor); if (a < 0) throw new Error('lightShafts anchor not found'); src = src.slice(0, a) + row + src.slice(a); } }
fs.writeFileSync(file, src);
console.log('data.js: ' + ROOM + ' + ' + INSIDE + ' written (' + block.length + ' bytes)');
