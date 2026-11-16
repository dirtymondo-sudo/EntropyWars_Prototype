/* CAMELOT KINGDOM · THE FOREST (district W, 8 plots) — the south woods: the forest and the road from DOOR HQ.
   Repo tooling only: bake-camelot.js calls `build(ctx)` after the shared pieces stand (last of the districts).

   THE PLOTS: P00-07 The Dead Tree's Hole · P01-07 The Forest Road, west · P02-07 The Glade, west · P03-07 The Crown's Road ·
   P04-07 The Forest Road · P05-07 The Glade, east · P06-07 The Forest Road, east · P07-07 Deep forest, south-east (squares x 0..96,
   y 84..96). The forest runs on north to the moat's south bank, over the bottom of the village's south plots: dressed here too.

   WHAT STANDS HERE TODAY: a knoll in each glade (fallen logs, a stump, a campfire in the east one), a rabbit, stumps and ferns along
   the road, one big tree by the dead tree's hole. The trees are the tool's (the plan's solid squares).

   NOT HERE (the tool's, shared): the way in from DOOR HQ on P03-07 (the portcullis bay at square 43, 93: the room's spawn, its two
   braziers and its signpost), the Crown's Road to the Drawbridge, the dead tree's hole on P00-07 (`deadtree`, a secret way to The
   Woods). Dress round them, do not move them: the arrival is the first thing a player sees of the kingdom.

   MISSING / WAITING: nothing is waiting on mondo. Thin: eight plots hold about a dozen pieces; the road from the bay to the Drawbridge
   has no dressing of its own (no milestones, carts, lamps, people). Not seen on screen since plan 3.

   THE HOOKS (bake-camelot.js "THE DISTRICT FILES" lists the whole ctx): squares are the kingdom's (kx, ky), 0..96, a plot = 12 x 12 of them,
   plot Pxx-yy = squares xx*12.. , yy*12.. . gx(k) = a square's west / north edge in metres, gc(k) = its middle. feat(row) writes a terrain row,
   note(text) a heading. put(key, x, y, o, on) stands a catalogue prop on a square's middle; dec(...) the same, scattered and turned by the
   dice; tree(kind, h, x, y, r); native(race, x, y, face, say). They take FREE ground only (grass, snow, marble; `on` names another plan
   letter) and never one square twice: the tool stops and names the square. sheet() = a parts list (box, cyl, roof, shell, crown, tower);
   building(id, [x0, y0, x1, y1], side, h, o, parts) = a texbuilding + its drawn look, returns its frame; inside(B, key, lx, lz, o) = furniture
   in that frame; flushArch() writes the looks made so far.
   The heading row for this district is written by N.js ('THE SNOWY PINES + THE FOREST', one heading for both in the baked room).
   RULES (docs/notes/areas-complexes.md "CAMELOT, THE DISTRICT FILES"): one thread = this one file. Not yours: bake-camelot.js, layout.json,
   the other district files, the hill, the town wall, the moat, the roads, the doors out of the zone, the room's sky and shell (a note on
   the board first: docs/notes/claims.md). After any edit: `node bake-camelot.js`, `node --check data.js`, commit the file AND data.js. */
'use strict';
function build(ctx) {
const { r2, gc, feat, put, dec, tree } = ctx;
feat({ k: 'hill', x: gc(22), z: gc(91), r: 4.6, h: 1.2 }); dec('fallen_log', 21, 90); dec('stump', 24, 90); feat({ k: 'hill', x: gc(66), z: gc(91), r: 4.6, h: 1.2 }); dec('fallen_log', 67, 90); put('campfire', 64, 90);
dec('rabbit', 45, 85); dec('stump', 40, 86); dec('fern', 45, 89); dec('fern', 90, 90); dec('stump', 88, 90);
tree('tree_5', 6.5, 9, 90, 0.9);
}
module.exports = { build };
