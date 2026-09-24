'use strict';
/* THE HIT READ (SPELL_DIRECTOR_PLAN.md §5 Phase 2, 2026-09-24).
   The damage-number layer: type-coloured, punch-scaled numbers, a crit
   stamp, the weakness glyph (a resisted hit reads muted) and a kill
   afterglow. Decided on the HOST at emit, relayed as plain opts, styled by
   each end's display layer. Source pins + small vm checks — no browser. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const R = __dirname;
const BT = fs.readFileSync(path.join(R, 'battle.js'), 'utf8');
const ON = fs.readFileSync(path.join(R, 'online.js'), 'utf8');
const TR = fs.readFileSync(path.join(R, 'three-renderer.js'), 'utf8');
const HUD = fs.readFileSync(path.join(R, 'hud.js'), 'utf8');
const HTML = fs.readFileSync(path.join(R, 'index.html'), 'utf8');

function between(src, a, b) {
    const i = src.indexOf(a), j = src.indexOf(b, i + a.length);
    assert.ok(i >= 0 && j > i, a);
    return src.slice(i, j);
}
const KIT = between(BT, '/* ═══ THE HIT READ (SPELL_DIRECTOR_PLAN', "        function showFloatingTextAtTile(");
const IMPL = between(BT, '        function _realShowFloatingTextAtTile_impl(', '        function showFloatingTextForUnit(');
const APPLY = between(BT, '        function applyDamageToUnit(', '                const _popDamageFeedback = () => {');
const POP = between(BT, '                const _popDamageFeedback = () => {', '                if (_impactFreezeMs > 0) {');

/* The kit in a sandbox with the codebase's own palettes / glyphs. */
function kit(win) {
    const ctx = vm.createContext({
        window: win || {},
        ELEM_BADGE_COLORS: { fire: '#ff8a5c', ice: '#8fd8ff' },
        TYPE_TEXT_COLORS: { tech: '#4fd8ff', divine: '#f0c860' },
        ELEMENT_ICONS: { fire: '🔥', ice: '❄️' },
    });
    vm.runInContext(KIT + '\nthis.api = { _hitReadEmitOpts, _hitReadStyle, HIT_READ };', ctx);
    return ctx.api;
}

test('the host decides the read at emit: element / type, crit, weak-or-resist, kill, % of max HP', () => {
    assert.match(APPLY, /let _hrTypeEff = 1;/);
    assert.match(APPLY, /_hrTypeEff = _effMult;/, 'the PURE matchup (STAB backed out) — the same factor the ×N WEAK!/RESIST callout names');
    assert.match(POP, /const _hitOpts = _hitReadEmitOpts\(target, finalDamage, \{/);
    assert.match(POP, /type: _affEl \|\| opts\.spellType \|\| null/, 'the element wins, then the spell type (the beam palette order)');
    assert.match(POP, /crit: !!opts\.isCrit/);
    assert.match(POP, /typeEffectOverride === 'super' \? 1\.3 : _hrTypeEff/);
    assert.match(POP, /_affinity === 'weak' \? 1\.5 : _affinity === 'resist' \? 0\.5 : 1/);
    assert.match(POP, /kill: _lethalHit/);
    assert.match(POP, /showFloatingTextForUnit\(target, `-\$\{finalDamage\}`, _floatKind, \{ \.\.\._recOpts, \.\.\._hitOpts \}\);/,
        'the record opts still ride alongside');
});

test('emit opts are plain relay-safe values; the kill-switch emits nothing', () => {
    const { _hitReadEmitOpts } = kit({});
    const o = _hitReadEmitOpts({ maxHp: 200, hp: 0 }, 50, { type: 'fire', crit: true, weakMult: 1.5, kill: true });
    assert.deepEqual(JSON.parse(JSON.stringify(o)), { _hitPct: 25, _hitType: 'fire', _hitCrit: 1, _hitWeak: 1, _hitKill: 1 });
    const r = _hitReadEmitOpts({ maxHp: 100 }, 400, { weakMult: 0.65 });
    assert.equal(r._hitPct, 100, 'clamped');
    assert.equal(r._hitWeak, -1, 'a resisted hit');
    assert.equal(r._hitType, undefined, 'an untyped hit carries no type');
    assert.equal(JSON.stringify(kit({ EW_DISABLE_CRAFT: true })._hitReadEmitOpts({ maxHp: 100 }, 50, { crit: true })), '{}');
});

test('the display read: colour from the codebase palettes, a clamped swell, glyph on weak, own looks kept', () => {
    const { _hitReadStyle, HIT_READ } = kit({});
    assert.equal(_hitReadStyle('damage', {}), null, 'a pop with no hit facts is untouched');
    assert.equal(_hitReadStyle('heal', { _dmgAmt: 5 }), null);
    const small = _hitReadStyle('damage', { _hitPct: 2, _hitType: 'fire' });
    assert.equal(small.color, '#ff8a5c', 'ELEM_BADGE_COLORS');
    assert.equal(small.scale, 1);
    const big = _hitReadStyle('critdmg', { _hitPct: 90, _hitType: 'tech', _hitCrit: 1, _hitWeak: 1, _hitKill: 1 });
    assert.equal(big.color, '#4fd8ff', 'TYPE_TEXT_COLORS');
    assert.equal(big.scale, HIT_READ.maxScale);
    assert.ok(big.crit && big.kill && big.weak);
    assert.equal(big.glyph, '▲', 'a type weakness with no element glyph wears the ▲');
    assert.equal(_hitReadStyle('damage', { _hitPct: 20, _hitType: 'ice', _hitWeak: 1 }).glyph, '❄️', 'ELEMENT_ICONS');
    const mid = _hitReadStyle('damage', { _hitPct: 22.5 });
    assert.ok(mid.scale > 1 && mid.scale < HIT_READ.maxScale);
    assert.equal(mid.color, null, 'an untyped basic attack keeps the classic red');
    assert.ok(_hitReadStyle('damage', { _hitPct: 10, _hitWeak: -1 }).resist);
    const rec = _hitReadStyle('record', { _hitPct: 90, _hitType: 'fire' });
    assert.equal(rec.color, null); assert.equal(rec.scale, 1, 'the record kinds keep their own gold + size');
    assert.equal(_hitReadStyle('combo', { _hitPct: 10, _hitType: 'fire' }).color, null, 'the chain blue stays');
    assert.equal(kit({ EW_DISABLE_CRAFT: true })._hitReadStyle('damage', { _hitPct: 50, _hitType: 'fire' }), null,
        'the viewer\'s own kill-switch returns the old look (guest too)');
});

test('the tunables are live on window.EW_HIT_READ and keep a value the user set first', () => {
    const win = { EW_HIT_READ: { maxScale: 2 } };
    const { HIT_READ } = kit(win);
    assert.equal(HIT_READ, win.EW_HIT_READ);
    assert.equal(HIT_READ.maxScale, 2);
    for (const k of ['minPct', 'maxPct', 'killLinger', 'muteSat', 'muteDim']) assert.equal(typeof HIT_READ[k], 'number', k);
});

test('the display layer consumes the read on BOTH render paths, after the record check and the fog gate', () => {
    const iFog = IMPL.indexOf('Hidden-unit information leak gate'), iRec = IMPL.indexOf('_recFloatCheck(');
    const iHr = IMPL.indexOf('const _hr = _hitReadStyle(kind, opts);');
    assert.ok(iFog > 0 && iRec > iFog && iHr > iRec, 'fog gate → record juice → hit read');
    assert.match(IMPL, /\* \(_hr && _hr\.kill \? HIT_READ\.killLinger : 1\)\);/, 'the killing blow lingers');
    assert.match(IMPL, /window\.ThreeAnim\.floatingText\(x, y, String\(textValue \?\? ''\), kind, durationMs, \{ jitterX, jitterY \}\);\n\s+if \(_hr\) _hitReadDress3D\(_hr\);/);
    assert.match(IMPL, /if \(_hr\) _hitReadDressDom\(el, _hr\);/);
    for (const cls of ['.dio-float-text.hr {', '.hr-glyph', '.hr-crit', '.hr-resist', '.hr-kill', '@keyframes hrPunch'])
        assert.ok(HTML.includes(cls), 'index.html CSS: ' + cls);
});

test('the 3D dressing leans only on what three-renderer.js guarantees (the overlay id, a canvas pop, a tween that never sizes it)', () => {
    assert.match(TR, /ov\.id = 'floatTextOverlay';/);
    const sft = between(TR, '    function startFloatingText(', '    function _removeFloatTween(');
    assert.match(sft, /var el = _buildFloatTextCanvas\(text, kind\);/);
    assert.match(sft, /_floatDomOverlay\.appendChild\(el\);/, 'appended synchronously → it is the overlay\'s last child');
    const upd = between(TR, '    function _updateFloatTextTweens()', '            if (t >= 1) {');
    assert.match(upd, /translate\(-50%,-50%\) scale\(/, 'centred by percentage, so a re-sized canvas stays on its anchor');
    assert.ok(!/style\.(width|height|filter)\b/.test(upd), 'the tween never writes the size or the filter the dressing sets');
    assert.match(KIT, /document\.getElementById\('floatTextOverlay'\)/);
    assert.match(KIT, /c\.tagName !== 'CANVAS' \|\| c\._hitRead/, 'dresses a pop once, and only a canvas');
});

test('no second palette: the colours come from hud.js, the glyphs from data.js', () => {
    assert.match(HUD, /const ELEM_BADGE_COLORS = \{/);
    assert.match(HUD, /const TYPE_TEXT_COLORS = \{/);
    assert.ok(!/#[0-9a-f]{6}'\s*,\s*(ice|water|lightning):/i.test(KIT), 'no element colour table in the kit');
    assert.match(KIT, /ELEMENT_ICONS\[key\]/);
});

test('the guest gets the same read: the floating-text relay carries the facts and the mirror rebuilds them', () => {
    const wrap = between(ON, 'const _origShowFloatingTextAtTile = showFloatingTextAtTile;', '/* Key pickup celebration');
    assert.match(wrap, /hit: \(opts && opts\._hitPct != null\) \? \{/);
    for (const k of ['t: opts._hitType', 'p: opts._hitPct', 'c: opts._hitCrit', 'w: opts._hitWeak', 'k: opts._hitKill'])
        assert.ok(wrap.includes(k), 'relayed: ' + k);
    const mirror = between(ON, "if (data.type === 'floating-text' && _ewMirrorView()) {", "if (data.type === 'key-fx'");
    for (const k of ['_ftOpts._hitPct = Number(_ftHit.p)', '_ftOpts._hitType = _ftHit.t', '_ftOpts._hitCrit = 1', '_ftOpts._hitWeak = _ftHit.w', '_ftOpts._hitKill = 1'])
        assert.ok(mirror.includes(k), 'rebuilt: ' + k);
    assert.match(mirror, /window\.showFloatingTextAtTile\(data\.x, data\.y, data\.text, data\.kind, _ftOpts\);/);
    assert.ok(mirror.indexOf('_isTileVisibleToViewer') < mirror.indexOf('_ftOpts'), 'the guest fog gate still runs first');
});

test('the crit reads once: the stamp on the number replaces the attacker-side CRIT! word pop (kill-switch restores it)', () => {
    assert.match(BT, /if \(!_hitReadOn\(\)\) showFloatingTextForUnit\(unit, 'CRIT!', 'crit', \{/);
    assert.match(KIT, /function _hitReadOn\(\) \{\n\s+return !\(typeof window !== 'undefined' && window\.EW_DISABLE_CRAFT\);/);
});

test('no new state field: the read lives in opts and on the pop only', () => {
    assert.ok(!/state\._hit/.test(KIT + POP), 'nothing written to state');
});
