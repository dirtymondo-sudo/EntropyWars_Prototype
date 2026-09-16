// hq-field.test.js — THE FIELD, STAGE B: THE RASTERISER ON THE CAVE
// (PHASE9_QUALITY_PLAN §11.3 B — Phase 9 Delivery 8, 2026-09-16).
// "Anywhere you stand becomes the 8×8": in a cave chamber (no Δ under the
// walker) an encounter fights THE WINDOW — an 8 × 8 of the cave's own grid
// rasterised into a Δ-shaped map entry the ordinary launch plays under the
// synthetic id `field:<roomId>:<ox>,<oz>`. Guards: the rules + the room
// test (stage B = cave rooms only), the id round-trip + hqSiteId, THE
// RASTER on every chamber and every legal window (rock never climbable,
// every key a real terrain, THE GUARANTEE — every edge the walker steps
// lands within one battle level, and the walker's reach is a subset of the
// unit's on the built heights), THE WINDOW'S CHOICE (both feet inside, the
// walker's reach maximal, the transform round-trips to the millimetre, the
// field record / the seats / the eye read it like a site board), THE BUILD
// (the forge entry: tids, voxels, the bed, explicit spawns per seat, the
// registries, the site Δ's env) and the source sites in map.js /
// match-select.js. Repo-only.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { loadGameData } = require('./load-data');
const D = loadGameData(), HQ = D.DOOR_HQ;
const g = name => vm.runInContext(name, D);
const J = o => JSON.parse(JSON.stringify(o));
const MP = fs.readFileSync(__dirname + '/map.js', 'utf8');
const MS = fs.readFileSync(__dirname + '/match-select.js', 'utf8');
const DJ = fs.readFileSync(__dirname + '/data.js', 'utf8');
const R = g('HQ_FIELD_RULES'), S = R.size, B = R.base;
const MF_TID = g('MF_TID'), TERRAIN_RULES = g('TERRAIN_RULES');
const TID2KEY = {}; Object.keys(MF_TID).forEach(k => { TID2KEY[MF_TID[k]] = k; });
const caves = g('hqCaveRooms')();
const info = id => g('hqCaveInfo')(id);
const cellCentre = (inf, x, y) => ({ x: (x + 0.5) * inf.cell - inf.halfW, z: (y + 0.5) * inf.cell - inf.halfD });
/* the engine's move rule as delta-maps.test.js mirrors it: cardinal steps, |Δh| ≤ 1, no trees (a field has none) */
const unitReach = (H, sx, sy) => {
    const seen = new Set([sx + ',' + sy]), q = [[sx, sy]];
    while (q.length) {
        const [x, y] = q.shift();
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= S || ny >= S) continue;
            const k = nx + ',' + ny; if (seen.has(k)) continue;
            if (Math.abs(H[y][x] - H[ny][nx]) > 1) continue;
            seen.add(k); q.push([nx, ny]);
        }
    }
    return seen;
};
const heightsOf = raster => raster.cells.map(row => row.map(c => B + c.tile));

test('THE RULES + WHERE: an 8 × 8 window on the Δ\'s base; stage B = a WILD room with a cave grid — every chamber, never a box part, a site room or the facility', () => {
    assert.equal(S, 8); assert.equal(B, g('MF_DELTA_BASE_H'));
    assert.ok(R.rockMin >= 2 && R.rockPad >= 2, 'rock is never climbed');
    assert.equal(R.fluidMin, -1, 'a sheet sinks one level at most — the Δ\'s lake depth');
    assert.equal(R.prefix, 'field:'); assert.equal(R.teamSize, 4);
    const ok = g('hqFieldRoomOk');
    assert.ok(caves.length >= 7, 'the seven chambers');
    caves.forEach(id => assert.equal(ok(id), true, id));
    ['site_prebuilt_haunted_attic', 'site_prebuilt_derelict_hold', 'site_prebuilt_dumb', 'site_prebuilt_hollow_earth', 'central_egress', 'foyer', 'garage', 'nope'].forEach(id => assert.equal(ok(id), false, id + ' is not a cave'));
});

test('THE ID: field:<room>:<ox>,<oz> round-trips (negative origins too) and hqSiteId reads it as the room\'s site', () => {
    const mk = g('hqFieldId'), parse = g('hqFieldParse'), siteId = g('hqSiteId');
    const id = mk('site_prebuilt_hollow_earth_gallery', -3, 12);
    assert.equal(id, 'field:site_prebuilt_hollow_earth_gallery:-3,12');
    assert.deepEqual(J(parse(id)), { room: 'site_prebuilt_hollow_earth_gallery', ox: -3, oz: 12 });
    assert.equal(parse('prebuilt_dumb_delta'), null); assert.equal(parse('field:x'), null); assert.equal(parse(null), null);
    assert.equal(siteId(id), 'prebuilt_hollow_earth', 'the cave is Hollow Earth\'s');
    assert.equal(siteId('prebuilt_dumb_delta'), 'prebuilt_dumb'); assert.equal(siteId('prebuilt_cern'), 'prebuilt_cern');
    assert.equal(siteId('field:no_such_room:0,0'), 'field:no_such_room:0,0', 'an unknown room is nobody\'s site');
});

test('THE RASTER on every chamber and every legal window: rock never climbed, every key a terrain, THE GUARANTEE (a walker\'s step never splits a battle level; walker-reachable ⇒ unit-reachable)', () => {
    const raster = g('hqFieldRaster'), reach = g('hqFieldReach'), edgeH = g('hqCaveEdgeH');
    const STEP = g('HQ_CAVE_STEP'), DROP = g('HQ_CAVE_DROP');
    let windows = 0, edges = 0, starts = 0;
    for (const id of caves) {
        const inf = info(id);
        for (let oz = -(S - 1); oz < inf.h; oz++) for (let ox = -(S - 1); ox < inf.w; ox++) {
            const Ra = raster(id, ox, oz); windows++;
            assert.equal(Ra.cells.length, S); Ra.cells.forEach(row => assert.equal(row.length, S));
            let maxIn = -Infinity;
            for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
                const c = Ra.cells[y][x];
                assert.ok(MF_TID[c.key], id + ' ' + ox + ',' + oz + ' cell ' + x + ',' + y + ' key ' + c.key);
                assert.ok(TERRAIN_RULES[c.key], 'a terrain rule for ' + c.key);
                assert.ok(Number.isInteger(c.tile), 'an integer tile');
                const gx = ox + x, gy = oz + y, off = gx < 0 || gy < 0 || gx >= inf.w || gy >= inf.h;
                if (off) assert.equal(c.rock, true, 'past the grid is rock');
                if (c.rock) { assert.equal(c.in, false); assert.equal(c.tile, Ra.rockTile); }
                else {
                    assert.equal(c.src.rock, false);
                    if (c.fluid) assert.ok(c.tile >= R.fluidMin, 'a sheet never below the lake depth');
                    if (c.in) maxIn = Math.max(maxIn, c.tile);
                    if (c.hazard) assert.equal(c.in, false, 'a hazard the walker never enters is OUT');
                }
            }
            assert.ok(Ra.rockTile >= R.rockMin && (maxIn === -Infinity || Ra.rockTile >= maxIn + R.rockPad), 'rock over the tallest cell');
            /* THE GUARANTEE, edge by edge: an edge the walker steps (hqCaveReach's rule, either way) lands within one battle level */
            for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
                const a = Ra.cells[y][x]; if (!a.in) continue;
                for (const [dx, dy, sa, sb] of [[1, 0, 'e', 'w'], [0, 1, 's', 'n']]) {
                    const b = Ra.cells[y + dy] && Ra.cells[y + dy][x + dx]; if (!b || !b.in) continue;
                    const ha = edgeH(inf, a.src, sa), hb = edgeH(inf, b.src, sb); if (ha == null || hb == null) continue;
                    const steps = (hb - ha <= STEP && ha - hb <= DROP) || (ha - hb <= STEP && hb - ha <= DROP);
                    if (!steps) continue;
                    edges++;
                    assert.ok(Math.abs(a.tile - b.tile) <= 1, id + ' ' + ox + ',' + oz + ': the walker steps ' + a.src.ch + '→' + b.src.ch + ' at ' + x + ',' + y + ' but the tiles are ' + a.tile + '/' + b.tile);
                }
            }
            /* and as a BFS: from the first IN cell of every row, the walker's reach inside the window ⊆ the unit's on the built heights */
            const H = heightsOf(Ra);
            for (let y = 0; y < S; y++) {
                const x = Ra.cells[y].findIndex(c => c.in); if (x < 0) continue;
                const w = reach(Ra, x, y), u = unitReach(H, x, y); starts++;
                for (const k of w) assert.ok(u.has(k), id + ' ' + ox + ',' + oz + ' from ' + x + ',' + y + ': the walker reaches ' + k + ', the unit does not');
            }
        }
    }
    assert.ok(windows > 2000 && edges > 20000 && starts > 5000, 'the sweep ran: ' + windows + ' windows, ' + edges + ' edges, ' + starts + ' starts');
});

test('THE WINDOW\'S CHOICE from every door landing of every chamber: both feet inside, the walker\'s cell IN, the reach maximal over every candidate, the transform exact, the field / the seats / the eye read it like a board', () => {
    const win = g('hqFieldWindow'), raster = g('hqFieldRaster'), reach = g('hqFieldReach'), TRf = g('hqFieldTransform');
    const field = g('hqEncounterField'), seats = g('hqEncounterSeats'), eye = g('hqEncounterEye'), doorCell = g('hqCaveDoorCell');
    let n = 0;
    for (const id of caves) {
        const room = HQ.rooms[id], inf = info(id);
        for (const d of room.doors || []) {
            const dc = doorCell(room, d); if (!dc || !dc.walk) continue;
            const w = cellCentre(inf, dc.x, dc.y);
            /* the native two cells along whichever axis stays on a walkable cell, else beside */
            let tc = null;
            for (const [dx, dy] of [[2, 0], [-2, 0], [0, 2], [0, -2], [1, 0], [-1, 0], [0, 1], [0, -1]]) {
                const c = inf.cells[dc.y + dy] && inf.cells[dc.y + dy][dc.x + dx]; if (c && c.walk) { tc = c; break; }
            }
            if (!tc) continue;
            const t = cellCentre(inf, tc.x, tc.y);
            const W = win(id, w, t); n++;
            assert.ok(W && W.board && W.board.cave, id + ' ' + d.id + ': a window');
            assert.equal(W.room, id); assert.equal(W.site, 'prebuilt_hollow_earth');
            assert.equal(W.id, 'field:' + id + ':' + W.ox + ',' + W.oz);
            const cw = W.cells.walker, ct = W.cells.target;
            [cw, ct].forEach(c => assert.ok(c.x >= 0 && c.y >= 0 && c.x < S && c.y < S, 'inside the window'));
            assert.equal(cw.x + W.ox, dc.x); assert.equal(cw.y + W.oz, dc.y); assert.equal(ct.x + W.ox, tc.x); assert.equal(ct.y + W.oz, tc.y);
            assert.equal(W.raster.cells[cw.y][cw.x].in, true, 'the walker stands on an IN cell');
            assert.equal(W.reach, reach(W.raster, cw.x, cw.y).size);
            /* maximal: no other origin holding both feet reaches more */
            for (let oz = Math.max(dc.y, tc.y) - (S - 1); oz <= Math.min(dc.y, tc.y); oz++) for (let ox = Math.max(dc.x, tc.x) - (S - 1); ox <= Math.min(dc.x, tc.x); ox++) {
                const r = reach(raster(id, ox, oz), dc.x - ox, dc.y - oz).size;
                assert.ok(r <= W.reach, id + ' ' + d.id + ': origin ' + ox + ',' + oz + ' reaches ' + r + ' > ' + W.reach);
            }
            /* the transform: the window's own origin, exact to the millimetre */
            const T = TRf(W.board);
            assert.equal(T.N, S); assert.equal(T.C, inf.cell);
            assert.ok(Math.abs(T.x0 - (-inf.halfW + W.ox * inf.cell)) < 1e-9 && Math.abs(T.z0 - (-inf.halfD + W.oz * inf.cell)) < 1e-9);
            assert.deepEqual(J(T.cellOf(w)), J(cw)); assert.deepEqual(J(T.cellOf(t)), J(ct));
            const cc = T.centre(cw); assert.ok(Math.abs(cc.x - w.x) < 1e-6 && Math.abs(cc.z - w.z) < 1e-6, 'the cell\'s centre is the walker\'s own');
            const p = T.toRoom(2.25, 6.5), q = T.toTile(p.x, p.z); assert.ok(Math.abs(q.tx - 2.25) < 1e-9 && Math.abs(q.tz - 6.5) < 1e-9);
            /* the field record reads it like a site board: the cells, THE SLIDE's targets, THE EYE in tiles */
            const ev = { x: w.x + 0.3, z: w.z - 0.2, y: 0, target: { x: t.x, z: t.z, y: 0 }, board: W.board, eye: { x: w.x - 1.5, y: 1.7, z: w.z, dx: 0.9, dy: -0.3, dz: 0.1, ground: 0, px: w.x, pz: w.z, py: 0 } };
            const F = field(ev);
            assert.deepEqual(J(F.cells), J(W.cells));
            assert.ok(Math.abs(F.snap.walker.x - w.x) < 1e-6 && Math.abs(F.snap.walker.z - w.z) < 1e-6, 'the slide lands on the cell centre');
            assert.ok(Math.abs(F.board.x0 - T.x0) < 1e-9 && Math.abs(F.board.z0 - T.z0) < 1e-9, 'the record keeps the origin');
            const E = eye(F); assert.ok(E && isFinite(E.tx) && isFinite(E.tz) && E.up > 0, 'an eye seed in tiles');
            const free = (x, y) => { const c = W.raster.cells[y][x]; return c.in && !c.hazard; };
            const st = seats(F, { W: S, H: S, n1: 4, n2: 4, free });
            assert.ok(st, 'seats'); assert.deepEqual(J(st.lead[1]), J(cw)); assert.deepEqual(J(st.lead[2]), J(ct));
            assert.ok(st[1].every(c => free(c.x, c.y)) && st[2].every(c => free(c.x, c.y)), 'every seat on a free IN cell');
        }
    }
    assert.ok(n >= 14, 'every chamber\'s doors were walked: ' + n);
});

test('THE BUILD: the forge entry — 8 × 8, real tids, contiguous voxels on the bed, the heights, deep water flooding the layer under it, explicit spawns per seat on IN cells; hqFieldRegister files it under PREBUILT_MAPS + MAP_LAYOUT_PRESETS with the site Δ\'s env', () => {
    const id = 'site_prebuilt_hollow_earth_gallery', room = HQ.rooms[id], inf = info(id);
    const dc = g('hqCaveDoorCell')(room, room.doors[0]);
    const w = cellCentre(inf, dc.x, dc.y), t = cellCentre(inf, dc.x + 2, dc.y);
    const W = g('hqFieldWindow')(id, w, t);
    const e = g('hqFieldBuild')(id, W.ox, W.oz, { cells: W.cells });
    assert.ok(e, 'an entry'); assert.equal(e.w, S); assert.equal(e.h, S); assert.equal(e.isDelta, true);
    assert.equal(e.field.id, W.id); assert.equal(e.field.room, id); assert.equal(e.field.site, 'prebuilt_hollow_earth');
    assert.equal(e.field.cells.length, S, 'the ASCII record');
    assert.ok(Array.isArray(e.bed) && e.bed.length === 5, 'the shared bed');
    const Ra = W.raster;
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
        const c = Ra.cells[y][x], col = e.voxels[y][x], top = col[col.length - 1];
        assert.ok(TID2KEY[e.grid[y][x]], 'tid at ' + x + ',' + y);
        assert.equal(TID2KEY[e.grid[y][x]], c.key, 'the cell\'s key at ' + x + ',' + y);
        assert.equal(e.heightMap[y][x], B + c.tile, 'height at ' + x + ',' + y);
        assert.ok(col.length, 'a column'); assert.equal(top.z, e.heightMap[y][x]); assert.equal(top.tid, e.grid[y][x]);
        col.forEach((v, i) => { assert.equal(v.z, i, 'contiguous'); assert.ok(TID2KEY[v.tid]); });
        if (e.heightMap[y][x] >= B) for (let z = 0; z < 5; z++) assert.equal(TID2KEY[col[z].tid], e.bed[z], 'bed z' + z + ' at ' + x + ',' + y);
        if (c.rock) assert.equal(e.heightMap[y][x], B + Ra.rockTile);
        if (c.under) assert.equal(TID2KEY[col[B + c.tile - 1].tid], c.under, 'the layer under a deep sheet / a bridge at ' + x + ',' + y);
    }
    /* a deep sheet somewhere in the cave floods the layer under it */
    let deepSeen = false;
    for (let oz = 0; oz < inf.h && !deepSeen; oz++) for (let ox = 0; ox < inf.w && !deepSeen; ox++) {
        const Rb = g('hqFieldRaster')(id, ox, oz);
        if (Rb.cells.some(row => row.some(c => c.under))) {
            const eb = g('hqFieldBuild')(id, ox, oz);
            Rb.cells.forEach((row, y) => row.forEach((c, x) => { if (c.under) { assert.equal(TID2KEY[eb.voxels[y][x][B + c.tile - 1].tid], c.under); deepSeen = true; } }));
        }
    }
    assert.ok(deepSeen, 'the cavern\'s deep water was met');
    /* the spawns: the walker's cell is P1 seat 1, the native's P2 seat 1, four a side, all distinct, all IN */
    assert.equal(e.spawns[1].length, 4); assert.equal(e.spawns[2].length, 4);
    assert.deepEqual(J(e.spawns[1][0]), J(W.cells.walker)); assert.deepEqual(J(e.spawns[2][0]), J(W.cells.target));
    const all = e.spawns[1].concat(e.spawns[2]).map(p => p.x + ',' + p.y);
    assert.equal(new Set(all).size, 8, 'no shared seat');
    all.forEach(k => { const [x, y] = k.split(',').map(Number); assert.ok(Ra.cells[y][x].in && !Ra.cells[y][x].hazard, 'seat ' + k + ' on an IN cell'); });
    /* the registries */
    const reg = g('hqFieldRegister')(id, W.ox, W.oz, { cells: W.cells });
    assert.equal(reg.id, W.id);
    assert.equal(g('PREBUILT_MAPS')[W.id], reg.entry, 'PREBUILT_MAPS');
    const lay = g('MAP_LAYOUT_PRESETS')[W.id];
    assert.ok(lay && lay.env, 'a layout with the site\'s env');
    assert.equal(lay.env.near, 'hollow_earth'); assert.equal(lay.env.world.kind, 'cavern');
    assert.equal(lay.sections.earth.endRow, S - 1);
    assert.equal(reg.meta.field, true); assert.equal(reg.meta.isDelta, true); assert.equal(reg.meta.w, S); assert.equal(reg.meta.teamSize, 4);
    assert.ok(reg.meta.label.indexOf(R.label) >= 0);
    assert.ok(!g('EW_MAP_META').some(m => m.field), 'never on the roster — delta-maps.test.js never sees a field');
    /* re-registering the same window overwrites in place */
    const reg2 = g('hqFieldRegister')(id, W.ox, W.oz, { cells: W.cells });
    assert.equal(g('PREBUILT_MAPS')[W.id], reg2.entry);
});

test('THE SOURCE: map.js chooses the window in a cave, registers the field and launches its id; the terminal never lists a field row; data.js exports', () => {
    const fire = MP.slice(MP.indexOf('function _hqEncounterFire(ev)'), MP.indexOf('window._hqEncounterFire = _hqEncounterFire;'));
    ['window.hqFieldRoomOk(_hqCurRoom)', 'window.hqFieldWindow(_hqCurRoom, { x: ev.x, z: ev.z }, { x: ev.target.x, z: ev.target.z })', 'ev = Object.assign({}, ev, { board: win.board }); L.field = win;'].forEach(f => assert.ok(fire.includes(f), f));
    assert.ok(fire.indexOf('L.field = win') < fire.indexOf('window.hqEncounterField(ev)'), 'the window before the field record');
    const start = MP.slice(MP.indexOf('function _hqEncounterStart(L, ev, field)'), MP.indexOf('function _hqFieldRegister(win, field)'));
    ['const reg = _hqFieldRegister(L.field, field);', 'if (reg) { launchId = reg.id; window._hqEncounterRun.fieldId = reg.id; }', "MS_MAP_LIST.findIndex(m => m.modeId === L.site + '_delta')"].forEach(f => assert.ok(start.includes(f), f));
    const regf = MP.slice(MP.indexOf('function _hqFieldRegister(win, field)'), MP.indexOf('window._hqFieldRegister = _hqFieldRegister;'));
    ['window.hqFieldRegister(win.room, win.ox, win.oz', 'GAME_MODES[reg.id] = {', 'isPrebuilt: true, isDelta: true, field: true', 'MS_MAP_LIST.push(row)', 'MS_MAP_LIST[i] = row'].forEach(f => assert.ok(regf.includes(f), f));
    assert.ok(MP.includes("if (board && board.cave) return 'THE CAVE IS THE BOARD';"), 'the copy is true in a cave');
    assert.ok(MS.includes('if (m.field) return false;'), 'the terminal drops a field row');
    ['window.HQ_FIELD_RULES = HQ_FIELD_RULES;', 'window.hqFieldWindow = hqFieldWindow;', 'window.hqFieldRegister = hqFieldRegister;', 'window.hqFieldRaster = hqFieldRaster;'].forEach(f => assert.ok(DJ.includes(f), f));
    assert.ok(DJ.includes("if (s.indexOf('field:') === 0 && typeof hqFieldParse === 'function')"), 'hqSiteId reads a field id');
    assert.ok(DJ.includes("const x0 = (bb.x0 != null && isFinite(+bb.x0)) ? +bb.x0 : -half"), 'the transform takes an origin');
});
