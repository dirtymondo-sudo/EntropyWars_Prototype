/* THE D.U.M.B., district P · LEVEL P3 (7 plots: the row across the south, 14 m up: the entry level).
   One thread a file (docs/notes/claims.md). Read by `node bake-dumb.js`; rules: docs/notes/areas-complexes.md "THE D.U.M.B. ON PLOTS".
   BRIEF: the parking level under the garage that the panel never had (P1 the garage, P3 here), and "the tunnel every base is on": one
   straight tunnel from ring to ring with the tram on its rails. Rows of every plot: 2 = the north walk, 3 = the track, 4 + 5 = the
   platform side; the rooms open off it to the south. "The red light is not an emergency." "What is it?" "The default."
   West to east: the West Gantry (the wired door to Hangar 18's floor lift, links.area51_dumb, on the room's west wall) · the Ramp
   (links.garage_motorpool, a draught: secret) · the Bays (the black cars) · the Platform (the landmark: the lit tram; the wired door with
   a 7 on it at the head of the stair down) · the Booth · the Freight Lift (Room 555's bay door) · the East Gantry (the ring).
   STANDS TODAY (the first build): the track and its rails, the tram, the platform's yellow line, the 7 door, the cars, the booth with
   its glass, the lift's cage, the base's battle marker, the old room's three people with their own lines.
   NOT YET: everything a district pass does (a raised platform, the gantries' decks, a checkpoint barrier, fuel, signs along the tunnel). */
'use strict';
const U = n => 'urban:' + n;
/* ════ WORLD POLISH thread 8 (2026-11-20, mondo's OK on the plan): LEVEL P3 ON THE SQUARES. The tram deck stays at 14 m (level 8) the whole way;
   under it, THE HANGAR (P01-05 + P02-05, x 13..34, y 66..71) has its floor three levels down (8.75 m) and THE MOTOR POOL (P05-05) one level
   down (10.5 m), the cars moved there from the Bays. The tunnel's squares over those plots are lifted back to 14 m here (a plateau each).
   Ledges: the gap in the hangar's rail (u 17..18) and the pier's end, both 5.25 m down to the floor. ════ */
const HANGAR = { wall: U('ConcreteStriped1c'), tint: 0xc4c8cc, gain: 1.9, band: 0xe0b020, ceil: U('ConcreteStriped2e'), ceilTint: 0x8a9096, ceilGain: 1.6, light: 0xeef4ff, every: 2 };
const deckOver = (ctx, x0, x1, ew, ee) => { const { r2, gx, gz } = ctx, a = gx(x0) - (ew == null ? 0.5 : ew), b = gx(x1 + 1) + (ee == null ? 0.5 : ee), z0 = gz(62), z1 = gz(66);
    ctx.feat({ k: 'plateau', x: r2((a + b) / 2), z: r2((z0 + z1) / 2), w: r2(b - a), d: r2(z1 - z0), h: 14, edge: 0.05 }); };
function hangar(ctx) {
    deckOver(ctx, 12, 35);
    /* u = x − 12, v = y − 60, heights over the hangar's floor (8.75) */
    const R = ctx.room('P01-05', 0, 0, 24, 12, 'hangar'), T = 5.25, GR = 0x3a4048, Y = 0xe0b020;
    R.stair(1.5, 9, 1.5, 6, 1, 0, T, 'steel'); R.stair(22.5, 9, 22.5, 6, 1, 0, T, 'steel');
    R.deck(11, 6, 13, 10, T, U('MetalSubwayGrill1a')); R.guard('v', 11, 6, 10, T, GR); R.guard('v', 13, 6, 10, T, GR);   /* the pier's end (v 10) = A LEDGE */
    R.guard('u', 6, 2, 11, T, GR); R.guard('u', 6, 13, 17, T, GR); R.guard('u', 6, 19, 22, T, GR);                               /* the gap at u 17..19 = A LEDGE */
    /* the floor's paint: the craft's bays */
    for (const q of [[2.5, 8.5, 7, 5.6], [17, 8.5, 7.8, 5.6]]) { const [u, v, w, d] = q; R.box(u + w / 2 - 0.0, v - d / 2, 0.012, w, 0.01, 0.14, null, Y); R.box(u + w / 2, v + d / 2, 0.012, w, 0.01, 0.14, null, Y); R.box(u, v, 0.012, 0.14, 0.01, d, null, Y); R.box(u + w, v, 0.012, 0.14, 0.01, d, null, Y); }
    /* THE CRAFT: the jet in the west bay, the saucer in the east, the black triangle by the east stair */
    R.dec('fighter_jet', 6, 9, 90); R.dec('saucer_big', 21, 9, 0); R.dec('ufo', 21.3, 7.4, 30, { y: 2.6 });
    /* THE WORKSHOP between them: what came off them */
    R.dec('hullplate', 14.2, 7.0, 20); R.dec('jet_engine_stand', 9.6, 7.2, 0); R.dec('rocket_engine', 15.3, 10.8, 0); R.dec('aircraft_tug', 11.0, 8.2, 90);
    R.dec('engine_hoist', 13.8, 9.0, 180); R.dec('tool_chest', 15.6, 6.3, 0); R.dec('tool_chest', 16.2, 6.3, 0); R.dec('missile_cart', 9.4, 10.9, 90); R.dec('gas_cylinder_rack', 22.6, 10.5, 270); R.dec('welding_cart', 16.4, 8.2, 220);
    R.dec('wrapped_pallet', 1.6, 10.9, 10); R.dec('wrapped_pallet', 2.5, 11.0, 80); R.dec('ind_container', 4.2, 11.0, 90); R.dec('hazmat_suit', 21.6, 10.9, 200); R.dec('forklift', 18.5, 11.0, 0);
    R.hung('radiation_sign', 22.95, 9.6, 270, 1.8); R.hung('security_camera', 1.05, 11.8, 45, 8.0); R.hung('evac_button', 22.95, 9.0, 270, 1.3);
    R.sign('THE HANGAR', 12, 11.94, 6.4, 7.0, 1.2, 180, '#e0b020', '#14161a', 'stencil', 0.3);
    R.sign('NO PHOTOGRAPHS', 6, 11.94, 3.2, 3.2, 0.5, 180, '#e8e4d0', '#5a1410', 'stencil');
    for (const u of [3, 7, 11, 15, 19, 22]) for (const v of [7.5, 10]) R.dec('high_bay_lamp', u + 0.5, v, 0, { y: 11.2, ceil: true });
    R.done();
}
/* THE GANTRIES: the tunnel crosses the ring (10.5) on a bridge at 14, a stair down to the ring beside it; the tunnel's own squares round it lifted */
function gantries(ctx) {
    deckOver(ctx, 0, 3, 0.5, 0); deckOver(ctx, 8, 11, 0, 0.5); deckOver(ctx, 72, 75, 0.5, 0); deckOver(ctx, 80, 83, 0, 0.5);
    for (const [id, st] of [['P00-05', 7], ['P06-05', 4]]) { const G = ctx.room(id, 0, 0, 12, 12, id === 'P00-05' ? 'wgantry' : 'egantry'), GR = 0x3a4048;
        G.deck(4, 2, 8, 6, 3.5, U('MetalSubwayGrill1a')); G.stair(st + 0.5, 0, st + 0.5, 2, 1, 0, 3.5, 'steel');
        G.guard('u', 2, st === 7 ? 4 : 5, st === 7 ? 7 : 8, 3.5, GR); G.guard('u', 6, 4, 8, 3.5, GR);
        for (const o of [-0.72, 0.72]) G.box(6, 3.5 + o / ctx.C, 3.5, 4 * ctx.C, 0.14, 0.12, 'metal', 0x6a6e74);
        G.label(id === 'P00-05' ? 'THE RING' : 'THE RING', st + 0.5, 0.06, 0, 1.4); G.done(); }
}
/* ════ THE INTERIORS + POLISH PASS (2026-11-20): the platform's hall, the checkpoint's racks, the buffer at the tunnel's end, the signs that tell
   you where the stairs go, the hangar's real light (one of the base's last three), the floors' grime ════ */
function polishP3(ctx) {
    ctx.P('metro_bench', 'P03-05', 3, 7, { face: 0 }); ctx.P('metro_bench', 'P03-05', 8, 7, { face: 0 }); ctx.P('metro_bin', 'P03-05', 5, 8); ctx.hang('tube_map', 'P03-05', 4, 8, 's', 1.6);
    ctx.hang('departures_board', 'P03-05', 7, 8, 's', 2.6); ctx.hang('vending_machine', 'P03-05', 10, 8, 's', 0); ctx.dec('railway_lantern', 'P03-05', 2, 5); ctx.dec('railway_lantern', 'P03-05', 10, 5);
    ctx.P('rifle_rack', 'P04-05', 8, 9, { face: 180 }); ctx.P('riot_gear_rack', 'P04-05', 7, 9, { face: 180 }); ctx.dec('item_police_barricade', 'P04-05', 3, 8); ctx.hang('key_rack', 'P04-05', 3, 9, 'w', 1.5);
    ctx.P('buffer_stop', 'P00-05', 0, 3, { face: 90 });
    const T = ctx.room('P00-05', 0, 0, 84, 12, 'tunnel'), Y = 3.5 + 2.7;   // u = x, v = y − 60; heights over 10.5 (the tunnel's floor is 14)
    const sg = (w, x, c) => T.sign(w, x, 2.06, Y, Math.max(2.4, w.length * 0.17), 0.45, 0, '#f0f0f0', c || '#5a1410', 'stencil');
    sg('THE HANGAR · STAIRS DOWN', 13.5); sg('THE HANGAR · STAIRS DOWN', 34.5); sg('CHECKPOINT', 50.5); sg('MOTOR POOL · RAMP DOWN', 61.5); sg('THE RING · STAIR DOWN', 2.5, '#10202c'); sg('THE RING · STAIR DOWN', 80.5, '#10202c'); sg('HANGAR 18', 0.9);
    T.done();
    const H = ctx.room('P01-05', 0, 0, 24, 12, 'hangar2'); H.bulb(12, 8.5, 11.2); H.done();
    for (const g of [['oil', 'P01-05', 6, 8], ['oil', 'P02-05', 3, 9], ['scorch', 'P02-05', 9, 8], ['oil', 'P05-05', 5, 9], ['grime', 'P03-05', 6, 5], ['grime', 'P04-05', 4, 4]]) ctx.grime(g[0], g[1], g[2], g[3], 1.4);
}
function motorPool(ctx) {
    deckOver(ctx, 60, 71);
    /* u = x − 60, v = y − 60, heights over the lower deck (10.5) */
    const R = ctx.room('P05-05', 0, 0, 12, 12, 'motor'), Y = 0xe0b020;
    ctx.feat({ k: 'ramp', x0: R.X(2.5), z0: R.Z(10), x1: R.X(2.5), z1: ctx.r2(R.Z(6) - 0.3), w: 3 * ctx.C, h0: 10.5, h1: 14, edge: 0.1 });   // THE CAR RAMP
    R.stair(10.5, 8, 10.5, 6, 1, 0, 3.5, 'concrete'); R.guard('u', 6, 4, 10, 3.5, 0x3a4048); R.guard('v', 4, 6, 10, 0, 0x3a4048);
    for (const u of [4, 6, 8]) R.box(u, 8.25, 0.012, 0.12, 0.01, 4.5, null, Y);
    R.B('car_suv', 4, 7, 180); R.B('car_cop', 5, 7, 180); R.B('car_cadillac', 7, 7, 180); R.B('military_jeep', 8, 9, 270); R.dec('traffic_cone', 4.4, 10.6); R.dec('traffic_cone', 5.6, 10.6);
    R.dec('key_rack', 10.95, 9.8, 270, { y: 1.5 }); R.dec('tire_stack', 10.5, 11.3); R.dec('psx_jerrycan_1', 9.6, 11.4, 30); R.dec('floor_stain', 6.2, 9.4); R.sign('MOTOR POOL', 6, 11.94, 3.2, 3.6, 0.55, 180, '#e0b020', '#14161a', 'stencil');
    R.sign('EVERY ONE SIGNED OUT', 6, 11.94, 2.4, 3.6, 0.35, 180, '#f0f0f0', '#14161a');
    R.done();
}

module.exports = {
    look: { wall: U('ConcreteStriped1c'), tint: 0xb8bcc0, band: 0xc0392b, ceil: U('ConcreteStriped2e'), ceilTint: 0x80858c, light: 0xff5040, every: 3 },
    looks: { 'P01-05': HANGAR, 'P02-05': HANGAR },
    build(ctx) {
        const { C, r2, gcx, gcz, gx, gz, plot } = ctx, B = plot['P03-05'].base;
        hangar(ctx); motorPool(ctx); gantries(ctx); polishP3(ctx);
        /* the platform's edge: a yellow line along the track's south side, from the Ramp to the Freight Lift */
        { const a = ctx.sq('P01-05', 0, 4), b = ctx.sq('P05-05', 11, 4); for (let sx = a[0]; sx <= b[0]; sx += 12) ctx.part({ s: 'box', p: [r2(gx(sx) + 6 * C), r2(B + 0.012), r2(gz(a[1]) + 0.2)], size: [12 * C, 0.01, 0.25], tint: 0xe0b020 }); }
        /* THE 7 DOOR: the wired double door behind the platform, at the head of the stair down */
        { const R = ctx.room('P03-05', 5, 0, 3, 2, 'seven'), o = ctx.O.motorpool.d.find(d => d.id === 'seven') || {};
          R.wall('u', 2, 0, 3, { h: 7, key: U('ConcreteStriped1c'), tint: 0xb8bcc0, doors: [[1.5, o.leaf || 'leaf_wired_double', 1]] });
          R.sign('7', 1.5, 2.18, 3.4, 1.2, 1.4, 0, '#e8e4d0', '', 'stencil', 0.4); R.label('SUB-LEVEL 7', 1.5, 2.18, 0, 1.8); R.done(); }
        /* THE BOOTH: glass on three sides, a door to the passage */
        { const R = ctx.room('P04-05', 5, 7, 2, 2, 'booth');
          R.pane('u', 0, 0, 2, { h: 2.6 }); R.pane('v', 0, 0, 2, { h: 2.6 }); R.pane('v', 2, 0, 2, { h: 2.6, doors: [[1.5, 'leaf_glass']] }); R.wall('u', 2, 0, 2, { h: 2.6, key: U('MetalCorrugatedPainted3a'), tint: 0x8c9298 });
          R.ceil(0, 0, 2, 2, 2.6, U('MetalCorrugatedPainted3a'), 0x6a7076); R.label('BOOTH', 1, -0.18, 180, 1.0);
          R.B('steel_table', 0, 0, 0); R.dec('crt_terminal', 0.5, 0.5, 0, { y: 0.78 }); R.dec('computer_chair_grey', 0.6, 1.3, 180); R.dec('security_camera', 1.9, 0.1, 225, { y: 2.3 });
          R.who('men in black', 1.5, 0.6, 0, ctx.sayOf(ctx.O.motorpool, 'men in black')); R.done(); }
        /* THE FREIGHT LIFT: a steel cage round the bay door's landing */
        { const w = ctx.way('bay'), y = plot['P05-05'].base; [[-1.6, -1.6], [1.6, -1.6], [-1.6, 1.4], [1.6, 1.4]].forEach(q => ctx.part({ s: 'box', p: [r2(w.x + q[0]), y, r2(w.z - 1.45 + q[1])], size: [0.16, 3.6, 0.16], tint: 0x2a2c30 }));
          ctx.part({ s: 'box', p: [w.x, r2(y + 3.5), r2(w.z - 1.5)], size: [3.4, 0.14, 3.2], tint: 0xe0b020 }); }
        const b = ctx.O.motorpool.c.find(c => c.id === 'battle'), s = ctx.sq('P03-05', 3, 7); if (b) { ctx.counters.push(Object.assign({}, b, { x: gcx(s[0]), z: gcz(s[1]), plateY: r2(B + 2.35) })); ctx.taken.add(s[0] + ':' + s[1]); }
    },
    dress(ctx) {
        /* the tram on its rails at the platform; the cars in the bays, every one signed out */
        ctx.P('subway_cart', 'P03-05', 8, 3, { face: 90 }); ctx.keep('P03-05', 7, 3); ctx.keep('P03-05', 9, 3);
        ctx.hang('radiation_sign', 'P00-05', 2, 5, 's'); ctx.dec('evac_button', 'P03-05', 4, 2, { mount: 1.3, face: 0 }); ctx.dec('fire_extinguisher', 'P03-05', 9, 5); ctx.dec('security_camera', 'P03-05', 2, 2, { mount: 4.2, face: 135 });
        ctx.P('traffic_cone', 'P04-05', 4, 9); ctx.P('meshy_sandbags', 'P04-05', 3, 6, { face: 0 }); ctx.P('meshy_sandbags', 'P04-05', 8, 6, { face: 0 }); ctx.P('metal_detector', 'P04-05', 4, 7, { face: 0 });
    },
    people(ctx) {
        ctx.native('mad scientist', 'P02-05', 6, 10, 300, ctx.sayOf(ctx.O.motorpool, 'mad scientist'));
        ctx.native('cowboy', 'P00-05', 2, 4, 90, ctx.sayOf(ctx.O.motorpool, 'cowboy'));
    },
};
