#!/usr/bin/env node
/* bake-mall.js — THE BAYSIDE MALL, THE INSIDE (2026-11-20; mondo: "the mall needs to be redone, since its outside looks nothing like its inside.
   It needs to be a real physical building inside disaster city" · "Own room, 2 or 3 plots. 2 floors. Yes. Sure. GO ahead").
   Writes ONE room, `site_prebuilt_bayside_mall` (site prebuilt_downtown, part `mall`), into data.js between BAYSIDE-MALL-BEGIN / END, and
   re-keys what pointed at the old hall (`site_prebuilt_downtown_mall`, retired here). `--dry-run` prints the counts and the walk check.
   Never hand-edit between the markers.
   THE BOX IS NOT IN THIS FILE: `docs/disaster-city/mall/box.js` holds the size, the halls, the blocks, the doors and the roof, and the
   city's own tool draws the OUTSIDE from the same numbers (districts/B.js mallShell). The room is the building: 20 x 11 squares, the same
   compass as the city, a place here = the city place minus (171.5, 22.75).
   HOW IT STANDS (the castle's rules, bake-camelot-castle.js, whose kit this tool carries):
   - the FIELD is the ground floor. A shop block you do not walk into is solid (`plateau` 5.25 m): its TOP is the upper floor (the galleries,
     the food court). Over a hall walked on both floors (the Arcade, the Department Store, the staff passage) and across a hall the upper
     floor is a `bridge` slab; slabs and solid tops overlap by half a metre.
   - a stair and an escalator are `ramp` rows on the field: nothing walked lies under them.
   - an upper wall or rail carries `y0`, its own foot, and hangs over the walker below.
   Notes: docs/notes/areas-complexes.md "THE BAYSIDE MALL". */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const REPO = __dirname, DRY = process.argv.includes('--dry-run');
const BOX = require('./docs/disaster-city/mall/box.js');
const { C, NU, NV, W, D, UP, EAVE, T, K, ATR, COURT } = BOX, X = BOX.lx, Z = BOX.lz, TH = 0.3, DW = 1.75, DH = 2.2, E = 0.14;
const r2 = v => Math.round(v * 100) / 100;
const J = v => JSON.stringify(v).replace(/"([a-zA-Z_][a-zA-Z0-9_]*)":/g, '$1:').replace(/'/g, "\\'").replace(/"/g, "'");
const DATA = require('./load-data.js').loadGameData();
const CAT = vm.runInContext('DOOR_HQ.catalogue', DATA), RACES = vm.runInContext('AVAILABLE_RACES', DATA);
const ID = 'site_prebuilt_bayside_mall', OLD = 'site_prebuilt_downtown_mall', CITY = 'site_prebuilt_downtown_streets';

/* ── THE KIT ── */
const F = [], P = [], props = [], doors = [], npc = [], inner = [], shops = [], stops = [];
let wn = 0;
/* a wall on a square line: axis 'u' = west-east on the line v = at; 'v' = north-south on the line u = at; a..b squares.
   o: h, y0 (its foot), key / tint / gain, glass, doors [[middle, leaf]], gaps [[from, to]], draw: false, walk: false */
function wall(axis, at, a, b, o) { o = o || {}; const h = o.h || EAVE, y0 = o.y0 || 0, k = (++wn % 7) * 0.003; a += k; b -= k;   // (two wall rows with the very same ends are ONE wall to the engine)
    const seg = (s0, s1) => { if (s1 - s0 < 0.02) return; const m = (s0 + s1) / 2, L = (s1 - s0) * C, px = axis === 'u' ? X(m) : X(at), pz = axis === 'u' ? Z(at) : Z(m);
        if (o.draw !== false) { const p = { s: 'box', p: [r2(px), r2(y0), r2(pz)], size: axis === 'u' ? [r2(L), h, TH] : [TH, h, r2(L)], uv: [3.5, 1.75] }; if (o.key) p.key = o.key; if (o.tint != null) p.tint = o.tint; if (o.gain) p.gain = o.gain; if (o.glow) p.glow = o.glow; if (o.glass) { p.kind = 'glass'; p.uv = 7; } P.push(p); }
        if (o.walk !== false) { const e = Math.min(0.15, L / 2 - 0.01), row = Object.assign({ k: 'wall' }, axis === 'u' ? { x0: r2(X(s0) + e), z0: r2(pz), x1: r2(X(s1) - e), z1: r2(pz) } : { x0: r2(px), z0: r2(Z(s0) + e), x1: r2(px), z1: r2(Z(s1) - e) }, { t: TH, ghost: true, rail: false });
            row.h = h; row.y = r2(y0 + h); if (y0 > 0) row.y0 = r2(y0); F.push(row); } };
    const cuts = (o.doors || []).map(d => ({ a: d[0] - DW / 2 / C, b: d[0] + DW / 2 / C, d })).concat((o.gaps || []).map(g => ({ a: g[0], b: g[1] }))).sort((p, q) => p.a - q.a);
    let cur = a;
    cuts.forEach(c => { seg(cur, c.a); cur = c.b; if (!c.d) return;
        const m = c.d[0], px = axis === 'u' ? X(m) : X(at), pz = axis === 'u' ? Z(at) : Z(m), fr = 0xf4f2ec;
        if (h > DH + 0.05) { const p = { s: 'box', p: [r2(px), r2(y0 + DH), r2(pz)], size: axis === 'u' ? [DW, r2(h - DH), TH] : [TH, r2(h - DH), DW], uv: [3.5, 1.75], under: true }; if (o.key) p.key = o.key; if (o.tint != null) p.tint = o.tint; if (o.gain) p.gain = o.gain; if (o.glass) { p.kind = 'glass'; p.uv = 7; } P.push(p); }
        [-1, 1].forEach(sd => P.push({ s: 'box', p: axis === 'u' ? [r2(px + sd * (DW / 2 + 0.06)), r2(y0), r2(pz)] : [r2(px), r2(y0), r2(pz + sd * (DW / 2 + 0.06))], size: axis === 'u' ? [0.12, DH + 0.1, TH + 0.08] : [TH + 0.08, DH + 0.1, 0.12], tint: fr }));
        P.push({ s: 'box', p: [r2(px), r2(y0 + DH), r2(pz)], size: axis === 'u' ? [DW + 0.24, 0.12, TH + 0.08] : [TH + 0.08, 0.12, DW + 0.24], tint: fr });
        if (c.d[1] && c.d[1] !== 'none') { const r = { x: r2(px), z: r2(pz), rot: axis === 'u' ? 0 : 90, w: DW - 0.2, leaf: c.d[1] }; if (y0 > 0) r.y = r2(y0); inner.push(r); } });
    seg(cur, b); }
const solid = (u0, v0, u1, v1, h) => F.push({ k: 'plateau', x: r2((X(u0) + X(u1)) / 2), z: r2((Z(v0) + Z(v1)) / 2), w: r2((u1 - u0) * C), d: r2((v1 - v0) * C), h, edge: 0.1 });
const deck = (u0, v0, u1, v1, y, key) => { const ew = (u1 - u0) >= (v1 - v0);
    F.push(ew ? { k: 'bridge', x0: r2(X(u0)), z0: r2(Z((v0 + v1) / 2)), x1: r2(X(u1)), z1: r2(Z((v0 + v1) / 2)), w: r2((v1 - v0) * C), y, key: key || 'terrazzo', rails: false, plain: true }
              : { k: 'bridge', x0: r2(X((u0 + u1) / 2)), z0: r2(Z(v0)), x1: r2(X((u0 + u1) / 2)), z1: r2(Z(v1)), w: r2((u1 - u0) * C), y, key: key || 'terrazzo', rails: false, plain: true }); };
/* a glass balustrade on an upper floor's edge: a white rail on posts, a glass pane under it, and a low hung wall */
const guard = (axis, at, a, b, y) => { if (b - a < 0.05) return; const m = (a + b) / 2, L = (b - a) * C, px = axis === 'u' ? X(m) : X(at), pz = axis === 'u' ? Z(at) : Z(m), sz = (w, h, t) => axis === 'u' ? [r2(w), h, t] : [t, h, r2(w)];
    P.push({ s: 'box', p: [r2(px), r2(y + 1.02), r2(pz)], size: sz(L, 0.07, 0.09), tint: T.WHITE }, { s: 'box', p: [r2(px), r2(y + 0.08), r2(pz)], size: sz(L - 0.1, 0.9, 0.03), key: K.gSq, tint: T.SKYGLASS, kind: 'glass', glow: 0.55, ds: true });
    for (let s = a; s <= b + 0.001; s += 0.5) P.push({ s: 'box', p: axis === 'u' ? [r2(X(s)), y, r2(pz)] : [r2(px), y, r2(Z(s))], size: [0.07, 1.05, 0.07], tint: T.WHITE });
    F.push(Object.assign({ k: 'wall' }, axis === 'u' ? { x0: r2(X(a) + 0.15), z0: r2(pz), x1: r2(X(b) - 0.15), z1: r2(pz) } : { x0: r2(px), z0: r2(Z(a) + 0.15), x1: r2(px), z1: r2(Z(b) - 0.15) }, { t: TH, ghost: true, rail: false, y: r2(y + 1.1), y0: y })); };
const ceil = (u0, v0, u1, v1, y, tint) => P.push({ s: 'box', p: [r2((X(u0) + X(u1)) / 2), r2(y - 0.2), r2((Z(v0) + Z(v1)) / 2)], size: [r2((u1 - u0) * C), 0.14, r2((v1 - v0) * C)], under: true, uv: 3.5, key: K.plaster, tint: tint != null ? tint : T.CREAM, gain: 2.3, glow: 0.45 });
const sign = (words, u, y, v, w, h, ry, fg, bg, glow) => P.push(BOX.sign(words, X(u), y, Z(v), w, h, ry, fg, bg, glow));
const box = (u, y, v, w, h, d, o) => P.push(Object.assign({ s: 'box', p: [r2(X(u)), y, r2(Z(v))], size: [w, h, d] }, o || {}));
const prop = (key, u, v, face, x) => { const o = Object.assign({ key, x: r2(X(u)), z: r2(Z(v)) }, face != null ? { face } : {}, x || {}); if (CAT[key] && CAT[key].wall && o.y != null) { o.mount = o.y; delete o.y; } props.push(o); return o; };
const up = (key, u, v, face, x) => prop(key, u, v, face, Object.assign({ y: UP }, x || {}));
const who = (race, u, v, face, y, say) => { const n = { x: r2(X(u)), z: r2(Z(v)), face: face || 0, race }; if (y) n.y = y; if (say) n.say = say; npc.push(n); };
const stop = (u, v, y) => stops.push([r2(X(u)), r2(Z(v)), y || 0]);
const SAND = BOX.wallM(T.SAND), CREAM = BOX.wallM(T.CREAM), CORAL = BOX.wallM(T.CORAL, K.plaster), GLS = { glass: true, key: K.gTall, tint: T.SKYGLASS, glow: 0.8, gain: 2.2 };

/* ── THE FIELD: the solid shop blocks (their tops are the upper floor), the stair's landing ── */
Object.keys(BOX.BLOCKS).forEach(k => { const b = BOX.BLOCKS[k]; if (b.k === 'solid') b.sq.forEach(q => solid(q[0], q[1], q[2], q[3], UP)); });
solid(4, 0, 6, 1, UP);                                                                 // the wide stair's landing, at the north end of the west cross hall
F.push({ k: 'ramp', x0: r2(X(5)), z0: r2(Z(4)), x1: r2(X(5)), z1: r2(Z(1) - 0.4), w: 5.25, h0: 0, h1: UP, stairs: true, model: 'glass', edge: 0.15 });   // THE WIDE STAIR (10.5 m for 5.25: 1 in 2)
F.push({ k: 'rail', x0: r2(X(5)), z0: r2(Z(3.9)), x1: r2(X(5)), z1: r2(Z(1.1)), y0: 0.15, y1: r2(UP - 0.2), model: 'pipe', block: false });
/* THE ESCALATORS: two side by side in the long concourse, up east onto the middle bridge (30 degrees: the run is the rise / tan 30) */
{ const run = r2(UP / Math.tan(Math.PI / 6)), x0 = r2(X(7.8));
  [-0.95, 0.95].forEach(dz => F.push({ k: 'ramp', x0, z0: r2(Z(5) + dz), x1: r2(x0 + run + 0.7), z1: r2(Z(5) + dz), w: 1.75, h0: 0, h1: UP, escalator: true, edge: 0 })); }

/* ── THE SLABS (5.25 m) ── */
deck(0, 0, 4 + E, 4, UP);                                                              // over THE ARCADE
deck(0, 6, 4, 11, UP);                                                                 // over THE DEPARTMENT STORE
deck(2.5, 4 - E, 4, 6 + E, UP);                                                        // the west bridge: the arcade's upper room to the store's
deck(4 - E, 7, 6 + E, 8, UP);                                                          // the store's bridge across the west cross hall
deck(10.4, 4 - E, 12, 6 + E, UP);                                                      // THE MIDDLE BRIDGE (the escalators' head)
deck(12, 4 - E, 13, 6 + E, UP); deck(17, 4 - E, 18, 6 + E, UP);                        // THE RING round the atrium: west, east,
deck(14 - E, 2, 16 + E, 3, UP); deck(14 - E, 7, 16 + E, 8, UP);                        // north, south
deck(18 - E, 0, 19 + E, 4, UP);                                                        // over the staff passage

/* ── THE OUTER WALLS (ground to eaves; glass at the halls' ends; the doorways) ── */
wall('v', 0, 0, 3, CREAM); wall('v', 0, 3, 7, Object.assign({ doors: [[5, 'none']] }, GLS)); wall('v', 0, 7, 11, SAND);                    // west: THE MAIN DOORS
wall('v', 20, 0, 3, CREAM); wall('v', 20, 3, 7, Object.assign({ doors: [[5, 'none']] }, GLS));                                           // east: THE SEA DOORS
wall('v', 20, 7, 11, Object.assign({ h: UP }, SAND)); wall('v', 20, 7, 11, Object.assign({ h: EAVE - UP, y0: UP, doors: [[7.5, 'none'], [9.5, 'none']] }, GLS));   // the food court's glass wall: THE TERRACE DOORS
wall('u', 0, 0, 3, CREAM); wall('u', 0, 3, 7, GLS); wall('u', 0, 7, 13, SAND);                                                           // north
wall('u', 0, 13, 17, Object.assign({ h: UP, doors: [[15, 'none']] }, SAND)); wall('u', 0, 13, 17, Object.assign({ h: EAVE - UP, y0: UP }, GLS));   // the closet door under the east hall's north window
wall('u', 0, 17, 20, Object.assign({ doors: [[18.5, 'none']] }, CREAM));                                                                 // THE STAFF DOOR
wall('u', 11, 0, 3, SAND); wall('u', 11, 3, 7, Object.assign({ doors: [[5, 'none']] }, GLS)); wall('u', 11, 7, 13, SAND);               // south: THE WEST CANAL DOORS
wall('u', 11, 13, 17, Object.assign({ doors: [[15, 'none']] }, GLS)); wall('u', 11, 17, 20, SAND);                                       // THE CANAL DOORS

/* ── THE UPPER SHOPS: a set-back row of units on each solid block (thin walls: nobody goes in), the galleries in front of them ── */
[['north', 3], ['south', 7], ['staff', 3]].forEach(([k, vv]) => { const m = BOX.BLOCKS[k].mass, o = Object.assign({ h: EAVE - UP, y0: UP }, CREAM);
    if (k === 'staff') { wall('u', vv, 18, 19, o); wall('u', vv, 19, 20, o); } else wall('u', vv, m[0], m[2], o);   // (a hung wall hangs only if its foot is over the highest ground under the WHOLE piece: the staff passage runs under this one)
    if (m[0] > 0.5) wall('v', m[0], m[1], m[3], o); if (m[2] < NU - 0.5) wall('v', m[2], m[1], m[3], o); });
/* the staff passage's side walls (ground) and the arcade's and the store's piers */
wall('v', 18, 0, 4, Object.assign({ h: UP, walk: false }, CREAM)); wall('v', 19, 0, 4, Object.assign({ h: UP, walk: false }, CREAM));
[[0.15, 4], [3.85, 4], [0.15, 6], [3.85, 6]].forEach(q => box(q[0], 0, q[1], 0.6, UP, 0.6, CORAL));
box(2, UP - 0.9, 4, 14, 0.9, 0.5, CORAL); box(2, UP - 0.9, 6, 14, 0.9, 0.5, CORAL);
sign('THE ARCADE', 2, UP - 0.78, 4 + 0.08, 7.5, 0.66, 0, '#ffffff', '', 0.7); sign('DEPARTMENT STORE', 2, UP - 0.78, 6 - 0.08, 9.5, 0.66, 180, '#ffffff', '', 0.7);

/* ── THE GUARDS: a glass balustrade on every open edge of the upper floor ── */
[   /* the north block */ ['u', 4, 6, 10.4], ['v', 13, 3, 4], ['u', 3, 13, 14], ['v', 14, 0, 2], ['v', 6, 1, 4],
    /* the south block */ ['u', 6, 6, 10.4], ['v', 13, 6, 7], ['u', 7, 13, 14], ['v', 14, 8, 11], ['v', 6, 6, 7], ['v', 6, 8, 11],
    /* the staff block */ ['v', 16, 0, 2], ['u', 3, 16, 17], ['v', 17, 3, 4], ['u', 4, 18, 19], ['u', 4, 19, 20],
    /* the food court   */ ['u', 6, 18, 20], ['v', 17, 6, 7], ['u', 7, 16, 17], ['v', 16, 8, 11],
    /* the arcade's and the store's upper rooms */ ['v', 4, 1, 4], ['u', 4, 0, 2.5], ['u', 6, 0, 2.5], ['v', 4, 6, 7], ['v', 4, 8, 11],
    /* the bridges' sides */ ['v', 12, 4, 6], ['v', 13, 4, 6], ['v', 17, 4, 6], ['v', 18, 4, 6], ['u', 2, 14, 16], ['u', 3, 14, 16], ['u', 7, 14, 16], ['u', 8, 14, 16], ['v', 2.5, 4, 6], ['v', 4, 4, 6], ['u', 7, 4, 6], ['u', 8, 4, 6],
].forEach(g => { if (g[0] === 'v' && g[1] === 12) return guard(g[0], 12.02, g[2], g[3], UP); guard(g[0], g[1], g[2], g[3], UP); });

/* ── THE CEILINGS under the hip roofs (the halls are under the glass) ── */
ceil(0, 0, 3, 3, EAVE); ceil(0, 7, 3, 11, EAVE); ceil(17, 7, 20, 11, EAVE);
/* and under the slabs (a slab's own underside draws dark) */
const UC = UP - 0.36; ceil(0, 0, 4, 4, UC); ceil(0, 6, 4, 11, UC); ceil(2.5, 4, 4, 6, UC); ceil(4, 7, 6, 8, UC); ceil(10.4, 4, 13, 6, UC); ceil(17, 4, 18, 6, UC); ceil(14, 2, 16, 3, UC); ceil(14, 7, 16, 8, UC); ceil(18, 0, 19, 4, UC);

/* ── THE ATRIUM: the fountain under the dome, THE CLOCK TOWER beside it (off the pier's line), the palms ── */
F.push({ k: 'pool', x: r2(X(ATR.u)), z: r2(Z(ATR.v)), r: 2.6, y: 0, depth: 0.4 });
F.push({ k: 'plateau', x: r2(X(13.5)), z: r2(Z(3.5)), r: 1.5, h: 8.5, edge: 0.2 });                                                    // THE CLOCK TOWER (the tape's: the door gun's)
P.push({ s: 'cyl', p: [r2(X(13.5)), 0, r2(Z(3.5))], r: 1.58, h: 8.5, seg: 16, key: K.plaster, tint: T.CORAL, gain: 2.3, cap: false }, { s: 'cyl', p: [r2(X(13.5)), 8.5, r2(Z(3.5))], r: 1.75, h: 0.3, seg: 16, tint: T.WHITE }, { s: 'cyl', p: [r2(X(13.5)), 5.6, r2(Z(3.5))], r: 1.62, h: 2.2, seg: 16, tint: T.CREAM, cap: false });
[0, 90, 180, 270].forEach(a => P.push(BOX.sign('XII · III · VI · IX', X(13.5) + Math.sin(a * Math.PI / 180) * 1.66, 6.45, Z(3.5) + Math.cos(a * Math.PI / 180) * 1.66, 2.0, 0.5, a, '#1c2330', '')));
[22, 112, 202, 292].forEach(a0 => F.push({ k: 'rail', arc: { x: r2(X(ATR.u)), z: r2(Z(ATR.v)), r: 3.9, a0, a1: a0 + 46 }, model: 'pipe', block: false }));
/* the grind ledges (the old hall's), either side of the canal hall */
F.push({ k: 'wall', x0: r2(X(14.35)), z0: r2(Z(8.4)), x1: r2(X(14.35)), z1: r2(Z(10.2)), h: 0.45, t: 0.5, key: 'urban:ConcreteStriped2a' }, { k: 'wall', x0: r2(X(15.65)), z0: r2(Z(8.4)), x1: r2(X(15.65)), z1: r2(Z(10.2)), h: 0.45, t: 0.5, key: 'urban:ConcreteStriped2a' });
/* the marble runners down the halls */
F.push({ k: 'path', pts: [[r2(X(0)), r2(Z(5))], [r2(X(7.6)), r2(Z(5))]], w: 3.0 }, { k: 'path', pts: [[r2(X(12.2)), r2(Z(5))], [r2(X(20)), r2(Z(5))]], w: 3.0 }, { k: 'path', pts: [[r2(X(15)), r2(Z(0))], [r2(X(15)), r2(Z(11))]], w: 3.0 }, { k: 'path', pts: [[r2(X(5)), r2(Z(4.2))], [r2(X(5)), r2(Z(11))]], w: 3.0 });
F.push({ k: 'scatter', key: 'park_bench', n: 5, seed: 1 }, { k: 'scatter', key: 'potted_plant', n: 8, seed: 2 }, { k: 'scatter', key: 'mall_bin', n: 5, seed: 3 });

/* ── THE SHOPFRONTS (three-renderer.js _hqBuildShopfronts): ground = the solid blocks' faces; upper = the set-back units' fronts ── */
const S = (u0, v0, u1, v1, nx, nz, y, names, o) => shops.push(Object.assign({ x0: r2(X(u0)), z0: r2(Z(v0)), x1: r2(X(u1)), z1: r2(Z(v1)), nx, nz, y, names }, y ? { wall: true } : { lip: UP }, o || {}));
S(6, 4, 13, 4, 0, 1, 0, ['DOORS R US', 'KEYS & KEYS', 'TAPE WORLD', 'PHONES']);                 // the north block, onto the long concourse
S(13, 6, 6, 6, 0, -1, 0, ['PRETZELS', 'THE GOO SHOP', 'NOTHING HAPPENED', 'SALT & LAMP']);      // the south block, facing it
S(14, 3, 14, 0, 1, 0, 0, ['RECORDS', 'SHOES']);                                                  // the north block's end, onto the east hall
S(16, 0, 16, 3, -1, 0, 0, ['THE LIMITED FORM', 'CUBE STOP']);                                    // the staff block's
S(14, 11, 14, 7, 1, 0, 0, ['GLASSES IN AN HOUR', 'OUT OF BUSINESS']);                            // the south block's end, onto the canal hall
S(16, 7, 16, 11, -1, 0, 0, ['HAZARD PAY LOANS', 'FORM 365 EXPRESS']);                            // under the food court
S(20, 6, 17, 6, 0, -1, 0, ['OCCAM’S', 'PHONES']);                                                // under the food court, onto the sea hall
S(6, 6, 6, 11, -1, 0, 0, ['SHOES', 'RECORDS', 'KEYS & KEYS']);                                   // the south block's west end, onto the west hall
S(7, 3, 12, 3, 0, 1, UP, ['DEPARTMENT STORE', 'GLASSES IN AN HOUR', 'CUBE STOP', 'TAPE WORLD']);   // upstairs, north
S(12, 7, 7, 7, 0, -1, UP, ['HAZARD PAY LOANS', 'THE GOO SHOP', 'FORM 365 EXPRESS', 'SALT & LAMP']); // upstairs, south
S(18, 3, 20, 3, 0, 1, UP, ['MALL OFFICE', 'SECURITY']);

/* ── THE SIGNS over the ways out, the directory ── */
sign('THE PIER  →', 19.82, 3.3, 5, 4.2, 0.6, 270, '#ffffff', '#ff7a66', 0.6); sign('← THE PLAZA', 0.18, 3.3, 5, 4.2, 0.6, 90, '#ffffff', '#ff7a66', 0.6);
sign('THE CANAL', 15, 3.3, 10.82, 3.6, 0.6, 180, '#ffffff', '#ff7a66', 0.6); sign('THE CANAL', 5, 3.3, 10.82, 3.6, 0.6, 180, '#ffffff', '#ff7a66', 0.6);
sign('STAFF ONLY', 18.5, 2.75, 3.9, 2.4, 0.42, 0, '#1c2330', '#ffe27a'); sign('THE FOOD COURT', 17.02, UP + 3.2, 6.5, 3.2, 0.55, 270, '#ffffff', '#ff7a66', 0.6);
sign('THE SEA TERRACE  →', 19.82, UP + 3.3, 8.5, 5.6, 0.55, 270, '#ffffff', '#44669c', 0.6);
prop('notice_board', 0.2, 6.4, 90, { y: 1.6 }); prop('exit_sign', 0.2, 5, 90, { y: 3.9 }); prop('security_camera', 0.2, 3.6, 90, { y: 3.6 });

/* ── THE PROPS, moved from the old hall ── */
[[-1.2, -1.2], [1.2, -1.2], [1.2, 1.2], [-1.2, 1.2]].forEach(q => prop('potted_plant', ATR.u + q[0], ATR.v + q[1]));                    // the atrium's palms
prop('wet_floor_sign', ATR.u + 0.9, ATR.v + 1.05, 30); prop('lava_lamp_floor', 16.5, 3.5); prop('lava_lamp_floor', 13.5, 6.5); prop('lava_lamp_floor', 16.5, 6.5);
prop('floor_stain', 15, 1.4); prop('paper_sheet', 1.4, 5.6, 60, { y: 0.01 }); prop('cardboard_boxes', 18.5, 1.2, 20); prop('riser_1', 19.3, 4.6, 0, { rect: false });
/* THE ARCADE (ground): the cabinets along the back wall, the screens */
[0.6, 1.2, 1.8, 2.4, 3.0, 3.4].forEach((u, i) => prop(i % 2 ? 'arcade_cabinet' : 'slot_machine', u, 0.35, 180));
[1.0, 2.0, 3.0].forEach(v => prop('arcade_cabinet', 0.35, v, 90)); prop('space_divider', 1.6, 2.6, 0); prop('space_divider', 2.9, 2.6, 0);
/* THE DEPARTMENT STORE (ground): racks and a counter */
prop('costume_rack', 0.8, 7.2, 90); prop('costume_rack', 0.8, 8.6, 90); prop('scarf_rack', 2.2, 9.6, 0); prop('psx_display_cabinet_mp_1', 3.2, 7.4, 270); prop('psx_display_cabinet_mp_2', 3.2, 9.0, 270); prop('cash_register', 2.0, 10.5, 0, { y: 1.0 }); prop('form_counter', 2.0, 10.5, 0);
/* upstairs: THE LOUNGES (the arcade's upper room, the store's), the lookouts on the galleries */
const lounge = (u, v, c1, c2) => { up('shag_rug', u, v, 0, { r: 2.3, color: c1, color2: c2 }); [[0, -0.55, 180], [0.5, -0.05, 240], [0.5, 0.45, 300], [0, 0.9, 0]].forEach(q => up('curved_sofa', u + q[0], v + q[1], q[2], { r: 2.4, color: c1 })); up('tulip_table', u, v + 0.1, 0, { r: 0.7 }); props.push({ key: 'lava_lamp', x: r2(X(u)), z: r2(Z(v + 0.1)), y: r2(UP + 0.74) }); };
lounge(1.6, 1.8, 0xe8641e, 0xf0b64a); lounge(1.6, 8.6, 0xc9622c, 0xe9d9a8);
up('egg_chair', 6.5, 2.2, 90, { color: 0xe0552a }); up('egg_chair', 6.5, 3.2, 90, { color: 0xe0552a }); up('egg_chair', 13.5, 9.2, 270, { color: 0x3d8f80 }); up('egg_chair', 13.5, 10.2, 270, { color: 0x3d8f80 });
/* THE FOOD COURT, on the solid block's top: counters on the south wall, tulip tables by the glass */
[[17.6, 7.6], [18.9, 8.3], [17.5, 9.4], [18.9, 10.0]].forEach((q, i) => { up('tulip_table', q[0], q[1]); up('tulip_chair', q[0] + 0.28, q[1], 270); up('tulip_chair', q[0] - 0.28, q[1], 90); });
props.push({ key: 'solo_cup', x: r2(X(17.6)), z: r2(Z(7.6)), y: r2(UP + 0.45) }, { key: 'papers_a', x: r2(X(18.9)), z: r2(Z(8.3)), y: r2(UP + 0.45) }); up('mall_bin', 16.4, 10.6); up('food_trolley', 17.3, 10.6, 0); up('cash_register', 18.6, 10.7, 0, { y: UP + 1.0 }); up('form_counter', 18.6, 10.7, 0);
/* the lamps: saucers under the solid ceilings, sputniks over the atrium's corners */
props.push({ key: 'saucer_pendant', x: r2(X(1.5)), z: r2(Z(1.5)), ceil: true, y: EAVE - 0.3 }, { key: 'saucer_pendant', x: r2(X(1.5)), z: r2(Z(9)), ceil: true, y: EAVE - 0.3 }, { key: 'saucer_pendant', x: r2(X(18.5)), z: r2(Z(9)), ceil: true, y: EAVE - 0.3 },
    { key: 'sputnik_lamp', x: r2(X(2)), z: r2(Z(2)), ceil: true, y: UP - 0.35 }, { key: 'sputnik_lamp', x: r2(X(2)), z: r2(Z(8.5)), ceil: true, y: UP - 0.35 });

/* ── THE PEOPLE (the old hall's four, their words unchanged) ── */
who('zombie', 18.3, 8.9, 90, UP, ['“Shopping.” “For what?” “Shopping.”', '“Were you here?” “Everyone was here. Nobody was here. Ask the camera.”']);
who('conspiracy theorist', 1.6, 5.3, 110, 0, ['“Ten feet tall. Nobody filmed it.” “Everyone filmed it.” “Nobody filmed it in FOCUS.”', '“The police said no aliens.” “Right.” “They did not say no ALIENS. They said no aliens. Listen to the emphasis.”']);
who('mad scientist', 1.9, 1.7, 180, 0, ['“The cabinet at the back is not a cabinet.” “What is it?” “Out of order. Mostly.”']);
who('zombie', 9.2, 3.5, 200, UP, ['“Browsing.” “For what?” “Browsing.”']);

/* ── THE WAYS OUT: each is the same door as on the outside (box.js DOORS), half a metre inside its wall, facing in ── */
const IN = { w: [0.5 / C, 0, 90], e: [-0.5 / C, 0, 270], n: [0, 0.5 / C, 180], s: [0, -0.5 / C, 0] }, AT = { main: 'mall' };
const DESC = {
    main: 'The glass doors onto the plaza. They open for everyone, which is the policy, and closed for the incident, which was not.',
    sea: 'The sea doors. Past them: the front, the road, the boardwalk, and the pier straight out over the water.',
    canal: 'Glass doors onto the quay. The canal runs along the mall’s south side with its boats tied up and nobody in them.',
    canalw: 'The second pair of doors onto the quay, at the foot of the west hall.',
    staff: 'STAFF ONLY on the inside, DELIVERIES on the outside. It lets out in the yard behind the Security office.',
    terrace1: 'Glass doors from the food court out onto the terrace: tables, umbrellas, the pier, the beach, the bay.',
    terrace2: 'Glass doors from the food court out onto the terrace: tables, umbrellas, the pier, the beach, the bay.' };
BOX.DOORS.forEach(d => { const o = IN[d.side];
    doors.push({ id: d.id, wall: 'free', x: r2(X(d.u + o[0])), z: r2(Z(d.v + o[1])), face: o[2], leaf: d.id === 'staff' ? 'leaf_exit' : 'leaf_glass', noEntrance: true, wide: d.id === 'main' || d.id === 'sea' || undefined,
        label: 'DISASTER CITY', sub: d.name + ' · OUT TO ' + d.to, action: { room: CITY, at: AT[d.id] || 'mall_' + d.id }, desc: DESC[d.id] }); });
doors.push({ id: 'closet', wall: 'free', x: r2(X(15)), z: r2(Z(0) + 0.5), face: 180, leaf: 'leaf_closet', noEntrance: true, label: 'SUPPLY CLOSET', sub: 'STAFF ONLY · THE BASEMENT STAIR', action: { room: 'site_prebuilt_downtown_closet', at: 'mall' },
    desc: 'STAFF ONLY, on a door at the north end of the east hall under the big window. The stair behind it goes down further than the mall has floors.' });
const spawn = { x: r2(X(1.4)), z: r2(Z(5)), face: 90 };
const lines = ['“What happened here?” “Nothing.” “The sign says so.” “The sign is why.”', '“The fountain is full of pennies.” “Wishes.” “Whose?” “Everyone who was not here.”', '“The arcade takes tokens.” “Where do I get tokens?” “The arcade.”',
    '“Is the escalator working?” “It is stairs now. It was always stairs. It has a motor for company.”', '“Two floors.” “Three, if you count the roof.” “Who counts the roof?” “The tape does.”'];
/* the walk check's stops: [u, v, floor] */
[[1.4, 5], [15, 5.95], [2, 2], [2, 8.5], [18.5, 2], [15, 10], [5, 10], [19, 5], [10, 5.6]].forEach(q => stop(q[0], q[1], 0));
[[2, 2], [2, 8.5], [5, 0.5], [10, 3.5], [10, 6.5], [11.2, 5], [16.5, 1.5], [18.5, 9], [15, 2.5], [15, 7.5], [3.2, 5], [5, 7.5], [19.5, 3.5], [17.5, 2], [12.5, 1.5], [12.5, 9]].forEach(q => stop(q[0], q[1], UP));
props.forEach(p => { if (!CAT[p.key]) throw new Error('not in the catalogue: ' + p.key); }); npc.forEach(n => { if (RACES.indexOf(n.race) < 0) throw new Error('not a unit: ' + n.race); });

/* ── the room's text ── */
const SKY = vm.runInContext("JSON.stringify(DOOR_HQ.rooms." + CITY + ".shell.sky)", DATA);
const rows = F.concat([{ k: 'arch', id: 'mall:in', x: 0, z: 0, y: 0, parts: P }, { k: 'arch', id: 'mall:roof', x: 0, z: 0, y: 0, parts: BOX.roofParts() }]);
if (inner.length) rows.push({ k: 'texbuilding', id: 'mall:doors', x: 0, z: 0, w: 2, d: 2, rot: 0, storeys: 1, skin: false, doorsOnly: true, leaf: 'leaf_glass', inner });
const M = [];
M.push("        /* BAYSIDE-MALL-BEGIN — THE BAYSIDE MALL, THE INSIDE (2026-11-20): written by `node bake-mall.js` from docs/disaster-city/mall/box.js (the same box the city's tool draws the outside from). Never hand-edit between the markers; edit the tool or the box and rerun. */");
M.push('        ' + ID + ': {');
["label: 'DISASTER CITY · THE BAYSIDE MALL',", "sub: 'THE ATRIUM · THE ARCADE · THE DEPARTMENT STORE · THE FOOD COURT · NOTHING HAPPENED HERE',", "kind: 'box', site: 'prebuilt_downtown', part: 'mall',",
 "shell: {", "    w: " + W + ", d: " + D + ", h: 12, wallH: 12, dadoH: 1.2, open: true, edge: 'open',",
 "    floor: 'terrazzo', wall: 'urban:PlasterWallPainted2a', dado: 'urban:TileMarble2d', trim: 'metal', ceiling: 'ceiling', apron: 'urban_street', skirt: 'concrete',",
 "    apronColor: 0xc9c6bd, floorColor: 0xece7da, wallColor: 0xf4f2ec, dadoColor: 0xdcd8d0, ceilColor: 0xf6f4ee,",
 "    pipes: false, strips: false, lights: [], sunShadow: false,   // no sun shadow: the glass roof lets the sky in, and the floors would stand in the slabs' shadow (three-renderer.js _hqShadowArm)",
 "    mood: { light: 0xfff4e0, ambient: 0.8 },", "    sky: " + J(JSON.parse(SKY)) + ",   // the city's own sky: it is the same afternoon outside the glass",
 "    plate: { x: " + spawn.x + ", z: 0, y: 3.4 },", "    look: HQ_ROOM_LOOKS.mall,", "},",
 "parti: 'One building, the same box as its outside in Bayside: a long concourse on the pier’s line from the plaza doors to the sea doors, two cross halls to the canal, the atrium under the dome where they meet, two floors of shops, the food court upstairs by the sea.',",
].forEach(l => M.push('            ' + l));
M.push('            terrain: {'); M.push("                res: 0.4375, floor: 'terrazzo', cliff: 'urban:PlasterWallPainted1a', path: 'urban:TileMarble2d',"); M.push('                noise: { amp: 0, scale: 6 },');
M.push('                features: ['); rows.forEach(f => M.push('                    ' + J(f) + ',')); M.push('                ],');
M.push('                shops: ['); shops.forEach(s => M.push('                    ' + J(s) + ',')); M.push('                ],'); M.push('            },');
M.push('            doors: ['); doors.forEach(d => M.push('                ' + J(d) + ',')); M.push('            ],');
M.push('            counters: [],'); M.push('            props: ['); for (let i = 0; i < props.length; i += 4) M.push('                ' + props.slice(i, i + 4).map(J).join(', ') + ',');
M.push('            ],'); M.push('            agents: [],'); M.push('            npcSpots: ' + J(npc) + ','); M.push('            onlineSpots: [' + J({ x: r2(X(19.2)), z: r2(Z(10)), face: 270, y: UP }) + '],');
M.push('            lines: ' + J(lines) + ','); M.push('            spawn: ' + J(spawn) + ','); M.push('        },'); M.push('        /* BAYSIDE-MALL-END */');
const block = M.join('\n') + '\n';
console.log(JSON.stringify({ rows: F.length, parts: P.length, props: props.length, shops: shops.length, doors: doors.length, natives: npc.length, bytes: block.length }));

/* ── write: the room (in the old hall's place the first time), then everything that named the old hall ── */
const file = path.join(REPO, 'data.js'); let src = fs.readFileSync(file, 'utf8');
const END = '        /* BAYSIDE-MALL-END */\n', b0 = src.indexOf('        /* BAYSIDE-MALL-BEGIN'), b1 = src.indexOf(END);
if (b0 >= 0 && b1 > b0) src = src.slice(0, b0) + block + src.slice(b1 + END.length);
else { const a = src.indexOf('        ' + OLD + ': {\n'), z = src.indexOf('        /* ── THE SUPPLY CLOSET (THE SECOND PASS', a); if (a < 0 || z < a) throw new Error('the old hall was not found in data.js'); src = src.slice(0, a) + block + src.slice(z); }
const sub = (re, to, what) => { if (!re.test(src)) { if (src.indexOf(what) < 0) console.warn('NOT FOUND (and its new form is not there either):', what); return; } src = src.replace(re, to); };
sub(/_MF_AREA_DELTA_BUILDERS\.site_prebuilt_downtown_mall = /, '_MF_AREA_DELTA_BUILDERS.' + ID + ' = ', '_MF_AREA_DELTA_BUILDERS.' + ID);
sub(/    site_prebuilt_downtown_mall: \[   \/\/ the atrium's skylights\n[^\n]*\n    \],/, "    " + ID + ": [ { x: " + r2(X(ATR.u)) + ", z: " + r2(Z(ATR.v)) + ", top: 13.6, h: 13.8, w: 6.0, tilt: 5, dir: 0, color: 0xf4f0e8, intensity: 0.3 }, { x: " + r2(X(COURT.u)) + ", z: " + r2(Z(COURT.v)) + ", top: 13.6, h: 13.8, w: 4.0, tilt: 5, dir: 0, color: 0xf4f0e8, intensity: 0.26 } ],   // the dome over the atrium, the lantern over the west court", "    " + ID + ": [ { x: ");
sub(/    site_prebuilt_downtown_mall:     \[\['THE FOOD COURT'/, "    " + ID + ":     [['THE FOOD COURT'", "    " + ID + ":     [['THE FOOD COURT'");
sub(/    site_prebuilt_downtown_mall: \{ tape: \{ x: [-\d.]+, z: [-\d.]+ \} \},[^\n]*/, "    " + ID + ": { tape: { x: " + r2(X(13.5)) + ", z: " + r2(Z(3.5)) + " } },   // on THE CLOCK TOWER (8.5 m: the door gun's, from the gallery beside it)", "    " + ID + ": { tape: { x: ");
sub(/    "site_prebuilt_downtown_mall": \{ list: \[/, '    "' + ID + '": { list: [', '    "' + ID + '": { list: [');
sub(/action: \{ room: 'site_prebuilt_downtown_mall', at: 'closet' \}/, "action: { room: '" + ID + "', at: 'closet' }", "action: { room: '" + ID + "', at: 'closet' }");
src = src.split("action: { room: '" + OLD + "', at: 'street' }").join("action: { room: '" + ID + "', at: 'main' }");   // the city's door (rewritten by its own tool too) and the old streets' door
if (src.indexOf(OLD + ": '" + ID + "'") < 0) { const i = src.indexOf("site_prebuilt_cyberpunk_streets: 'site_prebuilt_downtown_streets'"); if (i < 0) throw new Error('DOOR_HQ.retired was not found'); src = src.slice(0, i) + OLD + ": '" + ID + "',   /* THE BAYSIDE MALL (2026-11-20): the old hall, 96 x 64 m behind a 28 m building, is this one building now (bake-mall.js) */\n        " + src.slice(i); }

/* ── walk it: compile the room from the text and reach every stop from the spawn on the walker's own rule ── */
const tmp = path.join(require('os').tmpdir(), 'ew-mall-' + process.pid + '.js'); fs.writeFileSync(tmp, src); let bad = 0;
try { const D2 = require('./load-data.js').loadGameData({ quiet: true, file: tmp });
    const res = JSON.parse(vm.runInContext(`(function () { var info = hqTerrainInfo('${ID}'), R = info.rules, S = ${JSON.stringify(spawn)}, st = 0.4375, seen = {}, q = [], out = { stops: [], n: 0 };
        var y0 = hqTerrainFeet(info, S.x, S.z, null); if (y0 == null) return JSON.stringify({ err: 'the spawn is not walked' });
        var key = function (x, z, y) { return Math.round(x / st) + ',' + Math.round(z / st) + ',' + Math.round(y / 1.75); };
        q.push([S.x, S.z, y0]); seen[key(S.x, S.z, y0)] = 1; out.spawnY = y0;
        while (q.length) { var c = q.pop(); out.n++; [[st, 0], [-st, 0], [0, st], [0, -st]].forEach(function (d) { var x = c[0] + d[0], z = c[1] + d[1], y = hqTerrainFeet(info, x, z, c[2]);
            if (y == null || y - c[2] > R.climb + 0.01) return; var k = key(x, z, y); if (seen[k]) return; seen[k] = 1; q.push([x, z, y]); }); }
        var near = function (p) { for (var i = -2; i <= 2; i++) for (var j = -2; j <= 2; j++) if (seen[key(p[0] + i * st, p[1] + j * st, p[2])]) return true; return false; };
        out.stops = ${JSON.stringify(stops)}.map(near);
        out.pads = (info.pads || []).map(function (p) { return [p.door && p.door.id, near([p.x, p.z, p.h]), p.h]; });
        return JSON.stringify(out); })()`, D2));
    if (res.err) { console.log(ID + ': ' + res.err); bad++; }
    else { const miss = stops.filter((s, i) => !res.stops[i]), padMiss = res.pads.filter(p => !p[1]).map(p => p[0]);
        console.log(ID + ': spawn at ' + res.spawnY + ' m · walked ' + res.n + ' spots, ' + (stops.length - miss.length) + '/' + stops.length + ' stops' + (miss.length ? ' · NOT REACHED ' + JSON.stringify(miss) : '') + ' · doors ' + JSON.stringify(res.pads));
        bad += miss.length + padMiss.length; }
} finally { fs.unlinkSync(tmp); }
if (process.env.MALL_DEBUG) fs.writeFileSync(process.env.MALL_DEBUG, src);
if (bad && !process.env.MALL_FORCE) { console.error('the walk check failed (' + bad + ')'); process.exit(1); }
if (process.env.MALL_DEBUG) fs.writeFileSync(process.env.MALL_DEBUG, src);
if (DRY) process.exit(0);
fs.writeFileSync(file, src);
console.log('data.js: ' + ID + ' written (' + block.length + ' bytes)');
