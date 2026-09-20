// party-hubs.test.js — 2026-09-20, the user's four: (1) THE OWNED SEED — the party seeds from what the account OWNS,
// never a VS-CPU test roster's martian / knight (hqPartyEnsure filters the last roster, hqPartyPrune relieves a
// stranger already on the books); (2) THE MARKER — the floating crystal launches the party-seated fight (data.js
// hqMarkerLaunch, map.js _hqMarkerHtml / _hqMarkerFight → _hqEncounterStart), never the terminal's roster wall;
// (3) THE DEFEATED LEDGER — a vessel is for sale only once one fell to you (hqDefeatedMark on the commit, hqUnitBuyable
// in the shop, the blob's hq.defeated on the server); (4) THE HEALING ZONES — one `healzone` counter in every hub's
// anchor room (the foyer for the building), the cot's REST panel. Repo-only.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { loadGameData } = require('./load-data');
const D = loadGameData();
const g = name => vm.runInContext(name, D);
const MP = fs.readFileSync(__dirname + '/map.js', 'utf8');
const BT = fs.readFileSync(__dirname + '/battle.js', 'utf8');
const UI = fs.readFileSync(__dirname + '/ui.js', 'utf8');
const SV = fs.readFileSync(__dirname + '/server.js', 'utf8');
const PF = fs.readFileSync(__dirname + '/profile.js', 'utf8');
const TR = fs.readFileSync(__dirname + '/three-renderer.js', 'utf8');
const profile = (o) => Object.assign({ username: 'MONDO', account: { gold: 0, unlockedUnits: ['door agent', 'homosapien', 'catgirl'] }, progress: { v: 2, hq: {} }, door: { clearance: 1, hq: {} } }, o || {});

test('THE OWNED SEED: a test roster\'s martian and knight never join the party; a stranger on the books is relieved', () => {
    const p = profile();
    const last = { members: [{ cls: 'Warrior', name: 'Zed', meta: { race: 'martian' } }, { cls: 'Knight', meta: { race: 'knight' } }, { cls: 'Rogue', name: 'Kit', meta: { race: 'catgirl' } }] };
    const rec = g('hqPartyEnsure')(p, { last });
    const races = rec.members.map(m => m.meta.race);
    assert.ok(!races.includes('martian') && !races.includes('knight'), 'the unowned never seed: ' + races.join(','));
    assert.equal(races[0], 'door agent'); assert.ok(races.includes('catgirl'), 'the owned roster member joins');
    const bare = g('hqPartyEnsure')(profile(), { last: { members: [{ cls: 'Warrior', meta: { race: 'martian' } }] } });
    assert.ok(bare.members.length >= 2 && bare.members.every(m => ['door agent', 'homosapien', 'catgirl'].includes(m.meta.race)), 'a roster of strangers = the officer + the starters / the owned: ' + bare.members.map(m => m.meta.race).join(','));
    assert.ok(rec.members.every(m => g('hqPartyUnlocked')(p).includes(m.meta.race)));
    /* a record filed before the rule: the prune on the next ensure */
    p.door.hq.party.members.push({ id: 'p9', cls: 'Warrior', meta: { race: 'martian' }, loadout: {} });
    const r2 = g('hqPartyEnsure')(p, { last });
    assert.ok(!r2.members.some(m => m.meta.race === 'martian'), 'the stranger is relieved on the next read');
    assert.ok(/hqPartyPrune\(profile\)/.test(D.hqPartyEnsure.toString()), 'the ensure prunes');
});

test('THE MARKER: the crystal launches the party fight on the mode picked, the site\'s natives across; never the terminal', () => {
    const L = g('hqMarkerLaunch')('site_prebuilt_fairy_forest_clearing', null, { gm: 'arena' });
    assert.ok(L && L.site === 'prebuilt_fairy_forest' && L.gm === 'arena' && L.marker && L.doorId === 'battle', 'the launch shape');
    assert.ok(L.roster.length >= 1 && L.encounter.race === L.roster[0] && L.encounter.gesture === 'marker', 'the first native leads');
    assert.equal(g('hqMarkerLaunch')('site_prebuilt_fairy_forest_clearing', null, { gm: 'tdm' }).gm, 'tdm');
    assert.equal(g('hqMarkerLaunch')('site_prebuilt_fairy_forest_clearing', null, { gm: 'bogus' }).gm, D.HQ_ENCOUNTER_RULES.gm, 'an unknown mode falls to the encounter\'s');
    assert.equal(g('hqMarkerLaunch')('foyer', null, {}), null, 'no site, no launch');
    assert.ok(MP.includes("if (t && t.kind === 'counter' && t.counter && t.counter.proc === 'battle_marker') { _hqOpenPanel(t); return; }"), 'E on the marker opens its panel before the terminal branch');
    assert.ok(MP.includes("if (act.overlay === 'crossing' && c.proc === 'battle_marker') return _hqMarkerHtml(t);"), 'the marker\'s own panel');
    assert.ok(/data-marker-fight="tdm"/.test(MP) && /data-marker-fight="arena"/.test(MP), 'one button per win-condition mode');
    assert.ok(/window\._hqMarkerFight = function \(gm\)/.test(MP) && /return _hqEncounterStart\(L, null, null\);/.test(MP), 'FIGHT is the encounter\'s launch (the party seated, no builder)');
    assert.ok(MP.includes("const mf = e.target.closest('[data-marker-fight]');"), 'the click handler');
});

test('THE DEFEATED LEDGER: a vessel goes on sale once one fell to you; the blob carries it; the shop + the server read it', () => {
    const p = profile();
    assert.equal(g('hqUnitBuyable')(p, 'martian'), false, 'never met: not for sale');
    assert.equal(g('hqUnitBuyable')(p, 'homosapien'), true, 'a starter is always buyable-or-owned');
    assert.equal(g('hqUnitBuyable')(p, 'catgirl'), true, 'owned');
    const r = g('hqDefeatedMark')(p, ['martian', 'martian', 'bad key!'], '2026-09-20');
    assert.deepEqual(JSON.parse(JSON.stringify(r.added)), ['martian']);
    assert.equal(g('hqUnitBuyable')(p, 'martian'), true);
    assert.equal(p.door.hq.defeated.martian, '2026-09-20'); assert.equal(p.progress.hq.defeated.martian, '2026-09-20');
    assert.deepEqual(JSON.parse(JSON.stringify(g('hqDefeatedMark')(p, ['martian'], '2026-09-21').added)), [], 'filed once');
    assert.equal(p.progress.hq.defeated.martian, '2026-09-20', 'the FIRST day stands');
    const m = g('mergeProgressBlobs')(p.progress, { v: 2, hq: { defeated: { knight: '2026-01-02', martian: '2026-01-01', 'no good!': '2026-01-01' } } });
    assert.equal(m.hq.defeated.martian, '2026-01-01', 'the earlier day wins'); assert.equal(m.hq.defeated.knight, '2026-01-02'); assert.equal(m.hq.defeated['no good!'], undefined);
    /* the local record alone (a profile with no v2 blob) still reads */
    const q = profile({ progress: null }); g('hqDefeatedMark')(q, ['grey']); assert.equal(g('hqUnitDefeated')(q, 'grey'), true);
    assert.ok(/function _shopLockReason\(race\)/.test(UI) && /return 'defeat'/.test(UI) && /DEFEAT ONE IN BATTLE FIRST/.test(UI), 'the shop says why');
    assert.ok(/hqDefeatedMark\(p, fell\)/.test(BT) && /if \(home === viewer \|\| home === 0\) continue;/.test(BT), 'the commit marks the enemy bodies that fell');
    assert.ok(/ACCT_STARTER_UNITS\.includes\(raceKey\)/.test(SV) && /prog\.hq\.defeated/.test(SV) && /defeat one in battle first/.test(SV), 'the purchase endpoint refuses an unmet vessel');
    assert.ok(/window\.hqUnitBuyable\(p, raceKey\)/.test(PF), 'the local mirror keeps the rule');
});

test('THE HEALING ZONES: one per hub anchor (the foyer for the building), REST = the cot\'s panel, the renderer\'s ring', () => {
    const hubs = Object.keys(D.DOOR_HQ.hubs);
    const zones = g('hqHealZoneRooms')();
    assert.equal(zones.length, hubs.length, 'every hub has one: ' + zones.map(z => z.hub).join(','));
    for (const z of zones) {
        const room = D.DOOR_HQ.rooms[z.room];
        const c = (room.counters || []).filter(x => x && x.id === 'healzone');
        assert.equal(c.length, 1, z.hub + ': one zone in ' + z.room);
        assert.ok(c[0].proc === 'heal_zone' && c[0].verb === 'REST' && c[0].radius > 0 && c[0].hub === z.hub, z.hub + ': the row');
        if (z.hub !== 'hq') assert.equal((g('hqHubOf')(z.room) || {}).id, z.hub, z.hub + ': the anchor belongs to the hub');
        /* beside the marker where the room has one */
        const mk = (room.counters || []).find(x => x && x.proc === 'battle_marker');
        if (mk) assert.ok(Math.abs(Math.hypot(c[0].x - mk.x, c[0].z - mk.z) - D.HQ_HEAL_ZONE.beside) < 0.01, z.hub + ': beside the marker');
    }
    assert.equal(zones.find(z => z.hub === 'hq').room, 'foyer');
    assert.ok(MP.includes("if (c.id === 'cot' || c.id === 'healzone') {"), 'the cot\'s panel');
    assert.ok(TR.includes("if (c.proc === 'heal_zone') {") && /function _hqBuildHealZone\(U\)/.test(TR), 'the renderer draws it');
});
