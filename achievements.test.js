// achievements.test.js — validates the ACH_CATALOG / ACH_CHAMP_LINES /
// ACH_RECORD_DEFS registries in data.js (ACHIEVEMENTS_PLAN.md Phases 1-3).
// Runs via `npm test` (node --test).
// Zero dependencies; loads the REAL data.js through load-data.js.

'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { loadGameData } = require('./load-data.js');

const data = loadGameData();

test('ACH_CATALOG exists and is exported', () => {
    assert.ok(Array.isArray(data.ACH_CATALOG), 'ACH_CATALOG must be an array');
    assert.ok(data.ACH_CATALOG.length >= 20, 'catalog unexpectedly small');
    assert.ok(Array.isArray(data.ACH_CHAMP_LINES), 'ACH_CHAMP_LINES must be an array');
    assert.ok(Array.isArray(data.ACH_TIER_NAMES), 'ACH_TIER_NAMES must be an array');
    assert.ok(Array.isArray(data.ACH_TIER_COLORS), 'ACH_TIER_COLORS must be an array');
});

test('catalog lines are well-formed', () => {
    const ids = new Set();
    const metrics = new Set();
    for (const line of data.ACH_CATALOG) {
        assert.ok(line.id && typeof line.id === 'string', 'line missing id');
        assert.ok(!ids.has(line.id), `duplicate id: ${line.id}`);
        ids.add(line.id);
        assert.ok(line.metric && typeof line.metric === 'string', `${line.id}: missing metric`);
        assert.ok(!metrics.has(line.metric), `${line.id}: metric ${line.metric} used by two lines`);
        metrics.add(line.metric);
        assert.ok(line.name && line.desc && line.icon, `${line.id}: missing name/desc/icon`);
        assert.ok(['combat', 'support', 'battlefield', 'objectives', 'modes'].includes(line.cat),
            `${line.id}: unknown category ${line.cat}`);
        assert.ok(Array.isArray(line.tiers) && line.tiers.length >= 2 && line.tiers.length <= 6,
            `${line.id}: tiers must have 2-6 entries`);
        for (let i = 0; i < line.tiers.length; i++) {
            assert.ok(Number.isInteger(line.tiers[i]) && line.tiers[i] > 0,
                `${line.id}: tier ${i} must be a positive integer`);
            if (i > 0) assert.ok(line.tiers[i] > line.tiers[i - 1],
                `${line.id}: tiers must be strictly ascending`);
        }
        // Tier count never exceeds the shared name/color ladders.
        assert.ok(line.tiers.length <= data.ACH_TIER_NAMES.length, `${line.id}: more tiers than tier names`);
        assert.ok(line.tiers.length <= data.ACH_TIER_COLORS.length, `${line.id}: more tiers than tier colors`);
    }
});

test('unlock keys cannot collide between standard and champ lines', () => {
    // Standard keys are `${id}.${i}`; champ keys are `champ.${race}.${metric}.${i}`.
    // A standard line id starting with 'champ.' would collide with the champ
    // namespace.
    for (const line of data.ACH_CATALOG) {
        assert.ok(!line.id.startsWith('champ.'), `${line.id}: id collides with champ.* namespace`);
        assert.ok(!line.id.startsWith('feat_'), `${line.id}: id collides with feat_* (legacy migration) namespace`);
        assert.ok(!line.id.includes('..'), `${line.id}: id must not contain '..'`);
    }
});

test('champ lines are well-formed', () => {
    const metrics = new Set();
    for (const spec of data.ACH_CHAMP_LINES) {
        assert.ok(spec.metric && !metrics.has(spec.metric), 'champ line metric missing or duplicated');
        metrics.add(spec.metric);
        assert.ok(spec.name && spec.icon, `champ line ${spec.metric}: missing name/icon`);
        assert.ok(Array.isArray(spec.tiers) && spec.tiers.length >= 2, `champ line ${spec.metric}: bad tiers`);
        for (let i = 1; i < spec.tiers.length; i++) {
            assert.ok(spec.tiers[i] > spec.tiers[i - 1], `champ line ${spec.metric}: tiers must ascend`);
        }
    }
    // The three mastery ladders the plan defines (§4.1).
    for (const m of ['kills', 'wins', 'deathless']) {
        assert.ok(metrics.has(m), `champ line missing: ${m}`);
    }
});

test('win-condition metrics stay in sync with the engine strings', () => {
    // battle.js commitAchProgress maps state._winCondition → these metrics;
    // every mapped metric must exist as a catalog line so wins are never
    // counted into a line no UI will ever show.
    const catalogMetrics = new Set(data.ACH_CATALOG.map(l => l.metric));
    const expected = [
        'wins_wipeout', 'wins_tower', 'wins_hourglass', 'wins_nexus',
        'wins_composite', 'wins_suddenDeath', 'wins_flags',
        'wins_arena', 'wins_tdm', 'wins_clash', 'wins_simul', 'wins_gauntlet',
        'wins_total', 'md_clears',
    ];
    for (const m of expected) {
        assert.ok(catalogMetrics.has(m), `catalog missing win metric: ${m}`);
    }
});

test('high-water lines are marked', () => {
    // Streak/best-run/mastery-count metrics merge by max(), not addition
    // (battle.js hw() + _achEvaluateTiers) — the flags must match exactly.
    const HW = new Set(['bestStreak', 'challenge_runWins', 'survival_bestStreak',
        'md_bestFloor', 'champsMastered']);
    for (const m of HW) {
        const line = data.ACH_CATALOG.find(l => l.metric === m);
        assert.ok(line, `hw line missing: ${m}`);
        assert.strictEqual(line.hw, true, `${m} must be a high-water (hw) line`);
    }
    // Everything else is additive.
    for (const line of data.ACH_CATALOG) {
        if (!HW.has(line.metric)) {
            assert.ok(!line.hw, `${line.id}: unexpected hw flag`);
        }
    }
});

test('Phase-2 deferred metrics exist in the catalog', () => {
    const metrics = new Set(data.ACH_CATALOG.map(l => l.metric));
    for (const m of ['tilesChanged', 'flyersGrounded', 'comebacks',
        'challenge_runWins', 'survival_bestStreak', 'md_bestFloor', 'champsMastered']) {
        assert.ok(metrics.has(m), `catalog missing Phase-2 metric: ${m}`);
    }
});

test('tier rewards cover every tier and are sane (§4.7)', () => {
    const r = data.ACH_TIER_REWARDS;
    assert.ok(Array.isArray(r), 'ACH_TIER_REWARDS must be an array');
    const maxTiers = Math.max(...data.ACH_CATALOG.map(l => l.tiers.length),
        ...data.ACH_CHAMP_LINES.map(s => s.tiers.length));
    assert.ok(r.length >= maxTiers, `rewards array shorter than deepest ladder (${r.length} < ${maxTiers})`);
    for (let i = 0; i < r.length; i++) {
        assert.ok(Number.isInteger(r[i]) && r[i] > 0, `reward ${i} must be a positive integer`);
        if (i > 0) assert.ok(r[i] >= r[i - 1], 'rewards must be non-decreasing by tier');
    }
});

test('mastery bar matches the champ ladders (§4.1)', () => {
    const M = data.ACH_MASTERY;
    assert.ok(M && typeof M === 'object', 'ACH_MASTERY missing');
    // Each requirement must be an actual threshold on its champ ladder —
    // and deliberately NOT the top tier (the meta-chase must stay human).
    for (const [metric, req] of Object.entries(M)) {
        const spec = data.ACH_CHAMP_LINES.find(s => s.metric === metric);
        assert.ok(spec, `ACH_MASTERY references unknown champ line: ${metric}`);
        assert.ok(spec.tiers.includes(req), `${metric} mastery bar ${req} is not a ladder threshold`);
        assert.ok(req < spec.tiers[spec.tiers.length - 1], `${metric} mastery bar must sit below the top tier`);
    }
    // The Heat Death line's final tier equals the roster size.
    const heatDeath = data.ACH_CATALOG.find(l => l.metric === 'champsMastered');
    assert.strictEqual(heatDeath.tiers[heatDeath.tiers.length - 1], data.AVAILABLE_RACES.length,
        'champsMastered top tier must equal the champ roster size');
});

test('record defs are well-formed (§5, Phase 3)', () => {
    const defs = data.ACH_RECORD_DEFS;
    assert.ok(Array.isArray(defs) && defs.length >= 8, 'ACH_RECORD_DEFS missing or too small');
    const ids = new Set();
    for (const def of defs) {
        assert.ok(def.id && typeof def.id === 'string', 'record def missing id');
        assert.ok(!ids.has(def.id), `duplicate record id: ${def.id}`);
        ids.add(def.id);
        assert.ok(def.name && def.desc && def.icon, `${def.id}: missing name/desc/icon`);
        assert.ok(['dmg', 'count', 'hp', 'ms'].includes(def.fmt), `${def.id}: unknown fmt ${def.fmt}`);
        // min (lower-is-better) records can't be judged mid-match — they
        // must be end-only or the live poll would banner every early value.
        if (def.min) assert.strictEqual(def.end, true, `${def.id}: min records must be end-only`);
    }
    // The records battle.js commits (commitAchProgress → _recCommitRecords)
    // and polls live (_recLiveMatchValues) — every one must exist here, and
    // the live set must not be marked end-only.
    const LIVE = ['biggestHit', 'dmgTurn', 'dmgRound', 'killStreak', 'biggestOverkill'];
    const END = ['mostKills', 'mostHealing', 'towerDmg', 'fastestWin', 'longestMatch'];
    for (const id of LIVE) {
        const def = defs.find(d => d.id === id);
        assert.ok(def, `record def missing: ${id}`);
        assert.ok(!def.end, `${id} is measured live — must not be end-only`);
    }
    for (const id of END) {
        const def = defs.find(d => d.id === id);
        assert.ok(def, `record def missing: ${id}`);
        assert.strictEqual(def.end, true, `${id} is only measurable at match end`);
    }
    assert.strictEqual(defs.length, LIVE.length + END.length,
        'record defs added in data.js without a matching value source in battle.js');
    // Record ids share profile.progress with nothing else, but keep the
    // namespaces clean anyway (future unified trophy case).
    for (const def of defs) {
        assert.ok(!def.id.startsWith('champ.') && !def.id.startsWith('feat_'),
            `${def.id}: id collides with a reserved namespace`);
    }
});

/* ═══ Phase 5 — progress sync merge + reward helpers (plan §7) ══════════ */

test('progress-sync helpers are exported', () => {
    for (const fn of ['mergeProgressBlobs', 'achUnlockKeyReward',
        'achCountMasteredChamps', 'achComputeSyncRewards']) {
        assert.strictEqual(typeof data[fn], 'function', `data.js must export ${fn}`);
    }
});

test('mergeProgressBlobs: G-counter join semantics', () => {
    const merge = data.mergeProgressBlobs;
    const a = {
        v: 2,
        counters: { kills: { pvp: 5, cpu: 10, legacy: 3 }, backstabs: { pvp: 1, cpu: 0, legacy: 0 } },
        champs: { wizard: { kills: { pvp: 2, cpu: 4, legacy: 0 } } },
        records: {
            biggestHit: { pvp: { value: 200, ts: 1000, meta: { mode: 'arena' } } },
            fastestWin: { cpu: { value: 90000, ts: 1000, meta: { mode: 'tdm' } } },
        },
        unlocked: { 'kills.0': 500, 'feat_ace': 900 },
    };
    const b = {
        v: 2,
        counters: { kills: { pvp: 8, cpu: 2, legacy: 3 } },
        champs: { wizard: { kills: { pvp: 1, cpu: 9, legacy: 0 }, wins: { pvp: 1, cpu: 0, legacy: 0 } } },
        records: {
            biggestHit: { pvp: { value: 150, ts: 2000, meta: { mode: 'clash' } } },
            fastestWin: { cpu: { value: 70000, ts: 2000, meta: { mode: 'tdm' } } },
        },
        unlocked: { 'kills.0': 400, 'kills.1': 800 },
    };
    // merge() runs inside the load-data vm sandbox, so its objects carry the
    // vm realm's prototypes — JSON-normalize before deep comparisons.
    const norm = o => JSON.parse(JSON.stringify(o));
    const m = merge(a, b);
    // Counters: per-bucket max, union of metrics.
    assert.deepStrictEqual(norm(m.counters.kills), { pvp: 8, cpu: 10, legacy: 3 });
    assert.deepStrictEqual(norm(m.counters.backstabs), { pvp: 1, cpu: 0, legacy: 0 });
    // Champ bags: same join.
    assert.deepStrictEqual(norm(m.champs.wizard.kills), { pvp: 2, cpu: 9, legacy: 0 });
    assert.deepStrictEqual(norm(m.champs.wizard.wins), { pvp: 1, cpu: 0, legacy: 0 });
    // Records: max wins for normal records, MIN for fastestWin (min: true).
    assert.strictEqual(m.records.biggestHit.pvp.value, 200);
    assert.strictEqual(m.records.biggestHit.pvp.meta.mode, 'arena');
    assert.strictEqual(m.records.fastestWin.cpu.value, 70000);
    // Unlocked: union, earliest timestamp wins.
    assert.strictEqual(m.unlocked['kills.0'], 400);
    assert.strictEqual(m.unlocked['kills.1'], 800);
    assert.strictEqual(m.unlocked['feat_ace'], 900);
    // Commutative on values and idempotent (CRDT join — §2.3).
    assert.deepStrictEqual(norm(merge(b, a)), norm(m));
    assert.deepStrictEqual(norm(merge(m, m)), norm(m));
    assert.deepStrictEqual(norm(merge(m, a)), norm(m));
});

test('mergeProgressBlobs: sanitizes hostile/garbage input', () => {
    const merge = data.mergeProgressBlobs;
    const evil = {
        counters: {
            'bad metric!': { pvp: 5 },                       // bad name → dropped
            // computed key = a real own property (a plain '__proto__' literal
            // would set the test object's prototype instead) — this is exactly
            // what JSON.parse hands the server, and it must be dropped.
            ['__proto__']: { pvp: 5 },
            kills: { pvp: -50, cpu: Infinity, legacy: 'x' },  // clamped to 0 / capped
            crits: { pvp: 1e15 },                             // capped at 1e9
        },
        champs: {
            'dot.race': { kills: { pvp: 1 } },   // '.' breaks unlock-key parsing → dropped
            wizard: { notALadder: { pvp: 9 }, kills: { pvp: 3 } },
        },
        records: {
            fakeRecord: { pvp: { value: 5, ts: 1 } },         // unknown id → dropped
            biggestHit: { pvp: { value: 'NaN', ts: 1 } },     // bad value → dropped
        },
        unlocked: { 'ok_key.1': 100, ' bad': 100, ['__proto__']: 100 },
        junkTopLevel: { huge: true },                          // unknown field → dropped
    };
    const norm = o => JSON.parse(JSON.stringify(o)); // vm-realm prototypes, as above
    const m = merge(evil, null);
    assert.deepStrictEqual(Object.keys(m.counters).sort(), ['crits', 'kills']);
    assert.deepStrictEqual(norm(m.counters.kills), { pvp: 0, cpu: 0, legacy: 0 });
    assert.strictEqual(m.counters.crits.pvp, 1e9);
    assert.deepStrictEqual(Object.keys(m.champs), ['wizard']);
    assert.deepStrictEqual(Object.keys(m.champs.wizard), ['kills']);
    assert.deepStrictEqual(norm(m.records), {});
    assert.deepStrictEqual(Object.keys(m.unlocked), ['ok_key.1']);
    assert.strictEqual(m.junkTopLevel, undefined);
    // The evil '__proto__' bag must not have become the counters' prototype.
    assert.strictEqual(Object.getPrototypeOf(m.counters).pvp, undefined, 'prototype must be untouched');
    // Null/garbage inputs yield a clean empty blob.
    assert.deepStrictEqual(norm(merge(null, undefined)), { v: 2, counters: {}, champs: {}, records: {}, unlocked: {} });
});

test('achUnlockKeyReward mirrors the client payout rules (§4.7)', () => {
    const R = data.ACH_TIER_REWARDS;
    const reward = data.achUnlockKeyReward;
    assert.strictEqual(reward('kills.0'), R[0]);
    assert.strictEqual(reward('kills.5'), R[5]);           // 6-tier line, top tier
    assert.strictEqual(reward('kills.9'), 0);              // past the ladder
    assert.strictEqual(reward('wins_clash.3'), R[3]);      // 4-tier line, top tier
    assert.strictEqual(reward('wins_clash.4'), 0);
    assert.strictEqual(reward('feat_ace'), 0);             // legacy one-shots never pay
    assert.strictEqual(reward('champ.wizard.kills.2'), R[2]);
    assert.strictEqual(reward('champ.men in black.deathless.3'), R[3]);
    assert.strictEqual(reward('champ.wizard.kills.9'), 0);
    assert.strictEqual(reward('champ.notarealrace.kills.1'), 0);
    assert.strictEqual(reward('champ.wizard.notALadder.1'), 0);
    assert.strictEqual(reward('noSuchLine.1'), 0);
    assert.strictEqual(reward('kills'), 0);                // no tier suffix
});

test('achComputeSyncRewards: pays only newly-merged keys + mastery crossings', () => {
    const R = data.ACH_TIER_REWARDS;
    const M = data.ACH_MASTERY;
    const before = {
        counters: {},
        champs: { wizard: { kills: { pvp: M.kills, cpu: 0, legacy: 0 }, wins: { pvp: M.wins, cpu: 0, legacy: 0 }, deathless: { pvp: M.deathless - 1, cpu: 0, legacy: 0 } } },
        unlocked: { 'kills.0': 100 },
    };
    const after = {
        counters: {},
        champs: { wizard: { kills: { pvp: M.kills, cpu: 0, legacy: 0 }, wins: { pvp: M.wins, cpu: 0, legacy: 0 }, deathless: { pvp: M.deathless, cpu: 0, legacy: 0 } } },
        unlocked: { 'kills.0': 100, 'kills.1': 200, 'feat_ace': 200, 'champ.wizard.deathless.1': 200 },
    };
    const r = data.achComputeSyncRewards(before, after);
    assert.strictEqual(r.gold, R[1] + R[1]);   // kills.1 + champ deathless tier 1; feat pays 0
    assert.strictEqual(r.tokens, 1);           // wizard crossed the mastery bar
    // Idempotent: nothing new → nothing paid.
    const r2 = data.achComputeSyncRewards(after, after);
    assert.strictEqual(r2.gold, 0);
    assert.strictEqual(r2.tokens, 0);
});

test('server.js wires the Phase-5 sync surface', () => {
    // Source-text drift guard in the spirit of check-data-parity: the server
    // must expose the endpoints and run the SAME shared helpers from data.js.
    const fs = require('node:fs');
    const src = fs.readFileSync(require('node:path').join(__dirname, 'server.js'), 'utf8');
    for (const needle of ['/api/progress/sync', "'/api/progress'", 'player_progress',
        'mergeProgressBlobs', 'achComputeSyncRewards']) {
        assert.ok(src.includes(needle), `server.js missing: ${needle}`);
    }
    assert.ok(fs.existsSync(require('node:path').join(__dirname, 'migrations', '004_progress.sql')),
        'migrations/004_progress.sql missing');
});

/* ═══ Phase 6 — curated Steam schema (plan §8) ═══════════════════════════ */

test('STEAM_ACH_DEFS: well-formed, unique, under the 100-cap', () => {
    const defs = data.STEAM_ACH_DEFS;
    assert.ok(Array.isArray(defs) && defs.length >= 20, 'STEAM_ACH_DEFS missing or unexpectedly small');
    assert.ok(defs.length <= 100, `Valve caps new games at 100 achievements; have ${defs.length}`);
    const ids = new Set();
    for (const d of defs) {
        assert.match(d.id, /^ACH_[A-Z0-9_]{1,58}$/, `bad Steam API name: ${d.id}`);
        assert.ok(!ids.has(d.id), `duplicate Steam id: ${d.id}`);
        ids.add(d.id);
        assert.ok(d.name && typeof d.name === 'string', `${d.id}: missing name`);
        assert.ok(d.desc && typeof d.desc === 'string', `${d.id}: missing desc`);
        assert.ok(['stat', 'feat'].includes(d.kind), `${d.id}: unknown kind ${d.kind}`);
    }
});

test('STEAM_STAT_DEFS: unique ids, every metric backs a real catalog line', () => {
    const stats = data.STEAM_STAT_DEFS;
    assert.ok(Array.isArray(stats) && stats.length > 0);
    const metricSet = new Set(data.ACH_CATALOG.map(l => l.metric));
    const ids = new Set();
    for (const s of stats) {
        assert.match(s.id, /^[a-z0-9_]{1,32}$/i, `bad Steam stat name: ${s.id}`);
        assert.ok(!ids.has(s.id), `duplicate Steam stat: ${s.id}`);
        ids.add(s.id);
        if (s.metric) {
            assert.ok(metricSet.has(s.metric), `${s.id}: metric ${s.metric} not in ACH_CATALOG`);
        } else {
            assert.ok(['champsWon', 'champsMastered'].includes(s.derived),
                `${s.id}: unknown derived source ${s.derived}`);
        }
    }
});

test('stat-backed Steam defs land exactly on in-game tier thresholds', () => {
    const statById = new Map(data.STEAM_STAT_DEFS.map(s => [s.id, s]));
    const lineByMetric = new Map(data.ACH_CATALOG.map(l => [l.metric, l]));
    const roster = data.AVAILABLE_RACES.length;
    for (const d of data.STEAM_ACH_DEFS) {
        if (d.kind !== 'stat') continue;
        const stat = statById.get(d.stat);
        assert.ok(stat, `${d.id}: references unknown stat ${d.stat}`);
        assert.ok(Number.isInteger(d.threshold) && d.threshold > 0, `${d.id}: bad threshold`);
        if (stat.metric) {
            const line = lineByMetric.get(stat.metric);
            assert.ok(line.tiers.includes(d.threshold),
                `${d.id}: threshold ${d.threshold} is not a tier of ${line.id} (${line.tiers}) — Steam would unlock out of step with the in-game tier`);
        }
    }
    // The collapsed champion set tops out at the full roster (like Heat Death
    // in the in-game catalog, which is pinned to roster size elsewhere).
    const heat = data.STEAM_ACH_DEFS.find(d => d.id === 'ACH_HEAT_DEATH');
    assert.ok(heat && heat.stat === 'champs_mastered' && heat.threshold === roster,
        'ACH_HEAT_DEATH must require mastering the whole roster');
    const allWon = data.STEAM_ACH_DEFS.find(d => d.id === 'ACH_CHAMPS_WON_ALL');
    assert.ok(allWon && allWon.stat === 'champs_won' && allWon.threshold === roster,
        'ACH_CHAMPS_WON_ALL must require winning with the whole roster');
});

test('feat Steam defs mirror battle.js ACHIEVEMENT_DEFS 1:1 (source-text guard)', () => {
    const fs = require('node:fs');
    const src = fs.readFileSync(require('node:path').join(__dirname, 'battle.js'), 'utf8');
    const block = src.match(/const ACHIEVEMENT_DEFS = \{[\s\S]*?\n {8}\};/);
    assert.ok(block, 'could not locate ACHIEVEMENT_DEFS in battle.js');
    const legacyIds = [...block[0].matchAll(/^\s{12}([A-Za-z0-9]+): \{/gm)].map(m => m[1]);
    assert.ok(legacyIds.length >= 14, `unexpectedly few legacy defs parsed (${legacyIds.length})`);
    const featDefs = data.STEAM_ACH_DEFS.filter(d => d.kind === 'feat');
    const featIds = new Set(featDefs.map(d => d.feat));
    for (const d of featDefs) {
        assert.ok(legacyIds.includes(d.feat), `${d.id}: feat '${d.feat}' not in battle.js ACHIEVEMENT_DEFS`);
    }
    for (const id of legacyIds) {
        assert.ok(featIds.has(id), `legacy achievement '${id}' has no Steam mirror (§8.2 says feats go 1:1)`);
    }
});

test('steamComputeStats: bucket sums, hw max, derived roster stats', () => {
    const prog = {
        counters: {
            kills: { pvp: 3, cpu: 4, legacy: 5 },          // sum = 12
            bestStreak: { pvp: 3, cpu: 9, legacy: 2 },      // hw line → max = 9
        },
        champs: {
            wizard: { wins: { pvp: 1, cpu: 0, legacy: 0 },
                kills: { pvp: data.ACH_MASTERY.kills, cpu: 0, legacy: 0 },
                deathless: { pvp: data.ACH_MASTERY.deathless, cpu: 0, legacy: 0 } },
            gnome: { wins: { pvp: 0, cpu: 0, legacy: 0 } }, // 0 wins → not "won"
        },
        unlocked: {},
    };
    // push wizard.wins over the mastery bar so champs_mastered = 1
    prog.champs.wizard.wins.cpu = data.ACH_MASTERY.wins;
    const stats = data.steamComputeStats(prog);
    assert.strictEqual(stats.kills, 12);
    assert.strictEqual(stats.bestStreak, 9);
    assert.strictEqual(stats.champs_won, 1);
    assert.strictEqual(stats.champs_mastered, 1);
    // Empty blob: every stat defined, all zero.
    const zero = data.steamComputeStats({ counters: {}, champs: {}, unlocked: {} });
    for (const s of data.STEAM_STAT_DEFS) assert.strictEqual(zero[s.id], 0, `${s.id} not zero on empty blob`);
});

test('steamEvalAchievements: stat crossings + feats from either store', () => {
    const killsLine = data.ACH_CATALOG.find(l => l.id === 'kills');
    const th = data.STEAM_ACH_DEFS.find(d => d.id.startsWith('ACH_KILLS_')).threshold;
    const prog = {
        counters: { kills: { pvp: th, cpu: 0, legacy: 0 } },
        champs: {},
        unlocked: { 'feat_ace': 123 },      // migrated mirror
    };
    const legacy = { firstBlood: { unlockedAt: '2026-01-01' } };  // live legacy store
    const earned = new Set(data.steamEvalAchievements(prog, legacy));
    assert.ok(earned.has('ACH_KILLS_' + th), 'stat-backed unlock missing');
    assert.ok(earned.has('ACH_FEAT_ACE'), 'feat via progress.unlocked mirror missing');
    assert.ok(earned.has('ACH_FEAT_FIRSTBLOOD'), 'feat via legacy achievements store missing');
    assert.ok(!earned.has('ACH_FEAT_RAMPAGE'), 'unearned feat leaked');
    assert.ok(!earned.has('ACH_HEAT_DEATH'), 'unearned stat achievement leaked');
    // Pure: same inputs, same answer (boot re-assert calls this repeatedly).
    // (Spread both sides — vm-sandbox arrays carry a foreign Array prototype.)
    assert.deepStrictEqual([...data.steamEvalAchievements(prog, legacy)],
        [...data.steamEvalAchievements(prog, legacy)]);
    assert.ok(killsLine, 'kills line vanished');
});

test('battle.js + tooling wire the Phase-6 Steam surface (drift guard)', () => {
    const fs = require('node:fs');
    const path = require('node:path');
    const src = fs.readFileSync(path.join(__dirname, 'battle.js'), 'utf8');
    for (const needle of ['_steamPushProgress(prog)', '_steamAssertFeat(', 'window.SteamGlue',
        'steamComputeStats', 'steamEvalAchievements']) {
        assert.ok(src.includes(needle), `battle.js missing: ${needle}`);
    }
    for (const f of ['electron/main.js', 'electron/preload.js', 'electron/steam.js',
        'electron/package.json', 'steam-schema.js']) {
        assert.ok(fs.existsSync(path.join(__dirname, f)), `missing Phase-6 tooling file: ${f}`);
    }
});
