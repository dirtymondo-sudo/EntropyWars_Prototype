// party-levels.test.js — THE LEVELS (2026-09-21): the story-mode XP curve, the party's
// ledger (lvl / xp on every member, level 5 at the start, a recruit at the party's level),
// the adaptive enemy level (the party level + the site's tier, a seeded band, the lead a
// touch tougher, the hard clamp), the group size (a lone native brings 0–2, a roaming
// group fights as its members), the launch (storyLevel on every identity), the commit
// (THE POOL shared board / bench / down + the trickle, the level-up beats), the additive
// stat curve being cosmetic in combat, and the source sites on every side. Repo-only.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { loadGameData } = require('./load-data');
const D = loadGameData(), R = D.HQ_LEVEL_RULES;
const g = name => vm.runInContext(name, D);
const J = o => JSON.parse(JSON.stringify(o));
const MP = fs.readFileSync(__dirname + '/map.js', 'utf8');
const BT = fs.readFileSync(__dirname + '/battle.js', 'utf8');
const ST = fs.readFileSync(__dirname + '/state.js', 'utf8');
const TR = fs.readFileSync(__dirname + '/three-renderer.js', 'utf8');
const IX = fs.readFileSync(__dirname + '/index.html', 'utf8');
const CSS = fs.readFileSync(__dirname + '/styles-cinematic.css', 'utf8');
const profile = (o) => Object.assign({ username: 'MONDO', account: { gold: 0, unlockedUnits: ['knight', 'wizard', 'catgirl', 'door agent', 'homosapien', 'cowboy', 'nun'] }, door: { clearance: 1, hq: {} } }, o || {});

test('THE CURVE: one formula, cumulative, ~4 same-level kills a level at every level', () => {
    const thr = g('xpThreshold'), lvl = g('xpLevelFor'), nxt = g('xpToNext');
    assert.equal(thr(1), 0); assert.equal(thr(5), 167); assert.equal(thr(100), Math.round(12 * Math.pow(99, 1.9)));
    assert.equal(lvl(0), 1); assert.equal(lvl(167), 5); assert.equal(lvl(254), 5); assert.equal(lvl(255), 6); assert.equal(lvl(1e9), 100);
    const x = nxt(200); assert.equal(x.lvl, 5); assert.equal(x.into, 33); assert.equal(x.need, 88); assert.equal(x.left, 55); assert.ok(Math.abs(x.pct - 33 / 88) < 1e-9);
    assert.equal(nxt(thr(100)).max, true); assert.equal(nxt(thr(100)).pct, 1);
    /* the battle's own table is the same formula (battle.js XP_THRESHOLDS) */
    assert.ok(BT.includes("arr.push(L === 1 ? 0 : Math.round(12 * Math.pow(L - 1, 1.9)));"));
    assert.equal(D.XP_CURVE.k, 12); assert.equal(D.XP_CURVE.exp, 1.9);
    /* the pacing: a same-level kill of a 60-yield race pays ≈ yield × L / 14 — a level is 3–5 of them from 5 to 90 */
    for (const L of [5, 10, 20, 40, 60, 90]) { const kills = (thr(L + 1) - thr(L)) / (60 * L / 14 + 1); assert.ok(kills > 2.5 && kills < 5.5, 'L' + L + ' = ' + kills.toFixed(2) + ' kills'); }
});

test('THE LEDGER: every member starts at level 5, lvl follows xp, an old record is normalised, a recruit joins at the party level', () => {
    assert.equal(R.start, 5); assert.equal(R.enlist, 'party');
    const p = profile();
    const rec = g('hqPartyEnsure')(p, {});
    assert.ok(rec.members.length >= 2);
    rec.members.forEach(m => { assert.equal(m.lvl, 5); assert.equal(m.xp, g('xpThreshold')(5)); });
    assert.equal(g('hqPartyLevel')(p), 5);
    /* a record filed before the ledger: no xp → the start level; a stale lvl without xp → that level's threshold */
    const q = profile({ door: { clearance: 1, hq: { party: { v: 1, seq: 3, members: [{ id: 'p1', you: true, cls: 'Agent', meta: { race: 'door agent' } }, { id: 'p2', cls: 'Knight', meta: { race: 'knight' }, lvl: 12 }] } } } });
    const r2 = g('hqPartyRecord')(q);
    assert.equal(r2.members[0].lvl, 5); assert.equal(r2.members[1].lvl, 12); assert.equal(r2.members[1].xp, g('xpThreshold')(12));
    /* the party level is the FIRST SHIFT's mean */
    r2.members[0].xp = g('xpThreshold')(20); r2.members[0].lvl = 20;
    assert.equal(g('hqPartyLevel')(q), 16, 'round((20 + 12) / 2)');
    /* a recruit joins at the party level (never level 5 in chapter 9) */
    const e = g('hqPartyEnlist')(q, { race: 'wizard', gender: 'male' });
    assert.equal(e.ok, true); assert.equal(e.member.lvl, 16);
    /* the launch carries the level on the identity — the whitelist keeps it, createUnit builds at it */
    const L = g('hqPartyForLaunch')(q);
    assert.equal(L.members[0].meta.storyLevel, 20); assert.equal(L.members[1].meta.storyLevel, 12); assert.equal(L.members[0].meta.storyXp, g('xpThreshold')(20));
    assert.ok(ST.includes("if ((priorMeta.storyLevel | 0) > 0) { rebuiltMeta.storyLevel = priorMeta.storyLevel | 0; if (Number.isFinite(+priorMeta.storyXp)) rebuiltMeta.storyXp = +priorMeta.storyXp; }"), 'state.js: the repair whitelist keeps storyLevel + storyXp');
    assert.ok(MP.includes("else if (identityOverride && (identityOverride.storyLevel | 0) > 0) {") && MP.includes("setUnitLevel(newUnit, targetLevel);\n                newUnit.hp = newUnit.maxHp;\n                newUnit.mp = newUnit.maxMp;\n                newUnit._storyLevel = targetLevel;"), 'map.js createUnit: the story-level branch before the PvP cap');
    assert.ok(MP.indexOf("else if (identityOverride && (identityOverride.storyLevel | 0) > 0) {") < MP.indexOf("const _cuMode = (typeof getActiveMultiplayerMode === 'function') ? getActiveMultiplayerMode() : null;"), 'the story branch is read BEFORE the mode cap');
    assert.ok(MP.includes("const mx = window.hqPartyXp(m); meta.storyLevel = mx.lvl; meta.storyXp = mx.xp;"), 'the pause menu builds a member at its level');
});

test('THE ENEMY LEVEL: the party level + the tier, the lead inside its band, the rest inside theirs, the hard clamp, seeded', () => {
    const f = g('hqEncounterLevels');
    const a = f(5, 'prebuilt_bermuda', 4, 'seed'), b = f(5, 'prebuilt_bermuda', 4, 'seed');
    assert.deepEqual(J(a), J(b), 'seeded: the same launch reads the same');
    assert.equal(a.tier, 2); assert.equal(a.offset, R.tierOffset[2]); assert.equal(a.base, 5 + R.tierOffset[2]);
    assert.equal(a.levels.length, 4);
    assert.ok(a.levels[0] >= a.base - R.lead.below && a.levels[0] <= a.base + R.lead.above, 'the lead');
    a.levels.slice(1).forEach(x => assert.ok(x >= a.base - R.band.below && x <= a.base + R.band.above, 'a companion'));
    /* the clamp: a tier-3 site over a level-5 party never stands more than maxAbove over it; the floor is 1 */
    for (let s = 0; s < 40; s++) { const r = f(5, 'prebuilt_hell', 5, 's' + s); r.levels.forEach(x => { assert.ok(x >= 1 && x <= 5 + R.maxAbove); }); }
    for (let s = 0; s < 40; s++) { const r = f(2, 'prebuilt_training', 3, 's' + s); r.levels.forEach(x => { assert.ok(x >= 1, 'never below 1'); assert.ok(x <= 2 + R.lead.above); }); }
    /* an area override wins over the tier */
    assert.equal(f(30, 'prebuilt_training', 1, 'x').offset, 0, 'Room 64 stands at the party level');
    /* the width knob: the user's ±10 is one field */
    assert.ok(R.band.below + R.band.above <= 6, 'the shipped band is narrow — EW_LEVEL_GAP_STEP 1.08 makes ±10 a 2.16× swing');
});

test('THE GROUP: a lone native brings 0–2, a roaming group fights as its members + extra; the population binds a group; the aim reports it', () => {
    const grp = g('hqEncounterGroup');
    const seen = new Set();
    for (let s = 0; s < 60; s++) { const r = grp({ id: 'hq-roam-0', race: 'grey' }, 's' + s); assert.equal(r.kind, 'solo'); assert.ok(r.size >= 1 && r.size <= 3); seen.add(r.size); }
    assert.ok(seen.has(1) && seen.has(2) && seen.has(3), 'all three sizes come up');
    const rr = grp({ id: 'hq-roam-0', race: 'grey', group: [{ id: 'hq-roam-1', race: 'nordic' }, { id: 'hq-roam-2', race: 'grey' }, { id: 'hq-roam-0', race: 'grey' }] }, 'x');
    assert.equal(rr.kind, 'roam'); assert.equal(rr.members.length, 2, 'the target itself is never its own companion'); assert.equal(rr.size, 3 + rr.extra);
    /* the launch: the enemy line is the group, the roster leads with the target then its members, a level per body; the OFFICER's teamSize is untouched */
    const L = g('hqEncounterLaunch')('site_prebuilt_dumb', { kind: 'npc', id: 'hq-roam-0', race: 'grey', gender: 'male', label: 'A GREY', group: [{ id: 'hq-roam-1', race: 'nordic', gender: 'female' }] }, '{"teamSize":4}', { partyLevel: 9 });
    assert.equal(L.teamSize, 4); assert.ok(L.enemyTeam >= 2 && L.enemyTeam <= 3); assert.equal(L.roster[0], 'grey'); assert.equal(L.roster[1], 'nordic');
    assert.equal(L.roster.length, L.enemyTeam); assert.equal(L.levels.length, L.enemyTeam); assert.equal(L.partyLevel, 9);
    assert.deepEqual(J(L.encounter.members), [{ id: 'hq-roam-1', race: 'nordic', gender: 'female', name: null }]);
    assert.ok(JSON.stringify(L).length > 0, 'serialisable');
    /* the marker's fight is the full line at the party's level */
    const M = g('hqMarkerLaunch')('site_prebuilt_dumb', null, { gm: 'tdm', partyLevel: 7 });
    assert.equal(M.enemyTeam, 4); assert.equal(M.levels.length, 4); assert.equal(M.partyLevel, 7);
    /* the population binds a group in a wild room (never a facility room) */
    let bound = 0, wild = 0;
    for (const id of Object.keys(D.DOOR_HQ.rooms)) {
        if (!g('hqRoomSite')(id)) continue;
        const pop = g('hqRoomPopulation')(id, profile(), {});
        if (pop.draw.length < 2) continue; wild++;
        if (pop.group) { bound++; assert.ok(pop.group.ids.length >= 2); pop.group.ids.forEach(x => assert.ok(pop.draw.find(d => d.id === x && d.group === pop.group.id))); }
    }
    assert.ok(bound > 0 && bound < wild, 'some wild rooms carry a group, not all (' + bound + ' / ' + wild + ')');
    assert.equal(g('hqRoomPopulation')('central_egress', profile(), {}).group, null, 'the hall has no groups');
    /* the renderer: the group shares a stop + a loop seed, the aim reports the companions, state.js seats them */
    assert.ok(TR.includes("if (o && o.group) ch.group = o.group;") && TR.includes("var seedKey = (o && o.group) ? (roomId + '|' + o.group) : (roomId + '|' + id);"), 'one loop per group');
    assert.ok(TR.includes("groupStops[d.group] || (groupStops[d.group] = stops[Math.floor(Math.random() * stops.length)])"), 'one stop per group');
    assert.ok(TR.includes("group: group.length ? group : null };"), 'the aim reports the group');
    assert.ok(ST.includes("const _grpMembers = (lead && _encSpec && Array.isArray(_encSpec.members)) ? _encSpec.members : [];"), 'state.js seats the members');
    assert.ok(MP.includes("party.enemyTeam = L.enemyTeam || L.teamSize;") && MP.includes("party.enemyLevels = Array.isArray(L.levels) ? L.levels.slice() : null;"), 'map.js: the line + the levels ride the party');
    assert.ok(MP.includes("state.partyMeta[2].forEach((mm, i) => { if (mm) mm.storyLevel = lv[Math.min(i, lv.length - 1)] | 0; });"), 'map.js _msConfirm writes the natives\' levels');
    assert.ok(MP.includes("partyLevel: _hqPartyLevelNow()"), 'the launches carry the party level');
});

test('THE COMMIT: the pool shared fought / present / down + what was earned in the field, the ledger moves, the beats carry every level\'s stat deltas', () => {
    const p = profile(); const rec = g('hqPartyEnsure')(p, {});
    const [you, b] = rec.members;
    const res = g('hqPartyAfterMatch')(p, { won: true, xpPool: 120, units: [
        { partyId: you.id, hp: 30, maxHp: 60, mp: 5, maxMp: 20, xpBattle: 12, fought: true, baseHp: 550, baseMp: 100, unitId: '1-0' },
        { partyId: b.id, hp: 40, maxHp: 60, mp: 5, maxMp: 20, xpBattle: 0, fought: false, bench: true, baseHp: 500, baseMp: 80, unitId: '1-1' },
    ] });
    assert.equal(res.pool, 120); assert.equal(res.xp.length, 2);
    const y = res.xp.find(x => x.id === you.id), bb = res.xp.find(x => x.id === b.id);
    assert.equal(y.share, 120); assert.equal(y.battle, 12); assert.equal(y.held, 12, 'the old name reads the field tally'); assert.equal(y.gain, 132); assert.equal(y.before.lvl, 5); assert.equal(y.after.lvl, 6); assert.equal(y.after.xp, 167 + 132);
    assert.equal(y.levels.length, 1); assert.equal(y.levels[0].lvl, 6); assert.ok(y.levels[0].stats.hp > 0, 'HP grows every level'); assert.equal(y.unitId, '1-0'); assert.equal(y.you, true); assert.equal(y.fought, true);
    assert.equal(bb.share, 60, 'a body that did not fight takes half'); assert.equal(bb.bench, true); assert.equal(bb.fought, false);
    assert.equal(res.leveled, 1); assert.equal(g('hqPartyRecord')(p).members[0].lvl, 6, 'the ledger moved');
    /* THE VICTORY SHARE (2026-09-22): a member DOWN at the end gets no share — what it earned in the field it keeps */
    const res2 = g('hqPartyAfterMatch')(p, { won: true, xpPool: 500, units: [{ partyId: b.id, hp: 0, maxHp: 60, mp: 0, maxMp: 20, dead: true, fought: true, xpBattle: 9 }] });
    assert.equal(res2.xp[0].share, 0); assert.equal(res2.xp[0].dead, true); assert.equal(res2.xp[0].gain, 9, 'the field tally comes home');
    /* a LOSS shares nothing — the field tally alone */
    const res3 = g('hqPartyAfterMatch')(p, { won: false, xpPool: 500, units: [{ partyId: you.id, hp: 20, maxHp: 60, mp: 0, maxMp: 20, fought: true, xpBattle: 7 }] });
    assert.equal(res3.xp[0].share, 0); assert.equal(res3.xp[0].gain, 7); assert.equal(res3.xp[0].won, false);
    /* a deployed body that never acted is present, not fought: half; the old `xpHeld` / `bench` rows still read */
    const sh = g('hqPartyXpShare');
    assert.equal(sh(100, { fought: false }), 50); assert.equal(sh(100, { fought: true }), 100); assert.equal(sh(100, { dead: true, fought: true }), 0); assert.equal(sh(100, { bench: true }), 50); assert.equal(sh(100, {}), 100);
    assert.equal(D.HQ_LEVEL_RULES.share.poolMult, 0.6, 'the pool dial');
    /* the beats of a big jump list every level, the milestones named */
    const beat = g('hqPartyGrantXp')(rec.members[0], g('xpThreshold')(16) - rec.members[0].xp, { hp: 550, mp: 100 });
    assert.equal(beat.after.lvl, 16); assert.equal(beat.levels.length, 10); assert.ok(!beat.levels.some(l => /SECONDARY JOB/.test(l.milestone || '')), 'the tier rework (2026-09-24) retired the second job — no milestone names it'); assert.equal(beat.levels.find(l => l.lvl === 10).milestone, 'THE SPELL SHOP OPENS');
    const moved = beat.levels.filter(l => ['atk', 'def', 'mdef', 'int'].some(k => l.stats[k] > 0)).length;
    assert.ok(moved >= 9, 'the additive stats tick on nearly every level (' + moved + ' / 10) — the straight curve');
    /* the cap holds */
    const top = g('hqPartyGrantXp')(rec.members[0], 1e9, null); assert.equal(top.after.lvl, 100); assert.equal(top.after.max, true);
});

test('THE ADDITIVE CURVE IS COSMETIC: levelPowerStat reads the cap equivalent at every level; HP keeps the combat curve', () => {
    const gains = g('levelStatGains'), lps = g('levelPowerStat');
    const T = D.LEVEL_TOTAL_STAT_GAINS;
    assert.equal(D.LEVEL_STAT_GAIN_EXP, 1.0);
    assert.equal(gains(100, 550, 100).atk, T.atk); assert.equal(gains(1, 550, 100).atk, 0);
    assert.equal(gains(50, 550, 100).atk, Math.round(T.atk * 49 / 99), 'a straight line');
    assert.equal(gains(5, 550, 100).hp, Math.round((550 + T.hp) * g('levelScale')(5)) - 550, 'HP rides levelScale untouched');
    for (const L of [1, 5, 20, 60, 100]) {
        const gg = gains(L, 550, 100);
        const u = { atk: 82 + gg.atk, def: 40 + gg.def, mdef: 40 + gg.mdef, intStat: 50 + gg.int, _lvlStatGains: gg, _xp: g('xpThreshold')(L) };
        assert.equal(lps(u, 'atk'), 82 + T.atk); assert.equal(lps(u, 'def'), 40 + T.def); assert.equal(lps(u, 'int'), 50 + T.int);
        const v = { atk: 82 + gg.atk, _xp: g('xpThreshold')(L) };   // without the ledger: the deficit reads the same curve
        assert.equal(lps(v, 'atk'), 82 + T.atk);
    }
});

test('THE SOURCE SITES: the XP hold in a party fight, the pool at the commit, the experience card on the debrief', () => {
    assert.ok(BT.includes("if (_encRun()) return true;   // THE LEVELS (2026-09-21)"), 'a story-mode encounter earns XP');
    /* THE LEVELS rev 2 (2026-09-22): a story unit levels LIVE — grantXP never holds; the field tally + the participation ride the unit */
    assert.ok(BT.includes("if (_encRun()) { unit._xpBattle = (unit._xpBattle || 0) + amt; unit._encFought = true; }") && !BT.includes("unit._xpHeld = (unit._xpHeld || 0) + amt;"), 'grantXP tallies the field and levels live');
    assert.ok(BT.indexOf("if (_encRun()) { unit._xpBattle") < BT.indexOf("const prevLevel = getUnitLevel(unit);\n            unit._xp = (unit._xp || 0) + amt;"), 'the tally is written before the level-up lands');
    assert.ok(BT.includes("if (unit && cost > 0 && _encRun()) unit._encFought = true;"), 'spending AP is fighting');
    assert.ok(BT.includes("function _encXpPool(profile, seat)") && BT.includes("const xpPool = _encXpPool(p, seat);") && BT.includes("xpBattle: u._xpBattle | 0, fought: !!u._encFought, bench: benchBodies.indexOf(u) >= 0, baseHp:") && BT.includes("pool *= (S.poolMult != null && isFinite(+S.poolMult)) ? +S.poolMult : 1;"), 'the commit + the pool dial');
    assert.ok(BT.includes("function _vicBuildExperience(party)") && BT.includes("function _vicPlayExperience(party)") && BT.includes("function _vicXpLevelBeat(row, b, lv)"), 'the card, the sequence, the beat');
    assert.ok(BT.includes("ThreeRenderer.podium.play(u.id, ['vicJump', 'vicCheer', 'jump'], 2400);") && BT.includes("_vfxLevelUp(u.x, u.y);") && BT.includes("try { playSfx('levelUp'); } catch (e) {}"), 'the beat: the jump, the burst, the cue');
    assert.ok(BT.includes("['vicExperience', 'vicDrops', 'vicGoldBreakdown',"), '_vicPrepare clears the card');
    assert.ok(BT.indexOf("_xe.innerHTML = _vicBuildExperience(_vicXpParty)") < BT.indexOf("_vicLayoutSync({ tab: 'rewards' });") && BT.indexOf("_vicPlayExperience(_vicXpParty)") > BT.indexOf("resultOverlay.classList.remove('hidden');"), 'built before the layout sync, played after the overlay shows');
    assert.ok(IX.includes('<div id="vicExperience" class="vic-experience"></div>') && IX.indexOf('id="vicExperience"') < IX.indexOf('id="vicGoldBreakdown"'), 'the card leads the REWARDS sheet');
    assert.ok(/\?v=\d{8}[a-z0-9-]*-cors/.test(IX) && !IX.includes('20260921-threedoors-02-cors'), 'the token moved');
    ['.vic-xp-card', '.vic-xp-row.live', '.vic-xp-lv.bump', '.vic-xp-flash.on', '@keyframes vicXpFlash', '.vic-xp-chip', '.vic-xp-milestone', '.vic-experience:empty'].forEach(k => assert.ok(CSS.includes(k), 'CSS ' + k));
    assert.ok(MP.includes("function _hqPauseXpRow(m)") && MP.includes('<i class="hq-pp-lv">LV ') && MP.includes("html += _hqPauseBar('EXP'"), 'the pause menu wears the ledger');
    assert.ok(MP.includes("LEVELLED UP · THE PARTY IS LV"), 'the return toast names the level-ups');
});
