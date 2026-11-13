/* DISASTER CITY · CIVIC CENTER (district C, plots x 4..7 · y 0..3) — every building designed as a list of parts (2026-11-13, mondo: "Every
   building should be unique and purposeful and recognizable ... like how a disney theme park designer would"; his OK on the mock-up 17:11).
   Repo tooling only: bake-disaster-city.js calls `apply(ctx)` right after its own building loop. Notes: docs/notes/areas-complexes.md
   "DISASTER CITY, CIVIC CENTER".

   Authoring frame: LOCAL METRES inside a plot, x east, z south, 0..42 (a plan cell = 3.5 m), y up. One `B(i, spec, fn)` per building
   (i = its index in the plan's plot.buildings, null = a thing the plan has no building for). The look becomes ONE `arch` row per building
   (drawn only); the walker's rows are the tool's own, their faces switched off:
     spec.solids  [{ r: [x0, z0, x1, z1], st, door: { side, at } }]  texbuildings with skin: false (the first replaces the tool's row and
                  keeps its id); `door` = a walk-in inside with the city's swinging double door, `at` = where along that face (local m)
     spec.st      storeys of the tool's own row when no solids are given (its roof slab must hide under the drawn roof)
     a roof-route building keeps the tool's walked tier (bld.skin false) whatever the spec says
     spec.ghost   [[x0, z0, x1, z1, top]]  unseen walls (columns, a pavilion on a walked roof)
     spec.cells   [[cx, cy]]  plot squares the dressing must leave clear */
'use strict';
const C = 3.5, N = 12;
const WR = 'u_DecalWindowsResidential1a', WR2 = 'u_DecalWindowsResidential2a';
const STONE = 'marble_light', ALU = 'aluminium', DARK = 0x20252c, VERD = 0x8fe0c4, SLATE = 0xa8b3c4, GOLD = 0xf0c858;
const PLOTS = [];
let cur = null, bld = null;
const plot = (px, py, fn) => { cur = { px, py, b: [] }; PLOTS.push(cur); fn(); };
const B = (i, spec, fn) => { bld = Object.assign({ i, parts: [], ghost: [], cells: [] }, spec || {}); cur.b.push(bld); fn(); };
const push = p => { bld.parts.push(p); return p; };
const box = (x0, z0, x1, z1, y0, y1, key, tint, o) => push({ t: 'box', x0, z0, x1, z1, y0, y1, key, tint, o: o || {} });
const cyl = (x, z, r, y0, y1, key, tint, o) => push({ t: 'cyl', x, z, r, y0, y1, key, tint, o: o || {} });
const cone = (x, z, r, y0, h, key, tint, o) => push({ t: 'cyl', x, z, r, y0, y1: y0 + h, key, tint, o: Object.assign({ cone: true }, o) });
const dome = (x, z, r, y0, h, key, tint, o) => push({ t: 'dome', x, z, r, y0, h, key, tint, o: o || {} });
const roof = (shape, x0, z0, x1, z1, y0, h, key, tint, o) => push({ t: 'roof', shape, x0, z0, x1, z1, y0, h, key, tint, o: o || {} });
const vault = (x0, z0, x1, z1, y0, h, key, tint, o) => push({ t: 'roof', shape: 'barrel', x0, z0, x1, z1, y0, h, key, tint, o: o || {} });
const door = (x, z, face) => push({ t: 'door', x, z, face });                       // a drawn (shut) door on a building with no inside
const ring = (n, cx, cz, R, r, y0, y1, key, tint) => { for (let i = 0; i < n; i++) { const a = i * 2 * Math.PI / n; cyl(cx + R * Math.sin(a), cz + R * Math.cos(a), r, y0, y1, key, tint, { seg: 8 }); } };
const flag = (x, z, h, tint) => { cyl(x, z, 0.09, 0, h, ALU, 0xdddddd, { seg: 6 }); box(x + 0.1, z - 0.03, x + 2.3, z + 0.03, h - 1.6, h - 0.2, null, tint); };
const face = (x, z, r, y, side) => { const t = 0.12; if (side === 'W' || side === 'E') box(x - t, z - r, x + t, z + r, y - r, y + r, null, 0xfdfbf2); else box(x - r, z - t, x + r, z + t, y - r, y + r, null, 0xfdfbf2); };   // a clock's face (a square dial)

/* ───────── row 0 ───────── */
plot(4, 0, () => { const RED = 0xe0604a;
    B(0, { solids: [{ r: [7, 7, 35, 35], st: 2, door: { side: 'E', at: 22 } }], cells: [[4, 10], [4, 11], [8, 10]] }, () => {                    // FIRE STATION
        box(7, 7, 26, 14, 0, 7.15, 'bricks_1', RED, { win: WR }); box(6.8, 6.8, 26.2, 14.2, 7.15, 7.6, STONE);                                    // the rear block
        box(7, 14, 26, 35, 0, 8.4, 'bricks_1', RED); box(6.7, 13.7, 26.3, 35.3, 8.4, 9.0, STONE); box(7.2, 14.2, 25.8, 34.8, 9.0, 9.7, 'bricks_1', RED, { top: 1 });   // the apparatus hall
        [10.3, 16.5, 22.7].forEach(xc => {                                                                                                          // three arched engine bays
            box(xc - 2.3, 34.9, xc + 2.3, 35.18, 0, 4.3, 'u_MetalCorrugatedPainted1a', 0xffffff); vault(xc - 2.3, 34.9, xc + 2.3, 35.18, 4.3, 2.3, 'u_MetalCorrugatedPainted1a', 0xffffff, { axis: 'z' });
            box(xc - 2.75, 34.95, xc - 2.3, 35.3, 0, 4.3, STONE); box(xc + 2.3, 34.95, xc + 2.75, 35.3, 0, 4.3, STONE); });
        box(26, 7, 35, 35, 0, 10.5, 'bricks_1', RED, { win: WR });                                                                                  // the crew quarters
        box(25.85, 6.85, 35.15, 35.15, 3.35, 3.7, STONE); roof('hip', 26, 7, 35, 35, 10.5, 3.4, ALU, SLATE, { axis: 'z', over: 0.8 });
        box(7, 7, 12, 12, 0, 15.4, 'bricks_1', RED); box(6.6, 6.6, 12.4, 12.4, 15.4, 15.9, STONE);                                                  // the hose tower
        box(7.4, 7.4, 11.6, 11.6, 15.9, 18.8, 'u_MetalSubwayGrill1a', 0xb0b0b0); [[7, 7], [11.2, 7], [7, 11.2], [11.2, 11.2]].forEach(c => box(c[0], c[1], c[0] + 0.8, c[1] + 0.8, 15.9, 18.8, 'bricks_1', RED));
        box(6.5, 6.5, 12.5, 12.5, 18.8, 19.4, STONE); roof('pyr', 6.3, 6.3, 12.7, 12.7, 19.4, 4.6, ALU, VERD); cyl(9.5, 9.5, 0.08, 24, 27, ALU, null, { seg: 6 });
        box(35, 18.5, 37.2, 25.5, 3.1, 3.4, STONE); cyl(36.9, 18.9, 0.12, 0, 3.1, ALU); cyl(36.9, 25.1, 0.12, 0, 3.1, ALU); flag(30.5, 37, 9, 0xc8523f); }); });

plot(5, 0, () => {
    B(0, { solids: [{ r: [25.7, 11.7, 33.8, 23.3], st: 1, door: { side: 'W', at: 17.5 } }] }, () => {                                               // CIVIL RECORDS: a blind vault over a glass foot
        box(25.7, 11.7, 33.8, 23.3, 0, 3.6, 'u_GlassWindowSquare2a', 0x8c9aa8, { top: 1 });
        [[24.7, 10.7], [34.3, 10.7], [24.7, 24.3], [34.3, 24.3]].forEach(c => cyl(c[0], c[1], 0.45, 0, 3.6, 'u_ConcreteStriped2c', 0xffffff, { seg: 10 }));
        box(24, 10, 35.5, 25, 3.6, 12.8, 'u_ConcreteStriped2c', 0xffffff, { under: 1 });
        for (let z = 11.4; z < 24; z += 2.1) box(23.9, z, 24.0, z + 0.45, 5, 11.6, null, DARK); for (let x = 25.2; x < 35; x += 2.1) box(x, 25.0, x + 0.45, 25.1, 5, 11.6, null, DARK);
        for (let i = 0; i < 3; i++) { const z0 = 10.6 + i * 4.7; roof('shed', 24.8, z0, 34.7, z0 + 4.3, 12.8, 1.9, ALU, 0xcfd6dc, { high: 'N' }); box(24.9, z0, 34.6, z0 + 0.08, 12.8, 14.6, 'u_GlassWindowFactory1a', 0xdff0ff); } });
    B(1, { st: 2 }, () => {                                                                                                                          // NOTARY + COPIES
        box(3.5, 28, 17.5, 42, 0, 7.1, 'u_PlasterWallStucco1a', 0xfff0c8, { win: WR2, winY0: 3.5 });
        box(4.2, 27.9, 9.4, 28, 0.5, 3.0, 'u_GlassWindowResidential1a'); box(11.6, 27.9, 16.8, 28, 0.5, 3.0, 'u_GlassWindowResidential1a'); roof('shed', 3.5, 26.2, 17.5, 28, 2.9, 0.9, 'u_MetalCorrugatedPainted4a', 0xd0ffd8, { high: 'S' });
        box(3.3, 27.8, 17.7, 42, 7.1, 7.6, STONE, 0xe8dcc0); box(8, 27.8, 13, 28.4, 7.6, 8.9, STONE, 0xe8dcc0); door(10.5, 28, 'N'); });
    B(2, { st: 1 }, () => {                                                                                                                          // SIGN WORKSHOP: a saw-tooth shed
        box(7, 0, 17.5, 17.5, 0, 5.5, 'u_MetalCorrugatedPainted1a', 0xc8dcff);
        for (let i = 0; i < 3; i++) { const z0 = i * 5.83; roof('shed', 7, z0, 17.5, z0 + 5.83, 5.5, 2.3, 'u_MetalCorrugatedPainted1a', 0xb0c8f0, { high: 'N' }); box(7.1, z0, 17.4, z0 + 0.08, 5.5, 7.7, 'u_GlassWindowFactory1a', 0xdff0ff); }
        box(9.6, 17.45, 15, 17.62, 0, 4, ALU, 0xd0d4d8); }); });

plot(6, 0, () => { const M = 0xfff8ea;
    B(0, { solids: [{ r: [7, 7, 35, 31.5], st: 4, door: { side: 'S', at: 21 } }], cells: [[3, 9], [4, 9], [5, 9], [6, 9], [7, 9], [8, 9], [2, 10], [9, 10]],
        ghost: [0, 1, 2, 3, 4, 5].map(i => [12.5 + i * 3.2, 33.1, 13.5 + i * 3.2, 33.1, 4]) }, () => {                                              // CITY HALL
        box(7, 7, 35, 31.5, 0, 4, 'u_ConcreteStriped1a', 0xf0e8d8);                                                                                 // the rusticated ground storey
        box(7.5, 7.5, 34.5, 31, 4, 14, STONE, M, { win: WR }); box(6.6, 6.6, 35.4, 31.9, 14, 14.7, STONE); box(7.2, 7.2, 34.8, 31.3, 14.7, 15.6, STONE, M, { top: 1 });
        [[7, 7], [29.5, 7], [7, 26], [29.5, 26]].forEach(c => { box(c[0] - 0.4, c[1] - 0.4, c[0] + 5.9, c[1] + 5.9, 0, 16.6, STONE, M, { win: WR, winY0: 4 }); roof('pyr', c[0] - 0.8, c[1] - 0.8, c[0] + 6.3, c[1] + 6.3, 16.6, 2.8, ALU, VERD); });
        box(11.5, 31.5, 30.5, 34.4, 0, 0.1, STONE, 0xe9e4da);                                                                                        // the portico's paving (the stair of the mock-up is level ground here)
        for (let i = 0; i < 6; i++) { const x = 13 + i * 3.2; cyl(x, 33.1, 0.62, 0.5, 12.1, STONE, M, { seg: 14 }); box(x - 0.8, 32.3, x + 0.8, 33.9, 0.1, 0.5, STONE); box(x - 0.8, 32.3, x + 0.8, 33.9, 12.1, 12.5, STONE); }
        box(11.8, 31.4, 30.2, 34, 12.5, 13.9, STONE, M, { under: 1 }); roof('gable', 11.5, 31.3, 30.5, 34.2, 13.9, 3.3, STONE, M, { axis: 'z' });
        cyl(21, 19, 7, 15.6, 21.6, STONE, M, { seg: 28 }); ring(16, 21, 19, 7.75, 0.32, 15.6, 20.7, STONE, M); cyl(21, 19, 8.3, 20.7, 21.3, STONE, null, { seg: 28 }); cyl(21, 19, 6.5, 21.3, 22.8, STONE, M, { seg: 28 });
        dome(21, 19, 6.5, 22.8, 7.6, ALU, VERD); cyl(21, 19, 1.3, 30.1, 32.4, STONE, M, { seg: 12 }); dome(21, 19, 1.5, 32.4, 1.7, ALU, VERD); cone(21, 19, 0.28, 34, 2.6, 'gold', null, { seg: 8 });
        flag(10, 37, 10, 0x2a56b0); flag(32, 37, 10, 0xb03a2a); }); });

plot(7, 0, () => {
    B(0, { solids: [{ r: [10.5, 7.6, 24, 17.5], st: 2, door: { side: 'S', at: 17 } }, { r: [25.8, 8.4, 33.4, 16.1], st: 2 }] }, () => {              // COUNCIL ANNEX: a glass bar + the round chamber
        box(10.5, 7.6, 24, 17.5, 0, 10.5, 'u_GlassWindowSquare2a', 0xb8f0e4, { top: 1 });
        [3.5, 7].forEach(y => box(10.2, 7.3, 24.3, 17.8, y - 0.12, y + 0.12, STONE)); box(9.2, 6.3, 25.2, 18.6, 10.5, 10.95, STONE, null, { under: 1 });
        cyl(29.6, 12.25, 5.5, 0, 9, 'u_PlasterWallPainted1a', 0xf0c498, { seg: 28 });
        ring(14, 29.6, 12.25, 6.15, 0.17, 0, 10.4, STONE, null); cyl(29.6, 12.25, 5.0, 9, 10.4, 'u_GlassWindowSquare1a', 0xdff4ff, { seg: 28 }); cyl(29.6, 12.25, 6.7, 10.4, 10.8, STONE, null, { seg: 28 }); dome(29.6, 12.25, 5.3, 10.8, 1.9, ALU, 0xd89058); });
    B(1, { st: 2 }, () => {                                                                                                                          // THE MAYOR'S HOUSE
        box(24.5, 21, 42, 42, 0, 7.4, 'bricks_2', 0xffc8a0, { win: WR }); roof('gable', 24.5, 21, 42, 42, 7.4, 4.4, ALU, SLATE, { axis: 'z', over: 0.5 });
        box(27, 24, 28.2, 25.2, 7.4, 12.8, 'bricks_2', 0xd8987c); box(37.8, 36, 39, 37.2, 7.4, 12.8, 'bricks_2', 0xd8987c);
        box(22.3, 27.5, 24.5, 32, 0, 0.12, STONE); cyl(22.7, 27.9, 0.22, 0.12, 3.4, STONE, null, { seg: 10 }); cyl(22.7, 31.6, 0.22, 0.12, 3.4, STONE, null, { seg: 10 }); box(22.1, 27.3, 24.5, 32.2, 3.4, 3.8, STONE); roof('gable', 22.1, 27.3, 24.5, 32.2, 3.8, 1.2, STONE, null, { axis: 'x' });
        door(24.5, 29.75, 'W'); }); });

/* ───────── row 1: the avenue ───────── */
plot(4, 1, () => { const G = 0xd8e6f4;
    B(0, { solids: [{ r: [7, 3.5, 17.5, 10.5], st: 2 }, { r: [4.2, 4.4, 7, 9.6], st: 2 }] }, () => {                                                // DISPATCH: a round-nosed bunker + the radio mast
        box(7, 3.5, 17.5, 10.5, 0, 7, 'u_ConcreteStriped1c', G); cyl(7, 7, 3.5, 0, 7, 'u_ConcreteStriped1c', G, { seg: 24 });
        box(6.95, 3.42, 17.58, 10.58, 4.3, 5.7, 'u_GlassWindowSquare1a', 0xb8e4ff); cyl(7, 7, 3.58, 4.3, 5.7, 'u_GlassWindowSquare1a', 0xb8e4ff, { seg: 24 });
        box(6.5, 2.9, 18.1, 11.1, 7, 7.35, STONE, null, { under: 1 }); cyl(7, 7, 4.1, 7, 7.35, STONE, null, { seg: 24 });
        box(14.2, 6.2, 15.4, 7.4, 7.35, 27, 'u_MetalTruss1a', 0xff6a58, { alpha: 1 }); dome(14.8, 6.8, 0.4, 27, 0.55, null, 0xff3030, { glow: 1 });
        cyl(10.5, 5.6, 0.08, 7.35, 8.7, ALU, null, { seg: 6 }); cone(10.5, 5.6, 1.2, 8.7, 0.7, ALU, null, { inv: true }); cyl(8.2, 8.6, 0.08, 7.35, 8.3, ALU, null, { seg: 6 }); cone(8.2, 8.6, 0.9, 8.3, 0.55, ALU, null, { inv: true });
        door(17.5, 7, 'E'); });
    B(1, { solids: [{ r: [26, 3.5, 37, 9], st: 1 }] }, () => {                                                                                       // COFFEE + DONUTS: a cup on the roof
        box(26, 3.5, 37, 9, 0, 3.6, 'u_PlasterWallStucco1a', 0xffc8d8); box(27, 8.95, 34, 9.06, 1.1, 2.9, 'u_GlassWindowResidential1a');
        box(24.8, 3, 38.2, 11.7, 3.6, 3.9, STONE, 0xfff3e0, { under: 1 }); cyl(31.5, 6, 1.3, 3.9, 6.6, STONE, 0xffffff, { r2: 1.75 }); cyl(31.5, 6, 1.6, 6.45, 6.62, null, 0x5a3a22); door(35.6, 9, 'S'); }); });

plot(5, 1, () => {
    B(0, { st: 1 }, () => {                                                                                                                          // CITY MOTOR POOL
        box(3.5, 3.5, 17.5, 10.5, 0, 5, 'u_MetalCorrugatedPainted3a', 0xfff0c0); roof('shed', 3.5, 3.5, 17.5, 10.5, 5, 1.9, 'u_MetalCorrugatedPainted1a', 0xc0c4cc, { high: 'N', over: 0.7 });
        [6, 10.5, 15].forEach(xc => box(xc - 1.9, 10.45, xc + 1.9, 10.62, 0, 3.8, ALU, 0xd0d4d8)); cyl(5.5, 5.5, 0.5, 6, 7.6, ALU, null, { seg: 8 }); cyl(12, 5.5, 0.5, 6, 7.6, ALU, null, { seg: 8 }); door(17.5, 7, 'E'); });
    B(1, { solids: [{ r: [26.2, 4.7, 30.8, 9.3], st: 1 }, { r: [33, 4.5, 38, 9], st: 1 }] }, () => {                                                 // NEWSSTAND + FLOWERS
        cyl(28.5, 7, 3.2, 0, 3.4, 'u_PlasterWallPainted1a', 0x58b884, { seg: 8 }); cone(28.5, 7, 4.3, 3.4, 2.3, ALU, 0x5cb08c, { seg: 8 }); dome(28.5, 7, 0.5, 5.6, 0.6, 'gold', null);
        box(33, 4.5, 38, 9, 0, 3, 'u_ConcreteStriped1c', 0xf0c088); roof('shed', 32.4, 4, 38.5, 10.6, 3, 0.9, 'u_MetalCorrugatedPainted2a', 0xffffff, { high: 'N' }); }); });

plot(6, 1, () => {
    B(null, { ghost: [[6.8, 35, 14.2, 35, 0.6], [25.4, 33.25, 27.1, 33.25, 3]], cells: [[2, 9], [3, 9], [2, 10], [3, 10], [7, 9]] }, () => {         // CIVIC PLAZA: the bandstand + the plaza clock
        cyl(10.5, 35, 3.7, 0, 0.3, STONE, null, { seg: 16 }); ring(8, 10.5, 35, 3.1, 0.18, 0.3, 3.8, STONE); cyl(10.5, 35, 3.8, 3.8, 4.15, STONE, null, { seg: 16 }); dome(10.5, 35, 3.6, 4.15, 1.9, ALU, VERD); cone(10.5, 35, 0.15, 6.05, 1.2, 'gold', null, { seg: 6 });
        box(25.35, 32.35, 27.15, 34.15, 0, 6.5, STONE, 0xf1ece0); face(26.25, 34.2, 0.7, 5.35, 'S'); face(26.25, 32.3, 0.7, 5.35, 'N'); roof('pyr', 25.05, 32.05, 27.45, 34.45, 6.5, 1.4, ALU, VERD); }); });

plot(7, 1, () => { const CR = 0xfff4dc;
    B(0, { solids: [{ r: [3.5, 3.5, 17.5, 8.6], st: 3, door: { side: 'S', at: 10.5 } }], ghost: [0, 1, 2, 3, 4, 5].map(i => [4.1 + i * 2.4, 9.4, 4.9 + i * 2.4, 9.4, 4]) }, () => {   // COURTHOUSE: a temple
        box(3.5, 3.5, 17.5, 8.6, 0, 11.5, STONE, CR, { win: WR, winY0: 3.5 }); box(3.5, 8.6, 17.5, 10.3, 0, 0.1, STONE, 0xe4ddd0);
        for (let i = 0; i < 6; i++) cyl(4.5 + i * 2.4, 9.4, 0.5, 0.1, 10, STONE, CR, { seg: 12 });
        box(3.5, 8.6, 17.5, 10.1, 10, 11.5, STONE, CR, { under: 1 }); box(3.2, 3.2, 17.8, 10.4, 11.5, 12.7, STONE, CR); roof('gable', 3.0, 3.0, 18.0, 10.6, 12.7, 3.1, STONE, CR, { axis: 'z' }); });
    B(1, { solids: [{ r: [24.5, 3.5, 38.5, 10], st: 1 }] }, () => {                                                                                   // COURT CAFE: a roof terrace
        box(24.5, 3.5, 38.5, 10, 0, 3.8, 'bricks_3', 0xffb090); box(26, 9.95, 30.4, 10.06, 0.8, 3.0, 'u_GlassWindowResidential1a'); box(32.6, 9.95, 37, 10.06, 0.8, 3.0, 'u_GlassWindowResidential1a'); roof('shed', 24.5, 10, 38.5, 11.7, 2.8, 0.8, 'u_MetalCorrugatedPainted1a', 0xb0d0ff, { high: 'N' });
        box(24.3, 3.3, 38.7, 10.2, 3.8, 4.05, STONE); box(24.5, 9.95, 38.5, 10.05, 4.05, 5.0, 'u_MetalTruss4a', 0x8a8a8a, { alpha: 1 });
        [28, 34].forEach(x => { cyl(x, 6.6, 0.06, 4.05, 6.4, ALU, null, { seg: 6 }); cone(x, 6.6, 1.6, 6.2, 0.8, null, 0xd94f4f, { seg: 8 }); }); door(31.5, 10, 'S'); }); });

/* ───────── row 2 ───────── */
plot(4, 2, () => { const PB = 0xb4c4f0;
    B(0, { solids: [{ r: [3.5, 7, 14, 26], st: 3, door: { side: 'E', at: 16.5 } }, { r: [3.5, 26, 14, 31.5], st: 1 }], cells: [[4, 2], [4, 6]] }, () => {   // POLICE
        box(3.5, 7, 14, 26, 0, 10.6, 'bricks_1', PB, { win: WR2 }); box(3.3, 6.8, 14.2, 26.2, 10.6, 11.0, STONE); box(3.6, 7.1, 13.9, 25.9, 11.0, 11.7, 'bricks_1', PB, { top: 1 });
        box(14, 13, 15.2, 15.4, 0, 12.4, STONE, 0xe8e4da); box(14, 17.6, 15.2, 20, 0, 12.4, STONE, 0xe8e4da); box(14, 15.4, 15.2, 17.6, 2.9, 12.4, STONE, 0xe8e4da, { under: 1 });   // the stepped stone entrance bay: two piers + the head
        box(14, 14.5, 15.2, 18.5, 12.4, 13.6, STONE, 0xe8e4da); box(14, 15.7, 15.2, 17.3, 13.6, 14.7, STONE, 0xe8e4da);
        [14.0, 19.0].forEach(z => { cyl(15.6, z, 0.08, 0, 2.5, null, 0x222222, { seg: 6 }); dome(15.6, z, 0.32, 2.5, 0.5, null, 0x2f8cff, { glow: 1 }); });                             // the blue lamps
        box(3.5, 26, 14, 31.5, 0, 4.5, 'bricks_1', PB); box(13.95, 27, 14.12, 30.6, 0, 3.6, ALU, 0x5a7ad0); box(3.3, 25.9, 14.2, 31.7, 4.5, 4.9, STONE);                                 // the sally port
        cyl(6, 10, 0.07, 11.7, 19, ALU, null, { seg: 6 }); box(8, 20, 11, 23, 11.0, 12.3, ALU); });
    B(1, { st: 3 }, () => { const BR = 0xffc8a8;                                                                                                     // BROWNSTONE WALK-UP
        box(28, 3.5, 38.5, 17.5, 0, 10.6, 'bricks_3', BR, { win: WR }); box(27.6, 3.1, 38.9, 17.9, 10.6, 11.2, 'u_ConcreteStriped1a', 0xa07050);
        cyl(28, 7.5, 1.8, 0, 9, 'bricks_3', BR, { seg: 12 }); cone(28, 7.5, 2.1, 9, 1.2, ALU, SLATE, { seg: 12 }); box(26.6, 12, 28, 14.5, 0, 0.12, STONE); door(28, 13.25, 'W'); }); });

plot(5, 2, () => { const HG = 0xe8ecf0;
    B(0, { ghost: [[8, 29, 20, 29, 9.8], [8, 40, 20, 40, 9.8], [8, 29, 8, 40, 9.8], [20, 29, 20, 34, 9.8]], cells: [[5, 7]] }, () => {               // HOLDING ANNEX (a roof-route tier): blind walls, a caged roof yard, the guard tower
        box(7, 28, 21, 42, 0, 7, 'u_ConcreteStriped1a', HG, { top: 0 }); for (let x = 8.2; x < 20; x += 2.2) box(x, 27.9, x + 0.5, 28, 4.3, 5.6, null, DARK);
        box(8, 29, 20, 40, 7.05, 9.8, 'u_MetalTruss4a', 0xc0c4cc, { alpha: 1, top: 0 });
        box(18.2, 25, 21, 28, 0, 10, 'u_ConcreteStriped1a', HG); box(17.5, 24.3, 21.7, 28.7, 10, 12.4, 'u_GlassWindowSquare1a', 0xc8e8f4, { under: 1 }); roof('pyr', 17.1, 23.9, 22.1, 29.1, 12.4, 1.7, ALU, SLATE);
        box(11, 27.85, 13, 28, 0, 2.6, ALU, 0x5a6470); });
    B(1, {}, () => {                                                                                                                                  // BAIL BONDS (a roof-route tier)
        box(24.5, 10.5, 35, 24.5, 0, 7, 'u_PlasterWallPainted1d', 0xffe070, { win: WR2, winY0: 3.5, top: 0 }); box(24.4, 12, 24.5, 16.4, 0.5, 3.0, 'u_GlassWindowResidential1a'); box(24.4, 18.6, 24.5, 23, 0.5, 3.0, 'u_GlassWindowResidential1a');
        roof('shed', 22.9, 11.5, 24.5, 23.5, 2.9, 0.8, 'u_MetalCorrugatedPainted1a', 0x505050, { high: 'E' }); box(24.6, 11.5, 24.9, 23.5, 7.8, 10.4, null, 0xd9382e); cyl(24.75, 12.5, 0.1, 7, 7.8, ALU); cyl(24.75, 22.5, 0.1, 7, 7.8, ALU); door(24.5, 17.5, 'W'); });
    B(2, { st: 1 }, () => {                                                                                                                          // IMPOUND GARAGE
        box(3.5, 0, 17.5, 14, 0, 5.2, 'u_MetalCorrugatedPainted2a', 0xffd0c0); roof('shed', 3.5, 0, 17.5, 14, 5.2, 2.4, 'u_MetalCorrugatedPainted1a', 0xb0b4bc, { high: 'N', over: 0.5 });
        [7, 14].forEach(xc => box(xc - 2.2, 13.95, xc + 2.2, 14.12, 0, 3.9, ALU, 0xd0d4d8)); }); });

plot(6, 2, () => { const SG = 0xfff6e4, GL = 'u_GlassWindowSquare1b';
    B(0, { ghost: [[13, 13, 29, 13, 10], [13, 29, 29, 29, 10], [13, 13, 13, 29, 10], [29, 13, 29, 29, 10]] }, () => {                                // RECORDS GARDEN (a roof-route tier): a stone arcade, a glasshouse on the terrace
        box(7, 7, 35, 35, 0, 0.8, STONE, SG, { top: 0 }); box(7.3, 7.3, 34.7, 34.7, 0.8, 6, 'u_GlassWindowTall1a', 0xe8fff4, { top: 0 }); box(7, 7, 35, 35, 6, 7, STONE, SG, { top: 0 });
        for (let i = 0; i <= 8; i++) { const p = 7 + i * 3.5; box(p - 0.5, 6.85, p + 0.5, 7.4, 0, 6, STONE, SG); box(p - 0.5, 34.6, p + 0.5, 35.15, 0, 6, STONE, SG); box(6.85, p - 0.5, 7.4, p + 0.5, 0, 6, STONE, SG); box(34.6, p - 0.5, 35.15, p + 0.5, 0, 6, STONE, SG); }
        [[7, 7, 35, 7.35], [7, 34.65, 35, 35], [7, 7, 7.35, 35], [34.65, 7, 35, 35]].forEach(b => box(b[0], b[1], b[2], b[3], 7, 7.9, STONE));
        box(13, 13, 29, 29, 7.05, 10, GL, 0xe0fff4, { top: 0 }); vault(12.6, 15.5, 29.4, 26.5, 10, 5.5, GL, 0xe0fff4, { axis: 'x' }); vault(15.5, 12.6, 26.5, 29.4, 10, 5.5, GL, 0xe0fff4, { axis: 'z' });
        cyl(21, 21, 4.3, 14.6, 16.3, STONE, null, { seg: 20 }); dome(21, 21, 4.2, 16.3, 3.5, GL, 0xe0fff4); cone(21, 21, 0.2, 19.8, 1.6, 'gold', null, { seg: 6 });
        [[10, 10], [32, 10], [10, 32], [32, 32]].forEach(c => { cyl(c[0], c[1], 1.1, 7.05, 7.9, STONE); cyl(c[0], c[1], 0.18, 7.9, 9.6, 'u_ConcreteStriped1a', 0xa07050, { seg: 6 }); dome(c[0], c[1], 1.5, 9.4, 2.2, null, 0x4f8a45); });
        door(21, 7, 'N'); door(35, 21, 'E'); }); });

plot(7, 2, () => { const BZ = 0xf0c890;
    B(0, { solids: [{ r: [24.5, 3.5, 35, 20], st: 4, door: { side: 'W', at: 12 } }, { r: [26.5, 20.75, 33, 27.25], st: 5 }] }, () => {               // TIME BUREAU: a bronze glass slab + the clock drum
        box(24.5, 3.5, 35, 20, 0, 17.5, 'u_GlassWindowTall3a', BZ, { top: 1 }); [3.5, 7, 10.5, 14, 17.5].forEach(y => box(23.9, 2.9, 35.6, 20.3, y - 0.15, y + 0.15, STONE, null, { under: 1 }));
        cyl(29.75, 24, 4.6, 0, 24, STONE, 0xfffaf0, { seg: 28 }); cyl(29.75, 24, 5.4, 19, 19.5, STONE, null, { seg: 28 });
        face(25.1, 24, 2.0, 22, 'W'); box(24.9, 23.9, 24.97, 24.1, 22, 23.7, null, DARK); box(24.9, 24, 24.97, 25.3, 21.9, 22.1, null, DARK);
        face(29.75, 28.65, 2.0, 22, 'S'); box(29.65, 28.78, 29.85, 28.85, 22, 23.7, null, DARK); box(28.5, 28.78, 29.75, 28.85, 21.9, 22.1, null, DARK);
        cyl(29.75, 24, 5.0, 24.2, 24.6, STONE, null, { seg: 28 }); cone(29.75, 24, 5.0, 24.6, 2.4, 'gold', null, { seg: 28 }); dome(29.75, 24, 0.6, 27, 0.9, 'gold', null);
        roof('shed', 29.2, 5, 30.3, 18, 17.65, 6.5, 'gold', null, { high: 'N' }); });                                                                    // the sundial's gnomon
    B(1, { solids: [{ r: [4.5, 26, 16.5, 37.5], st: 1 }] }, () => {                                                                                   // THE WATCHMAKER'S HOUSE
        box(4.5, 26, 16.5, 37.5, 0, 6.2, 'u_PlasterWallStucco1a', 0xfff4e0, { win: WR }); [[4.4, 25.9], [16.3, 25.9], [4.4, 37.3], [16.3, 37.3]].forEach(c => box(c[0], c[1], c[0] + 0.3, c[1] + 0.3, 0, 6.2, 'u_ConcreteStriped1a', 0xa07050));
        box(4.4, 25.9, 16.6, 37.6, 3.0, 3.25, 'u_ConcreteStriped1a', 0xa07050); roof('gable', 4.5, 26, 16.5, 37.5, 6.2, 6, ALU, 0xd06048, { axis: 'x', over: 0.6 });
        face(3.85, 31.75, 1.0, 8.7, 'W'); box(13, 28, 14.2, 29.2, 6.2, 12, 'bricks_2', 0xd8987c); door(10.5, 26, 'N'); }); });

/* ───────── row 3 ───────── */
plot(4, 3, () => {
    B(null, { ghost: [[7, 6.5, 14, 6.5, 1.1], [7, 11, 14, 11, 1.1], [7, 6.5, 7, 11, 1.1], [18.6, 8.65, 19.3, 8.65, 3], [28.7, 6, 34.3, 6, 3.6], [28.7, 11.5, 34.3, 11.5, 3.6], [28.7, 6, 28.7, 11.5, 3.6], [34.3, 6, 34.3, 11.5, 3.6]],
        cells: [[1, 1], [2, 1], [3, 1], [4, 1], [1, 2], [2, 2], [3, 2], [4, 2], [1, 3], [2, 3], [3, 3], [4, 3], [8, 1], [9, 1], [8, 2], [9, 2], [8, 3], [9, 3], [1, 7], [10, 7], [1, 10], [10, 10]] }, () => {   // TRANSIT SQUARE: the metro entrance, the ticket rotunda, the bus terminal's roof
        [4.5, 10.5, 16.5].forEach(x => [4.5, 13].forEach(z => cyl(x, z, 0.16, 0, 3.2, ALU, 0x3f8f62, { seg: 8 })));
        box(4, 4.3, 17, 4.7, 3.1, 3.3, ALU, 0x3f8f62); box(4, 12.8, 17, 13.2, 3.1, 3.3, ALU, 0x3f8f62); vault(4, 4, 17, 13.5, 3.3, 2.9, 'u_GlassWindowSquare1b', 0xd8f0ff, { axis: 'x' });
        box(7, 6.5, 14, 11, 0, 0.06, null, 0x15171a); box(7, 6.4, 14, 6.5, 0, 1.1, ALU, 0x3f8f62); box(7, 11, 14, 11.1, 0, 1.1, ALU, 0x3f8f62); box(6.9, 6.4, 7, 11.1, 0, 1.1, ALU, 0x3f8f62);
        box(18.6, 8.3, 19.3, 9, 0, 7, null, 0x2a2d33); box(17.75, 8.2, 20.15, 9.1, 7, 9.4, null, 0xd9382e, { glow: 0.6 });
        cyl(31.5, 8.75, 4, 0, 3.6, 'u_GlassWindowSquare1a', 0xe0f2ff, { seg: 20 }); cyl(31.5, 8.75, 5.2, 3.6, 3.95, STONE, null, { seg: 20 }); dome(31.5, 8.75, 2.4, 3.95, 1.0, ALU, VERD);
        box(4, 25.5, 38, 38, 4.7, 5.05, STONE, null, { under: 1 }); [[5.25, 26.25], [36.75, 26.25], [5.25, 36.75], [36.75, 36.75]].forEach(c => { cyl(c[0], c[1], 0.35, 0, 3.7, 'u_ConcreteStriped1a', 0xffffff, { seg: 10 }); cone(c[0], c[1], 2.3, 3.7, 1.0, 'u_ConcreteStriped1a', 0xffffff, { inv: true, seg: 16 }); }); }); });

plot(5, 3, () => { const LB = 0xf09070, OC = 0xfff8ec;
    B(0, { ghost: [[14.3, 14.3, 27.7, 14.3, 13.5], [14.3, 27.7, 27.7, 27.7, 13.5], [14.3, 14.3, 14.3, 27.7, 13.5], [27.7, 14.3, 27.7, 27.7, 13.5], [35, 15, 36.6, 15, 8], [35, 27, 36.6, 27, 8]], cells: [[10, 4], [10, 7]] }, () => {   // PUBLIC LIBRARY (a roof-route tier)
        box(7, 7, 35, 35, 0, 7, 'bricks_2', LB, { win: WR, top: 0 }); box(6.9, 6.9, 35.1, 35.1, 0, 0.9, STONE, null, { top: 0 }); box(6.6, 6.6, 35.4, 35.4, 6.4, 7, STONE, null, { top: 0 });
        [[6.8, 6.8, 35.2, 7.15], [6.8, 34.85, 35.2, 35.2], [6.8, 6.8, 7.15, 35.2], [34.85, 6.8, 35.2, 35.2]].forEach(b => box(b[0], b[1], b[2], b[3], 7, 7.9, STONE));
        box(35, 15, 36.6, 27, 0, 8.4, STONE, 0xefe9dc); roof('gable', 35, 15, 36.6, 27, 8.4, 1.6, STONE, 0xefe9dc, { axis: 'x' });                    // the stone portal: three arches
        [17.5, 21, 24.5].forEach(zc => { box(36.5, zc - 1.1, 36.68, zc + 1.1, 0, 3.2, null, DARK); vault(36.5, zc - 1.1, 36.68, zc + 1.1, 3.2, 1.1, null, DARK, { axis: 'x' }); });
        cyl(21, 21, 9.5, 7.05, 13.5, STONE, OC, { seg: 8 }); cyl(21, 21, 9.56, 8.6, 12.3, 'u_GlassWindowTall1a', 0xf0fff0, { seg: 8 }); ring(8, 21, 21, 9.75, 0.75, 7.05, 13.5, STONE, OC);   // the eight-sided reading room
        cyl(21, 21, 10.3, 13.5, 14.1, STONE, null, { seg: 8 }); cone(21, 21, 10.3, 14.1, 5.2, ALU, SLATE, { seg: 8 }); cyl(21, 21, 2.1, 18, 20.2, 'u_GlassWindowSquare1a', 0xe0f2ff, { seg: 8 }); cone(21, 21, 2.5, 20.2, 1.7, ALU, VERD, { seg: 8 }); }); });

plot(6, 3, () => { const OL = 0xb4c080, CS = 'u_PlasterWallPainted1a';
    B(0, { solids: [{ r: [17.5, 28, 31.5, 42], st: 3, door: { side: 'N', at: 24.75 } }], ghost: [[13.2, 25.3, 15.4, 25.3, 2.6], [13.2, 27.5, 15.4, 27.5, 2.6]], cells: [[3, 7], [4, 7], [2, 9], [3, 9], [2, 10], [3, 10]] }, () => {   // MILITARY OFFICES: a blockhouse
        box(17.5, 28, 31.5, 42, 0, 14, CS, OL);
        for (let k = 0; k < 4; k++) for (let x = 18.6; x < 31; x += 2.3) { if (k === 0 && x > 22.5 && x < 26.5) continue; box(x, 27.9, x + 0.6, 28, 1.9 + k * 3.2, 3.6 + k * 3.2, null, DARK); }
        for (let x = 17.5; x < 31; x += 2.05) { box(x, 28, x + 1.15, 28.6, 14, 15, CS, OL); box(x, 41.4, x + 1.15, 42, 14, 15, CS, OL); } for (let z = 29.6; z < 41; z += 2.05) { box(17.5, z, 18.1, z + 1.15, 14, 15, CS, OL); box(30.9, z, 31.5, z + 1.15, 14, 15, CS, OL); }
        cyl(27, 36, 1.7, 14, 15.4, ALU, 0xaab0a0); dome(27, 36, 2.5, 15.4, 2.9, STONE, 0xffffff); cyl(21, 32, 0.1, 14, 23, ALU, null, { seg: 6 }); cone(21.6, 32, 1.0, 19, 0.6, ALU, null, { inv: true });
        box(13.2, 25.3, 15.4, 27.5, 0, 2.6, CS, OL); box(12.9, 25, 15.7, 27.8, 2.6, 2.85, CS, 0x98a468, { under: 1 }); box(15.4, 26.3, 20.5, 26.5, 0.9, 1.1, null, 0xd9382e); flag(15, 30.5, 11, 0x3a6b3a); });
    B(1, {}, () => {                                                                                                                                  // ARMY SURPLUS (a roof-route tier)
        box(0, 0, 14, 17.5, 0, 7, 'u_MetalCorrugatedPainted4a', 0xf0f0c8, { top: 0 }); box(4.5, 17.45, 7.6, 17.56, 0.5, 3.0, 'u_GlassWindowResidential1a'); box(9.9, 17.45, 13, 17.56, 0.5, 3.0, 'u_GlassWindowResidential1a'); roof('shed', 3.5, 17.5, 14, 19.2, 2.9, 0.9, 'u_MetalCorrugatedPainted4a', 0xffffff, { high: 'N' });
        [[0, 0, 14, 0.6], [0, 16.9, 14, 17.5], [0, 0, 0.6, 17.5], [13.4, 0, 14, 17.5]].forEach(b => box(b[0], b[1], b[2], b[3], 7, 7.8, 'u_ConcreteStriped1a', 0xe8d8a8)); door(8.75, 17.5, 'S'); });
    B(2, { st: 1 }, () => { vault(24.5, 0, 35, 17.5, 0, 5.6, 'u_MetalCorrugatedPainted4a', 0xe0e8c8, { axis: 'z' }); box(27.2, 17.45, 32.3, 17.62, 0, 3.9, ALU, 0x7a8a60); }); });   // THE ARMORY: a Quonset hut

plot(7, 3, () => { const PC = 'u_ConcreteStriped1e', PT = 0xfff8e8;
    B(0, { solids: [{ r: [7, 7, 35, 35], st: 1, door: { side: 'N', at: 21 } }] }, () => {                                                             // PERMIT OFFICES: a slab on pilotis over the public podium
        box(7, 7, 35, 35, 0, 4.5, PC, PT); box(8, 6.9, 19.3, 7, 0.6, 3.7, 'u_GlassWindowSquare1a', 0xd0ecf8); box(22.7, 6.9, 34, 7, 0.6, 3.7, 'u_GlassWindowSquare1a', 0xd0ecf8); box(35, 8, 35.1, 34, 0.6, 3.7, 'u_GlassWindowSquare1a', 0xd0ecf8); box(6.4, 6.4, 35.6, 35.6, 4.5, 4.9, STONE);
        for (let x = 10.5; x < 33; x += 4.2) { cyl(x, 12.5, 0.5, 4.9, 8.4, STONE, null, { seg: 10 }); cyl(x, 21.5, 0.5, 4.9, 8.4, STONE, null, { seg: 10 }); }
        box(9, 11, 33, 23, 8.4, 29.4, 'u_GlassWindowSquare4a', 0xc8f4f8, { under: 1, top: 1 }); box(8.3, 10.7, 9, 23.3, 8.4, 30.2, STONE); box(33, 10.7, 33.7, 23.3, 8.4, 30.2, STONE);
        for (let k = 0; k <= 6; k++) box(9, 10.1, 33, 23.9, 8.4 + k * 3.5 - 0.12, 8.4 + k * 3.5 + 0.12, STONE, null, { under: 1 });
        box(17, 14, 25, 20, 29.5, 32.4, PC, PT); cyl(29, 17, 1.6, 29.9, 33, 'u_ConcreteStriped1a', 0xe0b080, { seg: 14 }); cone(29, 17, 1.8, 33, 1.1, ALU, SLATE, { seg: 14 });
        cyl(13.5, 29.5, 5.2, 4.9, 10, 'u_PlasterWallPainted1a', 0xf09068, { seg: 28 }); cyl(13.5, 29.5, 5.7, 10, 10.35, STONE, null, { seg: 28 }); dome(13.5, 29.5, 4.6, 10.35, 1.4, ALU, VERD);
        for (let i = 0; i < 3; i++) { const x0 = 15.9 + i * 3.4; roof('gable', x0, 3.6, x0 + 3.4, 7, 3.3, 1.1, STONE, null, { axis: 'z' }); } [15.9, 26.1].forEach(x => cyl(x, 3.8, 0.14, 0, 3.3, ALU, null, { seg: 8 })); }); });

/* ══ the parts as the game's `arch` parts (three-renderer.js _hqArchGeometry: box / cyl / dome / roof / quad) ══ */
const r3 = v => Math.round(v * 1000) / 1000;
const KEY = k => !k ? undefined : k.indexOf('u_') === 0 ? 'urban:' + k.slice(2) : k;
const UV = k => /^u_(Decal|Glass|Door)/.test(k || '') ? 3.5 : 1.75;
const ROOF_KEY = 'urban:PlasterWallPainted1a', ROOF_TINT = 0xc8ccd0, RY = { S: 0, W: 90, N: 180, E: 270 };
function toArch(p, D) {   // D = the walk-in doorway of this building, or null: { side, at, plane, cw }
    const out = [], o = p.o || {}, base = { key: KEY(p.key), tint: p.tint == null ? undefined : p.tint, uv: p.key ? UV(p.key) : undefined };
    if (o.glow) base.glow = o.glow; if (o.alpha) { base.kind = 'over'; base.ds = true; }
    const clean = q => { Object.keys(q).forEach(k => q[k] === undefined && delete q[k]); return q; };
    if (p.t === 'box') {
        const w = p.x1 - p.x0, d = p.z1 - p.z0, h = p.y1 - p.y0, cx = (p.x0 + p.x1) / 2, cz = (p.z0 + p.z1) / 2;
        const mk = (grow, y0, hh, q, holeH) => {
            const W = w + 2 * grow, Dp = d + 2 * grow, b = Object.assign({ s: 'box', p: [r3(cx), r3(y0), r3(cz)], size: [r3(W), r3(hh), r3(Dp)] }, q);
            /* the doorway: the face that carries it is a panel with the hole cut (the engine's leaf hangs in the tool's texbuilding) */
            if (D && y0 < 0.6) {
                const fp = { S: p.z1, N: p.z0, E: p.x1, W: p.x0 }[D.side], ns = D.side === 'S' || D.side === 'N', a0 = ns ? p.x0 : p.z0, a1 = ns ? p.x1 : p.z1;
                if (Math.abs(fp - D.plane) < 0.4 && a0 < D.at - 0.8 && a1 > D.at + 0.8) {
                    b.faces = 'fblr'.replace({ S: 'f', N: 'b', W: 'l', E: 'r' }[D.side], '');
                    const mid = (a0 + a1) / 2, sgn = (D.side === 'S' || D.side === 'W') ? 1 : -1, off = { S: [0, grow], N: [0, -grow], E: [grow, 0], W: [-grow, 0] }[D.side];
                    out.push(clean(Object.assign({}, q, { s: 'quad', p: [r3((ns ? mid : fp) + off[0]), r3(y0), r3((ns ? fp : mid) + off[1])], ry: RY[D.side], size: [r3(a1 - a0 + 2 * grow), r3(hh)], hole: [r3(sgn * (D.at - mid)), holeH ? 2.6 : D.cw, Math.max(0.1, (holeH || 2.2) - y0)] })));
                }
            }
            out.push(clean(b));
        };
        const flatTop = o.top === 1 || (o.top !== 0 && h >= 2.5 && !o.alpha && /bricks|Plaster|Concrete|Corrugated|Glass/.test(p.key || ''));
        mk(0, p.y0, h, Object.assign({}, base, o.top === 0 ? { top: false } : flatTop ? { keyTop: ROOF_KEY, tintTop: ROOF_TINT } : {}, o.under ? { under: true } : {}));
        if (o.win) { const y0 = p.y0 + (o.winY0 || 0); mk(0.05, y0, p.y1 - y0, { key: KEY(o.win), kind: 'over', uv: 3.5, top: false }, 3.5); }
    } else if (p.t === 'cyl') {
        const q = Object.assign({ s: 'cyl', p: [r3(p.x), r3(p.y0), r3(p.z)], r: p.r, h: r3(p.y1 - p.y0), seg: o.seg || 20 }, base);
        if (o.cone) { if (o.inv) { q.r = 0.03; q.r2 = p.r; } else q.r2 = 0; } else if (o.r2 != null) q.r2 = o.r2;
        out.push(clean(q));
    } else if (p.t === 'dome') out.push(clean(Object.assign({ s: 'dome', p: [r3(p.x), r3(p.y0), r3(p.z)], r: p.r, h: p.h, seg: 20 }, base)));
    else if (p.t === 'roof') {
        const w = p.x1 - p.x0, d = p.z1 - p.z0, cx = (p.x0 + p.x1) / 2, cz = (p.z0 + p.z1) / 2; let ry = 0, sw = false;
        if (p.shape === 'shed') { ry = { N: 0, S: 180, E: 90, W: 270 }[o.high || 'N']; sw = o.high === 'E' || o.high === 'W'; }
        else if (p.shape === 'pyr') { } else if (p.shape === 'hip') { sw = d > w; ry = sw ? 90 : 0; } else if (o.axis === 'z') { ry = 90; sw = true; }
        const q = Object.assign({ s: 'roof', form: p.shape === 'pyr' ? 'pyramid' : p.shape, p: [r3(cx), r3(p.y0), r3(cz)], ry: ry || undefined, size: [r3(sw ? d : w), p.h, r3(sw ? w : d)], roof: true, ds: p.shape === 'barrel' || undefined }, base);
        if (o.over) q.over = o.over; if (p.shape === 'barrel') q.seg = 12;
        out.push(clean(q));
    } else if (p.t === 'door') {   // a drawn double door, shut (a building with no inside)
        const v = { S: [0, 1], N: [0, -1], E: [1, 0], W: [-1, 0] }[p.face], ry = RY[p.face], al = p.face === 'S' || p.face === 'N' ? [1, 0] : [0, 1];
        [-0.5, 0.5].forEach(s => out.push({ s: 'quad', p: [r3(p.x + al[0] * s + v[0] * 0.07), 0, r3(p.z + al[1] * s + v[1] * 0.07)], ry, size: [1.0, 2.3], key: 'urban:DoorStorefrontHalf1a', uv: 'fit', kind: 'wall' }));
        out.push(clean({ s: 'quad', p: [r3(p.x + v[0] * 0.06), 2.3, r3(p.z + v[1] * 0.06)], ry: ry || undefined, size: [2.3, 0.25], tint: 0x2a2d33 }));
    }
    return out;
}

/* ══ apply(ctx): called by bake-disaster-city.js after its building loop. ctx = { PLAN, features, props, bInfo, gx, take, roofB, ROOF_H } ══ */
function apply(ctx) {
    const { PLAN, features, gx, take, roofB } = ctx, n = { arch: 0, parts: 0, hollow: 0, solids: 0, ghosts: 0 };
    PLOTS.forEach(P => {
        const lp = PLAN.plots.find(q => q.x === P.px && q.y === P.py), X0 = gx(P.px * N), Z0 = gx(P.py * N);
        P.b.forEach((Bd, k) => {
            const pb = Bd.i == null ? null : lp.buildings[Bd.i], id = pb ? 'dc:' + pb.id : 'dc:' + lp.id + '-x' + k, row = pb ? features.find(f => f.id === id) : null;
            if (pb && !row) throw new Error('civic: no row for ' + id);
            let D = null;
            if (row && roofB.has(pb.id)) { row.bld = Object.assign({}, row.bld, { skin: false }); }
            else if (row) {
                delete row.key; delete row.style; delete row.hollow; delete row.door; row.skin = false;
                const S = Bd.solids || [];
                if (!S.length) row.storeys = Bd.st || 2;
                S.forEach((s, si) => {
                    const r = si === 0 ? row : { k: 'texbuilding', id: id + '-c' + si, skin: false, seed: 7000 + features.length };
                    const side = s.door ? s.door.side : 'S', ew = side === 'E' || side === 'W', w = ew ? s.r[3] - s.r[1] : s.r[2] - s.r[0], d = ew ? s.r[2] - s.r[0] : s.r[3] - s.r[1];
                    r.x = r3(X0 + (s.r[0] + s.r[2]) / 2); r.z = r3(Z0 + (s.r[1] + s.r[3]) / 2); r.w = r3(w); r.d = r3(d); r.rot = RY[side]; r.storeys = s.st;
                    if (s.door) {   // data.js hqTexbDoor: the front's squares from its left as you face it from outside
                        const L = w - 0.12, cols = Math.max(1, Math.round(L / 1.75)), cw = L / cols, kk = side === 'S' ? s.door.at - s.r[0] : side === 'N' ? s.r[2] - s.door.at : side === 'E' ? s.r[3] - s.door.at : s.door.at - s.r[1];
                        const col = Math.max(0, Math.min(cols - 1, Math.floor((kk - 0.06) / cw))), lx = -L / 2 + (col + 0.5) * cw, mid = ew ? (s.r[1] + s.r[3]) / 2 : (s.r[0] + s.r[2]) / 2;
                        r.hollow = true; r.door = col + 1; n.hollow++;
                        D = { side, cw: r3(cw), at: r3(mid + ((side === 'S' || side === 'W') ? lx : -lx)), plane: { S: s.r[3], N: s.r[1], E: s.r[2], W: s.r[0] }[side] };
                    }
                    if (si > 0) features.push(r); n.solids++;
                });
            }
            const parts = []; Bd.parts.forEach(p => toArch(p, D).forEach(q => parts.push(q)));
            features.push({ k: 'arch', id: 'arch:' + id.slice(3), x: X0, z: Z0, parts }); n.arch++; n.parts += parts.length;
            (Bd.ghost || []).forEach(g => { features.push({ k: 'wall', x0: r3(X0 + g[0]), z0: r3(Z0 + g[1]), x1: r3(X0 + g[2]), z1: r3(Z0 + g[3]), t: 0.3, y: g[4], ghost: true, rail: false }); n.ghosts++; });
            (Bd.cells || []).forEach(c => take(P.px * N + c[0], P.py * N + c[1]));
        });
    });
    return n;
}
module.exports = { apply, PLOTS, toArch };
