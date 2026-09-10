'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = process.env.EW_RECONNECT_SOURCE || __dirname;
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
function between(src, a, b) {
    const start = src.indexOf(a), end = src.indexOf(b, start + a.length);
    assert.ok(start >= 0 && end > start, 'Missing production boundary: ' + a);
    return src.slice(start, end);
}
function harness(player = 1) {
    let now = 1000, tick, ended = 0;
    const st = { phase: 'battle', shotClock: { active: false, startedAt: 0, limitSec: 30 },
        _blitzActiveUnitId: 7, units: [{ id: 7, player }], controllers: { [player]: 'local' } };
    const c = vm.createContext({ state: st, window: {}, Date: { now: () => now }, Set,
        setInterval(fn) { tick = fn; return 1; }, clearInterval() {},
        CTRL: { LOCAL: 'local' }, isOnlineMatch: () => true,
        addLog() {}, unitDisplayName: () => 'Test', showFloatingTextForUnit() {}, playSfx() {},
        triggerEndTurn() { ended++; }, _isDungeonMode: () => false });
    const src = read('battle.js');
    const start = src.includes('        const _shotClockPauseReasons')
        ? '        const _shotClockPauseReasons' : '        let _matchClockInterval';
    vm.runInContext(between(src, start, '        /* Small self-contained countdown pill') +
        '\nfunction _renderShotClockPill() {}', c);
    c._startMatchClockInterval();
    return { c, st, at(n) { now = n; }, tick() { tick(); }, ended: () => ended };
}
for (const player of [1, 2]) {
    test(`seat ${player}: disconnect before activation holds a new clock beyond its limit`, () => {
        const h = harness(player);
        h.c._pauseShotClock('reconnect'); h.at(20000); h.c._startShotClock();
        h.at(70000); h.tick();
        assert.equal(h.ended(), 0); assert.equal(h.st.shotClock.pausedAt, 20000);
        h.c._resumeShotClock('reconnect');
        assert.equal(h.st.shotClock.startedAt, 70000);
        h.at(99000); h.tick(); assert.equal(h.ended(), 0);
        h.at(100000); h.tick(); assert.equal(h.ended(), 1);
    });
}
test('an active clock keeps exactly its remaining time; duplicate resumes do not grant time', () => {
    const h = harness(); h.c._startShotClock(); h.at(11000); h.c._pauseShotClock('reconnect');
    h.at(16000); h.c._pauseShotClock('reconnect');
    h.at(51000); h.c._resumeShotClock('reconnect');
    assert.equal(h.st.shotClock.startedAt, 41000);
    h.at(61000); h.c._resumeShotClock('reconnect');
    assert.equal(h.st.shotClock.startedAt, 41000);
    h.at(71000); h.tick(); assert.equal(h.ended(), 1);
});
for (const first of ['reconnect', 'cinematic']) {
    test(`releasing ${first} cannot release the other pause owner`, () => {
        const h = harness(); h.c._startShotClock(); h.at(5000);
        h.c._pauseShotClock(); h.c._pauseShotClock('reconnect');
        h.at(10000); h.c._resumeShotClock(first === 'cinematic' ? undefined : first);
        h.at(50000); h.tick(); assert.equal(h.ended(), 0);
        h.c._resumeShotClock(first === 'cinematic' ? 'reconnect' : undefined);
        assert.equal(h.st.shotClock.startedAt, 46000);
        assert.equal(h.st.shotClock.pausedAt, null);
    });
}
test('stopping and replacing a turn clock retains reconnect suspension', () => {
    const h = harness(); h.c._startShotClock(); h.c._pauseShotClock('reconnect');
    h.c._stopShotClock(); h.st.shotClock = { active: false, limitSec: 30 };
    h.at(20000); h.c._startShotClock(); h.at(60000); h.tick();
    assert.equal(h.ended(), 0); assert.equal(h.st.shotClock.pausedAt, 20000);
});
test('late expiration cannot end a paused or stopped turn', () => {
    const h = harness(); h.c._startShotClock(); h.c._pauseShotClock('reconnect');
    h.c._shotClockExpired(); assert.equal(h.ended(), 0);
    h.c._resumeShotClock('reconnect'); h.c._stopShotClock();
    h.c._shotClockExpired(); assert.equal(h.ended(), 0);
});
test('disconnect followed by teardown before activation does not pause the next clock', () => {
    const h = harness(); h.c._pauseShotClock('reconnect'); h.c._resumeShotClock('reconnect');
    h.at(2000); h.c._startShotClock(); h.at(32000); h.tick(); assert.equal(h.ended(), 1);
});
test('incoming state applies local suspension immediately after clock replacement', () => {
    const h = harness(); h.c._pauseShotClock('reconnect');
    h.c.window._gameState = h.st;
    h.c.window._applyShotClockPause = h.c._applyShotClockPause;
    h.c._guestUIKeys = [];
    h.c._deserializeInto = (st, data) => Object.assign(st, data);
    // Execute the production state-application prefix through deserialization;
    // subsequent rendering is deliberately outside this clock-boundary test.
    const prefix = between(read('online.js'), '            function _applyRemoteState(data)',
        '                    /* The authoritative result is here');
    vm.runInContext(prefix + '\n} catch (e) { throw e; } }', h.c);
    h.c._applyRemoteState({ shotClock: { active: true, startedAt: 1000, pausedAt: null, limitSec: 30 } });
    assert.equal(h.st.shotClock.pausedAt, 1000);
    h.at(50000); h.tick(); assert.equal(h.ended(), 0);
});
test('rejoin forces a host snapshot for either returning role; guest never broadcasts', () => {
    const body = between(read('online.js'), "                NET.socket.on('player-rejoined', function(data) {",
        "                NET.socket.on('match-forfeit'");
    for (const role of ['host', 'guest']) for (const returning of ['host', 'guest']) {
        let handler, sent = 0, hidden = 0;
        const NET = { role, online: true, connected: false, lastSyncJson: 'unchanged',
            socket: { on(name, fn) { handler = fn; } } };
        vm.runInNewContext(body, { NET, window: { _broadcastState() { sent++; assert.equal(NET.lastSyncJson, ''); } },
            _hideReconnectOverlay() { hidden++; }, ewToast() {} });
        handler({ role: returning });
        assert.equal(NET.connected, true); assert.equal(hidden, 1);
        assert.equal(sent, role === 'host' ? 1 : 0);
    }
});
test('banner refresh and teardown release only reconnect, preserving a cinematic pause', () => {
    const h = harness();
    const elements = new Map();
    h.c.document = {
        getElementById: id => elements.get(id) || null,
        createElement: () => ({ style: {}, remove() { elements.delete(this.id); } }),
        head: { appendChild(el) { elements.set(el.id, el); } },
        body: { appendChild(el) { elements.set(el.id, el); } }
    };
    h.c.window._pauseShotClock = h.c._pauseShotClock;
    h.c.window._resumeShotClock = h.c._resumeShotClock;
    vm.runInContext(between(read('online.js'), '            var _reconnectTimer = null;',
        '            function _connectSocket(onReady)'), h.c);
    h.c._startShotClock(); h.at(5000); h.c._pauseShotClock();
    h.c._showReconnectOverlay('You', 90);
    h.at(10000); h.c._showReconnectOverlay('Player 2', 90);
    h.c.window._ewHideReconnectBanner();
    assert.equal(h.st.shotClock.pausedAt, 5000);
    h.at(50000); h.c._resumeShotClock();
    assert.equal(h.st.shotClock.startedAt, 46000);
});
test('a timestamp of zero is a valid pause and resumes without losing its duration', () => {
    const h = harness(); h.at(0); h.c._startShotClock(); h.c._pauseShotClock('reconnect');
    h.at(40000); h.tick(); assert.equal(h.ended(), 0);
    h.c._resumeShotClock('reconnect'); assert.equal(h.st.shotClock.startedAt, 40000);
});
