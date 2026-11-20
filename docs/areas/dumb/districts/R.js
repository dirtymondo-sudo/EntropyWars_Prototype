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

/* ════ RESEARCH ON THE SQUARES (world polish thread 8, 2026-11-20; the plan: docs/plans/world-polish/thread8/plan-research.png, mondo's OK).
   One kit room over the Dream Wing + the Labs (base 3.5 m) and one over Clone Research (base 0: the vats stand at Sub-Level 7's depth).
   THE LEVELS (absolute): the Labs + the White Rooms 3.5 · the Dream Wing 5.25 (a plateau) · the Range's gallery 8.75 · THE TANKS 3.5 (a level
   under the Wing) · the card rooms + the back lobby 3.5 · the vats + Disposal 0 · THE GANTRY + Control 3.5. Ledges: a gap in the gallery's
   rail on each side (a 3.5 m drop to the Range's floor), two on the gantry (3.5 m down to the vats, one into Disposal). ════ */
const DREAM = { key: U('PlasterWallGeneric1a'), tint: 0xe6eaee, gain: 2.0 }, RANGEW = { key: U('MetalPanelPainted1a'), tint: 0xf4f6f8, gain: 2.1 },
      LABW = { key: U('TileGeneric1a'), tint: 0xdcefe9, gain: 2.0 }, CTRLW = { key: U('MetalPanelPainted2a'), tint: 0x9aa8b4, gain: 1.9 }, GRILL = U('MetalSubwayGrill1a');
function research(ctx) {
    const { C } = ctx, O = ctx.O;
    /* ── THE DREAM WING + THE LABS: u = x − 12, v = y − 24, heights over 3.5 m ── */
    const R = ctx.room('P01-02', 0, 0, 24, 24, 'research'), W1 = 1.75;        // W1 = the Wing's floor over the room's
    const lift = (u0, v0, u1, v1, h, ext) => { ext = ext || {}; const x0 = R.X(u0) - (ext.w || 0), x1 = R.X(u1) + (ext.e || 0), z0 = R.Z(v0) - (ext.n || 0), z1 = R.Z(v1) + (ext.s || 0);
        ctx.feat({ k: 'plateau', x: ctx.r2((x0 + x1) / 2), z: ctx.r2((z0 + z1) / 2), w: ctx.r2(x1 - x0), d: ctx.r2(z1 - z0), h, edge: 0.05 }); };
    /* the Wing's floor, 5.25 m: four tiers that overlap where they meet (two plateaus that only touch leave a notch) */
    lift(1, 2, 9, 10, 5.25); lift(7, 2, 13, 4, 5.25, { e: 0.5 }); lift(13, 2, 21, 10, 5.25); lift(5, 10, 20, 12, 5.25, { n: 0.5 });
    /* the ways up to it: the ramp from the White Rooms' hospital door, the gurney ramp from the Labs (3 wide), the Tanks' stair, the back stair */
    ctx.feat({ k: 'ramp', x0: R.X(9.5), z0: R.Z(0), x1: R.X(9.5), z1: R.Z(2) + 0.3, w: C, h0: 3.5, h1: 5.25, edge: 0.1 });
    ctx.feat({ k: 'ramp', x0: R.X(9.5), z0: R.Z(14), x1: R.X(9.5), z1: R.Z(12) - 0.3, w: 3 * C, h0: 3.5, h1: 5.25, edge: 0.1 });
    R.stair(11, 5, 11, 4, 2, 0, W1, 'precast'); R.stair(23, 6.5, 21, 6.5, 1, 0, W1, 'precast');
    const wall = (axis, at, a, b, look, o) => R.wall(axis, at, a, b, Object.assign({}, look, o || {}));
    /* a window wall: sill, glass, head (heights over the room's floor; `f` = the floor it stands on) */
    const window = (axis, at, a, b, look, f, top) => { wall(axis, at, a, b, look, { h: f + 1.0 }); R.pane(axis, at, a, b, { y0: f + 1.0, h: 2.2 }); wall(axis, at, a, b, look, { y0: f + 3.2, h: top - f - 3.2, walk: false }); };
    /* THE WARD (sleep lab), TRACES, THE DOCTOR */
    /* (a wall on the Wing stands on the Wing's floor, so its doors do: the plateau's own face closes it below, on a lower side) */
    const ON = (h, o) => Object.assign({ y0: W1, h: h - W1 }, o || {});
    wall('v', 7, 2, 4, DREAM, ON(7, { doors: [[2.5, 'leaf_hospital', 1]] }));
    window('v', 7, 4, 7, DREAM, W1, 7); wall('v', 7, 7, 10, DREAM, ON(7));
    wall('u', 4, 7, 9, DREAM, ON(7, { doors: [[7.5, 'leaf_office']] })); wall('u', 7, 7, 9, DREAM, ON(7)); wall('v', 9, 5, 9, DREAM, ON(7));
    wall('u', 10, 5, 7, DREAM, ON(7, { doors: [[5.5, 'leaf_hospital']] })); wall('u', 10, 7, 9, DREAM, ON(7, { doors: [[7.5, 'leaf_office']] }));
    wall('u', 12, 4, 8, LABW, { h: 7 });   /* the bio lab's north wall, under the corridor's edge */
    R.ceil(7, 4, 9, 10, W1 + 3.2, FIB, 0xe8ecee, { gain: 1.9 });
    /* THE RANGE: the psychic training hall, white panels, its gallery a level up on three sides */
    wall('v', 13, 2, 10, RANGEW, ON(8.75, { doors: [[2.5, 'leaf_security', 1]] }));
    wall('v', 21, 2, 10, RANGEW, ON(8.75, { doors: [[6.5, 'leaf_security']] })); wall('u', 10, 13, 21, RANGEW, ON(8.75, { doors: [[15.5, 'leaf_office']] }));
    const G = W1 + 3.5;   // the gallery: 8.75 m
    R.deck(13, 2, 21, 3, G, GRILL); R.deck(13, 3, 14, 7, G, GRILL); R.deck(20, 3, 21, 7, G, GRILL);
    R.stair(13.5, 9, 13.5, 7, 1, W1, G, 'steel'); R.stair(20.5, 9, 20.5, 7, 1, W1, G, 'steel');
    R.guard('u', 3, 14, 20, G, 0xc8ccd2); R.guard('v', 14, 3, 6, G, 0xc8ccd2); R.guard('v', 20, 3, 6, G, 0xc8ccd2);   /* the gaps at v 6..7 = THE LEDGES */
    /* CARDS A + CARDS B (a sender, a receiver: as far apart as the wing allows), the back lobby down to Corridor Five */
    wall('u', 4, 21, 23, DREAM, { h: 3.5, doors: [[22.5, 'leaf_office']] }); wall('u', 8, 21, 23, DREAM, { h: 3.5, doors: [[22.5, 'leaf_office']] });
    R.ceil(21, 2, 23, 4, 3.5, FIB, 0xe8ecee, { gain: 1.9 }); R.ceil(21, 8, 23, 10, 3.5, FIB, 0xe8ecee, { gain: 1.9 });
    /* PREP + THE STORE, low rooms off the Range and the south corridor */
    wall('v', 13, 10, 12, DREAM, ON(7, { doors: [[10.5, 'leaf_office']] })); wall('v', 17, 10, 12, DREAM, ON(W1 + 3.5, { doors: [[11.5, 'leaf_office']] }));
    R.ceil(13, 10, 20, 12, W1 + 3.5, FIB, 0xe8ecee, { gain: 1.9 });
    /* THE LABS (the floor of the room, 3.5 m): the bio lab behind glass, Specimens through it, the autopsy theatre behind a window, the cold store */
    wall('v', 8, 12, 17, LABW, { h: 5.25, doors: [[14.5, 'leaf_glass']] }); wall('v', 4, 12, 17, LABW, { h: 5.25, doors: [[14.5, 'leaf_office']] });
    R.pane('u', 17, 4, 8, { h: 3.2, doors: [[5.5, 'leaf_glass']] }); wall('u', 17, 4, 8, LABW, { y0: 3.2, h: 2.05, walk: false });
    wall('u', 20, 7, 8, LABW, { h: 5.25 }); window('u', 20, 8, 12, LABW, 0, 5.25);
    wall('v', 7, 20, 24, LABW, { h: 5.25, doors: [[21.5, 'leaf_hospital']] });
    wall('v', 4, 20, 23, LABW, { h: 5.25, doors: [[21.5, 'leaf_vault']] }); wall('u', 23, 1, 4, LABW, { h: 5.25 }); R.ceil(1, 20, 4, 23, 3.0, U('MetalSubwayGrill2a'), 0xb8c0c8);
    R.ceil(1, 12, 8, 17, 3.4, FIB, 0xe8ecee, { gain: 1.9 }); R.ceil(7, 20, 12, 24, 4.2, FIB, 0xe8ecee, { gain: 1.9 });

    /* ── THE DRESSING (THE LISTS: docs/plans/world-polish/thread8/FITS_THE_DUMB.md) ── */
    const y1 = 0.78;   // a table top
    /* THE WARD: six sleepers, each with its EEG; the dream screen on the north wall (the Astral way) */
    for (const [u, v] of [[1, 4], [3, 4], [5, 4], [1, 7], [3, 7], [5, 7]]) { R.B('hospital_bed', u, v, 0); R.B('eeg_rack', u, v + 1, 0); }
    R.B('dream_screen', 4, 2, 0); R.dec('privacy_screen', 2.6, 6.4, 90); R.dec('iv_stand', 2.3, 4.3); R.dec('iv_stand', 6.4, 7.4); R.dec('lava_lamp_floor', 1.3, 2.4);
    R.hung('wall_clock', 6.6, 2.05, 0, 2.7); R.hung('security_camera', 6.9, 9.9, 225, 3.4); R.sign('QUIET PLEASE', 3.5, 9.92, W1 + 2.9, 3.2, 0.5, 180, '#23262b', '#e8f4ee');
    /* TRACES: the night's traces, read through the window */
    R.B('tanker_desk', 8, 5, 270); R.dec('computer_chair_grey', 7.6, 5.5, 90); R.dec('reel_to_reel', 8.6, 4.4, 270, { y: y1 }); R.hung('monitor_stack', 8.95, 6.5, 270, 1.4); R.dec('clipboard_flat', 8.4, 5.6, 20, { y: y1 });
    /* THE DOCTOR */
    R.B('exec_desk', 8, 8, 270); R.dec('exec_chair', 7.5, 8.5, 90); R.hung('filing_cabinet', 8.75, 9.8, 270, 0); R.dec('desk_lamp', 8.3, 8.2, 0, { y: y1 }); R.dec('manila_folders', 8.5, 8.7, 0, { y: y1 });
    /* THE TANKS: four float tanks in the wet room a level down */
    for (const [u, v, f] of [[9, 6, 0], [9, 7, 0], [12, 6, 180], [12, 7, 180]]) R.B('iso_tank', u, v, f === 0 ? 90 : 270);
    R.dec('floor_drain', 10.5, 6.5); R.dec('floor_drain', 11.5, 7.5); R.hung('hose_rack', 10.5, 8.95, 180, 1.2); R.dec('wet_floor_sign', 11.6, 5.4, 30); R.dec('laundry_cart', 10.3, 8.3, 90);
    /* THE RANGE: THE OBJECT on its table, the chairs in a ring facing it, the cameras on the gallery */
    R.B('steel_table', 16, 5, 0); R.B('floating_orb', 17, 5, 0); R.B('steel_table', 17, 6, 0); R.dec('psx_spoon_mp_1', 16.4, 5.4, 30, { y: y1 }); R.dec('psx_spoon_mp_1', 16.6, 5.6, 110, { y: y1 }); R.dec('psx_spoon_mp_1', 17.4, 6.5, 70, { y: y1 });
    for (const [u, v, f] of [[15.5, 4, 135], [18.5, 4, 225], [15.2, 6.9, 45], [18.8, 7, 315], [17, 8.4, 0]]) R.dec('molded_chair', u, v, f);
    R.B('egg_chair', 15, 8, 30); R.hung('chalkboard', 17, 2.05, 0, 1.5); R.dec('studio_light', 14.6, 4.2, 135); R.dec('studio_light', 19.4, 8.6, 315);
    for (const [u, v, f] of [[15, 2.3], [18.5, 2.3], [13.4, 5]]) R.dec('film_camera', u, v, 160, { y: G });
    R.dec('molded_chair', 19.5, 2.5, 200, { y: G }); R.dec('molded_chair', 16.5, 2.5, 180, { y: G }); R.dec('clipboard_flat', 17.5, 2.4, 0, { y: G });
    R.sign('THE RANGE', 17, 9.92, W1 + 2.7, 3.4, 0.6, 180, '#23262b', '#f4f6f8', 'stencil');
    /* CARDS A + CARDS B */
    for (const v of [2, 8]) { R.B('steel_table', 21, v + 0.0, 90); R.dec('molded_chair', 21.5, v + 1.1, 0); R.dec('crt_terminal', 22.4, v + 0.4, 270, { y: y1 }); R.hung('security_camera', 22.9, v + 0.1, 225, 2.9); }
    R.dec('privacy_screen', 22.4, 9.5, 0); R.hung('notice_board', 21.05, 4.6, 90, 1.5);
    /* PREP + THE STORE */
    R.B('hospital_bed', 13, 11, 90); R.dec('iv_stand', 14.2, 10.3); R.hung('office_locker', 16.8, 10.5, 270, 0); R.hung('sink_row', 15, 11.95, 180, 0); R.dec('psx_syringe_mp_1', 13.6, 11.2, 30, { y: 0.66 });
    R.B('psx_shelf_mp_3', 19, 10, 270); R.B('psx_shelf_mp_3', 19, 11, 270); R.dec('cardboard_boxes', 17.6, 11.4, 20); R.dec('psx_cardboard_box_1', 18, 10.4, 50);
    /* THE LOBBY + THE SOUTH CORRIDOR */
    R.sign('DREAM RESEARCH', 9.9, 2.05, W1 + 2.6, 3.8, 0.55, 0, '#18302a', '#e8f4ee', 'stencil'); R.hung('water_cooler', 12.75, 3.4, 270, 0); R.dec('molded_chair', 10.6, 2.4, 0); R.dec('molded_chair', 11.4, 2.4, 0);
    R.dec('wheelchair', 6, 11.4, 260); R.dec('stretcher', 11.4, 10.6, 90); R.hung('exit_sign', 6, 11.95, 180, 2.6); R.hung('fire_extinguisher', 5.05, 10.5, 90, 1.0);
    /* THE LABS: the bio lab (two hoods, the benches, the glass, the microscopes), Specimens, the autopsy theatre, the cold store */
    R.hung('fume_hood', 4.4, 12.25, 0, 0); R.hung('fume_hood', 6.4, 12.25, 0, 0);
    R.B('ebd_dinerscene_steel_table', 5, 14, 90); R.B('ebd_dinerscene_steel_table', 6, 14, 90); R.dec('lab_glassware', 5.5, 14.5, 0, { y: 0.9 }); R.dec('microscope', 6.4, 14.4, 200, { y: 0.9 }); R.dec('microscope', 5.6, 15.1, 20, { y: 0.9 });
    R.dec('lab_glassware', 7.6, 15.5, 270, { y: 0 }); R.dec('computer_chair_grey', 4.8, 15.4, 0); R.dec('computer_chair_grey', 6.6, 15.4, 0); R.hung('gas_cylinder_rack', 7.75, 12.8, 270, 0);
    for (const v of [12, 13, 14, 15]) R.B(v % 2 ? 'psx_shelf_mp_2' : 'specimen_shelf', 1, v, 90); R.B('museum_vitrine', 3, 13, 270); R.B('bird_cage', 3, 15, 270); R.dec('rat', 2.3, 16.4, 120); R.dec('rat', 2.6, 16.6, 200);
    R.B('autopsy_table', 9, 22, 0); R.dec('anatomy_skeleton', 11.4, 20.6, 200); R.dec('item_scalpel', 9.6, 22.3, 40, { y: 0.92 }); R.dec('studio_light', 8.2, 21.4, 120); R.dec('iv_stand', 10.4, 22.6);
    R.dec('hw_body', 11.2, 23.3, 90); R.dec('molded_chair', 8.6, 23.6, 0); R.dec('floor_stain', 9.6, 22.8, 30);
    R.B('psx_shelf_mp_4_1', 1, 20, 90); R.B('psx_shelf_mp_4_1', 1, 21, 90); R.dec('meat_hook', 2.6, 20.4, 0, { y: 2.2 }); R.dec('meat_hook', 3.3, 20.4, 0, { y: 2.2 }); R.dec('hw_body', 2.5, 22.4, 0);
    R.dec('hazmat_suit', 9.3, 17.3, 160); R.dec('hazmat_suit', 10.1, 17.3, 200); R.hung('notice_board', 11.95, 18, 270, 1.5); R.hung('keypad', 7.95, 21, 90, 1.3); R.dec('stretcher', 5.4, 22.6, 0);
    R.hung('radiation_sign', 3.95, 22.4, 270, 1.8); R.hung('exit_sign', 8.5, 14.05, 0, 2.6);
    /* the signs */
    const up = (w, u, v, ry, wd) => R.sign(w, u, v, W1 + 2.42, wd || Math.max(0.9, w.length * 0.13), 0.24, ry, '#f0f0f0', '#23262b');   // a door plate on the Wing
    up('THE WARD', 7.05, 3.4, 90, 1.4); up('TRACES', 7.5, 3.95, 180); up('DOCTOR', 7.5, 10.05, 0); R.sign('THE TANKS', 11, 8.92, 2.6, 2.4, 0.5, 180, '#18302a', '#e8f4ee', 'stencil');
    up('THE RANGE', 12.95, 3.3, -90, 1.5); R.label('CARDS A', 22.5, 4.05, 0); R.label('CARDS B', 22.5, 7.95, 180); up('PREP', 12.95, 11.3, -90); up('STORE', 16.95, 10.6, -90);
    R.label('BIO LAB', 5.5, 17.05, 0); R.label('SPECIMENS', 4.05, 14.5, 90, 1.5); R.label('AUTOPSY', 7.05, 21.5, -90, 1.3); R.label('COLD STORE', 4.05, 21.5, -90, 1.6);
    R.sign('THE LABS', 10, 17.05, 3.0, 2.4, 0.5, 0, '#18302a', '#e8f4ee', 'stencil');
    /* the drawn lamps (the base has ten real lights; none of them is Research's) */
    for (const q of [[3.5, 5], [3.5, 8], [10, 3], [8, 5.5], [8, 8.5], [8, 11], [12, 11]]) R.lamp(q[0], q[1], W1 + (q[0] === 8 && q[1] < 10 ? 3.15 : 5.1));
    for (const q of [[15.5, 4.5], [18.5, 4.5], [15.5, 7.5], [18.5, 7.5]]) R.lamp(q[0], q[1], 8.6);
    for (const q of [[5.5, 14], [2, 14], [9.5, 18], [5.5, 18.5], [9.5, 22], [5.5, 21.5], [2.5, 21.5], [9.5, 15]]) R.lamp(q[0], q[1], q[1] > 19 && q[0] > 7 ? 4.15 : q[1] > 19 && q[0] < 4 ? 2.95 : 3.35);
    /* the people (the old rooms' own lines) */
    R.who('telepath', 4, 6.5, 180, ctx.sayOf(O.dreamlab, 'telepath', 0)); R.who('dreameater', 2.5, 9.4, 60, ctx.sayOf(O.dreamlab, 'dreameater'));
    R.who('telepath', 16.5, 7.5, 0, ctx.sayOf(O.dreamlab, 'telepath', 1)); R.who('professor', 6.5, 16.3, 0);
    R.done();
    for (let x = 19; x <= 24; x++) for (const y of [26, 27]) ctx.paint('P01-02', x - 12, y - 24, x - 11, y - 23, U('RubberNonSlip3a'));
    ctx.paint('P01-02', 5, 10, 13, 12, U('RubberNonSlip3a')); ctx.paint('P01-02', 8, 12, 11, 20, U('RubberNonSlip3a')); ctx.paint('P01-02', 4, 17, 8, 24, U('RubberNonSlip3a')); ctx.paint('P01-02', 1, 23, 4, 24, U('RubberNonSlip3a'));
    ctx.paint('P01-02', 21, 4, 24, 8, U('RubberNonSlip3a'));

    /* ── CLONE RESEARCH: u = x − 12, v = y − 48, heights over 0 (the vats' floor) ── */
    const V = ctx.room('P01-04', 0, 0, 25, 12, 'clone'), GY = 3.5;
    ctx.feat({ k: 'plateau', x: ctx.r2((V.X(1) + V.X(4)) / 2), z: ctx.r2((V.Z(0) - 1 + V.Z(2)) / 2), w: 3 * C, d: 2 * C + 1, h: GY, edge: 0.05 });     // the landing at the Labs' level
    ctx.feat({ k: 'plateau', x: ctx.r2((V.X(15) + V.X(19)) / 2), z: ctx.r2((V.Z(6) + V.Z(10)) / 2), w: 4 * C - 0.1, d: 4 * C - 0.1, h: GY, edge: 0.05 });   // CONTROL
    /* THE GANTRY: down the hall from the landing, along it, through the wall into Disposal, to Control's door */
    V.deck(2, 2, 4, 7, GY, GRILL); V.deck(2, 5, 10, 7, GY, GRILL); V.deck(8, 7, 15, 9, GY, GRILL);
    V.stair(2.5, 9, 2.5, 7, 1, 0, GY, 'steel'); V.stair(21, 7.5, 19, 7.5, 1, 0, GY, 'steel');
    const GR = 0x4a6080;
    V.guard('u', 2, 1, 2, GY, GR); V.guard('v', 2, 2, 7, GY, GR); V.guard('v', 4, 2, 5, GY, GR); V.guard('u', 5, 4, 10, GY, GR); V.guard('v', 10, 5, 7, GY, GR);
    V.guard('u', 7, 3, 6, GY, GR); /* the gap u 6..8 = A LEDGE down to the vats */ V.guard('u', 7, 10, 11, GY, GR); V.guard('v', 8, 7, 9, GY, GR); V.guard('u', 9, 8, 11, GY, GR);
    V.guard('u', 7, 13, 15, GY, GR); V.guard('u', 9, 14, 15, GY, GR);   /* the gap at u 13 = a ledge into Disposal */
    /* CONTROL: glass over the plant floor */
    V.pane('u', 6, 15, 19, { y0: GY, h: 2.6 }); V.wall('u', 6, 15, 19, Object.assign({}, CTRLW, { y0: GY + 2.6, h: 2.0, walk: false }));
    V.wall('v', 15, 6, 10, Object.assign({}, CTRLW, { y0: GY, h: 4.6, doors: [[7.5, 'leaf_glass']] })); V.wall('v', 19, 6, 10, Object.assign({}, CTRLW, { y0: GY, h: 4.6, doors: [[7.5, 'none']] }));
    V.wall('u', 10, 15, 19, Object.assign({}, CTRLW, { y0: GY, h: 4.6 })); V.ceil(15, 6, 19, 10, GY + 4.6, U('MetalPanelPainted2a'), 0x8a96a0);
    /* the back door to the Stair's store room (Sub-Level 7) */
    V.wall('v', 23, 3, 4, Object.assign({}, CTRLW, { h: 3.5, doors: [[3.5, 'leaf_office']] })); V.label('SERVICE', 22.95, 3.5, 90);
    /* THE VAT HALL: the vats in two rows, lit from under; the pumps, the pipe, the hoist */
    for (const u of [5, 6, 7, 8, 9]) { V.B('meshy_molten_cryo_tube', u, 2, 180); V.box(u + 0.5, 2.5, 0.02, 0.9, 0.04, 0.9, null, 0x60c0ff, { glow: 1 }); }
    for (const u of [4, 5, 6, 7]) { V.B('meshy_molten_cryo_tube', u, 9, 0); V.box(u + 0.5, 9.5, 0.02, 0.9, 0.04, 0.9, null, 0x60c0ff, { glow: 1 }); }
    V.B('iso_tank', 1, 9, 90); V.B('centrifugal_pump', 1, 6, 90); V.B('centrifugal_pump', 9, 9, 0); V.hung('gauge_board', 1.05, 4.5, 90, 1.4); V.dec('valve_wheel', 1.1, 7.5, 90, { y: 1.2 });
    V.dec('chain_hoist', 7.5, 3.7, 0, { y: 6.5 }); V.dec('radiation_drum', 3.6, 8.4, 30); V.dec('radiation_drum', 3.3, 9.6, 80); V.hung('pipe_run', 5.5, 10.95, 180, 2.6); V.dec('hose_rack', 10.8, 3.5, 270);
    V.B('steel_table', 10, 9, 270); V.dec('clipboard_flat', 10.5, 9.4, 20, { y: 0.78 }); V.dec('psx_dosimeter_1', 10.6, 9.7, 0, { y: 0.78 }); V.dec('security_camera', 1.2, 2.2, 135, { y: 5.5 });
    V.sign('CLONE RESEARCH', 3.0, 2.05, GY + 2.2, 3.6, 0.55, 0, '#bcd4ff', '#18202c', 'stencil'); V.label('THE VAT HALL', 6.5, 2.05, 0, 1.9);
    /* DISPOSAL: the furnace, the chute, the conveyor to it, BATCH 12 on its cots, the other one */
    V.B('door_furnace', 22, 6, 270); V.B('garbage_chute', 22, 4, 270); V.B('conveyor', 19, 9, 90); V.B('conveyor', 20, 9, 90);
    V.hung('radiation_sign', 22.95, 8.5, 270, 1.7); V.dec('warning_tape', 21.2, 6.5, 0); V.hung('evac_button', 22.95, 9.5, 270, 1.3); V.dec('floor_stain', 20.5, 6.6, 0);
    V.sign('BATCH 12', 17, 1.05, 3.0, 2.6, 0.6, 0, '#bcd4ff', '#18202c', 'stencil', 0.4); [14, 15, 16, 17, 18, 19].forEach(u => V.B('cot', u, 1, 0));
    V.dec('hazmat_suit', 13.4, 4.4, 90); V.dec('radiation_drum', 13.5, 9.5, 20); V.B('cardboard_boxes', 13, 3, 0); V.dec('stretcher', 16.4, 4.6, 90);
    /* CONTROL's desk */
    V.B('retro_control_panel', 16, 6, 0, { y: GY }); V.dec('monitor_stack', 17.5, 6.25, 0, { y: 1.2 }); V.dec('crt_terminal', 17.6, 6.6, 0, { y: GY + 0.78 }); V.dec('computer_chair_grey', 17.5, 7.4, 180, { y: GY });
    V.dec('clipboard_flat', 18.4, 8.6, 0, { y: GY }); V.label('CONTROL', 15.05, 8.4, 90);
    for (const q of [[3.5, 4], [7, 4], [7, 7.5], [4.5, 8.5], [9.5, 8], [17, 3], [20.5, 3], [17, 8], [21, 8.5]]) V.lamp(q[0], q[1], 8.6);
    V.lamp(17, 8, GY + 4.5);
    V.who('mad scientist', 6.5, 8, 340, ctx.sayOf(O.clonevats, 'mad scientist')); V.who('android', 20.5, 5.5, 270, ctx.sayOf(O.clonevats, 'android'));
    V.done();
    const cl = O.clonevats.n.find(n => n.clone); if (cl) ctx.npc.push({ x: V.X(16.5), z: V.Z(4.5), face: 90, clone: true, say: cl.say });
}

module.exports = {
    look: { wall: U('TileSubway1a'), tint: 0xd0d4d8, gain: 2.2, band: 0x50c0a0, ceil: U('FibreCeilingTile2a'), ceilTint: 0xb8bcc0, light: 0xd8fff0, every: 3 },
    looks: { 'P01-01': WHITE, 'P02-01': WHITE, 'P01-04': CLONE, 'P02-04': CLONE, 'P02-02': { wall: U('MetalPanelPainted1a'), tint: 0xeef0f2, gain: 2.1, band: 0x50c0a0, ceil: U('FibreCeilingTile2a'), ceilTint: 0xc8ccd0, light: 0xf0fff8, every: 3 } },
    build(ctx) {
                whiteRooms(ctx);
        research(ctx);
    },
};
