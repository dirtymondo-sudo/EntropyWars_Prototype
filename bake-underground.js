/* bake-underground.js — THE UNDERGROUND DISTRICT ROOMS (2026-11-20, WORLD_POLISH_PLAN threads 7 + 9 + 10; mondo 11-20: "The entire underground
   needs to be like a labyrinth ... we need victory road. labyrinth, height diffs, cliffs, drops waterfalls, underground horror like the descent movie").

       node bake-underground.js <design> [--dry-run]        e.g.  node bake-underground.js long-tunnel

   ONE TOOL, ONE ROOM A DISTRICT. A district's room is written from two files:
     - its SQUARE PLAN `docs/plans/world-polish/plans/ug-<name>.js` (mondo's OK of 11-20; written by
       docs/plans/world-polish/underground/gen-district.py; checked by docs/plans/world-polish/draw-plan.js). The tool reads it through the plan
       tool's own `build` + `check` (the same squares, the same levels; a FAIL stops the bake), so what stands is what the plan says, square for square.
     - its ROOM DESIGN `docs/areas/underground/<name>.js` (the room's id, its names, its doors, its light, its dressing: `dress(ctx)`).
   What the tool lays (every number is the plan's):
     - THE GROUND: a HEIGHT BASE (`terrain.slope.cells`, four corners a square, as Disaster City's levels): every open square stands flat at its
       level (1.75 m a level, the room's zero = its lowest square). Two squares a level or more apart = a CLIFF (a ledge: you drop, you never
       climb back). A rock square is the wall (`gen: plan walls`), up to the crust.
     - THE LADDERS: one `climb` row a plan `stairs` pair (both ways), on the plot line, facing the high side.
     - THE WATER: every `w` run is a sump of black water (deep, never entered) in its hollow; a plan branch "over a WATERFALL" is a `fall` row
       (water running down the cliff: no river, mondo 11-20).
     - THE ROOF: one `arch` row a plot; over every open square a block of rock from its roof line (the highest floor beside it + 5.25 m; a
       chamber's middle vaults higher) up to the crust, and stalactites hung from it. The room is roofed and dark.
     - THE LANDMARK: a `k` square is the plan's landmark (the design draws it).
   The design file's ctx (squares are the plan's x, y): `P(key, x, y, o)` a blocker centred on a square, `dec(key, x, y, o)` decor off centre,
   `native(race, x, y, face, say)`, `arch(id, x, y, parts)` a drawn row at a square (parts in metres from the square's middle, over its floor),
   `feat(row)`, `lvl(x, y)`, `y(x, y)` (the floor in m), `open(x, y)`, `gcx / gcz`, `rnd()`, `squares(x0, y0, x1, y1)` the open squares of a box,
   `walls(x0, y0, x1, y1)` the open squares with rock beside them, `free(x, y)` (open, dry, nothing placed, not a ladder's foot or head).
   Writes data.js between the markers UG-<KEY>-BEGIN and UG-<KEY>-END (the first bake puts the block before the Cavern's). After the bake it
   loads data.js again and reads the baked height on every open square of the plan: a square off its level stops the tool (the plan's
   section 4 rule: "prints the baked room's heights before any browser run").
   Notes: docs/notes/areas-complexes.md "THE UNDERGROUND, ONE ROOM A DISTRICT". */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const REPO = __dirname, DRY = process.argv.includes('--dry-run'), NAME = process.argv.slice(2).find(a => !a.startsWith('--'));
if (!NAME) throw new Error('usage: node bake-underground.js <design name, a file in docs/areas/underground/> [--dry-run]');
const DES = require(path.join(REPO, 'docs/areas/underground', NAME + '.js'));
const DP = require(path.join(REPO, 'docs/plans/world-polish/draw-plan.js'));
const PLAN = require(path.join(REPO, DES.plan));
const B = DP.check(DP.build(PLAN), { noRoom: true });
if (B.FAIL.length) throw new Error('the plan fails draw-plan.js:\n  ' + B.FAIL.join('\n  '));
const { W, H, N, T, L } = B;
const C = 3.5, LV = 1.75, CEIL = 5.25;
const r2 = v => Math.round(v * 100) / 100;
const J = v => JSON.stringify(v).replace(/"([a-zA-Z_][a-zA-Z0-9_]*)":/g, '$1:').replace(/'/g, "\\'").replace(/"/g, "'");
const HX = W * C / 2, HZ = H * C / 2, gx = c => r2(-HX + c * C), gz = c => r2(-HZ + c * C), gcx = c => r2(-HX + (c + 0.5) * C), gcz = c => r2(-HZ + (c + 0.5) * C);
const inG = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
const open = (x, y) => inG(x, y) && 'gckpqdm'.includes(T[y][x]);      // walked ground
const room = (x, y) => open(x, y) || (inG(x, y) && T[y][x] === 'w');     // not rock (the water is in the room)
const D4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
let LO = Infinity, HI = -Infinity; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (room(x, y)) { LO = Math.min(LO, L[y][x]); HI = Math.max(HI, L[y][x]); }
const ym = l => r2((l - LO) * LV), yAt = (x, y) => ym(L[y][x]);
const mkRnd = s => { let v = s >>> 0; return () => { v = (v * 1664525 + 1013904223) >>> 0; return v / 4294967296; }; };
const pid = (bx, by) => 'P' + String(bx).padStart(2, '0') + '-' + String(by).padStart(2, '0');

/* ── THE LADDERS (the plan's `stairs`): a pair of squares side by side; the line between them, on the low side, facing the high side ── */
const STAIRS = (PLAN.stairs || []).map(s => { const a = s[0], b = s[1], la = L[a[1]][a[0]], lb = L[b[1]][b[0]], lo = la <= lb ? a : b, hi = la <= lb ? b : a;
    const dx = hi[0] - lo[0], dy = hi[1] - lo[1]; if (Math.abs(dx) + Math.abs(dy) !== 1) throw new Error('a ladder whose squares do not touch: ' + JSON.stringify(s));
    return { lo, hi, dx, dy, y0: yAt(lo[0], lo[1]), y1: yAt(hi[0], hi[1]) }; });
const ladderSq = new Set(); STAIRS.forEach(s => { ladderSq.add(s.lo + ''); ladderSq.add(s.hi + ''); });

/* ── THE CTX the design dresses with ── */
const F = [], ARCH = [], props = [], npc = [], taken = new Set(), errs = [];
const rnd = mkRnd(DES.seed || 7);
const isFree = (x, y) => open(x, y) && !taken.has(x + ',' + y) && !ladderSq.has(x + ',' + y) && T[y][x] !== 'k';
const ctx = {
    W, H, N, T, L, LO, C, LV, CEIL, rnd, plan: PLAN, gcx, gcz, gx, gz, open, room, free: isFree,
    lvl: (x, y) => L[y][x], y: yAt,
    P(key, x, y, o) { if (!open(x, y)) { errs.push(key + ' on a closed square ' + x + ',' + y); return; } if (taken.has(x + ',' + y)) errs.push(key + ': two blockers on ' + x + ',' + y); taken.add(x + ',' + y);
        props.push(Object.assign({ key, x: gcx(x), z: gcz(y) }, o || {})); },
    dec(key, x, y, o) { if (!room(x, y)) { errs.push(key + ' on a closed square ' + x + ',' + y); return; } const j = (o && o.jit != null) ? o.jit : 1.4; const q = Object.assign({ key, x: r2(gcx(x) + (rnd() - 0.5) * j), z: r2(gcz(y) + (rnd() - 0.5) * j), face: Math.round(rnd() * 360), noBlock: true }, o || {}); delete q.jit; props.push(q); },
    native(race, x, y, face, say) { if (!open(x, y)) { errs.push(race + ' on a closed square ' + x + ',' + y); return; } taken.add(x + ',' + y); const n = { x: gcx(x), z: gcz(y), face: face || 0, race }; if (say) n.say = say; npc.push(n); },
    arch(id, x, y, parts, o) { ARCH.push(Object.assign({ k: 'arch', id: DES.part + ':' + id, x: gcx(x), z: gcz(y), rot: 0, base: yAt(x, y), parts }, o || {})); },
    feat(row) { F.push(row); return row; },
    squares(x0, y0, x1, y1) { const o = []; for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (open(x, y)) o.push([x, y]); return o; },
    walls(x0, y0, x1, y1) { const o = []; for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (open(x, y) && D4.some(([dx, dy]) => !room(x + dx, y + dy))) o.push([x, y]); return o; },
    take(x, y) { taken.add(x + ',' + y); },
    stairs: STAIRS, branches: PLAN.branches || [],
};

/* ── THE GROUND: the height base, four corners a square (cm, int16). A rock square stands at the lowest floor beside it, so the line between it
   and an open square is that square's own height (hqTerrainSlopeFn takes the higher side on a line) ── */
const hs = []; for (let y = 0; y < H; y++) { hs.push([]); for (let x = 0; x < W; x++) hs[y].push(room(x, y) ? yAt(x, y) : null); }
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (hs[y][x] == null) { let m = Infinity; for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) if (inG(x + i, y + j) && room(x + i, y + j)) m = Math.min(m, yAt(x + i, y + j)); hs[y][x] = isFinite(m) ? m : 0; }
const slope = Buffer.alloc(W * H * 8); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const v = Math.round(hs[y][x] * 100); for (let k = 0; k < 4; k++) slope.writeInt16LE(v, ((y * W + x) * 4 + k) * 2); }

/* ── THE LADDERS, BUILT ── */
STAIRS.forEach((s, i) => { const lx = s.dx ? gx(Math.max(s.lo[0], s.hi[0])) : gcx(s.lo[0]), lz = s.dy ? gz(Math.max(s.lo[1], s.hi[1])) : gcz(s.lo[1]);
    F.push({ k: 'climb', id: DES.part + ':ladder:' + i, x: r2(lx - s.dx * 0.3), z: r2(lz - s.dy * 0.3), y0: s.y0, y1: s.y1, face: s.dx > 0 ? 90 : s.dx < 0 ? 270 : s.dy > 0 ? 180 : 0, look: DES.ladderLook || 'ladder' }); });

/* ── THE WATER: every run of `w` squares is a sump (deep, black, never entered), its surface under the floor beside it ── */
{ const used = new Set();
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { if (T[y][x] !== 'w' || used.has(x + ',' + y)) continue;
      let w = 1; while (inG(x + w, y) && T[y][x + w] === 'w' && !used.has((x + w) + ',' + y)) w++;
      let h = 1; rows: while (inG(x, y + h)) { for (let i = 0; i < w; i++) if (T[y + h][x + i] !== 'w' || used.has((x + i) + ',' + (y + h))) break rows; h++; }
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) used.add((x + i) + ',' + (y + j));
      let rim = -Infinity; for (let j = -1; j <= h; j++) for (let i = -1; i <= w; i++) if (open(x + i, y + j)) rim = Math.max(rim, yAt(x + i, y + j));
      const top = r2((isFinite(rim) ? rim : yAt(x, y) + LV) - 0.45);
      /* the line from the first square's middle to the last's (the game lays square water along it: hqFluidGrid; an end ON a line takes the next square too) */
      const e = (a, b) => a === b ? [r2(a - 0.5), r2(a + 0.5)] : [a, b];
      const pts = h >= w ? (q => [[r2(gx(x) + w * C / 2), q[0]], [r2(gx(x) + w * C / 2), q[1]]])(e(gcz(y), gcz(y + h - 1))) : (q => [[q[0], r2(gz(y) + h * C / 2)], [q[1], r2(gz(y) + h * C / 2)]])(e(gcx(x), gcx(x + w - 1)));
      F.push({ k: 'stream', absY: true, pts, w: (h >= w ? w : h) * C, y: top, depth: 1.8, key: 'deep_water', bank: 0.3 }); } }
/* the falls: a plan branch "over a WATERFALL" at its high square, falling to the square past it */
(PLAN.branches || []).filter(b => b.kind === 'drop' && /WATERFALL/.test(b.to)).forEach(b => { const [x, y] = b.at;
    const d = D4.find(([dx, dy]) => open(x + dx, y + dy) && L[y + dy][x + dx] < L[y][x] - 1); if (!d) throw new Error('a waterfall with no drop beside it at ' + b.at);
    const face = d[0] > 0 ? 90 : d[0] < 0 ? 270 : d[1] > 0 ? 180 : 0, lx = d[0] ? gx(x + Math.max(0, d[0])) : gcx(x), lz = d[1] ? gz(y + Math.max(0, d[1])) : gcz(y);
    /* the water runs off the high passage's other lane too (a passage is two squares wide): the fall is two squares wide when the lane beside drops the same way */
    const side = d[0] ? [[0, 1], [0, -1]] : [[1, 0], [-1, 0]], two = side.find(([sx, sy]) => open(x + sx, y + sy) && open(x + sx + d[0], y + sy + d[1]) && L[y + sy][x + sx] === L[y][x] && L[y + sy + d[1]][x + sx + d[0]] === L[y + d[1]][x + d[0]]);
    F.push({ k: 'fall', x: r2(lx + (two && d[1] ? two[0] * C / 2 : 0)), z: r2(lz + (two && d[0] ? two[1] * C / 2 : 0)), face, w: two ? 2 * C - 0.4 : C - 0.4, y0: r2(yAt(x, y) + 0.05), y1: yAt(x + d[0], y + d[1]), key: 'water' }); });

/* ── THE OPEN GROUND: every square that is not rock, as `space` rows (greedy rectangles) ── */
const spaces = [];
{ const used = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { if (!room(x, y) || used[y * W + x]) continue;
      let w = 1; while (x + w < W && !used[y * W + x + w] && room(x + w, y)) w++;
      let h = 1; rows: while (y + h < H) { for (let i = 0; i < w; i++) if (used[(y + h) * W + x + i] || !room(x + i, y + h)) break rows; h++; }
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) used[(y + j) * W + x + i] = 1;
      spaces.push({ k: 'space', x: r2(gx(x) + w * C / 2), z: r2(gz(y) + h * C / 2), w: w * C, d: h * C }); } }

/* ── THE DESIGN dresses the room ── */
if (typeof DES.dress === 'function') DES.dress(ctx);
if (typeof DES.people === 'function') DES.people(ctx);

/* ── THE ROOF: per square, the highest floor beside it (a ladder's foot sees the head) + 5.25 m; a chamber's inner squares vault higher
   (`DES.vault`: levels more, by distance from the chamber's edge). One arch row a plot (at the plot's middle), boxes over greedy runs of one
   roof height, up to the crust; stalactites over the open floor ── */
const roofY = []; for (let y = 0; y < H; y++) { roofY.push(new Array(W).fill(null)); for (let x = 0; x < W; x++) { if (!room(x, y)) continue;
    let m = L[y][x]; D4.forEach(([dx, dy]) => { if (room(x + dx, y + dy)) m = Math.max(m, L[y + dy][x + dx]); });
    let v = ym(m) + CEIL;
    if (T[y][x] === 'c') { let e = 0; while (e < 4 && [[1, 0], [-1, 0], [0, 1], [0, -1]].every(([dx, dy]) => inG(x + dx * (e + 1), y + dy * (e + 1)) && T[y + dy * (e + 1)][x + dx * (e + 1)] === 'c')) e++; v += Math.min(e, 3) * (DES.vault != null ? DES.vault : 1.75); }
    roofY[y][x] = r2(v); } }
(DES.roofLift || []).forEach(q => { for (let y = q[1]; y <= q[3]; y++) for (let x = q[0]; x <= q[2]; x++) if (roofY[y] && roofY[y][x] != null) roofY[y][x] = r2(roofY[y][x] + q[4]); });
const TOPY = Math.max.apply(null, [].concat(...roofY).filter(v => v != null)), SH = r2(TOPY + 6);
const TX = Object.assign({ floor: 'hz_stone_02', wall: 'hz_stone_01', dado: 'hz_stone_02', trim: 'hz_stone_01', ceiling: 'hz_stone_01', cliff: 'hz_stone_10', path: 'hz_floor_03', roof: 'hz_stone_01', roofTint: 0x8a8680, drip: 'hz_stone_02' }, DES.tex || {});   /* THE SHEETS: the horror pack's rock, as the new Cavern's (mondo 11-20: "don't use those calm textures"; the plain keys cave_floor / cave_wall / rocks_5 / dirt_2 wear the calm sheets) */
const ROCK = DES.rockTints || [0xd6d2ca, 0xe4e0d8, 0xf0ece4, 0xffffff], grnd = mkRnd(4242 + (DES.seed || 0));
const ROOFS = [];
for (let by = 0; by < H / N; by++) for (let bx = 0; bx < W / N; bx++) {
    const ox = gx(bx * N) + N * C / 2, oz = gz(by * N) + N * C / 2, parts = [], used = new Set();
    for (let ly = 0; ly < N; ly++) for (let lx = 0; lx < N; lx++) { const x = bx * N + lx, y = by * N + ly, v = roofY[y][x]; if (v == null || used.has(x + ',' + y)) continue;
        let w = 1; while (lx + w < N && roofY[y][x + w] === v && !used.has((x + w) + ',' + y)) w++;
        let h = 1; rows: while (ly + h < N) { for (let i = 0; i < w; i++) if (roofY[y + h][x + i] !== v || used.has((x + i) + ',' + (y + h))) break rows; h++; }
        for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) used.add((x + i) + ',' + (y + j));
        parts.push({ s: 'box', p: [r2(gx(x) + w * C / 2 - ox), v, r2(gz(y) + h * C / 2 - oz)], size: [w * C, r2(SH - v + 0.5), h * C], top: false, under: true, key: TX.roof, tint: TX.roofTint, uv: 7 }); }
    if (!parts.length) continue;
    /* stalactites: tapered `cyl` parts hung point down from the roof over the floor (never over a ladder) */
    const sq = []; for (let ly = 0; ly < N; ly++) for (let lx = 0; lx < N; lx++) { const x = bx * N + lx, y = by * N + ly; if (room(x, y) && !ladderSq.has(x + ',' + y)) sq.push([x, y]); }
    const nst = Math.min(DES.stalactites != null ? DES.stalactites : 14, Math.floor(sq.length / 3));
    for (let i = 0; i < nst; i++) { const q = sq[Math.floor(grnd() * sq.length)], top = roofY[q[1]][q[0]], fl = yAt(q[0], q[1]), len = r2(Math.min(0.6 + grnd() * 2.4, Math.max(0.4, top - fl - 2.6))), r = r2(0.18 + grnd() * 0.36);
        parts.push({ s: 'cyl', p: [r2(gcx(q[0]) - ox + (grnd() - 0.5) * 2.4), r2(top - len), r2(gcz(q[1]) - oz + (grnd() - 0.5) * 2.4)], r: 0.03, r2: r, h: len, seg: 6, key: TX.drip, tint: ROCK[Math.floor(grnd() * ROCK.length)], uv: 3.5 }); }
    ROOFS.push({ k: 'arch', id: DES.part + ':roof:' + bx + '_' + by, x: r2(ox), z: r2(oz), rot: 0, base: 0, parts });
}

/* ── THE PAINT: one sheet a square (a district's own: `DES.paint(T char, x, y)` -> index into DES.pal, 0 = the room's floor) ── */
const paint = new Uint8Array(W * H); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) paint[y * W + x] = room(x, y) && DES.paint ? (DES.paint(T[y][x], x, y, ctx) || 0) : 0;

/* ── THE DOORS: each plan door on the room's wall, between its square and the open square beside it along the wall (a passage is two wide) ── */
const DOORS = (PLAN.doors || []).map((d, i) => { const [x, y, side] = d, o = DES.doors[side] || DES.doors[i]; if (!o) throw new Error('the design has no door for the plan\'s way out ' + side + ' (' + d[3] + ')');
    const ns = side === 'N' || side === 'S', nb = ns ? [[x + 1, y], [x - 1, y]].find(q => open(q[0], q[1])) : [[x, y + 1], [x, y - 1]].find(q => open(q[0], q[1]));
    const along = ns ? (nb ? gx(Math.max(x, nb[0])) : gcx(x)) : (nb ? gz(Math.max(y, nb[1])) : gcz(y));
    const out = { id: o.id, wall: side.toLowerCase() }; if (ns) out.x = along; else out.z = along;
    return Object.assign(out, { way: 'trail', leaf: null, label: o.label, sub: o.sub, action: { room: o.room, at: o.at || o.id }, desc: o.desc || '' }); });

/* ── checks ── */
const start = PLAN.start, SPM = { x: gcx(start[0]), z: gcz(start[1]) };
const D = require('./load-data.js').loadGameData();
const CAT = vm.runInContext('DOOR_HQ.catalogue', D), RACES = vm.runInContext('AVAILABLE_RACES', D);
props.forEach(p => { if (!CAT[p.key]) errs.push('not in the catalogue: ' + p.key); const sx = Math.floor((p.x + HX) / C), sy = Math.floor((p.z + HZ) / C); if (!room(sx, sy)) errs.push(p.key + ' stands in the rock at ' + sx + ',' + sy); });
npc.forEach(n => { if (RACES.indexOf(n.race) < 0) errs.push('not a unit: ' + n.race); });
/* THE WALK CHECK, with the blockers: every square the plan walks from its start (no drop, ladders both ways) is still walked with every
   blocker the design stood (a squeeze may narrow a passage to one square; it may never close it) */
{ const lad = {}; STAIRS.forEach(s => { (lad[s.lo + ''] = lad[s.lo + ''] || []).push(s.hi); (lad[s.hi + ''] = lad[s.hi + ''] || []).push(s.lo); });
  const walk = (blk) => { const seen = new Set([start + '']), q = [start];
      for (let i = 0; i < q.length; i++) { const [x, y] = q[i], nx = D4.map(([dx, dy]) => [x + dx, y + dy]).filter(([X, Y]) => open(X, Y) && L[Y][X] === L[y][x]).concat(lad[x + ',' + y] || []);
          nx.forEach(n => { const k = n + ''; if (seen.has(k) || (blk && taken.has(k) && T[n[1]][n[0]] !== 'k')) return; seen.add(k); q.push(n); }); }
      return seen; };
  const a = walk(false), b = walk(true), lost = [...a].filter(k => !b.has(k) && !taken.has(k));
  if (lost.length) errs.push('the blockers cut the walk: ' + lost.length + ' squares no longer reached, e.g. ' + lost.slice(0, 8).join(' ')); }
const LIT = props.filter(p => !p.noLight && CAT[p.key] && (CAT[p.key].light || CAT[p.key].lamp)).length;
if (errs.length) throw new Error('misplaced:\n  ' + errs.join('\n  '));

/* ── the room ── */
const AIR = typeof DES.air === 'function' ? DES.air(ctx) : DES.air;
const BX = W / N, BY = H / N, NAMES = B.PLOTS.map(p => [pid(p.bx, p.by), (DES.names && DES.names[p.bx + ',' + p.by]) || p.name, p.d, p.level - LO]);
const M = 'UG-' + DES.key, Lr = [];
Lr.push("        /* " + M + "-BEGIN — THE UNDERGROUND, " + DES.label + " (2026-11-20, world polish threads 7 + 9 + 10): written by `node bake-underground.js " + NAME + "` from " + DES.plan + " (mondo's OK, 11-20) + docs/areas/underground/" + NAME + ".js. Never hand-edit between the markers. */");
Lr.push("        " + DES.room + ": {");
Lr.push("            label: '" + DES.label + "',");
Lr.push("            sub: '" + DES.sub.replace(/'/g, "\\'") + "',");
Lr.push("            kind: 'box', site: '" + DES.site + "', part: '" + DES.part + "',");
Lr.push("            /* THE ONE WORLD: where this room stands on the world's plot grid (data.js hqOwIndex; the underground's layout, docs/plans/world-polish/plans/underground.js) */");
Lr.push("            world: " + J(DES.world) + ",");
Lr.push("            shell: { w: " + r2(2 * HX) + ", d: " + r2(2 * HZ) + ", h: " + SH + ", wallH: " + SH + ", dadoH: 1.1, open: false,");
Lr.push("                     floor: '" + TX.floor + "', wall: '" + TX.wall + "', dado: '" + TX.dado + "', trim: '" + TX.trim + "', ceiling: '" + TX.ceiling + "', floorColor: 0x8a8278, wallColor: 0x6e675e, dadoColor: 0x585048, ceilColor: 0x2a2622,");
Lr.push("                     pipes: false, strips: false, lights: [], mood: " + J(DES.mood || { light: 0xffc078, ambient: 0.16, hero: false }) + ", plate: { x: " + SPM.x + ", z: " + SPM.z + ", y: " + r2(yAt(start[0], start[1]) + 4.2) + " },");
Lr.push("                     fog: { color: 0x0a0807 }, look: HQ_ROOM_LOOKS.cave,");
Lr.push("                     suns: " + J(DES.suns || []) + (AIR ? ", atmos: " + J(AIR) : "") + " },");
Lr.push("            parti: '" + DES.parti.replace(/'/g, "\\'") + "',");
Lr.push("            typology: 'grid',");
Lr.push("            plots: { cell: " + C + ", plot: " + (N * C) + ", nx: " + BX + ", nz: " + BY + ", names: " + J(NAMES) + " },");
Lr.push("            terrain: {");
Lr.push("                res: 0.875, floor: '" + TX.floor + "', cliff: '" + TX.cliff + "', path: '" + TX.path + "', stairs: 'wood',");
Lr.push("                noise: { amp: 0, scale: 5 }, crag: false, stalactites: false,");
Lr.push("                /* THE GROUND: every square at its plan level (1.75 m a level, 0 = level " + LO + " of the underground's layout, " + r2((LO) * LV) + " m over the Inner Sun) */");
Lr.push("                slope: { cells: { res: " + C + ", x0: " + gx(0) + ", z0: " + gz(0) + ", nx: " + W + ", nz: " + H + ", d: '" + slope.toString('base64') + "' } },");
Lr.push("                paint: { pal: " + J(DES.pal || [TX.path]) + ", t: 'u8', res: " + C + ", x0: " + gcx(0) + ", z0: " + gcz(0) + ", nx: " + W + ", nz: " + H + ", d: '" + Buffer.from(paint).toString('base64') + "' },");
Lr.push("                /* every square that is not a `space` is the rock, up to the crust */");
Lr.push("                gen: { kind: 'plan', look: 'walls', wallKey: '" + TX.wall + "', rim: 0, forceGrow: -0.3 },");
Lr.push("                features: [");
spaces.concat(F, ARCH, ROOFS).forEach(f => Lr.push("                    " + J(f) + ","));
Lr.push("                ],");
Lr.push("            },");
Lr.push("            doors: [");
DOORS.forEach(d => Lr.push("                " + J(d) + ","));
Lr.push("            ],");
Lr.push("            counters: [],");
Lr.push("            props: [");
for (let i = 0; i < props.length; i += 4) Lr.push("                " + props.slice(i, i + 4).map(J).join(", ") + ",");
Lr.push("            ],");
Lr.push("            agents: [],");
Lr.push("            npcSpots: " + J(npc) + ",");
Lr.push("            onlineSpots: [],");
Lr.push("            lines: " + J(DES.lines || []) + ",");
Lr.push("            spawn: { x: " + SPM.x + ", z: " + SPM.z + ", face: " + (DES.spawnFace || 0) + " },");
Lr.push("        },");
Lr.push("        /* " + M + "-END */");
const BLOCK = Lr.join('\n') + '\n';
console.log(DES.room + ' ' + JSON.stringify({ squares: [W, H], plots: B.PLOTS.length, levels: [LO, HI], height: ym(HI), crust: SH, spaces: spaces.length, ladders: STAIRS.length, falls: F.filter(f => f.k === 'fall').length, sumps: F.filter(f => f.k === 'stream').length,
    features: spaces.length + F.length + ARCH.length + ROOFS.length, props: props.length, lights: LIT, natives: npc.length, doors: DOORS.map(d => d.id + '>' + d.action.room.replace('site_prebuilt_', '')).join(' '), kb: Math.round(BLOCK.length / 1024) }));
if (LIT > 10) throw new Error('more than ten lit props (' + LIT + '): the room has ten lights');
if (DRY) process.exit(0);
const file = path.join(REPO, 'data.js'); let src = fs.readFileSync(file, 'utf8');
const END = '        /* ' + M + '-END */\n', b0 = src.indexOf('        /* ' + M + '-BEGIN'), b1 = src.indexOf(END);
if (b0 >= 0 && b1 > b0) src = src.slice(0, b0) + BLOCK + src.slice(b1 + END.length);
else { const at = src.indexOf('        /* CAVERN36-BEGIN'); if (at < 0) throw new Error('no place for the block (the CAVERN36 marker is gone)'); src = src.slice(0, at) + BLOCK + src.slice(at); }
fs.writeFileSync(file, src);
/* ── THE HEIGHT CHECK: the baked room's floor on every open square against the plan's level ── */
{ const S = require('./load-data.js').loadGameData(), info = S.hqTerrainInfo(DES.room); let bad = [], n = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { if (!open(x, y)) continue; n++; const h = S.hqTerrainFeet(info, gcx(x), gcz(y), null), wet = S.hqTerrainFluidAt(info, gcx(x), gcz(y)); if (wet && wet.y > h) continue;   /* a pool the design laid (waded) */
      if (!(Math.abs(h - yAt(x, y)) < 0.05)) bad.push(x + ',' + y + ' plan ' + yAt(x, y) + ' baked ' + (h == null ? h : r2(h))); }
  console.log('THE HEIGHT CHECK: ' + n + ' open squares, ' + bad.length + ' off their level' + (bad.length ? ':\n  ' + bad.slice(0, 20).join('\n  ') : ''));
  if (bad.length) process.exitCode = 1; }
