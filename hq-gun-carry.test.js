// hq-gun-carry.test.js — THE ENGAGEMENT + THE CARRY-OVER, the door wheel Phase 4 (DOOR_GUN_PLAN.md §5.3, 2026-09-25).
// A standing door's act touching a roaming native starts the fight (THE STRIKE); the room's standing doors and a
// pre-placed capture door on the fight's board land on their cells before the seats (THE CARRY); the striking door's
// act lands on the native on the first frame (THE OPENING); the room's record takes the hits the board left (a broken
// door is gone); the capture door is spent from the bag when it stands and refunded when the room is left without a
// fight. Guards: data.js's pure half (the facing, the carry — a door inside the window lands on its cell, one outside
// stays — the opening's numbers, the capture record, the after-fight write); battle.js's half in a vm (the carry
// before the seats, a gust opening blowing the native onto the carried capture door, the numbers when the door is off
// the board, the results read); and the source sites (the renderer's strike, map.js's launch / seats / refund, the
// arrival, the commit). Repo-only; `npm test`.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { loadGameData } = require('./load-data');
const read = f => fs.readFileSync(__dirname + '/' + f, 'utf8');
const BT = read('battle.js'), MP = read('map.js'), TR = read('three-renderer.js');
const D0 = loadGameData();
const g0 = n => vm.runInContext(n, D0);
const room = Object.keys(g0('DOOR_HQ').rooms)[0];
const other = Object.keys(g0('DOOR_HQ').rooms)[1];
const prof = (bag) => ({ door: { hq: { bag: { items: Object.assign({}, bag || {}), at: 1 } } } });
/* a 8 × 8 board of 1.75 m cells whose (0,0) corner is the room's origin */
const field = { board: { N: 8, C: 1.75, x0: 0, z0: 0 }, walker: { x: 1, y: 0, z: 1 }, heading: 0 };
const cellM = c => c * 1.75 + 0.875;

test('THE FACING: a room facing (0 = +z, clockwise) is a board step (x = the room\'s x, y = its z)', () => {
    const f = g0('hqGunDoorBoardFace');
    const got = [0, 45, 90, 135, 180, 225, 270, 315].map(d => { const r = f(d); return r.faceX + ',' + r.faceY; });
    assert.deepEqual(got, ['0,1', '1,1', '1,0', '1,-1', '0,-1', '-1,-1', '-1,0', '-1,1']);
});

test('THE CARRY: a door inside the window lands on its cell with its hits; one outside stays in the room; no board carries nothing', () => {
    const p = prof();
    const place = g0('hqGunDoorPlace');
    assert.ok(place(p, { room, key: 'gust', x: cellM(2), y: 0, z: cellM(5), face: 90 }).ok);
    assert.ok(place(p, { room, key: 'maw', x: 40, y: 0, z: 40, face: 0 }).ok);
    p.door.hq.gunPlaced.list[0].hits = 2;
    const C = g0('hqGunDoorCarry')(p, room, field, null);
    assert.equal(C.doors.length, 1, 'only the door on the board');
    assert.deepEqual({ key: C.doors[0].key, x: C.doors[0].x, y: C.doors[0].y, fx: C.doors[0].faceX, fy: C.doors[0].faceY, h: C.doors[0].hits },
                     { key: 'gust', x: 2, y: 5, fx: 1, fy: 0, h: 2 });
    assert.equal(C.capture, null); assert.equal(C.opening, null, 'no strike, no opening');
    assert.equal(g0('hqGunDoorCarry')(p, other, field, null).doors.length, 0, 'another room\'s doors never come');
    assert.equal(g0('hqGunDoorCarry')(p, room, { board: null, walker: field.walker, heading: 0 }, null).doors.length, 0, 'no board: every door stays');
    const up = g0('hqGunDoorCarry')(p, room, Object.assign({}, field, { walker: { x: 1, y: 9, z: 1 } }), null);
    assert.equal(up.doors.length, 0, 'a door on another floor of the room stays');
});

test('THE OPENING: the striking door\'s act as numbers — the battle row\'s, the wind\'s shove along its lane, the draught toward the door', () => {
    const O = g0('hqGunDoorOpening'), S = D0.SPELL_BY_ID;
    const gust = O({ key: 'gust', at: 7, x: cellM(1), z: cellM(1), face: 90 }, field);
    assert.equal(JSON.stringify(gust.shove), JSON.stringify({ dx: 1, dy: 0, n: 4 })); assert.equal(gust.dmg, 0); assert.equal(JSON.stringify(gust.cell), JSON.stringify({ x: 1, y: 1 }));
    const arch = O({ key: 'archers', face: 0 }, field);
    assert.equal(arch.dmg, S.gunArchersDoor.arrowDmg); assert.equal(arch.hits, S.gunArchersDoor.arrows);
    const hell = O({ key: 'hell', face: 0 }, field);
    assert.equal(hell.dmg, S.gunHellDoor.laneDmg); assert.equal(hell.status, 'burn'); assert.equal(hell.rounds, S.gunHellDoor.burnRounds);
    assert.equal(O({ key: 'frost', face: 0 }, field).status, 'slow');
    assert.equal(O({ key: 'laser', face: 0 }, field).dmg, S.gunLaserDoor.beamDmg);
    assert.equal(O({ key: 'light', face: 0 }, field).status, 'blind');
    const maw = O({ key: 'maw', x: 0, z: 0, face: 0 }, field);
    assert.ok(maw.shove && maw.shove.toDoor && maw.shove.n === 1);
    assert.equal(O({ key: 'capture', face: 0 }, field), null, 'only a standing door strikes');
    /* no board: the seats are rotated so the walker → native heading is board +x; the facing turns with them */
    const rot = O({ key: 'gust', face: 0 }, { board: null, heading: Math.PI / 2 });
    assert.deepEqual([rot.faceX, rot.faceY], [1, 0], 'a lane along the heading blows along board +x');
    const C = g0('hqGunDoorCarry')(prof(), room, field, { key: 'gust', at: 5, x: 3, z: 3, face: 90 });
    assert.equal(C.opening.door, 'gust'); assert.equal(C.opening.at, 5);
});

test('THE ONE-WAY WEDGE: the room wheel has it; standing it spends the bag; one at a time; leaving the room refunds it', () => {
    const w = g0('doorGunWheel')(null, { room: true });
    assert.equal(w.map(x => x.key).join(','), 'threshold,capture,gust,archers,hell,maw,frost,laser,light');
    assert.equal(w.length, g0('DOOR_GUN_RULES').wheel.wedges);
    assert.ok(!g0('doorGunWheel')(null, { battle: true }).some(x => x.key === 'capture'), 'the battle rack never lists it');
    const p = prof({ captureDoor: 2, captureDoorTuned: 1 });
    const ch = g0('hqGunCaptureChoices')(p);
    assert.equal(ch.filter(c => c.item === 'captureDoorTuned').length, g0('CAPTURE_RULES').types.length, 'a tuned door is one choice per type');
    const place = g0('hqGunCapturePlace'), count = (k) => g0('hqBagCount')(p, k);
    assert.equal(place(p, { room, item: 'captureDoorTuned', type: null, x: 3, y: 0, z: 3 }).reason, 'type', 'the player picks the type');
    const a = place(p, { room, item: 'captureDoor', x: 3, y: 0, z: 3, face: 180 });
    assert.ok(a.ok && a.row.item === 'captureDoor' && count('captureDoor') === 1, 'the bag\'s item is spent');
    const b = place(p, { room, item: 'captureDoorTuned', type: 'tech', x: 5, y: 0, z: 5 });
    assert.ok(b.ok && b.refunded && b.refunded.item === 'captureDoor' && count('captureDoor') === 2 && count('captureDoorTuned') === 0, 'a second returns the first');
    assert.equal(g0('hqGunCaptureRecord')(p).type, 'tech');
    assert.equal(g0('hqGunCaptureRefund')(p, room), null, 'the same room keeps it');
    const back = g0('hqGunCaptureRefund')(p, other);
    assert.ok(back && back.item === 'captureDoorTuned' && count('captureDoorTuned') === 1 && !g0('hqGunCaptureRecord')(p), 'another room: back in the bag');
    const empty = prof();
    assert.equal(place(empty, { room, item: 'captureDoor', x: 3, y: 0, z: 3 }).reason, 'bag');
    /* the fresh arrival from Play clears the standing doors AND refunds the capture door */
    assert.ok(place(p, { room, item: 'captureDoor', x: 3, y: 0, z: 3 }).ok);
    assert.equal(count('captureDoor'), 1);
    assert.equal(g0('hqGunDoorClear')(p), true); assert.equal(count('captureDoor'), 2); assert.equal(g0('hqGunCaptureRecord')(p), null);
});

test('AFTER THE FIGHT: the hits come home, a broken door is gone, the capture door that went in is spent, an unseated door is untouched', () => {
    const p = prof({ captureDoor: 1 });
    const place = g0('hqGunDoorPlace');
    const a = place(p, { room, key: 'gust', x: cellM(2), y: 0, z: cellM(2), face: 90 }).row;
    const b = place(p, { room, key: 'hell', x: cellM(5), y: 0, z: cellM(5), face: 0 }).row;
    assert.ok(g0('hqGunCapturePlace')(p, { room, item: 'captureDoor', x: cellM(6), y: 0, z: cellM(2) }).ok);
    const carry = g0('hqGunDoorCarry')(p, room, field, null);
    assert.equal(carry.doors.length, 2); assert.ok(carry.capture && carry.capture.x === 6 && carry.capture.y === 2);
    const r = g0('hqGunDoorsAfterFight')(p, carry, { doors: { [a.at]: 1, [b.at]: 0 }, capture: true });
    assert.deepEqual([...r.broken], ['hell']);
    const left = g0('hqGunDoorRecord')(p);
    assert.equal(left.length, 1); assert.equal(left[0].key, 'gust'); assert.equal(left[0].hits, 1);
    assert.equal(g0('hqGunCaptureRecord')(p), null, 'the capture door went into the fight');
    assert.equal(g0('hqBagCount')(p, 'captureDoor'), 0, 'spent, never refunded');
    const q = prof(); const c = place(q, { room, key: 'maw', x: 1, y: 0, z: 1, face: 0 }).row;
    g0('hqGunDoorsAfterFight')(q, { doors: [{ at: c.at }] }, { doors: {} });
    assert.equal(g0('hqGunDoorRecord')(q)[0].hits, 3, 'a door the board could not seat is untouched');
});

/* ── battle.js's half, in a vm over the real DOOR block (door-gun-board.test.js's harness, trimmed) ── */
const between = (src, a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); assert.ok(i >= 0 && j > i, 'slice ' + a); return src.slice(i, j); };
const DOOR_SRC = between(BT, '        const DOOR_RULES = {', '        function _structureAt(x, y, unit) {');
const CHAIN_SRC = between(BT, '        const CHAIN_RULES = { maxDepth: 8', '        // 🌋 Knockback into hazards (the historical name');
function board() {
    const D = loadGameData();
    const logs = [], dmg = [];
    const state = { round: 1, phase: 'battle', doors: [], units: [], partyBag: { seat: 1, items: {} }, bombs: [], traps: [],
        _deployedObjects: [], _activeZones: [], activeWeather: [], autoPlayers: {}, fogOfWar: false };
    const W = 8, H = 8;
    const inside = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
    const unitAt = (x, y) => state.units.find(u => !u.dead && u.x === x && u.y === y) || null;
    let lead = null;
    Object.assign(D, {
        state, logs,
        isInside: inside, unitAt, bw: () => W, bh: () => H,
        getTerrainRule: () => ({ passable: true }), getTerrainAt: () => 'grass', canOccupy: () => true,
        isRangeBlockedByTerrain: () => false, isInVision: () => true, getHeightAt: () => 0,
        _partyBagOn: () => true, isOnlineMatch: () => false,
        unitHomePlayer: u => u.player, randInt: () => 7, engineRandInt: () => 4, actionMs: ms => ms,
        setUnitFacing: () => {}, _skipVisuals: () => true,
        addLog: m => logs.push(String(m)), coordLabel: (x, y) => x + ',' + y, unitDisplayName: u => u.name || u.id,
        showFloatingTextAtTile: () => {}, showFloatingTextForUnit: () => {}, playSfx: () => {}, playDoorSfx: () => {},
        invalidateVisionCache: () => {}, scheduleBoardRender: () => {}, markDirty: () => {}, checkWin: () => {},
        unitHasStatus: (u, k) => !!(u && u.status && (u.status[k] | 0) > 0), clearStatus: (u, k) => { delete u.status[k]; },
        applyStatusPayload: (u, p) => { u.status[p.id] = p.duration; return true; },
        unitFromId: id => state.units.find(u => u.id === id) || null, isEnemyUnit: (a, b) => a.player !== b.player,
        getUnitPushDistance: (u, n) => n,
        applyDamageToUnit: (u, n) => { dmg.push({ id: u.id, n }); u.hp -= n; if (u.hp <= 0) u.dead = true; },
        triggerStatusWiggle: () => {},
        _benchOn: () => false, _gauntletReservesAlive: () => 0, _encLeadUnit: (p) => (p === 2 ? lead : null),
        getUnitLevel: u => u.level || 10, isUnitAirborne: u => !!u.flying, unitPassiveValue: () => null,
        getLinePoints: () => [], unitPassiveValueFor: () => null,
        canFly: u => !!u.flying, getGravityFieldAt: () => null, forceGroundUnit: () => false,
        _isWetTile: () => false, _isLavaTile: () => false, _tileIsBurning: () => false, TERRAIN_RULES: {},
        _soakUnit() {}, ensureUnitStatus: u => (u.status = u.status || {}), _burnUnitOnTile() {},
        checkPixieDustPickup: () => false, collectMatDropsAt() {}, checkTrapTrigger: () => false,
        updateSmokeZoneCloak() {}, checkWarpRuneTrigger: () => false, detonateDeployedObject() {},
        WEATHER_REGISTRY: {}, animateDisplacement() {}, applyBlowback: () => ({ pushed: false }),
        resolveForcedSlide: (u, dx, dy, dist) => {
            let n = 0;
            while (n < dist) { const nx = u.x + dx, ny = u.y + dy; if (!inside(nx, ny) || unitAt(nx, ny)) break; u.x = nx; u.y = ny; n++; }
            if (n) D.resolveTileArrival(u, { via: 'displaced' });
            return { moved: n };
        },
    });
    vm.runInContext('var _encMatch = null;\n' + CHAIN_SRC + '\n' + DOOR_SRC + '\nthis.resolveTileArrival = resolveTileArrival; this._setEnc = function (m) { _encMatch = m; };', D);
    const mk = (id, player, x, y, o) => { const u = Object.assign({ id, player, x, y, z: 0, hp: 1000, maxHp: 1000, ap: 2, status: {}, items: {}, types: ['human'], race: 'grey', name: id }, o || {}); state.units.push(u); return u; };
    return { D, state, logs, dmg, mk, g: n => vm.runInContext(n, D), setLead: u => { lead = u; } };
}

test('ON THE BOARD: the carried doors stand before the seats; the gust\'s opening blows the native onto the carried capture door — TAKEN on the first frame', () => {
    const B = board();
    B.mk('p1', 1, 0, 0, { race: 'door agent' });
    const e = B.mk('e', 2, 3, 3, { hp: 400 }); B.setLead(e);
    const run = { field: { seats: { lead: { 2: { x: 3, y: 3 } } }, cells: { walker: { x: 0, y: 3 } } },
        carry: { doors: [{ at: 11, key: 'gust', x: 1, y: 3, faceX: 1, faceY: 0, hits: 2 }, { at: 12, key: 'hell', x: 9, y: 9, faceX: 0, faceY: 1, hits: 3 }],
                 capture: { at: 13, item: 'captureDoor', type: null, tier: 1, x: 6, y: 3 },
                 opening: g0('hqGunDoorOpening')({ key: 'gust', at: 11, face: 90 }, field) } };
    B.D._setEnc(run);
    const n = B.g('encounterCarryDoors')((x, y) => !(x === 5 && y === 5));
    assert.equal(n, 2, 'the gust and the capture door (the hell door\'s cell is off the board)');
    const gd = B.state.doors.find(d => d._roomAt === 11);
    assert.ok(gd && gd.kind === 'standing' && gd.hp === 2 && gd.owner === 1 && gd.ownerId === 'p1' && gd.faceX === 1, 'the room\'s hits, the party\'s seat, the Door Agent credited');
    const cd = B.state.doors.find(d => d._roomAt === 13);
    assert.ok(cd && cd.kind === 'capture' && cd.itemKey === 'captureDoor' && cd.hp === g0('CAPTURE_RULES').hits[1]);
    assert.ok(run.carry.placed[11] && !run.carry.placed[12] && run.carry.placedCapture);
    assert.equal(B.g('encounterCarryDoors')(null), 0, 'idempotent: a second call places nothing twice');
    let done = 0;
    B.g('encounterOpening')(() => { done++; });
    assert.equal(done, 1, 'the first activation follows');
    assert.equal(e.x + ',' + e.y, '6,3', 'blown to the lane\'s end + 1 — the capture door');
    assert.equal(cd.held && cd.held.unitId, 'e', 'THE CHAIN: the door takes it on the first frame');
    B.g('encounterOpening')(() => { done++; });
    assert.equal(done, 2, 'a second call is a no-op (once per fight) but still hands on');
    const R = B.g('_encDoorResults')(run.carry);
    assert.deepEqual(JSON.parse(JSON.stringify(R)), { doors: { 11: 2 }, capture: true });
});

test('ON THE BOARD: a striking door off the board lands its act as numbers — the Hell Door\'s blast + Burn on the native', () => {
    const B = board();
    const e = B.mk('e', 2, 4, 4, { hp: 500 }); B.setLead(e);
    const op = g0('hqGunDoorOpening')({ key: 'hell', at: 21, x: -3, z: 7, face: 90 }, field);
    B.D._setEnc({ field: { seats: { lead: {} } }, carry: { doors: [], capture: null, opening: op } });
    B.g('encounterOpening')(null);
    assert.equal(B.dmg.length, 1); assert.equal(B.dmg[0].id, 'e');
    assert.equal(e.status.burn, op.rounds);
    assert.ok(B.logs.some(l => /THE DOOR STRUCK FIRST/.test(l)));
});

test('THE SOURCE: the renderer\'s strike, map.js\'s launch + seats + refund, the arrival\'s opening, the commit', () => {
    assert.ok(/function _hqGunStrikeScan\(now\)/.test(TR) && /var hit = _hqGunStrikeScan\(now\);/.test(TR), 'every frame, the doors look for a native in their act');
    assert.ok(/gesture: 'door', door: \{ key: rec\.key, at: rec\.at/.test(TR), 'the report is the swing\'s own onEncounter');
    assert.ok(/if \(now < H\.gun\.armAt\) return false;/.test(TR), 'armed a beat after entry');
    assert.ok(/_hqGunDoorStrike\(rec, still\);/.test(TR), 'the archers strike when the arrows land');
    assert.ok(/if \(H\.gun\.door === 'capture'\) return _hqGunCaptureFire\(\);/.test(TR) && /H\.opts\.onGunCapturePlace\(spec\)/.test(TR));
    assert.ok(/window\.hqGunDoorCarry\(_hqProfile\(\), L\.room \|\| _hqCurRoom, field, \(ev && ev\.door\) \|\| null\)/.test(MP), 'the launch files the carry');
    assert.ok(MP.indexOf('window.encounterCarryDoors(free)') > 0 && MP.indexOf('window.encounterCarryDoors(free)') < MP.indexOf('free: freeSeat });'), 'the doors stand before the seats');
    assert.ok(/_hqGunCaptureSettle\(roomId\);/.test(MP) && /window\.hqGunCapturePlace\(p, spec\)/.test(MP));
    assert.ok(/_encArrivalRound\(\(\) => encounterOpening\(\(\) => maybeAdvanceTurn\(\)\)\)/.test(BT), 'the opening lands on the arrival');
    assert.ok(/hqGunDoorsAfterFight\(p, erun\.carry, _encDoorResults\(erun\.carry\)\)/.test(BT), 'the commit sends the hits home');
});
