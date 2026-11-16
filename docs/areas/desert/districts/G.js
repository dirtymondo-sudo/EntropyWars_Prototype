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

   WHAT STANDS HERE TODAY (PASS 1, the exteriors, 2026-11-16; mondo on the stepped first build: "way too short ... you didn't even get the shape right"):
   - THE GREAT PYRAMID (P10-10, P11-10, P10-11, P11-11): a TRUE pyramid, 77 m at the foot, 49 m to the tip of its gold capstone (the better gold),
     faces at the real 51.8 degrees, built course by course (`pyramid()`). Not climbed. Its doors stand in stone mouths at its foot (`mouth()`):
     `pyramid` (north face, under the leaning stones), `tombside` and the hidden `cut` (west face); Room 444's bay door (the Tomb Door, data.js
     siteRooms.entry.prebuilt_giza) is in the west face too.
   - KHAFRE (P10-09): 42 m at the foot, 26.7 m, its top third in smooth white casing. MENKAURE (P09-09): 24.5 m, 15.6 m, its lowest courses red granite.
     THE QUEENS' PYRAMIDS: three of 7 m south of Menkaure. None is climbed (a ring of unseen walls at each foot).
   - THE SPHINX (P09-08): rebuilt from parts on 9 x 3 squares, facing east (body, haunches, forelegs, head in its headcloth, the stele). Still blocky.
   - THE OBELISKS (P08-09). THE CAUSEWAY (P08-08): the way in from the Giza Road at the Highway's end (the road is the tool's).
   - THE DIG (P10-08): two trenches a metre down, a camp, a sarcophagus. THE OASIS (P08-10): a pool, six palms.
   - THE SAND SEA (P08-11, P09-11): a half-buried sarcophagus, skulls, stones. THE ROBBERS' TUNNEL (P11-09): link `gobekli_giza` on the east wall.
   - THE INSIDE is this file's too (rooms(kit) below): INSIDE THE GREAT PYRAMID (14 x 14 squares, three levels, the door to the Turning Tomb).
   - People (lines read from the old `site_prebuilt_giza_plateau` literal, which must stay): anubis, annunaki, skeleton, conspiracy theorist, mummy, djinn.

   NEEDS A MODEL (nothing on R2 fits; never a placeholder beyond what stands):
   - THE SPHINX: a real sculpted one (the parts-built one reads as blocks up close). A camel. Fallen casing blocks. A temple's columns (papyrus capitals).

   KNOWN MISSING OR WRONG:
   - THE DIG's two trenches have no ramp (a 1 m step down): pass 3. THE CANYON MOUTH (P11-08) opens on sand: the canyon to Western Town was cut by the move.
   - The pyramids are not climbed any more (the first build's walked tiers and stairs went with the true shape). No temple, no causeway paving beyond
     the layout's stone squares.
   - The room's scatter (the tool's: stones, snags) can land beside a pyramid's foot; the east and south edges show pine mountains (the tool's edges).
   - The pyramid's inside: the Turning Tomb door was seen, not walked through: pass 2. The first views of a probe run in there come out black.
   - Rows outside this file that must agree with it: `links.gobekli_giza.b`, `siteRooms.entry.prebuilt_giza` (the tool prints their places as "ends").
   - Fights use the old plateau's table everywhere (data.js HQ_AREA_ENCOUNTERS). The doors' frames are the engine's grey frame with a green lamp.
   - STONE: `bricks_1` under an arch part needs `gain` 2.7 to read as pale limestone in the sun (1.9 and under draws mud brown).

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
    /* PASS 1, THE EXTERIORS (2026-11-16; mondo the same day on the stepped first build: "way too short ... you didn't even get the shape right").
       Every pyramid is a TRUE pyramid: four straight faces at the real slope (51.8 degrees, rise 1.272 to 1), built course by course, each
       course a `bricks_1` box 1.225 m high set 0.96 m in from the one under it. Nobody climbs one: a ring of unseen walls stands at its foot.
       One `arch` row a monument (des:giza:<name>), so each is culled by itself. */
    const LIME = 0xfff0cc, LIME2 = 0xf6e2b6, GRAN = 0xc88466, DARK = 0x4a3c2c, GAIN = 2.7, SLOPE = 1.272, CH = 1.225, PYR = [];
    /* a ring of thin unseen walls round a drawn mass (a thick `wall` row has round ends: it blocks past its own corners) */
    const ring = (x0, z0, x1, z1, h) => [[x0, z0, x1, z0], [x1, z0, x1, z1], [x1, z1, x0, z1], [x0, z1, x0, z0]].forEach(q => feat({ k: 'wall', x0: r2(q[0]), z0: r2(q[1]), x1: r2(q[2]), z1: r2(q[3]), h, t: 0.3, key: 'bricks_1', ghost: true, rail: false }));
    /* pyramid(name, cx, cz, foot, o): o.top = the height the courses stop at (what stands on them is the caller's), o.tint(i, y) = a course's
       stone. Returns { parts, y, w } = the row's parts list, the height and the width the courses stopped at. */
    function pyramid(name, cx, cz, foot, o) { o = o || {}; const parts = [], apex = foot / 2 * SLOPE, top = o.top != null ? o.top : apex - 1.5; let y = 0, w = foot, i = 0;
        for (; y + CH <= top + 0.01; i++, y = r2(i * CH)) { w = r2(foot - 2 * y / SLOPE); parts.push({ s: 'box', p: [0, y, 0], size: [w, CH + 0.02, w], key: 'bricks_1', tint: o.tint ? o.tint(i, y) : (i % 2 ? LIME2 : LIME), gain: GAIN, uv: [4.9, 4.9] }); }
        feat({ k: 'arch', id: 'des:giza:' + name, x: cx, z: cz, y: 0, parts });
        ring(cx - foot / 2 + 0.2, cz - foot / 2 + 0.2, cx + foot / 2 - 0.2, cz + foot / 2 - 0.2, 4);
        const q = Math.round(foot / C / 2); setRect(Math.round((cx + 168) / C) - q, Math.round((cz + 168) / C) - q, Math.round((cx + 168) / C) + q, Math.round((cz + 168) / C) + q, 'B');
        return { parts, y, w: r2(foot - 2 * y / SLOPE) }; }
    /* a way in at a pyramid's foot (the face leans back, so a door needs its own upright stones): two jambs, a lintel, the dark behind them.
       (lx, lz) = the mouth's middle on the foot line in the row's frame, dir = 'n' (it looks north) or 'w' (west) */
    function mouth(parts, lx, lz, dir, w, h, chevron) { const n = dir === 'n', B = (ax, y, dp, sw, sh, sd, tint, x) => parts.push(Object.assign({ s: 'box', p: n ? [r2(lx + ax), y, r2(lz + dp)] : [r2(lx + dp), y, r2(lz + ax)], size: n ? [sw, sh, sd] : [sd, sh, sw], key: 'bricks_1', tint, gain: GAIN, uv: [1.75, 1.75] }, x || {}));
        const deep = r2(h / SLOPE + 1.2);
        B(0, 0, r2(deep / 2 - 0.1), w, h, deep, undefined, { key: undefined, uv: undefined, gain: 1, tint: 0x0a0806 });                             // the dark
        B(-(w / 2 + 0.45), 0, r2(deep / 2 - 0.3), 0.9, h, deep, GRAN); B(w / 2 + 0.45, 0, r2(deep / 2 - 0.3), 0.9, h, deep, GRAN);                 // the jambs
        B(0, h, r2(deep / 2 - 0.3), w + 1.8, 0.55, deep, LIME);                                                                                     // the lintel
        if (chevron) { const G = (sw, sh, dp, tint) => parts.push({ s: 'roof', form: 'gable', ry: n ? 90 : 0, p: n ? [lx, h + 0.55, r2(lz + dp)] : [r2(lx + dp), h + 0.55, lz], size: [1.4, sh, sw], key: 'bricks_1', tint, gain: GAIN, uv: [1.75, 1.75] });
            G(w + 1.8, 1.7, 0.42, LIME2); G(w - 0.2, 1.05, 0.3, GRAN); } }
    /* THE GREAT PYRAMID on four plots: 77 m at the foot (22 squares), 49 m to the tip of its gold capstone. Its three doors and Room 444's
       bay door stand in stone mouths at its foot. */
    { const cx = gx(84), cz = gx(84), G = pyramid('great', cx, cz, 77, { top: 44.2 });
      G.parts.push({ s: 'roof', form: 'pyramid', p: [0, G.y, 0], size: [G.w, r2(G.w / 2 * SLOPE), G.w], key: 'gold', uv: 3.5, roof: true });                // the capstone, in the better gold
      mouth(G.parts, gc(87) - cx, -38.5, 'n', 2.6, 2.6, true);                                                                                    // the door `pyramid`
      mouth(G.parts, -38.5, gx(79) - cz, 'w', 3.4, 3.0, true);                                                                                    // Room 444's bay door (the Tomb Door)
      mouth(G.parts, -38.5, gc(81) - cz, 'w', 1.5, 2.3, false);                                                                                   // the door `tombside`, the turning stone
      G.parts.push({ s: 'box', p: [-38.2, 0, gc(75) - cz], size: [1.6, 1.5, 1.7], tint: 0x0a0806 });                                              // the Robbers' Cut: a rough hole (the door `cut`)
      P('brazier', 85, 70, {}); P('brazier', 89, 70, {}); P('obelisk', 84, 72, { h: 5 }); P('obelisk', 90, 72, { h: 5 }); }
    /* KHAFRE: 42 m at the foot (12 squares), 26.7 m, the top third still in its smooth white casing */
    { const cx = gx(78), cz = gx(65), K = pyramid('khafre', cx, cz, 42, { top: 17.2 });
      K.parts.push({ s: 'box', p: [0, K.y, 0], size: [r2(K.w + 0.5), 0.5, r2(K.w + 0.5)], key: 'bricks_1', tint: LIME2, gain: GAIN, uv: [4.9, 4.9] },
                   { s: 'roof', form: 'pyramid', p: [0, r2(K.y + 0.5), 0], size: [r2(K.w + 0.3), r2((K.w + 0.3) / 2 * SLOPE), r2(K.w + 0.3)], key: PLAS, tint: 0xfffaf0, gain: 2.2, uv: 3.5, roof: true }); }
    /* MENKAURE: 24.5 m at the foot (7 squares), 15.6 m, its lowest courses in red granite */
    { const cx = gx(65.5), cz = gx(64.5); pyramid('menkaure', cx, cz, 24.5, { top: 15.6, tint: (i, y) => y < 4.5 ? GRAN : (i % 2 ? LIME2 : LIME) });
      for (let j = 61; j < 68; j++) for (let i = 62; i < 69; i++) ctx.setPaint(i, j, 'bricks_1'); }
    /* THE QUEENS' PYRAMIDS: three small ones in a row south of Menkaure, 7 m at the foot */
    for (const qx of [62, 65, 68]) { pyramid('queen' + qx, gx(qx), gx(70), 7, { top: 4.45, tint: i => i % 2 ? LIME : LIME2 });
        for (let j = 69; j <= 70; j++) for (let i = qx - 1; i <= qx; i++) ctx.setPaint(i, j, 'bricks_1'); }
    /* THE SPHINX, facing east, on nine squares by three (x 62..71, y 50..53): built from parts (NEEDS A MODEL: the file's header). The body
       with its rounded back, the haunches, the forelegs out in front, the chest, the head in its headcloth, the stele between the paws. */
    { const ox = gx(66.5), oz = gc(51), S = (o, tint, x) => PYR.push(Object.assign({ key: 'bricks_1', tint: tint == null ? LIME : tint, gain: GAIN, uv: [3.5, 3.5] }, o, { p: [r2(ox + o.p[0]), o.p[1], r2(oz + o.p[2])] }, x || {}));
      S({ s: 'box', p: [0, 0, 0], size: [31.5, 0.35, 10.5] }, LIME2);
      S({ s: 'box', p: [-4.5, 0.35, 0], size: [19.5, 4.2, 6.6] }); S({ s: 'roof', form: 'barrel', p: [-4.5, 4.55, 0], size: [19.5, 1.3, 6.6], seg: 8 });
      for (const sd of [-1, 1]) { S({ s: 'dome', p: [-10.5, 0.35, sd * 3.3], r: 3.4, h: 4.4, rz: 1.9, seg: 12, rings: 5 }, LIME2); S({ s: 'box', p: [-7.2, 0.35, sd * 4.4], size: [5.2, 1.1, 1.5] }, LIME2);
          S({ s: 'box', p: [10.5, 0.35, sd * 3.3], size: [10.5, 1.9, 2.4] }); S({ s: 'roof', form: 'barrel', p: [10.5, 2.25, sd * 3.3], size: [10.5, 0.6, 2.4], seg: 6 });
          S({ s: 'box', p: [15.2, 0.35, sd * 3.3], size: [1.1, 2.2, 2.9] }, LIME2);
          S({ s: 'box', p: [5.6, 4.9, sd * 2.25], size: [1.3, 3.3, 1.1] }, 0xf2d498); S({ s: 'box', p: [6.74, 8.55, sd * 0.78], size: [0.08, 0.34, 0.8], key: undefined, uv: undefined, gain: 1 }, DARK); }
      S({ s: 'dome', p: [-14.1, 0.35, 0], r: 1.6, h: 4.2, rz: 3.2, seg: 12, rings: 5 }, LIME2);
      S({ s: 'box', p: [4.2, 0.35, 0], size: [3.6, 6.4, 6.2] }); S({ s: 'box', p: [4.4, 6.75, 0], size: [3.0, 1.0, 3.6] }, LIME2);
      S({ s: 'cyl', p: [3.9, 6.2, 0], r: 4.3, r2: 2.6, h: 4.9, seg: 4, a0: 45 }, 0xf2d498, { uv: [3.5, 0.875] });                                  // the headcloth
      S({ s: 'box', p: [5.9, 6.6, 0], size: [1.6, 3.6, 3.0] }); S({ s: 'box', p: [6.2, 5.9, 0], size: [1.0, 0.8, 1.6] }, LIME2); S({ s: 'box', p: [6.6, 10.3, 0], size: [0.4, 0.8, 0.5] }, LIME2);
      S({ s: 'box', p: [6.74, 7.3, 0], size: [0.08, 0.18, 1.4], key: undefined, uv: undefined, gain: 1 }, DARK);
      S({ s: 'box', p: [8.6, 0.35, 0], size: [1.0, 0.3, 2.0] }, LIME2); S({ s: 'box', p: [8.6, 0.65, 0], size: [0.5, 2.8, 1.6], uv: [1.75, 1.75] }, GRAN);   // the stele between the paws
      ring(gx(62) + 0.2, gx(50) + 0.2, gx(71) - 0.2, gx(53) - 0.2, 5);
      setRect(62, 50, 71, 53, 'B'); for (let j = 50; j < 53; j++) for (let i = 62; i < 71; i++) ctx.setPaint(i, j, 'bricks_1');
      P('brazier', 72, 49, {}); P('brazier', 72, 53, {}); }
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
        desc: 'A square mouth in the north face, under two pairs of leaning stones. The air that comes out of it is older than they are.' });
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
          { id: 'north', wall: 'n', x: R.X(7), leaf: 'leaf_frame_only', label: 'GIZA', sub: 'THE NORTH FACE · THE WAY OUT', action: { room: 'site_prebuilt_area51_desert', at: 'pyramid' },
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
