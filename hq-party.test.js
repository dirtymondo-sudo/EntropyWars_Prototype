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
    deq(J(R.healKinds), ['heal', 'healAll', 'selfHeal', 'revive']); deq(J(R.itemKinds), ['healPotion', 'manaPotion']);
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
    assert.equal(rec2.members.length, R.shift, 'no roster: the officer + three starters fill the first shift');
    assert.ok(rec2.members.slice(1).every(m => ['knight', 'wizard', 'fairy'].includes(m.meta.race)));
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
    assert.equal(rl(p, you.id).reason, 'you'); assert.equal(sw(p, knight.id, you.id).reason, 'you'); assert.equal(sw(p, you.id, knight.id).reason, 'you');
    assert.equal(sw(p, knight.id, wiz.id).ok, true, 'a swap across the line is a shift change');
    assert.ok(S().second.some(m => m.id === knight.id) && S().first.some(m => m.id === wiz.id));
    assert.equal(rl(p, knight.id).ok, true); assert.equal(S().members.length, 7); assert.ok(!S().members.some(m => m.id === knight.id));
    const grey = S().members.find(m => m.meta.race === 'grey');
    assert.equal(sw(p, wiz.id, S().members.length).ok, true, 'a member and an empty slot: to the end of the order');
    assert.equal(S().members[S().members.length - 1].id, wiz.id); assert.ok(grey);
    assert.equal(S().members[0].you, true, 'the officer never moved');
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
    assert.ok(MED.props.some(p => p.key === 'cot' && Math.abs(p.z - cot.z) < 0.3), 'the counter stands at a cot');
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
    assert.ok(BT.includes("if (vit.length) partyRes = hqPartyAfterMatch(p, { won, units: vit });") && BT.includes("(state.units || []).concat((state.bench && state.bench[seat]) || [])"), 'battle.js: the commit');
    assert.ok(BT.includes("party: partyRes };"), 'the result carries what the fight did to the party');
    /* the pause menu */
    ['function _hqPartyTx(fn)', 'function _hqPartySeed()', "data-party-act=\"cast:", "data-party-act=\"swap:", "data-party-act=\"relieve:", "data-party-act=\"enlist:", "data-party-act=\"item:", 'function _hqPartyAct(act)', "window._hqPartyRest = function ()", "if (c.id === 'cot') {", "[data-party-rest]"].forEach(s => assert.ok(MP.includes(s), 'map.js: ' + s));
    assert.ok(MP.includes("sub: 'TWO SHIFTS · FIELD MEDICINE'"));
    ['.hq-pp-card.tgt', '.hq-pp-downstamp', '.hq-pp-vbar.hp i', '.hq-pp-arm', '.hq-pp-oncall', '.hq-pp-duty', '.hq-pp-empty', '.hq-pp-msg.bad'].forEach(s => assert.ok(CSS.includes(s), 'css: ' + s));
});
