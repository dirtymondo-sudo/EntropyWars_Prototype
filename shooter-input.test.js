'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const read = name => fs.readFileSync(path.join(__dirname, name), 'utf8');
function events() {
    const handlers = {};
    return { addEventListener(name, fn) { (handlers[name] ||= new Set()).add(fn); },
        removeEventListener(name, fn) { handlers[name]?.delete(fn); },
        emit(name, e = {}) { for (const fn of handlers[name] || []) fn(e); }, handlers };
}
function event(key = 'w', target = { tagName: 'DIV' }) {
    return { key, code: key === ' ' ? 'Space' : 'Key' + key.toUpperCase(), target,
        preventDefault() { this.prevented = true; }, stopImmediatePropagation() { this.stopped = true; } };
}
function walkerHarness() {
    const window = events(), document = Object.assign(events(), { activeElement: null, hidden: false, hasFocus: () => true });
    const unit = { id: 'u', x: 3, y: 3 };
    const entry = { group: { position: { set() {} }, rotation: { y: 0 } } };
    const ctx = vm.createContext({ window, document, _gamePaused: false, state: { units: [unit] },
        performance: { now: () => 100 }, CONFIG: { tileSize: 1 }, BASE_TILE: 1, UNIT_SPRITE_SIZE_RATIO: 1,
        _getUnitEntry: () => entry, _tileSurfaceY: () => 0, _animNow: () => 0, _playUnitModelAnim() {} });
    const src = read('three-renderer.js');
    const a = src.indexOf('    var _freeRoam = null;');
    const b = src.indexOf('\n    /*', src.indexOf('function _freeRoamTick()', a));
    vm.runInContext(src.slice(a, b), ctx);
    ctx._freeRoamStart('u');
    return { ctx, unit, window, document };
}
function shooterHarness(rt = false) {
    const w = walkerHarness(), ctx = w.ctx;
    const canvas = { getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 }), requestPointerLock() { ctx.requests++; } };
    Object.assign(ctx, { requests: 0, exits: 0, ends: 0, stops: 0, score: false, scheduled: [],
        CTRL: { LOCAL: 'local' }, localStorage: { getItem: () => null },
        requestAnimationFrame: fn => ctx.scheduled.push(fn),
        ThreeRenderer: { isActive: () => true, getCanvas: () => canvas, hubFreeRoam: {
            inputAllowed: ctx._freeRoamInputAllowed, clearInput: ctx._freeRoamClearInput,
            setPadInput: ctx._freeRoamSetPad, setJump: on => { ctx._freeRoam.keys.space = on; },
            active: () => true, stop: () => { ctx.stops++; }, pos: () => ({ x: 3, y: 3 }) } },
        StrikeEngine: { playerUnit: () => w.unit, showScoreboard: on => { ctx.score = on; } } });
    Object.assign(w.unit, { player: 1 });
    Object.assign(ctx.state, { phase: 'battle', _blitzActiveUnitId: 'u', controllers: { 1: 'local' }, actionMode: 'spell', pendingTarget: { x: 8, y: 8 } });
    Object.assign(w.window, { _isShooterMode: () => true, _isStrikeRT: () => rt, _ewRequestEndTurn: () => ctx.ends++ });
    w.document.exitPointerLock = () => { ctx.exits++; w.document.pointerLockElement = null; };
    let src = read('battle.js');
    src = src.slice(src.indexOf('        const ShooterControls = (function () {'), src.indexOf('        window.ShooterControls = ShooterControls;') + '        window.ShooterControls = ShooterControls;'.length);
    src = src.replace('            return {\n                owns: _owns,', `
            window.inspectInput = () => ({heldDirs, runHeld, padVec, fireHeld, adsHeld, scoreHeld, _padRtPrev, locked, yaw, pitch});
            window.seedInput = () => { heldDirs = {w: true}; runHeld = true; padVec = {x: 1, y: 1}; fireHeld = adsHeld = scoreHeld = _padRtPrev = true; roamOn = true; };
            window.roamFrame = _roamFrame;
            window.roamFrameRT = _roamFrameRT;
            window.changeOwner = _onOwnChange;
            _refreshHud = () => {};
            return {\n                owns: _owns,`);
    vm.runInContext(src, ctx);
    return { ...w, canvas, api: w.window.ShooterControls };
}
function neutral(h) {
    const s = h.window.inspectInput();
    assert.equal(Object.values(s.heldDirs).some(Boolean), false);
    for (const k of ['runHeld', 'fireHeld', 'adsHeld', 'scoreHeld', '_padRtPrev']) assert.equal(s[k], false, k);
    assert.equal(s.padVec, null);
    assert.equal(h.ctx._frPad, null);
    assert.equal(!!h.ctx._freeRoam.keys.space, false);
}
test('Guild walker rejects modal/editable/hidden input at capture and frame boundaries', () => {
    for (const block of [h => h.ctx._gamePaused = true, h => h.ctx.state.uiDialog = {},
        h => h.document.hidden = true, h => h.document.activeElement = { tagName: 'SELECT' },
        h => h.document.hasFocus = () => false, h => h.window.EWPad = { isRebinding: () => true }]) {
        const h = walkerHarness();
        h.window.emit('keydown', event('w'));
        h.ctx._freeRoamSetPad(1, 1, true);
        block(h);
        const e = event(' '); h.window.emit('keydown', e);
        h.ctx._freeRoamTick();
        assert.deepEqual([h.unit.x, h.unit.y], [3, 3]);
        assert.equal(h.ctx._frPad, null);
        assert.equal(Object.keys(h.ctx._freeRoam.keys).length, 0);
        assert.equal(e.prevented, undefined);
    }
});
test('Guild walker clears on blur/focus and replacement without retaining pad or duplicate key listeners', () => {
    const h = walkerHarness();
    for (const action of [() => h.window.emit('blur'), () => h.document.emit('focusin', { target: { tagName: 'INPUT' } }),
        () => { h.document.hidden = true; h.document.emit('visibilitychange'); h.document.hidden = false; }]) {
        h.ctx._freeRoamSetPad(1, 0, true); h.window.emit('keydown', event('w')); action();
        assert.equal(h.ctx._frPad, null); assert.equal(Object.keys(h.ctx._freeRoam.keys).length, 0);
    }
    h.ctx._freeRoamSetPad(1, 0, true); h.ctx._freeRoamStart('u');
    assert.equal(h.ctx._frPad, null); assert.equal(h.window.handlers.keydown.size, 1);
    h.window.emit('keydown', event('w')); h.ctx._freeRoamTick();
    assert.ok(h.ctx._freeRoam.fy < 3, 'fresh movement still works');
    h.ctx._freeRoam.opts.parkAtUnit = true; h.ctx._freeRoam.fx = 9;
    h.ctx._freeRoamStop(); assert.equal(h.unit.x, 3, 'stop preserves authoritative tile');
});
for (const rt of [false, true]) {
    test(`${rt ? 'Strike' : 'turn-based shooter'} gives modal keys and mouse to controls`, () => {
        const h = shooterHarness(rt);
        const live = event('w'); h.window.emit('keydown', live);
        assert.equal(live.stopped, true);
        for (const blocker of [() => h.ctx._gamePaused = true, () => h.ctx.state.uiDialog = {}]) {
            blocker(); h.window.seedInput();
            for (const key of [' ', 'Enter', 'ArrowUp', 'Tab', 'w']) {
                const e = event(key); h.window.emit('keydown', e);
                assert.equal(e.stopped, undefined, key); assert.equal(e.prevented, undefined, key);
            }
            for (const type of ['mousedown', 'click', 'wheel', 'contextmenu', 'mousemove']) {
                const e = event(); e.target = h.canvas; h.window.emit(type, e); assert.equal(e.stopped, undefined, type);
            }
            neutral(h); assert.equal(h.ctx.ends, 0); assert.equal(h.ctx.requests, 0);
            h.ctx._gamePaused = false; h.ctx.state.uiDialog = null;
        }
    });
    test(`${rt ? 'Strike' : 'turn-based shooter'} rejects frame/pad/engine reads after ownership handoff`, () => {
        const h = shooterHarness(rt); h.window.seedInput();
        const original = JSON.stringify(h.ctx.state.pendingTarget);
        h.ctx._gamePaused = true;
        h.window.roamFrame(100); h.window.roamFrameRT(100);
        assert.equal(h.window._shooterPadFrame({}, 0.016, 100, [], [], 'domnav'), false);
        const input = h.api.rtInput(); neutral(h);
        assert.equal(input.aimActive, false); assert.equal(input.pick, null);
        assert.equal(h.ctx.stops, 0, 'modal handoff does not stop/commit provisional walker');
        assert.equal(JSON.stringify(h.ctx.state.pendingTarget), original);
        assert.equal(h.api.owns(), true, 'camera ownership survives pause');
        h.ctx._gamePaused = false;
        assert.equal(h.api.rtInput().fireHeld, false);
    });
}
test('Shooter releases its lock on pause and rejects late lock grants, preserving HQ lock', () => {
    const h = shooterHarness(true);
    h.document.pointerLockElement = h.canvas; h.document.emit('pointerlockchange');
    assert.equal(h.api.isLocked(), true);
    h.window.seedInput(); h.ctx._gamePaused = true; h.api.suspendInput();
    neutral(h); assert.equal(h.ctx.exits, 1); assert.equal(h.api.isLocked(), false);
    h.document.pointerLockElement = h.canvas; h.document.emit('pointerlockchange');
    assert.equal(h.ctx.exits, 2, 'late grant released while paused');
    h.ctx.state.phase = 'setup'; h.document.pointerLockElement = h.canvas;
    h.document.emit('pointerlockchange'); h.api.suspendInput();
    assert.equal(h.ctx.exits, 2, 'shared canvas HQ lock is not shooter-owned');
});
test('Shooter resets all channels on lock loss, blur, hidden page, editable focus, disconnect and ownership loss', () => {
    const h = shooterHarness(true);
    for (const action of [() => h.document.emit('pointerlockchange'), () => h.window.emit('blur'),
        () => { h.document.hidden = true; h.document.emit('visibilitychange'); h.document.hidden = false; },
        () => h.document.emit('focusin', { target: { tagName: 'SELECT' } }),
        () => h.window.emit('gamepaddisconnected'), () => h.window.changeOwner(false)]) {
        h.window.seedInput(); action(); neutral(h);
    }
    h.window.seedInput(); h.ctx._gamePaused = true;
    const release = event(' '); h.window.emit('keyup', release);
    assert.equal(h.ctx._freeRoam.keys.space, false, 'release remains unconditional');
});
test('Controller pause takes priority over simultaneous fire and stick input; fresh samples work after resume', () => {
    const h = shooterHarness(true);
    h.ctx.EWPad = h.window.EWPad = { getBinding: id => ({ pause: 0, confirm: 1 }[id] ?? -1), isRebinding: () => false };
    h.ctx.togglePauseMenu = () => { h.ctx._gamePaused = true; };
    let shots = 0; h.ctx.StrikeEngine.playerFire = () => shots++;
    const gp = { axes: [1, 1, 1, 1], buttons: [{ pressed: true }, { pressed: true }] };
    const yaw = h.window.inspectInput().yaw;
    assert.equal(h.window._shooterPadFrame(gp, .016, 100, [true, true], [], 'free'), true);
    assert.equal(shots, 0); assert.equal(h.window.inspectInput().yaw, yaw); neutral(h);
    h.ctx._gamePaused = false;
    gp.buttons = []; h.window._shooterPadFrame(gp, .016, 200, [], [true, true], 'free');
    assert.ok(h.window.inspectInput().padVec.x > 0);
    assert.notEqual(h.window.inspectInput().yaw, yaw);
});
test('Opening pause or rendering a dialog immediately hands off shooter and walker input', () => {
    const src = read('ui.js');
    for (const mode of ['pause', 'dialog']) {
        const calls = [];
        const ctx = vm.createContext({ document: { activeElement: null, getElementById: () => ({}) },
            state: { uiDialog: {} }, _gamePaused: false, _pauseReturnFocus: null,
            _mdHeldMoveKeys: { clear: () => calls.push('board') },
            window: { ShooterControls: { suspendInput: () => calls.push('shooter') } },
            ThreeRenderer: { hubFreeRoam: { clearInput: () => calls.push('walker') } } });
        const a = src.indexOf(mode === 'pause' ? '        function openPauseMenu() {' : '        function renderUiDialog() {');
        const b = src.indexOf(mode === 'pause' ? '            if (_cinematicEl)' : '            /* onclick', a);
        vm.runInContext(src.slice(a, b) + '\n}\n' + (mode === 'pause' ? 'openPauseMenu()' : 'renderUiDialog()'), ctx);
        assert.deepEqual(calls, ['board', 'shooter', 'walker']);
    }
});
