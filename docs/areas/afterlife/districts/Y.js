/* HEAVEN · Y · THE CITY (4 plots: row 0 of room `site_prebuilt_heaven_plots`)
   One thread a file (docs/plans/DISTRICT_THREAD_BRIEF.md); the tool is bake-afterlife.js.
   THE IDEA: the city on the highest cloud (28 m), behind the Gate and the fields: a marble street (sy 9-10) under white towers, and ROOM 777
   in its middle (squares 19-28 x 2-7, walk-in, its door south): the hotel where "checkout is never"; "Room 777 has no door on the inside".
   Heaven's bay door (DOOR HQ's Room 777, "a hotel room door") stands before it.
   STANDS TODAY (the first build): Room 777's hall + its front, the old Cloud Fields' sixteen castle towers in two clusters, harps, two people.
   NOT YET: Room 777's lobby (a desk, a bell, keys that open nothing), more buildings (the plots either side are towers only), street lamps,
   the towers' walls and gates between them (the old room's castle_wall / castle_gate pieces). */
'use strict';
exports.build = ctx => { const { building, U } = ctx;
    building('room777', [19, 2, 29, 8, 'S'], 10.5, { keyIn: 'marble_light', floorIn: 'carpet_4', leaf: 'leaf_wooden', leafDouble: false }, (a, w, d, door) => {
        a.box(0, 0, 0, w + 0.1, 10.5, d + 0.1, 'marble_light', 0xf4f0e6, { top: false, faces: 'blr', uv: [7, 7] }); a.quad(0, 0, d / 2 + 0.05, w + 0.1, 10.5, 'marble_light', 0xf4f0e6, { hole: [door.lx, door.cw, 2.2], uv: [7, 7] });
        for (let f = 0; f < 3; f++) for (let x = -w / 2 + 1.75; x < w / 2; x += 3.5) { if (f === 0 && Math.abs(x - door.lx) < 1.8) continue; a.box(x, 0.9 + f * 3.4, d / 2 + 0.06, 1.3, 1.9, 0.1, U('GlassWindowTall1a'), 0x8fb0d8, { glow: 0.45 }); }
        a.box(0, 10.5, 0, w + 1, 0.7, d + 1, 'gold'); a.roof('hip', 0, 11.2, 0, w + 1, 2.6, d + 1, 'cloud_thick', 0xffffff);
        a.box(door.lx, 2.5, d / 2 + 1.2, 5, 0.25, 2.4, 'gold'); a.cyl(door.lx - 2.2, 0, d / 2 + 2.2, 0.16, 2.5, 'gold'); a.cyl(door.lx + 2.2, 0, d / 2 + 2.2, 0.16, 2.5, 'gold');
        a.sign('777', door.lx, 3, d / 2 + 0.14, 2.4, 1, '#b08a2a', '#f4f0e6', 'serif');
    });
};
exports.dress = ctx => { const { P, put, BUILT } = ctx;
    [[3, 3], [7, 3], [11, 4], [5, 7], [9, 7], [14, 3], [15, 7], [3, 7]].forEach((q, i) => P('castle_tower', q[0], q[1], { face: i * 45 }));
    [[33, 3], [37, 4], [41, 3], [45, 3], [35, 7], [39, 7], [43, 7], [31, 7]].forEach((q, i) => P('castle_tower', q[0], q[1], { face: i * 45 }));
    P('instrument_harp', 17, 9); P('instrument_harp', 30, 9); P('angel_statue', 21, 9, { face: 180 }); P('angel_statue', 27, 9, { face: 180 }); P('brazier', 12, 10); P('brazier', 36, 10);
    const B = BUILT.room777; put(B, 'concierge_podium', 0, -4, { face: 0 }); put(B, 'crystal_chandelier', 0, 0, { y: 34.5 }); put(B, 'iron_garden_bench', -10, 4, { face: 90 }); put(B, 'iron_garden_bench', 10, 4, { face: 270 });
};
exports.people = ctx => { const { native } = ctx; native('angel', 22, 10, 180); native('seraphim', 40, 9, 200); };
