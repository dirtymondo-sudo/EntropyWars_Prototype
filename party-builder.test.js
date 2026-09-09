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
    assert.ok(/\.pb-party-ring \{ position: relative; flex: none; width: var\(--pb-portrait\); height: var\(--pb-portrait\);/.test(CSS), 'the ring must read the token');
});

/* ── Stage 3 (2026-09-09): THE SPELL LIGHTS UP THE STAGE (the VFX in the viewer) ── */
const VFX = read('three-vfx.js');
const FX = read('three-vfx-effects.js');

test('ThreeVFX can lend its pools to another scene graph (attach / detach) and the board adopts them', () => {
    for (const fn of ['function attach(parent, opts)', 'function detach()', 'function _reparentAll(target)', 'function _pooledObjects()']) {
        assert.ok(VFX.includes(fn), `${fn} missing`);
    }
    assert.ok(/attach: attach, detach: detach, isAttached: isAttached/.test(VFX), 'attach / detach not exported');
    assert.ok(/if \(_initialized\) \{[\s\S]{0,500}if \(!_home && scene\)/.test(VFX), 'init(scene) must ADOPT pools born on a stage before the first match');
    assert.ok(/if \(_initialized && _attached\) return true;/.test(VFX), 'isActive must be true while staged (the effects gate reads it)');
    assert.ok(/function detach\(\) \{\s*if \(!_attached\) return;\s*clear\(\);/.test(VFX), 'detach must release every live particle (nothing survives into the next match)');
    assert.ok(/function _rainTick\(dt\) \{\s*if \(_attached\) return;/.test(VFX) && /if \(!_scene \|\| _attached\) return;/.test(VFX), 'rain / ambient clouds must never run on the stage');
});

test('VFX3D.stage overrides the board helpers and fires the INTERNAL fire (never the relayed one)', () => {
    assert.ok(/var _VS = \{ on: false/.test(FX), '_VS record missing');
    assert.ok(/stage: _vsApi,/.test(FX), 'VFX3D.stage not exported');
    const api = FX.slice(FX.indexOf('var _vsApi'), FX.indexOf('return {', FX.indexOf('var _vsApi')));
    for (const k of ['enter: function (opts)', 'exit: function ()', 'active: function ()', 'fire: function (intent, spellId, params)', 'hasMapping: hasMapping']) {
        assert.ok(api.includes(k), `stage.${k} missing`);
    }
    assert.ok(/fire: function \(intent, spellId, params\) \{[\s\S]{0,200}\bfire\(intent, spellId, params \|\| \{\}\)/.test(api), 'stage.fire must call the internal fire');
    assert.ok(!/VFX3D\.fire\(/.test(api), 'stage must never call the exported (online-wrapped) VFX3D.fire');
    assert.ok(/exit: function \(\) \{\s*if \(!_VS\.on\) return;\s*try \{ clearAll\(\); \}/.test(api), 'stage.exit must sweep the live effects before the pools go home');
    for (const g of ['function _cfg() {\n        if (_VS.on) return _VS_CFG;',
                     'function tileZ(tx, ty) {\n        if (_VS.on) return 0;',
                     'function unitSurfaceZ(tx, ty) {\n        if (_VS.on) return 0;',
                     'function _suppressed() {\n        if (_VS.on) return',
                     'function _post() {\n        if (_VS.on) return _VS.post;',
                     'function _glowR() {\n        if (_VS.on) return null;',
                     'function _sigCasterPos(tx, ty) {\n        if (_VS.on) return { x: _VS.cx || 0, y: _VS.cy || 0 };']) {
        assert.ok(FX.includes(g), `stage override missing: ${g.split('\n')[0]}`);
    }
    assert.ok(/function _sigScreenFlash\(color, ms, peak\) \{\s*if \(_VS\.on\) \{ _vsFx\('flash'/.test(FX), 'the screen flash must go to the monitor on the stage');
    assert.ok(/function _sigSpeedLinesFx\(opts\) \{\s*if \(_VS\.on\) return;/.test(FX), 'the full-viewport speed lines must not run on the stage');
    assert.strictEqual((FX.match(/window\.shakeBoard\(/g) || []).length, 1, 'every board shake must route through _shake (the one real call lives inside _shake)');
    assert.strictEqual((FX.match(/window\.ThreeLightning\b/g) || []).length, 2, 'every lightning call must route through _LT() (the two real reads live inside _LT)');
    assert.strictEqual((FX.match(/_spell3DGeometry\[/g) || []).length, 1, 'every geometry read must route through _geom3D() (the one real read lives inside _geom3D)');
    assert.ok(/!_VS\.on &&\s*!state\.devAutoSim/.test(FX) && /if \(!_canSpawn\(\) \|\| _VS\.on\) return;/.test(FX), 'the board\'s burning tiles must never render on the stage');
});

test('EWCharViewer exposes the stage API and the builder previews through it', () => {
    for (const k of ['previewSpell', 'stageEnter', 'stageExit', 'isStaged', 'onStageFx']) {
        assert.ok(new RegExp('\\n        ' + k + ': function').test(TR), `EWCharViewer.${k} missing`);
    }
    for (const fn of ['function _cvStageEnter()', 'function _cvStageExit()', 'function _cvFitStage()', 'function _cvPreviewSpell(spell, opts)', 'function _cvBuildGrid(v, tile)', 'function _cvSpellAtSelf(spell)']) {
        assert.ok(TR.includes(fn), `${fn} missing`);
    }
    assert.ok(/ThreeVFX\.attach\(v\.vfxGroup, \{ camera: v\.cam \}\)/.test(TR) && /ThreeVFX\.detach\(\)/.test(TR), 'the viewer must attach / detach the pools (with its camera — the billboards face it)');
    assert.ok(/function _vfxCam\(\)/.test(VFX) && (VFX.match(/ThreeCamera\.getCamera\(\)/g) || []).length <= 2, 'the billboard quads must read the camera through _vfxCam()');
    assert.ok(/unmount: function \(\) \{\s*if \(!_cv\) return;\s*_cvStageExit\(\);/.test(TR), 'unmount must exit the stage first (the pools go home before a match)');
    assert.ok(/if \(v\.staged && window\.ThreeVFX && ThreeVFX\.tick\)/.test(TR), '_cvFrame must tick ThreeVFX while staged');
    assert.ok(/var s = tile \/ 128;/.test(TR) && /v\.vfxGroup\.scale\.setScalar\(s\)/.test(TR), 'the stage group must be scaled tile / 128 (px-authored effects → viewer units)');
    assert.ok(/if \(!_cvStageEnter\(\)\) return _cvPlaySpell\(spell, opts\);/.test(TR), 'previewSpell must fall back to the Stage 2 animation-only preview');
    assert.ok(/S\.fire\('windup', id, wu0\)/.test(TR) && /S\.fire\('burst', id, base\)/.test(TR) && /S\.fire\('finish', id, params\(casterX\)\)/.test(TR), 'the beat must run windup → burst → finish');
    assert.ok(/cv\.previewSpell\(sp, \{ attack: !sp/.test(PB), 'the builder must go through EWCharViewer.previewSpell on click / equip');
    // 2026-09-09: the user overruled C-10 — hover carries the VFX too (the animation-only path stays as the EW_NO_PB_VFX fallback)
    assert.ok(/const stageOn = typeof cv\.previewSpell === 'function' && !window\.EW_NO_PB_VFX;/.test(PB), 'every trigger (hover included) must stage the VFX');
    assert.ok(/cv\.playSpell\(sp, \{ attack: !sp/.test(PB), 'the animation-only fallback must remain');
    assert.ok(PB.includes('window.EW_NO_PB_VFX') && TR.includes('window.EW_NO_PB_VFX'), 'the VFX kill-switch is missing');
    assert.ok(!/VFX3D\.fire\(/.test(PB), 'party-builder.js must never call the relayed VFX3D.fire');
    assert.strictEqual((PB.match(/, \{ equip: true \}\)/g) || []).length, 4, 'the four equip sites must carry { equip: true } (the DOOR click)');
    assert.ok(/cv\.onStageFx\(/.test(PB) && PB.includes("'data-grade'") && PB.includes("className: 'pb-crt-grade'") && PB.includes("className: 'pb-crt-roll'"), 'the monitor reactions are not wired');
    assert.ok(PB.includes("ref: crtRef, className: `ms-crt ms-crt-page ms-crt-forge"), 'the CRT root must carry the ref the reactions paint');
    for (const sel of ['.pb-crt-grade', '.pb-crt-roll', '.ms-crt-forge.pb-crt-jolt .ms-crt-glass', '.ms-crt-forge.pb-crt-roll-on .pb-crt-roll']) {
        assert.ok(CSS.includes(sel + ' {'), `${sel} rule missing`);
    }
    for (const t of ['human', 'alien', 'divine', 'unholy', 'tech', 'anomaly']) {
        assert.ok(CSS.includes(`.ms-crt-forge[data-grade="${t}"] {`), `grade palette missing: ${t}`);
    }
});

/* ── 2026-09-09 · the move, the frame, the circle, the wall ─────────── */
test('the party row portraits are circles: the forge overrides the legacy slot height / hover', () => {
    assert.ok(/\.ms-crt-forge \.pb-party-slot, \.pb-party \.pb-party-slot \{[^}]*height: auto;/.test(CSS), 'the forge row must reset the legacy .pb-party-slot height clamp (that is what made the rings ovals)');
    assert.ok(/\.pb-party \.pb-party-slot:hover, \.pb-party \.pb-party-slot:active \{[^}]*transform: none;[^}]*animation: none;/.test(CSS), 'the legacy hover translate / glow must be neutralised on the row');
    assert.ok(/\.pb-party-ring \{[^}]*flex: none;[^}]*aspect-ratio: 1 \/ 1;/.test(CSS), 'the ring must be flex: none with a 1:1 aspect');
});

test('the hero MOVES for charges / dashes / blinks and the camera frames the whole beat', () => {
    for (const fn of ['function _cvMoveTo(xTiles, ms, o)', 'function _cvMoveTweenStep(v, dt)', 'function _cvMovePlan(spell, opts)']) {
        assert.ok(TR.includes(fn), `${fn} missing`);
    }
    assert.ok(/if \(v\.moveTween\) _cvMoveTweenStep\(v, dt\);/.test(TR), '_cvFrame must step the move tween');
    assert.ok(/v\.stage\.position\.x = v\.heroX; v\.stage\.position\.y = v\.heroY;/.test(TR), 'the hero must stand at heroX / heroY');
    assert.ok(/v\.blob\.position\.x = v\.heroX; v\.circle\.position\.x = v\.heroX;/.test(TR), 'the shadow blob + the sigil must follow the hero');
    assert.ok(/var F = v\.frameTo;/.test(TR) && /wantDist = Math\.max\(restDist, halfW \/ Math\.max\(0\.05, tanH\), halfH \/ Math\.max\(0\.05, tanV\)\);/.test(TR), 'the camera must pull out to fit frameTo (never closer than the rest distance)');
    assert.ok(/v\.cam\.lookAt\(lx, cy \* 0\.96, 0\);/.test(TR), 'the camera must look at the framed centre');
    assert.ok(/v\.frameTo = \{ x0: -0\.6 \* tile, x1: farX \* tile, y1: tallH \};/.test(TR), 'previewSpell must set the frame from the plan');
    assert.ok(/spell\.chargeToTarget \? 'charge'/.test(TR) && /dash: 'dash', tackle: 'charge', leapStrike: 'leap', teleport: 'blink', escape: 'blink'/.test(TR), 'the move kinds must cover charge / dash / leap / blink');
    assert.ok(/plan\.tx = 3; plan\.move = \{ kind: 'run', to: 2, ms: 2 \* _CV_RUN_MS_PER_TILE \}; plan\.casterX = 2;/.test(TR), 'a charge must run to the tile beside its dummy at (3,0)');
    assert.ok(/_cvPlay\(mv\.kind === 'leap' \? \['jump', 'run', 'walk'\] : \['run', 'walk'\], \{ loop: mv\.kind !== 'leap', ms: runMs, full: true/.test(TR), 'the run must play the run / walk clip for the length of the run');
    assert.ok(/if \(opts\.loop\) act\.setLoop\(THREE\.LoopRepeat, Infinity\); else act\.setLoop\(THREE\.LoopOnce, 0\);/.test(TR), '_cvPlay must set the loop mode per play');
    assert.ok(/caster: function \(x, y\) \{ _VS\.cx = x \|\| 0; _VS\.cy = y \|\| 0; \}/.test(FX), 'VFX3D.stage.caster must move the caster anchor');
    assert.ok(/if \(S\.caster\) S\.caster\(cx \|\| 0, 0\);/.test(TR), 'the beat must tell the stage where the hero landed before the hits fire');
    assert.ok(/for \(var i = 0; i <= 6; i\+\+\) \{ var gx = x0 \+ i \* tile;/.test(TR), 'the stage grid must reach tile 4 (a charge\'s dummy stands at 3)');
    assert.ok(/if \(v\.model\) v\.model\.visible = true;\s*\/\/ a blink cut short/.test(TR), 'a cancelled beat must never leave the hero invisible');
});

test('ROSTER is the wall (Stage 4): tiles, round filters, hover → the stage, no native select on the glass', () => {
    assert.ok(PB.includes("className:'pb-rtile'"), 'the wall tiles are missing');
    for (const c of ['pb-rtile-art', 'pb-rtile-portrait', 'pb-rtile-star', 'pb-rtile-types', 'pb-rtile-name', 'pb-rtile-job', 'pb-type-disc', 'pb-faction-ring', 'pb-pill-input', 'pb-pill-btn', 'pb-menu-row']) {
        assert.ok(PB.includes(c), `${c} missing from party-builder.js`);
        assert.ok(CSS.includes('.' + c), `.${c} rule missing from styles-base.css`);
    }
    assert.ok(/const PB_TYPE_GLYPH = \{ human: 'HU', alien: 'AL', divine: 'DV', unholy: 'UH', tech: 'TK', anomaly: 'AN' \};/.test(PB), 'the six type glyphs are missing');
    assert.ok(/onMouseEnter: \(\) => rosterHoverIn\(entry\)/.test(PB) && /className: 'pb-roster', onMouseLeave: rosterHoverOut/.test(PB), 'the wall must preview on hover and restore on leave');
    assert.ok(/h\(HeroViewer3D, \{ race:stageRace, gender:stageGender, cls:stageCls, faction:stageFaction \}\)/.test(PB), 'the stage must follow the hovered vessel');
    assert.ok(/pbMenu === 'sort'/.test(PB) && /pbMenu === 'job'/.test(PB), 'the SORT / JOB menus must be glass windows');
    const rosterSrc = PB.slice(PB.indexOf('const rosterPanel = h(React.Fragment'), PB.indexOf('// TECHNIQUES: the abilities head'));
    assert.ok(!/h\('select'/.test(rosterSrc), 'no native <select> on the wall (C-9)');
    assert.ok(!PB.includes("className:'pb-vessel-card'"), 'the old codex card must be gone');
    assert.strictEqual((PB.match(/clipPath/g) || []).length, 1, 'only the door stamp may still clip a polygon');
});
