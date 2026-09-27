'use strict';
/* THE SOUTH (OPEN_WORLD_PLAN.md Phase 5, 2026-09-27):
   - THE HIGHWAY: two BUILT parts (the Strip's and Area 51's) of flat desert road, joined to the Strip's south edge and to
     each other by road joins, and by a border to AREA 51's GATE (a BUILT part), which joins the flight line's north edge;
   - AREA 51: Hangar 18 and the white rooms as DOOR JOINS at the doors they already had (the yard gate and the drains stay doors);
   - THE D.U.M.B.: six parts by DOOR JOINS (the war room 3 m up and the bunker 2.4 m up: their doors are on the hub's gantries);
   - (heavy) the walker's reach: road end to road end in each part, into the diner, the kiosk and the guard post, up the tower,
     and from the Strip's bay door out of its south edge; the flight line from its hangar door to the gate road. */
const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { loadGameData } = require('./load-data');
const { heavy } = require('./test-heavy');
const D = loadGameData(), HQ = D.DOOR_HQ;
const R = n => vm.runInContext(n, D);
const HQ_STAGE_RULES = R('HQ_STAGE_RULES'), HQ_WORLD_RULES = R('HQ_WORLD_RULES'), W = R('HQ_WORLD');
const P = 'site_prebuilt_';
const ROAD = [P + 'strip_highway', P + 'area51_highway', P + 'area51_gate'];
const DUMB = ['motorpool', 'sublevel7', 'dreamlab', 'clonevats', 'warroom', 'bunker'].map(s => P + 'dumb_' + s);

test('the world is valid; the highway, the desert and the D.U.M.B. are staged zones of real parts', () => {
    const v = D.hqWorldValidate();
    assert.ok(v.ok, v.errors.join('\n'));
    for (const z of ['highway', 'desert', 'dumb']) assert.ok(HQ_STAGE_RULES.zones.includes(z), z + ' is staged');
    for (const id of ROAD.concat([P + 'area51_flightline', P + 'area51_hangar', P + 'area51_ward']).concat(DUMB)) {
        assert.ok(HQ.rooms[id], id + ' is a room');
        assert.ok(D.hqStagePart(id), id + ' is a staged part');
    }
    for (const z of ['highway', 'desert']) for (const id of Object.keys(W.zones[z].parts)) assert.ok(!W.zones[z].parts[id].planned, id + ' is built, not planned');
});

test('the road: the Strip ⇄ the highway ⇄ the highway ⇄ the gate ⇄ the flight line, each an edge join the stage walks', () => {
    const chain = [P + 'strip_streets'].concat(ROAD, [P + 'area51_flightline']);
    for (let i = 0; i + 1 < chain.length; i++) {
        const a = chain[i], b = chain[i + 1];
        const nb = D.hqStageNeighbours(a).find(n => n.id === b);
        assert.ok(nb, a + ' has ' + b + ' beside it');
        const sp = nb.spans.find(s => s.side === 's' && s.kind === 'road');
        assert.ok(sp && sp.t0 <= -7.9 && sp.t1 >= 7.9, a + ': the road join on its south edge, x −8…8');
        const back = D.hqStageNeighbours(b).find(n => n.id === a);
        assert.ok(back && back.spans.some(s => s.side === 'n'), b + ' sees ' + a + ' across its north edge');
    }
    /* the Strip's bay door moved off the road's span; the city plan runs a street out of the south edge */
    const strip = HQ.rooms[P + 'strip_streets'];
    const bay = strip.doors.find(d => d.id === 'bay');
    assert.ok(bay && bay.wall === 's' && Math.abs(bay.x) > 12, 'the bay door is clear of the highway');
    assert.ok(strip.terrain.gen.streets.some(s => s.pts.some(p => p[0] === 0 && p[1] === 32)), 'a street reaches the south edge at x 0');
});

test('THE BUILT ROAD: flat desert, no floor plan, the paint, the diner, the canopy, the guard post, the tower', () => {
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
    assert.ok(f(ROAD[0]).some(x => x.k === 'bridge' && x.id === 'diner_roof'), 'the diner has its roof');
    assert.ok(f(ROAD[1]).some(x => x.k === 'bridge' && x.id === 'canopy' && x.y >= 4.5), 'the canopy stands 5 m up');
    assert.ok(f(ROAD[2]).some(x => x.k === 'bridge' && x.id === 'post_roof'), 'the guard post has its roof');
});

test('THE DOOR JOINS: Area 51 and the D.U.M.B. meet at their own doors, 0.2 m apart and facing; the secret ways stay doors', () => {
    const doorJoins = D.hqWorldJoins().filter(j => j.kind === 'door' && (j.zone === 'desert' || j.zone === 'dumb'));
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

test('(heavy) the walker: every road part end to end and into its buildings; the Strip and the flight line reach their road joins', heavy, () => {
    const reachOf = (id, x, z) => { const info = D.hqTerrainInfo(id); return { info, set: D.hqTerrainReach(info, x, z) }; };
    const has = (r, x, z, y) => r.set.has(y == null ? D.hqTerrainNodeKey(r.info, x, z) : D.hqTerrainNodeKey(r.info, x, z, y));
    const hw = id => HQ.rooms[id].shell.d / 2 - 1.5;
    for (const id of ROAD) {
        const r = reachOf(id, 0, -hw(id));
        assert.ok(has(r, 0, hw(id)), id + ': the road runs end to end');
    }
    const n = reachOf(ROAD[0], 0, -hw(ROAD[0]));
    assert.ok(has(n, 22, -50), 'into the diner');
    assert.ok(has(n, -22, 20), 'the rest stop');
    const s = reachOf(ROAD[1], 0, -hw(ROAD[1]));
    assert.ok(has(s, -30.5, 10), 'into the kiosk');
    assert.ok(has(s, -18, 10), 'under the canopy');
    const g = reachOf(ROAD[2], 0, -hw(ROAD[2]));
    assert.ok(has(g, 11, 3), 'into the guard post');
    assert.ok(has(g, -20, 8, 4.5), 'up the watchtower');
    assert.ok(has(g, 0, 18), 'through the gate');
    const strip = HQ.rooms[P + 'strip_streets'], bay = D.hqTerrainDoorLanding(strip, strip.doors.find(d => d.id === 'bay'));
    assert.ok(has(reachOf(P + 'strip_streets', bay.x, bay.z), 0, 30.5), 'the Strip: the bay door reaches the highway');
    const fl = HQ.rooms[P + 'area51_flightline'], L = D.hqTerrainDoorLanding(fl, fl.doors[0]);
    assert.ok(has(reachOf(P + 'area51_flightline', L.x, L.z), 0, -30.5), 'the flight line: the hangar door reaches the gate road');
});
