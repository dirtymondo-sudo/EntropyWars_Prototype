'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(process.env.EW_REJOIN_SOURCE || __dirname, 'server.js'), 'utf8');
function between(a, b) {
    const start = source.indexOf(a), end = source.indexOf(b, start + a.length);
    assert.ok(start >= 0 && end > start, 'production boundary missing: ' + a);
    return source.slice(start, end);
}
function harness() {
    const handlers = {}, rooms = new Map(), sent = [], cleared = [];
    let id = 0;
    const socket = { id: 'host-original', on(event, fn) { handlers[event] = fn; }, join() {} };
    const c = vm.createContext({ socket, rooms, console: { log() {} },
        uuid: () => 'credential-' + (++id), generateCode: () => 'ABCDE',
        io: { to(target) { return { emit(event, data) { sent.push({ target, event, data }); } }; } },
        findRoomBySocket(sid) { for (const [code, room] of rooms) {
            if (room.host === sid || room.guest === sid) return { room, code };
        } return null; },
        clearTimeout: timer => cleared.push(timer), replayWrite() {} });
    if (source.includes('function emitRoomFull('))
        vm.runInContext(between('function emitRoomFull(', 'function generateCode('), c);
    vm.runInContext(between("    socket.on('create-room'", "    socket.on('friendly-config'"), c);
    vm.runInContext(between("    socket.on('rejoin-room'", "    socket.on('disconnect'"), c);
    let host, guest;
    handlers['create-room']({}, r => host = r);
    socket.id = 'guest-original';
    handlers['join-room']({ code: host.code }, r => guest = r);
    const room = rooms.get(host.code);
    return { c, handlers, socket, room, rooms, sent, cleared, host, guest,
        rejoin(token, sid = 'returning') {
            socket.id = sid;
            let reply;
            handlers['rejoin-room']({ roomCode: host.code, rejoinToken: token }, r => reply = r);
            return reply;
        },
        disconnect(role) { room._disconnected = { role, socketId: room[role], timer: 'deadline' }; }
    };
}
test('friendly seats receive distinct credentials and private room-full payloads', () => {
    const h = harness();
    assert.notEqual(h.host.rejoinToken, h.guest.rejoinToken);
    const messages = h.sent.filter(m => m.event === 'room-full');
    assert.equal(messages.length, 2);
    for (const [role, response] of [['host', h.host], ['guest', h.guest]]) {
        const message = messages.find(m => m.target === h.room[role]);
        assert.ok(message); assert.equal(message.data.rejoinToken, response.rejoinToken);
        assert.equal(Object.values(message.data).includes(role === 'host' ? h.guest.rejoinToken : h.host.rejoinToken), false);
    }
});
for (const role of ['host', 'guest']) {
    test(`${role}: opponent credential cannot claim the disconnected seat from a fresh socket`, () => {
        const h = harness(); h.disconnect(role);
        const oldSeat = h.room[role], pending = h.room._disconnected;
        const reply = h.rejoin((role === 'host' ? h.guest : h.host).rejoinToken);
        assert.ok(reply.error); assert.equal(h.room[role], oldSeat);
        assert.equal(h.room._disconnected, pending); assert.deepEqual(h.cleared, []);
    });
    test(`${role}: own credential restores the correct seat and cannot replay`, () => {
        const h = harness(); h.disconnect(role);
        const token = h[role].rejoinToken;
        const reply = h.rejoin(token);
        assert.equal(reply.ok, true); assert.equal(reply.role, role);
        assert.equal(reply.myPlayer, role === 'host' ? 1 : 2);
        assert.equal(h.room[role], 'returning'); assert.equal(h.room._disconnected, null);
        assert.deepEqual(h.cleared, ['deadline']);
        assert.ok(h.rejoin(token, 'duplicate').error);
        assert.equal(h.room[role], 'returning');
    });
}
test('a socket already occupying the other seat cannot become both players', () => {
    const h = harness(); h.disconnect('host');
    assert.ok(h.rejoin(h.host.rejoinToken, 'guest-original').error);
    assert.notEqual(h.room.host, h.room.guest); assert.deepEqual(h.cleared, []);
});
test('missing and invalid credentials leave the pending deadline intact', () => {
    for (const token of [undefined, null, '', 'wrong', {}, 42]) {
        const h = harness(); h.disconnect('guest');
        assert.ok(h.rejoin(token).error); assert.deepEqual(h.cleared, []);
        assert.equal(h.room.guest, 'guest-original');
    }
});
test('ranked matchmaking privately delivers the matching credential to each assigned seat', () => {
    const h = harness(); h.sent.length = 0;
    let tick;
    h.c.setInterval = fn => { tick = fn; };
    h.c.queues = { arena: [
        { socketId: 'ranked-a', username: 'A', elo: 1200, joinedAt: 0, teamSize: 4 },
        { socketId: 'ranked-b', username: 'B', elo: 1300, joinedAt: 0, teamSize: 4 }
    ] };
    h.c.pickRandomMap = () => ({ modeId: 'test-map' });
    h.c.io.sockets = { sockets: new Map(['ranked-a', 'ranked-b'].map(id => [id, {
        join() {}, emit(event, data) { h.sent.push({ target: id, event, data }); }
    }])) };
    vm.runInContext(between('setInterval(() => {\n    const now = Date.now();\n    for (const queueKey',
        "app.get('/api/queue-stats'"), h.c);
    tick();
    const room = h.rooms.get('ABCDE');
    const messages = h.sent.filter(m => m.event === 'room-full');
    assert.equal(messages.length, 2);
    assert.notEqual(messages[0].data.rejoinToken, messages[1].data.rejoinToken);
    for (const role of ['host', 'guest']) {
        const m = messages.find(m => m.target === room[role]);
        assert.ok(m); assert.equal(m.data.rejoinToken, room.rejoinTokens[role]);
        assert.equal(m.data.ranked, true); assert.equal(m.data.mapModeId, 'test-map');
        room._disconnected = { role, timer: 'ranked-deadline' };
        assert.equal(h.rejoin(m.data.rejoinToken, 'returning-' + role).role, role);
    }
});
