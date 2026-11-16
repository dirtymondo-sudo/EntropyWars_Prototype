/* THE SEWERS, district T · THE RUNNING TUNNELS (5 plots: the Ghost Station, the Loop Line twice, the Crossing, the Depot).
   One thread a file (docs/notes/claims.md). Read by `node bake-sewers.js`; rules: docs/notes/areas-complexes.md "THE SEWERS ON PLOTS".
   BRIEF: the subway under the sewers (mondo 11-16: "the subway station can be connected to / a part of the sewers"). Level 1, two levels
   under the culverts; reached by the Maintenance Hatch stair (the Depot) and the rope down the well at the Junction (the Crossing).
   The tool lays the two steel rails along every run of `j` squares. ctx: see W.js.
   PASS 1 (the district thread, 11-16, EXTERIORS; notes: areas-complexes.md "THE SEWERS, DISTRICT T"): the track bed under every rail (ballast,
   sleepers, a third rail), cables + bulkhead lamps along the south / east walls, the Ghost Station's shell (the platform out to the track,
   tiled walls, name panels, the shuttered WAY OUT, tube lamps), the Signal Gantry over the Crossing + its cabin, the Depot's crane, lamps,
   buffer stops, road numbers and crew room. Everything is `arch` parts (drawn) + ghost walls (walked); lit = `glow`, not a light.
   PASS 2 (INTERIORS): the signal cabin (lever frame, panel, the lit track diagram, desk), the crew room (lockers, table, cot, kettle corner),
   the station office on the platform (ticket window, lost property, safe), one passenger in the lit car. Each hut has one real bulb.
   PASS 3 (DRESSING, about 170 props placed by hand): the station's ticket machines, turnstiles, phone, posters, a camp at the platform's end, a body on
   the track, bats; a dead train front + luggage on the east loop; cabinets, drums, cones, bones round the tunnels; the Depot's workshop
   (lathe, drill, bench, hoist, welder, cylinders, compressor), stores along its south wall, the forklift and pallets.
   PASS 4 (ATMOSPHERE): light on the floor and walls under every lit lamp, the lit car's spill and headlights, green under the gantry (all `glow`);
   four flickering tubes, the camp's barrel fire, steam in five places, a lit EXIT over each hut's door.
   THE MODEL PASS (mondo 11-16, the wish-list models): `rail_section` a track square (the drawn sleepers out), `buffer_stop` x 5, `tunnel_signal` x 4,
   `signal_gantry` (the drawn gantry out), `cage_lamp` on every tunnel lamp (the drawn boxes out), `hand_car`, `rat` x 12, `spider` x 4, `strobe_lamp` x 5,
   `third_rail_shoe` x 3, a sleeping bag, a backpack, kettles, a key ring, a ceiling fan.
   STANDS TODAY (first build): the Ghost Station's platform 1 m up with its bench, board and maps; two parked trains in the Depot; torches;
   the old room's four bystanders. THE MODEL LIST PASS: the signal frame + signals at the Crossing, depot gear, Metro columns, the well's bucket and rope, railway lanterns. PASS 5 (POLISH): an eye-level walk of twelve stops; the green under the gantry toned down, the gangster by the lit car, the south tunnel dressed;
   T's real lights cut from four to two (the room has ten: the zone kit). FIVE PASSES + THE MODEL PASS DONE: STOPPED, waits mondo's look.
   Open list: areas-complexes.md "THE SEWERS, DISTRICT T". */
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
function hut(ctx, id, name, x0, x1, zf, zb, xd, xw0, xw1, lit, board, o) {
    o = o || {}; const H = o.H || 3.2, T = 0.3, parts = [], seg = (a, b, y, h, key, tint) => parts.push({ s: 'box', p: [(a + b) / 2, y, zf], size: [b - a, h, T], key: key || o.key || PBRICK, tint: tint == null ? 0x8c8c80 : tint });
    /* the solid runs between the door and the window, whichever comes first along the wall */
    { const cuts = [[xd - 0.78, xd + 0.78], [xw0, xw1]].sort((a, b) => a[0] - b[0]); let at = x0; cuts.forEach(c => { if (c[0] > at + 0.01) seg(at, c[0], 0, H); at = c[1]; }); if (x1 > at + 0.01) seg(at, x1, 0, H); }
    seg(xd - 0.78, xd + 0.78, 2.3, H - 2.3); seg(xw0, xw1, 0, 1.0); seg(xw0, xw1, 2.5, H - 2.5);
    parts.push({ s: 'box', p: [(xw0 + xw1) / 2, 1.0, zf], size: [xw1 - xw0, 1.5, 0.08], key: GLASS, uv: [1.75, 1.5], tint: lit, glow: 0.7, kind: 'glass' });
    for (let x = xw0; x <= xw1 + 0.01; x += (xw1 - xw0) / 3) parts.push({ s: 'box', p: [x, 1.0, zf], size: [0.08, 1.5, 0.14], tint: DARK });
    parts.push({ s: 'box', p: [(xw0 + xw1) / 2, 0.96, zf + 0.05], size: [xw1 - xw0 + 0.3, 0.08, 0.3], key: CONC });
    parts.push({ s: 'box', p: [(x0 + x1) / 2, H, (zf + zb) / 2 + 0.2], size: [x1 - x0, 0.25, Math.abs(zb - zf) + 0.7], key: CONC, tint: 0x8a8a84, under: true });
    parts.push({ s: 'box', p: [(x0 + x1) / 2, 0.02, (zf + zb) / 2], size: [x1 - x0, 0.03, Math.abs(zb - zf)], key: 'urban:TileLinoleum1a', tint: 0x9a9a8a, sides: false, glow: o.glowIn || 0 });   // the hut's floor
    [[x0 + 0.06, 'l'], [x1 - 0.06, 'r']].forEach(q => parts.push({ s: 'box', p: [q[0], 0, (zf + zb) / 2], size: [0.1, H, Math.abs(zb - zf)], key: 'urban:PlasterWallPainted1a', tint: 0x7c8474, glow: o.glowIn || 0 }));
    parts.push({ s: 'box', p: [(x0 + x1) / 2, 0, zb + (zb < zf ? 0.06 : -0.06)], size: [x1 - x0, H, 0.1], key: 'urban:PlasterWallPainted1a', tint: 0x7c8474, glow: o.glowIn || 0 });
    if (o.glowIn) parts.push({ s: 'box', p: [(x0 + x1) / 2, H - 0.07, (zf + zb) / 2], size: [1.3, 0.06, 0.32], tint: 0xffe9c0, glow: 1 });   // a lit panel under the slab (no real light)
    if (board) parts.push({ s: 'quad', p: [(xw0 + xw1) / 2, 2.62, zf + (zb < zf ? 0.17 : -0.17)], ry: zb < zf ? 0 : 180, size: [Math.min(4.2, xw1 - xw0), 0.5], key: sign(board, '#24282c', 8), glow: 0.3, uv: 'fit' });
    if (o.east) { parts.push({ s: 'box', p: [x1, 0, (zf + zb) / 2], size: [T, H, Math.abs(zb - zf)], key: o.key || PBRICK, tint: 0x8c8c80 }); ghost(ctx, id, x1, zf, x1, zb); }   // a free-standing hut's own east wall
    if (o.y0) parts.forEach(q => { q.p = [q.p[0], q.p[1] + o.y0, q.p[2]]; });
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
                        { s: 'box', p: P3(a, 0.08, c + 1.2), size: Z3(L, 0.16, 0.09), tint: 0x25262a }, { s: 'box', p: P3(a, 0.27, c + 1.26), size: Z3(L, 0.035, 0.26), tint: WOODT }); }
                if (p) for (let q = 0; q < m; q++) ctx.props.push({ key: 'rail_section', x: ctx.gcx(sx + (horiz ? q : 0)), z: ctx.gcz(sy + (horiz ? 0 : q)), face: horiz ? 0 : 90, y: 0.04, noBlock: true });   /* THE MODEL PASS: a rail section a square (the drawn sleepers are out) */
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
                    for (let q = 1; q < run; q += 3, k++) { const uu = X(b0 + q) + 1.75; { const m0 = mid(ctx, p.id), q3 = P3(uu, 2.36, 0.04); ctx.props.push({ key: 'cage_lamp', x: R2(m0[0] + q3[0]), z: R2(m0[1] + q3[2]), y: 2.36, face: horiz ? 0 : 270, noBlock: true }); }   /* THE MODEL PASS: the caged lamp (was a drawn box) */
                        parts.push(k % 3 ? { s: 'box', p: P3(uu, 2.46, 0.15), size: Z3(0.26, 0.13, 0.06), tint: AMBER, glow: 1 } : { s: 'box', p: P3(uu, 2.46, 0.15), size: Z3(0.26, 0.13, 0.06), tint: 0x3a352c });
                        if (k % 3) parts.push({ s: 'box', p: P3(uu, 0.85, 0.0), size: Z3(2.1, 1.55, 0.03), key: 'bricks_2', tint: 0xd8bc98, glow: 0.1 }, { s: 'box', p: P3(uu, 0.012, 1.0), size: Z3(2.4, 0.012, 1.7), key: 'urban:ConcreteStriped2c', tint: 0xd8c4a4, glow: 0.1, sides: false }); } }   /* pass 4: what a lit lamp lights */
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
          /* (pass 4: the lamps hang over the platform's front half; under each lit one the floor is lit; the second is a flickering tube, in dress) */
          [-10.5, -3.5, 3.5, 10.5].forEach((x, i) => { P.push({ s: 'box', p: [x, 4.62, -3.5], size: [1.9, 0.12, 0.4], tint: DARK }, { s: 'box', p: [x - 0.7, 4.72, -3.5], size: [0.04, 0.5, 0.04], tint: IRON }, { s: 'box', p: [x + 0.7, 4.72, -3.5], size: [0.04, 0.5, 0.04], tint: IRON });
              if (lit[i]) P.push({ s: 'box', p: [x, 4.55, -3.5], size: [1.6, 0.07, 0.22], tint: LAMP, glow: 1 }, { s: 'box', p: [x, 1.012, -3.6], size: [6.4, 0.012, 4.8], key: 'urban:MetroFloor', tint: 0xcfd6c2, glow: 0.2, sides: false }, { s: 'box', p: [x, 1.026, -3.6], size: [3.4, 0.012, 2.6], key: 'urban:MetroFloor', tint: 0xdfe6d2, glow: 0.36, sides: false });
              else if (i === 3) P.push({ s: 'box', p: [x, 4.55, -3.5], size: [1.6, 0.07, 0.22], tint: 0x3a3d38 }); });
          arch(ctx, 'P00-03', 'station', P); }

        /* ── THE CROSSING (P02-03): THE SIGNAL GANTRY, 5.2 m, over the square where the two lines cross (lx 6, ly 6); a head to each way,
           all four green. The check plate under it; a ladder up the south-west leg. The cabin in the north-east recess. ── */
        { const P = [], a = X(6) - 0.2, b = X(7) + 0.2, c = (a + b) / 2;
          /* THE MODEL PASS: the gantry is the `signal_gantry` model now (6 m, across the main line a step west of the crossing square, its legs on the two walks);
             the drawn legs, beams, deck, heads and ladder are out. The check plate and a little green on the ballast stay. */
          P.push({ s: 'box', p: [c, 0.06, c], size: [3.3, 0.05, 3.3], key: PLATE, tint: 0x6a6a64, sides: false }, { s: 'box', p: [a - 2.6, 0.11, c], size: [3.0, 0.012, 2.3], key: PEB, tint: 0x4a9a66, glow: 0.07, sides: false });
          { const m0 = mid(ctx, 'P02-03'); ctx.props.push({ key: 'signal_gantry', x: R2(m0[0] + a - 0.9), z: R2(m0[1] + c), face: 90, noBlock: true }); }
          /* the dead-end line south of the crossing: a buffer stop at its end */
          { const m0 = mid(ctx, 'P02-03'); ctx.props.push({ key: 'buffer_stop', x: R2(m0[0] + XC(6)), z: R2(m0[1] + X(10) + 2.6), face: 0, noBlock: true }); }   /* THE MODEL PASS */
          arch(ctx, 'P02-03', 'gantry', P); ghost(ctx, 'P02-03', X(6) + 0.4, X(10) + 2.6, X(7) - 0.4, X(10) + 2.6, 1.1); }
        const leaves = [];
        leaves.push(hut(ctx, 'P02-03', 'cabin', X(8), X(11), X(5), X(3), XC(8), X(9) + 0.6, X(11) - 0.7, 0x9fe0b0, 'THE CROSSING'));

        /* ── THE DEPOT (P04-03): the hall is x -17.5..17.5, z -10.5..14, 12 m to the vault. An overhead crane on its two rails, six high-bay
           lamps (three alight), a buffer stop at each end of the two roads, the road numbers and the name on the east wall, a painted
           dado. The crew room in the north-west recess. ── */
        { const P = [];
          [-10.25, 13.75].forEach(z => P.push({ s: 'box', p: [0, 6.5, z], size: [35, 0.45, 0.35], key: BEAM, tint: 0x8a8880 }, { s: 'box', p: [-15.75, 5.9, z], size: [0.5, 0.6, 0.5], key: CONC, n: 6, step: [6.3, 0, 0] }));
          P.push({ s: 'box', p: [5.25, 6.95, 1.75], size: [0.9, 0.8, 24.3], key: 'urban:MetalPanelPainted1a', tint: 0xb8901c }, { s: 'box', p: [5.25, 6.95, -10.25], size: [2.2, 0.5, 0.5], tint: IRON }, { s: 'box', p: [5.25, 6.95, 13.75], size: [2.2, 0.5, 0.5], tint: IRON },
              { s: 'box', p: [5.25, 6.45, -1.75], size: [1.2, 0.5, 1.2], tint: DARK }, { s: 'box', p: [5.25, 3.25, -1.75], size: [0.05, 3.2, 0.05], tint: IRON }, { s: 'box', p: [5.25, 2.8, -1.75], size: [0.36, 0.46, 0.26], key: HAZ });
          [[-12.25, -1.75], [-1.75, -1.75], [12.25, -1.75], [-12.25, 5.25], [-1.75, 5.25], [12.25, 5.25]].forEach((q, i) => { P.push({ s: 'box', p: [q[0], 6.2, q[1]], size: [0.04, 3.2, 0.04], tint: IRON }, { s: 'cyl', p: [q[0], 5.85, q[1]], r: 0.48, r2: 0.16, h: 0.36, tint: DARK, seg: 10 });
              P.push(i % 2 === 0 ? { s: 'cyl', p: [q[0], 5.8, q[1]], r: 0.4, h: 0.05, tint: 0xffe2a8, glow: 1, seg: 10 } : { s: 'cyl', p: [q[0], 5.8, q[1]], r: 0.4, h: 0.05, tint: 0x3a352c, seg: 10 }); });
          { const m0 = mid(ctx, 'P04-03'); [XC(4), XC(8)].forEach(z => ctx.props.push({ key: 'buffer_stop', x: R2(m0[0] + X(10) - 0.6), z: R2(m0[1] + z), face: 90, noBlock: true }, { key: 'buffer_stop', x: R2(m0[0] + X(2) + 0.6), z: R2(m0[1] + z), face: 270, noBlock: true })); }   /* THE MODEL PASS: the buffer stop model at each road's two ends */
          /* the walls: a painted-brick dado under a warning line; the south and the east wall whole, the north wall east of the stair */
          const dado = (x, z, w, d) => P.push({ s: 'box', p: [x, 0, z], size: [w, 1.5, d], key: PBRICK, tint: 0x7c8474 }, { s: 'box', p: [x, 1.5, z], size: [w + (w > d ? 0 : 0.04), 0.14, d + (w > d ? 0.04 : 0)], key: HAZ });
          dado(0, 13.92, 35, 0.14); dado(17.42, 1.75, 0.14, 24.5); dado(12.25, -10.42, 10.5, 0.14); dado(-17.42, 10.5, 0.14, 7); dado(-17.42, -7, 0.14, 7);
          P.push({ s: 'quad', p: [17.3, 4.0, 1.75], ry: 90, size: [7.5, 1.5], key: sign('THE DEPOT', '#24282c', 5), glow: 0.22, uv: 'fit' },
              { s: 'quad', p: [17.3, 2.1, XC(4)], ry: 90, size: [1.2, 1.2], key: sign('1', '#24282c', 1), glow: 0.3, uv: 'fit' }, { s: 'quad', p: [17.3, 2.1, XC(8)], ry: 90, size: [1.2, 1.2], key: sign('2', '#24282c', 1), glow: 0.3, uv: 'fit' });
          /* THE LIT TRAIN (road 1; "Two cars. One lit." "The lit one has never moved." "Somebody left the headlight on."): its saloon lights and its two headlights */
          P.push({ s: 'box', p: [XC(5), 2.78, XC(4)], size: [14.6, 0.05, 0.45], tint: 0xfff0c8, glow: 1 }, { s: 'box', p: [XC(5) - 8.2, 1.45, XC(4) - 0.85], size: [0.06, 0.2, 0.22], tint: 0xfff6dc, glow: 1 }, { s: 'box', p: [XC(5) - 8.2, 1.45, XC(4) + 0.85], size: [0.06, 0.2, 0.22], tint: 0xfff6dc, glow: 1 });
          P.push({ s: 'box', p: [0, 0, 1.75], size: [35, 0.02, 24.5], key: 'urban:ConcreteSlab2a', tint: 0x8a8a84, sides: false });   // the hall's concrete over the room's paint
          /* pass 4: the light on the floor: under the three lit lamps, along the lit car's windows, ahead of its headlights */
          [[-12.25, -1.75], [12.25, -1.75], [-1.75, 5.25]].forEach(q => P.push({ s: 'cyl', p: [q[0], 0.022, q[1]], r: 3.3, h: 0.012, key: 'urban:ConcreteSlab2a', tint: 0xd8ccb0, glow: 0.1, seg: 22 }, { s: 'cyl', p: [q[0], 0.036, q[1]], r: 1.9, h: 0.012, key: 'urban:ConcreteSlab2a', tint: 0xe6dcc0, glow: 0.2, seg: 22 }));
          [-2.45, 2.45].forEach(dz => P.push({ s: 'box', p: [XC(5), 0.024, XC(4) + dz], size: [15, 0.012, 1.5], key: 'urban:ConcreteSlab2a', tint: 0xe6dcc0, glow: 0.2, sides: false }));
          P.push({ s: 'box', p: [XC(5) - 10.2, 0.115, XC(4)], size: [3.6, 0.012, 2.6], key: PEB, tint: 0xfff2cc, glow: 0.5, sides: false }, { s: 'box', p: [XC(5) - 13.8, 0.115, XC(4)], size: [3.6, 0.012, 2.9], key: PEB, tint: 0xfff2cc, glow: 0.22, sides: false });
          arch(ctx, 'P04-03', 'hall', P);
          [XC(4), XC(8)].forEach(z => { ghost(ctx, 'P04-03', X(10) - 0.5, z - 1, X(10) - 0.5, z + 1, 1.1); ghost(ctx, 'P04-03', X(2) + 0.5, z - 1, X(2) + 0.5, z + 1, 1.1); }); }
        leaves.push(hut(ctx, 'P04-03', 'crew', X(1), X(4), X(3), X(1), XC(3), X(1) + 0.7, X(3) - 0.5, 0xffd9a0, 'CREW ROOM', { glowIn: 0.3 }));
        /* PASS 2: THE STATION OFFICE, a tiled hut on the platform's north-west corner, tucked under the vault's haunch */
        leaves.push(hut(ctx, 'P00-03', 'office', X(2), X(4), X(4), X(2), X(4) - 1.2, X(2) + 0.7, X(4) - 2.6, 0xffd9a0, 'TICKETS', { y0: 1, east: true, key: TILE, H: 2.9, glowIn: 0.3 }));
        /* PASS 2: what hangs on the huts' walls (drawn): the cabin's lit track diagram (the two lines and the loop, a green lamp a signal) */
        { const P = [], bx = X(9) + 3.5, bz = X(3) + 0.14, ln = (x, y, w, h) => P.push({ s: 'box', p: [bx + x, 1.2 + y, bz + 0.05], size: [w, h, 0.03], tint: 0xd8d2b8, glow: 0.6 }), dot = (x, y, c) => P.push({ s: 'box', p: [bx + x, 1.2 + y, bz + 0.07], size: [0.09, 0.09, 0.03], tint: c, glow: 1 });
          P.push({ s: 'box', p: [bx, 1.2, bz], size: [3.6, 1.5, 0.08], tint: 0x14181a }, { s: 'box', p: [bx, 2.7, bz], size: [3.7, 0.06, 0.12], tint: IRON }, { s: 'box', p: [bx, 1.14, bz], size: [3.7, 0.06, 0.12], tint: IRON });
          ln(0, 0.72, 3.2, 0.035); ln(0.2, 0.2, 0.035, 1.2); ln(-0.9, 0.36, 1.0, 0.035); ln(-1.4, 0.36, 0.035, 0.4); ln(-0.4, 0.36, 0.035, 0.4); ln(1.1, 1.05, 0.8, 0.035); ln(0.7, 0.72, 0.035, 0.36); ln(1.5, 0.72, 0.035, 0.36);
          [[-1.5, 0.8], [-0.2, 0.8], [0.6, 0.8], [1.5, 0.8], [0.28, 1.3], [0.28, 0.3]].forEach(q => dot(q[0], q[1], 0x2aff6a)); dot(1.1, 1.13, 0xffb020); dot(-0.9, 0.44, 0xffb020);
          P.push({ s: 'quad', p: [bx, 2.82, bz + 0.06], size: [2.2, 0.26], key: sign('ALL LINES', '#14181a', 8.5), glow: 0.3, uv: 'fit' });
          arch(ctx, 'P02-03', 'diagram', P); }
        /* the three huts' swinging doors (three-renderer.js _hqBuildTexDoors: a `doorsOnly` carrier row) */
        ctx.feat({ k: 'texbuilding', id: 'sewT:doors', x: 0, z: 0, y: 0, w: 2, d: 2, rot: 0, storeys: 1, skin: false, doorsOnly: true, leaf: 'leaf_security', inner: leaves });

        /* a signal post where the line leaves each Loop Line plot */
        /* THE MODEL PASS: the `tunnel_signal` model (the drawn posts are out) */
        [['P00-03', X(11) + 1.2, X(8) - 0.5, 270], ['P01-03', X(1) + 0.3, X(6) - 0.25, 90], ['P03-03', X(11) - 0.3, X(6) - 0.25, 270], ['P04-03', X(1) - 1.4, X(6) - 0.3, 270]].forEach(q => { const m0 = mid(ctx, q[0]); ctx.props.push({ key: 'tunnel_signal', x: R2(m0[0] + q[1]), z: R2(m0[1] + q[2]), face: q[3], noBlock: true }); });
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
        ['metro_bench', 'departures_board', 'tube_map', 'metro_vending', 'metro_bin'].forEach((k, i) => { const q = st[2 + i];   /* (pass 2: a square east, the office took the corner) */ if (q && ctx.free('P00-03', q[0], q[1])) ctx.P(k, 'P00-03', q[0], q[1], { face: 180 }); });
        /* THE DEPOT: a train on each siding */
        [[5, 4], [5, 8]].forEach(q => { const s = ctx.sq('P04-03', q[0], q[1]); ctx.props.push({ key: 'track_bed', x: ctx.gcx(s[0]), z: ctx.gcz(s[1]), face: 90 }, { key: 'metro_car', x: ctx.gcx(s[0]), z: ctx.gcz(s[1]), face: 90 }); });
        { const s = ctx.sq('P04-03', 5, 4); ctx.props.push({ key: 'bare_bulb', x: ctx.gcx(s[0]), z: ctx.gcz(s[1]), ceil: true, y: 2.95 }, { key: 'anatomy_skeleton', x: ctx.r2(ctx.gcx(s[0]) + 3.4), z: ctx.r2(ctx.gcz(s[1]) + 0.2), y: 1.12, face: 200, noBlock: true }); }   // THE LIT TRAIN: its saloon lamp (a real light) and the one passenger who stayed
        /* ── PASS 2, THE INTERIORS: the signal cabin, the crew room, the station office. `put` = a prop at a plot's own metres, on the floor. ── */
        const put = (id, key, x, z, face, o) => { const m = mid(ctx, id); ctx.props.push(Object.assign({ key, x: R2(m[0] + x), z: R2(m[1] + z), face: face || 0, floor: true }, o || {})); };
        const air = (id, key, x, z, o) => { const m = mid(ctx, id); ctx.props.push(Object.assign({ key, x: R2(m[0] + x), z: R2(m[1] + z), noBlock: true }, o || {})); };
        /* THE ROOM'S TEN LIGHTS (the zone kit): T takes TWO, the lit car's and the cabin's; the other huts' bulbs only glow (`dark`) and their walls are lit the drawn way */
        const bulb = (id, x, z, y, dark) => { const m = mid(ctx, id); ctx.props.push(Object.assign({ key: 'bare_bulb', x: R2(m[0] + x), z: R2(m[1] + z), ceil: true, y }, dark ? { noLight: true } : null)); };
        { const id = 'P02-03';   /* THE CABIN: x 7..17.5, z -10.5..-3.5; the frame and the panel under the window, the desk at the back */
          put(id, 'signal_lever_frame', 13.4, -4.75, 180); put(id, 'retro_control_panel', 10.7, -4.5, 180); put(id, 'tanker_desk', 15.6, -9.0, 180); put(id, 'office_chair', 15.6, -9.8, 180);
          put(id, 'crt_terminal', 15.2, -9.0, 180, { y: 0.78 }); put(id, 'field_radio', 16.2, -8.9, 200, { y: 0.78 }); put(id, 'coffee_mug', 15.9, -8.7, 40, { y: 0.78 });
          put(id, 'filing_cabinet', 7.45, -9.9, 90); put(id, 'filing_cabinet', 7.45, -9.3, 90); put(id, 'footlocker', 16.9, -4.5, 270); put(id, 'folding_chair', 12.6, -6.2, 180);
          put(id, 'breaker_panel', 17.3, -7, 270, { y: 1.2 }); put(id, 'gauge_board', 8.7, -10.3, 180, { y: 1.1 }); put(id, 'wall_clock', 15.6, -10.32, 180, { y: 2.3 }); put(id, 'fire_extinguisher', 7.3, -4.2, 90);
          put(id, 'psx_flashlight_1', 10.9, -6.1, 70); put(id, 'railway_lantern', 9.4, -4.3, 0, { y: 1.02 }); bulb(id, 12.25, -7, 3.05); }
        { const id = 'P04-03';   /* THE CREW ROOM: x -17.5..-7, z -17.5..-10.5; lockers at the back, a table, a cot, the kettle corner */
          [-16.9, -16.3, -15.7, -15.1].forEach(x => put(id, 'locker', x, -17.1, 180)); put(id, 'footlocker', -14.2, -17.0, 180);
          put(id, 'steel_table', -12.25, -14.2, 0); put(id, 'folding_chair', -12.25, -15.2, 0); put(id, 'folding_chair', -11.1, -14.2, 270); put(id, 'molded_chair', -13.4, -14.1, 90);
          put(id, 'coffee_mug', -12.5, -14.3, 30, { y: 0.8 }); put(id, 'coffee_mug', -11.9, -14.0, 200, { y: 0.8 }); put(id, 'psx_ashtray_1', -12.2, -14.5, 0, { y: 0.8 }); put(id, 'psx_cigs_packet_1', -12.7, -13.9, 60, { y: 0.8 });
          put(id, 'cot', -16.6, -12.6, 0); put(id, 'psx_sofa_1', -13.6, -11.2, 0); put(id, 'mini_fridge', -10.2, -17.05, 180); put(id, 'microwave', -10.2, -17.05, 180, { y: 0.87 }); put(id, 'water_cooler', -8.9, -17.1, 180);
          put(id, 'coffee_maker', -11.0, -17.1, 180, { y: 0.02 }); put(id, 'notice_board', -7.2, -14.5, 270, { y: 1.1 }); put(id, 'punch_clock', -7.2, -12.2, 270, { y: 1.2 }); put(id, 'wall_clock', -12.25, -17.32, 180, { y: 2.3 });
          put(id, 'hook_rail', -17.3, -15.2, 90, { y: 1.7 }); put(id, 'mop_bucket', -7.7, -16.6, 30); put(id, 'metro_poster_7', -17.32, -13.6, 90, { y: 1.0 }); bulb(id, -12.25, -14.2, 3.05, true); }
        { const id = 'P00-03';   /* THE STATION OFFICE: x -14..-7, z -14..-7, on the platform; the desk at the ticket window, lost property at the back */
          put(id, 'tanker_desk', -11.6, -8.0, 180); put(id, 'office_chair', -11.6, -8.9, 180); put(id, 'crt_terminal', -12.0, -8.0, 180, { y: 1.78 }); put(id, 'coffee_mug', -11.0, -7.8, 10, { y: 1.78 });
          put(id, 'lost_shelf', -12.2, -12.4, 180); put(id, 'floor_safe', -13.3, -10.2, 90); put(id, 'filing_cabinet', -7.6, -11.6, 270); put(id, 'filing_cabinet', -7.6, -12.2, 270);
          put(id, 'key_rack', -7.25, -9.6, 270, { y: 1.1 }); put(id, 'wall_clock', -13.72, -9, 90, { y: 2.2 }); put(id, 'newspaper_bundles', -9.3, -12.6, 30); bulb(id, -10.5, -10.2, 3.5, true); }
        /* a blocker on the k-th free square of a list, decor on the k-th square (THE MODEL LIST PASS helpers) */
        const putP = (key, id, list, k, o) => { for (let i = Math.max(0, Math.min(list.length - 1, k)); i < list.length; i++) { const q = list[i]; if (ctx.free(id, q[0], q[1])) { ctx.P(key, id, q[0], q[1], o); return true; } } return false; };
        const putD = (key, id, list, k) => { const q = nth(list, k); if (q) ctx.dec(key, id, q[0], q[1]); };
        /* THE MODEL LIST PASS (mondo 11-16): MODEL_LIST.md searched for metro, rail, signal, depot. THE CROSSING: the signal lever frame and
           two signals (the Signal Gantry's own). THE DEPOT: a cable drum, a pallet jack, a welding cart, a wrapped pallet. THE GHOST
           STATION: two of the Metro pack's columns. THE LOOP LINE: the bucket and the rope under the garden well. Railway lanterns on the walks. */
        /* (pass 3: the two street signals left the Crossing, the gantry is its signal; the Depot's gear is placed by hand below) */
        /* ── PASS 3, THE DRESSING (the model list's shortlist: areas-complexes.md "THE SEWERS, DISTRICT T"). `put` = a plot's own metres. ── */
        const lay = (id, key, x, z, face, o) => put(id, key, x, z, face, Object.assign({ noBlock: true }, o || {}));   // small things nobody walks into
        { const id = 'P00-03', Y = { y: 0 };   /* THE GHOST STATION: the platform is x -14..14, z -14..0 (1 m up: `floor` finds it) */
          put(id, 'metro_ticket_machine', -5.25, -13.2, 180); put(id, 'metro_ticket_machine', -3.9, -13.2, 180); put(id, 'metro_gate', XC(8), XC(2), 90); put(id, 'metro_gate', XC(8), XC(3), 90);   /* (the pack's cut turnstile drew as a blank block: the Metro gate) */
          put(id, 'public_phone', 13.2, -13.3, 270); put(id, 'newspaper_rack', 9.6, -13.3, 180); put(id, 'missing_board', -13.2, -2.6, 90);
          [[-1.6, 'metro_poster_1'], [2.4, 'metro_poster_3'], [6.2, 'metro_poster_6'], [11.6, 'metro_poster_8']].forEach(q => put(id, q[1], q[0], -13.72, 180, { y: 0.02 }));
          put(id, 'metro_map', -6.8, -8.6, 90, { y: 0.9 }); put(id, 'security_camera', XC(4) + 0.5, XC(4), 120, { y: 3.6 }); put(id, 'fire_extinguisher', 13.5, -7.4, 270);
          /* somebody lives at the east end, by the edge */
          lay(id, 'psx_old_mattress_mp_1', 11.6, -2.3, 80); lay(id, 'psx_carpet_mp_1', 9.9, -2.6, 10); lay(id, 'psx_pillow_mp_1', 12.3, -2.2, 30, { y: 0.2 }); lay(id, 'retro_radio', 10.6, -1.4, 200); lay(id, 'psx_cardboard_box_1', 12.9, -3.3, 20);
          lay(id, 'psx_canned_food_mp_1', 10.1, -2.0, 0); lay(id, 'psx_canned_food_mp_3', 10.4, -3.1, 70); lay(id, 'psx_glass_bottle_1', 9.3, -1.6, 0); lay(id, 'psx_glass_bottle_2', 11.0, -3.4, 0); lay(id, 'psx_cigs_packet_1', 10.9, -2.2, 0);
          lay(id, 'newspaper_bundles', -2.2, -1.9, 40); lay(id, 'garbage_bags', 6.4, -12.9, 10); lay(id, 'psx_tin_can_mp_1_rusty', 1.3, -4.1, 0); lay(id, 'psx_glass_bottle_1', -4.8, -2.2, 0); lay(id, 'wet_floor_sign', 4.2, -6.4, 20);
          /* on the track: what fell or was thrown */
          lay(id, 'hw_body_2', -8.4, 1.9, 100); lay(id, 'hand_truck', 4.6, 2.3, 300); lay(id, 'traffic_cone', 9.2, 1.2, 0); lay(id, 'psx_brick_1', -2.1, 2.4, 30); lay(id, 'psx_brick_1', -1.5, 1.3, 80); lay(id, 'skull', 16.2, 5.6, 200);
          ['bat_black', 'bat_brown', 'bat_grey'].forEach((k, i) => put(id, k, -6 + i * 7, 2.5 + i, 60 * i, { y: 3.6, floor: false, noBlock: true }));
          ctx.grime('blood', id, 3, 6, 1.2); ctx.grime('puddle', id, 8, 7, 1.3); }
        { const id = 'P01-03';   /* THE LOOP LINE (west): the stub north is shut off; cabinets and rubbish round the loop; bones in the south-west bend */
          put(id, 'item_police_barricade', XC(5), XC(4) + 1.2, 0); put(id, 'cable_drum', XC(4), XC(3), 20); lay(id, 'psx_supply_crate_1', XC(6) - 0.4, XC(3) + 0.3, 30); lay(id, 'psx_supply_crate_1_2', XC(6) - 0.2, XC(3) - 0.5, 80); lay(id, 'hand_truck', XC(6) + 0.3, XC(4), 200);
          put(id, 'utility_box', XC(1) + 0.9, XC(8) + 1.1, 0); put(id, 'utility_box', XC(11) - 0.4, XC(9), 0); lay(id, 'traffic_cone', XC(3), XC(7), 0); lay(id, 'traffic_cone', XC(8), XC(9) + 0.6, 0);
          lay(id, 'skull', XC(1) + 0.5, XC(9), 40); lay(id, 'femur', XC(1) + 1.1, XC(9) - 0.4, 10); lay(id, 'hw_web', XC(1) - 1.2, XC(9) + 1.2, 45); lay(id, 'psx_metal_barrel_mp_2', XC(10), XC(9) + 0.9, 0); lay(id, 'psx_jerrycan_1', XC(9) + 0.6, XC(9) + 1.0, 50);
          put(id, 'bat_black', XC(7), XC(8), 0, { y: 3.4, floor: false, noBlock: true }); ctx.grime('puddle', id, 5, 9, 1.5); }
        { const id = 'P02-03';   /* THE CROSSING: the trackside cabinets, a drum, cones; the dead line south is fenced with what fell in at its end */
          put(id, 'utility_box', X(6) - 1.2, X(6) - 1.2, 90); put(id, 'ind_panel', X(7) + 1.2, X(7) + 1.2, 270); put(id, 'cable_drum', XC(2), XC(5), 70); lay(id, 'traffic_cone', XC(4), XC(7), 0); lay(id, 'traffic_cone', XC(8), XC(7) + 0.5, 0);
          lay(id, 'cinder_block', XC(6) - 0.5, XC(10) + 1.0, 20); lay(id, 'cinder_block', XC(6) + 0.6, XC(10) + 1.3, 70); lay(id, 'psx_brick_1', XC(6), XC(10) + 0.2, 10); lay(id, 'psx_brick_1_1', XC(6) + 0.9, XC(10) + 0.6, 110); lay(id, 'hw_web_2', XC(6) - 1.0, XC(10) + 1.4, 30);
          lay(id, 'wooden_bucket', XC(5), XC(1), 0); lay(id, 'meshy_rope', XC(7) - 0.5, XC(1), 40); lay(id, 'psx_flashlight_mp_1', XC(4), XC(5) + 0.9, 150); ctx.grime('oil', id, 6, 5, 1.4); }
        { const id = 'P03-03';   /* THE LOOP LINE (east): a train's front stands dead on the passing loop; its luggage; a camp of one by the wall */
          const s3 = ctx.sq(id, 5, 5); ctx.props.push({ key: 'subway_front', x: ctx.gcx(s3[0]), z: ctx.gcz(s3[1]), face: 90 }); ctx.taken.add(s3[0] + ':' + s3[1]);
          put(id, 'luggage_cart', XC(3), XC(4), 80); lay(id, 'footlocker', XC(4) + 0.6, XC(4) - 0.3, 20); lay(id, 'psx_cardboard_box_2_1', XC(2), XC(4) + 0.4, 60); lay(id, 'newspaper_bundles', XC(8), XC(4), 10);
          put(id, 'utility_box', XC(10), XC(4) - 1.0, 180); lay(id, 'traffic_cone', XC(9), XC(4), 0); lay(id, 'traffic_cone', XC(1), XC(7), 0); lay(id, 'garbage_bag', XC(10) + 0.8, XC(7) + 0.5, 0);
          lay(id, 'hw_part_2', XC(3) + 0.4, XC(9) + 0.3, 0); lay(id, 'skull_pile', XC(3) - 0.6, XC(9) - 0.2, 0); lay(id, 'hw_web_3', XC(5), XC(11) + 0.9, 0); put(id, 'bat_brown', XC(4), XC(9), 0, { y: 3.3, floor: false, noBlock: true });
          ctx.grime('oil', id, 5, 6, 1.5); ctx.grime('puddle', id, 4, 10, 1.2); }
        if (ctx.plot['P03-04']) { const id = 'P03-04', dry = ctx.squares(id, 'o');   /* THE LOOP LINE (south, to the city's Platform): cabinets, cones, a barrel fire's cold barrel */
          [3, 11, 19].forEach((k, i) => { const q = nth(dry, k); if (q) lay(id, ['traffic_cone', 'psx_metal_barrel_mp_1', 'wet_floor_sign'][i], XC(q[0]) + 0.5, XC(q[1]) + 0.4, 30 * i); });
          const q = nth(dry, 7); if (q) put(id, 'utility_box', XC(q[0]) + 1.1, XC(q[1]), 0);
          [5, 14, 23].forEach((k, i) => { const r = nth(dry, k); if (r) lay(id, ['railway_lantern', 'newspaper_bundles', 'psx_glass_bottle_2'][i], XC(r[0]) - 0.6, XC(r[1]) - 0.5, 50 * i); });
          const c = nth(dry, 16); if (c) put(id, 'cable_drum', XC(c[0]) + 0.9, XC(c[1]), 30); const t = nth(dry, 9); if (t) air(id, 'flicker_tube', XC(t[0]), XC(t[1]), { ceil: true, y: 4.3 }); }   /* pass 5 */
        { const id = 'P04-03';   /* THE DEPOT: the hall is x -17.5..17.5, z -10.5..14. The workshop east of the buffer stops; stores along the south wall; the forklift west */
          put(id, 'metal_lathe', XC(9), XC(7), 0); put(id, 'drill_press', XC(10), XC(7), 270); put(id, 'steel_table', XC(9), XC(5) + 0.9, 0); put(id, 'tool_chest', XC(10), XC(5) + 0.9, 270);
          lay(id, 'item_wrench', XC(9) - 0.3, XC(5) + 0.9, 30, { y: 0.82 }); lay(id, 'psx_screwdriver_mp_1', XC(9) + 0.3, XC(5) + 0.8, 80, { y: 0.82 }); lay(id, 'psx_car_battery_1', XC(9) + 0.5, XC(5) + 1.1, 0, { y: 0.82 });
          put(id, 'tool_pegboard', 17.3, XC(6), 270, { y: 1.5 }); put(id, 'engine_hoist', XC(8), XC(7), 200); put(id, 'welding_cart', XC(8), XC(5), 40); put(id, 'gas_cylinder_rack', XC(10), XC(5) - 1.0, 270); put(id, 'air_compressor', XC(10), XC(3), 270);
          put(id, 'fire_extinguisher', 17.2, XC(8) - 1.4, 270); put(id, 'hose_rack', 17.3, XC(3) + 1.3, 270, { y: 1.2 });
          put(id, 'ebd_gasstation_metal_shelving', XC(8), 13.3, 0); put(id, 'ebd_gasstation_metal_shelving', XC(9), 13.3, 0); put(id, 'ladder_wall_rack', XC(5), 13.8, 0, { y: 1.6 }); lay(id, 'psx_supply_crate_1_1', XC(8) - 0.2, 13.3, 0, { y: 0.95 }); lay(id, 'psx_jerrycan_1_1', XC(9) + 0.2, 13.3, 90, { y: 0.95 }); lay(id, 'psx_supply_crate_1_4', XC(9) - 0.3, 13.3, 0, { y: 0.2 }); put(id, 'psx_metal_barrel_mp_1', XC(10), 12.9, 0); put(id, 'psx_metal_barrel_mp_3', XC(10) - 0.9, 13.2, 0);
          lay(id, 'psx_supply_crate_1', XC(2), 12.9, 10); lay(id, 'psx_supply_crate_1_3', XC(2) + 0.8, 13.1, 70); lay(id, 'psx_supply_crate_1', XC(2) + 0.3, 12.95, 30, { y: 0.38 }); put(id, 'cable_drum', XC(3) + 0.6, 12.8, 90);
          put(id, 'forklift', XC(2), XC(7), 90); put(id, 'wrapped_pallet', XC(1), XC(7) - 0.9, 0); put(id, 'wrapped_pallet', XC(1), XC(7) + 0.5, 10); put(id, 'pallet_jack', XC(3) + 1.0, XC(7) + 0.4, 250);
          lay(id, 'traffic_cone', XC(7), XC(5), 0); lay(id, 'traffic_cone', XC(7), XC(7), 0); lay(id, 'traffic_cone', XC(1), XC(5), 0); lay(id, 'psx_jerrycan_1', XC(8) + 0.9, XC(7) + 0.8, 10); lay(id, 'mop_bucket', XC(1), XC(3), 0); lay(id, 'wet_floor_sign', XC(5), XC(3), 30);
          lay(id, 'hand_truck', XC(4), XC(9) + 0.4, 100); lay(id, 'garbage_bags', -16.6, 13.2, 0); put(id, 'bat_grey', XC(3), XC(6), 0, { y: 7.5, floor: false, noBlock: true });
          ctx.grime('oil', id, 8, 6, 1.8); ctx.grime('oil', id, 4, 5, 1.4); ctx.grime('oil', id, 6, 9, 1.3); }
        /* ── THE MODEL PASS (mondo 11-16: the wish-list models, docs/plans/WISHLIST_MODELS_ADDED.md): rats, spiders, the hand car, beacons, shoes, camp gear ── */
        [['P00-03', 3.2, 4.4], ['P00-03', -9.5, 5.9], ['P00-03', 12.4, -4.6], ['P01-03', XC(2) + 0.7, XC(9) + 0.9], ['P01-03', XC(9) - 0.8, XC(5) + 0.6], ['P02-03', XC(6) + 0.9, XC(9)], ['P02-03', XC(1), XC(7) + 1.1],
         ['P03-03', XC(8) + 0.5, XC(7) + 0.9], ['P03-03', XC(4) - 0.6, XC(10)], ['P04-03', XC(9) + 0.9, 13.4], ['P04-03', -16.4, 12.2], ['P04-03', XC(6) + 0.8, XC(3) - 0.6]].forEach((q, i) => lay(q[0], 'rat', q[1], q[2], 47 * i));
        lay('P01-03', 'spider', XC(1) - 0.9, XC(9) + 0.9, 30); lay('P02-03', 'spider', XC(6) - 0.8, XC(10) + 1.0, 200); lay('P03-03', 'spider', XC(5) + 0.4, XC(11) + 0.6, 100); lay('P00-03', 'spider', 15.8, 6.1, 300);
        put('P01-03', 'hand_car', XC(5), XC(4) - 0.4, 90);   /* on the shut stub, behind the barricade */
        [['P02-03', XC(6) + 1.5, X(10) + 3.2, 180], ['P01-03', XC(4) - 1.5, X(3) + 0.3, 0], ['P04-03', 17.2, XC(4), 270], ['P04-03', 17.2, XC(8), 270], ['P00-03', 13.6, -10.5, 270]].forEach(q => put(q[0], 'strobe_lamp', q[1], q[2], q[3], { y: q[0] === 'P00-03' ? 4.3 : 2.6, floor: false, noBlock: true }));
        lay('P04-03', 'third_rail_shoe', XC(9) - 0.5, XC(5) + 1.2, 20, { y: 0.82 }); lay('P04-03', 'third_rail_shoe', XC(9) + 0.1, XC(5) + 0.7, 100, { y: 0.82 }); lay('P04-03', 'third_rail_shoe', XC(8) - 0.9, XC(6) + 0.9, 60);
        lay('P00-03', 'sleeping_bag', 12.2, -1.2, 95); lay('P00-03', 'backpack', 13.2, -2.6, 200); lay('P00-03', 'kettle', 9.0, -3.0, 0); lay('P04-03', 'kettle', -11.6, -14.5, 40, { y: 0.8 }); lay('P00-03', 'key_ring', -11.2, -8.2, 0, { y: 1.78 });
        put('P04-03', 'ceiling_fan', -12.25, -13.0, 0, { y: 3.0, floor: false, noBlock: true });
        /* ── PASS 4, THE ATMOSPHERE (no room light is spent: `glow` parts in build; here the things that move) ── */
        air('P00-03', 'flicker_tube', -3.5, -3.5, { ceil: true, y: 4.5 }); air('P01-03', 'flicker_tube', XC(9), XC(9), { ceil: true, y: 3.6 }); air('P03-03', 'flicker_tube', XC(7), XC(4), { ceil: true, y: 4.4 }); air('P04-03', 'flicker_tube', XC(5), XC(3) - 0.4, { ceil: true, y: 4.2 });
        /* the camp's barrel fire (its glow, not one of the ten lights) */
        air('P00-03', 'psx_metal_barrel_mp_2', 8.3, -3.6, { floor: true, noBlock: false }); air('P00-03', 'hearth_fire', 8.3, -3.6, { floor: true, y: 0.55, noLight: true });
        /* steam: off the station's track, a leaking main at the Crossing, the compressor, the south tunnel */
        air('P00-03', 'chimney_smoke', -11.5, 2.2, { y: 0.1 }); air('P00-03', 'chimney_smoke', 7.5, 5.6, { y: 0.1 }); air('P02-03', 'chimney_smoke', X(3), X(5) + 0.5, { y: 2.6 }); air('P04-03', 'chimney_smoke', XC(10), XC(3), { y: 1.3 }); air('P03-03', 'chimney_smoke', XC(6), XC(9), { y: 0.1 });
        /* a lit EXIT over each hut's door */
        air('P02-03', 'exit_sign', XC(8), X(5) + 0.2, { y: 2.45, face: 180 }); air('P04-03', 'exit_sign', XC(3), X(3) + 0.2, { y: 2.45, face: 180 }); air('P00-03', 'exit_sign', X(4) - 1.2, X(4) + 0.2, { y: 3.4, face: 180 });
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
        stand('zombie', 'P01-03', ctx.squares('P01-03', 'o'), 6); ctx.native('ai', 'P02-03', 9, 3, 180, ctx.sayOf(O, 'ai'));   /* (pass 2: at the cabin's frame) */ ctx.native('gangster', 'P04-03', 2, 5, 90, ctx.sayOf(O, 'gangster'));   /* (pass 5: by the lit car, not in the crew room) */
    },
};
