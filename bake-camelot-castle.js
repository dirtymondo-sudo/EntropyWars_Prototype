#!/usr/bin/env node
/* bake-camelot-castle.js — CAMELOT CASTLE, ONE STACKED BUILDING (2026-11-15, mondo on docs/plans/camelot/camelot_castle_stacked_plan.png:
   "can we make the 3 rooms stacked like part of the same building, but the castle can be its own loading screen" + "real architecture/floor
   plan"; his answers: "1) yes", "do all 3 floors, not just 2", the sky castle is NOT in this room and waits).
   Writes ONE room, `site_prebuilt_camelot_palace` (site prebuilt_camelot, part `palace`), into data.js between CAMELOT-PALACE-BEGIN / END.
   `--dry-run` prints the counts and the walk check. Never hand-edit between the markers.
   The room is the palace's own footprint, 30 x 12 squares of 3.5 m (wings 0-8 and 22-30, the Keep 8-22). Squares are (u west to east,
   v north to south). SIX LEVELS, 7 m apart: the UNDERCROFT 0 · FLOOR 0 at 7 (the upper court's level, every way out) · FLOOR 1 at 14 ·
   FLOOR 2 at 21 · FLOOR 3 at 28 · THE BATTLEMENTS at 35.
   HOW IT STANDS (the engine's rules, learnt on the Desert's insides, bake-desert-insides.js, whose kit this tool carries):
   - the FIELD (one height a point) is the Undercroft's floor at 0, and solid stone at 7 wherever nothing lies under floor 0 (`plateau`
     rows: the stair range, the portal's sill, the cellar stairs' heads). Every floor over a walked room is a `bridge` slab (`R.deck`);
     two slabs, or a slab and solid ground, OVERLAP by 0.5 m (a slab is read 0.12 m in from its edge: a bare seam is a crack to fall in).
   - a stair is a `ramp` on the field: NO stair can stand over another, or over a walked room. So THE GREAT STAIR is one straight climb
     east along the north wall (floor 0 > 1 > 2 > 3, a landing a floor), then back west up to the Battlements; the two cellar stairs
     are in the wings. A flight ARRIVES 0.4 m into its landing and LEAVES from 0.5 m under the landing it starts on.
   - a prop / a native on a floor carries `y` = that floor's height (a `y` under 1 would stand it on the field, in the cellar).
   Notes: docs/notes/areas-complexes.md "CAMELOT CASTLE, ONE STACKED BUILDING". */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const REPO = __dirname, DRY = process.argv.includes('--dry-run'), C = 3.5, T = 0.3, DW = 1.75, DH = 2.2;
const r2 = v => Math.round(v * 100) / 100;
const J = v => JSON.stringify(v).replace(/"([a-zA-Z_][a-zA-Z0-9_]*)":/g, '$1:').replace(/'/g, "\\'").replace(/"/g, "'");
const D = require('./load-data.js').loadGameData();
const CAT = vm.runInContext('DOOR_HQ.catalogue', D), RACES = vm.runInContext('AVAILABLE_RACES', D);
const OLDN = JSON.parse(vm.runInContext('JSON.stringify(["keep", "dungeon", "ward"].map(k => DOOR_HQ.rooms["site_prebuilt_camelot_" + k]).map(r => ({ n: r.npcSpots, l: r.lines })))', D));
const say = (i, race, k) => { const n = OLDN[i].n.filter(n => n.race === race)[k || 0]; return n ? n.say : undefined; };
const U = n => 'urban:' + n, GLS = U('GlassWindowTall1a'), SLATE = U('MetalRoofTiles1a'), WALL = 'castle_wall', PLK = 'wood_planks', WOOD = 'wood';

/* ── THE KIT: one room on its squares ── */
function mk(NU, NV, pre) {
    const W = NU * C, Dd = NV * C, X = u => r2(-W / 2 + u * C), Z = v => r2(-Dd / 2 + v * C);
    const R = { NU, NV, W, D: Dd, X, Z, F: [], P: [], props: [], doors: [], npc: [], inner: [], block: {}, free: {}, must: [] };
    const sq = (u, v) => Math.floor(u) + ',' + Math.floor(v) + '@' + (R.lvl || 0); R.sq = sq;   // (a square is free or taken a FLOOR: R.lvl is the floor being built)
    /* a wall on a square line. axis 'u' = it runs west-east on the line v = at; 'v' = north-south on the line u = at; from a to b (squares).
       o: h (its height), y0 (its foot: an upper floor's wall hangs over the walker below), key / tint, glass, doors [[middle, leaf, double]]
       (leaf 'none' = the bare doorway), gaps [[from, to]] (a plain opening, whole squares), draw: false (walked only), walk: false (drawn only) */
    R.wall = (axis, at, a, b, o) => { o = o || {}; const h = o.h || 3.5, y0 = o.y0 || 0, base = o.base || 0;
        const seg = (s0, s1) => { if (s1 - s0 < 0.02) return; const m = (s0 + s1) / 2, L = (s1 - s0) * C, px = axis === 'u' ? X(m) : X(at), pz = axis === 'u' ? Z(at) : Z(m);
            if (o.draw !== false) { const p = { s: 'box', p: [px, r2(base + y0), pz], size: axis === 'u' ? [r2(L), h, T] : [T, h, r2(L)], uv: [3.5, 1.75] }; if (o.key) p.key = o.key; if (o.tint != null) p.tint = o.tint; if (o.glass) { p.kind = 'glass'; p.uv = 7; } R.P.push(p); }
            if (o.walk !== false) { const e = Math.min(0.15, L / 2 - 0.01), row = Object.assign({ k: 'wall' }, axis === 'u' ? { x0: r2(X(s0) + e), z0: pz, x1: r2(X(s1) - e), z1: pz } : { x0: px, z0: r2(Z(s0) + e), x1: px, z1: r2(Z(s1) - e) }, { t: T, ghost: true, rail: false });
                row.h = h; row.y = r2(base + y0 + h); if (y0 > 0) row.y0 = r2(base + y0); R.F.push(row); } };   // `y` = its top, `y0` = an upper floor wall's own foot (absolute: a stair under the line never lifts it)
        const cuts = (o.doors || []).map(d => ({ a: d[0] - DW / 2 / C, b: d[0] + DW / 2 / C, d })).concat((o.gaps || []).map(g => ({ a: g[0], b: g[1] }))).sort((p, q) => p.a - q.a);
        let cur = a;
        cuts.forEach(c => { seg(cur, c.a); cur = c.b; if (!c.d) return;
            const m = c.d[0], px = axis === 'u' ? X(m) : X(at), pz = axis === 'u' ? Z(at) : Z(m), yb = r2(base + y0), fr = o.frame != null ? o.frame : 0x3a3d42;
            if (h > DH + 0.05) { const p = { s: 'box', p: [px, r2(yb + DH), pz], size: axis === 'u' ? [DW, r2(h - DH), T] : [T, r2(h - DH), DW], uv: [3.5, 1.75], under: true }; if (o.key) p.key = o.key; if (o.tint != null) p.tint = o.tint; if (o.glass) { p.kind = 'glass'; p.uv = 7; } R.P.push(p); }
            [-1, 1].forEach(sd => R.P.push({ s: 'box', p: axis === 'u' ? [r2(px + sd * (DW / 2 + 0.06)), yb, pz] : [px, yb, r2(pz + sd * (DW / 2 + 0.06))], size: axis === 'u' ? [0.12, DH + 0.1, T + 0.08] : [T + 0.08, DH + 0.1, 0.12], tint: fr }));
            R.P.push({ s: 'box', p: [px, r2(yb + DH), pz], size: axis === 'u' ? [DW + 0.24, 0.12, T + 0.08] : [T + 0.08, 0.12, DW + 0.24], tint: fr });
            if (c.d[1] && c.d[1] !== 'none') { const r = { x: px, z: pz, rot: axis === 'u' ? 0 : 90, w: DW - 0.2, leaf: c.d[1] }; if (c.d[2]) r.double = true; if (yb > 0) r.y = yb; R.inner.push(r); }
            /* the squares either side of a doorway stay clear of blockers */
            if (axis === 'u') { R.must.push(sq(m, at - 0.5), sq(m, at + 0.5)); } else { R.must.push(sq(at - 0.5, m), sq(at + 0.5, m)); } });
        seg(cur, b); };
    /* a drawn slab (a ceiling, a roof of a low room): squares u0..u1 x v0..v1, its underside at y */
    R.ceil = (u0, v0, u1, v1, y, key, tint) => { const p = { s: 'box', p: [X((u0 + u1) / 2), y, Z((v0 + v1) / 2)], size: [r2((u1 - u0) * C), 0.14, r2((v1 - v0) * C)], under: true, uv: 3.5 }; if (key) p.key = key; if (tint != null) p.tint = tint; R.P.push(p); };
    /* an upper floor over walked ground: a slab the walker stands on (a bridge row), whole squares */
    R.deck = (u0, v0, u1, v1, y, key) => { const ew = (u1 - u0) >= (v1 - v0);
        R.F.push(ew ? { k: 'bridge', x0: X(u0), z0: Z((v0 + v1) / 2), x1: X(u1), z1: Z((v0 + v1) / 2), w: r2((v1 - v0) * C), y, key, rails: false, plain: true }
                    : { k: 'bridge', x0: X((u0 + u1) / 2), z0: Z(v0), x1: X((u0 + u1) / 2), z1: Z(v1), w: r2((u1 - u0) * C), y, key, rails: false, plain: true }); };
    /* a guard rail on an upper floor's edge: posts + two bars, and a low wall nobody on the floor walks through (the walker below passes under) */
    R.guard = (axis, at, a, b, y, tint) => { const m = (a + b) / 2, L = (b - a) * C, px = axis === 'u' ? X(m) : X(at), pz = axis === 'u' ? Z(at) : Z(m), tn = tint != null ? tint : 0x4a4f56;
        for (const yy of [0.55, 1.05]) R.P.push({ s: 'box', p: [px, r2(y + yy), pz], size: axis === 'u' ? [r2(L), 0.06, 0.06] : [0.06, 0.06, r2(L)], tint: tn });
        for (let s = a; s <= b + 0.001; s += 0.5) R.P.push({ s: 'box', p: axis === 'u' ? [X(s), y, pz] : [px, y, Z(s)], size: [0.07, 1.08, 0.07], tint: tn });
        R.F.push(Object.assign({ k: 'wall' }, axis === 'u' ? { x0: r2(X(a) + 0.15), z0: pz, x1: r2(X(b) - 0.15), z1: pz } : { x0: px, z0: r2(Z(a) + 0.15), x1: px, z1: r2(Z(b) - 0.15) }, { t: T, ghost: true, rail: false, y: r2(y + 1.1), y0: y })); };
    /* a flight of stairs, whole squares wide: from the middle of edge (u0, v0) up to (u1, v1); the head runs 0.4 m into the floor it meets */
    R.stair = (u0, v0, u1, v1, w, h0, h1, model) => { const dx = Math.sign(u1 - u0), dz = Math.sign(v1 - v0);
        R.F.push({ k: 'ramp', x0: X(u0), z0: Z(v0), x1: r2(X(u1) + dx * 0.4), z1: r2(Z(v1) + dz * 0.4), w: r2(w * C), h0, h1, stairs: true, model: model || 'steel', edge: 0.15 });
        for (let u = Math.min(u0, u1); u < Math.max(u0, u1) || u === u0 && u === u1; u++) { for (let v = Math.min(v0, v1); v < Math.max(v0, v1) || v === v0 && v === v1; v++) { R.block[sq(u, v)] = 'stair'; if (v0 === v1) break; } if (u0 === u1) break; } };
    /* a model. `B` = it blocks: it stands on the middle of square (u, v) (whole numbers) or fills nu x nv squares from it; decor takes any spot */
    R.B = (key, u, v, face, x) => { const nu = (x && x.nu) || 1, nv = (x && x.nv) || 1; for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) R.block[sq(u + i, v + j)] = key;
        const o = Object.assign({ key, x: X(u + nu / 2), z: Z(v + nv / 2) }, face != null ? { face } : {}, x || {}); delete o.nu; delete o.nv; R.props.push(o); return o; };
    /* (a catalogue WALL piece stands free at its spot: its `y` is its mount height on the wall beside it) */
    R.dec = (key, u, v, face, x) => { const o = Object.assign({ key, x: X(u), z: Z(v) }, face != null ? { face } : {}, x || {}); if (CAT[key] && CAT[key].wall && o.y != null) { o.mount = o.y; delete o.y; } R.props.push(o); return o; };
    /* a bulb under a ceiling at y (a real light: three-renderer.js HQ_PROP_LIGHT_MAX = 10 a room, so at most eight of these) */
    R.bulb = (u, v, y) => R.props.push({ key: 'bare_bulb', x: X(u), z: Z(v), ceil: true, y });
    R.who = (race, u, v, face, say) => { const n = { x: X(u), z: Z(v), face: face || 0, race }; if (say) n.say = say; R.npc.push(n); R.block[sq(u, v)] = R.block[sq(u, v)] || null; };
    R.lamp = (u, v, y) => R.P.push({ s: 'box', p: [X(u), r2(y - 0.5), Z(v)], size: [0.04, 0.5, 0.04], tint: 0x2a2c30 }, { s: 'cyl', p: [X(u), r2(y - 0.72), Z(v)], r: 0.42, r2: 0.16, h: 0.22, seg: 10, tint: 0x2a2c30 }, { s: 'cyl', p: [X(u), r2(y - 0.78), Z(v)], r: 0.3, h: 0.06, seg: 10, tint: 0xfff4d8, glow: 1 });
    R.sign = (words, u, v, y, w, h, ry, fg, bg, font) => R.P.push({ s: 'quad', p: [X(u), y, Z(v)], size: [w, h], ry: ry || 0, key: 'txt:' + words + '|' + (fg || '#f0f0f0') + '|' + (bg || '') + '|' + r2(w / h) + '||' + (font || 'stencil'), uv: 'fit', kind: bg ? 'wall' : 'over' });
    R.box = (u, v, y, w, h, d, key, tint, x) => { const p = Object.assign({ s: 'box', p: [X(u), y, Z(v)], size: [w, h, d] }, x || {}); if (key) p.key = key; if (tint != null) p.tint = tint; R.P.push(p); return p; };
    return R;
}
const check = (name, R) => { R.props.forEach(p => { if (!CAT[p.key]) throw new Error(name + ': not in the catalogue: ' + p.key); }); R.npc.forEach(n => { if (RACES.indexOf(n.race) < 0) throw new Error(name + ': not a unit: ' + n.race); });
    const bad = R.must.filter(k => R.block[k]).map(k => R.block[k] + ' @ ' + k);
    if (process.env.INS_DUMP) { console.log(name); for (let v = 0; v < R.NV; v++) { let l = ''; for (let u = 0; u < R.NU; u++) { const k = u + ',' + v; l += R.block[k] ? (R.must.indexOf(k) >= 0 ? '!' : 'X') : R.must.indexOf(k) >= 0 ? 'o' : '.'; } console.log(l); } }
    if (bad.length) throw new Error(name + ': a blocker stands in a doorway square: ' + bad.join(' · ')); };


/* THE ROYAL BANNER (2026-11-16, mondo on the first screenshots: "wtf is this random red rectangle and yellow square. if its a flag or a
   banner it needs way more detail and thought behind it"). One banner, the same everywhere in Camelot: an iron rod with gilt finials on two
   brackets, a crimson cloth with a gold border, cut to a swallowtail at the foot; on it Arthur's arms: the gold crown over the sword in
   the stone (the blade point down in a grey stone). → parts in a frame where the cloth hangs in the x plane and faces +z * nz.
   (cx, y0, cz) = the middle of its foot, w x h its size. */
function royalBanner(cx, y0, cz, w, h, nz) {
    const P = [], r = v => Math.round(v * 1000) / 1000, CR = 0xa01e2c, CR2 = 0x7c1420, GO = 0xd8b050, IRON = 0x2a2c30, ST = 0x8a8c90, BL = 0xd4d8e0;
    const L = (dx, dy, bw, bh, tint, layer, x) => P.push(Object.assign({ s: 'box', p: [r(cx + dx), r(y0 + dy), r(cz + nz * 0.02 * layer)], size: [r(bw), r(bh), 0.03], tint, ds: true }, x || {}));
    const tail = h * 0.16, top = h, body = h - tail;
    /* the rod, its finials, the two brackets back to the wall */
    P.push({ s: 'box', p: [cx, r(y0 + top), cz], size: [r(w + 0.5), 0.09, 0.09], tint: IRON }); for (const s of [-1, 1]) { P.push({ s: 'box', p: [r(cx + s * (w / 2 + 0.3)), r(y0 + top - 0.04), cz], size: [0.17, 0.17, 0.17], tint: GO }); P.push({ s: 'box', p: [r(cx + s * w * 0.3), r(y0 + top + 0.02), r(cz - nz * 0.14)], size: [0.06, 0.06, 0.3], tint: IRON }); }
    /* the cloth: the field, the darker inner panel, the gold border; the swallowtail = two tails stepping to a point each */
    L(0, tail, w, body, CR, 0); L(0, tail + body * 0.06, w * 0.8, body * 0.88, CR2, 1);
    for (const s of [-1, 1]) L(s * (w / 2 - w * 0.035), tail, w * 0.07, body, GO, 2);
    L(0, top - h * 0.035, w, h * 0.035, GO, 2); L(0, tail, w, h * 0.022, GO, 2);
    for (const s of [-1, 1]) for (let k = 0; k < 4; k++) { const tw = w * 0.5 * (1 - k * 0.24); L(s * (w / 2 - tw / 2), tail - (k + 1) * tail / 4, tw, tail / 4 + 0.002, CR, 0); L(s * (w / 2 - w * 0.035), tail - (k + 1) * tail / 4, w * 0.07, tail / 4 + 0.002, GO, 2); }
    /* the crown: a band with three jewels, five points (the middle one tallest), a pearl on each */
    const cy = tail + body * 0.66, cw = w * 0.46;
    L(0, cy, cw, body * 0.045, GO, 3); for (const k of [-1, 0, 1]) L(k * cw * 0.3, cy + body * 0.012, cw * 0.09, body * 0.022, k ? 0x2c4a9a : CR, 4);
    for (const k of [-2, -1, 0, 1, 2]) { const ph = body * (k === 0 ? 0.09 : Math.abs(k) === 1 ? 0.06 : 0.075), px = k * cw * 0.22; L(px, cy + body * 0.045, cw * 0.12, ph * 0.5, GO, 3); L(px, cy + body * 0.045 + ph * 0.5, cw * 0.07, ph * 0.5, GO, 3); L(px, cy + body * 0.045 + ph, cw * 0.09, cw * 0.09, 0xf4ecd8, 4); }
    /* the sword in the stone: pommel, grip, guard, the blade into a stepped grey stone */
    const sy = tail + body * 0.2, bl = body * 0.3;
    L(0, sy, w * 0.42, body * 0.07, ST, 3); L(0, sy + body * 0.07, w * 0.28, body * 0.04, ST, 3); L(-w * 0.08, sy + body * 0.02, w * 0.1, body * 0.02, 0x6e7074, 4);
    L(0, sy + body * 0.09, w * 0.055, bl, BL, 4); L(0, sy + body * 0.09 + bl, w * 0.24, body * 0.022, GO, 4); L(0, sy + body * 0.112 + bl, w * 0.04, body * 0.06, 0x4a3626, 4); L(0, sy + body * 0.172 + bl, w * 0.075, w * 0.075, GO, 4);
    return P;
}

/* ════ THE CASTLE (30 x 12) ════ */
const NU = 30, NV = 12, LU = 0, L0 = 7, L1 = 14, L2 = 21, L3 = 28, LB = 35, SH = 6.7, E = 0.14;   // SH: a storey's wall under the next slab; E: half a metre in squares (the slabs' overlap)
const R = mk(NU, NV), X = R.X, Z = R.Z;
const STONE = 0xc4c0b8, STONE2 = 0xaeaaa6, PALE = 0xdcd6ca, DARK = 0x8a8680, BLUE = 0x4a5c8c, WARM = 0xf0d890, RED = 0xb02c36, GOLD = 0xd8b050, TIMBER = 0x4a3626;
const LEAF = 'leaf_shabby_wood';
/* a wall of one storey on level L (a..b squares); `m` mirrors it east as well */
const mir = (axis, at, a, b, o) => { const q = Object.assign({}, o); if (axis === 'u') { if (o.doors) q.doors = o.doors.map(d => [NU - d[0]].concat(d.slice(1))); if (o.gaps) q.gaps = o.gaps.map(g => [NU - g[1], NU - g[0]]); return ['u', at, NU - b, NU - a, q]; } return ['v', NU - at, a, b, q]; };
/* (two wall rows with the very same ends are ONE wall to the engine: a floor's wall over the same line as the floor below's would join it and
   stand from the lower one's foot to the upper one's top, shutting every doorway between. So each floor's pieces are a centimetre or two shorter.) */
function W(axis, at, a, b, L, o, both) { R.lvl = L; const q = Object.assign({ key: WALL, tint: L === LU ? DARK : STONE, h: SH, y0: L }, o || {}), k = Math.round(L / 7) * 0.006; a = a + k; b = b - k; R.wall(axis, at, a, b, q); if (both) R.wall.apply(null, mir(axis, at, a, b, q)); }
const WW = (axis, at, a, b, L, o) => W(axis, at, a, b, L, o, true);
const deck = (u0, v0, u1, v1, y, key, both) => { R.deck(u0, v0, u1, v1, y, key); if (both) R.deck(NU - u1, v0, NU - u0, v1, y, key); };
const ceil = (u0, v0, u1, v1, y, key, tint, both) => { R.ceil(u0, v0, u1, v1, r2(y - 0.34), key, tint); if (both) R.ceil(NU - u1, v0, NU - u0, v1, r2(y - 0.34), key, tint); };
const solid = (u0, v0, u1, v1, h) => R.F.push({ k: 'plateau', x: X((u0 + u1) / 2), z: Z((v0 + v1) / 2), w: r2((u1 - u0) * C), d: r2((v1 - v0) * C), h, edge: 0.1 });
/* a flight on the field: from the line `from` up to the line `to` (squares along u) on the row whose middle is v; `leave` = it starts on a slab */
function flight(from, to, v, h0, h1, leave) { R.lvl = h0; const dir = Math.sign(to - from), sl = (h1 - h0) / (Math.abs(to - from) * C + 0.4), back = leave ? 0.5 : 0;
    R.F.push({ k: 'ramp', x0: r2(X(from) - dir * back), z0: Z(v), x1: r2(X(to) + dir * 0.4), z1: Z(v), w: C, h0: r2(h0 - back * sl), h1, stairs: true, model: 'stone', edge: 0, key: 'cobblestone', side: 'castle_wall', runner: { color: 0xa01e2c } });   // (its own sheets: a keyless flight wears the shell's green floor colour)
    for (let u = Math.min(from, to); u < Math.max(from, to); u++) R.block[R.sq(u, v)] = 'stair'; }
/* a column: drawn round, weighs a short ghost wall */
function column(u, v, L, h, r, tint) { R.P.push({ s: 'cyl', p: [X(u), L, Z(v)], r: r || 0.45, h, seg: 12, key: WALL, tint: tint != null ? tint : PALE }, { s: 'cyl', p: [X(u), L, Z(v)], r: (r || 0.45) + 0.18, h: 0.5, seg: 12, key: WALL, tint: STONE2 }, { s: 'cyl', p: [X(u), r2(L + h - 0.5), Z(v)], r: (r || 0.45) + 0.18, h: 0.5, seg: 12, key: WALL, tint: STONE2 });
    R.F.push({ k: 'wall', x0: r2(X(u) - 0.3), z0: Z(v), x1: r2(X(u) + 0.3), z1: Z(v), t: 0.7, ghost: true, rail: false, h, y: r2(L + h), y0: L > 0 ? L : undefined }); R.lvl = L; R.block[R.sq(u, v)] = R.block[R.sq(u, v)] || 'column'; }
/* a lit window on the inside face of an outer wall: axis / at as a wall's, m = its middle, `inw` = which way is indoors (+1 / -1) */
function win(axis, at, m, L, inw, h, y) { const o = 0.17 * inw, hh = h || 3.0, yy = L + (y || 1.6); R.P.push(axis === 'u' ? { s: 'box', p: [X(m), yy, r2(Z(at) + o)], size: [1.3, hh, 0.05], key: GLS, tint: 0xcfe0f4, glow: 0.55 } : { s: 'box', p: [r2(X(at) + o), yy, Z(m)], size: [0.05, hh, 1.3], key: GLS, tint: 0xcfe0f4, glow: 0.55 }); }
/* a guard on an upper floor's edge (mondo on the Battlements: "modern metal guard rails for a fantasy castle??"): `stone` = a low wall
   under a coping, `wood` = a timber balustrade (turned balusters under a moulded rail). Either weighs a low hung wall. */
function guard(axis, at, a, b, y, kind) { const m = (a + b) / 2, L = (b - a) * C, px = axis === 'u' ? X(m) : X(at), pz = axis === 'u' ? Z(at) : Z(m), sz = (w, h, t) => axis === 'u' ? [r2(w), h, t] : [t, h, r2(w)];
    if (kind === 'wood') { R.P.push({ s: 'box', p: [px, r2(y + 0.98), pz], size: sz(L, 0.14, 0.2), key: WOOD, tint: 0x6a4a30 }, { s: 'box', p: [px, r2(y + 0.08), pz], size: sz(L, 0.1, 0.16), key: WOOD, tint: 0x6a4a30 });
        const n = Math.max(2, Math.round(L / 0.4)); R.P.push({ s: 'cyl', p: axis === 'u' ? [r2(X(a) + L / n / 2), r2(y + 0.18), pz] : [px, r2(y + 0.18), r2(Z(a) + L / n / 2)], r: 0.055, h: 0.8, seg: 6, key: WOOD, tint: 0x8a6240, n, step: axis === 'u' ? [r2(L / n), 0, 0] : [0, 0, r2(L / n)] });
        for (let s = a; s <= b + 0.001; s += 1) R.P.push({ s: 'box', p: axis === 'u' ? [X(s), y, pz] : [px, y, Z(s)], size: [0.22, 1.2, 0.22], key: WOOD, tint: 0x5a3c26 }, { s: 'box', p: axis === 'u' ? [X(s), r2(y + 1.2), pz] : [px, r2(y + 1.2), Z(s)], size: [0.3, 0.1, 0.3], key: WOOD, tint: 0x5a3c26 }); }
    else { R.P.push({ s: 'box', p: [px, y, pz], size: sz(L, 0.95, 0.34), key: WALL, tint: STONE2 }, { s: 'box', p: [px, r2(y + 0.95), pz], size: sz(L + 0.1, 0.14, 0.46), key: WALL, tint: PALE }); }
    R.F.push(Object.assign({ k: 'wall' }, axis === 'u' ? { x0: r2(X(a) + 0.15), z0: pz, x1: r2(X(b) - 0.15), z1: pz } : { x0: px, z0: r2(Z(a) + 0.15), x1: px, z1: r2(Z(b) - 0.15) }, { t: T, ghost: true, rail: false, y: r2(y + 1.1), y0: y })); }
const B = (key, u, v, face, L, x) => (R.lvl = L, 0) || R.B(key, u, v, face, Object.assign(L > 0 ? { y: L } : {}, x || {}));
const dec = (key, u, v, face, L, x) => { const o = Object.assign({}, x || {}); if (L > 0) o.y = r2(L + (o.y || 0)); else if (!o.y) delete o.y; return R.dec(key, u, v, face, o); };
const who = (race, u, v, face, L, lines) => { const n = { x: X(u), z: Z(v), face: face || 0, race }; if (L > 0) n.y = L; if (lines) n.say = lines; R.npc.push(n); };
const both = f => { f(u => u, f0 => f0, u => u); f(u => NU - u, f0 => (360 - f0) % 360, u => NU - 1 - u); };   // (m: a point's mirror, f: a facing's, ms: a square's)

/* ── THE FIELD: stone at floor 0's height wherever no cellar lies under it ── */
solid(8, 0, 22, 2, L0);                                         // under THE GREAT STAIR's range (the flights stand on it)
solid(13, 10, 17, 12, L0);                                      // the portal's sill
solid(4, 9, 8, 10, L0); solid(22, 9, 26, 10, L0);               // the cellar stairs' heads (the Servery's and the Guard Room's south strip)
/* THE GREAT STAIR: three flights east along the north wall, the fourth back west beside the last */
flight(9, 12, 0.5, L0, L1, false); flight(13, 16, 0.5, L1, L2, true); flight(17, 20, 0.5, L2, L3, true); flight(20, 17, 1.5, L3, LB, true);
/* the cellar stairs: Kitchen down to the Vaults, Guard Room down to the Cistern */
flight(1, 4, 9.5, LU, L0, false); flight(29, 26, 9.5, LU, L0, false);

/* ── THE SLABS ── */
/* floor 0 (7 m) */
deck(0, 2, 8 + E, 9, L0, 'cobblestone', true); deck(4 - E, 8.5, 8 + E, 9 + E, L0, 'cobblestone', true);
deck(8 - E, 2 - E, 22 + E, 10 + E, L0, 'marble'); deck(8 - E, 10 - E, 13 + E, 12, L0, 'marble'); deck(17 - E, 10 - E, 22 + E, 12, L0, 'marble');
/* floor 1 (14 m): the wings' upper halls, the north range, the gallery round the Throne Hall's void, the stair's landing */
deck(0, 2, 8 + E, 10, L1, PLK, true);
deck(8 - E, 1 - E, 17 + E, 2 + E, L1, 'cobblestone'); deck(8 - E, 2 - E, 22 + E, 6, L1, PLK); deck(8 - E, 10, 22 + E, 12, L1, PLK); deck(8 - E, 6 - E, 10, 10 + E, L1, PLK); deck(20, 6 - E, 22 + E, 10 + E, L1, PLK);
deck(12, 0, 13, 1 + E, L1, 'cobblestone');
/* floor 2 (21 m): the wings' roofs, the royal floor */
deck(0, 2, 8 + E, 10, L2, 'cobblestone', true);
deck(8 - E, 1 - E, 17 + E, 2 + E, L2, 'cobblestone'); deck(8 - E, 2 - E, 22 + E, 12, L2, PLK); deck(16, 0, 17, 1 + E, L2, 'cobblestone');
/* floor 3 (28 m) */
deck(8 - E, 1 - E, 17 + E, 2 + E, L3, 'cobblestone'); deck(20, 1 - E, 22, 2 + E, L3, 'cobblestone'); deck(8 - E, 2 - E, 22 + E, 12, L3, PLK); deck(20, 0, 22, 1 + E, L3, 'cobblestone');
/* the Battlements (35 m): the walk all round, the bridge walk to the Spire, the Spire Room */
deck(8, 0, 22, 1 + E, LB, 'cobblestone'); deck(8, 1 - E, 17, 2 + E, LB, 'cobblestone'); deck(20, 1 - E, 22, 2 + E, LB, 'cobblestone');
deck(8, 2 - E, 10, 12, LB, 'cobblestone'); deck(20, 2 - E, 22, 12, LB, 'cobblestone'); deck(10 - E, 10, 20 + E, 12, LB, 'cobblestone'); deck(14, 2 - E, 16, 4 + E, LB, 'cobblestone'); deck(13, 4, 17, 8, LB, PLK);
/* the ceilings you look up at (drawn): stone vaults over the cellar, timber over the halls */
ceil(0, 2, 30, 10, L0, WALL, 0x9a968e); ceil(8, 2, 22, 12, L0, WALL, 0x9a968e);
ceil(0, 2, 8, 10, L1, WOOD, 0x6a4a30, true); ceil(8, 2, 22, 4, L1, WOOD, 0x6a4a30);
ceil(0, 2, 8, 10, L2, WOOD, 0x5a3c26, true); ceil(8, 2, 22, 12, L2, WOOD, 0x5a3c26); ceil(8, 2, 22, 12, L3, WOOD, 0x6a4a30); ceil(8, 2, 22, 12, LB, WOOD, 0x5a3c26); ceil(8, 0, 22, 2, LB, WALL, 0x9a968e);

/* ── THE OUTER WALLS (one piece each from the cellar's floor to the battlements; the doorways are cut in floor 0's storey) ── */
const TALLK = { key: WALL, tint: PALE }, TALLW = { key: WALL, tint: STONE };
W('u', 0, 8, 22, 0, Object.assign({ h: LB, y0: 0 }, TALLK));                                                             // the Keep's north wall
W('u', 12, 8, 22, 0, Object.assign({ h: L0, y0: 0 }, TALLK)); W('u', 12, 8, 22, L0, Object.assign({ h: LB - L0, doors: [[15, 'none']] }, TALLK));   // its south wall, THE PORTAL
WW('v', 8, 0, 2, 0, Object.assign({ h: LB, y0: 0 }, TALLK)); WW('v', 8, 10, 12, 0, Object.assign({ h: LB, y0: 0 }, TALLK));
WW('v', 8, 2, 10, L3, Object.assign({ h: LB - L3 }, TALLK));                                                             // over the wings' roofs the Keep's side walls are outer walls again
WW('u', 2, 0, 8, 0, Object.assign({ h: L2, y0: 0 }, TALLW)); WW('v', 0, 2, 10, 0, Object.assign({ h: L2, y0: 0 }, TALLW));
WW('u', 10, 0, 8, 0, Object.assign({ h: L0, y0: 0 }, TALLW)); WW('u', 10, 0, 8, L0, Object.assign({ h: L2 - L0, doors: [[6.5, 'none']] }, TALLW));   // the wings' south walls: the kitchen door, the guard door
/* the parapets: the wings' roof walks, the Battlements (and the merlons on them) */
const PAR = { h: 1.15, key: WALL };
WW('u', 2, 0, 8, L2, Object.assign({ tint: STONE }, PAR)); WW('v', 0, 2, 10, L2, Object.assign({ tint: STONE }, PAR)); WW('u', 10, 0, 8, L2, Object.assign({ tint: STONE }, PAR));
W('u', 0, 8, 22, LB, Object.assign({ tint: PALE }, PAR)); W('u', 12, 8, 22, LB, Object.assign({ tint: PALE }, PAR)); WW('v', 8, 0, 12, LB, Object.assign({ tint: PALE }, PAR));
for (let u = 8.25; u < 22; u += 1) for (const v of [0, 12]) R.P.push({ s: 'box', p: [X(u), LB + 1.15, Z(v)], size: [1.6, 0.9, 0.5], key: WALL, tint: PALE });
for (let v = 0.25; v < 12; v += 1) for (const u of [8, 22]) R.P.push({ s: 'box', p: [X(u), LB + 1.15, Z(v)], size: [0.5, 0.9, 1.6], key: WALL, tint: PALE });
both((m) => { for (let u = 0.25; u < 8; u += 1) for (const v of [2, 10]) R.P.push({ s: 'box', p: [X(m(u)), L2 + 1.15, Z(v)], size: [1.6, 0.9, 0.5], key: WALL, tint: STONE }); for (let v = 2.25; v < 10; v += 1) R.P.push({ s: 'box', p: [X(m(0)), L2 + 1.15, Z(v)], size: [0.5, 0.9, 1.6], key: WALL, tint: STONE }); });

/* ── THE GREAT STAIR's range (rows 0-1 of the Keep): the wall between the flights and the stair gallery, a gap at each landing ── */
/* (a wall whose foot is over the ground HANGS, and the walker below passes under it; the engine reads the ground under the WHOLE piece, so a
   piece that runs on over a flight would stand from the ground up and shut the landings below: one piece a span, cut where the flights end) */
const V1 = [8, 9, 12, 12.12, 12.85, 13, 16, 16.12, 16.85, 17, 20, 20.16, 22], OPEN1 = { [L0]: [8, 9], [L1]: [12, 13], [L2]: [16, 17], [L3]: [20, 22] };   // (cut too where a flight's head or foot runs on under a landing)
for (const L of [L0, L1, L2, L3]) for (let i = 0; i < V1.length - 1; i++) if (!(V1[i] >= OPEN1[L][0] && V1[i + 1] <= OPEN1[L][1])) W('u', 1, V1[i], V1[i + 1], L, {});
for (const L of [L0, L1, L2]) { W('u', 2, 8, 22, L, { gaps: [[13, 17]] }); W('v', 17, 1, 2, L, {}); }
W('u', 2, 8, 22, L3, { gaps: [[13, 17], [20, 22]] }); W('v', 17, 1, 2, L3, {});
guard('u', 1, 17, 20, LB, 'stone'); guard('u', 2, 17, 20, LB, 'stone'); guard('v', 20, 1, 2, LB, 'stone');                                   // the well the last flight comes up through

/* ── THE UNDERCROFT (0 m) ── */
{ const L = LU, cell = 'leaf_cell';
  W('u', 2, 8, 22, L, {}); WW('v', 8, 2, 10, L, { doors: [[3, LEAF]] });
  WW('v', 13, 2, 4, L, { doors: [[3, LEAF]] }); W('u', 4, 8, 22, L, { doors: [[10.5, cell], [15, LEAF, 1], [19.5, LEAF]] });
  W('v', 11, 4, 10, L, { doors: [[7.5, LEAF]] }); W('v', 19, 4, 10, L, { doors: [[7.5, LEAF]] });
  W('v', 9, 4, 10, L, { doors: [[5, cell], [7, cell], [9, cell]], key: WALL }); W('u', 6, 8, 9, L, {}); W('u', 8, 8, 9, L, {});
  W('u', 10, 8, 22, L, { doors: [[10, LEAF], [20.5, LEAF]], gaps: [] }); WW('v', 13, 10, 12, L, {});
  WW('u', 9, 1, 8, L, {});                                                                                              // the cellar stair's side and the stone under its head
  /* MERLIN'S WORKSHOP: THE ORB on its plinth right under the throne, the benches, the books */
  R.P.push({ s: 'cyl', p: [X(15), 0, Z(7)], r: 1.5, h: 0.5, seg: 16, key: WALL, tint: STONE2 }, { s: 'cyl', p: [X(15), 0.5, Z(7)], r: 0.5, h: 0.9, seg: 12, key: WALL, tint: STONE2 }, { s: 'dome', p: [X(15), 1.4, Z(7)], r: 0.9, h: 1.8, seg: 16, tint: 0x9fe0ff, glow: 1 }, { s: 'dome', p: [X(15), 1.4, Z(7)], r: 1.05, h: 2.1, seg: 16, tint: 0x60b8ff, glow: 0.5, kind: 'glass' });
  for (let u = 14; u < 16; u++) for (let v = 6; v < 8; v++) R.block[R.sq(u, v)] = 'the orb';
  R.F.push({ k: 'wall', x0: r2(X(15) - 1), z0: Z(7), x1: r2(X(15) + 1), z1: Z(7), t: 2, ghost: true, rail: false, h: 2, y: 2 });
  B('cauldron', 12, 5, 0, L); B('library_shelf_full', 11, 9, 90, L); B('library_shelf', 18, 9, 270, L); B('psx_table_large_3', 17, 5, 0, L); B('lectern', 13, 8, 180, L); B('giant_hourglass', 18, 6, 0, L); B('star_projector', 12, 8, 0, L);
  dec('crystalBall', 17.5, 5.5, 0, L, { y: 0.8 }); dec('item_potion_flask', 17.2, 5.4, 0, L, { y: 0.8 }); dec('psx_open_book_mp_1', 17.7, 5.7, 40, L, { y: 0.8 }); dec('psx_cobweb_4', 11.4, 4.4, 0, L, { y: 4 }); dec('crystal_cluster', 16.5, 9.3, 0, L);
  who('wizard', 13.5, 6.5, 100, L, say(1, 'wizard'));
  /* the Gaoler's Room, the Cells, the antechamber, the Crypt of Kings, the Ossuary */
  B('psx_table_large_2', 10, 2, 0, L); B('dojo_weapon_rack', 12, 2, 270, L); dec('psx_chair_mp_1', 10.5, 3.3, 180, L); dec('wall_chains', 9.5, 2.25, 0, L, { y: 1.6 }); dec('cave_torch', 12.6, 2.4, 0, L);
  B('psx_bed_1', 8, 4, 90, L); B('psx_bed_1', 8, 6, 90, L); dec('skull_pile', 8.4, 8.4, 0, L); dec('wall_chains', 8.25, 8.5, 90, L, { y: 1.5 }); dec('wooden_bucket', 8.6, 5.6, 0, L); dec('cave_torch', 10.5, 9.6, 0, L);
  who('skeleton', 8.6, 9.4, 90, L, say(1, 'skeleton'));
  dec('cave_torch', 13.4, 2.4, 0, L); dec('psx_cobweb_5', 16.6, 2.4, 0, L, { y: 3.5 }); B('stone_urn', 14, 2, 0, L); B('stone_urn', 16, 2, 0, L);
  B('sarcophagus', 18, 2, 90, L); B('sarcophagus', 20, 2, 90, L); B('trap_sarcophagus', 18, 3, 0, L); dec('arms_trophy', 19.5, 2.25, 0, L, { y: 2.2 });
  B('skull_pile', 21, 4, 0, L); B('skull_pile', 21, 6, 0, L); B('psxg_coffin', 21, 8, 90, L); B('trap_coffin_open', 19, 9, 0, L); dec('skull', 20.4, 5.5, 60, L); dec('skull', 19.6, 8.4, 200, L); dec('psx_cobweb_4', 21.6, 9.6, 0, L, { y: 3 }); dec('cave_torch', 19.4, 4.4, 0, L);
  who('ghost', 20.5, 7.5, 270, L, say(1, 'ghost'));
  /* the Sally Port passage (west), the Well Chamber (east) */
  dec('cave_torch', 12.6, 10.4, 0, L); dec('meshy_burlap_sack', 8.5, 10.5, 0, L); B('psx_wooden_crate_2', 12, 11, 0, L);
  dec('wooden_bucket', 21.3, 10.5, 0, L);   // (the well itself is the link's: DOOR_HQ.links well_camelot.b)
  R.must.push(R.sq(20, 11), R.sq(19, 11)); dec('cave_torch', 17.4, 10.4, 0, L);
  /* THE VAULTS (under the Kitchen): the tuns down both walls */
  for (const v of [2, 4, 6]) { B('psx_metal_barrel_mp_0', 0, v, 0, L); B('psx_metal_barrel_mp_2', 7, v + (v > 2 ? 1 : 0), 0, L); } B('psx_wooden_crate_3', 3, 2, 0, L); B('psx_wooden_crate_2', 4, 2, 0, L); B('bread_rack', 3, 6, 0, L); dec('meshy_burlap_sack', 5.5, 2.5, 0, L); dec('meshy_burlap_sack', 6.3, 2.6, 80, L); dec('psx_glass_bottle_1', 3.5, 3.4, 0, L); dec('cave_torch', 0.4, 8.5, 0, L); dec('cave_torch', 7.6, 8.5, 0, L); dec('psx_cobweb_5', 0.4, 2.4, 0, L, { y: 4 });
  /* THE CISTERN (under the Barracks): the tank the walk goes round, knee deep */
  R.F.push({ k: 'pool', x: X(26), z: Z(5.5), r: 7.6, rz: 7.6, y: -0.25, depth: 0.7, key: 'water', bank: 1.0 });
  for (const q of [[24, 3.5], [28, 3.5], [24, 7.5], [28, 7.5]]) column(q[0], q[1], L, SH, 0.6, DARK);
  dec('cave_torch', 22.4, 2.4, 0, L); dec('cave_torch', 29.6, 8.6, 0, L); dec('wooden_bucket', 22.6, 8.4, 0, L);
}

/* ── FLOOR 0 (7 m): the Throne Hall, the north range, the Kitchen wing, the Barracks wing ── */
{ const L = L0;
  /* the hall's north wall (two floors high, its upper half opens as the Minstrels' Gallery), the range behind it */
  W('u', 4, 8, 22, L, { doors: [[10.5, LEAF], [13.5, LEAF], [16.5, LEAF], [19.5, LEAF]], tint: PALE });
  WW('v', 13, 2, 4, L, { doors: [[3, LEAF]] });
  WW('v', 8, 2, 10, L, { doors: [[8.5, LEAF]], tint: PALE });
  /* THE THRONE HALL */
  for (const v of [5, 6.5, 8, 9.5, 11]) both(m => column(m(10.3), v, L, L2 - L - 0.3, 0.5));
  R.P.push({ s: 'box', p: [X(15), L, Z(4.9)], size: [10.5, 0.24, 5.2], key: 'marble', tint: 0xe6dcc0 }, { s: 'box', p: [X(15), L + 0.01, Z(8.6)], size: [2.6, 0.03, 20.4], tint: RED }, { s: 'box', p: [X(15), L + 0.24, Z(4.3)], size: [7, 0.2, 0.5], key: WALL, tint: STONE2 });
  royalBanner(X(15), L + 3.4, r2(Z(4) + 0.42), 4.6, 9.4, 1).forEach(p => R.P.push(p));                                        // THE CLOTH OF ESTATE behind the throne
  for (const s of [-1, 1]) royalBanner(r2(X(15) + s * 12.25), L + 5, r2(Z(4) + 0.42), 2.2, 6.4, 1).forEach(p => R.P.push(p));
  dec('royal_throne', 15, 4.8, 180, L, { y: 0.24 }); R.lvl = L; R.block[R.sq(14, 4)] = R.block[R.sq(15, 4)] = 'the dais'; dec('lion_statue', 13.4, 5.2, 180, L); dec('lion_statue', 16.6, 5.2, 180, L);
  B('round_table', 14.5, 7.5, 0, L, { nu: 1, nv: 1 }); R.props[R.props.length - 1].x = X(15); R.block[R.sq(15, 7)] = 'round_table';
  both((m, f, ms) => { B('brazier', ms(12), 4, 0, L); B('armour_stand', ms(8), 5, f(90), L); B('armour_stand', ms(8), 7, f(90), L); B('armour_stand', ms(8), 11, f(90), L);
      B('psx_table_large_2', ms(12), 9, 90, L); dec('church_pew', m(12.5), 8.3, 0, L); dec('church_pew', m(12.5), 10.7, 180, L); dec('banner', m(8.2), 6.5, f(90), L, { y: 5 }); dec('banner', m(8.2), 9.5, f(90), L, { y: 5 }); B('brazier', ms(13), 11, 0, L); });
  for (const q of [[15, 8], [11.5, 8], [18.5, 8]]) R.props.push({ key: 'crystal_chandelier', x: X(q[0]), z: Z(q[1]), ceil: true, y: L2 - 0.4 });
  for (const m of [9.5, 11.5, 13.5, 16.5, 18.5, 20.5]) win('u', 12, m, L, -1, 5.5, 2.2);
  who('king arthur', 15.9, 5.6, 180, L, say(2, 'king arthur')); who('knight', 13.6, 11.2, 0, L, say(2, 'knight')); who('knight', 16.4, 11.2, 0, L);
  /* the Robing Room, the lobby behind the dais, the Chancery */
  B('psx_wardrobe_mp_1', 8, 2, 90, L); B('psx_wardrobe_mp_1_2', 8, 3, 90, L); B('barber_mirror', 12, 2, 270, L); dec('rug_round', 10.5, 3, 0, L); dec('wingback_chair', 11.4, 2.5, 200, L);
  B('exec_desk', 19, 2, 180, L); B('library_shelf_full', 21, 2, 270, L); B('map_table', 20, 3, 0, L); dec('psx_open_book_mp_1', 19.5, 2.4, 20, L, { y: 0.8 }); dec('globe_lamp', 17.5, 2.4, 0, L); dec('psx_chair_mp_1', 19.5, 3.1, 0, L);
  dec('painting_portrait', 15, 2.25, 0, L, { y: 2.4 }); dec('wall_torch', 13.3, 3.6, 90, L, { y: 2.2 }); dec('wall_torch', 16.7, 3.6, 270, L, { y: 2.2 }); dec('planter', 8.5, 1.5, 0, L); dec('armour_stand', 16.5, 1.5, 180, L);
  /* THE KITCHEN WING (west) and THE BARRACKS WING (east): the same walls, mirrored */
  WW('v', 5, 2, 10, L, { doors: [[3, LEAF], [5.5, LEAF], [8, LEAF]], gaps: [[9, 10]] }); WW('u', 4, 5, 8, L, {}); WW('u', 7, 5, 8, L, {}); WW('u', 9, 0, 1, L, {}); WW('u', 9, 1, 4, L, {});   // (two pieces: the first hangs over the cellar stair's foot, the second stands beside the flight)
  /* the Great Kitchen: two hearths in the north wall, the long tables */
  /* THE HEARTHS (mondo: "chimneys look like shit, need fire just like tiles on fire in battles"): two chimney breasts on the north wall, each a
     stone surround with a deep mouth under a timber mantel, a hood tapering to the ceiling, an iron crane, and the battle's own fire in it */
  for (const u of [1.5, 3.5]) { const x = X(u), z0 = r2(Z(2) + 0.15), q = (dx, y, dz, w, h, d, key, tint, o) => R.P.push(Object.assign({ s: 'box', p: [r2(x + dx), r2(L + y), r2(z0 + dz)], size: [w, h, d] }, key ? { key } : {}, tint != null ? { tint } : {}, o || {}));
      for (const s of [-1, 1]) q(s * 1.25, 0, 0.6, 0.6, 2.0, 1.2, WALL, STONE2);                                         // the jambs
      q(0, 0, 0.08, 1.9, 2.0, 0.16, null, 0x18120e); q(0, 0, 0.6, 3.1, 0.14, 1.5, WALL, 0x8a8680);                       // the sooty back, the hearth stone
      q(0, 1.75, 0.6, 1.9, 0.25, 1.2, WALL, STONE2, { under: true }); for (const s of [-1, 1]) q(s * 0.8, 1.5, 0.6, 0.3, 0.25, 1.2, WALL, STONE2, { under: true });   // the arch's haunches
      q(0, 2.0, 0.7, 3.4, 0.22, 1.5, WOOD, TIMBER, { under: true });                                                      // the mantel beam
      q(0, 2.22, 0.55, 3.0, 1.3, 1.1, WALL, STONE, { under: true }); q(0, 3.52, 0.45, 2.4, 1.4, 0.9, WALL, STONE); q(0, 4.92, 0.35, 1.8, SH - 4.92, 0.7, WALL, STONE);   // the hood, stepping in
      q(-0.7, 1.35, 0.5, 0.05, 0.05, 0.9, null, 0x2a2c30); q(-0.7, 0.75, 0.9, 0.04, 0.6, 0.04, null, 0x2a2c30);          // the crane and its chain
      R.props.push({ key: 'hearth_fire', x, z: r2(z0 + 0.62), y: L, w: 1.4, h: 1.6 }); }
  B('cauldron', 0, 3, 0, L); B('psx_table_large_3', 2, 5, 0, L); B('psx_table_large_3', 2, 7, 0, L); B('deck_oven', 0, 5, 90, L); B('stock_pots', 0, 7, 90, L); B('bread_rack', 4, 4, 270, L); dec('meshy_burlap_sack', 0.5, 8.5, 0, L); dec('wooden_bucket', 3.5, 8.4, 0, L); dec('psx_glass_bottle_2', 2.4, 5.4, 0, L, { y: 0.8 });
  B('psx_metal_barrel_mp_0', 7, 2, 0, L); B('psx_metal_barrel_mp_2', 7, 3, 0, L); dec('psx_glass_bottle_1', 5.5, 2.5, 0, L); B('bread_rack', 7, 4, 270, L); B('psx_wooden_crate_2', 7, 6, 0, L); dec('meshy_burlap_sack', 5.6, 6.4, 30, L); B('psx_table_large_2', 7, 7, 90, L); dec('stock_pots', 7.4, 9.5, 270, L);
  win('v', 0, 4, L, 1); win('v', 0, 7, L, 1); win('v', 30, 4, L, -1); win('v', 30, 7, L, -1);
  /* the Barracks, the Arms Store, the Captain's Room, the Guard Room */
  for (const v of [2, 4, 6]) { B('dorm_bed', 29, v, 270, L); B('dorm_bed', 26, v, 90, L); } B('sea_chest', 27, 8, 0, L); dec('brazier', 27.5, 5.5, 0, L); dec('banner', 29.75, 8.5, 270, L, { y: 3 });
  B('dojo_weapon_rack', 22, 2, 90, L); B('armour_stand', 23, 2, 180, L); B('armour_stand', 24, 2, 180, L); dec('spell_shield', 22.3, 3.5, 90, L, { y: 1.6 });
  B('exec_desk', 22, 4, 90, L); B('psx_bed_2', 24, 6, 180, L); dec('map_table', 23.5, 5.5, 0, L); dec('wall_torch', 22.25, 6.5, 90, L, { y: 2.2 });
  B('psx_table_large_2', 22, 7, 90, L); dec('psx_chair_mp_1', 23.3, 7.6, 270, L); dec('armour_stand', 24.5, 7.5, 200, L);
  who('knight', 27.5, 3.5, 180, L, say(0, 'knight')); who('swordfighter', 23.5, 8.6, 90, L, say(0, 'swordfighter'));
}

/* ── FLOOR 1 (14 m): the gallery round the hall, the King's Office, the Treasury, the Chapel Royal, the Knights' Hall ── */
{ const L = L1;
  W('u', 4, 8, 22, L, { gaps: [[13, 17]], doors: [[10.5, LEAF], [19.5, LEAF]], tint: PALE }); WW('v', 13, 2, 4, L, { doors: [[3, LEAF]] }); WW('v', 8, 2, 10, L, { doors: [[5, LEAF, 1]], tint: PALE });
  guard('u', 6, 10, 20, L, 'wood'); guard('u', 10, 10, 20, L, 'wood'); guard('v', 10, 6, 10, L, 'wood'); guard('v', 20, 6, 10, L, 'wood');
  dec('instrument_harp', 14.2, 5.2, 180, L); dec('instrument_drum', 15.8, 5.3, 180, L); dec('psx_chair_mp_1', 13.4, 5.4, 180, L); both((m, f) => { dec('banner', m(8.2), 8, f(90), L, { y: 3 }); dec('armour_stand', m(9), 11.4, 0, L); });
  B('exec_desk', 10, 2, 180, L); B('library_shelf_full', 8, 2, 90, L); dec('exec_chair', 10.5, 3.2, 0, L); dec('globe_lamp', 12.4, 2.5, 0, L); dec('painting_landscape', 10.5, 2.25, 0, L, { y: 2.4 });
  B('sea_chest', 18, 2, 0, L); B('sea_chest', 20, 2, 0, L); B('trophy_case', 21, 3, 270, L); dec('psx_gold_bar_pcs_1', 19.5, 2.5, 0, L); dec('psx_gold_bar_pcs_1', 19.7, 3.2, 40, L); dec('stone_urn', 17.5, 3.5, 0, L);
  /* THE CHAPEL ROYAL (west): the altar at the west end under coloured glass, the pews, the columns */
  for (const v of [3.5, 8.5]) for (const u of [2, 4, 6]) column(u, v, L, SH, 0.3);
  B('stone_altar', 0, 5, 90, L, { nv: 2 }); dec('holy_carpet', 3.5, 6, 90, L); dec('lectern', 2.3, 6, 270, L); dec('holy_tapestry', 0.25, 3.5, 90, L, { y: 3 }); dec('holy_tapestry', 0.25, 8.5, 90, L, { y: 3 });
  for (const u of [3, 4, 5, 6]) { dec('church_pew', u + 0.5, 4.8, 270, L); dec('church_pew', u + 0.5, 7.2, 270, L); }
  for (const v of [5, 6, 7]) R.P.push({ s: 'box', p: [r2(X(0) + 0.17), L + 1.4, Z(v)], size: [0.05, 4.2, 1.2], key: GLS, tint: [0xd86a8a, 0x6a8ad8, 0xd8b86a][v - 5], glow: 0.7 });
  /* THE KNIGHTS' HALL (east): the long table, the trophies, the tourney shields */
  R.lvl = L; for (const u of [22, 23, 24, 25, 26, 27, 28, 29]) R.block[R.sq(u, 6)] = 'the long table';
  R.P.push({ s: 'box', p: [X(26), L + 0.78, Z(6)], size: [13.4, 0.12, 1.5], key: PLK, tint: 0x8a5a34 }); for (const u of [23, 25, 27, 29]) R.P.push({ s: 'box', p: [X(u - 0.1), L, Z(6)], size: [0.3, 0.78, 1.1], key: WOOD, tint: TIMBER });
  R.F.push({ k: 'wall', x0: X(22.4), z0: Z(6), x1: X(29.6), z1: Z(6), t: 1.5, ghost: true, rail: false, h: 0.9, y: L + 0.9, y0: L });
  for (const u of [23, 24.5, 26, 27.5, 29]) { dec('psx_chair_mp_1', u, 5.3, 180, L); dec('psx_chair_mp_1', u, 6.7, 0, L); }
  for (const u of [23, 25, 27, 29]) { dec('arms_trophy', u, 2.25, 0, L, { y: 2.6 }); dec('spell_shield', u - 1, 9.75, 180, L, { y: 2.4 }); } B('armour_stand', 29, 2, 270, L); B('armour_stand', 29, 9, 270, L); B('brazier', 23, 9, 0, L);
  for (const v of [3.5, 6, 8.5]) { win('v', 30, v, L, -1, 3.6); } for (const u of [2, 4, 6]) { win('u', 2, u, L, 1, 3.6); win('u', 2, NU - u, L, 1, 3.6); win('u', 10, u, L, -1, 3.6); win('u', 10, NU - u, L, -1, 3.6); }
  who('knight', 26, 4.4, 180, L);
}

/* ── FLOOR 2 (21 m): the Long Gallery, the royal chambers; the wings' roofs are walked on ── */
{ const L = L2;
  WW('v', 13, 2, 5, L, { doors: [[3.5, LEAF]] }); W('u', 5, 8, 22, L, { doors: [[10.5, LEAF], [19.5, LEAF]], gaps: [[14, 16]] });
  W('u', 7, 8, 22, L, { doors: [[10.5, LEAF], [15, LEAF, 1], [19.5, LEAF]] }); WW('v', 13, 7, 12, L, { doors: [[9.5, LEAF]] });
  WW('v', 8, 2, 10, L, { doors: [[6, LEAF]], tint: PALE });
  for (const u of [9, 11, 13, 17, 19, 21]) dec(u % 4 === 1 ? 'painting_portrait' : 'painting_landscape', u, 5.22, 0, L, { y: 2.4 }); both((m, f) => { dec('armour_stand', m(12), 6.6, 0, L); dec('planter', m(8.5), 5.5, 0, L); }); R.P.push({ s: 'box', p: [X(15), L + 0.01, Z(6)], size: [45, 0.03, 2.4], tint: RED });
  B('royal_bed', 9, 9, 90, L, { nu: 2, nv: 2 }); B('psx_wardrobe_mp_1', 8, 7, 90, L); B('map_table', 11, 11, 0, L); dec('rug_round', 11, 9.5, 0, L); dec('wingback_chair', 12.3, 8, 250, L); dec('wall_torch', 8.25, 11.4, 90, L, { y: 2.2 });
  R.P.push({ s: 'box', p: [X(15), L + 1.2, r2(Z(12) - 0.17)], size: [5.4, 4.6, 0.05], key: GLS, tint: 0xf4dc98, glow: 0.8 }); dec('royal_throne', 15, 10.6, 0, L); dec('holy_carpet', 15, 9, 0, L); both((m, f, ms) => B('brazier', ms(13), 11, 0, L)); dec('banner', 13.25, 8.5, 90, L, { y: 3 }); dec('banner', 16.75, 8.5, 270, L, { y: 3 });
  B('couples_bed', 19, 9, 270, L, { nu: 2, nv: 2 }); B('psx_wardrobe_mp_1_3', 21, 7, 270, L); B('barber_mirror', 18, 11, 0, L); dec('rug_round', 18.5, 8, 0, L); dec('instrument_harp', 21.3, 11.3, 220, L); dec('planter', 17.5, 7.5, 0, L);
  B('psx_wardrobe_mp_1_1', 8, 2, 90, L); B('psx_wardrobe_mp_1_4', 8, 3, 90, L); B('sea_chest', 10, 2, 0, L); dec('armour_stand', 11.5, 2.5, 180, L); dec('item_hand_mirror', 10.5, 4.5, 0, L);
  B('psx_bed_4_1', 21, 2, 270, L); B('rocking_chair', 18, 3, 120, L); dec('psx_toy_brick_1', 19.5, 3.5, 0, L); dec('psx_toy_brick_1_2', 19.9, 3.8, 40, L); dec('rug_round', 19.5, 3, 0, L); R.props.push({ key: 'crib_mobile', x: X(20.5), z: Z(2.6), ceil: true, y: L + 5 });
  /* the leads (the wings' roofs): a lantern roof in the middle of each, benches, the view */
  both((m) => { R.P.push({ s: 'roof', form: 'hip', p: [X(m(4)), L, Z(6)], size: [14, 3.2, 14], key: SLATE, tint: BLUE }); R.F.push({ k: 'wall', x0: X(m(2.2)), z0: Z(6), x1: X(m(5.8)), z1: Z(6), t: 13, ghost: true, rail: false, h: 3, y: L + 3, y0: L }); for (let u = 2; u < 6; u++) for (let v = 4; v < 8; v++) R.block[R.sq(m(u + 0.5), v)] = 'the lantern roof';
      dec('iron_garden_bench', m(1), 6, m(1) < 15 ? 90 : 270, L); dec('planter', m(0.6), 2.6, 0, L); dec('planter', m(0.6), 9.4, 0, L); dec('brass_telescope', m(1), 9, m(1) < 15 ? 200 : 160, L); });
}

/* ── FLOOR 3 (28 m): the Great Library, Merlin's Study, the War Room ── */
{ const L = L3;
  WW('v', 13, 2, 5, L, { doors: [[3.5, LEAF]] }); W('u', 5, 8, 22, L, { doors: [[10.5, LEAF], [19.5, LEAF]], gaps: [[14, 16]] });
  for (const u of [9, 11, 13, 17, 19, 21]) for (const v of [6, 7, 9, 10]) B(v % 2 ? 'library_shelf' : 'library_shelf_full', u, v, 90, L);
  B('psx_table_large_2', 14, 8, 90, L); B('psx_table_large_2', 15, 8, 90, L); dec('psx_open_book_mp_1', 14.8, 8.4, 30, L, { y: 0.8 }); dec('psx_book_mp_3', 15.6, 8.6, 0, L, { y: 0.8 }); dec('globe_lamp', 15, 10.5, 0, L); dec('library_ladder', 12.4, 6.5, 90, L); dec('library_ladder', 17.6, 9.5, 270, L); dec('lectern', 15, 6, 180, L); dec('wingback_chair', 14, 11, 20, L); dec('wingback_chair', 16, 11, 340, L); dec('rug_round', 15, 11, 0, L);
  for (const m of [9.5, 12, 18, 20.5]) win('u', 12, m, L, -1, 4); R.P.push({ s: 'box', p: [X(15), L + 1.0, r2(Z(12) - 0.17)], size: [3.6, 4.6, 0.05], key: GLS, tint: 0xf4dc98, glow: 0.8 });
  B('star_projector', 10, 3, 0, L); B('telescope', 8, 4, 135, L); B('library_shelf_full', 8, 2, 90, L); B('exec_desk', 11, 2, 180, L); dec('crystalBall', 11.5, 2.4, 0, L, { y: 0.8 }); dec('star_chart', 10, 2.25, 0, L, { y: 2.4 }); dec('astronomical_clock', 12.4, 2.6, 270, L); R.props.push({ key: 'star_dome', x: X(10.5), z: Z(3.5), ceil: true, y: L + SH - 0.2 });
  B('map_table', 19, 3, 0, L, { nu: 2, nv: 1 }); B('armour_stand', 21, 2, 270, L); B('dojo_weapon_rack', 21, 4, 270, L); dec('banner', 19.5, 2.25, 0, L, { y: 3 }); dec('psx_chair_mp_1', 18.5, 4.3, 0, L); dec('psx_chair_mp_1', 20.5, 4.3, 0, L); dec('world_clocks', 17.25, 3.5, 90, L, { y: 2.4 });
  who('wizard', 10.6, 4.4, 20, L, say(0, 'wizard'));
}

/* ── THE BATTLEMENTS (35 m): the walk, the roofs, the towers, THE SPIRE ── */
{ const L = LB;
  /* the two blue roofs between the walk and the Spire (drawn; nobody walks them) and the rails that keep you off them */
  R.P.push({ s: 'roof', form: 'hip', p: [X(11.5), L, Z(6)], size: [28, 5.5, 10.5], ry: 90, key: SLATE, tint: BLUE }, { s: 'roof', form: 'hip', p: [X(18.5), L, Z(6)], size: [28, 5.5, 10.5], ry: 90, key: SLATE, tint: BLUE }, { s: 'roof', form: 'hip', p: [X(15), L, Z(9)], size: [14, 3, 7], key: SLATE, tint: BLUE });
  for (const q of [['v', 10, 2, 10], ['v', 20, 2, 10], ['u', 10, 10, 20], ['u', 2, 10, 14], ['u', 2, 16, 20], ['v', 14, 2, 4], ['v', 16, 2, 4]]) guard(q[0], q[1], q[2], q[3], L, 'stone');
  /* THE SPIRE ROOM in the Spire's foot (the Spire stands on it): the orrery, eight lights, the door to the sky (shut: the sky castle waits) */
  W('u', 4, 13, 17, L, { h: 5, doors: [[15, LEAF]], tint: PALE }); W('u', 8, 13, 17, L, { h: 5, tint: PALE }); W('v', 13, 4, 8, L, { h: 5, tint: PALE }); W('v', 17, 4, 8, L, { h: 5, tint: PALE });
  R.ceil(13, 4, 17, 8, L + 5, WOOD, 0x5a3c26);
  R.P.push({ s: 'cyl', p: [X(15), L + 5, Z(6)], r: 5.5, h: 17, seg: 18, key: WALL, tint: PALE }, { s: 'cyl', p: [X(15), L + 20.2, Z(6)], r: 6.0, h: 1.8, seg: 18, key: WALL, tint: STONE }, { s: 'cyl', p: [X(15), L + 21.75, Z(6)], r: 6.5, h: 0.25, seg: 18, key: WOOD, tint: 0x4a3626 }, { s: 'cyl', p: [X(15), L + 22, Z(6)], r: 6.5, h: 20, r2: 0, seg: 18, key: SLATE, tint: BLUE }, { s: 'cyl', p: [X(15), L + 42, Z(6)], r: 0.09, h: 4.2, seg: 6, tint: 0x403830 }, { s: 'box', p: [X(15) + 1.25, L + 44.6, Z(6)], size: [2.5, 1.4, 0.06], tint: RED, ds: true });
  B('astronomical_clock', 15, 6, 0, L); dec('brass_telescope', 13.6, 7.4, 225, L); dec('star_chart', 13.25, 6, 90, L, { y: 2.2 }); dec('giant_hourglass', 16.4, 7.4, 0, L); dec('wall_torch', 16.75, 5, 270, L, { y: 2.2 });
  R.P.push({ s: 'box', p: [X(15), L, r2(Z(8) - 0.2)], size: [1.9, 3.2, 0.12], key: PLK, tint: 0x3a4a7a }, { s: 'box', p: [X(15), L + 3.2, r2(Z(8) - 0.2)], size: [2.3, 0.25, 0.2], key: WALL, tint: GOLD }, { s: 'box', p: [X(15), L + 1.4, r2(Z(8) - 0.28)], size: [0.5, 0.5, 0.04], tint: GOLD, glow: 0.6 });
  /* the four corner towers' heads (drawn from the walk up: the shaft, the gallery, the cone, the flag); each weighs a short wall */
  for (const q of [[8, 0], [22, 0], [8, 12], [22, 12]]) { const x = X(q[0]), z = Z(q[1]); R.P.push({ s: 'cyl', p: [x, L, z], r: 3.4, h: 6, seg: 16, key: WALL, tint: PALE }, { s: 'cyl', p: [x, L + 4.4, z], r: 3.9, h: 1.6, seg: 16, key: WALL, tint: STONE }, { s: 'cyl', p: [x, L + 5.75, z], r: 4.4, h: 0.25, seg: 16, key: WOOD, tint: 0x4a3626 }, { s: 'cyl', p: [x, L + 6, z], r: 4.4, h: 12, r2: 0, seg: 16, key: SLATE, tint: BLUE }, { s: 'cyl', p: [x, L + 18, z], r: 0.09, h: 4, seg: 6, tint: 0x403830 }, { s: 'box', p: [x + 1.25, L + 20.4, z], size: [2.5, 1.4, 0.06], tint: RED, ds: true });
      R.F.push({ k: 'wall', x0: r2(x - 2.4), z0: z, x1: r2(x + 2.4), z1: z, t: 4.8, ghost: true, rail: false, h: 6, y: L + 6, y0: L }); }
  both((m, f) => { dec('brazier', m(9), 11, 0, L); dec('banner', m(8.3), 6, f(90), L, { y: 1.4 }); }); dec('brass_telescope', 15, 11.3, 180, L); dec('armour_stand', 12, 0.5, 180, L);
  who('knight', 9, 6, 270, L); who('swordfighter', 15, 11, 180, L);
}

/* ── THE WAYS OUT (all on floor 0, the upper court's level, but the sally port and the well, which are in the cellar) ── */
R.doors.push(
    { id: 'portal', wall: 's', x: X(15), leaf: LEAF, wide: true, label: 'CAMELOT KINGDOM', sub: 'THE PORTAL · OUT TO THE UPPER COURT', action: { room: 'site_prebuilt_camelot_kingdom', at: 'portal' },
      desc: 'The great doors, or the man-sized door in them. Outside: the upper court, the two stairs, the Market, the wall, the woods.' },
    { id: 'kitchen', wall: 'free', x: X(6.5), z: r2(Z(10) - 0.5), face: 0, leaf: LEAF, label: 'CAMELOT KINGDOM', sub: 'THE KITCHEN DOOR · OUT TO THE UPPER COURT', action: { room: 'site_prebuilt_camelot_kingdom', at: 'kitchen' },
      desc: 'The kitchen door. It is the door everything in the castle actually comes in by.' },
    { id: 'guard', wall: 'free', x: X(23.5), z: r2(Z(10) - 0.5), face: 0, leaf: LEAF, label: 'CAMELOT KINGDOM', sub: 'THE GUARD DOOR · OUT TO THE UPPER COURT', action: { room: 'site_prebuilt_camelot_kingdom', at: 'guard' },
      desc: 'The guard room’s own door onto the court. The Knights use it so that nobody sees how late they are.' },
    { id: 'postern', wall: 'free', x: X(9.5), z: r2(Z(12) - 0.5), face: 0, leaf: LEAF, label: 'CAMELOT KINGDOM', sub: 'THE SALLY PORT · OUT AT THE HILL’S FOOT', action: { room: 'site_prebuilt_camelot_kingdom', at: 'postern' },
      desc: 'A low door at the end of the passage. It lets out in the foot of the castle hill, beside the Grand Stair, which the besiegers should have found suspicious.' });
R.lvl = L0; R.must.push(R.sq(15, 11), R.sq(14, 11), R.sq(6, 9), R.sq(23, 9)); R.lvl = LU; R.must.push(R.sq(9, 11), R.sq(9, 10));
R.spawn = { x: X(15), z: Z(11.3), face: 0 };
R.lines = OLDN[0].l.concat(OLDN[1].l).filter(l => !/moat|Why brick a cave|two|tower top/i.test(l));
R.stops = [[15, 8, L0], [10.5, 3, L0], [19.5, 3, L0], [2.5, 6, L0], [6.5, 3, L0], [6.5, 5.5, L0], [6.5, 8.5, L0], [27.5, 5, L0], [23.5, 3, L0], [23.5, 5.5, L0], [23.5, 8.5, L0], [8.5, 0.5, L0],
    [4, 5, LU], [23, 8.4, LU], [0.5, 9.5, LU], [9.6, 7, LU], [8.5, 5, LU], [15, 5, LU], [10.5, 3, LU], [15, 3, LU], [19.5, 3, LU], [20.5, 7, LU], [10.5, 11, LU], [19.5, 11, LU],
    [12.5, 0.5, L1], [15, 5, L1], [9, 8, L1], [21, 8, L1], [15, 11, L1], [10.5, 3, L1], [19.5, 3, L1], [4, 6, L1], [26, 4, L1],
    [16.5, 0.5, L2], [15, 6, L2], [11, 10, L2], [15, 9.5, L2], [19, 8, L2], [10.5, 3.5, L2], [19.5, 3.5, L2], [1, 4, L2], [29, 4, L2],
    [21, 0.5, L3], [15, 9, L3], [10.5, 3.5, L3], [19.5, 3.5, L3],
    [12, 1.5, LB], [9, 6, LB], [21, 6, LB], [15, 11, LB], [15, 3, LB], [15, 7, LB]];
check('the castle', R);

/* ── the room's text ── */
const M = [], F = R.F.concat([{ k: 'arch', id: 'cam:palace:in', x: 0, z: 0, y: 0, parts: R.P }]);
if (R.inner.length) F.push({ k: 'texbuilding', id: 'cam:palace:doors', x: 0, z: 0, w: 2, d: 2, rot: 0, storeys: 1, skin: false, doorsOnly: true, leaf: 'leaf_wooden', inner: R.inner });
M.push("        /* CAMELOT-PALACE-BEGIN — CAMELOT CASTLE, ONE STACKED BUILDING (2026-11-15): written by `node bake-camelot-castle.js` from the approved plan (docs/plans/camelot/camelot_castle_stacked_plan.png). Never hand-edit between the markers; edit the tool and rerun. */");
M.push('        site_prebuilt_camelot_palace: {');
["label: 'CAMELOT CASTLE',", "sub: 'THE THRONE HALL · THE GREAT STAIR · THE ROYAL FLOOR · THE LIBRARY · THE BATTLEMENTS · MERLIN’S UNDERCROFT',", "kind: 'box', site: 'prebuilt_camelot', part: 'palace',",
 "shell: hqCastleShell({ w: " + R.W + ", d: " + R.D + ", plate: { x: " + R.spawn.x + ", z: " + r2(R.D / 2 - 1.2) + ", y: " + (L0 + 4.4) + " },",
 "                       sunShadow: false, mood: { lamp: 0xffd090, glow: 0xffb060, strip: 0xffe0b0, light: 0xfff2e0, ambient: 0.85 } }),   // no sun shadow: an open room (the roof walk needs the sky) whose floors would stand in the shadow of the floors over them (three-renderer.js _hqShadowArm)",
 "parti: 'One palace on six levels, every floor over the last: the cellar under the throne, the hall two floors high with a gallery round it, the royal rooms, the library, the roof walk; one long stair up the north wall joins them.',",
].forEach(l => M.push('            ' + l));
M.push('            terrain: {'); M.push("                res: 0.4375, floor: 'cobblestone', cliff: 'castle_wall', path: 'cobblestone',"); M.push('                noise: { amp: 0, scale: 5 }, crag: false,');
M.push('                features: ['); F.forEach(f => M.push('                    ' + J(f) + ',')); M.push('                ],'); M.push('            },');
M.push('            doors: ['); R.doors.forEach(d => M.push('                ' + J(d) + ',')); M.push('            ],');
M.push('            counters: [],'); M.push('            props: ['); for (let i = 0; i < R.props.length; i += 4) M.push('                ' + R.props.slice(i, i + 4).map(J).join(', ') + ',');
M.push('            ],'); M.push('            agents: [],'); M.push('            npcSpots: ' + J(R.npc) + ','); M.push('            onlineSpots: [],');
M.push('            lines: ' + J(R.lines) + ','); M.push('            spawn: ' + J(R.spawn) + ','); M.push('        },'); M.push('        /* CAMELOT-PALACE-END */');
const block = M.join('\n') + '\n';
console.log(JSON.stringify({ rows: R.F.length, parts: R.P.length, props: R.props.length, leaves: R.inner.length, natives: R.npc.length, bytes: block.length }));
console.log('ends ' + JSON.stringify({ well_camelot_b: { wall: 'free', x: X(20), z: Z(11.5), face: 270 } }));

/* ── write, then walk it: compile the room from the written data.js and reach every stop from the spawn on the walker's own rule ── */
const file = path.join(REPO, 'data.js'); let src = fs.readFileSync(file, 'utf8');
const END = '        /* CAMELOT-PALACE-END */\n', b0 = src.indexOf('        /* CAMELOT-PALACE-BEGIN'), b1 = src.indexOf(END);
if (b0 >= 0 && b1 > b0) src = src.slice(0, b0) + block + src.slice(b1 + END.length);
else { const a = src.indexOf('        /* CAMELOT-KINGDOM-BEGIN'); if (a < 0) throw new Error('the kingdom block was not found in data.js'); src = src.slice(0, a) + block + src.slice(a); }
const tmp = path.join(require('os').tmpdir(), 'ew-palace-' + process.pid + '.js'); fs.writeFileSync(tmp, src);
let bad = 0;
try {
    const D2 = require('./load-data.js').loadGameData({ quiet: true, file: tmp }), id = 'site_prebuilt_camelot_palace';
    const res = JSON.parse(vm.runInContext(`(function () { var info = hqTerrainInfo('${id}'), R = info.rules, S = ${JSON.stringify(R.spawn)}, st = 0.4375, seen = {}, q = [], out = { stops: [], n: 0 };
        var y0 = hqTerrainFeet(info, S.x, S.z, null); if (y0 == null) return JSON.stringify({ err: 'the spawn is not walked' });
        var key = function (x, z, y) { return Math.round(x / st) + ',' + Math.round(z / st) + ',' + Math.round(y / 1.75); };
        q.push([S.x, S.z, y0]); seen[key(S.x, S.z, y0)] = 1; out.spawnY = y0;
        while (q.length) { var c = q.pop(); out.n++; [[st, 0], [-st, 0], [0, st], [0, -st]].forEach(function (d) { var x = c[0] + d[0], z = c[1] + d[1], y = hqTerrainFeet(info, x, z, c[2]);
            if (y == null || y - c[2] > R.climb + 0.01) return; var k = key(x, z, y); if (seen[k]) return; seen[k] = 1; q.push([x, z, y]); }); }
        var near = function (p) { for (var i = -2; i <= 2; i++) for (var j = -2; j <= 2; j++) if (seen[key(p[0] + i * st, p[1] + j * st, p[2])]) return true; return false; };
        out.stops = ${JSON.stringify(R.stops.map(s => [X(s[0]), Z(s[1]), s[2]]))}.map(near);
        out.pads = (info.pads || []).map(function (p) { return [p.door && p.door.id, near([p.x, p.z, p.h]), p.h]; });
        var nan = 0; (info.walls || []).concat(info.bridges || []).forEach(function (r) { for (var k in r) if (typeof r[k] === 'number' && !isFinite(r[k])) nan++; }); out.nan = nan;
        return JSON.stringify(out); })()`, D2));
    if (res.err) { console.log(id + ': ' + res.err); bad++; }
    else { const miss = R.stops.filter((s, i) => !res.stops[i]), padMiss = res.pads.filter(p => !p[1]).map(p => p[0]);
        console.log(id + ': spawn at ' + res.spawnY + ' m · walked ' + res.n + ' spots, ' + (R.stops.length - miss.length) + '/' + R.stops.length + ' stops' + (miss.length ? ' · NOT REACHED ' + JSON.stringify(miss) : '') + ' · doors ' + JSON.stringify(res.pads) + ' · NaN ' + res.nan);
        bad += miss.length + padMiss.length + res.nan; }
} finally { fs.unlinkSync(tmp); }
if (bad && !process.env.PALACE_FORCE) { console.error('the walk check failed (' + bad + ')'); process.exit(1); }
if (DRY) process.exit(0);
fs.writeFileSync(file, src);
console.log('data.js: site_prebuilt_camelot_palace written (' + block.length + ' bytes)');
