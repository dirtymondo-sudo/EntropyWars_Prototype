// capture-board.test.js — THE ONE-WAY DOOR, Phase 1 (CAPTURE_PLAN.md §2.1–§2.5, 2026-09-25): the capture door on the
// board. battle.js's DOOR block (DOOR_RULES … the capture helpers) runs in a vm over data.js's real CAPTURE_RULES /
// ITEM_RULES / STATUS_DEFS with a tiny board stubbed round it: PLACE (story seat only, the item + 1 AP, one a turn, a
// legal tile, a second door folds the first) → TAKE (an enemy arriving; never a friend, a flyer, a unit in its grace)
// → HOLD (the tick counts down; a lone captive seals — the user's rule) → BREAK (the allies' hits free it, Staggered,
// with a grace) / SEAL (off state.units into state.sealedUnits, a state.captures record) → THE END (a win seals every
// held door, a loss frees). Plus the source sites: the chain step, the walk stop, the realm shield, the attack on a
// held body, the wipeout count, the round tick, finalizeMatch, the commit's enlist, the resets. Repo-only.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { loadGameData } = require('./load-data');
const BT = fs.readFileSync(__dirname + '/battle.js', 'utf8');
const ST = fs.readFileSync(__dirname + '/state.js', 'utf8');
const between = (src, a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); assert.ok(i >= 0 && j > i, 'slice ' + a); return src.slice(i, j); };
const DOOR_SRC = between(BT, '        const DOOR_RULES = {', '        function _structureAt(x, y, unit) {');

function board(opts) {
    opts = opts || {};
    const D = loadGameData();
    const logs = [];
    const state = { round: 1, phase: 'battle', doors: [], units: [], partyBag: opts.story === false ? null : { seat: 1, items: {} }, bombs: [], traps: [], _deployedObjects: [] };
    const W = 8, H = 8;
    Object.assign(D, {
        state, logs,
        isInside: (x, y) => x >= 0 && y >= 0 && x < W && y < H,
        unitAt: (x, y) => state.units.find(u => !u.dead && u.x === x && u.y === y) || null,
        getTerrainRule: () => ({ passable: true }), getTerrainAt: () => 'grass', canOccupy: () => true,
        isRangeBlockedByTerrain: () => false, isInVision: () => true, getHeightAt: () => 0,
        _partyBagOn: () => !!(state.partyBag && state.partyBag.items), isOnlineMatch: () => !!opts.online,
        unitHomePlayer: u => u.player, randInt: n => 7, setUnitFacing: () => {}, _skipVisuals: () => true,
        addLog: m => logs.push(String(m)), coordLabel: (x, y) => x + ',' + y, unitDisplayName: u => u.name || u.id,
        showFloatingTextAtTile: () => {}, showFloatingTextForUnit: () => {}, playSfx: () => {},
        invalidateVisionCache: () => {}, scheduleBoardRender: () => {}, markDirty: () => {},
        unitHasStatus: (u, k) => !!(u && u.status && (u.status[k] | 0) > 0),
        clearStatus: (u, k) => { const d = D.STATUS_DEFS[k]; if (d && d.onRemove && (u.status[k] | 0) > 0) d.onRemove(u); delete u.status[k]; },
        applyStatusPayload: (u, p) => { u.status[p.id] = p.duration; return true; },
        unitFromId: id => state.units.find(u => u.id === id) || null,
        _benchOn: () => false, _gauntletReservesAlive: () => 0, _encLeadUnit: () => null,
        getUnitLevel: u => u.level || 10, isUnitAirborne: u => !!u.flying, unitPassiveValue: (u, k) => (u.passives || {})[k] || null,
        getLinePoints: () => [], unitPassiveValueFor: () => null,
    });
    vm.runInContext('let _encMatch = null;\n' + DOOR_SRC, D);
    const mk = (id, player, x, y, o) => { const u = Object.assign({ id, player, x, y, hp: 1000, maxHp: 1000, ap: 2, status: {}, items: {}, types: ['human'], race: 'grey', name: id }, o || {}); state.units.push(u); return u; };
    return { D, state, logs, mk, g: n => vm.runInContext(n, D) };
}

test('PLACE: the story seat only, a legal tile, the item and 1 AP, one a turn; a new door folds an empty one', () => {
    const B = board(); const a = B.mk('a', 1, 1, 1, { items: { captureDoor: 2, captureDoor3: 1 } }); B.mk('e', 2, 6, 6);
    const place = B.g('captureDoorPlace'), check = B.g('captureDoorPlaceCheck');
    assert.equal(check(a, 1, 1, 'captureDoor'), 'tile', 'never the placer\'s own tile');
    assert.equal(check(a, 6, 6, 'captureDoor'), 'tile', 'out of reach');
    assert.equal(check(a, 1, 3, 'healPotion'), 'item');
    const d = place(a, 1, 3, 'captureDoor');
    assert.ok(d && d.kind === 'capture' && d.open && d.fixed && d.pairId === d.id && d.hp === 3 && d.tier === 1);
    assert.equal(a.items.captureDoor, 1); assert.equal(a.ap, 1);
    assert.equal(check(a, 2, 2, 'captureDoor'), 'once', 'one door a turn');
    assert.equal(B.g('doorTwin')(d), null, 'a capture door has no twin');
    assert.equal(B.g('doorTeamPairs')(1).length, 0, 'it never counts against the agent\'s pairs');
    B.state.round = 2; a.ap = 2;
    const d3 = place(a, 2, 2, 'captureDoor3');
    assert.ok(d3 && d3.hp === 5 && d3.tier === 3);
    assert.equal(B.state.doors.filter(x => x.kind === 'capture').length, 1, 'perPlayer 1: the first folded');
    const e = B.state.units.find(u => u.id === 'e'); e.items = { captureDoor: 1 }; e.x = 5; e.y = 5;
    assert.equal(check(e, 5, 3, 'captureDoor'), 'seat', 'enemies never capture the party (the user)');
    const off = board({ story: false }); const b = off.mk('b', 1, 1, 1, { items: { captureDoor: 1 } });
    assert.equal(off.g('captureDoorPlaceCheck')(b, 1, 3, 'captureDoor'), 'story', 'outside a story fight');
    const on = board({ online: true }); const c = on.mk('c', 1, 1, 1, { items: { captureDoor: 1 } });
    assert.equal(on.g('captureDoorPlaceCheck')(c, 1, 3, 'captureDoor'), 'story', 'never online');
});

test('TAKE: an enemy arriving is HELD under the seal time; never a friend, a flyer, a door-immune unit or one in its grace', () => {
    const B = board(); const a = B.mk('a', 1, 1, 1, { items: { captureDoor: 1 } });
    const e = B.mk('e', 2, 5, 5, { hp: 400 }); const f = B.mk('f', 2, 6, 6); const ally = B.mk('b', 1, 0, 0);
    const d = B.g('captureDoorPlace')(a, 1, 3, 'captureDoor');
    const take = B.g('captureDoorTake'), can = B.g('captureDoorCanTake');
    assert.equal(can(d, ally), false, 'a friend walks through its own door');
    assert.equal(can(d, Object.assign({}, e, { flying: true })), false, 'a flyer in the air');
    assert.equal(can(d, Object.assign({}, e, { passives: { doorImmune: true } })), false, 'the Keyholder');
    assert.equal(can(d, Object.assign({}, e, { _captureGraceUntil: 1 })), false, 'the grace');
    e.x = 1; e.y = 3;
    assert.equal(take(d, e, 'displaced'), true);
    assert.equal(d.held.unitId, 'e'); assert.equal(d.held.seal, 2, '≤ 50 % HP → 2 rounds');
    assert.equal(e.status.captured, 99); assert.equal(e.ap, 0); assert.equal(e._captureDoorId, d.id);
    assert.equal(can(d, f), false, 'a holding door takes nobody else');
    assert.equal(B.g('captureDoorPlaceCheck')(a, 2, 2, 'captureDoor'), 'none');
});

test('HOLD → SEAL: the tick counts down, the seal takes the body off the board, a record rides state.captures', () => {
    const B = board(); const a = B.mk('a', 1, 1, 1, { items: { captureDoor: 1 } });
    const e = B.mk('e', 2, 5, 5); B.mk('f', 2, 6, 6);
    const d = B.g('captureDoorPlace')(a, 1, 3, 'captureDoor'); e.x = 1; e.y = 3; B.g('captureDoorTake')(d, e);
    assert.equal(d.held.seal, 3);
    const tick = B.g('captureDoorHoldTick');
    assert.equal(tick(), 0); assert.equal(d.held.seal, 2);
    assert.equal(tick(), 0); assert.equal(d.held.seal, 1);
    assert.equal(tick(), 1, 'sealed');
    assert.ok(!B.state.units.includes(e), 'off state.units'); assert.ok(B.state.sealedUnits.includes(e));
    assert.equal(e._sealed, true); assert.equal(e.status.sealed, 99); assert.equal(e.status.captured, undefined);
    assert.equal(B.state.doors.length, 0, 'the door folds away');
    assert.deepEqual(JSON.parse(JSON.stringify(B.state.captures.map(c => [c.unitId, c.player, c.race, c.tier]))), [['e', 1, 'grey', 1]]);
});

test('A LONE ENEMY SEALS (the user): nobody left to come → the door seals at the round\'s end whatever the pips say', () => {
    const B = board(); const a = B.mk('a', 1, 1, 1, { items: { captureDoor: 1 } });
    const e = B.mk('e', 2, 5, 5);
    const d = B.g('captureDoorPlace')(a, 1, 3, 'captureDoor'); e.x = 1; e.y = 3; B.g('captureDoorTake')(d, e);
    assert.equal(B.g('captureDoorHoldTick')(), 1);
    assert.ok(B.logs.some(l => /nobody came/.test(l)));
});

test('BREAK: the allies\' hits break the door — the captive comes out Staggered with a grace; the owner cannot hit it', () => {
    const B = board(); const a = B.mk('a', 1, 1, 1, { items: { captureDoor: 1 } });
    const e = B.mk('e', 2, 5, 5); const f = B.mk('f', 2, 2, 4);
    const d = B.g('captureDoorPlace')(a, 1, 3, 'captureDoor'); e.x = 1; e.y = 3; B.g('captureDoorTake')(d, e);
    const hit = B.g('damageDoorAt');
    assert.equal(hit(1, 3, a), false, 'the owner\'s own door');
    hit(1, 3, f); hit(1, 3, f); assert.equal(d.hp, 1); assert.equal(e.status.captured, 99);
    hit(1, 3, f);
    assert.equal(B.state.doors.length, 0); assert.equal(e.status.captured, undefined, 'free');
    assert.equal(e.status.stagger, 1); assert.equal(e._captureGraceUntil, 3, 'round 1 + a grace of 2');
    assert.ok(B.state.units.includes(e) && e.x === 1 && e.y === 3, 'the body was on the tile all along');
    const d2 = (a.ap = 2, B.state.round = 2, a.items.captureDoor = 1, B.g('captureDoorPlace')(a, 2, 2, 'captureDoor'));
    e.x = 5; e.y = 5; assert.ok(d2, 'a fresh door'); assert.equal(B.g('captureDoorCanTake')(d2, e), false, 'the grace holds');
});

test('THE END: a win seals every held door; a loss frees every captive and captures nothing', () => {
    const W = board(); const a = W.mk('a', 1, 1, 1, { items: { captureDoor: 1 } }); const e = W.mk('e', 2, 5, 5); W.mk('f', 2, 6, 6);
    { const d = W.g('captureDoorPlace')(a, 1, 3, 'captureDoor'); e.x = 1; e.y = 3; W.g('captureDoorTake')(d, e); }
    assert.equal(W.g('captureMatchEnd')(1).length, 1); assert.equal(e._sealed, true);
    const L = board(); const b = L.mk('a', 1, 1, 1, { items: { captureDoor: 1 } }); const x = L.mk('x', 2, 5, 5); L.mk('y', 2, 6, 6);
    { const d = L.g('captureDoorPlace')(b, 1, 3, 'captureDoor'); x.x = 1; x.y = 3; L.g('captureDoorTake')(d, x); }
    assert.equal(L.g('captureMatchEnd')(2).length, 0); assert.equal(x.status.captured, undefined); assert.ok(!x._sealed); assert.equal(L.state.doors.length, 0);
});

test('THE SOURCE SITES: the chain step, the walk stop, the realm shield, the held-body swing, the counts, the tick, the end, the commit, the resets', () => {
    const chain = between(BT, '        function resolveTileArrival(unit, opts = {}) {', '                // ── E · THE ZONES');
    assert.ok(chain.includes("if (unit._sealed || (unit.status && unit.status.captured > 0)) return 0;"), 'a held body reacts to nothing');
    assert.ok(/D · THE FUSES[\s\S]*D′ · THE ONE-WAY DOOR[\s\S]*captureDoorTake\(_cd, unit, via\)/.test(chain), 'D′ after the fuses');
    assert.ok(between(BT, '        function getPathPickupEvent(unit, x, y) {', '        function updateSmokeZoneCloak').includes("if (_cd && captureDoorCanTake(_cd, unit)) return { kind: 'capture', x, y };"), 'the walk stops on the door');
    assert.ok(BT.includes("if (unit && (unitHasStatus(unit, 'captured') || unitHasStatus(unit, 'sealed'))) return true;"), 'the realm shield: no hit, no heal');
    assert.ok(BT.includes("unitHasStatus(target, 'captured') && captureDoorAt(x, y) && captureDoorAt(x, y).owner !== unit.player) target = null;"), 'a swing at a held body hits the door');
    assert.ok(BT.includes('!u.dead && !u._dying && !u._sealed).length'), 'the wipeout count forgets a sealed unit');
    assert.ok(/if \(captureDoorHoldTick\(\) > 0\) \{ checkWin\(\); if \(state\.winner\) return; \}\n\s*state\.round \+= 1;/.test(BT), 'the tick at the round\'s end');
    assert.ok(/_finalizing = true;\n\s*try \{ captureMatchEnd\(state\.winner\); \}/.test(BT), 'finalizeMatch settles the doors first');
    assert.ok(BT.includes("const cr = hqCaptureEnlist(p, caps.map(") && BT.includes('for (const u of (state.sealedUnits || [])) {'), 'the commit enlists and the pool pays half');
    assert.equal((BT.match(/state\.captures = \[\]; state\.sealedUnits = \[\];/g) || []).length, 4, 'every door reset clears them');
    assert.ok(ST.includes('captures: [],') && ST.includes('sealedUnits: [],'), 'the state literal');
});
