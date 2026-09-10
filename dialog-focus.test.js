'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
function harness() {
    const listeners = new Map();
    const doc = { activeElement: null, addEventListener: (k, f) => listeners.set(k, f),
        removeEventListener: k => listeners.delete(k) };
    function control(id) {
        return { id, tabIndex: 0, isConnected: true, disabled: false, hidden: false,
            outerHTML: id, getClientRects() { return this.hidden ? [] : [{}]; },
            matches() { return this.disabled; }, closest() { return null; },
            focus() { doc.activeElement = this; }, setAttribute() {} };
    }
    const root = control('card'), overlay = { classList: { add() {}, remove() {} }, setAttribute() {} };
    let controls = [];
    root.querySelectorAll = () => controls;
    root.contains = el => el === root || controls.includes(el);
    Object.defineProperty(root, 'innerHTML', { set(html) {
        controls.forEach(el => el.isConnected = false);
        controls = html ? [control('confirm'), control('cancel')] : [];
        doc.activeElement = null;
    } });
    doc.getElementById = id => id === 'uiDialogCard' ? root : overlay;
    const origin = control('launcher'); origin.focus();
    const ctx = vm.createContext({ document: doc, window: {}, state: { uiDialog: null },
        getComputedStyle: () => ({ visibility: 'visible' }), _mdHeldMoveKeys: new Set(),
        escapeHtml: String, markDirty() {}, _gamePaused: false,
        _pauseFocusSnapshot: () => ({ index: 2 }), _pauseFocusRestore: s => { ctx.restored = s; },
        _mmSettingsActive: () => false });
    const src = fs.readFileSync(path.join(__dirname, 'ui.js'), 'utf8');
    const start = src.indexOf('        let _uiDialogFocusOwner = null;');
    const end = src.indexOf('        function handleSecondaryJobSelect(', start);
    assert.ok(start >= 0 && end > start, 'production dialog functions exist');
    vm.runInContext(src.slice(start, end), ctx);
    ctx.renderIfDirty = () => ctx.renderUiDialog();
    const open = () => { ctx.state.uiDialog = { type: 'confirm' }; ctx.renderUiDialog(); };
    const close = () => { ctx.state.uiDialog = null; ctx.renderUiDialog(); };
    const key = (key, shiftKey = false, repeat = false) => {
        const e = { key, shiftKey, repeat, preventDefault() { this.prevented = true; },
            stopPropagation() { this.stopped = true; } };
        ctx._uiDialogKeydown(e); return e;
    };
    return { ctx, doc, root, origin, controls: () => controls, listeners, open, close, key };
}
test('dialog traps Tab both ways, filters unavailable controls and guards escaped focus', () => {
    const h = harness(); h.open();
    const [first, last] = h.controls();
    assert.equal(h.doc.activeElement, first);
    last.focus(); assert.ok(h.key('Tab').prevented); assert.equal(h.doc.activeElement, first);
    h.key('Tab', true); assert.equal(h.doc.activeElement, last);
    last.disabled = true; first.focus(); h.key('Tab'); assert.equal(h.doc.activeElement, first);
    first.hidden = true; h.key('Tab'); assert.equal(h.doc.activeElement, h.root);
    first.hidden = false; h.ctx._uiDialogFocusGuard({ target: h.origin });
    assert.equal(h.doc.activeElement, first);
});
test('dialog redraw retains selected control and replacement returns to original launcher', () => {
    const h = harness(); h.open(); const old = h.controls()[1]; old.focus();
    h.ctx.renderUiDialog(); assert.equal(old.isConnected, false);
    assert.equal(h.doc.activeElement, h.controls()[1]);
    h.ctx.state.uiDialog = { type: 'confirm' }; h.ctx.renderUiDialog();
    assert.equal(h.doc.activeElement, h.controls()[0]);
    h.close(); assert.equal(h.doc.activeElement, h.origin);
    assert.equal(h.listeners.size, 0); assert.equal(h.root.onkeydown, null);
    h.doc.activeElement = null; h.close(); assert.equal(h.doc.activeElement, null);
});
test('Escape cancels once without bubbling, repeat is ignored and native activation is preserved', () => {
    const h = harness(); h.open(); let canceled = 0;
    h.ctx.state.uiDialog.onCancel = () => canceled++;
    assert.ok(h.key('Enter').stopped); assert.equal(h.key('Enter').prevented, undefined);
    h.key('Escape', false, true); assert.equal(canceled, 0);
    const e = h.key('Escape'); assert.ok(e.prevented && e.stopped);
    assert.equal(canceled, 1); assert.equal(h.ctx.state.uiDialog, null);
    assert.equal(h.doc.activeElement, h.origin);
});
test('removed launchers restore equivalent pause control and hidden launchers are rejected', () => {
    const h = harness(); h.ctx._gamePaused = true; h.open();
    h.origin.isConnected = false; h.close(); assert.equal(h.ctx.restored.index, 2);
    const g = harness(); g.open(); g.origin.hidden = true; g.close();
    assert.notEqual(g.doc.activeElement, g.origin);
});
test('required job selection consumes Escape without dismissing and primary callback runs once', () => {
    const h = harness(); h.open(); h.ctx.state.uiDialog.type = 'secondaryJobPick';
    h.key('Escape'); assert.ok(h.ctx.state.uiDialog);
    h.ctx.state.uiDialog.type = 'confirm'; let confirmed = 0;
    h.ctx.state.uiDialog.onConfirm = () => confirmed++;
    h.ctx.handleUiDialogPrimary(); assert.equal(confirmed, 1);
    assert.equal(h.doc.activeElement, h.origin);
});

test('redrawn Settings restores the launcher snapshot across replacement dialogs', () => {
    const h = harness();
    h.ctx._mmSettingsActive = () => true;
    let snapshots = 0;
    h.ctx._mmSettingsSnapshot = () => { snapshots++; return { index: 3, id: 'audioSetting' }; };
    h.ctx._mmSettingsFocus = snapshot => { h.ctx.settingsRestored = snapshot; };
    h.open();
    h.origin.isConnected = false;
    h.open();
    h.close();
    assert.equal(snapshots, 1, 'replacement dialog must preserve original Settings launcher');
    assert.equal(h.ctx.settingsRestored.id, 'audioSetting');
    assert.equal(h.ctx.settingsRestored.index, 3);
    h.doc.activeElement = h.origin; h.origin.isConnected = true;
    h.ctx._mmSettingsActive = () => false;
    h.open(); h.close();
    assert.equal(h.doc.activeElement, h.origin);
});

test('aria-hidden dialog controls are excluded even when they retain layout rectangles', () => {
    const h = harness(); h.open();
    const [first, last] = h.controls();
    last.closest = selector => selector.includes('aria-hidden') ? {} : null;
    first.focus();
    h.key('Tab');
    assert.equal(h.doc.activeElement, first);
    h.key('Tab', true);
    assert.equal(h.doc.activeElement, first);
});

test('a dialog closing after Settings exits does not restore a stale Settings snapshot', () => {
    const h = harness();
    h.ctx._mmSettingsActive = () => true;
    h.ctx._mmSettingsSnapshot = () => ({ index: 3 });
    h.ctx._mmSettingsFocus = () => assert.fail('inactive Settings must not receive focus');
    h.open();
    h.origin.isConnected = false;
    h.ctx._mmSettingsActive = () => false;
    h.close();
    assert.equal(h.listeners.size, 0);
});
