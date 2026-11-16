/* DISASTER CITY · THE SHORE (district W, the waterfront: the city's NORTH BEACH, in the city's own room `site_prebuilt_downtown_streets`)
   mondo 2026-11-16: "the beach is supposed to be a part of the city, like how we connected the hills" + "the city has its own beach and you just
   made a beach, its supposed to be the same ... fix it. combine it ... use the best elements from both. make it bigger".
   Until that day the Shore stood only in the Beach zone's sea room (`site_prebuilt_bermuda_beach`, district S of bake-beach.js) and the city's
   north beach was a thin strip of sand with six umbrellas. Now THE SHORE STANDS HERE: the same district file
   (`docs/areas/beach/districts/S.js`: the three huts with the snow cone stand, the Lifeguard Hut, the Boardwalk spur and its gate, the
   volleyball court, the towel line, the tide pools, the palms, the camp, the torches, the people) is run by THIS file on the city's own sand,
   so the two can never differ. Bayside's own beach south of the mole (the pier and its pavilion, the lifeguard towers, the yachts, the grill:
   districts/B.js) stays as it stood: together they are one beach, 336 m long.
   Notes: docs/notes/areas-complexes.md "THE BEACH IS PART OF DISASTER CITY". After an edit of S.js or this file: `node bake-disaster-city.js`
   AND `node bake-beach.js`, then RULE #1.

   WHERE IT STANDS (real metres, no home frame): the Shore's square (sx, sy) is x = 259 + 3.5 sx (259 = the boardwalk's sea edge),
   z = -252 + 3.5 (sy - 24). Its rows sy 24..71 (the wild beach, the Boardwalk + the Tide Pools, the Huts + the Surf, the Palms + the Lifeguard
   Hut) lie on the city's rows 0..47, along Entertainment, from the Hills' Cove down to the mole. Its rows north of 24 (the North Headland) are
   the Hills' cliffs here and its rows from 72 (the Dunes, the Sandbar, the south camp, the South Dunes) are Bayside's beach here: every row,
   prop and person of S.js outside rows 24..71 is LEFT OUT (never written), with its dice still thrown so nothing else moves.

   THE GROUND is districts/B.js beach()'s (two rows there): the sand lies at the boardwalk's level (0) for 17 squares and falls under the sea
   (-1.45) past square 163; no sea wall drop on this stretch, you step off the boards anywhere. So the Shore's `G` (the sand under a hut) is 0.
   HEIGHTS OF DRAWN ROWS AND HUNG PROPS: the tool adds the plot levels' height to every `arch` row and to every prop typed 1 m up or more, and
   the strip beside Entertainment carries that district's level (8.75 m) though its ground is cut to 0. `last()` takes that back off this
   file's own rows, so they stand as typed.
   KNOWN MISSING: the Shore's dunes, sandbar and south camp have no place here yet; the coast is a straight line (the Tide Pools' inlet is not
   cut); the Long Pier, the Quay and the Flying Dutchman are still only in the sea room (the next step: the notes). */
'use strict';
const fs = require('fs'), path = require('path');
const REPO = path.join(__dirname, '../../..');
const SHORE = require(path.join(REPO, 'docs/areas/beach/districts/S.js'));
const LAY = JSON.parse(fs.readFileSync(path.join(REPO, 'docs/areas/beach/layout.json'), 'utf8')), PLAN = LAY.rooms[0];
const C = 3.5, N = 12, BW = N * PLAN.cols, BH = N * PLAN.rows, OY = 36, X0 = 259, Z0 = -252, SY0 = 24, SY1 = 72, SEA = -1.45;
const r2 = v => Math.round(v * 100) / 100;
const gx = c => r2(X0 + c * C), gz = c => r2(Z0 + (c - SY0) * C), mx = c => gx(c + 0.5), mz = c => gz(c + 0.5);
const inZ = z => z >= Z0 - 0.01 && z < Z0 + (SY1 - SY0) * C - 0.01;
const DICE = { build: (83 * 7919 + 5 * 104729) >>> 0, place: 345, dress: 388744000 };   // bake-beach.js' own dice for district S, stage by stage (the same throws = the same beach)
const U = n => 'urban:' + n, WD = U('WoodGeneric1b'), WD2 = U('WoodGeneric1a'), SHG = U('WoodGeneric2a'), FLR = U('WoodFlooring1d'), GLS = U('GlassWindowTall1a'), COR = U('MetalCorrugated1a'), BRK = U('BrickMasonry1a'), SHUT = U('GlassWindowResidentialShutter1');
const PAINT = 2.3, CORR = U('MetalCorrugatedPainted1a'), ROT = { S: 0, W: 90, N: 180, E: 270 };
const OWN = { arch: [], props: new Set() };

function sheet() {   // bake-beach.js sheet(), word for word
    const P = [];
    const add = (o, key, tint, x) => { if (key) o.key = key; if (tint != null) o.tint = tint; if (x) Object.assign(o, x); if (/GlassWindow/.test(key || '') && o.glow == null) o.glow = 0.3; P.push(o); return o; };
    const A = { P,
        box: (x, y, z, w, h, d, key, tint, o) => add({ s: 'box', p: [r2(x), r2(y), r2(z)], size: [r2(w), r2(h), r2(d)] }, key, tint, o),
        cyl: (x, y, z, r, h, key, tint, o) => add({ s: 'cyl', p: [r2(x), r2(y), r2(z)], r, h }, key, tint, o),
        roof: (form, x, y, z, w, h, d, key, tint, o) => { add({ s: 'box', p: [x, y, z], size: [w, 0.02, d], sides: false, top: false, under: true, roof: true, ry: (o && o.ry) || 0 }, WD2, 0x4a3626);
            return add({ s: 'roof', form, p: [x, y, z], size: [w, h, d], roof: true }, key, tint, o); },
        shell(w, h, d, key, tint, door, uv, gain) { const e = 0.05, Wd = w + 2 * e, Dp = d + 2 * e, x = uv ? (gain ? { uv, gain } : { uv }) : null;
            add({ s: 'box', p: [0, 0, 0], size: [Wd, h, Dp], top: false, faces: 'blr' }, key, tint, x);
            add({ s: 'quad', p: [0, 0, r2(Dp / 2)], size: [Wd, h], ry: 0, hole: [r2(door.lx), r2(door.cw), 2.2] }, key, tint, x); },
        frame(door, d, key, tint) { A.box(door.lx - door.cw / 2 - 0.1, 0, d / 2 + 0.1, 0.2, 2.4, 0.2, key, tint); A.box(door.lx + door.cw / 2 + 0.1, 0, d / 2 + 0.1, 0.2, 2.4, 0.2, key, tint); A.box(door.lx, 2.25, d / 2 + 0.1, door.cw + 0.5, 0.2, 0.2, key, tint); },
        sign(words, x, y, z, w, h, fg, bg, font, o) { P.push(Object.assign({ s: 'quad', p: [r2(x), r2(y), r2(z)], size: [w, h], key: 'txt:' + words + '|' + fg + '|' + bg + '|' + r2(w / h) + '||' + font, uv: 'fit', kind: 'wall' }, o || {})); } };
    return A;
}
const texbDoor = (w, door) => { const L = Math.max(2, w) - 0.12, cols = Math.max(1, Math.round(L / 1.75)), cw = L / cols; let col = Math.floor((cols - 1) / 2); if (door >= 1) col = Math.min(cols - 1, Math.round(door) - 1); return { lx: -L / 2 + (col + 0.5) * cw, cw }; };

function apply(ctx) {
    const cell = PLAN.cells.map(r => r.split('').map(ch => ch === 'T' ? 't' : ch));
    const setRect = (x0, y0, x1, y1, ch) => { for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) cell[y][x] = ch; };
    const plot = {}; PLAN.plots.forEach(p => { plot[(+p.id.slice(1, 3)) + ':' + (+p.id.slice(4, 6))] = p; });
    const Pxy = (x, y) => plot[Math.max(0, Math.min(PLAN.cols - 1, Math.floor(x / N))) + ':' + Math.max(0, Math.min(PLAN.rows - 1, Math.floor(y / N)))];
    let seed = 1; const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    const count = { rows: 0, props: 0, people: 0, left: 0 };
    const keepProp = q => { if (!inZ(q.z)) { count.left++; return false; }
        if (typeof q.y === 'number' && q.y <= -0.5 && q.hover != null) q.y = r2(q.y + SEA);          // a thing in or on the water: the city's sea stands at -1.45
        if (typeof q.y === 'number' && (q.y >= 1 || q.y <= -0.5)) OWN.props.add(q); ctx.props.push(q); count.props++; return true; };
    const props = { push: (...qs) => { qs.forEach(keepProp); return 0; } };                                // S.js pushes some props itself
    const feat = f => { const z = f.z != null ? f.z : (f.z0 + f.z1) / 2; if (!inZ(z)) { count.left++; return f; }
        if (f.k === 'dip') { ctx.lateRows.push({ k: 'pool', x: f.x, z: f.z, r: r2(f.r * 0.8), y: -0.2, depth: 0.7, key: 'water', bank: 1.0 }); count.rows++; return f; }   // (a late row: after B.js' cut of the sand, or the cut fills it again, seen)   // a tide pool: its own water (seen: a hollow in this sand stays dry, the city's sea is not under the beach)
        if (f.k === 'tree') f.keep = true;
        if (f.id) f.id = String(f.id).replace(/^bch:/, 'shore:');
        ctx.features.push(f); count.rows++; return f; };
    const arch = row => { if (!inZ(row.z)) { count.left++; return; } row.id = String(row.id).replace(/^bch:/, 'shore:'); ctx.lateRows.push(row); OWN.arch.push(row); count.rows++; };
    function building(id, q, h, o, parts) {
        const [sx0, sy0, sx1, sy1, side] = q, ew = side === 'E' || side === 'W', fw = (ew ? sy1 - sy0 : sx1 - sx0) * C, fd = (ew ? sx1 - sx0 : sy1 - sy0) * C, cx = gx((sx0 + sx1) / 2), cz = gz((sy0 + sy1) / 2), rot = ROT[side];
        const row = Object.assign({ k: 'texbuilding', id: 'bch:' + id, seed: 1, x: cx, z: cz, w: fw, d: fd, rot, storeys: 1, h, skin: false, hollow: true, leaf: 'leaf_shabby_wood', leafDouble: false, keyIn: WD2, floorIn: FLR }, o || {});
        Object.keys(row).forEach(k => { if (row[k] === undefined) delete row[k]; });
        feat(row);
        const a = sheet(), door = texbDoor(fw, row.door); parts(a, fw, fd, door);
        arch({ k: 'arch', id: 'bch:' + id + ':look', x: cx, z: cz, rot, parts: a.P });
        const t = rot * Math.PI / 180, c = Math.cos(t), s = Math.sin(t);
        return { at: (lx, lz) => [r2(cx + lx * c - lz * s), r2(cz + lx * s + lz * c)], face: f => (f + rot) % 360, fw, fd, door, cx, cz, rot };
    }
    const put = (B, key, lx, lz, o) => { const p = B.at(lx, lz), r = Object.assign({ key, x: p[0], z: p[1] }, o || {}); if (r.face != null) r.face = B.face(r.face); keepProp(r); };
    const look = (id, x, z, rot, fn) => { const a = sheet(); fn(a); arch({ k: 'arch', id: 'bch:' + id + ':look', x: r2(x), z: r2(z), rot: rot || 0, parts: a.P }); };
    const P = (key, sx, sy, o) => keepProp(Object.assign({ key, x: mx(sx), z: mz(sy) }, o || {}));
    const dec = (key, sx, sy, o) => keepProp(Object.assign({ key, x: r2(mx(sx) + (rnd() - 0.5) * 1.6), z: r2(mz(sy) + (rnd() - 0.5) * 1.6), face: Math.round(rnd() * 360) }, o || {}));
    const afloat = (key, sx, sy, o) => keepProp(Object.assign({ key, x: mx(sx), z: mz(sy), y: 0.32 }, o || {}));   // (a `float` prop's y is over the sea itself)
    const swimmer = (key, sx, sy, o) => keepProp(Object.assign({ key, x: mx(sx), z: mz(sy), y: -0.7, hover: 0.4 }, o || {}));
    const under = (key, sx, sy, y, o) => keepProp(Object.assign({ key, x: r2(mx(sx) + (rnd() - 0.5) * 2), z: r2(mz(sy) + (rnd() - 0.5) * 2), y, hover: 0, face: Math.round(rnd() * 360) }, o || {}));
    const palm = (sx, sy, h) => feat({ k: 'tree', x: r2(mx(sx) + (rnd() - 0.5)), z: r2(mz(sy) + (rnd() - 0.5)), kind: 'palm', h: h || r2(3.6 + rnd() * 1.4), r: 0.6 });
    const native = (race, sx, sy, face, say) => { if (!inZ(mz(sy))) { count.left++; return; } const n = { x: mx(sx), z: mz(sy), face: face || 0, race }; if (say) n.say = say; ctx.npcSpots.push(n); count.people++; };
    /* the mermaid keeps her own line: read from the old sea room's literal, as bake-beach.js reads it */
    let O_SEA = { n: [], l: [] }, O_HARB = { n: [], l: [] };
    try { const vm = require('vm'), D = require(path.join(REPO, 'load-data.js')).loadGameData(), old = id => JSON.parse(vm.runInContext('JSON.stringify((r => r ? { n: r.npcSpots || [], l: r.lines || [] } : { n: [], l: [] })(DOOR_HQ.rooms.' + id + '))', D));
        O_SEA = old('site_prebuilt_bermuda_sea'); O_HARB = old('site_prebuilt_downtown_harbour'); } catch (e) { console.warn('[the shore] the old rooms\' lines were not read:', e.message); }
    const sayOf = (R, race) => (R.n.find(n => n.race === race) || {}).say;
    const taken = new Set(), noop = () => {};
    const sctx = { C, N, W: BW, H: BH, OY, gx, gz, mx, mz, r2, rnd, cell, setRect, plot, Pxy, flat: () => 0, taken, spot: noop, feat, props, building, put, look, P, dec, afloat, swimmer, under, palm, native, sayOf, O_SEA, O_HARB,
        U, WD, WD2, SHG, FLR, GLS, COR, BRK, SHUT, CORR, PAINT, GROUND: 0, CITY_SIDE: 'DISASTER CITY', MAEL: {}, POOL: {}, BAY: {}, GANG: {}, SP: [3, OY + 5], SHIP: [0, 0, 0, 0], PIER_END: 57, LIGHT: [65, 101] };
    if (typeof SHORE.tailor === 'function') SHORE.tailor(sctx);
    ['build', 'place', 'dress'].forEach(stage => { if (typeof SHORE[stage] !== 'function') return; seed = DICE[stage]; SHORE[stage](sctx); });
    /* the Boardwalk spur's boards (the Shore's squares 0-7 x 40-42): planks on the sand, as in the sea room */
    for (let sy = 40; sy <= 42; sy++) for (let sx = 0; sx < 8; sx++) ctx.paintCell(146 + sx, sy - SY0, 'wood_planks');
    console.warn('[the shore]', JSON.stringify(count));
}

/* the very end: this file's own drawn rows and hung props stand at the height they were typed (see the header) */
function last(ctx) {
    if (typeof ctx.at !== 'function') return;
    OWN.arch.forEach(f => { f.y = Math.round(((typeof f.y === 'number' ? f.y : 0) - ctx.at(f.x + 0.01, f.z + 0.01)) * 1000) / 1000; if (Math.abs(f.y) < 0.002) delete f.y; });
    OWN.props.forEach(q => { q.y = Math.round((q.y - ctx.at(q.x, q.z)) * 1000) / 1000; });
}
module.exports = { apply, last };
