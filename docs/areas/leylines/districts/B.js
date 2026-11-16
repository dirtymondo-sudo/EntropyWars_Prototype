/* LEYLINES · district B · BUG COLONY (9 plots: P03..P05 x rows 00..02; squares x 36..71, y 0..35). NEW: on mondo's own zone list; every plot
   name is a plain label. One thread a file.
   STANDS TODAY (first build): the Anthill (7 m, the tool's heights) with the queen on top, tunnel mouths drawn on its sides, a column of ants
   down the Ant Road to the line; the Hive (a straw-skep shape 9 m tall, drawn, with a core you bump); the Honeycomb (wax cells in three heights
   you walk between); the Flower Field (flowers taller than you); the Tall Grass (reeds over your head, two tracks through); the Bee Yard and
   the Meadow (bees, butterflies, small flowers, big mushrooms, a caterpillar); the Bee Queen, the Antperson, the Mantid.
   NOT YET / NEEDS A MODEL: hive boxes for the Bee Yard, a real tunnel mouth, honey (pots, drips, a pool), eggs / larvae, a walk-in hive or
   ant chamber (the ant tunnels are only drawn mouths), giant leaves and grass blades as models, webs. */
'use strict';
const HONEY = 0xe8b040;
exports.build = ctx => {
    const { A, C, feat, look, cx, cz, gx, gz } = ctx;
    /* THE HIVE */
    { const X = cx(A.hive.x), Z = cz(A.hive.y), prof = [3.1, 3.7, 4.0, 3.9, 3.5, 2.8, 1.8];
      feat({ k: 'plateau', x: X, z: Z, r: 2.6, h: 6.5, edge: 0.05 });
      look('hive', X, Z, 0, a => { prof.forEach((r, i) => a.cyl(0, i * 1.3, 0, r, 1.34, 'urban:WoodGeneric1b', i % 2 ? 0xd8a038 : 0xc48a28, { r2: prof[i + 1] || 0.8, seg: 18 }));
          a.cyl(0, 0, 4.05, 0.9, 1.9, 'dirt_4', 0x1a1206, { seg: 10 }, ctx.heightAt(A.hive.x, A.hive.y)); }); }
    /* THE HONEYCOMB: wax cells on every other square */
    { const c = A.comb, cells = [];
      for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) { if ((dx + dy) & 1 || Math.hypot(dx, dy) > 4.3 || (dx === 0 && Math.abs(dy) < 2) || (dy === 0 && Math.abs(dx) < 2)) continue; cells.push([c.x + dx, c.y + dy, 1.2 + ((dx * 7 + dy * 13 + 40) % 3) * 0.7]); }
      cells.forEach(q => { feat({ k: 'plateau', x: cx(q[0]), z: cz(q[1]), r: 1.45, h: q[2], edge: 0.05 }); ctx.taken.add(q[0] + ':' + q[1]); });
      look('comb', cx(c.x), cz(c.y), 0, a => cells.forEach(q => { const px = (q[0] - c.x) * C, pz = (q[1] - c.y) * C, pts = []; for (let i = 0; i < 6; i++) pts.push([ctx.r2(px + 1.72 * Math.cos(i * Math.PI / 3)), ctx.r2(pz + 1.72 * Math.sin(i * Math.PI / 3))]);
          a.P.push({ s: 'poly', pts, p: [0, 0, 0], h: q[2] + 0.04, key: 'gold', tint: HONEY, keyTop: 'gold', tintTop: 0xffd870 }); })); }
    /* the anthill's tunnel mouths (drawn) */
    look('anthill:mouths', gx(A.anthill.x), gz(A.anthill.y), 0, a => [[0, 22, 0], [-18, 8, 80], [17, -6, 250], [6, -20, 180]].forEach(q => a.dome(q[0], ctx.heightAt(A.anthill.x + q[0] / C, A.anthill.y + q[1] / C) - 0.5, q[1], 1.7, 1.5, null, 0x0e0a06, { seg: 10 })), 0);
};
exports.dress = ctx => {
    const { A, P, Pm, dec, tree, cx, cz, gx, gz, rnd, cell } = ctx;
    Pm('anthill', gx(A.anthill.x), gz(A.anthill.y), { h: 2.6, y: A.anthill.h - 0.2 }); Pm('ant_queen', gx(A.anthill.x) + 2.4, gz(A.anthill.y) + 1.2, { h: 1.5, y: A.anthill.h - 0.3, face: 140 });
    /* the column: down the south side, along the Ant Road to the Nexus */
    for (let y = 21; y < 38; y += 2) Pm(y % 4 === 1 ? 'ant_leaf' : 'ant', gx(53) - 1.2 + (y % 3) * 0.5, cz(y), { h: 0.9, face: y % 4 === 1 ? 0 : 180 });
    [[56, 21], [57, 24], [59, 25], [61, 24], [60, 7], [59, 6]].forEach((q, i) => dec(i % 2 ? 'ant' : 'ant_leaf', q[0], q[1], { h: 0.9 }));
    /* THE FLOWER FIELD */
    { const f = A.flowers, K = ['fae_flower', 'fae_flower_pink', 'fae_flower_violet', 'fae_flower_blue', 'fae_flower_gold'];
      for (let y = f[1]; y < f[3]; y++) for (let x = f[0]; x < f[2]; x++) { if ((x + y) % 2 === 0 && (x * 3 + y * 5) % 7 !== 0 && x !== 66) P(K[(x * 2 + y * 3) % 5], x, y, { h: 3.2 + ((x + y * 3) % 4) * 0.5, face: (x * 37 + y * 91) % 360 });
          else if ((x * 5 + y) % 3 === 0) dec(['fae_flower_small_pink', 'fae_flower_small_violet', 'fae_flower_small_blue'][(x + y) % 3], x, y); } }
    /* THE TALL GRASS: over your head, on every other square */
    { const t = A.tallgrass; for (let y = t[1]; y < t[3]; y++) for (let x = t[0]; x < t[2]; x++) if (cell[y][x] === 'T' && (x + y) % 2 === 0) P('reeds', x, y, { h: 2.9 + ((x * 7 + y) % 3) * 0.3, face: (x * 53 + y * 17) % 360 }); }
    /* THE BEE YARD + THE MEADOW */
    for (let i = 0; i < 16; i++) Pm(i % 4 === 3 ? 'bumblebee' : 'bee', cx(38 + (i * 5) % 9), cz(29 + (i * 3) % 5), { h: 0.45, y: 1.2 + (i % 5) * 0.4, face: (i * 67) % 360 });
    for (let i = 0; i < 8; i++) Pm('bee', cx(A.hive.x) + 5.5 * Math.cos(i), cz(A.hive.y) + 5.5 * Math.sin(i), { h: 0.45, y: 2 + i * 0.7, face: (i * 50) % 360 });
    for (let i = 0; i < 12; i++) dec(['fae_flower_small_pink', 'fae_flower_small_blue', 'woods_healflower'][i % 3], 38 + (i * 4) % 9, 29 + (i * 2) % 5);
    for (let i = 0; i < 12; i++) Pm('butterfly', cx(60 + (i * 5) % 11), cz(32 + (i * 3) % 4), { h: 0.4, y: 0.8 + (i % 4) * 0.4, face: (i * 71) % 360 });
    [[48, 26], [50, 34], [46, 20], [59, 30], [63, 33], [69, 15]].forEach((q, i) => P('mushroom', q[0], q[1], { h: 2.6 + (i % 3) * 0.6 })); [[49, 27], [47, 21], [58, 31], [64, 34]].forEach(q => dec('mushroom2', q[0], q[1]));
    dec('caterpillar', 57, 33, { h: 1.1 }); dec('caterpillar', 68, 14, { h: 1.1 });
    [[37, 1], [36, 14], [37, 27], [47, 2], [70, 34], [60, 1]].forEach((q, i) => tree(q[0], q[1], i % 2 ? 'tree_3' : 'tree_5', 7 + (i % 3)));
    P('signpost', 55, 36 - 1, { face: 0 });
};
exports.people = ctx => { const { native, sayOf, OLD } = ctx;
    native('bee queen', 44, 12, 160); native('antperson', 56, 22, 200, sayOf(OLD.ley, 'antperson')); native('mantid', 63, 24, 250); };
exports.airZones = () => [{ sx0: 36, sy0: 0, sx1: 72, sy1: 36, kind: 'spores', color: 0xf0e080, n: 80 }];
