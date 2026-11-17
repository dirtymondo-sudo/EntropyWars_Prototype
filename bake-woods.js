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
let CELL0 = null; const LEGS = {}, HUBS = {};   // THE ONE WORLD MOVE (at the end of this file): the squares before the paths, each plot's legs and hub

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
  CELL0 = cell.map(r => r.slice());   // THE ONE WORLD MOVE reads the squares as they stood before any path was laid
  /* 3. laid again: hub -> border, a dog-leg, `wd` squares wide (1 = [0], 3 = [-1, 0, 1]) */
  const lay = (cx, cy) => { if (cx < 0 || cy < 0 || cx >= W || cy >= W) return; const ch = cell[cy][cx]; if (ch === 't') cell[cy][cx] = 'p'; else if (ch === 'w') cell[cy][cx] = 'b'; };
  const run = (x0, y0, x1, y1, wd, cover) => { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)), off = wd === 3 ? [-1, 0, 1] : [0];
      for (let i = 0; i <= n; i++) { const x = n ? Math.round(x0 + (x1 - x0) * i / n) : x0, y = n ? Math.round(y0 + (y1 - y0) * i / n) : y0; off.forEach(a => off.forEach(b => { lay(x + a, y + b); if (cover) cover.push([x + a, y + b]); })); } };
  let nMain = 0, nSide = 0;
  PLAN.plots.forEach(p => { const I = info[p.id], x0 = p.x * N, y0 = p.y * N, hx = x0 + I.hub[0], hy = y0 + I.hub[1];
      Object.keys(I.at).forEach(sd => { const q = P(p.x + SIDE[sd][0], p.y + SIDE[sd][1]); if (!q) return; const main = isMain(p.id, q.id), wd = main ? 3 : 1;
          let k = I.at[sd] + (main ? 0 : 0); k = Math.max(main ? 1 : 0, Math.min(N - (main ? 2 : 1), k));
          const tx = sd === 'W' ? x0 : sd === 'E' ? x0 + N - 1 : x0 + k, ty = sd === 'N' ? y0 : sd === 'S' ? y0 + N - 1 : y0 + k;
          const cover = []; (LEGS[p.id] || (LEGS[p.id] = {}))[sd] = { k, wd, cover };   // THE ONE WORLD MOVE: which squares each leg ran over
          if (sd === 'N' || sd === 'S') { run(hx, hy, tx, hy, wd, cover); run(tx, hy, tx, ty, wd, cover); } else { run(hx, hy, hx, ty, wd, cover); run(hx, ty, tx, ty, wd, cover); }
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
  count.mainLegs = nMain; count.sideLegs = nSide; count.tiedPockets = tied; Object.keys(info).forEach(id => { HUBS[id] = info[id].hub; }); }
/* a seeded roll (the room is the same every bake) */
let seed = 36; const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };

/* ── THE DISTRICT FILES (2026-11-16, mondo: "every single zone needs to be like that. now. so we can work in parallel"; the city's pattern,
   bake-disaster-city.js THE DISTRICT FILES): docs/areas/woods/districts/<LETTER>.js, one per district (C T G M), so no district's content
   lands in this tool and one thread per district can work at the same time. THIS is the one hook. A file may export any of:
     tailor(ctx)                          before the levels: its own changes to the plan's squares (ctx.cell)
     cut(ctx)                             after the glades: LATER changes to its squares (THE CUT below; new square edits go here)
     ground                               a terrain sheet for its grass and forest floor (THE GROUND BY DISTRICT); bare = [x0, z0, x1, z1] no scatter lands on
     water(row, ctx)                      each water row of the tool (stream / pool): return it, a changed one, or null (THE WATER BY DISTRICT)
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
const BUILD_SOW = { C: 377, T: 377, G: 430, M: 430 };   // the count each district's build started on, 2026-11-16 (THE BUILD SEEDS HOLD, in stage())
let CUR = null;
const ctx = { PLAN, plot, P, cell, open, features, props, doors, npc, count, C, N, G, W, PL, HALF, LEVEL, gx, gc, r2 };
function stage(name) { ORDER.forEach((id, i) => { const m = DISTRICTS[id], k = name + ':' + id;
    if (process.env.WOODS_DICE) console.log('dice ' + k + ' ' + seed); else seed = DICE[k] != null ? DICE[k] : OWN[id] + (name === 'build' ? 100 : 0);
    /* THE BUILD SEEDS HOLD (2026-11-16, the Clearing thread; board note of the day): a `sow` row's seed counts the feature rows before it, and the builds run C, T, G, M,
       so every feature row one district's build added re-threw the build scatters of the districts after it. Each district's build now starts its count on the
       number it had that day (BUILD_SOW; WOODS_SOW=1 prints them as they fall), so a build row moves nobody else's scatter. */
    if (name === 'build') { if (process.env.WOODS_SOW) console.log('sow build:' + id + ' ' + (features.length + SOW_SHIFT)); else if (BUILD_SOW[id] != null) SOW_SHIFT = BUILD_SOW[id] - features.length; }
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
door('shasta', 'P00-00', 'n', { way: 'trail', label: 'MOUNT SHASTA · THE TRAILHEAD', sub: 'THE SNOWLINE · THE TRAIL UP', action: { room: 'site_prebuilt_shasta_mountains', at: 'woods' },   // ONE WORLD, PHASE 3 (2026-11-17): the Mountains zone thread retires this room into Mount Shasta's own room, door `woods` kept, so this lands either way
   
    desc: 'The trail keeps climbing after the trees give up. There is snow on it from here.' });
/* NO UNEXPLAINED DEAD ENDS (2026-11-15, mondo): a secret TRAIL gets no waymark post, so its path just stopped at the trees. The three secret ways show what they are now:
   each is a plain signposted trail and no longer secret (2026-11-16, mondo on the hollow-tree way's ball-crowned stand-in: "get rid of those and delete them from the game";
   the path back to Room 420 is a trail end too). NOT a `tunnel`: a tunnel end in this open room builds a big stone block on the wall
   (seen in the probe 11-16: the "castle wall" mondo walked through, and a black shaft over the trees). Still draughts (on no plate, on the map once found). */
door('lemuria', 'P01-00', 'n', { way: 'trail', label: 'AGARTHA · THE CRYSTAL CITY', sub: 'LEMURIA · THE ADIT UNDER THE MOUNTAIN', action: { room: 'site_prebuilt_hollow_earth_cavern', at: 'woods' },   // THE CAVERN ON PLOTS: Agartha is a district of the Cavern room; its `woods` door at the Lemuria Stair walks back here (2026-11-16, was the retired crystal city)
    desc: 'A draught out of the rock shelf, warmer than the snow above it.' });
/* THE OLD SITES RETIRED (2026-11-16, mondo: "can we remove all of the old sites from the game, if we already rebuilt them with plots"): the old Lodge room is
   Disaster City's Members club and the old Bohemian Grove is this district G (data.js DOOR_HQ.retired). The members' tunnel (was the one-way door `lodge`) is the
   link `grove_lodge` now, two-way, from the lake's east shore to the Members club's garden; Room 333's circle (link `woods_ritual`, was on the retired Ritual Ground
   room) comes out at the Owl; DOOR HQ's Bohemian Grove bay door is a trail on the north wall over the lake's west shore (siteRooms.entry.prebuilt_bohemian_grove). */
LINK_ENDS.grove_lodge = ['a', spur('P05-00', 'e'), 'THE MEMBERS\u2019 TUNNEL · UNDER THE LAWN TO THE CLUB'];
LINK_ENDS.woods_ritual = ['a', spur('P05-01', 'e'), 'THE CIRCLE · ROOM 333'];
const GROVE_BAY_X = spur('P04-00', 'n');
door('lookingglass', 'P05-02', 'e', { way: 'trail', label: 'THE LOOKING-GLASS · THE GARDEN', sub: 'THE DEAD TREE · THE HOLE LOOKS ONTO MARBLE', action: { room: 'site_prebuilt_camelot_ow_forest', at: 'deadtree' },   // ONE WORLD, PHASE 3 (2026-11-17): the Dead Tree's Hole stands in Camelot's Forest room (the Camelot zone thread)
      // CAMELOT KINGDOM ON PLOTS (2026-11-15): the garden is a district of the kingdom room now (was the old garden room)
   
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
/* THE CUT (2026-11-16): a district's LATER changes to its squares: districts/<LETTER>.js cut(ctx), after the glades. The forest's feature trees are still
   thrown on the squares as they stood before it (cellT), so a district that opens or dries ground moves no other district's trees; a tree is only left
   out where its square is no longer forest. New square edits go in `cut`, never in `tailor` (a tailor edit moves the glades and the forest's dice). */
const cellT = cell.map(r => r.slice());
stage('cut');
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
/* THE GROUND BY DISTRICT (2026-11-16, mondo: "why can't districts have different grounds"): a district file's `ground: '<terrain sheet>'` paints its grass AND its
   forest squares in that sheet (0 stays the room's own sheet for a district that names none) */
const GROUND = {}; ORDER.forEach(id => { const k = DISTRICTS[id].ground; if (k) { let i = PAL.indexOf(k); if (i < 0) { PAL.push(k); i = PAL.length - 1; } GROUND[id] = i + 1; } });
for (let cy = 0; cy < W; cy++) for (let cx = 0; cx < W; cx++) { const ch = cell[cy][cx]; paint[cy * W + cx] = ch === 's' ? 1 : ch === 'r' ? 2 : (ch === 'p' || ch === 'b') ? 3 : (ch === 'g' || ch === 't') ? (GROUND[P(Math.floor(cx / N), Math.floor(cy / N)).district] || 0) : 0; }

/* ── THE WATER: the creek from the Falls to the Outfall, one short `stream` row a square so the water steps down the hill with the ground
   (a stream row is one flat sheet); the lake, the falls' pool, the Pool. A plank deck wherever a path crosses. ── */
/* THE WATER BY DISTRICT (2026-11-16, mondo on Dead Man's Cave: "dry creek ... dry riverbed"; "why is there a pool in the woods ... this is dead man's cave"):
   every water row passes each district's own `water(row)` (districts/<LETTER>.js): it returns the row, a changed row (a stream cut short) or null (dropped).
   A district only touches water on its own plots. */
function water(row, ok) { for (const id of ORDER) { if (row && typeof DISTRICTS[id].water === 'function') row = DISTRICTS[id].water(row, ctx); } if (row) { features.push(row); if (ok) ok(); } }
const CREEK = [[32, 5], [33, 14], [31, 22], [33, 30], [38, 39], [45, 42], [52, 45], [54, 53], [63, 55], [72, 54.5]];   // squares (the plan's course)
{ const pts = []; for (let i = 0; i + 1 < CREEK.length; i++) { const a = CREEK[i], b = CREEK[i + 1], n = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1])));
      for (let q = 0; q < n; q++) pts.push([gx(a[0] + (b[0] - a[0]) * q / n + 0.5), gx(a[1] + (b[1] - a[1]) * q / n + 0.5)]); }
  pts.push([gx(72), gx(55)]);
  /* one row while the ground under it stays within 0.45 m (a flat stretch is one long sheet; on a grade the creek steps down in short runs) */
  const hsOf = q => { const o = []; for (const d of [-1.75, 0, 1.75]) o.push(ground(q[0] + d, q[1]), ground(q[0], q[1] + d)); return o; };
  let i = 0; while (i + 1 < pts.length) { let j = i + 1, lo = Math.min(...hsOf(pts[i])), hi = Math.max(...hsOf(pts[i]));
      for (;;) { const h = hsOf(pts[j]), l2 = Math.min(lo, ...h), h2 = Math.max(hi, ...h); if (h2 - l2 > 0.45 && j > i + 1) break; lo = l2; hi = h2; if (j + 1 >= pts.length) { j++; break; } j++; }
      const seg = pts.slice(i, Math.min(j, pts.length - 1) + 1), h0 = ground(seg[0][0], seg[0][1]);
      water({ k: 'stream', pts: seg.map(q => [r2(q[0]), r2(q[1])]), w: 4.4, y: r2(lo - h0 - 0.25), depth: r2(hi - lo + 0.6), key: 'water' }, () => { count.creek = (count.creek || 0) + 1; });
      i = Math.min(j, pts.length - 1); if (i >= pts.length - 1) break; } }
water({ k: 'pool', x: gc(32), z: gc(3), r: 7, rz: 6, y: -0.25, depth: 0.9, key: 'water', bank: 1.2 });                      // the Falls' pool
water({ k: 'pool', x: gx(60), z: gc(5), r: 21, rz: 13, y: -0.3, depth: 1.0, key: 'water', bank: 2.0 });                      // THE LAKE, both shores
water({ k: 'pool', x: gc(54), z: gc(66), r: 8, rz: 7, y: -0.3, depth: 0.9, key: 'water', bank: 1.4 });                       // THE POOL
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
const SOW_BASE = 260; let SOW_SHIFT = 0;   // THE SEEDS HOLD (2026-11-16): a sow's seed counts the feature rows before it; the count at the dressing's start is pinned to the day's (SOW_BASE), so a district that dries a creek or changes its squares re-throws nobody's scatter
const sow = (key, n, sq, r, o) => features.push(Object.assign({ k: 'scatter', key, n, seed: 100 + features.length + SOW_SHIFT, x: gx(sq[0]), z: gx(sq[1]), r }, o || {}));   // a scatter over a disc (squares → m)
const DIST = d => PLAN.plots.filter(p => p.district === d).map(p => p.id);
const zoneOf = (x0, y0, x1, y1) => ({ x0: gx(x0 * N), z0: gx(y0 * N), x1: gx(x1 * N), z1: gx(y1 * N) });   // a box of plots in metres (the tree zones, the air zones)
Object.assign(ctx, { ground, freeSquares, taken, centre, near, put, dec, tree, full, native, hput, hdec, softAt, life, fly, sow, DIST, zoneOf, rnd });
/* each district's own pieces: districts/<LETTER>.js dress(ctx) (THE CLEARING, THE REDWOOD TRAIL + MOUNT SHASTA, THE RITUAL GROUND + BOHEMIAN GROVE, DEAD MAN'S CAVE) */
if (process.env.WOODS_DICE) console.log('rows before the dressing ' + features.length); SOW_SHIFT = SOW_BASE - features.length;
stage('dress');

/* trees in the forest mass that give a district its own wood: redwoods through the Redwood Trail, pines up the mountain, dead trees round the cave */
{ const want = {}; ORDER.forEach(id => { want[id] = DISTRICTS[id].wood; });   // each district's own wood: districts/<LETTER>.js `wood`
  if (process.env.WOODS_DICE) console.log('dice trees ' + seed); else seed = DICE.trees;
  for (let cy = 1; cy < W - 1; cy++) for (let cx = 1; cx < W - 1; cx++) { if (cellT[cy][cx] !== 't') continue; const p = P(Math.floor(cx / N), Math.floor(cy / N)), wd = want[p.district];
      let deep = true; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (cellT[cy + dy][cx + dx] !== 't') deep = false;
      if (!deep || rnd() > wd[2]) continue; const mountain = p.level >= 6;
      const tx = r2(gc(cx) + (rnd() - 0.5) * 1.4), tz = r2(gc(cy) + (rnd() - 0.5) * 1.4), th = r2((mountain ? 7 : wd[1]) * (0.8 + rnd() * 0.4));
      let still = true; for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) if (cell[cy + dy][cx + dx] !== 't') still = false;   // THE CUT: the square (or one beside it) was opened since
      if (still) features.push({ k: 'tree', x: tx, z: tz, kind: full(mountain ? 'pine' : wd[0]), h: th, r: 0.7, mass: 1 }); else SOW_SHIFT++;   /* `mass` = the forest's own tree (THE ONE WORLD MOVE takes it out where a path is laid over it; the writer strips the mark) */   /* a tree left out counts as a row for the seeds (THE SEEDS HOLD) */ if (still) count.bigTrees = (count.bigTrees || 0) + 1; } }
/* BARE GROUND (2026-11-16, mondo: "take the plants off of the concrete"): a district file's `bare: [x0, z0, x1, z1]` (metres) is ground no scatter piece lands on
   (a scatter row's `off` box; one box in the room today: Dead Man's Cave's concrete apron) */
const BARE = ORDER.map(id => DISTRICTS[id].bare).filter(Boolean)[0], offB = BARE ? { off: BARE } : {};
features.push(Object.assign({ k: 'scatter', key: 'fern', n: 140, seed: 5 }, offB), Object.assign({ k: 'scatter', key: 'stump', n: 18, seed: 6 }, offB), Object.assign({ k: 'scatter', key: 'fallen_log', n: 10, seed: 7, r0: 1.9 }, offB));

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


/* ══ THE ONE WORLD MOVE (2026-11-17, mondo's approved map v13; docs/plans/one-world/BUILD_PLAN.md phase 2, the test slice) ══════════════════════
   Everything above builds the Woods in THE HOME FRAME, the 6 x 6 room the four district files were written for. Nothing above changed.
   Here the result is stood where the One World map puts it (docs/plans/one-world/plots.json; the mover = ow-move.js):
     THE CLEARING (district C)      -> its own room at world plots -17..-13 x 0..4, a cross: the Stair north, the Fence Line south
     DEAD MAN'S CAVE (district M)   -> its own room at -12..-6 x 0..2: the dry creek, west to east, to the Storm Drain
     THE REDWOOD TRAIL + THE RITUAL GROUND (T, G) stay as they stood (one room, 6 x 3 plots) until the Woods' own thread moves them
   A plot keeps its name, its squares and every piece on it; its id is its place in its new room's grid. What is laid again is the tool's
   own: the legs between plots (a leg to a side with nobody past it goes back to forest; a side with a new neighbour gets a leg from the
   plot's hub), the levels, the open ground, the paint, the room-wide scatter, the doors on the seams. Rules: docs/notes/areas-complexes.md
   "ONE WORLD, HOW A ZONE MOVES" + "ONE WORLD, THE TEST SLICE". ── */
/* THE LATE CUT (2026-11-17, the slice fixes): districts/<LETTER>.js late(ctx), a district's square changes AFTER every piece is set down and every check of the
   home frame is done, so no piece is seated again. Only the One World rooms below read them (their open ground, paint and levels are laid again there); a
   district whose plots still stand in the home room must not use it. */
stage('late');
const PJ = JSON.parse(fs.readFileSync(path.join(REPO, 'docs/plans/one-world/plots.json'), 'utf8'));
const MOVER = require('./ow-move.js')({ cols: G, rows: G, cell, fill: 't', plots: PLAN.plots, features, props, npc, doors });
const v13 = letter => { const d = PJ.districts.find(q => q.today && q.today.room === 'site_prebuilt_fairy_forest_plots' && q.today.districts.indexOf(letter) >= 0); if (!d) throw new Error('plots.json has no Woods district ' + letter);
    return d.plots.map(q => { const p = plot[q.was]; if (!p || p.name !== q.n || p.district !== letter) throw new Error('plots.json and the layout disagree on ' + q.was + ' ' + q.n); return { id: q.was, wx: q.x, wy: q.y }; }); };
const R_CLEAR = 'site_prebuilt_fairy_forest_ow_clearing', R_REST = 'site_prebuilt_fairy_forest_plots', R_CORN = 'site_prebuilt_skinwalker_ow_corn';
/* ONE WORLD, PHASE 3 (2026-11-17, BUILD_PLAN wave A, the Woods zone thread): the Redwood Trail and the Ritual Ground leave the old room (R_REST, now in
   DOOR_HQ.retired) for their v13 places, and the Woods' wild links are built. R_RED = the Redwood Trail alone (9 plots: it cannot join the Clearing, whose
   room is full by the triangle number, nor L3, which would make the box 13 plots tall). R_RIT = the Ritual Ground + the wild links L2 (from the Clearing)
   and L5 (on to the Estate's Iron Gate), 18 plots. L1 (one plot, the Trail West's way north) stands in the Clearing's room (rule 4). L3 and L4 are route rooms
   of the kit (`node bake-route.js L3`, `L4`). */
const R_RED = 'site_prebuilt_fairy_forest_ow_redwood', R_RIT = 'site_prebuilt_fairy_forest_ow_ritual', R_HOUSE = 'site_prebuilt_skinwalker_ow_house', R_CAMW = 'site_prebuilt_camelot_ow_forest';
/* a wild link's own plot, laid by this tool in a district's room (room-splitting rule 4): `key` = its world plot, 'x,y'; forest, a trail through its middle and
   ONE place beside the path (ow-places.js, THE PLACES: every name an idea of Claude's) */
const LINK = (id, level) => PJ.links.find(l => l.id === id).plots.map((q, i) => ({ key: q[0] + ',' + q[1], wx: q[0], wy: q[1], name: 'The trail', district: 'L', link: id, level: Array.isArray(level) ? level[i] : level, isNew: true }));
/* the seams: '<home plot id>:<side>' -> the room past that side. `at` = the door's id over there (the seam's own id when left out);
   `k` = the square of the plot's side the path crosses on (left out: where the plot is open already, else its middle) */
const STAND = [
    /* THE JOINING RULE (2026-11-17, mondo after the test slice: "change the room-splitting rule to join more"): the Clearing and Dead Man's Cave touch
       (Deep woods, east | The Culvert), so they are ONE room, 12 x 5, 18 plots: no loading card between the Stair and the Storm Drain */
    { id: R_CLEAR, part: 'ow_clearing', label: 'THE CLEARING', sub: 'THE WOODS · THE CLEARING · DEAD MAN\u2019S CAVE · 18 PLOTS', letters: ['C', 'M'], list: v13('C').concat(v13('M')), world: true, spawn: 'P02-04',
      parti: 'The south of the Woods in one walk, eighteen plots: the Clearing a cross with the Stair at its north end and the fence line south, and east of it the dry creek, followed down between its banks to the sewer mouth and the storm drain.',
      seams: {
          'P01-05:S': { room: R_CORN, label: 'THE ESTATE · THE CORN FIELDS', sub: 'THE FENCE LINE · THE GATE', desc: 'A fence, and a gate in it. The corn starts on the other side.', takes: 'estate' },
          /* ONE WORLD, PHASE 3: the Trail West's way north is the wild link L1 (one plot, in this room); past it lies the Old Road's plot (route R4, BUILD_PLAN phase
             4.1, not built yet), so L1's north end is an INTERIM door straight to the Redwood Trail's Creek, lower. The 4.1 thread builds R4 and re-points this pair */
          '-16,0:N': { room: R_RED, id: 'ow_h_m16_0', label: 'THE REDWOOD TRAIL', sub: 'THE TRAIL NORTH · UP UNDER THE OLD TREES', desc: 'The trail climbs north under trees too big to be this close to a road.' },
          /* the wild link L2 starts on Deep woods, west's south side: the Ritual Ground's room */
          'P00-04:S': { room: R_RIT, label: 'THE RITUAL GROUND', sub: 'THE TRAIL SOUTH-WEST · THE FIRE', desc: 'A narrow path, walked often and by many feet, all going the same way.' },
          /* the wild link L4 comes in on Deep woods, west, from the north: its own route room (bake-route.js L4); the link woods_camelot is on L4's west end now */
          'P00-04:N': { room: 'site_ow_l4', label: 'THE TRAIL WEST · CAMELOT', sub: 'THE TRAIL · WEST TO CAMELOT', desc: 'The path goes west under the trees towards the castle.' },
      },
      links: LINK('L1', 2),
      /* the joint between the two districts is the main trail, on the Culvert's own crossing (squares 7 to 9); the Gully's cabin stands on the bed's line, so the
         walk passes north of it; the way on to the Storm Drain passes north of the sewer mouth's head; the Sewer Mouth's way south starts on its south rim */
      cross: { 'P02-05|P03-03': [7, 8, 9], 'P04-03|P04-04': [3, 4, 5], 'P03-05|P05-04': [3, 4, 5], 'P05-04|P05-03': [3, 4, 5] }, from: { 'P05-04:S': [3, 8] } },
    /* THE REDWOOD TRAIL (district T), 9 plots in one walk: the Snowline at the top, north under the range, down the west column to the Meadow, then the
       east column down to the Creek, lower (v13 -17..-16 x -9..-2) */
    { id: R_RED, part: 'ow_redwood', label: 'THE REDWOOD TRAIL', sub: 'THE WOODS · THE REDWOOD TRAIL · 9 PLOTS', letters: ['T'], list: v13('T'), world: true, spawn: 'P02-02',
      parti: 'The Redwood Trail in one walk, nine plots: from the creek under the old trees up past the meadow and the falls to the snow at the top, where the trail goes on to the pass.',
      seams: {
          /* INTERIM (see the Clearing's L1): the Old Road's plot -16,-1 lies between; the phase 4.1 thread builds R4 and re-points this pair */
          'P02-02:S': { room: R_CLEAR, id: 'ow_h_m16_0', label: 'THE CLEARING', sub: 'THE TRAIL SOUTH · DOWN TO THE CROSSROADS', desc: 'The trail drops south out of the old trees.' },
          /* the wild link L3 up to the Snowy Pass (bake-route.js L3) */
          'P00-00:N': { room: 'site_ow_l3', label: 'THE TRAIL UP · THE SNOWY PASS', sub: 'THE SNOWLINE · THE TRAIL UP', desc: 'The trail keeps climbing after the trees give up. There is snow on it from here.' },
      },
      /* two doors whose side is a joint now (the Shelf's north side is the Snowline; the Snowline's north is L3): each moves to a side with forest past it */
      doorAt: { lemuria: { plot: 'P01-00', side: 'E' }, shasta: { plot: 'P00-00', side: 'E' } } },
    /* THE RITUAL GROUND (district G), the ring round its hollow middle, with the wild link L2 from the Clearing (seven plots, down the column x -17 and west
       along row 6 to the Stage and the lake's east shore) and L5 on south to the Estate's Iron Gate (two plots) */
    { id: R_RIT, part: 'ow_ritual', label: 'THE RITUAL GROUND', sub: 'THE WOODS · THE RITUAL GROUND · 18 PLOTS', letters: ['G'], list: v13('G'), world: true, spawn: 'P04-01',
      parti: 'The Ritual Ground, nine plots in a ring round a hollow nobody built on, and the two trails that reach it: the long path down from the Clearing, and the short one on south to the iron gate of the Estate.',
      links: LINK('L2', [1, 2, 2, 3, 3, 4, 4]).concat(LINK('L5', 3)),
      seams: {
          '-17,2:N': { room: R_CLEAR, label: 'THE CLEARING', sub: 'THE PATH NORTH · AWAY FROM THE FIRE', desc: 'A narrow path out between the trees, away from the fire.' },
          '-21,10:S': { room: R_HOUSE, label: 'THE ESTATE · THE IRON GATE', sub: 'THE PATH SOUTH · THE GATE', desc: 'The path ends at an iron gate in a wall. There is a house behind it.' },
          /* the wild link L7 (Camelot's: it stands in Camelot's Forest room) meets the Mound's west side */
          'P03-00:W': { room: R_CAMW, label: 'CAMELOT · THE FOREST', sub: 'THE PATH WEST · UNDER THE OLD OAKS', desc: 'The path goes west into an older forest.' },
      },
      /* the two link ends whose east side is a joint now (the Stage, L2): the members' tunnel on the lake's north shore, Room 333's circle in the ring's hollow middle */
      ends: { grove_lodge: { plot: 'P05-00', side: 'N' }, woods_ritual: { plot: 'P05-01', side: 'W' } },
      bay: { id: 'bay_grove', plot: 'P04-00', side: 'N' },
      /* THE CAMP HOUSE (districts/G.js) stood across the Tents and the Stage, which do not touch now: its east square lies on the ring's hollow cell. That
         square is opened under the house (its floor, walked inside its walls) so nothing grows in it; the house and everything in it stay where G.js put them */
      strayOpen: ['woods:G:camphouse'] },
];
const SIDE4 = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] }, OPP = { N: 'S', S: 'N', W: 'E', E: 'W' }, FACE = { N: 180, E: 270, S: 0, W: 90 };   // a free door on that side of a plot: the way its opening faces, INTO the plot (ow-move.js)
const strip = f => { if (f.mass == null && f.wide == null) return f; const o = Object.assign({}, f); delete o.mass; delete o.wide; return o; };
const ROOMS_OUT = [], LINKS_OUT = {}, STRAYS = [], BAYS_OUT = {}, PLACES_OUT = [];
const OWP = require('./ow-places.js');
/* link ends another tool writes (THE ROUTE KIT's room L4 holds woods_camelot's Woods end since phase 3; set by hand in data.js, see the link's comment) */
const KIT_ENDS = { woods_camelot: 1 };
STAND.forEach(S => {
    const R = MOVER.room(S.list.concat(S.links || [])), Wn = R.W, Dn = R.D, c2 = R.cell;
    /* a plot by its home id, or a link's own plot by its world plot 'x,y' */
    const byKey = k => R.ofHome[k] || Object.values(R.at).find(e => e.isNew && e.wx + ',' + e.wy === k) || null;
    R.strays.forEach(t => STRAYS.push(S.label + ': ' + t));
    const inR = (x, y) => x >= 0 && y >= 0 && x < Wn && y < Dn, openR = (x, y) => inR(x, y) && c2[y][x] !== 't';
    const sqOf = (x, z) => [Math.floor((x + R.HX) / C + 1e-9), Math.floor((z + R.HZ) / C + 1e-9)];
    const stood = new Set(); R.props.forEach(p => { const q = sqOf(p.x, p.z); stood.add(q.join(':'));
        /* a piece that stands in the trees beside a path (a lamp post, a gate post) holds the path squares round it open */
        if (inR(q[0], q[1]) && c2[q[1]][q[0]] === 't') for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) stood.add((q[0] + dx) + ':' + (q[1] + dy)); }); R.features.forEach(f => { if (f.x != null && f.k !== 'tree' && f.k !== 'scatter' && f.k !== 'dip') stood.add(sqOf(f.x, f.z).join(':')); });
    const lay = (x, y) => { if (!inR(x, y) || !R.plotOfSq(x, y)) return; if (c2[y][x] === 't') c2[y][x] = 'p'; else if (c2[y][x] === 'w') c2[y][x] = 'b'; };
    const run = (x0, y0, x1, y1, wd) => { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)), off = wd === 3 ? [-1, 0, 1] : [0];
        for (let i = 0; i <= n; i++) { const x = n ? Math.round(x0 + (x1 - x0) * i / n) : x0, y = n ? Math.round(y0 + (y1 - y0) * i / n) : y0; off.forEach(a => off.forEach(b => lay(x + a, y + b))); } };
    const border = (e, sd, k) => sd === 'N' ? [e.col * N + k, e.row * N] : sd === 'S' ? [e.col * N + k, e.row * N + N - 1] : sd === 'W' ? [e.col * N, e.row * N + k] : [e.col * N + N - 1, e.row * N + k];
    const openK = (e, sd) => { const o = []; for (let k = 0; k < N; k++) { const q = border(e, sd, k); if (openR(q[0], q[1])) o.push(k); } return o; };
    const nbr = (e, sd) => R.at[(e.col + SIDE4[sd][0]) + ',' + (e.row + SIDE4[sd][1])] || null;
    const seamOf = (e, sd) => (S.seams || {})[e.id + ':' + sd] || null;
    const endOn = (e, sd) => Object.keys(S.ends || {}).some(id => S.ends[id].plot === e.id && S.ends[id].side === sd);
    const doorOn = (e, sd) => R.doors.some(d => d.plot === e && d.side === sd.toLowerCase());
    let reverted = 0, kept = 0, laid = 0;
    /* 1. a leg to a side with nobody past it now goes back to forest (a square a piece stands on stays open) */
    R.order.forEach(e => { const L = LEGS[e.id] || {}, keep = new Set(), h = e.home, m = q => [q[0] - h.x * N + e.col * N, q[1] - h.y * N + e.row * N];
        const mineSq = q => q[0] >= h.x * N && q[0] < (h.x + 1) * N && q[1] >= h.y * N && q[1] < (h.y + 1) * N;
        Object.keys(L).forEach(sd => { if (nbr(e, sd) || seamOf(e, sd) || endOn(e, sd) || doorOn(e, sd)) L[sd].cover.forEach(q => keep.add(q[0] + ':' + q[1])); });
        Object.keys(L).forEach(sd => { if (nbr(e, sd) || seamOf(e, sd) || endOn(e, sd) || doorOn(e, sd)) return;
            L[sd].cover.forEach(q => { if (!mineSq(q) || keep.has(q[0] + ':' + q[1])) return; const [x, y] = m(q), was = CELL0[q[1]][q[0]];
                if (stood.has(x + ':' + y)) { kept++; return; }
                if (was === 't' && c2[y][x] === 'p') { c2[y][x] = 't'; reverted++; } else if (was === 'w' && c2[y][x] === 'b') { c2[y][x] = 'w'; reverted++; } }); }); });
    /* 2. a new leg: from the plot's hub (or the square the spec names) to square k of a side, three squares wide, the home's own dog-leg */
    const leg = (e, sd, k) => { const hub = (S.from || {})[e.id + ':' + sd] || HUBS[e.id] || [6, 6], hx = e.col * N + hub[0], hy = e.row * N + hub[1]; k = Math.max(1, Math.min(N - 2, k)); const [tx, ty] = border(e, sd, k);
        if (sd === 'N' || sd === 'S') { run(hx, hy, tx, hy, 3); run(tx, hy, tx, ty, 3); } else { run(hx, hy, hx, ty, 3); run(hx, ty, tx, ty, 3); } laid++; };
    const mid = a => a[Math.floor((a.length - 1) / 2)];
    /* 3. two plots that touch now: one crossing. Where either is open on that side already, the other opens on the same squares */
    if (!S.home) R.order.forEach(A => ['E', 'S'].forEach(sd => { const B = nbr(A, sd); if (!B) return; const o = OPP[sd];   // (plots that did not move keep every joint as it is)
        const fixed = (S.cross || {})[A.id + '|' + B.id] || (S.cross || {})[B.id + '|' + A.id], oa = openK(A, sd), ob = openK(B, o);
        let rows = fixed || [...new Set(oa.concat(ob))].sort((a, b) => a - b); if (!rows.length) rows = [5, 6, 7];
        if (!fixed && oa.length && ob.length) { const lo = rows[0], hi = rows[rows.length - 1]; rows = []; for (let k = lo; k <= hi; k++) rows.push(k); }   // two openings: joined along the line
        rows.forEach(k => { lay(...border(A, sd, k)); lay(...border(B, o, k)); });
        /* a moved district is a path: every joint between its plots is the main trail, three squares wide (the plots that did not move keep their legs as they are) */
        leg(A, sd, mid(rows)); leg(B, o, mid(rows)); }));
    /* 4. the seams and the link ends that moved: a leg to the side unless the plot is open there already; the door stands on the crossing's middle */
    const crossing = (e, sd, k) => { let o = openK(e, sd); if (k != null || !o.length) { leg(e, sd, k != null ? k : 6); o = openK(e, sd); if (k != null) o = o.filter(q => Math.abs(q - k) <= 1); }
        /* the widest run of open squares; the door on its middle */
        let best = [o[0], o[0]], a = o[0]; for (let i = 1; i <= o.length; i++) { if (i === o.length || o[i] !== o[i - 1] + 1) { if (o[i - 1] - a > best[1] - best[0]) best = [a, o[i - 1]]; a = o[i]; } }
        const along = (best[0] + best[1] + 1) / 2, ns = sd === 'N' || sd === 'S', onWall = (sd === 'N' && e.row === 0) || (sd === 'S' && e.row === R.rows - 1) || (sd === 'W' && e.col === 0) || (sd === 'E' && e.col === R.cols - 1);
        const q = border(e, sd, Math.floor(along - 0.01)), d = { wall: onWall ? sd.toLowerCase() : 'free' };
        if (onWall) { if (ns) d.x = R.gx(e.col * N + along); else d.z = R.gz(e.row * N + along); }
        else { d.x = ns ? R.gx(e.col * N + along) : R.gcx(q[0]); d.z = ns ? R.gcz(q[1]) : R.gz(e.row * N + along); d.face = FACE[sd]; d.passage = Object.assign({}, MOVER.FREE_PASS); }   // (ow-move.js A FREE SEAM IS CROSSED ON THE PLOT'S OWN SQUARES)
        return d; };
    const doorsOut = R.doors.filter(d => !Object.keys(S.seams || {}).some(k => S.seams[k].takes === d.id)).map(d => { const o = Object.assign({}, d); delete o.side; delete o.plot; return o; });
    const ways = [];
    Object.keys(S.seams || {}).forEach(key => { const [pid, sd] = key.split(':'), e = byKey(pid), sm = S.seams[key]; if (!e) throw new Error('seam on a plot that is not in ' + S.id + ': ' + key);
        const id = sm.id || R.seamId(e, sd), d = crossing(e, sd, sm.k);
        if (sm.open) d.passage = Object.assign(d.passage || {}, { w: sm.open });   // THE OPEN SEAM (data.js DOOR_HQ.ways.open): `open: <metres wide>` on a seam in open country; the Woods' seams are all forest
        doorsOut.push(Object.assign({ id }, d, { way: sm.open ? 'open' : 'trail', label: sm.label, sub: sm.sub, action: { room: sm.room, at: sm.at || id }, desc: sm.desc || 'The path goes on.' }));
        if (d.wall !== 'free') ways.push({ side: d.wall, at: d.x != null ? d.x : d.z }); });
    /* 4b. a door whose side became a joint (ONE WORLD, PHASE 3): it moves to the side the spec names (the door keeps its id and everything else) */
    Object.keys(S.doorAt || {}).forEach(id => { const o = S.doorAt[id], dd = doorsOut.find(q => q.id === id), e = byKey(o.plot); if (!dd || !e) throw new Error(S.id + ': doorAt ' + id + ' has no door or no plot');
        const c = crossing(e, o.side, o.k); ['wall', 'x', 'z', 'face', 'passage'].forEach(k => delete dd[k]); Object.assign(dd, c); if (c.wall !== 'free') ways.push({ side: c.wall, at: c.x != null ? c.x : c.z }); });
    /* 4c. DOOR HQ's bay door on this room (siteRooms.entry): on the side the spec names */
    if (S.bay) { const e = byKey(S.bay.plot), c = crossing(e, S.bay.side, S.bay.k); BAYS_OUT[S.bay.id] = { room: S.id, d: c }; if (c.wall !== 'free') ways.push({ side: c.wall, at: c.x != null ? c.x : c.z }); }
    /* 5. the links that end in this room (data.js DOOR_HQ.links): the tool's own (LINK_ENDS, on the home room's east wall) and the two written by hand */
    const HOME_ENDS = Object.assign({ woods_stair: ['a', { wall: 'free', x: -17.5, z: 55.5, face: 180 }], woods_camelot: ['a', { wall: 'w', z: 3.5 }] }, ...Object.keys(LINK_ENDS).map(id => ({ [id]: [LINK_ENDS[id][0], { wall: 'e', z: LINK_ENDS[id][1] }] })));
    Object.keys(HOME_ENDS).forEach(id => { const [side, h] = HOME_ENDS[id], ov = (S.ends || {})[id];
        if (KIT_ENDS[id]) return;
        if (ov) { const e = byKey(ov.plot), d = crossing(e, ov.side, ov.k); LINKS_OUT[id] = [side, Object.assign({ part: S.part }, d)]; if (d.wall !== 'free') ways.push({ side: d.wall, at: d.x != null ? d.x : d.z }); return; }
        if (STAND.some(o => (o.ends || {})[id])) return;                    // placed by hand in another room
        const hx = h.wall === 'w' ? -HALF + 0.5 : h.wall === 'e' ? HALF - 0.5 : h.x, hz = h.wall === 'n' ? -HALF + 0.5 : h.wall === 's' ? HALF - 0.5 : h.z, hp = MOVER.homePlot(hx, hz), e = R.ofHome[hp.id]; if (!e) return;
        if (h.wall === 'free') { LINKS_OUT[id] = [side, { part: S.part, wall: 'free', x: r2(h.x + e.dx), z: r2(h.z + e.dz), face: h.face }]; return; }
        const onWall = (h.wall === 'e' && e.col === R.cols - 1) || (h.wall === 'w' && e.col === 0);
        LINKS_OUT[id] = [side, onWall ? { part: S.part, wall: h.wall, z: r2(h.z + e.dz) } : { part: S.part, wall: 'free', x: r2((h.wall === 'e' ? HALF - C / 2 : -HALF + C / 2) + e.dx), z: r2(h.z + e.dz), face: h.wall === 'e' ? 270 : 90, passage: MOVER.FREE_PASS }];
        if (onWall) ways.push({ side: h.wall, at: r2(h.z + e.dz) }); });
    /* 5b. THE PLACES (ONE WORLD, THE ROUTE KIT's rule, ow-places.js): every link plot this tool lays carries one small place beside its trail, on forest
       squares it opens (a 5 x 5 patch touching the path; a 3 x 3 when none fits). Never the same twice running; the plot takes the place's name */
    { const forest = OWP.forKind({ kind: 'forest', kit: 'forest' }), usedP = new Set(); let last = null;
      R.order.filter(e => e.isNew).forEach(e => { const x0 = e.col * N, y0 = e.row * N, free = (r, cx, cy) => { let touch = false;
              for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { const x = x0 + cx + dx, y = y0 + cy + dy; if (cx + dx < 0 || cy + dy < 0 || cx + dx > N - 1 || cy + dy > N - 1 || c2[y][x] !== 't') return false; }
              for (let dy = -r - 1; dy <= r + 1; dy++) for (let dx = -r - 1; dx <= r + 1; dx++) { const x = x0 + cx + dx, y = y0 + cy + dy; if (inR(x, y) && (c2[y][x] === 'p' || c2[y][x] === 'b')) touch = true; } return touch; };
          let got = null;
          for (const r of [2, 1]) { const ids = forest.filter(id => OWP.PLACES[id].r === r && id !== last); let best = null;
              for (let cy = r; cy <= N - 1 - r; cy++) for (let cx = r; cx <= N - 1 - r; cx++) if (free(r, cx, cy)) { const dd = Math.abs(cx - 5.5) + Math.abs(cy - 5.5); if (!best || dd < best[0]) best = [dd, cx, cy]; }
              if (best && ids.length) { const fresh = ids.filter(id => !usedP.has(id)); got = [OWP.PLACES[(fresh.length ? fresh : ids)[0]], best[1], best[2]]; break; } }
          if (!got) throw new Error(S.id + ': NO PLACE on the link plot ' + e.wx + ',' + e.wy);
          const [pl, cx, cy] = got, r = pl.r; last = pl.id; usedP.add(pl.id);
          for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) c2[y0 + cy + dy][x0 + cx + dx] = 'g';
          OWP.lay(pl, x0 + cx, y0 + cy, { P: (key, sx, sy, o) => R.props.push(Object.assign({ key, x: R.gcx(sx), z: R.gcz(sy) }, o || {})), at: (key, fx, fy, o) => R.props.push(Object.assign({ key, x: R.gx(fx), z: R.gz(fy) }, o || {})) });
          e.name = 'The trail, ' + pl.name; PLACES_OUT.push(e.wx + ',' + e.wy + ' ' + pl.id); });
      R.names = R.order.map(e => [R.pid(e), e.name, e.district, e.level]); }
    /* 5c. a district building that stands partly off its plots (a STRAY the spec answers): the squares under it are opened, so no tree grows in its rooms */
    (S.strayOpen || []).forEach(id => { const f = R.features.find(q => q.id === id); if (!f) throw new Error(S.id + ': strayOpen ' + id + ' not found');
        const a = sqOf(f.x - f.w / 2 + 0.01, f.z - f.d / 2 + 0.01), b = sqOf(f.x + f.w / 2 - 0.01, f.z + f.d / 2 - 0.01); let n = 0;
        for (let y = a[1]; y <= b[1]; y++) for (let x = a[0]; x <= b[0]; x++) if (inR(x, y) && !R.plotOfSq(x, y) && c2[y][x] === 't') { c2[y][x] = 'g'; n++; }
        STRAYS.push(S.label + ': ' + id + ' answered: ' + n + ' square(s) under it opened off its plot'); });
    /* the tool's decks (over a run of bridge squares) stop at the room's wall */
    R.features.forEach(f => { if (f.k !== 'deck') return; ['x0', 'x1'].forEach(k => { f[k] = Math.max(-R.HX, Math.min(R.HX, f[k])); }); ['z0', 'z1'].forEach(k => { f[k] = Math.max(-R.HZ, Math.min(R.HZ, f[k])); }); });
    /* 6. nobody is cut off: every open pocket the legs miss gets its own one-square path to the nearest reached square (the home's rule), then every plot must be reached */
    const sp0 = (() => { const c = centre(S.spawn), e = R.ofHome[S.spawn]; return [c[0] - e.home.x * N + e.col * N, c[1] - e.home.y * N + e.row * N]; })();
    const spSq = S.spawn === 'P02-04' ? [sp0[0], sp0[1] + 2] : sp0;
    let tied = 0, seen = null;
    for (let pass = 0; pass < 80; pass++) { seen = new Uint8Array(Wn * Dn); const q = [spSq]; if (!openR(spSq[0], spSq[1])) throw new Error(S.id + ': the spawn square is not open'); seen[spSq[1] * Wn + spSq[0]] = 1;
        for (let i = 0; i < q.length; i++) { const [x, y] = q[i]; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + dx, Y = y + dy; if (openR(X, Y) && !seen[Y * Wn + X]) { seen[Y * Wn + X] = 1; q.push([X, Y]); } } }
        let lost = null; for (let cy = 0; cy < Dn && !lost; cy++) for (let cx = 0; cx < Wn; cx++) { const ch = c2[cy][cx]; if ((ch === 'g' || ch === 's' || ch === 'r' || ch === 'p') && !seen[cy * Wn + cx]) { lost = [cx, cy]; break; } }
        if (!lost) break;
        const lp = R.plotOfSq(lost[0], lost[1]); let best = null, bd = 1e9; q.forEach(c => { if (c2[c[1]][c[0]] === 'w' || R.plotOfSq(c[0], c[1]) !== lp) return; const dd = Math.abs(c[0] - lost[0]) + Math.abs(c[1] - lost[1]); if (dd < bd) { bd = dd; best = c; } });
        if (!best) { /* a pocket on a plot the walk never enters: tie it to the nearest reached square of any plot, through plots only */ q.forEach(c => { if (c2[c[1]][c[0]] === 'w') return; const dd = Math.abs(c[0] - lost[0]) + Math.abs(c[1] - lost[1]); if (dd < bd) { bd = dd; best = c; } }); }
        run(lost[0], lost[1], best[0], lost[1], 1); run(best[0], lost[1], best[0], best[1], 1); tied++; if (pass === 79) throw new Error(S.id + ': could not tie every pocket'); }
    { const cold = R.order.filter(e => { for (let ly = 0; ly < N; ly++) for (let lx = 0; lx < N; lx++) if (seen[(e.row * N + ly) * Wn + e.col * N + lx]) return false; return true; }).map(e => e.name); if (cold.length) throw new Error(S.id + ': plots not reached: ' + cold.join(', ')); }
    if (process.env.WOODS_DUMP) console.log('\n' + S.id + '\n' + c2.map((r, cy) => r.map((ch, cx) => !R.plotOfSq(cx, cy) ? '.' : stood.has(cx + ':' + cy) && ch !== 't' ? 'o' : openR(cx, cy) && !seen[cy * Wn + cx] ? '!' : ch === 't' ? ' ' : ch).join('')).join('\n'));
    /* 7. the forest's own trees leave a square a path was laid over (THE CUT's rule) */
    const feats = R.features.filter(f => { if (!f.mass) return true; const [x, y] = sqOf(f.x, f.z); for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) if (openR(x + dx, y + dy)) return false; return true; });
    const cutTrees = R.features.length - feats.length;
    /* 8. the levels, the open ground, the paint */
    const dz0 = S.home ? R.order[0].dz : 0, gnd = S.home ? (x, z) => ground(x, z - dz0) : R.levels(LEVEL);
    const slope2 = Buffer.alloc(Wn * Dn * 8);
    for (let cy = 0; cy < Dn; cy++) for (let cx = 0; cx < Wn; cx++) { const o = (cy * Wn + cx) * 8; [[0, 0], [1, 0], [0, 1], [1, 1]].forEach((q, k) => slope2.writeInt16LE(Math.round(gnd(R.gx(cx + q[0]), R.gz(cy + q[1])) * 100), o + k * 2)); }
    const spaces = R.spaces(openR);
    const PAL2 = ['ice', 'rocks_5', 'dirt_2'], paint2 = new Uint8Array(Wn * Dn), G2 = {};
    ORDER.forEach(id => { const k = DISTRICTS[id].ground; if (k && S.letters.indexOf(id) >= 0) { let i = PAL2.indexOf(k); if (i < 0) { PAL2.push(k); i = PAL2.length - 1; } G2[id] = i + 1; } });
    for (let cy = 0; cy < Dn; cy++) for (let cx = 0; cx < Wn; cx++) { const ch = c2[cy][cx], e = R.plotOfSq(cx, cy), dist = e ? e.district : S.letters[0];
        paint2[cy * Wn + cx] = ch === 's' ? 1 : ch === 'r' ? 2 : (ch === 'p' || ch === 'b') ? 3 : (ch === 'g' || ch === 't') ? (G2[dist] || 0) : 0; }
    /* 9. the room-wide scatter (the tool's), by the plots the room has; the districts' forest and air, on the plots as they stand */
    const share = S.list.length / 36, bareD = S.letters.map(id => DISTRICTS[id].bare).filter(Boolean)[0], bare = bareD ? (() => { const a = R.toRoom((bareD[0] + bareD[2]) / 2, (bareD[1] + bareD[3]) / 2), dx = a[0] - (bareD[0] + bareD[2]) / 2, dz = a[1] - (bareD[1] + bareD[3]) / 2; return { off: [r2(bareD[0] + dx), r2(bareD[1] + dz), r2(bareD[2] + dx), r2(bareD[3] + dz)] }; })() : {};
    feats.push(Object.assign({ k: 'scatter', key: 'fern', n: Math.round(140 * share), seed: 5 }, bare), Object.assign({ k: 'scatter', key: 'stump', n: Math.round(18 * share), seed: 6 }, bare), Object.assign({ k: 'scatter', key: 'fallen_log', n: Math.round(10 * share), seed: 7, r0: 1.9 }, bare));
    /* a box of the home room: it moves with its plots when they all moved the same way, else it is the district's own and covers the whole new room */
    /* a box of the home room: it moves with its plots when they all moved the same way; else it is the district's own, and stands as one box on each of that
       district's plots (a count `n` shared out), so two districts in one room keep their own trees and their own air */
    const boxOf = (z, letter) => { const pts = [[z.x0 + 1, z.z0 + 1], [z.x1 - 1, z.z0 + 1], [z.x0 + 1, z.z1 - 1], [z.x1 - 1, z.z1 - 1], [(z.x0 + z.x1) / 2, (z.z0 + z.z1) / 2]].map(q => { const hp = MOVER.homePlot(q[0], q[1]); return hp && R.ofHome[hp.id]; });
        if (pts.every(e => !e)) return [];
        const e0 = pts.find(Boolean), same = pts.every(e => e && e.dx === e0.dx && e.dz === e0.dz);
        if (same) return [Object.assign({}, z, { x0: r2(z.x0 + e0.dx), x1: r2(z.x1 + e0.dx), z0: r2(z.z0 + e0.dz), z1: r2(z.z1 + e0.dz) })];
        const own = R.order.filter(e => e.district === letter);
        return own.map(e => Object.assign({}, z, { x0: R.gx(e.col * N), z0: R.gz(e.row * N), x1: R.gx((e.col + 1) * N), z1: R.gz((e.row + 1) * N) }, z.n != null ? { n: Math.max(1, Math.round(z.n / own.length)) } : {})); };
    const zonesOf = hook => [].concat(...ZONE_ORDER.filter(id => S.letters.indexOf(id) >= 0).map(id => [].concat(...(DISTRICTS[id][hook] ? DISTRICTS[id][hook](ctx) : []).map(z => boxOf(z, id)))));
    const zonesT = zonesOf('treeZones'), zonesA = zonesOf('airZones');
    const spM = { x: R.gx(spSq[0]), z: R.gcz(spSq[1]) };
    ROOMS_OUT.push({ S, R, feats: spaces.concat(feats.map(strip)), doors: doorsOut, ways, slope: slope2, PAL: PAL2, paint: paint2, zonesT, zonesA, spM,
        count: { plots: S.list.length, box: R.cols + 'x' + R.rows, legsBack: reverted, legsKept: kept, legsNew: laid, tied, treesCut: cutTrees, spaces: spaces.length, props: R.props.length, features: feats.length, doors: doorsOut.length, natives: R.npc.length } });
});
if (STRAYS.length) console.log('STRAYS (a piece across two plots that no longer stand the same way; each is answered in the notes, "ONE WORLD, THE TEST SLICE"):\n  ' + STRAYS.join('\n  '));
ROOMS_OUT.forEach(o => console.log(o.S.id + ' ' + JSON.stringify(o.count)));
if (PLACES_OUT.length) console.log('places: ' + PLACES_OUT.join(' · '));

/* ── the rooms ── */
const J = v => JSON.stringify(v).replace(/"([a-zA-Z_][a-zA-Z0-9_]*)":/g, '$1:').replace(/'/g, "\\'").replace(/"/g, "'");
const L = [];
L.push("        /* WOODS36-BEGIN — THE WOODS ON PLOTS (2026-11-15) + THE ONE WORLD MOVE (2026-11-17: the Clearing and Dead Man's Cave stand at their One World places as rooms of their own): written by `node bake-woods.js` from docs/areas/woods/layout.json + docs/plans/one-world/plots.json. Never hand-edit between the markers; edit the tool, a district file or the layout and rerun. */");
ROOMS_OUT.forEach(o => { const { S, R } = o, w = 2 * R.HX, d = 2 * R.HZ;
    L.push("        " + S.id + ": {");
    L.push("            label: " + J(S.label) + ",");
    L.push("            sub: " + J(S.sub) + ",");
    L.push("            kind: 'box', site: 'prebuilt_fairy_forest', part: " + J(S.part) + ",");
    if (S.world) { L.push("            /* THE ONE WORLD: where this room stands on the world's plot grid (data.js hqOwIndex) */");
        L.push("            world: { hub: 'woods', layer: 'surface', wx: " + R.wx + ", wy: " + R.wy + " },"); }
    /* a One World room has no treeline ring: the land past its lines is the map's own (terrain.edges.world), and the far places stand at their true bearings */
    L.push("            shell: " + (S.world ? "(s => { s.sky.landmarks = 'world'; return s; })(" : "") + "hqWoodsShell({ w: " + w + ", d: " + d + ", plate: { x: " + o.spM.x + ", z: " + o.spM.z + ", y: 4.2 }, forest: " + (S.world ? "null" : "{ depth: 7, spacing: 3.5, rows: 2, start: 1.6, canopy: { to: 54 } }") + ", noLandmarks: true, atmos: " + J({ kind: 'spores', zones: o.zonesA }) + " })" + (S.world ? ")" : "") + ",");
    L.push("            parti: " + J(S.parti) + ",");
    L.push("            typology: 'grid',");
    L.push("            plots: { cell: " + C + ", plot: " + PL + ", n: " + R.cols + ", nx: " + R.cols + ", nz: " + R.rows + ", mask: " + J(R.mask) + ", names: " + J(R.names) + " },");
    L.push("            terrain: {");
    L.push("                res: 0.875, floor: 'grass_2', cliff: 'rock_wall_1', path: 'dirt_2',");
    L.push("                noise: { amp: 0.12, scale: 8 },");
    if (S.world) L.push("                /* THE HORIZON READS THE MAP: the land past every line is the world's own ground there, plot by plot (three-renderer.js _hqEdgeLandFn `world`) */\n                backdrop: false, edges: { world: true, reach: 440, ways: " + J(o.ways) + " },");
    L.push("                slope: { cells: { res: " + C + ", x0: " + R.gx(0) + ", z0: " + R.gz(0) + ", nx: " + R.W + ", nz: " + R.D + ", d: '" + o.slope.toString('base64') + "' } },");
    L.push("                paint: { pal: " + J(o.PAL) + ", t: 'u8', res: " + C + ", x0: " + R.gcx(0) + ", z0: " + R.gcz(0) + ", nx: " + R.W + ", nz: " + R.D + ", d: '" + Buffer.from(o.paint).toString('base64') + "' },");
    L.push("                gen: { kind: 'plan', look: 'trees', seed: 36, rim: 0, forceGrow: 0, treeGap: 2.6, treeIn: 0.9, spacing: 3.5, depth: 5.25, maxTrees: " + Math.round(2400 * R.cols * R.rows / 36) + ", treeH: [5.5, 8.5], kinds: ['tree_53', 'tree_55', 'tree_52', 'tree_53', 'tree_5', 'tree_55'], zones: " + J(o.zonesT) + " },");
    L.push("                features: [");
    o.feats.forEach(f => L.push("                    " + J(f) + ","));
    L.push("                ],");
    L.push("            },");
    L.push("            doors: [");
    o.doors.forEach(dr => L.push("                " + J(dr) + ","));
    L.push("            ],");
    L.push("            counters: [],");
    L.push("            props: [");
    for (let i = 0; i < R.props.length; i += 4) L.push("                " + R.props.slice(i, i + 4).map(J).join(", ") + ",");
    L.push("            ],");
    L.push("            agents: [],");
    L.push("            npcSpots: " + J(R.npc) + ",");
    L.push("            onlineSpots: [],");
    L.push("            lines: [],");
    L.push("            spawn: { x: " + o.spM.x + ", z: " + o.spM.z + ", face: " + (S.face != null ? S.face : 180) + " },");
    L.push("        },"); });
L.push("        /* WOODS36-END */");
const block = L.join('\n') + '\n';
console.log(JSON.stringify(count));
if (DRY) { Object.keys(LINKS_OUT).forEach(id => console.log('link ' + id + ' ' + JSON.stringify(LINKS_OUT[id]))); ROOMS_OUT.forEach(o => console.log(o.S.id + ' doors ' + JSON.stringify(o.doors.map(d => [d.id, d.wall, d.x, d.z, d.face])))); process.exit(0); }
const file = path.join(REPO, 'data.js'); let src = fs.readFileSync(file, 'utf8');
const END = '        /* WOODS36-END */\n', b0 = src.indexOf('        /* WOODS36-BEGIN'), b1 = src.indexOf(END);
if (b0 >= 0 && b1 > b0) src = src.slice(0, b0) + block + src.slice(b1 + END.length);
else { const anchor = '        /* ── THE CLEARING — the crossroads of the woods'; const a = src.indexOf(anchor); if (a < 0) throw new Error('anchor not found in data.js'); src = src.slice(0, a) + block + src.slice(a); }
/* THE LINKS' WOODS ENDS: each link's `a:` / `b:` line gets its room (part) and its place rewritten; the rest of the line (its sub, its passage) is kept.
   NO TUNNEL BLOCKS (2026-11-16, mondo): the drains are plain trail ends (set on the line by hand), never a `tunnel` passage. */
Object.keys(LINKS_OUT).forEach(id => { const [side, e] = LINKS_OUT[id], i = src.indexOf("{ id: '" + id + "'"); if (i < 0) throw new Error('link not found: ' + id);
    const re = new RegExp('(\\n +' + side + ": \\{ site: 'prebuilt_fairy_forest', part: )'[a-z0-9_]+', wall: '[a-z]+'(?:, (?:x|z|face): -?[\\d.]+)+(?:, passage: \\{ len: 3, deep: 1\\.2 \\})?"), m = re.exec(src.slice(i, i + 2500)); if (!m) throw new Error('no Woods end on link ' + id);
    const head = m[1] + "'" + e.part + "', wall: '" + e.wall + "'" + (e.x != null ? ', x: ' + e.x : '') + (e.z != null ? ', z: ' + e.z : '') + (e.face != null ? ', face: ' + e.face : '') + (e.passage ? ', passage: { len: 3, deep: 1.2 }' : '');
    src = src.slice(0, i + m.index) + head + src.slice(i + m.index + m[0].length); });
/* DOOR HQ's Bohemian Grove bay door (2026-11-16; ONE WORLD, PHASE 3: on the Ritual Ground's room, the lake's west shore, its north side) */
{ const b = BAYS_OUT.bay_grove, d = b && b.d, re = /(prebuilt_bohemian_grove: +\{ room: ')[a-z0-9_]+(', door: \{ id: 'bay_grove', )wall: '[a-z]+'(?:, (?:x|z|face): -?[\d.]+)+(?:, passage: \{ len: 3, deep: 1\.2 \})?/; if (!d || !re.test(src)) throw new Error('the Bohemian Grove bay row (siteRooms.entry) not found');
  src = src.replace(re, '$1' + b.room + "$2wall: '" + d.wall + "'" + (d.x != null ? ', x: ' + d.x : '') + (d.z != null ? ', z: ' + d.z : '') + (d.face != null ? ', face: ' + d.face : '') + (d.passage ? ', passage: { len: 3, deep: 1.2 }' : '')); }
/* DOOR HQ's hollow tree (siteRooms.entry.prebuilt_fairy_forest wears the Clearing's `forest` door) */
{ const o = ROOMS_OUT.find(q => q.S.id === R_CLEAR), d = o.doors.find(q => q.id === 'forest'), re = /(prebuilt_fairy_forest: +\{ room: ')[a-z0-9_]+(', door: \{ id: 'forest', )wall: '[a-z]+'(?:, (?:x|z|face): -?[\d.]+)+(?:, passage: \{ len: 3, deep: 1\.2 \})?/; if (!d || !re.test(src)) throw new Error('the hollow tree row (siteRooms.entry.prebuilt_fairy_forest) not found');
  src = src.replace(re, '$1' + R_CLEAR + "$2wall: '" + d.wall + "'" + (d.x != null ? ', x: ' + d.x : '') + (d.z != null ? ', z: ' + d.z : '') + (d.face != null ? ', face: ' + d.face : '') + (d.passage ? ', passage: { len: 3, deep: 1.2 }' : '')); }
fs.writeFileSync(file, src);
console.log('data.js: ' + ROOMS_OUT.map(o => o.S.id).join(', ') + ' written (' + block.length + ' bytes)');
