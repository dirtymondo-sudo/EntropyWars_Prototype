/* LEYLINES · district Z · TECHNOTICLAN (15 plots: P04..P08 x rows 04..06; squares x 48..107, y 48..83). The Temple City as the real one
   stood: an island in a shallow lake, walked to over causeways. One thread a file.
   STANDS TODAY (first build): the lake (waded, the tool's water); THE CAUSEWAY from the west on the Tower's own axis, the North Causeway from
   the line, the south one to Room 2012's Portcullis; THE CANAL through the island with three decks over it; THE PYRAMID (56 m foot, four tiers,
   18 m, one great stair up its west face, the shrine on top, a lit line round every tier's lip); THE BALL COURT (two banks, the alley, the
   draught to Agartha under its west end); the Round Tower with its telescope; the plaza (the obelisk, four statues, the altars, the skull
   piles); the Garden Islets on their plank walks, boats; fires down every causeway; the old Temple City's people and lines.
   NOT YET / NEEDS A MODEL: the court's stone hoops, a skull rack, serpent heads at the stair's foot, canoes, market stalls, the "techno" half
   (screens, machines) beyond the lit lines; an inside (the first plan's "inside: the Pyramid" is not in the game: an idea, not built). */
'use strict';
const ST = 'cobblestone', NEON = 0x40f0e0, NEON2 = 0xff40c0;
exports.plan = ctx => { const { A, setRect, cell } = ctx, c = A.court;
    setRect(c[0], c[1] + 2, c[2], c[3] - 2, 'o');                                                   // the alley
    for (let y = 48; y < 84; y++) for (let x = 48; x < 108; x++) if (cell[y][x] === 'b') cell[y][x] = 'w'; };   // the decks stand over water (build, below)
exports.build = ctx => {
    const { A, C, tier, stair, look, feat, gx, gz, cx, cz } = ctx, p = A.pyramid, S = p.step, X = gx(p.x), Z = gz(p.y);
    p.tiers.forEach((n, i) => tier('pyramid:' + i, p.x - n / 2, p.y - n / 2, p.x + n / 2, p.y + n / 2, i * S, (i + 1) * S, ST, i % 2 ? 0xa8a498 : 0xb8b4a6));
    for (let i = 0; i < 4; i++) stair(X - (p.tiers[0] / 2 + 2 - 2 * i) * C, Z, X - (p.tiers[0] / 2 - 2 * i) * C, Z, 7, i * S, (i + 1) * S, ST);
    /* the shrine on the top + the lit line round every tier's lip */
    tier('pyramid:shrine', p.x, p.y - 2, p.x + 2, p.y + 2, 4 * S, 4 * S + 3.6, ST, 0x8a7a70);
    look('pyramid:lines', X, Z, 0, a => { p.tiers.forEach((n, i) => { const half = n * C / 2 + 0.3, y = (i + 1) * S - 0.2, col = i % 2 ? NEON2 : NEON;
            [[0, half, 2 * half, 0.14], [0, -half, 2 * half, 0.14], [half, 0, 0.14, 2 * half], [-half, 0, 0.14, 2 * half]].forEach(q => a.box(q[0], y, q[1], q[2], 0.14, q[3], null, col, { glow: 1.2 })); });
        a.roof('pyramid', 3.5, 4 * S + 3.6, 0, 7.6, 2.4, 14.6, ST, 0x6a5a52); a.box(-0.1, 4 * S + 0.2, -3.5, 0.12, 2.8, 2.0, null, NEON, { glow: 1.2 }); a.box(-0.1, 4 * S + 0.2, 3.5, 0.12, 2.8, 2.0, null, NEON2, { glow: 1.2 }); }, 0);
    /* THE BALL COURT: two banks either side of the alley */
    { const c = A.court; tier('court:n', c[0], c[1], c[2], c[1] + 2, 0, 3.5, ST, 0xa8a090); tier('court:s', c[0], c[3] - 2, c[2], c[3], 0, 3.5, ST, 0xa8a090);
      stair(gx(c[2] + 3), gz(c[1] + 1), gx(c[2]), gz(c[1] + 1), 7, 0, 3.5, ST); stair(gx(c[2] + 3), gz(c[3] - 1), gx(c[2]), gz(c[3] - 1), 7, 0, 3.5, ST);
      look('court:marks', gx((c[0] + c[2]) / 2), gz((c[1] + c[3]) / 2), 0, a => { a.box(0, 0.02, 0, 0.3, 0.04, 10.4, null, NEON, { glow: 1, sides: false }); a.box(0, 2.2, -5.4, 2.2, 1.2, 0.5, ST, 0x8a8478); a.box(0, 2.2, 5.4, 2.2, 1.2, 0.5, ST, 0x8a8478); }); }
    /* THE ROUND TOWER */
    { const o = A.observatory, OX = cx(o.x), OZ = cz(o.y); feat({ k: 'plateau', x: OX, z: OZ, r: 8.6, h: 7, edge: 0.05 });
      look('roundtower', OX, OZ, 0, a => { a.cyl(0, 0, 0, 8.75, 7.02, ST, 0xa8a498, { seg: 24 }, 0); a.cyl(0, 6.6, 0, 9.1, 0.45, ST, 0x8a8478, { seg: 24 }); a.cyl(0, 6.2, 0, 8.85, 0.14, null, NEON, { glow: 1.2, seg: 24, ri: 8.7 }); });
      stair(OX, OZ - 8.6 - 10.5, OX, OZ - 8.6 + 0.5, 3.5, 0, 7, ST); }
    /* the decks over the canal and the plank walks to the garden islets */
    const cn = A.canal, deck = (x0, y0, x1, y1, w, key) => feat({ k: 'deck', x0: gx(x0), z0: gz(y0), x1: gx(x1), z1: gz(y1), w, y: 0.2, key });
    deck(cn.x0, 67, cn.x1, 67, 7); deck(cn.x0, 58.5, cn.x1, 58.5, 3.5); deck(cn.x0, 76.5, cn.x1, 76.5, 3.5);
    deck(50, 53.5, 62, 53.5, 3.5); deck(53.5, 54, 53.5, 66, 3.5);
};
exports.dress = ctx => {
    const { A, C, P, Pm, dec, tree, gx, gz, cx, cz, taken, cell } = ctx, p = A.pyramid, X = gx(p.x), Z = gz(p.y), S = p.step;
    /* fires down the causeways */
    for (let x = 50; x < 62; x += 4) { Pm('brazier', cx(x), gz(66) + 0.5); Pm('brazier', cx(x), gz(68) - 0.5); }
    Pm('brazier', gx(80) + 0.5, cz(50)); Pm('brazier', gx(82) - 0.5, cz(50)); Pm('brazier', gx(80) + 0.5, cz(82)); Pm('brazier', gx(82) - 0.5, cz(82));
    /* THE PLAZA */
    P('obelisk', 81, 62, { h: 8 }); P('demon_statue', 78, 64, { face: 90 }); P('demon_statue', 78, 69, { face: 90 }); P('demon_statue', 84, 64, { face: 270 }); P('demon_statue', 84, 69, { face: 270 });
    P('stone_altar', 82, 72, { face: 0 }); dec('candle_ring', 82, 73); dec('ritual_circle', 81, 71, { y: 0.02 }); P('skull_pile', 78, 73); P('skull_pile', 79, 73); P('skull_pile', 80, 73); P('skull_pile', 85, 61); P('skull_pile', 77, 61);
    P('sarcophagus', 84, 73, { face: 90 }); P('signpost', 79, 55, { face: 0 }); P('signpost', 63, 65, { face: 90 }); P('lion_statue', 85, 65, { face: 270 }); P('lion_statue', 85, 68, { face: 270 });
    Pm('stone_altar', X + 1.75, Z, { y: 4 * S, face: 90 }); Pm('brazier', X - 5, Z - 5, { y: 4 * S }); Pm('brazier', X - 5, Z + 5, { y: 4 * S });
    /* the Round Tower's telescope */
    Pm('brass_telescope', cx(A.observatory.x), cz(A.observatory.y), { y: 7, face: 90 });
    /* THE GARDEN ISLETS + boats */
    A.chinampas.forEach((c, i) => { for (let y = c[1]; y < c[1] + 2; y++) for (let x = c[0]; x < c[0] + 3; x++) { if (cell[y][x] !== 'r') continue; dec(['fern', 'woods_healflower', 'fae_flower_small_pink', 'fern', 'fae_flower_small_blue'][(x + y + i) % 5], x, y); } if (cell[c[1]][c[0] + 1] === 'r') tree(c[0] + 1, c[1], 'palm', 5 + i % 2); });
    Pm('rowboat', cx(58), cz(63), { y: -0.28, face: 30 }); Pm('meshy_rowboat', cx(71), cz(51), { y: -0.28, face: 100 }); Pm('rowboat', cx(77), cz(79), { y: -0.28, face: 200 }); Pm('meshy_rowboat', cx(106), cz(60), { y: -0.28, face: 10 });
    for (let y = 49; y < 84; y += 2) if (cell[y][50] === 'r') P('reeds', 50, y, { h: 2.0 });
    for (let y = 50; y < 84; y += 5) tree(48, y, 'palm', 6 + (y % 3));
    P('sea_chest', 103, 80, { face: 300 }); dec('paper_sheet', 102, 80, { y: 0.01 }); P('campfire', 65, 70); dec('folding_chair', 66, 69); P('park_bench', 78, 57, { face: 180 });
};
exports.people = ctx => { const { A, native, npc, sayOf, OLD, cx, cz } = ctx;
    native('annunaki', 80, 65, 40, sayOf(OLD.temple, 'annunaki')); native('reptilian', 74 + 2, 59 - 1, 250, sayOf(OLD.temple, 'reptilian'));
    npc.push({ x: cx(A.observatory.x) + 3, z: cz(A.observatory.y) + 2, y: 7, face: 180, race: 'annunaki', say: sayOf(OLD.temple, 'annunaki', 1) });
    /* 2026-11-18 RACE PLACEMENT (mondo: "Quetzalcoatl to Technoticlan"; Technoticlan is the ancient city, Tenochtitlan): the feathered serpent at the foot of The Pyramid's west stair
       between the lions, a shaman at the altar inside The Portcullis, an atlantean (the other city built on water) on the canal bank by the rowboat */
    native('quetzalcoatl', 86, 66, 270); native('shaman', 81, 72, 90); native('atlantean', 76, 78, 270); };
