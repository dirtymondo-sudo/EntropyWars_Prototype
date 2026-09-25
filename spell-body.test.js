/* spell-body.test.js — THE BODY (SPELL_DIRECTOR_PLAN Phase 4, 2026-09-24).
   sprites.js SPELL_ANIM_VERBS names the verb a spell performs; each verb is
   an anim kind whose chain (three-renderer.js _castChainFor) starts on a new
   `defer` slot in UAL_SLOTS and ends on a slot the kind used before. The
   deferred slots bake after the load bake (_libBakeDeferred). This test pins
   the table to the live spell data, the chains to the slot table, the played
   windows to the board's 1.4 s cast cap, and the §9 acceptance line (no clip
   plays more than 15 % of spells) through the census. The real clip names /
   durations are pinned by anim-strike.test.js. Zero dependencies. */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { loadGameData } = require('./load-data.js');
const { census } = require('./check-spell-presentation.js');

const SP = fs.readFileSync(path.join(__dirname, 'sprites.js'), 'utf8');
const TR = fs.readFileSync(path.join(__dirname, 'three-renderer.js'), 'utf8');

const lit = (name) => {
    const m = SP.match(new RegExp('const ' + name + ' = (\\{[\\s\\S]*?\\n\\});'));
    assert.ok(m, name + ' literal not found in sprites.js');
    return vm.runInNewContext('(' + m[1] + ')');
};
const chainFor = (() => {
    const src = TR.slice(TR.indexOf('function _castChainFor(kind)'), TR.indexOf('/* THE STRIKE FRAME (2026-09-09)'));
    return vm.runInNewContext('(' + src.replace(/^function _castChainFor/, 'function') + ')');
})();

test('every verb row names a real spell, once', () => {
    const W = loadGameData();
    const ids = new Set([...W.SPELL_LIBRARY.map(s => s.id), ...Object.values(W.RACE_ABILITIES).flat().map(s => s.id)]);
    const V = lit('SPELL_ANIM_VERBS');
    const seen = {};
    for (const verb in V) for (const id of V[verb]) {
        assert.ok(ids.has(id), verb + ': ' + id + ' is not a spell');
        assert.ok(!seen[id], id + ' is listed under ' + seen[id] + ' and ' + verb);
        seen[id] = verb;
    }
});

test('every verb has a chain; a new verb slot is deferred and falls back to an eager slot', () => {
    const V = lit('SPELL_ANIM_VERBS'), S = lit('UAL_SLOTS');
    for (const verb in V) {
        const chain = chainFor(verb);
        assert.ok(chain.length > 1, verb + ' has no chain in _castChainFor');
        assert.ok(S[chain[0]], verb + ': ' + chain[0] + ' is not in UAL_SLOTS');
        assert.strictEqual(chain[chain.length - 1], 'cast');
        if (S[chain[0]].defer) {
            const fb = chain.slice(1).filter(k => k !== 'cast');
            assert.ok(fb.length && fb.every(k => S[k]) && fb.some(k => !S[k].defer), verb + ' must fall back to an eager slot while its verb bakes');
        }
    }
    const deferred = Object.keys(S).filter(k => S[k].defer);
    assert.ok(deferred.length >= 14, 'the spell verbs defer');
    for (const k of deferred) {
        const o = S[k];
        assert.ok(/^(cast|hit)/.test(k), k + ': only one-shot cast / hit slots defer (a deferred idle / walk would pop)');
        if (/^hit/.test(k)) continue;   // a reaction has no strike frame
        assert.strictEqual(typeof o.strikeAt, 'number', k + ' needs a strike frame');
        const t0 = o.trim ? o.trim[0] : 0;
        assert.ok(o.strikeAt >= t0 && (!o.trim || o.strikeAt <= o.trim[1]), k + ': strikeAt inside the baked window');
    }
});

test('the played window of each verb fits the 1.4 s cast cap', () => {
    const S = lit('UAL_SLOTS');
    /* source durations for the untrimmed verbs (contact sheets 2026-09-24) */
    const DUR = { Idle_Shield_Break: 1.07, Melee_Hook: 0.47, NinjaJump_Land: 1.27, Sword_Block: 1.23, Chest_Open: 1.37, Pistol_Reload: 1.67, Dance_Loop: 1.0,
        /* THE NEW CLIPS (MAL3, 2026-09-25) */ Skill_01: 1.1, Skill_03: 1.667, Heavy_Hammer_Swing: 1.867, Right_Hand_Sword_Slas: 1.533 };
    /* hitLaunch is a DEATH clip: the death tween (1.6 s) owns it, not the cast cap */
    for (const k of Object.keys(S).filter(k => S[k].defer && k !== 'hitLaunch')) {
        const o = S[k];
        const dur = o.trim ? (o.trim[1] - o.trim[0]) : DUR[o.clip];
        assert.ok(dur > 0, k + ': no duration known');
        assert.ok(dur / o.ts <= 1.41, k + ' plays ' + (dur / o.ts).toFixed(2) + ' s — over the board cap, the tail is cut');
    }
});

test('the renderer defers the verbs and wires them into live rigs', () => {
    assert.ok(/if \(only \? slot !== only : \(ref && typeof ref === 'object' && ref\.defer\)\) return;/.test(TR), 'the eager bake skips `defer` slots');
    assert.ok(/function _libBakeDeferred\(entries, modelEntry, def, bakeKey\)/.test(TR));
    assert.ok(/if \(baked\) _libBakeDeferred\(entries, modelEntry, def, bakeKey\);/.test(TR), 'the deferred pass starts after the load bake settles');
    assert.ok(/_libOnDeferred\(res, function \(name, clip\)/.test(TR), 'a board rig listens for its verbs');
    assert.ok(/if \(o\.defer\) r\.defer = true;/.test(SP), '_ualClipRef carries the flag to the renderer');
});

test('the victim side: shoves and broken shields reel (hitStagger), host and guest', () => {
    const BT = fs.readFileSync(path.join(__dirname, 'battle.js'), 'utf8');
    const ON = fs.readFileSync(path.join(__dirname, 'online.js'), 'utf8');
    assert.ok((BT.match(/stagger: true \}\);/g) || []).length >= 7, 'the enemy-shove displacement sites pass stagger');
    assert.ok(/path: steps, stagger: !!\(opts && opts\.stagger\)/.test(BT) && /stagger: !!\(opts && opts\.stagger\),   \/\/ THE BODY/.test(BT), 'both displacement fns hand it to ThreeAnim.displace');
    assert.ok(/if \(opts && opts\.stagger && unit && unit\.id != null\)/.test(TR), 'startDisplaceTween plays the stagger');
    assert.strictEqual((ON.match(/stagger: \(opts && opts\.stagger\) \? 1 : 0/g) || []).length, 2, 'both displace relays carry it');
    assert.ok(/\{ delayMs: data\.delayMs \|\| 0, stagger: !!data\.stagger/.test(ON), 'the guest replays it');
    assert.ok(/_guardBroke \? 'guardBreak'/.test(BT) && /_hk === 'guardBreak'/.test(TR), 'a broken shield reels');
});

test('the router beats the text rules; the rules still hold underneath', () => {
    const a = SP.indexOf('// A capstone for the animation rule'), b = SP.indexOf('// ── SHARED ANIMATION LIBRARIES');
    const ctx = {}; vm.createContext(ctx); vm.runInContext(SP.slice(a, b), ctx);
    const cl = ctx.classifySpellAnimKind;
    assert.strictEqual(cl({ id: 'raceTailWhip', name: 'Tail Whip', type: 'damage', damageType: 'physical', range: 1 }), 'sweep');
    assert.strictEqual(cl({ id: 'raceTailWhip', name: 'Tail Whip', type: 'damage', damageType: 'physical', range: 1 }, { rulesOnly: true }), 'melee');
    assert.strictEqual(cl({ id: 'raceBullRush', chargeToTarget: true, kind: 'dash' }), 'tackle', 'a charge lands a shoulder-check');
    assert.strictEqual(cl({ id: 'notAVerb', name: 'Fireball', type: 'damage', damageType: 'magic' }), 'magic');
});

test('§9 P4: no cast clip plays more than 15 % of spells; no beast swings a sword', () => {
    const C = census();
    const n = C.spells.length, by = {};
    C.spells.forEach(s => { by[s.clip] = (by[s.clip] || 0) + 1; });
    for (const clip in by) assert.ok(by[clip] / n <= 0.15, clip + ' plays ' + by[clip] + ' / ' + n + ' spells');
    const swords = C.spells.filter(s => s.slot === 'castMelee').map(s => s.id);
    for (const id of ['raceTailWhip', 'raceJurassicJaw', 'raceWingGust', 'raceGoreCharge', 'raceSeismicLeap', 'raceBullRush']) {
        assert.ok(!swords.includes(id), id + ' still swings the sword');
    }
});
