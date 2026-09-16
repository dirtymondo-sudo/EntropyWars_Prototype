// hq-suites.test.js — THE SUITES (HQ plan 9.3 "the crowding" / C-27, 2026-09-15).
//
// The ground ring wore thirteen doors and the mezzanine eleven. A DEPARTMENT
// now gets ONE hall door onto its own LOBBY and its rooms hang off that:
// THE MEDICAL WING (210° → the ward 1111, the Padded Room 5150 behind it, the
// Interrogation Room 1984), THE RECORDS WING (240° → Room 42 and Room 247)
// and THE EXECUTIVE SUITE (315° on the mezzanine → Room 111 and the Bureau).
// −2 on the ground ring (225° and 255° left it), −1 upstairs (290° left it).
//
// Guards: the three lobbies exist and wear NO number (the register skips
// them); every moved room's own `at` id, leaf, wide, gate and number survive
// (the review's rule — "suiting rooms must preserve incoming `at` ids, return
// routes, counter homes, gates and remembered landings"); every door is
// REVERSIBLE and lands on a real door; the hall keeps exactly one door per
// department and the three angles are free; the Bureau's GATE and its
// CONTESTED number are still on the Bureau's own door (a recruit walks the
// suite and does not go in); nothing in a lobby LAUNCHES anything (C-27);
// the production landing on every lobby door is inside the walls, clear of
// every blocker and facing into the room; and THE PARK RULE (a rail in each).
// Repo-only tooling — runs under `npm test`.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { loadGameData } = require('./load-data');
const D = loadGameData(), HQ = D.DOOR_HQ;
const ROOM = HQ.rooms.central_egress;
const renderer = fs.readFileSync(__dirname + '/three-renderer.js', 'utf8');
const MP = fs.readFileSync(__dirname + '/map.js', 'utf8');
const at = (room, id) => (HQ.rooms[room].doors || []).find(d => d.id === id);

/* the three suites: the lobby, the hall door that reaches it, and the rooms behind it.
   `at` is the lobby door id each room's own way out must land on. */
const SUITES = [
    { lobby: 'medwing',  hall: 'medical',   deg: 210, level: 0, leaf: 'leaf_hospital',
      rooms: [{ room: 'medical',       at: 'ward',          no: '1111' },
              { room: 'interrogation', at: 'interrogation', no: '1984' }] },
    { lobby: 'recwing',  hall: 'records',   deg: 240, level: 0, leaf: 'leaf_wired_double',
      rooms: [{ room: 'records',       at: 'records',       no: '42' },
              { room: 'clockroom',     at: 'clockroom',     no: '247' }] },
    { lobby: 'execwing', hall: 'executive', deg: 315, level: 2, leaf: 'leaf_suburban_house',   // THE GALLERY (2026-09-16): the suite's door rode up to the third ring
      rooms: [{ room: 'trophycase',    at: 'trophycase',    no: '111' },
              { room: 'continuity',    at: 'continuity',    no: '№ — CONTESTED' }] },
];
/* the three angles the suites emptied */
const FREED = [{ deg: 225, level: 0 }, { deg: 255, level: 0 }, { deg: 290, level: 1 }];

function extract(name) {
    const start = renderer.indexOf('    function ' + name + '(');
    const end = renderer.indexOf('\n    }', start);
    assert.ok(start >= 0 && end > start, name);
    return renderer.slice(start, end + 6);
}
/* the production landing: _hqBoxWall + _hqGoTo on a stub scene (the hq-complex.test.js harness) */
function landing(room, door) {
    const c = { _hq: { room, player: {}, cam: {}, doors: [], counters: [] },
        _hqUnits: () => HQ.units, _hqRad: n => n * Math.PI / 180,
        _hqHeadingOf: (x, z) => Math.atan2(x, -z) * 180 / Math.PI,
        _hqHeadingYaw: n => (180 - n) * Math.PI / 180,
        HQ_WALLS: { n: { nx: 0, nz: 1, yaw: 0 }, s: { nx: 0, nz: -1, yaw: Math.PI }, e: { nx: -1, nz: 0, yaw: -Math.PI / 2 }, w: { nx: 1, nz: 0, yaw: Math.PI / 2 } },
        THREE: { Vector3: class { constructor(x, y, z) { Object.assign(this, { x, y, z }); } } } };
    vm.createContext(c); vm.runInContext(extract('_hqBoxWall') + '\n' + extract('_hqGoTo'), c);
    c._hq.doors.push({ door, box: c._hqBoxWall(room, door.wall, door), y0: 0 });
    assert.equal(c._hqGoTo(door.id, true), true, room.label + '/' + door.id + ' lands');
    return c._hq;
}
/* a prop's footprint on the floor (the hq-complex.test.js rule) */
function propBlocks(room, p, x, z, margin) {
    const S = room.shell, cat = HQ.catalogue[p.key] || {};
    if (p.ceil || cat.ceil || (p.y || 0) > 0.5) return false;
    const px = p.wall === 'w' ? -S.w / 2 : p.wall === 'e' ? S.w / 2 : (p.x || 0);
    const pz = p.wall === 'n' ? -S.d / 2 : p.wall === 's' ? S.d / 2 : (p.z || 0);
    const rect = (p.rect === false) ? null : (p.rect || cat.rect);
    if (rect && !p.wall) return Math.abs(x - px) <= rect.hw + margin && Math.abs(z - pz) <= rect.hd + margin;
    const foot = (p.foot != null) ? p.foot : (cat.foot || 0);
    if (!(foot > 0) && !cat.block) return false;
    return Math.hypot(x - px, z - pz) <= Math.max(foot, 0.3) + margin;
}

test('the three lobbies are box rooms with no number, and the register skips every one of them', () => {
    const reg = D.hqRoomRegister();
    for (const su of SUITES) {
        const L = HQ.rooms[su.lobby];
        assert.ok(L && L.kind === 'box', su.lobby + ': a box room');
        assert.ok(L.shell && L.shell.w > 0 && L.shell.d > 0 && L.shell.h >= 3.0, su.lobby + ': a shell the doors fit under');
        assert.ok(L.label && L.sub && L.spawn && Array.isArray(L.doors) && Array.isArray(L.props) && Array.isArray(L.lines), su.lobby + ': label, sub, spawn, doors, props, lines');
        assert.strictEqual(L.roomNo, undefined, su.lobby + ' is a lobby and wears no number (7.0 rule 2 — the foyer and the penthouse are the precedent)');
        assert.strictEqual(D.hqRoomNo(su.lobby), '', su.lobby + ': hqRoomNo finds nothing of its own');
        assert.ok(!reg.some(r => r.id === su.lobby), su.lobby + ' is not in the register');
        assert.strictEqual(D.hqRoomSite(su.lobby), null, su.lobby + ' is facility, never wild (9.4)');
    }
    /* the register still lists every moved room exactly once, under its own number */
    for (const su of SUITES) for (const r of su.rooms) {
        const rows = reg.filter(x => x.no === r.no);
        assert.strictEqual(rows.length, 1, r.no + ' once in the register');
        assert.strictEqual(D.hqRoomNo(r.room), r.no, r.room + ': hqRoomNo still reads ' + r.no);
    }
});

test('ONE hall door per department: each suite has exactly one way in from the hall, at its angle, and the three angles it emptied are free wall', () => {
    for (const su of SUITES) {
        const hall = ROOM.doors.filter(d => d.action && d.action.room === su.lobby);
        assert.strictEqual(hall.length, 1, su.lobby + ': exactly one hall door');
        const d = hall[0];
        assert.strictEqual(d.id, su.hall, su.lobby + ': the hall door keeps its id (a remembered landing still resolves)');
        assert.strictEqual(d.deg, su.deg, su.hall + ' stands at ' + su.deg + '°');
        assert.strictEqual(d.level || 0, su.level, su.hall + ': the right floor');
        assert.strictEqual(d.leaf, su.leaf, su.hall + ': the department\'s own leaf');
        assert.strictEqual(d.action.at, 'egress', su.hall + ': lands at the lobby\'s way out');
        assert.strictEqual(D.hqDoorNo(d), '', su.hall + ': a wing wears no number, so the plate carries none');
        assert.ok(!D.DOOR_TEXT.CLEARANCE.some(r => r.door === d.leaf), su.hall + ': never a rank leaf');
        const cat = HQ.catalogue[d.leaf];
        assert.strictEqual(!!d.wide, !!(cat && cat.wide), su.hall + ': wide matches the leaf');
    }
    /* the two ground doors and the one mezzanine door that left */
    for (const f of FREED) assert.ok(!ROOM.doors.some(d => (d.level || 0) === f.level && Math.abs(d.deg - f.deg) < 5),
        f.deg + '° on level ' + f.level + ' is free wall now');
    for (const id of ['clockroom', 'interrogation', 'trophycase', 'continuity']) assert.ok(!ROOM.doors.some(d => d.id === id), 'the hall no longer wears a ' + id + ' door');
    /* the ring is thinner: 11 on the ground, 10 upstairs — and since THE GALLERY (2026-09-16)
       the four exploration doors stand on the third ring: 6 on the mezzanine (the bays + the elevator), 4 up top */
    assert.strictEqual(ROOM.doors.filter(d => !(d.level || 0)).length, 11, 'the ground ring wears eleven doors (13 − 2)');
    assert.strictEqual(ROOM.doors.filter(d => (d.level || 0) === 1).length, 6, 'the mezzanine keeps the bays and the elevator (10 − 4)');
    assert.strictEqual(ROOM.doors.filter(d => (d.level || 0) === 2).length, 4, 'the gallery wears the four exploration doors');
});

test('every suite is reversible: the lobby\'s way out lands on its hall door, each room\'s way out lands on the lobby door that opened it, and nothing moved but the far end', () => {
    for (const su of SUITES) {
        const L = HQ.rooms[su.lobby];
        const out = at(su.lobby, 'egress');
        assert.ok(out && out.action.room === 'central_egress' && out.action.at === su.hall, su.lobby + ': the way out lands at its hall door');
        const hallDoor = ROOM.doors.find(d => d.id === su.hall);
        assert.strictEqual(out.leaf, hallDoor.leaf, su.lobby + ': the same leaf from both sides');
        assert.strictEqual(!!out.wide, !!hallDoor.wide, su.lobby + ': the same opening from both sides');
        for (const r of su.rooms) {
            const into = at(su.lobby, r.at), back = at(r.room, 'egress');
            assert.ok(into && into.action.room === r.room && into.action.at === 'egress', su.lobby + '/' + r.at + ' walks into ' + r.room + ' at its way out');
            assert.ok(back && back.action.room === su.lobby && back.action.at === r.at, r.room + ': its way out lands on the lobby door that opened it');
            assert.strictEqual(back.id, 'egress', r.room + ': the room keeps its own `at` id (every incoming landing still resolves)');
            assert.strictEqual(into.leaf, back.leaf, r.room + ': the same leaf from both sides');
            assert.strictEqual(!!into.wide, !!back.wide, r.room + ': the same opening from both sides');
            assert.strictEqual(D.hqDoorNo(into), r.no, su.lobby + '/' + r.at + ': the plate reads ' + r.no);
        }
        /* the lobby leads nowhere else */
        const ids = L.doors.filter(d => !d.link).map(d => d.id).sort().join(',');
        assert.strictEqual(ids, ['egress'].concat(su.rooms.map(r => r.at)).sort().join(','), su.lobby + ': the way out and its rooms, nothing else');
    }
    /* Room 5150 is still behind the ward, not on the wing's corridor (the closet rule: a room keeps its own back rooms) */
    const cell = at('medical', 'padded');
    assert.ok(cell && cell.action.room === 'padded' && cell.action.at === 'egress', 'the cell door is still at the back of the ward');
    assert.strictEqual(at('padded', 'egress').action.room, 'medical', 'and Room 5150 comes back to the ward');
});

test('THE GATE AND THE NUMBER stay on the Bureau\'s own door: a recruit walks the executive suite and still does not go in', () => {
    const suite = ROOM.doors.find(d => d.id === 'executive');
    assert.ok(!suite.minClearance && !suite.requiresKeys && !suite.rankDoor, 'the suite\'s hall door is ungated');
    assert.strictEqual(D.doorSiteState(suite, null), 'open', 'a recruit walks in off the mezzanine');
    const bureau = at('execwing', 'continuity');
    assert.strictEqual(bureau.minClearance, 5, 'GATEKEEPER clearance, unchanged');
    assert.strictEqual(bureau.requiresKeys, 24, 'and two dozen Keys, unchanged');
    assert.strictEqual(String(bureau.roomNo), '№ — CONTESTED', 'the number is still the door\'s');
    assert.ok(bureau.why, 'and it still says why');
    assert.strictEqual(D.doorSiteState(bureau, null), 'clearance', 'a recruit reads the door and does not go in');
    assert.strictEqual(D.doorSiteState(bureau, { door: { clearance: 5, hq: { keys: 24 } } }), 'open', 'a GATEKEEPER with the Keys goes in');
    assert.strictEqual(D.hqKeysShort(bureau, null), 24, 'short by the full count');
    assert.ok(/CONTESTED/.test(D.hqRoomNo('continuity')), 'hqRoomNo still reads the door\'s CONTESTED through the room');
    const rows = D.hqRoomRegister().filter(r => /CONTESTED/.test(r.no));
    assert.strictEqual(rows.length, 1, 'once in the register');
    assert.strictEqual(rows[0].room, 'execwing', 'listed where the door now hangs');
    assert.ok(!at('continuity', 'egress').minClearance && !at('continuity', 'egress').requiresKeys, 'ungated from inside, as before');
    /* the rev-2 promise: the canon notices are readable from the hall at any rank — the suite's door carries them too */
    assert.match(MP, /if \(\(d\.id === 'continuity' \|\| d\.id === 'executive'\) && typeof window\.hqMottoBarometer === 'function'\)/, 'map.js puts the motto + notices on the suite\'s door as well as the Bureau\'s');
});

test('a lobby launches NOTHING (C-27: one home per function), and every counter home that moved behind a suite is still exactly one', () => {
    for (const su of SUITES) {
        const L = HQ.rooms[su.lobby];
        for (const c of L.counters || []) assert.ok(!c.action || (!c.action.fn && !c.action.overlay && !c.action.room), su.lobby + '/' + c.id + ': a lobby counter is a panel at most, never a launch');
        for (const d of L.doors) assert.ok(!(d.action || {}).fn, su.lobby + '/' + d.id + ': a lobby door is a door');
    }
    /* the functions that live behind the three suites still have one home each */
    const homes = {};
    for (const [rid, room] of Object.entries(HQ.rooms)) {
        const add = (kind, e) => { const a = e.action || {}; const key = a.fn ? 'fn:' + a.fn : (a.overlay ? 'overlay:' + a.overlay : null); if (!key) return; (homes[key] = homes[key] || []).push(rid + '/' + kind + ':' + e.id); };
        (room.doors || []).forEach(d => add('door', d)); (room.counters || []).forEach(c => add('counter', c));
    }
    assert.deepStrictEqual(homes['fn:_goToCampaign'], ['medical/counter:desk'], 'Challenge is Medical\'s desk only');
    assert.deepStrictEqual(homes['fn:_goToCodex'], ['records/counter:codex'], 'the Codex is Room 42\'s reading desk only');
    assert.deepStrictEqual(homes['fn:_mountReactTrophies'], ['trophycase/counter:cabinet'], 'the achievements are Room 111\'s cabinet only');
    assert.deepStrictEqual(homes['overlay:form365'], ['clockroom/counter:form365'], 'Form 365 is Room 247\'s sheet only');
    assert.deepStrictEqual(homes['overlay:transcript'], ['interrogation/counter:table'], 'the transcript is Room 1984\'s table only');
});

test('the production landing on every lobby door is inside the walls, clear of every blocker, facing into the room — and THE PARK RULE holds', () => {
    for (const su of SUITES) {
        const L = HQ.rooms[su.lobby], S = L.shell;
        for (const d of L.doors) {
            const h = landing(L, d), p = h.player;
            assert.ok(Math.abs(p.x) < S.w / 2 - 0.4 && Math.abs(p.z) < S.d / 2 - 0.4, su.lobby + '/' + d.id + ': the landing is inside the walls');
            const face = { n: [0, 1], s: [0, -1], e: [-1, 0], w: [1, 0] }[d.wall];   // you face INTO the room, away from the wall you came through
            assert.ok(Math.abs(Math.sin(h.cam.yaw) - face[0]) < 0.05 && Math.abs(-Math.cos(h.cam.yaw) - face[1]) < 0.05, su.lobby + '/' + d.id + ': you face into the room');
            for (const q of (L.props || []).concat(L.npcSpots || [], L.agents || [])) assert.ok(!propBlocks(L, q, p.x, p.z, 0.4), su.lobby + '/' + d.id + ': ' + (q.key || q.label) + ' blocks the landing');
        }
        /* every free prop, agent and spot stands inside the room */
        for (const q of (L.props || []).filter(q => !q.wall && !q.ceil)) assert.ok(Math.abs(q.x) <= S.w / 2 - 0.3 && Math.abs(q.z) <= S.d / 2 - 0.3, su.lobby + ': ' + q.key + ' is in a wall');
        for (const q of (L.agents || []).concat(L.npcSpots || [])) assert.ok(Math.abs(q.x) < S.w / 2 - 0.4 && Math.abs(q.z) < S.d / 2 - 0.4, su.lobby + ': a person stands in a wall');
        for (const q of L.props || []) assert.ok(HQ.catalogue[q.key], su.lobby + ': ' + q.key + ' is in the catalogue');
        /* THE PARK RULE (9.8): give a rider a rail. The ramp waits on the ride's registry. */
        assert.ok((L.props || []).filter(q => q.key === 'railing_1m').length >= 2, su.lobby + ': a rail run (THE PARK RULE)');
        /* the spawn is inside, and it is not on top of the way out */
        assert.ok(Math.abs(L.spawn.x) < S.w / 2 - 0.4 && Math.abs(L.spawn.z) < S.d / 2 - 0.4, su.lobby + ': the spawn is inside the walls');
    }
});
