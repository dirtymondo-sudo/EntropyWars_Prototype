/* THE INTERNET · K · THE MOTHERBOARD (6 plots south-west of the crossing: three terraces, levels 8 / 6 / 4). One thread a file; the tool is
   bake-internet.js, the kit docs/areas/internet/kit.js, the rules docs/notes/areas-complexes.md "THE INTERNET, PLAN 3".
   THE IDEA (mondo 11-17: "Wires and computer switches, 1s and 0s, binary"): the board everything runs on, big enough to walk across.
   Green board between gold traces (the walks ARE the traces). The parts are the landscape: switches the size of doors, the chip under
   its fan, memory sticks like ridges, a wood of capacitors, the round battery; ones and noughts pour off the south edge.
   LANDMARK: THE PROCESSOR (label mine). A terrace plot's squares: the blocks between the traces are 0..4 and 7..11 (less the open edge). */
'use strict';
const K = require('../kit.js'), STEEL = K.STEEL, POST = K.POST, GREEN = 0x1a7a40, GOLD = 0xffd860;
exports.build = c => { const C = c.C;
    /* THE BOARD, every plot: the green solder mask on the four blocks, thin gold traces with their pads, the print */
    c.plots.forEach((p, n) => c.look('board_' + p.id, p.id, 0, 0, 0, a => { [[1, 1], [7, 1], [1, 7], [7, 7]].forEach(([bx, by], q) => { const x0 = (bx === 1 && c.open(p.sx, p.sy + 3) ? 0 : bx), x1 = (bx === 7 && c.open(p.sx + 11, p.sy + 3) ? 12 : bx + 4), w = (x1 - x0) * C;
            a.quad((x0 + x1) / 2 * C, 0.04, (by + 2) * C, w - 0.3, 4 * C - 0.3, 0, 'metal_3', GREEN, { flat: true, glow: 0.35 });
            for (let i = 0; i < 3; i++) { const z = (by + 0.7 + i * 1.3 + ((q + n) % 2) * 0.3) * C; a.quad((x0 + x1) / 2 * C, 0.07, z, w - 2.4, 0.16, 0, null, GOLD, { flat: true, glow: 0.9 }); a.cyl(x0 * C + 1.4, 0.05, z, 0.28, 0.05, null, GOLD, { seg: 8, glow: 0.9 }); a.cyl(x1 * C - 1.4, 0.05, z, 0.28, 0.05, null, GOLD, { seg: 8, glow: 0.9 }); } }); }));
    /* THE SWITCH BANK (P02-05): eight toggle switches the size of doors in two rows, every one labelled; half are on */
    c.look('switches', 'P02-05', 0, 0, 0, a => { [[1.5, 2.5], [7.5, 2.5]].forEach(([bx, by], r) => { for (let i = 0; i < 4; i++) { const x = (bx + 0.5 + i * 0.9) * C, z = by * C, on = (i + r) % 2;
            a.sign(on ? '1' : '0', x, 0.06, z + 1.9, 0.9, 0.9, on ? '#30ff70' : '#ff3050', '', 'archivo', { kind: 'over', flat: true, glow: 1 }); } });
        K.words(a, 'ON / OFF', 6 * C, 6.2, 2.5 * C, 8, 1.4, '#30ff70', 'archivo'); K.words(a, 'DO NOT TOUCH (TOUCH)', 6 * C, 5.3, 2.5 * C, 7, 0.7, '#ffffff'); });
    /* the switches themselves = the Meshy `toggle_switch` (THE INTERNET MODELS, 11-18), door-high, every other one turned round */
    [[1.5, 2.5], [7.5, 2.5]].forEach(([bx, by], r) => { for (let i = 0; i < 4; i++) c.at('toggle_switch', 'P02-05', bx + 0.5 + i * 0.9, by, { h: 2.4, face: (i + r) % 2 ? 0 : 180 }); });
    K.solid(c, 'P02-05', 2, 2, 4, 2, 3); K.solid(c, 'P02-05', 8, 2, 10, 2, 3);
    /* THE PROCESSOR (P03-05, the landmark): the chip, three squares a side, its pins all round, the heat sink's fins, the fan over it */
    c.at('cpu_fan', 'P03-05', 9, 3, { span: 11.6 });   // the chip on its board, the heat sink, the fan = the Meshy `cpu_fan` (THE INTERNET MODELS, 11-18)
    c.look('cpu', 'P03-05', 9, 3, 0, a => {
        K.words(a, '100%', 0, 7.4, 0, 6, 1.8, '#ff3050', 'archivo'); K.words(a, 'IT IS ONLY A BROWSER TAB', 0, 6.5, 5.4, 9, 0.7, '#ffffff'); });
    K.solid(c, 'P03-05', 7, 1, 10, 4, 6);
    /* THE MEMORY (P02-06): four sticks standing on edge, 12 m long and 5 high, black chips down their sides, gold teeth along their feet */
    [[2.5, 1.5], [2.5, 3.5], [9, 8], [9, 10]].forEach(([x, y], i) => c.at('ram_stick', 'P02-06', x, y, { span: (i < 2 ? 4 : 3.4) * C }));   // the Meshy `ram_stick` (THE INTERNET MODELS, 11-18)
    c.look('ram', 'P02-06', 0, 0, 0, a => { K.words(a, 'MEMORY: FULL', 2.5 * C, 7.6, 2.5 * C, 9, 1.3, '#30ff70', 'archivo'); });
    K.solid(c, 'P02-06', 1, 1, 4, 1, 5); K.solid(c, 'P02-06', 1, 3, 4, 3, 5); K.solid(c, 'P02-06', 8, 8, 10, 8, 5); K.solid(c, 'P02-06', 8, 10, 10, 10, 5);
    /* THE CAPACITORS (P03-06): a wood of cans, blue and black, silver tops, every height; two coils of copper */
    const CAPS = [[1, 1, 1.3, 7], [3, 1, 0.9, 4.5], [2, 3, 1.1, 9], [4, 4, 0.7, 3.5], [8, 1, 1.2, 6], [10, 3, 1.0, 8], [8, 4, 0.8, 4], [1, 8, 1.0, 5], [3, 9, 1.3, 10], [2, 10, 0.8, 3.5], [8, 8, 1.1, 7.5], [10, 9, 0.9, 5], [9, 10, 1.2, 9]];
    CAPS.forEach(([x, y, r, h], i) => c.at('capacitor', 'P03-06', x + 0.5, y + 0.5, { h, face: (i * 67) % 360 }));   // the Meshy `capacitor` (THE INTERNET MODELS, 11-18), every height
    CAPS.forEach(([x, y]) => K.solid(c, 'P03-06', x, y, x, y, 4));
    c.look('coil', 'P03-06', 4.5, 9.5, 0, a => { for (let i = 0; i < 9; i++) a.cyl(0, 0.2 + i * 0.36, 0, 1.4, 0.3, null, 0xc87838, { seg: 14, ri: 0.9, glow: 0.5 }); });
    K.solid(c, 'P03-06', 4, 9, 4, 9, 4);
    /* THE BINARY FALLS (P02-07): ones and noughts pouring off the board's south edge into the sky, twelve columns of them */
    c.look('falls', 'P02-07', 6, 11, 0, a => { for (let k = 0; k < 12; k++) { const x = -18 + k * 3.3 + (k % 2) * 0.6; for (let j = 0; j < 9; j++) { const y = -1.2 - j * 1.7 - (k % 3) * 0.5, bit = (k * 7 + j * 5 + (j * j) % 3) % 2; a.sign(bit ? '1' : '0', x, y, 0.2 + (k % 2) * 0.5, 1.3, 1.3, bit ? '#7fffd0' : '#30c060', '', 'dot', { kind: 'over', glow: 1 }); } }
        K.words(a, 'BINARY FALLS', 0, 5.2, -4, 11, 1.5, '#7fffd0', 'archivo'); });
    /* THE BATTERY (P03-07): the coin cell, six metres across, the clock it keeps */
    c.at('coin_battery', 'P03-07', 9, 3, { h: 6.4 });   // the coin cell standing on its edge, its + to the south = the Meshy `coin_battery` (THE INTERNET MODELS, 11-18)
    c.look('battery', 'P03-07', 9, 3, 0, a => { K.words(a, '00:00', 0, 8.6, 0, 6, 1.8, '#ff3050'); K.words(a, 'IT REMEMBERS THE TIME. BADLY.', 0, 7.6, 0, 9, 0.7, '#ffffff'); });
    K.solid(c, 'P03-07', 7, 2, 10, 4, 1.4);
    c.mail('battery_bait', 'P03-07', 'E', 'P05-07', { phase: 0.25 });
};
exports.dress = c => {
    c.put('pd_lever', 'P02-05', 3, 8); c.put('signal_lever_frame', 'P02-05', 8, 8, { face: 0 }); c.put('breaker_panel', 'P02-05', 9, 9); c.put('meshy_tesla_coil', 'P03-06', 9, 6); c.put('generator', 'P03-07', 3, 8); c.put('gauge_board', 'P03-05', 3, 8, { face: 0 });
    c.put('robot_arm', 'P03-05', 2, 3); c.put('utility_box', 'P02-07', 3, 3); c.put('cable_drum', 'P02-07', 8, 3); c.put('retro_control_panel', 'P02-06', 8, 3, { face: 180 }); c.put('world_clocks', 'P03-07', 3, 3);
};
exports.people = c => {
    c.native('mech', 'P03-05', 3, 4, 90); c.native('cyborg', 'P02-05', 4, 8, 0); c.native('mad scientist', 'P02-05', 8, 4, 180); c.native('android', 'P02-06', 4, 8, 90); c.native('droid', 'P03-06', 6, 3, 180);
    c.native('robot', 'P02-07', 4, 8, 0); c.native('ai', 'P03-07', 4, 4, 90); c.native('machine elves', 'P02-07', 8, 8, 0); c.native('mole man', 'P03-06', 6, 8, 0);
};
exports.airZones = c => [{ sx0: 24, sy0: 60, sx1: 48, sy1: 96, kind: 'motes', n: 110, color: 0x30ff70 }, { sx0: 24, sy0: 94, sx1: 38, sy1: 104, kind: 'rain', n: 160, color: 0x30ff70 }];
