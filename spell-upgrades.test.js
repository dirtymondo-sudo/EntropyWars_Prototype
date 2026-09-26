// spell-upgrades.test.js — THE SPELL LIBRARY Phase 5, THE UPGRADES (SPELL_LIBRARY_PLAN.md §4.4, §6.3, §9 row 5).
// The defaults the user left standing (§7 Q3): each upgrade has its own SP price, at most 2 per spell, 7 slots / 16 SP,
// local mods off online; the host validates loadouts with the same repair. Pinned here:
//   1. the seeded registry (the user's list) and the fit / AUTO · CUSTOM · NONE rules;
//   2. every patch key on a fixture def (resolveSpellDef is pure; the base is never touched);
//   3. the SP maths (tier + Σ upgrade SP), the one verdict's reasons, the repair (skips an unaffordable upgrade, spells
//      first), isTreeLoadoutLegal with upgrades, the AI's random spend;
//   4. the derived def survives a snapshot round trip; createUnit / online / the riders / the door gun read it;
//   5. the HQ pause rack's model and click; the forge's ⚙ pins.

'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { loadGameData } = require('./load-data');

const D = loadGameData();
const same = (a, b, msg) => assert.deepStrictEqual(JSON.parse(JSON.stringify(a)), JSON.parse(JSON.stringify(b)), msg);
const read = f => fs.readFileSync(path.join(__dirname, f), 'utf8');
const battleSrc = read('battle.js'), mapSrc = read('map.js'), pbSrc = read('party-builder.js'), onlineSrc = read('online.js'), stateSrc = read('state.js'), hudSrc = read('hud.js'), uiSrc = read('ui.js');

function fnSrc(src, name) {
    const start = src.indexOf('function ' + name + '(');
    assert.notStrictEqual(start, -1, 'missing function ' + name);
    let i = src.indexOf('{', start), depth = 0;
    for (; i < src.length; i++) {
        if (src[i] === '{') depth++;
        else if (src[i] === '}' && --depth === 0) break;
    }
    return src.slice(start, i + 1);
}

/* a top-level function up to the next one (for components whose parameter list is a destructured object) */
function regionSrc(src, name) {
    const start = src.indexOf('function ' + name + '(');
    assert.notStrictEqual(start, -1, 'missing function ' + name);
    return src.slice(start, src.indexOf('\nfunction ', start + 10));
}

const U = D.SPELL_UPGRADES;
const BOLT = { id: 'tBolt', name: 'Test Bolt', kind: 'damage', type: 'damage', dmg: 100, cost: 40, range: 4, tier: 2, damageType: 'magic', statusEffects: [], families: [], upgrades: [], desc: 'Deals damage.' };
const BLAST = { id: 'tBlast', name: 'Test Blast', kind: 'aoe', type: 'damage', dmg: 90, cost: 50, range: 4, aoeRadius: 1, tier: 3, statusEffects: [{ id: 'burn', duration: 2 }], families: [], upgrades: [] };

/* a real kit to test the loadout maths on: a unit whose pool holds single-target damage rows */
function realKit() {
    for (const [race, cls] of [['knight', 'Black Mage'], ['knight', 'Warrior'], ['homosapien', 'Gunslinger'], ['seraphim', 'White Mage']]) {
        const pool = D.unitSpellPool(race, cls).filter(id => !D.spellIsPassive(id));
        const dmg = pool.filter(id => D.spellAllowedUpgrades(id).includes('upDamage'));
        if (dmg.length >= 3) return { race, cls, pool, dmg };
    }
    throw new Error('no fixture kit');
}

test('the registry is seeded with the user\'s list, each row well-formed', () => {
    const ids = Object.keys(U);
    for (const want of ['upDamage', 'upRicochet', 'upExtraTarget', 'upFinisher', 'upKnockback', 'upBlowback', 'upBlast', 'upEfficient', 'upDeploy', 'upTurret', 'upGun'])
        assert.ok(ids.includes(want), want);
    for (const id of ids) {
        const u = U[id];
        assert.strictEqual(u.id, id);
        assert.ok(u.name && typeof u.desc === 'string', id + ' name / desc');
        assert.ok(Number.isInteger(u.sp) && u.sp >= 0 && u.sp <= 4, id + ' sp');
        assert.ok(u.patch && Object.keys(u.patch).length, id + ' patch');
        if (u.requires) assert.ok(D.SPELL_UPGRADE_FITS[u.requires], id + ' requires ' + u.requires);
    }
    assert.strictEqual(D.SPELL_UPGRADE_MAX, 2);
    same(U.upDamage.patch, { dmgMult: 1.15 });
    same(U.upEfficient.patch, { costDelta: -10 });
    same(U.upExtraTarget.patch, { extraTargets: 1, extraTargetsMult: 0.5 });
});

test('which upgrades a spell allows: AUTO (fits), CUSTOM (its list), NONE; passives never', () => {
    const auto = D.spellAllowedUpgrades(BOLT);
    for (const u of ['upDamage', 'upRicochet', 'upExtraTarget', 'upBlast', 'upKnockback', 'upEfficient', 'upReach']) assert.ok(auto.includes(u), 'auto ' + u);
    for (const u of ['upWiden', 'upDeploy', 'upTurret', 'upGun', 'upBlowback', 'upFinisher', 'upLinger']) assert.ok(!auto.includes(u), 'not ' + u);
    const aoe = D.spellAllowedUpgrades(BLAST);
    assert.ok(aoe.includes('upWiden') && aoe.includes('upLinger') && !aoe.includes('upBlast') && !aoe.includes('upRicochet'), 'an area cast widens, never splashes');
    same(D.spellAllowedUpgrades(Object.assign({}, BOLT, { upgrades: ['upDamage', 'nope'] })), ['upDamage'], 'CUSTOM, unknown ids dropped');
    same(D.spellAllowedUpgrades(Object.assign({}, BOLT, { upgradesAuto: false })), [], 'NONE');
    same(D.spellAllowedUpgrades(D.GEAR_PASSIVES[0]), [], 'a passive row takes none');
    assert.ok(D.spellLint(Object.assign({}, BOLT, { upgrades: ['upTurret'] })).some(h => h.rule === 'upgradeOffFit'), 'an off-fit tick lints amber');
});

test('every patch key resolves on a fixture def; the base is never touched; id and name are kept', () => {
    const before = JSON.stringify(BOLT);
    const r = (patch, base) => { D.SPELL_UPGRADES.__t = { id: '__t', name: 'T', sp: 1, patch }; try { return D.resolveSpellDef(base || BOLT, ['__t']); } finally { delete D.SPELL_UPGRADES.__t; } };
    assert.strictEqual(r({ dmgMult: 1.15 }).dmg, 115);
    same(r({ dmgMult: 1.5 }, Object.assign({}, BOLT, { dmg: undefined, hitDamages: [20, 30] })).hitDamages, [30, 45]);
    assert.strictEqual(r({ dmgDelta: 20 }).dmg, 120);
    assert.strictEqual(r({ costDelta: -10 }).cost, 30);
    assert.strictEqual(r({ costDelta: -99 }).cost, 5, 'MP floors at 5');
    assert.strictEqual(r({ costMult: 0.8 }).cost, 32);
    assert.strictEqual(r({ apDelta: -1 }).apCost, 1, 'AP floors at 1');
    assert.strictEqual(r({ cooldownDelta: -1 }, Object.assign({}, BOLT, { cooldownRounds: 3 })).cooldownRounds, 2);
    assert.strictEqual(r({ rangeDelta: 1 }).range, 5);
    assert.strictEqual(r({ pushDistance: 1 }).pushDistance, 1);
    assert.strictEqual(r({ pullDistance: 1 }, Object.assign({}, BOLT, { pullDistance: 2 })).pullDistance, 3);
    const sp = r({ aoe: { preset: '3x3', mult: 0.5 } });
    assert.ok(sp.splash && sp.splash.mult === 0.5 && sp.splash.mask.length === 9, 'a single hit gains THE SPLASH RIDER');
    assert.strictEqual(D.splashOffsets(sp).length, 8, 'the victim is never splashed twice');
    const wide = r({ aoe: { preset: '5x5' } }, BLAST);
    assert.strictEqual(wide.aoeMask.length, 25); assert.strictEqual(wide.aoeRadius, 2, 'the mask SETS the radius field (Phase 2 rule)');
    same(r({ extraTargets: 1, extraTargetsMult: 0.5 }).extraTargets, { count: 1, mult: 0.5 });
    same(D.spellExtraTargetsOf(r({ extraTargets: 1, extraTargetsMult: 0.5 })), { count: 1, mult: 0.5 });
    same(r({ ricochet: { radius: 2, mult: 0.5 } }).ricochetRider, { radius: 2, mult: 0.5 });
    same(D.spellRicochetRiderOf(r({ ricochet: { radius: 2, mult: 0.5 } })), { radius: 2, mult: 0.5 });
    assert.strictEqual(D.spellRicochetRiderOf(Object.assign({}, BLAST, { ricochetRider: { radius: 2 } })), null, 'a rider rides the damage kind only');
    same(r({ statusBonus: { add: 0.5 } }, Object.assign({}, BOLT, { bonusVsStatus: { status: 'burn', mult: 1.5 } })).bonusVsStatus, { status: 'burn', mult: 2 });
    same(r({ statusBonus: { status: 'stun', mult: 1.5 } }).bonusVsStatus, { status: 'stun', mult: 1.5 });
    same(r({ statusDuration: 1 }, BLAST).statusEffects, [{ id: 'burn', duration: 3 }]);
    assert.strictEqual(r({ statusChance: -0.5 }, BLAST).statusEffects[0].chance, 0.5);
    assert.strictEqual(r({ elementRider: 'fire' }).element, 'fire');
    assert.strictEqual(r({ deployCapDelta: 1 }, { id: 'd', kind: 'summonUnit', maxActivePerCaster: 1 }).maxActivePerCaster, 2);
    const tur = r({ turret: { dmgMult: 1.25, hpMult: 1.25, rangeDelta: 1 } }, { id: 't', kind: 'deployTurret', turretDmg: 64, turretHp: 80, turretRange: 3 });
    same([tur.turretDmg, tur.turretHp, tur.turretRange], [80, 100, 4]);
    const gun = r({ gun: { dmgMult: 1.2, bounces: 1 } }, { id: 'g', kind: 'doorDeploy', beamDmg: 60, bounces: 3 });
    same([gun.beamDmg, gun.bounces], [72, 4]);
    assert.strictEqual(r({ selfDamagePct: 0.1 }).selfDamagePct, 0.1);
    assert.strictEqual(r({ drainPct: 0.25 }).drainPct, 0.25);
    assert.strictEqual(r({ healMult: 1.5 }, { id: 'h', kind: 'heal', heal: 40 }).heal, 60);
    const two = D.resolveSpellDef(BOLT, ['upDamage', 'upEfficient']);
    assert.strictEqual(two.id, 'tBolt'); assert.strictEqual(two.name, 'Test Bolt', 'a cast resolves by name — never renamed');
    same([two.dmg, two.cost, two._base, two._ups, two._upSp], [115, 30, 'tBolt', ['upDamage', 'upEfficient'], 2]);
    assert.match(two.desc, /^Deals damage\. Upgrades: Empowered .*Efficient/);
    assert.strictEqual(D.resolveSpellDef(BOLT, []), BOLT, 'no upgrades → the base itself');
    assert.strictEqual(JSON.stringify(BOLT), before, 'the base row is never mutated');
    same(JSON.parse(JSON.stringify(two)), two, 'a derived def is plain data — it rides the state-sync snapshot as is');
});

test('SP maths: an equipped spell costs its tier + its upgrades; the verdict names each refusal', () => {
    const K = realKit();
    const [a, b, c] = K.dmg;
    const ids = [a, b, c];
    const base = D.loadoutSpUsed(ids);
    const ups = { [a]: ['upDamage'] };
    assert.strictEqual(D.loadoutSpUsed(ids, ups), base + D.spellUpgradeSp('upDamage'));
    assert.strictEqual(D.loadoutSpUsed(ids, { zzz: ['upDamage'] }), base, 'an upgrade on an unequipped spell costs nothing');
    const V = (u, s, map) => D.spellUpgradeVerdict(K.race, K.cls, ids, map || ups, s || a, u);
    assert.strictEqual(V('upDamage').reason, 'dup');
    assert.strictEqual(D.spellUpgradeVerdict(K.race, K.cls, ids, ups, 'notEquipped', 'upDamage').reason, 'unequipped');
    assert.strictEqual(V('upTurret').reason, 'notAllowed');
    const sp2 = D.spellAllowedUpgrades(a).filter(u => u !== 'upDamage' && !(U[u].excl && U[u].excl === U.upDamage.excl));
    const full = { [a]: ['upDamage', sp2[0]] };
    assert.strictEqual(D.spellUpgradeVerdict(K.race, K.cls, ids, full, a, sp2[1]).reason, 'cap', 'at most 2 per spell');
    if (D.spellAllowedUpgrades(a).includes('upRicochet') && D.spellAllowedUpgrades(a).includes('upBlast'))
        assert.strictEqual(V('upBlast', a, { [a]: ['upRicochet'] }).reason, 'excl', 'one of a kind (spread)');
    // the SP wall: a kit at 16 SP refuses a priced upgrade
    const pad = K.pool.filter(id => !ids.includes(id));
    const big = ids.slice(); for (const id of pad) { if (D.loadoutSpUsed(big.concat(id)) <= 16 && big.length < 7) big.push(id); }
    if (D.loadoutSpUsed(big) === 16) assert.strictEqual(D.spellUpgradeVerdict(K.race, K.cls, big, {}, a, 'upDamage').reason, 'sp');
    // spellAddVerdict counts the upgrades too
    const spAdd = D.spellAddVerdict(K.race, K.cls, ids, pad[0], null, ups);
    assert.strictEqual(spAdd.sp, base + 1);
    assert.strictEqual(V('upEfficient', b, {}).ok, D.spellAllowedUpgrades(b).includes('upEfficient'));
});

test('the repair: spells first; an unaffordable / capped / off-list / excluded upgrade is skipped; legality agrees', () => {
    const K = realKit();
    const [a, b] = K.dmg;
    const ids = [a, b];
    same(D.treeLegalUpgrades(K.race, K.cls, ids, { [a]: ['upDamage', 'upDamage', 'upTurret', 'nope'], zzz: ['upDamage'] }), { [a]: ['upDamage'] });
    const allowed = D.spellAllowedUpgrades(a);
    const three = allowed.filter((u, i, arr) => !U[u].excl || arr.findIndex(x => U[x].excl === U[u].excl) === i).slice(0, 3);
    assert.strictEqual(D.treeLegalUpgrades(K.race, K.cls, ids, { [a]: three })[a].length, 2, 'the third is skipped (the cap)');
    // an unaffordable upgrade: fill the kit to 16 SP with spells — every upgrade is skipped, no spell is dropped
    const big = ids.slice(); for (const id of K.pool) { if (!big.includes(id) && D.loadoutSpUsed(big.concat(id)) <= 16 && big.length < 7) big.push(id); }
    if (D.loadoutSpUsed(big) === 16) {
        same(D.treeLegalUpgrades(K.race, K.cls, big, { [a]: ['upDamage'] }), {}, 'no SP left → skipped');
        assert.strictEqual(D.isTreeLoadoutLegal(K.race, K.cls, '', big, { [a]: ['upDamage'] }), false);
        assert.strictEqual(D.isTreeLoadoutLegal(K.race, K.cls, '', big, {}), true);
    }
    assert.strictEqual(D.isTreeLoadoutLegal(K.race, K.cls, '', ids, { [a]: ['upDamage'] }), true);
    assert.strictEqual(D.isTreeLoadoutLegal(K.race, K.cls, '', ids, { [a]: ['upTurret'] }), false, 'not allowed');
    assert.strictEqual(D.isTreeLoadoutLegal(K.race, K.cls, '', ids, { zzz: ['upDamage'] }), false, 'on a spell not equipped');
    assert.strictEqual(D.isTreeLoadoutLegal(K.race, K.cls, '', ids), true, 'no map → the spell rules only (old callers)');
    // the AI's spend stays legal every time
    let n = 0; const rng = () => { n = (n * 9301 + 49297) % 233280; return n / 233280; };
    for (let i = 0; i < 25; i++) {
        const kit = D.buildTreeLegalLoadout(K.race, K.cls, '', 7, rng);
        const ups = D.buildRandomUpgrades(K.race, K.cls, kit, rng);
        assert.ok(D.isTreeLoadoutLegal(K.race, K.cls, '', kit, ups), 'random kit + upgrades legal');
        assert.ok(D.loadoutSpUsed(kit, ups) <= 16);
    }
});

test('the board: createUnit builds derived defs after the repair; online re-validates; the riders and the door gun read them', () => {
    const cu = mapSrc.slice(mapSrc.indexOf('function createUnit('));
    const blk = cu.slice(cu.indexOf('THE UPGRADES (SPELL_LIBRARY_PLAN.md §6.3, Phase 5)'), cu.indexOf('Passive stat bonuses become REAL here'));
    assert.match(blk, /treeLegalUpgrades\(newUnit\.race, template\.cls, newUnit\._spellSlots, _upWish\)/, 'the repair on the kept kit');
    assert.match(blk, /newUnit\.spellUpgrades = _ups/);
    assert.match(blk, /resolveSpellDef\(sp, _ups\[sp\.id\]\)/, 'one derived def per upgraded spell');
    assert.match(onlineSrc, /window\.treeLegalUpgrades\(mEntry\.race \|\| '', mCls, mEntry\.customSpells, mEntry\.spellUpgrades\)/, 'the host re-validates the guest\'s upgrades');
    assert.match(onlineSrc, /fromId: p\.fromId != null \? p\.fromId : null/, 'the bounce relays its origin');
    assert.match(fnSrc(battleSrc, '_applyDamageSpellHit'), /spell\.ricochetRider \|\| spell\.extraTargets\)\) _applyUpgradeRiders\(unit, spell, target, spellPower\)/);
    const riders = fnSrc(battleSrc, '_applyUpgradeRiders');
    assert.match(riders, /calcBounceTarget\(victim/);
    assert.match(riders, /_extraTargetVictims\(unit, spell, victim, ext\.count\)/);
    assert.match(riders, /playSpellRiderFx\('bounce'/);
    assert.match(fnSrc(battleSrc, 'playSpellRiderFx'), /kind === 'bounce'/);
    assert.match(fnSrc(battleSrc, '_gunDoorSpell'), /s\._ups/, 'a door reads its owner\'s upgraded row');
    assert.match(battleSrc.slice(battleSrc.indexOf('function _gunDoorVolley('), battleSrc.indexOf('function _gunDoorVolley(') + 400), /const spell = _gunDoorSpell\(door\)/);
    // the party meta carries the map everywhere a kit travels
    assert.match(stateSrc, /rebuiltMeta\.spellUpgrades = JSON\.parse/);
    assert.match(stateSrc, /spellUpgrades: \(meta\.spellUpgrades && typeof meta\.spellUpgrades === 'object'\)/);
    assert.match(stateSrc, /meta\.spellUpgrades = \(typeof buildRandomUpgrades === 'function'\)/, 'a CPU kit spends its leftover SP');
    assert.match(hudSrc, /sp\._ups\.length/, 'the battle menu wears ⚙n');
    // the extra-target pick is pure over its inputs: nearest the victim first, then the weakest
    const pick = new Function('unitCryptidHiddenFrom', 'isUnitRealmShieldedFrom', 'isEnemyUnit', '_getSpellValidTargets', 'window',
        fnSrc(battleSrc, '_extraTargetVictims') + '; return _extraTargetVictims;')(null, null, (u, c) => u.player !== c.player,
        () => [{ unit: V }, { unit: E1 }, { unit: E2 }, { unit: E3 }, { unit: A }], {});
    const C = { id: 'c', player: 1, x: 0, y: 0 }, V = { id: 'v', player: 2, x: 5, y: 5, hp: 50 }, E1 = { id: 'e1', player: 2, x: 7, y: 5, hp: 90 },
        E2 = { id: 'e2', player: 2, x: 6, y: 5, hp: 90 }, E3 = { id: 'e3', player: 2, x: 5, y: 7, hp: 20 }, A = { id: 'a', player: 1, x: 5, y: 6, hp: 10 };
    same(pick(C, {}, V, 2).map(u => u.id), ['e2', 'e3'], 'nearest first, the weaker on a tie, never an ally or the victim');
});

test('the HQ pause rack: the model lists upgrades per equipped spell, a click toggles, the SP counts, unequip drops them', () => {
    const K = realKit();
    const [a, b] = K.dmg;
    const profile = { door: { hq: { party: { v: 1, seq: 2, members: [{ id: 'p1', you: true, cls: K.cls, name: 'A', meta: { race: K.race, customSpells: [a, b] },
        loadout: { spells: [a, b], items: {}, equipment: {} } }] } } } };
    const m = D.hqPartyRecord(profile).members[0];
    let C = D.hqPartyTreeCircuit(m);
    const E = C.upgrades.find(x => x.id === a);
    assert.ok(E && E.rows.some(r => r.id === 'upDamage' && r.st === 'ok'));
    const sp0 = C.spUsed;
    const r1 = D.hqPartyUpgradeClick(profile, 'p1', a, 'upDamage');
    assert.ok(r1.ok, r1.note);
    same(m.meta.spellUpgrades, { [a]: ['upDamage'] });
    C = D.hqPartyTreeCircuit(m);
    assert.strictEqual(C.spUsed, sp0 + 1);
    assert.ok(C.upgrades.find(x => x.id === a).derived._ups.includes('upDamage'));
    assert.strictEqual(D.hqPartyUpgradeClick(profile, 'p1', a, 'upTurret').reason, 'notAllowed');
    assert.ok(D.hqPartyUpgradeClick(profile, 'p1', a, 'upDamage').ok, 'off again');
    assert.strictEqual(m.meta.spellUpgrades, undefined);
    D.hqPartyUpgradeClick(profile, 'p1', a, 'upDamage');
    D.hqPartyTreeClick(profile, 'p1', a);   // unequip → its upgrades leave with it
    assert.ok(!m.meta.spellUpgrades || !m.meta.spellUpgrades[a]);
    const L = D.hqPartyForLaunch(profile);
    assert.ok(L && L.members[0].meta, 'the launch meta carries the record');
    assert.match(mapSrc, /data-party-act="upg:\$\{_hqEsc\(m\.id\)\}:\$\{_hqEsc\(E\.id\)\}:\$\{_hqEsc\(u\.id\)\}"/);
    assert.match(mapSrc, /window\.hqPartyUpgradeClick\(p, a, b, c\)/);
});

test('the forge: the ⚙ cell, the technique panel\'s toggles, the SP meter and the presets carry the map', () => {
    assert.match(fnSrc(pbSrc, 'pbTierCtx'), /pbEffUps\(race, cls, eq, upsWish\)/);
    assert.match(fnSrc(pbSrc, 'pbTierCtx'), /spUsed: pbSpUsed\(eq, ups\)/);
    assert.match(fnSrc(pbSrc, 'pbSpellState'), /ctx\.ups\)/);
    assert.match(regionSrc(pbSrc, 'SpellTierPanel'), /className: 'pb-ls-up'/);
    assert.match(regionSrc(pbSrc, 'TechniquePanel'), /className: 'pb-upgrades'/);
    assert.match(pbSrc, /function tierUpgradeClick\(spellId, upId\)/);
    assert.match(pbSrc, /window\.spellUpgradeVerdict\(unitRace, clsName, unitTiers\.equipped, unitTiers\.ups, spellId, upId\)/);
    assert.match(pbSrc, /spellUpgrades: mt\.spellUpgrades \? JSON\.parse/, 'the team archive saves it');
    assert.match(pbSrc, /onUpgrade: tierUpgradeClick/);
    assert.match(uiSrc, /function _slb2UpgradesTabHtml\(r\)/);
    assert.match(uiSrc, /case 'upMode':/, 'the library sets AUTO · CUSTOM · NONE');
    assert.match(uiSrc, /data-key="requires"/, 'the registry editor sets the fit test');
});
