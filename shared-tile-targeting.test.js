/* SHARED-TILE TARGETING (2026-09-13): a flyer hovering over a ground unit.
   Runs the production resolveUnitInColumn (battle.js) + unitsAtColumn /
   unitAt (map.js) in a vm sandbox against a stacked column, then
   source-guards every site that must read the column through it, the
   AoE "every body in the column" loop, the structure-attack facing and
   the overwatch facing race. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const battle = fs.readFileSync(path.join(__dirname, 'battle.js'), 'utf8');
const map = fs.readFileSync(path.join(__dirname, 'map.js'), 'utf8');
const ui = fs.readFileSync(path.join(__dirname, 'ui.js'), 'utf8');

function between(src, a, b) {
    const i = src.indexOf(a);
    assert.ok(i >= 0, 'missing anchor ' + a);
    const j = src.indexOf(b, i);
    assert.ok(j > i, 'missing end anchor ' + b);
    return src.slice(i, j);
}

function makeCtx(units) {
    const ctx = {
        state: { units },
        isEnemyUnit: (a, b) => !!a && !!b && a.id !== b.id && a.player !== b.player,
        isAllyUnit: (a, b) => !!a && !!b && (a.id === b.id || a.player === b.player),
        isUnitAirborne: u => (u.z ?? 0) > 0,
        window: {},
        console,
    };
    vm.createContext(ctx);
    vm.runInContext(between(map, '        function unitAt3D(', '        function _syncColumnToLegacy('), ctx);
    vm.runInContext(between(map, '        function unitAt(x, y, z) {', '        function airborneUnitAt('), ctx);
    vm.runInContext(between(battle, '        function resolveUnitInColumn(', '        function _structureAt('), ctx);
    return ctx;
}

const me = { id: 'me', player: 1, x: 0, y: 0, z: 0 };
const groundAlly = { id: 'ally', player: 1, x: 3, y: 3, z: 0 };
const flyerEnemy = { id: 'flyer', player: 2, x: 3, y: 3, z: 2 };
const groundEnemy = { id: 'genemy', player: 2, x: 3, y: 3, z: 0 };
const flyerAlly = { id: 'fally', player: 1, x: 3, y: 3, z: 2 };

test('resolver: a surface click under an enemy flyer over an ally aims the ATTACK at the flyer', () => {
    const ctx = makeCtx([me, groundAlly, flyerEnemy]);
    const r = vm.runInContext(`resolveUnitInColumn(state.units[0], 3, 3, 0, { side: 'enemy' })`, ctx);
    assert.equal(r.id, 'flyer');
    // the legacy lookup would have handed back the ground ally
    assert.equal(vm.runInContext('unitAt(3, 3).id', ctx), 'ally');
});

test('resolver: the same click for a HEAL aims at the ally on the ground', () => {
    const ctx = makeCtx([me, groundAlly, flyerEnemy]);
    const r = vm.runInContext(`resolveUnitInColumn(state.units[0], 3, 3, 0, { side: 'ally' })`, ctx);
    assert.equal(r.id, 'ally');
});

test('resolver: an ally flyer over an enemy — the sprite click on the flyer is honoured for a heal, the attack drops to the enemy beneath', () => {
    const ctx = makeCtx([me, groundEnemy, flyerAlly]);
    assert.equal(vm.runInContext(`resolveUnitInColumn(state.units[0], 3, 3, 2, { side: 'ally' }).id`, ctx), 'fally');
    assert.equal(vm.runInContext(`resolveUnitInColumn(state.units[0], 3, 3, 2, { side: 'enemy' }).id`, ctx), 'genemy');
});

test('resolver: two enemies in the column — the exact-z body in reach wins, an out-of-reach click falls to the body in reach', () => {
    const ctx = makeCtx([me, groundEnemy, flyerEnemy]);
    const inRangeGround = `u => u.z === 0`;
    assert.equal(vm.runInContext(`resolveUnitInColumn(state.units[0], 3, 3, 2, { side: 'enemy', inRange: ${inRangeGround} }).id`, ctx), 'genemy');
    assert.equal(vm.runInContext(`resolveUnitInColumn(state.units[0], 3, 3, 2, { side: 'enemy', inRange: u => true }).id`, ctx), 'flyer');
    assert.equal(vm.runInContext(`resolveUnitInColumn(state.units[0], 3, 3, 0, { side: 'enemy', inRange: u => u.z === 2 }).id`, ctx), 'flyer');
});

test('resolver: nobody suits the action → the click stands (the caller reports the miss); empty / single columns use the legacy lookup', () => {
    const ctx = makeCtx([me, groundAlly, flyerAlly]);
    assert.equal(vm.runInContext(`resolveUnitInColumn(state.units[0], 3, 3, 2, { side: 'enemy' }).id`, ctx), 'fally');
    assert.equal(vm.runInContext(`resolveUnitInColumn(state.units[0], 5, 5, 0, { side: 'enemy' })`, ctx), null);
    assert.equal(vm.runInContext(`resolveUnitInColumn(state.units[0], 0, 0, 0, { side: 'ally' }).id`, ctx), 'me');
});

test('source: doAttack / doSpell / doItem / the confirm gates / the hover preview read the column through the resolver', () => {
    const doAttack = between(battle, '        function doAttack(unit, x, y, z) {', '            // Facing: square the attacker up on the target');
    assert.match(doAttack, /const _clickedTarget = resolveUnitInColumn\(unit, x, y, z, \{\s*side: 'enemy'/);
    assert.match(doAttack, /let target = _clickedTarget;/);
    assert.doesNotMatch(doAttack, /let target = z != null \? \(unitAt\(x, y, z\) \|\| unitAt\(x, y\)\)/);
    const doSpell = between(battle, '        function doSpell(unit, x, y, z) {', "            const _spellLongRange = isLongRangeSpell(spell);");
    assert.match(doSpell, /_spellClickTarget = resolveUnitInColumn\(unit, x, y, z, \{/);
    assert.match(doSpell, /z = _spellClickTarget\.z;/);
    const doItem = between(battle, '        function doItem(unit, x, y, z) {', "            if (state.selectedTool === 'healPotion') {");
    assert.match(doItem, /const target = resolveUnitInColumn\(unit, x, y, z, \{ side: _itemSide \}\);/);
    const teamOk = between(battle, '        function _spellTargetTeamOk(', '        /* Same idea for targeted items');
    assert.match(teamOk, /resolveUnitInColumn\(unit, x, y, z, \{\s*side: km\.offensive/);
    const itemOk = between(battle, '        function _itemTargetTeamOk(', '            if (tool === \'healPotion\' || tool === \'manaPotion\') {');
    assert.match(itemOk, /resolveUnitInColumn\(unit, x, y, z, \{ side: _itSide \}\)/);
    assert.match(ui, /resolveUnitInColumn\(attacker, pt\.x, pt\.y, pt\.z, \{ side: _pvSide \}\)/);
});

test('source: AoE blasts and combo bursts hit EVERY enemy standing in a tile\'s column', () => {
    const aoe = between(battle, '        function _applyAoeDamage(', '            // (Towers are immune to spells by design');
    assert.match(aoe, /enemies\.filter\(e => e\.x === tile\.x && e\.y === tile\.y\)/);
    assert.match(aoe, /for \(const target of _tileTargets\)/);
    assert.doesNotMatch(aoe, /enemies\.find\(e => e\.x === tile\.x && e\.y === tile\.y\)/);
    const combo = between(battle, "            else if (combo.kind === 'aoe') {", "            else if (combo.kind === 'healAll') {");
    assert.match(combo, /for \(const hit of enemies\.filter\(e => e\.x === tile\.x && e\.y === tile\.y\)\)/);
});

test('source: a basic attack on a structure (Cube / turret / mirror / object / seed / tree / column) squares the attacker up on it', () => {
    const structs = between(battle, '            const tw = towerAt(x, y);\n            if (tw && !target && tw.owner !== unit.player) {',
        "            if (!target || isAllyUnit(target, unit)) {\n                addLog('Choose an enemy on an attack-highlighted tile.');");
    const snaps = (structs.match(/pushUndoSnapshot\(true\);/g) || []).length;
    const faces = (structs.match(/setUnitFacing\(unit, x - unit\.x, y - unit\.y\);/g) || []).length;
    assert.equal(snaps, 7);
    assert.equal(faces, snaps, 'every structure branch turns the attacker toward the tile');
});

test('source: overwatch turns the mover when the shot FIRES and its delayed impact keeps whatever facing the mover chose since', () => {
    const ow = between(battle, '        function _fireOverwatchShot(', '        function doMove(');
    assert.match(ow, /setUnitFacing\(mover, guardian\.x - mover\.x, guardian\.y - mover\.y\);/);
    assert.match(ow, /keepFacing: true/);
    const whip = between(battle, "                    // Whip around to face the attacker", "                    target._lastDamageSourceId = sourceUnit.id;");
    assert.match(whip, /!opts\.keepFacing/);
});
