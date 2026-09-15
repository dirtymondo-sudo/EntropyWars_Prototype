// hq-portal.test.js — THE DOOR GUN · THE PORTABLE THRESHOLD (HQ plan 9.5 —
// 2026-09-15 rev 13): two freestanding DOOR-issue doors the officer places on
// any walkable surface they can see; walk into one, step out of the other.
// Guards: the rules (a cost, the door rank, a reach, the gaps), the record
// (round-trips, malformed rows refused, the slots in Portal's order — empty
// first, then the OLDER moves), the issue (KEYHOLDER + the Keys, spent from
// the issued ledger, once), a placement (needs the issue, a real room, finite
// numbers, a gap from its twin; the leaf a site room's own threshold door,
// never a rank leaf, coffee everywhere else), the clear (a fresh arrival:
// the pair goes, the issue stays), the safe-room rule (the facility is safe
// by construction), and the source sites: the renderer's aim / ghost / build
// / hop / API and the free box-wall record; map.js's filer (one transaction),
// the step, the issue on the Quartermaster's panel, the fresh-arrival clear,
// the pill; index.html's pill + hint; the CSS. Repo-only tooling; `npm test`.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { loadGameData } = require('./load-data');
const D = loadGameData(), HQ = D.DOOR_HQ, R = D.HQ_PORTAL_RULES;
const g = name => vm.runInContext(name, D);
const TR = fs.readFileSync(__dirname + '/three-renderer.js', 'utf8');
const MP = fs.readFileSync(__dirname + '/map.js', 'utf8');
const IX = fs.readFileSync(__dirname + '/index.html', 'utf8');
const CSS = fs.readFileSync(__dirname + '/styles-base.css', 'utf8');
const profile = (o) => Object.assign({ username: 'TEST', account: { gold: 0, unlockedUnits: [], freeTokens: 0 }, door: { clearance: 2, hq: { keys: 30 } } }, o || {});

test('THE RULES: STANDARD ISSUE for the test (free, no cost, no rank), a reach, the two gaps, the plain leaf, two slots', () => {
    assert.equal(R.free, true, 'the user\'s call 2026-09-15: every officer holds it');
    assert.equal(R.cost, 0); assert.equal(R.rank, 1);
    assert.ok(R.reach >= 8 && R.reach <= 30, 'a reach you can see across a room');
    assert.ok(R.minGap >= 1.2 && R.minFromWalker >= 1 && R.footprint >= 0.5);
    assert.equal(R.leaf, 'leaf_coffee'); assert.ok(HQ.catalogue.leaf_coffee && HQ.catalogue.leaf_coffee.file);
    assert.equal(R.slots.join(','), 'a,b'); assert.ok(R.labels.a && R.labels.b);
});

test('THE RECORD: empty by default, a malformed row is refused, Portal\'s order — an empty slot first, then the older of the two moves', () => {
    const rec0 = g('hqPortalRecord')(profile());
    assert.deepEqual([rec0.issued, rec0.a, rec0.b, rec0.last], [false, null, null, null]);
    const bad = g('hqPortalRecord')(profile({ door: { hq: { portal: { issued: 1, a: { room: 'foyer', x: 'nope', z: 0, y: 0 }, b: { room: 42, x: 0, z: 0, y: 0 }, last: 'zz' } } } }));
    assert.equal(bad.issued, true); assert.equal(bad.a, null); assert.equal(bad.b, null); assert.equal(bad.last, null);
    const next = g('hqPortalNextSlot');
    assert.equal(next({}), 'a');
    assert.equal(next({ a: { room: 'foyer' } }), 'b');
    assert.equal(next({ b: { room: 'foyer' } }), 'a');
    assert.equal(next({ a: {}, b: {}, last: 'a' }), 'b', 'both placed, A was the last → B is the older, B moves');
    assert.equal(next({ a: {}, b: {}, last: 'b' }), 'a');
    assert.equal(g('hqPortalTwin')('a'), 'b'); assert.equal(g('hqPortalTwin')('b'), 'a');
});

test('THE ISSUE: standard issue — every officer holds it (free), so the signature path is idle; the rank / Keys refusals come back when `free` is off', () => {
    const status = g('hqPortalStatus'), issue = g('hqPortalIssue');
    const low = profile({ door: { clearance: 1, hq: { keys: 0 } } });
    assert.equal(status(low).issued, true, 'a DOORMAT with no Keys holds it');
    assert.equal(status(low).free, true); assert.equal(status(low).canIssue, false);
    assert.equal(issue(low).reason, 'issued', 'nothing to sign for');
    const p = profile();
    assert.equal(status(p).issued, true); assert.equal(status(p).keys, 30, 'no Keys spent'); assert.equal(status(p).next, 'a');
    /* the signature path, with the switch off */
    const R2 = D.HQ_PORTAL_RULES; const save = { free: R2.free, cost: R2.cost, rank: R2.rank };
    try {
        R2.free = false; R2.cost = 24; R2.rank = 2;
        const l2 = profile({ door: { clearance: 1, hq: { keys: 99 } } });
        assert.equal(status(l2).canIssue, false); assert.equal(status(l2).reason, 'rank'); assert.equal(issue(l2).reason, 'rank');
        const poor = profile({ door: { clearance: 3, hq: { keys: 5 } } });
        assert.equal(status(poor).reason, 'keys'); assert.equal(issue(poor).ok, false);
        const q = profile();
        assert.equal(status(q).issued, false); assert.equal(status(q).canIssue, true);
        const r = issue(q);
        assert.equal(r.ok, true); assert.equal(r.cost, 24); assert.equal(r.keys, 6);
        assert.equal(D.hqKeys(q).keys, 6, 'spent from the issued ledger (door.hq.keys), the recovered count untouched');
        assert.equal(q.door.hq.portal.issued, true);
        assert.equal(issue(q).reason, 'issued', 'once');
        const forced = status(profile({ door: { clearance: 1, hq: {} } }), { force: true });
        assert.equal(forced.issued, true); assert.equal(forced.forced, true);
    } finally { Object.assign(R2, save); }
});

test('A PLACEMENT: needs the issue, a real room, finite numbers, a gap from its twin; A, then B, then A moves; the twin rides back; the leaf is the room\'s', () => {
    const place = g('hqPortalPlace'), status = g('hqPortalStatus');
    const p = profile();
    { const R2 = D.HQ_PORTAL_RULES, was = R2.free; R2.free = false;
      try { assert.equal(place(p, { room: 'foyer', x: 0, y: 0, z: 0, face: 0 }).reason, 'unissued', 'with the switch off, an unsigned officer places nothing'); } finally { R2.free = was; } }
    g('hqPortalIssue')(p);
    assert.equal(place(p, { room: 'no_such_room', x: 0, y: 0, z: 0 }).reason, 'room');
    assert.equal(place(p, { room: 'foyer', x: NaN, y: 0, z: 0 }).reason, 'spec');
    assert.equal(place(p, { room: 'foyer', x: '1', y: 0, z: 0 }).reason, 'spec');
    const a = place(p, { room: 'foyer', x: 1.234, y: 0, z: -2, face: 450 });
    assert.equal(a.ok, true); assert.equal(a.slot, 'a'); assert.equal(a.paired, false); assert.equal(a.moved, false);
    assert.equal(a.spec.x, 1.23); assert.equal(a.spec.face, 90, 'the heading normalised'); assert.equal(a.spec.leaf, 'leaf_coffee'); assert.equal(a.spec.room, 'foyer');
    assert.equal(place(p, { room: 'foyer', x: 1.5, y: 0, z: -2.5, face: 0 }).reason, 'twin', 'too close to A in the same room');
    const b = place(p, { room: 'site_prebuilt_haunted_attic', x: 0, y: 0, z: 1, face: 180 });
    assert.equal(b.slot, 'b'); assert.equal(b.paired, true); assert.equal(b.twin.room, 'foyer');
    assert.equal(b.spec.leaf, g('hqPortalLeaf')('site_prebuilt_haunted_attic'), 'a complex part wears its site\'s threshold leaf');
    assert.equal(status(p).paired, true); assert.equal(status(p).next, 'a', 'B was the last: A is the older');
    const a2 = place(p, { room: 'central_egress', x: 5, y: 0, z: 5, face: 0 });
    assert.equal(a2.slot, 'a'); assert.equal(a2.moved, true); assert.equal(a2.twin.room, 'site_prebuilt_haunted_attic');
    assert.equal(status(p).a.room, 'central_egress'); assert.equal(status(p).b.room, 'site_prebuilt_haunted_attic');
    const doors = g('hqPortalDoorsIn');
    assert.equal(doors(p, 'central_egress').map(d => d.slot).join(','), 'a');
    assert.equal(doors(p, 'foyer').length, 0);
    /* the forced dev issue files the issue it implies, so the record reads whole */
    const q = profile({ door: { clearance: 1, hq: {} } });
    assert.equal(place(q, { room: 'foyer', x: 0, y: 0, z: 0 }, { force: true }).ok, true);
    assert.equal(q.door.hq.portal.issued, true);
});

test('THE LEAF: a site room\'s own threshold door when it swings, coffee everywhere else — never a rank leaf', () => {
    const leaf = g('hqPortalLeaf');
    const rankLeaves = Object.keys(HQ.catalogue).filter(k => HQ.catalogue[k].rank);
    assert.ok(rankLeaves.length >= 5, 'the rank ladder exists');
    Object.keys(HQ.rooms).forEach(id => {
        const k = leaf(id);
        assert.ok(k && HQ.catalogue[k] && HQ.catalogue[k].file, id + ': a catalogued leaf');
        assert.ok(rankLeaves.indexOf(k) < 0, id + ': never a rank leaf (' + k + ')');
        assert.equal(HQ.catalogue[k].open, 'swing', id + ': a leaf that swings (the placed door opens for the walker)');
        if (!HQ.rooms[id].site) assert.equal(k, 'leaf_coffee', id + ': the facility wears the plain issue');
    });
    const siteLeaves = Object.keys(HQ.rooms).filter(id => HQ.rooms[id].site).map(id => leaf(id));
    assert.ok(siteLeaves.some(k => k !== 'leaf_coffee'), 'at least one site room wears its own threshold leaf');
});

test('THE CLEAR: a fresh arrival drops the pair and keeps the issue; the safe-room rule is the site rule', () => {
    const p = profile();
    g('hqPortalIssue')(p);
    g('hqPortalPlace')(p, { room: 'foyer', x: 0, y: 0, z: 0 });
    g('hqPortalPlace')(p, { room: 'central_egress', x: 0, y: 0, z: 0 });
    assert.equal(g('hqPortalClear')(p), true);
    const st = g('hqPortalStatus')(p);
    assert.equal(st.issued, true); assert.equal(st.a, null); assert.equal(st.b, null); assert.equal(st.next, 'a');
    assert.equal(g('hqPortalClear')(p), false, 'nothing left to clear');
    assert.equal(g('hqPortalClear')(profile()), false);
    const safe = g('hqPortalSafeRoom');
    ['foyer', 'central_egress', 'medwing', 'garage', 'car'].forEach(id => { if (HQ.rooms[id]) assert.equal(safe(id), true, id + ' is the facility'); });
    ['site_prebuilt_dumb', 'site_prebuilt_haunted_cellar', 'site_prebuilt_hollow_earth_gallery'].forEach(id => { assert.ok(HQ.rooms[id], id); assert.equal(safe(id), false, id + ' is wild'); });
});

test('THE RENDERER: the aim against the surface set, the ghost, the placed door as a free box-wall record, the blockers, the hop, the rebuild on entry, the API and the keys', () => {
    assert.ok(/function _hqPortalAim\(\)/.test(TR) && /_hqSurface\(x, z, null, true\)/.test(TR.slice(TR.indexOf('function _hqPortalSurf'))), 'the aim reads the walkable surface set');
    const aim = TR.slice(TR.indexOf('function _hqPortalAim'), TR.indexOf('function _hqPortalGhost'));
    assert.ok(/getWorldDirection/.test(aim) && /_hqAirClearOfBlockers/.test(aim) && /_hqBlockerFloor/.test(TR.slice(TR.indexOf('function _hqPortalSurf'), TR.indexOf('function _hqPortalAim'))), 'the eye\'s ray, stopped by a blocker\'s side, landing on a top');
    ['fluid', 'near', 'twin', 'door', 'room'].forEach(r => assert.ok(aim.indexOf("out.reason = '" + r + "'") >= 0, 'refusal ' + r));
    assert.ok(/sc && sc\.fluid/.test(aim), 'a fluid cell is refused');
    const build = TR.slice(TR.indexOf('function _hqPortalBuild'), TR.indexOf('function _hqBuildPortals'));
    assert.ok(/_hqBoxWall\(room, 'free', \{ x: spec\.x, z: spec\.z, face: spec\.face \}\)/.test(build), 'a FREE box-wall record — the scan, the press-in, the landing and the doorway blocker read it unchanged');
    assert.ok(/portal: slot, verb: 'STEP THROUGH', action: \{ portal: slot \}/.test(build), 'the door row names its slot and verb');
    assert.ok(/H\.doors\.push\(rec\)/.test(build) && /H\.portal\.placed\[slot\] = rec/.test(build));
    assert.ok(/mode: 'swing'/.test(build) && /_miscModelInstance\(_hqModelUrl\(cat\)/.test(build), 'the catalogue leaf on a swing pivot');
    assert.ok(/H\.blockers\.push\(\{ obj: d, rad: 0\.24, y: y0, top: y0 \+ oh, portal: slot \}\)/.test(build), 'the shut door is a wall from behind');
    assert.ok(/H\.blockers = H\.blockers\.filter\(function \(b\) \{ return b\.portal !== slot; \}\)/.test(TR), 'a dropped slot takes its blockers with it');
    assert.ok(/function _hqPortalHop\(slot\)/.test(TR) && /_hqGoTo\('portal:' \+ slot, true\)/.test(TR) && /H\.enterDoorLatch = 'portal:' \+ slot/.test(TR), 'the hop lands in front of the twin facing away, latched');
    assert.ok(/try \{ _hqBuildPortals\(room, opts\); \}/.test(TR), 'rebuilt on every entry');
    assert.ok(/_hqPortalTickAim\(\);/.test(TR.slice(TR.indexOf('function _hqTickWorld'))), 'the ghost follows the aim each frame');
    assert.ok(/portal: \{ drawn: false, ghost: null, aim: null, placed: \{\}, lastKey: '', issued:/.test(TR), 'the record on _hq');
    ['portalDraw: _hqPortalDraw', 'portalIssued:', 'portalDrawn:', 'portalAim:', 'portalPlace: _hqPortalPlaceAim', 'portalHop: _hqPortalHop', 'portalRemove: _hqPortalRemove', 'portalDoors:'].forEach(k => assert.ok(TR.indexOf(k) >= 0, 'API ' + k));
    assert.ok(/k === 'f'\) \{ e\.preventDefault\(\); _hqPortalDraw\(!\(H\.portal && H\.portal\.drawn\)\)/.test(TR), 'F draws / holsters');
    assert.ok(/k === 'q' && H\.portal && H\.portal\.drawn\) \{ e\.preventDefault\(\); _hqPortalDraw\(false\)/.test(TR), 'Q holsters a drawn one before the bell');
    assert.ok(/if \(e\.button === 2\) _hqPortalDraw\(false\); else if \(e\.button === 0\) _hqPortalPlaceAim\(\);/.test(TR), 'left click places, right click holsters');
    assert.ok(/k === 'v' \|\| k === 'f' \|\| k === 'q'/.test(TR), 'F is a walker key');
});

test('MAP.JS: the filer is one transaction, the step goes out of the twin (a hop here, a room change there), the issue is the Quartermaster\'s, a fresh arrival clears the pair, the pill, the prompt', () => {
    const filer = MP.slice(MP.indexOf('function _hqPortalPlaced'), MP.indexOf('const _HQ_PORTAL_REFUSALS'));
    assert.ok(/PS\.loadProfile\(idx\)/.test(filer) && /window\.hqPortalPlace\(p, spec/.test(filer) && /PS\.saveProfile\(idx, p\)/.test(filer), 'load → place → save');
    assert.equal((filer.match(/saveProfile/g) || []).length, 1, 'one save');
    const step = MP.slice(MP.indexOf('window._hqPortalStep = function'), MP.indexOf('window._hqPortalIssue = function'));
    assert.ok(/ThreeRenderer\.hq\.portalHop\(twinSlot\)/.test(step) && /window\._hqGoRoom\(twin\.room, 'portal:' \+ twinSlot\)/.test(step), 'a hop in this room, a room change to another');
    assert.ok(/twin\.room === _hqCurRoom/.test(step));
    assert.ok(/t\.door\.portal\) \{ window\._hqPortalStep\(t\.door\.portal\); return; \}/.test(MP), 'E and the press-in both step through');
    assert.equal((MP.match(/window\._hqPortalStep\(t\.door\.portal\)/g) || []).length, 2, 'E and the walk-in');
    assert.ok(/_hqPortalOpts\(opts, profile\) : null/.test(MP) && /onPortalPlace: \(typeof _hqPortalPlaced === 'function'\) \? _hqPortalPlaced : null/.test(MP) && /onPortal: \(typeof _hqPortalEvent === 'function'\) \? _hqPortalEvent : null/.test(MP), 'the record and the callbacks ride enter (guarded: the lifecycle harness evals _hqEnter alone)');
    assert.ok(/const fresh = opts && opts\.from === 'play';/.test(MP), 'a fresh arrival hands the renderer no stale pair');
    assert.ok(/p\.door\.hq\.visits = \(p\.door\.hq\.visits \|\| 0\) \+ 1;[\s\S]{0,400}window\.hqPortalClear\(p\)/.test(MP), 'the fresh arrival (the visit count) clears the record');
    assert.ok(/d\.id === 'quartermaster'/.test(MP) && /data-portal-issue="1"/.test(MP) && /window\._hqPortalIssue\(\)/.test(MP), 'the Quartermaster\'s panel issues it');
    const issue = MP.slice(MP.indexOf('window._hqPortalIssue = function'), MP.indexOf('window._hqTakeFind = function'));
    assert.ok(/window\.hqPortalIssue\(p\)/.test(issue) && /PS\.saveProfile\(idx, p\)/.test(issue) && /portalIssued\(true\)/.test(issue), 'the issue is filed once and the walker learns it in place');
    assert.ok(/_hqEl\('hqPortal'\)/.test(MP) && /window\._hqPortalDraw = function/.test(MP), 'the pill draws');
    assert.ok(/t\.door\.portal\) \? 'STEP THROUGH'/.test(MP), 'the prompt\'s verb');
    assert.ok(/\[\?&\]portal\\b/.test(MP) && /window\.EW_HQ_PORTAL/.test(MP), 'the dev force');
    assert.ok(/row\('THE THRESHOLD'/.test(MP), 'the officer sheet');
    assert.ok(/id="hqPortal" class="hq-strip-stat hq-strip-portal"/.test(IX) && /hq-hint-portal/.test(IX), 'index.html: the pill and the hint');
    assert.ok(/\.hq-strip-stat\.hq-strip-portal\.drawn/.test(CSS) && /\.hq-hints\.portal \.hq-hint-portal/.test(CSS), 'the CSS');
});
