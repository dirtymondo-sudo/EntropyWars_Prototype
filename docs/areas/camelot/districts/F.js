/* CAMELOT KINGDOM · THE FAIRY FOREST (district F, 6 plots) — the east woods: the forest that glows.
   Repo tooling only: bake-camelot.js calls `build(ctx)` after the shared pieces stand.

   THE PLOTS: P07-01 The Knoll, north · P07-02 The Pond · P07-03 The Fairy Ring · P07-04 The Woods Trail · P07-05 The Spring ·
   P07-06 The Knoll, south (squares x 84..96, y 12..84; the forest's zone runs from the moat's east bank, x 82..96).

   WHAT STANDS HERE TODAY: the pond with its deck; four butterflies; THE RING (twelve toadstools, a harp, a fairy); the spring (a small
   pool, ferns); a row of fae mushrooms, toadstools, a luna moth; a knoll north (a stump) and a knoll south (a fallen log, a rabbit);
   two signposts. The trees are the tool's (the plan's solid squares, grown as fae caps and trees by `gen.zones`).

   NOT HERE (the tool's, shared): the trail east to The Woods (link `woods_camelot`, on the east wall at square 48, plot P07-04) and
   the east bridge. Dress round them, do not move them.

   MISSING / WAITING: nothing is waiting on mondo. Thin: six plots hold about thirty pieces; no lights or particles of its own (the
   Woods' life pass gave its districts per-district looks; nothing like it here); the fairy has no lines. Not seen on screen since plan 3.

   THE HOOKS (bake-camelot.js "THE DISTRICT FILES" lists the whole ctx): squares are the kingdom's (kx, ky), 0..96, a plot = 12 x 12 of them,
   plot Pxx-yy = squares xx*12.. , yy*12.. . gx(k) = a square's west / north edge in metres, gc(k) = its middle. feat(row) writes a terrain row,
   note(text) a heading. put(key, x, y, o, on) stands a catalogue prop on a square's middle; dec(...) the same, scattered and turned by the
   dice; tree(kind, h, x, y, r); native(race, x, y, face, say). They take FREE ground only (grass, snow, marble; `on` names another plan
   letter) and never one square twice: the tool stops and names the square. sheet() = a parts list (box, cyl, roof, shell, crown, tower, banner);
   building(id, [x0, y0, x1, y1], side, h, o, parts) = a texbuilding + its drawn look, returns its frame; inside(B, key, lx, lz, o) = furniture
   in that frame; flushArch() writes the looks made so far.
   A pool or a ring that covers squares the plan leaves open must take them by hand (taken.add('x:y'), as below), or the dressing of a
   later pass may stand in it.
   RULES (docs/notes/areas-complexes.md "CAMELOT, THE DISTRICT FILES"): one thread = this one file. Not yours: bake-camelot.js, layout.json,
   the other district files, the hill, the town wall, the moat, the roads, the doors out of the zone, the room's sky and shell (a note on
   the board first: docs/notes/claims.md). After any edit: `node bake-camelot.js`, `node --check data.js`, commit the file AND data.js. */
'use strict';
function build(ctx) {
const { r2, gx, gc, feat, note, props, npc, taken, put, dec, many } = ctx;
note('THE FAIRY FOREST: the pond, the ring, the spring, the knolls');
feat({ k: 'pool', x: gx(92), z: gx(30.5), r: 5.6, rz: 6.4, y: -0.3, depth: 0.9, key: 'water', bank: 1.2 });
feat({ k: 'deck', x0: gx(90), z0: gx(30.5), x1: gx(92), z1: gx(30.5), w: 7, y: 0.3 });
for (let y = 28; y < 33; y++) for (let x = 90; x < 94; x++) taken.add(x + ':' + y);
dec('butterfly', 87, 27, { floor: true, y: 1.2 }); dec('blue_morpho', 93, 26, { floor: true, y: 1.5 }); dec('swallowtail', 87, 34, { floor: true, y: 1.1 }); dec('monarch', 93, 34, { floor: true, y: 1.4 });
{ const x = gx(92), z = gx(43); many(12, i => { const q = i * Math.PI / 6; props.push({ key: 'fae_toadstool', x: r2(x + Math.cos(q) * 5.6), z: r2(z + Math.sin(q) * 5.6), face: i * 30 }); });   // THE RING
  for (let y = 40; y < 46; y++) for (let x2 = 89; x2 < 95; x2++) taken.add(x2 + ':' + y); props.push({ key: 'instrument_harp', x: r2(x + 0.6), z: r2(z - 0.5), face: 200 }); npc.push({ x: r2(x + 1.75), z: r2(z + 1.75), face: 220, race: 'fairy' }); }
feat({ k: 'pool', x: gc(91), z: gc(62), r: 3.2, y: -0.25, depth: 0.7, key: 'water', bank: 0.8 }); taken.add('91:62'); dec('fern', 92, 60); dec('fern', 90, 64); dec('fern', 92, 64);
many(3, i => put('fae_mushroom', 91 + (i % 2), 54 + i)); dec('fae_toadstool', 90, 54); dec('fae_toadstool', 90, 56); dec('luna_moth', 93, 55, { floor: true, y: 1.3 });
feat({ k: 'hill', x: gc(91), z: gc(22), r: 4.6, h: 1.3 }); dec('stump', 90, 21); feat({ k: 'hill', x: gc(91), z: gc(72), r: 4.6, h: 1.3 }); dec('fallen_log', 90, 73); dec('rabbit', 91, 71);
put('signpost', 87, 46); put('signpost', 91, 50);
}
module.exports = { build };
