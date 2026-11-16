/* ANTARCTICA, DISTRICT S · THE STATION (8 plots: P01-03..P04-03, P01-04..P04-04) — the zone's PILOT district.
   The idea: a research base on the ice, in the game's conspiracy register: painted huts on timber pads, a mast and a radome, a drill that found something.
   Read by bake-antarctica.js (stages: plan / houses / pieces / dress; optional airZones). Squares are the room's (sx, sy).
   PLOTS: The Ice Core (P01-03) · The Huts (P02-03) · The Radio Mast (P03-03) · The Garage (P04-03) · The Tank Farm (P01-04) · The Station Yard (P02-04,
   DOOR HQ's bay door + the spawn: the tool's) · The Flag Line (P03-04) · The Weather Field (P04-04).
   THE PASSES (docs/notes/areas-complexes.md "ANTARCTICA, DISTRICT S"):
   1 EXTERIORS (11-16): every hut its own building (cold porch, chimney, stacks, vents, drifts against the weather walls, snow on the roofs, name boards),
     the radome, the 30 m mast with its stay anchors, the drill rig, the fuel line on trestles, hand lines along the walks, the yard's board.
   2 INTERIORS (11-16): all seven huts lined, vaulted and lit inside and furnished on the squares (`insides`). */
'use strict';
const ORANGE = 0xff8a30, RED = 0xb23a2e, GREEN = 0x3f7a5a, BLUE = 0x3a6a9a, YELLOW = 0xd8a82a, STEEL = 0x8a9098, DARK = 0x30343a, CREAM = 0xe8e4d8;
const SNOW = 0xf4f8ff, TIMBER = 0x6a5a48;
/* a station hut: corrugated walls on a timber sill, a barrel roof along its depth (a Quonset) with snow lying on its crown, a name board over the
   door, lit panes, a drift against its back and its west wall. `x` = what makes this hut its own: porch, stack(s), vents, tall, wide door */
function hut(ctx, id, q, tint, name, x, o) {
    const { building, COR, WD2 } = ctx; x = x || {}; const wallH = x.wallH || 3.5, rh = x.rh || 1.5;   // the walls stand as high as the building itself (3.5 m): lower, and the building's own flat roof came out through the vault at the eaves (seen 11-16)
    return building(id, q, 3.5, o || {}, (a, w, d, door) => {
        a.shell(w, wallH, d, COR, tint, door, null, { gain: tint === ORANGE ? 2.0 : 1.5 });
        a.roof('barrel', 0, wallH, 0, d + 0.3, rh, w + 0.3, COR, CREAM, { ry: 90, keyEnd: COR, tintEnd: tint, gain: 1.4 });
        a.P.push({ s: 'roof', form: 'barrel', p: [0, wallH + rh * 0.62, 0], size: [d - 0.4, rh * 0.42, w * 0.6], roof: true, ry: 90, key: 'ice', tint: SNOW, gain: 1.5, ends: false });   // snow on the crown (pushed raw: a.roof adds an under-sheet, which stood out of the roof as a grey plate, seen 11-16)
        a.box(0, -0.25, 0, w + 0.6, 0.25, d + 0.6, WD2, TIMBER);                                                            // the timber sill
        for (let lx = -w / 2 + 1.75; lx < w / 2; lx += 3.5) { if (Math.abs(lx - door.lx) < 1.7) continue;
            a.box(lx, 1.1, d / 2 + 0.06, 1.0, 0.8, 0.08, 'marble_light', 0xffc070, { glow: 1.0 }); a.box(lx, 1.02, d / 2 + 0.1, 1.2, 0.08, 0.12, COR, DARK); a.box(lx, 1.9, d / 2 + 0.1, 1.2, 0.08, 0.12, COR, DARK); a.box(lx, 1.1, d / 2 + 0.1, 0.06, 0.8, 0.1, COR, DARK); }
        for (let lz = -d / 2 + 1.75; lz < d / 2; lz += 3.5) for (const s of [-1, 1]) { a.box(s * (w / 2 + 0.06), 1.2, lz, 0.08, 0.6, 0.9, 'marble_light', 0xffc070, { glow: 1.0 }); a.box(s * (w / 2 + 0.1), 1.12, lz, 0.12, 0.07, 1.1, COR, DARK); a.box(s * (w / 2 + 0.1), 1.8, lz, 0.12, 0.07, 1.1, COR, DARK); }
        a.roof('shed', 0, 0, -d / 2 - 0.8, w + 1.2, 1.1, 1.6, 'ice', SNOW, { ry: 180, keyEnd: 'ice', tintEnd: SNOW });        // the drift against the back wall
        a.roof('shed', -w / 2 - 0.7, 0, -0.6, d - 1.2, 0.8, 1.4, 'ice', SNOW, { ry: 270, keyEnd: 'ice', tintEnd: SNOW });     // …and along the west wall
        if (x.porch) { const pw = door.cw + 1.2; a.box(door.lx - pw / 2, 0, d / 2 + 0.8, 0.14, 2.5, 1.6, COR, tint, { gain: 1.3 }); a.box(door.lx + pw / 2, 0, d / 2 + 0.8, 0.14, 2.5, 1.6, COR, tint, { gain: 1.3 });
            a.roof('shed', door.lx, 2.5, d / 2 + 0.8, pw + 0.3, 0.35, 1.7, COR, CREAM, { keyEnd: COR, tintEnd: tint }); a.box(door.lx, -0.2, d / 2 + 1.9, pw, 0.2, 0.7, WD2, TIMBER); }
        else a.frame(door, d, COR, DARK);
        (x.stacks || []).forEach(k => { a.cyl(k[0], wallH + rh * 0.6, k[1], k[2] || 0.16, k[3] || 1.6, COR, 0x4a4e54, { roof: true }); a.cyl(k[0], wallH + rh * 0.6 + (k[3] || 1.6), k[1], (k[2] || 0.16) + 0.08, 0.14, COR, DARK, { roof: true }); });
        (x.vents || []).forEach(k => a.box(k[0], wallH + rh * 0.8, k[1], 0.7, 0.5, 0.7, COR, 0x9aa0a8, { roof: true }));
        if (x.aerial) { a.cyl(x.aerial[0], wallH + rh * 0.5, x.aerial[1], 0.03, 4.2, COR, 0xc8ccd2, { roof: true }); a.box(x.aerial[0], wallH + rh * 0.5 + 3.4, x.aerial[1], 1.4, 0.03, 0.03, COR, 0xc8ccd2, { roof: true }); a.box(x.aerial[0], wallH + rh * 0.5 + 2.8, x.aerial[1], 1.0, 0.03, 0.03, COR, 0xc8ccd2, { roof: true }); }
        a.sign(name, door.lx, x.porch ? 2.95 : 2.6, d / 2 + (x.porch ? 1.68 : 0.14), Math.min(w - 0.6, 0.34 * name.length + 0.6), 0.5, '#f4f0e6', '#23262b', 'stencil');
        if (x.more) x.more(a, w, d, door, wallH, rh);
        /* THE INSIDE (pass 2): the building's own inside takes no light, so the walls are lined 0.3 m in with a lit board dado + a pale wall, and a
           lit ceiling with ribs closes it (the Mountains' kit: thin boxes, `glow` + `gain`; a quad there loses to the building's own wall) */
        { const i = 0.3, t = 0.04, e = w / 2 - i, x0 = door.lx - door.cw / 2, x1 = door.lx + door.cw / 2, WALLC = x.wallIn || 0xd8d4c8, top = 3.14;
          const band = (y0, y1, key, tn, g) => { const q = { glow: g, gain: 1.7 }, hh = y1 - y0;
              a.box(0, y0, -(d / 2 - i), w - 2 * i, hh, t, key, tn, q); for (const sd of [-1, 1]) a.box(sd * (w / 2 - i), y0, 0, t, hh, d - 2 * i, key, tn, q);
              a.box((-e + x0) / 2, y0, d / 2 - i, x0 + e, hh, t, key, tn, q); a.box((x1 + e) / 2, y0, d / 2 - i, e - x1, hh, t, key, tn, q); };
          band(0, 0.9, ctx.WD, 0x8a6a48, 0.7); band(0.9, top, 'marble_light', WALLC, 0.8); a.box(door.lx, 2.2, d / 2 - i, door.cw, top - 2.2, t, 'marble_light', WALLC, { glow: 0.8, gain: 1.7 });
          a.box(0, top - 0.1, 0, w - 2 * i, 0.02, d - 2 * i, COR, 0xc8ccd0, { sides: false, top: false, under: true, glow: 0.75, gain: 1.6 });          // the lit ceiling
          for (let lx = -w / 2 + 1.75; lx < w / 2 - 1; lx += 3.5) a.box(lx, top - 0.24, 0, 0.14, 0.14, d - 2 * i, COR, 0x5a5e64, { glow: 0.6 });                  // its ribs
          a.box(0, 0, 0, w - 2 * i, 0.03, d - 2 * i, x.floorIn || ctx.FLR, x.floorIn ? 0xa8a8a8 : 0xb89a74, { sides: false, glow: 0.6, gain: 1.5 }); }                                                // the lit floor (the inside's own floor lay half black)
    });
}
exports.houses = ctx => {
    const { COR } = ctx;
    hut(ctx, 'bunk', [21, 38, 24, 44, 'E'], ORANGE, 'BUNK HUT', { porch: true, stacks: [[0, -6, 0.14, 1.4], [0, 4, 0.14, 1.4]] });
    hut(ctx, 'mess', [26, 38, 29, 44, 'W'], RED, 'MESS HUT', { porch: true, stacks: [[1.5, -5, 0.22, 2.2]], vents: [[-1.2, 3], [-1.2, 6]] });
    hut(ctx, 'radio', [33, 38, 37, 41, 'S'], GREEN, 'RADIO', { aerial: [4.5, -2], vents: [[-4, 0]] });
    /* THE GARAGE: wide and low, a roller door painted beside the walked one, an apron lamp */
    hut(ctx, 'garage', [45, 38, 51, 42, 'S'], YELLOW, 'GARAGE', { floorIn: 'concrete', rh: 2.2, vents: [[-6, 0], [6, 0]], more: (a, w, d, door) => {
        for (const lx of [-7.2, 6.4]) { a.box(lx, 0, d / 2 + 0.07, 4.6, 2.5, 0.08, COR, 0x5a5e64); for (let y = 0.3; y < 2.5; y += 0.35) a.box(lx, y, d / 2 + 0.12, 4.6, 0.04, 0.04, COR, DARK); a.box(lx, 2.5, d / 2 + 0.1, 5.0, 0.16, 0.16, COR, DARK); }
        a.box(0, 3.1, d / 2 + 0.2, 0.5, 0.3, 0.3, 'marble_light', 0xfff0c0, { glow: 1.0 }); } }, { leafDouble: true });
    hut(ctx, 'core', [14, 38, 17, 41, 'S'], BLUE, 'CORE STORE', { porch: true, vents: [[2.5, 0]], more: (a, w, d) => { for (const lx of [-4.2, -3.2]) a.cyl(lx, 0, d / 2 + 0.7, 0.24, 1.5, COR, 0xc8ccd2); } });   // two core tubes stood by the door
    /* THE POWER HUT: two exhaust stacks, a louvred side, the fuel line coming in */
    hut(ctx, 'power', [14, 51, 17, 54, 'E'], STEEL, 'POWER', { floorIn: 'concrete', stacks: [[-3, -3, 0.2, 3.2], [-3, -1.6, 0.2, 3.2]], vents: [[2, 2]], more: (a, w, d) => { for (let y = 0.5; y < 2.0; y += 0.22) a.box(3.4, y, d / 2 + 0.08, 2.0, 0.08, 0.1, COR, DARK); a.box(-3.9, 1.4, d / 2 + 0.12, 0.7, 0.7, 0.04, 'marble_light', 0xe8c020, { gain: 1.4 }); } });
    /* THE BALLOON SHED: the tall one, a wide door for the balloon, gas bottles in a rack on its wall */
    hut(ctx, 'balloon', [46, 51, 49, 54, 'S'], ORANGE, 'BALLOON SHED', { wallH: 4.4, rh: 2.4, more: (a, w, d) => { for (let i = 0; i < 4; i++) a.cyl(w / 2 + 0.3, 0, -2.5 + i * 0.5, 0.16, 1.5, COR, i % 2 ? 0xb23a2e : 0x9aa0a8); a.box(w / 2 + 0.3, 1.0, -1.75, 0.5, 0.06, 2.2, COR, DARK); } });
};
exports.pieces = ctx => {
    const { look, gx, gc, COR, WD2 } = ctx;
    /* THE RADIO MAST: a lattice mast 30 m banded red and white, a red lamp, three stay anchors on the snow */
    look('mast', gc(38), gc(41), 0, a => {
        for (let y = 0; y < 30; y += 2) { const s = 1.1 - y * 0.027; [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(k => a.box(k[0] * s / 2, y, k[1] * s / 2, 0.09, 2, 0.09, COR, (y % 8) < 4 ? 0xc03a2a : 0xe8e8e8, { gain: 1.3 })); a.box(0, y + 1.9, 0, s + 0.09, 0.06, s + 0.09, COR, 0xb8bcc2); a.box(0, y + 0.9, 0, s + 0.05, 0.04, 0.04, COR, 0xb8bcc2); a.box(0, y + 0.9, 0, 0.04, 0.04, s + 0.05, COR, 0xb8bcc2); }
        a.box(0, 30, 0, 0.25, 0.25, 0.25, 'marble_light', 0xff3020, { glow: 1.0 }); a.box(0, 15, 0, 0.2, 0.2, 0.2, 'marble_light', 0xff3020, { glow: 1.0 });
        a.box(0, 0, 0, 1.8, 0.3, 1.8, WD2, TIMBER);
        [[5.25, 5.25], [-5.25, 5.25], [5.25, -5.25]].forEach(k => { a.box(k[0], 0, k[1], 0.7, 0.4, 0.7, 'rocks_5', 0xa8a8b0); a.cyl(k[0], 0.4, k[1], 0.05, 0.5, COR, 0xb8bcc2); });
    });
    /* THE RADOME: a white dome on a steel drum, beside the radio hut */
    look('radome', gx(35), gx(43), 0, a => { a.cyl(0, 0, 0, 2.2, 1.6, COR, 0x9aa0a8); a.P.push({ s: 'dome', p: [0, 1.6, 0], r: 2.7, h: 3.0, key: 'marble_light', tint: 0xf2f4f6, seg: 14, rings: 6, roof: true });
        a.box(0, 0, 2.25, 0.9, 1.5, 0.08, COR, DARK); a.box(0, 0.9, 2.3, 0.3, 0.3, 0.04, 'marble_light', 0xe8c020, { gain: 1.4 }); });
    /* THE DRILL RIG over the bore hole: a derrick 11 m, the crown block, the drill string, the winch, a core on the rack */
    look('rig', gx(16), gc(42), 0, a => {
        [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(k => { for (let y = 0; y < 11; y += 1.5) { const r = 1.6 - y * 0.11; a.box(k[0] * r, y, k[1] * r, 0.12, 1.6, 0.12, COR, 0xc8a030, { gain: 1.3 }); } });
        for (let y = 1.5; y < 11; y += 3) { const r = 1.6 - y * 0.11; a.box(0, y, r, 2 * r, 0.08, 0.08, COR, 0xc8a030); a.box(0, y, -r, 2 * r, 0.08, 0.08, COR, 0xc8a030); a.box(r, y, 0, 0.08, 0.08, 2 * r, COR, 0xc8a030); a.box(-r, y, 0, 0.08, 0.08, 2 * r, COR, 0xc8a030); }
        a.box(0, 11, 0, 1.2, 0.3, 1.2, COR, DARK); a.cyl(0, 0.3, 0, 0.09, 10.7, COR, 0xb8bcc2); a.cyl(0, 0, 0, 0.6, 0.3, COR, DARK);
        a.box(2.2, 0, 0.4, 1.0, 0.9, 0.8, COR, RED); a.cyl(2.2, 0.9, 0.4, 0.3, 0.3, COR, DARK);
        a.box(-2.6, 0.5, 0, 0.1, 0.1, 3.2, WD2, TIMBER); a.box(-2.6, 0, -1.4, 0.12, 0.5, 0.12, WD2, TIMBER); a.box(-2.6, 0, 1.4, 0.12, 0.5, 0.12, WD2, TIMBER); a.box(-2.6, 0.6, 0, 0.22, 0.22, 3.0, 'ice_1', 0xbfe6ff, { gain: 1.4 });
        a.box(0, 9.6, 0.02, 0.5, 0.5, 0.5, 'marble_light', 0xfff0c0, { glow: 1.0 });
    });
    /* THE FUEL LINE: a pipe on trestles from the tanks to the power hut (along the south edge of the Tank Farm's pad) */
    look('fuel', gx(19), gx(55), 0, a => { a.box(0, 0.7, 0, 9.5, 0.16, 0.16, COR, 0x8a4a2a); for (let lx = -4.5; lx <= 4.5; lx += 2.25) { a.box(lx, 0, 0, 0.1, 0.7, 0.4, COR, DARK); } a.cyl(-4.9, 0.55, 0, 0.18, 0.5, COR, RED); });
    /* THE HAND LINES: a rope on posts along the north side of the cross track (the way between the huts in a white-out) */
    [[13, 29], [32, 58]].forEach((q, i) => look('line' + i, gx((q[0] + q[1]) / 2), gx(47) - 0.3, 0, a => { const w = (q[1] - q[0]) * 3.5; for (let lx = -w / 2; lx <= w / 2 + 0.01; lx += 3.5) a.cyl(lx, 0, 0, 0.05, 1.3, WD2, 0xc8b070); a.box(0, 1.15, 0, w, 0.035, 0.035, WD2, 0xd8c080); a.box(0, 0.7, 0, w, 0.03, 0.03, WD2, 0xd8c080); }));
    /* THE FLAG LINE: a red flag on a bamboo every second square down to the shelf */
    for (let y = 50; y <= 60; y += 2) look('flag' + y, gx(44) + 0.4, gc(y), 0, a => { a.cyl(0, 0, 0, 0.03, 2.4, WD2, 0xc8b070); a.box(0.3, 1.9, 0, 0.6, 0.4, 0.02, 'marble_light', 0xd02a20, { gain: 1.4 }); });
    /* THE YARD'S BOARD: the station's name on two posts, facing the Traverse from the south */
    look('board', gx(29), gx(58), 0, a => { a.box(-1.7, 0, 0, 0.16, 2.6, 0.16, WD2, TIMBER); a.box(1.7, 0, 0, 0.16, 2.6, 0.16, WD2, TIMBER); a.box(0, 1.5, 0, 3.8, 1.1, 0.1, WD2, 0x23262b);
        a.sign('THE STATION', 0, 2.05, 0.07, 3.4, 0.46, '#f4f0e6', '#23262b', 'stencil'); a.sign('90 S', 0, 1.58, 0.07, 1.4, 0.4, '#ffd070', '#23262b', 'stencil'); });
};
/* ── PASS 2, THE INSIDES. A hut's frame: x along its front, +z out of the front, the back wall at -d/2. A hut covers whole squares, so a thing that
   BLOCKS stands on a square's middle (the grid below) and the door's square + a way to every free square stay open; small things stand off the middles.
   Every inside prop is `floor: true` (without it a prop within a body's reach of a wall stands on the wall's top). ── */
function insides(ctx) {
    const { put, BUILT, groundAt } = ctx;
    const IN = id => { const B = BUILT[id]; return { B, on: (key, lx, lz, o) => put(B, key, lx, lz, Object.assign({ floor: true }, o || {})),
        lamp: (lx, lz, g) => put(B, 'psx_ceiling_lamp_1_on', lx, lz, { y: g + 2.95, mount: 0, noLight: true }) }; };
    /* BUNK HUT (6 x 3 squares; the door's square is x -1.75 on the front row): six cots along the back wall, the stove and the table in front */
    { const h = IN('bunk'), g = groundAt(22, 41); [-8.75, -5.25, -1.75, 1.75, 5.25, 8.75].forEach((x, i) => { h.on('cot', x, -3.5, { face: 0 }); h.on(i % 2 ? 'footlocker' : 'sea_chest', x + 1.2, -2.2, { face: 0 }); });
      h.on('wood_stove', 8.75, 3.5, { face: 180 }); h.on('psx_dinner_table_1', 5.25, 3.5); h.on('psx_chair_mp_3', 4.1, 2.5, { face: 40 }); h.on('psx_chair_mp_3', 6.3, 2.6, { face: 320 });
      h.on('office_locker', -8.75, 3.5, { face: 180 }); h.on('office_locker', -5.25, 3.5, { face: 180 }); h.on('fur_rug', 1.75, 1.2); h.on('backpack', -6.6, 1.8, { face: 60 }); h.on('sleeping_bag', 3.2, -1.6, { face: 90 }); h.on('firewood_stack', 9.3, 1.3, { h: 0.7 });
      h.lamp(-5.25, 0, g); h.lamp(5.25, 0, g); }
    /* MESS HUT (6 x 3): the galley at one end (range, steel table, fridge), three tables down the back wall, the coffee by the door */
    { const h = IN('mess'), g = groundAt(27, 41); h.on('kitchen_range', -8.75, -3.5, { face: 0 }); h.on('steel_table', -5.25, -3.5, { face: 0 }); h.on('mini_fridge', -9.3, -0.9, { face: 90 }); h.on('stock_pots', -7.3, -3.9, { h: 0.5 });
      [-1.75, 1.75, 5.25].forEach((x, i) => { h.on('psx_dinner_table_1' + (i ? '_' + i : ''), x, -3.5); h.on('psx_chair_mp_1', x - 1.1, -2.3, { face: 200 }); h.on('psx_chair_mp_1', x + 1.0, -2.2, { face: 160 }); });
      h.on('wood_stove', 8.75, -3.5, { face: 0 }); h.on('psx_shelf_mp_3', 8.75, 3.5, { face: 180 }); h.on('water_cooler', 5.25, 3.5, { face: 180 }); h.on('coffee_maker', -5.6, 4.3, { y: 0, h: 0.5 }); h.on('trash_bin', 2.9, 4.2);
      h.on('psx_supply_crate_1', -8.75, 3.5); h.on('psx_canned_food_mp_1', -7.4, 3.9); h.on('psx_canned_food_mp_3', -7.1, 3.3); h.on('notice_board', 0.9, 4.6, { face: 180 });
      h.lamp(-5.25, 0, g); h.lamp(5.25, 0, g); }
    /* RADIO (4 x 3; door square x -1.75 front): the sets along the back wall, the chart table, the operator's desk */
    { const h = IN('radio'), g = groundAt(35, 39); h.on('radio_console', -5.25, -3.5, { face: 0 }); h.on('reel_to_reel', -1.75, -3.5, { face: 0 }); h.on('server_rack', 1.75, -3.5, { face: 0 }); h.on('field_radio', 5.25, -3.5, { face: 0 });
      h.on('map_table', 5.25, 0); h.on('tanker_desk', 5.25, 3.5, { face: 180 }); h.on('crt_terminal', 4.4, 3.6, { y: 0.78, face: 180 }); h.on('computer_chair_grey', 5.0, 2.2, { face: 0 }); h.on('folding_chair', -4.2, -2.1, { face: 190 });
      h.on('filing_cabinet', -5.25, 3.5, { face: 180 }); h.on('retro_radio', -4.6, 2.2, { h: 0.4 }); h.on('evidence_board', -6.4, 0.4, { face: 90 }); h.lamp(0, 0, g); }
    /* GARAGE (6 x 4; door square x -1.75 front): the tractor on the west bay, the lift and the hoist, the benches along the back */
    { const h = IN('garage'), g = groundAt(48, 40); h.on('aircraft_tug', -5.25, -1.75, { face: 180 }); h.on('car_lift', 5.25, -1.75, { face: 0 }); h.on('engine_hoist', 8.75, 1.75, { face: 200 });
      h.on('tool_chest', -8.75, -5.25, { face: 0 }); h.on('metal_shelving', -5.25, -5.25, { face: 0 }); h.on('air_compressor', -1.75, -5.25, { face: 0 }); h.on('tire_stack', 1.75, -5.25); h.on('welding_cart', 8.75, -5.25, { face: 0 });
      h.on('psx_jerrycan_1', 3.0, -4.6); h.on('psx_metal_barrel_mp_2', 9.4, 5.6); h.on('psx_car_battery_1', -7.5, -4.4); h.on('tool_pegboard', 5.4, -6.4, { face: 0 }); h.on('snow_sled', -8.6, 4.2, { face: 80 });
      h.lamp(-5.25, 1, g); h.lamp(5.25, 1, g); }
    /* CORE STORE (3 x 3; door square x 0 front): the cores' rack, the casket the tape speaks of, the bench */
    { const h = IN('core'), g = groundAt(15, 39); h.on('specimen_shelf', -3.5, -3.5, { face: 0 }); h.on('iso_tank', 0, -3.5, { face: 0 }); h.on('fume_hood', 3.5, -3.5, { face: 0 });
      h.on('steel_table', -3.5, 0, { face: 90 }); h.on('microscope', -3.6, 0.3, { y: 0.92 }); h.on('lab_glassware', -3.4, -0.6, { y: 0.92 }); h.on('metal_shelving', 3.5, 3.5, { face: 180 }); h.on('psx_supply_crate_1_1', -3.9, 3.9); h.on('folding_chair', -2.2, 0.5, { face: 270 }); h.lamp(0, 0, g); }
    /* POWER (3 x 3): two sets and the boiler along the back, the gauges, the bottles */
    { const h = IN('power'), g = groundAt(15, 52); h.on('generator', -3.5, -3.5, { face: 0 }); h.on('generator', 0, -3.5, { face: 0 }); h.on('boiler', 3.5, -3.5, { face: 0 });
      h.on('gauge_board', 3.5, 0, { face: 270 }); h.on('utility_box', -4.4, 0.6, { face: 90 }); h.on('psx_jerrycan_1_1', -3.9, 3.8); h.on('psx_metal_barrel_mp_1', -3.5, 3.5); h.on('fire_extinguisher', 2.2, 4.4); h.lamp(0, 0, g); }
    /* BALLOON SHED (3 x 3): the gas, the filling bench, the charts */
    { const h = IN('balloon'), g = groundAt(47, 52); h.on('gas_cylinder_rack', -3.5, -3.5, { face: 0 }); h.on('steel_table', 0, -3.5, { face: 0 }); h.on('gas_cylinder_rack', 3.5, -3.5, { face: 0 });
      h.on('map_table', 3.5, 0); h.on('star_chart', -4.5, 0.2, { face: 90 }); h.on('psx_supply_crate_1_2', -3.5, 3.5); h.on('meshy_rope', 3.6, 3.7); h.on('telescope', -3.2, 0.6, { face: 30 }); h.lamp(0, 0, g); }
}
exports.dress = ctx => {
    const { P, dec, native, sayOf } = ctx;
    /* The Station Yard: cargo either side of the Traverse */
    P('psx_supply_crate_1', 27, 52); P('psx_wooden_crate_1', 27, 53); P('psx_wooden_crate_2', 28, 55); P('snow_sled', 34, 55); P('signpost', 29, 51); P('flood_mast', 26, 57); P('flood_mast', 35, 51);
    dec('psx_metal_barrel_mp_1', 28, 52); dec('psx_metal_barrel_mp_2', 34, 56); dec('psx_jerrycan_1', 27, 54); dec('backpack', 33, 55); dec('psx_supply_crate_1_2', 26, 55);
    /* The Huts: between the two huts */
    P('firewood_stack', 25, 38); dec('snow_sled', 24, 44); dec('psx_metal_barrel_mp_0', 25, 44);
    /* The Radio Mast */
    P('dish', 39, 38); P('dish', 40, 43); dec('cable_drum', 37, 42);
    /* The Garage */
    P('car_truck', 46, 43); P('car_suv', 49, 43); P('tire_stack', 52, 39); dec('psx_jerrycan_1_1', 51, 43); P('tool_chest', 52, 41);
    /* The Ice Core */
    P('psx_wooden_crate_3', 18, 39); dec('cable_drum', 14, 42); P('flood_mast', 18, 43);
    /* The Tank Farm */
    P('ind_silo', 20, 52); P('ind_silo', 22, 52); P('ind_silo', 21, 55); P('generator', 14, 55); dec('psx_metal_barrel_mp_3', 20, 56); dec('gas_cylinder_rack', 17, 56);
    /* The Weather Field */
    P('weather_mast', 50, 52); P('brass_telescope', 51, 55); P('weather_mast', 50, 55); dec('psx_supply_crate_1_3', 50, 54);
    insides(ctx);
    /* who is there */
    native('men in black', 32, 44, 180, null); native('men in black', 41, 52, 270, null);
};
