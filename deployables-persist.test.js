'use strict';
/* THE VANISHING DEPLOYABLES + THE SAME TORCH EVERYWHERE (2026-09-15) —
   source scans + one behavioural check.
   (1) rebuildObjects (three-renderer.js) used to strip every child of the
       object group but the turrets — wards, mirrors, doors, seeds, bombs,
       decoys, gates — while deployableMeshes kept their handles and the
       deployable serial never changed, so a freshly placed ward blinked
       out on the next object rebuild (usually its own bark texture landing
       and flipping _objectsDirty). A deployable must live like a turret:
       removed ONLY by its own rebuild pass.
   (2) A player's OWN wards / doors / gates / deployed objects are always
       visible to them (the fog pass reads _ew_depOwner).
   (3) The HQ's wall_torch / cave_torch procs are the game's own torch
       (_makeTorchModel) fluttered by the one _torchFlicker. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const read = (f) => fs.readFileSync(path.join(__dirname, f), 'utf8');
const R = read('three-renderer.js');
const D = read('data.js');

function fnBody(src, sig) {
    const a = src.indexOf(sig);
    assert.ok(a > 0, sig + ' found');
    let depth = 0, i = src.indexOf('{', a);
    for (; i < src.length; i++) {
        if (src[i] === '{') depth++;
        else if (src[i] === '}') { depth--; if (!depth) break; }
    }
    return src.slice(a, i + 1);
}

test('rebuildObjects leaves every deployable alone (they are rebuildDeployables\' to remove)', () => {
    const body = fnBody(R, 'function rebuildObjects()');
    assert.ok(body.includes("deployableMeshes.forEach(function (m) { keepDep.add(m); })"), 'the live deployable set is read');
    assert.ok(body.includes('!ch._ew_turretId && ch !== _terrainDecoGroup && !ch._ew_deployable && !keepDep.has(ch)'), 'the removal filter skips turrets, the deco group AND every deployable');
});

test('the deployable serial folds the terrain versions (a dig under a ward re-seats it)', () => {
    const body = fnBody(R, 'function _computeDeployableSerial()');
    for (const v of ['_terrainVersion', '_heightVersion', '_voxelVersion']) assert.ok(body.includes('state.' + v), v + ' hashed');
});

test('your own wards / doors / gates / deployed objects wear _ew_depOwner (never fog-gated by tile)', () => {
    const body = fnBody(R, 'function rebuildDeployables()');
    assert.ok(body.includes('m._ew_depOwner = w.owner;'), 'wards');
    assert.ok(body.includes('dm._ew_depOwner = dd.owner;'), 'doors');
    assert.ok(body.includes('gm._ew_depOwner = gp.ownerPlayer;'), 'gate pairs');
    assert.ok(body.includes('mesh._ew_depOwner = dObj.ownerPlayer;'), 'decoys');
    assert.ok(body.includes('d3g._ew_depOwner = dObj.ownerPlayer;'), '3D deployed objects');
    assert.ok(body.includes('markerMesh._ew_depOwner = dObj.ownerPlayer;'), 'marker fallback');
    const fog = fnBody(R, 'function _applyFogVisibility(visible)');
    assert.ok(fog.includes('mesh._ew_depOwner !== undefined && mesh._ew_depOwner === vp'), 'the fog pass honours the owner tag');
});

test('the HQ torches are the ward torch: _makeTorchModel in metres + the shared flicker', () => {
    assert.ok(/var HQ_TILE_M = 1\.75;/.test(R), 'HQ_TILE_M');
    const mk = fnBody(R, 'function _makeTorchModel(opts)');
    assert.ok(mk.includes('var ts = opts.ts || CONFIG.tileSize || BASE_TILE;'), 'the model takes an explicit tile size');
    assert.ok(mk.includes('if (!opts.noTint) woodMat = _evTintMat(woodMat'), 'the editor tint is optional');
    for (const proc of ['wall_torch', 'cave_torch']) {
        const b = fnBody(R, proc + ': function (U)');
        assert.ok(b.includes('_makeTorchModel({ ts: HQ_TILE_M * U'), proc + ' builds the game torch');
        assert.ok(b.includes('_torchFlicker(entry, now * 0.001, false)'), proc + ' flutters through the shared flicker');
        assert.ok(!b.includes('ConeGeometry'), proc + ' has no cone flame of its own any more');
    }
    // the battle frame runs the same helper
    const upd = fnBody(R, 'function _updateTorchFlames()');
    assert.ok(upd.includes('_torchFlicker(e, now, isNight, baseInt)'), 'the battle frame uses _torchFlicker');
    // the catalogue rows still carry a light (doorhq / hq-cave count them as room lights) and stand at the new heights
    for (const k of ['wall_torch', 'cave_torch']) {
        const row = D.match(new RegExp(k + ':\\s*\\{ proc: \'' + k + '\'[^\\n]*'));
        assert.ok(row && /light: \{/.test(row[0]) && /glow: \{/.test(row[0]), k + ' catalogued with a light + a glow');
    }
    assert.ok(/cave_torch:\s*\{[^\n]*h: 1\.9/.test(D) && /wall_torch:\s*\{[^\n]*h: 1\.1/.test(D), 'the rows wear the model\'s heights');
});

test('_torchFlicker moves the flame, breathes the material and keeps the light warm', () => {
    const src = fnBody(R, 'function _torchFlicker(e, now, isNight, baseInt)');
    const ctx = { TORCH_LIGHT_INT_DAY: 0.55, TORCH_LIGHT_COLOR_NIGHT: 0xff8833, TORCH_LIGHT_COLOR_DAY: 0xff9944, Math };
    vm.createContext(ctx);
    vm.runInContext(src + '; this.f = _torchFlicker;', ctx);
    const mk = () => ({
        seed: 7,
        flame: { scale: { set(x, y, z) { this.x = x; this.y = y; this.z = z; } }, rotation: { y: 0 } },
        mat: { opacity: 1 },
        light: { intensity: 0, color: { set(c) { this.c = c; } } }
    });
    const e1 = mk(), e2 = mk();
    ctx.f(e1, 0.0, false, 0.55); ctx.f(e2, 0.37, true, 1.35);
    assert.ok(e1.flame.scale.y > 0.8 && e1.flame.scale.y < 1.2, 'a plausible flutter');
    assert.notEqual(e1.flame.scale.y, e2.flame.scale.y, 'time moves the flame');
    assert.ok(e2.mat.opacity <= 1 && e2.mat.opacity > 0.7, 'opacity breathes in range');
    assert.equal(e2.light.color.c, 0xff8833, 'night colour');
    assert.ok(e2.light.intensity > 1.0, 'night intensity rides baseInt');
    const e3 = mk(); ctx.f(e3, 1, false); assert.ok(e3.light.intensity > 0.4 && e3.light.intensity < 0.7, 'baseInt defaults to the day intensity');
});
