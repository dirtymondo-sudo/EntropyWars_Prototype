/* CIVIC CENTER — every building as a parts list (the mock-up's source; the same lists feed the city's k:'arch' rows).
   Local metres inside a plot: x east, z south, 0..42 (a plan cell = 3.5 m). y up. */
export const PLOTS = [];
let cur = null;
const plot = (px, py, name, fn) => { cur = { id: 'P0' + px + '-0' + py, px, py, name, parts: [], labels: [] }; PLOTS.push(cur); fn(); };
const push = p => { cur.parts.push(p); return p; };
const box = (x0, z0, x1, z1, y0, y1, key, tint, o) => push({ t: 'box', x0, z0, x1, z1, y0, y1, key, tint, o });
const cyl = (x, z, r, y0, y1, key, tint, o) => push({ t: 'cyl', x, z, r, y0, y1, key, tint, o });
const cone = (x, z, r, y0, h, key, tint, o) => push({ t: 'cone', x, z, r, y0, y1: y0 + h, key, tint, o });
const dome = (x, z, r, y0, h, key, tint, o) => push({ t: 'dome', x, z, r, y0, h, key, tint, o });
const roof = (shape, x0, z0, x1, z1, y0, h, key, tint, o) => push({ t: 'roof', shape, x0, z0, x1, z1, y0, h, key, tint, o });
const vault = (x0, z0, x1, z1, y0, h, key, tint, o) => push({ t: 'vault', x0, z0, x1, z1, y0, h, key, tint, o });
const door = (x, z, face, y) => push({ t: 'door', x, z, face, y });
const glb = (name, x, z, yaw, span) => push({ t: 'glb', name, x, z, yaw, span });
const lab = (t, x, z, y) => cur.labels.push({ t, x, z, y });
const ring = (n, cx, cz, R, r, y0, y1, key, tint, a0) => { for (let i = 0; i < n; i++) { const a = (a0 || 0) + i * 2 * Math.PI / n; cyl(cx + R * Math.sin(a), cz + R * Math.cos(a), r, y0, y1, key, tint, { seg: 8 }); } };
const WR = 'u_DecalWindowsResidential1a', WR2 = 'u_DecalWindowsResidential2a', WF = 'u_DecalWindowsFactory1a';
const STONE = 'marble_light', DARK = 0x20252c, VERD = 0x7fd0b4, SLATE = 0x9aa5b5, ALU = 'aluminium';
const flag = (x, z, h, tint) => { cyl(x, z, 0.09, 0, h, ALU, 0xdddddd, { seg: 6 }); box(x + 0.1, z - 0.03, x + 2.3, z + 0.03, h - 1.6, h - 0.2, null, tint); };

/* ───────── row 0 ───────── */
plot(4, 0, 'Fire Station', () => { const RED = 0xc8523f;
    box(7, 7, 26, 14, 0, 7, 'bricks_1', RED, { win: WR, winY0: 0 });                       // the rear block (kitchen, lockers)
    box(6.8, 6.8, 26.2, 14.2, 7, 7.5, STONE);
    box(7, 14, 26, 35, 0, 8.4, 'bricks_1', RED);                                            // the apparatus hall, one tall storey
    box(6.7, 13.7, 26.3, 35.3, 8.4, 9.0, STONE); box(7.2, 14.2, 25.8, 34.8, 9.0, 9.7, 'bricks_1', RED);
    [10.3, 16.5, 22.7].forEach(xc => {                                                      // three arched engine bays on the south front
        box(xc - 2.3, 34.9, xc + 2.3, 35.18, 0, 4.3, 'u_MetalCorrugatedPainted1a', 0xf4f4f4); vault(xc - 2.3, 34.9, xc + 2.3, 35.18, 4.3, 2.3, 'u_MetalCorrugatedPainted1a', 0xf4f4f4, { axis: 'z' });
        box(xc - 2.75, 34.95, xc - 2.3, 35.3, 0, 4.3, STONE); box(xc + 2.3, 34.95, xc + 2.75, 35.3, 0, 4.3, STONE); });
    box(26, 7, 35, 35, 0, 10.5, 'bricks_1', RED, { win: WR });                              // the crew quarters, three storeys
    box(25.85, 6.85, 35.15, 35.15, 3.35, 3.7, STONE); roof('hip', 26, 7, 35, 35, 10.5, 3.4, ALU, SLATE, { axis: 'z', over: 0.8 });
    box(7, 7, 12, 12, 0, 15.4, 'bricks_1', RED); box(6.6, 6.6, 12.4, 12.4, 15.4, 15.9, STONE);  // the hose tower
    box(7.4, 7.4, 11.6, 11.6, 15.9, 18.8, 'u_MetalSubwayGrill1a', 0x8c8c8c); [[7, 7], [11.2, 7], [7, 11.2], [11.2, 11.2]].forEach(c => box(c[0], c[1], c[0] + 0.8, c[1] + 0.8, 15.9, 18.8, 'bricks_1', RED));
    box(6.5, 6.5, 12.5, 12.5, 18.8, 19.4, STONE); roof('pyr', 6.3, 6.3, 12.7, 12.7, 19.4, 4.6, ALU, VERD); cyl(9.5, 9.5, 0.08, 24, 27, ALU, null, { seg: 6 });
    box(35, 18.5, 37.2, 25.5, 3.1, 3.4, STONE); cyl(36.9, 18.9, 0.12, 0, 3.1, ALU); cyl(36.9, 25.1, 0.12, 0, 3.1, ALU); door(35, 22, 'E');
    glb('fire_truck', 16.5, 38.2, 90, 9); flag(30.5, 37, 9, 0xc8523f);
    lab('FIRE STATION', 18, 21, 30); });

plot(5, 0, 'Civil Records', () => {
    box(25.7, 11.7, 33.8, 23.3, 0, 3.6, 'u_GlassWindowSquare2a', 0x56626e);                  // CIVIL RECORDS: a glass foot under a blind concrete vault
    [[24.7, 10.7], [34.3, 10.7], [24.7, 24.3], [34.3, 24.3]].forEach(c => cyl(c[0], c[1], 0.45, 0, 3.6, 'u_ConcreteStriped2c', 0xd8d2c4, { seg: 10 }));
    box(24, 10, 35.5, 25, 3.6, 12.8, 'u_ConcreteStriped2c', 0xd8d2c4);
    for (let z = 11.4; z < 24; z += 2.1) box(23.9, z, 24.0, z + 0.45, 5, 11.6, null, DARK); for (let x = 25.2; x < 35; x += 2.1) box(x, 25.0, x + 0.45, 25.1, 5, 11.6, null, DARK);
    for (let i = 0; i < 3; i++) { const z0 = 10.6 + i * 4.7; roof('shed', 24.8, z0, 34.7, z0 + 4.3, 12.8, 1.9, ALU, 0xcfd6dc, { high: 'N' }); box(24.9, z0, 34.6, z0 + 0.08, 12.8, 14.6, 'u_GlassWindowFactory1a', 0xbfe4ff); }
    door(25.7, 17.5, 'W'); lab('CIVIL RECORDS', 30, 17.5, 20);
    box(3.5, 28, 17.5, 40, 0, 7, 'u_PlasterWallStucco1a', 0xf0e2c0, { win: WR2, winY0: 3.5 });                    // NOTARY + COPY SHOP
    box(4.2, 27.9, 16.8, 28, 0.5, 3.0, 'u_GlassWindowResidential1a'); roof('shed', 3.5, 26.2, 17.5, 28, 2.9, 0.9, 'u_MetalCorrugatedPainted4a', 0xc0ffd0, { high: 'S' });
    box(3.3, 27.8, 17.7, 40.2, 7, 7.5, STONE, 0xe8dcc0); box(8, 27.8, 13, 28.4, 7.5, 8.8, STONE, 0xe8dcc0); door(10.5, 28, 'N'); lab('NOTARY + COPIES', 10.5, 34, 12);
    box(7, 1.5, 17.5, 17.5, 0, 5.5, 'u_MetalCorrugatedPainted1a', 0xa8c8ff);                                          // SIGN WORKSHOP: a saw-tooth shed
    for (let i = 0; i < 3; i++) { const z0 = 1.5 + i * 5.33; roof('shed', 7, z0, 17.5, z0 + 5.33, 5.5, 2.3, 'u_MetalCorrugatedPainted1a', 0x8fb0e8, { high: 'N' }); box(7.1, z0, 17.4, z0 + 0.08, 5.5, 7.7, 'u_GlassWindowFactory1a', 0xcfeaff); }
    box(9.6, 17.45, 15, 17.62, 0, 4, ALU, 0xd0d4d8); lab('SIGN WORKSHOP', 12, 9, 12); });

plot(6, 0, 'City Hall', () => { const M = 0xf6f1e6;
    box(7, 7, 35, 31.5, 0, 4, 'u_ConcreteStriped1a', 0xd9d3c6);                                         // the rusticated ground storey
    box(7.5, 7.5, 34.5, 31, 4, 14, STONE, M, { win: WR });                                  // the piano nobile, two storeys of marble
    box(6.6, 6.6, 35.4, 31.9, 14, 14.7, STONE); box(7.2, 7.2, 34.8, 31.3, 14.7, 15.6, STONE, M);
    [[7, 7], [29.5, 7], [7, 26], [29.5, 26]].forEach(c => { box(c[0] - 0.4, c[1] - 0.4, c[0] + 5.9, c[1] + 5.9, 0, 16.6, STONE, M, { win: WR, winY0: 4 }); roof('pyr', c[0] - 0.8, c[1] - 0.8, c[0] + 6.3, c[1] + 6.3, 16.6, 2.8, ALU, VERD); });
    box(11.5, 31.5, 30.5, 33.8, 0, 3, STONE, 0xe9e4da); for (let i = 0; i < 5; i++) box(13, 33.8, 29, 33.8 + (5 - i) * 0.62, i * 0.6, (i + 1) * 0.6, STONE, 0xe9e4da);   // the grand stair to the plaza
    for (let i = 0; i < 6; i++) { const x = 13 + i * 3.2; cyl(x, 33.1, 0.62, 3, 12.5, STONE, M, { seg: 14 }); box(x - 0.8, 32.3, x + 0.8, 33.9, 3, 3.5, STONE); box(x - 0.8, 32.3, x + 0.8, 33.9, 12.1, 12.5, STONE); }
    box(11.8, 31.4, 30.2, 34, 12.5, 13.9, STONE, M); roof('gable', 11.5, 31.3, 30.5, 34.2, 13.9, 3.3, STONE, M, { axis: 'z' }); door(21, 31.5, 'S', 3);
    cyl(21, 19, 7, 15.6, 21.6, STONE, M, { seg: 28 }); ring(16, 21, 19, 7.75, 0.32, 15.6, 20.7, STONE, M); cyl(21, 19, 8.3, 20.7, 21.3, STONE, null, { seg: 28 }); cyl(21, 19, 6.5, 21.3, 22.8, STONE, M, { seg: 28 });
    dome(21, 19, 6.5, 22.8, 7.6, ALU, VERD); cyl(21, 19, 1.3, 30.1, 32.4, STONE, M, { seg: 12 }); dome(21, 19, 1.5, 32.4, 1.7, ALU, VERD); cone(21, 19, 0.28, 34, 2.6, ALU, 0xe8c050, { seg: 8 });
    door(21, 7, 'N'); flag(10, 37, 10, 0x2a56b0); flag(32, 37, 10, 0xb03a2a);
    lab('CITY HALL', 21, 19, 40); });

plot(7, 0, 'Council annex', () => {
    box(10.5, 8, 24, 16.5, 0, 10.5, 'u_GlassWindowSquare2a', 0x86c2b8);                     // COUNCIL ANNEX: a glass office bar under a floating roof …
    [3.5, 7].forEach(y => box(10.2, 7.7, 24.3, 16.8, y - 0.12, y + 0.12, STONE)); box(9.2, 6.6, 25.2, 17.9, 10.5, 10.95, STONE);
    cyl(29.6, 12.25, 5.5, 0, 9, 'u_PlasterWallPainted1a', 0xdcb48a, { seg: 28 });           // … and the round council chamber
    ring(14, 29.6, 12.25, 6.15, 0.17, 0, 10.4, STONE, null); cyl(29.6, 12.25, 5.0, 9, 10.4, 'u_GlassWindowSquare1a', 0xbfe8ff, { seg: 28 }); cyl(29.6, 12.25, 6.7, 10.4, 10.8, STONE, null, { seg: 28 }); dome(29.6, 12.25, 5.3, 10.8, 1.9, ALU, 0xc48350);
    door(17, 16.5, 'S'); lab('COUNCIL ANNEX', 22, 12, 16);
    box(25, 21, 39, 38.5, 0, 7.4, 'bricks_2', 0xc08f72, { win: WR });                         // THE MAYOR'S HOUSE
    roof('gable', 25, 21, 39, 38.5, 7.4, 4.4, ALU, SLATE, { axis: 'z', over: 0.6 }); box(27, 24, 28.2, 25.2, 7.4, 12.8, 'bricks_2', 0xa5745c); box(35.8, 34, 37, 35.2, 7.4, 12.8, 'bricks_2', 0xa5745c);
    box(22.8, 27.5, 25, 32, 0, 0.5, STONE); cyl(23.2, 27.9, 0.22, 0.5, 3.4, STONE, null, { seg: 10 }); cyl(23.2, 31.6, 0.22, 0.5, 3.4, STONE, null, { seg: 10 }); box(22.6, 27.3, 25, 32.2, 3.4, 3.8, STONE); roof('gable', 22.6, 27.3, 25, 32.2, 3.8, 1.2, STONE, null, { axis: 'x' });
    door(25, 29.75, 'W', 0.5); lab("MAYOR'S HOUSE", 32, 30, 15); });

/* ───────── row 1: the avenue ───────── */
plot(4, 1, 'Dispatch', () => { const G = 0xa9bac8;
    box(7, 3.5, 17.5, 10.5, 0, 7, 'u_ConcreteStriped1c', G); cyl(7, 7, 3.5, 0, 7, 'u_ConcreteStriped1c', G, { seg: 24 });      // a round-nosed concrete bunker
    box(6.95, 3.42, 17.58, 10.58, 4.3, 5.7, 'u_GlassWindowSquare1a', 0x8fd0ff); cyl(7, 7, 3.58, 4.3, 5.7, 'u_GlassWindowSquare1a', 0x8fd0ff, { seg: 24 });
    box(6.5, 2.9, 18.1, 11.1, 7, 7.35, STONE); cyl(7, 7, 4.1, 7, 7.35, STONE, null, { seg: 24 });
    box(14.2, 6.2, 15.4, 7.4, 7.35, 27, 'u_MetalTruss1a', 0xd94a3a, { alpha: 1 }); dome(14.8, 6.8, 0.4, 27, 0.55, null, 0xff3030);        // the radio mast
    cyl(10.5, 5.6, 0.08, 7.35, 8.7, ALU, null, { seg: 6 }); cone(10.5, 5.6, 1.2, 8.7, 0.7, ALU, null, { inv: true }); cyl(8.2, 8.6, 0.08, 7.35, 8.3, ALU, null, { seg: 6 }); cone(8.2, 8.6, 0.9, 8.3, 0.55, ALU, null, { inv: true });
    door(17.5, 7, 'E'); lab('DISPATCH', 10.5, 7, 13);
    box(26, 3.5, 37, 9, 0, 3.6, 'u_PlasterWallStucco1a', 0xf2b8c6); box(27, 8.95, 34, 9.06, 1.1, 2.9, 'u_GlassWindowResidential1a');    // COFFEE + DONUTS (a cup on the roof)
    box(24.8, 3, 38.2, 11.7, 3.6, 3.9, STONE, 0xfff3e0); cyl(31.5, 6, 1.3, 3.9, 6.6, STONE, 0xffffff, { r2: 1.75 }); cyl(31.5, 6, 1.6, 6.45, 6.62, null, 0x5a3a22); door(35.6, 9, 'S'); lab('COFFEE + DONUTS', 31.5, 6, 10); });

plot(5, 1, 'Service court', () => {
    box(3.5, 3.5, 17.5, 10.5, 0, 5, 'u_MetalCorrugatedPainted3a', 0xffe2a8);                                       // CITY MOTOR POOL
    roof('shed', 3.5, 3.5, 17.5, 10.5, 5, 1.9, 'u_MetalCorrugatedPainted1a', 0x8c9096, { high: 'N', over: 0.7 });
    [6, 10.5, 15].forEach(xc => box(xc - 1.9, 10.45, xc + 1.9, 10.62, 0, 3.8, ALU, 0xd0d4d8)); cyl(5.5, 5.5, 0.5, 6, 7.6, ALU, null, { seg: 8 }); cyl(12, 5.5, 0.5, 6, 7.6, ALU, null, { seg: 8 });
    door(17.5, 7, 'E'); lab('MOTOR POOL', 10.5, 7, 10);
    cyl(28.5, 7, 3.2, 0, 3.4, 'u_PlasterWallPainted1a', 0x3f8f62, { seg: 8 }); cone(28.5, 7, 4.3, 3.4, 2.3, ALU, 0x4c9a78, { seg: 8 }); dome(28.5, 7, 0.5, 5.6, 0.6, ALU, 0xe8c050);     // NEWSSTAND: an eight-sided kiosk
    box(33, 4.5, 38, 9, 0, 3, 'u_ConcreteStriped1c', 0xd0a070); roof('shed', 32.4, 4, 38.5, 10.6, 3, 0.9, 'u_MetalCorrugatedPainted2a', 0xffffff, { high: 'N' }); door(28.5, 10.2, 'S'); lab('NEWSSTAND + FLOWERS', 32, 7, 9); });

plot(6, 1, 'Civic plaza', () => {
    cyl(8.75, 6.65, 2.8, 0, 0.6, STONE); cyl(8.75, 6.65, 2.5, 0.6, 0.66, null, 0x6fc4e8); cyl(8.75, 6.65, 0.5, 0.6, 2.2, STONE); cyl(29.75, 6.65, 0.7, 0, 1.3, STONE); cyl(29.75, 6.65, 0.3, 1.3, 3.0, STONE, 0xd8d8d0);
    cyl(10.5, 35, 3.7, 0, 0.6, STONE, null, { seg: 16 }); ring(8, 10.5, 35, 3.1, 0.18, 0.6, 3.8, STONE); cyl(10.5, 35, 3.8, 3.8, 4.15, STONE, null, { seg: 16 }); dome(10.5, 35, 3.6, 4.15, 1.9, ALU, VERD); cone(10.5, 35, 0.15, 6.05, 1.2, ALU, 0xe8c050, { seg: 6 });   // the bandstand
    box(30.6, 34.1, 32.4, 35.9, 0, 6.5, STONE, 0xf1ece0); cyl(31.5, 36.0, 0.75, 5.2, 5.5, null, 0xffffff, { axis: 'z', seg: 16, y: 1 }); roof('pyr', 30.3, 33.8, 32.7, 36.2, 6.5, 1.4, ALU, VERD);   // the plaza clock
    lab('CIVIC PLAZA', 21, 21, 9); });

plot(7, 1, 'Courthouse', () => { const CR = 0xf1e8d4;
    box(3.5, 3.5, 17.5, 8.6, 0, 11.5, STONE, CR, { win: WR, winY0: 1.5 }); box(3.5, 8.6, 17.5, 10.0, 0, 1.5, STONE, 0xe4ddd0);
    for (let i = 0; i < 3; i++) box(5.5, 10, 15.5, 10 + (3 - i) * 0.42, i * 0.5, (i + 1) * 0.5, STONE, 0xe4ddd0);
    for (let i = 0; i < 6; i++) cyl(4.5 + i * 2.4, 9.4, 0.5, 1.5, 10, STONE, CR, { seg: 12 });
    box(3.5, 8.6, 17.5, 10.1, 10, 11.5, STONE, CR); box(3.2, 3.2, 17.8, 10.4, 11.5, 12.7, STONE, CR); roof('gable', 3.0, 3.0, 18.0, 10.6, 12.7, 3.1, STONE, CR, { axis: 'z' });
    box(9.4, 8.5, 11.6, 8.62, 1.5, 5.4, ALU, 0xb08040); door(10.5, 8.62, 'S', 1.5); lab('COURTHOUSE', 10.5, 6.5, 19);
    box(24.5, 3.5, 38.5, 10, 0, 3.8, 'bricks_3', 0xb9785c); box(26, 9.95, 37, 10.06, 0.8, 3.0, 'u_GlassWindowResidential1a'); roof('shed', 24.5, 10, 38.5, 11.7, 2.8, 0.8, 'u_MetalCorrugatedPainted1a', 0x9fc0ff, { high: 'N' });    // COURTHOUSE CAFE with a roof terrace
    box(24.3, 3.3, 38.7, 10.2, 3.8, 4.05, STONE); box(24.5, 9.95, 38.5, 10.05, 4.05, 5.0, 'u_MetalTruss4a', 0x333333, { alpha: 1 });
    [28, 34].forEach(x => { cyl(x, 6.6, 0.06, 4.05, 6.4, ALU, null, { seg: 6 }); cone(x, 6.6, 1.6, 6.2, 0.8, null, 0xd94f4f, { seg: 8 }); }); door(31.5, 10, 'S'); lab('COURT CAFE', 31.5, 6.5, 9.5); });

/* ───────── row 2 ───────── */
plot(4, 2, 'Police desk', () => { const PB = 0x93a4cc;
    box(3.5, 7, 14, 26, 0, 10.5, 'bricks_1', PB, { win: WR2, winY0: 0 }); box(3.4, 6.9, 14.1, 26.1, 0, 1.1, STONE, 0xbfc3c8);
    box(3.3, 6.8, 14.2, 26.2, 10.5, 10.9, STONE); box(3.6, 7.1, 13.9, 25.9, 10.9, 11.6, 'bricks_1', PB);
    box(14, 13, 15.2, 20, 0, 12.4, STONE, 0xe8e4da); box(14, 14.5, 15.2, 18.5, 12.4, 13.6, STONE, 0xe8e4da); box(14, 15.7, 15.2, 17.3, 13.6, 14.7, STONE, 0xe8e4da);   // the stepped deco entrance bay
    [14.0, 19.0].forEach(z => { cyl(15.6, z, 0.08, 0, 2.5, ALU, 0x222222, { seg: 6 }); dome(15.6, z, 0.32, 2.5, 0.5, null, 0x2f8cff); });               // the blue lamps
    door(15.2, 16.5, 'E'); box(3.5, 26, 14, 31.5, 0, 4.5, 'bricks_1', PB); box(13.95, 27, 14.12, 30.6, 0, 3.6, ALU, 0x2b4a8a); box(3.3, 25.9, 14.2, 31.7, 4.5, 4.9, STONE);   // the sally port
    cyl(6, 10, 0.07, 11.6, 19, ALU, null, { seg: 6 }); box(8, 20, 11, 23, 10.9, 12.3, ALU);
    glb('car_cop', 16.2, 9.6, 20, 5); glb('car_cop', 16.3, 24.4, -15, 5); lab('POLICE', 9, 16.5, 17);
    const BR = 0xffc8a8; box(28, 3.5, 38.5, 17.5, 0, 10.5, 'bricks_3', BR, { win: WR });                                   // BROWNSTONE WALK-UP
    box(27.6, 3.1, 38.9, 17.9, 10.5, 11.1, 'u_ConcreteStriped1a', 0x6a4a36); cyl(28, 7.5, 1.8, 0, 9, 'bricks_3', BR, { seg: 12 }); cone(28, 7.5, 2.1, 9, 1.2, ALU, SLATE, { seg: 12 });
    box(26, 12, 28, 14.5, 0, 1.2, STONE); box(24.8, 12.3, 26, 14.2, 0, 0.6, STONE); door(28, 13.25, 'W', 1.2); lab('BROWNSTONE', 33, 10.5, 14.5); });

plot(5, 2, 'Holding annex', () => { const HG = 0xbfc2c6;
    box(7, 28, 21, 41, 0, 7, 'u_ConcreteStriped1a', HG); for (let x = 8.2; x < 20; x += 2.2) box(x, 27.9, x + 0.5, 28, 4.3, 5.6, null, DARK);                   // HOLDING: blind walls, slit windows
    box(8, 29, 20, 40, 7, 9.8, 'u_MetalTruss4a', 0x8a8f96, { alpha: 1 });                                                           // the caged yard on the roof (the roof route passes it)
    box(18.2, 25, 21, 28, 0, 10, 'u_ConcreteStriped1a', HG); box(17.5, 24.3, 21.7, 28.7, 10, 12.4, 'u_GlassWindowSquare1a', 0x9fd0e0); roof('pyr', 17.1, 23.9, 22.1, 29.1, 12.4, 1.7, ALU, SLATE);   // the guard tower
    box(11, 27.85, 13, 28, 0, 2.6, ALU, 0x3a4048); door(12, 27.85, 'N'); lab('HOLDING ANNEX', 13, 34, 13);
    box(24.5, 10.5, 35, 24.5, 0, 7, 'u_PlasterWallPainted1d', 0xedc54a, { win: WR2, winY0: 3.5 }); box(24.4, 12, 24.5, 23, 0.5, 3.0, 'u_GlassWindowResidential1a');        // BAIL BONDS
    roof('shed', 22.9, 11.5, 24.5, 23.5, 2.9, 0.8, 'u_MetalCorrugatedPainted1a', 0x222222, { high: 'E' }); box(24.6, 11.5, 24.9, 23.5, 7.8, 10.4, null, 0xd9382e); cyl(24.75, 12.5, 0.1, 7, 7.8, ALU); cyl(24.75, 22.5, 0.1, 7, 7.8, ALU);
    door(24.5, 17.5, 'W'); lab('BAIL BONDS', 30, 17.5, 12);
    box(3.5, 1.5, 17.5, 14, 0, 5.2, 'u_MetalCorrugatedPainted2a', 0xffc8b8); roof('shed', 3.5, 1.5, 17.5, 14, 5.2, 2.4, 'u_MetalCorrugatedPainted1a', 0x7d8187, { high: 'N', over: 0.5 });   // IMPOUND GARAGE
    [7, 14].forEach(xc => box(xc - 2.2, 13.95, xc + 2.2, 14.12, 0, 3.9, ALU, 0xd0d4d8)); lab('IMPOUND GARAGE', 10.5, 8, 10.5); });

plot(6, 2, 'Records garden', () => { const SG = 0xeae4d4, GL = 'u_GlassWindowSquare1b';
    box(7, 7, 35, 35, 0, 0.8, STONE, SG); box(7.3, 7.3, 34.7, 34.7, 0.8, 6, 'u_GlassWindowTall1a', 0xcfe8e0); box(7, 7, 35, 35, 6, 7, STONE, SG);   // a stone arcade, glass between the piers
    for (let i = 0; i <= 8; i++) { const p = 7 + i * 3.5; box(p - 0.5, 6.85, p + 0.5, 7.4, 0, 6, STONE, SG); box(p - 0.5, 34.6, p + 0.5, 35.15, 0, 6, STONE, SG); box(6.85, p - 0.5, 7.4, p + 0.5, 0, 6, STONE, SG); box(34.6, p - 0.5, 35.15, p + 0.5, 0, 6, STONE, SG); }
    [[7, 7, 35, 7.35], [7, 34.65, 35, 35], [7, 7, 7.35, 35], [34.65, 7, 35, 35]].forEach(b => box(b[0], b[1], b[2], b[3], 7, 7.9, STONE));                       // the roof terrace's balustrade (the roof route walks it)
    box(13, 13, 29, 29, 7, 10, GL, 0xd8fff0, { alpha: 0.55 }); vault(12.6, 15.5, 29.4, 26.5, 10, 5.5, GL, 0xd8fff0, { axis: 'x', alpha: 0.55 }); vault(15.5, 12.6, 26.5, 29.4, 10, 5.5, GL, 0xd8fff0, { axis: 'z', alpha: 0.55 });   // the glasshouse: two crossing vaults
    cyl(21, 21, 4.3, 14.6, 16.3, STONE, null, { seg: 20 }); dome(21, 21, 4.2, 16.3, 3.5, GL, 0xd8fff0, { alpha: 0.6 }); cone(21, 21, 0.2, 19.8, 1.6, ALU, 0xe8c050, { seg: 6 });
    [[10, 10], [32, 10], [10, 32], [32, 32]].forEach(c => { cyl(c[0], c[1], 1.1, 7, 7.9, STONE); cyl(c[0], c[1], 0.18, 7.9, 9.6, 'u_ConcreteStriped1a', 0x6a4a36, { seg: 6 }); dome(c[0], c[1], 1.5, 9.4, 2.2, 'grass_2', 0x4f9a4a); });
    door(21, 7, 'N'); door(35, 21, 'E'); lab('RECORDS GARDEN', 21, 21, 24); });

plot(7, 2, 'Time Bureau', () => { const BZ = 0xa8875a;
    box(24.5, 3.5, 35, 20, 0, 17.5, 'u_GlassWindowTall3a', BZ); [3.5, 7, 10.5, 14, 17.5].forEach(y => box(23.9, 2.9, 35.6, 20.3, y - 0.15, y + 0.15, STONE));     // a bronze glass slab, a white ledge at every floor
    cyl(29.75, 24, 4.6, 0, 24, STONE, 0xf5f1e6, { seg: 28 }); cyl(29.75, 24, 5.4, 19, 19.5, STONE, null, { seg: 28 });                                              // the clock drum
    cyl(25.05, 24, 2.1, 21.85, 22.15, null, 0xfdfbf2, { axis: 'x', seg: 24 }); box(24.86, 23.9, 24.96, 24.1, 22, 23.7, null, DARK); box(24.86, 24, 24.96, 25.3, 21.9, 22.1, null, DARK);
    cyl(29.75, 28.7, 2.1, 21.85, 22.15, null, 0xfdfbf2, { axis: 'z', seg: 24 }); box(29.65, 28.82, 29.85, 28.92, 22, 23.7, null, DARK); box(28.5, 28.82, 29.75, 28.92, 21.9, 22.1, null, DARK);
    cyl(29.75, 24, 5.0, 24.2, 24.6, STONE, null, { seg: 28 }); cone(29.75, 24, 5.0, 24.6, 2.4, ALU, 0xd0a63c, { seg: 28 }); dome(29.75, 24, 0.6, 27, 0.9, ALU, 0xe8c050);
    roof('shed', 29.2, 5, 30.3, 18, 17.65, 6.5, ALU, 0xe0b84c, { high: 'N' });                                                                                    // the sundial's gnomon on the roof
    door(24.5, 12, 'W'); lab('TIME BUREAU', 29.75, 14, 31);
    box(4.5, 26, 16.5, 37.5, 0, 6.2, 'u_PlasterWallStucco1a', 0xf3ead8, { win: WR }); [[4.4, 25.9], [16.3, 25.9], [4.4, 37.3], [16.3, 37.3]].forEach(c => box(c[0], c[1], c[0] + 0.3, c[1] + 0.3, 0, 6.2, 'u_ConcreteStriped1a', 0x6a4a36));   // THE WATCHMAKER'S HOUSE
    box(4.4, 25.9, 16.6, 37.6, 3.0, 3.25, 'u_ConcreteStriped1a', 0x6a4a36); roof('gable', 4.5, 26, 16.5, 37.5, 6.2, 6, ALU, 0xb5523a, { axis: 'x', over: 0.6 });
    cyl(3.8, 31.75, 1.1, 8.55, 8.85, null, 0xfdfbf2, { axis: 'x', seg: 20 }); box(13, 28, 14.2, 29.2, 6.2, 12, 'bricks_2', 0xa5745c); door(10.5, 26, 'N'); lab('WATCHMAKER', 10.5, 31.75, 14.5); });

/* ───────── row 3 ───────── */
plot(4, 3, 'Transit square', () => {
    [4.5, 10.5, 16.5].forEach(x => [4.5, 13].forEach(z => cyl(x, z, 0.16, 0, 3.2, ALU, 0x2f6b4a, { seg: 8 })));                                                 // METRO ENTRANCE: a glass vault over the stair down
    box(4, 4.3, 17, 4.7, 3.1, 3.3, ALU, 0x2f6b4a); box(4, 12.8, 17, 13.2, 3.1, 3.3, ALU, 0x2f6b4a); vault(4, 4, 17, 13.5, 3.3, 2.9, 'u_GlassWindowSquare1b', 0xbfe8ff, { axis: 'x', alpha: 0.6 });
    box(7, 6.5, 14, 11, 0, 0.06, null, 0x15171a); box(7, 6.4, 14, 6.5, 0, 1.1, ALU, 0x2f6b4a); box(7, 11, 14, 11.1, 0, 1.1, ALU, 0x2f6b4a); box(6.9, 6.4, 7, 11.1, 0, 1.1, ALU, 0x2f6b4a);
    box(18.6, 8.3, 19.3, 9, 0, 7, ALU, 0x2a2d33); cyl(18.95, 9.1, 1.25, 8.1, 8.4, null, 0xd9382e, { axis: 'z', seg: 20 });
    cyl(31.5, 8.75, 4, 0, 3.6, 'u_GlassWindowSquare1a', 0xcfeaff, { seg: 20 }); cyl(31.5, 8.75, 5.2, 3.6, 3.95, STONE, null, { seg: 20 }); dome(31.5, 8.75, 2.4, 3.95, 1.0, ALU, VERD);   // the ticket rotunda
    box(5, 27, 37, 34, 4.7, 5.05, STONE); [9, 17, 25, 33].forEach(x => { cyl(x, 30.5, 0.35, 0, 3.7, 'u_ConcreteStriped1a', null, { seg: 10 }); cone(x, 30.5, 2.3, 3.7, 1.0, 'u_ConcreteStriped1a', null, { inv: true, seg: 16 }); });   // the bus terminal's mushroom roof
    lab('METRO', 10.5, 8.75, 9); lab('BUS TERMINAL', 21, 30.5, 8); });

plot(5, 3, 'Public library', () => { const LB = 0xa9624a, OC = 0xf1ece0;
    box(7, 7, 35, 35, 0, 7, 'bricks_2', LB, { win: WR }); box(6.9, 6.9, 35.1, 35.1, 0, 0.9, STONE); box(6.6, 6.6, 35.4, 35.4, 6.4, 7, STONE);
    [[6.8, 6.8, 35.2, 7.15], [6.8, 34.85, 35.2, 35.2], [6.8, 6.8, 7.15, 35.2], [34.85, 6.8, 35.2, 35.2]].forEach(b => box(b[0], b[1], b[2], b[3], 7, 7.9, STONE));     // the terrace (the roof route walks it)
    box(35, 15, 36.6, 27, 0, 8.4, STONE, 0xefe9dc); roof('gable', 35, 15, 36.6, 27, 8.4, 1.6, STONE, 0xefe9dc, { axis: 'x' });                                          // the stone portal: three arches up a stair
    [17.5, 21, 24.5].forEach(zc => { box(36.5, zc - 1.1, 36.68, zc + 1.1, 1.5, 4.4, null, DARK); vault(36.5, zc - 1.1, 36.68, zc + 1.1, 4.4, 1.1, null, DARK, { axis: 'x' }); });
    box(36.6, 15, 38, 27, 0, 1.5, STONE); for (let i = 0; i < 3; i++) box(38, 16, 38 + (3 - i) * 0.4, 26, i * 0.5, (i + 1) * 0.5, STONE);
    cyl(21, 21, 9.5, 7, 13.5, STONE, OC, { seg: 8 }); cyl(21, 21, 9.56, 8.6, 12.3, 'u_GlassWindowTall1a', 0xdfe8d8, { seg: 8 }); ring(8, 21, 21, 9.75, 0.75, 7, 13.5, STONE, OC);   // the eight-sided reading room
    cyl(21, 21, 10.3, 13.5, 14.1, STONE, null, { seg: 8 }); cone(21, 21, 10.3, 14.1, 5.2, ALU, SLATE, { seg: 8 }); cyl(21, 21, 2.1, 18, 20.2, 'u_GlassWindowSquare1a', 0xcfeaff, { seg: 8 }); cone(21, 21, 2.5, 20.2, 1.7, ALU, VERD, { seg: 8 });
    door(36.6, 21, 'E', 1.5); lab('PUBLIC LIBRARY', 21, 21, 26); });

plot(6, 3, 'Military offices', () => { const OL = 0x98a36c, CS = 'u_PlasterWallPainted1a';
    box(16.9, 27.4, 32.1, 41.6, 0, 1.3, CS, 0x7f8a5c); box(17.5, 28, 31.5, 41, 0, 14, CS, OL);                                                                       // MILITARY OFFICES: a blockhouse
    for (let k = 0; k < 4; k++) for (let x = 18.6; x < 31; x += 2.3) { if (k === 0 && x > 23 && x < 26.5) continue; box(x, 27.9, x + 0.6, 28, 1.9 + k * 3.2, 3.6 + k * 3.2, null, DARK); }
    for (let x = 17.5; x < 31; x += 2.05) { box(x, 28, x + 1.15, 28.6, 14, 15, CS, OL); box(x, 40.4, x + 1.15, 41, 14, 15, CS, OL); } for (let z = 29.6; z < 40; z += 2.05) { box(17.5, z, 18.1, z + 1.15, 14, 15, CS, OL); box(30.9, z, 31.5, z + 1.15, 14, 15, CS, OL); }
    cyl(27, 36, 1.7, 14, 15.4, ALU, 0xaab0a0); dome(27, 36, 2.5, 15.4, 2.9, STONE, 0xf4f4ee); cyl(21, 32, 0.1, 14, 23, ALU, null, { seg: 6 }); cone(21.6, 32, 1.0, 19, 0.6, ALU, null, { inv: true });
    box(13.2, 25.3, 15.4, 27.5, 0, 2.6, CS, OL); box(12.9, 25, 15.7, 27.8, 2.6, 2.85, CS, 0x7f8a5c); box(15.4, 26.3, 20.5, 26.5, 0.9, 1.1, null, 0xd9382e);                 // the gate booth + the boom
    door(24.75, 28, 'N'); flag(15, 30.5, 11, 0x3a6b3a); glb('tank', 9.5, 34, 90, 7); lab('MILITARY OFFICES', 24.5, 34.5, 22);
    box(3.5, 3.5, 14, 17.5, 0, 7, 'u_MetalCorrugatedPainted4a', 0xe0e0b8); box(4.5, 17.45, 13, 17.56, 0.5, 3.0, 'u_GlassWindowResidential1a'); roof('shed', 3.5, 17.5, 14, 19.2, 2.9, 0.9, 'u_MetalCorrugatedPainted4a', 0xffffff, { high: 'N' });   // ARMY SURPLUS
    [[3.5, 3.5, 14, 4.1], [3.5, 16.9, 14, 17.5], [3.5, 3.5, 4.1, 17.5], [13.4, 3.5, 14, 17.5]].forEach(b => box(b[0], b[1], b[2], b[3], 7, 7.8, 'u_ConcreteStriped1a', 0xc2b48a)); door(8.75, 17.5, 'S'); lab('ARMY SURPLUS', 8.75, 10.5, 11.5);
    vault(24.5, 3.5, 35, 17.5, 0, 5.6, 'u_MetalCorrugatedPainted4a', 0xd0d8b8, { axis: 'z' }); box(27.2, 17.45, 32.3, 17.62, 0, 3.9, ALU, 0x4a5838); lab('ARMORY', 29.75, 10.5, 9.5); });   // THE ARMORY: a Quonset hut

plot(7, 3, 'Permit offices', () => { const PC = 'u_ConcreteStriped1e', PT = 0xe6e1d4;
    box(7, 7, 35, 35, 0, 4.5, PC, PT); box(8, 6.9, 34, 7, 0.6, 3.7, 'u_GlassWindowSquare1a', 0xa8d8e8); box(35, 8, 35.1, 34, 0.6, 3.7, 'u_GlassWindowSquare1a', 0xa8d8e8); box(6.4, 6.4, 35.6, 35.6, 4.5, 4.9, STONE);   // the podium: the public counters
    for (let x = 10.5; x < 33; x += 4.2) { cyl(x, 12.5, 0.5, 4.9, 8.4, STONE, null, { seg: 10 }); cyl(x, 21.5, 0.5, 4.9, 8.4, STONE, null, { seg: 10 }); }                  // the slab stands on pilotis
    box(9, 11, 33, 23, 8.4, 29.4, 'u_GlassWindowSquare4a', 0x93c8cc); box(8.3, 10.7, 9, 23.3, 8.4, 30.2, STONE); box(33, 10.7, 33.7, 23.3, 8.4, 30.2, STONE);
    for (let k = 0; k <= 6; k++) box(9, 10.1, 33, 23.9, 8.4 + k * 3.5 - 0.12, 8.4 + k * 3.5 + 0.12, STONE);                                                               // the sun-breakers
    box(17, 14, 25, 20, 29.5, 32.4, PC, PT); cyl(29, 17, 1.6, 29.9, 33, 'u_ConcreteStriped1a', 0xb08a60, { seg: 14 }); cone(29, 17, 1.8, 33, 1.1, ALU, SLATE, { seg: 14 }); [27.8, 30.2].forEach(x => box(x, 15.8, x + 0.15, 18.2, 29.5, 29.9, ALU));
    cyl(13.5, 29.5, 5.2, 4.9, 10, 'u_PlasterWallPainted1a', 0xcf7a52, { seg: 28 }); cyl(13.5, 29.5, 5.7, 10, 10.35, STONE, null, { seg: 28 }); dome(13.5, 29.5, 4.6, 10.35, 1.4, ALU, VERD);          // the hearing room's drum
    for (let i = 0; i < 3; i++) { const x0 = 15.9 + i * 3.4; roof('gable', x0, 3.6, x0 + 3.4, 7, 3.3, 1.1, STONE, null, { axis: 'z' }); } [15.9, 26.1].forEach(x => [3.8].forEach(z => cyl(x, z, 0.14, 0, 3.3, ALU, null, { seg: 8 })));   // the folded entrance canopy
    door(21, 7, 'N'); lab('PERMIT OFFICES', 21, 17, 38); });
