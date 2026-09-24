// hq-intake.test.js — THE INTAKE (2026-09-21): the first thing a new profile does is create its agent.
// The user: "I started a new profile but it still starts me at level 100. Let's make the first thing you
// do when you start a new profile is create a character. They should be a free lancer DOOR agent, but you
// can only learn spells of units you have unlocked in your roster." Guards: the officer record + the enlist
// (data.js HQ_OFFICER_RULES / hqOfficerOnFile / hqOfficerEnlist → member 0 of THE PARTY is a Freelancer
// D.O.O.R. Agent in the creator's look, at the start level), the socket pools gated by THE ROSTER LEDGER in
// story scope and whole elsewhere, THE STORY LEVEL (state.storyLevel: a crossing filed from the building
// builds at the party level, never the cap), the creator look on the agent (sprites.js / state.js), and the
// source sites in map.js / party-builder.js. Repo-only.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { loadGameData } = require('./load-data');
const D = loadGameData();
const g = name => vm.runInContext(name, D);
const J = o => JSON.parse(JSON.stringify(o));
const MP = fs.readFileSync(__dirname + '/map.js', 'utf8');
const PB = fs.readFileSync(__dirname + '/party-builder.js', 'utf8');
const SP = fs.readFileSync(__dirname + '/sprites.js', 'utf8');
const ST = fs.readFileSync(__dirname + '/state.js', 'utf8');
const OL = fs.readFileSync(__dirname + '/online.js', 'utf8');
const UI = fs.readFileSync(__dirname + '/ui.js', 'utf8');
const IDX = fs.readFileSync(__dirname + '/index.html', 'utf8');
const profile = (o) => Object.assign({ username: 'MONDO', account: { gold: 0, unlockedUnits: D.ACCT_STARTER_UNITS.slice() }, door: { clearance: 1, hq: {} } }, o || {});
const look = { gender: 'female', appearance: { hair: 'hair003', skin: '#c68642' }, portrait: 'data:image/jpeg;base64,AAAA', name: 'AGENT BELLE' };

test('THE RULES: the officer is a Freelancer D.O.O.R. Agent, the intake is on, the race is a starter with a rigged model', () => {
    const R = D.HQ_OFFICER_RULES;
    assert.equal(R.race, 'door agent'); assert.equal(R.cls, 'Freelancer'); assert.equal(R.intake, true);
    assert.ok(D.ACCT_STARTER_UNITS.includes(R.race), 'the agent is a starter on every profile');
    assert.ok(D.AVAILABLE_RACES.includes(R.race));
    assert.ok(g('classHasSpellTree')(R.cls), 'the Freelancer has the socket tree');
    assert.equal(D.HQ_LEVEL_RULES.start, 5, 'story mode starts at 5');
});

test('THE ENLIST: no record → hqOfficerOnFile false; enlist files the look, the chair, the record and member 0 (a Freelancer DOOR agent in the look, LV 5)', () => {
    const p = profile();
    assert.equal(g('hqOfficerOnFile')(p), false);
    assert.equal(g('hqOfficerRecord')(p), null);
    const rec = g('hqOfficerEnlist')(p, look);
    assert.ok(rec && rec.created && rec.race === 'door agent' && rec.cls === 'Freelancer', 'the record');
    assert.equal(rec.name, 'AGENT BELLE');
    assert.equal(g('hqOfficerOnFile')(p), true);
    const lk = g('hqLook')(p);
    assert.ok(lk && lk.gender === 'female' && lk.portrait === look.portrait && lk.name === 'AGENT BELLE', 'the look is the mirror\'s record');
    assert.equal(g('hqAvatarPref')(p).mode, 'look', 'the chair sits you as the look');
    const party = g('hqPartyRecord')(p);
    assert.ok(party && party.members.length >= 1, 'the party was seeded');
    const m0 = party.members[0];
    assert.equal(m0.you, true); assert.equal(m0.cls, 'Freelancer'); assert.equal(m0.meta.race, 'door agent'); assert.equal(m0.meta.gender, 'female');
    assert.equal(m0.name, 'AGENT BELLE');
    assert.deepEqual(J(m0.meta.appearance.hair), 'hair003', 'the look rides the member');
    assert.equal(g('hqPartyXp')(m0).lvl, 5, 'the officer starts at the start level');
    assert.equal(g('hqPartyLevel')(p), 5, 'the party level is the start level on a fresh profile');
    const L = g('hqPartyForLaunch')(p);
    assert.equal(L.members[0].meta.storyLevel, 5, 'the launch builds the officer at 5');
    assert.equal(L.members[0].meta.race, 'door agent'); assert.equal(L.members[0].cls, 'Freelancer');
    /* one vessel per race: the seed never adds a second door agent beside the officer */
    assert.equal(party.members.filter(m => m.meta.race === 'door agent').length, 1);
});

test('THE ENLIST twice: a re-file keeps member 0\'s id, ledger and vitals; a new haircut walks in; the name follows', () => {
    const p = profile();
    g('hqOfficerEnlist')(p, look);
    const before = g('hqPartyRecord')(p).members[0];
    before.xp = g('xpThreshold')(9); before.hp = 120; before.hpMax = 300;
    const rec2 = g('hqOfficerEnlist')(p, { gender: 'male', appearance: { hair: 'hair010' }, portrait: null, name: 'AGENT K' });
    const after = g('hqPartyRecord')(p).members[0];
    assert.equal(after.id, before.id, 'the id is kept');
    assert.equal(g('hqPartyXp')(after).lvl, 9, 'the ledger is kept');
    assert.equal(after.hp, 120, 'the vitals are kept');
    assert.equal(after.meta.gender, 'male'); assert.equal(after.meta.appearance.hair, 'hair010'); assert.equal(after.name, 'AGENT K');
    assert.equal(rec2.name, 'AGENT K'); assert.equal(g('hqLook')(p).name, 'AGENT K');
    /* a name-only re-file (the mirror's SAVE) keeps the look */
    g('hqOfficerEnlist')(p, { name: 'AGENT J' });
    assert.equal(g('hqPartyRecord')(p).members[0].meta.appearance.hair, 'hair010'); assert.equal(g('hqPartyRecord')(p).members[0].name, 'AGENT J');
});

test('THE OFFICER without an intake: the legacy seed still stands (the DOOR Agent in its own job; the mirror\'s look = a homosapien)', () => {
    const p = profile();
    const off = g('hqPartyOfficer')(p);
    assert.equal(off.meta.race, 'door agent'); assert.equal(off.cls, D.RACE_DEFAULT_JOBS['door agent']);
    g('hqSetLook')(p, look); g('hqSetAvatar')(p, 'look');
    const off2 = g('hqPartyOfficer')(p);
    assert.equal(off2.meta.race, 'homosapien'); assert.equal(off2.cls, 'Freelancer');
});

test('THE STORY ROSTER: the borrow pools are whole in the sandbox / scope all, and the ledger\'s in story scope', () => {
    const w = D.window;
    const all = g('flRacePool')('door agent').length, allJobs = g('flWildcardPool')('door agent').length;
    assert.ok(all > 300 && allJobs > 50, 'the whole catalogue without a scope');
    assert.equal(g('flPoolOwnedOnly')(), false, 'no scope set = the tooling sees everything');
    /* story scope: the ledger is the starters (no ProfileSystem in the sandbox → isUnitOwned's offline fallback) */
    w._ewRosterScope = 'owned';
    try {
        assert.equal(g('flPoolOwnedOnly')(), true);
        const owned = g('flOwnedRaces')();
        assert.deepEqual(J(owned).sort(), J(D.ACCT_STARTER_UNITS.filter(r => g('isUnitOwned')(r))).sort(), 'the owned races are the ledger');
        const rp = g('flRacePool')('door agent');
        assert.ok(rp.length > 0 && rp.length < all, 'the race pool shrank to the owned vessels');
        const ownedIds = new Set(); for (const r of owned) if (r !== 'door agent') for (const id of g('getRaceTreeAllIds')(r, 'Freelancer') || []) ownedIds.add(id);
        assert.ok(rp.every(sp => ownedIds.has(sp.id)), 'every race-socket spell is on an owned race\'s tree');
        assert.ok(!rp.some(sp => sp.id === 'raceLasso'), 'a cowboy\'s spell is not on offer to a profile that never unlocked one');
        const jobs = g('flOwnedJobs')();
        assert.ok(jobs.has('Agent'), 'the agent\'s own job is owned');
        const wp = g('flWildcardPool')('door agent');
        assert.ok(wp.length > 0 && wp.length < allJobs, 'the job pool shrank to the owned vessels\' jobs');
        const jobIds = new Set(); for (const j of jobs) for (const id of D.CLASS_TREE[j] || []) jobIds.add(id);
        assert.ok(wp.every(sp => jobIds.has(sp.id)), 'every job-socket spell is on an owned vessel\'s job tree');
        /* the repair drops what the pool no longer offers, keeps what it does (2026-09-24 SPELL TIERS: borrows, no sockets) */
        const keep = rp[0].id, kept = J(g('treeLegalSubset')('door agent', 'Freelancer', '', [keep, 'raceLasso']));
        assert.ok(kept.includes(keep) && !kept.includes('raceLasso'), 'an unowned spell is dropped; an owned one is kept');
        /* the dev switch / scope all re-open the catalogue */
        w._ewRosterScope = 'all';
        assert.equal(g('flRacePool')('door agent').length, all);
        w._ewRosterScope = 'owned'; w._DEV_UNLOCK_ALL = true;
        assert.equal(g('flPoolOwnedOnly')(), false, 'the dev switch opens the whole roster');
    } finally { delete w._ewRosterScope; delete w._DEV_UNLOCK_ALL; }
});

test('THE STORY LEVEL: a crossing filed from the building builds at the party level; the cap elsewhere; the field is viewer-local', () => {
    assert.ok(/state\.storyLevel = 0;\s*\n\s*try \{ if \(_hqHome && typeof unitRosterScope === 'function' && unitRosterScope\(\) === 'owned'\) \{ const _sl = _hqPartyLevelNow\(\);/.test(MP), '_msConfirm sets the story level in story scope');
    assert.ok(MP.includes("const _storyLv = (typeof state !== 'undefined' && (state.storyLevel | 0) > 0)"), 'createUnit\'s cap branch reads it');
    assert.ok(MP.includes("const targetLevel = _storyLv || ((typeof MODE_LEVEL_RULES !== 'undefined') ? MODE_LEVEL_RULES.pvpNormalizedLevel : XP_MAX_LEVEL);"));
    assert.equal((MP.match(/state\.storyLevel = 0;/g) || []).length, 4, 'the three launch resets in map.js + _msConfirm\'s own');
    assert.equal((UI.match(/state\.storyLevel = 0;/g) || []).length, 2, 'the two launch resets in ui.js');
    assert.ok(ST.includes('storyLevel: 0,'), 'the state literal');
    assert.ok(/storyLevel: 1,/.test(OL), 'never synced (online is scope all)');
});

test('THE INTAKE in map.js: Play sends a profile without an agent to the creator first; ENLIST is one transaction; the walker wears the look as the agent', () => {
    assert.ok(MP.includes("if (!opts.enlisted && _hqIntakeNeeded()) { _hqIntakeOpen(); return; }"), '_goToPlayHub → the intake');
    assert.ok(MP.includes("window._mountReactCreator({ intake: true, onDone: _hqIntakeDone, onCancel: _hqIntakeCancel });"));
    assert.ok(MP.includes("window._hqIntakeEnlist = function (look) {") && MP.includes("const rec = window.hqOfficerEnlist(p, look || null);") && MP.includes("PS.saveProfile(idx, p);"), 'one save');
    assert.ok(MP.includes("window._goToPlayHub({ afterDoor: true, enlisted: true });"), 'then the building');
    assert.ok(MP.includes("if (window.EW_HQ_NO_INTAKE) return false;") && MP.includes("/[?&]nointake\\b/"), 'the dev switches');
    assert.ok(MP.includes("for (const r of [offRace, 'homosapien']) if (getCharacterAppearanceModel(r, lk.gender, lk.appearance)) return { race: r, gender: lk.gender, appearance: lk.appearance };"), 'the avatar walks as the agent in the look');
    assert.ok(MP.includes("if (lk && lk.portrait && m.meta && m.meta.appearance) return { url: lk.portrait, kind: 'portrait' };"), 'the officer\'s card wears the photo');
});

test('THE CREATOR in intake mode (party-builder.js): the props, ENLIST, the brief, BACK TO THE MENU; the mirror mode is untouched', () => {
    assert.ok(PB.includes("function OfficerCreator() {") && PB.includes("const props = arguments[0] || {};") && PB.includes("const intake = !!props.intake;"));
    assert.ok(PB.includes("window._hqIntakeEnlist({ gender, appearance, portrait: url, name: lookName })"), 'ENLIST files through map.js');
    assert.ok(PB.includes("if (typeof props.onDone === 'function') props.onDone(rec);"));
    assert.ok(PB.includes("intake ? (L.enlist || 'ENLIST · FILE THE AGENT') : 'SAVE LOOK · FILE ON CARD'"));
    assert.ok(PB.includes("_creatorRoot.render(h(OfficerCreator, opts));"), 'the mount passes the opts');
    assert.ok(PB.includes("window.hqOfficerEnlist(profile, { name: lookName });"), 'the mirror\'s SAVE re-files an enlisted officer');
    assert.ok(/\.pb-officer\.intake \{ z-index: 99990; \}/.test(fs.readFileSync(__dirname + '/styles-base.css', 'utf8')));
});

test('THE LOOK ON THE AGENT: sprites.js dresses the DOOR Agent with the creator base (the gun kept), state.js keeps the look on the identity', () => {
    assert.ok(SP.includes("const EW_CREATOR_LOOK_RACES = ['homosapien', 'door agent'];"));
    assert.ok(SP.includes("const a = EW_CREATOR_LOOK_RACES.includes(race) && normalizeCharacterAppearance(appearance);"));
    assert.ok(SP.includes("if (own && own.hold) def.hold = own.hold;"), 'the door gun rides the creator rig');
    assert.ok(ST.includes("const lookRace = (typeof EW_CREATOR_LOOK_RACES !== 'undefined' ? EW_CREATOR_LOOK_RACES : ['homosapien']).includes(race);"));
    assert.ok(ST.includes("appearance: lookRace && typeof normalizeCharacterAppearance === 'function' ? normalizeCharacterAppearance(identity.appearance) : null,"));
    /* the real sprites.js in a sandbox: the agent's look is the creator base with the hold */
    const win = { location: { search: '' }, localStorage: { getItem: () => null, setItem() {}, removeItem() {} }, navigator: { userAgent: '' }, document: { createElement: () => ({ getContext: () => null, style: {} }) }, console };
    win.window = win; vm.createContext(win); vm.runInContext(SP, win);
    const def = win.getCharacterAppearanceModel('door agent', 'female', { hair: 'hair003' });
    assert.ok(def && def.creatorBase && def.hold && def.hold.key === 'door_gun', 'the agent\'s look holds the door gun');
    assert.ok(win.getCharacterAppearanceModel('homosapien', 'male', { hair: 'hair003' }).creatorBase);
    assert.equal(win.getCharacterAppearanceModel('knight', 'male', { hair: 'hair003' }), null, 'no other race takes a look');
});

test('THE TOKEN: index.html was bumped (never the current token pinned)', () => {
    assert.ok(/\?v=\d{8}[a-z0-9-]*-cors/.test(IDX));
    assert.ok(!IDX.includes('?v=20260921-levels-01-cors'), 'the previous token is gone');
});
