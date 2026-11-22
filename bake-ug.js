#!/usr/bin/env node
/* bake-ug.js — THE UNDERGROUND, ONE DISTRICT A ROOM, BUILT FROM ITS APPROVED PLAN (2026-11-20, world polish threads 7 + 9 + 10; repo-only tooling).

       node bake-ug.js <key> [--dry-run]       writes the room between its markers in data.js (UG:<key>-BEGIN / UG:<key>-END)
       node bake-ug.js <key> --check           reads the baked room back (load-data.js) and compares every open square's height with the plan

   mondo 11-20: "The entire underground needs to be like a labyrinth"; "we need victory road. labyrinth, height diffs, cliffs, drops waterfalls,
   underground horror like the descent movie". The square-by-square plans are docs/plans/world-polish/plans/ug-<district>.js (APPROVED 11-20),
   written from the whole-underground layout (plans/underground.js) by docs/plans/world-polish/underground/gen-district.py.

   WHAT THIS TOOL DOES (shared by every underground district; a district's look and its things are its own DESIGN FILE):
   - builds the plan with the plan tool itself (docs/plans/world-polish/draw-plan.js `build` + `check`): no FAIL, or it refuses to bake;
   - THE GROUND: every open square of the plan is flat at its own level (terrain.slope.cells, four corners a square, like the city's), so two
     squares a level or more apart are a LEDGE (a drop, never a way up: owner-rules.md "A LEDGE"); every closed square is the rock, to the roof;
   - THE LADDERS: every `stairs` pair of the plan is a ladder (`climb`) on the line between its two squares, on the low side, facing the high;
   - THE FALLS: every `drop` branch whose words say WATERFALL is a `fall` row down its ledge (no river: mondo 11-20 "No real underground
     waterfall for now": water down a cliff and a pool at its foot, nothing more);
   - THE SUMPS: every plan square `w` is black water a level under its neighbours (deep: a dead end you swim);
   - THE ROOF: the rock overhead, one block from each open square's ceiling up to the crust: a passage's ceiling stands CEIL over the highest
     open square within two squares of it (so a ladder's head and a ledge's lip are always under the roof), a chamber's higher;
     stalactites hang from it;
   - THE DOORS: each plan door on the room's edge is a wall door, one inside the room is a free door in the rock; a door is a LINK row
     (DOOR_HQ.links, checked here) or a room door the design file names.
   THE DESIGN FILE (the district's own, one thread a file): `module.exports = { room: { label, sub, parti, ... }, doors: { '<plan door index>':
   { link | action, label, sub } }, dress(ctx), people(ctx), suns(ctx) }`. ctx = the squares (lv, open, tile, h), the helpers (P = a blocker on a
   square's middle, dec = decor off it, feat = a terrain row, npc), the plan and its build (B).
   Notes: docs/notes/areas-complexes.md "THE UNDERGROUND, ONE DISTRICT A ROOM". */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const REPO = __dirname, DRY = process.argv.includes('--dry-run'), CHECK = process.argv.includes('--check');
const DP = require('./docs/plans/world-polish/draw-plan.js');

/* ── THE DISTRICTS this tool writes (one row a room; a thread adds its own) ── */
const ROOMS = {
    hollow: { plan: 'docs/plans/world-polish/plans/ug-hollow-earth.js', design: 'docs/areas/cavern/districts/H-room.js',
              room: 'site_prebuilt_hollow_earth_ug_hollow', site: 'prebuilt_hollow_earth', part: 'ug_hollow' },
    cavern: { plan: 'docs/plans/world-polish/plans/ug-cavern.js', design: 'docs/areas/cavern/districts/K-room.js',
              room: 'site_prebuilt_hollow_earth_ug_cavern', site: 'prebuilt_hollow_earth', part: 'ug_cavern' },
};
const KEY = process.argv.slice(2).find(a => !a.startsWith('--'));
if (!KEY || !ROOMS[KEY]) { console.log('usage: node bake-ug.js <' + Object.keys(ROOMS).join('|') + '> [--dry-run|--check]'); process.exit(1); }
const RM = ROOMS[KEY], plan = require(path.join(REPO, RM.plan)), DES = require(path.join(REPO, RM.design));
const C = 3.5, LEVEL = 1.75;
const r2 = v => Math.round(v * 100) / 100;
const J = v => JSON.stringify(v).replace(/"([a-zA-Z_][a-zA-Z0-9_]*)":/g, '$1:').replace(/'/g, "\\'").replace(/"/g, "'");

/* ── the plan, built and checked by its own tool ── */
const B = DP.build(plan); DP.check(B, { noRoom: true });
if (B.FAIL.length) throw new Error('the plan fails draw-plan.js:\n  ' + B.FAIL.join('\n  '));
const W = B.W, H = B.H, N = B.N, T = B.T, LV = B.L;
const HX = W * C / 2, HZ = H * C / 2;
const gx = c => r2(-HX + c * C), gz = c => r2(-HZ + c * C), gcx = c => r2(-HX + (c + 0.5) * C), gcz = c => r2(-HZ + (c + 0.5) * C);
const inG = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
const isW = (x, y) => inG(x, y) && T[y][x] === 'w';
const open = (x, y) => inG(x, y) && (B.isOpen(x, y) || isW(x, y));      // a sump is open ground under water
const dry = (x, y) => inG(x, y) && B.isOpen(x, y);
let LO = Infinity, HI = -Infinity;
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (open(x, y)) { LO = Math.min(LO, LV[y][x] - (isW(x, y) ? 1 : 0)); HI = Math.max(HI, LV[y][x]); }
const BASE = LO;                                                         // the room's y 0 is its lowest floor
/* A SUMP'S BED AND BRIM (2026-11-22, the soft-lock pass; mondo: "no tiny crevices or huge drops where there is no room to get out"): a sump's
   bed lay 3.25 m under the floor beside it and its water 2 m under: the square water stops a soft shore (0.4 m) short of its squares' edge, so
   the brim was a dry face one to two metres deep the walker slid down to the waterline and stood in (a crevice in Hollow Earth, dips everywhere).
   The bed lies SUMP_BED under the LOWEST floor beside the sump (its rim) and the water SUMP_TOP under it: the lip left at the brim is under a
   step (0.62 m). A sump with no floor beside it keeps its plan level as its rim. */
const SUMP_BED = 1.2, SUMP_TOP = 0.3, RIM = new Map();
{ const D4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { if (!isW(x, y) || RIM.has(x + ',' + y)) continue; const comp = [[x, y]], seen = new Set([x + ',' + y]); let lo = Infinity;
      for (let i = 0; i < comp.length; i++) { const [a, b] = comp[i]; for (const [dx, dy] of D4) { const X = a + dx, Y = b + dy; if (dry(X, Y)) lo = Math.min(lo, (LV[Y][X] - BASE) * LEVEL); else if (isW(X, Y) && LV[Y][X] === LV[b][a] && !seen.has(X + ',' + Y)) { seen.add(X + ',' + Y); comp.push([X, Y]); } } }
      comp.forEach(([a, b]) => RIM.set(a + ',' + b, r2(isFinite(lo) ? lo : (LV[b][a] - BASE) * LEVEL))); } }
const hOf = (x, y) => isW(x, y) ? r2(RIM.get(x + ',' + y) - SUMP_BED) : r2((LV[y][x] - BASE) * LEVEL);   // the floor of a square, in metres
/* THE SHEETS: a design file names every surface (`room.tex`); the defaults are the old cave keys (they wear the CALM look: a district should name horror / urban sheets, mondo 11-20) */
const TX = Object.assign({ floor: 'cave_floor', wall: 'cave_wall', dado: 'rocks_dark_fantasy', trim: 'rock_wall_2', ceiling: 'cave_wall', cliff: 'rocks_5', path: 'dirt_2', genWall: 'cave_wall', roof: 'cave_wall', stalactite: 'cave_wall' }, (DES.room && DES.room.tex) || {});
const CEIL = (DES.room && DES.room.ceil) || 3, CEIL_CH = (DES.room && DES.room.ceilChamber) || 6;   // in levels over the floor
const SH = r2((HI - BASE + CEIL_CH + 4) * LEVEL);

/* ── the chambers (an `area` of 8 x 8 or more on one level, flat on purpose) and the plots ── */
const chamberAt = new Map(); (plan.flats || []).forEach((f, i) => { const [x0, y0, x1, y1] = f.rect; for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) chamberAt.set(x + ',' + y, i); });
const plotOf = (x, y) => B.plotOf(x, y);

/* ── THE GROUND: flat squares; a closed square takes the height of the nearest open one (the rock's foot) ── */
const FILL = new Float64Array(W * H).fill(NaN);
{ const q = []; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (open(x, y)) { FILL[y * W + x] = hOf(x, y); q.push([x, y]); }
  for (let i = 0; i < q.length; i++) { const [x, y] = q[i]; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + dx, Y = y + dy; if (!inG(X, Y) || !isNaN(FILL[Y * W + X])) continue; FILL[Y * W + X] = FILL[y * W + x]; q.push([X, Y]); } } }
const slope = Buffer.alloc(W * H * 8);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const o = (y * W + x) * 8, h = FILL[y * W + x]; for (let k = 0; k < 4; k++) slope.writeInt16LE(Math.round(h * 100), o + k * 2); }

/* ── the features the tool owns ── */
const FEAT = [], props = [], npc = [], counters = [], taken = new Set(), errs = [], decals = [];
const feat = o => { FEAT.push(o); return o; };
/* THE OPEN GROUND: every open square as `space` rows (greedy rectangles).
   A SUMP'S ROCK SIDES (2026-11-22, the soft-lock pass; mondo: "it needs to be raised straight up because its by a wall"): the rock began ON the
   line of a sump's squares and the water stops a soft shore short of it, so along every rock side of a sump lay a dry strip one node wide at the
   sump's bed: stepped onto off the brim's corner, never left again (the traps of Hollow Earth and the Cavern). A sump is its own `space` row,
   pulled SUMP_IN back from every side that is rock: the rock stands out over the bed, straight up out of the water. The dry squares first. */
const SUMP_IN = 0.6;
{ const used = new Uint8Array(W * H);
  for (const is of [dry, isW]) for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { if (!is(x, y) || used[y * W + x]) continue;
      let w = 1; while (x + w < W && !used[y * W + x + w] && is(x + w, y)) w++;
      let h = 1; rows: while (y + h < H) { for (let i = 0; i < w; i++) if (used[(y + h) * W + x + i] || !is(x + i, y + h)) break rows; h++; }
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) used[(y + j) * W + x + i] = 1;
      let x0 = gx(x), x1 = gx(x + w), z0 = gz(y), z1 = gz(y + h);
      if (is === isW) { const rock = sq => sq.every(([a, b]) => !open(a, b)), col = X => Array.from({ length: h }, (_, j) => [X, y + j]), row = Y => Array.from({ length: w }, (_, i) => [x + i, Y]);
          if (rock(col(x - 1))) x0 += SUMP_IN; if (rock(col(x + w))) x1 -= SUMP_IN; if (rock(row(y - 1))) z0 += SUMP_IN; if (rock(row(y + h))) z1 -= SUMP_IN; }
      FEAT.push({ k: 'space', x: r2((x0 + x1) / 2), z: r2((z0 + z1) / 2), w: r2(x1 - x0), d: r2(z1 - z0) }); } }

/* THE LADDERS: every `stairs` pair of the plan */
const LADDERS = [];
(plan.stairs || []).forEach(([a, b], i) => { const la = LV[a[1]][a[0]], lb = LV[b[1]][b[0]]; if (la === lb) return;
    const hi = la > lb ? a : b, lo = hi === a ? b : a, dx = hi[0] - lo[0], dy = hi[1] - lo[1];
    if (Math.abs(dx) + Math.abs(dy) !== 1) throw new Error('a ladder between squares that do not touch: ' + a + ' / ' + b);
    const lineX = dx ? gx(Math.max(hi[0], lo[0])) : gcx(lo[0]), lineZ = dy ? gz(Math.max(hi[1], lo[1])) : gcz(lo[1]);
    const face = dy < 0 ? 0 : dy > 0 ? 180 : dx > 0 ? 90 : 270;          // heading toward the high side (the face the ladder leans on)
    /* 1.05 m out from the line: the ground between two squares slopes over one mesh step (0.875 m) plus its blend, so a ladder nearer the line
       stands half inside the face (2026-11-20: a rope ladder 0.3 m out showed only its top third); its head search still finds the lip */
    const x = r2(lineX - dx * 1.05), z = r2(lineZ - dy * 1.05);
    feat({ k: 'climb', id: 'ug:' + KEY + ':ladder' + i, x, z, face, look: (DES.room && DES.room.ladderLook) || 'ladder', y0: hOf(lo[0], lo[1]), y1: hOf(hi[0], hi[1]) });
    LADDERS.push({ hi, lo, levels: Math.abs(la - lb) }); taken.add(lo[0] + ',' + lo[1]); taken.add(hi[0] + ',' + hi[1]); });

/* THE FALLS: a `drop` branch whose words say WATERFALL */
const FALLS = [];
(plan.branches || []).filter(b => b.kind === 'drop').forEach(b => { const [x, y] = b.at;
    let best = null; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + dx, Y = y + dy; if (dry(X, Y) && LV[y][x] - LV[Y][X] > 0.6 && (!best || LV[Y][X] < best[2])) best = [dx, dy, LV[Y][X]]; }
    if (!best) throw new Error('a drop with no ledge beside it at ' + x + ',' + y);
    const [dx, dy] = best, water = /WATERFALL/.test(b.to);
    /* the passage is two squares wide: the fall spans both (the square beside the drop square across the way) */
    const side = dx ? [0, 1] : [1, 0], twin = [x + side[0], y + side[1]], twin2 = [x - side[0], y - side[1]], tw = (dry(twin[0], twin[1]) && LV[twin[1]][twin[0]] === LV[y][x]) ? twin : (dry(twin2[0], twin2[1]) && LV[twin2[1]][twin2[0]] === LV[y][x]) ? twin2 : null;
    const lx = dx ? gx(Math.max(x, x + dx)) : (tw ? r2((gcx(x) + gcx(tw[0])) / 2) : gcx(x)), lz = dy ? gz(Math.max(y, y + dy)) : (tw ? r2((gcz(y) + gcz(tw[1])) / 2) : gcz(y));
    const face = dy > 0 ? 180 : dy < 0 ? 0 : dx > 0 ? 90 : 270;
    FALLS.push({ at: [x, y], down: [x + dx, y + dy], water, x: lx, z: lz, face, w: tw ? 2 * C : C, top: hOf(x, y), foot: hOf(x + dx, y + dy) });
    if (water) feat({ k: 'fall', key: (DES.room && DES.room.fallKey) || 'water', x: lx, z: lz, face, w: tw ? 2 * C : C, y0: r2(hOf(x, y) - 0.05), y1: r2(hOf(x + dx, y + dy) - 0.1) }); });

/* THE SUMPS: each run of `w` squares, black water at its plan level (a dead end you swim) */
{ const used = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { if (!isW(x, y) || used[y * W + x]) continue;
      let w = 1; while (isW(x + w, y) && !used[y * W + x + w] && LV[y][x + w] === LV[y][x]) w++;
      let h = 1; rows: while (y + h < H) { for (let i = 0; i < w; i++) if (!isW(x + i, y + h) || used[(y + h) * W + x + i] || LV[y + h][x + i] !== LV[y][x]) break rows; h++; }
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) used[(y + j) * W + x + i] = 1;
      const top = r2(RIM.get(x + ',' + y) - SUMP_TOP);   /* (the rim: the lowest floor beside the sump) */
      /* the stream's round ends reach past its run: lay it along the axis whose ends are rock (never into the floor beside the sump) */
      let endsX = 0, endsY = 0; for (let j = 0; j < h; j++) { if (dry(x - 1, y + j)) endsX++; if (dry(x + w, y + j)) endsX++; } for (let i = 0; i < w; i++) { if (dry(x + i, y - 1)) endsY++; if (dry(x + i, y + h)) endsY++; }
      const horiz = endsX === endsY ? w >= h : endsX < endsY;
      FEAT.push({ k: 'stream', key: (DES.room && DES.room.sumpKey) || 'deep_water', pts: horiz ? [[gx(x), r2(gz(y) + h * C / 2)], [gx(x + w), r2(gz(y) + h * C / 2)]] : [[r2(gx(x) + w * C / 2), gz(y)], [r2(gx(x) + w * C / 2), gz(y + h)]], w: (horiz ? h : w) * C, y: top, depth: r2(SUMP_BED - SUMP_TOP), bank: 0 }); } }

/* THE ROOF: each open square's ceiling (levels): CEIL over the highest open square within two squares (a chamber: CEIL_CH over its floor,
   and over the floors it looks down into); one rock block a run of equal ceilings, from the ceiling up to the crust; stalactites */
const CEILV = new Float64Array(W * H).fill(NaN);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { if (!open(x, y)) continue; let top = LV[y][x];
    const ch = chamberAt.has(x + ',' + y), R = ch ? 1 : 2;
    for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) if (open(x + dx, y + dy)) top = Math.max(top, LV[y + dy][x + dx]);
    CEILV[y * W + x] = top + (ch ? CEIL_CH : CEIL); }
/* a chamber's roof is one height: its own highest */
(plan.flats || []).forEach(f => { const [x0, y0, x1, y1] = f.rect; let m = -Infinity; for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (open(x, y)) m = Math.max(m, CEILV[y * W + x]);
    const bonus = (DES.room && DES.room.tallChambers && DES.room.tallChambers[f.name]) || 0;
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (open(x, y)) CEILV[y * W + x] = m + bonus; });
const rnd = (s => () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; })(0x5eed ^ KEY.length * 7919);
const ROCK = [0xb8b2a8, 0xa49e94, 0xc4beb4, 0x989288];
if (!(DES.room && DES.room.roof === false)) { const used = new Uint8Array(W * H), parts = [];   /* `room.roof: false` = open to the crust (Hollow Earth's sky) */
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { if (!open(x, y) || used[y * W + x]) continue; const c = CEILV[y * W + x];
      let w = 1; while (x + w < W && !used[y * W + x + w] && open(x + w, y) && CEILV[y * W + x + w] === c) w++;
      let h = 1; rows: while (y + h < H) { for (let i = 0; i < w; i++) if (used[(y + h) * W + x + i] || !open(x + i, y + h) || CEILV[(y + h) * W + x + i] !== c) break rows; h++; }
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) used[(y + j) * W + x + i] = 1;
      const y0 = r2((c - BASE) * LEVEL); if (SH - y0 < 0.5) continue;
      parts.push({ s: 'box', p: [r2(gx(x) + w * C / 2), y0, r2(gz(y) + h * C / 2)], size: [r2(w * C + 0.02), r2(SH - y0 + 0.5), r2(h * C + 0.02)], top: false, under: true, key: TX.roof, tint: 0x8a8680, uv: 7 }); }
  /* stalactites: one in five open squares, longer under a high roof, never over a ladder's head */
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { if (!dry(x, y) || taken.has(x + ',' + y) || rnd() > 0.2) continue; const top = r2((CEILV[y * W + x] - BASE) * LEVEL), room = top - hOf(x, y);
      const len = r2(0.6 + rnd() * Math.min(room - 2.6, chamberAt.has(x + ',' + y) ? 4.5 : 1.6)); if (len < 0.5) continue;
      parts.push({ s: 'cyl', p: [r2(gcx(x) + (rnd() - 0.5) * 2.2), r2(top - len), r2(gcz(y) + (rnd() - 0.5) * 2.2)], r: 0.03, r2: r2(0.18 + rnd() * 0.35), h: len, seg: 6, key: TX.stalactite, tint: ROCK[Math.floor(rnd() * ROCK.length)], uv: 3.5 }); }
  /* one arch row a plot, so a far plot can be culled */
  const byPlot = {}; parts.forEach(pt => { const sx = Math.floor((pt.p[0] + HX) / C), sy = Math.floor((pt.p[2] + HZ) / C), k = Math.floor(sx / N) + '_' + Math.floor(sy / N); (byPlot[k] = byPlot[k] || []).push(pt); });
  Object.keys(byPlot).forEach(k => { const [bx, by] = k.split('_').map(Number), ox = r2(gx(bx * N) + N * C / 2), oz = r2(gz(by * N) + N * C / 2);
      FEAT.push({ k: 'arch', id: 'ug:' + KEY + ':roof:' + k, x: ox, z: oz, rot: 0, y: 0 /* `y`, never `base` (2026-11-22): `base` is overwritten with the ground under the row's origin */, parts: byPlot[k].map(pt => Object.assign({}, pt, { p: [r2(pt.p[0] - ox), pt.p[1], r2(pt.p[2] - oz)] })) }); }); }

/* ── THE DESIGN FILE's ctx ── */
let CAT = {}, RACES = [], D = null;
D = require('./load-data.js').loadGameData(); CAT = vm.runInContext('DOOR_HQ.catalogue', D); RACES = vm.runInContext('AVAILABLE_RACES', D);
const spot = (x, y, what, shared) => { if (!inG(x, y)) { errs.push(what + ' off the map at ' + x + ',' + y); return false; } if (!dry(x, y)) { errs.push(what + ' stands in the rock or the water at ' + x + ',' + y); return false; }
    if (!shared) { if (taken.has(x + ',' + y)) errs.push(what + ': square ' + x + ',' + y + ' is taken'); taken.add(x + ',' + y); } return true; };
const drnd = (s => () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; })(0xc0ffee ^ KEY.charCodeAt(0));
const ctx = {
    KEY, C, N, W, H, LEVEL, BASE, plan, B, r2, gx, gz, gcx, gcz, rnd: drnd, taken, feat, props, npc, counters, decals, LADDERS, FALLS, chamberAt, CAT, D,
    lv: (x, y) => LV[y][x], h: hOf, open: dry, wet: isW, tile: (x, y) => T[y][x], plotOf, ceil: (x, y) => r2((CEILV[y * W + x] - BASE) * LEVEL),
    free: (x, y) => dry(x, y) && !taken.has(x + ',' + y),
    /* a blocker on a square's middle; decor off it (shared: several on one square); a person */
    P: (key, x, y, o) => { if (!CAT[key]) throw new Error('not in the catalogue: ' + key); if (spot(x, y, key)) props.push(Object.assign({ key, x: gcx(x), z: gcz(y), y: hOf(x, y) }, o || {})); },
    dec: (key, x, y, o) => { if (!CAT[key]) throw new Error('not in the catalogue: ' + key); if (spot(x, y, key, true)) props.push(Object.assign({ key, x: r2(gcx(x) + (drnd() - 0.5) * 1.6), z: r2(gcz(y) + (drnd() - 0.5) * 1.6), y: hOf(x, y), face: Math.round(drnd() * 360), noBlock: true }, o || {})); },
    npc: (race, x, y, face, say) => { if (RACES.indexOf(race) < 0) throw new Error('not a unit: ' + race); if (spot(x, y, race)) { const n = { x: gcx(x), z: gcz(y), face: face || 0, race }; if (say) n.say = say; npc.push(n); } },
    /* the open squares of a rect (inclusive), dry, in reading order */
    squares: (x0, y0, x1, y1) => { const o = []; for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (dry(x, y)) o.push([x, y]); return o; },
    /* dry squares with rock on N sides or more (a wall's foot: 1, a bend's corner: 2, a dead end's tip: 3) */
    walled: (x0, y0, x1, y1, n) => { const o = []; for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { if (!dry(x, y) || taken.has(x + ',' + y)) continue; let k = 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!open(x + dx, y + dy)) k++; if (k >= (n || 1)) o.push([x, y]); } return o; },
    /* which sides of a square are rock */
    rockSides: (x, y) => [[0, -1, 'n'], [0, 1, 's'], [-1, 0, 'w'], [1, 0, 'e']].filter(([dx, dy]) => !open(x + dx, y + dy)).map(q => q[2]),
};
/* the door squares are kept clear of props and people (the doors themselves are laid after the dressing) */
(plan.doors || []).forEach(d => taken.add(d[0] + ',' + d[1])); (DES.extraDoors || []).forEach(e => taken.add(e.at[0] + ',' + e.at[1]));
['dress', 'people'].forEach(st => { if (typeof DES[st] === 'function') DES[st](ctx); });
if (errs.length) throw new Error('misplaced:\n  ' + errs.join('\n  '));
/* THE WALK CHECK (2026-11-20): with every blocker the design stood (P, npc), every open square the plan reaches on foot is still reached
   (a step up of more than a ledge is refused, a drop is walked, a ladder is both ways): a stalagmite or a tent never cuts a passage */
{ const blk = new Set(); props.forEach(p => { if (p.noBlock) return; blk.add(Math.floor((p.x + HX) / C) + ',' + Math.floor((p.z + HZ) / C)); });
  const LAD = {}; (plan.stairs || []).forEach(([a, b]) => { (LAD[a + ''] = LAD[a + ''] || []).push(b); (LAD[b + ''] = LAD[b + ''] || []).push(a); });
  const reach = useBlk => { const st = (DES.room && DES.room.spawn) || plan.start, seen = new Set([st + '']), q = [st];
      for (let i = 0; i < q.length; i++) { const [x, y] = q[i]; const nb = [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]].concat(LAD[[x, y] + ''] || []);
          for (const [X, Y] of nb) { const k = X + ',' + Y; if (seen.has(k) || !dry(X, Y) || (useBlk && blk.has(k))) continue; const isLad = (LAD[[x, y] + ''] || []).some(q2 => q2[0] === X && q2[1] === Y);
              if (!isLad && LV[Y][X] - LV[y][x] > 0.6) continue; seen.add(k); q.push([X, Y]); } } return seen; };
  const all = reach(false), withB = reach(true), lost = [...all].filter(k => !withB.has(k) && !blk.has(k));
  if (lost.length) throw new Error('the dressing cuts the walk: ' + lost.length + ' square(s) no longer reached, e.g. ' + lost.slice(0, 8).join(' '));
  console.log('THE WALK CHECK: ' + all.size + ' squares reached, ' + blk.size + ' blocker squares, nothing cut off'); }
props.forEach(p => { if (!CAT[p.key]) throw new Error('not in the catalogue: ' + p.key); });

/* ── THE DOORS ── */
const LINKS = vm.runInContext('DOOR_HQ.links', D), doors = [], WANT = [];
function addDoor(x, y, side, spec, i) {
    const s = side.toLowerCase(), onWall = (s === 'n' && y === 0) || (s === 's' && y === H - 1) || (s === 'w' && x === 0) || (s === 'e' && x === W - 1);
    /* the door's middle: between this square and its twin across the way (the passages are two wide) */
    const along = (s === 'n' || s === 's') ? (dry(x + 1, y) && LV[y][x + 1] === LV[y][x] ? gx(x + 1) : gcx(x)) : (dry(x, y + 1) && LV[y + 1][x] === LV[y][x] ? gz(y + 1) : gcz(y));
    let place;
    if (onWall) place = { wall: s, [(s === 'n' || s === 's') ? 'x' : 'z']: along };
    else place = { wall: 'free', x: (s === 'n' || s === 's') ? along : gcx(x), z: (s === 'n' || s === 's') ? gcz(y) : along, face: { n: 180, s: 0, w: 90, e: 270 }[s], passage: { len: 3, deep: 1.2 } };
    if (spec.well) place = { wall: 'free', x: gcx(x), z: gcz(y), face: spec.face || 0 };   // a well or a rope: a free door standing in the open, no passage
    taken.add(x + ',' + y);
    if (spec.link) { const L = LINKS.find(l => l.id === spec.link); if (!L) throw new Error('no link ' + spec.link);
        const end = spec.end || 'a', e = L[end]; WANT.push({ id: spec.link, end, place, ok: e && e.site === RM.site && e.part === RM.part && e.wall === place.wall && (place.wall === 'free' ? Math.abs(e.x - place.x) < 0.01 && Math.abs(e.z - place.z) < 0.01 : Math.abs((e.x != null ? e.x : e.z) - (place.x != null ? place.x : place.z)) < 0.01) });
        return; }
    doors.push(Object.assign({ id: spec.id || ('ug_' + KEY + '_' + i) }, place, spec.secret ? { secret: true } : {}, { way: spec.way || 'trail', leaf: spec.leaf || null, label: spec.label, sub: spec.sub, action: spec.action, desc: spec.desc || '' })); }
(plan.doors || []).forEach((d, i) => { const spec = (DES.doors || {})[i]; if (!spec) throw new Error('the design file names no door for plan door ' + i + ' (' + d[3] + ')'); addDoor(d[0], d[1], d[2], spec, i); });
/* THE DESIGN'S OWN WAYS IN (not in the plan: a link or a door that stood in the old room): `extraDoors: [{ at: [x, y], side, link, end | id, label, sub, action, secret, well, face }]` */
(DES.extraDoors || []).forEach((e, i) => { if (!dry(e.at[0], e.at[1])) throw new Error('an extra door on a square that is not open: ' + e.at); addDoor(e.at[0], e.at[1], e.side || 'n', e, 'x' + i); });
let bad = WANT.filter(w => !w.ok);
/* `--fix-links`: point each link end that is off at this room (its own words, sub / verb / leaf, are kept) */
if (bad.length && process.argv.includes('--fix-links')) { const file = path.join(REPO, 'data.js'); let src = fs.readFileSync(file, 'utf8');
    bad.forEach(w => { const L = LINKS.find(l => l.id === w.id), old = L[w.end] || {}, keep = {}; Object.keys(old).forEach(k => { if (!['site', 'part', 'room', 'wall', 'x', 'z', 'face', 'passage'].includes(k)) keep[k] = old[k]; });
        const at = src.indexOf("{ id: '" + w.id + "'"); if (at < 0) throw new Error('link row not found: ' + w.id);
        const m = new RegExp('\\n(\\s+)' + w.end + ': \\{').exec(src.slice(at)); if (!m) throw new Error('link end not found: ' + w.id + ' ' + w.end);
        let i0 = at + m.index + m[0].length - 1, depth = 0, i1 = i0; for (; i1 < src.length; i1++) { if (src[i1] === '{') depth++; else if (src[i1] === '}') { depth--; if (!depth) break; } }
        const row = Object.assign({ site: RM.site, part: RM.part }, w.place, keep);
        src = src.slice(0, i0) + J(row).replace(/^\{/, '{ ').replace(/\}$/, ' }') + src.slice(i1 + 1);
        console.log('link re-pointed: ' + w.id + ' ' + w.end); });
    fs.writeFileSync(file, src); bad = []; }
if (bad.length) { console.log('data.js DOOR_HQ.links rows to point here (end, then the place):'); bad.forEach(w => console.log('  ' + w.id + ' ' + w.end + ': { site: \'' + RM.site + '\', part: \'' + RM.part + '\', ' + J(w.place).slice(1, -1) + ' }')); if (!DRY) throw new Error('a link does not point at this room yet (see above)'); }

/* ── THE SPAWN and the plate ── */
const sp = (DES.room && DES.room.spawn) || plan.start, spFace = (DES.room && DES.room.spawnFace) || 0;
if (!dry(sp[0], sp[1])) throw new Error('the spawn is not open');
/* ── THE PAINT: one sheet a square ── */
const PAL = (DES.room && DES.room.pal) || ['obsidian', 'dungeon_2', 'dirt_2', 'crystal'];
const paint = new Uint8Array(W * H); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) paint[y * W + x] = typeof DES.paint === 'function' ? (DES.paint(ctx, x, y) || 0) : 0;
/* THE BIG LIGHTS */
const SUNS = (typeof DES.suns === 'function' ? DES.suns(ctx) : []).slice(0, 4);
const AIR = typeof DES.air === 'function' ? DES.air(ctx) : [];

/* ── the room literal ── */
const R = DES.room, Lr = [];
const BEGIN = '        /* UG:' + KEY + '-BEGIN', END = '        /* UG:' + KEY + '-END */';
Lr.push(BEGIN + ' — THE UNDERGROUND, ' + R.label + ' (2026-11-20, world polish thread 9): written by `node bake-ug.js ' + KEY + '` from ' + RM.plan + ' (APPROVED 11-20) + ' + RM.design + '. Never hand-edit between the markers. */');
Lr.push('        ' + RM.room + ': {');
Lr.push('            label: ' + J(R.label) + ',');
Lr.push('            sub: ' + J(R.sub) + ',');
Lr.push("            kind: 'box', site: '" + RM.site + "', part: '" + RM.part + "',");
if (R.world) Lr.push('            world: ' + J(R.world) + ',');
Lr.push('            shell: { w: ' + r2(2 * HX) + ', d: ' + r2(2 * HZ) + ', h: ' + SH + ', wallH: ' + SH + ", dadoH: 1.1, open: false,");
Lr.push('                     floor: ' + J(TX.floor) + ', wall: ' + J(TX.wall) + ', dado: ' + J(TX.dado) + ', trim: ' + J(TX.trim) + ', ceiling: ' + J(TX.ceiling) + ', floorColor: 0x8a8278, wallColor: 0x5e5850, dadoColor: 0x4a443e, ceilColor: 0x1e1b18,');
Lr.push('                     pipes: false, strips: false, lights: [], mood: ' + J(R.mood || { light: 0xffb070, ambient: 0.16, hero: false }) + ', plate: { x: ' + gcx(sp[0]) + ', z: ' + gcz(sp[1]) + ', y: ' + r2(hOf(sp[0], sp[1]) + 4.2) + ' },');
Lr.push('                     fog: { color: ' + ((DES.room && DES.room.fogColor) || '0x0a0807') + ', density: 0.007 }, look: HQ_ROOM_LOOKS.' + ((DES.room && DES.room.look) || 'cave') + ',');   // (the one fog amount: only its colour is a room's)
Lr.push('                     suns: ' + J(SUNS) + (AIR.length ? ', atmos: ' + J({ kind: 'none', zones: AIR }) : '') + ' },');
Lr.push('            parti: ' + J(R.parti) + ',');
Lr.push("            typology: 'grid',");
const names = B.PLOTS.map(p => ['P' + String(p.bx).padStart(2, '0') + '-' + String(p.by).padStart(2, '0'), (R.plotNames && R.plotNames[p.bx + ',' + p.by]) || p.name, p.d, p.level]);
Lr.push('            plots: { cell: ' + C + ', plot: ' + (N * C) + ', nx: ' + (W / N) + ', nz: ' + (H / N) + ', names: ' + J(names) + ' },');
Lr.push('            terrain: {');
Lr.push('                res: 0.875, floor: ' + J(TX.floor) + ', cliff: ' + J(TX.cliff) + ', path: ' + J(TX.path) + ", stairs: 'wood',");
Lr.push('                noise: { amp: 0, scale: 5 }, crag: false, stalactites: false,');
Lr.push('                /* THE GROUND: every square flat at its plan level (four corners a square, cm); a ledge is a real drop */');
Lr.push('                slope: { cells: { res: ' + C + ', x0: ' + gx(0) + ', z0: ' + gz(0) + ', nx: ' + W + ', nz: ' + H + ", d: '" + slope.toString('base64') + "' } },");
Lr.push('                paint: { pal: ' + J(PAL) + ", t: 'u8', res: " + C + ', x0: ' + gcx(0) + ', z0: ' + gcz(0) + ', nx: ' + W + ', nz: ' + H + ", d: '" + Buffer.from(paint).toString('base64') + "' },");
Lr.push('                /* every square that is not a `space` is the rock, up to the crust */');
Lr.push('                gen: ' + J((DES.room && DES.room.gen) || { kind: 'plan', look: 'walls', wallKey: TX.genWall, rim: 0, forceGrow: -0.3 }) + ',');   // `room.gen`: a design's own wall (a jungle of trees in Hollow Earth)
Lr.push('                features: [');
FEAT.forEach(f => Lr.push('                    ' + J(f) + ','));
Lr.push('                ],');
Lr.push('            },');
Lr.push('            doors: [');
doors.forEach(d => Lr.push('                ' + J(d) + ','));
Lr.push('            ],');
Lr.push('            counters: ' + J(counters) + ',');
Lr.push('            props: [');
for (let i = 0; i < props.length; i += 4) Lr.push('                ' + props.slice(i, i + 4).map(J).join(', ') + ',');
Lr.push('            ],');
Lr.push('            agents: [],');
Lr.push('            npcSpots: ' + J(npc) + ',');
Lr.push('            onlineSpots: [],');
Lr.push('            lines: ' + J(R.lines || []) + ',');
Lr.push('            spawn: { x: ' + gcx(sp[0]) + ', z: ' + gcz(sp[1]) + ', face: ' + spFace + ' },');
Lr.push('        },');
Lr.push(END);
const BLOCK = Lr.join('\n') + '\n';

console.log(RM.room + ' ' + JSON.stringify({ squares: [W, H], levels: [BASE, HI], shellH: SH, spaces: FEAT.filter(f => f.k === 'space').length, ladders: LADDERS.length, falls: FALLS.filter(f => f.water).length, cliffs: FALLS.filter(f => !f.water).length,
    sumps: FEAT.filter(f => f.k === 'stream').length, features: FEAT.length, props: props.length, natives: npc.length, doors: doors.length, links: WANT.length, kb: Math.round(BLOCK.length / 1024) }));

if (CHECK) {
    /* read the baked room back and compare each open square's height with the plan (ROOM_LAYOUTS-style: the floor under the square's middle) */
    const info = vm.runInContext('hqTerrainInfo', D)(RM.room); let bad2 = 0, n = 0;
    if (!info) throw new Error('the room is not in data.js yet: bake it first');
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { if (!dry(x, y)) continue; n++; const f = vm.runInContext('hqTerrainFeet', D)(info, gcx(x), gcz(y), null); if (Math.abs(f - hOf(x, y)) > 0.05) { if (bad2 < 20) console.log('  off: ' + x + ',' + y + ' plan ' + hOf(x, y) + ' m, baked ' + r2(f) + ' m'); bad2++; } }
    console.log('THE HEIGHTS: ' + n + ' open squares, ' + bad2 + ' off the plan');
    /* the plot levels as a grid (THE CHECK, 2) */
    const g = []; for (let by = 0; by < H / N; by++) g.push(Array.from({ length: W / N }, (_, bx) => { const p = B.plotAt[bx + ',' + by]; return p ? String(p.level).padStart(4) : '   .'; }).join(''));
    console.log('THE PLOT LEVELS (levels over the Inner Sun):\n' + g.join('\n'));
    process.exit(bad2 ? 1 : 0);
}
if (DRY) process.exit(0);
const file = path.join(REPO, 'data.js'); let src = fs.readFileSync(file, 'utf8');
const b0 = src.indexOf(BEGIN), b1 = src.indexOf(END);
if (b0 >= 0 && b1 > b0) src = src.slice(0, b0) + BLOCK + src.slice(b1 + END.length + 1);
else { const anchor = '        /* CAVERN36-END */\n', a = src.indexOf(anchor); if (a < 0) throw new Error('no CAVERN36-END marker to write after'); src = src.slice(0, a + anchor.length) + BLOCK + src.slice(a + anchor.length); }
fs.writeFileSync(file, src);
console.log('written: data.js ' + RM.room);
