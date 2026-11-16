/* OUTER SPACE · THE MOON · district C · THE CRATER (9 plots).
   THE BIG CRATER (70 m across, 5 m deep, its central peak), THE TERRACE on the north wall with the ship's collar on it (a door you climb
   to: a ramp at each end), THE ANTENNA PLATFORM under the rim with its own ramp, THE OVERLOOK mound, the lip all round.
   Squares are the Moon's own (sx 0..59, sy 0..47). Notes: docs/notes/areas-complexes.md "OUTER SPACE ON PLOTS".
   STANDS TODAY (the first build): the forms (the tool's heights), lights and rails on the Terrace, the antenna, the telescope on the
   Overlook, two of the old room's people + the Moon's own.
   NOT YET (for the district thread): THE CATWALK from the Terrace to the Antenna Platform (a `bridge` row; the first build has none);
   the collar's frame and dressing; boulders and ejecta on the lip; something to find on the crater floor; the peak as more than rock. */
'use strict';
exports.dress = (c) => {
    c.P('flood_mast', 23, 4); c.P('flood_mast', 32, 4);
    c.P('dish', 43, 4, { face: 200 }); c.P('retro_console', 41, 4, { face: 180 });
    c.P('brass_telescope', 46, 32, { face: 300 }); c.P('signpost', 44, 35, { face: 0 });
    c.P('signpost', 39, 34, { face: 0 }); c.P('lesson_sign', 26, 6, { face: 180 });
    [[24, 11], [36, 11], [19, 21], [41, 22], [31, 32], [23, 30]].forEach(q => c.dec('cave_stone', q[0], q[1]));
    c.dec('warning_tape', 28, 22); c.dec('warning_tape', 31, 19);
};
exports.people = (c) => {
    c.native('grey', 42, 12, 0, c.sayOf('grey', 1));             // "The rim is up there. The tape is on it. The ladder is not."
    c.native('mantid', 26, 25, 60);                               // its home
    c.native('voidweaver', 33, 17, 200);                          // its home
};
