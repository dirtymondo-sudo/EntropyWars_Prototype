'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Execute the production closure. Only damage/value dependencies are replaced;
// movement goals, A*, beam geometry and target selection remain production code.
const source = fs.readFileSync(process.env.EW_AI_TEST_SOURCE || path.join(__dirname, 'ai.js'), 'utf8');
function harness(w = 8, h = 8) {
    const blocked = new Set(), heights = new Map(), edges = new Set();
    const key = (x, y) => `${x},${y}`;
    const g = {
        state: { round: 5, units: [] }, bw: () => w, bh: () => h,
        isInside: (x, y) => x >= 0 && y >= 0 && x < w && y < h,
        unitCanTraverse: (u, x, y) => !blocked.has(key(x, y)) || !!u.flying,
        isTerrainPassable: (x, y) => !blocked.has(key(x, y)),
        getHeightAt: (x, y) => heights.get(key(x, y)) || 0,
        canFly: u => !!u.flying, getUnitJumpClimb: () => 1,
        objectBlocksEdge: (x, y, nx, ny) => edges.has(`${key(x,y)}>${key(nx,ny)}`),
        getEffectiveRange: () => 1, getEffectiveSpellRange: (u, sp) => sp.range,
        unitHasStatus: () => false, isRangeBlockedByTerrain: () => false,
        posKey: key, TargetQuery: { canAfford: () => true },
    };
    const context = { window: { GAME: g }, console: { log() {}, warn() {} },
        unitIsPhasing: u => !!u.phasing, getActiveMultiplayerMode: () => ({ id: 'tdm' }) };
    vm.createContext(context);
    const end = source.lastIndexOf('})();');
    assert.ok(end > 0);
    vm.runInContext(source.slice(0, end) + `
        scoreOffensiveHit = (g, u, e, sp) => ({ val: sp ? 100 : 0 });
        tileDangerCost = () => 0;
        isProtected = (g, e) => !!e.protected;
        getTargetPriority = () => 1;
        window.testAI = { pickMoveGoal, findWaypoint, jointMoveActionSearch, findSpellTarget, scoreSpell };
    ` + source.slice(end), context);
    return { g, blocked, heights, edges, ai: context.window.testAI };
}
function vision(enemies = []) {
    return { winState: { phase: 'even', roundUrgency: 0 }, visibleEnemies: enemies,
        visibleHourglasses: [], allies: [], closestEnemyDist: Infinity,
        tactical: { shouldEngage: true } };
}

for (const size of [8, 20]) {
    for (const player of [1, 2]) test(`AI-S04: ${size}x${size}, seat ${player}, uses actual board center`, () => {
        const { g, ai } = harness(size, size);
        // Stale legacy dimensions must not override the active board.
        g.state.mapCols = 15; g.state.mapRows = 8;
        const u = { id: 'u', player, x: player === 1 ? 0 : size - 1, y: player === 1 ? 0 : size - 1 };
        const goal = ai.pickMoveGoal(u, vision());
        assert.equal(goal.reason, 'advance_to_mid');
        assert.equal(goal.x, Math.floor(size / 2));
        assert.equal(goal.y, Math.floor(size / 2));
    });
}

test('AI-S05: clear, blocked and reopened route all recompute within one round', () => {
    const { ai, blocked } = harness(5, 3);
    const u = { id: 'u', x: 0, y: 1 };
    assert.equal(ai.findWaypoint(u, 4, 1), null);
    for (let y = 0; y < 3; y++) blocked.add(`2,${y}`);
    assert.equal(ai.findWaypoint(u, 4, 1), false);
    blocked.delete('2,0');
    assert.ok(ai.findWaypoint(u, 4, 1));
    blocked.clear();
    assert.equal(ai.findWaypoint(u, 4, 1), null);
});

test('AI-S05: flight gain and loss invalidate an unreachable route at the same round', () => {
    const { ai, blocked } = harness(5, 3);
    const u = { id: 'u', x: 0, y: 1 };
    for (let y = 0; y < 3; y++) blocked.add(`2,${y}`);
    assert.equal(ai.findWaypoint(u, 4, 1), false);
    u.flying = true;
    assert.equal(ai.findWaypoint(u, 4, 1), null);
    u.flying = false;
    assert.equal(ai.findWaypoint(u, 4, 1), false);
});

test('AI-S05: a previously successful detour is not reused after its gap closes', () => {
    const { ai, blocked } = harness(5, 3);
    const u = { id: 'u', x: 0, y: 1 };
    blocked.add('2,1'); blocked.add('2,2');
    assert.ok(ai.findWaypoint(u, 4, 1));
    blocked.add('2,0');
    assert.equal(ai.findWaypoint(u, 4, 1), false);
});

test('AI-S05: new match with reused round/unit IDs does not inherit old route failure', () => {
    const { ai, g, blocked } = harness(5, 3);
    const u = { id: 'u', x: 0, y: 1 };
    for (let y = 0; y < 3; y++) blocked.add(`2,${y}`);
    assert.equal(ai.findWaypoint(u, 4, 1), false);
    g.state = { round: 5, units: [] };
    blocked.clear();
    assert.equal(ai.findWaypoint({ ...u }, 4, 1), null);
});

test('AI-S05: terrain height changes are reflected without advancing the round', () => {
    const { ai, heights } = harness(5, 3);
    const u = { id: 'u', x: 0, y: 1 };
    assert.equal(ai.findWaypoint(u, 4, 1), null);
    for (let y = 0; y < 3; y++) heights.set(`2,${y}`, 3);
    assert.equal(ai.findWaypoint(u, 4, 1), false);
    heights.clear();
    assert.equal(ai.findWaypoint(u, 4, 1), null);
});

test('edge walls trigger pathfinding and phasing changes its result', () => {
    const { ai, edges } = harness(5, 3);
    const u = { id: 'u', x: 0, y: 1 };
    for (let y = 0; y < 3; y++) edges.add(`1,${y}>2,${y}`);
    assert.equal(ai.findWaypoint(u, 4, 1), false);
    u.phasing = true;
    assert.equal(ai.findWaypoint(u, 4, 1), null);
    u.phasing = false;
    edges.delete('1,0>2,0');
    assert.ok(ai.findWaypoint(u, 4, 1));
});

for (const kind of ['line', 'linePush']) {
    test(`AI-S06: ${kind} rejects off-ray move and chooses a castable diagonal`, () => {
        const { ai } = harness();
        const sp = { id: 'beam', kind, range: 3, dmg: 100 };
        const u = { id: 'u', player: 1, x: 0, y: 0, z: 0, mp: 100, spells: [sp] };
        const enemy = { id: 'e', player: 2, x: 4, y: 4 };
        const v = vision([enemy]);
        assert.equal(ai.jointMoveActionSearch(u, [{ x: 2, y: 3, z: 0 }], v), null);
        const best = ai.jointMoveActionSearch(u, [{ x: 2, y: 3, z: 0 }, { x: 1, y: 1, z: 0 }], v);
        assert.equal(best.x, 1); assert.equal(best.y, 1);
        const moved = { ...u, x: best.x, y: best.y };
        assert.equal(ai.findSpellTarget(moved, sp, v), enemy);
        assert.ok(ai.scoreSpell(moved, sp, enemy, v) > 0);
        assert.equal(u.x, 0); assert.equal(u.y, 0);
    });
}

test('beam plans stop at terrain, respect range cap, and retain obstacle-destroying behavior', () => {
    const { ai, blocked } = harness();
    const sp = { id: 'beam', kind: 'line', range: 3, dmg: 100 };
    const u = { id: 'u', x: 0, y: 0, mp: 100, spells: [sp] };
    const t = { x: 1, y: 1, z: 0 }, enemy = { id: 'e', x: 4, y: 1 };
    const v = vision([enemy]);
    blocked.add('2,1');
    assert.equal(ai.jointMoveActionSearch(u, [t], v), null);
    sp.destroysObstacles = true;
    assert.ok(ai.jointMoveActionSearch(u, [t], v));
    sp.range = 2;
    assert.equal(ai.jointMoveActionSearch(u, [t], v), null);
});

test('beam LOS uses hypothetical elevation and honors ignoresLineOfSight', () => {
    const { ai, g } = harness();
    const sp = { id: 'beam', kind: 'line', range: 3, dmg: 100 };
    const u = { id: 'u', x: 0, y: 0, z: 0, mp: 100, spells: [sp] };
    const v = vision([{ id: 'e', x: 4, y: 1 }]);
    g.isRangeBlockedByTerrain = (x, y, tx, ty, z) => z !== 3;
    assert.equal(ai.jointMoveActionSearch(u, [{ x: 1, y: 1, z: 0 }], v), null);
    assert.ok(ai.jointMoveActionSearch(u, [{ x: 1, y: 1, z: 3 }], v));
    sp.ignoresLineOfSight = true;
    assert.ok(ai.jointMoveActionSearch(u, [{ x: 1, y: 1, z: 0 }], v));
});

test('ordinary damage spells retain off-ray targeting; protected or unseen enemies add no shot', () => {
    const { ai } = harness();
    const u = { id: 'u', x: 0, y: 0, mp: 100, spells: [{ id: 'shot', kind: 'damage', range: 4 }] };
    const tiles = [{ x: 2, y: 3 }], e = { id: 'e', x: 4, y: 4 };
    assert.ok(ai.jointMoveActionSearch(u, tiles, vision([e])));
    e.protected = true;
    assert.equal(ai.jointMoveActionSearch(u, tiles, vision([e])), null);
    assert.equal(ai.jointMoveActionSearch(u, tiles, vision()), null);
});
