// capture-door.test.js — THE ONE-WAY DOOR, Phase 0 (CAPTURE_PLAN.md §2.3 / §2.6 / §3.1, 2026-09-25):
// the pure rules of story mode's capture mechanic. The table (CAPTURE_RULES), the DETERMINISTIC seal time
// (captureSealFor / captureSealSteps — no roll), the four door items (three tiers + the tuned door) and the
// bag's DOORS tab, the HELD / SEALED statuses (the `exited` row's shape), the captured ledger (local + the
// synced blob, the earlier day wins) and the prize (party → roster → bounty). The story-only gate at the
// loadouts (battle.js / state.js normalizeLoadoutForClass, the forge, the random CPU loadout). Repo-only.
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
const BT = fs.readFileSync(__dirname + '/battle.js', 'utf8');
const ST = fs.readFileSync(__dirname + '/state.js', 'utf8');
const PB = fs.readFileSync(__dirname + '/party-builder.js', 'utf8');
const unit = (o) => Object.assign({ hp: 1000, maxHp: 1000, status: {}, types: ['human'] }, o || {});
const profile = (units) => ({ username: 'MONDO', account: { gold: 0, unlockedUnits: units || ['knight', 'wizard', 'door agent', 'homosapien'] }, door: {}, progress: { v: 2, hq: {} } });

test('THE TABLE: three tiers, a seal time that is never 0, the door gun\'s reach, half XP and no spoils', () => {
    deq(R.baseSeal, { 1: 3, 2: 2, 3: 1 }); deq(R.hits, { 1: 3, 2: 4, 3: 5 });
    assert.equal(R.minSeal, 1); assert.ok(R.maxSeal >= 3);
    assert.equal(R.range, 4); assert.equal(R.los, true); assert.equal(R.perPlayer, 1);
    assert.equal(R.xpShare, 0.5); assert.equal(R.spoils, false);
    deq(R.types, ['human', 'divine', 'unholy', 'tech', 'anomaly', 'alien']);
    R.types.forEach(t => assert.ok(D.ITEM_RULES[t + 'Bane'] && D.ITEM_RULES[t + 'Bane'].baneType === t, t + ' is a bane type'));
    assert.equal(g('captureXp')(301), 151); assert.equal(g('captureXp')(0), 0);
    assert.equal(g('captureDoorHits')({ tier: 2 }), 4); assert.equal(g('captureDoorHits')({ tier: 9 }), 5); assert.equal(g('captureDoorHits')({}), 3);
});

test('THE SEAL TIME: deterministic — tier, HP steps, a debuff, a tuned door\'s type, the lead, clamped to [min, max]', () => {
    const seal = g('captureSealFor'), steps = g('captureSealSteps');
    assert.equal(seal({ tier: 1 }, unit()), 3, 'a healthy unit behind a T1 door: 3 rounds');
    assert.equal(seal({ tier: 2 }, unit()), 2); assert.equal(seal({ tier: 3 }, unit()), 1);
    assert.equal(seal({ tier: 1 }, unit({ hp: 500 })), 2, '≤ 50 % HP: one round less');
    assert.equal(seal({ tier: 1 }, unit({ hp: 250 })), 1, '≤ 25 %: two less');
    assert.equal(seal({ tier: 1 }, unit({ hp: 100, status: { burn: 2 } })), 1, 'never below the minimum');
    assert.equal(seal({ tier: 1 }, unit({ status: { burn: 2 } })), 2, 'a debuff: one less');
    assert.equal(seal({ tier: 1 }, unit({ status: { stun: 1 } })), 2, 'hard CC counts as a debuff');
    assert.equal(seal({ tier: 1 }, unit({ status: { burn: 0 } })), 3, 'an expired status is nothing');
    assert.equal(seal({ tier: 1 }, unit({ status: { protect: 3 } })), 3, 'a buff is nothing');
    assert.equal(seal({ tier: 1, type: 'human' }, unit()), 2, 'a tuned door on its own type: one less');
    assert.equal(seal({ tier: 1, type: 'tech' }, unit()), 3, 'the wrong type: a plain door');
    assert.equal(seal({ tier: 1 }, unit(), { lead: true }), 4, 'THE LEAD holds out one round more');
    assert.equal(seal({ tier: 3 }, unit({ hp: 10, status: { burn: 1 } })), 1);
    const s = steps({ tier: 1, type: 'human' }, unit({ hp: 200, status: { poison: 1 } }), { lead: true });
    deq(s.steps.map(x => x.id), ['hp50', 'hp25', 'debuff', 'type', 'lead']);
    assert.equal(s.base, 3); assert.equal(s.seal, 1, '3 − 2 − 1 − 1 + 1 = 0 → the floor');
    for (let i = 0; i < 5; i++) assert.equal(seal({ tier: 1 }, unit({ hp: 400 })), 2, 'the same answer every time (no roll)');
});

test('THE ITEMS: three tiers + the tuned door, story only, a bag category of their own, never a field item', () => {
    const keys = g('captureDoorItemKeys')();
    deq(keys, ['captureDoor3', 'captureDoor2', 'captureDoor', 'captureDoorTuned'], 'the best tier first');
    keys.forEach(k => {
        const r = D.ITEM_RULES[k];
        assert.equal(r.kind, 'captureDoor', k); assert.equal(r.story, true, k); assert.ok(!r.fieldOnly, k + ' is a battle item');
        assert.ok(r.max > 0 && r.shopPrice > 0 && r.desc && r.icon === '🚪', k);
        assert.ok(g('ITEM_META')[k], k + ' has its META'); assert.equal(g('itemStoryOnly')(k), true);
        assert.equal(g('hqBagCategoryOf')(k), 'doors', k);
        assert.ok(D.HQ_PARTY_RULES.itemKinds.indexOf(k) < 0, k + ' is no field item');
    });
    assert.equal(D.ITEM_RULES.captureDoorTuned.tuned, true); assert.equal(D.ITEM_RULES.captureDoorTuned.tier, 1);
    assert.equal(g('itemStoryOnly')('healPotion'), false);
    const tab = D.HQ_BAG_TABS.find(t => t.id === 'doors'); assert.ok(tab && tab.label === 'DOORS');
    const p = profile(); g('hqBagAdd')(p, 'captureDoor', 2); g('hqBagAdd')(p, 'healPotion', 1);
    deq(g('hqBagList')(p).map(r => [r.key, r.cat]), [['healPotion', 'healing'], ['captureDoor', 'doors']], 'doors sort last');
    assert.equal(g('hqBagForBattle')(p).captureDoor, 2, 'a door rides into a story fight in the bag');
    assert.ok(D.HQ_DISPENSARY.stock.every(k => !D.ITEM_RULES[k].story), 'nothing sells a door yet (Phase 5)');
});

test('THE STORY GATE: both loadout normalizers, the forge and the random CPU loadout refuse a story item outside a story fight', () => {
    [['battle.js', BT], ['state.js', ST]].forEach(([n, src]) => {
        assert.ok(src.includes('function _storyLoadoutOn()'), n + ': the gate');
        assert.ok(src.includes("(iRule.fieldOnly || (iRule.story && !_storyLoadoutOn())) ? 0 : getItemCapForClass(cls, iKey)"), n + ': normalize caps it');
        assert.ok(src.includes('window.isOnlineMatch()) return false;') && src.includes('state.partyBag && state.partyBag.items'), n + ': online never, the party bag only');
    });
    assert.ok(BT.includes('const allItemKeys = Object.keys(ITEM_RULES).filter(k => !ITEM_RULES[k].story);'), 'the random loadout never rolls one');
    assert.ok(PB.includes('.filter(k => !(window.ITEM_RULES[k] && window.ITEM_RULES[k].story))'), 'the forge never offers one');
});

test('THE STATUSES: HELD and SEALED wear the exited row\'s shape (realm, no move, no action, dispel-proof)', () => {
    const S = g('STATUS_DEFS');
    ['captured', 'sealed'].forEach(k => {
        const d = S[k]; assert.ok(d, k);
        ['realm', 'blockMove', 'blockAction', 'dispelProof'].forEach(f => assert.equal(d[f], true, k + '.' + f));
        assert.equal(d.kind, 'marker', k + ' is no debuff (a cleanse never frees it)');
    });
    assert.equal(typeof S.captured.onRemove, 'function', 'the free hook');
    let freed = null; D.captureDoorFree = u => { freed = u.id; };
    const u = { id: 'u1', _captureDoorId: 'd1' };
    S.captured.onRemove(u); assert.equal(freed, 'u1', 'the status ending frees the body'); assert.equal(u._captureDoorId, undefined);
    freed = null; const s = { id: 'u2', _sealed: true, _captureDoorId: 'd1' }; S.captured.onRemove(s); assert.equal(freed, null, 'a sealed unit is never freed');
    delete D.captureDoorFree;
});

test('THE LEDGER: hq.captured merges like the defeated ledger (the earlier day wins), survives the fold, is capped', () => {
    const m = g('mergeProgressBlobs')({ hq: { captured: { knight: '2026-09-25', grey: '2026-09-20', 'bad.key': '2026-09-01', wizard: 'yesterday' } } }, { hq: { captured: { knight: '2026-09-21' } } });
    deq(m.hq.captured, { knight: '2026-09-21', grey: '2026-09-20' });
    deq(g('mergeProgressBlobs')({}, {}).hq.captured, {});
    assert.equal(g('ACH_MERGE_CAPS').captured, 256);
    const hq = g('hqDoorSyncFold')({ captured: { grey: '2026-09-22' } }, { hq: { captured: { grey: '2026-09-20', knight: '2026-09-24' } } });
    deq(hq.captured, { grey: '2026-09-20', knight: '2026-09-24' });
    const p = profile();
    const w = g('hqCapturedMark')(p, ['grey', 'grey', 'NOT OK!'], '2026-09-25');
    deq(w.added, ['grey']); assert.equal(p.door.hq.captured.grey, '2026-09-25'); assert.equal(p.progress.hq.captured.grey, '2026-09-25', 'the synced blob too');
    assert.equal(g('hqUnitCaptured')(p, 'grey'), true);
    assert.equal(g('hqUnitDefeated')(p, 'grey'), false, 'a capture is not a defeat (§7.1)');
    deq(g('hqCapturedMark')(p, ['grey'], '2026-09-26').added, [], 'filed once; the first day stays');
    assert.equal(g('hqCapturedRecord')(p).grey, '2026-09-25');
});

test('THE PRIZE: party first (no duplicate race), then the roster, then the bounty — every capture on the ledger', () => {
    const p = profile(['knight', 'wizard', 'door agent', 'homosapien']);
    assert.equal(g('hqPartyEnlist')(p, { race: 'grey' }).reason, 'locked', 'the plain enlist still honours the roster lock');
    const avail = D.AVAILABLE_RACES;
    const pick = avail.filter(r => ['knight', 'wizard', 'door agent', 'homosapien'].indexOf(r) < 0 && (D.ACCT_STARTER_UNITS || []).indexOf(r) < 0);
    assert.ok(pick.length >= 10, 'enough races to fill a party');
    const r1 = g('hqCaptureEnlist')(p, [{ race: pick[0], gender: 'male', name: 'Zed', tier: 1 }], { date: '2026-09-25' });
    assert.equal(r1.rows[0].to, 'party'); assert.equal(r1.rows[0].member.name, 'Zed');
    assert.ok(g('hqPartyRecord')(p).members.some(m => m.meta.race === pick[0]), 'joined the party');
    assert.equal(g('hqUnitCaptured')(p, pick[0]), true);
    const r2 = g('hqCaptureEnlist')(p, [{ race: pick[0], tier: 2 }]);
    deq([r2.rows[0].to, r2.rows[0].gold, r2.gold], ['bounty', R.bounty[2], R.bounty[2]], 'a second of a race already captured and in the party: the bounty');
    const size = g('hqPartyRecord')(p).members.length;
    const fill = pick.slice(1, 1 + (D.HQ_PARTY_RULES.roster - size)).map(race => ({ race, tier: 1 }));
    g('hqCaptureEnlist')(p, fill);
    assert.equal(g('hqPartyRecord')(p).members.length, D.HQ_PARTY_RULES.roster, 'the party is full');
    const next = pick[1 + fill.length];
    const r3 = g('hqCaptureEnlist')(p, [{ race: next, tier: 3 }]);
    deq([r3.rows[0].to, r3.gold], ['roster', 0], 'a full party + a new race: the roster (the ledger is the claim)');
    assert.equal(g('hqUnitCaptured')(p, next), true);
    const r4 = g('hqCaptureEnlist')(p, [{ race: 'knight', tier: 3 }]);
    deq([r4.rows[0].to, r4.gold], ['bounty', R.bounty[3]], 'a full party + an owned race: the bounty');
    assert.equal(g('hqCaptureEnlist')(p, [{ race: 'no-such-race' }]).rows[0].to, 'skip');
    assert.ok(g('hqPartyUnlocked')(p).indexOf(pick[0]) >= 0, 'a captured race stays enlistable (the prune keeps it)');
});

test('CAPTURED = OWNED (the user, 2026-09-25: "if you caught an enemy then why would you need to buy it in the shop?"): isUnitOwned and the shop read the captured ledger; party-only doors', () => {
    const p = profile(['knight']);
    const race = D.AVAILABLE_RACES.find(r => r !== 'knight' && (D.ACCT_STARTER_UNITS || []).indexOf(r) < 0 && (typeof D.isRace3DReady !== 'function' || D.isRace3DReady(r)));
    D.ProfileSystem = { getActiveProfile: () => p };
    try {
        assert.equal(g('isUnitOwned')(race), false);
        g('hqCapturedMark')(p, [race], '2026-09-25');
        assert.equal(g('isUnitOwned')(race), true, 'owned the moment it is on the ledger');
        assert.equal(g('hqUnitBuyable')(p, race), true);
    } finally { delete D.ProfileSystem; }
    assert.equal(R.playerOnly, true, 'enemies never capture the party (the capture gun is D.O.O.R. technology)');
    assert.equal(R.healHeld, false, 'allies cannot heal a held unit');
    assert.equal(R.loneSeal, 'round', 'a lone enemy seals');
});
