// capture-prize.test.js — THE ONE-WAY DOOR, Phase 4 THE PRIZE (CAPTURE_PLAN.md §2.6 / §6, 2026-09-25):
// what a sealed native becomes after a win. The party → roster → bounty paths (data.js hqCaptureEnlist), the
// BOUNTY LEDGER (hq.bounties — per day, per door tier, a daily ceiling; the merge, the fold and the server's pay),
// the SERVER UNION (a race on the synced captured ledger joins unlocked_units — server.js unionCapturedUnits over
// data.js hqCapturedUnlockUnion), the LOCAL MIRROR (profile.js localCaptureUnit / _unionCapturedIntoMirror), the
// commit's wiring, THE CAPTURES card on the debrief and the return toast. Repo-only.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { loadGameData } = require('./load-data');
const D = loadGameData(), R = D.CAPTURE_RULES;
const g = name => vm.runInContext(name, D);
const J = o => JSON.parse(JSON.stringify(o));
const deq = (a, b, m) => assert.deepEqual(J(a), J(b), m);
const read = f => fs.readFileSync(__dirname + '/' + f, 'utf8');
const BT = read('battle.js'), SV = read('server.js'), PF = read('profile.js'), MP = read('map.js'), IX = read('index.html'), CSS = read('styles-cinematic.css');
const profile = (units) => ({ username: 'MONDO', account: { gold: 0, unlockedUnits: units || ['knight', 'wizard', 'door agent', 'homosapien'] }, door: {}, progress: { v: 2, hq: {} } });
const DAY = '2026-09-25';

test('THE PRIZE: party first, the roster for a new race with the party full, a bounty for an owned one — each bounty filed on the ledger', () => {
    const p = profile();
    const inParty = () => g('hqPartyRecord')(p) ? g('hqPartyRecord')(p).members.map(m => m.meta.race) : [];
    g('hqPartyEnsure')(p);
    const fresh = D.AVAILABLE_RACES.filter(r => p.account.unlockedUnits.indexOf(r) < 0 && (D.ACCT_STARTER_UNITS || []).indexOf(r) < 0 && inParty().indexOf(r) < 0);
    const r1 = g('hqCaptureEnlist')(p, [{ race: fresh[0], name: 'Zed', tier: 1 }], { date: DAY });
    assert.equal(r1.rows[0].to, 'party');
    assert.equal(r1.rows[0].owned, false, 'a new race: the row says so (the commit adds it to the mirror roster)');
    const ownedOff = p.account.unlockedUnits.concat(D.ACCT_STARTER_UNITS || []).find(r => inParty().indexOf(r) < 0);
    assert.ok(ownedOff, 'the fixture: an owned race off the party');
    const r2 = g('hqCaptureEnlist')(p, [{ race: ownedOff, tier: 2 }], { date: DAY });
    deq([r2.rows[0].to, r2.gold], ['party', 0], 'an owned race with a free slot still joins the party (no bounty)');
    const size = g('hqPartyRecord')(p).members.length;
    g('hqCaptureEnlist')(p, fresh.slice(1, 1 + D.HQ_PARTY_RULES.roster - size).map(race => ({ race, tier: 1 })), { date: DAY });
    const r3 = g('hqCaptureEnlist')(p, [{ race: 'knight', tier: 2 }], { date: DAY });
    deq([r3.rows[0].to, r3.gold], ['bounty', R.bounty[2]], 'a full party + an owned race: the bounty');
    deq(g('hqCaptureBountyRecord')(p), { [DAY]: [0, 1, 0] }, 'the bounty is on the ledger (tier II)');
    deq(p.door.hq.bounties, p.progress.hq.bounties, 'local and synced carry the same ledger');
});

test('THE BOUNTY LEDGER: a daily ceiling per tier — past it the bounty pays nothing', () => {
    const p = profile();
    for (let i = 0; i < R.bountyPerDay; i++) assert.equal(g('hqCaptureBountyMark')(p, 3, DAY), true);
    assert.equal(g('hqCaptureBountyMark')(p, 3, DAY), false, 'the ceiling');
    assert.equal(g('hqCaptureBountyMark')(p, 1, DAY), true, 'another tier has its own');
    assert.equal(g('hqCaptureBountyMark')(p, 3, '2026-09-26'), true, 'a new day');
    // hqCaptureEnlist on a capped day: the row says so, no gold
    const q = profile(); for (let i = 0; i < R.bountyPerDay; i++) g('hqCaptureBountyMark')(q, 1, DAY);
    const full = g('hqPartyRecord'); g('hqPartyEnsure')(q);
    const fresh = D.AVAILABLE_RACES.filter(r => q.account.unlockedUnits.indexOf(r) < 0 && (D.ACCT_STARTER_UNITS || []).indexOf(r) < 0 && full(q).members.every(m => m.meta.race !== r));
    g('hqCaptureEnlist')(q, fresh.slice(0, D.HQ_PARTY_RULES.roster).map(race => ({ race, tier: 1 })), { date: DAY });
    assert.equal(full(q).members.length, D.HQ_PARTY_RULES.roster);
    const r = g('hqCaptureEnlist')(q, [{ race: 'knight', tier: 1 }], { date: DAY });
    deq([r.rows[0].to, r.rows[0].gold, r.rows[0].reason, r.gold], ['bounty', 0, 'cap', 0]);
});

test('THE MERGE + THE PAY: per-tier max per day, clamped, garbage dropped, the newest days kept; the server pays the growth once', () => {
    const merge = g('mergeProgressBlobs'), pay = g('hqCaptureBountySyncPay');
    const a = { v: 2, hq: { bounties: { [DAY]: [1, 0, 0] } } };
    const b = { v: 2, hq: { bounties: { [DAY]: [0, 2, 999], 'nope': [5, 5, 5], '2026-09-24': 'x' } } };
    const m = merge(a, b);
    deq(m.hq.bounties, { [DAY]: [1, 2, R.bountyPerDay] });
    assert.equal(pay(a, m), 2 * R.bounty[2] + R.bountyPerDay * R.bounty[3], 'the growth');
    assert.equal(pay(m, m), 0, 'a retry pays nothing');
    assert.equal(pay(null, a), R.bounty[1], 'the first sync pays (a local credit never reached the server)');
    const many = {}; for (let i = 0; i < g('ACH_MERGE_CAPS').bounties + 5; i++) many['2025-' + String(1 + (i % 12)).padStart(2, '0') + '-' + String(1 + Math.floor(i / 12)).padStart(2, '0')] = [1, 0, 0];
    const kept = Object.keys(merge(null, { v: 2, hq: { bounties: many } }).hq.bounties);
    assert.equal(kept.length, g('ACH_MERGE_CAPS').bounties, 'the cap');
    assert.ok(kept.indexOf('2025-01-01') < 0, 'the oldest day goes first');
    const fold = g('hqDoorSyncFold')({}, { hq: { bounties: { [DAY]: [0, 0, 1] } } });
    deq(fold.bounties, { [DAY]: [0, 0, 1] }, 'the local ledger folds into the blob');
});

test('THE SERVER UNION: a race on the synced captured ledger joins unlocked_units (known races only, persisted, the sync pays bounties)', async () => {
    const u = g('hqCapturedUnlockUnion');
    deq(u(['knight'], { hq: { captured: { grey: DAY, knight: DAY, 'no-such': DAY, BAD: DAY, ghost: 5 } } }), { list: ['knight', 'grey'], added: ['grey'] });
    deq(u(['knight'], null), { list: ['knight'], added: [] });
    // server.js unionCapturedUnits, run over a fake D1
    const src = SV.slice(SV.indexOf('async function unionCapturedUnits('), SV.indexOf('const rooms = new Map();'));
    const writes = [];
    const ctx = vm.createContext({ console: { log() {}, warn() {} }, JSON,
        ACH: { capturedUnion: u }, ECON: { AVAILABLE_RACES: new Set(D.AVAILABLE_RACES) },
        d1: { getOne: async () => ({ data: JSON.stringify({ hq: { captured: { grey: DAY } } }) }), execute: async (sql, args) => { writes.push(args); } } });
    vm.runInContext(src, ctx);
    deq(await ctx.unionCapturedUnits('p1', ['knight', 'legacy-unit']), ['knight', 'legacy-unit', 'grey'], 'read from the stored row; a legacy entry is kept');
    deq(writes, [[JSON.stringify(['knight', 'legacy-unit', 'grey']), 'p1']], 'persisted');
    deq(await ctx.unionCapturedUnits('p1', ['knight', 'grey']), ['knight', 'grey'], 'nothing new: no write');
    assert.equal(writes.length, 1);
    deq(await ctx.unionCapturedUnits('p1', ['knight'], { hq: { captured: { mothman: DAY } } }), ['knight', 'mothman'], 'the merged blob in hand wins over the stored row');
    // the wiring
    ['unlocked = await unionCapturedUnits(player.id, unlocked, progress);', 'async function getOrBackfillEconomy(player, progress) {',
     'const econ = await getOrBackfillEconomy(fresh, merged);', 'bountyGold = Math.max(0, Math.round(Number(ACH.bountyPay(stored, merged)) || 0));',
     "bountyPay: (_dataJs && typeof _dataJs.hqCaptureBountySyncPay === 'function')", "capturedUnion: (_dataJs && typeof _dataJs.hqCapturedUnlockUnion === 'function')"]
        .forEach(s => assert.ok(SV.includes(s), 'server.js: ' + s));
});

test('THE LOCAL MIRROR: localCaptureUnit adds a captured race to the account roster; the mirror keeps ledger races over a server overwrite', () => {
    const c = vm.createContext({ window: { AVAILABLE_RACES: D.AVAILABLE_RACES, hqCapturedRecord: D.hqCapturedRecord } });
    const saved = [];
    c.getActiveProfileIndex = () => 0; c.loadProfile = () => c._p; c.saveProfile = (i, p) => saved.push(p);
    vm.runInContext(PF.slice(PF.indexOf('function _unionCapturedIntoMirror('), PF.indexOf('// ── THE DISPENSARY (2026-09-20)')), c);
    const p = profile(['knight']);
    deq(J(c.localCaptureUnit('grey', p)).data.unlockedUnits, ['knight', 'grey']);
    assert.equal(saved.length, 0, 'a profile handed in is only mutated (the commit saves it)');
    assert.equal(c.localCaptureUnit('grey', p).already, true);
    assert.equal(c.localCaptureUnit('no-such', p).ok, false);
    c._p = profile(['knight']); c.localCaptureUnit('mothman');
    assert.equal(saved.length, 1, 'no profile handed in: load, add, save');
    const q = profile(['knight']); D.hqCapturedMark(q, ['gargoyle'], DAY);
    deq(J(c._unionCapturedIntoMirror(q)), ['gargoyle']); assert.ok(q.account.unlockedUnits.includes('gargoyle'));
    assert.ok(PF.includes('_unionCapturedIntoMirror(p);   // THE ONE-WAY DOOR: a capture the server has not synced yet stays on the mirror'), '_syncEconomyToLocal keeps them');
    assert.ok(PF.includes('  localCaptureUnit,\n'), 'exported on ProfileSystem');
});

test('THE COMMIT + THE CARD + THE TOAST: rows learn who they were, new races join the mirror roster, the debrief shows THE CAPTURES under THE SPOILS, the building says who joined', () => {
    ['Object.assign(r, { name: c.name || \'\', gender: c.gender || null, lvl: c.lvl | 0, tier: c.tier | 0, unitId: c.unitId || null });',
     "PS.localCaptureUnit(r.race, p)", 'function _vicBuildCaptures(cr)', "getElementById('vicCaptures')", "'vicSubtitle', 'vicCaptures'].forEach(id => {"]
        .forEach(s => assert.ok(BT.includes(s), 'battle.js: ' + s));
    assert.ok(IX.indexOf('id="vicCaptures"') > IX.indexOf('id="vicDrops"') && IX.indexOf('id="vicCaptures"') < IX.indexOf('id="vicGoldBreakdown"'), 'index.html: under THE SPOILS');
    ['.vic-cap-card', '.vic-captures:empty { display: none; }', '.vic-cap-row.party'].forEach(s => assert.ok(CSS.includes(s), 'css: ' + s));
    assert.ok(MP.includes('JOINED THE PARTY') && MP.includes('CAPTURE BOUNTY'), 'map.js: the return toast');
    // the card renders: a vm over the builder with stub helpers
    const src = BT.slice(BT.indexOf('        function _vicBuildCaptures(cr) {'), BT.indexOf('        function _vicBuildExperience(party) {'));
    const c = vm.createContext({ escapeHtml: s => String(s).replace(/</g, '&lt;'), _vicPortrait: () => 'p.png' });
    vm.runInContext(src, c);
    const html = c._vicBuildCaptures({ gold: 80, rows: [
        { race: 'grey', to: 'party', name: 'Zed', member: { lvl: 4 }, tier: 1 },
        { race: 'mothman', to: 'roster', tier: 3 },
        { race: 'knight', to: 'bounty', gold: 80, tier: 2 },
        { race: 'x', to: 'skip' }] });
    ['JOINS THE PARTY · LV 4', 'ON YOUR ROSTER', 'BOUNTY +80', 'DOOR III', '1 JOINED · 1 ON THE ROSTER · +80', 'Zed<em>GREY</em>'].forEach(s => assert.ok(html.includes(s), 'card: ' + s));
    assert.equal((html.match(/vic-cap-row /g) || []).length, 3, 'a skipped row is not shown');
    assert.equal(c._vicBuildCaptures({ rows: [] }), '');
});
