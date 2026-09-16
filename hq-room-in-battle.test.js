// hq-room-in-battle.test.js — THE ROOM ROUND THE FIELD (PHASE9_QUALITY_PLAN §10
// stage 4 / §11.2 rule 9 — Phase 9 Delivery 10, 2026-09-16).
// A match launched by a STRIKE in the building draws the strike's ROOM round its
// board: three-renderer.js runs the HQ builders on a scratch record standing in
// for `_hq`, bakes every piece through ONE matrix (room metres → tiles:
// hqFieldTransform's rule — cell (0,0)'s NW corner on tile (0,0)'s, the floor on
// the base level's top) and hangs the lot in the scenery group. Guards: the
// marker (battle.js `_ewEncounterRoom` off the latched run), the reader
// (`_hqBattleRoom` in a vm: a site's board room, a mismatched board, a cave, a
// complex part with its raster, the kill-switch, the cache), the matrix, the
// cover rule, the scenery hook (the key + the three call sites), the part tags
// the bridge filters on (the shell's floor / ceiling / walls / pipes / strips,
// the doors / ways / wall props wearing their wall), the floor hole, the
// dressing split off the site board. Repo-only.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { loadGameData } = require('./load-data');
const D = loadGameData(), HQ = D.DOOR_HQ;
const g = name => vm.runInContext(name, D);
const TR = fs.readFileSync(__dirname + '/three-renderer.js', 'utf8');
const BT = fs.readFileSync(__dirname + '/battle.js', 'utf8');
const DJ = fs.readFileSync(__dirname + '/data.js', 'utf8');

/* the reader + the matrix + the cover rule, evaluated in data.js's own sandbox with the renderer's few reads stubbed */
function bridgeCtx() {
    const a = TR.indexOf('    var HQ_BATTLE_ROOM_LIGHTS = 4;'), b = TR.indexOf('    function _hqBuildRoomInBattle(ctx) {');
    assert.ok(a > 0 && b > a, 'the bridge block stands before _hqBuildRoomInBattle');
    const src = TR.slice(a, b);
    const W = g('window');
    W.EW_HQ_NO_ROOM_IN_BATTLE = false; W._ewEncounterRoom = null;
    const THREE = {
        Matrix4: class { compose(p, q, s) { this.p = p; this.s = s; return this; } },
        Vector3: class { constructor(x, y, z) { this.x = x; this.y = y; this.z = z; } },
        Quaternion: class {},
    };
    vm.runInContext('var _hqData = function () { return DOOR_HQ; }; var _hqUnits = function () { return DOOR_HQ.units; }; var ELEV_STEP_RATIO = 1.0; var THREE = null;', D);
    D.THREE = THREE;
    vm.runInContext(src + '\nwindow.__bridge = { room: _hqBattleRoom, key: _hqBattleRoomKey, matrix: _hqBattleRoomMatrix, coverAt: _hqBattleRoomCoverAt, cache: _hqBattleRoomCache };', D);
    return { B: W.__bridge, W };
}

test('the marker: battle.js publishes the latched run\'s room, field and field id — null outside an encounter', () => {
    assert.match(BT, /window\._ewEncounterRoom = function \(\) \{ return _encMatch \? \{ room: _encMatch\.room \|\| null, field: _encMatch\.field \|\| null, fieldId: _encMatch\.fieldId \|\| null, site: _encMatch\.site \|\| null \} : null; \};/);
    assert.match(TR, /run = \(typeof window\._ewEncounterRoom === 'function'\) \? window\._ewEncounterRoom\(\) : null;/, 'the renderer reads it');
});

test('the reader: a site\'s board room is drawn at its centred board and a cave chamber at its window; a mismatched board / no run / the kill-switch are not', () => {
    const { B, W } = bridgeCtx();
    const site = 'site_prebuilt_camelot', S = HQ.rooms[site].shell;
    assert.equal(B.room(), null, 'no run = no room');
    W._ewEncounterRoom = () => ({ room: site, field: { board: { N: S.grid.cells, C: S.grid.cell, half: S.grid.cells * S.grid.cell / 2 } }, fieldId: null, site: 'prebuilt_camelot' });
    const R = B.room();
    assert.ok(R && R.site, 'a site room');
    assert.equal(R.T.N, S.grid.cells);
    assert.ok(Math.abs(R.T.x0 + S.grid.cells * S.grid.cell / 2) < 1e-9 && Math.abs(R.T.z0 - R.T.x0) < 1e-9, 'the board is centred: x0 = z0 = −half');
    assert.equal(R.base, g('hqSiteBoardInfo')('prebuilt_camelot').base, 'the floor stands on the Δ\'s base level');
    assert.equal(R.field, null, 'a site room has no raster (no covers)');
    assert.equal(B.room(), R, 'the same run (a fresh marker object each call) → the cached record');
    assert.match(B.key(), /^hq:site_prebuilt_camelot:-7\.0\d,-7\.0\d$/, 'the scenery key names the room and the window');
    assert.match(TR, /var ck = run\.room \+ '\|' \+ \(run\.fieldId \|\| ''\) \+ '\|' \+ \(bd \? \[bd\.N, bd\.C, bd\.x0, bd\.z0, bd\.half\]\.join\(','\) : ''\);/, 'the cache keys on the run\'s content');
    /* the console filed the FULL site from the room: the board is not the room's */
    W._ewEncounterRoom = () => ({ room: site, field: { board: { N: 16, C: S.grid.cell, half: 8 * S.grid.cell } } });
    assert.equal(B.room(), null, 'a 16-wide board is not the room\'s Δ');
    /* Phase 9 polish (2026-09-16): a cave chamber IS drawn — its rock, ledges and pools round the window (the
       builder cuts the window out through the scratch record's floorHole; the field's columns fill it) */
    const cave = g('hqCaveRooms')()[0];
    W._ewEncounterRoom = () => ({ room: cave, field: { board: { N: 8, C: 1.75, x0: 0, z0: 0, cave: true } } });
    const Rc = B.room();
    assert.ok(Rc && Rc.cave && !Rc.site && Rc.T && Rc.T.N === 8, 'a cave is drawn at its window');
    assert.ok(TR.includes("if (R.cave) { try { _hqBuildCave(copy); }"), 'the cave is built on the scratch record, before the shell');
    assert.ok(TR.includes("var hole = _hq.floorHole || null;") && TR.includes("if (!c.rock && inHole(x, y)) continue;   // the field's column stands for it"), 'the window is cut out of the cave (its rock stays)');
    /* the hall (the rotunda) is never a field */
    W._ewEncounterRoom = () => ({ room: 'central_egress', field: { board: { N: 8, C: 1.75, x0: 0, z0: 0 } } });
    assert.equal(B.room(), null);
    /* the kill-switch */
    W._ewEncounterRoom = () => ({ room: site, field: { board: { N: S.grid.cells, C: S.grid.cell } } });
    W.EW_HQ_NO_ROOM_IN_BATTLE = true;
    assert.equal(B.room(), null, 'EW_HQ_NO_ROOM_IN_BATTLE');
    assert.equal(B.key(), '', 'no room = an empty key share');
    W.EW_HQ_NO_ROOM_IN_BATTLE = false;
});

test('the matrix: room metres → the battle\'s tiles — the window\'s NW corner on tile (0,0), the floor on the base top, ts / C px per metre', () => {
    const { B, W } = bridgeCtx();
    const site = 'site_prebuilt_camelot', S = HQ.rooms[site].shell, ts = 128, C = S.grid.cell, U = HQ.units;
    W._ewEncounterRoom = () => ({ room: site, field: { board: { N: S.grid.cells, C, half: S.grid.cells * C / 2 } } });
    const R = B.room(), M = B.matrix(R, ts);
    const s = M.s.x, P = M.p;
    assert.ok(Math.abs(s - (ts / C) / U) < 1e-12, 'the scale is the battle\'s px per metre over the HQ\'s');
    /* a room point (xm, zm) lands at (xm − x0)·ts/C: the board's centre at (N/2)·ts, the NW corner at 0 */
    const at = (xm, ym, zm) => ({ x: xm * U * s + P.x, y: ym * U * s + P.y, z: zm * U * s + P.z });
    const nw = at(R.T.x0, 0, R.T.z0), c = at(0, 0, 0), cell = at(R.T.x0 + 2.5 * C, 0, R.T.z0 + 6.5 * C);
    assert.ok(Math.abs(nw.x) < 1e-6 && Math.abs(nw.z) < 1e-6, 'cell (0,0)\'s NW corner on tile (0,0)\'s');
    assert.ok(Math.abs(c.x - S.grid.cells * ts / 2) < 1e-6 && Math.abs(c.z - S.grid.cells * ts / 2) < 1e-6, 'the room\'s centre on the board\'s');
    assert.ok(Math.abs(cell.x - 2.5 * ts) < 1e-6 && Math.abs(cell.z - 6.5 * ts) < 1e-6, 'cell (2,6)\'s centre on tile (2,6)\'s');
    assert.ok(Math.abs(nw.y - R.base * ts) < 1e-9, 'the floor on the base level\'s top (ELEV_STEP_RATIO 1)');
    assert.ok(Math.abs(at(0, 2.7, 0).y - (R.base * ts + 2.7 * ts / C)) < 1e-6, 'a 2.7 m wall top is 2.7 / C tiles up');
    /* a field's window carries its own origin */
    const id = 'site_prebuilt_haunted_hall', room = HQ.rooms[id], sp = room.spawn || { x: 0, z: 0 };
    const win = g('hqFieldWindow')(id, { x: sp.x || 0, z: sp.z || 0 }, { x: (sp.x || 0) + 1, z: sp.z || 0 });
    const reg = g('hqFieldRegister')(win.room, win.ox, win.oz, { cells: win.cells });
    W._ewEncounterRoom = () => ({ room: id, field: { board: win.board }, fieldId: reg.id });
    const R2 = B.room(), M2 = B.matrix(R2, ts);
    assert.ok(R2 && !R2.site && R2.field && Array.isArray(R2.field.cells), 'a part reads its raster');
    assert.equal(R2.base, g('HQ_FIELD_RULES').base);
    const nw2 = { x: win.board.x0 * U * M2.s.x + M2.p.x, z: win.board.z0 * U * M2.s.z + M2.p.z };
    assert.ok(Math.abs(nw2.x) < 1e-6 && Math.abs(nw2.z) < 1e-6, 'the window\'s origin on tile (0,0)');
});

test('the cover rule: a prop on a raised IN cell of the raster is left to the column; the floor, rock and the outside are not covers', () => {
    const { B, W } = bridgeCtx();
    const id = 'site_prebuilt_haunted_hall', room = HQ.rooms[id], sp = room.spawn || { x: 0, z: 0 };
    const win = g('hqFieldWindow')(id, { x: sp.x || 0, z: sp.z || 0 }, { x: (sp.x || 0) + 1, z: sp.z || 0 });
    const reg = g('hqFieldRegister')(win.room, win.ox, win.oz, { cells: win.cells });
    W._ewEncounterRoom = () => ({ room: id, field: { board: win.board }, fieldId: reg.id });
    const R = B.room(), C = R.T.C, cells = R.field.cells;
    let raised = null, floor = null, rock = null;
    for (let y = 0; y < cells.length && !(raised && floor && rock); y++) for (let x = 0; x < cells[y].length; x++) {
        const ch = cells[y][x];
        if (!raised && ch >= '2' && ch <= '9') raised = [x, y];
        if (!floor && ch === '1') floor = [x, y];
        if (!rock && ch === '#') rock = [x, y];
    }
    assert.ok(raised && floor && rock, 'the hall\'s window has the landing (+2), the floor and the rock row: ' + cells.join('/'));
    const centre = c => [R.T.x0 + (c[0] + 0.5) * C, R.T.z0 + (c[1] + 0.5) * C];
    assert.equal(B.coverAt(R, ...centre(raised)), true, 'the landing is a cover');
    assert.equal(B.coverAt(R, ...centre(floor)), false, 'the floor is not');
    assert.equal(B.coverAt(R, ...centre(rock)), false, 'rock is the wall, not a cover');
    assert.equal(B.coverAt(R, R.T.x0 - 5, R.T.z0 - 5), false, 'outside the window is not');
    /* a site room has no raster: nothing is ever a cover */
    const site = 'site_prebuilt_camelot', S = HQ.rooms[site].shell;
    W._ewEncounterRoom = () => ({ room: site, field: { board: { N: S.grid.cells, C: S.grid.cell } } });
    assert.equal(B.coverAt(B.room(), 0, 0), false);
});

test('the scenery hook: the key carries the room, the room is built at every scene.add site, after the world', () => {
    assert.match(TR, /\+ ',' \+ _hqBattleRoomKey\(\);\s*\/\/ THE ROOM ROUND THE FIELD/, 'the horizon key');
    const fn = TR.slice(TR.indexOf('    function _buildHorizonScenery() {'), TR.indexOf('    // ════', TR.indexOf('    function _buildHorizonScenery() {')));
    const adds = fn.match(/scene\.add\(_horizonGroup\)/g) || [];
    assert.equal(adds.length, 3, 'three scene.add sites');
    assert.equal((fn.match(/_worldBuild\(nearCtx\);\s*_hqBuildRoomInBattle\(nearCtx\);\s*scene\.add\(_horizonGroup\);/g) || []).length, 2, 'the two early returns');
    assert.match(fn, /_worldBuild\(nearCtx\);[^\n]*\n\s*_hqBuildRoomInBattle\(nearCtx\);[^\n]*\n\s*scene\.add\(_horizonGroup\);\s*\n\s*\}/, 'the end of the function');
    /* the build: the scratch record, the board guard, the copy without the marker, the six builders, the restore */
    const bb = TR.slice(TR.indexOf('    function _hqBuildRoomInBattle(ctx) {'), TR.indexOf('    function _hqEnter(opts) {'));
    assert.match(bb, /if \(ctx\.bw !== R\.T\.N \|\| ctx\.bh !== R\.T\.N\) return;/, 'the board the battle built must be the window');
    assert.match(bb, /c\.id !== 'battle' && c\.proc !== 'battle_marker'/, 'no battle marker on the board');
    for (const f of ['_hqBuildBoxShell(copy)', '_hqBuildGallery(copy)', '_hqBuildSiteDressing(copy)', '_hqBuildDoors(copy)', '_hqBuildCounters(copy)', '_hqPlaceProps(copy)']) assert.ok(bb.includes(f), f);
    assert.match(bb, /var saved = _hq;[\s\S]*_hq = H;[\s\S]*finally \{ _hq = saved; \}/, 'the live record is restored whatever happens');
    assert.match(bb, /if \(!R\.site\) H\.floorHole = \{ x0: R\.T\.x0, x1: R\.T\.x0 \+ R\.T\.N \* C, z0: R\.T\.z0, z1: R\.T\.z0 \+ R\.T\.N \* C \};/, 'a box room\'s floor is cut to the window');
    assert.match(bb, /var drop = R\.site \? \{ floor: true, ceil: true, pipe: true, strip: true, wall: walled \} : \{ ceil: true \};/, 'what a site room / a part drops');
    assert.match(bb, /var holder = function \(name\) \{ var h = new THREE\.Group\(\); h\.name = name; h\.applyMatrix4\(M\); h\._ew_occNear = true; return h; \};/, 'every piece rides a holder carrying the one matrix (a GLB prop re-places itself in room units when it lands)');
    assert.match(bb, /if \(c\._ew_hqWall\) wallOf\(c\._ew_hqWall\)\.add\(c\);\s*\n\s*else \{ var h = holder\('hq_piece'\); h\.add\(c\); g\.add\(h\); \}/, 'a wall piece into its side, the rest under its own holder');
    assert.match(bb, /var wg = holder\('hq_wall_' \+ side\); wg\._ew_occWall = side; wg\._ew_occFadeTarget = 0\.04;/, 'per-side occlusion wall groups');
    assert.match(bb, /if \(_facilityNearGroup\) \{[^\n]*_facilityNearGroup\.add\(c\);[^\n]*\}\s*\n\s*else \{ _facilityNearGroup = g; _horizonGroup\.add\(g\); \}/, 'the fade\'s roots');
    assert.match(bb, /propLights: Math\.max\(0, HQ_PROP_LIGHT_MAX - HQ_BATTLE_ROOM_LIGHTS\)/, 'the light cap');
    assert.match(bb, /H\.fxPulse\.forEach\(function \(p\) \{ if \(p && p\.mat\) _hzGlowPulse\.push\(p\); \}\);/, 'the glows breathe under the battle');
});

test('the part tags the bridge filters on: the shell\'s floor / ceiling / walls / pipes / strips, the doors / ways / wall props wearing their wall', () => {
    const sh = TR.slice(TR.indexOf('    function _hqBuildBoxShell(room) {'), TR.indexOf('    function _hqBuildGallery(room) {'));
    assert.match(sh, /ce\._ew_hqPart = 'ceil';/);
    assert.match(sh, /fl\._ew_hqPart = 'floor';/);
    assert.match(sh, /band\._ew_hqPart = 'floor';/, 'the site frame');
    assert.match(sh, /ap\._ew_hqGround = true; ap\._ew_hqPart = 'floor';/);
    assert.match(sh, /sk\._ew_hqGround = true; sk\._ew_hqPart = 'floor';/);
    assert.match(sh, /m\._ew_hqWall = ws\[0\]; m\._ew_hqPart = \(edge === 'walls'\) \? 'wall' : 'edge';/, 'every slab knows its side and its part');
    assert.equal((sh.match(/_ew_hqPart = 'pipe';/g) || []).length, 4, 'the four conduit pieces');
    assert.equal((sh.match(/_ew_hqPart = 'strip';/g) || []).length, 2, 'the strip and its glow');
    /* the floor hole */
    assert.match(sh, /\} else if \(_hq\.floorHole\) \{/);
    assert.match(sh, /var hx0 = Math\.max\(-W \/ 2, FH\.x0\), hx1 = Math\.min\(W \/ 2, FH\.x1\), hz0 = Math\.max\(-Dp \/ 2, FH\.z0\), hz1 = Math\.min\(Dp \/ 2, FH\.z1\);/, 'the hole clipped to the room');
    assert.match(sh, /hb\._ew_hqPart = 'floor';/);
    /* the doors, the ways, the wall props */
    const dr = TR.slice(TR.indexOf('    function _hqBuildDoors(room) {'), TR.indexOf('    function _hqBuildCounters(room) {'));
    assert.match(dr, /if \(box && typeof door\.wall === 'string' && door\.wall !== 'free'\) grp\._ew_hqWall = door\.wall;/);
    const wy = TR.slice(TR.indexOf('    function _hqBuildWay(room, door, level, y0, Rw, inward) {'), TR.indexOf('    function _hqBuildDoors(room) {'));
    assert.match(wy, /if \(box && !box\.free && typeof door\.wall === 'string'\) grp\._ew_hqWall = door\.wall;/);
    const pp = TR.slice(TR.indexOf('    function _hqPlaceProps(room) {'), TR.indexOf('    function _hqPlaceWedgeRing('));
    assert.match(pp, /if \(box && typeof p\.wall === 'string'\) grp\._ew_hqWall = p\.wall;/);
});

test('the dressing split off the site board: signs, signboards, masts, lamps and strips build without the board', () => {
    const a = TR.indexOf('    function _hqBuildSiteBoard(room) {'), b = TR.indexOf('    function _hqBuildSiteDressing(room) {'), c = TR.indexOf('    function _hqBuildSetting(room) {');
    assert.ok(a > 0 && b > a && c > b, 'board → dressing → setting');
    const board = TR.slice(a, b), dress = TR.slice(b, c);
    assert.match(board, /_hqBuildSiteDressing\(room\);\s*\n\s*\}\s*$/m, 'the board ends by calling the dressing');
    assert.ok(!board.includes("the site's signs"), 'the signs left the board');
    assert.ok(dress.includes("the site's signs") && dress.includes('lamp masts on the walkway corners') && dress.includes('the containment lamps in the corners') && dress.includes('fluorescent strips near the top'), 'all four sections');
    /* self-contained: the dressing computes its own kit and never reads the board's locals */
    assert.match(dress, /var GR = S\.grid \|\| \{ cells: 8, cell: 1\.75 \}, C = GR\.cell, CM = C \* U;/);
    assert.match(dress, /var pulse = function \(mat, opAmp, spd\)/);
    for (const bad of [/\binfo\./, /\bcellX\(/, /\bstepTol\b/, /\bmatCache\b/, /\btintOf\(/, /\bhalf\b/]) assert.ok(!bad.test(dress.replace(/\/\*[\s\S]*?\*\//g, '')), 'the dressing does not read ' + bad);
});

test('the data side: the box field\'s layout says the room is drawn round the window (no near, no motion, the world inert)', () => {
    assert.match(DJ, /if \(env && opts\.box\) \{ delete env\.near; delete env\.motion; env\.world = \{ kind: 'room' \}; \}/);
    assert.match(DJ, /_hqBuildRoomInBattle reads battle\.js _ewEncounterRoom/);
});
