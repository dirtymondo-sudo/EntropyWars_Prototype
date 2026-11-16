/* THE SEWERS, district O · THE OLD WORKINGS (2 plots: the Old Workings, the Chimney). The mine under the precinct, the lowest level (0).
   One thread a file (docs/notes/claims.md). Read by `node bake-sewers.js`; rules: docs/notes/areas-complexes.md "THE SEWERS ON PLOTS".
   BRIEF: older than the city; bricked, flooded, lit by fire. Reached by the rope ladder from the trap under the Drunk Tank (8.75 m) and by
   the climb in the Adit from the Storm Drain. The Chimney's west door is the old portcullis into the Cavern's Oubliette. ctx: see W.js.
   STANDS TODAY: the first build (torches, a brazier, bones, a signpost, the old room's two bystanders) + PASS 1, THE EXTERIORS (the district thread,
   11-16): the Sump (deep, its own stream row), the Pump Ledge (1.4 m) + stair + the pump's iron, four piers in the Flood, the sleeper wall, timber sets
   and board roofs on the drift / the neck / the Adit, the Chimney (a 3.9 m brick stump with a ladder under a lining with daylight), the raised portcullis.
   PASS 2, THE LANDMARKS' PIECES: the engine bay (a built firebox with a real fire, stores, lockers, a bench), the pump + valve on the Ledge, the anglerfish in
   the Sump, two boats, burial niches + a sarcophagus + a coffin in the Chimney's hall, the crystal seam, a body under the shaft, the Adit's ladders, lanterns.
   PASS 3, THE DRESSING: about ninety small pieces by hand (fuel, shovels, dynamite, bones, a floater, frogs, tins, webs, bats), the camp under the Chimney, candles in
   the niches, chains on the portcullis, a missing-persons board, six floor stains; four more residents (flesheater, swamp monster, zombie, ghost).
   PASS 4, THE ATMOSPHERE: drawn light (lit brick behind the fires that have no real light, the crystal's cold wash, the firebox's hot back),
   wall stains, two stencilled plates, glowing caps, ferns and moths in the Chimney's daylight.
   PASS 5, THE POLISH: the Flood's jetty on piles, mooring posts, a lantern on each pier, drums afloat; the boat and the floater lifted to the sheet.
   Notes, the FITS THIS DISTRICT shortlist, NEEDS A MODEL and DECISIONS MADE FOR MONDO: docs/notes/areas-complexes.md "THE SEWERS, DISTRICT O". */
'use strict';
const nth = (list, i) => list.length ? list[Math.min(list.length - 1, Math.max(0, i))] : null;
const feat = (ctx, row) => ctx.feat(row);
module.exports = {
    /* PASS 1, THE EXTERIORS (the district thread, 11-16). Everything here is this district's own terrain rows and drawn shapes
       (`arch` rows: timber wears the wood surface by its brown, iron the metal one). Local squares: (lx, ly), fractions allowed. */
    build(ctx) {
        const A = 'P01-01', B = 'P00-01', r2 = ctx.r2;
        const X = (id, lx) => ctx.gx(ctx.plot[id].sx + lx), Z = (id, ly) => ctx.gz(ctx.plot[id].sy + ly);
        const take = (id, lx, ly) => { const s = ctx.sq(id, lx, ly); ctx.taken.add(s[0] + ':' + s[1]); };
        const PARTS = { [A]: [], [B]: [] }, at = (id, lx, y, ly) => [r2(X(id, lx) - X(id, 6)), y, r2(Z(id, ly) - Z(id, 6))];
        const WOOD = 0x5a4028, WOOD2 = 0x4a3420, IRON = 0x2a2a2e, RUST = 'urban:MetalCorrugatedPainted2a';
        /* a TIMBER SET (two posts at the walls, a cap beam, lagging boards over it): `along` 'x' = the beam runs west-east on the line ly = line, from lx a0 to a1 */
        const set = (id, along, line, a0, a1, h) => { const L = (a1 - a0) * 3.5, m = (a0 + a1) / 2, ax = along === 'x';
            const q = (u, y) => ax ? at(id, u, y, line) : at(id, line, y, u), sz = (l, hh, t) => ax ? [l, hh, t] : [t, hh, l];
            PARTS[id].push({ s: 'box', p: q(a0 + 0.07, 0), size: [0.34, h, 0.34], tint: WOOD }, { s: 'box', p: q(a1 - 0.07, 0), size: [0.34, h, 0.34], tint: WOOD },
                { s: 'box', p: q(m, h), size: sz(r2(L), 0.36, 0.4), tint: WOOD2, under: true },
                { s: 'box', p: q(a0 + 0.07, r2(h - 0.5)), size: [0.5, 0.14, 0.5], tint: WOOD2, under: true }, { s: 'box', p: q(a1 - 0.07, r2(h - 0.5)), size: [0.5, 0.14, 0.5], tint: WOOD2, under: true }); };
        /* the LAGGING: a board roof over a drift's sets (hidden with HIDE ROOFS, like a building's) */
        const lag = (id, x0, x1, z0, z1, y) => PARTS[id].push({ s: 'box', p: at(id, (x0 + x1) / 2, y, (z0 + z1) / 2), size: [r2((x1 - x0) * 3.5), 0.1, r2((z1 - z0) * 3.5)], tint: WOOD2, under: true, roof: true });
        /* boards laid on the floor as the path (the old room's own) */
        const board = (id, lx, ly, len, ry) => PARTS[id].push({ s: 'box', p: at(id, lx, 0.02, ly), size: [len, 0.05, 0.9], ry: ry || 0, tint: WOOD });

        /* ── THE OLD WORKINGS (P01-01) ── */
        /* THE SUMP: deep, never waded (the old room's own), in the north chamber's east end, behind bars */
        feat(ctx, { k: 'stream', pts: [[X(A, 8), Z(A, 3)], [X(A, 11), Z(A, 3)]], w: 7, y: -0.3, depth: 1.8, key: 'deep_water' });
        for (let lx = 8; lx <= 10; lx++) for (let ly = 2; ly <= 3; ly++) take(A, lx, ly);
        feat(ctx, { k: 'rail', x0: r2(X(A, 8) - 0.1), z0: r2(Z(A, 2) + 0.2), x1: r2(X(A, 8) - 0.1), z1: r2(Z(A, 4) - 0.1), model: 'ranch' });
        /* THE PUMP LEDGE (1.4 m, the old room's height): a timber stage over the Sump's south side, up its own flight */
        feat(ctx, { k: 'plateau', x: r2(X(A, 9.5) + 0.25), z: Z(A, 4.5), w: 11, d: 3.5, h: 1.4, edge: 0.1 });
        feat(ctx, { k: 'ramp', x0: r2(X(A, 7) + 0.1), z0: Z(A, 4.5), x1: r2(X(A, 8) + 0.4), z1: Z(A, 4.5), w: 3.5, h0: 0, h1: 1.4, stairs: true, model: 'wood', edge: 0.15 });
        feat(ctx, { k: 'rail', x0: r2(X(A, 8) + 0.15), z0: r2(Z(A, 5) - 0.15), x1: r2(X(A, 11) - 0.1), z1: r2(Z(A, 5) - 0.15), y: 1.4, model: 'ranch' });
        feat(ctx, { k: 'rail', x0: r2(X(A, 8) + 0.15), z0: r2(Z(A, 4) + 0.15), x1: r2(X(A, 11) - 0.1), z1: r2(Z(A, 4) + 0.15), y: 1.4, model: 'ranch' });
        take(A, 7, 4);
        PARTS[A].push({ s: 'box', p: at(A, 9.5, 1.4, 4.5), size: [10.4, 0.07, 3.4], tint: WOOD },                                   // its deck
            { s: 'box', p: at(A, 8.1, 0, 4.98), size: [0.28, 1.4, 0.28], tint: WOOD, n: 4, step: [3.3, 0, 0] },                         // the posts along its face
            { s: 'box', p: at(A, 9.5, 1.05, 5.0), size: [10.4, 0.3, 0.12], tint: WOOD2 },
            /* the pump's iron: the suction pipe down into the Sump, the rising main up the east wall to the dark */
            { s: 'cyl', p: at(A, 9.5, -1.6, 3.75), r: 0.16, h: 3.6, key: RUST, tint: 0x6a3f24, seg: 8 },
            { s: 'box', p: at(A, 9.5, 1.85, 4.15), size: [0.3, 0.3, 1.6], key: RUST, tint: 0x6a3f24, under: true },
            { s: 'cyl', p: at(A, 10.8, 1.4, 4.5), r: 0.2, h: 13, key: RUST, tint: 0x5a3622, seg: 8 },
            { s: 'box', p: at(A, 10.88, 3.2, 4.5), size: [0.3, 0.12, 0.6], tint: IRON, n: 4, step: [0, 3, 0] },
            { s: 'box', p: at(A, 10.2, 1.95, 4.5), size: [1.9, 0.3, 0.3], key: RUST, tint: 0x6a3f24, under: true });
        /* THE FLOOD's four brick piers, standing in the water, floor to vault */
        [[3, 6], [9, 6], [3, 9], [9, 9]].forEach(q => ctx.pier(A, q[0], q[1]));
        /* THE SLEEPER WALL (the old room's grind) on the Flood's north bank (the old pipe rail drew white here: left out) */
        feat(ctx, { k: 'wall', x0: X(A, 4.4), z0: Z(A, 6), x1: X(A, 8.6), z1: Z(A, 6), h: 0.6, t: 0.5, key: 'bricks_2' });
        /* the neck under the trap: two sets, boarded over (open at the rope ladder) */
        set(A, 'x', 0.95, 5, 8, 3.3); set(A, 'x', 1.9, 5, 8, 3.3); lag(A, 5, 8, 0.8, 2.05, 3.7);
        /* THE DRIFT to the Chimney: a set a square, boarded over */
        [0.5, 1.6].forEach(l => set(A, 'z', l, 5, 8, 3.3)); lag(A, 0, 2.1, 5, 8, 3.7);
        [9.4, 10.5, 11.5].forEach(l => set(B, 'z', l, 5, 8, 3.3)); lag(B, 9.2, 12, 5, 8, 3.7);
        board(A, 4.6, 5.5, 5.2, 3); board(A, 6.3, 5.45, 4.6, -2); board(A, 1.2, 6.5, 6.0, 2); board(B, 10.6, 6.5, 6.4, -2); board(B, 8.4, 6.2, 4.4, 9);
        /* THE FIREBOX (the engine bay's furnace, built: brick cheeks, an iron lintel, a flue up into the dark; the fire is a `hearth_fire` in dress) */
        { const f = (y, dx, dz) => at(A, 2 + dx / 3.5, y, 3.5 + dz / 3.5), BR = { key: 'bricks_2', tint: 0x7a5a48 };
          PARTS[A].push(Object.assign({ s: 'box', p: f(0, 0.75, -1.1), size: [1.5, 1.7, 0.55] }, BR), Object.assign({ s: 'box', p: f(0, 0.75, 1.1), size: [1.5, 1.7, 0.55] }, BR),
              Object.assign({ s: 'box', p: f(1.7, 0.75, 0), size: [1.5, 0.9, 2.75], under: true }, BR), Object.assign({ s: 'box', p: f(0, 0.12, 0), size: [0.24, 1.7, 1.65] }, BR),
              Object.assign({ s: 'box', p: f(2.6, 0.5, 0), size: [0.9, 9, 0.9] }, BR), { s: 'box', p: f(1.58, 1.52, 0), size: [0.08, 0.14, 1.7], tint: IRON },
              Object.assign({ s: 'box', p: f(0, 0.9, 0), size: [1.7, 0.12, 1.65] }, BR)); }
        feat(ctx, { k: 'scatter', key: 'cinder_block', n: 4, x: X(A, 3.5), z: Z(A, 3.2), r: 3, seed: 4 });

        /* ── THE CHIMNEY (P00-01) ── */
        /* THE CHIMNEY: the old shaft to the surface. Its 3.9 m brick stump (the old room's own height) stands under the lining that
           hangs from the vault; daylight comes down it. A ladder on the stump's south face: stand on it and look up. */
        const cx = X(B, 5.5), cz = Z(B, 4.5), top = ctx.ceil(B);
        feat(ctx, { k: 'plateau', x: cx, z: cz, r: 1.75, h: 3.9, edge: 0.15 }); take(B, 5, 4);
        feat(ctx, { k: 'climb', x: cx, z: r2(cz + 1.75 + 0.3), face: 0, look: 'ladder' });
        const c = (y, o) => Object.assign({ s: 'cyl', p: at(B, 5.5, y, 4.5), seg: 20 }, o);
        PARTS[B].push(c(6.9, { r: 2.75, ri: 2.3, h: r2(top - 6.9 + 0.1), key: 'bricks_2', tint: 0x554e45, cap: false }),                 // the lining
            c(6.86, { r: 2.75, ri: 2.3, h: 0.05, key: 'bricks_2', tint: 0x554e45, ds: true }),                                           // its lip, seen from below
            c(6.5, { r: 2.95, ri: 2.3, h: 0.4, key: 'bricks_2', tint: 0x554e45, ds: true }),                                             // the corbel course
            c(r2(top - 1.35), { r: 2.29, h: 0.03, tint: 0xcfe2ff, glow: 1, ds: true }),                                                  // the sky: under the vault's own brick, which crosses the shaft a metre down
            c(r2(top - 3.3), { r: 2.28, h: 1.95, key: 'bricks_2', tint: 0xaab6c6, glow: 0.5, ds: true, cap: false }),                    // daylight on the lining, fading down
            c(r2(top - 5.0), { r: 2.28, h: 1.7, key: 'bricks_2', tint: 0x9aa4b0, glow: 0.24, ds: true, cap: false }),
            c(6.92, { r: 2.28, h: r2(top - 5.0 - 6.92), key: 'bricks_2', tint: 0x8a929a, glow: 0.1, ds: true, cap: false }),
            c(3.93, { r: 1.66, h: 0.02, key: 'bricks_2', tint: 0x9fb48a, glow: 0.3 }),                                                   // the stump's top: lit, mossed
            c(0.03, { r: 3.6, ri: 1.8, h: 0.01, key: 'bricks_2', tint: 0xa8b4bc, glow: 0.07, kind: 'over' }),                            // the pale ring the shaft throws on the floor
            c(4.9, { r: 0.03, h: r2(top - 1.35 - 4.9), tint: 0x7a6238, seg: 6 }),                                                                // the old hoist rope, still hanging
            { s: 'box', p: at(B, 5.5, 7.1, 4.5 - 2.22 / 3.5), size: [0.5, 0.05, 0.08], tint: IRON, n: Math.floor((top - 8.6) / 0.42), step: [0, 0.42, 0] });   // iron rungs up the lining
        feat(ctx, { k: 'scatter', key: 'cave_stone', n: 5, x: X(B, 3.2), z: Z(B, 8.2), r: 2.2, seed: 3 });
        /* THE OLD PORTCULLIS (the way into the Cavern's Oubliette): raised in its stone frame, on its chains under the winding beam */
        { const g = (y, dz) => at(B, 0.3, y, 5.5 + dz / 3.5);
          PARTS[B].push({ s: 'box', p: g(0, -2.15), size: [0.8, 6.2, 0.8], key: 'bricks_2', tint: 0x5a544a }, { s: 'box', p: g(0, 2.15), size: [0.8, 6.2, 0.8], key: 'bricks_2', tint: 0x5a544a },
              { s: 'box', p: g(6.2, 0), size: [0.9, 0.8, 5.1], key: 'bricks_2', tint: 0x5a544a, under: true },
              { s: 'box', p: g(2.75, -1.6), size: [0.07, 2.6, 0.07], tint: IRON, n: 9, step: [0, 0, 0.4] },
              { s: 'box', p: g(3.15, 0), size: [0.06, 0.08, 3.5], tint: IRON, n: 3, step: [0, 0.95, 0] },
              { s: 'box', p: g(5.35, -1.2), size: [0.05, 0.85, 0.05], tint: IRON, n: 2, step: [0, 0, 2.4] },
              { s: 'box', p: g(7.0, 0), size: [0.36, 0.36, 4.3], tint: WOOD2, under: true }, { s: 'cyl', p: g(7.36, 0), r: 0.3, h: 0.5, tint: WOOD, seg: 10 }); }
        /* THE ADIT (the climb up to the Storm Drain): three sets on the stem, boarded over short of the ladder */
        [9.1, 10.0, 10.9].forEach(l => set(B, 'x', l, 4, 8, 3.4)); lag(B, 4, 8, 8.95, 10.75, 3.8);
        board(B, 5.4, 10.2, 5.6, 88); board(B, 6.5, 8.6, 4.2, 84);

        /* ── PASS 4, THE ATMOSPHERE. The room has ten real lights and this district gets two, so its other fires light their walls and
           floor the DRAWN way (the zone kit's rule): the same sheet, paler, with `glow`. No particles: the air is the tool's shell. ── */
        const FIRE = 0xd8c0a0, COLD = 0xa8d0c4, DIRV = { s: [0, 1, 0], n: [0, -1, 180], e: [1, 0, 270], w: [-1, 0, 90] };
        /* (pools of lit floor under the fires were tried and read as round rugs from above: left out) */
        /* the wall behind a fire, lit: (fx, fy) = the point on the wall's line, `d` = the way the wall faces */
        const wash = (id, d, fx, fy, col, y) => { const v = DIRV[d]; [[1.2, 1.4, 0.11, (y || 1.7) - 0.5], [2.3, 2.5, 0.07, Math.max(0.3, (y || 1.7) - 1.2)], [3.6, 3.6, 0.035, 0.15]].forEach((q, i) =>
            PARTS[id].push({ s: 'box', p: at(id, fx + v[0] * (0.07 - i * 0.015) / 3.5, q[3], fy + v[1] * (0.07 - i * 0.015) / 3.5), size: [q[0], q[1], 0.02], ry: v[2], key: 'bricks_2', tint: col || FIRE, glow: q[2], top: false, uv: 3.5 })); };
        /* a stain run down a wall */
        const streak = (id, d, fx, fy, w, h, tint) => { const v = DIRV[d]; PARTS[id].push({ s: 'box', p: at(id, fx + v[0] * 0.04 / 3.5, 0.45, fy + v[1] * 0.04 / 3.5), size: [w, h, 0.025], ry: v[2], key: 'bricks_2', tint: tint || 0x1e2414, top: false }); };
        /* a stencilled plate on an iron back */
        const plate = (id, d, fx, fy, y, words) => { const v = DIRV[d], w = r2(Math.max(1.2, words.length * 0.16));
            PARTS[id].push({ s: 'box', p: at(id, fx + v[0] * 0.03 / 3.5, y - 0.04, fy + v[1] * 0.03 / 3.5), size: [w + 0.12, 0.44, 0.04], ry: v[2], tint: IRON },
                { s: 'quad', p: at(id, fx + v[0] * 0.06 / 3.5, y, fy + v[1] * 0.06 / 3.5), size: [w, 0.36], ry: v[2], key: 'txt:' + words + '|#e8d9a0|#3a2a1c|' + r2(w / 0.36) + '||stencil', uv: 'fit', kind: 'wall', glow: 0.35 }); };
        /* the Old Workings */ wash(A, 'w', 11, 10.5); wash(A, 'n', 10.5, 11);                       // the Flood's torch
        PARTS[A].push({ s: 'box', p: at(A, 2 + 0.3 / 3.5, 0.92, 3.5), size: [0.1, 0.7, 1.6], tint: 0xff7a28, glow: 0.8 });   // the firebox's back, hot
        plate(A, 'w', 8 - 0.14 / 3.5, 3.0, 0.62, 'THE SUMP · DEEP WATER');
        [['s', 3.4, 2, 0.5, 2.2], ['s', 9.3, 2, 0.8, 1.5], ['e', 2, 2.6, 0.6, 2.6], ['n', 5.5, 11, 0.9, 1.8], ['n', 8.2, 11, 0.4, 2.4], ['w', 11, 7.4, 0.7, 2.0], ['w', 11, 9.1, 0.35, 2.8], ['e', 2, 9.6, 0.8, 1.6], ['e', 5, 0.6, 0.5, 2.1], ['w', 8, 0.9, 0.6, 1.7]]
            .forEach(q => streak(A, q[0], q[1], q[2], q[3], q[4]));
        streak(A, 'w', 11, 4.6, 0.5, 3.4, 0x5a2e14);                                                    // rust under the rising main
        /* the Chimney */
        /* (the portcullis' torch is one of the two real lights: nothing drawn there) */
        wash(B, 's', 4.15, 3, FIRE, 1.9); wash(B, 's', 6.85, 3, FIRE, 1.9);                             // the candelabra at the niches wash(B, 'w', 9, 8.5, COLD, 1.2); wash(B, 'n', 8.5, 9, COLD, 1.2); // the crystal seam's cold light
        plate(B, 'n', 6, 9.1 - 0.21 / 3.5, 3.42, 'THE ADIT');
        [['s', 5.6, 3, 0.7, 2.4], ['e', 2, 7.6, 0.5, 2.0], ['w', 9, 3.6, 0.6, 2.7], ['n', 3.4, 9, 0.5, 1.9], ['e', 4, 10.4, 0.6, 2.2], ['w', 8, 9.8, 0.4, 2.6], ['s', 10.4, 5, 0.6, 1.6], ['n', 11.2, 8, 0.8, 1.3]]
            .forEach(q => streak(B, q[0], q[1], q[2], q[3], q[4]));
        streak(B, 's', 3.0, 3, 1.1, 2.9, 0x8a927a); streak(B, 's', 8.0, 3, 0.9, 2.5, 0x8a927a);         // lime weeping out of the niches

        /* ── PASS 5, THE POLISH: THE FLOOD was a bare tank. A rotten JETTY on piles from the north bank, broken off half way (drawn: the
           sleeper wall shuts its head, a wader walks between its piles), mooring posts, an iron bracket on each pier for a lantern. ── */
        PARTS[A].push({ s: 'box', p: at(A, 6.5, 0.42, 6.9), size: [1.5, 0.08, 5.6], tint: WOOD }, { s: 'box', p: at(A, 6.42, 0.3, 8.05), size: [1.3, 0.08, 1.9], ry: 7, tint: WOOD2 },       // the deck, its last boards sagging
            { s: 'box', p: at(A, 6.5 - 0.62 / 3.5, -1.4, 6.25), size: [0.22, 2.0, 0.22], tint: WOOD2, n: 4, step: [0, 0, 1.75] }, { s: 'box', p: at(A, 6.5 + 0.62 / 3.5, -1.4, 6.25), size: [0.22, 2.0, 0.22], tint: WOOD2, n: 4, step: [0, 0, 1.75] },
            { s: 'box', p: at(A, 6.5, 0.26, 6.25), size: [1.6, 0.16, 0.16], tint: WOOD2, n: 4, step: [0, 0, 1.75] },
            { s: 'box', p: at(A, 6.5 - 0.62 / 3.5, 0.5, 6.25), size: [0.14, 0.75, 0.14], tint: WOOD, n: 2, step: [0, 0, 3.5] },                                                                 // two hand posts
            { s: 'cyl', p: at(A, 5.1, -1.4, 8.7), r: 0.13, h: 2.3, tint: WOOD2, seg: 7 }, { s: 'cyl', p: at(A, 8.2, -1.4, 7.1), r: 0.13, h: 2.5, tint: WOOD2, seg: 7 }, { s: 'cyl', p: at(A, 4.3, -1.4, 7.3), r: 0.12, h: 2.1, tint: WOOD2, seg: 7 },
            { s: 'cyl', p: at(A, 7.5, -1.4, 9.5), r: 0.13, h: 2.2, tint: WOOD2, seg: 7 });
        [[3.5, 6.5, 1], [9.5, 6.5, 1], [3.5, 9.5, -1], [9.5, 9.5, -1]].forEach(q => PARTS[A].push({ s: 'box', p: at(A, q[0], 2.95, q[1] + q[2] * 1.12 / 3.5), size: [0.07, 0.07, 0.55], tint: IRON }, { s: 'box', p: at(A, q[0], 2.6, q[1] + q[2] * 0.9 / 3.5), size: [0.05, 0.4, 0.05], tint: IRON }));
        [A, B].forEach(id => ctx.feat({ k: 'arch', id: 'sew:O:' + id + ':mine', x: X(id, 6), z: Z(id, 6), rot: 0, base: ctx.plot[id].base, parts: PARTS[id] }));
    },
    dress(ctx) {
        const A = 'P01-01', B = 'P00-01', r2 = ctx.r2;
        const X = (id, lx) => ctx.gx(ctx.plot[id].sx + lx), Z = (id, ly) => ctx.gz(ctx.plot[id].sy + ly);
        /* P = a blocker on a square's middle; put = decor at an exact place (fractions of a square), facing `face` (degrees, 0 = north) */
        const P = (key, id, lx, ly, o) => ctx.P(key, id, lx, ly, o);
        const put = (key, id, fx, fy, face, o) => ctx.props.push(Object.assign({ key, x: X(id, fx), z: Z(id, fy), face: face || 0 }, o || {}));
        const dark = { noLight: true };   // a fire that keeps its glow but takes none of the room's ten real lights

        /* ── PASS 2, THE LANDMARKS' OWN PIECES. The REAL lights first (the room has ten; after the cells' and the culverts' ceiling bulbs this
           district's first two rows are lit: the hearth fire, the portcullis' torch; then, if any are left, the Flood's torch and the crystal seam). ── */
        /* THE ENGINE BAY (the north chamber's west end): the furnace that drove the pump, its stores */
        put('hearth_fire', A, 2.42, 3.5, 90); ctx.taken.add(ctx.sq(A, 2, 3).join(':'));   // in the brick firebox (build): the `door_furnace` model is 117 k triangles, the firebox is 60
        P('cave_torch', B, 1, 4); P('cave_torch', B, 1, 6, dark);
        P('cave_torch', A, 10, 10);
        P('crystal_cluster', B, 8, 8);
        P('cable_drum', A, 4, 2); P('psx_wooden_crate_2', A, 2, 2); P('platform_scale', A, 2, 4);
        put('locker', A, 3.3, 2.14, 180); put('locker', A, 3.62, 2.14, 180);
        put('hand_truck', A, 4.4, 3.7, 200); put('meshy_burlap_sack', A, 2.9, 3.75, 40); put('meshy_burlap_sack', A, 3.1, 4.2, 110);
        P('psx_table_large_3', A, 4, 4, { face: 90 }); put('psx_hand_saw_1', A, 4.45, 4.4, 30, { y: 0.93 });
        /* THE PUMP LEDGE: the pump over the Sump, its valve, a lantern */
        put('centrifugal_pump', A, 9.5, 4.5, 0); put('gate_valve', A, 8.55, 4.35, 90); put('railway_lantern', A, 10.6, 4.8, 0);
        /* THE SUMP: what lives in the deep (a light a long way down) */
        put('ocean_anglerfish', A, 9.5, 3, 0, { y: -1.3 });
        /* THE FLOOD: a sunk boat, a beached one, an anchor (the pack's weed and eel are 100 k triangles apiece: not placed) */
        put('meshy_rowboat', A, 7.35, 8.3, 100, { y: 0.9, noBlock: true }); P('rowboat', A, 4, 10, { face: 80 });
        /* THE CHIMNEY's hall: the burial niches the miners broke into (north wall), a coffin dragged out, the crystal seam (south-east) */
        [2.5, 3.5, 7.5, 8.5].forEach(fx => put('catacomb_wall', B, fx, 3.07, 180));
        P('sarcophagus', B, 2, 4, { face: 90 }); P('hw_coffin', B, 8, 4, { face: 20 }); put('hw_coffin_lid', B, 7.3, 4.6, 70);
        put('candelabra', B, 4.15, 3.3, 0); put('candelabra', B, 6.85, 3.3, 0);
        put('meshy_crystal_shards', B, 7.4, 8.5, 20); put('meshy_crystal_shard', B, 8.6, 7.4, 200); put('meshy_crystal_shard', B, 7.2, 7.7, 90); put('meshy_crystal_shards', B, 8.75, 8.7, 140);
        /* what came down the shaft */
        put('hw_body_2', B, 6.45, 5.2, 130); put('hw_bricks', B, 4.6, 5.3, 10); put('hw_bricks_2', B, 6.3, 3.8, 80); put('psx_brick_1', B, 4.5, 3.9, 40);
        put('crow', B, 5.75, 4.3, 200, { y: 3.95 });
        /* by the portcullis: a cage, the stocks */
        put('bird_cage', B, 2.5, 6.6, 0); P('stocks', B, 2, 7, { face: 90 });
        /* THE ADIT's foot: spare ladders, sandbags, crates */
        put('library_ladder', B, 4.12, 9.6, 90); put('ladder_wall_rack', B, 7.88, 10.4, 270); P('meshy_sandbags', B, 7, 9); P('psx_wooden_crate_2', B, 4, 11); put('psx_wooden_crate_6', B, 4.4, 10.3, 25); put('railway_lantern', B, 5.2, 11.6, 0);
        P('signpost', B, 7, 8);
        /* THE DRIFT: shoring logs, drums, a lantern under the boards */
        P('fallen_log', A, 0, 7, { face: 90 }); P('psx_metal_barrel_mp_2', B, 10, 5); put('psx_metal_barrel_mp_1', B, 10.75, 5.2, 0); put('psx_wooden_crate_3', B, 9.4, 7.6, 15);
        put('ship_lantern', B, 10.5, 6.5, 0, { y: 3.55 }); put('ship_lantern', A, 1, 6.5, 0, { y: 3.55 }); put('ship_lantern', B, 6, 9.9, 0, { y: 3.65 }); put('ship_lantern', A, 6.5, 1.4, 0, { y: 3.55 });
        /* the neck under the trap: where the rope ladder lands */
        P('psx_wooden_crate_2', A, 5, 0);
        /* the first build's own pieces, kept: the brazier, the skull heap, the skeleton, bones, a bucket, mushrooms */
        P('brazier', A, 6, 3); P('skull_pile', B, 3, 6); P('anatomy_skeleton', A, 2, 10);
        put('hw_part_3', A, 10.4, 8.3, 30, { noBlock: true }); put('hw_part', B, 3.6, 7.5, 0, { noBlock: true });
        put('mushroom2', B, 2.3, 8.6, 0); put('mushroom2', B, 8.6, 5.4, 0); put('mushroom2', A, 10.6, 5.4, 0);
        ['psx_cobweb_2', 'psx_cobweb_1'].forEach((k, i) => { put(k, A, 2.2 + i * 8.5, 10.7, 0); put(k, B, 2.2 + i * 6.5, 8.75, 0); });

        /* ── PASS 3, THE DRESSING: the small things, by hand. `lit` = decor that blocks nobody (the zone kit: a prop with a foot blocks
           unless its row says noBlock). Cheap pack pieces first (the Meshy ones are 5 to 10 k triangles apiece). ── */
        const lit = (key, id, fx, fy, face, o) => put(key, id, fx, fy, face, Object.assign({ noBlock: true }, o || {}));
        /* the engine bay: fuel, nails, shovels, dynamite by the bench, coal bricks at the firebox */
        lit('psx_jerrycan_1', A, 2.25, 4.35, 20); lit('psx_jerrycan_1', A, 2.5, 4.55, 75); lit('psx_supply_crate_1', A, 4.75, 2.9, 10);
        lit('hw_shovel', A, 3.3, 3.05, 40); lit('hw_shovel', A, 2.75, 2.75, 120); [[3.9, 4.75, 0], [4.02, 4.82, 60], [3.82, 4.86, 130]].forEach(q => lit('spell_dynamite', A, q[0], q[1], q[2]));
        lit('hw_bricks', A, 2.9, 3.2, 0); lit('psx_brick_1', A, 3.2, 3.85, 50); lit('psx_brick_1_1', A, 2.7, 2.6, 15); lit('psx_wooden_crate_1', A, 2.75, 2.3, 30);
        lit('psx_metal_barrel_mp_0', A, 7.62, 0.4, 0); lit('psx_wooden_crate_1', A, 5.3, 1.2, 60);
        /* the Pump Ledge */
        lit('psx_pipe_valve_holder_large_2', A, 10.5, 4.75, 0); lit('psx_jerrycan_1', A, 8.3, 4.2, 140);
        /* the Flood's banks: a floater, bones, a fish's bones, frogs, cans, bottles */
        put('hw_body', A, 5.6, 8.2, 200, { y: 0.85, noBlock: true }); lit('psx_fish_skeleton_mp_1', A, 6.6, 10.4, 20);
       
        lit('psx_brick_1', A, 10.3, 6.3, 0); lit('hw_bricks_2', A, 2.4, 6.4, 30); lit('psx_wooden_crate_1', A, 8.9, 10.62, 12);
        /* the drift */
        lit('psx_wooden_crate_4', A, 1.5, 5.25, 8); lit('hw_shovel', A, 0.5, 5.3, 80); lit('psx_supply_crate_1', B, 11.3, 7.7, 30); lit('psx_brick_1_1', B, 9.7, 5.4, 70);
        P('missing_board', B, 9, 5, { face: 180 });
        /* THE CAMP under the Chimney (who sleeps down here): a fire ring, mattresses, a chair, a pot, tins, bottles, a book */
        P('campfire', B, 5, 7, dark); lit('psx_old_mattress_mp_1', B, 3.9, 7.5, 80); lit('psx_old_mattress_mp_1', B, 6.9, 7.3, 100); lit('psx_chair_mp_1', B, 5.9, 6.4, 200);
        P('cauldron', B, 6, 8); lit('psx_glass_bottle_1', B, 6.6, 6.8, 30); lit('psx_glass_bottle_1', B, 3.7, 6.8, 120);
        lit('psx_open_book_mp_1', B, 4.2, 7.9, 40); lit('psx_wooden_crate_1', B, 6.75, 7.9, 20);
        /* the niches: candles, bones, straw, a rusted sword */
        [[2.6, 3.45], [3.5, 3.4], [7.5, 3.4], [8.4, 3.45]].forEach((q, i) => lit(i % 2 ? 'hw_candles' : 'hw_candles_2', B, q[0], q[1], i * 50));
        lit('psx_sword_mp_1', B, 3.2, 4.3, 140); lit('hw_bricks', B, 8.3, 4.9, 0);
        /* the portcullis: chains on its frame, a bone */
        put('wall_chains', B, 0.56, 4.95, 90); put('wall_chains', B, 0.56, 6.05, 90);
        /* the Adit's foot */
        lit('psx_metal_barrel_mp_3', B, 7.6, 11.5, 0); lit('psx_wooden_crate_5', B, 4.5, 9.3, 5); lit('hw_shovel', B, 6.9, 10.6, 20); lit('psx_brick_1', B, 5.6, 11.2, 0);
        /* webs on the timber, bats under the boards and round the shaft's lip */
        [[A, 5.2, 0.95], [A, 0.5, 5.2], [B, 10.5, 7.8], [B, 4.2, 9.1], [B, 7.8, 10.9]].forEach((q, i) => lit(['hw_web', 'hw_web_2', 'hw_web_3'][i % 3], q[0], q[1], q[2], i * 90, { y: 2.3 }));
        [[B, 4.9, 4.1, 6.3], [B, 6.1, 4.9, 6.35], [B, 5.6, 3.95, 6.3], [A, 1.2, 6.9, 3.5], [A, 6.2, 1.7, 3.5], [B, 5.5, 9.6, 3.6], [A, 9.2, 6.4, 7.5], [A, 3.4, 9.3, 8.2]].forEach((q, i) => lit(['bat_black', 'bat_brown', 'bat_grey'][i % 3], q[0], q[1], q[2], i * 47, { y: q[3] }));
        /* PASS 4: what grows and flies in the little light there is: glowing caps at the stump's foot (the `fern` is a potted house plant: taken out) and in the Flood's far corner (the moths cost 33 draw calls for three: taken out) */
        [[B, 4.55, 3.9], [B, 6.5, 4.0], [B, 6.35, 5.05], [A, 2.2, 10.6], [A, 2.6, 9.5], [A, 2.25, 8.5]].forEach((q, i) => lit('woods_glowcap', q[0], q[1], q[2], i * 61));
        /* PASS 5: THE FLOOD's own pieces: a lantern on each pier's bracket, drums and a crate afloat */
        [[3.5, 6.5, 1], [9.5, 6.5, 1], [3.5, 9.5, -1], [9.5, 9.5, -1]].forEach(q => put('ship_lantern', A, q[0], q[1] + q[2] * 1.3 / 3.5, 0, { y: 2.95 }));
        put('psx_metal_barrel_mp_1', A, 5.3, 7.2, 0, { y: 0.35, noBlock: true }); put('psx_metal_barrel_mp_3', A, 8.6, 8.5, 0, { y: 0.3, noBlock: true }); put('psx_wooden_crate_2', A, 4.6, 9.0, 25, { y: 0.25, noBlock: true });
        /* (two `culvert_mouth` in the south wall looked right and cost a third of the frame rate at this view, 1.15 against 1.60: taken out) */
        /* floor stains (the room draws 80; this district adds six) */
        ctx.grime('scorch', A, 3, 3, 1.5); ctx.grime('scorch', B, 5, 7, 1.6); ctx.grime('blood', B, 2, 7, 1.2); ctx.grime('blood', B, 6, 5, 1.3); ctx.grime('puddle', A, 6, 10, 1.6); ctx.grime('puddle', B, 5, 10, 1.4);
    },
    people(ctx) {
        const O = ctx.O.workings;
        /* the old room's two, with their own lines: by the Sump ("do not wade the sump"), under the Chimney ("there is daylight down the chimney") */
        ctx.native('ghoul', 'P01-01', 7, 2, 90, ctx.sayOf(O, 'ghoul')); ctx.native('skeleton', 'P00-01', 4, 6, 20, ctx.sayOf(O, 'skeleton'));
        /* PASS 3 (mondo 11-16: more NPCs, none blocking a path): four more who fit, in the halls, never on a walk a square wide. No lines: none are invented.
           The plan's homes table names the Flesheater and the Swamp Monster for the Sewers. */
        ctx.native('flesheater', 'P01-01', 3, 3, 270); ctx.native('swamp monster', 'P01-01', 1, 7, 90); ctx.native('zombie', 'P00-01', 7, 6, 250); ctx.native('ghost', 'P00-01', 3, 3, 180);
    },
};
