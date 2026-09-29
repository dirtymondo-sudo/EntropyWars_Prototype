// world-doc.test.js — THE EDITOR, phase E0 (EDITOR_PLAN.md §4 + §8, 2026-09-29).
//
// mondo's ruling when E0 started: "start from a flat empty world and hand carve and place and design everything myself".
// Holds the world file to that: NEW WORLD is one flat, empty Room 1 the compiler takes; his rooms (`w_` ids) lay over DOOR_HQ
// by reference and come out again; a library room copies in with the doors that lead outside his world left out; the
// derivations re-run. Then editor.js's pure core (the zip, the command stack, a row in space) runs headless, and the wiring
// (map.js loads editor.js on demand, the renderer's edit hook, index.html names editor.js and the world id) is pinned.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { loadGameData } = require('./load-data.js');

const G = loadGameData();
const plain = v => JSON.parse(JSON.stringify(v));   // the sandbox's arrays are another realm's: compare them as data
const read = f => fs.readFileSync(path.join(__dirname, f), 'utf8');
const core = (() => { const sb = { window: {} }; vm.createContext(sb); vm.runInContext(read('editor.js'), sb, { filename: 'editor.js' }); return sb.window.EWEditorCore; })();

test('NEW WORLD: one flat, empty Room 1 (the ruling)', () => {
    const doc = G.hqWorldDocNew();
    assert.deepStrictEqual(plain(Object.keys(doc.rooms)), ['w_room1']);
    assert.strictEqual(doc.start.room, 'w_room1');
    assert.strictEqual(doc.live, false, 'nothing in the player\'s game leads into it until THE SWAP (E8)');
    const r = doc.rooms.w_room1;
    assert.strictEqual(r.label, 'Room 1');
    assert.strictEqual(G.hqWorldDocRoomOk(r), null);
    assert.strictEqual(r.terrain.features.length, 0);
    for (const k of ['props', 'doors', 'counters', 'npcSpots', 'agents']) assert.strictEqual(r[k].length, 0, k + ' empty');
    assert.ok(r.shell.open && r.terrain.outer && r.terrain.outer.flat, 'open, and the plain runs on flat past the edge');
    assert.strictEqual(r.terrain.gen, undefined, 'no generated floor plan');
    assert.strictEqual(r.terrain.noise, undefined, 'no noise');
});

test('the flat room compiles flat', () => {
    const doc = G.hqWorldDocNew(), r = doc.rooms.w_room1;
    const info = G.hqTerrainCompile(r, 'w_room1');
    for (const [x, z] of [[0, 0], [30, -20], [-60, 60], [63, -63]]) assert.strictEqual(G.hqTerrainHeight(info, x, z), 0, 'height at ' + x + ',' + z);
});

test('his rooms lay over DOOR_HQ by reference, and come out again', () => {
    const R = G.DOOR_HQ.rooms, doc = G.hqWorldDocNew();
    doc.rooms.w_room2 = G.hqWorldDocNewRoom('w_room2', { w: 40, d: 30 });
    doc.rooms.w_room1.doors.push({ id: 'r1', wall: 'free', x: 2, z: 3, face: 0, leaf: 'leaf_office', action: { room: 'w_room2', at: 'r1' } });
    doc.rooms.w_room2.doors.push({ id: 'r1', wall: 'free', x: 0, z: 4, face: 180, leaf: 'leaf_office', action: { room: 'w_room1', at: 'r1' } });
    const res = G.hqWorldDocApply(doc);
    assert.deepStrictEqual(plain(res.bad), []);
    assert.strictEqual(R.w_room1, doc.rooms.w_room1, 'the same object (the editor edits what the game walks)');
    assert.strictEqual(R.w_room2.shell.w, 40);
    assert.strictEqual(String(R.w_room1.doors[0].label).toLowerCase(), 'room 2', 'the plate reads the target room (hqReplateDoors)');
    const bad = G.hqWorldDocApply({ rooms: { w_room9: { kind: 'box', shell: {} } } });
    assert.strictEqual(bad.bad.length, 1, 'a room the runtime cannot take is refused, never thrown');
    assert.strictEqual(R.w_room9, undefined);
    G.hqWorldDocRemoveRoom('w_room2'); G.hqWorldDocRemoveRoom('w_room1');
    assert.strictEqual(R.w_room1, undefined);
    assert.strictEqual(R.w_room2, undefined);
});

test('ids: his rooms are w_roomN, never a data.js id', () => {
    const doc = G.hqWorldDocNew();
    assert.strictEqual(G.hqWorldDocNextRoomId(doc), 'w_room2', 'the next free number (his doc and DOOR_HQ both)');
    doc.rooms.w_room2 = G.hqWorldDocNewRoom('w_room2'); doc.rooms.w_room7 = G.hqWorldDocNewRoom('w_room7');
    assert.strictEqual(G.hqWorldDocNextRoomId(doc), 'w_room3', 'the lowest free number');
    assert.ok(G.hqWorldDocIsOwn('w_room3') && !G.hqWorldDocIsOwn('central_egress'));
    for (const id of Object.keys(G.DOOR_HQ.rooms)) assert.ok(!G.hqWorldDocIsOwn(id), 'data.js has no w_ room: ' + id);
    const r = { terrain: { features: [{ k: 'wall' }, { k: 'hill', id: 'r5' }] }, props: [{ key: 'x' }], doors: [] };
    G.hqWorldDocRowIds(r);
    const ids = r.terrain.features.map(f => f.id).concat(r.props.map(p => p.id));
    assert.strictEqual(new Set(ids).size, ids.length, 'every row a unique id');
    assert.ok(ids.every(Boolean));
});

test('COPY INTO WORLD: a library room becomes his, the doors that lead outside his world left out', () => {
    const lib = Object.keys(G.DOOR_HQ.rooms).find(k => { const r = G.DOOR_HQ.rooms[k]; return r.kind === 'box' && r.terrain && (r.doors || []).length; });
    assert.ok(lib, 'a library room with terrain and doors');
    const c = G.hqWorldDocCopyRoom(lib, 'w_room2', { w_room1: 1 });
    assert.ok(c && c.room);
    assert.strictEqual(c.room.terrain.seedOf, lib, 'the same noise as the source');
    assert.strictEqual(c.room.doors.length, 0);
    assert.strictEqual(c.dropped, (G.DOOR_HQ.rooms[lib].doors || []).length);
    for (const k of G.HQ_WORLD_DOC_RULES.copyDrop) assert.strictEqual(c.room[k], undefined, k + ' dropped');
    assert.notStrictEqual(c.room.terrain, G.DOOR_HQ.rooms[lib].terrain, 'a copy, not the library\'s own rows');
    assert.strictEqual(G.hqWorldDocRoomOk(c.room), null);
});

test('the derivations the rebuild re-runs are the ones that read rooms', () => {
    assert.deepStrictEqual(Array.from(G.HQ_WORLD_DOC_DERIVATIONS), ['terrainInfo', 'hqRefreshComplexLinks', 'hqReplateDoors']);
    const ran = G.hqWorldDocRebuild([]);
    assert.ok(ran.includes('hqReplateDoors'));
});

test('editor core: the zip reads back', () => {
    assert.strictEqual(core.crc32(core.utf8('123456789')).toString(16), 'cbf43926');
    const files = [{ name: 'Assets/World/world.json', data: core.utf8('{"v":1}') }, { name: 'Assets/World/rooms/w_room1.json', data: core.utf8('{"label":"Room 1 — é"}') }];
    const z = core.zipStore(files, new Date(2026, 8, 29));
    const back = core.unzip(z);
    assert.deepStrictEqual(plain(back.map(e => e.name)), files.map(f => f.name));
    assert.strictEqual(core.utf8dec(back[1].data), '{"label":"Room 1 — é"}');
    assert.ok(back.every(e => e.method === 0));
});

test('editor core: every step undoes (insert, remove, set, add a key)', () => {
    const doc = { rooms: { w_room1: { props: [{ id: 'r1' }], terrain: { features: [] } } } };
    const snap = JSON.stringify(doc);
    const step = [
        { path: ['rooms', 'w_room1', 'props', 1], before: undefined, after: { id: 'r2', key: 'crate' } },
        { path: ['rooms', 'w_room1', 'props', 0], before: { id: 'r1' }, after: undefined },
        { path: ['rooms', 'w_room1', 'terrain', 'features', 0], before: undefined, after: { id: 'r3', k: 'hill' } },
        { path: ['rooms', 'w_room1', 'label'], before: undefined, after: 'Room 1' },
        { path: ['rooms', 'w_room2'], before: undefined, after: { label: 'Room 2' } },
    ];
    core.stepDo(doc, step);
    assert.deepStrictEqual(plain(doc.rooms.w_room1.props), [{ id: 'r2', key: 'crate' }]);
    assert.strictEqual(doc.rooms.w_room1.label, 'Room 1');
    assert.deepStrictEqual(plain(core.stepRooms(step).sort()), ['w_room1', 'w_room2']);
    core.stepUndo(doc, step);
    assert.strictEqual(JSON.stringify(doc), snap);
});

test('editor core: a row in space (move, turn clockwise, size)', () => {
    const wall = { k: 'wall', x0: 0, z0: 0, x1: 4, z1: 0, h: 3 };
    assert.deepStrictEqual(plain(core.rowTransform(wall, { dx: 1, dz: 2 })), { k: 'wall', x0: 1, z0: 2, x1: 5, z1: 2, h: 3 });
    const t = core.rowTransform(wall, { rot: 90, px: 0, pz: 0 });   // east turns to south (z grows south, yaw clockwise from north)
    assert.deepStrictEqual([t.x1, t.z1].map(v => v + 0), [0, 4]);
    const prop = { key: 'crate', x: 2, z: 0, face: 350 };
    assert.strictEqual(core.rowTransform(prop, { rot: 20, px: 2, pz: 0 }).face, 10);
    const hill = { k: 'hill', x: 0, z: 0, r: 8, h: 3 };
    assert.strictEqual(core.rowTransform(hill, { sx: 2, sy: 1, sz: 2 }).r, 16);
    const door = { id: 'r1', wall: 'n', x: 3, leaf: 'leaf_office' };
    const d2 = core.rowTransform(door, { dx: 2, dz: 5, axis: 'x' });
    assert.deepStrictEqual([d2.x, d2.z], [5, undefined], 'a wall door slides along its wall only');
    const rid = { k: 'ridge', pts: [[0, 0], [10, 0]], w: 4 };
    assert.deepStrictEqual(plain(core.rowTransform(rid, { dx: 1 }).pts), [[1, 0], [11, 0]]);
});

test('editor core: every ADD kind is a row the world takes, with a pick box', () => {
    const doc = G.hqWorldDocNew(), r = doc.rooms.w_room1;
    core.KINDS.forEach((K, i) => { const row = core.kindRow(K.id, (i % 5) * 12 - 24, Math.floor(i / 5) * 12 - 18); assert.ok(row && row.k, K.id); r.terrain.features.push(row); });
    G.hqWorldDocRowIds(r);
    assert.strictEqual(G.hqWorldDocRoomOk(r), null);
    const info = G.hqTerrainCompile(r, 'w_room1');
    assert.ok(info && info.nx > 0, 'it compiles');
    for (const row of r.terrain.features) {
        if ((row.k === 'grove' || row.k === 'scatter') && !isFinite(row.x)) continue;
        assert.ok(core.rowShape(row, () => 0).length > 0, 'a pick box for ' + row.k);
    }
    const kinds = new Set(core.KINDS.map(K => core.kindRow(K.id, 0, 0).k));
    for (const k of ['wall', 'rail', 'ramp', 'spiral', 'deck', 'bridge', 'plateau', 'hill', 'dip', 'ridge', 'pool', 'stream', 'path', 'tree', 'grove', 'scatter', 'climb']) assert.ok(kinds.has(k), 'ADD has ' + k);
});

test('the wiring: loaded on demand, the renderer\'s edit hook, the world id', () => {
    const map = read('map.js'), tr = read('three-renderer.js'), html = read('index.html');
    assert.match(map, /window\._goToEditor = function/);
    assert.match(map, /window\._hqEditEnter = function/);
    assert.match(map, /window\.EW_EDITOR_URL \|\| 'editor\.js'/);
    assert.match(map, /id: 'edit',\s+label: 'EDIT'/, 'the pause menu opens this room in the editor');
    assert.match(tr, /function _hqEditing\(H\)/);
    assert.match(tr, /if \(OO\.flat\) return edgeH;/);
    assert.match(html, /window\.EW_EDITOR_URL = 'https:\/\/cdn\.entropywars\.net\/editor\.js\?v=\d{8}[a-z0-9-]*-cors';/);
    assert.match(html, /window\._EW_WORLD_ID = '[0-9a-f]*';/);
    assert.ok(!/<script[^>]+editor\.js/.test(html), 'the player\'s page never loads editor.js');
    assert.match(read('deploy.js'), /--world/);
    assert.match(read('editor.js'), /three@0\.128\.0\/examples\/js\/controls\/TransformControls\.js/);
});
