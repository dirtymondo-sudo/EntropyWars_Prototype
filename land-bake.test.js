// land-bake.test.js — THE BAKE (WORLD_GEOGRAPHY_PLAN.md §7 G0, 2026-09-28).
//
// Bakes data.js HQ_LAND at 8 m (about 15 s) and holds the plan's rules on it through bake-land.js checkRules — the
// same check the tool's exit code reads: R2 THE SIGHT RULE from every pad (plus mondo's named separations), R7 rivers
// downhill and lakes level with an outlet, R5 road grades (trails benched to 0.9), Route 1 a loop, every place on a
// route from HQ, R3 every face steeper than 1.0 drawn as a cliff. The full 2 m bake is the same check, `heavy`.
// Then the files: a tile and the sea decode back to the land, land.json carries what the ATLAS draws, and data.js
// carries a bake id so the game's urls resolve.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const vm = require('vm');
const { heavy } = require('./test-heavy.js');
const { bake, checkRules, writeOutputs, readRecipe } = require('./bake-land.js');

let B8 = null;
const baked8 = () => (B8 = B8 || bake({ cell: 8, quiet: true }));

test('the 8 m bake holds every rule (sight, water, grades, the ring, routes, cliffs)', () => {
    const B = baked8();
    const breaches = checkRules(B);
    assert.deepStrictEqual(breaches.map(b => `${b.rule}: ${b.msg}`), []);
});

test('the land is the plan\'s land: size, relief, the loch, the ring', () => {
    const { overlay: ov } = baked8();
    assert.ok(ov.stats.landKm2 > 6.5 && ov.stats.landKm2 < 7.7, `land ${ov.stats.landKm2} km²`);
    assert.ok(ov.stats.hmax > 280, `the top is ${ov.stats.hmax} m`);
    assert.ok(ov.stats.hmin < -120, `the Deep bottoms out at ${ov.stats.hmin} m`);
    const ring = ov.roads.find(r => r.id === 'ring');
    assert.ok(ring && ring.loop && ring.length > 5000, 'Route 1 is a loop over 5 km');
    const loch = ov.lakes.find(l => l.id === 'lochness');
    assert.ok(loch, 'Loch Ness is baked');
    for (const r of ov.roads) if (r.type === 'trail') assert.ok(r.maxGrade <= 0.9 + 1e-3, `${r.id} benched to 0.9 (${r.maxGrade})`);
    // the sight rule's showpieces (§0): HQ sees no other place's ground but the summits and lookouts
    const P = Object.fromEntries(ov.places.map(p => [p.id, p]));
    for (const e of ov.sight.hq) if (e[0] !== '^') assert.ok(P[e].peak || P[e].lookout || P[e].region === 'highlands', `HQ sees the ground of ${e}`);
    assert.ok(!ov.sight.strip.includes('area51') && !ov.sight.strip.includes('^area51'), 'the Strip never sees Area 51');
});

test('the files: a tile and the sea decode back to the land; land.json carries the atlas', () => {
    const B = baked8();
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ew-land-'));
    try {
        const { id, files } = writeOutputs(B, dir, { tiles: true, map: false });
        assert.match(id, /^[0-9a-f]{10}$/);
        assert.ok(files.tiles > 40, `${files.tiles} land tiles`);
        const ov = JSON.parse(fs.readFileSync(path.join(dir, 'land.json'), 'utf8'));
        assert.strictEqual(ov.bake.id, id);
        for (const k of ['places', 'roads', 'rivers', 'lakes', 'bridges', 'regions', 'coast', 'sight', 'reveals', 'stats', 'materials']) assert.ok(ov[k], `land.json has ${k}`);
        // HQ's tile: the height under the origin decodes to the land's
        const tf = ov.tileFormat, ti = Math.floor((0 + B.EXT) / tf.tile), tj = ti;
        const buf = fs.readFileSync(path.join(dir, 'tiles', `t_${ti}_${tj}.bin`));
        assert.strictEqual(buf.toString('ascii', 0, 4), 'EWLT');
        const S = buf.readUInt16LE(6), x0 = buf.readFloatLE(8), z0 = buf.readFloatLE(12), step = tf.tile / (S - 1);
        assert.strictEqual(buf.length, 16 + S * S * 6);
        const q = Math.round((0 - x0) / step), k = Math.round((0 - z0) / step);
        const y = buf.readUInt16LE(16 + (k * S + q) * 2) * tf.heightStep + tf.heightBase;
        assert.ok(Math.abs(y - B.sampleG(B.H, x0 + q * step, z0 + k * step)) < 0.02, `the tile's height ${y}`);
        const sea = fs.readFileSync(path.join(dir, 'sea.bin'));
        assert.strictEqual(sea.toString('ascii', 0, 4), 'EWLS');
    } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('data.js carries a bake id and the atlas reads the baked files by it', () => {
    const { R, sb } = readRecipe();
    assert.match(R.baked.id, /^[0-9a-f]{10}$/, 'npm run bake-land stamps HQ_LAND.baked.id');
    assert.match(sb.hqLandUrl('land.json'), /^https:\/\/cdn\.entropywars\.net\/Assets\/Land\/land\.json\?b=[0-9a-f]{10}$/);
    assert.strictEqual(vm.runInContext('typeof hqLandSightOk', sb), 'function');
    const map = fs.readFileSync(path.join(__dirname, 'map.js'), 'utf8');
    assert.match(map, /hqLandUrl\('land\.json'\)/, 'the ATLAS fetches land.json by the bake id');
    assert.match(map, /data-mapmode="atlas"/, 'the map has its ATLAS tab');
});

test('the full 2 m bake holds every rule', heavy, () => {
    const B = bake({ quiet: true });
    assert.deepStrictEqual(checkRules(B).map(b => `${b.rule}: ${b.msg}`), []);
});
