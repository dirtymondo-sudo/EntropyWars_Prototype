/* LEYLINES · district B · BUG COLONY (9 plots: P03..P05 x rows 00..02; squares x 36..71, y 0..35). NEW: on mondo's own zone list; every plot
   name is a plain label. One thread a file.
   THE REDESIGN (mondo 11-17, the Leylines One World thread: "a giant beehive on a giant tree above ground, and the anthill underground" + "at
   least put them opposite of each other"; plan v1 OK'd with that change):
   - THE GIANT TREE (P03-00, north-west): a trunk 14 m across and 48 m tall, its canopy over two plots. THE ROOT STAIR: four root shelves round
     the trunk (south 3.5 m, west 7, north 10.5, east 14), a stair between each, the first up from the ground on the south-west. From the east
     shelf a door goes into THE HIVE, the great comb hanging off the bough over the Meadow (its own room, `site_prebuilt_gobekli_hive`).
   - THE ANTHILL (P05-02, south-east, opposite): the mound, 9 m, its way in at the west foot: down into THE ANT NEST (its own room,
     `site_prebuilt_gobekli_nest`, underground).
   - kept: the Honeycomb (wax cells, now the comb fallen from the hive), the Flower Field, the Tall Grass, the Bee Yard (the wish list's
     hive boxes now), the Meadow (moved north), the Ant Road; the column of ants runs from the flowers to the hill.
   INSIDE THE HIVE: seven hexagon chambers on whole squares (rows 3 5 7 7 7 5 3), wax walls in the hexagon tile, a gap between each pair:
     the Queen in the middle, the Nursery (brood cells, drawn), the Honey (a honey hollow you wade), Pollen, Wax (candles), Guard, the Door.
   INSIDE THE ANT NEST: earth tunnels two squares wide, three levels (7 m, 3.5 m, the floor): the Way In, the Fungus Garden (glowcaps), the
     Larder (leaves), the Nursery (eggs + larvae, drawn), the Midden, the Queen's Chamber at the bottom.
   NOT YET / NEEDS A MODEL: eggs, larvae and honey drips as models (drawn shapes stand in), webs, giant leaves. */
'use strict';
const HONEY = 0xe8b040, BARK = 'wood', BARKT = 0x6a4c34, HEX = 'urban:TileHexagons3a', WAX = 0xe0a440, EARTH = 'dirt_2';
const HIVE = 'site_prebuilt_gobekli_hive', NEST = 'site_prebuilt_gobekli_nest', OUT = 'site_prebuilt_gobekli_ow_bugs';
/* THE TREE in metres round its middle (a corner: squares 41/42 x 5/6) */
const SHD = 13.125, SHR = 6.125, TRUNK = 7;
const SHELVES = [[0, 1, 3.5], [-1, 0, 7], [0, -1, 10.5], [1, 0, 14]];    // [dx, dz] (out from the trunk), the top
const tree = ctx => ({ X: ctx.gx(ctx.A.tree.x), Z: ctx.gz(ctx.A.tree.y) });
const NESTDOOR = ctx => ({ x: ctx.gx(ctx.A.anthill.x - 5), z: ctx.gz(ctx.A.anthill.y) });

exports.build = ctx => {
    const { A, C, feat, look, stair, cx, cz, gx, gz } = ctx, { X, Z } = tree(ctx), r2 = ctx.r2;
    /* THE TRUNK: a column you go round (never climbed but by the root stair) */
    feat({ k: 'plateau', x: X, z: Z, r: TRUNK, h: 48, edge: 0.05 });
    /* THE ROOT SHELVES + THE STAIR between them (round the trunk south, west, north, east) */
    SHELVES.forEach((s, i) => feat({ k: 'plateau', x: r2(X + s[0] * SHD), z: r2(Z + s[1] * SHD), r: SHR, h: s[2], edge: 0.05 }));
    for (let i = 0; i < 3; i++) { const a = SHELVES[i], b = SHELVES[i + 1], ax = X + a[0] * SHD, az = Z + a[1] * SHD, bx = X + b[0] * SHD, bz = Z + b[1] * SHD, L = Math.hypot(bx - ax, bz - az), ux = (bx - ax) / L, uz = (bz - az) / L, e = SHR - 0.8;
        stair(ax + ux * e, az + uz * e, bx - ux * e, bz - uz * e, 3.5, a[2], b[2], 'wood_planks'); }
    /* the first flight: up from the ground west of the south shelf */
    { const sx = X, sz = Z + SHD + 2.3; stair(sx - 14.5, sz, sx - SHR + 0.8, sz, 3.5, ctx.heightAt(A.tree.x - 4, A.tree.y + 4), 3.5, 'wood_planks'); }
    /* the tree to the eye: the flared trunk in bark, its furrows, the bough out east, the canopy */
    look('tree:trunk', X, Z, 0, a => {
        const prof = [[-0.3, 10.4], [2.6, 7.5], [8, 7.05], [16, 6.6], [24, 6.0], [32, 5.2], [38, 4.4]];
        for (let i = 0; i < prof.length - 1; i++) a.cyl(0, prof[i][0], 0, prof[i][1], prof[i + 1][0] - prof[i][0] + 0.02, BARK, BARKT, { r2: prof[i + 1][1], seg: 24 });
        for (let k = 0; k < 12; k++) { const t = k * Math.PI / 6 + 0.13; a.box(Math.cos(t) * 6.75, 0, Math.sin(t) * 6.75, 1.1, 9 + (k % 3) * 2.5, 1.1, BARK, 0x4e3624, { ry: Math.round(-t * 180 / Math.PI) }); }
        /* the roots: low buttresses between the shelves (under the stairs' line they stay below the treads) */
        for (let k = 0; k < 4; k++) { const t = (k + 0.5) * Math.PI / 2; a.box(Math.cos(t) * 9.6, 0, Math.sin(t) * 9.6, 5.8, 1.2, 1.4, BARK, 0x5a4030, { ry: Math.round(-t * 180 / Math.PI) }); }
        /* the boughs: east to the hive, and three more */
        [[0, 29.5, 24, 2.6], [Math.PI * 0.75, 33, 14, 2.2], [Math.PI * 1.3, 35, 13, 2.2], [Math.PI * 1.7, 31, 12, 2.0], [Math.PI * 0.3, 36, 12, 2.0], [Math.PI * 1.05, 30, 12, 2.0]].forEach(q => { const t = q[0], L = q[2];
            a.box(Math.cos(t) * (3.5 + L / 2), q[1], Math.sin(t) * (3.5 + L / 2), L, q[3], q[3], BARK, BARKT, { ry: Math.round(-t * 180 / Math.PI) }); });
        /* the canopy: leaf domes, 38 to 52 m */
        for (let i = 0; i < 26; i++) { const t = i * 2.39996, rr = i < 1 ? 0 : 6 + (i % 4) * 4.2, r = 6.5 - (i % 3) * 1.2, y = 34 + (i % 5) * 2.6 - (rr > 14 ? 2.5 : 0), px = Math.cos(t) * rr + (rr > 0 && Math.cos(t) > 0.5 ? 4 : 0), pz = Math.sin(t) * rr;   /* leaf clumps: a dome on a darker underside */
            a.cyl(px, y - r * 0.55, pz, r * 0.45, r * 0.56, 'leaves', 0x3e6a2a, { r2: r, seg: 14 }); a.dome(px, y, pz, r, r * 0.85, 'leaves', 0x5e9440); }
    }, 0);
    /* the shelves to the eye: bracket fungus round each, the treads of bark */
    SHELVES.forEach((s, i) => look('tree:shelf:' + i, X + s[0] * SHD, Z + s[1] * SHD, 0, a => {
        a.cyl(0, -0.3, 0, SHR + 3.4, Math.min(2.5, s[2]) + 0.3, BARK, 0x5e4430, { r2: SHR + 0.15, seg: 22 }); if (s[2] > 2.5) a.cyl(0, 2.48, 0, SHR + 0.15, s[2] - 2.44, BARK, 0x5e4430, { seg: 22 });
        a.cyl(0, s[2] - 0.35, 0, SHR + 1.1, 0.4, 'mushroom', 0xe8d0a8, { r2: SHR + 0.2, seg: 22 });
        for (let k = 0; k < 5; k++) { const t = k * 1.25 + i; a.cyl(Math.cos(t) * (SHR + 0.3), s[2] * (0.25 + 0.15 * (k % 3)), Math.sin(t) * (SHR + 0.3), 1.2, 0.35, 'mushroom', 0xd8b890, { r2: 0.4, seg: 10 }); }
    }, 0));
    /* THE HIVE: the great comb hanging off the east bough, over the plot line; its door is on the east shelf */
    { const hx = X + SHD + SHR + 6.5, prof = [[9, 2.2], [10.5, 4.4], [13, 5.6], [16, 5.9], [19, 5.4], [22, 4.4], [24.5, 3.0], [26, 1.6]];
      look('hive', hx, Z, 0, a => {
          for (let i = 0; i < prof.length - 1; i++) a.cyl(0, prof[i][0], 0, prof[i][1], prof[i + 1][0] - prof[i][0] + 0.02, HEX, i % 2 ? 0xffd468 : 0xffc850, { r2: prof[i + 1][1], seg: 24, glow: 0.18 });
          a.cyl(0, 26, 0, 1.6, 4.5, BARK, BARKT, { r2: 1.4, seg: 10 });
          a.cyl(-5.6, 13.6, 0, 1.5, 2.9, 'dirt_4', 0x140c04, { seg: 12 }); a.box(-4.6, 13.6, 0, 3.2, 0.25, 3.4, 'wood_planks', 0x8a6a40);   // the hive's mouth, facing the shelf, a lip of wax to step onto
          for (let k = 0; k < 6; k++) a.cyl(-1.5 + k * 0.7, 8.4 - (k % 3) * 0.5, -1 + (k % 2) * 1.6, 0.18, 0.9, 'desert', HONEY, { r2: 0.02, glow: 0.35 });   // honey drips (drawn)
      }, 0); }
    /* THE HONEYCOMB: the comb fallen from the hive, wax cells on every other square */
    { const c = A.comb, cells = [];
      for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) { if ((dx + dy) & 1 || Math.hypot(dx, dy) > 4.3 || (dx === 0 && Math.abs(dy) < 2) || (dy === 0 && Math.abs(dx) < 2)) continue; cells.push([c.x + dx, c.y + dy, 1.2 + ((dx * 7 + dy * 13 + 40) % 3) * 0.7]); }
      cells.forEach(q => { feat({ k: 'plateau', x: cx(q[0]), z: cz(q[1]), r: 1.45, h: q[2], edge: 0.05 }); ctx.taken.add(q[0] + ':' + q[1]); });
      look('comb', cx(c.x), cz(c.y), 0, a => cells.forEach(q => { const px = (q[0] - c.x) * C, pz = (q[1] - c.y) * C, pts = []; for (let i = 0; i < 6; i++) pts.push([ctx.r2(px + 1.72 * Math.cos(i * Math.PI / 3)), ctx.r2(pz + 1.72 * Math.sin(i * Math.PI / 3))]);
          a.P.push({ s: 'poly', pts, p: [0, 0, 0], h: q[2] + 0.04, key: HEX, tint: HONEY, keyTop: HEX, tintTop: 0xffd870 }); })); }
    /* THE ANTHILL's way in: a dark mouth in the mound's west foot (+ three drawn ones round it) */
    { const D = NESTDOOR(ctx); look('anthill:mouth', D.x, D.z, 0, a => { a.dome(1.2, -0.4, 0, 2.6, 3.2, 'dirt_4', 0x080502); [[-0.2, -2.6], [-0.2, 2.6], [0.6, -1.6], [0.6, 1.6]].forEach(q => a.dome(q[0], -0.3, q[1], 1.3, 1.6, EARTH, 0x6a4a2c)); }, ctx.heightAt(A.anthill.x - 5, A.anthill.y));
      look('anthill:clods', gx(A.anthill.x), gz(A.anthill.y), 0, a => { for (let i = 0; i < 22; i++) { const t = i * 2.39996, rr = 3 + (i % 6) * 2.6, qx = Math.cos(t) * rr, qz = Math.sin(t) * rr; if (qx < -11 && Math.abs(qz) < 5) continue;
          a.dome(qx, ctx.heightAt(A.anthill.x + qx / C, A.anthill.y + qz / C) - 0.25, qz, 1.1 + (i % 3) * 0.5, 0.9 + (i % 4) * 0.35, 'dirt_4', i % 2 ? 0x5a3e24 : 0x4a3220); } }, 0);
      look('anthill:mouths', gx(A.anthill.x), gz(A.anthill.y), 0, a => [[0, -12, 0], [10, 6, 250], [4, 12, 180]].forEach(q => a.dome(q[0], ctx.heightAt(A.anthill.x + q[0] / C, A.anthill.y + q[1] / C) - 0.5, q[1], 1.4, 1.2, 'dirt_4', 0x0e0a06)), 0); }
};
exports.dress = ctx => {
    const { A, C, P, Pm, dec, tree: plant, cx, cz, gx, gz } = ctx, { X, Z } = tree(ctx);
    Pm('anthill', gx(A.anthill.x), gz(A.anthill.y), { h: 2.6, y: A.anthill.h - 0.2 });
    /* THE COLUMN: from the flowers down the trail, along the road, into the hill */
    for (let y = 12; y < 28; y += 2) Pm(y % 4 === 0 ? 'ant_leaf' : 'ant', cx(57) - 0.6 + (y % 3) * 0.4, cz(y), { h: 0.9, face: 180 });
    for (let x = 57; x < 61; x += 1) Pm(x % 2 ? 'ant_leaf' : 'ant', cx(x), cz(29) + (x % 2) * 0.6, { h: 0.9, face: 90 });
    [[62, 9], [60, 4], [66, 25], [70, 31], [63, 34], [59, 33]].forEach((q, i) => dec(i % 2 ? 'ant' : 'ant_leaf', q[0], q[1], { h: 0.9 }));
    /* THE FLOWER FIELD */
    { const f = A.flowers, K = ['fae_flower', 'fae_flower_pink', 'fae_flower_violet', 'fae_flower_blue', 'fae_flower_gold'];
      for (let y = f[1]; y < f[3]; y++) for (let x = f[0]; x < f[2]; x++) { if ((x + y) % 2 === 0 && (x * 3 + y * 5) % 7 !== 0 && x !== 66) P(K[(x * 2 + y * 3) % 5], x, y, { h: 3.2 + ((x + y * 3) % 4) * 0.5, face: (x * 37 + y * 91) % 360 });
          else if ((x * 5 + y) % 3 === 0) dec(['fae_flower_small_pink', 'fae_flower_small_violet', 'fae_flower_small_blue'][(x + y) % 3], x, y); } }
    /* THE TALL GRASS: over your head, on every other square */
    { const t = A.tallgrass; for (let y = t[1]; y < t[3]; y++) for (let x = t[0]; x < t[2]; x++) if (ctx.cell[y][x] === 'T' && (x + y) % 2 === 0) P('reeds', x, y, { h: 2.9 + ((x * 7 + y) % 3) * 0.3, face: (x * 53 + y * 17) % 360 }); }
    /* THE BEE YARD: the hive boxes in rows, bees over them */
    for (let y = 30; y < 34; y += 2) for (let x = 39; x < 47; x += 2) P('beehive', x, y, { face: 180 });
    for (let i = 0; i < 16; i++) Pm(i % 4 === 3 ? 'bumblebee' : 'bee', cx(38 + (i * 5) % 9), cz(29 + (i * 3) % 5), { h: 0.45, y: 1.2 + (i % 5) * 0.4, face: (i * 67) % 360 });
    /* bees round the hive and up the tree */
    { const hx = X + SHD + SHR + 6.5; for (let i = 0; i < 14; i++) Pm(i % 5 === 4 ? 'bumblebee' : 'bee', hx + 7.5 * Math.cos(i * 0.9), Z + 7.5 * Math.sin(i * 0.9), { h: 0.6, y: 9 + (i % 7) * 2.2, face: (i * 50) % 360 }); }
    /* THE MEADOW (north, between the tree and the flowers) */
    for (let i = 0; i < 14; i++) Pm('butterfly', cx(49 + (i * 5) % 11), cz(1 + (i * 3) % 9), { h: 0.4, y: 0.8 + (i % 4) * 0.4, face: (i * 71) % 360 });
    for (let i = 0; i < 12; i++) dec(['fae_flower_small_pink', 'fae_flower_small_blue', 'woods_healflower'][i % 3], 49 + (i * 4) % 10, 1 + (i * 5) % 10);
    [[50, 3], [57, 10], [52, 10], [59, 2], [48, 19], [69, 26]].forEach((q, i) => P('mushroom', q[0], q[1], { h: 2.6 + (i % 3) * 0.6 })); [[51, 4], [58, 11], [53, 9], [49, 20]].forEach(q => dec('mushroom2', q[0], q[1]));
    dec('caterpillar', 54, 4, { h: 1.1 }); dec('caterpillar', 68, 14, { h: 1.1 });
    /* the honeycomb's bees, the tree's foot */
    for (let i = 0; i < 6; i++) Pm('bee', cx(A.comb.x) + 4.5 * Math.cos(i), cz(A.comb.y) + 4.5 * Math.sin(i), { h: 0.45, y: 2.5 + i * 0.4, face: (i * 50) % 360 });
    [[37, 27], [47, 22], [70, 34], [36, 20], [47, 14]].forEach((q, i) => plant(q[0], q[1], i % 2 ? 'tree_3' : 'tree_5', 7 + (i % 3)));
    P('signpost', 38, 12, { face: 0 }); P('signpost', 60, 31, { face: 270 });
};
exports.people = ctx => { const { native, sayOf, OLD } = ctx;
    native('antperson', 59, 28, 90, sayOf(OLD.ley, 'antperson')); native('mantid', 63, 20, 250); native('bee queen', 45, 5, 270); };
exports.airZones = () => [{ sx0: 36, sy0: 0, sx1: 72, sy1: 36, kind: 'spores', color: 0xf0e080, n: 80 }];

/* THE WAYS IN: free doors on this district's squares (the tool moves them with their plots and writes them on the room this district stands in) */
exports.ways = ctx => { const { X, Z } = tree(ctx), N = NESTDOOR(ctx);
    return [
        { id: 'hive', wall: 'free', x: ctx.r2(X + SHD + SHR - 1.0), z: Z, face: 270, leaf: null, way: 'open', passage: { len: 3, deep: 1.2, w: 3.5 }, label: 'BUG COLONY · THE HIVE', sub: 'THE GREAT COMB · ON THE BOUGH',
          action: { room: HIVE, at: 'out' }, desc: 'The hive hangs off the bough as big as a house. The mouth faces the shelf. It hums.' },
        { id: 'nest', wall: 'free', x: N.x, z: N.z, face: 270, leaf: null, way: 'open', passage: { len: 3, deep: 1.2, w: 3.5 }, label: 'BUG COLONY · THE ANTHILL', sub: 'THE WAY IN · DOWN INTO THE NEST',
          action: { room: NEST, at: 'out' }, desc: 'A hole in the foot of the mound, wide enough to walk into, going down. The ants go round you.' } ]; };

/* ══ THE INSIDES: two rooms of their own. A room is squares (W x D); `h[y][x]` = the floor in metres, null = solid (wax / earth up to the roof).
   The tool writes the room (its walls, roof, heights, looks, props, people, the door back) and checks every floor square is reached from the door. ══ */
const grid = (W, D) => { const h = []; for (let y = 0; y < D; y++) h.push(new Array(W).fill(null)); return h; };
const carve = (h, x0, y0, x1, y1, v, wide) => { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2 + 1;
    for (let i = 0; i <= n; i++) { const t = i / n, x = Math.round(x0 + (x1 - x0) * t), y = Math.round(y0 + (y1 - y0) * t);
        for (let j = 0; j < (wide || 1); j++) for (let k = 0; k < (wide || 1); k++) if (h[y + j] && h[y + j][x + k] === null) h[y + j][x + k] = typeof v === 'function' ? v(t) : v; } };

exports.insides = ctx => {
    const C = ctx.C, r2 = ctx.r2, out = [];
    /* ── THE HIVE: 23 x 25 squares ── */
    { const W = 23, D = 25, h = grid(W, D), MX = 11, MY = 12, HW = [1, 2, 3, 3, 3, 2, 1], looks = [], props = [], npc = [];
      const CH = [['QUEEN', 0, 0], ['NURSERY', 0, -8], ['HONEY', 0, 8], ['POLLEN', -7, -4], ['WAX', 7, -4], ['GUARD', -7, 4], ['DOOR', 7, 4]];
      const at = (sx, sy) => [r2((sx + 0.5 - W / 2) * C), r2((sy + 0.5 - D / 2) * C)];
      CH.forEach(c => { for (let dy = -3; dy <= 3; dy++) for (let dx = -HW[dy + 3]; dx <= HW[dy + 3]; dx++) h[MY + c[2] + dy][MX + c[1] + dx] = 0; });
      [[0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [1, 3], [1, 4], [2, 5], [2, 6], [3, 5], [4, 6]].forEach(q => carve(h, MX + CH[q[0]][1], MY + CH[q[0]][2], MX + CH[q[1]][1], MY + CH[q[1]][2], 0));
      for (let x = MX + 10; x < W - 1; x++) h[MY + 4][x] = 0;                                  // the Door chamber's mouth to the east wall
      /* the honey: a hollow in the Honey chamber you wade (drawn honey over it) */
      for (let dy = -1; dy <= 1; dy++) for (let dx = -2; dx <= 2; dx++) h[MY + 8 + dy][MX + dx] = -0.55;
      { const p = at(MX, MY + 8); looks.push({ id: 'hive:honey', x: p[0], z: p[1], parts: [{ s: 'cyl', p: [0, -0.24, 0], r: 8.6, h: 0.06, key: 'desert', tint: HONEY, glow: 0.45, seg: 6 }] }); }
      /* the wax: every solid square a block of the hexagon tile up to the roof (a row a part); the floors a paler tile */
      for (let y = 0; y < D; y++) { let x = 0; while (x < W) { const solid = h[y][x] === null; let e = x; while (e < W && (h[y][e] === null) === solid) e++;
          const a = at(x, y), len = e - x, mx = r2(a[0] + (len - 1) * C / 2);
          looks.push({ id: 'hive:row:' + y + ':' + x, x: mx, z: a[1], parts: solid ? [{ s: 'box', p: [0, 0, 0], size: [r2(len * C + 0.02), 10.5, r2(C + 0.02)], key: HEX, tint: 0xffd060, glow: 0.22 }] : [{ s: 'box', p: [0, 0.01, 0], size: [r2(len * C), 0.03, C], key: 'urban:TileHexagons3b', tint: 0xf2c870, sides: false }] });
          x = e; } }
      /* THE NURSERY: brood cells along the walls (capped and open, drawn) */
      { const p = at(MX, MY - 8), parts = []; for (let i = 0; i < 18; i++) { const t = i / 18 * Math.PI * 2, rr = 7.6 + (i % 2) * 1.1, pts = []; for (let k = 0; k < 6; k++) pts.push([r2(rr * Math.cos(t) + 0.9 * Math.cos(k * Math.PI / 3)), r2(rr * Math.sin(t) * 0.75 + 0.9 * Math.sin(k * Math.PI / 3))]);
          parts.push({ s: 'poly', pts, p: [0, 0, 0], h: 1.3 + (i % 3) * 0.4, key: HEX, tint: WAX, keyTop: 'desert', tintTop: i % 3 ? 0xf8e8c0 : 0xd09030 }); }
        looks.push({ id: 'hive:brood', x: p[0], z: p[1], parts }); }
      /* THE POLLEN: heaps of it */
      { const p = at(MX - 7, MY - 4); looks.push({ id: 'hive:pollen', x: p[0], z: p[1], parts: [[-3, -2, 2.2], [2.5, 1, 1.8], [-1, 3, 1.5], [3, -3, 1.4]].map(q => ({ s: 'dome', p: [q[0], 0, q[1]], r: q[2], h: q[2] * 0.7, seg: 12, key: 'desert', tint: 0xf0b820, gain: 1.6 })) }); }
      const PM = (key, sx, sy, o) => { const p = at(sx, sy); props.push(Object.assign({ key, x: r2(p[0] + ((o && o.dx) || 0)), z: r2(p[1] + ((o && o.dz) || 0)) }, o || {})); delete props[props.length - 1].dx; delete props[props.length - 1].dz; };
      /* THE WAX: candles (wax is wax) */
      PM('candleRing', MX + 7, MY - 4); PM('lit_candle', MX + 5, MY - 5); PM('lit_candle', MX + 9, MY - 3); PM('candleLine', MX + 7, MY - 6);
      /* the bees: everywhere, at every height */
      for (let i = 0; i < 40; i++) { const c = CH[i % 7]; PM(i % 6 === 5 ? 'bumblebee' : 'bee', MX + c[1] + ((i * 3) % 5) - 2, MY + c[2] + ((i * 7) % 3) - 1, { h: 0.7, y: 1.2 + (i % 6) * 1.1, face: (i * 47) % 360 }); }
      npc.push({ sq: [MX, MY - 1], face: 180, race: 'bee queen' }); npc.push({ sq: [MX - 7, MY + 5], face: 40, race: 'bee queen' });
      out.push({ id: HIVE, part: 'hive', label: 'BUG COLONY · THE HIVE', sub: 'THE QUEEN · THE BROOD · THE HONEY',
          W, D, h, wallH: 10.5, floor: 'desert', cliff: 'desert', shell: { floor: 'desert', wall: HEX, ceiling: HEX, floorColor: 0xf0c060, wallColor: WAX, ceilColor: 0xb87820 },
          mood: { lamp: 0xffc040, glow: 0xffb020, strip: 0xffe0a0, light: 0xffd890, ambient: 0.78 }, fog: { color: 0x5a3a10, density: 0.006 },
          blocks: true, door: { id: 'out', wall: 'e', sq: [W - 2, MY + 4], leaf: null, way: 'open', passage: { w: 3.5 }, label: 'BUG COLONY · THE GIANT TREE', sub: 'THE MOUTH · OUT ONTO THE SHELF', action: { room: OUT, at: 'hive' }, desc: 'Light, and the bough, and a long way down to the meadow.' },
          looks, props, npc, lines: ['“It hums.” “Everything in here hums.” “The walls hum.”', '“Six sides.” “Every room?” “Every room. Count them.”'] }); }
    /* ── THE ANT NEST: 24 x 26 squares, three levels ── */
    { const W = 24, D = 26, h = grid(W, D), looks = [], props = [], npc = [], L2 = 7, L1 = 3.5, L0 = 0;
      const at = (sx, sy) => [r2((sx + 0.5 - W / 2) * C), r2((sy + 0.5 - D / 2) * C)];
      const room = (cx0, cy0, rx, ry, v) => { for (let y = 1; y < D - 1; y++) for (let x = 1; x < W - 1; x++) if (((x + 0.5 - cx0) / rx) ** 2 + ((y + 0.5 - cy0) / ry) ** 2 <= 1) h[y][x] = v; };
      const RM = { way: [12, 2.5, 3.2, 2.2, L2], fungus: [19.5, 7, 4, 3, L2], larder: [5, 10, 3.6, 3, L1], nursery: [12, 13.5, 4.2, 3, L1], midden: [19.5, 17, 3.6, 2.6, L1], queen: [11.5, 22, 6.5, 2.8, L0] };
      Object.keys(RM).forEach(k => room(...RM[k]));
      const tun = (x0, y0, x1, y1, a, b) => carve(h, x0, y0, x1, y1, t => r2(a + (b - a) * t), 2);
      tun(13, 4, 18, 6, L2, L2); tun(10, 4, 5, 8, L2, L1); tun(7, 11, 9, 13, L1, L1); tun(19, 10, 19, 14, L2, L1); tun(15, 14, 17, 16, L1, L1); tun(4, 13, 7, 20, L1, L0); tun(20, 19, 16, 22, L1, L0);
      for (let y = 0; y < 2; y++) h[y][12] = h[y][11] = L2;                                     // the way in: up to the door
      /* the eggs + the larvae (drawn: white, in heaps), the fungus, the leaves, the midden, the queen */
      const eggs = (k, sx, sy, n, s) => { const p = at(sx, sy), parts = []; for (let i = 0; i < n; i++) { const t = i * 2.4, rr = 0.6 + (i % 5) * 0.5; parts.push({ s: 'dome', p: [r2(rr * Math.cos(t)), 0, r2(rr * Math.sin(t))], r: s, h: s * 1.9, seg: 10, key: 'marble_light', tint: i % 4 ? 0xf6f0dc : 0xe8dcb0 }); }
          looks.push({ id: 'nest:' + k, x: p[0], z: p[1], parts }); };
      eggs('eggs:1', 10, 13, 14, 0.38); eggs('eggs:2', 14, 14, 10, 0.38); eggs('larvae', 12, 15, 7, 0.6); eggs('eggs:queen', 14, 22, 12, 0.4);
      const PM = (key, sx, sy, o) => { const p = at(sx, sy); props.push(Object.assign({ key, x: p[0], z: p[1] }, o || {})); };
      [[17, 6], [21, 5], [20, 8], [18, 8], [22, 7]].forEach((q, i) => PM(i % 2 ? 'woods_glowcap' : 'fae_mushroom', q[0], q[1], { h: 1.6 + (i % 3) * 0.5 })); PM('mushroom_lamp', 19, 6); PM('mushroom2', 21, 9);
      [[4, 9], [5, 11], [6, 9], [3, 10], [6, 11]].forEach((q, i) => PM('ant_leaf', q[0], q[1], { h: 1.2, face: i * 70 }));
      [[19, 17], [21, 16], [18, 18]].forEach((q, i) => PM(['skull_pile', 'fallen_log', 'stump'][i], q[0], q[1], { face: i * 90 }));
      PM('ant_queen', 10, 22, { h: 3.4, face: 0 });
      [[12, 6], [8, 7], [6, 16], [11, 12], [18, 12], [16, 15], [19, 20], [9, 20], [13, 21], [5, 19], [15, 3], [20, 6]].forEach((q, i) => PM(i % 3 ? 'ant' : 'ant_leaf', q[0], q[1], { h: 0.9, face: (i * 73) % 360 }));
      [[2, 9], [21, 18], [5, 23], [18, 23]].forEach(q => PM('psx_cobweb_1', q[0], q[1], { y: 3.5 }));
      npc.push({ sq: [13, 20], face: 200, race: 'antperson' }); npc.push({ sq: [17, 7], face: 120, race: 'antperson' });
      out.push({ id: NEST, part: 'nest', label: 'BUG COLONY · THE ANT NEST', sub: 'UNDER THE ANTHILL · THE QUEEN\'S CHAMBER',
          W, D, h, wallH: 14, floor: EARTH, cliff: 'dirt_3', shell: { floor: EARTH, wall: 'dirt_3', ceiling: 'dirt_3', floorColor: 0x8a6a48, wallColor: 0x6a4e34, ceilColor: 0x3a2a1c },
          mood: { lamp: 0xc0ff90, glow: 0x9fe870, strip: 0xd0b080, light: 0xe8d0b0, ambient: 0.62 }, fog: { color: 0x2a1e12, density: 0.012 },
          door: { id: 'out', wall: 'n', sq: [12, 0], leaf: null, way: 'open', passage: { w: 7 }, label: 'BUG COLONY · THE ANTHILL', sub: 'UP · OUT OF THE MOUND', action: { room: OUT, at: 'nest' }, desc: 'Daylight at the top of the slope, and the smell of grass.' },
          looks, props, npc, lines: ['“Left at the leaves, down past the eggs.” “And then?” “And then she sees you.”', '“They farm.” “Ants farm?” “Mushrooms. Better than you do.”'] }); }
    return out;
};
