'use strict';

// Execute the production lifecycle/input functions with controlled DOM and
// timer boundaries. No WebGL, browser playtest, or battle simulation required.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = file => fs.readFileSync(path.join(__dirname, file), 'utf8');
function section(text, start, end) {
    const a = text.indexOf(start);
    const b = text.indexOf(end, a + start.length);
    assert.ok(a >= 0 && b > a, `source boundary missing: ${start}`);
    return text.slice(a, b + end.length);
}
function element() {
    const classes = new Set();
    return { style: {}, classList: {
        add: (...xs) => xs.forEach(x => classes.add(x)),
        remove: (...xs) => xs.forEach(x => classes.delete(x)),
        contains: x => classes.has(x),
        toggle: (x, on) => on ? classes.add(x) : classes.delete(x),
    } };
}
function hqHarness() {
    const src = source('map.js');
    const els = Object.fromEntries(['hqStage', 'hqLoad', 'hqLoadNote', 'hqDebug', 'hqHints'].map(id => [id, element()]));
    const entries = [], timers = new Map();
    let next = 0, now = 0, result = true;
    const noop = () => {};
    const ctx = vm.createContext({
        console: { warn: noop, error: noop }, location: { search: '' },
        performance: { now: () => now },
        setTimeout(fn, ms) { const id = ++next; timers.set(id, { fn, ms, canceled: false }); return id; },
        clearTimeout(id) { timers.get(id).canceled = true; },
        _hqEl: id => els[id] || null, _hqRoomExists: () => true,
        _hqProfile: () => null, _hqAvatar: () => ({}), _hqFillStrip: noop,
        _hqTermDrop: noop, _hqSetPrompt: noop, _hqInteractTarget: noop,
        _hqWalkThroughDoor: noop, _hqOpenCounter: noop, _hqCheckPromotion: noop,
        _hqRecordVisit: noop, playSfx: noop, syncMusicToState: () => Promise.resolve(),
        _hqHome: false, _hqSuspended: false, _hqLastRoom: 'central_egress',
        _hqCurRoom: '', _hqLastDoor: null, _hqBellRungFor: null,
        state: { phase: 'setup' }, GS: { HQ: 'hq', MAIN_MENU: 'menu' },
        DOOR_HQ: { rooms: { central_egress: { label: 'Egress' } } },
        ThreeRenderer: { hq: {
            enter(opts) { entries.push(opts); if (result instanceof Error) throw result; return result; },
            active: () => true, leave: noop, goTo: noop,
        } },
        _showTitlePage(id) { ctx.page = id; },
        window: { _hqClosePanel: noop, _hqRelabelMenuButtons: noop },
    });
    vm.runInContext(section(src, '        let _hqEnteredAt = 0;', '\n        let _hqHome = false;').replace('        let _hqHome = false;', '') + '\n' +
        section(src, '        window._hqEnter = function (opts)', '\n        };') + '\n' +
        section(src, '        window._hqLeave = function ()', '\n        };'), ctx);
    return { ctx, entries, timers, card: els.hqLoad,
        enter: opts => ctx.window._hqEnter(opts), leave: () => ctx.window._hqLeave(),
        setNow: value => { now = value; }, setResult: value => { result = value; },
        run(id) { const timer = timers.get(id); assert.ok(timer); timer.fn(); },
    };
}

test('HQ ignores an old ready callback after a newer entry', () => {
    const h = hqHarness();
    h.enter(); const old = h.entries[0];
    h.setNow(100); h.enter({ from: 'walk' });
    old.onReady();
    assert.equal(h.timers.size, 0);
    assert.equal(h.card.style.display, '');
    assert.equal(h.card.classList.contains('done'), false);
    h.setNow(130); h.entries[1].onReady();
    assert.equal(h.timers.get(1).ms, 120);
    h.run(1); assert.equal(h.card.classList.contains('done'), true);
    assert.equal(h.timers.get(2).ms, 320);
    h.run(2); assert.equal(h.card.style.display, 'none');
});

test('HQ cancels fade and hide timers, even if canceled callbacks still arrive', () => {
    const h = hqHarness();
    h.enter(); h.entries[0].onReady();
    assert.equal(h.timers.get(1).ms, 900);
    h.enter(); assert.equal(h.timers.get(1).canceled, true);
    h.run(1); assert.equal(h.card.classList.contains('done'), false);
    h.entries[1].onReady(); h.run(2);
    assert.equal(h.timers.get(3).ms, 650);
    h.leave(); assert.equal(h.timers.get(3).canceled, true);
    h.enter({ from: 'walk' }); h.run(3);
    assert.equal(h.card.style.display, '');
    assert.equal(h.card.classList.contains('walk'), true);
});

test('HQ leave invalidates readiness and repeated readiness schedules only one fade', () => {
    const h = hqHarness();
    h.enter(); h.leave(); h.entries[0].onReady();
    assert.equal(h.timers.size, 0);
    assert.equal(h.card.style.display, 'none');
    h.enter(); h.entries[1].onReady(); h.entries[1].onReady();
    assert.equal(h.timers.size, 1);
});

for (const failure of [false, new Error('renderer failure')]) {
    test(`HQ failure retires callbacks and returns to main menu (${String(failure)})`, () => {
        const h = hqHarness(); h.setResult(failure);
        assert.equal(h.enter(), false);
        assert.equal(h.ctx.page, 'mainMenuPage');
        assert.equal(h.ctx.state.gameState, 'menu');
        h.entries[0].onReady(); assert.equal(h.timers.size, 0);
        assert.equal(h.card.style.display, 'none');
    });
}

test('battle deactivation removes registered unit labels, preserves other labels, and is repeatable', () => {
    const src = source('three-renderer.js'), noop = () => {};
    const parent = { children: new Set(), remove(obj) { this.children.delete(obj); obj.parent = null; } };
    const battleLabel = { parent }, hqLabel = { parent };
    parent.children.add(battleLabel); parent.children.add(hqLabel);
    const ctx = vm.createContext({ console: { log: noop }, document: { getElementById: () => null },
        _plateObjs: new Map([['unit', { css2d: battleLabel }]]),
        _lastHpPctById: new Map([['unit', 0.5]]), _lastMpPctById: new Map([['unit', 0.4]]),
        _fogMeshes: new Map(), tileMeshes: new Map(), active: true,
    });
    for (const name of ['hideSplitscreen', '_clearAnimations', '_mdTorchPoolTeardown', '_clearFloatTextTweens', '_clearNexusBars', 'clearIntentBadges', 'clearArrows3D', 'clearGhostUnit', '_unbindInput', '_fogResetTileFades']) ctx[name] = noop;
    for (const name of ['_waterfallTexList', '_towerCubes', '_torchFlames', '_tornadoBillboards', '_zoneBorderMeshes', '_zoneBorderMats']) ctx[name] = [];
    for (const name of ['_terrainDecoGroup', 'renderer', '_fpsEl', '_miniWrap', 'canvas', 'css2dRenderer', '_floatDomOverlay', '_intentBadgeContainer', 'fogGroup']) ctx[name] = null;
    vm.runInContext(section(src, '    function _clearPlates()', '\n    }') + '\n' + section(src, '    function deactivate()', '\n    }'), ctx);
    ctx.deactivate(); ctx.deactivate();
    assert.equal(ctx.active, false);
    assert.equal(ctx._plateObjs.size, 0);
    assert.equal(battleLabel.parent, null);
    assert.equal(parent.children.has(hqLabel), true);
    assert.equal(ctx._lastHpPctById.get('unit'), 0.5);
    assert.equal(ctx._lastMpPctById.get('unit'), 0.4);
});

test('visible settings take controller priority over the title/HQ flag', () => {
    const src = source('state.js');
    const ctx = vm.createContext({ rebind: false, state: { titleScreenVisible: true }, window: {},
        _pauseOpen: () => false, _mmSettingsOpen: () => true });
    vm.runInContext(section(src, '            function _context()', '\n            }'), ctx);
    assert.equal(ctx._context(), 'domnav');
    ctx._mmSettingsOpen = () => false;
    assert.equal(ctx._context(), 'title');
    ctx.state.uiDialog = {}; assert.equal(ctx._context(), 'dialog');
    ctx._pauseOpen = () => true; assert.equal(ctx._context(), 'domnav');
    ctx.rebind = true; assert.equal(ctx._context(), 'rebind');
});

test('Tab leaves battle targets untouched under pause/dialog and still cycles after closing', () => {
    const src = source('ui.js');
    const marker = src.indexOf('/* ── Single Escape owner');
    const start = src.lastIndexOf("        document.addEventListener('keydown'", marker);
    assert.ok(start >= 0 && marker > start);
    let listener, cycles = 0, prevented = 0;
    const ctx = vm.createContext({ document: { addEventListener: (_, fn) => { listener = fn; } },
        state: { phase: 'battle', actionMode: 'spell', _spellCycleTargets: [1, 2], _attackCycleTargets: [1, 2] },
        _gamePaused: true, cycleSpellTarget: dir => { cycles += dir; }, cycleAttackTarget: dir => { cycles += dir; },
    });
    vm.runInContext(section(src.slice(start), "        document.addEventListener('keydown'", '\n        });'), ctx);
    const event = { key: 'Tab', shiftKey: false, preventDefault() { prevented++; } };
    for (const mode of ['spell', 'attack']) {
        ctx.state.actionMode = mode;
        ctx._gamePaused = true; listener(event);
        ctx._gamePaused = false; ctx.state.uiDialog = {}; listener(event);
        assert.equal(cycles, 0); assert.equal(prevented, 0);
    }
    ctx.state.uiDialog = null;
    ctx.state.actionMode = 'spell'; listener(event);
    ctx.state.actionMode = 'attack'; listener({ ...event, shiftKey: true });
    assert.equal(cycles, 0); assert.equal(prevented, 2);
});

function pauseHarness() {
    const src = source('ui.js'), frames = [], listeners = new Map();
    const doc = { activeElement: null, body: { appendChild() {} },
        getElementById: () => null, createElement: () => overlay,
        addEventListener: (name, fn) => listeners.set(name, fn),
        removeEventListener: name => listeners.delete(name) };
    function control(id, opts = {}) {
        return { ...element(), id, tabIndex: 0, tagName: 'BUTTON', isConnected: true,
            hidden: false, disabled: false, active: false, action: id,
            getClientRects() { return this.hidden ? [] : [{}]; },
            matches(sel) { return sel === ':disabled' ? this.disabled : this.active; },
            closest() { return null; }, getAttribute(name) { return name === 'onclick' ? this.action : null; },
            focus() { doc.activeElement = this; }, ...opts };
    }
    let controls = [];
    const overlay = control('pauseOverlay', { querySelectorAll: () => controls,
        contains: el => el === overlay || controls.includes(el),
        setAttribute() {}, addEventListener() {} });
    Object.defineProperty(overlay, 'innerHTML', { set() {
        controls.forEach(el => { el.isConnected = false; });
        controls = [control('tab', { active: true }), control('setting'), control('resume')];
        doc.activeElement = doc.body;
    } });
    const origin = control('aim'); doc.activeElement = origin;
    const ctx = vm.createContext({ document: doc, window: {}, state: { phase: 'battle', actionMode: 'spell' },
        getComputedStyle: () => ({ visibility: 'visible' }), requestAnimationFrame: fn => frames.push(fn),
        _cinematicEl: null, _activeCinematic: null, _pauseTab: 'scoreboard',
        _buildPauseScoreboard: () => '', _buildPauseMusic: () => '' });
    vm.runInContext(section(src, '        let _pauseOverlay = null;', '\n        function togglePauseMenu()').replace('        function togglePauseMenu()', '') + '\n' +
        section(src, '        function openPauseMenu()', '\n        window.openPauseMenu = openPauseMenu;') + '\n' +
        section(src, '        function _renderPauseMenu()', '\n        window._setPauseTab = function(tab)') .replace('        window._setPauseTab = function(tab)', '') + '\n' +
        section(src, '        window._setPauseTab = function(tab)', '\n        };') + '\n' +
        section(src, '        function closePauseMenu()', '\n        window.closePauseMenu = closePauseMenu;'), ctx);
    const key = (name, shift = false) => {
        const e = { key: name, shiftKey: shift, prevented: false, stopped: false,
            preventDefault() { this.prevented = true; }, stopPropagation() { this.stopped = true; } };
        ctx._pauseKeydown(e); return e;
    };
    return { ctx, doc, overlay, origin, frames, listeners, key, controls: () => controls };
}

test('pause focuses the menu, wraps both Tab boundaries and contains shortcut bubbling', () => {
    const h = pauseHarness(); h.ctx.openPauseMenu();
    const [first, middle, last] = h.controls();
    assert.equal(h.doc.activeElement, first);
    last.focus(); assert.equal(h.key('Tab').prevented, true); assert.equal(h.doc.activeElement, first);
    assert.equal(h.key('Tab', true).prevented, true); assert.equal(h.doc.activeElement, last);
    middle.focus(); assert.equal(h.key('Tab').prevented, false);
    assert.equal(h.key('ArrowRight').prevented, false); assert.equal(h.key('ArrowRight').stopped, true);
    middle.disabled = true; last.hidden = true; first.focus();
    assert.equal(h.key('Tab').prevented, true); assert.equal(h.doc.activeElement, first);
    h.controls().forEach(el => { el.hidden = true; });
    h.key('Tab'); assert.equal(h.doc.activeElement, h.overlay);
});

test('pause redraw restores an equivalent setting and changing tabs focuses the header', () => {
    const h = pauseHarness(); h.ctx.openPauseMenu();
    const old = h.controls()[1]; old.focus(); h.ctx._renderPauseMenu();
    assert.equal(old.isConnected, false);
    assert.equal(h.doc.activeElement, h.controls()[1]);
    h.ctx.window._setPauseTab('audio'); assert.equal(h.doc.activeElement, h.controls()[0]);
    h.ctx._pauseFocusGuard({ target: h.origin }); assert.equal(h.doc.activeElement, h.controls()[0]);
});

test('pause restores aiming focus once and a queued open frame cannot reactivate a closed menu', () => {
    const h = pauseHarness(); h.ctx.openPauseMenu(); h.ctx.openPauseMenu();
    h.key('Escape');
    assert.equal(h.doc.activeElement, h.origin);
    assert.equal(h.ctx.state.actionMode, 'spell');
    h.frames.forEach(fn => fn()); assert.equal(h.overlay.classList.contains('active'), false);
    assert.equal(h.listeners.has('focusin'), false);
    h.doc.activeElement = h.doc.body; h.ctx.closePauseMenu(); assert.equal(h.doc.activeElement, h.doc.body);
});

test('pause yields to a nested dialog and never restores a removed launcher', () => {
    const h = pauseHarness(); h.ctx.openPauseMenu(); h.ctx.state.uiDialog = {};
    h.doc.activeElement = h.doc.body;
    h.ctx._pauseFocusGuard({ target: h.doc.body }); assert.equal(h.doc.activeElement, h.doc.body);
    assert.equal(h.key('Escape').stopped, false);
    h.ctx.state.uiDialog = null; h.origin.isConnected = false;
    h.ctx.closePauseMenu(); assert.notEqual(h.doc.activeElement, h.origin);
});
