// editor-shapes.test.js — THE EDITOR, phase E1 (EDITOR_PLAN.md §5, 2026-09-29): shapes and buildings.
//
// The rows E1 adds are expanded by data.js before the compiler reads them (hqRoomExpand): an `opening` cuts its wall into pieces
// (a door gap you walk through, a window with a sill, a lintel and glass), a `prefab` placement lays his own group of rows turned /
// mirrored / moved (nested ones too), a `kit` calls one of the game's own builders on the allow-list only, a `texbuilding` is the
// city's textured block and walks as four faces with a roof. A hung wall (the lintel) blocks only the band it hangs in.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { loadGameData } = require('./load-data.js');

const G = loadGameData();
const plain = v => JSON.parse(JSON.stringify(v));
const read = f => fs.readFileSync(path.join(__dirname, f), 'utf8');
const core = (() => { const sb = { window: {} }; vm.createContext(sb); vm.runInContext(read('editor.js'), sb, { filename: 'editor.js' }); return sb.window.EWEditorCore; })();
const flatRoom = feats => { const doc = G.hqWorldDocNew(), r = doc.rooms.w_room1; r.terrain.features = feats; return r; };
const near = (a, b, e) => Math.abs(a - b) <= (e || 1e-3);

test('an opening cuts its wall: a door gap walks through, a window has a sill, a lintel and glass', () => {
    const wall = { id: 'r1', k: 'wall', x0: -6, z0: 0, x1: 6, z1: 0, h: 3, t: 0.25 };
    const X = G.hqRoomExpand({ terrain: { features: [wall, { id: 'r2', k: 'opening', wall: 'r1', at: 6, w: 1.2, h: 2.2, sill: 0 }] } });
    const w = X.features.filter(f => f.k === 'wall');
    assert.ok(w.length >= 3, 'two solid runs and a lintel');
    assert.ok(!X.features.some(f => f.k === 'opening'), 'the opening row itself is gone');
    const lintel = w.filter(p => p.lift > 0);
    assert.strictEqual(lintel.length, 1); assert.ok(near(lintel[0].lift, 2.2));
    assert.ok(w.every(p => p.span && p.span.length === 4), 'every piece samples the whole wall\'s ground');
    const info = G.hqTerrainCompile(flatRoom([wall, { id: 'r2', k: 'opening', wall: 'r1', at: 6, w: 1.2, h: 2.2, sill: 0 }]), 'w_room1');
    assert.ok(!G.hqTerrainWallAt(info, 0, 0, 0.3, 0, 1.8), 'the body walks through the gap');
    assert.ok(G.hqTerrainWallAt(info, -3, 0, 0.3, 0, 1.8), 'the solid wall still blocks');
    assert.ok(G.hqTerrainWallAt(info, 0, 0, 0.1, 2.4, 2.8), 'the lintel blocks its own band');
    const win = G.hqRoomExpand({ terrain: { features: [wall, { id: 'r3', k: 'opening', wall: 'r1', at: 6, w: 1.4, h: 1.2, sill: 0.9, glaze: true }] } }).features;
    assert.ok(win.some(p => p.glass), 'the pane');
    assert.ok(win.some(p => !p.lift && near(p.h, 0.9)), 'the sill');
    const info2 = G.hqTerrainCompile(flatRoom([wall, { id: 'r3', k: 'opening', wall: 'r1', at: 6, w: 1.4, h: 1.2, sill: 0.9, glaze: true }]), 'w_room1');
    assert.ok(G.hqTerrainWallAt(info2, 0, 0, 0.3, 0, 1.8), 'a window never lets the walker through');
});

test('a hung wall blocks only the band it hangs in (no band = the walker\'s old reads, which ignore it)', () => {
    const info = G.hqTerrainCompile(flatRoom([{ id: 'r1', k: 'wall', x0: -4, z0: 0, x1: 4, z1: 0, h: 3, t: 0.3, lift: 2.2 }]), 'w_room1');
    assert.ok(!G.hqTerrainWallAt(info, 0, 0, 0.3), 'no band: ignored');
    assert.ok(!G.hqTerrainWallAt(info, 0, 0, 0.3, 0, 1.8), 'under it: clear');
    assert.ok(G.hqTerrainWallAt(info, 0, 0, 0.3, 2.0, 3.0), 'in its band: blocks');
});

test('a prefab placement turns, mirrors, moves and nests', () => {
    const P = G.HQ_PREFABS, keep = Object.assign({}, P);
    try {
        P.w_pf1 = { id: 'w_pf1', label: 'Prefab 1', terrain: { features: [{ id: 'r1', k: 'wall', x0: 0, z0: 0, x1: 4, z1: 0, h: 3, t: 0.25 }], marks: [] }, props: [{ id: 'r2', key: 'crate', x: 1, z: 2, face: 0 }] };
        P.w_pf2 = { id: 'w_pf2', label: 'Prefab 2', terrain: { features: [{ id: 'r1', k: 'prefab', pf: 'w_pf1', x: 10, z: 0, yaw: 0 }], marks: [] }, props: [] };
        const X = G.hqRoomExpand({ terrain: { features: [{ id: 'r9', k: 'prefab', pf: 'w_pf1', x: 20, z: 30, yaw: 90 }] } });
        const w = X.features[0];
        assert.ok(near(w.x0, 20) && near(w.z0, 30) && near(w.x1, 20) && near(w.z1, 34), 'turned 90° clockwise (east → south) and moved: ' + JSON.stringify(w));
        assert.strictEqual(w.id, 'r9/r1'); assert.strictEqual(w.from, 'r9');
        assert.ok(near(X.props[0].x, 18) && near(X.props[0].z, 31), 'the prop turns with it: ' + JSON.stringify(X.props[0]));
        const M = G.hqRoomExpand({ terrain: { features: [{ id: 'r9', k: 'prefab', pf: 'w_pf1', x: 0, z: 0, mirror: 'x' }] } }).features[0];
        assert.ok(Math.min(M.x0, M.x1) < -3.9 && Math.max(M.x0, M.x1) < 0.01, 'mirrored east–west');
        const N = G.hqRoomExpand({ terrain: { features: [{ id: 'r5', k: 'prefab', pf: 'w_pf2', x: 0, z: 100, yaw: 0 }] } }).features;
        assert.strictEqual(N.length, 1); assert.ok(near(N[0].x0, 10) && near(N[0].z0, 100), 'nested: ' + JSON.stringify(N[0]));
        P.w_pf3 = { id: 'w_pf3', label: 'Prefab 3', terrain: { features: [{ id: 'r1', k: 'prefab', pf: 'w_pf3', x: 1, z: 0 }], marks: [] }, props: [] };
        assert.doesNotThrow(() => G.hqRoomExpand({ terrain: { features: [{ id: 'r1', k: 'prefab', pf: 'w_pf3' }] } }), 'a prefab placing itself stops at the depth cap');
    } finally { Object.keys(P).forEach(k => delete P[k]); Object.assign(P, keep); }
});

test('a kit calls only the allow-listed builders; a kit row equals the builder\'s own rows', () => {
    assert.strictEqual(G.hqKitRows('hqWorldDocNew', {}), null, 'not on the list');
    assert.deepStrictEqual(plain(G.hqRoomExpand({ terrain: { features: [{ id: 'r1', k: 'kit', fn: 'eval', args: {} }] } }).features), []);
    const args = { hx: 20, hz: 30, rc: 8, rows: 6, seats: {} };
    const direct = plain(G.hqStandBowl(Object.assign({}, G.HQ_KIT_FORMS.hqStandBowl.args, args)));
    const kit = plain(G.hqRoomExpand({ terrain: { features: [{ id: 'r1', k: 'kit', fn: 'hqStandBowl', args, x: 0, z: 0, yaw: 0 }] } }).features);
    assert.strictEqual(kit.length, direct.length, 'as many rows as the builder makes');
    const strip = r => { const o = Object.assign({}, r); delete o.id; delete o.from; return o; };
    for (let i = 0; i < direct.length; i++) for (const k of ['k', 'x0', 'z0', 'x1', 'z1', 'x', 'z', 'y', 'h0', 'h1']) if (direct[i][k] !== undefined) assert.ok(near(+strip(kit[i])[k], +direct[i][k]) || kit[i][k] === direct[i][k], 'row ' + i + ' ' + k);
    const marks = G.hqRoomExpand({ terrain: { features: [{ id: 'r1', k: 'kit', fn: 'hqGridironMarks', args: {} }] } });
    assert.ok(marks.marks.length > 50 && marks.features.length === 0, 'a paint kit makes marks');
    for (const fn of Object.keys(G.HQ_KIT_FORMS)) assert.ok(Array.isArray(G.hqKitRows(fn, {})), fn + ' runs on its defaults');
});

test('a textured building walks as four faces and a roof', () => {
    const f = { id: 'r1', k: 'texbuilding', x: 0, z: 0, w: 10, d: 8, rot: 0, storeys: 3 };
    const X = G.hqRoomExpand({ terrain: { features: [f] } });
    assert.strictEqual(X.texb.length, 1, 'the renderer draws it');
    const info = G.hqTerrainCompile(flatRoom([f]), 'w_room1');
    assert.ok(G.hqTerrainWallAt(info, 0, 4, 0.3, 0, 1.8), 'its south face blocks');
    assert.ok(near(G.hqTerrainHeight(info, 0, 0), 3 * G.HQ_SHAPE_RULES.texStorey, 0.2), 'the roof is walkable at its height');
});

test('the editor\'s core: E1 rows get pick boxes and turn with the gizmo', () => {
    const K = core.KINDS.map(k => k.id);
    for (const id of ['slab', 'texbuilding', 'pillar', 'fence']) assert.ok(K.includes(id), 'ADD has ' + id);
    const tb = core.kindRow('texbuilding', 0, 0);
    assert.ok(core.rowShape(tb, () => 0).length === 1);
    const t = core.rowTransform({ k: 'prefab', pf: 'w_pf1', x: 0, z: 0, yaw: 0 }, { rot: 90, px: 0, pz: 0 });
    assert.strictEqual(t.yaw, 90);
    const b = core.rowTransform(tb, { rot: 90, px: 0, pz: 0 });
    assert.strictEqual(((b.rot % 360) + 360) % 360, 90);
    assert.strictEqual(core.nextPfId({ prefabs: { w_pf1: {} } }), 'w_pf2');
    const exp = r => [{ k: 'wall', x0: r.x, z0: r.z, x1: r.x + 4, z1: r.z, h: 3 }];
    assert.strictEqual(core.rowShape({ k: 'prefab', pf: 'w_pf1', x: 2, z: 2 }, () => 0, exp).length, 1, 'a placement is picked by its rows');
});

test('the wiring: editor.js draws, the worker gets the prefabs, the export writes them', () => {
    const ed = read('editor.js');
    for (const s of ['DRAWS', 'selToPrefab', 'bakeSel', 'arraySel', 'mirrorSel', 'texPick', "'Assets/World/prefabs/'"]) assert.ok(ed.includes(s), s);
    assert.match(read('map.js'), /prefabs/, 'the survey worker is handed the prefabs');
    assert.match(read('three-renderer.js'), /_hqBuildTexRows/, 'the renderer draws texbuilding rows');
    assert.match(read('three-renderer.js'), /if \(_hq && _hqEditing\(_hq\)\) return;/, 'no pointer lock while editing (mondo\'s report)');
});
