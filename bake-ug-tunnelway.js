#!/usr/bin/env node
/* bake-ug-tunnelway.js — THE UNDERGROUND, THE TUNNEL-WAY (2026-11-20, world polish threads 7 + 9 + 10, the Tunnel-Way's build thread).
   mondo 11-20 on the underground: "This should be the most dungeon and labyrinth like ... we need victory road. labyrinth, height diffs,
   cliffs, drops waterfalls, underground horror like the descent movie"; the whole-underground layout and this district's square plan are
   APPROVED (11-20: "Yes this is good, go ahead and start individual threads"; "No real underground waterfall for now").

   Writes ONE compact room, `site_prebuilt_hollow_earth_ow_tunnelway` (5 x 5 plots, 60 x 60 squares, 210 m a side), from the approved plan
   docs/plans/world-polish/plans/ug-tunnel-way.js SQUARE FOR SQUARE (it is read through draw-plan.js `build`, so the room is what the plan
   says), into data.js between UG-TUNNELWAY-BEGIN / UG-TUNNELWAY-END. It REPLACES the long corridor room bake-cavern.js wrote under the same
   id (the old Tunnel-Way Tunnel, the Cells Tunnel and the Bone Passage, 34 plots of corridor): the id is kept so every door, link and list
   that names the room (the Cavern's, the Sewers' and the Catacombs' seam doors, the ladder from Dead Man's Cave, the zone lists) lands in
   the new room; bake-cavern.js no longer writes it (its ROOMS row is `skip: true`).
       node bake-ug-tunnelway.js            writes data.js
       node bake-ug-tunnelway.js --dry-run  prints the counts and the checks
       UGT_DUMP=1                           prints the walked map
   THE ROOM:
   - THE HEIGHT SHEET (`terrain.slope.cells`, one height a square): an open square of the plan stands at its level ((level − 114) x 1.75 m:
     the lowest pit, 114, is the room's 0); a closed square of the plan is the ROCK, raised to its plot's roof (and 4 m over any open floor
     beside it), so the passages are cut in solid rock. Two open squares a level or more apart are a LEDGE / a CLIFF (walked off, down only).
   - THE ROOF: every plot wears one block of rock from its roof line up to the room's top (drawn only): a junction 4.2 m over the highest floor
     in it, a chamber 7 m. So a passage is low and a chamber is a hall, and nothing is ever open to the sky.
   - THE LADDERS: every `stairs` pair of the plan is a `climb` row (both ways): a timber ladder; out of a pit a rope; the plan's FOUND ways
     ("a chimney beside the ladder") are a rock chimney (`look: 'wall'`) on the passage's other square; a free climb up a cliff the same.
   - THE WATER: a `w` square is a shallow sump in a niche under a weeping wall (no river, mondo 11-20): its floor 0.55 m under the floor
     beside it, a still pool on it, drips over it.
   - THE DOORS: the plan's five ways out, at the plan's squares: N the Catacombs (`ow_v_m7_m4`), E the Sewers' Holding Cells (`ow_v_1_1`), S the
     Cavern (`ow_h_m4_10`), W the Long Tunnel (`ug_tw_long`, new: the Long Tunnel's thread builds its end), and the shaft up into Dead Man's
     Cave (data.js DOOR_HQ.links `tunnelway_cavern`, end b: this tool checks it).
   - WHAT STANDS IN IT: docs/areas/underground/tunnel-way/room.js (`names`, `dress(a)`, `airZones`), in the room's own squares.
   Notes: docs/notes/areas-complexes.md "THE UNDERGROUND, THE TUNNEL-WAY". */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const REPO = __dirname, DRY = process.argv.includes('--dry-run');
const DP = require('./docs/plans/world-polish/draw-plan.js'), PLAN = require('./docs/plans/world-polish/plans/ug-tunnel-way.js');
const ROOMDES = require('./docs/areas/underground/tunnel-way/room.js');
const B = DP.build(PLAN);
DP.check(B, { noRoom: true }); if (B.FAIL.length) throw new Error('the plan does not pass draw-plan.js: ' + B.FAIL.join(' | '));
const ROOM = 'site_prebuilt_hollow_earth_ow_tunnelway', SITE = 'prebuilt_hollow_earth', PART = 'ow_tunnelway';
const C = 3.5, N = B.N, W = B.W, H = B.H, HX = W * C / 2, HZ = H * C / 2, LEVEL = 1.75, ZL = 114;
const WORLD = { wx: -8, wy: 1 };   // the box -8..-4 x 1..5: plot 1,1 (the shaft) stands at world -7,2, under Dead Man's Cave's Tunnel Way
const r2 = v => Math.round(v * 100) / 100, gx = c => r2(-HX + c * C), gz = c => r2(-HZ + c * C), gcx = c => r2(-HX + (c + 0.5) * C), gcz = c => r2(-HZ + (c + 0.5) * C);
const J = v => JSON.stringify(v).replace(/"([a-zA-Z_][a-zA-Z0-9_]*)":/g, '$1:').replace(/'/g, "\\'").replace(/"/g, "'");
const mkRnd = s => { let v = s >>> 0; return () => { v = (v * 1664525 + 1013904223) >>> 0; return v / 4294967296; }; };
const D = require('./load-data.js').loadGameData();
const CAT = vm.runInContext('DOOR_HQ.catalogue', D), RACES = vm.runInContext('AVAILABLE_RACES', D);
const T = B.T, L = B.L, inB = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
const isWater = (x, y) => inB(x, y) && T[y][x] === 'w';
const isOpen = (x, y) => inB(x, y) && B.isOpen(x, y);                  // walked ground (the landmark square `k` too: its column stands on it)
const hOf = lv => r2((lv - ZL) * LEVEL);
const plotOf = (x, y) => B.plotOf(x, y);
const count = {};

/* ── THE PLOTS: their roofs (a chamber is a hall, a junction a low passage) ── */
const PL = B.PLOTS.map(p => { const o = { bx: p.bx, by: p.by, level: p.level, chamber: !!(p.f && p.f.flat), max: -1e9 };
    for (let y = p.by * N; y < (p.by + 1) * N; y++) for (let x = p.bx * N; x < (p.bx + 1) * N; x++) if (isOpen(x, y) || isWater(x, y)) o.max = Math.max(o.max, L[y][x]);
    o.roof = r2(hOf(o.max) + (o.chamber ? 7.0 : 4.2)); return o; });
const PLAT = {}; PL.forEach(p => { PLAT[p.bx + ',' + p.by] = p; });
const plotRec = (x, y) => PLAT[Math.floor(x / N) + ',' + Math.floor(y / N)];
const TOP = r2(Math.max.apply(null, PL.map(p => p.roof)) + 3);

/* ── THE FLOOR OF EVERY SQUARE (m) ── */
const FL = []; for (let y = 0; y < H; y++) { FL.push(new Array(W).fill(null)); for (let x = 0; x < W; x++) if (isOpen(x, y)) FL[y][x] = hOf(L[y][x]); }
/* a sump: 0.55 m under the highest open floor beside it (so you step in and out of it) */
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (isWater(x, y)) { let top = -1e9;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (FL[y + dy] && FL[y + dy][x + dx] != null && isOpen(x + dx, y + dy)) top = Math.max(top, FL[y + dy][x + dx]);
    if (top < -1e8) top = hOf(L[y][x] + 1); FL[y][x] = r2(top - 0.55); }
/* the rock: up to its plot's roof, and 4 m over any floor beside it */
const ROCKH = []; for (let y = 0; y < H; y++) { ROCKH.push(new Array(W).fill(null)); for (let x = 0; x < W; x++) { if (FL[y][x] != null) continue; let h = plotRec(x, y).roof + 0.3;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (FL[y + dy] && FL[y + dy][x + dx] != null) h = Math.max(h, FL[y + dy][x + dx] + 4.0);
    ROCKH[y][x] = r2(Math.min(h, TOP)); } }
const slope = Buffer.alloc(W * H * 8);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const h = FL[y][x] != null ? FL[y][x] : ROCKH[y][x], o = (y * W + x) * 8; for (let k = 0; k < 4; k++) slope.writeInt16LE(Math.round(h * 100), o + k * 2); }

/* ── THE CLIMBS: the plan's stairs (ladders; a pit's: a rope), its found ways (a rock chimney beside the ladder, a free climb up a cliff) ── */
const PITS = new Set((PLAN.branches || []).filter(b => b.kind === 'dead end').map(b => b.at.join(',')));
const FACE_OF = (dx, dy) => dx === 1 ? 90 : dx === -1 ? 270 : dy === 1 ? 180 : 0;   // the climber faces the rock (the higher square): 0 = north
const CLIMBS = [], CL_EDGES = [];
function climb(lo, hi, look, id) {
    const dx = hi[0] - lo[0], dy = hi[1] - lo[1]; if (Math.abs(dx) + Math.abs(dy) !== 1) throw new Error('a climb between squares that do not touch: ' + lo + ' ' + hi);
    if (!(FL[lo[1]][lo[0]] != null && FL[hi[1]][hi[0]] != null)) throw new Error('a climb off the floor: ' + lo + ' ' + hi);
    if (FL[hi[1]][hi[0]] - FL[lo[1]][lo[0]] < 0.9) throw new Error('a climb that does not rise: ' + lo + ' ' + hi);
    /* on the line between the squares, 0.6 m back into the lower square (past the face's lattice cell: the head is found over the edge) */
    const ex = gcx(lo[0]) + dx * (C / 2 - 0.6), ez = gcz(lo[1]) + dy * (C / 2 - 0.6);
    CLIMBS.push({ k: 'climb', id, x: r2(ex), z: r2(ez), face: FACE_OF(dx, dy), look }); CL_EDGES.push([lo, hi]); }
const higher = (a, b) => FL[a[1]][a[0]] > FL[b[1]][b[0]] ? [b, a] : [a, b];
(PLAN.stairs || []).forEach((s, i) => { const [lo, hi] = higher(s[0], s[1]); const pit = PITS.has(s[0].join(',')) || PITS.has(s[1].join(','));
    climb(lo, hi, pit ? 'rope' : 'ladder', 'ugt:' + (pit ? 'rope' : 'ladder') + i); });
/* the found ways: a chimney on the passage's OTHER square beside the ladder (the same two levels), else on the ladder's own line (skipped) */
(PLAN.found || []).forEach((f, i) => { const [lo, hi] = higher(f.from, f.to), dx = hi[0] - lo[0], dy = hi[1] - lo[1];
    const isStair = (PLAN.stairs || []).some(s => (s[0].join() === lo.join() && s[1].join() === hi.join()) || (s[1].join() === lo.join() && s[0].join() === hi.join()));
    if (!isStair) { climb(lo, hi, 'wall', 'ugt:free' + i); return; }
    for (const [px, py] of [[dy, dx], [-dy, -dx]]) { const a = [lo[0] + px, lo[1] + py], b = [hi[0] + px, hi[1] + py];
        if (!inB(a[0], a[1]) || !inB(b[0], b[1]) || FL[a[1]][a[0]] == null || FL[b[1]][b[0]] == null || !isOpen(a[0], a[1]) || !isOpen(b[0], b[1])) continue;
        if (Math.abs(FL[a[1]][a[0]] - FL[lo[1]][lo[0]]) > 0.01 || Math.abs(FL[b[1]][b[0]] - FL[hi[1]][hi[0]]) > 0.01) continue;
        climb(a, b, 'wall', 'ugt:chimney' + i); return; }
    count.chimneysOnLine = (count.chimneysOnLine || 0) + 1; });
count.climbs = CLIMBS.length;

/* ── THE OPEN GROUND as `space` rows (greedy rectangles, one level each) ── */
const spaces = []; { const used = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { if (FL[y][x] == null || used[y * W + x]) continue; const h = FL[y][x], same = (X, Y) => inB(X, Y) && FL[Y][X] === h && !used[Y * W + X];
      let w = 1; while (same(x + w, y)) w++; let d = 1; rows: while (y + d < H) { for (let i = 0; i < w; i++) if (!same(x + i, y + d)) break rows; d++; }
      for (let j = 0; j < d; j++) for (let i = 0; i < w; i++) used[(y + j) * W + x + i] = 1;
      spaces.push({ k: 'space', x: r2(gx(x) + w * C / 2), z: r2(gz(y) + d * C / 2), w: r2(w * C), d: r2(d * C) }); } }

/* ── THE WATER: each run of sump squares is a still pool on its floor (stream rows ride the sheet: `y` over the ground there) ── */
const WATER = []; { const used = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { if (!isWater(x, y) || used[y * W + x]) continue; let w = 1; while (isWater(x + w, y) && !used[y * W + x + w]) w++;
      let d = 1; rows: while (y + d < H) { for (let i = 0; i < w; i++) if (!isWater(x + i, y + d) || used[(y + d) * W + x + i]) break rows; d++; }
      for (let j = 0; j < d; j++) for (let i = 0; i < w; i++) used[(y + j) * W + x + i] = 1;
      const v = d >= w; WATER.push({ k: 'stream', pts: v ? [[r2(gx(x) + w * C / 2), r2(gz(y) + 0.6)], [r2(gx(x) + w * C / 2), r2(gz(y + d) - 0.6)]] : [[r2(gx(x) + 0.6), r2(gz(y) + d * C / 2)], [r2(gx(x + w) - 0.6), r2(gz(y) + d * C / 2)]],
          w: r2((v ? w : d) * C), y: 0.45, depth: 0.45, _sq: [x, y, w, d] }); } }
count.pools = WATER.length;

/* ── THE ROCK OVERHEAD: each plot's block from its roof to the top, stalactites hung from it over the open floor ── */
const ROOF = [], grnd = mkRnd(1307), RTINT = [0x4a443e, 0x433d37, 0x50483f, 0x3c3732];
PL.forEach((p, i) => { const ox = gx(p.bx * N) + N * C / 2, oz = gz(p.by * N) + N * C / 2, parts = [];
    parts.push({ s: 'box', p: [0, p.roof, 0], size: [N * C, r2(TOP - p.roof), N * C], top: false, under: true, key: 'cave_wall', tint: RTINT[i % RTINT.length], uv: 7 });
    const sq = []; for (let ly = 0; ly < N; ly++) for (let lx = 0; lx < N; lx++) { const x = p.bx * N + lx, y = p.by * N + ly; if (FL[y][x] != null && !isWater(x, y)) sq.push([x, y]); }
    const n = Math.min(p.chamber ? 18 : 8, Math.floor(sq.length / 4));
    for (let k = 0; k < n; k++) { const q = sq[Math.floor(grnd() * sq.length)], room = p.roof - FL[q[1]][q[0]], len = r2(0.6 + grnd() * Math.min(p.chamber ? 3.6 : 1.4, room - 2.6)), r = r2(0.18 + grnd() * (p.chamber ? 0.5 : 0.28));
        if (len < 0.5) continue;
        parts.push({ s: 'cyl', p: [r2(gcx(q[0]) - ox + (grnd() - 0.5) * 2.2), r2(p.roof - len), r2(gcz(q[1]) - oz + (grnd() - 0.5) * 2.2)], r: 0.03, r2: r, h: len, seg: 6, key: 'cave_wall', tint: RTINT[Math.floor(grnd() * 4)], uv: 3.5 }); }
    ROOF.push({ k: 'arch', id: 'ugt:roof:' + p.bx + '_' + p.by, x: r2(ox), z: r2(oz), y: 0, rot: 0, parts }); });

/* ── THE DOORS (the plan's `doors`; a wall door on the room's wall, the shaft a free spot) ── */
const DOOR_ROWS = { N: { id: 'ow_v_m7_m4', leaf: 'leaf_frame_only', label: 'THE CATACOMBS', sub: 'THE BONE PASSAGE · UP INTO THE CATACOMBS', room: 'site_prebuilt_vatican_under', desc: 'Bones packed into the walls all the way up. Somebody stacked them.' },
    E: { id: 'ow_v_1_1', leaf: 'leaf_cell', label: 'DISASTER CITY · THE SEWERS', sub: 'THE CELLS TUNNEL · INTO THE GUARDROOM', room: 'site_prebuilt_downtown_underworld', desc: 'A gaol\'s drain, bricked once, broken through from this side.' },
    S: { id: 'ow_h_m4_10', leaf: null, label: 'THE CAVERN', sub: 'THE TUNNEL-WAY · DOWN TO THE CAVERN', room: 'site_prebuilt_hollow_earth_cavern', desc: 'The rock goes on down. It is warmer that way.' },
    W: { id: 'ug_tw_long', leaf: null, label: 'THE LONG TUNNEL', sub: 'THE TUNNEL-WAY · WEST, AND DOWN', room: 'site_prebuilt_hollow_earth_ow_long', desc: 'A long way down in the dark, west.' } };
const doors = [], DOORSQ = {};
(PLAN.doors || []).forEach(d => { const [x, y, side, , lv] = d; if (FL[y][x] == null) throw new Error('a door off the floor: ' + d);
    if (Math.abs(FL[y][x] - hOf(lv)) > 0.01) throw new Error('a door off its level: ' + d);
    const onWall = (side === 'N' && y === 0) || (side === 'S' && y === H - 1) || (side === 'W' && x === 0) || (side === 'E' && x === W - 1);
    if (!onWall) { DOORSQ.shaft = [x, y]; return; }   // the shaft (the link's end b)
    const R = DOOR_ROWS[side], o = { id: R.id, wall: side.toLowerCase() };
    if (side === 'N' || side === 'S') o.x = gx(x + 1); else o.z = gz(y + 1);   // the middle of the two-square passage
    Object.assign(o, { way: 'trail', leaf: R.leaf, label: R.label, sub: R.sub, action: { room: R.room, at: R.id }, desc: R.desc }); doors.push(o); DOORSQ[side] = [x, y]; });
if (!DOORSQ.shaft) throw new Error('the plan has no shaft door');
const SHAFT = { x: gx(DOORSQ.shaft[0] + 1), z: gcz(DOORSQ.shaft[1]), face: 180 };   // on the junction's north edge, between its two squares, facing in

/* ── THE DESIGN: what stands in the room (docs/areas/underground/tunnel-way/room.js) ── */
const props = [], feats = [], npc = [], taken = new Map();
const blocked = new Set(); CL_EDGES.forEach(e => { blocked.add(e[0].join(',')); blocked.add(e[1].join(',')); });
Object.keys(DOORSQ).forEach(k => { const [x, y] = DOORSQ[k]; for (let dy = -1; dy <= 2; dy++) for (let dx = -1; dx <= 2; dx++) blocked.add((x + dx) + ',' + (y + dy)); });
const A = { C, N, W, H, LEVEL, r2, gx, gz, gcx, gcz, mkRnd, PLAN, B, PL, plotRec, TOP,
    open: (x, y) => inB(x, y) && FL[y][x] != null && !isWater(x, y) && T[y][x] !== 'k', water: isWater, floor: (x, y) => inB(x, y) ? FL[y][x] : null, rock: (x, y) => inB(x, y) && FL[y][x] == null,
    level: (x, y) => inB(x, y) ? L[y][x] : null, landmark: (x, y) => inB(x, y) && T[y][x] === 'k', keep: (x, y) => blocked.has(x + ',' + y),
    /* a piece on an open square (blocking ones never on a ladder's squares or a door's, and never two on one square) */
    P: (key, sx, sy, o) => { if (!CAT[key]) throw new Error('room.js: not in the catalogue: ' + key); o = Object.assign({}, o);
        const onRock = !!o.rock; delete o.rock;
        if (onRock ? !(inB(sx, sy) && FL[sy][sx] == null) : !(inB(sx, sy) && FL[sy][sx] != null)) throw new Error('room.js: ' + key + (onRock ? ' not in the rock' : ' not on the floor') + ' at ' + sx + ',' + sy);
        const blocks = !!CAT[key].block && !o.noBlock; if (blocks && blocked.has(sx + ',' + sy)) throw new Error('room.js: ' + key + ' blocks a ladder or a door at ' + sx + ',' + sy);
        if (blocks) { if (taken.has(sx + ',' + sy)) throw new Error('room.js: two blockers on ' + sx + ',' + sy + ' (' + taken.get(sx + ',' + sy) + ', ' + key + ')'); taken.set(sx + ',' + sy, key); }
        const p = Object.assign({ key, x: r2(gcx(sx) + (o.dx || 0)), z: r2(gcz(sy) + (o.dz || 0)) }, o); delete p.dx; delete p.dz;
        if (onRock && p.y == null) p.y = FL[sy][sx] != null ? FL[sy][sx] : ROCKH[sy][sx];
        props.push(p); return p; },
    feat: f => { feats.push(f); return f; },
    native: (race, sx, sy, face, say) => { if (RACES.indexOf(race) < 0) throw new Error('not a unit: ' + race); if (!(inB(sx, sy) && FL[sy][sx] != null && !isWater(sx, sy))) throw new Error('room.js: ' + race + ' off the floor at ' + sx + ',' + sy);
        const n = { x: gcx(sx), z: gcz(sy), face: face || 0, race }; if (say) n.say = say; npc.push(n); },
    blockers: () => taken };
ROOMDES.dress(A);
count.props = props.length; count.designRows = feats.length;

/* ── THE WALK CHECK: every floor square is reached from the spawn, and the spawn from every floor square (every climb two-way, a ledge down only) ── */
const SP = ROOMDES.spawn;
{ const stood = sq => { const k = sq.join(','); return taken.has(k); };
  const walkable = (x, y) => inB(x, y) && FL[y][x] != null && T[y][x] !== 'k' && !stood([x, y]);
  const LK = new Map(); CL_EDGES.forEach(([a, b]) => { const ka = a[1] * W + a[0], kb = b[1] * W + b[0]; (LK.get(ka) || LK.set(ka, []).get(ka)).push(b); (LK.get(kb) || LK.set(kb, []).get(kb)).push(a); });
  const step = (x, y, X, Y) => walkable(X, Y) && FL[Y][X] - FL[y][x] <= 0.62;   // up a step, or down any drop
  const reach = (start, fwd) => { const seen = new Uint8Array(W * H), st = [start]; seen[start[1] * W + start[0]] = 1;
      while (st.length) { const [x, y] = st.pop(); (LK.get(y * W + x) || []).forEach(q => { if (!seen[q[1] * W + q[0]] && walkable(q[0], q[1])) { seen[q[1] * W + q[0]] = 1; st.push(q); } });
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + dx, Y = y + dy; if (!inB(X, Y) || seen[Y * W + X] || !walkable(X, Y)) continue;
              if (fwd ? !step(x, y, X, Y) : !step(X, Y, x, y)) continue; seen[Y * W + X] = 1; st.push([X, Y]); } }
      return seen; };
  if (!walkable(SP[0], SP[1])) throw new Error('the spawn is not on the floor');
  const fw = reach(SP, true), bk = reach(SP, false), lost = [], trap = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (walkable(x, y)) { if (!fw[y * W + x]) lost.push(x + ',' + y); else if (!bk[y * W + x]) trap.push(x + ',' + y); }
  if (process.env.UGT_DUMP) console.log(FL.map((r, y) => r.map((h, x) => h == null ? '#' : isWater(x, y) ? '~' : !walkable(x, y) ? 'X' : !fw[y * W + x] ? '!' : !bk[y * W + x] ? 'T' : String.fromCharCode(97 + Math.max(0, Math.min(25, L[y][x] - ZL)))).join('')).join('\n'));
  if (lost.length) throw new Error('floor not reached from the spawn: ' + lost.slice(0, 30).join(' '));
  if (trap.length) throw new Error('floor you cannot walk back from (a trap): ' + trap.slice(0, 30).join(' '));
  Object.keys(DOORSQ).forEach(k => { const q = DOORSQ[k]; if (!fw[q[1] * W + q[0]]) throw new Error('the ' + k + ' door is not reached'); });
  count.floorSquares = 0; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (walkable(x, y)) count.floorSquares++; }

/* ── THE PAINT (a sheet a square): the design's `paint(x, y)` or the cave floor ── */
const PAL = ROOMDES.palette, paint = new Uint8Array(W * H);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) paint[y * W + x] = ROOMDES.paint(A, x, y) || 0;

/* ── the air: drips over the sumps, the design's own zones ── */
const AIR = WATER.map(w => { const [x, y, ww, d] = w._sq; return { x0: gx(x), z0: gz(y), x1: gx(x + ww), z1: gz(y + d), kind: 'rain', color: 0x9fb4c0, n: 14, speed: 0.6 }; })
    .concat((ROOMDES.airZones ? ROOMDES.airZones(A) : []).map(z => ({ x0: gx(z.sx0), z0: gz(z.sy0), x1: gx(z.sx1), z1: gz(z.sy1), kind: z.kind, color: z.color, n: z.n, speed: z.speed })));
WATER.forEach(w => { delete w._sq; });

/* ── the room ── */
const names = B.PLOTS.map(p => { const nm = (ROOMDES.names || {})[p.bx + ',' + p.by] || p.name; return ['P0' + p.bx + '-0' + p.by, nm, 'T', p.level]; });
const SPM = { x: gcx(SP[0]), z: gcz(SP[1]) };
const Lq = [];
Lq.push("        /* UG-TUNNELWAY-BEGIN — THE UNDERGROUND, THE TUNNEL-WAY (2026-11-20, world polish threads 7 + 9 + 10): written by `node bake-ug-tunnelway.js` from the approved plan docs/plans/world-polish/plans/ug-tunnel-way.js + docs/areas/underground/tunnel-way/room.js. It replaces the old corridor room of the same id (bake-cavern.js no longer writes it). Never hand-edit between the markers; edit the plan, the design or the tool and rerun. */");
Lq.push("        " + ROOM + ": {");
Lq.push("            label: 'THE TUNNEL-WAY',");
Lq.push("            sub: 'THE LABYRINTH UNDER DEAD MAN\\'S CAVE · THE BONE PASSAGE · THE CELLS TUNNEL · DOWN TO THE CAVERN',");
Lq.push("            kind: 'box', site: '" + SITE + "', part: '" + PART + "',");
Lq.push("            /* THE ONE WORLD: where this room stands on the world's plot grid (data.js hqOwIndex) */");
Lq.push("            world: { hub: 'cavern', layer: 'under', wx: " + WORLD.wx + ", wy: " + WORLD.wy + " },");
Lq.push("            shell: { w: " + (W * C) + ", d: " + (H * C) + ", h: " + r2(TOP + 1) + ", wallH: " + r2(TOP + 1) + ", dadoH: 1.1, open: false,");
Lq.push("                     floor: 'cave_floor', wall: 'cave_wall', dado: 'rocks_dark_fantasy', trim: 'rock_wall_2', ceiling: 'cave_wall', floorColor: 0x8a8278, wallColor: 0x5e5850, dadoColor: 0x4a443c, ceilColor: 0x1e1b18,");
Lq.push("                     pipes: false, strips: false, lights: [], mood: { light: 0xffb060, ambient: " + ROOMDES.ambient + ", hero: false }, plate: { x: " + SPM.x + ", z: " + SPM.z + ", y: " + r2(FL[SP[1]][SP[0]] + 4.2) + " },");
Lq.push("                     fog: { color: 0x07060a, density: " + ROOMDES.fog + " }, look: HQ_ROOM_LOOKS.cave,");
Lq.push("                     suns: []" + (AIR.length ? ", atmos: " + J({ kind: 'none', zones: AIR }) : "") + " },");
Lq.push("            parti: '" + ROOMDES.parti.replace(/'/g, "\\'") + "',");
Lq.push("            typology: 'grid',");
Lq.push("            plots: { cell: " + C + ", plot: " + (N * C) + ", nx: 5, nz: 5, names: " + J(names) + " },");
Lq.push("            terrain: {");
Lq.push("                res: 0.875, floor: 'cave_floor', cliff: 'rocks_5', path: 'dirt_2', stairs: 'wood',");
Lq.push("                noise: { amp: 0.05, scale: 4 }, crag: false, stalactites: false,");
Lq.push("                /* THE HEIGHT SHEET: the plan's levels square by square ((level - 114) x 1.75 m); the rock is the sheet, raised to the roofs */");
Lq.push("                slope: { cells: { res: " + C + ", x0: " + gx(0) + ", z0: " + gz(0) + ", nx: " + W + ", nz: " + H + ", d: '" + slope.toString('base64') + "' } },");
Lq.push("                paint: { pal: " + J(PAL) + ", t: 'u8', res: " + C + ", x0: " + gcx(0) + ", z0: " + gcz(0) + ", nx: " + W + ", nz: " + H + ", d: '" + Buffer.from(paint).toString('base64') + "' },");
Lq.push("                features: [");
spaces.concat(WATER, CLIMBS, ROOF, feats).forEach(f => Lq.push("                    " + J(f) + ","));
Lq.push("                ],");
Lq.push("            },");
Lq.push("            doors: [");
doors.forEach(d => Lq.push("                " + J(d) + ","));
Lq.push("            ],");
Lq.push("            counters: [],");
Lq.push("            props: [");
for (let i = 0; i < props.length; i += 4) Lq.push("                " + props.slice(i, i + 4).map(J).join(", ") + ",");
Lq.push("            ],");
Lq.push("            agents: [],");
Lq.push("            npcSpots: " + J(npc) + ",");
Lq.push("            onlineSpots: [],");
Lq.push("            lines: " + J(ROOMDES.lines || []) + ",");
Lq.push("            spawn: { x: " + SPM.x + ", z: " + SPM.z + ", face: " + (ROOMDES.spawnFace || 0) + " },");
Lq.push("        },");
Lq.push("        /* UG-TUNNELWAY-END */");
const BLOCK = Lq.join('\n') + '\n';
Object.assign(count, { spaces: spaces.length, roofs: ROOF.length, doors: doors.length, top: TOP, natives: npc.length, kb: Math.round(BLOCK.length / 1024) });
console.log(JSON.stringify(count));

/* the rows in data.js that name a place in this room (written by hand there): the tool refuses to bake when one has drifted */
const WANT = [["b: { site: '" + SITE + "', part: '" + PART + "', wall: 'free', x: " + SHAFT.x + ", z: " + SHAFT.z + ", face: " + SHAFT.face + ",", 'link tunnelway_cavern (end b)']];
const file = path.join(REPO, 'data.js'); let src = fs.readFileSync(file, 'utf8');
const flat = src.replace(/ +/g, ' '), missing = WANT.filter(w => flat.indexOf(w[0]) < 0);
if (missing.length) { console.log('data.js rows to write by hand:'); missing.forEach(w => console.log('  ' + w[1] + ':  ' + w[0])); if (!DRY) throw new Error('data.js does not point at this room yet (see the rows above)'); }
if (DRY) process.exit(0);
const END = '        /* UG-TUNNELWAY-END */\n', b0 = src.indexOf('        /* UG-TUNNELWAY-BEGIN'), b1 = src.indexOf(END);
if (b0 >= 0 && b1 > b0) src = src.slice(0, b0) + BLOCK + src.slice(b1 + END.length);
else { const at = src.indexOf('        /* CAVERN36-END */\n'); if (at < 0) throw new Error('neither the UG-TUNNELWAY markers nor CAVERN36-END in data.js');
    if (/\n        site_prebuilt_hollow_earth_ow_tunnelway: \{/.test(src.slice(src.indexOf('        /* CAVERN36-BEGIN'), at))) throw new Error('bake-cavern.js still writes the old room: rerun it first (its T row is skip: true)');
    const p = at + '        /* CAVERN36-END */\n'.length; src = src.slice(0, p) + BLOCK + src.slice(p); }
fs.writeFileSync(file, src);
console.log('wrote ' + ROOM + ' into data.js');
