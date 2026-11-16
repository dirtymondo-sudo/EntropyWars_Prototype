/* OUTER SPACE · THE SINGULARITY · district A · THE ACCRETION RIM (12 plots).
   The bright rim round the bowl and the two shelves under it: THE FRAME (from Saturn), THE SCREEN on its ledge (DOOR HQ's observatory:
   SIGNAL LOST), THE CAMP upstream of the drop, THE STANDING FRAME (the bay's door: there is no other side).
   Squares are the Singularity's own (sx 0..47, sy 0..47). Notes: docs/notes/areas-complexes.md "OUTER SPACE ON PLOTS".
   STANDS TODAY (the first build): the rim in the bright sheet, the camp, the screen's ledge with its projector and telescope, asteroids
   caught on the rim, the old room's watcher and occulus.
   NOT YET (for the district thread): the rim does not turn or glow; the screen is a door with no screen (a drawn screen); the shelves
   are bare; the frame is the game's plain frame leaf. */
'use strict';
exports.dress = (c) => {
    c.P('camping_tent', 42, 16, { face: 270 }); c.P('campfire', 40, 18); c.dec('cot', 43, 19); c.P('steel_table', 41, 15); c.on('crt_terminal', 41, 15, { y: 0.78 }); c.dec('sea_chest', 43, 14);
    c.P('star_projector', 37, 7); c.P('telescope', 35, 7, { face: 200 }); c.P('brass_telescope', 32, 42, { face: 0 });
    c.P('asteroid_a', 8, 12, { face: 70 }); c.P('asteroid_b', 6, 34, { face: 250 }); c.P('asteroid_a', 38, 39, { face: 10 });
    c.P('flood_mast', 20, 43); c.P('flood_mast', 25, 43); c.P('flood_mast', 16, 5); c.P('signpost', 24, 40, { face: 0 }); c.P('signpost', 44, 22, { face: 270 });
    [[5, 20], [10, 8], [43, 30], [14, 41], [30, 4]].forEach(q => c.P('crystal_cluster', q[0], q[1]));
};
exports.people = (c) => {
    c.native('watcher', 42, 20, 250, c.sayOf('watcher', 0));      // "The camp is upstream of the drop."
    c.native('occulus', 35, 11, 180, c.sayOf('occulus', 0));      // "The screen shows the drop."
    c.native('cosmic wraith', 9, 30, 90);
};
