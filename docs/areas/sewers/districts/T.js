/* THE SEWERS, district T · THE RUNNING TUNNELS (5 plots: the Ghost Station, the Loop Line twice, the Crossing, the Depot).
   One thread a file (docs/notes/claims.md). Read by `node bake-sewers.js`; rules: docs/notes/areas-complexes.md "THE SEWERS ON PLOTS".
   BRIEF: the subway under the sewers (mondo 11-16: "the subway station can be connected to / a part of the sewers"). Level 1, two levels
   under the culverts; reached by the Maintenance Hatch stair (the Depot) and the rope down the well at the Junction (the Crossing).
   The tool lays the two steel rails along every run of `j` squares. ctx: see W.js.
   PASS 1 (the district thread, 11-16, EXTERIORS; notes: areas-complexes.md "THE SEWERS, DISTRICT T"): the track bed under every rail (ballast,
   sleepers, a third rail), cables + bulkhead lamps along the south / east walls, the Ghost Station's shell (the platform out to the track,
   tiled walls, name panels, the shuttered WAY OUT, tube lamps), the Signal Gantry over the Crossing + its cabin, the Depot's crane, lamps,
   buffer stops, road numbers and crew room. Everything is `arch` parts (drawn) + ghost walls (walked); lit = `glow`, not a light.
   STANDS TODAY (first build): the Ghost Station's platform 1 m up with its bench, board and maps; two parked trains in the Depot; torches;
   the old room's four bystanders. THE MODEL LIST PASS: the signal frame + signals at the Crossing, depot gear, Metro columns, the well's bucket and rope, railway lanterns. NOT YET: the lit train's light, the garden well's rope as a model,
   station tiles on the tunnel walls. */
'use strict';
const nth = (list, i) => list.length ? list[Math.min(list.length - 1, Math.max(0, i))] : null;

/* ── the district thread's helpers: a plot's own frame (metres from its middle; square lx's west line = X(lx), its middle = XC(lx)) ── */
const S = 3.5, X = l => l * S - 21, XC = l => l * S - 19.25, R2 = v => Math.round(v * 100) / 100;
const fix = q => { const o = Object.assign({}, q); ['p', 'size', 'step'].forEach(k => { if (Array.isArray(o[k])) o[k] = o[k].map(R2); }); return o; };
const mid = (ctx, id) => { const p = ctx.plot[id]; return [R2(ctx.gx(p.sx) + 21), R2(ctx.gz(p.sy) + 21)]; };
const arch = (ctx, id, name, parts) => { const m = mid(ctx, id); if (parts.length) ctx.feat({ k: 'arch', id: 'sewT:' + id + ':' + name, x: m[0], z: m[1], rot: 0, y: ctx.plot[id].base, base: ctx.plot[id].base, parts: parts.map(fix) }); };
/* a walked wall nobody sees (the drawn one is an `arch` part), in a plot's own metres */
const ghost = (ctx, id, x0, z0, x1, z1, h, t) => { const m = mid(ctx, id); ctx.feat({ k: 'wall', x0: R2(m[0] + x0), z0: R2(m[1] + z0), x1: R2(m[0] + x1), z1: R2(m[1] + z1), h: h || 3.2, t: t || 0.3, ghost: true, rail: false }); };
/* the sheets (MODEL_LIST: the Metro PSX pack's own textures + the Urban Decay pack) */
const TILE = 'urban:TileSubwayGen1', WTILE = 'urban:TileSubwayGen2', GTILE = 'urban:TileSubway1c' /* (the Metro pack's two wall-tile JPGs are not power-of-two sheets: they draw black when repeated) */, CONC = 'urban:MetroConcrete', TACT = 'urban:MetroTactile', MET = 'urban:MetroMetal',
    TRUSS = 'urban:MetalTruss1a', BEAM = 'urban:MetalBeams1a', HAZ = 'urban:MetalWarningStripe1', SHUT = 'urban:MetalShutter1a', PEB = 'urban:GroundPebbles1a',
    GRID = 'urban:MetalGratingGrid1a', PLATE = 'urban:MetalDiamondPlate1a', PBRICK = 'urban:BrickPainted1a', CBRICK = 'urban:BrickCinder2a', GLASS = 'urban:GlassWindowFactory1a';
const INK = '#f1ead2', GREEN = '#1f4a3c', DARK = 0x1c1e20, IRON = 0x2a2c2e, WOODT = 0x4a3420, AMBER = 0xffc070, LAMP = 0xe6f0d8;
const sign = (words, bg, asp) => 'txt:' + words + '|' + INK + '|' + bg + '|' + asp;
/* a two-lamp signal head on a post beside the track: the green one burns ("Signals green." "There is no train.") */
const signalPost = (x, z, ry) => { const s = Math.sin(ry * Math.PI / 180), c = Math.cos(ry * Math.PI / 180), f = (d) => [x - s * d, 0, z + c * d];
    const at = (d, y) => { const q = f(d); return [q[0], y, q[2]]; }, sz = (w, h, d) => (ry % 180) ? [d, h, w] : [w, h, d];
    return [{ s: 'box', p: [x, 0, z], size: [0.12, 2.5, 0.12], tint: IRON }, { s: 'box', p: [x, 2.5, z], size: sz(0.4, 0.95, 0.26), tint: 0x0e0e0e },
        { s: 'box', p: at(0.14, 3.02), size: sz(0.2, 0.2, 0.05), tint: 0x3a0c08 }, { s: 'box', p: at(0.14, 2.66), size: sz(0.2, 0.2, 0.05), tint: 0x2aff6a, glow: 1 },
        { s: 'box', p: [x, 3.45, z], size: sz(0.5, 0.06, 0.4), tint: 0x0e0e0e }]; };
/* a buffer stop across a track's end (drawn; its ghost wall is laid beside it) */
const buffer = (x, z) => [{ s: 'box', p: [x, 0, z - 0.72], size: [0.22, 1.05, 0.22], tint: IRON }, { s: 'box', p: [x, 0, z + 0.72], size: [0.22, 1.05, 0.22], tint: IRON },
    { s: 'box', p: [x, 0.62, z], size: [0.26, 0.4, 2.3], key: HAZ }, { s: 'box', p: [x - 0.5, 0, z - 0.72], size: [1.0, 0.16, 0.16], tint: IRON }, { s: 'box', p: [x - 0.5, 0, z + 0.72], size: [1.0, 0.16, 0.16], tint: IRON },
    { s: 'box', p: [x, 1.05, z], size: [0.16, 0.16, 0.16], tint: 0xff2010, glow: 1 }];
/* a hut built into a recess: its front wall along z = zf between x0 and x1 with a door (middle xd) and a lit window (xw0..xw1), a slab over it */
function hut(ctx, id, name, x0, x1, zf, zb, xd, xw0, xw1, lit, board) {
    const H = 3.2, T = 0.3, parts = [], seg = (a, b, y, h, key, tint) => parts.push({ s: 'box', p: [(a + b) / 2, y, zf], size: [b - a, h, T], key: key || PBRICK, tint: tint == null ? 0x8c8c80 : tint });
    /* the solid runs between the door and the window, whichever comes first along the wall */
    { const cuts = [[xd - 0.78, xd + 0.78], [xw0, xw1]].sort((a, b) => a[0] - b[0]); let at = x0; cuts.forEach(c => { if (c[0] > at + 0.01) seg(at, c[0], 0, H); at = c[1]; }); if (x1 > at + 0.01) seg(at, x1, 0, H); }
    seg(xd - 0.78, xd + 0.78, 2.3, H - 2.3); seg(xw0, xw1, 0, 1.0); seg(xw0, xw1, 2.5, H - 2.5);
    parts.push({ s: 'box', p: [(xw0 + xw1) / 2, 1.0, zf], size: [xw1 - xw0, 1.5, 0.08], key: GLASS, uv: [1.75, 1.5], tint: lit, glow: 0.7, kind: 'glass' });
    for (let x = xw0; x <= xw1 + 0.01; x += (xw1 - xw0) / 3) parts.push({ s: 'box', p: [x, 1.0, zf], size: [0.08, 1.5, 0.14], tint: DARK });
    parts.push({ s: 'box', p: [(xw0 + xw1) / 2, 0.96, zf + 0.05], size: [xw1 - xw0 + 0.3, 0.08, 0.3], key: CONC });
    parts.push({ s: 'box', p: [(x0 + x1) / 2, H, (zf + zb) / 2 + 0.2], size: [x1 - x0, 0.25, Math.abs(zb - zf) + 0.7], key: CONC, tint: 0x8a8a84, under: true });
    parts.push({ s: 'box', p: [(x0 + x1) / 2, 0.02, (zf + zb) / 2], size: [x1 - x0, 0.03, Math.abs(zb - zf)], key: 'urban:TileLinoleum1a', tint: 0x9a9a8a, sides: false });   // the hut's floor
    [[x0 + 0.06, 'l'], [x1 - 0.06, 'r']].forEach(q => parts.push({ s: 'box', p: [q[0], 0, (zf + zb) / 2], size: [0.1, H, Math.abs(zb - zf)], key: 'urban:PlasterWallPainted1a', tint: 0x7c8474 }));
    parts.push({ s: 'box', p: [(x0 + x1) / 2, 0, zb + (zb < zf ? 0.06 : -0.06)], size: [x1 - x0, H, 0.1], key: 'urban:PlasterWallPainted1a', tint: 0x7c8474 });
    if (board) parts.push({ s: 'quad', p: [(xw0 + xw1) / 2, 2.62, zf + (zb < zf ? 0.17 : -0.17)], ry: zb < zf ? 0 : 180, size: [Math.min(4.2, xw1 - xw0), 0.5], key: sign(board, '#24282c', 8), glow: 0.3, uv: 'fit' });
    arch(ctx, id, name, parts);
    ghost(ctx, id, x0, zf, xd - 0.78, zf); ghost(ctx, id, xd + 0.78, zf, x1, zf);
    const m = mid(ctx, id); return { x: R2(m[0] + xd), z: R2(m[1] + zf), rot: 0, w: 1.55, leaf: 'leaf_security' };
}
module.exports = {
    build(ctx) {
        /* THE GHOST STATION: the platform stands 1 m over the track ("it has a platform and no stairs up": no way out of it but the track).
           PASS 1: it runs out to the track's edge (the walk between them is the platform now). */
        const g = ctx.plot['P00-03'], x0 = ctx.gx(g.sx + 2), x1 = ctx.gx(g.sx + 10), z0 = ctx.gz(g.sy + 2), z1 = ctx.gz(g.sy + 6);
        ctx.feat({ k: 'plateau', x: ctx.r2((x0 + x1) / 2), z: ctx.r2((z0 + z1) / 2), w: ctx.r2(x1 - x0), d: ctx.r2(z1 - z0), h: ctx.r2(g.base + 1), edge: 0.15 });
        ctx.feat({ k: 'ramp', x0: ctx.r2(ctx.gx(g.sx + 10) + 3.5), z0: ctx.gcz(g.sy + 4), x1: ctx.r2(ctx.gx(g.sx + 10) - 0.4), z1: ctx.gcz(g.sy + 4), w: 3.5, h0: g.base, h1: ctx.r2(g.base + 1), stairs: true, model: 'metro', edge: 0.15 });
        const isJ = (x, y) => x >= 0 && y >= 0 && x < ctx.W && y < ctx.H && ctx.cell[y][x] === 'j', op = (x, y) => ctx.open(x, y);

        /* ── THE TRACK BED under the tool's rails (the same runs): ballast, sleepers every 0.7 m, a third rail under its board ── */
        const bed = {}; ctx.plots.forEach(p => { bed[p.id] = []; });
        for (const horiz of [true, false]) for (let y = 0; y < ctx.H; y++) for (let x = 0; x < ctx.W; x++) { if (!isJ(x, y)) continue;
            if (horiz ? isJ(x - 1, y) : isJ(x, y - 1)) continue; let n = 0; while (isJ(x + (horiz ? n : 0), y + (horiz ? 0 : n))) n++; if (n < 2) continue;
            if (!horiz) { let lone = true; for (let i = 0; i < n; i++) if (!(isJ(x - 1, y + i) || isJ(x + 1, y + i))) lone = false; if (lone && n < 3) continue; }
            /* cut at every plot line; a piece belongs to its plot's row */
            for (let i = 0; i < n;) { const sx = x + (horiz ? i : 0), sy = y + (horiz ? 0 : i), p = ctx.plots.find(q => sx >= q.sx && sx < q.sx + 12 && sy >= q.sy && sy < q.sy + 12);
                let m = 1; while (i + m < n && ((horiz ? sx + m : sy + m) % 12) !== 0) m++;
                if (p) { const L = m * S, a = (horiz ? X(sx - p.sx) : X(sy - p.sy)) + L / 2, c = horiz ? XC(sy - p.sy) : XC(sx - p.sx), P3 = (u, yy, v) => horiz ? [u, yy, v] : [v, yy, u], Z3 = (u, h, v) => horiz ? [u, h, v] : [v, h, u];
                    bed[p.id].push({ s: 'box', p: P3(a, 0, c), size: Z3(L, horiz ? 0.045 : 0.05, 3.0), key: PEB, tint: 0x5c574f, sides: false },
                        { s: 'box', p: P3(a - L / 2 + 0.35, 0.03, c), size: Z3(0.24, 0.075, 2.4), tint: 0x35281b, n: Math.round(L / 0.7), step: Z3(0.7, 0, 0) },
                        { s: 'box', p: P3(a, 0.08, c + 1.2), size: Z3(L, 0.16, 0.09), tint: 0x25262a }, { s: 'box', p: P3(a, 0.27, c + 1.26), size: Z3(L, 0.035, 0.26), tint: WOODT }); }
                i += m; } }
        ctx.plots.forEach(p => arch(ctx, p.id, 'track', bed[p.id]));

        /* ── THE TUNNEL WALLS: along every south wall (and every east wall) of a run of two squares or more, three cables on the wall and a
           bulkhead lamp every third square, two in three alight (the tool's rusted mains run on the north / west walls). The Ghost
           Station and the Depot dress their own walls. ── */
        ctx.plots.forEach((p, pi) => { if (p.id === 'P00-03') return; const parts = []; let k = pi;
            const side = (horiz) => { for (let a = 0; a < 12; a++) { let run = 0; for (let b = 0; b <= 12; b++) { const lx = horiz ? b : a, ly = horiz ? a : b, sx = p.sx + lx, sy = p.sy + ly;
                const wall = b < 12 && op(sx, sy) && !op(sx + (horiz ? 0 : 1), sy + (horiz ? 1 : 0)) && !(p.id === 'P04-03' && lx >= 1 && lx <= 10 && ly >= 1 && ly <= 9) && !(p.id === 'P02-03' && lx >= 8 && ly >= 3 && ly <= 4);
                if (wall) { run++; continue; } if (run >= 2) { const b0 = b - run, L = run * S, u = X(b0) + L / 2, w = X(a + 1) - 0.07, P3 = (uu, y, off) => horiz ? [uu, y, w - off] : [w - off, y, uu], Z3 = (l, h, t) => horiz ? [l, h, t] : [t, h, l];
                    [1.95, 2.07, 2.19].forEach((y, i) => parts.push({ s: 'box', p: P3(u, y, 0.04 + i * 0.01), size: Z3(L, 0.05, 0.05), tint: [0x101010, 0x161310, 0x0c1014][i] }));
                    parts.push({ s: 'box', p: P3(u - L / 2 + 0.6, 1.9, 0.03), size: Z3(0.06, 0.36, 0.1), tint: IRON, n: Math.max(1, Math.round(L / 1.75)), step: Z3(1.75, 0, 0) });
                    for (let q = 1; q < run; q += 3, k++) { const uu = X(b0 + q) + 1.75; parts.push({ s: 'box', p: P3(uu, 2.42, 0.06), size: Z3(0.36, 0.22, 0.14), tint: DARK });
                        parts.push(k % 3 ? { s: 'box', p: P3(uu, 2.46, 0.15), size: Z3(0.26, 0.13, 0.06), tint: AMBER, glow: 1 } : { s: 'box', p: P3(uu, 2.46, 0.15), size: Z3(0.26, 0.13, 0.06), tint: 0x3a352c }); } }
                    run = 0; } } };
            side(true); side(false); arch(ctx, p.id, 'walls', parts); });

        /* ── THE GHOST STATION (P00-03): the platform's own frame is x -14..14, z -14..0, its top 1 m up; the track's wall is z = 7 ── */
        { const P = [], lit = [true, false, true, false];
          P.push({ s: 'box', p: [0, 0, -0.1], size: [28, 0.92, 0.16], key: CBRICK, tint: 0x6a6a62 }, { s: 'box', p: [0, 0.9, -0.2], size: [28.2, 0.13, 0.55], key: CONC },
              { s: 'box', p: [0, 1.01, -0.85], size: [28, 0.025, 0.6], key: TACT, sides: false },
              { s: 'box', p: [0, 0.99, -7.1], size: [28, 0.02, 13.8], key: 'urban:MetroFloor', tint: 0xa8a8a0, sides: false },   // the platform's own terrazzo over the room's paint
              /* the north wall under the vault's spring: tiles, a green trim, the name three times */
              { s: 'box', p: [0, 1.0, -13.9], size: [28, 1.3, 0.3], key: GTILE, uv: [1.75, 1.3], tint: 0xd0d0c0, glow: 0.32 }, { s: 'box', p: [0, 2.3, -13.86], size: [28, 0.14, 0.38], tint: 0x1f5a48 },
              /* the west end: tiles to the vault (the room's rusted main crosses it) */
              { s: 'box', p: [-13.9, 1.0, -7], size: [0.3, 3.4, 14], key: WTILE, uv: [3.5, 3.4], tint: 0xc4c4b6, glow: 0.26 },
              /* the east end beside the step: the WAY OUT behind a shutter that has not gone up since ("no stairs up") */
              { s: 'box', p: [13.9, 1.0, -10.5], size: [0.3, 3.1, 7], key: WTILE, uv: [3.5, 3.1], tint: 0xc4c4b6, glow: 0.26 }, { s: 'box', p: [13.72, 1.0, -10.5], size: [0.12, 2.4, 3.2], key: SHUT, tint: 0x8a7a66 },
              { s: 'box', p: [13.7, 1.0, -12.25], size: [0.3, 2.4, 0.3], tint: DARK }, { s: 'box', p: [13.7, 1.0, -8.75], size: [0.3, 2.4, 0.3], tint: DARK }, { s: 'box', p: [13.7, 3.4, -10.5], size: [0.3, 0.3, 3.8], tint: DARK },
              { s: 'quad', p: [13.5, 3.74, -10.5], ry: 90, size: [3.0, 0.5], key: sign('WAY OUT', '#8a1f1a', 6), glow: 0.25, uv: 'fit' },
              /* the wall across the track: a tile band, the name, the cables */
              { s: 'box', p: [0, 0.5, 6.9], size: [42, 1.2, 0.25], key: TILE, tint: 0xb0b0a0, glow: 0.22 }, { s: 'box', p: [0, 1.7, 6.92], size: [42, 0.1, 0.3], tint: 0x1f5a48 });
          [2.5, 2.6, 2.7].forEach((y, i) => P.push({ s: 'box', p: [0, y, 6.84 - i * 0.01], size: [42, 0.05, 0.05], tint: 0x101010 }));
          [-9, 0, 9].forEach(x => P.push({ s: 'quad', p: [x, 1.52, -13.73], size: [3.9, 0.62], key: sign('GHOST STATION', GREEN, 6.3), glow: 0.4, uv: 'fit' }, { s: 'quad', p: [x - 1.5, 1.86, 6.76], ry: 180, size: [3.9, 0.62], key: sign('GHOST STATION', GREEN, 6.3), glow: 0.35, uv: 'fit' }));
          /* a capital on each of the four columns (the columns are the Metro pack's, in dress) and four tube lamps, two alight */
          [2, 4, 7, 9].forEach(lx => P.push({ s: 'box', p: [XC(lx), 4.9, XC(4)], size: [1.0, 0.32, 1.0], key: CONC }, { s: 'box', p: [XC(lx), 1.0, XC(4)], size: [0.95, 0.2, 0.95], key: CONC }));
          [-10.5, -3.5, 3.5, 10.5].forEach((x, i) => { P.push({ s: 'box', p: [x, 4.5, -8.6], size: [1.9, 0.12, 0.4], tint: DARK }, { s: 'box', p: [x - 0.7, 4.6, -8.6], size: [0.04, 0.45, 0.04], tint: IRON }, { s: 'box', p: [x + 0.7, 4.6, -8.6], size: [0.04, 0.45, 0.04], tint: IRON });
              P.push(lit[i] ? { s: 'box', p: [x, 4.43, -8.6], size: [1.6, 0.07, 0.22], tint: LAMP, glow: 1 } : { s: 'box', p: [x, 4.43, -8.6], size: [1.6, 0.07, 0.22], tint: 0x3a3d38 }); });
          arch(ctx, 'P00-03', 'station', P); }

        /* ── THE CROSSING (P02-03): THE SIGNAL GANTRY, 5.2 m, over the square where the two lines cross (lx 6, ly 6); a head to each way,
           all four green. The check plate under it; a ladder up the south-west leg. The cabin in the north-east recess. ── */
        { const P = [], a = X(6) - 0.2, b = X(7) + 0.2, c = (a + b) / 2;
          [[a, a], [b, a], [a, b], [b, b]].forEach(q => P.push({ s: 'box', p: [q[0], 0, q[1]], size: [0.32, 5.2, 0.32], key: TRUSS, tint: 0x8a8f8a }, { s: 'box', p: [q[0], 0, q[1]], size: [0.6, 0.2, 0.6], key: CONC }));
          [[c, a, true], [c, b, true], [a, c, false], [b, c, false]].forEach(q => P.push({ s: 'box', p: [q[0], 4.5, q[1]], size: q[2] ? [b - a, 0.7, 0.22] : [0.22, 0.7, b - a], key: TRUSS, tint: 0x8a8f8a, ds: true }));
          P.push({ s: 'box', p: [c, 4.42, c], size: [b - a, 0.08, b - a], key: GRID, tint: 0x7a7a74, under: true }, { s: 'box', p: [c, 0.06, c], size: [3.3, 0.05, 3.3], key: PLATE, tint: 0x6a6a64, sides: false });
          /* the four heads hang under the beams over each track's middle; the lit lens looks out along its line */
          [[a - 0.16, c, 90], [b + 0.16, c, 270], [c, a - 0.16, 180], [c, b + 0.16, 0]].forEach(q => { const ew = q[2] % 180 !== 0, sz = (w, h, d) => ew ? [d, h, w] : [w, h, d], out = q[2] === 90 ? [-0.16, 0] : q[2] === 270 ? [0.16, 0] : q[2] === 180 ? [0, -0.16] : [0, 0.16];
              P.push({ s: 'box', p: [q[0], 3.45, q[1]], size: sz(0.46, 1.05, 0.28), tint: 0x0e0e0e }, { s: 'box', p: [q[0] + out[0], 4.08, q[1] + out[1]], size: sz(0.22, 0.22, 0.05), tint: 0x3a0c08 },
                  { s: 'box', p: [q[0] + out[0], 3.62, q[1] + out[1]], size: sz(0.22, 0.22, 0.05), tint: 0x2aff6a, glow: 1 }); });
          P.push({ s: 'box', p: [a - 0.3, 0.2, b - 0.22], size: [0.05, 4.3, 0.05], tint: IRON }, { s: 'box', p: [a - 0.3, 0.2, b + 0.22], size: [0.05, 4.3, 0.05], tint: IRON }, { s: 'box', p: [a - 0.3, 0.45, b], size: [0.04, 0.04, 0.44], tint: IRON, n: 13, step: [0, 0.32, 0] });
          /* the dead-end line south of the crossing: a buffer stop at its end */
          buffer(XC(6), X(10) + 2.6).forEach(q => { const o = Object.assign({}, q); o.p = [XC(6) + (q.p[2] - (X(10) + 2.6)), q.p[1], X(10) + 2.6 + (q.p[0] - XC(6))]; o.size = [q.size[2], q.size[1], q.size[0]]; P.push(o); });
          arch(ctx, 'P02-03', 'gantry', P); ghost(ctx, 'P02-03', X(6) + 0.4, X(10) + 2.6, X(7) - 0.4, X(10) + 2.6, 1.1); }
        const leaves = [];
        leaves.push(hut(ctx, 'P02-03', 'cabin', X(8), X(11), X(5), X(3), XC(8), X(9) + 0.6, X(11) - 0.7, 0x9fe0b0, 'THE CROSSING'));

        /* ── THE DEPOT (P04-03): the hall is x -17.5..17.5, z -10.5..10.5, 12 m to the vault. An overhead crane on its two rails, six high-bay
           lamps (three alight), a buffer stop at each end of the two roads, the road numbers and the name on the east wall, a painted
           dado. The crew room in the north-west recess. ── */
        { const P = [];
          [-10.25, 10.25].forEach(z => P.push({ s: 'box', p: [0, 6.5, z], size: [35, 0.45, 0.35], key: BEAM, tint: 0x8a8880 }, { s: 'box', p: [-15.75, 5.9, z], size: [0.5, 0.6, 0.5], key: CONC, n: 6, step: [6.3, 0, 0] }));
          P.push({ s: 'box', p: [5.25, 6.95, 0], size: [0.9, 0.8, 20.8], key: 'urban:MetalPanelPainted1a', tint: 0xb8901c }, { s: 'box', p: [5.25, 6.95, -10.25], size: [2.2, 0.5, 0.5], tint: IRON }, { s: 'box', p: [5.25, 6.95, 10.25], size: [2.2, 0.5, 0.5], tint: IRON },
              { s: 'box', p: [5.25, 6.45, -1.75], size: [1.2, 0.5, 1.2], tint: DARK }, { s: 'box', p: [5.25, 3.25, -1.75], size: [0.05, 3.2, 0.05], tint: IRON }, { s: 'box', p: [5.25, 2.8, -1.75], size: [0.36, 0.46, 0.26], key: HAZ });
          [[-12.25, -1.75], [-1.75, -1.75], [12.25, -1.75], [-12.25, 5.25], [-1.75, 5.25], [12.25, 5.25]].forEach((q, i) => { P.push({ s: 'box', p: [q[0], 6.2, q[1]], size: [0.04, 3.2, 0.04], tint: IRON }, { s: 'cyl', p: [q[0], 5.85, q[1]], r: 0.48, r2: 0.16, h: 0.36, tint: DARK, seg: 10 });
              P.push(i % 2 === 0 ? { s: 'cyl', p: [q[0], 5.8, q[1]], r: 0.4, h: 0.05, tint: 0xffe2a8, glow: 1, seg: 10 } : { s: 'cyl', p: [q[0], 5.8, q[1]], r: 0.4, h: 0.05, tint: 0x3a352c, seg: 10 }); });
          [XC(4), XC(8)].forEach(z => { buffer(X(10) - 0.5, z).forEach(q => P.push(q)); buffer(X(2) + 0.5, z).forEach(q => { const o = Object.assign({}, q); o.p = [2 * (X(2) + 0.5) - q.p[0], q.p[1], q.p[2]]; P.push(o); }); });
          /* the walls: a painted-brick dado under a warning line; the south and the east wall whole, the north wall east of the stair */
          const dado = (x, z, w, d) => P.push({ s: 'box', p: [x, 0, z], size: [w, 1.5, d], key: PBRICK, tint: 0x7c8474 }, { s: 'box', p: [x, 1.5, z], size: [w + (w > d ? 0 : 0.04), 0.14, d + (w > d ? 0.04 : 0)], key: HAZ });
          dado(0, 10.42, 35, 0.14); dado(17.42, 0, 0.14, 21); dado(12.25, -10.42, 10.5, 0.14); dado(-17.42, 8.75, 0.14, 3.5); dado(-17.42, -7, 0.14, 7);
          P.push({ s: 'quad', p: [17.3, 4.0, 1.75], ry: 90, size: [7.5, 1.5], key: sign('THE DEPOT', '#24282c', 5), glow: 0.22, uv: 'fit' },
              { s: 'quad', p: [17.3, 2.1, XC(4)], ry: 90, size: [1.2, 1.2], key: sign('1', '#24282c', 1), glow: 0.3, uv: 'fit' }, { s: 'quad', p: [17.3, 2.1, XC(8)], ry: 90, size: [1.2, 1.2], key: sign('2', '#24282c', 1), glow: 0.3, uv: 'fit' });
          /* THE LIT TRAIN (road 1; "Two cars. One lit." "The lit one has never moved." "Somebody left the headlight on."): its saloon lights and its two headlights */
          P.push({ s: 'box', p: [XC(5), 2.78, XC(4)], size: [14.6, 0.05, 0.45], tint: 0xfff0c8, glow: 1 }, { s: 'box', p: [XC(5) - 8.2, 1.45, XC(4) - 0.85], size: [0.06, 0.2, 0.22], tint: 0xfff6dc, glow: 1 }, { s: 'box', p: [XC(5) - 8.2, 1.45, XC(4) + 0.85], size: [0.06, 0.2, 0.22], tint: 0xfff6dc, glow: 1 });
          P.push({ s: 'box', p: [0, 0, 0], size: [35, 0.02, 21], key: 'urban:ConcreteSlab2a', tint: 0x8a8a84, sides: false });   // the hall's concrete over the room's paint
          arch(ctx, 'P04-03', 'hall', P);
          [XC(4), XC(8)].forEach(z => { ghost(ctx, 'P04-03', X(10) - 0.5, z - 1, X(10) - 0.5, z + 1, 1.1); ghost(ctx, 'P04-03', X(2) + 0.5, z - 1, X(2) + 0.5, z + 1, 1.1); }); }
        leaves.push(hut(ctx, 'P04-03', 'crew', X(1), X(4), X(3), X(1), XC(3), X(1) + 0.7, X(3) - 0.5, 0xffd9a0, 'CREW ROOM'));
        /* the two huts' swinging doors (three-renderer.js _hqBuildTexDoors: a `doorsOnly` carrier row) */
        ctx.feat({ k: 'texbuilding', id: 'sewT:doors', x: 0, z: 0, y: 0, w: 2, d: 2, rot: 0, storeys: 1, skin: false, doorsOnly: true, leaf: 'leaf_security', inner: leaves });

        /* a signal post where the line leaves each Loop Line plot */
        arch(ctx, 'P01-03', 'signal', signalPost(X(1) + 0.3, X(6) - 0.25, 90)); arch(ctx, 'P03-03', 'signal', signalPost(X(11) - 0.3, X(6) - 0.25, 270));
    },
    plan(ctx) {
        /* the platform's east step needs its square open */
        const g = ctx.plot['P00-03']; for (let lx = 10; lx <= 11; lx++) if (ctx.cell[g.sy + 4][g.sx + lx] === 'x') ctx.cell[g.sy + 4][g.sx + lx] = 'o';
        /* PASS 1: the platform runs out to the track (the walk between them becomes platform) */
        ctx.setRect(g.sx + 2, g.sy + 5, g.sx + 10, g.sy + 6, 'f');
        /* two recesses dug for huts: the signal cabin north-east of the Crossing, the crew room in the Depot's north-west corner */
        const c = ctx.plot['P02-03']; ctx.setRect(c.sx + 8, c.sy + 3, c.sx + 11, c.sy + 5, 'f');
        const d = ctx.plot['P04-03']; ctx.setRect(d.sx + 1, d.sy + 1, d.sx + 4, d.sy + 3, 'f');
    },
    dress(ctx) {
        const st = ctx.squares('P00-03', 'f').filter(q => q[1] === 2);
        ['metro_bench', 'departures_board', 'tube_map', 'metro_vending', 'metro_bin'].forEach((k, i) => { const q = st[1 + i * 1]; if (q && ctx.free('P00-03', q[0], q[1])) ctx.P(k, 'P00-03', q[0], q[1], { face: 180 }); });
        /* THE DEPOT: a train on each siding */
        [[5, 4], [5, 8]].forEach(q => { const s = ctx.sq('P04-03', q[0], q[1]); ctx.props.push({ key: 'track_bed', x: ctx.gcx(s[0]), z: ctx.gcz(s[1]), face: 90 }, { key: 'metro_car', x: ctx.gcx(s[0]), z: ctx.gcz(s[1]), face: 90 }); });
        { const s = ctx.sq('P04-03', 5, 4); [-4.2, 4.2].forEach(dx => ctx.props.push({ key: 'bare_bulb', x: ctx.r2(ctx.gcx(s[0]) + dx), z: ctx.gcz(s[1]), ceil: true, y: 2.95 })); }   // THE LIT TRAIN: its saloon lamps (two of the room's ten real lights)
        /* a blocker on the k-th free square of a list, decor on the k-th square (THE MODEL LIST PASS helpers) */
        const putP = (key, id, list, k, o) => { for (let i = Math.max(0, Math.min(list.length - 1, k)); i < list.length; i++) { const q = list[i]; if (ctx.free(id, q[0], q[1])) { ctx.P(key, id, q[0], q[1], o); return true; } } return false; };
        const putD = (key, id, list, k) => { const q = nth(list, k); if (q) ctx.dec(key, id, q[0], q[1]); };
        /* THE MODEL LIST PASS (mondo 11-16): MODEL_LIST.md searched for metro, rail, signal, depot. THE CROSSING: the signal lever frame and
           two signals (the Signal Gantry's own). THE DEPOT: a cable drum, a pallet jack, a welding cart, a wrapped pallet. THE GHOST
           STATION: two of the Metro pack's columns. THE LOOP LINE: the bucket and the rope under the garden well. Railway lanterns on the walks. */
        putP('signal_lever_frame', 'P02-03', ctx.corners('P02-03'), 1); putP('street_signal', 'P02-03', ctx.corners('P02-03'), 3); putP('street_signal', 'P02-03', ctx.corners('P02-03'), 6);
        { const d = ctx.inner('P04-03'); putP('cable_drum', 'P04-03', d, 4); putP('pallet_jack', 'P04-03', d, 9); putP('welding_cart', 'P04-03', d, 14); putP('wrapped_pallet', 'P04-03', d, 19); }
        [2, 4, 7, 9].forEach(lx => { if (ctx.free('P00-03', lx, 4)) ctx.P('metro_column', 'P00-03', lx, 4); });   // PASS 1: four, a square back from the edge
        { const w = ctx.squares('P01-03', 'o').filter(q => Math.abs(q[0] - 5) <= 1 && Math.abs(q[1] - 9) <= 1); putD('wooden_bucket', 'P01-03', w, 0); putD('meshy_rope', 'P01-03', w, 1); }
        ctx.plots.forEach((p, i) => { const dry = ctx.squares(p.id, 'o'); for (let k = 7 + i; k < dry.length; k += 13) ctx.dec('railway_lantern', p.id, dry[k][0], dry[k][1]); });
        ctx.plots.forEach((p, i) => { const cs = ctx.corners(p.id);   // (PASS 1: the five cave torches are gone: the line is lit by its own lamps, and the room's ten real lights are shared)
            for (let k = 1; k < cs.length; k += 4) { const q2 = cs[k]; if (ctx.free(p.id, q2[0], q2[1])) ctx.dec(['garbage_bag', 'psx_wooden_crate_1', 'psx_cobweb_1', 'metal_trash_can'][k % 4], p.id, q2[0], q2[1]); }   // the grime pass
            const dry = ctx.squares(p.id, 'o'); for (let k = 4; k < dry.length; k += 11) ctx.dec(k % 2 ? 'paper_sheet' : 'floor_stain', p.id, dry[k][0], dry[k][1]);
            const b = nth(cs, cs.length - 1); if (b && ctx.free(p.id, b[0], b[1]) && i % 2) ctx.P('traffic_barrel', p.id, b[0], b[1]); });
    },
    people(ctx) {
        const O = ctx.O.tunnels, stand = (race, id, list, k) => { const q = nth(list, k || 0); if (q) ctx.native(race, id, q[0], q[1], 180, ctx.sayOf(O, race)); };
        stand('skeleton', 'P00-03', ctx.squares('P00-03', 'f').filter(q => q[1] === 3), 3);
        stand('zombie', 'P01-03', ctx.squares('P01-03', 'o'), 6); stand('ai', 'P02-03', ctx.squares('P02-03', 'o'), 5); stand('gangster', 'P04-03', ctx.inner('P04-03'), 2);
    },
};
