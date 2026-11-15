/* DISASTER CITY, THE EXTERIOR POLISH (2026-11-15, mondo: "do an exterior pass too on disaster city ... Bench clipping through a wall or
   curb, probably from the elevation pass"). Read by `node bake-disaster-city.js`, last of all; repo-only tooling, never loaded by the game.

   The prop check (props.js) reads the ground from the tool's own squares. The game stands a prop on the COMPILED ground (data.js
   hqTerrainCompile), and that differs in three ways the check could not see:
   1. THE WALL STANDERS. The game stands a prop on hqTerrainFeet at its middle: within a body's reach (0.34 m) of a wall that is the wall's
      TOP. Every vent, utility box and pay phone set flush on a building, and a few benches, planters, signs and a car, were drawn on
      top of the wall beside them (4 to 11 m up). They get `floor: true` (the ground under them, three-renderer.js THE FLOOR UNDER IT).
   2. THE STEP STRADDLERS. A step of THE LEVELS (a bank between two plots) is drawn about 0.9 m wide, mostly on the low side of the plot
      line. A bench set against a fence on that line stood half way up the bank (his screenshot); cones, bins, pots, dumpsters and cars
      the same. Each MOVES to the nearest spot where the ground under its whole footprint is flat, clear of everything, by the placement
      rules (a thing that blocks keeps a whole square's middle, decor stays off it, a car keeps its street, a wall thing keeps its wall).
   3. THE LEFT OUT. The check dropped a shared prop with no clear spot within its short reach. Each is put back at the nearest clear,
      flat spot (a wider search), so nothing is lost.
   It moves rows and sets `floor`; it never drops one. A prop on a deck, a bridge, a landing, afloat, hung at a height, indoors, or a
   landmark is left alone. DC_NO_EXT=1 skips it; DC_EXT_LOG=1 prints every row it touched.
   Notes: docs/notes/areas-complexes.md "DISASTER CITY, THE EXTERIOR POLISH". */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const PROPS = require('./props.js');
const { SIZE, DECOR, WALLED, FIXED, solids, foot, sat, obb, bbOf, rotP, Grid } = PROPS;
const D2R = Math.PI / 180, ROOM = 'site_prebuilt_downtown_streets';

module.exports = function exteriorPolish(o) {
    const { sb, props, ctx } = o, dropped = o.dropped || [], { C, HALF, REPO, cellAt } = ctx, LOG = !!process.env.DC_EXT_LOG;
    const info = sb.hqTerrainInfo(ROOM), CAT = vm.runInContext('DOOR_HQ.catalogue', sb);
    let SIZES = {}; try { SIZES = JSON.parse(fs.readFileSync(path.join(__dirname, 'prop-sizes.json'), 'utf8')); } catch (e) {}
    const H = (x, z) => sb.hqTerrainHeight(info, x, z);
    const FT = (x, z) => { try { return sb.hqTerrainFeet(info, x, z, null); } catch (e) { return null; } };
    const r3 = v => Math.round(v * 1000) / 1000, cellOf = v => Math.floor((v + HALF) / C);
    const tally = { outdoor: 0, grounded: 0, moved: 0, restored: 0, stuck: 0, by: {} };
    const bump = k => { tally.by[k] = (tally.by[k] || 0) + 1; };

    /* the footprint as the game draws it: props.js SIZE, else the measured model (prop-sizes.json) at the row's own size, else the catalogue's */
    const poly = (q, x, z, pad) => {
        const c = CAT[q.key] || {}, m = SIZES[q.key];
        if (SIZE[q.key] || !m) return foot(REPO, q, x, z, pad);
        const k = (q.h && c.h) ? q.h / c.h : (q.span && c.span) ? q.span / c.span : 1;
        return obb(x, z, m[0] / 2 * k + pad, m[2] / 2 * k + pad, Math.PI - (q.face || 0) * D2R);
    };
    const isVeh = q => !!(CAT[q.key] || {}).vehicle;
    const ground = (x, z) => { const ch = cellAt(cellOf(x), cellOf(z)); return ch === 'R' ? 'road' : (ch === 'I' || ch === 'D') ? 'building' : 'walk'; };

    /* the room's solid things, plus the doorway of every walk-in building (1.9 m out from the door: nothing is moved into it) */
    const S = solids(ctx), G = Grid(14);
    const blds = [];
    ctx.features.forEach(f => {
        if (f.k !== 'texbuilding' || !(f.w > 0) || !(f.d > 0)) return;
        const t = Math.round((f.rot || 0) / 90) % 2 !== 0, hx = (t ? f.d : f.w) / 2, hz = (t ? f.w : f.d) / 2;
        blds.push({ f, x0: f.x - hx, x1: f.x + hx, z0: f.z - hz, z1: f.z + hz });
        if (!f.hollow) return;
        const L = Math.max(2, f.w) - 0.12, cols = Math.max(1, Math.round(L / 1.75)), cw = L / cols, col = (isFinite(+f.door) && +f.door >= 1) ? Math.min(cols - 1, Math.round(+f.door) - 1) : Math.floor((cols - 1) / 2), lx = -L / 2 + (col + 0.5) * cw;   // data.js hqTexbDoor
        const a = (f.rot || 0) * D2R, c = Math.round(Math.cos(a)), sn = Math.round(Math.sin(a)), wx = f.x + lx * c + (f.d / 2) * sn, wz = f.z - lx * sn + (f.d / 2) * c;
        const P = obb(wx + sn * 0.95, wz + c * 0.95, sn ? 0.95 : 1.0, sn ? 1.0 : 0.95, 0);
        S.push({ type: 'doorway', id: f.id, poly: P, bb: bbOf(P) });
    });
    S.forEach(s => G.add(s));
    /* a district's shaped ground (a rubble mound, the Collapse): what lies on it lies on a slope on purpose */
    const hills = ctx.features.filter(f => f.k === 'hill');
    const onHill = (x, z) => hills.some(h => Math.hypot(x - h.x, z - h.z) <= (h.r || Math.max(h.w || 0, h.d || 0) / 2 || 0) + 1.5);
    const inBld = (x, z, m) => blds.find(b => x > b.x0 + m && x < b.x1 - m && z > b.z0 + m && z < b.z1 - m);

    /* which rows this pass may touch: outdoor things that stand on the ground */
    const outdoor = q => {
        const c = CAT[q.key]; if (!c) return false;
        if (typeof q.wall === 'string' || c.ceil || q.ceil || c.float) return false;
        if (q.key === 'palm_tree') return false;   // THE TREES STAND IN SOIL owns a palm's square (its bed)
        if ((FIXED.test(q.key) && !/^city_(bench|bin)$/.test(q.key)) || (typeof q.y === 'number' && (q.y >= 1 || q.y <= -0.5))) return false;
        if (onHill(q.x, q.z)) return false;
        const b = inBld(q.x, q.z, 0); if (b && (b.f.hollow || q.floor || inBld(q.x, q.z, 0.3))) return false;   // a walk-in's furniture (THE INTERIOR POLISH), a district's set inside a mass
        return true;
    };
    const onDeck = (x, z) => { try { const a = sb.hqTerrainBridgesAt(info, x, z, 0.3), ft = FT(x, z); return !!(a && ft != null && a.some(b => Math.abs(b.y - ft) < 0.05)); } catch (e) { return false; } };   // the feet there are a slab's top (a deck, a footbridge, a landing): never a roof bridge overhead
    const inWater = (x, z) => { try { const f = sb.hqTerrainFluidAt(info, x, z); return !!(f && H(x, z) < f.y - 0.05); } catch (e) { return false; } };

    /* the ground under a whole footprint: flat = no step, no bank (a street's own slope is let through) */
    const flatAt = (q, x, z) => {
        const P = poly(q, x, z, 0), pts = P.concat([[x, z]]); for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length]; pts.push([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], [(a[0] + x) / 2, (a[1] + z) / 2]); }
        /* the plane through the samples (least squares): a street's slope fits it, a step / a bank / a kerb lip does not */
        let n = pts.length, sx = 0, sz = 0, sh = 0, sxx = 0, szz = 0, sxz = 0, sxh = 0, szh = 0; const hs = pts.map(c => H(c[0], c[1]));
        pts.forEach((c, i) => { const dx = c[0] - x, dz = c[1] - z, h = hs[i]; sx += dx; sz += dz; sh += h; sxx += dx * dx; szz += dz * dz; sxz += dx * dz; sxh += dx * h; szh += dz * h; });
        const mx = sx / n, mz = sz / n, mh = sh / n, a11 = sxx - n * mx * mx, a22 = szz - n * mz * mz, a12 = sxz - n * mx * mz, b1 = sxh - n * mx * mh, b2 = szh - n * mz * mh, det = a11 * a22 - a12 * a12;
        const gx = Math.abs(det) > 1e-9 ? (b1 * a22 - b2 * a12) / det : 0, gz = Math.abs(det) > 1e-9 ? (a11 * b2 - a12 * b1) / det : 0;
        if (Math.hypot(gx, gz) > 0.22) return false;                                   // steeper than any street: a bank
        let worst = 0; pts.forEach((c, i) => { const e = Math.abs(hs[i] - (mh + gx * (c[0] - x - mx) + gz * (c[1] - z - mz))); if (e > worst) worst = e; });
        return worst <= 0.07;
    };
    const placed = Grid(7), recOf = new Map();
    const put = q => { const P = poly(q, q.x, q.z, 0), r = { poly: P, bb: bbOf(P), q }; recOf.set(q, r); placed.add(r); };
    const lift = q => { const r = recOf.get(q); if (r) r.q = null; };   // (a moved row's old footprint is dead)
    /* what a row at (x, z) stands in: null = clear */
    const clash = (q, x, z, wide) => {
        const walled = WALLED.test(q.key), veh = isVeh(q), P = poly(q, x, z, walled ? 0.02 : veh ? 0.3 : 0.08), bb = bbOf(poly(q, x, z, 0.3)); let P2 = null;
        for (const s of G.near(bb)) { if (s.bb.x1 < bb.x0 || s.bb.x0 > bb.x1 || s.bb.z1 < bb.z0 || s.bb.z0 > bb.z1) continue;
            const fence = (s.type === 'fence' || s.type === 'hedge' || s.type === 'wall') && /bench|_bin$/.test(q.key);
            const pen = sat(fence ? (P2 || (P2 = poly(q, x, z, 0.22))) : P, s.poly);
            if (pen > ((walled && (s.type === 'building' || s.type === 'arch' || s.type === 'wall')) ? 0.08 : 0.02)) return s.type; }
        for (const r of placed.near(bb)) { if (!r.q || r.q === q || r.bb.x1 < bb.x0 || r.bb.x0 > bb.x1 || r.bb.z1 < bb.z0 || r.bb.z0 > bb.z1) continue; if (sat(P, r.poly) > 0.02) return 'prop'; }
        const g0 = ground(x, z); if (g0 === 'building') return 'ground';
        if (!veh && g0 === 'road' && !/barricade|cone|barrel|sandbags/.test(q.key)) return 'road';
        for (const c of poly(q, x, z, 0)) { const g = ground(c[0], c[1]); if (g === 'building' || (veh ? g !== g0 : (g === 'road' && g0 !== 'road'))) return 'ground'; }
        if (onDeck(x, z) || inWater(x, z)) return 'deck';
        if (!flatAt(q, x, z)) return 'step';
        return null;
    };
    const backed = (q, x, z) => {   // a wall thing still has its wall behind it
        const th = Math.PI - (q.face || 0) * D2R, fr = /ind_/.test(q.key) ? rotP(1, 0, th) : rotP(0, 1, th), P = poly(q, x - fr[0] * 0.3, z - fr[1] * 0.3, 0), bb = bbOf(P);
        for (const s of G.near(bb)) if ((s.type === 'building' || s.type === 'arch' || s.type === 'wall') && sat(P, s.poly) > 0.05) return true;
        return false;
    };
    const offCentre = (x, z) => { const fx = ((x + HALF) / C) % 1, fz = ((z + HALF) / C) % 1; return Math.hypot(fx - 0.5, fz - 0.5) * C >= 0.6; };
    /* the nearest clear, flat spot of the row's own kind; `far` = the wider search */
    const spot = (q, far, loose) => {   // `loose`: a wall thing with no wall to keep stands free, like any decor
        const cands = [], veh = isVeh(q), walled = WALLED.test(q.key) && !loose, decor = DECOR.test(q.key), th = Math.PI - (q.face || 0) * D2R;
        if (veh) { const ax = rotP(0, 1, th), sx = rotP(1, 0, th), R = 5 /* a parked car stays where its district parked it, give or take a length */; for (let a = 0.25; a <= R; a += 0.25) for (const s of [1, -1]) for (const l of [0, 0.4, -0.4, 0.8, -0.8, 1.2, -1.2, 1.6, -1.6]) cands.push([q.x + ax[0] * a * s + sx[0] * l, q.z + ax[1] * a * s + sx[1] * l, a + Math.abs(l)]); }
        else if (walled) { const fr = /ind_/.test(q.key) ? rotP(1, 0, th) : rotP(0, 1, th), al = [-fr[1], fr[0]], R = far ? 10 : 4;
            for (let l = 0.25; l <= R; l += 0.25) for (const s of [1, -1]) for (const a of [0, 0.05, -0.05, 0.1, -0.1, 0.2, 0.3]) cands.push([q.x + al[0] * l * s + fr[0] * a, q.z + al[1] * l * s + fr[1] * a, l + Math.abs(a)]); }
        else if (decor) { const R = far ? (loose ? 16 : 8) : 3.5, st = far ? (loose ? 0.5 : 0.25) : 0.125; for (let dx = -R; dx <= R; dx += st) for (let dz = -R; dz <= R; dz += st) if (dx || dz) cands.push([q.x + dx, q.z + dz, Math.hypot(dx, dz)]); }
        else { const cx = cellOf(q.x), cy = cellOf(q.z), R = far ? 6 : 3; for (let dx = -R; dx <= R; dx++) for (let dz = -R; dz <= R; dz++) cands.push([-HALF + (cx + dx + 0.5) * C, -HALF + (cy + dz + 0.5) * C, Math.hypot(-HALF + (cx + dx + 0.5) * C - q.x, -HALF + (cy + dz + 0.5) * C - q.z) + 0.001]); }
        cands.sort((a, b) => a[2] - b[2]);
        const g0 = ground(q.x, q.z);
        for (const c of cands) {
            const g = ground(c[0], c[1]); if (g === 'building' || (g0 !== 'building' && g !== g0 && (veh || g === 'road'))) continue;
            if (decor && !walled && !offCentre(c[0], c[1])) continue;
            if (walled && !backed(q, c[0], c[1])) continue;
            if (clash(q, c[0], c[1])) continue;
            return c;
        }
        return null;
    };

    const rows = props.filter(outdoor);
    tally.outdoor = rows.length;
    rows.forEach(put);
    const groundIt = q => { const ft = FT(q.x, q.z); if (!q.floor && ft != null && ft - H(q.x, q.z) > 0.15 && !onDeck(q.x, q.z)) { q.floor = true; return true; } return false; };
    for (const q of rows) {
        if (onDeck(q.x, q.z) || inWater(q.x, q.z)) continue;                            // a district's set on its deck / its boats
        const stood = groundIt(q);                                                     // 1. THE WALL STANDERS
        if (stood) { tally.grounded++; bump(q.key + ' off a wall top'); if (LOG) console.log('EXT ground', q.key, q.x, q.z); }
        let why = flatAt(q, q.x, q.z) ? null : 'step';                                 // 2. THE STEP STRADDLERS
        if (!why && stood && !WALLED.test(q.key)) { const w = clash(q, q.x, q.z); if (w === 'wall' || w === 'hedge' || w === 'fence' || w === 'building' || w === 'arch') why = w; }   // it stood ON the thing: now it stands in it
        if (!why) continue;
        const c = spot(q, false) || spot(q, true) || (WALLED.test(q.key) ? null : spot(q, true, true));
        if (!c && why === 'step' && WALLED.test(q.key)) {
            /* a wall thing whose wall runs along a bank the whole way: it keeps its wall and hangs at the bank's TOP (its foot on the
               higher ground's line, never buried in the bank) */
            let hi = -1e9; poly(q, q.x, q.z, 0).concat([[q.x, q.z]]).forEach(p => { hi = Math.max(hi, H(p[0], p[1])); });
            const up = hi - H(q.x, q.z);
            if (up > 0.02) { q.floor = true; if (up < 1) q.y = r3(up); else if (hi >= 1) q.y = r3(hi); else q.y = 0.99; }
            tally.hung = (tally.hung || 0) + 1; bump(q.key + ' hung at a bank top'); if (LOG) console.log('EXT hang', q.key, q.x, q.z, q.y); continue;
        }
        if (!c) { tally.stuck++; bump(q.key + ' in ' + why + ' NO SPOT'); if (LOG) console.log('EXT stuck', q.key, q.x, q.z, why); continue; }
        if (LOG) console.log('EXT move', q.key, q.x, q.z, '->', r3(c[0]), r3(c[1]), why);
        lift(q); q.x = r3(c[0]); q.z = r3(c[1]); if (q.floor && !stood) { /* keep */ } groundIt(q); put(q);
        tally.moved++; bump(q.key + ' off a ' + why);
    }
    /* 3. THE LEFT OUT: back in, at the nearest clear spot */
    if (LOG) rows.forEach(q => { if (!onDeck(q.x, q.z) && !inWater(q.x, q.z) && !flatAt(q, q.x, q.z) && !(q.y > 0)) console.log('EXT left', q.key, q.x, q.z); });
    for (const q of dropped) {
        const c = (!clash(q, q.x, q.z) ? [q.x, q.z] : null) || spot(q, false) || spot(q, true) || spot(q, true, true);
        if (!c && process.env.DC_EXT_DBG) { const R = {}; for (let dx = -8; dx <= 8; dx += 0.25) for (let dz = -8; dz <= 8; dz += 0.25) { const w = clash(q, q.x + dx, q.z + dz) || 'CLEAR'; R[w] = (R[w] || 0) + 1; } console.log('DBG', q.key, q.x, q.z, q.face, ground(q.x, q.z), JSON.stringify(R)); }
        if (!c) { tally.stuck++; bump(q.key + ' left out NO SPOT'); continue; }
        q.x = r3(c[0]); q.z = r3(c[1]); props.push(q); groundIt(q); put(q); tally.restored++; bump(q.key + ' put back');
        if (LOG) console.log('EXT back', q.key, q.x, q.z);
    }
    return tally;
};
