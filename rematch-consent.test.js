'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = process.env.EW_REMATCH_SOURCE || __dirname;
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
    const live = new Map([[room.host, {}], [room.guest, {}]]);
    const send = target => ({ emit(event, data) { sent.push({ target, event, data }); } });
    const socket = { id: room.host, on(event, fn) { handlers[event] = fn; }, to: send, join() {} };
    const c = vm.createContext({ socket, rooms, io: { to: send, sockets: { sockets: live } },
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
    vm.runInContext(between(source, "    socket.on('relay'", "    socket.on('ranked-result'"), c);
    return { live, c, room, rooms, sent, timers, cleared, results, handlers, socket,
        at(value) { now = value; },
        disconnect(role) { socket.id = room[role]; live.delete(socket.id); handlers.disconnect(); },
        rejoin(role, id = role + '-returned') {
            socket.id = id;
            let reply;
            handlers['rejoin-room']({ roomCode: 'ABCDE', rejoinToken: room.rejoinTokens[role] }, r => reply = r);
            return reply;
        },
        sync(data) { socket.id = room.host; handlers['state-sync'](data); }
    };
}

function finish(h) { h.sync({ phase: 'battle', winner: 1 }); }
function request(h, role, from = role === 'host' ? 1 : 2) {
    h.socket.id = h.room[role];
    h.handlers.relay({ type: 'rematch-request', from });
}
function restart(h) { h.sync({ phase: 'partyBuilder', winner: null, activePlayer: 1, round: 1 }); }
test('winner-free snapshot without consent cannot reopen a completed match', () => {
    const h = harness(); finish(h); const last = h.room._lastState;
    h.sent.length = 0; restart(h);
    assert.equal(h.room._matchEnded, true);
    assert.equal(h.room._lastState, last);
    assert.equal(h.sent.length, 0);
});
for (const role of ['host', 'guest']) {
    test(role + ' alone cannot consent for both seats', () => {
        const h = harness(); finish(h); request(h, role); request(h, role);
        restart(h); assert.equal(h.room._matchEnded, true);
    });
    test(role + ' rematch identity is derived from the sending socket', () => {
        const h = harness(); finish(h); request(h, role, role === 'host' ? 2 : 1);
        const msg = h.sent.filter(m => m.event === 'relay').at(-1);
        assert.equal(msg.data.from, role === 'host' ? 1 : 2);
        restart(h); assert.equal(h.room._matchEnded, true);
    });
}
test('control: both connected seats can rematch in either request order', () => {
    for (const first of ['host', 'guest']) {
        const h = harness(); finish(h); request(h, first);
        request(h, first === 'host' ? 'guest' : 'host'); restart(h);
        assert.equal(h.room._matchEnded, false);
        assert.equal(h.room._resultProcessed, false);
        assert.equal(h.room._lastState.phase, 'partyBuilder');
    }
});
test('consumed consent cannot start another rematch', () => {
    const h = harness(); finish(h); request(h, 'host'); request(h, 'guest');
    restart(h); finish(h); restart(h);
    assert.equal(h.room._matchEnded, true);
});
test('requests during active play are dropped and cannot pre-authorize a rematch', () => {
    const h = harness(); request(h, 'host'); request(h, 'guest');
    assert.equal(h.sent.filter(m => m.event === 'relay').length, 0);
    finish(h); restart(h); assert.equal(h.room._matchEnded, true);
});
test('result during opponent outage cannot reopen the room after retiring deadlines', () => {
    const h = harness(); h.disconnect('guest'); finish(h);
    request(h, 'host'); restart(h);
    assert.equal(h.room._matchEnded, true);
    h.timers[0].fn(); assert.equal(h.results.length, 0);
});
test('dead transport blocks rematch even before disconnect callback runs', () => {
    const h = harness(); finish(h); request(h, 'host'); request(h, 'guest');
    h.live.delete(h.room.guest); restart(h);
    assert.equal(h.room._matchEnded, true);
});
test('consent from a replaced seat is invalid', () => {
    const h = harness(); finish(h); request(h, 'host'); request(h, 'guest');
    h.live.delete(h.room.guest); h.room.guest = 'new-guest'; h.live.set('new-guest', {});
    restart(h); assert.equal(h.room._matchEnded, true);
});
test('result heartbeats preserve pending consent until both players agree', () => {
    const h = harness(); finish(h); request(h, 'guest'); finish(h);
    request(h, 'host'); restart(h); assert.equal(h.room._matchEnded, false);
});
test('disconnect retires pending consent', () => {
    const h = harness(); h.room._rematchVotes = { host: h.room.host, guest: h.room.guest };
    h.disconnect('guest'); assert.equal(h.room._rematchVotes, null);
});
