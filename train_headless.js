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
//     window.EW_SIM_VIRTUAL_CLOCK + EW_SIM_NO_RENDER. Training (THE TRAINER
//     REWORK, 2026-10-29) is SPSA on paired matches: every worker trains EVERY
//     weight, and every --sync-min (default 20) the runner adds up every
//     worker's moves since the last sync and sets all workers to the sum
//     (parallel SPSA: as if one browser had played every pair). THE SETTLING
//     STEPS (2026-11-01): each sync also hands every worker the run's total
//     pair count, so the step shrinks on the whole run's schedule, and every
//     sync's θ is kept: merged-weights.json holds the AVERAGE of the run's
//     second half (raw-theta.json = the last step). THE CHECKPOINTS: every
//     --ckpt-min (default 30) that average plays --gate-pairs (default 8) gate
//     pairs per worker against the shipped AI; checkpoints.json lists each one
//     with its graded share, and best-checkpoint.json is the one with the best
//     90% floor (prove it over more matches with --lab strength before shipping);
//   • polls window._ewTrainSnapshot() / _ewStrengthSnapshot() and prints a
//     status line per worker (matches, matches/min, current experiment);
//   • at the deadline writes shots/train/<stamp>/worker-N.json plus
//     merged-weights.json (the merged weights, Export format: load it with
//     the Training panel's Import button, or --weights it into the next run).
//     Prove it before shipping: --lab strength with the merged file imported
//     (paired matches: the champion plays each pair's arena from both seats).
//
// Flags: --workers N  --minutes M  --lab train|strength|balance
//        --mode arena|tdm|clash|gauntlet|simul|rotate  --map rotate|<mapId>
//        --weights file.json  --baseline default|prev (strength)
//        --out dir  --render (keep drawing)  --real-clock (no virtual clock)
//        --sync-min M (training: merge the workers every M minutes, default 20)
//        --ckpt-min M --gate-pairs N (training: checkpoint gates vs the shipped AI; --ckpt-min 0 = off)
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
const SYNC_MIN = Math.max(0, parseFloat(flag('sync-min', 20)) || 0);
const CKPT_MIN = Math.max(0, parseFloat(flag('ckpt-min', 30)) || 0);
const GATE_PAIRS = Math.max(1, parseInt(flag('gate-pairs', 8), 10) || 8);
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
        if ((startWeights?._meta?.schemaVersion | 0) > 0 && (startWeights._meta.schemaVersion | 0) < 14) {
            console.log(`[runner] note: ${WEIGHTS_FILE} is schema ${startWeights._meta.schemaVersion} (${startWeights._meta.aiVersion || 'old AI'}) — played the pre-2026-10-06 Arena rules`);
        }
    }

    const serverChild = await ensureServer();
    const browser = await chromium.launch({
        headless: !HEADED,
        executablePath: process.env.PW_CHROMIUM || undefined,
        // --disable-gpu (2026-10-29): WebGL runs in the page (software) instead of a separate GPU process that burned a whole
        // core per browser on SwiftShader; the labs ran ~2x faster and booted in 10 s instead of minutes
        args: ['--disable-gpu', '--no-sandbox', '--disable-dev-shm-usage',
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
            window.EW_SPSA_NO_AUTO_GATE = true;   // THE CHECKPOINTS: the runner gates the whole run's average, not each worker its own
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
        return { idx, ctx, page, errors, shardKeys, startedAt: Date.now(), last: null, pairsAtSync: 0 };
    }

    // Shard the weight table across workers (training only) — discover the key
    // list from a probe page so this script never hard-codes the table.
    let shards = Array.from({ length: WORKERS }, () => null);
    // SPSA trains every weight on every worker (EW_TRAIN_KEYS still narrows it when set by hand): no shards
    if (LAB === 'train' && WORKERS > 1 && flag('shard', false)) {
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
            const sp = snap.t.spsa;
            extra = sp ? `${sp.pairs} pairs · mean pair result ${sp.meanY >= 0 ? '+' : ''}${sp.meanY.toFixed(3)} (≈0 when both sides are the same strength)` : `gen ${snap.t.generation}`;
        } else if (snap.kind === 'strength') {
            extra = `champ ${snap.s.champWins}-${snap.s.baseWins} (${Math.round(snap.s.winRate * 100)}%, Elo ${snap.s.eloDelta > 0 ? '+' : ''}${snap.s.eloDelta}) vs ${snap.s.baselineSource}`;
        } else {
            extra = `round ${snap.round} · phase ${snap.phase}`;
        }
        const safety = snap.t && snap.t.aiSafetyFires ? ` · ⚠ safety ${snap.t.aiSafetyFires}` : '';
        const errs = snap.errors ? ` · errors ${snap.errors}` : '';
        return `[w${w.idx}] ${m} matches (${rate}/min) · ${extra}${safety}${errs}`;
    }

    // THE SETTLING STEPS: the run's pair count (k) and every sync's θ (the second half is averaged)
    let runK = 0, gate = null;
    const syncs = [], checkpoints = [];
    async function syncWorkers() {
        const sts = [];
        for (const w of workers) { try { const st = await w.page.evaluate(() => window._ewSpsaState()); if (st && st.theta) sts.push({ w, st }); } catch (e) {} }
        if (!sts.length) return;
        // parallel SPSA: every worker's move since the last sync adds up, as if one browser had played all the pairs
        // (the page clamps each weight to its range)
        const next = {};
        for (const k of Object.keys(sts[0].st.theta)) {
            const base = (global._syncTheta && global._syncTheta[k] != null) ? global._syncTheta[k] : sts.reduce((a, x) => a + (Number(x.st.theta[k]) || 0), 0) / sts.length;
            next[k] = base + sts.reduce((a, x) => a + ((Number(x.st.theta[k]) || 0) - base), 0);
        }
        for (const x of sts) { runK += Math.max(0, (x.st.pairs || 0) - (x.w.pairsAtSync || 0)); x.w.pairsAtSync = x.st.pairs || 0; }
        for (const w of workers) { try { await w.page.evaluate(({ t, k }) => window._ewSpsaSetTheta(t, { k }), { t: next, k: runK }); } catch (e) {} }
        try { const st = await workers[0].page.evaluate(() => window._ewSpsaState()); global._syncTheta = (st && st.theta) || next; } catch (e) { global._syncTheta = next; }
        syncs.push({ k: runK, theta: global._syncTheta });
        console.log(`[runner] merged the moves of ${sts.length} workers · ${runK} pairs in the run`);
    }
    function tailAverage() {
        const rows = syncs.filter(s => s.k >= runK / 2).map(s => s.theta);
        if (!rows.length) return global._syncTheta || null;
        const avg = {};
        for (const k of Object.keys(rows[0])) avg[k] = rows.reduce((a, t) => a + (Number(t[k]) || 0), 0) / rows.length;
        return avg;
    }

    while (Date.now() < deadline) {
        await sleep(Math.min(POLL_S * 1000, Math.max(1000, deadline - Date.now())));
        const lines = [];
        for (const w of workers) lines.push(statusLine(w, await snapshot(w)));
        console.log(`── ${fmtMin(Date.now() - t0)} / ${MINUTES}m ──`);
        for (const l of lines) console.log(l);
        if (LAB === 'train' && gate) {
            // THE CHECKPOINTS: wait for every worker's gate pairs, then file the checkpoint
            const parts = [];
            for (const w of workers) { try { parts.push(await w.page.evaluate((id) => { const c = ((window._ewSpsaState() || {}).ckpts || []).find(c => c.id === id); return c ? { pairs: c.pairs, sumY: c.sumY, sumY2: c.sumY2, done: c.done } : null; }, gate.id)); } catch (e) { parts.push(null); } }
            const ok = parts.filter(Boolean);
            if ((ok.length === workers.length && ok.every(p => p.done)) || Date.now() - gate.at > 30 * 60000) {
                const n = ok.reduce((a, p) => a + p.pairs, 0), sy = ok.reduce((a, p) => a + p.sumY, 0), sy2 = ok.reduce((a, p) => a + p.sumY2, 0);
                const m = n ? sy / n : 0, v = n > 1 ? Math.max(0, (sy2 - n * m * m) / (n - 1)) : 1, se = Math.sqrt(v / Math.max(1, n)) / 2;
                Object.assign(gate.ck, { pairs: n, share: 0.5 + m / 2, se, lo90: 0.5 + m / 2 - 1.2816 * se });
                checkpoints.push(gate.ck);
                fs.writeFileSync(path.join(OUT, 'checkpoints.json'), JSON.stringify(checkpoints, null, 1));
                console.log(`[runner] checkpoint ${gate.ck.id} (pair ${gate.ck.k}) vs the shipped AI: ${(gate.ck.share * 100).toFixed(1)}% ±${(se * 196).toFixed(1)} over ${n} pairs (90% floor ${(gate.ck.lo90 * 100).toFixed(1)}%)`);
                gate = null; global._lastCkpt = Date.now(); global._lastSync = Date.now();
            }
            continue;
        }
        if (LAB === 'train' && SYNC_MIN > 0 && workers.length > 1 && Date.now() - (global._lastSync || t0) > SYNC_MIN * 60000) {
            global._lastSync = Date.now();
            await syncWorkers();
        }
        if (LAB === 'train' && CKPT_MIN > 0 && Date.now() - (global._lastCkpt || t0) > CKPT_MIN * 60000) {
            if (workers.length > 1) await syncWorkers();
            const id = checkpoints.length + 1, theta = tailAverage();
            if (theta) {
                for (const w of workers) { try { await w.page.evaluate(({ t, n, id }) => window._ewSpsaGate(t, n, id), { t: theta, n: GATE_PAIRS, id }); } catch (e) {} }
                gate = { id, at: Date.now(), ck: { id, k: runK, theta } };
                console.log(`[runner] checkpoint ${id} at pair ${runK}: ${GATE_PAIRS} gate pairs per worker vs the shipped AI`);
            } else global._lastCkpt = Date.now();
        }
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
        // The browser already applied the start weights (and dropped what an old-schema
        // export can't carry), so a worker's own value for a key it never tested IS the start.
        for (const k of Object.keys(base)) merged[k] = base[k].value ?? base[k].default;
        // SPSA: one last sync (the same sum the syncs apply), then THE SETTLING STEPS answer = the second-half average of θ
        // (the CPU's own table no longer follows θ since THE CHECKPOINTS, so θ is read from the SPSA state)
        if (workers.length > 1) { try { await syncWorkers(); } catch (e) {} }
        else { try { const st = await workers[0].page.evaluate(() => window._ewSpsaState()); if (st && st.theta) { runK = st.k || st.pairs || 0; syncs.push({ k: runK, theta: st.theta }); global._syncTheta = st.theta; } } catch (e) {} }
        const avgT = tailAverage();
        if (avgT) for (const k of Object.keys(base)) if (avgT[k] != null) merged[k] = Math.round(Math.max(base[k].min, Math.min(base[k].max, avgT[k])) * 10000) / 10000;
        if (global._syncTheta) fs.writeFileSync(path.join(OUT, 'raw-theta.json'), JSON.stringify(global._syncTheta, null, 1));
        if (checkpoints.length) {
            const best = checkpoints.slice().sort((a, b) => b.lo90 - a.lo90)[0];
            fs.writeFileSync(path.join(OUT, 'best-checkpoint.json'), JSON.stringify(best, null, 1));
            console.log(`[runner] best checkpoint ${best.id} (pair ${best.k}): ${(best.share * 100).toFixed(1)}% vs the shipped AI, 90% floor ${(best.lo90 * 100).toFixed(1)}% — ${best.lo90 > 0.5 ? 'past the noise: prove it with --lab strength' : 'inside the noise'}`);
        }
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
                rules: finals.find(Boolean)?.t?.rules || null,
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
