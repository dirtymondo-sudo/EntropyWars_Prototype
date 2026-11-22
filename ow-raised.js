/* ow-raised.js — THE RAISED HIGHWAY (2026-11-22, mondo: "I want actual highway architecture, raised off the ground with exits and stuff. Right now it
   looks like the road is just painted on the ground" · on the plan: "make sure the exit ramp actually branches off from the highway" · "make sure the
   road doesnt abruptly stop at teh edge of the map, need to see the road continue beyond it").
   Repo tooling, called by bake-route.js for a `look: 'highway'` route whose spec says

     "raised": { "h": 7, "up": [21, 33], "down": [87, 99],                       squares along the road (room rows): the ramp up, the ramp down
                 "exit": { "taper": 3, "lane": 4, "diverge": 7, "slip": 12,       an exit, in squares from the deck's end: the lane opens (taper), runs beside
                           "cross": [59, 61] },                                  the road (lane), peels away (diverge), then the ramp (slip) down to the road under (rows)
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
    const T = EX ? (EX.taper || 3) : 0, LN = EX ? (EX.lane || 4) : 0, DV = EX ? (EX.diverge || 7) : 0, A = T + LN + DV, S = EX ? EX.slip : 0, gN = U1 + A + S, gS = D0 - A - S, CR = EX ? EX.cross : null;
    /* THE EXIT'S PLAN (2026-11-22, mondo: "The exit ramp looks stupid, that is not how highways look, the lane lines need to actualy make sense"), the same at
       its four corners, `t` = squares from the deck's end toward the road under it, `u` = metres out from the middle line:
         t 0..T        the lane OPENS: the deck widens from the road's edge (u 14) to u 17.5, the right edge line runs out with it
         t T..T+LN     the exit lane beside the road (u 11.9..15.6), a dotted line between it and the through lane
         t T+LN..A     it PEELS AWAY: the lane's two edge lines run out to the ramp (u 18.4..23.6), the deck widens to u 24.5, the painted gore
                       (chevrons) opens between the through lane and the lane, and from t NOSE a wall stands in it
         t A..A+S      the ramp, one lane (u 17.5..24.5), straight down to the road under the deck; a stop line at its foot on the two ramps that come off */
    const UR = 17.5, UO = 24.5, UL0 = 11.9, UL1 = 15.6, RL = 18.4, RR = 23.6, GS = T + LN + 1.5, NOSE = T + LN + 5, UM = (UR + UO) / 2;
    const tz = (n, t) => n === 0 ? Z(U1 + t) : Z(D0 - t), tdir = n => n === 0 ? 1 : -1, ux = (sd, u) => xc + sd * u;
    const slabOut = t => t <= T ? RW + (UR + OV - RW) * Math.max(0, t) / T : t <= T + LN ? UR + OV : UR + OV + (UO - UR) * Math.min(1, (t - T - LN) / (DV - 2));   // the widened deck's outer edge
    const exitT = y => Math.min(y - U1, D0 - y);   // a row's `t` at the nearer corner
    const xl = sd => r2(xc + sd * UM);   // an exit ramp's middle
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
    /* on the ground either end of it the asphalt reaches past the white edge lines everywhere, also down a bend's diagonal (the kit's shoulder squares were
       dirt under the lines, in steps along a diagonal): every square whose middle lies within 4.3 squares of the middle line */
    { const dSeg = (px, py, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy || 1, u = Math.max(0, Math.min(1, ((px - a[0]) * dx + (py - a[1]) * dy) / L2)); return Math.hypot(px - a[0] - dx * u, py - a[1] - dy * u); };
      for (let y = 0; y < Dq; y++) { if (y >= U0 && y < D1) continue; for (let x = 0; x < W; x++) { let d = 1e9; for (let i = 0; i + 1 < LINE.length; i++) d = Math.min(d, dSeg(x + 0.5, y + 0.5, LINE[i], LINE[i + 1])); if (d <= 4.3) setPaint(x, y, ASPH); } } }
    if (EX) { for (const sd of [-1, 1]) { const c0 = sd < 0 ? XC - HW - 3 : XC + HW + 1; for (let x = c0; x < c0 + 2; x++) for (let y = U1; y < D0; y++) setPaint(x, y, (y < U1 + A || y >= D0 - A) ? floorAt(x, y) : ASPH);
            const c1 = sd < 0 ? XC - HW - 1 : XC + HW; for (let y = U1; y < D0; y++) if (!(y >= CR[0] && y < CR[1])) setPaint(c1, y, floorAt(c1, y)); }
        for (let y = CR[0]; y < CR[1]; y++) for (let x = 0; x < W; x++) setPaint(x, y, ASPH); }

    /* ── 4. the walk ── */
    const wall = (x0, z0, x1, z1, o) => feat(Object.assign({ k: 'wall', ghost: true, x0: r2(x0), z0: r2(z0), x1: r2(x1), z1: r2(z1), t: 0.6, h: BH, absY: true }, o));
    /* a barrier along z from square row a to b at x, the road's height under it given by hOf(row): hung over the ground where the road is the deck */
    const barrier = (x, a, b, hOf, hung) => { for (let y = a; y < b - 1e-6; y += 1) { const y2 = Math.min(b, y + 1), ha = hOf(y), hb = hOf(y2);
        if (hung) wall(x, Z(y), x, Z(y2), { y0: H, y: H + BH }); else wall(x, Z(y), x, Z(y2), Object.assign({ y: r2(Math.max(ha, hb) + BH) }, Math.abs(ha - hb) > 0.01 ? { rail: [r2(ha + BH), r2(hb + BH)] } : null)); } };
    feat({ k: 'ramp', id: 'hw:' + ID + ':up', x0: xc, z0: Z(U0), x1: xc, z1: Z(U1), w: 2 * RW + 0.2, h0: 0, h1: H, edge: 0.01, absY: true });
    feat({ k: 'ramp', id: 'hw:' + ID + ':down', x0: xc, z0: Z(D1), x1: xc, z1: Z(D0), w: 2 * RW + 0.2, h0: 0, h1: H, edge: 0.01, absY: true });
    feat({ k: 'bridge', id: 'hw:' + ID + ':deck', x0: xc, z0: r2(Z(U1) - 0.5), x1: xc, z1: r2(Z(D0) + 0.5), w: r2(2 * (RW + OV)), y: H, thick: TH, rails: false, hide: true, absY: true });
    const E = RW + 0.3;   // a parapet's own line, from the middle
    barrier(xc, U0 + 1, U1, hMain, false); barrier(xc, U1, D0, hMain, true); barrier(xc, D0, D1 - 1, hMain, false);   // the middle
    for (const sd of [-1, 1]) {
        barrier(xc + sd * E, U0, U1, hMain, false); barrier(xc + sd * E, D0, D1, hMain, false);
        if (!EX) { barrier(xc + sd * E, U1, D0, hMain, true); continue; }
        barrier(xc + sd * E, U1 + NOSE, D0 - NOSE, hMain, true);   // the deck's edge between the two gores (the ramps fall away beside it)
        for (const n of [0, 1]) { const tg = (n === 0 ? 'n' : 's') + (sd < 0 ? 'w' : 'e'), d = tdir(n), zt = t => tz(n, t);
            const hung = (ua, ta, ub, tb) => wall(ux(sd, ua), zt(ta), ux(sd, ub), zt(tb), { y0: H, y: H + BH });
            const br = (id, u0, u1, ta, tb) => feat({ k: 'bridge', id: 'hw:' + ID + ':' + id + tg, x0: r2(ux(sd, (u0 + u1) / 2)), z0: r2(zt(ta) - d * 0.3), x1: r2(ux(sd, (u0 + u1) / 2)), z1: r2(zt(tb) + d * 0.3), w: r2(u1 - u0), y: H, thick: TH, rails: false, hide: true, absY: true });
            br('lane', RW - 0.5, UR + OV, 0, T + LN);
            for (let k = 0; k < DV; k++) br('div' + k, RW - 0.5, slabOut(T + LN + k + 1), T + LN + k, T + LN + k + 1);
            feat({ k: 'ramp', id: 'hw:' + ID + ':slip' + tg, x0: ux(sd, UM), z0: zt(A + S), x1: ux(sd, UM), z1: zt(A), w: UO - UR + 0.2, h0: 0, h1: H, edge: 0.01, absY: true });
            /* the outer parapet: out with the taper, along the lane, out with the lane, to the ramp's top */
            hung(E, 0, UR + 0.3, T); hung(UR + 0.3, T, UR + 0.3, T + LN); hung(UR + 0.3, T + LN, UO + 0.3, A - 2); hung(UO + 0.3, A - 2, UO + 0.3, A);
            hung(E, NOSE, UR - 0.3, A);   // the gore's wall, from the nose to the ramp's inner side
            const hS = y => H * Math.abs(y - (n === 0 ? gN : gS)) / S, r0 = n === 0 ? U1 + A : gS, r1 = n === 0 ? gN : D0 - A;
            barrier(ux(sd, UO + 0.3), r0, r1, hS, false); barrier(ux(sd, UR - 0.3), r0, r1, hS, false);   // the ramp's two sides
        }
    }
    /* the pillars: every six squares, never on the road under the deck (a pair either side of it) */
    const PIERS = []; for (let y = U1 + 3; y <= D0 - 3; y += 6) { if (CR && y > CR[0] - 4 && y < CR[1] + 4) continue; PIERS.push(y); }
    if (CR) PIERS.push(CR[0] - 1.5, CR[1] + 1.5); PIERS.sort((a, b) => a - b);
    const laneAt = y => EX && exitT(y) >= T && exitT(y) <= A - 1;   // a row where the deck is wide enough for a pillar under the exit lane
    const cols = y => laneAt(y) ? [-16.4, -7, 7, 16.4] : [-7, 7];
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
    /* a level barrier along any line a -> b (points in the row's frame), its foot at y */
    const jerseySeg = (P, a, b, y) => { const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, nx = -(b[1] - a[1]) / L, nz = (b[0] - a[0]) / L, ex = (b[0] - a[0]) / L * 0.16, ez = (b[1] - a[1]) / L * 0.16;
        const band = hw => [[a[0] - ex + nx * hw, a[1] - ez + nz * hw], [b[0] + ex + nx * hw, b[1] + ez + nz * hw], [b[0] + ex - nx * hw, b[1] + ez - nz * hw], [a[0] - ex - nx * hw, a[1] - ez - nz * hw]].map(v => [R3(v[0]), R3(v[1])]);
        P.push({ s: 'poly', p: [0, y, 0], pts: band(0.3), h: 0.5, key: CONC, tint: CT, uv: 3.5 }, { s: 'poly', p: [0, y + 0.5, 0], pts: band(0.16), h: BH - 0.5, key: CONC, tint: CT, uv: 3.5 }); };
    /* a level paint line through the points `pts` (the row's frame), mitred at its corners */
    const polyLine = (P, pts, w, color, y) => { const hw = w / 2, N2 = pts.length, off = pts.map((q0, i) => { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(N2 - 1, i + 1)];
            const d1 = i ? [q0[0] - a[0], q0[1] - a[1]] : [b[0] - q0[0], b[1] - q0[1]], d2 = i < N2 - 1 ? [b[0] - q0[0], b[1] - q0[1]] : d1, l1 = Math.hypot(d1[0], d1[1]) || 1, l2 = Math.hypot(d2[0], d2[1]) || 1;
            const n1 = [-d1[1] / l1, d1[0] / l1], n2 = [-d2[1] / l2, d2[0] / l2]; let nx = n1[0] + n2[0], nz = n1[1] + n2[1]; const nl = Math.hypot(nx, nz) || 1; nx /= nl; nz /= nl; const k = hw / Math.max(0.5, nx * n1[0] + nz * n1[1]);
            return [[q0[0] + nx * k, q0[1] + nz * k], [q0[0] - nx * k, q0[1] - nz * k]]; });
        for (let i = 0; i + 1 < N2; i++) P.push({ s: 'poly', p: [0, y + 0.03, 0], pts: [off[i][0], off[i + 1][0], off[i + 1][1], off[i][1]].map(v => [R3(v[0]), R3(v[1])]), h: 0.012, tint: color }); };
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
          jersey(P, rx, rz, xc + sd * E, Z(U1 + NOSE), Z(D0 - NOSE), H, H);
          for (const n of [0, 1]) { const d = tdir(n), q = (u, t) => [R3(ux(sd, u) - rx), R3(tz(n, t) - rz)];
              /* the widened deck: two slabs (the taper + the lane; the lane peeling away), a girder under each, the abutment under the ramp's top */
              P.push({ s: 'poly', p: [0, H - 0.5, 0], pts: [q(RW - 0.02, 0), q(UR + OV, T), q(UR + OV, T + LN), q(RW - 0.02, T + LN)], h: 0.5, key: CONC, tint: CT, keyTop: ASPH, under: true, uv: 3.5 },
                     { s: 'poly', p: [0, H - 0.5, 0], pts: [q(RW - 0.02, T + LN), q(UR + OV, T + LN), q(UO + OV, A - 2), q(UO + OV, A), q(RW - 0.02, A)], h: 0.5, key: CONC, tint: CT, keyTop: ASPH, under: true, uv: 3.5 });
              const gz0 = (tz(n, T) + tz(n, A)) / 2, gz1 = (tz(n, A - 3) + tz(n, A)) / 2;
              P.push({ s: 'box', p: [R3(ux(sd, 16.4) - rx), H - TH, R3(gz0 - rz)], size: [1.0, TH - 0.5, R3((A - T) * C)], key: CONC, tint: CD, top: false, under: true, uv: 3.5 },
                     { s: 'box', p: [R3(ux(sd, 21.6) - rx), H - TH, R3(gz1 - rz)], size: [1.0, TH - 0.5, R3(3 * C)], key: CONC, tint: CD, top: false, under: true, uv: 3.5 },
                     { s: 'box', p: [R3(ux(sd, (E + 0.3 + UO + OV) / 2) - rx), 0, R3(tz(n, A) - d * 1.05 - rz)], size: [R3(UO + OV - E - 0.3), H - 0.5, 2.1], key: CONC, tint: CT, top: false, uv: 3.5 });
              /* its parapets: the outer one, the gore's wall from its nose (a yellow end on it) */
              [[E, 0, UR + 0.3, T], [UR + 0.3, T, UR + 0.3, T + LN], [UR + 0.3, T + LN, UO + 0.3, A - 2], [UO + 0.3, A - 2, UO + 0.3, A], [E, NOSE, UR - 0.3, A]].forEach(g => jerseySeg(P, q(g[0], g[1]), q(g[2], g[3]), H));
              P.push({ s: 'cyl', p: [q(E, NOSE)[0], H, R3(q(E, NOSE)[1] - d * 0.5)], r: 0.55, h: 1.0, seg: 10, tint: 0xe8b830 }, { s: 'cyl', p: [q(E, NOSE)[0], H + 0.42, R3(q(E, NOSE)[1] - d * 0.5)], r: 0.57, h: 0.2, seg: 10, tint: 0x1c1c1c, cap: false });
              /* the paint: the dotted line between the through lane and the exit lane; the lane's right edge out with the taper and out again to the ramp; its
                 left edge from the gore's point to the ramp; the chevrons in the gore */
              paintLine(P, rx, rz, ux(sd, UL0), tz(n, 0), tz(n, GS), H, H, 0.25, WHITE, [1.2, 2.4]);
              polyLine(P, [q(UL0, 0), q(UL1, T), q(UL1, T + LN), q(RR, A)], 0.16, WHITE, H);
              polyLine(P, [q(UL0 + 0.35, GS), q(RL, A)], 0.16, WHITE, H);
              const uLeft = t => UL0 + 0.35 + (RL - UL0 - 0.35) * (t - GS) / (A - GS);
              for (let t = GS + 1; t <= NOSE - 0.4; t += 0.8) { const u0 = UL0 + 0.3, u1 = uLeft(t) - 0.3, um = (u0 + u1) / 2, hw = (u1 - u0) / 2; if (hw < 0.35) continue;
                  const zA = tz(n, t) - rz, back = d * hw * 0.9, th = d * 0.4;
                  for (const e of [-1, 1]) { const xa = R3(ux(sd, um) - rx), xb = R3(ux(sd, um + e * hw) - rx); P.push({ s: 'poly', p: [0, H + 0.03, 0], pts: [[xa, R3(zA)], [xb, R3(zA + back)], [xb, R3(zA + back + th)], [xa, R3(zA + th)]], h: 0.012, tint: WHITE }); } }
          }
      }
      /* the paint: the middle's yellow lines, the lane dashes, the edges (solid between the two gores; an exit corner paints its own) */
      for (const sd of [-1, 1]) { paintLine(P, rx, rz, xc + sd * 2.1, Z(U1), Z(D0), H, H, 0.16, YEL);
          [5.25, 8.75].forEach(o => paintLine(P, rx, rz, xc + sd * o, Z(U1), Z(D0), H, H, 0.14, WHITE, [7, 7]));
          if (!EX) paintLine(P, rx, rz, xc + sd * 11.9, Z(U1), Z(D0), H, H, 0.14, WHITE);
          else paintLine(P, rx, rz, xc + sd * 11.9, Z(U1 + GS), Z(D0 - GS), H, H, 0.16, WHITE); }
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
    /* the exit's four ramps: earth between two retaining walls (the inner one fills to the deck's edge), a parapet on each, the lane's two edge lines
       (yellow on the driver's left, white on the right), a stop line at the foot of the two that come off the highway */
    if (EX) for (const sd of [-1, 1]) for (const n of [0, 1]) { const P = [], rx = xc, top = n === 0 ? U1 + A : D0 - A, foot = n === 0 ? gN : gS, rz = (Z(foot) + Z(top)) / 2;
        retain(P, rx, rz, ux(sd, UO - 0.05), sd, Z(foot), Z(top), 2.1); retain(P, rx, rz, ux(sd, UR + 0.05), -sd, Z(foot), Z(top), R3(UR + 0.05 - E - 0.3));
        jersey(P, rx, rz, ux(sd, UO + 0.3), Z(foot), Z(top), 0, H); jersey(P, rx, rz, ux(sd, UR - 0.3), Z(foot), Z(top), 0, H);
        paintLine(P, rx, rz, ux(sd, RR), Z(foot), Z(top), 0, H, 0.16, WHITE); paintLine(P, rx, rz, ux(sd, RL), Z(foot), Z(top), 0, H, 0.16, YEL);
        row('slip' + (sd < 0 ? 'w' : 'e') + n, rx, rz, P);
        if ((sd < 0) === (n === 0)) { const zs = r2(Z(foot) - tdir(n) * 1.2); marks.push({ k: 'line', x0: r2(ux(sd, RL)), z0: zs, x1: r2(ux(sd, RR)), z1: zs, w: 0.5, color: WHITE }); } }
    /* THE LIGHTS ARE THE GAME'S OWN STREET LAMPS (2026-11-22, mondo: "I dont really like these light poles you put, they look different than the ones we already
       have. why would you make new light poles/street lamps"): `terrain.gen.lamps` rows (three-renderer.js _hqBuildStreetLamps, the city's lamp), one on the
       outer parapet every six squares, the two sides staggered, the head over the road; none along an exit's lane (no parapet stands on that line there) */
    const lamps = [];
    { let n = 0; for (let y = U0 + 3; y <= D1 - 3; y += 3) { const sd = (n++ % 2) ? 1 : -1; if (EX && y > U1 - 1 && y < D0 + 1 && exitT(y) < NOSE + 1) continue;
          lamps.push({ x: r2(xc + sd * E), z: r2(Z(y)), y: r2(hMain(y) + BH), nx: sd, nz: 0 }); } }

    /* ── 6. the road under the deck: its middle line, the barrels at the room's line, the road running on past both walls ── */
    if (CR) { const zc = r2((Z(CR[0]) + Z(CR[1])) / 2), wd = (CR[1] - CR[0]) * C;
        marks.push({ k: 'line', x0: gx(1), z0: zc, x1: gx(W - 1), z1: zc, w: 0.16, color: YEL });
        for (const sd of [-1, 1]) { edgeRoads.push({ side: sd < 0 ? 'w' : 'e', at: zc, w: wd, key: ASPH, line: YEL });
            if (CAT.traffic_barrel) [-2.6, -0.9, 0.9, 2.6].forEach((o, i) => props.push({ key: 'traffic_barrel', x: r2(sd < 0 ? gx(1) + 0.5 : gx(W - 1) - 0.5), z: r2(zc + o), face: i * 70 })); } }

    /* ── 7. the cars: two lines take the exit, cross the road under the deck and come back on ── */
    if (EX && SPEC.cars) for (const sd of [-1, 1]) { const main = laneLine(2, sd > 0), dir = sd < 0 ? 1 : -1, n0 = dir > 0 ? 0 : 1, n1 = 1 - n0;   // west: south-bound (north to south); east: north-bound
        const zA = tz(n0, 0), zB = tz(n1, 0), before = main.filter(q => dir * (q[1] - zA) < 0), after = main.filter(q => dir * (q[1] - zB) > 0), um = (UL0 + UL1) / 2;
        const leg = n => [[7, 0.3], [um, T + 0.5], [um, T + LN], [UM, A], [UM, A + S]].map(q => [r2(ux(sd, q[0])), r2(tz(n, q[1]))]);
        TRAFFIC.push({ pts: before.concat(leg(n0), leg(n1).reverse(), after), loop: false, n: 1, speed: Math.max(6, (SPEC.cars.speed || 10) - 2), lane: 0.01, deck: true, kinds: sd < 0 ? ['suv', 'taxi'] : ['cadillac', 'suv'] }); }

    return { XC, HW, U0, U1, D0, D1, H, A, S, gN, gS, CR, hMain, xc, xl, E, RW, lamps };
};
