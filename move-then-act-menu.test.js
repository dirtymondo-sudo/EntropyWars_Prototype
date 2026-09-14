/* MOVE + ACT ON THE TILE MENU (2026-09-14): the tile quick menu's structure
   attack rows (Cube / turret / object / seed / tree) and the Inspect row
   offer a one-step "walk into reach, then act" plan like the enemy-unit
   menu always has. Runs the production findInspectApproachTile /
   _inspectMoveBudget (battle.js) in a vm sandbox on a controlled board,
   then source-guards the hud rows, the clickTile branch and the hover. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const battle = fs.readFileSync(path.join(__dirname, 'battle.js'), 'utf8');
const hud = fs.readFileSync(path.join(__dirname, 'hud.js'), 'utf8');

function between(src, a, b) {
    const i = src.indexOf(a);
    assert.ok(i >= 0, 'missing anchor ' + a);
    const j = src.indexOf(b, i);
    assert.ok(j > i, 'missing end anchor ' + b);
    return src.slice(i, j);
}

// A 6×6 flat board; a wall column at (2,2) blocks sight straight through it.
function makeCtx(unit, opts) {
    const o = opts || {};
    const ctx = {
        state: { units: [unit] },
        UNIT_MAX_MOVES: 2,
        AP_COST_ACTION: 1,
        canUnitAct: () => true,
        canUnitMove: () => true,
        getEffectiveInspect: () => o.reach ?? 1,
        getMoveTiles: () => (o.moveTiles || []).map(t => Object.assign({ z: 0 }, t)),
        unitAt: (x, y) => (o.occupied || []).some(t => t.x === x && t.y === y) ? { id: 'blocker' } : null,
        isRangeBlockedByTerrain: (fx, fy, tx, ty) => (o.blocked || []).some(b => b.fx === fx && b.fy === fy && b.tx === tx && b.ty === ty),
        window: {},
        console,
    };
    vm.createContext(ctx);
    vm.runInContext(between(battle, '        function _inspectMoveBudget(', '        function _moveThenInspect('), ctx);
    return ctx;
}

test('inspect approach: a tile one step past the scan reach is reached by ONE walk step', () => {
    const u = { id: 'u', player: 1, x: 0, y: 0, z: 0, ap: 2, movesThisTurn: 0 };
    const ctx = makeCtx(u, { reach: 1, moveTiles: [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }] });
    const r = vm.runInContext('findInspectApproachTile(state.units[0], 2, 2)', ctx);
    assert.ok(r, 'an approach tile');
    assert.equal(r.x + ',' + r.y, '1,1');
    // the probe restored the unit
    assert.equal(u.x + ',' + u.y, '0,0');
});

test('inspect approach: prefers the step that reaches from farthest away (safety), never an occupied tile', () => {
    const u = { id: 'u', player: 1, x: 0, y: 0, z: 0, ap: 2, movesThisTurn: 0 };
    const ctx = makeCtx(u, { reach: 2, moveTiles: [{ x: 1, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 0 }], occupied: [{ x: 1, y: 0 }] });
    const r = vm.runInContext('findInspectApproachTile(state.units[0], 3, 2)', ctx);
    assert.ok(r);
    // (1,0) is occupied; (2,0) → Chebyshev 2 reaches, Manhattan 3; (1,1) → Chebyshev 2, Manhattan 3.
    // Both reach at the same Manhattan; first wins on a tie → (1,1).
    assert.equal(r.x + ',' + r.y, '1,1');
});

test('inspect approach: LOS from the STEP tile is judged, not from where the unit stands', () => {
    const u = { id: 'u', player: 1, x: 0, y: 0, z: 0, ap: 2, movesThisTurn: 0 };
    const ctx = makeCtx(u, { reach: 1, moveTiles: [{ x: 1, y: 1 }, { x: 1, y: 0 }],
        blocked: [{ fx: 1, fy: 1, tx: 2, ty: 1 }] });
    const r = vm.runInContext('findInspectApproachTile(state.units[0], 2, 1)', ctx);
    assert.ok(r);
    assert.equal(r.x + ',' + r.y, '1,0');
});

test('inspect approach: no plan once the unit has moved (the second move drains all AP), with 1 AP, or with no scan', () => {
    const moved = { id: 'u', player: 1, x: 0, y: 0, z: 0, ap: 3, movesThisTurn: 1 };
    assert.equal(vm.runInContext('findInspectApproachTile(state.units[0], 2, 2)',
        makeCtx(moved, { moveTiles: [{ x: 1, y: 1 }] })), null);
    const poor = { id: 'u', player: 1, x: 0, y: 0, z: 0, ap: 1, movesThisTurn: 0 };
    assert.equal(vm.runInContext('findInspectApproachTile(state.units[0], 2, 2)',
        makeCtx(poor, { moveTiles: [{ x: 1, y: 1 }] })), null);
    const blind = { id: 'u', player: 1, x: 0, y: 0, z: 0, ap: 2, movesThisTurn: 0 };
    assert.equal(vm.runInContext('findInspectApproachTile(state.units[0], 2, 2)',
        makeCtx(blind, { reach: 0, moveTiles: [{ x: 1, y: 1 }] })), null);
});

test('inspect approach: jump / take-off tiles folded into the walk set are skipped', () => {
    const u = { id: 'u', player: 1, x: 0, y: 0, z: 0, ap: 2, movesThisTurn: 0 };
    const ctx = makeCtx(u, { reach: 1, moveTiles: [{ x: 1, y: 1, _jump: true }, { x: 1, y: 1, _takeoff: true }] });
    assert.equal(vm.runInContext('findInspectApproachTile(state.units[0], 2, 2)', ctx), null);
});

test('source: the tile menu routes every structure attack row through the approach helper', () => {
    const tile = between(hud, 'function _computeTileActions(', '\nfunction _ensureDescBarEl');
    assert.ok(tile.includes('const _objAtkRow = (id, label, canNow'), 'the shared row builder');
    assert.ok(tile.includes('findAttackApproachTile(actingUnit, tx, ty)'), 'the attack approach probe');
    assert.ok(tile.includes('_moveThenAttack(actingUnit, mt, tx, ty, _tileZ)'), 'the walk-then-swing');
    for (const id of ['attack:tower', 'attack:turret', 'attack:deploy', 'attack:seed', 'attack:tree']) {
        assert.ok(tile.includes("_objAtkRow('" + id + "'"), id + ' rides the helper');
    }
    // no structure row fires a bare in-range-only attack any more
    assert.equal((tile.match(/handler: canAtk \? \(\) => _fireObjectAttack/g) || []).length, 0);
});

test('source: the tile menu Inspect row measures Chebyshev reach + LOS and offers the walk-then-scan', () => {
    const tile = between(hud, 'function _computeTileActions(', '\nfunction _ensureDescBarEl');
    const insp = between(tile, "id: 'inspect', label: 'Inspect'", '});');
    assert.ok(tile.includes('const _inspDist = Math.max(Math.abs(actingUnit.x - tx), Math.abs(actingUnit.y - ty))'));
    assert.ok(tile.includes('findInspectApproachTile(actingUnit, tx, ty)'));
    assert.ok(insp.includes('_moveThenInspect(actingUnit, _inspMt, tx, ty)'));
    assert.ok(insp.includes('moveTile: inInspect ? null : _inspMt'));
});

test('source: tile blades wear the ↳ MOVE note and the approach arrow on hover', () => {
    const blades = between(hud, 'function _hrlgTileBlades(', '\n\n/* One-click structure attack');
    assert.ok(blades.includes("const isApproach = !!a.moveTile && a.id !== 'moveTowards'"));
    assert.ok(blades.includes("note: (isApproach && a.available) ? '↳ ' + (a.moveTile._jump ? 'JUMP' : 'MOVE') : null"));
    assert.ok(blades.includes('_drawSpellApproachPreview(actingUnit, a.moveTile, tx, ty)'));
    assert.ok(blades.includes('_clearSpellApproachPreview()'));
});

test('source: clickTile and the hover in inspect mode route past-reach tiles into move-then-inspect', () => {
    assert.ok(battle.includes("if (!_inReach && _tryMoveThenInspect(actingUnit, x, y)) return;"));
    assert.ok(battle.includes("if (!_inReach) { _inspectApproachHoverPreview(unit, x, y); return false; }"));
    const mti = between(battle, '        function _moveThenInspect(', '        function _tryMoveThenInspect(');
    assert.ok(mti.includes("state.actionMode = 'inspect'"), 're-arms inspect mode before the scan');
    assert.ok(mti.includes('doInspect(unit, tx, ty)'), 'calls the (online-wrapped) engine verb');
    assert.ok(mti.includes('result === undefined'), 'a bare refusal releases the executing latch');
});
