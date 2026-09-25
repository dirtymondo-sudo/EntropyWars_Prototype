// door-gun-board.test.js — THE STANDING DOORS, the door wheel Phase 1 (DOOR_GUN_PLAN.md §3.2–§3.4, 2026-09-25).
// battle.js's DOOR block (DOOR_RULES … the standing doors) and THE CHAIN REACTION (resolveTileArrival) run together in
// a vm over data.js's real DOOR_GUN_DOORS / DOOR_GUN_RULES / CAPTURE_RULES with a 10×10 board stubbed round them:
// PLACE → its act fires at once; the Gust's wind blows EVERY body in the lane (the user: allies too), the far one first,
// to the lane's end + 1; a body swung into a gust lane is blown onto a capture door and TAKEN (E′ before, D′ at the
// landing); the Archers' volley; the cap (2 per player) folds the oldest; a Keyholder walks through wind; E′ acts once
// per door per unit per round; THE DOORS' TURN; the aim's two clicks; enemies break a door. Plus the source sites.
// Repo-only.
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

function board(opts) {
    opts = opts || {};
    const D = loadGameData();
    const logs = [], dmg = [], slides = [];
    const state = { round: 1, phase: 'battle', doors: [], units: [], partyBag: { seat: 1, items: {} }, bombs: [], traps: [],
        _deployedObjects: [], _activeZones: [], activeWeather: [], autoPlayers: {}, fogOfWar: false };
    const W = 10, H = 10;
    const inside = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
    const unitAt = (x, y) => state.units.find(u => !u.dead && u.x === x && u.y === y) || null;
    Object.assign(D, {
        state, logs,
        isInside: inside, unitAt, bw: () => W, bh: () => H,
        getTerrainRule: () => ({ passable: true }), getTerrainAt: () => 'grass', canOccupy: () => true,
        isRangeBlockedByTerrain: () => false, isInVision: () => true, getHeightAt: () => 0,
        getEffectiveSpellRange: (u, sp) => sp.range,
        _partyBagOn: () => !!(state.partyBag && state.partyBag.items), isOnlineMatch: () => false,
        unitHomePlayer: u => u.player, randInt: n => 7, engineRandInt: n => 4, actionMs: ms => ms,
        setUnitFacing: () => {}, _skipVisuals: () => true,
        addLog: m => logs.push(String(m)), coordLabel: (x, y) => x + ',' + y, unitDisplayName: u => u.name || u.id,
        showFloatingTextAtTile: () => {}, showFloatingTextForUnit: () => {}, playSfx: () => {}, playDoorSfx: () => {},
        invalidateVisionCache: () => {}, scheduleBoardRender: () => {}, markDirty: () => {}, checkWin: () => {},
        unitHasStatus: (u, k) => !!(u && u.status && (u.status[k] | 0) > 0),
        clearStatus: (u, k) => { delete u.status[k]; },
        applyStatusPayload: (u, p) => { u.status[p.id] = p.duration; return true; },
        unitFromId: id => state.units.find(u => u.id === id) || null,
        isEnemyUnit: (a, b) => a.player !== b.player,
        getUnitPushDistance: (u, n) => n,
        applyDamageToUnit: (u, n, label, o) => { dmg.push({ id: u.id, n, src: o && o.sourceUnit ? o.sourceUnit.id : null }); u.hp -= n; if (u.hp <= 0) u.dead = true; },
        triggerStatusWiggle: () => {},
        _benchOn: () => false, _gauntletReservesAlive: () => 0, _encLeadUnit: () => null,
        getUnitLevel: u => u.level || 10, isUnitAirborne: u => !!u.flying, unitPassiveValue: (u, k) => (u.passives || {})[k] || null,
        getLinePoints: () => [], unitPassiveValueFor: () => null,
        /* THE CHAIN's own neighbours (chain-reaction.test.js stubs them the same way) */
        canFly: u => !!u.flying, getGravityFieldAt: () => null, forceGroundUnit: () => false,
        _isWetTile: () => false, _isLavaTile: () => false, _tileIsBurning: () => false, TERRAIN_RULES: {},
        _soakUnit() {}, ensureUnitStatus: u => (u.status = u.status || {}), _burnUnitOnTile() {},
        checkPixieDustPickup: () => false, collectMatDropsAt() {}, checkTrapTrigger: () => false,
        updateSmokeZoneCloak() {}, checkWarpRuneTrigger: () => false, detonateDeployedObject() {},
        WEATHER_REGISTRY: {}, animateDisplacement() {}, applyBlowback: () => ({ pushed: false }),
        /* the slide: a body steps along (dx, dy) until the board edge or a body stops it, then lands through the chain
           (battle.js resolveForcedSlide does exactly that, with walls / hazards / bump damage on top) */
        resolveForcedSlide: (u, dx, dy, dist, o) => {
            let n = 0;
            while (n < dist) {
                const nx = u.x + dx, ny = u.y + dy;
                if (!inside(nx, ny) || unitAt(nx, ny)) break;
                u.x = nx; u.y = ny; n++;
            }
            slides.push({ id: u.id, n, to: u.x + ',' + u.y, by: o && o.byUnit ? o.byUnit.id : null });
            if (n) D.resolveTileArrival(u, { via: 'displaced' });
            return { moved: n };
        },
    });
    vm.runInContext('let _encMatch = null;\n' + CHAIN_SRC + '\n' + DOOR_SRC + '\nthis.resolveTileArrival = resolveTileArrival;', D);
    const mk = (id, player, x, y, o) => { const u = Object.assign({ id, player, x, y, z: 0, hp: 1000, maxHp: 1000, ap: 2, status: {}, items: {}, types: ['human'], race: 'grey', name: id }, o || {}); state.units.push(u); return u; };
    const g = n => vm.runInContext(n, D);
    const place = (u, key, x, y, fx, fy) => g('doorGunPlace')(u, D.SPELL_BY_ID[key], x, y, fx || 0, fy || 0, {});
    return { D, state, logs, dmg, slides, mk, g, place };
}
const at = u => u.x + ',' + u.y;

test('the rows: the wheel is the Door Agent\'s alone — a Freelancer never borrows a door', () => {
    const D = loadGameData();
    assert.deepEqual([...D.unitSpellPoolParts('door agent', 'Agent').wheel], ['gunGustDoor', 'gunArchersDoor', 'gunHellDoor', 'gunMawDoor', 'gunFrostDoor', 'gunLaserDoor', 'gunLightDoor']);
    for (const [race, job] of [['freelancer', 'Freelancer'], ['human', 'Freelancer'], ['knight', 'Freelancer']]) {
        const p = D.unitSpellPoolParts(race, job);
        for (const k of Object.keys(p)) assert.ok(!(p[k] || []).some(s => /^gun.*Door$/.test(typeof s === 'string' ? s : s.id)), race + ' ' + k);
    }
    for (const id of ['gunGustDoor', 'gunArchersDoor', 'gunHellDoor', 'gunMawDoor', 'gunFrostDoor', 'gunLaserDoor', 'gunLightDoor']) {
        const s = D.SPELL_BY_ID[id];
        assert.equal(s.kind, 'doorDeploy'); assert.equal(s.apCost, 1); assert.equal(s.range, D.DOOR_GUN_RULES.range);
        assert.equal(D.DOOR_GUN_DOORS[s.door].spell, id, 'the table and the row name each other');
    }
});

test('PLACE → THE ACT: a Gust Door lands facing its lane and blows EVERY body in it (an ally too), the far one first, to the lane\'s end + 1', () => {
    const B = board();
    const a = B.mk('a', 1, 1, 2, { race: 'door agent' });
    const ally = B.mk('f', 1, 4, 2), e = B.mk('e', 2, 5, 2), off = B.mk('o', 2, 5, 3);
    const d = B.place(a, 'gunGustDoor', 3, 2, 1, 0);
    assert.ok(d && d.kind === 'standing' && d.door === 'gust' && d.pairId === d.id && d.open && d.fixed);
    assert.equal(d.faceX, 1); assert.equal(d.faceY, 0); assert.equal(d.owner, 1); assert.equal(d.ownerId, 'a');
    assert.equal(d.hp, 3, 'three hits');
    assert.ok(!('ownerUnit' in d) && Object.values(d).every(v => !(v && typeof v === 'object' && v.hp)), 'ids only (RULE #2)');
    assert.deepEqual([...B.g('standingDoorLaneTiles')(d)].map(t => t.x + ',' + t.y), ['4,2', '5,2', '6,2', '7,2']);
    assert.equal(at(e), '8,2', 'the enemy: lane end (7) + 1');
    assert.equal(at(ally), '7,2', 'the ally is blown too — stopped by the enemy it followed');
    const real = B.slides.filter(s => s.n > 0);
    assert.deepEqual(real.map(s => s.id), ['e', 'f'], 'the far body first');
    assert.equal(B.slides[0].by, 'a', 'the owner is credited for a hostile');
    assert.equal(B.slides[1].by, null, 'never for an ally');
    assert.equal(at(off), '5,3', 'a body beside the lane is untouched');
    assert.equal(real.length, 2, 'the ally pinned in the lane by the enemy stays pinned (the stream tries, nothing moves)');
});

test('SWING → GUST → CAPTURE: a body shoved into a gust lane is blown onto a capture door and TAKEN', () => {
    const B = board();
    const a = B.mk('a', 1, 1, 4, { race: 'door agent', items: { captureDoor: 1 } });
    const b = B.mk('b', 1, 6, 6, { items: { captureDoor: 1 } });
    const e = B.mk('e', 2, 3, 2, { hp: 400 }); B.mk('e2', 2, 9, 9);
    const gust = B.place(a, 'gunGustDoor', 2, 4, 1, 0);
    assert.equal(B.slides.length, 0, 'an empty lane: the act blows nobody');
    const cap = B.g('captureDoorPlace')(b, 7, 4, 'captureDoor');
    assert.ok(cap && cap.kind === 'capture', 'the one-way door at the gust\'s landing (6 + 1)');
    assert.equal(B.g('standingDoorsOf')(1).length, 1, 'a capture door never counts against the standing cap');
    /* the Swing Door's hinge push is a forced slide like any other — it lands the body in the lane */
    B.D.resolveForcedSlide(e, 0, 1, 2, { byUnit: a });
    assert.equal(at(e), '7,4', 'swung to (3,4), blown 4 on to the capture door');
    assert.equal(cap.held && cap.held.unitId, 'e', 'D′ at the landing: the door takes it');
    assert.equal(e.status.captured, 99);
    assert.ok(/^c\d+$/.test(gust.laneStamps.e), 'E′ stamped the body for this chain (the stream)');
});

test('ARCHERS: the volley looses 3 arrows at the nearest hostile it can see; allies and the far enemy are spared; it moves nobody', () => {
    const B = board();
    const a = B.mk('a', 1, 1, 1, { race: 'door agent' });
    const near = B.mk('n', 2, 5, 5), far = B.mk('x', 2, 9, 9), ally = B.mk('f', 1, 4, 3);
    const d = B.place(a, 'gunArchersDoor', 3, 3);
    assert.equal(d.door, 'archers');
    assert.deepEqual(B.dmg.map(h => h.id), ['n', 'n', 'n'], 'three arrows, the nearest enemy');
    assert.ok(B.dmg.every(h => h.n === 25 && h.src === 'a'), 'arrowDmg each, credited to the agent');
    assert.equal(near.hp, 925); assert.equal(far.hp, 1000); assert.equal(ally.hp, 1000);
    assert.equal(at(near), '5,5'); assert.equal(B.slides.length, 0);
    /* a hostile stepping into the radius is shot at once (E′), once a round */
    far.x = 6; far.y = 6; B.D.resolveTileArrival(far, { via: 'move' });
    assert.equal(far.hp, 925, 'E′: the arrival is shot');
    far.x = 7; far.y = 6; B.D.resolveTileArrival(far, { via: 'move' });
    assert.equal(far.hp, 925, 'the same door, the same body, the same round: once');
    ally.x = 4; ally.y = 4; B.D.resolveTileArrival(ally, { via: 'move' });
    assert.equal(ally.hp, 1000, 'never at its own side');
});

test('THE CAP: two standing doors per PLAYER — a third folds the oldest; the other player\'s doors never count', () => {
    const B = board();
    const a = B.mk('a', 1, 1, 1, { race: 'door agent' }), a2 = B.mk('a2', 1, 1, 8, { race: 'door agent' });
    const p2 = B.mk('p', 2, 8, 1, { race: 'door agent' });
    const d1 = B.place(a, 'gunArchersDoor', 2, 2);
    B.state.round = 2; const d2 = B.place(a2, 'gunArchersDoor', 2, 7);
    const q = B.place(p2, 'gunArchersDoor', 7, 2);
    assert.equal(B.g('standingDoorsOf')(1).length, 2);
    B.state.round = 3; const d3 = B.place(a, 'gunGustDoor', 3, 3, 0, 1);
    const mine = B.g('standingDoorsOf')(1);
    assert.deepEqual([...mine].map(d => d.id), [d2.id, d3.id], 'the oldest (round 1) folded — whichever agent placed it');
    assert.ok(!B.state.doors.includes(d1));
    assert.ok(B.state.doors.includes(q), 'player 2\'s door stands');
    assert.ok(B.logs.some(l => /Archers' Door/.test(l) && /fold/i.test(l)), B.logs.join('\n'));
});

test('A KEYHOLDER WALKS THROUGH WIND: the lane never moves a doorImmune body — at the act, on arrival — but arrows still find it', () => {
    const B = board();
    const a = B.mk('a', 1, 1, 2, { race: 'door agent' });
    const k = B.mk('k', 2, 5, 2, { passives: { doorImmune: true } });
    B.place(a, 'gunGustDoor', 3, 2, 1, 0);
    assert.equal(at(k), '5,2', 'the act');
    k.x = 6; B.D.resolveTileArrival(k, { via: 'move' });
    assert.equal(at(k), '6,2', 'the arrival');
    B.state.round = 2; B.g('processDoorActs')(() => {});
    assert.equal(at(k), '6,2', 'THE DOORS\' TURN');
    B.place(a, 'gunArchersDoor', 4, 4);
    assert.ok(k.hp < 1000, 'the archers still shoot it');
});

test('THE GUST STREAM: every entry is blown (the same round too); the doors\' turn only blows a body still stuck in it', () => {
    const B = board();
    const a = B.mk('a', 1, 1, 2, { race: 'door agent' });
    const e = B.mk('e', 2, 4, 0);
    const d = B.place(a, 'gunGustDoor', 3, 2, 1, 0);
    e.x = 4; e.y = 2; B.D.resolveTileArrival(e, { via: 'move' });
    assert.equal(at(e), '8,2', 'walked into the lane: blown at once');
    e.x = 5; e.y = 2; B.D.resolveTileArrival(e, { via: 'move' });
    assert.equal(at(e), '8,2', 'the same round, back in: the stream blows it again');
    B.state.round = 2;
    const acted = []; const orig0 = B.g('_gunDoorAct');
    B.D._gunDoorAct = (door, o) => { acted.push(door.id); return orig0(door, o); };
    vm.runInContext('_gunDoorAct = this._gunDoorAct;', B.D);
    B.g('processDoorActs')(() => {});
    assert.deepEqual(acted, [], 'an empty stream takes no round-end beat');
    /* a body pinned in the lane (the tile past the end is held) is blown once the way opens, at the doors' turn */
    const p = B.mk('p', 2, 6, 2);
    B.D.resolveTileArrival(p, { via: 'move' });
    assert.equal(at(p), '7,2', 'walked in, blown, and stopped at the lane\'s end by the body past it');
    e.dead = true;
    B.g('processDoorActs')(() => {});
    assert.deepEqual(acted, [d.id], 'a body still in the stream: the door acts');
    assert.equal(at(p), '8,2', 'blown to the end + 1');
    /* two gusts facing each other never juggle a body past one bounce each */
    const B3 = board(); const a3 = B3.mk('a', 1, 0, 0, { race: 'door agent' });
    B3.place(a3, 'gunGustDoor', 1, 5, 1, 0); B3.place(a3, 'gunGustDoor', 7, 5, -1, 0);
    const j = B3.mk('j', 2, 3, 5); B3.slides.length = 0;
    B3.D.resolveTileArrival(j, { via: 'move' });
    assert.ok(B3.slides.length <= 3, 'bounded: ' + B3.slides.length);
    /* two doors act in placement order */
    const B2 = board(); const a2 = B2.mk('a', 1, 0, 0, { race: 'door agent' });
    const g1 = B2.place(a2, 'gunArchersDoor', 1, 3); B2.state.round = 2; const g2 = B2.place(a2, 'gunArchersDoor', 3, 1);
    const tgt = B2.mk('t', 2, 2, 2); B2.dmg.length = 0; B2.state.round = 3;
    let order = []; const orig = B2.g('_gunDoorAct');
    B2.D._gunDoorAct = (door, o) => { order.push(door.id); return orig(door, o); };
    vm.runInContext('_gunDoorAct = this._gunDoorAct;', B2.D);
    B2.g('processDoorActs')(() => {});
    assert.deepEqual(order, [g1.id, g2.id]);
    assert.equal(B2.dmg.length, 6, 'both volleys land on the one enemy');
    assert.equal(tgt.hp, 850);
});

test('THE AIM: a lane door takes two clicks (the tile, then the face); a radius door one; a CPU seat places in one call', () => {
    const B = board();
    const a = B.mk('a', 1, 2, 2, { race: 'door agent' }); B.mk('e', 2, 5, 6); B.mk('e2', 2, 5, 7);
    const gust = B.D.SPELL_BY_ID.gunGustDoor, arch = B.D.SPELL_BY_ID.gunArchersDoor;
    const aim = B.g('doorGunAimResolve');
    assert.equal(aim(a, gust, 2, 2, {}).error, 'tile', 'never the placer\'s own tile');
    assert.equal(aim(a, gust, 8, 8, {}).error, 'tile', 'out of range');
    const first = aim(a, gust, 5, 3, {});
    assert.deepEqual({ ...first }, { x: 5, y: 3, pick: true }, 'the first click only picks');
    B.state._spellPick1 = { tile: true, id: null, spellId: 'gunGustDoor', x: 5, y: 3 };
    const south = aim(a, gust, 5, 6, {});
    assert.deepEqual([south.x, south.y, south.faceX, south.faceY, south.pick], [5, 3, 0, 1, false], 'the second click turns it');
    const again = aim(a, gust, 5, 3, {});
    assert.deepEqual([again.faceX, again.faceY], [1, 0], 'the tile again: the default face, away from the placer');
    B.state._spellPick1 = null;
    const one = aim(a, arch, 4, 4, {});
    assert.equal(one.pick, false, 'a radius door takes one click');
    const cpu = aim(a, gust, 5, 3, { auto: true });
    assert.deepEqual([cpu.faceX, cpu.faceY, cpu.pick], [0, 1, false], 'the CPU faces the lane with the enemies');
    const tiles = B.g('doorGunFacingTiles')(gust, { x: 5, y: 3 });
    assert.ok(tiles.some(t => t.x === 5 && t.y === 3) && tiles.some(t => t.x === 9 && t.y === 3) && tiles.some(t => t.x === 1 && t.y === 7));
    const pick = B.g('doorGunAiPick')(a, gust);
    assert.ok(pick && pick.score > 0 && pick.face, 'the CPU\'s placer finds a lane');
});

test('ENEMIES BREAK A DOOR: three hits from the other side; its owner\'s side cannot', () => {
    const B = board();
    const a = B.mk('a', 1, 1, 1, { race: 'door agent' }), f = B.mk('f', 1, 3, 2), e = B.mk('e', 2, 4, 3);
    const d = B.place(a, 'gunArchersDoor', 3, 3);
    const hit = B.g('damageDoorAt');
    assert.equal(hit(3, 3, f), false, 'an ally never breaks it');
    hit(3, 3, e); hit(3, 3, e); assert.equal(d.hp, 1);
    hit(3, 3, e);
    assert.ok(!B.state.doors.includes(d), 'broken');
    assert.equal(B.g('standingDoorAt')(3, 3), null);
});

test('THE SOURCE SITES: the chain order, the cast, the end of the round, online, the AI, the painter, the look', () => {
    const chain = between(BT, '        function resolveTileArrival(unit, opts = {}) {', '        window.resolveTileArrival = resolveTileArrival;');
    const iD = chain.indexOf('// ── D′ · THE ONE-WAY DOOR'), iE = chain.indexOf('// ── E · THE ZONES'), iE2 = chain.indexOf('// ── E′ · THE STANDING DOORS'), iF = chain.indexOf('// ── F · THE VORTEX');
    assert.ok(iD > 0 && iD < iE && iE < iE2 && iE2 < iF, 'D′ · E · E′ · F');
    assert.ok(/_chainStandingDoors\(unit, opts\)/.test(chain));
    const cast = between(BT, 'let _gunDoorAim = null;', '// ── Blood Frenzy');
    assert.ok(/doorGunAimResolve\(unit, spell, x, y, \{ auto: _gdAuto \}\)/.test(cast));
    assert.ok(/state\.controllers\?\.\[unit\.player\] === CTRL\.AI \|\| !!state\.autoPlayers\?\.\[unit\.player\]/.test(cast), 'auto only for a CPU / auto seat — a human picks the face');
    assert.ok(/else if \(spell\.kind === 'doorDeploy'\)/.test(BT) && /doorGunPlace\(unit, spell,/.test(BT), 'the kind branch places');
    assert.ok(/doorDeploy:\s+\{ minRange: 1, offensive: false, tileTargeted: true/.test(BT), 'SPELL_KIND_META');
    const eor = between(BT, 'processDoorActs(function _afterDoorActsPhase() {', '});   // _afterDoorActsPhase');
    assert.ok(eor.length > 100, 'the rest of the round waits on THE DOORS\' TURN');
    assert.ok(/processDoorActs\(function \(\) \{\}\)/.test(BT), 'the quiet upkeep acts too');
    const on = read('online.js');
    assert.ok(/_tcSpell\.kind === 'doorDeploy' && typeof doorGunNeedsFacing === 'function' && doorGunNeedsFacing\(_tcSpell\)/.test(on), 'the guest sends its first click with the second');
    assert.ok(/_spellPick1: 1,/.test(on), 'the pick stays per-viewer (the snapshot skips it)');
    assert.ok(/state\._spellPick1 = _dSp \? \{ tile: true, id: null, spellId: _dSp\.id, x: data\.pickX \| 0, y: data\.pickY \| 0 \}/.test(on), 'the host seats the guest\'s first click');
    const ai = read('ai.js');
    assert.ok(/kind === 'doorDeploy'/.test(ai) && /window\.doorGunAiPick\(unit, spell\)/.test(ai));
    assert.ok(/doorGunLegalTiles|standingDoorLaneTiles/.test(read('ui.js')), 'the painter');
    const vfx = read('three-vfx-effects.js');
    for (const k of ['gunGustDoor', 'gunArchersDoor']) for (const b of ['open', 'act', 'hit', 'break', 'fold']) assert.ok(vfx.includes(`'${k}:${b}':`), k + ':' + b);
    const rend = read('three-renderer.js');
    assert.ok(/_standingDoorDress\(g, d,/.test(rend) && /_buildStandingDoorLane3D\(/.test(rend), 'the dress and the lane decal');
    assert.ok(/'attack:door'/.test(read('hud.js')), 'the tile card offers the attack');
});
