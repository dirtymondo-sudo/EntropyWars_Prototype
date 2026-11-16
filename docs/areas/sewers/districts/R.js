/* THE SEWERS, district R · THE RADIOACTIVE DRAIN (2 plots: the Power Station Drain P04-04, the Sludge Pit P05-04; both labels are plain
   and mine, the game had no name for them). One thread a file (docs/notes/claims.md). Read by `node bake-sewers.js`; rules:
   docs/notes/areas-complexes.md "THE SEWERS ON PLOTS" + "THE SEWERS, DISTRICT R".
   mondo 11-16: "one sewer district could be radioactive sludge if it connects to the power plant"; on the plan
   (docs/plans/world-zones/sewers_r_plot_plan.png): "make it a new liquid that does corrosion (I think that's poison and burned combined?
   that's close to radiation). kaiju can live there, black goo, whatever else fits".
   BRIEF: where the city's Power station drains. The glowing green SLUDGE is here only (the plan's `s` squares = the liquid `sludge`,
   data.js TERRAIN_RULES.sludge: ending a turn in it gives Corroded; nobody walks into it). The Drain stands 7 m over the Depot (a stair);
   its channel pours 7 m into the Sludge Pit's tank (a ladder beside the fall); the Pit opens north on the Outfall. The bulkhead door in
   the Drain's south passage goes up to the Power station's yard (link `sewers_power`).
   A plot's squares are local (lx, ly 0..11 from its north-west corner). ctx: see W.js.
   STANDS TODAY: the valve gallery (pumps, a gate valve, a boiler, breaker panels, radiation signs), barrels and warning tape along the
   channel, four brick piers standing in the tank, hanging bulbs, five bystanders (kaiju, black goo x 2, mad scientist, swamp monster;
   they have no lines: nobody wrote any).
   NOT YET: the station's waste pipes as pipes in the south wall (the channel just starts there); a rail along the channel; drips, mist,
   a hum; anything on the Pit's east walk. */
'use strict';
const DRAIN = 'P04-04', PIT = 'P05-04';
module.exports = {
    /* the Pit's tank is deep */
    deep: [PIT],
    build(ctx) {
        /* four brick piers standing in the sludge, tank floor to vault, clear of the fall's line */
        [[3, 4], [8, 4], [3, 8], [8, 8]].forEach(q => ctx.pier(PIT, q[0], q[1]));
    },
    dress(ctx) {
        const wallProp = (key, id, lx, ly, side, o) => {   // a piece on the wall of a square's `side` (n / s / e / w), facing into the room
            const s = ctx.sq(id, lx, ly), off = 1.75 - 0.06, d = { n: [0, -off, 180], s: [0, off, 0], e: [off, 0, 270], w: [-off, 0, 90] }[side];
            ctx.props.push(Object.assign({ key, x: ctx.r2(ctx.gcx(s[0]) + d[0]), z: ctx.r2(ctx.gcz(s[1]) + d[1]), face: d[2] }, o || {})); };
        const bulb = (id, lx, ly) => { const s = ctx.sq(id, lx, ly); ctx.props.push({ key: 'bare_bulb', x: ctx.gcx(s[0]), z: ctx.gcz(s[1]), ceil: true }); };
        /* THE VALVE GALLERY (the Drain's room, squares 1..9 x 2..4): the walk from the stair's head (5..7) down to the channel stays clear */
        ctx.P('centrifugal_pump', DRAIN, 1, 2, { face: 180 }); ctx.P('centrifugal_pump', DRAIN, 3, 2, { face: 180 }); ctx.P('gate_valve', DRAIN, 1, 4); ctx.P('boiler', DRAIN, 9, 2);
        ctx.P('psx_metal_barrel_mp_2', DRAIN, 9, 4); ctx.dec('psx_metal_barrel_mp_1', DRAIN, 2, 4); ctx.dec('psx_supply_crate_1', DRAIN, 8, 3);
        [2, 3, 4].forEach(lx => wallProp('breaker_panel', DRAIN, lx, 2, 'n')); wallProp('radiation_sign', DRAIN, 8, 2, 'n'); wallProp('radiation_sign', DRAIN, 9, 3, 'e');
        bulb(DRAIN, 3, 3); bulb(DRAIN, 7, 3);
        /* THE CHANNEL: barrels where the sludge comes in, tape and signs along its walks */
        ctx.P('psx_metal_barrel_mp_3', DRAIN, 2, 11); ctx.dec('traffic_barrel', DRAIN, 4, 11); ctx.dec('psx_metal_barrel_mp_1', DRAIN, 4, 9);
        [[5, 5], [8, 5], [6, 7], [10, 7]].forEach(q => ctx.dec('warning_tape', DRAIN, q[0], q[1]));
        wallProp('radiation_sign', DRAIN, 6, 5, 'n'); wallProp('radiation_sign', DRAIN, 2, 8, 'w'); ctx.dec('wet_floor_sign', DRAIN, 9, 5);
        bulb(DRAIN, 4, 7); bulb(DRAIN, 9, 7);
        /* the passage to the bulkhead door (squares 7..9 x 8..11): signs each side, a barrel, a bulb */
        wallProp('radiation_sign', DRAIN, 7, 9, 'w'); wallProp('breaker_panel', DRAIN, 9, 9, 'e'); ctx.dec('traffic_barrel', DRAIN, 9, 8); bulb(DRAIN, 8, 9);
        /* THE SLUDGE PIT: barrels and crates on the walk round the tank, signs on the walls, bulbs over the corners */
        ctx.P('psx_metal_barrel_mp_2', PIT, 10, 2); ctx.P('psx_metal_barrel_mp_3', PIT, 1, 10); ctx.dec('psx_metal_barrel_mp_1', PIT, 10, 9); ctx.dec('traffic_barrel', PIT, 4, 10);
        ctx.dec('psx_supply_crate_1_empty', PIT, 8, 10); ctx.dec('warning_tape', PIT, 3, 2); ctx.dec('warning_tape', PIT, 7, 10); ctx.dec('wet_floor_sign', PIT, 6, 2);
        wallProp('radiation_sign', PIT, 3, 2, 'n'); wallProp('radiation_sign', PIT, 9, 2, 'n'); wallProp('radiation_sign', PIT, 10, 6, 'e'); wallProp('radiation_sign', PIT, 5, 10, 's');
        [[1, 2], [10, 2], [1, 10], [10, 10]].forEach(q => bulb(PIT, q[0], q[1]));
        [[2, 5], [6, 3]].forEach(q => ctx.dec('floor_stain', DRAIN, q[0], q[1])); [[2, 2], [10, 5]].forEach(q => ctx.dec('floor_stain', PIT, q[0], q[1]));
    },
    people(ctx) {
        /* mondo 11-16: "kaiju can live there, black goo, whatever else fits". No lines: none were written. */
        ctx.native('mad scientist', DRAIN, 6, 3, 180); ctx.native('black goo', DRAIN, 7, 7, 0);
        ctx.native('kaiju', PIT, 10, 7, 270); ctx.native('black goo', PIT, 5, 10, 0); ctx.native('swamp monster', PIT, 1, 3, 90);
    },
};
