// hq-world-map.test.js — OPEN_WORLD_PLAN.md Phase 0 (2026-09-26).
//
// Guards THE GEOGRAPHY AS DATA (data.js HQ_WORLD: grounds → zones → parts with
// frames, joins, borders; the validator; the two transforms; the ring), THE
// LAND SHEET the map's LAND tab draws (the fog, the planned parts behind
// EW_HQ_MAP_ALL, the absorbed rooms), THE BUILDING MERGE (a map-builder
// building's storeys are one mesh a face), THE INSTANCE PASS (the repeated
// catalogue props draw as InstancedMesh batches in the walk, read back every
// frame, handed back when touched, dropped before the room leaves) and THE
// READOUT (draw calls + triangles behind the FPS counter). Repo-only tooling.

'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { loadGameData } = require('./load-data');

const D = loadGameData();
const HQ = D.DOOR_HQ;
const W = HQ.world;
const src = f => fs.readFileSync(path.join(__dirname, f), 'utf8');
const TR = src('three-renderer.js'), MP = src('map.js'), CSS = src('styles-base.css');
const clone = v => JSON.parse(JSON.stringify(v));
/* run fn against a changed copy of the world table (the index caches on the table's identity) */
function withWorld(edit, fn) {
    const keep = HQ.world, W2 = clone(keep);
    edit(W2);
    HQ.world = W2;
    try { return fn(); } finally { HQ.world = keep; }
}

test('the world table is DOOR_HQ.world, with its rules, and the validator passes on the shipped geography', () => {
    assert.ok(W && W.grounds && W.zones && Array.isArray(W.borders), 'grounds, zones, borders');
    for (const g of ['surface', 'under', 'rome', 'ley']) assert.ok(W.grounds[g], 'the ground ' + g);
    const WR = vm.runInContext('HQ_WORLD_RULES', D), SR = vm.runInContext('HQ_STAGE_RULES', D), CK = vm.runInContext('HQ_WORLD_CLOCK', D);
    assert.ok(WR.joinTol > 0 && WR.far > 0, 'HQ_WORLD_RULES');
    assert.ok(SR.instanceMin >= 2 && SR.instanceCell > 0 && SR.callsMax > 0, 'HQ_STAGE_RULES carries the instance pass\'s numbers and the budget');
    assert.ok(CK.dayMin > 0, 'HQ_WORLD_CLOCK');
    const v = D.hqWorldValidate();
    assert.deepEqual(clone(v.errors), [], 'no validator errors');
    assert.equal(v.ok, true);
    assert.ok(v.parts >= 40, 'every part of the plan\'s table has a frame (' + v.parts + ')');
    assert.ok(v.joins >= 30, 'the joins and the borders (' + v.joins + ')');
});

test('the compass (§4.5): the forecourt at the origin, the city east, the woods west, the kingdom north, the highway and the desert south', () => {
    const F = id => D.hqWorldFrame(id);
    assert.equal(D.hqWorldZoneOf('hq_grounds'), 'forecourt');
    assert.equal(F('hq_grounds').x, 0); assert.equal(F('hq_grounds').z, 0);
    assert.ok(F('site_prebuilt_downtown_streets').x > 0, 'Downtown east');
    assert.ok(F('site_prebuilt_haunted_grounds').x < 0, 'the estate west');
    assert.ok(F('site_prebuilt_camelot_ward').z < 0, 'Camelot north (north is −z)');
    assert.ok(F('highway_south').z > 0 && F('site_prebuilt_area51_flightline').z > F('highway_south').z, 'the highway then Area 51 south');
    assert.ok(F('site_prebuilt_olympus_summit').y > F('olympus_foothills').y, 'Olympus climbs');
    for (const id of Object.keys(W.zones.underworld.parts)) assert.equal(F(id).ground, 'under', 'the underworld is under the surface');
});

test('the two transforms round-trip for every part, and a quarter turn carries north to the west', () => {
    for (const zid of Object.keys(W.zones)) for (const id of Object.keys(W.zones[zid].parts)) {
        for (const [x, z] of [[0, 0], [3, -7], [-11.5, 4.25]]) {
            const g = D.hqWorldToZone(id, x, z), back = D.hqZoneToRoom(id, g.x, g.z);
            assert.ok(Math.abs(back.x - x) < 1e-9 && Math.abs(back.z - z) < 1e-9, id + ' round-trips');
        }
    }
    withWorld(W2 => { W2.zones.forecourt.parts.hq_grounds.rot = 1; }, () => {
        const n = D.hqWorldToZone('hq_grounds', 0, -1);   // a step north in the room
        assert.ok(Math.abs(n.x + 1) < 1e-9 && Math.abs(n.z) < 1e-9, 'rot 1: north lands west (three.js rotation.y = +π/2)');
    });
    /* an absorbed room lands at its spot in its field */
    const f = D.hqWorldFrame('site_prebuilt_fairy_forest_trail'), field = D.hqWorldFrame('woods_field');
    assert.equal(f.absorbedBy, 'woods_field');
    assert.equal(f.x, field.x + W.zones.woods.parts.woods_field.absorbs.site_prebuilt_fairy_forest_trail.x);
});

test('every edge join resolves onto both parts\' opposite sides; borders cross zones on one ground; the ring grows by hops', () => {
    const opp = { n: 's', s: 'n', e: 'w', w: 'e' };
    for (const j of D.hqWorldJoins()) {
        if (!j.side) continue;
        const J = D.hqWorldJoinResolve(j);
        assert.ok(J && J.b, j.a + ' ⇄ ' + j.b + ' resolves');
        const Fb = D.hqWorldFrame(j.b), sides = ['n', 'e', 's', 'w'];
        assert.equal(sides[(sides.indexOf(J.b.side) - Fb.rot + 4) % 4], opp[J.gSide], j.a + ' ⇄ ' + j.b + ': b meets it face to face');
    }
    for (const b of W.borders) assert.notEqual(D.hqWorldZoneOf(b.a), D.hqWorldZoneOf(b.b), b.a + ' ⇄ ' + b.b + ' is a border');
    const ring = D.hqWorldRing('hq_grounds', 2);
    assert.equal(ring.hq_grounds, 0);
    assert.equal(ring.site_prebuilt_downtown_streets, 1, 'the forecourt\'s east road reaches Downtown in one hop');
    assert.ok(Object.values(ring).every(h => h <= 2));
    assert.ok(D.hqWorldNeighbours('site_prebuilt_downtown_streets').includes('hq_grounds'));
});

test('the validator catches what it promises: an overlap, a join off its line, a part cut off, a planned part without a size, a room in two zones', () => {
    const has = (errs, re) => errs.some(e => re.test(e));
    withWorld(W2 => { W2.zones.city.parts.site_prebuilt_strip_streets.x = 150; }, () => {
        const v = D.hqWorldValidate(); assert.equal(v.ok, false);
        assert.ok(has(v.errors, /overlap/), 'the Strip dropped onto Downtown overlaps: ' + v.errors.join('; '));
    });
    withWorld(W2 => { W2.zones.city.parts.site_prebuilt_stadium_bowl.z -= 5; }, () => {
        assert.ok(has(D.hqWorldValidate().errors, /off the join's line/), 'a stadium moved 5 m off its road');
    });
    withWorld(W2 => { W2.zones.city.joins = W2.zones.city.joins.filter(j => j.b !== 'site_prebuilt_stadium_bowl' && j.a !== 'site_prebuilt_stadium_bowl'); }, () => {
        assert.ok(has(D.hqWorldValidate().errors, /not reached from the hub/), 'a part with no join is cut off');
    });
    withWorld(W2 => { delete W2.zones.forecourt.parts.hq_grounds.planned.w; }, () => {
        assert.ok(has(D.hqWorldValidate().errors, /planned without a size/));
    });
    withWorld(W2 => { W2.zones.woods.parts.site_prebuilt_downtown_streets = clone(W2.zones.city.parts.site_prebuilt_downtown_streets); }, () => {
        assert.ok(has(D.hqWorldValidate().errors, /in two zones/));
    });
    assert.equal(D.hqWorldValidate().ok, true, 'the shipped table is untouched');
});

test('THE LAND SHEET: the fog draws the room you stand in and names its neighbours UNCHARTED; the planned parts only with all', () => {
    const here = 'site_prebuilt_downtown_streets';
    const S = D.hqWorldSheet({}, here, {});
    assert.equal(S.ground, 'surface');
    const me = S.parts.find(p => p.id === here);
    assert.ok(me && me.st === 'here', 'the room you stand in');
    assert.ok(S.parts.some(p => p.st === 'q' && p.label === 'UNCHARTED'), 'a joined neighbour is an outline');
    assert.ok(!S.parts.some(p => p.planned), 'no planned part without all');
    assert.ok(!S.parts.some(p => p.st === 'seen' && p.id !== here), 'nothing else is charted on a fresh profile');
    const A = D.hqWorldSheet({}, here, { all: true });
    assert.ok(A.parts.some(p => p.planned), 'EW_HQ_MAP_ALL draws the parts not built yet');
    assert.ok(A.parts.some(p => p.absorbedBy === 'woods_field'), 'the woods field\'s rooms at their spots');
    assert.ok(A.joins.length >= 20 && A.doors.length > 0, 'joins and the doors that are still doors');
    assert.ok(A.grounds.length >= 3, 'the grounds are tabs');
    for (const j of A.joins) assert.ok(isFinite(j.x0 != null ? j.x0 : j.x), 'a join has a place');
});

test('the LAND tab: map.js draws hqWorldSheet into an SVG with a card and a ground switch; the CSS carries its classes', () => {
    for (const fn of ['_hqLandModel', '_hqLandSvg', '_hqLandPick', '_hqLandCardHtml']) assert.match(MP, new RegExp('function ' + fn + '\\('), fn);
    assert.match(MP, /hqWorldSheet\(/, 'the sheet comes from data.js');
    assert.match(MP, /data-mapmode="land"/, 'the LAND tab');
    assert.match(MP, /data-mapground/, 'the ground tabs');
    assert.match(CSS, /\.hq-land-part/, 'the part rectangles are styled');
});

test('THE BUILDING MERGE: a map-builder building draws one mesh per face, a quad per storey wearing the whole sprite', () => {
    const at = TR.indexOf('function _nrSpriteBuilding(');
    const body = TR.slice(at, TR.indexOf('\n    }\n', at));
    assert.ok(at > 0);
    assert.doesNotMatch(body, /new THREE\.PlaneGeometry\(fw, h\)/, 'no plane per storey');
    assert.match(body, /for \(var st = 0; st < stack; st\+\+\) \{\n\s+var y0 = st \* h/, 'a quad per storey');
    assert.match(body, /fp\.push\(-fw \/ 2, y1, 0, fw \/ 2, y1, 0, -fw \/ 2, y0, 0, fw \/ 2, y0, 0\)/, 'the storey quad (PlaneGeometry\'s vertex order)');
    assert.match(body, /fu\.push\(uL, vT, uR, vT, uL, vB, uR, vB\)/, 'each storey wears the whole trimmed sprite');
    assert.match(body, /var f = new THREE\.Mesh\(fg, fm\); f\.name = 'nr_face';/, 'one mesh a face');
});

test('THE INSTANCE PASS is wired: built from the walk\'s frame once ready, dropped in _hqLeave BEFORE the hand-over, the AO hook knows instanceMatrix, the occluder skips a batch, a kill-switch', () => {
    assert.match(TR, /if \(H\.ready\) _hqInstTick\(H, now\);/, 'the walk ticks it');
    const leave = TR.slice(TR.indexOf('    function _hqLeave('), TR.indexOf('    function _hqRefreshLamps('));
    const drop = leave.indexOf('_hqInstDrop(H)'), stash = leave.indexOf('_hqHandoverStash(H, opts)');
    assert.ok(drop > 0 && stash > drop, 'the originals are restored before the groups are handed to the battle');
    assert.match(TR, /#ifdef USE_INSTANCING\\nvHqWp = \( modelMatrix \* instanceMatrix \* vec4\( transformed, 1\.0 \) \)\.xyz;/, 'the room-box AO reads a batched copy\'s world point');
    assert.match(TR, /if \(o\._ew_hqInst \|\| o\._ew_hqTerrain/, 'the occluder field never fades a batch');
    assert.match(TR, /window\.EW_HQ_NO_INSTANCE/, 'the kill-switch');
    assert.match(TR, /hqInst: function \(\) \{ return _hqInstStats\(_hq\); \}/, 'the dev read-out');
});

test('THE INSTANCE PASS on a synthetic room (real three r128): batches, reads back moves, zeroes a hidden copy, hands back a tinted one, restores all on drop', () => {
    let THREE = null; try { THREE = require('three'); } catch (e) { THREE = null; }
    if (!THREE || !THREE.InstancedMesh) { console.log('  (three r128 not installed — the synthetic instance check is skipped)'); return; }
    const a = TR.indexOf('    /* ══ THE INSTANCE PASS (OPEN_WORLD_PLAN.md Phase 0');
    const b = TR.indexOf('    /* THE GATE (2026-09-20)');
    assert.ok(a > 0 && b > a, 'the block');
    function _hqAoHook() {}
    const ctx = { THREE, console, performance, _hqAoHook, _hqUnits: () => 1, _flagMeshShadows() {}, HQ_STAGE_RULES: { instanceMin: 4, instanceCell: 32 }, window: {}, _hq: null };
    vm.createContext(ctx);
    vm.runInContext(TR.slice(a, b) + '\nthis.build = _hqInstBuild; this.sync = _hqInstSync; this.drop = _hqInstDrop; this.tick = _hqInstTick; this.stats = _hqInstStats; this.bump = function () { _hqInstStamp++; };', ctx);
    const scene = new THREE.Scene(), propGroup = new THREE.Group(), shellGroup = new THREE.Group(), doorGroup = new THREE.Group();
    scene.add(propGroup, shellGroup, doorGroup);
    const geo = new THREE.BoxGeometry(1, 2, 1); geo._ew_shared = true;
    const mat = new THREE.MeshLambertMaterial(); mat._ew_shared = true; mat.onBeforeCompile = _hqAoHook;
    const own = new THREE.MeshLambertMaterial();   // not shared: draws itself
    const copies = [];
    for (let i = 0; i < 6; i++) {
        const g = new THREE.Group(); g.position.set(i * 3, 0, 1); g.rotation.y = i * 0.3;
        const m = new THREE.Mesh(geo, mat); m.position.y = 1; m.scale.setScalar(1 + i * 0.1); g.add(m); propGroup.add(g); copies.push(m);
    }
    const lone = new THREE.Mesh(geo, own); propGroup.add(lone);
    const H = { scene, propGroup, shellGroup, doorGroup, ready: true };
    ctx._hq = H;
    const I = ctx.build(H);
    assert.equal(I.batches, 1, 'six copies in one cell: one batch');
    assert.equal(I.copies, 6);
    assert.equal(I.left, 0, 'the unshared mesh is not a candidate');
    assert.ok(copies.every(m => m.visible === false && m._ew_instHidden), 'the originals are hidden');
    assert.equal(lone.visible, true);
    assert.equal(scene.onBeforeRender, I.hook, 'the read-back rides the scene\'s own pre-draw hook');
    const im = I.recs[0].im;
    assert.equal(im.isInstancedMesh, true); assert.equal(im.count, 6);
    const world = (k) => { const out = new THREE.Matrix4(); im.getMatrixAt(k, out); return out.premultiply(im.matrix); };
    const close = (A, B) => A.elements.every((v, i) => Math.abs(v - B.elements[i]) < 1e-4);
    scene.updateMatrixWorld(true);
    copies.forEach((m, k) => assert.ok(close(world(k), m.matrixWorld), 'copy ' + k + ' draws where its original stands'));
    /* culling stays right: the shared geometry's sphere, carried by the batch's frame, holds every copy */
    const sph = geo.boundingSphere.clone().applyMatrix4(im.matrix);
    copies.forEach(m => { const p = new THREE.Vector3().setFromMatrixPosition(m.matrixWorld); assert.ok(p.distanceTo(sph.center) <= sph.radius, 'inside the batch\'s sphere'); });
    /* a copy moves (a seat, a shove): read back next frame */
    copies[2].parent.position.z = 4; scene.updateMatrixWorld(true); ctx.bump(); ctx.sync(H);
    assert.ok(close(world(2), copies[2].matrixWorld), 'the move is read back');
    /* a copy flies far off: the batch refits so culling still holds it */
    copies[5].parent.position.x = 500; scene.updateMatrixWorld(true); ctx.bump(); ctx.sync(H);
    assert.ok(close(world(5), copies[5].matrixWorld), 'the far copy is read back');
    const sph2 = geo.boundingSphere.clone().applyMatrix4(im.matrix);
    assert.ok(new THREE.Vector3(500, 1, 1).distanceTo(sph2.center) <= sph2.radius, 'the refit sphere holds it');
    /* an ancestor hidden: the copy is zeroed (not drawn), and comes back when shown */
    copies[1].parent.visible = false; ctx.bump(); ctx.sync(H);
    const zero = new THREE.Matrix4(); im.getMatrixAt(1, zero);
    assert.ok(zero.elements.every(v => v === 0), 'a hidden prop is not drawn');
    copies[1].parent.visible = true; ctx.bump(); ctx.sync(H);
    assert.ok(close(world(1), copies[1].matrixWorld), 'shown again');
    /* detached: zeroed */
    propGroup.remove(copies[3].parent); ctx.bump(); ctx.sync(H);
    im.getMatrixAt(3, zero); assert.ok(zero.elements.every(v => v === 0), 'a removed prop is not drawn');
    /* its material swapped (a tint, a fade): handed back to the original for good */
    const tint = mat.clone(); copies[4].material = tint; ctx.bump(); ctx.sync(H);
    assert.equal(copies[4].visible, true, 'the tinted original draws itself');
    im.getMatrixAt(4, zero); assert.ok(zero.elements.every(v => v === 0), 'and its batch copy is gone');
    assert.equal(ctx.stats(H).copies, 5);
    assert.equal(copies[4]._ew_noInstance, true, 'a handed-back copy is never batched again');
    /* files that land after the gate: three more copies in another cell join as their own batch (the kind already has six) */
    const late = [];
    for (let i = 0; i < 3; i++) { const m = new THREE.Mesh(geo, mat); m.position.set(200 + i, 1, 0); propGroup.add(m); late.push(m); }
    scene.updateMatrixWorld(true);
    ctx.tick(H, performance.now() + 1e6);
    assert.equal(ctx.stats(H).batches, 2, 'a second batch');
    assert.ok(late.every(m => m.visible === false), 'the late copies are batched');
    assert.equal(copies[4].visible, true, 'the handed-back copy still draws itself');
    /* once a frame: a second sync in the same frame writes nothing */
    im.instanceMatrix.needsUpdate = false; const v0 = im.instanceMatrix.version;
    ctx.sync(H); assert.equal(im.instanceMatrix.version, v0, 'the pixel mask / reflector renders reuse the frame\'s read-back');
    /* the drop restores every original it hid, and the scene's hook */
    ctx.drop(H);
    assert.equal(H.inst, null);
    assert.ok(copies.concat(late).every(m => m.visible === true && !m._ew_instHidden), 'every original draws itself again');
    assert.notEqual(scene.onBeforeRender, I.hook);
    assert.equal(im.parent, null, 'the batch left the scene');
    /* the kill-switch: no batches */
    ctx.window.EW_HQ_NO_INSTANCE = true;
    assert.equal(ctx.build(H), null);
    assert.ok(copies.every(m => m.visible === true));
});

test('THE INSTANCE PASS leaves alone what it cannot draw right: a vertex hook it does not know, a skinned mesh, a group flagged _ew_noInstance', () => {
    let THREE = null; try { THREE = require('three'); } catch (e) { THREE = null; }
    if (!THREE || !THREE.InstancedMesh) { console.log('  (three r128 not installed — skipped)'); return; }
    const a = TR.indexOf('    /* ══ THE INSTANCE PASS (OPEN_WORLD_PLAN.md Phase 0'), b = TR.indexOf('    /* THE GATE (2026-09-20)');
    function _hqAoHook() {}
    const ctx = { THREE, console, performance, _hqAoHook, _hqUnits: () => 1, _flagMeshShadows() {}, HQ_STAGE_RULES: { instanceMin: 4, instanceCell: 32 }, window: {}, _hq: null };
    vm.createContext(ctx);
    vm.runInContext(TR.slice(a, b) + '\nthis.build = _hqInstBuild;', ctx);
    const scene = new THREE.Scene(), propGroup = new THREE.Group(); scene.add(propGroup);
    const geo = new THREE.BoxGeometry(); geo._ew_shared = true;
    const sway = new THREE.MeshLambertMaterial(); sway._ew_shared = true; sway.onBeforeCompile = function (s) { s.vertexShader += ''; };
    for (let i = 0; i < 5; i++) propGroup.add(new THREE.Mesh(geo, sway));
    const ok = new THREE.MeshLambertMaterial(); ok._ew_shared = true;
    const flagged = new THREE.Group(); flagged._ew_noInstance = true; propGroup.add(flagged);
    for (let i = 0; i < 5; i++) flagged.add(new THREE.Mesh(geo, ok));
    const H = { scene, propGroup, ready: true }; ctx._hq = H;
    const I = ctx.build(H);
    assert.equal(I.batches, 0, 'nothing batched');
    assert.ok(propGroup.children.every(o => o.visible), 'nothing hidden');
});

test('THE READOUT: the walk\'s FPS counter adds the whole frame\'s draw calls and triangles', () => {
    assert.match(TR, /' CALLS · '/, 'the counter prints the calls');
    assert.match(TR, /renderer\.info\.autoReset = false; renderer\.info\.reset\(\);/, 'summed over every render of the frame');
    assert.match(TR, /_hqFrameInfo = \{ calls: renderer\.info\.render\.calls, tris: renderer\.info\.render\.triangles \};/);
    assert.match(TR, /frame: _hqFrameInfo,/, 'the perf read carries it');
});
