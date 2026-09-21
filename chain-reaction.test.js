'use strict';
/* ⛓ THE CHAIN REACTION (2026-09-21) — the one arrival resolver.
   A body landing on a tile — walked, shoved, pulled, thrown, blown, dragged,
   teleported, or a flyer grounded — runs battle.js resolveTileArrival: the
   ground, the pickups, the fuses (bombs / traps / mines), the enemy debuff
   zones (on contact now), the vortex (flung now), the warp rune — in ONE
   order, each mover re-entering the chain at its landing. The resolver is run
   for real in a vm sandbox (bomb → blast → tornado → fling → debuff zone), and
   every landing site in the engine is source-guarded. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const read = f => fs.readFileSync(path.join(__dirname, f), 'utf8');
const battle = read('battle.js'), stateSrc = read('state.js');

function between(src, a, b) {
    const i = src.indexOf(a); assert.ok(i >= 0, 'missing anchor ' + a);
    const j = src.indexOf(b, i); assert.ok(j > i, 'missing end anchor ' + b);
    return src.slice(i, j);
}
const CHAIN_SRC = between(battle, '        const CHAIN_RULES = { maxDepth: 8', '        // 🌋 Knockback into hazards (the historical name');

function sandbox(o = {}) {
    const log = [], floats = [], statuses = [], dmg = [];
    const ctx = {
        state: Object.assign({ phase: 'battle', round: 3, units: [], bombs: [], traps: [], _deployedObjects: [], _activeZones: [], activeWeather: [] }, o.state || {}),
        window: {}, console,
        addLog: m => log.push(String(m)),
        coordLabel: (x, y) => `(${x},${y})`,
        unitDisplayName: u => u.name,
        showFloatingTextForUnit: (u, t) => floats.push(t),
        applyStatusPayload: (u, p, label) => statuses.push({ id: p.id, label }),
        applyDamageToUnit: (u, n, label) => { dmg.push(n); u.hp -= n; if (u.hp <= 0) u.dead = true; },
        playSfx() {}, scheduleBoardRender() {}, checkWin() { ctx._wins = (ctx._wins || 0) + 1; },
        _skipVisuals: () => false,
        canFly: () => !!o.fly, isUnitAirborne: () => !!o.air,
        getGravityFieldAt: () => o.gravity || null,
        forceGroundUnit: u => { ctx._grounded = (ctx._grounded || 0) + 1; return true; },
        getTerrainAt: () => 'grass', _isWetTile: () => false, _isLavaTile: () => false, _tileIsBurning: () => false,
        TERRAIN_RULES: {}, _soakUnit() {}, ensureUnitStatus: u => (u.status = u.status || {}), _burnUnitOnTile() {},
        BURNING_ENTER_DAMAGE: 18, BURNING_KNOCKIN_DAMAGE: 30,
        checkPixieDustPickup: () => false, collectMatDropsAt() {}, checkTrapTrigger: () => false,
        updateSmokeZoneCloak() {}, checkWarpRuneTrigger: o.rune || (() => false),
        detonateDeployedObject() {}, SPELL_BY_ID: {},
        WEATHER_REGISTRY: { tornado: { label: 'Tornado', icon: '🌪', displaces: true, displaceTiles: 2, homingDamage: u => ({ amount: 10, text: 'shred' }) } },
        animateDisplacement() {},
        /* the blast: applyAreaBlowback → applyBlowback lands the pushed body
           through the chain (state.js) — mirrored here by the stub */
        detonateBomb: (bomb, text) => { log.push(text); const u = ctx.state.units[0]; u.x = bomb.x + 1; ctx.resolveTileArrival(u, { via: 'blown' }); },
        /* the vortex's own pushes carry noChain — the resolver chains the LAST landing */
        applyBlowback: (u, sx, sy, pre, opts) => { assert.equal(opts.noChain, true); u.x += 1; return { pushed: true }; }
    };
    vm.createContext(ctx);
    vm.runInContext(CHAIN_SRC + '\nthis.resolveTileArrival = resolveTileArrival; this._chainVortexAt = _chainVortexAt; this._chainZonesAt = _chainZonesAt; this.CHAIN_RULES = CHAIN_RULES;', ctx);
    return Object.assign(ctx, { log, floats, statuses, dmg });
}

test('the chain: a shove onto a bomb → the blast blows the body into a tornado → flung → lands in a debuff zone, afflicted on the spot', () => {
    const c = sandbox();
    const u = { id: 'u1', name: 'Grunt', player: 1, x: 2, y: 2, z: 0, hp: 100 };
    c.state.units.push(u);
    c.state.bombs.push({ x: 2, y: 2, owner: 2, dmg: 30 });
    c.state.activeWeather.push({ id: 'w1', type: 'tornado', tiles: [{ x: 3, y: 2 }] });
    c.state._activeZones.push({ x: 5, y: 2, radius: 1, type: 'debuff', ownerPlayer: 2, spellName: 'Miasma', statusEffects: [{ id: 'poison', duration: 2 }] });
    const fired = c.resolveTileArrival(u, { via: 'displaced' });
    assert.equal(fired, 1, 'the bomb is the reaction at depth 0');
    assert.equal(c.state.bombs.length, 0, 'the bomb is spent');
    assert.equal(u.x, 5, 'blown to the tornado (3), flung two tiles on (5)');
    assert.equal(c.dmg.join(','), '10', 'the tornado shredded on contact');
    assert.equal(c.statuses.map(s => s.id).join(','), 'poison', 'the zone bit on contact');
    assert.ok(c.floats.includes('⛓ CHAIN ×2') && c.floats.includes('⛓ CHAIN ×3') && c.floats.includes('🌪 FLUNG!'), c.floats.join('|'));
    assert.ok(c.log.some(l => /Chain reaction: 3 reactions/.test(l)), c.log.join('\n'));
    assert.equal(c._wins, 1, 'one checkWin at the top of the chain');
    /* the stamps: the same zone never bites twice in a round, the same storm never flings twice */
    assert.equal(c.resolveTileArrival(u, { via: 'displaced' }), 0);
    u.x = 3; assert.equal(c.resolveTileArrival(u, { via: 'displaced' }), 0, 'the tornado already took this body this round');
    c.state.round = 4; u.x = 3;
    assert.equal(c.resolveTileArrival(u, { via: 'displaced' }), 1, 'a new round, a new fling');
    assert.equal(u.x, 5);
    assert.equal(c.statuses.length, 2, 'and the zone bites again at the new round');
});

test('the chain: an airborne body only meets the gravity field; a super field grounds it and the deck runs its own chain', () => {
    const c = sandbox({ fly: true, air: true, gravity: 'super' });
    const u = { id: 'u1', name: 'Bat', player: 1, x: 2, y: 2, z: 3, hp: 100 };
    c.state.units.push(u);
    c.state.bombs.push({ x: 2, y: 2, owner: 2, dmg: 30 });
    assert.equal(c.resolveTileArrival(u, { via: 'move' }), 1);
    assert.equal(c._grounded, 1, 'forceGroundUnit (which re-enters the chain on the deck)');
    assert.equal(c.state.bombs.length, 1, 'the bomb waits for the deck — the sky step never touches it');
    const d = sandbox({ fly: true, air: true });
    d.state.units.push(u); d.state.bombs.push({ x: 2, y: 2, owner: 2, dmg: 30 });
    assert.equal(d.resolveTileArrival(u, { via: 'move' }), 0, 'gliding over: nothing fires');
});

test('the chain: the depth cap ends a runaway (a rune that always fires)', () => {
    const c = sandbox({ rune: () => true });
    const u = { id: 'u1', name: 'Grunt', player: 1, x: 2, y: 2, z: 0, hp: 100 };
    c.state.units.push(u);
    c.resolveTileArrival(u, { via: 'move' });
    assert.ok(c.log.some(l => /chain reaction runs out/.test(l)), 'the cap speaks');
    assert.ok(c.floats.filter(f => /CHAIN ×/.test(f)).length <= c.CHAIN_RULES.maxDepth);
});

test('the chain: a friendly bomb / zone never fires on its owner; walking in takes the soak but not the lava bite', () => {
    const c = sandbox();
    const u = { id: 'u1', name: 'Grunt', player: 1, x: 2, y: 2, z: 0, hp: 100 };
    c.state.units.push(u);
    c.state.bombs.push({ x: 2, y: 2, owner: 1, dmg: 30 });
    c.state._activeZones.push({ x: 2, y: 2, radius: 1, type: 'debuff', ownerPlayer: 1, spellName: 'Miasma', statusEffects: [{ id: 'poison', duration: 2 }] });
    assert.equal(c.resolveTileArrival(u, { via: 'displaced' }), 0);
    assert.equal(c.state.bombs.length, 1);
    const l = sandbox(); l._isLavaTile = () => true; l.getTerrainAt = () => 'lava';
    const v = { id: 'u2', name: 'Grunt', player: 1, x: 2, y: 2, z: 0, hp: 100 };
    l.state.units.push(v);
    assert.equal(l.resolveTileArrival(v, { via: 'move' }), 0, 'a walk onto lava is the terrain\'s end-of-turn rule');
    assert.equal(l.resolveTileArrival(v, { via: 'displaced' }), 1, 'a shove into lava bites now');
    assert.equal(l.dmg[0], 60);
});

test('the chain: every landing site in the engine runs it', () => {
    const fma = between(battle, '        function finishMoveAt(unit, x, y, opts = {}) {', '        function moveHourglassesBetweenUnits(');
    assert.ok(/resolveTileArrival\(unit, \{ via: 'move' \}\)/.test(fma), 'the walk');
    assert.ok(!/state\.bombs\.findIndex/.test(fma) && !/detonateOnStep/.test(fma) && !/checkTrapTrigger/.test(fma), 'the walk\'s old inline reactions are gone');
    assert.ok(/function _applyKnockbackHazard\(unit, opts\) \{\s*return resolveTileArrival\(unit, Object\.assign\(\{ via: 'displaced' \}/.test(battle), 'the shove hook delegates');
    const fgu = between(battle, '        function forceGroundUnit(unit, opts = {}) {', '        function getTauntTargeter(');
    assert.ok(/resolveTileArrival\(unit, \{ via: 'grounded', fxDelayMs: _fgFallMs \}\)/.test(fgu), 'the grounding');
    const slide = between(battle, '        function resolveForcedSlide(target, dx, dy, dist, opts = {}) {', '        // ── Salvage / material economy');
    assert.ok(/_applyKnockbackHazard\(target, \{ fxDelayMs:/.test(slide), 'the slide hands its tween to the VFX beats');
    for (const via of ['self', 'teleport', 'thrown', 'dragged']) assert.ok(new RegExp("resolveTileArrival\\([a-zA-Z]+, \\{ via: (tUnit === unit \\? 'self' : )?'" + via + "' \\}").test(battle), 'via ' + via);
    assert.ok((battle.match(/resolveTileArrival\(/g) || []).length >= 18, 'the sites');
    /* the fuses: bombs, traps and deployed mines are read by the chain, and the chain alone */
    const fuses = between(battle, '        function _chainFuses(unit, opts) {', '        function _chainZones(unit) {');
    assert.ok(/state\.bombs\.findIndex/.test(fuses) && /checkTrapTrigger\(unit\)/.test(fuses) && /detonateOnStep/.test(fuses));
    /* two readers: the chain (fires it) and getPathPickupEvent (the walk STOPS on it) — never a third */
    assert.equal((battle.match(/o\.detonateOnStep && o\.ownerPlayer !== unit\.player/g) || []).length, 2, 'the chain + the path stop');
    /* the bomb's VFX rides the slide's tween */
    assert.ok(/function detonateBomb\(bomb, triggerText, opts = \{\}\)/.test(battle) && /if \(opts\.fxDelayMs > 0\) window\.setTimeout\(_bvFire, opts\.fxDelayMs\); else _bvFire\(\);/.test(battle));
    /* the GAME export */
    assert.ok(/resolveTileArrival, _chainZonesAt, _chainVortexAt,/.test(battle));
});

test('the chain: state.js — a blown body lands through it, the weather stamps its victims and chains the fling\'s landing', () => {
    const bb = between(stateSrc, '        function applyBlowback(unit, sourceX, sourceY, logPrefix, opts) {', '        function applyAreaBlowback(');
    assert.equal((bb.match(/window\.GAME\.resolveTileArrival\(unit, \{ via: 'blown' \}\)/g) || []).length, 2, 'both landings (the push and the crash-through)');
    assert.ok(/if \(!opts\.noChain && window\.GAME/.test(bb), 'noChain = the caller resolves the final landing');
    const hw = between(stateSrc, '            const applyStrikes = () => {', '        function tickWeather() {');
    assert.ok(/_vortexStamps \|\| \(v\._vortexStamps = \{\}\)\)\[String\(weather\.id \|\| weather\.type\)\] = state\.round/.test(hw), 'the stamp the chain reads');
    assert.ok(/applyBlowback\(v, nx, ny, `\$\{def\.icon\} `, \{ noAnim: true, noChain: true \}\)/.test(hw));
    assert.ok(/window\.GAME\.resolveTileArrival\(v, \{ via: 'flung' \}\)/.test(hw), 'the fling\'s landing');
    /* battle.js reads the same stamp key */
    assert.ok(/_chainStampOk\(unit, '_vortexStamps', String\(weather\.id \|\| weather\.type\)\)/.test(battle));
});
