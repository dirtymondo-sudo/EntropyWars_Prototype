'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = process.env.EW_DEADLINE_SOURCE || __dirname;
const source = fs.readFileSync(path.join(root, 'server.js'), 'utf8');
function between(src, a, b) {
    const start = src.indexOf(a), end = src.indexOf(b, start + a.length);
    assert.ok(start >= 0 && end > start, 'Missing production boundary: ' + a);
    return src.slice(start, end);
}
function harness() {
    const handlers = {}, rooms = new Map(), sent = [], timers = [], cleared = [], results = [];
    let now = 1000;
    const room = { host: 'host-original', guest: 'guest-original', _matchStarted: true,
        rejoinTokens: { host: 'host-secret', guest: 'guest-secret' }, ranked: false };
    rooms.set('ABCDE', room);
    const send = target => ({ emit(event, data) { sent.push({ target, event, data }); } });
    const socket = { id: room.host, on(event, fn) { handlers[event] = fn; }, to: send, join() {} };
    const c = vm.createContext({ socket, rooms, io: { to: send },
        console: { log() {}, warn() {} }, Date: { now: () => now },
        setTimeout(fn, ms) { const t = { fn, ms }; timers.push(t); return t; },
        clearTimeout(t) { cleared.push(t); },
        authenticatedSockets: new Map(), botSockets: new Map(), _rateBuckets: new Map(),
        broadcastPlayerCount() {}, removeFromAllQueues() {}, replayWrite() {}, replayEnd() {},
        replayFlush() {}, allowEvent: () => true,
        applyRankedElo(...args) { results.push(args); },
        findRoomBySocket(id) { for (const [code, r] of rooms)
            if (r.host === id || r.guest === id) return { code, room: r };
            return null;
        }
    });
    if (source.includes('function clearDisconnectDeadlines('))
        vm.runInContext(between(source, 'function clearDisconnectDeadlines(', 'function generateCode('), c);
    vm.runInContext(between(source, 'function maybeReplaySnapshot(', '// ── SERVER-AUTHORITATIVE RANKED OUTCOME'), c);
    vm.runInContext(between(source, "    socket.on('state-sync'", "    socket.on('party-config'"), c);
    vm.runInContext(between(source, "    socket.on('rejoin-room'", '\n});\n\nconst PORT'), c);
    return { c, room, rooms, sent, timers, cleared, results, handlers, socket,
        at(value) { now = value; },
        disconnect(role) { socket.id = room[role]; handlers.disconnect(); },
        rejoin(role, id = role + '-returned') {
            socket.id = id;
            let reply;
            handlers['rejoin-room']({ roomCode: 'ABCDE', rejoinToken: room.rejoinTokens[role] }, r => reply = r);
            return reply;
        },
        sync(data) { socket.id = room.host; handlers['state-sync'](data); }
    };
}
test('control: a single disconnected seat can return before its deadline', () => {
    const h = harness(); h.disconnect('guest'); h.at(90000);
    assert.equal(h.rejoin('guest').ok, true);
    assert.equal(h.room.guest, 'guest-returned');
    assert.equal(h.sent.filter(m => m.event === 'player-rejoined').length, 1);
});
test('control: an unrecovered single disconnect forfeits to the other seat', () => {
    const h = harness(); h.disconnect('guest'); h.at(91000); h.timers[0].fn();
    assert.equal(h.results.length, 1); assert.equal(h.results[0][2], 1);
    assert.equal(h.rooms.size, 0);
});
test('control: a guest cannot manufacture a winning state to cancel deadlines', () => {
    const h = harness(); h.disconnect('host');
    h.socket.id = h.room.guest;
    h.handlers['state-sync']({ phase: 'battle', winner: 2 });
    assert.equal(h.room._matchEnded, undefined); assert.equal(h.cleared.length, 0);
    h.timers[0].fn(); assert.equal(h.results.length, 1);
});
test('ranked result processing cancels a pending deadline before persistence work', async () => {
    const h = harness(); h.room.ranked = true; h.disconnect('guest');
    h.c.MIN_RANKED_MATCH_MS = 30000;
    // A short match takes the production early return before external DB work.
    vm.runInContext(between(source, 'async function applyRankedElo(', '// ── RANKED TURN TIMER'), h.c);
    await h.c.applyRankedElo(h.room, 'ABCDE', 1, 'test-result');
    assert.equal(h.room._matchEnded, true); assert.equal(h.room._disconnected, null);
    assert.equal(h.cleared.length, 1);
    h.timers[0].fn();
    assert.equal(h.sent.filter(m => m.event === 'match-forfeit').length, 0);
});
for (const first of ['host', 'guest']) {
    const second = first === 'host' ? 'guest' : 'host';
    test(`both disconnect: ${first} returns first without releasing the other deadline`, () => {
        const h = harness(); h.disconnect('host'); h.at(6000); h.disconnect('guest');
        h.at(16000);
        const reply = h.rejoin(first);
        assert.equal(reply.ok, true); assert.equal(reply.waitingForOpponent, true);
        assert.equal(reply.remainingSeconds, second === 'host' ? 75 : 80);
        assert.equal(h.sent.filter(m => m.event === 'player-rejoined').length, 0);
        assert.equal(h.cleared.length, 1);
        assert.equal(h.rejoin(second).ok, true);
        assert.equal(h.room._disconnected, null);
        assert.equal(h.sent.filter(m => m.event === 'player-rejoined').length, 1);
        for (const timer of h.timers) timer.fn(); // emulate already queued callbacks
        assert.equal(h.results.length, 0); assert.equal(h.rooms.get('ABCDE'), h.room);
    });
}
test('a second outage cannot be forfeited by the first outage callback', () => {
    const h = harness(); h.disconnect('guest'); const old = h.timers[0];
    assert.equal(h.rejoin('guest').ok, true); h.disconnect('guest');
    old.fn();
    assert.equal(h.rooms.get('ABCDE'), h.room); assert.equal(h.results.length, 0);
    h.timers[1].fn();
    assert.equal(h.results.length, 1); assert.equal(h.rooms.size, 0);
});
test('an old room deadline cannot delete a replacement room with the same code', () => {
    const h = harness(); h.disconnect('host');
    const replacement = { host: 'new-host', guest: 'new-guest' };
    h.rooms.set('ABCDE', replacement); h.timers[0].fn();
    assert.equal(h.rooms.get('ABCDE'), replacement); assert.equal(h.results.length, 0);
});
test('finished friendly match retires deadlines with replay recording disabled', () => {
    const h = harness(); h.disconnect('guest');
    h.sync({ phase: 'battle', winner: 1 });
    assert.equal(h.room._matchEnded, true); assert.equal(h.room._disconnected, null);
    assert.equal(h.cleared.length, 1);
    h.timers[0].fn();
    assert.equal(h.sent.filter(m => m.event === 'match-forfeit').length, 0);
    assert.equal(h.rooms.get('ABCDE'), h.room);
    assert.ok(h.rejoin('guest').error);
});
test('a rematch cannot inherit the previous match disconnect callback', () => {
    const h = harness(); h.disconnect('guest');
    h.sync({ phase: 'battle', winner: 1 });
    h.sync({ phase: 'battle', winner: null, activePlayer: 1, round: 1 });
    assert.equal(h.room._matchEnded, false);
    h.timers[0].fn();
    assert.equal(h.results.length, 0); assert.equal(h.rooms.get('ABCDE'), h.room);
});
test('only one deadline settles the match when both players remain disconnected', () => {
    const h = harness(); h.disconnect('host'); h.disconnect('guest');
    h.timers[0].fn(); h.timers[1].fn();
    assert.equal(h.results.length, 1); assert.equal(h.results[0][2], 2);
    assert.equal(h.sent.filter(m => m.event === 'match-forfeit').length, 1);
    assert.equal(h.cleared.length, 2);
});
test('rejoin after the deadline is rejected even before the timeout callback runs', () => {
    const h = harness(); h.disconnect('guest'); h.at(91000);
    assert.ok(h.rejoin('guest').error);
    assert.equal(h.room.guest, 'guest-original'); assert.equal(h.cleared.length, 0);
});
test('malformed room codes and non-callable callbacks cannot throw in rejoin', () => {
    for (const roomCode of [42, {}, [], true, null]) {
        const h = harness(); h.disconnect('guest'); h.socket.id = 'fresh';
        assert.doesNotThrow(() => h.handlers['rejoin-room']({ roomCode, rejoinToken: 'guest-secret' }, {}));
        assert.equal(h.room.guest, 'guest-original'); assert.equal(h.cleared.length, 0);
    }
});
test('duplicate disconnect notifications do not extend or multiply the grace period', () => {
    const h = harness(); h.disconnect('guest'); h.at(50000); h.disconnect('guest');
    assert.equal(h.timers.length, 1);
    h.at(91000); assert.ok(h.rejoin('guest').error);
});
for (const role of ['host', 'guest']) {
    test(`${role} reconnect callback keeps the clock/banner waiting until opponent returns`, () => {
        const src = fs.readFileSync(path.join(root, 'online.js'), 'utf8');
        const handlers = {}, calls = [];
        const NET = { _wasInMatch: true, roomCode: 'ABCDE', rejoinToken: 'secret',
            socket: { on(e, fn) { handlers[e] = fn; }, emit(e, data, cb) {
                cb({ ok: true, role, myPlayer: role === 'host' ? 1 : 2,
                    waitingForOpponent: true, remainingSeconds: 47 });
            } }
        };
        const c = vm.createContext({ NET, console: { log() {} }, ewToast() {}, onReady() {},
            _showReconnectOverlay(label, seconds) { calls.push(['show', label, seconds]); },
            _hideReconnectOverlay() { calls.push(['hide']); }
        });
        vm.runInContext(between(src, "                NET.socket.on('connect',", "                NET.socket.on('disconnect',"), c);
        handlers.connect();
        assert.deepEqual(calls, [['show', role === 'host' ? 'Player 2' : 'Player 1', 47]]);
        assert.equal(NET._wasInMatch, false); assert.equal(NET.role, role);
    });
}
