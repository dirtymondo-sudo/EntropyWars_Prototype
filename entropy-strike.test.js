'use strict';
/* ⚛ ENTROPY STRIKE — THE SIX APOCALYPSES (2026-09-07)
   Guards the data.js catalogue the typed team attack is built on: one
   entry per TYPE_CHART type, catalogue order = exactly the six chart
   types, every entry carries the fields the banner (styles-cinematic.css
   .ews-t-<id>), the HUD picker (hud.js _hrlgEntropyBlades) and the
   directors (battle.js _EWS_DIRECTORS) read. Also checks each director
   / banner theme / insert kind referenced by battle.js actually exists,
   by source text — the engine files are browser-only. */
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { loadGameData, REPO_ROOT } = require('./load-data');

const D = loadGameData();
const read = (f) => fs.readFileSync(path.join(REPO_ROOT, f), 'utf8');

test('ENTROPY_STRIKE_TYPE_ORDER is exactly the six TYPE_CHART types', () => {
    assert.ok(Array.isArray(D.ENTROPY_STRIKE_TYPE_ORDER), 'ENTROPY_STRIKE_TYPE_ORDER missing');
    const chart = Object.keys(D.TYPE_CHART).sort();
    const order = [...D.ENTROPY_STRIKE_TYPE_ORDER].sort();
    assert.deepStrictEqual(order, chart);
    assert.strictEqual(new Set(D.ENTROPY_STRIKE_TYPE_ORDER).size, D.ENTROPY_STRIKE_TYPE_ORDER.length, 'duplicate type in order');
});

test('every apocalypse carries the fields the banner / picker / directors read', () => {
    const problems = [];
    for (const id of D.ENTROPY_STRIKE_TYPE_ORDER) {
        const def = D.ENTROPY_STRIKE_TYPES[id];
        if (!def) { problems.push(`${id}: no ENTROPY_STRIKE_TYPES entry`); continue; }
        if (def.id !== id) problems.push(`${id}: id field is '${def.id}'`);
        for (const k of ['name', 'glyph', 'color', 'accent', 'tagline', 'desc']) {
            if (typeof def[k] !== 'string' || !def[k].trim()) problems.push(`${id}: missing ${k}`);
        }
        if (typeof def.hex !== 'number') problems.push(`${id}: hex must be a number`);
        if (def.color && !/^#[0-9a-f]{6}$/i.test(def.color)) problems.push(`${id}: color '${def.color}' is not #rrggbb`);
        if (def.accent && !/^#[0-9a-f]{6}$/i.test(def.accent)) problems.push(`${id}: accent '${def.accent}' is not #rrggbb`);
    }
    for (const id of Object.keys(D.ENTROPY_STRIKE_TYPES)) {
        if (!D.ENTROPY_STRIKE_TYPE_ORDER.includes(id)) problems.push(`${id}: in ENTROPY_STRIKE_TYPES but not in ENTROPY_STRIKE_TYPE_ORDER`);
    }
    assert.deepStrictEqual(problems, []);
});

test('battle.js has a director and styles-cinematic.css a banner theme per apocalypse', () => {
    const battle = read('battle.js');
    const css = read('styles-cinematic.css');
    const problems = [];
    for (const id of D.ENTROPY_STRIKE_TYPE_ORDER) {
        if (!new RegExp(`^\\s+${id}: \\{\\s*$`, 'm').test(battle.slice(battle.indexOf('const _EWS_DIRECTORS = {'))))
            problems.push(`battle.js _EWS_DIRECTORS has no '${id}' director`);
        if (!css.includes(`.ews-t-${id} `)) problems.push(`styles-cinematic.css has no .ews-t-${id} banner theme`);
    }
    // every hook the skeleton calls exists on every director
    const dirSrc = battle.slice(battle.indexOf('const _EWS_DIRECTORS = {'), battle.indexOf('window._EWS_DIRECTORS = _EWS_DIRECTORS;'));
    for (const id of D.ENTROPY_STRIKE_TYPE_ORDER) {
        const start = dirSrc.search(new RegExp(`^\\s+${id}: \\{\\s*$`, 'm'));
        const rest = dirSrc.slice(start);
        const next = rest.slice(1).search(/^ {12}[a-z]+: \{\s*$/m);
        const body = next > 0 ? rest.slice(0, next + 1) : rest;
        for (const hook of ['chargeMs', 'staggerMs', 'resolveMs', 'siren(', 'pane(', 'world(', 'strike(', 'resolve(']) {
            if (!body.includes(hook)) problems.push(`director '${id}' lacks ${hook}`);
        }
    }
    // every insert-card kind the directors use has CSS
    const kinds = new Set([...dirSrc.matchAll(/c\.insert\([^)]*?,\s*'([a-z]+)'/g)].map(m => m[1]));
    for (const k of kinds) if (!css.includes(`.cine-insert.k-${k} `)) problems.push(`insert kind '${k}' has no .cine-insert.k-${k} CSS`);
    assert.deepStrictEqual(problems, []);
});
