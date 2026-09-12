'use strict';
/* The host snapshot must never contain a cycle (2026-09-12: a unit object
   stored as target._lastDamageSource made state.units cyclic once two units
   traded blows; every _broadcastState JSON.stringify threw and both online
   players sat with no action menu). Guards the writer (ids only) and the
   cycle-safe stringifier that keeps the sync alive if a new cycle appears. */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const read = (f) => fs.readFileSync(path.join(__dirname, f), 'utf8');

test('kill credit is stored as a unit ID, never the unit object', () => {
    for (const f of ['battle.js', 'data.js', 'map.js', 'state.js', 'ai.js']) {
        const src = read(f);
        const bad = src.match(/\._lastDamageSource\s*=\s*(?!null)[^;]+;/g) || [];
        assert.deepStrictEqual(bad, [], f + ' stores a unit object as _lastDamageSource');
    }
    const battle = read('battle.js');
    assert.match(battle, /_lastDamageSourceId = sourceUnit\.id/);
    assert.match(battle, /unitFromId\(target\._lastDamageSourceId\)/, 'the killer fallback resolves the id');
});

function extractSafeStringify() {
    const src = read('online.js');
    const start = src.indexOf('var _safeStringifyWarned');
    const end = src.indexOf('window._ewSafeStringify = _ewSafeStringify;');
    assert.ok(start > 0 && end > start, '_ewSafeStringify present in online.js');
    const warned = [];
    const fn = new Function('console', src.slice(start, end) + '\nreturn _ewSafeStringify;');
    return { safe: fn({ warn: (m) => warned.push(m) }), warned };
}

test('_ewSafeStringify cuts true cycles, keeps shared references, warns once per key', () => {
    const { safe, warned } = extractSafeStringify();
    const a = { id: 'a', hp: 10 }, b = { id: 'b', hp: 20 };
    a._src = b; b._src = a;                       // the A↔B cycle
    const shared = { k: 1 };
    const state = { units: [a, b], x: shared, y: shared, round: 3 };
    const json = safe(state);
    const out = JSON.parse(json);
    assert.strictEqual(out.units[0].id, 'a');
    assert.strictEqual(out.units[0]._src.id, 'b');
    assert.strictEqual(out.units[0]._src._src, undefined, 'the back reference is cut');
    assert.strictEqual(out.units[1]._src.id, 'a', 'b keeps its (non-cyclic at that depth) reference');
    assert.deepStrictEqual(out.x, { k: 1 });
    assert.deepStrictEqual(out.y, { k: 1 }, 'shared non-ancestor objects survive');
    assert.strictEqual(out.round, 3);
    assert.ok(safe.dropped >= 1, 'drop count reported');
    assert.strictEqual(warned.length, 1, 'one warning per key');
    safe(state);
    assert.strictEqual(warned.length, 1, 'repeat calls stay quiet');
    safe({ plain: [1, 2, { z: 3 }] });
    assert.strictEqual(safe.dropped, 0, 'a clean object reports no drops');
});

test('_broadcastState and the recovery snapshot use the safe stringifier', () => {
    const src = read('online.js');
    assert.match(src, /var json = _ewSafeStringify\(s\);/);
    assert.match(src, /if \(_ewSafeStringify\.dropped\) s = JSON\.parse\(json\);/);
    assert.match(src, /state: JSON\.parse\(_ewSafeStringify\(snapshot\)\)/);
    assert.ok(!/var json = JSON\.stringify\(s\);/.test(src), 'no raw stringify left on the broadcast path');
});
