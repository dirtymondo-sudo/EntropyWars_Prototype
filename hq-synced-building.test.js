// THE SYNCED BUILDING + THE THREE REVEALS (PHASE9_QUALITY_PLAN §6 D5 + D7,
// Phase 9 Delivery 5 — 2026-09-16). D5: the cleared rooms, the encounter log
// and the skate book ride the progress blob (`hq.cleared` / `hq.encounters` /
// `hq.skate`) MONOTONIC like the counters; every read is the UNION of the
// local record and the blob, every write lands in both, profile.js folds the
// local record in on every read. D7: the Flying Dutchman's gun deck, the
// Strip's casino floor and Downtown's platform each carry variant-driven
// REVEAL beats (BATTLE STATIONS; THE DEAD HOUR + JACKPOT; RUSH HOUR + LAST
// TRAIN) — the same room, the same doors, the roll by the clock or the seed.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { loadGameData } = require('./load-data');
const D = loadGameData(), HQ = D.DOOR_HQ;
const g = name => vm.runInContext(name, D);
const J = o => JSON.parse(JSON.stringify(o));
const merge = g('mergeProgressBlobs');
const PF = fs.readFileSync(__dirname + '/profile.js', 'utf8');
const MP = fs.readFileSync(__dirname + '/map.js', 'utf8');
const today = g('hqToday')();

/* ───────────────────────────── D5 ───────────────────────────── */
test('D5 THE BLOB: mergeProgressBlobs carries hq.cleared (the later day; the same day unions the ids), hq.encounters (per-field max; the later last, HELD over EXITED on a day) and hq.skate (the best by score; the tallies max) — garbage dropped, the shape always there, capped', () => {
    const a = { v: 2, hq: {
        cleared: { site_prebuilt_dumb: { date: '2026-11-03', ids: ['hq-native-0'] }, site_prebuilt_hell: { date: '2026-11-01', ids: ['hq-npc-1'] }, 'bad room!': { date: '2026-11-01', ids: [] }, nodate: { ids: ['x'] } },
        encounters: { count: 3, wins: 1, losses: 2, last: { site: 'prebuilt_dumb', room: 'site_prebuilt_dumb', race: 'grey', date: '2026-11-03', won: false } },
        skate: { best: { score: 600, text: 'KICKFLIP + GRIND', date: '2026-11-02' }, total: 900, lines: 3, bails: 1 },
    } };
    const b = { v: 2, hq: {
        cleared: { site_prebuilt_dumb: { date: '2026-11-03', ids: ['hq-npc-2', 'hq-native-0'] }, site_prebuilt_hell: { date: '2026-11-04', ids: ['hq-native-3'] } },
        encounters: { count: 2, wins: 2, losses: 0, last: { site: 'prebuilt_hell', room: 'site_prebuilt_hell', race: 'demon', date: '2026-11-03', won: true } },
        skate: { best: { score: 450, text: 'HEELFLIP', date: '2026-11-05' }, total: 1200, lines: 2, bails: 4 },
    } };
    const m = merge(a, b);
    assert.deepEqual(J(m.hq.cleared.site_prebuilt_dumb), { date: '2026-11-03', ids: ['hq-native-0', 'hq-npc-2'] }, 'the same day: the union of the beaten');
    assert.deepEqual(J(m.hq.cleared.site_prebuilt_hell), { date: '2026-11-04', ids: ['hq-native-3'] }, 'the later day wins outright');
    assert.ok(!('bad room!' in m.hq.cleared) && !('nodate' in m.hq.cleared), 'garbage dropped');
    assert.deepEqual(J(m.hq.encounters), { count: 3, wins: 2, losses: 2, last: { site: 'prebuilt_hell', room: 'site_prebuilt_hell', race: 'demon', date: '2026-11-03', won: true } }, 'per-field max; the HELD beats the EXITED on the same day');
    assert.deepEqual(J(m.hq.skate), { best: { score: 600, text: 'KICKFLIP + GRIND', date: '2026-11-02' }, total: 1200, lines: 3, bails: 4 }, 'the best by score, the tallies by max');
    const e = merge(null, null);
    assert.deepEqual(J(e.hq.cleared), {}); assert.deepEqual(J(e.hq.encounters), { count: 0, wins: 0, losses: 0, last: null }); assert.deepEqual(J(e.hq.skate), { best: null, total: 0, lines: 0, bails: 0 });
    /* hostile shapes */
    const h = merge({ v: 2, hq: { cleared: 'nope', encounters: [1, 2], skate: { best: { score: -5, text: 7 }, total: 'x' } } }, { v: 2, hq: { encounters: { count: 1e12, last: { date: 'yesterday' } }, cleared: { __proto__: { evil: { date: '2026-01-01', ids: [] } } } } });
    assert.equal(Object.keys(h.hq.cleared).length, 0); assert.equal(h.hq.encounters.count, 1e9); assert.equal(h.hq.encounters.last, null); assert.equal(h.hq.skate.best, null); assert.equal(h.hq.skate.total, 0);
    const big = {}; for (let i = 0; i < 400; i++) big['room_' + i] = { date: '2026-11-01', ids: Array.from({ length: 60 }, (_, k) => 'id' + k) };
    const c = merge({ v: 2, hq: { cleared: big } }, null);
    assert.ok(Object.keys(c.hq.cleared).length <= 256, 'rooms capped'); assert.ok(c.hq.cleared.room_0.ids.length <= 32, 'ids capped');
    /* the ledger and the links ride beside them, untouched */
    const l = merge({ v: 2, hq: { finds: { taken: { 'tape:T001': true } }, links: { seen: { moon_derelict: '2026-11-01' } } } }, null);
    assert.equal(l.hq.finds.taken['tape:T001'], true); assert.equal(l.hq.links.seen.moon_derelict, '2026-11-01');
});

test('D5 THE UNION READS: hqEncounterLog / hqEncounterCleared / hqSkateRecord read local ∪ synced; a fresh device with only the blob sees the cleared room, the log and the best line', () => {
    const p = { door: {}, progress: { v: 2, hq: {
        cleared: { site_prebuilt_dumb: { date: today, ids: ['hq-native-0'] } },
        encounters: { count: 4, wins: 3, losses: 1, last: { site: 'prebuilt_dumb', room: 'site_prebuilt_dumb', race: 'grey', date: today, won: true } },
        skate: { best: { score: 800, text: 'CORKSCREW', date: today }, total: 800, lines: 1, bails: 0 },
    } } };
    assert.deepEqual(J(g('hqEncounterLog')(p)), { count: 4, wins: 3, losses: 1, last: { site: 'prebuilt_dumb', room: 'site_prebuilt_dumb', race: 'grey', date: today, won: true } });
    assert.deepEqual(J(g('hqEncounterCleared')(p, 'site_prebuilt_dumb')), { date: today, ids: ['hq-native-0'] }, 'the other device cleared it today — the natives stay gone here too');
    assert.equal(g('hqEncounterCleared')(p, 'site_prebuilt_hell'), null);
    const sk = g('hqSkateStatus')(p);
    assert.equal(sk.best.score, 800); assert.equal(sk.best.text, 'CORKSCREW'); assert.equal(sk.lines, 1);
    /* both records: the larger wins field by field; the local deck / since are local */
    p.door = { hq: { encounters: { count: 2, wins: 0, losses: 2, last: { site: 'prebuilt_hell', room: 'site_prebuilt_hell', race: 'demon', date: '2020-01-01', won: false } }, skate: { deck: true, since: '2026-01-01', best: { score: 300, text: 'OLLIE' }, total: 300, lines: 1, bails: 5 } } };
    const e = g('hqEncounterLog')(p); assert.equal(e.count, 4); assert.equal(e.losses, 2); assert.equal(e.last.race, 'grey', 'the later last');
    const s2 = g('hqSkateRecord')(p); assert.equal(s2.deck, true); assert.equal(s2.since, '2026-01-01'); assert.equal(s2.best.score, 800); assert.equal(s2.bails, 5);
    assert.deepEqual(J(g('hqEncounterLog')(null)), { count: 0, wins: 0, losses: 0, last: null }); assert.equal(g('hqEncounterCleared')(null, 'x'), null);
});

test('D5 THE DUAL WRITES: hqEncounterRecord and hqSkateBank continue from the union and write both records; a profile without a v2 blob writes the local record only; the fold puts a pre-blob local record onto the blob', () => {
    const rec = g('hqEncounterRecord'), bank = g('hqSkateBank');
    /* a second device: the blob says two encounters, the local record is empty */
    const p = { door: {}, progress: { v: 2, hq: { encounters: { count: 2, wins: 1, losses: 1, last: null }, cleared: { site_prebuilt_dumb: { date: today, ids: ['hq-native-0'] } } } } };
    rec(p, { site: 'prebuilt_dumb', room: 'site_prebuilt_dumb', race: 'grey', id: 'hq-npc-1', won: true, date: today });
    assert.equal(p.door.hq.encounters.count, 3, 'the local record continues the blob\'s count'); assert.equal(p.door.hq.encounters.wins, 2);
    assert.equal(p.progress.hq.encounters.count, 3, 'and the blob carries it'); assert.equal(p.progress.hq.encounters.last.race, 'grey');
    assert.deepEqual(J(p.progress.hq.cleared.site_prebuilt_dumb.ids), ['hq-native-0', 'hq-npc-1'], 'the cleared room unions on the blob');
    assert.deepEqual(J(p.door.hq.cleared.site_prebuilt_dumb.ids), ['hq-native-0', 'hq-npc-1'], 'and locally');
    bank(p, { score: 500, text: 'KICKFLIP' });
    assert.equal(p.progress.hq.skate.best.score, 500); assert.equal(p.progress.hq.skate.lines, 1);
    bank(p, { bail: true });
    assert.equal(p.progress.hq.skate.bails, 1); assert.equal(p.door.hq.skate.bails, 1);
    /* the blob says a better line: the local bank never lowers it */
    p.progress.hq.skate.best = { score: 900, text: 'FRONT FLIP', date: today };
    bank(p, { score: 100, text: 'HOP' });
    assert.equal(p.door.hq.skate.best.score, 900); assert.equal(p.progress.hq.skate.best.score, 900); assert.equal(p.progress.hq.skate.lines, 2);
    /* no v2 blob: local only, never invented */
    const q = { door: {} };
    rec(q, { site: 'prebuilt_dumb', room: 'site_prebuilt_dumb', race: 'grey', won: false });
    assert.equal(q.door.hq.encounters.losses, 1); assert.equal(q.progress, undefined, 'never invents a progress blob');
    bank(q, { score: 50, text: 'X' }); assert.equal(q.progress, undefined);
    /* the fold */
    const fold = g('hqDoorSyncFold');
    const hq = fold({ finds: { taken: {} }, links: { seen: {} }, encounters: { count: 1, wins: 1, losses: 0, last: null } }, q.door);
    assert.equal(hq.encounters.count, 1); assert.equal(hq.encounters.losses, 1, 'the local loss folds in'); assert.equal(hq.skate.best.score, 50); assert.deepEqual(J(hq.cleared), {});
    assert.equal(fold(null, q.door), null);
    assert.match(PF, /hqDoorSyncFold\(prog\.hq, p\.door\)/, 'profile.js folds the local record into the blob on every read');
    assert.ok(/window\.hqDoorSyncFold = hqDoorSyncFold/.test(fs.readFileSync(__dirname + '/data.js', 'utf8')), 'exported');
});

/* ───────────────────────────── D7 ───────────────────────────── */
const REVEALS = {
    site_prebuilt_revenge_gundeck: { ids: ['battle_stations'], clock: { battle_stations: [23, 30] }, doorFrom: ['site_prebuilt_revenge', 'companionway'] },
    site_prebuilt_strip_casino: { ids: ['dead_hour', 'jackpot'], clock: { dead_hour: [4, 0] }, doorFrom: ['site_prebuilt_strip_chapel', 'casino'] },
    site_prebuilt_downtown_subway: { ids: ['rush_hour', 'last_train'], clock: { rush_hour: [8, 30], last_train: [2, 0] }, doorFrom: ['site_prebuilt_downtown_lobby', 'subway'] },
};
const alongOf = (S, wall, p) => (wall === 'n' || wall === 's') ? { v: p.x || 0, half: S.w / 2 } : { v: p.z || 0, half: S.d / 2 };
const boxPropProblems = (k, room) => {
    const S = room.shell, out = [];
    for (const p of room.props) {
        const c = HQ.catalogue[p.key];
        if (!c) { out.push(k + ': ' + p.key + ' not in catalogue'); continue; }
        if (typeof p.wall === 'string') { const a = alongOf(S, p.wall, p); if (Math.abs(a.v) > a.half - 0.15) out.push(k + ': wall prop ' + p.key + ' runs off wall ' + p.wall); }
        else if (Math.abs(p.x) > S.w / 2 - 0.1 || Math.abs(p.z) > S.d / 2 - 0.1) out.push(k + ': ' + p.key + ' @' + p.x + ',' + p.z + ' is in a wall');
        const mount = (p.mount != null) ? p.mount : (c.mount || 0);
        if (mount + (c.h || 0) > S.h - 0.05) out.push(k + ': ' + p.key + ' mounts through the ceiling');
        if ((p.y || 0) > S.h - 0.1) out.push(k + ': ' + p.key + ' sits above the ceiling');
    }
    for (const sp of (room.npcSpots || []).concat(room.onlineSpots || [], room.agents || [])) if (!(Math.abs(sp.x) < S.w / 2 - 0.4 && Math.abs(sp.z) < S.d / 2 - 0.4)) out.push(k + ': a person stands in a wall @' + sp.x + ',' + sp.z);
    return out;
};
function propBlocks(room, p, x, z, margin) {
    const S = room.shell, cat = HQ.catalogue[p.key] || {};
    if (p.ceil || cat.ceil || (p.y || 0) > 0.5) return false;
    const px = p.wall === 'w' ? -S.w / 2 : p.wall === 'e' ? S.w / 2 : (p.x || 0);
    const pz = p.wall === 'n' ? -S.d / 2 : p.wall === 's' ? S.d / 2 : (p.z || 0);
    const rect = (p.rect === false) ? null : (p.rect || cat.rect);
    if (rect && !p.wall) return Math.abs(x - px) <= rect.hw + margin && Math.abs(z - pz) <= rect.hd + margin;
    const foot = (p.foot != null) ? p.foot : (cat.foot || 0);
    if (!(foot > 0) && !cat.block) return false;
    return Math.hypot(x - px, z - pz) <= Math.max(foot, 0.3) + margin;
}
const landingOf = (room, d) => {   // 2.4 m in from a flat wall (three-renderer.js _hqGoTo)
    const S = room.shell;
    if (d.wall === 'n') return { x: d.x || 0, z: -S.d / 2 + 2.4 };
    if (d.wall === 's') return { x: d.x || 0, z: S.d / 2 - 2.4 };
    if (d.wall === 'w') return { x: -S.w / 2 + 2.4, z: d.z || 0 };
    return { x: S.w / 2 - 2.4, z: d.z || 0 };
};

test('D7 THE SHEETS: the gun deck, the casino floor and the platform carry their reveals as variants — each with a plate, a why, a clock or a roll, and every add in the catalogue, in the room, off the landings and the spawn; the base room is untouched', () => {
    for (const [id, R] of Object.entries(REVEALS)) {
        const base = D.hqRoomBase(id);
        assert.ok(base && base.variants, id + ': variants on the sheet');
        assert.equal(JSON.stringify(D.hqRoomVariantIds(id)), JSON.stringify(R.ids), id + ': the reveal ids');
        assert.ok(!('variant' in base), id + ': the sheet wears no variant');
        for (const vid of R.ids) {
            const V = base.variants[vid];
            assert.ok(V.when && (Array.isArray(V.when.hours) || V.when.p > 0) && !V.when.each, id + '/' + vid + ': by the clock or a roll (never per-entry)');
            assert.ok(V.label && V.sub && V.why && V.door && V.door.sub, id + '/' + vid + ': a plate and a why');
            assert.ok(Array.isArray(V.add) && V.add.length && Array.isArray(V.drop) && Array.isArray(V.npcSpots) && V.npcSpots.length && Array.isArray(V.lines) && V.lines.length >= 3, id + '/' + vid + ': props, people, lines');
            for (const k of V.drop) assert.ok(base.props.some(p => p.key === k), id + '/' + vid + ': drops a key the sheet has (' + k + ')');
            try {
                const room = D.hqApplyRoomVariant(id, vid);
                assert.equal(room.variant, vid); assert.equal(room.doors, base.doors, 'the doors are the room\'s own'); assert.equal(room.site, base.site); assert.equal(room.part, base.part);
                assert.deepEqual(boxPropProblems(id + '/' + vid, room), []);
                const lit = room.props.filter(p => (HQ.catalogue[p.key] || {}).light).length;
                assert.ok(lit >= 1 && lit <= 10, id + '/' + vid + ': ' + lit + ' prop lights (HQ_PROP_LIGHT_MAX is 10)');
                for (const door of room.doors) {
                    const L = landingOf(room, door);
                    for (const q of [...room.props, ...room.npcSpots]) assert.ok(!propBlocks(room, q, L.x, L.z, 0.35), id + '/' + vid + '/' + door.id + ': ' + (q.key || q.race || 'a draw') + ' blocks the landing');
                }
                for (const q of [...room.props, ...room.npcSpots]) assert.ok(!propBlocks(room, q, room.spawn.x, room.spawn.z, 0.3), id + '/' + vid + ': ' + (q.key || q.race || 'a draw') + ' blocks the spawn');
                for (const n of room.npcSpots) for (const l of n.say || []) assert.ok(typeof l === 'string' && l.length > 10, id + '/' + vid + ': a said line');
                for (const n of room.npcSpots) for (const q of room.props) assert.ok(!propBlocks(room, q, n.x, n.z, 0.05), id + '/' + vid + ': ' + (n.race || 'a draw') + ' stands in ' + q.key);
                /* the door INTO the room is re-plated, and forgets it on the way back */
                const from = HQ.rooms[R.doorFrom[0]].doors.find(d => d.id === R.doorFrom[1]);
                assert.equal(from.sub, V.door.sub, id + '/' + vid + ': the way in wears the beat');
                assert.ok(room.props.some(p => p.key === 'railing_1m'), id + '/' + vid + ': the park rule holds');
            } finally { D.hqApplyRoomVariant(id, null); }
            assert.equal(HQ.rooms[id], base, id + ': the sheet stands again');
            const from = HQ.rooms[R.doorFrom[0]].doors.find(d => d.id === R.doorFrom[1]);
            assert.ok(!('_base' in from), 'the door forgets the beat');
        }
    }
});

test('D7 THE IDENTITIES: the casino has no clock and no window in any beat and its one door; the platform\'s people stay off the track in the rush; the gun deck\'s four guns stand where they stand with a crew at each; last train drops the tubes and keeps a light', () => {
    const cas = D.hqRoomBase('site_prebuilt_strip_casino');
    for (const vid of [null, 'dead_hour', 'jackpot']) {
        try {
            const r = D.hqApplyRoomVariant('site_prebuilt_strip_casino', vid);
            assert.ok(!r.props.some(p => p.key === 'wall_clock' || p.key === 'false_window'), (vid || 'sheet') + ': no clock, no window');
            assert.equal(r.doors.length, 1); assert.equal(r.props.filter(p => p.key === 'slot_machine').length, 8, 'eight machines');
            assert.ok(r.npcSpots.some(n => n.race === 'politician' && n.x === 0 && n.z === -2.5), (vid || 'sheet') + ': the dealer never leaves the table');
        } finally { D.hqApplyRoomVariant('site_prebuilt_strip_casino', null); }
    }
    assert.ok(cas.variants.jackpot.npcSpots.filter(n => !n.race).length >= 3, 'a crowd of roster draws at the machine');
    try {
        const pl = D.hqApplyRoomVariant('site_prebuilt_downtown_subway', 'rush_hour');
        for (const q of [...pl.props, ...pl.npcSpots, ...pl.onlineSpots]) if (!q.wall && !q.ceil && q.key !== 'track_bed' && q.key !== 'platform_edge') assert.ok((q.x || 0) > -1.0, (q.key || q.race || 'seat') + ' stands on the track');
        assert.ok(pl.npcSpots.length >= 6 && pl.onlineSpots.length >= 3, 'a full platform');
        assert.equal(pl.props.filter(p => p.key === 'turnstile').length, 3, 'the three gates stand');
    } finally { D.hqApplyRoomVariant('site_prebuilt_downtown_subway', null); }
    try {
        const pl = D.hqApplyRoomVariant('site_prebuilt_downtown_subway', 'last_train');
        assert.ok(!pl.props.some(p => p.key === 'flicker_tube') && pl.props.some(p => p.key === 'bare_bulb'), 'the tubes off, one bulb');
        assert.equal(pl.npcSpots.length, 1); assert.equal(pl.npcSpots[0].race, 'zombie', 'the one who waits');
    } finally { D.hqApplyRoomVariant('site_prebuilt_downtown_subway', null); }
    try {
        const gd = D.hqApplyRoomVariant('site_prebuilt_revenge_gundeck', 'battle_stations');
        const base = D.hqRoomBase('site_prebuilt_revenge_gundeck');
        assert.equal(JSON.stringify(gd.props.filter(p => p.key === 'ship_cannon')), JSON.stringify(base.props.filter(p => p.key === 'ship_cannon')), 'the four guns stand where they stand');
        for (const gun of gd.props.filter(p => p.key === 'ship_cannon')) assert.ok(gd.npcSpots.some(n => Math.abs(n.z - gun.z) < 0.01 && Math.sign(n.x) === Math.sign(gun.x) && Math.abs(n.x) < Math.abs(gun.x)), 'a crew inboard of the gun at z ' + gun.z);
        assert.equal(gd.shell.mood.light, 0xff6a3a, 'the battle lanterns burn red'); assert.equal(gd.shell.w, base.shell.w);
        assert.ok(gd.props.filter(p => p.key === 'wall_torch').length === 2, 'the second match lit');
    } finally { D.hqApplyRoomVariant('site_prebuilt_revenge_gundeck', null); }
});

test('D7 THE ROLL: the clock beats roll by the hour (the dead hour at 4, rush at 8:30, last train at 2, battle stations at 23:30), never outside it; the p beats roll by the seed within reason; the building-wide roll names the three rooms; map.js rolls on a fresh arrival', () => {
    const prof = seed => ({ door: { hq: { variantSeed: seed, visits: 2 } } });
    const at = (h, m) => new Date(2026, 8, 16, h, m || 0);
    for (let sd = 0; sd < 12; sd++) {
        assert.equal(D.hqVariantRoll('site_prebuilt_strip_casino', prof(sd), { now: at(4) }), 'dead_hour');
        assert.equal(D.hqVariantRoll('site_prebuilt_downtown_subway', prof(sd), { now: at(8, 30) }), 'rush_hour');
        assert.equal(D.hqVariantRoll('site_prebuilt_downtown_subway', prof(sd), { now: at(2) }), 'last_train');
        assert.equal(D.hqVariantRoll('site_prebuilt_downtown_subway', prof(sd), { now: at(14) }), null, 'the platform by day is the sheet');
        assert.equal(D.hqVariantRoll('site_prebuilt_revenge_gundeck', prof(sd), { now: at(23, 30) }), 'battle_stations');
        assert.equal(D.hqVariantRoll('site_prebuilt_revenge_gundeck', prof(sd), { now: at(1) }), 'battle_stations', 'wraps midnight');
    }
    let jack = 0, guns = 0;
    for (let sd = 0; sd < 400; sd++) { if (D.hqVariantRoll('site_prebuilt_strip_casino', prof(sd), { now: at(14) }) === 'jackpot') jack++; if (D.hqVariantRoll('site_prebuilt_revenge_gundeck', prof(sd), { now: at(14) }) === 'battle_stations') guns++; }
    assert.ok(jack > 30 && jack < 200, 'a jackpot one visit in five, roughly (' + jack + '/400)');
    assert.ok(guns > 40 && guns < 220, 'battle stations one day visit in four, roughly (' + guns + '/400)');
    try {
        const rolled = D.hqRollRoomVariants(prof(3), { now: at(4) });
        assert.equal(rolled.site_prebuilt_strip_casino, 'dead_hour'); assert.equal(rolled.site_prebuilt_downtown_subway, 'last_train'); assert.equal(rolled.site_prebuilt_revenge_gundeck, 'battle_stations');
        assert.equal(HQ.rooms.site_prebuilt_strip_casino.variant, 'dead_hour');
        assert.equal(HQ.rooms.site_prebuilt_strip_chapel.doors.find(d => d.id === 'casino').sub, 'THE DEAD HOUR · THE CASINO FLOOR', 'the chapel\'s saloon door says so');
    } finally { D.hqRollRoomVariants(prof(3), { force: '' }); }
    assert.equal(HQ.rooms.site_prebuilt_strip_casino, D.hqRoomBase('site_prebuilt_strip_casino'));
    assert.match(MP, /if \(!returning && !walking && typeof window\.hqRollRoomVariants === 'function'\)/, 'a fresh arrival rolls the variants — the complexes included');
});
