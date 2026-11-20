/* HELL · D · THE DESCENT (3 plots of room `site_prebuilt_hell_plots`: P01-01 the Descent, P00-02 the Alcove, P00-03 the Ash Flats)
   One thread a file (docs/plans/DISTRICT_THREAD_BRIEF.md); the tool is bake-afterlife.js.
   THE IDEA: the way down. THE DESCENT: the second terrace (8.75 m) and its flights. THE ALCOVE: a hollow in the rim's west wall (squares 2-3 x
   28-31). THE ASH FLATS: a flat of ash on the rim's south-west corner.
   STANDS TODAY (the first build): torches, the stocks, chains in the alcove, skulls in the ash, two people.
   THE LIGHT PASS (2026-11-20, thread 11 of docs/plans/world-polish/WORLD_POLISH_PLAN.md; the plan is docs/plans/world-polish/plans/hell.js,
   approved by mondo 11-20: LIGHT AND LANDMARKS, no ground moves): "colour is the map".
   - THE FLIGHTS' TORCH PAIRS: every flight down into the pit (six of them; the seventh climbs to the Mouth) has a torch on each side of its
     head and of its foot, so a flight reads as a lit gate from across the pit. `exports.flightTorches` stands them; each district calls it for
     the flights on its own squares (the Rim: the north and two south flights; here: the west two; the Bowl: the north one).
   - THE ALCOVE: ONE BLUE FLAME in a stone basin, the only blue in Hell (the room's lights: this is one of the ten).
   - THE ASH FLATS: A RING OF COALS, glowing in the ash, a fire in its middle.
   The torches carry their flame and glow; only the rows marked lit take one of the room's ten point lights (three-renderer.js
   HQ_PROP_LIGHT_MAX): the rest are `noLight`.
   NOT YET: the alcove's shrine, dead trees in the ash (NEEDS A MODEL: a burnt tree), bone drifts, a toll booth at each flight. */
'use strict';
const LAYOUT = require('../layout.json'), HELL = LAYOUT.rooms.find(r => r.key === 'hell');
/* THE FLIGHTS' TORCH PAIRS: for each flight (index into the layout's hell stairs) a torch on the square beside each end of its head and of its foot
   (the head at the flight's top level, the foot at its bottom). A side whose square is not walked or not at that end's level steps one square
   further out; if that fails too, that torch is left out. `lit` = [flight, 'head' | 'foot'] that keeps a point light (one of the room's ten). */
exports.flightTorches = (ctx, which, lit) => { const { P, hh, walk, taken } = ctx;
    which.forEach(i => { const s = HELL.stairs[i]; if (!s) throw new Error('hell: no flight ' + i);
        const ns = s.dir === 'N' || s.dir === 'S';
        const ends = { head: s.dir === 'N' ? s.y0 - 1 : s.dir === 'S' ? s.y1 : s.dir === 'W' ? s.x0 - 1 : s.x1, foot: s.dir === 'N' ? s.y1 : s.dir === 'S' ? s.y0 - 1 : s.dir === 'W' ? s.x1 : s.x0 - 1 };
        ['head', 'foot'].forEach(end => { const lv = end === 'head' ? s.h1 : s.h0, line = ends[end];
            [[ns ? s.x0 - 1 : s.y0 - 1, -1], [ns ? s.x1 : s.y1, 1]].forEach(([side, out], k) => {
                for (let step = 0; step < 2; step++) { const a = side + out * step, x = ns ? a : line, y = ns ? line : a;
                    if (!walk(x, y) || taken.has(x + ':' + y) || Math.abs(hh[y][x] - lv) > 0.6) continue;
                    const on = lit && lit.some(q => q[0] === i && q[1] === end) && k === 0;
                    P('cave_torch', x, y, on ? { glow: { size: 2.4 } } : { noLight: true, glow: { size: 2.4 } }); break; } }); }); }); };
exports.build = ctx => { const { look, gx, gz, mx, mz, hh, wall } = ctx;
    /* the Alcove's basin: a stone bowl on a step, the blue flame in it (square 2,29 / 2,30's line) */
    const bx = gx(3), bz = gz(30), by = hh[30][2];
    look('alcove_basin', bx, bz, 0, by, a => { a.cyl(0, 0, 0, 0.95, 0.35, 'rocks_3', 0x5a4a52); a.cyl(0, 0.35, 0, 0.55, 0.45, 'obsidian', 0x3a3442); a.cyl(0, 0.8, 0, 0.85, 0.22, 'obsidian', 0x2a2632, { r2: 0.6 }); });
    wall(bx - 0.8, bz, bx + 0.8, bz, by, 1.0, { t: 1.6 });
    /* the Ash Flats' ring of coals: fourteen lumps glowing in the ash round a fire, 3.4 m out */
    const cx = gx(8), cz = gz(41), cy = hh[41][7];
    look('ash_coals', cx, cz, 0, cy, a => { for (let i = 0; i < 26; i++) { const t = (i + ((i * 7) % 3) * 0.3) / 26 * Math.PI * 2, r = 3.2 + ((i * 37) % 5) * 0.14, w = 0.22 + ((i * 13) % 4) * 0.07;
        a.cyl(Math.cos(t) * r, -0.04, Math.sin(t) * r, w, 0.14 + ((i * 7) % 3) * 0.05, 'rocks_3', i % 3 ? 0xff5a18 : 0xffa040, { glow: 1, r2: w * 0.7, seg: 6 }); }
        a.cyl(0, 0, 0, 1.2, 0.18, 'rocks_3', 0x3a2a26); });
};
exports.dress = ctx => { const { P, at, gx, gz, hh } = ctx;
    [[15, 14], [20, 13], [13, 22], [9, 32], [10, 34]].forEach(q => P('cave_torch', q[0], q[1], { noLight: true })); P('stocks', 16, 16, { face: 180 }); P('wall_chains', 2, 28); P('wall_chains', 2, 31);
    [[4, 38], [10, 41], [5, 44], [10, 37]].forEach(q => P('skull_pile', q[0], q[1])); P('psxg_tombstone_1', 4, 41, { face: 160 }); P('psxg_tombstone_3', 9, 45, { face: 200 });
    /* THE FLIGHTS: the west flight down from the rim (layout stair 3) and the flight from the terrace to the bowl (stair 4); the west flight's
       head keeps a light: the head of the Descent */
    exports.flightTorches(ctx, [3, 4], [[3, 'head']]);
    /* THE ALCOVE'S BLUE FLAME (one of the room's ten lights) */
    at('hearth_fire_blue', gx(3), gz(30), { y: hh[30][2] + 0.95, w: 0.9, h: 1.3, noSeat: true });
    at('light_glow', gx(3), gz(30), { y: hh[30][2] + 0.4, noLight: true, noSeat: true, glow: { y: 1.4, size: 6, color: 0x4a7aff } });
    /* THE ASH FLATS' RING OF COALS: a fire in the middle (no light of its own: the coals and the glow carry it) */
    at('hearth_fire', gx(8), gz(41), { y: hh[41][7] + 0.18, w: 1.4, h: 1.2, noLight: true, noSeat: true });
    at('light_glow', gx(8), gz(41), { y: hh[41][7] + 0.2, noLight: true, noSeat: true, glow: { y: 0.6, size: 9, color: 0xff4a14 } });
};
exports.people = ctx => { const { native } = ctx; native('halfdemon', 18, 15, 180); native('undead', 6, 39, 90); };
