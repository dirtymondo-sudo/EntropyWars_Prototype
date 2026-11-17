/* THE INTERNET · D · THE DARK WEB (9 plots: columns 0-2, rows 3-5). One thread a file; the tool is bake-internet.js, the rules
   docs/notes/areas-complexes.md "THE INTERNET ON PLOTS".
   THE IDEA (mondo's OK 11-17: "a lower, darker level underneath"): UNDERNEATH: the tiles sink from level 7 at the Onion Gate (the steps down
   from the Forums' Off-Topic) to level 1, 12 m under the Server Farm's floor, which hangs over them to the north. Ragged black tiles, red
   walks, red air. The Onion Gate (layers and layers), the Black Market and the Bazaar (stalls), the Hacker Den, the Forgotten Servers, the
   Crawlers (a web, the literal kind), Page Not Found, the Mirror Sites (the same stall three times). LANDMARK: THE BOTTOM (label mine): the
   lowest tile in the Internet, a ring of dead televisions round nothing.
   STANDS TODAY (the first build, One World 4.4): every plot's pieces and people.
   NOT YET: the televisions' static moving, a sound, the way down further. */
'use strict';
const STEEL = 'gunmetal_2', RED = 0xff3050;
const solid = (c, id, lx0, ly0, lx1, ly1, h) => { const p = c.plot[id], b = c.base(id), X0 = c.gx(p.sx + lx0), X1 = c.gx(p.sx + lx1 + 1), Z0 = c.gx(p.sy + ly0), Z1 = c.gx(p.sy + ly1 + 1);
    c.claim(id, lx0, ly0, lx1, ly1);
    [[X0, Z0, X1, Z0], [X0, Z1, X1, Z1], [X0, Z0, X0, Z1], [X1, Z0, X1, Z1]].forEach(([x0, z0, x1, z1]) => c.feat({ k: 'wall', absY: true, x0, z0, x1, z1, t: 0.3, h: h || 4, y: b, ghost: true, rail: false })); };
/* a stall: four poles, a canopy, a counter (facing +z of its sheet) */
function stall(a, canopy, words) { [[-1.6, -1.2], [1.6, -1.2], [-1.6, 1.2], [1.6, 1.2]].forEach(([x, z]) => a.box(x, 0, z, 0.12, 2.6, 0.12, STEEL, 0x30343a));
    a.box(0, 2.6, 0, 3.6, 0.12, 2.8, null, canopy, { glow: 0.35 }); a.box(0, 0, 1.0, 3.2, 1.0, 0.6, 'wood', 0x3a2a20);
    if (words) a.sign(words, 0, 2.75, 1.42, 3.4, 0.5, '#ffffff', '#1a0608', 'stencil'); }
exports.build = c => { const C = c.C;
    /* THE ONION GATE (P02-04): arch inside arch inside arch over the walk in, each smaller, each a different purple */
    c.look('onion', 'P02-04', 9.2, 6, 90, a => { [[0, 7.4, 4.6, 0x9a4cff], [-1.6, 6.4, 4.0, 0x7a3ad8], [-3.2, 5.4, 3.4, 0x5a2aa8], [-4.8, 4.4, 2.8, 0x3a1a78]].forEach(([z, h, hw, col]) => {
        a.box(-hw, 0, z, 0.6, h, 0.6, null, col, { glow: 0.7 }); a.box(hw, 0, z, 0.6, h, 0.6, null, col, { glow: 0.7 }); a.box(0, h, z, 2 * hw + 0.6, 0.6, 0.6, null, col, { glow: 0.7 }); });
        a.sign('YOU ARE LEAVING THE INDEXED WEB', 0, 8.2, 0.3, 8, 0.7, '#ffffff', '#2a0a3a', 'stencil'); });
    /* THE HACKER DEN (P01-05): a wall of green code over the desks */
    c.look('code', 'P01-05', 6, 8.6, 180, a => { a.box(0, 0, 0, 10, 6, 0.3, STEEL, 0x050805);
        for (let i = 0; i < 18; i++) { const x = -4.5 + i * 0.53, h = 1.5 + ((i * 37) % 7) * 0.55; a.box(x, 6 - h - 0.2, 0.17, 0.12, h, 0.02, null, 0x30ff70, { glow: 0.9 }); }
        a.sign('ACCESS GRANTED', 0, 1.0, 0.2, 6, 0.9, '#30ff70', '#020602', 'dot'); });
    solid(c, 'P01-05', 4, 8, 8, 8, 6);
    /* THE CRAWLERS (P01-03): a web strung between four posts, glowing threads */
    c.look('web', 'P01-03', 3.2, 3.2, 0, a => { const R = 4.2; [[-R, -R], [R, -R], [-R, R], [R, R]].forEach(([x, z]) => a.box(x, 0, z, 0.25, 6, 0.25, STEEL, 0x30343a));
        for (let k = 0; k < 8; k++) { const t = k / 8 * Math.PI * 2; a.box(Math.cos(t) * 2.2, 4.2 + Math.sin(t) * 1.2, 0, 4.6, 0.05, 0.05, null, 0xd0d8e0, { glow: 0.9, ry: k * 22.5 }); }
        [1.0, 2.0, 3.0].forEach(r => { for (let k = 0; k < 8; k++) { const t = (k + 0.5) / 8 * Math.PI * 2; a.box(Math.cos(t) * r, 4.2, Math.sin(t) * r, r * 0.8, 0.05, 0.05, null, 0xd0d8e0, { glow: 0.9, ry: -(k + 0.5) * 45 + 90 }); } }); });
    /* PAGE NOT FOUND (P00-03): the number, standing */
    c.look('404', 'P00-03', 6, 4.4, 0, a => { a.sign('404', 0, 0.2, 0, 6, 3.2, '#ff3050', '', 'archivo', { kind: 'over' }); a.sign('404', 0, 0.2, -0.05, 6, 3.2, '#ff3050', '', 'archivo', { kind: 'over', ry: 180 });
        a.sign('PAGE NOT FOUND', 0, 3.6, 0, 6, 0.8, '#ffffff', '', 'dot', { kind: 'over' }); a.sign('PAGE NOT FOUND', 0, 3.6, -0.05, 6, 0.8, '#ffffff', '', 'dot', { kind: 'over', ry: 180 }); });
    /* THE MIRROR SITES (P02-03): the same stall three times */
    [[3, 4], [6, 8.5], [9, 4]].forEach(([x, y], i) => c.look('mirror' + i, 'P02-03', x, y, 0, a => stall(a, 0x7a1020, 'THE REAL ONE')));
    /* THE BLACK MARKET (P02-05) + THE BAZAAR (P01-04): stalls */
    [[3, 3, 0x501020, 'NO REFUNDS'], [9, 3, 0x203050, 'NO QUESTIONS'], [3, 9, 0x305020, 'CASH ONLY']].forEach(([x, y, col, w], i) => c.look('market' + i, 'P02-05', x, y, y > 6 ? 180 : 0, a => stall(a, col, w)));
    [[3, 3, 0x6a3a10, 'FRESH LEAKS'], [9, 9, 0x3a1060, 'USED PASSWORDS']].forEach(([x, y, col, w], i) => c.look('bazaar' + i, 'P01-04', x, y, y > 6 ? 180 : 0, a => stall(a, col, w)));
    /* THE BOTTOM (P00-05, the landmark): the sign over the ring of dead televisions */
    c.look('bottom', 'P00-05', 6, 6, 0, a => { a.box(0, 0, 0, 6, 0.08, 6, null, RED, { glow: 0.6 }); a.box(-3.4, 0, -4.6, 0.25, 6.4, 0.25, STEEL, 0x30343a); a.box(3.4, 0, -4.6, 0.25, 6.4, 0.25, STEEL, 0x30343a);
        a.sign('YOU HAVE REACHED THE BOTTOM', 0, 5.4, -4.5, 7.2, 0.9, '#ff3050', '#0a0204', 'stencil'); a.sign('THERE IS NOTHING DOWN HERE', 0, 5.4, -4.7, 7.2, 0.9, '#ff3050', '#0a0204', 'stencil', { ry: 180 }); });
};
exports.dress = c => {
    /* the Bottom: the dead televisions, facing in */
    for (let i = 0; i < 8; i++) { const t = i / 8 * Math.PI * 2, x = Math.round(6 + Math.cos(t) * 3.2), y = Math.round(6 + Math.sin(t) * 3.2); if (c.free('P00-05', x, y)) c.P('cursed_tv_set', 'P00-05', x, y, { face: Math.round(270 - t * 180 / Math.PI + 360) % 360 }); }
    /* the Black Market + the Bazaar: what is sold */
    c.put('money_sacks', 'P02-05', 2, 5); c.put('floor_safe', 'P02-05', 9, 5); c.put('cash_cart', 'P02-05', 8, 9); c.dec('money_counter', 'P02-05', 3, 4);
    c.put('cardboard_boxes', 'P01-04', 2, 8); c.put('cardboard_boxes', 'P01-04', 9, 3); c.dec('vhs_tape', 'P01-04', 3, 4); c.put('string_lights', 'P01-04', 8, 7);
    /* the Hacker Den */
    [[3, 4], [8, 4]].forEach(([x, y]) => { c.put('steel_table', 'P01-05', x, y); c.dec('crt_terminal', 'P01-05', x, y, { y: 0.78 }); c.dec('lava_lamp', 'P01-05', x + 0.3, y, { y: 0.78 }); });
    c.put('monitor_stack', 'P01-05', 2, 7, { face: 90 }); c.put('computer_chair_grey', 'P01-05', 3, 3); c.put('computer_chair_blue', 'P01-05', 8, 3);
    /* the Forgotten Servers: still on, nobody paying */
    [[2, 3], [3, 3], [8, 3], [9, 3], [2, 8], [3, 8], [8, 8]].forEach(([x, y]) => { if (c.free('P00-04', x, y)) c.P('server_rack', 'P00-04', x, y, { face: y < 6 ? 180 : 0 }); });
    c.dec('spider', 'P00-04', 3, 4); c.dec('spider', 'P00-04', 8, 7);
    /* the Crawlers' spiders */
    [[2, 2], [4, 3], [8, 4], [9, 8], [3, 8]].forEach(([x, y]) => c.dec('spider', 'P01-03', x, y));
    /* the Onion Gate's lamps */
    c.put('cage_lamp', 'P02-04', 7, 3); c.put('cage_lamp', 'P02-04', 7, 8);
};
exports.people = c => {
    c.native('men in black', 'P02-04', 6, 3, 90); c.native('gangster', 'P02-05', 6, 3, 180); c.native('black goo', 'P00-05', 6, 6, 0);
    c.native('spy', 'P01-05', 7, 7, 180); c.native('ghoul', 'P01-04', 6, 9, 0); c.native('skeleton', 'P00-04', 5, 8, 90);
    c.native('mantid', 'P01-03', 7, 8, 270); c.native('shadow entity', 'P00-03', 6, 7, 0); c.native('voidweaver', 'P02-03', 6, 4, 180);
    c.native('cursed tv', 'P00-05', 3, 8, 45);
};
/* the red air of the Dark Web */
exports.airZones = c => [{ sx0: 0, sy0: 36, sx1: 36, sy1: 72, kind: 'motes', n: 160, color: 0xff3050 }];
