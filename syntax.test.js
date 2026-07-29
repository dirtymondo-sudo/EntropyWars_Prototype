// test/syntax.test.js — every JS file in the repo must parse.
// Thin node:test wrapper around tools/check-syntax.js so `npm test` covers it.

'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const { execFileSync } = require('node:child_process');
const path = require('node:path');

test('all repo JS files pass node --check', () => {
    const script = path.join(__dirname, 'check-syntax.js');
    try {
        execFileSync(process.execPath, [script], { stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (e) {
        assert.fail('syntax errors found:\n' + (e.stderr || e.stdout || '').toString());
    }
});
