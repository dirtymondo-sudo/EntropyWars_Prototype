/* ANTARCTICA, DISTRICT S · THE STATION (8 plots: P01-03..P04-03, P01-04..P04-04) — the zone's PILOT district.
   The idea: a research base on the ice, in the game's conspiracy register: orange huts on timber pads, a mast, a drill that found something.
   Read by bake-antarctica.js (stages: plan / houses / pieces / dress; optional airZones). Squares are the room's (sx, sy).
   PLOTS: The Ice Core (P01-03) · The Huts (P02-03) · The Radio Mast (P03-03) · The Garage (P04-03) · The Tank Farm (P01-04) · The Station Yard (P02-04,
   DOOR HQ's bay door + the spawn: the tool's) · The Flag Line (P03-04) · The Weather Field (P04-04).
   STANDS TODAY (first build): seven walk-in huts (empty inside), the mast, the drill rig, the tanks, the yard's cargo, the flag line, two Men in Black.
   NOT YET: every inside, windows lit at night, the dressing, the air. The pilot's passes are logged in docs/notes/areas-complexes.md "ANTARCTICA, DISTRICT S". */
'use strict';
const ORANGE = 0xd2582a, RED = 0xb23a2e, GREEN = 0x3f7a5a, BLUE = 0x3a6a9a, YELLOW = 0xd8a82a, STEEL = 0x8a9098, DARK = 0x30343a, CREAM = 0xe8e4d8;
/* a station hut: corrugated walls, a barrel roof along its depth (a Quonset), a porch frame, a name board over the door */
function hut(ctx, id, q, tint, name, o) {
    const { building, COR } = ctx, wallH = 2.3, rh = 1.5;
    return building(id, q, 3.5, o || {}, (a, w, d, door) => {
        a.shell(w, wallH, d, COR, tint, door, null, { gain: 1.5 });
        a.roof('barrel', 0, wallH, 0, d + 0.3, rh, w + 0.3, COR, CREAM, { ry: 90, keyEnd: COR, tintEnd: tint, gain: 1.4 });
        a.frame(door, d, COR, DARK);
        a.box(0, -0.25, 0, w + 0.6, 0.25, d + 0.6, ctx.WD2, 0x6a5a48);                                  // the timber sill the hut stands on
        for (let x = -w / 2 + 1.75; x < w / 2; x += 3.5) { if (Math.abs(x - door.lx) < 1.7) continue; a.box(x, 1.1, d / 2 + 0.06, 1.0, 0.8, 0.08, 'marble_light', 0xffc070, { glow: 1.0 }); a.box(x, 1.02, d / 2 + 0.1, 1.2, 0.08, 0.12, COR, DARK); a.box(x, 1.9, d / 2 + 0.1, 1.2, 0.08, 0.12, COR, DARK); }
        a.sign(name, door.lx, 2.5, d / 2 + 0.14, Math.min(w - 0.6, 0.34 * name.length + 0.6), 0.5, '#f4f0e6', '#23262b', 'stencil');
    });
}
exports.houses = ctx => {
    hut(ctx, 'bunk', [21, 38, 24, 44, 'E'], ORANGE, 'BUNK HUT');
    hut(ctx, 'mess', [26, 38, 29, 44, 'W'], RED, 'MESS HUT');
    hut(ctx, 'radio', [33, 38, 37, 41, 'S'], GREEN, 'RADIO');
    hut(ctx, 'garage', [45, 38, 51, 42, 'S'], YELLOW, 'GARAGE', { leafDouble: true });
    hut(ctx, 'core', [14, 38, 17, 41, 'S'], BLUE, 'CORE STORE');
    hut(ctx, 'power', [14, 51, 17, 54, 'E'], STEEL, 'POWER');
    hut(ctx, 'balloon', [46, 51, 49, 54, 'S'], ORANGE, 'BALLOON SHED');
};
exports.pieces = ctx => {
    const { look, gx, gc, COR, WD2 } = ctx;
    /* THE RADIO MAST: a lattice mast 22 m, three stays' anchors, a red lamp */
    look('mast', gc(38), gc(41), 0, a => {
        for (let y = 0; y < 22; y += 2) { const s = 0.9 - y * 0.03; [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(k => a.box(k[0] * s / 2, y, k[1] * s / 2, 0.08, 2, 0.08, COR, 0xb8bcc2)); a.box(0, y + 1.9, 0, s + 0.08, 0.06, s + 0.08, COR, y % 4 ? 0xc03a2a : 0xe8e8e8); }
        a.box(0, 22, 0, 0.2, 0.2, 0.2, 'marble_light', 0xff3020, { glow: 1.0 });
        a.box(0, 0, 0, 1.6, 0.3, 1.6, WD2, 0x6a5a48);
    });
    /* THE DRILL RIG over the bore hole: a derrick of four legs, the winch drum, the core barrel hanging */
    look('rig', gx(16), gc(42), 0, a => {
        [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(k => { for (let y = 0; y < 9; y += 1.5) a.box(k[0] * (1.4 - y * 0.12), y, k[1] * (1.4 - y * 0.12), 0.12, 1.6, 0.12, COR, 0xc8a030); });
        a.box(0, 9, 0, 1.0, 0.25, 1.0, COR, DARK); a.cyl(0, 1.2, 0, 0.09, 7.8, COR, 0xb8bcc2); a.cyl(0, 0, 0, 0.55, 0.25, COR, DARK); a.box(1.3, 0, 0, 0.9, 0.8, 0.7, COR, 0xb23a2e);
    });
    /* THE FLAG LINE: a red flag on a bamboo every second square down to the shelf */
    for (let y = 50; y <= 60; y += 2) look('flag' + y, gx(44) + 0.4, gc(y), 0, a => { a.cyl(0, 0, 0, 0.03, 2.4, WD2, 0xc8b070); a.box(0.3, 1.9, 0, 0.6, 0.4, 0.02, 'marble_light', 0xd02a20, { gain: 1.4 }); });
};
exports.dress = ctx => {
    const { P, dec, native, sayOf } = ctx;
    /* The Station Yard: cargo either side of the Traverse */
    P('psx_supply_crate_1', 27, 52); P('psx_wooden_crate_1', 27, 53); P('psx_wooden_crate_2', 28, 56); P('snow_sled', 34, 55); P('signpost', 29, 51); P('flood_mast', 26, 57); P('flood_mast', 35, 51);
    dec('psx_metal_barrel_mp_1', 28, 52); dec('psx_metal_barrel_mp_2', 34, 56); dec('psx_jerrycan_1', 27, 54); dec('backpack', 33, 55); dec('psx_supply_crate_1_2', 26, 55);
    /* The Huts: between the two huts */
    P('firewood_stack', 25, 38); dec('snow_sled', 24, 44); dec('psx_metal_barrel_mp_0', 25, 44);
    /* The Radio Mast */
    P('dish', 39, 38); P('dish', 40, 43); P('weather_mast', 34, 42); dec('cable_drum', 36, 42);
    /* The Garage */
    P('car_truck', 46, 43); P('car_suv', 49, 43); P('tire_stack', 52, 39); dec('psx_jerrycan_1_1', 51, 43); P('tool_chest', 52, 41);
    /* The Ice Core */
    P('psx_wooden_crate_3', 18, 39); dec('cable_drum', 14, 42); P('flood_mast', 18, 43);
    /* The Tank Farm */
    P('ind_silo', 20, 52); P('ind_silo', 22, 52); P('ind_silo', 21, 55); P('generator', 14, 55); dec('psx_metal_barrel_mp_3', 20, 56); dec('gas_cylinder_rack', 17, 56);
    /* The Weather Field */
    P('weather_mast', 50, 52); P('brass_telescope', 51, 55); P('weather_mast', 47, 55); dec('psx_supply_crate_1_3', 50, 54);
    /* who is there */
    native('men in black', 32, 44, 180, null); native('men in black', 41, 52, 270, null);
};
