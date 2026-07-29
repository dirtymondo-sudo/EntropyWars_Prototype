// rng.test.js — seeded engine RNG (extraction stage 5) guards.
//
// state.js owns the mulberry32 PRNG behind every ENGINE-affecting roll
// (damage variance, crit/dodge/counter, status apply, AI tie-breaks,
// weather/sky, turn-order shuffles). These tests extract the pure step
// function `_ewRngNext` from state.js source (extractConst-style — state.js
// is a browser script, it can't be require()d) and pin down:
//   1. the algorithm (against an independent mulberry32 reference),
//   2. determinism (same seed => same stream),
//   3. the wiring invariants the whole feature depends on:
//      - both battle boot paths in battle.js seed the stream,
//      - online.js does NOT put rngSeed/rngState on the state-sync skip
//        list (the guest/replays must receive them).

'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const stateSrc = fs.readFileSync(path.join(__dirname, 'state.js'), 'utf8');
const battleSrc = fs.readFileSync(path.join(__dirname, 'battle.js'), 'utf8');
const onlineSrc = fs.readFileSync(path.join(__dirname, 'online.js'), 'utf8');
const mapSrc = fs.readFileSync(path.join(__dirname, 'map.js'), 'utf8');

// Extract `function _ewRngNext(s) { ... }` by balanced braces. The function
// is documented in state.js as pure + dependency-free precisely so this
// extraction stays trivial.
function extractEwRngNext(src) {
    const start = src.indexOf('function _ewRngNext(');
    assert.notStrictEqual(start, -1, 'state.js must define _ewRngNext');
    let i = src.indexOf('{', start), depth = 0;
    for (; i < src.length; i++) {
        if (src[i] === '{') depth++;
        else if (src[i] === '}' && --depth === 0) break;
    }
    // eslint-disable-next-line no-new-func
    return new Function('return ' + src.slice(start, i + 1))();
}

// Independent mulberry32 reference (textbook closure form) — catches an
// accidental constant/shift typo in the state.js step function.
function mulberry32Ref(seed) {
    let a = seed >>> 0;
    return function () {
        a = (a + 0x6D2B79F5) | 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

test('_ewRngNext matches the reference mulberry32 stream', () => {
    const next = extractEwRngNext(stateSrc);
    for (const seed of [0, 1, 0xDEADBEEF, 2147483647, 0x6D2B79F5]) {
        const ref = mulberry32Ref(seed);
        let s = seed >>> 0;
        for (let i = 0; i < 1000; i++) {
            const r = next(s);
            s = r.s;
            assert.strictEqual(r.v, ref(), `seed ${seed}, draw ${i}`);
        }
    }
});

test('same seed produces the same stream; values stay in [0,1)', () => {
    const next = extractEwRngNext(stateSrc);
    const draw = (seed, n) => {
        const out = [];
        let s = seed >>> 0;
        while (n--) { const r = next(s); s = r.s; out.push(r.v); }
        return out;
    };
    const a = draw(123456789, 500), b = draw(123456789, 500);
    assert.deepStrictEqual(a, b, 'identical seeds must replay identically');
    for (const v of a) assert.ok(v >= 0 && v < 1, `out of range: ${v}`);
    // And a different seed must actually diverge.
    assert.notDeepStrictEqual(draw(987654321, 500), a);
});

test('both battle boot paths seed the engine RNG', () => {
    // startMatch() (first match) and continueToNextMatch() (rematch) each
    // roll a fresh seed. If either loses its call, replays of that path
    // silently inherit the previous battle's stream position.
    const seeds = battleSrc.match(/seedEngineRng\(\(Math\.random\(\) \* 0x100000000\) >>> 0\)/g) || [];
    assert.ok(seeds.length >= 2,
        `expected the 2 battle boot paths to call seedEngineRng, found ${seeds.length}`);
});

// Extract a top-level `function NAME(...) { ... }` body by balanced braces.
// Same technique as extractEwRngNext, but returns the source text (these
// functions touch globals, so they can't be evaluated here).
function extractFnSource(src, name) {
    const start = src.indexOf('function ' + name + '(');
    assert.notStrictEqual(start, -1, `must define function ${name}`);
    let i = src.indexOf('{', start), depth = 0;
    for (; i < src.length; i++) {
        if (src[i] === '{') depth++;
        else if (src[i] === '}' && --depth === 0) break;
    }
    return src.slice(start, i + 1);
}

test('battle map-gen + objective placement stay on the seeded stream', () => {
    // Stage 5 map-gen conversion (2026-07-29 s4): these functions produce or
    // mutate MATCH STATE (board terrain, tower identity, respawn placement,
    // hourglass spawns), so a bare Math.random inside any of them would break
    // same-seed board reproduction. The map-editor `_me*` biome generator and
    // the cosmetic `randInt` helper are deliberately NOT listed — authoring
    // tools and VFX stay on Math.random by design (see state.js RNG comment).
    const mapFns = ['placeTowers', 'generateBelowTerrain', 'generateAboveTerrain',
        'initMap', 'generateHugeMap', 'generateTerrainBoard', 'processRespawns'];
    const battleFns = ['randomizeSharedObjectives', 'spawnPeriodicHourglasses'];
    for (const fn of mapFns) {
        assert.ok(!/Math\.random|[^.\w]randInt\(/.test(extractFnSource(mapSrc, fn)),
            `map.js ${fn} must use engineRng/engineRandInt, not Math.random/randInt`);
    }
    for (const fn of battleFns) {
        assert.ok(!/Math\.random|[^.\w]randInt\(/.test(extractFnSource(battleSrc, fn)),
            `battle.js ${fn} must use engineRng/engineRandInt, not Math.random/randInt`);
    }
});

test('rngSeed/rngState ride state-sync (not on the online.js skip list)', () => {
    // _serializeState's skip object is the one place a plain state scalar
    // can be silently withheld from guests/replays. The seed fields must
    // never land there — the guest and replay player need the stream.
    const start = onlineSrc.indexOf('function _serializeState(');
    assert.notStrictEqual(start, -1, 'online.js must define _serializeState');
    const skipStart = onlineSrc.indexOf('var skip = {', start);
    const skipEnd = onlineSrc.indexOf('};', skipStart);
    const skipBlock = onlineSrc.slice(skipStart, skipEnd);
    assert.ok(!/\brngSeed\b/.test(skipBlock), 'rngSeed must not be skip-listed');
    assert.ok(!/\brngState\b/.test(skipBlock), 'rngState must not be skip-listed');
});
