/* OUTER SPACE · THE SINGULARITY · district D · THE DROP (4 plots).
   The bottom of the bowl: the lowest shelf, the floor, ZERO VOLUME (the hole: a point of no volume, the landmark), and THE DROP, the one
   straight way in from the east rim.
   Squares are the Singularity's own (sx 0..47, sy 0..47). Notes: docs/notes/areas-complexes.md "OUTER SPACE ON PLOTS".
   STANDS TODAY (the first build): the forms, the hole's floor in the void sheet with the orb over it, crystals leaning on the shelves, the Cosmic Wraith.
   NOT YET (for the district thread): the hole is a painted floor (it should pull light: a disc, a lens, a glow); the shards do not
   lean; nothing falls. THE DROP AS A WAY OUT is a new mechanic: not built. */
'use strict';
exports.dress = (c) => {
    c.P('floating_orb', 24, 24);
    [[20, 19], [28, 19], [19, 28], [29, 29], [24, 17], [17, 24], [24, 31]].forEach(q => c.P('crystal_cluster', q[0], q[1]));
    c.dec('warning_tape', 27, 22); c.dec('warning_tape', 27, 25);
};
exports.people = (c) => {
    c.native('cosmic wraith', 27, 26, 300, c.sayOf('cosmic wraith', 0));   // "Eight seconds of falling. The ninth is you."
    c.native('shadow entity', 20, 22, 100, c.sayOf('shadow entity', 0));   // "The lens bends the light round it."
};
