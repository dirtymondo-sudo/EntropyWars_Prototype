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
   FOUR PASSES LIVE (11-16), STOPPED, waits mondo's look: 1 the rock kit + the landmarks, 2 the built places, 3 the dressing + more
   people, 4 the lights, the air, steam and mist. What a fifth would do: the notes, "THE CAVERN, DISTRICT K". */
'use strict';
const CROSS = 'P02-01';
/* PASS 4, THE TEN REAL LIGHTS: one lit torch in each of these plots, two in the Crossroads; every other torch only glows */
const LIT = ['P02-01', 'P03-01', 'P02-02', 'P00-01', 'P05-01', 'P05-00', 'P04-00', 'P04-01', 'P01-01'];
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
        ctx.plots.forEach(p => { const c = ctx.corners(p.id); [c[0], c[c.length - 1]].forEach((q, i) => { if (q) put('cave_torch', p.id, q[0], q[1], { noLight: !(LIT.includes(p.id) && (i === 0 || p.id === CROSS)) }); }); });
        put('stocks', 'P05-00', 6, 4); put('cot', 'P05-00', 2, 3); put('psx_old_mattress_mp_1', 'P05-00', 3, 5); put('cot', 'P05-00', 2, 7); put('skull_pile', 'P05-00', 3, 9); ctx.dec('candleRing', 'P05-00', 6, 7); ctx.dec('skull_pile', 'P05-00', 3, 8);
        [[5, 3], [6, 8], [9, 6], [8, 9]].forEach(q => put('meshy_crystal_shards', 'P05-01', q[0], q[1], { h: 1.6 })); put('crystal_cluster', 'P05-01', 9, 7);
        const bulb = (id, lx, ly) => { const q = ctx.sq(id, lx, ly); ctx.props.push({ key: 'bare_bulb', x: ctx.gcx(q[0]), z: ctx.gcz(q[1]), ceil: true, y: ctx.r2(ctx.plot[id].base + 4.6), noLight: true }); };
        bulb('P03-00', 4, 5); bulb('P03-00', 8, 5); ctx.dec('cardboard_boxes', 'P03-00', 3, 8); ctx.dec('paper_sheet', 'P03-00', 7, 7);
        ctx.dec('candleRing', 'P00-00', 7, 6); ctx.dec('candleRing', 'P02-02', 6, 5);
        put('mine_cart', 'P05-01', 5, 9); ctx.dec('pickaxe', 'P05-01', 6, 2);
    },
    /* ── PASS 2, THE BUILT PLACES (a cave has no houses: its insides are the three places men made, and the camp of the ones who dig) ── */
    dress2(ctx) {
        const r2 = ctx.r2, put = (key, id, lx, ly, o) => { if (ctx.free(id, lx, ly)) ctx.P(key, id, lx, ly, o); };
        const wallProp = (key, id, lx, ly, side, o) => { const s = ctx.sq(id, lx, ly), off = 1.75 - 0.2, d = { n: [0, -off, 180], s: [0, off, 0], e: [off, 0, 270], w: [-off, 0, 90] }[side];
            ctx.props.push(Object.assign({ key, x: r2(ctx.gcx(s[0]) + d[0]), z: r2(ctx.gcz(s[1]) + d[1]), face: d[2], noBlock: true }, o || {})); };
        const hang = (key, id, lx, ly, h, o) => { const s = ctx.sq(id, lx, ly); ctx.props.push(Object.assign({ key, x: ctx.gcx(s[0]), z: ctx.gcz(s[1]), y: r2(ctx.plot[id].base + h), noLight: true, noBlock: true }, o || {})); };
        /* LEVEL −6: the guard post of a base that denies it (the middle and the way to the door stay clear) */
        const L6 = 'P03-00', b6 = ctx.plot[L6].base;
        [2, 3, 4].forEach(lx => wallProp('breaker_panel', L6, lx, 2, 'n')); wallProp('security_camera', L6, 8, 2, 'n', { y: r2(b6 + 3.2) }); wallProp('vent_grille', L6, 9, 2, 'n', { y: r2(b6 + 2.6) });
        wallProp('locker', L6, 9, 3, 'e'); wallProp('locker', L6, 9, 4, 'e'); wallProp('utility_box', L6, 2, 4, 'w'); wallProp('exit_sign', L6, 7, 2, 'n', { y: r2(b6 + 3.0) }); wallProp('radiation_sign', L6, 2, 8, 'w');
        [3, 4, 8, 9].forEach(lx => wallProp('pipe_run', L6, lx, 9, 's', { y: r2(b6 + 2.8) }));
        put('item_police_barricade', L6, 4, 3, { face: 0 }); put('item_police_barricade', L6, 8, 3, { face: 0 }); put('meshy_sandbags', L6, 3, 4); put('meshy_sandbags', L6, 9, 4 + 2);
        put('retro_control_panel', L6, 8, 8, { face: 0 }); put('footlocker', L6, 2, 3); put('psx_supply_crate_1', L6, 2, 9); put('psx_supply_crate_1', L6, 3, 9); put('psx_metal_barrel_mp_2', L6, 9, 9); put('psx_metal_barrel_mp_1', L6, 9, 8);
        put('rifle_rack', L6, 6, 9, { face: 0 }); ctx.dec('psx_ammo_box_1', L6, 5, 9, { noBlock: true }); ctx.dec('psx_walkie_talkie_1', L6, 7, 8, { noBlock: true }); ctx.dec('traffic_cone', L6, 4, 5, { noBlock: true });
        hang('flicker_tube', L6, 6, 4, 4.4, { ceil: true }); hang('flicker_tube', L6, 6, 8, 4.4, { ceil: true });
        /* THE OUBLIETTE: what a gaol nobody visits keeps */
        const OU = 'P05-00';
        put('trap_iron_maiden', OU, 9, 2, { face: 270 }); wallProp('wall_chains', OU, 9, 4, 'e'); wallProp('wall_chains', OU, 9, 8, 'e'); wallProp('wall_chains', OU, 5, 2, 'n'); wallProp('trap_chain_draped', OU, 8, 9, 's');
        put('psx_old_mattress_mp_1', OU, 2, 9, { noBlock: true }); ctx.dec('hw_body', OU, 3, 3, { noBlock: true }); ctx.dec('skull', OU, 2, 5, { noBlock: true }); ctx.dec('hw_part_3', OU, 3, 7, { noBlock: true });
        put('floor_drain', OU, 6, 6, { noBlock: true }); ctx.dec('key', OU, 7, 8, { noBlock: true }); ctx.dec('hw_candles', OU, 5, 4, { noBlock: true }); ctx.dec('hw_candles', OU, 8, 6, { noBlock: true });
        ['rat', 'rat', 'rat'].forEach((k, i) => ctx.dec(k, OU, [4, 7, 9][i], [8, 3, 7][i], { noBlock: true })); put('wooden_barrel', OU, 9, 9); put('cauldron', OU, 8, 2);
        [[2, 2], [9, 3]].forEach(q => ctx.dec('psx_cobweb_1', OU, q[0], q[1], { noBlock: true })); ctx.dec('psx_cobweb_2', OU, 2, 8, { noBlock: true });
        /* THE CRYSTAL ADIT: "a worked adit, squared and swept, with a light at the far end that is not a torch": dressed stone piers
           down both walls, a crystal alight on each; the miners' gear */
        { const A = 'P05-01', p = ctx.plot[A], ox = ctx.gx(p.sx) + 21, oz = ctx.gz(p.sy) + 21, parts = [];
          [1, 3, 9].forEach(ly => [[4, -1], [7, 1]].forEach(([lx, side]) => { const x = r2(ctx.gcx(p.sx + lx) + side * 1.45 - ox), z = r2(ctx.gcz(p.sy + ly) - oz);
              parts.push({ s: 'box', p: [x, 0, z], size: [0.6, 2.4, 0.9], key: 'dungeon_3', tint: 0xd0ccc0 }, { s: 'box', p: [x, 2.4, z], size: [0.8, 0.18, 1.1], key: 'dungeon_3', tint: 0xb8b4a8 },
                         { s: 'cyl', p: [x, 2.58, z], r: 0.28, r2: 0.04, h: 0.95, seg: 5, key: 'crystal', tint: 0xffe2b0, glow: 1.3 }, { s: 'cyl', p: [r2(x + 0.14), 2.58, r2(z + 0.22)], r: 0.14, r2: 0.03, h: 0.55, seg: 5, key: 'crystal', tint: 0xffd090, glow: 1.3 }); }));
          ctx.feat({ k: 'arch', id: 'cav:adit', x: r2(ox), z: r2(oz), rot: 0, base: p.base, parts });
          put('wheelbarrow', A, 5, 3); ctx.dec('pickaxe', A, 6, 9, { noBlock: true }); put('psx_wooden_crate_1', A, 4, 10); put('anvil', A, 7, 2); wallProp('signal_lever_frame', A, 2, 5, 'n'); ctx.dec('paper_sheet', A, 9, 6, { noBlock: true });
          [[10, 6, 2.6], [10, 9, 1.9], [8, 9, 1.2]].forEach(q => put('meshy_crystal_shards', A, q[0], q[1], { h: q[2] })); }
        /* THE CAMP ON THE SHELF: the ones who dig sleep by the spring */
        { const S = 'P04-01'; put('canvas_tent', S, 4, 3, { face: 135 }); put('campfire', S, 6, 4); put('firewood_stack', S, 3, 5); put('wooden_barrel', S, 5, 2); ctx.dec('sleeping_bag', S, 7, 3, { noBlock: true }); ctx.dec('backpack', S, 5, 4, { noBlock: true });
          ctx.dec('ship_lantern', S, 6, 3, { noBlock: true, noLight: true }); ctx.dec('pickaxe', S, 4, 5, { noBlock: true }); put('psx_wooden_crate_2', S, 3, 3); }
    },
    /* ── PASS 3, THE DRESSING (from the model list: docs/notes/areas-complexes.md "THE CAVERN, THE ZONE KIT", FITS THE CAVERN) ── */
    dress3(ctx) {
        const r2 = ctx.r2, put = (key, id, lx, ly, o) => { if (ctx.free(id, lx, ly)) ctx.P(key, id, lx, ly, o); }, dec = (key, id, lx, ly, o) => ctx.dec(key, id, lx, ly, Object.assign({ noBlock: true }, o || {}));
        const hang = (key, id, lx, ly, drop) => { const s = ctx.sq(id, lx, ly); ctx.props.push({ key, x: r2(ctx.gcx(s[0]) + (ctx.rnd() - 0.5)), z: r2(ctx.gcz(s[1]) + (ctx.rnd() - 0.5)), y: r2(ctx.plot[id].base + ctx.ceil(id) - drop), face: Math.round(ctx.rnd() * 360), noBlock: true }); };
        /* THE CROSSROADS: lantern posts round the Hall, a trail sign at each way out, what travellers left */
        [[3, 3], [9, 3], [2, 7], [10, 7]].forEach(q => put('lantern_post', CROSS, q[0], q[1], { noLight: true })); put('trail_sign', CROSS, 1, 6, { face: 90 }); put('trail_sign', CROSS, 10, 5, { face: 270 }); put('trail_sign', CROSS, 5, 10, { face: 180 });
        put('sea_chest', CROSS, 8, 2); dec('backpack', CROSS, 4, 2); dec('cardboard_boxes', CROSS, 9, 2); dec('paper_sheet', CROSS, 7, 3); dec('paper_sheet', CROSS, 5, 7); put('cave_stone', CROSS, 2, 3); put('sarsen', CROSS, 9, 8, { h: 2.6 });
        /* THE TERRACE: the pool's bank */
        ['reeds', 'reeds', 'reeds'].forEach((k, i) => dec(k, 'P03-01', [6, 7, 6][i], [4, 3, 8][i])); dec('meshy_frog', 'P03-01', 6, 5); put('ocean_rock_8', 'P03-01', 5, 3, { h: 1.3 }); put('ocean_rock_11', 'P03-01', 3, 7, { h: 1.0 }); dec('woods_glowcap', 'P03-01', 2, 4); dec('woods_glowcap', 'P03-01', 4, 2);
        /* THE RIVER CHAMBER: the ford's boat, the plank's posts; THE GROTTO: what grows in the dark */
        put('rowboat', 'P00-01', 4, 8, { face: 80 }); put('mooring_piles', 'P00-01', 8, 8); put('mooring_bollard', 'P00-01', 6, 8); dec('reeds', 'P00-01', 3, 8); dec('reeds', 'P00-01', 9, 10); dec('psx_fish_skeleton_mp_1', 'P00-01', 5, 7); put('wooden_barrel', 'P00-01', 9, 3);
        [[3, 2], [4, 3], [2, 3], [3, 1]].forEach(q => dec(ctx.rnd() < 0.5 ? 'mushroom2' : 'woods_glowcap', 'P00-01', q[0], q[1])); dec('fae_toadstool', 'P00-01', 3, 3);
        /* THE LONG RAMP: a hauling stage at the stair's foot */
        put('psx_wooden_crate_1', 'P01-01', 4, 6); put('psx_wooden_crate_2', 'P01-01', 4, 7); put('cable_drum', 'P01-01', 8, 8); put('hand_truck', 'P01-01', 8, 6); dec('meshy_burlap_sack', 'P01-01', 5, 8); put('lantern_post', 'P01-01', 8, 4, { noLight: true });
        /* THE HOT SIDE: vents by the lava, black boulders, what the heat left */
        put('sea_vent', 'P01-00', 3, 7); put('sea_vent', 'P01-00', 9, 3, { h: 1.7 }); put('asteroid_b', 'P01-00', 2, 5, { h: 1.8 }); put('asteroid_a', 'P01-00', 9, 8, { h: 1.5 }); dec('skull', 'P01-00', 5, 7); dec('psx_fish_skeleton_mp_1', 'P01-00', 7, 8);
        put('sea_vent', 'P00-00', 6, 4); put('decor_stone_arch', 'P00-00', 7, 2, { face: 0 }); put('skull_pile', 'P00-00', 8, 5); dec('hw_candles', 'P00-00', 6, 7); put('asteroid_b', 'P00-00', 8, 8, { h: 1.4 }); dec('hw_part_1', 'P00-00', 5, 8);
        put('mooring_bollard', 'P02-00', 3, 5); put('mooring_bollard', 'P02-00', 3, 7); put('mooring_bollard', 'P02-00', 0, 5); put('mooring_bollard', 'P02-00', 0, 7); put('asteroid_a', 'P02-00', 9, 4, { h: 1.6 }); put('sea_vent', 'P02-00', 6, 8, { h: 1.5 }); dec('warning_tape', 'P02-00', 4, 6);
        /* THE HIGH TIER: old stones at the top of the cavern, the surveyor's things */
        [[4, 4], [8, 4], [4, 8], [8, 8]].forEach((q, i) => put(i % 2 ? 'sarsen' : 'menhir', 'P04-00', q[0], q[1], { h: 2.4 + i * 0.3 })); put('trilithon', 'P04-00', 6, 3); dec('cardboard_boxes', 'P04-00', 9, 6); dec('paper_sheet', 'P04-00', 6, 7); put('telescope', 'P04-00', 6, 9);
        /* THE SHELF's spring, THE MOUTH: the last camp before the country */
        dec('reeds', 'P04-01', 9, 6); dec('woods_glowcap', 'P04-01', 10, 4); put('ocean_rock', 'P04-01', 9, 2, { h: 1.2 });
        put('campfire', 'P02-02', 4, 8); put('signpost', 'P02-02', 4, 10, { face: 180 }); put('lantern_post', 'P02-02', 8, 10, { noLight: true }); put('canvas_tent', 'P02-02', 7, 3, { face: 200 }); dec('sleeping_bag', 'P02-02', 5, 7); dec('backpack', 'P02-02', 3, 7); put('firewood_stack', 'P02-02', 2, 5); put('brass_telescope', 'P02-02', 3, 11);
        /* bats under every roof but Level −6's (hung a little under the rock) */
        ctx.plots.forEach(p => { if (p.id === 'P03-00') return; const sq = ctx.squares(p.id); for (let i = 0; i < 3 && sq.length; i++) { const q = sq[Math.floor(ctx.rnd() * sq.length)]; hang(['bat_black', 'bat_brown', 'bat_grey'][i], p.id, q[0], q[1], 0.5 + ctx.rnd() * 1.6); } });
        /* cobwebs and loose stone in the corners nobody walks */
        ctx.plots.forEach(p => { if (p.id === 'P03-00') return; ctx.corners(p.id).slice(1, 5).forEach((q, i) => dec(i % 2 ? 'psx_cobweb_1' : (['P00-00', 'P01-00', 'P02-00'].includes(p.id) ? 'hw_stone_2' : 'cave_stone'), p.id, q[0], q[1])); });
    },
    /* ── PASS 4, THE ATMOSPHERE: the air of each part of the cave, steam where water meets heat, mist under the fall ── */
    airZones(ctx) { return [
        { sx0: 0, sy0: 0, sx1: 36, sy1: 12, kind: 'motes', color: 0xff7a30, n: 190, speed: 0.5 },      // sparks over the hot side
        { sx0: 60, sy0: 12, sx1: 72, sy1: 24, kind: 'motes', color: 0xffe2b0, n: 80, speed: 0.16 },    // the warm light of the Adit
        { sx0: 0, sy0: 12, sx1: 60, sy1: 24, kind: 'dust', color: 0xb8a890, n: 220, speed: 0.14 },     // the lower tier
        { sx0: 36, sy0: 0, sx1: 72, sy1: 12, kind: 'dust', color: 0x9aa0a8, n: 110, speed: 0.1 },      // the High Tier, Level −6, the Oubliette
        { sx0: 24, sy0: 24, sx1: 36, sy1: 36, kind: 'dust', color: 0xe8d8a8, n: 70, speed: 0.2 } ]; }, // the Mouth, in the country's light
    dress4(ctx) {
        const r2 = ctx.r2, steam = (id, lx, ly, rise, o) => { const s = ctx.sq(id, lx, ly); ctx.props.push(Object.assign({ key: 'chimney_smoke', x: ctx.gcx(s[0]), z: ctx.gcz(s[1]), y: r2(ctx.plot[id].base + 0.2), rise, noBlock: true }, o || {})); };
        steam('P01-00', 3, 7, 4); steam('P01-00', 9, 3, 3.5); steam('P00-00', 6, 4, 4); steam('P02-00', 6, 8, 3); steam('P00-00', 3, 5, 3);   // the vents and the crack
        steam('P03-01', 10, 6, 2.6); steam('P03-01', 9, 7, 2.2);                                                                          // mist under the fall
        /* crystals alight in the dark: the Adit's ledge, the Terrace's pool, the Grotto (they glow; no real light) */
        [['P05-01', 9, 6], ['P05-01', 8, 7], ['P03-01', 7, 9], ['P00-01', 2, 2], ['P04-00', 9, 8]].forEach(q => { if (ctx.free(q[0], q[1], q[2])) ctx.P('crystal_cluster', q[0], q[1], q[2], { noLight: true }); });
    },
    people(ctx) {
        const O = ctx.O;
        ctx.native('ghoul', CROSS, 8, 7, 300, ctx.sayOf(O.gallery, 'ghoul')); ctx.native('gnome', CROSS, 3, 7, 160, ctx.sayOf(O.gallery, 'gnome'));
        ctx.native('gnome', 'P05-01', 6, 5, 250, ctx.sayOf(O.adit, 'gnome')); ctx.native('reptilian', 'P02-02', 7, 9, 180, ctx.sayOf(O.mouth, 'reptilian'));
        ctx.native('ghoul', 'P05-00', 7, 6, 180); ctx.native('reptilian', 'P01-00', 8, 7, 0);
        /* PASS 3 (mondo 11-16: more people, none on a path): the diggers at their camp, a keeper at the bridge, the base's own */
        const at = (race, id, lx, ly, face) => { if (ctx.free(id, lx, ly)) ctx.native(race, id, lx, ly, face); };
        at('gnome', 'P04-01', 5, 5, 90); at('gnome', 'P04-01', 7, 2, 180); at('goblin', 'P00-01', 8, 4, 200); at('goblin', 'P01-01', 5, 6, 90); at('reptilian', 'P04-00', 7, 6, 180); at('ghoul', 'P00-00', 8, 7, 300); at('men in black', 'P03-00', 4, 8, 0); at('antperson', 'P02-00', 8, 6, 270); at('gnome', 'P03-01', 4, 5, 120);
    },
};
