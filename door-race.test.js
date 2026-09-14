/* THE DOOR AGENT (DOOR_RACE_DESIGN.md, 2026-09-14): the race tables, the
   seven abilities on their tree, the door object's rules run in a vm
   sandbox (battle.js "THE DOOR" block with stubs), and source guards on
   every engine site the door touches (gates, fog, sync, AI, HUD, VFX). */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { loadGameData } = require('./load-data');

const D = loadGameData();
const read = f => fs.readFileSync(path.join(__dirname, f), 'utf8');
const battle = read('battle.js'), map = read('map.js'), stateSrc = read('state.js'), online = read('online.js');
const ai = read('ai.js'), hud = read('hud.js'), ui = read('ui.js'), vfx = read('three-vfx-effects.js'), rend = read('three-renderer.js');
const sprites = read('sprites.js'), server = read('server.js');

function between(src, a, b) {
    const i = src.indexOf(a); assert.ok(i >= 0, 'missing anchor ' + a);
    const j = src.indexOf(b, i); assert.ok(j > i, 'missing end anchor ' + b);
    return src.slice(i, j);
}

const RACE = 'door agent';
const TREE_IDS = ['raceKnockKnock', 'raceBreakingEntering', 'raceSpecialDelivery', 'raceSlam', 'raceExit', 'raceLongWayRound', 'raceTrapdoor'];
const KINDS = ['door', 'doorBreach', 'doorDelivery', 'doorSlam', 'doorExit', 'doorTrap'];

test('door agent: every race table, both sides, the passive, the statuses', () => {
    assert.ok(D.AVAILABLE_RACES.includes(RACE));
    assert.equal(D.RACE_PROFILES[RACE].label, 'DOOR Agent');
    assert.equal(D.RACE_PROFILES[RACE].types.join(','), 'human,anomaly');
    assert.equal(D.RACE_DEFAULT_JOBS[RACE], 'Agent');
    assert.ok(D.RACE_BASE_STATS[RACE] && D.RACE_BASE_STATS[RACE].awr >= 80, 'they check their corners');
    assert.equal(D.RACE_PASSIVES[RACE].join(','), 'keyholder');
    const kh = D.PASSIVE_DEFS.keyholder;
    assert.ok(kh && kh.doorHits === 4 && kh.doorFreeToggle === true && kh.doorImmune === true);
    assert.ok(D.ACCT_STARTER_UNITS.includes(RACE));
    assert.ok(/'door agent'\]\);/.test(server) && /'door agent',/.test(server), 'server.js race list + starters');
    assert.ok(/'door agent': \{ folder: 'Homosapien'/.test(sprites) && /RACE_MODELS_3D\['door agent'\] = \{/.test(sprites), 'sprites.js path rule + cast models');
    const heat = D.ACH_CATALOG.find(a => a.id === 'champsMastered');
    assert.equal(heat.tiers[heat.tiers.length - 1], D.AVAILABLE_RACES.length);
    const dataSrc = read('data.js');
    for (const id of ['exited', 'castFromDoors']) {
        assert.ok(D.STATUS_DEFS[id], 'STATUS_DEFS.' + id);
        assert.ok(new RegExp('^    ' + id + ": '", 'm').test(dataSrc), 'STATUS_LIBRARY_DESCS.' + id);
    }
    assert.equal(D.STATUS_DEFS.exited.realm, true);
    assert.equal(D.STATUS_DEFS.exited.blockMove, true);
    assert.equal(D.STATUS_DEFS.castFromDoors.castFromDoors, true);
});

test('door agent: the tree is the homosapien shape and every row carries its kind', () => {
    const tree = D.RACE_TREE[RACE];
    assert.equal(tree.length, 4);
    assert.ok(Array.isArray(tree[0]) && Array.isArray(tree[1]) && !Array.isArray(tree[2]) && Array.isArray(tree[3]), 'twin · twin · single · twin capstone');
    const rows = D.RACE_ABILITIES[RACE];
    const byId = Object.fromEntries(rows.map(r => [r.id, r]));
    for (const id of TREE_IDS) assert.ok(byId[id], id);
    assert.equal(byId.raceKnockKnock.kind, 'door');
    assert.equal(byId.raceBreakingEntering.kind, 'doorBreach');
    assert.equal(byId.raceSpecialDelivery.kind, 'doorDelivery');
    assert.equal(byId.raceSlam.kind, 'doorSlam');
    assert.equal(byId.raceExit.kind, 'doorExit');
    assert.equal(byId.raceLongWayRound.kind, 'buff');
    assert.equal(byId.raceLongWayRound.statusEffects[0].id, 'castFromDoors');
    assert.equal(byId.raceTrapdoor.kind, 'doorTrap');
    assert.ok(byId.raceBreakingEntering.rearAttack && byId.raceSpecialDelivery.rearAttack, 'the rear-attack rider');
    assert.ok(byId.raceExit.apCost === 2 && byId.raceLongWayRound.apCost === 2 && byId.raceTrapdoor.apCost === 2);
    for (const k of KINDS) assert.ok(new RegExp('^    ' + k + ':\\s*\\{ simTargeting', 'm').test(read('data.js')), 'SIM_DEFAULTS.' + k);
    assert.ok(D.isCapstoneSpellId('raceLongWayRound') && D.isCapstoneSpellId('raceTrapdoor'), 'ring-3 capstones');
});

/* ── the door object, run for real ────────────────────────────────────── */
function makeDoorCtx() {
    const units = [
        { id: 'a1', player: 1, x: 1, y: 1, z: 0, race: 'door agent', _st: {} },
        { id: 'e1', player: 2, x: 6, y: 6, z: 0, _st: {} },
    ];
    const log = [];
    const ctx = {
        state: { units, doors: [], round: 3, phase: 'battle' },
        window: {},
        console,
        isInside: (x, y) => x >= 0 && y >= 0 && x < 8 && y < 8,
        unitAt: (x, y) => units.find(u => !u.dead && u.x === x && u.y === y) || null,
        // Production points exclude the source; a source-inclusive mock hid
        // the first-interior-door sight leak.
        getLinePoints: vm.runInNewContext(between(map, '        function getLinePoints(',
            '        function isRangeBlockedByTerrain(') + 'getLinePoints'),
        unitPassiveValue: (u, k) => (u && u.race === 'door agent') ? ({ doorHits: 4, doorFreeToggle: true, doorImmune: true })[k] : undefined,
        unitHasStatus: (u, id) => !!(u && u._st && u._st[id]),
        isRangeBlockedByTerrain: () => false,
        canOccupy: (x, y) => !units.some(u => u.x === x && u.y === y),
        isTowerTile: () => false, isObjectiveTile: () => false,
        getTerrainRule: () => ({ passable: true }), getTerrainAt: () => 'grass',
        getHeightAt: () => 0, nearestWalkableZ: () => 0,
        randInt: n => 7, coordLabel: (x, y) => x + ',' + y,
        unitDisplayName: u => u.id, addLog: s => log.push(s),
        showFloatingTextAtTile: () => {}, showFloatingTextForUnit: () => {},
        playSfx: () => {}, playDoorSfx: () => {}, _vfxTeleport: () => {}, _skipVisuals: () => true,
        markDirty: () => {}, scheduleBoardRender: () => {}, applyStatusPayload: () => true,
        log,
    };
    vm.createContext(ctx);
    vm.runInContext(between(battle, '        const DOOR_RULES = {', '        function _structureAt('), ctx);
    return ctx;
}

test('the door object: place, cap, toggle, wall, sight, hits, step-through, origins', () => {
    const c = makeDoorCtx();
    const g = c.window;
    const a1 = c.state.units[0], e1 = c.state.units[1];
    assert.equal(g.DOOR_RULES.hits, 3);
    assert.ok(g.doorTileFree(2, 1) && !g.doorTileFree(1, 1) && !g.doorTileFree(9, 9));
    const [A, B] = g.placeDoorPair(a1, 2, 1, 4, 3, { spellName: 'Knock Knock' });
    assert.equal(c.state.doors.length, 2);
    assert.equal(A.hp, 4, 'Keyholder: the owner\'s doors take 4 hits');
    assert.ok(A.open && B.open && A.pairId === B.pairId);
    assert.equal(g.doorTwin(g.doorAt(2, 1)).id, B.id);
    // a second pair by the same agent replaces the first (1 per agent)
    g.placeDoorPair(a1, 2, 2, 5, 5, { spellName: 'Knock Knock' });
    assert.equal(c.state.doors.length, 2);
    assert.equal(g.doorAt(2, 1), null, 'the old pair folded away');
    const A2 = g.doorAt(2, 2), B2 = g.doorAt(5, 5);
    // shut = a wall + blocks sight through it; open = neither
    assert.equal(g.doorBlocksMove(2, 2), false);
    assert.equal(g.doorBlocksSightBetween(0, 2, 4, 2), false);
    g.setDoorOpen(A2, false);
    assert.equal(g.doorBlocksMove(2, 2), true);
    assert.equal(g.doorBlocksSightBetween(0, 2, 4, 2), true, 'a shut door on the line blocks sight');
    assert.equal(g.doorBlocksSightBetween(0, 2, 2, 2), false, 'the endpoint itself is not interior');
    g.setDoorOpen(A2, true);
    // step-through: a unit ending a move ON an open door comes out of the twin
    a1.x = 2; a1.y = 2;
    assert.equal(g.doorStepThrough(a1), true);
    assert.ok(a1.x === 5 && a1.y === 5, 'out of the twin');
    // occupied far side → stays
    e1.x = 2; e1.y = 2; a1.x = 5; a1.y = 5;
    assert.equal(g.doorStepThrough(e1), false, 'the far side is occupied');
    a1.x = 1; a1.y = 1;
    assert.equal(g.doorStepThrough(e1), true, 'enemies use an open door too (D1)');
    assert.ok(e1.x === 5 && e1.y === 5);
    e1.x = 6; e1.y = 6;
    // hits: an enemy's attack takes one hit; your own door is not yours to break
    assert.equal(g.damageDoorAt(2, 2, a1), false, 'not your own door');
    assert.equal(g.damageDoorAt(2, 2, e1), true);
    assert.equal(g.doorAt(2, 2).hp, 3);
    g.damageDoorAt(2, 2, e1); g.damageDoorAt(2, 2, e1); g.damageDoorAt(2, 2, e1);
    assert.equal(c.state.doors.length, 0, 'at 0 the door AND its twin are gone');
    // The Long Way Round: origins are the twins of open doors beside the agent
    g.placeDoorPair(a1, 2, 1, 6, 5, { spellName: 'Knock Knock' });
    assert.equal(g.doorCastOrigins(a1).length, 0, 'no status, no origins');
    a1._st.castFromDoors = true;
    const org = g.doorCastOrigins(a1);
    assert.equal(org.length, 1);
    assert.ok(org[0].x === 6 && org[0].y === 5);
    assert.ok(g.doorCastOriginFor(a1, 6, 6, 2), 'the enemy beside the twin is in reach from it');
    assert.equal(g.doorCastOriginFor(a1, 6, 6, 2, { dist: () => 9 }), null);
    // Special Delivery reads the door within doorRange, then the twin's reach
    const sd = { kind: 'doorDelivery', doorRange: 2, range: 3 };
    assert.ok(g._doorOriginForSpell(a1, sd, 6, 6));
    a1.x = 0; a1.y = 7;   // too far from any door
    assert.equal(g._doorOriginForSpell(a1, sd, 6, 6), null);
    // EXIT: the enemy must stand on or beside one of your open doors
    const ex = { kind: 'doorExit', range: 1 };
    assert.ok(g._doorOriginForSpell(a1, ex, 6, 6));
    assert.equal(g._doorOriginForSpell(a1, ex, 3, 7), null);
    g.setDoorOpen(g.doorAt(6, 5), false);
    assert.equal(g._doorOriginForSpell(a1, ex, 6, 6), null, 'a shut door EXITs nobody');
});

test('source guards: every engine site the door touches', () => {
    for (const k of KINDS) assert.ok(new RegExp('^            ' + k + ':\\s*\\{ minRange', 'm').test(battle), 'SPELL_KIND_META.' + k);
    for (const k of KINDS) assert.ok(battle.includes("else if (spell.kind === '" + k + "') {"), 'doSpell branch ' + k);
    assert.ok(/doorBlocksMove\(nx, ny\)\) _deployBlocks = true/.test(battle) && /doorBlocksMove\(nx, ny\)\) _decoyBlocks = true/.test(battle), 'both path gates');
    assert.ok((map.match(/doorBlocksMove\(x, y\)\) return false/g) || []).length === 2, 'canOccupy + canOccupy3D');
    assert.ok(/doorBlocksSightBetween\(x1, y1, x2, y2\)\) return true;/.test(map), 'isRangeBlockedByTerrain');
    assert.ok(/for \(const d of state\.doors\) \{\s*if \(d\.owner !== player \|\| !d\.open/.test(map), 'computeVisibleTiles: the twin\'s 3×3');
    assert.ok(/doorStepThrough\(unit\);/.test(battle) && /_tetherFollow\(unit, _originX, _originY, _fromZ\);\s*\/\/ 🚪/.test(battle), 'finishMoveAt step-through');
    assert.ok(/if \(unit && unitHasStatus\(unit, 'exited'\)\) return true;/.test(battle), 'EXITED is realm-shielded from everyone');
    assert.ok(/state\._doorRearCast && state\._doorRearCast\.unitId === sourceUnit\.id/.test(battle), 'the rear rider');
    assert.ok(/state\._doorRearCast = \(spell\.rearAttack \|\| _doorOrg\)/.test(battle) && /state\._doorRearCast = null;/.test(battle), 'armed at the cast, disarmed at finish');
    assert.ok(/else if \(!_doorFreeAction\) spendAP\(unit, spellApCost\);/.test(battle), 'Keyholder\'s free toggle');
    assert.ok(/placeDoorPair\(unit, unit\.x, unit\.y, x, y, \{ spellName: spell\.name, fixed: true/.test(battle), 'deployPair places fixed doors');
    assert.ok(/damageDoorAt\(tile\.x, tile\.y, unit/.test(battle) && /damageDoorAt\(cx, cy, unit/.test(battle), 'AoE + line sweeps');
    assert.ok((battle.match(/state\.doors = \[\];/g) || []).length >= 4 && (map.match(/state\.doors = \[\];/g) || []).length === 2, 'the reset blocks');
    assert.ok(/doors: \[\],/.test(stateSrc) && /doors: state\.doors,/.test(stateSrc) && /key \+= '\|d' \+ d\.x/.test(stateSrc), 'state init + snapshot + vision cache key');
    assert.ok(/_tcSpell\.kind === 'door'/.test(online) && /pickX: _tcDoorPick/.test(online) && /data\.pickX != null && data\.pickY != null/.test(online), 'online: the guest\'s tile pick');
    assert.ok(/get DOOR_RULES\(\) \{ return DOOR_RULES; \}, doorAt, doorById, doorTwin, doorTeamPairs, doorTileFree/.test(battle), 'GAME exposes the door reads (DOOR_RULES through a getter — the const is declared after the GAME literal, a bare read is a TDZ throw that killed the whole boot on 2026-09-14)');
    for (const k of KINDS) {
        assert.ok(new RegExp("^        if \\(.*kind === '" + k + "'.*\\) \\{", 'm').test(ai), 'ai.js scoreSpell/findSpellTarget dispatch ' + k);
        assert.ok(new RegExp("k === '" + k + "'").test(hud), 'hud.js part ' + k);
    }
    assert.ok(/'door','doorBreach','doorDelivery','doorSlam','doorExit','doorTrap'/.test(ui), 'ui.js library kinds');
    for (const id of TREE_IDS.filter(i => i !== 'raceKnockKnock')) assert.ok(vfx.includes("SPELL_MAP['" + id + "']"), 'VFX alias ' + id);
    assert.ok(/function _buildDoor3D\(d\)/.test(rend) && /_buildDoor3D\(dd\)/.test(rend) && /h = _hashInt\(h, 31\); h = _hashInt\(h, dd\.x\)/.test(rend), 'the renderer draws + serials doors');
});
