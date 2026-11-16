/* CAMELOT KINGDOM · THE SNOWY PINES (district N, 8 plots) — the north woods: snow, pines, the sleigh road.
   Repo tooling only: bake-camelot.js calls `build(ctx)` after the shared pieces stand.

   THE PLOTS: P00-00 Snowy pines, north-west · P01-00 The Snowy Pines, west · P02-00 The Snowfield, west · P03-00 The Sleigh Road ·
   P04-00 The Snowfield · P05-00 The Snowfield, east · P06-00 The Snowy Pines, east · P07-00 Snowy pines, north-east (squares x 0..96,
   y 0..12). The snow runs on south to the moat's north bank (the zone is y 0..17), over the top of the village's north plots: that
   strip is dressed here too (the campfire and the yeti at 30..31, 12..13 stand on it).

   WHAT STANDS HERE TODAY: the sleigh on the Sleigh Road, three snowmen, two campfires, a yeti with the old North Pole's lines, two
   stumps, a signpost. The pines are the tool's (the plan's solid squares, grown as snow pines by `gen.zones`); the snow is the paint.

   NOT HERE (the tool's, shared): the sleigh road's way out (link `northpole_camelot`, north wall at square 48, to the North Pole's own
   room over the mountains) and the north bridge. The North Pole is NOT a district of this room any more (plan 3).

   MISSING / WAITING: nothing is waiting on mondo. Thin: eight plots hold ten pieces. No snow sheet exists (the ground wears the ice
   sheets); no falling snow or cold light of its own. Not seen on screen since plan 3.

   THE HOOKS (bake-camelot.js "THE DISTRICT FILES" lists the whole ctx): squares are the kingdom's (kx, ky), 0..96, a plot = 12 x 12 of them,
   plot Pxx-yy = squares xx*12.. , yy*12.. . gx(k) = a square's west / north edge in metres, gc(k) = its middle. feat(row) writes a terrain row,
   note(text) a heading. put(key, x, y, o, on) stands a catalogue prop on a square's middle; dec(...) the same, scattered and turned by the
   dice; tree(kind, h, x, y, r); native(race, x, y, face, say). They take FREE ground only (grass, snow, marble; `on` names another plan
   letter) and never one square twice: the tool stops and names the square. sheet() = a parts list (box, cyl, roof, shell, crown, tower, banner);
   building(id, [x0, y0, x1, y1], side, h, o, parts) = a texbuilding + its drawn look, returns its frame; inside(B, key, lx, lz, o) = furniture
   in that frame; flushArch() writes the looks made so far.
   ctx.old.pole = the old North Pole village room's natives and lines; sayOf(ctx.old.pole, race) = that native's lines.
   The heading row below names The Forest too (one heading for both in the baked room): keep it, W.js writes none.
   RULES (docs/notes/areas-complexes.md "CAMELOT, THE DISTRICT FILES"): one thread = this one file. Not yours: bake-camelot.js, layout.json,
   the other district files, the hill, the town wall, the moat, the roads, the doors out of the zone, the room's sky and shell (a note on
   the board first: docs/notes/claims.md). After any edit: `node bake-camelot.js`, `node --check data.js`, commit the file AND data.js. */
'use strict';
function build(ctx) {
const { note, put, dec, native, sayOf } = ctx, ONP = ctx.old.pole;
note('THE SNOWY PINES + THE FOREST');
put('sleigh', 50, 6, { face: 0 }); put('xmas_snowman', 45, 5); put('signpost', 46, 8); put('campfire', 30, 12); native('yeti', 31, 13, 120, sayOf(ONP, 'yeti')); put('xmas_snowman_2', 68, 12);
put('campfire', 6, 7); dec('stump', 5, 6); dec('stump', 89, 6); put('xmas_snowman_3', 90, 7);
}
module.exports = { build };
