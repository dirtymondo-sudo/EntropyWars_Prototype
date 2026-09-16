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
    assert.ok(/function _hqPortalAim\(slot\)/.test(TR) && /_hqSurface\(x, z, null, true\)/.test(TR.slice(TR.indexOf('function _hqPortalSurf'))), 'the aim reads the walkable surface set, for a named slot');
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
    assert.ok(/if \(!flat\) \{\s*\n\s*var fr = _hqRad\(spec\.face \|\| 0\)/.test(build), 'a FLAT threshold lays no blockers — you walk onto a hatch');
    assert.ok(/H\.blockers = H\.blockers\.filter\(function \(b\) \{ return b\.portal !== slot; \}\)/.test(TR), 'a dropped slot takes its blockers with it');
    assert.ok(/function _hqPortalHop\(slot, opts\)/.test(TR) && /_hqGoTo\('portal:' \+ slot, true\)/.test(TR) && /H\.enterDoorLatch = 'portal:' \+ slot/.test(TR), 'the hop lands out of the twin (a wall door in front of it, facing away), latched');
    assert.ok(/try \{ _hqBuildPortals\(room, opts\); \}/.test(TR), 'rebuilt on every entry');
    assert.ok(/_hqPortalTickAim\(\);/.test(TR.slice(TR.indexOf('function _hqTickWorld'))), 'the ghost follows the aim each frame');
    assert.ok(/portal: \{ drawn: false, ghost: null, aim: null, placed: \{\}, lastKey: '', hold: null, cross: null, issued:[^\n]*sight: null, fAt: 0, fFired: false \}/.test(TR), 'the record on _hq (the held mouth, the entry speed, the sight and the F hold ride it)');
    ['portalDraw: _hqPortalDraw', 'portalIssued:', 'portalDrawn:', 'portalAim:', 'portalPlace: _hqPortalPlaceAim', 'portalHop: _hqPortalHop', 'portalRemove: _hqPortalRemove', 'portalDoors:'].forEach(k => assert.ok(TR.indexOf(k) >= 0, 'API ' + k));
    assert.ok(/k === 'f'\) \{ e\.preventDefault\(\); if \(!e\.repeat && H\.portal && !H\.portal\.fAt\) \{ H\.portal\.fAt = performance\.now\(\)/.test(TR), 'F is stamped on the press (rev 3: a hold recalls)');
    assert.ok(/if \(k === 'f' && H\.portal && H\.portal\.fAt\) \{ var fired = H\.portal\.fFired; H\.portal\.fAt = 0; H\.portal\.fFired = false; if \(!fired && !H\.paused\) _hqPortalDraw\(!\(H\.portal && H\.portal\.drawn\)\)/.test(TR), 'a TAP draws / holsters on the release');
    assert.ok(/k === 'q' && H\.portal && H\.portal\.drawn\) \{ e\.preventDefault\(\); _hqPortalDraw\(false\)/.test(TR), 'Q holsters a drawn one before the bell');
    assert.ok(/if \(e\.button === 0\) _hqPortalPlaceAim\('a'\); else if \(e\.button === 2\) _hqPortalPlaceAim\('b'\);/.test(TR), 'TWO BUTTONS: left click places A, right click places B');
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

test('ANY SURFACE (rev 2): the rules name the three surfaces, two buttons and two colours; a row keeps its surface and an unstated one reads as a floor', () => {
    assert.equal(R.surfaces.join(','), 'floor,wall,ceiling');
    assert.ok(R.colors && R.colors.a && R.colors.b && R.colors.a !== R.colors.b, 'the pair is ALWAYS two colours');
    assert.ok(R.colorNames.a && R.colorNames.b && R.colorNames.a !== R.colorNames.b);
    assert.equal(R.buttons.a, 'LEFT CLICK'); assert.equal(R.buttons.b, 'RIGHT CLICK');
    const place = g('hqPortalPlace'), p = profile();
    const c = place(p, { room: 'foyer', x: 0, y: 2.7, z: 0, face: 0, surf: 'ceiling' });
    assert.equal(c.ok, true); assert.equal(c.spec.surf, 'ceiling');
    const w = place(p, { room: 'central_egress', x: 4, y: 1.4, z: 4, face: 90, surf: 'wall' });
    assert.equal(w.spec.surf, 'wall');
    const plain = place(p, { room: 'foyer', x: 9, y: 0, z: 9, face: 0 });
    assert.equal(plain.spec.surf, 'floor', 'no surface stated: the old placement was a floor hit');
    assert.equal(place(p, { room: 'foyer', x: 9, y: 0, z: 9, surf: 'sideways' }, { slot: 'a' }).spec.surf, 'floor', 'an unknown surface is a floor');
    const rec = g('hqPortalRecord')(p);
    assert.ok(rec.a && rec.b, 'both rows survive the round trip');
});

test('TWO BUTTONS + THE COLUMN: the caller names the slot, and a floor hatch under a ceiling hatch is legal (the gap is 3D)', () => {
    const place = g('hqPortalPlace'), status = g('hqPortalStatus');
    const p = profile();
    /* the right button files B first — the old order would have filed A */
    const b = place(p, { room: 'foyer', x: 0, y: 0, z: 0, face: 0, surf: 'floor', slot: 'b' });
    assert.equal(b.ok, true); assert.equal(b.slot, 'b');
    assert.equal(status(p).a, null); assert.ok(status(p).b);
    /* the same column, on the ceiling 2.7 m up: a fall that never lands, never a 'twin' refusal */
    const a = place(p, { room: 'foyer', x: 0, y: 2.7, z: 0, face: 0, surf: 'ceiling' }, { slot: 'a' });
    assert.equal(a.ok, true); assert.equal(a.slot, 'a');
    assert.equal(a.spec.x, 0); assert.equal(a.spec.y, 2.7);
    /* the same column, the same surface height: still too close */
    assert.equal(place(p, { room: 'foyer', x: 0.4, y: 2.9, z: 0.4, surf: 'ceiling' }, { slot: 'b' }).reason, 'twin');
    /* a named slot MOVES its own row rather than taking the other's turn */
    const a2 = place(p, { room: 'foyer', x: 6, y: 0, z: 6, surf: 'floor', slot: 'a' });
    assert.equal(a2.slot, 'a'); assert.equal(a2.moved, true);
    assert.equal(status(p).b.y, 0, 'B is untouched');
});

test('THE RENDERER rev 2: the ceiling and the wall are surfaces, the frame is laid on the normal, a flat threshold is crossed by touch and left along the twin\'s own normal', () => {
    assert.ok(/function _hqPortalCeil\(\)/.test(TR) && /room\.kind === 'box'\) return S\.open \? null :/.test(TR), 'the room\'s own ceiling plane (an open room has none)');
    assert.ok(/function _hqPortalSolidAt\(x, z, y\)/.test(TR) && /function _hqPortalWallHit\(prev, cur, dir, t\)/.test(TR), 'the wall hit is bisected against the solidness test');
    const wall = TR.slice(TR.indexOf('function _hqPortalWallHit'), TR.indexOf('function _hqPortalBasis'));
    assert.ok(/_hqPortalSolidAt\(lo\.x \+ e, lo\.z, lo\.y\)/.test(wall) && /_hqPortalSolidAt\(lo\.x, lo\.z \+ e, lo\.y\)/.test(wall), 'the normal comes off the gradient in x and z');
    const basis = TR.slice(TR.indexOf('function _hqPortalBasis'), TR.indexOf('function _hqPortalAim'));
    assert.ok(/surf === 'ceiling'\) \{ Z = new THREE\.Vector3\(0, -1, 0\)/.test(basis) && /surf === 'floor'\) \{ Z = new THREE\.Vector3\(0, 1, 0\)/.test(basis) && /makeBasis\(X, Y, Z\)/.test(basis), 'local +Z is the surface normal — flat on the floor, flat on the ceiling, in the wall');
    const aim = TR.slice(TR.indexOf('function _hqPortalAim'), TR.indexOf('function _hqPortalFits'));
    assert.ok(/surf: 'ceiling'/.test(aim) && /surf: 'floor'/.test(aim) && /_hqPortalWallHit\(prev/.test(aim), 'all three kinds come out of the march');
    assert.ok(/hit\.surf !== 'ceiling' && Math\.hypot\(hit\.x - pl\.x, hit\.z - pl\.z\) < R\.near/.test(aim), 'a ceiling overhead is never refused for being close — that is the trick');
    assert.ok(/Math\.hypot\(d\.px - hit\.x, \(d\.py \|\| 0\) - hit\.y, d\.pz - hit\.z\)/.test(aim), 'the twin gap is 3D');
    assert.ok(/if \(slot && d\.door\.portal === slot\) continue;/.test(aim), 'a threshold never blocks its own move');
    const build = TR.slice(TR.indexOf('function _hqPortalBuild'), TR.indexOf('function _hqBuildPortals'));
    assert.ok(/var flat = surf !== 'wall';/.test(build) && /grp\.quaternion\.copy\(B\.q\)/.test(build), 'the frame wears the surface basis');
    assert.ok(/portalSurf: surf, px: spec\.x, py: hitY, pz: spec\.z/.test(build), 'the record carries its surface and its own point');
    assert.ok(/blending: THREE\.AdditiveBlending[^)]*\}\);\s*\n\s*var pane/.test(build) || /var pane = new THREE\.Mesh\(new THREE\.PlaneGeometry\(ow \* U, oh \* U\), apMat\)/.test(build), 'the aperture is the slot\'s colour');
    assert.ok(/hq-plate-portal-' \+ slot/.test(build), 'the plate wears its slot');
    /* the crossing */
    assert.ok(/function _hqPortalInMouth\(rec, pl\)/.test(TR) && /function _hqTickPortalCross\(dt\)/.test(TR), 'the touch crossing');
    const mouth = TR.slice(TR.indexOf('function _hqPortalInMouth'), TR.indexOf('function _hqTickPortalCross'));
    assert.ok(/rec\.portalSurf === 'wall'\) return false/.test(mouth), 'a wall door is walked into, never touched through');
    assert.ok(/pl\.y <= rec\.py \+ 0\.4/.test(mouth) && /var head = pl\.y \+ \(pl\.heightM \|\| 1\.75\)/.test(mouth), 'the feet for a floor hatch, the head for a ceiling one');
    const cross = TR.slice(TR.indexOf('function _hqTickPortalCross'), TR.indexOf('function _hqPortalHop'));
    assert.ok(/H\.portal\.hold = \{ slot: s, at: performance\.now\(\) \}/.test(cross) && /H\.opts\.onPortalCross/.test(cross), 'the mouth is held and the crossing reported');
    const hop = TR.slice(TR.indexOf('function _hqPortalHop'), TR.indexOf('/* The story cast'));
    assert.ok(/surf === 'ceiling'/.test(hop) && /pl\.vy = -Math\.max\(2, Math\.min\(18, speed\)\)/.test(hop), 'out of a ceiling hatch you keep falling');
    assert.ok(/if \(speed > 4\) \{ pl\.y = rec\.py \+ 0\.06; pl\.air = true/.test(hop), 'out of a floor hatch you are thrown up when you came in fast');
    assert.ok(/H\.portal\.hold = \{ slot: slot, at: performance\.now\(\) \}/.test(hop), 'the mouth you came out of does not swallow you again');
    /* the sites that had to learn about a flat door */
    assert.ok(/var want = \(d\.portalSurf && d\.portalSurf !== 'wall'\) \? 1 :/.test(TR), 'a flat threshold stands open');
    assert.ok(/if \(rec\.portalSurf && rec\.portalSurf !== 'wall'\) \{ H\.enterDoorLatch = null; return; \}/.test(TR), 'the press-in leaves a flat threshold alone');
    assert.ok(/if \(d\.portalSurf && d\.portalSurf !== 'wall'\) continue;/.test(TR), 'the boom\'s doorway slab is a wall door\'s alone');
    assert.ok(/_hqTickPortalCross\(dt\);/.test(TR.slice(TR.indexOf('function _hqFrame'))), 'the crossing is ticked with the walker');
    assert.ok(/if \(_hq\.portal\) _hq\.portal\.hold = \{ slot: d\.portal, at: performance\.now\(\) \};/.test(TR), 'a room change through the pair lands held');
    assert.ok(/onPortalCross: function \(slot\)/.test(MP), 'map.js takes the crossing');
    assert.ok(/L-CLICK ▸ A ● · R-CLICK ▸ B ■/.test(IX), 'index.html: the two buttons (and the two shapes) in the hint');
    assert.ok(/\.hq-plate\.hq-plate-portal-a b/.test(CSS) && /\.hq-plate\.hq-plate-portal-b b/.test(CSS), 'the CSS: two colours');
});

/* ═══ rev 3 (2026-09-16, Phase 9 Delivery 3 — THE GUN READS + the user's model) ═══ */
const SP = fs.readFileSync(__dirname + '/sprites.js', 'utf8');
const VFX = fs.readFileSync(__dirname + '/three-vfx-effects.js', 'utf8');
const BT = fs.readFileSync(__dirname + '/battle.js', 'utf8');
const AU = fs.readFileSync(__dirname + '/audio.js', 'utf8');
const MI = fs.readFileSync(__dirname + '/MODEL_INDEX.md', 'utf8');

test('THE GUN (rev 3): the catalogue row is the user\'s GLB in the door-kit folder, the rules name the grip, the muzzle, the shot, the shapes, the words, the recall and the re-arm', () => {
    const cat = HQ.catalogue.door_gun;
    assert.ok(cat && /retro_gun/.test(cat.file) && cat.span > 0 && cat.gun === true, 'door_gun: the retro ray gun, sized by its span');
    assert.ok(fs.existsSync(__dirname + '/doors/' + cat.file), 'the file is in the repo\'s doors/ folder (the user uploaded it to R2 Assets/door/models/ too)');
    assert.ok(MI.includes(cat.file), 'MODEL_INDEX.md names it');
    assert.equal(R.gun.key, 'door_gun'); assert.equal(R.gun.bone, 'RightHand');
    assert.ok(Array.isArray(R.gun.pos) && R.gun.pos.length === 3 && Array.isArray(R.gun.rot) && R.gun.rot.length === 3 && Array.isArray(R.gun.muzzle) && R.gun.muzzle.length === 3, 'the grip and the muzzle are three numbers each');
    assert.ok(R.shot.msPerM > 0 && R.shot.minMs > 0 && R.shot.maxMs >= R.shot.minMs && R.shot.unfoldMs > 0 && R.shot.kick >= 0 && R.shot.kickMs > 0, 'the shot\'s timing');
    assert.equal(R.shapes.a, 'circle'); assert.equal(R.shapes.b, 'square');
    ['fluid', 'near', 'twin', 'door', 'room', 'wall', 'none'].forEach(k => assert.ok(typeof R.reasons[k] === 'string' && R.reasons[k].length, 'a word for ' + k));
    assert.ok(R.recallMs >= 400 && R.recallMs <= 1200, 'the recall hold is a deliberate hold, not a tap');
    assert.ok(R.rearmMs >= 200, 'a mouth re-arms no sooner than 200 ms (the hatch-loop cap)');
    assert.ok(R.exitNudgeM > 0 && R.exitNudgeM <= 1, 'D4: the exit nudge');
});

test('THE RENDERER rev 3: the gun in the hand while drawn, the laser sight, the reason label, the shot that unfolds, the A/B shapes, the re-arm, the recall, the exit nudge', () => {
    assert.ok(/function _hqGunAttach\(\)/.test(TR) && /_hqAttachHeld\(pl, \{ key: G\.key, bone: G\.bone \|\| 'RightHand'/.test(TR), 'the gun rides the same holder as the Janitor\'s mop');
    assert.ok(/function _hqGunShow\(on\)/.test(TR) && /_hqGunShow\(on\);/.test(TR.slice(TR.indexOf('function _hqPortalDraw'))), 'shown while drawn, hidden holstered');
    assert.ok(/function _hqGunMuzzle\(\)/.test(TR) && /G\.muzzle/.test(TR), 'the muzzle off the gun\'s own frame');
    assert.ok(/function _hqPortalSight\(\)/.test(TR) && /new THREE\.Line\(geo, mat\)/.test(TR.slice(TR.indexOf('function _hqPortalSight'), TR.indexOf('function _hqPortalSurf'))), 'THE LASER SIGHT is a line');
    const tick = TR.slice(TR.indexOf('function _hqPortalTickAim'), TR.indexOf('function _hqPortalDraw'));
    assert.ok(/_hqPortalTickHold\(\);/.test(tick) && /_hqPortalGhostLabel\(g, aim\)/.test(tick) && /pl\.targetYaw = Math\.atan2\(Math\.sin\(H\.cam\.yaw\), -Math\.cos\(H\.cam\.yaw\)\)/.test(tick), 'the hold is ticked, the label written, the officer squares up on the aim');
    assert.ok(/function _hqPortalGhostLabel\(g, aim\)/.test(TR) && /R\.reasons\[aim\.reason\]/.test(TR), 'D3a: the refusal reason is a WORD on the ghost');
    const place = TR.slice(TR.indexOf('function _hqPortalPlaceAim'), TR.indexOf('function _hqGunFire'));
    assert.ok(/_hqPortalBuild\(filed\.slot, row, \{ fresh: true, flight: from \? \{ from: from \} : null \}\)/.test(place) && /_hqGunFire\(from, filed\.slot\)/.test(place), 'the placement is a SHOT from the muzzle');
    const fire = TR.slice(TR.indexOf('function _hqGunFire'), TR.indexOf('function _hqPortalLeafKey'));
    assert.ok(/playDoorSfx\('doorGunShot'/.test(fire) && /_attackChainFor\('ranged'\)/.test(fire) && /H\.cam\.pitch \+= kick/.test(fire), 'the zap, the ranged gesture, the recoil kick');
    const build = TR.slice(TR.indexOf('function _hqPortalBuild'), TR.indexOf('function _hqPortalLandBeat'));
    assert.ok(/shape === 'square' \? 4 : 44/.test(build) && /rim\.rotation\.z = Math\.PI \/ 4/.test(build) && /new THREE\.SphereGeometry\(0\.055 \* U/.test(build), 'D3b: A a circle, B a square (the rim and the lamp caps)');
    assert.ok(/if \(opts\.fresh && opts\.flight && opts\.flight\.from\) _hqPortalFlight\(/.test(build), 'a fresh placement with a muzzle flies');
    const flight = TR.slice(TR.indexOf('function _hqPortalFlight'), TR.indexOf('function _hqBuildPortals'));
    assert.ok(/grp\.visible = false;/.test(flight) && /if \(!grp\.parent\) \{ done\(\); return; \}/.test(flight) && /ease-out-back/.test(flight) && /_hqPortalLandBeat\(B, spec, hitY, slot, U\)/.test(flight), 'the frame is hidden in flight, dies with its slot, unfolds with an ease-out-back, and the landing beat runs under it');
    const land = TR.slice(TR.indexOf('function _hqPortalLandBeat'), TR.indexOf('function _hqPortalFlight'));
    assert.ok(/playDoorSfx\('doorGunLand'/.test(land) && /new THREE\.PointLight\(slotHex/.test(land) && /shock\.quaternion\.copy\(B\.q\)/.test(land), 'the landing: the sound, a breath of light, the shock ring in the surface\'s plane');
    const cross = TR.slice(TR.indexOf('function _hqTickPortalCross'), TR.indexOf('function _hqPortalHop'));
    assert.ok(/rec\.lastCrossAt && performance\.now\(\) - rec\.lastCrossAt < rearm\) continue;/.test(cross) && /rec\.lastCrossAt = performance\.now\(\);/.test(cross), 'D3c: a mouth re-arms only after rearmMs');
    const hop = TR.slice(TR.indexOf('function _hqPortalHop'), TR.indexOf('function _hqPortalTickHold'));
    assert.ok(/for \(var nd = 0; nd <= nudge \+ 1e-6; nd \+= 0\.15\)/.test(hop) && /_hqAirClearOfBlockers\(pl\.x, pl\.z, fy\)/.test(hop), 'D4: the exit is nudged clear along the twin\'s normal');
    assert.ok(/function _hqPortalTickHold\(\)/.test(TR) && /function _hqPortalRecall\(\)/.test(TR), 'the hold and the recall');
    const recall = TR.slice(TR.indexOf('function _hqPortalRecall'), TR.indexOf('/* The story cast'));
    assert.ok(/_hqPortalRemove\(slot, \{ keep: true \}\)/.test(recall) && /playDoorSfx\('doorGunRecall'/.test(recall) && /H\.opts\.onPortal\(\{ kind: 'recall', n: n \}\)/.test(recall), 'the record goes at once, the picture flies home, map.js is told');
    assert.ok(/portalRecall: _hqPortalRecall/.test(TR) && /gunMuzzle: _hqGunMuzzle/.test(TR), 'the API');
    /* the hold's own arithmetic, in a vm sandbox: a tap never recalls, a hold does, a hold with nothing placed leaves the release its toggle */
    const src = TR.slice(TR.indexOf('function _hqPortalTickHold'), TR.indexOf('function _hqPortalRecall'));
    const ctx = vm.createContext({ performance: { now: () => 1000 }, _hqPortalRules: () => ({ recallMs: 600 }), recalled: 0 });
    vm.runInContext(src + '\nfunction _hqPortalRecall() { recalled++; }\nthis.tick = _hqPortalTickHold;', ctx);
    ctx._hq = { portal: { fAt: 700, fFired: false, placed: { a: {} } } }; ctx.tick(); assert.equal(ctx.recalled, 0, 'a 300 ms press is a tap'); assert.equal(ctx._hq.portal.fFired, false);
    ctx._hq = { portal: { fAt: 300, fFired: false, placed: {} } }; ctx.tick(); assert.equal(ctx.recalled, 0, 'nothing placed: nothing to recall'); assert.equal(ctx._hq.portal.fFired, false, 'the release still toggles the draw');
    ctx._hq = { portal: { fAt: 300, fFired: false, placed: { b: {} } } }; ctx.tick(); assert.equal(ctx.recalled, 1, 'a 700 ms hold recalls'); assert.equal(ctx._hq.portal.fFired, true, 'once');
    ctx.tick(); assert.equal(ctx.recalled, 1, 'and never again while held');
});

test('THE BOARD rev 3: every Door Agent carries the gun, the placements are SHOTS from it (relayed geometry), the three cues are in the kit, map.js files the recall', () => {
    assert.ok(/const _DOOR_AGENT_HOLD = \{ key: 'door_gun', bone: 'RightHand'/.test(SP) && /basicAttackKind: 'punch', hold: _DOOR_AGENT_HOLD/.test(SP), 'sprites.js: both genders hold it');
    assert.ok(/function _unitAttachHeld\(m, hold, ts\)/.test(TR) && /if \(def\.hold\) \{ try \{ _unitAttachHeld\(m, def\.hold, ts\);/.test(TR) && /HQ_PORTAL_RULES\.gun : null; if \(G && G\.key === hold\.key\) hold = Object\.assign\(\{\}, hold, G\)/.test(TR), 'the battle rig parents it to the hand bone; the grip is data.js\'s');
    assert.ok(/n\._ew_noTwin = true/.test(TR.slice(TR.indexOf('function _unitAttachHeld'), TR.indexOf('function _disposeModelRig'))), 'never twinned by the x-ray pass');
    assert.ok(/function _sigDoorGunShot3D\(tx, ty, o\)/.test(VFX) && /'raceDoorGun:shot':/.test(VFX) && /_sigRunOwned\(g, total/.test(VFX.slice(VFX.indexOf('function _sigDoorGunShot3D'), VFX.indexOf('function _sigDoorKnock3D'))), 'the shot recipe owns its group');
    const shots = (BT.match(/window\._doorGeom\('raceDoorGun:shot'/g) || []).length;
    assert.ok(shots >= 5, 'battle.js shoots before Knock Knock (×2), the way in, EXIT and the trapdoor — ' + shots);
    ['doorGunShot', 'doorGunLand', 'doorGunRecall'].forEach(k => assert.ok(new RegExp(k + '\\(ctx, t, out, vol\\)').test(AU) && new RegExp(k + ': 0\\.').test(AU), 'audio.js recipe + gain ' + k));
    assert.ok(/ev\.kind === 'recall'/.test(MP) && /window\.hqPortalClear\(p\)\) PS\.saveProfile\(idx, p\)/.test(MP), 'map.js clears the pair on the recall in one transaction');
    assert.ok(/HOLD F recall/.test(IX), 'the hint says so');
});
