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

exports.plan = function (c) {
    c.fill('P02-05', 7, 7, 8, 8);     // the Spire's foot
    c.fill('P03-01', 6, 1, 10, 5);    // the temple's floor (the Thought-Forms)
    c.fill('P04-00', 2, 8, 9, 10);    // the Closet's floor, either side of the walk south
};

const GOLD = 0xd8b050, WAL = 0xc09a6c, WALD = 0x8a6644;
exports.build = function (c) {
    /* THE THOUGHT-FORMS (P03-01, the landmark; pass 1): the home of thought-forms is an open temple with no roof. Twelve squares round a
       square pool: ten columns (dress), the south side left open; over them a marble lintel all round and a pediment north and south.
       The orb hangs over the water. The frame: the pool's middle. */
    c.pool('P03-01', 9, 3, 3.9, 'water');
    c.look('temple', 'P03-01', 9, 3, 0, a => { const T = 3.6, Hf = 5.25;
        a.box(0, T, -Hf, 14.9, 0.6, 1.0, MRB, 0xffffff); a.box(0, T, Hf, 14.9, 0.6, 1.0, MRB, 0xffffff); a.box(-Hf, T, 0, 1.0, 0.6, 11.5, MRB, 0xffffff); a.box(Hf, T, 0, 1.0, 0.6, 11.5, MRB, 0xffffff);
        a.box(0, T + 0.6, -Hf, 15.5, 0.22, 1.3, MRB, 0xe8e0ff); a.box(0, T + 0.6, Hf, 15.5, 0.22, 1.3, MRB, 0xe8e0ff);
        a.roof('gable', 0, T + 0.82, -Hf, 15.5, 2.4, 1.1, MRB, 0xf4f0ff, { glow: 0.3 }); a.roof('gable', 0, T + 0.82, Hf, 15.5, 2.4, 1.1, MRB, 0xf4f0ff, { glow: 0.3 });
        [[-7.4, -Hf], [7.4, -Hf], [-7.4, Hf], [7.4, Hf], [0, -Hf], [0, Hf]].forEach((q, i) => a.dome(q[0], T + (i > 3 ? 3.25 : 0.85), q[1], 0.32, 0.32, CRY, 0xe0d0ff, { glow: 0.7 }));   // crystal finials
        /* the two piers of the open south side, where the columns are left out */
        a.box(-1.75, 0, Hf, 0.5, 0.5, 0.5, MRB, 0xffffff); a.box(1.75, 0, Hf, 0.5, 0.5, 0.5, MRB, 0xffffff); });
    /* THE STILL WATER (P03-04) */
    c.pool('P03-04', 3, 8.5, 5.2, 'water');
    /* THE CLOSET (P04-00; pass 1): a wardrobe seven metres wide standing over the walk south, both doors open, no back to it. You walk
       through between the coats and the floating steps behind it go down into the Nightmare. The frame: the middle of its floor. */
    c.look('closet', 'P04-00', 6, 9.5, 0, a => { const Wd = 3.95, Ht = 5.0, Dp = 1.5;
        a.box(-Wd, 0, 0, 0.35, Ht, 2 * Dp, WD, WAL); a.box(Wd, 0, 0, 0.35, Ht, 2 * Dp, WD, WAL); a.box(0, Ht, 0, 2 * Wd + 0.35, 0.35, 2 * Dp, WD, WAL);
        a.box(0, Ht + 0.35, 0, 2 * Wd + 1.0, 0.3, 2 * Dp + 0.5, WD, WALD); a.roof('gable', 0, Ht + 0.65, -Dp + 0.1, 2 * Wd + 0.6, 1.1, 0.4, WD, WALD);
        a.box(-Wd, 0, 0, 0.9, 0.3, 2 * Dp + 0.3, WD, WALD); a.box(Wd, 0, 0, 0.9, 0.3, 2 * Dp + 0.3, WD, WALD);
        /* the doors, swung wide open to the north */
        a.box(-Wd - 0.1, 0.1, -Dp - 1.75, 0.14, Ht - 0.3, 3.5, WD, WAL); a.box(Wd + 0.1, 0.1, -Dp - 1.75, 0.14, Ht - 0.3, 3.5, WD, WAL);
        a.dome(-Wd + 0.1, 2.3, -Dp - 3.2, 0.1, 0.1, null, GOLD); a.dome(Wd - 0.1, 2.3, -Dp - 3.2, 0.1, 0.1, null, GOLD);
        /* the rail and the coats (they are yours), either side of the way through */
        a.box(0, Ht - 0.9, 0, 2 * Wd, 0.1, 0.1, null, 0x9a9aa4);
        [0x4a4a72, 0x7a3434, 0x34684c, 0x6a6a6a, 0x8a7444, 0x3a3a5a, 0x7a4a7a, 0x2c5a6a].forEach((col, i) => { const x = (i < 4 ? -3.5 + i * 0.55 : 1.85 + (i - 4) * 0.55);
            a.box(x, Ht - 3.1, (i % 2) * 0.25 - 0.1, 0.42, 2.1, 0.75, 'carpet', col); a.box(x, Ht - 1.0, (i % 2) * 0.25 - 0.1, 0.5, 0.12, 0.06, null, 0x9a9aa4); });
        a.box(-2.7, Ht - 0.6, 0, 2.0, 0.08, 2 * Dp - 0.3, WD, WALD); a.box(2.7, Ht - 0.6, 0, 2.0, 0.08, 2 * Dp - 0.3, WD, WALD);   // the hat shelves
    });
    c.claim('P04-00', 2, 9, 4, 9); c.claim('P04-00', 7, 9, 9, 9);
    /* THE SPIRE (P02-05): the unfinished spire. Crystal drums, each smaller, the top one missing: somebody is still not thinking of it.
       Pass 1: twice as tall, a scaffold up one side, the last drum hanging beside the top, not yet set down. */
    c.look('spire', 'P02-05', 8, 8, 12, a => { let y = 0; const D = [[2.9, 4.2], [2.45, 4.0], [2.0, 3.8], [1.6, 3.6], [1.25, 3.4], [0.95, 3.0], [0.7, 2.6]];
        D.forEach(([r, h], i) => { a.cyl(0, y, 0, r, h, CRY, [0xb8a0ff, 0xc4b0ff, 0xd0c0ff, 0xdcd0ff, 0xe8e0ff, 0xf0e8ff, 0xf8f4ff][i], { seg: 6, glow: 0.25 + i * 0.07 }); y += h; a.cyl(0, y, 0, r + 0.25, 0.25, MRB, 0xffffff, { seg: 6 }); y += 0.25; });
        a.cyl(1.9, y + 0.9, -0.8, 0.5, 1.9, CRY, 0xffffff, { seg: 6, glow: 0.9 });
        /* the scaffold: four poles and their decks, up the first three drums */
        for (const [px, pz] of [[3.3, 3.3], [3.3, 1.6], [1.6, 3.3]]) a.cyl(px, 0, pz, 0.07, 12.6, WD, WAL, { seg: 6 });
        for (const yy of [4.2, 8.4, 12.4]) { a.box(2.6, yy, 2.6, 2.2, 0.1, 2.2, WD, WAL); a.box(3.3, yy + 0.9, 2.45, 0.06, 0.06, 1.8, WD, WALD); } });
    /* THE MIRROR (P03-00; pass 1): the gilt looking-glass frame of Camelot's garden (districts/L.js there, the same piece), round the door
       on this side of the glass; a marble step before it */
    c.look('mirrorframe', 'P03-00', 6, 1.5, 0, a => { const IW = 2.15, Hc = 5.3;
        for (const sd of [-1, 1]) { const x = sd * (IW + 0.3); a.box(x, 0, 0, 0.6, 0.5, 0.6, MRB, 0xffffff); a.cyl(x, 0.5, 0, 0.22, Hc - 0.5, null, GOLD, { seg: 10 }); a.box(x, Hc, 0, 0.6, 0.18, 0.6, null, GOLD); a.cone(x, Hc + 0.18, 0, 0.2, 0.08, 0.9, null, GOLD, { seg: 8 }); a.dome(x, Hc + 1.08, 0, 0.2, 0.2, null, GOLD); }
        a.roof('barrel', 0, Hc + 0.18, 0, 0.4, 1.5, 2 * IW + 0.6, null, GOLD, { ry: 90, ends: false, ds: true, seg: 12 });
        for (let i = 1; i < 12; i++) { const t = Math.PI * i / 12; a.dome(Math.cos(t) * (IW + 0.32), Hc + 0.2 + Math.sin(t) * 1.5, 0, i === 6 ? 0.3 : 0.13, i === 6 ? 0.3 : 0.13, null, GOLD); }
        a.box(0, 0, 1.6, 6.4, 0.12, 2.4, MRB, 0xffffff); });
    /* THE FRAME (P02-00): two crystal piers and a lintel round the frame you were called through */
    c.look('framecourt', 'P02-00', 6, 1.5, 0, a => { a.box(-2.6, 0, -0.2, 0.7, 4.0, 0.7, CRY, 0xe0d0ff, { glow: 0.5 }); a.box(2.6, 0, -0.2, 0.7, 4.0, 0.7, CRY, 0xe0d0ff, { glow: 0.5 }); a.box(0, 4.0, -0.2, 6.4, 0.45, 0.9, CRY, 0xf0e8ff, { glow: 0.6 }); });
    /* a marble balustrade round the islands you stand on to look out: the Edge, the High Thought (the Mirror's was taken off again: 0.3 frames a second on the weak-GPU count) */
    c.rimRail('P03-05'); c.rimRail('P03-02');
};

exports.dress = function (c) {
    /* The Frame */
    c.put('thoughtform', 'P02-00', 3, 3); c.put('thoughtform', 'P02-00', 8, 2); c.put('hollow_dead_tree', 'P02-00', 2, 7); c.put('signpost', 'P02-00', 7, 7); c.put('crystal_cluster', 'P02-00', 9, 8);
    /* The Mirror */
    c.put('marble_bust', 'P03-00', 3, 3); c.put('marble_bust', 'P03-00', 8, 3); c.put('crystal_cluster', 'P03-00', 2, 6); c.put('crystal_cluster', 'P03-00', 9, 7); c.put('fae_bloom_violet', 'P03-00', 4, 8); c.put('thoughtform', 'P03-00', 8, 8);
    /* The Closet */
    c.put('door_stack', 'P04-00', 2, 3, { face: 30 }); c.put('hollow_dead_tree', 'P04-00', 9, 3); c.put('dream_eye', 'P04-00', 8, 2);
    /* The Carousel */
    c.put('carousel', 'P05-00', 6.5, 7, { span: 2 }); c.at('pearly_gate', 'P05-00', 4, 4.2, { face: 90 }); c.put('decor_carousel_horse', 'P05-00', 4, 8); c.put('thoughtform', 'P05-00', 8, 3);
    /* The Near Shore */
    c.put('thoughtform', 'P02-01', 3, 3); c.put('thoughtform', 'P02-01', 8, 8); c.put('crystal_cluster', 'P02-01', 2, 8); c.put('crystal_cluster', 'P02-01', 8, 2); c.put('park_bench', 'P02-01', 3, 7, { face: 90 }); c.put('fae_bloom', 'P02-01', 9, 4);
    /* The Thought-Forms: the colonnade round the pool, the orb, the book of what you were about to think */
    [[7, 1], [8, 1], [9, 1], [10, 1], [10, 2], [10, 3], [10, 4], [7, 4], [7, 3], [7, 2]].forEach(q => c.P('greek_column', 'P03-01', q[0], q[1]));
    c.at('floating_orb', 'P03-01', 9, 3, { y: 0.6 });
    c.put('lectern', 'P03-01', 8, 5.4, { face: 0 }); c.put('thoughtform', 'P03-01', 2, 7); c.put('thoughtform', 'P03-01', 3, 9); c.put('thoughtform', 'P03-01', 8, 8); c.put('thoughtform', 'P03-01', 9, 9.5); c.put('crystal_cluster', 'P03-01', 2, 2);
    c.at('fish_school', 'P03-01', 9, 3, { y: 5 });
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
    /* ── PASS 2 (the Sea has no insides but the Waiting Room, dressed in data.js: this pass gives every plain island its own idea) ── */
    /* The Far Shore: a lighthouse on the last island west, seen from every island of the Sea; a boat pulled up on the grass */
    c.put('lighthouse', 'P00-05', 3, 5.5); c.put('rowboat', 'P00-05', 8, 5, { face: 70 }); c.put('mooring_bollard', 'P00-05', 9, 7); c.put('ship_anchor', 'P00-05', 7, 9); c.at('sea_buoy', 'P00-05', 11.6, 3, { y: c.base('P00-05') - 1.2 });
    /* The Near Shore: a shore with no water: a skiff, a chest, a buoy bobbing on nothing */
    c.put('rowboat', 'P02-01', 3, 9, { face: 20 }); c.put('sea_chest', 'P02-01', 2, 3.6); c.put('mooring_bollard', 'P02-01', 9, 8); c.at('sea_buoy', 'P02-01', 0.3, 2, { y: c.base('P02-01') - 1.2 });
    /* The Islands: the sea's own garden, growing in the air; the fish go by overhead */
    [['coral_brain', 2, 3], ['coral_tube', 4, 2], ['coral_brain', 9, 3], ['giant_clam', 8, 2], ['coral_tube', 2, 8], ['giant_clam', 4, 9], ['coral_brain', 9, 9], ['coral_tube', 8, 7.6]].forEach(q => c.put(q[0], 'P02-03', q[1], q[2]));
    [[3, 4], [8, 4], [3, 7.6], [9, 8], [4, 3], [7.6, 9]].forEach(q => { c.dec('coral_fan', 'P02-03', q[0], q[1]); c.dec(['fae_flower_small_violet', 'fae_flower_small_blue', 'fae_flower_small_pink'][(q[0] + q[1]) % 3 | 0], 'P02-03', q[0], q[1]);   /* (kelp read as black rags in this light: the small fae flowers stand for the weed) */ c.dec('anemone', 'P02-03', q[0], q[1]); });
    c.at('fish_school', 'P02-03', 2.5, 2.5, { y: 2.6 }); c.at('fish_school', 'P02-03', 9, 8.5, { y: 6 }); c.at('fish_school', 'P02-02', 6, 6, { y: 5 }); c.at('fish_school', 'P03-04', 3, 8.5, { y: 3.4 });
    /* The Open Sea: on each stepping island one thing somebody thought of once */
    c.put('decor_piano', 'P02-02', 9, 9, { face: 200 }); c.put('rocking_chair', 'P02-02', 1.4, 1.4, { face: 135 }); c.put('school_desk', 'P02-02', 2, 8.4, { face: 90 }); c.put('star_projector', 'P02-02', 9.6, 2.6);
    /* The Carousel: what is left of the fair */
    c.put('ticket_booth', 'P05-00', 4, 4.4, { face: 135 }); c.put('popcorn_cart', 'P05-00', 8, 4.4, { face: 200 }); c.put('high_striker', 'P05-00', 4.4, 8.6);
    /* The Impossible Stair: doors standing on their own, waiting to be doors */
    c.put('psx_door_1_loose', 'P02-04', 8, 4, { face: 20 }); c.put('psx_door_2_loose', 'P02-04', 9, 8, { face: 250 }); c.put('psx_door_4_loose', 'P02-04', 3, 9, { face: 110 }); c.put('giant_hourglass', 'P02-04', 4, 7.6);
    /* The Still Water: seats round the pool, a bust looking at itself */
    c.put('marble_bust', 'P03-04', 4.4, 4.4, { face: 200 }); c.put('park_bench', 'P03-04', 1.6, 6.5, { face: 90 }); c.put('fae_bloom', 'P03-04', 8, 8); c.put('fae_bloom_pink', 'P03-04', 9, 7);
    /* The Hollow Tree, the Edge, the High Thought, the Fortune Tent, the Mirror, the Frame */
    c.put('owl_perched', 'P01-05', 8.4, 7); c.put('bird_cage', 'P01-05', 3, 7.6); c.put('fae_bloom_violet', 'P01-05', 2, 4);
    c.put('astronomical_clock', 'P03-05', 4, 6.6, { face: 0 }); c.put('star_projector', 'P03-02', 7, 4);
    c.put('brass_orrery', 'P03-03', 8, 7, { y: 0.02 }); c.put('bird_cage', 'P03-03', 9, 4); c.put('fae_bloom_pink', 'P03-03', 3, 4);
    c.put('psx_door_2_loose', 'P03-00', 9, 4, { face: 300 }); c.put('giant_hourglass', 'P03-00', 3, 7.6, { face: 40 }); c.put('fae_bloom', 'P02-00', 3, 8); c.put('fae_bloom_violet', 'P02-00', 9, 3);
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
