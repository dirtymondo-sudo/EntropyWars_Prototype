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
module.exports = {
    look: { wall: U('ConcreteStriped1c'), tint: 0xb8bcc0, band: 0xc0392b, ceil: U('ConcreteStriped2e'), ceilTint: 0x80858c, light: 0xff5040, every: 3 },
    build(ctx) {
        const { C, r2, gcx, gcz, gx, gz, plot } = ctx, B = plot['P03-05'].base;
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
        { const w = ctx.way('bay'), y = B; [[-1.6, -1.6], [1.6, -1.6], [-1.6, 1.4], [1.6, 1.4]].forEach(q => ctx.part({ s: 'box', p: [r2(w.x + q[0]), y, r2(w.z - 1.45 + q[1])], size: [0.16, 3.6, 0.16], tint: 0x2a2c30 }));
          ctx.part({ s: 'box', p: [w.x, r2(y + 3.5), r2(w.z - 1.5)], size: [3.4, 0.14, 3.2], tint: 0xe0b020 }); }
        const b = ctx.O.motorpool.c.find(c => c.id === 'battle'), s = ctx.sq('P03-05', 3, 7); if (b) { ctx.counters.push(Object.assign({}, b, { x: gcx(s[0]), z: gcz(s[1]), plateY: r2(B + 2.35) })); ctx.taken.add(s[0] + ':' + s[1]); }
    },
    dress(ctx) {
        /* the tram on its rails at the platform; the cars in the bays, every one signed out */
        ctx.P('subway_cart', 'P03-05', 8, 3, { face: 90 }); ctx.keep('P03-05', 7, 3); ctx.keep('P03-05', 9, 3);
        ctx.P('car_suv', 'P02-05', 2, 8, { face: 0 }); ctx.keep('P02-05', 2, 9); ctx.P('car_cop', 'P02-05', 5, 8, { face: 0 }); ctx.keep('P02-05', 5, 9); ctx.P('car_suv', 'P02-05', 8, 8, { face: 180 }); ctx.keep('P02-05', 8, 9);
        ctx.P('traffic_cone', 'P02-05', 3, 7); ctx.P('traffic_cone', 'P02-05', 6, 7); ctx.P('traffic_barrel', 'P02-05', 10, 10); ctx.P('cardboard_boxes', 'P02-05', 1, 10); ctx.dec('floor_stain', 'P02-05', 4, 9);
        ctx.P('quarter_pipe', 'P01-05', 8, 8, { face: 90 }); ctx.P('traffic_barrel', 'P01-05', 3, 6); ctx.dec('paper_sheet', 'P01-05', 5, 7);
        ctx.hang('radiation_sign', 'P00-05', 2, 5, 's'); ctx.dec('evac_button', 'P03-05', 4, 2, { mount: 1.3, face: 0 }); ctx.dec('fire_extinguisher', 'P03-05', 9, 5); ctx.dec('security_camera', 'P03-05', 2, 2, { mount: 4.2, face: 135 });
        ctx.P('cardboard_boxes', 'P05-05', 3, 8); ctx.P('traffic_barrel', 'P05-05', 9, 8); ctx.P('traffic_cone', 'P04-05', 4, 9);
    },
    people(ctx) {
        ctx.native('mad scientist', 'P02-05', 9, 6, 300, ctx.sayOf(ctx.O.motorpool, 'mad scientist'));
        ctx.native('cowboy', 'P00-05', 2, 4, 90, ctx.sayOf(ctx.O.motorpool, 'cowboy'));
    },
};
