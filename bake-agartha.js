#!/usr/bin/env node
/* bake-agartha.js — AGARTHA IN THE UNDERGROUND LABYRINTH (2026-11-20, WORLD POLISH thread 9, the Agartha build; repo-only tooling).
   mondo 11-20: "we need victory road. labyrinth, height diffs, cliffs, drops waterfalls, underground horror like the descent movie"; the
   whole underground is one labyrinth, 6 plots deep, no single climb over 16 levels, every climb two-way; "No real underground waterfall
   for now". Agartha is A CITY IN A CAVE: real architecture you walk into, lit by its crystals, the dark maze round it.

       node bake-agartha.js            writes the room into data.js between AGARTHA-UG-BEGIN / AGARTHA-UG-END
       node bake-agartha.js --dry-run  prints the counts and the heights check, writes nothing
       AGARTHA_DUMP=1                  prints the walked map

   THE PLAN IS READ, NOT RETYPED: every square comes from mondo's approved plan docs/plans/world-polish/plans/ug-agartha.js through the plan
   tool's own build() (docs/plans/world-polish/draw-plan.js). The plan changes first, the room second. One square = 3.5 m, one level =
   1.75 m; level 110 (the deepest pit) is the room's y 0.
   WHAT THIS TOOL MAKES (the shared parts): the floor of every open square at its level (the height sheet, four corners a square: a ledge is
   a sheer step), THE ROCK (every closed square stands up to the crust: no gen wall), THE ROOF (a slab of rock over every open square, its
   height the highest floor beside it + the square's own headroom, so every drop has room over it; stalactites hung from it), THE LADDERS
   (the plan's `stairs` pairs: a ladder up the face, both ways), THE ROPES (the plan's `found` free climbs up a cliff: an old fixed rope),
   the sumps (the plan's `w` squares: black water), the ways out, the paint, the checks.
   WHAT THE DESIGN FILE MAKES: docs/areas/cavern/agartha/room.js (the places, the buildings, the dressing, the light, the people), in the
   room's own frame (squares sx 0..59 west to east, sy 0..47 north to south).
   THE PILOT (11-20) stands in a NEW room `site_prebuilt_hollow_earth_ug_agartha`, NOT joined to the world (the Katana pattern): the old
   `site_prebuilt_hollow_earth_ow_agartha` (bake-cavern.js) stays the walked one until mondo says swap. Notes: docs/notes/areas-complexes.md
   "AGARTHA, THE LABYRINTH CITY". */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const REPO = __dirname, DRY = process.argv.includes('--dry-run');
const PLANTOOL = require('./docs/plans/world-polish/draw-plan.js');
const PLAN = require('./docs/plans/world-polish/plans/ug-agartha.js');
const DESIGN = require('./docs/areas/cavern/agartha/room.js');
const B = PLANTOOL.build(PLAN); PLANTOOL.check(B, { noRoom: true });
if (B.FAIL.length) throw new Error('the Agartha plan does not pass draw-plan.js:\n  ' + B.FAIL.join('\n  '));
const ROOM = 'site_prebuilt_hollow_earth_ug_agartha', SITE = 'prebuilt_hollow_earth', PART = 'ug_agartha';
const C = 3.5, LV = 1.75, ZERO = 110, W = B.W, Hh = B.H, N = B.N, HX = W * C / 2, HZ = Hh * C / 2;
const r2 = v => Math.round(v * 100) / 100, gx = c => r2(-HX + c * C), gz = c => r2(-HZ + c * C), gcx = c => r2(-HX + (c + 0.5) * C), gcz = c => r2(-HZ + (c + 0.5) * C);
const J = v => JSON.stringify(v).replace(/"([a-zA-Z_][a-zA-Z0-9_]*)":/g, '$1:').replace(/'/g, "\\'").replace(/"/g, "'");
const D = require('./load-data.js').loadGameData();
const inR = (x, y) => x >= 0 && y >= 0 && x < W && y < Hh;
const T = (x, y) => B.T[y][x], Lv = (x, y) => B.L[y][x];
/* an open square: the plan's walked squares + its water (a sump is a square of black water, not rock) */
const open = (x, y) => inR(x, y) && (B.isOpen(x, y) || T(x, y) === 'w');
const wet = (x, y) => inR(x, y) && T(x, y) === 'w';
/* the floor in metres over the room's y 0: a sump's bed is a level and a half under its water */
const floorOf = (x, y) => r2((Lv(x, y) - ZERO) * LV - (wet(x, y) ? 2.6 : 0));
const walkOf = (x, y) => r2((Lv(x, y) - ZERO) * LV);

/* ── THE HEADROOM a square: the design file names its places (`headroom(x, y)` -> metres or null); a passage 4.2 m, a chamber 8.75 m ── */
const HEAD = { g: 4.2, c: 8.75, k: 5.6, w: 4.2 };
const F = [], props = [], doors = [], npc = [], counters = [], ARCH = [], count = {}, taken = new Set(), errs = [], LINKS = [], PAINT = new Map();
const feat = o => { F.push(o); return o; };

/* ── the design file's ctx ── */
const U = n => 'urban:' + n;
function sheet() {
    const P = [];
    const add = (o, key, tint, x) => { if (key) o.key = key; if (tint != null) o.tint = tint; if (x) Object.assign(o, x); P.push(o); return o; };
    const A = { P,
        box: (x, y, z, w, h, d, key, tint, o) => add({ s: 'box', p: [r2(x), r2(y), r2(z)], size: [r2(w), r2(h), r2(d)] }, key, tint, o),
        cyl: (x, y, z, r, h, key, tint, o) => add({ s: 'cyl', p: [r2(x), r2(y), r2(z)], r, h }, key, tint, o),
        cone: (x, y, z, r, rTop, h, key, tint, o) => add({ s: 'cyl', p: [r2(x), r2(y), r2(z)], r: r2(r), r2: r2(rTop), h: r2(h) }, key, tint, o),
        quad: (x, y, z, w, h, ry, key, tint, o) => add({ s: 'quad', p: [r2(x), r2(y), r2(z)], size: [r2(w), r2(h)], ry: ry || 0 }, key, tint, o),
        roof: (form, x, y, z, w, h, d, key, tint, o) => add({ s: 'roof', form, p: [r2(x), r2(y), r2(z)], size: [r2(w), r2(h), r2(d)], roof: true }, key, tint, o),
        /* the four walls of a hollow building, its front (+z) with the doorway cut in it (the texbuilding row is the walls you bump) */
        shell(w, h, d, key, tint, door, uv) { const e = 0.05, Wd = w + 2 * e, Dp = d + 2 * e, x = uv ? { uv } : {};
            add({ s: 'box', p: [0, 0, 0], size: [r2(Wd), r2(h), r2(Dp)], top: false, faces: 'blr' }, key, tint, x);
            add({ s: 'quad', p: [0, 0, r2(Dp / 2)], size: [r2(Wd), r2(h)], ry: 0, hole: [r2(door.lx), r2(door.cw), 2.6] }, key, tint, x); },
        sign(words, x, y, z, w, h, fg, bg, font, o) { P.push(Object.assign({ s: 'quad', p: [r2(x), r2(y), r2(z)], size: [w, h], key: 'txt:' + words + '|' + fg + '|' + bg + '|' + r2(w / h) + '||' + font, uv: 'fit', kind: 'wall' }, o || {})); } };
    return A;
}
const ROT = { S: 0, W: 90, N: 180, E: 270 };
function texbDoor(w, door) { const L = Math.max(2, w) - 0.12, cols = Math.max(1, Math.round(L / 1.75)), cw = L / cols; let col = Math.floor((cols - 1) / 2); if (door >= 1) col = Math.min(cols - 1, Math.round(door) - 1); return { lx: -L / 2 + (col + 0.5) * cw, cw }; }
const BUILT = {};
const HEADROOM = {};   // `x,y` -> metres (the design file's places)
/* a BUILDING: squares x0..x1 x y0..y1 (the end inclusive, the plan's `buildings` rect), its front on `side`; a hollow `texbuilding` (the walls
   you bump, the doorway, the swinging leaf, the inside's floor and walls) + its look as an `arch` parts list drawn by `parts(a, fw, fd, door)`
   in the building's frame (x along the front, +z out of the front, y up from its floor). */
function building(id, rect, side, h, o, parts) {
    const [sx0, sy0, sx1e, sy1e] = rect, sx1 = sx1e + 1, sy1 = sy1e + 1, ew = side === 'E' || side === 'W';
    /* THE ROCK LEANS IN (seen 11-20, as Katana found): the height sheet's face beside a square of rock leans about a node (0.875 m) into the open
       square, so a wall on the square line had rock through it and a shelf against it stood on the slope. A side of the rect that touches rock
       (or the room's edge) keeps its wall INSET 1 m. The front is never rock. */
    const rockOn = { N: squaresIn(sx0, sy0 - 1, sx1e, sy0 - 1, (x, y) => !open(x, y)).length > 0, S: squaresIn(sx0, sy1, sx1e, sy1, (x, y) => !open(x, y)).length > 0,
        W: squaresIn(sx0 - 1, sy0, sx0 - 1, sy1e, (x, y) => !open(x, y)).length > 0 || sx0 === 0, E: squaresIn(sx1, sy0, sx1, sy1e, (x, y) => !open(x, y)).length > 0 || sx1 === W };
    rockOn.N = rockOn.N || sy0 === 0; rockOn.S = rockOn.S || sy1 === Hh;
    if (rockOn[side]) errs.push('building ' + id + ': its front (' + side + ') is against rock');
    const IN = 1.0, wx0 = r2(gx(sx0) + (rockOn.W ? IN : 0)), wx1 = r2(gx(sx1) - (rockOn.E ? IN : 0)), wz0 = r2(gz(sy0) + (rockOn.N ? IN : 0)), wz1 = r2(gz(sy1) - (rockOn.S ? IN : 0));
    const fw = r2(ew ? wz1 - wz0 : wx1 - wx0), fd = r2(ew ? wx1 - wx0 : wz1 - wz0);
    const cx = r2((wx0 + wx1) / 2), cz = r2((wz0 + wz1) / 2), rot = ROT[side], base = walkOf(sx0, sy0);
    for (let y = sy0; y < sy1; y++) for (let x = sx0; x < sx1; x++) { if (!open(x, y) || walkOf(x, y) !== base) errs.push('building ' + id + ': square ' + x + ',' + y + ' is not open at its floor'); taken.add(x + ':' + y); }
    const row = Object.assign({ k: 'texbuilding', id: 'aga:' + id, seed: 1, x: cx, z: cz, w: fw, d: fd, rot, storeys: Math.max(1, Math.floor(h / 3.5 + 0.01)), h, skin: false, hollow: true, leaf: 'leaf_frosted_single', leafDouble: false, keyIn: 'marble_light', floorIn: 'marble_light' }, o || {});
    feat(row);
    const a = sheet(), door = texbDoor(fw, row.door); parts(a, fw, fd, door);
    /* THE LINING (Katana's insides): the hollow building's own walls draw dark from inside, so a lit lining stands 0.335 m inside them, with a
       lit ceiling under the building's own; `o.lining` = { key, tint, h } */
    { const L0 = Object.assign({ key: 'marble_light', tint: 0xf0ede4, h: Math.min(h - 0.4, 6.4) }, o && o.lining), e = 0.335, W2 = r2(fw / 2 - e), D2 = r2(fd / 2 - e), Hc = r2(L0.h), lit = { gain: 1.6, glow: 0.2, uv: [1.75, 1.75], kind: 'wall' };
      a.P.push(Object.assign({ s: 'quad', p: [0, 0, -D2], size: [2 * W2, Hc], ry: 0, key: L0.key, tint: L0.tint }, lit), Object.assign({ s: 'quad', p: [0, 0, D2], size: [2 * W2, Hc], ry: 180, key: L0.key, tint: L0.tint, hole: [r2(-door.lx), r2(door.cw + 0.12), 2.25] }, lit),
          Object.assign({ s: 'quad', p: [-W2, 0, 0], size: [2 * D2, Hc], ry: 270, key: L0.key, tint: L0.tint }, lit), Object.assign({ s: 'quad', p: [W2, 0, 0], size: [2 * D2, Hc], ry: 90, key: L0.key, tint: L0.tint }, lit),
          { s: 'box', p: [0, r2(Hc - 0.05), 0], size: [2 * W2, 0.04, 2 * D2], key: L0.key, tint: L0.tint, glow: 0.3, gain: 1.6, under: true, roof: true, top: false, ds: true, uv: [1.75, 1.75] }); }
    ARCH.push({ k: 'arch', id: 'aga:' + id + ':look', x: cx, z: cz, rot, base, parts: a.P });
    const t = rot * Math.PI / 180, c = Math.cos(t), s = Math.sin(t);
    count.buildings = (count.buildings || 0) + 1;
    return (BUILT[id] = { at: (lx, lz) => [r2(cx + lx * c - lz * s), r2(cz + lx * s + lz * c)], face: f => (((f + rot) % 360) + 360) % 360, fw, fd, door, cx, cz, rot, base, h });
}
/* a prop in a building's frame */
const put = (Bd, key, lx, lz, o) => { const p = Bd.at(lx, lz), r = Object.assign({ key, x: p[0], z: p[1] }, o || {}); if (r.face != null) r.face = Bd.face(r.face); props.push(r); return r; };
/* a drawn piece (an `arch` row on open ground, walked under or round): `base` = its floor in metres */
function look(id, x, z, rot, base, fn) { const a = sheet(); fn(a); ARCH.push({ k: 'arch', id: 'aga:' + id, x: r2(x), z: r2(z), rot: rot || 0, base: r2(base), parts: a.P }); }

function spot(sx, sy, what, shared) { if (!inR(sx, sy)) { errs.push(what + ' is off the map at ' + sx + ',' + sy); return; }
    if (!open(sx, sy)) { errs.push(what + ' stands in the rock at ' + sx + ',' + sy); return; }
    if (!shared) { if (taken.has(sx + ':' + sy)) errs.push(what + ': square ' + sx + ',' + sy + ' is taken'); taken.add(sx + ':' + sy); } }
const mkRnd = s => { let v = s >>> 0; return () => { v = (v * 1664525 + 1013904223) >>> 0; return v / 4294967296; }; };
const rnd = mkRnd(4471);
/* a blocker on a square's middle (P), decor off it (dec: shared squares), people (native) */
const P = (key, sx, sy, o) => { spot(sx, sy, key); const r = Object.assign({ key, x: gcx(sx), z: gcz(sy) }, o || {}); props.push(r); return r; };
const dec = (key, sx, sy, o) => { spot(sx, sy, key, true); const r = Object.assign({ key, x: r2(gcx(sx) + (rnd() - 0.5) * 1.6), z: r2(gcz(sy) + (rnd() - 0.5) * 1.6), face: Math.round(rnd() * 360) }, o || {}); props.push(r); return r; };
const native = (race, sx, sy, face, say) => { spot(sx, sy, race); const n = { x: gcx(sx), z: gcz(sy), face: face || 0, race }; if (say) n.say = say; npc.push(n); };
const free = (sx, sy) => open(sx, sy) && !wet(sx, sy) && !taken.has(sx + ':' + sy);
/* the squares of a rect (inclusive) that pass `f` */
const squaresIn = (x0, y0, x1, y1, f) => { const o = []; for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (inR(x, y) && (!f || f(x, y))) o.push([x, y]); return o; };
/* walls beside a square (closed neighbours of four) */
const wallsBeside = (x, y) => [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => !open(x + dx, y + dy)).length;
const OLD = JSON.parse(vm.runInContext('JSON.stringify((r => r ? { n: r.npcSpots || [], l: r.lines || [], c: r.counters || [] } : { n: [], l: [], c: [] })(DOOR_HQ.rooms.site_prebuilt_hollow_earth_ow_agartha))', D));
const ctx = { C, LV, ZERO, W, H: Hh, N, B, PLAN, r2, gx, gz, gcx, gcz, open, wet, inR, T, L: Lv, floorOf, walkOf, feat, props, npc, counters, doors, taken, rnd, mkRnd,
    U, sheet, building, put, look, BUILT, P, dec, native, free, squaresIn, wallsBeside, OLD, LINKS, link: (a, b) => LINKS.push([a, b]),
    headroom: (x0, y0, x1, y1, m) => squaresIn(x0, y0, x1, y1).forEach(([x, y]) => { HEADROOM[x + ',' + y] = m; }),
    paint: (x, y, key) => PAINT.set(y * W + x, key) };

/* ── THE WAYS OUT: the plan's `doors` (their squares keep their level). The pilot's room is not joined to the world yet: each door names the
   room it will lead to; the far ends are re-pointed when mondo says swap. ── */
const DOORS = { 'the Mountains (the Lemuria adit)': { id: 'lemuria_adit', label: 'THE MOUNTAINS', sub: 'THE LEMURIA ADIT · UP THE OLD MINE TO THE HOT SPRINGS', action: { room: 'site_prebuilt_shasta_ow_lodge', at: 'link_shasta_lemuria' } },
    'The Long Tunnel (8 levels down)': { id: 'ow_h_m15_m8', label: 'THE LONG TUNNEL', sub: 'THE LONG TUNNEL · DOWN TO THE CAVERN', action: { room: 'site_prebuilt_hollow_earth_ow_long', at: 'ow_h_m15_m8' } } };
(PLAN.doors || []).forEach(d => { const [x, y, side, where] = d, o = DOORS[where]; if (!o) throw new Error('a door the tool does not know: ' + where);
    const wall = side.toLowerCase(), onWall = (side === 'N' && y === 0) || (side === 'S' && y === Hh - 1) || (side === 'W' && x === 0) || (side === 'E' && x === W - 1);
    if (!onWall) throw new Error('door ' + where + ': its square ' + x + ',' + y + ' is not on the ' + side + ' wall');
    /* a two-square passage: the door stands on the line between the two (the square and its neighbour along the wall) */
    const along = (side === 'N' || side === 'S') ? (open(x + 1, y) ? gx(x + 1) : open(x - 1, y) ? gx(x) : gcx(x)) : (open(x, y + 1) ? gz(y + 1) : open(x, y - 1) ? gz(y) : gcz(y));
    const row = Object.assign({ id: o.id, wall }, (side === 'N' || side === 'S') ? { x: along } : { z: along }, { way: 'tunnel', leaf: null, label: o.label, sub: o.sub, action: o.action, desc: '' });
    doors.push(row); taken.add(x + ':' + y); });

/* ── THE DESIGN FILE ── */
['plan', 'build', 'dress', 'people'].forEach(st => { if (typeof DESIGN[st] === 'function') DESIGN[st](ctx); });
if (errs.length) throw new Error('misplaced:\n  ' + errs.join('\n  '));

/* ── THE FLOOR: four corners a square, each square flat at its level (a ledge is a sheer step); the rock stands to the crust ── */
const headOf = (x, y) => HEADROOM[x + ',' + y] != null ? HEADROOM[x + ',' + y] : (HEAD[T(x, y)] || 4.2);
const ROOFY = new Float32Array(W * Hh);
for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) { if (!open(x, y)) continue; let hi = walkOf(x, y), hd = headOf(x, y);
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (open(x + dx, y + dy)) hi = Math.max(hi, walkOf(x + dx, y + dy));
    ROOFY[y * W + x] = r2(hi + hd); }
/* a ladder's two squares: the roof over both is over the head of the ladder */
(PLAN.stairs || []).forEach(([a, b]) => { const top = Math.max(ROOFY[a[1] * W + a[0]], ROOFY[b[1] * W + b[0]]); ROOFY[a[1] * W + a[0]] = ROOFY[b[1] * W + b[0]] = top; });
let TOPR = 0; for (let i = 0; i < W * Hh; i++) TOPR = Math.max(TOPR, ROOFY[i]);
const CRUST = r2(TOPR + 4), SH = r2(CRUST + 2);
const slope = Buffer.alloc(W * Hh * 8);
/* a RAMP square (the plan's `ramp`: half a level over the square, uphill `B.RAMP`): its corners slope, 15 cm under the stair row the design lays on it */
for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) { const o = (y * W + x) * 8, rp = B.RAMP[x + ',' + y], h = open(x, y) ? floorOf(x, y) : CRUST;
    [[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]].forEach(([cx, cz], k) => { const v = (rp && open(x, y)) ? r2((Lv(x, y) - ZERO + (cx * rp[0] + cz * rp[1]) * 0.5) * LV - 0.15) : h; slope.writeInt16LE(Math.round(v * 100), o + k * 2); }); }

/* ── THE ROOF: greedy rectangles of open squares under one roof height; each a slab of rock from its roof up to the crust, stalactites under ── */
const ROCK = [0x5c554d, 0x524c45, 0x645c52, 0x4a453f], grnd = mkRnd(9137);
{ const used = new Uint8Array(W * Hh);
  for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) { const i = y * W + x; if (!open(x, y) || used[i]) continue; const r = ROOFY[i];
      let w = 1; while (x + w < W && open(x + w, y) && !used[i + w] && ROOFY[i + w] === r) w++;
      let h = 1; rows: while (y + h < Hh) { for (let k = 0; k < w; k++) { const j = (y + h) * W + x + k; if (!open(x + k, y + h) || used[j] || ROOFY[j] !== r) break rows; } h++; }
      for (let j = 0; j < h; j++) for (let k = 0; k < w; k++) used[(y + j) * W + x + k] = 1;
      const ox = r2(gx(x) + w * C / 2), oz = r2(gz(y) + h * C / 2), parts = [{ s: 'box', p: [0, 0, 0], size: [r2(w * C + 0.02), r2(CRUST + 1 - r), r2(h * C + 0.02)], top: false, under: true, key: 'cave_wall', tint: 0x4a443e, uv: 7 }];
      const n = Math.min(10, Math.floor(w * h / 3));
      for (let k = 0; k < n; k++) { const len = r2(0.7 + grnd() * Math.min(2.6, Math.max(0.5, r - walkOf(x, y) - 3.2))), rr = r2(0.18 + grnd() * 0.35);
          parts.push({ s: 'cyl', p: [r2((grnd() - 0.5) * (w * C - 1)), r2(-len), r2((grnd() - 0.5) * (h * C - 1))], r: 0.03, r2: rr, h: len, seg: 6, key: 'cave_wall', tint: ROCK[Math.floor(grnd() * ROCK.length)], uv: 3.5 }); }
      ARCH.push({ k: 'arch', id: 'aga:roof:' + x + '_' + y, x: ox, z: oz, rot: 0, base: r, parts }); count.roofs = (count.roofs || 0) + 1; } }

/* ── THE LADDERS (the plan's `stairs`: a ladder up the face, both ways) and THE ROPES (the plan's `found` free climbs: an old fixed rope) ── */
const climbAt = (lo, hi, look, id) => { const dx = hi[0] - lo[0], dy = hi[1] - lo[1]; if (Math.abs(dx) + Math.abs(dy) !== 1) throw new Error('a climb between squares that do not touch: ' + lo + ' ' + hi);
    const face = dy < 0 ? 0 : dx > 0 ? 90 : dy > 0 ? 180 : 270, bx = dx ? gx(Math.max(lo[0], hi[0])) : gcx(lo[0]), bz = dy ? gz(Math.max(lo[1], hi[1])) : gcz(lo[1]);
    feat({ k: 'climb', id, x: r2(bx - dx * 0.3), z: r2(bz - dy * 0.3), face, look, y0: walkOf(lo[0], lo[1]), y1: walkOf(hi[0], hi[1]) });
    taken.add(lo[0] + ':' + lo[1]); LINKS.push([lo, hi]); };
(PLAN.stairs || []).forEach(([a, b], i) => { const la = walkOf(a[0], a[1]), lb = walkOf(b[0], b[1]); if (la === lb) return; climbAt(la < lb ? a : b, la < lb ? b : a, 'ladder', 'aga:ladder:' + i); count.ladders = (count.ladders || 0) + 1; });
(PLAN.found || []).filter(f => /free climb/.test(f.name)).forEach((f, i) => { climbAt(f.from, f.to, 'rope', 'aga:rope:' + i); count.ropes = (count.ropes || 0) + 1; });

/* ── THE SUMPS AND THE LAKE: black water over the plan's `w` squares (greedy rectangles at one level) ── */
{ const used = new Uint8Array(W * Hh);
  for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) { if (!wet(x, y) || used[y * W + x]) continue; const lv = Lv(x, y), ok = (X, Y) => wet(X, Y) && !used[Y * W + X] && Lv(X, Y) === lv;
      let w = 1; while (ok(x + w, y)) w++; let h = 1; rows: while (y + h < Hh) { for (let k = 0; k < w; k++) if (!ok(x + k, y + h)) break rows; h++; }
      for (let j = 0; j < h; j++) for (let k = 0; k < w; k++) used[(y + j) * W + x + k] = 1;
      F.push(h >= w ? { k: 'stream', pts: [[r2(gx(x) + w * C / 2), gz(y)], [r2(gx(x) + w * C / 2), gz(y + h)]], w: w * C, y: r2(walkOf(x, y) - 0.4), depth: 2.2, key: 'deep_water' }
                    : { k: 'stream', pts: [[gx(x), r2(gz(y) + h * C / 2)], [gx(x + w), r2(gz(y) + h * C / 2)]], w: h * C, y: r2(walkOf(x, y) - 0.4), depth: 2.2, key: 'deep_water' });
      count.sumps = (count.sumps || 0) + 1; } }

/* ── THE BRIDGES (the plan's `bridges`: a deck from one square over to another, walked both ways); the design file's `bridge` = its look ── */
(PLAN.bridges || []).forEach(([a, b], i) => { const la = walkOf(a[0], a[1]), lb = walkOf(b[0], b[1]); if (la !== lb) throw new Error('a bridge between two levels: ' + a + ' ' + b);
    const dx = Math.sign(b[0] - a[0]), dy = Math.sign(b[1] - a[1]);
    const ex = (q, s) => dx ? r2(gcx(q[0]) + s * dx * (C / 2 + 0.4)) : gcx(q[0]), ez = (q, s) => dy ? r2(gcz(q[1]) + s * dy * (C / 2 + 0.4)) : gcz(q[1]);
    feat(Object.assign({ k: 'bridge', id: 'aga:bridge:' + i, absY: true, x0: ex(a, 1), z0: ez(a, 1), x1: ex(b, -1), z1: ez(b, -1), w: C, y: la, thick: 0.35, rails: true }, DESIGN.bridge || {}));
    LINKS.push([a, b]); count.bridges = (count.bridges || 0) + 1; });

/* ── THE OPEN GROUND as `space` rows ── */
const spaces = [];
{ const used = new Uint8Array(W * Hh);
  for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) { if (!open(x, y) || used[y * W + x]) continue;
      let w = 1; while (x + w < W && !used[y * W + x + w] && open(x + w, y)) w++;
      let h = 1; rows: while (y + h < Hh) { for (let k = 0; k < w; k++) if (used[(y + h) * W + x + k] || !open(x + k, y + h)) break rows; h++; }
      for (let j = 0; j < h; j++) for (let k = 0; k < w; k++) used[(y + j) * W + x + k] = 1;
      spaces.push({ k: 'space', x: r2(gx(x) + w * C / 2), z: r2(gz(y) + h * C / 2), w: w * C, d: h * C }); } }

/* ── THE PAINT: 0 = the cave floor; the design file's squares (marble, crystal, the adit's dirt) ── */
const PAL = ['marble_light', 'crystal', 'dirt_2', 'dungeon_2', 'obsidian', 'rocks_dark_fantasy', 'wood_planks', 'marble_2'];
const paint = new Uint8Array(W * Hh);
PAINT.forEach((key, i) => { const v = PAL.indexOf(key); if (v < 0) throw new Error('a paint the palette does not hold: ' + key); paint[i] = v + 1; });

/* ── checks: every prop key and unit exists; nothing stands in the rock; every open square of the plan is walked from the spawn with the
   ladders, the ropes and the drops (the plan tool's own walk, here on the baked floor) ── */
const CAT = vm.runInContext('DOOR_HQ.catalogue', D), RACES = vm.runInContext('AVAILABLE_RACES', D);
props.forEach(p => { if (!CAT[p.key]) throw new Error('not in the catalogue: ' + p.key); });
npc.forEach(n => { if (RACES.indexOf(n.race) < 0) throw new Error('not a unit: ' + n.race); });
props.forEach(p => { const sx = Math.floor((p.x + HX) / C), sy = Math.floor((p.z + HZ) / C); if (!open(sx, sy)) throw new Error(p.key + ' stands in the rock at ' + sx + ',' + sy); });
const SP = DESIGN.spawn || PLAN.start;
{ const seen = new Uint8Array(W * Hh), st = [SP], LK = new Map(); LINKS.forEach(([a, b]) => { [[a, b], [b, a]].forEach(([p, q]) => { const k = p[1] * W + p[0]; if (!LK.has(k)) LK.set(k, []); LK.get(k).push(q); }); });
  seen[SP[1] * W + SP[0]] = 1;
  while (st.length) { const [x, y] = st.pop(); (LK.get(y * W + x) || []).forEach(q => { if (!seen[q[1] * W + q[0]]) { seen[q[1] * W + q[0]] = 1; st.push(q); } });
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + dx, Y = y + dy; if (!open(X, Y) || wet(X, Y) || seen[Y * W + X]) continue; const up = walkOf(X, Y) - walkOf(x, y); if (up > 0.6) continue; seen[Y * W + X] = 1; st.push([X, Y]); } }
  const cold = []; for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) if (open(x, y) && !wet(x, y) && !seen[y * W + x]) cold.push(x + ',' + y);
  if (process.env.AGARTHA_DUMP) console.log(B.T.map((r, y) => r.map((ch, x) => open(x, y) && !wet(x, y) && !seen[y * W + x] ? '!' : open(x, y) ? ch : ' ').join('')).join('\n'));
  if (cold.length) throw new Error('squares not walked to from the spawn: ' + cold.slice(0, 30).join(' '));
  /* and back: every square climbs back out to the spawn (the ladders and ropes run both ways; a drop does not) */
  const back = new Uint8Array(W * Hh), st2 = [SP]; back[SP[1] * W + SP[0]] = 1;
  while (st2.length) { const [x, y] = st2.pop(); (LK.get(y * W + x) || []).forEach(q => { if (!back[q[1] * W + q[0]]) { back[q[1] * W + q[0]] = 1; st2.push(q); } });
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + dx, Y = y + dy; if (!open(X, Y) || wet(X, Y) || back[Y * W + X]) continue; if (walkOf(x, y) - walkOf(X, Y) > 0.6) continue; back[Y * W + X] = 1; st2.push([X, Y]); } }
  const trap = []; for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) if (open(x, y) && !wet(x, y) && !back[y * W + x]) trap.push(x + ',' + y);
  if (trap.length) throw new Error('squares you cannot climb back out of: ' + trap.slice(0, 30).join(' '));
  let op = 0; for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) if (open(x, y)) op++;
  Object.assign(count, { openSquares: op }); }
/* THE HEIGHTS CHECK (WORLD_POLISH_PLAN section 4: print the baked room's heights before any browser run): every plot's level against the plan */
{ const bad = []; B.PLOTS.forEach(p => { const sq = squaresIn(p.bx * N, p.by * N, p.bx * N + N - 1, p.by * N + N - 1, (x, y) => open(x, y) && !wet(x, y)), lv = {};
      sq.forEach(([x, y]) => { lv[Lv(x, y)] = (lv[Lv(x, y)] || 0) + 1; }); if (!lv[p.level]) bad.push(p.name + ' has no square at its level ' + p.level); });
  if (bad.length) throw new Error('THE HEIGHTS:\n  ' + bad.join('\n  ')); }

Object.assign(count, { spaces: spaces.length, features: F.length + ARCH.length, props: props.length, natives: npc.length, crust: CRUST });
const SUNS = (typeof DESIGN.suns === 'function' ? DESIGN.suns(ctx) : []).slice(0, 4);
const AIR = typeof DESIGN.airZones === 'function' ? DESIGN.airZones(ctx).map(z => ({ x0: gx(z.sx0), z0: gz(z.sy0), x1: gx(z.sx1), z1: gz(z.sy1), kind: z.kind, color: z.color, n: z.n, speed: z.speed })) : [];

/* ── the room ── */
const SPM = { x: gcx(SP[0]), z: gcz(SP[1]) }, L = [];
L.push("        /* AGARTHA-UG-BEGIN — AGARTHA, THE LABYRINTH CITY (2026-11-20, world polish thread 9): written by `node bake-agartha.js` from docs/plans/world-polish/plans/ug-agartha.js + docs/areas/cavern/agartha/room.js. Never hand-edit between the markers; edit the plan or the design file and rerun. */");
L.push("        " + ROOM + ": {");
L.push("            label: 'AGARTHA',");
L.push("            sub: 'THE CRYSTAL CITY · THE LEMURIA ADIT · THE UPPER SHELF · THE LABYRINTH',");
L.push("            kind: 'box', site: '" + SITE + "', part: '" + PART + "',");
L.push("            shell: { w: " + (2 * HX) + ", d: " + (2 * HZ) + ", h: " + SH + ", wallH: " + SH + ", dadoH: 1.1, open: false,");
L.push("                     floor: 'cave_floor', wall: 'cave_wall', dado: 'rocks_dark_fantasy', trim: 'rock_wall_2', ceiling: 'cave_wall', floorColor: 0x8a8278, wallColor: 0x6e675e, dadoColor: 0x585048, ceilColor: 0x2a2622,");
L.push("                     pipes: false, strips: false, lights: [], mood: { light: 0xbfe6ff, ambient: " + (DESIGN.ambient != null ? DESIGN.ambient : 0.16) + ", hero: false }, plate: { x: " + SPM.x + ", z: " + SPM.z + ", y: " + r2(walkOf(SP[0], SP[1]) + 4.2) + " },");
L.push("                     look: HQ_ROOM_LOOKS.cave,");
L.push("                     /* THE BIG LIGHTS (three-renderer.js _hqBoxRoomLamps): the city's crystals */");
L.push("                     suns: " + J(SUNS) + (AIR.length ? ", atmos: " + J({ kind: 'none', zones: AIR }) : "") + " },");
L.push("            parti: '" + String(DESIGN.parti || '').replace(/'/g, "\\'") + "',");
L.push("            typology: 'grid',");
L.push("            plots: { cell: " + C + ", plot: " + (N * C) + ", nx: " + (W / N) + ", nz: " + (Hh / N) + ", names: " + J(B.PLOTS.map(p => ['P0' + p.bx + '-0' + p.by, (DESIGN.plotNames || {})[p.bx + ',' + p.by] || p.name, p.d, p.level - ZERO])) + " },");
L.push("            terrain: {");
L.push("                res: 0.875, floor: 'cave_floor', cliff: 'rocks_5', path: 'dirt_2',");
L.push("                noise: { amp: 0, scale: 5 }, crag: false, stalactites: false, backdrop: false,");
L.push("                slope: { cells: { res: " + C + ", x0: " + gx(0) + ", z0: " + gz(0) + ", nx: " + W + ", nz: " + Hh + ", d: '" + slope.toString('base64') + "' } },");
L.push("                paint: { pal: " + J(PAL) + ", t: 'u8', res: " + C + ", x0: " + gcx(0) + ", z0: " + gcz(0) + ", nx: " + W + ", nz: " + Hh + ", d: '" + Buffer.from(paint).toString('base64') + "' },");
L.push("                /* THE ROCK IS THE HEIGHT SHEET: every square that is not a `space` stands to the crust (" + CRUST + " m); no gen wall, no tree */");
L.push("                gen: { kind: 'plan', look: 'trees', seed: 91, rim: 0, forceGrow: 0, treeGap: 2.6, treeIn: 0.9, spacing: 3.5, depth: 5.25, maxTrees: 0, treeH: [5.5, 8.5], kinds: ['pine'], zones: " + J([{ x0: gx(0) - 50, z0: gz(0) - 50, x1: gx(W) + 50, z1: gz(Hh) + 50, none: true }]) + " },");
L.push("                features: [");
spaces.concat(F, ARCH).forEach(f => L.push("                    " + J(f) + ","));
L.push("                ],");
L.push("            },");
L.push("            doors: [");
doors.forEach(d => L.push("                " + J(d) + ","));
L.push("            ],");
L.push("            counters: " + J(counters) + ",");
L.push("            props: [");
for (let i = 0; i < props.length; i += 4) L.push("                " + props.slice(i, i + 4).map(J).join(", ") + ",");
L.push("            ],");
L.push("            agents: [],");
L.push("            npcSpots: " + J(npc) + ",");
L.push("            onlineSpots: [],");
L.push("            lines: " + J(OLD.l) + ",");
L.push("            spawn: { x: " + SPM.x + ", z: " + SPM.z + ", face: " + (DESIGN.spawnFace || 180) + " },");
L.push("        },");
L.push("        /* AGARTHA-UG-END */");
const block = L.join('\n') + '\n';
console.log(JSON.stringify(count));
if (DRY) process.exit(0);
const file = path.join(REPO, 'data.js'); let src = fs.readFileSync(file, 'utf8');
const END = '        /* AGARTHA-UG-END */\n', b0 = src.indexOf('        /* AGARTHA-UG-BEGIN'), b1 = src.indexOf(END);
if (b0 >= 0 && b1 > b0) src = src.slice(0, b0) + block + src.slice(b1 + END.length);
else { const anchor = '        /* CAVERN36-BEGIN'; const a = src.indexOf(anchor); if (a < 0) throw new Error('anchor not found in data.js: ' + anchor); src = src.slice(0, a) + block + src.slice(a); }   // the first bake: before the Cavern's block
fs.writeFileSync(file, src);
console.log('data.js: ' + ROOM + ' written (' + block.length + ' bytes)');
