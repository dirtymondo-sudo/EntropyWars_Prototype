/* THE VATICAN · P · THE PALACE (3 plots: P01-00 the Observatory, P02-00 the Archive, P03-00 the Courtyard; room `site_prebuilt_vatican_plots`)
   One thread a file (docs/plans/DISTRICT_THREAD_BRIEF.md); the tool is bake-afterlife.js.
   THE IDEA: the palace north of the Basilica. THE OBSERVATORY is a mount of two tiers (5.25 m and 10.5 m) climbed by the Dome Stair's two
   flights; the telescope on top is the way up to Heaven (link `observatory_stair`, the tool's). THE ARCHIVE is one walk-in hall (squares
   25-35 x 2-9, its door south): the stacks, the index desk; the Vatican's bay door stands on the lane before it. THE COURTYARD is an arcade
   (`k`) round a cobbled yard, the Terrace on its north side (1.75 m up) and the Pilgrim Stair's gate in the wall behind it (link
   `vatican_olympus`, the tool's).
   STANDS TODAY (the first build): the mount + its rails, columns and braziers on top; the Archive's hall with its stacks; the arcade.
   NOT YET: the observatory's dome, the Archive's gallery + reading tables + windows, the Terrace's balustrade and statues, the palace front. */
'use strict';
exports.build = ctx => { const { gx, gz, rail, building, U } = ctx;
    rail(gx(14), gz(3), gx(20), gz(3), 10.5); rail(gx(14), gz(3), gx(14), gz(7), 10.5); rail(gx(20), gz(3), gx(20), gz(7), 10.5); rail(gx(14), gz(7), gx(16), gz(7), 10.5); rail(gx(18), gz(7), gx(20), gz(7), 10.5);
    rail(gx(13), gz(2), gx(21), gz(2), 5.25); rail(gx(13), gz(2), gx(13), gz(11), 5.25); rail(gx(13), gz(11), gx(21), gz(11), 5.25); rail(gx(21), gz(2), gx(21), gz(5), 5.25); rail(gx(21), gz(7), gx(21), gz(11), 5.25);
    building('archive', [25, 2, 36, 10, 'S'], 10.5, { keyIn: 'wood', floorIn: 'wood_planks', door: 11 }, (a, w, d, door) => {
        a.box(0, 0, 0, w + 0.1, 10.5, d + 0.1, 'marble_light', 0xe6d9bd, { top: false, faces: 'blr', uv: [7, 7] });
        a.quad(0, 0, d / 2 + 0.05, w + 0.1, 10.5, 'marble_light', 0xe6d9bd, { hole: [door.lx, door.cw, 2.2], uv: [7, 7] });
        for (let x = -w / 2 + 3.5; x < w / 2; x += 3.5) { if (Math.abs(x - door.lx) < 2) continue; a.box(x, 3.2, d / 2 + 0.06, 1.3, 4.6, 0.1, U('GlassWindowTall1a'), 0x2c2a26, { glow: 0.2 }); a.box(x, 2.9, d / 2 + 0.14, 1.8, 0.3, 0.3, 'marble_light', 0xcdbf9f); }
        a.box(0, 10.5, 0, w + 1, 0.8, d + 1, 'marble_light', 0xd9cdb2); a.roof('hip', 0, 11.3, 0, w + 1, 3.2, d + 1, U('MetalRoofTiles1a'), 0x9a5a3c);
        a.sign('ARCHIVUM', door.lx, 3.1, d / 2 + 0.12, 4.2, 0.8, '#3a2f22', '#e6d9bd', 'serif');
    });
};
exports.dress = ctx => { const { P, put, BUILT, cell, W, H } = ctx;
    [[14, 3], [19, 3], [14, 6], [19, 6]].forEach(q => P('greek_column', q[0], q[1], { h: 5 })); P('brazier', 15, 5); P('brazier', 19, 5); P('lectern', 18, 4, { face: 270 }); P('angel_statue', 16, 3, { face: 180 });
    const B = BUILT.archive;   // the hall: 38.5 m wide (x), 28 m deep (z, the door at +z)
    for (let r = 0; r < 4; r++) for (let c = 0; c < 8; c++) { if (c === 3 || c === 4) continue; put(B, r % 2 ? 'library_shelf' : 'library_shelf_full', -15.75 + c * 4.5, -11 + r * 5.25, { face: 0 }); }
    put(B, 'conference_table', 0, 2, { face: 0 }); put(B, 'lectern', 0, 8, { face: 0 }); put(B, 'candle_ring', -3, 9); put(B, 'candle_ring', 3, 9); put(B, 'library_chandelier', 0, 0, { y: 7.2 });
    const k = (x, y) => x >= 36 && x < 48 && y >= 4 && y < 12 && cell[y][x] === 'k';
    for (let y = 5; y < 11; y++) for (let x = 37; x < 47; x++) if (k(x, y) && (x + y) % 2 === 1 && !(x >= 41 && x <= 42)) P('greek_column', x, y, { h: 6 });
    P('angel_statue', 38, 2, { face: 180 }); P('angel_statue', 45, 2, { face: 180 }); P('brazier', 40, 2); P('brazier', 44, 2); P('park_bench', 39, 8, { face: 90 }); P('park_bench', 45, 8, { face: 270 });
};
exports.people = ctx => { const { native, say, npc, BUILT } = ctx, B = BUILT.archive;
    native('watcher', 18, 6, 300, say('vatican_observatory', 'watcher'));
    native('priest', 42, 8, 180, say('vatican_courtyard', 'priest', 0, 'female'), { gender: 'female' });
    [['male', 4, 6, 270], ['female', -6, -4, 90]].forEach(q => { const p = B.at(q[1], q[2]); npc.push({ x: p[0], z: p[1], face: q[3], race: 'priest', gender: q[0], say: say('vatican_library', 'priest', 0, q[0]) }); });
};
