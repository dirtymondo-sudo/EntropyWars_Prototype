'use strict';
/* THE SOUTH (OPEN_WORLD_PLAN.md Phase 5, 2026-09-27; WORLD_GEOGRAPHY_PLAN.md G6, 2026-09-28):
   - G6: the two highway parts retired — the land's own road runs from the Strip to Area 51. The Strip, AREA 51'S GATE and the
     flight line are sites on THE LAND; the gate still joins the flight line's north edge by a road join on the pad;
   - AREA 51: Hangar 18 and the white rooms as DOOR JOINS at the doors they already had (the yard gate and the drains stay doors);
   - THE D.U.M.B.: six parts by DOOR JOINS (the war room 3 m up and the bunker 2.4 m up: their doors are on the hub's gantries);
   - (heavy) the walker's reach: the gate road end to end, into the guard post, up the tower, through the gate; the flight line
     from its hangar door to the gate road. */
const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { loadGameData } = require('./load-data');
const { heavy } = require('./test-heavy');
const D = loadGameData(), HQ = D.DOOR_HQ;
const R = n => vm.runInContext(n, D);
const HQ_STAGE_RULES = R('HQ_STAGE_RULES'), HQ_WORLD_RULES = R('HQ_WORLD_RULES'), W = R('HQ_WORLD');
const P = 'site_prebuilt_';
const ROAD = [P + 'area51_gate'];
const DUMB = ['motorpool', 'sublevel7', 'dreamlab', 'clonevats', 'warroom', 'bunker'].map(s => P + 'dumb_' + s);

test('the world is valid; the land and the D.U.M.B. are staged zones of real parts; the highway is retired (G6)', () => {
    const v = D.hqWorldValidate();
    assert.ok(v.ok, v.errors.join('\n'));
    for (const z of ['land', 'dumb']) assert.ok(HQ_STAGE_RULES.zones.includes(z), z + ' is staged');
    for (const z of ['highway', 'desert']) assert.ok(!W.zones[z] && !HQ_STAGE_RULES.zones.includes(z), z + ' is gone (G6)');
    for (const id of [P + 'strip_highway', P + 'area51_highway']) assert.ok(!HQ.rooms[id], id + ' retired (G6)');
    for (const id of ROAD.concat([P + 'area51_flightline', P + 'area51_hangar', P + 'area51_ward']).concat(DUMB)) {
        assert.ok(HQ.rooms[id], id + ' is a room');
        assert.ok(D.hqStagePart(id), id + ' is a staged part');
    }
    for (const id of [P + 'strip_streets', P + 'area51_gate', P + 'area51_flightline']) assert.ok(W.zones.land.parts[id] && W.zones.land.parts[id].place, id + ' stands on its place on the land');
});

test('the road: the gate ⇄ the flight line, an edge join on the pad the stage walks; the Strip an island on the land', () => {
    const a = P + 'area51_gate', b = P + 'area51_flightline';
    const nb = D.hqStageNeighbours(a).find(n => n.id === b);
    assert.ok(nb, a + ' has ' + b + ' beside it');
    const sp = nb.spans.find(s => s.side === 's' && s.kind === 'road');
    assert.ok(sp && sp.t0 <= -7.9 && sp.t1 >= 7.9, a + ': the road join on its south edge, x −8…8');
    const back = D.hqStageNeighbours(b).find(n => n.id === a);
    assert.ok(back && back.spans.some(s => s.side === 'n'), b + ' sees ' + a + ' across its north edge');
    assert.ok(Math.abs(D.hqWorldFrame(a).y - D.hqWorldFrame(b).y) < 1e-6, 'one pad under both');
    /* the Strip stands alone on the land: every side of it an island edge onto the land */
    const sn = D.hqStageNeighbours(P + 'strip_streets');
    assert.equal(sn.length, 1); assert.equal(sn[0].id, 'land');
    const strip = HQ.rooms[P + 'strip_streets'];
    const bay = strip.doors.find(d => d.id === 'bay');
    assert.ok(bay && bay.wall === 's', 'the bay door is the Strip\'s egress');
});

test('THE BUILT ROAD: flat desert, no floor plan, the paint, the guard post, the tower', () => {
    for (const id of ROAD) {
        const r = HQ.rooms[id], t = r.terrain;
        assert.ok(!t.gen, id + ': no generator (family E)');
        assert.ok(t.noise.amp <= 0.05, id + ': flat');
        assert.ok((t.marks || []).filter(m => m.k === 'line').length >= 2, id + ': the lines are painted');
        assert.ok(t.features.some(f => f.k === 'path' && f.w >= 12), id + ': the road');
        assert.ok(t.features.some(f => f.k === 'rail' || (f.k === 'wall' && f.h && f.h <= 0.5)), id + ': a grind (the park rule)');
        assert.ok(t.features.some(f => f.k === 'wall' && f.y >= 1 && f.t >= 2), id + ': a tier (the park rule)');
        assert.equal(D.hqRoomClock(id).locked, false, id + ' rides the clock');
        assert.ok(R('HQ_WORLD_CLOCK').dayLook[id], id + ' has its day look');
    }
    const f = id => HQ.rooms[id].terrain.features;
    assert.ok(f(ROAD[0]).some(x => x.k === 'bridge' && x.id === 'post_roof'), 'the guard post has its roof');
});

test('THE DOOR JOINS: Area 51 and the D.U.M.B. meet at their own doors, 0.2 m apart and facing; the secret ways stay doors', () => {
    const doorJoins = D.hqWorldJoins().filter(j => j.kind === 'door' && ((j.zone === 'land' && /area51/.test(j.a)) || j.zone === 'dumb'));
    assert.equal(doorJoins.length, 2 + 5);
    for (const j of doorJoins) {
        const J = D.hqWorldDoorJoinResolve(j);
        assert.ok(J, j.a + ' ⇄ ' + j.b + ' resolves');
        assert.ok(Math.abs(J.gap - HQ_WORLD_RULES.wallM) < 0.05, j.a + ' ⇄ ' + j.b + ': the doors stand ' + J.gap.toFixed(2) + ' m apart');
        assert.ok(J.faceOk, j.a + ' ⇄ ' + j.b + ': the doors face');
        assert.ok(D.hqStageDoorJoin(j.a, j.door) && D.hqStageDoorJoin(j.b, j.bDoor), 'both ends are live door joins');
    }
    /* the raised doors: the part stands at the door's sill */
    const fr = id => D.hqWorldFrame(id), s7 = HQ.rooms[P + 'dumb_sublevel7'];
    const sill = id => s7.doors.find(d => d.id === id).y || 0;
    assert.ok(Math.abs(fr(P + 'dumb_warroom').y - fr(P + 'dumb_sublevel7').y - sill('war')) < 1e-6, 'the war room stands at its door\'s sill');
    assert.ok(Math.abs(fr(P + 'dumb_bunker').y - fr(P + 'dumb_sublevel7').y - sill('bunker')) < 1e-6, 'the bunker stands at its door\'s sill');
    for (const [id, door] of [[P + 'dumb_dreamlab', 'service'], [P + 'dumb_warroom', 'stair'], [P + 'area51_ward', 'yard'], [P + 'area51_flightline', 'stormdrain']])
        assert.ok(!D.hqStageDoorJoin(id, door), id + '#' + door + ' stays a door');
});

test('(heavy) the walker: the gate road end to end and into its buildings; the flight line reaches its road join', heavy, () => {
    const reachOf = (id, x, z) => { const info = D.hqTerrainInfo(id); return { info, set: D.hqTerrainReach(info, x, z) }; };
    const has = (r, x, z, y) => r.set.has(y == null ? D.hqTerrainNodeKey(r.info, x, z) : D.hqTerrainNodeKey(r.info, x, z, y));
    const hw = id => HQ.rooms[id].shell.d / 2 - 1.5;
    for (const id of ROAD) {
        const r = reachOf(id, 0, -hw(id));
        assert.ok(has(r, 0, hw(id)), id + ': the road runs end to end');
    }
    const g = reachOf(ROAD[0], 0, -hw(ROAD[0]));
    assert.ok(has(g, 11, 3), 'into the guard post');
    assert.ok(has(g, -20, 8, 4.5), 'up the watchtower');
    assert.ok(has(g, 0, 18), 'through the gate');
    const fl = HQ.rooms[P + 'area51_flightline'], L = D.hqTerrainDoorLanding(fl, fl.doors[0]);
    assert.ok(has(reachOf(P + 'area51_flightline', L.x, L.z), 0, -30.5), 'the flight line: the hangar door reaches the gate road');
});
