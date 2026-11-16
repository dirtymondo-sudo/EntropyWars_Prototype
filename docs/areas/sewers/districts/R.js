/* THE SEWERS, district R · THE RADIOACTIVE DRAIN (2 plots: the Power Station Drain P04-04, the Sludge Pit P05-04; both labels are plain
   and mine, the game had no name for them). One thread a file (docs/notes/claims.md). Read by `node bake-sewers.js`; rules:
   docs/notes/areas-complexes.md "THE SEWERS ON PLOTS" + "THE SEWERS, DISTRICT R".
   mondo 11-16: "one sewer district could be radioactive sludge if it connects to the power plant"; on the plan
   (docs/plans/world-zones/sewers_r_plot_plan.png): "make it a new liquid that does corrosion (I think that's poison and burned combined?
   that's close to radiation). kaiju can live there, black goo, whatever else fits".
   BRIEF: where the city's Power station drains. The glowing green SLUDGE is here only (the plan's `s` squares = the liquid `sludge`,
   data.js TERRAIN_RULES.sludge: ending a turn in it gives Corroded; nobody walks into it). The Drain stands 7 m over the track (a stair up from the Loop Line's tunnel, P03-04);
   its channel pours 7 m into the Sludge Pit's tank (a ladder beside the fall); the Pit opens north on the Outfall. The bulkhead door in
   the Drain's south passage goes up to the Power station's yard (link `sewers_power`).
   A plot's squares are local (lx, ly 0..11 from its north-west corner). ctx: see W.js.
   STANDS TODAY (2 passes): the valve gallery (pumps, a gate valve, a boiler, breaker panels, radiation signs; pass 2: the control wall, the
   lab bench, compressor, generator, gas rack, pipe runs, glowing caps by the sludge, six
   goo tendrils in the tank, bodies, parts and bones on the Pit's walk, chains), barrels and warning tape along the
   channel, hanging bulbs, five bystanders (kaiju, black goo x 2, mad scientist, swamp monster;
   they have no lines: nobody wrote any).
   NOT YET: the station's waste pipes where the channel starts (the pack's pipe pieces stand upright and thin: tried, taken out); a rail
   along the channel; drips, mist,
   a hum; anything on the Pit's east walk. */
'use strict';
const DRAIN = 'P04-04', PIT = 'P05-04';
module.exports = {
    /* the Pit's tank is deep */
    deep: [PIT],
    dress(ctx) {
        const wallProp = (key, id, lx, ly, side, o) => {   // a piece on the wall of a square's `side` (n / s / e / w), facing into the room
            const s = ctx.sq(id, lx, ly), off = 1.75 - 0.06, d = { n: [0, -off, 180], s: [0, off, 0], e: [off, 0, 270], w: [-off, 0, 90] }[side];
            ctx.props.push(Object.assign({ key, x: ctx.r2(ctx.gcx(s[0]) + d[0]), z: ctx.r2(ctx.gcz(s[1]) + d[1]), face: d[2] }, o || {})); };
        const bulb = (id, lx, ly) => { const s = ctx.sq(id, lx, ly); ctx.props.push({ key: 'bare_bulb', x: ctx.gcx(s[0]), z: ctx.gcz(s[1]), ceil: true }); };
        /* THE VALVE GALLERY (the Drain's room, squares 1..9 x 2..4): its middle squares (5..7) stay clear down to the channel */
        ctx.P('centrifugal_pump', DRAIN, 1, 2, { face: 180 }); ctx.P('centrifugal_pump', DRAIN, 3, 2, { face: 180 }); ctx.P('gate_valve', DRAIN, 1, 4); ctx.P('boiler', DRAIN, 9, 2);
        ctx.P('psx_metal_barrel_mp_2', DRAIN, 9, 4); ctx.dec('psx_metal_barrel_mp_1', DRAIN, 2, 4); ctx.dec('psx_supply_crate_1', DRAIN, 8, 3);
        [2, 3, 4].forEach(lx => wallProp('breaker_panel', DRAIN, lx, 2, 'n')); wallProp('radiation_sign', DRAIN, 8, 2, 'n'); wallProp('radiation_sign', DRAIN, 9, 3, 'e');
        bulb(DRAIN, 3, 3); bulb(DRAIN, 7, 3);
        /* THE CHANNEL: barrels where the sludge comes in, tape and signs along its walks */
        ctx.dec('psx_metal_barrel_mp_1', DRAIN, 4, 9);   // (nothing stands on squares 2..4 x 11: that turn is the only walk round the channel's head)
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
        [[2, 5], [6, 3]].forEach(q => ctx.dec('floor_stain', DRAIN, q[0], q[1]));
        /* PASS 2, THE MODEL LIST (mondo 11-16: "look at the model list ... to see what else they could add"). Every piece below was in the
           game and none stood in the Sewers: the PSX mega pack's pipes and valve holders, the Industrial interiors' machines, the lab
           pieces, the control wall, the Halloween pack's bodies and parts, the symbiote's spell tendrils, the Woods' glowing mushrooms. */
        const base = ctx.plot[DRAIN].base, at = (key, id, lx, ly, dx, dz, o) => { const q = ctx.sq(id, lx, ly); ctx.props.push(Object.assign({ key, x: ctx.r2(ctx.gcx(q[0]) + dx), z: ctx.r2(ctx.gcz(q[1]) + dz) }, o || {})); };
        /* the control wall + the lab bench in the valve gallery */
        wallProp('monitor_stack', DRAIN, 6, 2, 'n'); wallProp('server_rack', DRAIN, 7, 2, 'n'); ctx.P('retro_control_panel', DRAIN, 6, 3, { face: 180 });
        ctx.P('steel_table', DRAIN, 5, 4, { face: 90 }); at('lab_glassware', DRAIN, 5, 4, -0.3, 0.2, { y: ctx.r2(base + 0.92) }); at('microscope', DRAIN, 5, 4, 0.35, -0.2, { y: ctx.r2(base + 0.92) });
        ctx.P('gas_cylinder_rack', DRAIN, 7, 4, { face: 180 }); ctx.P('air_compressor', DRAIN, 3, 4, { face: 180 }); ctx.P('generator', DRAIN, 8, 4);
        wallProp('locker', DRAIN, 1, 3, 'w'); ctx.dec('footlocker', DRAIN, 2, 3); wallProp('vent_grille', DRAIN, 5, 2, 'n'); wallProp('wall_chains', DRAIN, 9, 4, 'e');
        /* pipe runs along the walls of the walks */
        [4, 6, 8, 10].forEach(lx => wallProp('pipe_run', DRAIN, lx, 7, 's', { y: ctx.r2(base + 2.4) })); [8, 10].forEach(ly => wallProp('pipe_run', DRAIN, 2, ly, 'w', { y: ctx.r2(base + 2.4) }));
        wallProp('security_camera', DRAIN, 9, 10, 'e'); wallProp('vent_grille', DRAIN, 10, 5, 'n');
        /* what grows by the sludge: glowing caps along the channel and round the tank */
        [[5, 5], [9, 5], [7, 7], [4, 8], [2, 9]].forEach(q => ctx.dec('woods_glowcap', DRAIN, q[0], q[1])); [[2, 2], [5, 2], [8, 2], [10, 4], [10, 8], [3, 10], [6, 10], [9, 10], [1, 8], [1, 4]].forEach(q => ctx.dec('woods_glowcap', PIT, q[0], q[1]));
        /* THE PIT: something lives in the tank; what it left on the walk */
        /* (mondo 11-16: "get rid of the kraken arms, use the tentacles that the spells use": the symbiote's black tendrils, catalogue `goo_tendril`) */
        [[6, 4, 4.6], [4, 8, 3.6], [8, 7, 5.2], [3, 5, 2.8], [7, 9, 3.2], [9, 4, 2.6]].forEach(q => ctx.P('goo_tendril', PIT, q[0], q[1], { h: q[2], y: ctx.r2(ctx.plot[PIT].base - 0.5) }));
        ctx.dec('hw_body', PIT, 10, 4); ctx.dec('hw_body_2', PIT, 3, 10); ctx.dec('hw_part_3', PIT, 9, 10); ctx.dec('hw_part_5', PIT, 10, 7); ctx.dec('hw_part_1', PIT, 1, 8);
        ctx.dec('skull', PIT, 2, 10); ctx.dec('skull', PIT, 10, 3); ctx.dec('psx_fish_skeleton_mp_1', PIT, 6, 10); ctx.dec('psx_fish_skeleton_mp_1', PIT, 1, 4); ctx.dec('skull_pile', PIT, 7, 1);
        wallProp('wall_chains', PIT, 1, 4, 'w'); wallProp('wall_chains', PIT, 10, 8, 'e'); wallProp('wall_chains', PIT, 7, 10, 's'); wallProp('vent_grille', PIT, 5, 2, 'n');
        [[1, 2], [10, 10]].forEach(q => ctx.dec('psx_cobweb_1', PIT, q[0], q[1])); [[1, 2], [9, 3]].forEach(q => ctx.dec('psx_cobweb_2', DRAIN, q[0], q[1])); [[2, 2], [10, 5]].forEach(q => ctx.dec('floor_stain', PIT, q[0], q[1]));
    },
    people(ctx) {
        /* mondo 11-16: "kaiju can live there, black goo, whatever else fits". No lines: none were written. */
        ctx.native('mad scientist', DRAIN, 4, 3, 90); ctx.native('black goo', DRAIN, 7, 7, 0);
        ctx.native('kaiju', PIT, 10, 7, 270); ctx.native('black goo', PIT, 5, 10, 0); ctx.native('swamp monster', PIT, 1, 3, 90);
    },
};
