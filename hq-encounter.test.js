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
    /* Delivery 6 (the user's rule): an encounter is TEAM DEATHMATCH; a Cube / Code Red fight is ARENA */
    assert.equal(R.gm, 'tdm'); assert.equal(R.gmCodeRed, 'arena'); assert.equal(R.teamSize, 4);
    assert.ok(R.tileM > 1 && R.tileM < 3, 'the metres per tile a board-less room is read in');
    assert.ok(R.snapMs >= 100 && R.snapMs <= 800, 'the slide onto the cells is a beat, never a wait');
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

test('THE STICKY CONFIG (Delivery 6): the MODE is the encounter\'s own — TDM, Arena on a Code Red — never the sticky one; only the team size sticks (clamped 1..8); the rounds are the mode\'s', () => {
    const cfg = g('hqEncounterConfig');
    assert.deepEqual(J(cfg(null)), { gm: 'tdm', teamSize: 4, rounds: 0 });
    assert.deepEqual(J(cfg('not json')), { gm: 'tdm', teamSize: 4, rounds: 0 });
    assert.deepEqual(J(cfg({ gm: 'clash', teamSize: 3, rounds: 12 })), { gm: 'tdm', teamSize: 3, rounds: 0 }, 'an Arena crossing\'s rounds never cap a TDM');
    assert.deepEqual(J(cfg({ gm: 'arena', teamSize: 5, rounds: 100 })), { gm: 'tdm', teamSize: 5, rounds: 0 }, 'the sticky Arena is not the encounter\'s mode');
    assert.deepEqual(J(cfg({ gm: 'gauntlet' }, { codeRed: true })), { gm: 'arena', teamSize: 4, rounds: 0 }, 'a Code Red site = the Cube fight');
    assert.equal(cfg({ teamSize: 40 }).teamSize, 8); assert.equal(cfg({ teamSize: 0 }).teamSize, 1); assert.equal(cfg({ teamSize: 'x' }).teamSize, 4);
    assert.equal(cfg({ rounds: -3 }).rounds, 0);
});

test('THE LAUNCH: pure and serialisable — the site\'s Δ, the config, the CPU pool led by the native\'s race, the console as the way back, the native on the record; refused off a wild room or for a non-native', () => {
    const L = g('hqEncounterLaunch')('site_prebuilt_dumb', native(), '{"gm":"arena","teamSize":3}', { gesture: 'magic' });
    assert.ok(L);
    assert.equal(L.site, 'prebuilt_dumb'); assert.equal(L.delta, true); assert.equal(L.gm, 'tdm'); assert.equal(L.teamSize, 3); assert.equal(L.codeRed, false);
    assert.equal(g('hqEncounterLaunch')('site_prebuilt_dumb', native(), null, { codeRed: true }).gm, 'arena', 'the Code Red response is Arena');
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
    assert.ok(MP.includes("window.hqEncounterLaunch(_hqCurRoom, ev.target, _hqEncounterCfgRaw(), { gesture: ev.gesture, codeRed: !!cr })"), 'the launch carries the Code Red read');
    assert.ok(MP.includes("window._hqEncounterParty = party;") && MP.includes("const _encParty = window._hqEncounterParty || null;"), 'the roster hands through _msConfirm');
    assert.ok(MP.includes("if (_encParty && typeof _hqApplyLastParty === 'function' && _hqApplyLastParty(_encParty, 1, CONFIG.teamSize)) {"), 'seated after every config rule');
    assert.ok(MP.includes("try { okStart = applyPartyBuild(false) !== false; if (okStart) startMatch(); }"), 'the builder is skipped (the tutorial\'s recipe)');
    assert.ok(MP.includes("if (!party) {") && MP.includes("party = { members: [], fallback: true };") && !MP.includes("doorLabel: 'THE ENCOUNTER', counterId: L.counterId, variant: 'site', roster: L.roster });"), 'no roster → a stand-in squad, never the terminal (Delivery 6)');
    assert.ok(MP.includes("_hqEncounterRememberCfg(gm.id, _msSelectedTeamSize, _msSelectedRounds)"), 'a filed crossing is the next encounter\'s config');
    assert.ok(MP.includes("wake = (typeof window.hqEncounterWakeRoom === 'function') ? window.hqEncounterWakeRoom(_hqProfile()) : null;") && MP.includes("if (wake) { _hqLastRoom = wake; _hqLastDoor = null; encRes.wake = wake; }"), 'a loss is where you wake up (the ward / the office)');
    assert.ok(MP.includes("[CLICK] ATTACK · ENGAGE"), 'the prompt');
    assert.ok(MP.includes("window.hqEncounterLog(profile)"), 'the officer sheet');
    assert.ok(MP.includes("window._hqEncounterRun = { site: L.site,") && MP.includes("noIntro: true"), 'the run marker with the per-launch intro flag');
});

test('SOURCE · battle.js: the intro cinematic is off PER LAUNCH (never the global switch), the commit records win or lose and leaves the result for the return', () => {
    assert.ok(BT.includes("if (window._hqEncounterRun && window._hqEncounterRun.noIntro) return false;"), '_introCineEligible');
    assert.ok(BT.includes("!(window._hqEncounterRun && window._hqEncounterRun.noIntro) && !state.devAutoSim"), 'the leaf warm-up too');
    assert.ok(!BT.includes("window.EW_DISABLE_INTRO_CINE = true;   // encounter"), 'never the global switch');
    assert.ok(BT.includes("const erun = _encMatch || window._hqEncounterRun;") && BT.includes("hqEncounterRecord(p, { site: erun.site, room: erun.room, race: erun.race, id: erun.id || null, won,"), 'the record on the commit (the latched run first), the native\'s id with it');
    assert.ok(BT.includes("window._hqEncounterResult = { won, site: erun.site, room: erun.room, race: erun.race, label: erun.label || erun.race, walker: erun.walker || null };"));
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
    assert.ok(BT.includes("const _er = _encRun();\n            if (_er) {\n                let eye = _er.eye;") && BT.includes("ThreeCamera.seedPose(eye, 1.4)") && BT.includes("if (onDone) onDone();\n                return;\n            }\n\n            /* The cinematic intro replaces the flat VS card"), 'the seed, then no card — before the intro gate (the latched run, Delivery 6)');
    ['function _hqEncounterEye()', 'function _hqEncounterBoard()', "var st = _hq && _hq.site; if (!st || st.cave) return null;", "if (gone.indexOf('hq-native-' + si) >= 0) return;   // beaten today — the room is yours", "if (gone.indexOf('hq-npc-' + k) >= 0) continue;", "hqEncounterCleared(prof, opts.room)"].forEach(f => assert.ok(TR.includes(f), f));
    assert.ok(MP.includes("eye = (ev && typeof window.hqEncounterEye === 'function') ? window.hqEncounterEye(field || ev) : null;") && MP.includes("id: L.encounter.id || null,") && MP.includes("eye: eye, walker: ev ?"), 'the run marker');
    /* the ONE reason spawnSide is NOT mirrored: the spawn zones and the nexus points are keyed by seat + row, never by SPAWNS — a lane swap would seat P1 on P2's spawn nexus */
    assert.ok(MP.includes("state.spawnZones[1].push({ x: col, y: p1Row });"), 'the zone rows are the seat\'s (map.js) — the mirror waits on the zone system');
    for (const fn of ['hqEncounterCleared', 'hqRoomGuarded', 'hqEncounterEye']) assert.equal(typeof D[fn], 'function', fn + ' on window');
});

/* ── DELIVERY 2 · THE ENCOUNTER'S TRUTH (PHASE9_QUALITY_PLAN §8 item 3 + item 7, 2026-09-16) ── */
const ST2 = ST;   // state.js source (declared above for THE EYE)

test('D2 · THE LEAD: the native you hit is P2\'s seat 1 — race + gender + the room\'s name; a race off the roster → null; a gender the race cannot wear → the race\'s first; the launch carries `name`', () => {
    const lead = g('hqEncounterLead')({ race: 'grey', gender: 'female', label: 'Grey', id: 'hq-native-0' });
    assert.ok(lead); assert.equal(lead.race, 'grey'); assert.equal(lead.name, 'Grey'); assert.equal(lead.id, 'hq-native-0');
    assert.ok(lead.gender === 'female' || lead.gender === 'male');
    assert.equal(g('hqEncounterLead')({ race: 'not-a-race', gender: 'male' }), null, 'never an invented race');
    assert.equal(g('hqEncounterLead')(null), null);
    const noName = g('hqEncounterLead')({ race: 'grey', gender: 'male', label: '   ' });
    assert.equal(noName.name, null, 'a blank label is no name');
    assert.equal(g('hqEncounterLead')({ race: 'grey', gender: 'male', name: 'x'.repeat(40) }).name.length, 24, 'capped');
    const L = g('hqEncounterLaunch')('site_prebuilt_dumb', native({ label: 'The Grey at the Desk' }), null);
    assert.equal(L.encounter.name, 'The Grey at the Desk', 'the launch carries the room\'s name for it');
    assert.equal(JSON.parse(JSON.stringify(L)).encounter.name, 'The Grey at the Desk');
});

test('D2 · SOURCE · state.js: optimizeRandomizeParty pins seat 1 off _hqPreselect.encounter through hqEncounterLead (race → randomizeIdentity, the gender, the name sanitised); map.js starts the roster with `encounter: L.encounter` on the preselect', () => {
    /* measured 2026-09-16 (THE FIELD stage B probe): _msConfirm drops the preselect long before the CPU party is drawn, so the
       read takes map.js's own marker first — `window._hqEncounterLead`, set beside the null and spent after the draw */
    assert.ok(ST2.includes("window._hqEncounterLead || (window._hqPreselect && window._hqPreselect.encounter) || null"), 'the ONE read: the marker, then the preselect');
    assert.ok(ST2.includes("const lead = (player === 2 && _encSpec && typeof hqEncounterLead === 'function') ? hqEncounterLead(_encSpec) : null;"), 'the pin off it');
    const conf = MP.slice(MP.indexOf("const _pre = window._hqPreselect || null;"), MP.indexOf("dismissTitleScreen();", MP.indexOf("const _pre = window._hqPreselect || null;")));
    assert.ok(conf.indexOf("window._hqEncounterLead = (_pre && _pre.encounter && _preSite === _pre.mapId) ? _pre.encounter : null;") < conf.indexOf("window._hqPreselect = null;"), 'the lead is stashed BEFORE the preselect is dropped');
    assert.ok(conf.indexOf("optimizeRandomizeParty(2);\n                window._hqEncounterLead = null;") > 0, 'spent right after the CPU draw');
    assert.ok(ST2.includes("const m0 = randomizeIdentity(false, lead.race);") && ST.includes("if (m0.race === lead.race) { m0.gender = lead.gender; state.partyMeta[player][0] = m0; }"), 'seat 1 = the native, only when the race held');
    assert.ok(ST2.includes("state.partyNames[player][0] = sanitizeUnitName(lead.name, getDefaultUnitName(state.partyBuilds[player][0]));"), 'the nameplate wears the room\'s name');
    assert.ok(MP.includes("codeRed: !!L.codeRedRun, locked: true, presets: null, encounter: L.encounter };"), 'the preselect carries the encounter (+ the Code Red flag, Delivery 6)');
    assert.ok(MP.includes("name: ch.label || null }") || fs.readFileSync(__dirname + '/data.js', 'utf8').includes("name: ch.label || null },"), 'the launch names it');
});

test('D1 · THE RETURN SPOT: the run marker\'s walker (feet + camera yaw in radians) → the free-spot form { x, z, y, face° }; a heading wraps to 0..360; no walker → null (the console as before)', () => {
    const f = g('hqEncounterReturnSpot');
    const s = f({ walker: { x: 1.25, z: -3.5, y: 2.9, yaw: Math.PI / 2, pitch: 0.1 } });
    assert.ok(s); assert.equal(s.x, 1.25); assert.equal(s.z, -3.5); assert.equal(s.y, 2.9); assert.equal(s.face, 90); assert.equal(s.swing, true);
    assert.equal(f({ walker: { x: 0, z: 0, yaw: -Math.PI / 2 } }).face, 270, 'wrapped');
    assert.equal(f({ walker: { x: 0, z: 0, yaw: 0 } }).y, 0, 'a missing height is the floor');
    assert.equal(f({ walker: null }), null); assert.equal(f(null), null); assert.equal(f({ walker: { x: 'a', z: 0 } }), null);
    assert.equal(JSON.parse(JSON.stringify(s)).face, 90, 'serialisable (it rides _hqLastDoor)');
});

test('D1 · SOURCE: battle.js carries the walker home on the result; map.js lands a WIN in the strike\'s own room at the swing spot (never a loss, never another room); three-renderer.js _hqGoTo takes the free-spot form (surface first, the recorded heading, faceAway ignored)', () => {
    assert.ok(BT.includes("label: erun.label || erun.race, walker: erun.walker || null };"), 'the result carries the swing');
    assert.ok(MP.includes("if (encRes && encRes.won && enabled && _hqHome && encRes.room && encRes.room === _hqLastRoom && typeof window.hqEncounterReturnSpot === 'function') {"), 'a win in the same room');
    assert.ok(MP.includes("const spot = window.hqEncounterReturnSpot(encRes);") && MP.includes("if (spot) _hqLastDoor = spot;"), 'the spot becomes the landing');
    assert.ok(MP.indexOf("if (spot) _hqLastDoor = spot;") < MP.indexOf("if (window._hqEnter({ room: _hqLastRoom, at: _hqLastDoor, quiet: true, from: 'return' })) {"), 'before the re-entry');
    assert.ok(TR.includes("if (id && typeof id === 'object' && isFinite(+id.x) && isFinite(+id.z)) {"), 'the free-spot form');
    assert.ok(TR.includes("fy = _hqSurface(+id.x, +id.z, (isFinite(+id.y) ? +id.y : null), true);"), 'the feet take the surface at the recorded level');
    assert.ok(TR.includes("face = isFinite(+id.face) ? +id.face : 0;"), 'the recorded heading — faceAway never turns it');
    assert.ok(TR.includes("else for (var i = 0; i < _hq.doors.length; i++) if (_hq.doors[i].door.id === id) { d = _hq.doors[i]; break; }"), 'the door scan still runs for an id');
});

test('THE DISSOLVE (seam 3) · SOURCE: _hqLeave({ dissolve }) renders the room once more and copies it over the canvas before disposing; a hold then a 600 ms fade; kill-switch + reduced motion; map.js passes the opts through and the encounter asks for it; no other leave does', () => {
    assert.ok(TR.includes("function _hqLeave(opts) {") && TR.includes("if (opts && opts.dissolve) { try { _hqDissolveStart(H,"), 'the leave takes the ask');
    assert.ok(TR.indexOf("if (opts && opts.dissolve)") < TR.indexOf("_hqUnbindInput();\n        _hq = null;"), 'the snapshot is taken BEFORE the scene goes');
    assert.ok(TR.includes("var HQ_DISSOLVE_MS = 600, HQ_DISSOLVE_HOLD_MS = 150;"), 'the crossing\'s 0.6 s');
    assert.ok(TR.includes("try { _hqRenderOnce(H); ctx.drawImage(canvas, 0, 0); } catch (e) { return null; }"), 'rendered + copied in ONE task (the drawing buffer is not preserved across tasks)');
    assert.ok(TR.includes("if (typeof window !== 'undefined' && window.EW_HQ_NO_DISSOLVE) return null;"), 'kill-switch');
    assert.ok(TR.includes("prefers-reduced-motion: reduce"), 'reduced motion = the cut');
    assert.ok(TR.includes("z-index:100050;pointer-events:none;opacity:1;transition:opacity"), 'over everything, under nothing that needs the mouse');
    assert.ok(TR.includes("setTimeout(drop, hold + ms + 120);"), 'always removed');
    const once = TR.slice(TR.indexOf('function _hqRenderOnce'), TR.indexOf('function _hqDissolveStart'));
    assert.ok(once.includes("ThreePost.renderScene(H.scene, H.camera)") && once.includes("renderer.render(H.scene, H.camera)"), 'the same render branch as the frame');
    assert.ok(MP.includes("window._hqLeave = function (opts) {") && MP.includes("ThreeRenderer.hq.leave(opts || undefined);"), 'the wrapper passes it through');
    assert.ok(MP.includes("window._hqLeave({ dissolve: { onFrame: true, hold: 1500, ms: 220 } });   // THE DISSOLVE (seam 3)"), 'the encounter asks: the frame HOLDS until the battle\'s first frame, then a short fade (THE SWOOP is the seam)');
    assert.ok(TR.includes("if (o && o.onFrame) _hqDissolveRec = rec;") && TR.includes("if (_hqDissolveRec) _hqDissolveFrame();") && TR.includes("var fade = function () { if (fading || done) return;"), 'the first battle frame fades the held snapshot; the hold is the cap');
    assert.ok(BT.includes("if (_encMatch) {\n                Promise.resolve().then(finish);\n                return;\n            }"), 'no loading card for an encounter');
    assert.ok(CAM.includes("let _seedFrom = null, _seedT0 = 0, _seedEase = 0;") && CAM.includes("const k = u * u * (3 - 2 * u);"), 'THE SWOOP: the seed is tweened home, not damped');
    assert.equal((MP.match(/_hqLeave\(\{ dissolve/g) || []).length, 1, 'only the encounter dissolves (a screen / a menu exit still cuts)');
});

/* ── DELIVERY 6 · THE FIELD, STAGE A (PHASE9_QUALITY_PLAN §11.3 A, 2026-09-16) ──
   The user: "forget spawn zones in encounter battles — if I attack an enemy up
   close the battle starts with us right up close, slid to the nearest square
   tile during the transition; no VS screen; TDM (Arena with a Cube / Code Red);
   a loss wakes you in your office or the infirmary; one click back to where I
   was walking". */
const evBoard = () => ({ x: -6.2, z: 5.9, y: 0, yaw: 1.2, pitch: 0, target: { id: 'hq-native-0', x: -4.7, z: 5.1, y: 0 },
    eye: { x: -8, y: 1.9, z: 7.5, dx: 0.6, dy: -0.3, dz: -0.5, ground: 0, px: -6.2, pz: 5.9, py: 0 }, board: { N: 8, C: 1.7534, half: 7.0136 } });

test('D6 · THE FIELD RECORD: the board, both feet, the walker → native heading, the raw eye; on a board the two CELLS (clamped in from the walkway, never the same cell) + THE SNAP (their centres in room metres); off a board no cells and no snap; serialisable', () => {
    const field = g('hqEncounterField');
    const F = field(evBoard());
    assert.equal(F.board.N, 8); assert.ok(Math.abs(F.board.C - 1.7534) < 1e-9);
    assert.deepEqual(J(F.cells), { walker: { x: 0, y: 7 }, target: { x: 1, y: 6 } }, 'the feet fall in these cells (x east, z south)');
    assert.ok(Math.abs(F.snap.walker.x - (-7.0136 + 0.5 * 1.7534)) < 1e-9 && Math.abs(F.snap.walker.z - (-7.0136 + 7.5 * 1.7534)) < 1e-9, 'the walker\'s cell centre');
    assert.ok(Math.abs(F.heading - Math.atan2(5.1 - 5.9, -4.7 + 6.2)) < 1e-9);
    assert.equal(F.eye.ground, 0); assert.equal(F.walker.x, -6.2); assert.equal(F.target.z, 5.1);
    JSON.stringify(F);
    /* the walkway: both feet far off the board → clamped onto the edge; the native takes the next cell along the heading */
    const far = field(Object.assign(evBoard(), { x: -30, z: 5, target: { x: -29, z: 5 } }));
    assert.deepEqual(J(far.cells.walker), { x: 0, y: 6 }); assert.notDeepEqual(J(far.cells.target), J(far.cells.walker), 'never the same cell');
    assert.ok(far.cells.target.x >= 0 && far.cells.target.x < 8 && far.cells.target.y >= 0 && far.cells.target.y < 8);
    /* a corner: the walker in the last cell, the heading pointing off the board — the native still lands on the board */
    const corner = field(Object.assign(evBoard(), { x: 6.9, z: 6.9, target: { x: 9, z: 9 } }));
    assert.deepEqual(J(corner.cells.walker), { x: 7, y: 7 }); assert.ok(corner.cells.target.x <= 7 && corner.cells.target.y <= 7 && (corner.cells.target.x !== 7 || corner.cells.target.y !== 7));
    /* no board (a cave, a complex part): no cells, no snap, the heading and the eye still filed */
    const F0 = field(Object.assign(evBoard(), { board: null }));
    assert.equal(F0.board, null); assert.equal(F0.cells, null); assert.equal(F0.snap, null); assert.ok(F0.eye && isFinite(F0.heading));
    assert.equal(field(null), null);
    assert.ok(field({ x: 1, z: 1 }).target, 'no target → a stand-in one cell east');
});

test('D6 · THE SEATS: P1 seat 1 = the walker\'s cell, P2 seat 1 = the native\'s; each nudged to the nearest FREE cell; the parties fill their own side nearest their lead; every seat distinct + free; no board → the middle of the map, the enemy one cell east; null with no free cell', () => {
    const seats = g('hqEncounterSeats'), field = g('hqEncounterField');
    const F = field(evBoard());
    const S = seats(F, { W: 8, H: 8, n1: 4, n2: 4 });
    assert.deepEqual(J(S.lead), { 1: { x: 0, y: 7 }, 2: { x: 1, y: 6 } });
    assert.equal(S[1].length, 4); assert.equal(S[2].length, 4); assert.equal(S.board, true);
    const all = S[1].concat(S[2]).map(c => c.x + ',' + c.y);
    assert.equal(new Set(all).size, 8, 'eight distinct cells');
    all.forEach(k => { const [x, y] = k.split(',').map(Number); assert.ok(x >= 0 && x < 8 && y >= 0 && y < 8); });
    const cheb = (a, b) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
    S[1].forEach(c => assert.ok(cheb(c, S.lead[1]) <= 2, 'P1 stands with its lead')); S[2].forEach(c => assert.ok(cheb(c, S.lead[2]) <= 2, 'P2 too'));
    /* the lead's own cell is not free (a wall grew there): the nearest free cell takes it */
    const S2 = seats(F, { W: 8, H: 8, n1: 2, n2: 2, free: (x, y) => !(x === 0 && y === 7) });
    assert.notDeepEqual(J(S2.lead[1]), { x: 0, y: 7 }); assert.equal(cheb(S2.lead[1], { x: 0, y: 7 }), 1);
    /* the free predicate is the law: no seat on a refused cell */
    const banned = (x, y) => (x + y) % 2 === 0;
    const S3 = seats(F, { W: 8, H: 8, n1: 4, n2: 4, free: (x, y) => !banned(x, y) });
    S3[1].concat(S3[2]).forEach(c => assert.ok(!banned(c.x, c.y)));
    /* no board: the centre, the enemy east (the heading is rotated onto +x) */
    const S0 = seats(field(Object.assign(evBoard(), { board: null })), { W: 8, H: 8, n1: 4, n2: 4 });
    assert.deepEqual(J(S0.lead), { 1: { x: 3, y: 4 }, 2: { x: 4, y: 4 } }); assert.equal(S0.board, false);
    const S00 = seats(null, { W: 12, H: 10, n1: 1, n2: 1 });
    assert.deepEqual(J(S00.lead), { 1: { x: 5, y: 5 }, 2: { x: 6, y: 5 } }, 'a bigger board: still the middle');
    /* nothing free → null (the caller keeps the rows) */
    assert.equal(seats(F, { W: 8, H: 8, n1: 1, n2: 1, free: () => false }), null);
    assert.equal(seats(F, { W: 0, H: 8 }), null);
    /* a party larger than the board's free cells: as many as fit, never a duplicate */
    const S4 = seats(F, { W: 2, H: 2, n1: 4, n2: 4 });
    assert.equal(S4[1].length + S4[2].length, 4); assert.equal(new Set(S4[1].concat(S4[2]).map(c => c.x + ',' + c.y)).size, 4);
});

test('D6 · THE EYE WITHOUT A BOARD: the camera\'s offset from the feet rotated by the heading and hung on P1\'s lead cell — the gaze looks along +x at P2\'s lead; up in tiles off the ground; null without seats / an eye; hqEncounterEye routes to it', () => {
    const field = g('hqEncounterField'), seats = g('hqEncounterSeats'), eyeOf = g('hqEncounterEye'), fromSeats = g('hqEncounterEyeFromSeats');
    const F0 = field(Object.assign(evBoard(), { board: null }));
    const S0 = seats(F0, { W: 8, H: 8, n1: 4, n2: 4 });
    const E = eyeOf(F0, S0);
    assert.ok(E && isFinite(E.tx + E.tz + E.up + E.dx + E.dy + E.dz));
    assert.ok(E.dx > 0.8, 'the gaze runs east — at the enemy\'s lead');
    assert.ok(E.tx < S0.lead[1].x + 0.5, 'the eye hangs behind P1\'s lead');
    assert.ok(Math.abs(Math.hypot(E.dx, E.dy, E.dz) - 1) < 1e-9, 'normalised');
    assert.ok(Math.abs(E.up - 1.9 / R.tileM) < 1e-9, 'up = the eye\'s height over the ground in tiles');
    assert.deepEqual(J(fromSeats(F0, S0)), J(E));
    assert.equal(eyeOf(F0), null, 'no seats yet → null (the seed waits for the zone builder)');
    assert.equal(fromSeats(Object.assign({}, F0, { eye: null }), S0), null);
    /* with a board the old read stands — the walker\'s camera in the board\'s own tiles */
    const E1 = eyeOf(field(evBoard()));
    assert.ok(E1 && Math.abs(E1.tx - (-8 + 7.0136) / 1.7534) < 1e-9);
});

test('D6 · WHERE YOU WAKE UP: a loss lands in the ward and your office by turns (the first exit is the ward — the commit already counted it); both rooms exist; a profile with no record → the office (an even count) never throws', () => {
    const wake = g('hqEncounterWakeRoom');
    assert.ok(HQ.rooms.medical && HQ.rooms.office, 'the two rooms');
    const p = (losses) => profile({ door: { clearance: 1, hq: { encounters: { count: losses, wins: 0, losses } } } });
    assert.equal(wake(p(1)), 'medical'); assert.equal(wake(p(2)), 'office'); assert.equal(wake(p(3)), 'medical'); assert.equal(wake(p(4)), 'office');
    assert.equal(wake(profile()), 'office'); assert.equal(wake(null), 'office');
    /* the synced record counts too (D5: the union) */
    assert.equal(wake(profile({ progress: { hq: { encounters: { count: 1, wins: 0, losses: 1 } } } })), 'medical');
});

test('D6 · SOURCE · battle.js: the run is LATCHED at startMatch (never the window marker after that), the intro gate + the warm-up + the VS card read the latch, the eye falls back to the seats, the field is published for the zone builder, the result bar is ONE button, the standard bar comes back for the next match, a rematch drops the latch', () => {
    assert.ok(BT.includes("let _encMatch = null;") && BT.includes("function _encRun() { return _encMatch || ((window._hqEncounterRun && window._hqEncounterRun.noIntro) ? window._hqEncounterRun : null); }"), 'the latch');
    assert.ok(BT.includes("if (er) { if (er.armed) { er.armed = false; _encMatch = er; } else window._hqEncounterRun = null; }"), 'armed → latched for THIS match');
    assert.ok(BT.includes("_encMatch = null;\n            try {\n                const er = window._hqEncounterRun;"), 'a plain match starts with no latch');
    assert.ok(BT.includes("if (_encMatch) return false;   // THE ENCOUNTER (Delivery 6)"), 'the intro gate');
    assert.ok(BT.includes("&& !window.EW_DISABLE_INTRO_CINE && !_encMatch && !(window._hqEncounterRun"), 'the leaf warm-up');
    assert.ok(BT.includes("if (!eye && _er.field && typeof hqEncounterEye === 'function') { try { eye = hqEncounterEye(_er.field, _er.field.seats || null); }"), 'the eye off the seats');
    assert.ok(BT.includes("window._ewEncounterField = function () { return (_encMatch && _encMatch.field) || null; };"), 'the field for map.js');
    assert.ok(BT.includes("function _encounterResultButtons()") && BT.includes("${won ? '▸ BACK TO THE ROOM' : '▸ WAKE UP'}") && BT.includes("b.onclick = () => { b.disabled = true; window.backToMainMenu(); };"), 'one button, through the building\'s return');
    assert.ok(BT.includes("try { _encounterResultButtons(); } catch (e)"), 'after the overlay shows');
    assert.ok(BT.includes("if (!document.getElementById('nextMatchBtn') && typeof _restoreResultOverlayButtons === 'function') _restoreResultOverlayButtons();"), 'the standard bar returns');
    assert.ok(BT.includes("_encMatch = null;   // a rematch is never the encounter"), 'Find Next Match drops it');
    assert.ok(BT.includes("window._hqEncounterRun = null; _encMatch = null;"), 'the commit consumes the latch');
});

test('D6 · SOURCE · map.js: the strike reads the Code Red, files the field, SLIDES the two onto their cells (the eye re-read after) then starts; the run marker carries the field + the mode; a Code Red encounter is the response; the zone builder seats the parties from the field and never moves a seated unit onto a row', () => {
    ['let cr = null;', "if (!cr || cr.cleared || !site || cr.site !== site) cr = null;", "L.codeRedRun = cr ? { date: cr.date, site: cr.site, race: cr.race, label: cr.label, bonus: cr.bonus } : null;",
     "const field = (typeof window.hqEncounterField === 'function') ? window.hqEncounterField(ev) : null;",
     "if (field && field.snap && ThreeRenderer.hq && typeof ThreeRenderer.hq.encounterSnap === 'function') {",
     "const started = ThreeRenderer.hq.encounterSnap({ walker: field.snap.walker, target: field.snap.target, targetId: ev.target.id }, snapMs, () => {",
     "eye2 = (typeof ThreeRenderer.hq.encounterEye === 'function') ? ThreeRenderer.hq.encounterEye() : null;",
     "const ev2 = Object.assign({}, ev, { x: field.snap.walker.x, z: field.snap.walker.z }, eye2 ? { eye: eye2 } : {});",
     "_hqEncounterStart(L, ev2, field2);", "return _hqEncounterStart(L, ev, field);",
     "function _hqEncounterStart(L, ev, field) {", "field: field || null, gm: L.gm };",
     "window._hqCodeRedRun = L.codeRedRun || null;",
     "const _encSeated = _encounterPlaceSeats();", "if (_encSeated) {\n                state.spawnZones = _encSeated.zones;",
     "function _encounterPlaceSeats() {", "const F = (typeof window._ewEncounterField === 'function') ? window._ewEncounterField() : null;",
     "if (!_respawnTileSafe(x, y)) return false;", "seats = window.hqEncounterSeats(F, { W: bw(), H: bh(), n1: u1.length, n2: u2.length, free });",
     "F.seats = seats;", "if (_encParty.fallback && typeof optimizeRandomizeParty === 'function') {",
     "YOU CAME TO AT YOUR DESK", "YOU CAME TO IN THE WARD"].forEach(f => assert.ok(MP.includes(f), f));
    assert.ok(MP.indexOf("const _encSeated = _encounterPlaceSeats();") < MP.indexOf("state.spawnZones = {};\n\n            /* Determine orientation from SPAWNS hint */"), 'the seats are placed before the rows would be built');
    assert.ok(!MP.includes('_encPlaced'), 'the Delivery 6 skip inside the row path is gone — a field never reaches the rows');
});

/* ── THE FIELD stage A rev 2 (Phase 9 Delivery 7): the seats are the zones, the board untouched ── */
test('D7 · THE TRANSFORM: room metres ↔ tiles round-trip within 1 mm on every board; cellOf clamps onto the board; centre is the cell\'s middle; the field record and the eye read the same rule; null without a board', () => {
    const T = g('hqFieldTransform');
    assert.equal(T(null), null); assert.equal(T({ N: 0, C: 1.75 }), null); assert.equal(T({ N: 8 }), null);
    for (const b of [{ N: 8, C: 1.7534 }, { N: 16, C: 1.7534 }, { N: 8, C: 1.75, half: 7 }, { N: 12, C: 1.7534246575342467 }]) {
        const tr = T(b);
        assert.equal(tr.half, b.half != null ? b.half : b.N * b.C / 2);
        for (let i = 0; i < 400; i++) {
            const x = (i * 0.37) % (b.N * b.C) - tr.half, z = (i * 0.61) % (b.N * b.C) - tr.half;
            const t = tr.toTile(x, z), back = tr.toRoom(t.tx, t.tz);
            assert.ok(Math.abs(back.x - x) < 1e-3 && Math.abs(back.z - z) < 1e-3, 'round trip within 1 mm');
            const c = tr.cellOf({ x, z });
            assert.ok(c.x >= 0 && c.y >= 0 && c.x < b.N && c.y < b.N);
            assert.equal(c.x, Math.floor(t.tx)); assert.equal(c.y, Math.floor(t.tz));
            const m = tr.centre(c), t2 = tr.toTile(m.x, m.z);
            assert.ok(Math.abs(t2.tx - (c.x + 0.5)) < 1e-9 && Math.abs(t2.tz - (c.y + 0.5)) < 1e-9, 'the centre is the middle');
            assert.ok(tr.inside({ x, z }));
        }
        const far = tr.cellOf({ x: 1e4, z: -1e4 }); assert.deepEqual(J(far), { x: b.N - 1, y: 0 });
        assert.ok(!tr.inside({ x: tr.half + 0.01, z: 0 }) && !tr.inside({ x: -tr.half - 0.01, z: 0 }));
    }
    /* the field record and the eye agree with the transform to the metre */
    const board = { N: 8, C: 1.7534, half: 7.0136 }, tr = T(board);
    const ev = { board, x: -2.2, z: 3.1, y: 0, target: { x: -0.7, z: 3.4 }, eye: { x: -4.0, y: 1.9, z: 2.0, dx: 0.7, dy: -0.4, dz: 0.3, ground: 0, px: -2.2, pz: 3.1 } };
    const F = g('hqEncounterField')(ev);
    assert.deepEqual(J(F.cells.walker), J(tr.cellOf({ x: -2.2, z: 3.1 })));
    assert.deepEqual(J(F.snap.walker), J(tr.centre(F.cells.walker)));
    const eye = g('hqEncounterEye')(ev, null), t = tr.toTile(-4.0, 2.0);
    assert.ok(Math.abs(eye.tx - t.tx) < 1e-9 && Math.abs(eye.tz - t.tz) < 1e-9, 'the eye seed is the transform');
    assert.ok(D.window.hqFieldTransform === T && typeof D.window.hqEncounterZones === 'function', 'on window');
});

test('D7 · THE ZONES ARE THE SEATS: explicit per seat (seat i is unit i\'s respawn tile), integer cells, `field: true`; null without both parties', () => {
    const Z = g('hqEncounterZones');
    assert.equal(Z(null), null); assert.equal(Z({ 1: [], 2: [{ x: 1, y: 1 }] }), null); assert.equal(Z({ 1: [{ x: 1, y: 1 }] }), null);
    const seats = { 1: [{ x: 3.0, y: 4 }, { x: 2, y: 4 }, { x: 3, y: 5 }], 2: [{ x: 4, y: 4 }, { x: 5, y: 4 }] };
    const z = Z(seats);
    assert.equal(z.field, true);
    assert.deepEqual(J(z[1]), [{ x: 3, y: 4 }, { x: 2, y: 4 }, { x: 3, y: 5 }]);
    assert.deepEqual(J(z[2]), [{ x: 4, y: 4 }, { x: 5, y: 4 }]);
    assert.equal(Object.keys(z).sort().join(','), '1,2,field');
    /* the seats from a real field record feed it end to end */
    const F = g('hqEncounterField')({ board: { N: 8, C: 1.75 }, x: -1.0, z: 0.2, target: { x: 0.9, z: 0.1 } });
    const S = g('hqEncounterSeats')(F, { W: 8, H: 8, n1: 4, n2: 4, free: () => true });
    const zz = Z(S);
    assert.equal(zz[1].length, 4); assert.equal(zz[2].length, 4);
    assert.deepEqual(J(zz[1][0]), J(S.lead[1])); assert.deepEqual(J(zz[2][0]), J(S.lead[2]));
    const all = zz[1].concat(zz[2]).map(c => c.x + ',' + c.y);
    assert.equal(new Set(all).size, 8, 'every respawn tile distinct');
});

test('D7 · SOURCE: the zone builder returns before the rows for a field (no flatten, no egress rewrite, no Arena spawn nexus, SPAWNS = the seats, _spawnIndex = the seat); every perk stands down on isFieldSpawnZones — the owner read, the spawn nexuses, the wash, the sanctuary curtain, the minimap; the respawn readers keep the tiles', () => {
    ['function isFieldSpawnZones() {', 'return !!(state.spawnZones && state.spawnZones.field);', 'window.isFieldSpawnZones = isFieldSpawnZones;',
     "if (isFieldSpawnZones()) return 0;   // THE FIELD", "if (isFieldSpawnZones()) return;   // THE FIELD: a Code Red fight on the seats has no spawn nexus to steal",
     "const zones = window.hqEncounterZones(seats);", "return { zones, index, seats };",
     "if (idx != null) unit._spawnIndex = idx;", "SPAWNS[1] = state.spawnZones[1].map(t => ({ x: t.x, y: t.y }));\n                SPAWNS[2] = state.spawnZones[2].map(t => ({ x: t.x, y: t.y }));\n                console.log('[SpawnZones] THE FIELD"].forEach(f => assert.ok(MP.includes(f), f));
    const branch = MP.indexOf('const _encSeated = _encounterPlaceSeats();');
    const ret = MP.indexOf('return;', branch);
    const flatten = MP.indexOf('_clearSpawnZoneTiles(state.spawnZones[1], z1);');
    const nex = MP.indexOf('_initArenaSpawnNexuses();\n        }');
    assert.ok(branch > 0 && ret > branch && flatten > ret && nex > ret, 'the field returns before the flatten and the Arena spawn nexuses');
    assert.ok(MP.indexOf('function getSpawnZoneOwnerAt(x, y) {') < MP.indexOf("if (isFieldSpawnZones()) return 0;   // THE FIELD"), 'the owner gate is inside getSpawnZoneOwnerAt');
    /* the end-of-round regen / scorch reads the owner (0 = nothing), the nexus branch is untouched */
    assert.ok(BT.includes("const zoneOwner = _zoneIsNexus ? (_nzAt.nexus.owner || 0) : getSpawnZoneOwnerAt(unit.x, unit.y);") && BT.includes("if (!zoneOwner) continue;"), 'the perk reads the owner');
    /* the renderer */
    ["if (!state.spawnZones || state.spawnZones.field) { _lastSpawnZoneSerial = ser; return; }",
     "if (!state.spawnZones || state.spawnZones.field) { _lastSanctuaryWallSerial = ser; return; }",
     "if (sz && !sz.field) {"].forEach(f => assert.ok(TR.includes(f), f));
    /* the respawn readers still read the tiles by seat / by zone */
    assert.ok(MP.includes("const home = (state.spawnZones && state.spawnZones[player]) || [];") && MP.includes("if (!homeNex) return { section: 'home', label: 'Spawn', tiles: home, home: true, locked: false };"), 'getRespawnZoneFor comes home to the seats');
});

test('D6 · SOURCE · three-renderer.js: THE SLIDE — H.snap owns the walker\'s frame (no input), eases both bodies (smoothstep), squares them up, moves the native\'s group, fires the callback once at the end; the API', () => {
    ['function _hqTickSnap(dt) {', 'if (H.snap) { _hqTickSnap(dt); return; }', 'var k = S.t * S.t * (3 - 2 * S.t);',
     'ch.entry.group.position.set(ch.x * U, ch.y * U, ch.z * U);', 'pl.targetYaw = Math.atan2(ch.x - pl.x, ch.z - pl.z);', 'ch.yaw = ch.targetYaw = Math.atan2(pl.x - ch.x, pl.z - ch.z);',
     'H.snap = null;\n            var cb = S.cb; S.cb = null;', 'function _hqEncounterSnap(spec, ms, cb) {', 'encounterSnap: _hqEncounterSnap,', "encounterEye: function () { return _hq ? _hqEncounterEye() : null; },",
     'snap: null,   // THE SLIDE (Delivery 6)'].forEach(f => assert.ok(TR.includes(f), f));
    assert.ok(TR.indexOf('if (H.snap) { _hqTickSnap(dt); return; }') < TR.indexOf('if (H.ride && H.ride.on) { _hqTickRide(dt); return; }'), 'the slide outranks the ride');
});

test('D6 · THE SLIDE in a vm: two bodies ease onto their cells over the beat, face each other, the callback fires exactly once, input is ignored meanwhile', () => {
    const start = TR.indexOf('    /* THE SLIDE (THE FIELD stage A'), end = TR.indexOf('    function _hqTickWalker(dt) {');
    assert.ok(start > 0 && end > start);
    const ctx = { console, Math, isFinite, performance: { now: () => 0 } };
    ctx._hqUnits = () => 73; ctx.HQ_FALL_MIN = 0.5; ctx._hqSurface = () => 0;
    const calls = [];
    const pl = { x: 0, z: 0, y: 0, visY: 0, yaw: 0, targetYaw: 0, air: false, moving: false, running: false, entry: { group: { position: { set: (x, y, z) => calls.push(['pl', x, y, z]) } } } };
    const ch = { id: 'hq-native-0', x: 3, z: 0, y: 0, visY: 0, yaw: 0, targetYaw: 0, entry: { group: { position: { set: (x, y, z) => calls.push(['ch', x, y, z]) } } } };
    ctx._hq = { player: pl, chars: [ch], snap: null };
    vm.createContext(ctx);
    vm.runInContext(TR.slice(start, end) + '\nthis._hqEncounterSnap = _hqEncounterSnap; this._hqTickSnap = _hqTickSnap;', ctx);
    let fired = 0;
    assert.equal(ctx._hqEncounterSnap({ walker: { x: 0.9, z: 0.9 }, target: { x: 2.6, z: 0.9 }, targetId: 'hq-native-0' }, 260, () => fired++), true);
    assert.ok(ctx._hq.snap);
    let n = 0; while (ctx._hq.snap && n++ < 40) ctx._hqTickSnap(0.05);   // 50 ms steps until the slide drops itself
    assert.ok(n >= 5 && n <= 7, 'the beat is ~260 ms (' + n + ' steps)');
    assert.equal(fired, 1, 'once');
    assert.equal(ctx._hq.snap, null, 'dropped at the end');
    assert.ok(Math.abs(pl.x - 0.9) < 1e-9 && Math.abs(pl.z - 0.9) < 1e-9, 'the walker on its cell');
    assert.ok(Math.abs(ch.x - 2.6) < 1e-9 && Math.abs(ch.z - 0.9) < 1e-9, 'the native on its cell');
    assert.ok(Math.abs(pl.targetYaw - Math.atan2(ch.x - pl.x, ch.z - pl.z)) < 1e-9 && Math.abs(ch.yaw - Math.atan2(pl.x - ch.x, pl.z - ch.z)) < 1e-9, 'squared up on each other');
    assert.ok(calls.some(c => c[0] === 'ch') && calls.some(c => c[0] === 'pl'), 'both groups moved');
    assert.equal(ctx._hqEncounterSnap({ walker: { x: 'x' } }, 260, null), false, 'a bad spec is refused');
    /* the walker tick hands the frame to the slide before the ride and before any key */
    assert.ok(TR.includes("if (H.snap) { _hqTickSnap(dt); return; }"));
});
