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
    /* THE WAY BACK (2026-09-22): the record outlives the commit (_encRoomLast) — the debrief stands on the true ground, the return reads the eye; a plain match still publishes null */
    assert.match(BT, /window\._ewEncounterRoom = function \(\) \{ const m = _encMatch \|\| _encRoomLast; return m \? \{ room: m\.room \|\| null, field: m\.field \|\| null, fieldId: m\.fieldId \|\| null, site: m\.site \|\| null \} : null; \};/);
    assert.ok(BT.includes('_encRoomLast = _encMatch;   // a plain match never wears a room'));
    assert.match(TR, /run = \(typeof window\._ewEncounterRoom === 'function'\) \? window\._ewEncounterRoom\(\) : null;/, 'the renderer reads it');
});

/* a complex part's window, registered (the haunted hall — the reader, the matrix and the cover rule all read it) */
function hallWindow() {
    const id = 'site_prebuilt_haunted_hall', room = HQ.rooms[id], sp = room.spawn || { x: 0, z: 0 };
    const win = g('hqFieldWindow')(id, { x: sp.x || 0, z: sp.z || 0 }, { x: (sp.x || 0) + 1, z: sp.z || 0 });
    const reg = g('hqFieldRegister')(win.room, win.ox, win.oz, { cells: win.cells });
    return { id, win, reg };
}

test('the reader: a complex part is drawn at its window and a cave chamber at its window; the `site_<id>` alias / no run / the hall / the kill-switch are not', () => {
    const { B, W } = bridgeCtx();
    assert.equal(B.room(), null, 'no run = no room');
    const { id, win, reg } = hallWindow();
    W._ewEncounterRoom = () => ({ room: id, field: { board: win.board }, fieldId: reg.id, site: 'prebuilt_haunted' });
    const R = B.room();
    assert.ok(R && R.roomId === id && R.T.N === win.board.N, 'a part is drawn at its window');
    assert.equal(B.room(), R, 'the same run (a fresh marker object each call) → the cached record');
    assert.match(B.key(), new RegExp('^hq:' + id + ':-?\\d+\\.\\d\\d,-?\\d+\\.\\d\\d$'), 'the scenery key names the room and the window');
    assert.match(TR, /var ck = run\.room \+ '\|' \+ \(run\.fieldId \|\| ''\) \+ '\|' \+ \(bd \? \[bd\.N, bd\.C, bd\.x0, bd\.z0, bd\.half\]\.join\(','\) : ''\);/, 'the cache keys on the run\'s content');
    /* the board rooms are gone (2026-09-27): the `site_<id>` alias is no room to draw */
    W._ewEncounterRoom = () => ({ room: 'site_prebuilt_camelot', field: { board: { N: 8, C: 1.75, x0: 0, z0: 0 } } });
    assert.equal(B.room(), null, 'the alias is never drawn');
    /* Phase 9 polish (2026-09-16): a cave chamber IS drawn — its rock, ledges and pools round the window (the
       builder cuts the window out through the scratch record's floorHole; the field's columns fill it) */
    /* THE TERRAIN ROOMS (2026-09-17): no room wears the grid any more — a synthetic chamber keeps the cave path honest */
    const cave = '__lab_cave';
    HQ.rooms[cave] = { kind: 'box', site: 'prebuilt_hollow_earth', part: 'lab', label: 'LAB', shell: { w: 14, d: 14, h: 6 }, cave: { rows: ['########', '#......#', '#......#', '########'] }, doors: [], props: [] };
    W._ewEncounterRoom = () => ({ room: cave, field: { board: { N: 8, C: 1.75, x0: 0, z0: 0, cave: true } } });
    const Rc = B.room();
    assert.ok(Rc && Rc.cave && Rc.T && Rc.T.N === 8, 'a cave is drawn at its window');
    assert.ok(TR.includes("if (R.cave) { try { _hqBuildCave(copy); }"), 'the cave is built on the scratch record, before the shell');
    assert.ok(TR.includes("var hole = _hq.floorHole || null;") && TR.includes("if (!c.rock && inHole(x, y)) continue;   // the field's column stands for it"), 'the window is cut out of the cave (its rock stays)');
    delete HQ.rooms[cave];
    /* the hall (the rotunda) is never a field */
    W._ewEncounterRoom = () => ({ room: 'central_egress', field: { board: { N: 8, C: 1.75, x0: 0, z0: 0 } } });
    assert.equal(B.room(), null);
    /* the kill-switch */
    W._ewEncounterRoom = () => ({ room: id, field: { board: win.board }, fieldId: reg.id });
    W.EW_HQ_NO_ROOM_IN_BATTLE = true;
    assert.equal(B.room(), null, 'EW_HQ_NO_ROOM_IN_BATTLE');
    assert.equal(B.key(), '', 'no room = an empty key share');
    W.EW_HQ_NO_ROOM_IN_BATTLE = false;
});

test('the matrix: room metres → the battle\'s tiles — the window\'s NW corner on tile (0,0), the floor on the base top, ts / C px per metre', () => {
    const { B, W } = bridgeCtx();
    const ts = 128, U = HQ.units;
    const { id, win, reg } = hallWindow();
    W._ewEncounterRoom = () => ({ room: id, field: { board: win.board }, fieldId: reg.id });
    const R = B.room(), M = B.matrix(R, ts), C = R.T.C;
    assert.ok(R && R.field && Array.isArray(R.field.cells), 'a part reads its raster');
    assert.equal(R.base, g('HQ_FIELD_RULES').base);
    const s = M.s.x, P = M.p;
    assert.ok(Math.abs(s - (ts / C) / U) < 1e-12, 'the scale is the battle\'s px per metre over the HQ\'s');
    /* a room point (xm, zm) lands at (xm − x0)·ts/C: the NW corner at 0 */
    const at = (xm, ym, zm) => ({ x: xm * U * s + P.x, y: ym * U * s + P.y, z: zm * U * s + P.z });
    const nw = at(R.T.x0, 0, R.T.z0), cell = at(R.T.x0 + 2.5 * C, 0, R.T.z0 + 6.5 * C);
    assert.ok(Math.abs(nw.x) < 1e-6 && Math.abs(nw.z) < 1e-6, 'the window\'s origin on tile (0,0)');
    assert.ok(Math.abs(cell.x - 2.5 * ts) < 1e-6 && Math.abs(cell.z - 6.5 * ts) < 1e-6, 'cell (2,6)\'s centre on tile (2,6)\'s');
    assert.ok(Math.abs(nw.y - R.base * ts) < 1e-9, 'the floor on the base level\'s top (ELEV_STEP_RATIO 1)');
    assert.ok(Math.abs(at(0, 2.7, 0).y - (R.base * ts + 2.7 * ts / C)) < 1e-6, 'a 2.7 m wall top is 2.7 / C tiles up');
});

test('the cover rule: a prop on a raised IN cell of the raster is left to the column; the floor, rock and the outside are not covers', () => {
    const { B, W } = bridgeCtx();
    const { id, win, reg } = hallWindow();
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
    for (const f of ['_hqBuildBoxShell(copy)', '_hqBuildGallery(copy)', '_hqBuildDoors(copy)', '_hqBuildCounters(copy)', '_hqPlaceProps(copy)']) assert.ok(bb.includes(f), f);
    assert.match(bb, /var saved = _hq;[\s\S]*_hq = H;[\s\S]*finally \{ _hq = saved; \}/, 'the live record is restored whatever happens');
    assert.match(bb, /\n\s*H\.floorHole = \{ x0: R\.T\.x0, x1: R\.T\.x0 \+ R\.T\.N \* C, z0: R\.T\.z0, z1: R\.T\.z0 \+ R\.T\.N \* C \};/, 'a box room\'s floor is cut to the window');
    assert.match(bb, /var drop = \{ ceil: true \};/, 'what a part drops (the ceiling)');
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
    assert.match(sh, /ap\._ew_hqGround = true; ap\._ew_hqPart = 'floor';/);
    assert.match(sh, /sk\._ew_hqGround = true; sk\._ew_hqPart = 'floor';/);
    assert.match(sh, /m\._ew_hqWall = ws\[0\]; m\._ew_hqPart = \(edge === 'walls'\) \? 'wall' : 'edge';/, 'every slab knows its side and its part');
    assert.equal((sh.match(/_ew_hqPart = 'pipe';/g) || []).length, 4, 'the four conduit pieces');
    assert.equal((sh.match(/_ew_hqPart = 'strip';/g) || []).length, 2, 'the strip and its glow');
    /* the floor hole */
    assert.match(sh, /else if \(_hq\.floorHole\) \{/);
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

test('the data side: the box field\'s layout says the room is drawn round the window (no near, no motion, the world inert)', () => {
    assert.match(DJ, /if \(env && opts\.box\) \{ delete env\.near; delete env\.motion; env\.world = \{ kind: 'room' \}; env\.scenery = 'none'; \}/);   // THE SKY ONCE (delivery 5): no far roster for a field
    assert.match(DJ, /_hqBuildRoomInBattle reads battle\.js _ewEncounterRoom/);
});
