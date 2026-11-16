/* THE DESERT · GIZA (district G, 16 plots) — the district file of `node bake-desert.js` (repo tooling, never uploaded).
   One thread = this one file. The tool, layout.json, the Highway and every shared piece belong to the tool's row on the board (docs/notes/claims.md).

   THE PLOTS (ids + names: docs/areas/desert/layout.json; a plot is 12 x 12 squares of 3.5 m):
     P08-08  The Causeway                   home squares x 48..60 · y 48..60
     P09-08  The Sphinx                     home squares x 60..72 · y 48..60
     P10-08  The Dig                        home squares x 72..84 · y 48..60
     P11-08  The Canyon Mouth               home squares x 84..96 · y 48..60
     P08-09  The Obelisks                   home squares x 48..60 · y 60..72
     P09-09  Menkaure                       home squares x 60..72 · y 60..72
     P10-09  Khafre                         home squares x 72..84 · y 60..72
     P11-09  The Robbers' Tunnel            home squares x 84..96 · y 60..72
     P08-10  The Oasis                      home squares x 48..60 · y 72..84
     P09-10  The Tomb Door                  home squares x 60..72 · y 72..84
     P10-10  The Great Pyramid, north-west  home squares x 72..84 · y 72..84
     P11-10  The Great Pyramid, north-east  home squares x 84..96 · y 72..84
     P08-11  The Sand Sea                   home squares x 48..60 · y 84..96
     P09-11  The Sand Sea, east             home squares x 60..72 · y 84..96
     P10-11  The Great Pyramid, south-west  home squares x 72..84 · y 84..96
     P11-11  The Great Pyramid, south-east  home squares x 84..96 · y 84..96

   WHAT STANDS HERE TODAY:
   - THE GREAT PYRAMID (P10-10, P11-10, P10-11, P11-11): 77 m at the foot, four walked tiers to 14 m, the North Stair, a gold capstone. A tier
     = a `plateau` + a `bricks_1` box in the one `arch` row des:giza:look. Three doors into its inside: `pyramid` (north face), `tombside`
     (west face) and the hidden `cut`. Room 444's bay door (the Tomb Door, data.js siteRooms.entry.prebuilt_giza) is in its west face.
   - KHAFRE (P10-09): 35 m, three tiers, stair on the west. MENKAURE (P09-09): 21 m, two tiers, stair on the north.
   - THE SPHINX (P09-08): plateaus + skin, facing east, not climbed. THE OBELISKS (P08-09). THE CAUSEWAY (P08-08): the way in from the
     Giza Road at the Highway's end (the road is the tool's).
   - THE DIG (P10-08): two trenches a metre down, a camp, a sarcophagus. THE OASIS (P08-10): a pool, six palms.
   - THE SAND SEA (P08-11, P09-11): a half-buried sarcophagus, skulls, stones. THE ROBBERS' TUNNEL (P11-09): link `gobekli_giza` on the east wall.
   - THE INSIDE is this file's too (rooms(kit) below): INSIDE THE GREAT PYRAMID (14 x 14 squares, three levels, the door to the Turning Tomb).
   - People (lines read from the old `site_prebuilt_giza_plateau` literal, which must stay): anubis, annunaki, skeleton, conspiracy theorist, mummy, djinn.

   KNOWN MISSING OR WRONG (from docs/notes/areas-complexes.md "THE DESERT ON PLOTS", "THE DESERT'S INSIDES", "THE LOOK PASS", "THE HIGHWAY"):
   - THE DIG's two trenches have no ramp (a 1 m step down). THE CANYON MOUTH (P11-08) opens on sand: the canyon to Western Town was cut by the move.
   - The Sphinx is plateaus, boxes and a drum. Khafre and Menkaure have no inside and nothing on top. No temple, no causeway paving beyond the
     layout's stone squares, no camels (the packs have none).
   - The pyramid's inside: the Turning Tomb door was seen, not walked through. The first views of a probe run in there come out black.
   - Rows outside this file that must agree with it: `links.gobekli_giza.b`, `siteRooms.entry.prebuilt_giza` (the tool prints their places as "ends").
   - Not seen on screen since the blocks were moved apart (the same rows, shifted). Fights use the old plateau's table everywhere (data.js HQ_AREA_ENCOUNTERS).
   - No door leaf drew in the probe on any swinging door ("THE LOOK PASS": shared city-door code or the probe; check on a real machine first).

   THE HOOKS (bake-desert.js "THE DISTRICT FILES" has the whole list of what ctx holds; each hook is optional):
     buildings(ctx)  the walk-in / shut buildings: building(id, [sx0, sy0, sx1, sy1, side], h, opts, parts) -> a handle (at, face, cx, cz)
     furnish(ctx)    what stands inside them: put(handle, key, lx, lz, opts), in the building's own frame
     ground(ctx)     everything on the open ground: P / Pm / dec (props), feat (terrain rows), pen, native (people), line (flat paint),
                     setPaint(sx, sy, sheet) (one of the room's seven ground sheets on a square of this block)
     pieces(ctx)     late pieces, after every district's ground
     doors(ctx)      the doors to other rooms (doors.push)
     dice            this file's own dice (ctx.rnd / ctx.dec): another district's change never re-throws them
     rooms(kit)      the rooms behind this district's doors, for bake-desert-insides.js (its kit: mk, the sheets)
   THE FRAME: this file is written in the FIRST BUILD's squares (sx 0..96 west to east, sy 0..96 north to south; gx = a square's west / north
   line in metres, gc = its middle). The tool moves every row this file makes to where the block stands in the 144-square room:
   room square = home square + (48, 48). Keep to your own block; the tool warns about a row outside it.
   REBAKE: node bake-desert.js && node bake-desert-insides.js   (--dry-run prints the counts). Rules: docs/notes/areas-complexes.md "THE DESERT, THE DISTRICT FILES". */
'use strict';
let C, gx, gc, r2, feat, props, doors, npc, count, line, setRect, pen, building, put, SOLID, P, Pm, dec, native, rnd, sayOf, O_GIZA, O_GATE, O_LINE, O_CARN, U, WD, WD2, SHG, FLR, GLS, RIB, COR, CONC, PLAS;
const bind = ctx => ({ C, gx, gc, r2, feat, props, doors, npc, count, line, setRect, pen, building, put, SOLID, P, Pm, dec, native, rnd, sayOf, O_GIZA, O_GATE, O_LINE, O_CARN, U, WD, WD2, SHG, FLR, GLS, RIB, COR, CONC, PLAS } = ctx);
exports.dice = 623573185;

exports.ground = ctx => { bind(ctx);
    const STONE = 0xd8c49a, ST2 = 0xc8b088, PYR = [];
    function tier(cx, cz, w, h0, h1) { feat({ k: 'plateau', x: cx, z: cz, w, d: w, h: h1, edge: 0.3 }); PYR.push({ s: 'box', p: [cx, h0, cz], size: [r2(w + 0.06), r2(h1 - h0 + 0.03), r2(w + 0.06)], key: 'bricks_1', tint: h1 > 7 ? ST2 : STONE, uv: [3.5, 1.75] }); }
    const stair = (x0, z0, x1, z1, h0, h1) => feat({ k: 'ramp', x0, z0, x1, z1, w: 7, h0, h1, stairs: true, built: true, edge: 0.3, key: 'bricks_1' });
    /* THE GREAT PYRAMID on four plots: 77 m at the foot, four tiers to 14 m, THE NORTH STAIR up its north face */
    { const cx = gx(84), cz = gx(84); [[77, 3.5], [56, 7], [35, 10.5], [14, 14]].forEach((t, i) => tier(cx, cz, t[0], i * 3.5, t[1]));
      stair(cx, gx(69), cx, gx(73), 0, 3.5); stair(cx, gx(73), cx, gx(76), 3.5, 7); stair(cx, gx(76), cx, gx(79), 7, 10.5); stair(cx, gx(79), cx, gx(82), 10.5, 14);
      PYR.push({ s: 'roof', form: 'pyramid', p: [cx, 14.03, cz], size: [7, 4.2, 7], key: 'bricks_1', tint: 0xe8c860, roof: true });                         // the capstone
      P('brazier', 82, 70, {}); P('brazier', 85, 70, {}); P('obelisk', 81, 72, { h: 5 }); P('obelisk', 86, 72, { h: 5 }); }
    /* KHAFRE: 35 m, three tiers, its stair on the west face */
    { const cx = gx(78), cz = gx(65); [[35, 3.5], [21, 7], [7, 10.5]].forEach((t, i) => tier(cx, cz, t[0], i * 3.5, t[1]));
      stair(gx(71), cz, gx(73), cz, 0, 3.5); stair(gx(73), cz, gx(75), cz, 3.5, 7); stair(gx(75), cz, gx(77), cz, 7, 10.5); }
    /* MENKAURE: 21 m, two tiers, its stair on the north face */
    { const cx = gx(66), cz = gx(65); tier(cx, cz, 21, 0, 3); tier(cx, cz, 7, 3, 6); stair(cx, gx(60), cx, gx(62), 0, 3); stair(cx, gx(62), cx, gx(64), 3, 6); }
    /* THE SPHINX, facing east: the body, the head, the two paws */
    { const z = gx(51); feat({ k: 'plateau', x: gx(66), z, w: 28, d: 10.5, h: 3.5, edge: 0.3 }); feat({ k: 'plateau', x: gx(69), z, r: 4.4, h: 8.75, edge: 0.3 });
      PYR.push({ s: 'box', p: [gx(66), 0, z], size: [28.06, 3.53, 10.56], key: 'bricks_1', tint: STONE, uv: [3.5, 1.75] }, { s: 'cyl', p: [gx(69), 3.5, z], r: 4.45, h: 5.28, seg: 10, key: 'bricks_1', tint: ST2, uv: 1.75 },
          { s: 'box', p: [gx(69) + 4.2, 4.6, z], size: [1.2, 3.2, 5.6], key: 'bricks_1', tint: STONE }, { s: 'box', p: [gx(69), 8.78, z], size: [7.4, 1.4, 9.4], key: 'bricks_1', tint: 0xc09858 });   // the face, the headdress
      for (const s of [-1, 1]) { feat({ k: 'plateau', x: gx(71.5), z: r2(z + s * 3.5), w: 10.5, d: 3.0, h: 1.75, edge: 0.2 }); PYR.push({ s: 'box', p: [gx(71.5), 0, r2(z + s * 3.5)], size: [10.56, 1.78, 3.06], key: 'bricks_1', tint: STONE }); }
      setRect(62, 49, 74, 53, 'B'); P('brazier', 75, 49, {}); P('brazier', 75, 52, {}); }
    feat({ k: 'arch', id: 'des:giza:look', x: 0, z: 0, parts: PYR });
    [[50, 62], [57, 62], [50, 69], [57, 69]].forEach(q => P('obelisk', q[0], q[1], {})); P('brazier', 52, 65, {}); P('brazier', 55, 65, {}); P('signpost', 54, 55, { face: 90 });
    /* THE DIG: two trenches a level down, the camp */
    feat({ k: 'plateau', x: gx(76.5), z: gc(50), w: 17.5, d: 3.5, h: -1, sink: true, edge: 0.3 }); feat({ k: 'plateau', x: gx(78.5), z: gc(56), w: 17.5, d: 3.5, h: -1, sink: true, edge: 0.3 });
    P('campfire', 80, 53, {}); Pm('camping_tent', gc(82), gc(52), { face: 240 }); Pm('camping_tent', gc(82), gc(55), { face: 280 }); dec('cardboard_boxes', 78, 53); dec('cardboard_boxes', 77, 58); P('sarcophagus', 80, 58, { face: 60 }); dec('paper_sheet', 79, 54, { y: 0.01 });
    dec('psx_wooden_crate_2', 75, 52); P('trap_sarcophagus_box', 78, 56, { y: -1, face: 90 });
    /* THE OASIS */
    feat({ k: 'pool', x: gx(53.5), z: gx(78.5), r: 8.5, rz: 7.5, y: -0.25, depth: 1.0, key: 'water', bank: 1.6 });
    [[50, 76, 4.6], [56, 77, 5.0], [51, 81, 4.4], [55, 81, 4.8], [53, 75, 5.2], [58, 80, 4.2]].forEach(q => feat({ k: 'tree', x: gc(q[0]), z: gc(q[1]), kind: 'palm', h: q[2], r: 1.3 }));
    dec('sea_chest', 57, 82);
    /* THE SAND SEA, the Robbers' Tunnel, the Tomb Door */
    P('sarcophagus', 54, 89, { face: 20, y: -0.3 }); dec('skull_pile', 62, 90); dec('skull', 50, 91); P('cave_stone', 66, 88, {}); P('cave_stone', 58, 92, {});
    dec('skull_pile', 92, 66); dec('paper_sheet', 91, 68, { y: 0.01 }); P('brazier', 71, 77, {}); P('brazier', 71, 80, {}); P('signpost', 70, 82, { face: 270 });
    native('anubis', 76, 54, 200, sayOf(O_GIZA, 'anubis')); native('annunaki', 86, 70, 270, sayOf(O_GIZA, 'annunaki')); native('skeleton', 79, 55, 300, sayOf(O_GIZA, 'skeleton'));
    native('conspiracy theorist', 91, 70, 40, sayOf(O_GIZA, 'conspiracy theorist')); native('mummy', 69, 80, 270); native('djinn', 55, 84, 0);
};

/* THE DESERT'S INSIDES (2026-11-15): the three ways into the Great Pyramid's inside. The entrance in the north face beside the North Stair, the
   slab beside the Tomb Door in the west face (Room 444's own door stays where it is), the Robbers' Cut (hidden) further north. */
exports.doors = ctx => { bind(ctx);
    const fx = r2(gx(73) - 0.45), nz = r2(gx(73) - 0.45);
    doors.push({ id: 'pyramid', wall: 'free', x: gc(87), z: nz, face: 0, leaf: 'leaf_frame_only', label: 'THE GREAT PYRAMID', sub: 'THE NORTH FACE · THE WAY IN', action: { room: 'site_prebuilt_giza_pyramid', at: 'north' },
        desc: 'A square mouth in the north face, beside the stair, two courses up from the sand. The air that comes out of it is older than the stair.' });
    doors.push({ id: 'tombside', wall: 'free', x: fx, z: gc(81), face: 270, leaf: 'leaf_frame_only', label: 'THE GREAT PYRAMID', sub: 'THE WEST FACE · BEHIND THE TOMB DOOR', action: { room: 'site_prebuilt_giza_pyramid', at: 'tomb' },
        desc: 'A casing stone that turns on its middle, a few steps south of the Tomb Door.' });
    doors.push({ id: 'cut', wall: 'free', x: fx, z: gc(75), face: 270, secret: true, leaf: 'leaf_frame_only', label: 'A DRAUGHT', sub: 'THE ROBBERS’ CUT · A ROUGH WAY IN', action: { room: 'site_prebuilt_giza_pyramid', at: 'cut' },
        desc: 'A hole hacked through the casing stones at the height of a crouch. The chisel marks all point inward.', draft: true });
};

/* ════ THE INSIDE (bake-desert-insides.js calls rooms(kit); notes: areas-complexes.md "THE DESERT'S INSIDES") ════ */
exports.rooms = kit => { const { mk, r2, C, T, DW, DH, U, GLS, CHAIN, GRILL, STEEL, RIB, PLAS, TILE, FIB, CONC, STONE, CAT } = kit;
    /* ════ INSIDE THE GREAT PYRAMID (14 x 14): the room is carved out of one mass. `#` = stone to the roof; the levels are
       p = the Pit (0 m), 1 = level 1 (3.5 m: the entrance, the passages, the Queen's Chamber), 2 = level 2 (10.5 m: the Antechamber, the King's
       Chamber), 3 = the Relieving Chambers (14 m, the hidden climb over the King); D = the Descent's slope, G = the Grand Gallery's ════ */
    const PY = mk(14, 14);
    { const R = PY, L1 = 3.5, L2 = 10.5, L3 = 14, TOP = 18;
      const MAP = [
          '######11######',
          '######11######',
          '11111111##11##',
          '######111111##',
          '#1111#111111##',
          '#1111111##GG##',
          '#1111#DD##GG##',
          '##1###DD##GG##',
          '111###DD##GG##',
          '####ppppppGG##',
          '####ppppppGG##',
          '#####2222222##',
          '#33332222222##',
          '#33332222222##',
      ].map(s => s.split(''));
      if (MAP.some(r => r.length !== 14) || MAP.length !== 14) throw new Error('the pyramid map is not 14 x 14');
      /* the Descent leaves level 1 at v 6 and reaches the Pit's floor at v 9; the Gallery climbs from v 5 to v 11 */
      const lvl = ch => ch === 'p' ? 0 : ch === '1' ? L1 : ch === '2' ? L2 : ch === '3' ? L3 : null;
      const rects = (test, cb) => { const used = MAP.map(r => r.map(() => 0));
          for (let y = 0; y < 14; y++) for (let x = 0; x < 14; x++) { if (!test(MAP[y][x]) || used[y][x]) continue; let w = 1; while (x + w < 14 && !used[y][x + w] && test(MAP[y][x + w])) w++;
              let h = 1; rows: while (y + h < 14) { for (let i = 0; i < w; i++) if (used[y + h][x + i] || !test(MAP[y + h][x + i])) break rows; h++; }
              for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) used[y + j][x + i] = 1; cb(x, y, w, h); } };
      const slab = (x, y, w, h, hh) => R.F.push({ k: 'plateau', x: R.X(x + w / 2), z: R.Z(y + h / 2), w: w * C, d: h * C, h: hh, edge: 0.05 });
      rects(ch => ch === '#', (x, y, w, h) => slab(x, y, w, h, TOP));
      for (const ch of ['1', '2', '3']) rects(c => c === ch, (x, y, w, h) => slab(x, y, w, h, lvl(ch)));
      /* THE DESCENT: level 1 down to the Pit, one slope two squares wide (the mass under it is the slope itself) */
      R.F.push({ k: 'ramp', x0: R.X(7), z0: R.Z(9), x1: R.X(7), z1: R.Z(6), w: 7.6, h0: 0, h1: L1, stairs: true, built: true, edge: 0.05, key: STONE });
      /* THE GRAND GALLERY: level 1 up to level 2, a ramp two squares wide and six long under a corbelled roof 8 m over it */
      R.F.push({ k: 'ramp', x0: R.X(11), z0: R.Z(5), x1: R.X(11), z1: R.Z(11), w: 7.6, h0: L1, h1: L2, stairs: true, built: true, edge: 0.05, key: STONE });
      /* the roofs: every passage and chamber under its own stone ceiling */
      const roof = (u0, v0, u1, v1, y, tint) => { R.ceil(u0, v0, u1, v1, y, STONE, tint != null ? tint : 0xb8a680); R.P[R.P.length - 1].glow = 0.25; };   // (a roof's underside gets no light from the room's lamps: lit a little by itself)
      roof(6, 0, 8, 6, L1 + 3.5); roof(0, 2, 6, 3, L1 + 3.2, 0x8a7a60); roof(8, 2, 12, 5, L1 + 3.5); roof(5, 5, 6, 6, L1 + 3.2); roof(0, 8, 3, 9, L1 + 3.5); roof(2, 7, 3, 8, L1 + 3.2);
      roof(6, 6, 8, 9, L1 + 3.5); roof(4, 9, 10, 11, 5.25, 0x8a7a60);
      /* the Queen's Chamber: a gabled roof */
      R.P.push({ s: 'roof', form: 'gable', p: [R.X(3), L1 + 4.2, R.Z(5.5)], size: [14.2, 2.4, 10.7], key: STONE, tint: 0xc8b890, ds: true });
      /* the Gallery's corbelled roof: three steps closing in, 8 m over the slope */
      for (let i = 0; i < 6; i++) { const y = L1 + (L2 - L1) * (i + 0.5) / 6 + 8; R.box(11, 5.5 + i, y, 7.2, 0.3, 3.6, STONE, 0xd8c080); for (const s of [-1, 1]) { R.box(11 + s * 0.8, 5.5 + i, y - 1.2, 1.4, 1.2, 3.6, STONE, 0xc8b070); R.box(11 + s * 0.92, 5.5 + i, y - 2.4, 0.56, 1.2, 3.6, STONE, 0xb8a060); } }
      roof(10, 11, 12, 14, L2 + 3.5, 0xd8c080); roof(5, 11, 10, 14, L2 + 5.6, 0xd8c080); roof(1, 12, 5, 14, L3 + 2.4, 0x8a7a60);
      /* THE ANTECHAMBER's three stone gates (each a wall across it with one doorway), and the way into the King's Chamber */
      const st = { key: STONE, tint: 0xc8b070, frame: 0x6a5a40, base: L2 };
      R.wall('u', 11, 10, 12, Object.assign({ doors: [[10.5, 'leaf_portcullis']] }, st)); R.wall('u', 12, 10, 12, Object.assign({ doors: [[11.5, 'leaf_portcullis']] }, st)); R.wall('u', 13, 10, 12, Object.assign({ doors: [[10.5, 'leaf_portcullis']] }, st));
      R.wall('v', 10, 11, 14, Object.assign({ doors: [[13.5, 'leaf_vault']] }, st, { h: 5.6 }));
      /* the Queen's niche: a low doorway in her south wall, the passage behind it runs to the back of the Tomb Door */
      R.wall('u', 7, 1, 5, { key: STONE, tint: 0xc8b890, frame: 0x6a5a40, base: L1, doors: [[2.5, 'none']] });
      /* the hidden climb: a ladder up the King's west wall into the Relieving Chambers */
      R.F.push({ k: 'climb', x: r2(R.X(5) + 0.35), z: R.Z(13.5), face: 270, look: 'ladder' });
      /* THE PIT: unfinished, a well in its floor */
      R.props.push({ key: 'ancient_well', x: R.X(8.5), z: R.Z(10.5) }); R.block['8,10'] = 'well';
      R.dec('cave_stone', 4.6, 9.5, 20); R.dec('cave_stone', 9.4, 10.4, 200); R.dec('skull_pile', 5.4, 10.5, 0); R.dec('meshy_rope', 8.9, 10.1, 30); R.dec('psx_cobweb_1', 4.2, 9.2, 0, { y: 2.2 });
      /* the entrance, the passages */
      R.B('brazier', 6, 1, 0); R.dec('cave_torch', 7.75, 3.3, 0); R.dec('cave_torch', 9.5, 4.75, 0); R.dec('skull', 3.4, 2.6, 40); R.dec('cave_stone', 1.5, 2.3, 0); R.dec('psx_cobweb_2', 4.5, 2.2, 0, { y: L1 + 2.2 });
      R.dec('cave_torch', 0.4, 8.25, 0); R.dec('trap_sarcophagus_lid', 2.4, 8.7, 70);
      /* the Queen's Chamber */
      R.B('stone_altar', 1, 5, 90); R.B('stone_urn', 1, 4, 0); R.B('stone_urn', 4, 4, 0); R.dec('brazier', 4.5, 6.5, 0); R.dec('item_heart_scales', 1.5, 5.5, 90, { y: L1 + 1.0 }); R.dec('psx_cobweb_4', 1.2, 4.2, 0, { y: L1 + 2.6 });
      /* the Gallery's foot and head */
      R.dec('cave_torch', 10.25, 4.8, 0); R.dec('cave_torch', 4.4, 10.6, 0);                                                      // (nine lights in all: the Pit has one of them)
      /* the King's Chamber: the sarcophagus, the gold */
      R.B('sarcophagus', 7, 12, 90); R.B('brazier', 5, 11, 0); R.B('brazier', 9, 11, 0); R.B('stone_urn', 5, 13, 0); R.dec('sea_chest', 9.4, 13.5, 200); R.dec('psx_gold_bar_pcs_1', 8.8, 13.6, 30); R.dec('skull', 6.4, 13.6, 100);
      /* the Relieving Chambers */
      R.dec('skull_pile', 2, 13.4, 0); R.dec('paper_sheet', 3.4, 12.6, 30, { y: L3 + 0.01 }); R.dec('psx_cobweb_5', 1.3, 12.3, 0, { y: L3 + 1.6 });
      R.who('mummy', 8.6, 12.4, 270); R.who('anubis', 6.4, 11.5, 135);
      R.doors.push(
          { id: 'north', wall: 'n', x: R.X(7), leaf: 'leaf_frame_only', label: 'GIZA', sub: 'THE NORTH FACE · OUT BY THE NORTH STAIR', action: { room: 'site_prebuilt_area51_desert', at: 'pyramid' },
            desc: 'The way out through the north face. The light at the end of it is the colour of the sand.' },
          { id: 'tomb', wall: 'w', z: R.Z(8.5), leaf: 'leaf_frame_only', label: 'GIZA', sub: 'THE WEST FACE · OUT BESIDE THE TOMB DOOR', action: { room: 'site_prebuilt_area51_desert', at: 'tombside' },
            desc: 'A slab that turns on its middle. It lets out on the west face, a few steps from the Tomb Door.' },
          { id: 'cut', wall: 'w', z: R.Z(2.5), secret: true, leaf: 'leaf_frame_only', label: 'A DRAUGHT', sub: 'THE ROBBERS’ CUT · OUT THROUGH THE WEST FACE', action: { room: 'site_prebuilt_area51_desert', at: 'cut' },
            desc: 'A rough hole hacked through the casing stones. Whoever cut it did not come for the view.', draft: true });
      /* THE TURNING TOMB (mondo 11-15: yes): the King's Chamber holds the door to the puzzle dungeon (data.js PD_DUNGEONS.tomb, level `tomb1`); leaving or solving it comes back here (map.js _pdDoor) */
      R.doors.push({ id: 'turning', wall: 's', x: R.X(7.5), leaf: 'leaf_portcullis', label: 'THE TURNING TOMB', sub: 'THE KING’S CHAMBER · THE DOOR BEHIND THE SARCOPHAGUS', action: { pd: 'tomb1', back: { room: 'site_prebuilt_giza_pyramid', at: 'turning' } },
          desc: 'A door in the south wall of the King’s Chamber, behind the sarcophagus.' });
      R.must.push('6,0', '7,0', '0,8', '0,2', '7,13');
      R.spawn = { x: R.X(7), z: R.Z(1.2), face: 180 };
      R.lines = [];
      R.stops = [[7, 1, L1], [3, 2.5, L1], [3, 5.5, L1], [1.5, 8.5, L1], [7, 10, 0], [11, 12.5, L2], [7.5, 13.4, L2]];
      R.hidden = [[3, 13, L3]];
    }
    return [
        { id: 'site_prebuilt_giza_pyramid', key: 'pyramid', name: 'the pyramid', R: PY, head: [
            "label: 'GIZA · INSIDE THE GREAT PYRAMID',", "sub: 'THE DESCENT · THE PIT · THE QUEEN’S CHAMBER · THE GRAND GALLERY · THE KING’S CHAMBER',", "kind: 'box', site: 'prebuilt_giza', part: 'pyramid',",
            "shell: hqBunkerShell({ w: " + PY.W + ", d: " + PY.D + ", h: 18, wallH: 18, plate: { x: " + PY.spawn.x + ", z: " + r2(-PY.D / 2 + 1.2) + ", y: 6.2 },",
            "                       floor: 'bricks_1', wall: 'bricks_1', dado: 'bricks_1', ceiling: 'bricks_1',",
            "                       floorColor: 0xc8b890, wallColor: 0xc8b890, dadoColor: 0xb8a880, ceilColor: 0x8a7a60,",
            "                       mood: { lamp: 0xffb060, glow: 0xff9a40, strip: 0xffd8a0, light: 0xffe0b0, ambient: 0.8 }, fog: { color: 0x2a2014, density: 0.008 }, look: HQ_ROOM_LOOKS.plateau }),",
            "parti: 'Passages two squares wide cut through one mass of stone on three levels: down to the Pit, level to the Queen, up the Grand Gallery to the King.',",
        ], terrain: ["res: 0.4375, floor: 'bricks_1', cliff: 'bricks_1', path: 'bricks_1',", "noise: { amp: 0, scale: 5 }, crag: false,"] },
    ];
};
