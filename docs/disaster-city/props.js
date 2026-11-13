/* DISASTER CITY, THE PROP PASS (2026-11-13, mondo: "cars on top of stuff, benches on top of fences, street signs half way inside buildings.
   Just needs way more attention to detail and care ... there is this green trash bin in the subway area that needs to go in the city. See
   what other assets/props are available"). Read by `node bake-disaster-city.js`; repo-only tooling, never loaded by the game.

   Three parts, all on the SHARED street dressing (a district file's own props are checked and reported, never moved):
   - kerbSign(): the kerb's street sign is a real road sign of the Roads pack (roads_g_sign_*), its plate turned to the traffic of the lane
     beside it. Was: a blank wooden country signpost.
   - dress(ctx): THE SET DRESSING from models already in the catalogue: the green subway bin (metro_bin) at the bus stops and the metro,
     utility boxes / electrical cabinets / fan units against walls, barrels, crates and boxes in the working districts, sandbags at the
     police cordon, manhole covers on the streets. One list per district (DRESS below).
   - check(ctx): THE PROP CHECK, last. Every prop's REAL footprint (SIZE: measured on the model files, not the catalogue's blocker) against
     every building, architecture part, fence, hedge, wall, stair, ladder, tree, lamp, sign pole and every other prop, and against the
     ground (a prop never straddles a step in the levels). A shared prop that clashes moves to the nearest clear spot of its own kind of
     ground (a thing that blocks keeps a square's middle, a thing that does not stays off it, a car stays on its street and only parks
     where the whole car fits); with no clear spot within reach it is left out and counted. The tool prints the tally.
   Notes: docs/notes/areas-complexes.md "DISASTER CITY, THE PROP PASS". */
'use strict';
const fs = require('fs'), path = require('path');
const D2R = Math.PI / 180;

/* THE REAL SIZES: half width (across) and half depth (along the prop's own +z) in metres, in the prop's own frame as the game draws it (the
   catalogue's `turn` applied), measured on the GLB at the catalogue's height / span. r = round. Keys not listed read the catalogue's rect / foot. */
const SIZE = {
    city_bench: { hw: 0.85, hd: 0.35 }, park_bench: { hw: 0.85, hd: 0.35 }, metro_bench: { hw: 1.0, hd: 0.25 },
    city_bin: { r: 0.24 }, metro_bin: { r: 0.38 }, dumpster: { hw: 1.2, hd: 0.66 }, traffic_barrel: { r: 0.41 }, traffic_cone: { r: 0.22 },
    psx_wooden_crate_1: { hw: 0.36, hd: 0.25 }, psx_wooden_crate_3: { hw: 0.54, hd: 0.54 }, psx_supply_crate_1: { hw: 0.33, hd: 0.2 }, psx_cardboard_box_1: { hw: 0.36, hd: 0.36 },
    item_police_barricade: { hw: 1.0, hd: 0.32 }, vending_machine: { hw: 0.51, hd: 0.3 }, bus_shelter: { hw: 0.62, hd: 1.9 },
    fire_hydrant: { r: 0.25 }, signpost: { hw: 0.68, hd: 0.57 }, utility_box: { hw: 0.32, hd: 0.26 }, ind_vent: { hw: 0.19, hd: 0.36 }, ind_panel: { hw: 0.23, hd: 0.36 },
    psx_metal_barrel_mp_0: { r: 0.35 }, psx_metal_barrel_mp_1: { r: 0.35 }, psx_metal_barrel_mp_2: { r: 0.35 }, psx_metal_barrel_mp_3: { r: 0.35 },
    meshy_sandbags: { hw: 1.0, hd: 0.42 }, angel_statue: { hw: 1.4, hd: 0.56 }, cardboard_boxes: { r: 0.45 }, palm_tree: { r: 0.3 }, hot_dog_stand: { r: 0.95 },
    public_phone: { hw: 0.29, hd: 0.28 }, power_pole: { r: 0.22 }, garbage_bags: { r: 0.5 }, garbage_bag: { r: 0.45 }, metal_trash_can: { r: 0.41 },
    play_slide: { hw: 0.58, hd: 1.7 }, play_swing: { hw: 1.58, hd: 0.9 }, play_sandbox: { hw: 1.0, hd: 1.0 },
    psx_planter_pot_mp_1_full: { r: 0.3 }, psx_potted_cactus_mp_1: { r: 0.25 }, telescope: { hw: 0.8, hd: 0.5 }, rowboat: { hw: 1.5, hd: 0.53 },
};
for (let i = 0; i < 15; i++) SIZE['roads_g_sign_' + String(i).padStart(3, '0')] = { r: 0.2 };
/* a thing that does nothing in a fight stands OFF its square's middle (mondo 11-13) */
const DECOR = /bench|_bin$|signpost|roads_g_sign|fire_hydrant|traffic_cone|cardboard|planter_pot|cactus|round_table|pool_umbrella|vending|utility_box|ind_vent|ind_panel|barrel|crate|sandbags|supply|public_phone|power_pole|garbage|trash_can|play_sandbox/;
const WALLED = /vending_machine|utility_box|ind_vent|ind_panel|public_phone/;                    // stands with its back to a wall
const FIXED = /^city_|babel_crane|lighthouse|fountain|^ind_container|^ind_silo|^ind_skip|street_drain|quarter_pipe|field_goal/;   // a landmark / a district's set piece / a flat decal: checked against nothing, never moved

let SRC = null; const catCache = {};
function cat(REPO, k) {
    if (catCache[k] !== undefined) return catCache[k];
    if (!SRC) SRC = fs.readFileSync(path.join(REPO, 'data.js'), 'utf8');
    const m = new RegExp('^\\s+' + k + ':\\s*\\{(.*)$', 'm').exec(SRC); let o = null;
    if (m) { const s = m[1], g = re => { const x = re.exec(s); return x ? parseFloat(x[1]) : null; }; o = { foot: g(/\bfoot:\s*([\d.]+)/), vehicle: /vehicle:\s*true/.test(s) };
        const rr = /rect:\s*\{\s*hw:\s*([\d.]+),\s*hd:\s*([\d.]+)/.exec(s); if (rr) o.rect = { hw: +rr[1], hd: +rr[2] }; }
    return (catCache[k] = o);
}
const rotP = (lx, lz, th) => [lx * Math.cos(th) + lz * Math.sin(th), -lx * Math.sin(th) + lz * Math.cos(th)];
const obb = (x, z, hw, hd, th) => [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]].map(q => { const p = rotP(q[0], q[1], th); return [x + p[0], z + p[1]]; });
const circ = (x, z, r) => { const a = []; for (let i = 0; i < 8; i++) a.push([x + r * Math.cos(i * Math.PI / 4 + Math.PI / 8), z + r * Math.sin(i * Math.PI / 4 + Math.PI / 8)]); return a; };
const bbOf = P => { let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; P.forEach(q => { if (q[0] < x0) x0 = q[0]; if (q[0] > x1) x1 = q[0]; if (q[1] < z0) z0 = q[1]; if (q[1] > z1) z1 = q[1]; }); return { x0, x1, z0, z1 }; };
function sat(A, B) {   // the overlap of two convex shapes, metres (0 = clear)
    let pen = 1e9;
    for (const P of [A, B]) for (let i = 0; i < P.length; i++) {
        const a = P[i], b = P[(i + 1) % P.length], nx = -(b[1] - a[1]), nz = b[0] - a[0], l = Math.hypot(nx, nz) || 1;
        let a0 = 1e9, a1 = -1e9, b0 = 1e9, b1 = -1e9;
        for (const q of A) { const d = (q[0] * nx + q[1] * nz) / l; if (d < a0) a0 = d; if (d > a1) a1 = d; }
        for (const q of B) { const d = (q[0] * nx + q[1] * nz) / l; if (d < b0) b0 = d; if (d > b1) b1 = d; }
        const o = Math.min(a1, b1) - Math.max(a0, b0); if (o <= 0) return 0; if (o < pen) pen = o;
    }
    return pen;
}
/* a prop's footprint at (x, z), grown by `pad` metres (the game: the group turns by PI - face) */
function foot(REPO, row, x, z, pad) {
    const s = SIZE[row.key], c = cat(REPO, row.key) || {}, th = Math.PI - (row.face || 0) * D2R, k = (row.h && /planter_pot|cactus/.test(row.key)) ? 1 : 1;
    if (s && s.r) return circ(x, z, s.r * k + pad);
    if (s) return obb(x, z, s.hw + pad, s.hd + pad, th);
    if (c.rect) return obb(x, z, c.rect.hw + pad, c.rect.hd + pad, th);
    return circ(x, z, Math.max(0.2, c.foot || 0.25) + pad);
}
/* a bucket grid over the room */
function Grid(cell) { const m = new Map(); const key = (i, j) => i * 100003 + j;
    return { add(o) { for (let i = Math.floor(o.bb.x0 / cell); i <= Math.floor(o.bb.x1 / cell); i++) for (let j = Math.floor(o.bb.z0 / cell); j <= Math.floor(o.bb.z1 / cell); j++) { const k = key(i, j); if (!m.has(k)) m.set(k, []); m.get(k).push(o); } },
        near(bb) { const out = new Set(); for (let i = Math.floor(bb.x0 / cell); i <= Math.floor(bb.x1 / cell); i++) for (let j = Math.floor(bb.z0 / cell); j <= Math.floor(bb.z1 / cell); j++) { const a = m.get(key(i, j)); if (a) a.forEach(o => out.add(o)); } return out; } };
}
/* every solid thing of the room that is not a prop: buildings, architecture parts that stand on the ground, fences, hedges, walls, stairs, ladders, trees, lamps, sign poles */
function solids(ctx) {
    const out = [], add = (type, id, poly) => out.push({ type, id, poly, bb: bbOf(poly) });
    ctx.features.forEach((f, i) => {
        if (f.k === 'texbuilding') add('building', f.id, obb(f.x, f.z, f.w / 2, f.d / 2, -(f.rot || 0) * D2R));
        else if (f.k === 'plateau') add((f.bld || f.h >= 5) ? 'building' : 'landing', f.id || 'plateau', obb(f.x, f.z, f.w / 2, f.d / 2, 0));
        else if (f.k === 'rail') { const dx = f.x1 - f.x0, dz = f.z1 - f.z0; add('fence', 'rail', obb((f.x0 + f.x1) / 2, (f.z0 + f.z1) / 2, Math.hypot(dx, dz) / 2, 0.12, -Math.atan2(dz, dx))); }
        else if (f.k === 'wall' && !f.ghost) { const dx = f.x1 - f.x0, dz = f.z1 - f.z0; add(f.key === 'leaves_3' ? 'hedge' : 'wall', 'wall', obb((f.x0 + f.x1) / 2, (f.z0 + f.z1) / 2, Math.hypot(dx, dz) / 2, (f.t || 0.3) / 2, -Math.atan2(dz, dx))); }
        else if (f.k === 'tree') add('tree', 'tree', circ(f.x, f.z, 0.35));
        else if (f.k === 'ramp') { const dx = f.x1 - f.x0, dz = f.z1 - f.z0; add('stairs', f.id || 'ramp', obb((f.x0 + f.x1) / 2, (f.z0 + f.z1) / 2, Math.hypot(dx, dz) / 2, (f.w || 2) / 2, -Math.atan2(dz, dx))); }
        else if (f.k === 'climb') add('ladder', 'climb', circ(f.x, f.z, 0.4));
        else if (f.k === 'arch') { const th = -(f.rot || 0) * D2R;
            (f.parts || []).forEach(p0 => { if (!p0 || !p0.s) return; let list = [p0];
                if (p0.ring && p0.ring.n > 0) { list = []; for (let i = 0; i < p0.ring.n; i++) { const a = ((p0.ring.a0 || 0) + (p0.ring.arc || 360) * i / (p0.ring.arc && p0.ring.arc < 360 ? Math.max(1, p0.ring.n - 1) : p0.ring.n)) * D2R, pp = p0.p || [0, 0, 0]; list.push(Object.assign({}, p0, { p: [pp[0] + Math.cos(a) * p0.ring.r, pp[1], pp[2] + Math.sin(a) * p0.ring.r], ry: (p0.ry || 0) + 90 - a / D2R, ring: null })); } }
                list.forEach(p1 => { const n = Math.max(1, Math.min(200, Math.round(p1.n || 1))), st = p1.step || [0, 0, 0], q = p1.p || [0, 0, 0];
                    for (let k = 0; k < n; k++) { const px = q[0] + st[0] * k, py = q[1] + st[1] * k, pz = q[2] + st[2] * k; if (py > 2.0) continue; const ry = -(p1.ry || 0) * D2R;
                        let hw, hd, h, poly = null;
                        if (p1.s === 'box') { if (p1.sides === false) continue; hw = p1.size[0] / 2; h = p1.size[1]; hd = p1.size[2] / 2; }
                        else if (p1.s === 'cyl') { if ((p1.arc && p1.arc < 360) || p1.ri) continue; hw = hd = Math.max(p1.r, p1.r2 || 0); h = p1.h; }
                        else if (p1.s === 'dome') { if (p1.arc && p1.arc < 360) continue; hw = p1.r; hd = p1.rz || p1.r; h = p1.h || p1.r; }
                        else if (p1.s === 'quad') { if (p1.flat || p1.kind === 'over') continue; hw = p1.size[0] / 2; hd = 0.08; h = p1.size[1];
                            if (p1.hole && py < 0.5) { const o = rotP(p1.hole[0], 0.75, ry), c = rotP(px + o[0], pz + o[1], th); add('doorway', f.id, obb(f.x + c[0], f.z + c[1], p1.hole[1] / 2 + 0.15, 0.75, th + ry)); } }   // the doorway's own ground: 1.5 m out from the hole, nothing stands in it
                        else if (p1.s === 'poly') { h = p1.h; poly = p1.pts.map(t => { const a = rotP(t[0], t[1], ry), b = rotP(px + a[0], pz + a[1], th); return [f.x + b[0], f.z + b[1]]; }); }
                        else continue;
                        if (py + h < 0.2) continue;   // paving, paint
                        if (!poly) { const c = rotP(px, pz, th); poly = obb(f.x + c[0], f.z + c[1], hw, hd, th + ry); }
                        add('arch', f.id, poly);
                    } }); });
        }
    });
    (ctx.lamps || []).forEach(l => add('lamp', 'lamp', circ(l.x, l.z, 0.16)));
    (ctx.busStops || []).forEach(b => (b.signs || []).forEach(s => add('pole', 'bus stop sign', circ(s.x, s.z, 0.12))));
    /* the traffic lights' poles: on the four kerb corners of a junction (three-renderer.js _HQ_SIGNAL.footOut) */
    (ctx.signals || []).forEach(s => [[1, 1], [-1, 1], [-1, -1], [1, -1]].forEach(c => add('pole', 'traffic light', circ(s.x + c[0] * 7.9, s.z + c[1] * 7.9, 0.3))));
    return out;
}

/* THE KERB'S SIGN: which road sign, and the way its plate looks (the file's plate faces its +x; the lane beside a kerb drives with the kerb on its right) */
const KERB_SIGNS = ['roads_g_sign_006', 'roads_g_sign_008', 'roads_g_sign_004', 'roads_g_sign_005', 'roads_g_sign_006', 'roads_g_sign_012', 'roads_g_sign_008', 'roads_g_sign_004'];   // parking, no parking, people crossing, no overtaking, the cycle lane
function kerbSign(sd, cx, cy, deadEnd) {
    const key = deadEnd ? 'roads_g_sign_001' : KERB_SIGNS[(Math.floor(cx / 12) * 3 + Math.floor(cy / 12) * 5 + (sd[0] > 0 || sd[1] > 0 ? 1 : 0)) % KERB_SIGNS.length];
    return { key, face: Math.round(((Math.atan2(sd[0], -sd[1]) / D2R) + 360) % 360), h: 2.4 };
}

/* THE SET DRESSING, a list per district: things that stand against a wall on a yard square (`n` a plot that has such a square) */
const DRESS = {
    R: ['ind_vent', 'barrels', 'crate', 'boxes'], C: ['utility_box', 'ind_panel', 'ind_vent'], F: ['utility_box', 'ind_vent', 'ind_panel'], U: ['utility_box', 'ind_panel'],
    H: ['utility_box', 'ind_vent'], E: ['ind_vent', 'crate', 'boxes', 'ind_panel'], I: ['barrels', 'crate', 'ind_vent', 'ind_panel', 'barrels', 'crates'], S: ['utility_box', 'ind_vent', 'crate'], B: ['ind_vent', 'utility_box', 'crate'],
};
function dress(ctx) {
    const { PLAN, props, cellAt, free, take, C, N, HALF, r3 } = ctx, n = { wall: 0, bins: 0, sandbags: 0, drains: 0, pots: 0, phones: 0, garbage: 0, poles: 0, play: 0 };
    const gc = c => -HALF + (c + 0.5) * C;
    const faceZ = (dx, dz) => Math.round((Math.atan2(dx, -dz) / D2R + 360) % 360);     // a +z front looking (dx, dz)
    const faceX = (dx, dz) => Math.round((Math.atan2(-dz, -dx) / D2R + 360) % 360);    // a +x front looking (dx, dz)
    /* the door pots at a size a person sees (the pack's pot is 23 cm): 0.55 m, a cactus at some doors of the warm districts */
    props.forEach((q, i) => { if (q.key !== 'psx_planter_pot_mp_1_full' || ctx.own.has(q) || q.h) return;
        const p = PLAN.plots.find(pl => pl.x === Math.floor((q.x + HALF) / (C * N)) && pl.y === Math.floor((q.z + HALF) / (C * N)));
        if (p && 'RBE'.indexOf(p.d) >= 0 && i % 3 === 0) { q.key = 'psx_potted_cactus_mp_1'; q.h = 0.8; } else q.h = 0.55; n.pots++; });
    /* a green subway bin at the road end of every bus shelter (the shelter runs along its kerb; its face is turned in check()) */
    props.slice().forEach(q => { if (q.key !== 'bus_shelter' || ctx.own.has(q)) return;
        const f = (q.face || 0), al = (f === 90 || f === 270) ? [0, 1] : [1, 0];       // the kerb rule's face: 90 / 270 = a north-south kerb
        props.push({ key: 'metro_bin', x: r3(q.x + al[0] * 2.45), z: r3(q.z + al[1] * 2.45), face: f }); n.bins++; });
    PLAN.plots.forEach(p => {
        const list = (DRESS[p.d] || []).slice(), doors = [];
        if ('RCHESUB'.indexOf(p.d) >= 0 && (p.x * 3 + p.y * 5) % 3 === 0) list.unshift('phone');   // a pay phone on some plots of the lived-in districts p.buildings.forEach(b => (b.doors || []).forEach(d => doors.push(d)));
        const spots = [];
        for (let ly = 0; ly < N; ly++) for (let lx = 0; lx < N; lx++) {
            const cx = p.x * N + lx, cy = p.y * N + ly, ch = cellAt(cx, cy);
            if (ch !== '.' || !free(cx, cy, '.')) continue;
            if (doors.some(d => Math.abs(d.ox - lx) <= 2 && Math.abs(d.oy - ly) <= 2)) continue;
            const w = [[0, -1], [0, 1], [-1, 0], [1, 0]].filter(d => { const lx2 = lx + d[0], ly2 = ly + d[1]; return lx2 >= 0 && ly2 >= 0 && lx2 < N && ly2 < N && cellAt(cx + d[0], cy + d[1]) === 'I'; });
            if (w.length !== 1) continue;                                                 // one wall behind it, never a corner
            spots.push({ lx, ly, cx, cy, d: w[0] });
        }
        /* spread: a spot every few squares, in a fixed order */
        spots.sort((a, b) => ((a.lx * 7 + a.ly * 13 + p.x) % 11) - ((b.lx * 7 + b.ly * 13 + p.x) % 11) || a.ly - b.ly || a.lx - b.lx);
        const used = [];
        for (const kind of list) {
            const s = spots.find(q => !used.some(u => Math.abs(u.lx - q.lx) + Math.abs(u.ly - q.ly) < 4) && free(q.cx, q.cy, '.')); if (!s) break;
            used.push(s); take(s.cx, s.cy);
            const out = [-s.d[0], -s.d[1]], al = [s.d[1], s.d[0]], at = (back, side) => ({ x: r3(gc(s.cx) + s.d[0] * (C / 2 - back) + al[0] * (side || 0)), z: r3(gc(s.cy) + s.d[1] * (C / 2 - back) + al[1] * (side || 0)) });
            const h7 = (s.cx * 7 + s.cy * 3) % 4;
            if (kind === 'phone') { props.push(Object.assign({ key: 'public_phone', face: faceZ(out[0], out[1]) }, at(0.34))); n.phones++; }
            else if (kind === 'utility_box') props.push(Object.assign({ key: 'utility_box', face: faceZ(out[0], out[1]) }, at(0.42)));
            else if (kind === 'ind_panel') props.push(Object.assign({ key: 'ind_panel', face: faceX(out[0], out[1]) }, at(0.4)));
            else if (kind === 'ind_vent') props.push(Object.assign({ key: 'ind_vent', face: faceX(out[0], out[1]) }, at(0.36)));
            else if (kind === 'barrels') { props.push(Object.assign({ key: 'psx_metal_barrel_mp_' + h7 }, at(0.55, -0.45)), Object.assign({ key: 'psx_metal_barrel_mp_' + ((h7 + 2) % 4) }, at(0.55, 0.4))); if (h7 % 2) props.push(Object.assign({ key: 'psx_metal_barrel_mp_' + ((h7 + 1) % 4) }, at(1.25, 0.05))); }
            else if (kind === 'crate') props.push(Object.assign({ key: 'psx_wooden_crate_3', face: faceZ(out[0], out[1]) + (h7 - 1) * 8 }, at(0.75)));
            else if (kind === 'crates') props.push(Object.assign({ key: 'psx_wooden_crate_3', face: faceZ(out[0], out[1]) }, at(0.75, -0.6)), Object.assign({ key: 'psx_supply_crate_1', face: faceZ(out[0], out[1]) + 20 }, at(0.5, 0.65)));
            else if (kind === 'boxes') props.push(Object.assign({ key: 'cardboard_boxes', face: faceZ(out[0], out[1]) + h7 * 15 }, at(0.65)));
            n.wall++;
        }
        /* a manhole cover on the plot's street, on the flat stretch by the plot's middle, in a lane's middle */
        const man = []; for (let ly = 4; ly <= 7; ly++) for (let lx = 4; lx <= 7; lx++) { const cx = p.x * N + lx, cy = p.y * N + ly; if (cellAt(cx, cy) === 'R' && [[1, 0], [-1, 0], [0, 1], [0, -1]].every(d => cellAt(cx + d[0], cy + d[1]) === 'R')) man.push([cx, cy]); }
        if (man.length) { const m = man[(p.x * 5 + p.y * 3) % man.length]; props.push({ key: 'street_drain', x: r3(gc(m[0])), z: r3(gc(m[1])) }); n.drains++; }
    });
    /* the police cordon: a sandbag wall at one end of every other barricade (Bayside's opening) */
    props.slice().forEach((q, i) => { if (q.key !== 'item_police_barricade' || ctx.own.has(q)) return;
        const p = PLAN.plots.find(pl => pl.x === Math.floor((q.x + HALF) / (C * N)) && pl.y === Math.floor((q.z + HALF) / (C * N)));
        if (!p || !/Police staging|Cordon plaza|Arrival court/.test(p.name) || i % 2) return;
        const th = Math.PI - (q.face || 0) * D2R, o = rotP(2.15, 0, th);
        props.push({ key: 'meshy_sandbags', x: r3(q.x + o[0]), z: r3(q.z + o[1]), face: q.face || 0 }); n.sandbags++; });
    /* the metro's stair (Transit square): a green bin either side of it */
    PLAN.plots.filter(p => p.name === 'Transit square').forEach(p => { [[4.5, 2.5], [7.5, 2.5]].forEach(q => { const cx = p.x * N + Math.floor(q[0]), cy = p.y * N + Math.floor(q[1]); if (!free(cx, cy, '.P')) return; take(cx, cy); props.push({ key: 'metro_bin', x: r3(-HALF + (p.x * N + q[0]) * C + 1.0), z: r3(-HALF + (p.y * N + q[1]) * C) }); n.bins++; }); });
    /* THE SECOND WAVE (pieces cut from the packs): garbage by the dumpsters, power poles on the kerbs of the working districts, a playground */
    const plotAt = (x, z) => PLAN.plots.find(pl => pl.x === Math.floor((x + HALF) / (C * N)) && pl.y === Math.floor((z + HALF) / (C * N)));
    props.slice().forEach((q, i) => { if (q.key !== 'dumpster' || ctx.own.has(q)) return;
        const th = Math.PI - (q.face || 0) * D2R, a = rotP(1.85, 0.15, th), b = rotP(-1.8, 0.1, th);
        props.push({ key: i % 2 ? 'garbage_bag' : 'garbage_bags', x: r3(q.x + a[0]), z: r3(q.z + a[1]), face: (i * 67) % 360 }); n.garbage++;
        if (i % 3 === 0) { props.push({ key: 'metal_trash_can', x: r3(q.x + b[0]), z: r3(q.z + b[1]), face: (i * 41) % 360 }); n.garbage++; } });
    (ctx.lamps || []).forEach((l, i) => { const p = plotAt(l.x, l.z); if (!p || 'RI'.indexOf(p.d) < 0 || i % 3) return;
        const al = [-(l.nz || 0), l.nx || 0];                                             // along the kerb, a square on from the lamp
        props.push({ key: 'power_pole', x: r3(l.x + al[0] * C), z: r3(l.z + al[1] * C), face: l.nx ? 0 : 90 }); n.poles++; });
    PLAN.plots.filter(p => /^(Townhouse court|Park west|Dorm court)$/.test(p.name)).forEach(p => {   // a 2 x 2 squares yard: the swing, the slide, the sandbox between
        for (let ly = 1; ly < N - 2; ly++) for (let lx = 1; lx < N - 2; lx++) { const cx = p.x * N + lx, cy = p.y * N + ly;
            if (![[0, 0], [1, 0], [0, 1], [1, 1]].every(d => free(cx + d[0], cy + d[1], '.'))) continue;
            [[0, 0], [1, 0], [0, 1], [1, 1]].forEach(d => take(cx + d[0], cy + d[1]));
            props.push({ key: 'play_swing', x: r3(gc(cx)), z: r3(gc(cy)), face: 0 }, { key: 'play_slide', x: r3(gc(cx + 1)), z: r3(gc(cy + 1)), face: 0 },
                { key: 'play_sandbox', x: r3(gc(cx + 1) - 0.4), z: r3(gc(cy) - 0.3), face: 0 });
            n.play++; return; } });
    return n;
}

/* THE PROP CHECK */
function check(ctx) {
    const { props, cellAt, C, HALF, r3, REPO } = ctx, S = solids(ctx), G = Grid(14); S.forEach(o => G.add(o));
    const tally = { checked: 0, clear: 0, moved: 0, left_out: 0, district_reported: 0, by: {} }, report = [];
    const cellOf = v => Math.floor((v + HALF) / C);
    const ground = (x, z) => { const ch = cellAt(cellOf(x), cellOf(z)); return ch === 'R' ? 'road' : (ch === 'I' || ch === 'D') ? 'building' : 'walk'; };
    const isVeh = row => !!(cat(REPO, row.key) || {}).vehicle;
    /* the shared bus shelters run ALONG their kerb, open to the road (the model's roof ran across the pavement: its catalogue turn), and block as a round thing */
    props.forEach(q => { if (q.key === 'bus_shelter' && !ctx.own.has(q) && !q._turned) { q.face = ((q.face || 0) + 90) % 360; q.rect = false; q._turned = 1; } });
    const placed = Grid(7);
    const fixedRow = q => FIXED.test(q.key) || (typeof q.y === 'number' && q.y >= 1);
    /* what stands still: the landmarks, the districts' own rows */
    const rows = props.map((q, i) => ({ q, i, own: ctx.own.has(q), fixed: fixedRow(q) }));
    const put = (r, x, z) => { const poly = foot(REPO, r.q, x, z, 0); placed.add({ poly, bb: bbOf(poly), r }); };
    rows.forEach(r => { if (r.fixed && r.q.key !== 'street_drain') put(r, r.q.x, r.q.z); });
    const clash = (r, x, z, strict) => {
        const q = r.q, walled = WALLED.test(q.key), pad = walled ? 0.02 : isVeh(q) ? 0.3 : 0.1;
        const P = foot(REPO, q, x, z, pad), bb = bbOf(foot(REPO, q, x, z, 0.25)); let P2 = null;
        for (const o of G.near(bb)) { if (o.bb.x1 < bb.x0 || o.bb.x0 > bb.x1 || o.bb.z1 < bb.z0 || o.bb.z0 > bb.z1) continue;
            const wide = (o.type === 'fence' || o.type === 'hedge' || o.type === 'wall') && /bench|_bin$/.test(q.key);   // a bench / a bin keeps a hand's width more from a fence
            if (sat(wide ? (P2 || (P2 = foot(REPO, q, x, z, 0.22))) : P, o.poly) > 0.02) return o.type; }
        for (const o of placed.near(bb)) { if (o.r === r || o.bb.x1 < bb.x0 || o.bb.x0 > bb.x1 || o.bb.z1 < bb.z0 || o.bb.z0 > bb.z1) continue; if (sat(P, o.poly) > 0.02) return /^city_/.test(o.r.q.key) ? 'building' : 'prop'; }
        /* the ground: the whole footprint on one kind of ground, and no step under it */
        const F = foot(REPO, q, x, z, 0), g0 = ground(x, z), veh = isVeh(q);
        if (g0 === 'building') return strict ? 'ground' : null;
        if (!veh && g0 === 'road' && !/barricade|cone|barrel|sandbags/.test(q.key)) return 'road';
        if (strict) { for (const c of F) { const g = ground(c[0], c[1]); if (g === 'building' || (veh ? g !== g0 : g === 'road' && g0 !== 'road')) return 'ground'; } }
        if (ctx.at) { let lo = 1e9, hi = -1e9; F.concat([[x, z]]).forEach(c => { const h = ctx.at(c[0], c[1]); if (h < lo) lo = h; if (h > hi) hi = h; }); if (hi - lo > (veh ? 0.9 : 0.45)) return 'step'; }
        return null;
    };
    const offCentre = (x, z) => { const fx = ((x + HALF) / C) % 1, fz = ((z + HALF) / C) % 1; return Math.hypot(fx - 0.5, fz - 0.5) * C >= 0.6; };
    const order = r => r.own ? 0 : isVeh(r.q) ? 1 : /bus_shelter|dumpster|planter$|barricade|hot_dog|statue/.test(r.q.key) ? 2 : WALLED.test(r.q.key) ? 3 : 4;
    const todo = rows.filter(r => !r.fixed).sort((a, b) => order(a) - order(b) || a.i - b.i), drop = new Set();
    /* a thing that backs on a wall stands FLUSH on the real wall: where the district's building stands further back than the plan's square, it steps back to it (up to 1.5 m) */
    const snug = r => { const q = r.q; if (!WALLED.test(q.key)) return;
        const th = Math.PI - (q.face || 0) * D2R, fr = /ind_/.test(q.key) ? rotP(1, 0, th) : rotP(0, 1, th); let a = 0, hitWall = false;
        for (let t = 0.05; t <= 1.5; t += 0.05) { const w = clash(r, q.x - fr[0] * t, q.z - fr[1] * t, true); if (!w) { a = t; continue; } hitWall = (w === 'building' || w === 'arch' || w === 'ground' || w === 'wall'); break; }
        if (hitWall && a > 0.04) { q.x = r3(q.x - fr[0] * a); q.z = r3(q.z - fr[1] * a); tally.snugged = (tally.snugged || 0) + 1; } };
    for (const r of todo) {
        const q = r.q; tally.checked++;
        const why = clash(r, q.x, q.z, false);
        if (!why) { if (!r.own) snug(r); put(r, q.x, q.z); tally.clear++; continue; }
        if (r.own) { put(r, q.x, q.z); if (why !== 'landing' && why !== 'step') { tally.district_reported++; report.push([q.key, q.x, q.z, why]); } continue; }   // (a district's prop on its own deck / steps is its own set)
        tally.by[q.key + ' in ' + why] = (tally.by[q.key + ' in ' + why] || 0) + 1;
        /* the nearest clear spot */
        const cands = [], veh = isVeh(q), decor = DECOR.test(q.key), th = Math.PI - (q.face || 0) * D2R;
        if (veh) { const ax = rotP(0, 1, th), sx = rotP(1, 0, th); for (let a = 0.5; a <= 9; a += 0.5) for (const s of [1, -1]) for (const l of [0, 0.5, -0.5, 1, -1]) cands.push([q.x + ax[0] * a * s + sx[0] * l, q.z + ax[1] * a * s + sx[1] * l, a + Math.abs(l)]); }
        else if (WALLED.test(q.key)) {   // out from the wall it backs on first (its front: +z for the vending machine / the utility box, +x for the cabinet / the fan), then along the wall
            const fr = /ind_/.test(q.key) ? rotP(1, 0, th) : rotP(0, 1, th), al = [-fr[1], fr[0]];
            for (const l of [0, 0.5, -0.5, 1, -1, 1.5, -1.5, 2.5, -2.5]) for (let a = 0.05; a <= 2.0; a += 0.05) cands.push([q.x + fr[0] * a + al[0] * l, q.z + fr[1] * a + al[1] * l, Math.abs(l) * 2 + a]);
            for (const l of [0.5, -0.5, 1, -1, 1.5, -1.5]) for (let a = 0.05; a <= 1.2; a += 0.05) cands.push([q.x - fr[0] * a + al[0] * l, q.z - fr[1] * a + al[1] * l, Math.abs(l) * 2 + a + 1]);
        }
        else if (decor) { for (let dx = -2.5; dx <= 2.5; dx += 0.25) for (let dz = -2.5; dz <= 2.5; dz += 0.25) if (dx || dz) cands.push([q.x + dx, q.z + dz, Math.hypot(dx, dz)]); }
        else { const cx = cellOf(q.x), cy = cellOf(q.z); for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) if (dx || dz) cands.push([-HALF + (cx + dx + 0.5) * C, -HALF + (cy + dz + 0.5) * C, Math.hypot(dx, dz) * C]); }
        cands.sort((a, b) => a[2] - b[2]);
        const g0 = ground(q.x, q.z); let hit = null;
        for (const c of cands) {
            const g = ground(c[0], c[1]); if (g === 'building' || (g0 !== 'building' && g !== g0 && (veh || g === 'road'))) continue;
            if (decor && !WALLED.test(q.key) && !offCentre(c[0], c[1])) continue;
            if (!veh && !decor && ctx.taken && ctx.taken(cellOf(c[0]), cellOf(c[1]))) continue;
            if (clash(r, c[0], c[1], true)) continue;
            hit = c; break;
        }
        if (hit) { q.x = r3(hit[0]); q.z = r3(hit[1]); snug(r); put(r, q.x, q.z); tally.moved++; }
        else { drop.add(q); tally.left_out++; report.push([q.key, q.x, q.z, why, 'left out']); }
    }
    for (let i = props.length - 1; i >= 0; i--) { if (drop.has(props[i])) props.splice(i, 1); else delete props[i]._turned; }
    return { tally, report };
}
module.exports = { kerbSign, dress, check, SIZE };
