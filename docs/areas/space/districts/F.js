/* OUTER SPACE · THE MOON · district F · THE FAR SIDE (4 plots).
   Behind the ridge, by two passes: THE BORE (the draught that comes out under the Face on Mars), THE DIG (a floodlit pit), THE SAUCER,
   THE SOUND STAGE (Room 1969's "the footage": a second lander under studio lights). The three new plots are plain labels (label mine).
   Squares are the Moon's own (sx 0..59, sy 0..47). Notes: docs/notes/areas-complexes.md "OUTER SPACE ON PLOTS".
   STANDS TODAY (the first build): the saucer, the pit with its lights, the stage's lander, camera, lights and chair, the old room's grey.
   NOT YET (for the district thread): what stands in the Dig (a monolith is the obvious thing: NO MODEL, see NEEDS A MODEL); the stage's
   backdrop and raked dust; the bore's mouth as a real hole in the ridge; a camp for whoever runs this side. */
'use strict';
exports.dress = (c) => {
    c.P('saucer_lg', 6, 6, { face: 40 });
    c.P('flood_mast', 3, 16); c.P('flood_mast', 9, 22); c.dec('warning_tape', 6, 15); c.dec('warning_tape', 9, 19); c.P('ind_container', 9, 14, { face: 90 });
    c.P('lunar_lander', 6, 39, { face: 160 }); c.P('studio_light', 4, 42, { face: 330 }); c.P('studio_light', 9, 42, { face: 30 }); c.P('film_camera', 6, 43, { face: 0 });
    c.dec('directors_chair', 8, 44); c.P('generator', 10, 44);
    c.P('signpost', 7, 30, { face: 270 });
};
exports.people = (c) => {
    c.native('grey', 5, 31, 90, c.sayOf('grey', 2));              // "There is no far side. There is a side you have not been shown."
    c.native('men in black', 7, 41, 180);
};
