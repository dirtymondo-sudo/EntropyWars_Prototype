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
    const add = (o, key, tint, x) => { if (key) o.key = key; if (tint != null) o.tint = tint; if (x) Object.assign(o, x); if (key === MB && o.glow == null) o.glow = 0.3;   /* marble under 20 m of water: lifted a little, or it reads black */ P.push(o); return o; };
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
/* a drawn piece a swimmer must not pass through: an unseen wall (metres; along x when w > d) */
const solid = (x, z, w, d, h) => feat(w >= d ? { k: 'wall', x0: r2(x - w / 2), z0: r2(z), x1: r2(x + w / 2), z1: r2(z), h, t: r2(d), key: MB, ghost: true, rail: false } : { k: 'wall', x0: r2(x), z0: r2(z - d / 2), x1: r2(x), z1: r2(z + d / 2), h, t: r2(w), key: MB, ghost: true, rail: false });
const scatter = (key, n, sx, sy, rSq, seed, o) => feat(Object.assign({ k: 'scatter', key, n, x: cx(sx), z: cz(sy), r: r2(rSq * C), seed, sea: true }, o || {}));

/* ── THE DISTRICT FILES ── */
const mkRnd = s => { let v = s >>> 0; return () => { v = (v * 1664525 + 1013904223) >>> 0; return v / 4294967296; }; };
const DISTRICTS = (() => { const dir = path.join(REPO, 'docs/areas/deep/districts'), o = {}; fs.readdirSync(dir).filter(f => /^[A-Z]\.js$/.test(f)).sort().forEach(f => { o[f[0]] = require(path.join(dir, f)); }); return o; })();
Object.keys(PLAN.districts).forEach(k => { if (!DISTRICTS[k]) throw new Error('district file missing: docs/areas/deep/districts/' + k + '.js'); });
const CTX = {};
Object.keys(DISTRICTS).forEach(k => { const rnd = mkRnd(7919 * k.charCodeAt(0));
    CTX[k] = { d: k, C, N, GX, GZ, W, H, HX, HZ, LEVEL, SEA_Y, gx, gz, cx, cz, r2, PLAN, plot, cell, lv, inb, distAt, setSq, setRect, hSq, feat, props, npc, taken, look, sheet, MB, RU, RK,
        P, dec: decWith(rnd), swim, native, scatter, solid, rnd, sayOf, O_ABYSS, O_TEMPLE,
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

/* ══ THE ONE WORLD MOVE (2026-11-17, mondo's approved map v13; docs/plans/one-world/BUILD_PLAN.md phase 3 wave B, the Deep row: "Atlantis under the
   Triangle, the Sea Floor off the Harbour, the Trench towards the rim, joined by the sub"). The home 8 x 5 room above is no room of its own any more:
   its plots stand at their v13 places (docs/plans/one-world/plots.json `under.districts` deepA deepS deepT) with everything on them (ow-move.js), no
   district file edited. TWO rooms (mondo 11-17: "Connected/bigger rooms is better. If the room is smaller than disaster city ... just make it one room"):
     ATLANTIS + THE TRENCH   the old id `site_prebuilt_atlantis_deep` (part `deep`, so the vault door, the drowned stair, the bay and the heal zone keep
                their room), 8 x 16 plots at 35..42 x 1..16 (smaller than Disaster City): C + R, the ring city whole, 5 x 5 at 35..39 x 1..5 (plots.json's
                sheet rect is 5 x 4 = 20 cells for 21 plots: the ring needs its fifth row; its four corner cells are no plots, the plan's ring and sea
                floor stay on them); T, the Trench as it lay, 2 x 5 at 41..42 x 12..16; every other cell of the box is THE OPEN FLOOR (sand, rocks,
                weed, no plot) you swim over from the city to the Trench.
     THE SEA FLOOR  `site_prebuilt_atlantis_ow_floor` (part `ow_floor`): S, 3 x 3 at 18..20 x 5..7 (17 plots west: one box would be 25 x 16, bigger
                than the city). plots.json lays its plots loose: this tool's order (SEA_PLACE), the old west column kept touching end to end, the
                Wreck on the Dutchman's Hold's plot 19,5, the Station under the Kelp Forest as it was. The city's ring that crossed its four corner
                plots is sea floor here.
   THE SUB (plots.json `under.rides`, no plots): a door pair at the Station's bathyscaphe <> the Harbour.
   Notes: docs/notes/areas-complexes.md "ONE WORLD, THE DEEP RE-LAID". ══ */
const ROOM_FLOOR = 'site_prebuilt_atlantis_ow_floor';
const OWPLOTS = JSON.parse(fs.readFileSync(path.join(REPO, 'docs/plans/one-world/plots.json'), 'utf8'));
const owD = id => (OWPLOTS.under.districts || []).find(d => d.id === id) || (() => { throw new Error('plots.json: no ' + id); })();
const RING = 'wtcmB';
const SEA_PLACE = { 'P00-00': [0, 0], 'P00-01': [1, 0], 'P00-02': [2, 0], 'P00-03': [2, 1], 'P00-04': [2, 2], 'P01-00': [0, 1], 'P05-00': [1, 1], 'P05-04': [0, 2], 'P01-04': [1, 2] };
const ROOMS = [
    { room: ROOM, part: 'deep', ow: [owD('deepA'), owD('deepT')], label: 'THE DEEP · ATLANTIS + THE TRENCH', sub: 'THE CITADEL · THE RINGS · THE OPEN FLOOR · THE TRENCH · 31 PLOTS',
      parti: 'A ring city under the sea: an island with the Agora and the Temple of the Deep, two canals, two rings and a wall with four gates; south-east of it the open floor runs to the Trench, which falls towards the rim in two drops.',
      place: p => { if (p.d === 'C' || p.d === 'R') return { wx: owD('deepA').x + p.x - 1, wy: owD('deepA').y + p.y };
          if (p.d !== 'T') return null; const q = owD('deepT').plots.find(o => o.was === p.id); if (!q) throw new Error('plots.json deepT: no ' + p.id); return { wx: q.x, wy: q.y }; } },
    { room: ROOM_FLOOR, part: 'ow_floor', ow: [owD('deepS')], label: 'THE DEEP · THE SEA FLOOR', sub: 'THE KELP FOREST · THE WRECK · THE UPWELLING · THE STATION',
      parti: 'The open floor off the Harbour under the Triangle: the kelp forest, the Dutchman\'s wreck, the Upwelling\'s jelly bloom, the reef, the Station and its bathyscaphe.',
      place: p => p.d === 'S' ? { wx: owD('deepS').x + SEA_PLACE[p.id][0], wy: owD('deepS').y + SEA_PLACE[p.id][1] } : null },
];
/* the plan's own squares, before any district's plan hook (the ring for Atlantis' empty corners) */
const cell0 = PLAN.cells.map(r => r.split('')), lv0 = PLAN.levels.map(r => r.split('').map(ch => B36.indexOf(ch)));
const MPLOTS = PLAN.plots.map(p => ({ id: p.id, x: p.x, y: p.y, name: p.name, district: p.d, level: p.level }));
const MOVE = require('./ow-move.js')({ cols: GX, rows: GZ, cell, fill: 's', plots: MPLOTS, features: F.concat(ARCH), props, npc, doors });
const MOVEL = require('./ow-move.js')({ cols: GX, rows: GZ, cell: lv, fill: PLAN.seaFloorLevel || 8, plots: MPLOTS, features: [], props: [], npc: [], doors: [] });
/* a free square near a plot's local square (home squares), for the sub's doors */
function freeNear(id, lx, ly) { const p = plot[id];
    for (let r = 0; r < 6; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        const X = lx + dx, Y = ly + dy; if (X < 1 || Y < 1 || X > N - 2 || Y > N - 2) continue; const sx = p.x * N + X, sy = p.y * N + Y;
        if (!taken.has(sx + ':' + sy) && 'sdkmt'.includes(cell[sy][sx])) { taken.add(sx + ':' + sy); return [sx, sy]; } }
    throw new Error('no free square near ' + id); }
const SUB = [
    { id: 'deep_sub_floor', a: { id: 'P01-00', at: freeNear('P01-00', 9, 5) }, b: { id: 'P05-03', at: freeNear('P05-03', 3, 6) },
      subA: 'THE SUB · OVER THE FLOOR TO ATLANTIS', subB: 'THE SUB · OUT TO THE SEA FLOOR AND THE STATION' },
];
const roomOfPlot = id => ROOMS.find(R => R.M.ofHome[id]);
ROOMS.forEach(R => {
    const list = []; PLAN.plots.forEach(p => { const q = R.place(p); if (q) list.push(Object.assign({ id: p.id }, q)); });
    { const want = R.ow.reduce((t, d) => t + d.count, 0); if (list.length !== want) throw new Error(R.room + ': ' + list.length + ' plots, plots.json says ' + want); }
    R.M = MOVE.room(list); R.ML = MOVEL.room(list);
});
/* Atlantis' four corners: the plan's ring where it crossed them, sea floor round it (no district's pieces: they went with their plots) */
{ const R = ROOMS[0], M = R.M; for (let r = 0; r < M.rows; r++) for (let c = 0; c < M.cols; c++) { if (M.at[c + ',' + r]) continue;
    const city = c < 5 && r < 5, hx = c + 1, hy = r;   // a corner of the city's square: the home plot that stood there (the city's frame is moved whole, one column east)
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const ch = city ? cell0[hy * N + y][hx * N + x] : 's', ring = city && RING.includes(ch);
        M.cell[r * N + y][c * N + x] = ring ? ch : 's'; R.ML.cell[r * N + y][c * N + x] = ring ? lv0[hy * N + y][hx * N + x] : (PLAN.seaFloorLevel || 8); } }
  /* THE OPEN FLOOR between the city and the Trench (no plots: the sea floor you swim over, mondo 11-17 "connected/bigger rooms is better"): rocks and weed */
  let k = 0; for (let r = 0; r < M.rows; r++) for (let c = 0; c < M.cols; c++) { if (M.at[c + ',' + r] || (c < 5 && r < 5)) continue; k++;
      R.OPEN = R.OPEN || []; const x = r2(-M.HX + (c + 0.5) * PL), z = r2(-M.HZ + (r + 0.5) * PL);
      R.OPEN.push({ k: 'scatter', key: ['ocean_rock', 'ocean_rock_2', 'ocean_rock_3', 'ocean_rock_4'][k % 4], n: 3, x, z, r: 18, seed: 900 + k, sea: true },
                  { k: 'scatter', key: k % 2 ? 'ocean_seaweed_2' : 'ocean_seaweed', n: 6, x, z, r: 18, seed: 950 + k, sea: true }); } }
/* the Sea Floor's four corner plots: the city's ring that crossed them is sea floor at the plot's own level */
{ const R = ROOMS[1], M = R.M; ['P01-00', 'P05-00', 'P01-04', 'P05-04'].forEach(id => { const e = M.ofHome[id];
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const sy = e.row * N + y, sx = e.col * N + x; if (RING.includes(M.cell[sy][sx])) { M.cell[sy][sx] = 's'; R.ML.cell[sy][sx] = plot[id].level; } } }); }
/* the heights + the paint of a room's squares (the home room's rule above) */
function shape(cl, lvl, w, h) {
    const ib = (x, y) => x >= 0 && y >= 0 && x < w && y < h, hcR = new Float32Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { if (!PLAN.legend[cl[y][x]]) throw new Error('a square nobody knows: ' + cl[y][x]); hcR[y * w + x] = lvl[y][x] * LEVEL; }
    const cor = (qx, qy, g) => { let s = 0, n = 0; for (const [dx, dy] of [[-1, -1], [0, -1], [-1, 0], [0, 0]]) { const X = qx + dx, Y = qy + dy; if (ib(X, Y) && group(cl[Y][X]) === g) { s += hcR[Y * w + X]; n++; } } return s / n; };
    const cH = (x, y, qx, qy) => { const g = group(cl[y][x]); return g ? cor(x + qx, y + qy, g) : hcR[y * w + x]; };
    const sl = Buffer.alloc(w * h * 8), pa = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const o = (y * w + x) * 8; [[0, 0], [1, 0], [0, 1], [1, 1]].forEach((q, k) => sl.writeInt16LE(Math.round(cH(x, y, q[0], q[1]) * 100), o + k * 2)); pa[y * w + x] = PAINT[cl[y][x]]; }
    return { slope: sl, paint: pa, hc: hcR };
}
const homeSq = (sx, sy) => ({ x: cx(sx), z: cz(sy) });
const toR = (R, p) => { const q = R.M.toRoom(p.x, p.z); if (!q) throw new Error(R.room + ': a point off its plots ' + p.x + ',' + p.z); return { x: q[0], z: q[1] }; };
/* the ways out, by their plots */
const WAYR = {};
[['upwelling', UPW], ['wreck', HATCH], ['spawn', SPAWN]].forEach(([k, w]) => { const hp = MOVE.homePlot(w.x, w.z), R = roomOfPlot(hp.id); WAYR[k] = Object.assign({ R }, toR(R, w), { face: w.face }); });
/* the sub's doors */
const EXTRA = {}; ROOMS.forEach(R => { EXTRA[R.room] = []; });
SUB.forEach(S => { const RA = roomOfPlot(S.a.id), RB = roomOfPlot(S.b.id); if (RA === RB) throw new Error(S.id + ': both ends in one room');
    const pa = toR(RA, homeSq(S.a.at[0], S.a.at[1])), pb = toR(RB, homeSq(S.b.at[0], S.b.at[1]));
    EXTRA[RA.room].push({ id: S.id, wall: 'free', x: pa.x, z: pa.z, face: 0, leaf: 'leaf_bulkhead', wide: true, label: RB.label, sub: S.subA, action: { room: RB.room, at: S.id }, desc: 'The sub runs between the stations of the Deep. Nobody drives it. It goes anyway.' });
    EXTRA[RB.room].push({ id: S.id, wall: 'free', x: pb.x, z: pb.z, face: 0, leaf: 'leaf_bulkhead', wide: true, label: RA.label, sub: S.subB, action: { room: RA.room, at: S.id }, desc: 'The sub runs between the stations of the Deep. Nobody drives it. It goes anyway.' }); });
/* the air by district: a zone moves with the plot under its middle (C's zones stand inside the city, which moved whole) */
const airOf = R => AIR.map(z => { const mx = (z.x0 + z.x1) / 2, mz = (z.z0 + z.z1) / 2, e = R.M.mapOf(mx, mz); if (!e) return null;
    return Object.assign({}, z, { x0: r2(z.x0 + e.dx), z0: r2(z.z0 + e.dz), x1: r2(z.x1 + e.dx), z1: r2(z.z1 + e.dz) }); }).filter(Boolean);

/* ── the rooms ── */
const L = [], TOTAL = { props: 0, natives: 0 }, WORLDROWS = {};
L.push("        /* DEEP40-BEGIN — THE DEEP ON PLOTS (2026-11-16) + THE ONE WORLD MOVE (2026-11-17: three rooms at their One World places, under the sea, joined by the sub): written by `node bake-deep.js` from docs/areas/deep/layout.json + docs/areas/deep/districts/*.js + docs/plans/one-world/plots.json. Never hand-edit between the markers; edit the tool, the layout or a district file and rerun. */");
ROOMS.forEach((R, ri) => {
    const M = R.M, S = shape(M.cell, R.ML.cell, M.W, M.D), hX = M.HX, hZ = M.HZ, gxR = c => r2(-hX + c * C), gzR = c => r2(-hZ + c * C), cxR = c => r2(-hX + (c + 0.5) * C), czR = c => r2(-hZ + (c + 0.5) * C);
    const roomDoors = M.doors.map(d => { const o = Object.assign({}, d); delete o.plot; delete o.side; return o; }).concat(EXTRA[R.room]);
    const sp = ri === 0 ? WAYR.spawn : EXTRA[R.room][0], SP = { x: sp.x, z: sp.z, face: ri === 0 ? SPAWN.face : 0 };
    const spSq = [Math.floor((SP.x + hX) / C), Math.floor((SP.z + hZ) / C)], plateY = r2(S.hc[spSq[1] * M.W + spSq[0]] + 6);
    M.props.forEach(p => { if (Math.abs(p.x) > hX || Math.abs(p.z) > hZ) throw new Error(R.room + ': ' + p.key + ' stands outside the room'); });
    const air = airOf(R), atm = air.length ? " atmos: " + J({ kind: 'none', zones: air }) + "," : "";
    TOTAL.props += M.props.length; TOTAL.natives += M.npc.length;
    WORLDROWS[R.room] = [M.wx, M.wy];
    console.log(R.room + ' ' + JSON.stringify({ world: [M.wx, M.wy], box: [M.cols, M.rows], mask: M.mask.join('/'), features: M.features.length, props: M.props.length, natives: M.npc.length, doors: roomDoors.length }));
    if (M.strays.length) console.log('  STRAYS (a piece across two plots that no longer stand the same way):\n    ' + M.strays.join('\n    '));
    L.push("        " + R.room + ": {");
    L.push("            label: '" + R.label + "',");
    L.push("            sub: '" + R.sub + "',");
    L.push("            kind: 'box', site: 'prebuilt_atlantis', part: '" + R.part + "',");
    L.push("            /* THE ONE WORLD: where this room stands on the world's plot grid (data.js hqOwIndex): under the sea */");
    L.push("            world: { hub: 'deep', layer: 'under', wx: " + M.wx + ", wy: " + M.wy + " },");
    L.push("            shell: hqAbyssShell({ w: " + (2 * hX) + ", d: " + (2 * hZ) + ", h: " + (SEA_Y + 2) + ", wallH: " + (SEA_Y + 2) + ", plate: { x: " + SP.x + ", z: " + SP.z + ", y: " + plateY + " }," + atm + " }),");
    L.push("            parti: '" + R.parti.replace(/'/g, "\\'") + "',");
    L.push("            typology: 'grid',");
    L.push("            plots: { cell: " + C + ", plot: " + PL + ", n: " + M.cols + ", nx: " + M.cols + ", nz: " + M.rows + (M.mask.some(s => s.includes('.')) ? ", mask: " + J(M.mask) : "") + ", names: " + J(M.order.map(e => [M.pid(e), plot[e.id].name, plot[e.id].d, plot[e.id].level])) + " },");
    L.push("            terrain: {");
    L.push("                res: 1.75, floor: 'desert', cliff: '" + RK + "', path: '" + MB + "',");
    L.push("                base: 0, noise: { amp: 0.25, scale: 9 }, crag: false,");
    L.push("                sea: { y: " + SEA_Y + ", key: 'deep_water', under: true },   // DROWNED: the surface over the roof, the walker swims everywhere");
    L.push("                outer: { m: 60 },");
    L.push("                /* THE HEIGHTS ARE THE MAP: the rings, the canals, the wall, the trench's drops are all this grid */");
    L.push("                slope: { cells: { res: " + C + ", x0: " + gxR(0) + ", z0: " + gzR(0) + ", nx: " + M.W + ", nz: " + M.D + ", d: '" + S.slope.toString('base64') + "' } },");
    L.push("                paint: { pal: " + J(PAL) + ", t: 'u8', res: " + C + ", x0: " + cxR(0) + ", z0: " + czR(0) + ", nx: " + M.W + ", nz: " + M.D + ", d: '" + Buffer.from(S.paint).toString('base64') + "' },");
    L.push("                features: [");
    M.features.concat(R.OPEN || []).forEach(f => L.push("                    " + J(f) + ","));
    L.push("                ],");
    L.push("            },");
    L.push("            doors: [");
    roomDoors.forEach(d => L.push("                " + J(d) + ","));
    L.push("            ],");
    L.push("            counters: [],");
    L.push("            props: [");
    for (let i = 0; i < M.props.length; i += 4) L.push("                " + M.props.slice(i, i + 4).map(J).join(", ") + ",");
    L.push("            ],");
    L.push("            agents: [],");
    L.push("            npcSpots: " + J(M.npc) + ",");
    L.push("            onlineSpots: [],");
    L.push("            lines: " + J(O_ABYSS.l) + ",");
    L.push("            spawn: " + J(SP) + ",");
    L.push("        },");
});
if (TOTAL.props !== props.length || TOTAL.natives !== npc.length) throw new Error('the move lost pieces: props ' + props.length + ' -> ' + TOTAL.props + ', natives ' + npc.length + ' -> ' + TOTAL.natives);
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
const SPIRE = toR(ROOMS[1], { x: 70, z: -91 });   // the tape's find spot on top of the Spire (home x 70, z -91)
const WANT = [
    ["b: { site: 'prebuilt_atlantis', part: '" + WAYR.wreck.R.part + "', wall: 'free', x: " + WAYR.wreck.x + ", z: " + WAYR.wreck.z + ", face: " + HATCH.face + ",", 'link revenge_atlantis (its b end)'],
    ["b: { site: 'prebuilt_atlantis', part: '" + WAYR.upwelling.R.part + "', wall: 'free', x: " + WAYR.upwelling.x + ", z: " + WAYR.upwelling.z + ", face: " + UPW.face + ", way: 'upwelling',", 'link bermuda_abyss (its b end)'],
    ["prebuilt_atlantis: { room: '" + INSIDE + "', door: { id: 'bay', wall: 'e', z: 0 } }", 'siteRooms.entry.prebuilt_atlantis'],
    ["deep: { label: 'THE DEEP', room: '" + ROOM + "', rooms: ['" + ROOM + "', '" + ROOM_FLOOR + "', '" + INSIDE + "'],", 'hubs.deep'],
    ["deep: { room: '" + ROOM + "', x: " + r2(WAYR.spawn.x + 7) + ", z: " + WAYR.spawn.z + ", face: 270 }", 'HQ_HEAL_ZONE.rooms.deep'],
    ["site_prebuilt_atlantis_abyss: '" + ROOM + "', site_prebuilt_atlantis_temple: '" + INSIDE + "'", 'DOOR_HQ.retired'],
    [ROOM_FLOOR + ": { tape: { x: " + SPIRE.x + ", z: " + SPIRE.z + " } }", 'the find spot on the Spire'],
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
