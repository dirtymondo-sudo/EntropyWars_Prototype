#!/usr/bin/env node
/* bake-woods.js — THE WOODS ON PLOTS (2026-11-15, mondo: "Go ahead and pilot the woods"; his OK on the plot plan 14:51 UTC).
   The first area after Disaster City built from 12 x 12 plots: 6 x 6 plots of 42 m (252 m a side), four districts of nine.
   Reads docs/areas/woods/layout.json (the plan he approved: every plot's name, district, level, and the 72 x 72 square map)
   and writes the room `site_prebuilt_fairy_forest_plots` into data.js between WOODS36-BEGIN / WOODS36-END.
   `node bake-woods.js` writes; `--dry-run` prints the counts only. Never hand-edit between the markers: edit this tool or the layout.
   Notes: docs/notes/areas-complexes.md "THE WOODS ON PLOTS". */
'use strict';
const fs = require('fs'), path = require('path');
const REPO = __dirname, DRY = process.argv.includes('--dry-run');
const PLAN = JSON.parse(fs.readFileSync(path.join(REPO, 'docs/areas/woods/layout.json'), 'utf8'));
const C = 3.5, N = 12, G = 6, W = N * G, PL = N * C, HALF = W * C / 2, LEVEL = 1.75;
const r2 = v => Math.round(v * 100) / 100;
const gx = c => r2(-HALF + c * C), gc = c => r2(-HALF + (c + 0.5) * C);          // a square's west/north line, its middle
const cell = PLAN.cells.map(r => r.split(''));
const plot = {}; PLAN.plots.forEach(p => { p.x = +p.id.slice(1, 3); p.y = +p.id.slice(4, 6); plot[p.id] = p; });
const P = (x, y) => plot['P0' + x + '-0' + y];
const at = (id, lx, ly) => [plot[id].x * N + lx, plot[id].y * N + ly];           // a plot-local square → the room's square
const open = (cx, cy) => cx >= 0 && cy >= 0 && cx < W && cy < W && cell[cy][cx] !== 't';
const features = [], props = [], doors = [], npc = [], count = {};
/* a seeded roll (the room is the same every bake) */
let seed = 36; const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };

/* ── THE WAYS OUT: a door on the room's wall, and the path carried to it (whole squares, two wide) ── */
function carve(cx, cy, ch) { for (const [dx, dy] of [[0, 0], [1, 0]]) { const x = cx + dx; if (x >= 0 && x < W && cy >= 0 && cy < W && cell[cy][x] === 't') cell[cy][x] = ch || 'p'; } }
function carveV(cx, cy) { for (const dy of [0, 1]) { const y = cy + dy; if (y >= 0 && y < W && cell[y][cx] === 't') cell[y][cx] = 'p'; } }
function spur(id, wall) {   // from the plot's nearest open square straight to the wall; returns the door's place along it (m)
    const p = plot[id], x0 = p.x * N, y0 = p.y * N; let best = null;
    for (let ly = 0; ly < N; ly++) for (let lx = 0; lx < N; lx++) { if (!open(x0 + lx, y0 + ly)) continue;
        const d = wall === 'w' ? lx : wall === 'e' ? N - 1 - lx : wall === 'n' ? ly : N - 1 - ly; if (!best || d < best[0]) best = [d, lx, ly]; }
    const lx = best[1], ly = best[2];
    if (wall === 'w') for (let x = 0; x <= lx; x++) carveV(x0 + x, y0 + Math.min(ly, N - 2));
    if (wall === 'e') for (let x = lx; x < N; x++) carveV(x0 + x, y0 + Math.min(ly, N - 2));
    if (wall === 'n') for (let y = 0; y <= ly; y++) carve(x0 + Math.min(lx, N - 2), y0 + y);
    if (wall === 's') for (let y = ly; y < N; y++) carve(x0 + Math.min(lx, N - 2), y0 + y);
    return (wall === 'w' || wall === 'e') ? gx(y0 + Math.min(ly, N - 2) + 1) : gx(x0 + Math.min(lx, N - 2) + 1);   // the line between the two squares
}
function door(id, plotId, wall, o) { const a = spur(plotId, wall); doors.push(Object.assign({ id, wall }, (wall === 'w' || wall === 'e') ? { z: a } : { x: a }, o)); }
/* THE OLD ROOMS ARE RETIRED (2026-11-15, data.js DOOR_HQ.retired): the trail back to the old Clearing went. In its place the hollow tree (the old Clearing's
   `forest` door, DOOR_HQ.siteRooms.entry's bay door): the way back to Room 420 */
door('forest', 'P02-05', 's', { way: 'hollowtree', label: 'THE FAIRY FOREST', sub: 'THE HOLLOW TREE · BACK · ROOM 420', action: { room: 'site_prebuilt_fairy_forest', at: 'woods' },
    desc: 'The path back between two trees that lean in to hear you go. The forest proper is that way, and the crossing console, and the door that objected.' });
/* the trail west to Camelot is the LINK `woods_camelot` (data.js DOOR_HQ.links, a two-way door at w, z 3.5); the HQ Stair is the LINK `woods_stair`: only the path is cut here */
{ const z = spur('P00-03', 'w'); if (z !== 3.5) throw new Error('the Camelot trail moved to z ' + z + ': move the woods_camelot link end in data.js too'); }
door('estate', 'P01-05', 's', { way: 'trail', label: 'THE ESTATE · THE CORN FIELDS', sub: 'THE FENCE LINE · THE GATE', action: { room: 'site_prebuilt_skinwalker_fields', at: 'bay' },
    desc: 'A fence, and a gate in it. The corn starts on the other side.' });
/* the storm drain's three ways are LINKS now, two-way (data.js DOOR_HQ.links; the tool writes their Woods ends at the end of the bake): `streets_drain`
   (Disaster City's gutter) on the Storm Drain plot, `sewers_drain` (the city sewers) on the Outfall, `woods_sewer` (the HQ tunnel) on the Tunnel Way */
const LINK_ENDS = { streets_drain: ['b', spur('P05-03', 'e'), 'THE CULVERT · UP TO THE STREET'], sewers_drain: ['b', spur('P05-04', 'e'), 'THE CULVERT · INTO THE SEWERS'] };
door('lemuria', 'P01-00', 'n', { way: 'trail', secret: true, label: 'AGARTHA · THE CRYSTAL CITY', sub: 'LEMURIA · THE ADIT UNDER THE MOUNTAIN', action: { room: 'site_prebuilt_agartha_crystalcity', at: 'link_shasta_lemuria' },
    desc: 'A draught out of the rock shelf, warmer than the snow above it.' });
door('lodge', 'P05-00', 'e', { way: 'trail', secret: true, label: 'THE LODGE · THE HALLS', sub: 'THE MEMBERS’ TUNNEL · UNDER THE LAWN', action: { room: 'site_prebuilt_lodge_halls', at: 'link_grove_lodge' },
    desc: 'A tunnel under the lake shore that nobody admits to.' });
door('lookingglass', 'P05-02', 'e', { way: 'trail', secret: true, label: 'THE LOOKING-GLASS · THE GARDEN', sub: 'THE DEAD TREE · THE HOLE LOOKS ONTO MARBLE', action: { room: 'site_prebuilt_camelot_kingdom', at: 'deadtree' },   // CAMELOT KINGDOM ON PLOTS (2026-11-15): the garden is a district of the kingdom room now (was the old garden room)
   
    desc: 'Past the dead tree the ground is the wrong colour.' });
LINK_ENDS.woods_sewer = ['a', spur('P05-05', 'e'), 'THE DRAIN · INTO THE TUNNEL'];

/* THE HORROR PASS (2026-11-15): the Gully gets a yard off its path for the wreck, the trailer and the cabin (rows 9-10 along the south, a pocket on the east) */
{ const p = plot['P03-05']; for (let ly = 9; ly <= 10; ly++) for (let lx = 1; lx <= 10; lx++) cell[p.y * N + ly][p.x * N + lx] = 'g';
  for (let ly = 5; ly <= 8; ly++) for (let lx = 8; lx <= 10; lx++) cell[p.y * N + ly][p.x * N + lx] = 'g'; }
/* a plot the plan drew as path only gets a small glade beside its path (somewhere for its pieces to stand, and for a fight to open out) */
PLAN.plots.forEach(p => { let g = 0, best = null; for (let ly = 0; ly < N; ly++) for (let lx = 0; lx < N; lx++) { const ch = cell[p.y * N + ly][p.x * N + lx]; if (ch === 'g' || ch === 's' || ch === 'r') g++;
        if (ch === 'p') { const d = Math.hypot(lx - 5.5, ly - 5.5); if (!best || d < best[0]) best = [d, lx, ly]; } }
    if (g >= 8 || !best) return;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const lx = best[1] + dx, ly = best[2] + dy; if (lx < 1 || ly < 1 || lx > N - 2 || ly > N - 2 || dx * dx + dy * dy > 5) continue;
        if (cell[p.y * N + ly][p.x * N + lx] === 't') cell[p.y * N + ly][p.x * N + lx] = 'g'; }
    count.glades = (count.glades || 0) + 1; });

/* ── THE LEVELS: one height a plot (layout `level`, 1 level = 1.75 m), flat over the plot's middle four squares, a straight grade over the
   eight squares to the next plot's middle (one level = 6.25 %, two = 12.5 %, Disaster City's own grades). Every square corner reads the one
   function, so the ground is one surface: no step, no retaining wall, a path walks up it. ── */
const LV = (x, y) => P(Math.max(0, Math.min(G - 1, x)), Math.max(0, Math.min(G - 1, y))).level * LEVEL;
function ground(xm, zm) {
    const px = (xm + HALF) / PL - 0.5, pz = (zm + HALF) / PL - 0.5, i = Math.max(0, Math.min(G - 2, Math.floor(px))), j = Math.max(0, Math.min(G - 2, Math.floor(pz)));
    const t = v => Math.min(1, Math.max(0, (v - 1 / 6) / (2 / 3))), u = t(px - i), v = t(pz - j);
    return (LV(i, j) * (1 - u) + LV(i + 1, j) * u) * (1 - v) + (LV(i, j + 1) * (1 - u) + LV(i + 1, j + 1) * u) * v;
}
const slope = Buffer.alloc(W * W * 8);
for (let cy = 0; cy < W; cy++) for (let cx = 0; cx < W; cx++) { const o = (cy * W + cx) * 8;
    [[0, 0], [1, 0], [0, 1], [1, 1]].forEach((q, k) => slope.writeInt16LE(Math.round(ground(gx(cx + q[0]), gx(cy + q[1])) * 100), o + k * 2)); }

/* ── THE OPEN GROUND: the plan's squares as `space` rows (gen.kind plan, look trees: everything else is forest the walker never enters).
   Greedy rectangles; the path's dirt, the snow and the rock are painted below. ── */
const kindOf = ch => ch === 't' ? null : 'g', used = new Uint8Array(W * W);
for (let cy = 0; cy < W; cy++) for (let cx = 0; cx < W; cx++) {
    const k = kindOf(cell[cy][cx]); if (!k || used[cy * W + cx]) continue;
    let w = 1; while (cx + w < W && !used[cy * W + cx + w] && kindOf(cell[cy][cx + w]) === k) w++;
    let h = 1; rows: while (cy + h < W) { for (let i = 0; i < w; i++) if (used[(cy + h) * W + cx + i] || kindOf(cell[cy + h][cx + i]) !== k) break rows; h++; }
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) used[(cy + j) * W + cx + i] = 1;
    const row = { k: 'space', x: r2(gx(cx) + w * C / 2), z: r2(gx(cy) + h * C / 2), w: w * C, d: h * C }; if (k === 'd') row.dirt = true;
    features.push(row); count.spaces = (count.spaces || 0) + 1;
}
/* the paint: snow on the Snowline, bare rock on the Shelf and the cave's crag (0 = the room's own sheet) */
const PAL = ['ice', 'rocks_5', 'dirt_2']   /* no snow sheet exists in the game: the Snowline wears the ice sheet */, paint = new Uint8Array(W * W);
for (let cy = 0; cy < W; cy++) for (let cx = 0; cx < W; cx++) { const ch = cell[cy][cx]; paint[cy * W + cx] = ch === 's' ? 1 : ch === 'r' ? 2 : (ch === 'p' || ch === 'b') ? 3 : 0; }

/* ── THE WATER: the creek from the Falls to the Outfall, one short `stream` row a square so the water steps down the hill with the ground
   (a stream row is one flat sheet); the lake, the falls' pool, the Pool. A plank deck wherever a path crosses. ── */
const CREEK = [[32, 5], [33, 14], [31, 22], [33, 30], [38, 39], [45, 42], [52, 45], [54, 53], [63, 55], [72, 54.5]];   // squares (the plan's course)
{ const pts = []; for (let i = 0; i + 1 < CREEK.length; i++) { const a = CREEK[i], b = CREEK[i + 1], n = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1])));
      for (let q = 0; q < n; q++) pts.push([gx(a[0] + (b[0] - a[0]) * q / n + 0.5), gx(a[1] + (b[1] - a[1]) * q / n + 0.5)]); }
  pts.push([gx(72), gx(55)]);
  /* one row while the ground under it stays within 0.45 m (a flat stretch is one long sheet; on a grade the creek steps down in short runs) */
  const hsOf = q => { const o = []; for (const d of [-1.75, 0, 1.75]) o.push(ground(q[0] + d, q[1]), ground(q[0], q[1] + d)); return o; };
  let i = 0; while (i + 1 < pts.length) { let j = i + 1, lo = Math.min(...hsOf(pts[i])), hi = Math.max(...hsOf(pts[i]));
      for (;;) { const h = hsOf(pts[j]), l2 = Math.min(lo, ...h), h2 = Math.max(hi, ...h); if (h2 - l2 > 0.45 && j > i + 1) break; lo = l2; hi = h2; if (j + 1 >= pts.length) { j++; break; } j++; }
      const seg = pts.slice(i, Math.min(j, pts.length - 1) + 1), h0 = ground(seg[0][0], seg[0][1]);
      features.push({ k: 'stream', pts: seg.map(q => [r2(q[0]), r2(q[1])]), w: 4.4, y: r2(lo - h0 - 0.25), depth: r2(hi - lo + 0.6), key: 'water' }); count.creek = (count.creek || 0) + 1;
      i = Math.min(j, pts.length - 1); if (i >= pts.length - 1) break; } }
features.push({ k: 'pool', x: gc(32), z: gc(3), r: 7, rz: 6, y: -0.25, depth: 0.9, key: 'water', bank: 1.2 });                      // the Falls' pool
features.push({ k: 'pool', x: gx(60), z: gc(5), r: 21, rz: 13, y: -0.3, depth: 1.0, key: 'water', bank: 2.0 });                      // THE LAKE, both shores
features.push({ k: 'pool', x: gc(54), z: gc(66), r: 8, rz: 7, y: -0.3, depth: 0.9, key: 'water', bank: 1.4 });                       // THE POOL
{ const seen = new Uint8Array(W * W);   // a deck over each run of bridge squares, along the way the path runs
  for (let cy = 0; cy < W; cy++) for (let cx = 0; cx < W; cx++) { if (cell[cy][cx] !== 'b' || seen[cy * W + cx]) continue;
      const st = [[cx, cy]], run = []; seen[cy * W + cx] = 1;
      while (st.length) { const [x, y] = st.pop(); run.push([x, y]); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + dx, Y = y + dy; if (X >= 0 && Y >= 0 && X < W && Y < W && cell[Y][X] === 'b' && !seen[Y * W + X]) { seen[Y * W + X] = 1; st.push([X, Y]); } } }
      const x0 = Math.min(...run.map(q => q[0])), x1 = Math.max(...run.map(q => q[0])), y0 = Math.min(...run.map(q => q[1])), y1 = Math.max(...run.map(q => q[1]));
      const dirtEW = open(x0 - 1, y0) && cell[y0][x0 - 1] === 'p' || open(x1 + 1, y0) && cell[y0][x1 + 1] === 'p';
      if (dirtEW) features.push({ k: 'deck', x0: gx(x0) - 1.75, z0: r2((gx(y0) + gx(y1 + 1)) / 2), x1: gx(x1 + 1) + 1.75, z1: r2((gx(y0) + gx(y1 + 1)) / 2), w: (y1 - y0 + 1) * C, y: 0.3 });
      else features.push({ k: 'deck', x0: r2((gx(x0) + gx(x1 + 1)) / 2), z0: gx(y0) - 1.75, x1: r2((gx(x0) + gx(x1 + 1)) / 2), z1: gx(y1 + 1) + 1.75, w: (x1 - x0 + 1) * C, y: 0.3 });
      count.decks = (count.decks || 0) + 1; } }

/* ── THE DRESSING: each plot's own pieces, ported from the six old rooms (the Clearing, the Redwood Trail, Dead Man's Cave, the Ritual
   Ground, Mount Shasta, Bohemian Grove). Everything stands on an open square of its plot: a blocker on a square's middle, decor off it. ── */
function freeSquares(id) { const p = plot[id], out = []; for (let ly = 1; ly < N - 1; ly++) for (let lx = 1; lx < N - 1; lx++) { const ch = cell[p.y * N + ly][p.x * N + lx]; if (ch === 'g' || ch === 's' || ch === 'r') out.push([p.x * N + lx, p.y * N + ly]); } return out; }
const taken = new Set();
function centre(id) { const f = freeSquares(id); if (!f.length) throw new Error('no clearing on ' + id); const mx = f.reduce((s, q) => s + q[0], 0) / f.length, my = f.reduce((s, q) => s + q[1], 0) / f.length;
    return f.slice().sort((a, b) => Math.hypot(a[0] - mx, a[1] - my) - Math.hypot(b[0] - mx, b[1] - my))[0]; }
function near(id, dx, dy) {   // the free, untaken clearing square nearest the plot's clearing middle + (dx, dy)
    const c = centre(id), f = freeSquares(id).filter(q => !taken.has(q[0] + ':' + q[1])); if (!f.length) throw new Error('plot full: ' + id);
    const q = f.sort((a, b) => Math.hypot(a[0] - c[0] - dx, a[1] - c[1] - dy) - Math.hypot(b[0] - c[0] - dx, b[1] - c[1] - dy))[0]; taken.add(q[0] + ':' + q[1]); return q; }
function put(id, key, dx, dy, o) { const q = near(id, dx || 0, dy || 0); props.push(Object.assign({ key, x: gc(q[0]), z: gc(q[1]) }, o || {})); return q; }
function dec(id, key, dx, dy, o) { const q = near(id, dx || 0, dy || 0); props.push(Object.assign({ key, x: r2(gc(q[0]) + (rnd() - 0.5) * 1.6), z: r2(gc(q[1]) + (rnd() - 0.5) * 1.6), face: Math.round(rnd() * 360) }, o || {})); return q; }
function tree(id, kind, h, dx, dy, r) { const q = near(id, dx || 0, dy || 0); features.push({ k: 'tree', x: gc(q[0]), z: gc(q[1]), kind, h, r: r || 0.8 }); return q; }
function native(id, race, dx, dy, face) { const q = near(id, dx || 0, dy || 0); npc.push({ x: gc(q[0]), z: gc(q[1]), face: face || 0, race }); }
/* THE CLEARING */
tree('P01-03', 'tree_4', 9.5, 0, 0, 1.0); tree('P01-03', 'tree_4', 8.0, 1, 1, 0.85); tree('P01-03', 'tree_4', 7.5, -1, 1, 0.8);              // THE OLD TREE (the district's landmark)
put('P02-03', 'signpost', 0, 0, { face: 30 }); put('P02-03', 'cave_torch', 3, -2); dec('P02-03', 'paper_sheet', -2, 2, { y: 0.01 }); dec('P02-03', 'rabbit', -3, -2); dec('P02-03', 'crow', 3, 3);
put('P01-04', 'campfire', 0, 0); dec('P01-04', 'cardboard_boxes', 2, 1); dec('P01-04', 'fallen_log', -2, 1); put('P01-04', 'cave_torch', 0, -3);
{ const q = centre('P02-04');   // THE STAIR: the building's own marble flight, standing alone in the trees and climbing past the treeline (the old clearing's row)
  features.push({ k: 'ramp', x0: gx(q[0]), z0: gx(q[1] + 1), x1: gx(q[0]), z1: gx(q[1] - 4), w: 3.5, h0: 0, h1: 13.61, stairs: true, edge: 0.2, model: 'concrete', built: true, key: 'marble_light', side: 'marble_light',
      runner: { w: 2.0, color: 0x2f58d0 }, cheek: { h: 1.0, t: 0.4, key: 'marble_light', head: true } });
  for (let d = -4; d <= 0; d++) for (const s of [-1, 0]) taken.add((q[0] + s) + ':' + (q[1] + d)); put('P02-04', 'cave_torch', 2, 1); }
dec('P00-04', 'wolf', 0, 0); dec('P00-05', 'anthill', 0, 0); dec('P00-05', 'ant', 1, 0); dec('P00-05', 'luna_moth', -1, 1); dec('P00-05', 'hawk_moth', 1, 1);
dec('P02-05', 'rabbit', 0, 0); dec('P02-05', 'crow', 1, 1); dec('P00-03', 'lesson_sign', 0, 0); put('P00-03', 'cave_torch', 1, 0);
{ const p = plot['P01-05'], z = gx(p.y * N + N - 1);   // THE FENCE LINE: a ranch rail along the plot's south side, the gate's gap where the path goes through
  const gap = doors.find(d => d.id === 'estate').x; features.push({ k: 'rail', x0: gx(p.x * N + 1), z0: z, x1: r2(gap - 3.5), z1: z, model: 'ranch' }, { k: 'rail', x0: r2(gap + 3.5), z0: z, x1: gx(p.x * N + N - 1), z1: z, model: 'ranch' }); }
native('P01-03', 'tree person', 2, 2, 200); native('P01-04', 'hippie', 2, -1, 270); native('P00-04', 'werewolf', 1, 1, 90);
/* THE REDWOOD TRAIL (+ MOUNT SHASTA) */
tree('P00-01', 'tree_3', 16, 0, 0, 1.6); tree('P00-01', 'tree_3', 11, 2, 1, 1.0); tree('P00-02', 'tree_3', 11, 0, 0, 1.0); dec('P00-02', 'fallen_log', 1, 1); dec('P00-01', 'fallen_log', -1, 2);   // the giant redwood (the landmark)
put('P01-01', 'campfire', 0, 0); dec('P01-01', 'instrument_drum', 1, 1); dec('P01-01', 'instrument_guitar_lying', -1, 1); dec('P01-01', 'instrument_tambourine', 1, -1); put('P01-01', 'park_bench', -2, -1, { face: 90 }); dec('P01-01', 'eagle', 3, -3);
put('P01-00', 'cave_stone', 0, 0); put('P01-00', 'cave_stone', 2, 1); put('P01-00', 'cave_stone', -2, 1); dec('P01-00', 'sea_chest', 1, -1); put('P01-00', 'signpost', 0, 3);
tree('P00-00', 'pine', 6.5, 0, 0); tree('P00-00', 'pine', 6.0, 3, 2); tree('P00-00', 'pine', 5.5, -3, 2); put('P00-00', 'dead_snag', 2, -3); put('P00-00', 'dead_snag', -2, -2); put('P00-00', 'cave_stone', 0, 3);
put('P02-00', 'cave_stone', 0, 0); put('P02-00', 'cave_stone', 1, 1); dec('P01-02', 'candle_ring', 0, 0); put('P02-01', 'cave_torch', 0, 0); put('P02-02', 'cave_torch', 0, 0);
native('P01-01', 'shaman', -2, 2, 0); native('P00-01', 'bigfoot', -2, -1, 120); native('P01-01', 'ki fighter', 3, 2, 300); native('P00-00', 'yeti', -1, 1, 150); native('P01-00', 'krampus', -1, 2, 180);
/* THE RITUAL GROUND (+ BOHEMIAN GROVE) */
{ const q = centre('P04-02'), R = 2; put('P04-02', 'ritual_circle', 0, 0, { y: 0.01 });   // THE STONES: six round the circle
  [[-R, -1], [-R, 1], [R, -1], [R, 1], [0, -R], [0, R]].forEach(d => put('P04-02', 'menhir', d[0], d[1])); dec('P04-02', 'candle_ring', 1, 0); put('P04-02', 'cave_torch', -3, 3); }
put('P03-02', 'campfire', 0, 0); dec('P03-02', 'folding_chair', 1, 1); dec('P03-02', 'folding_chair', -1, 1); put('P03-02', 'cave_torch', 2, -2);
put('P05-02', 'dead_snag', 0, 0); dec('P05-02', 'floor_stain', 1, 0);                                                                               // THE DEAD TREE
put('P03-01', 'camping_tent', 0, 0, { face: 180 }); put('P03-01', 'camping_tent', 2, 1, { face: 200 }); put('P03-01', 'camping_tent', -2, 1, { face: 160 }); dec('P03-01', 'sea_chest', 0, 2); dec('P03-01', 'retro_radio', 1, 2);
{ const q = centre('P04-01');   // THE STAGE: a low timber stage (one level up), steps at its south side
  features.push({ k: 'plateau', x: gx(q[0]), z: gx(q[1] - 1), w: 14, d: 7, h: 1.75, edge: 0.3 }, { k: 'ramp', x0: gx(q[0]), z0: gx(q[1] + 2), x1: gx(q[0]), z1: gx(q[1]), w: 3.5, h0: 0, h1: 1.75, stairs: true, model: 'wood', edge: 0.2 });
  for (let dy = -2; dy <= 1; dy++) for (let dx = -2; dx <= 1; dx++) taken.add((q[0] + dx) + ':' + (q[1] + dy));
  props.push({ key: 'lectern', x: gx(q[0]), z: gc(q[1] - 2), y: 1.75, face: 180 }, { key: 'retro_speakers', x: gc(q[0] - 2), z: gc(q[1] - 2), y: 1.75, face: 180 }, { key: 'retro_speakers', x: gc(q[0] + 1), z: gc(q[1] - 2), y: 1.75, face: 180 });
  [[-2, 3], [-1, 3], [0, 3], [1, 3], [-1, 4], [0, 4]].forEach(d => dec('P04-01', 'folding_chair', d[0], d[1], { face: 0 })); }
{ const q = centre('P05-01');   // THE OWL's mound and altar (the owl statue is a Meshy piece, 2026-11-15)
  features.push({ k: 'plateau', x: gx(q[0]), z: gx(q[1]), w: 7, d: 7, h: 1.75, edge: 0.4 }, { k: 'ramp', x0: gx(q[0]), z0: gx(q[1] + 3), x1: gx(q[0]), z1: gx(q[1] + 1), w: 3.5, h0: 0, h1: 1.75, stairs: true, model: 'forest', edge: 0.2 });
  for (let dy = -1; dy <= 2; dy++) for (let dx = -1; dx <= 0; dx++) taken.add((q[0] + dx) + ':' + (q[1] + dy));
  props.push({ key: 'owl_statue', x: gx(q[0]), z: r2(gx(q[1]) - 1.0), y: 1.75, face: 180 }, { key: 'stone_altar', x: gx(q[0]), z: r2(gx(q[1]) + 2.6), y: 1.75, face: 180 },   // THE HORROR PASS: the owl itself (Meshy), the altar at its feet
      { key: 'brazier', x: r2(gx(q[0]) - 2.8), z: r2(gx(q[1]) + 2.6), y: 1.75 }, { key: 'brazier', x: r2(gx(q[0]) + 2.8), z: r2(gx(q[1]) + 2.6), y: 1.75 }); }
{ const q = centre('P03-00'); features.push({ k: 'hill', x: gc(q[0]), z: gc(q[1]), r: 9, h: 2.6 }); props.push({ key: 'wooden_cross', x: gc(q[0]), z: gc(q[1]) }); taken.add(q[0] + ':' + q[1]); }   // THE MOUND
native('P03-02', 'cult leader', -1, -1, 90); native('P03-01', 'fortune teller', 1, -1, 180); native('P04-02', 'goatman', 3, -2, 240);
/* DEAD MAN'S CAVE */
{ const q = centre('P03-04');   // THE CAVE MOUTH: a crag on the clearing's north side with the storm drain's mouth in its face (the district's landmark)
  features.push({ k: 'plateau', x: gx(q[0]), z: gc(q[1] - 3), w: 14, d: 7, h: 5.25, edge: 0.5 });
  props.push({ key: 'culvert_mouth', x: gx(q[0]), z: gx(q[1] - 1) - 0.4, face: 180 }, { key: 'graffiti_wall', x: gc(q[0] + 2), z: gx(q[1] - 1) - 0.2, face: 180 });
  for (let dy = -4; dy <= -1; dy++) for (let dx = -2; dx <= 1; dx++) taken.add((q[0] + dx) + ':' + (q[1] + dy)); put('P03-04', 'cave_torch', 2, 1); dec('P03-04', 'wet_floor_sign', -1, 1); }
native('P04-05', 'swamp monster', -1, 1, 60); native('P04-05', 'mothman', 1, -1, 300);   // THE HORROR PASS: the thing in the Pool, and the one above it

/* trees in the forest mass that give a district its own wood: redwoods through the Redwood Trail, pines up the mountain, dead trees round the cave */
{ const want = { T: ['tree_3', 12, 0.10], G: ['tree_2', 8, 0.03], C: ['tree', 7.5, 0.03], M: ['dead_tree', 6, 0.0] };
  for (let cy = 1; cy < W - 1; cy++) for (let cx = 1; cx < W - 1; cx++) { if (cell[cy][cx] !== 't') continue; const p = P(Math.floor(cx / N), Math.floor(cy / N)), wd = want[p.district];
      let deep = true; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (cell[cy + dy][cx + dx] !== 't') deep = false;
      if (!deep || rnd() > wd[2]) continue; const mountain = p.level >= 6;
      features.push({ k: 'tree', x: r2(gc(cx) + (rnd() - 0.5) * 1.4), z: r2(gc(cy) + (rnd() - 0.5) * 1.4), kind: mountain ? 'pine' : wd[0], h: r2((mountain ? 7 : wd[1]) * (0.8 + rnd() * 0.4)), r: 0.7 }); count.bigTrees = (count.bigTrees || 0) + 1; } }
features.push({ k: 'scatter', key: 'fern', n: 140, seed: 5 }, { k: 'scatter', key: 'stump', n: 18, seed: 6 }, { k: 'scatter', key: 'fallen_log', n: 10, seed: 7, r0: 1.9 });

/* ── THE HORROR PASS (2026-11-15, mondo: "What can we do to give more of a horror element to the woods" + "yes you can do the yellow and pink too"):
   it gets worse the farther you walk from the Stair. The Clearing = someone was just here; the Redwood Trail = you are being watched; the Ritual
   Ground = the cult; Dead Man's Cave = where things get dumped. Blockers on a square's middle (put), small things off it (dec), nothing on a path.
   The plan picture: project files world-areas-plan/woods/woods_horror_plan.png. No ceiling / wall pieces (no meat hooks: nothing to hang them from). ── */
function hdec(id, key, dx, dy, o) { try { return dec(id, key, dx, dy, o); } catch (e) { count.horrorSkipped = (count.horrorSkipped || 0) + 1; return null; } }
function hput(id, key, dx, dy, o) { try { return put(id, key, dx, dy, o); } catch (e) { count.horrorSkipped = (count.horrorSkipped || 0) + 1; return null; } }
const h0 = props.length;
/* THE CLEARING: someone was just here */
hdec('P02-04', 'railway_lantern', 1, 3); hdec('P02-03', 'crow', -3, 3); hdec('P01-03', 'psx_cobweb_1', 1, 0, { y: 1.1 }); hdec('P01-03', 'candle', -1, 0);
hput('P01-04', 'camping_tent', -2, -2, { face: 140 }); hdec('P01-04', 'psx_flashlight_1', 1, -1); hdec('P01-04', 'psx_vhs_tape_1', 1, 2); hdec('P01-04', 'item_old_camera_flash', -1, 2); hdec('P01-04', 'meshy_burlap_sack', 3, 0);
hput('P00-03', 'missing_board', 0, 0, { face: 180 }); hdec('P00-03', 'candle', 1, 1);
hdec('P00-04', 'trap_bear_open', 2, -1); hdec('P00-04', 'trap_bear_open', -2, 1); hdec('P00-04', 'trap_trip_wire', 0, 2); hdec('P00-04', 'trap_bear_shut', -1, -2);
hdec('P00-05', 'trap_bear_open', 2, 1); hdec('P00-05', 'skull', 0, 1); hdec('P00-05', 'trap_trip_wire_broken', -2, 0);
hdec('P02-05', 'trap_trip_wire', 2, 0); { const q = hput('P02-05', 'dead_snag', -2, 1); if (q) props.push({ key: 'crow', x: gc(q[0]), z: gc(q[1]), y: 4.5, face: 200 }); }
hdec('P01-05', 'meshy_burlap_sack', -2, 2, { y: 0.9 }); hdec('P01-05', 'meshy_burlap_sack', 0, 3, { y: 0.9 }); hdec('P01-05', 'meshy_burlap_sack', 2, 2, { y: 0.9 }); native('P01-05', 'scarecrow', 2, -1, 0);
/* THE REDWOOD TRAIL: you are being watched */
hdec('P02-02', 'item_ward_totem', 1, 1); hdec('P02-02', 'item_ward_totem', -1, -1);
hdec('P01-02', 'meshy_voodoo_doll', 1, 1, { y: 1.7 }); hdec('P01-02', 'meshy_voodoo_doll', -1, 1, { y: 2.1 }); hdec('P01-02', 'meshy_voodoo_doll', 0, -1, { y: 1.5 }); hdec('P01-02', 'item_ward_totem', 2, 0);
hdec('P00-02', 'decor_effigy_figure', 1, -1); hdec('P00-02', 'decor_effigy_figure', -1, 1); hdec('P00-02', 'meshy_voodoo_doll', 2, 1, { y: 1.8 });
[[1, 0, 1.3], [-1, 0, 1.9], [0, 1, 1.6], [0, -1, 2.2], [1, 1, 1.1]].forEach(d => hdec('P00-01', 'meshy_voodoo_doll', d[0], d[1], { y: d[2] })); hdec('P00-01', 'item_ward_totem', 3, 1);
hdec('P02-01', 'meshy_burlap_sack', 1, 0); hdec('P02-00', 'railway_lantern', 1, 2);
[[2, 2], [3, 0], [-3, 1], [-1, -3], [1, -2]].forEach(d => hdec('P01-00', 'cross', d[0], d[1], { face: 180 })); native('P01-00', 'skinwalker', 3, -2, 200);
hput('P00-00', 'skull_pile', 1, 1); hput('P00-00', 'skull_pile', -2, 3); hput('P00-00', 'bird_cage', 3, -1); hdec('P00-00', 'skull', 2, 2); hdec('P00-00', 'skull', -1, 2); hdec('P00-00', 'skull', 0, -2);
/* THE RITUAL GROUND: the cult */
hdec('P03-02', 'psx_meat_1', 1, -1, { y: 0.02 }); hdec('P03-02', 'psx_meat_1', -2, 0, { y: 0.02 }); hdec('P03-02', 'psx_hand_saw_1', 2, 1, { y: 0.02 }); hput('P03-02', 'cauldron', -1, 2);
hdec('P04-02', 'candleRing', -1, 0); hdec('P04-02', 'candleRing', 0, 1); hput('P04-02', 'cauldron', 0, -1); hdec('P04-02', 'skull', 1, 1); hdec('P04-02', 'skull', -1, -1);
hdec('P05-02', 'psx_cobweb_2', 1, -1, { y: 1.2 }); hdec('P05-02', 'meshy_voodoo_doll', -1, 0); hdec('P05-02', 'meshy_voodoo_doll', 0, 1);
hdec('P03-01', 'psx_incognito_mask_mp_1', 1, 1, { y: 0.02 }); hdec('P03-01', 'psx_incognito_mask_mp_1', -1, 2, { y: 0.02 }); hdec('P03-01', 'psx_incognito_mask_mp_1', 3, 2, { y: 0.02 });
{ const pl = plot['P04-01'], x0 = gx(pl.x * N), z0 = gx(pl.y * N);   // a mask on every seat facing the stage
  props.slice(0, h0).filter(q => q.key === 'folding_chair' && q.x >= x0 && q.x < x0 + PL && q.z >= z0 && q.z < z0 + PL).forEach(q => props.push({ key: 'psx_incognito_mask_mp_1', x: q.x, z: q.z, y: 0.46, face: q.face || 0 })); }
{ const q = hdec('P05-01', 'decor_effigy_bier', -3, 3, { face: 0 }); if (q) { const b = props[props.length - 1]; props.push({ key: 'decor_effigy_figure', x: b.x, z: b.z, y: 0.55, face: 0 }); } hdec('P05-01', 'candleLine', 2, 3); }
[[2, 2], [-2, 2], [3, -1]].forEach(d => hdec('P03-00', 'cross', d[0], d[1], { face: 180 })); hput('P03-00', 'trap_coffin_open', -3, -1, { face: 20 }); hdec('P03-00', 'trap_coffin_lid', -2, -2);
hdec('P04-00', 'railway_lantern', 0, 0); hdec('P04-00', 'railway_lantern', 1, 2); hdec('P05-00', 'candleLine', 0, 0);
/* DEAD MAN'S CAVE: where things get dumped */
hdec('P03-03', 'warning_tape', 0, 0, { y: 0.01 }); hdec('P03-03', 'garbage_bag', 1, 1);
hdec('P04-03', 'garbage_bags', 0, 0); hdec('P04-03', 'garbage_bags', 1, 1); hdec('P04-03', 'meshy_burlap_sack', -1, 1);
hdec('P05-03', 'warning_tape', 0, 0, { y: 0.01 }); hdec('P05-03', 'psx_flashlight_1', 1, 0);
hput('P03-04', 'skull_pile', 2, 2); hdec('P03-04', 'skull', 0, 2); hdec('P03-04', 'skull', -2, 1); hdec('P03-04', 'psx_cobweb_1', 1, 0, { y: 1.4 }); native('P03-04', 'ghoul', -2, 2, 60); native('P03-04', 'flesheater', 3, 1, 300);
hput('P04-04', 'trap_coffin_wood', 0, 0, { y: -0.28, face: 30 }); hput('P04-04', 'trap_coffin_wood', 2, 1, { y: -0.34, face: 300 }); hdec('P04-04', 'trap_coffin_lid', 1, -1);
hdec('P05-04', 'psx_fish_skeleton_mp_1', 0, 0, { y: 0.02 }); hput('P05-04', 'psx_metal_barrel_mp_1', 1, 1); hput('P05-04', 'psx_metal_barrel_mp_1', -1, 1);
{ const p = plot['P03-05'], X = p.x * N, Y = p.y * N, tk = (x0, x1, y0, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) taken.add((X + x) + ':' + (Y + y)); };   // THE GULLY's yard
  props.push({ key: 'trailer_home_4', x: r2(gx(X + 1) + 8.75), z: gx(Y + 10), face: 0 }); tk(1, 5, 9, 10);          // 5 x 2 squares
  props.push({ key: 'school_bus', x: gc(X + 8), z: gc(Y + 9), face: 90 }); tk(7, 9, 9, 9);                             // 3 x 1 squares, nose east
  /* THE CABIN (2026-11-15, mondo: "would rather you architect a wooden cabin like the building's in disaster city so i can actually walk inside of it"):
     a walk-in building made the city's way = one hollow `texbuilding` (skin off: the walls you bump into, the doorway, the swinging leaf, the inside's
     wall / floor / ceiling) + one `k: 'arch'` row for the look. 3 squares along its front x 2 deep, its front to the WEST (the path), a porch on the
     square row before it. Row frame: +x along the front, +z out of the front. The Meshy `woods_cabin` model stays in the catalogue, unused here. */
  { const cx = gx(X + 10), cz = r2(gx(Y + 5) + 5.25), w = 10.5, d = 7, H = 3.5, E = 0.05, WD = 'urban:WoodGeneric1b', WD2 = 'urban:WoodGeneric1a', SH = 'urban:WoodGeneric2a', FL = 'urban:WoodFlooring1d';
    const LOG = 0x6e6558, DARK = 0x3c352e, MOSS = 0x55604a, STONE = 0x8d8a82;
    const row = { k: 'texbuilding', id: 'woods:cabin', x: cx, z: cz, w, d, rot: 90, storeys: 1, seed: 1, skin: false, hollow: true, leaf: 'leaf_shabby_wood', keyIn: WD2, floorIn: FL };
    features.push(row);
    const L = w - 0.12, cols = Math.round(L / 1.75), cw = L / cols, lx = r2(-L / 2 + (Math.floor((cols - 1) / 2) + 0.5) * cw);   // data.js hqTexbDoor: the doorway's middle along the front
    const box = (x, y, z, sw, sh, sd, key, tint, o) => Object.assign({ s: 'box', p: [r2(x), r2(y), r2(z)], size: [r2(sw), r2(sh), r2(sd)], key, tint }, o || {});
    const parts = [
        box(0, 0, 0, w + 2 * E, H, d + 2 * E, WD, LOG, { faces: 'blr', top: false, uv: [3.5, 1.75] }),                                     // the three blind log walls
        { s: 'quad', p: [0, 0, r2(d / 2 + E)], size: [r2(w + 2 * E), H], key: WD, tint: LOG, uv: [3.5, 1.75], hole: [lx, r2(cw), 2.2] },   // the front, its doorway cut
        { s: 'roof', form: 'gable', p: [0, H, 0], size: [w + 1.6, 2.7, d + 1.4], key: SH, tint: MOSS, keyEnd: WD, tintEnd: LOG, over: 0.5, roof: true },   // mossy shingles, the ridge along the front
        box(-w / 2, 0, d / 2, 0.42, H, 0.42, WD2, DARK), box(w / 2, 0, d / 2, 0.42, H, 0.42, WD2, DARK), box(-w / 2, 0, -d / 2, 0.42, H, 0.42, WD2, DARK), box(w / 2, 0, -d / 2, 0.42, H, 0.42, WD2, DARK),   // the corner logs
        box(0, 0, d / 2 + 0.08, w + 0.3, 0.3, 0.2, WD2, DARK), box(0, H - 0.28, d / 2 + 0.08, w + 0.3, 0.28, 0.2, WD2, DARK),                // the sill log and the top plate
        box(lx - cw / 2 - 0.1, 0, d / 2 + 0.1, 0.2, 2.35, 0.2, WD2, DARK), box(lx + cw / 2 + 0.1, 0, d / 2 + 0.1, 0.2, 2.35, 0.2, WD2, DARK), box(lx, 2.2, d / 2 + 0.1, cw + 0.4, 0.2, 0.2, WD2, DARK),   // the door frame
        /* two boarded windows on the front, one on each end wall */
        ...[-3.6, 3.3].flatMap(x => [box(x, 1.05, d / 2 + 0.06, 1.3, 1.2, 0.08, 'urban:GlassWindowResidentialShutter1', 0x8a8a80, { uv: 'fit', faces: 'f', top: false }),
            box(x, 1.25, d / 2 + 0.14, 1.7, 0.22, 0.06, WD2, 0x8a7d68), box(x, 1.75, d / 2 + 0.14, 1.7, 0.22, 0.06, WD2, 0x7a6e5c)]),
        ...[-1, 1].flatMap(sd => [box(sd * (w / 2 + 0.06), 1.05, 0.6, 0.08, 1.2, 1.3, 'urban:GlassWindowResidentialShutter1', 0x8a8a80, { uv: 'fit', faces: sd > 0 ? 'r' : 'l', top: false }),
            box(sd * (w / 2 + 0.14), 1.45, 0.6, 0.06, 0.22, 1.7, WD2, 0x8a7d68)]),
        /* the porch: boards on the ground, four posts, a lean-to roof */
        box(0, 0, d / 2 + 1.75, w, 0.06, 3.3, FL, 0x8c8172), ...[-w / 2 + 0.3, -1.9, 1.9, w / 2 - 0.3].map(x => box(x, 0, d / 2 + 3.2, 0.22, 2.55, 0.22, WD2, DARK)),
        { s: 'roof', form: 'shed', p: [0, 2.55, r2(d / 2 + 1.85)], size: [w + 1.0, 0.95, 3.9], key: SH, tint: MOSS, roof: true },
        /* the stone chimney up the back wall, its hearth inside */
        box(3.4, 0, -d / 2 - 0.5, 1.6, 6.6, 1.1, 'rocks_5', STONE, { roof: true }), box(3.4, 0, -d / 2 + 0.75, 2.2, 1.5, 0.9, 'rocks_5', STONE), box(3.4, 1.5, -d / 2 + 0.75, 2.6, 0.18, 1.0, WD2, DARK),
        /* a table built from parts by the front window */
        box(3.5, 0.74, 1.75, 1.5, 0.08, 0.9, WD2, 0x7a6a55), ...[[2.85, 1.4], [4.15, 1.4], [2.85, 2.1], [4.15, 2.1]].map(q => box(q[0], 0, q[1], 0.09, 0.74, 0.09, WD2, DARK)),
    ];
    features.push({ k: 'arch', id: 'woods:cabin:arch', x: cx, z: cz, rot: 90, parts });
    /* the inside (a row-frame spot to the room: rot 90 puts +x of the row on the room's +z, +z of the row on its -x) */
    const at = (rx, rz) => ({ x: r2(cx - rz), z: r2(cz + rx) });
    const inP = (key, rx, rz, o) => props.push(Object.assign({ key }, at(rx, rz), o || {}));
    inP('cot', -3.5, -2.2, { face: 0 }); inP('sea_chest', -4.4, -0.3, { face: 90 }); inP('rocking_chair', -3.9, 2.0, { face: 300 }); inP('retro_radio', -4.6, 2.7); inP('rug_round', -0.9, 0.2, { y: 0.01 });
    inP('cauldron', 3.4, -1.5); inP('skull', 3.2, 1.75, { y: 0.83, face: 250 }); inP('candle', 3.9, 1.6, { y: 0.83 }); inP('psx_vhs_tape_1', 3.5, 2.0, { y: 0.83 }); inP('psx_hand_saw_1', 1.9, -2.9, { y: 0.02 });
    inP('psx_cobweb_1', -4.9, -3.1, { y: 2.3 }); inP('psx_cobweb_2', 4.9, 3.1, { y: 2.3 }); inP('trap_bear_shut', 1.6, 2.6); inP('meshy_burlap_sack', -1.8, -2.8); inP('wooden_bucket', 1.2, -2.9);
    inP('railway_lantern', lx + 1.6, d / 2 + 2.4);   // on the porch boards
    tk(8, 10, 5, 7); }
  hdec('P03-05', 'garbage_bag', 3, 2); hdec('P03-05', 'trap_bear_open', 2, -1); hdec('P03-05', 'meshy_burlap_sack', 0, 3); }
hput('P05-05', 'trap_sarcophagus_box', 0, 0, { face: 90 }); hdec('P05-05', 'skull', 1, 1);
count.horror = props.length - h0;

/* ── checks: every prop key is in the catalogue, nothing stands on a tree square, every plot is reached on foot from the Stair ── */
const D = require('./load-data.js').loadGameData(), vm = require('vm'), CAT = vm.runInContext('DOOR_HQ.catalogue', D), RACES = vm.runInContext('AVAILABLE_RACES', D);
props.forEach(p => { if (!CAT[p.key]) throw new Error('not in the catalogue: ' + p.key); });
npc.forEach(n => { if (RACES.indexOf(n.race) < 0) throw new Error('not a unit: ' + n.race); });
{ const s = centre('P02-04'), seen = new Uint8Array(W * W), st = [[s[0], s[1] + 2]]; if (!open(st[0][0], st[0][1])) throw new Error('the Stair foot is not open');
  seen[st[0][1] * W + st[0][0]] = 1;
  while (st.length) { const [x, y] = st.pop(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + dx, Y = y + dy; if (open(X, Y) && !seen[Y * W + X]) { seen[Y * W + X] = 1; st.push([X, Y]); } } }
  const cold = PLAN.plots.filter(p => { for (let ly = 0; ly < N; ly++) for (let lx = 0; lx < N; lx++) if (seen[(p.y * N + ly) * W + p.x * N + lx]) return false; return true; }).map(p => p.id);
  if (cold.length) throw new Error('plots not reached: ' + cold.join(' '));
  let op = 0, un = 0; for (let cy = 0; cy < W; cy++) for (let cx = 0; cx < W; cx++) if (open(cx, cy)) { op++; if (!seen[cy * W + cx]) un++; } count.openSquares = op; count.unreachedSquares = un; }
count.props = props.length; count.features = features.length; count.doors = doors.length; count.natives = npc.length;

/* ── the room ── */
const J = v => JSON.stringify(v).replace(/"([a-zA-Z_][a-zA-Z0-9_]*)":/g, '$1:').replace(/'/g, "\\'").replace(/"/g, "'");
const sp = centre('P02-04'), L = [];
L.push("        /* WOODS36-BEGIN — THE WOODS ON PLOTS (2026-11-15): written by `node bake-woods.js` from docs/areas/woods/layout.json. Never hand-edit between the markers; edit the tool or the layout and rerun. */");
L.push("        site_prebuilt_fairy_forest_plots: {");
L.push("            label: 'THE WOODS',");
L.push("            sub: 'FOUR DISTRICTS · 36 PLOTS',");
L.push("            kind: 'box', site: 'prebuilt_fairy_forest', part: 'plots',");
L.push("            shell: hqWoodsShell({ w: " + (2 * HALF) + ", d: " + (2 * HALF) + ", plate: { x: " + gx(sp[0]) + ", z: " + gc(sp[1] + 2) + ", y: 4.2 }, forest: { depth: 7, spacing: 3.5, rows: 2, start: 1.6, canopy: { to: 54 } } }),");
L.push("            parti: 'Four districts of nine plots, every plot a twelve by twelve board: clearings joined by dirt paths through forest you cannot enter, climbing from the fence line to the snow.',");
L.push("            typology: 'grid',");
L.push("            plots: { cell: " + C + ", plot: " + PL + ", n: " + G + ", names: " + J(PLAN.plots.map(p => [p.id, p.name, p.district, p.level])) + " },");
L.push("            terrain: {");
L.push("                res: 0.875, floor: 'grass_2', cliff: 'rock_wall_1', path: 'dirt_2',");
L.push("                noise: { amp: 0.12, scale: 8 },");
L.push("                slope: { cells: { res: " + C + ", x0: " + gx(0) + ", z0: " + gx(0) + ", nx: " + W + ", nz: " + W + ", d: '" + slope.toString('base64') + "' } },");
L.push("                paint: { pal: " + J(PAL) + ", t: 'u8', res: " + C + ", x0: " + gc(0) + ", z0: " + gc(0) + ", nx: " + W + ", nz: " + W + ", d: '" + Buffer.from(paint).toString('base64') + "' },");
L.push("                gen: { kind: 'plan', look: 'trees', seed: 36, rim: 0, forceGrow: 0, treeGap: 2.6, treeIn: 0.9, spacing: 3.5, depth: 5.25, maxTrees: 2400, treeH: [5.5, 8.5], kinds: ['tree', 'tree_2', 'tree_3', 'tree', 'tree_5', 'tree_2'] },");
L.push("                features: [");
features.forEach(f => L.push("                    " + J(f) + ","));
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
L.push("            lines: [],");
L.push("            spawn: { x: " + gx(sp[0]) + ", z: " + gc(sp[1] + 2) + ", face: 180 },");
L.push("        },");
L.push("        /* WOODS36-END */");
const block = L.join('\n') + '\n';
console.log(JSON.stringify(count));
if (DRY) process.exit(0);
const file = path.join(REPO, 'data.js'); let src = fs.readFileSync(file, 'utf8');
const END = '        /* WOODS36-END */\n', b0 = src.indexOf('        /* WOODS36-BEGIN'), b1 = src.indexOf(END);
if (b0 >= 0 && b1 > b0) src = src.slice(0, b0) + block + src.slice(b1 + END.length);
else { const anchor = '        /* ── THE CLEARING — the crossroads of the woods'; const a = src.indexOf(anchor); if (a < 0) throw new Error('anchor not found in data.js'); src = src.slice(0, a) + block + src.slice(a); }
/* THE LINKS' WOODS ENDS: each link in LINK_ENDS gets its `a:` / `b:` line rewritten onto this room's east wall (a walked tunnel, no door: NO DOORS IN THE WOODS) */
Object.keys(LINK_ENDS).forEach(id => { const [side, z, sub] = LINK_ENDS[id], i = src.indexOf("{ id: '" + id + "'"); if (i < 0) throw new Error('link not found: ' + id);
    const re = new RegExp('\\n( +)' + side + ": \\{ site: 'prebuilt_fairy_forest'[^\\n]*"), m = re.exec(src.slice(i, i + 2500)); if (!m) throw new Error('no Woods end on link ' + id);
    const line = '\n' + m[1] + side + ": { site: 'prebuilt_fairy_forest', part: 'plots', wall: 'e', z: " + z + ", way: 'tunnel', passage: { w: 2.4, h: 2.4, len: 9, deep: 6 }, sub: '" + sub + "' },   // THE WOODS ON PLOTS: written by bake-woods.js (was the old Dead Man's Cave room)";
    src = src.slice(0, i + m.index) + line + src.slice(i + m.index + m[0].length); });
fs.writeFileSync(file, src);
console.log('data.js: site_prebuilt_fairy_forest_plots written (' + block.length + ' bytes)');
