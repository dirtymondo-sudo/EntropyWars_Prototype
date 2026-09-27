// hq-map-remembers.test.js — PHASE 9 DELIVERY 4 · THE MAP REMEMBERS
// (PHASE9_QUALITY_PLAN §6 D6 · D7 · D8 · D9 + §8 item 9, 2026-09-16).
// D6 discovered routes: a link is CHARTED when the officer walks one of its
// doors (hqLinkSee, both records, the synced blob key hq.links.seen); THE
// WORLD tab marks legs seen / stations known and draws the rest dotted +
// unlabelled, GO for every stop. D7: quiet rooms and the Spaceship's reveal
// (the sun in the bridge's viewport). Item 9: the LIP snap rule
// (_hqPortalLedgeSnap). The tape / find / lesson guards were dropped
// 2026-09-27 (the owner: the tapes change while the map is being built).
'use strict';
const test = require('node:test');
const { heavy } = require('./test-heavy.js');   // 2026-09-18: the heavy geometry proofs run on `npm run test:full` / in CI
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { loadGameData } = require('./load-data');
const D = loadGameData(), HQ = D.DOOR_HQ;
const TR = fs.readFileSync(__dirname + '/three-renderer.js', 'utf8');
const MP = fs.readFileSync(__dirname + '/map.js', 'utf8');
const PF = fs.readFileSync(__dirname + '/profile.js', 'utf8');
const CSS = fs.readFileSync(__dirname + '/styles-base.css', 'utf8');
const merge = vm.runInContext('mergeProgressBlobs', D);
const liveLinks = HQ.links.filter(l => D.hqLinkLive(l));

test('D6 THE RECORD: hqLinkSee charts a link on both records once, dated; an unknown or malformed id is refused; the union keeps the EARLIER day; hqWorldCharted counts the live links', () => {
    const link = liveLinks[0];
    const p = { door: {}, progress: { v: 2 } };
    const r1 = D.hqLinkSee(p, 'link_' + link.id, Date.UTC(2026, 10, 3, 12));
    assert.ok(r1.ok && r1.first && r1.link === link.id && r1.route === link.route, 'a first charting');
    assert.equal(p.door.hq.links.seen[link.id], r1.date, 'the local record');
    assert.equal(p.progress.hq.links.seen[link.id], r1.date, 'the synced record');
    const r2 = D.hqLinkSee(p, link.id, Date.UTC(2026, 11, 3, 12));
    assert.ok(r2.ok && !r2.first && r2.date === r1.date, 'charted already — the first day stands');
    assert.ok(D.hqLinkSeen(p, link.id) && !D.hqLinkSeen(p, liveLinks[1].id), 'seen / unseen');
    assert.ok(!D.hqLinkSee(p, 'no_such_link').ok && !D.hqLinkSee(p, 'Bad-Id').ok && !D.hqLinkSee(null, link.id).ok, 'refusals');
    const n = { door: {} };
    assert.ok(D.hqLinkSee(n, link.id).ok && n.progress === undefined && n.door.hq.links.seen[link.id], 'no blob invented');
    const u = D.hqLinksSeenUnion({ a_b: '2026-11-05', junk: '2026-11-05', 'bad id': '2026-11-05' }, { a_b: '2026-11-02', c_d: true });
    assert.equal(u.a_b, '2026-11-02'); assert.ok(u.c_d && /^\d{4}-\d{2}-\d{2}$/.test(u.c_d) && !('bad id' in u), 'earlier day wins; a bare true becomes today; a bad id is dropped');
    const ch = D.hqWorldCharted(p);
    assert.equal(ch.total, liveLinks.length); assert.equal(ch.seen, 1); assert.equal(ch.routes[link.route].seen, 1);
    assert.equal(D.hqWorldCharted(null).seen, 0);
});

test('D6 THE BLOB: mergeProgressBlobs carries hq.links.seen — the union, the earlier day, garbage dropped, the shape always there', () => {
    const m = merge({ v: 2, hq: { links: { seen: { moon_derelict: '2026-11-03', 'bad id': '2026-11-01', ok_but_true: true, __proto__: { x_y: '2026-01-01' } } } } },
                    { v: 2, hq: { links: { seen: { moon_derelict: '2026-11-01', derelict_saturn: '2026-11-04', not_a_date: 'yesterday' } } } });
    assert.equal(m.hq.links.seen.moon_derelict, '2026-11-01', 'the earlier day');
    assert.equal(m.hq.links.seen.derelict_saturn, '2026-11-04');
    assert.ok(!('bad id' in m.hq.links.seen) && !('ok_but_true' in m.hq.links.seen) && !('not_a_date' in m.hq.links.seen) && !('x_y' in m.hq.links.seen), 'garbage dropped');
    assert.ok(merge(null, null).hq.links.seen && Object.keys(merge(null, null).hq.links.seen).length === 0, 'the shape is always there');
    const big = {}; for (let i = 0; i < 600; i++) big['l_' + i] = '2026-11-01';
    assert.ok(Object.keys(merge({ v: 2, hq: { links: { seen: big } } }, null).hq.links.seen).length <= 512, 'capped');
    assert.ok(/hq\.links\.seen/.test(PF) && /hqLinksSeenUnion/.test(PF), 'profile.js folds the local record into the blob on every read');
});

test('D6 THE WORLD KNOWS: a stranger sees every leg unseen and only the facility / here stations known; a walked link solidifies its leg and names both ends; a legacy read carries no marks; the facility stations are known by construction', () => {
    const cur = 'central_egress';
    const stranger = D.hqWorldRoutes(cur, { profile: null });
    assert.ok(stranger.length && stranger.every(r => r.legs.every(l => l.seen === false) && r.seenLegs === 0 && r.totalLegs === r.legs.length), 'nothing charted');
    for (const r of stranger) for (const st of r.stations) assert.equal(st.known, !D.hqRoomSite(st.room) || st.here, r.id + ' / ' + st.room + ': known only when it is the facility\'s or here');
    assert.ok(stranger.some(r => r.stations.some(st => st.known === false)), 'there ARE unknown stations for a stranger');
    const link = liveLinks.find(l => D.hqRoomSite(D.hqLinkLive(l).a) && D.hqRoomSite(D.hqLinkLive(l).b));
    const p = { door: {} }; D.hqLinkSee(p, link.id);
    const walked = D.hqWorldRoutes(cur, { profile: p });
    const line = walked.find(r => r.id === link.route), leg = line.legs.find(l => l.link === link.id);
    assert.ok(leg.seen === true && line.seenLegs === 1, 'the walked leg is solid');
    for (const rid of [leg.from, leg.to]) assert.ok(line.stations.find(st => st.room === rid).known, rid + ' is named at both ends');
    const here = D.hqWorldRoutes(leg.to, { profile: null }).find(r => r.id === link.route).stations.find(st => st.room === leg.to);
    assert.ok(here.here && here.known, 'standing in it makes it known');
    const legacy = D.hqWorldRoutes(cur);
    assert.ok(legacy.every(r => r.legs.every(l => !('seen' in l)) && r.stations.every(st => !('known' in st))), 'no opts → no marks (the older readers)');
});

test('D6 source sites: a link door charts in the visit transaction and toasts a first sighting; THE WORLD draws unseen legs dotted and unknown stops as ? with GO kept; the CSS is there', () => {
    const rv = MP.slice(MP.indexOf('function _hqRecordVisit'), MP.indexOf('const _HQ_FN_LABELS'));
    assert.ok(/\/\^link_\/\.test\(doorId\)/.test(rv) && /window\.hqLinkSee\(p, doorId\.slice\(5\)\)/.test(rv) && /ROUTE CHARTED/.test(rv) && /PS\.saveProfile\(idx, p\)/.test(rv), 'one transaction: load → chart → save');
    assert.ok(/scheduleProgressSync/.test(rv), 'a server account pushes the blob');
    const wh = MP.slice(MP.indexOf('function _hqWorldHtml'), MP.indexOf('function _hqDispatchHtml'));
    assert.ok(/hqWorldRoutes\(_hqCurRoom, \{ profile \}\)/.test(wh) && /hq-world-unseen/.test(wh) && /' unk'/.test(wh) && /UNCHARTED/.test(wh) && /LEGS CHARTED/.test(wh), 'the marks are drawn');
    const unkRow = wh.slice(wh.indexOf("if (st.known === false)"), wh.indexOf("return; }", wh.indexOf("if (st.known === false)")));
    assert.ok(/\$\{go\}/.test(unkRow), 'GO stays on an uncharted stop (the user\'s convenience rule)');
    assert.ok(/\.hq-world-leg\.hq-world-unseen/.test(CSS) && /\.hq-world-stop\.unk \.hq-world-dot/.test(CSS) && /\.hq-row\.hq-world-unk/.test(CSS), 'the styles');
});

test('D7 quiet rooms + THE SUN: the attic and the airlock are the quiet parts; the bridge\'s viewport is the sun (catalogue wall proc with a glow and a light, a ticker in the builder), the false window gone from it', heavy, () => {
    const quiet = Object.keys(HQ.rooms).filter(k => HQ.rooms[k].quiet);
    assert.ok(quiet.includes('site_prebuilt_haunted_attic') && quiet.includes('site_prebuilt_derelict_airlock') && quiet.length === 2, 'the two smallest parts');
    const bridge = HQ.rooms.site_prebuilt_derelict_bridge;
    assert.ok(bridge.props.some(p => p.key === 'sun_viewport' && p.wall === 'n') && !bridge.props.some(p => p.key === 'false_window'), 'the viewport on the bow wall');
    const cat = HQ.catalogue.sun_viewport;
    assert.ok(cat && cat.proc === 'sun_viewport' && cat.wall && cat.glow && cat.light && cat.light.dist > 0, 'a lit wall proc');
    const proc = TR.slice(TR.indexOf('        sun_viewport: function (U)'), TR.indexOf('        /* THE WINDOW THAT SHOULD NOT EXIST'));
    assert.ok(proc.length > 200 && /_hq\.tickers\.push\(function \(dt, now\)/.test(proc) && /sun\.scale\.set/.test(proc) && /glare\.material\.opacity/.test(proc), 'the pass is a ticker: the disc swells, the glare rises');
});

test('ITEM 9 THE LIP: the snap rule turns a wall hit in the lip band under a board cell\'s top into a floor door on the top', heavy, () => {
    const R = D.HQ_PORTAL_RULES;
    assert.ok(R.ledgeSnapM > 0 && R.reasons.lip, 'the rule has a number and a word');
    /* the renderer's snap in a sandbox */
    const start = TR.indexOf('    function _hqPortalLedgeSnap('), end = TR.indexOf('\n    }', start);
    const ctx = vm.createContext({ blockers: [], _hq: { site: {} } });
    vm.runInContext(TR.slice(start, end + 6) + '\nfunction _hqBlockersUnder() { return blockers; }\nfunction _hqBlkTop(b) { return (b.top != null) ? b.top : 1e9; }\nthis.snap = _hqPortalLedgeSnap;', ctx);
    const R2 = { ledgeSnapM: 0.9 };
    const wall = { surf: 'wall', x: 0, y: 2.9, z: 0, nx: -1, nz: 0, dist: 3 };
    ctx.blockers = [{ site: true, top: 3.5, y: 0 }];
    const s1 = ctx.snap(wall, R2);
    assert.ok(s1 && s1.surf === 'floor' && s1.y === 3.5 && s1.lip && Math.abs(s1.x - 0.55) < 1e-9 && s1.nz === 0, 'a hit 0.6 m under the top lands on it, 0.55 m in');
    assert.equal(ctx.snap(Object.assign({}, wall, { y: 2.0 }), R2), null, 'too far under the lip: a wall door');
    ctx.blockers = [{ site: true, top: null, y: 0 }];
    assert.equal(ctx.snap(wall, R2), null, 'a wall / a monument (no top) never snaps');
    ctx.blockers = [{ site: false, top: 3.5, y: 0 }];
    assert.equal(ctx.snap(wall, R2), null, 'furniture is not the board');
    ctx.blockers = [{ site: true, top: 3.5, y: 0 }]; ctx._hq.site.cave = true;
    assert.equal(ctx.snap(wall, R2), null, 'a cave ledge is climbed, never snapped');
    ctx._hq.site.cave = false;
    assert.equal(ctx.snap(Object.assign({}, wall, { surf: 'ceiling' }), R2), null, 'only a wall hit');
    const aim = TR.slice(TR.indexOf('function _hqPortalAim'), TR.indexOf('function _hqPortalLedgeSnap'));
    assert.ok(/hit = _hqPortalLedgeSnap\(hit, R\) \|\| hit;/.test(aim) && /out\.lip = !!hit\.lip/.test(aim), 'the aim reads the snap');
    assert.ok(/aim\.lip \? \(R\.reasons\.lip/.test(TR), 'the ghost says THE LIP · ON TOP');
});
