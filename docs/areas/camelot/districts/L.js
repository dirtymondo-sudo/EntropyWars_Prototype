/* CAMELOT KINGDOM · THE LOOKING-GLASS GARDEN (district L, 6 plots) — the west woods: a hedge garden.
   Repo tooling only: bake-camelot.js calls `build(ctx)` after the shared pieces stand.

   THE PLOTS: P00-01 The Hedges, north · P00-02 The Lawn · P00-03 The Chessboard · P00-04 The Mirror · P00-05 The Tea Party ·
   P00-06 The Hedges, south (squares x 0..12, y 12..84; the garden's zone runs to the moat's west bank, x 0..14).

   WHAT STANDS HERE TODAY (passes 1 + 2 of 5: the exteriors, the walk-in, 2026-11-16; one drawn row `cam:l:garden` in the room's frame + a hedge row a plot):
   the hedges on a stone kerb (the plan's letter `h`: solid by the plan, DRAWN here), topiary on their tops, roses in their faces, rose
   arches over the walks, a stone pier either side of every gateway, lanterns on iron posts. P00-01: the roses being painted (the ladder,
   the pots), the flamingos and the paved ring. P00-02: croquet (hoops, peg, balls, the umpire's chair), spare chess pieces, the small
   board on a table, the telescope, the pocket watch and the rabbit. P00-03: the chessboard (8 x 8 on 3.5 m squares) with the old garden's
   own pieces in their old position; the court: the chess kings and queens, the throne under a striped canopy, the carpet, two suits of
   armour, the Ice Queen. P00-04: a gilt frame before the mirror's door, the fountain, the angel, the caterpillar on his mushroom (smoking),
   a grandfather clock, the giant hourglass, three doors that lead nowhere. P00-05: the tea party: a long table under a striped tent in
   the east nook, twelve chairs no two alike, the cat on the hedge. P00-06: mushrooms growing out of the hedge tops, a bird cage, urns.
   THE GLASSHOUSE (pass 2; `cam:lglass`, squares 9..11 x 38..39, walked into: beds, a palm, a table). Name boards under seven arches.
   Four natives with the old garden's lines (gnome, ice queen, fairy, catgirl); benches and a signpost.

   NOT HERE (the tool's, shared): THE MIRROR's door on P00-04 (square 7, 53: a way out of the zone, to the Looking-Glass waiting room;
   the tool keeps its square clear), the gap in the west hedge to the old garden (`oldgarden`), the dead tree's hole (`deadtree`, on the
   south wall: W's plot P00-07). Dress round them, do not move or retarget them.

   MISSING / WAITING: nothing is waiting on mondo. STILL TO DO (passes 3 to 5): dressing and the natives, air / light / night, polish. The hedges are not a maze: opening one is a plan change (the tool's).
   NEEDS A MODEL (nothing on R2): a rose bush / flower bed, a card soldier, a top hat, a croquet mallet + hedgehog, a hookah, a garden
   gate, a sundial, a bird bath, a standing mirror. Notes: docs/notes/areas-complexes.md "CAMELOT, THE LOOKING-GLASS GARDEN".
   NEW ROWS: keep new pieces out of `dec()` (one stream of dice: it moves the scatter of F, N and W): use `at()` (metres) or `put`.

   THE HOOKS (bake-camelot.js "THE DISTRICT FILES" lists the whole ctx): squares are the kingdom's (kx, ky), 0..96, a plot = 12 x 12 of them,
   plot Pxx-yy = squares xx*12.. , yy*12.. . gx(k) = a square's west / north edge in metres, gc(k) = its middle. feat(row) writes a terrain row,
   note(text) a heading. put(key, x, y, o, on) stands a catalogue prop on a square's middle; dec(...) the same, scattered and turned by the
   dice; tree(kind, h, x, y, r); native(race, x, y, face, say). They take FREE ground only (grass, snow, marble; `on` names another plan
   letter) and never one square twice: the tool stops and names the square. sheet() = a parts list (box, cyl, roof, shell, crown, tower, banner);
   building(id, [x0, y0, x1, y1], side, h, o, parts) = a texbuilding + its drawn look, returns its frame; inside(B, key, lx, lz, o) = furniture
   in that frame; flushArch() writes the looks made so far.
   ctx.old.garden = the old garden room's doors (d), natives (n), lines (l) and chess trees (t); sayOf(room, race) = that native's lines.
   A hedge square is solid ground: to open or close one, the plan's `cells` must change (the tool's: ask on the board).
   RULES (docs/notes/areas-complexes.md "CAMELOT, THE DISTRICT FILES"): one thread = this one file. Not yours: bake-camelot.js, layout.json,
   the other district files, the hill, the town wall, the moat, the roads, the doors out of the zone, the room's sky and shell (a note on
   the board first: docs/notes/claims.md). After any edit: `node bake-camelot.js`, `node --check data.js`, commit the file AND data.js. */
'use strict';
function build(ctx) {
const { PLAN, C, N, W, r2, gx, gc, cell, count, feat, note, sheet, props, taken, arch, flushArch, sq, put, dec, tree, native, sayOf } = ctx, OG = ctx.old.garden;
/* THE LOOKS (few on purpose: every sheet + tint + glow + gain is one mesh a row). The leaf sheet is dark: without `gain` a hedge is a black slab. */
const LEAF = 'leaves_3', HEDGE = 0x8fc46c, HG = 1.75, TOPI = 0xa8dc84, TG = 1.95, STONEK = ctx.WALL, STONE = 0xd2ccc0, SG = 1.4, MARB = 'marble', TIMB = 'wood', TIMT = 0x6a4a30, IRON = 0x2a2c30,
      GOLDK = null, GOLD = 0xd8b050, CLOTH = 'urban:PlasterWallStucco2a', RED = 0xc8202c, WHITE = 0xffffff, PINK = 0xff9ec4, CRIM = 0xa01e2c;
const G = sheet(), P = G.P, at = (key, x, z, o) => props.push(Object.assign({ key, x: r2(x), z: r2(z), floor: true }, o || {}));   // G: the garden's ONE drawn row, in the room's frame (metres); at(): a piece by metres, no dice
const hash = (a, b, c) => { let h = (a * 73856093) ^ (b * 19349663) ^ ((c || 0) * 83492791); h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const isH = (x, y) => x >= 0 && y >= 0 && x < W && y < W && cell[y][x] === 'h', inL = (x, y) => x >= 0 && x < 12 && y >= 12 && y < 84;
const rose = (x, y, z, col, r, o) => { r = r || 0.085; P.push(Object.assign({ s: 'dome', p: [r2(x), r2(y - r * 0.5), r2(z)], r, h: r2(r * 1.5), seg: 6, rings: 2, key: MARB, tint: col, gain: 1.4, glow: col === RED ? 0.3 : 0.5 }, o || {})); };   // a rose: a small bud, lit a little (a white one under the leaf's shade read as a grey stone)
const roseCol = (y, k) => y < 28 ? (k % 3 ? WHITE : RED) : y < 40 ? (k % 2 ? RED : WHITE) : y < 47 ? RED : y < 60 ? WHITE : y < 72 ? PINK : (k % 2 ? WHITE : RED);
note('THE LOOKING-GLASS GARDEN: the hedges (drawn here: the solid is the plan\'s), the chessboard, the marble court, the mirror, the tea party');
{ const used = new Uint8Array(W * W);   // the hedges: a box a run on a stone kerb, a parts list a plot
  PLAN.plots.forEach(p => { const a = sheet(), px = gx(p.x * N + N / 2), pz = gx(p.y * N + N / 2);
      for (let y = p.y * N; y < p.y * N + N; y++) for (let x = p.x * N; x < p.x * N + N; x++) { if (cell[y][x] !== 'h' || used[y * W + x]) continue;
          let w = 1; while (x + w < p.x * N + N && cell[y][x + w] === 'h' && !used[y * W + x + w]) w++;
          let h = 1; rows: while (y + h < p.y * N + N) { for (let i = 0; i < w; i++) if (cell[y + h][x + i] !== 'h' || used[(y + h) * W + x + i]) break rows; h++; }
          for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) used[(y + j) * W + x + i] = 1;
          const cx = r2(gx(x) + w * C / 2 - px), cz = r2(gx(y) + h * C / 2 - pz), hh = 2.6 + ((x + y) % 3) * 0.15;
          a.box(cx, 0, cz, w * C + 0.14, 0.28, h * C + 0.14, STONEK, STONE, { gain: SG });
          a.box(cx, 0.28, cz, w * C, hh - 0.28, h * C, LEAF, HEDGE, { gain: HG, tintTop: TOPI }); count.hedges = (count.hedges || 0) + 1; }
      if (a.P.length) feat({ k: 'arch', id: 'cam:hedge:' + p.id, x: px, z: pz, rot: 0, parts: a.P }); }); }
/* ── THE TOPIARY on the hedge tops and THE ROSES in the hedge faces (pass 1). A hedge square is solid ground: nothing here stands in a walkway. ── */
const topi = (x, y0, z, kind, s) => { const L = { key: LEAF, tint: TOPI, gain: TG }, q = (o) => P.push(Object.assign(o, L));
    if (kind === 0) { P.push({ s: 'cyl', p: [x, y0, z], r: 0.09 * s, h: 0.6 * s, seg: 6, key: TIMB, tint: TIMT, gain: 1.4 }); q({ s: 'cyl', p: [x, r2(y0 + 0.55 * s), z], r: 0.25 * s, r2: 0.72 * s, h: 0.5 * s, seg: 9, cap: false }); q({ s: 'dome', p: [x, r2(y0 + 1.05 * s), z], r: 0.72 * s, h: 0.72 * s, seg: 9, rings: 3 }); }   // a ball on a stem
    else if (kind === 1) q({ s: 'cyl', p: [x, y0, z], r: 0.75 * s, r2: 0, h: 2.3 * s, seg: 8 });   // a cone
    else if (kind === 2) for (let i = 0; i < 3; i++) { const r = (0.8 - i * 0.2) * s, yy = r2(y0 + i * 0.75 * s); q({ s: 'cyl', p: [x, yy, z], r: r * 0.5, r2: r, h: r * 0.45, seg: 9, cap: false }); q({ s: 'dome', p: [x, r2(yy + r * 0.45), z], r, h: r * 0.62, seg: 9, rings: 2 }); }   // three tiers
    else { q({ s: 'cyl', p: [x, y0, z], r: 0.7 * s, r2: 0.3 * s, h: 1.25 * s, seg: 10 }); q({ s: 'cyl', p: [x, r2(y0 + 1.25 * s), z], r: 0.5 * s, h: 0.14 * s, seg: 10 }); q({ s: 'cyl', p: [x, r2(y0 + 1.39 * s), z], r: 0.16 * s, r2: 0.42 * s, h: 0.3 * s, seg: 9, cap: false }); q({ s: 'dome', p: [x, r2(y0 + 1.69 * s), z], r: 0.42 * s, h: 0.42 * s, seg: 9, rings: 3 }); } };   // a pawn (the garden's own game)
for (let y = 17; y < 79; y++) for (let x = 0; x < 12; x++) { if (!isH(x, y) || !inL(x, y)) continue;
    const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(d => ctx.open(x + d[0], y + d[1]) && x + d[0] < 14); if (!nb.length) continue;
    const top = 2.5, hx = gc(x), hz = gc(y);
    if ((x * 5 + y * 3) % 4 === 0) { topi(hx, top, hz, (x + 2 * y) % 4, 0.85 + hash(x, y) * 0.3); count.topiary = (count.topiary || 0) + 1; }
    nb.forEach((d, di) => { if (hash(x, y, di + 7) < 0.3) return;   // roses in the face that looks at a walk: white up north where they are being painted, red at the court, pink at the tea party
        for (let k = 0; k < 4; k++) { const u = (hash(x, y, k * 5 + di) - 0.5) * 3.0, v = 0.7 + hash(y, x, k * 3 + di) * 1.7;
            rose(hx + d[0] * 1.74 + (d[0] ? 0 : u), v, hz + d[1] * 1.74 + (d[1] ? 0 : u), roseCol(y, k + x), 0, { n: 2, step: [d[0] ? 0 : 0.17, 0.11, d[1] ? 0 : 0.17] }); } }); }   // two buds a part (`n` + `step`: half the rows in data.js)
/* a rose arch over a walk two squares wide: `ns` = the walk runs north-south (the arch spans x) */
const roseArch = (kx, ky, ns, col) => { const cx = ns ? gx(kx) : gc(kx), cz = ns ? gc(ky) : gx(ky), R = 3.36;
    for (const s of [-1, 1]) { const px = ns ? cx + s * R : cx, pz = ns ? cz : cz + s * R;
        for (const t of [-1, 1]) P.push({ s: 'box', p: [r2(px + (ns ? 0 : t * 0.26)), 0, r2(pz + (ns ? t * 0.26 : 0))], size: [0.1, 2.5, 0.1], key: TIMB, tint: TIMT, gain: 1.4 });
        P.push({ s: 'box', p: [r2(px), 0.1, r2(pz)], size: ns ? [0.26, 2.4, 0.56] : [0.56, 2.4, 0.26], key: LEAF, tint: TOPI, gain: TG }); }
    P.push({ s: 'roof', form: 'barrel', p: [cx, 2.5, cz], size: [0.9, 1.15, 2 * R + 0.3], ry: ns ? 90 : 0, ends: false, ds: true, seg: 10, key: LEAF, tint: TOPI, gain: TG, glow: 0.12 });
    for (let i = 0; i <= 8; i++) { const a = Math.PI * i / 8, u = Math.cos(a) * (R + 0.1), v = 2.42 + Math.sin(a) * 1.1; P.push({ s: 'dome', p: [r2(ns ? cx + u : cx), r2(v), r2(ns ? cz : cz + u)], r: 0.5, h: 0.34, rz: 0.5, seg: 7, rings: 2, key: LEAF, tint: TOPI, gain: TG }); }
    for (let i = 0; i <= 10; i++) { const a = Math.PI * i / 10, u = Math.cos(a) * (R + 0.2), v = 2.5 + Math.sin(a) * 1.19; for (const t of [-1, 1]) { if ((i + (t > 0 ? 1 : 0)) % 2) continue; rose(ns ? cx + u : cx + t * 0.38, v, ns ? cz + t * 0.38 : cz + u, Array.isArray(col) ? col[i % col.length] : col, 0.12); } }
    count.arches = (count.arches || 0) + 1; };
/* a stone pier with a ball on it, in the end of a hedge (its square is the hedge's) */
const pier = (x, z, h) => { h = h || 3.25; P.push({ s: 'box', p: [r2(x), 0, r2(z)], size: [0.72, h, 0.72], key: STONEK, tint: STONE, gain: SG }, { s: 'box', p: [r2(x), h, r2(z)], size: [0.92, 0.14, 0.92], key: STONEK, tint: 0xe4dfd4, gain: SG },
    { s: 'cyl', p: [r2(x), r2(h + 0.14), r2(z)], r: 0.14, r2: 0.3, h: 0.2, seg: 8, cap: false, key: STONEK, tint: 0xe4dfd4, gain: SG }, { s: 'dome', p: [r2(x), r2(h + 0.34), r2(z)], r: 0.3, h: 0.3, seg: 8, rings: 3, key: STONEK, tint: 0xe4dfd4, gain: SG }); };
const gate = (ky, x0, x1) => { pier(gx(x0) - 0.33, gc(ky)); pier(gx(x1) + 0.33, gc(ky)); };   // a pier either side of a walk x0..x1 where it passes row ky (the piers stand in the hedge ends)
/* a lantern on an iron post that stands in a hedge's face; its arm reaches out over the walk (dx, dz) */
const lamp = (kx, ky, dx, dz) => { const x = gc(kx) + dx * 1.6, z = gc(ky) + dz * 1.6;
    P.push({ s: 'box', p: [r2(x), 0, r2(z)], size: [0.12, 3.05, 0.12], tint: IRON }, { s: 'box', p: [r2(x + dx * 0.4), 2.93, r2(z + dz * 0.4)], size: [dx ? 0.9 : 0.08, 0.08, dz ? 0.9 : 0.08], tint: IRON },
        { s: 'box', p: [r2(x + dx * 0.75), 2.5, r2(z + dz * 0.75)], size: [0.12, 0.2, 0.12], tint: 0xffd890, glow: 1 });
    at('meshy_hanging_lantern', x + dx * 0.75, z + dz * 0.75, { y: 2.35, floor: true, noLight: true }); count.lanterns = (count.lanterns || 0) + 1; };
/* a rose tree (a standard): a stem, a clipped ball, roses on it; `half` = the half that is painted already */
const roseTree = (x, z, col, s, half) => { s = s || 1; P.push({ s: 'cyl', p: [r2(x), 0, r2(z)], r: 0.05, h: 1.35 * s, seg: 6, key: TIMB, tint: TIMT, gain: 1.4 }, { s: 'cyl', p: [r2(x), r2(1.3 * s), r2(z)], r: 0.2 * s, r2: 0.55 * s, h: 0.4 * s, seg: 9, cap: false, key: LEAF, tint: TOPI, gain: TG }, { s: 'dome', p: [r2(x), r2(1.7 * s), r2(z)], r: 0.55 * s, h: 0.55 * s, seg: 9, rings: 3, key: LEAF, tint: TOPI, gain: TG });
    for (let i = 0; i < 9; i++) { const a = i * 2.4, rr = (i % 3 === 0 ? 0.25 : 0.5) * s, c = half != null ? (Math.cos(a) > 0 ? half : col) : col; rose(x + Math.cos(a) * rr, (1.74 + (i % 3 === 0 ? 0.48 : i % 3 === 1 ? 0.32 : 0.1)) * s, z + Math.sin(a) * rr, c, 0.1 * s); } };

/* ── THE WALKS: arches, piers, lanterns ── */
[18, 21, 26].forEach(y => roseArch(7, y, true, [WHITE, WHITE, RED])); [61, 63, 72, 77].forEach((y, i) => roseArch(7, y, true, i < 2 ? PINK : [RED, WHITE]));
[50, 59, 64, 70].forEach((y, i) => roseArch(3, y, true, i % 2 ? WHITE : RED)); roseArch(9, 48, false, RED); roseArch(11, 48, false, WHITE);
[17, 27, 40, 46, 49, 51, 59, 64, 71, 77].forEach(y => gate(y, 6, 8)); [40, 46, 49, 75].forEach(y => gate(y, 2, 4));
[[8, 19, -1, 0], [8, 26, -1, 0], [8, 41, -1, 0], [8, 50, -1, 0], [8, 60, -1, 0], [8, 73, -1, 0], [5, 22, 1, 0], [5, 46, 1, 0], [5, 51, 1, 0], [5, 62, 1, 0], [5, 76, 1, 0],
 [1, 42, 1, 0], [1, 52, 1, 0], [1, 57, 1, 0], [1, 62, 1, 0], [1, 68, 1, 0], [4, 41, -1, 0], [4, 45, -1, 0], [4, 61, -1, 0], [4, 72, -1, 0], [10, 46, 0, 1], [10, 49, 0, -1]].forEach(q => lamp(q[0], q[1], q[2], q[3]));

{ const bx = gx(7), bz = gx(34);   // THE CHESSBOARD: the old garden's own board and its position
  feat({ k: 'board', x: bx, z: bz, n: 8, cell: 3.5, keys: ['marble_light', 'marble'], colors: [15920870, 2894392], clear: 0 });
  OG.t.forEach(t => { if (t.h) return; const o = Object.assign({}, t, { x: r2(t.x + bx), z: r2(t.z - 17.5 + bz) }); delete o.chessPos; feat(o); }); }
[[5, 23], [8, 23], [9, 23], [8, 25], [9, 25]].forEach(q => dec('flamingo', q[0], q[1])); dec('garden_ring', 9, 24); native('gnome', 5, 24, 90, sayOf(OG, 'gnome'));
dec('pocket_watch', 2, 29); dec('rabbit', 11, 29); put('park_bench', 11, 33, { face: 270 }); put('iron_garden_bench', 1, 35, { face: 90 });
tree('chess_king_dark', 3.4, 9, 42); tree('chess_queen_dark', 3.1, 9, 43); tree('chess_king', 3.4, 5, 43); tree('chess_queen', 3.1, 5, 44);
put('royal_throne', 8, 43, { face: 270, floor: true }); native('ice queen', 8, 42, 270, sayOf(OG, 'ice queen'));
{ put('mushroom', 9, 57); props.push({ key: 'caterpillar', x: gc(9), z: gc(57), floor: true, y: 3.3, face: 270 }); dec('fae_toadstool', 5, 57); dec('fae_toadstool', 9, 53); put('fountain', 5, 53); put('angel_statue', 9, 55, { face: 270 }); }
native('fairy', 9, 69, 300, sayOf(OG, 'fairy')); native('catgirl', 5, 69, 60, sayOf(OG, 'catgirl')); put('signpost', 8, 45);

/* ── THE HEDGES, NORTH (P00-01): the roses are being painted. A white rose tree half red, the ladder, the pots, what was spilt. ── */
{ const x = gc(8) + 0.9, z = gc(22) - 0.6; sq(8, 22); roseTree(x, z, WHITE, 1.25, RED); roseTree(gc(5) - 0.7, gc(23) - 1.1, WHITE, 1.1); roseTree(gc(9) + 0.9, gc(25) + 0.9, RED, 1.1);
  at('library_ladder', x - 1.0, z + 0.5, { face: 60 }); at('wooden_bucket', x - 0.2, z + 1.3, { face: 20 }); at('wooden_bucket', x - 1.5, z + 1.5, { face: 200 });
  for (const q of [[-0.6, 1.5, 0.2], [0.5, 1.6, 0.17]]) { P.push({ s: 'cyl', p: [r2(x + q[0]), 0, r2(z + q[1])], r: q[2], h: 0.34, seg: 10, key: TIMB, tint: 0xb89468, gain: 1.4, keyTop: MARB, tintTop: RED }); }
  P.push({ s: 'cyl', p: [r2(x - 0.1), 0.012, r2(z + 2.0)], r: 0.55, h: 0.012, seg: 9, key: MARB, tint: RED }, { s: 'cyl', p: [r2(x + 0.7), 0.012, r2(z + 2.3)], r: 0.22, h: 0.012, seg: 7, key: MARB, tint: RED }); }

/* ── THE LAWN (P00-02): croquet. The hoops, the peg, the balls, the umpire's chair (the old garden's high chair); spare pieces wait beside the board. ── */
{ put('lifeguard_chair', 1, 28, { face: 90, floor: true }); [[3, 28.5, 20], [4.6, 29.3, 80], [2.2, 29.6, 140], [9.4, 28.6, 140], [10.4, 29.4, 60], [8.6, 29.5, 10]].forEach(q => P.push({ s: 'roof', form: 'barrel', p: [gx(q[0]), 0, gx(q[1])], size: [0.06, 0.42, 0.5], ry: q[2], ends: false, ds: true, seg: 8, key: MARB, tint: WHITE, gain: 1.4, glow: 0.3 }));   // six hoops
  at('flamingo', gx(3.8), gx(28.9), { face: 200 }); at('flamingo', gx(10), gx(28.7), { face: 310 });
  const px = gx(4.1), pz = gx(29.9); for (let i = 0; i < 5; i++) P.push({ s: 'cyl', p: [px, r2(i * 0.14), pz], r: 0.045, h: 0.14, seg: 8, key: MARB, tint: [0x2060c0, RED, 0x202020, 0xf0c020, WHITE][i], gain: 1.2 });
  [[3.3, 28.6, 0x2060c0], [4.9, 29.6, RED], [9.1, 29.1, 0x202020], [10.7, 28.4, 0xf0c020]].forEach(q => P.push({ s: 'dome', p: [gx(q[0]), 0, gx(q[1])], r: 0.1, h: 0.19, seg: 8, rings: 3, key: MARB, tint: q[2], gain: 1.3, glow: 0.15 }));
  const kh = k => (OG.t.find(t => t.kind === k) || {}).h || 2.4;
  tree('chess_pawn_dark', kh('chess_pawn_dark'), 1, 31); tree('chess_pawn_dark', kh('chess_pawn_dark'), 1, 33); tree('chess_knight_dark', kh('chess_knight_dark'), 2, 37);
  tree('chess_pawn', kh('chess_pawn'), 11, 31); tree('chess_bishop', kh('chess_bishop'), 11, 36);
  /* the south strip: the small board on a table (the old garden's game: "Which move?" "The first one. E4."), the telescope */
  sq(3, 38); at('tulip_table', gc(3), gc(38)); at('chess_set_game', gc(3), gc(38), { floor: true, y: 0.74 }); at('teal_chair', gc(3) - 1.1, gc(38), { face: 90 }); at('teal_chair', gc(3) + 1.1, gc(38), { face: 270 });
  put('brass_telescope', 5, 39, { face: 0, floor: true }); roseTree(gc(1) - 0.9, gc(39) + 0.9, RED); roseTree(gc(1) - 0.9, gc(28) - 0.9, WHITE); roseTree(gc(11) + 0.9, gc(28) - 0.9, RED); }

/* ── THE COURT (P00-03): the throne under a striped canopy, a carpet up to it, the guard ── */
{ const x = gc(8), z = gc(43), H = 3.3;
  for (const s of [-1, 1]) for (const t of [-1, 1]) { P.push({ s: 'cyl', p: [r2(x + s * 1.55), 0, r2(z + t * 1.55)], r: 0.08, h: H, seg: 8, key: GOLDK, tint: GOLD }, { s: 'dome', p: [r2(x + s * 1.55), r2(H + 0.42), r2(z + t * 1.55)], r: 0.13, h: 0.13, seg: 8, rings: 2, key: GOLDK, tint: GOLD }); }
  for (let k = 0; k < 8; k++) { const u = -1.54 + k * 0.44, c = k % 2 ? WHITE : CRIM, dr = 0.5 + (k % 2) * 0.1;   // the valance: strips of two colours, every other one longer
      for (const t of [-1, 1]) { P.push({ s: 'box', p: [r2(x + u), r2(H + 0.4 - dr), r2(z + t * 1.6)], size: [0.44, dr, 0.04], key: CLOTH, tint: c, gain: 1.6, ds: true }, { s: 'box', p: [r2(x + t * 1.6), r2(H + 0.4 - dr), r2(z + u)], size: [0.04, dr, 0.44], key: CLOTH, tint: c, gain: 1.6, ds: true }); } }
  P.push({ s: 'roof', form: 'pyramid', p: [x, r2(H + 0.4), z], size: [3.3, 1.3, 3.3], key: CLOTH, tint: CRIM, gain: 1.6, ds: true }, { s: 'cyl', p: [x, r2(H + 1.62), z], r: 0.1, r2: 0, h: 0.6, seg: 8, key: GOLDK, tint: GOLD }, { s: 'dome', p: [x, r2(H + 1.55), z], r: 0.2, h: 0.16, seg: 8, rings: 2, key: GOLDK, tint: GOLD });
  const cx = r2((gx(5) + 1.2 + gx(8) - 0.2) / 2), cl = r2(gx(8) - 0.2 - gx(5) - 1.2);   // the carpet: crimson, a gold edge
  P.push({ s: 'box', p: [cx, 0.008, z], size: [cl, 0.03, 1.9], key: CLOTH, tint: CRIM, gain: 1.6, sides: false }, { s: 'box', p: [cx, 0.01, r2(z - 0.86)], size: [cl, 0.032, 0.12], key: GOLDK, tint: GOLD, sides: false }, { s: 'box', p: [cx, 0.01, r2(z + 0.86)], size: [cl, 0.032, 0.12], key: GOLDK, tint: GOLD, sides: false });
  put('armour_stand', 8, 44, { face: 270, floor: true }); put('armour_stand', 9, 44, { face: 270, floor: true }); put('brazier', 4, 44, { noLight: true, floor: true });
  roseTree(gc(6) - 1.2, gc(42) - 1.2, RED); roseTree(gc(8) + 1.0, gc(45) + 1.2, RED); }

/* ── THE MIRROR (P00-04): a gilt looking-glass frame stands before the door (the door itself is the tool's: not moved); clocks and doors that lead nowhere ── */
{ const x = gc(7), z = gc(53) + 1.95, IW = 2.15, Hc = 5.3;
  for (const s of [-1, 1]) { P.push({ s: 'box', p: [r2(x + s * (IW + 0.3)), 0, z], size: [0.6, 0.5, 0.6], key: STONEK, tint: STONE, gain: SG }, { s: 'cyl', p: [r2(x + s * (IW + 0.3)), 0.5, z], r: 0.22, h: Hc - 0.5, seg: 10, key: GOLDK, tint: GOLD },
        { s: 'box', p: [r2(x + s * (IW + 0.3)), Hc, z], size: [0.6, 0.18, 0.6], key: GOLDK, tint: GOLD }, { s: 'dome', p: [r2(x + s * (IW + 0.3)), r2(Hc + 0.18 + 0.9), z], r: 0.2, h: 0.2, seg: 8, rings: 2, key: GOLDK, tint: GOLD }, { s: 'cyl', p: [r2(x + s * (IW + 0.3)), r2(Hc + 0.18), z], r: 0.2, r2: 0.08, h: 0.9, seg: 8, key: GOLDK, tint: GOLD }); }
  P.push({ s: 'roof', form: 'barrel', p: [x, Hc + 0.18, z], size: [0.4, 1.5, 2 * IW + 0.6], ry: 90, ends: false, ds: true, seg: 12, key: GOLDK, tint: GOLD });
  for (let i = 1; i < 12; i++) { const a = Math.PI * i / 12; P.push({ s: 'dome', p: [r2(x + Math.cos(a) * (IW + 0.32)), r2(Hc + 0.2 + Math.sin(a) * 1.5), z], r: i === 6 ? 0.3 : 0.13, h: i === 6 ? 0.3 : 0.13, seg: 8, rings: 2, key: GOLDK, tint: GOLD }); }
  put('gclock', 10, 54, { face: 270, floor: true }); put('giant_hourglass', 10, 56, { face: 270, floor: true }); put('psx_door_1_loose', 4, 55, { face: 90, floor: true }); put('psx_door_2_loose', 8, 58, { face: 0, floor: true }); put('psx_door_4_loose', 8, 52, { face: 180, floor: true });
  at('pocket_watch', gc(5) + 1.5, gc(53) + 1.3, { face: 40 }); at('mushroom2', gc(8) + 0.2, gc(57) + 0.9, { face: 70 }); at('mushroom2', gc(9) + 1.3, gc(56) + 0.4, { face: 200 });
  at('chimney_smoke', gc(9) - 0.5, gc(57), { y: 4.3, rise: 3 });   // the caterpillar's smoke
  roseTree(gc(5) - 1.1, gc(54) + 1.2, WHITE); roseTree(gc(9) + 1.1, gc(54) - 1.2, WHITE); }

/* ── THE TEA PARTY (P00-05): one long table in the east nook, under a striped tent; no two chairs alike. The old garden's own table and four
   chairs are its head (they stood in the walk: moved three squares east, onto the grass). ── */
{ const x = gc(9), z0 = gc(66), TOP = 0.96, n = 6; for (let y = 66; y < 70; y++) for (let kx = 8; kx < 11; kx++) if (!(kx === 9 && y === 69)) taken.add(kx + ':' + y);
  for (let i = 0; i < n; i++) at(i % 2 ? 'psx_table_large_2_1' : 'psx_table_large_2', x, z0 + i * 1.7, { face: 90 });   // six tables end to end, north to south
  const L = n * 1.7, zc = r2(z0 + L / 2 - 0.85);
  P.push({ s: 'box', p: [x, TOP, zc], size: [1.06, 0.02, r2(L + 0.2)], key: CLOTH, tint: WHITE, gain: 1.6 }, { s: 'box', p: [x, r2(TOP - 0.3), zc], size: [1.08, 0.3, r2(L + 0.22)], key: CLOTH, tint: PINK, gain: 1.5, top: false, ds: true });   // the cloth and its drop
  const CH = ['psx_chair_mp_3', 'wingback_chair', 'psx_chair_mp_5', 'teal_chair', 'psx_armchair_1', 'psx_chair_mp_1', 'teal_chair', 'psx_chair_mp_3_2', 'psx_armchair_2', 'psx_chair_mp_5_1', 'teal_chair', 'psx_chair_mp_2'];
  for (let i = 0; i < 6; i++) for (const s of [-1, 1]) { const k = CH[i * 2 + (s > 0 ? 1 : 0)]; at(k, x + s * (/armchair|wingback/.test(k) ? 1.25 : 1.05), z0 - 0.5 + i * 1.75, { face: s > 0 ? 270 : 90 }); }
  at('teal_chair', x, z0 - 1.55, { face: 180 }); at('royal_throne', x, r2(z0 + L - 0.1), { face: 0 });   // the head and the foot
  const on = (key, dx, i, o) => at(key, x + dx, z0 - 0.6 + i, Object.assign({ floor: true, y: TOP + 0.02 }, o || {}));
  on('teapot', 0, 0.3, { face: 30 }); on('teacups', 0.2, 1.3); on('wedding_cake', 0, 2.4); on('xmas_cookies', -0.2, 3.3); on('teapot', 0.1, 4.3, { face: 200 }); on('xmas_gingerbread', 0.3, 4.9); on('xmas_flan', -0.25, 5.3); on('candelabra', 0, 6.1); on('xmas_punch', 0.25, 6.9);
  on('teacups', -0.15, 7.6); on('xmas_cocoa', 0.3, 8.2); on('teapot', 0, 9.0, { face: 110 }); on('pocket_watch', -0.3, 9.5); on('psx_plate_mp_1', 0.3, 1.9); on('psx_plate_mp_1', -0.3, 2.9); on('psx_plate_mp_1', 0.3, 5.9); on('psx_plate_mp_1', -0.3, 8.6); on('coffee_mug', 0.32, 3.7); on('coffee_mug', -0.3, 6.7);
  /* the tent: strips of two colours across the table, a ridge pole on three posts; the sides are open */
  const TH = 3.0, TW = 7.4, tz0 = r2(z0 - 2.2), tl = 14.0, ns = 14;
  for (let k = 0; k < ns; k++) { const c = k % 2 ? WHITE : PINK, zz = r2(tz0 + (k + 0.5) * tl / ns);
      P.push({ s: 'roof', form: 'gable', p: [x, TH, zz], size: [tl / ns, 1.5, TW], ry: 90, key: CLOTH, tint: c, gain: 1.6, glow: 0.28, ds: true, keyEnd: CLOTH, tintEnd: c });
      for (const s of [-1, 1]) P.push({ s: 'box', p: [r2(x + s * TW / 2), r2(TH - 0.3 - (k % 2) * 0.08), zz], size: [0.03, 0.3 + (k % 2) * 0.08, tl / ns], key: CLOTH, tint: k % 2 ? PINK : WHITE, gain: 1.6, ds: true }); }
  for (const t of [0, 0.5, 1]) { const zz = r2(tz0 + 0.2 + t * (tl - 0.4)); P.push({ s: 'cyl', p: [x, 0, zz], r: 0.07, h: TH + 1.5, seg: 8, key: TIMB, tint: 0xb89468, gain: 1.4 }); for (const s of [-1, 1]) P.push({ s: 'cyl', p: [r2(x + s * TW / 2), 0, zz], r: 0.06, h: TH, seg: 8, key: TIMB, tint: 0xb89468, gain: 1.4 }); }
  for (const t of [0.25, 0.5, 0.75]) at('paper_lantern', x + (t === 0.5 ? 0 : 1.4), tz0 + t * tl, { floor: true, y: TH - 0.55, noLight: true });
  /* the west nook: the seat that is tomorrow's, a music box; the cat on the hedge */
  at('wingback_chair', gc(4) + 0.4, gc(67) + 0.5, { face: 100 }); at('decor_music_box_dancer', gc(4) + 1.6, gc(68) - 0.2, { face: 40 }); at('cat', gc(4) - 0.2, gc(69) + 0.4, { floor: true, y: 2.72, face: 100 });
  roseTree(gc(5) + 0.9, gc(66) - 0.9, PINK); roseTree(gc(8) - 1.1, gc(65) - 0.6, PINK); }

/* ── THE HEDGES, SOUTH (P00-06): mushrooms grow out of the hedge tops; cages with nothing in them on the piers' walk ── */
[[5, 73, 'mushroom2', 2.6], [8, 75, 'mushroom', 2.5], [4, 77, 'mushroom2', 2.7], [9, 77, 'mushroom2', 2.6], [1, 73, 'mushroom', 2.5], [10, 73, 'mushroom2', 2.7], [5, 60, 'mushroom2', 2.6], [9, 61, 'mushroom', 2.5]].forEach(q => at(q[2], gc(q[0]) + 0.3, gc(q[1]) - 0.2, { floor: true, y: q[3], face: q[0] * 50 }));
at('bird_cage', gc(4) + 1.3, gc(74) - 1.2, { face: 30 }); at('stone_urn', gc(5) - 1.2, gc(75) + 1.2); at('stone_urn', gc(2) - 1.2, gc(74) - 1.2);
/* ── PASS 2: THE GLASSHOUSE (P00-03, the lawn's south-east corner, squares 9..11 x 38..39): the garden's one walk-in. Dark glass in a white
   frame on a stone course, a glass roof; inside a walk down the west side, raised beds along the east and north walls, a palm, a table. ── */
{ const GL = 'urban:GlassWindowTall1a', DARK = 0x3e5c6c, WH = 0xf2f0e8, Hh = 5.25, EV = 3.9, BASE = 0.7;
  for (let y = 38; y < 40; y++) for (let x = 9; x < 12; x++) taken.add(x + ':' + y);
  const B = ctx.building('lglass', [9, 38, 12, 40], 'W', Hh, { leafDouble: false, leaf: 'leaf_birch_glass', keyIn: STONEK, floorIn: 'cobblestone' }, (a, w, d, door) => {
      const Q = a.P, W2 = w / 2 + 0.05, D2 = d / 2 + 0.05, post = (x, z, h, t) => Q.push({ s: 'box', p: [r2(x), 0, r2(z)], size: [t || 0.14, h, t || 0.14], key: MARB, tint: WH, gain: 1.3 });
      a.shell(w, BASE, d, STONEK, STONE, door); Q.slice(-2).forEach(q => { q.gain = SG; });
      Q.push({ s: 'box', p: [0, BASE, 0], size: [2 * W2, EV - BASE, 2 * D2], top: false, faces: 'blr', key: GL, tint: DARK, glow: 0.22, win: 'keep' }, { s: 'quad', p: [0, BASE, D2], size: [2 * W2, EV - BASE], ry: 0, hole: [door.lx, door.cw, 2.2 - BASE], key: GL, tint: DARK, glow: 0.22, win: 'keep' });
      for (let x = -w / 2; x <= w / 2 + 0.01; x += 1.75) for (const sgn of [-1, 1]) { if (sgn > 0 && Math.abs(x - door.lx) < door.cw / 2 - 0.05) continue; post(x, sgn * (D2 + 0.04), EV); }   // the white frame: a post every 1.75 m
      for (let z = -d / 2 + 1.75; z < d / 2 - 0.01; z += 1.75) for (const sgn of [-1, 1]) post(sgn * (W2 + 0.04), z, EV);
      for (const sgn of [-1, 1]) { Q.push({ s: 'box', p: [0, EV - 0.14, sgn * (D2 + 0.04)], size: [2 * W2 + 0.3, 0.2, 0.18], key: MARB, tint: WH, gain: 1.3 }, { s: 'box', p: [sgn * (W2 + 0.04), EV - 0.14, 0], size: [0.18, 0.2, 2 * D2 + 0.3], key: MARB, tint: WH, gain: 1.3 },
          { s: 'box', p: [0, 2.2, sgn * (D2 + 0.04)], size: [2 * W2, 0.1, 0.12], key: MARB, tint: WH, gain: 1.3 }, { s: 'box', p: [sgn * (W2 + 0.04), 2.2, 0], size: [0.12, 0.1, 2 * D2], key: MARB, tint: WH, gain: 1.3 }); }
      a.roof('gable', 0, EV, 0, 2 * D2 + 0.5, 1.5, 2 * W2 + 0.5, GL, DARK, { ry: 90, keyEnd: GL, tintEnd: DARK, glow: 0.12, win: 'keep', kind: 'wall' });
      Q.push({ s: 'box', p: [0, EV + 1.46, 0], size: [0.16, 0.16, 2 * D2 + 0.7], key: MARB, tint: WH, gain: 1.3, roof: true });   // the ridge, its gilt ends
      for (const sgn of [-1, 1]) Q.push({ s: 'cyl', p: [0, EV + 1.6, sgn * (D2 + 0.3)], r: 0.09, r2: 0, h: 0.7, seg: 6, tint: GOLD, roof: true });
      for (const sgn of [-1, 1]) Q.push({ s: 'box', p: [sgn * (W2 + 0.3), EV - 0.02, 0], size: [0.12, 0.12, 2 * D2 + 0.7], key: MARB, tint: WH, gain: 1.3, roof: true }); });   // the eaves' gutters
  /* the inside: its own row in the building's frame (lx along the front, +lz = the front, the door's column is the west walk) */
  const I = sheet(), Q = I.P, c = B.at(0, 0), w = B.fw, d = B.fd, E = 0.33, W2 = w / 2, D2 = d / 2, TOP = 4.55, LIT = 0xd4ecf4;
  arch.push({ k: 'arch', id: 'cam:lglass:in', x: c[0], z: c[1], rot: B.face(0), parts: Q });
  const wall = (x, z, qw, ry, x2) => { Q.push(Object.assign({ s: 'quad', p: [r2(x), BASE, r2(z)], size: [r2(qw), TOP - BASE], ry, kind: 'wall', key: GL, tint: LIT, glow: 0.55, win: 'keep' }, x2 || {})); Q.push({ s: 'quad', p: [r2(x), 0, r2(z)], size: [r2(qw), BASE], ry, kind: 'wall', key: STONEK, tint: STONE, gain: SG, glow: 0.12 }); };
  wall(0, -D2 + E, w - 2 * E, 0); wall(-W2 + E, 0, d - 2 * E, 270); wall(W2 - E, 0, d - 2 * E, 90);
  for (const q of [[-W2 + E, B.door.lx - B.door.cw / 2 - 0.06], [B.door.lx + B.door.cw / 2 + 0.06, W2 - E]]) if (q[1] - q[0] > 0.05) wall((q[0] + q[1]) / 2, D2 - E, q[1] - q[0], 180);   // the front wall either side of the door
  Q.push({ s: 'quad', p: [r2(B.door.lx), 2.25, r2(D2 - E)], size: [B.door.cw + 0.12, TOP - 2.25], ry: 180, kind: 'wall', key: GL, tint: LIT, glow: 0.55, win: 'keep' });
  Q.push({ s: 'box', p: [0, TOP, 0], size: [w - 2 * E, 0.06, d - 2 * E], sides: false, top: false, under: true, kind: 'wall', key: GL, tint: 0xe8f6ff, glow: 0.75, win: 'keep' },   // the glass roof from under: lit (`kind: 'wall'`: as glass it drew black)
      { s: 'box', p: [0, 0.036, 0], size: [w - 2 * E, 0.014, d - 2 * E], sides: false, key: 'cobblestone', tint: 0xffffff, glow: 0.1 });   // the floor to the lining (the building's own floor stops short of it: a strip of lawn showed)
  for (let z = -D2 + 1.75; z < D2 - 0.1; z += 1.75) Q.push({ s: 'box', p: [0, TOP - 0.14, r2(z)], size: [w - 2 * E, 0.14, 0.12], key: MARB, tint: WH, gain: 1.3, glow: 0.3 });
  Q.push({ s: 'box', p: [0, TOP - 0.2, 0], size: [0.14, 0.2, d - 2 * E], key: MARB, tint: WH, gain: 1.3, glow: 0.3 });
  /* the raised beds: boards round dark soil, along the east wall (the building's back = -lz is north... the frame's right = +lx) and the far end */
  const bed = (x, z, bw, bd) => { Q.push({ s: 'box', p: [r2(x), 0.03, r2(z)], size: [bw, 0.42, bd], key: 'wood_planks', tint: 0xb89468, gain: 1.4, glow: 0.12, keyTop: 'dirt_2', tintTop: 0x8a6a4a });
      const p0 = B.at(x - (bw > bd ? bw / 2 : 0), z - (bw > bd ? 0 : bd / 2)), p1 = B.at(x + (bw > bd ? bw / 2 : 0), z + (bw > bd ? 0 : bd / 2)); feat({ k: 'wall', x0: p0[0], z0: p0[1], x1: p1[0], z1: p1[1], t: Math.min(bw, bd), h: 0.6, ghost: true, rail: false }); };
  const bush = (x, z, r, col) => { Q.push({ s: 'dome', p: [r2(x), 0.43, r2(z)], r, h: r2(r * 0.9), seg: 8, rings: 3, key: LEAF, tint: TOPI, gain: TG, glow: 0.15 }); for (let i = 0; i < 7; i++) { const a = i * 2.4, rr = (i % 3 ? 0.78 : 0.4) * r; Q.push({ s: 'dome', p: [r2(x + Math.cos(a) * rr), r2(0.43 + r * (i % 3 ? 0.42 : 0.72)), r2(z + Math.sin(a) * rr)], r: 0.08, h: 0.11, seg: 6, rings: 2, key: MARB, tint: col, gain: 1.4, glow: 0.5 }); } };
  const RX = W2 - E - 0.6, BZ = -D2 + E + 0.6; bed(RX, 0.6, 1.1, d - 2 * E - 1.4); bed(-0.75, BZ, w - 2 * E - 1.6, 1.1);
  const inn = (key, x, z, o) => ctx.inside(B, key, r2(x), r2(z), Object.assign({ floor: true }, o || {}));
  [[-1.6, RED], [0.2, WHITE], [2.0, PINK], [3.6, RED]].forEach(q => bush(RX, q[0], 0.42, q[1])); bush(-1.9, BZ, 0.42, WHITE); bush(0.4, BZ, 0.4, PINK);
  inn('fern', RX, -2.6, { y: 0.45, face: 40 }); inn('woods_healflower', RX - 0.1, -0.7, { y: 0.45 }); inn('fern', RX, 1.1, { y: 0.45, face: 200 }); inn('woods_healflower', RX, 2.9, { y: 0.45, face: 90 }); inn('potted_plant', RX, 4.3, { y: 0.45, face: 120 });
  inn('fern', -0.8, BZ, { y: 0.45, face: 300 }); inn('psx_potted_cactus_mp_1', -2.6, BZ, { y: 0.46 }); inn('palm_tree', 1.75, -3.5, { face: 60 });   // the palm on its square's middle; the table on the next
  inn('psx_dinner_table_1', 1.75, 0, { face: 90 }); const on = (key, x, z, o) => inn(key, 1.75 + x, z, Object.assign({ y: 0.88 }, o || {}));
  on('item_potion_flask', 0.1, -0.5, { face: 30 }); on('psx_glass_bottle_1', -0.2, -0.2); on('house_key', 0.15, 0.1, { face: 70 }); on('xmas_cookies', -0.1, 0.5); on('psx_planter_pot_mp_1_full', 0.2, 0.62); on('psx_open_book_mp_1', -0.15, -0.62, { face: 100 });
  inn('office_plant', 1.3, 3.9, { face: 10 }); inn('wooden_bucket', 0.4, 4.3, { face: 80 }); inn('hw_shovel', 0.9, 4.6, { face: 30 }); inn('bird_cage', -2.75, -3.9, { face: 140 }); inn('psx_chair_mp_3', 0.75, 0.3, { face: 90 });
  inn('monarch', -1.2, -1.6, { y: 1.7 }); inn('blue_morpho', 0.6, 1.9, { y: 2.1 }); inn('swallowtail', -0.4, -3.2, { y: 1.5 }); inn('crystal_chandelier', -0.2, 0.4, { y: TOP - 1.75, noLight: true });
  /* outside: an urn either side of the door, the name over it */
  for (const sgn of [-1, 1]) { const q = B.at(B.door.lx + sgn * 1.25, D2 + 0.75); at('stone_urn', q[0], q[1], { face: 40 * sgn }); } }

/* ── PASS 2: THE NAME BOARDS under the arches (the plots' own plain names) ── */
{ const board = (kx, ky, ns, word) => { const x = ns ? gx(kx) : gc(kx), z = ns ? gc(ky) : gx(ky), wd = Math.max(1.8, word.length * 0.27), key = 'txt:' + word + '|#f0d890||' + r2(wd * 0.88 / 0.36);
      P.push({ s: 'box', p: [x, 2.78, z], size: ns ? [wd, 0.52, 0.07] : [0.07, 0.52, wd], key: TIMB, tint: 0x4a3626, gain: 1.4 });
      for (const t of [-1, 1]) { P.push({ s: 'quad', p: ns ? [x, 2.86, r2(z + t * 0.042)] : [r2(x + t * 0.042), 2.86, z], size: [r2(wd * 0.88), 0.36], ry: ns ? (t > 0 ? 0 : 180) : (t > 0 ? 270 : 90), key, tint: 0xffffff, uv: 'fit', kind: 'over' });
          P.push({ s: 'box', p: ns ? [r2(x + t * (wd / 2 - 0.2)), 3.3, z] : [x, 3.3, r2(z + t * (wd / 2 - 0.2))], size: [0.03, 0.3, 0.03], tint: IRON }); } };
  roseArch(7, 39, true, [RED, WHITE]); roseArch(7, 50, true, WHITE);
  board(7, 26, true, 'THE LAWN'); board(7, 39, true, 'THE CHESSBOARD'); board(7, 50, true, 'THE MIRROR'); board(7, 63, true, 'THE TEA PARTY'); board(9, 48, false, 'THE LOOKING-GLASS GARDEN'); board(7, 18, true, 'THE HEDGES'); board(7, 77, true, 'THE HEDGES');
  /* the old garden's four `white_cloud`: tried over the walks at 10 to 12 m; under this room's sun they read as floating grey rock piles. Left out (told to mondo). */ }
arch.push({ k: 'arch', id: 'cam:l:garden', x: 0, z: 0, rot: 0, y: 0, parts: P }); flushArch();
}
module.exports = { build };
