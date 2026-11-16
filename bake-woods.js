#!/usr/bin/env node
/* bake-woods.js — THE WOODS ON PLOTS (2026-11-15, mondo: "Go ahead and pilot the woods"; his OK on the plot plan 14:51 UTC).
   The first area after Disaster City built from 12 x 12 plots: 6 x 6 plots of 42 m (252 m a side), four districts of nine.
   Reads docs/areas/woods/layout.json (the plan he approved: every plot's name, district, level, and the 72 x 72 square map)
   and the four district files docs/areas/woods/districts/C.js T.js G.js M.js (each district's own content: THE DISTRICT FILES below)
   and writes the room `site_prebuilt_fairy_forest_plots` into data.js between WOODS36-BEGIN / WOODS36-END.
   `node bake-woods.js` writes; `--dry-run` prints the counts only. Never hand-edit between the markers: edit a district file (or, with a note on the board, this tool or the layout).
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

/* ── THE TRAILS AND THE PATHS (2026-11-15, mondo: "make dirt trails like the main roads and smaller dirt paths be like alleyways from disaster city"):
   the plan drew every path two squares wide. They are laid again here from the plan's own joins: a MAIN trail (the trunk from the Stair to each
   district's heart and to the open ways out) is THREE squares wide, every other path is ONE square, an alley between the trees. Each plot keeps
   the place on its border where the plan's path crossed (so neighbours still meet) and its own clearing as the hub. Water under a path = a bridge. ── */
{ const MAIN = ['P02-04 P02-03', 'P02-03 P01-03', 'P01-03 P00-03', 'P02-03 P02-02', 'P02-02 P03-02', 'P03-02 P04-02', 'P02-02 P01-02', 'P01-02 P00-02', 'P00-02 P00-01', 'P00-01 P01-01',
      'P02-03 P03-03', 'P03-03 P04-03', 'P04-03 P05-03', 'P03-03 P03-04', 'P01-03 P01-04', 'P01-04 P01-05', 'P03-02 P03-01', 'P03-01 P04-01', 'P05-01 P04-01'];
  const isMain = (a, b) => MAIN.indexOf(a + ' ' + b) >= 0 || MAIN.indexOf(b + ' ' + a) >= 0;
  const SIDE = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] }, isPath = ch => ch === 'p' || ch === 'b';
  /* 1. where each plot's path crossed each of its borders, and its hub, read off the plan before anything is cleared */
  const info = {};
  PLAN.plots.forEach(p => { const x0 = p.x * N, y0 = p.y * N, at = {}, soft = [], pth = [];
      for (let ly = 0; ly < N; ly++) for (let lx = 0; lx < N; lx++) { const ch = cell[y0 + ly][x0 + lx]; if (ch === 'g' || ch === 's' || ch === 'r') soft.push([lx, ly]); else if (isPath(ch)) pth.push([lx, ly]); }
      (p.ports || []).forEach(sd => { for (let k = 0; k < N; k++) { const lx = sd === 'W' ? 0 : sd === 'E' ? N - 1 : k, ly = sd === 'N' ? 0 : sd === 'S' ? N - 1 : k; if (isPath(cell[y0 + ly][x0 + lx])) { at[sd] = k; break; } } });
      const src = soft.length >= 8 ? soft : pth, mx = src.reduce((t, q) => t + q[0], 0) / src.length, my = src.reduce((t, q) => t + q[1], 0) / src.length;
      const hub = src.slice().sort((a, b) => Math.hypot(a[0] - mx, a[1] - my) - Math.hypot(b[0] - mx, b[1] - my))[0];
      info[p.id] = { at, hub: [Math.max(2, Math.min(N - 3, hub[0])), Math.max(2, Math.min(N - 3, hub[1]))] }; });
  /* 2. the old paths go back to forest (a bridge square back to water) */
  for (let cy = 0; cy < W; cy++) for (let cx = 0; cx < W; cx++) { if (cell[cy][cx] === 'p') cell[cy][cx] = 't'; else if (cell[cy][cx] === 'b') cell[cy][cx] = 'w'; }
  /* 3. laid again: hub -> border, a dog-leg, `wd` squares wide (1 = [0], 3 = [-1, 0, 1]) */
  const lay = (cx, cy) => { if (cx < 0 || cy < 0 || cx >= W || cy >= W) return; const ch = cell[cy][cx]; if (ch === 't') cell[cy][cx] = 'p'; else if (ch === 'w') cell[cy][cx] = 'b'; };
  const run = (x0, y0, x1, y1, wd) => { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)), off = wd === 3 ? [-1, 0, 1] : [0];
      for (let i = 0; i <= n; i++) { const x = n ? Math.round(x0 + (x1 - x0) * i / n) : x0, y = n ? Math.round(y0 + (y1 - y0) * i / n) : y0; off.forEach(a => off.forEach(b => lay(x + a, y + b))); } };
  let nMain = 0, nSide = 0;
  PLAN.plots.forEach(p => { const I = info[p.id], x0 = p.x * N, y0 = p.y * N, hx = x0 + I.hub[0], hy = y0 + I.hub[1];
      Object.keys(I.at).forEach(sd => { const q = P(p.x + SIDE[sd][0], p.y + SIDE[sd][1]); if (!q) return; const main = isMain(p.id, q.id), wd = main ? 3 : 1;
          let k = I.at[sd] + (main ? 0 : 0); k = Math.max(main ? 1 : 0, Math.min(N - (main ? 2 : 1), k));
          const tx = sd === 'W' ? x0 : sd === 'E' ? x0 + N - 1 : x0 + k, ty = sd === 'N' ? y0 : sd === 'S' ? y0 + N - 1 : y0 + k;
          if (sd === 'N' || sd === 'S') { run(hx, hy, tx, hy, wd); run(tx, hy, tx, ty, wd); } else { run(hx, hy, hx, ty, wd); run(hx, ty, tx, ty, wd); }
          if (main) nMain++; else nSide++; }); });
  /* 4. no clearing left cut off: any open pocket the new paths miss gets its own one-square path to the nearest path square */
  const walk = ch => ch !== 't'; let tied = 0;
  for (let pass = 0; pass < 60; pass++) { const seen = new Int16Array(W * W).fill(-1), q = [], hub0 = info['P02-04'].hub, sx = 2 * N + hub0[0], sy = 4 * N + hub0[1];
      seen[sy * W + sx] = 0; q.push([sx, sy]);
      for (let i = 0; i < q.length; i++) { const [x, y] = q[i]; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + dx, Y = y + dy; if (X >= 0 && Y >= 0 && X < W && Y < W && walk(cell[Y][X]) && seen[Y * W + X] < 0) { seen[Y * W + X] = 0; q.push([X, Y]); } } }
      let lost = null; for (let cy = 0; cy < W && !lost; cy++) for (let cx = 0; cx < W; cx++) { const ch = cell[cy][cx]; if ((ch === 'g' || ch === 's' || ch === 'r' || ch === 'p') && seen[cy * W + cx] < 0) { lost = [cx, cy]; break; } }
      if (!lost) break;
      let best = null, bd = 1e9; q.forEach(c => { if (cell[c[1]][c[0]] === 'w') return; const dd = Math.abs(c[0] - lost[0]) + Math.abs(c[1] - lost[1]); if (dd < bd) { bd = dd; best = c; } });
      run(lost[0], lost[1], best[0], lost[1], 1); run(best[0], lost[1], best[0], best[1], 1); tied++; }
  count.mainLegs = nMain; count.sideLegs = nSide; count.tiedPockets = tied; }
/* a seeded roll (the room is the same every bake) */
let seed = 36; const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };

/* ── THE DISTRICT FILES (2026-11-16, mondo: "every single zone needs to be like that. now. so we can work in parallel"; the city's pattern,
   bake-disaster-city.js THE DISTRICT FILES): docs/areas/woods/districts/<LETTER>.js, one per district (C T G M), so no district's content
   lands in this tool and one thread per district can work at the same time. THIS is the one hook. A file may export any of:
     tailor(ctx)                          before the levels: its own changes to the plan's squares (ctx.cell)
     dress(ctx), horror(ctx), life(ctx)   the three passes as they were built (the dressing, THE HORROR PASS, THE LIFE PASS)
     build(ctx)                           after the three passes: new work
     wood                                 [kind, height, chance]: the feature trees deep in its forest mass
     treeZones(ctx), airZones(ctx)        its boxes of terrain.gen.zones (THE TREE ZONES) and shell.atmos.zones (THE AIR BY DISTRICT)
   Everything shared stays HERE: the plan, the trails and paths, the ways out and the link ends, the levels, the open ground, the paint, the
   water, the helpers, the room-wide scatter, the checks, the room's text. Nobody edits this tool without a note on the board (claims.md).
   THE DICE AS THEY FELL: the room is thrown with one stream of dice. Each district's pass (and the forest's feature trees) starts on the
   dice it had on the day of the split, recorded in DICE, so a district that adds or drops a roll never moves another district's pieces.
   A stage with no record (tailor, build) starts on the district's own number. A helper asked for another district's plot throws (CUR).
   Rules for the district threads: docs/notes/areas-complexes.md "THE WOODS, THE DISTRICT FILES". ── */
const ORDER = ['C', 'T', 'G', 'M'], ZONE_ORDER = ['T', 'G', 'C', 'M'];   // the order the passes run in; the order the zone boxes are written in (where two boxes overlap the first wins)
const DISTRICTS = {}; ORDER.forEach(id => { DISTRICTS[id] = require(path.join(REPO, 'docs/areas/woods/districts', id + '.js')); if (PLAN.districts[id] == null) throw new Error('no district ' + id + ' in the layout'); });
const DICE = { 'dress:C': 36, 'dress:T': 1377330049, 'dress:G': 566877657, 'dress:M': 372329789, trees: 1659391338, 'horror:C': 1521009274, 'horror:T': 183829286, 'horror:G': 2272949896, 'horror:M': 1522822202, 'life:C': 778520746, 'life:T': 1241599519, 'life:G': 899598347, 'life:M': 1950804137 };
const OWN = { C: 3601, T: 3602, G: 3603, M: 3604 };
let CUR = null;
const ctx = { PLAN, plot, P, cell, open, features, props, doors, npc, count, C, N, G, W, PL, HALF, LEVEL, gx, gc, r2 };
function stage(name) { ORDER.forEach((id, i) => { const m = DISTRICTS[id], k = name + ':' + id;
    if (process.env.WOODS_DICE) console.log('dice ' + k + ' ' + seed); else seed = DICE[k] != null ? DICE[k] : OWN[id] + (name === 'build' ? 100 : 0);
    if (typeof m[name] !== 'function') return; CUR = id; try { m[name](ctx); } finally { CUR = null; } }); }

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
door('forest', 'P02-05', 's', { way: 'trail', label: 'THE FAIRY FOREST', sub: 'THE HOLLOW TREE · BACK · ROOM 420', action: { room: 'site_prebuilt_fairy_forest', at: 'woods' },
    desc: 'The path back between two trees that lean in to hear you go. The forest proper is that way, and the crossing console, and the door that objected.' });
/* the trail west to Camelot is the LINK `woods_camelot` (data.js DOOR_HQ.links, a two-way door at w, z 3.5); the HQ Stair is the LINK `woods_stair`: only the path is cut here */
{ const z = spur('P00-03', 'w'); if (z !== 3.5) throw new Error('the Camelot trail moved to z ' + z + ': move the woods_camelot link end in data.js too'); }
door('estate', 'P01-05', 's', { way: 'trail', label: 'THE ESTATE · THE CORN FIELDS', sub: 'THE FENCE LINE · THE GATE', action: { room: 'site_prebuilt_skinwalker_estate', at: 'woods' },
    desc: 'A fence, and a gate in it. The corn starts on the other side.' });
/* the storm drain's three ways are LINKS now, two-way (data.js DOOR_HQ.links; the tool writes their Woods ends at the end of the bake): `streets_drain`
   (Disaster City's gutter) on the Storm Drain plot, `sewers_drain` (the city sewers) on the Outfall, `woods_sewer` (the HQ tunnel) on the Tunnel Way */
const LINK_ENDS = { streets_drain: ['b', spur('P05-03', 'e'), 'THE CULVERT · UP TO THE STREET'], sewers_drain: ['b', spur('P05-04', 'e'), 'THE CULVERT · INTO THE SEWERS'] };
/* THE MOUNTAINS ON PLOTS (2026-11-15): the Snowline's trail goes on up: Mount Shasta's Trailhead (bake-mountains.js room, its `woods` door) */
door('shasta', 'P00-00', 'n', { way: 'trail', label: 'MOUNT SHASTA · THE TRAILHEAD', sub: 'THE SNOWLINE · THE TRAIL UP', action: { room: 'site_prebuilt_shasta_mountains', at: 'woods' },
    desc: 'The trail keeps climbing after the trees give up. There is snow on it from here.' });
/* NO UNEXPLAINED DEAD ENDS (2026-11-15, mondo): a secret TRAIL gets no waymark post, so its path just stopped at the trees. The three secret ways show what they are now:
   each is a plain signposted trail and no longer secret (2026-11-16, mondo on the hollow-tree way's ball-crowned stand-in: "get rid of those and delete them from the game";
   the path back to Room 420 is a trail end too). NOT a `tunnel`: a tunnel end in this open room builds a big stone block on the wall
   (seen in the probe 11-16: the "castle wall" mondo walked through, and a black shaft over the trees). Still draughts (on no plate, on the map once found). */
door('lemuria', 'P01-00', 'n', { way: 'trail', label: 'AGARTHA · THE CRYSTAL CITY', sub: 'LEMURIA · THE ADIT UNDER THE MOUNTAIN', action: { room: 'site_prebuilt_agartha_crystalcity', at: 'link_shasta_lemuria' },
    desc: 'A draught out of the rock shelf, warmer than the snow above it.' });
door('lodge', 'P05-00', 'e', { way: 'trail', label: 'THE LODGE · THE HALLS', sub: 'THE MEMBERS’ TUNNEL · UNDER THE LAWN', action: { room: 'site_prebuilt_lodge_halls', at: 'link_grove_lodge' },
    desc: 'A tunnel under the lake shore that nobody admits to.' });
door('lookingglass', 'P05-02', 'e', { way: 'trail', label: 'THE LOOKING-GLASS · THE GARDEN', sub: 'THE DEAD TREE · THE HOLE LOOKS ONTO MARBLE', action: { room: 'site_prebuilt_camelot_kingdom', at: 'deadtree' },   // CAMELOT KINGDOM ON PLOTS (2026-11-15): the garden is a district of the kingdom room now (was the old garden room)
   
    desc: 'Past the dead tree the ground is the wrong colour.' });
LINK_ENDS.woods_sewer = ['a', spur('P05-05', 'e'), 'THE DRAIN · INTO THE TUNNEL'];

/* a district's own changes to the plan's squares: districts/<LETTER>.js tailor(ctx) (Dead Man's Cave: the Gully's yard) */
stage('tailor');
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
function freeSquares(id) { const p = plot[id], out = []; if (CUR && p.district !== CUR) throw new Error('not yours: districts/' + CUR + '.js asked for ' + id + ' ' + p.name + ' (district ' + p.district + ')'); for (let ly = 1; ly < N - 1; ly++) for (let lx = 1; lx < N - 1; lx++) { const ch = cell[p.y * N + ly][p.x * N + lx]; if (ch === 'g' || ch === 's' || ch === 'r') out.push([p.x * N + lx, p.y * N + ly]); } return out; }
const taken = new Set();
function centre(id) { const f = freeSquares(id); if (!f.length) throw new Error('no clearing on ' + id); const mx = f.reduce((s, q) => s + q[0], 0) / f.length, my = f.reduce((s, q) => s + q[1], 0) / f.length;
    return f.slice().sort((a, b) => Math.hypot(a[0] - mx, a[1] - my) - Math.hypot(b[0] - mx, b[1] - my))[0]; }
function near(id, dx, dy) {   // the free, untaken clearing square nearest the plot's clearing middle + (dx, dy)
    const c = centre(id), f = freeSquares(id).filter(q => !taken.has(q[0] + ':' + q[1])); if (!f.length) throw new Error('plot full: ' + id);
    const q = f.sort((a, b) => Math.hypot(a[0] - c[0] - dx, a[1] - c[1] - dy) - Math.hypot(b[0] - c[0] - dx, b[1] - c[1] - dy))[0]; taken.add(q[0] + ':' + q[1]); return q; }
function put(id, key, dx, dy, o) { const q = near(id, dx || 0, dy || 0); props.push(Object.assign({ key, x: gc(q[0]), z: gc(q[1]) }, o || {})); return q; }
function dec(id, key, dx, dy, o) { const q = near(id, dx || 0, dy || 0); props.push(Object.assign({ key, x: r2(gc(q[0]) + (rnd() - 0.5) * 1.6), z: r2(gc(q[1]) + (rnd() - 0.5) * 1.6), face: Math.round(rnd() * 360) }, o || {})); return q; }
/* THE FULL TREES (2026-11-15, mondo): every leafy tree of the Woods is the pack's tree with a real crown (bake-trees.py, data.js HQ_TREE_KINDS
   tree_52 … tree_56), never the two crossed cards. FULL maps the old kind to its full twin; the bare trees stay as they are. */
const FULL = { tree: 'tree_53', tree_2: 'tree_55', tree_3: 'tree_52', tree_4: 'tree_54', pine: 'tree_56' }, full = k => FULL[k] || k;
function tree(id, kind, h, dx, dy, r) { const q = near(id, dx || 0, dy || 0); features.push({ k: 'tree', x: gc(q[0]), z: gc(q[1]), kind: full(kind), h, r: r || 0.8 }); return q; }
function native(id, race, dx, dy, face) { const q = near(id, dx || 0, dy || 0); npc.push({ x: gc(q[0]), z: gc(q[1]), face: face || 0, race }); }
function hdec(id, key, dx, dy, o) { try { return dec(id, key, dx, dy, o); } catch (e) { if (/not yours/.test(e.message)) throw e; count.horrorSkipped = (count.horrorSkipped || 0) + 1; return null; } }   // put / dec, skipped when the plot is full
function hput(id, key, dx, dy, o) { try { return put(id, key, dx, dy, o); } catch (e) { if (/not yours/.test(e.message)) throw e; count.horrorSkipped = (count.horrorSkipped || 0) + 1; return null; } }
const softAt = (cx, cy) => cx >= 0 && cy >= 0 && cx < W && cy < W && /[gsr]/.test(cell[cy][cx]);
function life(id, key, o) {   // a small thing somewhere on the plot's open ground, off the middle of its square; shares squares (never claims one)
    const f = freeSquares(id); if (!f.length) return null; const fr = f.filter(q => !taken.has(q[0] + ':' + q[1])), q = (fr.length ? fr : f)[Math.floor(rnd() * (fr.length ? fr.length : f.length))];
    const a = rnd() * 6.2832, d = 0.7 + rnd() * 0.8; props.push(Object.assign({ key, x: r2(gc(q[0]) + Math.cos(a) * d), z: r2(gc(q[1]) + Math.sin(a) * d), face: Math.round(rnd() * 360) }, o || {})); return q; }
const fly = (id, key, y) => life(id, key, { floor: true, y: r2(y * (0.8 + rnd() * 0.5)) });
const sow = (key, n, sq, r, o) => features.push(Object.assign({ k: 'scatter', key, n, seed: 100 + features.length, x: gx(sq[0]), z: gx(sq[1]), r }, o || {}));   // a scatter over a disc (squares → m)
const DIST = d => PLAN.plots.filter(p => p.district === d).map(p => p.id);
const zoneOf = (x0, y0, x1, y1) => ({ x0: gx(x0 * N), z0: gx(y0 * N), x1: gx(x1 * N), z1: gx(y1 * N) });   // a box of plots in metres (the tree zones, the air zones)
Object.assign(ctx, { ground, freeSquares, taken, centre, near, put, dec, tree, full, native, hput, hdec, softAt, life, fly, sow, DIST, zoneOf, rnd });
/* each district's own pieces: districts/<LETTER>.js dress(ctx) (THE CLEARING, THE REDWOOD TRAIL + MOUNT SHASTA, THE RITUAL GROUND + BOHEMIAN GROVE, DEAD MAN'S CAVE) */
stage('dress');

/* trees in the forest mass that give a district its own wood: redwoods through the Redwood Trail, pines up the mountain, dead trees round the cave */
{ const want = {}; ORDER.forEach(id => { want[id] = DISTRICTS[id].wood; });   // each district's own wood: districts/<LETTER>.js `wood`
  if (process.env.WOODS_DICE) console.log('dice trees ' + seed); else seed = DICE.trees;
  for (let cy = 1; cy < W - 1; cy++) for (let cx = 1; cx < W - 1; cx++) { if (cell[cy][cx] !== 't') continue; const p = P(Math.floor(cx / N), Math.floor(cy / N)), wd = want[p.district];
      let deep = true; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (cell[cy + dy][cx + dx] !== 't') deep = false;
      if (!deep || rnd() > wd[2]) continue; const mountain = p.level >= 6;
      features.push({ k: 'tree', x: r2(gc(cx) + (rnd() - 0.5) * 1.4), z: r2(gc(cy) + (rnd() - 0.5) * 1.4), kind: full(mountain ? 'pine' : wd[0]), h: r2((mountain ? 7 : wd[1]) * (0.8 + rnd() * 0.4)), r: 0.7 }); count.bigTrees = (count.bigTrees || 0) + 1; } }
features.push({ k: 'scatter', key: 'fern', n: 140, seed: 5 }, { k: 'scatter', key: 'stump', n: 18, seed: 6 }, { k: 'scatter', key: 'fallen_log', n: 10, seed: 7, r0: 1.9 });

/* ── THE HORROR PASS (2026-11-15, mondo: "What can we do to give more of a horror element to the woods" + "yes you can do the yellow and pink too"):
   it gets worse the farther you walk from the Stair. The Clearing = someone was just here; the Redwood Trail = you are being watched; the Ritual
   Ground = the cult; Dead Man's Cave = where things get dumped. Blockers on a square's middle (put), small things off it (dec), nothing on a path.
   The plan picture: project files world-areas-plan/woods/woods_horror_plan.png. No ceiling / wall pieces (no meat hooks: nothing to hang them from). ── */
function hdec(id, key, dx, dy, o) { try { return dec(id, key, dx, dy, o); } catch (e) { count.horrorSkipped = (count.horrorSkipped || 0) + 1; return null; } }
function hput(id, key, dx, dy, o) { try { return put(id, key, dx, dy, o); } catch (e) { count.horrorSkipped = (count.horrorSkipped || 0) + 1; return null; } }
const h0 = props.length; ctx.h0 = h0;
stage('horror');
count.horror = props.length - h0;

/* ── THE LIFE PASS (2026-11-15, mondo: "make the woods come alive and look good ... look at the nature spells for inspiration ... same with the fairy
   forest"; his OK on the four looks + "yes lets do per district particles"). Each district is its own wood:
   THE CLEARING = the friendly woods (birch, heal flowers, butterflies, bees, rabbits; fireflies in the air);
   THE REDWOOD TRAIL = ancient and overgrown (giants, thorn vine at the trunks, mushrooms on the logs, boulders; green spores, snow on the Snowline);
   THE RITUAL GROUND = the fairy forest gone wrong (a glowing toadstool ring at the Stones, giant caps on the lake shore, crystals, moths, frogs; violet motes);
   DEAD MAN'S CAVE = rot and thorns (bare trees, bramble, gas plants, spore caps, crows, frogs at the Pool; ash).
   The plants are the nature spells' own (the garden's thorn vine / gas plant / heal flower models, data.js catalogue woods_*). Small things only: nothing
   blocks a path, the new glows carry `noLight` (the room's ten real lights are spoken for). No apple tree (a Meshy tree). ── */
const l0 = props.length, f0 = features.length;
stage('life');
count.life = props.length - l0; count.lifeScatter = features.length - f0;
/* NEW WORK: a district's build(ctx), after the three passes (its own dice) */
{ const b0 = props.length, g0 = features.length; stage('build'); if (props.length > b0 || features.length > g0) { count.built = props.length - b0; count.builtRows = features.length - g0; } }
/* the forest mass by district (data.js THE TREE ZONES) and the air by district (three-renderer.js THE AIR BY DISTRICT); the mountain plots first */
const TREE_ZONES = [].concat(...ZONE_ORDER.map(id => DISTRICTS[id].treeZones ? DISTRICTS[id].treeZones(ctx) : []));
const ATMOS = { kind: 'spores', zones: [].concat(...ZONE_ORDER.map(id => DISTRICTS[id].airZones ? DISTRICTS[id].airZones(ctx) : [])) };

/* ── checks: every prop key is in the catalogue, nothing stands on a tree square, every plot is reached on foot from the Stair ── */
const D = require('./load-data.js').loadGameData(), vm = require('vm'), CAT = vm.runInContext('DOOR_HQ.catalogue', D), RACES = vm.runInContext('AVAILABLE_RACES', D);
props.forEach(p => { if (!CAT[p.key]) throw new Error('not in the catalogue: ' + p.key); });
npc.forEach(n => { if (RACES.indexOf(n.race) < 0) throw new Error('not a unit: ' + n.race); });
{ const s = centre('P02-04'), seen = new Uint8Array(W * W), st = [[s[0], s[1] + 2]]; if (!open(st[0][0], st[0][1])) throw new Error('the Stair foot is not open');
  seen[st[0][1] * W + st[0][0]] = 1;
  while (st.length) { const [x, y] = st.pop(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + dx, Y = y + dy; if (open(X, Y) && !seen[Y * W + X]) { seen[Y * W + X] = 1; st.push([X, Y]); } } }
  const cold = PLAN.plots.filter(p => { for (let ly = 0; ly < N; ly++) for (let lx = 0; lx < N; lx++) if (seen[(p.y * N + ly) * W + p.x * N + lx]) return false; return true; }).map(p => p.id);
  if (cold.length) throw new Error('plots not reached: ' + cold.join(' '));
  let op = 0, un = 0; for (let cy = 0; cy < W; cy++) for (let cx = 0; cx < W; cx++) if (open(cx, cy)) { op++; if (!seen[cy * W + cx]) un++; } count.openSquares = op; count.unreachedSquares = un; 
  if (process.env.WOODS_DUMP) console.log(cell.map((r, cy) => r.map((ch, cx) => open(cx, cy) && !seen[cy * W + cx] ? '!' : ch === 't' ? ' ' : ch).join('')).join('\n')); }
count.props = props.length; count.features = features.length; count.doors = doors.length; count.natives = npc.length;

/* ── the room ── */
const J = v => JSON.stringify(v).replace(/"([a-zA-Z_][a-zA-Z0-9_]*)":/g, '$1:').replace(/'/g, "\\'").replace(/"/g, "'");
const sp = centre('P02-04'), L = [];
L.push("        /* WOODS36-BEGIN — THE WOODS ON PLOTS (2026-11-15): written by `node bake-woods.js` from docs/areas/woods/layout.json. Never hand-edit between the markers; edit the tool or the layout and rerun. */");
L.push("        site_prebuilt_fairy_forest_plots: {");
L.push("            label: 'THE WOODS',");
L.push("            sub: 'FOUR DISTRICTS · 36 PLOTS',");
L.push("            kind: 'box', site: 'prebuilt_fairy_forest', part: 'plots',");
L.push("            shell: hqWoodsShell({ w: " + (2 * HALF) + ", d: " + (2 * HALF) + ", plate: { x: " + gx(sp[0]) + ", z: " + gc(sp[1] + 2) + ", y: 4.2 }, forest: { depth: 7, spacing: 3.5, rows: 2, start: 1.6, canopy: { to: 54 } }, noLandmarks: true, atmos: " + J(ATMOS) + " }),");
L.push("            parti: 'Four districts of nine plots, every plot a twelve by twelve board: clearings joined by dirt paths through forest you cannot enter, climbing from the fence line to the snow.',");
L.push("            typology: 'grid',");
L.push("            plots: { cell: " + C + ", plot: " + PL + ", n: " + G + ", names: " + J(PLAN.plots.map(p => [p.id, p.name, p.district, p.level])) + " },");
L.push("            terrain: {");
L.push("                res: 0.875, floor: 'grass_2', cliff: 'rock_wall_1', path: 'dirt_2',");
L.push("                noise: { amp: 0.12, scale: 8 },");
L.push("                slope: { cells: { res: " + C + ", x0: " + gx(0) + ", z0: " + gx(0) + ", nx: " + W + ", nz: " + W + ", d: '" + slope.toString('base64') + "' } },");
L.push("                paint: { pal: " + J(PAL) + ", t: 'u8', res: " + C + ", x0: " + gc(0) + ", z0: " + gc(0) + ", nx: " + W + ", nz: " + W + ", d: '" + Buffer.from(paint).toString('base64') + "' },");
L.push("                gen: { kind: 'plan', look: 'trees', seed: 36, rim: 0, forceGrow: 0, treeGap: 2.6, treeIn: 0.9, spacing: 3.5, depth: 5.25, maxTrees: 2400, treeH: [5.5, 8.5], kinds: ['tree_53', 'tree_55', 'tree_52', 'tree_53', 'tree_5', 'tree_55'], zones: " + J(TREE_ZONES) + " },");
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
    /* NO TUNNEL BLOCKS (2026-11-16, mondo: "what is this big castle wall thing ... clipping into the bridges and I can walk through it"): a `tunnel` passage on this open
       room's wall is a stone housing 6 m deep standing in the trees. The two drains are plain trail ends now (a waymark post names them); the secret one is a hollow tree. */
    const line = '\n' + m[1] + side + ": { site: 'prebuilt_fairy_forest', part: 'plots', wall: 'e', z: " + z + ", way: '" + 'trail' + "', sub: '" + sub + "' },   // THE WOODS ON PLOTS: written by bake-woods.js (was the old Dead Man's Cave room)";
    src = src.slice(0, i + m.index) + line + src.slice(i + m.index + m[0].length); });
fs.writeFileSync(file, src);
console.log('data.js: site_prebuilt_fairy_forest_plots written (' + block.length + ' bytes)');
