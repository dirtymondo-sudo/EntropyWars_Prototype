/* THE INTERNET · H · THE INFORMATION HIGHWAY (12 plots, level 10: row 4 from Dial-Up to the Last Mile, and the leg north and south through
   the crossing). One thread a file; the tool is bake-internet.js, the shared pieces docs/areas/internet/kit.js, the rules
   docs/notes/areas-complexes.md "THE INTERNET, PLAN 3".
   THE IDEA (mondo 11-17: "information highway ... pathways"; and after the first build: "Why ... are there buildings and cars"): NOT a
   road. A RIVER OF LIGHT four squares wide hanging in the sky, walked on; every district hangs off it. No cars, no lamps, no signs on
   posts: the packets are lit cubes drifting over it, the names are words standing in the air. LANDMARKS: THE DESKTOP (label mine), the
   round island at the crossing: icons the size of monuments and the pointer; THE KEYBOARD at the south end.
   A river plot's squares: the light = 4..7 across it, all of it walk (nothing may stand on it; pieces hang over it or beside it). */
'use strict';
const K = require('../kit.js'), STEEL = K.STEEL, POST = K.POST;
const EW = ['P01-04', 'P02-04', 'P03-04', 'P05-04', 'P06-04', 'P07-04', 'P08-04'], NS = ['P04-02', 'P04-03', 'P04-05'];
const PKT = [0x40e0ff, 0xff5fb0, 0xffe040, 0x30ff70, 0xb070ff, 0xffffff];
exports.plan = c => {
    c.fill('P01-04', 1, 2, 3, 3);                       // Dial-Up: the modem's own little tile, north of the river's end
    c.fill('P04-06', 1, 0, 10, 0);                      // the Keyboard: its top row
};
exports.build = c => { const C = c.C;
    /* THE RIVER'S OWN LOOK, every plot: a lit edge each side, and THE PACKETS: lit cubes hanging over the light at three heights */
    EW.forEach((id, n) => c.look('river_' + id, id, 0, 0, 0, a => { const end = c.plot[id].end, x0 = (end === 'W' ? 2 : 0) * C, x1 = (end === 'E' ? 10 : 12) * C, L = x1 - x0, xm = (x0 + x1) / 2;
        a.box(xm, 0, 4 * C, L, 0.14, 0.14, null, 0x7fffd0, { glow: 1 }); a.box(xm, 0, 8 * C, L, 0.14, 0.14, null, 0x7fffd0, { glow: 1 });
        for (let i = 0; i < 7; i++) { const x = x0 + 3 + i * (L - 6) / 6, z = (4.6 + ((i * 5 + n * 3) % 7) * 0.45) * C, s = 0.5 + ((i + n) % 3) * 0.25; a.box(x, 3.4 + ((i * 7 + n) % 5) * 0.9, z, s, s, s, null, PKT[(i + n) % 6], { glow: 1, ry: (i * 31) % 90 }); } }));
    NS.forEach((id, n) => c.look('river_' + id, id, 0, 0, 0, a => { const end = c.plot[id].end, z0 = (end === 'N' ? 2 : 0) * C, z1 = 12 * C, L = z1 - z0, zm = (z0 + z1) / 2;
        a.box(4 * C, 0, zm, 0.14, 0.14, L, null, 0x7fffd0, { glow: 1 }); a.box(8 * C, 0, zm, 0.14, 0.14, L, null, 0x7fffd0, { glow: 1 });
        for (let i = 0; i < 6; i++) { const z = z0 + 3 + i * (L - 6) / 5, x = (4.6 + ((i * 5 + n * 3) % 7) * 0.45) * C, s = 0.5 + ((i + n) % 3) * 0.25; a.box(x, 3.4 + ((i * 7 + n) % 5) * 0.9, z, s, s, s, null, PKT[(i + n + 2) % 6], { glow: 1, ry: (i * 31) % 90 }); } }));
    /* DIAL-UP (P01-04): the modem on its own tile, the size of a bus; the noise it makes, written in the air */
    c.look('modem', 'P01-04', 2.5, 3, 0, a => { a.box(0, 0, 0, 8.6, 2.4, 5.2, null, 0xd8d0b8, { glow: 0.25 }); a.box(0, 2.4, 0, 8.2, 0.25, 4.8, null, 0xb8b09a);
        for (let i = 0; i < 8; i++) a.box(-3.2 + i * 0.92, 1.4, 2.63, 0.36, 0.36, 0.06, null, i % 3 === 1 ? 0x30ff70 : i % 3 === 2 ? 0xffb020 : 0xff3030, { glow: 1 });
        a.sign('56K', 0, 0.3, 2.64, 3, 0.9, '#3a3a34', '', 'archivo', { kind: 'over' }); a.cyl(-3.4, 2.65, -1.4, 0.06, 5, STEEL, POST, { seg: 5 }); a.cyl(3.4, 2.65, -1.4, 0.06, 5, STEEL, POST, { seg: 5 });
        K.words(a, 'EEEEE-KRRRRSHHH-BONG-BONG', 2, 7.4, 6, 12, 1.0, '#7fffd0'); K.words(a, 'DIAL-UP', 2, 8.8, 6, 7, 1.8, '#ffffff', 'archivo'); });
    K.solid(c, 'P01-04', 1, 2, 3, 3, 4);
    /* THE SLOW LANE (P02-04): the words, and a snail's pace of packets */
    c.look('slow', 'P02-04', 6, 3.2, 0, a => { K.words(a, 'THE SLOW LANE', 0, 6.5, 0, 12, 1.6, '#ffe040', 'archivo'); K.words(a, 'MINIMUM SPEED 1 KB/S', 0, 5.4, 0, 9, 0.8, '#ffffff'); });
    /* THE PAYWALL (P03-04): a wall of gold bars across the light, a gap to walk through, the words over it */
    c.look('paywall', 'P03-04', 6, 6, 90, a => { [-6.2, -4.4, 4.4, 6.2].forEach(x => a.box(x, 0, 0, 1.5, 5.2, 0.5, 'gold_2', 0xffd860, { glow: 0.55 }));
        a.box(0, 5.2, 0, 14.4, 1.0, 0.6, 'gold_2', 0xffd860, { glow: 0.55 });
        a.sign('PAYWALL', 0, 6.4, 0.32, 10, 2.0, '#111111', '#ffe040', 'archivo'); a.sign('PAYWALL', 0, 6.4, -0.32, 10, 2.0, '#111111', '#ffe040', 'archivo', { ry: 180 });
        a.sign('SUBSCRIBE TO KEEP WALKING', 0, 8.5, 0.32, 10, 0.8, '#ffffff', '#1a1030', 'dot'); a.sign('YOU HAVE 3 FREE STEPS LEFT THIS MONTH', 0, 8.5, -0.32, 10, 0.8, '#ffffff', '#1a1030', 'dot', { ry: 180 }); });
    /* FIBRE (P05-04): hoops of light over the river, one colour after the next */
    c.look('fibre', 'P05-04', 0, 0, 0, a => { [0xff3050, 0xff9a20, 0xffe040, 0x30ff70, 0x40e0ff, 0x6a6aff, 0xb070ff].forEach((col, i) => { const x = (1.4 + i * 1.5) * C;
        a.box(x, 0, 3.9 * C, 0.2, 6.4, 0.2, null, col, { glow: 1 }); a.box(x, 0, 8.1 * C, 0.2, 6.4, 0.2, null, col, { glow: 1 }); a.box(x, 6.4, 6 * C, 0.2, 0.2, 4.2 * C + 0.2, null, col, { glow: 1 }); }); });
    /* BUFFERING (P06-04): the ring going round, hung over the light with nothing holding it; the count under it */
    c.look('buffer', 'P06-04', 7, 6, 0, a => { for (let i = 0; i < 12; i++) { const t = i / 12 * Math.PI * 2, v = Math.round(60 + 195 * (i / 11)), col = (v << 16) | (v << 8) | v;
            a.cyl(Math.cos(t) * 5.2, 8.5, Math.sin(t) * 5.2, 0.85, 0.5, null, col, { seg: 10, glow: 0.15 + 0.85 * (i / 11) }); }
        K.words(a, 'BUFFERING... 99%', 0, 10.2, 0, 10, 1.3, '#ffffff'); });
    /* THE SPEED TEST (P07-04) + THE LAST MILE (P08-04): words over the light */
    c.look('speed', 'P07-04', 6, 3.2, 0, a => { K.words(a, 'YOUR SPEED: 0.3 MB/S', 0, 6.2, 0, 11, 1.3, '#ffe040', 'archivo'); K.words(a, 'THAT IS SLOW', 0, 5.2, 0, 6, 0.8, '#ffffff'); });
    c.look('lastmile', 'P08-04', 9.2, 6, 90, a => { K.words(a, 'THE LAST MILE', 0, 5.6, 0, 11, 1.6, '#7fffd0', 'archivo'); K.words(a, 'IT IS ALWAYS THE LAST MILE', 0, 4.6, 0, 9, 0.8, '#ffffff'); });
    /* THE ON-RAMP (P04-02): the name of the whole thing, standing in the air at the north end */
    c.look('onramp', 'P04-02', 6, 1.2, 0, a => { K.words(a, 'INFORMATION', 0, 9.4, 0, 16, 2.6, '#7fffd0', 'archivo'); K.words(a, 'HIGHWAY', 0, 6.6, 0, 12, 2.6, '#ffffff', 'archivo'); });
    c.look('bandwidth', 'P04-03', 6, 6, 0, a => { a.quad(0, 0.05, 0, 13.4, 0.25, 0, null, 0xffe040, { flat: true, glow: 1 }); K.words(a, 'BANDWIDTH: 14 M', 0, 5.4, 0, 9, 1.0, '#ffe040', 'archivo'); });
    /* THE BACKBONE (P04-05): ribs of bone over the light, the spine along their tops */
    c.look('backbone', 'P04-05', 6, 0, 0, a => { for (let i = 0; i < 6; i++) { const z = (1 + i * 2) * C, s = 8.4 - Math.abs(i - 2.5) * 0.4;
            a.box(-s, 0, z, 0.5, 6.5, 0.7, null, 0xe8e4d8, { glow: 0.45 }); a.box(s, 0, z, 0.5, 6.5, 0.7, null, 0xe8e4d8, { glow: 0.45 }); a.box(0, 6.5, z, 2 * s + 0.5, 0.6, 0.7, null, 0xe8e4d8, { glow: 0.45 }); a.box(0, 7.1, z, 2.0, 0.9, 1.5, null, 0xf4f0e4, { glow: 0.5 }); }
        a.box(0, 7.4, 6 * C, 0.4, 0.4, 12 * C, null, 0x7fffd0, { glow: 1 }); });
    /* THE DESKTOP (P04-04, the landmark): the round island at the crossing. Four icons the size of monuments on its four quarters (a
       folder, a document, a picture, the bin), each with its name under it; THE POINTER, the arrow, hanging over the middle 14 m up */
    c.look('desktop', 'P04-04', 6, 6, 0, a => { const Q = 12.6;
        /* the folder */
        a.box(-Q, 1.2, -Q, 5.6, 4.0, 0.7, null, 0xf0c040, { glow: 0.6 }); a.box(-Q - 1.5, 5.2, -Q, 2.4, 0.7, 0.7, null, 0xf0c040, { glow: 0.6 }); a.box(-Q, 1.2, -Q + 0.4, 5.6, 3.4, 0.15, null, 0xffd860, { glow: 0.7 });
        a.sign('NEW FOLDER (3)', -Q, 0.2, -Q + 0.5, 5.6, 0.8, '#ffffff', '#0a2a90', 'dot');
        /* the document */
        a.box(Q, 1.2, -Q, 4.2, 5.4, 0.4, null, 0xf4f4f0, { glow: 0.7 }); for (let i = 0; i < 6; i++) a.box(Q, 2.0 + i * 0.7, -Q + 0.22, 3.2 - (i === 0 ? 1.2 : 0), 0.18, 0.04, null, 0x5a6a7a, { glow: 0.3 });
        a.sign('final_FINAL_v2.doc', Q, 0.2, -Q + 0.5, 6.4, 0.8, '#ffffff', '#0a2a90', 'dot');
        /* the picture */
        a.box(-Q, 1.2, Q, 5.6, 4.4, 0.4, null, 0xf4f4f0, { glow: 0.5 }); a.box(-Q, 1.5, Q + 0.22, 5.0, 3.8, 0.04, null, 0x60b0ff, { glow: 0.8 }); a.box(-Q, 1.5, Q + 0.25, 5.0, 1.3, 0.04, null, 0x40b050, { glow: 0.8 }); a.cyl(-Q + 1.4, 4.0, Q + 0.26, 0.55, 0.04, null, 0xffe040, { glow: 1, seg: 12 });
        a.sign('IMG_0001.JPG', -Q, 0.2, Q + 0.5, 5.6, 0.8, '#ffffff', '#0a2a90', 'dot');
        /* the bin */
        a.cone(Q, 1.2, Q, 1.7, 2.3, 4.2, 'urban:MetalCorrugated2a', 0xb8c4d0, { seg: 14, glow: 0.3 }); a.cyl(Q, 5.4, Q, 2.5, 0.3, STEEL, 0x8a94a0, { seg: 14 });
        a.sign('RECYCLE BIN', Q, 0.2, Q + 2.6, 5.2, 0.8, '#ffffff', '#0a2a90', 'dot');
        /* the pointer: an arrow of white boxes, stepped like its pixels */
        [[0, 0, 1], [0.9, -0.9, 2], [1.8, -1.8, 3], [2.7, -2.7, 4], [3.6, -3.6, 5], [4.5, -4.5, 3], [5.6, -5.4, 1.4], [6.6, -6.4, 1.4]].forEach(([dy, _, w], i) => { a.box(-1 + w * 0.45, 20 - dy, 0, w * 0.9, 0.92, 0.5, null, 0xffffff, { glow: 1 }); });
        K.words(a, 'DESKTOP', 0, 9.5, 0, 9, 1.6, '#ffffff', 'archivo'); });
    [[1, 1, 3, 2], [8, 1, 10, 2], [1, 9, 3, 10], [8, 9, 10, 10]].forEach(q => K.solid(c, 'P04-04', q[0] + 1, q[1] + 1, q[2] - 1, q[3] - 1, 6));
    /* THE KEYBOARD (P04-06): the tile is a keyboard. Key caps a square and a half wide stand on it in four blocks between the walks, their
       letters on top; the space bar along the south edge */
    const ROWS = ['QWER', 'ASDF', 'ZXCV', 'TYUI', 'GHJK', 'BNM<', '1234', '5678'];
    c.look('keys', 'P04-06', 0, 0, 0, a => { [[1, 1], [7, 1], [1, 7], [7, 7]].forEach(([bx, by], q) => { for (let r = 0; r < 2; r++) for (let k = 0; k < 4; k++) { const x = (bx + 0.5 + k) * C, z = (by + 0.75 + r * 1.5) * C, ch = ROWS[(q * 2 + r) % 8][k];
            a.box(x, 0, z, 3.0, 0.5, 3.0, null, 0x2a2e36, { glow: 0.25 }); a.box(x, 0.5, z, 2.6, 0.12, 2.6, null, 0x3a4050, { glow: 0.35 });
            a.sign(ch, x, 0.64, z, 1.6, 1.6, '#7fffd0', '', 'archivo', { kind: 'over', flat: true, glow: 1 }); } });
        a.box(6 * C, 0, 10.4 * C, 6 * C, 0.5, 2.4, null, 0x2a2e36, { glow: 0.25 }); K.words(a, 'PRESS ANY KEY', 6 * C, 5, 10.4 * C, 10, 1.3, '#7fffd0', 'archivo'); });
    [[1, 1, 4, 3], [7, 1, 10, 3], [1, 7, 4, 9], [7, 7, 10, 9]].forEach(q => K.solid(c, 'P04-06', q[0], q[1], q[2], q[3], 0.62));
};
exports.people = c => {
    c.native('robot', 'P04-04', 3, 6, 90); c.native('ai', 'P04-04', 8, 3, 270); c.native('glitch', 'P04-04', 3, 8, 45); c.native('machine elves', 'P04-06', 5, 4, 180); c.native('boltzmann brain', 'P04-06', 6, 9, 0);
};
