#!/usr/bin/env node
// fresh-check.js — THE FRESH CHECK (2026-11-15, mondo: "wtf are you doing testing on out of date copies of
// the game from weeks ago"). Repo-only dev tooling; never uploaded to R2, never runs on Render.
//
// WHAT HAPPENED: a cloud container's clone can carry a local `origin/main` ref that is DAYS old (the image
// is cached; the clone is shallow). A thread ran `git checkout -B <branch> origin/main` WITHOUT fetching,
// got the game of 2026-11-09, and took its proof picture there (old theme). Nothing warned.
//
// WHAT THIS DOES
//   1. THE CHECKOUT: `git fetch origin main`, then counts the merged PRs on main that HEAD does not hold.
//      STALE = any missing PR that merged more than EW_STALE_MAX_MIN minutes ago (default 60), or no common
//      history with main, or GitHub unreachable (cannot prove it is fresh).
//   2. THE LOCAL SERVER (server.js, off Render only): a stale checkout does not serve the game at all. The
//      page is a red STALE CHECKOUT screen, so every harness, probe and screenshot fails loudly.
//   3. THE PAGE: a fresh checkout gets a small script in index.html that sets window.EW_BUILD, logs
//      `[EW BUILD] …`, and re-reads every game script the page loaded from cdn.entropywars.net: if any differs
//      from the checkout's file (a harness that loads live R2 code in place of the edits under test, a cached
//      old copy), the page is covered by a red CODE MISMATCH screen.
//
//   node fresh-check.js          # print the state; exit 1 when stale
//   EW_ALLOW_STALE=1 npm start   # deliberate old build (a bisect): serves it, still logs the warning
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const { execFileSync } = require('child_process');
const ROOT = __dirname;
const MAX_MIN = parseFloat(process.env.EW_STALE_MAX_MIN) || 60;
const ALLOW = process.env.EW_ALLOW_STALE === '1';
const RECHECK_MS = 45000;

function git(args, timeout) {
    return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', timeout: timeout || 15000, stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}
function tryGit(args, timeout) { try { return git(args, timeout); } catch (e) { return null; } }
function isLocal() { return !process.env.RENDER && fs.existsSync(path.join(ROOT, '.git')); }

let _last = null, _lastAt = 0;
function check(force) {
    if (!force && _last && Date.now() - _lastAt < RECHECK_MS) return _last;
    const s = { ok: false, reason: '', behind: 0, oldestMin: 0, head: '', headDate: '', main: '', mainDate: '', fetched: false, checkedAt: new Date().toISOString() };
    try {
        s.head = git(['rev-parse', '--short', 'HEAD']);
        s.headDate = git(['log', '-1', '--format=%cI', 'HEAD']);
        s.fetched = tryGit(['fetch', 'origin', 'main', '--quiet'], 45000) !== null;
        if (tryGit(['rev-parse', '--verify', '--quiet', 'origin/main']) === null) throw new Error('no origin/main ref');
        s.main = git(['rev-parse', '--short', 'origin/main']);
        s.mainDate = git(['log', '-1', '--format=%cI', 'origin/main']);
        if (tryGit(['merge-base', 'HEAD', 'origin/main']) === null) {       // shallow clone: deepen once, then decide
            tryGit(['fetch', '--deepen=300', 'origin', 'main', '--quiet'], 90000);
            if (tryGit(['merge-base', 'HEAD', 'origin/main']) === null) { s.reason = 'this checkout shares no history with main (a shallow clone on an old base)'; s.behind = -1; throw 0; }
        }
        // first-parent = one row per PR merged into main, stamped with its MERGE time
        const miss = git(['log', '--first-parent', '--format=%ct', 'HEAD..origin/main']).split('\n').filter(Boolean).map(Number);
        s.behind = miss.length;
        s.oldestMin = miss.length ? Math.round((Date.now() / 1000 - Math.min.apply(null, miss)) / 60) : 0;
        if (!s.fetched) s.reason = 'could not reach GitHub (git fetch origin main failed), so this checkout cannot be proven current';
        else if (s.behind && s.oldestMin > MAX_MIN) s.reason = 'this checkout is ' + s.behind + ' merged PR' + (s.behind > 1 ? 's' : '') + ' behind main; the oldest one it lacks merged ' + ago(s.oldestMin) + ' ago';
        else s.ok = true;
    } catch (e) { if (!s.reason) s.reason = 'git check failed: ' + String(e && e.message || e).split('\n')[0]; }
    _last = s; _lastAt = Date.now();
    return s;
}
function ago(min) { return min < 120 ? min + ' minutes' : min < 2880 ? Math.round(min / 60) + ' hours' : Math.round(min / 1440) + ' days'; }
function line(s) {
    return '[EW BUILD] HEAD ' + s.head + ' (' + s.headDate + ') · main ' + s.main + ' (' + s.mainDate + ') · ' +
        (s.behind < 0 ? 'no common history' : s.behind + ' PR' + (s.behind === 1 ? '' : 's') + ' behind') + (s.ok ? ' · FRESH' : ' · STALE: ' + s.reason);
}
const FIX = 'git fetch origin main && git merge origin/main     (if it says "refusing to merge unrelated histories": git fetch --deepen=300 origin main, then merge again)';

function stalePage(s) {
    const esc = t => String(t).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
    return '<!doctype html><html><head><meta charset="utf-8"><title>STALE CHECKOUT - DO NOT TEST</title></head>' +
        '<body style="margin:0;background:#b00000;color:#fff;font:20px/1.5 monospace;padding:48px">' +
        '<h1 style="font-size:54px;margin:0 0 24px">STALE CHECKOUT &mdash; DO NOT TEST HERE</h1>' +
        '<p>' + esc(s.reason) + '.</p><p>' + esc(line(s)) + '</p>' +
        '<p>Nothing on this page is the current game. A screenshot of an old build is not proof.</p>' +
        '<p>FIX: <b>' + esc(FIX) + '</b>, then reload.</p>' +
        '<p style="opacity:.8">A deliberate old build (a bisect) needs EW_ALLOW_STALE=1 on the server. fresh-check.js, CLAUDE.md RULE #1d.</p>' +
        '<script>window.EW_BUILD=' + JSON.stringify(Object.assign({ stale: true }, s)) + ';console.error(' + JSON.stringify(line(s)) + ');</script></body></html>';
}

/* the page half: runs in the browser, re-reads each game script the page loaded and compares it to the checkout */
function pageScript(B) {
    var say = function (m) { try { console.log('[EW BUILD] ' + m); } catch (e) {} };
    window.EW_BUILD = B; B.codeOk = null; B.mismatch = [];
    (B.ok ? console.log : console.error).call(console, B.line);
    function hex(buf) { return Array.prototype.map.call(new Uint8Array(buf), function (x) { return ('0' + x.toString(16)).slice(-2); }).join(''); }
    function cover(list) {
        var d = document.createElement('div');
        d.id = 'ew-build-mismatch';
        d.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:#b00000;color:#fff;font:18px/1.5 monospace;padding:40px;overflow:auto';
        d.innerHTML = '<h1 style="font-size:44px;margin:0 0 20px">CODE MISMATCH &mdash; DO NOT TEST HERE</h1>' +
            '<p>This page did NOT run this checkout\'s files: <b>' + list.join(', ') + '</b>.</p>' +
            '<p>The browser got another copy (live R2 code in place of the edits under test, or a cached old file). ' +
            'Serve the checkout\'s .js/.css for cdn.entropywars.net (see playtest_hq.js), or merge main if R2 is simply newer.</p><p>' + B.line + '</p>';
        (document.body || document.documentElement).appendChild(d);
    }
    function verify() {
        if (!window.crypto || !crypto.subtle || !window.fetch) { say('code check skipped (no crypto.subtle)'); return; }
        var els = [].slice.call(document.querySelectorAll('script[src],link[rel="stylesheet"][href]')), jobs = [], bad = [], seen = 0, blind = 0;
        els.forEach(function (el) {
            var src = el.src || el.href, u; try { u = new URL(src); } catch (e) { return; }
            if (u.hostname !== 'cdn.entropywars.net') return;
            var base = u.pathname.split('/').pop(), want = B.files[base]; if (!want) return;
            jobs.push(fetch(src, { cache: 'force-cache' }).then(function (r) { if (!r.ok) throw 0; return r.arrayBuffer(); })
                .then(function (b) { return crypto.subtle.digest('SHA-256', b); })
                .then(function (h) { seen++; if (hex(h) !== want) bad.push(base); }, function () { blind++; }));
        });
        Promise.all(jobs).then(function () {
            B.mismatch = bad; B.codeChecked = seen; B.codeUnread = blind; B.codeOk = bad.length ? false : (seen ? true : null);
            if (bad.length) { console.error('[EW BUILD] CODE MISMATCH: the page did not run the checkout\'s ' + bad.join(', ')); cover(bad); }
            else say('code check: ' + seen + ' files match the checkout' + (blind ? ', ' + blind + ' could not be re-read' : ''));
        });
    }
    if (document.readyState === 'complete') setTimeout(verify, 1500); else window.addEventListener('load', function () { setTimeout(verify, 1500); });
}

function fileHashes(html) {
    const out = {}, re = /https:\/\/cdn\.entropywars\.net\/([^"'?\s)]+\.(?:js|css))/g; let m;
    while ((m = re.exec(html))) {
        const base = path.basename(m[1]), f = path.join(ROOT, base);
        if (m[1] === base && !out[base] && fs.existsSync(f)) out[base] = crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
    }
    return out;
}

/* Express middleware for the entry page. A no-op on Render and anywhere without a .git folder. */
function middleware() {
    if (!isLocal()) return (req, res, next) => next();
    const s0 = check(true);
    console.log('\n' + '='.repeat(100) + '\n' + line(s0) + (s0.ok ? '' : '\nSTALE CHECKOUT: the game page is BLOCKED' + (ALLOW ? ' (EW_ALLOW_STALE=1: served anyway)' : '') + '. FIX: ' + FIX) + '\n' + '='.repeat(100) + '\n');
    return (req, res, next) => {
        if (req.method !== 'GET' || (req.path !== '/' && req.path !== '/index.html')) return next();
        let s; try { s = check(false); } catch (e) { return next(); }
        res.set('Cache-Control', 'no-store');
        if (!s.ok && !ALLOW) { console.error(line(s)); return res.status(503).type('html').send(stalePage(s)); }
        let html; try { html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'); } catch (e) { return next(); }
        const tok = (html.match(/\?v=([\w.-]+)/) || [])[1] || '';
        const B = Object.assign({}, s, { token: tok, line: line(s), files: fileHashes(html) });
        const tag = '<script>(' + pageScript.toString() + ')(' + JSON.stringify(B).replace(/</g, '\\u003c') + ');</script>';
        const i = html.indexOf('<head>');
        res.type('html').send(i >= 0 ? html.slice(0, i + 6) + tag + html.slice(i + 6) : tag + html);
    };
}

module.exports = { check, line, middleware, isLocal };

if (require.main === module) {
    const s = check(true);
    console.log(line(s));
    if (!s.ok) { console.log('FIX: ' + FIX); process.exit(ALLOW ? 0 : 1); }
}
