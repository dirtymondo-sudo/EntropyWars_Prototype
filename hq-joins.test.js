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
const DT = 'site_prebuilt_downtown_streets', BOWL = 'site_prebuilt_stadium_bowl', HARB = 'site_prebuilt_downtown_harbour';
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
 assert.ok(D.hqShellSideOpen(DT, 's').some(o => o.nb === HARB), 'the harbour\'s shore south (G6: the Strip no longer joins the west edge — it stands on the land)');
 assert.ok(HQ_WORLD_RULES.stitchM > 0);
 for (const [a, b] of [[DT, BOWL], [DT, HARB]]) {
  const ra = D.hqTerrainStitchRows(a).find(s => s.other === b), rb = D.hqTerrainStitchRows(b).find(s => s.other === a);
  assert.ok(ra && rb, a + ' ⇄ ' + b);
  const ya = D.hqWorldFrame(a).y, yb = D.hqWorldFrame(b).y;
  assert.ok(near(ra.yAt(ra.t0) + ya, rb.yAt(rb.t0) + yb, 1e-6), 'one zone height both sides');
  if (b === BOWL) assert.equal(ra.m, HQ_WORLD_RULES.stitchM);
 }
 assert.deepEqual(plain(D.hqTerrainStitchRows('medwing')), [], 'a door join never stitches a field');
 assert.deepEqual(plain(D.hqTerrainStitchRows('site_prebuilt_heaven_stair')), [], 'a zone the stage does not walk is not stitched yet');
 assert.deepEqual(plain(D.hqTerrainStitchRows('site_prebuilt_camelot_ward').map(r => [r.other, r.side])), [['land', 'n'], ['land', 's'], ['land', 'e'], ['land', 'w']], 'the ward (G6) is an island on the land: its four edges ease to its pad');
});

test('the stitch (G6): every site on the land compiles alone to a field whose four edges stand on its pad (its authored tiers aside)', heavy, () => {
 const Z = vm.runInContext('HQ_WORLD.zones.land', D), bad = [];
 let n = 0;
 for (const id of Object.keys(Z.parts)) {
  const room = HQ.rooms[id]; if (id === 'land' || !room || !room.terrain) continue;
  const j = D.hqWorldJoins(id).find(j => j.kind === 'island' && j.b === id && j.y != null); if (!j) continue;
  const S = room.shell, info = D.hqTerrainCompile(room, id), fy = D.hqWorldFrame(id).y || 0;
  /* an authored tier (a plateau, a ramp) keeps its own height at the edge — the stair's landing stays a landing */
  const tier = (x, z) => room.terrain.features.some(f => f.k === 'plateau' ? (f.r > 0 ? Math.hypot(x - f.x, z - f.z) < f.r + 1 : Math.abs(x - f.x) <= (f.w || 0) / 2 + 1 && Math.abs(z - f.z) <= (f.d || 0) / 2 + 1)
   : (f.k === 'ramp' && f.x0 != null) ? (() => { const dx = f.x1 - f.x0, dz = f.z1 - f.z0, L2 = dx * dx + dz * dz || 1, u = ((x - f.x0) * dx + (z - f.z0) * dz) / L2; return u >= -0.1 && u <= 1.1 && Math.hypot(x - f.x0 - dx * u, z - f.z0 - dz * u) <= (f.w || 0) / 2 + 1; })() : false);
  let worst = 0;
  for (let k = 0; k <= 20; k++) {
   const tx = -S.w / 2 + S.w * k / 20, tz = -S.d / 2 + S.d * k / 20;
   for (const [x, z] of [[tx, -S.d / 2], [tx, S.d / 2], [-S.w / 2, tz], [S.w / 2, tz]]) if (!tier(x, z)) worst = Math.max(worst, Math.abs(D.hqTerrainHeight(info, x, z) + fy - j.y));
  }
  n++; if (worst > 0.05) bad.push(id + ' ' + worst.toFixed(3) + ' m off its pad');
 }
 assert.ok(n >= 15, n + ' sites checked');
 assert.deepEqual(bad, []);
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

/* ══ THE PORTALS (WORLD_GEOGRAPHY_PLAN.md G1 = OPEN_WORLD_PLAN.md Phase 12, 2026-09-28): a door join is a portal — a
   neighbour behind shut doors (or open ones off screen) is not drawn; the lamp count never moves (the dark pads) */
function cullCtx(extra) {
 const c = Object.assign({ HQ_STAGE_RULES, HQ_WORLD_RULES, console, Math, Object, window: {} }, extra || {});
 vm.createContext(c);
 vm.runInContext('var _hqStageV = null;\n' + ['_hqCullOff', '_hqCullCand', '_hqCullSees', '_hqCullWant', '_hqCullShut', '_hqStagePick', '_hqStageLamps', '_hqCullPads', '_hqCullPadsSet'].map(extract).join('\n')
  + '\nvar HQ_CULL_SEE = ' + renderer.match(/var HQ_CULL_SEE = (\/[^\n]*\/i);/)[1] + ';', c);
 return c;
}
test('THE PORTALS: a neighbour joined only by doors is a candidate (the medical wing), an open edge / an island never', () => {
 const c = cullCtx();
 for (const id of ['medwing', 'medical']) {
  const nbs = D.hqStageNeighbours(id);
  assert.ok(nbs.length && nbs.every(nb => c._hqCullCand(nb)), id + ': every neighbour through a door');
 }
 assert.ok(D.hqStageNeighbours(DT).every(nb => !c._hqCullCand(nb)), 'Downtown\'s roads and shore: always drawn');
 const sea = D.hqStageNeighbours('site_prebuilt_downtown_harbour').filter(nb => nb.inside || nb.host);
 assert.ok(sea.length && sea.every(nb => !c._hqCullCand(nb)), 'an island / its sea: always drawn');
 assert.equal(c._hqCullCand({ id: 'x', spans: [{ kind: 'door' }], beside: true, via: 'y' }), false, 'a room beside hangs on its host');
 assert.equal(c._hqCullCand({ id: 'x', spans: [{ kind: 'door' }, { kind: 'road' }] }), false, 'a door AND an open edge');
});
test('THE PORTALS: the doorway box is on screen unless it lies wholly behind one frustum plane', () => {
 const c = cullCtx();
 const planes = [{ normal: { x: 0, y: 0, z: -1 }, constant: 0 }, { normal: { x: 1, y: 0, z: 0 }, constant: 5 }];   // in front: z < 0; x > -5
 const box = (x, z) => [[x - 1, 0, z - 1], [x + 1, 0, z - 1], [x - 1, 2, z + 1], [x + 1, 2, z + 1]].map(([x, y, z]) => ({ x, y, z }));
 assert.equal(c._hqCullSees(planes, box(0, -10)), true, 'ahead');
 assert.equal(c._hqCullSees(planes, box(0, 10)), false, 'behind the eye');
 assert.equal(c._hqCullSees(planes, box(-20, -10)), false, 'off the left edge');
 assert.equal(c._hqCullSees(planes, box(0, 0.5)), true, 'straddling the eye: drawn');
});
test('THE PORTALS: the rule — hidden behind shut doors, shown through an open one in view, through a chain, never outside a closed box', () => {
 const c = cullCtx(), W = x => JSON.parse(JSON.stringify(c._hqCullWant(x)));
 const P = (id, o) => Object.assign({ id, cand: true, closed: true, camIn: false, via: null }, o || {});
 const base = () => ({ cur: 'hub', closed: true, parts: [P('a'), P('b'), P('c')], doors: [{ a: 'hub', b: 'a', open: false }, { a: 'hub', b: 'b', open: false }, { a: 'b', b: 'c', open: false }] });
 assert.deepEqual(W(base()).hide, { a: true, b: true, c: true }, 'every door shut: nothing past them drawn');
 let x = base(); x.doors[1].open = true;
 assert.deepEqual(W(x).hide, { a: true, c: true }, 'the open door in view shows its room only');
 x.doors[2].open = true; assert.deepEqual(W(x).hide, { a: true }, 'and through it the next room, when that door is open and in view too');
 x = base(); x.doors[2].open = true; assert.deepEqual(W(x).hide, { a: true, b: true, c: true }, 'an open door in a hidden room shows nothing');
 x = base(); x.parts[0].camIn = true; assert.deepEqual(W(x).hide, { b: true, c: true }, 'the eye stands in a room: it is drawn');
 x = base(); x.closed = false; assert.deepEqual(W(x), { on: false, hide: {} }, 'the eye outside a closed box: all drawn');
 x = base(); x.parts.push(P('road', { cand: false, closed: false })); assert.equal(W(x).on, false, 'an open-air neighbour on an edge: all drawn');
 x = base(); x.parts.push(P('hall', { cand: false, closed: true })); x.doors.push({ a: 'hall', b: 'c', open: true });
 assert.deepEqual(W(x).hide, { a: true, b: true }, 'a closed room on an open edge is drawn, and its open door shows what is past it');
 x = base(); x.parts[1].closed = false; x.doors[1].open = true; assert.equal(W(x).on, false, 'an open-air room shown through a door: all drawn');
 x = base(); x.parts.push(P('closet', { via: 'b' })); assert.equal(W(x).hide.closet, true, 'a room beside follows its host');
 x.doors[1].open = true; assert.equal(W(x).hide.closet, undefined);
});
test('THE PORTALS: a door is shut only with its leaf landed, at rest, solid, and the walker out of its swing', () => {
 const c = cullCtx();
 const leaf = has => ({ traverse(f) { if (has) f({ isMesh: true }); } });
 const door = o => Object.assign({ motion: {}, leafG: leaf(true), openT: 0, openApplied: 0, leaf: 'leaf_ward', ow: 1.1, box: { wx: 0, wz: 0 } }, o);
 assert.equal(c._hqCullShut(door(), 10, 10), true);
 assert.equal(c._hqCullShut(door({ leafG: leaf(false) }), 10, 10), false, 'the leaf still streaming: a hole in the wall');
 assert.equal(c._hqCullShut(door({ openT: 0.2 }), 10, 10), false, 'swinging');
 assert.equal(c._hqCullShut(door({ openApplied: -1 }), 10, 10), false, 'closing');
 assert.equal(c._hqCullShut(door({ leaf: 'leaf_portcullis' }), 10, 10), false, 'a portcullis is see-through');
 assert.equal(c._hqCullShut(door({ motion: null }), 10, 10), false, 'no leaf that moves: an open doorway');
 assert.equal(c._hqCullShut(door(), 1.5, 0), false, 'the walker within the swing: it opens the next frame');
});
test('THE PORTALS: a hidden room\'s lamps still count; the dark pads stand in, so the light count (the programs\' key) never moves', () => {
 class V3 { constructor() { this.x = 0; this.y = 0; this.z = 0; } distanceToSquared(p) { return (this.x - p.x) ** 2 + (this.y - p.y) ** 2 + (this.z - p.z) ** 2; } }
 class Group { constructor() { this.children = []; } add(o) { this.children.push(o); o.parent = this; } }
 class PointLight { constructor() { this.isPointLight = true; this.visible = true; this.intensity = 0; } }
 const c = cullCtx({ THREE: { Vector3: V3, Group, PointLight } });
 const mk = x => ({ isPointLight: true, visible: true, x, getWorldPosition(v) { v.x = this.x; v.y = 0; v.z = 0; return v; } });
 const root = ls => ({ traverse(fn) { ls.forEach(fn); } });
 const own = [mk(0), mk(5)], nb = Array.from({ length: 6 }, (_, i) => mk(10 + i)), nbRoot = root(nb);
 const scene = new Group(); scene.userData = {};
 const H = { scene, camera: { position: { x: 0, y: 0, z: 0 } }, partRoot: root(own), stage: { parts: { a: { attached: true, P: { partRoot: nbRoot } } } } };
 const lit = () => [...own, ...(nbRoot.visible === false ? [] : nb)].filter(l => l.visible).length + (scene.userData.ewCullPads ? scene.userData.ewCullPads.list.filter(p => p.visible).length : 0);
 c._hqStageLamps(H); assert.equal(H.stage.lampN, 8); assert.equal(lit(), 8);
 nbRoot.visible = false; c._hqStageLamps(H);
 assert.equal(H.stage.lampN, 8, 'the count kept'); assert.equal(lit(), 8, 'two lamps of our own + six dark pads');
 assert.ok(scene.userData.ewCullPads.list.every(p => p._ew_cullPad && p.intensity === 0));
 nbRoot.visible = true; c._hqStageLamps(H); assert.equal(lit(), 8, 'shown again: the pads rest');
 assert.ok(scene.userData.ewCullPads.list.every(p => !p.visible));
});
test('THE PORTALS are wired: the frame, the door record, the swap / the detach / the leave, the warm-up, the switch, the API', () => {
 assert.match(renderer, /_hqStageTick\(H, dt, now\);[^\n]*\n\s+if \(H\.stage\) \{ try \{ _hqCullTick\(H, now\); \}/, 'right after the stage tick');
 assert.match(renderer, /rec\.join = dj; rec\.joinBack = back; rec\.leafG = leafGroup; rec\.oh = oh; rec\.pd = pd;/);
 assert.match(extract('_hqStageSwap'), /_hqCullReset\(H\);[^\n]*\n\s+try \{ _hqLodReset\(H\); \}/);
 assert.match(extract('_hqStageAttach'), /_hqStageCssShow\(E\.P\.partRoot, false\); E\.P\.partRoot\.visible = true; \}/);
 assert.match(extract('_hqLeave'), /_hqCullReset\(H\)/);
 assert.match(extract('_hqWarmNew'), /!L\._ew_cullPad &&/); assert.match(extract('_hqWarmNew'), /if \(pk\.pad\) _hqCullPads\(H, pk\.pad\)/);
 assert.match(renderer, /_HQ_ZONE_KEYS\.cull = 1;/);
 assert.match(extract('_hqCullOff'), /window\.EW_NO_PORTALS/);
 assert.match(renderer, /cull: function \(\) \{ return _hq \? _hqCullStats\(_hq\) : null; \},/);
 assert.match(extract('_hqCullLightsBad'), /!o\.isPointLight \|\| o\.castShadow/, 'a part with a spot / a sun / a shadow lamp is never hidden');
});
