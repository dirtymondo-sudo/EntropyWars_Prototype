// tools/check-syntax.js — syntax-check every JS file in the repo.
//
// The cheapest possible regression net: runs `node --check` on each .js at the
// repo root (game scripts, server, playtest harnesses alike). Catches the
// classic hand-edit failure modes — an unbalanced brace in a 45k-line file, a
// stray merge marker — before a file ever reaches the R2 bucket.
//
// Usage: node tools/check-syntax.js [file.js ...]   (no args = whole repo)
// Exit code 0 = all clean, 1 = at least one file failed.

'use strict';

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const REPO_ROOT = __dirname;
const SKIP_DIRS = new Set(['node_modules', '.git', 'shots']);

function listRepoJs() {
    const out = [];
    const walk = (dir) => {
        for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
            if (e.isDirectory()) {
                if (!SKIP_DIRS.has(e.name)) walk(path.join(dir, e.name));
            } else if (e.name.endsWith('.js')) {
                out.push(path.join(dir, e.name));
            }
        }
    };
    walk(REPO_ROOT);
    return out.sort();
}

function checkFile(file) {
    try {
        execFileSync(process.execPath, ['--check', file], { stdio: ['ignore', 'ignore', 'pipe'] });
        return null;
    } catch (e) {
        return (e.stderr ? e.stderr.toString() : e.message).trim();
    }
}

function main() {
    const args = process.argv.slice(2);
    const files = args.length ? args.map(f => path.resolve(f)) : listRepoJs();
    let failed = 0;
    for (const file of files) {
        const rel = path.relative(REPO_ROOT, file);
        const err = checkFile(file);
        if (err) {
            failed++;
            console.error(`FAIL  ${rel}\n${err.split('\n').slice(0, 6).map(l => '      ' + l).join('\n')}`);
        } else {
            console.log(`ok    ${rel}`);
        }
    }
    console.log(`\n${files.length - failed}/${files.length} files clean`);
    process.exit(failed ? 1 : 0);
}

main();
