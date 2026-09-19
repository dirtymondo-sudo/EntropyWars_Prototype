'use strict';
/* ⇄ RESERVES — the bench in the respawn modes (2026-09-14)
   Guards the three rules by source text (the engine files are browser-only)
   plus the real data.js constants: (1) the bench is a rotation (a switch
   keeps HP — no heal on the bench), (2) death owes the ladder and a
   reserve takes the seat only through processRespawns, (3) the per-round
   switch cap; the shared gate (_benchOn) at every bench site that used to
   read _isGauntlet; the online relay of the switch / deploy / seat pick;
   the match-select toggle; the launch sizing. */
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { REPO_ROOT } = require('./load-data');

const read = (f) => fs.readFileSync(path.join(REPO_ROOT, f), 'utf8');
const data = read('data.js');
const battle = read('battle.js');
const map = read('map.js');
const hud = read('hud.js');
const ai = read('ai.js');
const online = read('online.js');
const ms = read('match-select.js');
const ui = read('ui.js');

function rules() {
    const m = data.match(/const RESERVE_RULES = \{([\s\S]*?)\};/);
    assert.ok(m, 'RESERVE_RULES is declared in data.js');
    const o = {};
    for (const [, k, v] of m[1].matchAll(/(\w+):\s*([\d.]+)/g)) o[k] = Number(v);
    return o;
}

test('data.js: RESERVE_RULES — roster 8, deploy 4, 2 AP, one switch per round', () => {
    const R = rules();
    assert.strictEqual(R.roster, 8, 'the archive saves up to 8 — the roster is 8');
    assert.strictEqual(R.deploy, 4);
    assert.ok(R.roster > R.deploy, 'there is a bench');
    assert.strictEqual(R.switchApCost, 2, 'same price as Gauntlet');
    assert.strictEqual(R.switchesPerRound, 1);
    assert.ok(R.seatMinHpPct > 0 && R.seatMinHpPct < 1);
    assert.ok(/window\.RESERVE_RULES = RESERVE_RULES/.test(data));
});

test('battle.js: the shared gate — every bench site reads _benchOn, the rules read _isReservesMatch', () => {
    assert.ok(/function _benchOn\(\) \{\s*return _isGauntlet\(\) \|\| _isReservesMatch\(\);/.test(battle));
    assert.ok(/function _isReservesMatch\(\) \{[\s\S]*?return !!state\.reserves && !_isGauntlet\(\);/.test(battle),
        'the flag syncs to the guest; never gate on CONFIG here');
    assert.ok(/function doSwitch\(unit, incomingId\) \{\s*if \(!_benchOn\(\)\) return false;/.test(battle));
    assert.ok(/state\.bench = \{ 1: \[\], 2: \[\] \};\s*if \(!_benchOn\(\)\) return;/.test(battle), 'the partition');
    assert.strictEqual((battle.match(/\(_benchOn\(\) \? _gauntletReservesAlive\(/g) || []).length, 1, 'shared wipeout reader counts the bench in both modes');
    assert.ok(!/\(_isGauntlet\(\) \? _gauntletReservesAlive\(/.test(battle));
    for (const name of ['checkWinConditionOnly', 'checkWin']) {
        const start = battle.indexOf('        function ' + name + '(');
        const body = battle.slice(start, battle.indexOf('\n        }', start));
        assert.ok(body.includes('getTeamWipeoutCount(1)') && body.includes('getTeamWipeoutCount(2)'), name + ' uses the shared home-team/reserve count');
    }
    for (const w of ['_benchOn', '_isReservesMatch', '_switchesLeft', '_reserveQueueSeat', '_reserveSeatPick', '_reserveTakeSeat']) {
        assert.ok(battle.includes('window.' + w + ' = ' + w + ';'), w + ' is on window');
    }
    assert.ok(/const teamSize = \(typeof _benchOn === 'function' && _benchOn\(\)\)/.test(map), 'spawn zones size to the deploy count');
    assert.ok(/if \(typeof _benchOn === 'function' && _benchOn\(\)\) \{\s*const _swReserves/.test(hud), 'the SWITCH blade');
    assert.ok(/const isGaunt = typeof _benchOn === 'function' && _benchOn\(\);/.test(hud), 'the party dock strip');
    assert.ok(/typeof window\._benchOn === 'function' && window\._benchOn\(\)/.test(ai), 'the AI retreat');
    assert.ok(!/_isGauntlet === 'function' && _isGauntlet\(\)\) \{\s*const _swReserves/.test(hud));
});

test('rule 1: the bench is a rotation — a switch keeps HP / MP, only stat stages and shield reset', () => {
    const body = battle.slice(battle.indexOf('function doSwitch('), battle.indexOf('function _benchSeatIsHuman('));
    assert.ok(!/incoming\.hp\s*=/.test(body) && !/unit\.hp\s*=/.test(body), 'no HP write in doSwitch');
    assert.ok(!/\.mp\s*=/.test(body), 'no MP write in doSwitch');
    assert.ok(/_gauntletResetStatChanges\(unit\)/.test(body));
    const seat = battle.slice(battle.indexOf('function _reserveTakeSeat('), battle.indexOf('window.doSwitch = doSwitch;'));
    assert.ok(!/reserve\.hp\s*=/.test(seat), 'a reserve takes the seat with its OWN HP');
    assert.ok(/reserve\.status\.spawnGuard = 1/.test(seat), 'but under Spawn Guard like any respawn');
});

test('rule 2: death owes the ladder — the seat is handed over only by processRespawns', () => {
    /* defeatUnit: a reserves match keeps the ladder (the Gauntlet / MD branch nulls it) */
    /* THE PARTY (2026-09-19): an encounter's no-respawn flag (state.noRespawns) joined the Gauntlet / MD branch — a reserves match on its own still keeps the ladder */
    assert.ok(/if \(\(typeof _isGauntlet === 'function' && _isGauntlet\(\)\) \|\|\s*\(typeof _isDungeonMode === 'function' && _isDungeonMode\(\)\) \|\| state\.noRespawns\) \{[\s\S]*?unit\._respawnIn = null;/.test(map));
    assert.ok(!/_isReservesMatch\(\)\)[\s\S]{0,200}unit\._respawnIn = null/.test(map), 'a reserves match never nulls the ladder');
    assert.ok(/else if \(typeof _reserveQueueSeat === 'function'\) \{\s*_reserveQueueSeat\(unit\);/.test(map), 'the seat is queued at the death');
    /* the swap runs at the END of processRespawns, off a copy, only for a revived unit with a promised seat */
    const pr = map.slice(map.indexOf('function processRespawns()'));
    const tail = pr.slice(0, pr.indexOf('\n        }\n') + 1);
    assert.ok(/for \(const unit of state\.units\.slice\(\)\) \{\s*if \(unit\._justRespawned && unit\._seatFillId && !unit\.dead\) _reserveTakeSeat\(unit\);/.test(tail));
    /* nothing else moves a reserve onto the board in a reserves match */
    const qs = battle.slice(battle.indexOf('function _reserveQueueSeat('), battle.indexOf('function _reserveTakeSeat('));
    assert.ok(!/state\.units\.push/.test(qs), 'queueing / picking a seat never deploys');
    assert.ok(/_seatFor = fallen\.id/.test(qs) && /fallen\._seatFillId = reserve \? reserve\.id : null/.test(qs));
    /* a promised reserve is out of the free list */
    assert.ok(/function _gauntletReserves\(player, opts\)[\s\S]*?!\(free && u\._seatFor\)/.test(battle));
    /* the AI takes a seat only above the HP floor */
    assert.ok(/seatMinHpPct[\s\S]{0,400}>= minPct\) _reserveSeatPick\(player, pick\.id, slot, false\)/.test(qs));
    /* the modal: a seat pending shows WAIT and routes to the seat pick */
    assert.ok(/const seat = !!pending\.seat;/.test(hud) && /'WAIT FOR ' \+ fallenName\.toUpperCase\(\)/.test(hud));
    assert.ok(/if \(seat\) \{ if \(typeof _reserveSeatPick === 'function'\) _reserveSeatPick\(pending\.player, r \? r\.id : null, pending, true\); \}/.test(hud));
});

test('rule 3: the per-round switch cap — read at the verb, spent on success, reset at the round', () => {
    assert.ok(/function _switchesLeft\(player\) \{\s*if \(!_isReservesMatch\(\)\) return Infinity;/.test(battle), 'Gauntlet stays uncapped');
    assert.ok(/if \(_switchesLeft\(unit\.player\) <= 0\) \{[\s\S]{0,200}return false;/.test(battle));
    assert.ok(/state\._switchesThisRound\[unit\.player\] = \(state\._switchesThisRound\[unit\.player\] \|\| 0\) \+ 1;/.test(battle));
    assert.ok(/_reBeginGroup\('🔄 Respawns'\);\s*state\._switchesThisRound = \{ 1: 0, 2: 0 \};/.test(battle), 'reset at the round transition');
    assert.ok(/state\._gauntletReplaceQueue = \[\];\s*state\._switchesThisRound = \{ 1: 0, 2: 0 \};/.test(battle), 'reset at match start');
    assert.ok(/const _swLeft = typeof _switchesLeft === 'function'/.test(hud) && /'Used this round'/.test(hud));
    assert.ok(/capLeft > 0\)/.test(ai));
});

test('online: the switch, the Gauntlet deploy and the seat pick are relayed (the bench game-action)', () => {
    for (const fn of ['doSwitch', '_gauntletDeployReserve', '_reserveSeatPick']) {
        assert.ok(new RegExp("if \\(_isHost\\(\\)\\) return _hostRunAndSync\\(_orig\\w+, \\[[^\\]]*\\]\\);[\\s\\S]{0,300}_emit\\('game-action', \\{ type: 'bench', fn: '(doSwitch|deploy|seat)'").test(online), fn);
        assert.ok(online.includes('window.' + fn + ' = ' + fn + ';'), fn + ' wrapper published');
    }
    const c = online.slice(online.indexOf("case 'bench': {"), online.indexOf("case 'bench': {") + 1600);
    assert.ok(/swUnit\.player !== remoteP\) break;/.test(c), 'the sender owns the switching unit');
    assert.ok(/state\._blitzActiveUnitId !== swUnit\.id\) break;/.test(c), 'and it is the active unit');
    assert.ok(/pend\.player !== remoteP\) break;/.test(c), 'the pending seat is the sender\'s');
    assert.ok(/data\.fn === 'seat' && pend\.seat/.test(c) && /data\.fn === 'deploy' && !pend\.seat/.test(c));
    /* the human seat online is REMOTE too — the host waits for the guest's pick */
    assert.ok(/\(c === CTRL\.LOCAL \|\| c === CTRL\.REMOTE\) && !state\.autoPlayers/.test(battle));
    /* nothing of the bench is skip-listed — the guest reads it from the snapshot */
    const skip = online.slice(online.indexOf('function _serializeState()'), online.indexOf('function _serializeState()') + 6000);
    for (const k of ['bench', 'reserves', '_switchesThisRound', '_gauntletPendingReplace', '_gauntletReplaceQueue']) {
        assert.ok(!new RegExp('\\b' + k + ': 1').test(skip), k + ' syncs');
    }
});

test('match-select + launch: the RESERVES toggle sizes the roster to RESERVE_RULES, only in respawn modes', () => {
    assert.ok(/localStorage\.getItem\('ew_reserves'\)/.test(ms) && /_msReserves = reservesOn;/.test(ms));
    assert.ok(/const reservesOk = !!\(mpMode && mpMode\.respawns && !mpMode\.isFFA && !mpMode\.isClash\);/.test(ms));
    assert.ok(/label: 'RESERVES'/.test(ms) && /teamField, reservesField, roundsField/.test(ms) && /reservesField, roundsField, winField, tempoField/.test(ms));
    assert.ok(/let _msReserves = false;/.test(map));
    assert.ok(/state\.reserves = _reservesLaunch;\s*if \(gm\.id === 'gauntlet' \|\| _reservesLaunch\) \{/.test(map));
    assert.ok(/Math\.max\(1, Math\.min\(_RR\.deploy \|\| 4, CONFIG\.teamSize \|\| 4\)\)/.test(map), 'the chosen team size caps the deploy');
    /* THE PARTY (2026-09-19): a party ENCOUNTER is the one reserves launch in a no-respawn fight (_encParty_ peeked before the block) */
    assert.ok(/!!\(mpMode && \(mpMode\.respawns \|\| _encParty_\) && !mpMode\.isFFA && !mpMode\.isClash\)/.test(map));
    assert.ok(/state\.noRespawns = _encParty_;/.test(map), 'the no-respawn flag rides the same launch');
    /* every other launch path clears the flag (like trainingMatch) */
    assert.ok((map.match(/state\.reserves = false;/g) || []).length >= 3, 'map.js clears it on the MD / _selectMode / editor paths');
    assert.ok((ui.match(/state\.reserves = false;/g) || []).length >= 2, 'ui.js clears it on the tutorial / campaign paths');
});

test('the counter-pick chip reads the same type chart as the damage roll, screen-true', () => {
    const f = hud.slice(hud.indexOf('function _hrlgReserveMatchup('), hud.indexOf('function _hrlgSwitchBlades('));
    assert.ok(/getTypeDamageMultiplier\(r, e\)/.test(f) && /getTypeDamageMultiplier\(e, r\)/.test(f));
    assert.ok(/_isUnitVisibleToViewer\(e, viewer\)/.test(f), 'fog-gated (RULE #2)');
    assert.ok(!/awr|awareness/.test(f), 'never a flat radius');
});
