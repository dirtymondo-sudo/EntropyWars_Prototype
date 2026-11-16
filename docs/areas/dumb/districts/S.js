/* THE D.U.M.B., district S · SUB-LEVEL 7 (6 plots: a cross in the middle of the base, the lowest level, 14 m under Level P3).
   One thread a file (docs/notes/claims.md). Read by `node bake-dumb.js`; rules: docs/notes/areas-complexes.md "THE D.U.M.B. ON PLOTS".
   THE PILOT DISTRICT of the zone (docs/plans/ZONE_THREAD_BRIEF.md step 7): its passes are in the notes, "THE D.U.M.B., SUB-LEVEL 7".
   BRIEF: "the level that does not exist": the stair says seven, the lift does not stop here. THE HUB in the middle with THE TOWER
   ("The tower has no stair." "How do they get up?" "They do not. That is what it is for."); every department is off this hub:
     south  THE STAIR (P03-04): the long flight down from Level P3's wired door, 14 m; two dead-end side rooms
     west   CHAMBERS 01 + 03 (P02-03): the spoke to Research's stair; 01 THE DROP north of it, 03 THE PIT south of it
     east   CHAMBERS 02 + 04 (P04-03): the spoke to the Vault Gantry's stair; 02 THE CATWALK north, 04 OBSERVATION south
     north  CORRIDOR FIVE (P03-02: "Five is the corridor. Five was always the corridor."): the Healing Zone; stairs up to the Range and
            the Comms Room; then LEVEL -6 (P03-01): rock cut square, the blast door to the Cavern (links.cave_dumb), the Vent's ladder
   STANDS TODAY: see the passes in the notes. */
'use strict';
const U = n => 'urban:' + n, CONC = U('ConcreteStriped1d'), GRILL = U('MetalSubwayGrill1a'), HAZ = 0xe0b020, DARK = 0x2a2c30;
module.exports = {
    look: { wall: CONC, tint: 0xb4b8bc, band: HAZ, ceil: GRILL, ceilTint: 0x8a9096, light: 0xdfe8ff, every: 3 },
    looks: { 'P03-01': { wall: 'rocks_5', tint: 0x9a9690, band: null, ceil: 'rocks_5', ceilTint: 0x6a6660, light: 0xffb060, every: 5 } },
    build(ctx) {
        const { C, r2, gcx, gcz, gx, gz, plot } = ctx, O = ctx.O, wl = { h: 7, key: CONC, tint: 0xb4b8bc };
        /* ── THE HUB (P03-03): THE TOWER, 10.5 m of concrete on the hub's middle four squares, no stair, a lit band round its head ── */
        { const p = plot['P03-03'], cx = gx(p.sx + 6), cz = gz(p.sy + 6);
          ctx.feat({ k: 'plateau', x: cx, z: cz, w: 7, d: 7, h: 10.5, edge: 0.1 }); for (const q of [[5, 5], [6, 5], [5, 6], [6, 6]]) ctx.keep('P03-03', q[0], q[1]);
          for (const [dx, dz, w, d] of [[0, -3.56, 7.2, 0.1], [0, 3.56, 7.2, 0.1], [-3.56, 0, 0.1, 7.2], [3.56, 0, 0.1, 7.2]]) { ctx.part({ s: 'box', p: [r2(cx + dx), 9.4, r2(cz + dz)], size: [w, 0.5, d], tint: 0xff3020, glow: 1 }); ctx.part({ s: 'box', p: [r2(cx + dx), 0, r2(cz + dz)], size: [w, 1.2, d], tint: HAZ }); }
          const R = ctx.room('P03-03', 1, 1, 10, 10, 'hub');
          R.sign('SUB-LEVEL 7', 5, 3.42, 6.4, 5.2, 0.9, 180, '#e8e4d0', '', 'stencil', 0.3); R.sign('SUB-LEVEL 7', 5, 6.58, 6.4, 5.2, 0.9, 0, '#e8e4d0', '', 'stencil', 0.3);
          R.B('steel_table', 1, 1, 0); R.dec('crt_terminal', 1.5, 1.5, 0, { y: 0.78 }); R.dec('computer_chair_grey', 1.5, 2.3, 180); R.B('monitor_stack', 8, 1, 0); R.B('cardboard_boxes', 8, 8, 0); R.dec('traffic_cone', 2.4, 8.5); R.dec('security_camera', 0.2, 0.2, 135, { y: 5.0 }); R.dec('floor_stain', 3.5, 6.5);
          R.who('men in black', 6.5, 8.5, 250, ctx.sayOf(O.sublevel7, 'men in black')); R.done(); }
        /* ── CHAMBERS 01 + 03 (P02-03) ── */
        { const R = ctx.room('P02-03', 1, 1, 10, 10, 'ch13');
          R.wall('u', 4, 0, 10, Object.assign({ doors: [[7.5, 'leaf_security']] }, wl)); R.wall('u', 7, 0, 10, Object.assign({ doors: [[2.5, 'leaf_security']] }, wl));
          R.sign('01', 7.5, 4.18, 3.2, 1.2, 0.9, 0, '#e8e4d0', '', 'stencil', 0.3); R.label('THE DROP', 7.5, 4.18, 0, 1.4); R.sign('03', 2.5, 6.82, 3.2, 1.2, 0.9, 180, '#e8e4d0', '', 'stencil', 0.3); R.label('THE PIT', 2.5, 6.82, 180, 1.2);
          /* 01 THE DROP: a tier 3.5 m up a stair, and the edge */
          ctx.feat({ k: 'plateau', x: R.X(1.5), z: R.Z(2), w: 3 * C, d: 4 * C, h: 3.5, edge: 0.1 }); R.stair(6, 1.5, 3, 1.5, 1, 0, 3.5, 'concrete'); for (let u = 0; u < 3; u++) for (let v = 0; v < 4; v++) R.keep(u, v);
          R.box(3.02, 2, 3.5, 0.08, 0.02, 4 * C, null, HAZ);
          R.who('mad scientist', 8.5, 2.5, 90, ctx.sayOf(O.sublevel7, 'mad scientist'));
          /* 03 THE PIT: a railed bowl (the pit itself is the pilot's) */
          R.who('telepath', 6.5, 8.5, 200, ctx.sayOf(O.sublevel7, 'telepath')); R.B('radiation_sign', 0, 9, 90); R.dec('warning_tape', 4.5, 8.5, 0);
          R.done(); }
        /* ── CHAMBERS 02 + 04 (P04-03) ── */
        { const R = ctx.room('P04-03', 1, 1, 10, 10, 'ch24');
          R.wall('u', 4, 0, 10, Object.assign({ doors: [[2.5, 'leaf_security']] }, wl)); R.wall('u', 7, 0, 10, Object.assign({ doors: [[7.5, 'leaf_security']] }, wl));
          R.sign('02', 2.5, 4.18, 3.2, 1.2, 0.9, 0, '#e8e4d0', '', 'stencil', 0.3); R.label('THE CATWALK', 2.5, 4.18, 0, 1.7); R.sign('04', 7.5, 6.82, 3.2, 1.2, 0.9, 180, '#e8e4d0', '', 'stencil', 0.3); R.label('OBSERVATION', 7.5, 6.82, 180, 1.7);
          /* 02 THE CATWALK: two towers 3.5 m and the plank between them; a stair up the west one */
          ctx.feat({ k: 'plateau', x: R.X(4.5), z: R.Z(1.5), w: C, d: C, h: 3.5, edge: 0.1 }); ctx.feat({ k: 'plateau', x: R.X(8.5), z: R.Z(1.5), w: C, d: C, h: 3.5, edge: 0.1 }); R.keep(4, 1); R.keep(8, 1);
          R.deck(5, 1.25, 8, 1.75, 3.5, U('MetalCorrugatedPainted3a')); R.stair(1, 1.5, 4, 1.5, 1, 0, 3.5, 'steel');
          R.who('android', 6.5, 3.2, 0, ctx.sayOf(O.sublevel7, 'android'));
          /* 04 OBSERVATION: the deck behind the round windows, up its stair */
          R.deck(0, 9, 7, 10, 3.5, GRILL); R.guard('u', 9, 0, 7, 3.5, HAZ); R.stair(9.5, 9.5, 7, 9.5, 1, 0, 3.5, 'steel');
          R.B('observation_window', 2, 7, 0); R.B('observation_window', 5, 7, 0); R.B('steel_table', 9, 7, 90); R.dec('clipboard_flat', 9.5, 7.5, 10, { y: 0.78 }); R.dec('desk_lamp', 9.4, 7.3, 0, { y: 0.78 });
          R.who('grey', 3.5, 8.5, 270, ctx.sayOf(O.sublevel7, 'grey')); R.done(); }
        /* ── CORRIDOR FIVE (P03-02): the Healing Zone ── */
        { const hz = O.sublevel7.c.find(c => c.id === 'healzone'), s = ctx.sq('P03-02', 6, 9); if (hz) { ctx.counters.push(Object.assign({}, hz, { x: gcx(s[0]), z: gcz(s[1]), plateY: r2(plot['P03-02'].base + 2.35) })); ctx.taken.add(s[0] + ':' + s[1]); }
          const R = ctx.room('P03-02', 3, 0, 6, 12, 'five'); R.sign('5', 0.08, 2.5, 2.6, 1.6, 2.0, 90, '#e8e4d0', '', 'stencil', 0.3); R.sign('5', 5.92, 9.5, 2.6, 1.6, 2.0, -90, '#e8e4d0', '', 'stencil', 0.3); R.done(); }
        /* ── LEVEL -6 (P03-01): the blast door in the rock (the link's own door), the camera that has not been dusted ── */
        { const R = ctx.room('P03-01', 2, 2, 8, 8, 'minus6'); R.dec('security_camera', 0.3, 7.7, 45, { y: 4.0 }); R.B('radiation_sign', 0, 2, 90); R.B('cardboard_boxes', 7, 7, 0); R.dec('bare_bulb', 4, 4, 0, {}); R.props.pop(); ctx.props.pop();
          R.sign('LEVEL -6', 0.08, 4.5, 3.4, 3.0, 0.7, 90, '#e8e4d0', '', 'stencil', 0.4); R.done(); }
        /* ── THE STAIR (P03-04): the two side rooms ── */
        ctx.P('cardboard_boxes', 'P03-04', 1, 2); ctx.P('traffic_cone', 'P03-04', 10, 5); ctx.P('office_locker', 'P03-04', 1, 5, { face: 90 }); ctx.P('office_locker', 'P03-04', 10, 2, { face: 270 });
    },
};
