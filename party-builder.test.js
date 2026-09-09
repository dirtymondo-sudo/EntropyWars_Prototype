'use strict';
/* THE FORGE TERMINAL (PARTY_BUILDER_PLAN.md §5.1 — 2026-09-09)
   Source-scans party-builder.js and styles-base.css for the monitor's
   skeleton: the four tabs, the CRT root, the party row, ONE stage element,
   the online lock-flow names and every mechanic the redesign re-skins but
   never re-implements (plan rule 3.5). Grows with every stage. The file is
   browser-only (React via createElement), so the checks are textual. */
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const REPO_ROOT = __dirname;
const read = (f) => fs.readFileSync(path.join(REPO_ROOT, f), 'utf8');
const PB = read('party-builder.js');
const CSS = read('styles-base.css');

test('PB_TABS carries the four tabs, in order, on window', () => {
    const m = PB.match(/const PB_TABS = \[([\s\S]*?)\];/);
    assert.ok(m, 'PB_TABS constant missing');
    const ids = [...m[1].matchAll(/id:\s*'([a-z]+)'/g)].map(x => x[1]);
    assert.deepStrictEqual(ids, ['roster', 'tech', 'gear', 'dossier']);
    for (const t of ['ROSTER', 'TECHNIQUES', 'GEAR', 'DOSSIER']) assert.ok(m[1].includes(`label: '${t}'`), `tab label ${t} missing`);
    assert.ok(/window\.PB_TABS = PB_TABS/.test(PB), 'PB_TABS not exported on window');
    assert.ok(/window\._pbSetTab = setTab/.test(PB), '_pbSetTab hook missing');
});

test('the builder renders ONE monitor: the match-select CRT chrome with the forge root', () => {
    assert.ok(/className: `ms-crt ms-crt-page ms-crt-forge pb-tarot pb-tarot-\$\{unitFaction\}`/.test(PB), 'root must be .ms-crt.ms-crt-page.ms-crt-forge and keep .pb-tarot');
    assert.ok(PB.includes("'--pb-fc': fc"), 'the faction colour token must stay on the root');
    for (const cls of ['ms-crt-bezel', 'ms-crt-glass', 'ms-crt-screen', 'ms-crt-scan', 'ms-crt-glare', 'ms-crt-label', 'ms-crt-brand', 'ms-crt-led']) {
        assert.ok(PB.includes(`className: '${cls}'`), `${cls} missing from the monitor`);
    }
    assert.ok(PB.includes("className: 'ms-tty pb-tty'"), 'the terminal typography wrapper is missing');
    assert.ok(PB.includes('FORGE-1 · DO NOT UNPLUG'), 'the paper label text changed');
});

test('the party is a row of slots and the stage is rendered exactly once with a stable key', () => {
    assert.ok(PB.includes("className: 'pb-party'"), '.pb-party row missing');
    assert.ok(PB.includes("className:'pb-party-slot'"), '.pb-party-slot missing');
    assert.ok(PB.includes("className:'pb-party-portrait'"), 'circular portrait clip missing');
    const stages = PB.match(/key: 'stage', className: 'pb-stage'/g) || [];
    assert.strictEqual(stages.length, 1, 'exactly one keyed .pb-stage element');
    assert.strictEqual((PB.match(/h\(HeroViewer3D,/g) || []).length, 1, 'HeroViewer3D must be mounted once (singleton canvas)');
    assert.ok(PB.includes("'data-tab': pbTab"), 'the body grid must be keyed by the tab');
    assert.ok(/\.pb-body\[data-tab="tech"\]/.test(CSS) && /\.pb-body\[data-tab="roster"\]/.test(CSS), 'per-tab grids missing from the CSS');
});

test('the online lock flow in the foot survives verbatim', () => {
    for (const name of ['isWaitingOnline', 'opponentLockedToo', 'friendlyHostCanStart', 'doStart', 'confirmSlot']) {
        assert.ok(new RegExp('\\b' + name + '\\b').test(PB), `${name} missing`);
    }
    assert.ok(/friendlyHostCanStart\s*\?[\s\S]{0,200}START MATCH[\s\S]{0,400}isWaitingOnline\s*\?[\s\S]{0,600}SEAL YOUR FATE/.test(PB), 'the START / WAITING / SEAL ladder changed');
    assert.ok(PB.includes('MATCH STARTING…') && PB.includes('WAITING FOR HOST TO START…') && PB.includes('WAITING ON OPPONENT…'), 'a waiting label is gone');
});

test('every mechanic keeps its function name (plan rule 3.5)', () => {
    for (const fn of ['pickRace', 'toggleSpell', 'treeNodeClick', 'twinPickSpell', 'flEquipWildcard', 'handleSecJobChange', 'equipAccessory', 'setItemCount', 'confirmSlot', 'doStart', 'saveTeamAs', 'loadTeamPreset', 'tbSaveTeam', 'selectSlot', 'doRandomize', 'doRandomizeAll', 'doDefaults', 'doBack', 'handleZodiacChange', 'handleNameChange', 'resetCustomSpells', 'clearAllSpells', 'randomizeSpells']) {
        assert.ok(new RegExp('function ' + fn + '\\(|const ' + fn + ' = ').test(PB), `${fn} missing`);
    }
    assert.ok(/setPbTab\('tech'\);\s*\/\/ C-1/.test(PB), 'pickRace must flip to TECHNIQUES (decision C-1)');
});

test('the windows are panes on the glass, not browser modals', () => {
    assert.ok(/function PbWindow\(/.test(PB), 'PbWindow helper missing (must be module-level so it never remounts per render)');
    assert.ok(!/const PbWindow = /.test(PB), 'PbWindow must not be redefined inside the component');
    for (const cls of ['pb-veil', 'pb-window', 'pb-window-head', 'pb-window-body', 'pb-locker']) assert.ok(PB.includes(cls), `${cls} missing`);
    assert.ok(PB.includes("position: 'fixed', left, top, width: W"), 'the spell tooltip stays fixed-positioned (it escapes the glass on purpose)');
});

test('styles-base.css carries THE FORGE TERMINAL block', () => {
    assert.ok(CSS.includes('THE FORGE TERMINAL'), 'block header missing');
    for (const sel of ['.ms-crt-forge', '.pb-tabs', '.pb-tab.on', '.pb-party', '.pb-party-ring', '.pb-stage', '.pb-veil', '.pb-window', '.pb-locker', '.pb-roster']) {
        assert.ok(CSS.includes(sel + ' {') || CSS.includes(sel + ','), `${sel} rule missing`);
    }
    assert.ok(/#builderOverlay \{ position: relative; \}/.test(CSS), 'the CRT root is absolute — #builderOverlay must be positioned');
    assert.ok(/--pb-r: 16px; --pb-r-sm: 9px/.test(CSS), 'the rounding tokens are missing');
});

test('champ-rework (Phase 6) still finds the CODEX_LORE rows it asserts on', () => {
    assert.ok(PB.includes("'gangster': '") && PB.includes("'nun': '"), 'CODEX_LORE rows for gangster / nun must stay');
});
