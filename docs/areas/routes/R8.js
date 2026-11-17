/* R8 THE RANCH ROAD: the places by hand (One World BUILD_PLAN phase 4.2, 2026-11-17). The design page: "cattle ranges and a crop circle, into
   Western Town". The crop circle stands in the farm field by the Ranch (plot -10,21): a field of crops with a ring and a dot pressed flat in it.
   The cattle range is the scrub south of the road on -8,21 and -7,21: cows loose on the open ground, a water trough. Both are ideas of Claude's
   for the page's words, made of catalogue pieces (the Halloween pack's crops, the farm animals' cow).
   Squares: the room is 96 x 72; the road's line is row 11.5 west to east, then square x 84 south. */
'use strict';
const K = require('./south-kit.js');
module.exports = { dress(ctx) {
    const { at } = K;
    /* THE CROP CIRCLE: plot -10,21 = squares 0..11, rows 12..23 (the road on rows 10..13) */
    ctx.clear(0, 14, 11, 23);
    const cx = 5.5, cy = 19;
    for (let y = 14.5; y <= 23; y += 1) for (let x = 0.5; x <= 11.5; x += 1) { const d = Math.hypot(x - cx, y - cy); if ((d > 2.1 && d < 3.3) || d < 0.9) continue; at(ctx, d > 4.6 ? 'hw_crop_2' : 'hw_crop', x, y, { face: 0 }); }
    at(ctx, 'hw_scarecrow', 10.6, 14.8, { face: 0 });
    /* THE CATTLE RANGE: plots -8,21 and -7,21 = squares 24..47, rows 12..23 */
    ctx.clear(25, 16, 46, 22);
    [[27.5, 18.2, 30], [30.6, 20.4, 210], [34.2, 17.6, 95], [38.8, 19.8, 160], [42.4, 18.1, 300], [36.4, 21.4, 20]].forEach(c => at(ctx, 'cow', c[0], c[1], { face: c[2] }));
    at(ctx, 'water_trough', 32.5, 21.6, { face: 90 }); at(ctx, 'hay_bale', 44.6, 21.4, { face: 10 }); at(ctx, 'hay_bale', 45.4, 20.2, { face: 70 });
} };
