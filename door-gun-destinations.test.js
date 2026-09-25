// door-gun-destinations.test.js — THE DESTINATIONS, the door wheel Phase 2 (DOOR_GUN_PLAN.md §2.2 / §3.3 / §3.4, 2026-09-25),
// and THE GUST STREAM (the user, 2026-09-25: "I want the wind gust to be a persistent hazard on the field, not just
// blasting in between rounds. If a unit walks into the gust stream it should push them that direction. Immovable units
// like the kaiju and giant should be able to stand in it just fine").
// battle.js's DOOR block + THE CHAIN REACTION + the real _resolveIceSlide and TIMED TERRAIN run together in a vm over
// data.js's real tables with a 10×10 board (a terrain map, burning tiles, prisms) stubbed round them:
// the stream stops a walk and spares the colossal; Hell burns its lane and melts Frost's ice; Frost freezes (water too) and
// a shove onto its ice slides the lane's length; the Maw draws, bites and spits; the Laser's beam stops at a wall and turns
// on a prism; Light heals + cleanses its side and blinds the other. Plus the source sites (walk stop, beam crossing, AI,
// the look). Repo-only.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { loadGameData } = require('./load-data');
const read = f => fs.readFileSync(__dirname + '/' + f, 'utf8');
const BT = read('battle.js');
const between = (src, a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); assert.ok(i >= 0 && j > i, 'slice ' + a); return src.slice(i, j); };
const DOOR_SRC = between(BT, '        const DOOR_RULES = {', '        function _structureAt(x, y, unit) {');
const CHAIN_SRC = between(BT, '        const CHAIN_RULES = { maxDepth: 8', '        // 🌋 Knockback into hazards (the historical name');
const ICE_SRC = between(BT, '        function _resolveIceSlide(unit, dir) {', '        // ═══════════════════════════════════════════════════════════════════');
const TT_SRC = between(BT, '        function _paintTimedTerrain(cx, cy, cfg, unit, label) {', "        if (typeof window !== 'undefined') { window._paintTimedTerrain");

function board() {
    const D = loadGameData();
    const logs = [], dmg = [], heals = [], slides = [];
    const state = { round: 1, phase: 'battle', doors: [], units: [], partyBag: { seat: 1, items: {} }, bombs: [], traps: [], mirrors: [],
        _deployedObjects: [], _activeZones: [], activeWeather: [], autoPlayers: {}, fogOfWar: false, burningTiles: {}, _timedTerrain: [] };
    const W = 10, H = 10, terr = {};
    const inside = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
    const unitAt = (x, y) => state.units.find(u => !u.dead && u.x === x && u.y === y) || null;
    const TR = vm.runInContext('TERRAIN_RULES', D);
    Object.assign(D, {
        state, logs,
        isInside: inside, unitAt, bw: () => W, bh: () => H,
        getTerrainAt: (x, y) => terr[x + ',' + y] || 'grass', setTerrainAt: (x, y, t) => { terr[x + ',' + y] = t; },
        getTerrainRule: t => TR[t] || { passable: true }, canOccupy: () => true,
        isTerrainPassable: (x, y) => inside(x, y) && (terr[x + ',' + y] || 'grass') !== 'wall',
        isRangeBlockedByTerrain: () => false, isInVision: () => true, getHeightAt: () => 0, nearestWalkableZ: () => 0,
        getSquareArea: (cx, cy, r) => { const o = []; for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (inside(cx + dx, cy + dy)) o.push({ x: cx + dx, y: cy + dy }); return o; },
        getEffectiveSpellRange: (u, sp) => sp.range,
        _partyBagOn: () => !!(state.partyBag && state.partyBag.items), isOnlineMatch: () => false,
        unitHomePlayer: u => u.player, randInt: n => 7, engineRandInt: n => 4, actionMs: ms => ms,
        setUnitFacing: () => {}, _skipVisuals: () => true, getUnitFacing: u => u.facing || null,
        addLog: m => logs.push(String(m)), coordLabel: (x, y) => x + ',' + y, unitDisplayName: u => u.name || u.id,
        showFloatingTextAtTile: () => {}, showFloatingTextForUnit: () => {}, playSfx: () => {}, playDoorSfx: () => {},
        invalidateVisionCache: () => {}, scheduleBoardRender: () => {}, markDirty: () => {}, checkWin: () => {},
        unitHasStatus: (u, k) => !!(u && u.status && (u.status[k] | 0) > 0),
        clearStatus: (u, k) => { delete u.status[k]; },
        applyStatusPayload: (u, p) => { u.status[p.id] = p.duration; return true; },
        unitFromId: id => state.units.find(u => u.id === id) || null,
        isEnemyUnit: (a, b) => a.player !== b.player,
        getUnitPushDistance: (u, n) => (u.colossal ? 0 : n),
        applyDamageToUnit: (u, n, label, o) => { dmg.push({ id: u.id, n, src: o && o.sourceUnit ? o.sourceUnit.id : null, type: o && o.spellType, el: o && o.spellElement }); u.hp -= n; if (u.hp <= 0) u.dead = true; },
        applyHealingToUnit: (u, n) => { heals.push({ id: u.id, n }); u.hp = Math.min(u.maxHp, u.hp + n); return n; },
        triggerStatusWiggle: () => {},
        _benchOn: () => false, _gauntletReservesAlive: () => 0, _encLeadUnit: () => null,
        getUnitLevel: u => u.level || 10, isUnitAirborne: u => !!u.flying, unitPassiveValue: (u, k) => (u.passives || {})[k] || null,
        getLinePoints: () => [], unitPassiveValueFor: () => null,
        canFly: u => !!u.flying, getGravityFieldAt: () => null, forceGroundUnit: () => false,
        _isWetTile: () => false, _isLavaTile: () => false,
        _tileIsBurning: (x, y) => !!state.burningTiles[x + ',' + y],
        igniteTile: (x, y, r, by) => { const t = terr[x + ',' + y]; if (t === 'water' || t === 'ice') return false; state.burningTiles[x + ',' + y] = { x, y, t: r, p: by ? by.player : 0 }; return true; },
        extinguishTile: (x, y) => { delete state.burningTiles[x + ',' + y]; },
        _isIceTile: (x, y) => (terr[x + ',' + y] || 'grass') === 'ice',
        _soakUnit() {}, ensureUnitStatus: u => (u.status = u.status || {}), _burnUnitOnTile(u) { u._burnt = (u._burnt | 0) + 1; return true; },
        checkPixieDustPickup: () => false, collectMatDropsAt() {}, checkTrapTrigger: () => false,
        updateSmokeZoneCloak() {}, checkWarpRuneTrigger: () => false, detonateDeployedObject() {},
        WEATHER_REGISTRY: {}, animateDisplacement() {}, animateDisplacementPath() {}, applyBlowback: () => ({ pushed: false }),
        liquidFamilyOf: t => (t === 'water' || t === 'deep_water') ? 'water' : null, trackTilesChanged() {},
        _applyKnockbackHazard: (u, o) => D.resolveTileArrival(u, Object.assign({ via: 'displaced' }, o || {})),
        /* the slide: steps along (dx, dy) until the edge, a wall or a body, then lands through the chain WITH its direction
           (battle.js resolveForcedSlide passes dirX / dirY to the landing — the ice rule reads it) */
        resolveForcedSlide: (u, dx, dy, dist, o) => {
            let n = 0;
            while (n < dist) {
                const nx = u.x + dx, ny = u.y + dy;
                if (!inside(nx, ny) || unitAt(nx, ny) || (terr[nx + ',' + ny] === 'wall')) break;
                u.x = nx; u.y = ny; n++;
            }
            slides.push({ id: u.id, n, to: u.x + ',' + u.y });
            if (n) D.resolveTileArrival(u, { via: 'displaced', dirX: dx, dirY: dy });
            return { moved: n };
        },
    });
    vm.runInContext('let _encMatch = null;\n' + CHAIN_SRC + '\n' + ICE_SRC + '\n' + TT_SRC + '\n' + DOOR_SRC
        + '\nthis.resolveTileArrival = resolveTileArrival;', D);
    const mk = (id, player, x, y, o) => { const u = Object.assign({ id, player, x, y, z: 0, hp: 1000, maxHp: 1000, ap: 2, status: {}, items: {}, types: ['human'], race: 'grey', name: id }, o || {}); state.units.push(u); return u; };
    const g = n => vm.runInContext(n, D);
    const place = (u, key, x, y, fx, fy) => g('doorGunPlace')(u, D.SPELL_BY_ID[key], x, y, fx || 0, fy || 0, {});
    return { D, state, logs, dmg, heals, slides, terr, mk, g, place };
}
const at = u => u.x + ',' + u.y;

test('the rows: five destinations join the wheel with their table\'s tier, type and element', () => {
    const D = loadGameData();
    const rows = { hell: 'gunHellDoor', frost: 'gunFrostDoor', maw: 'gunMawDoor', laser: 'gunLaserDoor', light: 'gunLightDoor' };
    for (const [key, id] of Object.entries(rows)) {
        const sp = D.SPELL_BY_ID[id], d = D.DOOR_GUN_DOORS[key];
        assert.ok(sp && sp.kind === 'doorDeploy' && sp.door === key && sp.doorGun, id);
        assert.equal(d.spell, id);
        assert.equal(sp.spellType, d.spellType, id + ' type');
        assert.equal(sp.element, d.element, id + ' element');
        assert.ok(D.SPELL_ELEMENTS.includes(sp.element), id + ' element is canonical');
        assert.equal(sp.cost, d.tier === 3 ? 75 : 50, id + ' MP by tier');
        assert.equal(D.doorGunSpellTier(id), d.tier);
    }
    assert.ok(/stand in it unmoved/.test(D.SPELL_BY_ID.gunGustDoor.desc) && /walks/.test(D.SPELL_BY_ID.gunGustDoor.desc), 'the Gust row reads as a stream');
});

test('THE GUST STREAM: a walk into it stops on the first windy tile; the colossal, a Keyholder and a flyer walk on', () => {
    const B = board();
    const a = B.mk('a', 1, 1, 2, { race: 'door agent' });
    B.place(a, 'gunGustDoor', 3, 2, 1, 0);
    const stream = B.g('gustStreamAt');
    const e = B.mk('e', 2, 5, 5), kaiju = B.mk('k', 2, 6, 6, { colossal: true }), key = B.mk('kh', 2, 7, 7, { passives: { doorImmune: true } }), fly = B.mk('f', 2, 8, 8, { flying: true });
    assert.ok(stream(e, 5, 2), 'a lane tile stops the walk');
    assert.equal(stream(e, 5, 3), null, 'beside the lane: nothing');
    assert.equal(stream(e, 3, 2), null, 'the door\'s own tile is not the wind');
    assert.equal(stream(kaiju, 5, 2), null, 'the kaiju stands in it');
    assert.equal(stream(key, 5, 2), null, 'a Keyholder walks through wind');
    assert.equal(stream(fly, 5, 2), null, 'a flyer passes over');
    /* the kaiju walks INTO the stream and stays; the wind never budges it at the doors' turn either */
    kaiju.x = 5; kaiju.y = 2; B.D.resolveTileArrival(kaiju, { via: 'move' });
    assert.equal(at(kaiju), '5,2');
    B.state.round = 2; B.g('processDoorActs')(() => {});
    assert.equal(at(kaiju), '5,2', 'immovable in the wind');
    /* the walk stop is getPathPickupEvent's */
    const pick = between(BT, '        function getPathPickupEvent(unit, x, y) {', '        function updateSmokeZoneCloak(unit) {');
    assert.ok(/gustStreamAt\(unit, x, y\)\) return \{ kind: 'gust', x, y \}/.test(pick));
});

test('HELL: the lane burns (the board\'s fire), enemies take the blast + Burn, allies are spared the blast; it melts Frost\'s ice', () => {
    const B = board();
    const a = B.mk('a', 1, 0, 5, { race: 'door agent' });
    const e = B.mk('e', 2, 3, 5), f = B.mk('f', 1, 4, 5);
    B.terr['5,5'] = 'ice'; B.state._timedTerrain.push({ x: 5, y: 5, prev: 'water', terrain: 'ice', expiresRound: 4, owner: 2 });
    const d = B.place(a, 'gunHellDoor', 2, 5, 1, 0);
    assert.deepEqual([...B.g('standingDoorLaneTiles')(d)].map(t => t.x + ',' + t.y), ['3,5', '4,5', '5,5']);
    assert.ok(B.state.burningTiles['3,5'] && B.state.burningTiles['4,5'], 'the lane burns');
    assert.equal(B.terr['5,5'], 'water', 'the frost door\'s ice melted back to water');
    assert.ok(!B.state._timedTerrain.length, 'the ice entry is gone');
    assert.deepEqual(B.dmg.map(h => h.id), ['e'], 'the blast hits the enemy only');
    assert.equal(B.dmg[0].n, 45); assert.equal(B.dmg[0].type, 'unholy'); assert.equal(B.dmg[0].el, 'fire'); assert.equal(B.dmg[0].src, 'a');
    assert.equal(e.status.burn, 2);
    assert.ok(!f.status.burn, 'the ally is not blasted');
});

test('FROST: the lane turns to ice (water too) for 3 rounds; a shove onto its ice slides the lane\'s length; the thaw restores it', () => {
    const B = board();
    const a = B.mk('a', 1, 0, 3, { race: 'door agent' });
    B.terr['4,3'] = 'water';
    B.state.burningTiles['5,3'] = { x: 5, y: 3, t: 2 };
    const e = B.mk('e', 2, 3, 3);
    const d = B.place(a, 'gunFrostDoor', 1, 3, 1, 0);
    for (const x of [2, 3, 4, 5]) assert.equal(B.terr[x + ',3'], 'ice', x + ',3 frozen');
    assert.ok(!B.state.burningTiles['5,3'], 'the fire on the lane goes out');
    assert.equal(e.status.slow, 1); assert.equal(B.dmg[0].n, 30); assert.equal(B.dmg[0].el, 'ice');
    /* THE ICE RULE: a body shoved onto the ice keeps sliding the way it was going, until it leaves the ice */
    e.x = 9; e.y = 0;
    const v = B.mk('v', 2, 2, 2);
    B.D.resolveForcedSlide(v, 0, 1, 1, {});
    assert.equal(at(v), '2,4', 'shoved south onto the lane: slides on south, off the ice');
    const x = B.mk('x', 2, 2, 3);
    B.D.resolveForcedSlide(x, 1, 0, 1, {});
    assert.equal(at(x), '6,3', 'one tile of push east + the ice: the lane\'s whole length, to the first dry tile');
    /* the walk never slides (doMove's own rule owns it) */
    const wk = B.mk('wk', 2, 9, 5); wk.x = 3; wk.y = 3; B.D.resolveTileArrival(wk, { via: 'move', dirX: 1, dirY: 0 });
    assert.equal(at(wk), '3,3');
    /* the thaw: the round tick after 3 rounds restores the water and the grass */
    B.state.round = 4; B.g('_tickTimedTerrain')();
    assert.equal(B.terr['4,3'], 'water'); assert.equal(B.terr['2,3'], 'grass');
    assert.ok(B.logs.some(l => /ice thaws/.test(l)), 'the thaw is logged as ice');
    assert.ok(d.hp > 0);
});

test('MAW: the draught pulls every enemy in reach one tile in, the one beside it is bitten and spat out of the back; allies stay', () => {
    const B = board();
    const a = B.mk('a', 1, 5, 9, { race: 'door agent' });
    const n = B.mk('n', 2, 5, 4), far = B.mk('far', 2, 7, 3), ally = B.mk('al', 1, 4, 5), out = B.mk('o', 2, 9, 9);
    const d = B.place(a, 'gunMawDoor', 5, 5);   // no facing: the default face points away from the agent (north)
    assert.equal(d.faceY, -1);
    assert.equal(n.hp, 950, 'bitten (50)'); assert.equal(n.status.stagger, 1);
    assert.equal(at(n), '5,6', 'pulled onto the door, bitten, spat out of the back (south)');
    assert.equal(at(far), '6,4', 'the one two tiles out drawn one tile in (the diagonal)');
    assert.equal(at(ally), '4,5', 'the owner\'s side is never drawn');
    assert.equal(at(out), '9,9', 'out of reach');
    /* an enemy stepping into reach is drawn at once (E′), once a round */
    const s = B.mk('s', 2, 8, 8); s.x = 7; s.y = 7; B.D.resolveTileArrival(s, { via: 'move' });
    assert.equal(at(s), '6,6', 'drawn in on arrival');
    s.x = 7; s.y = 7; B.D.resolveTileArrival(s, { via: 'move' });
    assert.equal(at(s), '7,7', 'once a round');
});

test('LASER: the beam runs to a wall, hits enemies only, turns on a prism toward the enemy side, and burns a walker crossing it', () => {
    const B = board();
    const a = B.mk('a', 1, 0, 0, { race: 'door agent' });
    B.terr['7,2'] = 'wall';
    const e = B.mk('e', 2, 4, 2), f = B.mk('f', 1, 5, 2), behind = B.mk('b', 2, 8, 2);
    const d = B.place(a, 'gunLaserDoor', 1, 2, 1, 0);
    assert.deepEqual([...B.g('standingDoorLaneTiles')(d)].map(t => t.x + ',' + t.y), ['2,2', '3,2', '4,2', '5,2', '6,2'], 'to the wall');
    assert.deepEqual(B.dmg.map(h => h.id), ['e'], 'the enemy only; the ally and the one past the wall are spared');
    assert.equal(B.dmg[0].n, 60); assert.equal(B.dmg[0].type, 'tech'); assert.equal(B.dmg[0].el, 'lightning');
    /* a prism at (3,2) turns it toward the side with more enemies (south here: two enemies down column 3) */
    B.state.mirrors.push({ x: 3, y: 2, hp: 3, owner: 2 });
    B.mk('s1', 2, 3, 5); B.mk('s2', 2, 3, 7);
    const beam = [...B.g('standingDoorLaneTiles')(d)].map(t => t.x + ',' + t.y);
    assert.deepEqual(beam.slice(0, 3), ['2,2', '3,2', '3,3'], 'turned south at the prism: ' + beam.join(' '));
    assert.ok(beam.includes('3,9') && !beam.includes('4,2'), 'down to the edge, never on past the prism');
    /* a walker crossing the beam (not ending on it) is burned once a round */
    const w = B.mk('w', 2, 9, 9); B.dmg.length = 0;
    B.g('gunDoorWalkCross')(w, 3, 4);
    assert.deepEqual(B.dmg.map(h => h.id), ['w']);
    B.g('gunDoorWalkCross')(w, 3, 6);
    assert.equal(B.dmg.length, 1, 'once a round');
    const walk = between(BT, 'const _laserNet = _enemyBeamTilesFor(unit);', 'let _walkAnimActive = false;');
    assert.ok(/gunDoorWalkCross\(unit, step\.x, step\.y\)/.test(walk), 'the walk loop calls it');
});

test('LIGHT: its side in the shaft heals and is cleansed; the other side takes the holy blast + Blind', () => {
    const B = board();
    const a = B.mk('a', 1, 0, 1, { race: 'door agent' });
    const f = B.mk('f', 1, 1, 3, { hp: 500, status: { burn: 2, stagger: 1 } }), e = B.mk('e', 2, 1, 4);
    B.place(a, 'gunLightDoor', 1, 2, 0, 1);
    assert.deepEqual(B.heals.map(h => h.id), ['f']); assert.equal(f.hp, 540);
    assert.ok(!f.status.burn && !f.status.stagger, 'cleansed');
    assert.deepEqual(B.dmg.map(h => h.id), ['e']); assert.equal(B.dmg[0].n, 45); assert.equal(B.dmg[0].type, 'divine');
    assert.equal(e.status.blind, 1);
});

test('THE CPU: the placer finds a lane / a beam / a draught worth a door, and faces it at the enemies', () => {
    for (const [id, face] of [['gunHellDoor', true], ['gunFrostDoor', true], ['gunLaserDoor', true], ['gunLightDoor', true], ['gunMawDoor', false]]) {
        const B = board();
        const a = B.mk('a', 1, 2, 2, { race: 'door agent' });
        B.mk('e1', 2, 4, 5); B.mk('e2', 2, 4, 6);
        const pick = B.g('doorGunAiPick')(a, B.D.SPELL_BY_ID[id]);
        assert.ok(pick && pick.score > 0, id);
        if (face) assert.ok(pick.face, id + ' faces');
    }
});

test('THE SOURCE SITES: the ice rule in the chain, the direction on the slide\'s landing, the doors\' turn gate, online, the look', () => {
    const chain = between(BT, '        function resolveTileArrival(unit, opts = {}) {', '        window.resolveTileArrival = resolveTileArrival;');
    assert.ok(chain.indexOf('THE ICE RULE') > chain.indexOf('// ── B · THE GROUND') && chain.indexOf('THE ICE RULE') < chain.indexOf('// ── C · THE PICKUPS'), 'B′ sits after B');
    assert.ok(/_applyKnockbackHazard\(target, \{ fxDelayMs: [^\n]*dirX: Math\.sign\(dx \|\| 0\), dirY: Math\.sign\(dy \|\| 0\) \}\)/.test(BT), 'the slide hands its direction to the landing');
    assert.ok(/if \(!_gunDoorTurnWanted\(door\)\) \{ next\(\); return; \}/.test(BT), 'an empty stream takes no round-end beat');
    const vfx = read('three-vfx-effects.js');
    for (const k of ['gunHellDoor', 'gunFrostDoor', 'gunMawDoor', 'gunLaserDoor', 'gunLightDoor']) for (const b of ['open', 'act', 'hit', 'break', 'fold']) assert.ok(vfx.includes(`'${k}:${b}':`), k + ':' + b);
    const rend = read('three-renderer.js');
    assert.ok(/d\.door === 'hell'/.test(rend) && /d\.door === 'laser'/.test(rend), 'the dresses');
    assert.ok(/_gustStreamStreaks|gust stream/i.test(rend), 'the standing wind is drawn');
    const ai = read('ai.js');
    assert.ok(/window\.gustStreamAt/.test(ai), 'the CPU reads the stream');
});
