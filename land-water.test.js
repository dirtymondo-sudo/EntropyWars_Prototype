// land-water.test.js — THE WATER (WORLD_GEOGRAPHY_PLAN.md §7 G3, 2026-09-28).
//
// Bakes the land at 16 m into a temp folder (as land-stream.test.js does), files it through data.js's readers and holds
// THE WATER LAYER to its promises: the surface it reads is the one the bake wrote (the tiles' water, the loch's level, the
// sea's), every river meets the sea at the sea's level (the bake's run-out), the current runs downhill, the falls are found
// where a river drops, and the skiff floats on the loch (a mooring found, the hull crosses the loch, never climbs a falls).
// Then the wiring: the swimmer, the helm and the look under the surface read the layer, the renderer draws it.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const vm = require('vm');
const { loadGameData } = require('./load-data.js');
const { bake, writeOutputs } = require('./bake-land.js');
const { heavy } = require('./test-heavy.js');

function world(cell) {
    const B = bake({ cell, quiet: true });
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ew-land-g3-'));
    writeOutputs(B, dir, { tiles: true, map: false });
    const sb = loadGameData();
    const R = src => vm.runInContext(src, sb);
    sb.__ov = JSON.parse(fs.readFileSync(path.join(dir, 'land.json'), 'utf8'));
    R('hqLandIndex(__ov)');
    sb.__b = fs.readFileSync(path.join(dir, 'sea.bin'));
    R('hqLandWorldRead(__b)');
    R('HQ_LAND_RULES.tiles.cap = 1e6');   // the test holds every tile it loads
    const load = (x, z, r) => { for (const w of R(`hqLandWant(${x}, ${z}, ${r})`)) { sb.__t = fs.readFileSync(path.join(dir, w.name)); R('hqLandPut(hqLandTileRead(__t))'); } };
    return { B, dir, sb, R, load, ov: sb.__ov };
}
let W16 = null;
const w16 = () => W16 || (W16 = world(16));
const loch = ov => ov.lakes.find(l => l.id === 'lochness');

test('the water layer reads the bake: the tiles\' water, the loch\'s level, the open sea', () => {
    const { R, load, ov } = w16();
    const L = loch(ov), cx = (L.a[0] + L.b[0]) / 2, cz = (L.a[1] + L.b[1]) / 2;
    load(cx, cz, 400);
    assert.ok(Math.abs(R(`hqLandWaterY(${cx}, ${cz})`) - L.level) < 0.05, 'the loch stands at its level');
    assert.ok(R(`hqLandWaterFresh(${cx}, ${cz})`), 'the loch is fresh water');
    assert.ok(R(`hqLandWaterDepth(${cx}, ${cz})`) > 2, 'the loch is deep enough to swim');
    // every wet lattice sample (not the sea's) reads back as the tile's own water
    const res = R(`(() => { const St = HQ_LAND_STORE, sea = HQ_LAND_RULES.sea.y, near = HQ_LAND_RULES.water.nearSea; let n = 0, worst = 0;
        for (const t of St.grid) { if (!t || !t.water) continue;
            for (let o = 0; o < t.S * t.S; o += 3) { const w = t.water[o]; if (!(w === w) || (w - sea < near && t.h[o] < sea)) continue;
                const x = t.x0 + (o % t.S) * St.step, z = t.z0 + Math.floor(o / t.S) * St.step;
                worst = Math.max(worst, Math.abs(hqLandWaterY(x, z) - w)); n++; } }
        return { n, worst }; })()`);
    assert.ok(res.n > 20, `${res.n} wet samples checked`);
    assert.ok(res.worst < 0.05, `the layer is the tiles' water (worst ${res.worst})`);
    // the open sea: the sea's level, not fresh
    const sea = R('HQ_LAND_RULES.sea.y');
    const bay = R(`HQ_LAND_RULES.water.moor.find(m => m.id === 'bay').at`);
    load(bay[0], bay[1], 200);
    const deep = R(`(() => { for (let r = 0; r <= 180; r += 12) for (let a = 0; a < 16; a++) { const x = ${bay[0]} + Math.sin(a * Math.PI / 8) * r, z = ${bay[1]} + Math.cos(a * Math.PI / 8) * r, d = hqLandWaterDepth(x, z); if (d != null && d > 4) return [x, z]; } return null; })()`);
    assert.ok(deep, 'open water in the bay');
    assert.strictEqual(R(`hqLandWaterY(${deep[0]}, ${deep[1]})`), sea, 'the sea stands at its level');
    assert.ok(!R(`hqLandWaterFresh(${deep[0]}, ${deep[1]})`), 'the sea is not fresh');
});

test('every river meets the sea at the sea\'s level (the bake\'s run-out); a river\'s surface only falls', () => {
    const { ov, R } = w16();
    const sea = R('HQ_LAND_RULES.sea.y'), RM = R('HQ_LAND.riverMouth');
    assert.ok(RM && RM.coast > 0 && RM.lift >= 0, 'the recipe carries the river mouth');
    const mouths = ov.rivers.filter(r => r.mouth);
    assert.ok(mouths.length >= 2 && mouths.some(r => r.id === 'great') && mouths.some(r => r.id === 'ness'), `River 1 and River 3 reach the sea (${mouths.map(r => r.id)})`);
    for (const r of mouths) assert.ok(r.mouth[2] <= sea + RM.lift + 0.011, `${r.id} meets the sea at its level (${r.mouth[2]})`);
    for (const r of ov.rivers) for (let k = 1; k < r.pts.length; k++) assert.ok(r.pts[k][2] <= r.pts[k - 1][2] + 1e-6, `${r.id} runs downhill at ${k}`);
});

test('the current runs downstream; a lake and the sea hold still', () => {
    const { R, load, ov } = w16();
    let checked = 0;
    for (const r of ov.rivers) {
        const p = r.pts;
        for (let k = 2; k < p.length - 2 && checked < 40; k += Math.max(1, Math.floor(p.length / 6))) {
            const g = (p[k - 1][2] - p[k + 1][2]) / Math.max(1e-6, Math.hypot(p[k + 1][0] - p[k - 1][0], p[k + 1][1] - p[k - 1][1]));
            if (g < 0.004 || g > 0.3) continue;
            load(p[k][0], p[k][1], 40);
            if (R(`hqLandFresh(${p[k][0]}, ${p[k][1]})`) == null) continue;
            const f = R(`hqLandFlow(${p[k][0]}, ${p[k][1]})`), dx = p[k + 1][0] - p[k - 1][0], dz = p[k + 1][1] - p[k - 1][1];
            if (Math.hypot(f[0], f[1]) < 1e-6) continue;
            assert.ok(f[0] * dx + f[1] * dz > 0, `${r.id} at ${k} runs downstream`);
            assert.ok(Math.hypot(f[0], f[1]) <= R('HQ_LAND_RULES.water.current.max') + 1e-6, 'the current is capped');
            checked++;
        }
    }
    assert.ok(checked >= 5, `${checked} river spots checked`);
    const L = loch(ov), cx = (L.a[0] + L.b[0]) / 2, cz = (L.a[1] + L.b[1]) / 2;
    assert.deepStrictEqual(Array.from(R(`hqLandFlow(${cx}, ${cz})`)).slice(0, 2), [0, 0], 'the loch holds still');
});

test('R7: a river\'s drop is a waterfall', () => {
    const { R } = w16();
    const F = R('hqLandFalls()'), rule = R('HQ_LAND_RULES.water.falls');
    assert.ok(F.length >= 2, `${F.length} falls`);
    for (const f of F) {
        assert.ok(f.drop >= rule.drop, `${f.id} drops ${f.drop} m`);
        assert.ok(f.top[2] - f.foot[2] >= rule.drop - 1e-6, `${f.id} top above its foot`);
        assert.ok(f.w > 0 && f.pts.length >= 2, `${f.id} has a width and a line`);
    }
    assert.strictEqual(R('hqLandFalls()'), F, 'read once per bake');
});

test('the skiff floats on the loch: moored at the shore, crosses the loch, never climbs a falls', () => {
    const { R, load } = w16();
    const m = R(`HQ_LAND_RULES.water.moor.find(m => m.id === 'loch')`);
    assert.ok(m, 'a mooring on the loch');
    load(m.at[0], m.at[1], 300);
    const r = R(`hqLandMooring(HQ_LAND_RULES.water.moor.find(m => m.id === 'loch'))`);
    assert.ok(r && !r.none, `the loch's skiff has a mooring (${JSON.stringify(r)})`);
    assert.ok(Math.abs(r.y - loch(w16().ov).level) < 0.1, `it floats at the loch's level (${r.y})`);
    const SR = R('HQ_SEA_RULES.boat');
    assert.ok(R(`hqLandHullFloats(${r.x}, ${r.z}, ${r.yaw}, ${SR.len}, ${SR.beam}, ${SR.draft})`), 'the hull floats where it is moored');
    assert.ok(Math.hypot(r.shore[0] - r.x, r.shore[1] - r.z) <= SR.boardReach, 'the walker can board it from the shore');
    // across the loch: the middle floats at every heading
    const L = loch(w16().ov), cx = (L.a[0] + L.b[0]) / 2, cz = (L.a[1] + L.b[1]) / 2;
    for (let a = 0; a < 4; a++) assert.ok(R(`hqLandHullFloats(${cx}, ${cz}, ${a * Math.PI / 4}, ${SR.len}, ${SR.beam}, ${SR.draft})`), `the loch's middle floats (heading ${a})`);
    // a falls: never afloat on its face
    const F = R('hqLandFalls()').filter(f => f.drop >= 10);
    assert.ok(F.length, 'a tall falls');
    let tried = 0;
    for (const f of F) {
        const k = Math.floor(f.pts.length / 2), p = f.pts[k], q = f.pts[Math.min(f.pts.length - 1, k + 1)], o = f.pts[Math.max(0, k - 1)];
        load(p[0], p[1], 30);
        const yaw = Math.atan2(q[0] - o[0], q[1] - o[1]);
        assert.ok(!R(`hqLandHullFloats(${p[0]}, ${p[1]}, ${yaw}, ${SR.len}, ${SR.beam}, ${SR.draft})`), `the hull does not float on ${f.id}'s face`);
        tried++;
    }
    assert.ok(tried > 0);
});

test('the renderer and the swimmer read the water layer', () => {
    const tr = fs.readFileSync(path.join(__dirname, 'three-renderer.js'), 'utf8');
    assert.match(tr, /function _hqWaterYAt\(x, z\)[\s\S]{0,300}?hqLandWaterY\(x, z\)/, 'one read of the surface');
    assert.match(tr, /function _hqSeaDepthAt\(x, z\)[^\n]*_hqWaterYAt\(x, z\) - _hqSeaGroundAt\(x, z\)/, 'the depth under the swimmer');
    assert.match(tr, /function _hqHullFree\([\s\S]{0,600}?hqLandHullFloats\(x, z, V\.yaw/, 'the helm floats on the land\'s water');
    assert.match(tr, /V\.y = \(sea \? _hqWaterYAt\(V\.x, V\.z\)/, 'the hull rides the water under it');
    assert.match(tr, /var under = !!sea\.under \|\| camY < wyC;/, 'the look under the surface');
    assert.match(tr, /_hqLandWaterTick\(L, H, dt, now\)/, 'the land ticks its water');
    assert.match(tr, /_hqLandWaterMat\(L, 'far'\)/, 'the far sea wears the water');
    assert.match(tr, /hqLandWaterSheet\(t\)/, 'the rivers and lakes are drawn from the layer');
    assert.match(tr, /_hqVehicleRegister\(\{ key: 'skiff_' \+ r\.id \}, \{ vehicle: 'boat' \}/, 'the moored skiffs are vehicles');
    assert.match(tr, /var gone = hqLandPut\(rec\);[\s\S]{0,200}?_hqLandWaterDrop/, 'a dropped tile\'s water goes with it');
    assert.match(tr, /hqLandFalls\(\)/, 'the falls are drawn');
    // the look: the bucket's own water sheets (mondo 2026-09-28), never generated ones
    const sp = fs.readFileSync(path.join(__dirname, 'sprites.js'), 'utf8');
    const sb = loadGameData(), look = vm.runInContext('HQ_LAND_RULES.water.look', sb);
    assert.match(sp, new RegExp('\\n\\s+' + look.sheet + ':\\s+\\['), `${look.sheet} is a terrain sheet`);
    assert.ok(/waves_1\.png/.test(tr) && look.waves === 'waves_1', 'the battle\'s waves layer');
});

test('the full 2 m bake: every mooring floats a skiff', heavy, () => {
    const { R, load } = world(2);
    const moor = R('HQ_LAND_RULES.water.moor');
    for (const m of moor) {
        load(m.at[0], m.at[1], m.r + 60);
        const r = R(`hqLandMooring(HQ_LAND_RULES.water.moor.find(q => q.id === '${m.id}'))`);
        assert.ok(r && !r.none, `${m.id} has a mooring (${JSON.stringify(r)})`);
    }
});
