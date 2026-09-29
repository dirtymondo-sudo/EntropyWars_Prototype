// land-stream.test.js — THE LAND UNDERFOOT (WORLD_GEOGRAPHY_PLAN.md §7 G2, 2026-09-28).
//
// Bakes the land at 16 m into a temp folder (a few seconds; the game's tiles are the 2 m bake's, the sampler reads any
// spacing), files it through data.js's own readers (hqLandIndex / hqLandWorldRead / hqLandTileRead / hqLandPut) and
// holds THE SAMPLER to its promises: the tiles are asked for nearest first, the store drops the least recently touched
// and never the walker's, the ground is one continuous surface across tile edges, the chunk's grid read is the point
// read, the walker is refused only where a cliff is drawn (R3), HQ's pad is flat under its door. Then the wiring: the
// front door opens onto the land, the land room's door stands on the baked pad, the renderer's hooks are in place, the
// bake stamps HQ's pad, the ground wears the bucket's own terrain / urban sheets.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const vm = require('vm');
const { loadGameData } = require('./load-data.js');
const { bake, writeOutputs, stampData } = require('./bake-land.js');

let W = null;
function world() {
    if (W) return W;
    const B = bake({ cell: 16, quiet: true });
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ew-land-g2-'));
    writeOutputs(B, dir, { tiles: true, map: false });
    const sb = loadGameData();
    const R = src => vm.runInContext(src, sb);
    sb.__ov = JSON.parse(fs.readFileSync(path.join(dir, 'land.json'), 'utf8'));
    R('hqLandIndex(__ov)');
    sb.__b = fs.readFileSync(path.join(dir, 'sea.bin'));
    R('hqLandWorldRead(__b)');
    const load = (x, z, r) => { for (const w of R(`hqLandWant(${x}, ${z}, ${r})`)) { sb.__t = fs.readFileSync(path.join(dir, w.name)); R('hqLandPut(hqLandTileRead(__t))'); } };
    W = { B, dir, sb, R, load, ov: sb.__ov };
    return W;
}

test('the stream: tiles are asked for nearest first, and only the ones not in', () => {
    const { R, load } = world();
    const want = R('hqLandWant(0, 20, 420)');
    assert.ok(want.length >= 9, `${want.length} tiles round HQ`);
    for (let i = 1; i < want.length; i++) assert.ok(want[i].d >= want[i - 1].d, 'nearest first');
    assert.strictEqual(want[0].d, 0, 'the tile under the walker first');
    assert.match(want[0].name, /^tiles\/t_\d+_\d+\.bin$/);
    load(0, 20, 420);
    assert.strictEqual(R('hqLandWant(0, 20, 420)').length, 0, 'nothing asked for twice');
    assert.ok(R('hqLandReadyAt(0, 26)'), 'the ground at the door is in');
});

test('the store: past the cap the least recently touched tiles go, never the walker\'s', () => {
    const { R, sb, dir } = world();
    const cap = R('HQ_LAND_RULES.tiles.cap');
    R('HQ_LAND_RULES.tiles.cap = 12');
    try {
        R('hqLandTouch(0, 20, 300)');
        const far = R('hqLandWant(1600, -1200, 900)').slice(0, 10);
        let dropped = [];
        for (const w of far) { sb.__t = fs.readFileSync(path.join(dir, w.name)); dropped = dropped.concat(R('hqLandPut(hqLandTileRead(__t))')); R('hqLandTouch(0, 20, 300)'); }
        assert.ok(R('HQ_LAND_STORE.n') <= 12, 'the cap holds');
        assert.ok(dropped.length > 0, 'tiles were dropped');
        assert.ok(R('hqLandReadyAt(0, 26)'), 'the walker\'s tile stayed');
    } finally { R(`HQ_LAND_RULES.tiles.cap = ${cap}`); world().load(0, 20, 420); }
});

test('the ground is one surface: continuous across tile edges, the chunk\'s grid is the point read', () => {
    const { R } = world();
    const edge = R('-HQ_LAND_STORE.ext + 11 * HQ_LAND_STORE.tile');   // the seam between tile 10 and 11
    for (let z = -60; z <= 60; z += 7.3) {
        const a = R(`hqLandHeight(${edge} - 1e-6, ${z})`), b = R(`hqLandHeight(${edge} + 1e-6, ${z})`);
        assert.ok(Math.abs(a - b) < 1e-3, `no step at the tile edge (z ${z}: ${a} vs ${b})`);
    }
    const g = R('hqLandGrid(-40.5, -30.25, 1, 21, 21)');
    for (let b = 0; b < 21; b += 4) for (let a = 0; a < 21; a += 5) {
        const p = R(`hqLandHeight(${-40.5 + a}, ${-30.25 + b})`);
        assert.ok(Math.abs(p - g.h[b * 21 + a]) < 1e-3, 'the grid is the point read');
    }
    const g4 = R('hqLandGrid(-40, -30, 4, 6, 6)');
    for (let k = 0; k < 36; k++) assert.ok(Math.abs(g4.base[k] - R(`hqLandBase(${-40 + (k % 6) * 4}, ${-30 + Math.floor(k / 6) * 4})`)) < 1e-3, 'a far chunk stands on the baked ground');
});

test('R3: the walker is refused only where a cliff is drawn', () => {
    const { R } = world();
    /* the test's bake is 16 m (smooth): a scarp is cut into one loaded tile (a rise of 1.6 over two samples), then the ring is
       swept in the sandbox (one call: the vm's globals are slow to reach from here); the tile is filed again after */
    const { sb, dir } = world();
    const [ti, tj] = R('hqLandTileOf(-300, 300)');
    R(`(function () { const t = HQ_LAND_STORE.grid[${tj} * HQ_LAND_STORE.per + ${ti}], S = t.S, st = HQ_LAND_STORE.step;
        for (let k = 0; k < S; k++) for (let q = 0; q < S; q++) t.h[k * S + q] += Math.min(2, Math.max(0, q - 6)) * st * 1.6; })()`);
    try {
        const r = R(`(function () { let refused = 0, bad = []; for (let z = -400; z <= 400; z += 2.7) for (let x = -400; x <= 400; x += 2.9) {
            if (hqLandFeet(x, z) !== null) continue; refused++; if (hqLandCliff(x, z) < 0.999) bad.push([x, z]); } return { refused, bad: bad.slice(0, 5) }; })()`);
        assert.strictEqual(JSON.stringify(r.bad), '[]', 'every refused face is drawn as cliff');
        assert.ok(r.refused > 0, 'the scarp is too steep to climb');
    } finally { sb.__t = fs.readFileSync(path.join(dir, R(`hqLandTileName(${ti}, ${tj})`))); R('hqLandPut(hqLandTileRead(__t))'); }
    assert.ok(R('HQ_LAND_RULES.cliff.to') < R('HQ_LAND_RULES.walk.maxSlope'), 'the cliff sheet is full before the walker is refused');
});

test('HQ\'s pad is flat under its door and the building is solid', () => {
    const { R, ov } = world();
    const hq = ov.places.find(p => p.id === 'hq');
    const door = R('DOOR_HQ.rooms.land.doors.find(d => d.id === "hq")');
    for (const [x, z] of [[0, 24.8], [3, 26], [-4, 30], [0, 40]]) {
        const f = R(`hqLandFeet(${x}, ${z})`);
        /* the fixture bakes at 16 m: (0, 40) reads between a pad cell and the eased ring beyond it (G7: 0.15 m off on a 16 m bake; the
           real 2 m bake stands the whole pad at one height) */
        assert.ok(f !== null && Math.abs(f - hq.y) < 0.2, `the pad at ${x}, ${z} is at the bake's HQ height (${f} vs ${hq.y})`);
    }
    assert.ok(R('hqLandHQSolid(0, 10, 0)') && !R(`hqLandHQSolid(0, ${door.z + 2.4}, 0.42)`), 'the drum is solid, the landing in front of the door is not');
    assert.ok(door.z > R('HQ_LAND_RULES.hq.r'), 'the door stands on the drum\'s face');
});

test('the wiring: the front door opens onto the land; the land room stands on the baked pad', () => {
    const sb = loadGameData();
    const R = src => vm.runInContext(src, sb);
    const street = R('DOOR_HQ.rooms.foyer.doors.find(d => d.id === "street")');
    assert.deepStrictEqual({ room: street.action.room, at: street.action.at }, { room: 'land', at: 'hq' });
    const L = R('DOOR_HQ.rooms.land');
    assert.ok(L.land === true && L.kind === 'box' && L.shell.open && L.shell.sky, 'an open box room flagged land');
    const d = L.doors.find(x => x.id === 'hq');
    assert.ok(d.wall === 'free' && d.action.room === 'foyer' && d.action.at === 'street', 'the way back in');
    assert.strictEqual(d.y, R('HQ_LAND.baked.hubY'), 'the door stands on the baked pad');
    assert.strictEqual(R('hqRoomClock("land").zone'), 'land', 'the land runs on the one clock');
    const T = R('HQ_LAND_RULES');
    for (const m of R('Object.keys(HQ_LAND_RULES.mats)')) assert.ok(T.tex.layers.some(l => l.id === T.mats[m][0]), `${m}'s sheet exists`);
    for (let i = 1; i < T.lods.length; i++) assert.ok(T.lods[i].step > T.lods[i - 1].step && T.lods[i].to > T.lods[i - 1].to, 'the levels coarsen outward');
    assert.ok(T.camFar > T.lods[T.lods.length - 1].to, 'the near camera reaches past the last chunk');
});

test('the renderer: the land arms, the walker / air / camera / sea read it, the far pass is layered', () => {
    const tr = fs.readFileSync(path.join(__dirname, 'three-renderer.js'), 'utf8');
    assert.match(tr, /if \(room\.land\) \{ try \{ _hqLandArm\(room\); \}/, '_hqEnter arms the land');
    assert.match(tr, /if \(_hq\.land\) \{ var lf = _hqLandFeetAt\(x, z, curY\); if \(lf === null\) return null; y = lf; \}/, 'the walker\'s surface');
    assert.match(tr, /if \(_hq\.land && !_hqLandAirOK\(x, z, y\)\) return false;/, 'the air');
    assert.match(tr, /if \(_hq\.land\) return _hqLandCamBlocked\(px, pz, py\);/, 'the camera boom');
    assert.match(tr, /_hq\.land && _hq\.land\.sea/, 'the land\'s sea is the swimmer\'s');
    assert.match(tr, /_hqLandTick\(H, dt, now\)/, 'the frame ticks the land');
    assert.match(tr, /H\.landZ\.readyNear/, 'the card waits for the ground round the door');
    assert.match(tr, /land\.renderOrder = -900[\s\S]{0,1400}?sea\.renderOrder = -899[\s\S]{0,1400}?clr\.renderOrder = -850[\s\S]{0,200}?clearDepth\(\)/, 'far land, far sea, then the depth cleared');
    assert.match(tr, /try \{ _hqLandDisarm\(H\); \} catch \(e\) \{\}/, '_hqLeave lets the land go');
    assert.match(tr, /if \(room\.land\) return;   \/\/ G2: THE LAND has no shell/, 'no box shell on the land');
});

test('the bake stamps HQ\'s pad; the ground wears the bucket\'s own terrain / urban sheets', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ew-land-stamp-'));
    const src = fs.readFileSync(path.join(__dirname, 'data.js'), 'utf8'), tmp = path.join(dir, 'data.js');
    fs.writeFileSync(tmp, src);
    stampData('abcdef0123', tmp, { hubY: 91.25 });
    const line = fs.readFileSync(tmp, 'utf8').split('\n').find(l => /R\.baked = \{/.test(l));
    assert.match(line, /id: 'abcdef0123'/); assert.match(line, /hubY: 91\.25/);
    assert.ok(!fs.existsSync(path.join(__dirname, 'bake-land.js')) || !/makeSheets/.test(fs.readFileSync(path.join(__dirname, 'bake-land.js'), 'utf8')), 'the bake generates no sheets');
    // every layer names a sheet sprites.js already ships (mondo 2026-09-28: use the terrain and urban textures in the bucket)
    const sp = fs.readFileSync(path.join(__dirname, 'sprites.js'), 'utf8');
    const terrain = sp.slice(sp.indexOf('const TERRAIN_SPRITES = {'), sp.indexOf('const TERRAIN_BASE_TINT'));
    const urban = sp.slice(sp.indexOf('const URBAN_TEX_FAMILIES = {'), sp.indexOf('const URBAN_TEXTURES = {}'));
    const sb = loadGameData();
    const layers = vm.runInContext('HQ_LAND_RULES.tex.layers', sb);
    for (const l of layers) {
        assert.ok(typeof l.src === 'string' && l.src, `${l.id} names a sheet`);
        if (l.src.startsWith('urban:')) assert.ok(urban.includes(`'${l.src.slice(6)}'`), `${l.id}: ${l.src} is in the urban pack`);
        else assert.match(terrain, new RegExp('\\n\\s+' + l.src + ':\\s+\\['), `${l.id}: ${l.src} is a terrain sheet`);
    }
    const tr = fs.readFileSync(path.join(__dirname, 'three-renderer.js'), 'utf8');
    assert.match(tr, /function _hqLandSheetUrl\(src\)[\s\S]{0,500}?URBAN_TEXTURES[\s\S]{0,300}?TERRAIN_SPRITES[\s\S]{0,200}?_ewCorsBust/, 'the renderer reads the sheets from sprites.js, CORS-busted');
    assert.doesNotMatch(tr, /baked\.base \+ \(T\.dir/, 'no generated sheets are fetched');
});
