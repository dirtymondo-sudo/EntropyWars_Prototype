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
        _mdHeldMoveKeys: new Set(),
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

function settingsHarness() {
    const src = source('map.js'), listeners = new Map();
    const doc = { activeElement: null, addEventListener: (k, fn) => listeners.set(k, fn),
        removeEventListener: k => listeners.delete(k) };
    function control(id, owner, opts = {}) {
        return { ...element(), id, owner, isConnected: true, tabIndex: 0, tagName: 'BUTTON',
            disabled: false, hidden: false, action: id,
            getClientRects() { return this.hidden || (this.owner && !this.owner.classList.contains('active')) ? [] : [{}]; },
            matches() { return this.disabled; }, closest() { return null; },
            getAttribute(k) { return k === 'onclick' ? this.action : null; },
            focus() { doc.activeElement = this; }, ...opts };
    }
    const pages = ['settingsPage', 'mainMenuPage', 'spellLibraryPage', 'hqPage'].map(id => control(id));
    const [page, home] = pages; home.classList.add('active');
    page.getClientRects = () => page.classList.contains('active') ? [{}] : [];
    let controls = [];
    page.querySelectorAll = () => controls;
    page.contains = el => el === page || controls.includes(el);
    page.setAttribute = () => {};
    page.addEventListener = (k, fn) => listeners.set('page-' + k, fn);
    const origin = control('launcher', home), fallback = control('fallback', home);
    home.querySelectorAll = () => [origin, fallback];
    pages[3].querySelectorAll = () => [fallback];
    doc.activeElement = origin;
    const body = {};
    Object.defineProperty(body, 'innerHTML', { set() {
        controls.forEach(el => { el.isConnected = false; });
        controls = [control('back', page), control('volume', page), control('toggle', page)];
        doc.activeElement = doc;
    } });
    doc.getElementById = id => id === 'mmSettingsBody' ? body : pages.find(p => p.id === id) || null;
    const ctx = vm.createContext({ document: doc, window: { _buildPerfSettingsHTML: () => '' },
        state: {}, GS: { MAIN_MENU: 'menu' }, playSfx() {},
        getComputedStyle: () => ({ visibility: 'visible' }),
        startOverlay: { querySelectorAll: () => pages, querySelector: () => pages.find(p => p.classList.contains('active')) } });
    const cut = (a, b) => src.slice(src.indexOf(a), src.indexOf(b, src.indexOf(a)));
    vm.runInContext(cut('        function _showTitlePage(pageId)', '        let _enterGameAudioHandled') +
        cut('        let _mmSettingsReturnFocus', '        window._goToCodex') +
        cut('        function _renderMainMenuSettings()', '        const _TRAIN_MAP_POOL') +
        cut('        window._goToSpellLibrary', '        /* ── Standalone Party Builder'), ctx);
    let returns = 0;
    ctx.window._hqReturnOrMenu = () => { returns++; ctx._showTitlePage('mainMenuPage'); };
    function key(key, shiftKey = false) {
        const e = { key, shiftKey, stopped: false, prevented: false,
            stopPropagation() { this.stopped = true; }, preventDefault() { this.prevented = true; } };
        ctx._mmSettingsKeydown(e); return e;
    }
    return { ctx, doc, page, origin, fallback, controls: () => controls, listeners, key, returns: () => returns };
}

test('settings owns focus and Tab boundaries while preserving native control keys', () => {
    const h = settingsHarness(); h.ctx.window._openMainMenuSettings();
    const [first, middle, last] = h.controls();
    assert.equal(h.doc.activeElement, first);
    last.focus(); assert.equal(h.key('Tab').prevented, true); assert.equal(h.doc.activeElement, first);
    h.key('Tab', true); assert.equal(h.doc.activeElement, last);
    middle.focus(); assert.equal(h.key('Tab').prevented, false);
    const arrow = h.key('ArrowRight'); assert.equal(arrow.stopped, true); assert.equal(arrow.prevented, false);
    last.disabled = true; middle.hidden = true; first.focus();
    h.key('Tab'); assert.equal(h.doc.activeElement, first);
    first.hidden = true; h.key('Tab'); assert.equal(h.doc.activeElement, h.page);
});

test('settings production redraw and repeated opening preserve control and original launcher', () => {
    const h = settingsHarness(); h.ctx.window._openMainMenuSettings();
    h.controls()[1].focus(); const old = h.doc.activeElement;
    h.ctx._renderMainMenuSettings(); assert.equal(old.isConnected, false);
    assert.equal(h.doc.activeElement, h.controls()[1]);
    h.ctx.window._openMainMenuSettings(); assert.equal(h.doc.activeElement, h.controls()[1]);
    h.key('Escape'); assert.equal(h.doc.activeElement, h.origin); assert.equal(h.returns(), 1);
    h.ctx.window._settingsBack(); assert.equal(h.returns(), 1);
    assert.equal(h.listeners.has('focusin'), false);
});

test('settings releases focus for library and page exits and yields to nested dialogs', () => {
    const h = settingsHarness(); h.ctx.window._openMainMenuSettings();
    h.ctx.state.uiDialog = {}; h.doc.activeElement = h.doc;
    h.ctx._mmSettingsFocusGuard({ target: h.doc }); assert.equal(h.doc.activeElement, h.doc);
    assert.equal(h.key('Escape').stopped, false); assert.equal(h.returns(), 0);
    h.ctx.state.uiDialog = null;
    h.ctx.window._goToSpellLibrary(); assert.equal(h.listeners.has('focusin'), false);
    assert.equal(h.key('Tab').stopped, false);
    h.ctx.window._spellLibraryBack(); assert.equal(h.doc.activeElement, h.controls()[0]);
    h.key('Escape'); assert.equal(h.doc.activeElement, h.origin);
    h.ctx.window._openMainMenuSettings(); h.ctx._showTitlePage('mainMenuPage');
    h.fallback.focus(); h.ctx.window._openMainMenuSettings(); h.key('Escape');
    assert.equal(h.doc.activeElement, h.fallback);
});

test('settings Back uses a visible destination control when its launcher disappears', () => {
    const h = settingsHarness(); h.ctx.window._openMainMenuSettings();
    h.origin.isConnected = false; h.key('Escape'); assert.equal(h.doc.activeElement, h.fallback);
});

test('settings rejects focus in inactive pages even when opacity-hidden pages retain layout', () => {
    const h = settingsHarness();
    const inactive = element();
    const retained = { isConnected: true, tabIndex: 0, matches: () => false,
        getClientRects: () => [{}], closest: selector => selector === '.title-page' ? inactive : null };
    assert.equal(h.ctx._mmSettingsCanFocus(retained), false);
    inactive.classList.add('active'); assert.equal(Boolean(h.ctx._mmSettingsCanFocus(retained)), true);
});

function controllerSettingsHarness() {
    const doc = { activeElement: null };
    function control(id, page = null) {
        return Object.assign(element(), { id, page, offsetParent: {}, visibility: 'visible',
            blocked: false, disabled: false, tagName: 'BUTTON', clicks: 0, events: [],
            getBoundingClientRect() { return { width: 100, height: 30 }; },
            closest(selector) { return selector === '.title-page' ? this.page :
                (this.blocked || this.page?.blocked ? this : null); },
            focus() { doc.activeElement = this; }, click() { this.clicks++; },
            dispatchEvent(e) { this.events.push(e.type); }, querySelectorAll() { return this.controls || []; },
        });
    }
    const page = control('settingsPage'), pause = control('pauseOverlay'), dialog = control('uiDialogOverlay');
    const back = control('back', page), slider = control('volume', page), menu = control('mainMenu');
    slider.tagName = 'INPUT'; slider.type = 'range'; slider.value = '5'; slider.step = '1';
    page.controls = [back, slider]; page.classList.add('active'); dialog.offsetParent = null;
    pause.controls = [control('resume')]; dialog.controls = [control('dialogConfirm')];
    doc.body = control('body'); doc.body.controls = [back, slider, menu]; doc.activeElement = doc.body;
    const els = { settingsPage: page, pauseOverlay: pause, uiDialogOverlay: dialog };
    doc.getElementById = id => els[id] || null;
    const ctx = vm.createContext({ document: doc, window: {}, rebind: false,
        state: { titleScreenVisible: true }, getComputedStyle: el => ({ visibility: el.visibility }),
        Event: class { constructor(type) { this.type = type; } } });
    vm.runInContext(section(source('state.js'), '            function _pauseOpen()', '\n            /* ── synthetic keys:')
        .replace('            /* ── synthetic keys:', ''), ctx);
    return { ctx, doc, page, back, slider, menu, pause, dialog, els };
}

test('controller Settings ownership rejects inactive pages with retained geometry and hidden roots', () => {
    const h = controllerSettingsHarness();
    assert.equal(h.ctx._mmSettingsOpen(), true); assert.equal(h.ctx._context(), 'domnav');
    h.page.classList.remove('active');
    assert.equal(h.page.getBoundingClientRect().width, 100);
    assert.equal(h.ctx._mmSettingsOpen(), false); assert.equal(h.ctx._context(), 'title');
    assert.equal(h.ctx._domNavRoot(), h.doc.body);
    assert.deepEqual(Array.from(h.ctx._domNavEls()), [h.menu]);
    h.page.classList.add('active');
    for (const [key, value] of [['blocked', true], ['visibility', 'hidden'], ['offsetParent', null]]) {
        const old = h.page[key]; h.page[key] = value;
        assert.equal(h.ctx._mmSettingsOpen(), false, key); h.page[key] = old;
    }
    h.page.getBoundingClientRect = () => ({ width: 0, height: 0 });
    assert.equal(h.ctx._mmSettingsOpen(), false);
    delete h.els.settingsPage; assert.equal(h.ctx._mmSettingsOpen(), false);
});

test('controller navigates the whole Settings page including Back and preserves owner precedence', () => {
    const h = controllerSettingsHarness();
    assert.equal(h.ctx._domNavRoot(), h.page);
    h.ctx._domNavStep(1); assert.equal(h.doc.activeElement, h.back);
    h.ctx._domNavStep(-1); assert.equal(h.doc.activeElement, h.slider);
    h.ctx._domNavStep(1); h.ctx._domNavActivate(); assert.equal(h.back.clicks, 1);
    h.ctx.state.uiDialog = {}; h.dialog.offsetParent = {};
    assert.equal(h.ctx._context(), 'dialog'); assert.equal(h.ctx._domNavRoot(), h.dialog);
    h.pause.classList.add('active');
    assert.equal(h.ctx._context(), 'domnav'); assert.equal(h.ctx._domNavRoot(), h.pause);
    h.ctx.rebind = true; assert.equal(h.ctx._context(), 'rebind');
});

test('controller Confirm and adjustment cannot act on stale or ineligible focused controls', () => {
    const h = controllerSettingsHarness();
    h.menu.focus(); h.ctx._domNavActivate();
    assert.equal(h.menu.clicks, 0); assert.equal(h.doc.activeElement, h.back);
    h.slider.focus(); assert.equal(h.ctx._domNavAdjust(1), true);
    assert.equal(h.slider.value, '6'); assert.deepEqual(h.slider.events, ['input', 'change']);
    h.page.classList.remove('active');
    assert.equal(h.ctx._domNavAdjust(1), false); assert.equal(h.slider.value, '6');
    h.ctx._domNavActivate(); assert.equal(h.slider.clicks, 0); assert.equal(h.doc.activeElement, h.menu);
    h.page.classList.add('active');
    for (const [key, value] of [['disabled', true], ['blocked', true], ['visibility', 'hidden'], ['offsetParent', null]]) {
        const old = h.slider[key]; h.slider[key] = value; h.slider.focus();
        assert.equal(h.ctx._domNavAdjust(1), false, key);
        h.ctx._domNavActivate(); assert.equal(h.slider.clicks, 0, key); h.slider[key] = old;
    }
});

function battleMoveHarness() {
    const handlers = { document: {}, window: {} }, steps = [];
    const surface = name => ({ addEventListener(type, fn) {
        (handlers[name][type] ||= []).push(fn);
    } });
    const doc = surface('document'), win = surface('window');
    win._mdLockstepActive = () => true;
    win._mdLockstepStep = (dx, dy) => { steps.push([dx, dy]); return true; };
    const ctx = vm.createContext({ document: doc, window: win,
        state: { phase: 'battle', activePlayer: 1, pendingTarget: { x: 3, y: 4 } },
        _gamePaused: false, _wasdAnimating: false, _wasdOrigin: null,
        scheduleBoardRender() {} });
    vm.runInContext(section(source('ui.js'), '        const _mdHeldMoveKeys = new Set();',
        '\n        const _origClickTile = clickTile;').replace('        const _origClickTile = clickTile;', ''), ctx);
    const fire = (type, extra = {}, name = 'document') => {
        const e = { key: '', target: { tagName: 'DIV' }, prevented: false,
            preventDefault() { this.prevented = true; }, ...extra };
        for (const fn of handlers[name][type] || []) fn(e);
        return e;
    };
    return { ctx, doc, win, steps, fire,
        held: () => Array.from(vm.runInContext('_mdHeldMoveKeys', ctx)) };
}

test('battle movement rejects pause, dialog, title and editable input without changing targets', () => {
    const h = battleMoveHarness(), pending = h.ctx.state.pendingTarget;
    for (const owner of ['pause', 'dialog', 'title', 'input', 'textarea', 'select', 'editable']) {
        h.ctx._gamePaused = owner === 'pause';
        h.ctx.state.uiDialog = owner === 'dialog' ? {} : null;
        h.ctx.state.titleScreenVisible = owner === 'title';
        const target = { tagName: owner.toUpperCase(), isContentEditable: owner === 'editable' };
        for (const key of ['w', 'ArrowRight', 'Enter']) {
            assert.equal(h.fire('keydown', { key, target }).prevented, false, owner);
        }
        assert.deepEqual(h.held(), [], owner);
    }
    assert.deepEqual(h.steps, []);
    assert.equal(h.ctx.state.pendingTarget, pending);
});

test('dungeon diagonals resume without directions held in menus and release survives ownership changes', () => {
    const h = battleMoveHarness();
    h.fire('keydown', { key: 'w' }); h.fire('keydown', { key: 'd' });
    assert.deepEqual(h.steps, [[0, -1], [1, -1]]);
    h.ctx._gamePaused = true; h.fire('keydown', { key: 's' }); h.fire('keyup', { key: 'w' });
    assert.deepEqual(h.held(), []);
    h.ctx._gamePaused = false; h.fire('keydown', { key: 'd' });
    assert.deepEqual(h.steps.at(-1), [1, 0]);
    h.ctx.state.uiDialog = {}; h.fire('keyup', { key: 'd' });
    assert.deepEqual(h.held(), []);
});

test('held battle directions clear on editable focus, hidden document, blur and drum arrow ownership', () => {
    const h = battleMoveHarness();
    for (const release of [
        () => h.fire('focusin', { target: { isContentEditable: true } }),
        () => { h.doc.hidden = true; h.fire('visibilitychange'); h.doc.hidden = false; },
        () => h.fire('blur', {}, 'window'),
        () => { h.win._hrlgArrowsOwned = true; h.fire('keydown', { key: 'ArrowRight' }); h.win._hrlgArrowsOwned = false; },
    ]) {
        h.fire('keydown', { key: 'w' }); release(); assert.deepEqual(h.held(), []);
        h.fire('keydown', { key: 'd' }); assert.deepEqual(h.steps.at(-1), [1, 0]);
        h.fire('keyup', { key: 'd' });
    }
});

test('opening pause or rendering a dialog clears a held direction before another key event', () => {
    const h = pauseHarness();
    h.ctx._mdHeldMoveKeys.add('w'); h.ctx.openPauseMenu();
    assert.equal(h.ctx._mdHeldMoveKeys.size, 0);
    const held = new Set(['w']), card = { innerHTML: '', onchange: null };
    const overlay = { ...element(), setAttribute() {} };
    const ctx = vm.createContext({ state: { uiDialog: { type: 'unknown' } },
        document: { getElementById: id => id === 'uiDialogCard' ? card : overlay },
        _mdHeldMoveKeys: held });
    vm.runInContext(section(source('ui.js'), '        function renderUiDialog() {',
        "            overlay.setAttribute('aria-hidden', 'false');") + '\n}', ctx);
    ctx.renderUiDialog(); assert.equal(held.size, 0);
});
