/* THE DOOR WHEEL — Phase 0 (DOOR_GUN_PLAN.md §9, 2026-09-25): the door gun's table (pure), the ledger + its merge,
   the wheel pool (the Door Agent only), the tiers, the Door Agent's new kit (Swing Door + Door Dash on rung I, B&E
   joins Air Mail on II, Door to the Face retired with its saves mapped), and SWING DOOR's hinge run for real in a
   vm sandbox (battle.js swingDoorResolve / swingDoorHingeTiles with stubs), plus source guards on the engine sites
   the two shot doors touch (the cast's remap, the push from the hinge, the travel, the dash, the painter). */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { loadGameData } = require('./load-data');

const D = loadGameData();
const read = f => fs.readFileSync(path.join(__dirname, f), 'utf8');
const battle = read('battle.js'), ui = read('ui.js'), vfx = read('three-vfx-effects.js'), pb = read('party-builder.js');

/* data.js / battle.js values live in vm realms — compare plain copies */
const deq = (a, b, m) => assert.deepEqual(JSON.parse(JSON.stringify(a)), JSON.parse(JSON.stringify(b)), m);

function between(src, a, b) {
    const i = src.indexOf(a); assert.ok(i >= 0, 'missing anchor ' + a);
    const j = src.indexOf(b, i); assert.ok(j > i, 'missing end anchor ' + b);
    return src.slice(i, j);
}

test('the table: the rules carry the user\'s three rulings, every door row is well formed', () => {
    const R = D.DOOR_GUN_RULES;
    assert.equal(R.standingCap, 2, 'two standing doors per PLAYER');
    assert.equal(R.agentOnly, true, 'only the Door Agent fires doors');
    assert.equal(R.windPushesAllies, true, 'the wind pushes allies too');
    assert.equal(R.allUnlocked, true, 'every door unlocked for now');
    const T = D.DOOR_GUN_DOORS;
    deq(Object.keys(T), ['threshold', 'swing', 'dash', 'capture', 'gust', 'archers', 'hell', 'maw', 'frost', 'laser', 'light']);
    const acts = new Set(['lanePush', 'volley', 'laneTerrain', 'pullIn', 'beam', 'laneLight']);
    const types = new Set(['human', 'divine', 'unholy', 'tech', 'anomaly', 'alien']);
    for (const [k, d] of Object.entries(T)) {
        assert.ok(d.name && d.kind && d.icon, k);
        if (d.kind !== 'standing') continue;
        assert.ok(acts.has(d.act), k + ' act');
        assert.ok(d.tier >= 2 && d.tier <= 3, k + ' tier');
        assert.ok(!!d.lane + !!d.radius + !!d.beam === 1, k + ' has exactly one reach');
        assert.ok(types.has(d.spellType), k + ' type');
        assert.ok(/^gun[A-Z]\w+Door$/.test(d.spell), k + ' spell id');
        assert.ok(d.unlock && vm.runInContext('!!PREBUILT_MAPS[' + JSON.stringify(d.unlock.site) + ']', D), k + ' unlock site ' + (d.unlock && d.unlock.site));
    }
    assert.equal(new Set(Object.values(T).filter(d => d.kind === 'standing').map(d => d.spellType)).size, 6, 'the six types are covered');
    assert.equal(T.swing.spell, 'raceSwingDoor');
    assert.equal(T.dash.spell, 'raceDoorDash');
    assert.ok(T.threshold.roomOnly && T.threshold.spell === null && T.capture.story === true);
});

test('the lane: 8 facings walk straight ahead (never behind, never the door\'s own tile), the board clips, radius and beam', () => {
    const W = { w: 12, h: 12 };
    for (const [fx, fy] of D.DOOR_GUN_FACINGS) {
        const t = D.doorGunLaneTiles({ door: 'gust', x: 5, y: 5, faceX: fx, faceY: fy }, W);
        assert.equal(t.length, 4, fx + ',' + fy);
        t.forEach((p, i) => { assert.equal(p.x, 5 + fx * (i + 1)); assert.equal(p.y, 5 + fy * (i + 1)); });
    }
    assert.equal(D.DOOR_GUN_FACINGS.length, 8);
    assert.equal(D.doorGunLaneTiles({ door: 'hell', x: 5, y: 5, faceX: 1, faceY: 0 }, W).length, 3, 'the hell tongue is 3');
    deq(D.doorGunLaneTiles({ door: 'gust', x: 1, y: 1, faceX: -1, faceY: 0 }, W), [{ x: 0, y: 1 }], 'the board edge clips');
    deq(D.doorGunLaneTiles({ door: 'gust', x: 5, y: 5, faceX: 0, faceY: 0 }, W), [], 'no face, no lane');
    const maw = D.doorGunLaneTiles({ door: 'maw', x: 5, y: 5 }, W);
    assert.equal(maw.length, 24, 'the maw pulls from a 5×5 minus its own tile');
    assert.ok(!maw.some(p => p.x === 5 && p.y === 5));
    assert.equal(D.doorGunLaneTiles({ door: 'archers', x: 0, y: 0 }, W).length, 24, 'a radius-4 disc clipped to the corner');
    assert.equal(D.doorGunLaneTiles({ door: 'laser', x: 0, y: 3, faceX: 1, faceY: 0 }, W).length, 11, 'the beam runs to the edge');
    deq(D.doorGunSnapFacing(3, -2), { faceX: 1, faceY: -1 });
    deq(D.doorGunSnapFacing(0, 5), { faceX: 0, faceY: 1 });
    deq(D.doorGunSnapFacing(-4, 1), { faceX: -1, faceY: 0 });
});

test('the wheel: wedge order, battle drops the room-only and the item, PvP drops the capture door, sealed reads the ledger', () => {
    const all = D.doorGunWheel(null);
    assert.equal(all.map(w => w.key).join(','), Object.keys(D.DOOR_GUN_DOORS).join(','));
    assert.ok(all.every(w => !w.sealed), 'allUnlocked: nothing sealed');
    const battle = D.doorGunWheel(null, { battle: true }).map(w => w.key);
    assert.ok(!battle.includes('threshold') && !battle.includes('capture') && battle.includes('swing'));
    assert.ok(!D.doorGunWheel(null, { story: false }).some(w => w.key === 'capture'), 'PvP never offers the capture door');
    /* the ledger decides once the flag is off */
    const R = D.DOOR_GUN_RULES;
    R.allUnlocked = false;
    try {
        const prof = { door: { hq: { gunDoors: { gust: '2026-09-25' } } }, progress: { hq: { gunDoors: { hell: '2026-09-24' } } } };
        assert.ok(D.doorGunUnlocked(prof, 'gust') && D.doorGunUnlocked(prof, 'hell'), 'local ∪ synced');
        assert.ok(!D.doorGunUnlocked(prof, 'laser'));
        assert.ok(D.doorGunUnlocked(prof, 'swing') && D.doorGunUnlocked(prof, 'threshold'), 'the starters are never sealed');
        const w = D.doorGunWheel(prof);
        assert.equal(w.find(x => x.key === 'laser').sealed, true);
        assert.equal(w.find(x => x.key === 'laser').place, 'prebuilt_cyberpunk', 'a sealed wedge names its place');
    } finally { R.allUnlocked = true; }
});

test('the ledger: hq.gunDoors merges earlier-day-wins, destination keys only, capped; the fold carries the local record', () => {
    const m = D.mergeProgressBlobs({ hq: { gunDoors: { gust: '2026-09-25', swing: '2026-09-01', __proto__x: '2026-01-01', laser: 'soon' } } },
        { hq: { gunDoors: { gust: '2026-09-20', frost: '2026-09-21' } } });
    deq(m.hq.gunDoors, { gust: '2026-09-20', frost: '2026-09-21' });
    assert.ok(vm.runInContext('ACH_MERGE_CAPS.gunDoors', D) >= 7);
    const hq = D.hqDoorSyncFold({}, { hq: { gunDoors: { maw: '2026-09-22' } } });
    deq(hq.gunDoors, { maw: '2026-09-22' });
});

test('the pool: the wheel is the Door Agent\'s alone, never borrowable, and holds only rows that exist', () => {
    const parts = D.unitSpellPoolParts('door agent', 'Agent');
    assert.ok(Array.isArray(parts.wheel));
    for (const id of parts.wheel) assert.ok(D.SPELL_BY_ID[id], id + ' is a real row');
    const expected = Object.values(D.DOOR_GUN_DOORS).filter(d => d.kind === 'standing' && D.SPELL_BY_ID[d.spell]).map(d => d.spell);
    deq(parts.wheel, expected, 'wedge order, rows that exist');
    deq(D.unitSpellPoolParts('door agent', 'Freelancer').wheel, expected, 'a Freelancer agent keeps the wheel');
    for (const race of ['homosapien', 'knight', 'wizard']) {
        const p = D.unitSpellPoolParts(race, 'Freelancer');
        deq(p.wheel, [], race + ' has no wheel');
        for (const d of Object.values(D.DOOR_GUN_DOORS)) if (d.spell) assert.ok(!p.borrowRace.includes(d.spell) || d.spell === 'raceSwingDoor' || d.spell === 'raceDoorDash', race + ' cannot borrow ' + d.spell);
    }
    const pool = D.unitSpellPool('door agent', 'Agent');
    for (const id of expected) assert.ok(pool.includes(id));
});

test('the tiers: the starters are Tier I, B&E moves to Tier II beside Air Mail, a wheel door reads its table tier', () => {
    assert.equal(D.spellTierOf('raceSwingDoor'), 1);
    assert.equal(D.spellTierOf('raceDoorDash'), 1);
    assert.equal(D.spellTierOf('raceBreakingEntering'), 2);
    assert.equal(D.spellTierOf('raceAirMail'), 2);
    assert.equal(D.spellTierOf('raceTrapdoor'), 3);
    assert.equal(D.spellTierOf('raceDropIn'), 4);
    assert.equal(D.doorGunSpellTier('gunHellDoor'), 3, 'a wheel door reads DOOR_GUN_DOORS');
    assert.equal(D.doorGunSpellTier('gunGustDoor'), 2);
    assert.equal(D.doorGunSpellTier('fireball'), 0);
    assert.equal(D.SPELL_BY_ID.raceSwingDoor.cost, 25);
    assert.equal(D.SPELL_BY_ID.raceBreakingEntering.cost, 50, 'the rung prices MP too');
});

test('stale saves: Door to the Face maps to Swing Door, the rest trims as ever', () => {
    assert.equal(D.SPELL_ID_RENAMED.raceDoorToTheFace, 'raceSwingDoor');
    deq(D.treeLegalSubset('door agent', 'Agent', null, ['raceDoorToTheFace', 'raceBreakingEntering', 'raceAirMail']),
        ['raceSwingDoor', 'raceBreakingEntering', 'raceAirMail']);
    deq(D.treeLegalSubset('door agent', 'Agent', null, ['raceDoorToTheFace', 'raceSwingDoor']), ['raceSwingDoor'], 'no duplicate');
    assert.ok(!D.SPELL_BY_ID.raceDoorToTheFace, 'the id is retired');
    assert.ok(D.isTreeLoadoutLegal('door agent', 'Agent', null, ['raceSwingDoor', 'raceDoorDash', 'raceBreakingEntering', 'raceAirMail']), 'both twins of both rungs');
});

/* ── SWING DOOR's hinge, run for real ──────────────────────────────────── */
function makeSwingCtx(extra) {
    const units = [
        { id: 'a1', player: 1, x: 2, y: 2, z: 0, race: 'door agent', hp: 500 },
        { id: 'e1', player: 2, x: 4, y: 2, z: 0, race: 'knight', hp: 500 },
        { id: 'e2', player: 2, x: 5, y: 5, z: 0, race: 'knight', hp: 500 },
        { id: 'f1', player: 1, x: 2, y: 4, z: 0, race: 'wizard', hp: 500 },
    ].concat((extra && extra.units) || []);
    const walls = new Set((extra && extra.walls) || []);
    const ctx = {
        state: { units, fogOfWar: false, autoPlayers: {} },
        window: {}, console,
        isInside: (x, y) => x >= 0 && y >= 0 && x < 8 && y < 8,
        unitAt: (x, y) => units.find(u => !u.dead && u.x === x && u.y === y) || null,
        isTerrainPassable: (x, y) => !walls.has(x + ',' + y),
        isEnemyUnit: (a, b) => a.player !== b.player,
        isInVision: () => true,
        getEffectiveSpellRange: (u, sp) => sp.range,
        getHeightAt: () => 0, _tileStandZ: () => 0,
        combatReach: (ax, ay, az, bx, by) => Math.abs(ax - bx) + Math.abs(ay - by),
        isRangeBlockedByTerrain: () => false,
        getUnitPushDistance: (u, n) => n,
        swingDoorPushDir: D.swingDoorPushDir,
    };
    vm.createContext(ctx);
    vm.runInContext(between(battle, '        function _swingHostileAt(unit, x, y, fogFree) {', '        window.swingDoorResolve = swingDoorResolve;'), ctx);
    vm.runInContext('this.swingDoorResolve = swingDoorResolve; this.swingDoorHingeTiles = swingDoorHingeTiles;', ctx);
    return ctx;
}
const SWING = { id: 'raceSwingDoor', range: 3, pushDistance: 2, hinge: true };

test('swing door: a hinge beside the enemy pushes it 2 straight away from the hinge — the player picks the side', () => {
    const c = makeSwingCtx();
    const a = c.state.units[0];
    const near = c.swingDoorResolve(a, SWING, 3, 2, {});
    assert.equal(near.victim.id, 'e1');
    deq(near.dir, { dx: 1, dy: 0 }, 'hinge on the near side: away from the agent');
    deq(near.landing, [{ x: 5, y: 2 }, { x: 6, y: 2 }]);
    const north = c.swingDoorResolve(a, SWING, 4, 1, {});
    deq(north.dir, { dx: 0, dy: 1 }, 'hinge to the north: pushed south, across the agent\'s line');
    const corner = c.swingDoorResolve(a, SWING, 3, 1, {});
    deq(corner.dir, { dx: 1, dy: 1 }, 'a corner hinge pushes on the diagonal');
});

test('swing door: the hinge must be EMPTY, in range, beside a hostile — a human click on the enemy is refused, a CPU seat picks the near hinge', () => {
    const c = makeSwingCtx({ walls: ['3,3'] });
    const a = c.state.units[0];
    assert.equal(c.swingDoorResolve(a, SWING, 4, 2, {}).error, 'notHinge', 'the enemy\'s own tile is not a hinge for a player');
    assert.equal(c.swingDoorResolve(a, SWING, 1, 1, {}).error, 'noVictim', 'no enemy beside it');
    assert.equal(c.swingDoorResolve(a, SWING, 3, 3, {}).error, 'notHinge', 'a wall is never a hinge');
    const auto = c.swingDoorResolve(a, SWING, 4, 2, { auto: true });
    deq(auto.hinge, { x: 3, y: 2 }, 'the CPU takes the hinge nearest itself');
    deq(auto.dir, { dx: 1, dy: 0 });
    const tiles = c.swingDoorHingeTiles(a, SWING);
    assert.ok(tiles.length > 0);
    for (const t of tiles) {
        assert.ok(!c.unitAt(t.x, t.y), 'empty');
        assert.ok(Math.abs(t.x - 2) + Math.abs(t.y - 2) <= 3, 'in range');
        const v = c.state.units.find(u => u.id === t.victimId);
        assert.ok(v.player === 2 && Math.max(Math.abs(v.x - t.x), Math.abs(v.y - t.y)) === 1, 'beside a hostile');
    }
    assert.ok(!tiles.some(t => t.x === 3 && t.y === 3), 'the wall is not listed');
    assert.ok(!tiles.some(t => t.x === 5 && t.y === 1), 'the far corner of e1 is 4 away — out of range');
    assert.ok(tiles.some(t => t.x === 4 && t.y === 1), 'the north side of e1 is in');
});

test('swing door: a body in the way shortens the forecast; a side neighbour beats a corner one', () => {
    const c = makeSwingCtx({ units: [{ id: 'e3', player: 2, x: 6, y: 2, z: 0, race: 'knight', hp: 500 }] });
    const a = c.state.units[0];
    deq(c.swingDoorResolve(a, SWING, 3, 2, {}).landing, [{ x: 5, y: 2 }], 'e3 stops the forecast at one tile');
    const c2 = makeSwingCtx({ units: [{ id: 'e4', player: 2, x: 4, y: 3, z: 0, race: 'knight', hp: 500 }] });
    /* hinge (3,3): e1 at (4,2) is a corner, e4 at (4,3) is a side → e4 */
    assert.equal(c2.swingDoorResolve(c2.state.units[0], SWING, 3, 3, {}).victim.id, 'e4');
});

test('source guards: the cast remaps the hinge, the push leaves from the hinge, the travel shoots the hinge, the dash, the painter', () => {
    const meta = between(battle, 'const _HINGE_KIND_META', 'function spellTileTeam(');
    assert.ok(/tileTargeted: true/.test(meta) && /offensive: true/.test(meta) && /if \(spell && spell\.hinge\) return _HINGE_KIND_META/.test(meta));
    const cast = between(battle, '/* 🚪 SWING DOOR (the door wheel, DOOR_GUN_PLAN §3.5)', '/* 📷 Cryptid');
    assert.ok(/swingDoorResolve\(unit, spell, x, y, \{ auto: _auto \}\)/.test(cast), 'the one resolver');
    assert.ok(/state\.controllers\?\.\[unit\.player\] === CTRL\.AI/.test(cast), 'auto only for a CPU / auto seat — never a player\'s pick');
    assert.ok(/unit\._swingHinge = \{ x: _sw\.hinge\.x, y: _sw\.hinge\.y, spellId: spell\.id \}/.test(cast), 'a plain record, never a unit ref (RULE #2)');
    assert.ok(/x = _sw\.victim\.x; y = _sw\.victim\.y/.test(cast));
    const post = between(battle, '/* 🚪 SWING DOOR: the push is straight away from the HINGE', 'if (spell.selfStun && !unit.dead)');
    assert.ok(/swingDoorPushDir\(_swH\.x, _swH\.y, target\.x, target\.y\)/.test(post));
    assert.ok(/delete unit\._swingHinge/.test(post), 'the stamp is spent');
    const travel = between(battle, '            doorGun(ctx) {', '            none(ctx) {');
    assert.ok(/window\._doorGeom\('raceSwingDoor:swing', tx, ty, \{ fromX: _swH\.x, fromY: _swH\.y \}\)/.test(travel));
    const range = between(battle, 'function getSpellRangeTiles(unit, spell) {', 'if (unit && spell && isSpellSelfCast(spell))');
    assert.ok(/spell\.hinge\) return swingDoorHingeTiles/.test(range), 'the range overlay is the hinges');
    const tele = between(battle, "            else if (spell.kind === 'teleport') {", "            else if (spell.kind === 'warpRune') {");
    assert.ok(/if \(spell\.doorGun\) \{/.test(tele) && /'raceDoorGun:shot', x, y/.test(tele) && /'raceBreakingEntering:door', tUnit\.x, tUnit\.y/.test(tele) && /'raceDoorDash:out', x, y/.test(tele), 'the dash: shot, in, out — all through _doorGeom (relayed)');
    const paint = between(ui, '// ── 🚪 SWING DOOR (the door wheel', '// ── Terrain-shaping spells');
    assert.ok(/window\.swingDoorResolve\(unit, spell, x, y, \{\}\)/.test(paint) && /sw\.landing\.forEach/.test(paint), 'the painter shows the victim and the landing');
    assert.ok(/'raceSwingDoor:swing':\s+function/.test(vfx) && /'raceDoorDash:out':\s+function/.test(vfx));
    assert.ok(!/'raceSwingDoor':\s+function/.test(vfx), 'never keyed by the spell id — the impact intent would double it');
    assert.ok(/wheel: 'DOOR WHEEL'/.test(pb) && /parts\.race\.concat\(parts\.job, parts\.wheel\)/.test(pb), 'the rack draws the wheel rows');
});
