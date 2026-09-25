// capture-ai.test.js — THE ONE-WAY DOOR, Phase 3 (CAPTURE_PLAN.md §4, 2026-09-25): the natives' AI and the party's
// capture door. ai.js runs in a vm over a stubbed GAME (the ai-chivalry harness's shape) with data.js's real
// CAPTURE_RULES / captureSealSteps: (1) AVOID — ending on an enemy door costs 260 × (1 + the seal steps lost), doubled
// for a lone body, and a push's reach off it costs less; (2) never WALK onto or THROUGH one (the move tiles drop every
// tile whose engine path crosses it, and the execute gate refuses the walk); (3) never be FED — a teleport / dash /
// swap landing on a door is refused, a shove whose collision slides an ally in is priced; (4) FREE the captive — a
// swing at the door holding one of ours is a candidate, worth more the fewer seal rounds are left, from where it
// stands, from a move×attack tile, and as a move goal. Plus the source sites. Repo-only.
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const data = require('./load-data').loadGameData();
const AI = fs.readFileSync(path.join(__dirname, 'ai.js'), 'utf8');

function setup() {
    const state = { round: 3, units: [], doors: [], turrets: [], _deployedObjects: [], mirrors: [], hourglasses: [], bombs: [], traps: [] };
    const logs = [], queued = [];
    const mk = (id, player, x, y, o) => { const u = Object.assign({ id, player, x, y, z: 0, hp: 400, maxHp: 400, mp: 50, ap: 2, atk: 60, def: 20, mdef: 20, range: 1, move: 3, status: {}, spells: [], types: ['human'] }, o || {}); state.units.push(u); return u; };
    const door = (x, y, o) => { const d = Object.assign({ id: 'cap_' + x + '_' + y, kind: 'capture', x, y, z: 0, hp: 3, maxHp: 3, owner: 1, ownerId: 'hero', open: true, fixed: true, tier: 1, type: null, held: null, sealed: null }, o || {}); state.doors.push(d); return d; };
    const unitHasStatus = (u, k) => !!(u && u.status && (u.status[k] | 0) > 0);
    const W = 12, H = 12;
    // an L-shaped walk: along x first, then y — the engine path the move gate reads
    const path_ = (u, tx, ty) => { const p = []; let x = u.x, y = u.y; while (x !== tx) { x += Math.sign(tx - x); p.push({ x, y, z: 0 }); } while (y !== ty) { y += Math.sign(ty - y); p.push({ x, y, z: 0 }); } return p; };
    const moveTiles = u => { const out = []; const r = u.move || 3; for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { if (!dx && !dy) continue; if (Math.abs(dx) + Math.abs(dy) > r) continue; const x = u.x + dx, y = u.y + dy; if (x < 0 || y < 0 || x >= W || y >= H) continue; if (state.units.some(o => !o.dead && o.x === x && o.y === y)) continue; out.push({ x, y, z: 0 }); } return out; };
    const ctx = {
        state, console: { log() {}, warn() {} }, Math, Set, Map, Object, JSON, Array, Number, String, Infinity,
        STATUS_DEFS: data.STATUS_DEFS, CAPTURE_RULES: data.CAPTURE_RULES, captureSealSteps: data.captureSealSteps,
        getEffectiveArmor: (u, t) => t === 'magic' ? (u.mdef || 0) : (u.def || 0),
        getTypeDamageMultiplier: () => 1, getStatusDamageTakenMultiplier: () => 1,
    };
    ctx.window = {
        captureDoorCanTake: (d, u) => !!d && !d.held && !d.sealed && d.hp > 0 && d.owner !== u.player && !u.flying && !((u._captureGraceUntil | 0) >= state.round) && !unitHasStatus(u, 'captured'),
        setTimeout: fn => queued.push(fn),
    };
    const g = {
        state, STATUS_DEFS: data.STATUS_DEFS, unitHasStatus,
        getEffectiveRange: u => u.range || 1, getEffectiveMove: u => u.move || 3, getMoveRangeThisTurn: u => u.move || 3,
        getEffectiveSpellRange: (u, s) => s.range || 1, isRangeBlockedByTerrain: () => false,
        getAttackArc: () => 'front', getFacingDamageMult: () => 1, getEvasionChance: () => 0,
        getEffectiveAttackBonus: () => 0, getHourglassPower: () => 0, getTerrainAt: () => 'grass', getHeightAt: () => 0,
        getHostileUnits: p => state.units.filter(u => !u.dead && u.player !== p),
        aliveUnitsFor: p => state.units.filter(u => !u.dead && u.player === p),
        _isFFA: () => false, enemyOf: p => 3 - p, bw: () => W, bh: () => H, posKey: (x, y) => x + ',' + y,
        canUnitMove: () => true, findMovePath: path_,
        TargetQuery: { moveTiles, apCost: s => s.apCost || 1, canAfford: () => true },
        AP_COST_ACTION: 1,
        doMove: (u, x, y) => { logs.push({ move: [x, y] }); u.x = x; u.y = y; return 0; },
        doAttack: (u, x, y) => { logs.push({ attack: [x, y] }); return 1; },
        queueComputerAction: fn => queued.push(fn), finishComputerAction: () => logs.push('finish'),
        maybeTriggerComputerTurn: () => logs.push('retry'),
    };
    ctx.window.GAME = g;
    vm.createContext(ctx);
    const end = AI.lastIndexOf('})();');
    vm.runInContext(AI.slice(0, end) + '\nwindow.aiCap = { _capHazardAt, _aiMoveTiles, _capWalkFeeds, _capSpellFeeds, _capDoorAttacks, _capFreeValue, _capHeldAllyDoors, aiHazardPenaltyAt, jointMoveActionSearch, pickMoveGoal, executeAction, CAP_TUNE };\n' + AI.slice(end), ctx);
    const vis = (unit, extra) => Object.assign({ visibleEnemies: g.getHostileUnits(unit.player), allies: g.aliveUnitsFor(unit.player).filter(a => a.id !== unit.id), closestEnemy: g.getHostileUnits(unit.player)[0] || null, effRange: unit.range || 1, winState: { phase: 'even', scorePolicy: 'normal', roundUrgency: 0, enemyDeadCount: 0 }, tactical: { shouldEngage: true, advantage: 0 }, visibleHourglasses: [], threatFn: () => ({ totalDmg: 0, count: 0 }), enemyTower: null, ownTower: null }, extra || {});
    return { ctx, g, state, logs, queued, mk, door, vis, A: ctx.window.aiCap };
}

test('AVOID: ending on an enemy capture door costs 260 × (1 + the seal steps lost); a lone body pays double; a push away costs less', () => {
    const h = setup();
    h.mk('hero', 1, 0, 0);
    const n = h.mk('native', 2, 5, 5); h.mk('buddy', 2, 9, 9);
    h.door(5, 7);
    assert.equal(h.A._capHazardAt(h.g, n, 5, 7), 260, 'a healthy body: the base price');
    n.hp = 90;   // ≤ 25 % — two steps off the seal time
    assert.equal(h.A._capHazardAt(h.g, n, 5, 7), 260 * 3, 'a hurt body seals faster — it fears the door more');
    n.hp = 400;
    const lone = setup(); lone.mk('hero', 1, 0, 0); const solo = lone.mk('native', 2, 5, 5); lone.door(5, 7);
    assert.equal(lone.A._capHazardAt(lone.g, solo, 5, 7), 520, 'the last free body seals at the round\'s end');
    // beside it: no pusher on the board → the soft price; a pusher → the full one
    const beside = h.A._capHazardAt(h.g, n, 5, 6);
    assert.ok(beside > 0 && beside < 60, 'one tile off, nobody can shove: ' + beside);
    h.state.units[0].spells = [{ kind: 'linePush', pushDistance: 2 }];
    assert.equal(h.A._capHazardAt(h.g, n, 5, 6), 60, 'one tile off a door a hostile can shove us into');
    assert.equal(h.A._capHazardAt(h.g, n, 5, 5), 20, 'two tiles off, in line');
    assert.equal(h.A._capHazardAt(h.g, n, 6, 5), 0, 'off the line');
    // never its own team's door, never a held door, never a body in its grace
    assert.equal(h.A._capHazardAt(h.g, h.state.units[0], 5, 7), 0, 'the party walks its own door');
    n._captureGraceUntil = 4; assert.equal(h.A._capHazardAt(h.g, n, 5, 7), 0, 'the grace'); n._captureGraceUntil = 0;
    h.state.doors[0].held = { unitId: 'buddy', seal: 2 }; assert.equal(h.A._capHazardAt(h.g, n, 5, 7), 0, 'a held door takes nobody else');
    h.state.doors[0].held = null;
    assert.equal(h.A.aiHazardPenaltyAt(n, 5, 7), 260, 'aiHazardPenaltyAt carries it (tileDangerCost / safety / ranking read that)');
    h.ctx.window.EW_AI_NO_CAPTURE = true; assert.equal(h.A._capHazardAt(h.g, n, 5, 7), 0, 'the kill-switch');
});

test('WALK: the move tiles drop the door and every tile whose engine path crosses it; the execute gate refuses the walk', () => {
    const h = setup(); h.mk('hero', 1, 0, 0);
    const n = h.mk('native', 2, 5, 5, { move: 3 }); h.mk('buddy', 2, 11, 11);
    const all = h.g.TargetQuery.moveTiles(n).length;
    assert.equal(h.A._aiMoveTiles(h.g, n).length, all, 'no door — the engine list as is');
    h.door(6, 5);
    const tiles = h.A._aiMoveTiles(h.g, n);
    const has = (x, y) => tiles.some(t => t.x === x && t.y === y);
    assert.ok(!has(6, 5), 'never onto the door');
    assert.ok(!has(7, 5) && !has(8, 5) && !has(7, 6), 'never THROUGH it (the walk stops on the door)');
    assert.ok(has(4, 5) && has(5, 7) && has(5, 3), 'the rest of the board stays open');
    assert.equal(h.A._capWalkFeeds(h.g, n, 7, 5, 0), true);
    assert.equal(h.A._capWalkFeeds(h.g, n, 5, 7, 0), false);
    h.A.executeAction(n, { type: 'move', x: 7, y: 5, z: 0 }, h.vis(n));
    assert.deepEqual(h.logs, ['retry'], 'the gate refuses the walk and the AI re-thinks');
    assert.equal(n.x, 5);
    h.A.executeAction(n, { type: 'move', x: 5, y: 7, z: 0 }, h.vis(n));
    assert.deepEqual(h.logs.slice(1), [{ move: [5, 7] }, 'finish'], 'a clean walk goes through');
    // the party member walks its own door like floor
    const hero = h.state.units[0]; hero.x = 5; hero.y = 3; hero.move = 3;
    assert.equal(h.A._aiMoveTiles(h.g, hero).length, h.g.TargetQuery.moveTiles(hero).length);
});

test('FED: a landing on a door is refused, a shove that slides an ally in is priced, a clean shove is free', () => {
    const h = setup(); const hero = h.mk('hero', 1, 5, 5);
    const n = h.mk('native', 2, 3, 5); const buddy = h.mk('buddy', 2, 6, 5);
    h.door(7, 5);
    assert.equal(h.A._capSpellFeeds(h.g, n, { kind: 'teleport' }, { x: 7, y: 5 }), Infinity, 'a teleport onto the door');
    assert.equal(h.A._capSpellFeeds(h.g, n, { kind: 'dash' }, { x: 7, y: 5 }), Infinity, 'a dash ending on it');
    assert.equal(h.A._capSpellFeeds(h.g, n, { kind: 'teleport' }, { x: 8, y: 8 }), 0);
    assert.equal(h.A._capSpellFeeds(h.g, n, { kind: 'linePush', pushDistance: 1 }, hero), 220, 'the hero slams the buddy onto the door');
    buddy.y = 9;
    assert.equal(h.A._capSpellFeeds(h.g, n, { kind: 'linePush', pushDistance: 1 }, hero), 0, 'nobody in the lane');
    assert.equal(h.A._capSpellFeeds(h.g, n, { kind: 'rallyPull' }, null), 0, 'no target — nothing to read');
    n.x = 7; n.y = 6;
    assert.equal(h.A._capSpellFeeds(h.g, n, { kind: 'rallyPull' }, { x: 7, y: 6 }), Infinity, 'a rally pull beside the door drags allies over it');
});

test('FREE: the door holding one of ours is a target — from here, from a move tile, and as a move goal; urgency grows as the seal nears', () => {
    const h = setup(); h.mk('hero', 1, 0, 0);
    const n = h.mk('native', 2, 5, 4, { range: 1 });
    const held = h.mk('captive', 2, 5, 5, { status: { captured: 99 } });
    h.mk('third', 2, 7, 6);   // a second swing in reach: the 2-hit door can fall this round
    const d = h.door(5, 5, { hp: 2, maxHp: 3, held: { unitId: 'captive', seal: 3, total: 3 } });
    const v = h.vis(n);
    assert.deepEqual(Array.from(h.A._capHeldAllyDoors(h.g, n), e => e.ally.id), ['captive']);
    const out = []; h.A._capDoorAttacks(h.g, n, v, out);
    assert.equal(out.length, 1); assert.equal(out[0].target.x + ',' + out[0].target.y, '5,5'); assert.ok(out[0]._captureDoor);
    const s3 = out[0].score;
    d.held.seal = 2; const s2 = h.A._capFreeValue(h.g, n, { door: d, ally: held }, v);
    d.held.seal = 1; const s1 = h.A._capFreeValue(h.g, n, { door: d, ally: held }, v);
    assert.ok(s1 > s2 && s2 > s3 && s3 > 0, `fewer rounds left, more urgent: ${s3} < ${s2} < ${s1}`);
    d.hp = 1; const breakNow = h.A._capFreeValue(h.g, n, { door: d, ally: held }, v);
    assert.ok(breakNow > s1 * 1.5, 'the hit that breaks it is worth most');
    // hopeless: it seals this round and nobody else can reach it — a 3-hit door, one swing
    d.hp = 3; h.state.units.find(u => u.id === 'third').x = 11; h.state.units.find(u => u.id === 'third').y = 11;
    const hopeless = h.A._capFreeValue(h.g, n, { door: d, ally: held }, v);
    assert.ok(hopeless < s1, 'it seals before it can fall — a long shot');
    // not ours: a door holding someone else's body, the party's empty door
    const e = setup(); e.mk('hero', 1, 0, 0); const m = e.mk('native', 2, 5, 4); e.door(5, 5);
    const o2 = []; e.A._capDoorAttacks(e.g, m, e.vis(m), o2);
    assert.equal(o2.length, 1); assert.equal(o2[0].score, e.A.CAP_TUNE.emptyDoorHit, 'an empty door: a low, spare swing');
    // move × attack: from a tile in reach of the door
    const far = setup(); far.mk('hero', 1, 0, 11, { hp: 1 });
    const w = far.mk('native', 2, 5, 1, { move: 3 }); far.mk('captive', 2, 5, 5, { status: { captured: 99 } });
    far.door(5, 5, { held: { unitId: 'captive', seal: 1, total: 3 } });
    far.state.units[0].x = 11; far.state.units[0].y = 11;
    const fv = far.vis(w, { visibleEnemies: [] });
    const j = far.A.jointMoveActionSearch(w, far.A._aiMoveTiles(far.g, w), fv);
    assert.ok(j && Math.abs(j.x - 5) + Math.abs(j.y - 5) === 1, 'the joint search walks up to the door: ' + JSON.stringify(j));
    const goal = far.A.pickMoveGoal(w, fv);
    assert.equal(goal.reason, 'free_captive');
    assert.deepEqual([goal.x, goal.y], [5, 5]);
});

test('source sites: the hazard, the move tiles, the vision, the scorers and the execute gate all read the door', () => {
    const between = (a, b) => { const i = AI.indexOf(a), j = AI.indexOf(b, i); assert.ok(i >= 0 && j > i, a); return AI.slice(i, j); };
    assert.match(between('function aiHazardPenaltyAt(', 'function _faceNearestEnemy('), /_capHazardAt\(g, unit, x, y\)/);
    assert.equal((AI.match(/g\.TargetQuery\.moveTiles\(unit\)/g) || []).length, 2, 'only _aiMoveTiles itself and the human-move match read the raw list');
    assert.match(between('function buildVision(', 'function makeThreatFn('), /unitHasStatus\(a, 'captured'\)/, 'a held ally leaves v.allies');
    assert.match(between('function scoreAttacks(', 'function scoreTowerAttack('), /_capDoorAttacks\(g, unit, v, out\)/);
    assert.match(between('function scoreSpells(', 'function scoreSpell('), /_capSpellFeeds\(g, unit, spell, target\)/);
    assert.match(between('function jointMoveActionSearch(', 'function pickMoveGoal('), /_capFreeValue\(g, unit, h, v\)/);
    assert.match(between('function pickMoveGoal(', 'function findWaypoint('), /'free_captive'/);
    assert.match(between("case 'move':", "case 'guard'") || between("case 'move':", 'break;'), /_capWalkFeeds\(g, unit, action\.x, action\.y, action\.z\)/);
});
