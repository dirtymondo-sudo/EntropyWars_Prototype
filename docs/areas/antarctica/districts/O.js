/* ANTARCTICA, DISTRICT O · THE POLAR OPENINGS (4 plots: the west and east columns of rows 3 and 4) — the two ways down under the crust.
   PLOTS: The Admiral's Tunnel (P00-03: the tunnel mouth on the west wall, the tool's door, link antarctica_polar to Agartha) · The Fuel Drums (P00-04:
   "it starts behind the fuel drums on the station's west side") · The Polar Opening (P05-03: warm bare ice, the east wall door, link hollow_byrd to the
   Inner Sun) · The East Berm (P05-04: "the opening is behind the station's east berm").
   STANDS TODAY (first build): the tunnel's timber portal, the drum dump, the opening's warning ring and steam, a Man in Black with his line.
   NOT YET: the hole itself as a shape (it is a door on the wall today), melt water, the compass that points down, night lights. */
'use strict';
exports.pieces = ctx => {
    const { look, gx, WD2 } = ctx;
    /* the tunnel's portal: three timber sets, each lower than the last, at the cut in the west ridge */
    look('tunnel', gx(2), gx(41), 90, a => { [0, 1.6, 3.2].forEach((z, i) => { const h = 3.6 - i * 0.3; a.box(-3.3, 0, -z, 0.35, h, 0.35, WD2, 0x5a4630); a.box(3.3, 0, -z, 0.35, h, 0.35, WD2, 0x5a4630); a.box(0, h, -z, 7.4, 0.35, 0.4, WD2, 0x5a4630); }); });
};
exports.dress = ctx => {
    const { P, dec, native, sayOf } = ctx;
    /* The Fuel Drums */
    for (let i = 0; i < 14; i++) { const x = 4 + (i % 5), y = 50 + Math.floor(i / 5); (i % 3 ? P : dec)('psx_metal_barrel_mp_' + (i % 4), x, y); }
    P('wrapped_pallet', 9, 51); P('wrapped_pallet', 9, 53); dec('psx_jerrycan_1', 8, 54); dec('psx_jerrycan_1_1', 6, 53); P('flood_mast', 3, 49); P('hand_truck', 9, 55);
    /* The Admiral's Tunnel */
    P('signpost', 6, 42); dec('psx_metal_barrel_mp_2', 5, 44); dec('psx_wooden_crate_2', 6, 38); P('railway_lantern', 2, 39);
    native('men in black', 6, 44, 90, sayOf('men in black', 1));
    /* The Polar Opening */
    [[63, 38], [63, 41], [68, 41], [68, 38]].forEach(q => P('warning_tape', q[0], q[1])); dec('chimney_smoke', 69, 39); dec('chimney_smoke', 67, 40); P('radiation_sign', 63, 43);
    dec('psx_dosimeter_1', 65, 41); P('weather_mast', 62, 44);
    /* The East Berm */
    P('flood_mast', 63, 50); P('canvas_tent', 65, 52); dec('campfire', 66, 53); dec('psx_supply_crate_1', 64, 53);
};
