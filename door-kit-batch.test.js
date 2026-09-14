'use strict';
/* THE DOOR-KIT BATCH (2026-09-13/14) — the eight authored doors + seven
   props the user uploaded to R2 Assets/door/models/, and THE SURROUND (the
   frame cut to the leaf's shape). Source guards + the surround builder run
   under a THREE double so the hole shapes are exercised. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { loadGameData } = require('./load-data.js');

const TR = fs.readFileSync(path.join(__dirname, 'three-renderer.js'), 'utf8');
const INDEX = fs.readFileSync(path.join(__dirname, 'MODEL_INDEX.md'), 'utf8');
const D = loadGameData();
const HQ = D.DOOR_HQ;
const CAT = HQ.catalogue;

const LEAVES = {
    leaf_beige_wood: 'BEIGE WOODEN DOOR.glb',
    leaf_white_wood: 'WHITE WOODEN DOOR.glb',
    leaf_coffee: 'Coffee door.glb',
    leaf_wooden: 'Wooden Door.glb',
    leaf_birch_glass: 'BIRCH DOOR WITH GLASS IN THE MIDDLE.glb',
    leaf_orange_glass: 'ORANGE DOOR WITH GLASS IN THE MIDDLE.glb',
    leaf_window_large: 'DOOR WITH LARGE WINDOW.glb',
    leaf_window_medium: 'DOOR WITH MEDIUM WINDOW.glb',
    leaf_entrance: 'ENTRANCE DOOR.glb',
};
const PROPS = {
    computer_chair_blue: 'computer_chair_blue.glb',
    computer_chair_grey: 'computer_chair_grey.glb',
    security_camera: 'camera_01_cc0_clip_ready_v1.glb',
    utility_box: 'utility_box_01_cc0_clip_ready_v1.glb',
    asteroid_a: 'asteroid_1.glb',
    asteroid_b: 'asteroid_2.glb',
};

test('the nine authored leaves are catalogued with a measured aspect, a swing, a hinge and the right yaw', () => {
    for (const [k, f] of Object.entries(LEAVES)) {
        const c = CAT[k];
        assert.ok(c && c.leaf && c.file === f, k + ' → ' + f);
        assert.ok(c.aspect > 0.45 && c.aspect < 0.6, k + ': a single leaf, aspect ' + c.aspect);
        assert.equal(c.open, 'swing', k + ' swings');
        assert.ok(c.hinge === 'left' || c.hinge === 'right', k + ' names its hinge');
        assert.ok(!c.wide, k + ' is a single');
    }
    /* the three painted doors are one model authored edge-on; the glass pair faces −Z */
    for (const k of ['leaf_beige_wood', 'leaf_white_wood', 'leaf_coffee', 'leaf_wooden']) assert.equal(CAT[k].yaw, 90, k + ' is edge-on');
    for (const k of ['leaf_birch_glass', 'leaf_orange_glass']) assert.equal(CAT[k].yaw, 180, k + ' faces −Z');
    for (const k of ['leaf_window_large', 'leaf_window_medium', 'leaf_entrance']) assert.equal(CAT[k].yaw, undefined, k + ' faces the walker as authored');
    assert.ok(CAT.leaf_wooden.frame, 'the wooden door carries its own frame');
    /* every one hangs somewhere: a threshold or a hall door */
    const worn = new Set(Object.values(HQ.thresholds).map(t => t.leaf).concat(HQ.rooms.central_egress.doors.map(d => d.leaf)));
    for (const k of Object.keys(LEAVES)) assert.ok(worn.has(k), k + ' hangs on a door');
    assert.equal(HQ.thresholds.prebuilt_haunted.leaf, 'leaf_wooden');
    assert.equal(HQ.thresholds.prebuilt_vatican.leaf, 'leaf_white_wood');
    assert.equal(HQ.thresholds.prebuilt_downtown.leaf, 'leaf_entrance');
    const barber = HQ.rooms.central_egress.doors.find(d => d.id === 'barbershop');
    assert.equal(barber.leaf, 'leaf_birch_glass');
    assert.equal(HQ.rooms.barbershop.doors.find(d => d.id === 'egress').leaf, barber.leaf, 'the way out wears the same leaf');
});

test('the seven props are catalogued and stand where the index says', () => {
    for (const [k, f] of Object.entries(PROPS)) {
        const c = CAT[k];
        assert.ok(c && c.file === f && !c.leaf, k + ' → ' + f);
        assert.ok(c.h > 0 || c.span > 0, k + ' has a size target');
        assert.ok(INDEX.includes(f), f + ' named in MODEL_INDEX.md');
    }
    assert.ok(CAT.security_camera.wall && CAT.security_camera.mount > 2, 'the camera hangs high on a wall');
    assert.ok(CAT.utility_box.foot >= 0.4, 'the utility box blocks the walker');
    const hall = HQ.rooms.central_egress.props;
    assert.ok(hall.filter(p => /^computer_chair_/.test(p.key)).length >= 6, 'six computer chairs in the hall');
    assert.ok(hall.filter(p => p.key === 'security_camera' && p.wall).length >= 2, 'two cameras on the hall wall');
    for (const room of ['it', 'records', 'clockroom', 'medical']) assert.ok(HQ.rooms[room].props.some(p => /^computer_chair_/.test(p.key)), room + ' has a computer chair');
    for (const room of ['it', 'interrogation']) {
        const cam = HQ.rooms[room].props.find(p => p.key === 'security_camera');
        assert.ok(cam && cam.wall && cam.mount + 0.3 < HQ.rooms[room].shell.h, room + ': the camera is on a wall under the ceiling');
    }
    /* never a room prop: the box and the asteroids are board / horizon pieces */
    for (const [, room] of Object.entries(HQ.rooms)) for (const p of (room.props || [])) assert.ok(!/^(utility_box|asteroid_)/.test(p.key), room.label + ' places ' + p.key);
});

test('the renderer: utility boxes on the five urban settings, asteroids in the space + wreckage rosters, the camera head GLB-first', () => {
    const between = (a, b) => { const i = TR.indexOf(a); assert.ok(i >= 0, a); const j = TR.indexOf(b, i + 1); assert.ok(j > i, b); return TR.slice(i, j); };
    for (const k of ['nuketown', 'cyberpunk', 'stadium', 'strip', 'downtown']) {
        const body = between('_NR_BUILDERS.' + k + ' = function', '\n    };');
        assert.match(body, /_hzDoorKitGLB\('utility_box'/, k + ' places the utility box');
    }
    const rosters = between('function _hzThemeRoster(name)', 'return _HZ_THEME_ROSTERS[name]');
    const space = between('space: [', ']],');
    assert.match(space, /_hzAsteroidFar/, 'the space roster has the asteroid');
    assert.match(rosters.slice(rosters.indexOf('wreckage: [')), /_hzAsteroidFar/, 'the wreckage roster has the asteroid');
    assert.doesNotMatch(rosters, /\[0\.\d+, _hzAsteroid,/, 'the bare procedural rock left the rosters (it is the fallback)');
    const far = between('function _hzAsteroidFar(rng)', '\n    }');
    assert.match(far, /_hzDoorKitGLB\(key, \{[^}]*unlit: true[^}]*low: 'skip'[^}]*fallback: _hzAsteroid/, 'GLB-first, unlit, skipped under low perf, the rock as fallback');
    const cam = between('function _hzSecurityCam(rng)', '\n    }');
    assert.match(cam, /_hzDoorKitGLB\('security_camera'/, 'the camera head is the GLB');
    assert.match(cam, /fallback: function/, 'the box head is its fallback');
    const kit = between('function _hzDoorKitGLB(key, o)', '\n    }');
    for (const opt of ['o.unlit', "o.low === 'skip'", 'o.fit', 'o.lift']) assert.ok(kit.includes(opt), '_hzDoorKitGLB reads ' + opt);
});

test('THE SURROUND: the shaped leaves carry a shape, the renderer cuts the plate to it, the fit is edge to edge', () => {
    assert.equal(CAT.leaf_vault.shape, 'circle'); assert.ok(CAT.leaf_vault.hole > 0.5 && CAT.leaf_vault.hole < 0.8, 'the vault disc');
    assert.equal(CAT.leaf_bulkhead.shape, 'circle'); assert.ok(CAT.leaf_bulkhead.hole > 0.9, 'the bulkhead is the disc');
    assert.equal(CAT.leaf_portcullis.shape, 'arch'); assert.ok(CAT.leaf_portcullis.arch > 0.35 && CAT.leaf_portcullis.arch < 0.5);
    assert.equal(CAT.leaf_hell_arch.shape, 'arch'); assert.ok(CAT.leaf_hell_arch.arch > 0.25 && CAT.leaf_hell_arch.arch < 0.42);
    for (const [k, c] of Object.entries(CAT)) if (c.leaf && c.shape) assert.ok(['circle', 'arch'].includes(c.shape), k + ': shape circle | arch');
    const doors = TR.slice(TR.indexOf('function _hqBuildDoors(room)'), TR.indexOf('function _hqBuildCounters(room)'));
    assert.match(doors, /var surround = secret \? null : _hqDoorSurround\(ow, oh, leafCat, wallMat\)/, 'every door gets the surround (a secret door is a wall: none)');
    assert.match(doors, /var targetH = \(leafCat\.frame \? oh \+ 0\.03 : oh - 0\.015\) \* U/, 'the leaf fills the opening');
    assert.doesNotMatch(doors, /oh - 0\.08/, 'the 8 cm of black over the leaf is gone');
    /* run the builder under a THREE double: the hole is a circle / an arch / the inset rectangle */
    const src = TR.slice(TR.indexOf('function _hqDoorSurround(ow, oh, cat, mat)'), TR.indexOf('function _hqBuildDoors(room)'));
    const calls = [];
    class Path { constructor() { this.ops = []; this.holes = []; } moveTo(...a) { this.ops.push(['moveTo', ...a]); } lineTo(...a) { this.ops.push(['lineTo', ...a]); } closePath() { this.ops.push(['close']); } absarc(...a) { this.ops.push(['absarc', ...a]); } absellipse(...a) { this.ops.push(['absellipse', ...a]); } }
    const ctx = {
        THREE: {
            Shape: Path, Path,
            ShapeGeometry: class { constructor(shape, segs) { calls.push(shape); this.attrs = { uv: { count: 4, setXY() {}, needsUpdate: false }, position: { getX: () => 0, getY: () => 0 } }; } getAttribute(k) { return this.attrs[k]; } },
            Mesh: class { constructor(g, m) { this.geometry = g; this.material = m; this.position = { set() {} }; } },
        },
        _hqUnits: () => 73,
    };
    vm.runInNewContext(src + '\nthis.__f = _hqDoorSurround;', ctx);
    const f = ctx.__f;
    assert.equal(f(1.1, 2.25, null, {}), null, 'a procedural leaf has no plate');
    const circ = f(2.45, 2.45, CAT.leaf_vault, {});
    assert.ok(circ && circ.name === 'hq-door-surround');
    const hole = calls[calls.length - 1].holes[0];
    assert.equal(hole.ops[0][0], 'absarc'); assert.ok(Math.abs(hole.ops[0][3] / 73 - 2.45 * CAT.leaf_vault.hole / 2) < 1e-6, 'the disc is hole × the opening');
    f(2.07, 2.45, CAT.leaf_portcullis, {});
    const arch = calls[calls.length - 1].holes[0];
    assert.ok(arch.ops.some(o => o[0] === 'absellipse'), 'the arch has its cap');
    assert.ok(Math.abs(arch.ops.find(o => o[0] === 'absellipse')[4] / 73 - 2.45 * CAT.leaf_portcullis.arch * 0.985) < 1e-6, 'the cap is arch × the height');
    f(1.1, 2.25, CAT.leaf_hollow_core, {});
    const rect = calls[calls.length - 1].holes[0];
    assert.ok(rect.ops.every(o => o[0] !== 'absarc' && o[0] !== 'absellipse'), 'a rectangular leaf gets the inset rectangle');
    assert.ok(Math.abs(rect.ops[1][1] / 73 - 1.1 * 0.485) < 1e-9, 'inset 1.5 % each side');
});
