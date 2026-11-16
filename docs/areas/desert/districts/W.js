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
   - THE WAGON CAMP (P09-04): campfire, two canvas wall tents, two covered wagons. OPEN RANGE (P10-04): skulls, snags. Twelve hitching rails.
   - THE TRAIL IN (P08-04): the way in from the Highway's Exit 3 (the county road and the overpass are the tool's).
   - People: sheriff, two cowboys (one says the old flight line's cowboy line), a skeleton on Boot Hill.

   NEEDS A MODEL: nothing open. THE MODEL PASS (2026-11-16, mondo's wish-list models, docs/plans/WISHLIST_MODELS_ADDED.md; seen in the browser)
   placed every piece the list asked for and crossed it off: ~~anvil + forge~~ (the smith's, with `bellows` and `grindstone`; the drawn brick
   forge is out), ~~water trough~~ (six, by the rails, in the corral, at the camp), ~~hay bale~~ (the livery's loft and floor, its porch, the
   corral; the drawn yellow blocks are out), ~~mine cart~~ (on the mine's track, with `buffer_stop`, `ore_heap`, `head_wheel`, `wheelbarrow`),
   ~~pickaxe~~, ~~wanted poster~~ (seven: the sheriff's, the saloon, the telegraph, the store), ~~tumbleweed~~, ~~gallows~~ (the open lot by
   the undertaker), ~~canvas tent~~ (the camp's two nylon tents are out; a third at the mine), ~~telegraph key / pole~~ (keys on the desk and
   the counter; three poles south out of town, the drawn pole is out).
   Also from the list: `wooden_barrel` (every barrel; it was the pack's steel drum), `outhouse` (the three drawn privies are out),
   `axe_chopping_block` + `firewood_stack`, `cattle_skull` (the gate's beam, the range), `coyote` (the two wolves are out), `vulture`, `hawk`,
   `rattlesnake`, `scorpion`, `lizard`, `rooster`, `agave`, `yucca`, `lantern_post`, `hand_cart`, `hearse_carriage` (behind the undertaker),
   `hay_rack`, `saddle`, `pitchfork`, `wooden_ladder`, `clothes_line`, `bell_frame` (the church's bell, in its yard), `plough`, `kettle`,
   `wood_stove`, `woven_baskets`, `antler_trophy`, `handcuffs`.

   THE INSIDES (after THE INTERIORS PASS, 2026-11-16; seen in the browser bar the hotel's six rooms):
   - `inside()` lines every walk-in (dado, wall band, board ceiling + beams, a lit pane behind each window) and gives `solid` / `counter` /
     `shelves`: drawn fittings that also stop the walker (ghost blocks written in furnish()). Props inside wear `floor: true`.
   - SALOON: long bar + back bar + mirror, stage with the piano, a drawn gallery, card tables, blackjack, roulette, chandelier.
     BANK: tellers' counter under a brass cage, the vault behind. SHERIFF: two barred cells, desk, rifle rack, mugshots.
     GENERAL STORE: counter, shelves of goods on three walls. LIVERY STABLE: four stalls, a hay loft (drawn), straw.
     HOTEL: a 3.4 m ceiling, the lobby, a corridor, four rooms (bed, wardrobe, table, rug). CHURCH: chancel step, altar, cross, pews.
     BLACKSMITH: brick forge + hood. BARBER, ASSAY OFFICE, TELEGRAPH, UNDERTAKER: counter, shelves, their trade's pieces.

   THE DRESSING (after THE DRESSING PASS, 2026-11-16; seen in the browser): `dress()` below. Porch chairs, benches, barrels, sacks, straw,
   a hanging lantern by every door (a glow, no lamp), chickens, crows, a wagon at the store; three privies and woodpiles in the back yards;
   the church's pickets; a crop patch + scarecrow by the windmill; the mine's yard; THE TRAIL IN's timber gate and rail; logs, pot and a
   horse line at the WAGON CAMP; five cows and an old fence on OPEN RANGE; the hideout at the end of THE CANYON (fire, cot, loot, dynamite).

   THE ATMOSPHERE (after THE ATMOSPHERE PASS, 2026-11-16; seen by day, dusk and night): `airZones` = dust blowing down Main Street and
   thinner dust over the camp and the range (the tool's new hook). Every hanging lantern has a lit core (`des:w:lamps`, one drawn row); the
   saloon's and the hotel's windows are lit (`western()` `lit`). No lamp of the room's ten is taken by this district bar the camp's fire.
   No sound: the walk rooms have no per-district sound, and no SFX may be generated.

   UP TO THE CITY'S BAR, ITEMS 1 TO 3 (2026-11-16, mondo: "do 1 2 and 3"; seen in the browser, walked):
   - THE SQUARES: every inside is laid out on its building's whole 3.5 m squares (`I.X(i)`, `I.Z(j)`, j from the back wall; lines `I.LX`,
     `I.LZ`). Blockers stand on square middles or fill whole squares, walls stand on square lines, walkways are whole squares. The hotel is
     now a lobby (2 rows), a one-square corridor and FOUR rooms (two of 2 x 2 squares, two of 1 x 2); the jail has THREE one-square cells.
   - THE SECOND LAYER OUTSIDE: `detail()` (foot board, belt board, brackets, shutters, sills, stovepipe or brick stack, back door, downpipe,
     balusters, a hung trade board, words on a side wall), the livery's loft door and hoist, the jail's barred windows, the telegraph's pole.
   - THE SECOND PASS INSIDE: lit board floor (western()'s deck, `floorKey`), skirting, dado rail, crown, pilasters on the square lines,
     a pendant lamp over every second square, sconces. All glow, no lamp.

   THE MODEL LIST PASS (2026-11-16, mondo's order to every district thread; seen in the browser): pieces MODEL_LIST.md had that the first
   passes missed, placed in `dress()` and `furnish()`: the Halloween pack's coffins, lids, a body and headstones (Boot Hill, the undertaker),
   dog, cat, wolves, eagles, rabbits, sheep, bats at the mine, bones, cobwebs, a cauldron, tongs, rope, guns and shells, cash and coins on
   the card tables, a confessional and stained glass in the church. The list and the leads not yet followed (the MINE pack's own file):
   areas-complexes.md "THE DESERT, THE ZONE KIT".

   KNOWN MISSING OR WRONG:
   - WALKED (11-16, after THE SQUARES, a flood on the walker's own rule from Main Street): every building's floor, the four hotel rooms,
     the stalls, the stage, the chancel, Boot Hill, the mine mouth, the camp, the canyon's end are reached; the three cells, the bank's
     vault side and the telegraph's back are shut.
   - No upstairs anywhere: the saloon's gallery and the stables' loft are drawn and not reached; the hotel's upper floor is its front only.
     THE MINE has no inside. The hotel's rooms were seen only through a doorway.
   - The insides read dark in the cloud browser even with lit linings (mondo's Firefox renders brighter): judge on his machine.
   - The lanterns glow and light nothing (the room has ten lamps for all four districts).
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
     airZones(ctx)   the air over its plots: [{ sx0, sy0, sx1, sy1 (home squares), kind, color, n, speed, wind }] (shell.atmos.zones)
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
/* THE AIR (the atmosphere pass, 2026-11-16): dust blowing down Main Street, thinner dust over the camp and the range. Home squares. */
exports.airZones = () => [{ sx0: 48, sy0: 19, sx1: 96, sy1: 29, kind: 'dust', color: 0xe8c890, n: 260, speed: 0.9, wind: 1.6 }, { sx0: 48, sy0: 36, sx1: 84, sy1: 48, kind: 'dust', color: 0xe0c898, n: 110, wind: 1.2 }];

/* A WESTERN FRONT: plank walls, corner posts, a false front taller than the roof with the name painted on it, a boardwalk porch on the
   square row before the door (posts + a lean-to roof, or a balcony), sash windows. Every one differs: height, colour, front, roof, porch. */
function western(a, w, d, door, o) {
    const h = o.h, tint = o.tint, trim = o.trim || 0x4a3626, rf = o.roofTint || 0x6a5a48, WK = o.key || WD;
    a.shell(w, h, d, WK, tint, door, [3.5, 1.75]);
    a.box(0, 0, 0, w - 0.1, 0.05, d - 0.1, o.floorKey || FLR, o.floorTint == null ? 0xc8a880 : o.floorTint, { uv: [1.75, 1.75], glow: 0.55 });                                                          // the boards inside, proud of the sand
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) a.box(sx * w / 2, 0, sz * d / 2, 0.32, h, 0.32, WD2, trim);
    a.box(0, h - 0.25, d / 2 + 0.08, w + 0.3, 0.25, 0.2, WD2, trim);
    if (o.roof === 'shed') a.roof('shed', 0, h, 0, w + 0.5, 1.1, d + 0.5, SHG, rf); else if (o.front) a.roof('gable', 0, h, -0.3, d - 0.3, o.rh || Math.max(0.9, Math.min(2.0, o.front - 0.3)), w + 0.5, SHG, rf, { ry: 90, keyEnd: WK, tintEnd: tint });   // behind a false front: lower than it, and it stops at its back (it hid the name)
    else a.roof('gable', 0, h, 0, d + 0.5, o.rh || 2.0, w + 0.5, SHG, rf, { ry: 90, keyEnd: WK, tintEnd: tint });
    if (o.front) { a.box(0, h, d / 2 - 0.05, w + 0.3, o.front, 0.24, WD, tint, { roof: true, uv: [3.5, 1.75] }); a.box(0, h + o.front, d / 2 - 0.05, w + 0.8, 0.26, 0.5, WD2, trim, { roof: true });
        if (o.step) a.box(0, h + o.front + 0.26, d / 2 - 0.05, w * 0.5, o.step, 0.24, WD, tint, { roof: true }); }
    /* the doorway's frame, the windows either side of it (and a row upstairs on a two-storey front) */
    a.box(door.lx - door.cw / 2 - 0.1, 0, d / 2 + 0.1, 0.2, 2.4, 0.2, WD2, trim); a.box(door.lx + door.cw / 2 + 0.1, 0, d / 2 + 0.1, 0.2, 2.4, 0.2, WD2, trim); a.box(door.lx, 2.25, d / 2 + 0.1, door.cw + 0.5, 0.2, 0.2, WD2, trim);
    for (let x = -w / 2 + 1.75; x < w / 2; x += 3.5) { if (Math.abs(x - door.lx) < 1.7) continue;
        a.box(x, 1.0, d / 2 + 0.06, 1.3, 1.4, 0.08, GLS, o.lit ? 0xffd890 : 0xe0cc98, { glow: o.lit || 0.35 }); a.box(x, 0.86, d / 2 + 0.12, 1.7, 0.14, 0.16, WD2, trim); a.box(x, 2.4, d / 2 + 0.12, 1.7, 0.14, 0.16, WD2, trim); }
    if (h >= 7) for (let x = -w / 2 + 1.75; x < w / 2; x += 3.5) { a.box(x, 4.5, d / 2 + 0.06, 1.2, 1.5, 0.08, GLS, o.lit ? 0xffd890 : 0xc8d4e0, o.lit ? { glow: o.lit * 0.8 } : null); a.box(x, 4.36, d / 2 + 0.12, 1.6, 0.14, 0.16, WD2, trim); }
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
    detail(a, w, d, door, o);
}

/* THE SECOND LAYER OUTSIDE (2026-11-16, the city's F-detail pass as the bar): what a builder adds after the massing. A dark foot board, a
   belt board on a two-storey front, brackets under the false front's cap, shutters upstairs, sills and heads on the side windows, a
   stovepipe (or a brick stack: `o.chimney`), a back door with its step, a downpipe, balusters on a balcony, a trade board hung over the
   boardwalk (`o.hang`) and words painted on a side wall (`o.side`: plain trade words). A board that hangs across the street's line is
   written twice, back to back (a quad draws one face). */
function detail(a, w, d, door, o) {
    const h = o.h, trim = o.trim || 0x4a3626, ink = o.ink || '#2a1a10', board = o.board || '#d8c090', IRON = 0x3a3a3e, two = h >= 7;
    a.box(0, 0, -0.03, w + 0.14, 0.42, d + 0.08, WD2, 0x3a2e26, { top: false, faces: 'blr' });
    if (two) a.box(0, 3.42, 0, w + 0.16, 0.2, d + 0.16, WD2, trim, { top: false });
    if (o.front) a.box(-w / 2 + 0.3, h + o.front - 0.24, d / 2 + 0.1, 0.16, 0.24, 0.18, WD2, trim, { roof: true, n: Math.floor((w - 0.6) / 0.7) + 1, step: [0.7, 0, 0] });
    if (two) for (let x = -w / 2 + 1.75; x < w / 2; x += 3.5) for (const s of [-1, 1]) a.box(x + s * 0.76, 4.5, d / 2 + 0.08, 0.3, 1.5, 0.05, WD, o.shutter || 0x4a6a5a);
    for (const s of [-1, 1]) for (let z = -d / 2 + 2.6; z < d / 2 - 1; z += 5.25) { a.box(s * (w / 2 + 0.1), 0.88, z, 0.14, 0.12, 1.5, WD2, trim); a.box(s * (w / 2 + 0.1), 2.4, z, 0.14, 0.12, 1.5, WD2, trim); }
    const rh = o.roof === 'shed' ? 1.1 : (o.rh || (o.front ? Math.max(0.9, Math.min(2.0, o.front - 0.3)) : 2.0));
    if (o.chimney) { const s = o.chimney; a.box(s * (w / 2 + 0.42), 0, -d / 5, 0.84, h + rh + 0.9, 1.2, 'bricks_1', 0xb08a70, { uv: [1.75, 1.75] }); a.box(s * (w / 2 + 0.42), h + rh + 0.9, -d / 5, 1.0, 0.14, 1.36, 'bricks_1', 0x8a6a54); }
    else if (o.pipe !== false) { const px = (o.pipe || 0.25) * w, pz = -d * 0.22; a.cyl(px, h, pz, 0.13, rh + 1.3, RIB, IRON, { seg: 8, roof: true }); a.cyl(px, h + rh + 1.3, pz, 0.24, 0.07, RIB, IRON, { seg: 8, roof: true }); }
    const bx = o.back == null ? -w / 4 : o.back; a.box(bx, 0, -d / 2 - 0.07, 1.1, 2.1, 0.06, WD2, 0x5a4230); a.box(bx, 2.1, -d / 2 - 0.08, 1.4, 0.14, 0.1, WD2, trim); a.box(bx, 0, -d / 2 - 0.55, 1.6, 0.18, 0.9, WD2, 0x6a5038);
    a.cyl(w / 2 + 0.13, 0.4, d / 2 - 0.45, 0.05, h - 0.5, RIB, 0x6a6a6e, { seg: 6 });
    if (o.porch === 'balcony') a.box(-w / 2 + 0.2, 3.66, d / 2 + 3.3, 0.06, 0.84, 0.06, WD2, trim, { n: Math.floor((w - 0.4) / 0.35) + 1, step: [0.35, 0, 0] });
    if (o.hang && o.porch !== 'none') { const hx = o.hangX == null ? w / 2 - 1.0 : o.hangX, hy = o.porch === 'balcony' ? 2.5 : 2.15, hz = d / 2 + 2.3, sw = Math.min(1.9, o.hang.length * 0.22 + 0.5);
        a.box(hx, hy + 0.62, hz, 0.06, 0.06, sw + 0.3, RIB, IRON); a.box(hx, hy - 0.04, hz, 0.07, 0.62, sw, WD2, 0x3a2e26);
        for (const s of [-1, 1]) a.sign(o.hang, hx + s * 0.045, hy, hz, sw - 0.1, 0.5, ink, board, 'rye', { ry: s * 90 }); }
    if (o.side) { const sw = Math.min(d - 2.4, o.side.length * 0.6 + 1.0), y = Math.min(h - 1.6, two ? 4.6 : h - 1.5);
        for (const s of [-1, 1]) for (const r of [90, 270]) a.sign(o.side, s * (w / 2 + 0.075), y, 0, sw, 1.0, ink, board, 'rye', { ry: r }); }
}

/* THE INSIDES (the interiors pass + THE SQUARES + the second pass, 2026-11-16). `inside()` lines a walk-in from within, in the same parts
   list as its front. It draws: a lit floor deck over the room's own unlit floor, a skirting, a dado, a wall band 0.34 m in from the row's
   edge (the room's own wall is at 0.30), a crown, flat pilasters on the square lines, a lit board ceiling with beams, a lit pane behind
   every window the front draws, a pendant lamp over every second square and a sconce on each side wall (glow only: no lamp of the room's).
   THE SQUARES (mondo's rule, the city's way): every building is whole 3.5 m squares. `I.X(i)` / `I.Z(j)` = the middle of square column i
   (from the left) / row j (from the BACK wall). A thing that blocks stands on a square's middle or fills whole squares, a wall stands on a
   square LINE (`I.LX(i)` / `I.LZ(j)`), a walkway is whole squares wide; chairs, lamps and wall pieces stand off the middles.
   It returns `solid(x, z, w, d, h, key, tint)` (a drawn fitting + a ghost block, written in furnish() where the handle is known),
   `counter`, `shelves`, `pendant`, `sconce`. Frame: x along the front, +z out of the door, y up. */
const INS = {};
function inside(a, id, w, d, h, door, o) {
    const iw = w / 2 - 0.34, il = d / 2 - 0.34, top = (o.ceil || h - 0.36), g = Math.min(0.8, (o.glow == null ? 0.3 : o.glow) * 1.9), dh = o.dadoH == null ? 1.1 : o.dadoH, G = INS[id] = [];
    const nx = Math.round(w / 3.5), nz = Math.round(d / 3.5), X = i => -w / 2 + (i + 0.5) * 3.5, Z = j => -d / 2 + (j + 0.5) * 3.5, LX = i => -w / 2 + i * 3.5, LZ = j => -d / 2 + j * 3.5;
    const dark = 0x4a3626, wood = o.dado == null ? 0x7a5a40 : o.dado;
    const band = (y0, y1, key, tint, uv, out) => { if (y1 <= y0) return; const x = { glow: g, uv: uv || [3.5, 1.75] }, e = out || 0, t = 0.02 + e;
        a.box(0, y0, -il + e / 2, 2 * iw, y1 - y0, t, key, tint, x); for (const s of [-1, 1]) a.box(s * (iw - e / 2), y0, 0, t, y1 - y0, 2 * il, key, tint, x);
        const l1 = door.lx - door.cw / 2 - 0.14, r0 = door.lx + door.cw / 2 + 0.14;
        a.box((-iw + l1) / 2, y0, il - e / 2, l1 + iw, y1 - y0, t, key, tint, x); a.box((iw + r0) / 2, y0, il - e / 2, iw - r0, y1 - y0, t, key, tint, x);
        if (y1 > 2.34) a.box(door.lx, Math.max(y0, 2.34), il - e / 2, r0 - l1, y1 - Math.max(y0, 2.34), t, key, tint, x); };
    /* (the floor is western()'s lit board deck, 5 cm proud of the ground: `floorKey` / `floorTint` there) */
    band(0, dh, o.dadoKey || WD2, wood); band(dh, top, o.key || WD, o.tint, o.uv);
    band(0, 0.16, WD2, dark, null, 0.03); band(dh - 0.07, dh + 0.03, WD2, dark, null, 0.025); band(top - 0.16, top, WD2, o.crown == null ? dark : o.crown, null, 0.05);   // skirting, dado rail, crown
    for (let i = 1; i < nz; i++) for (const s of [-1, 1]) a.box(s * (iw - 0.04), 0, LZ(i), 0.07, top, 0.22, WD2, wood, { glow: g });        // pilasters on the square lines
    for (let i = 1; i < nx; i++) a.box(LX(i), 0, -il + 0.04, 0.22, top, 0.07, WD2, wood, { glow: g });
    a.box(0, top, 0, 2 * iw, 0.02, 2 * il, o.ceilKey || WD2, o.ceilTint == null ? 0x8a6e54 : o.ceilTint, { sides: false, top: false, under: true, glow: Math.min(0.9, g * 1.25) });
    for (let j = 1; j < nz; j++) a.box(0, top - 0.2, LZ(j), 2 * iw, 0.2, 0.2, WD2, 0x5a4230, { glow: g * 0.7 });
    /* the panes: the same places the front and the side walls draw their windows */
    const pane = (x, y, z, ww, hh, side) => { a.box(x, y, z, side ? 0.03 : ww, hh, side ? ww : 0.03, GLS, 0xfff2cc, { glow: 0.95, uv: 'fit' });
        a.box(x, y - 0.08, z, side ? 0.1 : ww + 0.3, 0.08, side ? ww + 0.3 : 0.1, WD2, dark, { glow: g }); a.box(x, y + hh, z, side ? 0.1 : ww + 0.3, 0.08, side ? ww + 0.3 : 0.1, WD2, dark, { glow: g }); };
    if (top > 2.6) { for (let x = -w / 2 + 1.75; x < w / 2; x += 3.5) if (Math.abs(x - door.lx) >= 1.7) pane(x, 1.0, il - 0.05, 1.3, 1.4, false);
        for (const s of [-1, 1]) for (let z = -d / 2 + 2.6; z < d / 2 - 1; z += 5.25) pane(s * (iw - 0.05), 1.0, z, 1.2, 1.4, true); }
    /* a pendant oil lamp: a chain, a tin shade, a lit glass; a sconce: an iron bracket and a lit glass on a side wall */
    const pendant = (x, z, drop) => { const L = drop || Math.max(0.35, Math.min(1.4, top - 2.75)), y = top - L; a.cyl(x, y, z, 0.012, L, RIB, 0x3a3a3e, { seg: 4 });
        a.cyl(x, y - 0.02, z, 0.24, 0.14, RIB, 0x4a4a4e, { seg: 10, r2: 0.05 }); a.cyl(x, y - 0.26, z, 0.08, 0.24, GLS, 0xffd27a, { seg: 8, glow: 1, uv: 'fit' }); };
    const sconce = (s, z, y) => { const x = s * (iw - 0.16); a.box(x, (y || 1.95) - 0.06, z, 0.26, 0.05, 0.05, RIB, 0x3a3a3e); a.cyl(x - s * 0.06, (y || 1.95), z, 0.055, 0.2, GLS, 0xffd27a, { seg: 6, glow: 1, uv: 'fit' }); };
    if (o.lamps !== false) { for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) if ((i + j) % 2 === (o.lampOdd ? 1 : 0)) pendant(X(i), Z(j));
        for (const s of [-1, 1]) for (let j = 0; j < nz; j++) if (j % 2 === 1 || nz < 3) sconce(s, LZ(j) + 0.5); }
    const solid = (x, z, sw, sd, sh, key, tint, x2) => { a.box(x, (x2 && x2.y) || 0, z, sw, sh, sd, key || WD2, tint == null ? 0x7a5a40 : tint, Object.assign({ glow: g }, x2 && x2.o)); G.push([x, z, sw, sd, sh + ((x2 && x2.y) || 0)]); };
    /* a shop counter down the middle of a row / column of squares: a panelled body, a darker top that oversails it, a kick board */
    const counter = (x, z, len, alongZ, tint) => { const cw = alongZ ? 0.75 : len, cd = alongZ ? len : 0.75; solid(x, z, cw, cd, 1.02, WD, tint == null ? 0x8a6444 : tint);
        a.box(x, 1.02, z, cw + 0.16, 0.07, cd + 0.16, WD2, 0x4a3020, { glow: g }); a.box(x, 0, z, cw + 0.04, 0.14, cd + 0.04, WD2, 0x3a2a20, { glow: g }); };
    /* shelves on a wall: a back board, planks, a row of goods on each (`goods` = tints) */
    const shelves = (x, z, len, alongZ, hh, goods, sgn) => { const bw = alongZ ? 0.06 : len, bd = alongZ ? len : 0.06; sgn = sgn || 1; a.box(x, 0.3, z, bw, hh - 0.3, bd, WD2, 0x5a4230, { glow: g });
        const n = Math.max(2, Math.floor((hh - 0.4) / 0.55));
        for (let i = 0; i < n; i++) { const y = 0.5 + i * 0.55; a.box(x + (alongZ ? 0.19 * sgn : 0), y, z + (alongZ ? 0 : 0.19), alongZ ? 0.34 : len, 0.04, alongZ ? len : 0.34, WD2, 0x6a4e38, { glow: g });
            if (goods) { const m = Math.max(2, Math.floor(len / 0.42)); for (let k = 0; k < m; k++) { const t = -len / 2 + 0.25 + k * (len - 0.5) / (m - 1), c = goods[(k * 7 + i * 3) % goods.length], bh = 0.2 + ((k * 5 + i) % 3) * 0.07;
                    if ((k + i) % 4 === 3) continue;
                    if ((k + i) % 3 === 0) a.cyl(x + (alongZ ? 0.19 * sgn : t), y + 0.04, z + (alongZ ? t : 0.19), 0.07, bh + 0.08, GLS, c, { seg: 6, glow: g });
                    else a.box(x + (alongZ ? 0.19 * sgn : t), y + 0.04, z + (alongZ ? t : 0.19), alongZ ? 0.2 : 0.26, bh, alongZ ? 0.26 : 0.2, WD, c, { glow: g }); } } } };
    return { solid, counter, shelves, pendant, sconce, iw, il, top, g, nx, nz, X, Z, LX, LZ };
}
const GOODS = [0xc86a50, 0xd8c070, 0x6a8a9a, 0x8aa070, 0xe8e0c8, 0xa07850, 0x7a5a8a], BOTTLES = [0x7aa060, 0xc89040, 0x9a5a30, 0xd8d0b0, 0x4a7a6a];

/* THE EXTERIORS PASS (2026-11-16, the Western Town thread). The first build's seven fronts were 24 to 28 m wide (barns); a frontier front is
   7 to 17 m. Every front is redrawn at that scale, five small trades fill the rows (blacksmith, barber, assay office, telegraph, undertaker),
   and one plank boardwalk runs down each side of Main Street. North row: fronts face south, their porches on square row 21. South row: fronts
   face north, porches on row 26. The cross street is squares x 70..71. Inside each: squares (i, j), i from the left, j from the back wall. */
exports.buildings = ctx => { bind(ctx);
    const RF = 0x9a8a78;
    /* LIVERY STABLE, 5 x 5: five stalls across the back row (their walls on the square lines), a hay loft over them, a loft door and hoist in the gable */
    STABLES = building('stables', [49, 16, 54, 21, 'S'], 6, { leaf: 'leaf_barn', floorIn: 'dirt_2' }, (a, w, d, door) => { western(a, w, d, door, { h: 6, tint: 0xc08a60, roofTint: 0x8a6e58, rh: 3.2, porch: 'none', name: 'LIVERY STABLE', board: '#e8dcc0', pipe: false, back: 5, floorKey: 'dirt_2', floorTint: 0xd8b890 });
        a.box(0, 6.3, d / 2 + 0.06, 1.5, 1.7, 0.06, WD2, 0x6a4a34); a.box(0, 8.1, d / 2 + 0.7, 0.2, 0.2, 1.5, WD2, 0x4a3626); a.cyl(0, 7.4, d / 2 + 1.3, 0.02, 0.7, RIB, 0x3a3a3e, { seg: 4 });
        const I = inside(a, 'stables', w, d, 6, door, { tint: 0xb89068, dado: 0x8a6848, glow: 0.34 });
        for (let i = 1; i < I.nx; i++) I.solid(I.LX(i), I.Z(0), 0.12, 3.3, 1.5, WD, 0x9a7450);
        for (let i = 0; i < I.nx; i++) a.box(I.X(i) - 1.0, 1.0, I.LZ(1), 1.4, 0.1, 0.1, WD2, 0x6a4e38, { glow: I.g });
        a.box(0, 3.3, I.Z(0), 2 * I.iw, 0.16, 3.5, WD, 0x9a7450, { under: true, glow: I.g }); a.box(0, 3.46, I.LZ(1), 2 * I.iw, 0.9, 0.08, WD2, 0x6a4e38, { glow: I.g });
 });                                    // (the loft's hay is the `hay_bale` model now: furnish())
    /* BLACKSMITH, 3 x 3: the forge on the back middle square, the bench down the east column's back two squares */
    SMITH = building('smith', [56, 18, 59, 21, 'S'], 4.2, { floorIn: 'dirt_2' }, (a, w, d, door) => { western(a, w, d, door, { h: 4.2, tint: 0x9a8474, trim: 0x3a3028, roofTint: 0x6a625c, roof: 'shed', name: 'BLACKSMITH', ink: '#e8dcc0', board: '#3a3028', chimney: -1, hang: 'SMITH', floorKey: 'dirt_2', floorTint: 0xc8a888 });
        const I = inside(a, 'smith', w, d, 4.2, door, { tint: 0x7a6a5c, dado: 0x5a4a3e, ceilTint: 0x5a4a3e, glow: 0.3, lampOdd: true });
        /* (the forge on the back middle square is the `forge` model now, with the anvil, the bellows and the grindstone: furnish()) */
        I.counter(I.X(2), I.LZ(1), 6.4, true, 0x6a5038); });
    /* SALOON, 4 x 5: the bar down the west column (rows 1..3), the stage on the back row's two east squares, the gallery drawn over the back row */
    SALOON = building('saloon', [61, 16, 65, 21, 'S'], 7, { leaf: 'leaf_saloon', leafDouble: true }, (a, w, d, door) => { western(a, w, d, door, { h: 7, tint: 0xd8785a, trim: 0x5a3424, roofTint: RF, front: 2.4, step: 0.9, porch: 'balcony', lit: 0.85, name: 'SALOON', ink: '#f0d890', board: '#3a1c14', chimney: -1, hang: 'BEER', side: 'WHISKEY', shutter: 0x3a2a22 });
        const I = inside(a, 'saloon', w, d, 7, door, { key: PLAS, tint: 0xa84a40, dado: 0x5a3626, ceilTint: 0x6a4a36, glow: 0.36, lamps: false });
        I.counter(I.X(0), I.Z(2), 10.3, true, 0x7a4a30); a.box(I.X(0) + 0.5, 0.18, I.Z(2), 0.06, 0.06, 10.1, RIB, 0xd8b060, { glow: 0.5 });
        I.shelves(-I.iw + 0.05, I.Z(2), 9.6, true, 2.9, BOTTLES); a.box(-I.iw + 0.1, 1.7, I.Z(2), 0.03, 1.1, 3.4, GLS, 0xd8e8f0, { glow: 0.6, uv: 'fit' });
        I.solid(I.LX(3), I.Z(0), 6.9, 3.3, 0.5, WD, 0x8a5a3a); a.box(I.LX(3), 0.5, -I.il + 0.08, 6.9, 3.0, 0.06, PLAS, 0x7a2a28, { glow: I.g });
        a.box(0, 3.5, I.Z(0), 2 * I.iw, 0.16, 3.3, WD, 0x8a5a3a, { under: true, glow: I.g }); a.box(0, 3.66, I.LZ(1) - 0.1, 2 * I.iw, 0.95, 0.08, WD2, 0x5a3626, { glow: I.g });
        a.box(-I.iw + 0.2, 3.66, I.LZ(1) - 0.1, 0.06, 0.9, 0.06, WD2, 0x5a3626, { glow: I.g, n: Math.floor(2 * I.iw / 0.4), step: [0.4, 0, 0] });
        for (let i = 1; i < 4; i++) if (i !== 3) a.box(I.LX(i), 0, I.LZ(1) - 0.1, 0.2, 3.5, 0.2, WD2, 0x5a3626, { glow: I.g });
        for (const q of [[1, 2], [2, 3], [3, 1], [1, 4], [3, 4]]) I.pendant(I.X(q[0]), I.Z(q[1]), 2.6); for (const s of [-1, 1]) for (const j of [1, 3]) I.sconce(s, I.LZ(j) + 0.5, 2.2); });
    /* BARBER, 3 x 3: the long shelf under the mirrors on the back row's two west squares, a chair on each square before it */
    BARBER = building('barber', [66, 18, 69, 21, 'S'], 4.6, {}, (a, w, d, door) => { western(a, w, d, door, { h: 4.6, tint: 0xe8e0d0, trim: 0x8a3a30, roofTint: RF, front: 1.5, name: 'BARBER', ink: '#8a2a22', board: '#f0e8d8', hang: 'SHAVE', pipe: 0.3 });
        const I = inside(a, 'barber', w, d, 4.6, door, { key: PLAS, tint: 0xe8e4d8, dado: 0x8a3a30, ceilTint: 0xb8a890, glow: 0.4 });
        I.counter(I.LX(1), -I.il + 0.45, 6.6, false, 0x8a5a40); I.shelves(I.iw - 0.05, I.Z(0), 3.0, true, 2.2, BOTTLES, -1); });
    /* BANK, 3 x 4: the tellers' counter on row 1's two west squares under a brass cage, the gate on its east square; the vault on the back row */
    BANK = building('bank', [73, 17, 76, 21, 'S'], 5.25, { leafDouble: true, keyIn: PLAS }, (a, w, d, door) => { western(a, w, d, door, { h: 5.25, tint: 0xf0e8d4, trim: 0x6a6458, roofTint: 0x70707a, front: 1.8, name: 'BANK', ink: '#e8c860', board: '#2a3a30', chimney: 1, pipe: false });
        for (const s of [-1, 1]) a.box(door.lx + s * 1.6, 0, d / 2 + 0.3, 0.5, 4.6, 0.5, PLAS, 0xe8e0cc);
        a.box(0, 0, -0.04, w + 0.2, 1.0, d + 0.1, 'bricks_1', 0xb8a890, { top: false, faces: 'blr', uv: [1.75, 1.75] });
        const I = inside(a, 'bank', w, d, 5.25, door, { key: PLAS, tint: 0xe8e0c8, dado: 0x3a5a48, ceilTint: 0xc8c0a8, glow: 0.4, lampOdd: true });
        I.counter(I.LX(1), I.Z(1), 6.6, false, 0x6a4a34); I.solid(I.X(2), I.Z(1), 3.2, 0.1, 1.1, RIB, 0xc8a050);
        a.cyl(-I.iw + 0.25, 1.09, I.Z(1), 0.025, 1.3, RIB, 0xd8b060, { seg: 6, glow: 0.5, n: 34, step: [6.5 / 33, 0, 0] }); a.box(I.LX(1), 2.39, I.Z(1), 6.7, 0.1, 0.12, RIB, 0xd8b060, { glow: 0.5 });
        a.sign('TELLER', I.LX(1), 2.6, I.Z(1), 2.2, 0.5, '#e8c860', '#2a3a30', 'rye'); });
    /* ASSAY OFFICE, 3 x 3: the counter on the middle row's two west squares, samples on the back wall */
    ASSAY = building('assay', [77, 18, 80, 21, 'S'], 4.4, {}, (a, w, d, door) => { western(a, w, d, door, { h: 4.4, tint: 0xc8a878, trim: 0x5a4028, roofTint: RF, front: 1.2, step: 0.6, name: 'ASSAY OFFICE', board: '#e8dcc0', hang: 'GOLD', pipe: -0.25 });
        const I = inside(a, 'assay', w, d, 4.4, door, { tint: 0xc8a878, dado: 0x6a4a30, glow: 0.36 });
        I.counter(I.LX(1), I.Z(1), 6.6, false, 0x7a5638); I.shelves(0, -I.il + 0.05, 2 * I.iw - 0.6, false, 2.6, [0x8a8a8a, 0xc8a850, 0x6a5a4a, 0xb0b0b8, 0x9a7a50]); });
    /* TELEGRAPH, 2 x 3: the counter right across the middle row with its wicket, pigeonholes on the back wall; the pole and its arm outside */
    WIRE = building('telegraph', [81, 18, 83, 21, 'S'], 4.9, {}, (a, w, d, door) => { western(a, w, d, door, { h: 4.9, tint: 0xa8b4c0, trim: 0x3a4450, roofTint: RF, front: 1.6, name: 'TELEGRAPH', ink: '#f0e8d0', board: '#2a3440', pipe: false });
        /* (the pole outside is the `telegraph_pole` model now, the first of the line that leaves town south: dress()) */
        const I = inside(a, 'telegraph', w, d, 4.9, door, { key: PLAS, tint: 0xb8c4cc, dado: 0x3a4450, glow: 0.38 });
        I.counter(0, I.Z(1), 2 * I.iw, false, 0x5a4a3e); a.cyl(-1.2, 1.09, I.Z(1), 0.022, 1.0, RIB, 0xd8b060, { seg: 6, glow: 0.5, n: 13, step: [0.2, 0, 0] }); a.box(0, 2.09, I.Z(1), 2.7, 0.08, 0.1, RIB, 0xd8b060, { glow: 0.5 });
        I.shelves(0, -I.il + 0.05, 2 * I.iw - 0.4, false, 2.7, [0xf0e8d0, 0xe0d0a8, 0xf0e8d0, 0xd8c8a0]); });
    /* HOTEL, 4 x 6: the lobby is the front two rows. Behind it the corridor is square column 2, whole and clear; two rooms of 2 x 2 squares
       west of it, two of 1 x 2 east of it; every wall on a square line, every doorway half a square wide on a square's edge */
    HOTEL = building('hotel', [85, 15, 89, 21, 'S'], 8.75, { leafDouble: true }, (a, w, d, door) => { western(a, w, d, door, { h: 8.75, tint: 0xe0c090, trim: 0x6a4630, roofTint: 0xa86a58, front: 1.4, porch: 'balcony', lit: 0.7, name: 'HOTEL', board: '#f0e8d0', chimney: 1, hang: 'ROOMS', side: 'ROOMS', pipe: false });
        const I = inside(a, 'hotel', w, d, 8.75, door, { key: PLAS, tint: 0xd8c8a0, dado: 0x6a4630, ceil: 3.4, ceilTint: 0xb89a78, glow: 0.4 });
        const T = 0.14, H = 3.4, K = 0xd8c8a0, wallX = (x0, x1, z) => I.solid((x0 + x1) / 2, z, x1 - x0, T, H, PLAS, K), wallZ = (x, z0, z1) => I.solid(x, (z0 + z1) / 2, T, z1 - z0, H, PLAS, K);
        wallX(-I.iw, I.LX(2), I.LZ(4)); wallX(I.LX(3), I.iw, I.LZ(4));                                                         // the lobby's back wall: the corridor's mouth is square column 2
        for (const x of [I.LX(2), I.LX(3)]) for (const j of [1, 3]) { const zc = I.Z(j);                                          // a doorway on rows 1 and 3, 1.75 m, in each corridor wall
            wallZ(x, I.LZ(j - 1) + (j === 1 ? 0.34 : 0), zc - 0.875); wallZ(x, zc + 0.875, I.LZ(j + 1)); a.box(x, 2.2, zc, T, H - 2.2, 1.75, PLAS, K, { glow: I.g }); }
        wallX(-I.iw, I.LX(2), I.LZ(2)); wallX(I.LX(3), I.iw, I.LZ(2));                                                         // between the rooms
        I.counter(I.X(0), I.Z(4), 3.3, false, 0x7a4a30); a.box(I.X(0), 1.5, I.LZ(4) + 0.12, 2.6, 1.3, 0.05, WD2, 0x5a3626, { glow: I.g }); });
    /* SHERIFF, 3 x 3: three cells on the back row, one square each: bars on the line before them, barred walls between them */
    JAIL = building('jail', [50, 27, 53, 30, 'N'], 4.2, { leaf: 'leaf_cell', keyIn: 'bricks_1', floorIn: 'cobblestone' }, (a, w, d, door) => { western(a, w, d, door, { h: 4.2, tint: 0xc8b8a0, trim: 0x4a443e, roofTint: 0x7a746c, roof: 'shed', front: 1.3, name: 'SHERIFF', ink: '#f0e8d0', board: '#3a3430', hang: 'JAIL', pipe: 0.3, floorKey: 'cobblestone', floorTint: 0xd0c8b8 });
        a.box(0, 0, 0, w + 0.3, 1.2, d + 0.3, 'bricks_1', 0xc8b8a4, { top: false, faces: 'blr' });
        for (let x = -w / 2 + 1.75; x < w / 2; x += 3.5) if (Math.abs(x - door.lx) >= 1.7) a.cyl(x - 0.5, 1.0, d / 2 + 0.12, 0.025, 1.4, RIB, 0x2a2a2e, { seg: 6, n: 6, step: [0.2, 0, 0] });
        const I = inside(a, 'jail', w, d, 4.2, door, { key: 'bricks_1', tint: 0xc0b09c, dadoKey: 'bricks_1', dado: 0x9a8a78, ceilTint: 0x6a5a4a, glow: 0.34, uv: [1.75, 1.75], lampOdd: true });
        const zB = I.LZ(1), IR = 0x3a3a40, bar = { seg: 6, glow: 0.2 }; { INS.jail.push([0, zB, 2 * I.iw, 0.12, 2.6]); for (const i of [1, 2]) INS.jail.push([I.LX(i), I.Z(0), 0.12, 3.3, 2.6]); }
        a.box(0, 0, zB, 2 * I.iw, 0.12, 0.1, RIB, IR, { glow: 0.2 }); a.cyl(-I.iw + 0.1, 0.12, zB, 0.028, 2.5, RIB, IR, Object.assign({ n: 60, step: [(2 * I.iw - 0.2) / 59, 0, 0] }, bar));
        for (const i of [1, 2]) { a.box(I.LX(i), 0, I.Z(0), 0.1, 0.12, 3.3, RIB, IR, { glow: 0.2 }); a.cyl(I.LX(i), 0.12, zB - 0.15, 0.028, 2.5, RIB, IR, Object.assign({ n: 20, step: [0, 0, -3.0 / 19] }, bar)); }
        for (const y of [1.3, 2.6]) { a.box(0, y, zB, 2 * I.iw, 0.08, 0.1, RIB, IR, { glow: 0.2 }); for (const i of [1, 2]) a.box(I.LX(i), y, I.Z(0), 0.1, 0.08, 3.3, RIB, IR, { glow: 0.2 }); }
        for (let i = 0; i < 3; i++) { for (const s of [-1, 1]) a.box(I.X(i) + s * 0.5, 0.12, zB + 0.04, 0.08, 2.1, 0.12, RIB, 0x5a5a62, { glow: 0.2 }); a.box(I.X(i), 2.14, zB + 0.04, 1.08, 0.08, 0.12, RIB, 0x5a5a62, { glow: 0.2 }); } });
    /* UNDERTAKER, 3 x 3: a trestle on each of the back row's two west squares, the counter on the middle row's east square */
    COFFINS = building('undertaker', [55, 27, 58, 30, 'N'], 5, {}, (a, w, d, door) => { western(a, w, d, door, { h: 5, tint: 0x9a968e, trim: 0x2a2826, roofTint: 0x6a665e, front: 1.7, name: 'UNDERTAKER', ink: '#e8e4d8', board: '#1e1c1a', hang: 'COFFINS', pipe: -0.25 });
        const I = inside(a, 'undertaker', w, d, 5, door, { key: PLAS, tint: 0x9a86a0, dado: 0x4a4040, ceilTint: 0x6a6060, glow: 0.36, lampOdd: true });
        for (const i of [0, 1]) { for (const z of [-0.7, 0.7]) a.box(I.X(i), 0, I.Z(0) + z, 0.9, 0.7, 0.12, WD2, 0x4a3a30, { glow: I.g }); INS.undertaker.push([I.X(i), I.Z(0), 0.9, 2.2, 0.7]); }
        I.counter(I.X(2), I.Z(1), 3.2, false, 0x3a302a); });
    /* GENERAL STORE, 4 x 4: the long counter on row 1's three west squares (the east square is the way behind it), goods on three walls */
    STORE = building('store', [73, 27, 77, 31, 'N'], 5.25, {}, (a, w, d, door) => { western(a, w, d, door, { h: 5.25, tint: 0x9ab09a, trim: 0x3e4e40, roofTint: RF, front: 2.0, step: 0.7, name: 'GENERAL STORE', board: '#e8dcc0', hang: 'GOODS', side: 'DRY GOODS', chimney: 1, pipe: false });
        const I = inside(a, 'store', w, d, 5.25, door, { tint: 0xc8b890, dado: 0x5a6a58, glow: 0.38 });
        I.counter(I.X(1), I.Z(1), 10.3, false, 0x7a5a3c); I.shelves(0, -I.il + 0.05, 2 * I.iw - 0.6, false, 3.1, GOODS); I.shelves(-I.iw + 0.05, I.LZ(3), 6.0, true, 2.6, GOODS); });
    /* THE CHURCH, 3 x 5: a narrow nave, its gable end and steeple to the back street; the chancel is the whole back row, one step up; the aisle is square column 1 */
    CHURCH = building('church', [64, 0, 67, 5, 'S'], 6, { leafDouble: true }, (a, w, d, door) => { western(a, w, d, door, { h: 6, tint: 0xffffff, trim: 0xb0aaa0, roofTint: 0x6a6058, rh: 3.6, porch: 'none', key: PLAS, pipe: false, back: 3.5 });
        a.box(0, 6, d / 2 - 1.6, 2.6, 5.4, 2.6, PLAS, 0xffffff, { roof: true }); a.box(0, 9.2, d / 2 - 0.28, 1.0, 1.5, 0.06, WD2, 0x3a2a20, { roof: true });   // the steeple over the door, its louvre
        a.roof('pyramid', 0, 11.4, d / 2 - 1.6, 3.2, 3.8, 3.2, SHG, 0x6a6058);
        a.box(0, 15.2, d / 2 - 1.6, 0.16, 1.6, 0.16, WD2, 0x3a2a20, { roof: true }); a.box(0, 16.1, d / 2 - 1.6, 0.9, 0.16, 0.16, WD2, 0x3a2a20, { roof: true });
        a.box(0, 3.0, d / 2 + 0.07, 1.1, 1.6, 0.05, GLS, 0xffe8a8, { glow: 0.5, uv: 'fit' }); a.box(0, 0, d / 2 + 0.9, 3.4, 0.2, 1.7, WD2, 0x8a7a68);                 // the window over the door, the step
        const I = inside(a, 'church', w, d, 6, door, { key: PLAS, tint: 0xf0ece0, dado: 0x7a5a40, ceilTint: 0x8a6a50, glow: 0.42, lampOdd: true });
        I.solid(0, I.Z(0), 2 * I.iw, 3.3, 0.3, WD, 0x8a6a4c); for (const s of [-1, 1]) a.box(s * 2.6, 1.6, -I.il + 0.05, 1.0, 2.8, 0.03, GLS, 0xffe8a8, { glow: 1, uv: 'fit' }); });
};

/* what stands inside, in each building's own frame. `inn` = a prop on the building's own floor (`floor: true`: without it a prop beside a
   wall or a ghost block stands on top of it); `y` under 1 m lifts, from 1 m it is a height. `sq(B, i, j)` = the middle of square (i, j),
   i from the left, j from the back wall: a prop that BLOCKS stands there; the rest stands off the middles (THE SQUARES). */
exports.furnish = ctx => { bind(ctx);
    const inn = (B, key, lx, lz, o) => put(B, key, lx, lz, Object.assign({ floor: true }, o || {}));
    const sx = (B, i) => -B.fw / 2 + (i + 0.5) * 3.5, sz = (B, j) => -B.fd / 2 + (j + 0.5) * 3.5, at = (B, key, i, j, o) => inn(B, key, sx(B, i), sz(B, j), o);
    const H = { stables: STABLES, smith: SMITH, saloon: SALOON, barber: BARBER, bank: BANK, assay: ASSAY, telegraph: WIRE, hotel: HOTEL, jail: JAIL, undertaker: COFFINS, store: STORE, church: CHURCH };
    Object.keys(INS).forEach(id => INS[id].forEach(g => { const B = H[id], along = g[2] >= g[3], p = along ? B.at(g[0] - g[2] / 2, g[1]) : B.at(g[0], g[1] - g[3] / 2), q = along ? B.at(g[0] + g[2] / 2, g[1]) : B.at(g[0], g[1] + g[3] / 2);
        feat({ k: 'wall', x0: p[0], z0: p[1], x1: q[0], z1: q[1], h: r2(g[4]), t: r2(along ? g[3] : g[2]), key: WD2, ghost: true, rail: false }); }));
    const set = (B, i, j, n) => { const x = sx(B, i), z = sz(B, j); inn(B, 'psx_dinner_table_1', x, z, {}); for (let k = 0; k < n; k++) { const t = k * Math.PI * 2 / n + 0.4; inn(B, 'psx_chair_mp_3', x + Math.cos(t) * 1.15, z + Math.sin(t) * 1.15, { face: Math.round(270 - t * 180 / Math.PI + 360) % 360 }); } };
    /* THE SALOON (4 x 5): stools along the bar's east edge, the piano on the stage, tables and the two gaming tables on square middles; the door square (1, 4) stays clear */
    for (const z of [-5.4, -3.6, -1.8, 0, 1.8]) inn(SALOON, 'bar_stool', sx(SALOON, 0) + 1.25, z, {});
    for (const z of [-4, -1.5, 1]) inn(SALOON, 'psx_glass_bottle_' + (z < -2 ? 1 : 2), sx(SALOON, 0), z, { y: 1.1 }); inn(SALOON, 'cash_register', sx(SALOON, 0), 2.6, { y: 1.1, face: 90 });
    at(SALOON, 'decor_piano', 3, 0, { y: 0.5, face: 180 }); inn(SALOON, 'bar_stool', sx(SALOON, 3), sz(SALOON, 0) + 1.0, { y: 0.5 }); inn(SALOON, 'crystal_chandelier', sx(SALOON, 2) - 1.75, sz(SALOON, 2), { y: 4.9, h: 1.7 });
    at(SALOON, 'blackjack_table', 3, 1, { face: 180 }); at(SALOON, 'roulette_table', 3, 2, { face: 270 }); set(SALOON, 2, 2, 3); set(SALOON, 2, 4, 4); set(SALOON, 3, 4, 2); set(SALOON, 1, 3, 3);
    inn(SALOON, 'slot_machine', 6.2, sz(SALOON, 3) + 1.2, { face: 270 }); inn(SALOON, 'wooden_barrel', -5.9, 7.6, {}); inn(SALOON, 'painting_portrait', 6.33, sz(SALOON, 1) + 0.9, { y: 2.0, face: 270 });
    /* THE BANK (3 x 4): the vault on the back row's middle square, the manager's desk on its west square */
    at(BANK, 'vault', 1, 0, { face: 180, h: 4.4 }); at(BANK, 'exec_desk', 0, 0, { face: 90 }); inn(BANK, 'psx_chair_mp_3', sx(BANK, 0) - 1.0, sz(BANK, 0), { face: 90 }); inn(BANK, 'floor_safe', 4.2, sz(BANK, 0) - 0.9, { face: 270 }); inn(BANK, 'money_sacks', 4.0, sz(BANK, 0) + 0.8, {});
    inn(BANK, 'money_counter', -3.0, sz(BANK, 1), { y: 1.1 }); inn(BANK, 'psx_gold_bar_pcs_1', -1.0, sz(BANK, 1), { y: 1.1 }); inn(BANK, 'psx_cash_1', 0.6, sz(BANK, 1), { y: 1.1 });
    inn(BANK, 'iron_garden_bench', -4.3, sz(BANK, 2) + 0.9, { face: 90 }); inn(BANK, 'potted_plant', 4.3, 6.0, {}); inn(BANK, 'wall_clock', 3.2, 6.58, { y: 3.2, face: 0 }); inn(BANK, 'painting_landscape', 4.83, sz(BANK, 2) + 0.8, { y: 2.0, face: 270 });
    /* THE SHERIFF'S (3 x 3): a cot and a bucket in each cell (the cot on the cell's middle), the desk on the middle row's east square */
    for (let i = 0; i < 3; i++) { at(JAIL, 'cot', i, 0, { face: 90 }); inn(JAIL, 'wooden_bucket', sx(JAIL, i) + 1.1, sz(JAIL, 0) - 1.1, {}); }
    at(JAIL, 'exec_desk', 2, 1, { face: 270 }); inn(JAIL, 'psx_chair_mp_3', sx(JAIL, 2) + 1.0, sz(JAIL, 1), { face: 270 }); inn(JAIL, 'rifle_rack', 4.83, sz(JAIL, 2) + 0.6, { face: 270 }); inn(JAIL, 'mugshot_wall', -4.83, sz(JAIL, 1) + 0.8, { face: 90 });
    inn(JAIL, 'footlocker', -4.2, sz(JAIL, 2) + 1.0, { face: 90 }); inn(JAIL, 'key_rack', -4.83, sz(JAIL, 1) - 1.0, { y: 1.5, face: 90 }); inn(JAIL, 'rocking_chair', 3.9, sz(JAIL, 2) + 1.0, { face: 200 });
    /* THE CHURCH (3 x 5): pews on the two side columns of rows 1..3, the aisle (column 1) clear from the door to the table */
    for (const j of [1, 2, 3]) for (const i of [0, 2]) at(CHURCH, 'church_pew', i, j, { face: 0 });
    at(CHURCH, 'stone_altar', 1, 0, { y: 0.3 }); inn(CHURCH, 'wooden_cross', 0, -8.02, { y: 2.2, face: 0, h: 2.4 }); at(CHURCH, 'lectern', 2, 0, { y: 0.3, face: 180 }); inn(CHURCH, 'meshy_bible', 0, sz(CHURCH, 0), { y: 1.26 });
    inn(CHURCH, 'candle_ring', -3.9, sz(CHURCH, 0) - 0.9, { y: 0.3, noLight: true }); inn(CHURCH, 'hw_candles', -0.7, sz(CHURCH, 0), { y: 1.26 }); inn(CHURCH, 'hw_candles_2', 0.7, sz(CHURCH, 0), { y: 1.26 }); inn(CHURCH, 'decor_piano', -3.9, sz(CHURCH, 0) + 0.7, { y: 0.3, face: 90 }); 
    /* THE GENERAL STORE (4 x 4): the door square (1, 3) and the way round the counter (column 3) stay clear */
    inn(STORE, 'cash_register', -3.0, sz(STORE, 1), { y: 1.1, face: 180 }); for (let i = 0; i < 4; i++) inn(STORE, 'psx_canned_food_mp_' + (1 + i), -0.6 + i * 0.3, sz(STORE, 1), { y: 1.1 }); inn(STORE, 'platform_scale', 1.6, sz(STORE, 1) - 1.2, {});
    at(STORE, 'bread_rack', 3, 0, { face: 270 }); inn(STORE, 'wooden_barrel', 5.9, sz(STORE, 2) + 1.0, {}); inn(STORE, 'wooden_barrel', 6.0, sz(STORE, 3) - 0.6, {}); inn(STORE, 'meshy_burlap_sack', 5.9, sz(STORE, 3) + 0.9, {}); inn(STORE, 'meshy_burlap_sack', 4.9, 6.0, { face: 40 });
    inn(STORE, 'psx_wooden_crate_2', 1.0, 5.9, {}); inn(STORE, 'psx_wooden_crate_3', 2.3, 6.0, { face: 30 }); inn(STORE, 'psx_wooden_crate_6', 1.2, 5.9, { y: 1.08, face: 20 }); inn(STORE, 'rocking_chair', -5.6, 5.6, { face: 150 });
    /* THE LIVERY STABLE (5 x 5): a horse on the middle of three stalls, straw and sacks along the walls */
    at(STABLES, 'horse', 0, 0, { face: 0 }); at(STABLES, 'horse_brown', 1, 0, { face: 0 }); at(STABLES, 'horse_black', 4, 0, { face: 0 });
    at(STABLES, 'hw_straw_2', 2, 0, { face: 20 }); at(STABLES, 'hw_straw', 3, 0, { face: 100 }); at(STABLES, 'hw_straw', 0, 2, { face: 0 }); inn(STABLES, 'hw_straw', -7.6, sz(STABLES, 3) - 0.9, { face: 90 }); at(STABLES, 'hw_straw', 4, 4, { face: 0 });
    inn(STABLES, 'meshy_burlap_sack', 7.6, sz(STABLES, 2) - 0.9, {}); inn(STABLES, 'meshy_burlap_sack', 7.5, sz(STABLES, 2) + 0.6, { face: 60 }); inn(STABLES, 'wooden_bucket', sx(STABLES, 0) + 1.1, sz(STABLES, 1) - 1.0, {}); inn(STABLES, 'wooden_bucket', sx(STABLES, 3) + 1.1, sz(STABLES, 1) - 1.0, {});
    inn(STABLES, 'psx_wooden_crate_2', 7.5, 7.5, {}); inn(STABLES, 'wooden_barrel', -7.5, 7.5, {}); inn(STABLES, 'wooden_ladder', 7.86, sz(STABLES, 1), { face: 270 }); inn(STABLES, 'hw_shovel', -7.9, sz(STABLES, 1) + 1.0, {});
    /* THE HOTEL (4 x 6): the lobby (rows 4, 5); rooms W1 / W2 (2 x 2 squares) and E1 / E2 (1 x 2), the bed on a square's middle */
    inn(HOTEL, 'key_rack', sx(HOTEL, 0), sz(HOTEL, 4) - 1.5, { y: 1.6, face: 180 }); inn(HOTEL, 'cash_register', sx(HOTEL, 0) + 0.9, sz(HOTEL, 4), { y: 1.1, face: 0 }); inn(HOTEL, 'psx_armchair_1', 5.9, sz(HOTEL, 5) + 1.0, { face: 230 }); inn(HOTEL, 'psx_armchair_1', 5.9, sz(HOTEL, 4) - 0.9, { face: 290 });
    inn(HOTEL, 'psx_coffee_table_1', 5.7, sz(HOTEL, 5) - 1.0, {}); inn(HOTEL, 'psx_carpet_mp_1', sx(HOTEL, 2), sz(HOTEL, 5) - 1.75, { y: 0.075 }); inn(HOTEL, 'potted_plant', -6.0, 9.6, {}); inn(HOTEL, 'painting_landscape', 6.33, sz(HOTEL, 5) - 1.75, { y: 1.9, face: 270 }); inn(HOTEL, 'wall_clock', sx(HOTEL, 1), sz(HOTEL, 4) - 1.6, { y: 2.6, face: 180 });
    for (const j of [0, 2]) { at(HOTEL, 'psx_bed_4_' + (1 + j / 2), 0, j, { face: 90 }); inn(HOTEL, 'psx_bedside_table_1', -6.0, sz(HOTEL, j) + 1.2, { face: 90 }); inn(HOTEL, 'hw_candles', -6.0, sz(HOTEL, j) + 1.2, { y: 0.64, noLight: true });
        inn(HOTEL, 'psx_wardrobe_mp_1', sx(HOTEL, 0), sz(HOTEL, j + 1) + 1.3, { face: 0 }); inn(HOTEL, 'rug_round', sx(HOTEL, 1), sz(HOTEL, j) + 1.75, { y: 0.075 }); inn(HOTEL, 'psx_armchair_2', sx(HOTEL, 1) + 0.9, sz(HOTEL, j) - 1.0, { face: 300 });
        at(HOTEL, 'psx_bed_4_' + (3 + j / 2), 3, j, { face: 270 }); inn(HOTEL, 'psx_bedside_table_1', 6.0, sz(HOTEL, j) + 1.3, { face: 270 }); inn(HOTEL, 'psx_wardrobe_mp_1', 6.1, sz(HOTEL, j + 1) + 1.1, { face: 270 }); }
    /* THE FIVE TRADES */
    at(BARBER, 'barber_chair', 0, 1, { face: 0 }); at(BARBER, 'barber_chair', 1, 1, { face: 0 }); inn(BARBER, 'barber_mirror', sx(BARBER, 0), -4.83, { face: 0 }); inn(BARBER, 'barber_mirror', sx(BARBER, 1), -4.83, { face: 0 });
    inn(BARBER, 'barber_pole', -4.6, 3.9, { y: 1.4 }); inn(BARBER, 'iron_garden_bench', 4.2, sz(BARBER, 2) - 0.6, { face: 270 }); inn(BARBER, 'psx_glass_bottle_1', -2.6, -4.4, { y: 1.1 }); inn(BARBER, 'psx_glass_bottle_2', 0.6, -4.4, { y: 1.1 }); inn(BARBER, 'wooden_bucket', 4.2, sz(BARBER, 1) + 1.0, {});
    at(COFFINS, 'trap_coffin_open', 2, 0, { face: 180 }); inn(COFFINS, 'trap_coffin_lid', -4.3, sz(COFFINS, 1) + 0.9, { face: 90 });
    inn(COFFINS, 'hw_shovel', -4.4, sz(COFFINS, 2) + 0.8, {}); inn(COFFINS, 'hw_candles', sx(COFFINS, 2), sz(COFFINS, 1), { y: 1.1, noLight: true }); inn(COFFINS, 'wooden_cross', sx(COFFINS, 0) + 1.75, -4.83, { y: 2.6, face: 0, h: 1.6 });
    inn(ASSAY, 'platform_scale', 4.0, sz(ASSAY, 0) + 0.9, {}); inn(ASSAY, 'floor_safe', -4.2, sz(ASSAY, 0) + 0.9, { face: 90 }); inn(ASSAY, 'psx_gold_bar_pcs_1', -2.6, sz(ASSAY, 1), { y: 1.1 }); inn(ASSAY, 'psxg_rock_3', -1.2, sz(ASSAY, 1), { y: 1.1, h: 0.3 }); inn(ASSAY, 'psxg_rock_4', -0.4, sz(ASSAY, 1), { y: 1.1 });
    inn(ASSAY, 'psx_wooden_crate_2', 4.1, 4.1, {}); inn(ASSAY, 'money_sacks', -4.2, 4.0, {}); inn(ASSAY, 'psx_chair_mp_3', -1.75, sz(ASSAY, 1) - 1.0, { face: 180 });
    at(WIRE, 'exec_desk', 1, 0, { face: 180 }); inn(WIRE, 'psx_chair_mp_3', sx(WIRE, 1), sz(WIRE, 0) - 1.0, { face: 180 }); inn(WIRE, 'wall_clock', -2.0, -4.83, { y: 3.1, face: 0 }); inn(WIRE, 'iron_garden_bench', 2.5, sz(WIRE, 2) + 0.6, { face: 270 }); inn(WIRE, 'notice_board', -3.07, sz(WIRE, 2), { y: 1.5, face: 90 });
    inn(SMITH, 'wooden_barrel', -4.1, sz(SMITH, 0) - 0.6, {}); inn(SMITH, 'wooden_bucket', -2.4, sz(SMITH, 0) + 0.9, {}); inn(SMITH, 'hw_shovel', -4.5, sz(SMITH, 1) + 1.1, {});
    /* THE MODEL LIST PASS, inside: the pack's own coffins and a body at the undertaker's, tongs and a quench tub at the forge, guns and
       shells at the sheriff's, cash and coins on the card tables, a confessional and the stained glass in the church, cobwebs, meat on the
       store's counter, pictures and pillows in the hotel */
    at(COFFINS, 'hw_coffin', 0, 0, { y: 0.7, face: 0 }); at(COFFINS, 'hw_body', 0, 0, { y: 0.78, face: 0 }); at(COFFINS, 'hw_coffin_2', 1, 0, { y: 0.7, face: 0 }); inn(COFFINS, 'hw_coffin_lid', 4.3, sz(COFFINS, 2) + 0.4, { face: 80 });
    inn(COFFINS, 'psx_cobweb_1', -4.5, -4.5, { y: 3.6 }); inn(COFFINS, 'hw_candle', sx(COFFINS, 2) - 0.8, sz(COFFINS, 1), { y: 1.1, noLight: true }); inn(COFFINS, 'hw_part', 4.2, sz(COFFINS, 1) - 1.2, {});
    inn(SMITH, 'meshy_tongs', sx(SMITH, 2), sz(SMITH, 1) - 0.6, { y: 1.1 }); inn(SMITH, 'cauldron', sx(SMITH, 0) + 0.2, sz(SMITH, 0) + 0.2, {}); inn(SMITH, 'psx_cobweb_2', 4.5, -4.5, { y: 3.2 }); inn(SMITH, 'meshy_rope', -4.6, sz(SMITH, 2), { y: 1.4 });
    inn(JAIL, 'revolver', sx(JAIL, 2), sz(JAIL, 1) - 0.4, { y: 0.8 }); inn(JAIL, 'psx_shotgun_ammo_1', sx(JAIL, 2) - 0.3, sz(JAIL, 1) + 0.5, { y: 0.8 }); inn(JAIL, 'psx_ammo_box_1', sx(JAIL, 2) + 0.3, sz(JAIL, 1) + 0.6, { y: 0.8 });
    for (let i = 0; i < 3; i++) inn(JAIL, 'psx_padlock_1', sx(JAIL, i) + 0.5, sz(JAIL, 0) + 1.82, { y: 1.15 }); inn(JAIL, 'psx_cobweb_1', -4.5, -4.5, { y: 3.0 });
    for (const q of [[2, 2], [2, 4], [1, 3]]) { inn(SALOON, 'psx_cash_' + (1 + q[0]), sx(SALOON, q[0]) + 0.2, sz(SALOON, q[1]) - 0.15, { y: 0.87 }); inn(SALOON, 'psx_coin_mp_1', sx(SALOON, q[0]) - 0.2, sz(SALOON, q[1]) + 0.1, { y: 0.87 }); inn(SALOON, 'psx_ashtray_1', sx(SALOON, q[0]) - 0.1, sz(SALOON, q[1]) - 0.25, { y: 0.87 }); }
    inn(SALOON, 'revolver', sx(SALOON, 3) + 0.2, sz(SALOON, 4) + 0.1, { y: 0.87 }); inn(SALOON, 'shotgun', sx(SALOON, 0) - 0.9, sz(SALOON, 1), { y: 0.6, face: 90 }); inn(SALOON, 'psx_plate_mp_1', sx(SALOON, 0), sz(SALOON, 2) + 0.9, { y: 1.1 }); inn(SALOON, 'cat', 5.9, sz(SALOON, 0) + 0.9, { y: 0.5 });
    at(CHURCH, 'confessional_booth', 0, 4, { face: 90 }); inn(CHURCH, 'stained_glass', 0, -8.0, { y: 3.4, face: 0, h: 1.9 }); inn(CHURCH, 'psx_open_book_mp_1', sx(CHURCH, 2), sz(CHURCH, 0), { y: 1.47 });
    inn(STORE, 'psx_meat_1', 1.4, sz(STORE, 1), { y: 1.1 }); inn(STORE, 'psx_butcher_knife_mp_1', 1.9, sz(STORE, 1), { y: 1.1 }); inn(STORE, 'psx_ammo_box_1', -4.6, sz(STORE, 1), { y: 1.1 }); inn(STORE, 'meshy_rope', 6.3, sz(STORE, 2), { y: 1.5 }); inn(STORE, 'cauldron', -5.8, 6.0, {});
    for (const j of [0, 2]) { inn(HOTEL, 'psx_photo_frame_mp_1', -6.0, sz(HOTEL, j) + 1.4, { y: 0.64 }); inn(HOTEL, 'psx_painting_1', -6.33, sz(HOTEL, j + 1), { y: 1.7, face: 90 }); }
    inn(STABLES, 'meshy_rope', sx(STABLES, 1) + 1.75, sz(STABLES, 1) - 0.2, { y: 1.5 }); inn(STABLES, 'psx_cobweb_1', -7.9, -7.9, { y: 4.6 }); inn(STABLES, 'psx_cobweb_2', 7.9, 7.9, { y: 4.6 }); inn(STABLES, 'cat', 7.4, 6.4, { y: 1.08 });
    /* THE MODEL PASS, inside (2026-11-16, mondo's wish-list models: docs/plans/WISHLIST_MODELS_ADDED.md). The forge, the anvil on its stump,
       the bellows and a grindstone at the smith's (the drawn brick forge and the bare stump are out); real hay bales in the livery's loft
       (the drawn yellow blocks are out) and on its floor, saddles, a pitchfork, a plain ladder; the telegraph key on the operator's desk and
       the counter; wanted posters and handcuffs at the sheriff's; a pot-belly stove and baskets in the store; antlers in the saloon and the
       hotel's lobby. Every barrel in town is the oak `wooden_barrel` now (it was the pack's steel drum). */
    at(SMITH, 'forge', 1, 0, { face: 180 }); at(SMITH, 'anvil', 0, 1, { face: 180 }); inn(SMITH, 'bellows', sx(SMITH, 1) - 1.6, sz(SMITH, 0) - 0.5, { face: 180 }); at(SMITH, 'grindstone', 0, 2, { face: 90 });
    for (const i of [0, 1, 3, 4]) { const x = sx(STABLES, i), z = sz(STABLES, 0) - 0.55; inn(STABLES, 'hay_bale', x - 0.55, z, { y: 3.47, face: 0 }); inn(STABLES, 'hay_bale', x + 0.55, z + 0.1, { y: 3.47, face: 8 }); inn(STABLES, 'hay_bale', x + 0.1, z + 0.05, { y: 3.95, face: 0 }); }
    inn(STABLES, 'hay_bale', 7.3, sz(STABLES, 3) - 0.5, { face: 90 }); inn(STABLES, 'hay_bale', 7.3, sz(STABLES, 3) + 0.6, { face: 84 }); inn(STABLES, 'hay_bale', 7.3, sz(STABLES, 3) + 0.05, { y: 0.48, face: 90 });
    inn(STABLES, 'saddle', -7.5, sz(STABLES, 2) - 0.9, { face: 90 }); inn(STABLES, 'saddle', -7.5, sz(STABLES, 2) + 0.6, { face: 90 }); inn(STABLES, 'pitchfork', 7.9, sz(STABLES, 1) + 1.1, {});
    inn(WIRE, 'telegraph_key', sx(WIRE, 1) + 0.5, sz(WIRE, 0) + 0.1, { y: 0.8, face: 180 }); inn(WIRE, 'telegraph_key', 0.7, sz(WIRE, 1), { y: 1.1, face: 0 });
    inn(JAIL, 'wanted_poster', -4.86, sz(JAIL, 2) + 0.35, { y: 1.7, face: 90 }); inn(JAIL, 'wanted_poster', -4.86, sz(JAIL, 2) + 0.95, { y: 1.55, face: 90 }); inn(JAIL, 'handcuffs', sx(JAIL, 2) + 0.35, sz(JAIL, 1) - 0.1, { y: 0.8 });
    at(STORE, 'wood_stove', 2, 2, {}); inn(STORE, 'woven_baskets', -3.6, 6.0, {}); inn(SALOON, 'antler_trophy', 6.4, sz(SALOON, 2) + 0.2, { y: 2.9, face: 270 }); inn(HOTEL, 'antler_trophy', -6.4, sz(HOTEL, 5) - 0.4, { y: 2.2, face: 90 });
    inn(SMITH, 'psx_hand_saw_1', sx(SMITH, 2), sz(SMITH, 0), { y: 1.1 }); inn(SMITH, 'tool_chest', 4.1, 4.1, { face: 270 }); inn(SMITH, 'ladder_wall_rack', -4.83, sz(SMITH, 1), { y: 2.0, face: 90 });
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
        feat({ k: 'arch', id: 'des:w:mine', x: gx(90), z: gx(5), rot: 0, parts: a.P }); }
    P('wooden_barrel', 92, 6, {}); P('psx_wooden_crate_2', 93, 6, {}); dec('railway_lantern', 88, 6); dec('psx_wooden_crate_3', 91, 9); dec('hw_shovel', 88, 8);
    /* THE CANYON (P11-04): its other end is Giza's now, a long way off, so this end is a box canyon: the slot stops at a rock wall */
    feat({ k: 'plateau', x: gx(91), z: gx(46.5), w: 4 * C, d: 3 * C, h: 8.75, edge: 0.5 });
    /* MAIN STREET: the well where the showdown happens, the horse pond on the open lot south of it */
    P('ancient_well', 66, 24, {}); dec('wooden_bucket', 67, 24); P('signpost', 59, 22, { face: 90 });
    feat({ k: 'pool', x: gx(65), z: gx(30), r: 3.2, rz: 3.2, y: -0.2, depth: 0.8, key: 'water', bank: 0.8 });
    [[55, 21], [60, 21], [69, 21], [80, 21], [84, 21], [54, 26], [59, 26], [78, 26]].forEach(q => dec(rnd() < 0.5 ? 'wooden_barrel' : 'psx_wooden_crate_2', q[0], q[1]));
    Pm('horse', gc(54), gc(22) + 1.7, { face: 0 }); Pm('horse_brown', gc(77), gc(25) - 1.7, { face: 180 }); P('iron_garden_bench', 72, 21, { face: 180 }); P('rocking_chair', 49, 26, { face: 0 });
    Pm('barber_pole', gc(69) - 0.6, gx(21) + 0.3, { y: 1.5 }); Pm('psxg_coffin', gc(58) + 0.4, gx(27) - 0.5, { face: 90 }); Pm('trap_coffin_lid', gc(54) + 0.9, gx(27) - 0.4, {});
    pen(84, 28, 88, 34, [0, 86]); P('horse_black', 85, 30, { face: 90 }); P('cow', 86, 32, { face: 300 }); P('cow', 87, 30, { face: 40 }); dec('wooden_bucket', 85, 33);                           // THE CORRAL
    P('campfire', 66, 44, {}); P('canvas_tent', 64, 45, { face: 0 }); P('canvas_tent', 68, 46, { face: 180 }); dec('sea_chest', 66, 46);   // the camp's tents are the 1800s canvas wall tent now (they were modern nylon)
    dec('instrument_guitar_lying', 65, 43);
    dec('cattle_skull', 76, 43); dec('cattle_skull', 80, 39); dec('psx_fish_skeleton_mp_1', 78, 45, { y: 0.02 }); P('dead_snag', 74, 40, {}); P('dead_snag', 79, 42, {});
    dress();
    native('sheriff', 52, 25, 0); native('cowboy', 64, 22, 180, sayOf(O_LINE, 'cowboy')); native('cowboy', 60, 24, 90); native('skeleton', 54, 2, 180);
};

/* THE DRESSING PASS (2026-11-16): the place looks used. Porches, back yards, the trail's gate, the camp, the range, the canyon's hideout.
   Only pieces the catalogue has; what it lacks is on the NEEDS A MODEL list in the header. Whole-square blockers go through P (a square's
   middle), loose things through dec / Pm (off the middle). Lanterns wear `noLight` (a glow, no lamp): the atmosphere pass lights the town. */
function dress() {
    const sack = 'meshy_burlap_sack', crate = 'psx_wooden_crate_2', keg = 'wooden_barrel', LIT = sheet(), OX = gc(72), OZ = gc(24), lamp = (x, z, y) => { Pm('meshy_hanging_lantern', x, z, { y: y || 2.45, noLight: true }); LIT.box(x - OX, (y || 2.45) + 0.1, z - OZ, 0.15, 0.2, 0.15, GLS, 0xffc060, { glow: 1, uv: 'fit' }); };
    /* MAIN STREET, the north porches (row 21; the door squares stay clear) */
    Pm('hw_straw', gc(49) + 0.2, gc(21), { face: 90 }); Pm('hw_straw_2', gc(49) + 0.3, gc(21) - 1.0, { face: 0 }); dec('wooden_bucket', 53, 21); dec('chicken', 55, 23); dec('chicken', 50, 22); dec('chicken', 54, 20);
    dec(keg, 58, 21); dec('wooden_barrel', 56, 21); Pm('rocking_chair', gc(61), gc(21) - 0.4, { face: 180 }); Pm('rocking_chair', gc(64) + 0.6, gc(21) - 0.4, { face: 200 }); dec('psx_glass_bottle_1', 64, 21); dec('psx_glass_bottle_2', 61, 21);
    Pm('iron_garden_bench', gc(66), gc(21) - 0.9, { face: 180 }); dec('psx_potted_cactus_mp_1', 68, 21, { h: 0.6 }); dec(crate, 79, 21); dec(sack, 77, 21); Pm('iron_garden_bench', gc(82) + 0.9, gc(21) - 0.9, { face: 180 });
    Pm('rocking_chair', gc(85), gc(21) - 0.4, { face: 180 }); Pm('luggage_cart', gc(88) + 0.8, gc(21) - 0.2, { face: 20 }); dec('potted_plant', 89, 21);
    [51.5, 57.5, 63, 67.5, 74.5, 78.5, 82, 87].forEach(x => lamp(gx(x) + 1.1, gx(22) - 0.35));
    /* the south porches (row 26) */
    Pm('notice_board', gx(53) + 0.12, gc(28), { y: 1.5, face: 90, floor: true });   // on the jail's side wall, to the trail (the front wall has the wanted posters now)
    dec(sack, 73, 26); dec(sack, 76, 26); Pm(crate, gc(77) + 0.6, gc(26), { face: 12 }); Pm('psx_wooden_crate_6', gc(77) + 0.6, gc(26), { y: 1.08, face: 40 }); dec('hw_pumpkin', 74, 26); dec('hw_pumpkin_2', 76, 26);
    dec(keg, 72, 26); Pm('psxg_coffin', gc(55) - 0.9, gx(27) - 0.5, { face: 90 }); [51.5, 56.5, 75].forEach(x => lamp(gx(x) + 1.1, gx(26) + 0.35));
    /* the street itself: a wagon drawn up at the store, the trail in between the jail and the undertaker */
    Pm('covered_wagon', gc(81), gc(25) - 0.6, { face: 0 }); Pm('horse_black', gc(60), gc(22) + 1.7, { face: 0 }); dec('wooden_bucket', 65, 25);
    for (let y = 27; y < 32; y++) for (const x of [53, 54]) setPaint(x, y, 'dirt_2');
    /* the back yards */
    P('outhouse', 66, 14, { face: 180 }); P('outhouse', 91, 16, { face: 270 }); P('outhouse', 79, 33, { face: 0 }); P('fallen_log', 62, 15, { face: 0 }); P('axe_chopping_block', 64, 15, {}); dec('psx_hand_saw_1', 63, 14); P('fallen_log', 75, 32, { face: 90 }); Pm('axe_chopping_block', gc(76) + 0.4, gc(33) - 0.3, {});
    dec(keg, 60, 19); dec(crate, 60, 17); dec(crate, 83, 16); dec(keg, 90, 20); dec('psxg_dead_bush_1', 58, 15); dec('psxg_dead_bush_2', 71, 15); dec('psxg_dead_bush_1', 82, 15); dec('psxg_dead_bush_2', 60, 31); dec('psxg_dead_bush_1', 70, 33);
    dec('crow', 53, 6, { y: 3.56 }); dec('crow', 57, 3); dec('crow', 66, 24, { y: 1.15 }); dec('crow', 84, 28, { y: 1.25 });
    /* THE CHURCH YARD + THE WINDMILL'S PATCH */
    for (const x of [62, 63, 68, 69]) Pm('hw_fence', gc(x), gx(6) - 0.2, { face: 0 }); dec('psxg_dead_bush_2', 62, 3); P('psxg_dead_tree_2', 69, 2, {}); Pm('iron_garden_bench', gc(63), gc(5), { face: 180 });
    for (const q of [[80, 6], [81, 6], [82, 6], [80, 7], [81, 7], [82, 7]]) Pm((q[0] + q[1]) % 2 ? 'hw_crop' : 'hw_crop_2', gc(q[0]), gc(q[1] + 2), { face: 0 }); P('hw_scarecrow', 83, 9, { face: 200 }); dec('hw_shovel', 79, 9); dec('hw_pumpkin_3', 82, 10); dec('chicken', 79, 6);
    /* THE MINE'S YARD */
    dec('spell_dynamite', 92, 7, { h: 0.5 }); dec('psxg_rock_1', 89, 9); dec('psxg_rock_2', 91, 9); dec('psxg_rock_3', 90, 10); dec('psxg_rock_2', 88, 10); dec(sack, 93, 8); dec(keg, 91, 5); lamp(gx(90) + 1.2, gx(5) + 3.0, 2.3);
    /* THE CORRAL */
    Pm('hw_straw', gc(89), gc(29), { face: 0 }); Pm('hw_straw_2', gc(89), gc(30) + 0.2, { face: 90 }); dec('wooden_bucket', 87, 27); dec(keg, 83, 28); dec('chicken', 89, 32);
    /* THE TRAIL IN (P08-04): a timber gate over the trail where it reaches town, a ranch rail either side, a bleached skull on the beam */
    { const a = sheet(), T = 0x7a5a40; for (const s of [-1, 1]) { a.box(s * 4.0, 0, 0, 0.36, 5.2, 0.36, WD2, T); a.box(s * 3.3, 4.2, 0, 1.4, 0.2, 0.2, WD2, T); } a.box(0, 4.8, 0, 9.2, 0.34, 0.34, WD2, T);
        feat({ k: 'arch', id: 'des:w:gate', x: gx(54), z: gc(35), rot: 0, parts: a.P }); Pm('cattle_skull', gx(54), gc(35) + 0.2, { y: 4.3, face: 180, span: 1.1 });
        feat({ k: 'rail', x0: gc(49), z0: gc(35), x1: gx(54) - 4.0, z1: gc(35), model: 'ranch' }); feat({ k: 'rail', x0: gx(54) + 4.0, z0: gc(35), x1: gc(59), z1: gc(35), model: 'ranch' }); }
    P('signpost', 51, 40, { face: 90 }); dec('psxg_rock_1', 50, 38); dec('psxg_dead_bush_1', 57, 39); dec('cattle_skull', 56, 43); dec('psxg_rock_3', 49, 44); P('dead_snag', 58, 45, {}); dec('psxg_dead_bush_2', 51, 46); dec(crate, 55, 37);
    /* THE WAGON CAMP (P09-04): logs to sit on round the fire, the pot, the horse line */
    P('fallen_log', 66, 42, { face: 0 }); P('fallen_log', 68, 44, { face: 90 }); dec(keg, 63, 42); dec(crate, 70, 46); dec(sack, 62, 44); dec('wooden_bucket', 65, 46); lamp(gc(64), gc(43), 0.02);
    P('hitching_rail', 62, 46, { face: 0 }); Pm('horse', gc(62), gc(46) + 1.7, { face: 0 }); Pm('horse_brown', gc(62) + 1.5, gc(46) - 1.7, { face: 180 }); dec('psxg_dead_bush_1', 61, 38); dec('psxg_rock_2', 70, 40);
    /* OPEN RANGE (P10-04): cattle on poor grazing, a stretch of old fence */
    [[75, 38, 200], [78, 41, 60], [81, 38, 310], [76, 45, 140], [73, 43, 20]].forEach(q => P('cow', q[0], q[1], { face: q[2] }));
    feat({ k: 'rail', x0: gc(73), z0: gc(36), x1: gc(77), z1: gc(36), model: 'ranch' }); feat({ k: 'rail', x0: gc(79), z0: gc(36), x1: gc(82), z1: gc(36), model: 'ranch' });
    [[73, 39], [77, 43], [78, 46], [83, 39], [74, 46], [79, 37]].forEach((q, i) => dec(i % 2 ? 'psxg_dead_bush_1' : 'psxg_dead_bush_2', q[0], q[1])); dec('psxg_rock_1', 76, 40); dec('psxg_rock_4', 79, 42); dec('psxg_rock_2', 74, 43);
    /* THE CANYON (P11-04): the box canyon is somebody's hideout */
    P('skull_pile', 89, 36, {}); P('campfire', 90, 43, { noLight: true }); Pm('cot', gc(91) + 0.5, gc(44) + 0.6, { face: 90 }); Pm('money_sacks', gc(91) + 0.6, gc(42), {}); Pm(crate, gc(90) - 0.6, gc(44) + 1.0, { face: 15 }); Pm('spell_dynamite', gc(90) - 0.6, gc(44) + 1.0, { y: 1.08, h: 0.5 });
    Pm(keg, gc(91) + 0.8, gc(40), {}); Pm('shotgun', gc(91) + 0.9, gc(43), { y: 0.5 }); Pm('horse_black', gc(91) + 0.3, gc(39), { face: 0 }); lamp(gc(90) - 1.2, gc(42), 0.02); dec('psx_glass_bottle_1', 90, 44); dec('skull', 90, 39);
    /* THE MODEL LIST PASS (2026-11-16, mondo: "look at the model list right now to see what else they could add"): pieces MODEL_LIST.md has
       that the first passes missed. Halloween pack: coffins, lids, a body, headstones, a hand out of a grave. Animals: dog, cat, wolf
       (the range's coyotes), eagle, rabbit, sheep, bats at the mine. Bones (femur, ulna), cobwebs, a cauldron on the camp's fire. */
    P('hw_stone_3', 52, 2, { face: 180 }); P('hw_stone', 56, 2, { face: 180 }); P('hw_stone_1', 50, 5, { face: 180 }); P('hw_body_rising', 54, 4, { face: 160 }); Pm('hw_coffin', gc(57) - 0.4, gc(4), { face: 70 }); Pm('hw_coffin_lid', gc(57) + 0.9, gc(4) + 0.6, { face: 40 });
    dec('femur', 53, 4); dec('ulna', 51, 4); Pm('hw_coffin_2', gc(57) + 0.2, gx(27) - 0.9, { face: 90 }); Pm('hw_coffin_lid_2', gc(58) + 0.3, gx(27) - 0.5, { face: 100 });
    dec('dog', 61, 22); dec('cat', 74, 26, { y: 0.2 }); dec('dog', 67, 45); dec('rabbit', 59, 41); dec('rabbit', 72, 44);
    Pm('coyote', gc(82), gc(38), { face: 250 }); Pm('coyote', gc(83) + 0.6, gc(40) - 0.4, { face: 290 }); Pm('eagle', gc(88), gc(44), { y: 9.5 }); Pm('eagle', gc(53), gc(2), { y: 6 });
    P('decor_sheep', 74, 41, { face: 100 }); P('decor_sheep', 76, 42, { face: 40 }); dec('femur', 77, 39); dec('ulna', 80, 40); dec('cattle_skull', 78, 38); dec('femur', 90, 38); dec('ulna', 91, 41);
    Pm('bat_black', gx(90) - 0.6, gx(5) + 1.2, { y: 2.3 }); Pm('bat_brown', gx(90) + 0.5, gx(5) + 0.6, { y: 2.4 }); Pm('bat_grey', gx(90) + 0.1, gx(5) + 2.0, { y: 2.5 }); Pm('psx_cobweb_1', gx(90) - 1.3, gx(5) + 2.7, { y: 1.9, face: 0 }); Pm('psx_cobweb_2', gx(90) + 1.3, gx(5) + 2.7, { y: 1.9, face: 0 });
    P('cauldron', 67, 43, {}); Pm('meshy_rope', gc(84) + 0.2, gc(31), { y: 1.1 }); Pm('meshy_rope', gc(86) + 1.6, gc(28), { y: 1.1 });
    /* THE MODEL PASS, outside (2026-11-16, mondo's wish-list models). What the NEEDS A MODEL list asked for, and what else on the list suits
       a frontier town. Stand-ins taken out in the same pass: the drawn privies, the drawn pole and buffer, the nylon tents, the wolves that
       stood for coyotes, the human skulls that stood for cattle skulls, the stumps that stood for a chopping block. */
    /* the mine: an ore cart on the track, a real buffer, the ore dump, the head wheel, picks, a barrow, the prospector's tent */
    Pm('mine_cart', gx(90), gx(5) + 12.4, { face: 90 }); Pm('buffer_stop', gx(90), gx(5) + 15.6, { face: 180 }); P('ore_heap', 92, 9, {}); P('head_wheel', 94, 7, { face: 90 }); P('canvas_tent', 93, 11, { face: 180 });
    Pm('pickaxe', gx(90) + 1.25, gx(5) + 3.6, { face: 40 }); dec('pickaxe', 89, 8); Pm('wheelbarrow', gx(88) + 0.8, gc(9), { face: 200 });
    /* Main Street: troughs by the rails, bales at the livery, tumbleweeds, wanted posters on the fronts, a hand cart, the gallows on the open lot */
    [[51, 22, -0.9], [55, 22, -0.9], [61, 22, -0.9], [73, 25, 0.9]].forEach(q => Pm('water_trough', gc(q[0]) + 0.3, gc(q[1]) + q[2], { face: 0 })); Pm('water_trough', gc(86), gc(29) - 0.6, { face: 0 }); Pm('water_trough', gc(63) + 0.2, gc(47) + 0.2, { face: 0 });
    Pm('hay_bale', gc(52) + 0.7, gc(21) - 0.9, { face: 0 }); Pm('hay_bale', gc(53) + 0.1, gc(21) - 0.8, { face: 12 }); Pm('hay_bale', gc(52) + 1.2, gc(21) - 0.85, { y: 0.48, face: 4 }); Pm('rooster', gc(55) + 0.5, gc(21) + 0.3, { face: 150 });
    [[57, 24], [68, 23], [79, 24], [88, 24], [62, 33], [56, 40], [75, 44], [71, 12]].forEach(q => dec('tumbleweed', q[0], q[1]));
    const bill = (x, z, y, face) => Pm('wanted_poster', x, z, { y, face, floor: true });                                 // on a front wall (`floor`: without it a prop on a wall's line stands on the wall's top)
    bill(gx(51) + 0.45, gx(27) - 0.08, 1.7, 0); bill(gx(51) - 0.12, gx(27) - 0.08, 1.5, 0); bill(gx(63) + 0.55, gx(21) + 0.08, 1.6, 180); bill(gx(82) + 0.55, gx(21) + 0.08, 1.6, 180); bill(gx(75) - 0.55, gx(27) - 0.08, 1.6, 0);
    Pm('hand_cart', gc(80), gc(22) - 0.6, { face: 15 }); Pm('gallows', gx(62), gx(29), { face: 0 }); Pm('hearse_carriage', gx(57), gc(32), { face: 0 });
    for (const q of [[62, 26], [68, 26], [56, 36]]) { P('lantern_post', q[0], q[1], { face: 0 }); LIT.box(gc(q[0]) + 0.48 - OX, 1.4, gc(q[1]) - OZ, 0.09, 0.16, 0.09, GLS, 0xffc060, { glow: 1, uv: 'fit' }); }   // the lantern hangs 0.48 m east of its post
    /* the telegraph line: the office's pole and two more, south out of town past the corral */
    for (const y of [19, 27, 35]) P('telegraph_pole', 84, y, { face: 0 });
    { const a = sheet(); for (const x of [-1.35, -0.55, 0.55, 1.35]) a.box(x, 6.62, 0, 0.025, 0.025, 16 * C, RIB, 0x2a2a2e); feat({ k: 'arch', id: 'des:w:wire', x: gc(84), z: gx(27.5), rot: 0, parts: a.P }); }   // the wires on the top arm's insulators
    /* the yards: split wood at two back doors, the hotel's washing, the church's bell in its frame, a plough by the crop patch */
    Pm('firewood_stack', gx(63.8), gx(16) - 0.45, { face: 0 }); Pm('firewood_stack', gx(74.5), gx(31) + 0.45, { face: 0 }); Pm('clothes_line', gx(87), gc(13), { face: 0 }); P('bell_frame', 68, 4, { face: 0 }); Pm('plough', gc(80), gc(10) + 0.5, { face: 20 });
    /* the corral: the hay rack, bales, a saddle on its stand by the rail */
    P('hay_rack', 87, 33, { face: 0 }); Pm('hay_bale', gc(85) + 0.6, gc(32) + 0.5, { face: 30 }); Pm('hay_bale', gc(85) - 0.4, gc(32) + 0.9, { face: 100 }); Pm('saddle', gc(84) - 0.9, gc(31), { face: 90 });
    /* the camp + the range + the trail: a kettle by the fire, cattle skulls, a vulture, a hawk on the old fence's post, snake, scorpion, lizards, agave and yucca */
    Pm('kettle', gc(66) + 0.95, gc(44) + 0.6, {}); Pm('vulture', gc(77) + 0.9, gc(39) + 0.4, { face: 200 }); P('vulture', 58, 3, { face: 240 }); Pm('hawk', gc(78), gc(36), { face: 180 });
    Pm('rattlesnake', gc(80) + 0.5, gc(44), { face: 300 }); dec('rattlesnake', 57, 41); dec('scorpion', 75, 46); dec('lizard', 71, 39); dec('lizard', 50, 37);
    P('yucca', 58, 38, {}); P('agave', 50, 43, {}); P('yucca', 61, 35, {}); P('agave', 69, 37, {}); P('agave', 78, 44, {}); P('yucca', 72, 38, {});
    /* the lanterns' flames: one drawn row of lit cores (a glow costs none of the room's ten lamps) */
    feat({ k: 'arch', id: 'des:w:lamps', x: OX, z: OZ, rot: 0, parts: LIT.P });
}

/* THE MESHY PIECES (mondo 11-15 19:01 "okay go ahead": the packs have no cactus, covered wagon, water tower or hitching rail) */
exports.pieces = ctx => { bind(ctx);
    [[49, 22], [54, 22], [60, 22], [65, 22], [72, 22], [76, 22], [84, 22], [89, 22], [53, 25], [58, 25], [72, 25], [77, 25]].forEach(q => P('hitching_rail', q[0], q[1], { face: 0 }));   // along Main Street, clear of every door
    Pm('covered_wagon', gx(62), gc(42), { face: 0 }); Pm('covered_wagon', gx(71), gc(47), { face: 180 });                                                   // THE WAGON CAMP
    Pm('water_tower_west', gx(74), gx(9), {});                                                                                                               // by the windmill, on 2 x 2 squares
};
