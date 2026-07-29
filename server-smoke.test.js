// test/server-smoke.test.js — boots the real server.js on a random port and
// hits a dependency-free endpoint. Skips itself when node_modules is absent
// (the other tests are dependency-free; this one needs express/socket.io).

'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const { spawn } = require('node:child_process');
const path = require('node:path');

const REPO_ROOT = __dirname;

let hasDeps = true;
try { require.resolve('express', { paths: [REPO_ROOT] }); }
catch { hasDeps = false; }

test('server boots and serves /api/queue-stats', { skip: !hasDeps, timeout: 30000 }, async () => {
    const port = 3100 + Math.floor(Math.random() * 900);
    const child = spawn(process.execPath, [path.join(REPO_ROOT, 'server.js')], {
        env: { ...process.env, PORT: String(port) },
        stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stderr = '';
    child.stderr.on('data', d => { stderr += d; });
    try {
        // Poll until the server answers (or ~10s passes).
        let res = null;
        for (let i = 0; i < 50; i++) {
            await new Promise(r => setTimeout(r, 200));
            if (child.exitCode !== null) break;
            try { res = await fetch(`http://127.0.0.1:${port}/api/queue-stats`); break; }
            catch { /* not up yet */ }
        }
        assert.ok(child.exitCode === null, `server exited early (code ${child.exitCode}):\n${stderr}`);
        assert.ok(res, 'server never answered /api/queue-stats');
        assert.strictEqual(res.status, 200);
        const body = await res.json();
        assert.strictEqual(typeof body, 'object');
    } finally {
        child.kill('SIGKILL');
    }
});
