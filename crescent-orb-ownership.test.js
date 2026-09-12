'use strict';
// Real production builders/animation/disposal; controlled renderer and clock.
// Sprite doubles preserve r128's shared geometry contract:
// https://github.com/mrdoob/three.js/blob/r128/src/objects/Sprite.js
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const source = fs.readFileSync(path.join(process.env.EW_EFFECT_SOURCE || __dirname, 'three-vfx-effects.js'), 'utf8');
function section(a, b) {
    const i = source.indexOf(a), j = source.indexOf(b, i + a.length);
    assert.ok(i >= 0 && j > i, a);
    return source.slice(i, j);
}
function harness({ cap = 20, missing = false, vanish = false, particles = true } = {}) {
    const resources = [], frames = [], events = [], warnings = [];
    let now = 0, reads = 0;
    class Vector {
        constructor(x = 0, y = 0, z = 0) { this.set(x, y, z); }
        copy(v) { return this.set(v.x, v.y, v.z); }
        set(x, y, z) { Object.assign(this, { x, y, z }); return this; }
    }
    class Resource {
        constructor(opts = {}) { Object.assign(this, opts); this.disposals = 0; resources.push(this); }
        dispose() { this.disposals++; }
        clone() { const r = new Resource(); r.offset = new Vector(); return r; }
        setAttribute(k, v) { (this.attributes ||= {})[k] = v; }
        setIndex(v) { this.index = v; }
    }
    class Group {
        constructor() { this.children = []; this.position = new Vector(); this.rotation = new Vector(); this.scale = new Vector(1, 1, 1); this.quaternion = { setFromUnitVectors() {} }; }
        add(o) { this.children.push(o); o.parent = this; }
        remove(o) { this.children = this.children.filter(c => c !== o); o.parent = null; }
        traverse(fn) { fn(this); this.children.forEach(c => c.traverse(fn)); }
    }
    class Mesh extends Group {
        constructor(geometry, material) { super(); Object.assign(this, { geometry, material }); }
    }
    const sharedSpriteGeometry = { disposals: 0, dispose() { this.disposals++; } };
    class Sprite extends Mesh {
        constructor(material) { super(sharedSpriteGeometry, material); this.isSprite = true; }
    }
    class Color {
        constructor(value) { this.value = value instanceof Color ? value.value : value; this.r = ((this.value >> 16) & 255) / 255; this.g = ((this.value >> 8) & 255) / 255; this.b = (this.value & 255) / 255; }
        lerp(c, t) { this.r += (c.r-this.r)*t; this.g += (c.g-this.g)*t; this.b += (c.b-this.b)*t; return this; }
        getHex() { return (Math.round(this.r*255)<<16) ^ (Math.round(this.g*255)<<8) ^ Math.round(this.b*255); }
    }
    const texture = { disposals: 0, dispose() { this.disposals++; }, clone() { const r = new Resource(); r.offset = new Vector(); return r; } }, scene = new Group();
    const ctx = vm.createContext({ Math, Array, console: { warn: (...a) => warnings.push(a) }, performance: { now: () => now },
        THREE: { Group, Mesh, Sprite, Color, Vector2: Vector, Vector3: Vector,
            BufferGeometry: Resource, BufferAttribute: class { constructor(array, itemSize) { Object.assign(this, {array, itemSize}); } }, SphereGeometry: Resource, PlaneGeometry: Resource, CylinderGeometry: Resource, MeshBasicMaterial: Resource, SpriteMaterial: Resource, ShaderMaterial: Resource },
        _getVFXScene: () => missing || (vanish && ++reads > 1) ? null : scene,
        _worldPos: (x, y) => ({ x: x * 100, y: 20, z: y * 100, ts: 100 }),
        _sigSlashSmearTex: () => texture, _sigStreakTex: () => texture, _sigMagicCircleTex: () => texture, _sigGlowTex: () => texture, _sigRingTex: () => texture, _sigNoiseTex: () => texture,
        _sigActive: 0, _SIG_MAX_ACTIVE: cap, _sigEntries: [], _fxSchedule: fn => frames.push(fn),
        _canSpawn: () => particles, tilePx: (x, y) => ({ x: x * 100, y: y * 100 }), unitSurfaceZ: () => 20,
        rn: (a, b) => (a + b) / 2, _spawn: p => events.push(p)
    });
    vm.runInContext(section('    function _sigEnergyMat(', '    /* Pixel terrain') +
        section('    function _sigEaseOutCubic(', '    /* full-viewport') +
        section('    function _sigMagicOrbMat(', '    function _sigMagicOrb3D(') +
        section('    function _sigSlashRibbonGeo(', '    /* ════════════════════════════════════════════════════════════════════\n       CHARGE') +
        section('    var _orbSphereGeoS = null', '    /* ── crescent chevron waves'), ctx);
    ctx._SIG_MAX_ACTIVE = cap;
    return { ctx, resources, events, warnings, scene, sharedSpriteGeometry, texture, Group, Mesh, Resource, Sprite,
        fire(kind, opts = {}) { return ctx[{ slash: '_sigCrescentSlash3D', burst: '_sigOrbBurst3D' }[kind]](2, 3, opts); },
        tick(ms) { now = ms; frames.forEach(fn => fn()); },
        retire() { [...ctx._sigEntries].forEach(e => e.finish()); },
        clean() {
            assert.ok(resources.length > 0); assert.ok(resources.every(r => r.disposals === (r._ew_shared ? 0 : 1)), 'each instance resource disposed once');
            assert.equal(sharedSpriteGeometry.disposals, 0, 'shared sprite geometry retained'); assert.equal(texture.disposals, 0);
            assert.equal(scene.children.length, 0); assert.equal(ctx._sigActive, 0); assert.equal(ctx._sigEntries.length, 0);
        }
    };
}
for (const [kind, opts] of [['slash', {}], ['burst', { mode: 'out' }], ['burst', { mode: 'in' }]]) {
    const label = `${kind} ${opts.mode || ''}`;
    test(`${label}: scene loss during registration releases allocations`, () => {
        const h = harness({ vanish: true }); assert.equal(h.fire(kind, opts), null); h.clean(); h.tick(200); h.clean();
    });
    test(`${label}: no initial scene allocates nothing`, () => {
        const h = harness({ missing: true }); assert.equal(h.fire(kind, opts), null); assert.equal(h.resources.length, 0);
    });
    test(`${label}: natural completion cleans once`, () => {
        const h = harness(), e = h.fire(kind, opts); assert.ok(e); h.tick(100);
        assert.equal(h.warnings.length, 0); assert.ok(h.resources.every(r => r.disposals === 0));
        h.tick(1500); e.finish(); h.clean();
    });
    test(`${label}: retirement prevents old callbacks touching a new cast`, () => {
        const h = harness(), e = h.fire(kind, opts); h.tick(100); h.retire(); h.clean();
        const prior = h.resources.slice(), oldRotation = e.group.children[0].rotation.z;
        const next = h.fire(kind, opts); h.tick(200); e.finish();
        assert.equal(e.group.children[0].rotation.z, oldRotation); assert.equal(next.done, false);
        assert.ok(prior.every(r => r.disposals === (r._ew_shared ? 0 : 1)));
        assert.ok(h.resources.slice(prior.length).every(r => r.disposals === 0));
        h.retire(); h.clean(); assert.equal(h.warnings.length, 0);
    });
    test(`${label}: animation error still cleans resources`, () => {
        const h = harness(), e = h.fire(kind, opts);
        e.group.children[0].scale.set = () => { throw Error('injected'); };
        h.tick(100); assert.equal(h.warnings.length, 1); assert.equal(e.done, true); h.clean();
    });
}
test('slash: cap refusal releases private smear texture and both ribbons', () => {
    const h = harness({ cap: 0 }); assert.equal(h.fire('slash'), null);
    assert.equal(h.resources.length, 6); h.clean();
});
test('burst: early cap refusal allocates nothing in either mode', () => {
    for (const mode of ['in', 'out']) { const h = harness({ cap: 0 }); assert.equal(h.fire('burst', {mode}), null); assert.equal(h.resources.length, 0); }
});
test('slash: private scrolling texture, sweep, echo and spark options', () => {
    const h = harness(), e = h.fire('slash', {ms: 1000, size: 200, sweep: 2, dir: -1, roll: .4, pitch: .2, yaw: .3, height: 30, color: 0x123456});
    const [mesh, echo] = e.group.children, glint = mesh.children[0];
    assert.equal(h.events.length, 6); assert.ok(h.events.every(p => p.tint === 0x123456 && p.sprite === 'steel-spark'));
    assert.equal(e.group.position.y, 50); assert.equal(e.group.rotation.y, .3); assert.equal(mesh.rotation.x, .2);
    assert.notEqual(mesh.material.map, h.texture); assert.equal(mesh.material.map, echo.material.map);
    assert.equal(mesh.geometry.attributes.position.array.length, 162); assert.equal(echo.geometry.attributes.position.array.length, 138);
    h.tick(500); assert.equal(mesh.rotation.z, .4 - 2 * .875); assert.equal(echo.rotation.z, .4 - 2 * (.875 - .22));
    assert.equal(mesh.scale.x, .72 + .42 * .875); assert.equal(mesh.material.map.offset.x, .55 * .125 - .1);
    assert.equal(mesh.material.opacity, .75); assert.equal(echo.material.opacity, .375); assert.ok(glint.material.opacity > 0);
    h.retire(); h.clean(); assert.equal(h.warnings.length, 0);
});
test('slash: disabled flecks do not change mesh animation', () => {
    const h = harness(), e = h.fire('slash', {flecks: false}); assert.equal(h.events.length, 0); h.tick(100);
    assert.ok(e.group.children[0].material.opacity > 0); h.retire(); h.clean();
});
for (const mode of ['in', 'out']) test(`burst ${mode}: shell timing, radius, flash and optional branches`, () => {
    const h = harness(), e = h.fire('burst', {mode, ms: 1000, r0: 10, r1: 100, height: 30, opacity: .6, rays: 3, debris: 2, motes: 4, color: 0x123456, swirl: .7});
    const [shell, haze, core, flashH, flashV, ring] = e.group.children;
    assert.equal(e.group.position.y, 50); assert.equal(shell.material.uniforms.uSwirl.value, .7);
    assert.equal(e.group.children.length, mode === 'in' ? 10 : 11);
    h.tick(500); assert.equal(shell.material.uniforms.uTime.value, mode === 'in' ? -.5 : .5);
    const r = mode === 'in' ? 100 - 90 * .125 : 10 + 90 * .875;
    assert.equal(haze.scale.x, r * .62); assert.equal(e.group.rotation.y, 500 * (mode === 'in' ? -.0016 : .0022));
    assert.ok(core.material.opacity > 0); assert.ok(ring.material.opacity > 0); assert.equal(flashH.material.opacity, 0);
    h.tick(950); assert.ok(mode === 'in' ? flashH.material.opacity > 0 : shell.material.uniforms.uOpacity.value < .1);
    h.retire(); h.clean(); assert.equal(h.warnings.length, 0);
    const minimal = harness(), m = minimal.fire('burst', {mode, flash: false, ring: false, rays: 0, debris: 0, motes: 0});
    assert.equal(m.group.children.length, 3); minimal.tick(100); minimal.retire(); minimal.clean(); assert.equal(minimal.warnings.length, 0);
});
test('finishing a burst preserves shared sphere, plane and sprite geometry used by another cast', () => {
    const h = harness(), a = h.fire('burst'), b = h.fire('burst');
    assert.equal(a.group.children[0].geometry, b.group.children[0].geometry);
    assert.equal(a.group.children[5].geometry, b.group.children[5].geometry);
    a.finish(); assert.equal(b.done, false); assert.equal(b.group.children[0].geometry.disposals, 0);
    h.tick(100); assert.equal(h.warnings.length, 0); h.retire(); h.clean();
});
