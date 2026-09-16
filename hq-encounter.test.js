// hq-encounter.test.js — THE ENCOUNTER (HQ plan 9.4 stage 1 — 2026-09-15
// rev 16): the room becomes the board, and ONLY when the officer starts it
// (the user's rule: no random encounters). With THE DOOR GUN DRAWN, 1 throws
// the walker's attack animation and 2 · 3 · 4 a cast; the native the gesture
// lands on (in reach, in the aim cone, in line of sight) is the fight — the
// site's Δ, the sticky config, THE LAST ROSTER, the CPU pool led by the
// native's race. Guards: the rules, the wild-room test (the facility is safe
// by construction), who may be engaged, the gestures, the sticky config
// (sanitised; Clash / Gauntlet fall back), the launch (pure; serialises),
// the record (win / loss / last), and the source sites on both sides of the
// cut (renderer keys · aim · LOS · one-shot · API; map.js's launch, the
// builder-less seat inside _msConfirm, the ward on a loss, the prompt;
// battle.js's per-launch intro gate + the commit; the hint). Repo-only.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { loadGameData } = require('./load-data');
const D = loadGameData(), HQ = D.DOOR_HQ, R = D.HQ_ENCOUNTER_RULES;
const g = name => vm.runInContext(name, D);
const J = o => JSON.parse(JSON.stringify(o));   // a vm-realm object never deepStrictEquals (CLAUDE.md's note)
const TR = fs.readFileSync(__dirname + '/three-renderer.js', 'utf8');
const MP = fs.readFileSync(__dirname + '/map.js', 'utf8');
const BT = fs.readFileSync(__dirname + '/battle.js', 'utf8');
const IX = fs.readFileSync(__dirname + '/index.html', 'utf8');
const profile = (o) => Object.assign({ username: 'TEST', account: { gold: 0, unlockedUnits: [] }, door: { clearance: 1, hq: {} } }, o || {});
const native = (o) => Object.assign({ kind: 'npc', id: 'hq-native-0', race: 'grey', gender: 'male', x: 1.5, z: -2, y: 0, label: 'Grey' }, o || {});

test('THE RULES: a reach you can throw across, a cone, the CLICK with the gun HOLSTERED (rev 17 — no number keys, the gun drawn places doors), Arena · 4 as the fallback', () => {
    assert.ok(R.reach >= 2 && R.reach <= 6, 'arm\'s reach plus a step, never across the room');
    assert.ok(R.cone >= 30 && R.cone <= 90);
    assert.equal(R.gun, undefined, 'no gun gate any more: holstered = the attack, drawn = the door gun');
    assert.equal(R.trigger, 'click'); assert.equal(R.gesture, 'attack');
    assert.equal(R.keys, undefined, 'the 1–4 keys are gone (the user)');
    assert.ok(R.cooldownMs >= 600);
    assert.ok(R.labels.attack, 'a label for the attack');
    assert.equal(R.gm, 'arena'); assert.equal(R.teamSize, 4);
});

test('WHERE: only a WILD room — a site\'s board room and its complex parts; never the facility (safe by construction, no flag to forget)', () => {
    const ok = g('hqEncounterRoomOk');
    assert.equal(ok('site_prebuilt_dumb'), true);
    assert.equal(ok('site_prebuilt_haunted_attic'), true, 'a complex part is the site\'s');
    assert.equal(ok('site_prebuilt_hollow_earth_gallery'), true, 'the cave is Hollow Earth\'s');
    ['central_egress', 'foyer', 'ring_g', 'ring_m', 'cafeteria', 'medical', 'hwing_w', 'garage', 'car', 'executive', 'nope'].forEach(id => assert.equal(ok(id), false, id + ' is safe'));
    /* every room with a site is wild, every room without is safe — the one test shared with the door gun's safe-room rule */
    Object.keys(HQ.rooms).forEach(id => assert.equal(ok(id), !g('hqPortalSafeRoom')(id), id));
});

test('WHO: a native (a roster vessel standing in the room) — never the cast, an agent, the online shift, the officer\'s clone, the walker', () => {
    const ok = g('hqEncounterCharOk');
    assert.equal(ok(native()), true);
    assert.equal(ok(native({ id: 'hq-npc-2', race: 'vampire' })), true, 'the roster draw is a native too');
    assert.equal(ok(native({ kind: 'player' })), false);
    assert.equal(ok(native({ kind: 'agent', race: 'men in black' })), false);
    assert.equal(ok(native({ cast: 'rhonda' })), false);
    assert.equal(ok(native({ id: 'hq-online-0', race: 'men in black' })), false);
    assert.equal(ok(native({ id: 'hq-clone-0', race: 'vampire' })), false);
    assert.equal(ok(native({ race: 'not a race' })), false);
    assert.equal(ok(native({ race: '' })), false);
    assert.equal(ok(null), false);
});

test('THE GESTURE: the click = the attack, the old number keys nothing', () => {
    const gs = g('hqEncounterGesture');
    assert.equal(gs('click'), 'attack'); assert.equal(gs(), 'attack'); assert.equal(gs(null), 'attack');
    ['1', '2', '3', '4', 'e', ''].forEach(k => assert.equal(gs(k), null, k));
});

test('THE STICKY CONFIG: JSON or an object, sanitised — a bad mode / Clash / Gauntlet fall back to Arena, the team size clamps 1..8, rounds ≥ 0', () => {
    const cfg = g('hqEncounterConfig');
    assert.deepEqual(J(cfg(null)), { gm: 'arena', teamSize: 4, rounds: 0 });
    assert.deepEqual(J(cfg('not json')), { gm: 'arena', teamSize: 4, rounds: 0 });
    assert.deepEqual(J(cfg({ gm: 'clash', teamSize: 3, rounds: 12 })), { gm: 'arena', teamSize: 3, rounds: 12 });
    assert.deepEqual(J(cfg({ gm: 'gauntlet' })), { gm: 'arena', teamSize: 4, rounds: 0 });
    assert.equal(cfg({ teamSize: 40 }).teamSize, 8); assert.equal(cfg({ teamSize: 0 }).teamSize, 1); assert.equal(cfg({ teamSize: 'x' }).teamSize, 4);
    assert.equal(cfg({ rounds: -3 }).rounds, 0);
    assert.equal(cfg({ gm: 'tdm' }).gm, 'tdm', 'a field mode holds without state.js loaded');
    assert.equal(cfg({ gm: 'nope' }).gm, 'arena');
});

test('THE LAUNCH: pure and serialisable — the site\'s Δ, the config, the CPU pool led by the native\'s race, the console as the way back, the native on the record; refused off a wild room or for a non-native', () => {
    const L = g('hqEncounterLaunch')('site_prebuilt_dumb', native(), '{"gm":"arena","teamSize":3}', { gesture: 'magic' });
    assert.ok(L);
    assert.equal(L.site, 'prebuilt_dumb'); assert.equal(L.delta, true); assert.equal(L.gm, 'arena'); assert.equal(L.teamSize, 3);
    assert.equal(L.roster[0], 'grey', 'the native leads the pool');
    assert.equal(L.roster.length, 3); assert.equal(new Set(L.roster).size, 3);
    assert.equal(L.doorId, 'crossing'); assert.equal(L.counterId, 'crossing');
    assert.equal(L.encounter.race, 'grey'); assert.equal(L.encounter.room, 'site_prebuilt_dumb'); assert.equal(L.encounter.gesture, 'magic');
    assert.equal(JSON.parse(JSON.stringify(L)).encounter.x, 1.5);
    assert.equal(g('hqEncounterLaunch')('central_egress', native(), null), null, 'the hall is safe');
    assert.equal(g('hqEncounterLaunch')('site_prebuilt_dumb', native({ cast: 'x' }), null), null);
    /* a complex part launches ITS site's board */
    const L2 = g('hqEncounterLaunch')('site_prebuilt_haunted_cellar', native({ race: 'ghost' }), null);
    assert.equal(L2.site, 'prebuilt_haunted'); assert.equal(L2.roster[0], 'ghost');
});

test('THE RECORD: door.hq.encounters — count / wins / losses / last, on the profile object handed in (the caller saves); the read never null', () => {
    const p = profile();
    assert.deepEqual(J(g('hqEncounterLog')(p)), { count: 0, wins: 0, losses: 0, last: null });
    g('hqEncounterRecord')(p, { site: 'prebuilt_dumb', room: 'site_prebuilt_dumb', race: 'grey', won: true, date: '2026-09-15' });
    g('hqEncounterRecord')(p, { site: 'prebuilt_hell', room: 'site_prebuilt_hell', race: 'demon', won: false, date: '2026-09-15' });
    const l = g('hqEncounterLog')(p);
    assert.equal(l.count, 2); assert.equal(l.wins, 1); assert.equal(l.losses, 1);
    assert.equal(l.last.race, 'demon'); assert.equal(l.last.won, false); assert.equal(l.last.date, '2026-09-15');
    assert.equal(g('hqEncounterRecord')(null, {}), null);
    const p2 = { door: null };
    g('hqEncounterRecord')(p2, { won: true });
    assert.equal(p2.door.hq.encounters.wins, 1, 'a bare profile grows the record');
});

test('SOURCE · the renderer: no number keys, LEFT CLICK holstered = the attack (locked at once; unlocked, a click that did not drag), drawn = the door gun, the aim + line of sight, the one-shot on the walker, the strike frame, the API', () => {
    assert.ok(!TR.includes("if (k === '1' || k === '2' || k === '3' || k === '4')"), 'the 1–4 keys are gone (the user)');
    assert.ok(!TR.includes('_hqStrikeKey'), 'no key strike');
    ['function _hqStrikeClick()', 'function _hqEncounterAim()', 'function _hqLosClear(', 'function _hqStrikeClip(pl, gesture)'].forEach(f => assert.ok(TR.includes(f), f));
    assert.ok(TR.includes("if (drawn) return false;   // drawn, the click is the door gun's (9.5)"), 'drawn never attacks');
    assert.ok(TR.includes("if (e.button === 0 && document.pointerLockElement === canvas) { _hqStrikeClick(); e.preventDefault(); return; }"), 'the locked click strikes');
    assert.ok(TR.indexOf("if (H.portal && H.portal.drawn) {\n                _hqTryLock();") < TR.indexOf("if (e.button === 0 && document.pointerLockElement === canvas) { _hqStrikeClick();"), 'the door gun reads the click first');
    assert.ok(TR.includes("H.drag = { x: e.clientX, y: e.clientY, moved: false, strike: e.button === 0 };"), 'the unlocked click remembers the button');
    assert.ok(TR.includes("if (d && d.strike && !d.moved && !H.paused && document.pointerLockElement !== canvas && !(H.portal && H.portal.drawn)) _hqStrikeClick();"), 'a click that did not drag with the lock refused');
    assert.ok(TR.includes("var target = _hqEncounterAim();"), 'the aim at every holstered click');
    assert.ok(TR.includes("_attackChainFor(bk)") && TR.includes("chain = _castChainFor(gesture);"), 'the one chain tables (never inline)');
    assert.ok(TR.includes("var st = _slotStrikeMs(e._ew_def || pl.def, name, act);"), 'the encounter lands on the strike frame');
    assert.ok(TR.includes("if (bl.npc || bl.portal) continue;"), 'a person never blocks the line');
    assert.ok(TR.includes("if (ch.strike) { if (performance.now() < ch.strike.until && ch.jumpT < 0) want = ch.strike.name; else ch.strike = null; }"), 'the clip owns the rig');
    assert.ok(TR.includes("if (_hq !== H || H.paused) return;   // the room changed"), 'a swing that outlives the room never lands');
    assert.ok(TR.includes("        strike: _hqStrikeClick,") && TR.includes("encounterAim: function () { return _hq ? _hqEncounterAim() : null; },"), 'the API');
    assert.ok(TR.includes("if (H.opts.onEncounter) { try { H.opts.onEncounter({ gesture: gesture, target: target, room: room, x: pl.x, z: pl.z, y: pl.y, yaw: H.cam.yaw, pitch: H.cam.pitch, eye: _hqEncounterEye(), board: _hqEncounterBoard() }); }"), 'the eye + the board ride the event (9.4 seam 2)');
});

test('SOURCE · map.js: the enter opts, the guards (wild room · the gun · the switch · never online), the launch, THE LAST ROSTER inside _msConfirm, the sticky config, the ward on a loss, the prompt, the officer row', () => {
    assert.ok(MP.includes("onStrike: (typeof _hqStrikeEvent === 'function') ? _hqStrikeEvent : null,") && MP.includes("onEncounter: (typeof _hqEncounterFire === 'function') ? _hqEncounterFire : null,"), 'guarded with typeof (scene-lifecycle.test.js evals _hqEnter alone)');
    assert.ok(MP.includes("if (!_hqEncounterEnabled() || !_hqEncounterRoomOkNow()) return false;"), 'the switch + the wild room');
    assert.ok(MP.includes("if (drawn) return false;   // the gun drawn: a click is a threshold, never a fight (rev 17)"), 'the gun drawn never fights');
    assert.ok(MP.includes("try { if (!ThreeRenderer.hq.portalDrawn()) aim = ThreeRenderer.hq.encounterAim(); } catch (e) { aim = null; }"), 'the prompt aims holstered');
    assert.ok(MP.includes("if (typeof window.isOnlineMatch === 'function' && window.isOnlineMatch()) return false;   // RULE #2"), 'never from an online seat');
    assert.ok(MP.includes("window.hqEncounterLaunch(_hqCurRoom, ev.target, _hqEncounterCfgRaw(), { gesture: ev.gesture })"));
    assert.ok(MP.includes("window._hqEncounterParty = party;") && MP.includes("const _encParty = window._hqEncounterParty || null;"), 'the roster hands through _msConfirm');
    assert.ok(MP.includes("if (_encParty && typeof _hqApplyLastParty === 'function' && _hqApplyLastParty(_encParty, 1, CONFIG.teamSize)) {"), 'seated after every config rule');
    assert.ok(MP.includes("try { okStart = applyPartyBuild(false) !== false; if (okStart) startMatch(); }"), 'the builder is skipped (the tutorial\'s recipe)');
    assert.ok(MP.includes("if (!party) {") && MP.includes("return window._hqLaunchMission(L.site, { delta: true, doorId: L.doorId, doorLabel: 'THE ENCOUNTER', counterId: L.counterId, variant: 'site', roster: L.roster });"), 'no roster → the terminal, once');
    assert.ok(MP.includes("_hqEncounterRememberCfg(gm.id, _msSelectedTeamSize, _msSelectedRounds)"), 'a filed crossing is the next encounter\'s config');
    assert.ok(MP.includes("if (encRes && !encRes.won && enabled && _hqHome && DOOR_HQ.rooms && DOOR_HQ.rooms.medical) { _hqLastRoom = 'medical'; _hqLastDoor = null; }"), 'a loss is the ward');
    assert.ok(MP.includes("[CLICK] ATTACK · ENGAGE"), 'the prompt');
    assert.ok(MP.includes("window.hqEncounterLog(profile)"), 'the officer sheet');
    assert.ok(MP.includes("window._hqEncounterRun = { site: L.site,") && MP.includes("noIntro: true"), 'the run marker with the per-launch intro flag');
});

test('SOURCE · battle.js: the intro cinematic is off PER LAUNCH (never the global switch), the commit records win or lose and leaves the result for the return', () => {
    assert.ok(BT.includes("if (window._hqEncounterRun && window._hqEncounterRun.noIntro) return false;"), '_introCineEligible');
    assert.ok(BT.includes("!(window._hqEncounterRun && window._hqEncounterRun.noIntro) && !state.devAutoSim"), 'the leaf warm-up too');
    assert.ok(!BT.includes("window.EW_DISABLE_INTRO_CINE = true;   // encounter"), 'never the global switch');
    assert.ok(BT.includes("const erun = window._hqEncounterRun;") && BT.includes("hqEncounterRecord(p, { site: erun.site, room: erun.room, race: erun.race, id: erun.id || null, won,"), 'the record on the commit, the native\'s id with it');
    assert.ok(BT.includes("window._hqEncounterResult = { won, site: erun.site, room: erun.room, race: erun.race, label: erun.label || erun.race };"));
});

test('SOURCE · index.html: the hint under the door gun\'s', () => {
    assert.ok(IX.includes('<span>CLICK attack = ENGAGE a native</span>'), 'always shown — the attack needs no gun');
    assert.ok(!IX.includes('2–4 cast'), 'the number keys are gone');
});

/* ══ STAGE 2 (2026-09-15): THE EYE · THE CLEARED ROOM · THE GUARDED ENVELOPE · THE WARD'S CHART ══ */
const CAM = fs.readFileSync(__dirname + '/three-camera.js', 'utf8');
const ST = fs.readFileSync(__dirname + '/state.js', 'utf8');

test('THE EYE (seam 2): the walker\'s camera in room metres + the board under the room → a pose in TILES; null without a board; the gaze normalised; the eye clamped near the rim', () => {
    const eye = g('hqEncounterEye');
    const board = { N: 8, C: 1.75, half: 7 };
    const P = eye({ eye: { x: -7, y: 1.9, z: 7, dx: 0, dy: -0.6, dz: 0.8, ground: 0, px: -6, pz: 6, py: 0 }, board });
    assert.ok(P);
    assert.equal(P.tx, 0); assert.equal(P.tz, 8, 'the south-west corner of the board is tile (0, 8)');
    assert.ok(Math.abs(P.up - 1.9 / 1.75) < 1e-9, 'tiles above the ground under the eye');
    assert.ok(Math.abs(Math.hypot(P.dx, P.dy, P.dz) - 1) < 1e-9, 'a unit gaze');
    assert.equal(P.look, 3);
    assert.equal(JSON.stringify(P), JSON.stringify(JSON.parse(JSON.stringify(P))), 'serialisable (it rides the run marker)');
    /* the eye over a raised cell: the ground read is the column's; over a wall the walker's feet stand in */
    assert.ok(Math.abs(eye({ eye: { x: 0, y: 3.5, z: 0, dx: 1, dy: 0, dz: 0, ground: 1.75 }, board }).up - 1) < 1e-9);
    assert.ok(Math.abs(eye({ eye: { x: 0, y: 3.5, z: 0, dx: 1, dy: 0, dz: 0, ground: null, py: 1.75 }, board }).up - 1) < 1e-9, 'no ground under the eye → the walker\'s');
    assert.equal(eye({ eye: { x: 0, y: 1, z: 0, dx: 0, dy: 0, dz: 1 }, board: null }), null, 'a cave / a complex part: no board, no seed');
    assert.equal(eye(null), null); assert.equal(eye({ eye: null, board }), null);
    assert.equal(eye({ eye: { x: 0, y: 1, z: 0, dx: 0, dy: 0, dz: 0, ground: 0 }, board }).dz, 1, 'a zero gaze looks north-down');
    const far = eye({ eye: { x: 40, y: 1, z: -40, dx: 0, dy: 0, dz: 1, ground: 0 }, board });
    assert.equal(far.tx, 10); assert.equal(far.tz, -2, 'clamped two tiles past the rim');
    assert.ok(eye({ eye: { x: 0, y: 0.1, z: 0, dx: 0, dy: 0, dz: 1, ground: 0.5 }, board }).up >= 0.15, 'never under the ground');
});

test('THE EYE · ThreeCamera.seedPose: the first sync starts at the seed (never the ideal), eases home over the window, and a snapImmediate inside the window does not cut it', () => {
    let nowMs = 1000;
    const camObj = { position: { x: 0, y: 0, z: 0, set(x, y, z) { this.x = x; this.y = y; this.z = z; } }, up: { set() {} }, look: null, aspect: 1, fov: 45, lookAt(x, y, z) { this.look = [x, y, z]; }, updateProjectionMatrix() {} };
    const ctx = vm.createContext({ window: {}, performance: { now: () => nowMs }, console, Math, Number, isFinite,
        THREE: { PerspectiveCamera: function () { return camObj; }, Vector2: function () {}, Vector3: function () {}, Raycaster: function () {}, Plane: function () {} } });
    vm.runInContext(CAM + '\nthis.ThreeCamera = ThreeCamera;', ctx);
    const C = ctx.ThreeCamera;
    C.create(960, 540);
    const cam = { x: 3, y: 3, zoom: 1, tilt: 50, yaw: 0 };
    /* the reference: where a fresh camera SNAPS for this frame */
    C.sync(cam); const home = [camObj.position.x, camObj.position.y, camObj.position.z];
    /* the seed: the eye at tile (2, 6), one tile up, looking north */
    C.snapImmediate();
    assert.equal(C.seedPose({ tx: 2, tz: 6, up: 1, dx: 0, dy: -0.3, dz: -1 }, 1.4), true);
    assert.equal(C.seedState().pending, true);
    nowMs += 16; C.sync(cam);
    assert.equal(C.seedState().pending, false); assert.equal(C.seedState().easing, true);
    assert.ok(Math.abs(camObj.position.x - 2 * 128) < 1e-6 && Math.abs(camObj.position.z - 6 * 128) < 1e-6 && Math.abs(camObj.position.y - 128) < 1e-6, 'the first frame IS the seed: ' + JSON.stringify(camObj.position));
    assert.ok(camObj.look[2] < camObj.position.z, 'looking north (−z)');
    /* a match start snaps the camera home — inside the window it is ignored, the ease goes on */
    C.snapImmediate();
    nowMs += 16; C.sync(cam);
    const d0 = Math.hypot(camObj.position.x - home[0], camObj.position.y - home[1], camObj.position.z - home[2]);
    assert.ok(d0 > 100, 'still far from home one frame in (no cut): ' + d0);
    let prev = d0;
    for (let i = 0; i < 100; i++) { nowMs += 16; C.sync(cam); const d = Math.hypot(camObj.position.x - home[0], camObj.position.y - home[1], camObj.position.z - home[2]); assert.ok(d <= prev + 1e-6, 'monotone toward home'); prev = d; }
    assert.ok(prev < 12, 'home (within a tenth of a tile) after ~1.6 s: ' + prev);
    assert.equal(C.seedState().easing, false);
    /* after the window a snap cuts as always */
    C.seedPose({ tx: 0, tz: 0, up: 1, dx: 0, dy: 0, dz: 1 }, 1); nowMs += 16; C.sync(cam);
    assert.ok(Math.abs(camObj.position.x) < 1e-6, 'a second seed lands');
    nowMs += 5000; C.snapImmediate(); C.sync(cam);
    assert.ok(Math.abs(camObj.position.x - home[0]) < 1e-6, 'past the window a snap is a snap');
    assert.equal(C.seedPose(null), false); assert.equal(C.seedPose({ tx: NaN }), false, 'a bad seed is refused');
});

test('THE CLEARED ROOM: a WIN files the native\'s spawn id under the room for TODAY; a loss files nothing; ids accumulate; yesterday\'s clearing lapses', () => {
    const rec = g('hqEncounterRecord'), cleared = g('hqEncounterCleared');
    const p = profile();
    assert.equal(cleared(p, 'site_prebuilt_dumb'), null);
    rec(p, { site: 'prebuilt_dumb', room: 'site_prebuilt_dumb', race: 'grey', id: 'hq-native-0', won: false, date: g('hqToday')() });
    assert.equal(cleared(p, 'site_prebuilt_dumb'), null, 'a loss clears nothing');
    rec(p, { site: 'prebuilt_dumb', room: 'site_prebuilt_dumb', race: 'grey', id: 'hq-native-0', won: true, date: g('hqToday')() });
    assert.deepEqual(J(cleared(p, 'site_prebuilt_dumb')), { date: g('hqToday')(), ids: ['hq-native-0'] });
    rec(p, { site: 'prebuilt_dumb', room: 'site_prebuilt_dumb', race: 'grey', id: 'hq-npc-1', won: true, date: g('hqToday')() });
    rec(p, { site: 'prebuilt_dumb', room: 'site_prebuilt_dumb', race: 'grey', id: 'hq-npc-1', won: true, date: g('hqToday')() });
    assert.equal(cleared(p, 'site_prebuilt_dumb').ids.join(','), 'hq-native-0,hq-npc-1', 'ids accumulate, never twice');
    assert.equal(cleared(p, 'site_prebuilt_hell'), null, 'another room is untouched');
    /* yesterday's clearing has lapsed — the room repopulates */
    p.door.hq.cleared.site_prebuilt_dumb.date = '2020-01-01';
    assert.equal(cleared(p, 'site_prebuilt_dumb'), null);
    /* a new day's win starts a fresh list */
    rec(p, { room: 'site_prebuilt_dumb', id: 'hq-native-2', won: true, date: g('hqToday')() });
    assert.equal(cleared(p, 'site_prebuilt_dumb').ids.join(','), 'hq-native-2');
    assert.equal(cleared(null, 'x'), null); assert.equal(cleared(p, null), null);
});

test('THE GUARDED ENVELOPE: in a wild room with natives of its own the pay stands only once the room is cleared today; a roster-only room, a facility room and every tape are never guarded', () => {
    const guarded = g('hqRoomGuarded');
    const wild = Object.keys(HQ.rooms).filter(id => guarded(id));
    assert.ok(wild.length >= 10, 'the sites with natives: ' + wild.length);
    wild.forEach(id => assert.ok(g('hqRoomSite')(id), id + ' is wild'));
    ['central_egress', 'foyer', 'cafeteria', 'garage', 'locker', 'coldroom', 'hwing_w'].forEach(id => assert.equal(guarded(id), false, id + ' is never guarded'));
    HQ.finds.forEach(f => {
        if (f.kind !== 'pay') assert.equal(f.guard, undefined, f.id + ': only the envelope is guarded');
        else assert.equal(!!f.guard, guarded(f.room), f.id);
    });
    const pay = HQ.finds.find(f => f.guard);
    assert.ok(pay, 'at least one guarded envelope');
    /* a day the envelope is live */
    let now = Date.UTC(2026, 9, 1);
    for (let i = 0; i < 40 && !g('hqFindLiveToday')(pay, g('hqToday')(new Date(now))); i++) now += 86400000;
    assert.ok(g('hqFindLiveToday')(pay, g('hqToday')(new Date(now))), 'a live day found');
    const p = profile();
    assert.ok(D.hqFindsInRoom(pay.room, p, now).every(f => f.id !== pay.id), 'the natives sit on it');
    g('hqEncounterRecord')(p, { room: pay.room, id: 'hq-native-0', won: true, date: g('hqToday')(new Date(now)) });
    assert.ok(D.hqFindsInRoom(pay.room, p, now).some(f => f.id === pay.id), 'cleared today — it glows');
    assert.ok(D.hqFindsInRoom(pay.room, p, now + 86400000 * 3).every(f => f.id !== pay.id), 'tomorrow the room is theirs again');
    const beat = D.hqCollectFind(p, pay.id, now);
    assert.equal(beat.ok, true, 'and it is taken like any envelope');
});

test('THE WARD\'S CHART: exited from a wild room TODAY → RECOVERING (the cot is made up); a win, or yesterday\'s exit, leaves the chart as it was', () => {
    const med = g('hqMedicalRecord'), rec = g('hqEncounterRecord'), today = g('hqToday')();
    const p = profile({ career: { matchesPlayed: 4, wins: 3, losses: 1 } });
    assert.equal(med(p).condition, 'FIT FOR DUTY');
    rec(p, { site: 'prebuilt_hell', room: 'site_prebuilt_hell', race: 'demon', won: false, date: today });
    const m = med(p);
    assert.equal(m.condition, 'RECOVERING'); assert.equal(m.tone, 'unstable');
    assert.ok(/HELL/.test(m.note) && /DEMON/.test(m.note), m.note);
    assert.equal(m.exited.race, 'demon');
    rec(p, { site: 'prebuilt_hell', room: 'site_prebuilt_hell', race: 'demon', won: true, date: today });
    assert.equal(med(p).condition, 'FIT FOR DUTY', 'the last one held');
    rec(p, { site: 'prebuilt_hell', room: 'site_prebuilt_hell', race: 'demon', won: false, date: '2020-01-01' });
    assert.equal(med(p).condition, 'FIT FOR DUTY', 'an old exit is history');
    p.door.leave = true; rec(p, { won: false, date: today });
    assert.equal(med(p).condition, 'ADMINISTRATIVE LEAVE', 'leave outranks the cot');
});

test('SOURCE · stage 2: the camera seed (both sync branches, the snap guard, the API), the battle\'s first frame + no VS card for an encounter, the renderer\'s eye / board / the cleared natives, map.js\'s run marker', () => {
    ['function seedPose(seed, easeS)', 'function _consumeSeed(nowS)', 'function seedState()', "if (_seedUntil > performance.now() / 1000) return;   // the encounter's seed is easing — never cut it",
     'const seededFp = _seed ? _consumeSeed(nowFp) : false;', 'const seeded = _seed ? _consumeSeed(now) : false;', '} else if (!seeded) {', 'const st = (now < _seedUntil) ? _seedSt : (_smoothOverride > 0 ? SMOOTH_TIME_FAST : SMOOTH_TIME);', '        seedPose,\n        seedState,'].forEach(f => assert.ok(CAM.includes(f), f));
    assert.ok(BT.includes("if (window._hqEncounterRun && window._hqEncounterRun.noIntro) {\n                const eye = window._hqEncounterRun.eye;") && BT.includes("ThreeCamera.seedPose(eye, 1.4)") && BT.includes("if (onDone) onDone();\n                return;\n            }\n\n            /* The cinematic intro replaces the flat VS card"), 'the seed, then no card — before the intro gate');
    ['function _hqEncounterEye()', 'function _hqEncounterBoard()', "var st = _hq && _hq.site; if (!st || st.cave) return null;", "if (gone.indexOf('hq-native-' + si) >= 0) return;   // beaten today — the room is yours", "if (gone.indexOf('hq-npc-' + k) >= 0) continue;", "hqEncounterCleared(prof, opts.room)"].forEach(f => assert.ok(TR.includes(f), f));
    assert.ok(MP.includes("eye = (ev && typeof window.hqEncounterEye === 'function') ? window.hqEncounterEye(ev) : null;") && MP.includes("id: L.encounter.id || null,") && MP.includes("eye: eye, walker: ev ?"), 'the run marker');
    /* the ONE reason spawnSide is NOT mirrored: the spawn zones and the nexus points are keyed by seat + row, never by SPAWNS — a lane swap would seat P1 on P2's spawn nexus */
    assert.ok(MP.includes("state.spawnZones[1].push({ x: col, y: p1Row });"), 'the zone rows are the seat\'s (map.js) — the mirror waits on the zone system');
    for (const fn of ['hqEncounterCleared', 'hqRoomGuarded', 'hqEncounterEye']) assert.equal(typeof D[fn], 'function', fn + ' on window');
});
