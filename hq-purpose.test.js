// hq-purpose.test.js — AREA CONTENT PLAN D5: THE FACILITY ROOMS' PURPOSE (2026-09-21).
//
// The 26 plain boxes that had no counter, no find and no line of their own
// each got ONE of the plan's four things: a by-id PANEL that reads something
// real off the profile (six rooms), a STASH — a daily find of THE BAG's goods
// (ten rooms, DOOR_HQ.stashes → a `stash:<room>` row of kind `item`) — or a
// DAILY LINE (a `say` list on an npcSpot, picked by the day; ten rooms).
// Guards: the table, the id parser (a stash is found by its ROOM, never the
// whole table), the collector's bag write and the daily cadence, the six
// readers on an empty and a filled profile, the counters as by-id panels with
// a desc, every daily line, and the source sites in the three runtime files.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { loadGameData } = require('./load-data');
const D = loadGameData(), HQ = D.DOOR_HQ;
const MP = fs.readFileSync('map.js', 'utf8'), TR = fs.readFileSync('three-renderer.js', 'utf8');

const STASH = ['corridor_a', 'corridor_b', 'crawlspace', 'deadend', 'coldroom', 'supply', 'hwing_office', 'hwing_w', 'hwing_e', 'hwing_bar'];
const PANELS = { dock: 'deliveries', boiler: 'gauge', server: 'uptime', dungeon: 'rollcall', ritual: 'order', hwing_pool: 'typing' };
const LINES = ['medwing', 'recwing', 'execwing', 'services', 'annex', 'kitchen', 'laundry', 'natatorium', 'garden', 'hwing_break'];

test('THE STASH: ten rows, every one a real item in a real room, a stash id names its room, no reserved kind', () => {
    assert.deepEqual(D.hqStashRoomIds(), STASH, 'the ten stash rooms, in the table’s order');
    for (const rid of STASH) {
        const st = HQ.stashes[rid];
        assert.ok(HQ.rooms[rid], rid + ' exists');
        assert.ok(D.ITEM_RULES[st.item] && st.n >= 1 && (st.mod === 3 || st.mod === 7) && st.why, rid + ': a real item, a count, a cadence of 3 or 7, a why');
        assert.equal(D.hqFindRoomOfId('stash:' + rid), rid, 'stash:' + rid + ' is found by its room');
        const rows = D.hqFindsForRoom(rid), items = rows.filter(r => r.kind === 'item');
        assert.equal(items.length, 1, rid + ': one stash row');
        const r = items[0];
        assert.ok(r.id === 'stash:' + rid && r.daily === true && r.mod === st.mod && r.item === st.item && Number.isFinite(r.x) && Number.isFinite(r.z), rid + ': the row');
        assert.ok(!rows.some(x => x.kind === 'tape' || x.kind === 'pay'), rid + ': a stash room carries no tape and no envelope (it had none — that is why it got a stash)');
        assert.equal(D.hqFindById(r.id), r, 'hqFindById finds it through its room');
    }
    /* the three small rooms stand on a pin (the far-corner rule finds nothing in a 3 m box) */
    for (const rid of ['coldroom', 'deadend', 'supply']) assert.ok(HQ.findSpots[rid] && HQ.findSpots[rid].stash, rid + ' pins its stash');
    assert.ok(HQ.rooms.supply.doors.some(d => d.id === 'blast') && HQ.rooms.closet4b.doors.some(d => d.leaf === 'leaf_vault' && d.minClearance === 6), 'the elixir is behind the L6 blast door');
    assert.equal(HQ.stashes.supply.item, 'elixir');
    /* the ledger's key regex takes the kind */
    assert.match(fs.readFileSync('data.js', 'utf8'), /const FIND_RE = \/\^\(tape\|pay\|deck\|stash\):/, 'mergeProgressBlobs carries a stash claim');
});

test('THE STASH: the collector puts it in THE BAG once on a live day, refuses a second take, comes back on its own cadence', () => {
    const row = D.hqFindsForRoom('corridor_a').find(r => r.kind === 'item');
    const q = { door: {}, account: { gold: 0 } };
    const day0 = new Date('2026-09-21T12:00:00Z');
    const live = [];
    for (let i = 0; i < 21; i++) { const dt = new Date(day0.getTime() + i * 864e5); if (D.hqFindLiveToday(row, D.hqToday(dt))) live.push(dt); }
    assert.ok(live.length >= 5 && live.length <= 9, 'a mod-3 stash is live on about a third of three weeks, got ' + live.length);
    const dt = live[0];
    const r1 = D.hqCollectFind(q, row.id, dt.getTime());
    assert.ok(r1.ok && r1.kind === 'item' && r1.item === 'healPotion' && r1.n === 1 && /HEALING POTION · THE BAG/.test(r1.label), 'the take: ' + JSON.stringify(r1));
    assert.equal(D.hqBagCount(q, 'healPotion'), 1, 'one in the bag');
    assert.equal(q.account.gold, 0, 'no gold moves');
    assert.equal(D.hqCollectFind(q, row.id, dt.getTime()).reason, 'taken', 'not twice in a day');
    assert.equal(D.hqFindsInRoom('corridor_a', q, dt.getTime()).length, 0, 'gone from the room today');
    const next = live[1];
    assert.ok(D.hqCollectFind(q, row.id, next.getTime()).ok && D.hqBagCount(q, 'healPotion') === 2, 'back on the next live day');
    const dead = new Date(day0.getTime()); let k = 0; while (D.hqFindLiveToday(row, D.hqToday(dead)) && k++ < 10) dead.setDate(dead.getDate() + 1);
    assert.equal(D.hqCollectFind(q, row.id, dead.getTime()).reason, 'notlive', 'never on a dark day');
    /* the record: a daily claim files the date, in both places when the synced blob exists */
    assert.equal(q.door.hq.finds.taken[row.id], D.hqToday(next));
});

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
        encounters: { count: 3, wins: 2, losses: 1, last: { site: 'prebuilt_shasta', room: 'site_prebuilt_shasta_slopes', race: 'yeti', date: '2026-09-21', won: true } },
        finds: { taken: {}, tapes: [D.DOOR_TAPES[0].id, D.DOOR_TAPES[1].id], pay: 0 } } }, account: { gold: 0, unlockedUnits: [] } };
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
    /* THE OUT-TRAY */
    const t0 = D.hqOutTray(empty), t = D.hqOutTray(p);
    assert.ok(t0.found === 0 && t0.total === 100 && t0.blank === 100 && t0.recent.length === 0, 'an empty tray');
    assert.ok(t.found === 2 && t.blank === 98 && t.recent.length === 2 && t.recent[0].id === D.DOOR_TAPES[1].id && t.recent[0].num === D.DOOR_TAPES[1].num && t.recent[0].title === D.DOOR_TAPES[1].title, 'the last tape first, titled: ' + JSON.stringify(t.recent));
    const DS = fs.readFileSync('data.js', 'utf8'), body = DS.slice(DS.indexOf('function hqOutTray')).split('\n').filter(l => !/^\s*\/\*/.test(l)).slice(0, 6).join('\n');
    assert.doesNotMatch(body, /hqTapeShelf\(|hqFindById\(/, 'the tray never reads the shelf (it compiles every terrain room)');
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

test('the source sites: the renderer’s tin and kind mapping, the take toast, the four-kind pin', () => {
    for (const s of ['find_stash: function (U)', "(f.kind === 'item' || f.kind === 'potion') ? 'find_stash'", "item: 0xff8a5a"]) assert.ok(TR.includes(s), 'three-renderer.js: ' + s);
    assert.ok(HQ.catalogue.find_stash && HQ.catalogue.find_stash.proc === 'find_stash' && HQ.catalogue.find_stash.foot === 0, 'the catalogue row: no foot (nothing blocks)');
    for (const s of ["} else if (beat.kind === 'item' || beat.kind === 'potion') {", "window.hqDockDeliveries", "window.hqBoilerGauge", "window.hqRollCall", "window.hqOrderOfService", "window.hqOutTray", "window._ewAssetStore", "window._ewAssetFailures"]) assert.ok(MP.includes(s), 'map.js: ' + s);
    assert.match(fs.readFileSync('data.js', 'utf8'), /window\.hqDockDeliveries = hqDockDeliveries; window\.hqBoilerGauge = hqBoilerGauge; window\.hqRollCall = hqRollCall; window\.hqOrderOfService = hqOrderOfService; window\.hqOutTray = hqOutTray; window\.hqStashRoomIds = hqStashRoomIds;/, 'the six reads on window');
});
