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
