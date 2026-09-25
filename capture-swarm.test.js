// capture-swarm.test.js — THE ONE-WAY DOOR, Phase 5 THE ECONOMY (what was left) + Phase 6 THE SIZES + THE SWARM
// (CAPTURE_PLAN.md §5 / §6, 2026-09-25). Phase 5: a BRAND-NEW profile gets the door issue at its first party filing; doors
// are never loot (the user: "I dont think doors should be part of loot") — no drop row, no stash row. Phase 6: never one
// enemy (a lone native brings 1–2), the swarm (one race, 6–8 bodies, the elites at the encounter level, the grunts under
// the party level, all on the board, every turn played in full). Rev 2 (the user): a swarm is ANY of the room's
// natives — the target + n − 1 of one native race (the target's own or another) — and a lone native's strike can
// bring one too. Repo-only.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { loadGameData } = require('./load-data');
const D = loadGameData();
const g = name => vm.runInContext(name, D);
const J = o => JSON.parse(JSON.stringify(o));
const read = f => fs.readFileSync(__dirname + '/' + f, 'utf8');
const BT = read('battle.js'), MP = read('map.js'), TR = read('three-renderer.js');
const R = g('HQ_LEVEL_RULES'), SW = R.swarm;
const profile = () => ({ username: 'MONDO', account: { gold: 0, unlockedUnits: ['knight', 'wizard', 'door agent', 'homosapien'] }, progress: { v: 2, hq: {} } });

test('PHASE 5: a brand-new profile gets the capture doors at its first party filing, once', () => {
    const p = profile();
    g('hqPartyEnsure')(p, {});
    const issue = g('HQ_DISPENSARY').capIssue;
    Object.keys(issue).forEach(k => assert.equal(g('hqBagCount')(p, k), issue[k], k + ' issued'));
    assert.equal(p.door.hq.capIssue, 1, 'the flag is filed with the doors');
    g('hqBagTake')(p, 'captureDoor', 1);
    g('hqPartyEnsure')(p, {}); g('hqCaptureDoorIssue')(p);
    assert.equal(g('hqBagCount')(p, 'captureDoor'), issue.captureDoor - 1, 'never a second issue');
});

test('PHASE 5: doors are never loot — no drop row, no stash row, a thousand drops never roll one', () => {
    const doors = g('captureDoorItemKeys')();
    assert.ok(doors.length >= 4);
    const DR = g('HQ_DROP_RULES');
    doors.forEach(k => assert.equal(DR.weights[k], undefined, k + ' is not a drop'));
    Object.values(g('DOOR_HQ').stashes).forEach(st => assert.ok(doors.indexOf(st.item) < 0, 'a stash never holds a door'));
    let s = 7; const rng = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    const out = g('hqEncounterDrops')(Array.from({ length: 1000 }, () => ({ race: 'grey', name: 'A GREY', types: ['alien'] })), { rng });
    doors.forEach(k => assert.equal(out.items[k], undefined));
    /* the shop still sells them (the only way to get more) */
    doors.forEach(k => assert.ok(g('HQ_DISPENSARY').stock.indexOf(k) >= 0, k + ' is on the shelf'));
});

test('PHASE 6 §5.1: never one enemy — a lone native brings one or two', () => {
    assert.deepEqual(J(R.group.solo), [1, 2]);
    const grp = g('hqEncounterGroup'), sizes = {};
    for (let i = 0; i < 400; i++) { const r = grp({ id: 'hq-roam-0', race: 'grey' }, 'k' + i); assert.equal(r.kind, 'solo'); sizes[r.size] = (sizes[r.size] | 0) + 1; }
    assert.deepEqual(Object.keys(sizes).sort(), ['2', '3']);
    assert.ok(sizes[2] > sizes[3], 'two bodies is the likelier (55 / 45)');
});

test('PHASE 6 §5.2: THE SWARM — the group, the levels, the launch', () => {
    const grp = g('hqEncounterGroup');
    for (let i = 0; i < 60; i++) {
        const r = grp({ id: 'hq-roam-0', race: 'ghoul', swarm: { n: 7, race: 'zombie' }, group: [{ id: 'hq-roam-1', race: 'zombie' }] }, 'w' + i);
        assert.equal(r.kind, 'swarm'); assert.equal(r.size, 7, 'the room\'s count is the fight\'s'); assert.equal(r.race, 'zombie', 'the room\'s swarm race');
        assert.ok(r.elite >= SW.elite[0] && r.elite <= SW.elite[1]); assert.equal(r.members.length, 0, 'the walkers are part of the n');
    }
    const auth = grp({ id: 'spot', race: 'ghoul', swarm: true }, 'x', { natives: ['ghoul', 'zombie'] });
    assert.ok(auth.kind === 'swarm' && auth.size >= SW.size[0] && auth.size <= SW.size[1], 'an authored `swarm: true` spot rolls its size');
    assert.ok(['ghoul', 'zombie'].indexOf(auth.race) >= 0, 'a native race');
    /* a LONE native's strike: the coin with the room's natives — the target's own race and another both come up ("more ghouls" / "skeletons") */
    const races = {}; let sw = 0;
    for (let i = 0; i < 400; i++) { const r = grp({ id: 'hq-roam-0', race: 'ghoul' }, 'l' + i, { natives: ['ghoul', 'zombie', 'skeleton'] }); if (r.kind !== 'swarm') { assert.equal(r.kind, 'solo'); continue; } sw++; races[r.race] = 1; }
    assert.ok(sw > 400 * SW.p * 0.5 && sw < 400 * SW.p * 1.6, 'about p of the strikes (' + sw + ')');
    assert.ok(races.ghoul && Object.keys(races).length >= 2, 'the target\'s own race and others');
    for (let i = 0; i < 60; i++) assert.equal(grp({ id: 'hq-roam-0', race: 'ghoul' }, 'l' + i).kind, 'solo', 'no natives handed: never a swarm');
    /* the levels: the elites at the encounter level, the grunts `offset` about the PARTY level, the clamps hold */
    const lv = g('hqEncounterLevels')(20, 'prebuilt_hell', 8, 's', { grunts: { from: 2, offset: SW.offset } });
    assert.equal(lv.levels.length, 8);
    lv.levels.slice(2).forEach(x => assert.ok(x >= 20 + SW.offset - R.band.below && x <= 20 + SW.offset + R.band.above, 'a grunt ' + x));
    assert.ok(lv.levels[0] >= lv.base - R.lead.below, 'the lead is the ordinary lead');
    assert.deepEqual(J(g('hqEncounterLevels')(20, 'prebuilt_hell', 4, 's').levels), J(g('hqEncounterLevels')(20, 'prebuilt_hell', 4, 's', null).levels), 'no grunts: unchanged');
    /* the launch: every seat the target's race, a level per body, the swarm record rides */
    const nat = g('hqRoomNatives')('site_prebuilt_dumb');
    assert.ok(nat.length >= 1 && nat.indexOf('grey') >= 0, 'the room\'s natives (' + nat.join(', ') + ')');
    const other = nat.find(r => r !== 'grey') || 'grey';
    const L = g('hqEncounterLaunch')('site_prebuilt_dumb', { kind: 'npc', id: 'hq-roam-0', race: 'grey', gender: 'male', label: 'A GREY', swarm: { n: 8, race: other } }, '{"teamSize":4}', { partyLevel: 12 });
    assert.equal(L.enemyTeam, 8); assert.equal(L.teamSize, 4, 'the officer\'s deploy is untouched');
    assert.deepEqual(J(L.roster), ['grey'].concat(Array(7).fill(other)), 'the target leads, the swarm fills the rest'); assert.equal(L.levels.length, 8);
    assert.ok(L.swarm && L.swarm.n === 8 && L.swarm.race === other && L.swarm.elite >= 1 && L.swarm.turbo === undefined);
    L.levels.slice(L.swarm.elite).forEach(x => assert.ok(x <= 12 + SW.offset + R.band.above, 'grunts under the party'));
    assert.equal(L.encounter.swarm, 8);
    const plain = g('hqEncounterLaunch')('site_prebuilt_dumb', { kind: 'npc', id: 'hq-roam-0', race: 'grey', gender: 'male', group: [{ id: 'hq-roam-1', race: 'grey' }] }, null, { partyLevel: 12 });
    assert.equal(plain.swarm, null, 'a plain roaming group is no swarm');
});

test('PHASE 6 §5.2: the population rolls swarms in some wild rooms, one native race, never in the hall', () => {
    let swarms = 0, groups = 0;
    const rooms = Object.keys(g('DOOR_HQ').rooms).filter(id => g('hqRoomSite')(id));
    for (let d = 1; d <= 20; d++) {
        const date = '2026-10-' + String(d).padStart(2, '0');
        rooms.forEach(id => {
            const pop = g('hqRoomPopulation')(id, profile(), { date });
            if (!pop.group) return; groups++;
            if (!pop.group.swarm) return; swarms++;
            const sw = pop.group.swarm;
            assert.ok(sw.n >= SW.size[0] && sw.n <= SW.size[1]);
            assert.ok(pop.tiers[sw.race] === 'native' || pop.tiers[sw.race] === 'biome', id + ': the swarm is the room\'s own (' + sw.race + ')');
            pop.draw.filter(x => x.group === pop.group.id).slice(1).forEach(x => assert.equal(x.race, sw.race, 'the walkers after the first are the swarm\'s race'));
        });
    }
    assert.ok(swarms > 0 && swarms < groups, 'some groups are swarms, most are not (' + swarms + ' / ' + groups + ')');
    assert.equal(g('hqRoomPopulation')('central_egress', profile(), {}).group, null);
});

test('PHASE 6 §5.2: the wiring — the room sub, the aim, the launch marker, the spawns, no enemy bench, every turn in full', () => {
    assert.ok(TR.includes("if (o && o.swarm) ch.swarm = o.swarm;"), 'the walker carries the swarm');
    assert.ok(TR.includes("HQ_LEVEL_RULES.swarm.label) || 'A SWARM OF') + ' ' + swarm.n;"), 'the room says A SWARM OF n');
    assert.ok(TR.includes("swarm: best.swarm || (best.spot && best.spot.swarm) || null };"), 'the aim reports it');
    assert.ok(MP.includes("party.swarm = L.swarm || null;") && MP.includes("swarm: L.swarm || null };"), 'map.js carries it to the party + the run marker');
    assert.ok(MP.includes("SPAWNS[2] = (mode.spawns[2] || []).slice(0, DEPLOY2);") && MP.includes("while (SPAWNS[2].length < DEPLOY2) {"), 'a spawn per body');
    assert.ok(BT.includes("if (_sw && u.player === 2) {"), 'no enemy bench');
    assert.ok(!BT.includes('_swarmGrunt') && BT.includes("if (!state.trainingMatch || state.devAutoSim) return false;"), 'no turbo: a swarm plays with every animation (the user)');
    assert.equal(SW.turbo, undefined);
});
