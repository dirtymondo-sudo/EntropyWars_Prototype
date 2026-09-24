'use strict';
/* THE SPELL DIRECTOR (SPELL_DIRECTOR_PLAN.md, Phase 1 — 2026-09-23).
   Pins:
     · EVERY playable spell resolves to a director (bespoke or family) — the
       census walks all of them; none may come back without one;
     · every family the kind table names has a director, every per-spell
       row names real shots / grades / palettes / insert kinds;
     · OWNERSHIP: the stock beat 2 is a callable that waits the claim grace
       and yields to an owned shot; cineOwnShot blocks retargets even after a
       lazy claim; a director's camera move claims the shot (the lazy claim)
       in both helpers;
     · the THREE rigs run the director (offensive · self · support) and the
       focus relay carries the resolved spell id (RULE #2);
     · THE HARNESS: every family director runs on a fake clock with the
       real block — it owns the shot (the stock cut never fires), it never
       hard-cuts twice inside 50 ms, and no beat lands past the window. */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { extractConst } = require('./load-data.js');
const { census } = require('./check-spell-presentation.js');

const BT = fs.readFileSync(path.join(__dirname, 'battle.js'), 'utf8');
const ON = fs.readFileSync(path.join(__dirname, 'online.js'), 'utf8');

test('every playable spell resolves to a director', () => {
    const C = census();
    assert.ok(C.spells.length >= 500, 'the census walked the whole game (' + C.spells.length + ')');
    const none = C.spells.filter(s => !s.director).map(s => s.id + '/' + s.kind);
    assert.deepStrictEqual(none, [], 'spells with no director: ' + none.join(', '));
});

test('every family has a director, every row is well-formed', () => {
    const FAM = extractConst(BT, 'CINE_FAMILY_BY_KIND');
    const ROWS = extractConst(BT, 'SPELL_DIRECTOR_ROWS');
    const blk = BT.slice(BT.indexOf('const SPELL_FAMILY_DIRECTORS = {'), BT.indexOf('function _spellDirFlavour(c)'));
    const dirs = new Set([...blk.matchAll(/^            ([a-zA-Z]+)\(c\) \{/gm)].map(m => m[1]));
    for (const fam of new Set(Object.values(FAM))) assert.ok(dirs.has(fam), 'family ' + fam + ' has a director');
    for (const k of ['deploy', 'summon', 'control', 'transform', 'world']) assert.ok(dirs.has(k), 'the new family ' + k);
    const grades = BT.match(/const CINE_GRADES = \[([^\]]+)\]/)[1];
    const palettes = BT.slice(BT.indexOf('const VOID_PALETTES = {'), BT.indexOf('const VOID_PALETTES = {') + 6000);
    const shots = BT.slice(BT.indexOf('const CINE_SHOTS = {'), BT.indexOf('function cinePlayShot('));
    const inserts = fs.readFileSync(path.join(__dirname, 'styles-cinematic.css'), 'utf8');
    const known = new Set(census().spells.map(x => x.id));
    for (const [id, r] of Object.entries(ROWS)) {
        assert.ok(known.has(id), 'SPELL_DIRECTOR_ROWS.' + id + ' names a real spell');
        if (r.family) assert.ok(dirs.has(r.family), id + '.family ' + r.family);
        if (r.grade) r.grade.split(/\s+/).forEach(g => assert.ok(grades.includes("'" + g + "'"), id + '.grade ' + g));
        if (r.void) assert.ok(new RegExp('\\b' + r.void + ':\\s*\\{ color').test(palettes), id + '.void ' + r.void);
        if (r.insert) assert.ok(inserts.includes('.cine-insert.k-' + r.insert[1]), id + '.insert kind ' + r.insert[1]);
        if (r.payoff && r.payoff !== 'stock') assert.ok(new RegExp('\\b' + r.payoff + ':').test(shots) || /CINE_SHOTS\.(lowTile|orbit|partyFit) =/.test(BT) && ['lowTile', 'orbit', 'partyFit'].includes(r.payoff), id + '.payoff ' + r.payoff);
        if (r.slow) assert.ok(Array.isArray(r.slow) && r.slow[0] > 0 && r.slow[0] < 1, id + '.slow');
    }
});

test('ownership: the stock beat 2 yields, cineOwnShot blocks retargets, directors claim lazily', () => {
    /* the stock beat 2 is a callable on camera._cineStockHit, waits the grace */
    assert.match(BT, /const CINE_CLAIM_GRACE_MS = 40;/);
    assert.match(BT, /camera\._cineStockHit = \{ seq: sequenceId, run: \(\) => \{ if \(_stockBeat2Ok\(\)\) _stockBeat2\(\); \} \};/);
    assert.match(BT, /if \(_cineShotOwned\(sequenceId\)\) return;   \/\/ cineOwnShot: the director composes beat 2 itself\s*_stockBeat2\(\);\s*\}, cutMs \+ CINE_CLAIM_GRACE_MS\);/);
    /* the explicit take clears a lazy claim's retarget permission */
    const own = BT.slice(BT.indexOf('function cineOwnShot(sequenceId) {'), BT.indexOf('function _cineShotOwned('));
    assert.match(own, /if \(camera\._cineRetargetOkSeq === sequenceId\) camera\._cineRetargetOkSeq = null;/);
    /* retargets: blocked on an owned shot unless the director allowed them */
    const rt = BT.slice(BT.indexOf('function _cineRetargetShot('), BT.indexOf('function _cineRetargetShot(') + 900);
    assert.match(rt, /if \(camera\._cineRetargetOkSeq !== camera\._cineShotId\) \{\s*if \(_cineShotOwned\(camera\._cineShotId\)\) return true;/);
    /* both camera helpers claim for a directing director */
    assert.match(BT, /function _cineBeatMove\(opts\) \{\s*if \(_cineDirectingSeq != null\) _cineLazyClaim\(\);/);
    assert.match(BT, /function _cineHardCut\(opts\) \{\s*if \(_cineDirectingSeq != null\) _cineLazyClaim\(\);/);
    /* a director beat runs in the directing context */
    assert.match(BT, /if \(window\.EW_DISABLE_SPELL_DIRECTOR\) fn\(\);\s*else _cineDirecting\(sequenceId, fn\);/);
});

test('the three rigs run the director and the focus relay carries the id', () => {
    const self = BT.slice(BT.indexOf('function _playSelfCastHeroShot('), BT.indexOf('let _focusCamSpellCtx = null;'));
    assert.match(self, /_cinePlaySpellSequence\(opts\.spellId, \{[\s\S]{0,120}rig: 'self'/, 'the self rig');
    assert.match(self, /if \(_cineShotOwned\(sequenceId\)\) return;   \/\/ the director composes the rest/, 'its push-in yields');
    const sup = BT.slice(BT.indexOf('function _playSupportCineShot('), BT.indexOf('function _spellFocusCamera('));
    assert.match(sup, /_cinePlaySpellSequence\(opts\.spellId, \{[\s\S]{0,120}rig: 'support'/, 'the support rig');
    assert.match(sup, /if \(_cineShotOwned\(sequenceId\)\) return;   \/\/ the director composes beat 2 itself/, 'its beat 2 yields');
    assert.match(BT, /if \(_cineClaimCast\(_cineSpellIdForShot\)\) _cinePlaySpellSequence\(_cineSpellIdForShot, \{/, 'the offensive rig');
    const fc = BT.slice(BT.indexOf('function _spellFocusCamera('), BT.indexOf('function _spellFocusCamera(') + 4000);
    assert.match(fc, /return \{ mode: 'pan', spellId: opts\.spellId \|\| null, spellName: opts\.spellName \|\| null \};/);
    assert.match(BT, /spellId: opts\.spellId \|\| null, spellName: opts\.spellName \|\| null \};/);
    assert.match(ON, /spellId: \(opts && opts\.spellId\) \|\| \(result && result\.spellId\) \|\| null/, 'online.js relays the resolved id');
});

/* ─── THE HARNESS — the real block on a fake clock ─── */
function harness() {
    const own = BT.slice(BT.indexOf('        function cineOwnShot(sequenceId) {'), BT.indexOf('        function _cineRetargetShot('));
    const blk = BT.slice(BT.indexOf('        const SPELL_DIRECTOR_ROWS = {'), BT.indexOf('        window.SpellDirector = SpellDirector;'));
    const H = { trace: [], now: 0, timers: [] };
    const sb = {
        H, console, Math, Object, Array, Set, Map, JSON, Number, String, Boolean,
        window: {}, performance: { now: () => H.now },
        setTimeout: (fn, ms) => { H.timers.push({ at: H.now + Math.max(0, ms || 0), fn }); return H.timers.length; },
        actionMs: (ms) => ms,
        CONFIG: { tileSize: 128 }, BASE_TILE: 128,
        state: { phase: 'battle', cinematicActionCam: true, units: [] },
        camera: { _cineShotId: 1, _tz: 1, _tt: 80, _tyaw: 0, _tElev: -1, yaw: 0 },
        VoidStage: { canPlay: () => true, enter: () => H.trace.push({ t: H.now, k: 'fx', n: 'void' }) },
        SPELL_BY_ID: {}, RACE_ABILITY_BY_ID: {}, CINE_SEQUENCES: {}, CINE_SHOTS: {}
    };
    sb.window.setTimeout = sb.setTimeout;
    vm.createContext(sb);
    vm.runInContext(`
        const T = (k, n, o) => H.trace.push({ t: H.now, k, n, o: o || null });
        function _cineBeatOk(seq) { return camera._cineShotId === seq; }
        function _cineCutMs(t) { return t.sourceHold + Math.min(300, Math.round(t.travelMs * 0.5)); }
        function _spellStageInfo() { return { weight: H.weight || 'standard', archetype: 'arcane' }; }
        function _cineActorVisible(u) { return !!u; }
        function _cineTpsAnchor() { return true; }
        function _tpsZoomForBoomTiles(d) { return 3 / d; }
        function _camGroundPx() { return 0; }
        function _unitElevZ() { return 0; }
        function getUnitFacing() { return { dx: 0, dy: 1 }; }
        function isAllyUnit(a, b) { return a.player === b.player; }
        function _acChromeFlash() {}
        function _cineHardCut(o) { if (_cineDirectingSeq != null) _cineLazyClaim(); T('cut', 'hardCut'); }
        function _cineBeatMove(o) { if (_cineDirectingSeq != null) _cineLazyClaim(); T('glide', 'beatMove'); }
        const shot = (n, kind) => function (...a) { const o = a.find(x => x && typeof x === 'object' && ('cut' in x)) || {}; if (_cineDirectingSeq != null) _cineLazyClaim(); T(o.cut === false ? 'glide' : kind, n); return true; };
        const cineGodShot = shot('godShot', 'cut'), cineWitnessCam = shot('witness', 'cut'), cineFaceCam = shot('faceCam', 'cut'),
              cineGlamCam = shot('glam', 'cut'), cineSideDolly = shot('sideDolly', 'cut'), cineReverseOts = shot('reverseOts', 'cut'),
              cineEndCapReverse = shot('endCap', 'cut'), cineSkyWatch = shot('skyWatch', 'cut'), cineCrane = shot('crane', 'glide');
        function cinePlayShot(name) { T('cut', 'play:' + name); return true; }
        function cineGrade(k) { T('fx', 'grade:' + k); } function cineInsert(t) { T('fx', 'insert'); }
        function cineSlowMo() { T('fx', 'slow'); } function cineFreezeFrame() { T('fx', 'freeze'); }
        function cineDollyZoom() { T('fx', 'dolly'); } function cineUnitFade() { T('fx', 'fade'); }
        function _cineApplyFamilyLegacy() { T('legacy', 'legacy'); return true; }
        function _cineSpellById(id) { return null; }
    ` + own + blk + '\nH.api = { SPELL_FAMILY_DIRECTORS, CINE_FAMILY_BY_KIND, _cineApplyFamily, _cineAt, _cineShotOwned, cineOwnShot, get directing() { return _cineDirectingSeq; } };', sb);
    H.pump = (untilMs) => {
        for (let guard = 0; guard < 10000; guard++) {
            const due = H.timers.filter(x => x.at <= untilMs).sort((a, b) => a.at - b.at)[0];
            if (!due) break;
            H.timers.splice(H.timers.indexOf(due), 1);
            H.now = due.at;
            try { due.fn(); } catch (e) { H.trace.push({ t: H.now, k: 'THREW', n: String(e && e.message) }); }
        }
        H.now = untilMs;
    };
    return { H, sb };
}

test('THE HARNESS: every family director owns the shot, cuts once per beat, stays in the window', () => {
    const KINDS = { strike: 'damage', groundAoe: 'aoe', selfNova: 'barrage', beam: 'line', drain: 'lifeDrain',
        dash: 'dash', leap: 'leapStrike', sky: 'skyDrop', blink: 'teleport', terrain: 'terrainCreate',
        zone: 'zoneDebuff', delayed: 'delayed', support: 'heal', buff: 'buff', partyCry: 'warCry',
        debuff: 'debuff', displace: 'pull', multiHit: 'multiHit', weather: 'summonWeather', recon: 'scan',
        deploy: 'deployObject', summon: 'summonUnit', control: 'possess', transform: 'transform', world: 'trickRoom' };
    const { H, sb } = harness();
    const fams = Object.keys(H.api.SPELL_FAMILY_DIRECTORS);
    assert.ok(fams.length >= 25, 'families: ' + fams.length);
    let seq = 100;
    for (const weight of ['standard', 'ultimate']) for (const fam of fams) {
        const s = ++seq;
        H.weight = weight;
        H.trace.length = 0; H.timers.length = 0; H.now = 0;
        sb.camera._cineShotId = s;
        const caster = { id: 'a', x: 2, y: 2, player: 1 }, target = { id: 'b', x: 6, y: 3, player: 2 };
        sb.state.units = [caster, target];
        const timings = { sourceHold: 1250, travelMs: 400, targetHold: 1000, resetBuffer: 210, totalMs: 2860 };
        const cut = 1250 + 200;
        /* the rig's stock beat 2, exactly as the rig schedules it */
        sb.camera._cineStockHit = { seq: s, run: () => H.trace.push({ t: H.now, k: 'cut', n: 'stockHit' }) };
        sb.setTimeout(() => { if (!H.api._cineShotOwned(s)) H.trace.push({ t: H.now, k: 'cut', n: 'STOCK-AUTO' }); }, cut + 40);
        const spell = { id: 'test_' + fam, kind: KINDS[fam] || 'damage', aoeRadius: 2 };
        const ok = H.api._cineApplyFamily(fam, { caster, target, sequenceId: s, timings, shotOpts: {}, spell });
        assert.ok(ok, fam + ' ran');
        assert.ok(H.api._cineShotOwned(s), fam + ' owns the shot at t = 0');
        H.pump(6000);
        const tr = H.trace.slice();
        assert.ok(!tr.some(x => x.k === 'THREW'), fam + ' threw: ' + JSON.stringify(tr.filter(x => x.k === 'THREW')));
        assert.ok(!tr.some(x => x.n === 'STOCK-AUTO'), fam + ': the stock cut fired under an owned shot');
        assert.ok(tr.some(x => x.k === 'cut' || x.k === 'glide'), fam + ' moved the camera');
        const cuts = tr.filter(x => x.k === 'cut').map(x => x.t).sort((a, b) => a - b);
        for (let i = 1; i < cuts.length; i++) {
            assert.ok(cuts[i] - cuts[i - 1] >= 50, fam + ' (' + weight + '): two hard cuts within 50 ms at ' + cuts[i - 1] + '/' + cuts[i] + ' ' + JSON.stringify(tr));
        }
        const late = tr.filter(x => x.t > timings.totalMs - 40 && x.k !== 'fx');
        assert.deepStrictEqual(late, [], fam + ': a camera beat past the window');
    }
});

test('THE HARNESS: the lazy claim — a bespoke director\'s first move claims, a plain move never does', () => {
    const { H, sb } = harness();
    sb.camera._cineShotId = 7;
    /* a move outside any director: no claim (the stock rig's own beats) */
    vm.runInContext('_cineHardCut({})', sb);
    assert.ok(!H.api._cineShotOwned(7), 'the stock rig never claims its own shot');
    /* a director beat: its move claims, retargets stay allowed */
    H.api._cineAt(300, 7, () => vm.runInContext('_cineBeatMove({})', sb));
    H.pump(400);
    assert.ok(H.api._cineShotOwned(7), 'the director claimed');
    assert.strictEqual(sb.camera._cineRetargetOkSeq, 7, 'a lazy claim keeps retargets');
    /* the explicit take blocks retargets again */
    H.api.cineOwnShot(7);
    assert.strictEqual(sb.camera._cineRetargetOkSeq, null, 'cineOwnShot blocks retargets');
    /* a beat of a DEAD shot never runs */
    let ran = false;
    H.api._cineAt(10, 7, () => { ran = true; });
    sb.camera._cineShotId = 8;
    H.pump(500);
    assert.ok(!ran, 'a beat of a finished shot is dropped');
    assert.strictEqual(H.api.directing, null, 'the directing context unwinds');
});

test('the kill-switch restores the old layering', () => {
    assert.match(BT, /if \(window\.EW_DISABLE_SPELL_DIRECTOR\) return _cineApplyFamilyLegacy\(key, ctx\);/);
    assert.match(BT, /function _cineApplyFamilyLegacy\(key, ctx\) \{/);
    assert.match(BT, /taken = \(legacy \? seq\(ctx\) : _cineDirecting\(ctx\.sequenceId, \(\) => seq\(ctx\)\)\) !== false;/);
    assert.match(BT, /if \(!window\.EW_DISABLE_SPELL_DIRECTOR && opts\.spellId && _cineClaimCast\(opts\.spellId\)\)/);
});
