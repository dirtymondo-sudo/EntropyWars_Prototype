'use strict';
/* THE PREMIUM POLISH, THE THIRD PASS (PREMIUM_POLISH_PLAN.md §9, 2026-09-21) — THE POLISH SETTINGS (the catalogue, the ONE
   read / write, the shared sheet, the live apply), 3.4 SSAO off the composer's own depth, 6.4 MOTION BLUR, 5.4 THE
   REFLECTORS. The data rules run in the vm sandbox; the renderer / post / sheet sites are source guards (RULE #1c). */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { loadGameData } = require('./load-data.js');

const TR = fs.readFileSync(path.join(__dirname, 'three-renderer.js'), 'utf8');
const TP = fs.readFileSync(path.join(__dirname, 'three-post.js'), 'utf8');
const MP = fs.readFileSync(path.join(__dirname, 'map.js'), 'utf8');
const UI = fs.readFileSync(path.join(__dirname, 'ui.js'), 'utf8');
const IX = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const W = loadGameData();

function fn(src, name) {
    const i = src.indexOf('function ' + name + '(');
    assert.ok(i >= 0, 'function ' + name);
    let depth = 0, j = src.indexOf('{', i);
    for (let k = j; k < src.length; k++) { const c = src[k]; if (c === '{') depth++; else if (c === '}') { depth--; if (!depth) return src.slice(i, k + 1); } }
    return src.slice(i);
}

test('THE CATALOGUE: every HQ_POLISH_PREFS row is well formed (a unique key, a kind, a default of that kind, a scope, its levels, its needs)', () => {
    const P = W.HQ_POLISH_PREFS;
    assert.ok(Array.isArray(P) && P.length >= 16, 'the rows');
    const keys = new Set();
    P.forEach(r => {
        assert.ok(r.key && !keys.has(r.key), 'unique ' + r.key); keys.add(r.key);
        assert.ok(['toggle', 'level', 'slider'].includes(r.kind), r.key + ' kind');
        assert.ok(r.label && r.hint, r.key + ' label + hint');
        assert.ok(['hq', 'both'].includes(r.scope), r.key + ' scope');
        if (r.kind === 'toggle') assert.equal(typeof r.def, 'boolean', r.key + ' def');
        else { assert.equal(typeof r.def, 'number', r.key + ' def'); }
        if (r.kind === 'slider') assert.ok(r.def >= 0 && r.def <= 1, r.key + ' a slider defaults inside 0..1');
        if (r.kind === 'level') { assert.ok(Array.isArray(r.levels) && r.levels.length >= 2, r.key + ' levels'); assert.ok(r.levels.some(l => l[0] === r.def), r.key + ' the default is a level'); }
        if (r.needs) assert.ok(keys.has(r.needs) || P.some(q => q.key === r.needs), r.key + ' needs a row');
    });
    ['shadows', 'ao', 'ssao', 'ssaoStrength', 'heightFog', 'shafts', 'atmos', 'wind', 'ripples', 'decals', 'reflections', 'sway', 'kicks', 'camFeel', 'motionBlur', 'autoExposure', 'arrival', 'plateFade', 'heroShadow'].forEach(k => assert.ok(keys.has(k), 'the row ' + k));
});

test('THE ONE READ / WRITE: hqPolishGet answers the default, a set value, a clamped slider; a default or null drops the key; reset clears', () => {
    const get = W.hqPolishGet, set = W.hqPolishSet, all = W.hqPolishAll;
    W.hqPolishReset();
    assert.equal(get('shadows'), true); assert.equal(get('atmos'), 1); assert.equal(get('motionBlur'), 0.55); assert.equal(get('nope'), undefined);
    assert.ok(set('shadows', false)); assert.equal(get('shadows'), false);
    assert.ok(set('shadows', 'yes')); assert.equal(get('shadows'), true, 'a toggle coerces');
    set('motionBlur', 3); assert.equal(get('motionBlur'), 1, 'a slider clamps');
    set('motionBlur', -1); assert.equal(get('motionBlur'), 0);
    set('atmos', 0.5); assert.equal(get('atmos'), 0.5);
    assert.ok(all().find(r => r.key === 'atmos').owned && !all().find(r => r.key === 'wind').owned, 'owned = a row the player set');
    set('atmos', null); assert.equal(get('atmos'), 1); assert.ok(!all().find(r => r.key === 'atmos').owned, 'null drops the key');
    set('shadows', true); assert.ok(!all().find(r => r.key === 'shadows').owned, 'the default drops the key');
    assert.equal(set('nope', 1), false, 'an unknown key is refused');
    W.hqPolishReset(); assert.equal(get('motionBlur'), 0.55);
});

test('THE RULES: data.js HQ_LIGHT_RULES carries ssao / motionBlur / reflect and the renderer\'s HQ_LIGHT_DEFAULT + merge list carry the same', () => {
    const R = W.HQ_LIGHT_RULES;
    const a = TR.indexOf('    var HQ_LIGHT_DEFAULT = {'), b = TR.indexOf('\n    /* THE POLISH SETTINGS', a);
    assert.ok(a > 0 && b > a, 'HQ_LIGHT_DEFAULT');
    const def = vm.runInContext(TR.slice(a, b) + '; HQ_LIGHT_DEFAULT', vm.createContext({}));
    ['ssao', 'motionBlur', 'reflect'].forEach(k => assert.equal(Object.keys(R[k]).sort().join(','), Object.keys(def[k]).sort().join(','), 'the keys of ' + k));
    assert.ok(/\['shadows', 'ao', 'heightFog', 'atmos', 'ssao', 'motionBlur', 'reflect'\]\.forEach/.test(TR), 'the deep merge names the three');
    assert.ok(R.ssao.radiusM > 0 && R.ssao.radiusTile > 0 && R.ssao.samples >= 4 && R.ssao.samples <= 16, 'the SSAO row');
    assert.ok(R.motionBlur.fromV < R.motionBlur.fullV && R.motionBlur.max <= 1, 'the blur row');
    assert.ok(R.reflect.scale > 0 && R.reflect.scale <= 1 && R.reflect.max >= 1, 'the reflect row');
});

test('THE READS: every catalogue key is read by a builder / a tick / the post / the page through the polish helpers, before its kill-switch', () => {
    const src = TR + TP + MP;
    W.HQ_POLISH_PREFS.forEach(r => {
        const re = new RegExp("(_polishOff|_polishLevel|_polishGet|hqPolishGet)\\('" + r.key + "'");
        assert.ok(re.test(src), 'a read of ' + r.key);
    });
    const off = fn(TR, '_polishOff'), lvl = fn(TR, '_polishLevel');
    assert.ok(off.includes('if (flag && W[flag]) return true;') && off.includes('return v === false || v === 0;'), 'the flag first, then the player\'s false / 0');
    assert.ok(lvl.includes("v === false ? 0 : 1"), 'a level defaults to 1');
    /* the helpers in a vm: the flag, the player's false, the default */
    const ctx = vm.createContext({ window: { EW_HQ_NO_WIND: true, hqPolishGet: (k) => ({ ripples: false, atmos: 0.5, shadows: true })[k] } });
    vm.runInContext(fn(TR, '_polishPref') + fn(TR, '_polishOff') + fn(TR, '_polishLevel'), ctx);
    assert.equal(vm.runInContext("_polishOff('wind', 'EW_HQ_NO_WIND')", ctx), true, 'the dev flag');
    assert.equal(vm.runInContext("_polishOff('ripples', 'EW_HQ_NO_RIPPLES')", ctx), true, 'the player\'s off');
    assert.equal(vm.runInContext("_polishOff('shadows', 'EW_HQ_NO_SHADOWS')", ctx), false, 'on');
    assert.equal(vm.runInContext("_polishOff('unknown', 'EW_NOPE')", ctx), false, 'an unknown row is on');
    assert.equal(vm.runInContext("_polishLevel('atmos')", ctx), 0.5); assert.equal(vm.runInContext("_polishLevel('unknown')", ctx), 1);
    /* the sites that were bare flags before */
    assert.ok(/_polishOff\('shadows', 'EW_HQ_NO_SHADOWS'\) \|\| W\.EW_PERF_LOW\) \{ L\.castShadow = false; return; \}/.test(TR), 'the shadow arm');
    assert.ok(/var k = _polishOff\('ao', 'EW_HQ_NO_AO'\) \? 0/.test(TR), 'the AO arm');
    assert.ok(/_polishOff\('heightFog', 'EW_HQ_NO_HEIGHT_FOG'\)/.test(fn(TR, '_hqHeightFogArm')), 'the height fog arm');
    assert.ok(/n = Math\.max\(4, Math\.round\(n \* _polishLevel\('atmos'\)\)\)/.test(fn(TR, '_hqBuildAtmos')), 'the atmosphere level multiplies the count');
    assert.ok(/g\._ew_shaft = true;/.test(fn(TR, '_hqPlaceLightShafts')), 'a shaft is tagged for the live toggle');
    assert.ok(/if \(!_polishOff\('wind', 'EW_HQ_NO_WIND'\)\) _EW_WIND\.value = /.test(fn(TR, '_hqFrame')), 'wind off = a frozen clock');
    assert.ok(/hqPolishGet\('arrival'\) === false\) ok = false;/.test(fn(MP, '_hqArrivalQueue')), 'the arrival card reads its row');
    assert.ok(/_polishGet\('autoExposure', true\) !== false/.test(fn(TP, '_aeEnabled')), 'the auto exposure reads its row');
});

test('THE LIVE APPLY: polishApply re-arms the shadows / AO / height fog / reflectors, shows or hides the shafts / decals / atmosphere, then the post; the sheet calls both', () => {
    const ap = fn(TR, '_hqPolishApply');
    ['_hqShadowArm(room)', '_hqAoArm(room)', '_hqHeightFogArm(room)', 'c._ew_shaft', 'c._ew_decal', 'H.atmos.obj.visible', '_hqBuildReflectors(room)', 't._ew_reflectOld', 'ThreePost.polishApply()'].forEach(s => assert.ok(ap.includes(s), ap.includes(s) ? '' : 'polishApply ' + s));
    assert.ok(/_hq\.roomDef = room;/.test(TR), 'the room record the apply re-arms against');
    assert.ok(/polishApply: function \(\) \{ return _hqPolishApply\(\); \}/.test(TR), 'the hq API');
    assert.ok(/function polishApply\(\) \{ _ssaoApply\(_expCtx === 'hq' \? 'hq' : 'battle'\); \}/.test(TP), 'the post API');
    assert.ok(/window\._setPolishPref = function \(key, value\) \{[\s\S]{0,400}hqPolishSet\(key, value\)[\s\S]{0,300}ThreeRenderer\.hq\.polishApply\(\)[\s\S]{0,200}ThreePost\.polishApply\(\)/.test(UI), 'the setter saves, then applies both');
});

test('THE SHEET (headless): the polish group renders one control per catalogue row, in the shared video sheet, with its kind', () => {
    const a = UI.indexOf('window._buildPolishSettingsHTML = function (RJ, inBattle) {'), b = UI.indexOf('\n        };', a);
    assert.ok(a > 0 && b > a, 'the builder');
    assert.ok(/window\._buildPolishSettingsHTML === 'function'\) \? window\._buildPolishSettingsHTML\(RJ, inBattle\) : ''/.test(UI), 'the ONE sheet (_buildVideoSettingsHTML) renders it');
    const src = UI.slice(a + 'window._buildPolishSettingsHTML = '.length, b + '\n        }'.length);
    const build = new Function('window', 'ThreePost', 'return (' + src + ');')({ hqPolishAll: W.hqPolishAll }, { getSsao: () => ({ avail: true }) });
    const html = build('R();', true);
    W.HQ_POLISH_PREFS.forEach(r => {
        assert.ok(html.includes("window._setPolishPref('" + r.key + "'"), 'a control for ' + r.key);
        assert.ok(html.includes(r.label), 'the label ' + r.label);
        if (r.kind === 'toggle') assert.ok(new RegExp("onchange=\"window\\._setPolishPref\\('" + r.key + "',this\\.checked\\)").test(html), r.key + ' is a toggle');
        if (r.kind === 'level') r.levels.forEach(l => assert.ok(html.includes("window._setPolishPref('" + r.key + "'," + l[0] + ")"), r.key + ' level ' + l[1]));
        if (r.kind === 'slider') assert.ok(new RegExp("type=\"range\"[^>]*oninput=\"window\\._setPolishPref\\('" + r.key + "',this\\.value/100\\)").test(html), r.key + ' is a slider');
        if (r.scope === 'hq') assert.ok(html.includes(r.hint + ' · exploring only'), r.key + ' says exploring only in a battle');
    });
    assert.ok(html.includes('The Polish') && html.includes('_resetPolishPrefs') && html.includes('shipped'), 'the group, the reset, the summary');
    const html2 = build('R();', false); assert.ok(!html2.includes('exploring only'), 'in the building no row says exploring only');
});

test('3.4 SSAO: the composer\'s two targets carry a DEPTH_STENCIL depth texture, the pass runs right after the RenderPass off that depth (no second scene render), both render paths hand it the camera', () => {
    const at = fn(TP, '_ssaoAttachDepth');
    assert.ok(at.includes('[_composer.renderTarget1, _composer.renderTarget2].forEach') && at.includes('d.type = THREE.UnsignedInt248Type; d.format = THREE.DepthStencilFormat;') && at.includes("renderer.extensions.get('WEBGL_depth_texture')"), 'the depth textures, the stencil kept, the extension gate');
    assert.ok(/_composer\.addPass\(renderPass\);\s*\n\s*\/\/ THE THIRD PASS 3\.4[\s\S]{0,400}_composer\.addPass\(_ssaoPass\);/.test(TP), 'the pass right after the RenderPass');
    const rd = TP.slice(TP.indexOf('_SsaoPass.prototype = Object.assign'), TP.indexOf('var _ssaoPass = null'));
    assert.ok(rd.includes('dt = readBuffer.depthTexture') && rd.includes('au.uProjInv.value.copy(cam.projectionMatrixInverse)') && rd.includes('this.fsq.material = this.aoMat; this.fsq.render(renderer);') && rd.includes('this.fsq.material = this.mixMat; this.fsq.render(renderer);'), 'the AO into its own target, the composite into the write buffer');
    assert.ok(rd.includes('mu.uAoOn.value = 0;') && TP.includes("'  if (uAoOn < 0.5) { gl_FragColor = col; return; }',"), 'no depth = the colour passes through untouched');
    assert.ok(!/renderer\.render\(_scene, this\.camera\)/.test(rd) && !rd.includes('overrideMaterial'), 'no second scene render');
    assert.ok(/uniform vec3 uKernel\[16\]/.test(TP) && /for \(int i = 0; i < 16; i\+\+\)/.test(TP) && /if \(float\(i\) >= uSamples\) break;/.test(TP), 'the hemisphere kernel');
    assert.ok(/_composer\.passes\[0\]\.camera = cam;\s*\n\s*if \(_ssaoPass\) \{ _ssaoPass\.camera = cam; _ssaoApply\('battle'\); \}/.test(TP), 'render() (the battle)');
    assert.ok(/if \(_ssaoPass\) \{ _ssaoPass\.camera = cam; _ssaoApply\('hq'\); \}/.test(fn(TP, 'renderScene')), 'renderScene() (the building)');
    assert.ok(/ThreePost\.setSsaoScale\('hq', _hqUnits\(\)\)/.test(TR) && /ThreePost\.setSsaoScale\('battle', CONFIG\.tileSize \|\| 96\)/.test(TR), 'each context sets the radius in its own units');
    assert.ok(/window\.EW_NO_SSAO \|\| window\.EW_PERF_LOW/.test(fn(TP, '_ssaoWanted')), 'the kill-switch, the phone');
    assert.ok(/if \(_ssaoPass\) \{ try \{ _ssaoPass\.dispose\(\); \} catch \(e\) \{\} _ssaoPass = null; \}/.test(TP), 'disposed with the composer');
});

test('6.4 MOTION BLUR: a zoom blur in the cinematic pass (uMotion / uMotionCenter, eight taps, every fetch through it), fed by the rider\'s speed and a fall, eased, zeroed on the way out', () => {
    assert.ok(/'uMotion':\s*\{ value: 0\.0 \}/.test(TP) && /'uMotionCenter':\s*\{ value: new THREE\.Vector2\(0\.5, 0\.5\) \}/.test(TP), 'the uniforms');
    assert.ok(TP.includes("'vec4 fetchC(vec2 p) {',") && TP.includes("'  for (int i = 0; i < 8; i++) { acc += texture2D(tDiffuse, clamp(p - d * (float(i) / 7.0), vec2(0.001), vec2(0.999))); }',"), 'eight taps toward the centre');
    assert.ok(TP.includes("'  float r = fetchC(vec2(uv.x - px, uv.y) - ab).r;',") && TP.includes("'  vec4 center = fetchC(uv);',") && TP.includes("'  float b = fetchC(vec2(uv.x + px, uv.y) + ab).b;',") && TP.includes("'    g = fetchC(uv + vec2(-ab.y, ab.x) * 0.6).g;',"), 'every colour fetch goes through it');
    assert.ok(/\|\| _gk > 0\.001 \|\| _kick > 0\.01 \|\| _mb > 0\.001\);/.test(TP) && /\|\| _lkLensChroma\(\) > 0\.01 \|\| _mb2 > 0\.001\);/.test(TP), 'the pass runs while the blur is live (both paths)');
    const mt = fn(TP, '_motionTick'); assert.ok(mt.includes('_motion.amt += (_motion.want - _motion.amt) * k'), 'eased');
    const tk = fn(TR, '_hqTickMotionBlur');
    assert.ok(tk.includes("cap = _polishLevel('motionBlur')") && tk.includes('Math.abs(R.v || 0)') && tk.includes('-(pl.velY || 0)') && tk.includes('ThreePost.setMotion(amt * Math.min(1, cap)'), 'the rider\'s speed, the fall, the slider as the cap');
    assert.ok(/_hqTickMotionBlur\(H\);/.test(fn(TR, '_hqFrame')), 'ticked every frame');
    assert.ok(/ThreePost\.setMotion\(0\); \} catch \(e\) \{\}/.test(fn(TR, '_hqLeave')), 'zeroed on the way out');
});

test('5.4 THE REFLECTORS: one plane per room (the puddles\' floor, the barbershop mirror\'s glass), the mirrored camera, the surfaces hidden and the far side clipped for the mirrored draw, the shadow pulse kept, the targets disposed on the way out and restored by the row', () => {
    const b = fn(TR, '_hqBuildReflectors');
    assert.ok(b.includes("m._ew_decal === 'puddle'") && b.includes("pr.key === 'barber_mirror'") && b.includes("mk('puddles', new THREE.Vector3(0, 1, 0)") && b.includes("mk('mirror', n, p0, [glass]") && b.includes('cap = RR.max || 1'), 'the two kinds, the cap');
    assert.ok(b.includes("new THREE.Vector3(0, 0, 1).transformDirection(mir.grp.matrixWorld)"), 'the mirror\'s normal is the prop\'s own +Z');
    const t = fn(TR, '_hqTickReflectors');
    assert.ok(t.includes('mc.position.copy(V.pos).addScaledVector(r.n, -2 * side);') && t.includes('V.up.addScaledVector(r.n, -2 * V.up.dot(r.n));') && t.includes('mc.up.copy(V.up); mc.lookAt(V.tgt);'), 'the camera reflected across the plane');
    assert.ok(t.includes('r.tm.copy(V.bias).multiply(mc.projectionMatrix).multiply(mc.matrixWorldInverse)'), 'the projective texture matrix (three\'s Reflector rule)');
    assert.ok(t.includes('t._ew_reflHide = t.visible; t.visible = false;') && t.includes('renderer.clippingPlanes = [cp];') && t.includes('renderer.shadowMap.needsUpdate = false;') && t.includes('renderer.shadowMap.needsUpdate = prevShadow;') && t.includes('renderer.clippingPlanes = prevClip; renderer.setRenderTarget(prevT);'), 'the mirrored draw\'s hygiene');
    assert.ok(t.includes('if (side < 0.02)'), 'behind the plane: no reflection');
    assert.ok(/texture2DProj\(tRefl, vRefl\)/.test(TR) && /uFogDensity \* uFogDensity \* dist \* dist/.test(TR), 'the surface: the projected read, the room\'s fog re-applied');
    assert.ok(/\(H\.reflectors \|\| \[\]\)\.forEach\(function \(r\) \{ if \(r\.rt\) r\.rt\.dispose\(\); \}\)/.test(fn(TR, '_hqLeave')), 'the targets disposed on the way out');
    assert.ok(/if \(H\.reflectors && H\.reflectors\.length\) _hqTickReflectors\(H\);/.test(fn(TR, '_hqFrame')), 'drawn before the frame');
    assert.ok(/_hqBuildReflectors\(room\); \} catch/.test(TR), 'built after the decals');
});

test('the token is fresh (RULE #1b)', () => {
    assert.ok(/\?v=\d{8}[a-z0-9-]*-cors/.test(IX) && !/polish-02-cors/.test(IX), 'a new token, the old one gone');
});
