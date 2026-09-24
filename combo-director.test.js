/* combo-director.test.js — THE DUAL TECHS' DIRECTOR (SPELL_DIRECTOR_PLAN
   Phase 5, the camera half, 2026-09-24). A combo's action shot carries
   `combo:<registry key>` + the partner's id; _cineSpellById turns the id into
   a synthetic row, _cineFamilyKey sends it to SPELL_FAMILY_DIRECTORS.combo,
   and COMBO_DIRECTOR_SHOTS gives each of the 21 combos its own shots over the
   world event, then the resolve. This pins: a row per combo, every row's
   beats run (stubbed kit) and land INSIDE the shot's window on the real
   combo clock, the resolve fires, and the wiring (doComboAttack → the shot,
   online.js relays the partner both ways). Zero dependencies. */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { loadGameData } = require('./load-data.js');

const BT = fs.readFileSync(path.join(__dirname, 'battle.js'), 'utf8');
const ON = fs.readFileSync(path.join(__dirname, 'online.js'), 'utf8');
const block = (() => {
    const a = BT.indexOf('const _cineComboSpells = {};');
    const b = BT.indexOf('SPELL_FAMILY_DIRECTORS.combo = _comboDirector;', a);
    assert.ok(a > 0 && b > a, 'the combo director block not found');
    return BT.slice(a, b);
})();

function harness() {
    const S = loadGameData();
    const G = { COMBO_REGISTRY: vm.runInContext('COMBO_REGISTRY', S) };
    const calls = [];
    const kit = {};
    for (const n of ['cineSkyWatch', 'cineGodShot', 'cineGrade', 'cineFaceCam', 'cineDollyZoom', 'cineBulletCam',
        'cineReverseOts', 'cineLowTile', 'cineOrbit', 'cineSideDolly', 'cineCrane', 'cineInsert', 'cineGlamCam',
        'cineFreezeFrame']) kit[n] = (...args) => { calls.push(n); return true; };
    const units = [];
    const sb = Object.assign({
        COMBO_REGISTRY: G.COMBO_REGISTRY, SPELL_FAMILY_DIRECTORS: {},
        actionMs: (ms) => ms, camera: { _tyaw: 0 }, state: { units },
        VoidStage: { canPlay: () => true, enter: () => calls.push('void') },
        unitDisplayName: (u) => u.name, window: {}, Math, String, Object
    }, kit);
    vm.createContext(sb);
    vm.runInContext(block + '\nthis._out = { COMBO_DIRECTOR_SHOTS, _cineComboSpell, _comboDirector };', sb);
    return { sb, out: sb._out, calls, units, G };
}

function run(h, key, opts = {}) {
    const a = { id: 1, x: 2, y: 2, name: 'A' }, b = { id: 2, x: 3, y: 2, name: 'B' };
    const t = { id: 3, x: 2, y: 6, name: 'T<i>', dead: !!opts.kill };
    h.units.length = 0; h.units.push(a, b, t);
    const spell = h.out._cineComboSpell(key);
    const hits = spell.hitDamages ? spell.hitDamages.length : 1;
    // the real combo clock (doComboAttack, cut-in page): travel ~ 400
    const timings = { sourceHold: 1750, travelMs: 400, targetHold: 1150 + (hits - 1) * 420 };
    timings.totalMs = timings.sourceHold + timings.travelMs + timings.targetHold + 210;
    const impact = timings.sourceHold + timings.travelMs;
    const end = timings.totalMs;
    const beats = [];
    const c = {
        spell, caster: a, partner: b, target: t, self: false, timings, impact, end,
        cut: timings.sourceHold + 200, log: { beats: [] },
        at(ms, fn, label) {
            const at = Math.max(0, Math.round(ms));
            if (at > end - 40) { beats.push({ label: label + '@late', at }); return; }
            beats.push({ label, at }); fn();
        },
        push() {}, stockHit() { beats.push({ label: 'stockHit' }); return true; },
        vis: (u) => !!u, live: (u) => (u && !u.dead ? u : null),
        left: (ms, min) => Math.max(min != null ? min : 200, end - ms - 80), raw: (ms) => ms
    };
    h.calls.length = 0;
    h.out._comboDirector(c);
    return { beats, calls: h.calls.slice(), impact, timings };
}

test('a director row for every combo in the registry', () => {
    const h = harness();
    const names = Object.values(h.G.COMBO_REGISTRY).filter(r => ['damage', 'multiHit', 'aoe', 'lifeDrain'].includes(r.kind)).map(r => r.name);
    assert.strictEqual(names.length, 21);
    for (const n of names) assert.ok(typeof h.out.COMBO_DIRECTOR_SHOTS[n] === 'function', n + ' has no director row');
});

test('every row runs, moves the camera after the page, and every beat lands in the window', () => {
    const h = harness();
    for (const [key, reg] of Object.entries(h.G.COMBO_REGISTRY)) {
        if (!['damage', 'multiHit', 'aoe', 'lifeDrain'].includes(reg.kind)) continue;
        const r = run(h, key);
        const late = r.beats.filter(x => /@late$/.test(x.label));
        assert.deepStrictEqual(late, [], reg.name + ' drops beats past the window');
        const first = r.beats[0];
        assert.ok(first && first.at >= r.timings.sourceHold - 200, reg.name + ' cuts before the splitscreen page ends');
        assert.ok(r.beats.some(x => x.label === 'resolve'), reg.name + ' has no resolve');
        assert.ok(r.calls.some(n => /^cine(SkyWatch|GodShot|FaceCam|BulletCam|ReverseOts|LowTile|SideDolly|Crane|GlamCam)$/.test(n)),
            reg.name + ' never frames a shot');
        assert.ok(!r.beats.some(x => x.label === 'stockHit'), reg.name + ' fell back to the stock shot');
    }
});

test('the resolve: a kill gets the glam confirm; a hidden victim keeps the stock shot', () => {
    const h = harness();
    const r = run(h, 'divine|divine', { kill: true });
    assert.ok(r.calls.includes('cineGlamCam'));
    const sp = h.out._cineComboSpell('divine|divine');
    const beats = [];
    h.out._comboDirector({ spell: sp, caster: { id: 1 }, target: { id: 3 }, self: false, vis: () => false,
        timings: { sourceHold: 1750 }, impact: 2150, cut: 1950, at: (ms, fn, l) => { beats.push(l); fn(); }, stockHit: () => true });
    assert.deepStrictEqual(beats, ['stock']);
});

test('the Dark Protocol card escapes the unit name', () => {
    const h = harness();
    let text = null;
    h.sb.cineInsert = (t) => { text = t; };
    const key = Object.keys(h.G.COMBO_REGISTRY).find(k => h.G.COMBO_REGISTRY[k].name === 'Dark Protocol');
    run(h, key);
    assert.ok(text && text.includes('T&lt;I&gt;') && !text.includes('<i>'), text);
});

test('the wiring: the shot carries the combo id + partner; the relay carries the partner both ways', () => {
    assert.ok(/spellId: combo\.key \? 'combo:' \+ combo\.key : undefined,\s*comboPartnerId: partner\.id/.test(BT));
    assert.ok(/if \(typeof id === 'string' && id\.indexOf\('combo:'\) === 0\) return _cineComboSpell\(id\.slice\(6\)\);/.test(BT));
    assert.ok(/if \(spell\._comboKey\) return window\.EW_DISABLE_COMBO_DIRECTOR \? null : 'combo';/.test(BT));
    assert.ok(/partnerId: opts\.comboPartnerId,/.test(BT));
    assert.ok(/if \(opts\.comboPartnerId != null\) camEvt\.comboPartnerId = opts\.comboPartnerId;/.test(ON));
    assert.ok(/if \(camEvt\.comboPartnerId != null\) camOpts\.comboPartnerId = camEvt\.comboPartnerId;/.test(ON));
});
