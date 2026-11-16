/* CAMELOT KINGDOM · THE LOOKING-GLASS GARDEN (district L, 6 plots) — the west woods: a hedge garden.
   Repo tooling only: bake-camelot.js calls `build(ctx)` after the shared pieces stand.

   THE PLOTS: P00-01 The Hedges, north · P00-02 The Lawn · P00-03 The Chessboard · P00-04 The Mirror · P00-05 The Tea Party ·
   P00-06 The Hedges, south (squares x 0..12, y 12..84; the garden's zone runs to the moat's west bank, x 0..14).

   WHAT STANDS HERE TODAY (ALL FIVE PASSES + THE MODEL PASS ARE IN, 2026-11-16. THE THREAD HAS STOPPED and waits mondo's look; one drawn row `cam:l:garden` in the room's frame + a hedge row a plot):
   the hedges on a stone kerb (the plan's letter `h`: solid by the plan, DRAWN here), topiary on their tops, roses in their faces, rose
   arches over the walks, a stone pier either side of every gateway, lanterns on iron posts. P00-01: the roses being painted (the ladder,
   the pots), the flamingos and the paved ring. P00-02: croquet (hoops, peg, balls, the umpire's chair), spare chess pieces, the small
   board on a table, the telescope, the pocket watch and the rabbit. P00-03: the chessboard (8 x 8 on 3.5 m squares) with the old garden's
   own pieces in their old position; the court: the chess kings and queens, the throne under a striped canopy, the carpet, two suits of
   armour, the Ice Queen. P00-04: a gilt frame before the mirror's door, the fountain, the angel, the caterpillar on his mushroom (smoking),
   a grandfather clock, the giant hourglass, three doors that lead nowhere. P00-05: the tea party: a long table under a striped tent in
   the east nook, twelve chairs no two alike, the cat on the hedge. P00-06: mushrooms growing out of the hedge tops, a bird cage, urns.
   THE GLASSHOUSE (pass 2; `cam:lglass`, squares 9..11 x 38..39, walked into: beds, a palm, a table). Name boards under seven arches.
   Pass 3: flower beds at the lawns' and nooks' hedge feet, butterflies, crows, busts at the mirror, presents and music at the tea party,
   glowing caps along the south walks. Four natives with the old garden's lines (gnome, ice queen, fairy, catgirl) + five with none
   (two chess pieces, a rabbit, a dreameater, a mushroom girl); benches and a signpost.

   NOT HERE (the tool's, shared): THE MIRROR's door on P00-04 (square 7, 53: a way out of the zone, to the Looking-Glass waiting room;
   the tool keeps its square clear), the gap in the west hedge to the old garden (`oldgarden`), the dead tree's hole (`deadtree`, on the
   south wall: W's plot P00-07). Dress round them, do not move or retarget them.

   MISSING / WAITING: nothing is waiting on mondo. Pass 4: `airZones` (petals, fireflies, spores), steam, the night look. Pass 5: ghost walls under the
   tea table and in the Glasshouse, props and particles thinned for the frame rate. OPEN: a maze (a plan change), the natives' lines, sound. The hedges are not a maze: opening one is a plan change (the tool's).
   THE MODEL PASS (2026-11-16, mondo's wish-list models, docs/plans/WISHLIST_MODELS_ADDED.md): every model this file asked for is placed
   and its stand-in is out: `rose_bed` (the drawn flower beds, rose trees and the Glasshouse's drawn bushes), `card_soldier` (three painters,
   two guards in place of the armour stands), `iron_lamp_post` (the 22 drawn posts + hanging lanterns), `floor_runner` (the drawn carpet),
   `hedgehog` + `croquet_mallet` (the drawn balls), `wooden_ladder`, `top_hat`, `hookah`, `garden_gate`, `sundial`, `bird_bath`,
   `cheval_mirror` x 3, `peacock`, `dodo`, `leafy_bush`, `wild_flowers`, `lit_candle`, `balloons`, `string_lights`, `raven_perch`.
   STILL DRAWN (no model for them): the hedges, the topiary, the climbing roses in the hedge faces and on the arches, the arches, the
   piers, the throne's canopy, the tea tent, the gilt frame, the hoops and the peg.
   NEEDS A MODEL NOW: a topiary piece, a climbing rose / rose arch, a striped garden marquee. Notes: areas-complexes.md "CAMELOT, THE LOOKING-GLASS GARDEN".
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
const lamp = (kx, ky, dx, dz) => { const x = gc(kx) + dx * 1.9, z = gc(ky) + dz * 1.9;   // THE MODEL PASS: `iron_lamp_post` (was a drawn post + arm + `meshy_hanging_lantern`); it stands at the hedge's foot, on the kerb line
    at('iron_lamp_post', x, z, { face: dx ? (dx > 0 ? 90 : 270) : (dz > 0 ? 180 : 0), noBlock: true }); count.lanterns = (count.lanterns || 0) + 1; };
/* THE MODEL PASS: where a drawn rose tree stood (a stem, a clipped ball, buds) now stands a model: a `rose_bed` (red and white roses in a
   low bed, 2 x 1.1 m) or, on the lawns' corners, a `leafy_bush`. Decor at a hedge's foot: `noBlock`. */
let shrubN = 0; const roseTree = (x, z, col) => { at(col === 'bush' ? 'leafy_bush' : 'rose_bed', x, z, { face: (shrubN++ % 2) * 90, noBlock: true }); };
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
{ const x = gc(8) + 0.9, z = gc(22) - 0.6; sq(8, 22); at('rose_bed', gc(8) + 0.6, gx(22) + 0.66, { face: 0, noBlock: true }); at('rose_bed', gc(5) - 1.1, gc(23) + 0.2, { face: 90, noBlock: true }); at('rose_bed', gc(9) + 1.1, gc(25) + 0.4, { face: 90, noBlock: true });
  at('wooden_ladder', gc(8) - 1.25, gx(22) + 0.14, { face: 0, noBlock: true });   // THE MODEL PASS: the bed of red and white roses IS the roses being painted; the plain ladder; three card soldiers at the pots
  at('card_soldier', gc(8) - 0.5, gc(22) + 0.5, { face: 20, noBlock: true }); at('card_soldier', gc(8) + 1.1, gc(22) + 1.1, { face: 300, noBlock: true }); at('card_soldier', gc(8) - 1.2, gc(22) + 1.4, { face: 60, noBlock: true }); at('wooden_bucket', x - 0.2, z + 1.3, { face: 20 }); at('wooden_bucket', x - 1.5, z + 1.5, { face: 200 });
  for (const q of [[-0.6, 1.5, 0.2], [0.5, 1.6, 0.17]]) { P.push({ s: 'cyl', p: [r2(x + q[0]), 0, r2(z + q[1])], r: q[2], h: 0.34, seg: 10, key: TIMB, tint: 0xb89468, gain: 1.4, keyTop: MARB, tintTop: RED }); }
  P.push({ s: 'cyl', p: [r2(x - 0.1), 0.012, r2(z + 2.0)], r: 0.55, h: 0.012, seg: 9, key: MARB, tint: RED }, { s: 'cyl', p: [r2(x + 0.7), 0.012, r2(z + 2.3)], r: 0.22, h: 0.012, seg: 7, key: MARB, tint: RED }); }

/* ── THE LAWN (P00-02): croquet. The hoops, the peg, the balls, the umpire's chair (the old garden's high chair); spare pieces wait beside the board. ── */
{ put('lifeguard_chair', 1, 28, { face: 90, floor: true }); [[3, 28.5, 20], [4.6, 29.3, 80], [2.2, 29.6, 140], [9.4, 28.6, 140], [10.4, 29.4, 60], [8.6, 29.5, 10]].forEach(q => P.push({ s: 'roof', form: 'barrel', p: [gx(q[0]), 0, gx(q[1])], size: [0.06, 0.42, 0.5], ry: q[2], ends: false, ds: true, seg: 8, key: MARB, tint: WHITE, gain: 1.4, glow: 0.3 }));   // six hoops
  at('flamingo', gx(3.8), gx(28.9), { face: 200 }); at('flamingo', gx(10), gx(28.7), { face: 310 });
  const px = gx(4.1), pz = gx(29.9); for (let i = 0; i < 5; i++) P.push({ s: 'cyl', p: [px, r2(i * 0.14), pz], r: 0.045, h: 0.14, seg: 8, key: MARB, tint: [0x2060c0, RED, 0x202020, 0xf0c020, WHITE][i], gain: 1.2 });
  [[3.3, 28.9, 40], [4.9, 29.6, 200], [9.1, 29.2, 120], [10.7, 28.8, 300]].forEach(q => at('hedgehog', gx(q[0]), gx(q[1]), { face: q[2], noBlock: true }));   // THE MODEL PASS: the balls are hedgehogs (the drawn balls are out), the mallets with their own balls
  [[2.6, 29.2, 30], [5.3, 29.2, 250], [9.9, 29.6, 140]].forEach(q => at('croquet_mallet', gx(q[0]), gx(q[1]), { face: q[2], noBlock: true }));
  put('peacock', 4, 29, { face: 120, floor: true }); put('dodo', 9, 28, { face: 220, floor: true }); put('bird_bath', 5, 38, { floor: true }); at('garden_gate', gx(8) + 0.15, gx(39), { face: 90, noBlock: true });
  const kh = k => (OG.t.find(t => t.kind === k) || {}).h || 2.4;
  tree('chess_pawn_dark', kh('chess_pawn_dark'), 1, 31); tree('chess_pawn_dark', kh('chess_pawn_dark'), 1, 33); tree('chess_knight_dark', kh('chess_knight_dark'), 2, 37);
  tree('chess_pawn', kh('chess_pawn'), 11, 31); tree('chess_bishop', kh('chess_bishop'), 11, 36);
  /* the south strip: the small board on a table (the old garden's game: "Which move?" "The first one. E4."), the telescope */
  sq(3, 38); at('tulip_table', gc(3), gc(38)); at('chess_set_game', gc(3), gc(38), { floor: true, y: 0.74 }); at('teal_chair', gc(3) - 1.1, gc(38), { face: 90 }); at('teal_chair', gc(3) + 1.1, gc(38), { face: 270 });
  put('brass_telescope', 5, 39, { face: 0, floor: true }); roseTree(gc(1) - 0.9, gc(39) + 0.9, 'bush'); roseTree(gc(1) - 0.9, gc(28) - 0.9, 'bush'); roseTree(gc(11) + 0.9, gc(28) - 0.9, 'bush'); }

/* ── THE COURT (P00-03): the throne under a striped canopy, a carpet up to it, the guard ── */
{ const x = gc(8), z = gc(43), H = 3.3;
  for (const s of [-1, 1]) for (const t of [-1, 1]) { P.push({ s: 'cyl', p: [r2(x + s * 1.55), 0, r2(z + t * 1.55)], r: 0.08, h: H, seg: 8, key: GOLDK, tint: GOLD }, { s: 'dome', p: [r2(x + s * 1.55), r2(H + 0.42), r2(z + t * 1.55)], r: 0.13, h: 0.13, seg: 8, rings: 2, key: GOLDK, tint: GOLD }); }
  for (let k = 0; k < 8; k++) { const u = -1.54 + k * 0.44, c = k % 2 ? WHITE : CRIM, dr = 0.5 + (k % 2) * 0.1;   // the valance: strips of two colours, every other one longer
      for (const t of [-1, 1]) { P.push({ s: 'box', p: [r2(x + u), r2(H + 0.4 - dr), r2(z + t * 1.6)], size: [0.44, dr, 0.04], key: CLOTH, tint: c, gain: 1.6, ds: true }, { s: 'box', p: [r2(x + t * 1.6), r2(H + 0.4 - dr), r2(z + u)], size: [0.04, dr, 0.44], key: CLOTH, tint: c, gain: 1.6, ds: true }); } }
  P.push({ s: 'roof', form: 'pyramid', p: [x, r2(H + 0.4), z], size: [3.3, 1.3, 3.3], key: CLOTH, tint: CRIM, gain: 1.6, ds: true }, { s: 'cyl', p: [x, r2(H + 1.62), z], r: 0.1, r2: 0, h: 0.6, seg: 8, key: GOLDK, tint: GOLD }, { s: 'dome', p: [x, r2(H + 1.55), z], r: 0.2, h: 0.16, seg: 8, rings: 2, key: GOLDK, tint: GOLD });
  const cx = r2((gx(5) + 1.2 + gx(8) - 0.2) / 2), cl = r2(gx(8) - 0.2 - gx(5) - 1.2);   // the carpet: crimson, a gold edge
  for (let i = 0; i < 3; i++) at('floor_runner', r2(cx - cl / 2 + (i + 0.5) * cl / 3), z, { face: 0, y: 0.012, noBlock: true });   // THE MODEL PASS: three `floor_runner` end to end (was a drawn crimson strip)
  put('card_soldier', 8, 44, { face: 270, floor: true }); put('card_soldier', 9, 44, { face: 270, floor: true });   // THE MODEL PASS: the guard are card soldiers (the two code-built armour stands are out)
  put('brazier', 4, 44, { noLight: true, floor: true });
  roseTree(gc(6) - 1.15, gc(42) - 1.15, RED); }

/* ── THE MIRROR (P00-04): a gilt looking-glass frame stands before the door (the door itself is the tool's: not moved); clocks and doors that lead nowhere ── */
{ const x = gc(7), z = gc(53) + 1.95, IW = 2.15, Hc = 5.3;
  for (const s of [-1, 1]) { P.push({ s: 'box', p: [r2(x + s * (IW + 0.3)), 0, z], size: [0.6, 0.5, 0.6], key: STONEK, tint: STONE, gain: SG }, { s: 'cyl', p: [r2(x + s * (IW + 0.3)), 0.5, z], r: 0.22, h: Hc - 0.5, seg: 10, key: GOLDK, tint: GOLD },
        { s: 'box', p: [r2(x + s * (IW + 0.3)), Hc, z], size: [0.6, 0.18, 0.6], key: GOLDK, tint: GOLD }, { s: 'dome', p: [r2(x + s * (IW + 0.3)), r2(Hc + 0.18 + 0.9), z], r: 0.2, h: 0.2, seg: 8, rings: 2, key: GOLDK, tint: GOLD }, { s: 'cyl', p: [r2(x + s * (IW + 0.3)), r2(Hc + 0.18), z], r: 0.2, r2: 0.08, h: 0.9, seg: 8, key: GOLDK, tint: GOLD }); }
  P.push({ s: 'roof', form: 'barrel', p: [x, Hc + 0.18, z], size: [0.4, 1.5, 2 * IW + 0.6], ry: 90, ends: false, ds: true, seg: 12, key: GOLDK, tint: GOLD });
  for (let i = 1; i < 12; i++) { const a = Math.PI * i / 12; P.push({ s: 'dome', p: [r2(x + Math.cos(a) * (IW + 0.32)), r2(Hc + 0.2 + Math.sin(a) * 1.5), z], r: i === 6 ? 0.3 : 0.13, h: i === 6 ? 0.3 : 0.13, seg: 8, rings: 2, key: GOLDK, tint: GOLD }); }
  put('gclock', 10, 54, { face: 270, floor: true }); put('giant_hourglass', 10, 56, { face: 270, floor: true }); put('psx_door_1_loose', 4, 55, { face: 90, floor: true }); put('psx_door_2_loose', 8, 58, { face: 0, floor: true }); put('psx_door_4_loose', 8, 52, { face: 180, floor: true });
  at('pocket_watch', gc(5) + 1.5, gc(53) + 1.3, { face: 40 }); at('mushroom2', gc(8) + 0.2, gc(57) + 0.9, { face: 70 }); at('mushroom2', gc(9) + 1.3, gc(56) + 0.4, { face: 200 });
  at('chimney_smoke', gc(9) - 0.5, gc(57), { y: 4.3, rise: 3 });   // the caterpillar's smoke
  put('cheval_mirror', 4, 56, { face: 90, floor: true }); put('cheval_mirror', 10, 55, { face: 270, floor: true }); put('cheval_mirror', 8, 54, { face: 200, floor: true });   // THE MODEL PASS: three standing looking-glasses, the caterpillar's hookah
  at('hookah', gc(9) + 0.85, gc(57) + 0.5, { y: 3.3, noBlock: true }); }

/* ── THE TEA PARTY (P00-05): one long table in the east nook, under a striped tent; no two chairs alike. The old garden's own table and four
   chairs are its head (they stood in the walk: moved three squares east, onto the grass). ── */
{ const x = gc(9), z0 = gc(66), TOP = 0.96, n = 6; for (let y = 66; y < 70; y++) for (let kx = 8; kx < 11; kx++) if (!(kx === 9 && y === 69)) taken.add(kx + ':' + y);
  for (let i = 0; i < n; i++) at(i % 2 ? 'psx_table_large_2_1' : 'psx_table_large_2', x, z0 + i * 1.7, { face: 90 });   // six tables end to end, north to south
  const L = n * 1.7, zc = r2(z0 + L / 2 - 0.85);
  feat({ k: 'wall', x0: x, z0: r2(z0 - 0.85), x1: x, z1: r2(z0 + L - 0.85), t: 1.1, h: 1.0, ghost: true, rail: false });   // pass 5: the table has weight (its squares 9:66..68 are shut; the chairs' side stays walked)
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
  for (const t of [0.25, 0.5, 0.75]) { at('paper_lantern', x + (t === 0.5 ? 0 : 1.4), tz0 + t * tl, { floor: true, y: TH - 0.55, noLight: true });
      P.push({ s: 'box', p: [r2(x + (t === 0.5 ? 0 : 1.4)), r2(TH - 0.62), r2(tz0 + t * tl)], size: [0.16, 0.1, 0.16], tint: 0xffd890, glow: 1 }); }   // a lit wick under each lantern
  P.push({ s: 'box', p: [x, 0.006, r2(tz0 + tl / 2)], size: [TW - 0.6, 0.008, tl - 0.6], sides: false, key: 'grass_2', tint: 0xfff0c8, glow: 0.16 });   // the tent's own warm ground (pass 4)
  at('chimney_smoke', x, z0 - 0.3, { y: 1.75, rise: 1.4 }); at('chimney_smoke', x + 0.1, z0 + 3.7, { y: 1.75, rise: 1.4 });   // the pots steam
  /* the west nook: the seat that is tomorrow's, a music box; the cat on the hedge */
  at('wingback_chair', gc(4) + 0.4, gc(67) + 0.5, { face: 100 }); at('decor_music_box_dancer', gc(4) + 1.6, gc(68) - 0.2, { face: 40 }); at('cat', gc(4) - 0.2, gc(69) + 0.4, { floor: true, y: 2.72, face: 100 });
  /* THE MODEL PASS: the hatter's hat, candles, balloons, strings of lights along the tent's west eave, a raven by the foot of the table */
  at('top_hat', x - 0.1, z0 - 1.05, { y: 0.98, face: 20 }); at('top_hat', gc(4) + 0.4, gc(67) + 0.5, { y: 0.5, face: 100 }); at('lit_candle', x + 0.25, z0 + 2.9, { y: 0.98 }); at('lit_candle', x - 0.25, z0 + 7.9, { y: 0.98 });
  at('balloons', r2(x - TW / 2 + 0.4), r2(tz0 + 0.5), { noBlock: true }); at('balloons', r2(x + TW / 2 - 0.4), r2(tz0 + tl - 0.5), { noBlock: true, face: 120 }); at('raven_perch', x + 1.7, r2(z0 + L + 0.3), { face: 200, noBlock: true });
  for (let i = 0; i < 2; i++) at('string_lights', r2(x - TW / 2 - 0.25), r2(tz0 + 3.4 + i * 7.2), { face: 90, noBlock: true }); }   // two (three crowded the tent's front: each stands on its own thick posts)

/* ── THE HEDGES, SOUTH (P00-06): mushrooms grow out of the hedge tops; cages with nothing in them on the piers' walk ── */
[[5, 73, 'mushroom2', 2.6], [8, 75, 'mushroom', 2.5], [4, 77, 'mushroom2', 2.7], [9, 77, 'mushroom2', 2.6], [1, 73, 'mushroom', 2.5], [10, 73, 'mushroom2', 2.7], [5, 60, 'mushroom2', 2.6], [9, 61, 'mushroom', 2.5]].forEach(q => at(q[2], gc(q[0]) + 0.3, gc(q[1]) - 0.2, { floor: true, y: q[3], face: q[0] * 50 }));
at('bird_cage', gc(4) + 1.3, gc(74) - 1.2, { face: 30 }); at('stone_urn', gc(5) - 1.2, gc(75) + 1.2); at('stone_urn', gc(2) - 1.2, gc(74) - 1.2);
/* ── PASS 2: THE GLASSHOUSE (P00-03, the lawn's south-east corner, squares 9..11 x 38..39): the garden's one walk-in. Dark glass in a white
   frame on a stone course, a glass roof; inside a walk down the west side, raised beds along the east and north walls, a palm, a table. ── */
{ const GL = 'urban:GlassWindowTall1a', DARK = 0x3e5c6c, WH = 0xf2f0e8, Hh = 5.25, EV = 5.3, BASE = 0.7;   // the eaves stand at the building's own top: with lower eaves its flat lid (at Hh) cut through the glass roof
  for (let y = 38; y < 40; y++) for (let x = 9; x < 12; x++) taken.add(x + ':' + y);
  const B = ctx.building('lglass', [9, 38, 12, 40], 'W', Hh, { leafDouble: false, leaf: 'leaf_birch_glass', keyIn: STONEK, floorIn: 'cobblestone' }, (a, w, d, door) => {
      const Q = a.P, W2 = w / 2 + 0.05, D2 = d / 2 + 0.05, post = (x, z, h, t) => Q.push({ s: 'box', p: [r2(x), 0, r2(z)], size: [t || 0.14, h, t || 0.14], key: MARB, tint: WH, gain: 1.3 });
      a.shell(w, BASE, d, STONEK, STONE, door); Q.slice(-2).forEach(q => { q.gain = SG; });
      Q.push({ s: 'box', p: [0, BASE, 0], size: [2 * W2, EV - BASE, 2 * D2], top: false, faces: 'blr', key: GL, tint: DARK, glow: 0.34, win: 'keep' }, { s: 'quad', p: [0, BASE, D2], size: [2 * W2, EV - BASE], ry: 0, hole: [door.lx, door.cw, 2.2 - BASE], key: GL, tint: DARK, glow: 0.34, win: 'keep' });
      for (let x = -w / 2; x <= w / 2 + 0.01; x += 1.75) for (const sgn of [-1, 1]) { if (sgn > 0 && Math.abs(x - door.lx) < door.cw / 2 - 0.05) continue; post(x, sgn * (D2 + 0.04), EV); }   // the white frame: a post every 1.75 m
      for (let z = -d / 2 + 1.75; z < d / 2 - 0.01; z += 1.75) for (const sgn of [-1, 1]) post(sgn * (W2 + 0.04), z, EV);
      for (const sgn of [-1, 1]) { Q.push({ s: 'box', p: [0, EV - 0.14, sgn * (D2 + 0.04)], size: [2 * W2 + 0.3, 0.2, 0.18], key: MARB, tint: WH, gain: 1.3 }, { s: 'box', p: [sgn * (W2 + 0.04), EV - 0.14, 0], size: [0.18, 0.2, 2 * D2 + 0.3], key: MARB, tint: WH, gain: 1.3 },
          { s: 'box', p: [0, 2.2, sgn * (D2 + 0.04)], size: [2 * W2, 0.1, 0.12], key: MARB, tint: WH, gain: 1.3 }, { s: 'box', p: [sgn * (W2 + 0.04), 2.2, 0], size: [0.12, 0.1, 2 * D2], key: MARB, tint: WH, gain: 1.3 },
          { s: 'box', p: [0, 3.75, sgn * (D2 + 0.04)], size: [2 * W2, 0.1, 0.12], key: MARB, tint: WH, gain: 1.3 }, { s: 'box', p: [sgn * (W2 + 0.04), 3.75, 0], size: [0.12, 0.1, 2 * D2], key: MARB, tint: WH, gain: 1.3 }); }
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
  const RX = W2 - E - 0.6, BZ = -D2 + E + 0.6; bed(RX, 0.6, 1.1, d - 2 * E - 1.4); bed(-0.75, BZ, w - 2 * E - 1.6, 1.1);
  const inn = (key, x, z, o) => ctx.inside(B, key, r2(x), r2(z), Object.assign({ floor: true }, o || {}));
  [[-1.6, 0], [0.2, 80], [2.0, 160], [3.6, 250]].forEach(q => inn('wild_flowers', RX, q[0], { y: 0.45, face: q[1] })); inn('wild_flowers', -1.9, BZ, { y: 0.45 }); inn('wild_flowers', 0.4, BZ, { y: 0.45, face: 130 });   // THE MODEL PASS: `wild_flowers` in the beds (the drawn rose bushes are out)
  inn('fern', RX, -2.6, { y: 0.45, face: 40 }); inn('woods_healflower', RX - 0.1, -0.7, { y: 0.45 }); inn('fern', RX, 1.1, { y: 0.45, face: 200 }); inn('woods_healflower', RX, 2.9, { y: 0.45, face: 90 }); inn('potted_plant', RX, 4.3, { y: 0.45, face: 120 });
  inn('fern', -0.8, BZ, { y: 0.45, face: 300 }); inn('psx_potted_cactus_mp_1', -2.6, BZ, { y: 0.46 }); inn('palm_tree', 1.75, -3.5, { face: 60 });   // the palm on its square's middle; the table on the next
  inn('psx_dinner_table_1', 1.75, 0, { face: 90 }); for (const lz of [-3.5, 0]) { const p0 = B.at(1.75 - 0.6, lz), p1 = B.at(1.75 + 0.6, lz); feat({ k: 'wall', x0: p0[0], z0: p0[1], x1: p1[0], z1: p1[1], t: 1.2, h: 1.0, ghost: true, rail: false }); }   // pass 5: the palm and the table have weight
  const on = (key, x, z, o) => inn(key, 1.75 + x, z, Object.assign({ y: 0.88 }, o || {}));
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
/* ── PASS 3: THE DRESSING. Flower beds along the lawns' and the nooks' hedge feet (on the grass's edge, never in a walk), butterflies and bees
   at the roses, busts at the mirror, presents and music at the tea party, glowing caps along the south walks, crows on the piers; the natives
   whose home this is (no lines: none are written for them). ── */
{ const FL = [RED, WHITE, PINK, 0xf2c830, 0x8a3cd0];   // (a pale blue flower read as a grey pebble: violet)
  /* THE MODEL PASS: a bed is a row of `rose_bed` models along the line (x0, z0)-(x1, z1), one every 3.6 m (was soil, a clipped edge and three
     rows of drawn flowers); `wild_flowers` between two beds. Decor at the hedge's foot, on the grass's edge: `noBlock`. */
  const flowerBed = (x0, z0, x1, z1, seed) => { const ns = Math.abs(z1 - z0) > Math.abs(x1 - x0), L = ns ? Math.abs(z1 - z0) : Math.abs(x1 - x0), n = Math.max(1, Math.floor(L / 3.6)), st = L / n;
      for (let i = 0; i < n; i++) { const t = -L / 2 + st * (i + 0.5), cx = (x0 + x1) / 2, cz = (z0 + z1) / 2; at('rose_bed', ns ? cx : cx + t, ns ? cz + t : cz, { face: ns ? 90 : 0, noBlock: true });
          if (i && (i + seed) % 2 === 0) at('wild_flowers', ns ? cx : cx + t - st / 2, ns ? cz + t - st / 2 : cz, { face: i * 70, noBlock: true }); }
      count.beds = (count.beds || 0) + 1; };
  const E = 0.62;   // a bed's middle line off the hedge's foot (the model is 1.1 m deep)
  flowerBed(gx(1) + 0.3, gx(28) + E, gx(6) - 0.3, gx(28) + E, 0); flowerBed(gx(8) + 0.3, gx(28) + E, gx(12) - 0.3, gx(28) + E, 1);   // the lawn's north edge
  flowerBed(gx(1) + 0.3, gx(40) - E, gx(6) - 0.3, gx(40) - E, 2);                                                                     // its south edge, west of the walk
  flowerBed(gx(1) + E, gx(29) + 0.6, gx(1) + E, gx(39) - 0.6, 3);                                                                     // its west edge
  flowerBed(gx(11) - E, gx(66) + 0.3, gx(11) - E, gx(70) - 0.3, 4); flowerBed(gx(4) + E, gx(67) + 0.2, gx(4) + E, gx(69) - 0.2, 1);   // the tea party's two nooks
  flowerBed(gx(8) + 0.3, gx(26) - E, gx(10) - 0.3, gx(26) - E, 2); flowerBed(gx(10) - E, gx(23) + 0.2, gx(10) - E, gx(25) + 0.2, 0);   // the painters' nook
  /* stepping stones from the walk to the Glasshouse's door */
  [[8.15, 38.35, 20], [8.5, 38.75, 70], [8.85, 38.4, 130], [8.3, 39.3, 200], [8.75, 39.55, 300]].forEach((q, i) => at(i % 2 ? 'psxg_stepping_stone_2' : 'psxg_stepping_stone_1', gx(q[0]), gx(q[1]), { face: q[2] }));
  /* what flies and crawls at the roses */
  [['butterfly', 8.6, 22.6, 1.5], ['bumblebee', 8.9, 21.8, 1.9], ['swallowtail', 2.4, 28.5, 1.0], ['blue_morpho', 10.2, 28.6, 1.3], ['monarch', 6.3, 41.6, 1.9],
   ['blue_morpho', 5.4, 54.8, 1.7], ['luna_moth', 9.6, 56.4, 2.4], ['butterfly', 10.4, 67.2, 1.3], ['swallowtail', 4.6, 67.6, 1.2], ['monarch', 6.6, 74.4, 1.5]]   // (pass 5: ten, were sixteen: every prop is a draw call)
      .forEach((q, i) => at(q[0], gx(q[1]), gx(q[2]), { y: q[3], face: i * 67 }));
  at('ladybug', gx(8.92), gx(22.33), { y: 2.75, face: 10 }); at('caterpillar_bug', gc(8) + 0.2, gc(57) + 0.9, { y: 1.72, face: 40 }); at('chrysalis', gc(9) + 1.3, gc(56) + 0.4, { y: 1.3, face: 0 });
  [[6, 17], [8, 40], [4, 46], [8, 59], [6, 71], [4, 75]].forEach((q, i) => at('crow', gx(q[0]) + (q[0] % 2 ? 0.33 : -0.33), gc(q[1]), { y: 3.86, face: i * 80 + 30 }));   // on the piers' balls
  /* the painters left their cards by the pots (the game's own cards) */
  at('tarot', gc(8) + 1.4, gc(22) + 1.3, { y: 0.02, face: 30 }); at('tarot2', gc(8) + 0.3, gc(22) + 1.5, { y: 0.02, face: 110 }); at('tarotDeck', gc(8) - 0.3, gc(22) + 0.5, { y: 0.02, face: 200 });
  /* THE COURT: candelabra at the canopy's front posts, urns in the corners, a sword and a shield by the guard */
  at('candelabra', gc(8) - 2.0, gc(43) - 1.25, { face: 0 }); at('candelabra', gc(8) - 2.0, gc(43) + 1.25, { face: 0 }); at('stone_urn', gc(9) + 1.1, gc(44) + 1.1); at('stone_urn', gc(4) - 1.1, gc(44) + 1.15); at('stone_urn', gc(8) + 1.1, gc(42) - 1.15);
  at('sword', gc(9) + 0.9, gc(44) - 0.5, { face: 200 }); at('spell_shield', gc(8) - 0.9, gc(44) + 1.0, { face: 250 });
  /* THE MIRROR: a bust on a plinth either side of the frame, a hand mirror and a frog on the fountain's rim, keys before the door */
  for (const kx of [5, 9]) { sq(kx, 54); P.push({ s: 'box', p: [gc(kx), 0, gc(54)], size: [0.8, 0.12, 0.8], key: STONEK, tint: STONE, gain: SG }, { s: 'box', p: [gc(kx), 0.12, gc(54)], size: [0.62, 0.9, 0.62], key: MARB, tint: WHITE, gain: 1.15 }, { s: 'box', p: [gc(kx), 1.02, gc(54)], size: [0.8, 0.1, 0.8], key: STONEK, tint: 0xe4dfd4, gain: SG });
      at('marble_bust', gc(kx), gc(54), { y: 1.12, face: 180 }); feat({ k: 'wall', x0: gc(kx) - 0.4, z0: gc(54), x1: gc(kx) + 0.4, z1: gc(54), t: 0.8, h: 1.2, ghost: true, rail: false }); }
  at('item_hand_mirror', gc(5) + 1.25, gc(53) + 0.95, { y: 0.62, face: 60 }); at('meshy_frog', gc(5) - 1.1, gc(53) + 1.2, { y: 0.62, face: 140 }); at('key', gc(7) + 0.6, gc(54) + 0.9, { y: 0.02, face: 40 }); at('house_key', gc(7) - 0.9, gc(55) - 0.4, { y: 0.02, face: 300 });
  at('psx_photo_frame_mp_1', gc(4) + 1.2, gc(55) + 1.1, { y: 0.02, face: 120 }); at('item_potion_flask', gc(8) + 1.0, gc(58) - 0.9, { y: 0.02, face: 0 });
  /* THE TEA PARTY: presents at the tent's foot, music left on the grass, cups down the table, a deck of cards */
  [['xmas_gift', 8.25, 70.2], ['xmas_gift_2', 8.5, 70.55], ['xmas_gift_3', 8.2, 70.75], ['xmas_gift_4', 8.62, 70.25], ['xmas_gift_3', 10.6, 65.6], ['xmas_gift', 10.3, 65.4]].forEach((q, i) => at(q[0], gx(q[1]), gx(q[2]), { face: i * 55 }));
  at('instrument_violin_lying', gc(5) + 0.9, gc(68) + 1.2, { face: 40 }); at('instrument_tambourine', gc(5) + 1.3, gc(67) - 0.2, { face: 0 }); at('instrument_guitar_lying', gc(10) + 1.0, gc(69) + 1.0, { face: 120 });
  { const x = gc(9), z0 = gc(66) - 0.6; for (let i = 0; i < 5; i++) at(i % 3 ? 'item_drinking_cup' : 'coffee_mug', x + (i % 2 ? 0.36 : -0.36), z0 + 0.9 + i * 1.9, { y: 0.98, face: i * 40 });
    at('tarotDeck', x - 0.2, z0 + 3.9, { y: 0.98 }); at('xmas_champagne', x + 0.1, z0 + 7.25, { y: 0.98 }); at('psx_book_mp_1', x - 0.3, z0 + 1.0, { y: 0.98, face: 20 }); }
  /* THE HEDGES, SOUTH: glowing caps at the kerbs (the walk's own small lights), a frog */
  [[6.12, 72.4], [7.88, 73.6], [6.1, 76.3], [7.9, 77.5], [2.12, 71.2], [3.88, 72.7], [4.4, 73.92], [5.3, 76.08], [2.1, 66.4], [7.9, 62.3]].forEach((q, i) => at('woods_glowcap', gx(q[0]), gx(q[1]), { face: i * 47, noLight: true }));
  at('meshy_frog', gx(6.2), gx(75.7), { y: 0.02, face: 200 }); put('sundial', 5, 75, { floor: true }, 'm');   // THE MODEL PASS: the sundial on the south crossing
  /* THE NATIVES whose home this is (no lines: none are written for them) */
  native('chess piece', 2, 31, 90); native('chess piece', 11, 34, 270); native('rabbit', 10, 29, 240); native('dreameater', 8, 55, 250); native('mushroom girl', 8, 56, 60); }
arch.push({ k: 'arch', id: 'cam:l:garden', x: 0, z: 0, rot: 0, y: 0, parts: P }); flushArch();
}
/* THE AIR (pass 4; the tool's hook, bake-camelot.js `airZones`): rose petals on the wind over the whole garden; fireflies in the mirror's
   court, at the tea party and along the south walks; spores over the caterpillar's mushrooms. The kingdom's embers stay over the whole room. */
const airZones = () => [
    { x0: 0, y0: 17, x1: 12, y1: 79, kind: 'motes', color: 0xffb8d4, n: 180 },
    { x0: 4, y0: 52, x1: 11, y1: 59, kind: 'fireflies', color: 0xfff0a0, n: 32 },
    { x0: 8, y0: 55, x1: 11, y1: 59, kind: 'spores', color: 0xe8ffc8, n: 36 },
    { x0: 4, y0: 65, x1: 11, y1: 71, kind: 'fireflies', color: 0xffd890, n: 36 },
    { x0: 1, y0: 71, x1: 9, y1: 78, kind: 'fireflies', color: 0xb8ffc0, n: 44 },
    { x0: 5, y0: 22, x1: 10, y1: 26, kind: 'fireflies', color: 0xffe8c0, n: 16 },
];
module.exports = { build, airZones };
