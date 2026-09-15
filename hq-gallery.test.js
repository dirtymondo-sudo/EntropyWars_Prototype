// hq-gallery.test.js — THE GALLERY (HQ plan 9.2 stage 2 — 2026-09-15 rev 20):
// two floors in ONE box room. `shell.gallery = { h, side, w, stairAt, rail }`
// hangs a slab along one wall with a closed-string flight at one end and a
// rail on the open edge; the walker reads it as a LAYER of _hqSurface (the
// flight → the slab → the floor under it), a door on the gallery's wall
// stands on the slab, the boom treats the slab and the flight as solid, a
// jump lands on either. The first is THE HALL of the Haunted House (Room
// 13): THE LANDING along the north wall at 2.9 m, the staircase door on it.
// Guards: the sheet, the frame on all four walls, THE CLIMB (a walker
// climbs the flight and crosses the slab to the door's landing by the
// step rule alone), the walls (the mass from below, the rail from above,
// the floor under the slab), the free query, the landing / air / camera
// reads, a stair-less gallery, the door height, the builder on a stub
// scene (the park rule's registers) and the source sites.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { loadGameData } = require('./load-data');
const D = loadGameData(), HQ = D.DOOR_HQ;
const renderer = fs.readFileSync(__dirname + '/three-renderer.js', 'utf8');
const HALL = 'site_prebuilt_haunted_hall', UP = 'site_prebuilt_haunted_upstairs';
const hall = HQ.rooms[HALL], G = hall.shell.gallery;

function extract(name) {
    const start = renderer.indexOf('    function ' + name + '(');
    const end = renderer.indexOf('\n    }', start);
    assert.ok(start >= 0 && end > start, name);
    return renderer.slice(start, end + 6);
}
function consts() {
    const out = [];
    for (const n of ['HQ_BODY_R', 'HQ_STEP_TOL', 'HQ_DROP_MAX']) { const m = renderer.match(new RegExp('    var ' + n + ' = ([0-9.]+);')); assert.ok(m, n); out.push('var ' + n + ' = ' + m[1] + ';'); }
    const g = renderer.match(/    var HQ_GALLERY_THICK = [^\n]+/); assert.ok(g, 'HQ_GALLERY_* constants'); out.push(g[0]);
    return out.join('\n');
}
/* the gallery helpers in a sandbox, _hq.gallery = the room's frame */
function sandbox(room) {
    const c = { console };
    vm.createContext(c);
    vm.runInContext(consts() + '\n' + ['_hqGalleryFrame', '_hqGalleryTread', '_hqGalleryAt', '_hqGalleryFloor', '_hqGalleryAir', '_hqGalleryCam', '_hqDoorFloorY'].map(extract).join('\n'), c);
    c._hq = { room, gallery: c._hqGalleryFrame(room) };
    return c;
}
const STEP = +renderer.match(/var HQ_STEP_TOL = ([0-9.]+);/)[1];

test('the sheet: the hall wears the gallery — THE LANDING along the north wall at 2.9 m, a flight at the east end, railed; the room is tall enough; the staircase door stands on it; no stair / rail props remain; upstairs comes back through it', () => {
    assert.ok(G && G.side === 'n' && G.h === 2.9 && G.w === 3.0 && G.stairAt === 'end' && G.rail === true, 'the gallery row');
    assert.ok(hall.shell.h >= G.h + 2.4, 'headroom over the landing (h ' + hall.shell.h + ')');
    assert.ok(hall.shell.h - G.h >= 2.4 && G.h - 0.22 >= 2.2, 'headroom under the slab too');
    const stairs = hall.doors.find(d => d.id === 'stairs');
    assert.ok(stairs && stairs.wall === G.side && stairs.leaf === null, 'the staircase door is on the gallery\'s wall, an open doorway');
    assert.equal(stairs.action.room, UP);
    assert.ok(!hall.props.some(p => p.key === 'house_stairs' || p.key === 'railing_1m'), 'the stairs and the banister are the gallery\'s own');
    const back = HQ.rooms[UP].doors.find(d => d.id === 'stairs');
    assert.ok(back && back.action.room === HALL && back.action.at === 'stairs', 'upstairs comes back down onto the landing');
    /* wall props above the slab hang above it; floor props on it wear y = h */
    for (const p of hall.props) {
        if (p.wall === 'n' && p.mount > G.h) assert.ok(p.mount >= G.h + 1.2, p.key + ' hangs clear of the landing\'s feet');
        if (p.y === G.h || p.y === G.h + 0.01) assert.ok(p.z < -hall.shell.d / 2 + G.w - 0.3, p.key + ' stands on the slab');
    }
});

test('the frame: every side maps local ↔ world and back; the flight is twelve risers under a step each, 3.36 m long; the slab is the rest of the wall', () => {
    for (const side of ['n', 's', 'e', 'w']) {
        const room = { kind: 'box', shell: { w: 14, d: 12, gallery: { h: 2.9, side, w: 3, stairAt: 'end' } } };
        const c = sandbox(room), F = c._hq.gallery;
        assert.equal(F.side, side); assert.equal(F.len, (side === 'e' || side === 'w') ? 12 : 14);
        for (const [s, t] of [[0, 0], [3.3, 1.2], [F.len, 3]]) { const w = F.world(s, t), l = F.local(w.x, w.z); assert.ok(Math.abs(l.s - s) < 1e-9 && Math.abs(l.t - t) < 1e-9, side + ': round trip'); }
        const wall = F.world(1, 0);
        assert.ok(side === 'n' ? wall.z === -6 : side === 's' ? wall.z === 6 : side === 'e' ? wall.x === 7 : wall.x === -7, side + ': t = 0 is the wall');
        assert.equal(F.stair.n, 12); assert.ok(F.stair.rise <= STEP && Math.abs(F.stair.rise * 12 - 2.9) < 1e-9);
        assert.ok(Math.abs(F.stair.len - 3.36) < 1e-9, 'the flight\'s run');
        assert.ok(F.s1 === F.len - 3.36 && F.s0 === 0 && F.stair.s0 === F.s1 && F.stair.s1 === F.len && F.stair.dir === -1, side + ': the flight at the end, rising toward the slab');
    }
    const st = sandbox({ kind: 'box', shell: { w: 10, d: 8, gallery: { h: 2.6, side: 'w', w: 2.4, stairAt: 'start' } } })._hq.gallery;
    assert.ok(st.stair.s0 === 0 && st.stair.dir === 1 && st.s0 === st.stair.s1 && st.s1 === 8, 'stairAt start: the flight from the wall\'s start corner');
});

test('THE CLIMB: a walker on the hall floor climbs the flight from its open foot and crosses the landing to the staircase door\'s landing spot by the step rule alone', () => {
    const c = sandbox(hall), F = c._hq.gallery, S = hall.shell;
    const at = (x, z, y) => c._hqGalleryAt(x, z, y);
    /* the foot of the flight is at the east corner (s = len), its low treads entered from the open side (t = w) */
    let y = 0, x = S.w / 2 - 0.5, z = -S.d / 2 + G.w + 0.6;   // on the floor, beside the foot
    assert.equal(at(x, z, y), undefined, 'beside the strip is the floor\'s');
    z -= 0.6; const first = at(x, z, y); assert.ok(typeof first === 'number' && first > 0 && first <= STEP, 'the first tread from the side (' + first + ')'); y = first;
    z -= 0.9;   // to the middle of the tread
    const trail = [];
    for (let i = 0; i < 40 && y < F.h - 1e-9; i++) { x -= 0.2; const ny = at(x, z, y); assert.ok(typeof ny === 'number', 'step ' + i + ' at x ' + x.toFixed(2) + ' is walkable (' + ny + ')'); assert.ok(ny - y <= STEP + 1e-9 && ny >= y - 1e-9, 'one riser at a time'); y = ny; trail.push(ny); }
    assert.ok(Math.abs(y - F.h) < 1e-9, 'the head of the stairs is the landing (' + y + ')');
    assert.ok(trail.some(v => v > 1 && v < 2), 'the flight passed through the middle heights');
    /* along the slab to the door's landing spot: 2.4 m in from the wall at the door's x (the _hqGoTo rule) */
    const door = hall.doors.find(d => d.id === 'stairs');
    const lx = door.x, lz = -S.d / 2 + 2.4;
    for (let i = 0; i < 60 && x > lx; i++) { x -= 0.2; const ny = at(x, lz, y); assert.equal(ny, F.h, 'the slab at x ' + x.toFixed(2)); y = ny; }
    assert.equal(at(lx, lz, F.h), F.h, 'the landing spot is on the slab');
    assert.ok(lx < F.s1 - S.w / 2 - 0.8, 'the door is clear of the flight\'s head');
    assert.equal(c._hqDoorFloorY(hall, door), F.h, 'the door stands on the slab');
    assert.equal(c._hqDoorFloorY(hall, hall.doors.find(d => d.id === 'front')), 0, 'the front door stands on the floor');
    assert.equal(c._hqDoorFloorY(hall, { wall: 'n', x: -5, y: 0 }), 0, 'an explicit y: 0 on the gallery\'s wall is the floor under it');
});

test('the walls: the flight\'s mass from below, the railing from above and in the air, the floor under the slab from below; a free query is the floor\'s; the landing, air and camera reads', () => {
    const c = sandbox(hall), F = c._hq.gallery, S = hall.shell;
    const under = { x: -3, z: -S.d / 2 + 1.5 };   // under the slab
    assert.equal(c._hqGalleryAt(under.x, under.z, 0), undefined, 'under the slab the floor answers');
    assert.equal(c._hqGalleryAt(under.x, under.z, null), undefined, 'a free query is the floor\'s');
    assert.equal(c._hqGalleryAt(under.x, under.z, F.h), F.h, 'from up there the slab');
    const edge = { x: -3, z: -S.d / 2 + G.w - 0.2 };
    assert.equal(c._hqGalleryAt(edge.x, edge.z, F.h), null, 'the railing is a wall from the slab');
    assert.equal(c._hqGalleryAt(edge.x, edge.z, 0), undefined, 'and nothing from the floor beneath it');
    const high = { x: S.w / 2 - 3.36 + 0.3, z: -S.d / 2 + 1.5 };   // the high end of the flight
    assert.equal(c._hqGalleryAt(high.x, high.z, 0), null, 'the flight\'s mass is a wall from the floor');
    assert.equal(c._hqGalleryAt(high.x, high.z, F.h), F.h - F.stair.rise, 'and the top tread from the landing');
    assert.equal(c._hqGalleryAt(-3, -S.d / 2 + G.w + 1, 0), undefined, 'off the strip');
    /* the landing surface for a jump / the portal aim */
    assert.equal(c._hqGalleryFloor(under.x, under.z, F.h + 0.5), F.h, 'a body falling onto the slab lands on it');
    assert.equal(c._hqGalleryFloor(under.x, under.z, 1.0), null, 'a body under the slab does not');
    assert.equal(c._hqGalleryFloor(high.x, high.z, 3.0), F.h - F.stair.rise, 'the treads too');
    /* the air */
    assert.equal(c._hqGalleryAir(under.x, under.z, F.h - 0.12), false, 'inside the slab');
    assert.equal(c._hqGalleryAir(under.x, under.z, 0.9), true, 'under it');
    assert.equal(c._hqGalleryAir(under.x, under.z, F.h + 0.3), true, 'over it');
    assert.equal(c._hqGalleryAir(edge.x, edge.z, F.h + 0.4), false, 'the railing in the air');
    assert.equal(c._hqGalleryAir(edge.x, edge.z, F.h + 1.3), true, 'cleared with the feet above it');
    assert.equal(c._hqGalleryAir(high.x, high.z, 1.0), false, 'the flight\'s mass in the air');
    /* the camera */
    assert.equal(c._hqGalleryCam(under.x, under.z, F.h - 0.1), true, 'the boom never enters the slab');
    assert.equal(c._hqGalleryCam(under.x, under.z, 1.5), false, 'the room under it is open');
    assert.equal(c._hqGalleryCam(high.x, high.z, 1.0), true, 'nor the flight');
});

test('stairAt: null — a slab with no stair: seen from the floor, never reached by the step rule (the door gun is the way up)', () => {
    const c = sandbox({ kind: 'box', shell: { w: 10, d: 8, gallery: { h: 2.6, side: 's', w: 2, stairAt: null } } }), F = c._hq.gallery;
    assert.equal(F.stair, null); assert.ok(F.s0 === 0 && F.s1 === 10, 'the slab spans the wall');
    for (let s = 0.1; s < 10; s += 0.5) for (let t = 0.1; t < 2; t += 0.3) { const w = F.world(s, t); assert.equal(c._hqGalleryAt(w.x, w.z, 0), undefined, 'no way up at ' + s + ',' + t); }
    const w = F.world(5, 1); assert.equal(c._hqGalleryAt(w.x, w.z, F.h), F.h, 'but a body up there stands');
    assert.equal(c._hqGalleryFloor(w.x, w.z, F.h + 1), F.h, 'a fall onto it lands');
});

test('the builder runs on a stub scene: the slab, its underside and fascia, twelve treads, the rails; the park rule\'s registers carry the runs and the flight\'s pitch', () => {
    class Obj { constructor() { this.position = { x: 0, y: 0, z: 0, set(x, y, z) { this.x = x; this.y = y; this.z = z; } }; this.rotation = { x: 0, y: 0, z: 0 }; this.scale = { x: 1, y: 1, z: 1, set(x, y, z) { this.x = x; this.y = y; this.z = z; } }; this.children = []; } add(...o) { for (const k of o) { assert.ok(k instanceof Obj, 'added a non-object'); this.children.push(k); } } clone() { const c = new Obj(); c.isMesh = this.isMesh; c.position.set(this.position.x, this.position.y, this.position.z); c.quaternion = this.quaternion; return c; } }
    class Mesh extends Obj { constructor(geo, mat) { super(); this.geometry = geo; this.material = mat; this.isMesh = true; this.quaternion = { setFromUnitVectors(a, b) { this.a = a; this.b = b; } }; } }
    const geo = class { constructor() {} };
    class V3 { constructor(x, y, z) { Object.assign(this, { x, y, z }); } normalize() { const l = Math.hypot(this.x, this.y, this.z) || 1; this.x /= l; this.y /= l; this.z /= l; return this; } }
    const c = { THREE: { Group: Obj, Mesh, BoxGeometry: geo, PlaneGeometry: geo, Vector3: V3 }, console,
        _hqUnits: () => HQ.units,
        _hqMat: (name) => { if (name) assert.ok(HQ.textures[name] || vm.runInContext('TERRAIN_RULES', D)[name], 'unknown texture ' + name); return { name }; },
        _hqBox: (w, h, d, mat) => { const m = new Mesh(new geo(), mat); m.dims = [w, h, d]; return m; } };
    vm.createContext(c);
    vm.runInContext(consts() + '\n' + ['_hqGalleryFrame', '_hqBuildGallery'].map(extract).join('\n'), c);
    c._hq = { shellGroup: new Obj(), gallery: c._hqGalleryFrame(hall), rails: [], ramps: [] };
    c._hqBuildGallery(hall);
    const kids = c._hq.shellGroup.children;
    assert.ok(kids.length > 12 + 12 + 3 + 6, 'the pieces (' + kids.length + ')');
    const U = HQ.units, F = c._hq.gallery;
    const slab = kids.find(m => m.dims && Math.abs(m.dims[0] - (F.s1 - F.s0)) < 1e-9 && Math.abs(m.dims[2] - F.w) < 1e-9);
    assert.ok(slab, 'the slab'); assert.ok(Math.abs(slab.position.y / U - (F.h - F.thick / 2)) < 1e-9, 'at the gallery\'s height');
    const treads = kids.filter(m => m.dims && Math.abs(m.dims[0] - (F.stair.run + 0.01)) < 1e-9 && Math.abs(m.dims[2] - F.w) < 1e-9);
    assert.equal(treads.length, 12, 'twelve treads');
    const tops = treads.map(t => t.position.y / U * 2).sort((a, b) => a - b);
    assert.ok(Math.abs(tops[11] - F.h) < 1e-9 && Math.abs(tops[0] - F.stair.rise) < 1e-9, 'from one riser to the landing');
    assert.ok(treads.every(t => t.position.x / U > F.s1 - hall.shell.w / 2 - 0.01), 'every tread stands east of the slab');
    assert.ok(kids.some(m => m.quaternion && m.quaternion.b && m.quaternion.b.y > 0.05), 'the sloped rail up the flight');
    assert.equal(c._hq.rails.length, 2, 'two rail runs registered (the slab\'s edge, the flight)');
    assert.ok(c._hq.rails.every(r => r.gallery) && c._hq.rails.some(r => r.slope), 'the park rule\'s rails');
    assert.equal(c._hq.ramps.length, 1); assert.ok(c._hq.ramps[0].stair && c._hq.ramps[0].y1 === F.h && c._hq.ramps[0].dir === 'w', 'the flight is a ramp rising west');
});

test('the source sites: _hqSurface reads the layer, _hqBlockerFloor / _hqAirOK / _hqCamBlocked read the gallery, _hqEnter frames it before the shell and builds it after, a box door is found by height, the box shell owns no gallery of its own', () => {
    const fn = n => extract(n);
    assert.ok(/if \(_hq\.gallery\) \{ var gy = _hqGalleryAt\(x, z, curY\); if \(gy === null\) return null; if \(gy !== undefined\) y = gy; \}/.test(fn('_hqSurface')), '_hqSurface: the layer in the box branch');
    assert.ok(fn('_hqSurface').indexOf('_hqGalleryAt') < fn('_hqSurface').indexOf("room.kind === 'bay'"), 'read in the box branch, before the bay');
    assert.ok(/var best = _hqGalleryFloor\(x, z, feetY\);/.test(fn('_hqBlockerFloor')), '_hqBlockerFloor seeds from the gallery');
    assert.ok(/if \(_hq\.gallery && !_hqGalleryAir\(x, z, y\)\) return false;/.test(fn('_hqAirOK')), '_hqAirOK');
    assert.ok(/if \(_hq\.gallery && _hqGalleryCam\(px, pz, py\)\) return true;/.test(fn('_hqCamBlocked')), '_hqCamBlocked');
    const enter = renderer.slice(renderer.indexOf('    function _hqEnter('), renderer.indexOf('    function _hqLeave('));
    const frameAt = enter.indexOf('_hq.gallery = _hqGalleryFrame(room);'), shellAt = enter.indexOf('_hqBuildBoxShell(room)'), buildAt = enter.indexOf('_hqBuildGallery(room)');
    assert.ok(frameAt > 0 && frameAt < shellAt && shellAt < buildAt, '_hqEnter: the frame, then the shell, then the gallery');
    assert.ok(/gallery: null/.test(enter), 'the _hq record carries gallery');
    assert.ok(/if \(d\.box\) \{ if \(Math\.abs\(pl\.y - d\.y0\) > 1\.2\) return; \}/.test(fn('_hqFindTarget')), '_hqFindTarget: a box door by height');
    assert.ok(/room\.shell\.gallery/.test(fn('_hqDoorFloorY')), '_hqDoorFloorY reads shell.gallery');
    assert.ok(!/gallery/.test(fn('_hqBuildBoxShell')), 'the box shell builder leaves the gallery to _hqBuildGallery');
    /* only the hall wears one today; any other must be a box room */
    for (const [id, r] of Object.entries(HQ.rooms)) if (r.shell && r.shell.gallery) { assert.equal(r.kind, 'box', id + ': a gallery is a box room\'s'); assert.ok(['n', 's', 'e', 'w'].includes(r.shell.gallery.side), id + ': side'); assert.ok(r.shell.h >= r.shell.gallery.h + 2.2, id + ': headroom'); }
});
