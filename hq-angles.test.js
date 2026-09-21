/* THE UNDISCOVERED DOOR + THE SUSPICIOUS ANGLE + THE RENAMES (2026-09-21)
   The user: "don't show the names of undiscovered locations on doors — just a
   question mark or nothing; get rid of the descriptors; fix weird names like the
   elevator called the car; hidden passages are a Suspicious Angle — E pulls out
   the protractor, measures it and discovers the door; a shiny glimmer until then."
   data.js hqDoorPlateFor is the ONE plate rule, hqAngleMark / hqAngleFound the
   ledger (local + the synced blob); the renderer's glimmer / reveal and map.js's
   protractor beat are source-pinned. */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const { loadGameData } = require('./load-data.js');
const D = loadGameData();
const g = k => D[k];
const TR = fs.readFileSync(__dirname + '/three-renderer.js', 'utf8');
const MP = fs.readFileSync(__dirname + '/map.js', 'utf8');
const profile = () => ({ door: { hq: {} }, progress: { v: 2 } });

test('THE UNDISCOVERED DOOR: a door to a room never stood in reads ? with no number; stood in, its name; a page door its own', () => {
    const hall = D.DOOR_HQ.rooms.central_egress;
    const caf = hall.doors.find(d => d.id === 'cafeteria');
    const p = profile();
    let P = g('hqDoorPlateFor')(caf, p);
    assert.equal(P.known, false); assert.equal(P.label, '?'); assert.equal(P.no, '', 'no number on an unseen place'); assert.equal(P.room, 'cafeteria');
    assert.equal(g('hqDoorPlateFor')(caf, null).known, false, 'no profile = nothing known');
    g('hqRoomSee')(p, 'cafeteria');
    P = g('hqDoorPlateFor')(caf, p);
    assert.equal(P.known, true); assert.equal(P.label, 'THE CAFETERIA'); assert.equal(P.no, '86');
    const street = D.DOOR_HQ.rooms.foyer.doors.find(d => d.id === 'street');
    assert.ok(g('hqDoorPlateFor')(street, profile()).known, 'a page door (the street) is always its own plate');
    /* the elevator's lobbies: the car's door on a lobby is ? until the car is stood in */
    const lift = D.DOOR_HQ.rooms.services.doors.find(d => d.action && d.action.room === 'car');
    assert.equal(g('hqDoorPlateFor')(lift, profile()).label, '?');
    const q = profile(); g('hqRoomSee')(q, 'car'); assert.equal(g('hqDoorPlateFor')(lift, q).label, 'THE ELEVATOR');
});

test('THE RENAMES: the car is THE ELEVATOR, the hall THE MAIN HALL, the foyer / cafeteria / observatory / pool / carnival / warehouse / the four lobbies read plainly', () => {
    const R = D.DOOR_HQ.rooms;
    assert.equal(R.car.label, 'THE ELEVATOR'); assert.equal(R.central_egress.label, 'THE MAIN HALL'); assert.equal(R.foyer.label, 'THE FOYER');
    assert.equal(R.cafeteria.label, 'THE CAFETERIA'); assert.equal(R.observatorium.label, 'THE OBSERVATORY'); assert.equal(R.natatorium.label, 'THE SWIMMING POOL');
    assert.equal(R.carnival.label, 'THE CARNIVAL'); assert.equal(R.warehouse.label, 'THE WAREHOUSE');
    assert.equal(R.services.label, 'THE BASEMENT'); assert.equal(R.works.label, 'THE SECOND FLOOR'); assert.equal(R.annex.label, 'THE THIRD FLOOR'); assert.equal(R.labs.label, 'THE FOURTH FLOOR');
    Object.keys(R).forEach(id => { const l = String(R[id].label || ''); assert.ok(!/CENTRAL EGRESS|THE CAR$|CAFETERIUM|OBSERVATORIUM|NATATORIUM|FOURIER/.test(l), id + ': ' + l); (R[id].doors || []).forEach(d => assert.ok(!/CENTRAL EGRESS|CAFETERIUM|OBSERVATORIUM|NATATORIUM|FOURIER|^THE CAR$/.test(String(d.label || '')), id + '/' + d.id + ': ' + d.label)); });
    const stops = D.DOOR_HQ.elevator.stops; assert.ok(stops.every(s => !/^\d|^B$/.test(String(s.label))), 'the stops are named floors');
});

test('THE SUSPICIOUS ANGLE: the key (a link is ONE angle at both ends), the ledger in both records, the union, the reading is never 90°, every secret door is listed', () => {
    const all = g('hqAnglesAll')();
    assert.ok(all.length >= 40, 'the draughts are on the list: ' + all.length);
    all.forEach(a => assert.ok(/^(link:[a-z0-9_]+|[a-z0-9_]+:[a-z0-9_]+)$/.test(a.key), a.key));
    assert.equal(g('hqAngleKey')('garage', { id: 'p2', secret: true }), 'garage:p2');
    assert.equal(g('hqAngleKey')('x', { id: 'link_vatican_hell', link: 'vatican_hell' }), 'link:vatican_hell');
    const p = profile();
    assert.equal(g('hqAngleFound')(p, 'garage', { id: 'p2' }), false);
    const r = g('hqAngleMark')(p, 'garage', { id: 'p2' }); assert.ok(r.ok && r.first && r.key === 'garage:p2');
    assert.equal(g('hqAngleFound')(p, 'garage', { id: 'p2' }), true);
    assert.ok(p.door.hq.angles.found['garage:p2'] && p.progress.hq.angles.found['garage:p2'], 'both records');
    assert.equal(g('hqAngleMark')(p, 'garage', { id: 'p2' }).first, false, 'found once');
    /* the synced record alone is enough (a profile restored from the server) */
    const q = { door: {}, progress: { v: 2, hq: { angles: { found: { 'link:vatican_hell': '2026-09-20' } } } } };
    assert.equal(g('hqAngleFound')(q, 'anything', { id: 'z', link: 'vatican_hell' }), true);
    /* the blob merge carries it, the earlier day wins */
    const m = g('mergeProgressBlobs')({ v: 2, hq: { angles: { found: { 'garage:p2': '2026-09-21' } } } }, { v: 2, hq: { angles: { found: { 'garage:p2': '2026-09-19', 'link:cern_backrooms': '2026-09-20' } } } });
    assert.equal(m.hq.angles.found['garage:p2'], '2026-09-19'); assert.equal(m.hq.angles.found['link:cern_backrooms'], '2026-09-20');
    const folded = g('hqDoorSyncFold')({ v: 2, angles: { found: {} } }, { hq: { angles: { found: { 'garage:p2': '2026-09-21' } } } });
    assert.equal(folded.angles.found['garage:p2'], '2026-09-21', 'the local record folds in');
    const rd = g('hqAngleReading')('garage:p2'); assert.ok(rd !== 90 && Math.abs(rd - 90) < 15 && rd === g('hqAngleReading')('garage:p2'), 'a stable off-square reading: ' + rd);
});

test('THE SOURCE: the renderer builds the glimmer, hides the plate, refuses the swing / the walk-in and reveals in place; map.js measures with the protractor; no plate carries a sub', () => {
    ['function _hqPlateFor(door)', 'function _hqPlateHtml(door)', 'function _hqAngleGlimmer(grp, U, oh, pd)', 'function _hqRevealAngle(doorId)',
     "var found = secret ? _hqAngleFound(door) : true;", "if (secret && !found) el.style.display = 'none';", "angle: !!(secret && !found), glimmer: glimmer",
     "label: 'SUSPICIOUS ANGLE'", "rec.angle || rec.openT < 0.55", "&& !d.angle) ? 1 : 0", 'revealAngle: _hqRevealAngle,'].forEach(s => assert.ok(TR.includes(s), 'three-renderer.js: ' + s));
    assert.ok(!/<b>' \+ \(door\.label \|\| door\.id\) \+ '<\/b><span>' \+ \(door\.sub/.test(TR), 'no door plate prints the sub any more');
    ['function _hqMeasureAngle(t)', "if (t && t.kind === 'door' && t.angle) { _hqMeasureAngle(t); return; }", 'if (t.angle) return null;', "window.hqAngleMark(p, roomId, door)", 'ThreeRenderer.hq.revealAngle(door.id)',
     "el.innerHTML = `<b>▸ SUSPICIOUS ANGLE</b>", "const sub = (t.kind === 'door') ? '' : (t.sub || '');", 'const PL = _hqPlateFor(d);'].forEach(s => assert.ok(MP.includes(s), 'map.js: ' + s));
});
