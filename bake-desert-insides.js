#!/usr/bin/env node
/* bake-desert-insides.js — THE DESERT'S INSIDES (2026-11-15, mondo's OK on docs/plans/desert/insides_plan.png). Three rooms behind the
   Desert's doors, each laid on whole 3.5 m squares exactly as the plan draws them (docs/plans/desert/draw-insides.py holds the rectangles):
     site_prebuilt_area51_hangar  HANGAR 18                  22 x 14 squares, 14 m to the roof, mezzanine + catwalk 3.5 m up
     site_prebuilt_area51_ward    THE WHITE ROOMS            16 x 12 squares, two floors, the observation floor looks down through glass
     site_prebuilt_giza_pyramid   INSIDE THE GREAT PYRAMID   14 x 14 squares, three levels (the Pit, the Queen's Chamber, the King's Chamber)
   `node bake-desert-insides.js` writes them into data.js between DESERT-INSIDES-BEGIN / DESERT-INSIDES-END (the first run replaces the old
   hangar + ward literals); `--dry-run` prints the counts and the walk check. Never hand-edit between the markers.
   Squares are (u 0..NU west to east, v 0..NV north to south). A wall stands on a square LINE, a doorway is 1.75 m in the middle of one
   square's edge with a swinging leaf (three-renderer.js _hqBuildTexDoors, the `doorsOnly` carrier row), a blocker stands on a square's
   middle, decor stands off it. Notes: docs/notes/areas-complexes.md "THE DESERT'S INSIDES". */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const REPO = __dirname, DRY = process.argv.includes('--dry-run'), C = 3.5, T = 0.3, DW = 1.75, DH = 2.2;
const r2 = v => Math.round(v * 100) / 100;
const J = v => JSON.stringify(v).replace(/"([a-zA-Z_][a-zA-Z0-9_]*)":/g, '$1:').replace(/'/g, "\\'").replace(/"/g, "'");
const D = require('./load-data.js').loadGameData();
const CAT = vm.runInContext('DOOR_HQ.catalogue', D), RACES = vm.runInContext('AVAILABLE_RACES', D);
const U = n => 'urban:' + n, GLS = U('GlassWindowTall1a'), CHAIN = U('MetalFenceChainlink1'), GRILL = U('MetalSubwayGrill1a'), STEEL = U('MetalCorrugatedPainted2a'),
    RIB = U('MetalWallRibbed1a'), PLAS = U('PlasterWallPainted1a'), TILE = U('TileGeneric1a'), FIB = U('FibreCeilingTile1a'), CONC = U('ConcretePanels1a'), STONE = 'bricks_1';

/* ── THE KIT: one room on its squares ── */
function mk(NU, NV, pre) {
    const W = NU * C, Dd = NV * C, X = u => r2(-W / 2 + u * C), Z = v => r2(-Dd / 2 + v * C);
    const R = { NU, NV, W, D: Dd, X, Z, F: [], P: [], props: [], doors: [], npc: [], inner: [], block: {}, free: {}, must: [] };
    const sq = (u, v) => Math.floor(u) + ',' + Math.floor(v);
    /* a wall on a square line. axis 'u' = it runs west-east on the line v = at; 'v' = north-south on the line u = at; from a to b (squares).
       o: h (its height), y0 (its foot: an upper floor's wall hangs over the walker below), key / tint, glass, doors [[middle, leaf, double]]
       (leaf 'none' = the bare doorway), gaps [[from, to]] (a plain opening, whole squares), draw: false (walked only), walk: false (drawn only) */
    R.wall = (axis, at, a, b, o) => { o = o || {}; const h = o.h || 3.5, y0 = o.y0 || 0, base = o.base || 0;
        const seg = (s0, s1) => { if (s1 - s0 < 0.02) return; const m = (s0 + s1) / 2, L = (s1 - s0) * C, px = axis === 'u' ? X(m) : X(at), pz = axis === 'u' ? Z(at) : Z(m);
            if (o.draw !== false) { const p = { s: 'box', p: [px, r2(base + y0), pz], size: axis === 'u' ? [r2(L), h, T] : [T, h, r2(L)], uv: [3.5, 1.75] }; if (o.key) p.key = o.key; if (o.tint != null) p.tint = o.tint; if (o.glass) { p.kind = 'glass'; p.uv = 7; } if (o.glow) p.glow = o.glow; R.P.push(p); }
            if (o.walk !== false) { const e = Math.min(0.15, L / 2 - 0.01), row = Object.assign({ k: 'wall' }, axis === 'u' ? { x0: r2(X(s0) + e), z0: pz, x1: r2(X(s1) - e), z1: pz } : { x0: px, z0: r2(Z(s0) + e), x1: px, z1: r2(Z(s1) - e) }, { t: T, ghost: true, rail: false });
                row.h = h; row.y = r2(base + y0 + h); if (y0 > 0) row.y0 = r2(base + y0); R.F.push(row); } };   // `y` = its top, `y0` = an upper floor wall's own foot (absolute: a stair under the line never lifts it)
        const cuts = (o.doors || []).map(d => ({ a: d[0] - DW / 2 / C, b: d[0] + DW / 2 / C, d })).concat((o.gaps || []).map(g => ({ a: g[0], b: g[1] }))).sort((p, q) => p.a - q.a);
        let cur = a;
        cuts.forEach(c => { seg(cur, c.a); cur = c.b; if (!c.d) return;
            const m = c.d[0], px = axis === 'u' ? X(m) : X(at), pz = axis === 'u' ? Z(at) : Z(m), yb = r2(base + y0), fr = o.frame != null ? o.frame : 0x3a3d42;
            if (h > DH + 0.05) { const p = { s: 'box', p: [px, r2(yb + DH), pz], size: axis === 'u' ? [DW, r2(h - DH), T] : [T, r2(h - DH), DW], uv: [3.5, 1.75], under: true }; if (o.key) p.key = o.key; if (o.tint != null) p.tint = o.tint; if (o.glass) { p.kind = 'glass'; p.uv = 7; } if (o.glow) p.glow = o.glow; R.P.push(p); }
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

/* ══ THE DISTRICT FILES (2026-11-16): the three rooms are written in the Desert's district files, docs/areas/desert/districts/<LETTER>.js, each
   file's `rooms(kit)`: A.js = HANGAR 18 + THE WHITE ROOMS, G.js = INSIDE THE GREAT PYRAMID. A room belongs to the district whose door leads to
   it, so one thread holds a district's outside and its insides. This tool keeps the kit (mk), the checks, the rooms' text and the walk check.
   rooms(kit) returns [{ id, key, name, R, head, terrain }]: R = a room built with kit.mk (with R.spawn, R.lines, R.stops, R.hidden), head / terrain
   = the room literal's own lines. kit = { mk, r2, C, T, DW, DH, U, GLS, CHAIN, GRILL, STEEL, RIB, PLAS, TILE, FIB, CONC, STONE, CAT }.
   The rooms are written in the files' order by letter, each file's in its own order (hangar, ward, pyramid: as before the split).
   Rules for the threads: docs/notes/areas-complexes.md "THE DESERT, THE DISTRICT FILES". */
const KIT = { mk, r2, C, T, DW, DH, U, GLS, CHAIN, GRILL, STEEL, RIB, PLAS, TILE, FIB, CONC, STONE, CAT };
const DDIR = path.join(REPO, 'docs/areas/desert/districts');
const ROOMS = [].concat(...fs.readdirSync(DDIR).filter(f => /^[A-Z]\.js$/.test(f)).sort().map(f => { const m = require(path.join(DDIR, f)); return typeof m.rooms === 'function' ? m.rooms(KIT).map(r => Object.assign(r, { file: f })) : []; }));
ROOMS.forEach(r => check(r.name, r.R));
/* THE ONE WORLD MOVE (2026-11-17, bake-desert.js): the Desert is five rooms now. `site_prebuilt_area51_desert` is Area 51's room (the old id), so a
   district file's door back out that names it and asks for a door another room holds now (Giza's pyramid, tombside, cut) is pointed at that
   room here, by the door id, read from data.js as bake-desert.js wrote it. The district files are not changed. Run bake-desert.js first. */
{ const OLD = 'site_prebuilt_area51_desert', OUT = ['site_prebuilt_area51_ow_circus', 'site_prebuilt_area51_ow_town', OLD, 'site_prebuilt_area51_ow_giza'];   // (the Highway's room retired 11-17, BUILD_PLAN 4.2)
  const holder = {}; OUT.forEach(id => { const ds = JSON.parse(vm.runInContext('JSON.stringify(((DOOR_HQ.rooms[' + JSON.stringify(id) + '] || {}).doors || []).map(d => d.id))', D)); ds.forEach(k => { if (!holder[k]) holder[k] = id; }); });
  ROOMS.forEach(r => (r.R.doors || []).forEach(d => { const a = d.action; if (!a || a.room !== OLD || !a.at) return; const to = holder[a.at];
      if (!to) throw new Error(r.name + ': its door ' + d.id + ' asks for ' + a.at + ', which no Desert room has (run node bake-desert.js first)');
      if (to !== OLD) d.action = Object.assign({}, a, { room: to }); })); }

/* ── the rooms' text ── */
function emit(id, R, head, terrainHead) {
    const M = [], F = R.F.concat([{ k: 'arch', id: 'des:' + id + ':in', x: 0, z: 0, parts: R.P }]);
    if (R.inner.length) F.push({ k: 'texbuilding', id: 'des:' + id + ':doors', x: 0, z: 0, y: 0, w: 2, d: 2, rot: 0, storeys: 1, skin: false, doorsOnly: true, leaf: 'leaf_office', inner: R.inner });
    M.push('        ' + id + ': {'); head.forEach(l => M.push('            ' + l));
    M.push('            terrain: {'); terrainHead.forEach(l => M.push('                ' + l));
    M.push('                features: ['); F.forEach(f => M.push('                    ' + J(f) + ',')); M.push('                ],'); M.push('            },');
    M.push('            doors: ['); R.doors.forEach(d => M.push('                ' + J(d) + ',')); M.push('            ],');
    M.push('            counters: [],'); M.push('            props: [');
    for (let i = 0; i < R.props.length; i += 4) M.push('                ' + R.props.slice(i, i + 4).map(J).join(', ') + ',');
    M.push('            ],'); M.push('            agents: [],'); M.push('            npcSpots: ' + J(R.npc) + ','); M.push('            onlineSpots: [],');
    M.push('            lines: ' + J(R.lines) + ','); M.push('            spawn: ' + J(R.spawn) + ','); M.push('        },');
    return M;
}
const OUT = [];
OUT.push("        /* DESERT-INSIDES-BEGIN — THE DESERT'S INSIDES (2026-11-15): written by `node bake-desert-insides.js` from the approved plan (docs/plans/desert/insides_plan.png). Never hand-edit between the markers; edit the tool and rerun. */");
ROOMS.forEach(r => emit(r.id, r.R, r.head, r.terrain).forEach(l => OUT.push(l)));
OUT.push('        /* DESERT-INSIDES-END */');
const block = OUT.join('\n') + '\n';
console.log(JSON.stringify(ROOMS.reduce((o, r) => { o[r.key] = { rows: r.R.F.length, parts: r.R.P.length, props: r.R.props.length, leaves: r.R.inner.length }; return o; }, {})));

/* ── write, then walk it: compile each room from the written data.js and reach every stop from the spawn on the walker's own rule ── */
const file = path.join(REPO, 'data.js'); let src = fs.readFileSync(file, 'utf8');
const END = '        /* DESERT-INSIDES-END */\n', b0 = src.indexOf('        /* DESERT-INSIDES-BEGIN'), b1 = src.indexOf(END);
if (b0 >= 0 && b1 > b0) src = src.slice(0, b0) + block + src.slice(b1 + END.length);
else {   // the first run: the old hangar + ward literals go (from the hangar's own comment line to the Desert's block)
    const a = src.indexOf('        /* ── HANGAR 18 — the floor, the rig, the catwalk, the crane hook, the floor lift ── */'), z = src.indexOf('        /* ── THE FLIGHT LINE — the aprons and taxiways between the berms');
    if (a < 0 || z < a) throw new Error('the old hangar / ward literals were not found in data.js');
    src = src.slice(0, a) + block + src.slice(z);
}
/* the old rooms' rows in HQ_ROOM_HOLES (bake-holes.js: squares nobody could stand on in the OLD floor plans) would cut pits into the new floors: drop them (`node bake-holes.js <room>` writes fresh ones) */
if (!(b0 >= 0 && b1 > b0)) src = src.replace(/^    "site_prebuilt_area51_(hangar|ward)": \[\[.*\n/gm, '');
const tmp = path.join(require('os').tmpdir(), 'ew-insides-' + process.pid + '.js'); fs.writeFileSync(tmp, src);
let bad = 0;
try {
    const D2 = require('./load-data.js').loadGameData({ quiet: true, file: tmp });
    ROOMS.forEach(({ id, R }) => {
        const res = JSON.parse(vm.runInContext(`(function () { var info = hqTerrainInfo('${id}'), R = info.rules, S = ${JSON.stringify(R.spawn)}, st = 0.4375, seen = {}, q = [], out = { stops: [], hidden: [], n: 0 };
            var y0 = hqTerrainFeet(info, S.x, S.z, null); if (y0 == null) return JSON.stringify({ err: 'the spawn is not walked' });
            var key = function (x, z, y) { return Math.round(x / st) + ',' + Math.round(z / st) + ',' + Math.round(y / 1.75); };
            q.push([S.x, S.z, y0]); seen[key(S.x, S.z, y0)] = 1;
            while (q.length) { var c = q.pop(); out.n++; [[st, 0], [-st, 0], [0, st], [0, -st]].forEach(function (d) { var x = c[0] + d[0], z = c[1] + d[1], y = hqTerrainFeet(info, x, z, c[2]);
                if (y == null || y - c[2] > R.climb + 0.01) return; var k = key(x, z, y); if (seen[k]) return; seen[k] = 1; q.push([x, z, y]); }); }
            var near = function (p) { for (var i = -2; i <= 2; i++) for (var j = -2; j <= 2; j++) if (seen[key(p[0] + i * st, p[1] + j * st, p[2])]) return true; return false; };
            out.stops = ${JSON.stringify(R.stops.map(s => [R.X(s[0]), R.Z(s[1]), s[2]]))}.map(near); out.hidden = ${JSON.stringify((R.hidden || []).map(s => [R.X(s[0]), R.Z(s[1]), s[2]]))}.map(near);
            out.pads = (info.pads || []).map(function (p) { return [p.door && p.door.id, near([p.x, p.z, p.h])]; });
            return JSON.stringify(out); })()`, D2));
        if (res.err) { console.log(id + ': ' + res.err); bad++; return; }
        const miss = R.stops.filter((s, i) => !res.stops[i]), padMiss = res.pads.filter(p => !p[1]).map(p => p[0]);
        console.log(id + ': walked ' + res.n + ' spots, ' + (R.stops.length - miss.length) + '/' + R.stops.length + ' stops' + (miss.length ? ' · NOT REACHED ' + JSON.stringify(miss) : '') + ' · doors ' + JSON.stringify(res.pads) + (R.hidden ? ' · by the ladder only ' + JSON.stringify(res.hidden) : ''));
        bad += miss.length + padMiss.length;
    });
} finally { fs.unlinkSync(tmp); }
if (bad) { console.error('the walk check failed (' + bad + ')'); process.exit(1); }
if (DRY) process.exit(0);
fs.writeFileSync(file, src);
console.log('data.js: the three insides written (' + block.length + ' bytes)');
