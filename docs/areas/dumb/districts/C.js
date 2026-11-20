/* THE D.U.M.B., district C · COMMAND (7 plots east of the hub, 3.5 m up the Vault Gantry's stair).
   One thread a file (docs/notes/claims.md). Read by `node bake-dumb.js`; rules: docs/notes/areas-complexes.md "THE D.U.M.B. ON PLOTS".
   BRIEF: who runs it and who paid for it.
     THE VAULT GANTRY (P05-03): the head of the stair from the hub. The round vault door north = THE WAR ROOM; the hotel door south =
       the Bunker's PRIVATE LIFT ("He paid for the door. He did not pay for the level."). THE PRIVATE STAIR runs behind its east wall,
       from the War Room's south gallery to the Great Room.
     THE WAR ROOM: the Round Table (P05-02: "Round table." "Two tables." "Round enough."), the Big Board (P05-01, the landmark: it has
       always said DEFCON), the Projection Booth (P04-01: it projects the board, onto the board), the Comms Room (P04-02, label mine).
     THE BUNKER: the Great Room (P05-04: false windows, the loft) and the Pool with the Cellar (P04-04: THE SAFE).
   STANDS TODAY (the first build): the rooms, their doors, the old rooms' props and people with their own lines; the pool is water.
   NOT YET: everything a district pass does (the pit under the table, the galleries, the loft, the cellar's racks, the big board as
   more than three screens: NEEDS A MODEL; the bunker's luxury). */
'use strict';
const U = n => 'urban:' + n, MARBLE = U('TileMarble1a');
const BUNKER = { wall: U('PlasterWallPainted1a'), tint: 0xe8dcc8, gain: 2.2, band: 0xc9a24a, ceil: U('PlasterWallStucco1a'), ceilTint: 0xd0c8bc, light: 0xffe0a0, every: 3 };
module.exports = {
    look: { wall: U('ConcreteStriped1e'), tint: 0x9aa0a6, gain: 1.9, band: 0x30c060, ceil: U('FibreCeilingTile1b'), ceilTint: 0x6a7076, light: 0x9fc8ff, every: 3 },
    looks: { 'P05-04': BUNKER, 'P04-04': BUNKER },
    plan(ctx) { for (const id of ['P05-04', 'P04-04']) ctx.paint(id, 0, 0, 12, 12, MARBLE); },
    /* ── WORLD POLISH thread 8 (2026-11-20, mondo's OK on the plan): COMMAND ON THE SQUARES. THE LEVELS (absolute): the War Room's floor 3.5,
       the Big Board's walk 5.25, its galleries 7.0 (decks; you walk in under the south one), the Projection Booth 10.5 (its balcony a ledge down
       to the west gallery), the Vault Gantry 3.5 (a cross of bridges) over THE VAULT at −3.5 (a ledge in, a ladder out), the Bunker 3.5 with
       the Great Room's sunk lounge at 1.75 and its loft at 7.0, the Pool's deck at 1.75 and the Cellar at 0. ── */
    build(ctx) {
        const { r2, C } = ctx, O = ctx.O, od = (R, id) => (R.d.find(d => d.id === id) || {});
        const CON = { key: U('ConcreteStriped1e'), tint: 0x8a9096, gain: 1.9 }, PL = { key: U('PlasterWallPainted1b'), tint: 0xe8dcc8, gain: 2.0 }, GR = 0x3a4048, STEEL = U('MetalSubwayGrill1a');
        const lift = (R, u0, v0, u1, v1, h, e) => { e = e || {}; const x0 = R.X(u0) - (e.w || 0), x1 = R.X(u1) + (e.e || 0), z0 = R.Z(v0) - (e.n || 0), z1 = R.Z(v1) + (e.s || 0);
            ctx.feat(Object.assign({ k: 'plateau', x: r2((x0 + x1) / 2), z: r2((z0 + z1) / 2), w: r2(x1 - x0), d: r2(z1 - z0), h, edge: 0.05 }, e.sink ? { sink: true } : {})); };

        /* ════ THE WAR ROOM (P05-01 + P05-02 as one hall, x 61..70, y 15..34): u = x − 60, v = y − 12, heights over 3.5 ════ */
        { const R = ctx.room('P05-01', 0, 0, 12, 24, 'war');
          lift(R, 1, 3, 11, 5, 5.25, { s: 0.05 }); R.stair(3.5, 6, 3.5, 5, 1, 0, 1.75, 'precast'); R.stair(8.5, 6, 8.5, 5, 1, 0, 1.75, 'precast');   // THE BIG BOARD'S WALK
          lift(R, 0, 5, 1, 8, 10.5, { w: 0.6 });                                                                                                        // the Booth's balcony
          R.deck(1, 6, 3, 21, 3.5, STEEL); R.deck(9, 6, 11, 21, 3.5, STEEL); R.deck(1, 21, 11, 23, 3.5, STEEL);                                          // THE GALLERIES
          R.stair(3.5, 18, 3.5, 21, 1, 0, 3.5, 'steel'); R.stair(8.5, 18, 8.5, 21, 1, 0, 3.5, 'steel');
          R.guard('v', 3, 6, 12, 3.5, GR); R.guard('v', 3, 14, 21, 3.5, GR); R.guard('v', 9, 6, 12, 3.5, GR); R.guard('v', 9, 14, 21, 3.5, GR); R.guard('u', 21, 4, 8, 3.5, GR);   /* gaps at v 12..14 = THE LEDGES */
          R.guard('v', 1, 5, 6, 7, GR); R.guard('v', 1, 7, 8, 7, GR);                                                                                    /* the balcony's gap at v 6 = a ledge to the gallery */
          /* THE BIG BOARD: what it has always said */
          R.sign('DEFCON', 5.5, 3.06, 6.2, 8.0, 1.8, 0, '#40ff80', '#06140a', 'stencil', 0.8);
          for (const u of [2, 4, 7, 9]) R.hung('dream_screen', u + 0.5, 3.06, 0, 3.0); R.hung('world_clocks', 5.5, 3.06, 0, 4.4); R.hung('departures_board', 2.5, 3.06, 0, 4.6); R.hung('departures_board', 8.5, 3.06, 0, 4.6);
          R.dec('city_scale_model', 5.5, 4, 0); R.dec('lectern', 4.6, 4.4, 180);
          /* the floor: the round table (two of them), the map table, the consoles under the galleries */
          R.B('conference_table', 5, 11, 0); R.B('conference_table', 5, 12, 0); R.keep(6, 11); R.keep(6, 12);
          [[4.6, 11.5, 90], [4.6, 12.5, 90], [7.4, 11.5, 270], [7.4, 12.5, 270], [5.6, 10.6, 0], [6.4, 10.6, 0], [6, 13.4, 180]].forEach(q => R.dec('computer_chair_grey', q[0], q[1], q[2]));
          R.dec('rotary_phone', 5.6, 11.6, 0, { y: 0.74 }); R.dec('rotary_phone', 6.4, 12.4, 180, { y: 0.74 }); R.dec('papers_a', 6, 12, 20, { y: 0.74 }); R.dec('manila_folder', 5.4, 12.3, 60, { y: 0.74 }); R.dec('nameplate', 6, 11.3, 0, { y: 0.74 });
          R.B('map_table', 5, 16, 0); R.dec('globe_lamp', 7.4, 16.5);
          for (const v of [7, 9, 11, 15, 17]) { R.dec('retro_control_panel', 1.35, v + 0.5, 90); R.dec('computer_chair_grey', 2.3, v + 0.5, 270); R.dec('retro_control_panel', 10.65, v + 0.5, 270); R.dec('computer_chair_grey', 9.7, v + 0.5, 90); }
          for (const v of [8, 12, 16]) { R.dec('radio_console', 1.4, v + 0.5, 90, { y: 3.5 }); R.dec('molded_chair', 2.4, v + 0.5, 270, { y: 3.5 }); R.dec('crt_terminal', 10.6, v + 0.5, 270, { y: 3.5 }); }
          R.dec('cinema_seat_row', 3.5, 22, 0, { y: 3.5 }); R.dec('cinema_seat_row', 8.5, 22, 0, { y: 3.5 }); R.hung('security_camera', 10.9, 3.2, 225, 5.5); R.hung('evac_button', 1.05, 19.5, 90, 1.3);
         
          for (const q of [[3, 9], [9, 9], [3, 15], [9, 15], [6, 7], [6, 19]]) R.lamp(q[0], q[1], 10.8);
          for (const q of [[2, 10], [10, 10], [2, 17], [10, 17], [6, 22.5]]) R.lamp(q[0], q[1], 3.3);
          R.who('general', 6, 9.5, 180, ctx.sayOf(O.warroom, 'general')); R.who('politician', 8, 14.5, 300, ctx.sayOf(O.warroom, 'politician')); R.who('men in black', 3.5, 4.5, 180, ctx.sayOf(O.warroom, 'men in black'));
          R.done(); }

        /* ════ THE PROJECTION BOOTH (P04-01, 10.5 m): u = x − 48, v = y − 12 ════ */
        { const R = ctx.room('P04-01', 0, 0, 12, 12, 'booth');
          R.B('film_projector', 10, 6, 270); R.B('steel_table', 9, 4, 270); R.dec('reel_to_reel', 9.5, 4.4, 270, { y: 0.78 }); R.dec('computer_chair_grey', 8.6, 4.5, 90);
          R.hung('filing_cabinet', 2.3, 3.05, 0, 0); R.hung('filing_cabinet', 3.3, 3.05, 0, 0); R.dec('cardboard_boxes', 3.5, 8.5, 30); R.dec('decor_av_cart', 6.5, 8.4, 0); R.dec('studio_light', 2.6, 6.5, 90);
          R.sign('THE PROJECTION BOOTH', 6.5, 3.06, 2.4, 3.6, 0.4, 0, '#f0f0f0', '#23262b'); for (const q of [[4, 5], [8, 5], [6, 8]]) R.lamp(q[0], q[1], 3.8);
          R.done(); }

        /* ════ THE COMMS ROOM (P04-02): u = x − 48, v = y − 24 ════ */
        { const R = ctx.room('P04-02', 0, 0, 12, 12, 'comms');
          for (const u of [1, 2]) R.hung('server_rack', u + 0.5, 1.05, 0, 0); for (const u of [8, 9]) R.hung('server_rack', u + 0.5, 1.05, 0, 0);
          for (const v of [3, 5, 7, 9]) { R.dec('radio_console', 10.6, v + 0.5, 270); R.dec('computer_chair_grey', 9.7, v + 0.5, 90); }
          R.B('tanker_desk', 2, 4, 90); R.B('tanker_desk', 2, 6, 90); R.dec('meshy_analog_phone', 2.4, 4.4, 90, { y: 0.78 }); R.dec('meshy_analog_phone', 2.4, 6.4, 90, { y: 0.78 }); R.dec('computer_chair_grey', 3.2, 4.5, 270); R.dec('computer_chair_grey', 3.2, 6.5, 270);
          R.B('map_table', 5, 8, 0); R.dec('field_radio', 5.4, 8.4, 30, { y: 0.77 }); R.hung('monitor_stack', 10.95, 10, 270, 1.4); R.hung('wall_clock', 6.5, 10.95, 180, 2.6);
          R.sign('THE COMMS ROOM', 6.5, 10.94, 3.2, 2.8, 0.45, 180, '#30c060', '#0c1410', 'stencil'); R.label('TO THE BOOTH', 6.5, 1.06, 0, 1.6);
          for (const q of [[3, 3], [8, 4], [3, 8], [8, 8]]) R.lamp(q[0], q[1], 5.1);
          R.done(); }

        /* ════ THE VAULT GANTRY (P05-03): a cross of bridges over THE VAULT. u = x − 60, v = y − 36, heights over 3.5 ════ */
        { const R = ctx.room('P05-03', 0, 0, 12, 12, 'gantry');
          lift(R, 1, 2, 9, 9, -3.5, { sink: true });
          R.deck(0, 5, 10, 8, 0, STEEL); R.deck(5, 2, 8, 9, 0, STEEL);
          R.guard('u', 5, 1, 2, 0, GR); R.guard('u', 5, 3, 5, 0, GR); R.guard('u', 5, 8, 9, 0, GR); R.guard('u', 8, 1, 5, 0, GR); R.guard('u', 8, 8, 9, 0, GR);   /* the gap at u 2..3 = THE LEDGE into the vault */
          R.guard('v', 5, 2, 5, 0, GR); R.guard('v', 5, 8, 9, 0, GR); R.guard('v', 8, 2, 5, 0, GR); R.guard('v', 8, 8, 9, 0, GR);
          ctx.feat({ k: 'climb', x: R.X(2.5), z: r2(R.Z(9) - 0.3), face: 180, look: 'ladder' });                                                        // the way out of the vault
          R.wall('u', 2, 5, 8, Object.assign({ doors: [[6.5, od(O.sublevel7, 'war').leaf || 'leaf_vault', 1]], h: 5.25 }, CON)); R.sign('THE WAR ROOM', 6.5, 2.06, 2.7, 1.9, 0.24, 0, '#f0f0f0', '#23262b');
          R.wall('u', 10, 5, 8, Object.assign({ doors: [[6.5, od(O.sublevel7, 'bunker').leaf || 'leaf_hotel']], h: 5.25 }, CON)); R.sign('LOBBY', 6.5, 9.94, 2.42, 1.0, 0.24, 180, '#f0f0f0', '#23262b');
          /* THE VAULT, 7 m down */
          R.dec('vault', 3.5, 2.5, 0, { y: -3.5 }); R.dec('deposit_box_wall', 1.4, 4.5, 90, { y: -3.5 }); R.dec('deposit_box_wall', 1.4, 7, 90, { y: -3.5 });
          R.dec('money_sacks', 7.4, 3.0, 20, { y: -3.5 }); R.dec('money_sacks', 7.6, 3.7, 80, { y: -3.5 }); R.dec('cash_cart', 3.5, 4.6, 30, { y: -3.5 }); R.dec('psx_gold_bar_pcs_1', 6.5, 8.4, 0, { y: -3.5 }); R.dec('psx_gold_bar_pcs_1', 6.9, 8.5, 40, { y: -3.5 }); R.dec('floor_safe', 3.4, 8.3, 0, { y: -3.5 });
          R.sign('THE VAULT', 2.5, 8.94, -1.2, 1.8, 0.4, 180, '#e0c060', '#1a1610', 'stencil');
          for (const q of [[2.5, 3.5], [7.5, 3.5], [3.5, 7.5]]) R.lamp(q[0], q[1], 0.5);
          R.hung('keypad', 5.05, 1.4, 90, 1.3); R.hung('security_camera', 8.9, 2.1, 225, 4.0); R.dec('potted_plant', 7.6, 9.6); R.dec('potted_plant', 5.4, 9.6);
          for (const q of [[6.5, 6.5], [2.5, 6.5], [9.5, 6.5]]) R.lamp(q[0], q[1], 5.1);
          R.done(); }

        /* ════ THE GREAT ROOM (P05-04, the plot at 1.75): u = x − 60, v = y − 48 ════ */
        { const R = ctx.room('P05-04', 0, 0, 12, 12, 'great');
          lift(R, 1, 0, 11, 3, 3.5, { n: 0.5 }); lift(R, 1, 8, 11, 10, 3.5); lift(R, 1, 2, 3, 9, 3.5); lift(R, 9, 2, 11, 9, 3.5);   /* the floor, round THE SUNK LOUNGE (u 3..8, v 3..7) */
          R.stair(6, 4, 6, 3, 2, 0, 1.75, 'precast'); R.stair(0, 6.5, 1, 6.5, 3, 0, 1.75, 'precast');                                     // down into the lounge; down to the Pool's corridor
          R.deck(1, 1, 11, 3, 5.25, U('WoodFloor1a')); R.stair(10.5, 6, 10.5, 3, 1, 1.75, 5.25, 'precast'); R.guard('u', 3, 1, 10, 5.25, 0x8a6a40);   // THE LOFT
          for (const u of [2, 5.5, 9]) R.hung('false_window', u + 0.5, 9.95, 180, 1.6);
          R.B('curved_couch', 5, 5, 0); R.B('chesterfield_sofa', 4, 3, 180); R.dec('shag_rug', 6, 5.4); R.B('coffee_table', 6, 4, 0); R.dec('xmas_champagne', 6.4, 4.4, 0, { y: 0.45 }); R.dec('solo_cup', 6.6, 4.6, 0, { y: 0.45 });
          R.B('mobius_bar', 10, 7, 270); R.dec('bar_stool', 9.3, 7.2); R.dec('bar_stool', 9.3, 7.9); R.dec('psx_glass_bottle_1', 10.4, 7.3, 0, { y: 1.1 });
          R.B('jukebox', 1, 8, 90); R.B('decor_piano', 1, 4, 90); R.B('royal_throne', 2, 9, 0); R.B('tube_tv', 7, 9, 180); R.dec('marble_bust', 9.5, 9.5, 200); R.B('mini_fridge', 10, 9, 270);
          R.dec('crystal_chandelier', 6, 5, 0, { y: 7.6 }); R.hung('painting_landscape', 1.05, 6.5, 90, 1.8);
          R.B('couples_bed', 3, 1, 0, { y: 7.0 }); R.dec('library_shelf_full', 7.5, 1.2, 0, { y: 7.0 }); R.dec('fur_rug', 5, 2.4, 0, { y: 7.0 }); R.dec('globe_lamp', 9.5, 1.5, 0, { y: 7.0 });
          R.hung('keypad', 5.05, 0.5, 90, 1.3); R.hung('security_camera', 10.8, 9.8, 315, 3.4); R.dec('potted_plant', 1.4, 1.4); R.sign('THE GREAT ROOM', 6.5, 0.06, 2.9, 2.6, 0.4, 0, '#2a2418', '#efe4cc');
          for (const q of [[2, 6], [10, 4], [6, 9]]) R.lamp(q[0], q[1], 7.6);
          R.who('politician', 7.5, 6.5, 300, ctx.sayOf(O.bunker, 'politician')); R.who('juggernaut', 4.5, 8.5, 180, ctx.sayOf(O.bunker, 'juggernaut'));
          R.done(); }

        /* ════ THE POOL + THE CELLAR (P04-04, the deck at 1.75): u = x − 48, v = y − 48 ════ */
        { const R = ctx.room('P04-04', 0, 0, 12, 12, 'pool');
          /* THE CELLAR: a room UNDER the deck (its floor at −1.75), the deck carried over it, a stair down through an opening in the corner */
          lift(R, 1, 7, 4, 10, -1.75, { sink: true }); R.deck(2, 7, 4, 10, 0, U('TileMarble1a')); R.deck(1, 9, 2, 10, 0, U('TileMarble1a')); R.stair(1.5, 9, 1.5, 7, 1, -3.5, 0, 'precast');
          R.guard('v', 2, 7, 9, 0, 0xb09060); R.sign('THE CELLAR', 1.5, 6.95, 1.0, 1.4, 0.22, 0, '#f0f0f0', '#23262b');
          R.B('pool_lounger', 7, 7, 0); R.B('pool_lounger', 8, 7, 0); R.B('pool_umbrella', 9, 8, 0); R.dec('wet_floor_sign', 9.6, 5.5, 40); R.B('pool_lounger', 9, 2, 180); R.dec('pool_umbrella', 7.4, 1.4);
          for (const q of [[2.4, 9.75, 180], [3.4, 9.75, 180]]) R.dec('library_shelf_full', q[0], q[1], q[2], { y: -1.75, floor: true }); R.dec('wooden_barrel', 3.5, 8.4, 40, { y: -1.75, floor: true }); R.dec('floor_safe', 3.6, 7.4, 0, { y: -1.75, floor: true });
          R.hung('evac_button', 1.05, 4.5, 90, 1.3); R.dec('potted_plant', 10.5, 1.5); R.dec('potted_plant', 1.5, 1.5);
          for (const q of [[5.5, 3], [5.5, 7], [9, 5]]) R.lamp(q[0], q[1], 5.1); R.lamp(3, 8.5, -0.2);
          R.who('catgirl', 9.5, 4.5, 270, ctx.sayOf(O.bunker, 'catgirl'));
          R.done(); }

        /* ════ THE INTERIORS + POLISH PASS (2026-11-20): the vault's hoard, the Great Room's chairs and pictures, the War Room's real light, the floors' grime ════ */
        { const G = ctx.room('P05-03', 0, 0, 12, 12, 'gantry2'), V = { y: -3.5, floor: true };
          for (const q of [[6.6, 3.2, 40], [7.0, 4.4, 120], [2.4, 7.6, 10], [7.4, 6.4, 70]]) G.dec('money_sacks', q[0], q[1], q[2], V);
          G.dec('cash_cart', 6.2, 7.6, 200, V); G.dec('jewelry_case', 4.4, 7.7, 0, V); G.dec('lady_justice', 7.6, 8.4, 225, V); G.dec('marble_bust', 1.6, 3.0, 90, V); G.done(); }
        { const G = ctx.room('P05-04', 0, 0, 12, 12, 'great2');
          G.dec('wingback_chair', 3.6, 5.6, 90); G.dec('wingback_chair', 3.6, 6.8, 70); G.hung('painting_portrait', 10.95, 5.5, 270, 2.0); G.hung('painting_seascape', 6.0, 0.05, 0, 2.2); G.dec('globe_lamp', 8.4, 3.6); G.done(); }
        { const W = ctx.room('P05-01', 0, 0, 12, 24, 'war2'); W.bulb(6, 12, 10.6); W.done(); }   // THE WAR ROOM's real light
        for (const g of [['oil', 'P05-02', 5, 3], ['grime', 'P05-01', 3, 8], ['grime', 'P05-02', 8, 6], ['grime', 'P04-02', 5, 5], ['oil', 'P04-02', 9, 4]]) ctx.grime(g[0], g[1], g[2], g[3], 1.2);
    },
};
