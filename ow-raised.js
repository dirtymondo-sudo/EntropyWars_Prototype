/* ow-raised.js — THE RAISED HIGHWAY (2026-11-22, mondo: "I want actual highway architecture, raised off the ground with exits and stuff. Right now it
   looks like the road is just painted on the ground" · on the plan: "make sure the exit ramp actually branches off from the highway" · "make sure the
   road doesnt abruptly stop at teh edge of the map, need to see the road continue beyond it").
   Repo tooling, called by bake-route.js for a `look: 'highway'` route whose spec says

     "raised": { "h": 7, "up": [21, 33], "down": [87, 99],                       squares along the road (room rows): the ramp up, the ramp down
                 "exit": { "aux": 6, "slip": 12, "cross": [59, 61] },            an exit: lanes beside the deck, the four ramps, the road under (rows)
                 "flat": [[x0, y0, x1, y1], ...] }                               more squares laid dead flat (a forecourt, a car park)

   Never loaded by the game. The road must run north to south (a straight middle line down the rows) between `up[0]` and `down[1]`.

   WHAT IT MAKES
     · the walk: two `ramp` rows on the field (the fill), one `bridge` row (the deck: a second surface, the ground under it stays walked), `bridge`
       rows for the lanes beside it, four `ramp` rows for the exit, ghost `wall` rows for every barrier (they stop the walker, and their tops are the
       grind rails, on the line the barrier is drawn on) and for the pillars;
     · the look: `arch` rows (three-renderer.js THE ARCHITECTURE; `shear` slopes a part with its ramp): the slab, the girders, the pillars and their
       cap beams, the abutments, the ramps' retaining walls, concrete barriers on both edges and down the middle, the lane paint, the light poles;
     · the ground: asphalt on the ramps, the lanes to the road under the deck and that road; bare ground and a dirt track under the deck;
     · the road under the deck runs on over the land past both walls (`terrain.edges.roads`, three-renderer.js THE ROAD RUNS ON PAST THE LINE) behind a
       row of barrels (no zone lies out there);
     · the cars: every car line of the room wears `deck: true` (three-renderer.js _hqCarGround) and two more lines take the exit and come back on.
   HEIGHTS: all absolute (`absY`), over ground laid flat at 0 under the whole structure. */
'use strict';
module.exports = function raise(K) {
    const { SPEC, C, W, Dq, r2, gx, gz, Hc, plotOf, floorAt, setPaint, ASPH, SHOULDER, marks, F, props, clear, feat, TRAFFIC, LINE, laneLine, edgeRoads, CAT, errs, ID } = K;
    const RZ = SPEC.raised, H = RZ.h || 7, U0 = RZ.up[0], U1 = RZ.up[1], D0 = RZ.down[0], D1 = RZ.down[1], EX = RZ.exit || null;
    const XC = RZ.x != null ? RZ.x : Math.round(LINE[LINE.length - 2][0]), HW = 4;   // the middle line (a square line) and half the road in squares
    const xc = gx(XC), RW = HW * C, OV = 0.6, TH = 1.5, BH = 0.9;   // metres: the middle, half the road, the parapet's strip past the road, the deck's depth, a barrier's height
    const Z = gz, LEN = (D0 - U1) * C, zDeck = (Z(U1) + Z(D0)) / 2;
    const CONC = 'urban:ConcretePanels1a', CT = 0xcfcbc2, CD = 0x9c988f, WHITE = 0xf0f0f0, YEL = 0xe8b830, STEEL = 'urban:MetalWallRibbed1a';
    const A = EX ? EX.aux : 0, S = EX ? EX.slip : 0, gN = U1 + A + S, gS = D0 - A - S, CR = EX ? EX.cross : null;
    const xl = sd => r2(xc + sd * (RW + C));   // an exit lane's middle (two squares beside the road)
    if (EX && (gN > CR[0] || gS < CR[1])) errs.push('raised: the exit ramps reach past the road under the deck');
    const hMain = y => y <= U0 ? 0 : y < U1 ? H * (y - U0) / (U1 - U0) : y <= D0 ? H : y < D1 ? H * (D1 - y) / (D1 - D0) : 0;

    /* ── 1. the ground under it: dead flat at 0 (the fill, the pillars' feet, the lanes, the road under) ── */
    const flatK = (x, y) => { let d = Math.max(Math.abs(x - XC) - (HW + 4), U0 - 2 - y, y - (D1 + 2), 0);
        if (CR) d = Math.min(d, Math.max(CR[0] - 2 - y, y - (CR[1] + 2), 0));
        (RZ.flat || []).forEach(q => { d = Math.min(d, Math.max(q[0] - x, x - q[2], q[1] - y, y - q[3], 0)); });
        return Math.min(1, d / 3); };
    for (let y = 0; y <= Dq; y++) for (let x = 0; x <= W; x++) Hc[y * (W + 1) + x] *= flatK(x, y);
    K.reslope();

    /* ── 2. the kit's ground-level pieces go from under it: the lane paint and the shoulder rails between the ramps' feet, every prop on its squares ── */
    const z0m = Z(U0), z1m = Z(D1);
    for (let i = marks.length - 1; i >= 0; i--) { const m = marks[i]; if (m.k !== 'line' || Math.abs(m.x0 - m.x1) > 0.01 || Math.abs(m.x0 - xc) > RW + 2 * C) continue;
        const a = Math.min(m.z0, m.z1), b = Math.max(m.z0, m.z1); if (b <= z0m || a >= z1m) continue;
        marks.splice(i, 1); if (a < z0m - 0.05) marks.push(Object.assign({}, m, { z0: a, z1: z0m })); if (b > z1m + 0.05) marks.push(Object.assign({}, m, { z0: z1m, z1: b })); }
    for (let i = F.length - 1; i >= 0; i--) { const f = F[i]; if (f.k === 'rail' && Math.abs(f.x0 - f.x1) < 0.01 && Math.abs(f.x0 - xc) < RW + 3 * C && Math.max(f.z0, f.z1) > z0m - 1 && Math.min(f.z0, f.z1) < z1m + 1) F.splice(i, 1); }
    clear(XC - HW - 3, U0, XC + HW + 2, D1 - 1);
    if (CR) clear(0, CR[0], W - 1, CR[1] - 1);

    /* ── 3. the paint ── */
    for (let y = U0; y < D1; y++) for (let x = XC - HW; x < XC + HW; x++) setPaint(x, y, (y < U1 || y >= D0) ? ASPH : (x === XC - 1 || x === XC) ? SHOULDER : floorAt(x, y));
    /* on the ground either end of it the asphalt is as wide as on the deck (the kit's shoulder squares were dirt under the white edge lines) */
    for (let y = Math.ceil(LINE[LINE.length - 2][1]); y < Dq; y++) { if (y >= U0 && y < D1) continue; setPaint(XC - HW, y, ASPH); setPaint(XC + HW - 1, y, ASPH); }
    if (EX) { for (const sd of [-1, 1]) { const c0 = sd < 0 ? XC - HW - 2 : XC + HW; for (let x = c0; x < c0 + 2; x++) for (let y = U1; y < D0; y++) setPaint(x, y, (y < U1 + A || y >= D0 - A) ? floorAt(x, y) : ASPH); }
        for (let y = CR[0]; y < CR[1]; y++) for (let x = 0; x < W; x++) setPaint(x, y, ASPH); }

    /* ── 4. the walk ── */
    const wall = (x0, z0, x1, z1, o) => feat(Object.assign({ k: 'wall', ghost: true, x0: r2(x0), z0: r2(z0), x1: r2(x1), z1: r2(z1), t: 0.6, h: BH, absY: true }, o));
    /* a barrier along z from square row a to b at x, the road's height under it given by hOf(row): hung over the ground where the road is the deck */
    const barrier = (x, a, b, hOf, hung) => { for (let y = a; y < b - 1e-6; y += 1) { const y2 = Math.min(b, y + 1), ha = hOf(y), hb = hOf(y2);
        if (hung) wall(x, Z(y), x, Z(y2), { y0: H, y: H + BH }); else wall(x, Z(y), x, Z(y2), Object.assign({ y: r2(Math.max(ha, hb) + BH) }, Math.abs(ha - hb) > 0.01 ? { rail: [r2(ha + BH), r2(hb + BH)] } : null)); } };
    feat({ k: 'ramp', id: 'hw:' + ID + ':up', x0: xc, z0: Z(U0), x1: xc, z1: Z(U1), w: 2 * RW, h0: 0, h1: H, edge: 0.01, absY: true });
    feat({ k: 'ramp', id: 'hw:' + ID + ':down', x0: xc, z0: Z(D1), x1: xc, z1: Z(D0), w: 2 * RW, h0: 0, h1: H, edge: 0.01, absY: true });
    feat({ k: 'bridge', id: 'hw:' + ID + ':deck', x0: xc, z0: r2(Z(U1) - 0.5), x1: xc, z1: r2(Z(D0) + 0.5), w: r2(2 * (RW + OV)), y: H, thick: TH, rails: false, hide: true, absY: true });
    const E = RW + 0.3;   // a parapet's own line, from the middle
    barrier(xc, U0 + 1, U1, hMain, false); barrier(xc, U1, D0, hMain, true); barrier(xc, D0, D1 - 1, hMain, false);   // the middle
    for (const sd of [-1, 1]) {
        barrier(xc + sd * E, U0, U1, hMain, false); barrier(xc + sd * E, D0, D1, hMain, false);
        if (!EX) { barrier(xc + sd * E, U1, D0, hMain, true); continue; }
        barrier(xc + sd * E, U1 + A, D0 - A, hMain, true);   // the deck's edge between the two lanes beside it (the ramps fall away under it)
        const lx = xl(sd), lo = lx + sd * (C + 0.3);         // the lane's middle, its outer parapet's line
        [[U1, U1 + A, U1 + A, gN], [D0 - A, D0, D0 - A, gS]].forEach(([a0, a1, top, foot], n) => {
            feat({ k: 'bridge', id: 'hw:' + ID + ':lane' + (sd < 0 ? 'w' : 'e') + n, x0: r2(lx - sd * 0.25), z0: r2(Z(a0) - 0.5), x1: r2(lx - sd * 0.25), z1: r2(Z(a1) + 0.5), w: r2(2 * C + 2 * OV + 0.5), y: H, thick: TH, rails: false, hide: true, absY: true });
            feat({ k: 'ramp', id: 'hw:' + ID + ':slip' + (sd < 0 ? 'w' : 'e') + n, x0: lx, z0: Z(foot), x1: lx, z1: Z(top), w: 2 * C, h0: 0, h1: H, edge: 0.01, absY: true });
            const hS = y => H * Math.abs(y - foot) / S, r0 = Math.min(top, foot), r1 = Math.max(top, foot);
            barrier(lo, a0, a1, () => H, true); barrier(lo, r0, r1, hS, false);            // the outer side: the lane, then the ramp
            barrier(xc + sd * E, r0, r1, hS, false);                                        // the ramp's inner side (under the deck's edge)
            const zc = n === 0 ? Z(a0) + 0.3 : Z(a1) - 0.3; wall(lx - sd * (C + 0.3), zc, lx + sd * (C + 0.3), zc, { y0: H, y: H + BH });   // the lane's closed end
        });
    }
    /* the pillars: every six squares, never on the road under the deck (a pair either side of it) */
    const PIERS = []; for (let y = U1 + 3; y <= D0 - 3; y += 6) { if (CR && y > CR[0] - 4 && y < CR[1] + 4) continue; PIERS.push(y); }
    if (CR) PIERS.push(CR[0] - 1.5, CR[1] + 1.5); PIERS.sort((a, b) => a - b);
    const laneAt = y => EX && ((y >= U1 && y <= U1 + A) || (y >= D0 - A && y <= D0));
    const cols = y => laneAt(y) ? [-RW - C, -7, 7, RW + C] : [-7, 7];
    PIERS.forEach(y => cols(y).forEach(o => wall(xc + o - 0.35, Z(y), xc + o + 0.35, Z(y), { t: 1.9, y: H - TH, rail: false })));

    /* ── 5. the look ── */
    const row = (id, x, z, parts) => feat({ k: 'arch', id: 'hw:' + ID.toLowerCase() + ':' + id, x: r2(x), z: r2(z), rot: 0, y: 0, parts });
    const R3 = v => Math.round(v * 1000) / 1000;
    /* a concrete barrier from (x, za, ya) to (x, zb, yb) in a row at (rx, rz): a wide foot and a narrow head, sloped with the road */
    const jersey = (P, rx, rz, x, za, zb, ya, yb) => { const up = yb >= ya, lo = up ? za : zb, hi = up ? zb : za, L = Math.abs(zb - za), rise = Math.abs(yb - ya), ry = hi > lo ? 0 : 180, sh = rise > 0.001 ? { shear: [R3(rise), R3(L)] } : null;
        P.push(Object.assign({ s: 'box', p: [R3(x - rx), R3(Math.min(ya, yb)), R3((za + zb) / 2 - rz)], ry, size: [0.6, 0.5, R3(L)], key: CONC, tint: CT, uv: 3.5 }, sh),
               Object.assign({ s: 'box', p: [R3(x - rx), R3(Math.min(ya, yb) + 0.5), R3((za + zb) / 2 - rz)], ry, size: [0.32, BH - 0.5, R3(L)], key: CONC, tint: CT, uv: 3.5 }, sh)); };
    /* a paint line lying on the road from za (height ya) to zb (yb), `dash` = [on, gap] metres */
    const paintLine = (P, rx, rz, x, za, zb, ya, yb, w, color, dash) => { const up = yb >= ya, lo = up ? za : zb, hi = up ? zb : za, L = Math.abs(zb - za), rise = Math.abs(yb - ya), dir = hi > lo ? 1 : -1, ry = dir > 0 ? 0 : 180, y0 = Math.min(ya, yb) + 0.035;
        if (!dash) { P.push(Object.assign({ s: 'quad', flat: true, p: [R3(x - rx), R3(y0), R3((za + zb) / 2 - rz)], ry, size: [w, R3(L)], tint: color }, rise > 0.001 ? { shear: [R3(rise), R3(L)] } : null)); return; }
        const per = dash[0] + dash[1], n = Math.floor((L - dash[0]) / per) + 1, k = rise / L; if (n < 1) return;
        P.push(Object.assign({ s: 'quad', flat: true, p: [R3(x - rx), R3(y0 + k * 0), R3(lo + dir * dash[0] / 2 - rz)], ry, size: [w, dash[0]], tint: color, n, step: [0, R3(k * per), R3(dir * per)] }, rise > 0.001 ? { shear: [R3(k * dash[0]), dash[0]] } : null)); };
    /* a ramp's retaining wall on the side `sd` of the line x: a body `thick` wide whose top lies in the road's plane (the field's own bank is inside it) */
    const retain = (P, rx, rz, x, sd, zFoot, zTop, thick) => { const L = Math.abs(zTop - zFoot), ry = zTop > zFoot ? 0 : 180;
        P.push({ s: 'box', p: [R3(x + sd * thick / 2 - rx), -H, R3((zFoot + zTop) / 2 - rz)], ry, size: [thick, H, R3(L)], shear: [H, R3(L)], key: CONC, tint: CT, uv: 3.5 }); };
    const lanePaint = (P, rx, rz, za, zb, ya, yb) => { for (const sd of [-1, 1]) {
        paintLine(P, rx, rz, xc + sd * 2.1, za, zb, ya, yb, 0.16, YEL); paintLine(P, rx, rz, xc + sd * 11.9, za, zb, ya, yb, 0.14, WHITE);
        [5.25, 8.75].forEach(o => paintLine(P, rx, rz, xc + sd * o, za, zb, ya, yb, 0.14, WHITE, [7, 7])); } };

    /* the deck: the slab (asphalt on top), five girders, the abutments under its two ends, its parapets, its paint */
    { const P = [], rx = xc, rz = zDeck;
      P.push({ s: 'box', p: [0, H - 0.5, 0], size: [R3(2 * (RW + OV)), 0.5, R3(LEN)], key: CONC, tint: CT, keyTop: ASPH, under: true, uv: 3.5 });
      [-11, -5.5, 0, 5.5, 11].forEach(o => P.push({ s: 'box', p: [o, H - TH, 0], size: [1.0, TH - 0.5, R3(LEN - 1)], key: CONC, tint: CD, top: false, under: true, uv: 3.5 }));
      for (const e of [-1, 1]) P.push({ s: 'box', p: [0, 0, R3(e * (LEN / 2 - 1.05))], size: [R3(2 * (RW + OV)), H - 0.5, 2.1], key: CONC, tint: CT, top: false, uv: 3.5 });
      jersey(P, rx, rz, xc, Z(U1), Z(D0), H, H);
      for (const sd of [-1, 1]) { if (!EX) { jersey(P, rx, rz, xc + sd * E, Z(U1), Z(D0), H, H); continue; }
          jersey(P, rx, rz, xc + sd * E, Z(U1 + A), Z(D0 - A), H, H);
          const lx = xl(sd), lo = lx + sd * (C + 0.3);
          [[U1, U1 + A], [D0 - A, D0]].forEach(([a0, a1], n) => { const zm = (Z(a0) + Z(a1)) / 2, L = (a1 - a0) * C;
              P.push({ s: 'box', p: [R3(lx + sd * OV / 2 - rx), H - 0.5, R3(zm - rz)], size: [R3(2 * C + OV), 0.5, R3(L)], key: CONC, tint: CT, keyTop: ASPH, under: true, uv: 3.5 },
                     { s: 'box', p: [R3(lx - rx), H - TH, R3(zm - rz)], size: [1.0, TH - 0.5, R3(L)], key: CONC, tint: CD, top: false, under: true, uv: 3.5 });
              jersey(P, rx, rz, lo, Z(a0), Z(a1), H, H);
              const zc = n === 0 ? Z(a0) + 0.3 : Z(a1) - 0.3; P.push({ s: 'box', p: [R3(lx - rx), H, R3(zc - rz)], size: [R3(2 * C + 0.6), 0.5, 0.6], key: CONC, tint: CT, uv: 3.5 }, { s: 'box', p: [R3(lx - rx), H + 0.5, R3(zc - rz)], size: [R3(2 * C + 0.6), BH - 0.5, 0.32], key: CONC, tint: CT, uv: 3.5 });
              /* the lane's paint: its outer edge, short dashes where it leaves the road, the white wedge where the ramp parts from it */
              paintLine(P, rx, rz, lx + sd * (C - 0.5), Z(a0), Z(a1), H, H, 0.14, WHITE);
              /* under the ramp's top end: its abutment */
              const zt = n === 0 ? Z(a1) - 1.05 : Z(a0) + 1.05; P.push({ s: 'box', p: [R3(lx - rx), 0, R3(zt - rz)], size: [R3(2 * C + 2 * OV), H - 0.5, 2.1], key: CONC, tint: CT, top: false, uv: 3.5 }); });
      }
      /* the paint: the middle's yellow lines, the edges, the lane dashes; an edge line is short dashes along a lane beside the deck */
      for (const sd of [-1, 1]) { paintLine(P, rx, rz, xc + sd * 2.1, Z(U1), Z(D0), H, H, 0.16, YEL);
          [5.25, 8.75].forEach(o => paintLine(P, rx, rz, xc + sd * o, Z(U1), Z(D0), H, H, 0.14, WHITE, [7, 7]));
          if (!EX) paintLine(P, rx, rz, xc + sd * 11.9, Z(U1), Z(D0), H, H, 0.14, WHITE);
          else { paintLine(P, rx, rz, xc + sd * 11.9, Z(U1 + A), Z(D0 - A), H, H, 0.14, WHITE); paintLine(P, rx, rz, xc + sd * 11.9, Z(U1), Z(U1 + A), H, H, 0.2, WHITE, [1.75, 1.75]); paintLine(P, rx, rz, xc + sd * 11.9, Z(D0 - A), Z(D0), H, H, 0.2, WHITE, [1.75, 1.75]); } }
      row('deck', rx, rz, P); }
    /* the pillars: a cap beam on round columns, a footing under each */
    { const P = [], rx = xc, rz = zDeck;
      PIERS.forEach(y => { const cs = cols(y), w = cs[cs.length - 1] - cs[0] + 5; P.push({ s: 'box', p: [0, H - TH - 1.2, R3(Z(y) - rz)], size: [R3(w), 1.2, 2.0], key: CONC, tint: CT, under: true, uv: 3.5 });
          cs.forEach(o => P.push({ s: 'cyl', p: [o, 0, R3(Z(y) - rz)], r: 0.9, h: R3(H - TH - 1.2), seg: 14, key: CONC, tint: CT, cap: false, uv: 3.5 }, { s: 'box', p: [o, 0, R3(Z(y) - rz)], size: [2.8, 0.35, 2.8], key: CONC, tint: CD, uv: 3.5 })); });
      row('piers', rx, rz, P); }
    /* the two ramps: retaining walls with the parapet on them, the middle barrier, the paint */
    [['up', U0, U1], ['down', D1, D0]].forEach(([id, foot, top]) => { const P = [], rx = xc, rz = (Z(foot) + Z(top)) / 2;
        for (const sd of [-1, 1]) { retain(P, rx, rz, xc + sd * (RW - 0.05), sd, Z(foot), Z(top), 2.1); jersey(P, rx, rz, xc + sd * E, Z(foot), Z(top), 0, H); }
        const f1 = foot + Math.sign(top - foot); jersey(P, rx, rz, xc, Z(f1), Z(top), hMain(f1), H);
        lanePaint(P, rx, rz, Z(foot), Z(top), 0, H);
        row(id, rx, rz, P); });
    /* the exit's four ramps */
    if (EX) for (const sd of [-1, 1]) [[U1 + A, gN], [D0 - A, gS]].forEach(([top, foot], n) => { const P = [], lx = xl(sd), rx = lx, rz = (Z(foot) + Z(top)) / 2;
        retain(P, rx, rz, lx + sd * (C - 0.05), sd, Z(foot), Z(top), 2.1); retain(P, rx, rz, lx - sd * (C - 0.05), -sd, Z(foot), Z(top), 2.1);
        jersey(P, rx, rz, lx + sd * (C + 0.3), Z(foot), Z(top), 0, H); jersey(P, rx, rz, xc + sd * E, Z(foot), Z(top), 0, H);
        paintLine(P, rx, rz, lx + sd * (C - 0.5), Z(foot), Z(top), 0, H, 0.14, WHITE); paintLine(P, rx, rz, lx - sd * (C - 1.1), Z(foot), Z(top), 0, H, 0.14, YEL);
        row('slip' + (sd < 0 ? 'w' : 'e') + n, rx, rz, P); });
    /* the lights: a pole on the parapet every eight squares, the two sides staggered */
    { const P = [], rx = xc, rz = zDeck; let n = 0;
      for (let y = U0 + 4; y <= D1 - 4; y += 4) { const sd = (n++ % 2) ? 1 : -1; if (laneAt(y) || (EX && ((y > U1 + A && y < gN) || (y > gS && y < D0 - A)))) continue; const h = hMain(y), x = sd * (E + 0.05);
          P.push({ s: 'box', p: [x, R3(h + BH), R3(Z(y) - rz)], size: [0.2, 8.2, 0.2], key: STEEL, tint: 0x70767c }, { s: 'box', p: [R3(x - sd * 1.5), R3(h + BH + 8.1), R3(Z(y) - rz)], size: [3.2, 0.14, 0.18], key: STEEL, tint: 0x70767c },
                 { s: 'box', p: [R3(x - sd * 2.8), R3(h + BH + 7.95), R3(Z(y) - rz)], size: [1.1, 0.14, 0.42], tint: 0xfff0c0, glow: 0.9 }); }
      row('lights', rx, rz, P); }

    /* ── 6. the road under the deck: its middle line, the barrels at the room's line, the road running on past both walls ── */
    if (CR) { const zc = r2((Z(CR[0]) + Z(CR[1])) / 2), wd = (CR[1] - CR[0]) * C;
        marks.push({ k: 'line', x0: gx(1), z0: zc, x1: gx(W - 1), z1: zc, w: 0.16, color: YEL });
        for (const sd of [-1, 1]) { edgeRoads.push({ side: sd < 0 ? 'w' : 'e', at: zc, w: wd, key: ASPH, line: YEL });
            if (CAT.traffic_barrel) [-2.6, -0.9, 0.9, 2.6].forEach((o, i) => props.push({ key: 'traffic_barrel', x: r2(sd < 0 ? gx(1) + 0.5 : gx(W - 1) - 0.5), z: r2(zc + o), face: i * 70 })); } }

    /* ── 7. the cars: two lines take the exit, cross the road under the deck and come back on ── */
    if (EX && SPEC.cars) for (const sd of [-1, 1]) { const main = laneLine(2, sd > 0), lx = xl(sd) + sd * 0.3, mx = xc + sd * 7, dir = sd < 0 ? 1 : -1;   // west: south-bound (north to south); east: north-bound
        const a = dir > 0 ? U1 : D0, b = dir > 0 ? D0 : U1, zA = Z(a), zB = Z(b), before = main.filter(q => dir * (q[1] - zA) < 0), after = main.filter(q => dir * (q[1] - zB) > 0);
        const mid = [[mx, zA + dir * 3.5], [lx, zA + dir * (A * C - 3.5)], [lx, zB - dir * (A * C - 3.5)], [mx, zB - dir * 3.5]].map(q => [r2(q[0]), r2(q[1])]);
        TRAFFIC.push({ pts: before.concat(mid, after), loop: false, n: 1, speed: Math.max(6, (SPEC.cars.speed || 10) - 2), lane: 0.01, deck: true, kinds: sd < 0 ? ['suv', 'taxi'] : ['cadillac', 'suv'] }); }

    return { XC, HW, U0, U1, D0, D1, H, A, S, gN, gS, CR, hMain, xc, xl, E, RW };
};
