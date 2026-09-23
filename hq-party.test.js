// hq-party.test.js — THE PARTY (2026-09-19): a standard JRPG party on the officer's
// profile — eight members in TWO SHIFTS (the order IS the shift: four on FIRST SHIFT go
// out first, four on SECOND SHIFT are the bench the RESERVES plumbing switches in and
// out), the officer pinned in slot 1, the units you have unlocked ON CALL. Encounters
// in the explorable areas fight with it: no respawns (state.noRespawns — a fallen seat
// is filled from the bench the Gauntlet way), the health carrying between encounters
// (the vitals ride the identity into createUnit and come home on the commit), a loss
// waking the party treated. FIELD MEDICINE: the party's own heal spells and potions
// from the pause menu, the caster's own MP; THE COT in Medical rests everyone for free.
// Guards: the rules, the seed (the officer + the last roster), enlist / relieve / swap,
// the fit read, the launch order + the carried identity, the commit (win / loss), the
// field casts + the potions, the rest, and the source sites on both sides. Repo-only.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { loadGameData } = require('./load-data');
const D = loadGameData(), R = D.HQ_PARTY_RULES;
const g = name => vm.runInContext(name, D);
const J = o => JSON.parse(JSON.stringify(o));
const deq = (a, b, m) => assert.deepEqual(J(a), J(b), m);   // a vm-realm array never deepStrictEquals (CLAUDE.md's note)
const MP = fs.readFileSync(__dirname + '/map.js', 'utf8');
const BT = fs.readFileSync(__dirname + '/battle.js', 'utf8');
const ST = fs.readFileSync(__dirname + '/state.js', 'utf8');
const UI = fs.readFileSync(__dirname + '/ui.js', 'utf8');
const D_SRC = fs.readFileSync(__dirname + '/data.js', 'utf8');
const CSS = fs.readFileSync(__dirname + '/styles-base.css', 'utf8');
const profile = (o) => Object.assign({ username: 'MONDO', account: { gold: 0, unlockedUnits: ['knight', 'wizard', 'fairy', 'catgirl', 'grey', 'marksman', 'werewolf', 'door agent', 'homosapien', 'cowboy', 'nun'] }, door: { clearance: 1, hq: {} } }, o || {});
const last = { v: 1, seat: 1, members: [
    { cls: 'Gunslinger', name: 'Dutch', meta: { race: 'cowboy', gender: 'male', customSpells: ['raceLasso'] }, loadout: { spells: [], items: { healPotion: 2 }, equipment: {} } },
    { cls: 'White Mage', name: 'Sister', meta: { race: 'nun', gender: 'female', customSpells: ['heal'] }, loadout: { spells: [], items: { manaPotion: 1 }, equipment: {} } },
    { cls: 'Black Mage', name: 'Twin', meta: { race: 'cowboy', gender: 'female' }, loadout: null },   // a second cowboy: one vessel per race
] };
const unitOf = (m, hp, mp, extra) => Object.assign({ maxHp: hp, maxMp: mp, level: 100, healBonus: 0, spells: [] }, extra || {});

test('THE RULES: eight in two shifts of four, a loss treats the party, the cot in Medical, the heal kinds, the potions', () => {
    assert.equal(R.roster, 8); assert.equal(R.shift, 4);
    assert.equal(R.roster, D.RESERVE_RULES.roster, 'the party is the reserves roster'); assert.equal(R.shift, D.RESERVE_RULES.deploy, 'the first shift is the deploy');
    assert.equal(R.lossRestore, true); assert.equal(R.restRoom, 'medical'); assert.equal(R.restCounter, 'cot');
    deq(J(R.healKinds), ['heal', 'healAll', 'selfHeal', 'revive']); deq(J(R.itemKinds), ['healPotion', 'manaPotion', 'reviveTonic', 'elixir']);   // THE BAG (2026-09-20): the two field-only items
    assert.ok(D.AVAILABLE_RACES.includes(R.officerRace) && D.ACCT_STARTER_UNITS.includes(R.officerRace), 'the officer\'s fallback vessel is a starter');
});

test('THE SEED: the officer first (slot 1, YOU), then the last roster one vessel per race; no roster → the officer + starters', () => {
    const p = profile();
    const rec = g('hqPartyEnsure')(p, { last });
    assert.ok(rec && rec.members.length === 3, 'the officer + Dutch + Sister (the second cowboy is skipped)');
    assert.equal(rec.members[0].you, true); assert.equal(rec.members[0].meta.race, 'door agent'); assert.equal(rec.members[0].name, 'MONDO');
    assert.equal(rec.members[1].name, 'Dutch'); assert.equal(rec.members[1].meta.customSpells.join(','), 'raceLasso'); assert.equal(rec.members[1].loadout.items.healPotion, 2);
    assert.equal(rec.members[2].meta.race, 'nun');
    assert.ok(rec.members.every(m => m.hp === null && m.mp === null), 'a fresh member is FULL (null)');
    assert.ok(rec.members.every((m, i) => rec.members.findIndex(x => x.id === m.id) === i), 'ids are unique');
    assert.equal(g('hqPartyEnsure')(p, { last }), g('hqPartyRecord')(p), 'a second ensure is the same record');
    const q = profile();
    const rec2 = g('hqPartyEnsure')(q, {});
    /* THE ROSTER LOCK (2026-09-20): the seed fills the first shift from what the account OWNS — the two starters (the officer's DOOR Agent + the recruit) offline */
    const ownedSeed = g('hqPartyUnlocked')(q).filter(r => r !== R.officerRace);
    assert.equal(rec2.members.length, Math.min(R.shift, 1 + ownedSeed.length), 'no roster: the officer + whatever the account owns fill the first shift');
    assert.ok(rec2.members.slice(1).every(m => ownedSeed.includes(m.meta.race)));
    /* an account that owns nothing beyond the starters seeds the officer + the recruit */
    const bare = profile({ account: { gold: 0, unlockedUnits: [] } });
    const rec3 = g('hqPartyEnsure')(bare, {});
    const bareOwned = g('hqPartyUnlocked')(bare).filter(r => r !== R.officerRace);
    assert.equal(rec3.members.length, Math.min(R.shift, 1 + bareOwned.length), 'the starters fill the first shift: the officer + the recruit + the free hires');
    assert.ok(rec3.members.some(m => m.meta.race === 'homosapien'), 'the recruit is a starter');
    /* the mirror's look leads: a homosapien in the creator's clothes */
    const r = profile({ door: { clearance: 1, hq: { avatar: { mode: 'look' }, look: { gender: 'female', appearance: {}, name: 'Ada' } } } });
    const off = g('hqPartyOfficer')(r);
    assert.equal(off.meta.race, 'homosapien'); assert.equal(off.meta.gender, 'female'); assert.equal(off.name, 'Ada');
});

test('ENLIST / RELIEVE / SWAP: the first free slot, one vessel per race, only the unlocked, the officer pinned, an empty slot moves to the end', () => {
    const p = profile(); g('hqPartyEnsure')(p, { last });
    const en = g('hqPartyEnlist'), rl = g('hqPartyRelieve'), sw = g('hqPartySwap'), S = () => g('hqPartyShifts')(p);
    assert.equal(en(p, { race: 'knight', gender: 'male' }).ok, true); assert.equal(S().first.length, 4, 'the fourth fills the first shift');
    assert.equal(en(p, { race: 'wizard' }).ok, true); assert.equal(S().second.length, 1, 'the fifth is the bench');
    assert.equal(en(p, { race: 'knight' }).reason, 'dup'); assert.equal(en(p, { race: 'kaiju' }).reason, 'locked'); assert.equal(en(p, { race: 'nope' }).reason, 'race');
    ['fairy', 'catgirl', 'grey'].forEach(r => assert.equal(en(p, { race: r }).ok, true));
    assert.equal(S().members.length, 8); assert.equal(en(p, { race: 'marksman' }).reason, 'full');
    const oc = g('hqPartyOnCall')(p).map(o => o.race);
    assert.ok(oc.includes('marksman') && oc.includes('werewolf') && !oc.includes('knight') && !oc.includes('door agent'), 'ON CALL = the unlocked not on the books');
    const you = S().members[0], knight = S().members.find(m => m.meta.race === 'knight'), wiz = S().members.find(m => m.meta.race === 'wizard');
    assert.equal(rl(p, you.id).reason, 'you', 'the officer is never relieved');
    /* THE LEAD (2026-09-23): slot 1 is anyone's — the officer swaps out of it like any unit, and the result says the lead changed */
    const s1 = sw(p, knight.id, you.id); assert.equal(s1.ok, true); assert.equal(s1.leadChanged, true); assert.equal(s1.lead, knight.id);
    assert.equal(S().members[0].id, knight.id, 'the knight is THE LEAD'); assert.equal(S().members.find(m => m.you).id, you.id, 'the officer keeps YOU wherever they stand');
    const s2 = sw(p, you.id, knight.id); assert.equal(s2.ok, true); assert.equal(s2.leadChanged, true); assert.equal(s2.lead, you.id);
    const s3 = sw(p, knight.id, wiz.id); assert.equal(s3.ok, true, 'a swap across the line is a shift change'); assert.equal(s3.leadChanged, false);
    assert.ok(S().second.some(m => m.id === knight.id) && S().first.some(m => m.id === wiz.id));
    assert.equal(rl(p, knight.id).ok, true); assert.equal(S().members.length, 7); assert.ok(!S().members.some(m => m.id === knight.id));
    const grey = S().members.find(m => m.meta.race === 'grey');
    assert.equal(sw(p, wiz.id, S().members.length).ok, true, 'a member and an empty slot: to the end of the order');
    assert.equal(S().members[S().members.length - 1].id, wiz.id); assert.ok(grey);
    assert.equal(S().members[0].you, true, 'the officer is back in slot 1');
});

test('THE FIT + THE LAUNCH: the fit of the first shift, then the fit of the second; a down member stays home; the vitals + the id ride the identity; nobody fit → no launch', () => {
    const p = profile(); g('hqPartyEnsure')(p, { last });
    ['knight', 'wizard', 'fairy'].forEach(r => g('hqPartyEnlist')(p, { race: r }));
    const rec = g('hqPartyRecord')(p);
    rec.members[1].hp = 0; rec.members[1].hpMax = 900; rec.members[1].mp = 20; rec.members[1].mpMax = 100;   // Dutch is DOWN
    rec.members[2].hp = 300; rec.members[2].hpMax = 1200; rec.members[2].mp = 50; rec.members[2].mpMax = 200; // Sister is hurt
    const fit = g('hqPartyFit')(p);
    assert.equal(fit.total, 6); assert.equal(fit.fit, 5); assert.equal(fit.down, 1); assert.equal(fit.hurt, 1); assert.equal(fit.ready, true); assert.match(fit.note, /5 FIT · 1 DOWN/);
    const L = g('hqPartyForLaunch')(p);
    assert.equal(L.party, true); assert.equal(L.exact, true); assert.equal(L.deploy, 4); assert.equal(L.left, 1);
    deq(L.members.map(m => m.meta.race), ['door agent', 'nun', 'knight', 'wizard', 'fairy'], 'Dutch stays home; the bench steps up');
    assert.ok(L.members.every(m => m.meta.partyId), 'every launched member carries its id');
    const sis = L.members[1]; assert.equal(sis.meta.hp, 300); assert.equal(sis.meta.hpMax, 1200); assert.equal(sis.meta.mp, 50); assert.equal(sis.meta.mpMax, 200);
    assert.equal(L.members[0].meta.hp, undefined, 'a full member carries no number (createUnit leaves it at max)');
    rec.members.forEach(m => { m.hp = 0; m.hpMax = 100; });
    assert.equal(g('hqPartyFit')(p).ready, false); assert.equal(g('hqPartyForLaunch')(p), null, 'nobody fit → no launch');
});

test('THE COMMIT: a win writes the board AND the bench home by id (a dead body is DOWN); a loss wakes the party treated', () => {
    const p = profile(); g('hqPartyEnsure')(p, { last });
    const rec = g('hqPartyRecord')(p); const [you, dutch, sis] = rec.members;
    const out = g('hqPartyAfterMatch')(p, { won: true, units: [
        { partyId: you.id, hp: 4000, maxHp: 9000, mp: 120, maxMp: 300, dead: false },
        { partyId: dutch.id, hp: 0, maxHp: 8000, mp: 40, maxMp: 250, dead: true },
        { partyId: 'nobody', hp: 1, maxHp: 1, mp: 0, maxMp: 0, dead: false },
    ] });
    assert.equal(out.seen, 2); assert.equal(out.down, 1); assert.equal(out.restored, false);
    const r2 = g('hqPartyRecord')(p);
    assert.equal(r2.members[0].hp, 4000); assert.equal(r2.members[0].hpMax, 9000); assert.equal(r2.members[0].mp, 120);
    assert.equal(r2.members[1].hp, 0, 'DOWN'); assert.equal(r2.members[1].mp, 40);
    assert.equal(r2.members[2].hp, null, 'Sister sat this one out — untouched');
    const loss = g('hqPartyAfterMatch')(p, { won: false, units: [{ partyId: sis.id, hp: 0, maxHp: 500, mp: 0, maxMp: 50, dead: true }] });
    assert.equal(loss.restored, true); assert.equal(loss.down, 0);
    assert.ok(g('hqPartyRecord')(p).members.every(m => m.hp === null && m.mp === null), 'the ward took everyone in');
});

test('FIELD MEDICINE: heal / healAll / selfHeal / revive with the battle\'s own arithmetic, the caster\'s MP, the targets\' rule; the potions from the pockets; the cot', () => {
    const p = profile(); g('hqPartyEnsure')(p, { last });
    const rec = g('hqPartyRecord')(p); const [you, dutch, sis] = rec.members;
    rec.members.forEach(m => { m.xp = g('xpThreshold')(100); m.lvl = 100; });   // THE LEVELS (2026-09-21): the arithmetic below is pinned at the cap — the ledger's level scales a heal like the battle does
    const SP = Object.values(D.SPELL_BY_ID); const heal = SP.find(s => s.kind === 'heal' && s.heal > 0 && s.lowHpBonus), healAll = SP.find(s => s.kind === 'healAll' && (s.healAmt || s.heal) > 0), rev = SP.find(s => s.kind === 'revive'), self = SP.find(s => s.kind === 'selfHeal' && s.selfHealPct);
    assert.ok(heal && healAll && rev && self, 'the four kinds exist in the library');
    const units = {};
    units[you.id] = unitOf(you, 9000, 300); units[dutch.id] = unitOf(dutch, 8000, 250); units[sis.id] = unitOf(sis, 5000, 400, { healBonus: 24, spells: [heal, healAll, rev, self] });
    const isF = g('hqPartyFieldSpells');
    deq(isF(units[sis.id], sis).map(s => s.id), [heal.id, healAll.id, rev.id, self.id]);
    deq(isF(unitOf(you, 1, 1, { spells: [SP.find(s => s.kind === 'damage')] }), you), [], 'a damage spell is never field medicine');
    /* the amount = (base + healBonus) × supportScale(the recipient's level), the low-HP rider */
    const amt = g('hqPartyHealAmount')(heal, { lvl: 100, healBonus: 24 }, { lvl: 100, hp: 100, hpMax: 9000 });
    const scale = g('supportScale')(100, 100);
    assert.equal(amt, Math.round((heal.heal + 24 + (heal.lowHpBonus || 0)) * scale));
    /* everyone full → nothing to cast */
    const cast = g('hqPartyCast'), tg = g('hqPartyFieldTargets');
    assert.equal(tg(p, units, sis.id, heal).length, 0); assert.equal(cast(p, units, sis.id, heal.id, you.id).reason, 'full');
    /* the officer is hurt: a heal lands, the caster's MP goes */
    you.hp = 100; you.hpMax = 9000; you.mp = 300; you.mpMax = 300;
    deq(tg(p, units, sis.id, heal).map(m => m.id), [you.id]);
    const c1 = cast(p, units, sis.id, heal.id, you.id);
    assert.equal(c1.ok, true); assert.equal(c1.healed[0].amount, amt); assert.equal(you.hp, 100 + amt); assert.equal(sis.mp, 400 - heal.cost); assert.equal(sis.mpMax, 400);
    /* not enough MP */
    sis.mp = 1; assert.equal(cast(p, units, sis.id, heal.id, you.id).reason, 'mp'); sis.mp = 400;
    /* revive: Dutch is down → up at the revive share; a heal never targets the down */
    dutch.hp = 0; dutch.hpMax = 8000; dutch.mp = 10; dutch.mpMax = 250;
    assert.equal(tg(p, units, sis.id, heal).some(m => m.id === dutch.id), false); deq(tg(p, units, sis.id, rev).map(m => m.id), [dutch.id]);
    assert.equal(cast(p, units, sis.id, heal.id, dutch.id).reason, 'full', 'heal cannot land on the down');
    const c2 = cast(p, units, sis.id, rev.id, dutch.id);
    assert.equal(c2.ok, true); assert.equal(c2.healed[0].revived, true); assert.equal(dutch.hp, Math.max(1, Math.round(8000 * (rev.revivePct || rev.reviveHpPct || 0.35))));
    assert.equal(cast(p, units, sis.id, rev.id, dutch.id).reason, 'nobodydown');
    /* healAll: everyone short of full, no target named; selfHeal: the caster alone */
    you.hp = 50; const c3 = cast(p, units, sis.id, healAll.id, null);
    assert.equal(c3.ok, true); assert.ok(c3.healed.length >= 2 && c3.healed.some(h => h.id === you.id) && c3.healed.some(h => h.id === dutch.id));
    sis.hp = 10; sis.hpMax = 5000; const c4 = cast(p, units, sis.id, self.id, null);
    assert.equal(c4.ok, true); deq(c4.healed.map(h => h.id), [sis.id]); assert.equal(sis.hp, 10 + Math.floor(5000 * self.selfHealPct));
    /* a down caster casts nothing */
    dutch.hp = 0; assert.equal(cast(p, units, dutch.id, heal.id, you.id).reason, 'down');
    /* the potions: Dutch's pockets, a percent of the target's max, one fewer in the pocket, never on the down */
    const use = g('hqPartyUseItem'), fi = g('hqPartyFieldItems');
    deq(fi(dutch).map(f => f.key + ':' + f.n), ['healPotion:2']);
    you.hp = 100; const u1 = use(p, units, dutch.id, 'healPotion', you.id);
    assert.equal(u1.ok, true); assert.equal(u1.amount, Math.round(9000 * D.ITEM_RULES.healPotion.healPct)); assert.equal(dutch.loadout.items.healPotion, 1);
    assert.equal(use(p, units, dutch.id, 'healPotion', dutch.id).reason, 'down');
    sis.mp = 400; assert.equal(use(p, units, sis.id, 'manaPotion', sis.id).reason, 'full', 'full MP: the potion stays');
    sis.mp = 1; const u2 = use(p, units, sis.id, 'manaPotion', sis.id); assert.equal(u2.ok, true); assert.equal(u2.stat, 'mp'); assert.equal(sis.loadout.items.manaPotion, 0);
    assert.equal(use(p, units, sis.id, 'manaPotion', sis.id).reason, 'none');
    assert.equal(use(p, units, sis.id, 'scanner', sis.id).reason, 'item', 'only the potions are field items');
    /* the cot */
    const rest = g('hqPartyRestore')(p);
    assert.equal(rest.ok, true); assert.ok(rest.n >= 2); assert.ok(g('hqPartyRecord')(p).members.every(m => m.hp === null && m.mp === null));
    assert.equal(g('hqPartyFit')(p).note, 'ALL FIT');
});

test('THE COT is a by-id panel in Medical; the record survives JSON', () => {
    const MED = D.DOOR_HQ.rooms.medical; const cot = MED.counters.find(c => c.id === 'cot');
    assert.ok(cot && cot.verb === 'REST' && cot.desc && !cot.action.fn && !cot.action.overlay && !cot.action.room, 'a by-id panel (ONE HOME: rest lives here)');
    assert.ok(MED.props.some(p => (p.key === 'cot' || p.key === 'hospital_bed') && Math.abs(p.z - cot.z) < 0.3), 'the counter stands at a cot (THE 2026-09-22 BATCH: the ward\'s cots are hospital beds)');
    const p = profile(); g('hqPartyEnsure')(p, { last });
    const back = JSON.parse(JSON.stringify(p));
    assert.equal(g('hqPartyRecord')(back).members.length, 3);
});

test('THE SOURCE SITES: the engine (no respawns, the bench fills a seat, the carried vitals, the repair whitelist), the launch, the commit, the pause menu, the cot', () => {
    /* map.js: the no-respawn rule at the death, the Gauntlet-style replacement for a no-respawn bench */
    assert.ok(MP.includes("(typeof _isDungeonMode === 'function' && _isDungeonMode()) || state.noRespawns) {"), 'defeatUnit: an encounter never schedules a respawn');
    assert.ok(MP.includes("if ((_gauntlet || (state.noRespawns && typeof _benchOn === 'function' && _benchOn())) && typeof _gauntletQueueReplacement === 'function') {"), 'a fallen seat is filled from the bench');
    assert.ok(BT.includes("if (!(_isGauntlet() || (state.noRespawns && _benchOn())) || !fallen) return;"), 'battle.js: the replacement queue takes the no-respawn bench');
    /* createUnit reads the carried vitals LAST */
    const cu = MP.slice(MP.indexOf('function createUnit('));
    const vit = cu.indexOf("identityOverride && identityOverride.hp != null"), eq = cu.indexOf('computeEquipBonuses(newUnit.equipment)');
    assert.ok(vit > 0 && eq > 0 && vit > eq, 'after the equipment tops the max off');
    assert.ok(cu.slice(vit).includes('newUnit.hp = Math.max(1, Math.min(newUnit.maxHp,'), 'never above the max, never under 1');
    /* the repair keeps the id + the vitals; the exact-seat cap */
    assert.ok(ST.includes("if (priorMeta.partyId) rebuiltMeta.partyId = priorMeta.partyId;") && ST.includes("['hp', 'hpMax', 'mp', 'mpMax'].forEach(k => { if (priorMeta[k] != null"), 'repairPartyBuilderState keeps the party fields');
    assert.ok(ST.includes("window._ewPartySlots && window._ewPartySlots[player] > 0"), 'the exact-seat cap');
    /* the flag is reset with the reserves flag everywhere */
    assert.equal((MP.match(/state\.noRespawns = false;/g) || []).length, (MP.match(/state\.reserves = false;/g) || []).length, 'map.js: every reserves reset resets noRespawns');
    assert.equal((UI.match(/state\.noRespawns = false;/g) || []).length, (UI.match(/state\.reserves = false;/g) || []).length, 'ui.js too');
    /* the launch: the party is the source, the reserves gate reads it, the enemy at the native's size, exact seating, the fit gate */
    assert.ok(MP.includes("let party = _hqPartyLaunch() || _hqLastParty();"), 'the encounter fights with THE PARTY');
    assert.ok(MP.includes("const _reservesLaunch = (!!_msReserves || _encParty_) && gm.id !== 'gauntlet'") && MP.includes("state.noRespawns = _encParty_;"), '_msConfirm: a party encounter is a no-respawn reserves match');
    assert.ok(MP.includes("window._ewPartySlots = { 1: state.partyBuilds[1].length, 2: _en };") && MP.includes("finally { window._ewPartySlots = null; }"), 'the exact seats, for this build only');
    assert.ok(MP.includes("while (!(party && party.exact) && builds.length < n) {"), 'an exact party is never padded');
    assert.ok(MP.includes("if (pf && pf.total > 0 && !pf.ready) { _hqToast('<b>THE PARTY IS DOWN</b>"), 'nobody fit → no fight');
    /* the commit writes the party home by id (the board and the bench) */
    assert.ok(BT.includes("if (vit.length) partyRes = hqPartyAfterMatch(p, { won, units: vit, xpPool, bag: bagHome, gauge: gaugeHome });") && BT.includes("(state.units || []).concat(benchBodies)"), 'battle.js: the commit (+ THE POOL, 2026-09-21)');
    assert.ok(BT.includes("party: partyRes };"), 'the result carries what the fight did to the party');
    /* the pause menu */
    ['function _hqPartyTx(fn)', 'function _hqPartySeed()', "data-party-act=\"cast:", "data-party-act=\"swap:", "data-party-act=\"relieve:", "data-party-act=\"enlist:", "data-party-act=\"item:", 'function _hqPartyAct(act)', "window._hqPartyRest = function ()", "if (c.id === 'cot' || c.id === 'healzone') {", "[data-party-rest]"].forEach(s => assert.ok(MP.includes(s), 'map.js: ' + s));
    assert.ok(MP.includes("sub: 'TWO SHIFTS · FIELD MEDICINE'"));
    ['.hq-pp-card.tgt', '.hq-pp-downstamp', '.hq-pp-vbar.hp i', '.hq-pp-arm', '.hq-pp-oncall', '.hq-pp-duty', '.hq-pp-empty', '.hq-pp-msg.bad'].forEach(s => assert.ok(CSS.includes(s), 'css: ' + s));
});

/* ══ THE BAG + THE QUICK ACTIONS + THE DISPENSARY + AUTO HEAL (2026-09-20) ══ */
const SV = fs.readFileSync(__dirname + '/server.js', 'utf8');
const PF = fs.readFileSync(__dirname + '/profile.js', 'utf8');
const PB = fs.readFileSync(__dirname + '/party-builder.js', 'utf8');

test('THE BAG: the record, add / take, NO stack cap (2026-09-21), the list, the field-only items', () => {
    const p = profile();
    assert.equal(g('hqBagRecord')(p, false), null, 'no bag until something goes in');
    assert.equal(g('hqBagCount')(p, 'healPotion'), 0);
    const a = g('hqBagAdd')(p, 'healPotion', 3); assert.ok(a.ok && a.added === 3 && a.n === 3);
    assert.equal(g('hqBagAdd')(p, 'nonsense', 1).reason, 'item', 'an unknown key never enters');
    assert.equal(R.bagStack, 0, 'THE BAG (2026-09-21, the user: "no item limit in the bag"): bagStack 0 = unlimited');
    const over = g('hqBagAdd')(p, 'healPotion', 40); assert.equal(over.n, 43); assert.equal(over.lost, 0, 'nothing is lost — the bag has no cap');
    const t = g('hqBagTake')(p, 'healPotion', 2); assert.ok(t.ok && t.taken === 2 && t.n === 41);
    assert.equal(g('hqBagTake')(p, 'elixir', 1).ok, false, 'nothing to take');
    g('hqBagAdd')(p, 'elixir', 1); g('hqBagAdd')(p, 'scanner', 2);
    const rows = g('hqBagList')(p);
    deq(rows.map(r => r.key), ['healPotion', 'elixir', 'scanner'], 'the shelf order');
    const el = rows.find(r => r.key === 'elixir'); assert.ok(el.field && !el.battle, 'an elixir is field-only');
    const sc = rows.find(r => r.key === 'scanner'); assert.ok(!sc.field && sc.battle, 'a scanner is a battle item, never a field use');
    assert.equal(g('hqBagTotal')(p), 41 + 3);
    assert.equal(g('hqBagList')(p)[0].max, Infinity, 'a row reports no cap');
    const META = g('ITEM_META'); ['reviveTonic', 'elixir'].forEach(k => assert.ok(D.ITEM_RULES[k] && D.ITEM_RULES[k].fieldOnly && META[k], k + ' is a field-only ITEM_RULES row with its META'));
    const back = JSON.parse(JSON.stringify(p)); assert.equal(g('hqBagCount')(back, 'elixir'), 1, 'the bag survives JSON');
});

test('THE DISPENSARY: the stock, a quote, the buy after the gold moved, the sell-back at half, the room', () => {
    const stock = g('hqShopStock')();
    deq(stock.map(r => r.key), J(D.HQ_DISPENSARY.stock), 'the shelf is the table');
    stock.forEach(r => { assert.ok(r.price > 0, r.key + ' has a price'); assert.equal(r.sell, Math.floor(r.price * R.sellBack), 'half back'); });
    const p = profile({ account: { gold: 100, unlockedUnits: ['knight'] } });
    assert.equal(g('hqShopQuote')(p, 'elixir', 1).reason, 'gold');
    assert.equal(g('hqShopQuote')(p, 'nonsense', 1).reason, 'stock');
    const q = g('hqShopQuote')(p, 'healPotion', 2); assert.ok(q.ok && q.cost === 2 * D.ITEM_RULES.healPotion.shopPrice);
    /* the caller pays first (profile.js spendGold); the apply never touches the gold */
    p.account.gold -= q.cost;
    const b = g('hqShopBuyApply')(p, 'healPotion', 2); assert.ok(b.ok && b.added === 2 && p.account.gold === 100 - q.cost, 'the goods in, the gold untouched by the apply');
    g('hqBagAdd')(p, 'healPotion', 500); assert.ok(g('hqShopQuote')(p, 'healPotion', 1).ok || g('hqShopQuote')(p, 'healPotion', 1).reason !== 'full', 'a bag is never full (2026-09-21)');
    const sell = g('hqShopSell')(p, 'healPotion', 3); assert.ok(sell.ok && sell.sold === 3 && sell.refund === 3 * Math.floor(D.ITEM_RULES.healPotion.shopPrice * R.sellBack), 'three back at half');
    assert.equal(g('hqShopSell')(p, 'elixir', 1).reason, 'none');
    /* ROOM 911 off the Medical Wing: the hatch is the overlay's ONE home, the bag a by-id panel, the door lands in the wing */
    const room = D.DOOR_HQ.rooms.dispensary; assert.ok(room && room.kind === 'box' && room.roomNo === '911');
    const hatch = room.counters.find(c => c.id === 'pharmacy'); assert.ok(hatch && hatch.action.overlay === 'pharmacy' && hatch.verb === 'SHOP');
    const bag = room.counters.find(c => c.id === 'bag'); assert.ok(bag && !bag.action.overlay && !bag.action.fn && bag.desc, 'the bag is a by-id panel');
    const wing = D.DOOR_HQ.rooms.medwing.doors.find(d => d.id === 'dispensary'); assert.ok(wing && wing.action.room === 'dispensary' && wing.action.at === 'egress', 'the wing has the door');
    const out = room.doors.find(d => d.id === 'egress'); assert.ok(out && out.action.room === 'medwing' && out.action.at === 'dispensary', 'the way out lands on that door');
    assert.equal(g('hqRoomNo')('dispensary'), '911');
    assert.ok(room.props.some(p2 => p2.key === 'railing_1m'), 'THE PARK RULE');
});

test('THE SHARED BAG (2026-09-21): the pockets POOL into the bag, the launch carries the bag and empty pockets, a field-only item never rides, the commit brings the bag home', () => {
    const p = profile({ account: { gold: 0, unlockedUnits: ['knight', 'wizard', 'door agent', 'cowboy', 'nun'] } }); g('hqPartyEnsure')(p, { last });
    const rec = g('hqPartyRecord')(p);
    rec.members.forEach(m => { m.loadout.items = {}; });
    rec.members[0].loadout.items = { healPotion: 2, manaPotion: 1 };   // a forge leftover in the officer's pocket
    rec.members[1].hp = 0; rec.members[1].hpMax = 100;
    g('hqBagAdd')(p, 'healPotion', 3); g('hqBagAdd')(p, 'manaPotion', 5); g('hqBagAdd')(p, 'elixir', 1);
    assert.equal(R.sharedBag, true, 'the rule is on the table');
    const st = g('hqPartyStock')(p);
    assert.ok(st.ok && st.total === 3, 'the pocket items pooled INTO the bag (2 + 1)');
    assert.equal(rec.members[0].loadout.items.healPotion, undefined, 'the pocket is empty now');
    assert.equal(g('hqBagCount')(p, 'healPotion'), 5); assert.equal(g('hqBagCount')(p, 'manaPotion'), 6);
    assert.equal(g('hqPartyStock')(p).total, 0, 'a second pool moves nothing');
    const L = g('hqPartyForLaunch')(p);
    L.members.forEach(m => assert.equal(Object.keys(m.loadout.items).length, 0, 'nobody carries pockets into a story fight'));
    deq(L.bag, { healPotion: 5, manaPotion: 6 }, 'the bag rides — its BATTLE keys only (the elixir stays home)');
    /* the commit: the bag comes home whole; a unit's items are never read when the bag is given */
    g('hqPartyAfterMatch')(p, { won: true, units: [{ partyId: rec.members[0].id, hp: 50, maxHp: 100, mp: 5, maxMp: 20, dead: false, items: { healPotion: 99 } }], bag: { healPotion: 1, manaPotion: 6 } });
    const m0 = g('hqPartyRecord')(p).members[0];
    assert.equal(m0.loadout.items.healPotion, undefined, 'the commit never writes a pocket when the bag came home');
    assert.equal(g('hqBagCount')(p, 'healPotion'), 1, 'what the fight spent stays spent'); assert.equal(g('hqBagCount')(p, 'manaPotion'), 6); assert.equal(g('hqBagCount')(p, 'elixir'), 1, 'the field-only rows that never left are kept');
    /* the battle's binding + the skip list + the state field */
    const BT2 = fs.readFileSync(__dirname + '/battle.js', 'utf8');
    ['function _partyBagBind()', 'if (_partyBagOn()) return 9999;', "bag: bagHome, gauge: gaugeHome });", 'u.items = bag; n++;'].forEach(s => assert.ok(BT2.includes(s), 'battle.js: ' + s));
    assert.ok(fs.readFileSync(__dirname + '/state.js', 'utf8').includes('partyBag: null,'), 'state.js carries partyBag');
    assert.ok(fs.readFileSync(__dirname + '/online.js', 'utf8').includes('partyBag: 1,'), 'online.js skip-lists it');
    assert.ok(MP.includes('state.partyBag = (_encParty_ && _encPeek.bag'), 'map.js sets the bag at the launch');
    assert.ok(fs.readFileSync(__dirname + '/hud.js', 'utf8').includes("text: bag ? 'The Bag' : 'Items'"), 'the HUD panel reads THE BAG');
});

test('FIELD MEDICINE from the bag: a potion, a tonic on the down, an elixir', () => {
    const p = profile({ account: { gold: 0, unlockedUnits: ['knight', 'wizard', 'door agent', 'cowboy', 'nun'] } }); g('hqPartyEnsure')(p, { last });
    const rec = g('hqPartyRecord')(p); const units = {}; rec.members.forEach(m => { units[m.id] = unitOf(m, 200, 40); });
    const [me, dutch, sister] = rec.members;
    dutch.hp = 0; dutch.hpMax = 200; dutch.mp = 0; dutch.mpMax = 40;
    sister.hp = 20; sister.hpMax = 200; sister.mp = 10; sister.mpMax = 40;
    assert.equal(g('hqPartyUseItem')(p, units, 'bag', 'healPotion', sister.id).reason, 'none', 'an empty bag');
    g('hqBagAdd')(p, 'healPotion', 1); g('hqBagAdd')(p, 'reviveTonic', 1); g('hqBagAdd')(p, 'elixir', 1);
    assert.equal(g('hqPartyUseItem')(p, units, 'bag', 'reviveTonic', sister.id).reason, 'notdown', 'a tonic wants the down');
    assert.equal(g('hqPartyUseItem')(p, units, 'bag', 'healPotion', dutch.id).reason, 'down', 'a potion never wakes the down');
    const rv = g('hqPartyUseItem')(p, units, 'bag', 'reviveTonic', dutch.id); assert.ok(rv.ok && rv.revived && rv.from === 'bag' && rv.left === 0); assert.equal(dutch.hp, 100, 'up at half');
    const hp = g('hqPartyUseItem')(p, units, 'bag', 'healPotion', sister.id); assert.ok(hp.ok && hp.amount === 60 && sister.hp === 80);
    const ex = g('hqPartyUseItem')(p, units, 'bag', 'elixir', sister.id); assert.ok(ex.ok && sister.hp === 200 && sister.mp === 40, 'an elixir fills both');
    assert.equal(g('hqPartyUseItem')(p, units, 'bag', 'elixir', me.id).reason, 'none', 'the bag is empty again');
    deq(g('hqPartyBagItems')(p), [], 'nothing field-usable left');
});

test('AUTO HEAL: the down first (a revive spell, then a tonic), then the hurt lowest-first (heal-all, a single heal, the potions), a mana potion only for a dry caster', () => {
    const p = profile({ account: { gold: 0, unlockedUnits: ['knight', 'wizard', 'door agent', 'cowboy', 'nun'] } }); g('hqPartyEnsure')(p, { last });
    const rec = g('hqPartyRecord')(p); const [me, dutch, sister] = rec.members;
    const heal = D.SPELL_BY_ID.heal1; assert.ok(heal && heal.kind === 'heal');
    const units = {}; rec.members.forEach(m => { units[m.id] = unitOf(m, 200, 100); });
    units[sister.id].spells = [heal];
    /* nothing to do */
    let r = g('hqPartyAutoHeal')(p, units); assert.ok(r.ok && r.did === 0 && r.note === 'EVERYONE IS FULL');
    /* the down with no revive on hand is SKIPPED and said so; the hurt are healed with the sister's spell first */
    dutch.hp = 0; dutch.hpMax = 200; dutch.mp = 0; dutch.mpMax = 100;
    me.hp = 40; me.hpMax = 200; me.mp = 100; me.mpMax = 100;
    sister.hp = 150; sister.hpMax = 200; sister.mp = 100; sister.mpMax = 100;
    r = g('hqPartyAutoHeal')(p, units);
    assert.ok(r.steps.some(s => s.kind === 'skip' && s.why === 'NO REVIVE ON HAND'), 'the down without a revive is named');
    assert.ok(r.steps.filter(s => s.kind === 'cast').length >= 1 && r.steps[1].kind === 'cast', 'the spell before any potion');
    assert.equal(dutch.hp, 0, 'still down'); assert.ok(me.hp > 40 && r.healed > 0);
    /* a tonic in the bag wakes him; potions finish what the MP cannot */
    g('hqBagAdd')(p, 'reviveTonic', 1); g('hqBagAdd')(p, 'healPotion', 6); sister.mp = 0;
    r = g('hqPartyAutoHeal')(p, units);
    assert.ok(r.steps[0].kind === 'item' && r.steps[0].key === 'reviveTonic' && r.revived === 1, 'the tonic first');
    assert.ok(r.steps.some(s => s.kind === 'item' && s.key === 'healPotion'), 'then the potions, the caster being dry');
    assert.equal(r.still, 0, r.note); assert.equal(g('hqBagCount')(p, 'reviveTonic'), 0);
    /* the mana potion: a heal wanted, the only caster dry → the potion goes on HER, then she casts */
    me.hp = 20; sister.mp = 0; g('hqBagTake')(p, 'healPotion', 99); rec.members.forEach(m => { delete m.loadout.items.healPotion; }); g('hqBagAdd')(p, 'manaPotion', 1);   // no potions left anywhere: the caster must be watered
    r = g('hqPartyAutoHeal')(p, units);
    const mi = r.steps.findIndex(s => s.kind === 'item' && s.key === 'manaPotion'), ci = r.steps.findIndex(s => s.kind === 'cast');
    assert.ok(mi >= 0 && ci > mi, 'the mana potion on the caster, then her cast: ' + JSON.stringify(r.steps));
    assert.ok(r.steps.length <= R.autoHeal.maxSteps);
});

test('THE SOURCE SITES (2026-09-20): the quick strip, the ITEMS sheet, the walk-to buttons, the hatch, the wallet, the endpoint, the guards', () => {
    /* map.js — the pause menu */
    ["{ id: 'items',     label: 'ITEMS',", 'function _hqPauseCardQuickHtml(', 'function _hqPauseQuickBarHtml(', 'function _hqPauseBagHtml()', "data-party-act=\"autoheal\"", "data-party-act=\"restock\"", "data-party-act=\"itemon:", "data-party-act=\"bag:", "data-member-sheet=", "data-pause-room=\"medical\" data-pause-at=\"cot\"", "data-pause-room=\"dispensary\"", "else if (P.cmd === 'items') body.innerHTML = safe(_hqPauseBagHtml, 'items');", "e.target.closest('[data-pause-room]')", "else if (verb === 'autoheal') {", "else if (verb === 'restock') {", 'function _hqPartyItemOn(owner, key, target, units, rec)', "_hqPartyTx(q => window.hqPartyStock(q));"].forEach(s => assert.ok(MP.includes(s), 'map.js: ' + s));
    assert.ok(MP.includes('return `<div class="${cls}" data-member="${_hqEsc(m.id)}" role="button" tabindex="0"'), 'the card is a div now (buttons inside it)');
    /* map.js — the dispensary */
    ["if (act.overlay === 'pharmacy') return _hqPharmacyHtml();", 'function _hqPharmacyHtml()', 'window._hqShopBuy = async function (key, n)', 'window._hqShopSell = async function (key, n)', "e.target.closest('[data-buy]')", "e.target.closest('[data-sell]')", "if (c.id === 'bag') {", "PS.spendGold(q.cost, 'dispensary:'"].forEach(s => assert.ok(MP.includes(s), 'map.js: ' + s));
    const buyAt = MP.indexOf("await PS.spendGold(q.cost"), applyAt = MP.indexOf("window.hqShopBuyApply(p, key, n)");
    assert.ok(buyAt > 0 && applyAt > buyAt, 'the gold moves BEFORE the goods go into the bag');
    /* profile.js + server.js — the wallet */
    ['function localSpendGold(amount)', 'async function spendGold(amount, reason)', "fetch('/api/economy/spend'", '  spendGold,', '  localSpendGold,'].forEach(s => assert.ok(PF.includes(s), 'profile.js: ' + s));
    ["app.post('/api/economy/spend', limitEcon, async (req, res) => {", "'UPDATE players SET gold = gold - ?1 WHERE id = ?2 AND gold >= ?1'", 'amt < -SPEND_REFUND_CAP'].forEach(s => assert.ok(SV.includes(s), 'server.js: ' + s));
    /* the field-only guard at every loadout funnel; the commit carries the pockets */
    assert.ok(BT.includes("const cap = iRule.fieldOnly ? 0 : getItemCapForClass(cls, iKey);") && ST.includes("const cap = iRule.fieldOnly ? 0 : getItemCapForClass(cls, iKey);"), 'normalizeLoadoutForClass caps a field-only item to 0 on both sides');
    assert.ok(PB.includes(".filter(k => !(window.ITEM_RULES[k] && window.ITEM_RULES[k].fieldOnly))"), 'the forge never offers one');
    assert.ok(BT.includes("dead: !!(u.dead || u._dying), items: Object.assign({}, u.items || {}),"), 'the commit carries the pockets');
    /* the pay cache drops a potion */
    assert.ok(D.HQ_FIND_RULES.potionDrop && D.HQ_FIND_RULES.potionDrop.healPotion > 0, 'the drop table');
    ['.hq-pp-quick', '.hq-pp-quickbar', '.hq-pp-bag', '.hq-pp-bagrow', '.hq-pp-pockets', '.hq-shop-row', '.hq-shop-price'].forEach(s => assert.ok(CSS.includes(s), 'css: ' + s));
});

test('THE LEVEL\'S MAX (2026-09-21): a stored max from a cap-level fight is read as a FRACTION of the built unit\'s max; hqPartyResync heals the record once; the pause menu calls it', () => {
    const p = profile(); g('hqPartyEnsure')(p, { last });
    const r = g('hqPartyRecord')(p); const m = r.members[1];
    m.hp = 800; m.hpMax = 800; m.mp = 60; m.mpMax = 120;                       // what a level-100 fight filed before THE LEVELS
    const u = unitOf(m, 57, 24);                                                // the level-5 build
    let v = g('hqPartyVitals')(m, u);
    assert.equal(v.hpMax, 57, 'the level\'s max wins'); assert.equal(v.hp, 57, 'full stays full'); assert.equal(v.mpMax, 24); assert.equal(v.mp, 12, 'half stays half'); assert.equal(v.rescaled, true);
    m.hp = 200; v = g('hqPartyVitals')(m, u); assert.equal(v.hp, 14, 'a quarter stays a quarter'); assert.equal(v.down, false);
    m.hp = 0; v = g('hqPartyVitals')(m, u); assert.equal(v.hp, 0); assert.equal(v.down, true, 'DOWN stays down');
    assert.equal(g('hqPartyVitals')(m, null).hpMax, 800, 'no unit = the stored numbers as before');
    m.hp = 400;
    const units = {}; units[m.id] = u;
    assert.equal(g('hqPartyResync')(p, units), 1, 'one member moved');
    assert.equal(m.hpMax, 57); assert.equal(m.hp, 29); assert.equal(m.mpMax, 24); assert.equal(m.mp, 12);
    assert.equal(g('hqPartyResync')(p, units), 0, 'the second pass is a no-op');
    assert.equal(g('hqPartyVitals')(m, u).rescaled, false);
    assert.equal(g('hqPartyVitals')(r.members[0], unitOf(r.members[0], 57, 24)).hpMax, 57, 'a member who never fought reads the unit\'s');
    assert.match(MP, /P\.resynced = true;[\s\S]{0,600}window\.hqPartyResync\(p, o\)/, 'the pause menu resyncs once per open');
    assert.match(D_SRC, /window\.hqPartyResync = hqPartyResync/);
});

/* ══ THE CIRCUIT IN THE FIELD (2026-09-21): the forge's spell tree on the pause menu's member sheet ══ */
test('THE CIRCUIT IN THE FIELD: the model (three lanes, ring 4 → 1, the states), one click equips the path, an equipped node cascades, a fork swaps in place, the cap refuses, the writes land in BOTH places', () => {
    const p = profile();
    g('hqPartyEnsure')(p, {});
    const rec = g('hqPartyRecord')(p);
    const knight = rec.members.find(m => m.meta.race === 'knight') || rec.members.find(m => m.cls !== 'Freelancer' && m.meta.race !== 'door agent');
    assert.ok(knight, 'a tree-class member on the seed');
    const C0 = g('hqPartyTreeCircuit')(knight);
    assert.equal(C0.lanes.length, 3); assert.equal(C0.lanes.map(l => l.key).join(''), 'PRS');
    assert.equal(C0.lanes[0].nodes.map(n => n.ring).join(''), '4321');
    assert.equal(C0.cap, D.SPELL_SLOT_MAX);
    const P1 = C0.lanes[0].nodes.find(n => n.key === 'P1'), P4 = C0.lanes[0].nodes.find(n => n.key === 'P4');
    assert.equal(P1.st, 'reachable'); assert.equal(P4.st, 'far'); assert.equal(P4.need, 4); assert.ok(P4.capstone);
    /* one click on the capstone equips the whole pillar */
    const r1 = g('hqPartyTreeClick')(p, knight.id, 'P4');
    assert.ok(r1.ok && r1.kind === 'equip' && r1.added.length === 4, JSON.stringify(r1));
    let m = g('hqPartyRecord')(p).members.find(x => x.id === knight.id);
    assert.equal(m.meta.customSpells.length, 4); assert.equal(m.loadout.spells.join(','), m.meta.customSpells.join(','), 'both places');
    assert.ok(g('isTreeLoadoutLegal')(m.meta.race, m.cls, '', m.meta.customSpells));
    /* the model reads the cascade: P1 takes the three above it */
    const C1 = g('hqPartyTreeCircuit')(m);
    assert.equal(C1.used, 4); assert.equal(C1.lanes[0].nodes.find(n => n.key === 'P1').drop, 4);
    /* the cap: the race capstone (+4) does not fit beside a full pillar */
    const r2 = g('hqPartyTreeClick')(p, knight.id, 'R4');
    assert.ok(!r2.ok && r2.reason === 'cap', JSON.stringify(r2));
    assert.ok(C1.lanes[1].nodes.find(n => n.key === 'R4').over);
    /* unequip P2 → P2, P3, P4 go, P1 stays */
    const r3 = g('hqPartyTreeClick')(p, knight.id, 'P2');
    assert.ok(r3.ok && r3.kind === 'unequip' && r3.dropped.length === 3, JSON.stringify(r3));
    m = g('hqPartyRecord')(p).members.find(x => x.id === knight.id);
    assert.equal(m.meta.customSpells.length, 1);
    /* the root and an empty node refuse */
    assert.equal(g('hqPartyTreeClick')(p, knight.id, 'root').reason, 'root');
    assert.equal(g('hqPartyTreeClick')(p, knight.id, 'S1').reason, 'empty');
    /* THE FORK: the door agent's R1 is a twin — equip one, the other reads swap, a click trades in place */
    const agent = rec.members.find(x => x.meta.race === 'door agent');
    assert.ok(agent);
    const ra = g('hqPartyTreeClick')(p, agent.id, 'R1'); assert.ok(ra.ok, JSON.stringify(ra));
    const CA = g('hqPartyTreeCircuit')(g('hqPartyRecord')(p).members.find(x => x.id === agent.id));
    const fork = CA.lanes[1].nodes.find(n => n.key === 'R1');
    assert.ok(fork.alts && fork.alts.length === 2);
    const other = fork.alts.find(a => a.st === 'swap'); assert.ok(other, 'the other option reads swap');
    const rs = g('hqPartyTreeClick')(p, agent.id, 'R1', other.id);
    assert.ok(rs.ok && rs.kind === 'swap' && rs.ids.length === 1 && rs.ids[0] === other.id, JSON.stringify(rs));
    /* DEFAULTS · RANDOM · CLEAR are legal writes */
    const rd = g('hqPartySpellsDefault')(p, knight.id); assert.ok(rd.ok && rd.ids.length >= 4);
    const rr = g('hqPartySpellsRandom')(p, knight.id); assert.ok(rr.ok && rr.ids.length >= 1 && g('isTreeLoadoutLegal')(m.meta.race, m.cls, '', rr.ids));
    const rc = g('hqPartySpellsClear')(p, knight.id); assert.ok(rc.ok && rc.ids.length === 0);
    /* an illegal wish-list is repaired, never refused (a stale save) */
    const rw = g('hqPartySetSpells')(p, knight.id, ['judgment', 'guardSlash', 'nonsense']);
    assert.ok(rw.ok && rw.trimmed && rw.ids.join(',') === 'guardSlash', JSON.stringify(rw));
});

test('THE CIRCUIT IN THE FIELD: a Freelancer\'s sockets — the pool at the socket\'s tiers, the socket equip, an out-of-pool or out-of-order pick refuses, the model reads the socket', () => {
    const p = profile();
    g('hqPartyEnsure')(p, {});
    const rec = g('hqPartyRecord')(p);
    const fl = rec.members.find(m => m.cls === 'Freelancer'); assert.ok(fl, 'a Freelancer on the seed');
    const C = g('hqPartyTreeCircuit')(fl);
    assert.ok(C.isFreelancer);
    assert.equal(C.lanes[0].nodes.map(n => n.st).join(','), 'socket,socket,socket,socket');
    assert.equal(C.lanes[0].nodes[3].socket.pool, 'race'); assert.equal(C.lanes[2].nodes[3].socket.pool, 'job');
    assert.equal(g('hqPartyTreeClick')(p, fl.id, 'P1').reason, 'socket', 'a socket click asks for the picker');
    const pool = g('hqPartySocketPool')(fl, 'P1'); assert.ok(pool.length > 20); assert.ok(pool.every(x => x.tier === 'I'));
    const p4 = g('hqPartySocketPool')(fl, 'P4'); assert.ok(p4.length && p4.every(x => x.tier === 'III'));
    const bad = g('hqPartySocketEquip')(p, fl.id, 'P1', p4[0].id); assert.equal(bad.reason, 'pool');
    const early = g('hqPartySocketEquip')(p, fl.id, 'P4', p4[0].id); assert.ok(!early.ok, 'P4 before P1–P3 has no path');
    const ok = g('hqPartySocketEquip')(p, fl.id, 'P1', pool[0].id); assert.ok(ok.ok, JSON.stringify(ok));
    const m = g('hqPartyRecord')(p).members.find(x => x.id === fl.id);
    assert.equal(m.meta.customSpells[0], pool[0].id); assert.equal(m.loadout.spells[0], pool[0].id);
    assert.equal(g('hqPartyTreeCircuit')(m).lanes[0].nodes[3].st, 'equipped');
    assert.equal(g('hqPartySocketEquip')(p, fl.id, 'P1', pool[0].id).reason, 'dup');
});

test('THE CIRCUIT IN THE FIELD: the source sites — the sheet\'s EDIT button, the circuit renderer, the actions, the keys, the CSS, the exports', () => {
    assert.match(MP, /function _hqPauseCircuitHtml\(m\)/);
    assert.match(MP, /function _hqPartyCircuitAct\(verb, a, b, c\)/);
    assert.ok(MP.includes(`data-party-act="circuit:${"$"}{_hqEsc(m.id)}"`), 'the ABILITIES header opens the circuit');
    assert.match(MP, /if \(circOpen\) html \+= _hqPauseCircuitHtml\(m\);/);
    assert.match(MP, /window\.hqPartyTreeClick\(p, a, b, c \|\| null\)/);
    assert.match(MP, /window\.hqPartySocketEquip\(p, a, b, c\)/);
    assert.match(MP, /data-circ-search/, 'the socket picker searches');
    assert.match(MP, /if \(P\.socket\) \{ P\.socket = null; P\.sockQ = ''; _hqPauseRender\(\); \} else if \(P\.circuit\)/, 'ESC closes the picker, then the circuit');
    assert.match(MP, /P\.keepScroll = true;/, 'a node click keeps the sheet where it stood');
    assert.match(CSS, /\.hq-circ-node\.st-equipped/); assert.match(CSS, /\.hq-circ-fork/); assert.match(CSS, /\.hq-circ-picker/);
    for (const fn of ['hqPartyTreeCircuit', 'hqPartyTreeClick', 'hqPartySocketPool', 'hqPartySocketEquip', 'hqPartySetSpells', 'hqPartySpellsDefault', 'hqPartySpellsRandom', 'hqPartySpellsClear']) assert.match(D_SRC, new RegExp('window\\.' + fn + ' = ' + fn + ';'), fn + ' on window');
});

test('THE LEAD WALKS (2026-09-23): the walker is whoever stands in slot 1 — the officer says `you`, any other member its own vessel; the officer swapped to the bench is re-filed by the intake where it stands', () => {
    assert.equal(R.leadWalks, true);
    const p = profile(); g('hqPartyEnsure')(p, { last });
    const lead0 = g('hqPartyLeadAvatar')(p);
    assert.equal(lead0.you, true); assert.equal(lead0.race, 'door agent'); assert.equal(lead0.id, g('hqPartyLead')(p).id);
    const dutch = g('hqPartyShifts')(p).members.find(m => m.meta.race === 'cowboy');
    assert.equal(g('hqPartySwap')(p, dutch.id, lead0.id).ok, true);
    const lead1 = g('hqPartyLeadAvatar')(p);
    assert.equal(lead1.you, false); assert.equal(lead1.race, 'cowboy'); assert.equal(lead1.gender, 'male'); assert.equal(lead1.name, 'Dutch'); assert.equal(lead1.appearance, undefined);
    /* the intake's re-file finds the officer by `you`, never slot 1 */
    g('hqOfficerEnlist')(p, { name: 'AGENT K' });
    const rec = g('hqPartyRecord')(p);
    assert.equal(rec.members[0].meta.race, 'cowboy', 'the cowboy still leads'); assert.equal(rec.members.find(m => m.you).name, 'AGENT K');
    assert.match(MP, /window\.hqPartyLeadAvatar\(profile\)/, 'map.js _hqAvatar reads the lead');
    assert.match(MP, /if \(r\.leadChanged\) \{ try \{ if \(typeof window\._hqRefreshAvatar === 'function'\) window\._hqRefreshAvatar\(\); \}/, 'a swap that changes the lead swaps the rig');
    assert.ok(!MP.includes("return m.id !== arm.from && !m.you;"), 'the swap pick offers slot 1');
    assert.match(D_SRC, /window\.hqPartyLead = hqPartyLead; window\.hqPartyLeadAvatar = hqPartyLeadAvatar; window\.hqPartyGauge = hqPartyGauge;/);
});

test('THE GAUGE CARRIES (2026-09-23): the commit files the seat\'s gauge, the launch hands it out, a strike\'s 0 carries, the cot never touches it; the sources on both sides', () => {
    assert.equal(R.carryGauge, true);
    const p = profile(); g('hqPartyEnsure')(p, { last });
    assert.equal(g('hqPartyGauge')(p), 0, 'nothing filed = 0');
    const you = g('hqPartyLead')(p);
    const r1 = g('hqPartyAfterMatch')(p, { won: true, units: [{ partyId: you.id, hp: 30, maxHp: 60, mp: 5, maxMp: 20, dead: false }], gauge: 64 });
    assert.equal(r1.gauge, 64); assert.equal(g('hqPartyGauge')(p), 64);
    assert.equal(g('hqPartyForLaunch')(p).gauge, 64, 'the launch carries it');
    g('hqPartyRestore')(p); assert.equal(g('hqPartyGauge')(p), 64, 'the cot rests bodies, not the gauge');
    g('hqPartyAfterMatch')(p, { won: false, units: [{ partyId: you.id, hp: 0, maxHp: 60, mp: 5, maxMp: 20, dead: true }], gauge: 0 });
    assert.equal(g('hqPartyGauge')(p), 0, 'a strike spent it — 0 carries (a loss too)');
    g('hqPartyAfterMatch')(p, { won: true, units: [{ partyId: you.id, hp: 30, maxHp: 60, mp: 5, maxMp: 20, dead: false }], gauge: 900 });
    assert.equal(g('hqPartyGauge')(p), 100, 'clamped to the gauge\'s max');
    assert.match(MP, /state\.partyGauge = \(_encParty_ && Number\.isFinite\(\+_encPeek\.gauge\)\)/, 'map.js _msConfirm files the opening gauge');
    assert.equal((MP.match(/state\.partyBag = null; state\.partyGauge = 0;/g) || []).length, 3, 'every other launch reset drops it');
    assert.match(BT, /if \(\(state\.partyGauge \| 0\) > 0\) \{ const _gs = \(state\.partyBag && state\.partyBag\.seat\) \|\| 1; state\.entropyGauge\[_gs\] = /, 'battle.js startMatch opens at it');
    assert.match(BT, /hqPartyAfterMatch\(p, \{ won, units: vit, xpPool, bag: bagHome, gauge: gaugeHome \}\)/, 'the commit hands the gauge home');
    assert.match(ST, /partyGauge: 0,/, 'the state literal'); assert.match(fs.readFileSync(__dirname + '/online.js', 'utf8'), /partyGauge: 1,/, 'the online skip list');
});

test('THE LEVEL\'S REST (2026-09-23): a level crossed at the debrief brings the member home FULL; a body dead at the end stays down; the board\'s grantXP heals live', () => {
    assert.equal(D.HQ_LEVEL_RULES.levelHeal, true);
    const p = profile(); g('hqPartyEnsure')(p, { last });
    const you = g('hqPartyLead')(p);
    const big = D.xpThreshold(7) - D.xpThreshold(5) + 5;
    const r = g('hqPartyAfterMatch')(p, { won: true, units: [{ partyId: you.id, hp: 3, maxHp: 60, mp: 1, maxMp: 20, dead: false, xpBattle: big, fought: true }], xpPool: 0 });
    assert.ok(r.leveled >= 1, 'a level crossed'); assert.equal(r.xp[0].healed, true);
    const m = g('hqPartyRecord')(p).members.find(x => x.id === you.id);
    assert.equal(m.hp, null, 'FULL'); assert.equal(m.mp, null, 'FULL');
    /* the same XP on a dead body: the level lands on the ledger, the body stays DOWN */
    const p2 = profile(); g('hqPartyEnsure')(p2, { last }); const y2 = g('hqPartyLead')(p2);
    g('hqPartyAfterMatch')(p2, { won: true, units: [{ partyId: y2.id, hp: 0, maxHp: 60, mp: 1, maxMp: 20, dead: true, xpBattle: big, fought: true }], xpPool: 0 });
    assert.equal(g('hqPartyRecord')(p2).members.find(x => x.id === y2.id).hp, 0, 'DOWN stays down');
    assert.match(BT, /unit\.hp = unit\.maxHp \|\| unit\.hp; unit\.mp = unit\.maxMp \|\| unit\.mp; _lvHealed = true;/, 'grantXP restores on the board');
});
