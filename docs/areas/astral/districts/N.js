/* THE ASTRAL REALM, district N: THE NIGHTMARE (10 plots, the east side: the islands sink from the back of the Closet to the Maw, the
   lowest ground in the room, just over the glow). One thread works this file; the shared pieces are bake-astral.js (never edited from here).
   Notes: docs/notes/areas-complexes.md "THE ASTRAL REALM ON PLOTS" (the district's row: what it holds and lacks).
   ctx: see districts/S.js's header (the same helpers).
   THE FIRST BUILD (2026-11-16): everything the old Nightmare room named stands on a named island: the Closet's wrong side, the Bad Nights,
   the stage, the three tanks, the Bed in its bowl, the Thing Under It, the screen to the Haunted House's attic, the lava that is called
   blood, the Maw, its four people with their lines. */
'use strict';
const FL = 'flesh_2';

exports.plan = function (c) { c.fill('P04-02', 1, 1, 4, 4); };   // the Stage's corner

exports.build = function (c) {
    /* THE BLOOD (P04-05): the lava pool */
    c.pool('P04-05', 3.2, 8.2, 6.6, 'lava');
    /* THE MAW (P05-05): a lava throat in the south-east of the island, a ring of standing teeth round it (dress) */
    c.pool('P05-05', 8.3, 8.3, 4.6, 'lava');
    /* THE STAGE (P04-02): a low stage of flesh-coloured boards, a curtain frame over it. You are on. */
    c.look('stage', 'P04-02', 3, 2.5, 0, a => { a.box(0, 0, 0, 10.2, 0.5, 6.6, 'wood', 0x5a2c30); a.box(-5.0, 0.5, -3.0, 0.4, 5.2, 0.4, 'wood', 0x3a1c20); a.box(5.0, 0.5, -3.0, 0.4, 5.2, 0.4, 'wood', 0x3a1c20); a.box(0, 5.5, -3.0, 10.6, 0.5, 0.5, 'wood', 0x3a1c20);
        for (let i = 0; i < 9; i++) a.box(-4.4 + i * 1.1, 0.5, -3.05 + (i % 2) * 0.12, 1.0, 5.0, 0.1, 'carpet', i % 2 ? 0x7a1420 : 0x8e1c2a); });
    c.claim('P04-02', 2, 2, 4, 3);
};

exports.dress = function (c) {
    /* The Back of the Closet */
    c.put('costume_rack', 'P04-01', 3, 2, { face: 0 }); c.put('costume_rack', 'P04-01', 8, 2, { face: 0 }); c.put('psx_wardrobe_mp_1', 'P04-01', 3, 4, { face: 90 }); c.put('door_stack', 'P04-01', 8, 8, { face: 60 }); c.put('dream_eye', 'P04-01', 3, 8); c.put('dream_eye', 'P04-01', 8, 4);
    /* The Bad Nights */
    c.put('nightmare_bloom', 'P05-01', 3, 4); c.put('nightmare_bloom', 'P05-01', 8, 8); c.put('skull_pile', 'P05-01', 3, 8); c.put('candle_ring', 'P05-01', 8, 4); c.put('dream_eye', 'P05-01', 4, 9); c.put('rocking_chair', 'P05-01', 8, 3, { face: 200 }); c.put('psx_bed_1', 'P05-01', 2, 7, { face: 90 });
    /* The Stage: the sarcophagus on it (the old room's), the seats watching, the light on you */
    c.at('sarcophagus', 'P04-02', 3, 2.2, { y: c.base('P04-02') + 0.5, face: 90 }); c.put('followspot', 'P04-02', 8, 3, { face: 250 }); c.put('cinema_seat_row', 'P04-02', 3, 8, { face: 0 }); c.put('cinema_seat_row', 'P04-02', 4, 9, { face: 0 }); c.put('music_stand', 'P04-02', 4, 4.4); c.put('dream_eye', 'P04-02', 8, 8);
    /* The Tanks */
    c.put('iso_tank', 'P05-02', 3, 3, { face: 90 }); c.put('iso_tank', 'P05-02', 3, 8, { face: 90 }); c.put('iso_tank', 'P05-02', 8, 8, { face: 270 }); c.put('eeg_rack', 'P05-02', 8, 3); c.put('iv_stand', 'P05-02', 4, 4);
    /* The Stairs Down */
    c.put('skull_pile', 'P04-03', 3, 3); c.put('nightmare_bloom', 'P04-03', 8, 3); c.put('door_stack', 'P04-03', 3, 8, { face: 300 }); c.put('candle_ring', 'P04-03', 8, 8); c.put('hw_tree_3', 'P04-03', 9, 9);
    /* The Bed (the landmark): the bed in the south-east of the island, the rug, the rings of candles, the eyes that follow */
    c.put('royal_bed', 'P05-03', 8, 8, { face: 0 }); c.dec('rug_round', 'P05-03', 8, 9, { y: 0.02 }); c.dec('paper_sheet', 'P05-03', 9, 8, { y: 0.02 }); c.put('candle_ring', 'P05-03', 7, 9.4); c.put('candle_ring', 'P05-03', 9.4, 7);
    c.put('dream_eye', 'P05-03', 3, 3); c.put('dream_eye', 'P05-03', 9, 3); c.put('dream_eye', 'P05-03', 3, 9); c.put('psx_bedside_table_1', 'P05-03', 9, 9); c.put('nightmare_bloom', 'P05-03', 3, 4.4);
    /* The Thing Under It: it stood up (the symbiote's black tendrils, never the kraken arms) */
    [[3, 3], [4, 4], [3, 4.6], [8, 3], [8, 8], [4, 8]].forEach(q => c.put('goo_tendril', 'P04-04', q[0], q[1])); c.put('demon_statue', 'P04-04', 3.4, 3.4, { face: 135 }); c.put('skull_pile', 'P04-04', 8, 4); c.put('psx_bed_1_frame', 'P04-04', 8, 9, { face: 30 });
    /* The Attic Screen: the home movies */
    c.put('film_projector', 'P05-04', 4, 4, { face: 90 }); c.put('cinema_seat_row', 'P05-04', 3, 8, { face: 90 }); c.put('rocking_chair', 'P05-04', 4, 3, { face: 100 }); c.put('nightmare_bloom', 'P05-04', 8, 9);
    /* The Blood */
    c.put('skull_pile', 'P04-05', 8, 3); c.put('nightmare_bloom', 'P04-05', 8, 8); c.put('hw_tree_2', 'P04-05', 3, 3); c.put('candle_ring', 'P04-05', 9, 4.4);
    /* The Maw: the teeth (standing stones round the throat), the bones */
    for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2 + 0.3; c.put('menhir', 'P05-05', 8.3 + Math.cos(a) * 2.6, 8.3 + Math.sin(a) * 2.6, { face: Math.round(a * 57.3) }); }
    c.put('skull_pile', 'P05-05', 3, 3); c.put('skull_pile', 'P05-05', 4, 8); c.put('demon_statue', 'P05-05', 3, 4.4, { face: 120 }); c.put('nightmare_bloom', 'P05-05', 8, 3);
};

exports.people = function (c) {
    const O = c.O.nightmare, say = (race, i) => c.sayOf(O, race, i);
    c.native('shadow entity', 'P05-03', 7, 7, 135, say('shadow entity'));   // "You are asleep." "In the bed. Look down."
    c.native('dreameater', 'P04-02', 4, 4.5, 180, say('dreameater'));       // "You are on."
    c.native('ghoul', 'P05-02', 4, 7, 270, say('ghoul'));                   // "The tanks are warm."
    c.native('succubus', 'P05-04', 8, 3, 240, say('succubus'));             // "The bad nights come from a reel."
};

/* embers over the Nightmare, ash over its low end */
exports.airZones = function (c) { return [{ sx0: 48, sy0: 12, sx1: 72, sy1: 72, kind: 'ash', color: 0xff6a5a, n: 140, speed: 0.4 }]; };
void FL;
