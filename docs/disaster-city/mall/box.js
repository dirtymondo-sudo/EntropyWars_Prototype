/* ── THE BAYSIDE MALL, THE BOX (2026-11-20; plan: docs/plans/mall/MALL_PLAN.md; mondo: "Own room, 2 or 3 plots. 2 floors. Yes. Sure. GO ahead") ──
   ONE BUILDING, WRITTEN ONCE. This file is the mall's numbers. Two tools read it and nothing else decides a size, a door or a roof:
     · `docs/disaster-city/districts/B.js` mallShell(): the OUTSIDE, in the city room `site_prebuilt_downtown_streets`;
     · `bake-mall.js`: the INSIDE, its own room `site_prebuilt_bayside_mall`, the same box, the same compass, the same squares.
   A place inside is the city place minus (CX, CZ). Squares: u west to east (0..NU), v north to south (0..NV), 3.5 m.
   Not a game file, never uploaded. Change a number here, then run `node bake-mall.js` and `node bake-disaster-city.js`. */
'use strict';
const C = 3.5;
const X0 = 136.5, Z0 = 3.5, NU = 20, NV = 11;                 // the body in city metres: x 136.5..206.5, z 3.5..42 (plots P09-10 east + P10-10)
const W = NU * C, D = NV * C, CX = X0 + W / 2, CZ = Z0 + D / 2;   // 70 x 38.5 m; the middle = (171.5, 22.75)
const UP = 5.25, EAVE = 10.5, VAULT = 14, DOME = 20.5;       // the upper floor, the eaves, the glass vault's crown, the dome's top
/* local metres (the room's own frame; the outside's arch row stands at the middle with rot 0, so it is the same frame) */
const lx = u => Math.round((-W / 2 + u * C) * 1000) / 1000, lz = v => Math.round((-D / 2 + v * C) * 1000) / 1000;

/* THE HALLS (squares): the long concourse on the pier's line, two cross halls, the atrium under the dome */
const HALL = { long: [0, 4, 20, 6], west: [4, 0, 6, 11], east: [14, 0, 16, 11], atrium: [13, 3, 17, 7] };
const ATR = { u: 15, v: 5 }, COURT = { u: 5, v: 5 };
/* THE BLOCKS: solid = shop units you do not walk into (their tops are the upper floor); hall = walked on both floors */
const BLOCKS = {
    arcade: { k: 'hall', sq: [0, 0, 4, 4], name: 'THE ARCADE' },
    store:  { k: 'hall', sq: [0, 6, 4, 11], name: 'DEPARTMENT STORE' },
    north:  { k: 'solid', sq: [[6, 0, 13, 4], [13, 0, 14, 3]], mass: [7, 0, 12, 3] },
    south:  { k: 'solid', sq: [[6, 6, 13, 11], [13, 7, 14, 11]], mass: [7, 7, 12, 11] },
    staff:  { k: 'solid', sq: [[16, 0, 17, 3], [17, 0, 18, 4], [19, 0, 20, 4]], mass: [18, 0, 20, 3] },   // the staff passage is square 18, rows 0..4
    food:   { k: 'solid', sq: [[17, 6, 20, 11], [16, 7, 17, 11]], name: 'THE FOOD COURT' },                // its top is the food court
};
/* THE DOORS: one door, one place, both sides. `side` = the wall it is in; (u, v) its middle on that wall's line; `y` = its floor.
   Outside it faces `out`, inside it faces the other way. */
const DOORS = [
    { id: 'main',     side: 'w', u: 0,    v: 5,    y: 0,  out: 270, name: 'THE MAIN DOORS',  to: 'THE CORDON PLAZA' },
    { id: 'sea',      side: 'e', u: 20,   v: 5,    y: 0,  out: 90,  name: 'THE SEA DOORS',   to: 'THE SEA FRONT · THE PIER' },
    { id: 'canal',    side: 's', u: 15,   v: 11,   y: 0,  out: 180, name: 'THE CANAL DOORS', to: 'THE QUAY · THE CANAL' },
    { id: 'canalw',   side: 's', u: 5,    v: 11,   y: 0,  out: 180, name: 'THE WEST CANAL DOORS', to: 'THE QUAY · THE CANAL' },
    { id: 'staff',    side: 'n', u: 18.5, v: 0,    y: 0,  out: 0,   name: 'THE STAFF DOOR',  to: 'THE SERVICE YARD' },
    { id: 'terrace1', side: 'e', u: 20,   v: 7.5,  y: UP, out: 90,  name: 'THE TERRACE DOORS', to: 'THE SEA TERRACE' },
    { id: 'terrace2', side: 'e', u: 20,   v: 9.5,  y: UP, out: 90,  name: 'THE TERRACE DOORS', to: 'THE SEA TERRACE' },
];
/* THE STORY GATES (data.js hqDoorGateShut; plan-design.md: the direct way in from the plaza "starts closed", the service way "requires the pass",
   the way from the boardwalk "also starts closed"). One gate a door, the same both sides. The quest id and its stage ids are PLACEHOLDERS for
   the Bayside quest, which is not written yet (mondo's to give): until a quest `bayside` is in STORY_QUESTS every gate stands open. When it
   lands, name its stages `pass` (the service pass in hand) and `encounter` (the shadow beings faced), or change these two words here. */
const GATE_CORDON = { quest: 'bayside', open: 'encounter', note: 'POLICE CORDON · THE MALL IS CLOSED UNTIL FURTHER NOTICE' };
const GATE_STAFF = { quest: 'bayside', open: 'pass', note: 'STAFF ONLY · A SERVICE PASS OPENS THIS DOOR' };
const GATES = { main: GATE_CORDON, sea: GATE_CORDON, canal: GATE_CORDON, canalw: GATE_CORDON, terrace1: GATE_CORDON, terrace2: GATE_CORDON, staff: GATE_STAFF };
/* THE SEA TERRACE (outside, city metres): a solid deck at the upper floor's height against the east wall, an outside stair on its sea side */
const TERRACE = { x0: 206.5, x1: 213.5, z0: 24.5, z1: 38.5, y: UP, stair: { x: 215.25, z0: 38.5, z1: 28.6, w: 3.5 }, land: { x0: 213.5, x1: 217, z0: 24.5, z1: 28 } };

/* ── THE COLOURS (Bayside's own: districts/B.js T) and the sheets ── */
const T = { CORAL: 0xffa590, MINT: 0xa8ecd6, AQUA: 0x7fdcec, SAND: 0xf8dfae, CREAM: 0xfff6e2, TERRA: 0xd9704a, WHITE: 0xffffff, GLASS: 0xb4e4ff, HOT: 0xff5a7a, NAVY: 0x44669c, LILAC: 0xd2bcf6, LEMON: 0xffe27a, DARKGLASS: 0x35506a, SKYGLASS: 0xd8f2ff };
const K = { stucco: 'urban:PlasterWallStucco1a', plaster: 'urban:PlasterWallPainted1a', corr: 'urban:MetalCorrugatedPainted1a', gSq: 'urban:GlassWindowSquare1a', gTall: 'urban:GlassWindowTall1a', gFac: 'urban:GlassWindowFactory1a', marble: 'urban:TileMarble1a', conc: 'urban:ConcreteStriped2c' };
const r3 = v => Math.round(v * 1000) / 1000;
/* a mall door's own frame (three-renderer.js: a door row's `frame`): the portal's coral plaster, a cream foot band in the same plaster (a marble sheet key drew black there), white trim */
const FRAME = { wall: 'urban:PlasterWallPainted1a', wallColor: 0xffd2c6, dadoColor: 0xfff6e2, trim: 'metal', trimColor: 0xffffff };
const wallM = (tint, key) => ({ key: key || K.stucco, tint, gain: key === K.corr ? 2.0 : 2.3 });
const glassM = (tint, key, glow) => ({ key: key || K.gFac, tint: tint == null ? T.AQUA : tint, glow: glow == null ? 0.4 : glow, gain: 2.2 });
const sign = (words, x, y, z, w, h, ry, fg, bg, glow) => { const p = { s: 'quad', p: [r3(x), y, r3(z)], size: [w, h], ry: ry || 0, key: 'txt:' + words + '|' + (fg || '#ffffff') + '|' + (bg || '') + '|' + Math.round(w / h * 100) / 100 + '||deco', uv: 'fit', kind: bg ? 'wall' : 'over' }; if (glow) p.glow = glow; return p; };

/* THE ROOF, the same parts outside and inside (local metres): terracotta hip roofs with a lantern over every block, the glass vault over
   the long concourse and both cross halls (14 m wide: the hall and a gallery either side), the glass dome on a white drum over the atrium. */
function roofParts(inside) {
    const P = [], hip = (u0, v0, u1, v1) => { const x = (lx(u0) + lx(u1)) / 2, z = (lz(v0) + lz(v1)) / 2, w = (u1 - u0) * C, d = (v1 - v0) * C;
        P.push({ s: 'roof', form: 'hip', p: [x, EAVE + 0.3, z], size: [w, 2.7, d], key: K.corr, tint: T.TERRA, gain: 2.0, over: 0.5, roof: true }, { s: 'box', p: [x, EAVE, z], size: [w + 0.6, 0.3, d + 0.6], tint: T.WHITE, roof: true });
        P.push({ s: 'box', p: [x, EAVE + 2.7, z], size: [1.3, 0.9, 1.3], key: K.plaster, tint: T.CREAM, gain: 2.3, roof: true }, { s: 'roof', form: 'pyramid', p: [x, EAVE + 3.6, z], size: [1.3, 0.9, 1.3], key: K.corr, tint: T.TERRA, gain: 2.0, over: 0.3, roof: true }); };
    hip(0, 0, 3, 3); hip(7, 0, 13, 3); hip(17, 0, 20, 3); hip(0, 7, 3, 11); hip(7, 7, 13, 11); hip(17, 7, 20, 11);
    /* the vaults: the long hall (rows 3..7), the west cross hall (squares 3..7), the east cross hall (squares 13..17) */
    const g = inside ? { key: K.gSq, tint: 0xeaf8ff, glow: 0.3, kind: 'clear' } : glassM(T.SKYGLASS, K.gFac, 0.85), gd = inside ? g : glassM(T.SKYGLASS, K.gSq, 0.85);   // from below the factory sheet reads as grey marble: the room's roof is CLEAR glass (three-renderer.js `kind: 'clear'`) with the square-pane sheet's bars, on the same shapes: the sky shows through
    P.push(Object.assign({ s: 'roof', form: 'barrel', p: [0, EAVE, lz(5)], size: [W + 0.1, VAULT - EAVE, 4 * C], seg: 12, ds: true, roof: true }, g));
    [5, 15].forEach(u => P.push(Object.assign({ s: 'roof', form: 'barrel', p: [lx(u), EAVE, 0], size: [D + 0.1, VAULT - EAVE, 4 * C], ry: 90, seg: 12, ds: true, roof: true }, g)));
    /* the vaults' ribs (white, one a square) and the eaves beam either side */
    for (let u = 0.5; u < NU; u += 2) P.push({ s: 'roof', form: 'barrel', p: [lx(u), EAVE + 0.02, lz(5)], size: [0.14, VAULT - EAVE + 0.05, 4 * C + 0.1], seg: 12, ds: true, ends: false, tint: T.WHITE, roof: true });   // `ends: false`: a barrel's two end fans would hang a solid half-disc across the hall at every rib
    /* the dome: a drum, the glass dome, a spire */
    const dx = lx(ATR.u), dz = lz(ATR.v);
    P.push({ s: 'cyl', p: [dx, VAULT - 1.2, dz], r: 7.6, ri: 7.15, h: 1.6, seg: 24, key: K.plaster, tint: T.CREAM, gain: 2.3, ds: true, roof: true });   // a RING (`ri`): a plain cylinder's two lids shut the dome off from the atrium under it
    P.push(Object.assign({ s: 'dome', p: [dx, VAULT + 0.4, dz], r: 7.4, h: DOME - VAULT - 0.4, seg: 20, ds: true, roof: true }, gd));
    P.push({ s: 'cyl', p: [dx, DOME, dz], r: 0.12, r2: 0.01, h: 2.2, seg: 6, tint: T.WHITE, roof: true });
    /* the west court's lantern: a small glass pyramid on the crossing of the two vaults */
    P.push(Object.assign({ s: 'roof', form: 'pyramid', p: [lx(COURT.u), VAULT - 0.2, lz(COURT.v)], size: [7, 3, 7], ds: true, roof: true }, gd));
    return P;
}
module.exports = { C, X0, Z0, NU, NV, W, D, CX, CZ, UP, EAVE, VAULT, DOME, lx, lz, HALL, ATR, COURT, BLOCKS, DOORS, GATES, TERRACE, FRAME, T, K, wallM, glassM, sign, roofParts, r3 };
