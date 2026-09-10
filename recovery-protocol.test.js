'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const root = process.env.EW_RECOVERY_SOURCE || __dirname;
const read = n => fs.readFileSync(path.join(root, n), 'utf8');
function between(s, a, b) {
    const i = s.indexOf(a), j = s.indexOf(b, i + a.length);
    assert.ok(i >= 0 && j > i, 'Missing production boundary: ' + a);
    return s.slice(i, j);
}
function server() {
    const source = read('server.js'), handlers = {}, sent = [], timers = [], results = [];
    const room = { host: 'h', guest: 'g', _matchStarted: true, _matchId: 'match-1',
        rejoinTokens: { host: 'secret-h', guest: 'secret-g' }, _turnMark: { at: 1000 } };
    const rooms = new Map([['ABCDE', room]]), live = new Map([['h', {}], ['g', {}]]);
    let now = 1000, serial = 0;
    const send = target => ({ emit(event, data) { sent.push({ target, event, data }); } });
    const socket = { id: 'h', on(e, f) { handlers[e] = f; }, join() {}, to: send };
    const c = vm.createContext({ socket, rooms, io: { to: send, sockets: { sockets: live } },
        uuid: () => 'uuid-' + ++serial, Date: { now: () => now }, console: { log() {}, warn() {} },
        setTimeout(fn, ms) { const t = { fn, ms }; timers.push(t); return t; }, clearTimeout(t) { if (t) t.cleared = true; },
        allowEvent: () => true, replayWrite() {}, replayFlush() {}, replayEnd() {},
        applyRankedElo(...a) { results.push(a); }, broadcastPlayerCount() {}, removeFromAllQueues() {},
        authenticatedSockets: new Map(), botSockets: new Map(), _rateBuckets: new Map(),
        findRoomBySocket(id) { for (const [code, r] of rooms) if (r.host === id || r.guest === id) return { code, room: r }; }
    });
    vm.runInContext(between(source, 'function clearDisconnectDeadlines(', 'function generateCode('), c);
    vm.runInContext(between(source, 'function maybeReplaySnapshot(', '// ── SERVER-AUTHORITATIVE RANKED OUTCOME'), c);
    vm.runInContext(between(source, "    socket.on('game-action'", "    socket.on('party-config'"), c);
    vm.runInContext(between(source, "    socket.on('relay'", "    socket.on('ranked-result'"), c);
    vm.runInContext(between(source, "    socket.on('recovery-snapshot'", '\n});\n\nconst PORT'), c);
    const h = { room, rooms, sent, timers, results, c, at(t) { now = t; },
        event(role, name, data) { socket.id = room[role] || role; handlers[name](data); },
        disconnect(role) { live.delete(room[role]); h.event(role, 'disconnect'); },
        rejoin(role) { socket.id = role + '-' + ++serial; live.set(socket.id, {}); let reply;
            handlers['rejoin-room']({ roomCode: 'ABCDE', rejoinToken: room.rejoinTokens[role] }, r => reply = r); return reply; },
        envelope(extra = {}) { return { id: room._recovery.id, matchId: room._matchId, ...extra }; },
        snapshot(extra = {}) { h.event('host', 'recovery-snapshot', h.envelope({ state: { phase: 'battle', units: [{ id: 1 }] }, checksum: 'correct', ...extra })); },
        count(e) { return sent.filter(x => x.event === e).length; }
    }; return h;
}
for (const role of ['host', 'guest']) test(`${role} reconnect waits for guest application acknowledgement`, () => {
    const h = server(); h.disconnect(role); h.at(9000); assert.equal(h.rejoin(role).ok, true);
    assert.ok(h.room._recovery); assert.equal(h.count('recovery-complete'), 0);
    h.snapshot(); assert.equal(h.count('recovery-snapshot'), 1); assert.equal(h.count('recovery-complete'), 0);
    const ack = h.envelope({ checksum: 'correct' });
    h.event('guest', 'recovery-applied', ack);
    assert.equal(h.count('recovery-complete'), 0);
    h.event('host', 'recovery-confirmed', ack);
    assert.equal(h.count('recovery-complete'), 1); assert.equal(h.room._recovery, null);
    assert.equal(h.room._turnMark.at, 9000);
    h.event('guest', 'recovery-applied', ack); assert.equal(h.count('recovery-complete'), 1);
});
for (const first of ['host', 'guest']) test(`both absent, ${first} returns first: no recovery release`, () => {
    const h = server(); h.disconnect('host'); h.disconnect('guest');
    assert.equal(h.rejoin(first).waitingForOpponent, true); assert.equal(h.count('player-rejoined'), 0);
    assert.equal(h.rejoin(first === 'host' ? 'guest' : 'host').waitingForOpponent, false);
    assert.equal(h.count('player-rejoined'), 1); assert.ok(h.room._recovery);
});
test('wrong seat, old recovery and old match cannot submit or acknowledge a snapshot', () => {
    const h = server(); h.disconnect('guest'); h.rejoin('guest');
    h.event('guest', 'recovery-snapshot', h.envelope({ state: { phase: 'battle', units: [] }, checksum: 'correct' }));
    h.snapshot({ id: 'old' }); h.snapshot({ matchId: 'old' }); assert.equal(h.count('recovery-snapshot'), 0);
    h.snapshot();
    for (const [role, extra] of [['host', {}], ['guest', { id: 'old' }], ['guest', { matchId: 'old' }]])
        h.event(role, 'recovery-applied', h.envelope({ checksum: 'correct', ...extra }));
    assert.equal(h.count('recovery-complete'), 0);
});
test('early acknowledgements and duplicate host packets cannot replace the accepted snapshot', () => {
    const h = server(); h.disconnect('guest'); h.rejoin('guest');
    h.event('guest', 'recovery-applied', h.envelope({ checksum: 'correct' }));
    assert.equal(h.count('recovery-complete'), 0); h.snapshot(); const state = h.room._recovery.snapshot;
    h.snapshot({ state: { phase: 'battle', units: [{ id: 999 }] } });
    assert.equal(h.room._recovery.snapshot, state); assert.equal(h.count('recovery-snapshot'), 1);
});
test('a checksum mismatch ends recovery visibly without inventing a forfeit', () => {
    const h = server(); h.disconnect('guest'); h.rejoin('guest'); h.snapshot();
    h.event('guest', 'recovery-applied', h.envelope({ checksum: 'different' }));
    assert.equal(h.count('recovery-complete'), 0); assert.equal(h.count('recovery-failed'), 1);
    assert.equal(h.rooms.size, 0); assert.equal(h.results.length, 0);
});
test('retry resends the same accepted snapshot and never extends the deadline', () => {
    const h = server(); h.disconnect('guest'); h.rejoin('guest');
    const timer = h.room._recovery.timer;
    h.event('guest', 'recovery-retry', h.envelope()); assert.equal(h.count('player-rejoined'), 2);
    h.snapshot(); const snapshot = h.room._recovery.snapshot;
    h.event('guest', 'recovery-retry', h.envelope());
    assert.equal(h.count('recovery-snapshot'), 2); assert.equal(h.room._recovery.snapshot, snapshot);
    assert.equal(h.room._recovery.timer, timer); timer.fn();
    assert.equal(h.count('recovery-failed'), 1); assert.equal(h.results.length, 0);
});
test('a second disconnect invalidates snapshot, acknowledgement and timeout from the first recovery', () => {
    const h = server(); h.disconnect('guest'); h.rejoin('guest'); h.snapshot();
    const old = h.envelope({ checksum: 'correct' }), timer = h.room._recovery.timer;
    h.disconnect('host'); h.rejoin('host');
    assert.notEqual(h.room._recovery.id, old.id);
    h.event('guest', 'recovery-applied', old); timer.fn();
    assert.equal(h.count('recovery-complete'), 0); assert.equal(h.count('recovery-failed'), 0);
});
test('room-code reuse cannot be closed by an obsolete recovery deadline', () => {
    const h = server(); h.disconnect('guest'); h.rejoin('guest'); const timer = h.room._recovery.timer;
    const replacement = {}; h.rooms.set('ABCDE', replacement); timer.fn();
    assert.equal(h.rooms.get('ABCDE'), replacement); assert.equal(h.count('recovery-failed'), 0);
});
test('a winning snapshot cancels recovery and stale callbacks cannot undo the result', () => {
    const h = server(); h.disconnect('guest'); h.rejoin('guest'); h.snapshot();
    const ack = h.envelope({ checksum: 'correct' }), timer = h.room._recovery.timer;
    h.event('host', 'state-sync', { _matchId: h.room._matchId, phase: 'battle', winner: 1 });
    h.event('guest', 'recovery-applied', ack); timer.fn();
    assert.equal(h.room._matchEnded, true); assert.equal(h.room._recovery, null);
    assert.equal(h.count('recovery-failed'), 0); assert.equal(h.count('recovery-complete'), 0);
});
test('new actions and ordinary snapshots are blocked until recovery completes', () => {
    const h = server(); h.disconnect('guest'); h.rejoin('guest');
    h.event('guest', 'game-action', { type: 'triggerEndTurn', matchId: h.room._matchId });
    h.event('host', 'state-sync', { phase: 'battle', _matchId: h.room._matchId });
    assert.equal(h.count('game-action'), 0); assert.equal(h.count('state-sync'), 0);
    h.snapshot(); const ack = h.envelope({ checksum: 'correct' });
    h.event('guest', 'recovery-applied', ack); h.event('host', 'recovery-confirmed', ack);
    h.event('guest', 'game-action', { type: 'triggerEndTurn', matchId: h.room._matchId });
    assert.equal(h.count('game-action'), 1);
});
test('host page loss takes the bounded failure path rather than resuming an empty board', () => {
    const h = server(); h.disconnect('host'); h.rejoin('host');
    h.event('host', 'recovery-unavailable', h.envelope());
    assert.equal(h.count('recovery-failed'), 1); assert.equal(h.count('recovery-complete'), 0);
});
test('rematch gets a new generation; late prior-result votes and snapshots are rejected', () => {
    const h = server(), old = h.room._matchId;
    h.event('host', 'state-sync', { _matchId: old, phase: 'battle', winner: 1 });
    for (const role of ['host', 'guest']) h.event(role, 'relay', { type: 'rematch-request', matchId: old });
    h.event('host', 'state-sync', { _matchId: old, phase: 'partyBuilder', winner: null });
    assert.notEqual(h.room._matchId, old);
    h.event('host', 'state-sync', { _matchId: h.room._matchId, phase: 'battle', winner: 2 });
    for (const role of ['host', 'guest']) h.event(role, 'relay', { type: 'rematch-request', matchId: old });
    assert.equal(h.room._rematchVotes, null);
    h.event('host', 'state-sync', { _matchId: old, phase: 'battle', winner: 1 });
    assert.equal(h.room._lastState.winner, 2);
});
function client(role = 'host') {
    const source = read('online.js'), handlers = {}, sent = [], timers = [], elements = new Map();
    let now = 100000, applied = 0, applyOK = true, resumes = 0, releases = [];
    const NET = { online: true, role, matchId: 'm', connected: false,
        socket: { connected: true, emit(e, data) { sent.push({ e, data }); }, on(e, f) { handlers[e] = f; } } };
    const st = { phase: 'battle', units: [{ id: 1, hp: 10 }], shotClock: { active: true, limitSec: 30, startedAt: 90000, pausedAt: 100000 } };
    const c = vm.createContext({ NET, Date: { now: () => now }, Number, Map, Set,
        window: { _NET: NET, _gameState: st, _pauseShotClock() {}, _resumeShotClock() { resumes++; },
            _ewReleaseRecoveryWork(run) { releases.push(run); }, _broadcastState() {} },
        document: { getElementById: id => elements.get(id),
            createElement: () => ({ style: {}, appendChild() {}, focus() {}, remove() { elements.delete(this.id); } }),
            head: { appendChild(e) { elements.set(e.id, e); } }, body: { appendChild(e) { elements.set(e.id, e); } } },
        sessionStorage: { removeItem() {} }, backToMainMenu() {}, ewToast() {},
        setTimeout(fn) { timers.push(fn); return timers.length; }, clearTimeout() {}, setInterval() { return 1; }, clearInterval() {},
        _serializeState: () => JSON.parse(JSON.stringify(st)), _ewStateChecksum: () => 'correct',
        _applyRemoteState() { applied++; return applyOK; } });
    vm.runInContext(between(source, '            function _packClock(', '            window._broadcastState ='), c);
    vm.runInContext(between(source, '            var _reconnectTimer =', '            function _connectSocket('), c);
    vm.runInContext(between(source, "                NET.socket.on('player-rejoined'", "                NET.socket.on('match-forfeit'"), c);
    return { c, NET, st, handlers, sent, timers, releases, at(t) { now = t; },
        resumes: () => resumes, applied: () => applied, applyOK(v) { applyOK = v; },
        begin() { handlers['player-rejoined']({ matchId: 'm', recoveryId: 'r' }); },
        count(e) { return sent.filter(x => x.e === e).length; } };
}
for (const role of ['host', 'guest']) test(`${role} client remains suspended until matching completion`, () => {
    const h = client(role); h.begin();
    assert.equal(h.NET.connected, false); assert.equal(h.NET._recovering, true); assert.equal(h.resumes(), 0);
    assert.equal(h.count('recovery-snapshot'), role === 'host' ? 1 : 0);
    h.handlers['recovery-complete']({ id: 'old', matchId: 'm' }); assert.equal(h.resumes(), 0);
    h.handlers['recovery-complete']({ id: 'r', matchId: 'old' }); assert.equal(h.resumes(), 0);
    h.handlers['recovery-complete']({ id: 'r', matchId: 'm' });
    assert.equal(h.NET.connected, true); assert.equal(h.resumes(), 1); assert.deepEqual(h.releases, [true]);
});
test('guest acknowledges only successful application; duplicate packet does not rerun scene boot', () => {
    const h = client('guest'); h.begin(); const data = { id: 'r', matchId: 'm', state: {} };
    h.applyOK(false); h.handlers['recovery-snapshot'](data); assert.equal(h.count('recovery-applied'), 0);
    h.applyOK(true); h.handlers['recovery-snapshot'](data); h.handlers['recovery-snapshot'](data);
    assert.equal(h.applied(), 2); assert.equal(h.count('recovery-applied'), 2); assert.equal(h.resumes(), 0);
});
test('stale snapshots never reach application', () => {
    const h = client('guest'); h.begin();
    h.handlers['recovery-snapshot']({ id: 'old', matchId: 'm' });
    h.handlers['recovery-snapshot']({ id: 'r', matchId: 'old' }); assert.equal(h.applied(), 0);
});
test('host waits for an in-flight action to finish before taking the recovery snapshot', () => {
    const h = client(); h.st._actionExecuting = true; h.begin(); assert.equal(h.count('recovery-snapshot'), 0);
    h.st._actionExecuting = false; h.timers.shift()(); assert.equal(h.count('recovery-snapshot'), 1);
});
test('recovery retries are bounded and failure keeps the game blocked', () => {
    const h = client('guest'); h.begin();
    for (let i = 0; i < 30 && h.timers.length; i++) h.timers.shift()();
    assert.equal(h.NET._recoveryFailed, true); assert.equal(h.NET.connected, false);
    assert.equal(h.resumes(), 0); assert.ok(h.count('recovery-retry') <= 7);
    h.handlers['recovery-complete']({ id: 'r', matchId: 'm' }); assert.equal(h.resumes(), 0);
});
test('teardown cancels queued recovery polling and engine work', () => {
    const h = client(); h.st._actionExecuting = true; h.begin();
    h.c.window._ewHideReconnectBanner(); h.timers.shift()();
    assert.equal(h.count('recovery-snapshot'), 0); assert.deepEqual(h.releases, [false]);
});
for (const skew of [-3600000, 3600000]) test(`remaining duration survives ${skew}ms wall-clock skew`, () => {
    const h = client(); const snapshot = JSON.parse(JSON.stringify(h.st));
    h.c._packClock(snapshot); assert.equal(snapshot.shotClock.remainingMs, 20000);
    h.at(100000 + skew); const local = h.c._unpackClock(snapshot).shotClock;
    assert.equal(100000 + skew - local.startedAt, 10000);
    assert.equal(local.pausedAt, null); // The recipient owns reconnect suspension.
    assert.equal(snapshot.shotClock.startedAt, 0); assert.equal(h.st.shotClock.startedAt, 90000);
});
test('clock transfer preserves cinematic suspension and handles expired clocks', () => {
    const h = client(); h.c.window._ewShotClockCinematicPaused = () => true;
    const snapshot = JSON.parse(JSON.stringify(h.st)); h.c._packClock(snapshot);
    assert.equal(h.c._unpackClock(snapshot).shotClock.pausedAt, 100000);
    h.st.shotClock.pausedAt = null; h.st.shotClock.startedAt = 1;
    h.c._packClock(h.st); assert.equal(h.st.shotClock.remainingMs, 0);
});
test('legacy replay clocks are left intact', () => {
    const h = client(), old = { shotClock: { startedAt: 7, limitSec: 30 } };
    assert.equal(h.c._unpackClock(old), old);
});
test('deferred engine work is deduplicated and discarded after match or scene changes', () => {
    const source = read('online.js'), st = { phase: 'battle' }, NET = { online: true, _recovering: true, matchId: 'm' };
    const c = vm.createContext({ window: { _NET: NET, _gameState: st }, Map }); let ran = 0;
    vm.runInContext(between(source, '        function _recoveryBlocked()', '        function _emit('), c);
    c.window._ewDeferRecovery('advance', () => ran++); c.window._ewDeferRecovery('advance', () => ran++);
    NET._recovering = false; c.window._ewReleaseRecoveryWork(true); assert.equal(ran, 1);
    NET._recovering = true; c.window._ewDeferRecovery('advance', () => ran++);
    NET.matchId = 'other'; c.window._ewReleaseRecoveryWork(true); assert.equal(ran, 1);
    c.window._ewDeferRecovery('advance', () => ran++); c.window._ewReleaseRecoveryWork(false); assert.equal(ran, 1);
});
test('host confirms its current state after the guest ack; drift cannot release either seat', () => {
    const h = server(); h.disconnect('guest'); h.rejoin('guest'); h.snapshot();
    const ack = h.envelope({ checksum: 'correct' }); h.event('guest', 'recovery-applied', ack);
    assert.equal(h.count('recovery-verify'), 1); assert.equal(h.count('recovery-complete'), 0);
    h.event('guest', 'recovery-confirmed', ack); assert.equal(h.count('recovery-complete'), 0);
    h.event('host', 'recovery-confirmed', { ...ack, checksum: 'changed' });
    assert.equal(h.count('recovery-failed'), 1); assert.equal(h.count('recovery-complete'), 0);
});
test('host client verifies the current state only for the active recovery', () => {
    const h = client(); h.begin();
    h.handlers['recovery-verify']({ id: 'old', matchId: 'm' }); assert.equal(h.count('recovery-confirmed'), 0);
    h.handlers['recovery-verify']({ id: 'r', matchId: 'm' });
    assert.equal(h.sent.find(x => x.e === 'recovery-confirmed').data.checksum, 'correct');
    assert.equal(h.resumes(), 0);
});
test('an absent seat can retrieve its finished match using only its own credential', () => {
    const h = server(); h.disconnect('guest');
    h.event('host', 'state-sync', { _matchId: h.room._matchId, phase: 'battle', winner: 1, units: [] });
    const reply = h.rejoin('guest'); assert.equal(reply.ok, true); assert.equal(reply.result.winner, 1);
    assert.equal(h.count('recovery-complete'), 0); assert.equal(h.room._matchEnded, true);
});
test('real-time logical clock freezes all deadlines across a pause, including timestamp zero', () => {
    const source = read('battle.js'); let now = 0, paused = true;
    const c = vm.createContext({ performance: { now: () => now }, _paused: () => paused });
    const start = source.indexOf('            let _rtPauseStarted =');
    const end = source.indexOf('\n            function ', source.indexOf('function _now()', start) + 20);
    assert.ok(start >= 0 && end > start);
    vm.runInContext(source.slice(start, end), c);
    assert.equal(c._now(), 0); now = 90000; assert.equal(c._now(), 0);
    paused = false; assert.equal(c._now(), 0); now += 3000; assert.equal(c._now(), 3000);
    paused = true; assert.equal(c._now(), 3000); now += 4000;
    paused = false; assert.equal(c._now(), 3000);
});
test('match duration is transferred as elapsed time rather than a foreign timestamp', () => {
    const h = client(); const snapshot = { startTime: 20000 }; h.c._packClock(snapshot);
    h.at(-3500000); const restored = h.c._unpackClock(snapshot);
    assert.equal(-3500000 - restored.startTime, 80000);
    assert.equal(restored._matchElapsedMs, undefined);
});
for (const [signature, next] of [
    ['function maybeAdvanceTurn() {', '            /*'],
    ['function _continueBlitzWithUnit_impl(nextUnit, _gen) {', '                if (!nextUnit)'],
    ['function _execPlanEntry(entry, done) {', '\n                ']
]) test(`engine boundary defers during recovery: ${signature}`, () => {
    const source = read('battle.js'), start = source.indexOf(signature);
    const guardEnd = source.indexOf(')) return;', start) + ')) return;'.length;
    assert.ok(start >= 0 && guardEnd > start);
    let queued;
    const c = vm.createContext({ window: { _ewDeferRecovery(key, fn) { queued = { key, fn }; return true; } } });
    vm.runInContext(source.slice(start, guardEnd) + '\nthrow new Error("engine ran while suspended");\n}', c);
    const fn = signature.match(/function (\w+)/)[1]; c[fn](); assert.equal(typeof queued.fn, 'function');
});
test('obsolete transports cannot deliver events; disconnected gameplay is never buffered', () => {
    const source = read('online.js'), handlers = {}, packets = [];
    const socket = { connected: true, on(e, fn) { handlers[e] = fn; return this; }, emit(...a) { packets.push(a); return this; } };
    const NET = { socket, matchId: 'current' }, c = vm.createContext({ NET }); let delivered = 0;
    vm.runInContext(between(source, '                var transport = NET.socket,', "                NET.socket.on('connect',"), c);
    socket.on('state-sync', () => delivered++); handlers['state-sync'](); assert.equal(delivered, 1);
    socket.emit('relay', { type: 'intro-done' }); assert.equal(packets[0][1].matchId, 'current');
    socket.connected = false; socket.emit('game-action', { type: 'engine' }); assert.equal(packets.length, 1);
    NET.socket = {}; handlers['state-sync'](); assert.equal(delivered, 1);
});
for (const returning of ['host', 'guest']) test(`complete production-handler exchange for returning ${returning}`, () => {
    const s = server(), host = client('host'), guest = client('guest');
    host.NET.matchId = guest.NET.matchId = s.room._matchId;
    s.disconnect(returning); s.rejoin(returning);
    let si = 0, hi = 0, gi = 0;
    for (let n = 0; n < 20; n++) {
        let progress = false;
        while (si < s.sent.length) {
            progress = true; const packet = s.sent[si++];
            for (const [role, target] of [['host', host], ['guest', guest]]) {
                if ((packet.target === 'ABCDE' || packet.target === s.room[role]) && target.handlers[packet.event])
                    target.handlers[packet.event](packet.data);
            }
        }
        while (hi < host.sent.length) { progress = true; const p = host.sent[hi++]; s.event('host', p.e, p.data); }
        while (gi < guest.sent.length) { progress = true; const p = guest.sent[gi++]; s.event('guest', p.e, p.data); }
        if (!progress) break;
    }
    assert.equal(s.count('recovery-complete'), 1);
    assert.equal(host.resumes(), 1); assert.equal(guest.resumes(), 1);
    assert.equal(host.NET.connected, true); assert.equal(guest.NET.connected, true);
    assert.equal(guest.applied(), 1);
});
test('late end-turn packets cannot consume the next activation', () => {
    const h = server();
    h.event('host', 'state-sync', { _matchId: h.room._matchId, phase: 'battle', activePlayer: 2, shotClock: { activationId: 8 } });
    h.event('guest', 'game-action', { matchId: h.room._matchId, type: 'triggerEndTurn', activationId: 7 });
    assert.equal(h.count('game-action'), 0);
    h.event('guest', 'game-action', { matchId: h.room._matchId, type: 'triggerEndTurn', activationId: 8 });
    assert.equal(h.count('game-action'), 1);
});
for (const role of ['host', 'guest']) test(`${role} recovery restores explicit seat controls and the host map context`, () => {
    const h = client(role); h.c.CTRL = { LOCAL: 'local', REMOTE: 'remote' };
    h.c.GAME_MODES = { restored: {} }; h.c.MULTIPLAYER_MODES = { tdm: {} };
    h.c.activeGameMode = 'old'; h.c.activeMultiplayerMode = 'arena'; h.c.CONFIG = { teamSize: 1 };
    h.c.applyGameMode = (id, authoritative) => { assert.equal(authoritative, true); h.c.activeGameMode = id; };
    h.c._restoreOnlineContext({ _onlineContext: { mapModeId: 'restored', multiplayerMode: 'tdm', teamSize: 6, ranked: true } });
    assert.equal(h.NET.myPlayer, role === 'host' ? 1 : 2);
    assert.equal(h.st.controllers[h.NET.myPlayer], 'local');
    assert.equal(h.st.controllers[role === 'host' ? 2 : 1], 'remote');
    assert.equal(h.c.activeGameMode, 'restored'); assert.equal(h.c.activeMultiplayerMode, 'tdm');
    assert.equal(h.c.CONFIG.teamSize, 6); assert.equal(h.NET.ranked, true);
});
test('host retry resends the frozen snapshot when its first packet was dropped', () => {
    const h = client(); h.begin(); const first = h.sent.find(x => x.e === 'recovery-snapshot').data;
    h.st.units[0].hp = 1; h.begin();
    const packets = h.sent.filter(x => x.e === 'recovery-snapshot');
    assert.equal(packets.length, 2); assert.equal(packets[1].data, first);
    assert.equal(packets[1].data.state.units[0].hp, 10);
});
test('a delayed restart notification cannot reopen an already completed recovery', () => {
    const h = client(); h.begin(); h.handlers['recovery-complete']({ id: 'r', matchId: 'm' });
    h.begin(); assert.equal(h.NET._recovering, false); assert.equal(h.count('recovery-snapshot'), 1);
});
