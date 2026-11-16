/* THE ASTRAL REALM, district L: THE LIBRARY OF UNTHOUGHT THINGS (10 plots, the west side: the islands climb to the Stacks, the highest
   ground in the room). One thread works this file; the shared pieces are bake-astral.js (never edited from here).
   Notes: docs/notes/areas-complexes.md "THE ASTRAL REALM ON PLOTS" (the district's row: what it holds and lacks).
   ctx: see districts/S.js's header (the same helpers).
   THE FIRST BUILD (2026-11-16): a library with no walls and no roof, its shelves standing on the islands' rims with their backs to the sky.
   Everything the old Library room named stands on a named island: the Stacks, the Reading Room (the table, the four chairs), the Card
   Catalogue, Not Yet Written, the three lecterns, the frame, the screen to the D.U.M.B., its four people with their lines. */
'use strict';
const WD = 'wood', FACE = { N: 180, S: 0, W: 90, E: 270 };

exports.plan = function (c) { c.fill('P00-01', 1, 1, 10, 10); };   // the Stacks' island is a full square: the four towers stand in its corners

exports.build = function (c) {
    /* THE STACKS (P00-01, the landmark): four book towers, the tallest things in the Realm */
    [[2.5, 2.5, 13], [9.5, 2.5, 16], [2.5, 9.5, 11], [9.5, 9.5, 14]].forEach(([lx, ly, h], i) => { c.look('stack' + i, 'P00-01', lx, ly, i * 7, a => {
        a.box(0, 0, 0, 2.6, h, 2.6, WD, 0x8a6440); for (let y = 0.5; y < h - 0.6; y += 1.3) { a.box(0, y, 0, 2.9, 0.12, 2.9, WD, 0x5a3e28); [[0, 1.33, 2.2, 0.08], [0, -1.33, 2.2, 0.08], [1.33, 0, 0.08, 2.2], [-1.33, 0, 0.08, 2.2]].forEach((q, k) => a.box(q[0], y + 0.14, q[1], q[2], 0.9, q[3], 'carpet', [0x7a2c2c, 0x2c4a6a, 0x3a5a34, 0x6a5a2c, 0x5a2c5a][(k + Math.round(y * 3) + i) % 5])); }
        a.box(0, h, 0, 3.1, 0.3, 3.1, WD, 0x5a3e28); }); c.claim('P00-01', Math.floor(lx - 0.5), Math.floor(ly - 0.5), Math.floor(lx + 0.4), Math.floor(ly + 0.4)); });
};

exports.dress = function (c) {
    /* the shelves on every island's rim, backs to the sky (every third rim square; full on the low islands, emptier toward Not Yet Written) */
    c.plots.forEach((p, pi) => { const rim = c.rim(p.id); let n = 0;
        rim.forEach((q, i) => { if (i % 3 !== pi % 3 || n >= 7) return; const empty = p.id === 'P00-03' || (i % 5 === 0);
            c.P(empty ? 'library_shelf' : 'library_shelf_full', p.id, q[0], q[1], { face: FACE[q[2]] }); n++; }); });
    /* The Card Catalogue: the drawers, the orb (the old room's) */
    c.put('card_catalog', 'P00-00', 3, 3, { face: 180 }); c.put('card_catalog', 'P00-00', 4, 3, { face: 180 }); c.put('card_catalog', 'P00-00', 3, 4, { face: 90 }); c.put('card_catalog', 'P00-00', 8, 3, { face: 180 }); c.put('floating_orb', 'P00-00', 4, 8); c.put('microfiche_reader', 'P00-00', 8, 8);
    /* The Library Frame */
    c.put('signpost', 'P01-00', 3, 4); c.put('door_stack', 'P01-00', 8, 4, { face: 80 }); c.put('globe_lamp', 'P01-00', 4, 8); c.put('globe_lamp', 'P01-00', 7, 3);
    /* The Reading Room: the long table, four chairs, lamps */
    c.put('conference_table', 'P01-01', 2.5, 2.5, { span: 2, face: 0 }); c.put('office_chair', 'P01-01', 2, 4.5, { face: 0 }); c.put('office_chair', 'P01-01', 4.4, 3, { face: 270 }); c.put('wingback_chair', 'P01-01', 3, 8, { face: 45 }); c.put('wingback_chair', 'P01-01', 2, 7, { face: 90 });
    c.put('globe_lamp', 'P01-01', 4, 4.4); c.put('globe_lamp', 'P01-01', 4, 7); c.put('candle_ring', 'P01-01', 8, 8); c.put('thoughtform', 'P01-01', 8, 3); c.put('museum_vitrine', 'P01-01', 8, 9);
    /* The Stacks */
    c.put('library_ladder', 'P00-01', 4, 2, { face: 90 }); c.put('library_ladder', 'P00-01', 8, 9, { face: 270 }); c.put('lectern', 'P00-01', 4, 7, { face: 90 }); c.put('candle_ring', 'P00-01', 7, 4);
    /* The Stacks, west: every fork ends in a nook */
    c.put('wingback_chair', 'P00-02', 3, 3, { face: 135 }); c.put('globe_lamp', 'P00-02', 2, 4); c.put('park_bench', 'P00-02', 8, 8, { face: 180 }); c.put('dream_eye', 'P00-02', 9, 7);
    /* The Ladders */
    c.put('library_ladder', 'P01-02', 3, 3, { face: 0 }); c.put('library_ladder', 'P01-02', 8, 3, { face: 0 }); c.put('library_ladder', 'P01-02', 3, 8, { face: 180 }); c.put('thoughtform', 'P01-02', 8, 8);
    /* Not Yet Written: blank pages */
    c.put('lectern', 'P00-03', 4, 4, { face: 180 }); for (let i = 0; i < 8; i++) c.dec('paper_sheet', 'P00-03', 2 + (i * 3) % 8, 2 + (i * 5) % 8, { y: 0.02 }); c.put('candle_ring', 'P00-03', 8, 8);
    /* The Three Lecterns */
    c.put('lectern', 'P01-03', 3, 3, { face: 180 }); c.put('lectern', 'P01-03', 8, 3, { face: 180 }); c.put('lectern', 'P01-03', 3, 8, { face: 0 }); c.put('candle_ring', 'P01-03', 4, 4); c.put('candle_ring', 'P01-03', 7, 4); c.put('thoughtform', 'P01-03', 8, 8);
    /* The Ward Screen */
    c.put('eeg_rack', 'P00-04', 3, 8); c.put('cot', 'P00-04', 8, 8, { face: 90 }); c.put('globe_lamp', 'P00-04', 4, 4);
    /* The Returns */
    c.put('form_counter', 'P01-04', 3, 3, { face: 180 }); c.put('card_catalog', 'P01-04', 8, 3, { face: 180 }); c.put('park_bench', 'P01-04', 3, 8, { face: 90 }); c.put('newspaper_rack', 'P01-04', 8, 8);
};

exports.people = function (c) {
    const O = c.O.library, say = (race, i) => c.sayOf(O, race, i);
    c.native('telepath', 'P01-01', 7, 4, 200, say('telepath'));            // "Shh."
    c.native('watcher', 'P00-00', 7, 7, 315, say('watcher'));              // "The catalogue."
    c.native('mad scientist', 'P01-02', 4, 7, 90, say('mad scientist'));   // "I came for one idea."
    c.native('fortune teller', 'P00-02', 4, 8, 45, say('fortune teller')); // "Every fork ends in a nook."
};

/* warm dust over the Library */
exports.airZones = function (c) { return [{ sx0: 0, sy0: 0, sx1: 24, sy1: 60, kind: 'dust', color: 0xffd9a0, n: 120, speed: 0.3 }]; };
