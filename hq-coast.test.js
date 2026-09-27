'use strict';
/* THE COAST (OPEN_WORLD_PLAN.md Phase 7, 2026-09-27): the harbour under Downtown's quay is a sea PART on the stage; the
   cay (the open sea) and the Dutchman stand ON it as ISLAND parts (`kind: 'island'` joins — inside the harbour's box, the
   harbour's floor sunk under them, one sea surface). The skiff, the swimmer and the camera cross between them with no load.
   Guards: the world rows, the island neighbours and the containment crossing, the ground (the sink, the stitch, the hull,
   one sea), the quay under the avenue, and THE SKIFF'S CROSSING in a vm sandbox (the renderer's own helm, swim and
   crossing on the real compiled fields). */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { loadGameData } = require('./load-data');
const D = loadGameData(), HQ = D.DOOR_HQ;
const R = n => vm.runInContext(n, D);
const HQ_WORLD_RULES = R('HQ_WORLD_RULES'), HQ_STAGE_RULES = R('HQ_STAGE_RULES');
const HARB = 'site_prebuilt_downtown_harbour', CAY = 'site_prebuilt_bermuda_sea', DUT = 'site_prebuilt_revenge_deck', DT = 'site_prebuilt_downtown_streets';
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
const nbOf = (id, other) => D.hqStageNeighbours(id).find(n => n.id === other);

test('the coast is a staged zone: the harbour is Downtown\'s part under the quay, the cay and the Dutchman stand on it; the world validates', () => {
    assert.ok(HQ_STAGE_RULES.zones.includes('coast'));
    const v = D.hqWorldValidate(); assert.ok(v.ok, (v.errors || []).join('; '));
    for (const id of [HARB, CAY, DUT]) assert.ok(D.hqStagePart(id), id + ' is a staged part');
    assert.equal(D.hqRoomSite(HARB), 'prebuilt_downtown');
    assert.equal(HQ.rooms[HARB].part, 'harbour');
    const W = HQ.world, coast = W.zones.coast;
    for (const id of [CAY, DUT]) assert.equal(coast.parts[id].on, HARB, id + ' stands on the harbour');
    assert.ok(coast.joins.some(j => j.a === HARB && j.b === CAY && j.kind === 'island') && coast.joins.some(j => j.a === HARB && j.b === DUT && j.kind === 'island'));
    const bd = W.borders.find(b => b.a === DT && b.b === HARB);
    assert.ok(bd && bd.side === 's' && bd.kind === 'shore', 'Downtown\'s south side is the shore');
    assert.ok(!JSON.stringify(W).includes('harbour_sea'), 'the planned harbour is built');
});

test('the islands: from the harbour each is `inside` (no span); from the island the harbour is the host on all four sides; the crossing takes you in once the feet are the hysteresis inside the box', () => {
    const hy = HQ_WORLD_RULES.crossHys, nbs = D.hqStageNeighbours(HARB);
    for (const id of [CAY, DUT]) {
        const n = nbs.find(x => x.id === id);
        assert.ok(n && n.inside && n.spans.length === 0, id + ' inside the harbour');
        const S = HQ.rooms[HARB].shell;
        assert.ok(n.rect.x0 > -S.w / 2 && n.rect.x1 < S.w / 2 && n.rect.z0 > -S.d / 2 && n.rect.z1 < S.d / 2, id + ': the box lies inside the harbour');
        const h = nbOf(id, HARB);
        assert.ok(h && h.host && h.spans.map(s => s.side).sort().join('') === 'ensw' && h.spans.every(s => s.kind === 'island'), id + ': the harbour on all four sides');
        assert.equal(D.hqShellSideOpen(id, 'n').length, 1, id + ': its sides stand open onto the sea');
        const S2 = HQ.rooms[HARB].shell, r = n.rect, cx = (r.x0 + r.x1) / 2;
        assert.equal(D.hqStageWhere(S2.w / 2, S2.d / 2, nbs, cx, r.z0 + hy * 0.5), null, id + ': the band at its edge stays in the harbour');
        assert.equal(D.hqStageWhere(S2.w / 2, S2.d / 2, nbs, cx, r.z0 + hy + 0.1), id, id + ': a step further is the island');
        const Si = HQ.rooms[id].shell, hs = D.hqStageNeighbours(id);
        assert.equal(D.hqStageWhere(Si.w / 2, Si.d / 2, hs, 0, -Si.d / 2 - hy * 0.5), null, id + ': just past its edge, still the island');
        assert.equal(D.hqStageWhere(Si.w / 2, Si.d / 2, hs, 0, -Si.d / 2 - hy - 0.1), HARB, id + ': out on the harbour');
    }
    assert.equal(D.hqStageNeighbours(CAY).length, 1, 'an island\'s sea brings no other island beside');
});

test('the ground: one sea; the harbour\'s floor sinks under an island; the cay\'s edge meets the harbour floor; the Dutchman keeps her hull over the water', () => {
    const hi = D.hqTerrainInfo(HARB), ci = D.hqTerrainInfo(CAY), di = D.hqTerrainInfo(DUT);
    const cr = nbOf(HARB, CAY).rel, dr = nbOf(HARB, DUT).rel;
    assert.ok(Math.abs((ci.sea.y + cr.y) - hi.sea.y) < 0.05 && Math.abs((di.sea.y + dr.y) - hi.sea.y) < 0.05, 'one surface');
    /* the sink: in the cay's middle the harbour's own floor lies well under the cay's */
    const mid = { x: cr.x, z: cr.z };
    assert.ok(D.hqTerrainHeight(hi, mid.x, mid.z) < D.hqTerrainHeight(ci, 0, 0) + cr.y - 3, 'the harbour\'s floor is sunk under the cay');
    /* the stitch: the cay's edge rows stand at the harbour's floor (the join's y) */
    const Sc = HQ.rooms[CAY].shell, jy = HQ.world.zones.coast.joins.find(j => j.b === CAY).y;
    for (const [x, z] of [[0, -Sc.d / 2 + 0.2], [Sc.w / 2 - 0.2, 0], [-Sc.w / 2 + 0.2, 10]]) assert.ok(Math.abs(D.hqTerrainHeight(ci, x, z) + cr.y - jy) < 0.6, 'the cay\'s edge at ' + x + ',' + z + ' meets the harbour floor');
    /* the hull: her deck stands over the water, the water round her box is deep enough for the skiff */
    assert.ok(D.hqTerrainHeight(di, 0, 20) + dr.y > hi.sea.y + 2, 'the Dutchman\'s deck over the water');
    assert.ok(hi.sea.y - D.hqTerrainHeight(hi, dr.x, dr.z - 27.5) > 2, 'deep water alongside her');
    assert.ok(Array.isArray(di.seaExits) && di.seaExits.length > 0, 'the Dutchman\'s sea cells lead out (the return search starts from them, not a ramp up her hull)');
});

test('the quay: the harbour\'s north edge stands at Downtown\'s street height under the avenue, the long pier runs on from it, the water steps lead out of the water; Downtown\'s bay and mall doors moved off the quay', () => {
    const hi = D.hqTerrainInfo(HARB), di = D.hqTerrainInfo(DT), rel = nbOf(DT, HARB).rel, S = HQ.rooms[HARB].shell;
    const pierX = -rel.x;   // Downtown x 0 in the harbour's metres
    assert.equal(pierX, -38);
    assert.ok(Math.abs(D.hqTerrainHeight(hi, pierX, -S.d / 2 + 0.3) - D.hqTerrainHeight(di, 0, HQ.rooms[DT].shell.d / 2 - 0.3)) < 0.3, 'the avenue meets the pier');
    for (const z of [-140, -130, -120]) assert.equal(D.hqTerrainFeet(hi, pierX, z, null), 0, 'the pier at z ' + z);
    assert.ok(D.hqTerrainFluidAt(hi, pierX - 8, -130), 'water beside the pier');
    const steps = HQ.rooms[HARB].terrain.features.find(f => f.k === 'ramp' && f.stairs);
    assert.ok(steps, 'the water steps');
    const bay = HQ.rooms[DT].doors.find(d => d.id === 'bay'), mall = HQ.rooms[DT].doors.find(d => d.id === 'mall');
    assert.ok(bay.wall === 'e' && mall.wall === 'w', 'the bay and the mall doors left the south wall to the quay');
    assert.ok(D.hqAreaDeltaId(HARB), 'the harbour has its Δ board');
});

/* ── the renderer's helm / swim / crossing, in a vm sandbox on the real fields ── */
function sandbox() {
    const events = [], swaps = [];
    const c = {
        HQ_WORLD_RULES, HQ_STAGE_RULES, console, Math, Object, performance,
        HQ_SEA_RULES: R('HQ_SEA_RULES'), HQ_BODY_R: 0.34, HQ_DOOR_LOCKED: {}, window: {},
        hqStageWhere: D.hqStageWhere, hqStageSpanAt: D.hqStageSpanAt, hqStageFromRoom: D.hqStageFromRoom,
        hqTerrainHeight: D.hqTerrainHeight, hqTerrainWallAt: D.hqTerrainWallAt, hqTerrainSolidAt: D.hqTerrainSolidAt, hqTerrainSolidTop: D.hqTerrainSolidTop, hqTerrainFeet: D.hqTerrainFeet,
        _hqUnits: () => HQ.units, _hqData: () => HQ, _hqAirClearOfBlockers: () => true, _hqRideToggle: () => false, _hqPortalDraw: () => {},
        _hqStageSwap: (H, to) => { swaps.push(to); return true; }, _hqStageLoad: () => {}, _hq: null, events, swaps,
    };
    vm.createContext(c);
    const fns = ['_hqSeaRules', '_hqSea', '_hqSeaEmit', '_hqStageOwner', '_hqSeaGroundAt', '_hqStageEdgeOpen', '_hqSeaDepthAt', '_hqSwimFree', '_hqSwimFreeAt',
        '_hqSwimStart', '_hqSwimStop', '_hqSwimCheck', '_hqTickSwim', '_hqSeaWayCheck', '_hqVehicleRegister', '_hqVehicleFind', '_hqBoard', '_hqDisembark',
        '_hqHullFree', '_hqTickVehicle', '_hqStageT', '_hqStageAsk', '_hqStageIslandAt', '_hqStageCross'];
    vm.runInContext(zoneKeys() + '\n' + fns.map(extract).join('\n')
        + '\nfunction _hqSurface(x, z) { var st = _hq.stage; if (st) { var i = _hqStageIslandAt(st, x, z); if (i) { var y = hqTerrainFeet(i.E.P.terrain, i.q.x, i.q.z, null); return y == null ? null : y + i.ry; } } return hqTerrainFeet(_hq.terrain, x, z, null); }', c);
    return c;
}
const part = id => ({ room: HQ.rooms[id], terrain: D.hqTerrainInfo(id), blockers: [], doors: [], boats: [], tickers: [], props: [] });
function current(c, id, pl, keep) {
    const nbs = D.hqStageNeighbours(id), parts = {};
    nbs.forEach(n => { if (n.beside) return; parts[n.id] = { id: n.id, attached: true, opts: { room: n.id }, P: part(n.id), rel: n.rel }; });
    const H = Object.assign(part(id), { player: pl, keys: {}, cam: { yaw: 0, pitch: 0, dist: 3.6 }, paused: false, opts: { room: id, onSea: e => c.events.push(e) },
        vehicle: null, seaFx: null, ride: null, portal: null, gun: null, snap: null, dirty: false, stage: { id, nbs, parts, loadAsked: null } }, keep || {});
    c._hq = H; return H;
}
const mkPl = (x, z, y) => ({ x, z, y, visY: y, yaw: 0, targetYaw: 0, air: false, vy: 0, jumpT: -1, moving: false, running: false, entry: { group: { position: { set() {} } } } });
const grpAt = (x, y, z) => ({ position: { x: x * HQ.units, y: y * HQ.units, z: z * HQ.units, set(a, b, d) { this.x = a; this.y = b; this.z = d; } }, rotation: { x: 0, y: 0, z: 0, order: 'XYZ', set(a, b, d) { this.x = a; this.y = b; this.z = d; } } });
/* the swap's re-anchoring of the vehicle (three-renderer.js _hqStageSwap, `if (Vx)`), done by hand */
function carry(V, rel) { const th = -rel.rot * Math.PI / 2, p = D.hqStageFromRoom(rel, V.x, V.z); V.x = p.x; V.z = p.z; V.y -= rel.y || 0; V.yaw += th; }

test('THE SKIFF\'S CROSSING (vm): from the harbour the skiff sails into the cay\'s box over one sea and the crossing takes it in, still under way; on the cay it sails back out past the edge (the harbour\'s water is the hull\'s) and crosses home', () => {
    const c = sandbox(), SR = R('HQ_SEA_RULES');
    const skiff = HQ.rooms[HARB].props.find(p => p.key === 'skiff');
    const H = current(c, HARB, mkPl(skiff.x + 1, skiff.z, 0));
    const sy = H.terrain.sea.y + skiff.y;
    c._hqVehicleRegister({ key: 'skiff' }, HQ.catalogue.skiff, grpAt(skiff.x, sy, skiff.z), sy);
    assert.equal(c._hqBoard(H.boats[0].id), true, 'aboard the harbour\'s skiff');
    const V = H.vehicle;
    V.x = 30; V.z = 40; V.yaw = -Math.PI / 2;   // out on the harbour's water, heading west at the cay
    H.keys.w = true;
    let crossedAt = null;
    for (let i = 0; i < 60 * 20 && !crossedAt; i++) { c._hqTickVehicle(1 / 60); c._hqStageCross(H, i * 16); if (c.swaps.length) crossedAt = { x: V.x, v: V.v }; }
    assert.deepEqual([...c.swaps], [CAY], 'the crossing takes the skiff onto the cay');
    const r = nbOf(HARB, CAY).rect;
    assert.ok(crossedAt.x < r.x1 - HQ_WORLD_RULES.crossHys && crossedAt.v > SR.boat.v * 0.6, 'inside the cay\'s box by the hysteresis, still under way (x ' + crossedAt.x.toFixed(1) + ', ' + crossedAt.v.toFixed(1) + ' m/s)');
    /* on the cay: the swap carried the helm into its frame (hand-carried here — the swap's own lines are pinned below) */
    carry(V, nbOf(HARB, CAY).rel);
    const Hc = current(c, CAY, H.player, { vehicle: V, boats: [V.rec], keys: { w: true }, cam: H.cam });
    assert.ok(Math.abs(V.y - (Hc.terrain.sea.y + 0.1)) < 0.25, 'afloat on the cay\'s sea at the same height');
    V.yaw = Math.PI / 2; V.v = 0;   // about, heading east — out past the cay's edge
    c.swaps.length = 0;
    let out = null;
    for (let i = 0; i < 60 * 20 && !out; i++) { c._hqTickVehicle(1 / 60); c._hqStageCross(Hc, i * 16); if (c.swaps.length) out = V.x; }
    assert.deepEqual([...c.swaps], [HARB], 'back onto the harbour');
    assert.ok(out > HQ.rooms[CAY].shell.w / 2 + HQ_WORLD_RULES.crossHys, 'the hull sailed past the cay\'s edge (x ' + (out || 0).toFixed(1) + ')');
});

test('ALONGSIDE THE DUTCHMAN (vm): the skiff will not sail into her hull, a swimmer will not climb it, and stepping off the skiff lands on her deck — a step in and the crossing takes you aboard', () => {
    const c = sandbox(), dr = nbOf(HARB, DUT).rel;
    const H = current(c, HARB, mkPl(0, 0, 0));
    const at = (lx, lz) => ({ x: dr.x + lx, z: dr.z + lz });
    const w = at(-3, -26.9), deck = at(-3, -24);   // her hull runs to her box's edge (26 m): the skiff's beam (0.85 m) lies just outside it
    const sy = H.terrain.sea.y + 0.3;
    c._hqVehicleRegister({ key: 'skiff' }, HQ.catalogue.skiff, grpAt(w.x, sy, w.z), sy);
    assert.equal(c._hqBoard(H.boats[0].id), true);
    const V = H.vehicle; V.x = w.x; V.z = w.z; V.yaw = Math.PI / 2;
    const SR = R('HQ_SEA_RULES');
    assert.equal(c._hqHullFree(V, SR.boat, w.x, w.z, V.y), true, 'alongside, in her water');
    assert.equal(c._hqHullFree(V, SR.boat, deck.x, deck.z, V.y), false, 'never into the hull');
    assert.equal(c._hqSwimFree(deck.x, deck.z - 1.3, H.terrain.sea.y - SR.surfaceDraft), false, 'a swimmer does not climb her side');
    assert.equal(c._hqDisembark(), true);
    const pl = H.player;
    assert.ok(!pl.swim && pl.y > H.terrain.sea.y + 2, 'stepped off onto her deck (y ' + pl.y.toFixed(2) + ')');
    const r = nbOf(HARB, DUT).rect;
    assert.ok(pl.x > r.x0 && pl.x < r.x1 && pl.z > r.z0 && pl.z < r.z1, 'inside her box');
    pl.z += 1.2;
    c._hqStageCross(H, 0);
    assert.deepEqual([...c.swaps], [DUT], 'a step in: aboard the Dutchman');
});

test('THE SWIMMER\'S CROSSING (vm): off the cay\'s edge the swimmer swims out onto the harbour\'s water and the crossing takes it there', () => {
    const c = sandbox(), Sc = HQ.rooms[CAY].shell;
    const pl = mkPl(Sc.w / 2 - 3, -20, HQ.rooms[CAY].terrain.sea.y - 1);
    const H = current(c, CAY, pl);
    c._hqSwimCheck(pl);
    assert.equal(pl.swim, true, 'deep water off the cay');
    H.cam.yaw = Math.PI / 2; H.keys.w = true;   // yaw π/2 looks +X
    for (let i = 0; i < 60 * 10 && !c.swaps.length; i++) { c._hqTickSwim(1 / 60); c._hqStageCross(H, i * 16); }
    assert.deepEqual([...c.swaps], [HARB], 'out onto the harbour');
    assert.ok(pl.swim && pl.x > Sc.w / 2 + HQ_WORLD_RULES.crossHys, 'swimming past the edge');
});

test('THE SOURCE: the crossing lets the swimmer and the helm through; the swap carries the vehicle, the swimmer\'s way on and the sea\'s look; the blend and the clock write the dry fog; an island\'s sheet stands down while its host is drawn; the island\'s box answers the feet, the air and the boom', () => {
    assert.ok(/var V = H\.vehicle && H\.vehicle\.on \? H\.vehicle : null;/.test(renderer) && !/pl\.sit \|\| pl\.swim \|\| \(H\.ride && H\.ride\.on\) \|\| \(H\.vehicle && H\.vehicle\.on\)\) return;/.test(renderer), 'the crossing guard');
    assert.ok(/rv\(pl, 'svx', 'svz'\);/.test(renderer), 'the swimmer\'s way on turns with the frame');
    assert.ok(/if \(Vx\) \{\n\s+var vp = mp\(Vx\.x, Vx\.z\); Vx\.x = vp\.x; Vx\.z = vp\.z; Vx\.y -= \(rel\.y \|\| 0\); Vx\.yaw \+= th;/.test(renderer), 'the helm re-anchored (the test\'s carry() mirrors it)');
    assert.ok(/\(H\.propGroup \|\| H\.partRoot\)\.add\(vr\.grp\)/.test(renderer) && /Q\.P\.boats = Q\.P\.boats\.filter/.test(renderer), 'the hull moves to the new part\'s moorings');
    assert.ok(/try \{ _hqSeaDisarm\(H\); \}/.test(renderer) && /try \{ if \(H\.terrain && H\.terrain\.sea\) _hqSeaArm\(H\.room\); \}/.test(renderer), 'the sea look disarmed and re-armed');
    assert.ok(/var bFog = _hqDryFog\(H\);/.test(renderer) && /var cFog = _hqDryFog\(H\); if \(cFog\) cFog\.color\.copy\(V\.fogC\);/.test(renderer), 'the blend and the clock ease the dry fog');
    assert.ok(/seaMesh\._ew_hqOuterSideIds = seaHosts; _hq\.outerSides\['~sea'\] = seaMesh;/.test(renderer), 'the island\'s sheet is an outer side keyed on its host');
    assert.ok(/var isl = _hqStageIslandAt\(st, x, z\);/.test(renderer) && /var isl = _hqStageIslandAt\(st, px, pz\);/.test(renderer) && /var isA = _hqStageIslandAt\(_hq\.stage, x, z\);/.test(renderer), 'the feet, the boom and the air over an island');
});
