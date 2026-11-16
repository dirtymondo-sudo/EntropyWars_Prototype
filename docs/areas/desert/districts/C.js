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

   WHAT STANDS HERE TODAY:
   - THE BIG TOP (P02-02): the one walk-in building (id des:bigtop), a striped cone over a hollow hall; inside: risers, a drum, a mirror ball.
   - THE MIRRORS (P03-03): the Hall of Mirrors, a SHUT front (des:mirrors); its door `mirrors` leads to the Mandela Room.
   - THE WHEEL (P03-01): the ferris wheel. THE HORSES (P03-02): the carousel. THE ANIMALS (P01-01): two rail pens (lion; elephant + giraffe).
   - THE WAGONS (P02-01): two carnival tents, a trailer. THE MIDWAY (P01-02): high striker, popcorn cart, hot dog stand, a tent, benches.
   - THE TICKET BOOTH (P01-03): the booth + the door `tunnel` (a barn door on the sand, back to Room 1893's platform).
   - THE LADY WHO KNOWS (P02-03): the fortune tent, the mermaid's pool in its pen.
   - People (the old carnival's own, their lines read from the old `carnival` literal, which must stay in data.js): ringmaster, clown, giant,
     fortune teller, mermaid, gnome, catgirl.
   - The way in: the Highway's Exit 2 and the Circus Road (the tool's), from the east.

   KNOWN MISSING OR WRONG (from docs/notes/areas-complexes.md "THE DESERT ON PLOTS", "THE DESERT'S INSIDES", "THE LOOK PASS", "THE HIGHWAY"):
   - Never judged on screen: the big top's cone, the wheel's and the carousel's size (`h` 22 and 5.6), which way the tents and the booth face.
   - Thin: nine plots hold about 40 pieces; no stalls with insides, no lights or bunting, no sideshow row, no fence or gate round the grounds,
     nothing on the ground but sand and the layout's dirt track. The Mirrors has no inside of its own (its door is another room).
   - The tool keeps cacti out of the whole block (room squares 12..48 x 12..48).
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
   room square = home square + (0, 12). Keep to your own block; the tool warns about a row outside it.
   REBAKE: node bake-desert.js   (--dry-run prints the counts). Rules: docs/notes/areas-complexes.md "THE DESERT, THE DISTRICT FILES". */
'use strict';
let C, gx, gc, r2, feat, props, doors, npc, count, line, setRect, pen, building, put, SOLID, P, Pm, dec, native, rnd, sayOf, O_GIZA, O_GATE, O_LINE, O_CARN, U, WD, WD2, SHG, FLR, GLS, RIB, COR, CONC, PLAS;
const bind = ctx => ({ C, gx, gc, r2, feat, props, doors, npc, count, line, setRect, pen, building, put, SOLID, P, Pm, dec, native, rnd, sayOf, O_GIZA, O_GATE, O_LINE, O_CARN, U, WD, WD2, SHG, FLR, GLS, RIB, COR, CONC, PLAS } = ctx);
let BIGTOP, MIRRORS;
exports.dice = 51;

exports.buildings = ctx => { bind(ctx);
    /* THE CIRCUS: the big top is a hollow building under a striped cone (the ring inside); the hall of mirrors' front holds the old carnival's frame */
    const RED = 0xb8302c, CREAM = 0xf0e8d4;
    BIGTOP = building('bigtop', [26, 14, 33, 21, 'W'], 7, { leaf: 'leaf_frame_only', leafDouble: true, keyIn: 'canvas', floorIn: 'dirt_2' }, (a, w, d, door) => {
        a.shell(w, 5.2, d, 'canvas', CREAM, door);
        for (let i = 0; i < 7; i += 2) { const x = -w / 2 + 1.75 + i * 3.5; for (const s of [-1, 1]) a.box(x, 0, s * (d / 2 + 0.08), 3.4, 5.2, 0.06, 'canvas', RED);
            for (const s of [-1, 1]) if (!(s > 0 && false)) a.box(s * (w / 2 + 0.08), 0, x, 0.06, 5.2, 3.4, 'canvas', RED, s > 0 ? null : null); }
        a.roof('pyramid', 0, 5.2, 0, w + 1.6, 9.5, d + 1.6, 'canvas', RED); a.roof('pyramid', 0, 5.25, 0, w * 0.62, 9.6, d * 0.62, 'canvas', CREAM);
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) a.box(sx * w / 2, 0, sz * d / 2, 0.3, 6.2, 0.3, WD2, 0x4a3626);
        a.cyl(0, 14.6, 0, 0.12, 4.2, 'aluminium', 0xd8d8d8, { roof: true }); a.box(0.9, 17.4, 0, 1.8, 1.0, 0.04, null, 0xe8c030, { roof: true });                 // the king pole and its pennant
        a.sign('BIG TOP', door.lx, 3.4, d / 2 + 0.12, 7.0, 1.4, '#f0d890', '#7a1c18', 'rye'); });
    MIRRORS = building('mirrors', [44, 26, 47, 30, 'W'], 5.25, SOLID, (a, w, d) => {
        a.box(0, 0, 0, w, 5.25, d, WD, 0x6a4a8a, { top: false, uv: [3.5, 1.75] }); a.roof('shed', 0, 5.25, 0, w + 0.5, 0.9, d + 0.5, SHG, 0x3a2a4a);
        for (const x of [-4.4, -1.5, 1.5, 4.4]) a.box(x, 0.6, d / 2 + 0.06, 1.5, 3.0, 0.06, GLS, 0xb8d8f0, { glow: 0.5 });
        a.sign('HALL OF MIRRORS', 0, 4.0, d / 2 + 0.1, 11.0, 1.0, '#f0e8ff', '#3a2a4a', 'rye'); });
};

exports.furnish = ctx => { bind(ctx);
    /* the big top's ring */
    put(BIGTOP, 'riser_1', 0, -9.5, { face: 0 }); put(BIGTOP, 'riser_2', 0, -10.2, { face: 0 }); put(BIGTOP, 'riser_1', -9.5, 0, { face: 90 }); put(BIGTOP, 'riser_1', 9.5, 0, { face: 270 });
    put(BIGTOP, 'instrument_drum', 6, -7.5, { face: 200 }); put(BIGTOP, 'mirror_ball', 0, 0, { y: 4.6 }); put(BIGTOP, 'rug_round', 0, 0, { y: 0.02 });
};

exports.ground = ctx => { bind(ctx);
    /* ── THE CIRCUS (the old carnival, HQ Room 1893, moved out here: its pieces, its people and their own lines) ── */
    Pm('ferris_wheel', gx(42), gx(2), { h: 22, face: 0 }); setRect(39, 1, 45, 3, 'B');
    Pm('carousel', gx(45.5), gx(15), { h: 5.6 }); setRect(43, 13, 48, 17, 'B');
    pen(13, 0, 16, 3); pen(19, 0, 22, 3); P('lion', 14, 1, { face: 150 }); P('elephant', 20, 1, { face: 200 }); P('giraffe', 21, 2, { face: 160 }); dec('psx_wooden_crate_2', 17, 2); dec('meshy_burlap_sack', 18, 3);
    Pm('carnival_tent', gx(26), gx(2), { face: 180 }); Pm('carnival_tent', gx(34), gx(2), { face: 180 }); Pm('trailer_home_6', gx(30), gx(4) - 0.5, { face: 0 }); dec('psx_wooden_crate_3', 29, 6); dec('instrument_tambourine', 33, 5);
    Pm('ticket_booth', gc(15), gc(29), { h: 3.0, face: 180 }); P('high_striker', 21, 20, { h: 6.5, face: 180 }); P('popcorn_cart', 13, 14, { face: 90 }); P('hot_dog_stand', 20, 14, { face: 270 });
    Pm('carnival_tent', gx(14), gx(22), { face: 90 }); P('slot_machine', 20, 21, { face: 270 }); P('park_bench', 14, 19, { face: 90 }); P('park_bench', 21, 16, { face: 270 }); dec('trash_bin', 13, 16); dec('beach_ball', 22, 19);
    Pm('fortune_tent', gc(27), gc(27), { h: 5.2, face: 180 }); feat({ k: 'pool', x: gx(33), z: gx(28), r: 3.4, rz: 3.4, y: -0.2, depth: 1.4, key: 'water', bank: 0.8 }); pen(31, 26, 34, 29);
    P('park_bench', 36, 28, { face: 270 }); dec('trash_bin', 38, 25); P('paper_lantern', 42, 22, { y: 2.2 });
    native('ringmaster', 24, 18, 270, sayOf(O_CARN, 'ringmaster')); native('clown', 22, 30, 200); native('giant', 22, 20, 180, sayOf(O_CARN, 'giant')); native('fortune teller', 27, 29, 180, sayOf(O_CARN, 'fortune teller'));
    native('mermaid', 35, 27, 270, sayOf(O_CARN, 'mermaid')); native('gnome', 40, 5, 180, sayOf(O_CARN, 'gnome')); native('catgirl', 16, 22, 90, sayOf(O_CARN, 'catgirl'));
};

exports.doors = ctx => { bind(ctx);
    doors.push({ id: 'tunnel', wall: 'free', x: gc(13), z: gc(29), face: 180, leaf: 'leaf_barn', label: 'THE TUNNEL', sub: 'ROOM 1893 · BACK TO THE PLATFORM', action: { room: 'tunnel', at: 'carnival' },
        desc: 'A barn door standing by the ticket booth with nothing behind it but sand. Back to the platform. The train will still be there.' });
    doors.push({ id: 'mirrors', wall: 'free', x: r2(gx(44) - 0.45), z: gx(28), face: 270, leaf: 'leaf_frame_only', label: 'THE MANDELA ROOM', sub: 'ROOM * · IT IS DIFFERENT IN THERE', action: { room: 'mandela', at: 'mirrors' },
        desc: 'The hall of mirrors. It is not a hall and there are no mirrors; it is a room, and it is never the room it was.' });
};
