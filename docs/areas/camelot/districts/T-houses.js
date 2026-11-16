/* CAMELOT KINGDOM · THE VILLAGE'S HOUSES (district T, second file) — the 43 houses, five kinds. T.js calls `houses(ctx, kb)` after the
   Chapel, the Smithy and the Inn are written and before their looks are flushed; the tool never loads this file itself.
   WHAT IS HERE: where a house fronts (frontOf: the side with the most street), which kind it is (houseKind: by where it stands and how big
   its plot is), what it looks like (houseLook: one parts list a house). Every house is SOLID today: a texbuilding with no inside.
   Its squares are the plan's runs of `B` (ctx.HOUSES, read by the tool). `i` = the house's number in that list: its id is 'cam:house_' + i,
   and its tints, shutters and flowers are picked by i, so the list's order is part of the look.
   MISSING / WAITING: no house is walked into; mondo's OK ("yeah they are fine") covers the five looks only. Seen on screen: one shop.
   Hooks and rules: T.js's header. kb(id, [x0, y0, x1, y1, front], h, o, parts) = ctx.building with the front in the squares' fifth place. */
'use strict';
const U = n => 'urban:' + n, STUCCO = U('PlasterWallStucco2a'), G_TALL = U('GlassWindowTall1a'), SLATE = U('MetalRoofTiles1a'), WOODK = 'wood_planks', WOODD = 'wood';
const STONE = 0xc4c0b8, STONE2 = 0xaeaaa6, STONE3 = 0xd2ccc0, GLASS = 0xa8c4ec, TIMBER = 0x4a3626;
function houses(ctx, kb) {
const { WALL, W, cell, HOUSES, count } = ctx;
/* the houses: plaster on a stone foot, a dark timber frame, a gable; the door faces the nearest street */
const HTINT = [0xe8dcc0, 0xd8c8a8, 0xf0e8d8, 0xc8b89c], RTINT = [0xa84a3c, 0x7a5a3c, 0x5a6c96, 0x8a4a34], RKEY = [SLATE, WOODD, SLATE, SLATE];
function frontOf(h) { const n = { N: 0, S: 0, W: 0, E: 0 }, road = (x, y) => (x >= 0 && y >= 0 && x < W && y < W && cell[y][x] === 'c') ? 1 : 0;
    for (const k of [1, 2, 3]) { const wt = 4 - k; for (let x = h.x0; x < h.x1; x++) { n.N += wt * road(x, h.y0 - k); n.S += wt * road(x, h.y1 - 1 + k); } for (let y = h.y0; y < h.y1; y++) { n.W += wt * road(h.x0 - k, y); n.E += wt * road(h.x1 - 1 + k, y); } }
    return ['S', 'N', 'E', 'W'].sort((a, b) => n[b] - n[a])[0]; }
/* THE HOUSES, FIVE KINDS (2026-11-15, mondo's OK on docs/plans/camelot/camelot_castle2_next_plan.png "yeah they are fine"): every house was one
   shape (a plaster box, four posts, a gable). Now, by where it stands and how big its plot is:
     1 JETTIED TOWNHOUSE   stone ground floor, a plaster and timber upper floor that overhangs on beams, a steep roof, a brick chimney
     2 SHOP HOUSE          one storey, an open counter under a striped awning, a hanging sign
     3 THATCHED COTTAGE    low walls, a tall straw roof, small lights (the small plots)
     4 BURGHER HOUSE       dressed stone on two floors, slate roof, two chimneys, a porch (round the Market)
     5 YARD HOUSE          a timber house with a lean-to shed under one long roof (by the town wall)
   On every one: a real door in a frame on a stone step, shutters and a flower box at each window, lit windows, a chimney that fits the roof.
   All still solid (not walked into): the same plots, the same doors on the same streets. Frame: x along the front, +z out of the front. */
const SHUT = [0x3a6a4a, 0x7a3a2a, 0x3a4a7a, 0x6a5a2a], BLOOM = [0xc84a5a, 0xe0b040, 0xd87ab0, 0xf0f0e0], BRICK = 0xb86a54, STRAW = 0xc8ac64;
function houseKind(h, i) { const cx = (h.x0 + h.x1) / 2, cy = (h.y0 + h.y1) / 2, small = Math.min(h.x1 - h.x0, h.y1 - h.y0) < 2 || (h.x1 - h.x0) * (h.y1 - h.y0) <= 4;
    if (Math.abs(cx - 48) < 22 && cy > 56 && cy < 70) return (i % 2) ? 4 : 2;                       // round the Market: the burghers and the shops
    if (cx < 21.5 || cx > 74.5 || cy < 24.5 || cy > 71) return small ? 3 : ((i % 2) ? 5 : 3);       // against the town wall: yards and cottages
    return small ? 3 : ((i % 3) === 1 ? 4 : 1); }
function houseLook(kind, a, w, d, i) {
    const tint = HTINT[i % 4], sh = SHUT[i % 4], fl = BLOOM[(i * 3) % 4], dx = ((i % 2) ? 1 : -1) * Math.min(1.6, w / 2 - 1.3), dT = [0x5a3c26, 0x3a4a3a, 0x6a2a24, 0x4a3a5a][(i * 5) % 4];
    const along = d > w;                                                                             // the ridge runs along the longer side
    const gable = (y, rh, over, key, t, o) => along ? a.roof('gable', 0, y, 0, d + over, rh, w + over, key, t, Object.assign({ ry: 90 }, o)) : a.roof('gable', 0, y, 0, w + over, rh, d + over, key, t, o);
    const win = (x, y, ww, hh, zf, lit) => { a.box(x, y, zf, ww, hh, 0.1, G_TALL, lit ? 0xf0d890 : GLASS, { glow: lit ? 0.55 : 0.3 }); a.box(x, y + hh, zf, ww + 0.3, 0.14, 0.16, WOODD, TIMBER);
        for (const s of [-1, 1]) a.box(x + s * (ww / 2 + 0.2), y, zf + 0.02, 0.34, hh, 0.06, WOODK, sh);
        a.box(x, y - 0.3, zf + 0.14, ww + 0.3, 0.24, 0.26, WOODD, TIMBER); a.box(x, y - 0.08, zf + 0.14, ww + 0.1, 0.2, 0.2, null, 0x4a8a3a); a.box(x, y + 0.08, zf + 0.16, ww - 0.1, 0.12, 0.16, null, fl, { n: 1 }); };
    const sideWin = (y, hh) => { for (const s of [-1, 1]) if (d > 5) a.box(s * (w / 2 - 0.1), y, 0, 0.12, hh, 1.0, G_TALL, GLASS); };
    const door = (x, zf) => { a.box(x, 0.18, zf, 1.15, 2.05, 0.12, WOODK, dT); for (const s of [-1, 1]) a.box(x + s * 0.68, 0, zf + 0.02, 0.2, 2.4, 0.2, WOODD, TIMBER); a.box(x, 2.3, zf + 0.02, 1.7, 0.2, 0.24, WOODD, TIMBER);
        a.box(x, 0, zf + 0.5, 1.9, 0.18, 0.9, WALL, STONE2); a.box(x + 0.38, 1.1, zf + 0.08, 0.08, 0.08, 0.06, null, 0xd8b050); };
    const chimney = (x, z, y0, top, key, t) => { a.box(x, y0, z, 0.9, top - y0, 0.9, key, t, { roof: true }); a.box(x, top, z, 1.1, 0.2, 1.1, key, t, { roof: true }); a.box(x, top + 0.2, z, 0.5, 0.35, 0.5, null, 0x3a3230, { roof: true }); };
    const barrel = (x, z) => { a.cyl(x, 0, z, 0.36, 0.9, WOODK, 0x8a5a34, { seg: 10 }); a.cyl(x, 0.2, z, 0.38, 0.06, null, 0x3a3230, { seg: 10 }); a.cyl(x, 0.64, z, 0.38, 0.06, null, 0x3a3230, { seg: 10 }); };
    const f = d / 2 - 0.1;
    if (kind === 1) {   // JETTIED TOWNHOUSE
        const g = 3.3, u = 3.5, ov = 0.45, zf = d / 2 + ov - 0.1;
        a.box(0, 0, 0, w - 0.3, g, d - 0.3, WALL, STONE3, { top: false }); a.box(0, 0, 0, w, 0.7, d, WALL, STONE2, { top: true });
        a.box(0, g, 0, w + 2 * ov - 0.3, u, d + 2 * ov - 0.3, STUCCO, tint, { top: false, under: true });
        for (let x = -w / 2 - ov + 0.2; x <= w / 2 + ov - 0.19; x += (w + 2 * ov - 0.4) / Math.max(2, Math.round(w / 1.75))) for (const s of [-1, 1]) a.box(x, g, s * (d / 2 + ov - 0.14), 0.2, u, 0.2, WOODD, TIMBER);
        for (const s of [-1, 1]) { a.box(s * (w / 2 + ov - 0.14), g, 0, 0.2, u, d + 2 * ov - 0.3, WOODD, TIMBER, { faces: s < 0 ? 'l' : 'r', top: false }); for (const y of [g, g + u - 0.24]) a.box(0, y, s * (d / 2 + ov - 0.14), w + 2 * ov - 0.2, 0.24, 0.22, WOODD, TIMBER); }
        for (let x = -w / 2 + 0.5; x <= w / 2 - 0.49; x += (w - 1) / Math.max(1, Math.round(w / 2.2))) a.box(x, g - 0.5, d / 2 + ov / 2 - 0.1, 0.22, 0.5, ov + 0.1, WOODD, TIMBER);
        gable(g + u, 4.2, 1.3 + 2 * ov, RKEY[1], 0x7a5a3c, { keyEnd: STUCCO, tintEnd: tint });
        door(dx, f); win(-dx || 1.6, 1.3, 1.0, 1.3, f, true); for (const x of (w > 8 ? [-w / 4, w / 4] : [-1.4, 1.4])) win(x, g + 1.1, 0.9, 1.3, zf, i % 2 === 0); sideWin(g + 1.1, 1.2);
        chimney(-dx * 0.9, -d / 4, g + u, g + u + 5.2, 'bricks_2', BRICK); barrel(w / 2 - 0.5, d / 2 + 0.35);
    } else if (kind === 2) {   // SHOP HOUSE
        const hh = 3.6, cw = Math.min(5.2, w - 3.2), cx = -dx * 0.9 + (dx > 0 ? -0.6 : 0.6);
        a.box(0, 0, 0, w - 0.3, hh, d - 0.3, STUCCO, tint, { top: false }); a.box(0, 0, 0, w, 0.8, d, WALL, STONE2, { top: true });
        for (const s of [-1, 1]) for (const t of [-1, 1]) a.box(s * (w / 2 - 0.2), 0.8, t * (d / 2 - 0.2), 0.3, hh - 0.8, 0.3, WOODD, TIMBER); a.box(0, hh - 0.26, 0, w, 0.26, d, WOODD, TIMBER, { top: false, under: true });
        gable(hh, 3.2, 1.0, SLATE, 0x5a6c96, { keyEnd: STUCCO, tintEnd: tint });
        door(dx, f); a.box(cx, 1.0, f, cw, 1.5, 0.1, null, 0x241c18); a.box(cx, 0.9, f + 0.3, cw + 0.3, 0.12, 0.7, WOODK, 0x9a6a3c); a.box(cx, 0.8, f + 0.05, cw + 0.2, 0.1, 0.1, WOODD, TIMBER);
        for (let k = 0; k < 3; k++) { const bx = cx - cw / 2 + (k + 0.5) * cw / 3, kind = (i + k) % 3;   // a wicker basket of apples, one of cabbages, a board of loaves
            if (kind === 2) { a.box(bx, 1.02, f + 0.32, 0.7, 0.04, 0.42, WOODK, 0x9a6a3c); for (const q of [-0.2, 0.02, 0.24]) a.box(bx + q, 1.06, f + 0.32, 0.18, 0.12, 0.3, null, 0xc89a58); }
            else { a.cyl(bx, 1.02, f + 0.32, 0.26, 0.2, WOODK, 0xb89460, { seg: 10 }); a.cyl(bx, 1.2, f + 0.32, 0.28, 0.03, WOODK, 0x8a6a40, { seg: 10 });
                for (const q of [[-0.1, -0.06], [0.1, -0.05], [0, 0.1], [-0.02, -0.01]]) a.P.push({ s: 'dome', p: [bx + q[0], q === 3 ? 1.26 : 1.2, f + 0.32 + q[1]], r: kind ? 0.1 : 0.08, seg: 8, tint: kind ? 0x6a9a4a : 0xb83a34 }); } }
        a.roof('shed', cx, 2.6, f + 0.75, cw + 0.6, 0.55, 1.5, null, (i % 2) ? 0xb03a3a : 0x3a5a9a, { ry: 180 }); for (const s of [-1, 1]) a.box(cx + s * (cw / 2 + 0.2), 0, f + 1.4, 0.12, 2.65, 0.12, WOODD, TIMBER);
        a.box(dx, 3.0, f + 0.6, 0.1, 0.1, 1.2, null, 0x2a2c30); a.box(dx, 2.2, f + 1.0, 0.08, 0.75, 0.9, WOODK, 0x8a5a34, { ds: true }); a.box(dx, 2.42, f + 1.0, 0.1, 0.3, 0.4, null, [0xd8b050, 0xc84a5a, 0x4a8a3a][i % 3], { ds: true });
        sideWin(1.5, 1.1); chimney(w / 2 - 1.3, -d / 4, hh, hh + 4.0, WALL, STONE2); barrel(-w / 2 + 0.5, d / 2 + 0.35); barrel(-w / 2 + 1.25, d / 2 + 0.3);
    } else if (kind === 3) {   // THATCHED COTTAGE
        const hh = 2.8, rh = 3.6 + (i % 2) * 0.5;
        a.box(0, 0, 0, w - 0.3, hh, d - 0.3, STUCCO, tint, { top: false }); a.box(0, 0, 0, w, 0.6, d, WALL, STONE2, { top: true });
        if (along) a.roof('hip', 0, hh, 0, d + 1.5, rh, w + 1.5, WOODD, STRAW, { ry: 90 }); else a.roof('hip', 0, hh, 0, w + 1.5, rh, d + 1.5, WOODD, STRAW);
        a.box(0, hh - 0.05, 0, w + 1.3, 0.3, d + 1.3, WOODD, 0xb09a54, { under: true, top: false });
        door(dx, f); if (w > 4.5) win(-dx || 1.4, 1.2, 0.8, 0.9, f, true); sideWin(1.3, 0.9);
        chimney(w > d ? w / 2 - 0.9 : 0, w > d ? 0 : -d / 2 + 0.9, 0, hh + rh + 0.4, WALL, STONE2);
        for (let k = 0; k < 4; k++) a.box(-w / 2 + 0.5 + k * 0.42, 0, d / 2 + 0.3, 0.36, 0.3 + (k % 2) * 0.22, 0.9, WOODD, 0x7a5a3c);   // the firewood by the door
    } else if (kind === 4) {   // BURGHER HOUSE
        const hh = 7.4, st = [STONE, STONE3, 0xb8b4ac, 0xcac4b4][i % 4];
        a.box(0, 0, 0, w - 0.2, hh, d - 0.2, WALL, st, { top: false }); a.box(0, 0, 0, w + 0.1, 1.0, d + 0.1, WALL, STONE2, { top: true });
        a.box(0, 3.5, 0, w + 0.1, 0.3, d + 0.1, WALL, STONE3, { top: false, under: true }); a.box(0, hh - 0.35, 0, w + 0.3, 0.35, d + 0.3, WALL, STONE3, { top: false, under: true });
        for (const s of [-1, 1]) for (const t of [-1, 1]) a.box(s * (w / 2 - 0.2), 1.0, t * (d / 2 - 0.2), 0.5, 0.55, 0.5, WALL, STONE3, { n: 6, step: [0, 1.05, 0] });
        gable(hh, 3.6, 0.9, SLATE, 0x4a5c8c, { keyEnd: WALL, tintEnd: st });
        door(dx, f); a.roof('gable', dx, 2.55, f + 0.55, 2.3, 0.8, 1.3, SLATE, 0x4a5c8c); for (const s of [-1, 1]) a.box(dx + s * 0.95, 0, f + 1.05, 0.18, 2.55, 0.18, WALL, STONE3);
        win(-dx || 1.6, 1.5, 1.0, 1.5, f, true); const n = w > 8 ? 3 : 2; for (let k = 0; k < n; k++) win(-w / 2 + (k + 0.5) * w / n, 4.4, 1.0, 1.7, f, k % 2 === i % 2); sideWin(4.4, 1.5);
        if (along) { chimney(0, -d / 2 + 0.7, hh, hh + 4.6, WALL, STONE2); chimney(0, d / 2 - 0.7, hh, hh + 4.6, WALL, STONE2); } else { chimney(-w / 2 + 0.7, 0, hh, hh + 4.6, WALL, STONE2); chimney(w / 2 - 0.7, 0, hh, hh + 4.6, WALL, STONE2); }
    } else {   // YARD HOUSE
        const hh = 3.6, hw = Math.max(3.4, w * 0.6), sd = dx > 0 ? -1 : 1, hx = -sd * (w - hw) / 2, lx = sd * hw / 2, lw = w - hw;
        a.box(hx, 0, 0, hw - 0.3, hh, d - 0.3, STUCCO, tint, { top: false }); a.box(hx, 0, 0, hw, 0.8, d, WALL, STONE2, { top: true });
        for (const s of [-1, 1]) for (const t of [-1, 1]) a.box(hx + s * (hw / 2 - 0.2), 0.8, t * (d / 2 - 0.2), 0.3, hh - 0.8, 0.3, WOODD, TIMBER); a.box(hx, 2.0, d / 2 - 0.14, hw, 0.2, 0.2, WOODD, TIMBER); a.box(hx, hh - 0.26, 0, hw, 0.26, d, WOODD, TIMBER, { top: false, under: true });
        a.roof('gable', hx, hh, 0, d + 0.9, 3.0, hw + 0.9, RKEY[0], 0xa84a3c, { ry: 90, keyEnd: STUCCO, tintEnd: tint });
        a.box(lx, 0, 0, lw - 0.2, 2.5, d - 0.4, WOODK, 0x8a6a48, { top: false }); a.roof('shed', lx, 2.5, 0, d - 0.1, 1.0, lw + 0.4, WOODD, 0x6a4a34, { ry: sd > 0 ? 90 : 270 });
        a.box(lx, 0.2, d / 2 - 0.18, Math.max(1.2, lw - 1.2), 1.9, 0.1, null, 0x2a201a);
        const ddx = hx + (hw > 4.4 ? -sd * 0.9 : 0); door(ddx, f); if (hw > 4.4) win(hx + sd * 1.0, 1.4, 0.9, 1.1, f, true);
        chimney(hx, -d / 4, hh, hh + 4.0, 'bricks_2', BRICK); barrel(lx, d / 2 + 0.35); for (let k = 0; k < 3; k++) a.box(lx + sd * (lw / 2 + 0.1), 0, d / 2 + 0.2 - k * 0.5, 0.3, 0.3 + k * 0.2, 0.4, WOODD, 0x7a5a3c);
    }
}
const KCOUNT = {};
HOUSES.forEach((h, i) => {
    const side = frontOf(h), kind = houseKind(h, i), hh = (kind === 1 || kind === 4) ? 7 : 3.6;
    kb('house_' + i, [h.x0, h.y0, h.x1, h.y1, side], hh, { hollow: false, leaf: undefined, leafDouble: undefined, keyIn: undefined, floorIn: undefined }, (a, w, d) => houseLook(kind, a, w, d, i));
    count.houses = (count.houses || 0) + 1; KCOUNT[kind] = (KCOUNT[kind] || 0) + 1;
});
count.houseKinds = KCOUNT;
}
module.exports = { houses };
