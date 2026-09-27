// test-end.js — the END-OF-SESSION check (2026-09-27, mondo: "update whatever files you need so that the tests
// run faster at the end or not at all"). Runs `test:quick` (syntax of every JS, the data/server parity, the content
// schema) plus ONLY the *.test.js files this session changed or added (git status), or the ones named on the line.
// Never the whole suite: CI (.github/workflows/ci.yml) runs `npm test` on every push, on GitHub's minutes.
//
// Usage: npm run test:end                      (quick + every changed/new *.test.js)
//        npm run test:end -- hq-clock hq-west   (quick + these, `.test.js` optional)

'use strict';

const { execFileSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const run = (args) => spawnSync(process.execPath, args, { cwd: ROOT, stdio: 'inherit' }).status === 0;

let named = process.argv.slice(2).map(a => a.endsWith('.test.js') ? a : a + '.test.js');
if (!named.length) {
    try {
        const out = execFileSync('git', ['status', '--porcelain', '--untracked-files=all'], { cwd: ROOT, encoding: 'utf8' });
        named = out.split('\n').map(l => l.slice(3).trim()).filter(f => /^[^/]+\.test\.js$/.test(f));
    } catch (e) { named = []; }
}
named = [...new Set(named)].filter(f => fs.existsSync(path.join(ROOT, f)) && f !== 'content-schema.test.js');

let ok = run(['check-syntax.js']) && run(['check-data-parity.js']) && run(['--test', 'content-schema.test.js']);
if (named.length) {
    console.log('\n[test:end] the touched tests: ' + named.join(' '));
    ok = run(['--test', ...named]) && ok;
} else {
    console.log('\n[test:end] no changed *.test.js — quick checks only');
}
process.exit(ok ? 0 : 1);
