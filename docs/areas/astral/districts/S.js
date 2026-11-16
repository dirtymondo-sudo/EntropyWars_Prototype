/* THE ASTRAL REALM, district S: THE SEA OF POSSIBILITY (16 plots: the S through the middle of the room; the pilot district).
   One thread works this file. The shared pieces (the islands, the bridges, the six ways, the sky) are bake-astral.js: never edit them from
   here (docs/notes/claims.md row "The Astral Realm, the tool + shared pieces"). Notes: docs/notes/areas-complexes.md "THE ASTRAL REALM, DISTRICT S".
   ctx (bake-astral.js THE DISTRICT FILES): put(key, plot, lx, ly, o) a blocker on the free ground square nearest (lx, ly) · dec(...) decor off
   the middle · at(...) an exact point (fractions of squares) · native(race, plot, lx, ly, face, say) · pool(plot, lx, ly, r, key) ·
   look(name, plot, lx, ly, rot, fn) a drawn piece · claim(plot, lx0, ly0, lx1, ly1) · rim(plot) · squares(plot, chars) · rnd().
   A plot's squares are local, 0..11 from its north-west corner; the walks run along 5 and 6 to every port.
   THE FIRST BUILD (2026-11-16): everything the old Sea room had stands here on a named island (the colonnade, the pool, the orb, the book,
   the gate, the bench and telescope on the high thought, the impossible stair, the carousel, the fortune tent, the hollow tree, the closet,
   the eyes, the fish, the clouds, its five people with their lines) + the visitors of the first plan. */
'use strict';
const CRY = 'crystal', MRB = 'marble_light', WD = 'wood';

exports.plan = function (c) { c.fill('P02-05', 7, 7, 8, 8); };   // the Spire's foot

exports.build = function (c) {
    /* THE THOUGHT-FORMS (P03-01, the landmark): the knee-deep pool in the north-east of the island, four columns round it, the orb over it */
    c.pool('P03-01', 8.5, 3, 5.6, 'water');
    /* THE STILL WATER (P03-04) */
    c.pool('P03-04', 3, 8.5, 5.2, 'water');
    /* THE CLOSET (P04-00): a closet standing on its own over the walk south, no back to it: you walk through the coats and down the steps
       into the Nightmare. Drawn: two sides, a top, a door ajar. */
    c.look('closet', 'P04-00', 6, 9.4, 0, a => {
        a.box(-3.7, 0, 0, 0.3, 4.2, 2.4, WD, 0x6a4a34); a.box(3.7, 0, 0, 0.3, 4.2, 2.4, WD, 0x6a4a34); a.box(0, 4.2, 0, 7.7, 0.3, 2.4, WD, 0x5a3e2c);
        a.box(-2.6, 0, -1.9, 2.2, 3.9, 0.12, WD, 0x7a5a40, { ry: 62 }); a.box(0, 3.75, -1.1, 7.1, 0.12, 0.12, 'metal', 0x888888);
        for (let i = 0; i < 7; i++) a.box(-2.9 + i * 0.95, 1.5, -1.1 + (i % 2) * 0.2, 0.55, 2.2, 0.16, 'carpet', [0x3a3a52, 0x5a2c2c, 0x2c4a3a, 0x4a4a4a, 0x6a5a3a, 0x2a2a3a, 0x5a3a5a][i]);   // the coats (they are yours)
    });
    /* THE SPIRE (P02-05): the unfinished spire. Crystal drums, each smaller, the top one missing: somebody is still not thinking of it. */
    c.look('spire', 'P02-05', 7.5, 7.5, 12, a => { let y = 0; [[2.6, 3.2], [2.1, 3.0], [1.65, 2.8], [1.25, 2.6], [0.9, 2.4], [0.6, 2.0]].forEach(([r, h], i) => { a.cyl(0, y, 0, r, h, CRY, [0xb8a0ff, 0xc4b0ff, 0xd0c0ff, 0xdcd0ff, 0xe8e0ff, 0xf4f0ff][i], { seg: 6, glow: 0.12 + i * 0.05 }); y += h; a.cyl(0, y, 0, r + 0.25, 0.25, MRB, 0xffffff, { seg: 6 }); y += 0.25; });
        a.cyl(1.4, y + 1.2, -0.6, 0.45, 1.6, CRY, 0xf4f0ff, { seg: 6, glow: 0.4 }); });   // the last drum, not yet set down
    c.claim('P02-05', 7, 7, 8, 8);
    /* THE MIRROR's island (P03-00): a marble court round the frame, two piers */
    c.look('mirrorcourt', 'P03-00', 6, 1.5, 0, a => { a.box(-2.6, 0, -0.6, 0.7, 4.4, 0.7, MRB, 0xffffff); a.box(2.6, 0, -0.6, 0.7, 4.4, 0.7, MRB, 0xffffff); a.box(0, 4.4, -0.6, 6.4, 0.5, 0.9, MRB, 0xf0ecff); a.box(0, 4.9, -0.6, 4.2, 0.35, 0.7, 'gold_2', 0xffe9a0); });
    /* THE FRAME's island (P02-00): the same two piers in violet crystal */
    c.look('framecourt', 'P02-00', 6, 1.5, 0, a => { a.box(-2.6, 0, -0.6, 0.7, 4.0, 0.7, CRY, 0xc8b0ff, { glow: 0.2 }); a.box(2.6, 0, -0.6, 0.7, 4.0, 0.7, CRY, 0xc8b0ff, { glow: 0.2 }); a.box(0, 4.0, -0.6, 6.4, 0.45, 0.9, CRY, 0xe0d0ff, { glow: 0.3 }); });
};

exports.dress = function (c) {
    /* The Frame */
    c.put('thoughtform', 'P02-00', 3, 3); c.put('thoughtform', 'P02-00', 8, 2); c.put('hollow_dead_tree', 'P02-00', 2, 7); c.put('signpost', 'P02-00', 7, 7); c.put('crystal_cluster', 'P02-00', 9, 8);
    /* The Mirror */
    c.put('marble_bust', 'P03-00', 3, 3); c.put('marble_bust', 'P03-00', 8, 3); c.put('crystal_cluster', 'P03-00', 2, 6); c.put('crystal_cluster', 'P03-00', 9, 7); c.put('fae_bloom_violet', 'P03-00', 4, 8); c.put('thoughtform', 'P03-00', 8, 8);
    /* The Closet */
    c.put('costume_rack', 'P04-00', 3, 8, { face: 90 }); c.put('costume_rack', 'P04-00', 8, 8, { face: 270 }); c.put('door_stack', 'P04-00', 2, 3, { face: 30 }); c.put('hollow_dead_tree', 'P04-00', 9, 3); c.put('dream_eye', 'P04-00', 8, 2);
    /* The Carousel */
    c.put('carousel', 'P05-00', 6.5, 7, { span: 2 }); c.at('pearly_gate', 'P05-00', 4, 4.2, { face: 90 }); c.put('decor_carousel_horse', 'P05-00', 4, 8); c.put('thoughtform', 'P05-00', 8, 3);
    /* The Near Shore */
    c.put('thoughtform', 'P02-01', 3, 3); c.put('thoughtform', 'P02-01', 8, 8); c.put('crystal_cluster', 'P02-01', 2, 8); c.put('crystal_cluster', 'P02-01', 8, 2); c.put('park_bench', 'P02-01', 3, 7, { face: 90 }); c.put('fae_bloom', 'P02-01', 9, 4);
    /* The Thought-Forms: the colonnade round the pool, the orb, the book of what you were about to think */
    c.put('greek_column', 'P03-01', 7, 1); c.put('greek_column', 'P03-01', 10, 2); c.put('greek_column', 'P03-01', 7, 4.6); c.put('greek_column', 'P03-01', 10.4, 4.4);
    c.put('floating_orb', 'P03-01', 3, 3); c.put('lectern', 'P03-01', 4, 4, { face: 0 }); c.put('thoughtform', 'P03-01', 2, 7); c.put('thoughtform', 'P03-01', 3, 9); c.put('thoughtform', 'P03-01', 8, 8); c.put('thoughtform', 'P03-01', 9, 9.5); c.put('crystal_cluster', 'P03-01', 2, 2);
    c.at('fish_school', 'P03-01', 8.5, 3, { y: 3 });
    /* The Open Sea: the stepping islands */
    c.put('crystal_cluster', 'P02-02', 1, 1); c.put('dream_eye', 'P02-02', 10, 2); c.put('crystal_cluster', 'P02-02', 2, 9); c.put('thoughtform', 'P02-02', 9, 9); c.put('hollow_dead_tree', 'P02-02', 10, 10);
    c.at('white_cloud', 'P02-02', 2.5, 5.5, { y: c.base('P02-02') - 3 }); c.at('white_cloud', 'P02-02', 9.5, 6, { y: c.base('P02-02') - 5 });
    /* The High Thought: the bench and the telescope */
    c.put('park_bench', 'P03-02', 4, 7, { face: 180 }); c.put('telescope', 'P03-02', 7, 8, { face: 30 }); c.put('hollow_dead_tree', 'P03-02', 8, 4); c.put('crystal_cluster', 'P03-02', 3, 4);
    /* The Islands */
    c.put('thoughtform', 'P02-03', 3, 3); c.put('crystal_cluster', 'P02-03', 8, 3); c.put('crystal_cluster', 'P02-03', 3, 8); c.put('fae_bloom_pink', 'P02-03', 8, 8); c.at('fish_school', 'P02-03', 6, 6, { y: 4 });
    /* The Fortune Tent */
    c.put('fortune_tent', 'P03-03', 7.5, 2.5, { span: 2 }); c.put('candle_ring', 'P03-03', 3, 3); c.put('giant_hourglass', 'P03-03', 3, 8); c.put('thoughtform', 'P03-03', 8, 8);
    /* The Impossible Stair */
    c.put('impossible_stair', 'P02-04', 2.5, 2.5, { span: 2 }); c.put('thoughtform', 'P02-04', 8, 8); c.put('crystal_cluster', 'P02-04', 3, 8); c.put('door_stack', 'P02-04', 8, 3, { face: 300 });
    /* The Still Water */
    c.put('park_bench', 'P03-04', 7, 8, { face: 270 }); c.put('fae_bloom_violet', 'P03-04', 8, 3); c.put('crystal_cluster', 'P03-04', 3, 3); c.put('thoughtform', 'P03-04', 8, 9);
    /* The Spire: the camera left on it (the tape's own) */
    c.put('film_camera', 'P02-05', 4, 7, { face: 135 }); c.put('crystal_cluster', 'P02-05', 4, 4); c.put('crystal_cluster', 'P02-05', 8, 4);
    /* The Edge */
    c.put('dream_eye', 'P03-05', 4, 8); c.put('dream_eye', 'P03-05', 7, 8); c.put('brass_telescope', 'P03-05', 4, 4, { face: 180 }); c.put('park_bench', 'P03-05', 7, 4, { face: 0 });
    /* The Far Shore */
    c.put('hollow_dead_tree', 'P00-05', 3, 3); c.put('hollow_dead_tree', 'P00-05', 2, 8); c.put('hollow_dead_tree', 'P00-05', 8, 8); c.put('door_stack', 'P00-05', 7, 3, { face: 80 }); c.put('dream_eye', 'P00-05', 3, 7); c.put('thoughtform', 'P00-05', 6, 9);
    /* The Hollow Tree */
    c.put('hollow_tree', 'P01-05', 7.5, 8); c.put('fae_bloom', 'P01-05', 4, 8); c.put('fae_bloom_pink', 'P01-05', 8, 3); c.put('crystal_cluster', 'P01-05', 3, 3);
    /* clouds under the Sea's islands, hung in the sky between them */
    [['P02-01', 0.3, 11.5, 4], ['P03-03', 11.6, 0.4, 5], ['P02-04', 11.5, 11.5, 3], ['P01-05', 0.3, 0.3, 4], ['P04-00', 0.2, 11.4, 6], ['P03-00', 11.7, 11.6, 3]].forEach(q => c.at('white_cloud', q[0], q[1], q[2], { y: c.base(q[0]) - q[3] }));
};

exports.people = function (c) {
    const O = c.O.sea, say = (race, i) => c.sayOf(O, race, i);
    c.native('watcher', 'P02-00', 7, 4, 180, say('watcher'));             // "Everything you could think is here already."
    c.native('fortune teller', 'P03-03', 7, 5, 180, say('fortune teller'));
    c.native('telepath', 'P03-02', 5, 4, 90, say('telepath'));            // "The high thought is nine metres up."
    c.native('dreameater', 'P00-05', 4, 4, 90, say('dreameater'));        // "The eyes are not watching you."
    c.native('siren', 'P02-02', 4, 4, 270, say('siren'));                 // "Mind the gaps."
    /* the visitors of the first plan (no lines yet: no invented words) */
    c.native('glitch', 'P02-03', 8, 7, 200); c.native('machine elves', 'P02-01', 8, 4, 220); c.native('occulus', 'P03-05', 5, 7, 0);
    c.native('orb of light', 'P03-01', 4, 8, 60); c.native('voidweaver', 'P03-04', 8, 4, 250);
};

exports.airZones = function (c) { return []; };
