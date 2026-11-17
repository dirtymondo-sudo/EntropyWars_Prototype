/* THE INTERNET · S · THE SERVER FARM (9 plots: columns 0-2, rows 0-2; one floor, the data hall, level 8 = 14 m over the grid).
   One thread a file (docs/plans/DISTRICT_THREAD_BRIEF.md); the tool is bake-internet.js, the rules docs/notes/areas-complexes.md "THE INTERNET ON PLOTS".
   THE IDEA (mondo's OK 11-17: "aisles of racks and cables"): the hardware the whole Internet runs on, as one hall hanging in the dark. A grid of
   aisles (rows and columns 5-6 of every plot), the racks in rows between them, the cable trays over the aisles, the cooling towers in the
   north-east corner. You come in at the north-west corner, through the screen between the D.U.M.B. Control Room's servers (the Login Screen).
   LANDMARK: THE CLOUD (label mine): the cloud everybody keeps their photos in, over the middle plot, wired down into the racks.
   STANDS TODAY (the first build, One World 4.4): the rack rows, the trays, the Login Screen, the Cloud, the cooling towers, the tape shelves,
   the Recycle Bin, the cable drums; the hall's people.
   NOT YET: blinking lights on the racks, the floor tiles lifted where the cables come up, a sound. */
'use strict';
const STEEL = 'gunmetal', TRAY = 0x8a96a4, CABLE = [0x40ffb0, 0x3fa0ff, 0xffd040, 0xff5fb0];
/* a drawn piece nobody walks through: its squares claimed, a ghost wall round it */
const solid = (c, id, lx0, ly0, lx1, ly1, h) => { const p = c.plot[id], b = c.base(id), X0 = c.gx(p.sx + lx0), X1 = c.gx(p.sx + lx1 + 1), Z0 = c.gx(p.sy + ly0), Z1 = c.gx(p.sy + ly1 + 1);
    c.claim(id, lx0, ly0, lx1, ly1);
    [[X0, Z0, X1, Z0], [X0, Z1, X1, Z1], [X0, Z0, X0, Z1], [X1, Z0, X1, Z1]].forEach(([x0, z0, x1, z1]) => c.feat({ k: 'wall', absY: true, x0, z0, x1, z1, t: 0.3, h: h || 4, y: b, ghost: true, rail: false })); };
/* the blocks between the aisles: local ranges of a plot (the aisles are rows / columns 5-6) */
const BLOCKS = [[0, 4], [7, 11]];
exports.build = c => { exports.build2(c);
    /* THE LOGIN SCREEN (P00-00): a login box the size of a wall, facing the aisle you come in on */
    c.look('login', 'P00-00', 9, 1.2, 0, a => { a.box(-2.6, 0, 0, 0.4, 2.2, 0.4, STEEL, 0x30343a); a.box(2.6, 0, 0, 0.4, 2.2, 0.4, STEEL, 0x30343a);
        a.box(0, 2.2, -0.1, 9.4, 6.2, 0.3, STEEL, 0x22262c);
        a.sign('WELCOME BACK', 0, 6.7, 0.08, 7.6, 1.1, '#e8fff4', '#0c3a30', 'way');
        a.sign('USERNAME', 0, 5.3, 0.08, 7.0, 0.9, '#5a6a66', '#f2f6f4', 'way');
        a.sign('PASSWORD  ••••••••', 0, 4.15, 0.08, 7.0, 0.9, '#5a6a66', '#f2f6f4', 'way');
        a.sign('LOG IN', 0, 2.8, 0.08, 3.2, 1.0, '#ffffff', '#1f8a5a', 'way');
        a.sign('FORGOT PASSWORD?', 0, 2.35, 0.08, 3.4, 0.35, '#7fffd0', '', 'way', { kind: 'over' }); });
    solid(c, 'P00-00', 8, 1, 10, 1, 9);
    /* THE CABLE TRAYS: over every aisle of the hall, 3.6 m up, a tray with four lit cables in it */
    c.plots.forEach(p => c.look('trays_' + p.id, p.id, 0, 0, 0, a => { const L = 12 * c.C;
        for (const m of [5, 6]) { const t = (m + 0.5) * c.C + (m === 5 ? 0.6 : -0.6);
            a.box(L / 2, 3.6, t, L, 0.12, 0.7, STEEL, TRAY, { glow: 0.15 }); a.box(t, 3.75, L / 2, 0.7, 0.12, L, STEEL, TRAY, { glow: 0.15 });
            CABLE.forEach((col, i) => { const o = -0.24 + i * 0.16; a.box(L / 2, 3.73, t + o, L, 0.06, 0.06, null, col, { glow: 0.9 }); a.box(t + o, 3.88, L / 2, 0.06, 0.06, L, null, col, { glow: 0.9 }); }); }
        for (const q of [[5.5, 5.5]]) a.box(q[0] * c.C, 3.6, q[1] * c.C, 0.2, 0.4, 0.2, STEEL, TRAY); }));
    /* THE COOLING TOWERS (P02-00): four chillers, a fan on each; a drawn piece a block */
    c.look('chillers', 'P02-00', 0, 0, 0, a => { [[2.5, 2.5], [9, 2.5], [2.5, 9], [9, 9]].forEach(([x, y]) => { const X = x * c.C, Z = y * c.C;
        a.cyl(X, 0, Z, 3.6, 7.5, 'urban:MetalCorrugatedPainted2a', 0xc8d4dc, { seg: 16, glow: 0.2 }); a.cyl(X, 7.5, Z, 3.8, 0.4, STEEL, 0x50565e, { seg: 16 });
        a.cyl(X, 7.9, Z, 2.6, 0.3, null, 0x7fffd0, { seg: 16, glow: 0.8 }); a.box(X, 8.2, Z, 5.0, 0.15, 0.5, STEEL, 0x30343a); a.box(X, 8.2, Z, 0.5, 0.15, 5.0, STEEL, 0x30343a); }); });
    [[1, 1, 4, 4], [7, 1, 10, 4], [1, 7, 4, 10], [7, 7, 10, 10]].forEach(q => solid(c, 'P02-00', q[0], q[1], q[2], q[3], 9));
    /* THE CLOUD (P01-01, the landmark): a cloud over the hall's middle, 11 m up, wired down into four racks; its name under it */
    c.look('cloud', 'P01-01', 6, 6, 0, a => { const PUFF = [[0, 0, 4.2], [3.4, 0.6, 3.2], [-3.6, -0.4, 3.4], [1.2, 2.8, 2.8], [-1.4, -2.9, 2.9], [5.6, -1.4, 2.2], [-5.8, 1.6, 2.3], [2.4, -2.6, 2.4], [-2.2, 2.6, 2.5]];
        PUFF.forEach(([x, z, r], i) => { a.dome(x, 11 - r * 0.25, z, r, r * 0.95, null, 0xf4fbff, { glow: 0.55 }); a.dome(x * 0.9, 11 - r * 0.25, z * 0.9, r * 0.92, -r * 0.5, null, 0xdfeaf2, { glow: 0.45 }); });
        [[-8, -8], [8, -8], [-8, 8], [8, 8]].forEach(([x, z], i) => { const n = 7; for (let k = 0; k < n; k++) { const t0 = k / n, t1 = (k + 1) / n, y0 = 2.2 + (11 - 2.2) * t0, y1 = 2.2 + (11 - 2.2) * t1;
            a.box(x * (1 - t0 * 0.7), y0, z * (1 - t0 * 0.7), 0.18, y1 - y0 + 0.05, 0.18, null, CABLE[i], { glow: 0.95 }); } });
        a.sign('THE CLOUD', 0, 6.6, 0, 8, 1.4, '#e8fff4', '#0c3a30', 'way'); a.sign('THE CLOUD', 0, 6.6, -0.05, 8, 1.4, '#e8fff4', '#0c3a30', 'way', { ry: 180 });
        a.sign('IT IS SOMEBODY ELSE\'S COMPUTER', 0, 5.9, 0, 8, 0.6, '#7fffd0', '#08221c', 'way'); a.sign('IT IS SOMEBODY ELSE\'S COMPUTER', 0, 5.9, -0.05, 8, 0.6, '#7fffd0', '#08221c', 'way', { ry: 180 }); });
    /* THE RECYCLE BIN (P02-02): the bin, the size of a house, everything deleted kept in it */
    c.look('bin', 'P02-02', 9, 9, 0, a => { a.cone(0, 0, 0, 4.4, 5.2, 8, 'urban:MetalCorrugated2a', 0x9aa4b0, { seg: 18, glow: 0.2 }); a.cyl(0, 8, 0, 5.4, 0.5, STEEL, 0x6a7480, { seg: 18 });
        for (let i = 0; i < 9; i++) { const t = i / 9 * Math.PI * 2; a.box(Math.cos(t) * 2.8, 8.2, Math.sin(t) * 2.8, 1.6, 1.0 + (i % 3) * 0.5, 1.2, null, [0xf4f4f0, 0xe0e8f0, 0xf0e0c0][i % 3], { ry: i * 37, glow: 0.4 }); }
        a.sign('RECYCLE BIN', 0, 3.2, 4.85, 6, 1.0, '#ffffff', '#2a3440', 'way'); });
    solid(c, 'P02-02', 7, 7, 10, 10, 9);
};
/* INSIDE A SERVER (plan 3, the interior pass: an inside of a thing): one rack on the Hot Aisle is the size of a house and its door is open.
   Inside: the blades to the ceiling either side, the lights, the heat. */
exports.build2 = c => { const K = require('../kit.js');
    const B = c.building('server', 'P00-01', 1, 7, 4, 10, 'E', 7, { key: 'urban:MetalPanel2a', tint: 0x2a3040, glow: 0.2, leaf: 'none', keyIn: 'urban:MetalGratingGrid1a', floorIn: 'urban:MetalGratingGrid1a', roofTint: 0x16181c,
        look: (a, fw, fd, door, h) => { for (let r = 0; r < 9; r++) for (const sx of [-1, 1]) { if (r < 4 && sx < 0 && false) continue; const x = sx * (fw / 2 - 2.2); if (Math.abs(x - door.lx) < door.cw && r < 4) continue; a.box(x, 0.5 + r * 0.7, fd / 2 + 0.1, 3.4, 0.5, 0.08, null, 0x16181c, { glow: 0.1 }); a.box(x - 1.2, 0.65 + r * 0.7, fd / 2 + 0.16, 0.2, 0.14, 0.04, null, r % 3 ? 0x30ff70 : 0xffb020, { glow: 1 }); a.box(x - 0.8, 0.65 + r * 0.7, fd / 2 + 0.16, 0.2, 0.14, 0.04, null, 0x40e0ff, { glow: 1 }); }
            a.box(door.lx, 0, fd / 2 + 0.12, door.cw + 0.5, 2.5, 0.12, null, 0x7fffd0, { glow: 1 }); K.words(a, 'STEP INSIDE THE SERVER', 0, h + 0.8, fd / 2, 11, 1.0, '#7fffd0', 'archivo'); } });
    B.look('inside', a => { const w = B.fw / 2 - 0.5, d = B.fd / 2 - 0.5;
        for (let r = 0; r < 8; r++) for (let k = 0; k < 5; k++) { const x = -w + 1.2 + k * (2 * w - 2.4) / 4; a.box(x, 0.4 + r * 0.75, -d, 2.2, 0.55, 0.3, null, 0x16181c, { glow: 0.1 }); a.box(x - 0.7, 0.58 + r * 0.75, -d + 0.17, 0.16, 0.12, 0.03, null, (r + k) % 4 ? 0x30ff70 : 0xff3050, { glow: 1 }); a.box(x - 0.4, 0.58 + r * 0.75, -d + 0.17, 0.16, 0.12, 0.03, null, 0x40e0ff, { glow: 1 }); }
        K.cable(a, [[-w, 6.2, 0], [w, 6.2, 0]], 0xffe040, 0.1); K.cable(a, [[-w, 6.2, 1], [w, 6.2, 1]], 0xff5fb0, 0.1); K.cable(a, [[-w, 6.2, -1], [w, 6.2, -1]], 0x40e0ff, 0.1);
        a.sign('UPTIME: 99.9%', 0, 5.0, -d + 0.2, 6, 0.8, '#30ff70', '', 'dot', { kind: 'over' }); a.sign('THE OTHER 0.1% IS NOW', 0, 4.2, -d + 0.2, 6, 0.6, '#ff3050', '', 'dot', { kind: 'over' }); });
    B.put('server_rack', -5, 4, { face: 180 }); B.put('server_rack', 5, 4, { face: 180 }); B.put('monitor_stack', 0, -3.5, { face: 0 }); B.native('ai', 2, 0, 180);
};
exports.dress = c => {
    const C = c.C;
    /* the racks: two rows in every block, three racks a row, the cold aisle between them (not on the cooling towers' plot, the bin's block, the login screen) */
    c.plots.forEach(p => { if (p.id === 'P02-00') return;
        BLOCKS.forEach(([x0, x1]) => BLOCKS.forEach(([y0, y1]) => { if (p.id === 'P02-02' && x0 === 7 && y0 === 7) return;
            const ys = y0 === 0 ? [1, 3] : [8, 10];
            if (p.id === 'P00-02') { [x0 + 1, x0 + 3].forEach((x, i) => { for (let y = y0 + 1; y <= y0 + 3; y++) if (c.free(p.id, x, y)) c.P('tape_shelf', p.id, x, y, { face: i ? 270 : 90 }); }); return; }   // THE BACKUP TAPES: shelves, not racks
            ys.forEach((y, i) => { for (let x = x0 + 1; x <= x0 + 3; x++) if (c.free(p.id, x, y)) c.P('server_rack', p.id, x, y, { face: i ? 0 : 180 }); }); })); });
    /* THE CABLE MESS (P01-02): drums, coils, a ladder left up */
    [[2, 2], [9, 2], [2, 9], [9, 9]].forEach(([x, y]) => { if (c.free('P01-02', x, y)) c.P('cable_drum', 'P01-02', x, y, { face: 30 }); });
    c.dec('pipe_run', 'P01-02', 4.4, 7.5); c.dec('pipe_run', 'P01-02', 7.5, 4.4); c.dec('warning_tape', 'P01-02', 7.5, 7.5);
    /* the Login Screen's corner: a terminal, the crash cart */
    c.put('steel_table', 'P00-00', 9, 4); c.dec('crt_terminal', 'P00-00', 9, 4, { y: 0.78 });
    /* the Recycle Bin: crumpled things round its foot */
    [[7.5, 6.6], [10.4, 6.8], [6.7, 10.2]].forEach(([x, y]) => c.dec('cardboard_box', 'P02-02', x, y));
    /* the Uplink (P02-01): the trunk out to the Feed: dishes on the hall's east rim */
    c.put('antenna_dish', 'P02-01', 9, 1, { face: 90 }); c.put('antenna_dish', 'P02-01', 9, 10, { face: 90 });
    /* fire kit and the odd chair along the aisles */
    [['P00-01', 4, 4], ['P01-00', 7, 4], ['P02-01', 4, 7], ['P01-02', 7, 7]].forEach(([id, x, y]) => c.dec('fire_extinguisher', id, x, y));
};
exports.people = c => {
    c.native('ai', 'P00-00', 4, 8, 180); c.native('robot', 'P01-01', 3, 4, 90); c.native('droid', 'P02-01', 8, 4, 270);
    c.native('cyborg', 'P01-00', 8, 2, 180); c.native('glitch', 'P01-02', 3, 8, 45); c.native('mech', 'P02-00', 6, 9, 0);
};
