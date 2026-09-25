/* THE DOOR AGENT rev 3 (DOOR_RACE_DESIGN.md, 2026-09-20 — THE GUN, NOT THE
   DOORS): the race tables, the five-row kit on its tree (every row a shot
   from the door gun), the hidden 2×2 TRAPDOOR run for real in a vm sandbox
   (battle.js _trapFootprint + checkTrapTrigger / _springTrap with stubs),
   the door OBJECT the engine keeps (Grave Passage / Tunnel Network), and
   source guards on every engine site the kit touches (the travel, the
   trap, Drop In, the finisher, the animation rule, the gun's pitch). */
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
const sprites = read('sprites.js'), server = read('server.js'), dataSrc = read('data.js');

function between(src, a, b) {
    const i = src.indexOf(a); assert.ok(i >= 0, 'missing anchor ' + a);
    const j = src.indexOf(b, i); assert.ok(j > i, 'missing end anchor ' + b);
    return src.slice(i, j);
}

const RACE = 'door agent';
const TREE_IDS = ['raceSwingDoor', 'raceDoorDash', 'raceBreakingEntering', 'raceAirMail', 'raceTrapdoor', 'raceDropIn'];   // the door wheel (DOOR_GUN_PLAN §2.4, 2026-09-25)
const RETIRED = ['raceKnockKnock', 'raceSpecialDelivery', 'raceSlam', 'raceExit', 'raceLongWayRound', 'raceDoorToTheFace'];

test('door agent: every race table, both sides, the passive, the statuses the engine keeps', () => {
    assert.ok(D.AVAILABLE_RACES.includes(RACE));
    assert.equal(D.RACE_PROFILES[RACE].label, 'DOOR Agent');
    assert.equal(D.RACE_PROFILES[RACE].types.join(','), 'human,anomaly');
    assert.equal(D.RACE_DEFAULT_JOBS[RACE], 'Agent');
    assert.ok(D.RACE_BASE_STATS[RACE] && D.RACE_BASE_STATS[RACE].awr >= 80, 'they check their corners');
    assert.equal(D.RACE_PASSIVES[RACE].join(','), 'keyholder');
    const kh = D.PASSIVE_DEFS.keyholder;
    assert.ok(kh && kh.doorFreeToggle === true && kh.doorHits === undefined && kh.doorImmune === undefined, 'no door exceptions (the user, 2026-09-25)');
    assert.ok(/opens or shuts a friendly door/.test(kh.desc) && !/trapdoor|4 hits/.test(kh.desc), 'the passive says what it does now');
    assert.ok(D.ACCT_STARTER_UNITS.includes(RACE));
    /* membership, never the list's LAST entry (2026-09-21: three races joined after the agent — a positional pin was the wrong test's, CLAUDE.md THE RED CI rule 3) */
    assert.ok(/AVAILABLE_RACES = new Set\(\[[^\]]*'door agent'/.test(server) && /ACCT_STARTER_UNITS[^;]*'door agent'/.test(server), 'server.js race list + starters');
    assert.ok(/'door agent': \{ folder: 'Homosapien'/.test(sprites) && /RACE_MODELS_3D\['door agent'\] = \{/.test(sprites), 'sprites.js path rule + cast models');
    const heat = D.ACH_CATALOG.find(a => a.id === 'champsMastered');
    assert.equal(heat.tiers[heat.tiers.length - 1], D.AVAILABLE_RACES.length);
    for (const id of ['exited', 'castFromDoors']) assert.ok(D.STATUS_DEFS[id], 'STATUS_DEFS.' + id + ' (the engine keeps the door object)');
});

test('door agent (the door wheel): six rows on the tree, every one a shot from the gun, no placed door anywhere', () => {
    const tree = D.RACE_TREE[RACE];
    assert.equal(tree.length, 4);
    assert.ok(Array.isArray(tree[0]) && Array.isArray(tree[1]) && !Array.isArray(tree[2]) && !Array.isArray(tree[3]), 'twin · twin · single · capstone');
    assert.equal(tree.flat().join(','), TREE_IDS.join(','));
    const rows = D.RACE_ABILITIES[RACE];
    assert.equal(rows.length, 6);
    const byId = Object.fromEntries(rows.map(r => [r.id, r]));
    for (const id of TREE_IDS) assert.ok(byId[id], id);
    for (const id of RETIRED) assert.ok(!byId[id] && !D.SPELL_BY_ID[id], id + ' is gone');
    for (const r of rows) {
        assert.equal(r.doorGun, true, r.id + ' is shot from the door gun');
        assert.ok(!['door', 'doorSlam', 'doorDelivery', 'doorExit', 'doorTrap'].includes(r.kind), r.id + ' never places a door');
    }
    /* the swing: damage aimed at the HINGE, the push of 2 from the hinge, the stagger (DOOR_GUN_PLAN §3.5) */
    const sw = byId.raceSwingDoor;
    assert.ok(sw.kind === 'damage' && sw.hinge === true && sw.range === 3 && sw.pushDistance === 2 && sw.damageType === 'physical' && sw.apCost === 1);
    assert.equal(sw.statusEffects[0].id, 'stagger');
    /* the dash: a self teleport out of the gun, no damage */
    const dd = byId.raceDoorDash;
    assert.ok(dd.kind === 'teleport' && dd.range === 5 && !dd.dmg && !dd.teleportAnyUnit && dd.apCost === 1);
    /* the way in stays what it was */
    assert.ok(byId.raceBreakingEntering.kind === 'doorBreach' && byId.raceBreakingEntering.rearAttack === true && !byId.raceBreakingEntering.fromAbove);
    /* the drop: a shot at the enemy, the fall from three storeys */
    assert.ok(byId.raceAirMail.kind === 'damage' && byId.raceAirMail.range >= 3 && byId.raceAirMail.groundsFlyers === true && byId.raceAirMail.dropTiles === 3);
    assert.equal(byId.raceAirMail.statusEffects[0].id, 'stagger');
    /* the trapdoor: a hidden 2×2 deployable on the trap arsenal, NOT a capstone */
    const td = byId.raceTrapdoor;
    assert.ok(td.kind === 'placeTrap' && td.trapType === 'trapdoor' && td.trapSize === 2 && td.maxActivePerCaster === 1 && td.tier === 'II' && td.apCost === 1);
    assert.ok(!D.isCapstoneSpellId('raceTrapdoor'), 'definitely not a capstone');
    /* the capstone: the aerial assault */
    const di = byId.raceDropIn;
    assert.ok(di.kind === 'doorBreach' && di.fromAbove === true && di.rearAttack === true && di.splashDmg > 0 && di.tier === 'III' && di.apCost === 2 && di.dmg > byId.raceBreakingEntering.dmg);
    assert.ok(D.isCapstoneSpellId('raceDropIn') && !D.isCapstoneSpellId('raceBreakingEntering'), 'ring 4 is the capstone');
    /* the execution */
    const fin = D.FINISHERS[RACE];
    assert.ok(fin && fin.sig === 'openHouse' && fin.built === true && fin.type === 'anomaly' && /door/i.test(fin.desc));
});

/* ── THE TRAPDOOR, run for real ────────────────────────────────────────── */
function makeTrapCtx() {
    const units = [
        { id: 'a1', player: 1, x: 1, y: 1, z: 0, race: 'door agent', hp: 500 },
        { id: 'e1', player: 2, x: 6, y: 6, z: 0, race: 'knight', hp: 500 },
        { id: 'e2', player: 2, x: 7, y: 0, z: 0, race: 'door agent', hp: 500 },
        { id: 'f1', player: 1, x: 0, y: 7, z: 0, race: 'wizard', hp: 500 },
    ];
    const log = [], dmg = [], deform = [], falls = [], statuses = [], geom = [];
    const ctx = {
        state: { units, traps: [], bombs: [], round: 3, phase: 'battle' },
        window: { _doorGeom: (id, x, y, extra) => { geom.push({ id, x, y, extra }); return true; } },
        console,
        bw: () => 8, bh: () => 8,
        isInside: (x, y) => x >= 0 && y >= 0 && x < 8 && y < 8,
        unitAt: (x, y) => units.find(u => !u.dead && u.x === x && u.y === y) || null,
        isTerrainPassable: (x, y) => !(x === 3 && y === 0),
        coordLabel: (x, y) => x + ',' + y, unitDisplayName: u => u.id, addLog: s => log.push(s),
        showFloatingTextForUnit: () => {}, playSfx: () => {}, playDoorSfx: () => {}, shakeBoard: () => {},
        isUnitAirborne: () => false,
        unitPassiveValue: (u, k) => (u && u.race === 'door agent') ? ({ doorFreeToggle: true })[k] : undefined,
        applyDamageToUnit: (v, d, label, o) => { dmg.push({ id: v.id, d, label, type: o && o.damageType }); v.hp -= d; },
        getBaseHeightAt: () => 0,
        applyTerrainDeform: (x, y, r, dfm) => { deform.push({ x, y, r, delta: dfm.centerDelta }); const u = units.find(u => u.x === x && u.y === y); if (u) u.z = (u.z || 0) + dfm.centerDelta; },
        applyFallDamage: (v, fromZ, toZ, label) => { falls.push({ id: v.id, fromZ, toZ }); },
        applyStatusEffects: (v, effs, label) => { statuses.push({ id: v.id, effs: effs.map(e => e.id) }); },
        _skipVisuals: () => true, scheduleBoardRender: () => {}, invalidateActionPanelCache: () => {}, _balAddSpellEffect: () => {},
        getSquareArea: () => [], getTerrainAt: () => 'grass', setTerrainAt: () => {}, _invalidateBoardGrid: () => {},
        canOccupy: () => true, animateDisplacement: () => {}, _applyKnockbackHazard: () => {}, triggerTerrainSpellReaction: () => {},
        getSpellById: () => null, getUnitWeightClass: () => 'medium', nearestWalkableZ: () => 0,
        log, dmg, deform, falls, statuses, geom,
    };
    vm.createContext(ctx);
    vm.runInContext(between(battle, '        // placeTrap: null when a trap can hide on (x,y), else the reason.', '        // ── Terrain-spell preview prediction'), ctx);
    vm.runInContext(between(battle, '        function checkTrapTrigger(unit) {', '        function resolveMovePath('), ctx);
    vm.runInContext('this._trapFootprint = _trapFootprint; this._placeTrapProblem = _placeTrapProblem; this.checkTrapTrigger = checkTrapTrigger;', ctx);
    return ctx;
}

test('the trapdoor: the 2×2 footprint clamps and validates, the first enemy on any tile sinks the four, a door agent too', () => {
    const c = makeTrapCtx();
    /* the footprint */
    const e1 = c.state.units[1];
    e1.x = 2; e1.y = 6;   // off the far corner for the clamp read
    let fp = c._trapFootprint(7, 7, 2);
    assert.ok(fp.x === 6 && fp.y === 6 && fp.tiles.length === 4, 'clamped to the board: ' + JSON.stringify(fp));
    e1.x = 6; e1.y = 6;
    fp = c._trapFootprint(2, 0, 2);
    assert.ok(fp.problem && /Impassable/.test(fp.problem), 'a wall in the footprint refuses it: ' + fp.problem);
    fp = c._trapFootprint(6, 5, 2);
    assert.ok(fp.problem && /empty tile/.test(fp.problem), 'a unit in the footprint refuses it: ' + fp.problem);
    fp = c._trapFootprint(4, 4, 1);
    assert.ok(fp.tiles.length === 1 && fp.x === 4, 'size 1 is the old rule');
    fp = c._trapFootprint(4, 4, 2);
    assert.equal(fp.tiles.map(t => t.x + ',' + t.y).join(';'), '4,4;5,4;4,5;5,5');
    /* the placement (the branch's shape) */
    const gid = 'tg-a1-4,4-3';
    for (const t of fp.tiles) c.state.traps.push({ x: t.x, y: t.y, z: 0, owner: 1, casterUnitId: 'a1', trapType: 'trapdoor', dmg: 60, spellId: 'raceTrapdoor', spellName: 'Trapdoor', groupId: gid, anchorX: 4, anchorY: 4, size: 2 });
    assert.equal(c.state.traps.length, 4);
    assert.ok(c._placeTrapProblem(5, 5) === 'Already rigged', 'the far tile of the footprint is rigged too');
    /* the owner's ally walks over it */
    const f1 = c.state.units[3]; f1.x = 5; f1.y = 5;
    assert.equal(c.checkTrapTrigger(f1), false, 'never the owner\'s team');
    assert.equal(c.state.traps.length, 4);
    /* the enemy knight steps on the south-east tile (a door agent would fall the same: no Keyholder exception) */
    const e2 = c.state.units[2]; e2.x = 7; e2.y = 0;
    e1.x = 5; e1.y = 5;
    assert.equal(c.checkTrapTrigger(e1), true);
    assert.equal(c.state.traps.length, 0, 'the whole group folds');
    assert.equal(c.deform.length, 4, 'every tile of the 2×2 sinks');
    assert.ok(c.deform.every(d => d.delta === -2 && d.r === 0), 'two levels each, no radius');
    assert.equal(c.deform[0].x + ',' + c.deform[0].y, '5,5', 'the victim\'s tile first');
    assert.ok(c.dmg.length === 1 && c.dmg[0].id === 'e1' && c.dmg[0].d === 60 && c.dmg[0].type === 'physical', 'the WEAK physical hit');
    assert.ok(c.falls.length === 1 && c.falls[0].fromZ === 0 && c.falls[0].toZ === -2, 'the fall is paid on top');
    assert.ok(c.statuses.some(s => s.id === 'e1' && s.effs.includes('stagger')), 'Staggered');
    assert.equal(c.geom.filter(g => g.id === 'raceTrapdoor').length, 4, 'a door swings down on every tile');
    assert.ok(c.log.some(l => /4 tiles sink two levels/.test(l)));
});

/* ── the door OBJECT the engine keeps (Grave Passage / Tunnel Network) ── */
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
        getLinePoints: vm.runInNewContext(between(map, '        function getLinePoints(',
            '        function isRangeBlockedByTerrain(') + 'getLinePoints'),
        unitPassiveValue: (u, k) => (u && u.race === 'door agent') ? ({ doorFreeToggle: true })[k] : undefined,
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

test('the door object the engine keeps: place, cap, toggle, wall, sight, hits, step-through', () => {
    const c = makeDoorCtx();
    const g = c.window;
    const a1 = c.state.units[0], e1 = c.state.units[1];
    assert.equal(g.DOOR_RULES.hits, 3);
    assert.ok(g.doorTileFree(2, 1) && !g.doorTileFree(1, 1) && !g.doorTileFree(9, 9));
    const [A, B] = g.placeDoorPair(a1, 2, 1, 4, 3, { spellName: 'Grave Passage', fixed: true });
    assert.equal(c.state.doors.length, 2);
    assert.ok(A.open && B.open && A.pairId === B.pairId && A.fixed);
    assert.equal(g.doorTwin(g.doorAt(2, 1)).id, B.id);
    g.setDoorOpen(A, false);
    assert.equal(g.doorBlocksMove(2, 1), true);
    assert.equal(g.doorBlocksSightBetween(0, 1, 4, 1), true, 'a shut door on the line blocks sight');
    g.setDoorOpen(A, true);
    a1.x = 2; a1.y = 1;
    assert.equal(g.doorStepThrough(a1), true);
    assert.ok(a1.x === 4 && a1.y === 3, 'out of the twin');
    assert.equal(g.damageDoorAt(2, 1, e1), true);
    assert.equal(g.doorAt(2, 1).hp, 2, 'every door takes 3 hits (no Keyholder exception)');
    g.damageDoorAt(2, 1, e1); g.damageDoorAt(2, 1, e1);
    assert.equal(c.state.doors.length, 0, 'at 0 the door AND its twin are gone');
});

test('source guards: every engine site the rev 3 kit touches', () => {
    /* the travel: a doorGun damage row is the shot from the gun, never a strike leap / a bolt */
    assert.ok(/if \(spell\.doorGun && spell\.kind === 'damage'\) return 'doorGun';/.test(battle), 'resolveTravel');
    const trav = between(battle, '            doorGun(ctx) {', '            none(ctx) {');
    assert.ok(/window\._doorGeom\('raceDoorGun:shot', at\.x, at\.y, \{ fromX: unit\.x, fromY: unit\.y \}\)/.test(trav), 'the handler fires the shot');
    assert.ok(/spell\.doorAt === 'between'/.test(trav) && /cineUnitFade\(target, 1, 0, 0/.test(trav), 'the tile between for the swing; the Air Mail victim faded for its fall');
    /* the trapdoor */
    assert.ok(/function _trapFootprint\(x, y, size\)/.test(battle) && /_placeTrapProblem, _trapFootprint, _structurePlanFor,/.test(battle), 'the footprint helper, on GAME');
    const place = between(battle, "} else if (spell.kind === 'placeTrap') {", "} else if (spell.kind === 'scan') {");
    assert.ok(/_trapFootprint\(x, y, spell\.trapSize \|\| 1\)/.test(place) && /groupId: _gid, anchorX: _tfp\.x/.test(place), 'the branch places the footprint as one group');
    assert.ok(/onlyPlayer: unit\.player/.test(place) && /'raceTrapdoor:set'/.test(place), 'the laying recipe is the owner\'s alone');
    assert.ok(!/doorImmune/.test(battle), 'checkTrapTrigger: no Keyholder exception');
    const spring = between(battle, "            if (trap.trapType === 'trapdoor') {", "            } else if (trap.trapType === 'spike') {");
    assert.ok(/applyTerrainDeform\(t\.x, t\.y, 0, \{ centerDelta: -2, edgeDelta: 0 \}\)/.test(spring) && /applyFallDamage\(victim/.test(spring) && /id: 'stagger'/.test(spring), 'the spring sinks, falls, staggers');
    assert.ok(/\.fire\('impact', trap\.spellId/.test(spring), 'the victim\'s tile through the impact intent');
    assert.ok(new RegExp('^    placeTrap:\\s*\\{ simTargeting', 'm').test(dataSrc), 'SIM_DEFAULTS.placeTrap');
    /* Drop In */
    const breach = between(battle, "else if (spell.kind === 'doorBreach') {", "else if (spell.kind === 'doorDelivery') {");
    assert.ok(/const _fromAbove = !!spell\.fromAbove;/.test(breach) && /'raceDropIn:door'/.test(breach) && /lift: spell\.dropTiles \|\| 3/.test(breach), 'the door in the air');
    assert.ok(/spell\.splashDmg/.test(breach) && /isEnemyUnit\(u, unit\)/.test(breach), 'the slam on the neighbours');
    assert.ok(/cineUnitFade\(unit, 1, 0, 0\)/.test(breach), 'the agent faded for the drop');
    /* the door object's gates stay */
    assert.ok(/doorBlocksMove\(nx, ny\)\) _deployBlocks = true/.test(battle) && (map.match(/doorBlocksMove\(x, y\)\) return false/g) || []).length === 2, 'the door object\'s gates');
    assert.ok(/placeDoorPair\(unit, unit\.x, unit\.y, x, y, \{ spellName: spell\.name, fixed: true/.test(battle), 'deployPair still places fixed doors');
    assert.ok(/doors: \[\],/.test(stateSrc) && /doors: state\.doors,/.test(stateSrc), 'state init + snapshot');
    /* the finisher */
    assert.ok(/^            openHouse: \{/m.test(battle) && /V\.sigOpenHouse3D\(u\.x, u\.y, p\.x, p\.y/.test(battle), 'the director');
    assert.ok(/1 - Math\.pow\(1 - i \/ \(N - 1\), 1\.6\)/.test(battle) && /1 - Math\.pow\(1 - i \/ \(N - 1\), 1\.6\)/.test(vfx), 'the director and the signature walk the same cadence');
    /* the AI reads the kit through the kinds it already knows */
    assert.ok(/kind === 'placeTrap' && target/.test(ai) && /kind === 'doorBreach' \|\| kind === 'doorTrap'/.test(ai), 'ai.js scores placeTrap + doorBreach');
    assert.ok(/sp\.trapSize > 1/.test(hud) && /sp\.fromAbove/.test(hud), 'hud.js parts');
    assert.ok(/'placeTrap'/.test(ui.slice(ui.indexOf('const _SLB_KINDS'), ui.indexOf('const _SLB_KINDS') + 1600)), 'ui.js library kinds');
    /* the animation: every doorGun row plays the quick draw */
    assert.ok(/if \(spell\.doorGun\) return 'ranged';/.test(sprites), 'classifySpellAnimKind');
    assert.ok(/^    trapdoor: \[/m.test(sprites), 'TRAP_TILE_SPRITES.trapdoor (the owner\'s sigil)');
    /* the gun: held on the board, pitched in every holder */
    assert.ok(/basicAttackKind: 'punch', hold: _DOOR_AGENT_HOLD/.test(sprites) && /if \(def\.hold\) \{ try \{ _unitAttachHeld\(m, def\.hold, ts\);/.test(rend), 'every Door Agent carries the gun');
    assert.ok(/function _heldPitchGroup\(hold, inst\)/.test(rend), 'the pitch wrapper');
    assert.equal((rend.match(/_heldPitchGroup\(/g) || []).length, 4, 'defined once, used in the three holders');
    assert.ok(typeof D.HQ_PORTAL_RULES.gun.pitch === 'number', 'HQ_PORTAL_RULES.gun.pitch');
    assert.ok(/pitch: G\.pitch \|\| 0/.test(rend), '_hqGunAttach passes it');
    /* the geometry gate */
    assert.ok(/extra && extra\.onlyPlayer != null && typeof getViewerPlayer === 'function'/.test(vfx), 'fireGeometry: onlyPlayer');
    /* online: nothing new to relay — the trap syncs on state, the recipes ride the impact intent / the geometry wrapper */
    assert.ok(/fireGeometry:\s*\[\[1, 2\]\]/.test(online), 'the geometry relay');
});
