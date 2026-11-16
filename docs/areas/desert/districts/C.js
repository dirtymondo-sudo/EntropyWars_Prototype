/* THE DESERT · THE CIRCUS (district C, 9 plots) — the district file of `node bake-desert.js` (repo tooling, never uploaded).
   One thread = this one file. The tool, layout.json, the Highway and every shared piece belong to the tool's row on the board (docs/notes/claims.md).

   THE PLOTS (ids + names: docs/areas/desert/layout.json; a plot is 12 x 12 squares of 3.5 m):
     P01-01  The Animals                    home squares x 12..24 · y 0..12
     P02-01  The Wagons                     home squares x 24..36 · y 0..12
     P03-01  The Wheel                      home squares x 36..48 · y 0..12
     P01-02  The Midway                     home squares x 12..24 · y 12..24
     P02-02  The Big Top                    home squares x 24..36 · y 12..24
     P03-02  The Horses                     home squares x 36..48 · y 12..24
     P01-03  The Ticket Booth               home squares x 12..24 · y 24..36
     P02-03  The Lady Who Knows             home squares x 24..36 · y 24..36
     P03-03  The Mirrors                    home squares x 36..48 · y 24..36

   WHAT STANDS HERE (the district thread, 11-16; notes: docs/notes/areas-complexes.md "THE DESERT, THE CIRCUS"):
   - THE BIG TOP (P02-02, des:bigtop): the square hall you walk in (7 x 7 squares) under a ROUND striped tent 35 m across (sixteen gores, a
     two-step cone, king poles, a cloth tunnel to the door); a ghost ring keeps the walker out of the gap between cloth and hall.
   - THE MIRRORS (P03-03, des:mirrors): the Hall of Mirrors is a WALK-IN funhouse now (squares 44..48 x 25..30, front south on the gate's
     forecourt). The Mandela Room's door `mirrors` stands where it stood, on the hall's west wall.
   - THE GATE (P03-03): two striped ticket towers and CIRCUS over the road in from the highway's Exit 2 (squares 47, 30..33).
   - THE MIDWAY (P01-02): a four-square dirt street under bunting; stalls RING TOSS, BOTTLE TOSS, CANDY, CAN TOSS, LUCKY WHEEL (solid, whole
     squares), the walk-in PENNY ARCADE (des:arcade), the popcorn cart, the hot dog stand, the high striker, a carnival tent.
   - THE SIDESHOW (P02-03, des:sideshow): a walk-in cloth hall south of the road. The fortune tent and the mermaid's pool as before.
   - THE WHEEL (P03-01): the ferris wheel faces the grounds, on planks, its booth. THE HORSES (P03-02): the carousel, its booth.
   - THE ANIMALS (P01-01): the horse ring, the big animals' yard (elephant + giraffe), the lion's cage wagon.
   - THE WAGONS (P02-01): two carnival tents, a trailer. THE TICKET BOOTH (P01-03): the booth + the door `tunnel` (never moved).
   - A ranch rail round the whole block with flag poles; the gate east, a back gate west (the track's west end).
   - People (the old carnival's own, their lines read from the old `carnival` literal, which must stay in data.js): ringmaster, clown, giant,
     fortune teller, mermaid, gnome, catgirl.

   THE KIT IN THIS FILE: `gores` (a striped round cloth wall or cone), `marquee` (a walk-in cloth hall), `stall` (a booth on whole squares +
   its ghost block), `cage`, `bunting`, `flagpole`, `stripesX / stripesZ`, `lift` (cloth is the stucco sheet + `gain`: the `canvas` key is a
   clothes fabric and drew flat). `arch(id, x, z, rot, sheet)` writes a stand-alone row `des:c:<id>`.

   INSIDE (pass 2): the Big Top = a round cloth wall + a striped cone seen from within, the ring (curb, sawdust, bulbs), two banks of
   seats, the band's stand, king poles with platforms, a high wire, two trapezes, strings of bulbs. The Hall of Mirrors = a mirror maze on
   the square lines (`MAZE_OPEN` = the open ways; every other line is a mirror + a ghost wall). The Penny Arcade and the Sideshow =
   `tentInside()` + machines / exhibits on square middles. A camera or a ceiling: the building's own ceiling is at h - 0.32.

   KNOWN MISSING OR WRONG:
   - `ferris_wheel` and `carousel` are code-sized (6.5 m and 3.6 m): a row's `h` does nothing on them. A big wheel NEEDS A MODEL.
   - NEEDS A MODEL (nothing in MODEL_LIST.md): balloons, plush prizes, a real string of lights, a funhouse mirror, a bleacher stand, a
     unicycle, juggling pins, a ring of fire, a trapeze, a cage wagon, a cotton candy cart, circus posters, a striped cloth sheet.
   - Fights use the old plateau's table everywhere (data.js HQ_AREA_ENCOUNTERS). No residents.

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
   room square = home square + (0, 12). Keep to your own block; the tool warns about a row outside it.
   REBAKE: node bake-desert.js   (--dry-run prints the counts). Rules: docs/notes/areas-complexes.md "THE DESERT, THE DISTRICT FILES". */
'use strict';
let C, gx, gc, r2, feat, props, doors, npc, count, line, setRect, pen, building, sheet, put, SOLID, P, Pm, dec, native, rnd, setPaint, sayOf, O_GIZA, O_GATE, O_LINE, O_CARN, U, WD, WD2, SHG, FLR, GLS, RIB, COR, CONC, PLAS;
const bind = ctx => ({ C, gx, gc, r2, feat, props, doors, npc, count, line, setRect, pen, building, sheet, put, SOLID, P, Pm, dec, native, rnd, setPaint, sayOf, O_GIZA, O_GATE, O_LINE, O_CARN, U, WD, WD2, SHG, FLR, GLS, RIB, COR, CONC, PLAS } = ctx);
let BIGTOP, MIRRORS, ARCADE, SIDESHOW;
exports.dice = 51;

/* ── THE CIRCUS KIT (this file's own helpers; parts frame of a row: x along its front, +z out of the front, y up) ── */
const RED = 0xc8392f, CREAM = 0xf4ecd8, GOLD = 0xe9b62e, BLUE = 0x2e5c9c, TEAL = 0x2c8f88, PURP = 0x7a519c, DARK = 0x4a3626, PLANK = 'urban:WoodFlooring1a';
const CV = () => PLAS;                                                              // tent cloth: the stucco sheet takes a light tint (the `canvas` key is a clothes fabric, it drew flat)
const hex = n => '#' + ('000000' + n.toString(16)).slice(-6);
const ROTS = { S: 0, W: 90, N: 180, E: 270 };
/* the stucco sheet is grey: every cloth part is lifted (`gain`), and the small bright things glow a little */
const lift = a => { a.P.forEach(q => { if (q.key === PLAS && q.gain == null) q.gain = 1.7; if (q.key === 'carpet' && q.glow == null) { q.gain = 1.8; q.glow = 0.3; } }); return a; };
const arch = (id, x, z, rot, a) => feat(lift(a) && { k: 'arch', id: 'des:c:' + id, x: r2(x), z: r2(z), rot, parts: a.P });
const ghost = (x0, z0, x1, z1, h, t) => feat({ k: 'wall', x0: r2(x0), z0: r2(z0), x1: r2(x1), z1: r2(z1), h, t: r2(t), key: WD2, ghost: true, rail: false });
/* a row's frame -> the room (the tool's own turn: building().at) */
const toRoom = (x, z, rot) => { const t = rot * Math.PI / 180, c = Math.cos(t), s = Math.sin(t); return (lx, lz) => [r2(x + lx * c - lz * s), r2(z + lx * s + lz * c)]; };
/* a striped round cloth wall or cone: n gores, two tints; `skip` = gores left out (a way in) */
const gores = (a, y, r, rTop, h, n, tA, tB, o, skip, cx, cz) => { for (let i = 0; i < n; i++) { if (skip && skip.indexOf(i) >= 0) continue;
    a.cyl(cx || 0, y, cz || 0, r, h, CV(), i % 2 ? tA : tB, Object.assign({ r2: rTop, arc: 360 / n, a0: (i + 0.5) * 360 / n, cap: false, seg: Math.max(16, n * 2), uv: [3.5, 3.5] }, o || {})); } };
/* a string of pennants between two points (three tints, a cord) */
const bunting = (a, x0, z0, x1, z1, y, tints) => { const dx = x1 - x0, dz = z1 - z0, len = Math.hypot(dx, dz), ry = r2(Math.atan2(dz, dx) * 180 / Math.PI), T = tints || [RED, GOLD, BLUE], gap = 0.62, n = Math.max(3, Math.floor(len / gap));
    a.box((x0 + x1) / 2, y + 0.3, (z0 + z1) / 2, len, 0.025, 0.025, WD2, 0x2a2018, { ry });
    T.forEach((t, k) => { const m = Math.floor((n - k + T.length - 1) / T.length); if (m > 0) a.box(x0 + dx * (k + 0.5) / n, y, z0 + dz * (k + 0.5) / n, 0.36, 0.3, 0.02, CV(), t, { ry, n: m, step: [r2(dx * T.length / n), 0, r2(dz * T.length / n)], glow: 0.5 }); }); };
/* a pole with a pennant */
const flagpole = (a, x, z, h, tint, o) => { a.cyl(x, 0, z, 0.07, h, WD2, 0xd8d0c0, Object.assign({ seg: 6 }, o || {})); a.box(x + 0.5, h - 0.75, z, 1.0, 0.6, 0.03, CV(), tint, Object.assign({ glow: 0.5 }, o || {})); };
/* red strips on a cream cloth wall: along x on a wall at z, or along z on a wall at x */
const stripesX = (a, x0, x1, y, h, z, tint, cut) => { for (let x = x0; x < x1 - 0.5; x += 1.75) { if (cut && x + 0.875 > cut[0] && x < cut[1]) { if (h > cut[2] + 0.3) a.box(x + 0.44, y + cut[2], z, 0.875, h - cut[2], 0.05, CV(), tint); continue; } a.box(x + 0.44, y, z, 0.875, h, 0.05, CV(), tint); } };
const stripesZ = (a, z0, z1, y, h, x, tint) => { for (let z = z0; z < z1 - 0.5; z += 1.75) a.box(x, y, z + 0.44, 0.05, h, 0.875, CV(), tint); };

/* A MARQUEE: a walk-in cloth hall (striped walls, a ridge roof, corner poles, its name over the door) */
function marquee(a, w, d, door, o) {
    const h = o.h || 3.6, t = o.tint || RED, e = 0.09;
    a.shell(w, h, d, CV(), CREAM, door, [3.5, 3.5]);
    stripesX(a, -w / 2, w / 2, 0, h, d / 2 + e, t, [door.lx - door.cw / 2 - 0.2, door.lx + door.cw / 2 + 0.2, 2.3]); stripesX(a, -w / 2, w / 2, 0, h, -d / 2 - e, t);
    stripesZ(a, -d / 2, d / 2, 0, h, w / 2 + e, t); stripesZ(a, -d / 2, d / 2, 0, h, -w / 2 - e, t);
    a.roof('gable', 0, h, 0, w + 1.0, o.rise || 2.6, d + 1.0, CV(), t, { keyEnd: CV(), tintEnd: CREAM });
    a.box(0, h - 0.34, 0, w + 1.04, 0.34, d + 1.04, CV(), o.band || GOLD, { top: false });                                                    // the valance
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) a.box(sx * (w / 2 + 0.1), 0, sz * (d / 2 + 0.1), 0.22, h + 0.5, 0.22, WD2, 0xd8d0c0);
    for (const sx of [-1, 1]) flagpole(a, sx * (w / 2 - 0.4), 0, h + (o.rise || 2.6) + 2.2, sx > 0 ? GOLD : t, { roof: true });
    a.sign(o.name, door.lx, 2.45, d / 2 + 0.16, Math.min(w - 1, o.signW || 7), 1.05, o.ink || '#f8e6a8', o.board || '#5a1a16', 'rye');
    for (const s of [-1, 1]) a.box(door.lx + s * (door.cw / 2 + 0.2), 0, d / 2 + 0.14, 0.2, 2.4, 0.12, WD2, 0xe8d8a0);                   // the door's two gilt posts
    lift(a);
}

/* THE INSIDE OF A CLOTH HALL: a lit cloth lining with strips, a cloth ceiling, a ridge pole with a row of bulbs. Everything inside is lit a
   little (`glow`): a room has no lamp of its own. `FIT[id]` = the drawn fittings that stop the walker ([x, z, w, d, h] in the building's
   frame; furnish() writes them as ghost blocks). Squares: X(i) from the left, Z(j) from the BACK wall. */
const FIT = {};
function tentInside(a, id, w, d, h, door, t) {
    const iw = w / 2 - 0.34, il = d / 2 - 0.34, g = 0.55, top = h - 0.42, x = { glow: g, uv: [3.5, 3.5] }, G = FIT[id] = [];
    a.box(0, 0, 0, 2 * iw, 0.05, 2 * il, PLANK, 0xe0c8a0, { sides: false, glow: 0.45, uv: [1.75, 1.75] });                                   // the board floor you see (the room's own floor is not drawn inside)
    a.box(0, 0, -il, 2 * iw, top, 0.03, PLAS, CREAM, x); for (const s of [-1, 1]) a.box(s * iw, 0, 0, 0.03, top, 2 * il, PLAS, CREAM, x);
    const l1 = door.lx - door.cw / 2 - 0.14, r0 = door.lx + door.cw / 2 + 0.14;
    a.box((-iw + l1) / 2, 0, il, l1 + iw, top, 0.03, PLAS, CREAM, x); a.box((iw + r0) / 2, 0, il, iw - r0, top, 0.03, PLAS, CREAM, x); a.box(door.lx, 2.34, il, r0 - l1, top - 2.34, 0.03, PLAS, CREAM, x);
    a.box(-iw + 0.44, 0, -il + 0.03, 0.875, top, 0.02, PLAS, t, { glow: g, n: Math.floor(2 * iw / 1.75) + 1, step: [1.75, 0, 0] });
    for (const s of [-1, 1]) a.box(s * (iw - 0.03), 0, -il + 0.44, 0.02, top, 0.875, PLAS, t, { glow: g, n: Math.floor(2 * il / 1.75) + 1, step: [0, 0, 1.75] });
    a.box(0, top, 0, 2 * iw, 0.02, 2 * il, PLAS, CREAM, { sides: false, top: false, under: true, glow: 0.62 });
    a.box(0, top - 0.14, 0, 2 * iw, 0.12, 0.12, WD2, 0x6a4e38, { glow: g });
    a.box(-iw + 0.7, top - 0.3, 0, 0.1, 0.1, 0.1, null, 0xfff0c0, { glow: 1, n: Math.floor((2 * iw - 1.4) / 0.8) + 1, step: [0.8, 0, 0] });
    for (const s of [-1, 1]) a.box(-iw + 0.7, top - 0.2, s * il * 0.55, 0.1, 0.1, 0.1, null, 0xffe0a0, { glow: 1, n: Math.floor((2 * iw - 1.4) / 1.6) + 1, step: [1.6, 0, 0] });
    const solid = (sx, sz, sw, sd, sh, key, tint, o) => { a.box(sx, 0, sz, sw, sh, sd, key || WD, tint == null ? 0xb08a60 : tint, Object.assign({ glow: g, uv: [1.75, 1.75] }, o || {})); G.push([sx, sz, sw, sd, sh]); };
    return { solid, g, top, iw, il, X: i => -w / 2 + (i + 0.5) * 3.5, Z: j => -d / 2 + (j + 0.5) * 3.5 };
}
const fitGhosts = (B, id) => (FIT[id] || []).forEach(q => { const along = q[2] >= q[3], p = along ? B.at(q[0] - q[2] / 2, q[1]) : B.at(q[0], q[1] - q[3] / 2), e = along ? B.at(q[0] + q[2] / 2, q[1]) : B.at(q[0], q[1] + q[3] / 2); ghost(p[0], p[1], e[0], e[1], r2(q[4]), along ? q[3] : q[2]); });

/* THE MIRROR MAZE (4 x 5 squares, i from the left, j from the back wall): the open ways between squares; every other line is a mirror */
const MAZE_OPEN = ['1,4-0,4', '0,4-0,3', '0,3-0,2', '0,2-1,2', '1,2-1,3', '1,3-2,3', '2,3-2,4', '2,4-3,4', '3,4-3,3', '3,3-3,2', '3,2-3,1', '3,1-2,1', '2,1-2,2', '2,1-1,1', '1,1-0,1', '0,1-0,0', '0,0-1,0', '1,0-2,0', '2,0-3,0'];
const mazeWalls = (w, d) => { const open = new Set(), K = (a, b) => a < b ? a + '-' + b : b + '-' + a; MAZE_OPEN.forEach(e => { const q = e.split('-'); open.add(K(q[0], q[1])); });
    const LX = i => -w / 2 + i * 3.5, LZ = j => -d / 2 + j * 3.5, out = [];
    for (let i = 0; i < 4; i++) for (let j = 0; j < 5; j++) { if (i < 3 && !open.has(K(i + ',' + j, (i + 1) + ',' + j))) out.push([LX(i + 1), LZ(j), LX(i + 1), LZ(j + 1)]); if (j < 4 && !open.has(K(i + ',' + j, i + ',' + (j + 1)))) out.push([LX(i), LZ(j + 1), LX(i + 1), LZ(j + 1)]); }
    return out; };

/* A STALL: a game or food booth on whole squares (n squares wide, one deep), solid: a counter, a back wall of prizes, an awning, its name.
   `side` = the way its front looks. */
function stall(id, sx, sy, n, side, name, tint, o) {
    o = o || {}; const rot = ROTS[side], ns = side === 'N' || side === 'S', w = n * 3.5 - 0.3, d = 3.1, x = ns ? gx(sx) + n * 1.75 : gc(sx), z = ns ? gc(sy) : gx(sy) + n * 1.75, a = sheet(), hB = 2.7;
    a.box(0, 0, 0, w, 0.08, d, PLANK, 0xc8b090, { uv: [1.75, 1.75] });                                                                    // its deck
    a.box(0, 0, -d / 2 + 0.04, w, hB, 0.08, CV(), CREAM, { uv: [3.5, 3.5] }); stripesX(a, -w / 2, w / 2, 0, hB, -d / 2 - 0.02, tint); stripesX(a, -w / 2 + 0.875, w / 2, 0, hB, -d / 2 + 0.1, tint);
    for (const s of [-1, 1]) { a.box(s * (w / 2 - 0.04), 0, -0.4, 0.08, hB, d - 0.8, CV(), CREAM, { uv: [3.5, 3.5] }); a.box(s * (w / 2 - 0.1), 0, d / 2 - 0.1, 0.16, hB + 0.1, 0.16, WD2, 0xe0d8c8); a.box(s * (w / 2 - 0.1), 0, -d / 2 + 0.1, 0.16, hB + 0.9, 0.16, WD2, 0xe0d8c8); }
    a.box(0, 0, d / 2 - 0.3, w - 0.2, 1.0, 0.5, WD, 0xc09868, { uv: [1.75, 1.75], keyTop: WD2, tintTop: 0xe8d0a0 });                       // the counter
    a.box(0, 0.02, d / 2 - 0.02, w - 0.2, 0.96, 0.04, CV(), tint);                                                                        // its painted front
    a.roof('shed', 0, hB, 0, w + 0.7, 0.9, d + 1.1, CV(), tint, { under: true, keyUnder: CV(), keyEnd: CV(), tintEnd: CREAM });
    a.box(0, hB - 0.42, d / 2 + 0.54, w + 0.7, 0.4, 0.04, CV(), GOLD);                                                                    // the awning's valance
    a.sign(name, 0, hB + 0.02, d / 2 + 0.58, Math.min(w, name.length * 0.52 + 0.8), 0.72, '#fbeeb8', hex(o.board || 0x4a1614), 'rye');
    for (const y of [1.25, 1.95]) a.box(0, y, -d / 2 + 0.3, w - 0.5, 0.05, 0.42, WD2, 0xd8c098);                                           // two prize shelves
    const PR = o.prizes || [0xe04848, 0x48a0e0, 0xf0c840, 0x58c070, 0xe070b8], m = Math.floor((w - 0.9) / 0.55);
    PR.forEach((t, k) => { const c = Math.floor((m - k + PR.length - 1) / PR.length); if (c > 0) for (const y of [1.3, 2.0]) a.box(-w / 2 + 0.6 + k * 0.55 + (y > 1.5 ? 0.2 : 0), y, -d / 2 + 0.3, 0.3, y > 1.5 ? 0.3 : 0.4, 0.28, 'carpet', t, { n: c, step: [0.55 * PR.length, 0, 0], uv: [0.6, 0.6] }); });
    a.box(0, hB + 0.05, 0, 0.5, 0.06, 0.5, WD2, 0xfff0c0, { glow: 0.9 });                                                                   // a lit bulb board under the awning
    arch('stall:' + id, x, z, rot, a);
    const R = toRoom(x, z, rot), p = R(-w / 2, -0.05), q = R(w / 2, -0.05); ghost(p[0], p[1], q[0], q[1], 2.6, d);
    return { at: R, rot, w, d, top: 1.02 };
}

/* A CAGE WAGON BODY on skids: bars front and back, painted ends, a scrolled roof board */
function cage(id, x, z, rot, w, name, tint) {
    const a = sheet(), d = 3.0, hF = 0.5, hB = 2.3;
    a.box(0, 0, 0, w, hF, d, WD, tint, { uv: [1.75, 1.75], keyTop: PLANK, tintTop: 0xb09870 });
    for (const s of [-1, 1]) { a.box(-w / 2 + 0.24, hF, s * (d / 2 - 0.05), 0.05, hB, 0.05, RIB, 0x30302c, { n: Math.floor(w / 0.24) - 1, step: [0.24, 0, 0] }); }
    for (const s of [-1, 1]) { a.box(s * (w / 2 - 0.06), hF, 0, 0.12, hB, d, WD, CREAM, { uv: [1.75, 1.75] }); a.box(s * (w / 2 + 0.01), hF + 0.3, 0, 0.02, hB - 0.6, d - 0.7, CV(), tint); }
    a.box(0, hF + hB, 0, w + 0.4, 0.3, d + 0.4, WD, tint, { uv: [1.75, 1.75] }); a.box(0, hF + hB + 0.3, 0, w + 0.1, 0.08, d + 0.1, WD2, GOLD);
    for (const s of [-1, 1]) a.sign(name, 0, hF + hB + 0.38, s * (d / 2 + 0.22), Math.min(w, name.length * 0.5 + 0.8), 0.7, '#fbeeb8', '#3a1210', 'rye', s < 0 ? { ry: 180 } : null);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) a.dome(sx * (w / 2 - 0.9), 0, sz * (d / 2 + 0.06), 0.62, 0.62, WD2, GOLD, { rz: 0.07, seg: 12, rings: 3 });           // the wheels, half in the sand
    arch('cage:' + id, x, z, rot, a);
    const R = toRoom(x, z, rot), p = R(-w / 2, 0), q = R(w / 2, 0); ghost(p[0], p[1], q[0], q[1], 2.8, d);
}

exports.buildings = ctx => { bind(ctx);
    /* THE BIG TOP: the square hall you walk in (7 x 7 squares) under a ROUND striped tent 35 m across: sixteen gores, a two-step cone, king
       poles, a cloth tunnel to the door. A ghost ring on the cloth keeps the walker out of the gap between the round wall and the hall. */
    BIGTOP = building('bigtop', [26, 14, 33, 21, 'W'], 14, { storeys: 1, leaf: 'leaf_frame_only', leafDouble: true, keyIn: PLAS, floorIn: 'dirt_2' }, (a, w, d, door) => {
        const R0 = 17.5, N = 16, hW = 6;
        gores(a, 0, R0, R0, hW, N, RED, CREAM, null, [3]); gores(a, 3.3, R0, R0, hW - 3.3, N, RED, CREAM, { a0: 3.5 * 360 / N }, [0, 1, 2, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
        gores(a, hW, R0 + 0.9, 6.2, 7.6, N, RED, CREAM, { roof: true }); gores(a, 13.4, 6.6, 0.25, 4.4, N, CREAM, RED, { roof: true });
        a.cyl(0, hW - 0.55, 0, R0 + 0.95, 0.6, CV(), GOLD, { cap: false, seg: 48, roof: true }); a.cyl(0, 13.25, 0, 6.65, 0.4, CV(), GOLD, { cap: false, seg: 32, roof: true });
        a.cyl(0, 0, 0, 0.1, hW + 0.5, WD2, 0xd8d0c0, { seg: 6, ring: { n: N, r: R0 + 0.12, a0: 11.25 } });                                    // the side poles on the seams
        for (const s of [-1, 1]) { a.cyl(s * 6.9, 13.0, 0, 0.14, 7.8, 'aluminium', 0xd8d8d8, { roof: true, seg: 8 }); a.box(s * 6.9 + 0.85, 19.9, 0, 1.7, 0.85, 0.04, CV(), s > 0 ? GOLD : BLUE, { roof: true, glow: 0.3 }); }
        a.cyl(0, 17.6, 0, 0.12, 4.6, 'aluminium', 0xd8d8d8, { roof: true, seg: 8 }); a.box(1.1, 21.0, 0, 2.2, 1.1, 0.04, CV(), RED, { roof: true, glow: 0.3 });
        /* the way in: a cloth tunnel from the round wall to the hall's door, a painted front over it */
        const tx = door.lx, tw = 2.2, z0 = d / 2 + 0.05, z1 = 17.9;
        for (const s of [-1, 1]) { a.box(tx + s * tw, 0, (z0 + z1) / 2, 0.08, 3.3, z1 - z0, CV(), CREAM, { uv: [3.5, 3.5], ds: true }); stripesZ(a, z0, z1, 0, 3.3, tx + s * (tw - 0.06), RED); }
        a.box(tx, 3.3, (z0 + z1) / 2, 2 * tw + 0.1, 0.08, z1 - z0, CV(), RED, { under: true, keyUnder: CV() });
        for (const s of [-1, 1]) a.cyl(tx + s * (tw + 0.5), 0, z1 + 0.3, 0.3, 6.4, CV(), CREAM, { seg: 10, uv: [1.75, 1.75] });
        for (const s of [-1, 1]) gores(a, 0, 0.31, 0.31, 6.4, 8, RED, RED, { seg: 16 }, [0, 2, 4, 6], tx + s * (tw + 0.5), z1 + 0.3);
        for (const s of [-1, 1]) a.cyl(tx + s * (tw + 0.5), 6.4, z1 + 0.3, 0.5, 1.2, CV(), GOLD, { r2: 0.02, seg: 10 });
        a.box(tx, 3.4, z1 + 0.3, 2 * tw + 1.0, 2.5, 0.3, WD, RED, { uv: [1.75, 1.75] }); a.box(tx, 5.9, z1 + 0.3, 2 * tw + 1.5, 0.22, 0.44, WD2, GOLD);
        a.sign('BIG TOP', tx, 4.0, z1 + 0.47, 2 * tw + 0.4, 1.5, '#f8e6a8', '#7a1c18', 'rye');
        a.box(tx - tw - 0.05, 3.42, z1 + 0.47, 0.1, 0.1, 0.06, null, 0xfff0c0, { glow: 1, n: 16, step: [0.31, 0, 0] });                          // a row of bulbs under the board
        /* ── INSIDE (pass 2): a round cloth wall and a cloth cone seen from within, the ring, two banks of seats, the band's stand, the rigging ── */
        const g = 0.6, RI = 12.1, A = 360 / N;
        a.cyl(0, 0, 0, RI, 0.03, 'dirt_2', 0xe8cfa0, { seg: 32, glow: 0.4, uv: [3.5, 3.5] }); a.cyl(0, 13.2, 0, 1.4, 0.1, PLAS, GOLD, { seg: 16, glow: 0.6, under: true });
        for (let i = 0; i < N; i++) { const dr = i === 3; a.cyl(0, dr ? 2.5 : 0, 0, RI + 0.04, dr ? 4.5 : 7, PLAS, i % 2 ? RED : CREAM, { ri: RI, arc: A, a0: (i + 0.5) * A, cap: false, seg: 32, glow: g, uv: [3.5, 3.5] });
            a.cyl(0, 6.95, 0, RI + 0.34, 6.3, PLAS, i % 2 ? RED : CREAM, { r2: 1.3, ri: RI + 0.3, arc: A, a0: (i + 0.5) * A, cap: false, seg: 32, glow: 0.55, uv: [3.5, 3.5] }); }
        a.cyl(0, 6.8, 0, RI + 0.02, 0.4, PLAS, GOLD, { ri: RI - 0.03, cap: false, seg: 48, glow: 0.6 });
        a.cyl(0, 0, 0, 5.85, 0.06, 'desert', 0xf2dc98, { seg: 32, glow: 0.4, uv: [3.5, 3.5] });                                                 // the sawdust
        a.cyl(0, 0, 0, 6.2, 0.4, PLAS, RED, { ri: 5.85, seg: 32, glow: g, tintTop: GOLD });                                                      // the ring's curb
        a.box(0, 0.4, 0, 0.1, 0.1, 0.1, null, 0xfff0c0, { glow: 1, ring: { n: 40, r: 6.03 } });
        for (const a0 of [115, 295]) for (let k = 0; k < 4; k++) a.cyl(0, 0, 0, 8.65 + k * 1.05, 0.45 * (k + 1), WD, k % 2 ? 0xb89068 : 0xa87c58, { ri: 7.6 + k * 1.05, arc: 130, a0, seg: 32, glow: g, keyTop: PLANK, tintTop: 0xdcc8a0, uv: [1.75, 1.75] });
        for (const a0 of [115, 295]) a.cyl(0, 0, 0, 7.63, 0.45, PLAS, BLUE, { ri: 7.58, arc: 130, a0, seg: 32, glow: g, cap: false });
        a.box(0, 0, -10.1, 6.6, 0.5, 2.7, WD, 0xa84038, { keyTop: PLANK, tintTop: 0xdcc8a0, glow: g, uv: [1.75, 1.75] }); a.box(0, 0.5, -11.5, 6.6, 4.6, 0.06, PLAS, PURP, { glow: g });  // the band's stand and its cloth
        a.box(0, 5.1, -11.46, 6.9, 0.3, 0.1, WD2, GOLD, { glow: 0.6 }); a.box(-3.0, 4.9, -11.4, 0.1, 0.1, 0.08, null, 0xfff0c0, { glow: 1, n: 16, step: [0.4, 0, 0] });
        for (const s of [-1, 1]) { a.cyl(s * 6.9, 0, 0, 0.16, 13.2, WD2, 0xe0d8c8, { seg: 8, glow: 0.35 }); a.box(s * 6.9, 8, 0, 1.5, 0.1, 1.5, PLANK, 0xdcc8a0, { glow: g, under: true });
            a.box(s * 7.25, 0.3, 0.55, 0.42, 0.04, 0.04, WD2, 0xe8e0d0, { glow: g, n: 25, step: [0, 0.31, 0] }); for (const q of [-1, 1]) a.box(s * 7.25 + q * 0.21, 0, 0.55, 0.04, 8, 0.04, WD2, 0xe8e0d0, { glow: g });
            a.box(s * 6.9, 9.6, 0, 0.1, 0.1, 0.1, null, 0xfff0c0, { glow: 1 }); }
        a.box(0, 8.12, 0, 13.8, 0.035, 0.035, WD2, 0xf0e8d8, { glow: 0.7 });                                                                    // the high wire
        for (const z of [-3.2, 3.2]) { for (const q of [-0.6, 0.6]) a.cyl(q, 7.6, z, 0.02, 4.2, WD2, 0xe8e0d0, { seg: 4, glow: 0.5 }); a.box(0, 7.6, z, 1.3, 0.05, 0.05, WD2, GOLD, { glow: 0.6 }); }   // two trapezes
        for (let k = 0; k < 8; k++) { const t = (k * 45 + 22.5) * Math.PI / 180, n = 18, x0 = Math.cos(t) * 1.4, z0 = Math.sin(t) * 1.4, x1 = Math.cos(t) * 11.6, z1b = Math.sin(t) * 11.6;
            a.box(x0, 12.2, z0, 0.1, 0.1, 0.1, null, k % 2 ? 0xfff0c0 : 0xffd890, { glow: 1, n, step: [r2((x1 - x0) / n), r2(-4.9 / n), r2((z1b - z0) / n)] }); }
        lift(a);
    });
    { const R0 = 17.5, N = 16, V = i => { const t = (i + 0.5) * 2 * Math.PI / N; return BIGTOP.at(Math.cos(t) * R0, Math.sin(t) * R0); };
      for (let i = 0; i < N; i++) { if (i === 3) continue; const p = V(i), q = V(i + 1); ghost(p[0], p[1], q[0], q[1], 5, 0.4); }
      const tx = BIGTOP.door.lx, at = BIGTOP.at; for (const s of [-1, 1]) { const p = at(tx + s * 2.3, 12.3), q = at(tx + s * 2.3, 18.1); ghost(p[0], p[1], q[0], q[1], 3.3, 0.3); }
      const p = at(tx + 2.3, 17.1), q = at(3.5, 17.1); ghost(p[0], p[1], q[0], q[1], 5, 0.4); const p2 = at(tx - 2.3, 17.1), q2 = at(-3.5, 17.1); ghost(p2[0], p2[1], q2[0], q2[1], 5, 0.4);
      /* inside: the round cloth wall, the two banks of seats (front + both ends), the band's stand (0.5 m: it is climbed) */
      const W = (r, deg) => { const t = deg * Math.PI / 180; return at(Math.cos(t) * r, Math.sin(t) * r); };
      for (let i = 0; i < N; i++) { if (i === 3) continue; const a0 = W(12.25, (i + 0.5) * 22.5), a1 = W(12.25, (i + 1.5) * 22.5); ghost(a0[0], a0[1], a1[0], a1[1], 5, 0.3); }
      for (const c of [115, 295]) { for (let k = 0; k < 4; k++) { const a0 = W(7.75, c + k * 32.5), a1 = W(7.75, c + (k + 1) * 32.5); ghost(a0[0], a0[1], a1[0], a1[1], 1.9, 0.5); }
        for (const e of [c, c + 130]) { const a0 = W(7.6, e), a1 = W(11.9, e); ghost(a0[0], a0[1], a1[0], a1[1], 1.9, 0.3); } }
      { const a0 = at(-3.3, -10.1), a1 = at(3.3, -10.1); ghost(a0[0], a0[1], a1[0], a1[1], 0.5, 2.7); } }

    /* THE HALL OF MIRRORS: a walk-in funhouse now (4 x 5 squares, its front on the forecourt by the gate). The Mandela Room's door stands where
       it stood, on the hall's west wall. */
    MIRRORS = building('mirrors', [44, 25, 48, 30, 'S'], 7, { leaf: 'leaf_frame_only', leafDouble: true, keyIn: 'checkerboard', floorIn: 'checkerboard' }, (a, w, d, door) => {
        a.shell(w, 7, d, WD, 0xb89ad0, door, [3.5, 1.75]);
        a.box(0, 7, 0.0, w + 0.3, 0.3, d + 0.3, WD2, 0x4a3260, { roof: true });
        a.box(0, 7, d / 2 + 0.05, w + 0.6, 2.4, 0.3, WD, PURP, { uv: [3.5, 1.75] }); a.box(0, 9.4, d / 2 + 0.05, w + 1.0, 0.25, 0.5, WD2, GOLD);       // a false front over the roof line
        a.sign('HALL OF MIRRORS', 0, 7.5, d / 2 + 0.22, w - 0.6, 1.5, '#f6ecff', '#3a2450', 'rye');
        { const X = -(w / 2 + 0.1), Z = d / 2 + 0.1; gores(a, 0, 0.95, 0.95, 9.0, 8, PURP, CREAM, { seg: 16 }, null, X, Z); a.cyl(X, 9.0, Z, 1.3, 2.6, CV(), GOLD, { r2: 0.02, seg: 12 }); flagpole(a, X, Z, 13.2, TEAL); }
        for (const x of [-4.6, 4.2]) { a.box(x, 0.7, d / 2 + 0.1, 2.3, 3.4, 0.08, WD2, GOLD); a.box(x, 0.85, d / 2 + 0.15, 2.0, 3.1, 0.05, 'aluminium', 0xdfeaf2, { glow: 0.45 }); }                 // two tall mirrors on the front
        a.box(door.lx, 2.35, d / 2 + 0.12, door.cw + 1.4, 0.9, 0.2, WD, RED, { uv: [1.75, 1.75] }); a.sign('THIS WAY IN', door.lx, 2.5, d / 2 + 0.24, door.cw + 1.0, 0.6, '#f8e6a8', '#7a1c18', 'rye');
        a.box(door.lx - door.cw / 2 - 0.6, 3.3, d / 2 + 0.26, 0.1, 0.1, 0.06, null, 0xfff0c0, { glow: 1, n: 12, step: [0.3, 0, 0] });
        stripesZ(a, -d / 2, d / 2, 0, 7, w / 2 + 0.09, 0x8a6ab0); stripesZ(a, -d / 2, d / 2, 0, 7, -w / 2 - 0.09, 0x8a6ab0);
        /* ── INSIDE (pass 2): a mirror maze on the square lines, mirrors on every wall, a low lit ceiling ── */
        const iw = w / 2 - 0.36, il = d / 2 - 0.36, MT = [0xe2f0fa, 0xf6e2f0, 0xe2f8ea, 0xf8f2dc], LX = i => -w / 2 + i * 3.5, LZ = j => -d / 2 + j * 3.5, mir = (x, z, alongX, k) => {
            a.box(x, 0.12, z, alongX ? 3.0 : 0.05, 3.2, alongX ? 0.05 : 3.0, GLS, MT[k % 4], { glow: 0.7, uv: 'fit', kind: 'wall', win: 'keep' }); a.box(x, 0, z, alongX ? 3.3 : 0.03, 3.5, alongX ? 0.03 : 3.3, 'gold', 0xffffff, { glow: 0.5, uv: [1.75, 1.75] }); };
        a.box(0, 0, 0, 2 * iw, 0.05, 2 * il, 'checkerboard', 0xffffff, { sides: false, glow: 0.5, uv: [3.5, 3.5] });
        for (let i = 0; i < 4; i++) { mir(LX(i) + 1.75, -il, true, i); if (i !== 1) mir(LX(i) + 1.75, il, true, i + 1); }
        for (let j = 0; j < 5; j++) for (const sd of [-1, 1]) mir(sd * iw, LZ(j) + 1.75, false, j + (sd > 0 ? 2 : 0));
        mazeWalls(w, d).forEach((q, k) => { const ax = q[1] === q[3], x = (q[0] + q[2]) / 2, z = (q[1] + q[3]) / 2;
            a.box(x, 0, z, ax ? 3.5 : 0.16, 3.5, ax ? 0.16 : 3.5, 'gold', 0xffffff, { glow: 0.5, uv: [1.75, 1.75] }); for (const sd of [-1, 1]) a.box(x + (ax ? 0 : sd * 0.09), 0.14, z + (ax ? sd * 0.09 : 0), ax ? 3.1 : 0.02, 3.2, ax ? 0.02 : 3.1, GLS, MT[(k + (sd > 0 ? 1 : 0)) % 4], { glow: 0.7, uv: 'fit', kind: 'wall', win: 'keep' }); });
        a.box(0, 3.9, 0, 2 * iw, 0.02, 2 * il, 'diamond', 0x9a78c8, { sides: false, top: false, under: true, glow: 0.5, uv: [3.5, 3.5] });
        for (let j = 0; j < 5; j++) a.box(LX(0) + 1.75, 3.78, LZ(j) + 1.75, 0.1, 0.1, 0.1, null, 0xfff0c0, { glow: 1, n: 4, step: [3.5, 0, 0] });
        for (const sd of [-1, 1]) a.box(sd * iw, 3.5, 0, 0.04, 0.4, 2 * il, PLAS, PURP, { glow: 0.5 }); for (const sd of [-1, 1]) a.box(0, 3.5, sd * il, 2 * iw, 0.4, 0.04, PLAS, PURP, { glow: 0.5 });
        lift(a); });

    /* THE PENNY ARCADE (the Midway) and THE SIDESHOW (by the Lady Who Knows): two cloth halls you walk in */
    ARCADE = building('arcade', [20, 12, 24, 16, 'W'], 3.6, { leaf: 'leaf_frame_only', leafDouble: true, keyIn: PLAS, floorIn: PLANK }, (a, w, d, door) => { marquee(a, w, d, door, { name: 'PENNY ARCADE', tint: BLUE, h: 3.6, ink: '#fff2b0', board: '#16305a' });
        const I = tentInside(a, 'arcade', w, d, 3.6, door, BLUE);
        I.solid(I.X(0), I.Z(3), 2.7, 0.8, 1.02, WD, 0xb08a60, { keyTop: WD2, tintTop: 0xe8d0a0 }); a.box(I.X(0), 0.02, I.Z(3) - 0.42, 2.7, 0.98, 0.03, PLAS, BLUE, { glow: I.g });    // the change counter (square 0, 3)
        for (const y of [1.3, 1.95, 2.6]) a.box(-I.iw + 0.24, y, I.Z(3), 0.4, 0.05, 2.6, WD2, 0xd8c098, { glow: I.g });
        [0xe04848, 0x48a0e0, 0xf0c840, 0x58c070].forEach((t, k) => { for (const y of [1.35, 2.0, 2.65]) a.box(-I.iw + 0.24, y, I.Z(3) - 1.1 + k * 0.5 + (y > 1.9 && y < 2.3 ? 0.2 : 0), 0.28, 0.34, 0.28, 'carpet', t, { n: 2, step: [0, 0, 1.0], uv: [0.6, 0.6] }); });
        a.sign('PRIZES', -I.iw + 0.06, 3.0, I.Z(3), 2.2, 0.3, '#fff2b0', '#16305a', 'rye', { ry: 90 });
        lift(a); });
    SIDESHOW = building('sideshow', [26, 33, 31, 36, 'N'], 3.6, { leaf: 'leaf_frame_only', leafDouble: true, keyIn: PLAS, floorIn: PLANK }, (a, w, d, door) => { marquee(a, w, d, door, { name: 'SIDESHOW', tint: PURP, h: 3.6, ink: '#fff2b0', board: '#3a2450', signW: 6 });
        const I = tentInside(a, 'sideshow', w, d, 3.6, door, PURP);
        for (let i = 0; i < 5; i++) { a.box(I.X(i), 0, I.Z(0) - 0.3, 2.7, 0.3, 2.2, WD, 0xa84038, { glow: I.g, keyTop: PLANK, tintTop: 0xdcc8a0, uv: [1.75, 1.75] }); a.box(I.X(i), 0.3, I.Z(0) + 0.78, 2.7, 0.04, 0.05, WD2, GOLD, { glow: 0.6 });
            a.box(I.X(i), 0.34, -I.il + 0.06, 2.5, 2.7, 0.03, 'damask', [0x8a4a6a, 0x5a4a8a, 0x8a3a3a, 0x4a6a8a, 0x6a5a3a][i], { glow: I.g, uv: [1.75, 1.75] }); }
        a.sign('ODDITIES', 0, 3.02, -I.il + 0.1, 5.2, 0.28, '#fff2b0', '#3a2450', 'rye');
        lift(a); });
};

exports.furnish = ctx => { bind(ctx);
    /* a prop inside wears `floor: true` (without it a prop by a wall or a ghost block stands on top of it); `y` under 1 m lifts */
    const inn = (B, key, lx, lz, o) => put(B, key, lx, lz, Object.assign({ floor: true }, o || {}));
    const sqx = (B, i) => -B.fw / 2 + (i + 0.5) * 3.5, sqz = (B, j) => -B.fd / 2 + (j + 0.5) * 3.5, at = (B, key, i, j, o) => inn(B, key, sqx(B, i), sqz(B, j), o);
    fitGhosts(ARCADE, 'arcade'); fitGhosts(SIDESHOW, 'sideshow');
    mazeWalls(MIRRORS.fw, MIRRORS.fd).forEach(q => { const p = MIRRORS.at(q[0], q[1]), e = MIRRORS.at(q[2], q[3]); ghost(p[0], p[1], e[0], e[1], 3.5, 0.2); });

    /* THE BIG TOP: the ring's tubs and ball, the cannon, the band on its stand, two follow spots by the way in, ropes at the door */
    inn(BIGTOP, 'rug_round', 0, 0, { y: 0.05 }); put(BIGTOP, 'mirror_ball', 0, 0, { y: 9.4 });
    inn(BIGTOP, 'decor_armour_plinth', 2.6, 1.6, {}); inn(BIGTOP, 'decor_armour_plinth', -2.6, 1.6, {}); inn(BIGTOP, 'decor_armour_plinth', 0, -3.1, {}); inn(BIGTOP, 'beach_ball', 2.6, 1.6, { y: 0.68 });
    inn(BIGTOP, 'ship_cannon', -4.4, -7.0, { face: 150 }); inn(BIGTOP, 'psx_metal_barrel_mp_1', -5.9, -6.2, {}); inn(BIGTOP, 'hw_straw', 5.2, -7.2, { face: 30 }); inn(BIGTOP, 'hw_straw_2', 6.0, -6.1, { face: 100 });
    inn(BIGTOP, 'drum_kit', 0.2, -10.3, { y: 0.5, face: 180 }); inn(BIGTOP, 'instrument_drum', 2.4, -9.6, { y: 0.5, face: 200 }); inn(BIGTOP, 'decor_piano', -2.3, -10.5, { y: 0.5, face: 180 });
    inn(BIGTOP, 'music_stand', 1.5, -9.3, { y: 0.5, face: 180 }); inn(BIGTOP, 'meshy_trumpet', 2.6, -10.6, { y: 0.55 }); inn(BIGTOP, 'pa_speaker', -3.9, -9.2, { face: 180, noLight: true }); inn(BIGTOP, 'pa_speaker', 3.9, -9.2, { face: 180, noLight: true });
    inn(BIGTOP, 'followspot', 3.4, 10.4, { face: 20, noLight: true }); inn(BIGTOP, 'followspot', -5.2, 10.2, { face: 340, noLight: true });
    for (const z of [9.0, 7.2]) for (const x of [-2.5, 0.8]) inn(BIGTOP, 'rope_stanchion', x, z, {});
    inn(BIGTOP, 'library_ladder', 6.9, -1.6, { face: 90 }); inn(BIGTOP, 'ball_cart', -6.9, 2.0, {});

    /* THE PENNY ARCADE (4 x 4): a machine on the middle of each wall square; the door square (1, 3), the middle and the aisle stay clear */
    at(ARCADE, 'arcade_cabinet', 0, 0, { face: 180, noLight: true }); at(ARCADE, 'pinball_machine', 1, 0, { face: 180, noLight: true }); at(ARCADE, 'arcade_cabinet', 2, 0, { face: 180, noLight: true }); at(ARCADE, 'claw_machine', 3, 0, { face: 180, noLight: true });
    at(ARCADE, 'pinball_machine', 0, 1, { face: 90, noLight: true }); at(ARCADE, 'jukebox', 0, 2, { face: 90, noLight: true }); at(ARCADE, 'slot_machine', 3, 1, { face: 270, noLight: true }); at(ARCADE, 'money_wheel', 3, 2, { face: 270, noLight: true });
    at(ARCADE, 'air_hockey_table', 2, 1, {}); at(ARCADE, 'claw_machine', 3, 3, { face: 270, noLight: true });
    inn(ARCADE, 'cash_register', sqx(ARCADE, 0) + 0.5, sqz(ARCADE, 3), { y: 1.03, face: 0 }); inn(ARCADE, 'bar_stool', sqx(ARCADE, 0) - 0.3, sqz(ARCADE, 3) + 0.9, {}); inn(ARCADE, 'trash_bin', sqx(ARCADE, 2) - 1.2, sqz(ARCADE, 3) + 1.1, {});

    /* THE SIDESHOW (5 x 3): five things on a red step along the back row, one to a square; two more on the end squares; ropes before them */
    at(SIDESHOW, 'specimen_shelf', 0, 0, { y: 0.3, face: 180 }); at(SIDESHOW, 'anatomy_skeleton', 1, 0, { y: 0.3, face: 180 }); at(SIDESHOW, 'trap_iron_maiden', 2, 0, { y: 0.3, face: 180 }); at(SIDESHOW, 'dream_eye', 3, 0, { y: 0.3, face: 180, noLight: true }); at(SIDESHOW, 'museum_vitrine', 4, 0, { y: 0.3, face: 180 });
    inn(SIDESHOW, 'skull', sqx(SIDESHOW, 4), sqz(SIDESHOW, 0), { y: 1.3 }); at(SIDESHOW, 'meshy_tesla_coil', 0, 1, { noLight: true }); at(SIDESHOW, 'giant_hourglass', 4, 1, {}); at(SIDESHOW, 'bird_cage', 4, 2, {}); inn(SIDESHOW, 'crow', sqx(SIDESHOW, 4), sqz(SIDESHOW, 2), { y: 0.9 });
    for (let i = 0; i < 5; i++) inn(SIDESHOW, 'rope_stanchion', sqx(SIDESHOW, i) - 1.3, sqz(SIDESHOW, 0) + 1.55, {}); inn(SIDESHOW, 'rope_stanchion', sqx(SIDESHOW, 4) + 1.3, sqz(SIDESHOW, 0) + 1.55, {});
    inn(SIDESHOW, 'mugshot_wall', sqx(SIDESHOW, 0) - 1.3, sqz(SIDESHOW, 2) + 0.4, { face: 90 }); inn(SIDESHOW, 'candelabra', sqx(SIDESHOW, 1) - 1.2, sqz(SIDESHOW, 2) + 1.1, { noLight: true });

    /* THE HALL OF MIRRORS: the last square of the maze */
    at(MIRRORS, 'dream_eye', 3, 0, { noLight: true }); put(MIRRORS, 'mirror_ball', sqx(MIRRORS, 3), sqz(MIRRORS, 0), { y: 3.1 }); inn(MIRRORS, 'lava_lamp_floor', sqx(MIRRORS, 2) + 1.1, sqz(MIRRORS, 2) - 1.1, { noLight: true });
};

exports.ground = ctx => { bind(ctx);
    /* ── THE CIRCUS (the old carnival, HQ Room 1893, moved out here: its pieces, its people and their own lines) ── */
    /* THE GROUND: the midway is a four-square dirt street, the stalls and the rides stand on planks */
    for (let y = 12; y < 24; y++) { setPaint(16, y, 'dirt_2'); setPaint(19, y, 'dirt_2'); }
    for (let x = 19; x < 25; x++) for (const y of [16, 19]) setPaint(x, y, 'dirt_2');
    for (let x = 43; x < 48; x++) for (let y = 30; y < 31; y++) setPaint(x, y, 'dirt_2');
    for (let x = 39; x < 46; x++) for (let y = 0; y < 4; y++) setPaint(x, y, PLANK);
    for (let x = 43; x < 48; x++) for (let y = 13; y < 17; y++) setPaint(x, y, PLANK);

    /* THE WHEEL (it faces the grounds now) and THE HORSES */
    Pm('ferris_wheel', gx(42), gx(2), { face: 90 }); setRect(39, 1, 45, 3, 'B');
    stall('wheel', 38, 4, 1, 'S', 'WHEEL', TEAL);
    Pm('carousel', gx(45.5), gx(15), {}); setRect(43, 13, 48, 17, 'B');
    stall('horses', 42, 17, 1, 'W', 'RIDE', TEAL);

    /* THE ANIMALS: the horse ring, the big animals' yard, the lion's cage wagon */
    pen(13, 0, 16, 3); pen(19, 0, 22, 3); P('horse', 14, 1, { face: 150 }); P('horse_black', 15, 2, { face: 250 }); P('elephant', 20, 1, { face: 200 }); P('giraffe', 21, 2, { face: 160 });
    cage('lion', gx(14), gc(8), 180, 6.6, 'THE LION', RED); Pm('lion', gx(14), gc(8), { face: 90, y: 0.5, floor: true });
    dec('psx_wooden_crate_2', 17, 2); dec('meshy_burlap_sack', 18, 3);

    /* THE WAGONS */
    Pm('carnival_tent', gx(26), gx(2), { face: 180 }); Pm('carnival_tent', gx(34), gx(2), { face: 180 }); Pm('trailer_home_6', gx(30), gx(4) - 0.5, { face: 0 }); dec('psx_wooden_crate_3', 29, 6); dec('instrument_tambourine', 33, 5);

    /* THE MIDWAY: stalls both sides of the dirt street, the food carts by the big top's way in */
    stall('ringtoss', 15, 12, 2, 'E', 'RING TOSS', RED); stall('bottles', 15, 14, 2, 'E', 'BOTTLE TOSS', BLUE); stall('candy', 15, 19, 2, 'E', 'CANDY', PURP, { prizes: [0xf070a0, 0xf8f0e0, 0x70d0e0, 0xf0d050] });
    stall('cans', 20, 19, 2, 'N', 'CAN TOSS', TEAL); stall('wheel2', 22, 19, 2, 'N', 'LUCKY WHEEL', RED);
    P('popcorn_cart', 15, 17, { face: 90, noLight: true }); P('hot_dog_stand', 21, 16, { face: 180 });
    Pm('carnival_tent', gx(14), gx(23), { face: 90 }); P('high_striker', 19, 22, { h: 6.5, face: 270 });
    P('park_bench', 16, 16, { face: 90 }); P('park_bench', 23, 16, { face: 180 }); dec('trash_bin', 16, 18); dec('beach_ball', 19, 20);

    /* THE TICKET BOOTH and THE LADY WHO KNOWS */
    Pm('ticket_booth', gc(15), gc(29), { h: 3.0, face: 180 });
    Pm('fortune_tent', gc(27), gc(27), { h: 5.2, face: 180 }); feat({ k: 'pool', x: gx(33), z: gx(28), r: 3.4, rz: 3.4, y: -0.2, depth: 1.4, key: 'water', bank: 0.8 }); pen(31, 26, 34, 29);
    P('park_bench', 36, 28, { face: 270 }); dec('trash_bin', 38, 25); P('paper_lantern', 42, 22, { y: 2.2 });

    /* THE GATE (the road in from the highway's Exit 2): two striped towers, the name over the road */
    { const a = sheet(), X = 5.25;
      for (const s of [-1, 1]) { gores(a, 0, 1.4, 1.4, 7, 8, RED, CREAM, { seg: 16 }, null, s * X, 0);
        a.cyl(s * X, 7, 0, 1.9, 2.8, CV(), GOLD, { r2: 0.02, seg: 12 }); a.cyl(s * X, 6.7, 0, 1.6, 0.3, WD2, GOLD, { seg: 12 }); flagpole(a, s * X, 0, 12.4, s > 0 ? RED : BLUE);
        a.box(s * X, 1.2, 1.42, 1.0, 1.1, 0.06, GLS, 0x20262c, { uv: 'fit' }); a.sign('TICKETS', s * X, 2.4, 1.44, 1.9, 0.5, '#fbeeb8', '#4a1614', 'rye'); }
      a.box(0, 5.0, 0, 2 * X - 2.6, 1.9, 0.36, WD, RED, { uv: [1.75, 1.75] }); a.box(0, 6.9, 0, 2 * X - 2.2, 0.2, 0.5, WD2, GOLD); a.box(0, 4.8, 0, 2 * X - 2.2, 0.2, 0.5, WD2, GOLD);
      a.sign('CIRCUS', 0, 5.15, 0.2, 2 * X - 3.4, 1.6, '#f8e6a8', '#7a1c18', 'rye'); a.sign('CIRCUS', 0, 5.15, -0.2, 2 * X - 3.4, 1.6, '#f8e6a8', '#7a1c18', 'rye', { ry: 180 });
      for (const z of [0.2, -0.2]) a.box(-X + 1.6, 7.1, z, 0.1, 0.1, 0.08, null, 0xfff0c0, { glow: 1, n: 23, step: [0.33, 0, 0] });
      arch('gate', gx(47.5), gx(32), 270, a);
      for (const sy of [30, 33]) ghost(gx(47.5), gc(sy) - 1.4, gx(47.5), gc(sy) + 1.4, 7, 2.8); }

    /* THE FENCE round the grounds (a ranch rail on the block's edge; the gate east, the back gate west) and its flag poles */
    { const e = 0.35, x0 = gx(12) + e, x1 = gx(48) - e, z0 = gx(0) + e, z1 = gx(36) - e, rail = (xa, za, xb, zb) => feat({ k: 'rail', x0: r2(xa), z0: r2(za), x1: r2(xb), z1: r2(zb), model: 'ranch' });
      rail(x0, z0, x1, z0); rail(x1, z0, x1, gx(25)); rail(x1, gx(30), x1, gc(30) - 1.4); rail(x1, gc(33) + 1.4, x1, z1);
      rail(x1, z1, gx(31), z1); rail(gx(26), z1, x0, z1); rail(x0, z1, x0, gx(33)); rail(x0, gx(31), x0, z0);
      const a = sheet(), OX = gx(12), OZ = gx(0), T = [RED, GOLD, BLUE, TEAL];
      let k = 0; for (let x = 12; x <= 48; x += 6) { flagpole(a, gx(x) - OX + (x === 12 ? e : x === 48 ? -e : 0), e, 7.5, T[k++ % 4]); flagpole(a, gx(x) - OX + (x === 12 ? e : x === 48 ? -e : 0), gx(36) - OZ - e, 7.5, T[k++ % 4]); }
      for (let y = 6; y <= 24; y += 6) { flagpole(a, e, gx(y) - OZ, 7.5, T[k++ % 4]); flagpole(a, gx(48) - OX - e, gx(y) - OZ, 7.5, T[k++ % 4]); }
      arch('flags', OX, OZ, 0, a); }

    /* THE BUNTING over the midway and the road in (cords of pennants on poles) */
    { const a = sheet(), OX = gx(12), OZ = gx(0), X = v => gx(v) - OX, Z = v => gx(v) - OZ, pole = (x, z) => a.cyl(x, 0, z, 0.08, 5.4, WD2, 0xd8d0c0, { seg: 6 });
      const YS = [12, 14.4, 16.85, 19.15, 21.6, 24];
      YS.forEach((y, i) => { pole(X(16.15), Z(y)); pole(X(19.85), Z(y)); bunting(a, X(16.15), Z(y), X(19.85), Z(y), 4.9);
        if (i) { bunting(a, X(16.15), Z(YS[i - 1]), X(16.15), Z(y), 4.9, [GOLD, TEAL, RED]); bunting(a, X(19.85), Z(YS[i - 1]), X(19.85), Z(y), 4.9, [BLUE, RED, GOLD]); } });
      for (let x = 34; x <= 46; x += 4) { pole(X(x), Z(30.85)); pole(X(x), Z(33.15)); bunting(a, X(x), Z(30.85), X(x), Z(33.15), 4.9); if (x < 46) { bunting(a, X(x), Z(30.85), X(x + 4), Z(30.85), 4.9, [GOLD, TEAL, RED]); bunting(a, X(x), Z(33.15), X(x + 4), Z(33.15), 4.9, [BLUE, RED, GOLD]); } }
      arch('bunting', OX, OZ, 0, a); }

    native('ringmaster', 23, 17, 270, sayOf(O_CARN, 'ringmaster')); native('clown', 22, 30, 200); native('giant', 19, 21, 270, sayOf(O_CARN, 'giant')); native('fortune teller', 27, 29, 180, sayOf(O_CARN, 'fortune teller'));
    native('mermaid', 35, 27, 270, sayOf(O_CARN, 'mermaid')); native('gnome', 40, 5, 180, sayOf(O_CARN, 'gnome')); native('catgirl', 16, 22, 90, sayOf(O_CARN, 'catgirl'));
};

exports.doors = ctx => { bind(ctx);
    doors.push({ id: 'tunnel', wall: 'free', x: gc(13), z: gc(29), face: 180, leaf: 'leaf_barn', label: 'THE TUNNEL', sub: 'ROOM 1893 · BACK TO THE PLATFORM', action: { room: 'tunnel', at: 'carnival' },
        desc: 'A barn door standing by the ticket booth with nothing behind it but sand. Back to the platform. The train will still be there.' });
    doors.push({ id: 'mirrors', wall: 'free', x: r2(gx(44) - 0.45), z: gx(28), face: 270, leaf: 'leaf_frame_only', label: 'THE MANDELA ROOM', sub: 'ROOM * · IT IS DIFFERENT IN THERE', action: { room: 'mandela', at: 'mirrors' },
        desc: 'The hall of mirrors. It is not a hall and there are no mirrors; it is a room, and it is never the room it was.' });
};
