/* capstone-director.test.js — THE CAPSTONES (SPELL_DIRECTOR_PLAN Phase 6,
   2026-09-24). The 44 ultimates that had neither a signature nor a bespoke
   director each get both: a signature in three-vfx-effects.js (THE
   CAPSTONES — a charge on the relayed 'windup' beat, a hit on the 'burst',
   a detonation for the delayed three) and a director in battle.js
   (CAPSTONE_DIRECTOR_SHOTS through _capSeq). This pins: the census reads
   0 bare capstones, every id is registered on both sides, every signature
   runs clean against a stubbed scene (a typo would only warn in a live
   game), every director's beats land INSIDE the shot's window, and the
   stage hook rides _fireStage (the relayed beat — RULE #2). Zero deps. */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const FX = fs.readFileSync(path.join(__dirname, 'three-vfx-effects.js'), 'utf8');
const BT = fs.readFileSync(path.join(__dirname, 'battle.js'), 'utf8');
const IDS = ('rampart revive1 leechSeed rampage empBurst requiem voidRush raceStoneDrop raceMarrowstorm '
    + 'raceTailWhip raceMimicry raceSwarmSignal raceSasquatchSmash raceCallOfTheDeep sharedNuke raceColossalCrush '
    + 'raceIndomitableWill raceCannonball racePlandemic raceClassifiedWeapon raceFireForEffect raceExtendedClips '
    + 'raceHallelujah raceStarDecree raceGiantSmash raceDarkDominion raceDarkLullaby racePredatorDrop raceTsunami '
    + 'raceTerrorPounce raceOvertinker sharedVortexSlam raceTidalSlam raceSpaceDisco raceMitosisSplit raceQuake '
    + 'raceMissileBarrage raceUnstoppableCharge raceDragonFist racePrimalSmash raceBullRush sentaiMegazordBlast '
    + 'raceTendrilStrike raceRealityPulse').split(' ');
const DELAYED = ['sharedNuke', 'raceFireForEffect', 'raceStarDecree'];

const fxBlock = (() => {
    const a = FX.indexOf('THE CAPSTONES (SPELL_DIRECTOR_PLAN §5 Phase 6');
    const b = FX.indexOf('/* ═════════ END THE CAPSTONES ═════════ */');
    assert.ok(a > 0 && b > a, 'THE CAPSTONES section not found');
    return FX.slice(FX.lastIndexOf('/*', a), b);
})();

test('the census: no bare capstone left', () => {
    const { census, bucket } = require('./check-spell-presentation.js');
    const C = census();
    assert.deepStrictEqual(bucket(C, 'bareCapstones').map(r => r.id), []);
    // and each of the 44 is now both a signature and a bespoke director
    const by = Object.fromEntries(C.spells.map(s => [s.id, s]));
    for (const id of IDS) assert.ok(by[id] && by[id].signature && by[id].bespoke, id);
});

test('every capstone is registered on both sides, once', () => {
    for (const id of IDS) {
        assert.ok(new RegExp("^\\s+'" + id + "':\\s+function \\(tx, ty, r, p\\) \\{ _capRun\\('" + id + "'", 'm').test(fxBlock), id + ' geometry');
        const n = (BT.match(new RegExp('^\\s+CINE_SEQUENCES\\.' + id + ' = _capSeq;$', 'gm')) || []).length;
        assert.strictEqual(n, 1, id + ' director registration');
    }
    // the stage hook rides the relayed windup / burst beat
    const fs0 = FX.slice(FX.indexOf('function _fireStage(phase, spellId, params)'));
    assert.match(fs0.slice(0, 600), /_capStage\(phase, spellId, params\)/);
    // one registry write site stays the capstone pass's (capstone-vfx.test.js)
    assert.strictEqual((FX.match(/_spell3DGeometry\[/g) || []).length, 1);
});

function fxHarness() {
    const warns = [], spawns = [];
    const U = new Proxy(function () {}, {
        get: (t, k) => (k === Symbol.toPrimitive ? () => 1 : U),
        apply: () => U, construct: () => U, set: () => true
    });
    const sb = {
        console: { warn: (...a) => warns.push(a.map(String).join(' ')), log() {} },
        Math, Object, Array, Float32Array, performance: { now: () => 1000 },
        _spell3DGeometry: {}, THREE: U, ThreeRenderer: { sedan: () => U, vehicle: () => U },
        window: {}, CONFIG: { tileSize: 128 },
        _crOff: () => false, _suppressed: () => false, _canSpawn: () => true, _catOff: () => false,
        _fxDelay: (fn) => fn(), _spawn: (o) => { spawns.push(o); return U; },
        _sigRunOwned: (g, ms, tick) => { for (const el of [0, ms * 0.25, ms * 0.5, ms * 0.8, ms]) tick(el); return g; },
        _spellDefFor: () => ({ aoeRadius: 2 }), getDescentTotalMs: () => 900,
        rn: (a, b) => (a + b) / 2,
    };
    sb._geom3D = (id) => sb._spell3DGeometry[id];
    // every free identifier the section calls is a stub (the scene is fake)
    const own = new Set([...fxBlock.matchAll(/function (\w+)\s*\(/g)].map(m => m[1]));
    for (const m of fxBlock.matchAll(/\b(_\w+|tilePx|unitSurfaceZ|unitZBoost|ThreeCamera)\b/g)) {
        if (!own.has(m[1]) && !(m[1] in sb)) sb[m[1]] = U;
    }
    vm.createContext(sb);
    vm.runInContext(fxBlock.replace(/^\s*var _CAP_LIVE/m, 'var _CAP_LIVE'), sb);
    return { sb, warns, spawns };
}

test('every signature runs clean: charge, hit, and the delayed three detonate', () => {
    const { sb, warns } = fxHarness();
    const tiles = [{ x: 3, y: 4 }, { x: 4, y: 4 }, { x: 5, y: 4 }];
    for (const id of IDS) {
        assert.strictEqual(typeof sb._spell3DGeometry[id], 'function', id);
        sb._capStage('windup', id, { sx: 2, sy: 2, tx: 5, ty: 5, holdMs: 900, tiles });
        sb._capStage('burst', id, { sx: 2, sy: 2, tx: 5, ty: 5 });
        const S = vm.runInContext('_CAP_SIGS', sb)[id];
        assert.ok(S && typeof S.charge === 'function', id + ' has a charge');
        assert.ok(typeof S.hit === 'function' || DELAYED.includes(id), id + ' has a hit');
    }
    for (const id of DELAYED) {
        assert.strictEqual(typeof vm.runInContext('_CAP_SIGS', sb)[id].detonate, 'function', id + ' detonates');
        sb._spell3DGeometry[id](6, 6, 2);           // the arming / descent route
        sb._spell3DGeometry[id](6, 6, 2, {});       // the impact route, same tile: deduped
    }
    assert.deepStrictEqual(warns, []);
});

test('an automatic route never fires a non-delayed signature (no double draw)', () => {
    const { sb, spawns } = fxHarness();
    for (const id of IDS.filter(i => !DELAYED.includes(i))) sb._spell3DGeometry[id](5, 5, 2, { tx: 5, ty: 5 });
    assert.strictEqual(spawns.length, 0);
});

test('every director is a row, and its beats land inside the window', () => {
    const a = BT.indexOf('THE CAPSTONE DIRECTORS (SPELL_DIRECTOR_PLAN');
    const b = BT.indexOf('/* the bespoke entry every capstone registers', a);
    assert.ok(a > 0 && b > a, 'the capstone director block not found');
    const src = BT.slice(BT.lastIndexOf('/*', a), b);
    const calls = [];
    const kit = {};
    for (const n of ['cineSkyWatch', 'cineGodShot', 'cineFaceCam', 'cineDollyZoom', 'cineReverseOts', 'cineLowTile',
        'cineOrbit', 'cineSideDolly', 'cineCrane', 'cineGlamCam', 'cinePartyFit', 'cineWitnessCam'])
        kit[n] = () => { calls.push(n); return true; };
    const fam = {};
    const sb = Object.assign({ actionMs: (ms) => ms, Math, Object,
        SPELL_FAMILY_DIRECTORS: new Proxy({}, { get: (t, k) => (c) => { fam[k] = (fam[k] || 0) + 1; c.at(c.cut, () => calls.push('family:' + k)); } }),
        _cineFamilyKey: (s) => s._fam, _spellDirKillConfirm: () => {} }, kit);
    vm.createContext(sb);
    vm.runInContext(src + '\nthis.SHOTS = CAPSTONE_DIRECTOR_SHOTS; this.run = _capstoneDirector;', sb);
    assert.deepStrictEqual(Object.keys(sb.SHOTS).sort(), IDS.slice().sort());
    for (const id of IDS) {
        const beats = [];
        const end = 2600, cut = 1100;
        const c = {
            spell: { id, _fam: 'strike', aoeRadius: 2 }, caster: { id: 1, x: 2, y: 2 }, target: { id: 2, x: 5, y: 5 },
            timings: { sourceHold: 900, travelMs: 200, targetHold: 1000 }, cut, impact: 1100, end, row: {}, self: false,
            at: (ms, fn, label) => { beats.push([ms, label]); if (ms <= end - 40) fn(); },
            vis: () => true, live: (u) => u, push() {}, stockHit() { calls.push('stock'); return true; },
            payoff() { return true; }, allowRetargets() {}, raw: (ms) => ms, left: (ms, min) => Math.max(min || 200, end - ms - 80)
        };
        const before = calls.length;
        sb.run(c);
        assert.ok(calls.length > before, id + ' filmed nothing');
        for (const [ms, label] of beats) assert.ok(ms >= 0 && ms <= end - 40, id + ' ' + label + ' @' + ms + ' outside the window');
        // its own shot: the charge, the payoff or the settle (the sky family
        // keeps its crane over the charge — the drop is the family's)
        assert.ok(beats.some(b0 => /^cap/.test(b0[1])), id + ' has no shot of its own');
    }
});
