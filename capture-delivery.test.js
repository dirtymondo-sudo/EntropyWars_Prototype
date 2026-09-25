// capture-delivery.test.js — THE ONE-WAY DOOR, Phase 2 THE DELIVERY (CAPTURE_PLAN.md §3, 2026-09-25): the door reaches
// the player's hands and the board. The engine helpers run for real in a vm (battle.js's DOOR block over data.js's
// ITEM_RULES / CAPTURE_RULES): the tuned door's pick, the tile menu's move-then-place step, the look's beats fired
// through window._doorGeom (the comet, the open, the take, the seal, the break, the fold). The menus, the painter, the
// renderer's dress and the VFX registry are source guards. Repo-only.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { loadGameData } = require('./load-data');
const read = f => fs.readFileSync(__dirname + '/' + f, 'utf8');
const BT = read('battle.js'), HUD = read('hud.js'), UI = read('ui.js'), REND = read('three-renderer.js'), VFX = read('three-vfx-effects.js');
const between = (src, a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); assert.ok(i >= 0 && j > i, 'slice ' + a); return src.slice(i, j); };
const DOOR_SRC = between(BT, '        const DOOR_RULES = {', '        function _structureAt(x, y, unit) {');

function board() {
    const D = loadGameData();
    const logs = [], fx = [];
    const state = { round: 1, phase: 'battle', doors: [], units: [], partyBag: { seat: 1, items: {} }, bombs: [], traps: [], _deployedObjects: [] };
    const W = 10, H = 10;
    Object.assign(D, {
        state, logs, fx,
        isInside: (x, y) => x >= 0 && y >= 0 && x < W && y < H,
        unitAt: (x, y) => state.units.find(u => !u.dead && u.x === x && u.y === y) || null,
        getTerrainRule: () => ({ passable: true }), getTerrainAt: () => 'grass', canOccupy: () => true,
        isRangeBlockedByTerrain: () => false, isInVision: () => true, getHeightAt: () => 0,
        _partyBagOn: () => !!(state.partyBag && state.partyBag.items), isOnlineMatch: () => false,
        unitHomePlayer: u => u.player, randInt: () => 7, setUnitFacing: () => {}, _skipVisuals: () => false,
        addLog: m => logs.push(String(m)), coordLabel: (x, y) => x + ',' + y, unitDisplayName: u => u.name || u.id,
        showFloatingTextAtTile: () => {}, showFloatingTextForUnit: () => {}, playSfx: () => {}, playDoorSfx: () => {},
        invalidateVisionCache: () => {}, scheduleBoardRender: () => {}, markDirty: () => {}, renderIfDirty: () => {},
        unitHasStatus: (u, k) => !!(u && u.status && (u.status[k] | 0) > 0),
        clearStatus: (u, k) => { const d = D.STATUS_DEFS[k]; if (d && d.onRemove && (u.status[k] | 0) > 0) d.onRemove(u); delete u.status[k]; },
        applyStatusPayload: (u, p) => { u.status[p.id] = p.duration; return true; },
        unitFromId: id => state.units.find(u => u.id === id) || null,
        isEnemyUnit: (a, b) => a.player !== b.player,
        _benchOn: () => false, _gauntletReservesAlive: () => 0, _encLeadUnit: () => null,
        getUnitLevel: u => u.level || 10, isUnitAirborne: u => !!u.flying, unitPassiveValue: (u, k) => (u.passives || {})[k] || null,
        getLinePoints: () => [], unitPassiveValueFor: () => null,
        setTimeout: fn => { D._timers.push(fn); return 0; }, _timers: [],
        _inspectMoveBudget: u => ((u.ap || 0) >= 2 ? 1 : 0),
        getMoveTiles: u => { const out = []; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if ((dx || dy) && Math.abs(dx) + Math.abs(dy) === 1) out.push({ x: u.x + dx, y: u.y + dy, z: 0 }); return out; },
    });
    D.window = D;
    vm.runInContext('let _encMatch = null;\n' + DOOR_SRC, D);
    D._doorGeom = (id, x, y, extra) => { fx.push({ id, x, y, extra: extra || {} }); return true; };
    const mk = (id, player, x, y, o) => { const u = Object.assign({ id, player, x, y, hp: 1000, maxHp: 1000, ap: 2, status: {}, items: {}, types: ['human'], race: 'grey', name: id }, o || {}); state.units.push(u); return u; };
    return { D, state, logs, fx, mk, g: n => vm.runInContext(n, D) };
}

test('THE TUNED DOOR: THE PLAYER PICKS the type (the user, 2026-09-25: "Let the player choose the type"); no pick = no type; a plain door stays untyped', () => {
    const B = board();
    const a = B.mk('a', 1, 1, 1, { items: { captureDoorTuned: 1, captureDoor: 1 } });
    B.mk('near', 2, 3, 4, { types: ['tech', 'human'] });
    const tune = B.g('captureDoorTuneFor');
    assert.equal(tune(a, 3, 3, 'captureDoorTuned', 'alien'), 'alien', 'the pick, whoever stands near');
    assert.equal(tune(a, 3, 3, 'captureDoorTuned', null), null, 'no pick: no type (never guessed from the nearest enemy)');
    assert.equal(tune(a, 3, 3, 'captureDoorTuned', 'nonsense'), null, 'only the six types');
    assert.equal(tune(a, 3, 3, 'captureDoor', 'alien'), null, 'a plain door is never tuned');
    const d = B.g('captureDoorPlace')(a, 1, 3, 'captureDoorTuned', { type: tune(a, 1, 3, 'captureDoorTuned', 'unholy') });
    assert.ok(d && d.type === 'unholy', 'the pick rides the record (captureSealFor reads it)');
    const tile = between(fs.readFileSync(__dirname + '/hud.js', 'utf8'), '/* 🚪 THE ONE-WAY DOOR (CAPTURE_PLAN.md §3.2, Phase 2)', "if (typeof doWard === 'function'");
    assert.ok(/rule\.tuned \? \(\(typeof CAPTURE_RULES !== 'undefined' && CAPTURE_RULES\.types\)/.test(tile) && /window\._ewCapDoorType = tune;/.test(tile), 'the tile menu: one row per type, the row files the pick');
    const doItem = between(BT, 'function doItem(unit, x, y, z) {', '// ELEMENTAL SFX LAYER');
    assert.ok(doItem.includes("if (ITEM_RULES[_cdKey].tuned && !_cdType) {") && doItem.includes('state._tileActionTarget = { x, y,'), 'armed from the Items menu with no pick: the tile menu opens on the tile');
});

test('MOVE-THEN-PLACE: one step that brings the tile into the gun\'s reach, keeping the AP for the shot', () => {
    const B = board();
    const a = B.mk('a', 1, 1, 1, { items: { captureDoor: 1 } });
    const find = B.g('findCaptureDoorApproachTile');
    const legal = B.g('captureDoorLegalTiles');
    assert.ok(!legal(a).some(t => t.x === 6 && t.y === 1), 'range 4: (6,1) is out of reach from (1,1)');
    const step = find(a, 6, 1, 'captureDoor');
    assert.deepEqual([step.x, step.y], [2, 1], 'the step toward it');
    assert.deepEqual([a.x, a.y], [1, 1], 'the probe puts the unit back');
    assert.equal(find(a, 9, 9, 'captureDoor'), null, 'no single step reaches it');
    a.ap = 1;
    assert.equal(find(a, 6, 1, 'captureDoor'), null, 'no AP left for the shot after the step');
});

test('THE LOOK: the comet, then the door unfolds on its landing; take, seal, break and fold each fire their beat', () => {
    const B = board();
    const a = B.mk('a', 1, 1, 1, { items: { captureDoor: 3 } });
    const e = B.mk('e', 2, 5, 5); B.mk('f', 2, 8, 8);
    const d = B.g('captureDoorPlace')(a, 1, 4, 'captureDoor');
    const ids = () => B.fx.map(f => f.id);
    assert.deepEqual(ids(), ['raceDoorGun:shot', 'raceCaptureDoor:open']);
    assert.ok(B.fx[1].extra.delay > 0 && d._revealAt > 0, 'the door waits for the shot (the renderer skips it until _revealAt)');
    assert.deepEqual([d.faceX, d.faceY], [1, 1], 'the opening faces whoever fired it');
    for (const f of B.fx) for (const v of Object.values(f.extra)) assert.ok(v === null || typeof v !== 'object', 'primitives only (the relay rule)');
    B.D._timers.forEach(fn => fn());
    assert.equal(d._revealAt, undefined, 'revealed on landing');
    B.fx.length = 0;
    e.x = 1; e.y = 4; assert.ok(B.g('captureDoorTake')(d, e, 'push'));
    assert.deepEqual(ids(), ['raceCaptureDoor:take']);
    B.fx.length = 0;
    B.g('breakDoorPair')(d, {});
    assert.deepEqual(ids(), ['raceCaptureDoor:break']);
    assert.equal(B.fx[0].extra.held, 1, 'the void puffs out when it held someone');
    B.fx.length = 0; B.state.round = 5; a.ap = 2;
    const d2 = B.g('captureDoorPlace')(a, 2, 1, 'captureDoor');
    B.state.round = 6; a.ap = 2;
    B.fx.length = 0;
    B.g('captureDoorPlace')(a, 3, 1, 'captureDoor');
    assert.deepEqual(ids().slice(0, 1), ['raceCaptureDoor:fold'], 'the empty door folds away under the new one');
    const d3 = B.state.doors.find(x => x.kind === 'capture');
    const g = B.state.units.find(u => u.id === 'f'); g.x = 3; g.y = 1;
    assert.ok(B.g('captureDoorTake')(d3, g, 'move'));
    B.fx.length = 0;
    assert.ok(B.g('captureDoorSeal')(d3));
    assert.deepEqual(ids(), ['raceCaptureDoor:seal']);
    assert.ok(d2);
});

test('the ITEMS menu, the tile menu and the board click place a door', () => {
    const doItem = between(BT, 'function doItem(unit, x, y, z) {', '// ELEMENTAL SFX LAYER');
    assert.ok(/ITEM_RULES\[state\.selectedTool\]\?\.kind === 'captureDoor'/.test(doItem), 'doItem\'s capture branch');
    assert.ok(/captureDoorPlace\(unit, x, y, _cdKey, \{ type: _cdType \}\)/.test(doItem) && doItem.includes('const _cdType = captureDoorTuneFor(unit, x, y, _cdKey);'), 'the branch places (tuned) through the Phase 1 engine');
    assert.ok(/triggerAttackAnim\(unit, x, y, 'ranged'\)/.test(doItem), 'fired from the hip: the ranged clip');
    const canUse = between(BT, 'function canUseItemNow(unit, itemKey) {', 'function anyUsableItemNow(unit) {');
    assert.ok(/kind === 'captureDoor'/.test(canUse) && /captureDoorLegalTiles\(unit\)/.test(canUse), 'the row greys when no tile would take it');
    assert.ok(/findCaptureDoorApproachTile\(actingUnit, x, y, state\.selectedTool\)/.test(BT), 'a board click past reach steps in, then fires');
    const tile = between(HUD, 'function _computeTileActions(actingUnit, tx, ty, tz) {', "if (typeof doWard === 'function' && unitAP >= 1 && !onSelf) {");
    assert.ok(/captureDoorItemKeys\(\)/.test(tile) && /id: 'captureDoor:' \+ k/.test(tile), 'the tile menu: a row per door, the best tier first');
    assert.ok(/_moveThenCaptureDoor\(actingUnit, mt, tx, ty, k\)/.test(tile), 'out of reach: move then place');
    assert.ok(/why === 'story' \|\| why === 'seat'/.test(tile), 'no row outside a story fight or off the party');
    assert.ok(/const _catOrder = \['healing', 'battle', 'banes', 'doors'\]/.test(HUD), 'the door rows sort last, in their own colour');
    assert.ok(/PLACE THE ' \+ itName/.test(HUD), 'the aim reads PLACE THE DOOR');
    assert.ok(/kind === 'captureDoor'[\s\S]{0,400}captureDoorLegalTiles\(_selectedForHl\)/.test(UI), 'the painter lights the legal tiles');
});

test('the board door wears the capture look; the held body hides in the void', () => {
    const body = between(REND, 'function _buildDoor3D(d)', 'function _buildTunnelMound3D(');
    assert.ok(/var cap = d\.kind === 'capture'/.test(body), 'the capture branch');
    assert.ok(/leaf_vault/.test(body), 'T3 wears the vault leaf');
    assert.ok(/DOOR3D_CAPTURE_OPEN_ANGLE/.test(body), 'standing wide open');
    assert.ok(/_captureDoorDress\(g, d,/.test(body), 'the dress: lamps, the void, the plate');
    const dress = between(REND, 'function _captureDoorDress(g, d, k) {', 'var DOOR3D_OPEN_ANGLE = 1.5;');
    assert.ok(/d\.held/.test(dress) && /0x030106/.test(dress), 'the void pane while it holds');
    assert.ok(/CSS2DObject/.test(dress) && /TO SEAL/.test(dress), 'the plate: hits + the hold meter');
    assert.ok(!/new THREE\.PointLight/.test(dress), 'no standing light (a light-count change recompiles every lit shader)');
    assert.ok(/\(dd\.kind === 'capture'(?: \|\| dd\.kind === 'standing')?\)? && dd\._revealAt && Date\.now\(\) < dd\._revealAt\) continue/.test(REND), 'held back until the comet lands');
    assert.ok(/\(dd\.fixed && dd\.kind !== 'capture'(?: && dd\.kind !== 'standing')?\)/.test(REND), 'a capture door is not a grave gate');
    assert.ok(/if \(dd\.kind === 'capture'\) \{ h = _hashInt\(h, dd\.held/.test(REND), 'the hold redraws it');
    assert.ok(/unit\.status && unit\.status\.captured > 0\) \{ entry\.group\.visible = false/.test(REND), 'the held model hides');
});

test('the four beats are registered VFX recipes with real light and no backdrop', () => {
    const sec = between(VFX, 'THE ONE-WAY DOOR (CAPTURE_PLAN.md §3.4, Phase 2', 'THE NEW-RACE VFX PASS');
    for (const id of ['open', 'take', 'seal', 'break', 'fold']) assert.ok(sec.includes(`'raceCaptureDoor:${id}':`), 'recipe ' + id);
    assert.ok(/ThreeVFX\.flashLight/.test(sec), 'a real light (the pooled flash lights)');
    assert.ok(/_sigRunOwned\(g, total/.test(sec), 'the take owns its group');
    assert.ok(!/window\.setTimeout\(/.test(sec) && !/psychedelic|backdrop\(/i.test(sec.replace(/no\s+backdrop/i, '')), 'timers through _fxDelay, no backdrop');
});
