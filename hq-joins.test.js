'use strict';
/* THE JOINS (OPEN_WORLD_PLAN.md Phase 2, 2026-09-26) + THE FILE TRACKER (fork 5's default):
   - the door join: the medical wing's five rooms on one stage, each join a pair of doors one wall apart, facing;
   - the stitch: an edge join's two parts read the same target profile (and, heavy, compile to fields that agree);
   - the open side: hqShellSideOpen lists what each side leaves open;
   - the tracker: an owned gate records only its own build's files, idleExcept skips the far props, the near/far
     split measures from the joined spans. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const {loadGameData} = require('./load-data');
const {heavy} = require('./test-heavy');
const D = loadGameData(), HQ = D.DOOR_HQ;
const R = n => vm.runInContext(n, D);
const HQ_STAGE_RULES = R('HQ_STAGE_RULES'), HQ_WORLD_RULES = R('HQ_WORLD_RULES');
const DT = 'site_prebuilt_downtown_streets', STRIP = 'site_prebuilt_strip_streets', BOWL = 'site_prebuilt_stadium_bowl';
const WING = ['medwing', 'medical', 'dispensary', 'interrogation', 'padded'];
const renderer = fs.readFileSync(__dirname + '/three-renderer.js', 'utf8');
const mapSrc = fs.readFileSync(__dirname + '/map.js', 'utf8');
function extract(name) {
 const start = renderer.indexOf('    function ' + name + '(');
 const end = renderer.indexOf('\n    }', start);
 assert.ok(start >= 0 && end > start, name);
 return renderer.slice(start, end + 6);
}
const plain = v => JSON.parse(JSON.stringify(v));
const near = (a, b, e = 1e-6) => Math.abs(a - b) <= e;

test('the medical wing is a staged zone of the building: five box rooms, four door joins, the world valid', () => {
 assert.ok(HQ_STAGE_RULES.zones.includes('medwing'));
 for (const id of WING) assert.ok(D.hqStagePart(id), id + ' is a staged part');
 assert.equal(HQ.world.zones.medwing.ground, 'hq');
 const joins = D.hqWorldJoins().filter(j => j.kind === 'door' && WING.includes(j.a));
 assert.equal(joins.length, 4, 'the wing\'s four door joins');
 assert.ok(joins.every(j => j.door && j.bDoor), 'each names its two doors');
 assert.equal(D.hqWorldValidate().ok, true, JSON.stringify(D.hqWorldValidate().errors));
});

test('every door join is two doors one wall apart, facing, the same opening both sides', () => {
 for (const j of D.hqWorldJoins().filter(q => q.kind === 'door' && q.door)) {   // a planned interior's door join (no doors named yet) is a later phase's
  const J = D.hqWorldDoorJoinResolve(j);
  assert.ok(J, j.a + ' ⇄ ' + j.b);
  assert.ok(near(J.gap, HQ_WORLD_RULES.wallM, 0.05), j.a + ' ⇄ ' + j.b + ' gap ' + J.gap);
  assert.equal(J.faceOk, true, j.a + ' ⇄ ' + j.b + ' face each other');
  assert.ok(J.ow > 0.8 && J.oh > 1.8, 'a walkable opening');
  const A = D.hqStageDoorJoin(j.a, j.door), B = D.hqStageDoorJoin(j.b, j.bDoor);
  assert.ok(A && B);
  assert.equal(A.nb, j.b); assert.equal(B.nb, j.a);
  assert.equal(A.otherDoor, j.bDoor); assert.equal(B.otherDoor, j.door);
 }
 assert.equal(D.hqStageDoorJoin('medwing', 'no_such_door'), null);
});

test('a door join is a doorway span on its wall, no link replaced; the side lists it as open', () => {
 const nbs = D.hqStageNeighbours('medwing');
 assert.deepEqual(plain(nbs.map(n => n.id).sort()), ['dispensary', 'interrogation', 'medical']);
 for (const nb of nbs) {
  assert.equal(nb.links.length, 0, 'a door join replaces no link door (the door itself swings)');
  assert.equal(nb.spans.length, 1);
  const sp = nb.spans[0];
  assert.equal(sp.kind, 'door'); assert.ok(sp.door && sp.pad > 0 && sp.depth > HQ_WORLD_RULES.wallM);
  const open = D.hqShellSideOpen('medwing', sp.side);
  assert.ok(open.some(o => o.nb === nb.id && o.door === sp.door && near(o.t0, sp.t0) && near(o.t1, sp.t1)));
 }
 assert.deepEqual(plain(D.hqShellSideOpen('central_egress', 'n')), [], 'an unstaged room opens nothing');
});

test('the city\'s edge joins are open sides too, and each side of a join stitches to the same height', () => {
 assert.ok(D.hqShellSideOpen(DT, 'n').some(o => o.nb === BOWL && o.kind !== 'door'));
 assert.ok(D.hqShellSideOpen(DT, 'w').some(o => o.nb === STRIP));
 assert.ok(HQ_WORLD_RULES.stitchM > 0);
 for (const [a, b] of [[DT, BOWL], [DT, STRIP]]) {
  const ra = D.hqTerrainStitchRows(a).find(s => s.other === b), rb = D.hqTerrainStitchRows(b).find(s => s.other === a);
  assert.ok(ra && rb, a + ' ⇄ ' + b);
  const ya = D.hqWorldFrame(a).y, yb = D.hqWorldFrame(b).y;
  assert.ok(near(ra.yAt(ra.t0) + ya, rb.yAt(rb.t0) + yb, 1e-6), 'one zone height both sides');
  assert.equal(ra.m, HQ_WORLD_RULES.stitchM);
 }
 assert.deepEqual(plain(D.hqTerrainStitchRows('medwing')), [], 'a door join never stitches a field');
 assert.deepEqual(plain(D.hqTerrainStitchRows('site_prebuilt_heaven_stair')), [], 'a zone the stage does not walk is not stitched yet');
 assert.deepEqual(plain(D.hqTerrainStitchRows('site_prebuilt_camelot_ward').map(r => r.other)).sort(), ['site_prebuilt_camelot_road', 'site_prebuilt_olympus_foothills'], 'the ward (OPEN WORLD Phase 6) stitches to the road and the foothills');
});

test('the stitch: Downtown and the Strip compile alone to fields that meet along their join', heavy, () => {
 const a = HQ.rooms[DT], b = HQ.rooms[STRIP];
 const ia = D.hqTerrainCompile(a, DT), ib = D.hqTerrainCompile(b, STRIP);
 const J = D.hqWorldJoinResolve(D.hqWorldJoins(DT).find(j => (j.a === DT && j.b === STRIP) || (j.b === DT && j.a === STRIP)));
 let worst = 0;
 for (let k = 0; k <= 20; k++) {
  const g = J.g0 + (J.g1 - J.g0) * k / 20, q = J.line === 'x' ? [g, J.at] : [J.at, g];
  const pa = D.hqZoneToRoom(DT, q[0], q[1]), pb = D.hqZoneToRoom(STRIP, q[0], q[1]);
  const ha = D.hqTerrainHeight(ia, pa.x, pa.z) + D.hqWorldFrame(DT).y, hb = D.hqTerrainHeight(ib, pb.x, pb.z) + D.hqWorldFrame(STRIP).y;
  worst = Math.max(worst, Math.abs(ha - hb));
 }
 assert.ok(worst <= 0.05, 'the two fields differ by ' + worst.toFixed(3) + ' m on the line');
});

test('the renderer: a joined door is cut through its wall, swings for the walker from either side, and is no press-in', () => {
 assert.match(renderer, /function _hqJoinDoorTick\(H, d, px, pz, dt\)/);
 assert.match(renderer, /function _hqDoorSleeve\(/);
 assert.match(extract('_hqFindTarget'), /d\.join && _hqJoinOn\(_hq, d\.join\.nb\)/);
 assert.match(extract('_hqTickDoors'), /_hqJoinDoorTick/);
 assert.match(extract('_hqStageTickPart'), /dd\.join\) _hqJoinDoorTick\(H, dd, q\.x, q\.z, dt\)/, 'a neighbour\'s leaf swings from the other side');
 assert.match(extract('_hqStageSwap'), /keepCast/, 'a closed room keeps its cast when you step out');
 assert.match(mapSrc, /nb\.spans \|\| \[\]\)\.find\(sp => sp\.door\)/, 'a door crossing records the door used');
});

test('THE FILE TRACKER: an owned gate records only its own build; idleExcept skips the far props', () => {
 const a = renderer.indexOf('    var AL_SETTLE_MS'), b = renderer.indexOf('\n    }', renderer.indexOf('    function _alGateOpen('));
 assert.ok(a > 0 && b > a);
 let clock = 0;
 const ctx = vm.createContext({ performance: { now: () => clock }, setTimeout: () => 0, clearTimeout: () => {}, console });
 vm.runInContext(renderer.slice(a, b + 6) + '\nthis._alTrack=_alTrack; this._alGateOpen=_alGateOpen; this.setOwner=function(g){_alOwner=g;};', ctx);
 const room = ctx._alGateOpen('room'), A = ctx._alGateOpen('part:a', { own: true }), B = ctx._alGateOpen('part:b', { own: true });
 ctx.setOwner(A); const r1 = ctx._alTrack('model', 'a.glb'), r2 = ctx._alTrack('model', 'far.glb');
 ctx.setOwner(B); const r3 = ctx._alTrack('model', 'b.glb');
 ctx.setOwner(null);
 assert.equal(A.total, 2); assert.equal(B.total, 1); assert.equal(room.total, 3, 'an unowned gate still records everything');
 clock = 100; r1.settle(true);
 const skip = {}; skip[r2.id] = 1;
 assert.equal(A.idleExcept(skip), false, 'the settle beat');
 clock = 100 + 301;
 assert.equal(A.idleExcept(skip), true, 'the near files are in: the part stands, the far prop still landing');
 assert.equal(A.idle(), false, 'the whole gate still waits for it');
 assert.equal(A.pendingExcept(skip), 0); assert.equal(A.pending(), 1);
 assert.equal(B.idleExcept({}), false, 'B waits on its own file only'); r3.settle(true); clock += 400; assert.equal(B.idleExcept({}), true);
});

test('THE FILE TRACKER: near and far measured from the joined spans; fork 5 is the default; the book and the warm are wired', () => {
 const ctx = vm.createContext({ Math });
 vm.runInContext(extract('_hqTrkDist') + '\nthis.d=_hqTrkDist;', ctx);
 const spans = [{ side: 'n', t0: -12, t1: 12 }];
 assert.ok(near(ctx.d(spans, 50, 40, 0, -40), 0));
 assert.ok(near(ctx.d(spans, 50, 40, 0, 20), 60));
 assert.ok(near(ctx.d(spans, 50, 40, 15, -40), 3), 'past the span\'s end: to its end');
 assert.equal(HQ_STAGE_RULES.propsGate, 'near');
 assert.ok(HQ_STAGE_RULES.nearPropM >= 30 && HQ_STAGE_RULES.trkMs > 0);
 assert.match(extract('_hqStageReady'), /idleExcept\(E\.trk\.farOnly\)/);
 assert.match(renderer, /HQ_BOOK_KEY = 'ew_hqFileBook_v1'/);
 assert.match(extract('_hqGateTick'), /_hqBookWrite\(/, 'a room\'s card writes its files down');
 assert.match(renderer, /warmRoom: function[^\n]*_hqWarmRoom|warmRoom: _hqWarmRoom|warmRoom\(roomId, o\)[^\n]*_hqWarmRoom/);
 assert.match(renderer, /_hqWarmTick\(/);
});
