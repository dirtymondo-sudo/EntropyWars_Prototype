'use strict';
/* HUD THEMES (2026-09-12) — source scans. The battle HUD's material is a
   token set (THE COLOUR PASS in hud.js's injected stylesheet); a theme is
   one :root[data-hud-theme] block, picked from the pause menu (ui.js) and
   the main-menu Settings (map.js) through map.js _buildHudThemeHTML. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const read = (f) => fs.readFileSync(path.join(__dirname, f), 'utf8');
const hud = read('hud.js');
const ui = read('ui.js');
const map = read('map.js');

function catalogue() {
    const a = hud.indexOf('const HUD_THEMES = [');
    const b = hud.indexOf('];', a) + 2;
    assert.ok(a > 0 && b > a, 'HUD_THEMES found');
    return vm.runInNewContext(hud.slice(a, b).replace('const HUD_THEMES =', '') , {});
}

test('every theme in the catalogue has a token block, and the default has none', () => {
    const themes = catalogue();
    assert.ok(themes.length >= 4, 'at least four themes');
    const ids = themes.map(t => t.id);
    assert.equal(new Set(ids).size, ids.length, 'ids unique');
    assert.ok(ids.includes('crystal') && ids.includes('void') && ids.includes('parchment') && ids.includes('glass'));
    assert.ok(hud.includes("const HUD_THEME_DEFAULT = 'crystal';"), 'the default is Classic Blue');
    for (const t of themes) {
        assert.ok(t.label && t.hint, 'label + hint for ' + t.id);
        const has = hud.includes(':root[data-hud-theme="' + t.id + '"] {');
        if (t.id === 'crystal') assert.ok(!has, 'the default theme is the bare :root block');
        else assert.ok(has, 'token block for ' + t.id);
    }
    // no orphan token block without a catalogue row
    for (const m of hud.matchAll(/:root\[data-hud-theme="([a-z]+)"\]/g)) assert.ok(ids.includes(m[1]), 'orphan theme block ' + m[1]);
});

test('the material reads tokens, never literals, at the plate / row / scoreboard sites', () => {
    const a = hud.indexOf('THE COLOUR PASS + THE THEMES');
    const b = hud.indexOf('THE PARTY DOCK — bottom-right portrait row', a);
    const css = hud.slice(a, b);
    for (const tok of ['--ew-plate-bg', '--ew-plate-edge', '--ew-row-bg', '--ew-row-sel-bg', '--ew-ink', '--ew-ink-mute', '--ew-sel', '--ew-dead-bg', '--ew-tshadow']) {
        assert.ok(css.includes('var(' + tok), 'token read: ' + tok);
    }
    // every non-default theme defines the four load-bearing tokens
    for (const m of css.matchAll(/:root\[data-hud-theme="[a-z]+"\] \{([\s\S]*?)\n    \}/g)) {
        for (const tok of ['--ew-plate-bg:', '--ew-row-bg:', '--ew-ink:', '--ew-dead-bg:']) assert.ok(m[1].includes(tok), tok + ' in ' + m[0].slice(0, 40));
    }
    assert.ok(css.includes('.ew-score-plate, .ew-meta-plate {\n      background: var(--ew-plate-bg) !important;'), 'scoreboard plate follows the theme');
    assert.ok(css.includes('.hrlg-blade[data-bid="attack"] .hrlg-body { --bc: #ff5a4a'), 'attack is red');
    assert.ok(css.includes('.hrlg-blade[data-bid="abil"] .hrlg-body  { --bc: #5aa8ff'), 'abilities are blue');
    assert.ok(css.includes('.hrlg-blade[data-bid="items"] .hrlg-body { --bc: #4fe08a'), 'items are green');
    assert.ok(hud.includes("'data-bid': b.id,"), 'blades carry their id');
});

test('the scoreboard writes its ink through the theme tokens', () => {
    assert.ok(hud.includes("ink:     'var(--ew-ink, ' + EW.ink + ')'"), 'EW_T.ink wrapper');
    const a = hud.indexOf('function ScoreSideColumn(');
    const b = hud.indexOf('function CombatLog(');
    const sb = hud.slice(a, b);
    assert.ok(!/\bEW\.(ink|inkMute|inkDim|body)\b/.test(sb), 'no raw EW ink in the scoreboard / meta pill');
    assert.ok(sb.includes('EW_T.inkMute'), 'EW_T used');
});

test('the API is on window and applied at load; both menus render the picker', () => {
    for (const fn of ['window.getHudTheme = function', 'window.setHudTheme = function', 'window.applyHudTheme = function', 'window.applyHudTheme(window.getHudTheme());']) {
        assert.ok(hud.includes(fn), fn);
    }
    assert.ok(hud.includes("localStorage.setItem(HUD_THEME_KEY, id)"), 'persisted');
    assert.ok(hud.includes("root.dataset.hudTheme = id"), 'applied as data-hud-theme');
    assert.ok(map.includes('window._buildHudThemeHTML = function (refreshJs)'), 'map.js builder');
    assert.ok(map.includes("window._buildHudThemeHTML('window._openMainMenuSettings();')"), 'main-menu Settings');
    assert.ok(ui.includes("window._buildHudThemeHTML('_renderPauseMenu();')"), 'pause menu');
    assert.ok(map.includes("window.setHudTheme('${t.id}');${refreshJs}"), 'the button sets + refreshes');
});
