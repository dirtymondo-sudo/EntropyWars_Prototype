/* new-clips.test.js — THE NEW CLIPS (SPELL_DIRECTOR_PLAN Phase 8, 2026-09-25).
   mondo's MAL3 batch (Assets/Models/MAL3_Sniper.glb, library index 4): 20
   cast verbs, three victim reactions, the dodge and the charge run. Some of
   the clips CARRY the body (a lunge that comes home, a leap that lands one
   tile over) — those are `travel` slots, and the board strike leap / leap
   arc / sprint steps aside for them (ThreeAnim.clipTravel). This test pins
   the wiring end to end: slot table → bake → tween → battle → relay.
   Zero dependencies. */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const SP = fs.readFileSync(path.join(__dirname, 'sprites.js'), 'utf8');
const TR = fs.readFileSync(path.join(__dirname, 'three-renderer.js'), 'utf8');
const BT = fs.readFileSync(path.join(__dirname, 'battle.js'), 'utf8');
const ON = fs.readFileSync(path.join(__dirname, 'online.js'), 'utf8');

const lit = (name) => {
    const m = SP.match(new RegExp('const ' + name + ' = (\\{[\\s\\S]*?\\n\\});'));
    assert.ok(m, name + ' literal not found in sprites.js');
    return vm.runInNewContext('(' + m[1] + ')');
};
const chainFor = (() => {
    const src = TR.slice(TR.indexOf('function _castChainFor(kind)'), TR.indexOf('/* THE STRIKE FRAME (2026-09-09)'));
    return vm.runInNewContext('(' + src.replace(/^function _castChainFor/, 'function') + ')');
})();

test('MAL3 is library 4 and the travel verbs lead with a travel slot', () => {
    assert.ok(/'https:\/\/cdn\.entropywars\.net\/Assets\/Models\/MAL3_Sniper\.glb'/.test(SP), 'EW_ANIM_LIB_URLS carries MAL3');
    const S = lit('UAL_SLOTS'), V = lit('SPELL_ANIM_VERBS');
    for (const verb of ['thrust', 'upSlash', 'leapSlash', 'leapPunch', 'flyKick']) {
        assert.ok(V[verb] && V[verb].length, verb + ' has spells');
        const first = chainFor(verb)[0];
        assert.ok(S[first] && S[first].travel && S[first].lib === 4, verb + ': ' + first + ' is a MAL3 travel slot');
    }
    const travel = Object.keys(S).filter(k => S[k].travel);
    for (const k of travel) {
        assert.ok(/^cast/.test(k) && S[k].defer, k + ': a travel slot is a deferred cast verb');
        assert.ok(!S[k].pinXZ && !S[k].pinHips, k + ': travel implies its own ground pin');
    }
    assert.ok(/if \(o\.travel\) r\.travel = true;/.test(SP), '_ualClipRef carries the flag');
    for (const k of ['hitShot', 'hitSlap', 'hitLaunch', 'runCharge', 'dodge']) assert.strictEqual(S[k].lib, 4, k + ' is MAL3');
});

test('the travel curve: a lunge comes home, a leap lands', () => {
    const a = TR.indexOf('function _libTravelCurve(times, xz, strikeT)'), b = TR.indexOf('/* THE DEFERRED BAKE (THE BODY');
    const ctx = { Float32Array }; vm.createContext(ctx); vm.runInContext(TR.slice(a, b), ctx);
    const times = [0, 0.25, 0.5, 0.75, 1];
    const lunge = ctx._libTravelCurve(times, new Float32Array([0, 0, 0, 0.6, 0, 1.3, 0, 0.6, 0, 0.05]));
    assert.ok(lunge.back, 'a lunge that returns is `back`');
    assert.ok(Math.abs(lunge.p[2] - 1) < 1e-6 && lunge.peakT === 0.5);
    const leap = ctx._libTravelCurve(times, new Float32Array([0, 0, 1, 0, 2.5, 0, 3.9, 0, 4.1, 0]));
    assert.ok(!leap.back && Math.abs(leap.p[4] - 1) < 1e-6, 'a one-way leap ends at 1');
    assert.ok(Math.abs(ctx._travelAt(leap, 0.125) - (leap.p[0] + leap.p[1]) / 2) < 1e-6, '_travelAt interpolates');
    assert.strictEqual(ctx._travelAt(leap, 9), leap.p[4]);
    const kick = ctx._libTravelCurve(times, new Float32Array([0, 0, 1, 0, 2, 0, 3, 0, 4, 0]), 0.5);
    assert.ok(Math.abs(kick.p[2] - 1) < 1e-6 && kick.p[4] === 1, 'a one-way clip reaches its stop point ON the strike frame');
    const off = ctx._libTravelCurve(times, new Float32Array([5, 5, 5, 6, 5, 7, 5, 6, 5, 5]));
    assert.ok(off.p[0] === 0 && off.back, 'measured from the first frame, not the rest pose');
});

test('the renderer bakes, wires and rides the travel clips', () => {
    assert.ok(/if \(travXZ\) baked\.userData = \{ ewTravel: _libTravelCurve\(times, travXZ, /.test(TR), 'the bake records the curve');
    assert.ok(/act\._ew_travel = _trv;/.test(TR), 'the curve survives the clip clone (r128 drops userData)');
    assert.ok(/function startClipTravelTween\(unit, toX, toY, opts\)/.test(TR) && /function castTravels\(uid, kind\)/.test(TR));
    assert.ok(/_updateClipTravelTweens\(\);/.test(TR) && /_clipTravelTweens\.clear\(\);/.test(TR), 'ticked and cleared');
    assert.ok(/_clipTravelTweens\.size > 0 \|\| \(_freeRoam && !_rtMode\)/.test(TR), 'a structural rebuild waits for the ride');
    assert.ok(/clipTravel: function\(unit, tx, ty, opts\)/.test(TR) && /castTravels: function\(unit, kind\)/.test(TR), 'ThreeAnim facades');
});

test('battle.js steps the board leap aside for a travelling clip, host and guest', () => {
    assert.ok(/function _castClipTravel\(unit, spell\)/.test(BT));
    assert.ok(/const _trv = _castClipTravel\(unit, spell\);\s+if \(_trv && _trv\.back\)/.test(BT), 'strikeLeap rides a lunge');
    assert.ok(/const _lsTrv = _castClipTravel\(unit, spell\);/.test(BT) && /if \(_lsClip\) \{/.test(BT), 'leapStrike rides a leap');
    assert.ok(/const _chTrv = _castClipTravel\(unit, spell\);/.test(BT) && /if \(_chClip\) _releaseCastSprite\(unit, _chargeDelay \+ _chTrv\.strikeMs\);/.test(BT), 'a leaping charge starts its clip on the chase cut');
    assert.ok(/\{ leap: true, charge: true \}/.test(BT), 'a plain charge sprints on RunFast');
    assert.ok(/type: 'clip-travel'/.test(ON) && /data\.type === 'clip-travel' && _ewMirrorView\(\)/.test(ON), 'relayed + replayed');
    assert.ok(/charge: \(opts && opts\.charge\) \? 1 : 0/.test(ON) && /charge: !!data\.charge/.test(ON), 'the charge run reaches the guest');
});

test('the victim side: shot / slap reactions and the launch death', () => {
    assert.ok(/_hitRange > 1 \? 'hitShot'/.test(BT) && /'hitSlap'/.test(BT), 'battle.js picks the reaction');
    assert.ok(/_hk === 'hitShot'/.test(TR) && /_hk === 'hitSlap'/.test(TR), 'the renderer plays it');
    assert.ok(/state\._deathStyleById\[target\.id\] = 'launch'/.test(BT), 'a heavy close kill launches');
    assert.ok(/style: \(typeof state !== 'undefined' && state && state\._deathStyleById/.test(TR), 'startDeathTween reads the style');
    assert.ok(/\.style === 'launch' && entry\.actions && entry\.actions\.hitLaunch\) \? 'hitLaunch' : 'death'/.test(TR));
    assert.ok(!/_deathStyleById/.test(ON), 'a plain map on state — never skipped by the sync');
});

test('a rebuilt entry keeps the library flags (the strike table survives the rig reuse)', () => {
    assert.ok(/entry\._ew_libBaked = !!_rig\.libBaked;\s+entry\._ew_def = _rig\.libDef \|\| null;/.test(TR), 'the kept-rig path restores them');
    assert.ok(/_rigRec\.libBaked = true; _rigRec\.libDef = def;/.test(TR), 'the bake records them on the rig');
});

test('startDisplaceTween declares its tile size (a vault used to throw)', () => {
    const a = TR.indexOf('function startDisplaceTween('), b = TR.indexOf('function _updateDisplaceTweens');
    const body = TR.slice(a, b);
    assert.ok(/var ts = CONFIG\.tileSize \|\| BASE_TILE;/.test(body), 'ts is declared');
    assert.ok(body.indexOf('var ts = ') < body.indexOf('ts * ELEV_STEP_RATIO'), 'before its first use');
});

test("mondo's mapping (2026-09-25): which MAL3 clip is which", () => {
    const S = lit('UAL_SLOTS'), V = lit('SPELL_ANIM_VERBS');
    assert.strictEqual(S.castSkyward.clip, 'mage_soell_cast_6', 'Summon_Skyward = cast 6');
    assert.strictEqual(S.castKinetic.clip, 'mage_soell_cast_2', 'Telekinesis_Throw = cast 2');
    assert.strictEqual(S.castDrain.clip, 'mage_soell_cast_4', 'Drain_Pull = cast 4');
    assert.strictEqual(S.castRise.clip, 'Skill_01', 'Power_Up_Flex = Skill 1');
    assert.strictEqual(S.castRoar.clip, 'Skill_01', 'Roar_Howl = Skill 1');
    assert.strictEqual(S.castMagic.clip, 'mage_soell_cast_3', 'Beam_Channel = cast 3');
    assert.strictEqual(chainFor('channel')[0], 'castMagic', 'beams lead with the beam stance');
    assert.strictEqual(chainFor('earth')[0], 'castAOE', 'Earth_Raise = Charged_Spell_Cast');
    for (const v of ['drain', 'kinetic', 'earth']) assert.ok(V[v] && V[v].length, v + ' has spells');
    assert.ok(!V.channel.includes('lifeDrain'), 'drains left the beam verb');
    assert.ok(/\(kind === 'chop'\)\s+\? \['castSmash', 'castChop'/.test(TR), 'the hammer swing chops trees');
    assert.ok(/\(_affEl === 'lightning'\) \? 'hitShot'/.test(BT), 'Electrocuted = Gunshot_Reaction');
});
