/* THE D.U.M.B., district R · RESEARCH (7 plots west of the hub, 3.5 m up its stair).
   One thread a file (docs/notes/claims.md). Read by `node bake-dumb.js`; rules: docs/notes/areas-complexes.md "THE D.U.M.B. ON PLOTS".
   BRIEF: three labs off the Service Corridor, each its own colour of light.
     THE WHITE ROOMS (P01-01 + P02-01, one 16 x 12 block, two floors): the psychiatric wing "for the ones who saw it". MOVED IN from
       Area 51 on mondo's word 11-16 ("white rooms can go the DUMB"): the Desert's own builder (docs/areas/desert/districts/A.js, 11-16)
       copied here square for square: the Cell Row, the Quiet Room, Intake, Records, Treatment, the Nurses' Station, Showers, Service,
       the Doctor, the Dayroom, the Observation Floor. Its four old doors still lead to the Desert (the yard gate, the storm drain, the
       hospital door and the vent to Hangar 18); one new doorway in the Dayroom's south wall leads down the corridor to the Ward.
     DREAM RESEARCH: the Ward (the cots, the traces, the pods; the dream screen = links.dumb_astral, the way to the Astral Realm's
       Library) and the Range (THE OBJECT on its table, the booth).
     CLONE RESEARCH: the Vat Hall under THE GANTRY, and Disposal (the furnace, the chute, BATCH 12, THE OTHER ONE).
   STANDS TODAY (the first build): the White Rooms whole; the two Dream rooms and the two Clone rooms with the old rooms' props and
   people (their own lines); the Gantry up its stair.
   NOT YET: everything a district pass does (the labs' own walls and windows, benches, glassware, the vats' pipes, signs, the corridor's
   gurneys; the dream screen is the old prop: no model of a screen you walk into). */
'use strict';
const U = n => 'urban:' + n, PLAS = U('PlasterWallPainted1a'), TILE = U('TileGeneric1a'), FIB = U('FibreCeilingTile1a');
const WHITE = { wall: PLAS, tint: 0xffffff, gain: 2.1, band: null, ceil: FIB, ceilTint: 0xf4f4f6, light: null };
const CLONE = { wall: U('MetalCorrugatedPainted2a'), tint: 0x8c98a4, gain: 1.8, band: 0x4080ff, ceil: U('MetalSubwayGrill2a'), ceilTint: 0x7a808a, light: 0x60a0ff, every: 3 };

/* ════ THE WHITE ROOMS (16 x 12 squares; the Desert's own builder, its squares unchanged) ════ */
function whiteRooms(ctx) {
    const R = ctx.room('P01-01', 2, 0, 16, 12, 'white'), WH = 0xffffff, wh = { key: PLAS, tint: WH, frame: 0xd0d2d6, glow: 0.45, gain: 2.1 }, gl = { tint: 0xd8ecf2, frame: 0xd0d2d6 };
    for (let u = 0; u < 16; u++) for (let v = 0; v < 12; v++) ctx.paint('P01-01', 2 + u, v, 3 + u, v + 1, TILE);
    for (const k of [[15, 10], [10, 0], [11, 0], [15, 7], [14, 11], [7, 11]]) R.keep(k[0], k[1]);
    /* THE CELL ROW: eight padded cells down the west wall (3.5 x 7 m each), one standing open; the row's own hall beside them */
    R.wall('v', 2, 0, 8, Object.assign({ doors: [0, 1, 2, 3, 4, 5, 6, 7].map(i => [i + 0.5, i === 5 ? 'none' : 'leaf_cell']) }, wh));
    for (let v = 1; v < 8; v++) R.wall('u', v, 0, 2, wh);
    R.wall('v', 5, 0, 8, Object.assign({ doors: [[0.5, 'leaf_hospital'], [6.5, 'leaf_hospital']] }, wh));
    R.wall('u', 8, 0, 5, Object.assign({ doors: [[3.5, 'leaf_hospital']] }, wh));                                        // QUIET ROOM
    R.wall('v', 5, 8, 12, Object.assign({ doors: [[10.5, 'leaf_hospital']] }, wh));
    /* INTAKE, the yard lane, RECORDS, TREATMENT */
    R.wall('v', 6, 0, 3, Object.assign({ doors: [[1.5, 'leaf_hospital']] }, wh)); R.wall('u', 3, 6, 10, Object.assign({ doors: [[8.5, 'leaf_hospital']] }, wh)); R.wall('v', 10, 0, 3, Object.assign({ doors: [[1.5, 'leaf_office']] }, wh));
    R.wall('v', 12, 0, 3, Object.assign({ doors: [[1.5, 'leaf_office']] }, wh)); R.wall('u', 3, 12, 16, wh);
    R.wall('v', 12, 3, 6, Object.assign({ doors: [[4.5, 'leaf_hospital']] }, wh)); R.wall('u', 6, 12, 16, wh);
    /* THE NURSES' STATION: glass on all four sides, it sees every hall */
    R.pane('u', 4, 6, 10, Object.assign({ doors: [[8.5, 'leaf_glass']] }, gl)); R.pane('u', 7, 6, 10, Object.assign({ doors: [[8.5, 'leaf_glass']] }, gl)); R.pane('v', 6, 4, 7, gl); R.pane('v', 10, 4, 7, gl);
    /* SHOWERS, SERVICE, DOCTOR, THE DAYROOM */
    R.wall('v', 12, 6, 9, Object.assign({ doors: [[6.5, 'leaf_bathroom']] }, wh)); R.wall('v', 14, 6, 9, Object.assign({ doors: [[7.5, 'leaf_security']] }, wh)); R.wall('u', 9, 12, 16, wh);
    R.wall('v', 12, 9, 12, Object.assign({ doors: [[10.5, 'leaf_office']] }, wh));
    R.wall('u', 8, 5, 12, Object.assign({ doors: [[8.5, 'leaf_hospital', 1]] }, wh));
    /* the low rooms' ceilings (3.5 m); the cell row's hall, hall D and the dayroom stand open to the roof (7 m) */
    [[0, 0, 2, 8], [0, 8, 5, 12], [6, 0, 10, 3], [10, 0, 12, 3], [12, 0, 16, 3], [12, 3, 16, 6], [6, 4, 10, 7], [6, 3, 10, 4], [12, 6, 16, 9], [12, 9, 16, 12]].forEach(q => R.ceil(q[0], q[1], q[2], q[3], 3.5, FIB, 0xf4f4f6, { gain: 1.9 }));
    /* THE OBSERVATION FLOOR (3.5 m): over the long hall and the cross hall, one-way glass down into the cell row and the dayroom */
    R.deck(5, 0, 6, 8, 3.5, TILE); R.deck(5.8, 7, 12, 8, 3.5, TILE);
    R.stair(10.5, 4, 10.5, 7, 1, 0, 3.5, 'precast');                                                                       // up from hall D, beside the station
    const up = { y0: 3.5, h: 3.5 };
    R.pane('v', 5, 0, 8, Object.assign({}, gl, up)); R.pane('u', 8, 5, 12, Object.assign({}, gl, up));                       // the glass over the cell row, over the dayroom
    R.wall('v', 6, 0, 7, Object.assign({}, wh, up)); R.wall('u', 7, 6, 10, Object.assign({}, wh, up)); R.wall('v', 12, 7, 8, Object.assign({}, wh, up));
    R.guard('u', 7, 11, 12, 3.5, 0xd0d2d6); R.guard('v', 10, 4, 7, 3.5, 0xd0d2d6); R.guard('v', 11, 4, 7, 3.5, 0xd0d2d6);
    R.dec('molded_chair', 5.3, 2.5, 90, { y: 3.5 }); R.dec('molded_chair', 5.3, 5.5, 90, { y: 3.5 }); R.dec('clipboard_flat', 5.3, 4, 10, { y: 3.5 }); R.dec('molded_chair', 8.5, 7.7, 180, { y: 3.5 }); R.dec('security_camera', 5.9, 7.9, 225, { y: 6.2 });
    /* ATMOSPHERE (11-16): a status lamp over every cell door (red = locked, green = the one standing open), read from the hall and from the observation floor */
    for (let v = 0; v < 8; v++) R.box(2.12, v + 0.5, 2.5, 0.06, 0.14, 0.24, null, v === 5 ? 0x40ff70 : 0xff3020, { glow: 1 });
    /* the cells: padded on three sides, a cot */
    for (let v = 0; v < 8; v++) { R.dec('wall_padding', 0.12, v + 0.5, 90, { y: 0.1 }); R.dec('wall_padding', 1, v + 0.12, 0, { y: 0.1 }); R.dec('wall_padding', 1, v + 0.88, 180, { y: 0.1 }); R.B('cot', 0, v, 90); }
    R.dec('floor_drain', 3.5, 4); R.dec('wet_floor_sign', 4.4, 2.4, 40); R.B('wheelchair', 4, 7, 300); R.dec('security_camera', 4.8, 0.2, 135, { y: 3.0 });
    /* QUIET ROOM: the telepath */
    R.B('egg_chair', 2, 10, 90); R.dec('rug_round', 2.5, 10.5); R.dec('potted_plant', 0.4, 11.6); R.dec('wall_padding', 0.12, 9.5, 90, { y: 0.1 }); R.dec('wall_padding', 0.12, 10.5, 90, { y: 0.1 }); R.dec('lava_lamp_floor', 4.5, 8.5);
    /* INTAKE: the desk, the scale, the lockers */
    R.B('tanker_desk', 7, 1, 180); R.dec('computer_chair_grey', 7.5, 0.6, 180); R.B('platform_scale', 9, 2, 0); R.B('office_locker', 6, 0, 90); R.B('office_locker', 9, 0, 270); R.dec('clipboard', 7.7, 1.5, 20, { y: 0.78 }); R.dec('now_serving_sign', 8, 0.2, 0, { y: 2.4 });
    /* the yard lane */
    R.B('metro_bench', 10, 2, 90); R.dec('trash_bin', 11.6, 0.5);
    /* RECORDS: files on everyone who saw it */
    for (const u of [12, 13, 14, 15]) R.B(u % 2 ? 'filing_cabinet' : 'meshy_filing_cabinet', u, 0, 0); R.B('library_shelf_full', 15, 2, 270); R.B('paper_shredder', 13, 2, 180); R.dec('newspaper_bundles', 14.4, 2.5, 30); R.dec('papers_b', 13.5, 1.4, 70, { y: 0.01 });
    /* TREATMENT: the chair, the EEG */
    R.B('barber_chair', 14, 4, 180); R.B('eeg_rack', 15, 4, 270); R.B('dream_screen', 14, 3, 0); R.dec('privacy_screen', 12.6, 5.5, 60); R.B('steel_table', 15, 5, 90); R.dec('item_potion_flask', 15.5, 5.5, 0, { y: 0.78 });
    /* THE NURSES' STATION */
    R.B('round_desk', 7, 5, 0); R.dec('computer_chair_blue', 7.5, 5.9, 0); R.B('monitor_stack', 9, 5, 270); R.dec('wall_clock', 8, 4.3, 0, { y: 2.6 }); R.dec('crt_terminal', 7.5, 5.4, 0, { y: 0.78 }); R.dec('clipboard_flat', 7.2, 5.5, 10, { y: 0.78 });
    /* SHOWERS, SERVICE (the storm drain's grate) */
    R.B('shower_stall', 12, 8, 90); R.B('shower_stall', 13, 8, 180); R.dec('floor_drain', 13, 7.3); R.B('sink_row', 13, 6, 0); R.B('ind_vent', 15, 6, 270); R.dec('drain_grate', 15.3, 7.5); R.B('psx_metal_barrel_mp_1', 14, 8, 0); R.dec('pallet_jack', 14.7, 6.5, 200);
    /* DOCTOR: the office, the vent */
    R.B('exec_desk', 14, 10, 180); R.dec('exec_chair', 14.5, 9.6, 180); R.B('therapy_chaise', 12, 11, 0);   /* (THE MODEL LIST: the game has the couch a psychiatrist has; a chesterfield stood here) */ R.dec('library_shelf_full', 15.8, 11.3, 270);                // (it stood a square out from the wall, its back to the room) R.dec('banker_lamp', 14.3, 10.5, 0, { y: 0.78 }); R.dec('vent_grille', 14.5, 11.85, 180, { y: 2.2 }); R.dec('globe_lamp', 13.5, 9.4);
    /* THE DAYROOM: the TV, the tables, the plant nobody waters */
    R.B('psx_tv_table_1', 11, 11, 270); R.dec('tube_tv', 11.5, 11.5, 270, { y: 0.55 }); R.B('curved_couch', 9, 11, 90); R.B('tulip_table', 6, 9, 0); R.B('tulip_table', 8, 9, 0);                                                              // (never `round_table`: that is Camelot's, four metres of oak)
    for (const q of [[6.5, 8.9, 0], [6.5, 10.1, 180], [5.9, 9.5, 90], [8.5, 10.1, 180], [9.1, 9.5, 270], [7.9, 9.5, 90]]) R.dec('molded_chair', q[0], q[1], q[2]);
    R.B('potted_plant', 5, 11, 0); R.dec('rug_round', 10, 10.4); R.B('air_hockey_table', 6, 11, 90);
    for (const q of [[1, 2], [1, 6], [2.5, 10], [8, 1.5], [11, 1.5], [14, 1.5], [14, 4.5], [8, 5.5], [14, 7.5], [14, 10.5]]) R.lamp(q[0], q[1], 3.45);
    for (const q of [[3.5, 2], [3.5, 6], [8.5, 10], [11.5, 5]]) R.lamp(q[0], q[1], 6.95);
    for (const q of [[3.5, 2.4], [8.5, 10.4]]) R.bulb(q[0], q[1], q[1] > 9 && q[0] > 5 && q[0] < 12 || q[0] === 3.5 ? 6.8 : 3.3);
    R.who('grey', 1.5, 5.5, 90, ['“…” “How long have you been here?” “…” “Since before it was here.”']);
    R.who('grey', 1.5, 2.5, 90, ['“…” “Room 5150.” “…” “That is the other building.” “…” “It is every building.”']);
    R.who('telepath', 3.5, 10.5, 90, ['“They saw it.” “Saw what?” “What you are about to. Sit down.”', '“The white is a choice.” “Whose?” “Not theirs.”']);
    R.who('men in black', 9.5, 6.5, 200, ['“Visiting hours.” “When are they?” “Over.”', '“Quiet please.” “I did not say anything.” “They heard you think it. Everyone in here does.”']);
    /* THE WALL DETAIL (11-16): a number on every cell, a plate over every room's door, what hangs on the walls, the two way-finding lines */
    for (let v = 0; v < 8; v++) R.sign('CELL ' + (v + 1), 2.05, v + 0.5, 2.72, 0.8, 0.2, -90, '#23262b', '#f0f0ec');
    R.label('QUIET ROOM', 3.5, 7.95, 180); R.label('INTAKE', 5.95, 1.5, 90); R.label('RECORDS', 11.95, 1.5, 90); R.label('TREATMENT', 11.95, 4.5, 90); R.label('SHOWERS', 11.95, 6.5, 90); R.label('DOCTOR', 11.95, 10.5, 90);
    R.label('DAYROOM', 8.5, 7.95, 180); R.label('SERVICE', 13.95, 7.5, 90);
    R.hung('exit_sign', 3.5, 0.05, 0, 2.6); R.hung('fire_extinguisher', 4.95, 3, 270, 1.0); R.hung('fire_extinguisher', 11.95, 2.6, 270, 1.0); R.hung('keypad', 4.95, 6.0, 270, 1.3); R.hung('wall_clock', 3.5, 7.95, 180, 2.9);
    R.hung('notice_board', 8, 2.95, 180, 1.5); R.hung('wall_shelf', 13.5, 2.95, 180, 1.5); R.hung('breaker_panel', 15.95, 3.5, 270, 1.5); R.hung('wall_plaques', 14.5, 9.05, 0, 1.7); R.hung('picture_round_a', 12.05, 9.6, 90, 1.7);
    R.hung('notice_board', 8.5, 11.95, 180, 1.5); R.hung('wall_clock', 6.5, 8.05, 0, 2.6); R.hung('picture_round_b', 5.05, 10, 90, 1.7); R.hung('picture_round_c', 9.5, 8.05, 0, 1.7); R.hung('hand_dryer', 12.05, 7.4, 90, 1.2); R.hung('hook_rail', 13, 8.95, 180, 1.6);
    R.dec('water_cooler', 11.6, 8.5, 270); R.dec('card_catalogue', 15.75, 1.2, 270); for (let i = 0; i < 6; i++) R.dec('filing_cabinet', 12.45 + i * 0.5, 0.3, 0); R.dec('cardboard_boxes', 12.5, 2.5, 30); R.dec('office_plant', 6.4, 2.6); R.dec('trash_bin', 5.5, 8.5);
    R.box(11.3, 4, 0.012, 0.12, 0.01, 27.3, null, 0x3a7cff); R.box(8.5, 7.5, 0.012, 22.4, 0.01, 0.12, null, 0x3a7cff); R.box(3.5, 4, 0.012, 0.12, 0.01, 27.3, null, 0xc82a20);   // blue down the lane and the cross hall, red down the cell row
    /* THE MODEL LIST (11-16): a steel toilet in every cell, the frame everyone walks through at the yard gate, the drip and the skeleton in
       Treatment, the tape deck and the copier in Records, pills on the station's desk, the laundry cart in Service */
    for (let v = 0; v < 8; v++) R.dec('steel_toilet', 0.3, v + 0.78, 90);
    R.dec('metal_detector', 11, 1.3, 0); R.dec('number_dispenser', 9.6, 0.4, 0); R.dec('iv_stand', 13.4, 4.4); R.dec('anatomy_skeleton', 12.5, 3.4, 90); R.dec('meshy_syringe', 15.4, 5.3, 30, { y: 0.78 }); R.dec('psx_pills_bottle_1', 15.6, 5.6, 0, { y: 0.78 });
    R.dec('reel_to_reel', 12.4, 1.7, 90); R.dec('photocopier', 14.4, 2.5, 180); R.dec('microfiche_reader', 13.4, 2.6, 180, { y: 0.0 }); R.dec('psx_pills_bottle_2', 7.6, 5.3, 0, { y: 0.78 }); R.dec('psx_pills_packet_1', 7.3, 5.2, 50, { y: 0.78 }); R.dec('iv_stand', 9.4, 4.5);
    R.B('laundry_cart', 15, 8, 0); R.dec('hospital_bed', 13.3, 5.4, 90); R.dec('psx_old_mattress_mp_1', 4.4, 0.5, 80);
    /* the new way in from the rest of Research: a hospital door in the Dayroom's south wall (the corridor down to the Ward) */
    R.wall('u', 12, 7, 8, Object.assign({ doors: [[7.5, 'leaf_hospital']], h: 5.25 }, wh)); R.label('DREAM RESEARCH', 7.5, 11.82, 180, 2.0);
    R.done();
    /* its four old doors: the far ends are the Desert's (bake-desert.js / A.js point back here) */
    const TO = { yard: { room: 'site_prebuilt_area51_desert', at: 'ward' }, stormdrain: { room: 'site_prebuilt_area51_desert', at: 'stormdrain' }, hangar: { room: 'site_prebuilt_area51_hangar', at: 'white' }, vent: { room: 'site_prebuilt_area51_hangar', at: 'vent' } };
    ctx.O.ward.d.forEach(o => { const w = ctx.way(o.id); if (!w || !TO[o.id]) return; const secret = o.leaf == null;
        ctx.doors.push(Object.assign({ id: o.id, wall: 'free', x: w.x, z: w.z, face: w.face, leaf: o.leaf, label: o.label, sub: o.sub, action: TO[o.id], desc: o.desc }, secret ? { secret: true, draft: true } : {})); });
    ctx.O.ward.n.forEach(() => {});
}

module.exports = {
    look: { wall: U('TileSubway1a'), tint: 0xd0d4d8, gain: 2.2, band: 0x50c0a0, ceil: U('FibreCeilingTile2a'), ceilTint: 0xb8bcc0, light: 0xd8fff0, every: 3 },
    looks: { 'P01-01': WHITE, 'P02-01': WHITE, 'P01-04': CLONE, 'P02-04': CLONE },
    build(ctx) {
        const { r2, gcx, gcz, plot } = ctx, O = ctx.O;
        whiteRooms(ctx);
        /* ── DREAM RESEARCH · THE WARD (P01-02): four cots and their traces, two pods, the screen ── */
        { const R = ctx.room('P01-02', 1, 2, 10, 9, 'ward');
          [[1, 5], [3, 5], [5, 5], [7, 5]].forEach((q, i) => { R.B('cot', q[0], q[1], 0); R.B('eeg_rack', q[0], q[1] + 1, 0); });
          R.B('iso_tank', 0, 1, 90); R.B('iso_tank', 0, 3, 90); R.B('dream_screen', 4, 0, 0); R.dec('security_camera', 9.8, 8.8, 315, { y: 3.0 }); R.dec('wall_clock', 6, 0.1, 0, { y: 2.6 }); R.dec('trash_bin', 9.5, 0.5);
          R.sign('QUIET PLEASE', 5, 8.92, 2.9, 3.2, 0.5, 180, '#23262b', '#e8f4ee');
          R.who('telepath', 6.5, 3.5, 180, ctx.sayOf(O.dreamlab, 'telepath', 0)); R.who('dreameater', 2.5, 7.5, 60, ctx.sayOf(O.dreamlab, 'dreameater')); R.done(); }
        /* ── DREAM RESEARCH · THE RANGE (P02-02): THE OBJECT on its table, the spoons, the booth in the corner ── */
        { const R = ctx.room('P02-02', 1, 2, 10, 9, 'range');
          R.B('steel_table', 4, 4, 0); R.B('floating_orb', 5, 4, 0); R.B('steel_table', 6, 4, 0); R.B('chalkboard', 4, 0, 0); R.dec('coffee_mug', 4.5, 4.5, 0, { y: 0.78 }); R.dec('stapler', 6.5, 4.4, 30, { y: 0.78 });
          R.pane('u', 6, 7, 10, { h: 2.6, doors: [[7.5, 'leaf_glass']] }); R.pane('v', 7, 6, 9, { h: 2.6 }); R.ceil(7, 6, 10, 9, 2.6, FIB, 0xd8dcdc); R.label('BOOTH', 8.5, 5.82, 180, 1.0);
          R.B('steel_table', 8, 7, 0); R.dec('crt_terminal', 8.5, 7.5, 0, { y: 0.78 }); R.dec('computer_chair_grey', 8.5, 8.3, 180); R.dec('desk_lamp', 8.2, 7.3, 0, { y: 0.78 }); R.dec('computer_chair_grey', 2.5, 4.5, 90);
          R.who('telepath', 5.5, 6.5, 0, ctx.sayOf(O.dreamlab, 'telepath', 1)); R.done(); }
        /* ── THE SERVICE CORRIDOR (P01-03): the gurney nobody is on, the store ── */
        ctx.P('wheelchair', 'P01-03', 5, 9, { face: 40 }); ctx.P('cardboard_boxes', 'P01-03', 1, 4); ctx.P('office_locker', 'P01-03', 2, 4, { face: 0 }); ctx.P('office_locker', 'P01-03', 3, 4, { face: 0 }); ctx.P('laundry_cart', 'P01-03', 1, 8); ctx.dec('wet_floor_sign', 'P01-03', 6, 3);
        /* ── CLONE RESEARCH · THE VAT HALL (P01-04): six vats in two rows under THE GANTRY ── */
        { const R = ctx.room('P01-04', 1, 1, 10, 9, 'vats');
          [2, 4, 6].forEach(u => { R.B('iso_tank', u, 2, 0); R.B('iso_tank', u, 6, 180); R.box(u + 0.5, 2.5, 1.35, 0.5, 0.06, 0.5, null, 0x60a0ff, { glow: 1 }); R.box(u + 0.5, 6.5, 1.35, 0.5, 0.06, 0.5, null, 0x60a0ff, { glow: 1 }); });
          R.deck(0, 4, 9, 5, 3.5, U('MetalSubwayGrill1a')); R.guard('u', 4, 0, 9, 3.5, 0x4a6080); R.guard('u', 5, 0, 8, 3.5, 0x4a6080); R.stair(8.5, 8, 8.5, 5, 1, 0, 3.5, 'steel'); R.guard('v', 9, 4, 5, 3.5, 0x4a6080);
          R.B('door_xray', 0, 0, 0); R.B('steel_table', 9, 1, 90); R.dec('clipboard_flat', 9.5, 1.5, 20, { y: 0.78 }); R.dec('manila_folders', 9.4, 1.2, 0, { y: 0.78 }); R.dec('security_camera', 0.2, 8.8, 45, { y: 4.5 });
          R.label('THE VAT HALL', 4.5, 0.18, 0, 1.9);
          R.who('mad scientist', 5.5, 7.6, 340, ctx.sayOf(O.clonevats, 'mad scientist')); R.done(); }
        /* ── CLONE RESEARCH · DISPOSAL (P02-04): the furnace at the end, the chute, the batch, the other one ── */
        { const R = ctx.room('P02-04', 1, 1, 10, 9, 'disposal');
          R.B('door_furnace', 9, 4, 270); R.B('garbage_chute', 9, 2, 270); R.hung('radiation_sign', 9.94, 6.5, 270, 1.7); R.dec('warning_tape', 8.2, 4.5, 0); R.dec('evac_button', 9.85, 7.5, 270, { y: 1.3 }); R.B('cardboard_boxes', 1, 8, 0); R.dec('floor_stain', 7.5, 4.6, 0);
          R.sign('BATCH 12', 5, 0.08, 3.0, 2.6, 0.6, 0, '#bcd4ff', '#18202c', 'stencil', 0.4); [3, 4, 5, 6].forEach(u => R.B('cot', u, 1, 0));
          R.who('android', 7.5, 6.5, 270, ctx.sayOf(O.clonevats, 'android')); R.done();
          const cl = O.clonevats.n.find(n => n.clone); if (cl) ctx.npc.push({ x: R.X(3.5), z: R.Z(4.5), face: 90, clone: true, say: cl.say }); }
    },
};
