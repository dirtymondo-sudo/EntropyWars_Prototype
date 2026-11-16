/* CAMELOT KINGDOM · THE VILLAGE'S HOUSES (district T, second file) — the 43 houses, five kinds. T.js calls `houses(ctx, kb)` after the
   Chapel, the Smithy and the Inn are written and before their looks are flushed; the tool never loads this file itself.
   WHAT IS HERE: where a house fronts (frontOf: the side with the most street), which kind it is (houseKind: by where it stands and how big
   its plot is), what it looks like (houseLook: one parts list a house). Every house is WALKED INTO since pass 2b (2026-11-16): a hollow texbuilding, one hall, furnished by kind (`insides`, below).
   Its squares are the plan's runs of `B` (ctx.HOUSES, read by the tool). `i` = the house's number in that list: its id is 'cam:house_' + i,
   and its tints, shutters and flowers are picked by i, so the list's order is part of the look.
   MISSING / WAITING: mondo's OK ("yeah they are fine") covers the five looks; the insides are the pilot's first build, not yet seen by him.
   No upstairs in the two-storey kinds (no stair: the upper floor is drawn from outside only).
   The Village pilot thread (2026-11-16) ran its passes here and freed the row. PASS 1, THE EXTERIORS, is in: gains, timber frames, fronts, door paths, back and
   side windows; seen on screen (notes: areas-complexes.md "CAMELOT, THE VILLAGE" + "CAMELOT, THE ZONE KIT").
   Hooks and rules: T.js's header. kb(id, [x0, y0, x1, y1, front], h, o, parts) = ctx.building with the front in the squares' fifth place. */
'use strict';
const U = n => 'urban:' + n, STUCCO = U('PlasterWallStucco2a'), G_TALL = U('GlassWindowTall1a'), SLATE = U('MetalRoofTiles1a'), WOODK = 'wood_planks', WOODD = 'wood';
const STONE = 0xc4c0b8, STONE2 = 0xaeaaa6, STONE3 = 0xd2ccc0, GLASS = 0xa8c4ec, TIMBER = 0x4a3626;
/* THE EXTERIOR PASS (2026-11-16, the Village pilot thread, after the first look on screen): under the kingdom's light the plaster sheet read as
   mud and a shaded wall as black, so the five kinds could not be told apart. `gain` (the renderer's THE PAINTED WALL) lifts a sheet's tint:
   PG on plaster and thatch, SG on dressed stone. A roof part's gain is the whole part's, so a roof with a plaster / stone gable end takes the
   gain and its own tint is divided by it (`dimBy`): the slate stays as dark as it was. */
const PG = 1.6, SG = 1.35, TG = 1.35;
const dimBy = (t, g) => ((Math.round((t >> 16 & 255) / g) << 16) | (Math.round((t >> 8 & 255) / g) << 8) | Math.round((t & 255) / g));
const TOP = { 1: 3.05, 2: 3.0, 3: 2.5, 4: 3.2, 5: 2.4 };   // the lit ceiling's height inside, under each kind's lowest drawn underside
function houses(ctx, kb) {
const { WALL, W, cell, HOUSES, count } = ctx;
/* the houses: plaster on a stone foot, a dark timber frame, a gable; the door faces the nearest street */
const HTINT = [0xe8dcc0, 0xd8c8a8, 0xf0e8d8, 0xc8b89c], RTINT = [0xa84a3c, 0x7a5a3c, 0x5a6c96, 0x8a4a34], RKEY = [SLATE, WOODD, SLATE, SLATE];
function frontOf(h) { const n = { N: 0, S: 0, W: 0, E: 0 }, road = (x, y) => (x >= 0 && y >= 0 && x < W && y < W && cell[y][x] === 'c') ? 1 : 0;
    for (const k of [1, 2, 3]) { const wt = 4 - k; for (let x = h.x0; x < h.x1; x++) { n.N += wt * road(x, h.y0 - k); n.S += wt * road(x, h.y1 - 1 + k); } for (let y = h.y0; y < h.y1; y++) { n.W += wt * road(h.x0 - k, y); n.E += wt * road(h.x1 - 1 + k, y); } }
    if (n.N + n.S + n.W + n.E > 0) return ['S', 'N', 'E', 'W'].sort((a, b) => n[b] - n[a])[0];
    /* THE EXTERIOR PASS (2026-11-16): a house with no street within three squares fell to 'S' whatever stood there, so the five houses of the
       south back row and the two in the south corners turned their doors to the town wall. Now: look again three squares wider to each side
       (a street round the corner), and failing that the door looks to the castle (the back lane between the two south rows). */
    for (const k of [1, 2, 3]) { for (let x = h.x0 - 3; x < h.x1 + 3; x++) { n.N += road(x, h.y0 - k); n.S += road(x, h.y1 - 1 + k); } for (let y = h.y0 - 3; y < h.y1 + 3; y++) { n.W += road(h.x0 - k, y); n.E += road(h.x1 - 1 + k, y); } }
    if (n.N + n.S + n.W + n.E > 0) return ['N', 'S', 'E', 'W'].sort((a, b) => n[b] - n[a])[0];
    const dx = 48 - (h.x0 + h.x1) / 2, dy = 45 - (h.y0 + h.y1) / 2; return Math.abs(dy) >= Math.abs(dx) ? (dy < 0 ? 'N' : 'S') : (dx < 0 ? 'W' : 'E'); }
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
/* PASS 2b, EVERY HOUSE IS WALKED INTO (2026-11-16, the Village pilot thread): the 43 houses are hollow now (one hall each, a swinging door at
   the texbuilding's own door place `door.lx`). What that changed in the looks: a wall is `walls()` (three faces + a front with the doorway
   cut), a stone foot is `footS()` (strips round the walls, never a box with a top over the plan: the stone lid), the drawn door panel is
   gone (the frame, the step and the path stand at the real doorway), the ground windows moved clear of it (`wx`). */
function houseLook(kind, a, w, d, i, path, door, CH) {
    const tint = HTINT[i % 4], sh = SHUT[i % 4], fl = BLOOM[(i * 3) % 4], dx = door.lx, cw = door.cw, wx = Math.min(w / 2 - 1.0, dx + 2.5);
    const along = d > w;                                                                             // the ridge runs along the longer side
    const gable = (y, rh, over, key, t, o) => { if (o && o.keyEnd) { const gn = o.keyEnd === STUCCO ? PG : SG; o = Object.assign({ gain: gn }, o); t = dimBy(t, gn); } return along ? a.roof('gable', 0, y, 0, d + over, rh, w + over, key, t, Object.assign({ ry: 90 }, o)) : a.roof('gable', 0, y, 0, w + over, rh, d + over, key, t, o); };
    /* the four walls of a house w x d round (x, 0): back and sides (`sides`: which) + the front with the doorway */
    const walls = (x, wB, h, dB, key, tint2, gain, sides) => { a.box(x, 0, 0, wB, h, dB, key, tint2, { top: false, faces: sides || 'blr', gain });
        a.P.push({ s: 'quad', p: [x, 0, dB / 2], size: [wB, h], ry: 0, hole: [dx - x, cw, 2.2], key, tint: tint2, gain }); };
    const footS = (x, wF, h, dF, skip) => { const t = 0.16; a.box(x, 0, -(dF / 2 - t / 2), wF, h, t, WALL, STONE2);
        for (const s of [-1, 1]) if (s !== skip) a.box(x + s * (wF / 2 - t / 2), 0, 0, t, h, dF, WALL, STONE2);
        const x0 = x - wF / 2, x1 = x + wF / 2, a0 = dx - cw / 2 - 0.1, a1 = dx + cw / 2 + 0.1; a.box((x0 + a0) / 2, 0, dF / 2 - t / 2, a0 - x0, h, t, WALL, STONE2); a.box((a1 + x1) / 2, 0, dF / 2 - t / 2, x1 - a1, h, t, WALL, STONE2); };
    const win = (x, y, ww, hh, zf, lit) => { a.box(x, y, zf, ww, hh, 0.1, G_TALL, lit ? 0xf0d890 : GLASS, { glow: lit ? 0.55 : 0.3 }); a.box(x, y + hh, zf, ww + 0.3, 0.14, 0.16, WOODD, TIMBER);
        for (const s of [-1, 1]) a.box(x + s * (ww / 2 + 0.2), y, zf + 0.02, 0.34, hh, 0.06, WOODK, sh);
        a.box(x, y - 0.3, zf + 0.14, ww + 0.3, 0.24, 0.26, WOODD, TIMBER); a.box(x, y - 0.08, zf + 0.14, ww + 0.1, 0.2, 0.2, null, 0x4a8a3a); a.box(x, y + 0.08, zf + 0.16, ww - 0.1, 0.12, 0.16, null, fl, { n: 1 }); };
    /* a side window: glass in a timber frame with its two shutters (`xo` = how far that floor's wall stands out past the plot's edge) */
    const sideWin = (y, hh, xo) => { if (d > 5) for (const s of [-1, 1]) { const xw = s * (w / 2 - 0.1 + (xo || 0)); a.box(xw, y, 0, 0.12, hh, 1.0, G_TALL, GLASS);
        a.box(xw, y + hh, 0, 0.22, 0.14, 1.3, WOODD, TIMBER); a.box(xw, y - 0.14, 0, 0.28, 0.14, 1.3, WOODD, TIMBER); for (const t of [-1, 1]) a.box(xw + s * 0.02, y, t * 0.68, 0.08, hh, 0.32, WOODK, sh); } };
    /* a back window (the wall away from the street was blank): the same glass, lintel, sill and shutters, no flower box */
    const backWin = (x, y, ww, hh, zb, lit) => { a.box(x, y, -zb, ww, hh, 0.1, G_TALL, lit ? 0xf0d890 : GLASS, { glow: lit ? 0.55 : 0.3 }); a.box(x, y + hh, -zb, ww + 0.3, 0.14, 0.16, WOODD, TIMBER); a.box(x, y - 0.14, -zb, ww + 0.3, 0.14, 0.2, WOODD, TIMBER);
        for (const s of [-1, 1]) a.box(x + s * (ww / 2 + 0.2), y, -zb - 0.02, 0.34, hh, 0.06, WOODK, sh); };
    /* the doorway's frame on its stone step, the flagged path to the street (the leaf is the texbuilding's own swinging door) */
    const door0 = zf => { for (const s of [-1, 1]) a.box(dx + s * (cw / 2 + 0.1), 0, zf + 0.02, 0.2, 2.4, 0.2, WOODD, TIMBER); a.box(dx, 2.2, zf + 0.02, cw + 0.6, 0.2, 0.24, WOODD, TIMBER);
        a.box(dx, 0, zf + 0.5, cw + 0.5, 0.06, 0.9, WALL, STONE2);
        if (path > 0.3) a.box(dx, 0, d / 2 + 0.85 + path / 2, 1.5, 0.05, path, 'cobblestone', 0xc8c4bc, { sides: false }); };
    const chimney = (x, z, y0, top, key, t) => { CH.push([x, z, top + 0.55]); a.box(x, y0, z, 0.9, top - y0, 0.9, key, t, { roof: true }); a.box(x, top, z, 1.1, 0.2, 1.1, key, t, { roof: true }); a.box(x, top + 0.2, z, 0.5, 0.35, 0.5, null, 0x3a3230, { roof: true }); };
    const barrel = (x, z) => { a.cyl(x, 0, z, 0.36, 0.9, WOODK, 0x8a5a34, { seg: 10 }); a.cyl(x, 0.2, z, 0.38, 0.06, null, 0x3a3230, { seg: 10 }); a.cyl(x, 0.64, z, 0.38, 0.06, null, 0x3a3230, { seg: 10 }); };
    const f = d / 2 - 0.1;
    if (kind === 1) {   // JETTIED TOWNHOUSE
        const g = 3.3, u = 3.5, ov = 0.45, zf = d / 2 + ov - 0.1;
        walls(0, w - 0.3, g, d - 0.3, WALL, STONE3, SG); footS(0, w, 0.7, d);
        a.box(0, g, 0, w + 2 * ov - 0.3, u, d + 2 * ov - 0.3, STUCCO, tint, { top: false, under: true, gain: PG });
        for (let x = -w / 2 - ov + 0.2; x <= w / 2 + ov - 0.19; x += (w + 2 * ov - 0.4) / Math.max(2, Math.round(w / 1.75))) for (const s of [-1, 1]) a.box(x, g, s * (d / 2 + ov - 0.14), 0.2, u, 0.2, WOODD, TIMBER);
        /* the side walls were one timber sheet each (a black slab two squares long on screen): posts and two plates now, the plaster shows between */
        for (const s of [-1, 1]) { const xs = s * (w / 2 + ov - 0.14); for (let z = -d / 2 - ov + 0.2; z <= d / 2 + ov - 0.19; z += (d + 2 * ov - 0.4) / Math.max(2, Math.round(d / 1.75))) a.box(xs, g, z, 0.2, u, 0.2, WOODD, TIMBER);
            for (const y of [g, g + u - 0.24]) { a.box(xs, y, 0, 0.22, 0.24, d + 2 * ov - 0.2, WOODD, TIMBER); a.box(0, y, s * (d / 2 + ov - 0.14), w + 2 * ov - 0.2, 0.24, 0.22, WOODD, TIMBER); }
            a.box(xs, g + u / 2 - 0.1, 0, 0.2, 0.2, d + 2 * ov - 0.2, WOODD, TIMBER); a.box(0, g + u / 2 - 0.1, -(d / 2 + ov - 0.14), w + 2 * ov - 0.2, 0.2, 0.2, WOODD, TIMBER); }
        for (let x = -w / 2 + 0.5; x <= w / 2 - 0.49; x += (w - 1) / Math.max(1, Math.round(w / 2.2))) a.box(x, g - 0.5, d / 2 + ov / 2 - 0.1, 0.22, 0.5, ov + 0.1, WOODD, TIMBER);
        gable(g + u, 4.2, 1.3 + 2 * ov, RKEY[1], 0x7a5a3c, { keyEnd: STUCCO, tintEnd: tint });
        door0(f); win(wx, 1.3, 1.0, 1.3, f, true); for (const x of (w > 8 ? [-w / 4, w / 4] : [-1.4, 1.4])) win(x, g + 1.1, 0.9, 1.3, zf, i % 2 === 0); sideWin(g + 1.1, 1.2, ov - 0.05);
        for (const x of (w > 8 ? [-w / 4, w / 4] : [0])) backWin(x, g + 1.1, 0.9, 1.3, zf, i % 3 === 0); backWin(wx, 1.3, 1.0, 1.3, f, false);
        chimney(dx * 0.9, -d / 4, g + u, g + u + 5.2, 'bricks_2', BRICK); barrel(w / 2 - 0.5, d / 2 + 0.35);
    } else if (kind === 2) {   // SHOP HOUSE: the counter stands right of the doorway
        const hh = 3.6, cw2 = Math.max(1.6, Math.min(5.2, w / 2 - (dx + cw / 2 + 0.5) - 0.6)), cx = dx + cw / 2 + 0.5 + cw2 / 2;
        walls(0, w - 0.3, hh, d - 0.3, STUCCO, tint, PG); footS(0, w, 0.8, d);
        for (const s of [-1, 1]) for (const t of [-1, 1]) a.box(s * (w / 2 - 0.08), 0.8, t * (d / 2 - 0.08), 0.3, hh - 0.8, 0.3, WOODD, TIMBER);   // the corner posts stand proud of the walls (set in, their inner edge showed inside the hall as a dark line) a.box(0, hh - 0.26, 0, w, 0.26, d, WOODD, TIMBER, { top: false, under: true });
        gable(hh, 3.2, 1.0, SLATE, 0x5a6c96, { keyEnd: STUCCO, tintEnd: tint });
        door0(f); a.box(cx, 1.0, f, cw2, 1.5, 0.1, null, 0x241c18); a.box(cx, 0.9, f + 0.3, cw2 + 0.3, 0.12, 0.7, WOODK, 0x9a6a3c); a.box(cx, 0.8, f + 0.05, cw2 + 0.2, 0.1, 0.1, WOODD, TIMBER);
        for (let k = 0; k < 3; k++) { const bx = cx - cw2 / 2 + (k + 0.5) * cw2 / 3, kd = (i + k) % 3;   // a wicker basket of apples, one of cabbages, a board of loaves
            if (kd === 2) { a.box(bx, 1.02, f + 0.32, 0.7, 0.04, 0.42, WOODK, 0x9a6a3c); for (const q of [-0.2, 0.02, 0.24]) a.box(bx + q, 1.06, f + 0.32, 0.18, 0.12, 0.3, null, 0xc89a58); }
            else { a.cyl(bx, 1.02, f + 0.32, 0.26, 0.2, WOODK, 0xb89460, { seg: 10 }); a.cyl(bx, 1.2, f + 0.32, 0.28, 0.03, WOODK, 0x8a6a40, { seg: 10 });
                for (const q of [[-0.1, -0.06], [0.1, -0.05], [0, 0.1], [-0.02, -0.01]]) a.P.push({ s: 'dome', p: [bx + q[0], 1.2, f + 0.32 + q[1]], r: kd ? 0.1 : 0.08, seg: 8, tint: kd ? 0x6a9a4a : 0xb83a34 }); } }
        a.roof('shed', cx, 2.6, f + 0.75, cw2 + 0.6, 0.55, 1.5, null, (i % 2) ? 0xb03a3a : 0x3a5a9a, { ry: 180 }); for (const s of [-1, 1]) a.box(cx + s * (cw2 / 2 + 0.2), 0, f + 1.4, 0.12, 2.65, 0.12, WOODD, TIMBER);
        a.box(dx, 3.0, f + 0.6, 0.1, 0.1, 1.2, null, 0x2a2c30); a.box(dx, 2.3, f + 1.0, 0.08, 0.7, 0.9, WOODK, 0x8a5a34, { ds: true }); a.box(dx, 2.5, f + 1.0, 0.1, 0.3, 0.4, null, [0xd8b050, 0xc84a5a, 0x4a8a3a][i % 3], { ds: true });
        sideWin(1.5, 1.1); backWin(wx, 1.5, 1.0, 1.2, f, i % 2 === 1); chimney(w / 2 - 1.3, -d / 4, hh, hh + 4.0, WALL, STONE2); barrel(-w / 2 + 0.5, d / 2 + 0.35); barrel(-w / 2 + 1.25, d / 2 + 0.3);
    } else if (kind === 3) {   // THATCHED COTTAGE
        const hh = 2.8, rh = 3.6 + (i % 2) * 0.5;
        walls(0, w - 0.3, hh, d - 0.3, STUCCO, tint, PG); footS(0, w, 0.6, d);
        if (along) a.roof('hip', 0, hh, 0, d + 1.5, rh, w + 1.5, WOODD, STRAW, { ry: 90, gain: TG }); else a.roof('hip', 0, hh, 0, w + 1.5, rh, d + 1.5, WOODD, STRAW, { gain: TG });
        a.box(0, hh - 0.05, 0, w + 1.3, 0.3, d + 1.3, WOODD, 0xb09a54, { under: true, top: false });
        door0(f); if (w > 4.5) { win(wx, 1.2, 0.8, 0.9, f, true); backWin(wx, 1.2, 0.8, 0.9, f, false); } sideWin(1.3, 0.9);
        chimney(0, -d / 2 + 0.75, hh - 0.2, hh + rh + 0.4, WALL, STONE2);   // over the back wall's middle: the hearth inside stands under it (from the floor it filled the fire's mouth)
        for (let k = 0; k < 4; k++) a.box(-w / 2 + 0.5 + k * 0.42, 0, d / 2 + 0.3, 0.36, 0.3 + (k % 2) * 0.22, 0.9, WOODD, 0x7a5a3c);   // the firewood by the door
    } else if (kind === 4) {   // BURGHER HOUSE
        const hh = 7.4, st = [STONE, STONE3, 0xb8b4ac, 0xcac4b4][i % 4];
        walls(0, w - 0.2, hh, d - 0.2, WALL, st, SG); footS(0, w + 0.1, 1.0, d + 0.1);
        a.box(0, 3.5, 0, w + 0.1, 0.3, d + 0.1, WALL, STONE3, { top: false, under: true }); a.box(0, hh - 0.35, 0, w + 0.3, 0.35, d + 0.3, WALL, STONE3, { top: false, under: true });
        for (const s of [-1, 1]) for (const t of [-1, 1]) a.box(s * (w / 2 - 0.2), 1.0, t * (d / 2 - 0.2), 0.5, 0.55, 0.5, WALL, STONE3, { n: 6, step: [0, 1.05, 0] });
        gable(hh, 3.6, 0.9, SLATE, 0x4a5c8c, { keyEnd: WALL, tintEnd: st });
        door0(f); a.roof('gable', dx, 2.55, f + 0.55, cw + 1.1, 0.8, 1.3, SLATE, 0x4a5c8c); for (const s of [-1, 1]) a.box(dx + s * (cw / 2 + 0.4), 0, f + 1.05, 0.18, 2.55, 0.18, WALL, STONE3);
        win(wx + 0.3, 1.5, 1.0, 1.5, f, true); const n = w > 8 ? 3 : 2; for (let k = 0; k < n; k++) { win(-w / 2 + (k + 0.5) * w / n, 4.4, 1.0, 1.7, f, k % 2 === i % 2); backWin(-w / 2 + (k + 0.5) * w / n, 4.4, 1.0, 1.7, f, k % 2 !== i % 2); }
        backWin(wx + 0.3, 1.5, 1.0, 1.5, f, false); sideWin(4.4, 1.5); sideWin(1.5, 1.4);
        if (along) { chimney(0, -d / 2 + 0.7, hh, hh + 4.6, WALL, STONE2); chimney(0, d / 2 - 0.7, hh, hh + 4.6, WALL, STONE2); } else { chimney(-w / 2 + 0.7, 0, hh, hh + 4.6, WALL, STONE2); chimney(w / 2 - 0.7, 0, hh, hh + 4.6, WALL, STONE2); }
    } else {   // YARD HOUSE: the house on the left (the doorway is in it), the lean-to shed on the right, one hall inside
        const hh = 3.6, hw = Math.max(3.4, w * 0.6), sd = 1, hx = -(w - hw) / 2, lx = hw / 2, lw = w - hw;
        walls(hx, hw - 0.3, hh, d - 0.3, STUCCO, tint, PG, 'bl'); footS(hx, hw, 0.8, d, 1); a.box(hx + hw / 2 - 0.15, 2.5, 0, 0.1, hh - 2.5, d - 0.3, STUCCO, tint, { faces: 'r', top: false, gain: PG });
        for (const s of [-1, 1]) for (const t of [-1, 1]) a.box(hx + s * (hw / 2 - 0.08), 0.8, t * (d / 2 - 0.08), 0.3, hh - 0.8, 0.3, WOODD, TIMBER); a.box(hx, 2.75, d / 2 - 0.14, hw, 0.2, 0.2, WOODD, TIMBER, { n: 1 });   // the front rail, over the window and the door head (at 2.0 m it ran across both) a.box(hx, hh - 0.26, 0, hw, 0.26, d, WOODD, TIMBER, { top: false, under: true });
        a.roof('gable', hx, hh, 0, d + 0.9, 3.0, hw + 0.9, RKEY[0], dimBy(0xa84a3c, PG), { ry: 90, keyEnd: STUCCO, tintEnd: tint, gain: PG });
        a.box(lx, 0, 0, lw - 0.2, 2.5, d - 0.4, WOODK, 0x8a6a48, { top: false, faces: 'fbr', gain: 1.3 }); a.roof('shed', lx, 2.5, 0, d - 0.1, 1.0, lw + 0.4, WOODD, 0x6a4a34, { ry: 90 });
        a.box(lx, 0.2, d / 2 - 0.18, Math.max(1.2, lw - 1.2), 1.9, 0.1, null, 0x2a201a);
        door0(f); const wl = dx - 2.4; if (wl - 0.9 > hx - hw / 2 + 0.4) { win(wl, 1.4, 0.9, 1.1, f, true); backWin(wl, 1.4, 0.9, 1.1, f, i % 2 === 0); }
        chimney(hx, -d / 4, hh, hh + 4.0, 'bricks_2', BRICK); barrel(lx, d / 2 + 0.35); for (let k = 0; k < 3; k++) a.box(lx + sd * (lw / 2 + 0.1), 0, d / 2 + 0.2 - k * 0.5, 0.3, 0.3 + k * 0.2, 0.4, WOODD, 0x7a5a3c);
    }
}
/* how far the street is from a house's front: the squares of grass between its door step and the cobbles (0 = it stands on the street) */
const road = (x, y) => x >= 0 && y >= 0 && x < W && y < W && cell[y][x] === 'c';
function reach(h, side) { for (let k = 1; k <= 3; k++) { let hit = false;
        if (side === 'N' || side === 'S') { for (let x = h.x0; x < h.x1; x++) hit = hit || road(x, side === 'N' ? h.y0 - k : h.y1 - 1 + k); } else for (let y = h.y0; y < h.y1; y++) hit = hit || road(side === 'W' ? h.x0 - k : h.x1 - 1 + k, y);
        if (hit) return k - 1; } return 0; }
const KCOUNT = {}, LIST = [];
const IN = { 1: [STUCCO, 'wood_planks'], 2: [STUCCO, 'wood_planks'], 3: [STUCCO, 'dirt_2'], 4: [WALL, 'wood_planks'], 5: [WOODK, 'dirt_2'] };
HOUSES.forEach((h, i) => {
    const side = frontOf(h), kind = houseKind(h, i), hh = (kind === 1 || kind === 4) ? 7 : 3.6;
    const CH = [], B = kb('house_' + i, [h.x0, h.y0, h.x1, h.y1, side], hh, { leafDouble: false, keyIn: IN[kind][0], floorIn: IN[kind][1] }, (a, w, d, door) => houseLook(kind, a, w, d, i, Math.max(0, reach(h, side) * ctx.C - 0.75), door, CH));
    if (i % 6 === 0 && CH.length) ctx.inside(B, 'chimney_smoke', CH[0][0], CH[0][1], { y: CH[0][2] });   // PASS 4: one chimney in six smokes (a burning hearth's; three sprites each, so few)
    LIST.push({ B, kind, i }); count.houses = (count.houses || 0) + 1; KCOUNT[kind] = (KCOUNT[kind] || 0) + 1;
    if (process.env.CAM_HOUSES) console.log('house_' + i, 'kind ' + kind, 'front ' + side, 'squares ' + [h.x0, h.y0, h.x1, h.y1].join(' '), 'street ' + reach(h, side));   // CAM_HOUSES=1 node bake-camelot.js --dry-run: the list (which house is which kind, for a probe's views)
});
count.houseKinds = KCOUNT;
return LIST;
}

/* ── THE HOUSES' INSIDES (PASS 2b): ONE furnished inside a kind, laid out by rule on whatever squares the house has. T.js calls
   `insides(ctx, hall, list)` after its own halls (`hall` = T.js's helper: the arch row, sq, put, on, block, coat, ceiling, light, barrel).
   THE RULE: the door's column of squares stays open from the door to the back wall, where the hearth stands (wall side). The other squares
   are filled back row first, far from the door first: the bed, the table, then the kind's own pieces; a blocker on a square's middle with a
   ghost wall, decor by the walls. No real light in a house (43 hearth lights would be too many): embers, candles and windows are `glow`.
     1 townhouse   plaster, a dresser and a chest        2 shop    a counter behind the shop front, bread racks, crates
     3 cottage     an earth floor, straw, a bucket       4 burgher  panelled stone, a dining table with chairs, books, a round rug
     5 yard house  a workbench, barrels, straw (a workshop with a bed) ── */
function insides(ctx, hall, list) {
    const DARK = 0x5a4230, LAMP = 0xffd890, FW = { gain: 1.4, glow: 0.12 }, FT = 0x8a6238;
    const HTINT = [0xe8dcc0, 0xd8c8a8, 0xf0e8d8, 0xc8b89c], BRICK = 0xb86a54, WALL = ctx.WALL;
    if (process.env.CAM_NO_HOUSE_INSIDES === '1') return;   // a probe's baseline: the houses' halls bare (to compare draw calls)
    /* ONE ROW FOR ALL 43 (measured in the probe: a row a house made 1,570 more geometries in the room, its count doubled; the frame follows
       the count of meshes). Each house's parts are turned into the room's own frame (`toRoom`) and gathered in `cam:houses:in`, so every
       house shares its neighbours' materials: about forty meshes for the whole village's insides. Keep the looks FEW: one wood (FW), one
       dark wood, one linen; a new tint or glow is a new mesh. */
    const ALL = [], r3 = v => Math.round(v * 1000) / 1000;
    const toRoom = (B, P) => { const rot = B.face(0), q = rot * Math.PI / 180, c = Math.cos(q), sn = Math.sin(q);
        P.forEach(p => { const at = B.at(p.p[0], p.p[2]), o = Object.assign({}, p, { p: [at[0], p.p[1], at[1]] }); if (rot || p.ry) o.ry = ((p.ry || 0) + rot) % 360;
            if (p.step) o.step = [r3(p.step[0] * c - p.step[2] * sn), p.step[1], r3(p.step[0] * sn + p.step[2] * c)]; ALL.push(o); }); };
    list.forEach(({ B, kind, i }) => {
        const H = hall(B, 'house_' + i, { top: TOP[kind], noRow: true }), a = H.a, w = H.w, d = H.d, W2 = H.W2, D2 = H.D2, top = TOP[kind];
        const nx = Math.max(1, Math.round(w / 3.5)), nz = Math.max(1, Math.round(d / 3.5)), dx = B.door.lx, di = Math.max(0, Math.min(nx - 1, Math.floor((dx + W2) / 3.5)));
        if (kind === 4) { H.coat(WALL, STONE3, top, { gain: 1.45, glow: 0.12 }); H.coat(WOODK, 0x8a6a48, 1.3, { gain: 1.4, glow: 0.15 }, 0.336); }
        else if (kind === 5) H.coat(WOODK, 0xb08a5c, top, { gain: 1.5, glow: 0.2 });
        else H.coat(STUCCO, HTINT[i % 4], top, { gain: 1.5, glow: 0.14 });
        H.ceiling(WOODK, 0xb89468, 0.6, 0x4a3626, []);
        /* the hearth at the end of the door's column, on the back wall (the cottage's stands at its chimney's foot, the wall's middle) */
        const hx = kind === 3 ? 0 : H.sq(di, 0)[0], hz = -D2 + 0.33, HK = kind === 4 ? WALL : (kind === 3 ? WALL : 'bricks_2'), HT = HK === WALL ? STONE2 : BRICK;
        for (const s of [-1, 1]) a.box(hx + s * 0.85, 0, hz + 0.4, 0.4, 1.5, 0.8, HK, HT, { gain: 1.3 });
        a.box(hx, 1.5, hz + 0.4, 2.2, 0.35, 0.9, HK, HT, { gain: 1.3 }); a.box(hx, 1.85, hz + 0.3, 1.6, top - 1.85, 0.6, HK, HT, { gain: 1.3 }); a.box(hx, 0, hz + 0.05, 1.3, 1.5, 0.06, null, 0x1c1614);
        a.box(hx, 0.04, hz + 0.75, 1.9, 0.05, 0.7, WALL, STONE2); /* one hearth in three burns (the catalogue's flames and glow; the room's ten real lights are spent long before the houses), the others are banked: embers */
        if (i % 3 === 0) H.put('hearth_fire', hx, hz + 0.45, 180, { y: 0.05, noLight: true }); else { a.box(hx, 0.05, hz + 0.42, 0.9, 0.1, 0.4, null, 0xe04a10, { glow: 0.55 }); a.box(hx - 0.1, 0.05, hz + 0.5, 0.8, 0.16, 0.16, WOODD, 0x2a1c14); }
        H.block(hx - 1.05, hz + 0.4, hx + 1.05, hz + 0.4, 0.9, 1.5);
        /* the lit windows seen from inside, where the look has them on the ground floor */
        const wx = Math.min(w / 2 - 1.0, dx + 2.5);
        if (kind === 1) { H.light('f', wx, 1.3, 1.0, 1.3, 0xf0d890, 0.9, WOODD, TIMBER); H.light('b', wx, 1.3, 1.0, 1.3, 0xc8d8f0, 0.7, WOODD, TIMBER); }
        if (kind === 2) H.light('b', wx, 1.5, 1.0, 1.2, 0xc8d8f0, 0.7, WOODD, TIMBER);
        if (kind === 3 && w > 4.5) { H.light('f', wx, 1.2, 0.8, 0.9, 0xf0d890, 0.9, WOODD, TIMBER); H.light('b', wx, 1.2, 0.8, 0.9, 0xc8d8f0, 0.7, WOODD, TIMBER); }
        if (kind === 4) { H.light('f', wx + 0.3, 1.5, 1.0, 1.5, 0xf0d890, 0.9, WALL, STONE2); H.light('b', wx + 0.3, 1.5, 1.0, 1.5, 0xc8d8f0, 0.7, WALL, STONE2); }
        /* the free squares: every one off the door's column, back row first, far from the door first */
        const free = []; for (let j = 0; j < nz; j++) for (let k = 0; k < nx; k++) if (k !== di) free.push([k, j]);
        free.sort((p, q) => (p[1] - q[1]) || (Math.abs(q[0] - di) - Math.abs(p[0] - di)));
        const next = () => free.length ? H.sq.apply(null, free.shift()) : null;
        const table = q => { a.box(q[0], 0.7, q[1], 1.3, 0.07, 0.85, WOODK, FT, FW); for (const s of [-1, 1]) for (const t of [-1, 1]) a.box(q[0] + s * 0.55, 0, q[1] + t * 0.33, 0.09, 0.7, 0.09, WOODK, FT, FW);
            for (const s of [-1, 1]) { a.cyl(q[0] + s * 0.25, 0, q[1] + (s > 0 ? 0.85 : -0.85), 0.2, 0.42, WOODK, FT, Object.assign({ seg: 8 }, FW)); }
            a.cyl(q[0] + 0.3, 0.77, q[1], 0.05, 0.14, null, 0x9a9ca0, { seg: 8 }); a.box(q[0] - 0.25, 0.77, q[1] + 0.1, 0.05, 0.16, 0.05, null, 0xfff0c8, { glow: 1 }); H.block(q[0] - 0.65, q[1], q[0] + 0.65, q[1], 1.9, 0.75); };
        let q;
        /* the bed, in the back corner far from the door: a plank frame, a straw mattress, a blanket in the house's colour, a pillow (drawn: the pack's
           beds are iron hospital frames). The burgher's has a headboard and posts. */
        if ((q = next())) { const bz = Math.max(q[1], -D2 + 1.45), BL = [0x7a3a2a, 0x3a5a7a, 0x4a6a3a, 0x8a6a2a][i % 4];
            a.box(q[0], 0.18, bz, 1.25, 0.22, 2.1, WOODK, FT, FW); a.box(q[0], 0.4, bz, 1.15, 0.16, 2.0, STUCCO, 0xd8ccb0, { gain: 1.5, glow: 0.1 }); a.box(q[0], 0.56, bz + 0.3, 1.19, 0.06, 1.35, STUCCO, BL, { gain: 1.6, glow: 0.1 });
            a.box(q[0], 0.56, bz - 0.75, 0.8, 0.12, 0.4, STUCCO, 0xd8ccb0, { gain: 1.5, glow: 0.1 }); a.box(q[0], 0, bz - 1.02, 1.3, kind === 4 ? 1.5 : 0.85, 0.08, WOODK, FT, FW);
            for (const s of [-1, 1]) for (const t of [-1, 1]) a.box(q[0] + s * 0.6, 0, bz + t * 1.0, 0.1, kind === 4 ? 1.9 : 0.5, 0.1, WOODK, FT, FW);
            H.block(q[0], bz - 1.05, q[0], bz + 1.05, 1.3, 0.6); }
        if (kind === 2) {   // the shop: the counter along the front wall behind the shop front, the racks
            const cw2 = Math.max(1.6, Math.min(5.2, w / 2 - (dx + B.door.cw / 2 + 0.5) - 0.6)), cx = dx + B.door.cw / 2 + 0.5 + cw2 / 2, cz = D2 - 1.75;
            a.box(cx, 0, cz, cw2, 1.0, 0.7, WOODK, FT, FW); a.box(cx, 1.0, cz, cw2 + 0.15, 0.07, 0.85, WOODK, FT, FW); H.block(cx - cw2 / 2, cz, cx + cw2 / 2, cz, 0.8, 1.05);
            for (let k = 0; k < 3; k++) a.box(cx - cw2 / 2 + (k + 0.5) * cw2 / 3, 1.07, cz, 0.5, 0.12, 0.3, null, [0xc89a58, 0xb83a34, 0x6a9a4a][(i + k) % 3]);
            for (let n = free.length - 1; n >= 0; n--) if (free[n][1] === nz - 1 && free[n][0] > di) free.splice(n, 1);
            if ((q = next())) H.put('bread_rack', q[0], q[1], 180); if ((q = next())) { H.put('psx_wooden_crate_2', q[0] - 0.4, q[1], 0); H.put('psx_wooden_crate_1', q[0] + 0.7, q[1] + 0.3, 30); H.put('meshy_burlap_sack', q[0], q[1] + 1.0, 0); }
        } else {
            if ((q = next())) table(q);
            if (kind === 1) { if ((q = next())) H.put('sea_chest', q[0], q[1], 180); if ((q = next())) H.put('psx_shelf_mp_2', q[0], q[1], 180); }
            if (kind === 3) { if ((q = next())) { H.put('hw_straw', q[0], q[1], 30); H.put('wooden_bucket', q[0] + 1.0, q[1] + 0.8, 0); } }
            if (kind === 4) { if ((q = next())) H.put('library_shelf_full', q[0], q[1], 180); if ((q = next())) { H.put('psx_dinner_table_1', q[0], q[1], 0); H.put('psx_chair_mp_1', q[0] - 1.1, q[1] + 0.2, 90); H.put('psx_chair_mp_1', q[0] + 1.1, q[1] - 0.2, 270); }
                H.put('rug_round', H.sq(di, Math.min(nz - 1, 1))[0], H.sq(di, Math.min(nz - 1, 1))[1] + 0.3, 0); }
            if (kind === 5) { if ((q = next())) { a.box(q[0], 0.85, q[1], 2.6, 0.1, 0.9, WOODK, FT, FW); for (const s of [-1, 1]) a.box(q[0] + s * 1.1, 0, q[1], 0.14, 0.85, 0.8, WOODK, FT, FW); a.box(q[0] + 0.5, 0.95, q[1], 0.5, 0.26, 0.36, WOODK, FT, FW); H.block(q[0] - 1.3, q[1], q[0] + 1.3, q[1], 1.0, 0.95); }
                if ((q = next())) { H.barrel(q[0] - 0.5, q[1] - 0.3); H.barrel(q[0] + 0.5, q[1] + 0.2, 0.36, 0.9); H.put('hw_straw', q[0], q[1] + 1.1, 70); } }
        }
        /* by the walls, off the squares' middles: a barrel and a sack in the front corner far from the door, a shelf of pots, two candle sconces */
        const cs = di >= nx / 2 ? -1 : 1; H.barrel(cs * (W2 - 0.85), D2 - 0.85, 0.36, 0.9); H.put('meshy_burlap_sack', cs * (W2 - 1.7), D2 - 0.75, 20);
        a.box(-cs * (W2 - 0.5), 1.5, 0, 0.3, 0.05, Math.min(2.4, d - 2), WOODK, FT, FW); a.cyl(-cs * (W2 - 0.5), 1.55, -0.6, 0.1, 0.2, null, 0xa8683a, { seg: 8, n: 3, step: [0, 0, 0.55] });
        for (const s of [-1, 1]) { a.box(s * (W2 - 0.42), 1.7, D2 - 1.2, 0.14, 0.05, 0.14, null, 0x2a2c30); a.box(s * (W2 - 0.42), 1.75, D2 - 1.2, 0.06, 0.16, 0.06, null, LAMP, { glow: 1 }); }
        toRoom(B, a.P);
    });
    ctx.arch.push({ k: 'arch', id: 'cam:houses:in', x: 0, z: 0, rot: 0, y: 0, parts: ALL });   // `y: 0`: the room's middle is the castle hill's top, the houses stand on the ground
}
module.exports = { houses, insides };
