/* THE CAVERN, district K · THE CAVERN (13 plots: the two north rows + the Mouth, P02-02). One thread a file (docs/notes/claims.md). Read by
   `node bake-cavern.js`; rules: docs/notes/areas-complexes.md "THE CAVERN ON PLOTS" + "THE CAVERN, THE ZONE KIT".
   BRIEF: the dark cave under the crust, the crossroads of everything below. A loop over three tiers: the Crossroads (level 4) > the Terrace
   and its fall > up to the Shelf (8) > up to the High Tier (12) > Level −6's cut rock > down to the Spur (8) > the rope bridge over the lava
   chasm > the Hot Shelf and its lava lake > the Fissure (the way to Hell) > down the Long Ramp (4) > the River Chamber > the Crossroads.
   Off the loop: the Crystal Adit (down from the Shelf; on south into Agartha), the Oubliette (a step down from the Adit; the Sewers, DOOR
   HQ's cell), the Mouth (south of the Crossroads: the Lip over Hollow Earth, the long stair down).
   THE LIGHT: torch amber, and the lava's red on the hot side (the room's third big light). No daylight but what comes in at the Mouth.
   A plot's squares are local (lx, ly 0..11 from its north-west corner). ctx: bake-cavern.js CTX (the Sewers' own: P, dec, native, sq,
   squares, corners, inner, free, plot, feat, props, counters, O = the old rooms' people, lines and door plates).
   STANDS TODAY: see the STANDS / NOT YET list at the end of this header; the pilot's passes are logged in the notes.
   STANDS (first build): torches at the bends, the old rooms' pieces re-homed (the Needle's menhir, the stocks and cot, the crystals of the
   Adit, the bulbs of Level −6, the candle rings), the Healing Zone, six bystanders with their old lines.
   NOT YET: everything a pass makes (see the notes). */
'use strict';
const CROSS = 'P02-01';
module.exports = {
    suns(ctx) { const s = ctx.sq('P01-00', 6, 4), b = ctx.plot['P01-00'].base; return [{ x: ctx.gcx(s[0]), y: ctx.r2(b + 2.2), z: ctx.gcz(s[1]), color: 0xff5a20, intensity: 1.5, dist: 46, decay: 1.4 }]; },
    plan(ctx) {
        /* THE GROTTO (the old Cavern's dead end): a pocket off the River Chamber's north-west corner, a pool in it */
        ctx.setRect(ctx.plot['P00-01'].sx + 1, ctx.plot['P00-01'].sy + 1, ctx.plot['P00-01'].sx + 4, ctx.plot['P00-01'].sy + 3, 'o');
        const g = ctx.sq('P00-01', 1, 1); ctx.cell[g[1]][g[0]] = 'w'; ctx.cell[g[1]][g[0] + 1] = 'w';
    },
    build(ctx) {
        /* the Healing Zone, the old Cavern's own, by the Crossroads' way in */
        const hz = (ctx.O.gallery.c || []).find(c => c.id === 'healzone'), s = ctx.sq(CROSS, 7, 4);
        if (hz) { ctx.taken.add(s[0] + ':' + s[1]); ctx.counters.push(Object.assign({}, hz, { x: ctx.gcx(s[0]), z: ctx.gcz(s[1]), plateY: ctx.r2(ctx.plot[CROSS].base + 2.35) })); }
        /* ── PASS 1, THE ROCK AND THE LANDMARKS ── */
        const C = ctx.C, r2 = ctx.r2, TINT = [0xd6d2c4, 0xbcb9aa, 0xcfc8b8, 0xc4bcae], DIRS = { n: [0, -1], s: [0, 1], w: [-1, 0], e: [1, 0] };
        const mid = p => [ctx.gx(p.sx) + 6 * C, ctx.gz(p.sy) + 6 * C];
        /* every dry square with rock beside it, and on which side */
        const faces = p => { const out = []; for (let ly = 0; ly < 12; ly++) for (let lx = 0; lx < 12; lx++) { const x = p.sx + lx, y = p.sy + ly; if (!ctx.open(x, y) || 'wlb'.includes(ctx.cell[y][x])) continue;
            for (const d of 'nswe') { const v = DIRS[d], X = x + v[0], Y = y + v[1]; if (X < 0 || Y < 0 || X >= ctx.W || Y >= ctx.H) continue; if (!ctx.open(X, Y)) out.push({ lx, ly, d, v }); } } return out; };
        /* THE ROCK KIT: the walls are square blocks, so every plot's wall feet wear boulders (squashed domes half in the wall) and
           stalagmites (tapered columns, point up), in four greys; one `arch` row a plot. Drawn only: nothing here blocks a walk. */
        ctx.plots.forEach(p => { if (p.id === 'P03-00') return;   // Level −6 is cut square: no rubble in it
            const F = faces(p), [ox, oz] = mid(p), parts = [], hot = ['P00-00', 'P01-00', 'P02-00'].includes(p.id), key = hot ? 'obsidian' : 'rocks_5', tn = () => hot ? [0xffffff, 0xe8d8d8, 0xd8c8d0][Math.floor(ctx.rnd() * 3)] : TINT[Math.floor(ctx.rnd() * 4)];
            F.forEach(f => { const cx = ctx.gcx(p.sx + f.lx) - ox, cz = ctx.gcz(p.sy + f.ly) - oz, t = (ctx.rnd() - 0.5) * 2.6, wx = cx + f.v[0] * 1.75 + (f.v[0] ? 0 : t), wz = cz + f.v[1] * 1.75 + (f.v[1] ? 0 : t);
                const k = ctx.rnd();
                if (k < 0.5) { const r = 0.7 + ctx.rnd() * 1.1; parts.push({ s: 'dome', p: [r2(wx), 0, r2(wz)], r: r2(r), rz: r2(r * (0.7 + ctx.rnd() * 0.5)), h: r2(0.5 + ctx.rnd() * 1.5), seg: 7, rings: 3, key, tint: tn(), uv: 2.5 }); }
                else if (k < 0.8) { const h = 0.7 + ctx.rnd() * 2.4; parts.push({ s: 'cyl', p: [r2(wx - f.v[0] * 0.7), 0, r2(wz - f.v[1] * 0.7)], r: r2(0.16 + h * 0.13), r2: 0.03, h: r2(h), seg: 6, key, tint: tn(), uv: 2.5 }); }
                else if (k < 0.9) { /* a buttress: a tapered rib up the wall, floor to roof */ parts.push({ s: 'cyl', p: [r2(wx), 0, r2(wz)], r: r2(1.0 + ctx.rnd() * 0.6), r2: r2(0.5 + ctx.rnd() * 0.4), h: r2(ctx.ceil(p.id) + 0.2), seg: 7, key, tint: tn(), uv: 3.5 }); } });
            if (parts.length) ctx.feat({ k: 'arch', id: 'cav:' + p.id + ':rock', x: r2(ox), z: r2(oz), rot: 0, base: p.base, parts }); });
        /* THE NEEDLE: a column of dripstone, floor to roof, in the middle of the Hall (the old room's menhir stood for it) */
        { const p = ctx.plot[CROSS], q = ctx.sq(CROSS, 6, 6), top = ctx.ceil(CROSS); ctx.taken.add(q[0] + ':' + q[1]);
          ctx.feat({ k: 'arch', id: 'cav:needle', x: ctx.gcx(q[0]), z: ctx.gcz(q[1]), rot: 0, base: p.base, parts: [
              { s: 'cyl', p: [0, 0, 0], r: 1.55, r2: 0.42, h: r2(top * 0.62), seg: 9, key: 'rocks_5', tint: 0xd6d2c4, uv: 3 }, { s: 'cyl', p: [0, r2(top * 0.56), 0], r: 0.36, r2: 1.5, h: r2(top * 0.44 + 0.1), seg: 9, key: 'rocks_5', tint: 0xcfc8b8, uv: 3 },
              { s: 'dome', p: [0, 0, 0], r: 2.3, h: 0.7, seg: 10, rings: 3, key: 'rocks_5', tint: 0xbcb9aa, uv: 3 }, { s: 'cyl', p: [1.5, 0, 0.9], r: 0.5, r2: 0.04, h: 2.6, seg: 6, key: 'rocks_5', tint: 0xcfc8b8 }, { s: 'cyl', p: [-1.2, 0, -1.4], r: 0.4, r2: 0.04, h: 1.9, seg: 6, key: 'rocks_5', tint: 0xd6d2c4 } ] });
          ctx.feat({ k: 'wall', x0: r2(ctx.gcx(q[0]) - 1), z0: ctx.gcz(q[1]), x1: r2(ctx.gcx(q[0]) + 1), z1: ctx.gcz(q[1]), h: 3, t: 2, ghost: true }); }
        /* THE ROPE BRIDGE's rails, THE LIP's rail (the long stair's head stays open) */
        { const a = ctx.sq('P02-00', 1, 6), z = ctx.gcz(a[1]); for (const o of [-0.95, 0.95]) ctx.feat({ k: 'rail', x0: r2(ctx.gx(a[0]) - 0.6), z0: r2(z + o), x1: r2(ctx.gx(a[0] + 2) + 0.6), z1: r2(z + o) });
          const m = ctx.plot['P02-02'], zl = r2(ctx.gz(m.sy + 12) - 0.25); ctx.feat({ k: 'rail', x0: ctx.gx(m.sx + 2), z0: zl, x1: ctx.gx(m.sx + 5), z1: zl }); ctx.feat({ k: 'rail', x0: ctx.gx(m.sx + 8), z0: zl, x1: ctx.gx(m.sx + 10), z1: zl }); }
        /* LEVEL −6: the rock cut square. A concrete lining on every wall of the chamber, a hazard band at its foot, a portal round the
           blast door (the link's own bulkhead leaf) with the level stencilled over it */
        { const p = ctx.plot['P03-00'], [ox, oz] = mid(p), parts = [], H = 4.6;
          faces(p).forEach(f => { if (f.ly < 2 || f.ly > 9) return; const cx = ctx.gcx(p.sx + f.lx) - ox, cz = ctx.gcz(p.sy + f.ly) - oz, ns = !!f.v[1];
              parts.push({ s: 'box', p: [r2(cx + f.v[0] * 1.69), 0, r2(cz + f.v[1] * 1.69)], size: ns ? [C, H, 0.12] : [0.12, H, C], key: 'urban:ConcreteStriped2c', tint: 0xb4b6b2, uv: 3.5 },
                         { s: 'box', p: [r2(cx + f.v[0] * 1.62), 0, r2(cz + f.v[1] * 1.62)], size: ns ? [C, 0.5, 0.06] : [0.06, 0.5, C], tint: 0xd8b020 }); });
          const dz = ctx.gz(p.sy + 2) - oz, dx = ctx.gcx(p.sx + 6) - ox;
          parts.push({ s: 'box', p: [r2(dx - 2.3), 0, r2(dz + 0.4)], size: [0.9, 4.2, 0.9], key: 'concrete_floor', tint: 0x9a9c98 }, { s: 'box', p: [r2(dx + 2.3), 0, r2(dz + 0.4)], size: [0.9, 4.2, 0.9], key: 'concrete_floor', tint: 0x9a9c98 },
                     { s: 'box', p: [r2(dx), 3.5, r2(dz + 0.4)], size: [5.5, 0.9, 0.9], key: 'concrete_floor', tint: 0x8a8c88 },
                     { s: 'quad', p: [r2(dx), 3.95, r2(dz + 0.87)], size: [3.2, 0.62], key: 'txt:LEVEL −6|#141414|#d8b020|5.2||stencil', uv: 'fit', kind: 'wall', glow: 0.4 });
          ctx.feat({ k: 'arch', id: 'cav:level6', x: r2(ox), z: r2(oz), rot: 0, base: p.base, parts }); }
        /* THE OUBLIETTE: four cells along the west wall, each a step down ("no doors on the cells. A step."), stone walls between them */
        { const p = ctx.plot['P05-00'], x0 = ctx.gx(p.sx + 2), x1 = ctx.gx(p.sx + 4);
          [4, 6, 8].forEach(ly => ctx.feat({ k: 'wall', x0, z0: ctx.gz(p.sy + ly), x1, z1: ctx.gz(p.sy + ly), h: 2.8, t: 0.4, key: 'dungeon_3' }));
          [2, 4, 6, 8].forEach(ly => { ctx.feat({ k: 'dip', x: r2(x0 + 3.5), z: ctx.gz(p.sy + ly + 1), r: 2.9, h: 0.55 }); ctx.feat({ k: 'wall', x0: x1, z0: ctx.gz(p.sy + ly), x1, z1: r2(ctx.gz(p.sy + ly) + 1.3), h: 2.8, t: 0.4, key: 'dungeon_3' }); }); }
    },
    dress(ctx) {
        const put = (key, id, lx, ly, o) => { if (ctx.free(id, lx, ly)) ctx.P(key, id, lx, ly, o); };
        /* a torch in two corners of every plot: the first two bends the plan gives */
        ctx.plots.forEach(p => { const c = ctx.corners(p.id); [c[0], c[c.length - 1]].forEach(q => { if (q) put('cave_torch', p.id, q[0], q[1], { noLight: !['P02-01', 'P03-01', 'P02-02', 'P00-01', 'P05-01'].includes(p.id) }); }); });
        put('stocks', 'P05-00', 6, 4); put('cot', 'P05-00', 2, 3); put('psx_old_mattress_mp_1', 'P05-00', 3, 5); put('cot', 'P05-00', 2, 7); put('skull_pile', 'P05-00', 3, 9); ctx.dec('candleRing', 'P05-00', 6, 7); ctx.dec('skull_pile', 'P05-00', 3, 8);
        [[5, 3], [6, 8], [9, 6], [8, 9]].forEach(q => put('meshy_crystal_shards', 'P05-01', q[0], q[1], { h: 1.6 })); put('crystal_cluster', 'P05-01', 9, 7);
        const bulb = (id, lx, ly) => { const q = ctx.sq(id, lx, ly); ctx.props.push({ key: 'bare_bulb', x: ctx.gcx(q[0]), z: ctx.gcz(q[1]), ceil: true, y: ctx.r2(ctx.plot[id].base + 4.6), noLight: true }); };
        bulb('P03-00', 4, 5); bulb('P03-00', 8, 5); ctx.dec('cardboard_boxes', 'P03-00', 3, 8); ctx.dec('paper_sheet', 'P03-00', 7, 7);
        ctx.dec('candleRing', 'P00-00', 7, 6); ctx.dec('candleRing', 'P02-02', 6, 5);
        put('mine_cart', 'P05-01', 5, 9); ctx.dec('pickaxe', 'P05-01', 6, 2);
    },
    people(ctx) {
        const O = ctx.O;
        ctx.native('ghoul', CROSS, 8, 7, 300, ctx.sayOf(O.gallery, 'ghoul')); ctx.native('gnome', CROSS, 3, 7, 160, ctx.sayOf(O.gallery, 'gnome'));
        ctx.native('gnome', 'P05-01', 6, 5, 250, ctx.sayOf(O.adit, 'gnome')); ctx.native('reptilian', 'P02-02', 7, 9, 180, ctx.sayOf(O.mouth, 'reptilian'));
        ctx.native('ghoul', 'P05-00', 7, 6, 180); ctx.native('reptilian', 'P01-00', 8, 7, 0);
    },
};
