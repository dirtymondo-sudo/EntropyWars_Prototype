// hq-gun.test.js — THE DOOR WHEEL IN THE ROOM (DOOR_GUN_PLAN.md §5.1-5.2, Phase 3, 2026-09-25): hold MIDDLE CLICK
// for the wheel (the Threshold + the seven standing doors), LEFT CLICK stands the selected door on the floor, RIGHT
// CLICK turns its lane 45°, the door acts on the walker and the kickables in its lane (the gust blows, the maw draws).
// Guards: the room's wedges (nine, in order — the shot rows left for battle; Phase 4 added the capture wedge); the
// rules (the battle's cap and hits, a tile's metres); the record (sanitised, the cap folds the oldest, refusals, the
// clear, per room); the lane geometry (8 facings, the lane vs the radius); and the source sites: the renderer's
// wheel / aim / fire / build / tick / API, map.js's filer + clear + pill, index.html's #hqWheel + hint, the CSS.
// Repo-only tooling; `npm test`.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { loadGameData } = require('./load-data');
const D = loadGameData();
const g = name => vm.runInContext(name, D);
const TR = fs.readFileSync(__dirname + '/three-renderer.js', 'utf8');
const MP = fs.readFileSync(__dirname + '/map.js', 'utf8');
const IX = fs.readFileSync(__dirname + '/index.html', 'utf8');
const CSS = fs.readFileSync(__dirname + '/styles-base.css', 'utf8');
const R = g('HQ_GUN_RULES'), GR = g('DOOR_GUN_RULES'), DOORS = g('DOOR_GUN_DOORS');
const room = Object.keys(g('DOOR_HQ').rooms)[0];
const prof = () => ({ door: { hq: {} } });

test('THE ROOM WHEEL: the Threshold first, the ONE-WAY wedge (Phase 4), then the seven standing doors — nine wedges, none sealed while allUnlocked', () => {
    const w = g('doorGunWheel')(null, { room: true });
    assert.equal(w.map(x => x.key).join(','), 'threshold,capture,gust,archers,hell,maw,frost,laser,light');
    assert.equal(w.length, GR.wheel.wedges);
    assert.ok(GR.allUnlocked && w.every(x => !x.sealed));
    assert.ok(!w.some(x => x.key === 'swing' || x.key === 'dash'), 'the shot rows are battle verbs (hq-gun-carry.test.js guards the capture wedge)');
    assert.ok(GR.wheel.holdMs > 0 && GR.wheel.slow > 0 && GR.wheel.slow < 1, 'a hold, and the room slowed (never paused)');
});

test('THE RULES: the battle\'s cap and hits, a board tile in metres, the room round', () => {
    assert.equal(R.cap, GR.standingCap); assert.equal(R.cap, 2, 'the user: two per player');
    assert.equal(R.hits, GR.hits);
    assert.equal(R.cell, 1.75);
    assert.ok(R.actMs >= 1000 && R.gust.speed > 0 && R.maw.speed > 0 && R.faceStepDeg === 45);
});

test('THE RECORD: a placement files, the cap folds the oldest, bad rows are refused, the clear empties it, per room', () => {
    const p = prof();
    const a = g('hqGunDoorPlace')(p, { room, key: 'gust', x: 1, y: 0, z: 1, face: 44 });
    assert.ok(a.ok && a.row.face === 45 && a.row.hits === R.hits && a.count === 1, JSON.stringify(a));
    const b = g('hqGunDoorPlace')(p, { room, key: 'maw', x: 6, y: 0, z: 1, face: 0 });
    assert.ok(b.ok && b.count === 2 && !b.folded.length);
    const c = g('hqGunDoorPlace')(p, { room, key: 'laser', x: 11, y: 0, z: 1, face: 90 });
    assert.ok(c.ok && c.folded.length === 1 && c.folded[0].key === 'gust', 'the oldest folds');
    assert.equal(g('hqGunDoorRecord')(p).map(r => r.key).join(','), 'maw,laser');
    assert.equal(g('hqGunDoorPlace')(p, { room, key: 'swing', x: 3, y: 0, z: 3 }).reason, 'door', 'a shot row never stands');
    assert.equal(g('hqGunDoorPlace')(p, { room, key: 'threshold', x: 3, y: 0, z: 3 }).reason, 'door');
    assert.equal(g('hqGunDoorPlace')(p, { room: 'nowhere', key: 'gust', x: 3, y: 0, z: 3 }).reason, 'room');
    assert.equal(g('hqGunDoorPlace')(p, { room, key: 'gust', x: NaN, y: 0, z: 3 }).reason, 'spec');
    assert.equal(g('hqGunDoorPlace')(p, { room, key: 'gust', x: 6.5, y: 0, z: 1.2 }).reason, 'gap', 'too close to the maw');
    p.door.hq.gunPlaced.list.push({ room, key: 'bogus', x: 0, y: 0, z: 0 }, 'junk', null);
    assert.equal(g('hqGunDoorRecord')(p).length, 2, 'junk rows never read');
    assert.equal(g('hqGunDoorsIn')(p, room).length, 2); assert.equal(g('hqGunDoorsIn')(p, 'elsewhere').length, 0);
    assert.equal(g('hqGunDoorClear')(p), true); assert.equal(g('hqGunDoorRecord')(p).length, 0);
    assert.ok(!('gunDoors' in p.door.hq), 'the placed record never touches the earned-doors ledger');
});

test('THE LANE: a lane door covers the strip ahead (never behind, never beside), a radius door its disc, 8 facings', () => {
    const cov = g('hqGunDoorCovers');
    const gust = { key: 'gust', x: 0, z: 0, face: 90 };   // +x
    assert.ok(cov(gust, 3, 0.3) && cov(gust, 4 * R.cell - 0.1, 0));
    assert.ok(!cov(gust, -2, 0) && !cov(gust, 3, 1.2) && !cov(gust, 4 * R.cell + 0.5, 0));
    const maw = { key: 'maw', x: 0, z: 0, face: 0 };
    assert.ok(cov(maw, 2, 2) && cov(maw, -3, 0) && !cov(maw, 4, 0));
    const L = g('hqGunDoorLane');
    assert.deepEqual([L('gust', 0).dx, L('gust', 0).dz], [0, 1], 'face 0 = +z (the walker\'s yaw)');
    assert.deepEqual([L('gust', 90).dx, L('gust', 90).dz], [1, 0]);
    assert.equal(L('laser', 0).len, R.beamMaxM, 'the beam runs to the first wall (the renderer marches it)');
    assert.equal(new Set([0, 45, 90, 135, 180, 225, 270, 315].map(f => g('hqGunDoorSnapFace')(f + 10))).size, 8);
});

test('THE RENDERER: the wheel on the middle button, the aim, the shot, the live doors, the slowed room, the API', () => {
    assert.ok(/if \(e\.button === 1\) \{ e\.preventDefault\(\); if \(H\.gun\) \{ H\.gun\.mDown = true;/.test(TR), 'the middle button arms the wheel');
    assert.ok(/performance\.now\(\) - H\.gun\.mAt >= _hqGunWheelRules\(\)\.holdMs\) \{ H\.gun\.mDown = false; _hqGunWheelOpen\(\); \}/.test(TR), 'held past holdMs, it opens');
    assert.ok(/if \(e\.button === 1 && H\.gun\) \{ H\.gun\.mDown = false; if \(H\.gun\.wheel\) _hqGunWheelClose\(true\);/.test(TR), 'the release takes the wedge');
    assert.ok(/doorGunWheel\(H\.profile \|\| H\.opts\.profile \|\| null, \{ room: true \}\)/.test(TR), 'the wedges are data.js\'s');
    assert.ok(/if \(H\.gun && H\.gun\.door !== 'threshold'\) \{ if \(e\.button === 0\) _hqGunDoorFire\(\); else if \(e\.button === 2\) _hqGunDoorTurn\(\); \}/.test(TR), 'LEFT fires, RIGHT turns');
    assert.ok(/else if \(e\.button === 0\) _hqPortalFire\('a'\); else if \(e\.button === 2\) _hqPortalFire\('b'\);/.test(TR), 'the Threshold keeps its two buttons');
    assert.ok(/var wdt = \(H\.gun && H\.gun\.wheel\) \? dt \* _hqGunWheelRules\(\)\.slow : dt;/.test(TR) && /_hqTickWalker\(wdt\)/.test(TR), 'the room slows while the wheel is open');
    assert.ok(/_hqTickGunDoors\(wdt, now\)/.test(TR) && /_hqBuildGunDoors\(room, opts\)/.test(TR));
    assert.ok(/if \(a\.surf !== 'floor'\)/.test(TR), 'a standing door needs a floor');
    assert.ok(/H\.opts\.onGunDoorPlace\(spec\)/.test(TR), 'map.js files the shot');
    assert.ok(/pl\.mvx = \(pl\.mvx \|\| 0\) \+ ux \* add/.test(TR), 'the wind rides the carry');
    assert.ok(/new THREE\.SpotLight\(hex/.test(TR), 'the light door is a real light');
    ['gunDoor:', 'gunSelect:', 'gunWheelOpen:', 'gunDoorFire:', 'gunDoorTurn:', 'gunDoors:'].forEach(k => assert.ok(TR.includes(k), k));
    const blk = TR.slice(TR.indexOf('THE DOOR WHEEL IN THE ROOM (DOOR_GUN_PLAN.md'), TR.indexOf('    /* THE MOUTH: is the body in this threshold'));
    assert.ok(blk.length > 1000 && !/\bstate\.|_emit\(/.test(blk), 'viewer-local: nothing on state, nothing relayed');
});

test('MAP.JS + THE PAGE: the filer, the fresh-arrival clear, the pill, #hqWheel + its hint, the CSS', () => {
    assert.ok(/window\.hqGunDoorPlace\(p, spec\)/.test(MP) && /PS\.saveProfile\(idx, p\)/.test(MP));
    assert.ok(/window\.hqGunDoorClear\(p\)/.test(MP), 'a fresh arrival clears the standing doors with the pair');
    assert.ok(/gun: \(typeof _hqGunOpts === 'function'\)/.test(MP) && /onGunDoorPlace:/.test(MP));
    assert.ok(/L = STAND IT · R = TURN/.test(MP), 'the pill says the buttons');
    assert.ok(/<div id="hqWheel" class="hq-wheel"/.test(IX) && /HOLD MIDDLE CLICK = the door wheel/.test(IX));
    assert.ok(/\.hq-wheel-wedge\.hover/.test(CSS) && /\.hq-wheel-wedge\.sealed/.test(CSS));
    assert.ok(Object.keys(DOORS).filter(k => DOORS[k].kind === 'standing').every(k => DOORS[k].color != null), 'every standing door has a colour to wear');
});

test('Door Dash: a movement on C / the forward key twice, not a wedge, with the gun\'s shot; C still dives and descends', () => {
    const d = R.dash;
    assert.ok(d && d.m === 3 * R.cell && d.ms > 0 && d.ms <= 400 && d.cooldownMs >= 0 && d.tapMs > 0 && d.exitV > 0, 'three tiles, fast, a cooldown, a double-tap window');
    assert.ok(!g('doorGunWheel')(null, { room: true }).some(x => x.key === 'dash'), 'never on the room wheel');
    assert.equal(DOORS.dash.spell, 'raceDoorDash', 'the battle row is untouched');
    const fn = n => { const i = TR.indexOf('function ' + n + '('); assert.ok(i > 0, n); return TR.slice(i, TR.indexOf('\n    }\n', i)); };
    const can = fn('_hqDashCan');
    ['H.ride && H.ride.on', 'H.vehicle && H.vehicle.on', 'pl.swim', 'pl.climb', 'pl.sit', 'H.gun && H.gun.wheel', 'H.portal.issued'].forEach(s => assert.ok(can.includes(s), 'refuses: ' + s));
    const dash = fn('_hqDash');
    assert.ok(dash.includes('_hqGunFire(') && dash.includes('_hqGunShow(true)') && dash.includes('_hqDashDoor('), 'the gun fires (clip, flash, zap) and a door opens');
    assert.ok(fn('_hqDashEnd').includes('_hqDashDoor('), 'out of a second door');
    assert.ok(fn('_hqTickDash').includes('_hqPortalSweep('), 'a Threshold in the path is crossed');
    assert.ok(/if \(pl\.dash\) \{ _hqTickDash\(dt\); return; \}/.test(fn('_hqTickWalker')), 'the walker hands the frame to the dash');
    assert.ok(/k === 'c'\) \{ if \(_hqDash\(false\)\)/.test(TR), 'C dashes on foot');
    assert.ok(/H\._dashTapAt && nowT - H\._dashTapAt < _hqDashRules\(\)\.tapMs && _hqDash\(true\)/.test(TR), 'the forward key twice');
    assert.ok(/down = k\.c \? 1 : 0/.test(TR) && /\(k\.space \? 1 : 0\) - \(k\.c \? 1 : 0\)/.test(TR), 'C still dives / descends');
    assert.ok(/dash: function \(\) \{ return _hqDash\(true\); \}/.test(TR));
    assert.ok(IX.includes('C or W W = door dash') && MP.includes('C OR W TWICE = DOOR DASH'), 'the hints say how');
});
