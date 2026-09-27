'use strict';
/* THE STAGE (OPEN_WORLD_PLAN.md Phase 1, 2026-09-26): the city's parts on one scene — data.js's readers (the
   neighbours, the frames, the joined spans and doors, the crossing's rule) and the renderer's pieces run in a vm
   (the transforms, the crossing, the ring, the lamp budget, the terrain tiles, the feet past the edge). */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const {loadGameData} = require('./load-data');
const D = loadGameData(), HQ = D.DOOR_HQ;
const R = n => vm.runInContext(n, D);
const HQ_STAGE_RULES = R('HQ_STAGE_RULES'), HQ_WORLD_RULES = R('HQ_WORLD_RULES');
const DT = 'site_prebuilt_downtown_streets', STRIP = 'site_prebuilt_strip_streets', BOWL = 'site_prebuilt_stadium_bowl';
const renderer = fs.readFileSync(__dirname + '/three-renderer.js', 'utf8');
function extract(name) {
 const start = renderer.indexOf('    function ' + name + '(');
 const end = renderer.indexOf('\n    }', start);
 assert.ok(start >= 0 && end > start, name);
 return renderer.slice(start, end + 6);
}
function zoneKeys() {
 const a = renderer.indexOf('    var _HQ_ZONE_KEYS = {};'), b = renderer.indexOf('_HQ_ZONE_KEYS[k] = 1; });', a);
 assert.ok(a >= 0 && b > a);
 return renderer.slice(a, b + 25) + '\n' + extract('_hqZoneKey');
}
const plain = v => JSON.parse(JSON.stringify(v));
const near = (a, b, e = 1e-6) => Math.abs(a - b) <= e;
/* three.js's rotation.y about the origin (the renderer places a neighbour's root this way) */
const rotY = (th, x, z) => ({ x: x * Math.cos(th) + z * Math.sin(th), z: -x * Math.sin(th) + z * Math.cos(th) });

test('the stage stands on the city, the medical wing, the woods and the basement, and its parts are the real box rooms of its frames', () => {
 assert.deepEqual([...HQ_STAGE_RULES.zones], ['city', 'medwing', 'woods', 'basement', 'highway', 'desert', 'dumb', 'kingdom', 'mountain', 'coast']);   // + OPEN WORLD Phase 7 (2026-09-27): the coast (hq-coast.test.js)   // + OPEN WORLD Phase 6 (2026-09-27): the north (hq-mountain.test.js)   // + OPEN WORLD Phase 5 (2026-09-27): the south (hq-south.test.js)   // OPEN WORLD Phase 4 (2026-09-27): the woods (trail joins) + the basement (door joins)
 for (const id of [DT, STRIP, BOWL]) assert.ok(D.hqStagePart(id), id + ' is a staged part');
 assert.equal(D.hqStagePart('central_egress'), null, 'the building is not staged');
 assert.equal(D.hqStageNeighbours('central_egress').length, 0);
 assert.ok(HQ_STAGE_RULES.buildDelayMs > 0 && HQ_STAGE_RULES.lampPickMs > 0 && HQ_STAGE_RULES.tileM === 32 && HQ_STAGE_RULES.lampsLive === 12);
});

test('Downtown sees the stadium north and the Strip west, their boxes touching its edge, the gantry links replaced', () => {
 const nbs = D.hqStageNeighbours(DT), S = HQ.rooms[DT].shell;
 const bowl = nbs.find(n => n.id === BOWL), strip = nbs.find(n => n.id === STRIP);
 assert.ok(bowl && strip);
 assert.equal(bowl.rel.rot, 2); assert.ok(near(bowl.rel.x, 0, 1e-3)); assert.ok(near(bowl.rel.z, -154.1, 1e-3));
 assert.ok(near(bowl.rect.z1, -S.d / 2, 0.01), 'the bowl ends on Downtown\'s north edge');
 assert.deepEqual(plain(bowl.spans.map(s => [s.side, s.t0, s.t1])), [['n', -12, 12]]);
 assert.deepEqual([...bowl.links], ['link_stadium_downtown']);
 assert.equal(strip.rel.rot, 0); assert.ok(near(strip.rel.x, -162, 1e-3)); assert.ok(near(strip.rel.z, 0, 1e-3));
 assert.ok(near(strip.rect.x1, -S.w / 2, 0.01), 'the Strip ends on Downtown\'s west edge');
 assert.deepEqual(plain(strip.spans.map(s => [s.side, s.t0, s.t1])), [['w', -7, 7]]);
 assert.deepEqual([...strip.links], ['link_downtown_strip']);
 assert.equal(D.hqStageJoinedDoor(DT, 'link_downtown_strip'), true);
 assert.equal(D.hqStageJoinedDoor(DT, 'link_stadium_downtown'), true);
 assert.equal(D.hqStageJoinedDoor(DT, 'link_streets_strip'), false, 'the second street to the Strip stays a door');
 /* the far ends read the same join back */
 assert.deepEqual(plain(D.hqStageNeighbours(STRIP).map(n => [n.id, n.spans[0].side])), [[DT, 'e'], ['site_prebuilt_strip_highway', 's']]);   // + the highway south (Phase 5)
 assert.deepEqual(plain(D.hqStageNeighbours(BOWL).map(n => [n.id, n.spans[0].side])), [[DT, 'n']]);
});

test('the frames: to-room and from-room invert each other, and match a root placed with rotation.y = rot·π/2', () => {
 for (const [a, b] of [[DT, BOWL], [BOWL, DT], [DT, STRIP], [STRIP, DT]]) {
  const rel = D.hqStageRel(a, b);
  for (const p of [[0, 0], [10, -3], [-40, 60]]) {
   const q = D.hqStageToRoom(rel, p[0], p[1]), back = D.hqStageFromRoom(rel, q.x, q.z);
   assert.ok(near(back.x, p[0]) && near(back.z, p[1]), 'round trip');
   const r = rotY(rel.rot * Math.PI / 2, p[0], p[1]);
   assert.ok(near(r.x + rel.x, q.x, 1e-6) && near(r.z + rel.z, q.z, 1e-6), 'the root\'s matrix is the frame');
  }
  const inv = D.hqStageRel(b, a), o = D.hqStageToRoom(inv, rel.x, rel.z);
  assert.ok(near(o.x, 0, 1e-6) && near(o.z, 0, 1e-6), 'each sees the other\'s origin');
 }
 /* the stadium's players' tunnel (its north edge, rot 2) lies on Downtown's avenue */
 const rel = D.hqStageRel(DT, BOWL), Sb = HQ.rooms[BOWL].shell, t = D.hqStageToRoom(rel, 0, -Sb.d / 2);
 assert.ok(near(t.x, 0, 1e-3) && near(t.z, -HQ.rooms[DT].shell.d / 2, 0.01));
});

test('the crossing: a metre of hysteresis past the edge, inside the neighbour; the doorway strip is the span less the pad', () => {
 const S = HQ.rooms[DT].shell, hw = S.w / 2, hd = S.d / 2, nbs = D.hqStageNeighbours(DT), H = HQ_WORLD_RULES.crossHys;
 assert.equal(H, 1.0);
 assert.equal(D.hqStageWhere(hw, hd, nbs, 0, -hd - 0.5, H), null, 'half a metre past: still Downtown');
 assert.equal(D.hqStageWhere(hw, hd, nbs, 0, -hd - 1.2, H), BOWL);
 assert.equal(D.hqStageWhere(hw, hd, nbs, -hw - 1.2, 0, H), STRIP);
 assert.equal(D.hqStageWhere(hw, hd, nbs, 100, -hd - 5, H), null, 'past the edge but beside the bowl: nobody');
 /* after the swap the same feet are a metre INSIDE the new part: no flip-flop */
 const rel = D.hqStageRel(DT, BOWL), f = D.hqStageFromRoom(rel, 0, -hd - 1.2), Sb = HQ.rooms[BOWL].shell;
 assert.equal(D.hqStageWhere(Sb.w / 2, Sb.d / 2, D.hqStageNeighbours(BOWL), f.x, f.z, H), null);
 const pad = 1.5;
 assert.ok(D.hqStageSpanAt(hw, hd, nbs, 0, -hd + 0.5, pad));
 assert.ok(D.hqStageSpanAt(hw, hd, nbs, -hw + 0.2, 5, pad), 'the cross street (±7) less the pad');
 assert.equal(D.hqStageSpanAt(hw, hd, nbs, -hw + 0.2, 6, pad), null, 'the kerb');
 assert.equal(D.hqStageSpanAt(hw, hd, nbs, 20, -hd + 0.5, pad), null, 'the north edge beside the avenue is wall');
});

/* ── the renderer's pieces in a vm ── */
class BA { constructor(array, n) { this.array = array; this.itemSize = n; this.count = array.length / n; } }
class BG {
 constructor() { this.attributes = {}; this.index = null; }
 setAttribute(k, a) { this.attributes[k] = a; } setIndex(i) { this.index = i; }
 computeBoundingBox() { this.bb = true; } computeBoundingSphere() { this.bs = true; } dispose() {}
}
test('the terrain tiles: 32 m squares, every quad in exactly one, the vertices copied with the whole field\'s normals', () => {
 const c = { THREE: { BufferGeometry: BG, BufferAttribute: BA }, HQ_STAGE_RULES, window: {} };
 vm.createContext(c); vm.runInContext(extract('_hqTerrainTiles'), c);
 const nx = 101, nz = 61, res = 1, n = nx * nz, g = new BG();
 const P = new Float32Array(n * 3), N = new Float32Array(n * 3), UV = new Float32Array(n * 2), B = new Float32Array(n * 2), O = new Float32Array(n);
 for (let k = 0; k < n; k++) { P[k * 3] = k % nx; P[k * 3 + 1] = (k * 7) % 5; P[k * 3 + 2] = Math.floor(k / nx); N[k * 3 + 1] = 1; N[k * 3] = k / n; O[k] = k; }
 Object.entries({ position: [P, 3], normal: [N, 3], uv: [UV, 2], aBlend: [B, 2], aAO: [O, 1] }).forEach(([k, v]) => g.setAttribute(k, new BA(v[0], v[1])));
 const idx = [];
 for (let j = 0; j + 1 < nz; j++) for (let i = 0; i + 1 < nx; i++) { if (i === 50 && j === 30) continue; const a = j * nx + i, b = a + 1, cc = a + nx, d = cc + 1; idx.push(a, cc, b, b, cc, d); }
 const tiles = c._hqTerrainTiles(g, idx, nx, nz, res);
 assert.equal(tiles.length, Math.ceil(100 / 32) * Math.ceil(60 / 32), '4 × 2 tiles');
 let quads = 0;
 for (const t of tiles) {
  quads += t.index.length / 6;
  assert.ok(t.bb && t.bs, 'each tile its own bounds');
  const tp = t.attributes.position.array, tn = t.attributes.normal.array, ta = t.attributes.aAO.array;
  for (const v of t.index) { const src = ta[v]; assert.ok(near(tp[v * 3], P[src * 3]) && near(tp[v * 3 + 2], P[src * 3 + 2]) && near(tn[v * 3], N[src * 3], 1e-6)); }
 }
 assert.equal(quads, idx.length / 6, 'the hole stays a hole, nothing doubled');
 assert.equal(c._hqTerrainTiles(g, idx.slice(0, 60), 21, 21, 1), null, 'a field of one tile stays one mesh');
 c.window.EW_HQ_NO_TILES = true; assert.equal(c._hqTerrainTiles(g, idx, nx, nz, res), null, 'the switch');
});

function stageCtx(extra) {
 const c = Object.assign({ HQ_STAGE_RULES, HQ_WORLD_RULES, console, Math, Object,
  hqStageWhere: D.hqStageWhere, hqStageSpanAt: D.hqStageSpanAt, hqStageFromRoom: D.hqStageFromRoom, hqStageToRoom: D.hqStageToRoom,
  hqStageRel: D.hqStageRel, _hqUnits: () => 73, _hqNormDeg: d => ((d % 360) + 360) % 360, _hq: null }, extra || {});
 vm.createContext(c);
 vm.runInContext(zoneKeys() + '\nvar HQ_STAGE_PAD = 1.5, _hqStageV = null;\n' + ['_hqStageT', '_hqStageAsk', '_hqStageCross', '_hqStageLoad', '_hqStageIslandAt', '_hqStageSurface', '_hqStageLamps'].map(extract).join('\n'), c);
 return c;
}
test('the crossing swaps into a drawn neighbour, else loads it at the same spot looking the same way', () => {
 const swaps = [], loads = [];
 const c = stageCtx({ _hqStageSwap: (H, to) => swaps.push(to) });
 const S = HQ.rooms[DT].shell, nbs = D.hqStageNeighbours(DT);
 const H = { room: HQ.rooms[DT], player: { x: 0, z: -S.d / 2 - 0.5 }, cam: { yaw: 0.3 }, portal: { placed: {} }, gun: { doors: [] },
  opts: { room: DT, onStageLoad: (to, at) => loads.push([to, at]) }, stage: { id: DT, nbs, parts: {}, loadAsked: null } };
 c._hqStageCross(H, 1000); assert.deepEqual([swaps, loads], [[], []], 'inside the band: nothing');
 H.player.z = -S.d / 2 - 1.2;
 c._hqStageCross(H, 1000);
 assert.deepEqual(swaps, []); assert.equal(loads.length, 1, 'the bowl is not on the stage yet: the load');
 const [to, at] = loads[0], f = D.hqStageFromRoom(D.hqStageRel(DT, BOWL), 0, -S.d / 2 - 1.2);
 assert.equal(to, BOWL); assert.ok(near(at.x, f.x) && near(at.z, f.z));
 assert.ok(near(at.face, (0.3 * 180 / Math.PI + 180) % 360, 1e-6), 'the eye keeps its heading through the half turn');
 c._hqStageCross(H, 2000); assert.equal(loads.length, 1, 'asked once');
 H.stage.parts[BOWL] = { attached: true };
 c._hqStageCross(H, 9000); assert.deepEqual(swaps, [BOWL], 'drawn: the swap');
 H.gun.doors.push({}); H.stage.loadAsked = null;
 c._hqStageCross(H, 9500); assert.deepEqual(swaps, [BOWL]); assert.equal(loads.length, 2, 'a standing door gun door: the load (its doors belong to this room)');
 H.player.dash = {}; c._hqStageCross(H, 20000); assert.equal(loads.length, 2, 'never mid-dash');
});

test('the feet past the edge: the road through the span, a wall beside it, the neighbour\'s own surface beyond', () => {
 const asked = [];
 const c = stageCtx({ hqTerrainHeight: (info, x, z) => info.h, _hqSurface: (x, z, curY) => { asked.push([c._hq.room.id || c._hq.tag, x, z, curY]); return 0.25; } });
 const S = HQ.rooms[DT].shell, hd = S.d / 2, nbs = D.hqStageNeighbours(DT);
 const bowlP = { room: { id: BOWL }, tag: BOWL, terrain: { h: 0.1 } };
 const H = { room: HQ.rooms[DT], terrain: { h: 0.05 }, opts: { room: DT }, stage: { id: DT, nbs, parts: {} } };
 c._hq = H;
 assert.equal(c._hqStageSurface(0, 0, 0), undefined, 'the middle of the room is the room\'s');
 assert.equal(c._hqStageSurface(0, -hd + 0.5, 0), 0.05, 'the avenue at the edge: the road');
 assert.equal(c._hqStageSurface(0, -hd - 0.5, 0), 0.05, 'a step past, the bowl not drawn: our road still');
 assert.equal(c._hqStageSurface(20, -hd - 0.5, 0), null, 'beside the avenue: nothing past the edge');
 assert.equal(c._hqStageSurface(0, -hd - 5, 0), null, 'the bowl not drawn: no floor out there');
 H.stage.parts[BOWL] = { attached: true, P: bowlP, opts: { room: BOWL } };
 assert.equal(c._hqStageSurface(0, -hd - 0.5, 0), 0.1, 'the bowl drawn: its field under the feet');
 assert.equal(c._hqStageSurface(3, -hd - 5, 0.2), 0.25);
 const f = D.hqStageFromRoom(D.hqStageRel(DT, BOWL), 3, -hd - 5);
 assert.equal(asked.length, 1); assert.equal(asked[0][0], BOWL); assert.ok(near(asked[0][1], f.x) && near(asked[0][2], f.z), 'asked in the bowl\'s own metres');
 assert.equal(c._hq, H, 'the visit\'s record is back');
});

test('the lamp budget: the nearest N lit, N never below the current part\'s own, a switched-off lamp stays off', () => {
 const c = stageCtx();
 const mk = (x, on = true) => ({ isPointLight: true, visible: on, x, getWorldPosition(v) { v.x = this.x; v.y = 0; v.z = 0; return v; } });
 const root = ls => ({ traverse(fn) { ls.forEach(fn); } });
 c.THREE = { Vector3: class { distanceToSquared(p) { return (this.x - p.x) ** 2 + (this.y - p.y) ** 2 + (this.z - p.z) ** 2; } } };
 const own = [mk(0), mk(5), mk(300)], nb = Array.from({ length: 20 }, (_, i) => mk(10 + i * 10)), off = mk(1, false);
 const H = { camera: { position: { x: 0, y: 0, z: 0 } }, partRoot: root(own.concat([off])), stage: { parts: { a: { attached: true, P: { partRoot: root(nb) } } } } };
 c._hqStageLamps(H);
 assert.equal(H.stage.lampN, 12);
 assert.equal([...own, ...nb].filter(l => l.visible).length, 12, 'a constant count (no recompile)');
 assert.ok(own[0].visible && own[1].visible && !own[2].visible, 'the far lamp of our own part rests');
 assert.ok(nb[0].visible && !nb[19].visible);
 assert.equal(off.visible, false);
 /* alone (no neighbour drawn) every lamp of the room is lit, as before the stage */
 const alone = Array.from({ length: 30 }, (_, i) => mk(i)); const H2 = { camera: H.camera, partRoot: root(alone), stage: { parts: {} } };
 c._hqStageLamps(H2); assert.equal(H2.stage.lampN, 30); assert.ok(alone.every(l => l.visible));
});

test('the ring: the one-hop neighbours stay, a part two hops away is detached, the outer ground hides under a drawn part', () => {
 const c = stageCtx({ _hqStageNbsOf: id => D.hqStageNeighbours(id), _disposeR: () => {} });
 vm.runInContext(['_hqStageRootPlace', '_hqStageCssShow', '_hqStageAttach', '_hqStageOuterSides', '_hqStageDispose', '_hqStageRing'].map(extract).join('\n'), c);
 const scene = { kids: [], add(o) { this.kids.push(o); o.parent = this; }, remove(o) { this.kids = this.kids.filter(k => k !== o); o.parent = null; } };
 const mkRoot = () => ({ parent: null, position: { set(x, y, z) { Object.assign(this, { x, y, z }); } }, rotation: { set(x, y, z) { this.y = y; } }, updateMatrixWorld() {}, traverse() {} });
 const part = (id) => ({ id, built: true, attached: false, P: { partRoot: mkRoot(), outerSides: {} }, rel: null });
 const sideDT = { visible: true }, sideB = { visible: true };
 const H = { scene, opts: { room: STRIP }, outerSides: { [DT]: sideDT }, stage: { id: STRIP, nbs: D.hqStageNeighbours(STRIP), parts: {}, lampN: 0 } };
 const dt = part(DT), bowl = part(BOWL); dt.P.outerSides[BOWL] = sideB;
 H.stage.parts[DT] = dt; H.stage.parts[BOWL] = bowl;
 c._hqStageAttach(H, dt, true); c._hqStageAttach(H, bowl, true);
 c._hqStageRing(H);
 assert.equal(dt.attached, true); assert.equal(bowl.attached, false, 'the bowl is two hops from the Strip');
 assert.ok(H.stage.parts[BOWL], 'kept built (partsBuilt 3)');
 assert.equal(sideDT.visible, false, 'Downtown drawn: the Strip\'s outer ground toward it hides');
 assert.equal(sideB.visible, true, 'the bowl not drawn: Downtown\'s ground toward it stands');
 const r = D.hqStageRel(STRIP, DT);
 assert.ok(near(dt.P.partRoot.position.x, r.x * 73) && near(dt.P.partRoot.rotation.y, r.rot * Math.PI / 2));
});

test('the renderer wiring: the joined gantry, the hooks, the switch, the API', () => {
 assert.match(renderer, /if \(joinedR\) LEN = 0;/);
 assert.match(renderer, /if \(joined\) \{ grp\._ew_hqJoined = door\.id; G\.add\(grp\); return; \}/, 'a joined road builds no record, no plate');
 assert.match(renderer, /if \(_hq\.stage\) \{ var stY = _hqStageSurface\(x, z, curY, ignoreBlockers\);/);
 assert.match(renderer, /if \(_hq\.stage\) \{ var stC = _hqStageCam\(px, pz, py\);/);
 assert.match(renderer, /if \(H\.stage\) \{ try \{ _hqStageTick\(H, dt, now\);/);
 assert.match(renderer, /if \(H\.stage && H\.stage\.skyYaw\) u\.uSkyYaw\.value = H\.stage\.skyYaw;/);
 assert.match(renderer, /stage: _hqStageStatus,/);
 assert.match(renderer, /window\.EW_HQ_NO_STAGE/);
 assert.match(renderer, /if \(!opts\._stageNoPlayer\) _hq\.player = _hqSpawnCharacter/);
 const map = fs.readFileSync(__dirname + '/map.js', 'utf8');
 assert.match(map, /onCross: \(typeof _hqStageCrossed === 'function'\) \? _hqStageCrossed : null,/); assert.match(map, /onStageLoad:/); assert.match(map, /stageWarm:/);
 assert.match(map, /function _hqStageCrossed\(to, from\)/);
});
