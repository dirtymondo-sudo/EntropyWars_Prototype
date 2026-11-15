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
/* THE PIECES THAT WAIT FOR THEIR MODEL (mondo's OK on both concepts 11-15; docs/plans/disaster-city/civic-dc/): a key here is placed only once
   data.js has its catalogue row, so the city can be baked before the GLB exists. Rows + recipe: areas-complexes.md "CIVIC CENTER, DC PASS 2". */
const HAVE = (() => { let src = ''; try { src = require('fs').readFileSync(require('path').join(__dirname, '../../../data.js'), 'utf8'); } catch (e) {}
    const h = {}; ['seated_statue', 'blossom_tree'].forEach(k => { h[k] = !!process.env.CIVIC_HAVE || new RegExp('^\\s+' + k + ':\\s*\\{\\s*file:', 'm').test(src); }); return h; })();
const PLOTS = [];
let cur = null, bld = null;
const plot = (px, py, fn) => { cur = { px, py, b: [] }; PLOTS.push(cur); fn(); };
const B = (i, spec, fn) => { bld = Object.assign({ i, parts: [], ghost: [], cells: [] }, spec || {}); cur.b.push(bld); fn(); if (bld.fit) fitB(bld); };
/* THE GRID FIT (the interiors, mondo 11-13 21:14 "respect the square battle grid"): a walk-in shell that stood off the 3.5 m squares is
   moved onto them. spec.fit = [from x0, z0, x1, z1, to x0, z0, x1, z1]: every part, solid, ghost and door of the building is mapped with it. */
function fitB(b) {
    const f = b.fit, sx = (f[6] - f[4]) / (f[2] - f[0]), sz = (f[7] - f[5]) / (f[3] - f[1]), X = x => Math.round((f[4] + (x - f[0]) * sx) * 1000) / 1000, Z = z => Math.round((f[5] + (z - f[1]) * sz) * 1000) / 1000;
    b.parts.forEach(p => { if (p.x0 != null) { p.x0 = X(p.x0); p.x1 = X(p.x1); p.z0 = Z(p.z0); p.z1 = Z(p.z1); } else { p.x = X(p.x); p.z = Z(p.z); } });
    (b.solids || []).forEach(s => { s.r = [X(s.r[0]), Z(s.r[1]), X(s.r[2]), Z(s.r[3])]; if (s.door) s.door.at = (s.door.side === 'S' || s.door.side === 'N') ? X(s.door.at) : Z(s.door.at); });
    b.ghost = (b.ghost || []).map(g => [X(g[0]), Z(g[1]), X(g[2]), Z(g[3]), g[4]]);
}
const push = p => { bld.parts.push(p); return p; };
const box = (x0, z0, x1, z1, y0, y1, key, tint, o) => push({ t: 'box', x0, z0, x1, z1, y0, y1, key, tint, o: o || {} });
const cyl = (x, z, r, y0, y1, key, tint, o) => push({ t: 'cyl', x, z, r, y0, y1, key, tint, o: o || {} });
const cone = (x, z, r, y0, h, key, tint, o) => push({ t: 'cyl', x, z, r, y0, y1: y0 + h, key, tint, o: Object.assign({ cone: true }, o) });
const dome = (x, z, r, y0, h, key, tint, o) => push({ t: 'dome', x, z, r, y0, h, key, tint, o: o || {} });
const roof = (shape, x0, z0, x1, z1, y0, h, key, tint, o) => push({ t: 'roof', shape, x0, z0, x1, z1, y0, h, key, tint, o: o || {} });
const vault = (x0, z0, x1, z1, y0, h, key, tint, o) => push({ t: 'roof', shape: 'barrel', x0, z0, x1, z1, y0, h, key, tint, o: o || {} });
const door = (x, z, face) => push({ t: 'door', x, z, face });                       // a drawn (shut) door on a building with no inside
const ring = (n, cx, cz, R, r, y0, y1, key, tint) => { for (let i = 0; i < n; i++) { const a = i * 2 * Math.PI / n; cyl(cx + R * Math.sin(a), cz + R * Math.cos(a), r, y0, y1, key, tint, { seg: 8 }); } };
/* THE CITY FLAG (2026-11-15, THE CITY MARKS, mondo's OK on the branding sheet + "go for it"): every pole flies the city's flag. The cloth
   keeps its box; its two faces wear the renderer's 'mark:flag' sheet (three-renderer.js _hqArchSignTex). `tint` is kept for the cloth's edge. */
const flag = (x, z, h, tint) => { cyl(x, z, 0.09, 0, h, ALU, 0xdddddd, { seg: 6 }); box(x + 0.1, z - 0.03, x + 2.3, z + 0.03, h - 1.6, h - 0.2, null, tint);
    push({ t: 'flagq', x: x + 1.2, y: h - 1.6, z: z + 0.045, ry: 0 }); push({ t: 'flagq', x: x + 1.2, y: h - 1.6, z: z - 0.045, ry: 180 }); };
/* a black iron fence with a stone post every square, and its unseen wall (the plaza's lawns, the White House lawn) */
const iron = (x0, z0, x1, z1) => { const ns = x0 === x1; box(x0 - (ns ? 0.03 : 0), z0 - (ns ? 0 : 0.03), x1 + (ns ? 0.03 : 0), z1 + (ns ? 0 : 0.03), 1.0, 1.06, null, 0x15171a); box(x0 - (ns ? 0.03 : 0), z0 - (ns ? 0 : 0.03), x1 + (ns ? 0.03 : 0), z1 + (ns ? 0 : 0.03), 0.18, 0.24, null, 0x15171a);
    const L = ns ? z1 - z0 : x1 - x0; for (let d = 0; d <= L + 0.01; d += 0.25) { const x = ns ? x0 : x0 + d, z = ns ? z0 + d : z0; if (Math.abs(d / 3.5 - Math.round(d / 3.5)) < 0.01) { box(x - 0.2, z - 0.2, x + 0.2, z + 0.2, 0, 1.25, STONE, 0xe4ddd0); } else if (Math.round(d * 4) % 2 === 0) cyl(x, z, 0.022, 0.1, 1.2, null, 0x15171a, { seg: 4 }); }
    bld.ghost.push([x0, z0, x1, z1, 1.25]); };
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
    B(0, { fit: [25.7, 11.7, 33.8, 23.3, 24.5, 10.5, 31.5, 21], solids: [{ r: [25.7, 11.7, 33.8, 23.3], st: 1, door: { side: 'W', at: 18.2 } }] }, () => {                                               // CIVIL RECORDS: a blind vault over a glass foot
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
    B(0, { solids: [{ r: [7, 7, 35, 31.5], st: 4, door: { side: 'S', at: 21.9 } }], cells: [[3, 9], [4, 9], [5, 9], [6, 9], [7, 9], [8, 9], [2, 10], [9, 10]],
        ghost: [0, 1, 2, 3, 4, 5].map(i => [12.5 + i * 3.2, 33.1, 13.5 + i * 3.2, 33.1, 4]) }, () => {                                              // CITY HALL
        box(7, 7, 35, 31.5, 0, 4, 'u_ConcreteStriped1a', 0xf0e8d8);                                                                                 // the rusticated ground storey
        box(7.5, 7.5, 34.5, 31, 4, 14, STONE, M, { win: WR }); box(6.6, 6.6, 35.4, 31.9, 14, 14.7, STONE); box(7.2, 7.2, 34.8, 31.3, 14.7, 15.6, STONE, M, { top: 1 });
        [[7, 7], [29.5, 7], [7, 26], [29.5, 26]].forEach(c => { box(c[0] - 0.4, c[1] - 0.4, c[0] + 5.9, c[1] + 5.9, 0, 16.6, STONE, M, { win: WR, winY0: 4 }); roof('pyr', c[0] - 0.8, c[1] - 0.8, c[0] + 6.3, c[1] + 6.3, 16.6, 2.8, ALU, VERD); });
        box(11.5, 31.5, 30.5, 34.4, 0, 0.1, STONE, 0xe9e4da);                                                                                        // the portico's paving (the stair of the mock-up is level ground here)
        for (let i = 0; i < 6; i++) { const x = 13 + i * 3.2; cyl(x, 33.1, 0.62, 0.5, 12.1, STONE, M, { seg: 14 }); box(x - 0.8, 32.3, x + 0.8, 33.9, 0.1, 0.5, STONE); box(x - 0.8, 32.3, x + 0.8, 33.9, 12.1, 12.5, STONE); }
        box(11.8, 31.4, 30.2, 34, 12.5, 13.9, STONE, M, { under: 1 }); roof('gable', 11.5, 31.3, 30.5, 34.2, 13.9, 3.3, STONE, M, { axis: 'z' });
        /* WASHINGTON DC (mondo 11-15): the taller dome on a ring of columns, a statue on top */
        cyl(21, 19, 8.6, 15.6, 16.4, STONE, null, { seg: 28 }); cyl(21, 19, 7, 16.4, 24.6, STONE, M, { seg: 28 }); ring(20, 21, 19, 7.8, 0.36, 16.4, 23.6, STONE, M); cyl(21, 19, 8.4, 23.6, 24.3, STONE, null, { seg: 28 });
        cyl(21, 19, 6.7, 24.3, 27.2, STONE, M, { seg: 28 }); cyl(21, 19, 6.76, 24.9, 26.6, 'u_GlassWindowTall1a', 0xdfe8f0, { seg: 28 }); cyl(21, 19, 7.1, 27.2, 27.6, STONE, null, { seg: 28 });
        dome(21, 19, 6.7, 27.6, 9.4, ALU, VERD); cyl(21, 19, 1.5, 36.6, 39.4, STONE, M, { seg: 12 }); ring(8, 21, 19, 1.75, 0.13, 36.9, 39.4, STONE, M); cyl(21, 19, 2.0, 39.4, 39.7, STONE, null, { seg: 12 }); dome(21, 19, 1.6, 39.7, 1.5, ALU, VERD);
        cyl(21, 19, 0.42, 41.1, 41.7, STONE, null, { seg: 8 }); cyl(21, 19, 0.3, 41.7, 43.5, null, 0x5f9f86, { seg: 8, r2: 0.2 }); dome(21, 19, 0.24, 43.45, 0.42, null, 0x5f9f86);   // the statue (a robed figure, far overhead)
        box(10.5, 34.4, 31.5, 34.75, 0, 0.07, STONE, 0xe9e4da); box(9.5, 34.75, 32.5, 35.0, 0, 0.04, STONE, 0xe2ddd2);                                  // the wide stair's treads (level ground: THE LEVELS)
        for (let x = 11; x <= 31; x += 2) if (Math.abs(x - 21.9) > 1.6) { cyl(x, 35.25, 0.2, 0, 0.85, 'u_ConcreteStriped1a', 0xd8d4cc, { seg: 8 }); dome(x, 35.25, 0.2, 0.85, 0.12, 'u_ConcreteStriped1a', 0xd8d4cc); }   // the security bollards
        flag(10, 37, 10, 0x2a56b0); flag(32, 37, 10, 0xb03a2a); }); });

plot(7, 0, () => {
    B(0, { fit: [10.5, 7.6, 24, 17.5, 10.5, 7, 24.5, 17.5], solids: [{ r: [10.5, 7.6, 24, 17.5], st: 2, door: { side: 'S', at: 19.2 } }, { r: [25.8, 8.4, 33.4, 16.1], st: 2 }] }, () => {              // COUNCIL ANNEX: a glass bar + the round chamber
        box(10.5, 7.6, 24, 17.5, 0, 10.5, 'u_GlassWindowSquare2a', 0xb8f0e4, { top: 1 });
        [3.5, 7].forEach(y => box(10.2, 7.3, 24.3, 17.8, y - 0.12, y + 0.12, STONE)); box(9.2, 6.3, 25.2, 18.6, 10.5, 10.95, STONE, null, { under: 1 });
        cyl(29.6, 12.25, 5.5, 0, 9, 'u_PlasterWallPainted1a', 0xf4efe4, { seg: 28 });
        ring(14, 29.6, 12.25, 6.15, 0.17, 0, 10.4, STONE, null); cyl(29.6, 12.25, 5.0, 9, 10.4, 'u_GlassWindowSquare1a', 0xdff4ff, { seg: 28 }); cyl(29.6, 12.25, 6.7, 10.4, 10.8, STONE, null, { seg: 28 }); dome(29.6, 12.25, 5.3, 10.8, 1.9, ALU, VERD); });
    B(1, { st: 2, ghost: [] }, () => { const W = 0xffffff, WZ = [27.75, 28.75, 30.75, 31.75], L = { glow: 0.45 }, LT = { glow: 0.45, top: 1 };                    // THE MAYOR'S HOUSE = THE WHITE HOUSE (mondo 11-15): white (lifted a little so its shaded front still reads white), a flat roof behind a parapet, a tall four-column portico to the west lawn
        box(24.5, 21, 42, 42, 0, 7.6, STONE, W, { win: WR, glow: 0.45 }); box(24.3, 20.8, 42, 42, 7.6, 7.95, STONE, W, L);
        [[24.3, 20.8, 42, 21.05], [24.3, 41.75, 42, 42], [24.3, 20.8, 24.55, 42], [41.75, 20.8, 42, 42]].forEach(b => box(b[0], b[1], b[2], b[3], 7.95, 8.6, STONE, W, LT));                                  // the parapet
        for (let z = 21; z <= 42; z += 3.5) box(24.2, z - 0.25, 24.6, z + 0.25, 7.95, 8.85, STONE, W, LT); for (let x = 28; x <= 42; x += 3.5) { box(x - 0.25, 20.7, x + 0.25, 21.1, 7.95, 8.85, STONE, W, LT); box(x - 0.25, 41.7, x + 0.25, 42, 7.95, 8.85, STONE, W, LT); }
        box(27, 24, 28.2, 25.2, 7.6, 9.6, STONE, W, L); box(37.8, 36, 39, 37.2, 7.6, 9.6, STONE, W, L);
        box(22.1, 27.3, 24.5, 32.2, 0, 0.3, STONE, 0xf1ece0); WZ.forEach(z => { cyl(22.6, z, 0.34, 0.3, 0.55, STONE, W, { seg: 12, glow: 0.45 }); cyl(22.6, z, 0.26, 0.55, 6.6, STONE, W, { seg: 12, glow: 0.45 }); cyl(22.6, z, 0.36, 6.6, 6.9, STONE, W, { seg: 12, glow: 0.45 }); });
        box(22.1, 27.3, 24.5, 32.2, 6.9, 7.6, STONE, W, L); box(21.95, 27.15, 24.5, 32.35, 7.6, 7.8, STONE, W, L); roof('gable', 22.1, 27.3, 24.5, 32.2, 7.8, 1.5, STONE, W, { axis: 'x', glow: 0.45 });
        box(24.38, 28.6, 24.5, 30.9, 0, 3.3, STONE, 0xf1ece0, L); box(24.34, 28.4, 24.5, 31.1, 3.3, 3.6, STONE, W, L);                                        // the door's stone frame + its head
        [27.0, 32.5].forEach(z => { cyl(21.6, z, 0.07, 0, 2.6, null, 0x15171a, { seg: 6 }); dome(21.6, z, 0.26, 2.6, 0.42, null, 0xfff0c0, { glow: 1 }); });      // the two lamps of the walk
        flag(33.25, 31.5, 13.2, 0xb03a2a);
        iron(3.5, 24.5, 17.5, 24.5); iron(17.5, 24.5, 17.5, 28); iron(17.5, 31.5, 17.5, 38.5);                                                                 // the lawn's fence: the walk side + the north side, the gate facing the portico
        push({ t: 'door', x: 24.5, z: 29.75, face: 'W', plain: true }); }); });

/* ───────── row 1: the avenue ───────── */
plot(4, 1, () => { const G = 0xeeeae0;
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
    B(null, { ghost: [[6.8, 35, 14.2, 35, 0.6], [25.4, 33.25, 27.1, 33.25, 3]], cells: [[2, 9], [3, 9], [2, 10], [3, 10], [7, 9], [1, 1], [2, 1], [3, 1], [1, 2], [2, 2], [3, 2], [9, 1], [10, 1], [9, 2], [10, 2]] }, () => {         // CIVIC PLAZA: the bandstand + the plaza clock
        cyl(10.5, 35, 3.7, 0, 0.3, STONE, null, { seg: 16 }); ring(8, 10.5, 35, 3.1, 0.18, 0.3, 3.8, STONE); cyl(10.5, 35, 3.8, 3.8, 4.15, STONE, null, { seg: 16 }); dome(10.5, 35, 3.6, 4.15, 1.9, ALU, VERD); cone(10.5, 35, 0.15, 6.05, 1.2, 'gold', null, { seg: 6 });
        /* DC: the white obelisk (2 x 2 squares, the north-east lawn) at the end of the reflecting pool (3 x 2 squares, the north-west lawn),
           the walk between them; flag rows down the walk; a black iron fence with stone posts round the lawns' outer sides */
        box(31.5, 3.5, 38.5, 10.5, 0, 0.35, STONE, 0xe9e4da); box(32.8, 4.8, 37.2, 9.2, 0.35, 0.7, STONE, 0xf1ece0);
        cyl(35, 7, 2.05, 0.7, 27, STONE, 0xfffaf0, { seg: 4, r2: 1.35, ry: 45 }); cone(35, 7, 1.35, 27, 2.3, STONE, 0xfffaf0, { seg: 4, ry: 45 });
        box(4.05, 4.05, 13.45, 9.95, 0, 0.3, null, 0x2c5878, { glow: 0.18 }); box(3.5, 3.5, 14, 4.05, 0, 0.45, STONE, 0xf1ece0); box(3.5, 9.95, 14, 10.5, 0, 0.45, STONE, 0xf1ece0); box(3.5, 4.05, 4.05, 9.95, 0, 0.45, STONE, 0xf1ece0); box(13.45, 4.05, 14, 9.95, 0, 0.45, STONE, 0xf1ece0);
        [4.4, 7, 9.6].forEach((z, i) => { flag(16.9, z, 9, i % 2 ? 0xb03a2a : 0x2a56b0); flag(25.1, z, 9, i % 2 ? 0x2a56b0 : 0xb03a2a); });
        iron(3.5, 3.5, 17.5, 3.5); iron(3.5, 3.5, 3.5, 10.5); iron(24.5, 3.5, 38.5, 3.5); iron(38.5, 3.5, 38.5, 10.5);
        if (HAVE.seated_statue) {   /* DC: the seated statue in its open temple on the south-east lawn, looking north up the walk at the obelisk */
            const T = 0xf6f1e6; box(31.3, 34.8, 38.7, 38.5, 0, 0.3, STONE, T); box(31.5, 38.1, 38.5, 38.5, 0.3, 4.9, STONE, T); box(31.5, 35.6, 31.9, 38.1, 0.3, 4.9, STONE, T); box(38.1, 35.6, 38.5, 38.1, 0.3, 4.9, STONE, T);
            [31.9, 33.1, 36.9, 38.1].forEach(x => cyl(x, 35.2, 0.24, 0.3, 4.9, STONE, 0xffffff, { seg: 12 })); box(31.3, 34.8, 38.7, 38.5, 4.9, 5.5, STONE, T, { under: 1 }); box(31.1, 34.6, 38.9, 38.5, 5.5, 5.75, STONE, 0xffffff);
            bld.ghost.push([31.5, 38.3, 38.5, 38.3, 4.9], [31.7, 35.6, 31.7, 38.3, 4.9], [38.3, 35.6, 38.3, 38.3, 4.9]); bld.cells.push([9, 10], [10, 10]); }
        box(25.35, 32.35, 27.15, 34.15, 0, 6.5, STONE, 0xf1ece0); face(26.25, 34.2, 0.7, 5.35, 'S'); face(26.25, 32.3, 0.7, 5.35, 'N'); roof('pyr', 25.05, 32.05, 27.45, 34.45, 6.5, 1.4, ALU, VERD); }); });

plot(7, 1, () => { const CR = 0xfff4dc, CCOL = [5.45, 7.05, 8.65, 10.25, 12.55, 14.15, 15.75, 17.35];   // symmetric about the door (11.4)
    B(0, { solids: [{ r: [3.5, 3.5, 17.5, 10.5], st: 3, door: { side: 'S', at: 11.4 } }], ghost: CCOL.map(x => [x - 0.4, 11.3, x + 0.4, 11.3, 4]), cells: [[1, 3], [2, 3], [3, 3], [4, 3]] }, () => {   // COURTHOUSE: a temple (the room two squares deep: the interiors)
        box(3.5, 3.5, 17.5, 10.5, 0, 11.5, STONE, CR, { win: WR, winY0: 3.5 }); box(3.5, 10.5, 17.5, 12.2, 0, 0.1, STONE, 0xe4ddd0);
        CCOL.forEach(x => { cyl(x, 11.3, 0.4, 0.4, 9.6, STONE, CR, { seg: 12 }); box(x - 0.55, 10.75, x + 0.55, 11.85, 0.1, 0.4, STONE); box(x - 0.55, 10.75, x + 0.55, 11.85, 9.6, 10, STONE); });   // DC: the eight-column temple front
        [10.42, 12.38].forEach(x => box(x - 0.14, 10.5, x + 0.14, 10.62, 0, 3.0, null, 0x7a5a30)); box(10.28, 10.5, 12.52, 10.62, 2.72, 3.1, null, 0x7a5a30); box(10.0, 10.5, 12.8, 10.6, 3.1, 3.35, null, 0x5e4424);   // the bronze door frame
        box(8.2, 10.42, 14.6, 10.5, 12.9, 14.6, null, 0xe6dfd0);                                                                                       // the pediment's carved panel
        box(3.5, 10.5, 17.5, 12.0, 10, 11.5, STONE, CR, { under: 1 }); box(3.2, 3.2, 17.8, 12.3, 11.5, 12.7, STONE, CR); roof('gable', 3.0, 3.0, 18.0, 12.5, 12.7, 3.1, STONE, CR, { axis: 'z' }); });
    B(1, { solids: [{ r: [24.5, 3.5, 38.5, 10], st: 1 }] }, () => {                                                                                   // COURT CAFE: a roof terrace
        box(24.5, 3.5, 38.5, 10, 0, 3.8, 'bricks_3', 0xffb090); box(26, 9.95, 30.4, 10.06, 0.8, 3.0, 'u_GlassWindowResidential1a'); box(32.6, 9.95, 37, 10.06, 0.8, 3.0, 'u_GlassWindowResidential1a'); roof('shed', 24.5, 10, 38.5, 11.7, 2.8, 0.8, 'u_MetalCorrugatedPainted1a', 0xb0d0ff, { high: 'N' });
        box(24.3, 3.3, 38.7, 10.2, 3.8, 4.05, STONE); box(24.5, 9.95, 38.5, 10.05, 4.05, 5.0, 'u_MetalTruss4a', 0x8a8a8a, { alpha: 1 });
        [28, 34].forEach(x => { cyl(x, 6.6, 0.06, 4.05, 6.4, ALU, null, { seg: 6 }); cone(x, 6.6, 1.6, 6.2, 0.8, null, 0xd94f4f, { seg: 8 }); }); door(31.5, 10, 'S'); }); });

/* ───────── row 2 ───────── */
plot(4, 2, () => { const PB = 0xf2eee4;   // DC: pale limestone
    B(0, { fit: [3.5, 7, 14, 26, 3.5, 7, 14, 24.5], solids: [{ r: [3.5, 7, 14, 26], st: 3, door: { side: 'E', at: 16 } }, { r: [3.5, 26, 14, 31.5], st: 1 }], cells: [[4, 2], [4, 6]] }, () => {   // POLICE
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
        cyl(21, 21, 4.6, 14.6, 15.2, STONE, null, { seg: 20 }); ring(12, 21, 21, 4.1, 0.24, 15.2, 18.6, STONE, SG); cyl(21, 21, 2.6, 15.2, 18.6, STONE, SG, { seg: 16 }); cyl(21, 21, 4.6, 18.6, 19.2, STONE, null, { seg: 20 }); dome(21, 21, 4.2, 19.2, 3.4, ALU, VERD); cone(21, 21, 0.2, 22.6, 1.4, 'gold', null, { seg: 6 });   // DC: the round domed memorial ringed by columns
        [[10, 10], [32, 10], [10, 32], [32, 32]].forEach(c => { cyl(c[0], c[1], 1.1, 7.05, 7.9, STONE); cyl(c[0], c[1], 0.18, 7.9, 9.6, 'u_ConcreteStriped1a', 0xa07050, { seg: 6 }); dome(c[0], c[1], 1.5, 9.4, 2.2, null, 0x4f8a45); });
        door(21, 7, 'N'); door(35, 21, 'E'); }); });

plot(7, 2, () => { const BZ = 0xf0c890;
    B(0, { fit: [24.5, 3.5, 35, 20, 24.5, 3.5, 35, 17.5], solids: [{ r: [24.5, 3.5, 35, 20], st: 4, door: { side: 'W', at: 12 } }, { r: [26.5, 20.75, 33, 27.25], st: 5 }] }, () => {               // TIME BUREAU: a bronze glass slab + the clock drum
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

plot(5, 3, () => { const LB = 0xf3eee2, OC = 0xfff8ec;
    B(0, { ghost: [[14.3, 14.3, 27.7, 14.3, 13.5], [14.3, 27.7, 27.7, 27.7, 13.5], [14.3, 14.3, 14.3, 27.7, 13.5], [27.7, 14.3, 27.7, 27.7, 13.5], [35, 15, 36.6, 15, 8], [35, 27, 36.6, 27, 8]], cells: [[10, 4], [10, 7]] }, () => {   // PUBLIC LIBRARY (a roof-route tier)
        box(7, 7, 35, 35, 0, 7, STONE, LB, { win: WR, top: 0 }); box(6.9, 6.9, 35.1, 35.1, 0, 0.9, STONE, null, { top: 0 }); box(6.6, 6.6, 35.4, 35.4, 6.4, 7, STONE, null, { top: 0 });
        [[6.8, 6.8, 35.2, 7.15], [6.8, 34.85, 35.2, 35.2], [6.8, 6.8, 7.15, 35.2], [34.85, 6.8, 35.2, 35.2]].forEach(b => box(b[0], b[1], b[2], b[3], 7, 7.9, STONE));
        box(35, 15, 36.6, 27, 0, 8.4, STONE, 0xefe9dc); roof('gable', 35, 15, 36.6, 27, 8.4, 1.6, STONE, 0xefe9dc, { axis: 'x' });                    // the stone portal: three arches
        [17.5, 21, 24.5].forEach(zc => { box(36.5, zc - 1.1, 36.68, zc + 1.1, 0, 3.2, null, DARK); vault(36.5, zc - 1.1, 36.68, zc + 1.1, 3.2, 1.1, null, DARK, { axis: 'x' }); });
        cyl(21, 21, 9.5, 7.05, 13.5, STONE, OC, { seg: 8 }); cyl(21, 21, 9.56, 8.6, 12.3, 'u_GlassWindowTall1a', 0xf0fff0, { seg: 8 }); ring(8, 21, 21, 9.75, 0.75, 7.05, 13.5, STONE, OC);   // the eight-sided reading room
        cyl(21, 21, 10.3, 13.5, 14.1, STONE, null, { seg: 8 }); dome(21, 21, 9.9, 14.1, 6.4, ALU, VERD); cyl(21, 21, 2.1, 20.2, 22.4, 'u_GlassWindowSquare1a', 0xe0f2ff, { seg: 8 }); cone(21, 21, 2.5, 22.4, 1.7, ALU, VERD, { seg: 8 });   // DC: the copper dome
        for (let a = 9.6; a < 33; a += 4.56) {                                                                                                         // the arched windows of the ground storey
            box(a - 0.95, 35.0, a + 0.95, 35.09, 1.1, 3.6, null, DARK); vault(a - 0.95, 35.0, a + 0.95, 35.09, 3.6, 0.95, null, DARK, { axis: 'z' });
            box(a - 0.95, 6.91, a + 0.95, 7.0, 1.1, 3.6, null, DARK); vault(a - 0.95, 6.91, a + 0.95, 7.0, 3.6, 0.95, null, DARK, { axis: 'z' });
            box(6.91, a - 0.95, 7.0, a + 0.95, 1.1, 3.6, null, DARK); vault(6.91, a - 0.95, 7.0, a + 0.95, 3.6, 0.95, null, DARK, { axis: 'x' }); }
        }); });   // the lions each side of the steps: DRESS

plot(6, 3, () => { const OL = 0xe9e3d2, CS = 'u_PlasterWallPainted1a';
    B(0, { solids: [{ r: [17.5, 28, 31.5, 42], st: 3, door: { side: 'N', at: 24.75 } }], ghost: [[13.2, 25.3, 15.4, 25.3, 2.6], [13.2, 27.5, 15.4, 27.5, 2.6]], cells: [[3, 7], [4, 7], [2, 9], [3, 9], [2, 10], [3, 10]] }, () => {   // MILITARY OFFICES: a blockhouse
        box(17.5, 28, 31.5, 42, 0, 14, CS, OL);
        for (let k = 0; k < 4; k++) for (let x = 18.6; x < 31; x += 2.3) { if (k === 0 && x > 22.5 && x < 26.5) continue; box(x, 27.9, x + 0.6, 28, 1.9 + k * 3.2, 3.6 + k * 3.2, null, DARK); }
        for (let x = 17.5; x < 31; x += 2.05) { box(x, 28, x + 1.15, 28.6, 14, 15, CS, OL); box(x, 41.4, x + 1.15, 42, 14, 15, CS, OL); } for (let z = 29.6; z < 41; z += 2.05) { box(17.5, z, 18.1, z + 1.15, 14, 15, CS, OL); box(30.9, z, 31.5, z + 1.15, 14, 15, CS, OL); }
        cyl(29.5, 37.5, 1.2, 16.7, 17.6, ALU, 0xaab0a0); dome(29.5, 37.5, 1.8, 17.6, 2.1, STONE, 0xffffff); cyl(19.5, 32.5, 0.1, 16.7, 25, ALU, null, { seg: 6 }); cone(20.1, 32.5, 1.0, 21, 0.6, ALU, null, { inv: true });
        /* DC: the five-sided plan. The walk-in block keeps its square foot (the room, the door); from the second storey up the building is a
           pentagon round it, a point over the door, with the courtyard cut in its roof */
        cyl(24.5, 35, 9.4, 7, 7.4, STONE, null, { seg: 5, ry: 180 }); cyl(24.5, 35, 9.1, 7.4, 16.2, STONE, OL, { seg: 5, ry: 180 });
        [8.6, 11.6, 14.6].forEach(y => cyl(24.5, 35, 9.14, y, y + 1.5, 'u_GlassWindowSquare2a', 0x6a7684, { seg: 5, ry: 180 }));
        cyl(24.5, 35, 9.4, 16.2, 16.7, STONE, null, { seg: 5, ry: 180 }); cyl(24.5, 35, 5.4, 16.7, 16.78, null, 0x4f7a45, { seg: 5, ry: 180 }); cyl(24.5, 35, 5.7, 16.7, 16.74, STONE, null, { seg: 5, ry: 180 });   // the courtyard lawn in its kerb
        box(13.2, 25.3, 15.4, 27.5, 0, 2.6, CS, OL); box(12.9, 25, 15.7, 27.8, 2.6, 2.85, CS, 0x98a468, { under: 1 }); box(15.4, 26.3, 20.5, 26.5, 0.9, 1.1, null, 0xd9382e); flag(15, 30.5, 11, 0x3a6b3a); });
    B(1, {}, () => {                                                                                                                                  // ARMY SURPLUS (a roof-route tier)
        box(0, 0, 14, 17.5, 0, 7, 'u_MetalCorrugatedPainted4a', 0xf0f0c8, { top: 0 }); box(4.5, 17.45, 7.6, 17.56, 0.5, 3.0, 'u_GlassWindowResidential1a'); box(9.9, 17.45, 13, 17.56, 0.5, 3.0, 'u_GlassWindowResidential1a'); roof('shed', 3.5, 17.5, 14, 19.2, 2.9, 0.9, 'u_MetalCorrugatedPainted4a', 0xffffff, { high: 'N' });
        [[0, 0, 14, 0.6], [0, 16.9, 14, 17.5], [0, 0, 0.6, 17.5], [13.4, 0, 14, 17.5]].forEach(b => box(b[0], b[1], b[2], b[3], 7, 7.8, 'u_ConcreteStriped1a', 0xe8d8a8)); door(8.75, 17.5, 'S'); });
    B(2, { st: 1 }, () => { vault(24.5, 0, 35, 17.5, 0, 5.6, 'u_MetalCorrugatedPainted4a', 0xe0e8c8, { axis: 'z' }); box(27.2, 17.45, 32.3, 17.62, 0, 3.9, ALU, 0x7a8a60); }); });   // THE ARMORY: a Quonset hut

plot(7, 3, () => { const PC = 'u_ConcreteStriped1e', PT = 0xfff8e8;
    B(0, { solids: [{ r: [7, 7, 35, 35], st: 1, door: { side: 'N', at: 22.5 } }] }, () => {                                                             // PERMIT OFFICES: a slab on pilotis over the public podium
        box(7, 7, 35, 35, 0, 4.5, PC, PT); box(8, 6.9, 19.3, 7, 0.6, 3.7, 'u_GlassWindowSquare1a', 0xd0ecf8); box(22.7, 6.9, 34, 7, 0.6, 3.7, 'u_GlassWindowSquare1a', 0xd0ecf8); box(35, 8, 35.1, 34, 0.6, 3.7, 'u_GlassWindowSquare1a', 0xd0ecf8); box(6.4, 6.4, 35.6, 35.6, 4.5, 4.9, STONE);
        for (let x = 10.5; x < 33; x += 4.2) { cyl(x, 12.5, 0.5, 4.9, 8.4, STONE, null, { seg: 10 }); cyl(x, 21.5, 0.5, 4.9, 8.4, STONE, null, { seg: 10 }); }
        box(9, 11, 33, 23, 8.4, 29.4, 'u_GlassWindowSquare4a', 0xc8f4f8, { under: 1, top: 1 }); box(8.3, 10.7, 9, 23.3, 8.4, 30.2, STONE); box(33, 10.7, 33.7, 23.3, 8.4, 30.2, STONE);
        for (let k = 0; k <= 6; k++) box(9, 10.1, 33, 23.9, 8.4 + k * 3.5 - 0.12, 8.4 + k * 3.5 + 0.12, STONE, null, { under: 1 });
        box(17, 14, 25, 20, 29.5, 32.4, PC, PT); cyl(29, 17, 1.6, 29.9, 33, 'u_ConcreteStriped1a', 0xe0b080, { seg: 14 }); cone(29, 17, 1.8, 33, 1.1, ALU, SLATE, { seg: 14 });
        cyl(13.5, 29.5, 5.2, 4.9, 10, 'u_PlasterWallPainted1a', 0xf4efe4, { seg: 28 }); cyl(13.5, 29.5, 5.7, 10, 10.35, STONE, null, { seg: 28 }); dome(13.5, 29.5, 4.6, 10.35, 1.4, ALU, VERD);
        for (let i = 0; i < 3; i++) { const x0 = 15.9 + i * 3.4; roof('gable', x0, 3.6, x0 + 3.4, 7, 3.3, 1.1, STONE, null, { axis: 'z' }); } [15.9, 26.1].forEach(x => cyl(x, 3.8, 0.14, 0, 3.3, ALU, null, { seg: 8 })); }); });

/* ══ the parts as the game's `arch` parts (three-renderer.js _hqArchGeometry: box / cyl / dome / roof / quad) ══ */
const r3 = v => Math.round(v * 1000) / 1000;
const KEY = k => !k ? undefined : k.indexOf('u_') === 0 ? 'urban:' + k.slice(2) : k;
const UV = k => /^u_(DecalWindows|GlassWindow)/.test(k || '') ? undefined : /^u_(Decal|Glass|Door)/.test(k || '') ? 3.5 : 1.75;   // window sheets: no uv, the shared BIG WINDOWS rule sizes them (a storey a row, no ground row)
const ROOF_KEY = 'urban:PlasterWallPainted1a', ROOF_TINT = 0xc8ccd0, RY = { S: 0, W: 90, N: 180, E: 270 };
function toArch(p, D) {   // D = the walk-in doorway of this building, or null: { side, at, plane, cw }
    const out = [], o = p.o || {}, base = { key: KEY(p.key), tint: p.tint == null ? undefined : p.tint, uv: p.key ? UV(p.key) : undefined };
    if (o.glow) base.glow = o.glow; if (o.alpha) { base.kind = 'over'; base.ds = true; } if (o.gain) base.gain = o.gain; if (o.roof) base.roof = true;
    if (p.t === 'raw') { const q = Object.assign({}, p.q); Object.keys(q).forEach(k => q[k] === undefined && delete q[k]); return [q]; }   // THE SECOND PASS: an arch part written as it is
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
            if (o.nf) b.faces = (b.faces || 'fblr').replace(new RegExp('[' + o.nf.replace(/S/g, 'f').replace(/N/g, 'b').replace(/W/g, 'l').replace(/E/g, 'r') + ']', 'g'), '');
            if (b.faces === '' && q.top === false && !q.under) return;
            out.push(clean(b));
        };
        const flatTop = o.top === 1 || (o.top !== 0 && h >= 2.5 && !o.alpha && /bricks|Plaster|Concrete|Corrugated|Glass/.test(p.key || ''));
        mk(0, p.y0, h, Object.assign({}, base, o.top === 0 ? { top: false } : flatTop ? { keyTop: ROOF_KEY, tintTop: ROOF_TINT } : {}, o.under ? { under: true } : {}));
        if (o.win) { const y0 = p.y0 + (o.winY0 || 0); mk(0.05, y0, p.y1 - y0, { key: KEY(o.win), kind: 'over', top: false }, 3.5); }
    } else if (p.t === 'cyl') {
        const q = Object.assign({ s: 'cyl', p: [r3(p.x), r3(p.y0), r3(p.z)], r: p.r, h: r3(p.y1 - p.y0), seg: o.seg || 20 }, base);
        if (o.cone) { if (o.inv) { q.r = 0.03; q.r2 = p.r; } else q.r2 = 0; } else if (o.r2 != null) q.r2 = o.r2;
        if (o.ry) q.ry = o.ry;
        out.push(clean(q));
    } else if (p.t === 'dome') out.push(clean(Object.assign({ s: 'dome', p: [r3(p.x), r3(p.y0), r3(p.z)], r: p.r, h: p.h, seg: 20 }, base)));
    else if (p.t === 'roof') {
        const w = p.x1 - p.x0, d = p.z1 - p.z0, cx = (p.x0 + p.x1) / 2, cz = (p.z0 + p.z1) / 2; let ry = 0, sw = false;
        if (p.shape === 'shed') { ry = { N: 0, S: 180, E: 90, W: 270 }[o.high || 'N']; sw = o.high === 'E' || o.high === 'W'; }
        else if (p.shape === 'pyr') { } else if (p.shape === 'hip') { sw = d > w; ry = sw ? 90 : 0; } else if (o.axis === 'z') { ry = 90; sw = true; }
        const q = Object.assign({ s: 'roof', form: p.shape === 'pyr' ? 'pyramid' : p.shape, p: [r3(cx), r3(p.y0), r3(cz)], ry: ry || undefined, size: [r3(sw ? d : w), p.h, r3(sw ? w : d)], roof: true, ds: p.shape === 'barrel' || undefined }, base);
        if (o.over) q.over = o.over; if (p.shape === 'barrel') q.seg = 12; if (o.ds) q.ds = true;
        out.push(clean(q));
    } else if (p.t === 'iq') {   // an inside wall panel (a quad facing into the room)
        out.push(clean({ s: 'quad', p: [r3(p.x), r3(p.y), r3(p.z)], ry: p.ry || undefined, size: [r3(p.w), r3(p.h)], key: KEY(p.key), tint: p.tint == null ? undefined : p.tint, uv: p.key ? UV(p.key) : undefined, kind: 'wall', gain: p.gain, glow: p.glow }));
    } else if (p.t === 'flagq') {   // THE CITY FLAG: one face of a pole's cloth
        out.push(clean({ s: 'quad', p: [r3(p.x), r3(p.y), r3(p.z)], ry: p.ry || undefined, size: [2.2, 1.4], key: 'mark:flag', uv: 'fit', kind: 'wall' }));
    } else if (p.t === 'sign') {   // THE LETTERING: a canvas sign sheet, fitted
        out.push({ s: 'quad', p: [r3(p.x), r3(p.y), r3(p.z)], ry: RY[p.face] || undefined, size: [r3(p.w), r3(p.h)], key: 'txt:' + p.text + '|' + p.fg + '|' + p.bg + '|' + r3(p.w / p.h), uv: 'fit', kind: 'wall' });
    } else if (p.t === 'door') {   // a drawn double door, shut (a building with no inside)
        const v = { S: [0, 1], N: [0, -1], E: [1, 0], W: [-1, 0] }[p.face], ry = RY[p.face], al = p.face === 'S' || p.face === 'N' ? [1, 0] : [0, 1];
        [-0.5, 0.5].forEach(s => out.push({ s: 'quad', p: [r3(p.x + al[0] * s + v[0] * 0.07), 0, r3(p.z + al[1] * s + v[1] * 0.07)], ry, size: [1.0, 2.3], key: 'urban:DoorStorefrontHalf1a', uv: 'fit', kind: 'wall' }));
        out.push(clean({ s: 'quad', p: [r3(p.x + v[0] * 0.06), 2.3, r3(p.z + v[1] * 0.06)], ry: ry || undefined, size: [2.3, 0.25], tint: 0x2a2d33 }));
    }
    return out;
}

/* ══ THE POLISH PASS (mondo 11-13 20:15: "one more polish pass on the exteriors ... one or two more layers deep with the detail"): a second
   layer every building gets from its own shapes. Per ground wall block: a concrete plinth (split at the walk-in door), a belt course over
   the ground storey, a cornice + dentil band where none was drawn, two downpipes + a meter box, and on a free flat roof a parapet, an AC
   unit and vent stacks (never on a walked roof-route roof). Per walk-in door: stone pilasters, a canopy, two lamps. Per drawn shop door:
   an awning with a valance, a sign board (no lettering: his "no AI logos"), a blade sign. ══ */
/* THE LETTERING (the shared 'txt:WORDS|fg|bg|aspect' sign sheet, PR #1327): the name of each building, from the plan mondo approved */
const NAMES = { '4,0,0': 'FIRE STATION', '5,0,0': 'CIVIL RECORDS', '5,0,1': 'NOTARY + COPIES', '5,0,2': 'SIGN WORKSHOP', '6,0,0': 'CITY HALL', '7,0,0': 'COUNCIL ANNEX',
    '4,1,0': 'DISPATCH', '4,1,1': 'COFFEE + DONUTS', '5,1,0': 'CITY MOTOR POOL', '5,1,1': 'NEWS + FLOWERS', '7,1,0': 'COURTHOUSE', '7,1,1': 'COURT CAFE', '4,2,0': 'POLICE',
    '5,2,0': 'HOLDING ANNEX', '5,2,1': 'BAIL BONDS', '5,2,2': 'IMPOUND GARAGE', '6,2,0': 'RECORDS GARDEN', '7,2,0': 'TIME BUREAU', '7,2,1': 'WATCHMAKER', '5,3,0': 'PUBLIC LIBRARY',
    '6,3,0': 'MILITARY OFFICES', '6,3,1': 'ARMY SURPLUS', '6,3,2': 'ARMORY', '7,3,0': 'PERMIT OFFICES' };
const HEX = n => '#' + ('000000' + n.toString(16)).slice(-6);
const WALLK = /bricks|Plaster|Stucco|marble_light|Concrete|Corrugated/, AWN = [0xb03a2a, 0x2a6a4a, 0x2a4a8a, 0xc89a2a, 0x7a2a5a, 0x1f6f78];
function detail(Bd, D, walked, seed, name) {
    const src = Bd.parts, out = [], ghosts = [], add = p => out.push(p), TRIM = 0xe6e0d2, PIPE = 0x3a4046;
    const bx = (x0, z0, x1, z1, y0, y1, key, tint, o) => add({ t: 'box', x0: Math.min(x0, x1), z0: Math.min(z0, z1), x1: Math.max(x0, x1), z1: Math.max(z0, z1), y0, y1, key, tint, o: Object.assign({}, o) });
    const cy = (x, z, r, y0, y1, key, tint, o) => add({ t: 'cyl', x, z, r, y0, y1, key, tint, o: Object.assign({ seg: 6 }, o) });
    const fp = q => q.t === 'box' || q.t === 'roof' ? [q.x0, q.z0, q.x1, q.z1] : [q.x - q.r, q.z - q.r, q.x + q.r, q.z + q.r];
    const hit = (a, b, m) => a[0] < b[2] - m && a[2] > b[0] + m && a[1] < b[3] - m && a[3] > b[1] + m;
    let rnd = seed; const R = () => { rnd = (rnd * 9301 + 49297) % 233280; return rnd / 233280; };
    /* THE SHEETS (mondo 20:19 "different textures or decals for different parts of the building"): each building draws its own base, ground
       storey, roof deck and plant sheets from the urban pack (his sheets as they are, only tinted) */
    const pick = arr => arr[Math.floor(R() * arr.length) % arr.length];
    const PLINTH = pick([['u_ConcreteStriped1a', 0x9a9a98], ['u_ConcreteStriped2c', 0xb0aca4], ['u_TileGeneric1a', 0x8c9096], ['bricks_3', 0xd0c8c0], ['u_TileMarble1d', 0xb8b4ac], ['u_TileSubway3a', 0xa8aca8]]);
    const GROUND = pick([['u_PlasterWallStucco1a', 0xe8e0d0], ['u_ConcreteStriped1c', 0xd8d4cc], ['u_TileSubway1a', 0xe0e4e0], ['u_TileMarble1a', 0xe6e0d6], ['u_PlasterWallPainted1a', 0xd8d0c0], ['u_TileGeneric3a', 0xd0d4d8]]);
    const DECK = pick([['u_RubberNonSlip1a', 0xa0a4a8], ['u_RubberNonSlip3a', 0xb0b0b0], ['u_ConcreteStriped1c', 0xa8a8a4], ['u_TileGeneric2a', 0xa4a8ac], ['u_FibreCeilingTile1a', 0x9c9c98]]);
    const PLANT = pick(['u_MetalCorrugatedPainted1a', 'u_MetalCorrugatedPainted4a', 'u_MetalCorrugatedPainted1a']);
    /* the roof kit of one ground block: the roof level is the wall head or the low slab the design laid on it; whatever stands taller
       there (a drum, a tower, a pitched roof) is kept clear, the AC units take the free spots. A walked roof gets ghost walls round them. */
    const roofKit = b => {
        const H = b.y1, W = b.x1 - b.x0, Dp = b.z1 - b.z0; if (W < 5 || Dp < 5 || H < 3) return;
        const topOf = q => q.t === 'box' || q.t === 'cyl' ? q.y1 : q.y0 + q.h, In = [b.x0 + 0.6, b.z0 + 0.6, b.x1 - 0.6, b.z1 - 0.6];
        const on = src.filter(q => q !== b && q.y0 != null && q.y0 >= H - 0.8 && hit(fp(q), In, 0));
        const low = on.filter(q => q.t === 'box' && topOf(q) <= H + 1.0 && q.x1 - q.x0 > W * 0.7 && q.z1 - q.z0 > Dp * 0.7), tall = on.filter(q => low.indexOf(q) < 0);
        const RH = low.reduce((m, q) => Math.max(m, topOf(q)), H), t = 0.25, ph = 0.55, m0 = walked ? 2.6 : 1.0;
        if (!on.length && !walked) {
            bx(b.x0, b.z0, b.x1, b.z0 + t, RH, RH + ph, STONE, TRIM); bx(b.x0, b.z1 - t, b.x1, b.z1, RH, RH + ph, STONE, TRIM);
            bx(b.x0, b.z0 + t, b.x0 + t, b.z1 - t, RH, RH + ph, STONE, TRIM); bx(b.x1 - t, b.z0 + t, b.x1, b.z1 - t, RH, RH + ph, STONE, TRIM);
        }
        if (!tall.length) bx(b.x0 + t, b.z0 + t, b.x1 - t, b.z1 - t, RH, RH + 0.04, DECK[0], DECK[1]);
        const taken = tall.map(fp), want = W * Dp > 300 ? 4 : W * Dp > 150 ? 3 : W * Dp > 60 ? 2 : 1; let got = 0;
        for (let tr = 0; tr < 40 && got < want; tr++) {
            const ax = b.x0 + m0 + R() * (W - 2 * m0 - 1.8), az = b.z0 + m0 + R() * (Dp - 2 * m0 - 1.2), F2 = [ax - 0.5, az - 0.5, ax + 2.3, az + 1.7];
            if (W - 2 * m0 < 1.8 || Dp - 2 * m0 < 1.2 || taken.some(f => hit(f, F2, 0))) continue;
            taken.push(F2); got++;
            bx(ax - 0.1, az - 0.1, ax + 1.9, az + 1.3, RH, RH + 0.15, null, 0x55585c); bx(ax, az, ax + 1.8, az + 1.2, RH + 0.15, RH + 1.05, PLANT, 0xe8ecf0);
            bx(ax + 0.1, az - 0.02, ax + 1.7, az, RH + 0.3, RH + 0.9, 'u_MetalSubwayGrill1a', null); cy(ax + 0.9, az + 0.6, 0.42, RH + 1.05, RH + 1.12, null, 0x2c2f33, { seg: 10 });
            cy(ax + 2.05, az + 0.3, 0.1, RH, RH + 0.7, null, 0x8a8f94); cy(ax + 2.05, az + 0.3, 0.17, RH + 0.7, RH + 0.78, null, 0x6a6f74);
            if (walked) ghosts.push([ax, az + 0.6, ax + 1.8, az + 0.6, RH + 1.05, 1.2]);
        }
    };
    src.forEach(b => {
        if (b.t === 'box' && b.key && !(b.o && b.o.alpha) && b.y1 - b.y0 >= 2.5 && !(WALLK.test(b.key) && b.y0 === 0 && b.y1 >= 5.5)) roofKit(b);   // the upper tiers, the glass blocks, the low shops: the roof only
        if (b.t !== 'box' || !WALLK.test(b.key || '') || b.y0 !== 0 || b.y1 < 5.5 || b.x1 - b.x0 < 5 || b.z1 - b.z0 < 5 || (b.o && b.o.alpha)) return;
        const F = [b.x0, b.z0, b.x1, b.z1], H = b.y1, g = 0.07;
        /* the plinth: four strips, the door's side in two */
        const strip = (side, a0, a1, gg, y0, y1, key, tint) => { if (a1 - a0 < 0.3) return; if (side === 'N') bx(a0, b.z0 - gg, a1, b.z0, y0, y1, key, tint, { top: 0 }); else if (side === 'S') bx(a0, b.z1, a1, b.z1 + gg, y0, y1, key, tint, { top: 0 }); else if (side === 'W') bx(b.x0 - gg, a0, b.x0, a1, y0, y1, key, tint, { top: 0 }); else bx(b.x1, a0, b.x1 + gg, a1, y0, y1, key, tint, { top: 0 }); };
        const skin = (gg, y0, y1, key, tint) => ['N', 'S', 'W', 'E'].forEach(side => {
            const ns = side === 'N' || side === 'S', a0 = (ns ? b.x0 : b.z0) - gg, a1 = (ns ? b.x1 : b.z1) + gg, pl = { S: b.z1, N: b.z0, E: b.x1, W: b.x0 }[side];
            if (D && D.side === side && Math.abs(pl - D.plane) < 0.4 && a0 < D.at && a1 > D.at) { strip(side, a0, D.at - D.cw / 2 - 0.3, gg, y0, y1, key, tint); strip(side, D.at + D.cw / 2 + 0.3, a1, gg, y0, y1, key, tint); if (y1 > 2.9) { const yy = Math.max(y0, 2.6); strip(side, D.at - D.cw / 2 - 0.3, D.at + D.cw / 2 + 0.3, gg, yy, y1, key, tint); } }
            else strip(side, a0, a1, gg, y0, y1, key, tint);
        });
        skin(g, 0, 0.55, PLINTH[0], PLINTH[1]);
        /* the ground storey in its own sheet (brick / plaster houses; the stone landmarks keep their stone) */
        if (/bricks|Plaster|Stucco/.test(b.key) && H >= 6.5 && GROUND[0] !== b.key) skin(0.035, 0.55, 3.32, GROUND[0], GROUND[1]);
        /* the belt course over the ground storey */
        if (H >= 6.5) bx(b.x0 - 0.06, b.z0 - 0.06, b.x1 + 0.06, b.z1 + 0.06, 3.32, 3.5, STONE, TRIM, { top: 0 });
        /* the cornice + dentil band, where the design drew nothing on the wall head */
        const above = src.filter(q => q !== b && (q.y0 != null) && q.y0 >= H - 0.8 && q.y0 <= H + 0.6 && hit(fp(q), F, 0.2));
        if (!above.length) {
            bx(b.x0 - 0.1, b.z0 - 0.1, b.x1 + 0.1, b.z1 + 0.1, H - 0.5, H - 0.3, STONE, TRIM, { top: 0 });
            bx(b.x0 - 0.24, b.z0 - 0.24, b.x1 + 0.24, b.z1 + 0.24, H - 0.3, H + 0.02, STONE, TRIM, { top: 0 });
        }
        /* THE ROOF (mondo 20:18 "roofs and ac units"): on a free flat roof a parapet, AC units on kerbs, a duct run, vent stacks, a hatch.
           Low slabs the design laid on the wall head (a cornice slab) lift the roof level; anything taller there means the roof is taken. */
        roofKit(b);
        /* the wall AC units: on the upper storeys of the brick / plaster houses (never the stone landmarks) */
        if (/bricks|Plaster|Stucco/.test(b.key) && H >= 6.5) for (let u = 0, nW = 2 + Math.floor(R() * 3); u < nW; u++) {
            const side = 'NSWE'[Math.floor(R() * 4)], ns = side === 'N' || side === 'S', len = ns ? b.x1 - b.x0 : b.z1 - b.z0, a = (ns ? b.x0 : b.z0) + 1 + R() * (len - 2.7), y = 3.5 * (1 + Math.floor(R() * Math.max(1, Math.floor((H - 3.5) / 3.5)))) + 0.9;
            if (y + 0.5 > H - 0.6) continue; const pl = { N: b.z0, S: b.z1, W: b.x0, E: b.x1 }[side], sg = side === 'N' || side === 'W' ? -1 : 1;
            if (ns) { bx(a, pl, a + 0.75, pl + sg * 0.5, y, y + 0.45, null, 0xb4b9be); bx(a + 0.06, pl + sg * 0.5, a + 0.69, pl + sg * 0.52, y + 0.06, y + 0.39, null, 0x3a3e43); bx(a - 0.03, pl, a + 0.78, pl + sg * 0.42, y - 0.05, y, null, 0x30343a); }
            else { bx(pl, a, pl + sg * 0.5, a + 0.75, y, y + 0.45, null, 0xb4b9be); bx(pl + sg * 0.5, a + 0.06, pl + sg * 0.52, a + 0.69, y + 0.06, y + 0.39, null, 0x3a3e43); bx(pl, a - 0.03, pl + sg * 0.42, a + 0.78, y - 0.05, y, null, 0x30343a); }
        }
        /* two downpipes with a shoe + a hopper, a meter box */
        [[b.x0 - 0.1, b.z0 + 0.5], [b.x1 + 0.1, b.z1 - 0.5]].forEach((c, i) => {
            cy(c[0], c[1], 0.06, 0.1, H - 0.5, null, PIPE); bx(c[0] - 0.12, c[1] - 0.12, c[0] + 0.12, c[1] + 0.12, H - 0.5, H - 0.25, null, PIPE);
            [2.2, H - 2].forEach(y => { if (y > 1 && y < H - 0.8) bx(c[0] - 0.09, c[1] - 0.09, c[0] + 0.09, c[1] + 0.09, y, y + 0.06, null, 0x25282c); });
            if (i === 0) bx(c[0] - 0.08, c[1] + 0.5, c[0] + 0.1, c[1] + 1.1, 0.9, 1.7, null, 0x7d8388);
        });
    });
    /* the walk-in door: pilasters, a canopy on brackets, two lamps */
    if (D) {
        const v = { S: [0, 1], N: [0, -1], E: [1, 0], W: [-1, 0] }[D.side], ns = D.side === 'S' || D.side === 'N', hw = D.cw / 2;
        const P = (a, t) => ns ? [D.at + a, D.plane + v[1] * t] : [D.plane + v[0] * t, D.at + a];
        const seg = (a0, a1, t0, t1, y0, y1, key, tint, o) => { const A = P(a0, t0), Bq = P(a1, t1); bx(A[0], A[1], Bq[0], Bq[1], y0, y1, key, tint, o); };
        [-1, 1].forEach(sg => { seg(sg * (hw + 0.12), sg * (hw + 0.52), 0, 0.22, 0, 2.75, STONE, TRIM); seg(sg * (hw + 0.06), sg * (hw + 0.58), 0, 0.28, 0, 0.3, STONE, TRIM); seg(sg * (hw + 0.06), sg * (hw + 0.58), 0, 0.28, 2.55, 2.75, STONE, TRIM);
            seg(sg * (hw + 0.2), sg * (hw + 0.44), 0.22, 0.95, 2.75, 2.87, null, 0x30343a);                                                   // the bracket
            const L = P(sg * (hw + 0.95), 0.12); bx(L[0] - 0.1, L[1] - 0.1, L[0] + 0.1, L[1] + 0.1, 2.05, 2.4, null, 0xfff0c0, { glow: 0.9 }); bx(L[0] - 0.13, L[1] - 0.13, L[0] + 0.13, L[1] + 0.13, 2.4, 2.46, null, 0x25282c); });
        seg(-hw - 0.75, hw + 0.75, 0, 1.1, 2.87, 3.05, null, 0x30343a); seg(-hw - 0.6, hw + 0.6, 0.02, 0.1, 3.05, 3.6, null, 0x23262b); if (name) { const A = P(0, 0.11); add({ t: 'sign', x: A[0], z: A[1], y: 3.11, face: D.side, w: 2 * hw + 1.1, h: 0.44, text: name, fg: '#e8c860', bg: '#23262b' }); } else seg(-hw - 0.45, hw + 0.45, 0.1, 0.13, 3.15, 3.5, 'gold', null);   // the canopy, the name board, its gilt plate
    }
    /* a drawn shop door: an awning + valance, a sign board, a blade sign */
    src.filter(q => q.t === 'door' && !q.plain).forEach((d, i) => {   // (a `plain` door: a house, no shop front)
        const v = { S: [0, 1], N: [0, -1], E: [1, 0], W: [-1, 0] }[d.face], ns = d.face === 'S' || d.face === 'N', col = AWN[(seed + i * 3) % AWN.length];
        const P = (a, t) => ns ? [d.x + a, d.z + v[1] * t] : [d.x + v[0] * t, d.z + a];
        const seg = (a0, a1, t0, t1, y0, y1, key, tint, o) => { const A = P(a0, t0), Bq = P(a1, t1); bx(A[0], A[1], Bq[0], Bq[1], y0, y1, key, tint, o); };
        const A = P(-1.9, 0.05), Bq = P(1.9, 1.35);
        add({ t: 'roof', shape: 'shed', x0: Math.min(A[0], Bq[0]), z0: Math.min(A[1], Bq[1]), x1: Math.max(A[0], Bq[0]), z1: Math.max(A[1], Bq[1]), y0: 2.55, h: 0.65, key: null, tint: col, o: { high: { S: 'N', N: 'S', E: 'W', W: 'E' }[d.face], ds: true } });
        seg(-1.9, 1.9, 1.3, 1.35, 2.3, 2.56, null, 0xf2ead8); for (let a = -1.9; a < 1.8; a += 0.76) seg(a, a + 0.38, 1.352, 1.36, 2.3, 2.56, null, col);
        seg(-2.0, 2.0, 0.03, 0.14, 3.3, 4.0, null, 0x23262b); if (name) { const A2 = P(0, 0.15); add({ t: 'sign', x: A2[0], z: A2[1], y: 3.38, face: d.face, w: 3.8, h: 0.54, text: name, fg: '#ffffff', bg: HEX(col) }); } else seg(-1.8, 1.8, 0.14, 0.17, 3.45, 3.85, null, col, { glow: 0.2 });
        seg(2.3, 2.38, 0.05, 0.85, 2.9, 3.6, null, col); seg(2.28, 2.4, 0.05, 0.9, 3.6, 3.66, null, 0x25282c);
    });
    out.ghosts = ghosts; return out;
}

/* ══ THE INTERIORS (mondo 11-13 21:04 "let's go ahead and do the interiors"; his OK on the floor plans 21:21). The rules he set at 21:14 +
   21:17: the grid is the 3.5 m battle square; a BARRIER takes whole squares and stands centred on them; a walkway is whole squares wide;
   DRESSING stands off centre, flat on a wall or inside a barrier's own square. So every square of a room is a barrier square or a clear one.
   One `inside(key, x0, z0, fn)` per walk-in (x0, z0 = the shell's north-west corner in plot metres, on the grid). In fn:
     put(key, col, row, face, o)   a prop on the middle of a square (o.dx / o.dz = off the middle: dressing; o.h = a height)
     bar(col, row, nc, nr)         the squares are a barrier: an unseen low wall fills them, whatever the props on them block
     wallI(c0, r0, c1, r1)         a partition on the grid lines (drawn + unseen wall)    column(col, row, top)    flagI(col, row, dx, dz, tint)
   Faces: a prop's `face` is the renderer's HEADING of its +Z front: 0 looks north (-z), 90 east, 180 south (+z), 270 west. FS / FW / FN / FE
   below name the way a prop LOOKS. (Until the second pass they were written 0 = south, so every first-pass prop showed the room its back.) ══ */
/* THE HOLLOW: a walk-in's massing is drawn from the outside in whole blocks, so where two blocks meet inside the shell their faces (and the
   plinth / ground-storey strips, pipes and wall units the polish pass hung on them) stood in the room. Under the room's ceiling those
   inner faces go; over it each keeps a thin strip (the taller block's wall over the lower roof). */
function hollow(list, S0) {
    const r = S0.r, Hc = S0.st * C, cav = [r[0] + 1, r[1] + 1, r[2] - 1, r[3] - 1], G = [r[0] - 0.4, r[1] - 0.4, r[2] + 0.4, r[3] + 0.4], out = [];
    list.forEach(p => {
        if (p.t === 'cyl') { if (p.r < 3 && p.x > cav[0] && p.x < cav[2] && p.z > cav[1] && p.z < cav[3] && p.y0 < Hc - 0.3) { if (p.y1 <= Hc + 0.6) return; p = Object.assign({}, p, { y0: Hc }); } out.push(p); return; }
        if (p.t !== 'box' || p.y0 >= Hc - 0.3) { out.push(p); return; }
        const cuts = p.x0 < cav[2] && p.x1 > cav[0] && p.z0 < cav[3] && p.z1 > cav[1]; if (!cuts) { out.push(p); return; }
        const within = p.x0 >= G[0] && p.x1 <= G[2] && p.z0 >= G[1] && p.z1 <= G[3], thin = Math.min(p.x1 - p.x0, p.z1 - p.z0) < 0.8;
        if (thin) { if (!within) { out.push(p); return; } if (p.y1 <= Hc + 0.6) return; out.push(Object.assign({}, p, { y0: Hc })); return; }
        let nf = '';
        if (p.z0 > cav[1] && p.z0 < cav[3]) nf += 'N'; if (p.z1 > cav[1] && p.z1 < cav[3]) nf += 'S'; if (p.x0 > cav[0] && p.x0 < cav[2]) nf += 'W'; if (p.x1 > cav[0] && p.x1 < cav[2]) nf += 'E';
        if (!nf) { out.push(p); return; }
        out.push(Object.assign({}, p, { o: Object.assign({}, p.o, { nf }) }));
        if (p.y1 > Hc + 0.3 && p.key) nf.split('').forEach(sd => { const t = 0.03, q = { t: 'box', y0: Hc, y1: p.y1, key: p.key, tint: p.tint, o: { top: 0 } };
            if (sd === 'N') Object.assign(q, { x0: p.x0, x1: p.x1, z0: p.z0, z1: p.z0 + t }); else if (sd === 'S') Object.assign(q, { x0: p.x0, x1: p.x1, z0: p.z1 - t, z1: p.z1 });
            else if (sd === 'W') Object.assign(q, { x0: p.x0, x1: p.x0 + t, z0: p.z0, z1: p.z1 }); else Object.assign(q, { x0: p.x1 - t, x1: p.x1, z0: p.z0, z1: p.z1 });
            q.o.nf = { N: 'SWE', S: 'NWE', W: 'NSE', E: 'NSW' }[sd]; out.push(q); });
    });
    return out;
}
const INSIDE = {};
const inside = (key, x0, z0, fn) => { INSIDE[key] = { key, x0, z0, fn }; };
const FS = 180, FW = 270, FN = 0, FE = 90;
function runInside(I, room) {
    const out = { props: [], parts: [], ghosts: [] }, x0 = I.x0, z0 = I.z0, keep = bld;
    bld = { parts: out.parts };
    const mid = (col, row, nc, nr) => [x0 + (col + (nc || 1) / 2) * C, z0 + (row + (nr || 1) / 2) * C];
    const api = {
        put: (key, col, row, face, o) => { o = o || {}; const m = mid(col, row, o.nc, o.nr); let x = m[0] + (o.dx || 0), z = m[1] + (o.dz || 0);
            /* THE SECOND PASS: a wall piece set out toward an OUTER wall hangs flat on the lining (it stood 7 cm off the shell, behind the lining's
               face 17 cm in); a cabinet / locker / shelf on a square against the outer wall behind it stands with its back on that wall */
            if (room && !o.free) { const R = room.r, g = 0.17, ncl = Math.round((R[2] - R[0]) / C), nrw = Math.round((R[3] - R[1]) / C), cW = col === 0, cE = col + (o.nc || 1) === ncl, rN = row === 0, rS = row + (o.nr || 1) === nrw, wd = WALLD[key], bd = BACKD[key], dx = o.dx || 0, dz = o.dz || 0;
                if (wd != null) { if (dx > 1.3 && cE) x = R[2] - g - wd / 2 - 0.02; else if (dx < -1.3 && cW) x = R[0] + g + wd / 2 + 0.02; if (dz > 1.3 && rS) z = R[3] - g - wd / 2 - 0.02; else if (dz < -1.3 && rN) z = R[1] + g + wd / 2 + 0.02; }
                else if (bd != null) { const hd = ((face || 0) % 360 + 360) % 360;
                    if (hd === 180 && rN && !o.dz) z = R[1] + g + bd / 2 + 0.03; else if (hd === 0 && rS && !o.dz) z = R[3] - g - bd / 2 - 0.03; else if (hd === 90 && cW && !o.dx) x = R[0] + g + bd / 2 + 0.03; else if (hd === 270 && cE && !o.dx) x = R[2] - g - bd / 2 - 0.03; } }
            const q = { key, x: r3(x), z: r3(z), face: face || 0, floor: true }; if (o.h) q.h = o.h; if (o.span) q.span = o.span; if (o.r) q.r = o.r; if (o.y != null) { q.y = r3(o.y); q.mount = 0; } out.props.push(q); },
        bar: (col, row, nc, nr) => { nc = nc || 1; nr = nr || 1; const m = mid(col, row, nc, nr), hw = nc * C / 2 - 0.45, t = nr * C - 0.9; out.ghosts.push([m[0] - hw, m[1], m[0] + hw, m[1], 1.1, t]); },
        wallI: (c0, r0, c1, r1, h) => { const a = [x0 + c0 * C, z0 + r0 * C], b = [x0 + c1 * C, z0 + r1 * C], t = 0.1; h = h || 3.2;
            box(Math.min(a[0], b[0]) - t, Math.min(a[1], b[1]) - t, Math.max(a[0], b[0]) + t, Math.max(a[1], b[1]) + t, 0, h, 'u_PlasterWallPainted1a', 0xd8d4c8, { top: 1 });
            box(Math.min(a[0], b[0]) - t - 0.02, Math.min(a[1], b[1]) - t - 0.02, Math.max(a[0], b[0]) + t + 0.02, Math.max(a[1], b[1]) + t + 0.02, 0, 0.9, null, 0x6f7a72, { top: 0 });
            out.ghosts.push([a[0], a[1], b[0], b[1], h, 0.3]); },
        column: (col, row, top) => { const m = mid(col, row); cyl(m[0], m[1], 0.55, 0, top, STONE, 0xe6e0d2, { seg: 12 }); box(m[0] - 0.75, m[1] - 0.75, m[0] + 0.75, m[1] + 0.75, 0, 0.35, STONE, 0xe6e0d2); api.bar(col, row); },
        flagI: (col, row, dx, dz, tint) => { const m = mid(col, row), x = m[0] + dx, z = m[1] + dz; cyl(x, z, 0.04, 0, 2.5, null, 0x8a7a4a, { seg: 6 }); cyl(x, z, 0.18, 0, 0.08, null, 0x4a4a4a, { seg: 8 }); box(x + 0.05, z - 0.02, x + 0.95, z + 0.02, 1.7, 2.4, null, tint || 0x2a56b0); },
        mid, x0, z0,
    };
    /* THE LINING: the shell draws no inside (skin: false), so the room wears its own: four walls (the door's wall in three panels round
       the doorway), a dado, a ceiling, a floor sheet. room = { r: [x0, z0, x1, z1], st, D } */
    /* THE SECOND PASS's LOOK[key] (api.look) dresses the same lining: `wall` [key, tint] + `gain` / `glow` (the room's light: the city's ten real
       lights are spent outside, so a lining is lit by its own glow), `H` a lower ceiling, `ceil` [key, tint, glow, gain], `floor` [key, tint, gain],
       `dado` false (the second pass's own wainscot) or [key, tint, height, gain] */
    api.line = (wallKey, wallTint, floorKey, floorTint, dado) => { if (!room) return; const L = api.look || {}, r = room.r, H = L.H || room.st * C - 0.12, g = 0.17, D = room.D;
        if (L.wall) { wallKey = L.wall[0]; wallTint = L.wall[1]; } const dd = L.dado === false ? null : Array.isArray(L.dado) ? L.dado : [null, dado, 1.0];
        const panel = (side, a0, a1, y0, y1, key, tint, off, lit) => { if (a1 - a0 < 0.05 || y1 - y0 < 0.05) return; const ns = side === 'N' || side === 'S', pl = { N: r[1] + g + (off || 0), S: r[3] - g - (off || 0), W: r[0] + g + (off || 0), E: r[2] - g - (off || 0) }[side], m = (a0 + a1) / 2;
            bld.parts.push(Object.assign({ t: 'iq', x: ns ? m : pl, z: ns ? pl : m, y: y0, w: a1 - a0, h: y1 - y0, ry: { N: 0, S: 180, W: 270, E: 90 }[side], key, tint }, lit || {})); };
        ['N', 'S', 'W', 'E'].forEach(side => { const ns = side === 'N' || side === 'S', a0 = (ns ? r[0] : r[1]) + g, a1 = (ns ? r[2] : r[3]) - g;
            const run = (b0, b1, y0) => { panel(side, b0, b1, y0, H, wallKey, wallTint, 0, { gain: L.gain, glow: L.glow }); if (y0 < 1 && dd) panel(side, b0, b1, 0, dd[2], dd[0], dd[1], 0.02, { gain: dd[3], glow: L.glow }); };
            if (D && D.side === side) { const d0 = D.at - D.cw / 2 - 0.12, d1 = D.at + D.cw / 2 + 0.12; run(a0, d0, 0); run(d1, a1, 0); run(d0, d1, 2.35); } else run(a0, a1, 0); });
        const cl = L.ceil || ['u_FibreCeilingTile1a', 0xe8e8e0];
        box(r[0] + g, r[1] + g, r[2] - g, r[3] - g, H, H + 0.05, cl[0], cl[1], Object.assign({ under: 1, top: 0 }, cl[2] ? { glow: cl[2], roof: 1 } : {}, cl[3] ? { gain: cl[3] } : {}));
        if (L.floor) { floorKey = L.floor[0]; floorTint = L.floor[1]; }
        box(r[0] + g, r[1] + g, r[2] - g, r[3] - g, 0, 0.07, floorKey, floorTint, L.floor && L.floor[2] ? { gain: L.floor[2] } : {}); };
    api.look = LOOK[I.key] || null; api.props = out.props; api.room = room;
    I.fn(api);
    if (room && SECOND[I.key]) SECOND[I.key](api, kit(api, room));   // THE SECOND PASS
    bld = keep; return out;
}
/* the sets: a few lockers / cabinets / chairs on one square */
const row3 = (A, key, col, row, face, o) => [-0.62, 0, 0.62].forEach(d => A.put(key, col, row, face, Object.assign({}, o, (face === FS || face === FN) ? { dx: d + ((o && o.dx) || 0) } : { dz: d + ((o && o.dz) || 0) })));
const deskSet = (A, col, row, face, chair) => { A.put('tanker_desk', col, row, face); const b = { [FS]: [0, -1.05], [FN]: [0, 1.05], [FE]: [-1.05, 0], [FW]: [1.05, 0] }[face]; A.put(chair || 'computer_chair_blue', col, row, face, { dx: b[0], dz: b[1] }); A.bar(col, row); };

inside('4,0,0', 7, 7, A => {
    A.line('u_PlasterWallPainted1a', 0xe6dcc8, 'u_ConcreteStriped1c', 0xb8b8b4, 0x8a2a22);                                                      // FIRE STATION, 8 x 8
    [0, 1].forEach(r => { A.put('fire_truck', 0, r, FE, { nc: 3, span: 7.4 });   /* 7.4 m long = 3.3 m wide: the two stood 55 cm in each other and in the wall */ A.bar(0, r, 3, 1); });
    [4, 5, 6].forEach(c => { row3(A, 'locker', c, 0, FS); A.bar(c, 0); }); A.put('locker_bench', 5, 0, FS, { dz: -0.3, dx: -1.2 }); A.put('locker_bench', 5, 0, FS, { dz: -0.3, dx: 1.2 });
    { const m = A.mid(4, 3); cyl(m[0], m[1], 0.09, 0, 7, ALU, 0xe8d8a0, { seg: 8 }); cyl(m[0], m[1], 0.7, 0, 0.12, null, 0x8a2a22, { seg: 14 }); A.bar(4, 3); }   // the fire pole on its pad
    deskSet(A, 6, 3, FW, 'cafeteria_chair'); A.put('tube_map', 7, 3, FW, { dx: 1.68 });
    [[0, 6], [1, 6], [0, 7], [1, 7]].forEach(c => { A.put('dorm_bed', c[0], c[1], FS); A.bar(c[0], c[1]); });
    /* (THE INTERIOR POLISH 2026-11-15: `round_table` is Camelot's Round Table with its own twelve chairs; at h 0.78 it was 3.2 m across, in both squares at once, the mess chairs inside it. The tulip table, 1.5 m across) */
    [[4, 6], [5, 7]].forEach(c => { A.put('tulip_table', c[0], c[1], 0, { r: 0.75 }); [[-0.84, -0.63], [0.84, 0.63], [-0.78, 0.7]].forEach(d => A.put('cafeteria_chair', c[0], c[1], FS, { dx: d[0], dz: d[1] })); A.bar(c[0], c[1]); });
    A.put('steel_table', 7, 6, FW); A.put('mini_fridge', 7, 6, FW, { dx: 1.3, dz: -1.25 }); A.put('water_cooler', 7, 6, FW, { dx: 1.3, dz: 1.2 });
    A.put('kitchen_range', 7, 7, FW); A.put('sink', 7, 7, FW, { dx: 1.3, dz: 1.2 }); A.bar(7, 6, 1, 2);
    [3, 4].forEach(r => A.put('wall_shelf', 0, r, FE, { dx: -1.6 })); A.put('fire_extinguisher', 0, 2, FE, { dx: -1.6, dz: 1.2 }); A.put('fire_extinguisher', 3, 0, FS, { dz: -1.6, dx: 1.2 });
    A.wallI(3, 5, 6, 5); A.wallI(7, 5, 8, 5); A.wallI(3, 5, 3, 7);
});
inside('5,0,0', 24.5, 10.5, A => {
    A.line('u_PlasterWallStucco1a', 0xd8dccf, 'u_TileGeneric3a', 0xc8ccd0, 0x4a5a52);                                                // CIVIL RECORDS, 2 x 3
    deskSet(A, 1, 1, FW, 'computer_chair_blue'); [0, 1].forEach(c => { row3(A, 'filing_cabinet', c, 0, FS); A.bar(c, 0); });
    A.put('vault', 1, 2, FW, { h: 3.1 }); A.bar(1, 2); A.put('wall_shelf', 1, 1, FW, { dx: 1.68, dz: -1.0 }); A.put('punch_clock', 0, 2, FE, { dx: -1.66, dz: 0.9 });
});
inside('6,0,0', 7, 7, A => {
    A.line('marble_light', 0xf0e8d8, 'u_TileMarble1a', 0xe8e4dc, 0x6a5a48);                                                      // CITY HALL, 8 x 7
    A.put('reception_wedge', 3, 4, FS); A.put('reception_wedge', 4, 4, FS); A.bar(3, 4, 2, 1);
    [2, 3, 4].forEach(r => deskSet(A, 0, r, FE)); [0, 1].forEach(c => { row3(A, 'filing_cabinet', c, 0, FS); A.bar(c, 0); });
    A.put('exec_desk', 4, 0, FS); A.put('exec_chair', 4, 0, FS, { dz: -1.15 }); A.flagI(4, 0, -1.35, -1.3, 0x2a56b0); A.bar(4, 0);
    A.put('curved_office_couch', 6, 1, FN); A.put('coffee_table', 6, 1, 0, { dx: -1.2, dz: 1.1 }); A.bar(6, 1); A.put('curved_sofa', 7, 0, FS); A.bar(7, 0);
    A.column(2, 3, 13.9); A.column(5, 3, 13.9); A.flagI(2, 3, -1.3, 1.3, 0x2a56b0); A.flagI(5, 3, 1.3, 1.3, 0xb03a2a);
    [3, 4].forEach(r => { A.put('metro_bench', 7, r, FW); A.bar(7, r); }); A.put('office_plant', 7, 3, 0, { dx: -1.2, dz: -1.3 }); A.put('water_cooler', 7, 4, FW, { dx: 1.35, dz: 1.3 });
    A.wallI(2, 2, 3, 2, 3.4); A.wallI(4, 2, 6, 2, 3.4); A.wallI(2, 0, 2, 2, 3.4); A.wallI(6, 0, 6, 2, 3.4); A.put('world_clocks', 5, 2, FS, { dz: -1.58 });
});
inside('7,0,0', 10.5, 7, A => {
    A.line('u_PlasterWallPainted1a', 0xdfe6ea, 'u_TileMarble1d', 0xd8d8d4, 0x3a4a5a);                                                   // COUNCIL ANNEX, 4 x 3
    [0, 1, 2, 3].forEach(c => { A.put('tanker_desk', c, 0, FS); A.put('exec_chair', c, 0, FS, { dz: -1.1 }); A.bar(c, 0); });
    A.put('lectern', 1, 1, FN); A.put('meshy_microphone', 1, 1, FN, { dx: 0.9, dz: -0.9 }); A.bar(1, 1);
    [[0, 2], [1, 2], [3, 2]].forEach(c => { row3(A, 'folding_chair', c[0], c[1], FN); A.bar(c[0], c[1]); });
    A.flagI(0, 0, -1.4, 1.2, 0x2a56b0); A.put('potted_plant', 3, 0, 0, { dx: 1.3, dz: 1.2 });
});
inside('7,1,0', 3.5, 3.5, A => {
    A.line('marble_light', 0xf0e8d8, 'u_TileMarble2d', 0xe0dcd4, 0x5a4636);                                                  // COURTHOUSE, 4 x 2
    A.put('judges_bench', 0, 0, FE); A.put('exec_chair', 0, 0, FE, { dx: -1.15 }); A.flagI(0, 0, -1.4, -1.4, 0x2a56b0); A.bar(0, 0);   // the plan's JUDGE'S BENCH (was an exec desk)
    A.put('witness_stand', 0, 1, FE); A.bar(0, 1);                                                                                          // the plan's WITNESS STAND (was a lectern)
    [0, 1].forEach(r => { A.put('steel_table', 1, r, FW); A.put('folding_chair', 1, r, FW, { dx: 1.1 }); A.bar(1, r); A.put('church_pew', 3, r, FW); A.bar(3, r); });
});
inside('4,2,0', 3.5, 7, A => {
    A.line('u_PlasterWallPainted1a', 0xc8d4e4, 'u_TileGeneric1a', 0xb0b4b8, 0x2a3a5a);                                                    // POLICE, 3 x 5
    [0, 1, 2].forEach(c => { A.put('dorm_bed', c, 0, FE, { dz: -0.9 }); A.bar(c, 0); });
    { const z = A.z0 + C, x = A.x0; for (let k = 0; k < 42; k++) cyl(x + 0.125 + k * 0.25, z, 0.03, 0, 2.6, null, 0x3a3f46, { seg: 5 }); box(x, z - 0.05, x + 10.5, z + 0.05, 2.6, 2.75, null, 0x3a3f46); box(x, z - 0.05, x + 10.5, z + 0.05, 0, 0.1, null, 0x3a3f46);
      [1, 2].forEach(c => box(x + c * C - 0.06, A.z0, x + c * C + 0.06, z, 0, 2.75, 'u_ConcreteStriped1a', 0xa8a8a8, { top: 0 })); }   // the bars + the cell walls
    A.put('reception_wedge', 1, 2, FE); A.bar(1, 2); deskSet(A, 0, 2, FE); deskSet(A, 0, 3, FE);
    row3(A, 'locker', 0, 4, FN); A.put('water_cooler', 0, 4, FE, { dx: -1.4, dz: -1.3 }); A.bar(0, 4); A.put('library_shelf', 1, 4, FN); A.bar(1, 4); A.put('metro_bench', 2, 4, FN); A.bar(2, 4);
    A.put('tube_map', 2, 1, FW, { dx: 1.68 });
});
inside('7,2,0', 24.5, 3.5, A => {
    A.line('u_PlasterWallStucco1a', 0xe8dcc0, 'u_TileMarble3c', 0xd8d0c0, 0x6a4a2a);                                                 // TIME BUREAU, 3 x 4
    [0, 1, 2].forEach(c => { A.put('server_rack', c, 0, FS, { dx: -0.55 }); A.put('server_rack', c, 0, FS, { dx: 0.55 }); A.bar(c, 0); });
    A.put('exec_desk', 2, 1, FW); A.put('exec_chair', 2, 1, FW, { dx: 1.15 }); A.bar(2, 1);   // the second pass moved the desk + the great clock a square east:
    A.put('gclock', 2, 2, FW, { h: 4.2 }); A.bar(2, 2); A.put('curved_office_couch', 0, 3, FE); A.put('potted_plant', 0, 3, 0, { dx: 1.2, dz: -1.3 }); A.bar(0, 3);   // ... from the door no walk reached the east half
    [1, 2].forEach(r => A.put('world_clocks', 2, r, FW, { dx: 1.66 })); A.put('punch_clock', 0, 1, FE, { dx: -1.66 }); [0, 1, 2].forEach(c => A.put('wall_clock', c, 3, FN, { dz: 1.66 }));
});
inside('6,3,0', 17.5, 28, A => {
    A.line('u_PlasterWallPainted1a', 0xc4c8a8, 'u_ConcreteStriped1a', 0xa8a8a0, 0x4a5a3a);                                                  // MILITARY OFFICES, 4 x 4
    A.put('map_table', 1, 2, FN, { nc: 2, span: 3.0 }); A.bar(1, 2, 2, 1);   // the plan's MAP TABLE (was a conference table), a row south: on row 1 it shut rows 2 off from the door
    A.put('library_shelf', 0, 1, FE, { dz: -0.85 }); A.put('psx_ammo_box_1', 0, 1, 0, { dx: 1.1, dz: 1.2 }); A.bar(0, 1); row3(A, 'locker', 0, 2, FE); A.bar(0, 2);
    deskSet(A, 3, 1, FW, 'cafeteria_chair'); row3(A, 'filing_cabinet', 3, 3, FW); A.bar(3, 3);
    A.put('psx_supply_crate_1', 0, 3, 0); A.put('psx_wooden_crate_1', 0, 3, 0, { dx: 1.1, dz: -1.1 }); A.bar(0, 3);
    [1, 2].forEach(c => { row3(A, 'folding_chair', c, 3, FN); A.bar(c, 3); });
    A.put('lectern', 3, 2, FW); A.flagI(3, 2, 1.3, 1.3, 0x4a6a3a); A.bar(3, 2); A.put('tube_map', 1, 3, FN, { dz: 1.68, dx: 1.75 });
});
inside('7,3,0', 7, 7, A => {
    A.line('u_PlasterWallPainted1a', 0xe4e0d0, 'u_TileGeneric2a', 0xc0c4c8, 0x5a6a7a);                                                      // PERMIT OFFICES, 8 x 8
    [1, 2, 3, 4, 5].forEach(c => deskSet(A, c, 4, FN)); [5, 6, 7].forEach(r => { row3(A, 'filing_cabinet', 0, r, FE); A.bar(0, r); });
    [2, 3, 4].forEach(c => deskSet(A, c, 6, FS)); A.put('library_shelf', 1, 7, FN); A.bar(1, 7);
    A.put('exec_desk', 7, 7, FN); A.put('exec_chair', 7, 7, FN, { dz: 1.15 }); A.bar(7, 7);
    A.column(2, 2, 3.45); A.column(5, 2, 3.45);
    [[1, 1], [2, 1], [5, 1], [6, 1], [3, 2], [4, 2]].forEach(c => { row3(A, 'molded_chair', c[0], c[1], FS); A.bar(c[0], c[1]); });
    [0, 7].forEach(c => A.put('potted_plant', c, 0, 0, { h: 1.7, dx: c ? 1.2 : -1.2, dz: -1.2 }));   // dressing in the corners (second pass): as barriers they shut the hall off from the door A.put('punch_clock', 5, 0, FS, { dz: -1.66 });
    A.wallI(0, 5, 7, 5); A.wallI(6, 6, 8, 6); A.wallI(6, 6, 6, 7);
});

/* ══ THE SECOND PASS (2026-11-15, mondo 11-13 22:33: "after a district's first interior pass, do another interior pass ... make a list of models
   needed/wanted but not in the bucket or game, and make meshy versions of them ... Focus on aesthetic, vibe, atmosphere for the interiors").
   Each walk-in keeps its first pass and gets: LOOK[key] (the lining lit by its own glow, a lower ceiling where an office stood in a 10-14 m
   shaft, a lit ceiling deck), then SECOND[key](A, K): panelling / tile / dado + rails, crown, coffers, pilasters, daylit windows, lamps that
   are drawn and glow (no real light: the city room's ten are spent outside), rugs, lettering, wall pieces flat on the lining, the 24 Civic
   Meshy pieces (data.js "THE CIVIC INTERIOR PIECES") + other districts' (high_bay_lamp, ships_bell, radio_console, evidence_board, map_table,
   marble_bust, wingback_chair, painting_portrait, crystal_chandelier, brass_orrery, banker_lamp). THE SQUARES (mondo 11-13 21:14 + 21:17): a new
   blocking piece takes a whole square (A.bar) and leaves every walkway connected; dressing stands off the middles, flat on a wall or inside
   a barrier's own square. Swapped stand-ins for the plan's own names: the Courthouse's exec desk -> judges_bench, its lectern -> witness_stand,
   the Military conference table -> map_table. ══ */
const WALLD = { tube_map: 0.05, punch_clock: 0.22, world_clocks: 0.1, wall_clock: 0.08, wall_shelf: 0.25, fire_extinguisher: 0.15 };   // a wall piece's depth
const BACKD = { locker: 0.45, filing_cabinet: 0.55, library_shelf: 0.6, server_rack: 0.8, kitchen_range: 0.75 };                       // a back-to-the-wall piece's depth
const WARM = 0xffe2a8, COOL = 0xf2f8ff, GILT = 'gold';
function kit(A, room) {
    const L = A.look || {}, r = room.r, D = room.D, g = 0.17, H = L.H || room.st * C - 0.12, NC = Math.round((r[2] - r[0]) / C), NR = Math.round((r[3] - r[1]) / C);
    const Q = q => { bld.parts.push({ t: 'raw', q }); return q; };
    const nrm = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] }, RYQ = { N: 0, S: 180, W: 270, E: 90 }, HD = { N: 180, S: 0, W: 90, E: 270 };
    const ns = s => s === 'N' || s === 'S', plane = s => ({ N: r[1] + g, S: r[3] - g, W: r[0] + g, E: r[2] - g })[s];
    const at = (s, a, off) => ns(s) ? [a, plane(s) + nrm[s][1] * off] : [plane(s) + nrm[s][0] * off, a];        // a point `off` in front of wall s, `a` along it
    const span = s => ns(s) ? [r[0] + g, r[2] - g] : [r[1] + g, r[3] - g];
    const door = s => D && D.side === s ? [D.at - D.cw / 2 - 0.12, D.at + D.cw / 2 + 0.12] : null;
    const mat = (key, tint, o) => Object.assign({ key: KEY(key), tint, uv: key ? UV(key) : undefined }, o || {});
    const B = (x, y, z, w, h, d, key, tint, o) => Q(Object.assign({ s: 'box', p: [r3(x), r3(y), r3(z)], size: [r3(w), r3(h), r3(d)] }, mat(key, tint, o)));
    const Cy = (x, y, z, rad, h, key, tint, o) => Q(Object.assign({ s: 'cyl', p: [r3(x), r3(y), r3(z)], r: r3(rad), h: r3(h), seg: 14 }, mat(key, tint, o)));
    /* a sheet on wall s from a0 to a1 (along it), y0..y1, `off` in front of the lining; below the door head it leaves the doorway */
    const sheet = (s, a0, a1, y0, y1, key, tint, o, off) => { off = off == null ? 0.02 : off; const d = door(s), pc = [];
        if (d && y0 < 2.35 && a0 < d[1] && a1 > d[0]) { pc.push([a0, Math.min(a1, d[0]), y0, Math.min(y1, 2.35)], [Math.max(a0, d[1]), a1, y0, Math.min(y1, 2.35)]); if (y1 > 2.35) pc.push([a0, a1, 2.35, y1]); } else pc.push([a0, a1, y0, y1]);
        pc.forEach(p => { if (p[1] - p[0] < 0.05 || p[3] - p[2] < 0.03) return; const c = at(s, (p[0] + p[1]) / 2, off);
            Q(Object.assign({ s: 'quad', p: [r3(c[0]), r3(p[2]), r3(c[1])], ry: RYQ[s] || undefined, size: [r3(p[1] - p[0]), r3(p[3] - p[2])], kind: 'wall' }, mat(key, tint, o))); }); };
    const walls = (fn, sides) => ['N', 'S', 'W', 'E'].forEach(s => { if (!sides || sides.indexOf(s) >= 0) { const sp = span(s); fn(s, sp[0], sp[1]); } });
    const coat = (y0, y1, key, tint, o, off, sides) => walls((s, a0, a1) => sheet(s, a0, a1, y0, y1, key, tint, o, off), sides);
    /* a band round the walls (skirting, rail, crown): `t` proud of the lining, broken at the doorway below its head */
    const band = (y, h, t, key, tint, o, sides) => walls((s, a0, a1) => { const d = door(s), sg = d && y < 2.4 ? [[a0, d[0]], [d[1], a1]] : [[a0, a1]];
        sg.forEach(q => { const w = q[1] - q[0]; if (w < 0.05) return; const c = at(s, (q[0] + q[1]) / 2, t / 2 + 0.01); B(c[0], y, c[1], ns(s) ? w : t, h, ns(s) ? t : w, key, tint, o); }); }, sides);
    const liner = o => { if (o.wains) { coat(0, o.wains[2], o.wains[0], o.wains[1], o.wains[3] || { gain: 1.2, glow: 0.1 }); band(o.wains[2] - 0.04, 0.08, 0.05, o.rail ? o.rail[0] : null, o.rail ? o.rail[1] : 0x3a2418, o.rail ? o.rail[2] : undefined); }
        band(0, 0.16, 0.04, o.skirt ? o.skirt[0] : null, o.skirt ? o.skirt[1] : 0x2a2420, o.skirt ? o.skirt[2] : undefined);
        if (o.crown) band(H - 0.32, 0.3, 0.12, o.crown[0], o.crown[1], Object.assign({ under: true }, o.crown[2] || {})); };
    /* coffer beams under the ceiling on the squares' lines (every `every` squares) */
    const coffers = (every, key, tint, deep, o) => { deep = deep || 0.4; o = Object.assign({ under: true }, o || {});
        for (let k = every; k < NC; k += every) B(r[0] + k * C, H - deep, (r[1] + r[3]) / 2, 0.3, deep - 0.02, r[3] - r[1] - 0.4, key, tint, o);
        for (let k = every; k < NR; k += every) B((r[0] + r[2]) / 2, H - deep, r[1] + k * C, r[2] - r[0] - 0.4, deep - 0.02, 0.3, key, tint, o); };
    const panel = (x, z, w, d, tint) => { B(x, H - 0.07, z, w + 0.12, 0.05, d + 0.12, null, 0x9a9ea6, { under: true }); B(x, H - 0.09, z, w, 0.03, d, null, tint || COOL, { glow: 1, under: true }); };
    const strip = (x, z, len, alongZ, tint, drop) => { drop = drop || 0.5; const s2 = alongZ ? [0.22, len] : [len, 0.22];
        B(x, H - drop, z, s2[0], 0.07, s2[1], null, 0xd8dce2, { under: true }); B(x, H - drop - 0.02, z, s2[0] * 0.7, 0.03, s2[1] * 0.94, null, tint || COOL, { glow: 1, under: true });
        [-1, 1].forEach(k => Cy(x + (alongZ ? 0 : k * len * 0.4), H - drop + 0.07, z + (alongZ ? k * len * 0.4 : 0), 0.012, drop - 0.07, null, 0x24272c, { seg: 4, cap: false })); };
    const pend = (x, z, y, shadeKey, shadeTint, bulb, rad, o) => { rad = rad || 0.3; Cy(x, y + 0.26, z, 0.012, H - y - 0.26, null, 0x202020, { seg: 4, cap: false });
        Cy(x, y, z, rad, 0.28, shadeKey, shadeTint, Object.assign({ r2: r3(rad * 0.25), ds: true, cap: false }, o || {})); Cy(x, y - 0.06, z, rad * 0.32, 0.14, null, bulb || WARM, { glow: 1, seg: 10, under: true }); };
    const sconce = (s, a, y, tint) => { const c = at(s, a, 0.03), c2 = at(s, a, 0.16), al = !ns(s);
        B(c[0], y - 0.2, c[1], al ? 0.04 : 0.16, 0.4, al ? 0.16 : 0.04, GILT, 0xffffff, { gain: 1.5 }); B(c2[0], y, c2[1], 0.2, 0.26, 0.2, null, tint || WARM, { glow: 1 }); B(c2[0], y + 0.26, c2[1], 0.24, 0.04, 0.24, GILT, 0xffffff, { gain: 1.5 }); };
    /* a daylit window (the facade's glass stands for it): a frame, a lit sky sheet, a muntin cross */
    const win = (s, a, y, w, h, frame) => { frame = frame || 0x3a2a1c; const al = !ns(s);
        sheet(s, a - w / 2 - 0.15, a + w / 2 + 0.15, y - 0.12, y + h + 0.12, null, frame, {}, 0.025); sheet(s, a - w / 2, a + w / 2, y, y + h, null, 0xd8ecfa, { glow: 0.85 }, 0.035);
        const c = at(s, a, 0.06); B(c[0], y + h / 2 - 0.03, c[1], al ? 0.05 : w, 0.06, al ? w : 0.05, null, frame); B(c[0], y, c[1], al ? 0.05 : 0.06, h, al ? 0.06 : 0.05, null, frame); };
    const pilaster = (s, a, key, tint, w, cap, top) => { w = w || 0.6; top = top || H; const c = at(s, a, 0.09), al = !ns(s);
        B(c[0], 0, c[1], al ? 0.16 : w, top - 0.3, al ? w : 0.16, key, tint, { gain: 1.4 }); B(c[0], 0, c[1], al ? 0.26 : w + 0.2, 0.45, al ? w + 0.2 : 0.26, key, tint, { gain: 1.4 });
        B(c[0], top - 0.75, c[1], al ? 0.26 : w + 0.2, 0.36, al ? w + 0.2 : 0.26, cap ? cap[0] : key, cap ? cap[1] : tint, { gain: 1.5 }); };
    const rug = (x, z, w, d, key, tint, o) => Q(Object.assign({ s: 'quad', p: [r3(x), 0.085, r3(z)], size: [r3(w), r3(d)], flat: true }, mat(key, tint, o)));
    /* lettering on a wall: board `bg` ('' = the letters alone) */
    const sign = (s, a, y, w, h, words, fg, bg, glow) => { const c = at(s, a, 0.05);
        Q({ s: 'quad', p: [r3(c[0]), r3(y), r3(c[1])], ry: RYQ[s] || undefined, size: [r3(w), r3(h)], key: 'txt:' + words + '|' + fg + '|' + (bg || '') + '|' + r3(w / h), uv: 'fit', kind: bg ? 'wall' : 'over', glow: glow || undefined }); };
    /* a prop: room-plot (x, z), heading hd (0 = its front to -z / north) */
    const P = (key, x, z, hd, o) => { const q = Object.assign({ key, x: r3(x), z: r3(z), face: ((hd || 0) % 360 + 360) % 360, floor: true }, o || {}); if (q.y != null) { q.y = r3(q.y); q.mount = 0; } A.props.push(q); return q; };
    /* a piece flat on wall s (its back on the lining), `a` along the wall, `y` its foot, `depth` its depth */
    const hang = (key, s, a, y, depth, o) => { const c = at(s, a, (depth || 0.1) / 2 + 0.025); return P(key, c[0], c[1], HD[s], Object.assign({ y }, o || {})); };
    const sq = (c, rw) => A.mid(c, rw);
    const X = k => r[0] + k * C, Z = k => r[1] + k * C;
    return { r, D, H, NC, NR, B, Cy, Q, sheet, coat, band, liner, coffers, panel, strip, pend, sconce, win, pilaster, rug, sign, P, hang, sq, X, Z, at, HD };
}
const LOOK = {
    '4,0,0': { wall: ['u_PlasterWallPainted1a', 0xf2e8d4], gain: 1.25, glow: 0.16, ceil: ['u_FibreCeilingTile1a', 0xf4f0e6, 0.7, 1.2], dado: false },                       // FIRE STATION
    '5,0,0': { wall: ['u_PlasterWallStucco1a', 0xe2e6d4], gain: 1.25, glow: 0.16, ceil: ['u_FibreCeilingTile1a', 0xf6f6ee, 0.6, 1.2], dado: false },                        // CIVIL RECORDS
    '6,0,0': { wall: ['marble_light', 0xf4ecdc], gain: 1.5, glow: 0.14, ceil: ['u_PlasterWallStucco1a', 0xf6eedc, 0.8, 1.3], dado: false },                                // CITY HALL
    '7,0,0': { wall: ['u_PlasterWallPainted1a', 0xdfe8f0], gain: 1.25, glow: 0.15, ceil: ['u_PlasterWallStucco1a', 0xf4f0e6, 0.8, 1.3], dado: false, floor: ['calm_carpet', 0x34467a, 1.2] },   // COUNCIL ANNEX
    '7,1,0': { H: 7.0, wall: ['u_PlasterWallStucco1a', 0xeee2c8], gain: 1.25, glow: 0.15, ceil: ['u_PlasterWallStucco1a', 0xf2e8d4, 0.8, 1.3], dado: false, floor: ['calm_planks', 0xc09060, 1.15] },   // COURTHOUSE
    '4,2,0': { H: 4.2, wall: ['u_PlasterWallPainted1a', 0xd4dde8], gain: 1.25, glow: 0.15, ceil: ['u_FibreCeilingTile1a', 0xf2f4f6, 0.6, 1.2], dado: ['u_PlasterWallPainted1a', 0x34466a, 1.2, 1.1] },   // POLICE
    '7,2,0': { H: 7.0, wall: ['u_PlasterWallStucco1a', 0x6a7eaa], gain: 1.2, glow: 0.2, ceil: ['u_PlasterWallStucco1a', 0x2e3a66, 0.55, 1.0], dado: false },              // TIME BUREAU
    '6,3,0': { H: 4.4, wall: ['u_PlasterWallPainted1a', 0xe6e2cc], gain: 1.25, glow: 0.15, ceil: ['u_FibreCeilingTile1a', 0xeeeee4, 0.6, 1.2], dado: ['u_PlasterWallPainted1a', 0x56663e, 1.2, 1.1] },   // MILITARY OFFICES
    '7,3,0': { wall: ['u_PlasterWallPainted1a', 0xece6d6], gain: 1.25, glow: 0.16, ceil: ['u_FibreCeilingTile1a', 0xf4f4ee, 0.55, 1.2], dado: ['u_PlasterWallPainted1a', 0x2f6a6e, 1.0, 1.1] },   // PERMIT OFFICES
};
const SECOND = {
    /* THE FIRE STATION: a cream glazed-tile firehouse. Tile to 1.5 m under a red band, a red apparatus floor with yellow bay lines, green
       high-bay lamps + strip lights over the engines, the turnout gear rack by the lockers, breathing-air rack, hose racks, the ladders on the
       crew partition, the brass bell by the door, the watch desk's radio; red pendants over the mess, a lit bunk room, a notice board + menu board. */
    '4,0,0': (A, K) => { const { X, Z, sq, H } = K;
        K.liner({ wains: ['u_TileSubway1a', 0xf2ecdc, 1.5, { gain: 1.2, glow: 0.12 }], rail: [null, 0xa82a20, { glow: 0.08 }], skirt: [null, 0x5a1a14], crown: [null, 0xe8e0cc] });
        K.band(1.36, 0.06, 0.05, null, 0x1e1e1e);
        K.rug((X(0) + X(8)) / 2, (Z(0) + Z(5)) / 2, 8 * C - 0.4, 5 * C - 0.3, 'calm_concrete', 0x9a3428, { gain: 1.1 });                                 // the apparatus floor
        [[0, 0], [0, 1]].forEach(b => { const x0 = X(b[0]) + 0.25, x1 = X(b[0] + 3) - 0.25, z0 = Z(b[1]) + 0.25, z1 = Z(b[1] + 1) - 0.25;              // the bay lines
            K.rug((x0 + x1) / 2, z0, x1 - x0, 0.12, null, 0xf0c020, { glow: 0.2 }); K.rug((x0 + x1) / 2, z1, x1 - x0, 0.12, null, 0xf0c020, { glow: 0.2 }); K.rug(x1, (z0 + z1) / 2, 0.12, z1 - z0, null, 0xf0c020, { glow: 0.2 }); });
        K.rug((X(0) + X(3)) / 2, (Z(5) + Z(8)) / 2, 3 * C - 0.4, 3 * C - 0.4, 'calm_carpet', 0x4a5a6a);                                                // the bunk room
        K.rug((X(3) + X(8)) / 2, (Z(5) + Z(8)) / 2, 5 * C - 0.4, 3 * C - 0.4, 'calm_planks', 0xb88a5a, { gain: 1.1 });                                // the mess + kitchen
        [[1, 3], [3, 1], [5, 1], [6, 2]].forEach(c => { const m = sq(c[0], c[1]); K.Cy(m[0], H - 1.3, m[1], 0.02, 1.3, null, 0x202020, { seg: 4, cap: false }); K.P('high_bay_lamp', m[0], m[1], 0, { y: H - 2.2 }); K.Cy(m[0], H - 2.2, m[1], 0.24, 0.03, null, WARM, { glow: 1, under: true }); });
        [0, 1].forEach(rw => K.strip((X(0) + X(3)) / 2, sq(0, rw)[1], 7.5, false, COOL, 0.6));
        [[4, 6], [5, 7]].forEach(c => { const m = sq(c[0], c[1]); K.pend(m[0], m[1], 2.4, null, 0xb8402a, WARM, 0.32); });
        K.panel(X(1), sq(0, 6)[1] + C / 2, 1.2, 2.4); K.strip(sq(7, 6)[0] - 0.6, Z(6) + C, 6.0, true, COOL, 0.4);
        K.P('turnout_gear_rack', sq(3, 0)[0], K.r[1] + 0.17 + 0.27, 180); A.bar(3, 0);                                                                     // the gear rack by the lockers
        K.hang('scba_rack', 'N', sq(7, 0)[0], 0.9, 0.39); K.hang('ships_bell', 'E', sq(7, 1)[1], 2.1, 0.3);
        K.hang('hose_rack', 'W', sq(0, 2)[1] - 0.6, 0.9, 0.48); K.hang('hose_rack', 'W', sq(0, 4)[1] + 1.1, 0.9, 0.48);
        K.P('ladder_wall_rack', X(4.5), Z(5) - 0.12 - 0.18, 0, { y: 1.1 });                                                                               // on the crew partition, over the walk
        K.P('radio_console', sq(6, 3)[0] + 1.2, sq(6, 3)[1] - 1.2, 270);
        K.hang('notice_board', 'S', sq(2, 7)[0], 1.2, 0.06); K.P('chalkboard', X(3) + 0.13 + 0.05, sq(3, 6)[1], 90, { y: 1.0 });
        K.sign('N', X(5) + C / 2, 3.2, 6.2, 0.8, 'FIRE STATION', '#ffffff', '#a82a20', 0.15);
    },
    /* CIVIL RECORDS: a small sage-green records office. Oak wainscot, a lit panel ceiling, the card catalogue by the counter, an old CRT
       terminal on it, a runner from the door, RECORDS over the shelf. */
    '5,0,0': (A, K) => { const { X, Z, sq } = K;
        K.liner({ wains: ['calm_planks', 0xb08050, 1.1], rail: [null, 0x4a3020], skirt: [null, 0x2a2018], crown: [null, 0xf0eee4] });
        [[0, 1], [1, 0], [1, 2]].forEach(c => { const m = sq(c[0], c[1]); K.panel(m[0], m[1], 1.2, 0.6); });
        K.rug(sq(0, 1)[0], (Z(1) + Z(3)) / 2, 1.6, 2 * C - 0.5, 'calm_carpet', 0x2e5a44);
        K.P('card_catalog', K.r[2] - 0.17 - 0.3, sq(1, 1)[1] + 1.15, 270);
        K.P('crt_terminal', sq(1, 1)[0], sq(1, 1)[1] - 0.35, 90, { y: 0.76 });
        K.sign('E', sq(1, 1)[1], 2.45, 2.2, 0.42, 'RECORDS', '#f0e6c8', '#2e4a3a', 0.1);
    },
    /* CITY HALL: a marble civic hall. Green marble dado under a gilt rail, cream marble walls, marble pilasters with gilt capitals, a coffered
       lit ceiling, clerestory daylight, two crystal chandeliers, a red runner from the door to the information desk, CITY HALL in gilt over
       the door under the city seal; the mayor's office panelled in walnut on a red rug, the seal behind the desk, two portraits, two wingbacks
       facing the desk, a green lamp; busts on the column squares, the city model under glass, a ballot box at the desk, the directory. */
    '6,0,0': (A, K) => { const { X, Z, sq, H, D } = K;
        K.liner({ wains: ['u_TileMarble1a', 0x3a6a52, 1.4, { gain: 1.2, glow: 0.1 }], rail: [GILT, 0xffffff, { gain: 1.5 }], skirt: ['u_TileMarble1a', 0x1e3a2a], crown: ['marble_light', 0xece2cc, { gain: 1.5 }] });
        K.band(4.2, 0.24, 0.1, 'marble_light', 0xece2cc, { gain: 1.5 });
        K.sheet('N', X(2) + 0.12, X(6) - 0.12, 0, 3.0, 'calm_planks', 0x6a3c22, { gain: 1.2, glow: 0.1 }, 0.045); K.B((X(2) + X(6)) / 2, 2.98, K.r[1] + 0.17 + 0.06, 4 * C - 0.3, 0.08, 0.06, GILT, 0xffffff, { gain: 1.5 });   // the mayor's walnut
        K.coffers(2, 'marble_light', 0xe8dcc4, 0.7, { gain: 1.4 });
        for (let k = 1; k < 7; k++) { K.pilaster('W', Z(k), 'marble_light', 0xf2eadc, 0.7, [GILT, 0xffffff]); K.pilaster('E', Z(k), 'marble_light', 0xf2eadc, 0.7, [GILT, 0xffffff]); }
        [1, 2, 3, 6, 7].forEach(k => K.pilaster('S', X(k), 'marble_light', 0xf2eadc, 0.7, [GILT, 0xffffff]));
        for (let k = 0; k < 7; k++) { K.win('W', sq(0, k)[1], 7.4, 1.9, 3.6); K.win('E', sq(0, k)[1], 7.4, 1.9, 3.6); } [0, 1, 6, 7].forEach(c => K.win('S', sq(c, 6)[0], 7.4, 1.9, 3.6));
        for (let k = 0; k < 7; k++) { if (k > 1) K.sconce('W', sq(0, k)[1], 3.0); K.sconce('E', sq(0, k)[1], 3.0); }
        [[X(4), Z(3) + 0.2], [X(4), Z(5.3)]].forEach(c => { K.Cy(c[0], 9.9, c[1], 0.025, H - 9.9, GILT, 0xffffff, { seg: 6, cap: false, gain: 1.5 }); K.P('crystal_chandelier', c[0], c[1], 0, { y: 8.5 }); });
        K.rug(sq(4, 6)[0] - 0.4, (Z(5) + Z(7)) / 2, 2.2, 2 * C - 0.3, 'carpet', 0x8a1a24); K.rug(sq(4, 1)[0], sq(4, 1)[1] - 0.6, 3.2, 3.4, 'carpet', 0x7a1a24);
        K.sign('S', D.at, 2.5, 4.0, 0.6, 'CITY HALL', '#e8c46a', '', 0.3); K.P('city_seal', D.at, K.r[3] - 0.17 - 0.08, 0, { y: 3.3, span: 2.4 });
        K.hang('city_seal', 'N', sq(4, 0)[0], 2.0, 0.1); K.hang('painting_portrait', 'N', sq(3, 0)[0], 1.3, 0.1); K.hang('painting_portrait', 'N', sq(5, 0)[0], 1.3, 0.1);
        [-0.8, 0.8].forEach(d => K.P('wingback_chair', sq(4, 0)[0] + d, sq(4, 0)[1] + 1.3, 0)); K.P('banker_lamp', sq(4, 0)[0] + 0.7, sq(4, 0)[1] - 0.1, 0, { y: 0.76 });
        K.P('marble_bust', sq(2, 3)[0] + 1.15, sq(2, 3)[1] - 1.15, 180); K.P('marble_bust', sq(5, 3)[0] - 1.15, sq(5, 3)[1] - 1.15, 180);
        K.P('city_scale_model', sq(1, 5)[0], sq(1, 5)[1], 90); A.bar(1, 5);                                                                                // the city scale model
        K.P('ballot_box', sq(3, 4)[0] - 1.25, sq(3, 4)[1] + 1.2, 180);
        K.hang('directory_board', 'S', D.at + 2.6, 0.9, 0.06);
    },
    /* THE COUNCIL ANNEX: a walnut-panelled chamber on a navy carpet. A gilt rail, coffers, brass globe pendants over the public, a lit strip
       over the dais, the city seal behind the councillors, portraits on the side walls, daylight high on the side walls, microphones on the desks. */
    '7,0,0': (A, K) => { const { X, Z, sq, H } = K;
        K.liner({ wains: ['calm_planks', 0x5a3420, 2.4], rail: [GILT, 0xffffff, { gain: 1.5 }], skirt: [null, 0x24160c], crown: ['calm_planks', 0x4a2a18] });
        K.coffers(1, 'calm_planks', 0x4a2a18, 0.4);
        [0, 1, 3].forEach(c => K.pend(sq(c, 2)[0], sq(c, 2)[1], 3.4, GILT, 0xffffff, 0xfff0d0, 0.28, { gain: 1.5 })); K.strip((X(0) + X(4)) / 2, sq(0, 0)[1] + 0.6, 12, false, WARM, 0.6);
        K.hang('city_seal', 'N', (X(0) + X(4)) / 2, 2.7, 0.1);
        K.hang('painting_portrait', 'W', sq(0, 1)[1], 1.3, 0.1); K.hang('painting_portrait', 'E', sq(3, 1)[1], 1.3, 0.1);
        [0, 2].forEach(rw => { K.win('W', sq(0, rw)[1], 3.0, 1.5, 2.4); K.win('E', sq(3, rw)[1], 3.0, 1.5, 2.4); });
        [0, 1, 2, 3].forEach(c => K.P('meshy_microphone', sq(c, 0)[0] + 0.3, sq(c, 0)[1] + 0.15, 180, { y: 0.76 }));
        K.sign('N', (X(0) + X(4)) / 2, 4.6, 4.4, 0.6, 'COUNCIL ANNEX', '#e8c46a', '', 0.3);
    },
    /* THE COURTHOUSE: a walnut courtroom under a 7 m coffered ceiling. Panelling to 3 m, the wall behind the bench panelled to 4.6 m with the
       city seal, the judge's bench and the witness stand (the plan's own names), Lady Justice by the stand, a turned bar rail before the
       gallery, a red aisle runner, opal schoolhouse pendants, daylit windows, green lamps on the counsel tables. */
    '7,1,0': (A, K) => { const { X, Z, sq, H, r } = K;
        K.liner({ wains: ['calm_planks', 0x5a3420, 3.0], rail: ['calm_planks', 0x2e1a0e], skirt: [null, 0x1e120a], crown: ['calm_planks', 0x4a2a18] });
        K.sheet('W', r[1] + 0.17, r[3] - 0.17, 3.0, 4.6, 'calm_planks', 0x4a2a18, { gain: 1.2, glow: 0.1 }, 0.045); K.B(r[0] + 0.17 + 0.07, 4.56, (r[1] + r[3]) / 2, 0.1, 0.1, 2 * C - 0.4, GILT, 0xffffff, { gain: 1.5 });
        K.coffers(1, 'calm_planks', 0x4a2a18, 0.5);
        K.hang('city_seal', 'W', (r[1] + r[3]) / 2, 3.0, 0.1, { span: 1.4 });
        K.P('lady_justice', sq(0, 1)[0] - 1.2, sq(0, 1)[1] + 1.15, 90);
        { const x = X(3) - 0.08; for (let z = r[1] + 0.3; z < r[3] - 0.2; z += 0.45) K.Cy(x, 0.07, z, 0.035, 0.85, 'calm_planks', 0x4a2a18, { seg: 6 }); K.B(x, 0.9, (r[1] + r[3]) / 2, 0.1, 0.08, 2 * C - 0.4, 'calm_planks', 0x3a2010); K.B(x, 0.07, (r[1] + r[3]) / 2, 0.08, 0.08, 2 * C - 0.4, 'calm_planks', 0x3a2010); }
        K.rug(sq(2, 0)[0], (Z(0) + Z(2)) / 2, 1.6, 2 * C - 0.3, 'carpet', 0x6a1a20);
        [[1, 0], [1, 1], [3, 0], [3, 1]].forEach(c => K.pend(sq(c[0], c[1])[0], sq(c[0], c[1])[1], 3.6, null, 0xf6f0de, WARM, 0.26, { glow: 0.5 }));
        [0, 1].forEach(rw => { K.win('E', sq(3, rw)[1], 3.6, 1.4, 2.6); K.sconce('E', sq(3, rw)[1] + (rw ? 1.25 : -1.25), 2.4); });
        [1, 2, 3].forEach(c => K.win('N', sq(c, 0)[0], 3.6, 1.4, 2.6));
        [0, 1].forEach(rw => K.P('banker_lamp', sq(1, rw)[0], sq(1, rw)[1] + 0.5, 270, { y: 0.76 }));
    },
    /* THE POLICE STATION: navy lower walls under pale blue, a white stripe, a lit panel ceiling at 4.2 m; cages over the cells, a steel toilet
       in each, the height chart by the door, the riot rack by the bench, the evidence board facing the desks, POLICE behind the reception. */
    '4,2,0': (A, K) => { const { X, Z, sq, r } = K;
        K.liner({ skirt: [null, 0x14181e] }); K.band(1.18, 0.07, 0.04, null, 0xe8ecf0, { glow: 0.1 });
        for (let rw = 1; rw < 5; rw++) for (let c = 0; c < 3; c++) { const m = sq(c, rw); K.panel(m[0], m[1], 1.2, 0.6); }
        K.rug((X(0) + X(3)) / 2, sq(0, 0)[1] - 0.05, 3 * C - 0.4, C - 0.35, 'calm_concrete', 0x7a7e84);
        [0, 1, 2].forEach(c => { const m = sq(c, 0); K.pend(m[0] - 0.3, m[1] + 0.2, 3.0, null, 0x3a3f46, 0xfff4d8, 0.16); K.P('steel_toilet', m[0] + 1.18, m[1] + 0.45, 270); });
        K.hang('mugshot_wall', 'E', sq(2, 3)[1], 0, 0.03);
        K.P('riot_gear_rack', r[2] - 0.17 - 0.25, sq(2, 4)[1] + 0.1, 270);
        K.P('evidence_board', sq(1, 3)[0], sq(1, 3)[1], 270); A.bar(1, 3);
        [2, 3].forEach(rw => { const m = sq(0, rw); K.P('psx_pc_monitor_mp_1', m[0] + 0.1, m[1] - 0.35, 270, { y: 0.76 }); K.P('psx_walkie_talkie_1', m[0] + 0.15, m[1] + 0.45, 270, { y: 0.76 }); });
        K.sign('W', Z(3), 2.45, 2.6, 0.55, 'POLICE', '#ffffff', '#1e2e5a', 0.15); K.hang('notice_board', 'W', sq(0, 1)[1], 1.2, 0.06);
    },
    /* THE TIME BUREAU: a night-blue clock hall under a 7 m starry ceiling. Walnut wainscot with a gilt rail and crown, brass pendants, the
       astronomical clock over the wall clocks, an hourglass and the orrery either side of the great clock, a blue rug before the couch,
       TIME BUREAU in gilt over the time servers. */
    '7,2,0': (A, K) => { const { X, Z, sq, H, r } = K;
        K.liner({ wains: ['calm_planks', 0x5a3420, 1.6], rail: [GILT, 0xffffff, { gain: 1.5 }], skirt: [null, 0x1e120a], crown: [GILT, 0xffffff, { gain: 1.4 }] });
        { let s = 9; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647; for (let i = 0; i < 90; i++) { const x = r[0] + 0.5 + rnd() * (r[2] - r[0] - 1), z = r[1] + 0.5 + rnd() * (r[3] - r[1] - 1), w = 0.04 + rnd() * 0.05;
            K.B(x, H - 0.03, z, w, 0.02, w, null, 0xfff6d8, { glow: 1, under: true }); } }
        [[0, 1], [2, 1], [0, 3], [2, 3]].forEach(c => { const m = sq(c[0], c[1]); K.pend(m[0], m[1], 3.4, GILT, 0xffffff, WARM, 0.3, { gain: 1.5 }); });
        K.hang('astronomical_clock', 'S', sq(1, 3)[0], 3.75, 0.09);
        K.P('giant_hourglass', sq(2, 2)[0], sq(2, 2)[1] - 1.25, 270); K.B(sq(2, 2)[0], 0, sq(2, 2)[1] + 1.25, 0.62, 0.8, 0.62, 'calm_marble', 0x2a2a34, { gain: 1.2 }); K.P('brass_orrery', sq(2, 2)[0], sq(2, 2)[1] + 1.25, 270, { y: 0.8 });
        K.rug(sq(1, 3)[0], sq(1, 3)[1] - 0.2, 2.8, 2.6, 'carpet', 0x1e2e66);
        K.sign('N', (X(0) + X(3)) / 2, 2.6, 5.4, 0.6, 'TIME BUREAU', '#e8c46a', '', 0.35);
        [0, 3].forEach(rw => K.sconce('E', sq(2, rw)[1], 2.6)); K.sconce('W', sq(0, 0)[1], 2.6); K.sconce('W', sq(0, 3)[1], 2.6);
    },
    /* THE MILITARY OFFICES: olive lower walls under cream, a tan stripe, a lit ceiling at 4.4 m, strip lights, green enamel lamps over the map
       table (the plan's map table), a rifle rack beside the weapon shelf, footlockers, a field radio on the radio desk and the radio console beside it. */
    '6,3,0': (A, K) => { const { X, Z, sq } = K;
        K.liner({ skirt: [null, 0x1a1e14] }); K.band(1.18, 0.07, 0.04, null, 0xc8b88a);
        [1, 3].forEach(rw => K.strip((X(0) + X(4)) / 2, sq(0, rw)[1] - 0.2, 12, false, COOL, 0.45)); [0, 2].forEach(rw => K.strip((X(0) + X(4)) / 2, sq(0, rw)[1], 12, false, COOL, 0.45));
        [1, 2].forEach(c => K.pend(sq(c, 2)[0] + (c === 1 ? 0.6 : -0.6), sq(c, 2)[1], 2.6, null, 0x2e5a36, WARM, 0.32));
        K.P('rifle_rack', K.r[0] + 0.17 + 0.32, sq(0, 1)[1] + 0.9, 90);
        K.P('footlocker', sq(0, 2)[0] - 0.65, sq(0, 2)[1], 90); K.P('footlocker', sq(0, 3)[0] - 1.0, sq(0, 3)[1] + 1.05, 90);
        K.P('field_radio', sq(3, 1)[0], sq(3, 1)[1] + 0.45, 90, { y: 0.76 }); K.P('radio_console', sq(3, 1)[0] + 1.2, sq(3, 1)[1] - 1.25, 270);
        K.sign('S', (X(0) + X(4)) / 2, 2.85, 5.6, 0.5, 'MILITARY OFFICES', '#f0e8c8', '#3e4a2a', 0.12);
    },
    /* THE PERMIT OFFICES: a teal and cream service hall under a lit panel ceiling. A now-serving sign and a numbered board over each window,
       the take-a-number by the door, brochure racks, two form counters on whole squares, a copier in the back office, the exit sign. */
    '7,3,0': (A, K) => { const { X, Z, sq, D } = K;
        K.liner({ skirt: [null, 0x1a2a2c] }); K.band(0.98, 0.06, 0.04, null, 0xb8c0c4);
        for (let rw = 0; rw < 8; rw++) for (let c = 0; c < 8; c++) if ((c + rw) % 2 === 0) { const m = sq(c, rw); K.panel(m[0], m[1], 1.2, 0.6); }
        [1, 2, 3, 4, 5].forEach((c, i) => { const x = sq(c, 4)[0], z = Z(5) - 0.12; K.P('now_serving_sign', x, z - 0.09, 0, { y: 2.35 });
            K.Q({ s: 'quad', p: [r3(x), 1.8, r3(z - 0.02)], ry: 180, size: [0.5, 0.42], key: 'txt:' + (i + 1) + '|#ffffff|#2f6a6e|1.19', uv: 'fit', kind: 'wall', glow: 0.2 }); });
        K.P('number_dispenser', sq(5, 1)[0] - 1.3, sq(5, 1)[1] - 1.3, 180);
        [1, 2].forEach(c => K.hang('brochure_rack', 'N', sq(c, 0)[0], 1.0, 0.08));
        K.P('form_counter', K.r[0] + 0.17 + 0.35, sq(0, 4)[1], 90); A.bar(0, 4); K.P('form_counter', K.r[2] - 0.17 - 0.35, sq(7, 3)[1], 270); A.bar(7, 3);
        K.P('photocopier', sq(1, 6)[0], sq(1, 6)[1], 90); A.bar(1, 6);
        K.P('banker_lamp', sq(7, 7)[0] - 0.7, sq(7, 7)[1] + 0.1, 180, { y: 0.76 });
        K.sign('N', X(2), 2.35, 4.2, 0.5, 'PERMIT OFFICES', '#ffffff', '#2f6a6e', 0.12); K.hang('exit_sign', 'N', D.at, 2.5, 0.08);
    },
};

/* WASHINGTON DC, THE STREET (mondo 11-15): catalogue props on plot squares. [px, py, key, x, z, face, cells it needs free, opts];
   bars = [px, py, x0, z, x1, z, top, thickness]: the unseen low wall filling a barrier's squares (the pool, the obelisk's plinth) */
const DRESS = [
    [5, 1, 'car_cadillac', 7, 33.25, 90, [[1, 9], [2, 9]]], [5, 1, 'car_cadillac', 14, 33.25, 90, [[3, 9], [4, 9]]], [5, 1, 'car_suv', 7, 36.75, 90, [[1, 10], [2, 10]]], [5, 1, 'car_cadillac', 14, 36.75, 90, [[3, 10], [4, 10]]],
    [5, 3, 'lion', 37.6, 14.1, 90, null, { h: 1.5 }], [5, 3, 'lion', 37.6, 27.9, 90, null, { h: 1.5 }],
    [6, 1, 'fountain', 8.75, 7, 0, null],   // the plaza's fountain stands in the pool (the tool's own gave its square to the pool)
    [6, 1, 'newspaper_rack', 16.6, 11.6, 90, null], [6, 1, 'newspaper_rack', 16.6, 12.5, 90, null], [6, 0, 'newspaper_rack', 9.2, 36.2, 180, null], [7, 1, 'newspaper_rack', 18.6, 11.9, 270, null],
];
/* the pieces that wait for their model: the seated statue in its temple, the pink blossom trees on the lawns (a tree needs its square free) */
if (HAVE.seated_statue) DRESS.push([6, 1, 'seated_statue', 35, 36.9, 0, null, { h: 3.4 }]);
if (HAVE.blossom_tree) [[6, 0, 2, 9], [6, 0, 9, 9], [6, 1, 1, 9], [6, 1, 1, 10], [6, 1, 4, 9], [6, 1, 4, 10], [6, 1, 8, 2], [7, 0, 1, 7], [7, 0, 4, 7], [7, 0, 1, 10], [7, 0, 4, 10], [7, 1, 1, 9], [7, 1, 4, 10], [7, 1, 7, 10], [7, 1, 10, 9]]
    .forEach((t, i) => DRESS.push([t[0], t[1], 'blossom_tree', t[2] * C + 1.75, t[3] * C + 1.75, (i * 97) % 360, [[t[2], t[3]]], { h: 5 + (i * 7 % 5) * 0.3 }]));
const BARS = [[6, 1, 3.95, 7, 13.55, 7, 0.6, 6.1], [6, 1, 31.95, 7, 38.05, 7, 3, 6.1]];
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
            const IN = INSIDE[P.px + ',' + P.py + ',' + Bd.i], S0 = (Bd.solids || [])[0], hol = IN && S0 ? l => { const o2 = hollow(l, S0); if (process.env.CIVIC_DEBUG) console.log('hollow', P.px + ',' + P.py + ',' + Bd.i, l.length, '->', o2.length, 'nf', o2.filter(q => q.o && q.o.nf).map(q => q.o.nf + '@' + [q.x0, q.z0, q.x1, q.z1, q.y0, q.y1].join(',')).join(' ')); return o2; } : l => l;
            const parts = []; hol(Bd.parts).forEach(p => toArch(p, D).forEach(q => parts.push(q)));
            const det = detail(Bd, D, !!(pb && roofB.has(pb.id)), 17 + P.px * 31 + P.py * 7 + k * 13, NAMES[P.px + ',' + P.py + ',' + Bd.i]); hol(det).forEach(p => toArch(p, null).forEach(q => parts.push(q)));
            det.ghosts.forEach(g => { features.push({ k: 'wall', x0: r3(X0 + g[0]), z0: r3(Z0 + g[1]), x1: r3(X0 + g[2]), z1: r3(Z0 + g[3]), t: g[5], y: g[4], ghost: true, rail: false }); n.ghosts++; });
            features.push({ k: 'arch', id: 'arch:' + id.slice(3), x: X0, z: Z0, y: 0, parts }); n.arch++; n.parts += parts.length;
            if (IN) { const io = runInside(IN, S0 ? { r: S0.r, st: S0.st, D } : null), ip = []; io.parts.forEach(p => toArch(p, null).forEach(q => ip.push(q)));
                if (ip.length) { features.push({ k: 'arch', id: 'arch:' + id.slice(3) + '-in', x: X0, z: Z0, y: 0, parts: ip }); n.arch++; n.parts += ip.length; }
                io.ghosts.forEach(g => { features.push({ k: 'wall', x0: r3(X0 + g[0]), z0: r3(Z0 + g[1]), x1: r3(X0 + g[2]), z1: r3(Z0 + g[3]), t: r3(g[5]), y: g[4], ghost: true, rail: false }); n.ghosts++; });
                io.props.forEach(q => { q.x = r3(X0 + q.x); q.z = r3(Z0 + q.z); ctx.props.push(q); }); n.inside = (n.inside || 0) + io.props.length; }
            (Bd.ghost || []).forEach(g => { features.push({ k: 'wall', x0: r3(X0 + g[0]), z0: r3(Z0 + g[1]), x1: r3(X0 + g[2]), z1: r3(Z0 + g[3]), t: 0.3, y: g[4], ghost: true, rail: false }); n.ghosts++; });
            (Bd.cells || []).forEach(c => take(P.px * N + c[0], P.py * N + c[1]));
        });
    });
    /* WASHINGTON DC, THE STREET: the cars need their squares free (a taken square = the car is left out and logged) */
    DRESS.forEach(d => { const X0 = gx(d[0] * N), Z0 = gx(d[1] * N), cs = d[6];
        if (cs && !cs.every(c => ctx.free(d[0] * N + c[0], d[1] * N + c[1], '.'))) { n.dressSkipped = (n.dressSkipped || 0) + 1; return; }
        (cs || []).forEach(c => take(d[0] * N + c[0], d[1] * N + c[1]));
        ctx.props.push(Object.assign({ key: d[2], x: ctx.r3(X0 + d[3]), z: ctx.r3(Z0 + d[4]), face: d[5] }, d[7] || {})); n.dress = (n.dress || 0) + 1; });
    BARS.forEach(b => { const X0 = gx(b[0] * N), Z0 = gx(b[1] * N); features.push({ k: 'wall', x0: ctx.r3(X0 + b[2]), z0: ctx.r3(Z0 + b[3]), x1: ctx.r3(X0 + b[4]), z1: ctx.r3(Z0 + b[5]), t: b[7], y: b[6], ghost: true, rail: false }); n.ghosts++; });
    if (process.env.CIVIC_DEBUG === 'cells') [[6, 0], [7, 0], [6, 1], [6, 2], [5, 1], [7, 1]].forEach(q => { console.log('P', q.join(',')); for (let y = 0; y < N; y++) { let r = ''; for (let x = 0; x < N; x++) r += ctx.free(q[0] * N + x, q[1] * N + y, '.') ? '.' : ctx.free(q[0] * N + x, q[1] * N + y, '.#PRWB=~abcdefghijklmnopqrstuvwxyz0123456789') ? ctx.cellAt(q[0] * N + x, q[1] * N + y) : (ctx.cellAt(q[0] * N + x, q[1] * N + y) === '.' ? 'x' : ctx.cellAt(q[0] * N + x, q[1] * N + y).toUpperCase()); console.log(r); } });
    if (process.env.CIVIC_DEBUG) console.log('civic', JSON.stringify(n));
    return n;
}
module.exports = { apply, PLOTS, toArch };
