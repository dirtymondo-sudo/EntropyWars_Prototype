#!/usr/bin/env node
/* THE BAYSIDE MALL, THE PLAN'S DRAWINGS (2026-11-20). Not a game file. `node docs/plans/mall/draw-plan.js` writes four SVGs beside itself
   (and PNGs when playwright is installed): 01_mismatch, 02_site, 03_floors, 04_elevations. Every number is room metres of
   `site_prebuilt_downtown_streets` (x east, z south). Change THE BOX here first, then MALL_PLAN.md. */
'use strict';
const fs = require('fs'), path = require('path');
const OUT = __dirname;

/* ── THE BOX (the one building) ── */
const M = {
    x0: 171.5, x1: 206.5, z0: 3.5, z1: 80.5,          // the body: 35 x 77 m = 10 x 22 squares
    cx: 189, axis: 21,                                // the long concourse's line; the pier's line
    con: 7,                                           // a concourse is two squares wide
    f1: 5.25, eave: 10.5, vault: 13.5, dome: 19.0,    // upper floor, parapet, the vault's crown, the dome's top
    atr: [178.5, 10.5, 199.5, 31.5],                  // the atrium under the dome (21 x 21)
    terr: [206.5, 31.5, 213.5, 66.5],                 // the sea terrace at 5.25 m, a colonnade under it
    fore: [206.5, 3.5, 220.5, 80.5],                  // the sea front: paving between the mall and the coast road's pavement
};
const OLD_OUT = [175, 7, 203, 35], OLD_IN = [96, 64];
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const C = { ink: '#1c2330', sand: '#f3dca8', cream: '#fff3da', coral: '#ff9d86', terra: '#d9704a', aqua: '#8fdcec', glass: '#2c4a63', sea: '#4aa8d8', beach: '#f0dfb0', road: '#6b6f76', pave: '#c9c6bd', plank: '#b98a55', grass: '#9ccf7a', red: '#e5484d', mint: '#a8ecd6', grey: '#b9bcc0', lilac: '#d9c8f5', lemon: '#ffe27a', pink: '#ffc0d6' };

function svg(w, h, body, title) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" font-family="Verdana, Arial, sans-serif">
<rect width="${w}" height="${h}" fill="#fbfaf6"/><text x="20" y="34" font-size="22" font-weight="bold" fill="${C.ink}">${esc(title)}</text>
${body}</svg>`;
}
const R = (x, y, w, h, fill, o) => `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" fill="${fill}" stroke="${(o && o.s) || C.ink}" stroke-width="${(o && o.sw) != null ? o.sw : 1}"${o && o.dash ? ' stroke-dasharray="' + o.dash + '"' : ''}${o && o.op ? ' fill-opacity="' + o.op + '"' : ''}${o && o.rx ? ' rx="' + o.rx + '"' : ''}/>`;
const T = (x, y, s, o) => `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-size="${(o && o.fs) || 12}" fill="${(o && o.c) || C.ink}" text-anchor="${(o && o.a) || 'middle'}"${o && o.b ? ' font-weight="bold"' : ''}${o && o.rot ? ` transform="rotate(${o.rot} ${x.toFixed(1)} ${y.toFixed(1)})"` : ''}>${esc(s)}</text>`;
const L = (x0, y0, x1, y1, c, w, dash) => `<line x1="${x0.toFixed(1)}" y1="${y0.toFixed(1)}" x2="${x1.toFixed(1)}" y2="${y1.toFixed(1)}" stroke="${c || C.ink}" stroke-width="${w || 1}"${dash ? ' stroke-dasharray="' + dash + '"' : ''}/>`;
const CIR = (x, y, r, fill, o) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="${fill}" stroke="${(o && o.s) || C.ink}" stroke-width="${(o && o.sw) != null ? o.sw : 1}"${o && o.op ? ' fill-opacity="' + o.op + '"' : ''}/>`;
const DOOR = (x, y, label, o) => `<g>${CIR(x, y, 7, C.red, { s: '#fff', sw: 2 })}${label ? T(x + ((o && o.dx) || 0), y + ((o && o.dy) != null ? o.dy : -12), label, { fs: 11, c: C.red, b: true, a: (o && o.a) || 'middle' }) : ''}</g>`;

/* ── 01 · THE MISMATCH: today's outside against today's inside, one scale ── */
(function () {
    const s = 6, ox = 40, oy = 90; let b = '';
    b += T(ox, oy - 14, 'TODAY, at one scale (1 square of the grid below = 3.5 m)', { a: 'start', fs: 14 });
    for (let i = 0; i <= 28; i++) b += L(ox + i * 3.5 * s, oy, ox + i * 3.5 * s, oy + 64 * s, '#e4e0d6', 1);
    for (let j = 0; j <= 18; j++) b += L(ox, oy + j * 3.5 * s, ox + 98 * s, oy + j * 3.5 * s, '#e4e0d6', 1);
    b += R(ox, oy, 96 * s, 64 * s, '#ecebe6', { sw: 2 });
    b += T(ox + 48 * s, oy + 20, 'THE INSIDE: room site_prebuilt_downtown_mall · 96 x 64 m · 12 m high', { fs: 15, b: true });
    b += T(ox + 48 * s, oy + 40, 'white 1960s terminal: atrium + fountain, upper galleries at 4.6 m, catwalk at 8.4 m, food court, arcade, clock tower', { fs: 12 });
    b += T(ox + 48 * s, oy + 64 * s - 12, 'floor 6,144 m² · one door to the city (south wall) · one door to the supply closet (north wall)', { fs: 12 });
    const bx = ox + 34 * s, by = oy + 18 * s;
    b += R(bx, by, 28 * s, 28 * s, C.sand, { sw: 3, s: C.red });
    b += R(bx + 9.8 * s, by, 8.4 * s, 28 * s, C.aqua, { sw: 1 }) + R(bx, by + 9.8 * s, 28 * s, 8.4 * s, C.aqua, { sw: 1 }) + CIR(bx + 14 * s, by + 14 * s, 5.2 * s, C.aqua);
    b += T(bx + 14 * s, by + 5 * s, 'THE OUTSIDE', { fs: 15, b: true, c: C.red }) + T(bx + 14 * s, by + 5 * s + 18, 'building P10-10-B1', { fs: 12 }) + T(bx + 14 * s, by + 23 * s, '28 x 28 m · 10.5 m to the eaves', { fs: 12 }) + T(bx + 14 * s, by + 23 * s + 16, 'floor 784 m² · one door (west)', { fs: 12 });
    b += T(ox, oy + 64 * s + 30, 'The inside is 3.4 times as long and 2.3 times as wide as the building it is said to be in: 7.8 times the floor.', { a: 'start', fs: 15, b: true });
    b += T(ox, oy + 64 * s + 52, 'Outside: pastel Miami stucco, terracotta hip roofs, a glass cross vault and a dome. Inside: a flat white ceiling with three small skylights, no vault, no dome.', { a: 'start', fs: 13 });
    b += T(ox, oy + 64 * s + 72, 'Outside the door faces west. Inside the same door is on the south wall. The outside has windows on four sides; the inside has eight portholes.', { a: 'start', fs: 13 });
    fs.writeFileSync(path.join(OUT, '01_mismatch.svg'), svg(96 * s + 80, oy + 64 * s + 95, b, 'THE BAYSIDE MALL · 1 · THE MISMATCH TODAY'));
})();

/* ── 02 · THE SITE: where the one building stands ── */
(function () {
    const s = 5, X0 = 110, Z0 = -50, X1 = 330, Z1 = 96, ox = 30, oy = 60; const px = x => ox + (x - X0) * s, pz = z => oy + (z - Z0) * s; let b = '';
    const box = (a, fill, o) => R(px(a[0]), pz(a[1]), (a[2] - a[0]) * s, (a[3] - a[1]) * s, fill, o);
    b += box([X0, Z0, X1, Z1], C.pave, { sw: 0 });
    b += box([259, Z0, X1, Z1], C.beach, { sw: 0 });
    b += `<path d="M ${px(292)} ${pz(Z0)} Q ${px(300)} ${pz(0)} ${px(295)} ${pz(21)} Q ${px(291)} ${pz(60)} ${px(297)} ${pz(Z1)} L ${px(X1)} ${pz(Z1)} L ${px(X1)} ${pz(Z0)} Z" fill="${C.sea}"/>`;
    b += box([224, Z0, 238, Z1], C.road, { sw: 0 }) + box([241.5, Z0, 252, Z1], C.plank, { sw: 0, op: 0.55 }) + box([252, Z0, 259, Z1], C.plank, { sw: 0 });
    b += L(px(259), pz(Z0), px(259), pz(Z1), C.ink, 3);
    for (let z = Z0 + 6; z < Z1; z += 10.5) b += CIR(px(231), pz(z), 4, C.grass, { sw: 0.5 });
    b += box([258.7, 17.5, 297.5, 24.5], C.plank) + box([297.5, 10.5, 318.5, 31.5], C.plank) + CIR(px(308), pz(21), 4.2 * s, C.mint);
    /* the plots */
    [[126, 0, 168, 42, 'P09-10 CORDON PLAZA'], [168, 0, 210, 42, 'P10-10'], [168, 42, 210, 84, 'P10-11 MEDICAL STAGING'], [168, -42, 210, 0, 'P10-09 SECURITY OFFICE'], [126, -42, 168, 0, 'P09-09 FOOD HALL'], [126, 42, 168, 84, 'P09-11 PARKING'], [210, 0, 252, 42, ''], [210, 42, 252, 84, ''], [210, -42, 252, 0, '']].forEach(p => {
        b += box(p, 'none', { dash: '6 4', s: '#7a7f88' }); if (p[4]) b += T(px(p[0]) + 6, pz(p[1]) + 14, p[4], { a: 'start', fs: 10, c: '#5a5f68' }); });
    b += CIR(px(147), pz(10.5), 4.3 * s, C.aqua) + T(px(147), pz(10.5) + 4, 'bandstand', { fs: 9 });
    b += R(px(119.5), pz(14), 2.4 * s, 14 * s, C.pink) + T(px(121), pz(11), 'the mall arch', { fs: 10, a: 'start' });
    /* the axis */
    b += L(px(112), pz(21), px(322), pz(21), C.red, 1.5, '10 5') + T(px(275), pz(21) - 30, 'ONE AXIS: arch → plaza → west doors → dome → sea doors → pier', { fs: 12, c: C.red, b: true });
    /* the sea front + the terrace + the body */
    b += box(M.fore, '#efe6cf', { s: '#9a8f70' }) + T(px(213.5), pz(74), 'THE SEA FRONT', { fs: 10, rot: -90 });
    b += box([M.x0, M.z0, M.x1, M.z1], C.sand, { sw: 3 });
    b += box([M.cx - 3.5, M.z0, M.cx + 3.5, M.z1], C.aqua, { sw: 1 }) + box([M.x0, M.axis - 3.5, M.x1, M.axis + 3.5], C.aqua, { sw: 1 }) + CIR(px(M.cx), pz(M.axis), 7.5 * s, C.aqua, { sw: 2 });
    b += box(M.terr, C.coral, { sw: 1.5 }) + T(px(210), pz(49), 'SEA TERRACE', { fs: 10, rot: -90 });
    b += box(OLD_OUT, 'none', { s: C.red, sw: 2, dash: '5 4' }) + T(px(176.5), pz(34), 'today: 28 x 28', { fs: 10, c: C.red, a: 'start' });
    b += T(px(M.cx), pz(52), 'THE BAYSIDE MALL', { fs: 14, b: true, rot: -90 }) + T(px(180), pz(60), '35 x 77 m', { fs: 12, rot: -90 });
    b += DOOR(px(M.x0), pz(21), 'W · MAIN', { dy: -14 }) + DOOR(px(M.x1), pz(21), 'E · SEA', { dy: -14 }) + DOOR(px(M.cx), pz(M.z1), 'S', { dy: 22 }) + DOOR(px(199.5), pz(M.z0), 'N · STAFF', { dy: -12 }) + DOOR(px(M.x1), pz(59.5), 'E2', { dx: 0, dy: 22 });
    b += T(px(231), pz(-44), 'COAST ROAD', { fs: 11, c: '#fff' }) + T(px(255.5), pz(-44), 'BOARDWALK', { fs: 10, rot: -90 }) + T(px(276), pz(70), 'BAYSIDE SAND', { fs: 11 }) + T(px(315), pz(-30), 'SEA', { fs: 13, c: '#fff', b: true }) + T(px(280), pz(21) + 4, 'THE PIER', { fs: 11, b: true });
    b += T(px(246.7), pz(88), 'kept clear', { fs: 9 });
    b += L(px(120), pz(92), px(120 + 35), pz(92), C.ink, 3) + T(px(137.5), pz(92) - 6, '35 m', { fs: 11 });
    b += T(px(322), pz(-44), 'N ↑', { fs: 14, b: true });
    fs.writeFileSync(path.join(OUT, '02_site.svg'), svg((X1 - X0) * s + 60, (Z1 - Z0) * s + 80, b, 'THE BAYSIDE MALL · 2 · THE SITE (north is up, the sea is right)'));
})();

/* ── 03 · THE FLOORS: ground + upper, the same box ── */
(function () {
    const s = 9, pad = 40, W = (M.terr[2] + 10.5 - M.x0 + 7) * s, H = (M.z1 - M.z0 + 14) * s; let b = '';
    const plan = (ox, oy, upper) => {
        const px = x => ox + (x - M.x0 + 7) * s, pz = z => oy + (z - M.z0 + 7) * s; let g = '';
        const box = (a, fill, o) => R(px(a[0]), pz(a[1]), (a[2] - a[0]) * s, (a[3] - a[1]) * s, fill, o);
        const lab = (a, t, o) => { const ls = [].concat(t); return ls.map((q, i) => T(px((a[0] + a[2]) / 2), pz((a[1] + a[3]) / 2) + 4 + (i - (ls.length - 1) / 2) * 13, q, Object.assign({ fs: 10 }, o))).join(''); };
        for (let x = M.x0 - 7; x <= M.terr[2] + 10.5; x += 3.5) g += L(px(x), pz(M.z0 - 7), px(x), pz(M.z1 + 7), '#e8e4da', 1);
        for (let z = M.z0 - 7; z <= M.z1 + 7; z += 3.5) g += L(px(M.x0 - 7), pz(z), px(M.terr[2] + 10.5), pz(z), '#e8e4da', 1);
        g += box([M.x0, M.z0, M.x1, M.z1], '#f7f3e8', { sw: 4 });
        const W1 = M.x0, W2 = M.cx - 3.5, E1 = M.cx + 3.5, E2 = M.x1;
        if (!upper) {
            /* ground */
            g += box([W1, 3.5, W2, 17.5], C.lilac) + lab([W1, 3.5, W2, 17.5], ['THE ARCADE', 'slot cabinets, tokens']);
            g += box([E1, 3.5, E2, 14], C.grey) + lab([E1, 3.5, E2, 14], ['SERVICE', 'loading bay · bins · staff']);
            g += box([E1, 14, E2, 17.5], C.cream) + lab([E1, 14, E2, 17.5], 'kiosk units');
            [[W1, 24.5, 31.5, 'DOORS R US'], [W1, 31.5, 38.5, 'KEYS & KEYS'], [W1, 38.5, 45.5, 'TAPE WORLD'], [W1, 45.5, 52.5, 'PHONES'], [W1, 52.5, 59.5, 'RECORDS'], [W1, 59.5, 66.5, 'SHOES']].forEach(q => { g += box([q[0], q[1], W2, q[2]], C.cream) + lab([q[0], q[1], W2, q[2]], q[3]); });
            [[24.5, 31.5, 'JUICE BAR', 'opens to the sea front too'], [31.5, 38.5, 'PRETZELS', 'under the terrace'], [38.5, 45.5, 'THE GOO SHOP', 'under the terrace'], [45.5, 52.5, 'SALT & LAMP', 'under the terrace'], [52.5, 56, 'E2 hall', ''], [56, 66.5, 'OCCAM’S', 'under the terrace']].forEach(q => { g += box([E1, q[0], E2, q[1]], q[2] === 'E2 hall' ? '#f7f3e8' : C.cream) + lab([E1, q[0], E2, q[1]], q[3] ? [q[2], q[3]] : q[2]); });
            g += box([W1, 66.5, W2, 80.5], C.lemon) + box([E1, 66.5, E2, 80.5], C.lemon) + lab([W1, 66.5, W2, 80.5], ['DEPARTMENT STORE', '(ground)']) + lab([E1, 66.5, E2, 80.5], ['DEPARTMENT STORE', 'own stair up']);
            g += box(M.atr, '#fdfbf4', { dash: '6 4', s: C.glass, sw: 2 }) + CIR(px(M.cx), pz(M.axis), 3 * s, C.aqua) + T(px(M.cx), pz(M.axis) + 4, 'fountain', { fs: 9 });
            g += CIR(px(M.cx - 7), pz(M.axis), 1.75 * s, C.terra) + T(px(M.cx - 7), pz(M.axis) - 20, 'clock tower', { fs: 9 });
            g += T(px(M.cx), pz(13), 'THE ATRIUM', { fs: 11, b: true }) + T(px(M.cx), pz(13) + 13, 'open to the dome', { fs: 9 });
            g += box([180.25, 24.5, 182, 31.5], C.coral) + box([196, 24.5, 197.75, 31.5], C.coral) + T(px(181.1), pz(33.5), 'esc. up', { fs: 8 }) + T(px(196.9), pz(33.5), 'esc. up', { fs: 8 });
            g += box([M.cx - 3.5, 42, M.cx + 3.5, 45.5], C.grey, { op: 0.7 }) + T(px(M.cx), pz(44) + 3, 'fun box', { fs: 8 });
            g += box([M.cx - 2.6, 59.5, M.cx + 2.6, 66.5], C.coral, { op: 0.8 }) + T(px(M.cx), pz(63) + 3, 'stair up', { fs: 8 });
            g += T(px(M.cx), pz(52), 'THE LONG CONCOURSE', { fs: 10, rot: -90, b: true });
            g += T(px(175), pz(21) + 4, 'THE CROSS', { fs: 9, a: 'start' }) + T(px(203), pz(21) + 4, 'CONCOURSE', { fs: 9, a: 'end' });
            g += box([186.4, 7, 188.2, 9], '#444', { sw: 0 }) + T(px(185), pz(6), 'STAFF ONLY: the closet stair down (the time machine)', { fs: 8, a: 'start' });
            /* outside */
            g += box(M.fore, 'none', { dash: '4 4', s: '#9a8f70' });
            for (let z = 33.25; z < 66.5; z += 3.5) g += CIR(px(213.2), pz(z), 2.6, '#fff');
            g += T(px(210), pz(49), 'colonnade under the terrace', { fs: 9, rot: -90 });
            g += box([207, 66.5, 213.5, 70], C.coral, { op: 0.8 }) + T(px(210.2), pz(73), 'stair up to the terrace', { fs: 8 });
            g += DOOR(px(M.x0), pz(21), 'W · MAIN DOORS (Cordon plaza)', { a: 'end', dx: -10, dy: 4 }) + DOOR(px(M.x1), pz(21), 'E · SEA DOORS (the pier)', { a: 'start', dx: 10, dy: 4 }) + DOOR(px(M.cx), pz(M.z1), 'S · DEPARTMENT STORE DOORS', { dy: 22 }) + DOOR(px(199.5), pz(M.z0), 'N · STAFF DOOR (needs the pass)', { dy: -12 }) + DOOR(px(M.x1), pz(54.25), 'E2', { a: 'start', dx: 10, dy: 4 });
            g += T(px(M.x0 - 6.5), pz(M.z0 - 4), 'GROUND FLOOR · 0 m', { a: 'start', fs: 15, b: true });
        } else {
            g += box([W1, 3.5, W2, 17.5], C.lilac) + lab([W1, 3.5, W2, 17.5], ['ARCADE UPSTAIRS', 'prize counter']);
            g += box([E1, 3.5, E2, 17.5], C.grey) + lab([E1, 3.5, E2, 17.5], ['MALL OFFICE · SECURITY', 'the one camera']);
            [[24.5, 31.5, 'CUBE STOP'], [31.5, 38.5, 'THE LIMITED FORM'], [38.5, 45.5, 'GLASSES IN AN HOUR'], [45.5, 52.5, 'OUT OF BUSINESS'], [52.5, 59.5, 'HAZARD PAY LOANS'], [59.5, 66.5, 'FORM 365 EXPRESS']].forEach(q => { g += box([W1, q[0], W2 - 3.5, q[1]], C.cream) + lab([W1, q[0], W2 - 3.5, q[1]], q[2]); });
            g += box([E1 + 3.5, 24.5, E2, 31.5], C.cream) + lab([E1 + 3.5, 24.5, E2, 31.5], 'NOTHING HAPPENED');
            g += box([E1 + 3.5, 31.5, E2, 66.5], C.pink) + lab([E1 + 3.5, 31.5, E2, 66.5], ['THE FOOD COURT', 'counters on the north', 'and south walls,', 'tables by the glass', '', 'the whole east wall', 'is glass doors', 'to the terrace']);
            g += box([W1, 66.5, E2, 80.5], C.lemon) + lab([W1, 66.5, E2, 80.5], ['DEPARTMENT STORE (upper)', 'windows south and east']);
            /* the voids */
            g += box([M.cx - 3.5, 31.5, M.cx + 3.5, 66.5], '#dfeef2', { dash: '5 4', s: C.glass }) + box(M.atr, '#dfeef2', { dash: '5 4', s: C.glass });
            g += T(px(M.cx), pz(21) + 4, 'open to below', { fs: 10 }) + T(px(M.cx), pz(15), 'THE DOME is over this', { fs: 10, b: true });
            g += T(px(M.cx), pz(52), 'open to below · the glass vault over it', { fs: 9, rot: -90 });
            g += box([M.cx - 3.5, 38.5, M.cx + 3.5, 42], C.terra, { op: 0.6 }) + box([M.cx - 3.5, 56, M.cx + 3.5, 59.5], C.terra, { op: 0.6 }) + T(px(M.cx), pz(40.5) + 3, 'bridge', { fs: 8 }) + T(px(M.cx), pz(58) + 3, 'bridge', { fs: 8 });
            g += T(px(W2 - 1.75), pz(46), 'gallery', { fs: 9, rot: -90 }) + T(px(E1 + 1.75), pz(46), 'gallery', { fs: 9, rot: -90 });
            g += `<circle cx="${px(M.cx)}" cy="${pz(M.axis)}" r="${10.5 * s}" fill="none" stroke="${C.terra}" stroke-width="${3.4 * s * 0.25}" stroke-dasharray="14 6" opacity="0.7"/>` + T(px(M.cx), pz(29.5), 'the flight tube ring (kept)', { fs: 9 });
            g += box(M.terr, C.coral, { sw: 2 }) + lab(M.terr, ['THE', 'SEA', 'TERRACE', '', 'outside,', 'tables,', 'the view', 'of the', 'pier']);
            g += DOOR(px(M.x1), pz(38.5), '') + DOOR(px(M.x1), pz(49), '') + DOOR(px(M.x1), pz(59.5), '') + T(px(M.x1) + 10, pz(M.terr[1]) - 6, 'three glass doors: food court ⇄ terrace', { fs: 9, a: 'start', c: C.red, b: true });
            g += T(px(M.x0 - 6.5), pz(M.z0 - 4), 'UPPER FLOOR · 5.25 m', { a: 'start', fs: 15, b: true });
        }
        g += T(px(M.terr[2] + 8), pz(M.z0 - 3), 'N ↑', { fs: 13, b: true }) + T(px(M.terr[2] + 5), pz(45), 'SEA →', { fs: 11, b: true, rot: -90 });
        return g;
    };
    b += plan(pad, 60, false) + plan(pad + W + 30, 60, true);
    b += T(pad, 60 + H + 20, 'Red dots are doors. Each one is the same door, at the same place, outside and inside. Grid = 3.5 m squares. The roof plan is the site drawing: hip roofs on the wings, glass vault on both concourses, the dome on the crossing.', { a: 'start', fs: 12 });
    fs.writeFileSync(path.join(OUT, '03_floors.svg'), svg(2 * W + pad * 2 + 30, H + 110, b, 'THE BAYSIDE MALL · 3 · THE FLOORS'));
})();

/* ── 04 · THE ELEVATIONS + the section ── */
(function () {
    const s = 9; let b = '';
    const palm = (x, gy, h) => L(x, gy, x + 3, gy - h * s, '#7a5a34', 3) + [-1, 1, -0.4, 0.5].map(d => `<path d="M ${x + 3} ${gy - h * s} q ${d * 14} -12 ${d * 26} 4" stroke="#3f9a48" stroke-width="3" fill="none"/>`).join('');
    const person = (x, gy) => R(x - 2, gy - 1.8 * s, 4, 1.8 * s, C.ink, { sw: 0 });
    /* EAST: seen from the pier; south is LEFT (z 80.5), north is RIGHT (z 3.5) */
    (function () {
        const ox = 60, gy = 300, px = z => ox + (M.z1 - z) * s, py = y => gy - y * s;
        b += T(ox, gy - 21.5 * s, 'EAST FRONT · what you see from the pier and the boardwalk (77 m; south is left)', { a: 'start', fs: 15, b: true });
        b += L(ox - 30, gy, ox + 77 * s + 30, gy, C.ink, 2);
        /* hip roofs */
        [[80.5, 66.5], [66.5, 24.5], [17.5, 3.5]].forEach(q => { b += `<polygon points="${px(q[0]) - 5},${py(M.eave)} ${px(q[1]) + 5},${py(M.eave)} ${px(q[1]) - 22},${py(M.eave + 2.7)} ${px(q[0]) + 22},${py(M.eave + 2.7)}" fill="${C.terra}" stroke="${C.ink}"/>`; });
        b += R(px(80.5), py(M.eave), 14 * s, M.eave * s, C.lemon) + R(px(66.5), py(M.eave), 42 * s, M.eave * s, C.sand) + R(px(17.5), py(M.eave), 14 * s, M.eave * s, C.cream);
        /* the cross vault's glass end + the dome behind */
        b += `<path d="M ${px(31.5)} ${py(M.eave + 3.3)} A ${10.5 * s} ${5.4 * s} 0 0 1 ${px(10.5)} ${py(M.eave + 3.3)} Z" fill="${C.aqua}" stroke="${C.ink}"/>` + R(px(31.5), py(M.eave + 3.3), 21 * s, 1.2 * s, C.cream);
        b += L(px(21), py(M.dome), px(21), py(M.dome + 1.6), C.ink, 2);
        b += R(px(24.5), py(9), 7 * s, 9 * s, C.glass) + `<path d="M ${px(24.5)} ${py(9)} A ${3.5 * s} ${3.4 * s} 0 0 1 ${px(17.5)} ${py(9)} Z" fill="${C.glass}" stroke="${C.ink}"/>`;
        b += R(px(25.6), py(11.2), 9.2 * s, 9.9 * s + 1.3 * s, 'none', { s: C.coral, sw: 7 });
        b += R(px(24.5) - 4, py(10.9), 7 * s + 8, 1.2 * s, C.coral) + T(px(21), py(10.05), 'THE BAYSIDE MALL', { fs: 12, c: '#fff', b: true });
        b += R(px(22.6), py(2.4), 3.2 * s, 2.4 * s, '#9fd8ee') + L(px(21), py(2.4), px(21), py(0), C.ink, 1) + T(px(21), py(3.0), 'sea doors', { fs: 9, c: '#fff' });
        /* the terrace + colonnade (z 31.5..66.5) */
        b += R(px(66.5), py(M.f1), 35 * s, 0.5 * s, C.cream) + R(px(66.5), py(M.f1 + 1.1), 35 * s, 0.12 * s, C.ink, { sw: 0 });
        for (let z = 33.25; z < 66.5; z += 3.5) b += R(px(z) - 2.5, py(M.f1), 5, M.f1 * s, '#fff');
        for (let z = 35; z < 66; z += 7) { b += R(px(z + 2.6), py(3.6), 5.2 * s, 3.3 * s, C.glass, { op: 0.85 }); }
        b += R(px(66.5), py(M.f1 + 4.2), 35 * s, 3.9 * s, C.glass, { op: 0.9 }); for (let z = 35; z < 66.5; z += 3.5) b += L(px(z), py(M.f1 + 4.2), px(z), py(M.f1 + 0.3), '#cfe6f2', 1.5);
        b += T(px(49), py(M.f1 + 2.3), 'FOOD COURT · glass doors onto THE SEA TERRACE', { fs: 11, c: '#fff', b: true });
        [38, 45, 52, 59].forEach(z => { b += `<polygon points="${px(z) - 16},${py(M.f1 + 1.0)} ${px(z) + 16},${py(M.f1 + 1.0) } ${px(z)},${py(M.f1 + 3.0)}" fill="${C.coral}" stroke="${C.ink}" opacity="0.95"/>`; });
        b += T(px(49), py(1.2), 'JUICE · PRETZELS · café fronts under the colonnade', { fs: 10, c: '#fff' });
        b += `<polygon points="${px(66.5)},${py(M.f1)} ${px(70)},${py(M.f1)} ${px(70)},${py(0)} ${px(66.5) }, ${py(0)}" fill="${C.coral}" stroke="${C.ink}" opacity="0.6"/>` + L(px(70), py(0), px(66.5), py(M.f1), C.ink, 1.5) + T(px(68.2), py(M.f1 + 0.5), 'stair', { fs: 8 });
        /* the anchor (south, left) */
        for (let z = 68; z < 80; z += 3.5) b += R(px(z + 2.2), py(9.2), 1.9 * s, 3.2 * s, C.glass) + R(px(z + 2.2), py(3.6), 1.9 * s, 3.0 * s, C.glass);
        b += R(px(73.5) - 4.4 * s, py(5.1), 8.8 * s, 0.9 * s, C.navy || '#44669c') + T(px(73.5), py(4.45), 'DEPARTMENT STORE', { fs: 9, c: '#fff', b: true });
        /* the service end (north, right) */
        b += R(px(9.5), py(3.6), 4.4 * s, 3.6 * s, C.grey) + T(px(7.3), py(1.6), 'loading', { fs: 9 }); for (let i = 0; i < 6; i++) b += L(px(9.5), py(0.6 * i + 0.3), px(5.1), py(0.6 * i + 0.3), '#8a8d92', 1);
        for (let z = 5; z < 17; z += 3.5) b += R(px(z + 2.2), py(9.2), 1.9 * s, 2.6 * s, C.glass);
        b += [84, 0].map(z => palm(px(z), gy, 6)).join('') + person(px(27), gy) + person(px(62), gy) + person(px(50), py(M.f1 + 0.5) + 0.5 * s);
        b += L(px(-3), py(0), px(-3), py(M.eave), C.ink, 1) + T(px(-3) + 6, py(5.25), '10.5 m eaves', { a: 'start', fs: 10 }) + T(px(-3) + 6, py(M.dome - 1), '19 m dome', { a: 'start', fs: 10 }) + T(px(-3) + 6, py(M.f1 - 2.5), '5.25 m floor', { a: 'start', fs: 10 });
        b += T(px(21), gy + 18, '↓ the pier is straight out from here', { fs: 11, c: C.red, b: true });
        /* the dome drawn last so it sits over the vault */
        b = b.replace('<!--DOME_E-->', '');
        b += `<path d="M ${px(27.5)} ${py(M.vault + 0.6)} A ${6.5 * s} ${5.4 * s} 0 0 1 ${px(14.5)} ${py(M.vault + 0.6)} Z" fill="${C.aqua}" stroke="${C.ink}" stroke-width="1.5"/>` + R(px(27.8), py(M.vault + 0.6), 13.6 * s, 0.6 * s, C.cream);
    })();
    /* WEST: seen from the Cordon plaza; north is LEFT */
    (function () {
        const ox = 60, gy = 600, px = z => ox + (z - M.z0) * s, py = y => gy - y * s;
        b += T(ox, gy - 21.5 * s, 'WEST FRONT · what you see from the Cordon plaza and the avenue (north is left)', { a: 'start', fs: 15, b: true });
        b += L(ox - 30, gy, ox + 77 * s + 30, gy, C.ink, 2);
        [[3.5, 17.5], [24.5, 66.5], [66.5, 80.5]].forEach(q => { b += `<polygon points="${px(q[0]) - 5},${py(M.eave)} ${px(q[1]) + 5},${py(M.eave)} ${px(q[1]) - 22},${py(M.eave + 2.7)} ${px(q[0]) + 22},${py(M.eave + 2.7)}" fill="${C.terra}" stroke="${C.ink}"/>`; });
        b += R(px(3.5), py(M.eave), 14 * s, M.eave * s, C.cream) + R(px(24.5), py(M.eave), 42 * s, M.eave * s, C.sand) + R(px(66.5), py(M.eave), 14 * s, M.eave * s, C.lemon);
        b += `<path d="M ${px(10.5)} ${py(M.eave + 3.3)} A ${10.5 * s} ${5.4 * s} 0 0 1 ${px(31.5)} ${py(M.eave + 3.3)} Z" fill="${C.aqua}" stroke="${C.ink}"/>` + R(px(10.5), py(M.eave + 3.3), 21 * s, 1.2 * s, C.cream);
        b += `<path d="M ${px(14.5)} ${py(M.vault + 0.6)} A ${6.5 * s} ${5.4 * s} 0 0 1 ${px(27.5)} ${py(M.vault + 0.6)} Z" fill="${C.aqua}" stroke="${C.ink}" stroke-width="1.5"/>` + R(px(14.2), py(M.vault + 0.6), 13.6 * s, 0.6 * s, C.cream) + L(px(21), py(M.dome), px(21), py(M.dome + 1.6), C.ink, 2);
        b += R(px(17.5), py(9), 7 * s, 9 * s, C.glass) + `<path d="M ${px(17.5)} ${py(9)} A ${3.5 * s} ${3.4 * s} 0 0 1 ${px(24.5)} ${py(9)} Z" fill="${C.glass}" stroke="${C.ink}"/>`;
        b += R(px(16.4), py(11.2), 9.2 * s, 11.2 * s, 'none', { s: C.coral, sw: 7 }) + R(px(17.5) - 4, py(10.9), 7 * s + 8, 1.2 * s, C.coral) + T(px(21), py(10.05), 'THE BAYSIDE MALL', { fs: 12, c: '#fff', b: true });
        b += R(px(19.4), py(2.4), 3.2 * s, 2.4 * s, '#9fd8ee') + L(px(21), py(2.4), px(21), py(0), C.ink, 1) + T(px(21), py(3.0), 'main doors', { fs: 9, c: '#fff' });
        /* shopfront windows + awnings, ground; upper windows */
        for (let z = 26; z < 66; z += 7) { b += R(px(z), py(3.4), 4.6 * s, 2.9 * s, C.glass) + `<polygon points="${px(z) - 4},${py(3.5)} ${px(z) + 4.6 * s + 4},${py(3.5)} ${px(z) + 4.6 * s + 10},${py(2.8)} ${px(z) - 10},${py(2.8)}" fill="${C.coral}" stroke="${C.ink}"/>` + R(px(z + 0.6), py(9.2), 3.4 * s, 2.8 * s, C.glass); }
        for (let z = 5.5; z < 16; z += 5.5) b += R(px(z), py(3.4), 3.6 * s, 2.9 * s, C.glass) + R(px(z + 0.4), py(9.2), 2.8 * s, 2.8 * s, C.glass);
        b += R(px(5), py(5.3), 11 * s, 1.0 * s, C.lilac) + T(px(10.5), py(4.6), 'ARCADE', { fs: 10, b: true });
        for (let z = 68; z < 80; z += 3.5) b += R(px(z), py(9.2), 1.9 * s, 3.2 * s, C.glass) + R(px(z), py(3.6), 1.9 * s, 3.0 * s, C.glass);
        b += R(px(73.5) - 4.4 * s, py(5.1), 8.8 * s, 0.9 * s, '#44669c') + T(px(73.5), py(4.45), 'DEPARTMENT STORE', { fs: 9, c: '#fff', b: true });
        b += T(px(45.5), py(5.0), 'shop windows, ground and upper: every window is a shop inside', { fs: 10 });
        b += [0, 84].map(z => palm(px(z), gy, 6)).join('') + person(px(15), gy) + person(px(40), gy);
    })();
    /* SECTION: cut east-west on the pier's line, looking north */
    (function () {
        const ox = 60, gy = 900, px = x => ox + (x - 150) * s, py = y => gy - y * s;
        b += T(ox, gy - 21.5 * s, 'SECTION on the pier’s line, looking north: the outside and the inside are one drawing', { a: 'start', fs: 15, b: true });
        b += R(px(259), py(-1.05), 40 * s, 1.5 * s, C.beach, { sw: 0 }) + R(px(280), py(-1.3), 19 * s, 1.5 * s, C.sea, { sw: 0 }) + L(px(150), gy, px(259), gy, C.ink, 2) + L(px(259), gy, px(259), py(-1.05), C.ink, 2);
        b += R(px(224), py(0.05), 14 * s, 0.4 * s, C.road, { sw: 0 }) + R(px(252), py(0.25), 7 * s, 0.25 * s, C.plank) + R(px(258.7), py(0.25), 40 * s, 0.3 * s, C.plank);
        for (let x = 262; x < 299; x += 7) b += L(px(x), py(0), px(x), py(-2), C.ink, 2);
        b += T(px(231), py(-1), 'coast road', { fs: 10 }) + T(px(255.5), py(-1), 'boardwalk', { fs: 10 }) + T(px(283), py(1.6), 'THE PIER →', { fs: 11, b: true }) + T(px(213.5), py(-1), 'sea front', { fs: 10 }) + T(px(160), py(-1), 'Cordon plaza', { fs: 10 });
        /* the wings cut north of the cross concourse are behind: draw the atrium bay */
        b += R(px(M.x0), py(M.eave), 35 * s, M.eave * s, '#fdfbf4', { sw: 3 });
        b += R(px(M.x0), py(M.f1 + 0.3), 7 * s, 0.3 * s, C.ink, { sw: 0 }) + R(px(199.5), py(M.f1 + 0.3), 7 * s, 0.3 * s, C.ink, { sw: 0 });
        b += T(px(175), py(7.5), 'gallery', { fs: 10 }) + T(px(203), py(7.5), 'gallery', { fs: 10 }) + T(px(175), py(2.2), 'cross concourse', { fs: 9 }) + T(px(203), py(2.2), 'cross concourse', { fs: 9 });
        b += `<path d="M ${px(178.5)} ${py(M.eave)} A ${10.5 * s} ${(M.dome - M.eave) * s} 0 0 1 ${px(199.5)} ${py(M.eave)}" fill="${C.aqua}" fill-opacity="0.55" stroke="${C.ink}" stroke-width="2"/>` + L(px(M.cx), py(M.dome), px(M.cx), py(M.dome + 1.6), C.ink, 2);
        b += T(px(M.cx), py(14.5), 'THE DOME', { fs: 12, b: true }) + T(px(M.cx), py(13.2), 'outside: the landmark', { fs: 10 }) + T(px(M.cx), py(12.1), 'inside: the atrium’s roof', { fs: 10 });
        b += R(px(M.cx - 8.75), py(8.5), 3.5 * s, 8.5 * s, C.terra, { op: 0.8 }) + T(px(M.cx - 7), py(9), 'clock tower', { fs: 9 });
        b += R(px(M.cx - 3), py(0.4), 6 * s, 0.4 * s, C.aqua) + T(px(M.cx), py(1), 'fountain', { fs: 9 });
        b += R(px(M.x0) - 3, py(2.4), 6, 2.4 * s, C.red, { sw: 0 }) + R(px(M.x1) - 3, py(2.4), 6, 2.4 * s, C.red, { sw: 0 }) + T(px(M.x0), py(3.2), 'W doors', { fs: 10, c: C.red, b: true }) + T(px(M.x1), py(3.2), 'E doors', { fs: 10, c: C.red, b: true });
        b += L(px(M.x0 + 2), py(1.6), px(296), py(1.6), C.red, 1.2, '8 5') + T(px(240), py(2.2), 'from the fountain you see out the sea doors, down the pier', { fs: 10, c: C.red });
        b += R(px(206.5), py(M.f1 + 0.4), 7 * s, 0.4 * s, C.coral) + R(px(213.2), py(M.f1), 0.35 * s, M.f1 * s, '#fff') + T(px(210), py(M.f1 + 1.2), 'terrace (behind)', { fs: 9 });
        b += person(px(160), gy) + person(px(185), gy) + person(px(256), py(0.25)) + person(px(275), py(0.3));
        b += palm(px(231), gy, 3.2);
    })();
    fs.writeFileSync(path.join(OUT, '04_elevations.svg'), svg(77 * 9 + 60 + 9 * 78, 940, b, 'THE BAYSIDE MALL · 4 · THE FRONTS AND THE SECTION'));
})();

/* PNGs, when the probe's browser is here */
(async () => {
    let pw; try { pw = require(path.join(__dirname, '../../../node_modules/playwright')); } catch (e) { console.log('SVGs written (no playwright: no PNGs)'); return; }
    const br = await pw.chromium.launch({ args: ['--no-sandbox'] }); const pg = await br.newPage();
    for (const f of fs.readdirSync(OUT).filter(f => f.endsWith('.svg'))) {
        const t = fs.readFileSync(path.join(OUT, f), 'utf8'), m = /width="(\d+(?:\.\d+)?)" height="(\d+(?:\.\d+)?)"/.exec(t);
        await pg.setViewportSize({ width: Math.ceil(+m[1]), height: Math.ceil(+m[2]) }); await pg.setContent('<body style="margin:0">' + t + '</body>');
        await pg.screenshot({ path: path.join(OUT, f.replace('.svg', '.png')) }); console.log('wrote', f.replace('.svg', '.png'));
    }
    await br.close();
})();
