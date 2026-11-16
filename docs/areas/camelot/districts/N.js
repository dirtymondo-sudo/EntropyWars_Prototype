/* CAMELOT KINGDOM · THE SNOWY PINES (district N, 8 plots) — the north woods: snow, pines, the sleigh road.
   Repo tooling only: bake-camelot.js calls `build(ctx)` after the shared pieces stand.

   THE PLOTS: P00-00 Snowy pines, north-west · P01-00 The Snowy Pines, west · P02-00 The Snowfield, west · P03-00 The Sleigh Road ·
   P04-00 The Snowfield · P05-00 The Snowfield, east · P06-00 The Snowy Pines, east · P07-00 Snowy pines, north-east (squares x 0..96,
   y 0..12). The snow runs on south to the moat's north bank (the zone is y 0..17), over the top of the village's north plots: that
   strip is dressed here too (the campfire and the yeti at 30..31, 12..13 stand on it).

   WHAT STANDS HERE TODAY (passes 1 to 4 of 5, 2026-11-16; the drawn rows are `cam:n:<name>`):
   THE RIDGE: snow-capped crags along the north edge and round both ends (three ranks: on the pines' own squares, in the kingdom's treeline
   past the room's edge, the peaks behind); THE PASS = the cleft the sleigh road leaves through (two rock walls 24 m long round the trail).
   THE SLEIGH STOP (the road's clearing): the sleigh and a horse west of the road, THE WAYSIDE HUT (walked into, squares 50..52 x 4..6, its
   door to the road) with a hitching rail and a second horse, a snowman, the signpost.
   THE WOODCUTTER'S CAMP (north-west clearing): THE CABIN (walked into, squares 4..6 x 6..8, its door east), the fire, a stump.
   THE FROZEN POND (north-east clearing): ice you walk on (a drawn sheet, squares 88..91 x 5..8), snow banked round it, a snowman, a stump.
   THE YETI'S CAVE (the glade south of the track, squares 32..34 x 11..13, a ghost wall): a rock den open to the west, bones, the yeti, its fire.
   THE OLD STONES (the other glade): four sarsens, two menhirs and a trilithon round a flat stone on a low knoll; a snowman by the track.
   The pines are the tool's (the plan's solid squares, grown as snow pines by `gen.zones`); the snow is the paint (the calm snow sheet).
   A SNOW PINE IS A CLUMP of trunks metres wide: `noTrees` (below) keeps the mass off the huts, the den and the pond.

   NOT HERE (the tool's, shared): the sleigh road's way out (link `northpole_camelot`, north wall at square 48, to the North Pole's own
   room over the mountains) and the north bridge. The way out is a TRAIL: the walker follows it 10 m past the room's edge, between two rows
   of saplings the engine plants (summer green: the room's treeline kinds). The Pass is built round that trail; never shut it at the wall.

   THE HUTS' INSIDES (pass 2): each is 2 x 2 squares; the hearth (stone, a real fire) and a bed stand on the two back squares with ghost walls,
   the rest is decor: a hanging lantern, a rug, the mantel; the Wayside Hut has a stool, a dog, stockings, a wreath, a plate shelf, sacks, a
   spear; the Cabin a rocking chair, the pot on the fire, a tool shelf (saw, rope, nails), split logs, a bear trap, sacks.

   THE DRESSING (pass 3, one drawn row `cam:n:dress`): fourteen lantern posts on the road's and the track's verges, drifts and snow-capped
   rocks, the sleigh's runner tracks, log stacks, the woodcutter's sawhorse and stumps, a covered wagon, straw, the sleigh's load, a fishing
   hole in the pond's ice, dead trees and bushes, bones and bats at the den, candles on the old stones' flat stone, a fence down to the north
   bridge, wolves, rabbits, crows, an eagle; residents with no lines of their own: the ice queen (pond), krampus (stones), bigfoot (west nook).
   THE BELT WALL (in `cam:n:ridge`): a 10 m block of rock in the kingdom's treeline belt, behind the front crags, so no summer green shows.

   THE ATMOSPHERE (pass 4): `airZones` (snow over the whole district, pale ice dust at the pond and the stones), smoke off both chimneys and
   two camp fires, a pool of warm light on the snow under every lantern and window (drawn, `glow`: it shows in the dark).

   MISSING / WAITING: nothing is waiting on mondo. STILL TO DO: polish (pass 5).
   Notes + the FITS THIS DISTRICT list: areas-complexes.md "CAMELOT, THE SNOWY PINES".
   NEVER more `dec()` calls than the two below (the kingdom's one stream of dice: The Forest's scatter would move): use `at()` and `rn()`.

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
/* THE DISTRICT'S OWN DICE (never ctx.rnd / more `dec` calls: the kingdom's one stream would move The Forest's scatter) */
let _sd = 9731; const rn = () => { _sd = (_sd * 1664525 + 1013904223) >>> 0; return _sd / 4294967296; }, rr = (a, b) => a + (b - a) * rn();
const ROCK = 'rocks_5', RG = 1.7, SNOW = 'calm_snow', SG = 1.35, LOG = 'wood', PLANK = 'wood_planks', LOGT = 0x94704c, LOGD = 0x6e5038, WARM = 0xffc070;
function build(ctx) {
const { r2, gx, gc, feat, note, props, taken, put, dec, native, sayOf, arch, flushArch } = ctx, ONP = ctx.old.pole;
const at = (key, x, z, o) => props.push(Object.assign({ key, x: r2(x), z: r2(z) }, o || {}));   // a piece by metres, no dice of the kingdom's
const take = (x0, y0, x1, y1) => { for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) taken.add(x + ':' + y); };
/* a drawn row at the room's level 0, its parts in metres from (x, z): rock = the cliff sheet, white under `gain`; snow = the calm snow sheet */
const row = (id, x, z) => { const P = []; arch.push({ k: 'arch', id: 'cam:n:' + id, x: r2(x), z: r2(z), rot: 0, y: 0, parts: P });
    const S = { P,
        rock(x, y, z, r, h, ry, o) { P.push(Object.assign({ s: 'dome', p: [r2(x), r2(y), r2(z)], r: r2(r), h: r2(h), rz: r2(r * 0.8), seg: 7, rings: 3, ry: ry || 0, key: ROCK, tint: 0xffffff, gain: RG }, o || {})); },
        drift(x, y, z, r, h, rz, ry) { P.push({ s: 'dome', p: [r2(x), r2(y), r2(z)], r: r2(r), h: r2(h), rz: r2(rz || r * 0.7), seg: 9, rings: 3, ry: ry || 0, key: SNOW, tint: 0xffffff, gain: SG }); },
        shaft(x, y, z, ra, rb, h, seg, ry, snow) { P.push({ s: 'cyl', p: [r2(x), r2(y), r2(z)], r: r2(ra), r2: r2(rb), h: r2(h), seg, ry, key: snow ? SNOW : ROCK, tint: 0xffffff, gain: snow ? SG : RG }); },
        /* a crag: three tapered shafts stacked, each turned and stepped off the one under it; `snow` = how many of them (from the top) wear snow */
        crag(x, z, r, h, snow, y0) { const ry = Math.round(rn() * 360), a = ry * Math.PI / 180, ox = Math.cos(a) * r * 0.15, oz = Math.sin(a) * r * 0.15, y = y0 == null ? -0.6 : y0, h1 = h * 0.45, h2 = h * 0.33, h3 = h - h1 - h2;
            S.shaft(x, y, z, r, r * 0.76, h1 + 0.6, 7, ry, false); S.shaft(x + ox, y + 0.6 + h1 - 0.1, z + oz, r * 0.8, r * 0.5, h2 + 0.1, 6, ry + 31, snow > 1);
            S.shaft(x + ox * 2.1, y + 0.6 + h1 + h2 - 0.1, z + oz * 2.1, r * 0.54, r * 0.1, h3 + 0.1, 5, ry + 67, snow > 0); } };
    return S; };

note('THE SNOWY PINES + THE FOREST');
/* ── THE RIDGE: the mountains between Camelot and the North Pole (mondo: "mountains and woods separate camelot from the north pole"). A wall of
   snow-capped crags along the district's north edge and round its two ends, on the pines' own squares (nobody walks there), higher peaks
   behind it; THE PASS = the gap the sleigh road leaves through. It also hides the kingdom's summer treeline past the room's edge. ── */
{ const S = row('ridge', 0, 0), N0 = gx(0), W0 = gx(0), E0 = gx(96);
  const front = (x, z, big) => { const r = big ? rr(5.2, 6.4) : rr(4.3, 5.8), h = big ? rr(13, 16) : rr(8.5, 12.5); S.crag(x, z, r, h, 1);
      if (rn() < 0.6) S.rock(x + rr(-2.5, 2.5), -0.4, z + r * 0.9, rr(1.4, 2.4), rr(1.1, 1.9), Math.round(rn() * 180)); if (rn() < 0.7) S.drift(x + rr(-3, 3), -0.3, z + r * 0.95, rr(2.6, 4.2), rr(0.9, 1.5)); };
  for (let x = W0 + 2; x < E0; x += rr(6.6, 8.2)) { if (Math.abs(x) < 12.5) continue; front(x, N0 + rr(2.0, 4.6), rn() < 0.25); }
  for (const s of [-1, 1]) { S.crag(s * 8.6, N0 + 3.4, 4.6, 16.5, 1); S.crag(s * 11.5, N0 + 7.2, 3.4, 9.5, 1); S.rock(s * 5.6, -0.4, N0 + 6.4, 1.7, 1.5, 40); S.drift(s * 6.2, -0.3, N0 + 9.5, 2.4, 1.0); }   // THE PASS's two gate crags
  for (let z = N0 + 9; z < gx(16.4); z += rr(6.6, 8.2)) { front(W0 + rr(1.6, 3.8), z, rn() < 0.25); front(E0 - rr(1.6, 3.8), z, rn() < 0.25); }
  for (let x = W0 - 20; x < E0 + 24; x += rr(19, 25)) if (Math.abs(x) > 24) S.crag(x, N0 - rr(15, 21), rr(11, 15), rr(23, 33), 2, -1);   // the peaks behind, snow from the shoulder up
  for (let z = N0 + 4; z < gx(15); z += rr(19, 25)) { S.crag(W0 - rr(15, 20), z, rr(10, 13), rr(20, 28), 2, -1); S.crag(E0 + rr(15, 20), z, rr(10, 13), rr(20, 28), 2, -1); }
  /* the middle rank stands IN the kingdom's treeline (a belt of summer trees 2 to 14 m past the room's edge), shoulder to shoulder, so no green shows between the crags */
  for (let x = W0 - 12; x < E0 + 14; x += rr(8.5, 10.5)) { if (Math.abs(x) < 16) continue; S.crag(x, N0 - rr(8.5, 10), rr(8.6, 10), rr(17, 23), 1, -1); }
  for (let z = N0 - 4; z < gx(16.6); z += rr(8.5, 10.5)) { S.crag(W0 - rr(8.5, 10), z, rr(8.6, 10), rr(17, 23), 1, -1); S.crag(E0 + rr(8.5, 10), z, rr(8.6, 10), rr(17, 23), 1, -1); }
  /* THE BELT WALL: one long block of rock, 10 m high, standing in the kingdom's treeline belt behind the front rank (its summer trees are 6 to 9 m:
     they showed green between the crags); snow on its top. Cut at the Pass. */
  { const wall = (x0, z0, x1, z1) => S.P.push({ s: 'box', p: [r2((x0 + x1) / 2), -0.5, r2((z0 + z1) / 2)], size: [r2(x1 - x0), 10.5, r2(z1 - z0)], key: ROCK, tint: 0xffffff, gain: RG, keyTop: SNOW, tintTop: 0xffffff });
    wall(W0 - 14.5, N0 - 14.5, -9.8, N0 + 2.0); wall(9.8, N0 - 14.5, E0 + 14.5, N0 + 2.0); wall(W0 - 14.5, N0 + 2.0, W0 + 2.0, gx(17)); wall(E0 - 2.0, N0 + 2.0, E0 + 14.5, gx(17)); }   // (its face 2 m inside the room, on the pines' squares: the belt's crowns reach that far)
  /* THE PASS: the way out is a trail the walker follows 10 m past the room's edge (data.js ways.trail), so the cleft is real: two rock walls 3 m
     apart for 24 m (they swallow the trail's own rows of summer saplings), crags on their heads, the cleft's end shut by rock, the far peak over it */
  for (const s of [-1, 1]) { [0.9, 7.3, 13.7, 20.1].forEach((dep, i) => { const h = rr(8.5, 11.5); S.shaft(s * 5.6, -1, N0 - dep, 4.1, 3.75, h + 1, 7, Math.round(rn() * 50), false); S.crag(s * 6.4, N0 - dep, 3.7, rr(6, 9), 1, h - 0.6); });
      S.crag(s * 13.5, N0 - 7, 7.5, 19, 1, -1); S.crag(s * 14, N0 - 19, 8, 22, 1, -1); }
  S.shaft(0, -1, N0 - 29.5, 6.6, 6.0, 15, 8, 20, false); S.crag(0.4, N0 - 30, 6, 9, 1, 13.4); S.crag(0, N0 - 52, 20, 42, 2, -1); }   // the pass closes behind the way out; the far peak over it

/* ── THE HUTS (walked into): log walls on a stone foot, a snow roof, a stone chimney, lit windows. Each stands on four whole squares. ── */
const foot = (a, w, d, door, h, out) => { const t = out + 0.05, x0 = -(w / 2 + t), x1 = w / 2 + t, a0 = door.lx - door.cw / 2 - 0.12, a1 = door.lx + door.cw / 2 + 0.12, o = { gain: RG };
    a.box(0, 0, -(d / 2 + t / 2), w + 2 * t, h, t, ROCK, 0xffffff, o); for (const s of [-1, 1]) a.box(s * (w / 2 + t / 2), 0, 0, t, h, d, ROCK, 0xffffff, o);
    a.box((x0 + a0) / 2, 0, d / 2 + t / 2, a0 - x0, h, t, ROCK, 0xffffff, o); a.box((a1 + x1) / 2, 0, d / 2 + t / 2, x1 - a1, h, t, ROCK, 0xffffff, o); };
/* a lit window on the wall at (x, z): a warm pane in a timber frame (`ns` = the wall runs north-south in the look's frame) */
const pane = (a, x, y, z, ns, wd, hh) => { const t = 0.08; a.box(x, y, z, ns ? t : wd, hh, ns ? wd : t, 'marble_light', WARM, { glow: 1 });
    a.box(x, y - 0.12, z, ns ? 0.16 : wd + 0.3, 0.12, ns ? wd + 0.3 : 0.16, PLANK, 0x5a4230, { gain: 1.4 }); a.box(x, y + hh, z, ns ? 0.16 : wd + 0.3, 0.12, ns ? wd + 0.3 : 0.16, PLANK, 0x5a4230, { gain: 1.4 });
    a.box(x, y, z, ns ? 0.12 : 0.07, hh, ns ? 0.07 : 0.12, PLANK, 0x5a4230, { gain: 1.4 }); };
const hut = (id, q, side, chimSide) => { take(q[0], q[1], q[2], q[3]);
    return ctx.building(id, q, side, 3.5, { leafDouble: false, leaf: 'leaf_shabby_wood', keyIn: PLANK, floorIn: PLANK }, (a, w, d, door) => { const H = 3.2, W2 = w / 2, D2 = d / 2;
        a.shell(w, H, d, LOG, LOGT, door); a.P.slice(-2).forEach(p => { p.gain = 1.8; });
        /* the log courses: every other one stands proud, darker; the front's are cut at the doorway; the corners are crossed log ends */
        const d0 = door.lx - door.cw / 2 - 0.1, d1 = door.lx + door.cw / 2 + 0.1, LC = { gain: 1.8, n: 5, step: [0, 0.62, 0] };
        a.box(0, 0.62, -(D2 + 0.1), w + 0.5, 0.3, 0.14, LOG, LOGD, LC); for (const s of [-1, 1]) a.box(s * (W2 + 0.1), 0.62, 0, 0.14, 0.3, d + 0.5, LOG, LOGD, LC);
        a.box((-W2 - 0.25 + d0) / 2, 0.62, D2 + 0.1, d0 + W2 + 0.25, 0.3, 0.14, LOG, LOGD, LC); a.box((W2 + 0.25 + d1) / 2, 0.62, D2 + 0.1, W2 + 0.25 - d1, 0.3, 0.14, LOG, LOGD, LC);
        a.box((d0 + d1) / 2, 2.48, D2 + 0.1, d1 - d0, 0.3, 0.14, LOG, LOGD, { gain: 1.5, n: 2, step: [0, 0.62, 0] });
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) a.box(sx * (W2 + 0.06), 0, sz * (D2 + 0.06), 0.42, H, 0.42, LOG, 0x5a4230, { gain: 1.5 });
        a.box(door.lx, 2.2, D2 + 0.12, door.cw + 0.5, 0.22, 0.2, PLANK, 0x5a4230, { gain: 1.4 }); for (const s of [-1, 1]) a.box(door.lx + s * (door.cw / 2 + 0.14), 0, D2 + 0.12, 0.2, 2.2, 0.2, PLANK, 0x5a4230, { gain: 1.4 });   // the door's frame
        foot(a, w, d, door, 0.55, 0.16);
        /* the roof: boards under, a thick coat of snow over them; the gable ends boarded; a porch roof on two posts over the door */
        a.roof('gable', 0, H, 0, w + 1.5, 2.5, d + 1.4, PLANK, 0x7a5a3c, { keyEnd: PLANK, tintEnd: 0x9a7650, gain: 1.3 });
        a.P.push({ s: 'roof', form: 'gable', p: [0, H + 0.16, 0], size: [w + 1.2, 2.5, d + 1.1], roof: true, key: SNOW, tint: 0xffffff, gain: SG, keyEnd: SNOW, tintEnd: 0xffffff });
        a.P.push({ s: 'roof', form: 'shed', p: [door.lx, 2.55, D2 + 1.0], size: [door.cw + 1.6, 0.7, 2.0], roof: true, ry: 0, under: true, key: SNOW, tint: 0xffffff, gain: SG, keyEnd: PLANK, tintEnd: 0x9a7650, keyUnder: PLANK });
        for (const s of [-1, 1]) a.box(door.lx + s * (door.cw / 2 + 0.6), 0, D2 + 1.8, 0.2, 2.6, 0.2, LOG, 0x5a4230, { gain: 1.5 });
        /* the chimney on a gable end, a cap of snow on its shoulder */
        const cx = chimSide * (W2 + 0.45); a.box(cx, 0, -1.75, 1.0, 5.6, 1.5, ROCK, 0xffffff, { gain: RG }); a.box(cx, 5.6, -1.75, 1.25, 0.22, 1.75, ROCK, 0xe8e8e8, { gain: RG, roof: true }); a.box(cx, 5.82, -1.75, 0.7, 0.1, 1.1, null, 0x181614, { roof: true });
        pane(a, -chimSide * (W2 + 0.12), 1.25, 1.75, true, 0.9, 0.9); pane(a, 0, 1.25, -(D2 + 0.12), false, 0.9, 0.9);
        pane(a, door.lx + (door.lx < 0 ? 1 : -1) * (door.cw / 2 + 1.5), 1.25, D2 + 0.12, false, 0.8, 0.9);
    }); };

/* ── THE SLEIGH STOP (P03-00 / P04-00): the sleigh and its horse on the west side of the road, the wayside hut and a hitching rail on the east ── */
put('sleigh', 45, 6, { face: 0 }); put('horse_brown', 45, 5, { face: 0 }); put('xmas_snowman', 46, 3); put('signpost', 46, 8);
const WAYHUT = hut('n_wayhut', [50, 4, 52, 6], 'W', 1);
put('hitching_rail', 50, 7, { face: 0 }); put('horse_black', 51, 7, { face: 270 });

/* ── THE YETI'S CAVE (the glade south of the track, P02-00's foot): a rock den open to the west, the yeti and its fire before it ── */
put('campfire', 30, 12); native('yeti', 31, 13, 120, sayOf(ONP, 'yeti'));
{ const x = gx(33), z = gx(12), S = row('cave', x, z); take(32, 11, 34, 13);
  feat({ k: 'wall', x0: gx(32), z0: z, x1: gx(34), z1: z, t: 7, h: 3, ghost: true, rail: false });   // the den's weight: its four whole squares
  S.P.push({ s: 'cyl', p: [0, -0.3, 0], r: 3.45, r2: 3.0, ri: 2.5, h: 3.3, seg: 14, arc: 250, a0: 235, key: ROCK, tint: 0xffffff, gain: RG });   // the horseshoe wall, its mouth to the west
  S.P.push({ s: 'cyl', p: [0, -0.3, 0], r: 2.6, r2: 2.26, ri: 2.45, h: 3.3, seg: 14, arc: 250, a0: 235, tint: 0x16161c });   // the den's inside is dark (the rock's own inner face was as bright as the day)
  S.P.push({ s: 'box', p: [0, 2.9, 0], size: [3.4, 0.02, 3.4], sides: false, top: false, under: true, tint: 0x0c0c10 }, { s: 'cyl', p: [0, 0.02, 0], r: 2.6, h: 0.02, seg: 12, key: 'dirt_2', tint: 0x504840 });   // the dark under the roof; the den's floor
  S.P.push({ s: 'dome', p: [0, 3.0, 0], r: 3.3, h: 1.7, rz: 3.2, seg: 9, rings: 3, key: ROCK, tint: 0xffffff, gain: RG }); S.drift(0.5, 3.5, 0.2, 2.7, 1.5, 2.5, 20);   // the roof rock, snow on it
  S.rock(-2.4, -0.4, 2.6, 1.5, 2.4, 30); S.rock(-2.5, -0.4, -2.7, 1.3, 2.0, 100); S.rock(1.8, -0.4, 3.2, 1.9, 2.2, 60); S.rock(2.4, -0.4, -3.0, 2.0, 2.5, 140); S.rock(3.6, -0.4, 0.3, 1.7, 2.1, 10);
  S.crag(1.6, -1.2, 1.5, 6.6, 1, 2.2); S.crag(2.3, 1.4, 1.2, 5.2, 1, 2.0);
  S.drift(-3.6, -0.2, 3.3, 1.6, 0.6); S.drift(-3.7, -0.2, -3.2, 1.5, 0.55);
  taken.add('31:11'); at('skull_pile', gc(31), gc(11), { face: 60, floor: true }); at('femur', x - 4.3, z + 0.9, { face: 20, floor: true }); at('skull', x - 4.9, z + 1.9, { face: 250, floor: true }); at('ulna', x - 5.4, z - 0.3, { face: 130, floor: true }); }

/* ── THE OLD STONES (the glade south of the track, P05-00's foot): a ring of standing stones on a low knoll, the great gate stone to the south ── */
{ const x = gc(68), z = gc(12);
  feat({ k: 'hill', x, z, r: 7.4, h: 0.9 });
  [[66, 11, 20], [70, 11, 80], [66, 13, 150], [70, 13, 200]].forEach(q => { taken.add(q[0] + ':' + q[1]); at('sarsen', gc(q[0]), gc(q[1]), { face: q[2] }); });
  [[65, 12, 40], [71, 12, 110]].forEach(q => { taken.add(q[0] + ':' + q[1]); at('menhir', gc(q[0]), gc(q[1]), { face: q[2] }); });
  take(67, 14, 69, 15); at('trilithon', gx(68), gc(14), { face: 0 });
  const S = row('stones', x, z); S.P.push({ s: 'cyl', p: [0, 0.75, 0], r: 1.5, h: 0.22, seg: 9, key: ROCK, tint: 0xffffff, gain: RG });   // the flat stone at the ring's heart
  S.drift(1.0, 0.85, 0.5, 0.9, 0.3); }
put('xmas_snowman_2', 67, 8);

/* ── THE WOODCUTTER'S CAMP (P00-00): the cabin, the fire before its door ── */
const CABIN = hut('n_cabin', [4, 6, 6, 8], 'E', -1);
put('campfire', 7, 8); dec('stump', 5, 8);

/* ── THE FROZEN POND (P07-00): ice you walk on, snow banked round it ── */
{ const x = gx(89.5), z = gx(6.6), S = row('pond', x, z); take(88, 5, 91, 8);
  S.P.push({ s: 'dome', p: [0, 0, 0], r: 5.2, h: 0.07, rz: 4.3, seg: 22, rings: 2, key: 'calm_ice', tint: 0x86c8f2, glow: 0.4 });
  for (let i = 0; i < 11; i++) { const a = (i * 33 + 10) * Math.PI / 180, k = 1.06 + (i % 3) * 0.05; if (i === 4) continue;   // the bank, open on the south-west where the track comes in
      S.drift(Math.cos(a) * 5.2 * k, -0.25, Math.sin(a) * 4.3 * k, rr(1.1, 1.8), rr(0.55, 0.9), rr(0.8, 1.2), Math.round(a * 180 / Math.PI + 90)); }
  S.rock(-5.0, -0.3, -2.9, 1.0, 0.9, 30); S.rock(4.9, -0.3, 2.9, 1.2, 1.0, 110); S.rock(1.5, -0.3, -4.7, 0.8, 0.7, 70); }
dec('stump', 91, 8); put('xmas_snowman_3', 91, 7);

/* ── PASS 2, THE HUTS' INSIDES. Each hut is two squares by two (7 m): the door's square (front left, seen from inside looking at the door) and the
   front right one stay free; the two BACK squares carry what blocks (the hearth on the chimney's side, a bed on the other), each with a ghost
   wall; everything else is decor off the squares' middles. A hollow building's inside takes no light and its ceiling is black, so the walls are
   lined 0.33 m in (boards, `gain` + a little `glow`), a lit board deck hangs under the ceiling, the panes glow. Frame: x along the front, +z out
   of the front (the door at z = +3.5), y up; a prop's face 0 looks at the back wall, 180 at the door. ── */
const r3 = v => Math.round(v * 1000) / 1000;
const fit = (B, id, cs) => { const a = ctx.sheet(), P = a.P, c = B.at(0, 0), w = B.fw, d = B.fd, W2 = w / 2, D2 = d / 2, E = 0.33, TOP = 2.95, lx = B.door.lx, dw = B.door.cw + 0.12;
    arch.push({ k: 'arch', id: 'cam:' + id + ':in', x: c[0], z: c[1], rot: B.face(0), parts: P });
    const quad = (x, y, z, qw, qh, ry, key, tint, x2) => P.push(Object.assign({ s: 'quad', p: [r3(x), r3(y), r3(z)], size: [r3(qw), r3(qh)], ry, kind: 'wall', key, tint }, x2 || {}));
    const LIN = { gain: 1.55, glow: 0.2 }, H = {
        a, cs,
        put: (key, x, z, face, o) => ctx.inside(B, key, r3(x), r3(z), Object.assign({ face: face || 0, floor: true }, o || {})),
        on: (key, x, z, y, face, o) => ctx.inside(B, key, r3(x), r3(z), Object.assign({ face: face || 0, y: r3(y) }, o || {})),
        block: (x0, z0, x1, z1, t, h) => { const p = B.at(x0, z0), q = B.at(x1, z1); feat({ k: 'wall', x0: p[0], z0: p[1], x1: q[0], z1: q[1], t: t || 0.9, h: h || 1.1, ghost: true, rail: false }); } };
    /* the lining, the lit deck, two beams, the panes seen from inside */
    quad(0, 0, -D2 + E, w - 2 * E, TOP, 0, PLANK, 0xb08a5c, LIN); quad(0, 0, D2 - E, w - 2 * E, TOP, 180, PLANK, 0xb08a5c, Object.assign({ hole: [r3(-lx), r3(dw), 2.25] }, LIN));
    quad(-W2 + E, 0, 0, d - 2 * E, TOP, 270, PLANK, 0xb08a5c, LIN); quad(W2 - E, 0, 0, d - 2 * E, TOP, 90, PLANK, 0xb08a5c, LIN);
    a.box(0, TOP, 0, w - 2 * E, 0.06, d - 2 * E, PLANK, 0x9a7650, { sides: false, top: false, under: true, glow: 0.6 });
    for (const x of [-1.75, 1.75]) a.box(x, TOP - 0.26, 0, 0.26, 0.26, d - 2 * E, LOG, 0x5a4230, { glow: 0.3, gain: 1.4 });
    const win = (x, z, ns) => { a.box(x, 1.25, z, ns ? 0.04 : 0.9, 0.9, ns ? 0.9 : 0.04, 'calm_ice', 0x9ccaf4, { glow: 0.8 }); a.box(x, 1.25, z, ns ? 0.07 : 0.07, 0.9, ns ? 0.07 : 0.07, PLANK, 0x6a4a30, { gain: 1.4 }); a.box(x, 1.66, z, ns ? 0.07 : 0.9, 0.07, ns ? 0.9 : 0.07, PLANK, 0x6a4a30, { gain: 1.4 }); a.box(x, 1.13, z, ns ? 0.14 : 1.2, 0.12, ns ? 1.2 : 0.14, PLANK, 0x6a4a30, { gain: 1.4 }); a.box(x, 2.15, z, ns ? 0.1 : 1.2, 0.12, ns ? 1.2 : 0.1, PLANK, 0x6a4a30, { gain: 1.4 }); };
    win(-cs * (W2 - E - 0.03), 1.75, true); win(0, -(D2 - E - 0.03), false);
    /* THE HEARTH on the chimney's back square: a slab, two stone jambs, the lintel with its mantel board, the breast to the ceiling, a black back */
    const hx = cs * (W2 - E - 0.5), hz = -1.75, ST = { gain: 1.5, glow: 0.12 };
    a.box(hx, 0, hz, 1.0, 0.16, 2.3, ROCK, 0xffffff, ST); for (const s of [-1, 1]) a.box(hx, 0.16, hz + s * 0.95, 1.0, 1.25, 0.4, ROCK, 0xffffff, ST);
    a.box(hx, 1.41, hz, 1.05, 0.36, 2.4, ROCK, 0xffffff, ST); a.box(hx - cs * 0.1, 1.77, hz, 1.25, 0.07, 2.6, PLANK, 0x7a5632, { gain: 1.5, glow: 0.15 });
    a.box(cs * (W2 - E - 0.32), 1.84, hz, 0.64, TOP - 1.84, 1.9, ROCK, 0xffffff, ST); a.box(cs * (W2 - E - 0.05), 0.16, hz, 0.08, 1.25, 1.5, null, 0x161210);
    a.box(hx, 0.16, hz, 0.7, 0.05, 1.2, null, 0xff7a20, { glow: 1 });   // the bed of embers
    H.on('hearth_fire', hx, hz, 0.2, 0); H.block(hx, hz - 1.15, hx, hz + 1.15, 1.1, 1.3);
    H.hx = hx; H.hz = hz; H.W2 = W2; H.D2 = D2; H.E = E; H.TOP = TOP;
    /* a hanging lantern in the middle: a chain, the catalogue's lantern, a lit core */
    a.box(0, 2.45, 0.4, 0.04, TOP - 2.45, 0.04, null, 0x2a2c30); ctx.inside(B, 'meshy_hanging_lantern', 0, 0.4, { y: 1.97, noLight: true }); a.box(0, 2.1, 0.4, 0.1, 0.18, 0.1, null, 0xffd890, { glow: 1 });
    /* a pelt on the boards (the fur sheet), a stack of split logs by the hearth (drawn: no log stack on R2) */
    H.pelt = (x, z, pw, pd, ry, tint) => a.box(x, 0.036, z, pw, 0.03, pd, 'fur', tint, { ry, gain: 1.4, glow: 0.1 });
    H.logs = (x, z, ry) => { for (let k = 0; k < 3; k++) a.box(x, 0.036 + k * 0.17, z, 0.9, 0.16, 0.16, LOG, k % 2 ? 0x8a6444 : 0x7a5638, { ry, gain: 1.6, glow: 0.1, n: 3 - k, step: ry ? [0, 0, 0.18] : [0, 0, 0.18] }); };
    H.shelf = (x, z, len, y, ns) => { a.box(x, y, z, ns ? 0.3 : len, 0.05, ns ? len : 0.3, PLANK, 0x8a6238, { gain: 1.5, glow: 0.12 }); for (const s of [-1, 1]) a.box(ns ? x : x + s * (len / 2 - 0.15), y - 0.22, ns ? z + s * (len / 2 - 0.15) : z, ns ? 0.26 : 0.05, 0.22, ns ? 0.05 : 0.26, PLANK, 0x6a4a30, { gain: 1.4 }); };
    return H; };
/* THE WAYSIDE HUT: a traveller's rest. The hearth on the right, a bed in the back left corner, a stool and a dog by the fire, stockings and
   mugs on the mantel, a wreath, plates on the shelf, sacks and a crate by the door wall, a spear by the door. */
{ const H = fit(WAYHUT, 'n_wayhut', 1), a = H.a, W2 = H.W2, D2 = H.D2;
    H.put('psx_bed_5_4', -1.75, -1.75, 0); H.block(-1.75, -2.8, -1.75, -0.7, 1.4, 0.9);   // (the catalogue's `cot` is a steel camp cot: not here)
    H.pelt(0.7, 0.3, 2.2, 1.5, 20, 0x9a7a5c); H.put('psx_chair_mp_1', 1.0, -0.6, 300); H.put('dog', 0.4, -2.3, 120);
    H.on('xmas_cocoa', H.hx - 0.1, H.hz - 0.7, 1.85, 0); H.on('xmas_cocoa', H.hx - 0.15, H.hz - 0.35, 1.85, 40); H.on('candle', H.hx - 0.1, H.hz + 0.8, 1.85, 0);
    ctx.inside(WAYHUT, 'xmas_stocking', r3(H.hx - 0.56), r3(H.hz - 0.45), { face: 270, mount: 0, y: 1.3 }); ctx.inside(WAYHUT, 'xmas_stocking_2', r3(H.hx - 0.56), r3(H.hz + 0.45), { face: 270, mount: 0, y: 1.3 });
    ctx.inside(WAYHUT, 'xmas_wreath', -1.9, r3(-D2 + 0.4), { face: 180, mount: 0, y: 1.75 });
    H.shelf(1.2, -D2 + 0.5, 1.6, 1.5, false); H.on('psx_plate_mp_1', 0.8, -D2 + 0.5, 1.56, 0); H.on('psx_plate_mp_1', 1.2, -D2 + 0.5, 1.56, 0); H.on('item_drinking_cup', 1.6, -D2 + 0.5, 1.56, 0); H.on('item_drinking_cup', 1.8, -D2 + 0.52, 1.56, 0);
    H.logs(W2 - 0.95, 0.1, 0); H.put('meshy_burlap_sack', W2 - 0.8, D2 - 0.8, 30); H.put('meshy_burlap_sack', W2 - 0.75, D2 - 1.6, 200); H.put('psx_wooden_crate_5', W2 - 1.7, D2 - 0.9, 10);   // (crate_4 wears a HIGHLY FLAMMABLE plate) H.put('wooden_bucket', 1.0, D2 - 0.7, 0);
    H.put('spear', -W2 + 0.55, D2 - 0.55, 0); H.put('xmas_gift', -W2 + 0.7, 0.7, 30); H.put('xmas_gift_3', -W2 + 0.6, 1.2, 80); }
/* THE WOODCUTTER'S CABIN: the hearth on the left with the pot in it, the bed in the back right corner, the rocking chair, the saw and the
   rope on the wall shelf, split logs, a bear trap, sacks. */
{ const H = fit(CABIN, 'n_cabin', -1), a = H.a, W2 = H.W2, D2 = H.D2;
    H.put('psx_bed_5_4', 1.75, -1.75, 0); H.block(1.75, -2.8, 1.75, -0.7, 1.4, 0.9);
    H.pelt(0.5, 0.6, 2.3, 1.5, 340, 0x8a6a50); H.put('rocking_chair', -0.3, -0.5, 250); H.on('cauldron', H.hx + 0.05, H.hz, 0.2, 0, { h: 0.55 });
    H.shelf(W2 - 0.5, 1.4, 2.2, 1.35, true); H.on('psx_hand_saw_1', W2 - 0.5, 0.8, 1.41, 90); H.on('meshy_rope', W2 - 0.5, 1.6, 1.41, 0); H.on('psx_nails_1', W2 - 0.5, 2.2, 1.41, 0); H.on('candle', W2 - 0.5, 0.45, 1.41, 0);
    H.logs(-W2 + 0.95, 0.2, 0); H.logs(-W2 + 0.95, 1.0, 0); H.put('trap_bear_base', W2 - 0.8, D2 - 0.75, 20); H.put('trap_bear_jaw', W2 - 0.8, D2 - 0.75, 20);
    H.put('meshy_burlap_sack', 0.9, D2 - 0.75, 100); H.put('psx_wooden_crate_5', 2.0, D2 - 1.9, 5); H.put('wooden_bucket', -W2 + 0.7, 2.6, 0); H.on('candle', H.hx + 0.1, H.hz + 0.85, 1.85, 0);
    ctx.inside(CABIN, 'xmas_wreath_2', 0.2, r3(-D2 + 0.4), { face: 180, mount: 0, y: 1.75 }); }

/* ── PASS 3, THE DRESSING. Everything by metres with the district's own dice; ONE drawn row for the whole district (`cam:n:dress`, the room's
   frame) so the looks stay few: timber, rock, snow, split logs, the lit cores. Nothing stands on the track's or the road's own squares. ── */
{ const S = row('dress', 0, 0), P = S.P, TIM = 0x6a4a30, TG = { gain: 1.5 };
  const NORTH = gx(9), SOUTH = gx(11), RW = gx(47), RE = gx(49);
  /* a lantern post on a verge: the post, an arm out over the way, the catalogue's hanging lantern, a lit core, snow on the post's head */
  const lantern = (x, z, dx, dz, lit) => { P.push({ s: 'box', p: [r2(x), 0, r2(z)], size: [0.16, 3.1, 0.16], key: PLANK, tint: TIM, gain: 1.5 }, { s: 'box', p: [r2(x + dx * 0.34), 2.86, r2(z + dz * 0.34)], size: [dx ? 0.84 : 0.1, 0.1, dz ? 0.84 : 0.1], key: PLANK, tint: TIM, gain: 1.5 },
      { s: 'box', p: [r2(x), 3.1, r2(z)], size: [0.26, 0.1, 0.26], key: SNOW, tint: 0xffffff, gain: SG }, { s: 'box', p: [r2(x + dx * 0.66), 2.46, r2(z + dz * 0.66)], size: [0.1, 0.18, 0.1], tint: 0xffd890, glow: 1 });
      P.push({ s: 'cyl', p: [r2(x + dx * 0.66), 0.014, r2(z + dz * 0.66)], r: 1.5, h: 0.012, seg: 14, key: SNOW, tint: 0xfff3dc, glow: 0.93 });   // its pool of light on the snow (a part with `glow` is drawn unlit: no more than the day's snow by day, warm in the dark)
      at('meshy_hanging_lantern', x + dx * 0.66, z + dz * 0.66, Object.assign({ y: 2.32 }, lit ? {} : { noLight: true })); };
  [[1.5, -1], [8.6, 1], [12.5, -1], [15.3, 1]].forEach(q => q[1] < 0 ? lantern(RW - 0.45, gx(q[0]), 1, 0, q[0] === 8.6) : lantern(RE + 0.45, gx(q[0]), -1, 0, q[0] === 8.6));
  [10, 18, 26, 36, 42, 54, 60, 72, 78, 84].forEach((k, i) => i % 2 ? lantern(gc(k), SOUTH + 0.45, 0, -1) : lantern(gc(k), NORTH - 0.45, 0, 1));
  /* drifts and snow-capped rocks on the verges (never where a verge opens on a clearing, a glade or the crossing) */
  const shut = k => (k >= 28.5 && k < 32.5) || (k >= 66.5 && k < 69.5), shutS = k => (k >= 26.5 && k < 34.5) || (k >= 64.5 && k < 72.5), cross = k => k > 45.5 && k < 50.5;
  for (let i = 0; i < 64; i++) { const k = rr(7, 86), n = rn() < 0.5, off = rr(0.7, 2.6); if (cross(k) || (n ? shut(k) : shutS(k))) continue; const x = gx(k), z = n ? NORTH - off : SOUTH + off;
      if (i % 3 === 0) { const r = rr(0.5, 1.1); S.rock(x, -0.15, z, r, r * rr(0.7, 1.0), Math.round(rn() * 180)); S.drift(x + 0.1, r * 0.45, z, r * 0.75, r * 0.45, r * 0.6); } else S.drift(x, -0.25, z, rr(1.0, 2.0), rr(0.5, 0.95), rr(0.7, 1.3), Math.round(rn() * 180)); }
  for (let i = 0; i < 18; i++) { const k = rr(0.6, 16.6), w = rn() < 0.5, off = rr(0.7, 2.4); if ((k > 2.6 && k < 11.4)) continue; S.drift(w ? RW - off : RE + off, -0.25, gx(k), rr(1.0, 1.8), rr(0.5, 0.9), rr(0.7, 1.2), Math.round(rn() * 180)); }
  /* the sleigh's two runner tracks down the middle of the road */
  for (const o of [-0.62, 0.62]) P.push({ s: 'box', p: [o, 0.012, r2((gx(0.3) + gx(16.7)) / 2)], size: [0.1, 0.012, r2(gx(16.7) - gx(0.3))], sides: false, key: SNOW, tint: 0xa9b6c8 });
  /* a stack of split logs between two stakes: `n` logs a course, three courses, lying along x (`ns` = along z), snow on top. (The first cut
     stepped each course back: it read as a flight of steps.) */
  const stack = (x, z, n, len, ns) => { const wd = n * 0.3;
      for (let c = 0; c < 3; c++) P.push({ s: 'box', p: [r2(x + (ns ? (c % 2) * 0.05 : 0)), r2(c * 0.27), r2(z + (ns ? 0 : (c % 2) * 0.05))], size: ns ? [0.26, 0.26, len] : [len, 0.26, 0.26], key: LOG, tint: c % 2 ? 0x8a6444 : 0xa07c56, gain: 1.6, n, step: ns ? [0.3, 0, 0] : [0, 0, 0.3] });
      for (const e of [-0.2, wd - 0.1]) P.push({ s: 'box', p: [r2(x + (ns ? e : 0)), 0, r2(z + (ns ? 0 : e))], size: [0.1, 1.05, 0.1], key: PLANK, tint: TIM, gain: 1.5 });
      P.push({ s: 'box', p: [r2(x + (ns ? wd / 2 - 0.15 : 0)), 0.8, r2(z + (ns ? 0 : wd / 2 - 0.15))], size: ns ? [wd, 0.12, len + 0.12] : [len + 0.12, 0.12, wd], key: SNOW, tint: 0xffffff, gain: SG }); };
  /* the light the huts' panes throw on the snow: a warm patch under each window (the same trick as the lanterns' pools) */
  [[WAYHUT, 1], [CABIN, -1]].forEach(q => { const B = q[0], cs = q[1], W2 = B.fw / 2, D2 = B.fd / 2, pool = (lx, lz, r) => { const c = B.at(lx, lz); P.push({ s: 'cyl', p: [c[0], 0.014, c[1]], r, h: 0.012, seg: 12, key: SNOW, tint: 0xfff3dc, glow: 0.93 }); };
      pool(-cs * (W2 + 1.5), 1.75, 1.4); pool(0, -(D2 + 1.5), 1.4); pool(B.door.lx + (B.door.lx < 0 ? 1 : -1) * (B.door.cw / 2 + 1.5), D2 + 1.4, 1.2); });
  /* THE WOODCUTTER'S YARD */
  stack(gx(5) - 1.0, gx(6) - 1.3, 5, 2.2, false); stack(gx(6) + 0.5, gx(8) + 0.35, 4, 1.6, true);
  { const x = gc(7) + 0.5, z = gc(6) - 0.5;   // the sawhorse, a log on it, the saw
    for (const sx of [-0.55, 0.55]) for (const sz of [-0.22, 0.22]) P.push({ s: 'box', p: [r2(x + sx), 0, r2(z + sz)], size: [0.09, 0.74, 0.09], key: PLANK, tint: TIM, gain: 1.5 });
    P.push({ s: 'box', p: [r2(x), 0.66, r2(z)], size: [1.5, 0.09, 0.1], key: PLANK, tint: TIM, gain: 1.5 }, { s: 'box', p: [r2(x), 0.75, r2(z)], size: [1.9, 0.26, 0.26], key: LOG, tint: 0x9a7450, gain: 1.6 });
    at('psx_hand_saw_1', x + 0.2, z, { y: 1.02, face: 80, floor: true }); }
  put('meshy_stump', 6, 5); put('meshy_stump', 4, 8); put('fallen_log', 8, 7, { face: 90 }); at('stump', gx(8.7), gx(6.4), { face: 40 }); at('rabbit', gx(8.4), gx(8.6), { face: 200 }); at('crow', gx(6.2), gx(5.4), { face: 100 });
  /* THE SLEIGH STOP: a covered wagon north of the hut, straw and a bucket for the horse, the sleigh's load, the hut's own stack */
  take(49, 3, 51, 4); at('covered_wagon', gx(50), gc(3), { face: 0 }); put('hw_straw', 52, 7, { face: 20 }); at('hw_straw_2', gc(52) - 0.3, gc(6) + 0.6, { face: 70 }); at('wooden_bucket', gc(50) + 1.1, gc(7) - 1.2);
  at('xmas_gift', gc(44) + 0.9, gc(6) + 0.2, { face: 20 }); at('xmas_gift_2', gc(44) + 0.5, gc(6) - 0.5, { face: 70 }); at('xmas_gift_4', gc(44) + 1.1, gc(6) - 0.4, { face: 130 }); at('meshy_burlap_sack', gc(44) + 0.4, gc(5) + 0.8, { face: 10 }); at('meshy_burlap_sack', gc(44) + 1.0, gc(5) + 0.4, { face: 250 });
  stack(gx(51) - 1.2, gx(6) + 0.25, 4, 2.2, false);
  /* (no torches by the doors: a `wall_torch` within 2 m of a hut stood on its roof, with or without `floor`; the road's lantern posts light the stop) */
  at('eagle', gx(52), gx(2.5), { y: 15, face: 250 });
  /* THE FROZEN POND: a fishing hole cut in the ice, a stool, the catch, dead bushes on the bank, crows; the ice queen */
  { const x = gx(89.5) - 1.3, z = gx(6.6) + 0.7; P.push({ s: 'cyl', p: [r2(x), 0, r2(z)], r: 0.44, h: 0.085, seg: 10, key: 'deep_water', tint: 0x162a40 }, { s: 'cyl', p: [r2(x), 0, r2(z)], r: 0.66, ri: 0.44, h: 0.15, seg: 10, key: SNOW, tint: 0xffffff, gain: SG });
    at('psx_chair_mp_1', x + 1.0, z + 0.3, { face: 250, y: 0.07 }); at('psx_fish_skeleton_mp_1', x - 0.3, z + 0.9, { face: 30, y: 0.08 }); at('wooden_bucket', x + 0.5, z + 1.0, { y: 0.07 });
    at('crow', x - 2.4, z - 1.6, { face: 60, y: 0.07 }); at('crow', x + 3.0, z - 2.2, { face: 200, y: 0.07 }); }
  put('psxg_dead_tree_1', 91, 6); at('psxg_dead_bush_1', gx(87.4), gx(6.2), { face: 30 }); at('psxg_dead_bush_2', gx(88.6), gx(8.5), { face: 120 }); at('psxg_dead_bush_1', gx(90.4), gx(4.8), { face: 200 });
  native('ice queen', 89, 8, 0, sayOf(ONP, 'ice queen'));
  /* THE YETI'S CAVE: bats under the roof, the leavings of meals, dead trees, rocks */
  { const x = gx(33), z = gx(12); at('bat_black', x - 1.0, z + 0.5, { y: 2.3, floor: true }); at('bat_grey', x - 0.6, z - 0.7, { y: 2.45, floor: true });
    at('psx_meat_1', gc(30) + 1.0, gc(12) - 0.9, { face: 40 }); at('femur', gc(29) + 0.5, gc(12) + 0.9, { face: 110 }); at('skull', gc(30) - 0.6, gc(13) + 0.5, { face: 300 }); at('psx_fish_skeleton_mp_1', gc(31) - 0.4, gc(12) - 1.0, { face: 200 });
    S.rock(gx(27.5), -0.2, gx(13.6), 0.9, 0.8, 30); S.rock(gx(29.2), -0.2, gx(14.4), 0.7, 0.6, 100); S.drift(gx(27.8), -0.2, gx(11.3), 1.3, 0.6); }
  put('psxg_dead_tree_2', 27, 11); put('psxg_dead_tree_1', 28, 13);
  /* THE OLD STONES: candles on the flat stone, crows, krampus */
  { const x = gc(68), z = gc(12); at('hw_candles', x - 0.5, z + 0.3, { y: 0.1 }); at('hw_candles_2', x + 0.5, z - 0.3, { y: 0.1 }); at('hw_candle', x + 0.1, z + 0.7, { y: 0.1 });
    at('crow', gc(66) + 0.9, gc(12) + 0.8, { face: 40 }); at('crow', gc(70) - 0.8, gc(12) - 0.6, { face: 250 }); at('crow', gc(69) + 0.3, gc(13) + 0.9, { face: 150 }); at('rabbit', gc(67) - 0.5, gc(11) + 0.6, { face: 300 }); }
  native('krampus', 68, 13, 0, sayOf(ONP, 'krampus'));
  /* the nooks on the track: bigfoot in the west one; snowballs by the snowman in the east one; wolves in the pines north of the track */
  native('bigfoot', 30, 8, 180, sayOf(ONP, 'bigfoot'));
  [[0.9, 0.5, 0.28], [1.3, -0.2, 0.2], [0.6, -0.6, 0.16]].forEach(q => P.push({ s: 'dome', p: [r2(gc(67) + q[0]), 0, r2(gc(8) + q[1])], r: q[2], seg: 8, rings: 3, key: SNOW, tint: 0xffffff, gain: SG }));
  at('wolf', gx(57.4), NORTH - 1.4, { face: 160 }); at('wolf', gx(58.3), NORTH - 2.3, { face: 200 }); at('wolf', gx(59.5), NORTH - 1.2, { face: 230 });
  at('rabbit', gx(20.5), SOUTH + 0.9, { face: 20 }); at('rabbit', gx(76.4), NORTH - 0.8, { face: 170 }); at('crow', gx(38.5), NORTH - 0.7, { face: 90 }); at('crow', gx(14.2), SOUTH + 0.8, { face: 310 });
  /* a split-rail run either side of the road down to the north bridge */
  for (let k = 0; k < 4; k++) for (const s of [-1, 1]) at('hw_fence', s < 0 ? RW - 0.35 : RE + 0.35, gx(13) + 0.83 + k * 1.65, { face: 90 });
}
/* ── PASS 4, THE ATMOSPHERE: smoke off both chimneys and the three camp fires (the catalogue's `chimney_smoke`); the snow in the air is
   `airZones` below; the night is carried by what glows: the panes, the lanterns' cores, the fires, the ice. ── */
ctx.inside(WAYHUT, 'chimney_smoke', r3(WAYHUT.fw / 2 + 0.45), -1.75, { y: 6.0, rise: 6 }); ctx.inside(CABIN, 'chimney_smoke', r3(-CABIN.fw / 2 - 0.45), -1.75, { y: 6.0, rise: 6 });
[[30, 12], [7, 8]].forEach(q => at('chimney_smoke', gc(q[0]), gc(q[1]), { y: 0.7, rise: 4 }));
flushArch();
return { WAYHUT, CABIN };
}
/* where the tree mass plants nothing (the tool's `noTrees`, kingdom squares): round the two huts, the den, the pond
   (a snow pine is a CLUMP: one planted pine stands trunks up to 16 m from its foot. One planted 15.7 m off stood a trunk INSIDE the Wayside
   Hut, through the bed. So a hut is cleared 19 m round; the den and the pond, where a trunk at the edge does no harm, less.) */
const noTrees = [[44.5, -1.5, 57.5, 11.5], [-1.5, 0.5, 11.5, 13.5], [30.5, 9.5, 36, 14.5], [86, 3, 93.5, 9]];
/* THE AIR (the tool's `airZones`, kingdom squares): snow falling over the whole district, down to the moat's north bank; a little pale ice dust
   over the pond and round the old stones. Counts are small (a weak PC halves them). */
const airZones = () => [
    { x0: 0, y0: 0, x1: 96, y1: 17, kind: 'snow', n: 2200 },
    { x0: 87, y0: 4, x1: 92, y1: 9, kind: 'motes', color: 0xcfeaff, n: 36 },
    { x0: 65, y0: 10, x1: 72, y1: 15, kind: 'motes', color: 0xcfeaff, n: 30 },
];
module.exports = { build, noTrees, airZones };
