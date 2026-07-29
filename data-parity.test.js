// test/data-parity.test.js — client (data.js) and server (server.js) copies of
// the canonical economy/race data must be identical. See
// tools/check-data-parity.js for what each check protects.

'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const { runParityChecks } = require('./check-data-parity');

test('client/server economy + race data in sync', () => {
    const problems = runParityChecks();
    assert.deepStrictEqual(problems, [], 'drift found:\n  ' + problems.join('\n  '));
});
