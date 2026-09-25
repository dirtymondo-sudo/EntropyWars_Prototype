// encounter-arrival.test.js — THE ARRIVAL (2026-09-22): the seam from the walk into the fight is ONE camera move.
// The user: "still a little janky, and it zooms out way too much to an over-the-board view — fluid, stylish,
// cinematic, seamless, no cuts, no loads." Guards: the walker's heading as a board yaw (data.js hqEncounterYawOf,
// carried by both eye reads), THE MEDIUM TWO-SHOT (hqEncounterArrival), the rules table, THE CRANE in
// three-camera.js run in a vm (the gaze leads the body, the eye bows over the line, the lens tightens late and a
// preset FOV mid-swoop is deferred, it lands home; the straight tween without opts is untouched), and the source
// sites on both sides (battle.js's frame + beat in place of the overview reset and the ROUND 1 card, the CSS, the
// token). Repo-only.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { loadGameData } = require('./load-data');
const D = loadGameData(), R = D.HQ_ENCOUNTER_RULES;
const g = name => vm.runInContext(name, D);
const CAM = fs.readFileSync(__dirname + '/three-camera.js', 'utf8');
const BT = fs.readFileSync(__dirname + '/battle.js', 'utf8');
const CSS = fs.readFileSync(__dirname + '/styles-cinematic.css', 'utf8');
const IX = fs.readFileSync(__dirname + '/index.html', 'utf8');
const ST = fs.readFileSync(__dirname + '/state.js', 'utf8');

test('the rules: HQ_ENCOUNTER_RULES.arrival + hqEncounterArrivalRules (defaults for a missing row)', () => {
    assert.ok(R.arrival && R.arrival.crane, 'the table');
    const A = g('hqEncounterArrivalRules')();
    assert.equal(A.tilt, R.arrival.tilt); assert.equal(A.swoopS, R.arrival.swoopS); assert.equal(A.crane.bow, R.arrival.crane.bow);
    assert.ok(A.tilt > 40 && A.tilt <= 62, 'lower than the board\'s 40, inside REST_TILT_MAX: ' + A.tilt);
    assert.ok(A.swoopS >= 1.6 && A.swoopS <= 3.5, 'a crane, not a cut: ' + A.swoopS);
    assert.ok(A.crane.lookLead >= 1 && A.crane.fovLate >= 0 && A.crane.fovLate < 1);
});

test('hqEncounterYawOf: the board camera looks along (−sin yaw, −cos yaw) — north 0 · west 90 · south 180 · east 270; a zero gaze is null', () => {
    const yaw = g('hqEncounterYawOf');
    assert.equal(yaw(0, -1), 0); assert.equal(yaw(-1, 0), 90); assert.equal(yaw(0, 1), 180); assert.equal(yaw(1, 0), 270);
    assert.equal(yaw(-1, -1), 45); assert.equal(yaw(0, 0), null); assert.equal(yaw(NaN, 1), null);
});

test('both eye reads carry the heading: hqEncounterEye (the room frame) and hqEncounterEyeFromSeats (rotated — the native east, the yaw 270)', () => {
    const eye = g('hqEncounterEye'), board = { N: 8, C: 1.75, half: 7 };
    const P = eye({ eye: { x: -7, y: 1.9, z: 7, dx: 0, dy: -0.6, dz: -0.8, ground: 0 }, board });
    assert.equal(P.yaw, 0, 'looking north');
    assert.equal(eye({ eye: { x: 0, y: 1, z: 0, dx: 1, dy: 0, dz: 0, ground: 0 }, board }).yaw, 270, 'looking east');
    const field = { eye: { x: -2, y: 1.6, z: 0, dx: 1, dy: -0.2, dz: 0, ground: 0 }, walker: { x: 0, z: 0 }, heading: 0 };
    const S = g('hqEncounterEyeFromSeats')(field, { lead: { 1: { x: 3, y: 3 } }, W: 8, H: 8 });
    assert.equal(S.yaw, 270, 'P2 stands east of P1 — the frame looks east');
});

test('hqEncounterArrival: the focal `lead` of the way from the officer to the native, the eye\'s yaw (else the fallback), the rules\' tilt; no foe frames the lead; no lead → null', () => {
    const arr = g('hqEncounterArrival');
    const fr = arr({ yaw: 300 }, { x: 2, y: 5 }, { x: 4, y: 5 });
    assert.ok(Math.abs(fr.x - (2 + 2 * R.arrival.lead)) < 1e-9 && fr.y === 5, 'the two-shot\'s focal: ' + JSON.stringify(fr));
    assert.equal(fr.yaw, 300); assert.equal(fr.tilt, R.arrival.tilt);
    assert.equal(arr({ dx: 0, dz: 1 }, { x: 0, y: 0 }, { x: 1, y: 0 }).yaw, 180, 'a yaw off the gaze when the eye carries none');
    assert.equal(arr(null, { x: 0, y: 0 }, null, { fallbackYaw: 45 }).yaw, 45);
    assert.equal(arr({ yaw: 0 }, { x: 3, y: 3 }, null).x, 3, 'no foe: the lead alone');
    assert.equal(arr({ yaw: 0 }, null, { x: 1, y: 1 }), null);
    assert.equal(arr({ yaw: 0 }, { x: 0, y: 0 }, { x: 4, y: 0 }, { lead: 0.5, tilt: 55 }).x, 2); assert.equal(arr({ yaw: 0 }, { x: 0, y: 0 }, { x: 4, y: 0 }, { lead: 0.5, tilt: 55 }).tilt, 55);
});

function camHarness() {
    let nowMs = 1000;
    const camObj = { position: { x: 0, y: 0, z: 0, set(x, y, z) { this.x = x; this.y = y; this.z = z; } }, up: { set() {} }, look: null, aspect: 1, fov: 45, lookAt(x, y, z) { this.look = [x, y, z]; }, updateProjectionMatrix() {} };
    const ctx = vm.createContext({ window: {}, performance: { now: () => nowMs }, console, Math, Number, isFinite,
        THREE: { PerspectiveCamera: function () { return camObj; }, Vector2: function () {}, Vector3: function () {}, Raycaster: function () {}, Plane: function () {} } });
    vm.runInContext(CAM + '\nthis.ThreeCamera = ThreeCamera;', ctx);
    const C = ctx.ThreeCamera; C.create(960, 540);
    return { C, camObj, tick: (ms) => { nowMs += ms; }, now: () => nowMs };
}

test('THE CRANE (vm): the first frame is the seed; the eye bows ABOVE the straight line mid-way; the gaze lands before the body; a preset FOV mid-swoop is deferred to the landing; it lands home', () => {
    const { C, camObj, tick } = camHarness();
    const cam = { x: 3, y: 3, zoom: 1.5, tilt: 50, yaw: 0 };
    C.sync(cam); const home = [camObj.position.x, camObj.position.y, camObj.position.z], homeLook = camObj.look.slice();
    C.snapImmediate();
    const seed = { tx: 2, tz: 8, up: 1, dx: 0, dy: -0.3, dz: -1, fov: 52 };
    assert.equal(C.seedPose(seed, 2.0, { bow: 0.22, lookLead: 1.18, fovLate: 0.35 }), true);
    assert.equal(C.seedState().crane, true);
    tick(16); C.sync(cam);
    assert.ok(Math.abs(camObj.position.x - 2 * 128) < 1e-6 && Math.abs(camObj.position.z - 8 * 128) < 1e-6 && Math.abs(camObj.position.y - 128) < 1e-6, 'the first frame IS the seed');
    assert.equal(camObj.fov, 52, 'the first frame wears the walker\'s lens');
    const from = [camObj.position.x, camObj.position.y, camObj.position.z];
    /* the preset re-applied mid-swoop (getCameraMode → setFOV) must not touch the live lens */
    tick(300); C.sync(cam); C.setFOV(45); assert.ok(Math.abs(camObj.fov - 52) < 1.5, 'the lens is untouched by setFOV under the tween: ' + camObj.fov);
    /* mid-way: the eye stands ABOVE the chord between the seed and home (the bow) */
    tick(700); C.sync(cam);
    const u = 1016 / 2000, chordY = from[1] + (home[1] - from[1]) * (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
    assert.ok(camObj.position.y > chordY + 20, 'the bow lifts the eye over the line: ' + camObj.position.y + ' vs ' + chordY);
    /* the gaze arrives before the body */
    tick(650); C.sync(cam);
    const dLook = Math.hypot(camObj.look[0] - homeLook[0], camObj.look[1] - homeLook[1], camObj.look[2] - homeLook[2]);
    const dPos = Math.hypot(camObj.position.x - home[0], camObj.position.y - home[1], camObj.position.z - home[2]);
    assert.ok(dLook < 2 && dPos > 4, 'the pan lands before the dolly: look ' + dLook + ' pos ' + dPos);
    /* the landing */
    for (let i = 0; i < 40; i++) { tick(16); C.sync(cam); }
    assert.ok(Math.hypot(camObj.position.x - home[0], camObj.position.y - home[1], camObj.position.z - home[2]) < 1, 'home');
    assert.ok(Math.abs(camObj.fov - 45) < 0.05, 'the lens landed on the deferred preset: ' + camObj.fov);
    assert.equal(C.seedState().crane, false);
    /* past the window setFOV writes the lens again */
    C.setFOV(50); assert.equal(camObj.fov, 50);
});

test('the straight tween without opts is untouched: monotone toward home, no bow, the smoothstep', () => {
    const { C, camObj, tick } = camHarness();
    const cam = { x: 3, y: 3, zoom: 1, tilt: 50, yaw: 0 };
    C.sync(cam); const home = [camObj.position.x, camObj.position.y, camObj.position.z];
    C.snapImmediate(); C.seedPose({ tx: 2, tz: 6, up: 1, dx: 0, dy: -0.3, dz: -1 }, 1.4); tick(16); C.sync(cam);
    assert.equal(C.seedState().crane, false);
    let prev = Infinity;
    for (let i = 0; i < 100; i++) { tick(16); C.sync(cam); const d = Math.hypot(camObj.position.x - home[0], camObj.position.y - home[1], camObj.position.z - home[2]); assert.ok(d <= prev + 1e-6, 'monotone'); prev = d; }
    assert.ok(prev < 12);
});

test('the source sites: battle.js frames the two-shot in place of the overview reset and the arrival beat in place of the ROUND 1 card; the CSS; the token', () => {
    assert.ok(BT.includes("ThreeCamera.seedPose(eye, _ar.swoopS, _ar.crane)") && BT.includes("_er.eyeSeeded = eye || null;"), 'the crane seed + the eye kept on the run');
    assert.ok(BT.includes("else if (!(_encRun() && _encArrivalFrame())) resetBoardCamera(true);"), 'never the overview for an encounter');
    assert.ok(BT.includes("} else if (_encRun() && _encArrivalRound(() => encounterOpening(() => maybeAdvanceTurn()))) {"), 'no ROUND 1 card (the door\'s opening lands first, DOOR_GUN_PLAN §5.3)');
    assert.ok(BT.includes("camera.snap({ x: fr.x, y: fr.y, zoom: zoom, tilt: fr.tilt, yaw: fr.yaw });") && BT.includes("getTurnFramingZoom() * A.zoomMult"), 'the snap files the fight\'s resting orientation at the turn framing');
    assert.ok(BT.includes("document.body.classList.add('enc-arrival');") && BT.includes("document.body.classList.add('enc-arrived'); document.body.classList.remove('enc-arrival');") && BT.includes("bars.className = 'enc-arrival-bars'"), 'the HUD fade + the bars');
    assert.ok(CAM.includes("if (_seedFrom && _seedFrom.fov) { _seedFrom.fovTo = f; return; }") && CAM.includes("function _seedEaseK(u)"), 'the lens guard + the ease');
    ['body.enc-arrival #sidebarPanel', 'body.enc-arrived #css2dOverlay { transition: opacity', '.enc-arrival-bars.in .enc-arrival-bar { height: var(--enc-bars)', '.enc-arrival-bars.out .enc-arrival-bar { height: 0'].forEach(k => assert.ok(CSS.includes(k), k));
    assert.match(IX, /\?v=\d{8}[a-z0-9-]*-cors/); assert.ok(!IX.includes('20260922-seamless-field-05-cors'), 'the token moved');
});

/* THE FIRST STRIKE (2026-09-22): the officer who swung opens round 1 — measured headlessly: the catgirl (SPD 70) took the first
   activation while the arrival framed the officer, which the user felt as "I have to select my unit first". */
test('THE FIRST STRIKE: battle.js sets the marker BEFORE the order is built, clears it at the latch; state.js consumes it on round 1 and puts the unit first', () => {
    const iSet = BT.indexOf("if (_lf) window._ewEncounterFirstId = _lf.id;"), iBuild = BT.indexOf("_applyRoundStartPassives();\n                buildBlitzTurnOrder();\n            }\n\n            if (state.squadLeaderMode)");
    assert.ok(iSet > 0 && iBuild > 0 && iSet < iBuild, 'the marker stands before the first buildBlitzTurnOrder of _afterVSSplash');
    assert.ok(BT.includes("_encMatch = null; window._ewEncounterFirstId = null;"), 'a stale marker never reaches another match');
    assert.ok(ST.includes("if (typeof window !== 'undefined' && window._ewEncounterFirstId && state.round === 1) {") && ST.includes("const _fid = window._ewEncounterFirstId; window._ewEncounterFirstId = null;") && ST.includes("_ids.splice(_fi, 1); _ids.unshift(_fid); state._blitzTurnOrderIds = _ids; rebuildBlitzTurnOrderFromIds();"), 'state.js: consumed, round 1, to the front');
    assert.ok(ST.indexOf("window._tutTurnOrder()") < ST.indexOf('/* THE ENCOUNTER — THE FIRST STRIKE'), 'after the tutorial\'s own hook (a lesson still dictates its order)');
});
