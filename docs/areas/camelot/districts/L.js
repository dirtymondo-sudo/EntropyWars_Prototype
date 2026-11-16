/* CAMELOT KINGDOM · THE LOOKING-GLASS GARDEN (district L, 6 plots) — the west woods: a hedge garden.
   Repo tooling only: bake-camelot.js calls `build(ctx)` after the shared pieces stand.

   THE PLOTS: P00-01 The Hedges, north · P00-02 The Lawn · P00-03 The Chessboard · P00-04 The Mirror · P00-05 The Tea Party ·
   P00-06 The Hedges, south (squares x 0..12, y 12..84; the garden's zone runs to the moat's west bank, x 0..14).

   WHAT STANDS HERE TODAY: the hedges (the plan's letter `h`: solid by the plan, DRAWN here, a box a run, one look a plot); the chessboard
   (8 x 8 on 3.5 m squares) with the old garden's own pieces in their old position; the flamingos and the croquet ring; the pocket watch
   and the rabbit; the two courts (the chess kings and queens, the throne, the Ice Queen); the caterpillar on his mushroom, toadstools, a
   fountain, an angel; the tea party (table, four chairs, teapot, cups); four natives with the old garden's lines (gnome, ice queen,
   fairy, catgirl); benches and a signpost.

   NOT HERE (the tool's, shared): THE MIRROR's door on P00-04 (square 7, 53: a way out of the zone, to the Looking-Glass waiting room;
   the tool keeps its square clear), the gap in the west hedge to the old garden (`oldgarden`), the dead tree's hole (`deadtree`, on the
   south wall: W's plot P00-07). Dress round them, do not move or retarget them.

   MISSING / WAITING: nothing is waiting on mondo. The garden is the old room's content laid on the plan: no new set piece was designed
   for it, the plots The Hedges north / south are hedge and grass only, and it has not been seen on screen since plan 3.

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
const { PLAN, C, N, W, r2, gx, gc, cell, count, feat, note, sheet, props, sq, put, dec, tree, native, sayOf } = ctx, OG = ctx.old.garden;
note('THE LOOKING-GLASS GARDEN: the hedges (drawn here: the solid is the plan\'s), the chessboard, the marble court, the mirror, the tea party');
{ const used = new Uint8Array(W * W);   // the hedges: a box a run, a parts list a plot
  PLAN.plots.forEach(p => { const a = sheet(), px = gx(p.x * N + N / 2), pz = gx(p.y * N + N / 2);
      for (let y = p.y * N; y < p.y * N + N; y++) for (let x = p.x * N; x < p.x * N + N; x++) { if (cell[y][x] !== 'h' || used[y * W + x]) continue;
          let w = 1; while (x + w < p.x * N + N && cell[y][x + w] === 'h' && !used[y * W + x + w]) w++;
          let h = 1; rows: while (y + h < p.y * N + N) { for (let i = 0; i < w; i++) if (cell[y + h][x + i] !== 'h' || used[(y + h) * W + x + i]) break rows; h++; }
          for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) used[(y + j) * W + x + i] = 1;
          a.box(r2(gx(x) + w * C / 2 - px), 0, r2(gx(y) + h * C / 2 - pz), w * C, 2.6 + ((x + y) % 3) * 0.15, h * C, 'leaves_3', 0x6c9a58); count.hedges = (count.hedges || 0) + 1; }
      if (a.P.length) feat({ k: 'arch', id: 'cam:hedge:' + p.id, x: px, z: pz, rot: 0, parts: a.P }); }); }
{ const bx = gx(7), bz = gx(34);   // THE CHESSBOARD: the old garden's own board and its position
  feat({ k: 'board', x: bx, z: bz, n: 8, cell: 3.5, keys: ['marble_light', 'marble'], colors: [15920870, 2894392], clear: 0 });
  OG.t.forEach(t => { if (t.h) return; const o = Object.assign({}, t, { x: r2(t.x + bx), z: r2(t.z - 17.5 + bz) }); delete o.chessPos; feat(o); }); }
[[5, 23], [8, 23], [9, 23], [8, 25], [9, 25]].forEach(q => dec('flamingo', q[0], q[1])); dec('garden_ring', 9, 24); native('gnome', 5, 24, 90, sayOf(OG, 'gnome'));
dec('pocket_watch', 2, 29); dec('rabbit', 11, 29); put('park_bench', 11, 33, { face: 270 }); put('iron_garden_bench', 1, 35, { face: 90 });
tree('chess_king_dark', 3.4, 9, 42); tree('chess_queen_dark', 3.1, 9, 43); tree('chess_king', 3.4, 5, 43); tree('chess_queen', 3.1, 5, 44);
put('royal_throne', 8, 43, { face: 270 }); native('ice queen', 8, 42, 270, sayOf(OG, 'ice queen'));
{ put('mushroom', 9, 57); props.push({ key: 'caterpillar', x: gc(9), z: gc(57), floor: true, y: 3.3, face: 270 }); dec('fae_toadstool', 5, 57); dec('fae_toadstool', 9, 53); put('fountain', 5, 53); put('angel_statue', 9, 55, { face: 270 }); }
{ sq(7, 68); const x = gc(7), z = gc(68); props.push({ key: 'tulip_table', x, z }); for (const d of [[1.1, 0, 270], [-1.1, 0, 90], [0, 1.1, 0], [0, -1.1, 180]]) props.push({ key: 'teal_chair', x: r2(x + d[0]), z: r2(z + d[1]), face: d[2] });
  props.push({ key: 'teapot', x, z, floor: true, y: 0.74 }); props.push({ key: 'teacups', x: r2(x + 0.3), z: r2(z + 0.25), floor: true, y: 0.74 }); }
native('fairy', 9, 69, 300, sayOf(OG, 'fairy')); native('catgirl', 5, 69, 60, sayOf(OG, 'catgirl')); put('signpost', 8, 45);
}
module.exports = { build };
