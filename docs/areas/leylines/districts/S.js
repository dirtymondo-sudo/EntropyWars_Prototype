/* LEYLINES · district S · STONEHENGE (9 plots: P06..P08 x rows 00..02; squares x 72..107, y 0..35) — the zone's PILOT district.
   One thread a file; the tool (bake-leylines.js) calls the stages below with this district's ctx. Rules: docs/notes/areas-complexes.md
   "LEYLINES ON PLOTS" + "LEYLINES, THE ZONE KIT". The circle's middle is A.henge (a corner where four squares meet); every stone is a blocker
   on a square's middle.
   STANDS TODAY (first build): the chalk bank and the ditch (two rings, about 80 and 95 m across, open to the north-east and the south); the
   Sarsen Circle (30 sarsens, a lintel ring on the standing side, the south-west quarter fallen); the five trilithons in a horseshoe open to the
   south, the great one at the back; twelve bluestones; the altar; three station stones; the Avenue to the north-east and the Heel Stone; the Long
   Barrow and three round barrows; the Solstice Camp; Room 56's frame by the South Gate; sheep, crows; the old Plain's three people and lines.
   PASS 1, EXTERIORS (the pilot): the fallen quarter is real fallen sarsens with their lintels lying by them; the 56 Aubrey holes (chalk spots
   inside the bank: Room 56's own number); the Avenue runs between two low banks, the Slaughter Stone lies in its mouth; two portal stones at
   the South Gate; five barrows now (two more on the Plain), each in its ring ditch.
   PASS 2, INTERIORS: THE LONG BARROW is walked into (the district's one inside): a grass mound 31 m long over a stone-lined passage, a stone
   front with its doorway at the east end; inside, three pairs of standing slabs make side chambers (the dead, urns, bones, a sealed coffer),
   torches down the passage, and at the far end the frame of the old draught "down the line" (the old link's mouth: a place now, not a door).
   PASS 3, DRESSING (the lists read first: FITS THIS DISTRICT in the notes): the Solstice Camp is a camp (a wagon, four tents, prayer flags and
   string lights between poles, bedrolls, packs, a wood pile, a table, drums and a harp, a dog); the visitors' side of the real place as a few
   pieces (a rope line along the fork, three plaques, a trail sign, a rack of leaflets by Room 56's frame, a horse at a rail); the Plain has
   wild flowers at the barrows' feet, bushes, rabbits, two cows, a goat on a barrow, butterflies, an eagle turning over the stones, an owl on
   a station stone, more crows; candles and two candelabra at the altar, ward totems at the Heel Stone; lantern posts at the Long Barrow.
   PASS 4, ATMOSPHERE: the air by place (pale motes inside the bank, fireflies over the barrows and the camp, a little dust on the Plain);
   torches up the Avenue and at the trilithons' feet, two more fires at the Heel Stone, so the stones are lit after
   dark; a shaft of light on the altar. Seen by day and at 22:30.
   NOT YET: see the pass list at the end of this file's section in the notes. */
'use strict';
/* two more round barrows on the Plain (squares; the tool adds them to the heights). The first three are the layout's own (A.barrows). */
const MORE = [[80, 28], [86, 33]];
exports.hills = MORE.map(b => ({ x: b[0] + 0.5, y: b[1] + 0.5, r: 2.8, flat: 0.7, h: 1.9 }));
const RING = (() => { const o = [[0.5, 5.5], [1.5, 5.5], [2.5, 4.5], [3.5, 4.5], [4.5, 3.5], [4.5, 2.5], [5.5, 1.5], [5.5, 0.5]], all = [];
    [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(s => o.forEach(q => all.push([q[0] * s[0], q[1] * s[1]])));
    return all.filter(q => !(q[0] === 3.5 && q[1] === -4.5) && !(q[0] === 4.5 && q[1] === -3.5)).sort((a, b) => Math.atan2(a[1], a[0]) - Math.atan2(b[1], b[0])); })();
const FALLEN = q => q[0] < 0 && q[1] > 0 && (Math.round(q[0] * 2 + q[1] * 3) % 3 !== 0);   // the south-west quarter: two stones in three are down
/* the ground: the plan's square rings are cleared, the bank's chalk and the Avenue are stamped round (the tool's half-square paint) */
exports.plan = ctx => { const { A, cell } = ctx, h = A.henge;
    ctx.setRect(A.longbarrow[0], A.longbarrow[1], A.longbarrow[2], A.longbarrow[3], 'p');   // the Long Barrow's earth floor (the mound is drawn over the building)
    for (let y = 0; y < 36; y++) for (let x = 72; x < 108; x++) { const d = Math.hypot(x + 0.5 - h.x, y + 0.5 - h.y), ch = cell[y][x];
        if (ch === 'c' && !(x >= 91 && x < 93 && y >= 18)) cell[y][x] = 'g'; if (ch === 'p' && d > h.ditch - 1.6 && d < h.ditch + 1.3) cell[y][x] = 'g'; } };
exports.paint = ctx => { const { A, C, gx, gz } = ctx, h = A.henge, X = gx(h.x), Z = gz(h.y), R = h.bank * C;
    const seg = (x, z, ax, az, bx, bz) => { const dx = bx - ax, dz = bz - az, t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz))); return Math.hypot(x - ax - t * dx, z - az - t * dz); };
    ctx.stamp((x, z) => { const d = Math.hypot(x - X, z - Z), a = (Math.atan2(z - Z, x - X) * 180 / Math.PI + 360) % 360;
        if (seg(x, z, X + 15, Z - 15, gx(107), gz(1)) < 3.6 && d > 21) return 'marble_light';                       // THE AVENUE
        if (x > gx(A.longbarrow[0]) && x < gx(A.longbarrow[2]) + 3.5 && z > gz(A.longbarrow[1]) && z < gz(A.longbarrow[3])) return 'dirt_2';   // the Long Barrow's earth floor + its doorstep
        if (Math.abs(d - R) < 2.4 && !(a > 303 && a < 327) && !(a > 80 && a < 100)) return 'marble_light';       // the bank's chalk crest
        if (Math.abs(d - (R - 6.2)) < 1.0 && Math.abs(((a + 3.2) % (360 / 56)) - 3.2) < 1.35) return 'marble_light';   // THE 56 AUBREY HOLES
        return null; }); };
exports.build = ctx => {
    const { A, C, feat, look, gx, gz } = ctx, h = A.henge, X = gx(h.x), Z = gz(h.y);
    const arc = (r, a0, a1) => { const pts = []; for (let a = a0; a <= a1 + 0.01; a += 5) pts.push([ctx.r2(X + r * Math.cos(a * Math.PI / 180)), ctx.r2(Z + r * Math.sin(a * Math.PI / 180))]); return pts; };
    /* THE BANK + THE DITCH: open to the north-east (the Avenue) and to the south (the fork up from the line) */
    [[100, 303], [327, 440]].forEach(q => { feat({ k: 'ridge', pts: arc(h.bank * C, q[0], q[1]), w: 10, h: 1.0 }); feat({ k: 'ridge', pts: arc(h.ditch * C, q[0], q[1]), w: 9, h: -0.9 }); });
    /* THE AVENUE's two banks, from the henge's own bank out to the corner */
    { const ax = X + 31, az = Z - 31, bx = gx(106.5), bz = gz(1.5), n = Math.hypot(bx - ax, bz - az), px = -(bz - az) / n * 6.2, pz = (bx - ax) / n * 6.2;
      [1, -1].forEach(sd => feat({ k: 'ridge', pts: [[ctx.r2(ax + sd * px), ctx.r2(az + sd * pz)], [ctx.r2(bx + sd * px), ctx.r2(bz + sd * pz)]], w: 4.5, h: 0.55 })); }
    /* every barrow in its ring ditch */
    A.barrows.concat(MORE).forEach(b => { const pts = []; for (let a = 0; a <= 360; a += 20) pts.push([ctx.r2(ctx.cx(b[0]) + 12.5 * Math.cos(a * Math.PI / 180)), ctx.r2(ctx.cz(b[1]) + 12.5 * Math.sin(a * Math.PI / 180))]); feat({ k: 'ridge', pts, w: 3.5, h: -0.45 }); });
    /* the fallen quarter's lintels, lying where they dropped, and THE SLAUGHTER STONE in the Avenue's mouth (drawn; knee-high, walked over) */
    look('henge:fallen', X, Z, 0, a => { [[-13.5, 21.5, 25], [-21, 13, 100], [-17.5, 18.5, 60], [-9, 23.5, 170], [-24, 8.5, 80]].forEach(q => a.box(q[0], 0, q[1], 4.6, 0.7, 1.1, 'rock_wall_1', 0xc4c4bc, { ry: q[2] }));
        a.box(25.5, 0, -25.5, 6.4, 0.55, 2.1, 'rock_wall_1', 0xb8b4aa, { ry: 45 }); });
    /* THE LINTELS: one stone across each pair of standing neighbours (drawn; the sarsens under it are the blockers) */
    look('henge:lintels', X, Z, 0, a => { for (let i = 0; i < RING.length; i++) { const p = RING[i], q = RING[(i + 1) % RING.length]; if (FALLEN(p) || FALLEN(q)) continue;
        const dx = (q[0] - p[0]) * C, dz = (q[1] - p[1]) * C, len = Math.hypot(dx, dz); if (len > 6) continue;
        a.box((p[0] + q[0]) / 2 * C, 4.25, (p[1] + q[1]) / 2 * C, len + 1.3, 0.75, 1.15, 'rock_wall_1', 0xd0d0c8, { ry: -Math.atan2(dz, dx) * 180 / Math.PI, under: true }); } });
};
/* THE LONG BARROW (pass 2): squares A.longbarrow (8 x 3), its front on the east end. Frame of its parts: x across the front, +z out of the door. */
function longBarrow(ctx) {
    const { A, C, building, put, Pm, cx, cz, taken } = ctx, q = A.longbarrow, ROCK = 'rock_wall_1', TURF = 'grass_2';
    const B = building('longbarrow', [q[0], q[1], q[2], q[3], 'E'], 3.2, { leaf: 'leaf_frame_only', keyIn: ROCK, floorIn: 'dirt_2', door: 4 }, (a, w, d, door) => {
        a.shell(w, 3.2, d, ROCK, 0xb8b4a8, door, [3.5, 3.5]);
        /* the mound: three turf domes run together, lower toward the tail (hidden with HIDE ROOFS, as a roof) */
        a.dome(0, 0, 2.5, w / 2 + 4.6, 5.8, TURF, 0xa8c088, { rz: 10.5, seg: 16, rings: 6, roof: true, gain: 1.5 });
        a.dome(0, 0, -5, w / 2 + 4.4, 5.5, TURF, 0xa8c088, { rz: 10.5, seg: 16, rings: 6, roof: true, gain: 1.5 });
        a.dome(0, 0, -11.5, w / 2 + 4.0, 5.0, TURF, 0xa8c088, { rz: 9, seg: 16, rings: 6, roof: true, gain: 1.5 });
        /* the stone front: big slabs either side of the doorway, a capstone over it */
        [-4.3, -2.6, 3.0, 4.6].forEach((x, i) => a.box(x, 0, d / 2 + 0.45, 1.5, 3.6 - (i % 2) * 0.5, 0.8, ROCK, 0xc4c0b4, { ry: (i % 2 ? 6 : -5) }));
        a.box(door.lx, 2.25, d / 2 + 0.5, door.cw + 2.4, 0.8, 1.3, ROCK, 0xb0aca0, { under: true });
        a.box(door.lx - door.cw / 2 - 0.45, 0, d / 2 + 0.5, 0.7, 2.3, 1.1, ROCK, 0xbcb8ac); a.box(door.lx + door.cw / 2 + 0.45, 0, d / 2 + 0.5, 0.7, 2.3, 1.1, ROCK, 0xbcb8ac);
        /* inside: the slabs that part the side chambers, the passage's roof beams, the draught's frame at the far end */
        [7, 0, -7].forEach(z => { [-1, 1].forEach(sd => a.box(sd * (w / 2 - 1.6), 0, z, 2.9, 2.7, 0.55, ROCK, 0xa8a498)); a.box(0, 2.75, z, w - 0.4, 0.42, 0.9, ROCK, 0x98948a, { under: true }); });
        a.box(-0.95, 0, -d / 2 + 0.45, 0.45, 2.5, 0.5, ROCK, 0x8a867c); a.box(0.95, 0, -d / 2 + 0.45, 0.45, 2.5, 0.5, ROCK, 0x8a867c); a.box(0, 2.5, -d / 2 + 0.45, 2.6, 0.45, 0.6, ROCK, 0x8a867c);
        a.box(0, 0, -d / 2 + 0.2, 1.45, 2.5, 0.1, null, 0x050505);
    });
    /* the chambers (lz: +14 = the door, -14 = the tail; lx: -5.25 .. 5.25) */
    put(B, 'sarcophagus', -3.4, 3.5, { face: 0 }); put(B, 'skull_pile', 3.6, 3.6); put(B, 'stone_urn', 3.9, 10.6); put(B, 'stone_urn', 2.9, 11.6, { h: 0.8 }); put(B, 'greek_amphora', -3.8, 10.8);
    put(B, 'trap_sarcophagus_box', 3.4, -3.5, { face: 0 }); put(B, 'skull_pile', -3.6, -3.4); put(B, 'cattle_skull', -2.4, -4.4, { y: 0.02 });   // (no loose `skull` / `femur` / `ulna`: those spell props are half a million triangles each)
    put(B, 'sea_chest', -3.5, -10.6, { face: 90 }); put(B, 'paper_sheet', -2.4, -10.2, { y: 0.02 }); put(B, 'stone_urn', 3.6, -10.4);
    put(B, 'candle_ring', 0, -11.2); put(B, 'psx_cobweb_1', -4.6, 12.6, { y: 2.2 }); put(B, 'psx_cobweb_2', 4.6, -12.6, { y: 2.2 }); put(B, 'psx_cobweb_4', 4.5, 5.6, { y: 2.1 });
    [[-1.9, 9.6], [1.9, 2.4], [-1.9, -4.6], [1.9, -9.4]].forEach(p => put(B, 'cave_torch', p[0], p[1]));
}
exports.dress = ctx => {
    longBarrow(ctx);
    const { A, C, P, Pm, dec, tree, gx, gz, cx, cz, taken, rnd } = ctx, h = A.henge, X = gx(h.x), Z = gz(h.y), sq = (dx, dy) => [h.x + dx - 0.5, h.y + dy - 0.5];
    /* THE SARSEN CIRCLE */
    RING.forEach(q => { const s = sq(q[0], q[1]), face = Math.round(90 - Math.atan2(-q[1], q[0]) * 180 / Math.PI);
        if (FALLEN(q)) { P(rnd() < 0.5 ? 'hw_stone_2' : 'hw_stone_4', s[0], s[1], { h: 1.4, face: Math.round(rnd() * 360) }); dec('cave_stone', s[0], s[1]); }
        else P('sarsen', s[0], s[1], { face, h: 4.4 }); });
    /* THE TRILITHONS: a horseshoe open to the south, the great one at the back (each fills two squares) */
    [[-8.75, -7, 90], [8.75, -7, 90], [-8.75, 7, 90], [8.75, 7, 90]].forEach(q => { Pm('trilithon', X + q[0], Z + q[1], { face: q[2] }); [-1.75, 1.75].forEach(o => taken.add(Math.floor(h.x + q[0] / C) + ':' + Math.floor(h.y + (q[1] + o) / C))); });
    Pm('trilithon', X, Z - 12.25, { face: 0, h: 7.4 }); taken.add((h.x - 1) + ':' + (h.y - 4)); taken.add(h.x + ':' + (h.y - 4));
    /* the bluestones, the altar, the station stones, the Heel Stone */
    [[1.5, -3.5], [-1.5, -3.5], [3.5, -1.5], [3.5, -0.5], [3.5, 0.5], [3.5, 1.5], [-3.5, -1.5], [-3.5, -0.5], [-3.5, 0.5], [-3.5, 1.5], [1.5, 3.5], [-1.5, 3.5]].forEach(q => { const s = sq(q[0], q[1]); P('menhir', s[0], s[1], { h: 2.0, face: Math.round(rnd() * 360) }); });
    Pm('stone_altar', X, Z - 5.25, { face: 0 }); taken.add((h.x - 1) + ':' + (h.y - 2)); taken.add(h.x + ':' + (h.y - 2));
    [[84, 10], [99, 25], [84, 25]].forEach(q => P('menhir', q[0], q[1], { h: 1.6 }));
    P('sarsen', 103, 8, { h: 4.8, face: 40 });
    /* THE SOUTH GATE: two fires where the fork comes through the bank */
    P('brazier', 89, 30); P('brazier', 94, 30); P('sarsen', 90, 29, { h: 3.6, face: 80 }); P('sarsen', 93, 29, { h: 3.6, face: 100 }); P('signpost', 90, 34, { face: 180 }); P('signpost', 100, 13, { face: 45 });
    /* THE LONG BARROW's stone front (its east end) + the round barrows' kerb stones */
    P('sarsen', 81, 2, { h: 3.0, face: 90 }); P('sarsen', 81, 4, { h: 3.0, face: 90 }); P('menhir', 82, 2, { h: 1.8 }); P('menhir', 82, 5, { h: 1.8 });
    A.barrows.concat(MORE).forEach(b => { dec('cave_stone', b[0] - 2, b[1] + 2); dec('cave_stone', b[0] + 2, b[1] - 2); dec('psxg_rock_1', b[0] + 2, b[1] + 2, { h: 0.7 }); });
    /* THE SOLSTICE CAMP (the old Plain's fire and instruments) */
    { const c = A.camp; P('campfire', c.x, c.y); P('camping_tent', c.x - 2, c.y - 1, { face: 100 }); P('camping_tent', c.x + 2, c.y + 1, { face: 250 }); P('fallen_log', c.x, c.y + 2, { face: 0 });
      dec('instrument_drum', c.x - 1, c.y + 1); dec('instrument_guitar_lying', c.x + 1, c.y - 1); dec('instrument_tambourine', c.x + 1, c.y + 1); dec('instrument_maracas', c.x - 1, c.y - 1); dec('instrument_seed_pod', c.x, c.y - 1);
      P('sea_chest', c.x + 3, c.y - 1, { face: 200 }); dec('paper_sheet', c.x + 3, c.y, { y: 0.01 }); }
    /* sheep on the Plain, crows on the lintels */
    [[75, 27], [78, 28], [80, 26], [83, 30], [79, 33], [86, 32], [74, 9], [78, 10], [106, 22], [105, 28]].forEach(q => dec('decor_sheep', q[0], q[1]));
    [[4.5, 2.5], [5.5, -0.5], [-2.5, -4.5]].forEach(q => Pm('crow', X + q[0] * C, Z + q[1] * C, { y: 5.05, face: Math.round(rnd() * 360) }));
    [[72, 0], [73, 7], [72, 17], [73, 34], [107, 34]].forEach((q, i) => tree(q[0], q[1], i % 2 ? 'tree_3' : 'tree_5', 6 + (i % 3)));
    dressing(ctx);
    atmosphere(ctx);
};
/* PASS 3, THE DRESSING (its own stage call from dress, after the first build's pieces so their dice do not move) */
function dressing(ctx) {
    const { A, C, P, Pm, dec, tree, gx, gz, cx, cz, rnd } = ctx, h = A.henge, X = gx(h.x), Z = gz(h.y), c = A.camp;
    /* THE SOLSTICE CAMP */
    P('covered_wagon', c.x - 4, c.y + 2, { face: 70 }); ctx.taken.add((c.x - 5) + ':' + (c.y + 2));
    P('canvas_tent', c.x + 1, c.y - 3, { face: 180 }); P('camping_tent', c.x - 3, c.y - 3, { face: 150 }); P('picnic_table', c.x + 3, c.y + 3, { face: 20 }); P('firewood_stack', c.x - 2, c.y + 4, { face: 90 }); P('axe_chopping_block', c.x - 1, c.y + 4);
    P('wooden_barrel', c.x + 4, c.y - 2); P('cauldron', c.x + 1, c.y + 1); dec('sleeping_bag', c.x - 1, c.y - 2); dec('sleeping_bag', c.x + 2, c.y - 1); dec('sleeping_bag', c.x - 2, c.y + 1); dec('fur_rug', c.x + 1, c.y + 2, { y: 0.02 });
    P('backpack', c.x + 3, c.y); dec('beach_cooler', c.x + 4, c.y + 2); dec('directors_chair', c.x - 1, c.y + 2); dec('directors_chair', c.x + 2, c.y + 2); dec('taiko_drum', c.x, c.y - 2); dec('instrument_harp', c.x - 3, c.y); dec('dog', c.x + 1, c.y + 4);
    [[c.x - 3, c.y - 1, c.x + 3, c.y - 2], [c.x + 3, c.y - 2, c.x + 4, c.y + 3]].forEach((q, i) => { const mx = (cx(q[0]) + cx(q[2])) / 2, mz = (cz(q[1]) + cz(q[3])) / 2, f = Math.round(Math.atan2(cz(q[3]) - cz(q[1]), cx(q[2]) - cx(q[0])) * -180 / Math.PI);
        Pm(i ? 'string_lights' : 'prayer_flags', mx, mz, { face: f, span: 6 }); });
    P('tiki_torch', c.x - 3, c.y - 1); P('tiki_torch', c.x + 4, c.y + 4);
    /* the visitors' side: a rope line up the fork, plaques, the leaflets */
    for (let y = 31; y < 36; y++) { dec('rope_stanchion', 90, y); dec('rope_stanchion', 93, y); }
    P('lesson_sign', 95, 31, { face: 200 }); P('lesson_sign', 104, 7, { face: 230 }); P('lesson_sign', 83, 5, { face: 110 }); P('trail_sign', 89, 35, { face: 180 }); dec('brochure_rack', 95, 34);
    P('hitching_rail', 96, 35, { face: 0 }); P('horse_brown', 96, 34, { face: 180 });
    /* THE PLAIN: flowers at the barrows' feet, bushes, beasts */
    A.barrows.concat(MORE).forEach((b, i) => { for (let k = 0; k < 4; k++) { const a = (i * 70 + k * 85) * Math.PI / 180, fx = Math.round(b[0] + 3.4 * Math.cos(a)), fy = Math.round(b[1] + 3.4 * Math.sin(a)); if (fx < 72 || fy > 35) continue; dec(['fae_flower_small_pink', 'woods_healflower', 'fae_flower_small_blue', 'fae_flower_small_violet'][(i + k) % 4], fx, fy); } });
    [[73, 11], [78, 20], [76, 27], [84, 30], [106, 30], [98, 3], [88, 2], [107, 20]].forEach(q => P('leafy_bush', q[0], q[1], { h: 1.1 + rnd() * 0.5, face: Math.round(rnd() * 360) }));
    [[77, 15], [79, 24], [82, 27], [85, 35], [88, 30], [99, 28], [105, 25], [86, 4], [95, 2], [107, 12]].forEach(q => dec('rabbit', q[0], q[1]));
    P('cow', 77, 33, { face: 80 }); P('cow', 82, 25, { face: 200 }); P('goat', 75, 23, { face: 130, y: 2.1 }); dec('psxg_dead_bush_1', 73, 14); dec('psxg_dead_bush_1', 78, 32); dec('psxg_dead_bush_1', 106, 3);
    for (let i = 0; i < 8; i++) Pm(i % 2 ? 'monarch' : 'butterfly', cx(76 + (i * 5) % 12), cz(26 + (i * 3) % 8), { h: 0.35, y: 0.7 + (i % 3) * 0.4, face: (i * 67) % 360 });
    Pm('eagle', X, Z, { hover: 16, swim: { r: 26, v: 4, bob: 1.5 } });
    Pm('owl_perched', cx(84), cz(10), { y: 1.6, face: 120 }); [[-4.5, -2.5], [-5.5, 0.5], [0.5, -5.5], [2.5, 4.5]].forEach(q => Pm('crow', X + q[0] * C, Z + q[1] * C, { y: 5.05, face: Math.round(rnd() * 360) })); dec('crow', 100, 10); dec('crow', 81, 6);
    /* the stones' own: candles at the altar, totems at the Heel Stone, lamps at the barrow's door */
    Pm('hw_candles', X - 1.5, Z - 4.2); Pm('hw_candles_2', X + 1.6, Z - 4.3); Pm('candelabra', X - 2.6, Z - 5.25); Pm('candelabra', X + 2.6, Z - 5.25); Pm('ritual_circle', X, Z - 1.2, { y: 0.02 });
    dec('item_ward_totem', 104, 8); dec('item_ward_totem', 102, 7); P('lantern_post', 83, 2, { face: 90 }); P('lantern_post', 83, 6, { face: 90 });
    /* a copse on the west edge */
    [[72, 4], [72, 10], [73, 21], [72, 27], [107, 27]].forEach((q, i) => tree(q[0], q[1], ['tree_52', 'tree_54', 'tree_53', 'tree_55', 'tree_56'][i], 7 + (i % 3)));
}
/* PASS 4, THE ATMOSPHERE */
function atmosphere(ctx) {
    const { A, C, P, Pm, gx, gz, cx, cz } = ctx, h = A.henge, X = gx(h.x), Z = gz(h.y);
    /* (mist in the ditch was tried with the `white_cloud` model laid low: it reads as cartoon clouds parked on the grass. Out. The game has no mist air kind.) */
    /* fire: up the Avenue, at the trilithons' feet, at the Heel Stone */
    [[97, 10], [101, 10], [101, 6], [105, 6]].forEach(q => P('tiki_torch', q[0], q[1]));   // either side of the Avenue's chalk
    [[-5.25, -8.75], [5.25, -8.75], [-5.25, 8.75], [5.25, 8.75]].forEach(q => Pm('cave_torch', X + q[0], Z + q[1]));
    P('brazier', 102, 9); P('brazier', 104, 9);
    Pm('light_shaft', X, Z - 5.25, { face: 200 });
}
exports.airZones = ctx => { const h = ctx.A.henge; return [
    { sx0: h.x - 12, sy0: h.y - 12, sx1: h.x + 12, sy1: h.y + 12, kind: 'motes', color: 0xfff4d0, n: 110, speed: 0.25 },
    { sx0: 72, sy0: 10, sx1: 80, sy1: 36, kind: 'fireflies', n: 60 }, { sx0: 96, sy0: 26, sx1: 108, sy1: 36, kind: 'fireflies', n: 50 },
    { sx0: 72, sy0: 0, sx1: 108, sy1: 36, kind: 'dust', color: 0xe8f0d8, n: 60, speed: 0.3 } ]; };
exports.people = ctx => { const { native, sayOf, OLD } = ctx;
    native('shaman', 92, 22, 200, sayOf(OLD.henge, 'shaman')); native('conspiracy theorist', 77, 19, 90, sayOf(OLD.henge, 'conspiracy theorist')); native('knight', 103, 27, 300, sayOf(OLD.henge, 'knight')); };
