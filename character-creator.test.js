const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const read = f => fs.readFileSync(path.join(__dirname, f), 'utf8');
const sprites = read('sprites.js'), renderer = read('three-renderer.js');
const context = { window: {}, _mkUAL: (folder, prefix, opts) => opts };
vm.createContext(context);
vm.runInContext(sprites.slice(sprites.indexOf('const EW_APPEARANCE_LIMITS'), sprites.indexOf('function getRace3DModel')), context);
const normalize = context.normalizeCharacterAppearance;

test('appearance data clamps values, rejects future versions and strips arbitrary assets', () => {
    assert.equal(normalize(null), null);
    assert.equal(normalize([]), null);
    assert.equal(normalize({ version: 2 }), null);
    const a = normalize({ height: 50, width: -2, nose: NaN, jaw: Infinity, skin: 'url(evil)', hair: 'url', model: 'https://evil', waist: '1' });
    assert.equal(a.height, 1.15); assert.equal(a.width, 0.85);
    assert.equal(a.nose, 0); assert.equal(a.jaw, 0); assert.equal(a.waist, 0);
    assert.equal(a.skin, '#b98362'); assert.equal(a.hair, 'crop');
    assert.equal(a.model, undefined);
    assert.equal(normalize({ skin: ['#ffaa00'] }).skin, '#b98362');
    assert.deepEqual(JSON.parse(JSON.stringify(normalize(a))), JSON.parse(JSON.stringify(a)));
});

test('custom bases are opt-in for humans, with only two allowlisted fallback URLs', () => {
    assert.equal(context.getCharacterAppearanceModel('fairy', 'male', {}), null);
    assert.equal(context.getCharacterAppearanceModel('homosapien', 'male', null), null);
    for (const gender of ['male', 'female']) {
        const def = context.getCharacterAppearanceModel('homosapien', gender, { height: 1.1 });
        assert.equal(def.heightRatio, 1.1);
        assert.match(def.model, new RegExp('/Assets/Models/.*_' + gender + '_biped_Character_output.glb'));
        assert.equal(context.getCharacterModelFallback(def.model), '/api/character-model/' + gender);
    }
    assert.equal(context.getCharacterModelFallback('https://evil.example/a.glb'), null);
});

test('identity resolution preserves a sanitized human appearance and ignores it on other races', () => {
    const s = read('state.js');
    const c = { normalizeCharacterAppearance: normalize, getArchetypeForJob: () => ({}), normalizeRaceKey: r => r,
        getRaceProfile: () => ({ faction: 'time', types: ['human'] }), getAvailableGendersForRace: () => ['male', 'female'],
        getTerrainPreferenceForRace: () => 'none', randInt: () => 0 };
    vm.createContext(c);
    vm.runInContext(s.slice(s.indexOf('        function resolveIdentityForBuild('), s.indexOf('        function randomizeIdentity(')), c);
    const a = c.resolveIdentityForBuild('Freelancer', { race: 'homosapien', gender: 'female', appearance: { waist: 0.5 } });
    assert.equal(a.appearance.waist, 0.5); assert.equal(a.gender, 'female');
    assert.equal(c.resolveIdentityForBuild('Freelancer', { race: 'fairy', appearance: {} }).appearance, null);
});

test('creator appearances survive team save/load, unit creation and the existing online transport', () => {
    const pb = read('party-builder.js'), map = read('map.js'), net = read('online.js');
    assert.match(pb, /appearance: window\.normalizeCharacterAppearance\?\.\(mt\.appearance\)/);
    assert.match(pb, /st\.partyMeta\[player\]\[i\]\.appearance = window\.normalizeCharacterAppearance\?\.\(s\.appearance\)/);
    assert.match(map, /appearance: identity\.appearance \|\| null/);
    assert.match(renderer, /getRace3DModel\(unit\.race, unit\.gender \|\| 'male', unit\.appearance\)/);
    assert.match(renderer, /_rig\.appearanceKey !== appearanceKey/);
    assert.match(net, /meta: st\.partyMeta \? st\.partyMeta\[2\] : null/);
    const serializer = net.slice(net.indexOf('function _serializeState('), net.indexOf('function _unbox('));
    assert.ok(!/appearance:\s*1/.test(serializer));
    assert.match(pb, /if \(isWaitingOnline \|\| unitRace !== 'homosapien'\) return/);
});

test('same-origin fallback serves only male and female GLBs', () => {
    const s = read('server.js'), start = s.indexOf("app.get('/api/character-model/:gender'");
    const calls = [];
    const c = { __dirname, path, limitRead: () => {}, app: { get: (...args) => calls.push(args) } };
    vm.createContext(c); vm.runInContext(s.slice(start, s.indexOf('// Serve ONLY', start)), c);
    const handler = calls[0][2];
    for (const gender of ['male', 'female', '../server.js', 'other']) {
        let status, file;
        const response = { sendStatus: n => status = n, type: () => {}, sendFile: f => file = f };
        handler({ params: { gender } }, response);
        if (gender === 'male' || gender === 'female') assert.equal(file, path.join(__dirname, 'rigged_animations', 'Meshy_AI_human_body_base_mesh_' + gender + '_biped_Character_output.glb'));
        else { assert.equal(status, 404); assert.equal(file, undefined); }
    }
});

// Optional asset-level validation: npm install --no-save three@0.128.0.
// Uses the real r128 CPU skinning math, with no browser or gameplay automation.
let THREE;
try { THREE = require('three'); } catch (_) {}
const haveModels = fs.existsSync(path.join(__dirname, 'rigged_animations', 'Meshy_AI_human_body_base_mesh_male_biped_Character_output.glb'));
test('both base rigs remain finite and isolated across all fitted outfits and shape limits', { skip: !THREE || !haveModels }, async () => {
    const c = { THREE, console, TextDecoder, URL, Blob, setTimeout, clearTimeout, normalizeCharacterAppearance: normalize };
    c.self = c; c.window = c;
    vm.createContext(c);
    vm.runInContext(fs.readFileSync(require.resolve('three/examples/js/loaders/GLTFLoader.js'), 'utf8'), c);
    vm.runInContext(fs.readFileSync(require.resolve('three/examples/js/utils/SkeletonUtils.js'), 'utf8'), c);
    vm.runInContext(renderer.slice(renderer.indexOf('    function _createAppearanceRig('), renderer.indexOf('    function _cvResolveDef(')), c);
    for (const gender of ['male', 'female']) {
        const b = fs.readFileSync(path.join(__dirname, 'rigged_animations', 'Meshy_AI_human_body_base_mesh_' + gender + '_biped_Character_output.glb'));
        const gltf = await new Promise((ok, fail) => new THREE.GLTFLoader().parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength), '', ok, fail));
        let original; gltf.scene.traverse(n => { if (n.isSkinnedMesh) original = n; });
        const before = Array.from(original.geometry.attributes.position.array);
        const clone = THREE.SkeletonUtils.clone(gltf.scene), other = THREE.SkeletonUtils.clone(gltf.scene);
        let untouched; other.traverse(n => { if (n.isSkinnedMesh) untouched = n; });
        const rig = c._createAppearanceRig(clone, {});
        let bodies = []; clone.traverse(n => { if (n.isSkinnedMesh) bodies.push(n); });
        assert.equal(bodies.length, 3);
        for (const outfit of ['suit', 'tee', 'tank']) for (const hair of ['bald', 'crop', 'crest']) for (const sign of [-1, 0, 1]) {
            rig.update({ outfit, hair, width: 1 + sign * .15, chest: sign, waist: sign, hips: sign, head: sign, jaw: sign, cheeks: sign, nose: sign });
            const arm = bodies[0].skeleton.bones.find(b => b.name === 'LeftArm'); arm.rotation.z = .4;
            clone.updateMatrixWorld(true);
            for (const n of bodies) {
                assert.notEqual(n.geometry, original.geometry);
                assert.notEqual(n.skeleton, untouched.skeleton);
                assert.ok(Array.from(n.geometry.attributes.position.array).every(Number.isFinite));
                n.skeleton.update();
                const pos = n.geometry.attributes.position, v = new THREE.Vector3();
                for (let i = 0; i < pos.count; i += 11) {
                    n.boneTransform(i, v); v.applyMatrix4(n.matrixWorld);
                    assert.ok([v.x, v.y, v.z].every(Number.isFinite));
                    assert.ok(v.length() < 5, 'fitted geometry escaped the metre-scale rig');
                }
            }
            assert.equal(bodies[0].geometry.index.count + bodies[1].geometry.index.count, original.geometry.index.count, 'clothing masks must cover exactly the removed body triangles');
            assert.deepEqual(Array.from(original.geometry.attributes.position.array), before);
        }
        let disposed = 0; bodies.forEach(n => n.geometry.addEventListener('dispose', () => disposed++));
        rig.dispose(); assert.equal(disposed, 3);
    }
});

test('R2 load failure retries only the allowlisted model and settles the existing cache', () => {
    const calls = [], cache = {};
    const root = { traverse: () => {} };
    const c = { console, _unitGlbCache: cache, _skinnedBBox: () => ({}), invalidateUnits: () => {},
        getCharacterModelFallback: context.getCharacterModelFallback,
        THREE: { GLTFLoader: class { load(url, ok, progress, fail) {
            calls.push(url); if (url.startsWith('/api/')) ok({ scene: root, animations: [] }); else fail();
        } } } };
    vm.createContext(c);
    vm.runInContext(renderer.slice(renderer.indexOf('    function _loadUnitGLB('), renderer.indexOf('    /* Match-start preload gate')), c);
    const url = context.getCharacterAppearanceModel('homosapien', 'female', {}).model;
    let result; c._loadUnitGLB(url, e => result = e);
    assert.deepEqual(calls, [url, '/api/character-model/female']);
    assert.equal(result.root, root); assert.equal(result.loading, false);
    c._loadUnitGLB(url, e => assert.equal(e, result));
    assert.equal(calls.length, 2, 'second caller should reuse the settled model');
});
