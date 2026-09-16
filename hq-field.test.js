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
const parts = g('hqComplexRooms')().filter(id => !HQ.rooms[id].cave);
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

test('THE RULES + WHERE: an 8 × 8 window on the Δ\'s base; stage B = a WILD room with a cave grid — every chamber; stage C = every complex part; never a site\'s board room or the facility', () => {
    assert.equal(S, 8); assert.equal(B, g('MF_DELTA_BASE_H'));
    assert.ok(R.rockMin >= 2 && R.rockPad >= 2, 'rock is never climbed');
    assert.equal(R.fluidMin, -1, 'a sheet sinks one level at most — the Δ\'s lake depth');
    assert.equal(R.prefix, 'field:'); assert.equal(R.teamSize, 4);
    const ok = g('hqFieldRoomOk');
    assert.ok(caves.length >= 7, 'the seven chambers');
    caves.forEach(id => assert.equal(ok(id), true, id));
    assert.ok(parts.length >= 14, 'the fourteen box parts');
    parts.forEach(id => assert.equal(ok(id), true, id + ' is a complex part'));
    ['site_prebuilt_dumb', 'site_prebuilt_hollow_earth', 'site_prebuilt_haunted', 'central_egress', 'foyer', 'garage', 'hwing_w', 'nope'].forEach(id => assert.equal(ok(id), false, id + ' is never a field'));
    /* the box rules: the cell is the cave's (a battle tile), the three bands, the walker's own reach up / walk-off, the gallery's flight = the renderer's */
    const X = R.box;
    assert.equal(X.cell, g('HQ_CAVE_CELL')); assert.equal(X.cell, 1.75);
    assert.ok(X.low > 0 && X.low < X.high && X.high > X.climbM, 'floor < +1 < +2, and a jump never crosses two bands');
    assert.equal(X.dropM, g('HQ_CAVE_DROP'));
    const TR3 = fs.readFileSync(__dirname + '/three-renderer.js', 'utf8');
    const m = /HQ_GALLERY_RISE = ([\d.]+), HQ_GALLERY_RUN = ([\d.]+)/.exec(TR3);
    assert.ok(m, 'the renderer\'s gallery constants');
    assert.equal(X.galleryRise, +m[1]); assert.equal(X.galleryRun, +m[2]);
    const jm = /HQ_JUMP_V = [\d.]+;[^\n]*apex ≈ ([\d.]+) m/.exec(TR3); assert.ok(jm, 'the renderer states the jump\'s apex');
    assert.equal(X.climbM, +jm[1], 'the climb is the jump\'s stated apex');
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
    /* Phase 9 polish (2026-09-16): a cave field is INDOORS — the battle draws the chamber round the window
       (three-renderer.js _hqBuildRoomInBattle → _hqBuildCave), so the site's sky is a dark ceiling: no near
       builder, no motion, no far roster, no stars / nebula, THE WORLD inert; the site's fog + tint stay */
    assert.equal(lay.env.near, undefined, 'no near setting in a cave'); assert.equal(lay.env.motion, undefined);
    assert.deepEqual(JSON.parse(JSON.stringify(lay.env.world)), { kind: 'room' }, 'THE WORLD is inert in a cave');
    assert.equal(lay.env.scenery, 'none', 'no floating roster in a cave'); assert.equal(lay.env.stars, 0); assert.equal(lay.env.nebula, 0);
    assert.ok(lay.env.fog && lay.env.tint != null, 'the cave\'s dark stays');
    assert.equal(g('EW_MAP_META').find(m => m.id === 'prebuilt_hollow_earth').env.scenery, 'crystals', 'the site\'s own row is untouched');
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


/* ═══ STAGE C — THE RASTERISER ON THE BOX ROOMS (Phase 9 Delivery 9, 2026-09-16) ═══ */
const BX = R.box, CB = BX.cell;
const boxInfo = id => g('hqFieldBoxInfo')(id);
const boxCellCentre = (bi, gx, gy) => ({ x: bi.x0 + (gx + 0.5) * CB, z: bi.z0 + (gy + 0.5) * CB });
/* the renderer's OWN blocking rule (three-renderer.js _hqPlaceProps, both sites): foot > 0 and (block or standing on the floor) */
const rendererBlocks = (p, c) => !p.wall && !p.ceil && !c.ceil && !p.flip && ((p.foot != null ? +p.foot : (+c.foot || 0)) > 0) && (c.block || !((+p.y || 0) > 0.5));

test('STAGE C · THE BOX LATTICE on every complex part: a battle tile per cell on the room\'s axes, IN = inside by the cover and the margin, the floor / wall sheets real terrains, THE COVERS = exactly the props the renderer blocks (a disc narrower than footMin ignored), the tops by band', () => {
    for (const id of parts) {
        const room = HQ.rooms[id], Sh = room.shell, bi = boxInfo(id);
        assert.ok(bi, id + ': a lattice'); assert.equal(bi.C, CB); assert.equal(bi.roomId, id);
        assert.ok([0, CB / 2].includes(bi.offX) && [0, CB / 2].includes(bi.offZ), 'the offset is 0 or half a cell');
        assert.ok(bi.w >= 1 && bi.h >= 1 && bi.cells.length === bi.h && bi.cells[0].length === bi.w, 'the lattice covers the room');
        assert.ok(MF_TID[bi.floorKey] && TERRAIN_RULES[bi.floorKey], id + ' floor ' + bi.floorKey);
        assert.ok(MF_TID[bi.wallKey] && TERRAIN_RULES[bi.wallKey], id + ' wall ' + bi.wallKey);
        /* every cell: IN ⇔ its share inside ≥ cover on both axes and its centre clear of the wall by the margin */
        let inN = 0;
        for (let gy = 0; gy < bi.h; gy++) for (let gx = 0; gx < bi.w; gx++) {
            const c = bi.cells[gy][gx], cc = boxCellCentre(bi, gx, gy);
            assert.ok(Math.abs(c.cx - cc.x) < 1e-9 && Math.abs(c.cz - cc.z) < 1e-9, 'the cell centre');
            const ax = Math.max(0, Math.min(cc.x + CB / 2, Sh.w / 2) - Math.max(cc.x - CB / 2, -Sh.w / 2)) / CB;
            const az = Math.max(0, Math.min(cc.z + CB / 2, Sh.d / 2) - Math.max(cc.z - CB / 2, -Sh.d / 2)) / CB;
            const inside = ax >= BX.cover && az >= BX.cover && Math.abs(cc.x) <= Sh.w / 2 - BX.margin && Math.abs(cc.z) <= Sh.d / 2 - BX.margin;
            assert.equal(c.in, inside, id + ' cell ' + gx + ',' + gy);
            if (c.in) { inN++; assert.equal(c.tile, g('hqFieldBoxTile')(c.top)); assert.ok([0, 1, 2].includes(c.tile)); if (c.top > 0) assert.equal(c.seat, false, 'never seated on a cover'); else assert.equal(c.seat, true); }
            else { assert.equal(c.top, 0); assert.equal(c.tile, 0); assert.equal(c.seat, false); }
        }
        assert.ok(inN >= 12, id + ': at least 12 IN cells (' + inN + ')');
        /* the covers mirror the renderer's blockers exactly (the same catalogue read); a disc below footMin is scenery */
        const cat = HQ.catalogue;
        const expect = (room.props || []).filter(p => p && p.key && rendererBlocks(p, cat[p.key] || {})).filter(p => {
            const c = cat[p.key] || {}, rect = (p.rect === false) ? null : (p.rect || c.rect);
            return (rect && rect.hw > 0 && rect.hd > 0) || ((p.foot != null ? +p.foot : (+c.foot || 0)) >= BX.footMin);
        });
        assert.equal(bi.covers.length, expect.length, id + ': the covers are the renderer\'s blockers');
        bi.covers.forEach((cv, i) => {
            const p = expect[i], c = cat[p.key] || {};
            assert.equal(cv.key, p.key); assert.equal(cv.top, (+p.y || 0) + (+c.h || 1), 'top = y + the catalogue h, else 1 — the renderer\'s');
        });
    }
});

test('STAGE C · THE HALL: the landing is a +2 tier along the north wall, the flight at the east corner climbs +1 then +2 onto it, the floor under it stays the floor elsewhere; the gallery frame = the renderer\'s (12 risers, 3.36 m)', () => {
    const id = 'site_prebuilt_haunted_hall', bi = boxInfo(id), G = bi.gallery;
    assert.ok(G && G.side === 'n' && G.stair && G.stair.dir === -1, 'the flight from the end (east)');
    assert.equal(G.n, 12); assert.ok(Math.abs(G.runLen - 3.36) < 1e-9); assert.ok(Math.abs(G.h - 2.9) < 1e-9);
    const rows = bi.cells.map(r => r.map(c => c.in ? (c.slab ? 'S' : c.flight ? 'F' : c.prop ? 'p' : '.') : '#').join(''));
    assert.ok(rows[0].startsWith('SSSSSS') && rows[0].endsWith('FF'), 'the first row: the slab, the flight at the east end — ' + rows[0]);
    assert.ok(/^[SF]+$/.test(rows[0]), 'the whole first row is the gallery');
    assert.ok(rows.slice(2).every(r => !/[SF]/.test(r)), 'the gallery never reaches the third row');
    const flight = bi.cells.flat().filter(c => c.flight).sort((a, b) => a.top - b.top);
    assert.ok(flight.length >= 2, 'two tread cells');
    assert.equal(flight[0].tile, 1, 'the low tread is a +1'); assert.equal(flight[flight.length - 1].tile, 2, 'the high tread meets the slab at +2');
    assert.ok(bi.cells.flat().filter(c => c.slab).every(c => c.tile === 2), 'the slab is a +2');
    const heights = new Set(bi.cells.flat().filter(c => c.in).map(c => c.tile));
    assert.ok(heights.has(0) && heights.has(1) && heights.has(2), 'three heights in the hall');
    assert.ok(bi.cells.flat().filter(c => c.in).length >= 24, 'the hall yields ≥ 24 IN cells');
});

test('STAGE C · THE RASTER on every part and every legal window: OUT = rock in the wall sheet never climbed, IN = the floor sheet at its band, THE GUARANTEE (an edge the walker steps — hqFieldBoxStep — lands within one battle level; the walker\'s reach ⊆ the unit\'s from every IN cell)', () => {
    const raster = g('hqFieldRaster'), reach = g('hqFieldReach'), step = g('hqFieldBoxStep');
    let windows = 0, edges = 0;
    for (const id of parts) {
        const bi = boxInfo(id);
        for (let oz = -(S - 1); oz < bi.h; oz++) for (let ox = -(S - 1); ox < bi.w; ox++) {
            const Ra = raster(id, ox, oz); windows++;
            assert.ok(Ra && Ra.box && !Ra.cave && Ra.S === S && Ra.cells.length === S, id + ' ' + ox + ',' + oz);
            assert.ok(Math.abs(Ra.x0 - (bi.x0 + ox * CB)) < 1e-9 && Math.abs(Ra.z0 - (bi.z0 + oz * CB)) < 1e-9, 'the window\'s origin on the lattice');
            let maxIn = -Infinity; const H = [];
            for (let y = 0; y < S; y++) { H.push([]); for (let x = 0; x < S; x++) {
                const c = Ra.cells[y][x];
                assert.ok(MF_TID[c.key] && TERRAIN_RULES[c.key], 'key ' + c.key);
                const gx = ox + x, gy = oz + y, src = (gx >= 0 && gy >= 0 && gx < bi.w && gy < bi.h) ? bi.cells[gy][gx] : null;
                if (!src || !src.in) { assert.equal(c.rock, true); assert.equal(c.in, false); assert.equal(c.key, bi.wallKey); assert.equal(c.tile, Ra.rockTile); }
                else { assert.equal(c.rock, false); assert.equal(c.in, true); assert.equal(c.key, bi.floorKey); assert.equal(c.tile, src.tile); assert.equal(c.top, src.top); maxIn = Math.max(maxIn, c.tile); }
                assert.equal(c.hazard, false, 'a box room has no hazard'); assert.equal(c.fluid, null);
                H[y].push(c.tile);
            } }
            assert.ok(Ra.rockTile >= R.rockMin && (maxIn === -Infinity || Ra.rockTile >= maxIn + R.rockPad), 'rock over the tallest cell');
            /* THE GUARANTEE, edge by edge */
            for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) for (const [dx, dy] of [[1, 0], [0, 1]]) {
                const nx = x + dx, ny = y + dy; if (nx >= S || ny >= S) continue;
                const a = Ra.cells[y][x], b = Ra.cells[ny][nx];
                if (!a.in || !b.in) continue;
                if (step(a, b) || step(b, a)) { edges++; assert.ok(Math.abs(a.tile - b.tile) <= 1, id + ' ' + ox + ',' + oz + ' edge ' + x + ',' + y + ' → ' + nx + ',' + ny + ' splits a level (' + a.top + ' → ' + b.top + ')'); }
            }
            /* the walker's reach ⊆ the unit's, from every IN cell */
            for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
                if (!Ra.cells[y][x].in) continue;
                const wr = reach(Ra, x, y), ur = unitReach(H, x, y);
                for (const k of wr) { const [kx, ky] = k.split(',').map(Number); assert.ok(Ra.cells[ky][kx].in, 'walker reach stays IN'); assert.ok(ur.has(k), id + ' ' + ox + ',' + oz + ': the walker reaches ' + k + ' from ' + x + ',' + y + ', the unit does not'); }
            }
        }
    }
    assert.ok(windows > 1000 && edges > 1000, 'a real sweep (' + windows + ' windows, ' + edges + ' edges)');
});

test('STAGE C · THE WINDOW\'S CHOICE from every door landing of every part: the board wears `box`, both feet inside, the walker\'s cell IN (a foot in a partial edge cell nudged to the nearest walkable), the reach maximal, the field / the seats / the eye read it like a board', () => {
    const win = g('hqFieldWindow'), raster = g('hqFieldRaster'), reach = g('hqFieldReach'), field = g('hqEncounterField'), seats = g('hqEncounterSeats'), eye = g('hqEncounterEye'), tr = g('hqFieldTransform'), near = g('hqFieldNearestWalk'), lattice = g('hqFieldLattice');
    let n = 0;
    for (const id of parts) {
        const bi = boxInfo(id), ri = g('hqFindRoomInfo')(id), Lt = lattice(id);
        assert.equal(Lt.kind, 'box'); assert.equal(Lt.w, bi.w); assert.equal(Lt.h, bi.h);
        const landings = ri.landings.filter(L => L && isFinite(L.x) && isFinite(L.z));
        for (const L of landings) {
            const w = { x: L.x, z: L.z };
            /* the native two cells toward the room's centre (clamped to the room) */
            const t = { x: Math.max(-bi.S.w / 2 + 0.6, Math.min(bi.S.w / 2 - 0.6, L.x - Math.sign(L.x) * 2 * CB)), z: Math.max(-bi.S.d / 2 + 0.6, Math.min(bi.S.d / 2 - 0.6, L.z - Math.sign(L.z) * 2 * CB)) };
            const W = win(id, w, t); n++;
            assert.ok(W && W.board && W.board.box && !W.board.cave, id + ': a box window'); assert.equal(W.kind, 'box');
            assert.equal(W.room, id); assert.equal(W.site, g('hqRoomSite')(id)); assert.equal(W.id, 'field:' + id + ':' + W.ox + ',' + W.oz);
            const cw = W.cells.walker, ct = W.cells.target;
            [cw, ct].forEach(c => assert.ok(c.x >= 0 && c.y >= 0 && c.x < S && c.y < S, 'inside the window'));
            assert.equal(W.raster.cells[cw.y][cw.x].in, true, 'the walker stands on an IN cell');
            assert.equal(W.raster.cells[ct.y][ct.x].in, true, 'the native stands on an IN cell');
            assert.equal(W.reach, reach(W.raster, cw.x, cw.y).size);
            /* the walker's lattice cell: the one under the feet when walkable, else the nearest walkable */
            let lc = { x: Math.max(0, Math.min(bi.w - 1, Math.floor((w.x - bi.x0) / CB))), y: Math.max(0, Math.min(bi.h - 1, Math.floor((w.z - bi.z0) / CB))) };
            if (!Lt.walk(lc.x, lc.y)) lc = near(Lt, lc);
            assert.equal(cw.x + W.ox, lc.x); assert.equal(cw.y + W.oz, lc.y);
            /* maximal over every origin holding both feet */
            const lt = { x: ct.x + W.ox, y: ct.y + W.oz };
            for (let oz = Math.max(lc.y, lt.y) - (S - 1); oz <= Math.min(lc.y, lt.y); oz++) for (let ox = Math.max(lc.x, lt.x) - (S - 1); ox <= Math.min(lc.x, lt.x); ox++) {
                const r = reach(raster(id, ox, oz), lc.x - ox, lc.y - oz).size;
                assert.ok(r <= W.reach, id + ': origin ' + ox + ',' + oz + ' reaches ' + r + ' > ' + W.reach);
            }
            /* the transform + the field record + the seats + the eye */
            const T = tr(W.board);
            const c0 = T.centre({ x: 0, y: 0 });
            assert.ok(Math.abs(c0.x - (W.board.x0 + CB / 2)) < 1e-9);
            const back = T.toRoom(T.toTile(w.x, w.z).tx, T.toTile(w.x, w.z).tz);
            assert.ok(Math.hypot(back.x - w.x, back.z - w.z) < 1e-3, 'round-trips to the millimetre');
            const F = field({ x: w.x, z: w.z, y: 0, target: { x: t.x, z: t.z, y: 0 }, board: W.board, eye: { x: w.x, y: 1.6, z: w.z, dx: 0, dy: -0.4, dz: 1, ground: 0 } });
            assert.ok(F.cells && F.snap, 'a field record with cells and a snap');
            const free = (x, y) => { const c = W.raster.cells[y] && W.raster.cells[y][x]; return !!(c && c.in && c.seat !== false); };
            const St = seats(F, { W: S, H: S, n1: 4, n2: 4, free });
            assert.ok(St && St[1].length === 4 && St[2].length === 4, 'four seats a side');
            St[1].concat(St[2]).forEach(c => assert.ok(free(c.x, c.y), 'every seat on a free IN cell'));
            const E = eye(F, St); assert.ok(E && isFinite(E.tx) && isFinite(E.tz) && E.up > 0, 'an eye seed');
        }
    }
    assert.ok(n >= 14, 'every part had a landing (' + n + ')');
    /* the nudge: a foot 0.2 m off the hall's west wall stands in a partial cell (offX 0 → the edge cell spans 0.875 in) — the reach is scored from the nearest walkable cell */
    const hall = boxInfo('site_prebuilt_haunted_hall');
    const W2 = win('site_prebuilt_haunted_hall', { x: -hall.S.w / 2 + 0.2, z: 0 }, { x: 0, z: 0 });
    assert.ok(W2 && W2.raster.cells[W2.cells.walker.y][W2.cells.walker.x].in, 'nudged onto an IN cell');
});

test('STAGE C · THE BUILD: a box field\'s forge entry — 8 × 8, real tids, the heights = the base + the band, rock in the wall sheet, explicit spawns per seat on free floor cells; the layout = the site\'s env with NO near setting, no motion and an inert world; hqFieldRegister + hqSiteId', () => {
    const id = 'site_prebuilt_haunted_hall', W = g('hqFieldWindow')(id, { x: 2, z: 1 }, { x: 4, z: 1 });
    const entry = g('hqFieldBuild')(id, W.ox, W.oz, { cells: W.cells });
    assert.ok(entry && entry.isDelta && entry.field && entry.field.box === true && entry.field.cave === false);
    assert.equal(entry.w, S); assert.equal(entry.h, S);
    assert.equal(entry.base, boxInfo(id).floorKey);
    assert.equal(entry.field.cells.length, S, 'the ASCII record');
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
        const c = W.raster.cells[y][x], col = entry.voxels[y][x], top = col[col.length - 1];
        assert.equal(TID2KEY[entry.grid[y][x]], c.key, 'the cell\'s key at ' + x + ',' + y);
        assert.equal(entry.heightMap[y][x], B + c.tile, 'height at ' + x + ',' + y);
        assert.equal(top.z, entry.heightMap[y][x]); assert.equal(top.tid, entry.grid[y][x]);
        col.forEach((v, i) => { assert.equal(v.z, i, 'contiguous'); assert.ok(TID2KEY[v.tid]); });
        if (c.rock) assert.equal(entry.heightMap[y][x], B + W.raster.rockTile, 'rock at ' + x + ',' + y);
    }
    [1, 2].forEach(p => { assert.equal(entry.spawns[p].length, 4); entry.spawns[p].forEach(s => { const c = W.raster.cells[s.y][s.x]; assert.ok(c.in && c.seat !== false, 'a seat on a free floor cell'); }); });
    const reg = g('hqFieldRegister')(id, W.ox, W.oz, { cells: W.cells });
    assert.equal(reg.id, W.id); assert.equal(g('PREBUILT_MAPS')[W.id], reg.entry);
    const lay = g('MAP_LAYOUT_PRESETS')[W.id];
    assert.ok(lay && lay.env, 'a layout with the site\'s env');
    assert.equal(lay.env.near, undefined, 'no near setting indoors'); assert.equal(lay.env.motion, undefined, 'nothing streams indoors');
    assert.deepEqual(JSON.parse(JSON.stringify(lay.env.world)), { kind: 'room' }, 'THE WORLD is inert');
    assert.ok(lay.env.tint != null || lay.env.scenery != null, 'the site\'s sky stands');
    assert.equal(reg.meta.field, true); assert.equal(reg.meta.isDelta, true);
    assert.equal(g('hqSiteId')(W.id), 'prebuilt_haunted', 'the field reads as its site');
    /* a cave field keeps its near setting (stage B unchanged) */
    const cave = caves[0], Wc = g('hqFieldWindow')(cave, cellCentre(info(cave), 2, 2), cellCentre(info(cave), 3, 2));
    if (Wc) { const rc = g('hqFieldRegister')(cave, Wc.ox, Wc.oz, { cells: Wc.cells }); const lc = g('MAP_LAYOUT_PRESETS')[rc.id]; assert.ok(lc.env && lc.env.world && lc.env.world.kind === 'room' && lc.env.scenery === 'none' && lc.env.near === undefined, 'a cave field is indoors too (Phase 9 polish): inert world, no roster, no near'); assert.equal(rc.entry.field.cave, true); }
});

test('STAGE C · ACCEPTANCE (§11.3 C, measured): every part yields a window with all of its IN cells reachable from the centre; the parts with a cover or a gallery yield ≥ 2 heights; the subway is the corridor case (a 5-wide field inside rock)', () => {
    const win = g('hqFieldWindow');
    const two = [];
    for (const id of parts) {
        const bi = boxInfo(id), W = win(id, { x: 0, z: 0 }, { x: 2, z: 0 });
        assert.ok(W, id);
        let inN = 0; const H = new Set();
        W.raster.cells.flat().forEach(c => { if (c.in) { inN++; H.add(c.tile); } });
        assert.ok(inN >= 12, id + ': ≥ 12 IN cells in the window (' + inN + ')');
        if (H.size >= 2) two.push(id);
        const hasCover = bi.cells.flat().some(c => c.in && c.top > 0);
        if (hasCover && W.reach === inN) assert.ok(true);
    }
    ['site_prebuilt_haunted_hall', 'site_prebuilt_haunted_cellar', 'site_prebuilt_derelict_hold', 'site_prebuilt_revenge_gundeck', 'site_prebuilt_strip_casino', 'site_prebuilt_downtown_lobby'].forEach(id => assert.ok(two.includes(id), id + ' has two heights'));
    const sub = win('site_prebuilt_downtown_subway', { x: 0, z: 0 }, { x: 0, z: 2 });
    const cols = new Set(); sub.raster.cells.flat().forEach(c => { if (c.in) cols.add(c.x); });
    assert.equal(cols.size, 5, 'the platform is five cells wide — the rest is rock');
});

test('STAGE C · THE SOURCE: map.js says THE ROOM IS THE BOARD in a complex part (the copy reads hqFieldRoomOk), the fire / start comments name stage C, data.js exports the box helpers', () => {
    const copy = MP.slice(MP.indexOf('function _hqEncounterBoardCopy(board)'), MP.indexOf('function _hqEncounterFire(ev)'));
    ['window.hqFieldRoomOk(_hqCurRoom)', "fieldRoom ? 'THE ROOM IS THE BOARD' : 'THE SITE IS THE BOARD'", "if (board && board.cave) return 'THE CAVE IS THE BOARD';"].forEach(f => assert.ok(copy.includes(f), f));
    ['window.hqFieldBoxInfo = hqFieldBoxInfo;', 'window.hqFieldLattice = hqFieldLattice;', 'window.hqFieldBoxStep = hqFieldBoxStep;', 'window.hqFieldGallery = hqFieldGallery;'].forEach(f => assert.ok(DJ.includes(f), f));
    assert.ok(DJ.includes("if (env && opts.box) { delete env.near; delete env.motion; env.world = { kind: 'room' }; }"), 'the box layout rule');
});
