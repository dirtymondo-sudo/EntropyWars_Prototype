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
const TR = read('three-renderer.js');

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

/* ── Stage 2 (2026-09-09): the circuit, the technique panel, the move preview ── */
test('the cast chain table is SHARED: the board and the viewer both read _castChainFor', () => {
    assert.ok(/function _castChainFor\(kind\)/.test(TR), '_castChainFor missing');
    assert.ok(/function _attackChainFor\(kind\)/.test(TR), '_attackChainFor missing');
    const castSites = (TR.match(/_castChainFor\(/g) || []).length;
    const atkSites = (TR.match(/_attackChainFor\(/g) || []).length;
    assert.ok(castSites >= 3, `_castChainFor must be defined AND used by the board AND the viewer (found ${castSites})`);
    assert.ok(atkSites >= 3, `_attackChainFor must be defined AND used by the board AND the viewer (found ${atkSites})`);
    assert.ok(/var _castChain = _castChainFor\(_ck\)/.test(TR), 'the board cast site must call the shared table');
    assert.ok(/var _atkChain = _attackChainFor\(_ak\)/.test(TR), 'the board attack site must call the shared table');
    assert.ok(!/\(_ck === 'support'\) \? \['castSupport'/.test(TR.replace(/function _castChainFor[\s\S]*?\n    \}\n/, '')), 'an inline cast chain table crept back in');
});

test('EWCharViewer exposes the MOVE PREVIEW API', () => {
    for (const k of ['play', 'playSpell', 'stopPreview', 'isPlaying', 'onState', 'hasClips']) {
        assert.ok(new RegExp('\\n        ' + k + ': function').test(TR), `EWCharViewer.${k} missing`);
    }
    assert.ok(/function _cvPlaySpell\(spell, opts\)[\s\S]{0,900}classifySpellAnimKind\(spell\)/.test(TR), 'playSpell must classify through sprites.js classifySpellAnimKind');
    assert.ok(/v\.clips = baked;/.test(TR), 'the viewer must keep the WHOLE baked clip map');
    assert.ok(/Math\.min\(ms, 1400\)/.test(TR), 'the preview keeps the board\'s 1.4 s cap (opts.full lifts it)');
});

test('the circuit, the technique panel and the preview triggers are in the builder', () => {
    for (const sym of ['function treeNodeState(', 'function treeStepKey(', 'function pbTechInfo(', 'function TechniquePanel(', 'const pbPreview = ', 'const techVerb = ']) {
        assert.ok(PB.includes(sym), `${sym} missing`);
    }
    assert.ok(PB.includes("className: 'pb-circuit'") && PB.includes("className: 'pb-technique'"), 'circuit / technique classes missing');
    assert.ok(/h\('path', \{ key: i, d: `M/.test(PB), 'connectors must be round-capped <path>s');
    assert.ok(PB.includes("className: 'pb-stage-pill live'"), 'the MOVE PREVIEW pill is missing');
    assert.ok(PB.includes('window.EW_NO_PB_PREVIEW') && PB.includes('st.animationsDisabled'), 'the preview kill-switches are missing');
    assert.ok(/pbPreview\(sp \|\| null, \{ hover: true \}\)/.test(PB), 'node hover must preview (debounced)');
    assert.ok(/cv\.playSpell\(sp, \{ attack: !sp/.test(PB), 'the builder must go through EWCharViewer.playSpell');
    assert.ok(!/VFX3D\.fire\(/.test(PB), 'party-builder.js must never call the relayed VFX3D.fire');
    for (const sel of ['.pb-circuit-edge', '.pb-node', '.pb-pillar-head', '.pb-technique', '.pb-verb', '.pb-stage-pill']) {
        assert.ok(CSS.includes(sel + ' {') || CSS.includes(sel + ','), `${sel} rule missing`);
    }
});

test('the party row is sized by --pb-portrait (the user asked for bigger portraits)', () => {
    const m = CSS.match(/\.pb-party \{ --pb-portrait: (\d+)px;/);
    assert.ok(m, '--pb-portrait token missing on .pb-party');
    assert.ok(+m[1] >= 88, `portraits must be at least 88px (got ${m[1]})`);
    assert.ok(/\.pb-party-ring \{ position: relative; width: var\(--pb-portrait\); height: var\(--pb-portrait\);/.test(CSS), 'the ring must read the token');
});
