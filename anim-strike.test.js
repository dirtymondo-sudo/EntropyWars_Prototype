/* anim-strike.test.js — THE STRIKE FRAME (2026-09-09).
   sprites.js UAL_SLOTS names, per action slot, the source-clip second on
   which the hit / release lands (`strikeAt`) and an optional bake window
   (`trim`). The renderer starts the clip that early so the frame lands on
   the launch / impact; the forge preview fires its burst on it. This test
   pins the table to the REAL library files when rigged_animations/ is in the
   repo (clip exists, strikeAt and trim inside its duration) and source-scans
   the three consumers. Zero dependencies — node's test runner. */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const SPRITES = fs.readFileSync(path.join(__dirname, 'sprites.js'), 'utf8');
const TR = fs.readFileSync(path.join(__dirname, 'three-renderer.js'), 'utf8');
const BT = fs.readFileSync(path.join(__dirname, 'battle.js'), 'utf8');

function slotTable() {
    const m = SPRITES.match(/const UAL_SLOTS = (\{[\s\S]*?\n\});/);
    assert.ok(m, 'UAL_SLOTS literal not found in sprites.js');
    return vm.runInNewContext('(' + m[1] + ')');
}
const LIBS = ['Assets_Models_UAL1_Standard.glb', 'Assets_Models_UAL2_Standard.glb', 'Assets_Models_MAL1_Sniper.glb', 'Assets_Models_MAL2_Sniper.glb'];
const ANIM_DIR = path.join(__dirname, 'rigged_animations');

/* clip name → duration (s) from a GLB's JSON chunk + its animation samplers */
function clipDurations(file) {
    const b = fs.readFileSync(file);
    const jl = b.readUInt32LE(12);
    const j = JSON.parse(b.slice(20, 20 + jl).toString());
    const bin = b.slice(20 + jl + 8);
    const out = {};
    for (const a of (j.animations || [])) {
        let dur = 0;
        for (const ch of a.channels) {
            const acc = j.accessors[a.samplers[ch.sampler].input];
            const bv = j.bufferViews[acc.bufferView];
            const off = (bv.byteOffset || 0) + (acc.byteOffset || 0) + (acc.count - 1) * 4;
            dur = Math.max(dur, bin.readFloatLE(off));
        }
        out[a.name] = dur;
    }
    return out;
}

test('every action slot in UAL_SLOTS carries a sane strikeAt / trim', () => {
    const S = slotTable();
    const problems = [];
    for (const slot of Object.keys(S)) {
        const o = S[slot];
        const acts = /^cast|^block$/.test(slot);
        if (acts && typeof o.strikeAt !== 'number') problems.push(slot + ': action slot without strikeAt');
        if (o.strikeAt != null && !(o.strikeAt >= 0)) problems.push(slot + ': strikeAt must be ≥ 0');
        if (o.trim != null) {
            if (!Array.isArray(o.trim) || o.trim.length !== 2 || !(o.trim[0] >= 0) || !(o.trim[1] > o.trim[0]))
                problems.push(slot + ': trim must be [from, to] with to > from ≥ 0');
            else if (o.strikeAt != null && (o.strikeAt < o.trim[0] || o.strikeAt > o.trim[1]))
                problems.push(slot + ': strikeAt ' + o.strikeAt + ' outside its trim window ' + o.trim.join('–'));
        }
        if (!(o.ts > 0)) problems.push(slot + ': ts missing');
    }
    assert.deepStrictEqual(problems, []);
});

test('the strike table matches the library GLBs (skipped when rigged_animations/ is absent)', (t) => {
    if (!fs.existsSync(ANIM_DIR)) { t.skip('rigged_animations/ not in this checkout'); return; }
    const S = slotTable();
    const durs = LIBS.map((f) => clipDurations(path.join(ANIM_DIR, f)));
    const problems = [];
    for (const slot of Object.keys(S)) {
        const o = S[slot];
        const lib = durs[o.lib || 0];
        if (!lib) { problems.push(slot + ': lib ' + o.lib + ' has no file'); continue; }
        const d = lib[o.clip];
        if (d == null) { problems.push(slot + ': clip ' + o.clip + ' not in library ' + (o.lib || 0)); continue; }
        if (o.strikeAt != null && o.strikeAt > d + 0.01) problems.push(slot + ': strikeAt ' + o.strikeAt + ' past the clip end ' + d.toFixed(2));
        if (o.trim && o.trim[1] > d + 0.01) problems.push(slot + ': trim end ' + o.trim[1] + ' past the clip end ' + d.toFixed(2));
    }
    assert.deepStrictEqual(problems, []);
});

test('the renderer bakes trims and answers strike queries; battle.js and the forge preview use them', () => {
    assert.ok(/function _slotStrikeMs\(def, slot, act\)/.test(TR), '_slotStrikeMs missing');
    assert.ok(/function _unitAnimStrikeMs\(uid, chain\)/.test(TR), '_unitAnimStrikeMs missing');
    assert.ok(/src\.mixer\.setTime\(t0 \+ t\)/.test(TR), 'the bake must sample the trim window (setTime(t0 + t))');
    assert.ok(/castStrikeMs: function \(uid, kind\)/.test(TR) && /attackStrikeMs: function \(uid, kind\)/.test(TR), 'ThreeRenderer strike exports missing');
    assert.ok(/castStrikeMs: function\(unit, kind\)/.test(TR) && /attackStrikeMs: function\(unit, kind\)/.test(TR), 'ThreeAnim strike wrappers missing');
    assert.ok(/ThreeAnim\.castStrikeMs\(unit, _kind\)/.test(BT), 'battle.js _releaseCastSprite must trade hold for the strike lead');
    assert.ok(/function _attackStrikeLeadMs\(unit, tx, ty, kindOverride\)/.test(BT) && /impactDelay - _meleeLead/.test(BT), 'doAttack must start the melee clip its strike lead before impactDelay');
    assert.ok(/projectileDelay \+ lungeLeadMs - _rangedLead/.test(BT), 'doAttack must start the ranged clip its strike lead before the shot');
    assert.ok(/function _cvStrikeMs\(spell, opts\)/.test(TR) && /var burstAt = sk0 >= 0/.test(TR), 'the forge preview must fire its burst on the strike frame');
    assert.ok(/\(kind === 'dash'\)\s+\? \['castDash'/.test(TR) && /\(kind === 'tackle'\)\s+\? \['castTackle'/.test(TR), 'the dash / tackle chains are missing');
    assert.ok(/if \(spell\.kind === 'tackle'\) return 'tackle';/.test(SPRITES) && /if \(spell\.kind === 'dash'\) return 'dash';/.test(SPRITES), 'classifySpellAnimKind must route the move kinds');
    assert.ok(/_ualClipRef\(o\)/.test(SPRITES), 'every lib override path must build its slot record through _ualClipRef');
});
