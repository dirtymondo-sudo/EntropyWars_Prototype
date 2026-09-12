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
        set(x, y, z) { Object.assign(this, { x, y, z }); return this; }
    }
    class Resource {
        constructor(opts = {}) { Object.assign(this, opts); this.disposals = 0; resources.push(this); }
        dispose() { this.disposals++; }
        clone() { return new Resource(); }
    }
    class Group {
        constructor() { this.children = []; this.position = new Vector(); this.rotation = new Vector(); this.scale = new Vector(1, 1, 1); }
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
    class Color { constructor(value) { this.value = value; this.r = ((value >> 16) & 255) / 255; this.g = ((value >> 8) & 255) / 255; this.b = (value & 255) / 255; } }
    const texture = { disposals: 0, dispose() { this.disposals++; } }, scene = new Group();
    const ctx = vm.createContext({ Math, Array, console: { warn: (...a) => warnings.push(a) }, performance: { now: () => now },
        THREE: { Group, Mesh, Sprite, Color, Vector2: Vector, Vector3: Vector,
            PlaneGeometry: Resource, CylinderGeometry: Resource, MeshBasicMaterial: Resource, SpriteMaterial: Resource, ShaderMaterial: Resource },
        _getVFXScene: () => missing || (vanish && ++reads > 1) ? null : scene,
        _worldPos: (x, y) => ({ x: x * 100, y: 20, z: y * 100, ts: 100 }),
        _sigMagicCircleTex: () => texture, _sigGlowTex: () => texture, _sigRingTex: () => texture, _sigNoiseTex: () => texture,
        _sigActive: 0, _SIG_MAX_ACTIVE: cap, _sigEntries: [], _fxSchedule: fn => frames.push(fn),
        _canSpawn: () => particles, tilePx: (x, y) => ({ x: x * 100, y: y * 100 }), unitSurfaceZ: () => 20,
        rn: (a, b) => (a + b) / 2, _spawn: p => events.push(p)
    });
    vm.runInContext(section('    function _sigEnergyMat(', '    /* Pixel terrain') +
        section('    function _sigEaseOutCubic(', '    /* full-viewport') +
        section('    function _sigMagicCircle3D(', '    /* ── expanding ground') +
        section('    function _sigMagicOrbMat(', '    /* ── anime speed-line') +
        section('    function _sigLightPillar3D(', '    /* ── slash smear'), ctx);
    ctx._SIG_MAX_ACTIVE = cap;
    return { ctx, resources, events, warnings, scene, sharedSpriteGeometry, texture, Group, Mesh, Resource, Sprite,
        fire(kind, opts = {}) { return ctx[{ circle: '_sigMagicCircle3D', orb: '_sigMagicOrb3D', pillar: '_sigLightPillar3D' }[kind]](2, 3, opts); },
        tick(ms) { now = ms; frames.forEach(fn => fn()); },
        retire() { [...ctx._sigEntries].forEach(e => e.finish()); },
        clean() {
            assert.ok(resources.length > 0); assert.ok(resources.every(r => r.disposals === 1), 'each instance resource disposed once');
            assert.equal(sharedSpriteGeometry.disposals, 0, 'shared sprite geometry retained'); assert.equal(texture.disposals, 0);
            assert.equal(scene.children.length, 0); assert.equal(ctx._sigActive, 0); assert.equal(ctx._sigEntries.length, 0);
        }
    };
}
const counts = { circle: 6, orb: 4, pillar: 9 };
for (const kind of Object.keys(counts)) {
    for (const mode of ['cap', 'vanish']) test(`${kind}: ${mode} refusal releases instance resources`, () => {
        const h = harness(mode === 'cap' ? { cap: 0 } : { vanish: true });
        assert.equal(h.fire(kind), null); assert.equal(h.resources.length, counts[kind]); h.clean(); h.retire(); h.clean();
    });
    test(`${kind}: missing scene allocates nothing`, () => {
        const h = harness({ missing: true }); assert.equal(h.fire(kind), null); assert.equal(h.resources.length, 0); assert.equal(h.events.length, 0);
    });
    test(`${kind}: completion retains shared assets and releases instances`, () => {
        const h = harness(); const e = h.fire(kind); assert.ok(e); h.tick(100); assert.equal(h.warnings.length, 0);
        assert.ok(h.resources.every(r => r.disposals === 0)); h.tick(1500); e.finish(); h.clean();
    });
    test(`${kind}: retirement blocks old frames while a new cast stays live`, () => {
        const h = harness(); const old = h.fire(kind); h.tick(100); h.retire(); h.clean();
        const oldY = old.group.position.y, prior = h.resources.slice(), next = h.fire(kind);
        h.tick(200); old.finish(); assert.equal(old.group.position.y, oldY); assert.equal(next.done, false);
        assert.ok(prior.every(r => r.disposals === 1)); assert.ok(h.resources.slice(prior.length).every(r => r.disposals === 0));
        h.retire(); h.clean(); assert.equal(h.warnings.length, 0);
    });
}
test('circle: custom position, colors, growth, spin, rise and fade', () => {
    const h = harness(), e = h.fire('circle', { radiusPx: 80, growMs: 200, holdMs: 400, fadeMs: 200, opacity: .5, spin: .002, height: 10, rise: 40, tiltRad: .3, color: 0x123456, color2: 0xabcdef, renderOrder: 180 });
    const [a, b, glow] = e.group.children;
    assert.equal(e.group.position.x, 200); assert.equal(e.group.position.z, 300); assert.equal(e.group.rotation.x, .3);
    assert.equal(a.children[0].material.color.value, 0x123456); assert.equal(b.children[0].material.color.value, 0xabcdef);
    assert.equal(glow.renderOrder, 179); h.tick(100); assert.equal(a.children[0].material.opacity, .25);
    assert.equal(a.rotation.y, .2); assert.equal(b.rotation.y, -.2 * 1.6); assert.equal(e.group.position.y, 35);
    h.tick(400); assert.equal(a.children[0].material.opacity, .5); assert.ok(Math.abs(a.scale.x - 80) < 1e-8);
    h.tick(700); assert.equal(a.children[0].material.opacity, .25); assert.equal(e.group.position.y, 65);
    h.tick(800); h.clean(); assert.equal(h.warnings.length, 0);
});
test('orb: custom motes, radius, rise and fade remain intact', () => {
    const h = harness(), e = h.fire('orb', { ms: 1000, r0: 10, r1: 90, rise: 80, height: 30, opacity: .8, moteCount: 3, moteSprite: 'custom', color: 0x123456 });
    assert.equal(h.events.length, 3); assert.ok(h.events.every(p => p.sprite === 'custom' && p.z === 50 && p.ml === 900));
    const [core, halo, ring] = e.group.children; assert.equal(halo.material.color.value, 0x123456);
    h.tick(200); assert.equal(e.group.position.y, 66); assert.equal(core.material.opacity, .8);
    assert.ok(core.scale.x > 10); assert.ok(halo.scale.x > core.scale.x); assert.equal(ring.rotation.z, .6);
    h.tick(900); assert.ok(core.material.opacity > 0 && core.material.opacity < .2);
    h.tick(1000); h.clean(); assert.equal(h.warnings.length, 0);
});
test('orb: disabled motes and unavailable particle pool keep geometry working', () => {
    for (const disabled of [true, false]) {
        const h = harness({ particles: disabled }), e = h.fire('orb', { motes: !disabled });
        assert.ok(e); assert.equal(h.events.length, 0); h.retire(); h.clean();
    }
});
test('pillar: shader time, erosion, height, growth and fade remain intact', () => {
    const h = harness(), e = h.fire('pillar', { ms: 1000, height: 600, radius: 30, color: 0x123456, coreColor: 0xabcdef });
    const [outer, aura, core, flare, ring] = e.group.children;
    assert.equal(e.group.position.y, 20); assert.equal(core.material.color.value, 0xabcdef); assert.equal(outer.position.y, 300);
    h.tick(80); assert.equal(core.scale.y, 600); assert.ok(core.scale.x > 0 && core.scale.x < 13.5);
    h.tick(200); assert.equal(core.scale.x, 13.5); assert.equal(outer.material.uniforms.uTime.value, .2);
    assert.equal(outer.material.uniforms.uErode.value, 0); assert.ok(aura.scale.x > outer.scale.x);
    h.tick(800); assert.ok(outer.material.uniforms.uErode.value > .4); assert.ok(flare.material.opacity < .5); assert.ok(ring.material.opacity < .15);
    h.tick(1000); h.clean(); assert.equal(h.warnings.length, 0);
});
test('tick exception still releases pillar instances and retains shared sprites', () => {
    const h = harness(), e = h.fire('pillar'); e.group.children[0].scale.set = () => { throw Error('injected tick failure'); };
    h.tick(100); assert.equal(h.warnings.length, 1); assert.equal(e.done, true); h.clean();
});
test('finishing one sprite effect leaves another live sprite using shared geometry', () => {
    const h = harness(), a = h.fire('orb'), b = h.fire('pillar');
    a.finish(); assert.equal(b.done, false); assert.equal(h.sharedSpriteGeometry.disposals, 0);
    h.tick(200); assert.equal(h.warnings.length, 0); h.retire(); h.clean();
});
