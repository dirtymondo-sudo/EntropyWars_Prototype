// stadium-garage.test.js — THE BOWL + THE PARKING GARAGE (2026-09-26).
//
// mondo: "The stadium should be a normal flat rectangular grass football field
// with a bowl/stadium/stands around it, with a tunnel leading from the field
// through the stadium back to the city. I should be able to walk through the
// stands and on the field and the sidelines and through the tunnel." And the
// garage: "way more open space … round like central egress … the ramp big
// enough to drive a car on … no door to H-wing … better maps to skate on."
//
// Both rooms are BUILT, not generated: architecture that stands ON the floor
// (wall rows with walkable tops, bridge slabs over tunnels, a spiral ramp, an
// arc-bridge deck) instead of raised ground. The shape pins are light; the
// stadium's walker proof compiles the 663-row bowl and is `heavy`.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { loadGameData } = require('./load-data');
const { heavy } = require('./test-heavy');
const D = loadGameData(), HQ = D.DOOR_HQ;
const TR = fs.readFileSync(__dirname + '/three-renderer.js', 'utf8');
const BOWL = 'site_prebuilt_stadium_bowl';

function reachOf(rid) {
    const room = HQ.rooms[rid], info = D.hqTerrainInfo(rid);
    const L0 = D.hqTerrainDoorLanding(room, room.doors[0]);
    const reach = D.hqTerrainReach(info, L0.x, L0.z);
    return { info, at: (x, z, y) => { const f = D.hqTerrainFeet(info, x, z, y == null ? null : y); return f != null && reach.has(D.hqTerrainNodeKey(info, x, z, y == null ? f : y)) ? f : null; } };
}

test('THE BOWL: a flat grass gridiron (no generated plan, no noise) painted end to end, ringed by stands, a concourse, a facade and three tunnels', () => {
    const r = HQ.rooms[BOWL], T = r.terrain;
    assert.ok(r && !T.gen && T.noise.amp === 0, 'the pitch is flat and built, not generated');
    assert.equal(T.floor, 'grass_2', 'grass');
    const marks = T.marks || [];
    assert.ok(marks.filter(m => m.k === 'text').some(m => m.text === 'ENTROPY') && marks.filter(m => m.k === 'rect').length >= 2, 'painted end zones');
    assert.ok(marks.filter(m => m.k === 'line').length >= 21, 'the yard lines (every five yards)');
    const F = T.features;
    const seatYs = new Set(F.filter(f => f.tier && f.seat).map(f => f.y));
    assert.ok(seatYs.size >= 14, 'fourteen seated rows (' + seatYs.size + ' heights)');
    const top = Math.max(...F.filter(f => f.k === 'wall').map(f => f.y));
    assert.ok(top >= 10 && F.some(f => f.k === 'bridge' && /concourse/.test(f.id || '')), 'a concourse behind the top row and a facade over it (' + top + ' m)');
    /* the tunnels: a row over a tunnel continues as a plain bridge slab (the stands walk over the tunnel roof) */
    for (const side of ['n', 's', 'e']) assert.ok(F.some(f => f.k === 'bridge' && /stand/.test(f.id) && f.id.endsWith(':' + side) && f.plain), 'the ' + side + ' tunnel is roofed by the stands');
    assert.ok(F.some(f => f.k === 'bridge' && f.id === 'pressbox' && f.glaze && f.y >= 10), 'the press box, glazed, over the west stand');
    /* the seats: every row has a colour (home crimson, away navy, ends gold) */
    assert.ok(F.filter(f => f.tier && f.seat).length >= 14 * 4, 'seats on every row');
    /* the posts, the board, the masts */
    const P = r.props;
    assert.deepEqual(P.filter(p => p.key === 'field_goal_post').map(p => Math.abs(p.z)).sort().join(','), '43.9,43.9', 'goal posts on both end lines');
    assert.ok(P.some(p => p.key === 'scoreboard') && HQ.catalogue.scoreboard && HQ.catalogue.scoreboard.proc === 'scoreboard', 'the scoreboard');
    assert.equal(P.filter(p => p.key === 'flood_mast').length, 4, 'four flood masts');
    /* the road home leaves from the north tunnel's mouth */
    const road = HQ.links.find(l => l.id === 'stadium_downtown');
    assert.ok(road.a.wall === 'n' && road.a.x === 0, 'the city road out of the north tunnel');
});

test('THE PARKING GARAGE: a round drum (one mitred ring, no jags), an open plaza, one smooth spiral ramp a car fits on, one upper deck, no way into H-Wing', () => {
    const g = HQ.rooms.garage, F = g.terrain.features;
    assert.ok(!g.terrain.gen && g.terrain.noise.amp === 0, 'built, flat');
    const drum = F.filter(f => f.k === 'wall' && Math.abs(Math.hypot((f.x0 + f.x1) / 2, (f.z0 + f.z1) / 2) - 27.8) < 0.3);
    const mitred = drum.filter(w => Array.isArray(w.quad) && w.quad.length === 4);
    assert.ok(mitred.length >= 78 && drum.length - mitred.length <= 6, 'the drum is a mitred ring (' + mitred.length + ' mitred rows, ' + (drum.length - mitred.length) + ' jambs)');
    const ramp = F.find(f => f.k === 'spiral' && f.id === 'ramp'), deck = F.find(f => f.k === 'bridge' && f.id === 'deck');
    assert.ok(ramp && deck, 'the ramp and the deck');
    assert.ok(ramp.r1 - ramp.r0 >= 9, 'the ramp is ' + (ramp.r1 - ramp.r0).toFixed(1) + ' m wide — two cars abreast');
    assert.equal(ramp.h1, deck.y, 'the ramp tops out at the deck');
    assert.ok(ramp.a1 - ramp.a0 >= 90, 'a long, shallow climb');
    /* the open plaza: nothing parked inside the ramp's inner radius */
    const cars = g.props.filter(p => /^(parked_car|car_)/.test(p.key));
    assert.ok(cars.length >= 5 && cars.every(p => Math.hypot(p.x, p.z) > ramp.r0 + 2), 'the cars park round the rim');
    const kick = F.filter(f => f.k === 'ramp' && f.kicker);
    assert.equal(kick.length, 2, 'two kickers in the plaza');
    assert.ok(g.props.filter(p => p.key === 'quarter_pipe').length >= 2, 'quarter pipes');
    /* H-Wing: the garage is easy to reach, so it keeps no door there */
    assert.ok(!g.doors.some(d => d.action && /^hwing/.test(d.action.room || '')), 'no door to H-Wing');
    assert.equal(D.hqHWingEntries().map(e => e.room).join(','), 'deadend', 'the room at the end is the only way in');
});

test('THE PARKING GARAGE is walked: the plaza, the ramp, the deck all round; nothing traps', () => {
    const { info, at } = reachOf('garage');
    for (const [x, z] of [[0, 10], [-22.7, 0], [22.7, -13.1]]) assert.equal(at(x, z), 0, 'the plaza floor at ' + x + ',' + z);
    assert.ok(Math.abs(at(0, 23, 2.1) - 2.1) < 0.2, 'halfway up the ramp');
    for (const [x, z] of [[22.7, -13.1], [-22.7, 0], [0, -26]]) assert.equal(at(x, z, 4.2), 4.2, 'the deck at ' + x + ',' + z);
    assert.deepEqual(D.hqTerrainTraps(info).length, 0, 'nothing traps');
});

test('THE BOWL is walked: the pitch, the sidelines, a row, the concourse, both end tunnels; nothing traps', heavy, () => {
    const { info, at } = reachOf(BOWL);
    assert.equal(at(0, 0), 0, 'midfield');
    assert.equal(at(40, 12), 0, 'the east tunnel');
    assert.equal(at(0, -58), 0, 'the north tunnel');
    assert.equal(at(0, 58), 0, 'the south tunnel');
    assert.ok(at(-30.5, 10) > 2, 'a row of the west stand');
    assert.ok(at(-39.7, 30) > 5, 'the concourse');
    assert.equal(D.hqTerrainTraps(info).length, 0, 'nothing traps');
});

test('THE RENDERER draws the built pieces: mitred prisms (sloped tops), painted marks, kicker wedges, tier seats, the scoreboard', () => {
    assert.ok(/function _hqPrismInto\(/.test(TR), 'the mitred prism');
    assert.ok(/function _hqBuildMarks\(/.test(TR), 'the paint');
    assert.ok(/function _hqBuildKicker\(/.test(TR) && /f\.kicker/.test(TR), 'the kicker wedge');
    assert.ok(/function _hqBuildTierSeats\(/.test(TR), 'the seats');
    assert.ok(/scoreboard/.test(TR), 'the scoreboard proc');
    assert.ok(/w\.ghost/.test(TR), 'ghost walls are never drawn');
});
