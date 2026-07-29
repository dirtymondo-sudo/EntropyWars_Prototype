// test/migrations.test.js — sanity checks for the versioned D1 migrations
// under ./migrations, which server.js applies at boot (runMigrations).
// Catches the cheap-to-catch mistakes before they hit the live database:
// misnumbered files, an empty/comment-only file, or a statement type the
// tolerant runner shouldn't be running blind.

'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

// Mirrors server.js splitSqlStatements — strip full-line comments, split on ';'.
function splitSqlStatements(sql) {
    return sql
        .split('\n').filter(l => !l.trim().startsWith('--')).join('\n')
        .split(';')
        .map(s => s.trim())
        .filter(Boolean);
}

const files = fs.readdirSync(MIGRATIONS_DIR).filter(f => f.endsWith('.sql')).sort();

test('migrations exist and are numbered without duplicates', () => {
    assert.ok(files.length >= 3, `expected at least the 3 initial migrations, found ${files.length}`);
    const prefixes = files.map(f => f.match(/^(\d+)_/)?.[1]);
    for (let i = 0; i < files.length; i++) {
        assert.ok(prefixes[i], `${files[i]}: name must start with NNN_`);
    }
    assert.strictEqual(new Set(prefixes).size, prefixes.length, 'duplicate migration numbers');
});

test('every migration file yields only expected statement types', () => {
    const OK = /^(CREATE TABLE|CREATE INDEX|CREATE UNIQUE INDEX|ALTER TABLE|INSERT INTO|UPDATE |DROP INDEX)/i;
    for (const f of files) {
        const stmts = splitSqlStatements(fs.readFileSync(path.join(MIGRATIONS_DIR, f), 'utf8'));
        assert.ok(stmts.length > 0, `${f}: no statements (comment-only file?)`);
        for (const s of stmts) {
            assert.match(s, OK, `${f}: unexpected statement start: ${s.slice(0, 60)}`);
        }
    }
});

test('splitter matches server.js copy', () => {
    // The runner's splitter lives in server.js (not require-able — it boots the
    // server). Diff the source text of the two implementations instead so they
    // can't drift silently.
    const serverSrc = fs.readFileSync(path.join(__dirname, 'server.js'), 'utf8');
    const m = serverSrc.match(/function splitSqlStatements\(sql\) \{[\s\S]*?\n\}/);
    assert.ok(m, 'server.js splitSqlStatements not found');
    const localSrc = splitSqlStatements.toString();
    assert.strictEqual(
        m[0].replace(/\s+/g, ' '),
        localSrc.replace(/\s+/g, ' '),
        'migrations.test.js splitter drifted from server.js splitSqlStatements'
    );
});
