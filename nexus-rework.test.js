'use strict';
/* ⬡ NEXUS REWORK — Arena (2026-09-12)
   Guards the rules the rework rests on, by source text (the engine files
   are browser-only) plus the real data.js constants through load-data:
   4 ticks flip a zone, zones are buildable (isObjectiveTile = the Cubes),
   the step-on tick is wired at the move-completion hook, the old instant
   Nexus-Dominance win is gone, respawns go through getRespawnZoneFor (the
   SPAWN LOCKOUT), the zone perks read the nexus owner, the Cube siege
   multiplier is applied in doAttack, every beat is relayed to the online
   guest, and the renderer's perimeter follows the terrain versions. */
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { extractConst, REPO_ROOT } = require('./load-data');

const read = (f) => fs.readFileSync(path.join(REPO_ROOT, f), 'utf8');
const dataSrc = read('data.js');
/* plain top-level consts aren't window properties — pull them by source */
const D = {};
for (const k of ['NEXUS_CAPTURE_THRESHOLD', 'NEXUS_CHANNEL_COST_AP', 'NEXUS_HOLD_HEAL_PCT',
                 'NEXUS_HOSTILE_DMG_PCT', 'NEXUS_CUBE_DMG_PER_ZONE', 'NEXUS_CUBE_DMG_MAX_MULT']) {
    D[k] = extractConst(dataSrc, k);
}
const ui = read('ui.js');
const battle = read('battle.js');
const map = read('map.js');
const online = read('online.js');
const hud = read('hud.js');
const ai = read('ai.js');
const renderer = read('three-renderer.js');

test('data.js: 4 ticks capture, the hold / burn / siege constants exist', () => {
    assert.strictEqual(D.NEXUS_CAPTURE_THRESHOLD, 4);
    assert.strictEqual(D.NEXUS_CHANNEL_COST_AP, 1);
    assert.ok(D.NEXUS_HOLD_HEAL_PCT > 0 && D.NEXUS_HOLD_HEAL_PCT < 1);
    assert.ok(D.NEXUS_HOSTILE_DMG_PCT > 0 && D.NEXUS_HOSTILE_DMG_PCT < 1);
    assert.ok(D.NEXUS_CUBE_DMG_PER_ZONE > 0);
    assert.ok(D.NEXUS_CUBE_DMG_MAX_MULT >= 1 + D.NEXUS_CUBE_DMG_PER_ZONE);
});

test('ui.js: one tick engine feeds channels, step-ons and the round-end presence pass', () => {
    assert.match(ui, /function _nexusApplyTicks\(nex, section, team, ticks, creditUnit\)/);
    // channelNexus, nexusOnUnitArrive and processNexusIncome all go through it
    const uses = ui.match(/_nexusApplyTicks\(nex, (floor|section), (unit\.player|team), (1|ticks)/g) || [];
    assert.ok(uses.length >= 3, `expected ≥3 _nexusApplyTicks callers, got ${uses.length}`);
    assert.match(ui, /function nexusOnUnitArrive\(unit\)/);
    assert.match(ui, /window\.nexusOnUnitArrive = nexusOnUnitArrive/);
    // one step-tick per zone per round
    assert.match(ui, /unit\._nexusStepStamp === stamp/);
    // a CONTESTED zone freezes on arrival
    assert.match(ui, /kind: 'contested'/);
    // no instant win / threat shout survives
    assert.ok(!/nexus_dominance/.test(ui), 'ui.js still references nexus_dominance');
    assert.ok(!/NEXUS THREAT/.test(ui), 'ui.js still shouts the NEXUS THREAT');
    // the lockout / restored beats
    assert.match(ui, /kind: 'lockout'/);
    assert.match(ui, /kind: 'restored'/);
    assert.match(ui, /function isSpawnLockedOut\(player\)/);
    assert.match(ui, /function getCubeDamageMult\(player\)/);
    assert.match(ui, /window\.getCubeDamageMult = getCubeDamageMult/);
});

test('ui.js: every local beat routes through window._nexusFx (the relay slot)', () => {
    assert.match(ui, /window\._nexusFx = _nexusFxImpl/);
    assert.match(ui, /typeof window\._nexusFx === 'function'\) \? window\._nexusFx : _nexusFxImpl/);
});

test('battle.js: only the Cubes are objective tiles — zones are buildable', () => {
    const m = battle.match(/function isObjectiveTile\(x, y\) \{([\s\S]*?)\n        \}/);
    assert.ok(m, 'isObjectiveTile missing');
    assert.match(m[1], /return isTowerTile\(x, y\);/);
    assert.ok(!/isInNexusZone|isInAnySpawnZone|roamingNexus/.test(m[1]), 'isObjectiveTile still guards zones');
});

test('battle.js: the step-on tick fires on move completion, next to the flag pickup', () => {
    assert.match(battle, /checkFlagPickup\(unit\);\n[\s\S]{0,300}nexusOnUnitArrive\(unit\);/);
});

test('battle.js: the instant Nexus Dominance win is gone from checkWin', () => {
    const cw = battle.slice(battle.indexOf('function checkWin()'), battle.indexOf('function checkWin()') + 12000);
    assert.ok(!/_winCondition = 'nexus_dominance'/.test(cw), 'checkWin still awards nexus_dominance');
});

test('battle.js: zone perks read the NEXUS owner and burn with the nexus rate', () => {
    assert.match(battle, /const _nzAt = \(typeof getNexusAtUnit === 'function'\) \? getNexusAtUnit\(unit\) : null;/);
    assert.match(battle, /NEXUS_HOLD_HEAL_PCT/);
    assert.match(battle, /NEXUS_HOSTILE_DMG_PCT/);
    assert.match(battle, /unit\._zoneBurnIsNexus = _zoneIsNexus/);
});

test('battle.js: the Cube takes the Nexus siege multiplier on both attack paths', () => {
    assert.match(battle, /const _nxSiege = \(typeof getCubeDamageMult === 'function'\) \? getCubeDamageMult\(unit\.player\) : 1;/);
    const sieges = battle.match(/Nexus siege ×\$\{_nxSiege\}/g) || [];
    assert.strictEqual(sieges.length, 2, 'instant + cinematic Cube hit paths');
});

test('map.js: respawns go through getRespawnZoneFor — home first, any held zone, else LOCKED', () => {
    assert.match(map, /function getRespawnZoneFor\(player\)/);
    assert.match(map, /window\.getRespawnZoneFor = getRespawnZoneFor/);
    assert.match(map, /if \(homeNex\.owner === player\) return \{ section: 'spawn' \+ player/);
    assert.match(map, /return best \|\| \{ section: null, label: '', tiles: \[\], home: false, locked: true \}/);
    assert.match(map, /const _rz = getRespawnZoneFor\(unit\.player\);/);
    assert.match(map, /if \(_rz\.locked\) \{\n\s+unit\._respawnIn = 0;\n\s+unit\._spawnLocked = true;/);
    assert.match(map, /function _respawnTileSafe\(x, y\)/);
    // the Arena spawn zone belongs to whoever HOLDS its nexus
    assert.match(map, /const nx = state\.nexusPoints && state\.nexusPoints\['spawn' \+ p\];\n\s+return nx \? \(nx\.owner \|\| 0\) : p;/);
});

test('online.js: nexus beats are relayed by the host and replayed by the guest', () => {
    assert.match(online, /type: 'nexus-fx'/);
    assert.match(online, /data\.type === 'nexus-fx' && _ewMirrorView\(\)/);
    assert.match(online, /window\._nexusFx\(\{[\s\S]{0,300}\}, true\);/);
});

test('hud.js: the CHANNEL row shows the live count and the scoreboard flags a locked spawn', () => {
    assert.match(hud, /_chProg \+ '\/' \+ _chThr/);
    assert.match(hud, /SPAWN LOCKED/);
    assert.ok(!/NEEDS 1 NEXUS/.test(hud), 'hud.js still shows the old NEEDS 1 NEXUS alert');
});

test('ai.js: the CPU knows the lockout (no all-but-one win math left)', () => {
    assert.ok(!/capturing our last zone = win/.test(ai));
    assert.match(ai, /if \(ownedCount === 0\) score \+= 200;/);
    assert.match(ai, /zones\.filter\(n => n\.owner === unit\.player\)\.length === 0\) \{/);
});

test('three-renderer.js: the zone perimeter hugs the terrain and rebuilds on any terrain change', () => {
    assert.match(renderer, /function _computeNexusSerial\(\) \{[\s\S]{0,400}state\._heightVersion/);
    assert.match(renderer, /function _nexusZoneTiles\(nex\)/);
    const rb = renderer.slice(renderer.indexOf('function rebuildNexusWalls()'), renderer.indexOf('/* ── Spawn Zone floor overlays ── */'));
    assert.match(rb, /_getZoneSkirtTex\(\)/, 'no cliff skirts');
    assert.match(rb, /tileTopY\(e\.x, e\.y\)/, 'edges not keyed to the tile top');
    assert.ok(!/if \(n && !n\.isSpawn\)/.test(rb), 'spawn nexuses are still skipped');
    // the pip meter
    assert.match(renderer, /\.nb-pip\.on-p1/);
    assert.match(renderer, /_nexusBarLastProg\[key\] !== prog\) cls \+= ' nb-pop'/);
    // the floating-text kind the beats use
    assert.match(renderer, /'nexus':\s+\{ color:/);
});
