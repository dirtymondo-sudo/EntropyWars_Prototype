/* THE WORLD CLOCK (OPEN_WORLD_PLAN Phase 3, 2026-09-26): the exploration day — the hour's continuity across a save, the sun at
   noon and midnight, the dawn / dusk / lamp curves, which rooms ride the clock and which keep their hour, the ground weenies'
   bearings, the variants on the world hour; the renderer's lit values for a clocked, a locked and an unclocked room on real
   three r128 in a vm (skipped when three is not installed); the source pins that wire it (the dome's uniforms, the arm at the
   entry and the crossing, the fight's rig and its first round, the pause's hold). */
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { loadGameData } = require('./load-data');

const src = f => fs.readFileSync(path.join(__dirname, f), 'utf8');
const TR = src('three-renderer.js'), MP = src('map.js');
const D = loadGameData();
const G = n => vm.runInContext(n, D);
const CK = G('HQ_WORLD_CLOCK');

test('the sun: noon high in the south, midnight under the world with the moon up; dawn and dusk ease the day; the lamps burn the night', () => {
    const S = G('hqWorldSun');
    const noon = S((CK.sun.rise + CK.sun.set) / 2);
    assert.ok(Math.abs(noon.sunEl - CK.sun.noonEl) < 0.01 && Math.abs(noon.sunAz - 180) < 0.01, 'noon: the sun at noonEl due south');
    assert.equal(noon.day, 1); assert.equal(noon.lamp, 0); assert.ok(noon.isDay); assert.ok(noon.moonEl < 0, 'the moon is down at noon');
    const mid = S(0.5);
    assert.ok(mid.sunEl < -20 && mid.moonEl > 30, 'midnight: the sun far under, the moon high');
    assert.equal(mid.day, 0); assert.equal(mid.lamp, 1); assert.ok(!mid.isDay);
    assert.ok(Math.abs(S(CK.sun.rise).sunEl) < 1e-9 && Math.abs(S(CK.sun.rise).sunAz - CK.sun.riseAz) < 1e-9, 'the sun rises on riseAz');
    assert.ok(Math.abs(S(CK.sun.set).sunAz - CK.sun.setAz) < 1e-9, 'and sets on setAz');
    const dawnMid = S((CK.dawn[0] + CK.dawn[1]) / 2), duskMid = S((CK.dusk[0] + CK.dusk[1]) / 2);
    assert.ok(dawnMid.day > 0.3 && dawnMid.day < 0.7 && duskMid.day > 0.3 && duskMid.day < 0.7, 'half-way through dawn and dusk is half a day');
    assert.ok(dawnMid.dusk > 0.9 && duskMid.dusk > 0.9 && noon.dusk === 0 && mid.dusk === 0, 'the warm horizon peaks at dawn and dusk only');
    /* continuity: no step anywhere on the dial (every 3 minutes of the world, a small move) */
    let last = S(0);
    for (let h = 0.05; h < 24; h += 0.05) {
        const s = S(h);
        const dAz = Math.abs(((s.sunAz - last.sunAz + 540) % 360) - 180), dMz = Math.abs(((s.moonAz - last.moonAz + 540) % 360) - 180);
        assert.ok(Math.abs(s.sunEl - last.sunEl) < 1.2 && dAz < 2.5 && Math.abs(s.moonEl - last.moonEl) < 1.2 && dMz < 2.5, 'the bodies glide at ' + h.toFixed(2));
        assert.ok(Math.abs(s.day - last.day) < 0.1 && Math.abs(s.lamp - last.lamp) < 0.11, 'day and lamps ease at ' + h.toFixed(2));
        last = s;
    }
    assert.ok(S(CK.lampsOn + CK.lampFadeH / 2).lamp > 0.4 && S(CK.lampsOn + CK.lampFadeH / 2).lamp < 0.6, 'the lamps come up over lampFadeH from lampsOn');
    assert.equal(S(CK.lampsOff + CK.lampFadeH + 0.01).lamp, 0, 'and are out after lampsOff');
});

test('the hour is the profile\'s: a save mid-walk ran on by the minutes since; a held save waits; a new profile starts at start', () => {
    const read = G('hqClockRead'), write = G('hqClockWrite'), rate = G('hqClockRate')();
    assert.equal(rate, 24 / (CK.dayMin * 60), 'a day of dayMin real minutes');
    assert.equal(read(null, Date.now()), CK.start); assert.equal(read({ door: { hq: {} } }, 0), CK.start);
    const p = {}; const t0 = 1_700_000_000_000;
    write(p, 23.5, t0, true);
    assert.ok(p.door && p.door.hq && p.door.hq.clock && p.door.hq.clock.run === true, 'the record lives on door.hq.clock');
    const mins = 30;   // half an hour of real time away = 30 world hours at 24 min a day
    assert.ok(Math.abs(read(p, t0 + mins * 60 * 1000) - ((23.5 + mins * 60 * rate) % 24)) < 1e-6, 'the world ran on, wrapping past midnight');
    write(p, 23.5, t0, false);
    assert.equal(read(p, t0 + 3600 * 1000), 23.5, 'a held hour waits for the player');
    assert.equal(G('hqClockNorm')(-1), 23); assert.equal(G('hqClockNorm')(49), 1);
});

test('which rooms ride the clock: the open parts of a clocked zone; the locked ones keep their hour; interiors and unclocked zones are not on it', () => {
    const RC = G('hqRoomClock');
    const dt = RC('site_prebuilt_downtown_streets');
    assert.ok(dt && !dt.locked && dt.zone === 'city' && dt.rot === 0, 'Downtown rides the clock');
    assert.equal(RC('site_prebuilt_stadium_bowl').rot, 2, 'the bowl turned half round carries its turn');
    const strip = RC('site_prebuilt_strip_streets');
    assert.ok(strip && strip.locked && strip.hour === CK.lock.site_prebuilt_strip_streets, 'the Strip keeps its neon night (fork 4)');
    for (const id of Object.keys(CK.lock)) { const c = RC(id); assert.ok(c && c.locked, id + ' is locked'); assert.ok(!G('hqWorldSun')(c.hour).isDay, id + ' is locked at night'); }
    assert.ok(RC('site_prebuilt_camelot_ward').dayLook, 'a night-authored room that rides the clock names its day look');
    for (const id of ['medwing', 'site_prebuilt_downtown_mall', 'site_prebuilt_camelot_keep', 'site_prebuilt_dumb_motorpool', 'site_prebuilt_gobekli_tell', 'central_egress']) assert.equal(RC(id), null, id + ' is not on the clock');
    const W = G('HQ_WORLD'), R = G('DOOR_HQ').rooms;
    for (const id of Object.keys(CK.dayLook)) assert.ok(R[id] && R[id].shell.sky && R[id].shell.sky.night, id + ': a dayLook is for a night-authored room');
    for (const id of Object.keys(CK.lock)) assert.ok(R[id] && W.zones[G('hqWorldZoneOf')(id)].clock, id + ': a lock is for a room of a clocked zone');
});

test('the directions: a bearing seen from a turned room; the weenies stand at their true bearing from the frames', () => {
    const dir = G('hqWorldDir');
    const n = dir(0, 0, 0); assert.ok(Math.abs(n.z + 1) < 1e-9, 'north is −z');
    const e = dir(90, 0, 0); assert.ok(Math.abs(e.x - 1) < 1e-9, 'east is +x');
    const n2 = dir(0, 0, 2); assert.ok(Math.abs(n2.z - 1) < 1e-9, 'a room turned half round sees the ground\'s north behind it');
    assert.ok(Math.abs(dir(0, 90, 0).y - 1) < 1e-9, 'straight up');
    const LM = G('hqRoomLandmarks');
    const strip = LM('site_prebuilt_strip_streets');
    const gate = strip.find(l => l.kind === 'gate'), mtn = strip.find(l => l.kind === 'mountain');
    assert.ok(gate && Math.abs(gate.deg - 180) < 1, 'Area 51\'s gate is due south down the Strip');
    const Fs = D.hqWorldFrame('site_prebuilt_strip_streets'), Fo = D.hqWorldFrame('site_prebuilt_olympus_summit');
    const trueDeg = (Math.atan2(Fo.x - Fs.x, -(Fo.z - Fs.z)) * 180 / Math.PI + 360) % 360;
    assert.ok(mtn && Math.abs(((mtn.deg - trueDeg + 540) % 360) - 180) < 1 && (mtn.deg < 15 || mtn.deg > 345), 'Olympus north, at its frame\'s bearing (OPEN WORLD Phase 6: the summit stands north-north-east, above the ward\'s postern)');
    const a51 = LM('site_prebuilt_area51_flightline');
    assert.ok(a51.find(l => l.kind === 'peak') && a51.find(l => l.kind === 'tower'), 'the flightline keeps THE RANGE and gains the city\'s towers');
    const bowl = LM('site_prebuilt_stadium_bowl').find(l => l.kind === 'mountain');
    const dt = LM('site_prebuilt_downtown_streets').find(l => l.kind === 'mountain');
    assert.ok(bowl && dt && Math.abs(((bowl.deg - 180 - dt.deg + 540) % 360) - 180) < 8, 'the turned bowl sees Olympus where Downtown does, less its half turn');
    const WW = G('HQ_WORLD_WEENIES'), kinds = new Set();
    for (const id of Object.keys(WW)) for (const w of WW[id]) { kinds.add(w.kind); assert.ok(G('hqWorldBearing')(id, w.toward), id + ' → ' + w.toward + ' on one ground'); }
    assert.deepEqual([...kinds].sort(), ['gate', 'mountain', 'tower'], 'the three new kinds are all hung');
    for (const k of ['mountain', 'tower', 'gate']) assert.match(TR, new RegExp('^        ' + k + ': function \\(U, o, rng\\) \\{', 'm'), 'the renderer builds `' + k + '`');
});

test('the variants read the world hour (fork 11) unless a real Date is pinned', () => {
    const roll = G('hqVariantRoll'), prof = { door: { hq: { variantSeed: 3, visits: 1 } } };
    assert.equal(roll('site_prebuilt_downtown_subway', prof, { hour: 8.5 }), 'rush_hour');
    assert.equal(roll('site_prebuilt_downtown_subway', prof, { hour: 2 }), 'last_train');
    assert.equal(roll('site_prebuilt_downtown_subway', prof, { hour: 14 }), null);
    const p2 = { door: { hq: { variantSeed: 3, visits: 1 } } }; G('hqClockWrite')(p2, 8.25, Date.now(), false);
    assert.equal(roll('site_prebuilt_downtown_subway', p2, {}), 'rush_hour', 'no hour given: the profile\'s saved hour');
    assert.equal(CK.variants, 'world');
});

test('the renderer lights a room by the hour (real three r128 in a vm): the sun keys the day, the moon the night, a locked room keeps its own, lamps follow', () => {
    let THREE = null; try { THREE = require('three'); } catch (e) { THREE = null; }
    if (!THREE || !THREE.Color) { console.log('  (three r128 not installed — skipped)'); return; }
    const a = TR.indexOf('    function _hqStageSkyVals(room, id) {'), b = TR.indexOf('    function _hqStageBlendStart(');
    const c = TR.indexOf('    var _hqRoomIdCache = '), d = TR.indexOf('    /* THE FEET past the edge');
    assert.ok(a > 0 && b > a && c > 0 && d > c, 'the blocks are where the test reads them');
    let hour = 12.5;
    const LR = G('HQ_LIGHT_RULES');
    const ctx = vm.createContext({ THREE, Math, Object, Array, WeakMap, performance: { now: () => 0 }, console: { log() {}, warn() {} },
        window: { _hqClockHour: () => hour }, HQ_WORLD_CLOCK: CK, hqRoomClock: G('hqRoomClock'), hqWorldSun: G('hqWorldSun'), hqWorldDir: G('hqWorldDir'),
        _hqData: () => G('DOOR_HQ'), _hqLightRules: () => LR, _hqUnits: () => 1, _gradeHorizonScenery: () => {} });
    const e = TR.indexOf('    function _hqDryFog('), f = TR.indexOf('\n', e);   // the sea's dry fog (THE DEEP): the clock's fog reads it
    assert.ok(e > 0, '_hqDryFog');
    vm.runInContext(TR.slice(a, b) + TR.slice(c, d) + TR.slice(e, f) + '\nthis.vals = _hqClockVals; this.arm = _hqClockArm; this.tick = _hqClockTick; this.lamps = _hqClockLamps; this.sv = _hqStageSkyVals;', ctx);
    const R = G('DOOR_HQ').rooms, LRo = LR.open;
    const dt = R.site_prebuilt_downtown_streets;
    const noon = ctx.vals(dt, 'site_prebuilt_downtown_streets', 12.5);
    assert.ok(noon && !noon.locked && Math.abs(noon.keyI - LRo.daySun) < 1e-6 && Math.abs(noon.hemiI - LRo.dayHemi) < 1e-6, 'noon: the day rows');
    assert.ok(noon.keyDir.y > 0.8 && noon.keyDir.z > 0.2, 'the key is the high sun, from the south (+z)');
    assert.equal(noon.env.day, 1); assert.ok(noon.fogC.getHex() === dt.shell.sky.fog.color, 'a day room at noon wears its own fog');
    const night = ctx.vals(dt, 'site_prebuilt_downtown_streets', 0.5);
    assert.ok(Math.abs(night.keyI - LRo.nightSun) < 0.02 && Math.abs(night.hemiI - LRo.nightHemi) < 1e-6 && night.env.day === 0 && night.night === 1, 'midnight: the moon keys the night rows');
    assert.ok(night.keyDir.z > 0.2, 'the moon crosses the southern sky at midnight (+z), as the sun did at noon');
    const fn = night.fogC, fd = noon.fogC; assert.ok(fn.r + fn.g + fn.b < (fd.r + fd.g + fd.b) * 0.4, 'the night fog is dark');
    assert.ok(night.keyDir.y >= Math.sin(CK.keyMinEl * Math.PI / 180) - 1e-9, 'the key never lower than keyMinEl');
    const bowlN = ctx.vals(R.site_prebuilt_stadium_bowl, 'site_prebuilt_stadium_bowl', 12.5);
    assert.ok(bowlN.keyDir.z < -0.2, 'the bowl turned half round sees the noon sun behind its own north');
    const strip = ctx.vals(R.site_prebuilt_strip_streets, 'site_prebuilt_strip_streets', 12.5);
    assert.ok(strip.locked && strip.fogC === undefined && strip.lamp === 1, 'the Strip at noon is still its own night');
    assert.ok(ctx.sv(R.site_prebuilt_strip_streets, 'site_prebuilt_strip_streets').fogC.getHex() === R.site_prebuilt_strip_streets.shell.sky.fog.color, 'a locked part blends to its authored values');
    assert.equal(ctx.vals(R.medwing, 'medwing', 12.5), null, 'an interior is not on the clock');
    const cw = ctx.vals(R.site_prebuilt_camelot_ward, 'site_prebuilt_camelot_ward', 12.5);
    assert.equal(cw.fogC.getHex(), CK.dayLook.site_prebuilt_camelot_ward.fog, 'a night room at noon wears its day look');
    /* the visit: arm, the lamps follow the hour, the key eases toward the sun */
    const lamp = new THREE.PointLight(0xffffff, 1.2); lamp._ew_lampI = 1.2;
    const glow = { material: { color: new THREE.Color(1, 1, 1) } }; glow._ew_glowC = glow.material.color.clone();
    const H = { room: dt, opts: { room: 'site_prebuilt_downtown_streets' }, scene: { fog: new THREE.FogExp2(0, 0.01) }, hemiLight: new THREE.HemisphereLight(0, 0, 0),
                keyLight: new THREE.DirectionalLight(0, 0), keyDir: new THREE.Vector3(1, 0, 0), sky: { tint: new THREE.Color(), fogC: new THREE.Color(), night: 1, clockLamps: [glow] }, clockLamps: [lamp], stage: null };
    ctx.arm(H);
    assert.ok(H.clock && H.clock.id === 'site_prebuilt_downtown_streets' && Math.abs(H.keyLight.intensity - LRo.daySun) < 1e-6 && H.sky.night === 0, 'armed at noon: the day on the lights');
    assert.equal(lamp.intensity, 0, 'a night lamp is out at noon'); assert.equal(glow.material.color.r, 0, 'and its glow');
    hour = 23;
    for (let i = 1; i <= 40; i++) ctx.tick(H, 0.1, i * 600);
    assert.ok(Math.abs(lamp.intensity - 1.2) < 1e-6 && glow.material.color.r === 1, 'at 23:00 the lamps burn');
    assert.ok(H.sky.night === 1 && Math.abs(H.hemiLight.intensity - LRo.nightHemi) < 1e-6, 'and the night rows light the room');
    assert.ok(H.clock.sunCur.y < 0 && H.clock.moonCur.y > 0, 'the dome\'s sun has set and its moon risen');
});

test('the wiring: the dome\'s uniforms, the arm at the entry and the crossing, the frame advances the hour, the fight and the pause', () => {
    assert.match(TR, /'uniform vec3 uSunDir; uniform vec3 uMoonDir; uniform float uSunClock; uniform float uDusk;',/, 'the uniforms are declared in _ENV_COMMON');
    assert.match(TR, /vec3 sunDir=normalize\(mix\(vec3\(0\.50\+0\.03\*sin\(t\*0\.05\),0\.40,-0\.58\),uSunDir,uSunClock\)\);/, 'the dome\'s sun is the clock\'s when uSunClock is 1');
    assert.match(TR, /_envUni\.uSunClock\.value = 0; _envUni\.uDusk\.value = 0;/, 'the battle keeps the fixed sun');
    assert.match(TR, /u\.uSunClock\.value = 1; u\.uDusk\.value = CKs\.duskCur \|\| 0;/, 'the building writes the clock\'s');
    const enter = TR.slice(TR.indexOf('    function _hqEnter('), TR.indexOf('    var HQ_DISSOLVE_MS'));
    assert.ok(enter.indexOf('_hqClockArm(_hq)') > enter.indexOf('_hqLightArm(room)'), '_hqEnter arms the clock after the light rig');
    assert.match(TR, /_hqStageBlendStart\(H, fromRoom, H\.room, fromId, to\);\s*try \{ _hqClockArm\(H\); \}/, 'the crossing re-arms it for the part you enter');
    assert.match(TR, /'strikeAt', 'clock'[,\]][^;]*\]\.forEach\(function \(k\) \{ _HQ_ZONE_KEYS\[k\] = 1; \}\)/, 'the clock is the visit\'s (a zone key)');
    assert.match(TR.slice(TR.indexOf('    function _hqPartFields('), TR.indexOf('    function _hqEnter(')), /clockLamps: \[\]/, 'a part carries its night lamps');
    assert.match(TR, /if \(!H\.paused && H\.ready && _hqClockMsLast && typeof window !== 'undefined' && typeof window\._hqClockAdvance === 'function'\)/, 'the frame runs the day: never paused, never under the card');
    assert.match(TR, /if \(cat\.light\.night\) \{ ppl\._ew_lampI = ppl\.intensity; _hq\.clockLamps\.push\(ppl\); \}/, 'a catalogue night light is a clock lamp');
    const cat = G('DOOR_HQ').catalogue;
    assert.ok(cat.flood_mast.light.night && cat.lighthouse.light.night, 'the flood masts and the lighthouse are night lamps');
    assert.ok(!cat.brazier.light.night && !cat.campfire.light.night, 'a fire burns all day');
    assert.match(TR, /CV = _hqClockVals\(room, R\.roomId, _hqClockHourNow\(\)\);/, 'the fight\'s rig is the room\'s hour');
    assert.match(MP, /window\._hqEncounterRun\.night = _hqClockNightIn\(L\.room \|\| _hqCurRoom\);/, 'the encounter marks a night start');
    assert.match(MP, /const nightFirst = !!\(er && er\.night && er\.armed === false\);\s*return \(state\.round % 2 === 1\) !== nightFirst \? 'day' : 'night';/, 'round 1 is night when the sun was down');
    assert.match(MP, /window\._hqLeave = function \(opts\) \{\s*if \(typeof window\._hqClockHold === 'function'\) window\._hqClockHold\(\);/, 'leaving the building holds and writes the hour');
    assert.match(MP, /_hqSuspended = true;\s*try \{[^\n]*setPaused\(true\);[^\n]*\n\s*if \(typeof window\._hqClockHold === 'function'\) window\._hqClockHold\(\);/, 'a suspend holds it');
    assert.match(MP, /window\.hqClockWrite\(p, _hqClock\.h, Date\.now\(\), !!run\);/, 'the hour is written to the profile');
    assert.match(MP, /<span id="hqClockTag"><\/span>/, 'the hour rides the room\'s sub-line');
});
