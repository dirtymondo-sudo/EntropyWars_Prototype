// land-forest.test.js — THE TREES AND THE GRASS (WORLD_GEOGRAPHY_PLAN.md §7 G4, 2026-09-28).
//
// Bakes the land at 16 m into a temp folder (as land-water.test.js does), files the tiles through data.js's readers and holds
// THE FLORA to its promises: a tile's trees are a pure function of the tile (the same whatever else has landed, step by step
// or at once), they grow only where the windows let them (never on a road, in water, on a pad or up a cliff), no two trunks
// stand nearer than minSp (the forest is walkable between them), every trunk and rock is a blocker at no more than its drawn
// radius (R3), and every model is one the game already ships (mondo 2026-09-28: no new art). Then the wiring: the renderer
// instances the models, files the blockers, and drops a tile's trees with it.
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
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ew-land-g4-'));
    writeOutputs(B, dir, { tiles: true, map: false });
    return { B, dir, ov: JSON.parse(fs.readFileSync(path.join(dir, 'land.json'), 'utf8')) };
}
function store(W) {
    const sb = loadGameData();
    const R = src => vm.runInContext(src, sb);
    sb.__ov = W.ov; R('hqLandIndex(__ov)');
    sb.__b = fs.readFileSync(path.join(W.dir, 'sea.bin')); R('hqLandWorldRead(__b)');
    R('HQ_LAND_RULES.tiles.cap = 1e6');
    const put = (ti, tj) => { const f = path.join(W.dir, `tiles/t_${ti}_${tj}.bin`); if (!fs.existsSync(f)) return false; sb.__t = fs.readFileSync(f); R('hqLandPut(hqLandTileRead(__t))'); return true; };
    return { sb, R, put };
}
let W16 = null;
const w16 = () => W16 || (W16 = world(16));
/* the baked tile with the most forest (its trees are the test's) */
function forestTile(W) {
    let best = null;
    for (const t of W.ov.tiles) {
        const buf = fs.readFileSync(path.join(W.dir, `tiles/t_${t[0]}_${t[1]}.bin`)), S = buf.readUInt16LE(6), S2 = S * S;
        let f = 0; for (let o = 0; o < S2; o++) f += buf[16 + S2 * 3 + o];
        if (!best || f > best.f) best = { ti: t[0], tj: t[1], f };
    }
    return best;
}
const around = (ti, tj) => { const o = []; for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) o.push([ti + di, tj + dj]); return o; };
const flora = (R, ti, tj) => R(`(() => { const f = hqLandFlora(HQ_LAND_STORE.grid[${tj} * HQ_LAND_STORE.per + ${ti}]); return { trees: Array.from(f.trees), under: Array.from(f.under), rocks: Array.from(f.rocks), nT: f.nT }; })()`);

test('a tile\'s flora is a pure function of the tile: the same alone or with its neighbours, step by step or at once', () => {
    const W = w16(), T = forestTile(W);
    const A = store(W); A.put(T.ti, T.tj);
    const alone = flora(A.R, T.ti, T.tj);
    assert.ok(alone.nT > 50, `the forest tile grows trees (${alone.nT})`);
    const B = store(W); for (const [a, b] of around(T.ti, T.tj).reverse()) B.put(a, b);
    B.R(`(() => { const t = HQ_LAND_STORE.grid[${T.tj} * HQ_LAND_STORE.per + ${T.ti}]; let n = 0; while (!hqLandFloraStep(t, 1)) n++; return n; })()`);
    const stepped = flora(B.R, T.ti, T.tj);
    assert.deepStrictEqual(stepped.trees, alone.trees, 'the same trees in the same order');
    assert.deepStrictEqual(stepped.under, alone.under, 'the same ferns');
    assert.deepStrictEqual(stepped.rocks, alone.rocks, 'the same rocks');
});

test('the trees grow only where the windows let them, never nearer than minSp: the forest is walkable between the trunks', () => {
    const W = w16(), T = forestTile(W), { R, put } = store(W);
    for (const [a, b] of around(T.ti, T.tj)) put(a, b);
    const F = R('HQ_LAND_RULES.flora'), mats = W.ov.materials, body = 0.34;
    const res = R(`(() => { const F = HQ_LAND_RULES.flora, St = HQ_LAND_STORE, out = { bad: [], near: 1e9, n: 0, kinds: {} }, all = [];
        for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { const t = St.grid[(${T.tj} + dj) * St.per + ${T.ti} + di]; if (!t) continue;
            const f = hqLandFlora(t); for (let k = 0; k < f.trees.length; k += 6) all.push([f.trees[k], f.trees[k + 1], f.trees[k + 3]]); }
        const tab = _hqFloraTab();
        for (const [x, z, kind] of all) { const m = hqLandMaterial(x, z); out.n++; out.kinds[F.kinds[kind].id] = 1;
            if (!tab.forest[m] && !tab.lone[m]) out.bad.push(['material', x, z, St.index.materials[m]]);
            if (hqLandHQSolid(x, z, 2)) out.bad.push(['hq', x, z]); }
        for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) { const d = Math.hypot(all[i][0] - all[j][0], all[i][1] - all[j][1]); if (d < out.near) out.near = d; }
        return out; })()`);
    assert.ok(res.n > 100, `${res.n} trees round the forest tile`);
    assert.strictEqual(res.bad.length, 0, `every tree on the forest or a lone tree's ground ${JSON.stringify(res.bad.slice(0, 4))}`);
    assert.ok(res.near >= F.trees.minSp - 1e-6, `no two trunks nearer than minSp (${res.near.toFixed(2)})`);
    const maxR = Math.max(...F.kinds.map(k => k.r));
    assert.ok(F.trees.minSp - 2 * maxR > 2 * body + 0.3, 'a body passes between any two trunks');
    assert.ok(Object.keys(res.kinds).length >= 2, `a stand mixes its kinds (${Object.keys(res.kinds)})`);
    // no tree on a road, a trail, a street, a river or a lake (the recipe's clear materials), nor on a place's pad
    const road = R(`(() => { const St = HQ_LAND_STORE, bad = []; const clear = new Set(['road', 'trail', 'urban', 'river', 'lake', 'deep', 'shallow']);
        for (const t of St.grid) { if (!t) continue; const f = hqLandFlora(t);
            for (let k = 0; k < f.trees.length; k += 6) { const x = f.trees[k], z = f.trees[k + 1], m = St.index.materials[hqLandMaterial(x, z)];
                if (clear.has(m)) bad.push([x, z, m]);
                for (const p of St.pads) if (Math.hypot(x - p[0], z - p[1]) < p[2]) bad.push([x, z, 'pad']); } }
        return bad; })()`);
    assert.strictEqual(road.length, 0, `no tree in a road, water or on a pad ${JSON.stringify(road.slice(0, 4))}`);
    assert.ok(mats.includes('forest'), 'the bake carries the forest material');
});

test('R3: every trunk and rock is a blocker at no more than its drawn radius; nothing else blocks', () => {
    const W = w16(), T = forestTile(W), { R, put } = store(W);
    for (const [a, b] of around(T.ti, T.tj)) put(a, b);
    const r = R(`(() => { const F = HQ_LAND_RULES.flora, St = HQ_LAND_STORE, t = St.grid[${T.tj} * St.per + ${T.ti}], f = hqLandFlora(t), out = { miss: 0, wide: 0, n: 0, free: 0, wrong: 0 };
        for (let k = 0; k < f.trees.length; k += 6) { const x = f.trees[k], z = f.trees[k + 1], b = hqLandFloraHit(x, z, 0); out.n++;
            if (!b || b.kind !== 'tree') out.miss++;
            else if (b.rad > F.kinds[f.trees[k + 3]].r + 1e-9) out.wide++; }
        for (let k = 0; k < f.rocks.length; k += 6) { const b = hqLandFloraHit(f.rocks[k], f.rocks[k + 1], 0); if (!b || b.kind !== 'rock') out.miss++; if (b && b.rad > f.rocks[k + 4] * 0.5) out.wide++; }
        /* every refusal has a trunk or a rock within its radius + 0.45 m (a sweep over the tile) */
        for (let z = t.z0 + 1; z < t.z0 + 256; z += 1.7) for (let x = t.x0 + 1; x < t.x0 + 256; x += 1.7) { const b = hqLandFloraHit(x, z, 0.34); if (!b) { out.free++; continue; } if (Math.hypot(b.x - x, b.z - z) > b.rad + 0.34 + 0.45) out.wrong++; }
        return out; })()`);
    assert.ok(r.n > 50, `${r.n} trunks checked`);
    assert.strictEqual(r.miss, 0, 'a blocker under every trunk and rock');
    assert.strictEqual(r.wide, 0, 'no blocker wider than the rule\'s bark');
    assert.strictEqual(r.wrong, 0, 'every refusal is a drawn trunk or rock');
    assert.ok(r.free > 1000, 'the forest floor is open between the trunks');
    // the measured bark narrows the blocker (the renderer writes rM); it never widens it
    const k = R(`(() => { const K = HQ_LAND_RULES.flora.kinds[0]; const a = hqLandTrunkR(0, 10); K.rM = 0.01; const b = hqLandTrunkR(0, 10); K.rM = 0.2; const c = hqLandTrunkR(0, 10); delete K.rM; return [a, b, c, K.r]; })()`);
    assert.strictEqual(k[0], k[3], 'the rule\'s radius before the model is measured');
    assert.ok(k[1] < k[0], 'a thinner trunk drawn → a thinner blocker');
    assert.strictEqual(k[2], k[3], 'a thicker trunk drawn never widens it past the rule');
});

test('the stands: a named forest grows its own mix, the desert its pines, the north its firs, the ritual woods their dead', () => {
    const { R } = store(w16());
    assert.strictEqual(R('hqLandFloraMix(-400, -640, 60, false)'), 'fairy', 'the fairy forest');
    assert.strictEqual(R('hqLandFloraMix(1060, -560, 40, false)'), 'redwood', 'the redwood coast');
    assert.strictEqual(R('hqLandFloraMix(920, 900, 40, false)'), 'pine', 'the pine barrens');
    assert.strictEqual(R('hqLandFloraMix(690, 760, 120, false)'), 'dry', 'Hill 1\'s desert pines');
    assert.strictEqual(R('hqLandFloraMix(-1130, -330, 30, false)'), 'haunt', 'the ritual woods');
    assert.strictEqual(R('hqLandFloraMix(0, -1100, 40, false)'), 'north', 'the north');
    const kinds = R('HQ_LAND_RULES.flora.kinds.map(k => k.id)');
    for (const [id, mix] of Object.entries(R('HQ_LAND_RULES.flora.mixes'))) for (const e of mix) assert.ok(kinds.includes(e[0]), `${id}: ${e[0]} is a kind`);
});

test('the grass grows on the grass materials only, the same every time', () => {
    const W = w16(), T = forestTile(W), { R, put } = store(W);
    for (const [a, b] of around(T.ti, T.tj)) put(a, b);
    const r = R(`(() => { const St = HQ_LAND_STORE, G = HQ_LAND_RULES.flora.grass, t = St.grid[${T.tj} * St.per + ${T.ti}], n = 48, out = { n: 0, bad: 0, same: true };
        const mk = () => ({ h: new Float32Array(n * n), d: new Uint8Array(n * n), m: new Uint8Array(n * n) });
        const ix0 = Math.ceil(t.x0 / G.step) + 1, iz0 = Math.ceil(t.z0 / G.step) + 1, A = mk(), B = mk();
        if (!hqLandGrassField(A, n, ix0, iz0, n, n) || !hqLandGrassField(B, n, ix0, iz0, n, n)) return null;
        for (let o = 0; o < n * n; o++) { if (A.d[o] !== B.d[o] || A.h[o] !== B.h[o]) out.same = false;
            if (A.d[o] > 0) { out.n++; if (!(G.mats[St.index.materials[A.m[o]]] > 0)) out.bad++; } }
        return out; })()`);
    assert.ok(r, 'the field fills once the tiles have landed');
    assert.ok(r.same, 'deterministic');
    assert.strictEqual(r.bad, 0, 'only on the grass materials');
    assert.ok(r.n > 50, `${r.n} grass texels in the forest tile's corner`);
});

test('every model is one the game already ships (no new art), and the renderer instances them', () => {
    const tr = fs.readFileSync(path.join(__dirname, 'three-renderer.js'), 'utf8');
    const sb = loadGameData(), F = vm.runInContext('HQ_LAND_RULES.flora', sb), cat = vm.runInContext('DOOR_HQ.catalogue', sb);
    const misc = (tr.match(/var _MISC_GLB = \{[\s\S]*?\n    \};/) || [''])[0];
    const srcs = F.kinds.map(k => k.src).concat(F.under.kinds.map(k => k.src), F.rocks.kinds.map(k => k.src));
    for (const s of srcs) {
        const [kind, name] = s.split(':');
        if (kind === 'foliage') assert.match(tr, new RegExp(`_FOLIAGE_MODEL_FOR_KEY = \\{[\\s\\S]*?'${name}'`), `${name} is the board's foliage OBJ`);
        else if (kind === 'misc') assert.match(misc, new RegExp(`\\n\\s+${name}:\\s+'Meshy_AI_`), `${name} is in _MISC_GLB`);
        else if (kind === 'door') assert.ok(cat[name] && cat[name].file, `${name} is a D.O.O.R. kit model`);
        else assert.fail(`unknown source ${s}`);
    }
    assert.match(tr, /_getFoliagePixelTex\(GRASS\.texture, 1\)/, 'the grass wears the board\'s grass_2 blades');
    // the wiring: instanced parts, the wind knows the instance, the blockers, the tick, the tile's drop, the far pass
    assert.match(tr, /new THREE\.InstancedMesh\(p\.geo, p\.mats, cap\)/, 'one InstancedMesh per model part');
    assert.match(tr, /#ifdef USE_INSTANCING\\n vec4 ewo = modelMatrix \* instanceMatrix/, 'the wind\'s phase from each instance');
    assert.match(tr, /hqLandFloraNear\(px, pz, F\.blockers\.r\)[\s\S]{0,900}?landFlora: true/, 'the trunks and rocks are the room\'s blockers');
    assert.match(tr, /_hqLandFloraTick\(L, H, now\)/, 'the land ticks its flora');
    assert.match(tr, /_hqFloraDropTile\(L, gone\[g\]\[0\] \+ '_' \+ gone\[g\]\[1\]\)/, 'a dropped tile\'s trees go with it');
    assert.match(tr, /hqLandFarForest\(\)/, 'the far pass draws the far forest');
    assert.match(tr, /EW_NO_LAND_FLORA/, 'the kill-switch');
    assert.ok(!/Assets\/(?:Flora|Trees)\//.test(tr), 'no new asset folder');
});

test('the full 2 m bake: the forests hold their tens of thousands of trees', heavy, () => {
    const W = world(2), { R, put } = store(W);
    for (const t of W.ov.tiles) put(t[0], t[1]);
    const n = R('(() => { let n = 0; for (const t of HQ_LAND_STORE.grid) if (t) n += hqLandFlora(t).nT; return n; })()');
    assert.ok(n > 15000 && n < 60000, `${n} trees on the land`);
});
