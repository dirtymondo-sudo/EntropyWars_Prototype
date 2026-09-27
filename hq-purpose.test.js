// hq-purpose.test.js — AREA CONTENT PLAN D5: THE FACILITY ROOMS' PURPOSE (2026-09-21).
//
// The 26 plain boxes that had no counter, no find and no line of their own
// each got ONE of the plan's four things: a by-id PANEL that reads something
// real off the profile (six rooms), a STASH — a daily find of THE BAG's goods
// (ten rooms, DOOR_HQ.stashes → a `stash:<room>` row of kind `item`) — or a
// DAILY LINE (a `say` list on an npcSpot, picked by the day; ten rooms).
// Guards: the panel readers on an empty and a filled profile, the counters as
// by-id panels with a desc, every daily line, no bare room, and the source
// sites. (The stash / out-tray find guards were dropped 2026-09-27.)
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { loadGameData } = require('./load-data');
const D = loadGameData(), HQ = D.DOOR_HQ;
const MP = fs.readFileSync('map.js', 'utf8'), TR = fs.readFileSync('three-renderer.js', 'utf8');

const PANELS = { dock: 'deliveries', boiler: 'gauge', server: 'uptime', dungeon: 'rollcall', ritual: 'order', hwing_pool: 'typing' };
const LINES = ['medwing', 'recwing', 'execwing', 'services', 'annex', 'kitchen', 'laundry', 'natatorium', 'garden', 'hwing_break'];

test('THE SIX PANELS: a by-id counter with a desc in each room, the reader runs on nothing and on a filled profile', () => {
    for (const [rid, cid] of Object.entries(PANELS)) {
        const c = (HQ.rooms[rid].counters || []).find(x => x.id === cid);
        assert.ok(c && c.action && !c.action.fn && !c.action.overlay && !c.action.room && c.desc && c.label && c.sub && c.verb, rid + '/' + cid + ' is a by-id panel with a desc, a label, a sub and a verb');
        assert.match(MP, new RegExp("if \\(c\\.id === '" + cid + "'\\) \\{"), cid + ' has a panel in map.js');
        assert.equal((HQ.rooms[rid].counters || []).length, 1, rid + ' has exactly the one counter');
    }
    const empty = null, p = { door: { hq: {
        punch: { last: D.hqToday(), streak: 4, best: 6, days: 12 },
        earned: { prebuilt_stadium: '2026-09-20' },
        defeated: { catgirl: '2026-09-20', bigfoot: '2026-09-19' },
        encounters: { count: 3, wins: 2, losses: 1, last: { site: 'prebuilt_shasta', room: 'site_prebuilt_shasta_slopes', race: 'yeti', date: '2026-09-21', won: true } } } }, account: { gold: 0, unlockedUnits: [] } };
    /* THE MANIFEST */
    const m0 = D.hqDockDeliveries(empty), m = D.hqDockDeliveries(p);
    assert.ok(m0.delivered.length === 0 && m0.truck.length === 0 && m0.backorders === m0.total && m0.total >= 30, 'nothing on the sheet without a card: ' + JSON.stringify(m0));
    assert.ok(m.delivered.length === 1 && m.delivered[0].id === 'prebuilt_stadium' && m.delivered[0].no === '50' && m.delivered[0].label === 'FOOTBALL STADIUM' && m.delivered[0].date === '2026-09-20', 'the stadium’s door delivered: ' + JSON.stringify(m.delivered));
    assert.equal(m.backorders, m.total - 1, 'the rest back-ordered (the free training room is never a back-order but is not delivered either)');
    /* THE GAUGE */
    const g0 = D.hqBoilerGauge(empty), g = D.hqBoilerGauge(p);
    assert.ok(g0.streak === 0 && g0.psi === 0 && g0.reading === 'COLD', 'cold without a card');
    assert.ok(g.streak === 4 && g.best === 6 && g.days === 12 && g.psi === 60 && g.max === 150 && g.reading === 'RUNNING WARM' && !g.lapsed, JSON.stringify(g));
    /* THE ROLL CALL */
    const r0 = D.hqRollCall(empty), r = D.hqRollCall(p);
    assert.ok(r0.count === 0 && r0.roster === D.AVAILABLE_RACES.length, 'an empty roll');
    assert.ok(r.count === 2 && r.rows[0].race === 'catgirl' && r.rows[0].label === 'CATGIRL' && r.rows[1].race === 'bigfoot' && r.rows[0].date === '2026-09-20', 'newest first, labelled: ' + JSON.stringify(r.rows));
    /* THE ORDER OF SERVICE */
    const o0 = D.hqOrderOfService(empty), o = D.hqOrderOfService(p, new Date('2026-09-21T12:00:00Z').getTime());
    assert.ok(o0.count === 0 && o0.last === null && o0.cleared === 0, 'no offerings without a card');
    assert.ok(o.count === 3 && o.wins === 2 && o.losses === 1 && o.last.race === 'yeti' && o.last.won && /SHASTA/.test(o.last.where), JSON.stringify(o));
});

test('THE DAILY LINES: every one of the ten rooms has a spot with a say LIST, the renderer picks by the day', () => {
    for (const rid of LINES) {
        const spots = HQ.rooms[rid].npcSpots || [];
        assert.ok(spots.length && spots.every(s => Array.isArray(s.say) && s.say.length >= 2 && s.say.every(l => typeof l === 'string' && l.length > 10)), rid + ': every spot says two or more things');
    }
    assert.match(TR, /var sayOf = function \(spot\) \{[^\n]*hqHash\(day \+ '\|' \+ \(room\.label \|\| ''\) \+ '\|say\|' \+ si\)/, 'the line is THE DAY’s: hqHash(day | room | spot)');
    assert.match(TR, /hqToday === 'function'\) \? hqToday\(\)/, 'the day is data.js’s hqToday');
});

test('THE ROOMS: none of the 26 is bare any more — every facility box has a counter, a find, a line or a cast spot', () => {
    const castRooms = new Set(); Object.values(D.DOOR_CAST || {}).forEach(c => (c.spots || []).forEach(s => castRooms.add(s.room)));
    const tapeRooms = new Set(Object.keys(D.hqFindsTapesByRoom()));
    const bare = [];
    for (const [id, r] of Object.entries(HQ.rooms)) {
        if (r.site || r.terrain || r.cave || /^(bay_|ring_|site_)/.test(id)) continue;
        const has = (r.counters || []).length || tapeRooms.has(id) || id === 'locker' || HQ.stashes[id] || (r.npcSpots || []).some(s => s.say) || castRooms.has(id);
        if (!has) bare.push(id);
    }
    assert.deepEqual(bare, [], 'a room with no purpose (AREA_CONTENT_PLAN §5 D5): give it a panel, a stash, a daily line or a cast spot');
});

test('the source sites: the panel readers on window', () => {
    for (const s of ["window.hqDockDeliveries", "window.hqBoilerGauge", "window.hqRollCall", "window.hqOrderOfService", "window._ewAssetStore", "window._ewAssetFailures"]) assert.ok(MP.includes(s), 'map.js: ' + s);
    assert.match(fs.readFileSync('data.js', 'utf8'), /window\.hqDockDeliveries = hqDockDeliveries; window\.hqBoilerGauge = hqBoilerGauge; window\.hqRollCall = hqRollCall; window\.hqOrderOfService = hqOrderOfService; window\.hqOutTray = hqOutTray; window\.hqStashRoomIds = hqStashRoomIds;/, 'the six reads on window');
});
