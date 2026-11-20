/* LEYLINES · THE LEY LINE, THE ROOM DESIGN (2026-11-20, world polish thread 12: docs/plans/world-polish/WORLD_POLISH_PLAN.md, mondo's OK of 11-20 on
   docs/plans/world-polish/plans/leylines-line.js: "yep looks good"). Repo tooling only: bake-leylines.js THE ROOM DESIGN lays the plan's squares and
   levels on `site_prebuilt_gobekli_ow_line` as it stands on the One World, then calls `dress(a)` here.

   WHY THIS FILE AND NOT Y.js: Y.js is written in the zone's HOME frame (the old 9 x 7 room), where the Ley Line was one row of nine plots and nothing
   stood north or south of it. The plan grows the room by 18 plots in its own box and draws the walk across plot lines: that is THE ROOM'S OWN FRAME,
   squares x 0..143 (west to east), y 0..35 (north to south), a plot = 12 x 12 of them, exactly as the room is baked (thread 3's lesson 1). Y.js still
   stands what it stood (the menhirs, the obelisks, the people); the tool takes what the walk now runs over off it (`dropHome`, `dropProp`).

   THE ROOM (12 x 3 plots; G = Göbekli Tepe, left as built; the rest = the Ley Line):
        x 0..35        36..47          48..59         60..71           72..83          84..95       | 96..143 (east half: built after the pilot)
     y  0  G G G       North Bank 1    Terrace 3      North Knoll 4    Lone Stone 2    Rise 1       |
       12  G G G       West Mouth 0    Niches 1       Forks 2          Great Line 0    Nexus 0      |
       24  G G G       Dry Field 0     Low Ground -1  South Bank 1     Sink -2         Fork's End -1|
   THE LINE: dead straight and level (0) on squares y 17..18, x 44..143: a kerbed bed of light you CROSS (the Nexus ring, the slabs) and never walk along.

   THE PILOT (11-20): the west half, x 36..95 (`x1`), the West Mouth to the Nexus. `x1: 143` and the east eight plots (after-v13.js LEY_UPTO = 11) are the rest.
   New buildings are ANCIENT (mondo 11-20: "ancient right? or at least one of the early civilizations"): dry stone, built like Göbekli Tepe's enclosures. */
'use strict';
const SLABS = [[65, 67, 2], [102, 104, 1], [124, 126, 1]];   // the plan's slabs over the cut: [x0, x1, level] (it draws them as 'c' squares over y 16..19)
const X1 = 95;
module.exports = {
    wx: 19, wy: 29, x0: 36, x1: X1, letters: ['Y'], lineRows: [17, 18],
    slabs: SLABS.filter(b => b[1] <= X1),
    /* PILOT ONLY: in the plan the east half is reached from the Nexus by the walk north over the Rise and the Shoulder; until the east half is built
       the Nexus's south-east corner opens one square east onto the old level plain (squares on top of the plan: [x0, y0, x1, y1, tile, level]) */
    extra: X1 < 143 ? [[95, 19, 95, 21, 'g', 0]] : [],
    /* the paint (the tool's eight sheets: 0 the room's grass, 1 wasteland, 2 desert, 3 dirt_2, 4 marble_light, 5 cobblestone, 6 bricks_1, 7 gold, 8 grass_dark_fantasy) */
    paint: { p: 2, q: 2, d: 2, g: 0, c: 5, k: 5, m: 1, line: 7, mass: 3 },   // (first probe: dirt_2 on the walk read dark grey, the scrub's ground pale: the walk is the pale earth now, the scrub's ground the dark)
    /* THE MASS: low dry scrub and bare thorn trees (the generator's trees on the designed plots' closed squares; the stones are `dress`) */
    gen: { depth: 5.25, maxTrees: 520, gap: 3.6, treeH: [1.8, 3.2], kinds: ['fl_joshua_tree', 'tree_14', 'tree_5', 'rf_oak_4_autumn', 'tree_17', 'fl_joshua_tree', 'pine_2', 'tree_13'] },   // (first probe: 1,400 trees of 2.6-4.6 m read as a wood that hid the land: low and sparse, the bushes and stones below fill it)
    /* the home frame's rows on the designed squares that go: the gold forks (the plan has none) and the old niches (laid again on their banks below) */
    dropHome: f => /^ley:(fork|niche):/.test(f.id || ''),
    /* the home frame's props there that go: the fork signposts, the old niches' fittings, the West Mouth's camp (laid again below), the menhirs and
       obelisks that stood on ground the plan opens (the ones in the mass stay: standing stones along the cut) */
    dropProp: (p, open) => /^(signpost|sarcophagus|skull_pile|brazier|campfire|sea_chest|paper_sheet|cattle_skull)$/.test(p.key) || open && /^(menhir|obelisk)$/.test(p.key),
    dress(a) {
        const { P, look, feat, gx, gz, gcx, gcz, C, r2, B } = a, STONE = 'rock_wall_1', ST = 0xc4b8a0;
        const M = (key, x, y, o) => P(key, x, y, Object.assign({ mass: true }, o || {}));
        /* ── THE LINE'S KERB: a low stone kerb along the bed wherever level ground meets it (in the cuts the bank is its own edge) ── */
        { const parts = [], kerb = (x, z, w, d) => parts.push({ s: 'box', p: [r2(x), 0, r2(z)], size: [r2(w), 0.32, r2(d)], key: STONE, tint: ST, uv: [1.75, 1.75], gain: a.GAIN });
          for (let x = 36; x <= X1; x++) { if (!a.line(x, 17)) continue;
              if (a.open(x, 16) && a.level(x, 16) < 0.6) kerb(gcx(x), gz(17) + 0.22, C, 0.44);
              if (a.open(x, 19) && a.level(x, 19) < 0.6) kerb(gcx(x), gz(19) - 0.22, C, 0.44);
              [-1, 1].forEach(s => { if (a.open(x + s, 17) && !a.line(x + s, 17)) kerb(s < 0 ? gx(x) + 0.22 : gx(x + 1) - 0.22, gz(18), 0.44, 2 * C); }); }
          if (parts.length) feat({ k: 'arch', id: 'ley:y:kerb', x: 0, z: 0, y: 0, parts }); }

        /* ── THE REST HOUSE (new; ancient dry stone, squares 45..47 x 13..15, its door west on the West Mouth): one round room built the way Göbekli Tepe's
           enclosures were, a dry-stone ring with two T-pillars standing in the middle, a stone bench round the inside, a hearth and an offering table.
           Open to the sky, as the enclosures are seen today. Its walls are walls you bump (terrain `wall` rows): the inside is the outside's own ring. ── */
        { const mx = gcx(46), mz = gcz(14), R0 = 4.55, R1 = 3.8, n = 18, seg = (r, h, t, id, skip) => { for (let k = 0; k < n; k++) { const a0 = k * 2 * Math.PI / n, a1 = (k + 1) * 2 * Math.PI / n, am = (a0 + a1) / 2;
                if (skip(am)) continue; feat({ k: 'wall', x0: r2(mx + r * Math.cos(a0)), z0: r2(mz + r * Math.sin(a0)), x1: r2(mx + r * Math.cos(a1)), z1: r2(mz + r * Math.sin(a1)), h, t, key: STONE, ring: id }); } };
          const west = am => Math.abs(Math.atan2(Math.sin(am - Math.PI), Math.cos(am - Math.PI))) < 0.36;   // the doorway faces west
          seg(R0, 2.7, 0.7, 'ley:y:resthouse', west);
          seg(R1, 0.46, 0.75, 'ley:y:resthouse:bench', am => Math.abs(Math.atan2(Math.sin(am - Math.PI), Math.cos(am - Math.PI))) < 0.7);
          /* the doorway: two upright slabs and a lintel (drawn), the way the enclosures' porthole stones frame a way in */
          look('resthouse:door', r2(mx - R0), mz, 0, s => { s.box(0, 0, -1.15, 0.8, 2.9, 0.5, STONE, 0xb8ac94); s.box(0, 0, 1.15, 0.8, 2.9, 0.5, STONE, 0xb8ac94); s.box(0, 2.9, 0, 1.0, 0.55, 3.0, STONE, 0xa89c84, { under: true }); }, 0);
          P('t_pillar', 46, 14, { dx: 0, dz: -1.25, h: 3.4, face: 90 }); P('t_pillar', 46, 14, { dx: 0, dz: 1.25, h: 3.4, face: 90 });
          P('hearth_fire', 46, 14, { dx: 1.9 }); P('stone_altar', 47, 14, { dx: 0.4, face: 270 }); P('stone_urn', 46, 13, { dx: 1.2, dz: -0.3 }); P('woven_baskets', 46, 15, { dx: 1.0, dz: 0.4 });
          M('cave_torch', 44, 13, { dz: 1.2 }); M('cave_torch', 44, 15, { dz: -1.2 }); }

        /* ── THE WEST MOUTH: where the Line starts. Its camp (it stood here at home) and two fires either side of the bed ── */
        P('campfire', 40, 20); P('firewood_stack', 41, 20, { dx: 0.6 }); P('cattle_skull', 39, 20, { dx: -0.5 }); P('grindstone', 37, 14);
        P('brazier', 43, 15); P('brazier', 43, 20); P('milestone', 38, 13, { dx: 0.9 });

        /* ── THE NICHES (the shrines of the old places, on the cut's banks): stone alcoves cut into the bank, opening onto the niche rows (y 16 north,
           y 21 south, level 1), each with its fitting. The thin trails up from the walk and out of the Low Ground arrive between them. ── */
        { const niche = (id, sx, sy, south) => look('niche:' + id, gcx(sx), gcz(sy) + (south ? -0.9 : 0.9), south ? 180 : 0, s => {
              s.box(-1.6, 0, 0, 0.7, 2.7, 1.6, STONE, 0xb8b0a0); s.box(1.6, 0, 0, 0.7, 2.7, 1.6, STONE, 0xb8b0a0); s.box(0, 2.7, 0, 4.2, 0.6, 1.8, STONE, 0xa8a090, { under: true }); s.box(0, 0, -0.7, 2.6, 2.7, 0.35, STONE, 0x989080); }, a.h(sx, south ? sy - 1 : sy + 1));
          [[50, 15, 0, 'sarcophagus'], [56, 15, 0, 'brazier'], [50, 22, 1, 'skull_pile'], [56, 22, 1, 'brazier']].forEach((q, i) => { niche(i, q[0], q[1], q[2]);
              P(q[3], q[0], q[2] ? q[1] - 1 : q[1] + 1, { dz: q[2] ? 0.9 : -0.9, face: q[2] ? 0 : 180 }); }); }

        /* ── THE NORTH KNOLL (level 4, an open top a board fits on): a ring of standing stones round its rim, in the scrub; a cairn on the lookout ── */
        [[61, 2], [61, 7], [70, 2], [70, 7], [64, 0], [68, 0]].forEach((q, i) => M('menhir', q[0], q[1], { h: 2.6 + (i % 3) * 0.4, face: (i * 47) % 360 }));
        P('cairn', 71, 9);

        /* ── THE LONE STONE (a secret north of the Great Line): one great standing stone on a knoll in the scrub, an offering at its foot ── */
        P('sarsen', 76, 10, { h: 5.6, face: 20 }); P('stone_altar', 76, 11, { face: 180 }); P('cattle_skull', 75, 11, { dx: 0.4, dz: 0.3 });

        /* ── THE SINK (level -2: the lowest ground on the Line, the walk drops in by its switchback and climbs out to the Nexus) ── */
        P('meshy_campfire_ring', 81, 32); P('cattle_skull', 80, 33, { dx: 0.3 }); P('woven_baskets', 82, 30, { dx: 0.5 }); P('psxg_rock_1', 83, 34, { dx: 0.5 });

        /* ── THE FORK'S END (a secret: where the south fork dies in the low ground) ── */
        P('stone_altar', 93, 32, { face: 0 }); P('golden_idol', 93, 32, { y: 0.95, face: 0 }); M('cave_torch', 92, 34, { dz: -1 }); M('cave_torch', 94, 34, { dz: -1 });

        /* ── THE DRY FIELD (an open field a board fits on) and the field by the Low Ground ── */
        P('grindstone', 37, 33); P('woven_baskets', 38, 33, { dx: 0.5 });

        /* ── THE NEXUS: four obelisks at the ring's corners (they stood on its paving at home: the ring is a level place a board fits on) ── */
        [[85, 13], [95, 13], [85, 23], [95, 23]].forEach(q => { try { M('obelisk', q[0], q[1], { h: 7 }); } catch (e) { if (!/open square/.test(e.message)) throw e; } });

        /* ── THE MASS beside the walk: boulders, dry bushes and here and there a standing stone, on about one mass square in two beside the walk and one in four inside it ── */
        { let n = 0; const hs = (x, y, k) => { let v = (x * 374761393 + y * 668265263 + k * 2147483647) | 0; v = Math.imul(v ^ (v >>> 13), 1274126177); return ((v ^ (v >>> 16)) >>> 0) / 4294967296; };
          const KEYS = ['rf_rock_1', 'psxg_dead_bush_1', 'leafy_bush', 'rf_rock_2', 'psxg_dead_bush_2', 'menhir', 'psxg_dead_bush_1', 'rf_rock_3', 'leafy_bush', 'psxg_rock_1', 'fl_barrel_cactus', 'psxg_dead_bush_2'];
          for (let y = 0; y < B.H; y++) for (let x = 36; x <= X1; x++) { if (a.open(x, y) || a.line(x, y) || y === 0 || y === B.H - 1) continue;
              const edge = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => a.open(x + dx, y + dy));
              if (hs(x, y, 3) > (edge ? 0.45 : 0.28) || [[45, 13], [44, 13], [44, 15]].some(q => Math.abs(q[0] - x) <= 1 && Math.abs(q[1] - y) <= 1)) continue;
              const key = KEYS[Math.floor(hs(x, y, 5) * KEYS.length)];
              try { M(key, x, y, Object.assign({ face: Math.round(hs(x, y, 7) * 360), dx: r2((hs(x, y, 8) - 0.5) * 1.2), dz: r2((hs(x, y, 9) - 0.5) * 1.2) }, key === 'menhir' ? { h: r2(2.2 + hs(x, y, 4)) } : {})); n++; } catch (e) { if (!/off the designed/.test(e.message)) throw e; } }
          a.scattered = n; }
    },
};
