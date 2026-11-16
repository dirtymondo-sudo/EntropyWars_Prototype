/* LEYLINES · district T · BABEL (12 plots: P00..P03 x rows 04..06; squares x 0..47, y 48..83). One thread a file.
   STANDS TODAY (first build): THE TOWER, a square mud-brick ziggurat on an 84 m foot, four tiers of 7 m (28 m), climbed the old room's way:
   the north face, then the east, then the south, then the west ("that is a spiral"); buttressed faces; the unfinished top (half-built walls,
   the crane with its load); the Kiln and its chimney; the Brick Stacks; the Clay Pits; the Crane yard; the Workers' Town (the old room's
   twelve brick houses down one street to Room 11's barn door); palms up the fork; the Foundation Shaft by the north stair; the old Tower's
   people and lines.
   NOT YET: rails on the terraces and flights, scaffolds on the faces, a real ramp spiral, market stalls and people in the town, an inside
   (the first plan's "inside: the Tower" is not in the game: an idea, not built), lights at night beyond ten fires. */
'use strict';
const TINT = [0xd8a878, 0xcc9a6a, 0xd8a878, 0xc89462];
exports.build = ctx => {
    const { A, C, tier, stair, look, feat, gx, gz, cx, cz, BRICK } = ctx, t = A.tower, S = t.step;
    t.tiers.forEach((n, i) => tier('tower:' + i, t.x - n / 2, t.y - n / 2, t.x + n / 2, t.y + n / 2, i * S, (i + 1) * S, BRICK, TINT[i]));
    /* the buttresses: a pilaster every 7 m on each face of each tier */
    look('tower:ribs', gx(t.x), gz(t.y), 0, a => t.tiers.forEach((n, i) => { const half = n * C / 2, m = Math.floor(n / 2) - 1;
        for (let k = -m / 2; k <= m / 2; k++) { const u = k * 7; [[u, half + 0.3, 1.3, 0.6], [u, -half - 0.3, 1.3, 0.6], [half + 0.3, u, 0.6, 1.3], [-half - 0.3, u, 0.6, 1.3]].forEach(q => a.box(q[0], i * S, q[1], q[2], S - 0.5, q[3], BRICK, 0xb88458, { top: true })); } }), 0);
    /* THE SPIRAL: north, east, south, west */
    const X = gx(t.x), Z = gz(t.y), e = k => t.tiers[k] / 2 * C;
    stair(X, Z - e(0) - 10.5, X, Z - e(0), 7, 0, S, BRICK); stair(X + e(0), Z, X + e(1), Z, 7, S, 2 * S, BRICK); stair(X, Z + e(1), X, Z + e(2), 7, 2 * S, 3 * S, BRICK); stair(X - e(2), Z, X - e(3), Z, 7, 3 * S, 4 * S, BRICK);
    /* THE UNFINISHED TOP: walls that stop */
    look('tower:top', X, Z, 0, a => { a.box(-7, 4 * S, -9.6, 6.5, 2.6, 1.0, BRICK, 0xc89462); a.box(5, 4 * S, -9.6, 9, 1.4, 1.0, BRICK, 0xc89462); a.box(9.6, 4 * S, -3, 1.0, 3.4, 12, BRICK, 0xc89462); a.box(9.6, 4 * S, 7, 1.0, 1.2, 5, BRICK, 0xc89462); a.box(2, 4 * S, 9.6, 14, 1.9, 1.0, BRICK, 0xc89462); }, 0);
    /* THE KILN: a brick drum and its chimney (the old room's own sizes) */
    { const k = A.kiln, KX = cx(k.x), KZ = cz(k.y); feat({ k: 'plateau', x: KX, z: KZ, r: 8.6, h: 2.6, edge: 0.05 }); feat({ k: 'plateau', x: KX, z: KZ, r: 1.75, h: 6.4, edge: 0.05 });
      look('kiln', KX, KZ, 0, a => { a.cyl(0, 0, 0, 8.75, 2.62, BRICK, 0xb87850, { seg: 24 }, 0); a.cyl(0, 2.6, 0, 1.9, 3.85, BRICK, 0x8a5238, { r2: 1.5, seg: 12 }); a.cyl(0, 0, 8.3, 1.2, 1.7, 'dirt_4', 0x1a0c06, { seg: 10 }); a.cyl(0, 6.4, 0, 1.2, 0.1, 'dirt_4', 0xff8030, { glow: 1, sides: false }); });
      stair(KX + 8.6 + 5, KZ, KX + 8.6 - 0.5, KZ, 3.5, 0, 2.6, BRICK); }
    /* THE BRICK STACKS: a stack on every other square, three heights */
    { const s = A.stacks; for (let y = s[1] + 1; y < s[3]; y += 2) for (let x = s[0] + 1; x < s[2]; x += 2) { const hh = 0.9 + ((x * 3 + y) % 3) * 0.6; tier('stack:' + x + ':' + y, x + 0.12, y + 0.12, x + 0.88, y + 0.88, 0, hh, BRICK, (x + y) % 4 ? 0xc88a5a : 0xb87848); ctx.taken.add(x + ':' + y); } }
    /* THE CLAY PITS */
    { const p = A.pits; feat({ k: 'dip', x: gx(p[0] + 2), z: gz(p[1] + 2), r: 6.2, h: 1.5 }); feat({ k: 'dip', x: gx(p[2] - 2.5), z: gz(p[3] - 2.5), r: 7.2, h: 1.8 }); }
};
exports.dress = ctx => {
    const { A, C, P, Pm, dec, tree, gx, gz, cx, cz, taken } = ctx, t = A.tower, X = gx(t.x), Z = gz(t.y), S = t.step;
    Pm('babel_crane', X + 3.5, Z - 1.75, { face: 90, y: 4 * S }); Pm('sea_chest', X - 3, Z + 3, { y: 4 * S, face: 30 }); Pm('brazier', X - 7, Z + 7, { y: 4 * S }); Pm('brazier', X + 7, Z - 7, { y: 4 * S });
    /* fires at the foot of each flight */
    P('brazier', t.x - 3, t.y - 14); P('brazier', t.x + 2, t.y - 14); Pm('brazier', X + 38.5, Z - 5.25, { y: S }); Pm('brazier', X + 38.5, Z + 5.25, { y: S }); Pm('brazier', X - 5.25, Z + 28, { y: 2 * S }); Pm('brazier', X + 5.25, Z + 28, { y: 2 * S });
    /* THE FOUNDATION SHAFT, by the north stair */
    P('ancient_well', t.x + 4, t.y - 16, { h: 1.6 }); P('signpost', t.x + 5, t.y - 17, { face: 200 });
    for (let y = 48; y < 52; y += 2) { tree(21, y, 'palm', 7); tree(26, y, 'palm', 7); }
    /* the kiln, the stacks, the pits */
    dec('wheelbarrow', 10, 62); dec('psx_wooden_crate_1', 10, 68); dec('wheelbarrow', 6, 58); dec('pickaxe', 4, 75); dec('wooden_bucket', 5, 77); dec('hw_shovel', 7, 78); dec('wheelbarrow', 9, 72); P('campfire', 10, 59);
    /* THE CRANE yard */
    P('babel_crane', 44, 52, { face: 0 }); P('sea_chest', 40, 51, { face: 90 }); dec('cardboard_boxes', 39, 53); dec('paper_sheet', 40, 53, { y: 0.01 }); P('signpost', 43, 49, { face: 0 });
    /* THE WORKERS' TOWN: the old room's houses down the street (each fills whole squares; front to the street) */
    const house = (key, sx, sy, n, west) => { Pm(key, gx(sx + 1), gz(sy + n / 2), { face: west ? 90 : 270, floor: true }); for (let j = 0; j < n; j++) { taken.add(sx + ':' + (sy + j)); taken.add((sx + 1) + ':' + (sy + j)); } };
    house('babel_house_small', 38, 58, 2, true); house('babel_house_stair', 44, 57, 2, false); house('babel_house_row', 38, 61, 4, true); house('babel_house_small', 44, 61, 2, false);
    house('babel_house_yard', 44, 69, 3, false); house('babel_house_small', 38, 69, 2, true); house('babel_house_stair', 38, 73, 2, true); house('babel_house_row', 44, 73, 4, false);
    house('babel_house_small', 38, 77, 2, true); house('babel_house_yard', 38, 80, 3, true); house('babel_house_small', 44, 78, 2, false); house('babel_house_small', 44, 81, 2, false);
    P('campfire', 40, 71); dec('greek_amphora', 43, 60); dec('stone_urn', 43, 64); dec('greek_amphora', 40, 76); dec('stone_urn', 40, 79); dec('greek_amphora', 43, 72); P('brazier', 40, 82); P('brazier', 43, 82); P('signpost', 43, 68, { face: 90 });
    [[2, 48], [12, 49], [46, 56], [1, 60], [1, 82], [14, 82], [34, 82], [36, 49]].forEach((q, i) => tree(q[0], q[1], 'palm', 6 + (i % 3)));
};
exports.people = ctx => { const { native, sayOf, OLD } = ctx;
    native('giant', 46, 51, 250, sayOf(OLD.babel, 'giant')); native('golem', 11, 64, 100, sayOf(OLD.babel, 'golem')); native('conspiracy theorist', 43, 80, 320, sayOf(OLD.babel, 'conspiracy theorist')); };
exports.airZones = () => [{ sx0: 0, sy0: 48, sx1: 48, sy1: 84, kind: 'dust', color: 0xe8c898, n: 90 }];
