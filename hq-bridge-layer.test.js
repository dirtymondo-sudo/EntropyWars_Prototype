// hq-bridge-layer.test.js — THE BRIDGE LAYER (AREA_CONTENT_PLAN D2b, 2026-09-19)
//
// The user: "Surely we can figure out how to make bridges in the game. AAA video
// game. Of course we need stacked walkable areas like bridges. Why can't we have 2
// floors or even more?" The terrain field held ONE height per (x, z) — a `deck` was
// written into H, so a deck over a walked street deleted the street. A `bridge`
// row is a SECOND SURFACE the field never carries (data.js hqTerrainBridges): the
// walker stands on it when its feet arrive within a climb of its top (the wall
// rule), the ground under it stays walked while the slab leaves headroom, the slab
// is solid to the airborne body and the boom, and every solver keys a node by
// cell AND layer. Guards: the rules, the synthetic proofs (under / on / the fall /
// the stack of two / the headroom wall), the solver across a span only, the return
// check, the dump, the plan's mouths, the two cities' real bridges (heavy), the
// renderer on a stub scene, the source sites.
'use strict';
const test = require('node:test');
const { heavy } = require('./test-heavy.js');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { loadGameData } = require('./load-data');
const D = loadGameData(), HQ = D.DOOR_HQ;
const renderer = fs.readFileSync(__dirname + '/three-renderer.js', 'utf8');
const data = fs.readFileSync(__dirname + '/data.js', 'utf8');
const STREETS = 'site_prebuilt_downtown_streets', GRID = 'site_prebuilt_cyberpunk_streets';

/* a synthetic room: two 3 m tiers either side of a walked street, a stair up the west one, a bridge between them */
function synth(extra) {
    return { id: 'syn', label: 'SYN', shell: { w: 40, d: 30, h: 8 },
        doors: [{ id: 'w', wall: 'w', z: 0 }, { id: 'e', wall: 'e', z: 0 }, { id: 'n', wall: 'n', x: 0 }],
        terrain: { features: [
            { k: 'plateau', x: -12, z: 0, w: 8, d: 8, h: 3, edge: 0.35 },
            { k: 'plateau', x: 12, z: 0, w: 8, d: 8, h: 3, edge: 0.35 },
            { k: 'ramp', x0: -12, z0: -12, x1: -12, z1: -3.3, w: 3, h0: 0, h1: 3, stairs: true },
        ].concat(extra || []) } };
}
const key = (i, x, z, y) => D.hqTerrainNodeKey(i, x, z, y);

test('THE RULES: bridgeThick / headroom / bridgeEdge in HQ_TERRAIN_RULES; a `bridge` row (or a deck wearing `over: true`) compiles into info.bridges with its layer, never into the height field', () => {
    const R = D.HQ_TERRAIN_RULES;
    assert.ok(R.bridgeThick > 0.1 && R.headroom >= 1.8 && R.bridgeEdge >= 0, 'the rules');
    const info = D.hqTerrainCompile(synth([{ k: 'bridge', x0: -8.7, z0: 0, x1: 8.7, z1: 0, w: 3.6, y: 3 }, { k: 'deck', over: true, x0: 0, z0: -10, x1: 0, z1: 10, w: 2, y: 6 }]), 'syn');
    assert.equal(info.bridges.length, 2); assert.equal(info.bridges[0].layer, 1); assert.equal(info.bridges[1].layer, 2);
    assert.equal(info.bridges[0].thick, R.bridgeThick);
    assert.ok(Math.abs(D.hqTerrainHeight(info, 0, 0)) < 0.05, 'the street under the span keeps its height — the bridge is a layer, not a height');
    assert.equal(info.decks.length, 0, 'a deck over walked ground is a bridge, not a deck');
});

test('THE FEET: the street under a bridge is walked, the bridge is walked from its tier, a fall lands on the first slab, a body on the ground never climbs a slab from its side, a free query is the ground, and the ground under a LOW slab is a wall (the headroom)', () => {
    const info = D.hqTerrainCompile(synth([{ k: 'bridge', x0: -8.7, z0: 0, x1: 8.7, z1: 0, w: 3.6, y: 3 }, { k: 'bridge', x0: -8.7, z0: 6, x1: 8.7, z1: 6, w: 2.4, y: 1.2 }]), 'syn');
    const F = (x, z, c) => D.hqTerrainFeet(info, x, z, c);
    assert.ok(Math.abs(F(0, 0, 0)) < 0.05, 'under, from the ground');
    assert.ok(Math.abs(F(0, 0, null)) < 0.05, 'a free query is the ground');
    assert.equal(F(0, 0, 3), 3, 'on the bridge from its tier');
    assert.equal(F(-8.5, 0, 3), 3, 'stepping off the tier onto the mouth');
    assert.equal(F(0, 0, 10), 3, 'a fall lands on the slab');
    assert.ok(Math.abs(F(0, 1.7, 0)) < 0.05, 'beside the slab on the ground');
    assert.equal(F(0, 1.6, 3), 3, 'the slab edge from the deck (the rail band is the last 0.12 m)');
    assert.equal(F(0, 6, 0), null, 'a 1.2 m slab over the ground leaves no headroom: a wall to the body under it');
    assert.equal(F(0, 6, 1.2), 1.2, '… and a floor to the body on it');
});

test('THE STACK: two bridges in one column — the feet pick the slab within a climb of where they came from, the fall lands on the upper one, the layer keys differ', () => {
    const info = D.hqTerrainCompile(synth([{ k: 'bridge', x0: -8.7, z0: 0, x1: 8.7, z1: 0, w: 3.6, y: 3 }, { k: 'bridge', x0: -20, z0: 0, x1: 20, z1: 0, w: 3.6, y: 6.5 }]), 'syn');
    const F = (x, z, c) => D.hqTerrainFeet(info, x, z, c);
    assert.equal(F(0, 0, 3), 3); assert.equal(F(0, 0, 6.5), 6.5); assert.equal(F(0, 0, 12), 6.5); assert.ok(Math.abs(F(0, 0, 0)) < 0.05);
    assert.equal(D.hqTerrainLayerAt(info, 0, 0, 3), 1); assert.equal(D.hqTerrainLayerAt(info, 0, 0, 6.5), 2); assert.equal(D.hqTerrainLayerAt(info, 0, 0, 0), 0);
    assert.notEqual(key(info, 0, 0, 3), key(info, 0, 0, 6.5)); assert.equal(key(info, 0, 0), key(info, 0, 0, 0));
    assert.ok(!D.hqTerrainAir(info, 0, 0, 2.9) && D.hqTerrainAir(info, 0, 0, 3.1) && D.hqTerrainAir(info, 0, 0, 1.0) && !D.hqTerrainAir(info, 0, 0, 6.4), 'the slabs are solid in the air, the air between them free');
    assert.ok(D.hqTerrainCam(info, 0, 0, 2.85) && !D.hqTerrainCam(info, 0, 0, 4.5), 'the boom never enters a slab');
});

test('THE SOLVER: the east tier is reached ONLY across the span (no bridge → unreached), the street under it is a second node in the same column, nothing traps, the dump draws B', () => {
    const with_ = synth([{ k: 'bridge', x0: -8.7, z0: 0, x1: 8.7, z1: 0, w: 3.6, y: 3 }]), without = synth();
    const iw = D.hqTerrainCompile(with_, 'syn'), io = D.hqTerrainCompile(without, 'syn');
    const L = with_.doors.map(d => D.hqTerrainDoorLanding(with_, d));
    const Rw = D.hqTerrainReach(iw, L[0].x, L[0].z), Ro = D.hqTerrainReach(io, L[0].x, L[0].z);
    assert.equal(Rw.get(key(iw, 12, 0)), 3, 'the east tier across the span');
    assert.ok(!Ro.has(key(io, 12, 0)) || Ro.get(key(io, 12, 0)) !== 3, 'without the bridge the east tier is not reached');
    assert.equal(Rw.get(key(iw, 0, 0, 3)), 3, 'the bridge node'); assert.ok(Math.abs(Rw.get(key(iw, 0, 0))) < 0.05, 'the street node under it');
    for (const l of L) assert.ok(Rw.has(key(iw, l.x, l.z)), 'every door reached');
    assert.equal(D.hqTerrainTraps(iw).length, 0, 'nothing traps (a drop off the span is any drop)');
    assert.ok(D.hqTerrainDump(iw, { step: 1 }).some(l => /B{10,}/.test(l)), 'the dump draws the span as B');
    assert.ok(D.hqTerrainDump(io, { step: 1 }).every(l => !/B/.test(l)));
});

test('THE PLAN: on a generated floor plan a bridge forces its two MOUTHS open and nothing else; the door across the span is still reached with the plan', () => {
    const room = synth([{ k: 'bridge', x0: -8.7, z0: 0, x1: 8.7, z1: 0, w: 3.6, y: 3 }]);
    room.terrain.gen = { kind: 'rooms', seed: 3, n: 3, thicket: false };
    const info = D.hqTerrainCompile(room, 'synplan');
    assert.ok(info.maskD, 'a plan');
    assert.ok(D.hqTerrainMaskAt(info, -9.5, 0) > 0 && D.hqTerrainMaskAt(info, 9.5, 0) > 0, 'both mouths open');
    const L = room.doors.map(d => D.hqTerrainDoorLanding(room, d)), R = D.hqTerrainReach(info, L[0].x, L[0].z);
    for (const l of L) assert.ok(R.has(key(info, l.x, l.z)), 'every door reached with the plan');
    assert.equal(R.get(key(info, 12, 0)), 3, 'the east tier across the span with the plan');
    assert.equal(D.hqTerrainTraps(info).length, 0);
});

test('THE TWO CITIES (data): THE OVERPASS crosses THE AVENUE from the parking deck to THE WEST LANDING with its stair off the ring road; THE OVERLOOK SPAN crosses THE CUT and THE LOWER CROSS to THE PIER with its fire escape; the rails part round both mouths', () => {
    const sF = HQ.rooms[STREETS].terrain.features, gF = HQ.rooms[GRID].terrain.features;
    const ov = sF.find(f => f.k === 'bridge'); assert.ok(ov && ov.y === 3 && ov.z0 === -19.2 && ov.x0 < -5 && ov.x1 > 18, 'THE OVERPASS');
    assert.ok(sF.some(f => f.k === 'plateau' && f.x === -11 && f.z === -19.2 && f.h === 3), 'THE WEST LANDING');
    assert.ok(sF.some(f => f.k === 'ramp' && f.stairs && f.z0 === -19.2 && f.h1 === 3 && Math.hypot(f.x1 - f.x0, f.z1 - f.z0) >= 2.2 * 3 + 1.2), 'the stair (the ramp rule)');
    assert.ok(sF.some(f => f.k === 'rail' && f.z0 === -20.6 && f.x0 === 22.6), 'the deck\'s north rail starts east of the mouth');
    const sp = gF.find(f => f.k === 'bridge'); assert.ok(sp && sp.y === 3 && sp.x0 === 70 && sp.z0 === 42.3 && sp.z1 === 72.7, 'THE OVERLOOK SPAN');
    assert.ok(gF.some(f => f.k === 'plateau' && f.x === 70 && f.z === 76 && f.h === 3), 'THE PIER');
    assert.ok(gF.some(f => f.k === 'climb' && f.x === 70 && f.z === 71.6 && f.look === 'fireescape'), 'the pier\'s fire escape');
    const rails = gF.filter(f => f.k === 'rail' && f.z0 === 41.4 && f.z1 === 41.4); assert.equal(rails.length, 2, 'the overlook\'s drop-side rail in two parts'); assert.ok(rails.every(r => r.x1 <= 67.6 || r.x0 >= 72.4), 'clear of the mouth');
});

test('THE TWO CITIES (the solver — heavy): the overpass is walked from the tower door and THE AVENUE under it is walked too; the span is walked from the bay door up the ramp road and THE LOWER CROSS under it too; the pier is reached both ways; nothing traps, no rescue ramp', heavy, () => {
    const si = D.hqTerrainInfo(STREETS), sr = HQ.rooms[STREETS], sL = D.hqTerrainDoorLanding(sr, sr.doors.find(d => d.id === 'tower')), sR = D.hqTerrainReach(si, sL.x, sL.z);
    for (const [n, x, z, y] of [['the west landing', -11, -19.2, 3], ['the overpass over the avenue', 0, -19.2, 3], ['the avenue under it', 0, -19.2, 0], ['the deck', 24, -15, 3], ['the stair\'s foot', -26, -19.2, 0]])
        assert.ok(sR.has(key(si, x, z, y)) && Math.abs(sR.get(key(si, x, z, y)) - y) < 0.15, 'Downtown: ' + n + ' ' + sR.get(key(si, x, z, y)));
    assert.equal(D.hqTerrainTraps(si).length, 0); assert.equal((si.rescues || []).length, 0, 'Downtown: no rescue ramp');
    const gi = D.hqTerrainInfo(GRID), gr = HQ.rooms[GRID], gL = D.hqTerrainDoorLanding(gr, gr.doors.find(d => d.id === 'bay')), gR = D.hqTerrainReach(gi, gL.x, gL.z);
    for (const [n, x, z, y] of [['the overlook', 70, 37, 3], ['the span over the cut', 70, 50, 3], ['the span over the lower cross', 70, 62, 3], ['the lower cross under it', 70, 62, -4], ['the pier', 70, 76, 3], ['the pier alley', 70, 68, -4]])
        assert.ok(gR.has(key(gi, x, z, y)) && Math.abs(gR.get(key(gi, x, z, y)) - y) < 0.15, 'the Grid: ' + n + ' ' + gR.get(key(gi, x, z, y)));
    assert.equal(D.hqTerrainTraps(gi).length, 0); assert.equal((gi.rescues || []).length, 0, 'the Grid: no rescue ramp');
});

test('THE RENDERER on a stub scene: _hqBuildBridges draws a slab, its rails on the park register (bridge: true) and its piers as blockers for a room with a bridge', () => {
    const a = renderer.indexOf('    function _hqTerrainMat(info, S, cut) {'), b = renderer.indexOf('    function _hqBuildSiteBoard(room) {');
    assert.ok(a > 0 && b > a);
    const src = renderer.slice(a, b);
    class Obj { constructor() { this.position = { x: 0, y: 0, z: 0, set(x, y, z) { this.x = x; this.y = y; this.z = z; }, copy(p) { this.x = p.x; this.y = p.y; this.z = p.z; } }; this.rotation = { x: 0, y: 0, z: 0, set(x, y, z) { this.x = x; this.y = y; this.z = z; } }; this.scale = { x: 1, y: 1, z: 1, set() {}, setScalar() {} }; this.children = []; this.userData = {}; } add(...c) { c.forEach(x => this.children.push(x)); } traverse(fn) { fn(this); this.children.forEach(c => c.traverse && c.traverse(fn)); } lookAt() {} }
    class Mesh extends Obj { constructor(g, m) { super(); this.geometry = g; this.material = m; this.isMesh = true; } }
    class Geo { constructor() { this.attributes = {}; } setAttribute(k, v) { this.attributes[k] = v; } setIndex(i) { this.index = i; } computeVertexNormals() { this.normals = true; } translate() {} }
    class Mat { constructor(o) { Object.assign(this, o || {}); this.color = { clone: () => ({ multiplyScalar: () => ({}) }), multiply: () => {} }; this.emissive = null; this.opacity = 1; } }
    const D2 = vm.createContext({ console: { warn: (...m) => { throw new Error('warned: ' + m.join(' ')); }, log() {} }, window: {},
        THREE: { Group: Obj, Mesh, Object3D: Obj, BufferGeometry: Geo, BoxGeometry: Geo, CylinderGeometry: Geo, MeshPhongMaterial: Mat, Color: class { constructor(c) { this.c = c; } } },
        hqTerrainHeight: D.hqTerrainHeight, hqTerrainSolidAt: D.hqTerrainSolidAt, _hqTPolyDist: D._hqTPolyDist, _hzTex: () => null, _hzBoxUV: () => {}, _hqBox: () => new Mesh(new Geo(), new Mat()) });
    vm.runInContext(src + '\nthis.build = _hqBuildBridges;', D2);
    const room = synth([{ k: 'bridge', x0: -8.7, z0: 0, x1: 8.7, z1: 0, w: 3.6, y: 3 }]);
    room.terrain.traffic = [{ pts: [[5, -12], [5, 12]], lane: 2.2, loop: false, n: 1, speed: 5, kinds: ['suv'] }];   // a lane under the span's east half: the pier there is skipped
    const info = D.hqTerrainCompile(room, 'syn');
    const hq = { rails: [], blockers: [] }; D2._hq = hq;
    const G = new Obj();
    D2.build(room, info, G, 1.75 * HQ.units, HQ.units);
    assert.ok(G.children.length >= 1, 'the slab group');
    assert.equal(hq.rails.filter(r => r.bridge).length, 2, 'two grind rails');
    const piers = hq.blockers.filter(k => k.pier);
    assert.ok(piers.length >= 1 && piers.length <= 4, 'piers: ' + piers.length);
    assert.ok(piers.every(p => p.top === null), 'a pier is a wall (no top)');
    assert.ok(piers.every(p => D._hqTPolyDist(p.obj.position.x / HQ.units, p.obj.position.z / HQ.units, [[5, -12], [5, 12]]).d >= 3.8 - 0.01), 'no pier in the traffic lane');
});

test('THE SOURCE SITES: hqTerrainFeet reads the bridge first and the headroom last; every solver takes its candidates from _hqTNodeFeet; hqTerrainAir / hqTerrainCam know the slab; the renderer calls _hqBuildBridges from _hqBuildTerrain, the door gun\'s surface read lands on a deck and the lip snap onto it; check-terrain prints the count; the KINDS pin', () => {
    for (const s of ['function hqTerrainBridges(info, rows) {', 'function hqTerrainBridgesAt(info, x, z, pad) {', 'function hqTerrainBridgeFor(info, x, z, curY) {', 'function hqTerrainBridgeBelow(info, x, z, y) {', 'function hqTerrainLayerAt(info, x, z, y) {', 'function hqTerrainInBridgeSlab(info, x, z, y, pad) {', 'function _hqTNodeFeet(info, i, j, prevY, climb, jump) {',
        "if (info.bridges && info.bridges.length) { const b = hqTerrainBridgeFor(info, x, z, curY); if (b) return b.y; }", "case 'bridge': bridges.push(f); break;", "if (f.over) { bridges.push(f); break; }",
        "if (info.bridges && info.bridges.length && hqTerrainInBridgeSlab(info, x, z, y, 0.05)) return false;", "if (info.bridges && info.bridges.length && hqTerrainInBridgeSlab(info, x, z, y, 0.22)) return true;",
        "ch = 'B';", "case 'bridge': {"]) assert.ok(data.includes(s), 'data.js: ' + s.slice(0, 70));
    const grid = data.slice(data.indexOf('function _hqTReachGrid('), data.indexOf('function _hqTReturnJump(')), ret = data.slice(data.indexOf('function _hqTReturnJump('), data.indexOf('function _hqTTraps(')), reach = data.slice(data.indexOf('function hqTerrainReach('), data.indexOf('function hqTerrainTraps('));
    assert.ok((grid.match(/_hqTNodeFeet\(/g) || []).length >= 2 && ret.includes('_hqTNodeFeet(') && reach.includes('_hqTNodeFeet('), 'every solver takes its candidates from _hqTNodeFeet');
    for (const s of ['function _hqBuildBridges(room, info, G, TM, U) {', "if (info.bridges && info.bridges.length) { try { _hqBuildBridges(room, info, G, TM, U); }", 'var bb = hqTerrainBridgeBelow(_hq.terrain, x, z, ry); if (bb && bb.y > base) base = bb.y;', 'var bl = hqTerrainBridgesAt(H.terrain, hit.x - hit.nx * 0.55, hit.z - hit.nz * 0.55, 0);', "_hq.blockers.push({ obj: pier, y: gy, top: null, rad: 0.3, pier: true });"])
        assert.ok(renderer.includes(s), 'three-renderer.js: ' + s.slice(0, 70));
    assert.ok(fs.readFileSync(__dirname + '/check-terrain.js', 'utf8').includes("' · bridges '"), 'the tool prints the count');
    assert.ok(fs.readFileSync(__dirname + '/hq-terrain.test.js', 'utf8').includes("'climb', 'bridge']"), 'the KINDS pin');
});
