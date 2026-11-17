/* THE INTERNET · H · THE INFORMATION HIGHWAY (12 plots, level 10: row 4 from Dial-Up to the Last Mile, and the leg north and south through
   the crossing). One thread a file; the tool is bake-internet.js, the shared pieces docs/areas/internet/kit.js, the rules
   docs/notes/areas-complexes.md "THE INTERNET, PLAN 2".
   THE IDEA (mondo 11-17: "information highway ... pathways"): the road every district hangs off. Six squares of road (21 m), a shoulder
   square each side. THE CARS drive it (terrain.traffic: one loop, east on the south lanes, back west on the north lanes, turning at the two
   ends): they are the packets. The leg north and south has no cars: it is the walk. LANDMARK: THE EXCHANGE (label mine), the router tower
   on the crossing's island, its cables out over the four arms.
   A road plot's squares: the road = 3..8 across it, the shoulders = 2 and 9 (pieces stand there). */
'use strict';
const K = require('../kit.js'), STEEL = K.STEEL, POST = K.POST;
const EW = ['P01-04', 'P02-04', 'P03-04', 'P05-04', 'P06-04', 'P07-04', 'P08-04'], NS = ['P04-02', 'P04-03', 'P04-05', 'P04-06'];
const GREEN = '#0b5c3a';
/* a sign gantry over the road of an east-west plot at local column lx: two posts on the shoulders, the beam, a board each way */
function gantry(c, id, lx, east, west, o) { o = o || {}; K.solid(c, id, lx, 2, lx, 2, 8); K.solid(c, id, lx, 9, lx, 9, 8);
    c.look('gantry_' + id + '_' + lx, id, lx + 0.5, 6, 90, a => { const w = 24.5;   // (the row's +z = west: the board the eastbound cars read hangs on the -z face... both faces carry one)
        a.box(-w / 2, 0, 0, 0.4, 8.2, 0.4, STEEL, POST); a.box(w / 2, 0, 0, 0.4, 8.2, 0.4, STEEL, POST); a.box(0, 6.0, 0, w + 0.4, 0.35, 0.35, STEEL, POST);
        a.box(0, 6.0, 0, w - 1, 0.08, 0.5, null, 0x7fffd0, { glow: 1 });
        const n = Math.max(east.length, west.length), bw = Math.min(21, Math.max(8, n * 0.46 + 1.5)), bg = o.bg || GREEN;
        a.box(0, 6.35, 0, bw, 2.1, 0.16, null, parseInt(bg.slice(1), 16), { glow: 0.4 });
        a.sign(east, 0, 6.5, 0.1, bw - 0.6, 1.8, '#ffffff', bg, 'way'); a.sign(west, 0, 6.5, -0.1, bw - 0.6, 1.8, '#ffffff', bg, 'way', { ry: 180 }); }); }
exports.plan = c => {
    c.fill('P01-04', 2, 0, 4, 1);                       // Dial-Up: the modem's pad, north of the road's end
    c.fill('P08-04', 7, 10, 9, 11);                     // the Last Mile: a lay-by south of the road's end
    c.cut('P04-06', 2, 8, 3, 9); c.cut('P04-06', 7, 9, 9, 9); c.cut('P04-06', 5, 9, 5, 9);   // the Dead Link: the road's end broken off
    c.fill('P04-04', 0, 0, 1, 1); c.fill('P04-04', 10, 0, 11, 1); c.fill('P04-04', 0, 10, 1, 11); c.fill('P04-04', 10, 10, 11, 11);   // the crossing: four corner pads
    c.cut('P04-04', 0, 0, 0, 0); c.cut('P04-04', 11, 0, 11, 0); c.cut('P04-04', 0, 11, 0, 11); c.cut('P04-04', 11, 11, 11, 11);
};
exports.build = c => { const C = c.C;
    /* THE CARS: one loop. East along the south lanes (the square row 55 of the room), round the Last Mile's end, west along the north
       lanes (row 52), round Dial-Up's end. */
    const zE = c.gc(55), zW = c.gc(52), xW = c.gc(16), xE = c.gc(103);
    c.traffic({ pts: [[xW, zE], [xE, zE], [c.r2(xE + 3), c.r2((zE + zW) / 2)], [xE, zW], [xW, zW], [c.r2(xW - 3), c.r2((zE + zW) / 2)]], loop: true, n: 10, speed: 9, lane: 0, kinds: ['cybercar', 'truck', 'cybercar', 'taxi', 'suv', 'cybercar'] });
    /* THE ROAD'S OWN LOOK, every plot: neon kerbs on the band's two edges, lane dashes, four lamps on the shoulders */
    EW.concat(['P04-04']).forEach(id => c.look('road_' + id, id, 0, 0, 0, a => { const end = c.plot[id].end, x0 = (end === 'W' ? 2 : 0) * C, x1 = (end === 'E' ? 10 : 12) * C, L = x1 - x0, xm = (x0 + x1) / 2, cross = id === 'P04-04';
        if (!cross) { a.box(xm, 0, 2 * C + 0.1, L, 0.22, 0.2, null, 0x40e0ff, { glow: 1 }); a.box(xm, 0, 10 * C - 0.1, L, 0.22, 0.2, null, 0xff5fb0, { glow: 1 }); }
        for (let x = x0 + 2; x < x1 - 1; x += 5) { a.quad(x, 0.04, 6 * C, 2.4, 0.28, 0, null, 0xffe040, { flat: true, glow: 1 }); if (!cross || x < 3 * C || x > 9 * C) { a.quad(x, 0.04, 4.5 * C, 2.0, 0.16, 0, null, 0xffffff, { flat: true, glow: 0.8 }); a.quad(x, 0.04, 7.5 * C, 2.0, 0.16, 0, null, 0xffffff, { flat: true, glow: 0.8 }); } }
        if (!cross) [[2.5, 2.5], [8.5, 2.5], [2.5, 9.5], [8.5, 9.5]].forEach(([x, z]) => { if (x * C > x0 && x * C < x1) K.lamp(a, x * C, z * C + (z < 6 ? -0.9 : 0.9), z < 6 ? 0x40e0ff : 0xff5fb0, 5.5); }); }));
    NS.forEach(id => c.look('road_' + id, id, 0, 0, 0, a => { const end = c.plot[id].end, z0 = (end === 'N' ? 2 : 0) * C, z1 = (end === 'S' ? 9 : 12) * C, L = z1 - z0, zm = (z0 + z1) / 2;
        a.box(2 * C + 0.1, 0, zm, 0.2, 0.22, L, null, 0x7fffd0, { glow: 1 }); a.box(10 * C - 0.1, 0, zm, 0.2, 0.22, L, null, 0x7fffd0, { glow: 1 });
        for (let z = z0 + 2; z < z1 - 1; z += 5) a.quad(6 * C, 0.04, z, 0.28, 2.4, 0, null, 0x7fffd0, { flat: true, glow: 1 });
        [[2.5, 3.5], [9.5, 3.5], [2.5, 8.5], [9.5, 8.5]].forEach(([x, z]) => { if (z * C > z0 + 1 && z * C < z1 - 1) K.lamp(a, x * C + (x < 6 ? -0.9 : 0.9), z * C, 0x7fffd0, 5.5); }); }));
    /* THE GANTRIES */
    gantry(c, 'P02-04', 3, 'THE EXCHANGE · 2 HOPS', 'DIAL-UP · END OF ROAD');
    gantry(c, 'P02-04', 9, 'MINIMUM SPEED 1 KB/S', 'THE SLOW LANE · KEEP RIGHT');
    gantry(c, 'P05-04', 9, 'THE FEED · THE STREAM · NORTH', 'THE EXCHANGE · ALL ROUTES');
    gantry(c, 'P06-04', 2, 'POPUP CITY · NEXT EXIT SOUTH', 'THE STREAM · EXIT NORTH');
    gantry(c, 'P07-04', 8, 'THE FORUMS · LAST EXIT', 'YOUR SPEED: 0.3 MB/S · THAT IS SLOW', { bg: '#1a1030' });
    /* DIAL-UP (P01-04): the modem on its pad, the size of a bus; the noise it makes, written down */
    c.look('modem', 'P01-04', 3.5, 1, 0, a => { a.box(0, 0, 0, 9.6, 2.6, 5.6, null, 0xd8d0b8, { glow: 0.2 }); a.box(0, 2.6, 0, 9.2, 0.25, 5.2, null, 0xb8b09a);
        for (let i = 0; i < 8; i++) a.box(-3.6 + i * 1.03, 1.5, 2.83, 0.4, 0.4, 0.06, null, i % 3 === 1 ? 0x30ff70 : i % 3 === 2 ? 0xffb020 : 0xff3030, { glow: 1 });
        a.sign('56K', 0, 0.3, 2.84, 3, 1.0, '#3a3a34', '', 'archivo', { kind: 'over' }); a.cyl(-3.8, 2.85, -1.6, 0.06, 6, STEEL, POST, { seg: 5 }); a.cyl(3.8, 2.85, -1.6, 0.06, 6, STEEL, POST, { seg: 5 });
        K.words(a, 'EEEEE-KRRRRSHHH-BONG-BONG', 0, 4.2, 0, 9.6, 1.0, '#7fffd0'); K.words(a, 'DIAL-UP', 0, 5.6, 0, 6, 1.6, '#ffffff', 'archivo'); });
    K.solid(c, 'P01-04', 2, 0, 4, 1, 4);
    /* THE PAYWALL (P03-04): a toll gate across the road: four booths, the canopy, the sign */
    c.look('paywall', 'P03-04', 6.5, 6, 90, a => { const w = 28;
        [-10.5, -1.75, 1.75, 10.5].forEach(x => { a.box(x, 0, 0, 2.2, 2.7, 3.2, 'urban:MetalPanel2a', 0x8a94a8, { glow: 0.2 }); a.box(x, 1.3, 0, 2.26, 0.9, 2.4, 'urban:GlassWindowSquare1a', 0x9ad8ff, { glow: 0.7 }); });
        a.box(0, 5.6, 0, w, 0.5, 5.2, STEEL, K.DARK); a.box(0, 5.5, 0, w + 0.3, 0.1, 5.5, null, 0xffe040, { glow: 1 });
        [-12.6, -4, 4, 12.6].forEach(x => a.box(x, 0, 0, 0.35, 5.6, 0.35, STEEL, POST));
        [-6.1, 6.1].forEach(x => { a.box(x - 3.2, 0, 1.8, 0.2, 4.2, 0.2, null, 0xffffff, { glow: 0.6 }); a.box(x - 3.2, 4.0, 1.8, 0.5, 0.5, 0.5, null, 0xe01030, { glow: 1 }); });   // the arms, up
        a.sign('PAYWALL', 0, 6.3, 2.7, 12, 2.2, '#111111', '#ffe040', 'archivo'); a.sign('PAYWALL', 0, 6.3, -2.7, 12, 2.2, '#111111', '#ffe040', 'archivo', { ry: 180 });
        a.sign('SUBSCRIBE TO KEEP DRIVING', 0, 8.6, 2.7, 12, 0.9, '#ffffff', '#1a1030', 'dot'); a.sign('YOU HAVE 3 FREE ROADS LEFT THIS MONTH', 0, 8.6, -2.7, 12, 0.9, '#ffffff', '#1a1030', 'dot', { ry: 180 }); });
    K.solid(c, 'P03-04', 6, 2, 6, 2, 6); K.solid(c, 'P03-04', 6, 9, 6, 9, 6); K.solid(c, 'P03-04', 6, 5, 6, 6, 6);
    /* FIBRE (P05-04): hoops of light over the road, one colour after the next */
    c.look('fibre', 'P05-04', 0, 0, 0, a => { [0xff3050, 0xff9a20, 0xffe040, 0x30ff70, 0x40e0ff, 0x6a6aff, 0xb070ff].forEach((col, i) => { const x = (0.8 + i * 1.15) * C;
        a.box(x, 0, 2.2 * C, 0.22, 7.2, 0.22, null, col, { glow: 1 }); a.box(x, 0, 9.8 * C, 0.22, 7.2, 0.22, null, col, { glow: 1 }); a.box(x, 7.2, 6 * C, 0.22, 0.22, 7.6 * C + 0.22, null, col, { glow: 1 }); }); });
    /* BUFFERING (P06-04): the ring going round, hung over the road with nothing holding it; the count under it */
    c.look('buffer', 'P06-04', 7, 6, 0, a => { for (let i = 0; i < 12; i++) { const t = i / 12 * Math.PI * 2, g = 0.15 + 0.85 * (i / 11), v = Math.round(60 + 195 * (i / 11)), col = (v << 16) | (v << 8) | v;
            a.cyl(Math.cos(t) * 5.2, 9.5, Math.sin(t) * 5.2, 0.85, 0.5, null, col, { seg: 10, glow: g }); }
        K.words(a, 'BUFFERING... 99%', 0, 11.2, 0, 10, 1.3, '#ffffff'); });
    /* THE SPEED TEST (P07-04): on the shoulder, the dial */
    c.look('speed', 'P07-04', 3.5, 9.5, 180, a => { a.box(0, 0, 0, 0.4, 3, 0.4, STEEL, POST); a.cyl(0, 3, 0, 2.6, 0.3, STEEL, K.DARK, { seg: 20 });
        K.words(a, 'SPEED TEST', 0, 6.4, 0, 6, 1.0, '#ffe040', 'archivo'); K.words(a, 'PING: YES', 0, 5.4, 0, 4, 0.7, '#7fffd0'); });
    K.solid(c, 'P07-04', 3, 9, 3, 9, 4);
    /* THE LAST MILE (P08-04): the end of the road; the lay-by */
    c.look('lastmile', 'P08-04', 9.6, 6, 270, a => { a.box(-9, 0, 0, 0.3, 4.4, 0.3, STEEL, POST); a.box(9, 0, 0, 0.3, 4.4, 0.3, STEEL, POST); a.box(0, 2.2, 0, 18, 2.2, 0.2, null, 0x1a1030, { glow: 0.3 });
        a.sign('THE LAST MILE · END OF THE HIGHWAY', 0, 3.2, 0.12, 17, 1.0, '#ffe040', '#1a1030', 'way'); a.sign('IT IS ALWAYS THE LAST MILE', 0, 2.4, 0.12, 12, 0.7, '#ffffff', '#1a1030', 'dot');
        for (let i = 0; i < 9; i++) a.box(-8 + i * 2, 0, 0.4, 1.0, 1.0, 0.3, null, i % 2 ? 0xffe040 : 0x111111, { glow: 0.5 }); });
    /* THE ON-RAMP (P04-02): the arch at the north end */
    c.look('onramp', 'P04-02', 6, 2.3, 0, a => { a.box(-13, 0, 0, 0.5, 9, 0.5, STEEL, POST); a.box(13, 0, 0, 0.5, 9, 0.5, STEEL, POST); a.box(0, 7, 0, 26.5, 2.4, 0.4, null, 0x0b5c3a, { glow: 0.35 });
        a.sign('INFORMATION HIGHWAY', 0, 7.9, 0.22, 24, 1.4, '#ffffff', GREEN, 'way'); a.sign('ON-RAMP · MERGE · NO TROLLING', 0, 7.1, 0.22, 20, 0.75, '#ffe040', GREEN, 'way');
        a.sign('INFORMATION HIGHWAY', 0, 7.9, -0.22, 24, 1.4, '#ffffff', GREEN, 'way', { ry: 180 }); a.sign('YOU ARE LEAVING THE HIGHWAY', 0, 7.1, -0.22, 20, 0.75, '#ffe040', GREEN, 'way', { ry: 180 }); });
    K.solid(c, 'P04-02', 2, 2, 2, 2, 9); K.solid(c, 'P04-02', 9, 2, 9, 2, 9);
    /* BANDWIDTH (P04-03): the width, measured; the mail stop on the west shoulder */
    c.look('bandwidth', 'P04-03', 6, 9, 0, a => { a.quad(0, 0.05, 0, 20.4, 0.3, 0, null, 0xffe040, { flat: true, glow: 1 }); a.quad(-10.2, 0.05, 0, 0.3, 2, 0, null, 0xffe040, { flat: true, glow: 1 }); a.quad(10.2, 0.05, 0, 0.3, 2, 0, null, 0xffe040, { flat: true, glow: 1 });
        K.words(a, 'BANDWIDTH: 21 M', 0, 5.2, 0, 12, 1.2, '#ffe040', 'archivo'); });
    /* THE BACKBONE (P04-05): ribs over the road, the spine along their tops */
    c.look('backbone', 'P04-05', 6, 0, 0, a => { for (let i = 0; i < 6; i++) { const z = (1 + i * 2) * C, s = 12.6 - Math.abs(i - 2.5) * 0.5;
            a.box(-s, 0, z, 0.5, 7.5, 0.7, null, 0xe8e4d8, { glow: 0.35 }); a.box(s, 0, z, 0.5, 7.5, 0.7, null, 0xe8e4d8, { glow: 0.35 }); a.box(0, 7.5, z, 2 * s + 0.5, 0.6, 0.7, null, 0xe8e4d8, { glow: 0.35 }); a.box(0, 8.1, z, 2.2, 1.0, 1.6, null, 0xf4f0e4, { glow: 0.4 }); }
        a.box(0, 8.4, 6 * C, 0.5, 0.5, 12 * C, null, 0x7fffd0, { glow: 1 }); K.words(a, 'THE BACKBONE', 0, 9.6, 6 * C, 12, 1.4, '#7fffd0', 'archivo', { ry: 90 }); });
    [1, 3, 5, 7, 9, 11].forEach(ly => { K.solid(c, 'P04-05', 2, ly, 2, ly, 8); K.solid(c, 'P04-05', 9, ly, 9, ly, 8); });
    /* THE DEAD LINK (P04-06): the road ends in the air. The sign, the barrier, the cable hanging off the end */
    c.look('deadlink', 'P04-06', 6, 7.4, 0, a => { for (let i = 0; i < 7; i++) a.box(-9 + i * 3, 0, 0, 2.6, 1.1, 0.4, null, i % 2 ? 0xffe040 : 0x111111, { glow: 0.6 });
        a.box(-6, 0, 0.3, 0.3, 5.4, 0.3, STEEL, POST); a.box(6, 0, 0.3, 0.3, 5.4, 0.3, STEEL, POST);
        a.sign('404 · ROAD NOT FOUND', 0, 3.4, 0.3, 12, 1.8, '#ffffff', '#b01020', 'way'); a.sign('THIS LINK IS DEAD', 0, 2.5, 0.3, 9, 0.8, '#ffe040', '#b01020', 'dot');
        a.sign('404 · ROAD NOT FOUND', 0, 3.4, 0.26, 12, 1.8, '#ffffff', '#b01020', 'way', { ry: 180 }); });
    /* THE EXCHANGE (P04-04, the landmark): the router tower on the crossing's island (two squares by two between the lanes), 34 m: drums of
       ports, the four aerials, the name round its head, a trunk of cables out over each arm of the cross */
    c.look('exchange', 'P04-04', 6, 6, 0, a => { const S = 6.4;
        a.box(0, 0, 0, S + 0.8, 1.0, S + 0.8, STEEL, K.DARK); let y = 1.0;
        [[S, 7.5, 0x22283a], [S - 0.8, 6.5, 0x2a3048], [S - 1.6, 6.0, 0x22283a], [S - 2.4, 5.5, 0x2a3048], [S - 3.2, 5.0, 0x22283a]].forEach(([w, h, col], i) => {
            a.box(0, y, 0, w, h, w, 'urban:MetalPanel2a', col, { glow: 0.2 });
            for (let r = 0; r < Math.floor(h / 1.4); r++) for (let k = 0; k < 6; k++) { const px = -w / 2 + (k + 0.5) * w / 6, py = y + 0.7 + r * 1.4, col2 = [0x30ff70, 0x30ff70, 0xffb020, 0x40e0ff, 0x30ff70, 0xff3050][(k + r * 5 + i) % 6];
                a.box(px, py, w / 2 + 0.03, 0.34, 0.2, 0.05, null, col2, { glow: 1 }); a.box(px, py, -w / 2 - 0.03, 0.34, 0.2, 0.05, null, col2, { glow: 1 }); a.box(w / 2 + 0.03, py, px, 0.05, 0.2, 0.34, null, col2, { glow: 1 }); a.box(-w / 2 - 0.03, py, px, 0.05, 0.2, 0.34, null, col2, { glow: 1 }); }
            y += h; a.box(0, y, 0, w + 0.5, 0.3, w + 0.5, null, 0x7fffd0, { glow: 1 }); y += 0.3; });
        [[1, 1], [-1, 1], [1, -1], [-1, -1]].forEach(([sx, sz]) => { a.cyl(sx * 1.1, y, sz * 1.1, 0.09, 6, STEEL, POST, { seg: 5 }); a.dome(sx * 1.1, y + 6, sz * 1.1, 0.2, 0.2, null, 0xff3050, { glow: 1, seg: 6, rings: 2 }); });
        [0, 180].forEach(ry => a.sign('THE EXCHANGE', 0, 22.6, ry ? -2.25 : 2.25, 4.2, 1.1, '#ffffff', '#0b5c3a', 'way', { ry })); a.sign('THE EXCHANGE', 2.25, 22.6, 0, 4.2, 1.1, '#ffffff', '#0b5c3a', 'way', { ry: 90 }); a.sign('THE EXCHANGE', -2.25, 22.6, 0, 4.2, 1.1, '#ffffff', '#0b5c3a', 'way', { ry: 270 });
        /* the trunks: four cables a side out over each arm, 10 m up, dropping to the road's kerb 19 m out */
        [0x40e0ff, 0xff5fb0, 0xffe040, 0x30ff70].forEach((col, i) => { const o = -0.6 + i * 0.4;
            K.cable(a, [[S / 2, 10 + i * 0.3, o], [19.5, 10 + i * 0.3, o]], col); K.cable(a, [[-S / 2, 10 + i * 0.3, o], [-19.5, 10 + i * 0.3, o]], col); K.cable(a, [[o, 10 + i * 0.3, S / 2], [o, 10 + i * 0.3, 19.5]], col); K.cable(a, [[o, 10 + i * 0.3, -S / 2], [o, 10 + i * 0.3, -19.5]], col); }); });
    K.solid(c, 'P04-04', 5, 5, 6, 6, 30);
    /* the crossing's four corner pads: a holo board on each, naming what lies that way */
    [[1, 1, 'THE SERVER FARM · THE INBOX', '#3fa0ff', 315], [10.9, 1, 'THE FEED · THE STREAM', '#ff5fb0', 45], [1, 10.9, 'THE MOTHERBOARD · THE DARK WEB', '#30c060', 225], [10.9, 10.9, 'POPUP CITY · THE FORUMS', '#40e0ff', 135]].forEach(([x, y, w, col, rot], i) =>
        c.look('corner' + i, 'P04-04', x, y, rot, a => K.holo(a, 0, 0, 3.2, 8.5, 1.3, w, '#ffffff', col, 'way', { col: parseInt(col.slice(1), 16) })));
};
exports.dress = c => {
    /* the shoulders: barrels and cones at the works, a few benches nobody waits on, the hydrants of a road in the sky */
    [['P02-04', 6, 2], ['P02-04', 7, 2], ['P05-04', 2, 9], ['P06-04', 9, 2]].forEach(([id, x, y]) => c.P('traffic_barrel', id, x, y));
    [['P04-06', 4, 7], ['P04-06', 7, 7], ['P04-06', 2, 6], ['P04-06', 9, 6]].forEach(([id, x, y]) => c.dec('traffic_cone', id, x, y));
    c.P('city_bench', 'P06-04', 6, 9, { face: 0 }); c.P('city_bench', 'P07-04', 6, 2, { face: 180 }); c.P('bus_stop_sign', 'P04-03', 2, 3, { face: 90 });
    c.P('vending_machine', 'P08-04', 8, 10, { face: 0 }); c.P('city_bench', 'P08-04', 7, 10, { face: 0 }); c.P('public_phone', 'P08-04', 9, 10, { face: 0 });
    c.P('utility_box', 'P01-04', 8, 2, { face: 180 }); c.P('utility_box', 'P05-04', 10, 9, { face: 0 }); c.P('fire_hydrant', 'P03-04', 2, 9); c.P('fire_hydrant', 'P07-04', 10, 2);
    c.P('lattice_pylon', 'P04-04', 1, 1); c.P('lattice_pylon', 'P04-04', 10, 10);
};
exports.people = c => {
    c.native('honda civic', 'P02-04', 5, 9, 90); c.native('police officer', 'P03-04', 8, 2, 180); c.native('delivery boy', 'P04-03', 2, 8, 90);
    c.native('time cop', 'P07-04', 5, 9, 0); c.native('robot', 'P04-04', 10, 1, 225); c.native('droid', 'P05-04', 4, 2, 180); c.native('skater', 'P04-05', 2, 6, 90); c.native('glitch', 'P04-06', 9, 5, 180);
    c.native('hippie', 'P08-04', 8, 11, 0); c.native('astronaut', 'P01-04', 9, 9, 0);
};
