/* THE D.U.M.B., district K · CERN, THE RING (22 plots: the outer ring of the base, 14 m up on the entry level).
   One thread a file (docs/notes/claims.md). Read by `node bake-dumb.js`; rules: docs/notes/areas-complexes.md "THE D.U.M.B. ON PLOTS".
   BRIEF: the collider tunnel as an octagon round the whole base ("The ring is round." "It is an octagon." "It is round enough for the
   beam."): four squares wide, the beam pipe on its outer wall. On its four sides: the Control Room + the Vent (north), the Detector Hall
   (east, the landmark: THE BEAM), the Blast Door (south: Room 999's way in from the bay), the Beam Dump (west). A service room in each
   corner. Level P3's tunnel crosses it at the West and East Gantries (district P).
   STANDS TODAY (the first build): the beam pipe all the way round; the Control Room behind its two doors with the servers and the desks;
   the Detector Hall with THE BEAM, two Tesla coils, the gantry up its stair, CERN's battle marker; the Beam Dump's pile; the old room's
   three people with their own lines.
   NOT YET: everything a district pass does (the detector itself is an orb and two coils: NEEDS A MODEL; magnets on the pipe; cable trays;
   the ring's 14 plain plots are bare tunnel; no sound). */
'use strict';
const U = n => 'urban:' + n;
module.exports = {
    look: { wall: U('ConcreteStriped2a'), tint: 0xb0b8c4, band: 0x3a8fe0, ceil: U('ConcreteStriped2e'), ceilTint: 0x8a94a4, light: 0xbfe6ff, every: 4 },
    build(ctx) {
        const { C, r2, gcx, gcz, gx, gz, cell, W, H, plot } = ctx, c = W / 2;
        /* THE BEAM PIPE: on the outermost row of the ring's squares, all the way round (drawn; the squares are kept clear) */
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { if (cell[y][x] !== 'r') continue; const dx = x + 0.5 - c, dy = y + 0.5 - c, ax = Math.abs(dx), ay = Math.abs(dy), n = Math.max(ax, ay, ax + ay - 27); if (n < 37 || n >= 38) continue;
            const base = ctx.baseAt(x, y), diag = ax + ay - 27 >= Math.max(ax, ay), ns = !diag && ax > ay;
            const px = r2(gcx(x) + (diag ? 0 : ns ? Math.sign(dx) * 1.0 : 0)), pz = r2(gcz(y) + (diag ? 0 : ns ? 0 : Math.sign(dy) * 1.0));
            const pipe = { s: 'box', p: [px, r2(base + 0.9), pz], size: diag ? [0.55, 0.55, 5.0] : ns ? [0.55, 0.55, C] : [C, 0.55, 0.55], key: U('MetalCorrugatedPainted1a'), tint: 0x3a78c0 }; if (diag) pipe.ry = (dx * dy > 0) ? 45 : -45;
            const glow = { s: 'box', p: [px, r2(base + 1.45), pz], size: diag ? [0.1, 0.05, 5.0] : ns ? [0.1, 0.05, C] : [C, 0.05, 0.1], tint: 0x7fd0ff, glow: 1 }; if (diag) glow.ry = pipe.ry;
            ctx.part(pipe); ctx.part(glow); ctx.part({ s: 'box', p: [px, base, pz], size: [0.3, 0.9, 0.3], tint: 0x2a2c30 }); ctx.taken.add(x + ':' + y); }
        /* THE CONTROL ROOM (north of the ring, two doorways) */
        { const R = ctx.room('P03-00', 2, 1, 8, 3, 'control'), h = 5.25, wl = { h, key: U('ConcreteStriped2a'), tint: 0xb0b8c4 };
          R.wall('u', 3, 0, 8, Object.assign({ doors: [[1.5, 'leaf_security'], [6.5, 'leaf_security']] }, wl));
          R.label('CONTROL ROOM', 4, 3.18, 0, 2.2);
          for (let i = 0; i < 6; i++) R.B('server_rack', i < 3 ? i : i + 2, 0, 0);
          R.B('steel_table', 3, 1, 0); R.B('steel_table', 4, 1, 0); R.dec('crt_terminal', 3.5, 1.5, 0, { y: 0.78 }); R.dec('crt_terminal', 4.5, 1.5, 0, { y: 0.78 }); R.dec('computer_chair_grey', 3.5, 2.2, 180); R.dec('computer_chair_grey', 4.5, 2.2, 180);
          R.B('monitor_stack', 3, 0, 0); R.dec('water_cooler', 7.6, 2.5, 270); R.dec('trash_bin', 0.4, 2.5); R.dec('desk_lamp', 4.2, 1.3, 0, { y: 0.78 });
          R.who('ai', 5.5, 2.5, 0, ctx.sayOf(ctx.O.ring, 'ai')); R.done(); }
        /* the Vent's head + the service bay */
        ctx.P('radiation_sign', 'P03-00', 7, 10, { face: 270 }); ctx.dec('warning_tape', 'P03-00', 6, 9); ctx.P('traffic_barrel', 'P03-00', 9, 8); ctx.P('traffic_barrel', 'P03-00', 10, 8); ctx.dec('fire_extinguisher', 'P03-00', 8, 9);
        /* THE DETECTOR HALL: THE BEAM in the ring's own lane, the coils in the bays, the gantry along the west bay up its stair */
        { const R = ctx.room('P06-03', 1, 1, 10, 10, 'detector');
          R.B('floating_orb', 4, 4, 0); R.B('meshy_tesla_coil', 8, 2, 0); R.B('meshy_tesla_coil', 8, 7, 0);
          R.deck(0, 0, 2, 7, 3.5, U('MetalSubwayGrill1a')); R.guard('v', 2, 0, 7, 3.5, 0x3a78c0); R.stair(0.5, 10, 0.5, 7, 1, 0, 3.5, 'steel'); R.guard('u', 7, 1, 2, 3.5, 0x3a78c0);
          R.B('steel_table', 8, 5, 90); R.dec('crt_terminal', 8.5, 5.5, 270, { y: 0.78 }); R.dec('computer_chair_grey', 7.8, 5.5, 90); R.dec('monitor_stack', 9.4, 9.4, 225); R.B('radiation_sign', 2, 9, 0); R.dec('security_camera', 9.8, 0.2, 225, { y: 4.0 }); R.dec('evac_button', 9.85, 4.5, 270, { y: 1.3 });
          R.sign('THE BEAM IS ON', 5, 0.08, 6.2, 6, 0.9, 0, '#7fd0ff', '#10202c', 'stencil', 0.6);
          R.who('mad scientist', 2.5, 8.5, 0, ctx.sayOf(ctx.O.ring, 'mad scientist')); R.done();
          const b = ctx.O.ring.c.find(c => c.id === 'battle'), s = ctx.sq('P06-03', 2, 5); if (b) { ctx.counters.push(Object.assign({}, b, { x: gcx(s[0]), z: gcz(s[1]), plateY: r2(plot['P06-03'].base + 2.35) })); ctx.taken.add(s[0] + ':' + s[1]); } }
        /* THE BEAM DUMP: the pile, 3.5 m of it, taped off */
        { const p = plot['P00-03'], s = ctx.sq('P00-03', 1, 4); ctx.feat({ k: 'plateau', x: r2(gx(s[0]) + 3.5), z: r2(gz(s[1]) + 7), w: 7, d: 14, h: r2(p.base + 3.5), edge: 0.15 });
          for (let ly = 4; ly < 8; ly++) for (let lx = 1; lx < 3; lx++) ctx.keep('P00-03', lx, ly);
          ctx.P('radiation_sign', 'P00-03', 3, 3, { face: 90 }); ctx.P('radiation_sign', 'P00-03', 3, 8, { face: 90 }); ctx.dec('warning_tape', 'P00-03', 3, 5); ctx.dec('warning_tape', 'P00-03', 3, 6); ctx.P('traffic_barrel', 'P00-03', 1, 2); ctx.P('traffic_barrel', 'P00-03', 1, 9); }
    },
    dress(ctx) {
        /* the Blast Door's spur, the four service rooms */
        ctx.P('radiation_sign', 'P03-06', 7, 9, { face: 270 }); ctx.dec('evac_button', 'P03-06', 5, 10, { mount: 1.3 });
        [['P00-00', 9, 9], ['P06-00', 2, 9], ['P00-06', 9, 2], ['P06-06', 2, 2]].forEach((q, i) => { if (ctx.free(q[0], q[1], q[2])) ctx.P(i % 2 ? 'cardboard_boxes' : 'traffic_barrel', q[0], q[1], q[2]); });
    },
    people(ctx) { ctx.native('glitch', 'P05-06', 6, 6, 135, ctx.sayOf(ctx.O.ring, 'glitch')); },
};
