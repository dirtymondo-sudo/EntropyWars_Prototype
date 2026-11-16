/* CAMELOT KINGDOM · THE CASTLE (district K, 8 plots) — the castle's OUTSIDE, on the kingdom's own plots.
   Repo tooling only: bake-camelot.js calls `first(ctx)` right after it has written the hill, before the moat and the town wall.

   THE PLOTS: P02-03 The Keep · P03-03 The Orchard · P04-03 The Great Hall · P05-03 The Kitchen · P02-04 The Stables · P03-04 The Bailey ·
   P04-04 The Lists · P05-04 The Barracks (squares x 24..72, y 36..60). The castle's own ground is wider than its plots: the hill is
   layout.json `castle.hill` [28, 32, 68, 58] (the plan's letter Q), with the Grand Stair south of it and the back stair north.

   WHAT STANDS HERE TODAY (redesign 2, mondo's OK on docs/plans/camelot/camelot_castle_redesign_2.png): the Keep (solid here, 28 m, the
   portal between two turrets, the great window, four corner towers, the Great Spire), the West Wing and the East Wing (solid, a tower on
   each outer corner), the Stables and the Armoury in the lower court (both walked into, furnished), the hill's drums and the stairs'
   cheek walls and gate piers, the Lists (two tilt rails on sand), the courts' dressing (the sword in the stone, braziers, lions,
   fountains, tents, the orchard rows), four doors (portal, kitchen, guard, postern: all into the palace room), four natives.

   NOT HERE: the castle's INSIDE is its own room, `site_prebuilt_camelot_palace`, written by bake-camelot-castle.js. Both belong to the
   castle thread (the board's K row), like this file. The hill itself (plateau, stairs, parapets) is the tool's.

   MISSING / WAITING (from the notes and the board): THE CASTLE IN THE SKY is still the old room and waits mondo (the hatch to it is drawn
   shut in the palace room). Merlin's Undercroft is reached by the postern here and built in the palace room. No anvil, archery target or
   lamp post model exists on R2 (tents, crates, armour stands stand in). The kingdom room's castle has been seen on screen only in part.

   THE HOOKS (bake-camelot.js "THE DISTRICT FILES" lists the whole ctx): squares are the kingdom's (kx, ky), 0..96, a plot = 12 x 12 of them,
   plot Pxx-yy = squares xx*12.. , yy*12.. . gx(k) = a square's west / north edge in metres, gc(k) = its middle. feat(row) writes a terrain row,
   note(text) a heading. put(key, x, y, o, on) stands a catalogue prop on a square's middle; dec(...) the same, scattered and turned by the
   dice; tree(kind, h, x, y, r); native(race, x, y, face, say). They take FREE ground only (grass, snow, marble; `on` names another plan
   letter) and never one square twice: the tool stops and names the square. sheet() = a parts list (box, cyl, roof, shell, crown, tower);
   building(id, [x0, y0, x1, y1], side, h, o, parts) = a texbuilding + its drawn look, returns its frame; inside(B, key, lx, lz, o) = furniture
   in that frame; flushArch() writes the looks made so far.
   Here `put` is inside(): furniture in a building's frame. Layout squares of every piece: ctx.Q (layout.json `castle`); west and east are
   mirror images about square 48 (MX).
   RULES (docs/notes/areas-complexes.md "CAMELOT, THE DISTRICT FILES"): one thread = this one file. Not yours: bake-camelot.js, layout.json,
   the other district files, the hill, the town wall, the moat, the roads, the doors out of the zone, the room's sky and shell (a note on
   the board first: docs/notes/claims.md). After any edit: `node bake-camelot.js`, `node --check data.js`, commit the file AND data.js. */
'use strict';
function first(ctx) {
const { Q, T1, T2, MX, C, WALL, r2, g, mid, feat, note, arch, marks, props, doors, npc, sheet, solid, flushArch, say } = ctx, kq = ctx.building, put = ctx.inside;
const U = n => 'urban:' + n, G_TALL = U('GlassWindowTall1a'), SLATE = U('MetalRoofTiles1a'), WOODK = 'wood_planks', WOODD = 'wood';
const STONE = 0xc4c0b8, STONE2 = 0xaeaaa6, STONE3 = 0xd8d2c6, PALE = 0xdcd6ca, BLUE = 0x4a5c8c, GLASS = 0xa8c4ec, WARM = 0xf0d890, BANNER = 0xb02c36, GOLD = 0xd8b050, TIMBER = 0x4a3626;
note('THE PALACE: the Keep (the Throne Hall), the two wings, the eight towers, the Great Spire');
/* THE KEEP — the tall middle block: the Throne Hall is its ground floor (14 m to its ceiling), 28 m of pale stone to the battlements, a
   blue hipped roof, a tower on each corner, the portal between two turrets under the great window, THE GREAT SPIRE out of the roof */
const KH = 28;
/* (ONE STACKED BUILDING, 2026-11-15: the palace is walked into in its OWN room, site_prebuilt_camelot_palace, bake-camelot-castle.js. Here the
   Keep and the wings are solid: their doors are this room's doors, and the wicket in each is shut by a drawn leaf behind the door's own.) */
const KEEP = kq('keep', Q.keep, 'S', 14, { hollow: false, leaf: undefined, leafDouble: undefined, keyIn: undefined, floorIn: undefined }, (a, w, d, door) => {
    a.box(door.lx, 0, d / 2 + 0.02, door.cw, 2.2, 0.06, WOODK, TIMBER);
    a.shell(w, 14, d, WALL, PALE, door); a.box(0, 14, 0, w + 0.1, KH - 14, d + 0.1, WALL, PALE, { top: false, under: true });
    a.box(0, 0, 0, w + 0.8, 1.2, d + 0.8, WALL, STONE2, { faces: 'blr' });
    for (const y of [13.6, 20.8]) a.box(0, y, 0, w + 0.6, 0.5, d + 0.6, WALL, STONE3, { under: true });
    a.box(0, KH - 0.7, 0, w + 1.1, 0.7, d + 1.1, WALL, STONE3, { under: true }); a.box(0, KH, 0, w + 0.6, 0.3, d + 0.6, WALL, 0x8c8a88, { roof: true }); a.crown(w + 0.6, d + 0.6, KH + 0.3, WALL, PALE);
    a.roof('hip', 0, KH + 0.3, 0, w - 3, 11, d - 3, SLATE, BLUE);
    /* the lights: three rows on the front and the back, the sides where the wings leave the wall free */
    const light = (x, y, z, h, side) => { if (side) { a.box(x, y, z, 0.12, h, 1.5, G_TALL, WARM, { glow: 0.55 }); a.box(x, y + h, z, 0.4, 0.4, 2.0, WALL, STONE3); } else { a.box(x, y, z, 1.5, h, 0.12, G_TALL, WARM, { glow: 0.55 }); a.box(x, y + h, z, 2.0, 0.4, 0.4, WALL, STONE3); } };
    for (const [y, h] of [[3, 6], [15.2, 5], [22.4, 3.6]]) { for (const x of [12, 18]) for (const s of [-1, 1]) light(s * x, y, d / 2 + 0.08, h);
        for (const x of [-18, -12, -6, 0, 6, 12, 18]) light(x, y, -d / 2 - 0.08, h);
        for (const s of [-1, 1]) for (const z of (y > 20 ? [-17.5, -10.5, -3.5, 3.5, 10.5, 17.5] : [-17.5, 17.5])) light(s * (w / 2 + 0.08), y, z, h, true); }
    for (const x of [-21.5, -15, 15, 21.5]) a.box(x, 0, d / 2 + 0.35, 1.3, KH - 1.2, 0.7, WALL, STONE3);                    // the front's buttresses
    for (const x of [-21, -15, -9, -3, 3, 9, 15, 21]) a.box(x, 0, -d / 2 - 0.35, 1.2, KH - 1.2, 0.7, WALL, STONE3);
    for (const s of [-1, 1]) { a.box(s * 15, 8.5, d / 2 + 0.74, 1.5, 6.5, 0.08, null, BANNER); a.box(s * 15, 12.4, d / 2 + 0.79, 0.7, 0.7, 0.05, null, GOLD); }
    /* the portal: two turrets, the gatehouse block over the way in, the great doors (the doorway itself is the wicket in them), the great window */
    for (const s of [-1, 1]) a.tower(s * 8, d / 2 + 1.5, 2.2, 0, 22, 8, STONE3);
    for (const s of [-1, 1]) a.box(s * 5.0, 0, d / 2 + 1.3, 1.6, 6.2, 2.6, WALL, STONE3);
    a.box(0, 6.2, d / 2 + 1.3, 11.6, 7.2, 2.6, WALL, STONE3, { under: true }); a.crown(11.6, 2.6, 13.4, WALL, STONE3);
    a.P.slice(-4).forEach(p => { p.p = [p.p[0], p.p[1], r2(p.p[2] + d / 2 + 1.3)]; });                                         // the block's own battlements stand on the block
    a.box(door.lx, 2.2, d / 2 + 0.07, door.cw + 0.1, 3.6, 0.1, WOODK, TIMBER); for (const s of [-1, 1]) a.box(door.lx + s * (door.cw / 2 + 0.95), 0, d / 2 + 0.07, 1.9, 5.8, 0.1, WOODK, TIMBER);
    for (const s of [-1, 1]) for (const y of [1.2, 3.0, 4.8]) a.box(door.lx + s * (door.cw / 2 + 0.95), y, d / 2 + 0.13, 1.9, 0.14, 0.04, null, 0x2a2c30);
    a.box(0, 15, d / 2 + 0.09, 5.4, 7, 0.12, G_TALL, 0xf4dc98, { glow: 0.75 }); a.box(0, 22, d / 2 + 0.09, 3.8, 1.3, 0.12, G_TALL, 0xf4dc98, { glow: 0.75 }); a.box(0, 23.3, d / 2 + 0.09, 2.0, 0.9, 0.12, G_TALL, 0xf4dc98, { glow: 0.75 });
    a.box(0, 14.4, d / 2 + 0.3, 6.6, 0.6, 0.6, WALL, STONE3); for (const s of [-1, 1]) a.box(s * 3.0, 15, d / 2 + 0.25, 0.5, 7.2, 0.5, WALL, STONE3); for (const x of [-0.9, 0.9]) a.box(x, 15, d / 2 + 0.2, 0.16, 7, 0.16, WALL, STONE2);
    /* the four corner towers */
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) a.tower(sx * w / 2, sz * d / 2, 3.4, 0, 34, 12, PALE);
    /* THE GREAT SPIRE: a round tower out of the roof's middle, four bartizans on it, the tallest cone in the kingdom */
    a.tower(0, 0, 5.5, KH + 2, 22, 20, PALE);
    a.cyl(0, KH + 14, 0, 1.3, 10, WALL, PALE, { seg: 10, ring: { n: 4, r: 5.7, a0: 45 }, roof: true }); a.cyl(0, KH + 24, 0, 1.75, 5.5, SLATE, BLUE, { seg: 10, r2: 0, roof: true, ring: { n: 4, r: 5.7, a0: 45 } });
    a.box(0, KH + 12, 0, 1.4, 3.4, 0.12, G_TALL, 0xf4dc98, { glow: 0.8, ring: { n: 4, r: 5.53, a0: 0 }, roof: true });
});
/* A WING — two tall storeys of hall under a steep blue roof, a tower on each outer corner (the rear one the taller, so all eight show from
   the Market); `out` = which side is its free end (-1 west, 1 east), so the two are mirror images */
const wing = (id, q, out, o) => kq(id, q, 'S', 7, o, (a, w, d, door) => {
    a.box(door.lx, 0, d / 2 + 0.02, door.cw, 2.2, 0.06, WOODK, TIMBER);
    a.shell(w, 7, d, WALL, STONE, door); a.box(0, 7, 0, w + 0.1, 7, d + 0.1, WALL, STONE, { top: false, under: true });
    a.box(0, 0, 0, w + 0.7, 1.1, d + 0.7, WALL, STONE2, { faces: 'blr' }); a.box(0, 6.7, 0, w + 0.5, 0.45, d + 0.5, WALL, STONE3, { under: true });
    a.box(0, 13.4, 0, w + 0.9, 0.6, d + 0.9, WALL, STONE3, { under: true }); a.box(0, 14, 0, w + 0.5, 0.3, d + 0.5, WALL, 0x8c8a88, { roof: true }); a.crown(w + 0.5, d + 0.5, 14.3, WALL, STONE);
    a.roof('hip', 0, 14.3, 0, w - 2.4, 9, d - 2.4, SLATE, BLUE);
    for (const [y, h] of [[2.4, 3.4], [8.6, 3.6]]) { for (const x of [-9.8, -4.9, 4.9, 9.8]) { a.box(x, y, d / 2 + 0.08, 1.4, h, 0.12, G_TALL, WARM, { glow: 0.5 }); a.box(x, y + h, d / 2 + 0.2, 1.9, 0.4, 0.4, WALL, STONE3); a.box(x, y, -d / 2 - 0.08, 1.4, h, 0.12, G_TALL, WARM, { glow: 0.5 }); }
        for (const z of [-7, 0, 7]) a.box(out * (w / 2 + 0.08), y, z, 0.12, h, 1.4, G_TALL, WARM, { glow: 0.5 }); }
    for (const x of [-12.2, -7.3, 7.3, 12.2]) a.box(x, 0, d / 2 + 0.3, 1.0, 13.2, 0.6, WALL, STONE2);
    a.box(door.lx, 2.3, d / 2 + 0.5, 4.6, 0.5, 1.2, WALL, STONE3, { under: true }); for (const s of [-1, 1]) a.box(door.lx + s * 2.0, 0, d / 2 + 0.6, 0.6, 2.3, 0.6, WALL, STONE3);
    for (const s of [-1, 1]) a.box(door.lx + s * 3.6, 3.2, d / 2 + 0.1, 1.2, 4.2, 0.08, null, BANNER);
    a.box(-out * (w / 2 - 3), 14.3, -d / 2 + 3, 2.2, 10.5, 2.2, WALL, STONE2, { roof: true }); a.box(-out * (w / 2 - 3), 24.8, -d / 2 + 3, 2.7, 0.5, 2.7, WALL, STONE3, { roof: true });
    a.tower(out * w / 2, d / 2, 4.2, 0, 24, 11, STONE); a.tower(out * w / 2, -d / 2, 3.6, 0, 30, 10, STONE);
});
const WEST = wing('west_wing', Q.westWing, -1, { hollow: false, leaf: undefined, leafDouble: undefined, keyIn: undefined, floorIn: undefined }), EAST = wing('east_wing', Q.eastWing, 1, { hollow: false, leaf: undefined, leafDouble: undefined, keyIn: undefined, floorIn: undefined });
/* what the towers weigh */
[[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach((c, i) => solid('keep_tower_' + i, KEEP.at(c[0] * KEEP.fw / 2, c[1] * KEEP.fd / 2), 4.4, 3));
[-1, 1].forEach((s, i) => solid('door_turret_' + i, KEEP.at(s * 8, KEEP.fd / 2 + 1.5), 2.8, 3));
[[WEST, -1], [EAST, 1]].forEach(([B, out], i) => { solid('wing_tower_f' + i, B.at(out * B.fw / 2, B.fd / 2), 5.4, 3); solid('wing_tower_r' + i, B.at(out * B.fw / 2, -B.fd / 2), 4.6, 3); });

note('THE LOWER COURT: the Stables (west) and the Armoury (east), a mirrored pair');
/* the pair: a stone block under a blue gable, the same on both sides; the Stables keep their stable door and their hay loft's hatch, the Armoury its shields */
const lodge = (id, q, side, o, extra) => kq(id, q, side, 5.25, o, (a, w, d, door) => {
    a.shell(w, 5.25, d, WALL, STONE, door); a.box(0, 0, 0, w + 0.5, 1.0, d + 0.5, WALL, STONE2, { faces: 'blr' });
    a.roof('gable', 0, 5.25, 0, d + 1.6, 4.2, w + 1.6, SLATE, BLUE, { ry: 90, keyEnd: WALL, tintEnd: STONE });
    a.box(0, 4.95, 0, w + 0.7, 0.35, d + 0.7, WALL, STONE3, { under: true, top: false });
    for (const s of [-1, 1]) { a.box(s * (w / 2 - 0.5), 0, d / 2 + 0.3, 1.0, 4.9, 0.6, WALL, STONE2); a.box(s * 4.2, 1.6, d / 2 + 0.08, 1.3, 2.0, 0.12, G_TALL, WARM, { glow: 0.45 }); }
    a.box(door.lx, 2.3, d / 2 + 0.45, 3.6, 0.45, 1.0, WALL, STONE3, { under: true });
    extra(a, w, d, door);
});
const STABLES = lodge('stables', Q.stables, 'E', { leaf: 'leaf_stable', leafDouble: false, keyIn: WOODK, floorIn: 'dirt_2' }, (a, w, d, door) => {
    a.box(door.lx, 5.6, d / 2 + 0.1, 1.6, 1.8, 0.1, WOODK, TIMBER); a.box(door.lx, 7.6, d / 2 + 0.7, 0.2, 0.2, 1.4, WOODD, TIMBER); });
const ARMOURY = lodge('armoury', Q.armoury, 'W', { leafDouble: false }, (a, w, d, door) => {
    [[-2.6, 0x2c4a9a], [2.6, BANNER]].forEach(([x, c]) => { a.box(door.lx + x, 2.9, d / 2 + 0.1, 1.0, 1.2, 0.1, null, c); a.box(door.lx + x, 3.3, d / 2 + 0.16, 0.34, 0.34, 0.05, null, GOLD); });
    a.box(door.lx, 5.7, d / 2 + 0.1, 0.16, 1.9, 0.06, null, 0xb8bcc4); a.box(door.lx, 6.2, d / 2 + 0.1, 0.9, 0.14, 0.06, null, 0xb8bcc4); });

/* ── THE HILL'S OWN LOOK (a row with its foot on the village's ground): the drums on its four corners and beside the Grand Stair, the
   stair's cheek walls, the tilt's rails, the gate piers of the three stairs ── */
{ const a = sheet(), cx = MX, cz = g(45.5), L = (x, z) => [r2(x - cx), r2(z - cz)];
  const drum = (id, x, z, r, h, side) => { const p = L(x, z); a.cyl(p[0], 0, p[1], r, h, WALL, STONE2, { seg: 18 }); a.cyl(p[0], h - 0.5, p[1], r + 0.3, 0.5, WALL, STONE3, { seg: 18 });
      a.box(p[0], h, p[1], 0.9, 0.9, 0.45, WALL, STONE2, { ring: { n: Math.round(r * 2.6), r: r - 0.1 } }); solid(id, [r2(x), r2(z)], side, 1); };
  [[Q.hill[0], Q.hill[1]], [Q.hill[2], Q.hill[1]], [Q.hill[0], Q.hill[3]], [Q.hill[2], Q.hill[3]]].forEach((c, i) => drum('hill_drum_' + i, g(c[0]), g(c[1]), 4.2, T1 + 0.1, 5.6));
  const sx0 = g(Q.grandStair[0]), sx1 = g(Q.grandStair[2]), sz = g(Q.hill[3]);
  [sx0 - 3.4, sx1 + 3.4].forEach((x, i) => { drum('stair_drum_' + i, x, sz, 3.2, T1 + 0.1, 4.2); const p = L(x, sz);
      a.cyl(p[0], T1 + 0.1, p[1], 0.1, 6, null, 0x403830, { seg: 6 }); a.box(p[0], T1 + 1.4, p[1] + 0.2, 1.3, 4.2, 0.06, null, BANNER, { ds: true }); });
  const NG = Q.grandStair[3] - Q.grandStair[1], NU = Q.upperStair[3] - Q.upperStair[1];
  for (const x of [sx0 - 0.1, sx1 + 0.1]) { const p = L(x, sz); for (let i = 0; i < NG; i++) a.box(p[0], 0, p[1] + 1.75 + i * 3.5, 0.9, r2(T1 * (NG - i - 0.5) / NG + 1.0), 3.5, WALL, STONE2); }   // the Grand Stair's cheek walls, stepping down with it
  { const ux0 = g(Q.upperStair[0]), ux1 = g(Q.upperStair[2]), uz = g(Q.upper[3]);
    for (const x of [ux0 - 0.1, ux1 + 0.1]) { const p = L(x, uz); for (let i = 0; i < NU; i++) a.box(p[0], T1, p[1] + 1.75 + i * 3.5, 0.8, r2((T2 - T1) * (NU - i - 0.5) / NU + 1.0), 3.5, WALL, STONE2);
        const q = L(x, uz + NU * 3.5 + 0.4); a.box(q[0], T1, q[1], 1.2, 2.6, 1.2, WALL, STONE3); a.cyl(q[0], T1 + 2.6, q[1], 0.5, 0.5, null, GOLD, { seg: 8, r2: 0.2 }); } }
  /* THE LISTS: a tilt rail either side of the middle line (red and white, the lances' side), on sand */
  for (const s of [-1, 1]) { const p = L(MX + s * 24.5, g(55)); 
      a.box(p[0] - 9.6, T1 + 0.35, p[1], 1.75, 0.5, 0.05, null, BANNER, { n: 6, step: [3.5, 0, 0], ds: true });
      feat({ k: 'rail', x0: r2(MX + s * 24.5 - 10.5), z0: g(55), x1: r2(MX + s * 24.5 + 10.5), z1: g(55), y: T1 });
      marks.push({ k: 'rect', x: r2(MX + s * 24.5), z: g(55), w: 24.5, d: 7, color: 0xc8b088, a: 0.85 }); }
  arch.push({ k: 'arch', id: 'cam:hill', x: cx, z: cz, y: 0, rot: 0, parts: a.P }); }
flushArch();

/* ── THE INSIDES ── */
/* (the Throne Hall, the Kitchen and the Barracks are furnished in the palace's own room) */
/* the Stables */
for (const [k, x] of [['horse', -4.2], ['horse_brown', 0], ['horse_black', 4.2]]) put(STABLES, k, x, -8.5, { face: 180 }); put(STABLES, 'horse_brown', -4.2, -1, { face: 90 }); put(STABLES, 'meshy_burlap_sack', 5, 6, {}); put(STABLES, 'meshy_burlap_sack', 5.6, 8, { face: 70 }); put(STABLES, 'psx_wooden_crate_3', -5, 8, {});
/* the Armoury: harness on stands down both walls, the racks at the back, the quartermaster's table */
for (const z of [-9, -5, -1, 3]) for (const s of [-1, 1]) put(ARMOURY, 'armour_stand', s * 5.4, z, { face: s < 0 ? 90 : 270 });
put(ARMOURY, 'dojo_weapon_rack', -3, -11.4, { face: 180 }); put(ARMOURY, 'dojo_weapon_rack', 3, -11.4, { face: 180 }); put(ARMOURY, 'map_table', 0, -4, {}); put(ARMOURY, 'sea_chest', -5, 8.5, { face: 90 }); put(ARMOURY, 'psx_wooden_crate_2', 5, 8.5, {}); put(ARMOURY, 'brazier', 0, 4, {});

/* ── THE COURTS (every piece mirrored about the middle line) ── */
const P = (key, kx, ky, o) => props.push(Object.assign({ key, x: g(kx), z: g(ky) }, o || {}));
const both = (key, off, ky, o) => { P(key, 48 - off, ky, o); P(key, 48 + off, ky, o && o.face != null ? Object.assign({}, o, { face: (360 - o.face) % 360 }) : o); };
P('sword_stone', 48, 56.5, { face: 90, h: 2.8, floor: true });
both('brazier', 3.4, 57.4); both('brazier', 2.4, 55.4); both('brazier', 2.6, 49.7); both('lion_statue', 4.4, 50.2, { face: 180 }); both('lion_statue', 3.6, 61.4, { face: 180 });
both('fountain', 11, 50.5); both('iron_garden_bench', 13.2, 50.5, { face: 270 }); both('planter', 8.5, 51.4); both('planter', 14.5, 49.8); both('planter', 5.5, 51.4);
both('armour_stand', 4.6, 57.2, { face: 180 }); both('camping_tent', 9, 53.2, { face: 180 }); both('armour_stand', 6, 53.2, { face: 180 }); both('stocks', 10.5, 57.2, { face: 180 });
for (let i = 0; i < 6; i++) for (const s of [-1, 1]) feat({ k: 'tree', x: g(48 + s * 18.5), z: g(35.5 + i * 3.2), kind: i % 2 ? 'tree_4' : 'tree_2', h: r2(4.6 + (i % 3) * 0.3), r: 0.5 });   // THE ORCHARD, a row down each side of the upper court's foot
both('planter', 1.6, 33); both('brazier', 1.6, 35);

/* ── THE WAYS (the Great Stair and the sally port are doors of this room; the wardrobe and the well are DOOR_HQ.links rows that end here) ── */
{ const PAL = 'site_prebuilt_camelot_palace', way = (id, B, label, sub, desc) => { const p = B.at(B.door.lx, B.fd / 2 + 0.3); doors.push({ id, wall: 'free', x: p[0], z: p[1], face: 180, leaf: 'leaf_shabby_wood', label, sub, action: { room: PAL, at: id }, desc }); };
  way('portal', KEEP, 'CAMELOT CASTLE', 'THE PORTAL · THE THRONE HALL · THE GREAT STAIR', 'The great doors of the Keep, and the man-sized door in them. Everything the castle has is behind this one: the hall, the stair, the king.');
  way('kitchen', WEST, 'CAMELOT CASTLE', 'THE KITCHEN DOOR · THE WEST WING', 'The kitchen door in the West Wing. It smells of bread from here.');
  way('guard', EAST, 'CAMELOT CASTLE', 'THE GUARD DOOR · THE EAST WING', 'The guard room door in the East Wing. Somebody inside is sharpening something.');
  doors.push({ id: 'postern', wall: 'free', x: g(41.5), z: r2(g(Q.hill[3]) + 0.45), face: 180, leaf: 'leaf_shabby_wood', label: 'MERLIN’S UNDERCROFT', sub: 'THE SALLY PORT · UNDER THE HILL',
      action: { room: PAL, at: 'postern' }, desc: 'A low door in the foot of the castle hill, beside the Grand Stair. It goes down under the castle, which the besiegers should have found suspicious.' }); }

/* ── who stands here: the old ward's four, with their own lines, in their new places; a knight in the barracks, two at the stair's head ── */
npc.push({ x: g(44.6), z: g(57.4), face: 180, race: 'knight', say: say('knight') }); npc.push({ x: g(51.4), z: g(57.4), face: 180, race: 'knight' });
npc.push({ x: g(49.6), z: g(56.9), face: 300, race: 'swordfighter', say: say('swordfighter') });
npc.push({ x: g(56.5), z: g(54.2), face: 240, race: 'robinhood', say: say('robinhood') });

}
module.exports = { first };
