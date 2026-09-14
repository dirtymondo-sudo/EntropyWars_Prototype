/* capstone-vfx.test.js — THE CAPSTONE PASS (2026-09-13).
   Every pillar's r4★ spell must look like the ultimate of its branch:
     · data.js isCapstoneSpellId names the set (ring 3 of buildTreeRingIndex);
     · sprites.js classifySpellAnimKind sends a capstone to the 'ultimate'
       charged cast (UAL_SLOTS castUltimate = MAL Charged_Spell_Cast, slow)
       and the other big magical events to castAOE — the charged cast used
       to play only for hordes and terrain-raising;
     · three-renderer.js _castChainFor knows 'ultimate';
     · three-vfx-effects.js stages every capstone as an 'ultimate', blooms
       it, and no capstone shares an effect recipe with a sibling on its own
       pillar any more (Tsunami was a byte-copy of Water Pulse …).
   Zero dependencies — node's test runner + load-data.js. */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { loadGameData } = require('./load-data.js');

const FX = fs.readFileSync(path.join(__dirname, 'three-vfx-effects.js'), 'utf8');
const SP = fs.readFileSync(path.join(__dirname, 'sprites.js'), 'utf8');
const TR = fs.readFileSync(path.join(__dirname, 'three-renderer.js'), 'utf8');
const BT = fs.readFileSync(path.join(__dirname, 'battle.js'), 'utf8');

const g = loadGameData();

/* The runtime SPELL_MAP: the hydrated table + every later
   `SPELL_MAP['id'] = …` statement, evaluated in order like the file does. */
function runtimeSpellMap() {
    const EFX = JSON.parse(FX.match(/var _EFX_DATA = (\{.*\});\s*$/m)[1]);
    const S = Object.assign({}, EFX.S);
    const ctx = { SPELL_MAP: S, Object };
    const re = /SPELL_MAP\['([^']+)'\]\s*=\s*([\s\S]*?);\s*(?:\/\*[^\n]*)?\n/g;
    let m;
    while ((m = re.exec(FX))) {
        try { S[m[1]] = vm.runInNewContext('(' + m[2] + ')', ctx); } catch (e) { /* a multi-line form the regex cannot see */ }
    }
    /* the field form: SPELL_MAP['id'].bolt = '_bolt_rock' (the Cannonball) */
    const re2 = /SPELL_MAP\['([^']+)'\]\.([a-zA-Z]+)\s*=\s*'([^']+)';/g;
    while ((m = re2.exec(FX))) { S[m[1]] = Object.assign({}, S[m[1]], { [m[2]]: m[3] }); }
    return S;
}
function geometryKeys() {
    const i = FX.indexOf('var _spell3DGeometry = {');
    const j = FX.indexOf('\n    };', i);
    const keys = new Set();
    for (const line of FX.slice(i, j).split('\n')) {
        const mm = line.match(/^        (['"]?)([A-Za-z0-9_:]+)\1:\s/);
        if (mm) keys.add(mm[2]);
    }
    const late = FX.slice(FX.indexOf('THE CAPSTONE PASS (2026-09-13)'));
    const re = /^\s+'([A-Za-z0-9_:]+)':\s+function/mg;
    let m; while ((m = re.exec(late))) keys.add(m[1]);
    return keys;
}
function cineKeys() {
    const out = new Set();
    const re = /^\s{12}([A-Za-z0-9_]+)\(ctx\) \{/mg;
    let m; while ((m = re.exec(BT))) out.add(m[1]);
    return out;
}
function classify() {
    const a = SP.indexOf('// A capstone for the animation rule');
    const b = SP.indexOf('// ── SHARED ANIMATION LIBRARIES');
    const ctx = { isCapstoneSpellId: g.isCapstoneSpellId };
    vm.createContext(ctx);
    vm.runInContext(SP.slice(a, b), ctx);
    return ctx.classifySpellAnimKind;
}
function slotTable() {
    const m = SP.match(/const UAL_SLOTS = (\{[\s\S]*?\n\});/);
    return vm.runInNewContext('(' + m[1] + ')');
}

test('data.js names the capstones: ring 3 of every pillar, cached, cleared on a re-price', () => {
    assert.strictEqual(typeof g.isCapstoneSpellId, 'function');
    assert.strictEqual(typeof g.capstoneSpellIds, 'function');
    const caps = g.capstoneSpellIds();
    for (const tree of Object.values(g.RACE_TREE)) {
        const last = tree[tree.length - 1];
        for (const id of (Array.isArray(last) ? last : [last])) assert.ok(caps.has(id), id + ' should be a capstone');
    }
    for (const tree of Object.values(g.CLASS_TREE)) assert.ok(caps.has(tree[tree.length - 1]));
    assert.ok(caps.has('reallyGoodPunch'), 'the homosapien twin capstone (the old Freelancer capstone)');
    assert.ok(!caps.has('raceRiptide'), 'a ring-1 spell is not a capstone');
    assert.ok(caps.has('sharedNuke'), 'Nuke sits on no lower ring');
    assert.ok(/_capstoneIdSet = null;\s*\/\/ a re-positioned tree/.test(fs.readFileSync(path.join(__dirname, 'data.js'), 'utf8')));
});

test('the charged cast: castUltimate slot, the chain, and the classify rules', () => {
    const S = slotTable();
    assert.strictEqual(S.castUltimate.clip, 'Charged_Spell_Cast');
    assert.strictEqual(S.castAOE.clip, 'Charged_Spell_Cast');
    assert.ok(S.castUltimate.ts < S.castAOE.ts, 'the capstone cut is the slow one');
    assert.strictEqual(S.castUltimate.strikeAt, 1.90);
    assert.ok(/\(kind === 'ultimate'\) \? \['castUltimate', 'castAOE', 'castMagic', 'cast'\]/.test(TR), '_castChainFor must know the ultimate chain');
    assert.ok(/function _isCapstoneSpellForAnim\(spell\)/.test(SP));
    const cl = classify();
    const by = g.SPELL_BY_ID;
    assert.strictEqual(cl(by.raceTsunami), 'ultimate');
    assert.strictEqual(cl(by.raceSupernova), 'ultimate');
    assert.strictEqual(cl(by.raceHallelujah), 'ultimate', 'a team heal capstone charges');
    assert.strictEqual(cl(by.raceShamblingHorde), 'ultimate', 'the horde rule promotes a capstone');
    assert.strictEqual(cl(by.raceMarrowstorm), 'ultimate', 'Marrowstorm is not an arrow');
    assert.strictEqual(cl(by.raceHighNoon), 'ranged', 'a gun capstone keeps the draw');
    assert.strictEqual(cl(by.raceColossalCrush), 'melee', 'an adjacent physical capstone keeps the swing');
    assert.strictEqual(cl(by.raceTendrilStrike), 'melee', 'a physical single-target reach keeps the swing');
    assert.strictEqual(cl(by.revive1), 'heal', 'a revive keeps the staff wave');
    assert.strictEqual(cl(by.raceQuake), 'slam', 'a quake slams');
    /* the big non-capstone events charge the normal cut */
    assert.strictEqual(cl(by.raceRiptide), 'aoe', 'an aoePull charges');
    assert.strictEqual(cl(by.sharedTidalSurge), 'magic', 'a one-lane wave is a bolt push');
    assert.strictEqual(cl(by.racePlasmaCannon), 'aoe', 'a wide beam charges');
    assert.strictEqual(cl(by.healAll), 'aoe', 'the party heal charges');
    assert.strictEqual(cl(by.fire1), 'magic', 'a single bolt does not');
    assert.strictEqual(cl(by.raceFanTheHammer), 'ranged', 'a gun aoe does not');
});

test('every capstone stages as an ultimate and blooms; the VFX hooks are wired', () => {
    assert.ok(/function _isCapstoneSpell\(spellId, def\)/.test(FX));
    assert.ok(/if \(_isCapstoneSpell\(spellId, def\)\) return 'ultimate';/.test(FX), '_stageWeight must promote a capstone');
    assert.ok(/if \(_isCapstoneSpell\(spellId, _bDef\)\) \{\s*try \{ _sigCapstoneBloom3D\(tx, ty, P\); \}/.test(FX), '_stageBurst must bloom a capstone');
    assert.ok(/if \(beamDef\.beamTsunami\) \{\s*try \{ _sigTsunami3D\(fromX, fromY, hitTiles, beamDef, spellId\); \}/.test(FX), 'the beam dispatcher must route beamTsunami');
    assert.ok(/if \(intent === 'aoe' && effectDef\.geom3D && _geom3D\(spellId\)\)/.test(FX), 'the aoe intent must run a geom3D signature');
    assert.ok(/var BS = def\.breathScale > 0 \? def\.breathScale : 1;/.test(FX) && /if \(def\.firestorm\) \{/.test(FX) && /if \(def\.inhale && _canSpawn\(\)\)/.test(FX), 'the breath rig must read breathScale / firestorm / inhale');
    for (const fn of ['_sigTsunami3D', '_sigFirestorm3D', '_sigFaeRing3D', '_sigCataclysmDecree3D', '_sigCataclysmMark3D', '_sigDrainingEmbrace3D', '_sigCrusade3D', '_sigCapstoneBloom3D']) {
        assert.ok(FX.includes('function ' + fn + '('), fn + ' missing');
    }
    assert.strictEqual((FX.match(/_spell3DGeometry\[/g) || []).length, 1, 'the registry is written through Object.assign, read through _geom3D');
    const geom = geometryKeys();
    for (const k of ['raceFaeRing', 'raceCataclysmDecree', 'raceCataclysmDecree:mark', 'raceDrainingEmbrace', 'raceCrusade']) assert.ok(geom.has(k), k + ' not registered');
    /* RULE #2: the registry's public door rides the sibling relay so the
       guest sees the crown mark / the dash signatures too */
    const ON = fs.readFileSync(path.join(__dirname, 'online.js'), 'utf8');
    assert.ok(/fireGeometry:\s+\[\[1, 2\]\],/.test(ON), 'online.js must relay fireGeometry (fog anchors = tx, ty)');
});

test('no capstone shares an effect recipe with a sibling on its own pillar', () => {
    const S = runtimeSpellMap();
    const problems = [];
    const trees = Object.assign({}, g.RACE_TREE);
    for (const [job, t] of Object.entries(g.CLASS_TREE)) trees['JOB:' + job] = t;
    for (const [race, tree] of Object.entries(trees)) {
        const ids = (e) => (Array.isArray(e) ? e : [e]);
        const caps = ids(tree[tree.length - 1]);
        const sibs = tree.slice(0, -1).flatMap(ids);
        for (const c of caps) {
            const eff = Object.values(S[c] || {});
            for (const s of sibs) {
                const shared = eff.filter(e => Object.values(S[s] || {}).includes(e));
                if (shared.length) problems.push(`${race}: ${c} shares ${shared.join(',')} with ${s}`);
            }
        }
    }
    assert.deepStrictEqual(problems, []);
});

test('the named duplicates diverged and every capstone has an identity', () => {
    const S = runtimeSpellMap();
    assert.strictEqual(JSON.stringify(S.raceTsunami), JSON.stringify({ beam: 'raceTsunami_beam', impact: 'raceTsunami_impact_tile' }));
    assert.notStrictEqual(JSON.stringify(S.raceTsunami), JSON.stringify(S.sharedTidalSurge));
    assert.ok(/EFFECTS\['raceTsunami_beam'\] = \{\s*beamTsunami: true/.test(FX));
    assert.strictEqual(S.raceDragonBreath.beam, 'raceDragonBreath_beam');
    assert.strictEqual(S.raceDragonfire.beam, 'raceDragonfire_beam');
    assert.ok(/EFFECTS\['raceDragonfire_beam'\] = \{[^}]*breathScale: 1\.7, inhale: true, firestorm: true/.test(FX), 'Dragonfire is the inferno');
    assert.ok(/EFFECTS\['raceDragonBreath_beam'\] = \{[^}]*breathTheme: 'fire', chargeMs: 150/.test(FX), 'Dragon Breath keeps the plain gout');
    assert.strictEqual(S.raceGlitterBomb.aoe, 'raceGlitterBomb_aoe');
    assert.strictEqual(S.raceFaeRing.aoe, 'raceFaeRing_aoe');
    assert.ok(/EFFECTS\['raceFaeRing_aoe'\]\.geom3D = true;/.test(FX));
    assert.strictEqual(S.raceSnowballVolley.aoe, 'raceSnowballVolley_aoe');
    assert.strictEqual(S.raceBlizzardPresent.aoe, 'raceBlizzardPresent_aoe_v2');
    assert.strictEqual(S.raceArtilleryStrike.impact, 'raceArtilleryStrike_impact_tile');
    assert.strictEqual(S.sharedNuke.impact, 'nuke_impact_tile');
    assert.strictEqual(S.raceCataclysmDecree.impact, 'raceCataclysmDecree_impact_tile');
    assert.strictEqual(S.raceCataclysmDecree.descent, 'raceCataclysmDecree_descent', 'the descent pipeline fires the crown');
    assert.strictEqual(S.raceDrainingEmbrace.drainHop, 'raceDrainingEmbrace_drainHop');
    assert.strictEqual(S.raceSoulSuck.drainHop, 'lifeDrain_drainHop');
    assert.strictEqual(S.raceTerrorPounce.impact, 'raceTerrorPounce_impact');
    assert.strictEqual(S.raceHallelujah.aura, 'raceHallelujah_aura');
    /* identity: a SPELL_MAP row, a geometry, a cinematic sequence, or a
       kind whose travel IS the signature (dash / sky / possess / blink) */
    const geom = geometryKeys(), cine = cineKeys();
    const kindOwned = /^(dash|skyDrop|skyThrow|skySlam|teleport|escape|possess|transform|shadowRealm|tackle)$/;
    const bare = [];
    for (const id of g.capstoneSpellIds()) {
        const s = g.SPELL_BY_ID[id];
        if (!s) continue;
        const has = (S[id] && Object.keys(S[id]).length) || geom.has(id) || geom.has(id + ':dash') || cine.has(id) || kindOwned.test(s.kind);
        if (!has) bare.push(id);
    }
    assert.deepStrictEqual(bare, [], 'capstones on the theme fallback only');
});
