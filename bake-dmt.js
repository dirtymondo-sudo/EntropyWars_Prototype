#!/usr/bin/env node
/* bake-dmt.js — THE INSIDE OF THE BLACK CUBE, the DMT realm (2026-11-27, mondo: "a DMT realm dungeon map. This would be the 'inside' of the
   black cube ... totally psychadelic ... sacred geometry and fractal patterns ... while still being possible to do grid combat like usual").
   Repo-only tooling. Writes the room `site_prebuilt_cube_dmt` into data.js between DMT-BEGIN / DMT-END (after the Astral Realm's block).
   Never hand-edit between the markers: edit THE PLAN below and rerun.

       node bake-dmt.js [--dry-run]

   THE PLAN (docs/plans/dmt-realm/PLAN.md, pass 1): no ground. Nine platforms hang inside the cube over nothing, every one whole 3.5 m
   fight squares, joined by bridges two squares wide:
       the HUB (10 x 10) in the middle, the black cube turning over it
       four GREAT platforms (8 x 8) at the ends of a cross: S the way in (level with the hub), E up one flight, W down one, N the highest
       four CORNER platforms (6 x 6) between them: with the great four they close a ring road round the hub
   What moves is the engine's: THE TRIP SHEETS (three-renderer.js `dmt_*`, drawn ten times a second) on the floor, the sides, the dressing,
   and THE INSIDE OF THE CUBE (`sky.scenery: 'trip'` + the room's `trip` row). The floor sheet draws the fight grid itself: one sheet = one
   square, its edge always lit. Solid dressing stands on whole squares with a ghost wall round it; everything else is drawn only.
   Notes: docs/notes/areas-complexes.md "THE INSIDE OF THE CUBE". */
'use strict';
const fs = require('fs'), path = require('path');
const DRY = process.argv.includes('--dry-run');
/* THE STILLS (`node bake-dmt.js --stills <out dir>`): the picture each trip sheet shows where nothing draws it (the editor's picker, the 2D board):
   the sheets' own draw code cut out of three-renderer.js and run once in a browser page. Upload them to the calm folder:
   node sync-zip.js --put <out>/dmt_floor.png Assets/world/terrain/calm/dmt_floor.png ... */
if (process.argv.includes('--stills')) { (async () => {
    const out = process.argv[process.argv.indexOf('--stills') + 1]; if (!out) throw new Error('usage: node bake-dmt.js --stills <out dir>'); fs.mkdirSync(out, { recursive: true });
    const src = fs.readFileSync(path.join(__dirname, 'three-renderer.js'), 'utf8'), i0 = src.indexOf('    function _tripH('), i1 = src.indexOf('    var _tripLive = {}');
    if (i0 < 0 || i1 < i0) throw new Error('the trip sheets are not in three-renderer.js');
    const { chromium } = require(path.join(__dirname, 'node_modules/playwright')), fast = require('./probe-fast.js');
    const browser = await fast.launch(chromium, { headless: true, executablePath: fast.EXE, args: ['--no-sandbox'] }), page = await browser.newPage();
    const pics = await page.evaluate((code) => { const S = new Function(code + '; return _TRIP_SHEETS;')(), o = {};
        Object.keys(S).forEach(k => { const c = document.createElement('canvas'); c.width = c.height = S[k][1]; S[k][0](c.getContext('2d'), S[k][1], 7, S[k][2]); o[k] = c.toDataURL('image/png'); }); return o; }, src.slice(i0, i1));
    Object.keys(pics).forEach(k => { fs.writeFileSync(path.join(out, k + '.png'), Buffer.from(pics[k].split(',')[1], 'base64')); console.log('still', k + '.png'); });
    await browser.close(); process.exit(0); })().catch(e => { console.error(e); process.exit(1); }); return; }
const C = 3.5, LEVEL = 1.75, r2 = v => Math.round(v * 100) / 100;
const J = v => JSON.stringify(v).replace(/"([a-zA-Z_][a-zA-Z0-9_]*)":/g, '$1:').replace(/'/g, "\\'").replace(/"/g, "'");
const ROOM = 'site_prebuilt_cube_dmt', SQ = 42, HALF = SQ * C / 2;   // the room: 42 x 42 squares, 147 m

/* ── THE PLAN: platforms in squares from the room's middle (x0, z0 = the west / north edge, in squares), level in 1.75 m steps ── */
const P = {
    hub: { x: -5, z: -5, w: 10, d: 10, lv: 4 },
    S: { x: -4, z: 9, w: 8, d: 8, lv: 4 }, E: { x: 9, z: -4, w: 8, d: 8, lv: 6 }, W: { x: -17, z: -4, w: 8, d: 8, lv: 2 }, N: { x: -4, z: -17, w: 8, d: 8, lv: 8 },
    NE: { x: 10, z: -16, w: 6, d: 6, lv: 7 }, SE: { x: 10, z: 10, w: 6, d: 6, lv: 5 }, SW: { x: -16, z: 10, w: 6, d: 6, lv: 3 }, NW: { x: -16, z: -16, w: 6, d: 6, lv: 5 },
};
/* a join: from platform a's side to platform b's, two squares wide on the line `at` (squares; the bridge's west / north edge). The climb is
   one flight of steps at the HIGH end, a square a level (two at least); the rest of the span is a flat bridge at the low level. */
const JOINS = [
    ['hub', 'S', 'z', -1], ['hub', 'E', 'x', -1], ['hub', 'W', 'x', -1], ['hub', 'N', 'z', -1],
    ['N', 'NE', 'x', -13], ['NE', 'E', 'z', 12], ['E', 'SE', 'z', 12], ['SE', 'S', 'x', 12],
    ['S', 'SW', 'x', 12], ['SW', 'W', 'z', -14], ['W', 'NW', 'z', -14], ['NW', 'N', 'x', -13],
];
const F = [], ARCH = [], errs = [], MOUTHS = [], HUE = {};
const sx = s => r2(s * C);   // squares -> metres
const paint = new Uint8Array(SQ * SQ), PAL = ['dmt_floor_b', 'dmt_ribbon', 'dmt_weave'];
const setP = (x, z, v) => { const i = x + SQ / 2, j = z + SQ / 2; if (i >= 0 && j >= 0 && i < SQ && j < SQ) paint[j * SQ + i] = v; };
const solidSq = new Set();   // squares a solid piece stands on

/* ── the platforms ── */
Object.keys(P).forEach(id => { const p = P[id], h = r2(p.lv * LEVEL);
    F.push({ k: 'plateau', x: sx(p.x + p.w / 2), z: sx(p.z + p.d / 2), w: sx(p.w), d: sx(p.d), h, edge: 0.15, float: true, depth: r2(Math.min(12, 3 + 0.7 * p.w)) });
    for (let z = p.z; z < p.z + p.d; z++) for (let x = p.x; x < p.x + p.w; x++) if ((x + z) & 1) setP(x, z, 1);
    HUE[id] = { hub: 0xff3df0, S: 0x3dfff0, E: 0x3da8ff, W: 0x8cff66, N: 0xc03dff, NE: 0xffd23d, SE: 0xff5a3d, SW: 0x3dff7a, NW: 0xff66d0 }[id]; });
/* THE KERB OF LIGHT (drawn; the walker's own rule stops him at a platform's edge, and the kerb is what he sees stop him): 0.4 m high round every
   platform, open at each bridge's mouth */
const GAPS = {};   // id -> side -> [[a, b]] in squares along the side
const gap = (id, side, a, b) => { ((GAPS[id] = GAPS[id] || {})[side] = GAPS[id][side] || []).push([a, b]); };
JOINS.forEach(([a, b, ax, at]) => { const A = P[a], B = P[b], aFirst = ax === 'z' ? (A.z + A.d <= B.z) : (A.x + A.w <= B.x), f = aFirst ? a : b, l = aFirst ? b : a;
    if (ax === 'z') { gap(f, 'S', at, at + 2); gap(l, 'N', at, at + 2); } else { gap(f, 'E', at, at + 2); gap(l, 'W', at, at + 2); } });
Object.keys(P).forEach(id => { const p = P[id], h = r2(p.lv * LEVEL), parts = [], cx = p.x + p.w / 2, cz = p.z + p.d / 2;
    [['N', p.x, p.x + p.w, p.z, 1], ['S', p.x, p.x + p.w, p.z + p.d, 1], ['W', p.z, p.z + p.d, p.x, 0], ['E', p.z, p.z + p.d, p.x + p.w, 0]].forEach(([side, s0, s1, line, alongX]) => {
        const gs = ((GAPS[id] || {})[side] || []).slice().sort((u, v) => u[0] - v[0]); let cur = s0; const segs = [];
        gs.forEach(([a, b]) => { if (a > cur) segs.push([cur, a]); cur = Math.max(cur, b); }); if (cur < s1) segs.push([cur, s1]);
        const inset = (side === 'N' || side === 'W') ? 0.17 : -0.17;
        segs.forEach(([a, b]) => parts.push(alongX ? { s: 'box', p: [sx((a + b) / 2 - cx), 0, r2(sx(line - cz) + inset)], size: [sx(b - a), 0.4, 0.3], tint: HUE[id], glow: 1 }
                                                   : { s: 'box', p: [r2(sx(line - cx) + inset), 0, sx((a + b) / 2 - cz)], size: [0.3, 0.4, sx(b - a)], tint: HUE[id], glow: 1 })); });
    ARCH.push({ k: 'arch', id: 'dmt:kerb:' + id, x: sx(cx), z: sx(cz), rot: 0, y: h, parts }); });

/* ── the bridges and their flights ── */
JOINS.forEach(([a, b, ax, at]) => { const A = P[a], B = P[b];
    /* the gap along the other axis */
    const along = ax === 'z' ? 'z' : 'x';
    let g0, g1;   // the gap, in squares, along the travel axis
    if (ax === 'z') { /* the bridge runs along z (north-south), its two squares x = at, at+1 */
        if (A.z + A.d <= B.z) { g0 = A.z + A.d; g1 = B.z; } else { g0 = B.z + B.d; g1 = A.z; }
    } else { if (A.x + A.w <= B.x) { g0 = A.x + A.w; g1 = B.x; } else { g0 = B.x + B.w; g1 = A.x; } }
    const len = g1 - g0; if (len < 2) { errs.push('join ' + a + '-' + b + ': no gap'); return; }
    for (let t = 0; t < 2; t++) for (const e of [g0 - 1, g0 - 2, g1, g1 + 1]) MOUTHS.push([ax === 'z' ? (at + t) + ',' + e : e + ',' + (at + t), a + '-' + b]);   // the two squares inside each mouth stay clear
    /* which end is which platform */
    const first = (ax === 'z' ? (A.z + A.d <= B.z) : (A.x + A.w <= B.x)) ? A : B, last = first === A ? B : A;
    const lo = Math.min(A.lv, B.lv), hi = Math.max(A.lv, B.lv), rise = hi - lo;
    const flight = rise ? Math.max(2, Math.ceil(rise / 2) * 2) : 0;   // squares of steps: a square a level (3.5 m along, 1.75 m up: the Astral Realm's stair)
    if (flight > len) { errs.push('join ' + a + '-' + b + ': the flight (' + flight + ') is longer than the gap (' + len + ')'); return; }
    const hiFirst = first.lv > last.lv;
    /* the flat span at the low level */
    const f0 = hiFirst ? g0 + flight : g0, f1 = hiFirst ? g1 : g1 - flight;
    const rect = (s0, s1) => ax === 'z' ? { x: sx(at + 1), z: sx((s0 + s1) / 2), w: sx(2), d: sx(s1 - s0) } : { x: sx((s0 + s1) / 2), z: sx(at + 1), w: sx(s1 - s0), d: sx(2) };
    if (f1 > f0) { const R = rect(f0, f1); F.push({ k: 'plateau', x: R.x, z: R.z, w: R.w, d: R.d, h: r2(lo * LEVEL), edge: 0.15, float: true, depth: 1.2 }); }
    if (f1 > f0) { const R = rect(f0, f1), along = ax === 'z';   // the bridge's kerbs, both sides of its flat span
        ARCH.push({ k: 'arch', id: 'dmt:kerb:' + a + '-' + b, x: R.x, z: R.z, rot: 0, y: r2(lo * LEVEL), parts: [-1, 1].map(sd => along ? { s: 'box', p: [sd * (C - 0.17), 0, 0], size: [0.3, 0.4, R.d], tint: 0xf0e0ff, glow: 1 } : { s: 'box', p: [0, 0, sd * (C - 0.17)], size: [R.w, 0.4, 0.3], tint: 0xf0e0ff, glow: 1 }) }); }
    for (let s = g0; s < g1; s++) for (let t = 0; t < 2; t++) ax === 'z' ? setP(at + t, s, 2) : setP(s, at + t, 2);
    if (flight) { const r0 = hiFirst ? g0 + flight : g1 - flight, r1 = hiFirst ? g0 : g1;   // from the low end to the high end
        F.push(ax === 'z' ? { k: 'ramp', x0: sx(at + 1), z0: sx(r0), x1: sx(at + 1), z1: sx(r1), w: sx(2), h0: r2(lo * LEVEL), h1: r2(hi * LEVEL), stairs: true, float: true }
                          : { k: 'ramp', x0: sx(r0), z0: sx(at + 1), x1: sx(r1), z1: sx(at + 1), w: sx(2), h0: r2(lo * LEVEL), h1: r2(hi * LEVEL), stairs: true, float: true }); }
});

/* ── THE DRESSING (pass 1: a first set on every platform; trip sheets only, no model files) ── */
const base = id => r2(P[id].lv * LEVEL), mid = id => [sx(P[id].x + P[id].w / 2), sx(P[id].z + P[id].d / 2)];
/* a solid piece on whole squares [x0..x1] x [z0..z1] (room squares): a ghost wall round them */
function solid(id, x0, z0, x1, z1, h) { const y = base(id), X0 = sx(x0), X1 = sx(x1 + 1), Z0 = sx(z0), Z1 = sx(z1 + 1);
    for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) solidSq.add(x + ',' + z);
    [[X0, Z0, X1, Z0], [X0, Z1, X1, Z1], [X0, Z0, X0, Z1], [X1, Z0, X1, Z1]].forEach(([a, b, c, d]) => F.push({ k: 'wall', absY: true, x0: a, z0: b, x1: c, z1: d, t: 0.3, h: h || 4, y, ghost: true, rail: false })); }
const sqMid = (x, z) => [sx(x + 0.5), sx(z + 0.5)];
let an = 0; const arch = (id, x, z, parts, rot) => ARCH.push({ k: 'arch', id: 'dmt:' + id + ':' + (an++), x: r2(x), z: r2(z), rot: rot || 0, y: base(id), parts });
/* an obelisk of the script nobody reads: one square, solid */
function obelisk(id, x, z, h, key) { const [mx, mz] = sqMid(x, z); solid(id, x, z, x, z, h);
    arch(id, mx, mz, [{ s: 'box', p: [0, 0, 0], size: [2.4, h, 2.4], key: key || 'dmt_glyph', glow: 1, uv: 2.4 }, { s: 'roof', form: 'pyramid', p: [0, h, 0], size: [2.4, 2.2, 2.4], key: 'dmt_ribbon', glow: 1, uv: 2.4 },
        { s: 'box', p: [0, 0, 0], size: [3.1, 0.35, 3.1], key: 'dmt_cubes', glow: 1, uv: 3.1 }]); }
/* THE HUB: four obelisks one square in from its corners; the middle stays open (the fight) */
[[-4, -4], [3, -4], [-4, 3], [3, 3]].forEach(([x, z]) => obelisk('hub', x, z, 11));
/* S, THE WAY IN: a gate of ribbon on the south edge, the mandala turning in it (pass 1: it leads nowhere yet, see PLAN "the way in") */
{ const [mx] = mid('S'), z = sx(16.5); solid('S', -3, 16, -3, 16, 9); solid('S', 2, 16, 2, 16, 9);
  arch('S', mx, z, [{ s: 'box', p: [-8.75, 0, 0], size: [2.6, 9, 2.2], key: 'dmt_ribbon', glow: 1, uv: 2.6 }, { s: 'box', p: [8.75, 0, 0], size: [2.6, 9, 2.2], key: 'dmt_ribbon', glow: 1, uv: 2.6 },
      { s: 'box', p: [0, 9, 0], size: [21, 1.6, 2.4], key: 'dmt_cubes', glow: 1, uv: 3.2 }, { s: 'quad', p: [0, 0.2, -0.2], size: [14.6, 8.8], key: 'dmt_tunnel', glow: 1, uv: 'fit', ds: true }]); }
/* N, THE WALL OF EYES: three slabs along the north edge (solid), a low altar before them */
{ const z0 = P.N.z; solid('N', -4, z0, 3, z0, 12);
  arch('N', 0, sx(z0 + 0.5), [{ s: 'box', p: [0, 0, 0], size: [27.6, 12, 2.4], key: 'dmt_eyes', glow: 1, uv: 6.9 }, { s: 'box', p: [0, 12, 0], size: [28, 0.8, 2.9], key: 'dmt_ribbon', glow: 1, uv: 2.9 },
      { s: 'box', p: [-10.5, 12.8, 0], size: [2.2, 5, 2.2], key: 'dmt_glyph', glow: 1, uv: 2.2 }, { s: 'box', p: [10.5, 12.8, 0], size: [2.2, 5, 2.2], key: 'dmt_glyph', glow: 1, uv: 2.2 },
      { s: 'dome', p: [0, 12.8, 0], r: 3.2, h: 3.2, key: 'dmt_eyes', glow: 1, seg: 14, rings: 5 }]);
  solid('N', -1, z0 + 3, 0, z0 + 3, 1.4);
  arch('N', 0, sx(z0 + 3.5), [{ s: 'box', p: [0, 0, 0], size: [6.4, 1.1, 2.6], key: 'dmt_weave', glow: 1, uv: 3.2 }, { s: 'box', p: [0, 1.1, 0], size: [7, 0.25, 3.1], key: 'dmt_cubes', glow: 1, uv: 3.2 }]); }
/* E, THE CUBE MATRIX: a stepped stack of cubes along the east edge (solid), three loose cubes hanging over it */
{ const x0 = P.E.x + P.E.w - 1, [, mz] = mid('E'); solid('E', x0, -4, x0, 3, 8); solid('E', x0 - 1, -2, x0 - 1, 1, 5);
  const parts = []; for (let i = 0; i < 8; i++) { const hh = [1, 2, 3, 4, 4, 3, 2, 1][i]; for (let k = 0; k < hh; k++) parts.push({ s: 'box', p: [0, k * 3.5, sx(i - 3.5)], size: [3.4, 3.4, 3.4], key: 'dmt_cubes', glow: 1, uv: 3.4 }); }
  for (let i = 0; i < 4; i++) for (let k = 0; k < [1, 2, 2, 1][i]; k++) parts.push({ s: 'box', p: [-3.5, k * 3.5, sx(i - 1.5)], size: [3.4, 3.4, 3.4], key: i & 1 ? 'dmt_glyph' : 'dmt_weave', glow: 1, uv: 3.4 });
  [[-9, 9, -7], [-14, 12, 6], [-6, 15, 2]].forEach(q => parts.push({ s: 'box', p: q, ry: 30, size: [2.2, 2.2, 2.2], key: 'dmt_cubes', glow: 1, uv: 2.2 }));
  arch('E', sx(x0 + 0.5), mz, parts); }
/* W, THE FLOWER: four tall pillars on the corners, four short ones round an open middle (the bridges' lanes stay clear), a dome on each */
{ [[-17, -4], [-10, -4], [-17, 3], [-10, 3], [-15, -2], [-12, -2], [-15, 1], [-12, 1]].forEach(([x, z], i) => { const [qx, qz] = sqMid(x, z), h = i < 4 ? 9 : 5.5;
      solid('W', x, z, x, z, h);
      arch('W', qx, qz, [{ s: 'cyl', p: [0, 0, 0], r: 0.7, h, key: 'dmt_weave', glow: 1, seg: 10 }, { s: 'dome', p: [0, h, 0], r: 1.3, h: 1.3, key: i & 1 ? 'dmt_ribbon' : 'dmt_weave', glow: 1, seg: 12, rings: 4 }, { s: 'cyl', p: [0, 0, 0], r: 1.2, h: 0.3, key: 'dmt_cubes', glow: 1, seg: 10 }]); }); }
/* the corners: NE a ribbon arch, SE three monoliths, SW a standing mandala, NW the pillar of eyes */
{ const [mx, mz] = mid('NE'); solid('NE', P.NE.x + 1, P.NE.z + 1, P.NE.x + 1, P.NE.z + 1, 7); solid('NE', P.NE.x + 4, P.NE.z + 1, P.NE.x + 4, P.NE.z + 1, 7);
  arch('NE', mx, sx(P.NE.z + 1.5), [{ s: 'cyl', p: [-5.25, 0, 0], r: 0.9, h: 7, key: 'dmt_ribbon', glow: 1, seg: 10 }, { s: 'cyl', p: [5.25, 0, 0], r: 0.9, h: 7, key: 'dmt_ribbon', glow: 1, seg: 10 },
      { s: 'archw', p: [0, 0, 0], size: [12.4, 9.5, 1.2], hole: [8.6, 4.6, 0], key: 'dmt_ribbon', glow: 1, uv: 3 }]); }
{ [[1, 1, 9], [4, 2, 6], [2, 4, 7.5]].forEach(([dx, dz, h]) => obelisk('SE', P.SE.x + dx, P.SE.z + dz, h, 'dmt_cubes')); }
{ const [mx] = mid('SW'), z = P.SW.z + 4; solid('SW', P.SW.x + 2, z, P.SW.x + 3, z, 9);
  arch('SW', mx, sx(z + 0.5), [{ s: 'box', p: [0, 0, 0], size: [6.6, 0.5, 2.6], key: 'dmt_cubes', glow: 1, uv: 3.3 }, { s: 'cyl', p: [0, 0.5, 0], r: 0.5, h: 1.2, key: 'dmt_glyph', glow: 1, seg: 8 },
      { s: 'quad', p: [0, 1.7, 0], size: [7, 7], key: 'dmt_tunnel', glow: 1, uv: 'fit', ds: true }]); }
{ const x = P.NW.x + 2, z = P.NW.z + 2; solid('NW', x, z, x + 1, z + 1, 10);
  arch('NW', sx(x + 1), sx(z + 1), [{ s: 'cyl', p: [0, 0, 0], r: 3.1, h: 10, key: 'dmt_eyes', glow: 1, seg: 16 }, { s: 'dome', p: [0, 10, 0], r: 3.4, h: 2.4, key: 'dmt_weave', glow: 1, seg: 16, rings: 5 }, { s: 'cyl', p: [0, 0, 0], r: 3.4, h: 0.4, key: 'dmt_ribbon', glow: 1, seg: 16 }]); }

/* ── THE CHECK: every platform reached from the spawn over joins; no solid on a bridge mouth ── */
{ const seen = new Set(['S']); let grew = true; while (grew) { grew = false; JOINS.forEach(([a, b]) => { if (seen.has(a) !== seen.has(b)) { seen.add(a); seen.add(b); grew = true; } }); }
  Object.keys(P).forEach(id => { if (!seen.has(id)) errs.push('platform ' + id + ' is reached by no join'); });
  MOUTHS.forEach(m => { if (solidSq.has(m[0])) errs.push('a solid piece stands in the mouth of the bridge ' + m[1] + ' at ' + m[0]); }); }
if (errs.length) { console.error('bake-dmt: ' + errs.length + ' problem(s)\n  ' + errs.join('\n  ')); process.exit(1); }

/* ── the room ── */
const hubY = base('hub'), spawn = { x: 0, z: sx(P.S.z + 5), face: 0 };
const L = [];
L.push("        /* DMT-BEGIN — THE INSIDE OF THE BLACK CUBE, the DMT realm (2026-11-27): written by `node bake-dmt.js`. Never hand-edit between the markers; edit the tool's plan and rerun. */");
L.push('        ' + ROOM + ': {');
L.push("            label: 'THE BLACK CUBE',");
L.push("            sub: 'THE INSIDE',");
L.push("            kind: 'box', site: 'prebuilt_cube', part: 'dmt',");
L.push("            shell: hqAstralShell({ w: " + SQ * C + ", d: " + SQ * C + ", h: 50.75, wallH: 50.75, floorColor: 0xffffff, " +
    "mood: { lamp: 0xff7af0, glow: 0xc060ff, strip: 0xf0d0ff, light: 0xf0e0ff, ambient: 0.7, night: 1 }, " +
    "sky: { night: 1, lock: true, tint: 0x14002a, tintAmt: 0.7, stars: 0.3, nebula: 0.6, fog: { color: 0x10001e, amount: 0.15, top: 0.06, band: 0.5, density: 0.0035 }, scenery: 'trip', density: 1, doors: false }, " +
    "plate: { x: " + spawn.x + ", z: " + spawn.z + ", y: " + r2(hubY + 3.6) + " }, look: HQ_ROOM_LOOKS.dmt, " +
    "atmos: { kind: 'motes', n: 220, color: 0xff9af0, zones: [{ kind: 'fireflies', color: 0x7afff0, n: 90, x0: -30, z0: -30, x1: 30, z1: 30 }, { x0: -73.5, z0: -73.5, x1: 73.5, z1: 73.5, kind: 'motes', n: 260, color: 0xd0a0ff }] } }),");
L.push("            parti: 'No ground: nine platforms hang inside the cube. The hub in the middle under the black cube, four great platforms at the ends of a cross, four corners between them, a ring road of bridges round it all.',");
L.push("            typology: 'grid',");
L.push("            trip: { margin: 70, high: 260, mid: 55, hubY: " + hubY + ", cubeY: 34, faces: ['dmt_eyes', 'dmt_eyes', 'dmt_tunnel', 'dmt_weave', 'dmt_cubes', 'dmt_cubes'] },   // THE INSIDE OF THE CUBE (three-renderer.js _tripBuildSky)");
L.push('            terrain: {');
L.push("                res: 0.875, floor: 'dmt_floor', cliff: 'dmt_weave', path: 'dmt_floor_b',");
L.push('                noise: { amp: 0, scale: 9 }, outer: { m: 2, keep: 0, lift: -300 },');
L.push("                void: { rock: 'dmt_cubes', glow: 0xb040ff, glowY: -26, fall: -8 },");
L.push("                paint: { pal: " + J(PAL) + ", t: 'u8', res: " + C + ", x0: " + r2(-HALF + C / 2) + ", z0: " + r2(-HALF + C / 2) + ", nx: " + SQ + ", nz: " + SQ + ", d: '" + Buffer.from(paint).toString('base64') + "' },");
L.push('                features: [');
F.concat(ARCH).forEach(f => L.push('                    ' + J(f) + ','));
L.push('                ],');
L.push('            },');
L.push('            doors: [],');
L.push('            counters: [],');
L.push('            props: [],');
L.push('            agents: [],');
L.push('            npcSpots: [],');
L.push('            onlineSpots: [],');
L.push('            lines: [],');
L.push('            spawn: ' + J(spawn) + ',');
L.push('        },');
L.push('        /* DMT-END */');
const block = L.join('\n') + '\n';
const count = { platforms: Object.keys(P).length, joins: JOINS.length, features: F.length, arch: ARCH.length, solidSquares: solidSq.size };
console.log('bake-dmt:', JSON.stringify(count));
if (DRY) { console.log(block.slice(0, 1800)); process.exit(0); }
const file = path.join(__dirname, 'data.js'); let src = fs.readFileSync(file, 'utf8');
const END = '        /* DMT-END */\n', b0 = src.indexOf('        /* DMT-BEGIN'), b1 = src.indexOf(END);
if (b0 >= 0 && b1 > b0) src = src.slice(0, b0) + block + src.slice(b1 + END.length);
else { const A = '        /* ASTRAL36-END */\n', i = src.indexOf(A); if (i < 0) throw new Error('bake-dmt: the Astral Realm\'s end marker is not in data.js'); src = src.slice(0, i + A.length) + block + src.slice(i + A.length); }
fs.writeFileSync(file, src);
console.log('bake-dmt: wrote ' + ROOM + ' (' + block.length + ' bytes)');
