'use strict';
/* THE WEST + THE BASEMENT (OPEN_WORLD_PLAN.md Phase 4, 2026-09-27; WORLD_GEOGRAPHY_PLAN.md G6, 2026-09-28):
   - G6: THE WOODS' parts stand apart on THE LAND, each on its own pad (the trail and the pasture retired, the trail joins
     and the draughts between the parts gone): the land is how you walk from one to the next; every edge of a part is an
     island edge onto the land; Dead Man's Cave is a door off the land (the storm drain's mouth);
   - the renderer's trail post and the treeline's cut are kept for the joins that remain;
   - THE BASEMENT: ten rooms on one stage by DOOR JOINS (the medical wing's recipe), the secret doors left doors.
   The wells (every well under its own place) are hq-cave.test.js's. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const {loadGameData} = require('./load-data');
const {heavy} = require('./test-heavy');
const D = loadGameData(), HQ = D.DOOR_HQ;
const R = n => vm.runInContext(n, D);
const HQ_STAGE_RULES = R('HQ_STAGE_RULES'), HQ_WORLD_RULES = R('HQ_WORLD_RULES'), W = R('HQ_WORLD');
const renderer = fs.readFileSync(__dirname + '/three-renderer.js', 'utf8');
const P = 'site_prebuilt_';
const WOODS = ['fairy_forest_clearing', 'fairy_forest_stair', 'fairy_forest_redwoods', 'fairy_forest_ritual',
               'bohemian_grove_grove', 'skinwalker_fields', 'shasta_slopes', 'haunted_grounds'].map(s => P + s);
const BASEMENT = ['services', 'kitchen', 'coldroom', 'laundry', 'dock', 'corridor_a', 'boiler', 'corridor_b', 'server', 'deadend'];
function extract(name) {
 const start = renderer.indexOf('    function ' + name + '(');
 const end = renderer.indexOf('\n    }', start);
 assert.ok(start >= 0 && end > start, name);
 return renderer.slice(start, end + 6);
}
/* a door's point on its own wall, in room metres */
function doorPt(room, d) {
 const S = room.shell, t = (d.wall === 'n' || d.wall === 's') ? (d.x || 0) : (d.z || 0);
 return d.wall === 'n' ? [t, -S.d / 2] : d.wall === 's' ? [t, S.d / 2] : d.wall === 'e' ? [S.w / 2, t] : [-S.w / 2, t];
}

test('the world is valid; the land and the basement are staged zones; every woods room is a staged part of the land on its own pad', () => {
 const v = D.hqWorldValidate();
 assert.ok(v.ok, v.errors.join('\n'));
 assert.ok(HQ_STAGE_RULES.zones.includes('land') && HQ_STAGE_RULES.zones.includes('basement') && !W.zones.woods);
 for (const id of WOODS) {
  const F = D.hqStagePart(id); assert.ok(F && F.zone === 'land' && !F.absorbedBy && W.zones.land.parts[id].place, id + ' is a staged part of the land, on a place');
  assert.equal(D.hqStageNeighbours(id).filter(n => !n.beside).map(n => n.id).join(), 'land', id + ' stands alone on the land');
 }
 for (const id of [P + 'fairy_forest_trail', P + 'fairy_forest_pasture']) assert.ok(!HQ.rooms[id], id + ' retired');
 for (const id of [P + 'lodge_halls', P + 'fairy_forest_deadmans']) assert.equal(D.hqStagePart(id), null, id + ' stays a door');
});

test('THE WOODS ON THE LAND: no door of one woods part leads into another; Dead Man\'s Cave opens off the land', () => {
 for (const id of WOODS) for (const d of HQ.rooms[id].doors) if (d.action && d.action.room) assert.ok(!WOODS.includes(d.action.room), id + '/' + d.id + ' → ' + d.action.room + ': the land is the way between the parts');
 const dm = HQ.rooms[P + 'fairy_forest_deadmans'].doors.find(d => d.id === 'land'), md = HQ.rooms.land.doors.find(d => d.id === 'deadmans');
 assert.ok(dm && dm.action.room === 'land' && dm.action.at === 'deadmans', 'the cave\'s way out is the land');
 assert.ok(md && md.wall === 'free' && md.action.room === P + 'fairy_forest_deadmans' && md.action.at === 'land', 'the storm drain\'s mouth stands on the land');
 /* a door join's doorway keeps its door (it swings) */
 for (const nb of D.hqStageNeighbours('medwing')) assert.equal(nb.links.length, 0, 'the wing\'s doors are not replaced');
});

test('the renderer: a replaced room door builds a trail post (no plate, no record), a way keeps its object; the treeline plants nothing in a neighbour\'s box', () => {
 const joined = extract('_hqStageJoined');
 assert.ok(!/!door\.link/.test(joined), 'a room\'s own door can be joined, not only a link\'s');
 const doors = extract('_hqBuildDoors');
 assert.match(doors, /if \(!door\.way && _hqStageJoined\(room, door\)\) \{ try \{ _hqBuildTrailPost\(room, door, y0\);/);
 const post = extract('_hqBuildTrailPost');
 assert.ok(/_ew_hqJoined = door\.id/.test(post) && !/_hq\.doors\.push/.test(post), 'the post is no door record');
 const tl = extract('_hqPlantTreeline');
 assert.match(tl, /_hqStageNearbyOf\(tlId\)/, 'every nearby staged part, joined or not (the trail\'s ring stood in the stair\'s field)');
 assert.match(tl, /hqStageNearerParts\(tlId, px, pz, nbNear\)\.length > 0/);
 assert.match(tl, /if \(nbRects\.length && inNb\(px, pz\)\) continue;/);
 /* run the post on a stub scene: one group under the door group, beside the lane, 0.6 m in */
 const G = { children: [], add(o) { this.children.push(o); } };
 class Obj { constructor() { this.children = []; this.position = { set: (x, y, z) => Object.assign(this.position, { x, y, z }) }; this.rotation = { set() {} }; } add(o) { this.children.push(o); } traverse(f) { f(this); this.children.forEach(c => c.traverse ? c.traverse(f) : f(c)); } }
 class Mesh extends Obj { constructor() { super(); this.isMesh = true; } }
 const c = { _hq: { doorGroup: G }, _hqUnits: () => 1, _hqMat: () => ({}), _hqPlateHtml: (d) => '<b>' + d.label + '</b>', document: { createElement: () => ({ style: {} }) },
  _hqBoxWall: () => ({ wx: 0, wz: -10, nx: 0, nz: 1, yaw: 0 }),
  THREE: { Group: Obj, Mesh, BoxGeometry: class {}, ConeGeometry: class {}, CSS2DObject: Obj } };
 vm.createContext(c); vm.runInContext(post, c);
 c._hqBuildTrailPost({ shell: { w: 20, d: 20 } }, { id: 'trail', wall: 'n', x: 0, label: 'THE TRAIL' }, 0);
 assert.equal(G.children.length, 1);
 const g = G.children[0];
 assert.ok(Math.abs(Math.abs(g.position.x) - 2.4) < 1e-9 && Math.abs(g.position.z - -9.4) < 1e-9, 'beside the lane, 0.6 m inside the edge');
});

test('THE FLOATING GRASS (2026-09-27): every staged part near another owns its own ground — an outer ground or a treeline never runs through a part on the stage, joined or not', () => {
 /* the trail and the stair touch without a join; both stand beside the clearing, so each one\'s rolling apron (+2.4 m at
    22 m past its edge) ran through the other\'s field: the long strip of grass in the air, gone at the crossing, back in the
    part just left. Pure geometry: for every staged part P and every part Q on P\'s stage (P\'s neighbours) or P\'s
    neighbours\' stages, a point inside Q\'s box (in P\'s metres) has Q among the parts nearer than P — so P\'s side there
    is hidden while Q is drawn */
 /* G6: the land draws its own ground and cuts it under every drawn site (the renderer's site cut) — its parts are the
    renderer's, so the land zone is left out here; the sites near each other on it still own their own boxes */
 const near = D.hqStageNearbyParts(P + 'haunted_grounds').map(n => n.id);
 assert.ok(near.includes(P + 'skinwalker_fields'), 'the haunted grounds see the estate\'s fields: ' + near.join(','));
 let checked = 0;
 HQ_STAGE_RULES.zones.filter(z => z !== 'land').forEach(z => Object.keys(W.zones[z].parts).filter(id => D.hqStagePart(id)).forEach(id => {
  const S = HQ.rooms[id].shell, drawn = new Set();
  D.hqStageNeighbours(id).forEach(n => { drawn.add(n.id); D.hqStageNeighbours(n.id).forEach(m => { if (m.id !== id) drawn.add(m.id); }); });
  const L = D.hqStageNearbyParts(id);
  drawn.forEach(q => {
   const nb = L.find(n => n.id === q); if (!nb) return;   // too far to matter (past the outer ground's run)
   const r = nb.rect;
   for (let a = 0.1; a < 1; a += 0.2) for (let b = 0.1; b < 1; b += 0.2) {
    const x = r.x0 + (r.x1 - r.x0) * a, zz = r.z0 + (r.z1 - r.z0) * b;
    if (Math.abs(x) <= S.w / 2 && Math.abs(zz) <= S.d / 2) continue;   // an overlap of the two boxes is the part\'s own
    assert.ok(D.hqStageNearerParts(id, x, zz, L).includes(q), id + ' owns a point of ' + q + '\'s box');
    checked++;
   }
  });
 }));
 assert.ok(checked > 100, 'points checked: ' + checked);
 assert.equal(D.hqStageNearerParts(P + 'fairy_forest_clearing', 0, 0).length, 0, 'the part\'s own middle is its own');
 /* the renderer cuts the outer ground by those parts and hides a side while ANY of its nearer parts is on the stage */
 const og = extract('_hqBuildOuterGround');
 assert.match(og, /stNear = _hqStageOff\(\) \? \[\] : _hqStageNearbyOf\(ownId\)/);
 assert.match(og, /var sk = hqStageNearerKey\(ownId, qx0 \+ cs \/ 2, qz0 \+ cs \/ 2, stNear\);/);
 assert.equal(D.hqStageNearerKey(P + 'fairy_forest_clearing', 0, 0), '');
 assert.ok(!near.includes(P + 'fairy_forest_clearing'), 'a part far off on the land cuts nothing');
 assert.match(og, /m\._ew_hqOuterSideIds = sideIds0\[id\] \|\| \[id\]/);
 assert.match(extract('_hqStageOuterSides'), /sm\.visible = !\(sm\._ew_hqOuterSideIds \|\| \[sid\]\)\.some\(function \(i\) \{ return on\[i\]; \}\)/);
 assert.match(extract('_hqBuildTerrain'), /var stNbs = _hqStageNearbyOf\(roomId\)/, 'the field\'s metre past the shell stands down in any nearby part\'s box');
});
test('THE STITCHED MOUTH: the compiler hands the floor plan a mouth per joined span; the plan is open past the wall only there', () => {
 const src = fs.readFileSync(__dirname + '/data.js', 'utf8');
 assert.match(src, /genUse = Object\.assign\(\{\}, T\.gen, \{ open: \(T\.gen\.open \|\| \[\]\)\.concat\(extra\), mouths: extra \}\);/);
 assert.match(src, /if \(!inShell\(px, pz, 0\)\) mask\[k\] = \(mouths\.length && inMouth\(px, pz\)\) \? 1 : 0;/);
 const rows = D.hqTerrainStitchRows(P + 'fairy_forest_stair');
 assert.ok(rows.length === 4 && rows.every(r => r.other === 'land'), 'G6: the stair is an island on the land — its four edges ease to its pad');
});

test('every woods part: each door reaches every other on foot, or walks out of the box onto the land (G6: the land joins the gaps)', heavy, () => {
 for (const id of WOODS) {
  const room = HQ.rooms[id], info = D.hqTerrainInfo(id), S = room.shell;
  const L = room.doors.map(d => D.hqTerrainDoorLanding(room, d));
  const outKeys = new Set();
  for (let t = -1; t <= 1; t += 0.02) for (const [x, z] of [[t * S.w / 2, -S.d / 2 + 0.6], [t * S.w / 2, S.d / 2 - 0.6], [-S.w / 2 + 0.6, t * S.d / 2], [S.w / 2 - 0.6, t * S.d / 2]]) outKeys.add(D.hqTerrainNodeKey(info, x, z));
  for (const a of L) {
   const reach = D.hqTerrainReach(info, a.x, a.z);
   const out = [...outKeys].some(k => reach.has(k));
   for (const b of L) assert.ok(out || reach.has(D.hqTerrainNodeKey(info, b.x, b.z)), id + ': a door neither reaches the others nor the land');
  }
 }
});

test('THE BASEMENT: ten rooms, nine door joins one wall apart and facing, every room reached from the lobby, no draught joined', () => {
 const Z = W.zones.basement;
 assert.deepEqual(Object.keys(Z.parts).sort(), BASEMENT.slice().sort());
 assert.equal(Z.hub, 'services'); assert.equal(Z.ground, 'hq'); assert.equal(Z.clock, false);
 assert.equal(Z.joins.length, 9);
 for (const j of Z.joins) {
  assert.equal(j.kind, 'door');
  const R2 = D.hqWorldDoorJoinResolve(j);
  assert.ok(R2 && Math.abs(R2.gap - HQ_WORLD_RULES.wallM) <= 0.05 && R2.faceOk, j.a + ' ⇄ ' + j.b + ': one wall apart, facing');
  for (const [room, door] of [[j.a, j.door], [j.b, j.bDoor]]) {
   const d = HQ.rooms[room].doors.find(x => x.id === door);
   assert.ok(d && !d.secret && !d.way, room + '/' + door + ': a plain door');
   assert.ok(D.hqStageDoorJoin(room, door), room + '/' + door + ': the stage knows it');
  }
 }
 for (const id of BASEMENT) assert.ok(D.hqStagePart(id), id + ' staged');
 /* the draughts and the ways up stay doors */
 assert.equal(D.hqStageDoorJoin('coldroom', 'secret'), null);
 assert.equal(D.hqStageDoorJoin('deadend', 'secret'), null);
 assert.equal(D.hqStageDoorJoin('deadend', 'hwing'), null);
 for (const [room, door] of [['services', 'elevator'], ['services', 'stairs'], ['dock', 'garage'], ['server', 'it'], ['kitchen', 'service']]) assert.equal(D.hqStageDoorJoin(room, door), null, room + '/' + door + ' stays a door');
 /* under the wing: the basement's rooms stand below the ground floor */
 for (const id of BASEMENT) assert.ok(D.hqWorldPartRect(id).y1 <= 0, id + ' is under the ground floor');
});
