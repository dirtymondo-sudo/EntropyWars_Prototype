/* finishers.test.js — THE FINISHER PASS + THE SPELL-MADE MONUMENTS + THE ROCKS
   (2026-09-18). Source guards on the five runtime files + the data rows,
   read through load-data.js. Zero dependencies (node:test). */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { loadGameData } = require('./load-data.js');

const src = f => fs.readFileSync(path.join(__dirname, f), 'utf8');
const DATA = src('data.js'), MAP = src('map.js'), BT = src('battle.js'), TR = src('three-renderer.js'), VFX = src('three-vfx-effects.js');
const g = loadGameData();
const by = g.SPELL_BY_ID;
const MON_KINDS = ['menhir', 'castle_wall', 'gothic_wall', 'ziggurat_block'];

function gridOf(text, kind) { const m = text.match(new RegExp(kind + ':\\s*\\[(\\d), (\\d), (\\d)\\]')); return m && [+m[1], +m[2], +m[3]]; }

test('the wall spells stand monuments: the rows, the kinds, the three grids and the forge set agree', () => {
    const rows = { rampart: 'menhir', raceShieldWall: 'castle_wall', raceGothicRampart: 'gothic_wall', raceZigguratProtocol: 'ziggurat_block' };
    for (const [id, kind] of Object.entries(rows)) {
        const sp = by[id];
        assert.ok(sp, id + ' exists');
        assert.strictEqual(sp.kind, 'terrainCreate', id + ' is still a terrainCreate (the preview, the AI and the ghost read it)');
        assert.ok(sp.monument && sp.monument.kind === kind, id + ' names its monument kind ' + kind);
        assert.ok(sp.terrainDeform && sp.terrainDeform.centerDelta === 2, id + ' keeps the +2 deform for the ghost preview');
    }
    for (const k of MON_KINDS) {
        const a = gridOf(MAP, k), b = gridOf(TR, k);
        assert.ok(a && b, k + ' in map.js _MON_GRID and three-renderer.js _MON_GRID');
        assert.deepStrictEqual(a, [1, 1, 2], k + ' is a 1×1 box two high (jump-only cover that blocks the sight)');
        assert.match(DATA, new RegExp("const MF_DELTA_SOLID_MONS = new Set\\(\\[[^\\]]*'" + k + "'"), k + ' in MF_DELTA_SOLID_MONS');
        assert.match(MAP, new RegExp("kind: '" + k + "'"), k + ' in the editor catalogue');
    }
    const mons = TR.slice(TR.indexOf('function _monBuilders()'), TR.indexOf('function _monRng'));
    assert.match(mons, /menhir: _hzPropMenhir, castle_wall: _hzCastleWallSeg/);
    assert.match(mons, /gothic_wall: _hzGothicWallSeg, ziggurat_block: _hzZigguratBlock/);
    for (const fn of ['_hzPropMenhir', '_hzCastleWallSeg', '_hzGothicWallSeg', '_hzZigguratBlock']) assert.match(TR, new RegExp('function ' + fn + '\\(rng\\)'), fn);
    assert.match(TR, /_hzMiscKit\('menhir', \{ tiles: 2\.0, fit: 'height'[^}]*fallback: _hzPropMenhirProc \}\)/, 'the menhir is GLB-first with a fallback');
    assert.match(TR, /_hzMiscKit\('church_wall', \{ tiles: 2\.0, fit: 'height'[^}]*fallback: _hzGothicWallSegProc \}\)/, 'the gothic wall is GLB-first with a fallback');
});

test('the live placer: map.js placeSpellMonument stamps the box, records the floor, and the handler uses it instead of the raise', () => {
    assert.match(MAP, /function placeSpellMonument\(mon\)/);
    assert.match(MAP, /window\.placeSpellMonument = placeSpellMonument/);
    const body = MAP.slice(MAP.indexOf('function placeSpellMonument(mon)'), MAP.indexOf('function _stampMonumentCollision()'));
    for (const guard of ["t === 'wall'", 'isObjectiveTile(gx, gy)', "had.has(gx + ',' + gy)", 'unitsAtColumn(gx, gy).length', 'rule && !rule.walkable']) assert.ok(body.includes(guard), 'refuses: ' + guard);
    assert.match(body, /state\.monuments\.push\(mon\)/, 'appends to state.monuments (synced)');
    assert.match(body, /state\._monumentTiles = tiles/, 'records the floor for the renderer');
    assert.match(body, /_syncColumnToLegacy\(c\.x, c\.y\)/, 'bumps the versions through the column sync');
    assert.match(body, /vCol\.push\(\{ z, terrain: fill \}\)/); assert.match(body, /col\.push\(\{ z, terrain: fill \}\)/);
    /* the handler */
    assert.match(BT, /if \(spell\.monument\) return;/, 'a monument spell paints no ground');
    assert.match(BT, /if \(spell\.terrainDeform && !spell\.monument && affectedTiles\.length > 0\)/, 'the raise is skipped for a monument spell');
    assert.match(BT, /if \(spell\.monument && affectedTiles\.length > 0 && typeof placeSpellMonument === 'function'\)/);
    assert.match(BT, /const _monRot = \(_castOrientation === 'vertical'\) \? 90 : 0;/, 'the piece follows the line');
});

test('THE ROCKS: the asteroid GLBs are _WPN_MODELS rows and every rock body goes through _finRockBody', () => {
    const models = VFX.slice(VFX.indexOf('var _WPN_MODELS = {'), VFX.indexOf('var _wpnCache'));
    assert.match(models, /asteroid:\s*\{ url: 'https:\/\/cdn\.entropywars\.net\/Assets\/door\/models\/asteroid_1\.glb', axis: 'y' \}/);
    assert.match(models, /asteroid2:\s*\{ url: 'https:\/\/cdn\.entropywars\.net\/Assets\/door\/models\/asteroid_2\.glb', axis: 'y' \}/);
    assert.match(VFX, /function _finRockBody\(diam, o\)/);
    const boulder = VFX.slice(VFX.indexOf('function _spawnBoulderProjectile3D('), VFX.indexOf('function _buildHurricaneVortex3D('));
    assert.match(boulder, /_finRockBody\(2, \{ glbOnly: true/, 'the boulder projectile is GLB-first');
    const meteor = VFX.slice(VFX.indexOf('function _spawnMeteorSphere3D('), VFX.indexOf('function _spawnContainmentField3D('));
    assert.match(meteor, /_finRockBody\(2, \{ glbOnly: true \}\)/, 'the meteor body is the asteroid first');
    assert.match(VFX, /raceStonefall: true,\s*\/\* THE ROCKS/, 'Stonefall lobs a real rock');
    assert.match(VFX, /function _sigAsteroidDrop3D\(tx, ty, o\)/);
});

test('TO THE MOON: the row, the arc, the moon in the throw, the director', () => {
    const sp = by.raceRocketToss;
    assert.strictEqual(sp.name, 'To the Moon');
    assert.strictEqual(sp.kind, 'skyThrow');
    assert.ok(sp.moonshot === true && sp.moonArcTiles === 7 && sp.carryHeight === 6, 'moonshot fields');
    assert.ok(g.isCapstoneSpellId('raceRocketToss'), 'still the cyborg capstone');
    assert.match(TR, /arcPx: opts\.arcPx != null \? opts\.arcPx : ts \* 0\.35,/, 'the throw tween takes arcPx');
    assert.match(TR, /var bump = tw\.drop \? 0 : tw\.arcPx \* 4 \* ft \* \(1 - ft\);/, 'the fling bumps by arcPx');
    assert.match(BT, /const isMoon = !!\(spell && spell\.moonshot\);/);
    assert.match(BT, /window\.ThreeVFXEffects\.sigMoonshot3D\(toX, toY, \{/, 'the moon is called inside playSkyThrowFx (relayed with it)');
    assert.ok(!/fireGeometry\('raceRocketToss/.test(BT), 'never through fireGeometry (the guest would get it twice)');
    assert.match(BT, /window\._ewMoonshot = \{/, 'the director reads the fling clock');
    assert.match(BT, /if \(!spell\.moonshot\) window\.setTimeout\(\(\) => \{\s*_cineRetargetShot/, 'the stock retarget yields to the director');
    assert.match(BT, /raceRocketToss\(ctx\) \{/, 'a CINE_SEQUENCES director');
    assert.match(VFX, /function _sigMoonshot3D\(tx, ty, P\)/);
    assert.match(VFX, /sigMoonshot3D: _sigMoonshot3D,/, 'exported');
    assert.match(VFX, /getMiscModelClone\('moon', diam, 'center'\)/, 'the renderer\'s moon GLB');
});

test('METEOR STORM: the row, the storm def, the descent hook', () => {
    const sp = by.raceProphecyOfDisaster;
    assert.strictEqual(sp.kind, 'delayed');
    assert.strictEqual(sp.aoeRadius, 2, 'a 5×5 zone');
    assert.ok(sp.groundsFlyers, 'flyers are knocked down');
    assert.match(VFX, /EFFECTS\['raceProphecyOfDisaster_descent'\] = \{\s*telegraphMs: 900, descentMs: 1600, aoeRadius: 2, shape: 'square'/);
    assert.match(VFX, /storm: true,/);
    assert.match(VFX, /if \(descentDef\.storm\) \{\s*try \{ _sigMeteorStorm3D\(tx, ty, aoeRadius, \{ ms: descentMs \}\); \}/, 'the descent fires the storm');
    assert.match(VFX, /function _sigMeteorStorm3D\(tx, ty, r, o\)/);
    assert.match(VFX, /SPELL_MAP\['raceProphecyOfDisaster'\] = Object\.assign\(\{\}, SPELL_MAP\['raceProphecyOfDisaster'\], \{ descent: 'raceProphecyOfDisaster_descent' \}\);/);
});

test('THE TRICK SHOT: the row, the travel time, the bolt hook, the director', () => {
    const sp = by.raceHighNoon;
    assert.ok(sp.ignoresLineOfSight === true && sp.travelMs === 1500 && sp.range === 6, 'the shot ignores cover and takes its time');
    assert.ok(!sp.projectileOverride, 'no PNG bullet flies straight over the ricochet');
    assert.match(BT, /\.\.\.\(spell\.travelMs > 0 \? \{ travelMs: spell\.travelMs \} : \{\}\),/, 'the action camera takes the row\'s travel time');
    assert.match(VFX, /if \(spellId === 'raceHighNoon' && !params\.hideGunRig\) \{\s*try \{\s*if \(_sigTrickShot3D\(fromTx, fromTy, toTx, toTy, \{ flyMs: params\.flyMs/, 'the bolt intent hands the shot to the ricochet');
    assert.match(VFX, /function _sigTrickShot3D\(fromTx, fromTy, toTx, toTy, o\)/);
    const body = VFX.slice(VFX.indexOf('function _sigTrickShot3D('), VFX.indexOf('function _finRicochetSpark('));
    for (const read of ["ter === 'wall' || ter === 'mountain' || isMon", 'h >= Math.max(hFrom, hTo) + 1', 'unitAt(x, y)) continue', 'rim: true']) assert.ok(body.includes(read), 'plans off: ' + read);
    assert.match(body, /var bounces = 3 \+ Math\.floor\(Math\.random\(\) \* 3\);/);
    const dir = BT.slice(BT.indexOf('raceHighNoon(ctx) {'), BT.indexOf('raceRocketToss(ctx) {'));
    assert.match(dir, /cineFlyBy\(mid, \{ span, tilt: 74 \}\);/); assert.match(dir, /cineSlowMo\(0\.5,/);
});

test('RULE #2: nothing new on state, nothing new relayed by hand', () => {
    const fin = VFX.slice(VFX.indexOf('THE FINISHER PASS (2026-09-18)'), VFX.indexOf('END THE FINISHER PASS'));
    assert.ok(!/state\.[a-zA-Z_]+\s*=/.test(fin), 'the finisher section writes nothing on state');
    assert.ok(!/_emit\(/.test(fin), 'no relay of its own');
});

/* ═══════════════════════════════════════════════════════════════════════
   THE FINISHERS — THE EXECUTIONS (2026-09-19): the gauge's other verb.
   ═══════════════════════════════════════════════════════════════════════ */
const HUD = src('hud.js'), UI = src('ui.js'), ONL = src('online.js'), AI = src('ai.js');
const BUILT = { 'king arthur': 'worldCleave', anubis: 'weighing', 'santa clause': 'naughtyList', 'honda civic': 'hitAndRun', kaiju: 'kaijuStomp', ai: 'segfault',
    homosapien: 'haymaker', cowboy: 'bootHill', 'mad scientist': 'shrinkRay',
    pirate: 'keelhaul', swordfighter: 'thousandCuts', knight: 'joust', shaman: 'theTrip', 'men in black': 'neuralyzer', telepath: 'mindOverMatter',
    marksman: 'dangerClose', priest: 'excommunicated', wizard: 'abracadabra', 'fortune teller': 'theTower', giant: 'feeFiFoFum', fairy: 'changeling',
    martian: 'ackAckAck', nordic: 'ascensionDenied', grey: 'theProbe', bigfoot: 'blurryFootage', 'shadow entity': 'sleepParalysis', reptilian: 'unmasking',
    robot: 'compactor', android: 'factoryReset', angel: 'rapture', seraphim: 'beNotAfraid', 'orb of light': 'intoTheSun', demon: 'contract',
    succubus: 'kissOfDeath', skeleton: 'boneRattle', mech: 'ordnance', ghost: 'possessedPhoto', zombie: 'pileOn', annunaki: 'pyramidScheme',
    skinwalker: 'wearingYou', werewolf: 'fullMoon', gargoyle: 'petrified', djinn: 'threeWishes', catgirl: 'nineLives', mantid: 'thePraying' };
const SIG_FN = { worldCleave: '_sigWorldCleave3D', weighing: '_sigWeighing3D', naughtyList: '_sigNaughtyList3D', hitAndRun: '_sigHitAndRun3D', kaijuStomp: '_sigKaijuStomp3D', segfault: '_sigSegfault3D',
    haymaker: '_sigHaymaker3D', bootHill: '_sigBootHill3D', shrinkRay: '_sigShrinkRay3D',
    keelhaul: '_sigKeelhaul3D', thousandCuts: '_sigThousandCuts3D', joust: '_sigJoust3D', theTrip: '_sigTheTrip3D', neuralyzer: '_sigNeuralyzer3D', mindOverMatter: '_sigMindOverMatter3D',
    dangerClose: '_sigDangerClose3D', excommunicated: '_sigExcommunicated3D', abracadabra: '_sigAbracadabra3D', theTower: '_sigTheTower3D', feeFiFoFum: '_sigFeeFiFoFum3D', changeling: '_sigChangeling3D',
    ackAckAck: '_sigAckAckAck3D', ascensionDenied: '_sigAscensionDenied3D', theProbe: '_sigTheProbe3D', blurryFootage: '_sigBlurryFootage3D', sleepParalysis: '_sigSleepParalysis3D', unmasking: '_sigUnmasking3D',
    compactor: '_sigCompactor3D', factoryReset: '_sigFactoryReset3D', rapture: '_sigRapture3D', beNotAfraid: '_sigBeNotAfraid3D', intoTheSun: '_sigIntoTheSun3D', contract: '_sigContract3D',
    kissOfDeath: '_sigKissOfDeath3D', boneRattle: '_sigBoneRattle3D', ordnance: '_sigOrdnance3D', possessedPhoto: '_sigPossessedPhoto3D', pileOn: '_sigPileOn3D', pyramidScheme: '_sigPyramidScheme3D',
    wearingYou: '_sigWearingYou3D', fullMoon: '_sigFullMoon3D', petrified: '_sigPetrified3D', threeWishes: '_sigThreeWishes3D', nineLives: '_sigNineLives3D', thePraying: '_sigThePraying3D' };

test('THE CATALOGUE: every playable race has a finisher row of its own type; the six typed defaults cover the chart', () => {
    assert.ok(g.FINISHER_RULES && g.FINISHER_RULES.apCost === 1 && g.FINISHER_RULES.baseDmg > 0, 'FINISHER_RULES');
    const problems = [];
    for (const race of g.AVAILABLE_RACES) {
        const f = g.FINISHERS[race];
        if (!f) { problems.push(race + ': no row'); continue; }
        for (const k of ['id', 'name', 'glyph', 'type', 'tagline', 'desc']) if (typeof f[k] !== 'string' || !f[k].trim()) problems.push(race + ': missing ' + k);
        if (!(g.RACE_PROFILES[race].types || []).includes(f.type)) problems.push(race + ': type ' + f.type + ' is not one of the race\'s own');
        if (!('sig' in f)) problems.push(race + ': no sig field (null = the typed execution)');
        if (f.sig && !BUILT[race]) problems.push(race + ': wears sig ' + f.sig + ' but is not in the BUILT table');
    }
    for (const race of Object.keys(g.FINISHERS)) if (!g.AVAILABLE_RACES.includes(race)) problems.push(race + ': a row for a race that is not playable');
    const ids = new Set(Object.values(g.FINISHERS).map(f => f.id));
    if (ids.size !== Object.keys(g.FINISHERS).length) problems.push('duplicate finisher ids');
    for (const t of g.ENTROPY_STRIKE_TYPE_ORDER) { const d = g.FINISHER_TYPE_DEFAULTS[t]; if (!d || d.type !== t) problems.push('no typed default for ' + t); }
    assert.deepStrictEqual(problems, []);
    assert.strictEqual(g.getFinisherDefForRace('kaiju').sig, 'kaijuStomp');
    assert.strictEqual(g.getFinisherDefForRace('not a race', ['divine']).id, 'fin_type_divine', 'an unknown race falls to the typed execution of its first type');
});

test('THE BUILT SIX: sig ↔ a director in battle.js ↔ a signature in three-vfx-effects.js, exported', () => {
    const dirs = BT.slice(BT.indexOf('const _FIN_DIRECTORS = {'), BT.indexOf('window._FIN_DIRECTORS = _FIN_DIRECTORS;'));
    for (const t of g.ENTROPY_STRIKE_TYPE_ORDER) assert.match(dirs, new RegExp("'type:" + t + "':\\s*_finTypedDirector\\('" + t + "'\\)"), 'typed director for ' + t);
    for (const [race, sig] of Object.entries(BUILT)) {
        assert.strictEqual(g.FINISHERS[race].sig, sig, race + ' wears ' + sig);
        assert.ok(g.FINISHERS[race].built === true, race + ' is marked built');
        const start = dirs.indexOf('            ' + sig + ': {');
        assert.ok(start > 0, 'director ' + sig);
        const rest = dirs.slice(start + 1);
        const next = rest.search(/^ {12}[a-zA-Z:'\-]+: \{\s*$/m);
        const body = next > 0 ? rest.slice(0, next) : rest;
        for (const hook of ['chargeMs', 'strikeMs', 'resolveMs', 'siren(', 'charge(', 'cam(', 'stage(', 'strike(', 'resolve(']) assert.ok(body.includes(hook), sig + ' lacks ' + hook);
        assert.match(VFX, new RegExp('function ' + SIG_FN[sig] + '\\('), SIG_FN[sig]);
        assert.match(VFX, new RegExp('sig' + SIG_FN[sig].slice(4) + ': ' + SIG_FN[sig] + ','), SIG_FN[sig] + ' exported');
        assert.ok(body.includes('V.sig' + SIG_FN[sig].slice(4)), sig + '\'s director fires its signature');
    }
    /* the section's ownership rules */
    const fin2 = VFX.slice(VFX.indexOf('THE FINISHER PASS 2 — THE EXECUTIONS'), VFX.indexOf('END THE FINISHER PASS'));
    assert.ok(!/\b_sigRun\(/.test(fin2), 'every group goes through _sigRunOwned');
    assert.ok(!/window\.setTimeout\(/.test(fin2), 'every timer goes through _fxDelay');
    assert.ok(!/state\.[a-zA-Z_]+\s*=/.test(fin2) && !/_emit\(/.test(fin2), 'nothing on state, no relay of its own');
    /* every sfx key a director names exists in audio.js */
    const AUD = src('audio.js');
    const keys = new Set([...dirs.matchAll(/c\.snd\('([a-zA-Z]+)'\)/g)].map(m => m[1]));
    const missing = [...keys].filter(k => !new RegExp('^\\s*' + k + ':', 'm').test(AUD));
    assert.deepStrictEqual(missing, [], 'unknown sfx keys');
    const CSS = src('styles-cinematic.css');
    const kinds = new Set([...dirs.matchAll(/c\.insert\([^)]*?,\s*'([a-z]+)'/g)].map(m => m[1]));
    for (const k of kinds) assert.ok(CSS.includes('.cine-insert.k-' + k + ' '), 'insert kind ' + k);
});

test('THE ENGINE: doFinisher spends the gauge like the strike, the cinematic is its own camera, the skeleton is fixed-time', () => {
    for (const fn of ['getFinisherFor', 'canUseFinisher', 'getFinisherTargets', 'getFinisherDamage', 'getFinisherForecast', 'getFinisherBestTarget', 'doFinisher', '_finPlayCinematic']) {
        assert.match(BT, new RegExp('function ' + fn + '\\('), fn);
        assert.match(BT, new RegExp('window\\.' + fn + ' = ' + fn + ';'), fn + ' on window');
    }
    const body = BT.slice(BT.indexOf('function doFinisher(unit, targetId)'), BT.indexOf('window.doFinisher = doFinisher;'));
    assert.match(body, /state\.entropyGauge\[unit\.player\] = 0;/, 'drains the whole gauge');
    assert.match(body, /state\._finisherCount\[unit\.player\] \+= 1;/);
    assert.match(body, /spendAllAP\(unit\);/, 'ends the executioner\'s turn');
    assert.match(body, /spellType: def\.type,/, 'typed like the strike');
    assert.match(body, /SimulEngine\.queueStep\(unit, \{ type: 'finisher'/, 'Simul queues it');
    assert.match(body, /if \(_skipVisuals\(\)\) \{\s*applyHit\(\);/, 'dev-sim resolves instantly');
    const cine = BT.slice(BT.indexOf('function _finPlayCinematic(unit, target, hooks)'), BT.indexOf('window._finPlayCinematic = _finPlayCinematic;'));
    assert.match(cine, /const CHARGE_MS  = actionMs\(D\.chargeMs\);/); assert.match(cine, /const STRIKE_MS  = actionMs\(D\.strikeMs\);/); assert.match(cine, /const RESOLVE_MS = actionMs\(D\.resolveMs\);/);
    assert.match(cine, /if \(camera\.save\) camera\.save\(\);/); assert.match(cine, /camera\.restore\(\{ duration: actionMs\(700\) \}\)/, 'saves and restores its own camera');
    assert.ok(!cine.includes('playOffensiveActionCamera('), 'never the stock two-beat shot');
    assert.match(cine, /_ewsShowBanner\(unit\.player, totalMs, getEntropyStrikeType\(def\.type\), \{/, 'the banner in the type theme with the finisher\'s words');
    assert.match(BT, /function _ewsShowBanner\(player, totalMs, def, opts\)/);
    assert.strictEqual((BT.match(/state\._finisherCount = \{ 1: 0, 2: 0 \};/g) || []).length, 2, 'both reset blocks');
    assert.match(BT, /finisherTargets\(unit\) \{ return getFinisherTargets\(unit\); \},/, 'TargetQuery');
    assert.match(BT, /canUseFinisher, getFinisherFor, getFinisherTargets, getFinisherDamage, getFinisherForecast, getFinisherBestTarget, doFinisher,/, 'GAME export');
    /* Simul: the four sites */
    assert.match(BT, /case 'finisher': ok = _queueFinisher\(unit, plan, step\); break;/);
    assert.match(BT, /case 'finisher': return \{ type: 'finisher', targetId: c\.targetId != null \? c\.targetId : null \};/);
    assert.match(BT, /: st\.type === 'finisher' \? \('☠ '/);
    assert.match(BT, /case 'finisher':\s*if \(typeof canUseFinisher === 'function' && canUseFinisher\(unit\)\) \{/);
});

test('THE CAMERA: cineOwnShot — a director that owns the shot silences the stock cut and every retarget', () => {
    assert.match(BT, /function cineOwnShot\(sequenceId\)/); assert.match(BT, /window\.cineOwnShot = cineOwnShot;/);
    assert.match(BT, /if \(_cineShotOwned\(sequenceId\)\) return;\s*\/\/ cineOwnShot: the director composes beat 2 itself/, 'the stock shot\'s beat 2 yields');
    const rt = BT.slice(BT.indexOf('function _cineRetargetShot(point, unit, opts = {})'), BT.indexOf('function _cineRetargetShot(point, unit, opts = {})') + 600);
    assert.match(rt, /if \(_cineShotOwned\(camera\._cineShotId\)\) return true;/, 'a retarget never yanks an owned shot');
    const hn = BT.slice(BT.indexOf('raceHighNoon(ctx) {'), BT.indexOf('raceRocketToss(ctx) {'));
    assert.match(hn, /cineOwnShot\(sequenceId\);/, 'High Noon owns its shot');
    const rt2 = BT.slice(BT.indexOf('raceRocketToss(ctx) {'), BT.indexOf('raceAbsoluteZero(ctx) {'));
    assert.match(rt2, /cineOwnShot\(sequenceId\);\s*\/\/ from the fling on/, 'To the Moon owns the shot from the fling');
});

test('THE HUD + THE UI: the execution leads the ⚛ picker, the victim list fires doFinisher, the gate never opens an all-grey menu', () => {
    assert.match(HUD, /id: 'fin:pick',/); assert.match(HUD, /chooseActionMenu\('finisherTargets'\)/);
    assert.match(HUD, /function _hrlgFinisherTargetBlades\(unit, st\)/);
    assert.match(HUD, /window\.doFinisher\(unit, t\.id\)/);
    assert.match(HUD, /\} else if \(menuView === 'finisherTargets'\) \{/);
    assert.match(HUD, /blades\.unshift\(\{\s*id: 'fin:pick',/, 'the finisher row leads the picker');
    assert.match(UI, /if \(view === 'finisherTargets' && !\(typeof canUseFinisher === 'function' && canUseFinisher\(unit\)\)\) \{/);
    assert.match(UI, /finisherTargets: 'entropy'/, 'the tutorial gate treats it as the entropy verb');
});

test('RULE #2: doFinisher is an engine game-action, the cinematic a relay the guest replays with no applyHit', () => {
    assert.match(ONL, /_emit\('game-action', \{ type: 'engine', fn: 'doFinisher', unitId: unit\.id, targetId: targetId != null \? targetId : null \}\);/);
    assert.match(ONL, /case 'doFinisher':\s*if \(typeof doFinisher === 'function'\) doFinisher\(engUnit, data\.targetId != null \? data\.targetId : null\);/);
    assert.match(ONL, /type: 'finisher-cine',/);
    assert.match(ONL, /if \(data\.type === 'finisher-cine' && _ewMirrorView\(\)\) \{/);
    assert.match(ONL, /window\._finPlayCinematic\(_fcU, _fcT, \{ applyHit: null, mute: true, remote: true, finisherId: data\.finisherId \|\| null \}\);/);
    assert.match(ONL, /window\.doFinisher = doFinisher;/); assert.match(ONL, /window\._finPlayCinematic = _finPlayCinematic;/);
});

test('THE AI: scoreFinisher competes with the strike on the same scale, the executor + Simul conversion + the imitation matcher know the verb', () => {
    assert.match(AI, /scoreEntropyStrike\(unit, v, candidates\);\s*scoreFinisher\(unit, v, candidates\);/);
    assert.match(AI, /function scoreFinisher\(unit, v, out\)/);
    const body = AI.slice(AI.indexOf('function scoreFinisher(unit, v, out)'), AI.indexOf('function scoreCombos(unit, v, out)'));
    assert.match(body, /if \(fc\.kill\) \{\s*out\.push\(\{ type: 'finisher', targetId: t\.id, target: t, score: 340/);
    assert.match(body, /_noDanger: true/);
    assert.match(AI, /case 'finisher': \{\s*const delay = \(typeof g\.doFinisher === 'function'\)/);
    assert.match(AI, /if \(h\.type === 'finisher'\) return h\.targetId == null \|\| c\.targetId === h\.targetId;/);
    assert.match(AI, /if \(c\.type === 'finisher'\) return 'finisher→' \+ tn\(c\.target\);/);
});

/* ═══ THE FINISHER ON THE CIRCUIT (2026-09-19) — the forge shows it and plays it ═══ */
test('THE FORGE: the ☠ FINISHER strip stands on the TECHNIQUES circuit and previews the execution on the stage', () => {
    const PB = src('party-builder.js'), CSS = src('styles-base.css');
    /* the strip + the panel + the keys */
    for (const sym of ["const PB_FIN_KEY = 'FIN';", 'function pbFinisherDef(race)', 'function pbFinisherInfo(key, fin)', "className: 'pb-fin'", "className: 'pb-fin-head'",
                       "'pb-tn pb-tn-fin is-finisher can'", 'function FinisherPanel(', "if (info && info.st8 === 'finisher') return h(FinisherPanel,",
                       'const pbPreviewFinisher = (opts) => {', 'cv.previewFinisher(fin, {', "if (nodeKey === PB_FIN_KEY) { pbPreviewFinisher({ hover: true }); return; }",
                       "if (st8 === 'finisher') { pbPreviewFinisher(); return; }", "if (key === PB_FIN_KEY) return dir === 'up' ? 'root' : key;",
                       "if (key === PB_FIN_KEY) return pbFinisherInfo(key, finisher);", 'finisher: unitFinisher }))']) {
        assert.ok(PB.includes(sym), 'party-builder.js: ' + sym);
    }
    assert.ok(PB.includes('window.getFinisherDefForRace'), 'the ONE read is data.js getFinisherDefForRace');
    assert.ok(!/pbFinisherDef[\s\S]{0,400}customSpells\.push/.test(PB), 'the finisher is never written into a loadout');
    for (const sel of ['.pb-fin ', '.pb-fin-head ', '.pb-tn.is-finisher .pb-tn-disc ', '.pb-tn.is-finisher.built .pb-tn-disc::after', '.pb-technique-fin .pb-technique-tagline']) assert.ok(CSS.includes(sel), 'styles-base.css: ' + sel);
    /* the viewer's beat */
    assert.match(TR, /function _cvPreviewFinisher\(def, opts\)/);
    assert.match(TR, /previewFinisher: function \(def, opts\) \{ return _cvPreviewFinisher\(def, opts\); \},/, 'EWCharViewer.previewFinisher');
    assert.match(TR, /if \(opts\.chain\) return opts\.chain;/, 'an explicit chain for the charged cast');
    const beat = TR.slice(TR.indexOf('function _cvPreviewFinisher(def, opts)'), TR.indexOf('var charViewer = {'));
    assert.ok(beat.includes("_castChainFor('ultimate')"), 'the charged cast');
    assert.ok(beat.includes('S.finisher(def, o)') && beat.includes('S.finisherTiming'), 'the stage script + its clock');
    assert.ok(!beat.includes('VFX3D.fire(') && !beat.includes('fireGeometry('), 'never the relayed fire (RULE #2)');
    /* the stage script: every built sig + every type */
    const fin2 = VFX.slice(VFX.indexOf('THE FINISHER PASS 2 — THE EXECUTIONS'), VFX.indexOf('END THE FINISHER PASS'));
    const stage = fin2.slice(fin2.indexOf('var _FIN_STAGE = {'));
    for (const sig of Object.values(BUILT)) assert.ok(new RegExp('^        ' + sig + ': function \\(P\\) \\{', 'm').test(stage) || stage.includes('_FIN_STAGE.' + sig + ' = function (P) {'), '_FIN_STAGE.' + sig);
    for (const t of g.ENTROPY_STRIKE_TYPE_ORDER) assert.match(stage, new RegExp('^        ' + t + ': function \\(P\\) \\{', 'm'), '_FIN_STAGE_TYPE.' + t);
    for (const [sig, fn] of Object.entries(SIG_FN)) assert.ok(stage.includes(fn + '('), '_FIN_STAGE.' + sig + ' fires ' + fn);
    assert.match(VFX, /finisher: function \(def, o\) \{ return _finStagePlay\(def, o\); \},/, 'VFX3D.stage.finisher');
    assert.match(VFX, /finisherTiming: function \(def, o\) \{ return _finStageTiming\(def, o\); \},/, 'VFX3D.stage.finisherTiming');
    assert.ok(stage.includes('if (!_VS.on || !def) return 0;'), 'the script plays on the stage only');
    /* the script's timing shape: charge → strike → resolve, every beat through P.at (= _fxDelay) */
    assert.ok(!/setTimeout\(/.test(stage), 'no bare timer in the stage script');
    assert.ok(fin2.includes('at: function (ms, fn) { _fxDelay('), 'P.at is _fxDelay');
});
