/* THE ESTATE · THE HAUNTED HOUSE + GRAVEYARD (district H, the south-west nine: plots x 0..2 · y 3..5, squares sx 0..35 · sy 36..71,
   levels 2..4: the house stands on its rise at 7 m). Repo tooling only: bake-estate.js loads this file through its one hook
   (THE DISTRICT FILES) and writes the room `site_prebuilt_skinwalker_estate` into data.js. One thread works this file; nobody else edits it.
   THE PLOTS (docs/areas/estate/layout.json):
     P00-03  The Treehouse          level 2  the treehouse in the pines
     P01-03  The Iron Gate          level 2  the gate at the end of the corn
     P02-03  The Drive              level 2  the drive curving up to the house
     P00-04  The Gazebo             level 3  the gazebo on the lawn
     P01-04  The Haunted House      level 4  LANDMARK: the house on its rise; five floors inside
     P02-04  The Lawn               level 3  dead lawn, fountain
     P00-05  The Crypt              level 2  the crypt
     P01-05  The Family Plot        level 2  the family graves
     P02-05  The Graveyard          level 2  rows of stones, open graves
   WHAT STANDS HERE TODAY (after passes 1 to 4, 2026-11-16): THE HAUNTED HOUSE (solid out here: dark clapboard on a brick base, corner boards, a
     belt course, a bracketed cornice, a hipped roof with two dormers and an iron cresting, a tower with a louvred top and a weathervane, two
     gabled bays, a railed porch, the door's vestibule with two oil lamps, every window with sill, head, bars and shutters, some boarded up,
     three lit; a back door on its stoop), THE CRYPT (walk-in: plinth, four-column portico under the pediment, a cross on the ridge, buttresses,
     two grave lights, REQUIESCAT IN PACE on the frieze; inside: a stone floor, the sarcophagus on a dais, burial niches down both walls, the
     demon in a lit recess, an iron ring of candles, candelabra, coffins, cobwebs, bats), THE GAZEBO (white paint, railed on six sides, a lamp), THE IRON GATE (piers
     with lamps, an iron overthrow, two iron leaves), THE TREEHOUSE (a 5.25 m timber tower you climb by its ladder, a railed deck, a hut with a
     lantern, a telescope, a chair), thirteen drawn LAMP POSTS along the walks, a KEEP OUT board on the gate, bats round the tower and crows
     on the ridge, the Lawn's swing, two LYCH GATES and a low stone wall along each graveyard's north side, the Graveyard's obelisk, the Lawn's fountain and benches,
     the iron fence at the foot of the house's lawn, the Family Plot and the Graveyard (Halloween pack + PSX graveyard pack: headstones, mounds,
     open coffins, dead trees, jack-o'-lanterns), two rim houses past the corn, and nine people: ghost, ghoul, vampire, werewolf, eagleman,
     undead, jack o lantern, zombie, necromancer.
   THE PASSES (mondo 11-16, one pilot district a zone, up to Disaster City's standard): 1 EXTERIORS · 2 INTERIORS · 3 DRESSING ·
     4 ATMOSPHERE done · 5 POLISH open (the list is in the notes). Notes: areas-complexes.md "THE ESTATE, DISTRICT H" + "THE ESTATE, THE ZONE KIT".
   MISSING / WAITING:
     - the house is not walked into from here: its five floors (Hall, Upstairs, Nursery, Attic, Cellar) are the OLD rooms
       (`site_prebuilt_haunted_*`), not redesigned. Those rooms are not in this file; the front door `house` is the tool's.
     - the vampire has no line (its old line named the terrace, which is gone); most of the nine have none (lines are mondo's to give).
     - not carried over from the old Grounds (plan 2 does not draw them): the coach house, the terrace, the footbridge pond, the
       balcony bridges.
     - `hw_web` (the Halloween pack's cobweb) is not placed: its catalogue row sized it by height and it drew as a sheet over the whole
       district. The row reads `span` now; nobody has seen it stand since, so place one and look before using it.
     - NEEDS A MODEL (nothing stands in for these): a hearse or carriage for the Drive, a stone angel that weeps (the Family Plot has the
       one `angel_statue`), a raven on a perch, a wrought-iron lamp post (the lamps here are drawn parts).
     - the pines on the corn bank round the grounds are the tool's (they stand on the shared wall).
     - no residents with routines, no encounter table (mondo's baked tables).
   THE HOOKS (bake-estate.js "THE DISTRICT FILES"; a file exports any of these, each is called with this district's own ctx):
     airZones()   the air over this district's squares (the tool's THE AIR BY DISTRICT).
     plan(ctx)    first of all: change the plan's squares (ctx.setRect(x0, y0, x1, y1, ch); 'c' = corn, anything else is walked).
     houses(ctx)  the main buildings (ctx.building: a hollow texbuilding + its drawn look; ctx.put: a prop in a building's own frame).
     sheds(ctx)   the out-buildings (same helpers).
     pieces(ctx)  drawn pieces on open ground (ctx.look) + their rows; ctx.flat(x0, y0, x1, y1) levels the ground under one.
     water(ctx)   pools, decks, rocks in the water.
     dress(ctx)   everything else: props (ctx.P on a square, ctx.dec off its middle), trees, rails, people (ctx.native), animals.
   ctx = { d, C, N, G, W, HALF, gx, gc, r2, PLAN, plot, cell, setRect, open, distAt, feat, props, npc, taken, building, put, look, sheet,
           windows, SOLID, U, WD, WD2, SHG, FLR, GLS, COR, BRK, SHUT, P, dec, tree, native, rail, rnd, flat, sayOf, O_FIELDS, O_GROUNDS, BUILT }.
   Squares are (sx 0..72 west to east, sy 0..72 north to south); gx() = a square's west / north line in metres, gc() = its middle.
   ctx.rnd / ctx.dec throw THIS district's own dice, so nothing here moves another district's pieces. Row ids start 'est:'.
   NOT YOURS (the tool's, shared: a note on docs/notes/claims.md before anyone touches them): the corn wall and the pines on it, the levels,
   the paint rule, the sky and shell, the ways out (the Woods gate, the house's front door, `bay`, `bay13`, the well, the Lodge door).
   Rules for district threads: docs/notes/areas-complexes.md "THE ESTATE, THE DISTRICT FILES". Rebake: `node bake-estate.js`. */
'use strict';
/* THE DISTRICT'S OWN COLOURS (the exterior pass, 2026-11-16; the zone kit in areas-complexes.md names them): iron, oil-lamp amber, grave-light green */
const IRON = 0x1c1c20, AMBER = 0xff9a30, GHOSTLY = 0x58f0a0, LAMP = { glow: 0.7 };
module.exports = {
    plan(ctx) { const { setRect } = ctx;
        setRect(8, 65, 10, 66, 'p'); setRect(8, 66, 9, 67, 'p');                               // THE CRYPT: the path reaches its door (the plan's path met its corner)
        /* THE GRAVEYARDS' GRASS (mondo 11-16 "that's fine"): the plan paints both yards as path; both yards are lawn now
           (THE GRAVEYARD REDONE, mondo 11-16 "this doesn't really look like a graveyard, do better"), dirt only on the middle aisle and the Graveyard's cross aisle. Only squares the plan already walks are touched. */
        { const yard = (x0, y0, x1, y1, keep) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (ctx.cell[y][x] === 'p' && !keep(x, y)) ctx.cell[y][x] = 'g'; };
          yard(13, 65, 21, 69, (x, y) => x === 17 && y <= 68); yard(24, 65, 33, 71, (x, y) => (x === 28 && y <= 70) || y === 68); }
        setRect(5, 41, 7, 43, 'j'); setRect(16, 56, 17, 57, 'j'); setRect(19, 56, 20, 57, 'j');   // boards, not lawn, on the treehouse's deck and under the porch's two side bays (the grass field grows on every grass square)
    },
    houses(ctx) { const { building, feat, r2, SOLID, WD, WD2, SHG, FLR, GLS, BRK } = ctx;
        /* a ghost wall: the walker's block under a drawn piece (world metres) */
        const blk = (p, q, t, h) => feat({ k: 'wall', x0: r2(p[0]), z0: r2(p[1]), x1: r2(q[0]), z1: r2(q[1]), t: t || 0.3, h: h || 1.1, ghost: true, rail: false });
        /* THE HAUNTED HOUSE (the district's landmark, on its rise): its five floors are the rooms that exist (the Hall, Upstairs, the Nursery, the Attic, the
           Cellar), so out here it is a solid house and its front door leads into the Hall. Dark clapboard on a brick base, a hipped roof with two dormers and
           an iron cresting, a tower over the door with a louvred top and a weathervane, two gabled bays, a railed porch across the front, brick chimneys.
           THE EXTERIOR PASS (2026-11-16): every window has its sill, head, bars and shutters (some boarded up), corner boards, a belt course, a bracketed
           cornice, the door's own vestibule (it covers the door row's plain surround), a back door on its stoop; three windows lit, the rest dark. */
        const HOUSE = building('house', [14, 50, 22, 56, 'S'], 10.5, SOLID, (a, w, d) => {
            const WALL = 0x8a8494, TRIM = 0x26222a, ROOF = 0x2c2830, LIT = 0xf0c868, DARK = 0x2a3040, SHUTC = 0x3a4440, BASE = 0x6a6068, PLANK = 0x6a5a48, f = d / 2, h2 = w / 2;
            /* a window on a face ('f' front, 'b' back: u runs along x · 'l' / 'r' the sides: u runs along z), `out` = how far that face stands out of the main block */
            const win = (face, u, y, o) => { o = o || {}; const lit = !!o.lit, hh = o.h || 1.7, ww = o.w || 1.3, fb = face === 'f' || face === 'b', sg = (face === 'f' || face === 'r') ? 1 : -1, base = (fb ? f : h2) + (o.out || 0);
                const B = (du, y0, dn, su, sh, sn, key, tint, x) => fb ? a.box(u + du, y0, sg * (base + dn), su, sh, sn, key, tint, x) : a.box(sg * (base + dn), y0, u + du, sn, sh, su, key, tint, x);
                B(0, y, 0.09, ww, hh, 0.08, GLS, lit ? LIT : DARK, { glow: lit ? 0.6 : 0.05 });
                B(0, y - 0.12, 0.15, ww + 0.5, 0.12, 0.3, WD2, TRIM); B(0, y + hh, 0.13, ww + 0.4, 0.16, 0.24, WD2, TRIM);                    // the sill, the head
                B(-ww / 2 - 0.06, y, 0.12, 0.12, hh, 0.1, WD2, TRIM); B(ww / 2 + 0.06, y, 0.12, 0.12, hh, 0.1, WD2, TRIM);                       // the jambs
                B(0, y, 0.15, 0.06, hh, 0.04, WD2, TRIM); B(0, y + hh * 0.55, 0.15, ww, 0.06, 0.04, WD2, TRIM);                                // the glazing bars
                if (o.shut !== false) { if (o.shut !== 'r') B(-ww / 2 - 0.42, y, 0.12, 0.5, hh, 0.07, WD, SHUTC); if (o.shut !== 'l') B(ww / 2 + 0.42, y, 0.12, 0.5, hh, 0.07, WD, SHUTC); }
                if (o.boards) [0.22, 0.78, 1.3].forEach((q, i) => B(i === 1 ? 0.07 : -0.05, y + q, 0.2, ww + 0.5, 0.2, 0.05, WD, PLANK)); };   // boarded up
            a.box(0, 0, 0, w + 0.1, 7, d + 0.1, WD, WALL, { top: false, uv: [3.5, 1.75] });
            a.box(0, 0, 0, w + 0.5, 0.6, d + 0.5, BRK, BASE);                                                                                   // the brick base
            for (const sx of [-1, 1]) for (const sz of [-1, 1]) a.box(sx * h2, 0.6, sz * f, 0.34, 6.2, 0.34, WD2, TRIM);                       // corner boards
            a.box(0, 3.42, 0, w + 0.26, 0.2, d + 0.26, WD2, TRIM, { top: false });                                                              // the belt course between the storeys
            a.box(0, 6.72, 0, w + 0.8, 0.28, d + 0.8, WD2, TRIM, { roof: true });                                                               // the cornice and its brackets
            for (const sz of [-1, 1]) a.box(-h2 + 0.9, 6.32, sz * (f + 0.22), 0.16, 0.4, 0.36, WD2, TRIM, { n: 16, step: [(w - 1.8) / 15, 0, 0] });
            a.roof('hip', 0, 7, 0, w + 1.4, 3.4, d + 1.4, SHG, ROOF);
            a.box(-3.3, 10.38, 0, 0.06, 0.5, 0.06, null, IRON, { n: 12, step: [0.6, 0, 0], roof: true }); a.box(0, 10.78, 0, 6.9, 0.05, 0.05, null, IRON, { roof: true });   // the iron cresting on the ridge
            for (const x of [-5.6, 5.6]) { a.box(x, 7, f - 3, 1.9, 1.9, 6, WD, WALL, { top: false, uv: [3.5, 1.75], roof: true }); a.roof('gable', x, 8.9, f - 3, 6.3, 1.0, 2.3, SHG, ROOF, { ry: 90, keyEnd: WD, tintEnd: WALL });   // the two dormers
                a.box(x, 7.5, f + 0.04, 1.0, 1.15, 0.06, GLS, DARK, { glow: 0.05, roof: true }); a.box(x, 7.38, f + 0.08, 1.4, 0.12, 0.2, WD2, TRIM, { roof: true }); a.box(x, 8.65, f + 0.08, 1.4, 0.12, 0.2, WD2, TRIM, { roof: true }); }
            /* the tower over the door (flush with the front: nothing drawn stands where you walk) */
            a.box(0, 0, f - 2.7, 5.6, 12.6, 5.6, WD, WALL, { top: false, uv: [3.5, 1.75] }); a.roof('pyramid', 0, 12.6, f - 2.7, 6.6, 5.2, 6.6, SHG, ROOF);
            a.box(0, 12.2, f - 2.7, 6.0, 0.3, 6.0, WD2, TRIM, { roof: true }); a.box(0, 7.3, f - 2.7, 5.9, 0.2, 5.9, WD2, TRIM, { top: false });
            for (const sx of [-1, 1]) for (const sz of [-1, 1]) a.box(sx * 2.8, 7.5, f - 2.7 + sz * 2.8, 0.3, 4.7, 0.3, WD2, TRIM);
            a.box(0, 10.5, f + 0.13, 1.7, 0.12, 0.08, WD2, TRIM, { n: 6, step: [0, 0.24, 0] }); a.box(0, 10.4, f + 0.11, 1.9, 1.5, 0.05, null, 0x121014);                           // the louvred top, front
            for (const s of [-1, 1]) { a.box(s * 2.93, 10.5, f - 2.7, 0.08, 0.12, 1.7, WD2, TRIM, { n: 6, step: [0, 0.24, 0] }); a.box(s * 2.91, 10.4, f - 2.7, 0.05, 1.5, 1.9, null, 0x121014);
                a.box(s * 2.88, 8.2, f - 2.7, 0.08, 1.6, 1.2, GLS, DARK, { glow: 0.05 }); }
            a.cyl(0, 17.75, f - 2.7, 0.07, 1.7, null, IRON, { roof: true }); a.box(0, 19.0, f - 2.7, 1.0, 0.07, 0.05, null, IRON, { roof: true }); a.box(0.42, 18.9, f - 2.7, 0.2, 0.28, 0.05, null, IRON, { roof: true });   // the weathervane
            win('f', 0, 8.3, { lit: true, h: 2.0, w: 1.4, out: 0.1, shut: false }); win('f', 0, 4.5, { out: 0.1, h: 1.6 });
            /* the two gabled bays */
            for (const s of [-1, 1]) { a.box(s * 9.6, 0, f - 0.85, 5.2, 8.4, 1.9, WD, WALL, { top: false, uv: [3.5, 1.75] }); a.roof('gable', s * 9.6, 8.4, f - 0.85, 5.8, 2.4, 2.4, SHG, ROOF, { keyEnd: WD, tintEnd: WALL });
                a.box(s * 9.6, 0, f - 0.85, 5.5, 0.6, 2.2, BRK, BASE); a.box(s * 9.6, 8.15, f - 0.85, 5.6, 0.22, 2.3, WD2, TRIM, { roof: true });
                for (const e of [-1, 1]) a.box(s * 9.6 + e * 2.6, 0.6, f + 0.1, 0.3, 7.6, 0.3, WD2, TRIM);
                win('f', s * 9.6, 1.1, { out: 0.1, boards: s > 0 }); win('f', s * 9.6, 4.4, { out: 0.1, lit: s < 0 });
                a.box(s * 10.6, 7, -4.2, 1.3, 5.6, 1.3, BRK, 0x7a5a50, { roof: true }); a.box(s * 10.6, 12.6, -4.2, 1.6, 0.3, 1.6, BRK, 0x5a4640, { roof: true }); a.box(s * 10.6, 12.9, -4.2, 0.6, 0.5, 0.6, BRK, 0x3a2e2a, { roof: true }); }
            win('f', -5.6, 1.1, { boards: true }); win('f', 5.6, 1.1, { lit: true }); win('f', -5.6, 4.4); win('f', 5.6, 4.4, { shut: 'l' });
            for (const sd of ['l', 'r']) [-7.9, -2.65, 2.6, 7.85].forEach((z, i) => { win(sd, z, 1.1, { boards: (sd === 'l' && i === 1) || (sd === 'r' && i === 2) }); win(sd, z, 4.4, { shut: (sd === 'r' && i === 0) ? 'r' : undefined }); });
            for (let x = -10.5; x <= 10.5; x += 3.5) { if (Math.abs(x) > 0.1) win('b', x, 1.1, { boards: x === 7 }); win('b', x, 4.4); }
            a.box(0, 0, -f - 0.95, 2.6, 0.6, 1.7, BRK, BASE); a.box(0, 0.6, -f - 0.1, 1.2, 2.2, 0.08, WD2, 0x3a2c24); a.box(0, 2.8, -f - 0.14, 1.7, 0.16, 0.2, WD2, TRIM);   // the back door on its stoop
            for (const s of [-1, 1]) a.box(s * 0.7, 0.6, -f - 0.14, 0.14, 2.2, 0.16, WD2, TRIM);
            /* the porch on the square row before the door: boards, posts, rails on the two side bays and the ends, a lean-to roof */
            a.box(0, 0, f + 1.75, 13.6, 0.16, 3.4, FLR, 0x5a5048);
            for (const x of [-6.6, -3.4, 3.4, 6.6]) { a.box(x, 0, f + 3.3, 0.22, 3.0, 0.22, WD2, TRIM); a.box(x, 2.55, f + 3.3, 0.7, 0.12, 0.12, WD2, TRIM); }
            for (const s of [-1, 1]) { for (const y of [0.3, 0.95]) { a.box(s * 5.0, y, f + 3.3, 3.0, 0.08, 0.1, WD2, TRIM); a.box(s * 6.7, y, f + 1.75, 0.1, 0.08, 3.1, WD2, TRIM); }
                a.box(s * 5.0 - 1.35, 0.3, f + 3.3, 0.06, 0.65, 0.06, WD2, TRIM, { n: 10, step: [0.3, 0, 0] }); a.box(s * 6.7, 0.3, f + 0.4, 0.06, 0.65, 0.06, WD2, TRIM, { n: 10, step: [0, 0, 0.3] }); }
            a.roof('shed', 0, 3.0, f + 1.85, 14.2, 0.8, 3.8, SHG, ROOF); a.box(0, 2.82, f + 3.42, 13.9, 0.2, 0.1, WD2, TRIM);
            /* the door's vestibule: panelled cheeks and a front with the doorway cut out, a hood over it, two oil lamps (the door itself is the tool's row) */
            for (const s of [-1, 1]) { a.box(s * 1.85, 0, f + 0.52, 0.2, 3.0, 0.9, WD, 0x5e5866, { uv: [3.5, 1.75] }); a.box(s * 0.72, 0, f + 1.02, 0.2, 2.42, 0.12, WD2, TRIM);
                a.box(s * 1.5, 1.75, f + 1.1, 0.2, 0.34, 0.2, null, AMBER, LAMP); a.box(s * 1.5, 2.09, f + 1.1, 0.28, 0.07, 0.28, null, IRON); a.box(s * 1.5, 1.68, f + 1.1, 0.28, 0.07, 0.28, null, IRON); }
            a.P.push({ s: 'quad', p: [0, 0, r2(f + 0.97)], size: [3.9, 3.0], ry: 0, hole: [0, 1.24, 2.32], key: WD, tint: 0x5e5866, uv: [3.5, 1.75] });
            a.box(0, 2.32, f + 1.02, 1.64, 0.18, 0.12, WD2, TRIM); a.box(0, 2.5, f + 1.25, 2.5, 0.5, 0.6, WD2, TRIM); a.box(0, 2.98, f + 0.52, 4.1, 0.1, 1.0, WD2, TRIM);   // the door's head and its hood
        });
        { const f = HOUSE.fd / 2;                                                                  // the porch rails block: the two side bays and the ends
          for (const s of [-1, 1]) { blk(HOUSE.at(s * 6.7, f + 3.3), HOUSE.at(s * 3.4, f + 3.3)); blk(HOUSE.at(s * 6.7, f + 0.2), HOUSE.at(s * 6.7, f + 3.3)); } }
    },
    sheds(ctx) { const { building, put } = ctx;
        /* THE CRYPT (walk-in): a stone mausoleum on a plinth, a four-column portico under the roof's own pediment, a cross on its ridge, buttressed sides,
           two grave lights by the barred gate; the old crypt's sarcophagus and demon inside */
        const CRYPT = building('crypt', [4, 64, 8, 67, 'E'], 4.2, { leaf: 'leaf_cell', keyIn: 'castle_wall', floorIn: 'marble' }, (a, w, d, door) => {
            const STONE = 0xb4b0a8, DARK = 0x7a7670, PALE = 0xd0ccc4;
            a.shell(w, 4.2, d, 'castle_wall', STONE, door, [3.5, 1.75]);
            a.box(0, 0, 0, w + 0.5, 0.45, d + 0.5, 'castle_wall', DARK, { faces: 'blr' });                                                    // the plinth (the front is the portico's floor)
            a.box(0, 4.2, 0.75, w + 0.4, 0.5, d + 1.9, 'castle_wall', DARK, { roof: true });                                                  // the frieze, carried out over the portico
            a.roof('gable', 0, 4.7, 0.75, d + 2.5, 1.9, w + 0.9, 'castle_wall', DARK, { ry: 90, keyEnd: 'castle_wall', tintEnd: STONE });
            a.box(0, 0, d / 2 + 0.95, w + 0.6, 0.2, 1.9, 'marble', 0xc8c4bc);
            for (const x of [-4.4, -2.2, 2.2, 4.4]) { a.box(x, 0.2, d / 2 + 1.3, 0.9, 0.22, 0.9, 'marble', 0xc0bcb4); a.cyl(x, 0.42, d / 2 + 1.3, 0.34, 3.56, 'marble', PALE); a.box(x, 3.98, d / 2 + 1.3, 0.86, 0.22, 0.86, 'marble', 0xc0bcb4); }
            a.box(0, 6.55, d / 2 + 1.9, 0.18, 1.3, 0.18, 'marble', PALE, { roof: true }); a.box(0, 7.2, d / 2 + 1.9, 0.8, 0.18, 0.18, 'marble', PALE, { roof: true });   // the cross on the ridge
            for (const s of [-1, 1]) { a.box(s * (w / 2 + 0.3), 0, -d / 2 + 1.6, 0.7, 3.3, 1.0, 'castle_wall', DARK, { n: 3, step: [0, 0, (d - 3.2) / 2] });           // buttresses, a blind slot between each pair
                a.box(s * (w / 2 + 0.03), 1.5, -d / 2 + 1.6 + (d - 3.2) / 4, 0.06, 1.5, 0.6, null, 0x141418, { n: 2, step: [0, 0, (d - 3.2) / 2] });
                a.box(door.lx + s * (door.cw / 2 + 0.75), 1.8, d / 2 + 0.22, 0.24, 0.4, 0.24, null, GHOSTLY, LAMP); a.box(door.lx + s * (door.cw / 2 + 0.75), 2.2, d / 2 + 0.22, 0.32, 0.08, 0.32, null, IRON); a.box(door.lx + s * (door.cw / 2 + 0.75), 1.72, d / 2 + 0.22, 0.32, 0.08, 0.32, null, IRON); }
            a.frame(door, d, 'castle_wall', DARK);
            a.sign('REQUIESCAT IN PACE', 0, 4.28, d / 2 + 1.73, 6.6, 0.34, '#2e2c28', '#77736d', 'cinzel');                                             // carved on the frieze
            /* THE INSIDE (the interior pass, 2026-11-16). The room's own squares: three across (x -3.5, 0, 3.5), four deep (z -5.25 .. 5.25, the door at +z).
               A stone floor over the lawn, a dais under the sarcophagus, burial niches in two tiers down both side walls between pilasters, a lit recess
               behind the demon, an iron ring of candles, grave lights on the pilasters, a dimly lit vault overhead (a walk-in's own ceiling draws black). */
            const iw = w / 2 - 0.34, id = d / 2 - 0.34, NICHE = 0x0c0c10, SLAB = 0xa8a49c;
            a.box(0, 0, 0, 2 * iw, 0.1, 2 * id, 'marble', SLAB); a.box(0, 0.1, 0, 3.4, 0.02, 2 * id - 0.2, 'castle_wall', 0x6a6660);                  // the floor and its worn middle strip
            a.box(0, 0.1, -1.75, 2.7, 0.2, 3.3, 'castle_wall', 0x8a867e);                                                                              // the dais
            a.box(0, 3.7, 0, 2 * iw, 0.06, 2 * id, 'castle_wall', 0x6e7a74, { glow: 0.3 });                   // the vault, lit
            a.box(0, 3.5, -id + 0.1, 2 * iw, 0.3, 0.2, 'castle_wall', DARK); a.box(0, 3.5, id - 0.1, 2 * iw, 0.3, 0.2, 'castle_wall', DARK);
            for (const s of [-1, 1]) { a.box(s * (iw - 0.1), 3.5, 0, 0.2, 0.3, 2 * id, 'castle_wall', DARK);
                a.box(s * (iw - 0.12), 0.1, -7 + 0.34 + 0.2, 0.24, 3.4, 0.4, 'castle_wall', DARK); a.box(s * (iw - 0.12), 0.1, -3.5, 0.24, 3.4, 0.4, 'castle_wall', DARK, { n: 3, step: [0, 0, 3.5] });   // pilasters on the square lines
                for (const z of [-5.25, -1.75, 1.75]) for (const y of [0.55, 1.75]) { a.box(s * (iw - 0.02), y, z, 0.05, 0.8, 2.5, null, NICHE); a.box(s * (iw - 0.08), y - 0.1, z, 0.2, 0.1, 2.7, 'marble', SLAB); a.box(s * (iw - 0.08), y + 0.8, z, 0.2, 0.1, 2.7, 'marble', SLAB);
                    if ((z + y * 4 + s) % 3 > 0.5) a.box(s * (iw - 0.06), y + 0.05, z + (s > 0 ? 0.3 : -0.4), 0.05, 0.7, 1.5, 'marble', 0xc0bcb4); }                                    // some niches are sealed with a slab
                a.box(s * (iw - 0.3), 2.3, -3.5, 0.18, 0.3, 0.18, null, GHOSTLY, { glow: 0.7, n: 2, step: [0, 0, 3.5] }); a.box(s * (iw - 0.3), 2.22, -3.5, 0.26, 0.07, 0.26, null, IRON, { n: 2, step: [0, 0, 3.5] }); }
            a.box(0, 0.3, -id + 0.06, 3.0, 3.1, 0.05, 'castle_wall', 0x2a6a50, { glow: 0.25 }); for (const s of [-1, 1]) a.box(s * 1.6, 0.1, -id + 0.12, 0.3, 3.4, 0.24, 'castle_wall', DARK); a.box(0, 3.4, -id + 0.12, 3.5, 0.3, 0.24, 'castle_wall', DARK);   // the lit recess behind the demon
            a.cyl(0, 2.75, 1.75, 0.95, 0.07, null, IRON, { ri: 0.82 }); a.cyl(0, 2.82, 1.75, 0.025, 0.96, null, IRON);                                  // the iron ring of candles over the middle
            a.box(0, 2.82, 1.75, 0.07, 0.16, 0.07, null, 0xe8e0c8, { ring: { n: 8, r: 0.88 } }); a.box(0, 2.98, 1.75, 0.05, 0.08, 0.05, null, AMBER, { glow: 0.9, ring: { n: 8, r: 0.88 } });
        });
        /* what stands inside: a blocker on a square's middle, decor off it, wall pieces on a wall (every row stands on the floor: `floor: true`) */
        const IN = (key, lx, lz, o) => put(CRYPT, key, lx, lz, Object.assign({ floor: true }, o || {}));
        IN('sarcophagus', 0, -1.75, { face: 90, y: 0.3 }); IN('demon_statue', 0, -5.25, { face: 180 }); IN('psxg_coffin', -3.5, 1.75, { face: 0 }); IN('trap_coffin_wood', 3.5, -5.25, { face: 30 });
        IN('candelabra', -1.75, -4.6, { face: 180 }); IN('candelabra', 1.75, -4.6, { face: 180 }); IN('candle', -1.5, -2.9, { y: 0.3 }); IN('candle', 1.5, -0.5, { y: 0.3 }); IN('candleRing', 0, 4.2);
        IN('skull_pile', -3.9, -6.0); IN('skull', 2.6, 2.9, { face: 40 }); IN('skull', -2.4, -0.4, { face: 250, y: 0.3 }); IN('stone_urn', 3.9, 5.7); IN('stone_urn', -3.9, 5.7); IN('hw_candles', 3.9, 2.6);
        /* a row's `y` of 1 m or more is a HEIGHT over the room's level 0, not a lift: the Crypt's floor is at 3.5 m (level 2) */
        const G = 3.5; IN('psx_cobweb_1', 4.4, -6.2, { y: G + 2.9 }); IN('psx_cobweb_2', -4.4, 6.2, { y: G + 2.9, face: 180 }); IN('psx_cobweb_4', 4.4, 6.2, { y: G + 2.9, face: 90 }); IN('trap_chain_draped', -4.5, -3.5, { y: G + 2.2, face: 90 });
        IN('bat_black', 1.2, -3.0, { y: G + 3.2 }); IN('bat_grey', -2.0, 3.4, { y: G + 3.3, face: 120 });
    },
    pieces(ctx) { const { gx, gc, r2, feat, props, taken, look, flat, WD, WD2, SHG, FLR, BRK, GLS } = ctx;
        const blk = (x0, z0, x1, z1, t, h) => feat({ k: 'wall', x0: r2(x0), z0: r2(z0), x1: r2(x1), z1: r2(z1), t: t || 0.3, h: h || 1.1, ghost: true, rail: false });
        /* THE GAZEBO on the plan's paving: a stone floor on its step, eight white posts, boarded rails on six sides (open to the path and to the west), a pointed roof */
        { const X0 = gx(6.5), Z0 = gx(54.5), WHITE = 0xe2ded2, R = 4.6, RC = R * Math.cos(Math.PI / 8), D2R = Math.PI / 180;
          look('gazebo', X0, Z0, 0, a => { a.cyl(0, 0, 0, 5.7, 0.07, 'marble', 0xb8b4ac); a.cyl(0, 0.07, 0, 5.2, 0.1, 'marble', 0xd0ccc4);
            a.box(0, 0.17, 0, 0.24, 3.0, 0.24, null, WHITE, { ring: { n: 8, r: R, a0: 22.5 } }); a.box(0, 2.75, 0, 0.5, 0.12, 0.5, null, WHITE, { ring: { n: 8, r: R, a0: 22.5 } });
            for (const a0 of [45, 225]) { const ring = { n: 3, r: RC, a0, arc: 90 };
                a.box(0, 0.95, 0, 3.4, 0.09, 0.12, null, WHITE, { ring }); a.box(0, 0.3, 0, 3.4, 0.08, 0.1, null, WHITE, { ring }); a.box(0, 0.38, 0, 3.3, 0.57, 0.04, null, 0xcfcbc0, { ring }); }
            a.box(0, 2.95, 0, 3.6, 0.2, 0.1, null, WHITE, { ring: { n: 8, r: RC, a0: 0 } });
            a.cyl(0, 3.15, 0, 5.4, 0.22, null, WHITE, { roof: true }); a.cyl(0, 3.37, 0, 5.6, 2.6, SHG, 0x4a5a50, { r2: 0, seg: 8, roof: true }); a.cyl(0, 5.97, 0, 0.12, 0.9, null, IRON, { roof: true });
            a.box(0, 2.6, 0, 0.22, 0.34, 0.22, null, AMBER, LAMP); a.cyl(0, 2.94, 0, 0.03, 0.5, null, IRON); });
          for (const A of [45, 90, 135, 225, 270, 315]) blk(X0 + Math.cos((A - 22.5) * D2R) * R, Z0 + Math.sin((A - 22.5) * D2R) * R, X0 + Math.cos((A + 22.5) * D2R) * R, Z0 + Math.sin((A + 22.5) * D2R) * R, 0.25, 1.0); }
        for (let y = 53; y < 56; y++) for (let x = 5; x < 8; x++) taken.add(x + ':' + y);
        /* THE IRON GATE: two brick piers with stone caps and oil lamps, the iron overthrow over the track where the corn ends */
        look('irongate', gx(19), gx(38), 0, a => { for (const s of [-1, 1]) { a.box(s * 3.0, 0, 0, 0.9, 3.4, 0.9, BRK, 0x6a5650); a.box(s * 3.0, 0, 0, 1.1, 0.4, 1.1, BRK, 0x564640); a.box(s * 3.0, 3.4, 0, 1.1, 0.25, 1.1, 'marble', 0xb0aca4);
                a.box(s * 3.0, 3.65, 0, 0.26, 0.42, 0.26, null, AMBER, LAMP); a.box(s * 3.0, 4.07, 0, 0.36, 0.08, 0.36, null, IRON); a.cyl(s * 3.0, 4.15, 0, 0.03, 0.3, null, IRON); }
            a.box(0, 3.5, 0, 5.2, 0.12, 0.12, null, IRON); a.box(0, 3.95, 0, 4.0, 0.1, 0.1, null, IRON); a.box(-2.0, 3.5, 0, 0.08, 0.45, 0.08, null, IRON, { n: 9, step: [0.5, 0, 0] });
            a.box(-3.0, 1.45, -0.48, 0.9, 0.56, 0.05, WD, 0x6a5a48); a.sign('KEEP OUT', -3.0, 1.52, -0.52, 0.8, 0.42, '#e0d0a8', '#4a3a2c', 'fell', { ry: 180 });   // a board on the west pier, read from the corn track
            a.box(0, 4.05, 0, 2.2, 0.1, 0.1, null, IRON); a.box(0, 4.15, 0, 0.08, 0.6, 0.08, null, IRON); a.box(-0.75, 4.05, 0, 0.06, 0.3, 0.06, null, IRON, { n: 4, step: [0.5, 0, 0] }); });
        for (const s of [-1, 1]) blk(gx(19) + s * 3.45, gx(38), gx(19) + s * 2.55, gx(38), 0.9, 3.4);
        props.push({ key: 'hw_gate_leaf', x: r2(gx(19) - 2.75), z: r2(gx(38) + 2.1), face: 90 }, { key: 'hw_gate_leaf_2', x: r2(gx(19) + 2.75), z: r2(gx(38) + 2.1), face: 90 });   // the two iron leaves (the Halloween pack's), standing open along the track
        /* THE TREEHOUSE: the old room's block you climb (a ladder up its south face). The block is a building tier with its own skin off (`bld.skin: false`:
           square sides, nothing of the corn's leaf sheet), boarded and framed as a timber tower, a railed deck and a hut with a lantern on top, the old oak beside it */
        feat({ k: 'plateau', id: 'est:treehouse', x: gx(6), z: gx(42), w: 7, d: 7, h: 5.25, edge: 0.3, bld: { skin: false } }); feat({ k: 'climb', x: gx(6), z: r2(gx(43) - 0.3), face: 0, look: 'ladder' });
        look('treehouse', gx(6), gx(42), 0, a => { const BOARD = 0x6a5a48, POST = 0x4a3a2c, HUT = 0x7a6248;
            a.box(0, 0, 0, 7.04, 5.25, 7.04, WD, BOARD, { top: false, uv: [3.5, 1.75] });
            for (const sx of [-1, 1]) for (const sz of [-1, 1]) a.box(sx * 3.5, 0, sz * 3.5, 0.4, 5.4, 0.4, WD2, POST);                         // corner posts, two belts of beams
            for (const y of [1.7, 3.5]) { for (const s of [-1, 1]) { a.box(0, y, s * 3.56, 7.0, 0.22, 0.14, WD2, POST); a.box(s * 3.56, y, 0, 0.14, 0.22, 7.0, WD2, POST); } }
            a.box(0, 5.25, 0, 7.6, 0.14, 7.6, FLR, 0x7a6a55);
            a.box(0, 5.39, -1.9, 4.6, 2.3, 0.14, WD, HUT); for (const s of [-1, 1]) a.box(s * 2.3, 5.39, -0.5, 0.14, 2.3, 2.9, WD, HUT);
            a.roof('gable', 0, 7.69, -0.5, 5.4, 1.5, 3.6, SHG, 0x4a4238, { keyEnd: WD, tintEnd: HUT });
            a.box(0, 6.2, -1.98, 0.9, 0.8, 0.06, GLS, 0xf0c868, { glow: 0.6 }); a.box(0, 7.25, -0.4, 0.2, 0.3, 0.2, null, AMBER, LAMP);   // the hut's back window, lit, and its lantern
            for (const s of [-1, 1]) { a.box(s * 3.7, 5.39, 0, 0.1, 0.9, 7.4, WD2, POST); a.box(s * 3.7, 6.29, 0, 0.16, 0.08, 7.5, WD2, POST); } a.box(0, 5.39, -3.7, 7.4, 0.9, 0.1, WD2, POST); a.box(0, 6.29, -3.7, 7.5, 0.08, 0.16, WD2, POST);
            for (const s of [-1, 1]) a.box(s * 2.3, 5.39, 3.7, 2.8, 0.9, 0.1, WD2, POST); });                                                   // the south rail, open at the ladder's head
        for (let y = 41; y < 43; y++) for (let x = 5; x < 7; x++) taken.add(x + ':' + y);
        /* THE LYCH GATES: a roofed timber gate where each graveyard's walk leaves the cross path (the Family Plot at square 17, the Graveyard at 28) */
        for (const sx of [17, 28]) look('lych' + sx, gc(sx), gc(65), 0, a => { const OAK = 0x4a3a2c;
            for (const x of [-1.5, 1.5]) for (const z of [-0.9, 0.9]) a.box(x, 0, z, 0.26, 2.6, 0.26, WD2, OAK);
            for (const x of [-1.5, 1.5]) { a.box(x, 2.6, 0, 0.3, 0.22, 2.6, WD2, OAK); a.box(x, 0, 0, 0.4, 0.5, 2.3, 'castle_wall', 0x8a867e); }
            for (const z of [-0.9, 0.9]) a.box(0, 2.6, z, 3.6, 0.22, 0.24, WD2, OAK);
            a.roof('gable', 0, 2.82, 0, 4.4, 1.5, 3.2, SHG, 0x6a5e52, { keyEnd: WD, tintEnd: OAK });
            a.box(0, 2.25, 0, 0.2, 0.32, 0.2, null, GHOSTLY, LAMP); a.cyl(0, 2.57, 0, 0.025, 0.25, null, IRON); });
        /* THE GRAVEYARD'S MONUMENT: an obelisk on a stepped plinth in the middle of the rows */
        look('obelisk', gc(28), gc(68), 0, a => { const ST = 0x9a968e;
            a.box(0, 0, 0, 2.5, 0.4, 2.5, 'castle_wall', 0x7a7670); a.box(0, 0.4, 0, 1.8, 0.4, 1.8, 'castle_wall', ST); a.box(0, 0.8, 0, 1.2, 1.1, 1.2, 'marble', 0xb8b4ac);
            a.box(0, 1.9, 0, 1.4, 0.14, 1.4, 'marble', 0xa8a49c); a.box(0, 2.04, 0, 0.8, 3.3, 0.8, 'marble', 0xc0bcb4); a.roof('pyramid', 0, 5.34, 0, 0.8, 0.8, 0.8, 'marble', 0xc0bcb4); });
        blk(gc(28) - 1.25, gc(68), gc(28) + 1.25, gc(68), 2.5, 2.0); taken.add('28:68');
        flat(5, 41, 7, 43); flat(5, 53, 8, 56);   // the ground levelled under the treehouse and the gazebo
    },
    /* THE AIR over this district (bake-estate.js THE AIR BY DISTRICT): grave-light motes over the Crypt and both graveyards, a slow grey dust round the
       house, its lawn and the gazebo; the corn track, the gate, the treehouse and the Drive keep the zone's fireflies */
    airZones() { return [{ sx0: 0, sy0: 60, sx1: 36, sy1: 72, kind: 'motes', color: 0x9fffc8, n: 110, speed: 0.3 }, { sx0: 0, sy0: 47, sx1: 36, sy1: 60, kind: 'dust', color: 0xb8b0c8, n: 130, speed: 0.4 }]; },
    dress(ctx) { const { gx, gc, r2, feat, props, P, dec, tree, native, sayOf, O_GROUNDS } = ctx;
        tree(4, 41, 'tree_4', 12, 1.2); tree(8, 42, 'pine', 6.5); tree(5, 44, 'pine', 6); dec('fallen_log', 7, 43); P('cave_torch', 5, 40);
        P('cave_torch', 15, 41); P('cave_torch', 19, 43); P('stone_urn', 13, 58); P('stone_urn', 22, 58); P('cave_torch', 15, 57); P('cave_torch', 20, 57); P('planter', 14, 57); P('planter', 21, 57);
        P('hw_tree', 12, 49, { face: 40 }); P('hw_tree_2', 23, 49, { face: 200 }); tree(13, 53, 'tree_5', 6.5); tree(23, 59, 'tree_6', 6); P('hollow_dead_tree', 12, 59, { face: 120 });
        P('fountain', 30, 52); P('iron_garden_bench', 28, 50, { face: 180 }); P('iron_garden_bench', 32, 54, { face: 0 }); P('hw_tree_3', 34, 51, { face: 120 }); tree(28, 54, 'tree_6', 6.5); P('brazier', 29, 55); dec('crow', 31, 50);
        P('park_bench', 2, 54, { face: 90 }); tree(1, 56, 'tree_5', 6.5); tree(3, 52, 'tree_6', 6); P('cave_torch', 4, 57);
        P('skull_pile', 1, 64); P('cave_torch', 3, 63); P('hw_tree_4', 2, 66, { face: 300 }); dec('candle', 3, 65); P('angel_statue', 2, 62, { face: 90 });
        /* THE GRAVEYARDS (redone 11-16, mondo: "this doesn't really look like a graveyard, do better"): a churchyard is CROWDED. Every square of a
           stone row holds three graves side by side (the middle one blocks on the square's middle, its two neighbours are decor, `noBlock`), each a
           different stone, a little out of true; rows stand back to back on lawn, with one dirt aisle from the lych gate (and a cross aisle at the
           obelisk in the Graveyard). The Family Plot's stones are the big ones (slabs, raised graves); a small tomb house stands in two corners. */
        { const SMALL = ['hw_stone', 'psxg_tombstone_1', 'hw_stone_2', 'hw_stone_3', 'psxg_tombstone_2', 'hw_stone_1', 'psxg_tombstone_3', 'hw_stone_4', 'hw_stone_5'], BIG = ['hw_grave', 'hw_grave_low', 'hw_grave', 'hw_stone_3'];   // (`cross` is a 3 m timber cross: too big for a grave)
          const rnd = ctx.rnd, pick = L => L[Math.floor(rnd() * L.length)], lean = f => Math.round(f + (rnd() - 0.5) * 22);
          const grave = (sx, sy, face, big) => { P(big ? pick(BIG) : pick(SMALL), sx, sy, { face: lean(face) });
              for (const dx of [-1.17, 1.17]) { if (rnd() < 0.12) continue; const wood = rnd() < 0.1; props.push(Object.assign({ key: wood ? 'wooden_cross' : pick(SMALL), x: r2(gc(sx) + dx + (rnd() - 0.5) * 0.2), z: r2(gc(sy) + (rnd() - 0.5) * 0.5), face: lean(face), noBlock: true }, wood ? { h: 1.2 + rnd() * 0.4 } : {})); } };
          const rowOf = (x0, x1, y, face, big, skip) => { for (let x = x0; x <= x1; x++) if (!(skip || []).includes(x)) grave(x, y, face, big); };
          /* THE FAMILY PLOT: the aisle is column 17; the big graves on rows 67 and 68, the angel at its head */
          rowOf(14, 20, 67, 180, true, [17]); rowOf(15, 19, 68, 0, true, [17]); rowOf(15, 19, 62, 180, false, [16, 17, 18]);
          P('angel_statue', 17, 69, { face: 0 }); P('stone_urn', 16, 69); P('stone_urn', 18, 69); P('hollow_dead_tree', 13, 66, { face: 40 }); P('psxg_dead_tree_1', 21, 66, { face: 60 });
          dec('candle', 17, 68); dec('hw_candles', 17, 68); dec('crow', 16, 61); dec('psxg_stepping_stone_1', 17, 66); dec('psxg_stepping_stone_2', 17, 67); dec('psxg_dead_bush_2', 15, 66); dec('psxg_dead_bush_1', 20, 66); dec('psxg_jack_o_lantern_1', 18, 66, { face: 160 }); dec('skull', 19, 66);
          /* THE GRAVEYARD: the aisle is column 28, the cross aisle row 68, the obelisk where they meet; four rows of stones, two tomb houses, an open grave */
          rowOf(25, 32, 66, 180, false, [28]); rowOf(24, 33, 67, 0, false, [28]); rowOf(24, 32, 69, 180, false, [28]); rowOf(25, 31, 71, 0, false, [28]); rowOf(27, 31, 62, 180, false, [28, 30]);
          for (const q of [[24, 66, 90], [33, 66, 270]]) { ctx.look('tomb' + q[0], gc(q[0]), gc(q[1]), q[2], a => { const ST = 0x9a968e, DK = 0x6e6a64;
                a.box(0, 0, 0, 3.1, 0.3, 3.1, 'castle_wall', DK); a.box(0, 0.3, 0, 2.7, 2.3, 2.7, 'castle_wall', ST, { top: false, uv: [3.5, 1.75] }); a.box(0, 2.6, 0, 3.0, 0.22, 3.0, 'castle_wall', DK, { roof: true });
                a.roof('gable', 0, 2.82, 0, 3.1, 0.9, 3.1, 'castle_wall', DK, { keyEnd: 'castle_wall', tintEnd: ST, ry: 90 });
                a.box(0, 0.3, 1.36, 1.0, 1.8, 0.06, null, 0x15161a); a.box(0, 2.1, 1.38, 1.3, 0.16, 0.1, 'marble', 0xb8b4ac); for (const e of [-1, 1]) a.box(e * 0.6, 0.3, 1.38, 0.14, 1.8, 0.1, 'marble', 0xb8b4ac);
                a.box(0, 3.72, 1.5, 0.1, 0.6, 0.1, 'marble', 0xc0bcb4, { roof: true }); a.box(0, 4.02, 1.5, 0.36, 0.1, 0.1, 'marble', 0xc0bcb4, { roof: true }); });
              feat({ k: 'wall', x0: r2(gc(q[0]) - 1.35), z0: gc(q[1]), x1: r2(gc(q[0]) + 1.35), z1: gc(q[1]), t: 2.7, h: 2.6, ghost: true, rail: false }); ctx.taken.add(q[0] + ':' + q[1]); }
          P('psxg_dead_tree_2', 24, 70, { face: 200 }); P('hw_tree_4', 32, 70, { face: 140 }); P('cave_torch', 24, 68); P('cave_torch', 33, 68);
          P('trap_coffin_open', 26, 70, { y: -0.3, face: 100 }); dec('trap_coffin_lid', 27, 70); dec('hw_shovel', 27, 70, { y: 0.02 }); props.push({ key: 'psxg_dirt_grave', x: r2(gc(26) + 0.2), z: r2(gc(70) + 1.2), y: 0.02, face: 80 });
          P('stocks', 30, 70, { face: 180 }); P('skull_pile', 28, 62); dec('crow', 27, 68); dec('crow', 31, 70); dec('skull', 29, 70); dec('hw_pumpkin', 29, 68); dec('psxg_jack_o_lantern_2', 26, 68, { face: 200 }); dec('hw_candles_2', 28, 67); dec('candle', 28, 69);
          dec('psxg_stepping_stone_1', 28, 66); dec('psxg_stepping_stone_2', 28, 67); dec('psxg_stepping_stone_1', 28, 70); dec('psxg_dead_bush_1', 25, 68); dec('psxg_dead_bush_2', 32, 68); dec('psxg_rock_2', 30, 68);
          /* the PSX graveyard pack: stone pillars and small iron leaves where each walk enters, dead trees and bushes, rocks, carved jack-o'-lanterns */
          for (const q of [[17, 61], [30, 62]]) { const X = gx(q[0] + 1), Z = gx(q[1]); props.push({ key: 'psxg_wall_pillar', x: r2(X - 3.1), z: Z }, { key: 'psxg_wall_pillar', x: r2(X + 3.1), z: Z }, { key: 'psxg_iron_gate_1', x: r2(X - 2.9), z: r2(Z + 0.7), face: 90 }, { key: 'psxg_iron_gate_2', x: r2(X + 2.9), z: r2(Z + 0.7), face: 270 }); }
          /* the low stone wall along each graveyard's north side (the PSX graveyard pack's, a panel a square), open under its lych gate */
          for (const x of [13, 14, 15, 16, 18, 19, 20, 21]) P('psxg_wall', x, 65, { face: 0 });
          for (const x of [24, 25, 26, 27, 29, 30, 31, 32]) P('psxg_wall', x, 65, { face: 0 }); }
        for (const x of [12, 13, 14, 15, 16, 19, 20, 21, 22, 23]) props.push({ key: 'hw_fence_iron', x: gc(x), z: r2(gx(60) - 0.25), face: 0 });   // the iron fence along the foot of the house's lawn, the walk's gap in its middle
        dec('psxg_jack_o_lantern_1', 16, 56, { face: 180 }); dec('psxg_jack_o_lantern_2', 19, 56, { face: 180 }); dec('psxg_dead_bush_1', 14, 58); dec('psxg_dead_bush_2', 21, 58); dec('hw_pumpkin_2', 15, 58);
        native('ghost', 28, 52, 30, sayOf(O_GROUNDS, 'ghost')); native('ghoul', 14, 66, 160, sayOf(O_GROUNDS, 'ghoul')); native('vampire', 13, 57, 180); native('werewolf', 7, 44, 90); native('eagleman', 3, 55, 90);
        native('undead', 26, 68, 200); native('jack o lantern', 31, 68, 180); native('zombie', 29, 70, 300); native('necromancer', 2, 63, 90);
        /* ── THE DRESSING PASS (2026-11-16). Heights: a row's `y` under 1 m is a lift over the ground, 1 m and over is a height over the room's level 0,
           so a thing in the air carries its plot's ground (G2 = 3.5 m, the house's rise G4 = 7 m). ── */
        { const { look, WD2 } = ctx, G2 = 3.5, G4 = 7, HX = gx(18), HZ = gx(53), air = (key, x, z, y, face) => props.push({ key, x: r2(x), z: r2(z), y: r2(y), face: face || 0 });
          /* THE LAMP POSTS (drawn, at a walk's edge against the corn, the lantern out over the walk): the district's iron post and oil lamp */
          const lampPost = (sx, sy, side) => { const at = { W: [gx(sx) + 0.3, gc(sy), 270], E: [gx(sx + 1) - 0.3, gc(sy), 90], N: [gc(sx), gx(sy) + 0.3, 0], S: [gc(sx), gx(sy + 1) - 0.3, 180] }[side];
              look('lamp' + sx + '_' + sy, at[0], at[1], at[2], a => { a.box(0, 0, 0, 0.34, 0.5, 0.34, null, IRON); a.cyl(0, 0.5, 0, 0.06, 2.7, null, IRON); a.box(0, 3.1, 0.3, 0.07, 0.07, 0.75, null, IRON);
                  a.box(0, 2.62, 0.6, 0.24, 0.36, 0.24, null, AMBER, LAMP); a.box(0, 2.98, 0.6, 0.32, 0.07, 0.32, null, IRON); a.box(0, 2.55, 0.6, 0.3, 0.07, 0.3, null, IRON); a.cyl(0, 3.05, 0.6, 0.02, 0.1, null, IRON); }); };
          lampPost(30, 42, 'W'); lampPost(31, 44, 'E'); lampPost(30, 46, 'W'); lampPost(22, 40, 'N'); lampPost(27, 40, 'N'); lampPost(33, 40, 'N');             // the Drive
          lampPost(10, 63, 'N'); lampPost(22, 63, 'N'); lampPost(26, 63, 'N'); lampPost(34, 63, 'N'); lampPost(9, 53, 'N'); lampPost(31, 58, 'E'); lampPost(30, 60, 'W');   // the cross path, the gazebo's path, the Lawn's walk
          /* the house's grounds: the porch's chair and crate, the back yard, bats round the tower, crows on the ridge */
          P('rocking_chair', 16, 56, { face: 170, y: 0.16 }); P('psx_wooden_crate_4', 19, 56, { y: 0.16, face: 20 }); dec('broom', 19, 56, { y: 0.16 });
          P('cauldron', 16, 48); dec('broom', 16, 48); P('psx_wooden_crate_4', 20, 49, { face: 15 }); dec('psx_wooden_crate_6', 20, 49); P('hw_tree_5', 18, 48, { face: 80 });
          P('wooden_cross', 22, 48, { h: 1.3, face: 180 }); props.push({ key: 'psxg_dirt_grave', x: gc(22), z: r2(gc(48) + 1.4), y: 0.02, face: 0 }); dec('hw_pumpkin_4', 21, 48);
          P('psxg_dead_tree_2', 23, 52, { face: 150 }); dec('psxg_dead_bush_1', 12, 52); dec('psxg_dead_bush_2', 22, 54); dec('psxg_rock_2', 12, 55); dec('psxg_dead_bush_2', 13, 50);
          [[-4.2, 8.5, 14.5, 30], [3.9, 9.6, 16.2, 200], [1.2, 12.5, 18.4, 110], [-6.5, 4.0, 12.2, 300], [7.4, 6.2, 13.1, 250], [-1.8, 13.4, 11.4, 70]].forEach((q, i) => air(['bat_black', 'bat_grey', 'bat_brown'][i % 3], HX + q[0], HZ + q[1], G4 + q[2], q[3]));
          air('crow', HX - 2.4, HZ, G4 + 10.42, 200); air('crow', HX + 1.1, HZ, G4 + 10.42, 160); air('crow', HX + 3.0, HZ, G4 + 10.42, 185); air('crow', HX - 9.6, HZ + 9.65, G4 + 10.82, 180);
          /* THE LAWN: the swing, urns, stepping stones from the walk to the fountain, dead bushes */
          P('play_swing', 33, 53, { face: 90 }); P('stone_urn', 32, 50); P('stone_urn', 27, 53); dec('psxg_stepping_stone_1', 29, 54); dec('psxg_stepping_stone_2', 29, 53); dec('psxg_stepping_stone_1', 30, 53);
          dec('psxg_dead_bush_1', 31, 53); dec('psxg_dead_bush_2', 27, 51); dec('psxg_dead_bush_1', 33, 50); dec('crow', 31, 51); dec('hw_pumpkin_3', 28, 51); P('psxg_dead_tree_1', 35, 52, { face: 220 });
          /* THE IRON GATE's round and THE DRIVE */
          P('iron_garden_bench', 15, 43, { face: 90 }); P('stone_urn', 19, 42); dec('hw_pumpkin', 16, 42); dec('psxg_jack_o_lantern_2', 18, 41, { face: 200 }); dec('crow', 16, 44); dec('psxg_dead_bush_1', 18, 44);
          /* THE GAZEBO's lawn and THE TREEHOUSE */
          props.push({ key: 'iron_garden_bench', x: r2(gx(6.5) - 2.6), z: gx(54.5), face: 90, y: 0.17 }, { key: 'hw_candles', x: r2(gx(6.5) + 0.4), z: r2(gx(54.5) - 0.3), y: 0.17 });
          P('stone_urn', 4, 56); dec('psxg_dead_bush_2', 2, 56); dec('psxg_stepping_stone_2', 4, 58); dec('psxg_stepping_stone_1', 3, 58); dec('hw_pumpkin_2', 6, 57); dec('crow', 5, 56);
          props.push({ key: 'telescope', x: r2(gx(6) + 2.3), z: r2(gx(42) + 2.1), face: 135 }, { key: 'psx_wooden_crate_4', x: r2(gx(6) - 1.4), z: r2(gx(42) - 1.0), face: 10 }, { key: 'rocking_chair', x: r2(gx(6) + 1.2), z: r2(gx(42) - 0.7), face: 190 });
          dec('psxg_dead_bush_1', 8, 41); dec('mushroom2', 4, 43); dec('psxg_rock_3', 7, 44); dec('hw_pumpkin_4', 8, 43);
          /* THE FAMILY PLOT and THE GRAVEYARD: slabs between the stones, more graves on the far rows, stone crosses, stepping stones down each aisle, crows on the wall, bats */
          air('crow', gc(20) + 0.5, gc(65), G2 + 1.03, 190); air('crow', gc(25) - 0.4, gc(65), G2 + 1.03, 160); air('crow', gc(31), gc(65), G2 + 1.03, 210); air('crow', gc(28), gc(65), G2 + 4.34, 180);
          air('bat_black', gc(28) + 1.5, gc(68) - 2, G2 + 5.2, 40); air('bat_grey', gc(30), gc(69), G2 + 4.1, 260); air('bat_brown', gc(17) + 1, gc(67), G2 + 4.4, 130);
        }
        /* ── THE ATMOSPHERE PASS (2026-11-16). THE LIGHTS: a room has ten real prop lights for all four districts, given in row order (three-renderer.js
           HQ_PROP_LIGHT_MAX), so this district keeps three (the two torches at the house's walk, one in the Graveyard) and every other torch, the brazier
           and the fountain glow without a light (`noLight`); the lamps, lanterns and windows are drawn glow. ── */
        { const KEEP = { [gc(15) + ':' + gc(57)]: 1, [gc(20) + ':' + gc(57)]: 1, [gc(24) + ':' + gc(67)]: 1 }, LIT = { cave_torch: 1, brazier: 1, fountain: 1, candle_ring: 1, campfire: 1 };
          props.forEach(q => { if (LIT[q.key] && q.x < 0 && q.z >= 0 && !KEEP[q.x + ':' + q.z]) q.noLight = true; }); }
        props.push({ key: 'abandoned_house', x: -168, z: 60, face: 0 }, { key: 'abandoned_house', x: -60, z: 168, face: 90 });       // the houses past the corn (the old Grounds' rim houses), outside the room
    },
};
