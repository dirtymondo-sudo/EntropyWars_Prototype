// area-content.test.js — THE CONTENT RULES (AREA_CONTENT_PLAN.md §3 — 2026-09-19, D1): R1–R8 held as
// WARNINGS by check-area-content.js's audit — a printed list per rule, never a red, until D3 brings
// the twenty areas up to them (the user's decision §6.4); R9 (the teaching rooms) is hard from D1.
// The audit compiles every explorable room, so it is a heavy proof (`npm run test:full` / CI); the
// light test guards the tool's shape, the rules' numbers and R9.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { heavy } = require('./test-heavy.js');
const { loadGameData } = require('./load-data');
const A = require('./check-area-content.js');

test('THE TOOL: the audit is a module with the rules\' numbers (the cave\'s: 0.6 climbs / 100 m² open, a 50 m pull, one exposed door, a third of the exits earned, 200 × 160 cities, a prop per 60 m²)', () => {
    assert.equal(typeof A.audit, 'function'); assert.equal(typeof A.auditRoom, 'function');
    const R = A.RULES;
    assert.equal(R.R1.per100Open, 0.6); assert.equal(R.R1.per100Closed, 0.8); assert.equal(R.R1.kinds, 3);
    assert.equal(R.R2.pull, 50); assert.equal(R.R3.exposed, 1); assert.equal(R.R3.gap, 12); assert.equal(R.R3.onWall, 3);
    assert.equal(R.R4.share, 1 / 3); assert.equal(R.R7.city.join('x'), '200x160'); assert.equal(R.R7.open.join('x'), '60x50'); assert.equal(R.R8.per, 60);
    assert.equal(A.CLIMB.join(','), 'ramp,plateau,deck,wall,climb', 'a climb feature is a climb');
});

test('R9 THE TEACHING ROOM: every walker mechanic has ONE room with its plaque — the door gun\'s six, the climb, the skate, the swim', () => {
    const D = loadGameData();
    const walk = D.hqWalkLessons(), gun = D.hqGunLessons();
    assert.equal(walk.map(l => l.kind).sort().join(','), 'climb,skate,swim');
    for (const l of walk.concat(gun)) assert.ok(l.placed, l.id + ' has its plaque in ' + l.room);
    const rooms = new Set(walk.map(l => l.room)); assert.equal(rooms.size, 3, 'three different rooms');
});

test('R1–R8 AS WARNINGS: the audit runs over every explorable part and prints the offenders per rule (never a red until D3)', heavy, () => {
    const rows = A.audit({});
    assert.ok(rows.length >= 100, 'the explorable parts: ' + rows.length);
    for (const r of rows) { assert.ok(typeof r.id === 'string' && Array.isArray(r.warn) && r.area >= 0, r.id); assert.ok(!r.err && !r.err2, r.id + ': ' + (r.err || r.err2)); }
    const per = {};
    for (const R of ['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7', 'R8']) per[R] = rows.filter(r => r.warn.some(w => w.startsWith(R + ' ')));
    console.log('\n  AREA CONTENT — the rules as warnings (' + rows.length + ' explorable parts):');
    for (const R of Object.keys(per)) console.log('    ' + R + ': ' + per[R].length + ' warn' + (per[R].length ? ' — ' + per[R].slice(0, 8).map(r => r.id.replace(/^site_prebuilt_/, '')).join(', ') + (per[R].length > 8 ? ' …' : '') : ''));
    assert.ok(true);
});
