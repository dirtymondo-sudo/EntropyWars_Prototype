#!/usr/bin/env node
/* THE BAYSIDE MALL, THE PLAN'S DRAWINGS (2026-11-20). Not a game file. `node docs/plans/mall/draw-plan.js` writes four SVGs beside itself
   (and PNGs when playwright is installed): 01_mismatch, 02_site, 03_floors, 04_elevations. Every number is room metres of
   `site_prebuilt_downtown_streets` (x east, z south). Change THE BOX here first, then MALL_PLAN.md. */
'use strict';
const fs = require('fs'), path = require('path');
const OUT = __dirname;

/* ── THE BOX (the one building) ── */
const M = {
    x0: 171.5, x1: 206.5, z0: 3.5, z1: 42,            // the body: 35 x 38.5 m = 10 x 11 squares, on its own plot P10-10
    cx: 189, axis: 21,                                // the long concourse's line; the pier's line
    f1: 5.25, eave: 10.5, vault: 13.5, dome: 19.0,    // upper floor, eaves, the vault's crown, the dome's top
    atr: [182, 14, 196, 28],                          // the atrium under the dome (14 x 14)
    terr: [206.5, 24.5, 213.5, 42],                   // the sea terrace at 5.25 m, a colonnade under it
};
const OLD_OUT = [175, 7, 203, 35];
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const C = { ink: '#1c2330', sand: '#f3dca8', cream: '#fff3da', coral: '#ff9d86', terra: '#d9704a', aqua: '#8fdcec', glass: '#2c4a63', sea: '#4aa8d8', beach: '#f0dfb0', road: '#6b6f76', pave: '#c9c6bd', plank: '#b98a55', grass: '#9ccf7a', red: '#e5484d', mint: '#a8ecd6', grey: '#b9bcc0', lilac: '#d9c8f5', lemon: '#ffe27a', pink: '#ffc0d6', orange: '#f2b866' };

function svg(w, h, body, title) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" font-family="Verdana, Arial, sans-serif">
<rect width="${w}" height="${h}" fill="#fbfaf6"/><text x="20" y="34" font-size="22" font-weight="bold" fill="${C.ink}">${esc(title)}</text>
${body}</svg>`;
}
const R = (x, y, w, h, fill, o) => `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" fill="${fill}" stroke="${(o && o.s) || C.ink}" stroke-width="${(o && o.sw) != null ? o.sw : 1}"${o && o.dash ? ' stroke-dasharray="' + o.dash + '"' : ''}${o && o.op ? ' fill-opacity="' + o.op + '"' : ''}/>`;
const T = (x, y, s, o) => `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-size="${(o && o.fs) || 12}" fill="${(o && o.c) || C.ink}" text-anchor="${(o && o.a) || 'middle'}"${o && o.b ? ' font-weight="bold"' : ''}${o && o.rot ? ` transform="rotate(${o.rot} ${x.toFixed(1)} ${y.toFixed(1)})"` : ''}>${esc(s)}</text>`;
const L = (x0, y0, x1, y1, c, w, dash) => `<line x1="${x0.toFixed(1)}" y1="${y0.toFixed(1)}" x2="${x1.toFixed(1)}" y2="${y1.toFixed(1)}" stroke="${c || C.ink}" stroke-width="${w || 1}"${dash ? ' stroke-dasharray="' + dash + '"' : ''}/>`;
const CIR = (x, y, r, fill, o) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="${fill}" stroke="${(o && o.s) || C.ink}" stroke-width="${(o && o.sw) != null ? o.sw : 1}"${o && o.op ? ' fill-opacity="' + o.op + '"' : ''}/>`;
const DOOR = (x, y, label, o) => `<g>${CIR(x, y, 7, C.red, { s: '#fff', sw: 2 })}${label ? T(x + ((o && o.dx) || 0), y + ((o && o.dy) != null ? o.dy : -12), label, { fs: 11, c: C.red, b: true, a: (o && o.a) || 'middle' }) : ''}</g>`;
const LAB = (cx, cy, t, o) => { const ls = [].concat(t); return ls.map((q, i) => T(cx, cy + 4 + (i - (ls.length - 1) / 2) * 13, q, Object.assign({ fs: 10 }, o))).join(''); };

/* ── 01 · THE MISMATCH: today's outside against today's inside, and the new box, one scale ── */
(function () {
    const s = 6, ox = 40, oy = 90; let b = '';
    b += T(ox, oy - 14, 'TODAY, at one scale (one grid square = 3.5 m)', { a: 'start', fs: 14 });
    for (let i = 0; i <= 28; i++) b += L(ox + i * 3.5 * s, oy, ox + i * 3.5 * s, oy + 64 * s, '#e4e0d6', 1);
    for (let j = 0; j <= 18; j++) b += L(ox, oy + j * 3.5 * s, ox + 98 * s, oy + j * 3.5 * s, '#e4e0d6', 1);
    b += R(ox, oy, 96 * s, 64 * s, '#ecebe6', { sw: 2 });
    b += T(ox + 48 * s, oy + 20, 'THE INSIDE TODAY: room site_prebuilt_downtown_mall · 96 x 64 m · 12 m high', { fs: 15, b: true });
    b += T(ox + 48 * s, oy + 40, 'one grey hall: atrium + fountain, upper galleries at 4.6 m, a catwalk at 8.4 m, food court, arcade, clock tower', { fs: 12 });
    b += T(ox + 48 * s, oy + 64 * s - 12, 'floor 6,144 m² · one door to the city (south wall) · one door to the supply closet (north wall)', { fs: 12 });
    const bx = ox + 6 * s, by = oy + 16 * s;
    b += R(bx, by, 28 * s, 28 * s, C.sand, { sw: 3, s: C.red });
    b += R(bx + 9.8 * s, by, 8.4 * s, 28 * s, C.aqua) + R(bx, by + 9.8 * s, 28 * s, 8.4 * s, C.aqua) + CIR(bx + 14 * s, by + 14 * s, 5.2 * s, C.aqua);
    b += T(bx + 14 * s, by + 5 * s, 'THE OUTSIDE TODAY', { fs: 14, b: true, c: C.red }) + T(bx + 14 * s, by + 5 * s + 16, 'building P10-10-B1', { fs: 12 }) + T(bx + 14 * s, by + 23 * s, '28 x 28 m · 10.5 m eaves', { fs: 12 }) + T(bx + 14 * s, by + 23 * s + 16, '784 m² · one door (west)', { fs: 12 });
    const nx = ox + 50 * s, ny = oy + 12 * s;
    b += R(nx, ny, 35 * s, 38.5 * s, C.cream, { sw: 3, s: '#1f8a4c' }) + R(nx + 35 * s, ny + 21 * s, 7 * s, 17.5 * s, C.coral, { s: '#1f8a4c', sw: 2 });
    b += R(nx + 14 * s, ny, 7 * s, 38.5 * s, C.aqua) + R(nx, ny + 14 * s, 35 * s, 7 * s, C.aqua) + CIR(nx + 17.5 * s, ny + 17.5 * s, 7 * s, C.aqua);
    b += T(nx + 17.5 * s, ny + 5 * s, 'THE ONE BUILDING', { fs: 14, b: true, c: '#1f8a4c' }) + T(nx + 17.5 * s, ny + 5 * s + 16, 'outside = inside', { fs: 12 }) + T(nx + 17.5 * s, ny + 31 * s, '35 x 38.5 m · two floors', { fs: 12 }) + T(nx + 17.5 * s, ny + 31 * s + 16, '1,348 m² a floor · four doors', { fs: 12 });
    b += T(ox, oy + 64 * s + 30, 'Today the inside is 3.4 times as long and 2.3 times as wide as the building it is said to be in: 7.8 times the floor.', { a: 'start', fs: 15, b: true });
    b += T(ox, oy + 64 * s + 52, 'Outside: pastel stucco, terracotta roofs, a glass cross vault and a dome, windows on four sides. Inside: a flat grey ceiling, no vault, no dome, eight portholes.', { a: 'start', fs: 13 });
    b += T(ox, oy + 64 * s + 72, 'Outside the door is on the west face. Inside the same door is in the south wall. The green box is the plan: one size for both.', { a: 'start', fs: 13 });
    fs.writeFileSync(path.join(OUT, '01_mismatch.svg'), svg(1190, oy + 64 * s + 95, b, 'THE BAYSIDE MALL · 1 · THE MISMATCH TODAY'));
})();

/* ── 02 · THE SITE ── */
(function () {
    const s = 5.5, X0 = 112, Z0 = -24, X1 = 326, Z1 = 62, ox = 30, oy = 60; const px = x => ox + (x - X0) * s, pz = z => oy + (z - Z0) * s; let b = '';
    const box = (a, fill, o) => R(px(a[0]), pz(a[1]), (a[2] - a[0]) * s, (a[3] - a[1]) * s, fill, o);
    b += box([X0, Z0, X1, Z1], C.pave, { sw: 0 }) + box([259, Z0, X1, Z1], C.beach, { sw: 0 });
    b += `<path d="M ${px(293)} ${pz(Z0)} Q ${px(299)} ${pz(0)} ${px(295)} ${pz(21)} Q ${px(291)} ${pz(45)} ${px(288)} ${pz(Z1)} L ${px(X1)} ${pz(Z1)} L ${px(X1)} ${pz(Z0)} Z" fill="${C.sea}"/>`;
    b += box([224, Z0, 238, Z1], C.road, { sw: 0 }) + box([241.5, Z0, 252, Z1], C.plank, { sw: 0, op: 0.55 }) + box([252, Z0, 259, Z1], C.plank, { sw: 0 });
    b += L(px(259), pz(Z0), px(259), pz(Z1), C.ink, 3);
    for (let z = Z0 + 4; z < Z1; z += 10.5) b += CIR(px(231), pz(z), 4, C.grass, { sw: 0.5 });
    b += box([115.5, 45.5, 259, 52.5], C.sea, { sw: 1 }) + T(px(160), pz(49) + 4, 'THE CANAL (kept)', { fs: 11, c: '#fff', b: true });
    [[127.75, 3.5], [147, 7], [173.25, 3.5], [204.75, 3.5]].forEach(q => { b += box([q[0] - q[1] / 2, 44.75, q[0] + q[1] / 2, 53.25], C.plank); });
    b += box([258.7, 17.5, 297.5, 24.5], C.plank) + box([297.5, 10.5, 318.5, 31.5], C.plank) + CIR(px(308), pz(21), 4.2 * s, C.mint);
    b += box([126, 0, 168, 42], 'none', { dash: '6 4', s: '#7a7f88' }) + T(px(128), pz(40), 'CORDON PLAZA (kept open)', { a: 'start', fs: 10, c: '#5a5f68' });
    b += box([168, 0, 210, 42], 'none', { dash: '6 4', s: '#7a7f88' }) + T(px(169), pz(-1.5), 'plot P10-10', { a: 'start', fs: 10, c: '#5a5f68' });
    b += CIR(px(147), pz(10.5), 4.3 * s, C.aqua) + T(px(147), pz(10.5) + 4, 'bandstand', { fs: 9 });
    b += R(px(119.5), pz(14), 2.4 * s, 14 * s, C.pink) + T(px(121), pz(11), 'the mall arch', { fs: 10, a: 'start' });
    b += box([168, -17.5, 185.5, 0], C.mint) + T(px(176.7), pz(-8), 'staff apartments', { fs: 9 });
    b += box([150.5, -3.5, 161, 3.5], C.grey);
    b += box([210, 0, 220.5, 17.5], C.orange) + CIR(px(215.25), pz(8.75), 5 * s, C.orange) + T(px(215.25), pz(8.75) + 4, 'JUICE', { fs: 10, b: true }) + T(px(215.25), pz(8.75) + 16, '(kept)', { fs: 9 });
    b += L(px(114), pz(21), px(322), pz(21), C.red, 1.5, '10 5') + T(px(268), pz(21) - 34, 'ONE LINE: arch → plaza → main doors → dome → sea doors → pier', { fs: 12, c: C.red, b: true });
    /* the building */
    b += box([M.x0, M.z0, M.x1, M.z1], C.sand, { sw: 3 });
    [[171.5, 3.5, 185.5, 17.5], [192.5, 3.5, 206.5, 17.5], [171.5, 24.5, 185.5, 42], [192.5, 24.5, 206.5, 42]].forEach(q => b += box(q, C.terra, { op: 0.75 }));
    b += box([M.cx - 3.5, M.z0, M.cx + 3.5, M.z1], C.aqua) + box([M.x0, M.axis - 3.5, M.x1, M.axis + 3.5], C.aqua) + CIR(px(M.cx), pz(M.axis), 7 * s, C.aqua, { sw: 2 });
    b += box(M.terr, C.coral, { sw: 1.5 }) + T(px(210), pz(33.5), 'SEA TERRACE', { fs: 9, rot: -90 });
    b += box([206.5, 17.5, 220.5, 24.5], '#efe6cf', { s: '#9a8f70', dash: '3 3' }) + box([213.5, 24.5, 220.5, 42], '#efe6cf', { s: '#9a8f70', dash: '3 3' }) + T(px(217), pz(34), 'sea front', { fs: 9, rot: -90 });
    b += box(OLD_OUT, 'none', { s: C.red, sw: 2, dash: '5 4' }) + T(px(176), pz(33.5), 'today 28 x 28', { fs: 9, c: C.red, a: 'start' });
    b += box([185.5, 38.5, 203, 45.5], 'none', { s: '#444', sw: 1.5, dash: '2 3' }) + T(px(194), pz(57), 'the blank filler block that stands here today goes (dotted)', { fs: 10 }) + L(px(194), pz(54.5), px(194), pz(45.5), '#444', 1);
    b += T(px(M.cx), pz(9), 'THE BAYSIDE MALL', { fs: 12, b: true }) + T(px(M.cx), pz(12.5), '35 x 38.5 m', { fs: 11 });
    b += DOOR(px(M.x0), pz(21), 'MAIN', { dy: -12 }) + DOOR(px(M.x1), pz(21), 'SEA', { dy: -12 }) + DOOR(px(M.cx), pz(M.z1), 'CANAL', { dy: -11 }) + DOOR(px(199.5), pz(M.z0), 'STAFF', { dy: -11 });
    b += T(px(231), pz(-19), 'COAST ROAD', { fs: 11, c: '#fff' }) + T(px(255.5), pz(-8), 'BOARDWALK', { fs: 10, rot: -90 }) + T(px(246.7), pz(-8), 'kept clear', { fs: 9, rot: -90 }) + T(px(276), pz(38), 'BAYSIDE SAND', { fs: 11 }) + T(px(312), pz(-14), 'SEA', { fs: 13, c: '#fff', b: true }) + T(px(280), pz(21) + 4, 'THE PIER', { fs: 11, b: true });
    b += L(px(116), pz(58), px(151), pz(58), C.ink, 3) + T(px(133.5), pz(58) - 6, '35 m', { fs: 11 }) + T(px(320), pz(56), 'N ↑', { fs: 14, b: true });
    fs.writeFileSync(path.join(OUT, '02_site.svg'), svg((X1 - X0) * s + 60, (Z1 - Z0) * s + 80, b, 'THE BAYSIDE MALL · 2 · THE SITE (north is up, the sea is right)'));
})();

/* ── 03 · THE FLOORS ── */
(function () {
    const s = 15, pad = 40, X0 = M.x0 - 7, X1 = 224, Z0 = M.z0 - 7, Z1 = 49, W = (X1 - X0) * s, H = (Z1 - Z0) * s; let b = '';
    const plan = (ox, oy, upper) => {
        const px = x => ox + (x - X0) * s, pz = z => oy + (z - Z0) * s; let g = '';
        const box = (a, fill, o) => R(px(a[0]), pz(a[1]), (a[2] - a[0]) * s, (a[3] - a[1]) * s, fill, o);
        const room = (a, fill, t, o) => box(a, fill, o) + LAB(px((a[0] + a[2]) / 2), pz((a[1] + a[3]) / 2), t);
        for (let x = X0; x <= X1; x += 3.5) g += L(px(x), pz(Z0), px(x), pz(Z1), '#e8e4da', 1);
        for (let z = Z0; z <= Z1; z += 3.5) g += L(px(X0), pz(z), px(X1), pz(z), '#e8e4da', 1);
        g += box([X0, 45.5, X1, 49], C.sea, { sw: 0 }) + T(px(180), pz(47.5) + 3, 'the canal', { fs: 10, c: '#fff' }) + T(px(180), pz(44) + 3, 'the quay', { fs: 9 });
        g += box([M.x0, M.z0, M.x1, M.z1], '#f7f3e8', { sw: 5 });
        const W1 = 171.5, W2 = 185.5, E1 = 192.5, E2 = 206.5;
        if (!upper) {
            g += room([W1, 3.5, W2, 17.5], C.lilac, ['THE ARCADE', 'walked into', 'cabinets, tokens, prizes']);
            g += room([E1, 3.5, E2, 10.5], C.grey, ['SERVICE', 'loading bay · bins · staff']);
            g += room([196, 10.5, 201.25, 17.5], C.cream, ['KEYS', '& KEYS']) + room([201.25, 10.5, E2, 17.5], C.cream, ['TAPE', 'WORLD']);
            g += room([W1, 24.5, 178.5, 33.25], C.cream, 'DOORS R US') + room([178.5, 28, W2, 33.25], C.cream, 'RECORDS') + room([W1, 33.25, 178.5, 42], C.cream, 'SHOES') + room([178.5, 33.25, W2, 42], C.cream, 'PHONES');
            g += room([E1, 28, E2, 32.6], C.cream, ['PRETZELS', 'opens both ways']) + room([E1, 32.6, E2, 37.3], C.cream, ['THE GOO SHOP', 'opens both ways']) + room([E1, 37.3, E2, 42], C.cream, ['SALT & LAMP', 'opens both ways']);
            g += box(M.atr, '#fdfbf4', { dash: '6 4', s: C.glass, sw: 2 }) + CIR(px(M.cx), pz(M.axis), 3 * s, C.aqua) + T(px(M.cx), pz(M.axis) + 4, 'fountain', { fs: 10 });
            g += CIR(px(184), pz(26), 1.5 * s, C.terra) + T(px(184), pz(26) + 3, 'clock', { fs: 8 });
            g += T(px(M.cx), pz(15.6), 'THE ATRIUM · open to the dome', { fs: 10, b: true });
            g += box([186.2, 28, 187.95, 37.1], C.coral) + box([190.05, 28, 191.8, 37.1], C.coral) + T(px(M.cx), pz(39), 'two escalators up', { fs: 9 });
            g += box([186.4, 5.3, 191.6, 14], C.coral, { op: 0.8 }) + T(px(M.cx), pz(9.5) + 3, 'wide stair up', { fs: 9 });
            g += T(px(177), pz(21) + 4, 'THE CROSS CONCOURSE', { fs: 10, b: true }) + T(px(201), pz(21) + 4, 'the pier’s line →', { fs: 10, c: C.red, b: true });
            g += box([185.5, 3.5, 186.4, 5.3], '#444', { sw: 0 }) + T(px(184.8), pz(2.2), 'STAFF ONLY: stair down to the supply closet', { fs: 9, a: 'end' });
            for (let z = 26.25; z < 42; z += 3.5) g += CIR(px(213.2), pz(z), 3.2, '#fff');
            g += T(px(210), pz(33.5), 'colonnade · cafe tables', { fs: 9, rot: -90 });
            g += box([213.7, 32, 215.45, 42], C.coral, { op: 0.8 }) + T(px(218.5), pz(37), 'stair up to the terrace', { fs: 9, rot: -90 });
            g += box([210, Z0, 220.5, 17.5], C.orange, { op: 0.6 }) + T(px(215.25), pz(8), 'JUICE dome', { fs: 10 }) + T(px(215.25), pz(8) + 13, '(stands today)', { fs: 9 });
            g += DOOR(px(M.x0), pz(21), 'MAIN DOORS', { a: 'end', dx: -10, dy: -10 }) + DOOR(px(M.x1), pz(21), 'SEA DOORS', { a: 'start', dx: 10, dy: -10 }) + DOOR(px(M.cx), pz(M.z1), 'CANAL DOORS', { dy: 20 }) + DOOR(px(199.5), pz(M.z0), 'STAFF DOOR (needs the pass)', { dy: -12 });
            g += T(px(X0) + 4, pz(Z0) + 18, 'GROUND FLOOR · 0 m', { a: 'start', fs: 16, b: true });
        } else {
            g += room([W1, 3.5, 182, 17.5], C.lilac, ['ARCADE', 'UPSTAIRS', 'prize counter']);
            g += room([196, 3.5, E2, 17.5], C.grey, ['MALL OFFICE', 'SECURITY', 'the one camera']);
            g += room([W1, 24.5, 182, 33.25], C.cream, ['CUBE STOP', 'THE LIMITED FORM']) + room([W1, 33.25, 182, 42], C.cream, ['GLASSES IN AN HOUR', 'OUT OF BUSINESS']);
            g += room([196, 24.5, E2, 42], C.pink, ['THE FOOD COURT', 'walked into', 'counters on the south wall', 'tables by the glass', 'its east wall is', 'glass doors']);
            g += box([185.5, 24.5, 192.5, 42], '#dfeef2', { dash: '5 4', s: C.glass }) + box([185.5, 3.5, 192.5, 17.5], '#dfeef2', { dash: '5 4', s: C.glass }) + box([171.5, 17.5, 206.5, 24.5], '#dfeef2', { dash: '5 4', s: C.glass }) + box(M.atr, '#dfeef2', { dash: '5 4', s: C.glass });
            g += T(px(M.cx), pz(19.5), 'open to below', { fs: 10 }) + T(px(M.cx), pz(22.5), 'THE DOME is over this', { fs: 10, b: true });
            g += T(px(176.5), pz(21) + 4, 'glass vault over', { fs: 9 }) + T(px(201.5), pz(21) + 4, 'glass vault over', { fs: 9 });
            g += `<circle cx="${px(M.cx)}" cy="${pz(M.axis)}" r="${8.75 * s}" fill="none" stroke="${C.terra}" stroke-width="${3.5 * s}" opacity="0.28"/>` + T(px(M.cx), pz(31), 'the flight tube: a ring walk round the atrium (kept)', { fs: 9 });
            [[182, 3.5, 185.5, 17.5], [192.5, 3.5, 196, 17.5], [182, 24.5, 185.5, 42], [192.5, 24.5, 196, 42]].forEach(q => g += box(q, C.terra, { op: 0.35 }));
            g += T(px(183.75), pz(36), 'gallery', { fs: 9, rot: -90 }) + T(px(194.25), pz(36), 'gallery', { fs: 9, rot: -90 }) + T(px(183.75), pz(9), 'gallery', { fs: 9, rot: -90 }) + T(px(194.25), pz(9), 'gallery', { fs: 9, rot: -90 });
            g += box([185.5, 38.5, 192.5, 42], C.terra, { op: 0.6 }) + T(px(M.cx), pz(40.3) + 3, 'bridge', { fs: 9 });
            g += box(M.terr, C.coral, { sw: 2 }) + LAB(px(210), pz(33.25), ['THE', 'SEA', 'TERRACE', '', 'outside', 'tables', 'the pier,', 'the beach,', 'the water']);
            g += box([213.7, 32, 215.45, 42], C.coral, { op: 0.5 });
            g += DOOR(px(M.x1), pz(29.75), '') + DOOR(px(M.x1), pz(36.75), '') + T(px(M.x1) + 4, pz(23.5), 'two glass doors: food court ⇄ terrace', { fs: 10, a: 'start', c: C.red, b: true });
            g += T(px(X0) + 4, pz(Z0) + 18, 'UPPER FLOOR · 5.25 m', { a: 'start', fs: 16, b: true });
        }
        g += T(px(X1) - 22, pz(Z0) + 18, 'N ↑', { fs: 13, b: true }) + T(px(X1) - 8, pz(30), 'COAST ROAD · SEA →', { fs: 11, b: true, rot: -90 });
        return g;
    };
    b += plan(pad, 60, false) + plan(pad + W + 30, 60, true);
    b += T(pad, 60 + H + 22, 'Red dots are doors. Each is one door, at the same place outside and inside. Grid = 3.5 m squares. Glass roof: the vault over both concourses, the dome over the atrium; terracotta hip roofs over the four corner blocks.', { a: 'start', fs: 12 });
    fs.writeFileSync(path.join(OUT, '03_floors.svg'), svg(2 * W + pad * 2 + 30, H + 110, b, 'THE BAYSIDE MALL · 3 · THE FLOORS'));
})();

/* ── 04 · THE FRONTS + the section ── */
(function () {
    const s = 13; let b = '';
    const palm = (x, gy, h) => L(x, gy, x + 3, gy - h * s, '#7a5a34', 3) + [-1, 1, -0.4, 0.5].map(d => `<path d="M ${x + 3} ${gy - h * s} q ${d * 14} -12 ${d * 26} 4" stroke="#3f9a48" stroke-width="3" fill="none"/>`).join('');
    const person = (x, gy) => R(x - 2.5, gy - 1.8 * s, 5, 1.8 * s, C.ink, { sw: 0 });
    const hip = (xa, xb, py) => `<polygon points="${xa - 6},${py(M.eave)} ${xb + 6},${py(M.eave)} ${xb - 34},${py(M.eave + 2.7)} ${xa + 34},${py(M.eave + 2.7)}" fill="${C.terra}" stroke="${C.ink}"/>` + R((xa + xb) / 2 - 9, py(M.eave + 3.9), 18, 1.2 * s, C.cream) + `<polygon points="${(xa + xb) / 2 - 13},${py(M.eave + 3.9)} ${(xa + xb) / 2 + 13},${py(M.eave + 3.9)} ${(xa + xb) / 2},${py(M.eave + 4.9)}" fill="${C.terra}" stroke="${C.ink}"/>`;
    const portal = (xc, py, name, door) => {
        let g = `<path d="M ${xc - 7 * s} ${py(M.eave + 0.2)} A ${7 * s} ${(M.dome - M.eave - 2.2) * s} 0 0 1 ${xc + 7 * s} ${py(M.eave + 0.2)} Z" fill="${C.aqua}" stroke="${C.ink}" stroke-width="1.5"/>` + L(xc, py(M.dome - 2), xc, py(M.dome + 0.8), C.ink, 2);
        g += R(xc - 3.5 * s, py(9), 7 * s, 9 * s, C.glass) + `<path d="M ${xc - 3.5 * s} ${py(9)} A ${3.5 * s} ${3.6 * s} 0 0 1 ${xc + 3.5 * s} ${py(9)} Z" fill="${C.glass}" stroke="${C.ink}"/>`;
        for (let i = -2; i <= 2; i++) g += L(xc + i * 1.17 * s, py(11.5), xc + i * 1.17 * s, py(2.5), '#9fd8ee', 1);
        g += R(xc - 4.6 * s, py(13.0), 1.1 * s, 13 * s, C.coral) + R(xc + 3.5 * s, py(13.0), 1.1 * s, 13 * s, C.coral) + `<path d="M ${xc - 4.6 * s} ${py(13)} A ${4.6 * s} ${2.2 * s} 0 0 1 ${xc + 4.6 * s} ${py(13)} L ${xc + 3.5 * s} ${py(13)} A ${3.5 * s} ${1.4 * s} 0 0 0 ${xc - 3.5 * s} ${py(13)} Z" fill="${C.coral}" stroke="${C.ink}"/>`;
        g += R(xc - 6 * s, py(4.6), 12 * s, 1.3 * s, '#fff', { sw: 1 }) + T(xc, py(3.75), name, { fs: 13, c: '#e5484d', b: true });
        g += R(xc - 1.9 * s, py(2.5), 3.8 * s, 2.5 * s, '#9fd8ee') + L(xc, py(2.5), xc, py(0), C.ink, 1) + T(xc, py(1.0), door, { fs: 10 });
        return g;
    };
    /* EAST: seen from the pier; south is LEFT (z 42), north is RIGHT (z 3.5) */
    (function () {
        const ox = 150, gy = 330, px = z => ox + (M.z1 - z) * s, py = y => gy - y * s;
        b += T(40, gy - 21.6 * s, 'SEA FRONT (east) · what you see from the pier and the boardwalk · south is left', { a: 'start', fs: 15, b: true });
        b += L(40, gy, ox + 38.5 * s + 190, gy, C.ink, 2) + R(40, gy, 100, 14, C.sea, { sw: 0 }) + T(90, gy + 11, 'canal', { fs: 9, c: '#fff' });
        b += hip(px(42), px(24.5), py) + hip(px(17.5), px(3.5), py);
        b += R(px(42), py(M.eave), 17.5 * s, M.eave * s, C.sand) + R(px(17.5), py(M.eave), 14 * s, M.eave * s, C.cream);
        b += portal(px(21), py, 'THE BAYSIDE MALL', 'sea doors');
        /* the terrace + the colonnade, z 24.5..42 */
        b += R(px(42), py(M.f1 + 4.4), 17.5 * s, 4.1 * s, C.glass) + T(px(33.25), py(M.f1 + 3.1), 'FOOD COURT', { fs: 12, c: '#fff', b: true }) + T(px(33.25), py(M.f1 + 2.1), 'glass doors', { fs: 10, c: '#fff' });
        for (let z = 26.25; z < 42; z += 3.5) b += L(px(z + 1.75), py(M.f1 + 4.4), px(z + 1.75), py(M.f1 + 0.3), '#cfe6f2', 1.5);
        [29, 37].forEach(z => { b += `<polygon points="${px(z) - 26},${py(M.f1 + 2.2)} ${px(z) + 26},${py(M.f1 + 2.2)} ${px(z)},${py(M.f1 + 3.4)}" fill="${C.coral}" stroke="${C.ink}"/>` + L(px(z), py(M.f1 + 2.2), px(z), py(M.f1 + 0.4), C.ink, 1.5); });
        b += R(px(42), py(M.f1 + 0.4), 17.5 * s, 0.4 * s, C.cream) + R(px(42), py(M.f1 + 1.4), 17.5 * s, 0.1 * s, C.ink, { sw: 0 });
        for (let z = 26.25; z < 42; z += 3.5) b += L(px(z), py(M.f1 + 1.4), px(z), py(M.f1 + 0.4), C.ink, 1);
        for (let z = 28; z < 42; z += 5.83) b += R(px(z + 2.2), py(3.7), 4.4 * s, 3.4 * s, C.glass, { op: 0.9 });
        
        for (let z = 26.25; z < 42.1; z += 3.5) b += R(px(z) - 3.5, py(M.f1), 7, M.f1 * s, '#fff');
        b += L(px(42), py(0), px(33), py(M.f1), C.ink, 2.5) + L(px(42), py(1.1), px(33), py(M.f1 + 1.1), C.ink, 1) + T(px(44.5), py(2.2), 'terrace stair', { fs: 9 }) + T(px(33.25), py(-1.6), 'PRETZELS · THE GOO SHOP · SALT & LAMP under the colonnade', { fs: 10 });
        /* the north block: shop windows + the service corner */
        for (let z = 11.5; z < 17; z += 3.5) b += R(px(z + 2.6), py(3.6), 2.4 * s, 3.0 * s, C.glass) + R(px(z + 2.4), py(9.2), 2.0 * s, 2.8 * s, C.glass);
        b += R(px(9.9), py(3.4), 5.4 * s, 3.4 * s, C.grey); for (let i = 0; i < 6; i++) b += L(px(9.9), py(0.55 * i + 0.3), px(4.5), py(0.55 * i + 0.3), '#8a8d92', 1);
        b += T(px(7.2), py(3.8), 'loading', { fs: 9 }) + R(px(9.5), py(9.2), 2.0 * s, 2.8 * s, C.glass) + R(px(6.5), py(9.2), 2.0 * s, 2.8 * s, C.glass);
        /* the Juice dome in front of the north block (it stands today) */
        b += `<path d="M ${px(14)} ${py(3.4)} A ${5 * s} ${4.6 * s} 0 0 1 ${px(4)} ${py(3.4)} Z" fill="${C.orange}" stroke="${C.ink}" fill-opacity="0.9"/>` + R(px(17.5), py(3.4), 17.5 * s, 3.4 * s, C.cream, { op: 0.92 }) + T(px(8.75), py(1.4), 'JUICE (kept, in front)', { fs: 10 });
        b += palm(px(45), gy, 3.2) + person(px(22.5), gy) + person(px(30), gy) + person(px(34), py(M.f1 + 0.4)) + person(px(27.5), py(M.f1 + 0.4));
        const dx = px(3.5) + 30;
        b += L(dx, py(0), dx, py(M.dome), C.ink, 1) + [[0, '0'], [M.f1, '5.25 m upper floor'], [M.eave, '10.5 m eaves'], [M.vault, '13.5 m vault'], [M.dome, '19 m dome']].map(q => L(dx - 5, py(q[0]), dx + 5, py(q[0]), C.ink, 1) + T(dx + 9, py(q[0]) + 4, q[1], { a: 'start', fs: 10 })).join('');
        b += T(px(14), gy + 36, '↑ the pier is straight out from the sea doors', { fs: 12, c: C.red, b: true });
    })();
    /* WEST: seen from the Cordon plaza; north is LEFT */
    (function () {
        const ox = 150, gy = 690, px = z => ox + (z - M.z0) * s, py = y => gy - y * s;
        b += T(40, gy - 21.6 * s, 'PLAZA FRONT (west) · what you see from the Cordon plaza and the mall arch · north is left', { a: 'start', fs: 15, b: true });
        b += L(40, gy, ox + 38.5 * s + 190, gy, C.ink, 2);
        b += hip(px(3.5), px(17.5), py) + hip(px(24.5), px(42), py);
        b += R(px(3.5), py(M.eave), 14 * s, M.eave * s, C.cream) + R(px(24.5), py(M.eave), 17.5 * s, M.eave * s, C.sand);
        b += portal(px(21), py, 'THE BAYSIDE MALL', 'main doors');
        for (let z = 5; z < 16; z += 6.2) b += R(px(z), py(3.6), 4.6 * s, 3.1 * s, C.glass) + R(px(z + 0.6), py(9.2), 3.4 * s, 2.8 * s, C.glass);
        b += R(px(4.5), py(5.6), 12 * s, 1.1 * s, C.lilac) + T(px(10.5), py(4.85), 'ARCADE', { fs: 12, b: true });
        for (let z = 26; z < 41; z += 5.5) b += R(px(z), py(3.6), 4.2 * s, 3.1 * s, C.glass) + `<polygon points="${px(z) - 4},${py(3.9)} ${px(z) + 4.2 * s + 4},${py(3.9)} ${px(z) + 4.2 * s + 12},${py(3.0)} ${px(z) - 12},${py(3.0)}" fill="${C.coral}" stroke="${C.ink}"/>` + R(px(z + 0.4), py(9.2), 3.4 * s, 2.8 * s, C.glass);
        b += T(px(33.25), py(5.0), 'DOORS R US · SHOES · every window is a shop inside', { fs: 10 });
        b += palm(px(0.5), gy, 6) + palm(px(45), gy, 6) + person(px(18), gy) + person(px(30), gy);
    })();
    /* SECTION on the pier's line, looking north */
    (function () {
        const s2 = 7.2, ox = 40, gy = 1010, px = x => ox + (x - 150) * s2, py = y => gy - y * s2;
        b += T(40, gy - 23 * s2, 'SECTION on the pier’s line, looking north: the outside and the inside are one drawing', { a: 'start', fs: 15, b: true });
        b += R(px(259), py(-1.05), 44 * s2, 2 * s2, C.beach, { sw: 0 }) + R(px(284), py(-1.3), 19 * s2, 2 * s2, C.sea, { sw: 0 }) + L(px(150), gy, px(259), gy, C.ink, 2) + L(px(259), gy, px(259), py(-1.05), C.ink, 2);
        b += R(px(224), py(0.05), 14 * s2, 0.5 * s2, C.road, { sw: 0 }) + R(px(252), py(0.3), 7 * s2, 0.3 * s2, C.plank) + R(px(258.7), py(0.3), 44 * s2, 0.35 * s2, C.plank);
        for (let x = 264; x < 302; x += 7) b += L(px(x), py(0), px(x), py(-2.4), C.ink, 2);
        b += T(px(231), py(-1.6), 'coast road', { fs: 10 }) + T(px(255.5), py(-1.6), 'boardwalk', { fs: 10 }) + T(px(285), py(2), 'THE PIER →', { fs: 11, b: true }) + T(px(214), py(-1.6), 'sea front', { fs: 10 }) + T(px(160), py(-1.6), 'Cordon plaza', { fs: 10 });
        b += R(px(M.x0), py(M.eave), 35 * s2, M.eave * s2, '#fdfbf4', { sw: 3 });
        b += `<path d="M ${px(M.x0)} ${py(M.eave)} L ${px(182)} ${py(M.eave)} L ${px(182)} ${py(M.vault)} L ${px(M.x0)} ${py(M.vault)} Z" fill="${C.aqua}" fill-opacity="0.45" stroke="${C.ink}"/>` + `<path d="M ${px(196)} ${py(M.eave)} L ${px(M.x1)} ${py(M.eave)} L ${px(M.x1)} ${py(M.vault)} L ${px(196)} ${py(M.vault)} Z" fill="${C.aqua}" fill-opacity="0.45" stroke="${C.ink}"/>`;
        b += `<path d="M ${px(182)} ${py(M.eave + 1.5)} A ${7 * s2} ${(M.dome - M.eave - 1.5) * s2} 0 0 1 ${px(196)} ${py(M.eave + 1.5)}" fill="${C.aqua}" fill-opacity="0.6" stroke="${C.ink}" stroke-width="2"/>` + R(px(182), py(M.eave + 1.5), 14 * s2, 1.5 * s2, C.cream) + L(px(M.cx), py(M.dome), px(M.cx), py(M.dome + 1.6), C.ink, 2);
        b += R(px(M.x0), py(M.f1), 10.5 * s2, 0.35 * s2, C.ink, { sw: 0 }) + R(px(196), py(M.f1), 10.5 * s2, 0.35 * s2, C.ink, { sw: 0 });
        b += T(px(176.7), py(7.5), 'upper floor', { fs: 9 }) + T(px(201.2), py(7.5), 'upper floor', { fs: 9 });
        b += T(px(M.cx) + 150, py(16), '← THE DOME: outside the landmark, inside the atrium’s roof', { fs: 11, b: true, a: 'start' });
        b += R(px(M.cx - 3), py(0.5), 6 * s2, 0.5 * s2, C.aqua) + T(px(M.cx), py(1.2), 'fountain', { fs: 9 });
        b += R(px(M.x0) - 3, py(2.5), 6, 2.5 * s2, C.red, { sw: 0 }) + R(px(M.x1) - 3, py(2.5), 6, 2.5 * s2, C.red, { sw: 0 }) + T(px(M.x0) - 6, py(3.3), 'main doors', { fs: 10, c: C.red, b: true, a: 'end' }) + T(px(M.x1) + 6, py(3.3), 'sea doors', { fs: 10, c: C.red, b: true, a: 'start' });
        b += L(px(M.cx + 3.5), py(1.7), px(300), py(1.7), C.red, 1.2, '8 5') + T(px(248), py(3.4), 'from the fountain you see out of the sea doors and down the pier', { fs: 10, c: C.red });
        b += person(px(160), gy) + person(px(185), gy) + person(px(256), py(0.3)) + person(px(275), py(0.35)) + palm(px(231), gy, 3.2 * s2 / s);
    })();
    fs.writeFileSync(path.join(OUT, '04_elevations.svg'), svg(1240, 1050, b, 'THE BAYSIDE MALL · 4 · THE FRONTS AND THE SECTION'));
})();

/* PNGs, when the probe's browser is here */
(async () => {
    let pw; try { pw = require(path.join(__dirname, '../../../node_modules/playwright')); } catch (e) { console.log('SVGs written (no playwright: no PNGs)'); return; }
    const br = await pw.chromium.launch({ executablePath: process.env.EW_CHROME || require('../../../probe-fast.js').EXE || undefined, args: ['--no-sandbox'] }); const pg = await br.newPage();
    for (const f of fs.readdirSync(OUT).filter(f => f.endsWith('.svg'))) {
        const t = fs.readFileSync(path.join(OUT, f), 'utf8'), m = /width="(\d+(?:\.\d+)?)" height="(\d+(?:\.\d+)?)"/.exec(t);
        await pg.setViewportSize({ width: Math.ceil(+m[1]), height: Math.ceil(+m[2]) }); await pg.setContent('<body style="margin:0">' + t + '</body>');
        await pg.screenshot({ path: path.join(OUT, f.replace('.svg', '.png')) }); console.log('wrote', f.replace('.svg', '.png'));
    }
    await br.close();
})();
