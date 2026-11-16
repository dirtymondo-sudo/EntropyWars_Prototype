/* CAMELOT KINGDOM · THE SNOWY PINES (district N, 8 plots) — the north woods: snow, pines, the sleigh road.
   Repo tooling only: bake-camelot.js calls `build(ctx)` after the shared pieces stand.

   THE PLOTS: P00-00 Snowy pines, north-west · P01-00 The Snowy Pines, west · P02-00 The Snowfield, west · P03-00 The Sleigh Road ·
   P04-00 The Snowfield · P05-00 The Snowfield, east · P06-00 The Snowy Pines, east · P07-00 Snowy pines, north-east (squares x 0..96,
   y 0..12). The snow runs on south to the moat's north bank (the zone is y 0..17), over the top of the village's north plots: that
   strip is dressed here too (the campfire and the yeti at 30..31, 12..13 stand on it).

   WHAT STANDS HERE TODAY (pass 1 of 5, the exteriors, 2026-11-16; the drawn rows are `cam:n:<name>`):
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

   MISSING / WAITING: nothing is waiting on mondo. STILL TO DO: the two huts' insides (pass 2), dressing (pass 3), snow in the air, smoke,
   the night look (pass 4), polish (pass 5). Notes + the FITS THIS DISTRICT list: areas-complexes.md "CAMELOT, THE SNOWY PINES".
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
        const cx = chimSide * (W2 + 0.45); a.box(cx, 0, -0.6, 1.0, 6.3, 1.3, ROCK, 0xffffff, { gain: RG }); a.box(cx, 6.3, -0.6, 1.25, 0.22, 1.55, ROCK, 0xe8e8e8, { gain: RG, roof: true }); a.box(cx, 6.52, -0.6, 0.7, 0.1, 1.0, null, 0x181614, { roof: true });
        pane(a, -chimSide * (W2 + 0.12), 1.25, 0, true, 0.9, 0.9); pane(a, 0, 1.25, -(D2 + 0.12), false, 0.9, 0.9);
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
  const S = row('stones', x, z); S.P.push({ s: 'cyl', p: [0, 0.5, 0], r: 1.5, h: 0.22, seg: 9, key: ROCK, tint: 0xffffff, gain: RG });   // the flat stone at the ring's heart
  S.drift(1.0, 0.6, 0.5, 0.9, 0.3); }
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
flushArch();
return { WAYHUT, CABIN };
}
/* where the tree mass plants nothing (the tool's `noTrees`, kingdom squares): round the two huts, the den, the pond
   (a snow pine is a CLUMP of trunks metres wide: one planted three squares off still stood a trunk in a hut's doorway, so the zones are wide) */
const noTrees = [[48.6, 1, 55, 9], [1, 3, 9, 9], [30.5, 9.5, 36, 14.5], [86, 3, 93.5, 9]];
module.exports = { build, noTrees };
