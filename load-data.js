// tools/load-data.js — headless loader for the browser-only game data.
//
// data.js is written for the browser (bare consts + `window` assigns), so the
// server and any Node tooling historically had to keep hand-synced copies of
// its constants. This loader runs data.js inside a Node `vm` sandbox with just
// enough browser stubbed out that it evaluates cleanly, then hands back the
// sandbox so callers can read the REAL canonical values (SPELL_LIBRARY,
// AVAILABLE_RACES, ACCT_* economy constants, …) instead of a copy.
//
// Used by `npm test` (test/*.test.js) and tools/check-data-parity.js.
// Zero dependencies — Node built-ins only.

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const REPO_ROOT = __dirname;

function makeSandbox({ quiet = true } = {}) {
    const noop = () => {};
    const storage = { getItem: () => null, setItem: noop, removeItem: noop, clear: noop };
    const sandbox = {
        // Real JS built-ins (vm contexts get their own, but sharing keeps
        // instanceof checks in caller code working on returned values).
        JSON, Math, Object, Array, String, Number, Boolean, Set, Map, RegExp, Date,
        parseInt, parseFloat, isNaN, isFinite, Promise, Symbol, Error, TypeError,
        // Browser stubs — data.js only touches these defensively at load time.
        console: quiet ? { log: noop, warn: noop, error: noop, info: noop, debug: noop } : console,
        localStorage: storage,
        sessionStorage: storage,
        navigator: { userAgent: 'node-headless' },
        document: {
            createElement: () => ({ style: {}, getContext: () => null, addEventListener: noop }),
            addEventListener: noop,
            getElementById: () => null,
            querySelector: () => null,
            querySelectorAll: () => [],
            body: { appendChild: noop },
        },
        Image: function Image() { return { addEventListener: noop }; },
        Audio: function Audio() { return { addEventListener: noop }; },
        setTimeout, clearTimeout, setInterval, clearInterval,
        requestAnimationFrame: noop,
        fetch: () => Promise.resolve({ ok: false, json: () => Promise.resolve({}) }),
    };
    sandbox.window = sandbox;
    sandbox.globalThis = sandbox;
    sandbox.self = sandbox;
    vm.createContext(sandbox);
    return sandbox;
}

// Loads data.js and returns the sandbox. Every top-level const/function in
// data.js is a property on the returned object (sandbox === its own window).
function loadGameData(opts) {
    const sandbox = makeSandbox(opts);
    const file = path.join(REPO_ROOT, 'data.js');
    const src = fs.readFileSync(file, 'utf8');
    vm.runInContext(src, sandbox, { filename: 'data.js' });
    return sandbox;
}

// Extracts a top-level `const NAME = <expr>;` from a JS source string WITHOUT
// executing the whole file (server.js starts Express at load, so we can't just
// require it). Finds the declaration, walks to the matching `;` with a
// bracket/paren/brace counter that understands strings and comments, then
// evaluates only that literal expression in a bare sandbox.
function extractConst(src, name) {
    const decl = new RegExp('^\\s*const\\s+' + name + '\\s*=\\s*', 'm');
    const m = decl.exec(src);
    if (!m) throw new Error(`const ${name} not found`);
    let i = m.index + m[0].length;
    const start = i;
    let depth = 0, inStr = null, inLine = false, inBlock = false;
    for (; i < src.length; i++) {
        const c = src[i], p = src[i - 1];
        if (inLine) { if (c === '\n') inLine = false; continue; }
        if (inBlock) { if (p === '*' && c === '/') inBlock = false; continue; }
        if (inStr) { if (c === inStr && p !== '\\') inStr = null; continue; }
        if (c === '"' || c === "'" || c === '`') { inStr = c; continue; }
        if (c === '/' && src[i + 1] === '/') { inLine = true; continue; }
        if (c === '/' && src[i + 1] === '*') { inBlock = true; continue; }
        if (c === '(' || c === '[' || c === '{') depth++;
        else if (c === ')' || c === ']' || c === '}') depth--;
        else if (c === ';' && depth === 0) break;
    }
    if (i >= src.length) throw new Error(`const ${name}: unterminated expression`);
    const expr = src.slice(start, i);
    return vm.runInNewContext('(' + expr + ')', { Set, Map }, { filename: name });
}

// Reads the server's hand-synced economy constants straight out of server.js
// source. Returns { ACCT_UNIT_PRICE, ..., ACCT_STARTER_UNITS, ACCT_PVP_MODES,
// AVAILABLE_RACES } with Sets normalized to arrays for easy diffing.
function loadServerEconomy() {
    const src = fs.readFileSync(path.join(REPO_ROOT, 'server.js'), 'utf8');
    const names = [
        'ACCT_UNIT_PRICE', 'ACCT_STARTING_GOLD', 'ACCT_FREE_TOKENS',
        'ACCT_MATCH_GOLD_CAP', 'ACCT_PVP_MODES', 'ACCT_STARTER_UNITS',
        'AVAILABLE_RACES',
    ];
    const out = {};
    for (const n of names) {
        let v = extractConst(src, n);
        if (v instanceof Set) v = [...v];
        out[n] = v;
    }
    return out;
}

module.exports = { loadGameData, loadServerEconomy, extractConst, makeSandbox, REPO_ROOT };
