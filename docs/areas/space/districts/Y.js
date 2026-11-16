/* OUTER SPACE · MARS · district Y · CYDONIA (10 plots).
   THE FACE (a mesa in the shape of a face: brow, two sockets, the nose's ridge, the mouth, a trench with the bore to the Moon in it; up
   by the east cheek), THE PYRAMID (seven tiers, a stair up its south face), THE MESAS and THE ARCH (the mesa north of the canyon; the arch
   crosses to the one south of it), the low table rock in the north.
   Squares are Mars' own (sx 0..59, sy 0..47). Notes: docs/notes/areas-complexes.md "OUTER SPACE ON PLOTS".
   STANDS TODAY (the first build): the forms (the tool's heights), the telescope on the Pyramid, signposts, the old room's two greys and one Martian.
   NOT YET (for the district thread): the Pyramid's top (an altar? a capstone: NEEDS A MODEL); casing and a doorway on its faces; the
   Face's features need props to read from the ground; the arch is a plain deck (a rock arch: NEEDS A MODEL); ruins of the "city". */
'use strict';
exports.dress = (c) => {
    c.P('brass_telescope', 47, 12, { face: 180 }); c.P('signpost', 46, 20, { face: 0 }); c.P('signpost', 26, 13, { face: 270 });
    c.P('flood_mast', 19, 17); c.P('obelisk', 37, 14);
    [[23, 5], [25, 15], [38, 9], [44, 21], [20, 23], [36, 22]].forEach(q => c.dec('cave_stone', q[0], q[1]));
    c.P('telescope', 31, 20, { face: 180 });
};
exports.people = (c) => {
    c.native('grey', 50, 20, 180, c.sayOf('grey', 0));            // "The pyramid is a receipt."
    c.native('grey', 12, 6, 90, c.sayOf('grey', 1));              // "The face is a face from up here."
    c.native('martian', 12, 18, 60, c.sayOf('martian', 1));       // "The mouth goes to the Moon. Do not ask which side."
};
