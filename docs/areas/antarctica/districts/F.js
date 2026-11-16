/* ANTARCTICA, DISTRICT F · THE SHELF ICE (6 plots: row 5) — flat blue ice to the sea: where the ship lands and the seals lie.
   PLOTS: The Shelf Ice (P00-05) · The Seal Beach (P01-05) · The Ice Pier (P02-05: a tongue of ice, the Traverse's south end) · The Landing (P03-05: cargo)
   · The Floes (P04-05: floes joined by necks, leads of open water) · The Calving Face (P05-05). The sea and the shelf's edge are the tool's.
   STANDS TODAY (first build): bollards and a buoy at the pier, the landing's containers and pallets, seals, a fishing camp, a wreck, a Kaiju.
   NOT YET: a ship at the pier (no icebreaker model: NEEDS A MODEL), bergs in the sea, penguins that stand (the pack's lie flat), the night lights. */
'use strict';
exports.dress = ctx => {
    const { P, dec, native } = ctx;
    /* The Ice Pier */
    P('mooring_bollard', 29, 68); P('mooring_bollard', 32, 68); P('mooring_bollard', 29, 70); P('mooring_bollard', 32, 70); P('flood_mast', 29, 63); dec('sea_buoy', 34, 71); dec('psx_supply_crate_1', 32, 64); dec('meshy_rope', 30, 69);
    /* The Landing */
    P('ind_container', 37, 62); P('ind_container', 37, 64); P('ind_container', 45, 62); P('wrapped_pallet', 39, 65); P('wrapped_pallet', 41, 65); P('forklift', 44, 65); P('pallet_jack', 38, 66); P('snow_sled', 46, 64); dec('psx_wooden_crate_1', 40, 66); dec('psx_metal_barrel_mp_1', 36, 66);
    /* The Seal Beach */
    [[14, 66], [16, 67], [19, 65], [21, 66], [23, 64], [13, 67], [17, 65]].forEach(q => dec('ocean_seal_resting', q[0], q[1]));
    /* The Shelf Ice: a fishing camp */
    P('canvas_tent', 4, 64); dec('campfire', 5, 65); dec('lobster_traps', 6, 66); dec('wooden_bucket', 3, 66); dec('snow_sled', 9, 64);
    /* The Floes + The Calving Face */
    dec('ship_wreck', 67, 67); dec('sea_buoy', 60, 70); dec('ocean_seal_resting', 52, 68); dec('ocean_seal_resting', 57, 69);
    native('kaiju', 50, 62, 180, null);
};
