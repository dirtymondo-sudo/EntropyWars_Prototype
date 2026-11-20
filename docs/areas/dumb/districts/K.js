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
    /* ── WORLD POLISH thread 8 (2026-11-20, mondo's OK on the plan): THE RING ON THE SQUARES. The ring is a level under Level P3 now (10.5 m), so
       the tram tunnel crosses it on two bridges (P.js). The beam pipe is SOLID (a low wall all round): you cross it on steel crossovers, a
       stair up, a deck over the pipe, a stair down, to the alcoves on its far side, the Control Room (a step up, 12.25 m, a window on the ring),
       the Blast Door and the Beam Dump. One alcove off each plain plot, inner side or across the pipe. THE DETECTOR HALL is a pit 5.25 m under
       the ring's catwalk (a stair down, a ladder out, a gap in the rail). The beam stays level and straight: that is a collider. ── */
    build(ctx) {
        const { C, r2, gcx, gcz, gx, gz, cell, W, H, plot } = ctx, c = W / 2, BLUE = 0x3a78c0, GR = 0x3a4048;
        const M = ctx.room('P00-00', 0, 0, W, H, 'ring');   // u = x, v = y on the map; heights over the ring's floor (10.5)
        /* THE CROSSOVERS: a stair up from the walk, a deck over the pipe at 1.75, (a stair down the far side) */
        const XO = new Set(), STEEL = U('MetalSubwayGrill1a');
        const cross = (side, a0, a1, down) => { const w = a1 - a0 + 1, m = (a0 + a1 + 1) / 2;
            if (side === 'n') { M.stair(m, 6, m, 5, w, 0, 1.75, 'steel'); M.deck(a0, 4, a1 + 1, 5, 1.75, STEEL); if (down) M.stair(m, 3, m, 4, w, 0, 1.75, 'steel'); M.guard('v', a0, 4, 5, 1.75, BLUE); M.guard('v', a1 + 1, 4, 5, 1.75, BLUE); for (let x = a0; x <= a1; x++) XO.add(x + ':4'); }
            if (side === 's') { M.stair(m, 78, m, 79, w, 0, 1.75, 'steel'); M.deck(a0, 79, a1 + 1, 80, 1.75, STEEL); if (down) M.stair(m, 81, m, 80, w, 0, 1.75, 'steel'); M.guard('v', a0, 79, 80, 1.75, BLUE); M.guard('v', a1 + 1, 79, 80, 1.75, BLUE); for (let x = a0; x <= a1; x++) XO.add(x + ':79'); }
            if (side === 'w') { M.stair(6, m, 5, m, w, 0, 1.75, 'steel'); M.deck(4, a0, 5, a1 + 1, 1.75, STEEL); if (down) M.stair(3, m, 4, m, w, 0, 1.75, 'steel'); M.guard('u', a0, 4, 5, 1.75, BLUE); M.guard('u', a1 + 1, 4, 5, 1.75, BLUE); for (let y = a0; y <= a1; y++) XO.add('4:' + y); }
            if (side === 'e') { M.stair(78, m, 79, m, w, 0, 1.75, 'steel'); M.deck(79, a0, 80, a1 + 1, 1.75, STEEL); if (down) M.stair(81, m, 80, m, w, 0, 1.75, 'steel'); M.guard('u', a0, 79, 80, 1.75, BLUE); M.guard('u', a1 + 1, 79, 80, 1.75, BLUE); for (let y = a0; y <= a1; y++) XO.add('79:' + y); } };
        cross('n', 17, 18, true); cross('n', 65, 66, true); cross('n', 39, 39, false); cross('n', 44, 44, false);
        cross('s', 29, 30, true); cross('s', 53, 54, true); cross('s', 41, 43, true);
        cross('w', 17, 18, true); cross('w', 41, 42, true); cross('e', 29, 30, true); cross('e', 53, 54, true);
        /* THE BEAM PIPE: on the outermost row of the ring's squares, all the way round; solid (a low wall a square), the crossovers over it */
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { if (cell[y][x] !== 'r') continue; const dx = x + 0.5 - c, dy = y + 0.5 - c, ax = Math.abs(dx), ay = Math.abs(dy), n = Math.max(ax, ay, ax + ay - 27); if (n < 37 || n >= 38) continue;
            const base = ctx.baseAt(x, y), diag = ax + ay - 27 >= Math.max(ax, ay), ns = !diag && ax > ay;
            const px = r2(gcx(x) + (diag ? 0 : ns ? Math.sign(dx) * 1.0 : 0)), pz = r2(gcz(y) + (diag ? 0 : ns ? 0 : Math.sign(dy) * 1.0));
            const pipe = { s: 'box', p: [px, r2(base + 0.9), pz], size: diag ? [0.55, 0.55, 5.0] : ns ? [0.55, 0.55, C] : [C, 0.55, 0.55], key: U('MetalCorrugatedPainted1a'), tint: BLUE }; if (diag) pipe.ry = (dx * dy > 0) ? 45 : -45;
            const glow = { s: 'box', p: [px, r2(base + 1.45), pz], size: diag ? [0.1, 0.05, 5.0] : ns ? [0.1, 0.05, C] : [C, 0.05, 0.1], tint: 0x7fd0ff, glow: 1 }; if (diag) glow.ry = pipe.ry;
            ctx.part(pipe); ctx.part(glow); ctx.part({ s: 'box', p: [px, base, pz], size: [0.3, 0.9, 0.3], tint: 0x2a2c30 }); ctx.taken.add(x + ':' + y);
            if (XO.has(x + ':' + y) || (x === 79 && y >= 37 && y <= 46)) continue;   // a crossover over it; the catwalk's rail in the Detector Hall
            let e; if (diag) { const q = pipe.ry * Math.PI / 180; e = [px - 2.0 * Math.sin(q), pz - 2.0 * Math.cos(q), px + 2.0 * Math.sin(q), pz + 2.0 * Math.cos(q)]; }
            else e = ns ? [px, gz(y) + 0.05, px, gz(y + 1) - 0.05] : [gx(x) + 0.05, pz, gx(x + 1) - 0.05, pz];
            ctx.feat({ k: 'wall', x0: r2(e[0]), z0: r2(e[1]), x1: r2(e[2]), z1: r2(e[3]), t: 0.7, h: 1.5, y: r2(base + 1.5), y0: base, ghost: true, rail: false }); }
        /* THE CONTROL ROOM: a step up (12.25), its two doors at the crossovers' heads, a window between them on the ring */
        { const S = 1.75, wl = { key: U('ConcreteStriped2a'), tint: 0xb0b8c4, gain: 1.9 };
          ctx.feat({ k: 'plateau', x: r2((gx(38) + gx(46)) / 2), z: r2((gz(1) + gz(4) + 0.5) / 2), w: 8 * C, d: r2(3 * C + 0.5), h: 12.25, edge: 0.05 });
          M.wall('u', 4, 38, 40, Object.assign({ y0: S, h: 3.5, doors: [[39.5, 'leaf_security']] }, wl)); M.wall('u', 4, 44, 46, Object.assign({ y0: S, h: 3.5, doors: [[44.5, 'leaf_security']] }, wl));
          M.wall('u', 4, 40, 44, Object.assign({ y0: S, h: 1.0 }, wl)); M.pane('u', 4, 40, 44, { y0: S + 1.0, h: 1.6 }); M.wall('u', 4, 40, 44, Object.assign({ y0: S + 2.6, h: 0.9, walk: false }, wl));
          M.sign('CONTROL ROOM', 42, 4.06, S + 3.0, 2.6, 0.4, 0, '#7fd0ff', '#10202c', 'stencil', 0.3);
          for (const x of [38, 39, 40, 44, 45]) M.hung('server_rack', x + 0.5, 1.05, 0, 0); M.hung('monitor_stack', 41.5, 1.05, 0, 1.4);
          for (const x of [40, 43]) { M.B('steel_table', x, 2, 0, { y: 12.25 }); M.dec('crt_terminal', x + 0.5, 2.4, 180, { y: S + 0.78 }); M.dec('computer_chair_grey', x + 0.5, 3.3, 0, { y: S }); }
          M.dec('mixing_console', 38.8, 2.6, 90, { y: S }); M.dec('psx_monitoring_screen_mp_1', 45.3, 2.5, 270, { y: S + 0.78 }); M.dec('water_cooler', 45.6, 1.5, 270, { y: S }); M.dec('desk_lamp', 40.3, 2.2, 0, { y: S + 0.78 });
          for (const x of [39.5, 42, 44.5]) M.lamp(x, 2.5, S + 3.3);
          M.who('ai', 42.5, 3.4, 0, ctx.sayOf(ctx.O.ring, 'ai')); }
        /* the Vent's head + the service bay */
        ctx.hang('radiation_sign', 'P03-00', 7, 10, 'e'); ctx.dec('warning_tape', 'P03-00', 6, 9); ctx.P('traffic_barrel', 'P03-00', 9, 8); ctx.P('traffic_barrel', 'P03-00', 10, 8); ctx.dec('fire_extinguisher', 'P03-00', 8, 9);
        /* THE DETECTOR HALL: the pit (5.25 m down), the ring's catwalk over it, THE DETECTOR in it */
        { const PIT = -5.25;
          ctx.feat({ k: 'plateau', sink: true, x: r2((gx(73) + gx(83)) / 2), z: r2((gz(38) + gz(46)) / 2), w: 10 * C, d: 8 * C, h: 5.25, edge: 0.05 });
          ctx.feat({ k: 'plateau', sink: true, x: r2((gx(80) + gx(83)) / 2), z: r2((gz(37) + gz(47)) / 2), w: 3 * C, d: 10 * C, h: 5.25, edge: 0.05 });
          M.deck(76, 38, 79, 46, 0, STEEL); M.guard('v', 76, 38, 41, 0, BLUE); M.guard('v', 76, 42, 46, 0, BLUE); M.guard('v', 79, 37, 47, 0, BLUE);   /* the gap at y 41 = A LEDGE into the pit */
          M.stair(73.5, 41, 73.5, 38, 1, PIT, 0, 'steel'); M.guard('u', 38, 74, 76, 0, BLUE); M.guard('u', 46, 73, 74, 0, BLUE); M.guard('u', 46, 75, 76, 0, BLUE);
          ctx.feat({ k: 'climb', x: M.X(74.5), z: r2(M.Z(46) - 0.3), face: 180, look: 'ladder' });
          M.dec('dockring', 80.6, 41.9, 90, { y: 5.25, floor: true }); M.dec('meshy_tesla_coil', 81.6, 38.7, 0, { y: 5.25, floor: true }); M.dec('meshy_tesla_coil', 81.6, 45.3, 0, { y: 5.25, floor: true });
          M.dec('floating_orb', 74.6, 43.4, 0, { y: 5.25, floor: true }); M.dec('retro_control_panel', 73.4, 39.6, 90, { y: 5.25, floor: true }); M.dec('gauge_board', 75.6, 45.4, 180, { y: 5.25, floor: true }); M.dec('cable_drum', 75.4, 39.0, 30, { y: 5.25, floor: true });
          M.sign('THE BEAM IS ON', 78, 37.06, 4.4, 6, 0.9, 0, '#7fd0ff', '#10202c', 'stencil', 0.6); M.hung('radiation_sign', 73.05, 37.5, 90, 1.7); M.hung('security_camera', 82.9, 37.2, 225, 4.0);
          M.dec('studio_light', 82.4, 41.5, 270, { y: 5.25, floor: true }); for (const q of [[74.5, 41.5], [81.5, 41.5], [77.5, 37.5], [77.5, 46.5]]) M.lamp(q[0], q[1], 9.9);
          M.who('mad scientist', 74.5, 44.5, 0, ctx.sayOf(ctx.O.ring, 'mad scientist'));
          const b = ctx.O.ring.c.find(c => c.id === 'battle'); if (b) { ctx.counters.push(Object.assign({}, b, { x: gcx(74), z: gcz(37), plateY: r2(plot['P06-03'].base + 2.35) })); ctx.taken.add('74:37'); } }
        /* THE BEAM DUMP: the pile, 3.5 m of it, taped off, past the crossover */
        { const p = plot['P00-03']; ctx.feat({ k: 'plateau', x: r2(gx(1) + C), z: r2(gz(43) + 1.5 * C), w: 7, d: 3 * C, h: r2(p.base + 3.5), edge: 0.15 });
          for (let y = 43; y <= 45; y++) for (let x = 1; x <= 2; x++) ctx.taken.add(x + ':' + y);
          M.hung('radiation_sign', 2, 37.95 + 0.1, 0, 1.7); M.dec('warning_tape', 2.5, 42.6, 0); M.dec('warning_tape', 1.5, 42.6, 0); M.dec('traffic_barrel', 1.4, 38.6); M.dec('traffic_barrel', 3.4, 38.6); M.sign('BEAM DUMP', 0.06, 40, 2.6, 2.0, 0.4, -90, '#ffd23a', '#2a2410', 'stencil'); }
        /* THE ALCOVES (plain labels mine) */
        const lab = (w, x, y, ry) => M.sign(w, x, y, 2.6, Math.max(1.4, w.length * 0.16), 0.36, ry, '#7fd0ff', '#10202c', 'stencil');
        /* N1 MAGNET TEST, across the pipe */ M.dec('psx_magnet_mp_1', 16.5, 1.5, 0); M.dec('chain_hoist', 17.5, 1.6, 0, { y: 4.4 }); M.B('steel_table', 19, 1, 0); M.dec('gauge_board', 15.3, 0.6, 90); M.dec('cable_drum', 19.6, 2.6, 40); lab('MAGNET TEST', 17.5, 0.06, 0);
        /* N2 CABLE VAULT */ for (const x of [27.6, 29.0, 30.4]) M.dec('cable_drum', x, 9.5, 20); M.hung('breaker_panel', 32.95, 9, 270, 1.5); M.dec('utility_box', 31.6, 10.3, 180); lab('CABLE VAULT', 30, 10.94, 180);
        /* N4 MONITORING POST */ M.B('steel_table', 53, 9, 0); M.dec('psx_monitoring_screen_mp_1', 53.5, 9.3, 180, { y: 0.78 }); M.dec('computer_chair_grey', 53.5, 8.4, 0); M.dec('psx_dosimeter_1', 54.3, 9.5, 0, { y: 0.78 }); M.dec('molded_chair', 51.6, 9.6, 60); lab('MONITORING', 54, 10.94, 180);
        /* N5 COOLING, across the pipe */ M.dec('centrifugal_pump', 64.5, 1.4, 90); M.dec('centrifugal_pump', 67.5, 1.4, 270); M.dec('gate_valve', 66, 0.5, 0); M.hung('pipe_run', 66, 0.06, 0, 2.6); lab('COOLING', 66, 0.06, 0);
        /* W1 RAD STORE, across the pipe */ for (const q of [[0.7, 15.6], [1.6, 15.5], [0.7, 16.5], [1.5, 19.6], [0.8, 19.4]]) M.dec('radiation_drum', q[0], q[1], 30); M.dec('hazmat_suit', 0.6, 18, 90); M.hung('radiation_sign', 0.06, 17.5, 90, 1.7); lab('RAD STORE', 0.06, 16.2, -90);
        /* W2 LOCKERS */ for (const y of [27, 28, 29]) M.hung('office_locker', 10.95, y + 0.5, 270, 0); M.dec('scba_rack', 10.6, 31, 270); M.dec('metro_bench', 9.4, 29.5, 90); lab('LOCKERS', 10.94, 31.6, 90);
        /* W4 SURVEY */ M.B('map_table', 9, 53, 90); M.dec('cardboard_boxes', 9.4, 55.6, 20); M.dec('gas_cylinder_rack', 10.6, 51.6, 270); lab('SURVEY', 10.94, 54, 90);
        /* E1 BREAK ROOM */ M.hung('vending_machine', 73.05, 16, 90, 0); M.dec('molded_chair', 74.4, 18, 270); M.dec('molded_chair', 74.6, 19, 250); M.B('tulip_table', 74, 18, 0); M.hung('water_cooler', 73.05, 19.5, 90, 0); lab('BREAK ROOM', 73.06, 17.5, -90);
        /* E2 SPARES, across the pipe */ M.B('psx_shelf_mp_3', 82, 27, 270); M.B('psx_shelf_mp_3', 82, 28, 270); M.dec('wrapped_pallet', 81.4, 31.4, 10); M.dec('cardboard_boxes', 82.4, 32.4, 40); lab('SPARES', 83.94, 30, 90);
        /* E4 PUMPS, across the pipe */ M.dec('centrifugal_pump', 81.5, 51.6, 0); M.dec('centrifugal_pump', 81.5, 55.4, 180); M.dec('valve_wheel', 83.6, 53.5, 270, { y: 1.2 }); lab('PUMPS', 83.94, 52.6, 90);
        /* S1 WORKSHOP */ M.dec('tool_chest', 15.6, 73.4, 0); M.dec('welding_cart', 17.5, 74, 30); M.dec('engine_hoist', 19.4, 74.3, 200); M.B('steel_table', 16, 74, 0); lab('WORKSHOP', 18, 73.06, 0);
        /* S2 HELIUM, across the pipe */ M.dec('gas_cylinder_rack', 28, 82.6, 180); M.dec('gas_cylinder_rack', 31, 82.6, 180); M.dec('iso_tank', 32.4, 81.5, 270); lab('HELIUM', 29.5, 83.94, 180);
        /* S4 BACKUP CONTROL, across the pipe */ M.hung('server_rack', 52.5, 83.95, 180, 0); M.hung('server_rack', 53.5, 83.95, 180, 0); M.B('steel_table', 55, 82, 0); M.dec('crt_terminal', 55.5, 82.4, 180, { y: 0.78 }); lab('BACKUP CONTROL', 54, 83.94, 180);
        /* S5 FIRST AID */ M.B('hospital_bed', 64, 74, 90); M.dec('iv_stand', 65.4, 73.6); M.dec('scba_rack', 67.6, 73.4, 0); M.hung('evac_button', 68.95, 74, 270, 1.3); lab('FIRST AID', 66, 73.06, 0);
        /* ════ THE INTERIORS + POLISH PASS (2026-11-20): a sign on each side of the ring saying which side it is and what is on it, the four corner
           rooms dressed (the Old Experiment is the south-east one), grime along the walk ════ */
        M.sign('THE RING · NORTH · CONTROL ROOM', 24, 7.94, 2.8, 5.4, 0.5, 180, '#7fd0ff', '#10202c', 'stencil'); M.sign('THE RING · SOUTH · BLAST DOOR', 24, 76.06, 2.8, 5.0, 0.5, 0, '#7fd0ff', '#10202c', 'stencil');
        M.sign('THE RING · EAST · DETECTOR HALL', 76.06, 26, 2.8, 5.4, 0.5, -90, '#7fd0ff', '#10202c', 'stencil'); M.sign('THE RING · WEST · BEAM DUMP', 7.94, 45, 2.8, 5.0, 0.5, 90, '#7fd0ff', '#10202c', 'stencil');
        M.dec('utility_box', 9.5, 9.5, 45); M.dec('cable_drum', 10.6, 10.4, 20); M.dec('psx_metal_barrel_mp_1', 11.4, 9.6);
        M.dec('psx_shelf_mp_5', 73.5, 9.5, 315); M.dec('cardboard_boxes', 72.5, 10.6, 30); M.dec('cardboard_boxes', 74.4, 11.4, 80);
        M.dec('iso_tank', 10, 73, 45); M.dec('centrifugal_pump', 11.4, 72.6, 0);
        M.B('time_machine', 73, 73, 315); M.dec('meshy_tesla_coil', 74.5, 74.4, 0); M.dec('warning_tape', 72.5, 74.4, 45); M.dec('floor_stain', 73.6, 72.4);
        for (const g of [[22, 6], [47, 6], [70, 15], [78, 28], [78, 60], [60, 77], [30, 77], [6, 30], [6, 58], [12, 10]]) { const q = { 'P0': 0 }; const px = Math.floor(g[0] / 12), py = Math.floor(g[1] / 12); ctx.grime(g[0] % 3 ? 'grime' : 'oil', 'P0' + px + '-0' + py, g[0] % 12, g[1] % 12, 1.3); }
        M.done();
    },
    dress(ctx) {
        /* the Blast Door's spur, the four service rooms */
        ctx.hang('radiation_sign', 'P03-06', 7, 9, 'e'); ctx.dec('evac_button', 'P03-06', 5, 10, { mount: 1.3 });
        [['P00-00', 9, 9], ['P06-00', 2, 9], ['P00-06', 9, 2], ['P06-06', 2, 2]].forEach((q, i) => { if (ctx.free(q[0], q[1], q[2])) ctx.P(i % 2 ? 'cardboard_boxes' : 'traffic_barrel', q[0], q[1], q[2]); });
    },
    people(ctx) { ctx.native('glitch', 'P05-06', 6, 6, 135, ctx.sayOf(ctx.O.ring, 'glitch')); },
};
