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

test('THE RULES: a reach you can throw across, a cone, the gun REQUIRED (the user: not without the door gun), four gestures on 1–4, Arena · 4 as the fallback', () => {
    assert.ok(R.reach >= 2 && R.reach <= 6, 'arm\'s reach plus a step, never across the room');
    assert.ok(R.cone >= 30 && R.cone <= 90);
    assert.equal(R.gun, true);
    assert.ok(R.cooldownMs >= 600);
    assert.equal(Object.keys(R.keys).join(''), '1234');
    assert.equal(R.keys['1'], 'attack');
    ['magic', 'aoe', 'ultimate'].forEach(k => assert.ok(Object.values(R.keys).includes(k), k + ' is a cast chain the renderer knows'));
    Object.values(R.keys).forEach(k => assert.ok(R.labels[k], 'a label for ' + k));
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

test('THE GESTURES: 1 = the attack, 2–4 = the casts, anything else nothing', () => {
    const gs = g('hqEncounterGesture');
    assert.equal(gs('1'), 'attack'); assert.equal(gs('2'), 'magic'); assert.equal(gs('3'), 'aoe'); assert.equal(gs('4'), 'ultimate');
    assert.equal(gs('5'), null); assert.equal(gs('e'), null); assert.equal(gs(''), null); assert.equal(gs(null), null);
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

test('SOURCE · the renderer: the keys are named before the pinned line, 1–4 throw, the aim + line of sight, the one-shot on the walker, the strike frame, the API', () => {
    assert.ok(TR.includes("if (k === '1' || k === '2' || k === '3' || k === '4') return k;"), 'the gesture keys are named');
    assert.ok(TR.indexOf("if (k === '1' || k === '2' || k === '3' || k === '4') return k;") < TR.indexOf("|| k === 'q' || k === 'p') return k;"), 'before the pinned line (hq-floors.test.js)');
    assert.ok(TR.includes("if (k === '1' || k === '2' || k === '3' || k === '4') { e.preventDefault(); _hqStrikeKey(k); return; }"));
    ['function _hqStrikeKey(k)', 'function _hqEncounterAim()', 'function _hqLosClear(', 'function _hqStrikeClip(pl, gesture)'].forEach(f => assert.ok(TR.includes(f), f));
    assert.ok(TR.includes("var drawn = !!(H.portal && H.portal.drawn);") && TR.includes("var armed = drawn || R.gun === false;"), 'armed = the gun drawn');
    assert.ok(TR.includes("var target = armed ? _hqEncounterAim() : null;"), 'no aim without the gun');
    assert.ok(TR.includes("_attackChainFor(bk)") && TR.includes("chain = _castChainFor(gesture);"), 'the one chain tables (never inline)');
    assert.ok(TR.includes("var st = _slotStrikeMs(e._ew_def || pl.def, name, act);"), 'the encounter lands on the strike frame');
    assert.ok(TR.includes("if (bl.npc || bl.portal) continue;"), 'a person never blocks the line');
    assert.ok(TR.includes("if (ch.strike) { if (performance.now() < ch.strike.until && ch.jumpT < 0) want = ch.strike.name; else ch.strike = null; }"), 'the clip owns the rig');
    assert.ok(TR.includes("if (_hq !== H || H.paused) return;   // the room changed"), 'a swing that outlives the room never lands');
    assert.ok(TR.includes("        strike: _hqStrikeKey,") && TR.includes("encounterAim: function () { return _hq ? _hqEncounterAim() : null; },"), 'the API');
    assert.ok(TR.includes("if (H.opts.onEncounter) { try { H.opts.onEncounter({ gesture: gesture, target: target, room: room, x: pl.x, z: pl.z, y: pl.y, yaw: H.cam.yaw, pitch: H.cam.pitch }); }"), 'the eye rides the event (9.4 seam 2, later)');
});

test('SOURCE · map.js: the enter opts, the guards (wild room · the gun · the switch · never online), the launch, THE LAST ROSTER inside _msConfirm, the sticky config, the ward on a loss, the prompt, the officer row', () => {
    assert.ok(MP.includes("onStrike: (typeof _hqStrikeEvent === 'function') ? _hqStrikeEvent : null,") && MP.includes("onEncounter: (typeof _hqEncounterFire === 'function') ? _hqEncounterFire : null,"), 'guarded with typeof (scene-lifecycle.test.js evals _hqEnter alone)');
    assert.ok(MP.includes("if (!_hqEncounterEnabled() || !_hqEncounterRoomOkNow()) return false;"), 'the switch + the wild room');
    assert.ok(MP.includes("if (R.gun !== false && !drawn) return false;"), 'the gun');
    assert.ok(MP.includes("if (typeof window.isOnlineMatch === 'function' && window.isOnlineMatch()) return false;   // RULE #2"), 'never from an online seat');
    assert.ok(MP.includes("window.hqEncounterLaunch(_hqCurRoom, ev.target, _hqEncounterCfgRaw(), { gesture: ev.gesture })"));
    assert.ok(MP.includes("window._hqEncounterParty = party;") && MP.includes("const _encParty = window._hqEncounterParty || null;"), 'the roster hands through _msConfirm');
    assert.ok(MP.includes("if (_encParty && typeof _hqApplyLastParty === 'function' && _hqApplyLastParty(_encParty, 1, CONFIG.teamSize)) {"), 'seated after every config rule');
    assert.ok(MP.includes("try { okStart = applyPartyBuild(false) !== false; if (okStart) startMatch(); }"), 'the builder is skipped (the tutorial\'s recipe)');
    assert.ok(MP.includes("if (!party) {") && MP.includes("return window._hqLaunchMission(L.site, { delta: true, doorId: L.doorId, doorLabel: 'THE ENCOUNTER', counterId: L.counterId, variant: 'site', roster: L.roster });"), 'no roster → the terminal, once');
    assert.ok(MP.includes("_hqEncounterRememberCfg(gm.id, _msSelectedTeamSize, _msSelectedRounds)"), 'a filed crossing is the next encounter\'s config');
    assert.ok(MP.includes("if (encRes && !encRes.won && enabled && _hqHome && DOOR_HQ.rooms && DOOR_HQ.rooms.medical) { _hqLastRoom = 'medical'; _hqLastDoor = null; }"), 'a loss is the ward');
    assert.ok(MP.includes("[1] ATTACK · [2–4] CAST · ENGAGE"), 'the prompt');
    assert.ok(MP.includes("window.hqEncounterLog(profile)"), 'the officer sheet');
    assert.ok(MP.includes("window._hqEncounterRun = { site: L.site,") && MP.includes("noIntro: true"), 'the run marker with the per-launch intro flag');
});

test('SOURCE · battle.js: the intro cinematic is off PER LAUNCH (never the global switch), the commit records win or lose and leaves the result for the return', () => {
    assert.ok(BT.includes("if (window._hqEncounterRun && window._hqEncounterRun.noIntro) return false;"), '_introCineEligible');
    assert.ok(BT.includes("!(window._hqEncounterRun && window._hqEncounterRun.noIntro) && !state.devAutoSim"), 'the leaf warm-up too');
    assert.ok(!BT.includes("window.EW_DISABLE_INTRO_CINE = true;   // encounter"), 'never the global switch');
    assert.ok(BT.includes("const erun = window._hqEncounterRun;") && BT.includes("hqEncounterRecord(p, { site: erun.site, room: erun.room, race: erun.race, won,"), 'the record on the commit');
    assert.ok(BT.includes("window._hqEncounterResult = { won, site: erun.site, room: erun.room, race: erun.race, label: erun.label || erun.race };"));
});

test('SOURCE · index.html: the hint under the door gun\'s', () => {
    assert.ok(IX.includes('1 attack · 2–4 cast = ENGAGE a native'));
});
