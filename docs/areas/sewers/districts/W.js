/* THE SEWERS, district W · THE SEWERS (15 plots: the culverts, the Junction, the Cistern, the Pump Room, the Outfall).
   One thread a file (docs/notes/claims.md). Read by `node bake-sewers.js`; rules: docs/notes/areas-complexes.md "THE SEWERS ON PLOTS".
   BRIEF: a dungeon, dark, grimy, scary (mondo 11-16). Brick culverts that bend, fork and stop; the water steps down over the falls from the
   north row to the Outfall. Lit by few fires only. Names are the old Sewers' own sub-areas and door plates: invent none.
   A plot's squares are local (lx, ly 0..11 from its north-west corner). ctx: P (a blocker on a square's middle), dec (decor, off centre),
   native (a bystander), feat (a terrain row), squares / corners / inner / walled (lists of local squares), plot[id].base (its floor, m).
   STANDS TODAY (build 4: the tool vaults every tunnel and roofs every plot; ctx.pier / ctx.ceil): torches on the bends, the Pump Room's boiler, the Junction's brazier + Healing Zone, the Inspection Gallery
   on its step, barrels / grates / stains, the old room's four bystanders. THE MODEL LIST PASS: pump, gauge board, hoist, lever, dumpster, tyres, a body at the Outfall, litter, drains, mushrooms. THE GRIME PASS: the tool lays slime lines, rusted mains, floor decals; here: rubbish in the bends, cobwebs, valves. PASS 1 OF 5 (the district thread, 11-16, THE WALLS): the wall kit below
   (drawn bulkhead lamps with lit brick, pilasters, stains, drain outlets, one `arch` row a plot), the Cistern's rail + depth staff, the Gallery's rail, four culvert
   mouths high in the Junction's walls, two street grates in the Outfall's roof, four real bulbs. PASS 2 (THE ROOMS' INSIDES): the Pump Room (second pump, compressor, plinths, risers, the engineer's desk, lockers), the Pumping Station's crew corner, the Gallery's watch post + store,
   the Junction's rest stop + stores + benches, the Cistern's boat, life rings, net, the Outfall's screen and what it caught. PASS 3 (THE DRESSING): name plates + warnings by the lamps, a scene in a bend of each culvert plot (a sleeper's corner, flood works, bones,
   a job half done, storm rubbish, mushrooms + frogs, a stash, a fall of brick, the bats' roost), bats in the halls, an eel, crabs, a cat, graffiti, chains. PASS 4 (THE ATMOSPHERE): flickering tubes, swaying lanterns, mist at the falls, steam, red call points, eyes under the dead lamps,
   daylight under the Outfall's grates. PASS 5 (POLISH): the pilasters' bands, the plinths and the screen's posts wear the concrete sheet (a dark bare tint drew as shiny plate), the lit brick is paler. FIVE PASSES DONE.
   THE MODEL PASS (mondo 11-16, the wish-list models): `cage_lamp` in place of the lamps drawn from boxes, `rat` in place of the eyes, `strobe_lamp` in place of the call buttons, `valve_wheel`, `manhole_ladder`,
   `waste_pipe`, hazmat suits, moss, spiders, a sleeping bag + backpack + kettle, a ladder, oars + rope + a bollard, candles, a wheelbarrow + pickaxe. STOPPED again: waits mondo's look.
   NOT YET: drips and a district's own air (they need `airZones` in the tool: asked on the board), water sound (the game has none). */
'use strict';
const nth = (list, i) => list.length ? list[Math.min(list.length - 1, Math.max(0, i))] : null;

/* ── THE WALL KIT (district thread, pass 1; mondo 11-16: every district prototyped). The room has TEN real lights for all four districts and
   W's torches got none of them, so the light here is DRAWN: a bulkhead lamp = an iron back plate + a lit lens + the brick behind it lit in
   two steps + a lit patch of floor (`glow` parts: no light is cast, nothing to pay on a weak machine). Everything below is one `arch` row a
   plot (`sew:W:<plot>:kit`, seen only): lamps, brick pilasters, stains under the mains, drain outlets, rails. ── */
const SODIUM = 0xffa244, COLD = 0xbfe8b0, RED = 0xff3a22, IRON = 0x1c1c20, RUSTK = 'urban:MetalCorrugatedPainted2a';
const dice = s => { let v = s >>> 0; return () => { v = (v * 1664525 + 1013904223) >>> 0; return v / 4294967296; }; };
const DIRS = { n: [0, -1], s: [0, 1], w: [-1, 0], e: [1, 0] };
function wallKit(ctx, id) {
    const p = ctx.plot[id], N = ctx.N, C = ctx.C, ox = ctx.gx(p.sx) + N * C / 2, oz = ctx.gz(p.sy) + N * C / 2, r2 = ctx.r2, parts = [], H = ctx.ceil(id);
    const ch = (lx, ly) => { const x = p.sx + lx, y = p.sy + ly; return (x < 0 || y < 0 || x >= ctx.W || y >= ctx.H) ? 'x' : ctx.cell[y][x]; };
    /* every wall face of the plot: a dry or wet square + the side its wall stands on */
    const faces = [];
    for (let ly = 0; ly < N; ly++) for (let lx = 0; lx < N; lx++) { const c = ch(lx, ly); if (c === 'x') continue; for (const d of 'nswe') { const v = DIRS[d]; if (ch(lx + v[0], ly + v[1]) === 'x') faces.push({ lx, ly, d, c }); } }
    /* a part on a wall face: u = along the wall (m from the square's middle), y = its foot, out = its middle's distance from the wall line */
    const K = {
        id, p, parts, faces, H, ch,
        at(f, u, y, out) { const v = DIRS[f.d], cx = ctx.gcx(p.sx + f.lx) - ox, cz = ctx.gcz(p.sy + f.ly) - oz, hx = C / 2;
            return v[0] ? [r2(cx + v[0] * (hx - out)), y, r2(cz + u)] : [r2(cx + u), y, r2(cz + v[1] * (hx - out))]; },
        ry(f) { return { n: 0, s: 180, w: 270, e: 90 }[f.d]; },
        box(f, u, y, out, w, h, d, o) { parts.push(Object.assign({ s: 'box', p: K.at(f, u, y, out), size: [w, h, d], ry: K.ry(f) }, o || {})); },
        quad(f, u, y, out, w, h, o) { parts.push(Object.assign({ s: 'quad', p: K.at(f, u, y, out), size: [w, h], ry: K.ry(f) }, o || {})); },
        /* THE BULKHEAD LAMP */
        lamp(f, color, dead, y0) { const y = y0 || 2.45, sheet = f.c === 'f' ? 'urban:ConcreteStriped2c' : 'bricks_2';
            /* THE MODEL PASS (mondo 11-16: the wish-list models are in): the lamp is the `cage_lamp` model now; the boxes that stood in for it are gone.
               What is still drawn: its conduit, a small lit bulb inside the cage, the lit brick and floor. A dead lamp has a rat at the wall's foot (the eyes are gone). */
            K.box(f, 0, y + 0.3, 0.04, 0.06, Math.max(0.2, 3.0 - y - 0.3), 0.06, { tint: IRON });
            { const v = DIRS[f.d], sq = ctx.sq(id, f.lx, f.ly); ctx.props.push({ key: 'cage_lamp', x: ctx.r2(ctx.gcx(sq[0]) + v[0] * 1.6), z: ctx.r2(ctx.gcz(sq[1]) + v[1] * 1.6), ceil: true, y: ctx.r2(p.base + y + 0.2), face: { n: 180, s: 0, w: 90, e: 270 }[f.d], noBlock: true });   /* `ceil: true` = hung with its TOP at y. A small raised prop without it is a TABLETOP prop: the game seats it on whatever is under it (the lamps over a lit floor patch dropped out of sight) */
              if (dead) { ctx.props.push({ key: 'rat', x: ctx.r2(ctx.gcx(sq[0]) + v[0] * 1.3 + (v[0] ? 0 : 0.9)), z: ctx.r2(ctx.gcz(sq[1]) + v[1] * 1.3 + (v[1] ? 0 : 0.9)), face: (f.lx * 67 + f.ly * 131) % 360, noBlock: true }); return; } }
            K.box(f, 0, y + 0.06, 0.13, 0.12, 0.16, 0.05, { tint: color, glow: 1 });
            const pale = (c => { const m = v => Math.round(v + (255 - v) * 0.6); return (m(c >> 16 & 255) << 16) | (m(c >> 8 & 255) << 8) | m(c & 255); })(color);   /* the lit brick is paler than the lens */
            [[1.1, 1.3, 0.22, y - 0.45], [2.1, 2.3, 0.14, y - 1.1], [3.3, 3.2, 0.08, 0.35], [4.8, 3.9, 0.04, 0.12]].forEach((w, k) => K.box(f, 0, w[3], 0.075 - k * 0.012, w[0], w[1], 0.02, { key: 'bricks_2', tint: pale, glow: w[2], top: false, uv: 3.5 }));
            const ns = f.d === 'n' || f.d === 's'; [[1.6, 1.1, 0.14, 0.75], [3.0, 2.2, 0.08, 1.2]].forEach((w, k) => parts.push({ s: 'quad', flat: true, p: K.at(f, 0, 0.035 - k * 0.01, w[3]), size: ns ? [w[0], w[1]] : [w[1], w[0]], key: sheet, tint: pale, glow: w[2] })); },
        /* a brick pilaster, floor to the vault's spring, a stone band on it */
        pilaster(f) { K.box(f, 0, 0, 0.16, 0.95, 3.1, 0.34, { key: 'bricks_2', tint: 0x8a8274, gain: 1.15, top: false, uv: 3.5 }); K.box(f, 0, 3.1, 0.2, 1.15, 0.22, 0.44, { key: 'urban:ConcreteStriped2c', tint: 0x8a8680 }); K.box(f, 0, 0, 0.2, 1.1, 0.3, 0.42, { key: 'urban:ConcreteStriped2c', tint: 0x8a8680 }); },
        /* a stain down the wall */
        streak(f, rnd) { const w = 0.3 + rnd() * 0.7, h = 1.1 + rnd() * 1.6; K.box(f, r2((rnd() - 0.5) * 1.8), r2(0.4 + rnd() * 0.5), 0.04, r2(w), r2(h), 0.025, { key: 'bricks_2', tint: 0x1e2414, top: false }); },
        /* a small drain outlet: a rusted collar, the black in it, the run under it */
        outlet(f, rnd) { const y = r2(0.9 + rnd() * 0.9), u = r2((rnd() - 0.5) * 1.4);
            K.box(f, u, y, 0.14, 0.62, 0.62, 0.3, { key: RUSTK, tint: 0x6a3f24 }); K.box(f, u, y + 0.09, 0.3, 0.44, 0.44, 0.02, { tint: IRON });
            K.box(f, u, 0.05, 0.035, 0.36, y, 0.02, { key: 'bricks_2', tint: 0x1e2414, top: false }); },
        /* a rail along a run of squares' edge (drawn; posts every half square) */
        rail(x0, z0, x1, z1) { const len = Math.hypot(x1 - x0, z1 - z0), horiz = Math.abs(x1 - x0) > Math.abs(z1 - z0), mx = r2((x0 + x1) / 2 - ox), mz = r2((z0 + z1) / 2 - oz);
            for (const y of [0.55, 1.02]) parts.push({ s: 'box', p: [mx, y, mz], size: horiz ? [r2(len), 0.06, 0.06] : [0.06, 0.06, r2(len)], tint: IRON });
            for (let t = 0; t <= len + 0.01; t += 1.75) parts.push({ s: 'box', p: [r2(x0 + (x1 - x0) * t / len - ox), 0, r2(z0 + (z1 - z0) * t / len - oz)], size: [0.08, 1.08, 0.08], tint: IRON }); },
        done() { if (parts.length) ctx.feat({ k: 'arch', id: 'sew:W:' + id + ':kit', x: r2(ox), z: r2(oz), rot: 0, base: p.base, parts }); },
    };
    return K;
}
module.exports = {
    /* tanks nobody wades */
    deep: ['P04-01'],
    build(ctx) {
        /* THE INSPECTION GALLERY: the room's north part stands 1.6 m up its stair, looking down on the culvert */
        const g = ctx.plot['P05-00'], x0 = ctx.gx(g.sx + 8), x1 = ctx.gx(g.sx + 11), z0 = ctx.gz(g.sy + 2), z1 = ctx.gz(g.sy + 6);
        ctx.feat({ k: 'plateau', x: ctx.r2((x0 + x1) / 2), z: ctx.r2((z0 + z1) / 2), w: ctx.r2(x1 - x0), d: ctx.r2(z1 - z0), h: ctx.r2(g.base + 1.6), edge: 0.15 });
        ctx.feat({ k: 'ramp', x0: ctx.gcx(g.sx + 9), z0: ctx.gz(g.sy + 8), x1: ctx.gcx(g.sx + 9), z1: ctx.r2(ctx.gz(g.sy + 6) - 0.4), w: 3.5, h0: g.base, h1: ctx.r2(g.base + 1.6), stairs: true, model: 'grate', edge: 0.15 });
        /* THE JUNCTION'S PIERS: four brick piers round the pool, floor to vault; the Cistern's and the Outfall's, two each by the fall */
        [[4, 4], [8, 4], [4, 8], [8, 8]].forEach(q => ctx.pier('P02-02', q[0], q[1]));
        [[2, 2], [2, 10]].forEach(q => ctx.pier('P04-01', q[0], q[1])); [[3, 4], [9, 4]].forEach(q => ctx.pier('P05-03', q[0], q[1]));
        /* THE HEALING ZONE at the Junction (the old Sewers' own counter, moved with its words) */
        const hz = ctx.O.sewers.c.find(c => c.id === 'healzone');
        if (hz) { const s = ctx.sq('P02-02', 4, 9); ctx.counters.push(Object.assign({}, hz, { x: ctx.gcx(s[0]), z: ctx.gcz(s[1]), plateY: ctx.r2(ctx.plot['P02-02'].base + 2.35) })); ctx.taken.add(s[0] + ':' + s[1]); }
    },
    dress(ctx) {
        ctx.plots.forEach((p, i) => {
            const cs = ctx.corners(p.id);
            /* a torch on two bends of every plot: the only light in the culverts */
            [0, Math.floor(cs.length / 2)].forEach(k => { const q = cs[k]; if (q && ctx.free(p.id, q[0], q[1])) ctx.P('cave_torch', p.id, q[0], q[1]); });
            const dry = ctx.squares(p.id, 'o');
            for (let k = 3 + (i % 4); k < dry.length; k += 9) { const q = dry[k]; ctx.dec(['floor_stain', 'psx_tin_can_mp_1_rusty_1', 'floor_drain', 'floor_stain', 'floor_stain', 'psx_nails_1_rusty', 'floor_stain', 'floor_stain'][(k + i) % 8], p.id, q[0], q[1]); }
            const tip = nth(ctx.corners(p.id), 1 + (i % 3)); if (tip && ctx.free(p.id, tip[0], tip[1]) && i % 2 === 0) ctx.P(i % 4 ? 'traffic_barrel' : 'cardboard_boxes', p.id, tip[0], tip[1]);
        });
        /* THE GRIME PASS (mondo 11-16): rubbish washed into the bends and dead ends, cobwebs in the corners, a valve by the pumps */
        const RUB = ['garbage_bags', 'garbage_bag', 'metal_trash_can', 'psx_metal_barrel_mp_1', 'psx_wooden_crate_3', 'garbage_bag', 'psx_metal_barrel_mp_3'];
        ctx.plots.forEach((p, i) => { const cs = ctx.corners(p.id);
            for (let k = 2 + (i % 3); k < cs.length; k += 4) { const q = cs[k]; if (ctx.free(p.id, q[0], q[1])) ctx.dec(RUB[(k + i) % RUB.length], p.id, q[0], q[1]); }
            for (let k = 1; k < cs.length; k += 5) { const q = cs[k]; ctx.dec(k % 2 ? 'psx_cobweb_1' : 'psx_cobweb_2', p.id, q[0], q[1]); } });
        ['P04-00', 'P03-00'].forEach(id => { const q = nth(ctx.walled(id), 2); if (q && ctx.free(id, q[0], q[1])) ctx.P('gate_valve', id, q[0], q[1]); });
        ctx.grime('blood', 'P05-03', 4, 11, 1.3);
        /* a blocker on the k-th free square of a list, decor on the k-th square (THE MODEL LIST PASS helpers) */
        const putP = (key, id, list, k, o) => { for (let i = Math.max(0, Math.min(list.length - 1, k)); i < list.length; i++) { const q = list[i]; if (ctx.free(id, q[0], q[1])) { ctx.P(key, id, q[0], q[1], o); return true; } } return false; };
        const putD = (key, id, list, k) => { const q = nth(list, k); if (q) ctx.dec(key, id, q[0], q[1]); };
        /* THE MODEL LIST PASS (mondo 11-16: "look at the model list right now to see what else they could add"): MODEL_LIST.md searched for
           sewer, pump, pipe, drain, rubbish, body. THE PUMP ROOM: a centrifugal pump, the gauge board, a utility box, a valve stand.
           THE PUMPING STATION: a chain hoist and a lever. THE JUNCTION: a dumpster, tyres, cones, a mop bucket. THE OUTFALL: what the
           water brought down (a body, parts, a fish's bones). Litter on every walk; round drains; pale mushrooms in the dead ends. */
        putP('centrifugal_pump', 'P04-00', ctx.inner('P04-00'), 1); putP('gauge_board', 'P04-00', ctx.walled('P04-00'), 5, { face: 180 }); putP('utility_box', 'P04-00', ctx.walled('P04-00'), 8); putP('psx_pipe_valve_holder_large_1', 'P04-00', ctx.walled('P04-00'), 11);
        putP('chain_hoist', 'P03-00', ctx.walled('P03-00'), 5); putP('pd_lever', 'P03-00', ctx.walled('P03-00'), 7);
        putP('dumpster', 'P02-02', ctx.walled('P02-02'), 6); putP('tire_stack', 'P02-02', ctx.walled('P02-02'), 9); putD('traffic_cone', 'P02-02', ctx.inner('P02-02'), 5); putD('traffic_cone', 'P02-02', ctx.inner('P02-02'), 9); putD('mop_bucket', 'P02-02', ctx.walled('P02-02'), 12);
        { const w = ctx.walled('P05-03'); putD('hw_body', 'P05-03', w, 7); putD('hw_part_3', 'P05-03', w, 9); putD('hw_part', 'P05-03', w, 12); putD('psx_fish_skeleton_mp_1', 'P05-03', w, 3); }
        const LITTER = ['psx_glass_bottle_1', 'psx_tin_can_mp_1_rusty', 'psx_brick_1_1', 'psx_syringe_mp_1', 'psx_jerrycan_1', 'psx_tin_can_mp_1_rusty', 'psx_canned_food_mp_5_rusty', 'psx_glass_bottle_2'];   /* low-poly pack pieces only: the Meshy litter (newspaper bundles, round drains, paper) cost 6 to 10 thousand triangles a piece (pass 4's count) */
        ctx.plots.forEach((p, i) => { const dry = ctx.squares(p.id, 'o'); for (let k = 5 + (i % 5); k < dry.length; k += 8) ctx.dec(LITTER[(k + i) % LITTER.length], p.id, dry[k][0], dry[k][1]);
            const cs = ctx.corners(p.id), m = nth(cs, cs.length - 1 - (i % 2)); if (m && i % 3 === 0) ctx.dec('mushroom2', p.id, m[0], m[1]); });
        /* the rooms */
        const pr = ctx.inner('P04-00'); { const q = nth(pr, Math.floor(pr.length / 2)); if (q) ctx.P('boiler', 'P04-00', q[0], q[1]); }
        { const w = ctx.walled('P02-02'); [2, Math.floor(w.length / 2), w.length - 3].forEach(k => { const q = nth(w, k); if (q && ctx.free('P02-02', q[0], q[1])) ctx.P('cave_torch', 'P02-02', q[0], q[1]); }); }   // the hall's own fires
        const jn = ctx.inner('P02-02'); { const q = nth(jn, 0); if (q) ctx.P('brazier', 'P02-02', q[0], q[1]); }
        ['P03-00', 'P05-02', 'P05-03'].forEach(id => { const w = ctx.walled(id), q = nth(w, 1); if (q) ctx.P('traffic_barrel', id, q[0], q[1]); const r = nth(ctx.walled(id), 4); if (r) ctx.dec('wet_floor_sign', id, r[0], r[1]); });
        ctx.squares('P05-00', 'f').filter(q => q[1] <= 5).slice(0, 2).forEach(q => ctx.dec('drain_grate', 'P05-00', q[0], q[1]));
        /* ── PASS 1 (the district thread): THE WALLS. Per plot: a lamp every four squares of wall or so (one in five is dead), pilasters, stains,
           outlets; a culvert mouth where a stream comes out of the wall or a walk stops at one. Rooms wear the cold lamp, culverts the sodium. ── */
        const ROOMS = { 'P04-00': COLD, 'P03-00': COLD, 'P05-00': COLD, 'P04-01': COLD, 'P02-02': SODIUM, 'P05-03': COLD };
        const FACE = { n: 180, s: 0, w: 90, e: 270 };   // a wall prop's face: its front looks off the wall
        ctx.plots.forEach((p, i) => { const K = wallKit(ctx, p.id), rnd = dice(1009 * (i + 3)), lamps = [], pil = [], tall = K.H > 6;
            const far = (list, f, m) => list.every(g => Math.hypot(g.lx - f.lx, g.ly - f.ly) >= m);
            const dry = K.faces.filter(f => f.c !== 'w' && f.c !== 'j' && f.c !== 'b');
            /* lamps first: bends and room walls, spread out */
            dry.forEach(f => { if (far(lamps, f, 3.3) && (f.lx + 2 * f.ly + i) % 2 === 0) { lamps.push(f); const dead = rnd() < 0.2; f.dead = dead; K.lamp(f, (p.id === 'P04-02' && lamps.length === 1) ? RED : (ROOMS[p.id] || SODIUM), dead, tall ? 3.0 : 0); } });
            dry.forEach(f => { if (lamps.includes(f)) return;
                if ((f.lx + f.ly + i) % 3 === 0 && far(pil, f, 2) && far(lamps, f, 1.5)) { pil.push(f); K.pilaster(f); if (tall) K.box(f, 0, 3.32, 0.16, 0.95, ctx.r2(K.H - 3.3), 0.34, { key: 'bricks_2', tint: 0x8a8274, gain: 1.15, top: false, uv: 3.5 }); return; }
                const t = rnd(); if (t < 0.34) K.streak(f, rnd); else if (t < 0.42) K.outlet(f, rnd); });
            /* PASS 3, THE PLATES: an enamel plate beside the first two lit lamps of a plot: the plot's own name (the plan's), and a plain warning where one is due */
            { const NAME = p.name.toUpperCase(), WARN = { 'P04-01': 'DANGER · DEEP WATER', 'P04-00': 'AUTHORISED STAFF ONLY', 'P02-01': 'MIND THE DROP', 'P05-01': 'MIND THE DROP', 'P05-02': 'MIND THE DROP', 'P04-02': 'HATCH · KEEP CLEAR', 'P05-03': 'NO SWIMMING', 'P03-00': 'WAY OUT', 'P02-02': 'KEEP TO THE WALKS' }[p.id];
              const plate = (f, words, fg, bg) => { const w = ctx.r2(Math.max(1.1, words.length * 0.155)), key = 'txt:' + words + '|' + fg + '|' + bg + '|' + ctx.r2(w / 0.36) + '||stencil';
                  K.box(f, 0, 1.62, 0.07, w + 0.1, 0.46, 0.03, { tint: IRON }); K.quad(f, 0, 1.67, 0.1, w, 0.36, { key, uv: 'fit', kind: 'wall', glow: 0.35 }); };
              const lit = lamps.filter(f => !f.dead), near = (f, k) => dry.find(g => g.d === f.d && !lamps.includes(g) && !pil.includes(g) && Math.abs(g.lx - f.lx) + Math.abs(g.ly - f.ly) === 1 && !g.used);
              let n = 0; for (const f of lit) { const g = near(f); if (!g) continue; g.used = true; if (n === 0) plate(g, NAME, '#e8e4d4', '#1c3a2a'); else if (WARN) plate(g, WARN, '#141414', '#d8b020'); n++; if (n >= (WARN ? 2 : 1)) break; } }
            /* THE MOUTHS: a stream's end at a wall = the pipe it comes out of; a walk's dead end = a dry one */
            for (let ly = 0; ly < ctx.N; ly++) for (let lx = 0; lx < ctx.N; lx++) { if (K.ch(lx, ly) !== 'w') continue;
                for (const d of 'nswe') { const v = DIRS[d], ex = p.sx + lx + v[0], ey = p.sy + ly + v[1]; if (ex < 0 || ey < 0 || ex >= ctx.W || ey >= ctx.H) continue;   /* the room's own wall: a way out's, never dressed here */
                    if (K.ch(lx + v[0], ly + v[1]) !== 'x' || K.ch(lx - v[0], ly - v[1]) !== 'w') continue;
                    /* only a single stream's end (dry or wall on both its sides), never a tank's edge */
                    const side = v[0] ? [[0, 1], [0, -1]] : [[1, 0], [-1, 0]]; if (side.some(q => K.ch(lx + q[0], ly + q[1]) === 'w')) continue;
                    const s = ctx.sq(p.id, lx, ly); ctx.dec('culvert_mouth', p.id, lx, ly, { x: ctx.r2(ctx.gcx(s[0]) + v[0] * 1.5), z: ctx.r2(ctx.gcz(s[1]) + v[1] * 1.5), face: FACE[d], noBlock: true }); } }
            /* the rooms' own pieces */
            if (p.id === 'P04-01') {   // THE CISTERN: a rail round the tank, open at the Plank's two ends
                const X = lx => ctx.gx(p.sx + lx), Z = ly => ctx.gz(p.sy + ly);
                K.rail(X(3), Z(3), X(6), Z(3)); K.rail(X(7), Z(3), X(10), Z(3)); K.rail(X(3), Z(9), X(6), Z(9)); K.rail(X(7), Z(9), X(10), Z(9)); K.rail(X(3), Z(3), X(3), Z(9)); K.rail(X(10), Z(3), X(10), Z(5)); K.rail(X(10), Z(8), X(10), Z(9));
                /* the depth staff on the south pier: a striped board, feet of water */
                for (let k = 0; k < 8; k++) K.parts.push({ s: 'box', p: [ctx.r2(X(2) + 1.75 - (ctx.gx(p.sx) + 21) + 0.95), ctx.r2(0.2 + k * 0.45), ctx.r2(Z(10) + 1.75 - (ctx.gz(p.sy) + 21))], size: [0.06, 0.45, 0.3], tint: k % 2 ? 0xd8d4c4 : 0xa02018 });
            }
            if (p.id === 'P05-00') { const X = lx => ctx.gx(p.sx + lx), Z = ly => ctx.gz(p.sy + ly); K.parts.push({ s: 'box', p: [0, 0, 0], size: [0.01, 0.01, 0.01], tint: IRON });
                /* THE INSPECTION GALLERY's rail along its drop (the gallery stands 1.6 m up): drawn on the gallery's own level */
                const lift = 1.6; [[X(8), Z(2), X(8), Z(6)], [X(8), Z(6), X(9), Z(6)], [X(10), Z(6), X(11), Z(6)]].forEach(q => { const len = Math.hypot(q[2] - q[0], q[3] - q[1]), hz = Math.abs(q[2] - q[0]) > 0.1, ox = ctx.gx(p.sx) + 21, oz = ctx.gz(p.sy) + 21;
                    for (const y of [0.55, 1.02]) K.parts.push({ s: 'box', p: [ctx.r2((q[0] + q[2]) / 2 - ox), lift + y, ctx.r2((q[1] + q[3]) / 2 - oz)], size: hz ? [ctx.r2(len), 0.06, 0.06] : [0.06, 0.06, ctx.r2(len)], tint: IRON });
                    for (let t = 0; t <= len + 0.01; t += 1.75) K.parts.push({ s: 'box', p: [ctx.r2(q[0] + (q[2] - q[0]) * t / len - ox), lift, ctx.r2(q[1] + (q[3] - q[1]) * t / len - oz)], size: [0.08, 1.08, 0.08], tint: IRON }); }); }
            if (p.id === 'P02-02') {   // THE JUNCTION, "where the big pipes meet": four mains come through the hall's walls high up, each over its own long stain
                const big = K.faces.filter(f => f.c === 'f' && ((f.d === 'w' && f.lx === 3) || (f.d === 'e' && f.lx === 9)) && (f.ly === 2 || f.ly === 8));
                big.forEach(f => { const yy = 4.6, v = DIRS[f.d], sq = ctx.sq(p.id, f.lx, f.ly);
                    ctx.props.push({ key: 'culvert_mouth', x: ctx.r2(ctx.gcx(sq[0]) + v[0] * 1.5), z: ctx.r2(ctx.gcz(sq[1]) + v[1] * 1.5), y: ctx.r2(p.base + yy), face: FACE[f.d], noBlock: true, scale: 1.25 });
                    K.box(f, 0, 0.3, 0.04, 1.3, yy - 0.2, 0.025, { key: 'bricks_2', tint: 0x1e2414, top: false }); });
            }
            if (p.id === 'P05-03') {   // THE OUTFALL SHAFT: two street grates far up in the roof, daylight in their bars
                [[-8.75, -6], [12.25, 5]].forEach(q => { const y = ctx.r2(K.H - 0.25); K.parts.push({ s: 'quad', flat: true, p: [q[0], 0.03, q[1]], size: [2.4, 1.7], key: 'urban:ConcreteStriped2c', tint: 0xcfe0f0, glow: 0.2 }, { s: 'quad', flat: true, p: [q[0], 0.022, q[1]], size: [3.4, 2.6], key: 'urban:ConcreteStriped2c', tint: 0xcfe0f0, glow: 0.08 });
                    K.parts.push({ s: 'box', p: [q[0], y - 0.02, q[1]], size: [2.2, 0.08, 1.5], tint: 0xcfe0f0, glow: 1, under: true });
                    for (let b = -0.9; b <= 0.91; b += 0.3) K.parts.push({ s: 'box', p: [q[0] + b, y - 0.06, q[1]], size: [0.09, 0.07, 1.6], tint: 0x0c0c0e, under: true });
                    K.parts.push({ s: 'box', p: [q[0], y - 0.1, q[1]], size: [2.6, 0.1, 1.9], tint: IRON, under: true, top: false }); });
            }
            /* ── PASS 2, THE ROOMS' INSIDES: drawn pieces of each room (plinths, risers, the Outfall's screen) ── */
            if (p.id === 'P04-00') {   // THE PUMP ROOM: a cast plinth under each machine, a riser from each up into the vault, a checker-plate walk to the desk
                const L = (lx, ly) => [ctx.r2(ctx.gcx(p.sx + lx) - (ctx.gx(p.sx) + 21)), ctx.r2(ctx.gcz(p.sy + ly) - (ctx.gz(p.sy) + 21))];
                [[5, 3], [7, 3], [8, 4]].forEach(q => { const c = L(q[0], q[1]); K.parts.push({ s: 'box', p: [c[0], 0, c[1]], size: [2.9, 0.09, 1.9], key: 'urban:ConcreteStriped2c', tint: 0x8a8680 });
                    K.parts.push({ s: 'cyl', p: [c[0] + 0.9, 0.09, c[1] - 0.75], r: 0.16, h: ctx.r2(K.H - 0.6), key: RUSTK, tint: 0x6a3f24, seg: 8, cap: false }); K.parts.push({ s: 'cyl', p: [c[0] + 0.9, 1.5, c[1] - 0.75], r: 0.23, h: 0.12, tint: IRON, seg: 8 }); });
                for (let lx = 3; lx <= 9; lx++) { const c = L(lx, 5); K.parts.push({ s: 'quad', flat: true, p: [c[0], 0.025, c[1] + 1.55], size: [3.5, 0.3], tint: 0xc8a018, key: 'urban:ConcreteStriped1e' }); }
            }
            if (p.id === 'P05-03') {   // THE OUTFALL: the screen, a rack of iron bars across the pool's foot that keeps what the city loses
                const ox = ctx.gx(p.sx) + 21, oz = ctx.gz(p.sy) + 21, x0 = ctx.gx(p.sx + 4) - ox, x1 = ctx.gx(p.sx + 9) - ox, z = ctx.r2(ctx.gz(p.sy + 9) - oz);
                for (let x = x0 + 0.2; x < x1; x += 0.42) K.parts.push({ s: 'box', p: [ctx.r2(x), -0.9, z], size: [0.07, 2.5, 0.07], tint: IRON });
                [-0.1, 0.8, 1.5].forEach(y => K.parts.push({ s: 'box', p: [ctx.r2((x0 + x1) / 2), y, z], size: [ctx.r2(x1 - x0), 0.1, 0.12], tint: IRON }));
                [x0, x1].forEach(x => K.parts.push({ s: 'box', p: [ctx.r2(x), -0.9, z], size: [0.3, 2.8, 0.3], key: 'urban:ConcreteStriped2c', tint: 0x8a8680 }));
            }
            if (p.id === 'P05-00') {   // THE INSPECTION GALLERY: a steel deck plate on the gallery, a lit window strip of gauges over the desk
                const ox = ctx.gx(p.sx) + 21, oz = ctx.gz(p.sy) + 21; K.parts.push({ s: 'quad', flat: true, p: [ctx.r2(ctx.gx(p.sx + 9.5) - ox), 1.63, ctx.r2(ctx.gz(p.sy + 4) - oz)], size: [10.2, 13.6], key: 'urban:MetalSubwayGrill2a', tint: 0x8a8e90 }); }
            K.done(); });
        /* ── PASS 2, THE ROOMS' INSIDES (the furniture; every piece is in the catalogue, MODEL_LIST.md). A wall piece hangs on a wall face
           (`wp`); a floor piece takes its square only when the square is free (`fp`), so a walk a square wide is never shut. ── */
        const wp = (key, id, lx, ly, d, o) => { const v = DIRS[d], s = ctx.sq(id, lx, ly), u = (o && o.u) || 0; const row = Object.assign({ key, x: ctx.r2(ctx.gcx(s[0]) + v[0] * 1.6 + (v[0] ? 0 : u)), z: ctx.r2(ctx.gcz(s[1]) + v[1] * 1.6 + (v[1] ? 0 : u)), face: FACE[d] }, o || {}); delete row.u; ctx.props.push(row); };
        const fp = (key, id, lx, ly, o) => { if (!ctx.free(id, lx, ly)) return false; ctx.P(key, id, lx, ly, o); return true; };
        const on = (key, id, lx, ly, dx, dz, o) => { const s = ctx.sq(id, lx, ly); ctx.props.push(Object.assign({ key, x: ctx.r2(ctx.gcx(s[0]) + dx), z: ctx.r2(ctx.gcz(s[1]) + dz), face: Math.round(ctx.rnd() * 360) }, o || {})); };
        /* THE PUMP ROOM: a second pump and a compressor on their plinths, the engineer's corner (desk, chair, lamp, phone, the logbook), lockers, a tool chest */
        fp('centrifugal_pump', 'P04-00', 7, 3, { face: 90 }); fp('air_compressor', 'P04-00', 8, 4); fp('tool_chest', 'P04-00', 4, 5); fp('gas_cylinder_rack', 'P04-00', 3, 4);
        if (fp('tanker_desk', 'P04-00', 9, 3, { face: 270, x: ctx.r2(ctx.gcx(ctx.sq('P04-00', 9, 3)[0]) + 1.2) })) { on('psx_chair_mp_1', 'P04-00', 9, 3, 0.1, 0.1, { face: 90 }); on('desk_lamp', 'P04-00', 9, 3, 1.25, -0.5, { y: 0.78 }); on('rotary_phone', 'P04-00', 9, 3, 1.2, 0.45, { y: 0.78 }); on('clipboard_flat', 'P04-00', 9, 3, 1.0, 0, { y: 0.78 }); on('psx_canned_food_mp_2', 'P04-00', 9, 3, 1.35, 0.15, { y: 0.78 }); }
        wp('locker', 'P04-00', 3, 2, 'w', { u: -0.9 }); wp('locker', 'P04-00', 3, 2, 'w', { u: 0 }); wp('locker', 'P04-00', 3, 2, 'w', { u: 0.9 }); wp('breaker_panel', 'P04-00', 8, 2, 'n'); wp('punch_clock', 'P04-00', 9, 2, 'n', { u: -0.6 }); wp('notice_board', 'P04-00', 9, 2, 'e'); wp('fire_extinguisher', 'P04-00', 9, 4, 'e', { u: 1.2 }); wp('exit_sign', 'P04-00', 3, 4, 'w');
        /* THE PUMPING STATION (the way up to the street; its door and the three squares in front of it stay clear): the crew's lockers and bench, a hook rail, an exit sign beside the door */
        wp('locker', 'P03-00', 4, 1, 'w', { u: -0.5 }); wp('locker', 'P03-00', 4, 1, 'w', { u: 0.5 }); wp('hook_rail_long', 'P03-00', 8, 1, 'n'); wp('exit_sign', 'P03-00', 8, 1, 'n', { u: -1.4 }); fp('locker_bench', 'P03-00', 8, 1, { face: 0 }); on('psx_flashlight_1', 'P03-00', 8, 1, 0.4, 0.3, { y: 0.5 }); wp('fire_extinguisher', 'P03-00', 4, 3, 'w'); wp('notice_board', 'P03-00', 4, 2, 'w');
        /* THE INSPECTION GALLERY: the watchman's post on the deck (desk, monitors, a filing cabinet, a cot, the coffee), the store under it */
        if (fp('tanker_desk', 'P05-00', 10, 3, { face: 270, x: ctx.r2(ctx.gcx(ctx.sq('P05-00', 10, 3)[0]) + 1.2) })) { on('psx_chair_mp_1', 'P05-00', 10, 3, 0.1, 0, { face: 90 }); on('psx_monitoring_screen_mp_1', 'P05-00', 10, 3, 1.3, -0.4, { y: 0.78, face: 270 }); on('psx_pc_keyboard_mp_1', 'P05-00', 10, 3, 1.0, -0.4, { y: 0.78, face: 270 }); on('psx_canned_food_mp_3', 'P05-00', 10, 3, 1.1, 0.5, { y: 0.78 }); on('psx_walkie_talkie_1', 'P05-00', 10, 3, 1.3, 0.3, { y: 0.78 }); }
        fp('filing_cabinet', 'P05-00', 10, 2, { face: 270 }); fp('cot', 'P05-00', 10, 5, { face: 0 }); wp('gauge_board', 'P05-00', 9, 2, 'n'); wp('security_camera', 'P05-00', 8, 2, 'n'); on('coffee_maker', 'P05-00', 10, 4, 1.2, 0.9, {}); on('psx_canned_food_mp_1', 'P05-00', 10, 5, -0.8, 1.2, {}); on('newspaper_bundles', 'P05-00', 9, 2, -0.9, -1.0, {});
        fp('metal_shelving', 'P05-00', 10, 8, { face: 270 }); on('psx_supply_crate_1', 'P05-00', 9, 8, 0.6, 0.9, {}); on('psx_wooden_crate_1', 'P05-00', 8, 8, -0.7, 0.9, {}); on('psx_metal_barrel_mp_2', 'P05-00', 8, 7, -1.1, 0.2, {});
        /* THE JUNCTION: the rest stop by the Healing Zone (two cots, a drip stand, dressings), stores stacked in the north-east corner, valves at the pool, two benches */
        fp('cot', 'P02-02', 3, 8, { face: 0 }); on('psx_old_mattress_mp_1', 'P02-02', 3, 7, 0, 0.2, { noBlock: true }); fp('iv_stand', 'P02-02', 5, 8); on('psx_bandage_mp_1', 'P02-02', 3, 9, 0.9, -0.8, {}); on('psx_pills_bottle_1', 'P02-02', 3, 9, 1.2, -0.3, {}); on('psx_healing_potion_mp_1', 'P02-02', 3, 9, 0.6, -1.1, {}); on('hw_candles', 'P02-02', 3, 9, -1.0, 1.0, { noLight: true });
        fp('psx_supply_crate_1', 'P02-02', 9, 1); fp('psx_wooden_crate_1', 'P02-02', 9, 2); on('psx_metal_barrel_mp_2', 'P02-02', 8, 1, 0.9, -1.0, {}); on('meshy_burlap_sack', 'P02-02', 8, 1, 0.2, -0.9, {}); on('hand_truck', 'P02-02', 8, 2, 0.8, 0.6, {});
        fp('gate_valve', 'P02-02', 4, 5); fp('gate_valve', 'P02-02', 8, 5); fp('metro_bench', 'P02-02', 3, 2, { face: 90 }); fp('metro_bench', 'P02-02', 9, 7, { face: 270 }); wp('notice_board', 'P02-02', 9, 3, 'e'); wp('psx_electrical_outlet_1', 'P02-02', 3, 3, 'w', { y: 1.2 });
        /* THE CISTERN: life rings on the rail, a boat on the tank, the sluice gear at the inflow, a net on the south wall */
        { const b = ctx.plot['P04-01'].base, s = ctx.sq('P04-01', 4, 4); ctx.props.push({ key: 'rowboat', x: ctx.r2(ctx.gcx(s[0]) + 0.6), z: ctx.gcz(s[1]), y: ctx.r2(b - 0.5), face: 100, noBlock: true });
          [[4, 3, 0.2, -1.7], [8, 9, -0.4, 0.05]].forEach(q => { const t = ctx.sq('P04-01', q[0], q[1]); ctx.props.push({ key: 'beach_life_ring', x: ctx.r2(ctx.gcx(t[0]) + q[2]), z: ctx.r2(ctx.gcz(t[1]) + q[3] - (q[1] === 9 ? 1.75 : 0) + (q[1] === 9 ? 3.5 : 0)), y: ctx.r2(b + 0.62) }); }); }
        wp('fishing_net_wall', 'P04-01', 4, 10, 's'); wp('gauge_board', 'P04-01', 8, 2, 'n'); on('meshy_rope', 'P04-01', 2, 6, -0.9, 0.4, {}); on('wooden_bucket', 'P04-01', 2, 5, -0.9, -0.6, {});
        /* THE OUTFALL: what the screen caught (in the pool, north of the bars), a full skip of what was raked out, a rake's worth of junk on the south walk */
        { const pool = [['traffic_cone', 5, 8, 0.4], ['psx_metal_barrel_mp_1', 6, 8, -0.3], ['garbage_bag', 7, 8, 0.7], ['tire_stack', 8, 8, -0.2], ['psx_wooden_crate_2', 4, 8, 0.3], ['garbage_bags', 6, 7, 0.9], ['psx_toilet_mp_1', 5, 7, -0.6]];
          pool.forEach(q => { const t = ctx.sq('P05-03', q[1], q[2]); ctx.props.push({ key: q[0], x: ctx.r2(ctx.gcx(t[0]) + q[3]), z: ctx.r2(ctx.gcz(t[1]) + 0.9), face: Math.round(ctx.rnd() * 360), noBlock: true }); }); }
        fp('ind_skip_full', 'P05-03', 9, 10); on('psx_old_mattress_mp_1', 'P05-03', 5, 10, 0.3, 0.7, {}); on('psx_car_battery_1', 'P05-03', 6, 10, 0.5, 0.9, {}); on('psx_underwear_mp_1', 'P05-03', 7, 10, -0.4, 0.8, {}); on('broom', 'P05-03', 8, 10, 1.0, 1.1, {}); on('hw_shovel', 'P05-03', 4, 10, 0.2, 1.2, {}); wp('hook_rail', 'P05-03', 4, 10, 's'); wp('gauge_board', 'P05-03', 3, 0, 'n');
        /* ── PASS 3, THE DRESSING. A SCENE in one bend of each culvert plot (nothing in it blocks: `noBlock`), graffiti, chains, vents, and what lives down here.
           MODEL_LIST.md was read whole for this (sections 6 to 13); the shortlist is in areas-complexes.md "THE SEWERS, THE ZONE KIT". ── */
        const NB = { noBlock: true };
        const scene = (id, k, items) => { const cs = ctx.corners(id), q = nth(cs, Math.min(cs.length - 1, k)); if (!q) return null; items.forEach(it => on(it[0], id, q[0], q[1], it[1], it[2], Object.assign({}, NB, it[3] || {}))); return q; };
        scene('P02-00', 3, [['psx_old_mattress_mp_1', 0.2, 0.3], ['psx_pillow_mp_1', -0.5, 0.6, { y: 0.2 }], ['psx_canned_food_mp_5_rusty', 0.9, -0.6], ['psx_glass_bottle_2', 1.0, 0.2], ['meshy_burlap_sack', -0.9, -0.7], ['psx_lighter_mp_1', 0.6, 0.9], ['psx_cigs_packet_1', 0.3, 1.0]]);                       // somebody sleeps here
        scene('P02-01', 4, [['meshy_sandbags', 0.5, 0.3], ['meshy_sandbags', -0.6, -0.2, { face: 80 }], ['meshy_sandbags', 0.1, -1.0, { face: 10 }], ['traffic_cone', 1.2, -0.9], ['wet_floor_sign', -1.1, 0.9], ['broom', 1.2, 0.9]]);                                                                                             // the flood works
        scene('P03-01', 2, [['hw_body_2', 0.2, 0.2], ['hw_part_4', 0.9, -0.5], ['hw_part_6', -0.8, 0.7], ['skull', 1.0, 0.8], ['hw_part_5', -0.9, -0.8], ['hw_part_7', 0.3, -1.1], ['psx_cobweb_4', -1.2, -1.2]]);                                                                                                        // bones
        scene('P05-01', 3, [['welding_cart', 0.3, 0.2], ['gas_cylinder_rack', -0.9, -0.6], ['psx_hand_saw_1', 1.0, 0.9], ['psx_screwdriver_mp_1', 0.8, -0.9], ['cinder_block', -0.3, 1.1], ['psx_pipe_1_short', 1.2, -0.2]]);                                                                                                        // a job left half done
        scene('P00-02', 4, [['psx_toilet_mp_1_1', 0.2, 0.1], ['tire_stack', -0.9, -0.6], ['tube_tv', 0.9, -0.8], ['microwave', -0.6, 0.9], ['psx_tv_mp_1', 1.0, 0.7], ['garbage_bags', -0.1, -1.1]]);                                                                                                                                // what the storm brought in
        scene('P01-02', 5, [['mushroom2', 0.2, 0.2], ['mushroom', -0.7, 0.6], ['mushroom2', 0.9, -0.6, { scale: 0.7 }], ['meshy_frog', -0.3, -0.9, { scale: 2.2 }], ['fern', -1.0, -0.4, { scale: 0.6 }], ['psx_cobweb_5', 1.2, 1.2]]);                                                // it grows where the wall weeps
        scene('P03-02', 3, [['psx_supply_crate_1_2', 0.3, 0.2], ['psx_supply_crate_1_empty', -0.9, -0.3], ['psx_ammo_box_mp_1', 0.4, 1.1], ['psx_jerrycan_1_1', 1.1, -0.7], ['psx_cash_1', -0.6, 0.9], ['psx_padlock_1', 0.9, 0.6], ['psx_walkie_talkie_2', -0.2, -1.0]]);                                                    // somebody's stash
        scene('P04-02', 2, [['psxg_rock_1', 0.2, 0.2], ['psxg_rock_3', -0.9, 0.5], ['psx_brick_1', 0.9, -0.7], ['psx_brick_1_2', 0.5, 0.9], ['psx_brick_1_1', -0.4, -0.9], ['cinder_block', 1.1, 0.4], ['psx_brick_1_3', -1.0, -0.3]]);                                                                                          // a fall of brick
        { const q = scene('P05-02', 3, [['psx_cobweb_1', -1.2, -1.2], ['psx_cobweb_2', 1.2, 1.1], ['psx_fish_skeleton_mp_1', 0.4, 0.3], ['lobster_traps', -0.5, 0.2], ['beach_cooler', 0.9, -0.7]]);                                                                                                                              // under the quay: the bats' roost
          if (q) { const sq = ctx.sq('P05-02', q[0], q[1]), b = ctx.plot['P05-02'].base; [['bat_black', 0.3, 0.2, 3.3], ['bat_brown', -0.8, 0.6, 3.6], ['bat_grey', 0.9, -0.7, 3.1], ['bat_black', -0.3, -1.0, 3.8], ['bat_brown', 1.1, 0.9, 3.5]].forEach(a => ctx.props.push({ key: a[0], x: ctx.r2(ctx.gcx(sq[0]) + a[1]), z: ctx.r2(ctx.gcz(sq[1]) + a[2]), y: ctx.r2(b + a[3]), face: Math.round(ctx.rnd() * 360) })); } }
        /* bats high in the three tall halls, an eel in the Cistern, crabs and a brown fish at the Outfall, a cat at the Junction's rest stop, moths at a lamp */
        [['P02-02', 4, 2, 9.5], ['P02-02', 8, 6, 10.2], ['P04-01', 5, 6, 9.0], ['P05-03', 6, 4, 9.8], ['P05-03', 5, 7, 8.6]].forEach((a, i) => { const s = ctx.sq(a[0], a[1], a[2]); ctx.props.push({ key: ['bat_black', 'bat_brown', 'bat_grey'][i % 3], x: ctx.gcx(s[0]), z: ctx.gcz(s[1]), y: ctx.r2(ctx.plot[a[0]].base + a[3]), face: i * 70 }); });
        { const s = ctx.sq('P04-01', 8, 6); ctx.props.push({ key: 'ocean_eel', x: ctx.gcx(s[0]), z: ctx.gcz(s[1]) }); const t = ctx.sq('P05-03', 6, 3); ctx.props.push({ key: 'ocean_brown_fish', x: ctx.gcx(t[0]), z: ctx.gcz(t[1]) }); }
        on('ocean_crab', 'P05-03', 3, 6, 0.6, 0.4, NB); on('ocean_crab', 'P05-03', 9, 3, -0.5, 0.2, NB); on('cat', 'P02-02', 3, 9, 0.9, 0.4, NB); on('meshy_frog', 'P04-01', 2, 8, 0.9, 0.3, { noBlock: true, scale: 2 });
        /* graffiti on eight culvert walls (the game's own tags), chains and a vent here and there, hazard tape at the three drops */
        [['P02-01', 3, 6, 'w'], ['P03-01', 2, 3, 'w'], ['P01-02', 2, 2, 'n'], ['P03-02', 10, 5, 'e'], ['P04-02', 8, 1, 'e'], ['P00-02', 1, 1, 'n'], ['P05-01', 1, 2, 'n'], ['P02-00', 2, 2, 'n']].forEach(a => { const v = DIRS[a[3]], x = ctx.plot[a[0]].sx + a[1] + v[0], y = ctx.plot[a[0]].sy + a[2] + v[1];
            if (ctx.open(ctx.plot[a[0]].sx + a[1], ctx.plot[a[0]].sy + a[2]) && !ctx.open(x, y)) wp('graffiti_wall', a[0], a[1], a[2], a[3], { y: 0.5 }); });
        ctx.plots.forEach((p, i) => { const w = ctx.corners(p.id); const q = nth(w, 1 + (i % 4)); if (!q) return; const d = 'nswe'.split('').find(d => !ctx.open(p.sx + q[0] + DIRS[d][0], p.sy + q[1] + DIRS[d][1])); if (!d) return;
            wp(['trap_chain_draped', 'vent_grille', 'wall_chains', 'utility_box', 'psx_vent_2'][i % 5], p.id, q[0], q[1], d, i % 5 === 3 ? { y: 1.1 } : {}); });
        /* ── PASS 4, THE ATMOSPHERE (no tool change: the room's air and fog are the shell's). Light that moves and air that moves:
           flickering tubes in the three staffed rooms, a swaying lantern at a bend of every culvert plot (its glow, no cast light), mist at
           the foot of the three falls, steam off the boiler and three leaking mains, red call points at the drops, candles at two scenes. ── */
        const hang = (key, id, lx, ly, h, o) => { const s = ctx.sq(id, lx, ly); ctx.props.push(Object.assign({ key, x: ctx.gcx(s[0]), z: ctx.gcz(s[1]), ceil: true, y: ctx.r2(ctx.plot[id].base + h), noLight: true }, o || {})); };
        hang('flicker_tube', 'P04-00', 5, 4, 3.5); hang('flicker_tube', 'P04-00', 8, 3, 3.5, { face: 90 }); hang('flicker_tube', 'P03-00', 6, 2, 3.4); hang('flicker_tube', 'P05-00', 9, 4, 4.9); hang('flicker_tube', 'P05-00', 9, 7, 3.2, { face: 90 });
        ['P02-00', 'P02-01', 'P03-01', 'P05-01', 'P00-02', 'P01-02', 'P03-02', 'P04-02', 'P05-02'].forEach((id, i) => { const cs = ctx.squares(id, 'o'), q = nth(cs, Math.floor(cs.length * (0.3 + 0.07 * (i % 5)))); if (q) hang('ship_lantern', id, q[0], q[1], 2.9); const r = nth(cs, Math.floor(cs.length * 0.8)); if (r && i % 2 === 0) hang('ship_lantern', id, r[0], r[1], 2.9); });
        const steam = (id, lx, ly, rise, dx, dz, h) => { const s = ctx.sq(id, lx, ly); ctx.props.push({ key: 'chimney_smoke', x: ctx.r2(ctx.gcx(s[0]) + (dx || 0)), z: ctx.r2(ctx.gcz(s[1]) + (dz || 0)), y: h ? ctx.r2(ctx.plot[id].base + h) : 0.1, rise }); };
        steam('P02-02', 6, 1, 3.5); steam('P04-01', 10, 6, 3.5); steam('P05-03', 6, 1, 4);                                     // the falls' mist
        { const pr = ctx.sq('P04-00', 5, 3); steam('P04-00', 6, 4, 3, 0, 0, 1.6); steam('P03-01', 3, 1, 2.5, 0, -1.4, 2.4); steam('P01-02', 4, 3, 2.5, 0, -1.4, 2.4); steam('P03-02', 4, 3, 2.5, 0, -1.4, 2.4); }
        [['P04-02', 5, 9], ['P02-01', 5, 10], ['P05-02', 5, 10]].forEach(a => wp('strobe_lamp', a[0], a[1], a[2], 'w', { ceil: true, y: ctx.r2(ctx.plot[a[0]].base + 2.6), noBlock: true }));   /* THE MODEL PASS: the red beacon model in place of the call buttons that stood in for it */
        { const a = ctx.corners('P03-01'), q = nth(a, 2); if (q) on('candle_ring', 'P03-01', q[0], q[1], -0.6, -0.4, { noBlock: true, noLight: true }); const b = ctx.corners('P02-00'), r = nth(b, 3); if (r) on('railway_lantern', 'P02-00', r[0], r[1], -0.2, -0.9, { noBlock: true }); }
        /* six puddles under the weeping walls (the room draws 80 floor decals; the tool keeps to 60, so only a few here) */
        [['P02-01', 3, 4], ['P03-01', 6, 2], ['P01-02', 5, 3], ['P03-02', 2, 4], ['P04-02', 6, 3], ['P05-01', 3, 3]].forEach(a => { if (ctx.open(ctx.plot[a[0]].sx + a[1], ctx.plot[a[0]].sy + a[2])) ctx.grime('puddle', a[0], a[1], a[2], 1.2); });
        /* ── THE MODEL PASS (mondo 11-16, docs/plans/WISHLIST_MODELS_ADDED.md read whole). Asked for by this district and placed: `cage_lamp` (every lamp, above),
           `rat` (under the dead lamps + at the rubbish), `valve_wheel`, `manhole_ladder`. From the other lists, because they fit: `strobe_lamp`, `waste_pipe`,
           `hazmat_suit`, `moss_clump`, `spider`, `sleeping_bag` + `backpack` + `kettle`, `wooden_ladder`, `oars` + `rope_coils` + `mooring_bollard`, `lit_candle`,
           `wheelbarrow` + `pickaxe`. Nothing here shuts a walk: a blocker stands only in a hall or a room, the rest is `noBlock`. ── */
        /* the model is a closed concrete shaft with its rungs inside: standing on the floor it read as a drum, so it hangs from the vault as the shaft's foot (2.2 m clear under it) */
        [['P05-02', 6, 3], ['P02-02', 9, 9], ['P02-00', 3, 2]].forEach(a => { const s = ctx.sq(a[0], a[1], a[2]); ctx.props.push({ key: 'manhole_ladder', x: ctx.gcx(s[0]), z: ctx.gcz(s[1]), y: ctx.r2(ctx.plot[a[0]].base + 2.2), noBlock: true }); });                       // the shafts up: under the quay, the Junction's corner, the Precinct Drain's head
        fp('waste_pipe', 'P02-02', 9, 5, { face: 90 }); fp('waste_pipe', 'P05-00', 10, 7); { const s = ctx.sq('P00-02', 3, 2); ctx.props.push({ key: 'waste_pipe', x: ctx.gcx(s[0]), z: ctx.gcz(s[1]), face: 20, noBlock: true }); }   // spare pipe: two in the halls, one dumped in the Storm Drain's channel
        on('valve_wheel', 'P04-01', 10, 3, 1.2, 0.2, { face: 270, noBlock: true }); on('valve_wheel', 'P04-01', 2, 4, -1.2, 0, { face: 90, noBlock: true }); on('valve_wheel', 'P05-03', 3, 10, -1.2, 0.6, { face: 90, noBlock: true }); fp('valve_wheel', 'P04-00', 6, 2, { face: 180 });
        [['P02-01', 3, 4, 'w'], ['P03-02', 2, 4, 'n'], ['P01-02', 5, 3, 'n'], ['P05-01', 3, 3, 'n']].forEach(a => { const v = DIRS[a[3]]; if (ctx.open(ctx.plot[a[0]].sx + a[1], ctx.plot[a[0]].sy + a[2]) && !ctx.open(ctx.plot[a[0]].sx + a[1] + v[0], ctx.plot[a[0]].sy + a[2] + v[1])) on('valve_wheel', a[0], a[1], a[2], v[0] * 1.35, v[1] * 1.35, { face: FACE[a[3]], noBlock: true }); });
        wp('hazmat_suit', 'P04-00', 3, 3, 'w', { noBlock: true }); wp('hazmat_suit', 'P03-00', 4, 3, 'w', { u: 1.1, noBlock: true });
        [['P02-01', 3, 4], ['P03-01', 6, 2], ['P01-02', 5, 3], ['P03-02', 2, 4], ['P04-02', 6, 3], ['P05-01', 3, 3], ['P00-02', 1, 1], ['P02-00', 2, 4]].forEach((a, i) => { if (ctx.open(ctx.plot[a[0]].sx + a[1], ctx.plot[a[0]].sy + a[2])) on('moss_clump', a[0], a[1], a[2], i % 2 ? 1.2 : -1.2, i % 3 ? -1.1 : 1.1, NB); });
        { const rub = [['P00-02', 4], ['P02-00', 3], ['P05-01', 3], ['P03-02', 3]]; rub.forEach((a, i) => { const q = nth(ctx.corners(a[0]), a[1]); if (q) { on('rat', a[0], q[0], q[1], 1.3, i % 2 ? 0.9 : -0.9, NB); if (i < 2) on('rat', a[0], q[0], q[1], -1.2, 1.2, NB); } });
          [['rat', 4, 10, 1.0, 1.3], ['rat', 7, 10, 0.6, 1.4], ['rat', 9, 9, 1.2, 0.2]].forEach(a => on(a[0], 'P05-03', a[1], a[2], a[3], a[4], NB));
          const web = nth(ctx.corners('P05-02'), 3); if (web) on('spider', 'P05-02', web[0], web[1], -1.0, -0.9, NB); const bn = nth(ctx.corners('P03-01'), 2); if (bn) { on('spider', 'P03-01', bn[0], bn[1], 1.2, 1.2, NB); on('lit_candle', 'P03-01', bn[0], bn[1], 0.6, 1.2, NB); }
          const sl = nth(ctx.corners('P02-00'), 3); if (sl) { on('sleeping_bag', 'P02-00', sl[0], sl[1], 0.2, 0.3, Object.assign({ y: 0.2 }, NB)); on('backpack', 'P02-00', sl[0], sl[1], -1.1, 0.1, NB); on('kettle', 'P02-00', sl[0], sl[1], 1.1, 1.0, NB); on('lit_candle', 'P02-00', sl[0], sl[1], -1.0, 1.1, NB); }
          const jb = nth(ctx.corners('P05-01'), 3); if (jb) on('wooden_ladder', 'P05-01', jb[0], jb[1], -1.3, 0.4, NB); const br = nth(ctx.corners('P04-02'), 2); if (br) { on('wheelbarrow', 'P04-02', br[0], br[1], 1.0, 1.0, NB); on('pickaxe', 'P04-02', br[0], br[1], -0.2, 1.2, NB); } }
        on('mooring_bollard', 'P04-01', 4, 2, 0.4, 1.3, NB); on('rope_coils', 'P04-01', 5, 2, 0.2, 0.6, NB); on('oars', 'P04-01', 3, 2, 0.5, 0.2, NB);
        /* FOUR REAL LIGHTS (of the room's ten; decision on the board): a bulb on its flex over the Junction, the Pump Room, the Cistern's Plank and the Outfall */
        [['P02-02', 4, 6], ['P04-00', 6, 5], ['P04-01', 6, 2], ['P05-03', 6, 5]].forEach(q => { const s = ctx.sq(q[0], q[1], q[2]); ctx.props.push({ key: 'bare_bulb', x: ctx.gcx(s[0]), z: ctx.gcz(s[1]), ceil: true, y: ctx.r2(ctx.plot[q[0]].base + 3.7) }); });   /* a ceiling prop's y is its height over the room's level 0 */
    },
    people(ctx) {
        const O = ctx.O.sewers, stand = (race, id, k) => { const l = ctx.inner(id).concat(ctx.walled(id)), q = nth(l, k || 0); if (q) ctx.native(race, id, q[0], q[1], 180, ctx.sayOf(O, race)); };
        stand('ghoul', 'P03-00'); stand('gangster', 'P02-02', 3); stand('zombie', 'P05-03'); stand('conspiracy theorist', 'P04-01');
    },
};
