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
    build(ctx) {
        const { r2, plot } = ctx, O = ctx.O, wl = { h: 5.25, key: U('ConcreteStriped1e'), tint: 0x8a9096 }, od = (R, id) => (R.d.find(d => d.id === id) || {});
        /* ── THE VAULT GANTRY (P05-03): the vault door north, the hotel door south ── */
        { const R = ctx.room('P05-03', 5, 0, 3, 12, 'gantry');
          R.wall('u', 2, 0, 3, Object.assign({ doors: [[1.5, od(O.sublevel7, 'war').leaf || 'leaf_vault', 1]] }, wl)); R.label('THE WAR ROOM', 1.5, 2.18, 0, 1.9);
          R.wall('u', 10, 0, 3, Object.assign({ doors: [[1.5, od(O.sublevel7, 'bunker').leaf || 'leaf_hotel']] }, wl)); R.label('LOBBY', 1.5, 9.82, 180, 1.0);
          R.dec('keypad', 0.4, 2.18, 0, { y: 1.3 }); R.done();
          ctx.P('potted_plant', 'P05-03', 2, 9); ctx.P('security_camera', 'P05-03', 1, 2, { mount: 4.0, face: 135 }); }
        /* ── THE ROUND TABLE (P05-02) ── */
        { const R = ctx.room('P05-02', 1, 1, 10, 10, 'table');
          R.B('conference_table', 4, 4, 0); R.B('conference_table', 4, 5, 0); R.keep(5, 4); R.keep(5, 5);
          [[3.6, 4.5, 90], [3.6, 5.5, 90], [6.6, 4.5, 270], [6.6, 5.5, 270], [4.6, 3.6, 0], [5.4, 3.6, 0], [5, 6.5, 180]].forEach(q => R.dec('computer_chair_grey', q[0], q[1], q[2]));
          R.dec('rotary_phone', 4.6, 4.6, 0, { y: 0.74 }); R.dec('rotary_phone', 5.4, 5.4, 180, { y: 0.74 }); R.dec('papers_a', 5, 5, 20, { y: 0.74 }); R.dec('manila_folder', 4.4, 5.3, 60, { y: 0.74 }); R.dec('nameplate', 5, 4.3, 0, { y: 0.74 });
          R.dec('world_clocks', 5, 9.85, 180, { y: 2.6 }); R.B('water_cooler', 0, 9, 90); R.dec('trash_bin', 0.5, 0.5); R.dec('security_camera', 9.8, 0.2, 225, { y: 6.0 }); R.dec('evac_button', 0.15, 4.5, 90, { y: 1.3 });
          R.wall('u', 10, 9, 10, Object.assign({ doors: [[9.5, 'leaf_hotel']] }, wl));
          R.who('general', 5, 2.5, 0, ctx.sayOf(O.warroom, 'general')); R.who('politician', 7.5, 6.5, 300, ctx.sayOf(O.warroom, 'politician')); R.done(); }
        /* ── THE BIG BOARD (P05-01): three screens on the north wall, and what it has always said ── */
        { const R = ctx.room('P05-01', 1, 3, 10, 8, 'board');
          [3, 4, 6].forEach(u => R.B('dream_screen', u, 0, 0)); R.sign('DEFCON', 5, 0.08, 5.6, 7.0, 1.6, 0, '#40ff80', '#06140a', 'stencil', 0.8);
          R.B('monitor_stack', 1, 0, 0); R.B('monitor_stack', 8, 0, 0); R.B('steel_table', 2, 3, 0); R.dec('crt_terminal', 2.5, 3.5, 0, { y: 0.78 }); R.dec('computer_chair_grey', 2.5, 4.3, 180); R.dec('desk_lamp', 2.2, 3.3, 0, { y: 0.78 });
          R.who('men in black', 1.5, 5.5, 90, ctx.sayOf(O.warroom, 'men in black')); R.done(); }
        /* ── THE PROJECTION BOOTH (P04-01) + THE COMMS ROOM (P04-02) ── */
        ctx.P('steel_table', 'P04-01', 9, 4, { face: 90 }); ctx.P('reel_to_reel', 'P04-01', 9, 8, { face: 270 }); ctx.P('computer_chair_grey', 'P04-01', 8, 4, { face: 90 }); ctx.P('filing_cabinet', 'P04-01', 2, 3, { face: 0 }); ctx.P('filing_cabinet', 'P04-01', 3, 3, { face: 0 });
        ctx.P('steel_table', 'P04-02', 3, 3, { face: 0 }); ctx.P('steel_table', 'P04-02', 6, 3, { face: 0 }); ctx.P('monitor_stack', 'P04-02', 9, 2, { face: 270 }); ctx.P('monitor_stack', 'P04-02', 9, 9, { face: 270 }); ctx.P('computer_chair_grey', 'P04-02', 3, 4, { face: 180 }); ctx.P('computer_chair_grey', 'P04-02', 6, 4, { face: 180 }); ctx.P('server_rack', 'P04-02', 1, 9, { face: 90 }); ctx.P('server_rack', 'P04-02', 1, 10, { face: 90 });
        /* ── THE GREAT ROOM (P05-04) ── */
        { const R = ctx.room('P05-04', 1, 1, 10, 9, 'great');
          [2, 5, 8].forEach(u => R.B('false_window', u, 8, 180)); R.B('curved_couch', 4, 4, 0); R.dec('rug_round', 5, 5.5); R.B('coffee_table', 4, 5, 0); R.B('tube_tv', 4, 7, 180); R.B('royal_throne', 8, 4, 270); R.B('retro_speakers', 6, 7, 180); R.dec('retro_radio', 6.5, 6.4, 180);
          R.B('mini_fridge', 0, 8, 90); R.dec('solo_cup', 4.6, 5.4, 0, { y: 0.45 }); R.B('potted_plant', 0, 0, 0); R.B('potted_plant', 8, 0, 0); R.B('couples_bed', 0, 3, 90, { nv: 2 }); R.B('library_shelf_full', 2, 0, 0); R.dec('keypad', 3.6, 0.15, 0, { y: 1.3 }); R.dec('security_camera', 9.8, 8.8, 315, { y: 3.4 });
          R.who('politician', 6.5, 3.5, 300, ctx.sayOf(O.bunker, 'politician')); R.who('juggernaut', 4.5, 1.5, 180, ctx.sayOf(O.bunker, 'juggernaut')); R.done(); }
        /* ── THE POOL + THE CELLAR (P04-04) ── */
        { const R = ctx.room('P04-04', 1, 1, 10, 9, 'pool');
          R.B('pool_lounger', 1, 7, 0); R.B('pool_lounger', 3, 7, 0); R.B('pool_umbrella', 2, 8, 0); R.dec('wet_floor_sign', 7.6, 5.5, 40);
          R.wall('u', 2, 7, 10, { h: 5.25, key: U('PlasterWallPainted1a'), tint: 0xe8dcc8, gain: 2.0, doors: [[8.5, 'leaf_hotel']] }); R.wall('v', 7, 0, 2, { h: 5.25, key: U('PlasterWallPainted1a'), tint: 0xe8dcc8, gain: 2.0 }); R.label('THE CELLAR', 8.5, 2.18, 0, 1.6);
          R.B('library_shelf_full', 7, 0, 0); R.B('library_shelf_full', 8, 0, 0); R.B('round_fridge', 9, 0, 0); R.dec('evac_button', 0.15, 4.5, 90, { y: 1.3 });
          R.who('catgirl', 8.5, 6.5, 0, ctx.sayOf(O.bunker, 'catgirl')); R.done(); }
    },
};
