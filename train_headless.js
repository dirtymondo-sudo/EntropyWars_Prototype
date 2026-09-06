#!/usr/bin/env node
// train_headless.js — run the AI labs (Training / Strength Test / Balance Lab)
// in N headless Chromium contexts at once, with the engine's virtual sim clock
// and no rendering, then merge the shards into one importable champion.
//
//   node train_headless.js                       # training, auto workers, 30 min
//   node train_headless.js --workers 6 --minutes 120 --mode arena --map rotate
//   node train_headless.js --lab strength --baseline prev --minutes 20
//   node train_headless.js --lab balance --mode rotate --minutes 60
//   node train_headless.js --weights ewaiweightsgen305.json   # start from a champion
//
// What it does
//   • serves the REPO copies of every R2-hosted script (asset_cache.js
//     LOCAL_ASSETS) so your local edits are what runs — set LOCAL_ASSETS=none
//     to test the live R2 build instead;
//   • each worker gets a fresh browser context (own localStorage), sets
//     window.EW_SIM_VIRTUAL_CLOCK + EW_SIM_NO_RENDER, and — for training —
//     a disjoint shard of the weight table (window.EW_TRAIN_KEYS), so N
//     workers explore N weights simultaneously instead of one at a time;
//   • polls window._ewTrainSnapshot() / _ewStrengthSnapshot() and prints a
//     status line per worker (matches, matches/min, current experiment);
//   • at the deadline writes shots/train/<stamp>/worker-N.json plus
//     merged-weights.json (Export-format: load it with the Training panel's
//     Import button, or pass it back in with --weights for the next run).
//
// Flags: --workers N  --minutes M  --lab train|strength|balance
//        --mode arena|tdm|clash|gauntlet|simul|rotate  --map rotate|<mapId>
//        --weights file.json  --baseline default|prev (strength)
//        --out dir  --render (keep drawing)  --real-clock (no virtual clock)
//        --headed (watch one window)  --poll seconds
// Env:   PW_CHROMIUM=/path/to/chromium  PORT=3000  LOCAL_ASSETS=a.js,b.js|none
//
// Needs `npm install` (playwright is a dependency) and the server; the script
// starts `node server.js` itself when :PORT isn't answering.

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const http = require('http');
const { spawn } = require('child_process');

const args = process.argv.slice(2);
function flag(name, dflt) {
    const i = args.indexOf('--' + name);
    if (i === -1) return dflt;
    const v = args[i + 1];
    if (v == null || v.startsWith('--')) return true;
    return v;
}
const LAB = String(flag('lab', 'train'));
const WORKERS = Math.max(1, parseInt(flag('workers', Math.max(1, Math.floor(os.cpus().length / 2))), 10) || 1);
const MINUTES = Math.max(0.5, parseFloat(flag('minutes', 30)) || 30);
const MODE = String(flag('mode', 'arena'));
const MAP = String(flag('map', 'rotate'));
const WEIGHTS_FILE = flag('weights', null);
const BASELINE = String(flag('baseline', 'default'));
const RENDER = !!flag('render', false);
const REAL_CLOCK = !!flag('real-clock', false);
const HEADED = !!flag('headed', false);
const POLL_S = Math.max(5, parseFloat(flag('poll', 15)) || 15);
const PORT = process.env.PORT || 3000;
const STAMP = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const OUT = String(flag('out', path.join(__dirname, 'shots', 'train', STAMP)));
const sleep = ms => new Promise(r => setTimeout(r, ms));

const LAB_MODE = { train: 'aitrain', strength: 'aistrength', balance: 'balancesim' }[LAB];
if (!LAB_MODE) { console.error(`unknown --lab ${LAB} (train|strength|balance)`); process.exit(2); }

// Serve local repo copies of the R2 scripts unless told otherwise.
if (!process.env.LOCAL_ASSETS) {
    process.env.LOCAL_ASSETS = fs.readdirSync(__dirname)
        .filter(f => /\.(js|css)$/.test(f) && !/\.test\.js$/.test(f) && !/^(server|deploy|load-data|check-|playtest|probe|bot|train_headless|asset_cache|build_mal2|steam-schema|d1)/.test(f))
        .join(',');
} else if (process.env.LOCAL_ASSETS.toLowerCase() === 'none') {
    process.env.LOCAL_ASSETS = '';
}

function serverUp() {
    return new Promise(res => {
        const req = http.get({ host: 'localhost', port: PORT, path: '/', timeout: 2000 }, r => { r.resume(); res(r.statusCode < 500); });
        req.on('error', () => res(false));
        req.on('timeout', () => { req.destroy(); res(false); });
    });
}

async function ensureServer() {
    if (await serverUp()) return null;
    console.log(`[runner] starting node server.js on :${PORT}`);
    const child = spawn(process.execPath, ['server.js'], { cwd: __dirname, env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore' });
    for (let i = 0; i < 40; i++) { await sleep(500); if (await serverUp()) return child; }
    throw new Error('server did not come up on :' + PORT);
}

function fmtMin(ms) { return (ms / 60000).toFixed(1) + 'm'; }

(async () => {
    const { chromium } = require('playwright');
    const { installAssetCache } = require('./asset_cache');
    fs.mkdirSync(OUT, { recursive: true });

    let startWeights = null;
    if (WEIGHTS_FILE) {
        startWeights = JSON.parse(fs.readFileSync(path.resolve(String(WEIGHTS_FILE)), 'utf8'));
        console.log(`[runner] starting champion: ${WEIGHTS_FILE} (gen ${startWeights?._meta?.generation ?? '?'})`);
    }

    const serverChild = await ensureServer();
    const browser = await chromium.launch({
        headless: !HEADED,
        executablePath: process.env.PW_CHROMIUM || undefined,
        args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox', '--disable-dev-shm-usage',
               '--autoplay-policy=no-user-gesture-required', '--mute-audio'],
    });

    const workers = [];
    async function bootWorker(idx, shardKeys) {
        const ctx = await browser.newContext({ viewport: { width: 1100, height: 720 }, ignoreHTTPSErrors: true });
        try { await installAssetCache(ctx); } catch (e) { console.log(`[w${idx}] asset cache unavailable:`, e.message); }
        await ctx.addInitScript(({ virt, noRender, keys, lab }) => {
            window.EW_SIM_VIRTUAL_CLOCK = virt;
            window.EW_SIM_NO_RENDER = noRender;
            window.EW_DISABLE_INTRO_CINE = true;
            window.EW_HEADLESS_LAB = lab;
            if (keys && keys.length) window.EW_TRAIN_KEYS = keys;
        }, { virt: !REAL_CLOCK, noRender: !RENDER, keys: shardKeys, lab: LAB });
        const page = await ctx.newPage();
        const errors = [];
        page.on('pageerror', e => { errors.push(e.message.split('\n')[0]); if (errors.length <= 5) console.log(`[w${idx}] PAGEERR`, errors[errors.length - 1]); });
        await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'load', timeout: 120000 });
        await page.waitForFunction(() => window.GAME && typeof window._selectMode === 'function' && typeof window._ewSimSetup === 'function' && typeof window._ewTrainSnapshot === 'function', null, { timeout: 120000 });
        await page.evaluate(async ({ mode, map, labMode, baseline, weights }) => {
            window._ewSimSetup(mode, map);
            if (weights) await window._ewTrainImportWeights(weights);
            if (labMode === 'aistrength' && typeof window._ewSetStrengthBaseline === 'function') window._ewSetStrengthBaseline(baseline);
            window._selectMode(labMode);
        }, { mode: MODE, map: MAP, labMode: LAB_MODE, baseline: BASELINE, weights: startWeights });
        return { idx, ctx, page, errors, shardKeys, startedAt: Date.now(), last: null };
    }

    // Shard the weight table across workers (training only) — discover the key
    // list from a probe page so this script never hard-codes the table.
    let shards = Array.from({ length: WORKERS }, () => null);
    if (LAB === 'train' && WORKERS > 1) {
        const probeCtx = await browser.newContext({ ignoreHTTPSErrors: true });
        try { await installAssetCache(probeCtx); } catch (e) {}
        const probe = await probeCtx.newPage();
        await probe.goto(`http://localhost:${PORT}/`, { waitUntil: 'load', timeout: 120000 });
        await probe.waitForFunction(() => typeof window._ewTrainSnapshot === 'function', null, { timeout: 120000 });
        const keys = await probe.evaluate(() => Object.keys(window._ewTrainSnapshot().weights));
        await probeCtx.close();
        shards = Array.from({ length: WORKERS }, () => []);
        keys.forEach((k, i) => shards[i % WORKERS].push(k));
        console.log(`[runner] ${keys.length} weights sharded over ${WORKERS} workers`);
    }

    console.log(`[runner] lab=${LAB} mode=${MODE} map=${MAP} workers=${WORKERS} minutes=${MINUTES} virtualClock=${!REAL_CLOCK} render=${RENDER} out=${OUT}`);
    for (let i = 0; i < WORKERS; i++) {
        workers.push(await bootWorker(i, shards[i]));
        console.log(`[w${i}] booted${shards[i] ? ' · shard: ' + shards[i].join(', ') : ''}`);
    }

    const t0 = Date.now();
    const deadline = t0 + MINUTES * 60000;

    async function snapshot(w) {
        try {
            const snap = await w.page.evaluate((lab) => {
                const clock = window._ewSimClockStats ? window._ewSimClockStats() : null;
                if (lab === 'strength') return { kind: 'strength', s: window._ewStrengthSnapshot(), t: window._ewTrainSnapshot(), clock };
                if (lab === 'balance') {
                    const s = window.GAME.state;
                    return { kind: 'balance', t: window._ewTrainSnapshot(), clock, phase: s.phase, round: s.round,
                             matchNumber: s.matchNumber, winConds: (typeof _balanceStats !== 'undefined' && _balanceStats) ? _balanceStats.winConds : null,
                             totalMatches: (typeof _balanceStats !== 'undefined' && _balanceStats) ? _balanceStats.totalMatches : null };
                }
                return { kind: 'train', t: window._ewTrainSnapshot(), clock };
            }, LAB);
            snap.errors = w.errors.length;
            snap.elapsedMs = Date.now() - w.startedAt;
            w.last = snap;
            fs.writeFileSync(path.join(OUT, `worker-${w.idx}.json`), JSON.stringify(snap, null, 2));
            return snap;
        } catch (e) {
            console.log(`[w${w.idx}] snapshot failed: ${e.message.split('\n')[0]}`);
            return w.last;
        }
    }

    function matchesOf(snap) {
        if (!snap) return 0;
        if (snap.kind === 'strength') return (snap.s.matches || 0) + (snap.s.noContests || 0);
        if (snap.kind === 'balance') return snap.totalMatches || 0;
        return snap.t.totalMatches || 0;
    }

    function statusLine(w, snap) {
        if (!snap) return `[w${w.idx}] (no snapshot yet)`;
        const m = matchesOf(snap);
        const rate = (m / Math.max(1, snap.elapsedMs) * 60000).toFixed(1);
        let extra = '';
        if (snap.kind === 'train') {
            const c = snap.t.current;
            extra = `gen ${snap.t.generation} · pass ${snap.t.pass} · ${snap.t.completed.length} exp` + (c ? ` · now ${c.label} ${c.maxWins}-${c.minWins}/${c.matches}` : '');
        } else if (snap.kind === 'strength') {
            extra = `champ ${snap.s.champWins}-${snap.s.baseWins} (${Math.round(snap.s.winRate * 100)}%, Elo ${snap.s.eloDelta > 0 ? '+' : ''}${snap.s.eloDelta}) vs ${snap.s.baselineSource}`;
        } else {
            extra = `round ${snap.round} · phase ${snap.phase}`;
        }
        const safety = snap.t && snap.t.aiSafetyFires ? ` · ⚠ safety ${snap.t.aiSafetyFires}` : '';
        const errs = snap.errors ? ` · errors ${snap.errors}` : '';
        return `[w${w.idx}] ${m} matches (${rate}/min) · ${extra}${safety}${errs}`;
    }

    while (Date.now() < deadline) {
        await sleep(Math.min(POLL_S * 1000, Math.max(1000, deadline - Date.now())));
        const lines = [];
        for (const w of workers) lines.push(statusLine(w, await snapshot(w)));
        console.log(`── ${fmtMin(Date.now() - t0)} / ${MINUTES}m ──`);
        for (const l of lines) console.log(l);
    }

    // ── harvest + merge ──────────────────────────────────────────────────
    const finals = [];
    for (const w of workers) finals.push(await snapshot(w));
    const totalMatches = finals.reduce((a, s) => a + matchesOf(s), 0);
    const elapsed = Date.now() - t0;
    console.log(`\n[runner] done: ${totalMatches} matches in ${fmtMin(elapsed)} across ${WORKERS} workers = ${(totalMatches / (elapsed / 60000)).toFixed(1)} matches/min`);

    if (LAB === 'train') {
        const base = finals.find(Boolean)?.t?.weights || {};
        const merged = {};
        for (const k of Object.keys(base)) merged[k] = (startWeights?.weights?.[k]?.value ?? startWeights?.weights?.[k]) ?? base[k].default;
        const experiments = [];
        const winConditions = {};
        let generation = 0;
        for (const s of finals) {
            if (!s || !s.t) continue;
            generation += s.t.generation || 0;
            for (const e of s.t.completed || []) {
                experiments.push(e);
                if ((e.adopted === 'high' || e.adopted === 'low') && merged[e.key] != null) merged[e.key] = e.newVal;
            }
            for (const [wc, b] of Object.entries(s.t.winConditions || {})) {
                const t = winConditions[wc] || (winConditions[wc] = { n: 0, rounds: 0 });
                t.n += b.n; t.rounds += b.rounds;
            }
        }
        experiments.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
        const out = {
            _meta: {
                game: 'Entropy Wars', kind: 'merged-headless-training',
                schemaVersion: finals.find(Boolean)?.t?.schemaVersion, aiVersion: finals.find(Boolean)?.t?.aiVersion,
                generation: (startWeights?._meta?.generation || 0) + generation,
                totalMatches: (startWeights?._meta?.totalMatches || 0) + totalMatches,
                thisRunMatches: totalMatches, minutes: Number((elapsed / 60000).toFixed(1)), workers: WORKERS,
                mode: MODE, map: MAP, virtualClock: !REAL_CLOCK, render: RENDER,
                winConditions, exportedAt: new Date().toISOString(),
            },
            weights: {},
            experiments,
        };
        const changed = [];
        for (const k of Object.keys(base)) {
            const v = merged[k];
            out.weights[k] = { value: v, default: base[k].default, prev: base[k].prev, min: base[k].min, max: base[k].max, changed: Math.abs(v - base[k].default) > 0.005 || undefined };
            const from = (startWeights?.weights?.[k]?.value ?? startWeights?.weights?.[k]) ?? base[k].default;
            if (Math.abs(v - from) > 0.005) changed.push(`${k}: ${from} → ${v}`);
        }
        fs.writeFileSync(path.join(OUT, 'merged-weights.json'), JSON.stringify(out, null, 2));
        console.log(`[runner] adopted ${changed.length} change(s):`); for (const c of changed) console.log('   ' + c);
        const wcTotal = Object.values(winConditions).reduce((a, b) => a + b.n, 0) || 1;
        console.log('[runner] how matches ended:');
        for (const [wc, b] of Object.entries(winConditions).sort((a, b) => b[1].n - a[1].n)) console.log(`   ${wc.padEnd(22)} ${String(b.n).padStart(5)}  ${Math.round(b.n / wcTotal * 100)}%  avg ${(b.rounds / Math.max(1, b.n)).toFixed(1)} rounds`);
        console.log(`[runner] wrote ${path.join(OUT, 'merged-weights.json')} — Import it in the AI Training panel (or --weights it into the next run)`);
    } else if (LAB === 'strength') {
        let champ = 0, base = 0, nc = 0;
        const wc = { champ: {}, base: {} };
        for (const s of finals) {
            if (!s || !s.s) continue;
            champ += s.s.champWins; base += s.s.baseWins; nc += s.s.noContests || 0;
            for (const side of ['champ', 'base']) for (const [k, b] of Object.entries((s.s.winConds || {})[side] || {})) { const t = wc[side][k] || (wc[side][k] = { n: 0, rounds: 0 }); t.n += b.n; t.rounds += b.rounds; }
        }
        const n = champ + base, wr = n ? champ / n : 0.5;
        const z = 1.96, z2 = z * z, den = 1 + z2 / n, center = wr + z2 / (2 * n), half = z * Math.sqrt((wr * (1 - wr) + z2 / (4 * n)) / Math.max(1, n));
        const lo = n ? Math.max(0, (center - half) / den) : 0, hi = n ? Math.min(1, (center + half) / den) : 1;
        const elo = n ? Math.round(-400 * Math.log10(1 / Math.max(0.01, Math.min(0.99, wr)) - 1)) : 0;
        const summary = { matches: n, champWins: champ, baseWins: base, noContests: nc, winRate: wr, wilson95: { lo, hi }, eloDelta: elo, baseline: BASELINE, winConds: wc };
        fs.writeFileSync(path.join(OUT, 'strength-summary.json'), JSON.stringify(summary, null, 2));
        console.log(`[runner] champion ${champ}-${base} = ${Math.round(wr * 100)}% (Wilson95 ${Math.round(lo * 100)}–${Math.round(hi * 100)}%, Elo ${elo > 0 ? '+' : ''}${elo}) vs baseline=${BASELINE} · ${n >= 10 && lo > 0.5 ? 'STRONGER ✓' : n >= 10 && hi < 0.5 ? 'WEAKER ✗' : 'not significant yet'}`);
        for (const side of ['champ', 'base']) console.log(`   ${side} wins by: ` + Object.entries(wc[side]).sort((a, b) => b[1].n - a[1].n).map(([k, b]) => `${k} ${b.n}`).join(', '));
    } else {
        const wcAll = {};
        for (const s of finals) for (const [k, b] of Object.entries((s && s.winConds) || {})) { const t = wcAll[k] || (wcAll[k] = { n: 0, rounds: 0 }); t.n += b.n; t.rounds += b.rounds; }
        console.log('[runner] balance lab — how matches ended:', JSON.stringify(wcAll));
        console.log('[runner] full balance stats stay in each worker\'s localStorage; use the in-browser Export for the job/race/spell tables.');
    }

    await browser.close();
    if (serverChild) serverChild.kill();
    process.exit(0);
})().catch(err => { console.error('[runner] fatal:', err); process.exit(1); });
