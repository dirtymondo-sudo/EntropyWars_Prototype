// hq-finds.test.js — THE FINDS + THE TAPES (HQ plan 9.1 stage 1 — 2026-09-15
// rev 12): glowing objects hidden about the world and THE HUNDRED TAPES.
// Guards: the sheet (exactly 100 tapes, T001…T100, every one in a real room
// worth going into — two per built site, one per complex part, never the
// hall / the foyer / a lobby / a corridor; a clip is null or a real media
// path, never a made-up URL), every find's spot (inside its room, clear of
// every blocker, landing and counter; a cave find on a walkable cell the
// first door reaches; a board find on its cell, `hard` exactly when the cell
// is two levels up), the daily roll (never lights a tape; a pay cache on a
// third of the days), the collector (a tape once ever, a cache once a day,
// the pay into the SAME profile object — one save; reserved kinds refused),
// the shelf's hint rule, and the source sites (the renderer's placer, scan
// and API; map.js's take, toast, strip pill and the shelf overlay; the
// Observatorium's shelf counter — ONE home). Repo-only tooling; `npm test`.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { loadGameData } = require('./load-data');
const D = loadGameData(), HQ = D.DOOR_HQ;
const TAPES = D.DOOR_TAPES, FINDS = HQ.finds, R = D.HQ_FIND_RULES;
const g = name => vm.runInContext(name, D);
const TR = fs.readFileSync(__dirname + '/three-renderer.js', 'utf8');
const MP = fs.readFileSync(__dirname + '/map.js', 'utf8');
const IX = fs.readFileSync(__dirname + '/index.html', 'utf8');
const CSS = fs.readFileSync(__dirname + '/styles-base.css', 'utf8');
const NEVER = ['central_egress', 'foyer', 'medwing', 'recwing', 'execwing', 'executive', 'services', 'annex', 'corridor_a', 'corridor_b', 'deadend', 'dock', 'car', 'crawlspace'];

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
function landing(room, d) {
    const S = room.shell;
    if (d.wall === 'free') { const f = (d.face || 0) * Math.PI / 180; return { x: (d.x || 0) + Math.sin(f) * 2.4, z: (d.z || 0) - Math.cos(f) * 2.4 }; }
    if (d.wall === 'n') return { x: d.x || 0, z: -S.d / 2 + 2.4 };
    if (d.wall === 's') return { x: d.x || 0, z: S.d / 2 - 2.4 };
    if (d.wall === 'e') return { x: S.w / 2 - 2.4, z: d.z || 0 };
    return { x: -S.w / 2 + 2.4, z: d.z || 0 };
}
const profile = () => ({ username: 'TEST', account: { gold: 100, unlockedUnits: [], freeTokens: 0 }, door: { hq: {} } });

test('THE HUNDRED: exactly 100 tapes, T001…T100 in order, every one in a real room worth going into, drafts with no invented clip', () => {
    assert.equal(TAPES.length, 100);
    assert.equal(R.tapes, 100);
    TAPES.forEach((t, i) => {
        assert.equal(t.num, 'T' + String(i + 1).padStart(3, '0'), 'display numbers in order');
        assert.equal(t.no, i + 1);
        /* THE STABLE ID (plan §4 B1): sheet key + slot — never the position */
        assert.match(t.id, /^[a-z0-9_]+#\d$/, t.num + ': a stable id');
        assert.ok(t.id.slice(0, t.id.indexOf('#')) in g('HQ_TAPE_SHEET') && Number(t.id.slice(t.id.indexOf('#') + 1)) === t.slot, t.num + ': the id names its sheet row');
        const room = HQ.rooms[t.where];
        assert.ok(room && room.kind === 'box', t.id + ': room ' + t.where + ' is a box room');
        assert.ok(NEVER.indexOf(t.where) < 0 && !/^bay_|^ring_|^hwing_/.test(t.where), t.id + ': never in the hall, the foyer, a lobby or a corridor (' + t.where + ')');
        assert.ok(['evidence', 'parents', 'facility'].indexOf(t.kind) >= 0, t.id + ': a kind');
        assert.ok(t.title && t.caption && t.draft === true, t.id + ': a drafted title + caption (A15)');
        assert.ok(t.clip === null || /\.(gif|webm|mp4|png|jpe?g|webp)$/i.test(t.clip), t.id + ': a clip is null or a media file');
        assert.equal(D.hqTapeClipUrl(t), t.clip ? 'https://cdn.entropywars.net/Assets/door/tapes/' + t.clip : null, t.id + ': the clip URL is the R2 path or null');
    });
    assert.equal(new Set(TAPES.map(t => t.id)).size, 100, 'unique ids');
    assert.equal(new Set(TAPES.map(t => t.num)).size, 100, 'unique numbers');
    /* B1 acceptance: re-homing a site (a different `built` order) moves numbers, never ids */
    const sheetIds = []; for (const [k, rows] of Object.entries(g('HQ_TAPE_SHEET'))) rows.forEach((r, i) => sheetIds.push(k + '#' + i));
    assert.equal(sheetIds.sort().join(','), TAPES.map(t => t.id).sort().join(','), 'the id set IS the sheet — independent of siteRooms.built order');
    assert.equal(D.hqTapeById(TAPES[4].num), TAPES[4], 'a display number still finds its tape');
    assert.equal(D.hqTapeLegacyId('T005'), TAPES[4].id, 'a legacy positional id resolves to the tape at that position today');
    assert.equal(D.hqFindLegacyId('tape:T100'), 'tape:' + TAPES[99].id); assert.equal(D.hqFindLegacyId('pay:garage'), 'pay:garage');
    /* two per built site (in its board room), one per complex part */
    /* THE WOODS (9.3 stage 3, 2026-09-16): a built site keeps at least one tape in its board room — six gave their second to the woods' parts (the hundred stays a hundred) */
    /* THE DEEP (2026-09-18): a BYPASSED board (siteRooms.entry — nobody walks it) may carry none: its tape moved into the part its threshold lands in */
    for (const site of HQ.siteRooms.built) { const n = TAPES.filter(t => t.where === 'site_' + site).length, bypassed = !!(HQ.siteRooms.entry || {})[site]; assert.ok(n <= 2 && (n >= 1 || bypassed), site + ': one or two tapes in its board room (' + n + ')'); }
    for (const part of D.hqComplexRooms()) assert.equal(TAPES.filter(t => t.where === part).length, 1, part + ': one tape');
    assert.equal(TAPES.filter(t => t.site).length, TAPES.filter(t => /^prebuilt_|^site_prebuilt_/.test(t.where) || /^site_/.test(t.where)).length, 'every site / part tape knows its site');
});

test('every tape has a find, every tape room a daily pay cache, and no other kinds are placed', () => {
    for (const t of TAPES) {
        const f = FINDS.find(x => x.tape === t.id);
        assert.ok(f && f.id === 'tape:' + t.id && f.kind === 'tape' && f.room === t.where && !f.daily, t.id + ' has its find row in its room');
    }
    const rooms = new Set(TAPES.map(t => t.where));
    for (const rid of rooms) {
        const pays = FINDS.filter(f => f.room === rid && f.kind === 'pay');
        /* D7 (Phase 9 Delivery 4): a `quiet: true` part keeps its tape and goes without the envelope */
        assert.equal(pays.length, HQ.rooms[rid].quiet ? 0 : 1, rid + ': one pay cache' + (HQ.rooms[rid].quiet ? ' — none, a quiet room' : ''));
        if (!pays.length) continue;
        assert.ok(pays[0].daily === true && pays[0].amount > 0 && pays[0].id === 'pay:' + rid, rid + ': daily, paid, id');
        assert.equal(pays[0].amount, HQ.rooms[rid].fx === 'site' ? R.pay : R.payDeep, rid + ': the walkway rate on a board room, the deep rate elsewhere');
    }
    assert.deepEqual([...new Set(FINDS.map(f => f.kind))].sort(), ['deck', 'pay', 'tape'], 'only the three shipped kinds are placed (potion / item / cube are reserved; deck = SKATEBOARDING 9.8, one row in Room 26)');
    assert.equal(FINDS.filter(f => f.kind === 'deck').length, 1, 'one deck, in the locker room'); assert.equal(FINDS.find(f => f.kind === 'deck').room, 'locker');
    assert.equal(new Set(FINDS.map(f => f.id)).size, FINDS.length, 'unique find ids');
    for (const f of FINDS) assert.ok(f.why, f.id + ': a why');
});

test('every find stands inside its room, clear of every blocker, native, counter and door landing; two finds in one room stand apart', () => {
    for (const f of FINDS) {
        const room = HQ.rooms[f.room], S = room.shell;
        const wm = (f.y != null) ? 0.25 : 0.6;   // a shelf find leans on its wall
        assert.ok(Math.abs(f.x) < S.w / 2 - wm && Math.abs(f.z) < S.d / 2 - wm, f.id + ': inside the walls');
        if (f.cell) continue;                       // the board finds have their own test
        for (const p of room.props || []) assert.ok(!propBlocks(room, p, f.x, f.z, f.y != null ? -0.2 : 0.3), f.id + ': ' + p.key + ' stands on it');
        for (const q of (room.npcSpots || []).concat(room.agents || [])) if (q.x != null) assert.ok(Math.hypot(f.x - q.x, f.z - q.z) > 0.6, f.id + ': a native stands on it');
        for (const c of room.counters || []) assert.ok(Math.hypot(f.x - c.x, f.z - c.z) > (c.radius || 2), f.id + ': inside a counter\'s reach (' + c.id + ')');
        for (const d of room.doors || []) { const L = landing(room, d); assert.ok(Math.hypot(f.x - L.x, f.z - L.z) > 1.0, f.id + ': on the landing of ' + d.id); }
        if (S.open) for (const m of S.lights || []) assert.ok(Math.hypot(f.x - m.x, f.z - m.z) > 0.8, f.id + ': a mast stands on it');
        const others = FINDS.filter(o => o !== f && o.room === f.room && !o.cell);
        for (const o of others) assert.ok(Math.hypot(f.x - o.x, f.z - o.z) > 1.2, f.id + ' and ' + o.id + ' stand on each other');
    }
});

test('a terrain find stands on dry ground at its height, `hard` exactly when the first door\'s reach never gets there; a site board find is on its cell, `hard` exactly when two levels up', () => {
    let caves = 0, boards = 0, hard = 0;
    for (const f of FINDS) {
        const room = HQ.rooms[f.room];
        if (room.terrain) {   // THE TERRAIN ROOMS (2026-09-17): the cave and the woods
            caves++;
            const info = D.hqTerrainInfo(f.room);
            assert.ok(typeof f.y === 'number' && Math.abs(f.y - D.hqTerrainHeight(info, f.x, f.z)) < 0.05, f.id + ': at its ground');
            assert.ok(!D.hqTerrainFluidAt(info, f.x, f.z), f.id + ': dry');
            const L0 = D.hqTerrainDoorLanding(room, room.doors[0]);
            const reached = D.hqTerrainReach(info, L0.x, L0.z).has(D.hqTerrainNodeKey(info, f.x, f.z));
            assert.equal(!!f.hard, !reached, f.id + ': hard ⇔ the first door never reaches it');
            if (f.hard) hard++;
        }
        if (f.cell) {
            boards++;
            assert.equal(room.fx, 'site', f.id + ': a cell find is on a site board');
            const b = D.hqSiteBoardInfo(room.site), cell = 128 / HQ.units, half = b.w * cell / 2;
            const [cx, cy] = f.cell, c = b.cells[cy][cx];
            assert.ok(Math.abs(f.x - ((cx + 0.5) * cell - half)) < 0.02 && Math.abs(f.z - ((cy + 0.5) * cell - half)) < 0.02, f.id + ': x/z is its cell');
            assert.ok(c.walk && !c.fluid && c.lvl >= 0, f.id + ': a dry, walkable, unsunk cell');
            assert.ok(Math.abs((f.y || 0) - c.lvl * cell) < 0.02, f.id + ': y is the cell top');
            assert.equal(!!f.hard, c.lvl >= 2, f.id + ': hard exactly when the walker cannot climb it');
            if (f.hard) hard++;
            assert.ok(Math.hypot(f.x, f.z) > 2.3, f.id + ': off the battle marker');
            for (const m of b.mons) assert.ok(!(cx >= m.x && cx < m.x + m.foot && cy >= m.y && cy < m.y + m.foot), f.id + ': on a monument');
        }
    }
    assert.equal(boards, HQ.siteRooms.built.filter(site => TAPES.filter(t => t.where === 'site_' + site).length === 2).length, 'one board find per site that kept its second tape (THE WOODS took six)');
    assert.ok(caves >= 28 && hard >= 10, 'the terrain rooms and the walls are used (terrain finds ' + caves + ', hard ' + hard + ')');
});

test('the daily roll never lights a tape; a pay cache is live on about a third of the days; hqFindsInRoom hides the taken and the dark', () => {
    const live = g('hqFindLiveToday');
    const tape = FINDS.find(f => f.kind === 'tape'), pay = FINDS.find(f => f.kind === 'pay');
    let n = 0;
    for (let d = 1; d <= 90; d++) {
        const date = '2026-10-' + String((d % 28) + 1).padStart(2, '0') + (d > 28 ? '-' + d : '');
        assert.equal(live(tape, date), true, 'a tape is always live');
        if (live(pay, date)) n++;
    }
    assert.ok(n >= 15 && n <= 45, 'a third of the days, roughly (' + n + ' / 90)');
    const p = profile();
    const before = D.hqFindsInRoom(tape.room, p).map(f => f.id);
    assert.ok(before.indexOf(tape.id) >= 0, 'an untaken tape stands');
    D.hqCollectFind(p, tape.id);
    assert.ok(D.hqFindsInRoom(tape.room, p).map(f => f.id).indexOf(tape.id) < 0, 'a taken tape is gone');
    assert.equal(D.hqFindsInRoom('central_egress', p).length, 0, 'nothing in the hall');
});

test('hqCollectFind: a tape once ever, a cache once a day and only on a live day, the pay into the SAME profile object, reserved and unknown kinds refused', () => {
    const p = profile();
    const tape = FINDS.find(f => f.kind === 'tape');
    const r1 = D.hqCollectFind(p, tape.id);
    assert.ok(r1.ok && r1.kind === 'tape' && r1.count === 1 && r1.total === 100 && r1.title && /^TAPE 1 \/ 100 · /.test(r1.label), 'the first tape');
    assert.equal(p.door.hq.finds.tapes.join(','), tape.tape);   // (a vm-realm array: never deepEqual it)
    assert.equal(p.door.hq.finds.taken[tape.id], true);
    assert.equal(D.hqCollectFind(p, tape.id).reason, 'taken', 'once ever');
    assert.equal(D.hqTapeCount(p).found, 1);
    /* a pay cache: find a day it is live, then take it on that day */
    const pay = FINDS.find(f => f.kind === 'pay');
    const live = g('hqFindLiveToday');
    let day = null;
    for (let d = 1; d <= 31 && !day; d++) { const iso = '2026-10-' + String(d).padStart(2, '0'); if (live(pay, iso)) day = iso; }
    assert.ok(day, 'a live day exists');
    const dark = (() => { for (let d = 1; d <= 31; d++) { const iso = '2026-10-' + String(d).padStart(2, '0'); if (!live(pay, iso)) return iso; } })();
    const at = iso => new Date(iso + 'T12:00:00').getTime();
    assert.equal(D.hqCollectFind(p, pay.id, at(dark)).reason, 'notlive', 'dark today');
    const gold0 = p.account.gold;
    const r2 = D.hqCollectFind(p, pay.id, at(day));
    assert.ok(r2.ok && r2.kind === 'pay' && r2.amount === pay.amount && r2.gold === gold0 + pay.amount, 'paid');
    assert.equal(p.account.gold, gold0 + pay.amount, 'the pay went into the profile object handed in — one save');
    assert.equal(p.door.hq.finds.taken[pay.id], day, 'taken today');
    assert.equal(p.door.hq.finds.pay, pay.amount);
    assert.equal(D.hqCollectFind(p, pay.id, at(day)).reason, 'taken', 'once a day');
    assert.equal(D.hqCollectFind(p, 'nope').reason, 'unknown');
    assert.equal(D.hqCollectFind(null, tape.id).reason, 'noprofile');
    /* a reserved kind is refused, never faked */
    HQ.finds.push({ id: 'potion:test', room: 'garage', kind: 'potion', x: 0, z: 0 });
    try { assert.equal(D.hqCollectFind(p, 'potion:test').reason, 'unsupported'); } finally { HQ.finds.pop(); }
    assert.equal(D.hqFindsRecord({}).tapes.length, 0, 'a bare profile reads as nothing found');
});

/* THE LEDGER (PHASE9_QUALITY_PLAN §4 B2, 2026-09-16): the claim rides the synced progress blob; the server pays each envelope once */
test('THE LEDGER: a take mirrors the claim into progress.hq.finds.taken, a server account is not credited locally, the merge keeps the claim, the sync pays once', () => {
    const tape = FINDS.find(f => f.kind === 'tape'), pay = FINDS.find(f => f.kind === 'pay');
    const live = g('hqFindLiveToday');
    let day = null; for (let d = 1; d <= 31 && !day; d++) { const iso = '2026-11-' + String(d).padStart(2, '0'); if (live(pay, iso)) day = iso; }
    const at = iso => new Date(iso + 'T12:00:00').getTime();
    /* a profile with a v2 progress blob and a server account */
    const p = Object.assign(profile(), { progress: { v: 2, counters: {}, champs: {}, records: {}, unlocked: {} } });
    const r1 = D.hqCollectFind(p, tape.id, null, { serverPays: true });
    assert.ok(r1.ok && p.progress.hq.finds.taken[tape.id] === true && p.door.hq.finds.taken[tape.id] === true, 'the tape claim in both records');
    const gold0 = p.account.gold;
    const r2 = D.hqCollectFind(p, pay.id, at(day), { serverPays: true });
    assert.ok(r2.ok && r2.serverPays === true && p.account.gold === gold0, 'a server account: the wallet is the server\'s — no local credit');
    assert.equal(p.progress.hq.finds.taken[pay.id], day, 'the envelope claim in the blob, dated');
    assert.equal(p.door.hq.finds.pay, pay.amount, 'the tally still counts it');
    /* a local profile IS credited (the old rule) */
    const q = Object.assign(profile(), { progress: { v: 2, counters: {}, champs: {}, records: {}, unlocked: {} } });
    const r3 = D.hqCollectFind(q, pay.id, at(day));
    assert.ok(r3.ok && r3.serverPays === false && q.account.gold === 100 + pay.amount, 'no server account: credited locally');
    /* a profile without a v2 blob never gets one invented; the local record alone carries it (profile.js folds it in on the next read) */
    const n = profile();
    assert.ok(D.hqCollectFind(n, tape.id, null, { serverPays: true }).ok && n.progress === undefined && n.door.hq.finds.taken[tape.id] === true, 'no blob invented');
    /* the union read: a claim only in the synced blob (a second device) is found; a legacy positional claim is migrated */
    const dev2 = { progress: { v: 2, hq: { finds: { taken: { [tape.id]: true, 'tape:T003': true } } } } };
    const rec = D.hqFindsRecord(dev2);
    assert.ok(rec.taken[tape.id] === true && rec.tapes.indexOf(tape.tape) >= 0, 'the other device\'s tape is on the shelf');
    assert.ok(rec.taken['tape:' + TAPES[2].id] === true && rec.tapes.indexOf(TAPES[2].id) >= 0 && !rec.taken['tape:T003'], 'the legacy claim reads as today\'s id');
    assert.equal(D.hqCollectFind(dev2, tape.id).reason, 'taken', 'and cannot be taken twice across devices');
    /* the merge: union, true beats a date, the later date wins, garbage dropped */
    const merge = g('mergeProgressBlobs');
    const m1 = merge({ v: 2, hq: { finds: { taken: { [tape.id]: true, [pay.id]: '2026-11-01', 'pay:garage': '2026-11-03', 'bogus key': true, 'pay:x': 'not-a-date', __proto__: { 'pay:y': true } } } } },
                     { v: 2, hq: { finds: { taken: { [pay.id]: '2026-11-02', 'pay:garage': '2026-11-02', 'deck:locker': true } } } });
    assert.equal(m1.hq.finds.taken[tape.id], true); assert.equal(m1.hq.finds.taken[pay.id], '2026-11-02'); assert.equal(m1.hq.finds.taken['pay:garage'], '2026-11-03'); assert.equal(m1.hq.finds.taken['deck:locker'], true);
    assert.ok(!('bogus key' in m1.hq.finds.taken) && !('pay:x' in m1.hq.finds.taken) && !('pay:y' in m1.hq.finds.taken), 'garbage dropped');
    assert.ok(merge(null, { v: 2 }).hq.finds.taken && Object.keys(merge(null, null).hq.finds.taken).length === 0, 'the shape is always there');
    /* the sync pays each newly-merged envelope once, on the first sync too, never a tape, never an unknown row */
    const payFn = g('hqFindsSyncPay');
    const stored = null, pushed = { v: 2, hq: { finds: { taken: { [tape.id]: true, [pay.id]: day } } } };
    const merged1 = merge(stored, pushed);
    assert.equal(payFn(stored, merged1), pay.amount, 'the first sync pays the envelope');
    assert.equal(payFn(merged1, merge(merged1, pushed)), 0, 'a retry pays nothing');
    const later = merge(merged1, { v: 2, hq: { finds: { taken: { [pay.id]: '2026-12-31', 'pay:no_such_room': '2026-12-31' } } } });
    assert.equal(payFn(merged1, later), pay.amount, 'a later day pays again; an unknown row pays nothing');
    assert.equal(payFn(later, later), 0);
    /* the sources: the take passes the wallet's owner and schedules the push; the server pays; profile.js folds the local record into the blob */
    assert.ok(MP.indexOf("hqCollectFind(p, t.id, null, { serverPays })") >= 0 && MP.indexOf('PS.scheduleProgressSync()') >= 0, 'map.js: the take');
    const SV = require('fs').readFileSync(require('path').join(__dirname, 'server.js'), 'utf8');
    assert.ok(SV.indexOf('hqFindsSyncPay') >= 0 && SV.indexOf('ACH.findsPay(stored, merged)') >= 0, 'server.js pays the envelopes');
    const PF = require('fs').readFileSync(require('path').join(__dirname, 'profile.js'), 'utf8');
    assert.ok(PF.indexOf('window.hqFindsTakenUnion(prog.hq.finds.taken, local)') >= 0 && PF.indexOf('scheduleProgressSync,') >= 0, 'profile.js: the fold + the export');
});

test('THE SHELF: found / hint / where — an unfound spine reads its room once another tape of the same site is on file', () => {
    const p = profile();
    /* THE UNDERWORLD (2026-09-18): no board carries two tapes any more (every second tape went to a complex part — the hundred is fixed); the pair is the first built site's board tape and the first of its parts' */
    const site = HQ.siteRooms.built[0], pair = [TAPES.find(t => t.where === 'site_' + site), TAPES.find(t => t.where !== 'site_' + site && D.hqRoomSite(t.where) === site)];
    assert.ok(pair[0] && pair[1], 'the first built site has a board tape and a part tape');
    let sh = D.hqTapeShelf(p);
    assert.equal(sh.rows.length, 100); assert.equal(sh.found, 0);
    assert.ok(sh.rows.every(r => !r.found && !r.hint), 'nothing found, nothing hinted');
    D.hqCollectFind(p, 'tape:' + pair[0].id);
    sh = D.hqTapeShelf(p);
    const a = sh.rows.find(r => r.id === pair[0].id), b = sh.rows.find(r => r.id === pair[1].id);
    assert.ok(a.found && !a.hint && a.clip === null && a.roomLabel && a.roomNo === D.hqRoomNo('site_' + site), 'the found one: labelled, numbered, blank');
    assert.ok(!b.found && b.hint && b.hard === !!FINDS.find(f => f.tape === b.id).hard, 'its sibling in the complex: hinted');
    /* D.U.M.B. (2026-09-17): the first built site is a COMPLEX now — every other tape of the site is hinted: the board's sibling and one per part */
    const siteTapes = TAPES.filter(t => D.hqRoomSite(t.where) === site).length;
    assert.ok(siteTapes >= 3, 'the first built site has parts (' + siteTapes + ')');
    assert.equal(sh.rows.filter(r => r.hint).length, siteTapes - 1, 'every other tape of the site is hinted, nothing else');
    /* a complex part hints the other parts of the same site */
    const parts = TAPES.filter(t => t.where.indexOf('site_prebuilt_hollow_earth_') === 0);
    D.hqCollectFind(p, 'tape:' + parts[0].id);
    sh = D.hqTapeShelf(p);
    assert.ok(parts.slice(1).every(t => sh.rows.find(r => r.id === t.id).hint), 'the cave\'s other chambers are hinted');
    assert.ok(sh.rows.find(r => r.where === 'site_prebuilt_hollow_earth').hint, 'and the board room of the same site');
});

test('source sites: the renderer places, scans and takes; map.js takes in one save and shows the shelf; the strip, the toast, the CSS; the shelf is ONE home in Room 360', () => {
    for (const s of ['function _hqPlaceFinds(room)', 'function _hqTakeFind(id)', 'takeFind: _hqTakeFind', "best = { kind: 'find', id: f.id", 'finds: [], findLights: 0', '_hqPlaceFinds(room); } catch', 'HQ_FIND_REACH', 'find_tape: function (U)', 'find_pay: function (U)', 'tape_shelf: function (U)', 'window.EW_HQ_FINDS_ALL', 'hqFindsInRoom(roomId, _hq.profile)'])
        assert.ok(TR.indexOf(s) >= 0, 'three-renderer.js: ' + s);
    for (const s of ['window._hqTakeFind = function (t)', "if (t && t.kind === 'find') { window._hqTakeFind(t); return; }", "act.overlay === 'tapes') return _hqTapesHtml()", 'function _hqTapesHtml()', 'window._hqOpenTapes = function', "_hqEl('hqTapes')", 'function _hqToast(html, ms)', "t.kind === 'find' ? 'TAKE'", "closest('[data-tape]')", "row('THE TAPES'"])
        assert.ok(MP.indexOf(s) >= 0, 'map.js: ' + s);
    /* one transaction: collect, then save — never creditLocalGold's second load inside the take */
    const take = MP.slice(MP.indexOf('window._hqTakeFind = function (t)'), MP.indexOf('function _hqTapesHtml()'));
    assert.ok(take.indexOf('hqCollectFind(p, t.id, null, { serverPays })') >= 0 && take.indexOf('PS.saveProfile(idx, p)') >= 0 && take.indexOf('creditLocalGold') < 0, 'one claim + reward save');
    assert.ok(take.indexOf('hqCollectFind(p, t.id') < take.indexOf('PS.saveProfile(idx, p)') && take.indexOf('PS.saveProfile(idx, p)') < take.indexOf('ThreeRenderer.hq.takeFind(t.id)'), 'collect → save → drop');
    for (const s of ['id="hqTapes"', 'id="hqToast"', 'window._hqOpenTapes()']) assert.ok(IX.indexOf(s) >= 0, 'index.html: ' + s);
    for (const s of ['.hq-strip-stat.hq-strip-tapes', '.hq-toast.show', '.hq-tapes {', '.hq-tape-spine.found', '.hq-tape-screen', '.hq-tape-static']) assert.ok(CSS.indexOf(s) >= 0, 'styles-base.css: ' + s);
    /* the catalogue */
    for (const k of ['find_tape', 'find_pay', 'tape_shelf']) assert.ok(HQ.catalogue[k] && HQ.catalogue[k].proc === k && HQ.catalogue[k].h > 0, k + ' catalogued');
    assert.ok(HQ.catalogue.tape_shelf.wall && HQ.catalogue.tape_shelf.depth > 0 && HQ.catalogue.tape_shelf.block, 'the shelf is a wall proc with a depth that blocks');
    assert.equal(HQ.catalogue.find_tape.foot, 0); assert.equal(HQ.catalogue.find_pay.foot, 0);
    /* the Observatorium: the shelf counter → overlay tapes, once in the building; the shelf prop on the east wall */
    const obs = HQ.rooms.observatorium;
    const shelf = obs.counters.find(c => c.id === 'shelf');
    assert.ok(shelf && shelf.action.overlay === 'tapes' && shelf.verb === 'BROWSE' && shelf.desc, 'THE SHELF counter');
    assert.ok(obs.props.some(p => p.key === 'tape_shelf' && p.wall === 'e'), 'the tape shelf hangs on the east wall');
    let homes = 0;
    for (const room of Object.values(HQ.rooms)) for (const c of (room.counters || []).concat(room.doors || [])) if (c.action && c.action.overlay === 'tapes') homes++;
    assert.equal(homes, 1, 'the shelf is one home');
    assert.ok(obs.counters.find(c => c.id === 'projector').action.fn === '_ewReplayLastMatch', 'the projector still replays');
    for (const fn of ['hqFindsInRoom', 'hqCollectFind', 'hqTapeShelf', 'hqTapeCount', 'hqTapeClipUrl', 'hqFindById', 'hqTapeById', 'hqFindsRecord', 'hqFindsSyncPay', 'hqTapeLegacyId', 'hqFindLegacyId', 'hqFindsTakenUnion']) assert.equal(typeof D[fn], 'function', fn + ' on window');
    /* the shelf prints the display number and files the stable id */
    assert.ok(MP.indexOf('data-tape="${_hqEsc(r.id)}"') >= 0 && MP.indexOf('${_hqEsc(sel.num)} ·') >= 0, 'map.js: num shown, id filed');
    assert.ok(D.DOOR_TAPES === TAPES && D.HQ_FIND_RULES === R, 'the tables on window');
});
