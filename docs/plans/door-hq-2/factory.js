#!/usr/bin/env node
/* docs/plans/door-hq-2/factory.js — THE WORKS, TOP: THE FACTORY (DOOR HQ 2.0 wave 3, 2026-11-26). Repo-only tooling.
   Writes data.js DOOR_HQ.rooms.factory from plans/3_garage_works_top.png (the right-hand drum): one round room round the
   Incinerator's flue, the rooms as wedges, the way through one way only:
     the roller door (west) > LOADING DOCK (out to in) > WAREHOUSE (in to out, through the racks) > THE LINE (out to in, along
     the belts to the Chute) > DOOR GARDEN (in to out) > AUTOPSY ROOM (across) > the ramp bay > FREIGHT RAMP (south, down).
   CONTROL ROOM, BOILER ROOM and LAUNDRY open off the service corridor past the ramp bay.
   Geometry: compass degrees (0 north, 90 east), metres from the flue's middle; x = sin(deg) r, z = -cos(deg) r (the box room's
   own frame: x east, z south). The box is 77 x 77 m so the drum (r 38.5) touches its four walls: the west wall's door is the
   roller door, the south wall's the ramp.
     node docs/plans/door-hq-2/factory.js            print the room
     node docs/plans/door-hq-2/factory.js --write    write it into data.js between the FACTORY markers
   Notes: docs/notes/hq-building-rooms.md "DOOR HQ 2.0, WAVE 3: THE WORKS' FACTORY". */
'use strict';
const fs = require('fs'), path = require('path');
const D2R = Math.PI / 180, r2 = v => Math.round(v * 100) / 100;
const P = (deg, r) => [r2(Math.sin(deg * D2R) * r), r2(-Math.cos(deg * D2R) * r)];

/* ── THE MEASURES ── */
const H = 8.75;            // the clear height (2.5 squares): the look book's truss at 8 m and a little over
const R_FLUE = 4.5;        // the flue's skin
const R_OUT = 38.5;        // the drum (the box's half width)
const R_COR = 35;          // the service corridor's inner wall (3.5 m corridor)
const R_BAY = 31.5;        // the ramp bay's back wall (a 7 m deep landing in front of the ramp)
const R_VOID = 14;         // the back rooms' inner wall (the narrow points of their wedges are shut off)
/* the wedges (compass degrees) */
const A = { dock: [252, 292], ware: [292, 400], line: [40, 105], garden: [105, 150], autopsy: [150, 182], control: [182, 208], boiler: [208, 230], laundry: [230, 252], bay: [172, 188] };

/* ── THE SHEETS (LOOK_BOOK.md "The Works, top: the factory") ── */
const WALL = { sheet: 'urban:MetalCorrugatedPainted2a', sheetColor: 0x8e969c, dado: 'urban:ConcreteWoodFormed1a', dadoColor: 0xb0aaa0, dadoH: 2.4 };
const COR = { sheet: 'urban:ConcretePrecast1c', sheetColor: 0xa8a49a, dado: 'urban:MetalWarningStripe1', dadoColor: 0xffffff, dadoH: 0.5 };
const DOORH = 4.2;         // a doorway's height inside the factory

const props = [], counters = [];
const add = (o) => { props.push(o); return o; };
const fmt = o => '{ ' + Object.entries(o).map(([k, v]) => k + ': ' + (typeof v === 'string' ? "'" + v + "'" : (typeof v === 'number' && k.toLowerCase().includes('color') ? '0x' + v.toString(16).padStart(6, '0') : JSON.stringify(v).replace(/"(\w+)":/g, '$1: ').replace(/"/g, "'").replace(/,(?=\S)/g, ', ')))).join(', ') + ' }';

/* a curved wall, cut into pieces of 60 degrees at most (the collider's grid) */
function arc(r, a0, a1, sheet, holes, extra) {
    const n = Math.ceil((a1 - a0) / 60), step = (a1 - a0) / n;
    for (let i = 0; i < n; i++) {
        const b0 = a0 + i * step, b1 = b0 + step;
        const hs = (holes || []).filter(h => h.a1 > b0 && h.a0 < b1).map(h => ({ a0: r2(Math.max(b0, h.a0)), a1: r2(Math.min(b1, h.a1)), h: h.h }));
        add(Object.assign({ key: 'arc_wall', x: 0, z: 0, face: 180, arcR: r, a0: r2(b0), a1: r2(b1), wallH: H, t: 0.3 }, sheet, hs.length ? { holes: hs } : {}, extra || {}));
    }
}
/* a straight wall along the radius `deg` from r0 to r1, holes = [[ra, rb, h]] along the radius */
function radial(deg, r0, r1, sheet, holes) {
    const [x0, z0] = P(deg, r0), [x1, z1] = P(deg, r1), mid = (r0 + r1) / 2, len = r1 - r0;
    const o = Object.assign({ key: 'room_wall', x: r2((x0 + x1) / 2), z: r2((z0 + z1) / 2), face: r2(deg + 90), len: r2(len), wallH: H, t: 0.3, dadoH: sheet.dadoH,
        front: { wall: sheet.sheet, wallColor: sheet.sheetColor, dado: sheet.dado, dadoColor: sheet.dadoColor },
        back: { wall: sheet.sheet, wallColor: sheet.sheetColor, dado: sheet.dado, dadoColor: sheet.dadoColor }, trimColor: 0xe8c13a, edgeColor: 0x4a4e52 });
    if (holes && holes.length) o.holes = holes.map(([a, b, h]) => ({ x0: r2(a - mid), x1: r2(b - mid), y0: 0, y1: h || DOORH }));
    add(o);
}
/* a prop at (deg, r); `face` given as compass, `toward: 'in'|'out'|'cw'|'ccw'` turns it to the flue / the drum / along the ring */
function at(key, deg, r, more) {
    const [x, z] = P(deg, r), o = Object.assign({ key, x, z }, more || {});
    if (o.toward) { o.face = r2(({ in: deg + 180, out: deg, cw: deg + 90, ccw: deg - 90 })[o.toward] % 360); delete o.toward; }
    return add(o);
}

/* ══ THE SHELL'S WALLS ══ */
/* the flue */
add({ key: 'works_flue', x: 0, z: 0, face: 180, flueR: R_FLUE, flueH: H, mouths: [{ deg: 72, w: 2.4, h: 1.7, y: 0.5, top: 0.95, len: 2.9 }] });
/* the drum, with the roller door (270) and the ramp (180) cut out */
arc(R_OUT, 0, 360, WALL, [{ a0: 264.5, a1: 275.5, h: 5.4 }, { a0: 174.5, a1: 185.5, h: 5.4 }]);
/* the service corridor's inner wall (the back rooms' doors) and the ramp bay */
arc(R_COR, A.bay[1], A.laundry[1], COR, [{ a0: 194.5, a1: 199.5, h: 3.2 }, { a0: 216.5, a1: 221.5, h: 3.2 }, { a0: 238.5, a1: 243.5, h: 3.2 }]);
arc(R_BAY, A.bay[0], A.bay[1], COR, [{ a0: 173.5, a1: 179.5, h: DOORH }]);   // the Autopsy Room's way out into the bay
radial(A.bay[0], R_BAY, R_OUT, COR); radial(A.bay[1], R_BAY, R_COR, COR);
/* the back rooms' inner wall (their narrow points shut off) */
arc(R_VOID, A.control[0], A.laundry[1], WALL);
/* the wedges' walls */
radial(A.dock[0], R_FLUE, R_OUT, WALL);                                   // Laundry | Dock (the corridor's dead end)
radial(A.dock[1], R_FLUE, R_OUT, WALL, [[10.5, 17.5, 5.4]]);             // Dock | Warehouse: the freight opening, near the flue
radial(A.line[0], R_FLUE, R_OUT, WALL, [[28.5, 34.5, 5.4]]);             // Warehouse | the Line: out by the drum
radial(A.line[1], R_FLUE, R_OUT, WALL, [[6.5, 10.5, DOORH]]);            // the Line | Door Garden: by the Chute
radial(A.garden[1], R_FLUE, R_OUT, WALL, [[22, 26, DOORH]]);              // Door Garden | Autopsy Room
radial(A.autopsy[1], R_FLUE, R_BAY, WALL);                                // Autopsy Room | Control Room (the void's west wall too)
radial(A.control[1], R_VOID, R_COR, WALL);                                // Control Room | Boiler Room
radial(A.boiler[1], R_VOID, R_COR, WALL);                                 // Boiler Room | Laundry

/* ══ THE LOADING DOCK (252-292): the roller door, the forklift, pallets, the scale; the lane runs in to the Warehouse ══ */
at('roller_shutter', 256, 38.1, { toward: 'in' }); at('roller_shutter', 284, 38.1, { toward: 'in' });   // the other two bays, shut
at('cage_lamp', 270, 37.6, { y: 5.9, toward: 'in' });                    // the one lamp over the roller door (the shot that plants it)
at('warning_tape', 256, 33, { toward: 'cw' }); at('warning_tape', 284, 33, { toward: 'cw' });
at('wrapped_pallet', 257, 28.5, { face: 15 }); at('wrapped_pallet', 258.5, 26.5, { face: 40 }); at('wrapped_pallet', 256, 24, { face: 5 });
at('wrapped_pallet', 286.5, 29, { face: 80 });
at('forklift', 259, 19, { toward: 'cw' });
at('pallet_jack', 265, 13.5, { face: 120 }); at('hand_truck', 287, 33.5, { face: 200 });
at('platform_scale', 260, 13, { toward: 'out' });
at('door_stack', 282, 7, { toward: 'cw' }); at('door_stack', 257, 9, { toward: 'ccw' });
at('cardboard_boxes', 262, 31.5, { face: 30 }); at('cardboard_boxes', 280, 34.5, { face: 300 });
at('fire_extinguisher', 253, 30, { y: 0.95, toward: 'cw' }); at('breaker_panel', 253, 20, { y: 1.25, toward: 'cw' });

/* ══ THE WAREHOUSE (292-40): two long racks you weave round, in from the Dock by the flue, out to the Line by the drum ══ */
/* rack A at r 18.5 (open at its east end), rack B at r 26 (open at its west end) */
/* a rack: a 4.4 m steel spine (an arc_wall of grating) with shelving down both faces */
const RACK = { sheet: 'urban:MetalPanel1a', sheetColor: 0x7a8088, dado: 'urban:MetalPanel1a', dadoColor: 0x7a8088, dadoH: 0 };
const rack = (r, d0, d1) => {
    const n = Math.ceil((d1 - d0) / 45), st = (d1 - d0) / n;
    for (let i = 0; i < n; i++) add(Object.assign({ key: 'arc_wall', x: 0, z: 0, face: 180, arcR: r, a0: r2(d0 + i * st), a1: r2(d0 + (i + 1) * st), wallH: 4.4, t: 0.35, edgeColor: 0xe8c13a }, RACK));
    const step = 1.65 / r / D2R; for (let d = d0 + step / 2; d <= d1 - step / 2 + 0.01; d += step) { at('metal_shelving', d, r - 0.45, { toward: 'in' }); at('metal_shelving', d, r + 0.45, { toward: 'out' }); }
};
rack(18.5, 296, 382); rack(26, 312, 396);
/* crates on top of the racks' ends and doors stacked against them */
[[300, 16.8], [330, 16.8], [360, 16.8], [318, 20.3], [350, 20.3], [378, 20.3]].forEach(([d, r], i) => at('door_stack', d, r, { toward: i % 2 ? 'cw' : 'ccw' }));
[[316, 24.2], [345, 24.2], [372, 24.2], [330, 27.8], [362, 27.8], [390, 27.8]].forEach(([d, r]) => at('wrapped_pallet', d, r, { face: (d * 7) % 90 }));
at('forklift', 300, 31, { toward: 'cw' });
at('chain_hoist', 338, 32, { y: 5.2 }); at('chain_hoist', 10, 12, { y: 5.2 });
at('psx_supply_crate_1', 302, 22.5); at('psx_supply_crate_1', 303.5, 22.9, { y: 0.37 }); at('cardboard_boxes', 388, 13, { face: 40 }); at('cardboard_boxes', 340, 9.5, { face: 10 });
at('fire_extinguisher', 293, 30, { y: 0.95, toward: 'ccw' });

/* ══ THE LINE (40-105): two belts from the drum to the Chute, robot arms working them; the hero shot looks along them to the glow ══ */
[62, 82].forEach(d => [11, 17, 23, 29].forEach(r => at('conveyor', d, r, { face: r2(d + 90) })));
[[57, 14], [87, 14], [57, 26], [87, 26], [67, 20], [77, 20]].forEach(([d, r], i) => at('robot_arm', d, r, { toward: i % 2 ? 'ccw' : 'cw' }));
at('safety_netting', 72, 6.6, { y: 3.4, toward: 'out' });
at('fire_danger_sign', 66, 6.9, { toward: 'out' });
at('warning_tape', 72, 8.0, { toward: 'cw' });
at('drill_press', 48, 20, { toward: 'cw' }); at('metal_lathe', 47, 25, { toward: 'cw' }); at('welding_cart', 97, 24, { face: 300 });
at('tool_pegboard', 41.5, 14, { y: 1.1, toward: 'cw' }); at('gauge_board', 103.5, 17, { y: 1.4, toward: 'ccw' });
at('door_stack', 96, 31, { toward: 'in' }); at('door_stack', 50, 33, { toward: 'in' });
counters.push({ id: 'line', ...(() => { const [x, z] = P(101.5, 12.5); return { x, z }; })(), face: 285, plateY: 1.6, radius: 1.8, verb: 'READ', label: 'THE LINE', action: {} });
at('notice_board', 103.5, 12.5, { y: 1.3, toward: 'ccw' });

/* ══ DOOR GARDEN (105-150): beds of doors on stems under purple lamps, in from the Chute, out by the middle ══ */
[[112, 12], [124, 12], [136, 12], [112, 18], [124, 18], [136, 18], [117, 27], [131, 27], [117, 33], [131, 33]].forEach(([d, r]) => at('planter', d, r, { toward: 'cw' }));
[[112, 12], [136, 18], [124, 18], [117, 33], [131, 27]].forEach(([d, r]) => at('grow_lamp', d, r, { ceil: true }));
[[112, 12], [124, 12], [136, 12], [112, 18], [124, 18], [136, 18], [117, 27], [131, 27], [117, 33], [131, 33]].forEach(([d, r], i) => at('door_vine', d + (i % 2 ? 1.2 : -1.2), r, { y: 0.5, toward: i % 3 ? 'in' : 'out' }));   // a door growing in every bed
at('garden_tree', 143, 31); at('garden_tree', 109, 34);
[[106, 15, 'ccw'], [106, 28, 'ccw'], [149, 12, 'cw'], [149, 32, 'cw']].forEach(([d, r, t]) => at('door_vine', d, r, { toward: t }));
counters.push({ id: 'bed', ...(() => { const [x, z] = P(124, 14.6); return { x, z }; })(), face: 34, plateY: 1.4, radius: 2.0, verb: 'READ', label: 'THE BEDS', action: {} });

/* ══ THE AUTOPSY ROOM (150-182): two steel tables under the lamp, the drawers, the x-rays; out into the ramp bay ══ */
at('autopsy_table', 166, 17, { toward: 'cw' }); at('autopsy_table', 166, 23.5, { toward: 'cw' });
at('door_xray', 181.4, 15, { y: 1.1, toward: 'ccw' }); at('door_xray', 181.4, 19, { y: 1.1, toward: 'ccw' });
at('deposit_box_wall', 152, 12, { toward: 'cw' }); at('deposit_box_wall', 152, 16, { toward: 'cw' });
at('specimen_shelf', 151.5, 28, { toward: 'cw' }); at('sink_row', 180.6, 27, { toward: 'ccw' });
at('lab_glassware', 166, 17.9, { y: 0.92 });
at('steel_table', 160, 9, { toward: 'out' });
counters.push({ id: 'parts', ...(() => { const [x, z] = P(170.5, 17); return { x, z }; })(), face: 260, plateY: 1.5, radius: 2.0, verb: 'READ', label: 'THE PARTS', action: {} });

/* ══ THE RAMP BAY + THE SERVICE CORRIDOR (172-252, r 35-38.5) ══ */
at('warning_tape', 180, 33, { toward: 'cw' }); at('warning_tape', 176, 36.8, { toward: 'in' }); at('warning_tape', 184, 36.8, { toward: 'in' });
at('cage_lamp', 180, 38.2, { y: 5.8, toward: 'in' });
at('exit_sign', 186, 38.2, { y: 2.8, toward: 'in' });
[200, 214, 228, 246].forEach(d => at('pipe_run', d, 36.75, { y: 4.4, toward: 'cw' }));
[203, 225, 247].forEach(d => at('cage_lamp', d, 38.2, { y: 3.4, toward: 'in' }));
[206, 232].forEach(d => at('floor_drain', d, 36.75));
at('breaker_panel', 210, 38.2, { y: 1.25, toward: 'in' }); at('fire_extinguisher', 236, 38.2, { y: 0.95, toward: 'in' });

/* ══ THE CONTROL ROOM (182-208): the wall of screens facing the door ══ */
[188, 195, 202].forEach(d => at('monitor_stack', d, 14.6, { toward: 'out' }));
at('retro_control_panel', 195, 18.5, { toward: 'in' });
[[190, 22], [200, 22]].forEach(([d, r]) => { at('steel_table', d, r, { toward: 'in' }); at('psx_monitoring_screen_mp_1', d - 1, r, { y: 0.78, toward: 'out' }); at('psx_monitoring_screen_mp_1', d + 1, r, { y: 0.78, toward: 'out' }); at('computer_chair_grey', d, r + 1.3, { toward: 'in' }); });
counters.push({ id: 'feeds', ...(() => { const [x, z] = P(195, 16.3); return { x, z }; })(), face: 15, plateY: 1.6, radius: 2.2, verb: 'WATCH', label: 'THE FEEDS', action: {} });

/* ══ THE BOILER ROOM (208-230): two boilers, the turbine along the room, valves and pipes ══ */
at('boiler', 214, 17); at('boiler', 224, 17);
at('steam_turbine', 219, 24, { toward: 'out' });
at('centrifugal_pump', 213, 29.5, { toward: 'cw' }); at('gate_valve', 226, 30, { toward: 'ccw' }); at('valve_wheel', 229.2, 22, { toward: 'ccw' });
at('psx_pipe_1', 209.5, 20); at('psx_pipe_1', 228.5, 27);
at('gauge_board', 208.6, 26, { y: 1.4, toward: 'cw' });

/* ══ THE LAUNDRY (230-252): washers and dryers down both walls, the carts, a line of hazmat suits ══ */
[17, 20, 23, 26].forEach(r => { at('washer', 231.3, r, { toward: 'cw' }); at('dryer', 250.7, r, { toward: 'ccw' }); });
at('laundry_cart', 238, 21, { face: 30 }); at('laundry_cart', 244, 27, { face: 120 });
at('clothes_line', 241, 16.5, { toward: 'cw' });
at('hazmat_suit', 236, 15.2, { toward: 'out' }); at('hazmat_suit', 241, 15.2, { toward: 'out' }); at('hazmat_suit', 246, 15.2, { toward: 'out' });

/* ══ THE LAMPS: sodium high-bays hung from the truss (the look book's key light), the Chute's glow ══ */
[[272, 28], [272, 14], [320, 14], [330, 30], [10, 22], [30, 32], [62, 28], [82, 18], [125, 22], [166, 20], [195, 26], [219, 26], [241, 26]]
    .forEach(([d, r]) => at('high_bay_lamp', d, r, { y: H - 1.1, floor: true }));
at('light_glow', 72, 7.2, { y: 1.2, light: { color: 0xff7a2a, intensity: 2.2, dist: 16, y: 0 } });   // the Chute

const lights = [[272, 26], [272, 13], [312, 14], [340, 30], [15, 20], [30, 33], [62, 24], [82, 13], [127, 20], [166, 20], [180, 35], [195, 25], [219, 25], [241, 25], [220, 36.75]]
    .map(([d, r]) => { const [x, z] = P(d, r); return { x, z }; });

const room = `        /* ── THE WORKS, TOP: THE FACTORY (DOOR HQ 2.0 wave 3, 2026-11-26) — WRITTEN BY docs/plans/door-hq-2/factory.js (edit the tool, run --write) ──
           plans/3_garage_works_top.png's drum: one round room round the Incinerator's flue. The way through, one way: the roller door
           (west) > the Loading Dock > the Warehouse (round its two racks) > the Line (along the belts to the Chute) > Door Garden >
           the Autopsy Room > the ramp bay > the freight ramp down (south). The Control Room, the Boiler Room and the Laundry open off
           the service corridor past the bay. Walls: arc_wall (the drum, the rings) + room_wall (the wedges), collided by their meshes. */
        factory: {
            label: 'THE WORKS',
            kind: 'box', noWalkers: true,
            shell: {
                w: ${R_OUT * 2}, d: ${R_OUT * 2}, h: ${H},
                wallH: ${H}, dadoH: 2.4,
                floor: 'concrete_floor', wall: 'urban:MetalCorrugatedPainted2a', dado: 'urban:ConcreteWoodFormed1a', trim: 'metal', ceiling: 'urban:MetalTruss1b',
                floorColor: 0x9a968e, wallColor: 0x8e969c, dadoColor: 0xb0aaa0, ceilColor: 0x5a5650,
                pipes: true, strips: false, keyLamp: 0,
                lights: [${lights.map(l => '{ x: ' + l.x + ', z: ' + l.z + ' }').join(', ')}],
                mood: { light: 0xffb070, ambient: 0.55 },
                plate: { x: -33.5, z: -4.2, y: 4.6 },
            },
            doors: [
                { id: 'garage', wall: 'w', z: 0, leaf: 'leaf_wired_double', wide: true, label: 'GARAGE', action: { room: 'garage', at: 'works' } },
                { id: 'ramp', wall: 's', x: 0, open: { w: 7, h: 5.2 }, label: 'FREIGHT RAMP', action: { room: 'labs', at: 'factory' } },
                { id: 'hwing', wall: 'free', x: ${P(228, 38.2)[0]}, z: ${P(228, 38.2)[1]}, face: 48, leaf: 'leaf_white_wood', label: 'H-WING', locked: true, action: { room: 'hwing_floor', at: 'works_top' }, desc: 'A plain door in the service corridor. It is not on the fire plan.' },   // DOOR HQ 2.0 wave 4: H-Wing's plain door, in the drum between the Boiler Room's and the Laundry's doors
            ],
            counters: [
${counters.map(c => '                ' + fmt(c) + ',').join('\n')}
            ],
            props: [
${props.map(p => '                ' + fmt(p) + ',').join('\n')}
            ],
            agents: [],
            npcSpots: [],
            lines: [],
            spawn: { x: -33, z: 0, face: 90 },
        },
`;

if (process.argv.includes('--write')) {
    const file = path.join(__dirname, '..', '..', '..', 'data.js');
    let src = fs.readFileSync(file, 'utf8');
    const B = '        /* ── THE WORKS, TOP: THE FACTORY', E = '        /* ── end THE WORKS, TOP: THE FACTORY ── */\n';
    const i = src.indexOf(B), j = src.indexOf(E);
    if (i < 0 || j < 0) { console.error('markers not found in data.js'); process.exit(1); }
    src = src.slice(0, i) + room + src.slice(j);
    fs.writeFileSync(file, src);
    console.log('data.js: factory written (' + props.length + ' props, ' + counters.length + ' counters)');
} else process.stdout.write(room);
