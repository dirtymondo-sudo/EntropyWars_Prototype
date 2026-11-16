/* THE DESERT · AREA 51 (district A, 16 plots) — the district file of `node bake-desert.js` (repo tooling, never uploaded).
   One thread = this one file. The tool, layout.json, the Highway and every shared piece belong to the tool's row on the board (docs/notes/claims.md).

   THE PLOTS (ids + names: docs/areas/desert/layout.json; a plot is 12 x 12 squares of 3.5 m):
     P00-08  The Gate                       home squares x 0..12 · y 48..60
     P01-08  The Ridge                      home squares x 12..24 · y 48..60
     P02-08  The Fence                      home squares x 24..36 · y 48..60
     P03-08  The Fence, east                home squares x 36..48 · y 48..60
     P00-09  The Dish                       home squares x 0..12 · y 60..72
     P01-09  The Apron                      home squares x 12..24 · y 60..72
     P02-09  The Tower                      home squares x 24..36 · y 60..72
     P03-09  The Pens                       home squares x 36..48 · y 60..72
     P00-10  Runway 33, west                home squares x 0..12 · y 72..84
     P01-10  Runway 33                      home squares x 12..24 · y 72..84
     P02-10  Runway 33, east                home squares x 24..36 · y 72..84
     P03-10  The Crater                     home squares x 36..48 · y 72..84
     P00-11  The Dry Lake                   home squares x 0..12 · y 84..96
     P01-11  Hangar 18                      home squares x 12..24 · y 84..96
     P02-11  The Yard                       home squares x 24..36 · y 84..96
     P03-11  The Dry Lake, east             home squares x 36..48 · y 84..96

   WHAT STANDS HERE TODAY:
   - THE FENCE (P00-08 .. P03-08): chain-link traced by the TOOL from the layout's `f` squares (not this file). THE GATE (P00-08): the guard
     post (walk-in, des:guardpost), flood masts, cameras, a cop car. The way in is the Highway's unsigned Exit 4, the base road (the tool's).
   - THE DISH (P00-09). THE APRON (P01-09): three trucks, a bus, sandbags, a fire truck. THE TOWER (P02-09): the old flight line's own tower
     rows, copied whole from the old `site_prebuilt_area51_flightline` literal (it must stay in data.js), a marksman up it.
   - THE PENS (P03-09): four tanks between blast walls. RUNWAY 33 (P00-10 .. P02-10): dashes + threshold bars, a fighter jet, flood masts.
   - THE CRATER (P03-10): a dip with the big saucer in it. THE DRY LAKE (P00-11, P03-11): lights, a tank.
   - HANGAR 18 (P01-11): a SHUT shell (des:hangar), door `hangar` -> the room site_prebuilt_area51_hangar. THE YARD (P02-11): the White
     Rooms wing, SHUT (des:wing), door `ward` + the hidden `stormdrain` -> site_prebuilt_area51_ward.
   - THE INSIDES are this file's too (rooms(kit) below): HANGAR 18 (22 x 14 squares) and THE WHITE ROOMS (16 x 12, two floors).
   - People: men in black (gate, apron), marksmen (gate, tower), a spy, a bligblog and a grey by the crater.

   KNOWN MISSING OR WRONG (from docs/notes/areas-complexes.md "THE DESERT ON PLOTS", "THE DESERT'S INSIDES", "THE LOOK PASS", "THE HIGHWAY"):
   - Hangar 18 inside: the saucer on the floor under the catwalk was changed after the first look and NOT confirmed on screen (the probe crashed).
   - The White Rooms crash the headless browser while the telepath stands in them: shoot the room with him out, ship it with him in.
   - THE RIDGE (P01-08) and both Dry Lake plots are nearly empty. No barracks, no mess, no fuel dump, nothing walk-in on the base but the post.
   - The tool keeps cacti out of the base and paints the base's own dirt inside the fence (room squares x < 45, y > 102).
   - Not seen on screen since the blocks were moved apart (the same rows, shifted). Fights use the old plateau's table everywhere (data.js HQ_AREA_ENCOUNTERS).
   - No door leaf drew in the probe on any swinging door ("THE LOOK PASS": shared city-door code or the probe; check on a real machine first).

   THE HOOKS (bake-desert.js "THE DISTRICT FILES" has the whole list of what ctx holds; each hook is optional):
     buildings(ctx)  the walk-in / shut buildings: building(id, [sx0, sy0, sx1, sy1, side], h, opts, parts) -> a handle (at, face, cx, cz)
     furnish(ctx)    what stands inside them: put(handle, key, lx, lz, opts), in the building's own frame
     ground(ctx)     everything on the open ground: P / Pm / dec (props), feat (terrain rows), pen, native (people), line (flat paint),
                     setPaint(sx, sy, sheet) (one of the room's seven ground sheets on a square of this block)
     pieces(ctx)     late pieces, after every district's ground
     doors(ctx)      the doors to other rooms (doors.push)
     dice            this file's own dice (ctx.rnd / ctx.dec): another district's change never re-throws them
     rooms(kit)      the rooms behind this district's doors, for bake-desert-insides.js (its kit: mk, the sheets)
   THE FRAME: this file is written in the FIRST BUILD's squares (sx 0..96 west to east, sy 0..96 north to south; gx = a square's west / north
   line in metres, gc = its middle). The tool moves every row this file makes to where the block stands in the 144-square room:
   room square = home square + (0, 48). Keep to your own block; the tool warns about a row outside it.
   REBAKE: node bake-desert.js && node bake-desert-insides.js   (--dry-run prints the counts). Rules: docs/notes/areas-complexes.md "THE DESERT, THE DISTRICT FILES". */
'use strict';
let C, gx, gc, r2, feat, props, doors, npc, count, line, setRect, pen, building, put, SOLID, P, Pm, dec, native, rnd, sayOf, O_GIZA, O_GATE, O_LINE, O_CARN, U, WD, WD2, SHG, FLR, GLS, RIB, COR, CONC, PLAS;
const bind = ctx => ({ C, gx, gc, r2, feat, props, doors, npc, count, line, setRect, pen, building, put, SOLID, P, Pm, dec, native, rnd, sayOf, O_GIZA, O_GATE, O_LINE, O_CARN, U, WD, WD2, SHG, FLR, GLS, RIB, COR, CONC, PLAS } = ctx);
let POST, HANGAR, WING;
exports.dice = 3180855558;

exports.buildings = ctx => { bind(ctx);
    POST = building('guardpost', [4, 51, 6, 54, 'W'], 3.5, { leaf: 'leaf_window_medium', keyIn: CONC, floorIn: U('ConcreteSlab2a') }, (a, w, d, door) => {
        a.shell(w, 3.2, d, CONC, 0xb8b8b0, door); a.box(0, 3.2, 0, w + 1.4, 0.25, d + 1.4, COR, 0x8a8a86, { under: true });
        for (const x of [-3.2, 3.2]) a.box(x, 1.1, d / 2 + 0.06, 1.6, 1.2, 0.06, GLS, 0xa8c0d0);
        a.sign('RESTRICTED AREA', 0, 2.55, d / 2 + 0.1, 6.0, 0.5, '#ffffff', '#a82a20', 'stencil'); });
    HANGAR = building('hangar', [13, 86, 23, 94, 'N'], 14, SOLID, (a, w, d) => {
        a.box(0, 0, 0, w, 10.5, d, RIB, 0x9aa0a0, { top: false, uv: [3.5, 3.5] }); a.roof('barrel', 0, 10.5, 0, w + 0.6, 5.6, d + 0.6, COR, 0x7c8484, { keyEnd: RIB, tintEnd: 0x9aa0a0 });
        a.box(0, 0, d / 2 + 0.06, 24.5, 9.2, 0.1, COR, 0x5a6266, { uv: [3.5, 3.5] });                                                                       // THE BIG DOOR, shut: six leaves on a rail
        for (let i = -3; i <= 3; i++) a.box(i * 4.08, 0, d / 2 + 0.13, 0.16, 9.2, 0.08, RIB, 0x3e4446);
        a.box(0, 9.2, d / 2 + 0.2, 26, 0.5, 0.5, RIB, 0x3e4446);
        a.sign('18', 0, 10.4, d / 2 + 0.2, 5.6, 3.6, '#f0f0f0', '', 'stencil', { kind: 'over' });
        a.sign('HANGAR 18', -14.6, 3.2, d / 2 + 0.08, 4.2, 0.6, '#f0f0f0', '#23262b', 'stencil');
        for (const s of [-1, 1]) for (let z = -d / 2 + 3.5; z < d / 2; z += 7) a.box(s * (w / 2 + 0.3), 0, z, 0.6, 10.5, 0.8, RIB, 0x7c8484);                // the frames down each side
        for (const x of [-12, 12]) a.box(x, 14.2, 0, 1.4, 1.2, 1.4, COR, 0x5a6266, { roof: true }); });
    WING = building('wing', [27, 89, 31, 93, 'N'], 5.25, SOLID, (a, w, d) => {
        a.box(0, 0, 0, w, 5.25, d, CONC, 0xe8e8e4, { top: false }); a.box(0, 5.25, 0, w + 0.6, 0.3, d + 0.6, CONC, 0xc8c8c4, { under: true });
        for (const x of [-5, 5]) a.box(x, 2.4, d / 2 + 0.06, 1.4, 0.7, 0.06, GLS, 0xf0f4f8, { glow: 0.7 });
        a.sign('PSYCHIATRIC', 0, 3.6, d / 2 + 0.1, 5.2, 0.6, '#23262b', '#f0f0ec', 'way'); });
};

exports.furnish = ctx => { bind(ctx);
    put(POST, 'steel_table', 0, -1.6, { face: 0 }); put(POST, 'crt_terminal', 0, -1.6, { y: 0.76, face: 0 }); put(POST, 'folding_chair', 0, -0.6, { face: 0 });
};

exports.ground = ctx => { bind(ctx);
    /* RUNWAY 33's paint: the dashes and the threshold bars */
    for (let x = 4; x < 40; x += 3) line(gx(x), gx(78), gx(x + 1.5), gx(78), 0.5, 0xf0f0f0);
    for (let i = 0; i < 6; i++) line(gx(2.6), gx(76.4 + i * 0.6), gx(4.2), gx(76.4 + i * 0.6), 0.9, 0xf0f0f0);
    P('radiation_sign', 3, 53, { face: 0, y: 1.2 }); P('flood_mast', 3, 55, {}); P('flood_mast', 8, 55, {}); dec('traffic_barrel', 3, 50); dec('traffic_barrel', 0, 52); P('car_cop', 8, 52, { face: 180 }); P('car_suv', 10, 52, { face: 180 });
    P('security_camera', 7, 54, { y: 2.4, face: 0 }); P('security_camera', 30, 54, { y: 2.4, face: 0 }); P('flood_mast', 24, 55, {}); P('flood_mast', 44, 55, {}); P('roads_g_sign_005', 3, 48, { face: 180 });
    Pm('dish', gc(9), gc(63), { h: 9 }); P('flood_mast', 6, 66, {});
    /* THE APRON: the old flight line's trucks, the bus, the sandbags, the fire truck */
    Pm('car_truck', gc(15), gc(64), { face: 90 }); Pm('car_truck', gc(15), gc(67), { face: 90 }); Pm('car_truck', gc(15), gc(70), { face: 90 }); Pm('school_bus', gc(20), gc(72), { face: 0 }); Pm('fire_truck', gc(33), gc(72), { face: 90 });
    [[19, 64], [19, 68], [23, 64], [23, 68]].forEach(q => Pm('meshy_sandbags', gc(q[0]), gc(q[1]), { h: 1.6 })); P('bus_shelter', 22, 74, { face: 180 }); P('flood_mast', 13, 63, {}); P('flood_mast', 34, 63, {}); P('flood_mast', 13, 74, {}); P('flood_mast', 34, 74, {});
    dec('traffic_cone', 25, 70); dec('traffic_cone', 27, 71); dec('cinder_block', 17, 73); P('iso_tank', 32, 65, {});
    /* THE TOWER: the old flight line's own tower rows (the base, the drum, the fire escape, the ladder, the rails, the mast), moved here whole */
    { const dx = gx(29.5) + 11.375, dz = gx(66) + 16.625, sh = f => { const o = JSON.parse(JSON.stringify(f));
          ['x', 'x0', 'x1'].forEach(k => { if (typeof o[k] === 'number') o[k] = r2(o[k] + dx); }); ['z', 'z0', 'z1'].forEach(k => { if (typeof o[k] === 'number') o[k] = r2(o[k] + dz); });
          if (o.pts) o.pts = o.pts.map(p => [r2(p[0] + dx), r2(p[1] + dz)].concat(p.slice(2))); if (o.arc) { o.arc.x = r2(o.arc.x + dx); o.arc.z = r2(o.arc.z + dz); } return o; };
      const keep = O_LINE.f.filter(f => { const x = f.x != null ? f.x : f.x0 != null ? (f.x0 + f.x1) / 2 : f.pts ? f.pts[0][0] : f.arc ? f.arc.x : null, z = f.z != null ? f.z : f.z0 != null ? (f.z0 + f.z1) / 2 : f.pts ? f.pts[0][1] : f.arc ? f.arc.z : null;
          return x != null && x > -31 && x < -3 && z > -22 && z < -11 && ['plateau', 'ramp', 'rail', 'climb'].indexOf(f.k) >= 0; });
      if (keep.length < 8) throw new Error('the old tower rows were not found (' + keep.length + ')');
      keep.forEach(f => feat(sh(f))); count.tower = keep.length; setRect(26, 64, 32, 68, 'B');
      Pm('floating_orb', -11.375 + dx, -14.875 + dz, { face: 0 }); npc.push({ x: r2(-10.8 + dx), z: r2(-17.4 + dz), face: 160, race: 'marksman', say: sayOf(O_LINE, 'marksman') }); }
    [37, 39, 41, 43].forEach((x, i) => { Pm('military_tank', gc(x), gc(65), { face: i % 2 ? 180 : 0 }); if (i < 3) feat({ k: 'wall', x0: gx(x + 1) + 1.75, z0: gx(64), x1: gx(x + 1) + 1.75, z1: gx(67), h: 1.5, t: 0.6, key: 'wasteland' }); });   // THE PENS
    Pm('fighter_jet', gx(20), gx(78), { face: 90 }); [6, 14, 26, 34].forEach(x => { P('flood_mast', x, 75, {}); P('flood_mast', x, 81, {}); });
    feat({ k: 'dip', x: gx(40.5), z: gx(78.5), r: 11, h: 2.4 }); Pm('saucer_lg', gx(40.5), gx(78.5), { span: 9, y: -2.2 }); dec('warning_tape', 37, 75, { y: 0.01 }); dec('traffic_cone', 36, 80);
    [[2, 86], [9, 92], [38, 88], [43, 93]].forEach(q => P('flood_mast', q[0], q[1], {}));                                 // THE DRY LAKE: the lights that go round all night
    P('radiation_sign', 24, 85, { y: 1.4, face: 0 }); P('military_tank', 12, 84, { face: 90 }); P('psx_supply_crate_1', 24, 87, {}); P('psx_supply_crate_1_2', 24, 89, {});
    native('men in black', 3, 57, 0, sayOf(O_GATE, 'men in black')); native('marksman', 7, 52, 270, sayOf(O_GATE, 'marksman')); native('men in black', 21, 73, 270, sayOf(O_LINE, 'men in black'));
    native('spy', 30, 62, 180); native('bligblog', 38, 82, 0); native('grey', 41, 74, 200);
};

exports.doors = ctx => { bind(ctx);
    doors.push({ id: 'hangar', wall: 'free', x: HANGAR.cx, z: r2(gx(86) - 0.45), face: 0, leaf: 'leaf_bulkhead', wide: true, label: 'AREA 51 · HANGAR 18', sub: 'THE BIG DOOR · INTO THE HANGAR', action: { room: 'site_prebuilt_area51_hangar', at: 'flightline' },
        desc: 'The hangar’s big door from the apron. Eighteen is painted on it in letters taller than the door is; the door is taller than that.' });
    doors.push({ id: 'ward', wall: 'free', x: WING.cx, z: r2(gx(89) - 0.45), face: 0, leaf: 'leaf_cell', label: 'AREA 51 · THE WHITE ROOMS', sub: 'THE YARD GATE · INTO THE WING', action: { room: 'site_prebuilt_area51_ward', at: 'yard' },
        desc: 'The barred gate into the wing. From out here the white is a light left on.' });
    doors.push({ id: 'stormdrain', wall: 's', x: gx(34), secret: true, leaf: null, label: 'A DRAUGHT', sub: 'THE STORM DRAIN · UNDER THE FENCE INTO THE WHITE ROOMS', action: { room: 'site_prebuilt_area51_ward', at: 'stormdrain' },
        desc: 'A culvert mouth in the yard’s south berm. It goes under the fence and comes up through a grate in a white corridor.', draft: true });
};

/* ════ THE INSIDES (bake-desert-insides.js calls rooms(kit); notes: areas-complexes.md "THE DESERT'S INSIDES") ════ */
exports.rooms = kit => { const { mk, r2, C, T, DW, DH, U, GLS, CHAIN, GRILL, STEEL, RIB, PLAS, TILE, FIB, CONC, STONE, CAT } = kit;
    /* ════ HANGAR 18 (22 x 14) ════ */
    const HG = mk(22, 14);
    { const R = HG, G = 0x9aa2aa, DARK = 0x5a6268, WH = 0xe4e6e8, sh = { key: STEEL, tint: G }, wh = { key: PLAS, tint: WH };
      /* the west shops, the east bays (the crash tender and the crates stand open on the floor), the floor lift */
      R.wall('v', 4, 0, 4, Object.assign({ doors: [[2.5, 'leaf_security']] }, sh));                                       // ENGINE SHOP
      R.wall('v', 4, 4, 7, { key: CHAIN, tint: 0xc8ccd0, h: 3.5, doors: [[5.5, 'leaf_security']] });                       // PARTS CAGE (chain-link)
      R.wall('v', 4, 7, 10, Object.assign({ doors: [[8.5, 'leaf_security']] }, sh));                                      // FUEL STORE
      R.wall('u', 4, 0, 4, sh); R.wall('u', 7, 0, 4, { key: CHAIN, tint: 0xc8ccd0 });
      R.wall('u', 4, 18, 22, sh); R.wall('u', 7, 18, 22, sh);
      R.wall('v', 18, 0, 4, Object.assign({ gaps: [[1, 3]] }, sh));                                                       // CRASH TENDER: the truck's own two-square mouth
      R.wall('v', 18, 4, 7, Object.assign({ gaps: [[5, 6]] }, sh));                                                       // CRATES
      R.wall('v', 18, 7, 10, Object.assign({ doors: [[8.5, 'leaf_security', 1]] }, sh, { tint: DARK }));                  // FLOOR LIFT
      /* the south row: lockers, briefing, office, lab, the white door's room */
      R.wall('u', 10, 0, 22, Object.assign({ doors: [[6.5, 'leaf_office'], [12.5, 'leaf_office'], [15.5, 'leaf_frosted_single'], [20.5, 'leaf_hospital']] }, wh));
      R.wall('v', 4, 10, 14, Object.assign({ doors: [[12.5, 'leaf_office']] }, wh)); R.wall('v', 9, 10, 14, Object.assign({ doors: [[12.5, 'leaf_office']] }, wh));
      R.wall('v', 13, 10, 14, Object.assign({ doors: [[12.5, 'leaf_frosted_single']] }, wh)); R.wall('v', 18, 10, 14, Object.assign({ doors: [[12.5, 'leaf_hospital']] }, wh));
      /* the low rooms' roofs (3.5 m): the hall goes on up to the trusses over them */
      [[0, 0, 4, 4], [0, 4, 4, 7], [0, 7, 4, 10], [18, 0, 22, 4], [18, 4, 22, 7], [18, 7, 22, 10], [0, 10, 22, 14]].forEach(q => R.ceil(q[0], q[1], q[2], q[3], 3.5, CONC, 0xb0b4b8));
      /* THE SAUCER on its rig, the tape ring on the floor round it. The game draws `saucer_rig` as the landing-gear saucer, 6 m across and
         under 3 m tall, so it stands on the floor and the 3.5 m catwalk crosses over it (seen in the browser 11-15: a pit hid it). */
      R.props.push({ key: 'saucer_rig', x: R.X(11), z: R.Z(5), face: 0 }); for (let u = 10; u < 12; u++) for (let v = 4; v < 6; v++) R.block[u + ',' + v] = 'saucer_rig';
      [[8.5, 2.5, 0], [13.5, 2.5, 0], [8.5, 7.5, 0], [13.5, 7.5, 0], [8.5, 5, 90], [13.5, 5, 90], [11, 2.5, 0], [11, 7.5, 0]].forEach(q => R.dec('warning_tape', q[0], q[1], q[2], { y: 0.01 }));
      /* THE UPPER FLOOR (3.5 m): the catwalk over the saucer, the mezzanine along the south side, the control room in glass at its east end */
      R.deck(10, 1, 12, 8.2, 3.5, GRILL); R.deck(10, 8, 18, 10, 3.5, GRILL);                                                    // (the catwalk runs 0.7 m on over the mezzanine: two slabs that only touch leave a seam the walker falls through)
      R.stair(7, 9.5, 10, 9.5, 1, 0, 3.5, 'steel');                                                                         // up from the floor along the south wall
      R.guard('v', 10, 1, 8, 3.5); R.guard('v', 12, 1, 8, 3.5); R.guard('u', 1, 10, 12, 3.5);
      R.guard('u', 8, 12, 14, 3.5); R.guard('v', 10, 8, 9, 3.5); R.guard('u', 10, 7, 14, 3.5);                             // (the south rail runs on beside the stair: nobody steps off it onto a wall's top)
      const gl = { glass: true, key: GLS, tint: 0x24323a, y0: 3.5, h: 2.8, frame: 0x2a2c30 };
      R.wall('u', 8, 14, 18, gl); R.wall('u', 10, 14, 18, gl); R.wall('v', 18, 8, 10, gl); R.wall('v', 14, 8, 10, Object.assign({ doors: [[9.5, 'leaf_glass']] }, gl));
      R.ceil(14, 8, 18, 10, 6.3, CONC, 0x8a9096);
      R.dec('monitor_stack', 17.2, 8.5, 270, { y: 3.5 }); R.dec('steel_table', 16, 8.45, 0, { y: 3.5 }); R.dec('crt_terminal', 16, 8.45, 0, { y: 4.26 }); R.dec('computer_chair_grey', 16, 9.1, 0, { y: 3.5 });
      R.dec('psx_monitoring_screen_mp_1', 15, 8.4, 0, { y: 4.3 }); R.dec('clipboard_flat', 16.4, 8.5, 20, { y: 4.26 });
      /* the crane hook over the floor (the tape's), the lamps under the trusses, the trusses */
      R.box(15.5, 4, 8.0, 0.1, 6, 0.1, null, 0x2a2c30); R.box(15.5, 4, 7.4, 0.5, 0.6, 0.3, null, 0xd8b020);
      for (let v = 1; v < 14; v += 3) { R.box(11, v, 12.6, 77, 0.5, 0.3, RIB, 0x5a6268); R.box(11, v, 11.2, 77, 0.12, 0.12, RIB, 0x5a6268); }
      [[6, 3], [6, 7], [16, 2], [16, 6], [11, 9]].forEach(q => R.lamp(q[0], q[1], 11.2));
      R.sign('18', 11, 0.06, 7.2, 5.6, 3.6, 0, '#e8eaec'); R.sign('CONTROL', 16, 7.82, 6.0, 3.2, 0.5, 180, '#e8eaec', '#23262b');
      /* ENGINE SHOP */
      R.B('jet_engine_stand', 1, 1, 0); R.B('engine_hoist', 2, 2, 200); R.B('tool_chest', 0, 3, 90); R.dec('tool_pegboard', 0.3, 1.5, 90, { y: 1.2 }); R.dec('psx_metal_barrel_mp_1', 3.4, 0.5, 0); R.dec('cable_drum', 3.3, 3.4, 30);
      /* PARTS CAGE */
      R.B('psx_shelf_mp_2', 0, 4, 90); R.B('psx_shelf_mp_3', 0, 6, 90); R.B('wrapped_pallet', 2, 5, 0); R.dec('psx_supply_crate_1', 1.5, 6.5, 20); R.dec('cardboard_boxes', 3.3, 4.5, 60);
      /* FUEL STORE (the vent behind the tanks) */
      R.B('iso_tank', 0, 7, 90); R.B('iso_tank', 0, 9, 90); R.B('gas_cylinder_rack', 2, 9, 0); R.dec('psx_metal_barrel_mp_2', 1.5, 7.4, 0); R.dec('psx_metal_barrel_mp_3', 2.4, 7.5, 0); R.dec('radiation_sign', 3.6, 9.5, 270, { y: 1.3 });
      /* CRASH TENDER: the fire truck on two squares' width, nose out */
      R.props.push({ key: 'fire_truck', x: R.X(20), z: R.Z(2), face: 270 }); for (let u = 19; u < 22; u++) for (let v = 1; v < 3; v++) R.block[u + ',' + v] = 'fire_truck';
      R.B('hose_rack', 21, 0, 180); R.B('turnout_gear_rack', 19, 3, 0); R.dec('traffic_cone', 18.5, 0.5); R.dec('traffic_cone', 18.5, 3.5);
      /* CRATES: stacks, a way through them */
      R.B('psx_supply_crate_1', 19, 4, 0); R.B('psx_supply_crate_1_2', 21, 4, 90); R.B('wrapped_pallet', 21, 6, 0); R.B('psx_wooden_crate_2', 19, 6, 0); R.dec('psx_wooden_crate_3', 19.5, 4.5, 30, { y: 1.0 }); R.dec('pallet_jack', 20.5, 5.4, 140);
      /* THE FLOOR LIFT: the freight platform under its frame; the tunnel's door is in the east wall (data.js links.area51_dumb) */
      R.box(20, 8.5, 0, 6.4, 0.12, 6.4, GRILL, 0x8a9096); for (const q of [[18.3, 7.3], [21.7, 7.3], [18.3, 9.7], [21.7, 9.7]]) R.box(q[0], q[1], 0, 0.3, 3.4, 0.3, RIB, 0xd8b020);
      R.B('forklift', 19, 9, 300); R.dec('traffic_barrel', 21.5, 7.5);
      /* THE FLOOR: the lanes, the clutter (nothing on a square's middle but the blockers) */
      R.B('forklift', 5, 1, 120); R.B('wrapped_pallet', 6, 5, 0); R.B('psx_supply_crate_1_3', 16, 1, 0); R.dec('traffic_cone', 7.5, 2.5); R.dec('traffic_cone', 14.5, 7.6); R.dec('floor_stain', 6.5, 7.5); R.dec('cable_drum', 16.5, 5.5, 40);
      R.dec('psx_metal_barrel_mp_1', 4.5, 9.5); R.dec('evac_button', 17.7, 5.5, 270, { y: 1.2 }); R.dec('security_camera', 4.3, 0.3, 135, { y: 3.0 });
      /* LOCKERS */
      for (const v of [10, 11, 12]) R.B('office_locker', 0, v, 90); R.B('locker_bench', 2, 11, 0); R.B('turnout_gear_rack', 2, 13, 180); R.dec('footlocker', 3.4, 13.4, 0);
      /* BRIEFING: the screen on the west wall, the chairs facing it */
      R.B('dream_screen', 4, 11, 90); for (const u of [6, 7]) for (const v of [11, 12, 13]) R.dec('folding_chair', u + 0.5 + (v % 2) * 0.12, v + 0.3, 270); R.B('conference_table', 8, 13, 0); R.dec('film_projector', 8.5, 13.5, 270, { y: 0.78 });
      /* OFFICE (the man-door from Room 51 is in its south wall) */
      R.B('tanker_desk', 10, 11, 180); R.dec('exec_chair', 10.5, 10.6, 180); R.B('filing_cabinet', 9, 13, 90); R.B('filing_cabinet', 12, 13, 270); R.dec('desk_lamp', 10.2, 11.4, 0, { y: 0.78 }); R.dec('papers_a', 10.7, 11.5, 30, { y: 0.78 }); R.dec('office_plant', 12.6, 10.5);
      /* LAB: the grey, the tables */
      R.B('autopsy_table', 15, 11, 90); R.B('autopsy_table', 15, 13, 90); R.B('specimen_shelf', 17, 13, 270); R.B('eeg_rack', 13, 10, 90); R.B('steel_table', 17, 10, 90); R.dec('crt_terminal', 17.5, 10.5, 270, { y: 0.76 }); R.dec('privacy_screen', 13.6, 13.4, 60);
      /* THE WHITE DOOR's room */
      R.B('wheelchair', 19, 13, 30); R.B('metro_bench', 21, 10, 270); R.dec('wet_floor_sign', 19.5, 11.5, 40); R.dec('now_serving_sign', 21.7, 12.5, 270, { y: 2.3 });
      for (const q of [[2, 2], [2, 5.5], [2, 8.5], [20, 5.5], [20, 8.5], [2, 12], [6.5, 12], [11, 12], [15.5, 12], [20, 12]]) R.lamp(q[0], q[1], 3.45);
      for (const q of [[2, 2.4], [2, 8.9], [2, 12.4], [11, 12.4], [15.5, 12.4], [20, 12.4]]) R.bulb(q[0], q[1], 3.3);
      /* who is here (their own lines, kept word for word from the old hangar) */
      R.who('men in black', 11.5, 10.6, 180, ['“Badge.” “I have a badge.” “I did not ask if you had one.”', '“Photography is prohibited.” “I have no camera.” “Memory is discouraged.”']);
      R.who('mad scientist', 8.5, 8.4, 20, ['“It is under a tarp.” “Why?” “The tarp is the classified part.”', '“It flew once.” “When?” “Tuesday. Do not write down which.”']);
      R.who('general', 14.5, 2.5, 250, ['“Hangar eighteen.” “There are seventeen hangars.” “Then this one is easy to find.”']);
      R.who('grey', 15.5, 12.5, 270, ['“…” “Is it yours?” “…” “Do you want it back?” “…” “That is a no, then.”']);
      R.doors.push(
          { id: 'white', wall: 'e', z: R.Z(12.5), leaf: 'leaf_hospital', label: 'THE WHITE ROOMS', sub: 'THE WING · PSYCHIATRIC · QUIET PLEASE', action: { room: 'site_prebuilt_area51_ward', at: 'hangar' },
            desc: 'A hospital door in a hangar wall, with a porthole painted over from the other side. The sign says PSYCHIATRIC. Under it, in pencil, FOR THE ONES WHO SAW IT.' },
          { id: 'flightline', wall: 'n', x: R.X(11), leaf: 'leaf_bulkhead', wide: true, label: 'THE FLIGHT LINE', sub: 'THE BIG DOOR · OUT TO RUNWAY 33', action: { room: 'site_prebuilt_area51_desert', at: 'hangar' },
            desc: 'The big door, or the man-sized part of it. Beyond it the apron, the runway, the tower, and the lights that go round the base all night for no reason anyone has filed.' },
          { id: 'vent', wall: 'w', z: R.Z(8.5), secret: true, leaf: null, label: 'A DRAUGHT', sub: 'THE VENT · THE DUCT INTO THE WHITE ROOMS', action: { room: 'site_prebuilt_area51_ward', at: 'vent' },
            desc: 'A vent grille behind the tanks with the screws in a cup beside it. The duct is a person wide and goes to the wing, which is where the air was going anyway.', draft: true });
      R.must.push('11,13', '10,0', '11,0', '21,12', '21,8', '0,8');
      R.spawn = { x: R.X(11.5), z: R.Z(12.9), face: 0 };
      R.lines = ['“Est. 1947.” “Established what?” “That there was nothing here.”', '“The floor lift goes down.” “To where?” “To the D.U.M.B. Everything that goes down goes there.”',
          '“The catwalk is for observation.” “Of what?” “Of the tarp.”', '“The crane hook has been up there since ’52.” “Holding what?” “Its position.”'];
      /* the walk check's stops: [u, v, y] */
      R.stops = [[2, 2, 0], [2, 5.5, 0], [2, 8.5, 0], [20, 2.6, 0], [20.5, 5.5, 0], [20, 8.5, 0], [2, 12.5, 0], [6.5, 12.5, 0], [11.5, 12.5, 0], [15.5, 12.5, 0], [20, 12.5, 0], [11, 0.5, 0], [11, 4, 3.5], [16, 9.5, 3.5], [13, 9, 3.5]];
    }

    /* ════ THE WHITE ROOMS (16 x 12) ════ */
    const WD = mk(16, 12);
    { const R = WD, WH = 0xffffff, wh = { key: PLAS, tint: WH, frame: 0xd0d2d6, glow: 0.45 }, gl = { glass: true, tint: 0xd8ecf2, frame: 0xd0d2d6, glow: 0.2 };   // (seen in the browser 11-15: unlit plaster read grey and the window sheet read as dark mullions; the walls are lit a little by themselves, the glass is plain)
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
      R.wall('u', 4, 6, 10, Object.assign({ doors: [[8.5, 'leaf_glass']] }, gl)); R.wall('u', 7, 6, 10, Object.assign({ doors: [[8.5, 'leaf_glass']] }, gl)); R.wall('v', 6, 4, 7, gl); R.wall('v', 10, 4, 7, gl);
      /* SHOWERS, SERVICE, DOCTOR, THE DAYROOM */
      R.wall('v', 12, 6, 9, Object.assign({ doors: [[6.5, 'leaf_bathroom']] }, wh)); R.wall('v', 14, 6, 9, Object.assign({ doors: [[7.5, 'leaf_security']] }, wh)); R.wall('u', 9, 12, 16, wh);
      R.wall('v', 12, 9, 12, Object.assign({ doors: [[10.5, 'leaf_office']] }, wh));
      R.wall('u', 8, 5, 12, Object.assign({ doors: [[8.5, 'leaf_hospital', 1]] }, wh));
      /* the low rooms' ceilings (3.5 m); the cell row's hall, hall D and the dayroom stand open to the roof (7 m) */
      [[0, 0, 2, 8], [0, 8, 5, 12], [6, 0, 10, 3], [10, 0, 12, 3], [12, 0, 16, 3], [12, 3, 16, 6], [6, 4, 10, 7], [6, 3, 10, 4], [12, 6, 16, 9], [12, 9, 16, 12]].forEach(q => R.ceil(q[0], q[1], q[2], q[3], 3.5, FIB, 0xf4f4f6));
      /* THE OBSERVATION FLOOR (3.5 m): over the long hall and the cross hall, one-way glass down into the cell row and the dayroom */
      R.deck(5, 0, 6, 8, 3.5, TILE); R.deck(5.8, 7, 12, 8, 3.5, TILE);
      R.stair(10.5, 4, 10.5, 7, 1, 0, 3.5, 'precast');                                                                       // up from hall D, beside the station
      const up = { y0: 3.5, h: 3.5 };
      R.wall('v', 5, 0, 8, Object.assign({}, gl, up)); R.wall('u', 8, 5, 12, Object.assign({}, gl, up));                       // the glass over the cell row, over the dayroom
      R.wall('v', 6, 0, 7, Object.assign({}, wh, up)); R.wall('u', 7, 6, 10, Object.assign({}, wh, up)); R.wall('v', 12, 7, 8, Object.assign({}, wh, up));
      R.guard('u', 7, 11, 12, 3.5, 0xd0d2d6); R.guard('v', 10, 4, 7, 3.5, 0xd0d2d6); R.guard('v', 11, 4, 7, 3.5, 0xd0d2d6);
      R.dec('molded_chair', 5.3, 2.5, 90, { y: 3.5 }); R.dec('molded_chair', 5.3, 5.5, 90, { y: 3.5 }); R.dec('clipboard_flat', 5.3, 4, 10, { y: 3.5 }); R.dec('molded_chair', 8.5, 7.7, 180, { y: 3.5 }); R.dec('security_camera', 5.9, 7.9, 225, { y: 6.2 });
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
      R.B('exec_desk', 14, 10, 180); R.dec('exec_chair', 14.5, 9.6, 180); R.B('chesterfield_sofa', 12, 11, 90); R.B('library_shelf', 15, 11, 270); R.dec('banker_lamp', 14.3, 10.5, 0, { y: 0.78 }); R.dec('vent_grille', 14.5, 11.85, 180, { y: 2.2 }); R.dec('globe_lamp', 13.5, 9.4);
      /* THE DAYROOM: the TV, the tables, the plant nobody waters */
      R.B('psx_tv_table_1', 11, 11, 270); R.dec('tube_tv', 11.5, 11.5, 270, { y: 0.55 }); R.B('curved_couch', 9, 11, 90); R.B('round_table', 6, 9, 0); R.B('round_table', 8, 9, 0);
      for (const q of [[6.5, 8.9, 0], [6.5, 10.1, 180], [5.9, 9.5, 90], [8.5, 10.1, 180], [9.1, 9.5, 270], [7.9, 9.5, 90]]) R.dec('molded_chair', q[0], q[1], q[2]);
      R.B('potted_plant', 5, 11, 0); R.dec('rug_round', 10, 10.4); R.B('air_hockey_table', 6, 11, 90);
      for (const q of [[1, 2], [1, 6], [2.5, 10], [8, 1.5], [11, 1.5], [14, 1.5], [14, 4.5], [8, 5.5], [14, 7.5], [14, 10.5]]) R.lamp(q[0], q[1], 3.45);
      for (const q of [[3.5, 2], [3.5, 6], [8.5, 10], [11.5, 5]]) R.lamp(q[0], q[1], 6.95);
      for (const q of [[3.5, 2.4], [3.5, 6.4], [8.5, 10.4], [2.5, 10.4], [8, 1.9], [14, 4.9], [8, 5.9], [14, 10.9]]) R.bulb(q[0], q[1], q[1] > 9 && q[0] > 5 && q[0] < 12 || q[0] === 3.5 ? 6.8 : 3.3);
      R.who('grey', 1.5, 5.5, 90, ['“…” “How long have you been here?” “…” “Since before it was here.”']);
      R.who('grey', 1.5, 2.5, 90, ['“…” “Room 5150.” “…” “That is the other building.” “…” “It is every building.”']);
      R.who('telepath', 3.5, 10.5, 90, ['“They saw it.” “Saw what?” “What you are about to. Sit down.”', '“The white is a choice.” “Whose?” “Not theirs.”']);
      R.who('men in black', 9.5, 6.5, 200, ['“Visiting hours.” “When are they?” “Over.”', '“Quiet please.” “I did not say anything.” “They heard you think it. Everyone in here does.”']);
      R.doors.push(
          { id: 'hangar', wall: 'e', z: R.Z(10.5), leaf: 'leaf_hospital', label: 'HANGAR 18', sub: 'BACK TO THE HANGAR', action: { room: 'site_prebuilt_area51_hangar', at: 'white' },
            desc: 'The hospital door from the quiet side. The porthole is painted over on this side too, in a different white.' },
          { id: 'yard', wall: 'n', x: R.X(11), leaf: 'leaf_cell', label: 'THE FLIGHT LINE', sub: 'THE YARD GATE · OUT TO THE APRON', action: { room: 'site_prebuilt_area51_desert', at: 'ward' },
            desc: 'A barred gate at the end of the yard lane. The exercise yard is the apron; the exercise is watching the lights go round.' },
          { id: 'stormdrain', wall: 'e', z: R.Z(7.5), secret: true, leaf: null, label: 'A DRAUGHT', sub: 'THE STORM DRAIN · UNDER THE FENCE TO THE FLIGHT LINE', action: { room: 'site_prebuilt_area51_desert', at: 'stormdrain' },
            desc: 'A grate in the service room that is not screwed down, and a culvert under it that goes under the fence. The base floods once a year and this is where the water went.', draft: true },
          { id: 'vent', wall: 's', x: R.X(14.5), secret: true, leaf: null, label: 'A DRAUGHT', sub: 'THE VENT · THE DUCT BACK INTO THE HANGAR', action: { room: 'site_prebuilt_area51_hangar', at: 'vent' },
            desc: 'A grille in the doctor’s wall, warm, and behind it the duct that brings the hangar in.', draft: true });
      R.must.push('15,10', '10,0', '11,0', '15,7', '14,11');
      R.spawn = { x: R.X(11), z: R.Z(1.5), face: 180 };
      R.lines = ['“The deck is for observation.” “Of what?” “Of whoever is on the deck.”', '“Everything is white.” “Why?” “So nothing shows.” “Something shows.” “Yes.”'];
      R.stops = [[1, 0.5, 0], [1, 7.5, 0], [3.5, 4, 0], [2.5, 10, 0], [8, 2.4, 0], [11, 1.5, 0], [14, 1.5, 0], [13, 5.2, 0], [8.5, 6.3, 0], [13.4, 7.4, 0], [15, 8.4, 0], [13.5, 9.5, 0], [8.5, 9.9, 0], [5.5, 4, 0], [5.5, 4, 3.5], [8.5, 7.5, 3.5]];
    }
    return [
        { id: 'site_prebuilt_area51_hangar', key: 'hangar', name: 'the hangar', R: HG, head: [
            "label: 'AREA 51 · HANGAR 18',", "sub: 'THE FLOOR · THE SAUCER · THE CATWALK · THE CONTROL ROOM · THE FLOOR LIFT · EST. 1947',", "kind: 'box', site: 'prebuilt_area51', part: 'hangar',",
            "shell: hqBunkerShell({ w: " + HG.W + ", d: " + HG.D + ", h: 14, wallH: 14, plate: { x: " + HG.spawn.x + ", z: " + r2(HG.D / 2 - 1.2) + ", y: 3.0 },",
            "                       floor: 'urban:ConcreteStriped1b', wall: 'urban:MetalCorrugatedPainted1a', dado: 'urban:MetalCorrugatedPainted1c', ceiling: 'urban:MetalSubwayGrill1a',",
            "                       floorColor: 0xb0b4b8, wallColor: 0xa8b0b8, dadoColor: 0x7a848c, ceilColor: 0x6a7078,",
            "                       mood: { lamp: 0xeaf4ff, glow: 0xbfe0ff, strip: 0xffffff, light: 0xe8f0ff, ambient: 0.55 }, fog: { color: 0x0c1018, density: 0.008 }, look: HQ_ROOM_LOOKS.hangar }),",
            "parti: 'One hall fourteen metres high with the saucer on its rig under a catwalk; shops, bays and offices round it on whole squares, a glass control room up on the mezzanine.',",
        ], terrain: ["res: 0.4375, floor: 'urban:ConcreteStriped1b', cliff: 'urban:ConcreteStriped2a', path: 'urban:TileGeneric3a',", "noise: { amp: 0, scale: 5 }, crag: false,"] },
        { id: 'site_prebuilt_area51_ward', key: 'ward', name: 'the white rooms', R: WD, head: [
            "label: 'AREA 51 · THE WHITE ROOMS',", "sub: 'PSYCHIATRIC · THE CELL ROW · THE DAYROOM · THE OBSERVATION FLOOR · FOR THE ONES WHO SAW IT',", "kind: 'box', site: 'prebuilt_area51', part: 'ward',",
            "shell: hqBunkerShell({ w: " + WD.W + ", d: " + WD.D + ", h: 7, wallH: 7, plate: { x: " + WD.spawn.x + ", z: " + r2(-WD.D / 2 + 1.2) + ", y: 2.8 },",
            "                       floor: 'urban:TileGeneric1a', wall: 'urban:PlasterWallPainted1a', dado: 'urban:PlasterWallPainted1a', ceiling: 'urban:FibreCeilingTile1a',",
            "                       floorColor: 0xe8e8ea, wallColor: 0xf0f0f2, dadoColor: 0xe0e0e4, ceilColor: 0xf4f4f6,",
            "                       mood: { lamp: 0xffffff, glow: 0xffffff, strip: 0xffffff, light: 0xffffff, ambient: 0.62 }, fog: { color: 0xe8e8ec, density: 0.016 }, look: HQ_ROOM_LOOKS.white }),",
            "parti: 'A white wing on whole squares: eight padded cells on a hall, rooms off four corridors round a glass nurses station, and an observation floor over the halls that looks down through glass.',",
        ], terrain: ["res: 0.4375, floor: 'urban:TileGeneric1a', cliff: 'urban:PlasterWallPainted1a', path: 'urban:RubberNonSlip2a',", "noise: { amp: 0, scale: 5 }, crag: false,"] },
    ];
};
