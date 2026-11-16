/* THE DESERT · WESTERN TOWN (district W, 16 plots) — the district file of `node bake-desert.js` (repo tooling, never uploaded).
   One thread = this one file. The tool, layout.json, the Highway and every shared piece belong to the tool's row on the board (docs/notes/claims.md).

   THE PLOTS (ids + names: docs/areas/desert/layout.json; a plot is 12 x 12 squares of 3.5 m):
     P08-01  Boot Hill                      home squares x 48..60 · y 0..12
     P09-01  The Church                     home squares x 60..72 · y 0..12
     P10-01  The Windmill                   home squares x 72..84 · y 0..12
     P11-01  The Mine                       home squares x 84..96 · y 0..12
     P08-02  The Stables                    home squares x 48..60 · y 12..24
     P09-02  The Saloon                     home squares x 60..72 · y 12..24
     P10-02  The Bank                       home squares x 72..84 · y 12..24
     P11-02  The Hotel                      home squares x 84..96 · y 12..24
     P08-03  The Jail                       home squares x 48..60 · y 24..36
     P09-03  Main Street                    home squares x 60..72 · y 24..36
     P10-03  The General Store              home squares x 72..84 · y 24..36
     P11-03  The Corral                     home squares x 84..96 · y 24..36
     P08-04  The Trail In                   home squares x 48..60 · y 36..48
     P09-04  The Wagon Camp                 home squares x 60..72 · y 36..48
     P10-04  Open range                     home squares x 72..84 · y 36..48
     P11-04  The Canyon                     home squares x 84..96 · y 36..48

   WHAT STANDS HERE TODAY (after THE EXTERIORS PASS, 2026-11-16; seen in the browser):
   - MAIN STREET (squares y 22..25) between two rows of fronts at real scale (7 to 17.5 m wide), a plank boardwalk down each side (rows 21
     and 26), the cross street on x 70..71. Every front is `western()` below (plank walls, false front, porch or balcony, a `rye` sign).
     North row, west to east: LIVERY STABLE (P08-02), BLACKSMITH, SALOON (P09-02, balcony), BARBER, BANK (P10-02), ASSAY OFFICE, TELEGRAPH,
     HOTEL (P11-02, balcony). South row: SHERIFF (P08-03), UNDERTAKER, the open lot with the well and the horse pond (P09-03),
     GENERAL STORE (P10-03), THE CORRAL (P11-03). All twelve are walk-in; the five small trades are new in this pass (generic frontier
     trades, no story names) and hold only a few first pieces.
   - THE CHURCH (P09-01): a narrow whitewashed nave, gable and steeple to the back street. BOOT HILL (P08-01): the hill inside a ranch
     rail, a timber gate with its name, crosses, headstones, grave mounds. THE WINDMILL (P10-01): windpump, well, water tower.
   - THE MINE (P11-01): a timbered adit in the rock (drawn; the rock stops the walker), a narrow track across the back street to a buffer.
   - THE CANYON (P11-04): a box canyon now; its south end is a rock wall (the other end is Giza's Canyon Mouth, far off since the move).
   - THE WAGON CAMP (P09-04): campfire, two tents, two covered wagons. OPEN RANGE (P10-04): skulls, snags. Twelve hitching rails.
   - THE TRAIL IN (P08-04): the way in from the Highway's Exit 3 (the county road and the overpass are the tool's).
   - People: sheriff, two cowboys (one says the old flight line's cowboy line), a skeleton on Boot Hill.

   NEEDS A MODEL (nothing in the packs or the catalogue; no stand-in placed): anvil + forge (the blacksmith has a brazier and barrels only),
   water trough, hay bale, mine cart, pickaxe, wanted poster, tumbleweed, gallows, a canvas prospector's tent (the camp's two are modern
   camping tents), a telegraph key / pole.

   THE INSIDES (after THE INTERIORS PASS, 2026-11-16; seen in the browser bar the hotel's six rooms):
   - `inside()` lines every walk-in (dado, wall band, board ceiling + beams, a lit pane behind each window) and gives `solid` / `counter` /
     `shelves`: drawn fittings that also stop the walker (ghost blocks written in furnish()). Props inside wear `floor: true`.
   - SALOON: long bar + back bar + mirror, stage with the piano, a drawn gallery, card tables, blackjack, roulette, chandelier.
     BANK: tellers' counter under a brass cage, the vault behind. SHERIFF: two barred cells, desk, rifle rack, mugshots.
     GENERAL STORE: counter, shelves of goods on three walls. LIVERY STABLE: four stalls, a hay loft (drawn), straw.
     HOTEL: a 3.4 m ceiling, the lobby, a corridor, six rooms (bed, wardrobe, table, rug). CHURCH: chancel step, altar, cross, pews.
     BLACKSMITH: brick forge + hood. BARBER, ASSAY OFFICE, TELEGRAPH, UNDERTAKER: counter, shelves, their trade's pieces.

   KNOWN MISSING OR WRONG:
   - No upstairs anywhere: the saloon's gallery and the stables' loft are drawn and not reached; the hotel's upper floor is its front only.
     THE MINE has no inside. The hotel's six rooms were not seen on screen (the probe stood in a partition).
   - The insides read dark in the cloud browser even with lit linings (mondo's Firefox renders brighter): judge on his machine.
   - Thin: the south half (The Trail In, Open range, The Canyon's floor) is nearly empty; no lamps, no troughs; the box canyon holds nothing.
   - Fights use the old plateau's table everywhere (data.js HQ_AREA_ENCOUNTERS, not this file's).
   - Door leaves DO draw in the probe here (saloon, church, jail seen 11-16); the open finding in "THE LOOK PASS" is not true of this town.

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
   room square = home square + (48, 12). Keep to your own block; the tool warns about a row outside it.
   REBAKE: node bake-desert.js   (--dry-run prints the counts). Rules: docs/notes/areas-complexes.md "THE DESERT, THE DISTRICT FILES". */
'use strict';
let C, gx, gc, r2, feat, props, doors, npc, count, line, setRect, pen, building, sheet, put, SOLID, P, Pm, dec, native, rnd, setPaint, sayOf, O_GIZA, O_GATE, O_LINE, O_CARN, U, WD, WD2, SHG, FLR, GLS, RIB, COR, CONC, PLAS;
const bind = ctx => ({ C, gx, gc, r2, feat, props, doors, npc, count, line, setRect, pen, building, sheet, put, SOLID, P, Pm, dec, native, rnd, setPaint, sayOf, O_GIZA, O_GATE, O_LINE, O_CARN, U, WD, WD2, SHG, FLR, GLS, RIB, COR, CONC, PLAS } = ctx);
let STABLES, SMITH, SALOON, BARBER, BANK, ASSAY, WIRE, HOTEL, JAIL, COFFINS, STORE, CHURCH;
const PLANKS = 'urban:WoodFlooring1a';
exports.dice = 3308375642;

/* A WESTERN FRONT: plank walls, corner posts, a false front taller than the roof with the name painted on it, a boardwalk porch on the
   square row before the door (posts + a lean-to roof, or a balcony), sash windows. Every one differs: height, colour, front, roof, porch. */
function western(a, w, d, door, o) {
    const h = o.h, tint = o.tint, trim = o.trim || 0x4a3626, rf = o.roofTint || 0x6a5a48, WK = o.key || WD;
    a.shell(w, h, d, WK, tint, door, [3.5, 1.75]);
    a.box(0, 0, 0, w - 0.1, 0.16, d - 0.1, FLR, 0x8c7a62, { uv: [1.75, 1.75] });                                                          // the boards inside, proud of the sand
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) a.box(sx * w / 2, 0, sz * d / 2, 0.32, h, 0.32, WD2, trim);
    a.box(0, h - 0.25, d / 2 + 0.08, w + 0.3, 0.25, 0.2, WD2, trim);
    if (o.roof === 'shed') a.roof('shed', 0, h, 0, w + 0.5, 1.1, d + 0.5, SHG, rf); else if (o.front) a.roof('gable', 0, h, -0.3, d - 0.3, o.rh || Math.max(0.9, Math.min(2.0, o.front - 0.3)), w + 0.5, SHG, rf, { ry: 90, keyEnd: WK, tintEnd: tint });   // behind a false front: lower than it, and it stops at its back (it hid the name)
    else a.roof('gable', 0, h, 0, d + 0.5, o.rh || 2.0, w + 0.5, SHG, rf, { ry: 90, keyEnd: WK, tintEnd: tint });
    if (o.front) { a.box(0, h, d / 2 - 0.05, w + 0.3, o.front, 0.24, WD, tint, { roof: true, uv: [3.5, 1.75] }); a.box(0, h + o.front, d / 2 - 0.05, w + 0.8, 0.26, 0.5, WD2, trim, { roof: true });
        if (o.step) a.box(0, h + o.front + 0.26, d / 2 - 0.05, w * 0.5, o.step, 0.24, WD, tint, { roof: true }); }
    /* the doorway's frame, the windows either side of it (and a row upstairs on a two-storey front) */
    a.box(door.lx - door.cw / 2 - 0.1, 0, d / 2 + 0.1, 0.2, 2.4, 0.2, WD2, trim); a.box(door.lx + door.cw / 2 + 0.1, 0, d / 2 + 0.1, 0.2, 2.4, 0.2, WD2, trim); a.box(door.lx, 2.25, d / 2 + 0.1, door.cw + 0.5, 0.2, 0.2, WD2, trim);
    for (let x = -w / 2 + 1.75; x < w / 2; x += 3.5) { if (Math.abs(x - door.lx) < 1.7) continue;
        a.box(x, 1.0, d / 2 + 0.06, 1.3, 1.4, 0.08, GLS, 0xe0cc98, { glow: 0.35 }); a.box(x, 0.86, d / 2 + 0.12, 1.7, 0.14, 0.16, WD2, trim); a.box(x, 2.4, d / 2 + 0.12, 1.7, 0.14, 0.16, WD2, trim); }
    if (h >= 7) for (let x = -w / 2 + 1.75; x < w / 2; x += 3.5) { a.box(x, 4.5, d / 2 + 0.06, 1.2, 1.5, 0.08, GLS, 0xc8d4e0); a.box(x, 4.36, d / 2 + 0.12, 1.6, 0.14, 0.16, WD2, trim); }
    for (const s of [-1, 1]) for (let z = -d / 2 + 2.6; z < d / 2 - 1; z += 5.25) a.box(s * (w / 2 + 0.06), 1.0, z, 0.08, 1.4, 1.2, GLS, 0xc8d4e0);
    /* the porch */
    if (o.porch !== 'none') { a.box(0, 0, d / 2 + 1.75, w, 0.16, 3.4, FLR, 0x8c7a62);
        const n = Math.max(2, Math.round(w / 3.5)), py = o.porch === 'balcony' ? 3.5 : 2.9;
        for (let i = 0; i <= n; i++) { const x = -w / 2 + 0.25 + i * (w - 0.5) / n; if (Math.abs(x - door.lx) < 0.9) continue; a.box(x, 0, d / 2 + 3.25, 0.2, py, 0.2, WD2, trim); }
        if (o.porch === 'balcony') { a.box(0, 3.5, d / 2 + 1.75, w, 0.16, 3.4, FLR, 0x8c7a62, { under: true }); a.box(0, 3.66, d / 2 + 3.3, w, 0.9, 0.1, WD2, trim);
            for (const s of [-1, 1]) a.box(s * (w / 2 - 0.05), 3.66, d / 2 + 1.75, 0.1, 0.9, 3.3, WD2, trim);
            for (let i = 0; i <= n; i++) a.box(-w / 2 + 0.25 + i * (w - 0.5) / n, 3.66, d / 2 + 3.25, 0.18, 2.9, 0.18, WD2, trim);
            a.roof('shed', 0, 6.55, d / 2 + 1.85, w + 0.6, 0.7, 3.8, SHG, rf); }
        else a.roof('shed', 0, py, d / 2 + 1.85, w + 0.6, 0.8, 3.8, SHG, rf); }
    /* the name */
    if (o.name) { const sw = Math.min(w - 1.2, o.name.length * 0.95 + 1.2), y = o.front ? h + (o.front - 1.0) / 2 : h - 1.25;
        a.sign(o.name, 0, y, d / 2 + (o.front ? 0.09 : 0.12), sw, 1.0, o.ink || '#2a1a10', o.board || '#d8c090', 'rye', o.front ? { roof: true } : null); }
}

/* THE INSIDES (the interiors pass, 2026-11-16). `inside()` lines a walk-in from within, in the same parts list as its front: a dado and a
   wall band 0.34 m in from the row's edge (the room's own wall is at 0.30), a board ceiling with beams, and a lit pane behind every window
   the front draws, so no room is a dark box. It returns `solid(x, z, w, d, h, key, tint)`: a drawn fitting (a counter, a partition, a stall
   wall) that also stops the walker; the ghost blocks are written in furnish(), where the building's handle is known. Everything is in the
   building's frame: x along the front, +z out of the door, y up. */
const INS = {};
function inside(a, id, w, d, h, door, o) {
    const iw = w / 2 - 0.34, il = d / 2 - 0.34, top = (o.ceil || h - 0.36), g = Math.min(0.78, (o.glow == null ? 0.3 : o.glow) * 1.7), dh = o.dadoH == null ? 1.1 : o.dadoH, G = INS[id] = [];
    const band = (y0, y1, key, tint, uv) => { if (y1 <= y0) return; const x = { glow: g, uv: uv || [3.5, 1.75] };
        a.box(0, y0, -il, 2 * iw, y1 - y0, 0.02, key, tint, x); for (const s of [-1, 1]) a.box(s * iw, y0, 0, 0.02, y1 - y0, 2 * il, key, tint, x);
        const l1 = door.lx - door.cw / 2 - 0.14, r0 = door.lx + door.cw / 2 + 0.14;
        a.box((-iw + l1) / 2, y0, il, l1 + iw, y1 - y0, 0.02, key, tint, x); a.box((iw + r0) / 2, y0, il, iw - r0, y1 - y0, 0.02, key, tint, x);
        if (y1 > 2.34) a.box(door.lx, Math.max(y0, 2.34), il, r0 - l1, y1 - Math.max(y0, 2.34), 0.02, key, tint, x); };
    band(0, dh, o.dadoKey || WD2, o.dado == null ? 0x7a5a40 : o.dado); band(dh, top, o.key || WD, o.tint, o.uv);
    a.box(0, top, 0, 2 * iw, 0.02, 2 * il, o.ceilKey || WD2, o.ceilTint == null ? 0x8a6e54 : o.ceilTint, { sides: false, top: false, under: true, glow: g });
    for (let z = -il + 1.75; z < il; z += 3.5) a.box(0, top - 0.2, z, 2 * iw, 0.2, 0.2, WD2, 0x5a4230, { glow: g * 0.6 });
    /* the panes: the same places the front and the side walls draw their windows */
    const pane = (x, y, z, ww, hh, side) => { a.box(x, y, z, side ? 0.03 : ww, hh, side ? ww : 0.03, GLS, 0xfff2cc, { glow: 0.95, uv: 'fit' });
        a.box(x, y - 0.08, z, side ? 0.1 : ww + 0.3, 0.08, side ? ww + 0.3 : 0.1, WD2, 0x4a3626, { glow: g }); a.box(x, y + hh, z, side ? 0.1 : ww + 0.3, 0.08, side ? ww + 0.3 : 0.1, WD2, 0x4a3626, { glow: g }); };
    if (top > 2.6) { for (let x = -w / 2 + 1.75; x < w / 2; x += 3.5) if (Math.abs(x - door.lx) >= 1.7) pane(x, 1.0, il - 0.03, 1.3, 1.4, false);
        for (const s of [-1, 1]) for (let z = -d / 2 + 2.6; z < d / 2 - 1; z += 5.25) pane(s * (iw - 0.03), 1.0, z, 1.2, 1.4, true); }
    const solid = (x, z, sw, sd, sh, key, tint, x2) => { a.box(x, (x2 && x2.y) || 0, z, sw, sh, sd, key || WD2, tint == null ? 0x7a5a40 : tint, Object.assign({ glow: g }, x2 && x2.o)); G.push([x, z, sw, sd, sh + ((x2 && x2.y) || 0)]); };
    /* a shop counter: a panelled body, a darker top that oversails it */
    const counter = (x, z, len, alongZ, tint) => { const cw = alongZ ? 0.75 : len, cd = alongZ ? len : 0.75; solid(x, z, cw, cd, 1.02, WD, tint == null ? 0x8a6444 : tint);
        a.box(x, 1.02, z, cw + 0.16, 0.07, cd + 0.16, WD2, 0x4a3020, { glow: g }); };
    /* shelves on a wall: a back board, planks, a row of goods on each (`goods` = tints) */
    const shelves = (x, z, len, alongZ, hh, goods) => { const bw = alongZ ? 0.06 : len, bd = alongZ ? len : 0.06; a.box(x, 0.3, z, bw, hh - 0.3, bd, WD2, 0x5a4230, { glow: g });
        const n = Math.max(2, Math.floor((hh - 0.4) / 0.55)), sgn = o.shelfOut || 1;
        for (let i = 0; i < n; i++) { const y = 0.5 + i * 0.55; a.box(x + (alongZ ? 0.19 * sgn : 0), y, z + (alongZ ? 0 : 0.19), alongZ ? 0.34 : len, 0.04, alongZ ? len : 0.34, WD2, 0x6a4e38, { glow: g });
            if (goods) { const m = Math.max(2, Math.floor(len / 0.42)); for (let k = 0; k < m; k++) { const t = -len / 2 + 0.25 + k * (len - 0.5) / (m - 1), c = goods[(k * 7 + i * 3) % goods.length], bh = 0.2 + ((k * 5 + i) % 3) * 0.07;
                    if ((k + i) % 4 === 3) continue;
                    if ((k + i) % 3 === 0) a.cyl(x + (alongZ ? 0.19 * sgn : t), y + 0.04, z + (alongZ ? t : 0.19), 0.07, bh + 0.08, GLS, c, { seg: 6, glow: g });
                    else a.box(x + (alongZ ? 0.19 * sgn : t), y + 0.04, z + (alongZ ? t : 0.19), alongZ ? 0.2 : 0.26, bh, alongZ ? 0.26 : 0.2, WD, c, { glow: g }); } } } };
    return { solid, counter, shelves, iw, il, top, g };
}
const GOODS = [0xc86a50, 0xd8c070, 0x6a8a9a, 0x8aa070, 0xe8e0c8, 0xa07850, 0x7a5a8a], BOTTLES = [0x7aa060, 0xc89040, 0x9a5a30, 0xd8d0b0, 0x4a7a6a];

/* THE EXTERIORS PASS (2026-11-16, the Western Town thread). The first build's seven fronts were 24 to 28 m wide (barns); a frontier front is
   7 to 17 m. Every front is redrawn at that scale, five small trades fill the rows (blacksmith, barber, assay office, telegraph, undertaker),
   and one plank boardwalk runs down each side of Main Street. North row: fronts face south, their porches on square row 21. South row: fronts
   face north, porches on row 26. The cross street is squares x 70..71. */
exports.buildings = ctx => { bind(ctx);
    const RF = 0x9a8a78;
    STABLES = building('stables', [49, 16, 54, 21, 'S'], 6, { leaf: 'leaf_barn', floorIn: 'dirt_2' }, (a, w, d, door) => { western(a, w, d, door, { h: 6, tint: 0xc08a60, roofTint: 0x8a6e58, rh: 3.2, porch: 'none', name: 'LIVERY STABLE', board: '#e8dcc0' });
        const I = inside(a, 'stables', w, d, 6, door, { tint: 0xb89068, dado: 0x8a6848, glow: 0.34 });
        /* four stalls along the back wall, a hay loft over them */
        for (let i = 0; i <= 4; i++) I.solid(-I.iw + 0.06 + i * (2 * I.iw - 0.12) / 4, -I.il + 2.1, 0.12, 4.2, 1.5, WD, 0x9a7450);
        for (let i = 0; i < 4; i++) { const x = -I.iw + (i + 0.5) * (2 * I.iw) / 4; a.box(x - 1.3, 1.0, -I.il + 4.2, 1.4, 0.1, 0.1, WD2, 0x6a4e38, { glow: I.g }); }
        a.box(0, 3.3, -I.il + 2.3, 2 * I.iw, 0.16, 4.6, WD, 0x9a7450, { under: true, glow: I.g }); a.box(0, 3.46, -I.il + 4.5, 2 * I.iw, 0.9, 0.08, WD2, 0x6a4e38, { glow: I.g });
        for (const x of [-5.5, -1.5, 2.5, 6]) a.box(x, 3.46, -I.il + 1.6, 1.6, 0.8, 1.3, 'desert', 0xe8c860, { glow: I.g }); });
    SMITH = building('smith', [56, 18, 59, 21, 'S'], 4.2, { floorIn: 'dirt_2' }, (a, w, d, door) => { western(a, w, d, door, { h: 4.2, tint: 0x9a8474, trim: 0x3a3028, roofTint: 0x6a625c, roof: 'shed', name: 'BLACKSMITH', ink: '#e8dcc0', board: '#3a3028' });
        const I = inside(a, 'smith', w, d, 4.2, door, { tint: 0x7a6a5c, dado: 0x5a4a3e, ceilTint: 0x5a4a3e, glow: 0.28 });
        /* the forge: a brick hearth on the back wall, live coals, a hood and flue; the bench along the east wall */
        I.solid(0, -I.il + 0.9, 2.4, 1.6, 0.95, 'bricks_1', 0xa87a64); a.box(0, 0.95, -I.il + 0.9, 1.7, 0.08, 1.0, 'bricks_1', 0xff7a30, { glow: 1 });
        a.roof('pyramid', 0, 2.1, -I.il + 0.9, 2.6, 0.9, 1.8, RIB, 0x4a4440); a.box(0, 3.0, -I.il + 0.6, 0.6, 0.9, 0.6, 'bricks_1', 0x8a6454, { glow: I.g });
        I.counter(I.iw - 0.6, 0.6, 4.4, true, 0x6a5038); a.box(-2.2, 0, -1.2, 0.7, 0.62, 0.7, WD2, 0x5a4230, { glow: I.g }); });
    SALOON = building('saloon', [61, 16, 65, 21, 'S'], 7, { leaf: 'leaf_saloon', leafDouble: true }, (a, w, d, door) => { western(a, w, d, door, { h: 7, tint: 0xd8785a, trim: 0x5a3424, roofTint: RF, front: 2.4, step: 0.9, porch: 'balcony', name: 'SALOON', ink: '#f0d890', board: '#3a1c14' });
        const I = inside(a, 'saloon', w, d, 7, door, { key: PLAS, tint: 0xa84a40, dado: 0x5a3626, ceilTint: 0x6a4a36, glow: 0.34 });
        /* the long bar on the west wall, the back bar and its mirror behind it; the stage in the far corner; the gallery over the back */
        I.counter(-I.iw + 2.0, -3.2, 8.4, true, 0x7a4a30); a.box(-I.iw + 2.55, 0.18, -3.2, 0.06, 0.06, 8.2, RIB, 0xd8b060, { glow: 0.5 });
        I.shelves(-I.iw + 0.05, -3.2, 8.0, true, 2.9, BOTTLES); a.box(-I.iw + 0.1, 1.7, -3.2, 0.03, 1.1, 3.2, GLS, 0xd8e8f0, { glow: 0.6, uv: 'fit' });
        I.solid(3.4, -I.il + 1.6, 6.0, 3.2, 0.5, WD, 0x8a5a3a); a.box(3.4, 0.5, -I.il + 0.08, 6.0, 3.0, 0.06, PLAS, 0x7a2a28, { glow: I.g });
        a.box(0, 3.5, -I.il + 1.3, 2 * I.iw, 0.16, 2.6, WD, 0x8a5a3a, { under: true, glow: I.g }); a.box(0, 3.66, -I.il + 2.56, 2 * I.iw, 0.95, 0.08, WD2, 0x5a3626, { glow: I.g });
        for (const x of [-I.iw + 3.2, 0.2, 6.3]) a.box(x, 0, -I.il + 2.5, 0.2, 3.5, 0.2, WD2, 0x5a3626, { glow: I.g }); });
    BARBER = building('barber', [66, 18, 69, 21, 'S'], 4.6, {}, (a, w, d, door) => { western(a, w, d, door, { h: 4.6, tint: 0xe8e0d0, trim: 0x8a3a30, roofTint: RF, front: 1.5, name: 'BARBER', ink: '#8a2a22', board: '#f0e8d8' });
        const I = inside(a, 'barber', w, d, 4.6, door, { key: PLAS, tint: 0xe8e4d8, dado: 0x8a3a30, ceilTint: 0xb8a890, glow: 0.4 });
        I.counter(-0.4, -I.il + 0.45, 6.4, false, 0x8a5a40); I.shelves(I.iw - 0.05, -1.6, 3.4, true, 2.2, BOTTLES); });
    BANK = building('bank', [73, 17, 76, 21, 'S'], 5.25, { leafDouble: true, keyIn: PLAS }, (a, w, d, door) => { western(a, w, d, door, { h: 5.25, tint: 0xf0e8d4, trim: 0x6a6458, roofTint: 0x70707a, front: 1.8, name: 'BANK', ink: '#e8c860', board: '#2a3a30' });
        for (const s of [-1, 1]) a.box(door.lx + s * 1.6, 0, d / 2 + 0.3, 0.5, 4.6, 0.5, PLAS, 0xe8e0cc);
        const I = inside(a, 'bank', w, d, 5.25, door, { key: PLAS, tint: 0xe8e0c8, dado: 0x3a5a48, ceilTint: 0xc8c0a8, glow: 0.4 });
        /* the tellers' counter right across the room, a brass cage over it, the gate at its east end */
        I.counter(-1.1, 0.4, 2 * I.iw - 2.2, false, 0x6a4a34); I.solid(I.iw - 1.1, 0.4, 2.2, 0.1, 1.1, RIB, 0xc8a050);
        a.cyl(-I.iw + 0.2, 1.09, 0.4, 0.025, 1.3, RIB, 0xd8b060, { seg: 6, glow: 0.5, n: 44, step: [(2 * I.iw - 2.6) / 43, 0, 0] }); a.box(-1.1, 2.39, 0.4, 2 * I.iw - 2.2, 0.1, 0.12, RIB, 0xd8b060, { glow: 0.5 });
        a.sign('TELLER', -1.1, 2.6, 0.4, 2.2, 0.5, '#e8c860', '#2a3a30', 'rye'); });
    ASSAY = building('assay', [77, 18, 80, 21, 'S'], 4.4, {}, (a, w, d, door) => { western(a, w, d, door, { h: 4.4, tint: 0xc8a878, trim: 0x5a4028, roofTint: RF, front: 1.2, step: 0.6, name: 'ASSAY OFFICE', board: '#e8dcc0' });
        const I = inside(a, 'assay', w, d, 4.4, door, { tint: 0xc8a878, dado: 0x6a4a30, glow: 0.36 });
        I.counter(-0.6, -0.8, 2 * I.iw - 2.6, false, 0x7a5638); I.shelves(0, -I.il + 0.05, 2 * I.iw - 0.6, false, 2.6, [0x8a8a8a, 0xc8a850, 0x6a5a4a, 0xb0b0b8, 0x9a7a50]); });
    WIRE = building('telegraph', [81, 18, 83, 21, 'S'], 4.9, {}, (a, w, d, door) => { western(a, w, d, door, { h: 4.9, tint: 0xa8b4c0, trim: 0x3a4450, roofTint: RF, front: 1.6, name: 'TELEGRAPH', ink: '#f0e8d0', board: '#2a3440' });
        const I = inside(a, 'telegraph', w, d, 4.9, door, { key: PLAS, tint: 0xb8c4cc, dado: 0x3a4450, glow: 0.38 });
        /* the counter with its wicket, the pigeonholes on the back wall */
        I.counter(0, 0.2, 2 * I.iw - 1.9, false, 0x5a4a3e); a.cyl(-1.2, 1.09, 0.2, 0.022, 1.0, RIB, 0xd8b060, { seg: 6, glow: 0.5, n: 13, step: [0.2, 0, 0] }); a.box(0, 2.09, 0.2, 2.7, 0.08, 0.1, RIB, 0xd8b060, { glow: 0.5 });
        I.shelves(0, -I.il + 0.05, 2 * I.iw - 0.4, false, 2.7, [0xf0e8d0, 0xe0d0a8, 0xf0e8d0, 0xd8c8a0]); });
    HOTEL = building('hotel', [85, 15, 89, 21, 'S'], 8.75, { leafDouble: true }, (a, w, d, door) => { western(a, w, d, door, { h: 8.75, tint: 0xe0c090, trim: 0x6a4630, roofTint: 0xa86a58, front: 1.4, porch: 'balcony', name: 'HOTEL', board: '#f0e8d0' });
        const I = inside(a, 'hotel', w, d, 8.75, door, { key: PLAS, tint: 0xd8c8a0, dado: 0x6a4630, ceil: 3.4, ceilTint: 0xb89a78, glow: 0.38 });
        /* the lobby across the front; behind it a corridor down the middle and three rooms a side, each with its doorway on the corridor */
        const zL = 4.6, T = 0.14, H = 3.4, K = 0xd8c8a0;
        for (const s of [-1, 1]) { I.solid(s * (I.iw + 1.3) / 2, zL, I.iw - 1.3, T, H, PLAS, K);                                    // the lobby's back wall, the corridor's mouth in its middle
            for (let i = 0; i < 3; i++) { const z0 = zL - T / 2 - i * 4.9, z1 = z0 - 4.9;                                               // a room: z1..z0, its doorway 1.3 m wide at the lobby end
                I.solid(s * 1.3, (z0 - 1.9 + z1) / 2, T, (z0 - 1.9) - z1, H, PLAS, K); I.solid(s * 1.3, z0 - 0.25, T, 0.5, H, PLAS, K); a.box(s * 1.3, 2.2, z0 - 1.2, T, H - 2.2, 1.4, PLAS, K, { glow: I.g });
                if (i < 2) I.solid(s * (I.iw + 1.3) / 2, z1, I.iw - 1.3, T, H, PLAS, K); } }
        I.counter(-I.iw + 2.4, 6.6, 3.4, false, 0x7a4a30); a.box(-I.iw + 2.4, 1.5, I.il - 4.0, 2.6, 1.3, 0.05, WD2, 0x5a3626, { glow: I.g }); });
    JAIL = building('jail', [50, 27, 53, 30, 'N'], 4.2, { leaf: 'leaf_cell', keyIn: 'bricks_1', floorIn: 'cobblestone' }, (a, w, d, door) => { western(a, w, d, door, { h: 4.2, tint: 0xc8b8a0, trim: 0x4a443e, roofTint: 0x7a746c, roof: 'shed', front: 1.3, name: 'SHERIFF', ink: '#f0e8d0', board: '#3a3430' });
        a.box(0, 0, 0, w + 0.3, 1.2, d + 0.3, 'bricks_1', 0xc8b8a4, { top: false, faces: 'blr' });
        const I = inside(a, 'jail', w, d, 4.2, door, { key: 'bricks_1', tint: 0xc0b09c, dadoKey: 'bricks_1', dado: 0x9a8a78, ceilTint: 0x6a5a4a, glow: 0.32, uv: [1.75, 1.75] });
        /* two cells across the back: iron bars wall to wall, a barred wall between them */
        const zB = -1.3, IR = 0x3a3a40; I.solid(0, zB, 2 * I.iw, 0.1, 0.12, RIB, IR); I.solid(0, (zB - I.il) / 2, 0.1, I.il + zB, 0.12, RIB, IR);
        INS.jail.push([0, zB, 2 * I.iw, 0.12, 2.6], [0, (zB - I.il) / 2, 0.12, I.il + zB, 2.6]);
        a.cyl(-I.iw + 0.1, 0.12, zB, 0.028, 2.5, RIB, IR, { seg: 6, glow: 0.2, n: 60, step: [(2 * I.iw - 0.2) / 59, 0, 0] }); a.cyl(0, 0.12, zB - 0.15, 0.028, 2.5, RIB, IR, { seg: 6, glow: 0.2, n: 22, step: [0, 0, -(I.il + zB - 0.3) / 21] });
        for (const y of [1.3, 2.6]) { a.box(0, y, zB, 2 * I.iw, 0.08, 0.1, RIB, IR, { glow: 0.2 }); a.box(0, y, (zB - I.il) / 2, 0.1, 0.08, I.il + zB, RIB, IR, { glow: 0.2 }); }
        for (const s of [-1, 1]) { a.box(s * 2.5 - 0.5, 0.12, zB + 0.04, 0.08, 2.1, 0.12, RIB, 0x5a5a62, { glow: 0.2 }); a.box(s * 2.5 + 0.5, 0.12, zB + 0.04, 0.08, 2.1, 0.12, RIB, 0x5a5a62, { glow: 0.2 }); a.box(s * 2.5, 2.14, zB + 0.04, 1.08, 0.08, 0.12, RIB, 0x5a5a62, { glow: 0.2 }); } });
    COFFINS = building('undertaker', [55, 27, 58, 30, 'N'], 5, {}, (a, w, d, door) => { western(a, w, d, door, { h: 5, tint: 0x9a968e, trim: 0x2a2826, roofTint: 0x6a665e, front: 1.7, name: 'UNDERTAKER', ink: '#e8e4d8', board: '#1e1c1a' });
        const I = inside(a, 'undertaker', w, d, 5, door, { key: PLAS, tint: 0x9a86a0, dado: 0x4a4040, ceilTint: 0x6a6060, glow: 0.36 });
        /* two trestles for the work in hand, the counter by the door */
        for (const x of [-2.4, 0.4]) { for (const z of [-3.0, -1.6]) a.box(x, 0, z, 0.9, 0.7, 0.12, WD2, 0x4a3a30, { glow: I.g }); INS.undertaker.push([x, -2.3, 0.9, 2.2, 0.7]); }
        I.counter(2.6, 2.4, 2.6, false, 0x3a302a); });
    STORE = building('store', [73, 27, 77, 31, 'N'], 5.25, {}, (a, w, d, door) => { western(a, w, d, door, { h: 5.25, tint: 0x9ab09a, trim: 0x3e4e40, roofTint: RF, front: 2.0, step: 0.7, name: 'GENERAL STORE', board: '#e8dcc0' });
        const I = inside(a, 'store', w, d, 5.25, door, { tint: 0xc8b890, dado: 0x5a6a58, glow: 0.38 });
        /* the long counter before the back wall, shelves of goods on three walls */
        I.counter(0, -I.il + 2.2, 2 * I.iw - 3.2, false, 0x7a5a3c); I.shelves(0, -I.il + 0.05, 2 * I.iw - 0.6, false, 3.1, GOODS);
        I.shelves(-I.iw + 0.05, 1.0, 6.0, true, 2.6, GOODS); });
    /* THE CHURCH: a narrow nave, its gable end and steeple to the back street */
    CHURCH = building('church', [64, 0, 67, 5, 'S'], 6, { leafDouble: true }, (a, w, d, door) => { western(a, w, d, door, { h: 6, tint: 0xffffff, trim: 0xb0aaa0, roofTint: 0x6a6058, rh: 3.6, porch: 'none', key: PLAS });
        a.box(0, 6, d / 2 - 1.6, 2.6, 5.4, 2.6, PLAS, 0xffffff, { roof: true }); a.box(0, 9.2, d / 2 - 0.28, 1.0, 1.5, 0.06, WD2, 0x3a2a20, { roof: true });   // the steeple over the door, its louvre
        a.roof('pyramid', 0, 11.4, d / 2 - 1.6, 3.2, 3.8, 3.2, SHG, 0x6a6058);
        a.box(0, 15.2, d / 2 - 1.6, 0.16, 1.6, 0.16, WD2, 0x3a2a20, { roof: true }); a.box(0, 16.1, d / 2 - 1.6, 0.9, 0.16, 0.16, WD2, 0x3a2a20, { roof: true });
        const I = inside(a, 'church', w, d, 6, door, { key: PLAS, tint: 0xf0ece0, dado: 0x7a5a40, ceilTint: 0x8a6a50, glow: 0.42 });
        /* the chancel: one step up across the east end, the table on it, a tall lit window either side of the cross */
        I.solid(0, -I.il + 1.5, 2 * I.iw, 3.0, 0.3, WD, 0x8a6a4c); for (const s of [-1, 1]) a.box(s * 2.6, 1.6, -I.il + 0.05, 1.0, 2.8, 0.03, GLS, 0xffe8a8, { glow: 1, uv: 'fit' }); });
};

/* what stands inside, in each building's own frame (x along the front, +z out of the door). `inn` = a prop on the building's own floor
   (`floor: true`: without it a prop beside a wall or a ghost block stands on top of it); `y` under 1 m lifts, from 1 m it is a height. */
exports.furnish = ctx => { bind(ctx);
    const inn = (B, key, lx, lz, o) => put(B, key, lx, lz, Object.assign({ floor: true }, o || {}));
    const H = { stables: STABLES, smith: SMITH, saloon: SALOON, barber: BARBER, bank: BANK, assay: ASSAY, telegraph: WIRE, hotel: HOTEL, jail: JAIL, undertaker: COFFINS, store: STORE, church: CHURCH };
    Object.keys(INS).forEach(id => INS[id].forEach(g => { const B = H[id], along = g[2] >= g[3], p = along ? B.at(g[0] - g[2] / 2, g[1]) : B.at(g[0], g[1] - g[3] / 2), q = along ? B.at(g[0] + g[2] / 2, g[1]) : B.at(g[0], g[1] + g[3] / 2);
        feat({ k: 'wall', x0: p[0], z0: p[1], x1: q[0], z1: q[1], h: r2(g[4]), t: r2(along ? g[3] : g[2]), key: WD2, ghost: true, rail: false }); }));
    const set = (B, x, z, tk, ck, n) => { inn(B, tk, x, z, {}); for (let i = 0; i < n; i++) { const t = i * Math.PI * 2 / n + 0.4; inn(B, ck, x + Math.cos(t) * 1.15, z + Math.sin(t) * 1.15, { face: Math.round(270 - t * 180 / Math.PI + 360) % 360 }); } };
    /* THE SALOON (inside 13.3 x 16.8): bar west, stage north-east, card tables on the floor */
    for (const z of [-6.4, -4.8, -3.2, -1.6, 0]) inn(SALOON, 'bar_stool', -3.6, z, {});
    for (const z of [-6, -3.4, -0.8]) inn(SALOON, 'psx_glass_bottle_' + (z < -4 ? 1 : 2), -4.7, z, { y: 1.1 }); inn(SALOON, 'cash_register', -4.7, 0.2, { y: 1.1, face: 90 });
    inn(SALOON, 'decor_piano', 5.2, -7.4, { y: 0.5, face: 180 }); inn(SALOON, 'bar_stool', 5.2, -6.3, { y: 0.5 }); inn(SALOON, 'crystal_chandelier', 1.2, -1.5, { y: 4.9, h: 1.7 });
    set(SALOON, 0.6, 1.4, 'psx_dinner_table_1', 'psx_chair_mp_3', 3); set(SALOON, 4.2, 4.6, 'psx_dinner_table_1', 'psx_chair_mp_3', 4); set(SALOON, -1.2, 5.4, 'psx_dinner_table_1', 'psx_chair_mp_3', 2);
    inn(SALOON, 'blackjack_table', 3.4, -2.4, { face: 180 }); inn(SALOON, 'roulette_table', 5.2, 0.9, { face: 270 }); inn(SALOON, 'slot_machine', 6.1, 6.6, { face: 270 });
    inn(SALOON, 'psx_metal_barrel_mp_1', -5.6, 2.2, {}); inn(SALOON, 'psx_wooden_crate_2', -5.7, 3.6, {}); inn(SALOON, 'painting_portrait', 6.33, -3.2, { y: 2.0, face: 270 });
    /* THE BANK (9.8 x 13.3): the vault behind the tellers' counter */
    inn(BANK, 'vault', 0, -5.2, { face: 180, h: 4.4 }); inn(BANK, 'floor_safe', -3.9, -3.4, { face: 90 }); inn(BANK, 'money_sacks', 3.6, -4.6, {}); inn(BANK, 'money_sacks', 3.9, -3.2, { face: 70 });
    inn(BANK, 'money_counter', -3.0, 0.4, { y: 1.1 }); inn(BANK, 'psx_gold_bar_pcs_1', -1.0, 0.4, { y: 1.1 }); inn(BANK, 'psx_cash_1', 0.6, 0.4, { y: 1.1 }); inn(BANK, 'exec_desk', -2.6, -2.2, { face: 180 }); inn(BANK, 'psx_chair_mp_3', -2.6, -3.1, { face: 180 });
    inn(BANK, 'iron_garden_bench', -4.2, 4.2, { face: 90 }); inn(BANK, 'potted_plant', 4.2, 5.8, {}); inn(BANK, 'wall_clock', 0, 6.58, { y: 3.2, face: 0 }); inn(BANK, 'painting_landscape', 4.83, 3.2, { y: 2.0, face: 270 });
    /* THE SHERIFF'S (9.8 x 9.8): a cot and a bucket in each cell, the desk out front */
    for (const s of [-1, 1]) { inn(JAIL, 'cot', s * 3.4, -3.6, { face: 90 }); inn(JAIL, 'wooden_bucket', s * 1.0, -4.2, {}); }
    inn(JAIL, 'exec_desk', -1.6, 1.6, { face: 180 }); inn(JAIL, 'psx_chair_mp_3', -1.6, 0.5, { face: 180 }); inn(JAIL, 'rifle_rack', 4.83, 1.6, { face: 270 }); inn(JAIL, 'mugshot_wall', -4.83, 1.8, { face: 90 }); inn(JAIL, 'footlocker', 3.6, 3.9, { face: 0 });
    inn(JAIL, 'key_rack', 4.83, -0.4, { y: 1.5, face: 270 }); inn(JAIL, 'rocking_chair', 2.6, 2.2, { face: 200 }); inn(JAIL, 'meshy_hanging_lantern', -1.6, 1.6, { y: 3.2, noLight: true });
    /* THE CHURCH (9.8 x 16.8) */
    for (const z of [-2.6, -0.4, 1.8, 4.0, 6.2]) for (const x of [-2.5, 2.5]) inn(CHURCH, 'church_pew', x, z, { face: 0 });
    inn(CHURCH, 'stone_altar', 0, -7.0, { y: 0.3 }); inn(CHURCH, 'wooden_cross', 0, -8.02, { y: 2.2, face: 0, h: 2.4 }); inn(CHURCH, 'lectern', 2.8, -5.6, { y: 0.3, face: 180 }); inn(CHURCH, 'meshy_bible', 0, -7.0, { y: 1.26 });
    inn(CHURCH, 'candle_ring', -3.2, -7.0, { y: 0.3 }); inn(CHURCH, 'hw_candles', -0.7, -7.0, { y: 1.26 }); inn(CHURCH, 'hw_candles_2', 0.7, -7.0, { y: 1.26 }); inn(CHURCH, 'decor_piano', -3.4, -4.6, { face: 90 }); inn(CHURCH, 'ships_bell', 3.9, 7.4, {});
    /* THE GENERAL STORE (13.3 x 13.3) */
    inn(STORE, 'cash_register', -3.0, -4.1, { y: 1.1, face: 180 }); inn(STORE, 'platform_scale', 4.6, -3.9, {}); for (let i = 0; i < 4; i++) inn(STORE, 'psx_canned_food_mp_' + (1 + i), -1.2 + i * 0.3, -4.1, { y: 1.1 });
    inn(STORE, 'psx_metal_barrel_mp_1', 5.2, 1.2, {}); inn(STORE, 'psx_metal_barrel_mp_2', 5.4, 2.6, {}); inn(STORE, 'meshy_burlap_sack', 4.2, 2.0, {}); inn(STORE, 'meshy_burlap_sack', 5.0, 4.0, { face: 40 }); inn(STORE, 'meshy_burlap_sack', 3.8, 3.6, { face: 110 });
    inn(STORE, 'psx_wooden_crate_2', 0.4, 2.2, {}); inn(STORE, 'psx_wooden_crate_3', 1.7, 2.6, { face: 30 }); inn(STORE, 'psx_wooden_crate_6', 0.8, 2.3, { y: 1.08, face: 20 }); inn(STORE, 'bread_rack', 6.0, -1.6, { face: 270 });
    inn(STORE, 'rocking_chair', -4.4, 5.2, { face: 150 }); inn(STORE, 'meshy_hanging_lantern', 0, 0.5, { y: 4.2, noLight: true });
    /* THE LIVERY STABLE (16.8 x 16.8): a horse in three stalls, straw, sacks, tack room corner */
    inn(STABLES, 'horse', -6.3, -6.2, { face: 0 }); inn(STABLES, 'horse_brown', -2.1, -6.2, { face: 0 }); inn(STABLES, 'horse_black', 6.3, -6.2, { face: 0 });
    for (const q of [[2.1, -6.6, 20], [1.6, -5.2, 100], [-7.2, 2.4, 0], [-7.2, 3.9, 0], [-6.1, 3.0, 90], [7.0, 5.6, 0]]) inn(STABLES, q[1] < -5 ? 'hw_straw_2' : 'hw_straw', q[0], q[1], { face: q[2] });
    inn(STABLES, 'meshy_burlap_sack', 7.2, 1.0, {}); inn(STABLES, 'meshy_burlap_sack', 6.4, 2.2, { face: 60 }); inn(STABLES, 'wooden_bucket', -4.2, -3.6, {}); inn(STABLES, 'wooden_bucket', 0.2, -3.5, {}); inn(STABLES, 'psx_wooden_crate_2', 7.4, 7.2, {});
    inn(STABLES, 'psx_metal_barrel_mp_1', -7.4, 7.0, {}); inn(STABLES, 'library_ladder', 7.6, -3.4, { face: 270 }); inn(STABLES, 'hw_shovel', -7.9, 0.2, {}); inn(STABLES, 'meshy_hanging_lantern', 0, 1.0, { y: 4.4, noLight: true });
    /* THE HOTEL (13.3 x 20.3): the lobby, six rooms */
    inn(HOTEL, 'key_rack', -4.2, 6.2, { y: 1.6, face: 180 }); inn(HOTEL, 'cash_register', -3.4, 6.6, { y: 1.1, face: 0 }); inn(HOTEL, 'psx_armchair_1', 3.4, 8.6, { face: 200 }); inn(HOTEL, 'psx_armchair_1', 5.2, 7.0, { face: 250 });
    inn(HOTEL, 'psx_coffee_table_1', 3.8, 6.9, {}); inn(HOTEL, 'psx_carpet_mp_1', 0, 7.2, { y: 0.045 }); inn(HOTEL, 'potted_plant', 5.9, 9.4, {}); inn(HOTEL, 'painting_landscape', 6.33, 7.4, { y: 1.9, face: 270 }); inn(HOTEL, 'wall_clock', -4.2, 4.72, { y: 2.6, face: 0 });
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { const zc = 4.53 - i * 4.9 - 2.45, f = s < 0 ? 90 : 270;
        inn(HOTEL, 'psx_bed_4_' + (1 + (i + (s > 0 ? 1 : 0)) % 4), s * 5.2, zc - 0.6, { face: f }); inn(HOTEL, 'psx_bedside_table_1', s * 5.9, zc + 1.2, { face: f }); inn(HOTEL, 'psx_wardrobe_mp_1', s * 2.0, zc - 1.6, { face: f });
        inn(HOTEL, 'rug_round', s * 3.4, zc + 0.6, { y: 0.045 }); inn(HOTEL, 'hw_candles', s * 5.9, zc + 1.2, { y: 0.64, noLight: true }); }
    /* THE FIVE TRADES */
    inn(BARBER, 'barber_chair', -2.2, -2.6, { face: 0 }); inn(BARBER, 'barber_chair', 0.8, -2.6, { face: 0 }); inn(BARBER, 'barber_mirror', -2.2, -4.83, { face: 0 }); inn(BARBER, 'barber_mirror', 0.8, -4.83, { face: 0 });
    inn(BARBER, 'barber_pole', -4.6, 3.6, { y: 1.4 }); inn(BARBER, 'iron_garden_bench', -4.1, 1.6, { face: 90 }); inn(BARBER, 'psx_glass_bottle_1', -1.0, -4.4, { y: 1.1 }); inn(BARBER, 'psx_glass_bottle_2', 1.9, -4.4, { y: 1.1 }); inn(BARBER, 'wooden_bucket', 2.2, -2.2, {});
    inn(COFFINS, 'psxg_coffin', -2.4, -2.3, { y: 0.7, face: 0 }); inn(COFFINS, 'psxg_coffin', 0.4, -2.3, { y: 0.7, face: 0 }); inn(COFFINS, 'trap_coffin_open', 3.4, -3.2, { face: 180 }); inn(COFFINS, 'trap_coffin_lid', -4.2, 1.4, { face: 90 });
    inn(COFFINS, 'hw_shovel', 4.4, -0.6, {}); inn(COFFINS, 'hw_candles', 2.2, 2.4, { y: 1.1, noLight: true }); inn(COFFINS, 'psx_cross_mp_2', -3.9, -4.3, { h: 1.5 }); inn(COFFINS, 'wooden_cross', 0, -4.83, { y: 2.6, face: 0, h: 1.6 });
    inn(ASSAY, 'platform_scale', 2.9, -2.6, {}); inn(ASSAY, 'floor_safe', -3.9, -3.6, { face: 90 }); inn(ASSAY, 'psx_gold_bar_pcs_1', -1.4, -0.8, { y: 1.1 }); inn(ASSAY, 'psxg_rock_3', 0.2, -0.8, { y: 1.1, h: 0.3 }); inn(ASSAY, 'psxg_rock_4', 1.0, -0.8, { y: 1.1 });
    inn(ASSAY, 'psx_wooden_crate_2', 3.9, 3.6, {}); inn(ASSAY, 'money_sacks', -4.0, 3.2, {}); inn(ASSAY, 'psx_chair_mp_3', -0.6, -2.0, { face: 180 }); inn(ASSAY, 'meshy_hanging_lantern', 0, 0.8, { y: 3.4, noLight: true });
    inn(WIRE, 'exec_desk', 0, -2.4, { face: 180 }); inn(WIRE, 'psx_chair_mp_3', 0, -3.4, { face: 180 }); inn(WIRE, 'wall_clock', -2.0, -4.83, { y: 3.1, face: 0 }); inn(WIRE, 'iron_garden_bench', -2.4, 3.0, { face: 90 }); inn(WIRE, 'notice_board', 3.07, 2.6, { y: 1.5, face: 270 });
    inn(SMITH, 'stump', -2.2, -1.2, {}); inn(SMITH, 'psx_metal_barrel_mp_1', -4.0, -3.8, {}); inn(SMITH, 'wooden_bucket', -2.4, -3.2, {}); inn(SMITH, 'psx_wooden_crate_2', -4.0, 2.6, {}); inn(SMITH, 'hw_shovel', -4.5, 0.4, {});
    inn(SMITH, 'psx_hand_saw_1', 4.3, 0.2, { y: 1.1 }); inn(SMITH, 'tool_chest', 3.9, 3.8, { face: 270 }); inn(SMITH, 'ladder_wall_rack', -4.83, -1.0, { y: 2.0, face: 90 });
};

exports.ground = ctx => { bind(ctx);
    /* THE BOARDWALKS: one plank walk down each side of Main Street, from front to front */
    for (let x = 49; x < 95; x++) if (x !== 70 && x !== 71) setPaint(x, 21, PLANKS);
    for (let x = 49; x < 83; x++) if (x !== 70 && x !== 71) setPaint(x, 26, PLANKS);
    /* BOOT HILL: the low hill, a ranch rail round it, the gate on the back street */
    feat({ k: 'hill', x: gc(53), z: gc(3), r: 13, h: 2.6 }); pen(49, 0, 57, 6, [2, 53]);
    { const a = sheet(); for (const s of [-1, 1]) a.box(s * 1.9, 0, 0, 0.28, 3.6, 0.28, WD2, 0x6a4e3a); a.box(0, 3.3, 0, 4.4, 0.24, 0.3, WD2, 0x6a4e3a); a.sign('BOOT HILL', 0, 2.5, 0.06, 3.4, 0.75, '#2a1a10', '#d8c090', 'rye'); a.sign('BOOT HILL', 0, 2.5, -0.06, 3.4, 0.75, '#2a1a10', '#d8c090', 'rye', { ry: 180 });
        feat({ k: 'arch', id: 'des:w:boothill', x: gc(53), z: gc(6), rot: 0, parts: a.P }); }
    [[51, 1], [53, 1], [55, 1], [50, 3], [52, 3], [54, 3], [56, 3], [51, 5], [55, 5]].forEach((q, i) => { const k = i % 3;
        Pm(k === 0 ? 'psx_cross_mp_2' : k === 1 ? 'cross' : 'psxg_tombstone_' + (1 + i % 3), gc(q[0]), gc(q[1]) - 0.9, k === 2 ? { face: 180 } : { face: 180, h: 1.5 }); Pm('psxg_dirt_grave', gc(q[0]), gc(q[1]) + 0.5, { face: 0 }); });
    P('psxg_dead_tree_1', 57, 2, {}); dec('skull', 55, 4); dec('trap_coffin_lid', 49, 2); dec('hw_shovel', 52, 4);
    Pm('decor_windpump_tower', gc(77), gc(3), { h: 11 }); Pm('decor_windpump_wheel', gc(77), gc(3) + 0.9, { y: 10.2, span: 4.2 }); P('ancient_well', 79, 4, {}); dec('wooden_bucket', 78, 5); P('cow', 81, 3, { face: 240 });
    /* THE MINE: a timbered adit in the rock's south face (three sets, plank lagging, the dark behind), a narrow track out of it across the back
       street to the ore dump. Drawn; the rock stops the walker at the face. */
    { const a = sheet(), T = 0x7a5a40, DK = 0x0c0a08;
        a.box(0, 0, -1.0, 3.4, 2.9, 0.2, WD2, DK); a.box(0, 0, 0.9, 3.0, 0.04, 3.8, 'dirt_2', 0x5a4a3a, { sides: false });
        for (const z of [0.2, 1.5, 2.8]) { for (const s of [-1, 1]) a.box(s * 1.6, 0, z, 0.32, 2.7, 0.32, WD2, T); a.box(0, 2.7, z, 4.0, 0.34, 0.36, WD2, T); }
        a.box(0, 3.04, 1.0, 3.8, 0.1, 4.0, WD, 0x8a6a4c); for (const s of [-1, 1]) a.box(s * 1.72, 0, 0.9, 0.08, 2.7, 3.8, WD, 0x6a5038);
        a.sign('MINE', 0, 3.2, 3.0, 2.4, 0.7, '#e8dcc0', '#3a2a1c', 'rye');
        for (const s of [-1, 1]) a.box(s * 0.45, 0.06, 7.2, 0.08, 0.1, 15.6, RIB, 0x4a4440); a.box(0, 0, -0.4, 1.5, 0.07, 0.2, WD2, 0x4a3626, { n: 24, step: [0, 0, 0.66] });
        a.box(0, 0, 15.2, 1.6, 0.7, 0.3, WD2, T);                                                                                                           // the buffer at the track's end
        feat({ k: 'arch', id: 'des:w:mine', x: gx(90), z: gx(5), rot: 0, parts: a.P }); }
    P('psx_metal_barrel_mp_1', 92, 6, {}); P('psx_wooden_crate_2', 93, 6, {}); dec('railway_lantern', 88, 6); dec('psx_wooden_crate_3', 91, 9); dec('hw_shovel', 88, 8);
    /* THE CANYON (P11-04): its other end is Giza's now, a long way off, so this end is a box canyon: the slot stops at a rock wall */
    feat({ k: 'plateau', x: gx(91), z: gx(46.5), w: 4 * C, d: 3 * C, h: 8.75, edge: 0.5 });
    /* MAIN STREET: the well where the showdown happens, the horse pond on the open lot south of it */
    P('ancient_well', 66, 24, {}); dec('wooden_bucket', 67, 24); P('signpost', 59, 22, { face: 90 });
    feat({ k: 'pool', x: gx(65), z: gx(30), r: 3.2, rz: 3.2, y: -0.2, depth: 0.8, key: 'water', bank: 0.8 });
    [[55, 21], [60, 21], [69, 21], [80, 21], [84, 21], [54, 26], [59, 26], [78, 26]].forEach(q => dec(rnd() < 0.5 ? 'psx_metal_barrel_mp_1' : 'psx_wooden_crate_2', q[0], q[1]));
    Pm('horse', gc(54), gc(22) + 1.7, { face: 0 }); Pm('horse_brown', gc(77), gc(25) - 1.7, { face: 180 }); P('iron_garden_bench', 72, 21, { face: 180 }); P('rocking_chair', 49, 26, { face: 0 });
    Pm('barber_pole', gc(69) - 0.6, gx(21) + 0.3, { y: 1.5 }); Pm('psxg_coffin', gc(58) + 0.4, gx(27) - 0.5, { face: 90 }); Pm('trap_coffin_lid', gc(54) + 0.9, gx(27) - 0.4, {});
    pen(84, 28, 88, 34, [0, 86]); P('horse_black', 85, 30, { face: 90 }); P('cow', 86, 32, { face: 300 }); P('cow', 87, 30, { face: 40 }); dec('wooden_bucket', 85, 33);                           // THE CORRAL
    P('campfire', 66, 44, {}); Pm('camping_tent', gc(64), gc(45), { face: 120 }); Pm('camping_tent', gc(68), gc(46), { face: 220 }); dec('sea_chest', 67, 46); dec('instrument_guitar_lying', 65, 43);
    dec('skull', 76, 43); dec('skull', 80, 39); dec('psx_fish_skeleton_mp_1', 78, 45, { y: 0.02 }); P('dead_snag', 74, 40, {}); P('dead_snag', 79, 42, {});
    native('sheriff', 52, 25, 0); native('cowboy', 64, 22, 180, sayOf(O_LINE, 'cowboy')); native('cowboy', 60, 24, 90); native('skeleton', 54, 2, 180);
};

/* THE MESHY PIECES (mondo 11-15 19:01 "okay go ahead": the packs have no cactus, covered wagon, water tower or hitching rail) */
exports.pieces = ctx => { bind(ctx);
    [[49, 22], [54, 22], [60, 22], [65, 22], [72, 22], [76, 22], [84, 22], [89, 22], [53, 25], [58, 25], [72, 25], [77, 25]].forEach(q => P('hitching_rail', q[0], q[1], { face: 0 }));   // along Main Street, clear of every door
    Pm('covered_wagon', gx(62), gc(42), { face: 0 }); Pm('covered_wagon', gx(71), gc(47), { face: 180 });                                                   // THE WAGON CAMP
    Pm('water_tower_west', gx(74), gx(9), {});                                                                                                               // by the windmill, on 2 x 2 squares
};
