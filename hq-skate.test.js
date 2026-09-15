// hq-skate.test.js — SKATEBOARDING (HQ plan 9.8 stage 1 — 2026-09-15): a walker
// MODE. B drops the deck; on it the walker is a RIDER (three-renderer.js
// "SKATEBOARDING — THE RIDER"): momentum, the ollie, GRINDS locked to the
// rails the builders publish (`_hq.rails`: the mezzanine's arcs, the gallery's
// banister, the cave's rope bridges, every `railing_1m`), RAMPS (`_hq.ramps`:
// the quarter pipe as a real curved surface, the flat registers as a hop),
// tricks in the air (flips / rolls / spins / the grab), the combo banked on a
// clean landing, the bail. data.js HQ_SKATE_RULES is the ONE table,
// hqSkateStatus / hqSkateBank the record; map.js the trick line, the sounds,
// the books. Guards: the table, the record + the deck find, the rail and ramp
// geometry (a sandbox), THE RIDE itself (the tick in a sandbox on a flat
// floor: a push, an ollie, a kickflip banked, a grind locked, a wall at speed
// = a bail, a trick still turning = a bail), THE PARK RULE's registers, and
// the source sites in every file. Repo-only tooling; `npm test`.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { loadGameData } = require('./load-data');
const D = loadGameData(), HQ = D.DOOR_HQ, R = D.HQ_SKATE_RULES;
const g = name => vm.runInContext(name, D);
const TR = fs.readFileSync(__dirname + '/three-renderer.js', 'utf8');
const MP = fs.readFileSync(__dirname + '/map.js', 'utf8');
const IX = fs.readFileSync(__dirname + '/index.html', 'utf8');
const CSS = fs.readFileSync(__dirname + '/styles-base.css', 'utf8');
const AU = fs.readFileSync(__dirname + '/audio.js', 'utf8');

function extract(name) {
    const start = TR.indexOf('    function ' + name + '(');
    const end = TR.indexOf('\n    }', start);
    assert.ok(start >= 0 && end > start, name);
    return TR.slice(start, end + 6);
}
function block() { const a = TR.indexOf('/* ══ SKATEBOARDING — THE RIDER'), b = TR.indexOf('/* ── per-frame ───', a); assert.ok(a > 0 && b > a); return TR.slice(a, b); }
const RIDE_FNS = ['_hqSkateRules', '_hqSkateOff', '_hqRailLen', '_hqRailAt', '_hqRailNearest', '_hqRailSnap', '_hqRampLocal', '_hqRampUnder', '_hqRampProfile', '_hqRampSurfaceAt', '_hqRegisterPropPark',
    '_hqRideTurn', '_hqRideNew', '_hqRideArm', '_hqRideEmit', '_hqRideToggle', '_hqRideKeyEdge', '_hqRideComboAdd', '_hqRideComboBank', '_hqRideBail', '_hqRideStartTrick', '_hqTickRide', '_hqRideSetY', '_hqRideGravity'];
function consts() {
    const out = [];
    for (const n of ['HQ_BODY_R', 'HQ_STEP_TOL', 'HQ_DROP_MAX', 'HQ_FALL_MIN', 'HQ_GRAV', 'HQ_JUMP_V']) { const m = TR.match(new RegExp('    var ' + n + ' = ([0-9.]+);')); assert.ok(m, n); out.push('var ' + n + ' = ' + m[1] + ';'); }
    const d = TR.indexOf('    var HQ_SKATE_DEFAULT = {'), de = TR.indexOf('\n    };', d); out.push(TR.slice(d, de + 7));
    out.push('var _hqRideMem = { on: false };');
    return out.join('\n');
}
/* the rider's helpers in a sandbox: a flat box floor at 0, walls beyond ±40 (or `wallAt`), the rails / ramps handed in */
function sandbox(opts) {
    opts = opts || {};
    const events = [];
    const c = { console, HQ_SKATE_RULES: R, Math, performance: { now: () => 1000 }, window: {}, THREE: {} };
    vm.createContext(c);
    vm.runInContext(consts() + '\n' + RIDE_FNS.map(extract).join('\n') + `
        function _hqRad(d) { return d * Math.PI / 180; }
        function _hqNormDeg(d) { d = d % 360; if (d < 0) d += 360; return d; }
        function _hqUnits() { return 73; }
        var _walls = ${opts.wallAt || 40};
        function _hqSurface(x, z, curY, ig) { if (Math.abs(x) > _walls || Math.abs(z) > _walls) return null; var y = 0; var r = _hqRampSurfaceAt(x, z); if (r !== undefined && r > y) y = r; if (curY != null && y - curY > HQ_STEP_TOL) return null; return y; }
        function _hqAirOK(x, z, y) { if (Math.abs(x) > _walls || Math.abs(z) > _walls) return false; var r = _hqRampSurfaceAt(x, z); if (r !== undefined && y < r - 0.05) return false; return true; }
        function _hqBlockerFloor() { return null; }
        function _hqFindTarget() { return null; }
        function _hqSiteCellAt() { return null; }
        function _hqSiteFloorY() { return 0; }
        var _hq = { player: { x: 0, z: 0, y: 0, visY: 0, yaw: 0, targetYaw: 0, air: false, vy: 0, jumpT: -1, moving: false, running: false, heightM: 1.75, entry: { group: { position: { set: function () {} } } } },
                    keys: {}, cam: { yaw: 0 }, ride: null, rails: [], ramps: [], site: null, paused: false, opts: { onSkate: function (ev) { _events.push(ev); } }, dirty: false };
        var _events = [];
    `, c);
    c._events.length = 0;
    c._hq.rails = opts.rails || []; c._hq.ramps = opts.ramps || [];
    vm.runInContext('_hqRideArm({ skate: { issued: true } });', c);
    c.step = (keys, dt, n) => { for (let i = 0; i < (n || 1); i++) { c._hq.keys = Object.assign({}, keys || {}); vm.runInContext('_hqTickRide(' + (dt || 1 / 60) + ')', c); } };
    c.events = () => c._events;
    c.pl = c._hq.player; c.R = () => c._hq.ride;
    return c;
}

test('THE TABLE: standard issue for the test, B, the feel, every trick with points + a rotation + a word; the renderer\'s default carries the same keys', () => {
    assert.equal(R.free, true, 'standard issue (the user\'s rule; the door gun\'s precedent)');
    assert.equal(R.key, 'b');
    assert.ok(R.maxV > 8 && R.pushV > 1 && R.pushEvery > 0.2 && R.friction < 1 && R.friction > 0.95 && R.brake < R.friction, 'the roll');
    assert.ok(R.ollieV === +TR.match(/var HQ_JUMP_V = ([0-9.]+);/)[1], 'the ollie is the walker\'s own jump');
    assert.ok(R.grindSnap > 0.3 && R.grindMinV > 0 && R.grindBalance > 0 && R.grindDrift < R.grindBalance, 'the grind');
    assert.ok(R.qpTop > 0.5 && R.qpTop < 1 && R.rampLaunchMax > R.rampLaunchMin, 'the ramps');
    for (const id of ['kickflip', 'heelflip', 'frontflip', 'backflip', 'roll', 'spin', 'grab', 'grind', 'air']) {
        const T = R.tricks[id]; assert.ok(T && T.pts > 0 && T.label, id);
        if (!['grind', 'air'].includes(id)) assert.ok(T.ms > 0 && T.key, id + ': a rotation and a key');
    }
    assert.ok(R.tricks.frontflip.pts > R.tricks.kickflip.pts && R.tricks.grind.perSec > 0, 'a flip is worth more than a flip of the deck; a grind pays by the second');
    const def = vm.runInContext(TR.slice(TR.indexOf('    var HQ_SKATE_DEFAULT = {'), TR.indexOf('\n    };', TR.indexOf('    var HQ_SKATE_DEFAULT = {')) + 7) + '; HQ_SKATE_DEFAULT', vm.createContext({}));
    for (const k of Object.keys(def)) assert.ok(k in R, 'the table carries the renderer\'s default key ' + k);
    for (const k of Object.keys(def.tricks)) assert.ok(k in R.tricks, 'the table carries the trick ' + k);
    assert.ok(Array.isArray(R.controls) && R.controls.length >= 6 && R.labels.bail, 'the words');
});

test('THE RECORD: status for nobody, the deck find in Room 26 only while the issue is not free, collect → issued, a banked line keeps the best with its words, a bail counts', () => {
    const st0 = g('hqSkateStatus')(null); assert.equal(st0.issued, true); assert.equal(st0.free, true); assert.equal(st0.key, 'B'); assert.equal(st0.best, null);
    const finds = HQ.finds.filter(f => f.kind === 'deck');
    assert.equal(finds.length, 1); assert.equal(finds[0].room, 'locker'); assert.equal(finds[0].id, 'deck:locker'); assert.ok(!finds[0].daily, 'never daily');
    assert.equal(g('hqFindsInRoom')('locker', null).length, 0, 'standard issue: no deck stands in the locker room');
    vm.runInContext('HQ_SKATE_RULES.free = false', D);
    try {
        assert.equal(g('hqFindsInRoom')('locker', null).length, 1, 'the issue off: the deck leans on a locker');
        const p = { username: 'T' };
        assert.equal(g('hqSkateStatus')(p).issued, false, 'nobody holds one');
        const beat = g('hqCollectFind')(p, 'deck:locker');
        assert.ok(beat.ok && beat.kind === 'deck' && /PRESS B/.test(beat.label), JSON.stringify(beat));
        assert.equal(p.door.hq.skate.deck, true);
        assert.equal(g('hqSkateStatus')(p).issued, true, 'collected = issued');
        assert.equal(g('hqFindsInRoom')('locker', p).length, 0, 'taken');
        assert.equal(g('hqCollectFind')(p, 'deck:locker').ok, false, 'once');
    } finally { vm.runInContext('HQ_SKATE_RULES.free = true', D); }
    const q = {};
    g('hqSkateBank')(q, { score: 600, text: 'KICKFLIP + 50-50 GRIND' });
    g('hqSkateBank')(q, { score: 300, text: 'HEELFLIP' });
    g('hqSkateBank')(q, { bail: true });
    const st = g('hqSkateStatus')(q);
    assert.equal(st.best.score, 600); assert.equal(st.best.text, 'KICKFLIP + 50-50 GRIND'); assert.ok(st.best.date);
    assert.equal(st.total, 900); assert.equal(st.lines, 2); assert.equal(st.bails, 1);
    assert.equal(g('hqSkateScore')(['A', 'B', 'C'], 100), 300, 'pts × the number of tricks');
    assert.equal(g('hqSkateScore')([], 100), 100);
});

test('THE GEOMETRY: a straight rail and an arc (the nearest point, the tangent, the run\'s length, the snap band); a quarter pipe\'s surface rises from 0 to h and stands vertical at the coping; a prop registers a rail along its span and a ramp in its own frame', () => {
    const c = sandbox();
    const straight = { x0: 0, z0: 0, x1: 4, z1: 0, y: 1 };
    let n = c._hqRailNearest(straight, 1, 0.3); assert.ok(Math.abs(n.s - 1) < 1e-9 && Math.abs(n.d - 0.3) < 1e-9);
    n = c._hqRailNearest(straight, 9, 0); assert.equal(n.s, 4, 'clamped to the run');
    assert.equal(c._hqRailLen(straight), 4);
    const arc = { arc: true, r: 10, a0: 30, a1: 120, y: 5.25 };
    assert.ok(Math.abs(c._hqRailLen(arc) - Math.PI / 2 * 10) < 1e-9);
    const p = c._hqRailAt(arc, 0); assert.ok(Math.abs(p.x - Math.sin(Math.PI / 6) * 10) < 1e-9 && Math.abs(p.z + Math.cos(Math.PI / 6) * 10) < 1e-9, 'a0 is the start');
    assert.ok(Math.abs(Math.hypot(p.tx, p.tz) - 1) < 1e-9, 'a unit tangent');
    const q = c._hqRailAt(arc, c._hqRailLen(arc)); assert.ok(Math.abs(Math.atan2(q.x, -q.z) * 180 / Math.PI - 120) < 1e-6, 'a1 is the end');
    n = c._hqRailNearest(arc, Math.sin(Math.PI / 4) * 10.2, -Math.cos(Math.PI / 4) * 10.2); assert.ok(Math.abs(n.d - 0.2) < 1e-6 && Math.abs(n.s - Math.PI / 12 * 10) < 1e-6, 'the nearest point on the arc (45° → 15° in = π/12 · r)');
    n = c._hqRailNearest(arc, 0, 10); assert.ok(n.s === c._hqRailLen(arc), '180° clamps to the near end (120°)');
    c._hq.rails = [straight];
    assert.ok(c._hqRailSnap(2, 0.4, 0.9, R), 'in the band: locks'); assert.ok(!c._hqRailSnap(2, 0.9, 0.9, R), 'too far off the line'); assert.ok(!c._hqRailSnap(2, 0.1, 2.0, R), 'too high above it'); assert.ok(!c._hqRailSnap(2, 0.1, 0.2, R), 'too far under it');
    const qp = { x: 0, z: 0, yaw: Math.PI, hw: 2.1, hd: 1.3, y0: 0, y1: 2.2, prof: 'qp' };   // face 0 → yaw π: the approach opens north (−z)
    c._hq.ramps = [qp];
    assert.equal(c._hqRampLocal(qp, 0, -1.3).t, 0, 'the foot is at the open side'); assert.equal(c._hqRampLocal(qp, 0, 1.3).t, 1, 'the coping');
    assert.equal(c._hqRampLocal(qp, 3, 0), null, 'off the side');
    let prev = -1; for (let i = 0; i <= 20; i++) { const t = i / 20, y = c._hqRampSurfaceAt(0, -1.3 + t * 2.6); assert.ok(y !== undefined && y >= prev - 1e-9, 'monotonic at ' + t); prev = y; }
    assert.ok(Math.abs(c._hqRampSurfaceAt(0, -1.3)) < 1e-9 && Math.abs(c._hqRampSurfaceAt(0, 1.3) - 2.2) < 1e-9, '0 at the foot, h at the coping');
    assert.equal(c._hqRampSurfaceAt(5, 5), undefined, 'off every ramp');
    assert.ok(c._hqRampProfile(qp, 0.5) < 0.5 && c._hqRampProfile(qp, 0.9) > 0.5, 'a quarter circle: slow at first, steep at the top');
    const flat = { x: 0, z: 0, dir: 'n', y0: 0, y1: 0.875, w: 1.75 };
    assert.ok(Math.abs(c._hqRampLocal(flat, 0, 0.875).t) < 1e-9 && Math.abs(c._hqRampLocal(flat, 0, -0.875).t - 1) < 1e-9, 'a cave wedge rising north');
    /* the prop placer's register: a railing_1m at (3, 2) facing 90 → runs along z */
    c._hq.rails = []; c._hq.ramps = [];
    const yaw = Math.PI - Math.PI / 2;
    c._hqRegisterPropPark({ key: 'railing_1m', face: 90 }, HQ.catalogue.railing_1m, { rotation: { y: yaw }, position: { x: 3 * 73, z: 2 * 73 } }, 0, 73);
    assert.equal(c._hq.rails.length, 1);
    const rl = c._hq.rails[0]; assert.ok(Math.abs(rl.x0 - 3) < 1e-9 && Math.abs(rl.x1 - 3) < 1e-9 && Math.abs(Math.abs(rl.z1 - rl.z0) - 1) < 1e-9 && rl.y === HQ.catalogue.railing_1m.rail.h, 'one metre along z at the rail\'s height: ' + JSON.stringify(rl));
    c._hqRegisterPropPark({ key: 'quarter_pipe', face: 0 }, HQ.catalogue.quarter_pipe, { rotation: { y: Math.PI }, position: { x: 0, z: 0 } }, 0, 73);
    assert.equal(c._hq.ramps.length, 1); assert.equal(c._hq.ramps[0].prof, 'qp'); assert.equal(c._hq.ramps[0].y1, 2.2);
});

test('THE RIDE: a push rolls where the camera looks, friction slows it, S brakes, A carves; an ollie is the walker\'s jump; a kickflip finished before the landing BANKS the line; a trick still turning is a bail', () => {
    const c = sandbox();
    assert.equal(c._hqRideToggle(true), true); assert.equal(c.R().on, true);
    c._hq.cam.yaw = Math.PI / 2;   // looking +x
    c.step({ w: true }, 1 / 60, 30);
    assert.ok(c.R().v > 2 && c.pl.x > 0.5 && Math.abs(c.pl.z) < 0.01, 'the push went +x: ' + c.pl.x + ' v ' + c.R().v);
    assert.ok(c.events().some(e => e.kind === 'push'));
    const v1 = c.R().v; c.step({}, 1 / 60, 60); assert.ok(c.R().v < v1 && c.R().v > v1 * 0.3, 'friction, gently');
    const v2 = c.R().v; c.step({ s: true }, 1 / 60, 30); assert.ok(c.R().v < v2 * 0.2, 'the brake');
    c.step({ w: true }, 1 / 60, 90); assert.ok(c.R().v > 5, 'up to speed');
    const hd0 = c.R().hd; c.step({ a: true }, 1 / 60, 20); assert.ok(c.R().hd > hd0, 'A carves left');
    assert.ok(c.R().v <= R.maxV + 1e-9, 'capped');
    /* THE OLLIE + THE KICKFLIP */
    c.step({ space: true }, 1 / 60, 1);
    assert.ok(c.pl.air && c.pl.vy > R.ollieV - 0.5 && c.pl.vy <= R.ollieV, 'airborne at the walker\'s jump speed (one frame of gravity in): ' + c.pl.vy);
    assert.ok(c.events().some(e => e.kind === 'ollie'));
    c.step({ left: true }, 1 / 60, 1); assert.equal(c.R().trick.id, 'kickflip');
    let n = 0; while (c.pl.air && n++ < 300) c.step({}, 1 / 60, 1);
    assert.ok(!c.pl.air, 'landed');
    const bank = c.events().find(e => e.kind === 'bank');
    assert.ok(bank && bank.text === 'KICKFLIP' && bank.score === R.tricks.kickflip.pts, 'the line banked: ' + JSON.stringify(bank));
    assert.ok(!c.events().some(e => e.kind === 'bail'), 'no bail');
    /* a front flip pressed too late is still turning at the landing: a bail */
    c._events.length = 0;
    c.step({ w: true }, 1 / 60, 30);
    c.step({ space: true }, 1 / 60, 1);
    n = 0; while (c.pl.vy > -3 && n++ < 300) c.step({}, 1 / 60, 1);   // most of the way down
    c.step({ up: true }, 1 / 60, 1); assert.equal(c.R().trick.id, 'frontflip');
    n = 0; while (c.pl.air && n++ < 300) c.step({}, 1 / 60, 1);
    const bail = c.events().find(e => e.kind === 'bail');
    assert.ok(bail && bail.why === 'unfinished', 'still turning = a bail: ' + JSON.stringify(bail));
    assert.equal(c.R().v, 0); assert.ok(c.R().bailT > 0 && c.R().deckAway > 0, 'the tumble, the deck away');
    assert.equal(c.R().combo, null);
});

test('THE GRIND: an ollie that comes down on a rail LOCKS to it, the line reads the rail, the rider slides it and hops off the end; a spin lands fakie; a wall at speed is a bail; B off drops the record', () => {
    const rail = { x0: 4, z0: 0, x1: 14, z1: 0, y: 0.98, prop: 'railing_1m' };
    const c = sandbox({ rails: [rail] });
    c._hqRideToggle(true); c._hq.cam.yaw = Math.PI / 2;
    c.step({ w: true }, 1 / 60, 55); assert.ok(c.R().v > 4, 'up to speed: ' + c.R().v);
    /* roll to x ≈ 3 then ollie: the arc comes down over the rail */
    let n = 0; while (c.pl.x < 3.0 && n++ < 600) c.step({}, 1 / 60, 1);
    c.step({ space: true }, 1 / 60, 1);
    n = 0; while (!c.R().grind && n++ < 400) c.step({}, 1 / 60, 1);
    assert.ok(c.R().grind, 'locked to the rail (x ' + c.pl.x + ', y ' + c.pl.y + ')');
    assert.ok(Math.abs(c.pl.y - 1.0) < 0.05 && Math.abs(c.pl.z) < 0.01, 'standing on the rail');
    const gs = c.events().find(e => e.kind === 'grindstart'); assert.ok(gs && gs.rail === '50-50 GRIND');
    assert.ok(c.R().combo && c.R().combo.tricks[0] === '50-50 GRIND');
    const s0 = c.R().grind.s; c.step({}, 1 / 60, 10); assert.ok(c.R().grind && c.R().grind.s > s0, 'sliding');
    n = 0; while (c.R().grind && n++ < 600) c.step({}, 1 / 60, 1);
    assert.ok(c.pl.air, 'off the end into the air');
    assert.ok(c.events().some(e => e.kind === 'hop'));
    n = 0; while (c.pl.air && n++ < 400) c.step({}, 1 / 60, 1);
    const bank = c.events().find(e => e.kind === 'bank');
    assert.ok(bank && /50-50 GRIND/.test(bank.text) && bank.score > R.tricks.grind.pts, 'the grind banked with its seconds: ' + JSON.stringify(bank));
    /* a 180: A in the air spins half a turn; the landing is fakie (the stance flips, the roll goes on) */
    c._events.length = 0; c.step({ w: true }, 1 / 60, 20);
    c.step({ space: true }, 1 / 60, 1); c.step({ a: true }, 1 / 60, 1);
    assert.equal(c.R().trick.id, 'spin');
    n = 0; while (c.pl.air && n++ < 400) c.step({}, 1 / 60, 1);
    assert.ok(!c.events().some(e => e.kind === 'bail'), 'a finished 180 lands');
    assert.ok(Math.abs(Math.abs(c.R().stance) - Math.PI) < 1e-6, 'fakie');
    const b2 = c.events().find(e => e.kind === 'bank'); assert.ok(b2 && b2.text === '180', JSON.stringify(b2));
    assert.ok(c.R().v > 0 && Math.abs(c.R().hd - Math.PI / 2) < 0.3, 'the roll goes on the same way');
    /* a wall pulled in to x 22, taken at speed */
    c._events.length = 0; c._walls = 22;
    n = 0; while (!c.events().some(e => e.kind === 'bail') && n++ < 900) c.step({ w: true }, 1 / 60, 1);
    const wb = c.events().find(e => e.kind === 'bail'); assert.ok(wb && wb.why === 'wall', 'the wall: ' + JSON.stringify(wb));
    /* off */
    assert.equal(c._hqRideToggle(false), false); assert.equal(c.R().on, false); assert.equal(c.R().v, 0);
    assert.ok(c.events().some(e => e.kind === 'off'));
    /* the issue: not issued = refused */
    c.R().issued = false; assert.equal(c._hqRideToggle(true), false); assert.ok(c.events().some(e => e.kind === 'refused' && e.reason === 'noissue'));
});

test('THE QUARTER PIPE: ridden at speed the rider climbs the curve and LAUNCHES off the coping, going UP; the walker\'s surface reads the curve', () => {
    const qp = { x: 0, z: 6, yaw: Math.PI, hw: 2.1, hd: 1.3, y0: 0, y1: 2.2, prof: 'qp', prop: 'quarter_pipe' };   // the foot at z 4.7, the coping at z 7.3
    const c = sandbox({ ramps: [qp], wallAt: 12 });
    c.pl.z = -9;
    c._hqRideToggle(true); c._hq.cam.yaw = Math.PI;   // looking +z, the foot of the pipe 13.7 m ahead
    c.step({ w: true }, 1 / 60, 130); assert.ok(c.R().v > 7, 'fast: ' + c.R().v);
    let n = 0, maxY = 0, launched = null;
    while (n++ < 400) { c.step({}, 1 / 60, 1); maxY = Math.max(maxY, c.pl.y); if (!launched) launched = c.events().find(e => e.kind === 'launch'); if (launched && !c.pl.air) break; }
    assert.ok(launched && launched.v > 3, 'off the coping: ' + JSON.stringify(launched));
    assert.ok(maxY > 2.2, 'above the coping (' + maxY + ')');
    assert.ok(!c.events().some(e => e.kind === 'bail'), 'no bail on the curve');
    assert.ok(Math.abs(c._hqSurface(0, 6, null) - c._hqRampSurfaceAt(0, 6)) < 1e-9 && c._hqRampSurfaceAt(0, 6) > 0.2, 'the surface is the curve');
});

test('THE PARK RULE\'s registers: the catalogue rails / ramps, the garage\'s half-pipe, the mezzanine\'s arcs pushed, the placer registering at both sites, the surface + air layers, the gallery + the cave still pushing theirs', () => {
    assert.ok(HQ.catalogue.railing_1m.rail && HQ.catalogue.railing_1m.rail.h > 0.8, 'railing_1m is a rail');
    for (const k of ['riser_1', 'riser_2', 'riser_3']) assert.ok(HQ.catalogue[k].ramp && HQ.catalogue[k].ramp.h === HQ.catalogue[k].h, k + ' is a ramp the height of its tier');
    const qp = HQ.catalogue.quarter_pipe; assert.ok(qp && qp.proc === 'quarter_pipe' && qp.foot === 0 && qp.ramp.prof === 'qp' && qp.ramp.h === qp.h, 'the quarter pipe: no blocker, the curve is the floor');
    const G = HQ.rooms.garage, qps = G.props.filter(p => p.key === 'quarter_pipe');
    assert.equal(qps.length, 2, 'THE HALF-PIPE in P1');
    assert.ok(qps.some(p => p.face === 0) && qps.some(p => p.face === 180), 'facing each other');
    for (const p of qps) { assert.ok(Math.abs(p.x) < G.shell.w / 2 - qp.ramp.w / 2 && Math.abs(p.z) < G.shell.d / 2 - qp.ramp.len / 2 + 0.05, p.key + ' inside the walls'); for (const d of G.doors) { const lx = d.wall === 'e' ? G.shell.w / 2 - 2.4 : d.wall === 'w' ? -G.shell.w / 2 + 2.4 : d.x, lz = d.wall === 'n' ? -G.shell.d / 2 + 2.4 : d.wall === 's' ? G.shell.d / 2 - 2.4 : d.z; assert.ok(Math.abs(lx - p.x) > qp.ramp.w / 2 + 0.3 || Math.abs(lz - p.z) > qp.ramp.len / 2 + 0.3, 'clear of the landing of ' + d.id); } }
    assert.ok(/_hq\.rails\.push\(\{ arc: true, r: railR, a0: sg\[0\], a1: sg\[1\], y: WH \+ railH, mezz: true \}\)/.test(TR), 'the mezzanine\'s rail arcs are rails');
    assert.equal((TR.match(/_hqRegisterPropPark\(p, cat, grp, y, U\);/g) || []).length, 2, 'the placer registers a proc prop and a GLB prop');
    assert.ok(/if \(_hq\.ramps && _hq\.ramps\.length\) \{ var rpy = _hqRampSurfaceAt\(x, z\); if \(rpy !== undefined && rpy > y\) y = rpy; \}/.test(extract('_hqSurface')), '_hqSurface reads the ramp layer');
    assert.ok(/var rpa = _hqRampSurfaceAt\(x, z\); if \(rpa !== undefined && y < rpa - 0\.05\) return false;/.test(extract('_hqAirOK')), '_hqAirOK: the ramp\'s mass');
    assert.ok(/rails\.push\(\{ x0: e0\.x, z0: e0\.z, x1: e1\.x, z1: e1\.z, y: F\.h \+ railH, gallery: true \}\)/.test(TR), 'the gallery still pushes its banister');
    assert.ok(/_hq\.rails\.push\(\{ x0: cellX\(b\.x\)/.test(TR) && /_hq\.ramps\.push\(\{ x: cellX\(s\.x\)/.test(TR), 'the cave still pushes its bridges and wedges');
    assert.ok(/rails: \[\], ramps: \[\], ride: null,/.test(TR), 'the registers start empty on every entry');
    assert.ok(/quarter_pipe: function \(U\) \{/.test(TR), 'the proc');
    /* every room that meets the park rule with a railing_1m now has a grindable rail by construction (the catalogue row) */
    const railed = Object.keys(HQ.rooms).filter(id => (HQ.rooms[id].props || []).some(p => p.key === 'railing_1m'));
    assert.ok(railed.length >= 20, railed.length + ' rooms wear a railing');
});

test('THE SOURCE SITES: the renderer (the keys, the hand-off, the pose, the API, the door landing, the deck GLB), map.js (the issue, the beats, the books, the pill, the officer), index.html, the CSS, audio.js, MODEL_INDEX; nothing on state, nothing relayed', () => {
    assert.ok(/if \(k === 'arrowup'\) return 'up';/.test(TR) && /if \(k === 'arrowleft'\) return 'left';/.test(TR), 'the arrows are their own keys');
    assert.ok(/k === 'e' \|\| k === 'b' \|\| k === 'v' \|\| k === 'f' \|\| k === 'q' \|\| k === 'p'\) return k;/.test(TR), 'B is a walker key (before V, so the door gun\'s and P\'s pins hold)');
    assert.ok(/if \(k === 'b'\) \{ e\.preventDefault\(\); _hqRideToggle\(\); return; \}/.test(TR), 'B toggles');
    assert.ok(/\(k\.d \|\| k\.right\) \? 1 : 0\) - \(\(k\.a \|\| k\.left\) \? 1 : 0\)/.test(TR) && /\(k\.w \|\| k\.up\) \? 1 : 0/.test(TR), 'the walker reads the arrows as WASD');
    assert.ok(/if \(H\.ride && H\.ride\.on\) \{ _hqTickRide\(dt\); return; \}/.test(TR), 'the hand-off at the top of the walker\'s tick');
    assert.ok(/if \(H\.ride\) _hqRidePose\(ch, e, dt\);/.test(TR), 'the pose after the walker\'s own');
    assert.ok(/if \(H\.ride && H\.ride\.on\) want = \(ch\.jumpT >= 0\) \? 'jump' : \(\(H\.ride\.pushAnim > 0\) \? 'run' : 'idle'\);/.test(TR), 'the clip: jump in the air, a stride on the push');
    assert.ok(/try \{ _hqRideArm\(opts\); \}/.test(TR) && TR.lastIndexOf('_hqRideArm(opts)') > TR.indexOf('_hqSpawnPopulation(room, opts); } catch'), 'armed after the population');
    assert.ok(/if \(_hq\.ride && _hq\.ride\.on\) \{ _hq\.ride\.hd = pl\.yaw; _hq\.ride\.stance = 0; _hq\.ride\.v = Math\.min\(_hq\.ride\.v, 2\.5\); _hq\.ride\.grind = null; \}/.test(TR), 'through a door on the board');
    for (const k of ['skate: function (on)', 'skating: function ()', 'skateIssued: function (on)', 'ride: function ()', 'rails: function ()', 'ramps: function ()']) assert.ok(TR.indexOf(k) > 0, 'API ' + k);
    assert.ok(/skateboard: 'Meshy_AI_a_skateboard_0915212313_texture\.glb'/.test(TR), 'the deck GLB in _MISC_GLB');
    assert.ok(fs.existsSync(__dirname + '/Meshy_AI_a_skateboard_0915212313_texture.glb'), 'the user\'s file in the repo');
    assert.ok(/piv\.rotation\.y = Math\.PI \/ 2;/.test(extract('_hqRideDeckBuild')) && /fit: 'span'/.test(extract('_hqRideDeckBuild')), 'the deck pre-turned to the rider\'s +Z, fitted by its length');
    assert.ok(/e\.model\.rotation\.order !== 'YXZ'/.test(extract('_hqRidePose')), 'yaw · pitch · roll on the rider');
    assert.ok(/find_deck/.test(TR) && /deck: 0x7dffb0/.test(TR), 'the deck find');
    const blk = block();
    assert.ok(!/\bstate\./.test(blk) && !/_emit\(/.test(blk), 'nothing on state, nothing relayed');
    assert.ok(!/skate/i.test(fs.readFileSync(__dirname + '/online.js', 'utf8')), 'online.js knows nothing of it');
    /* map.js */
    assert.ok(/skate: \(typeof _hqSkateOpts === 'function'\) \? _hqSkateOpts\(profile\) : null,/.test(MP) && /onSkate: \(typeof _hqSkateEvent === 'function'\) \? _hqSkateEvent : null,/.test(MP), 'the issue + the beats handed to the renderer, guarded (scene-lifecycle evals _hqEnter alone)');
    assert.ok(/function _hqSkateFile\(ev\) \{/.test(MP) && /const sk = window\.hqSkateBank\(p, ev\);\s*PS\.saveProfile\(idx, p\);/.test(MP), 'the books: one transaction');
    assert.ok(/case 'bank': \{/.test(MP) && /_hqSkateFile\(\{ score: ev\.score, text: ev\.text \}\)/.test(MP) && /_hqSkateFile\(\{ bail: true \}\)/.test(MP), 'a banked line and a bail are filed');
    assert.ok(/function _hqTrickLine\(html, cls, ms\)/.test(MP) && /case 'combo': _hqTrickLine\(/.test(MP), 'THE TRICK LINE');
    for (const k of ['skatePush', 'skateOllie', 'skateLand', 'skateGrind', 'skateBail', 'skateBank']) { assert.ok(MP.indexOf("'" + k + "'") > 0, 'map.js plays ' + k); assert.ok(new RegExp('            ' + k + '\\(ctx, t, out, vol\\) \\{').test(AU), 'audio.js recipe ' + k); assert.ok(new RegExp(k + ': 0\\.[0-9]+').test(AU), 'audio.js gain ' + k); }
    assert.ok(/const skp = _hqEl\('hqSkate'\);/.test(MP) && /window\._hqSkateToggle = function/.test(MP), 'the pill');
    assert.ok(/row\('THE BOARD'/.test(MP), 'the OFFICER sheet');
    assert.ok(/if \(beat\.kind === 'deck'\)/.test(MP) && /ThreeRenderer\.hq\.skateIssued\(true\)/.test(MP), 'the deck taken = issued at once');
    assert.ok(/_hqSkateForce\(\)/.test(MP) && /\[\?&\]skate\\b/.test(MP), 'dev ?skate');
    /* index.html, the CSS */
    assert.ok(/id="hqSkate" class="hq-strip-stat hq-strip-skate"/.test(IX) && /onclick="window\._hqSkateToggle\(\)"/.test(IX), 'the pill in the strip');
    assert.ok(/id="hqTrick" class="hq-trick"/.test(IX), 'the trick line');
    assert.ok(/class="hq-hint-skate">B board/.test(IX), 'the hint');
    assert.ok(/\.hq-strip-stat\.hq-strip-skate\.riding/.test(CSS) && /\.hq-trick\.show/.test(CSS) && /\.hq-trick\.bank b/.test(CSS) && /\.hq-trick\.bail/.test(CSS) && /\.hq-hints\.skate \.hq-hint-skate \{ display: inline/.test(CSS), 'the CSS');
    assert.ok(/'Cormorant SC'/.test(CSS.slice(CSS.indexOf('.hq-trick {'), CSS.indexOf('.hq-trick {') + 600)), 'the Horologe\'s font on the line');
    /* the docs */
    const MI = fs.readFileSync(__dirname + '/MODEL_INDEX.md', 'utf8');
    assert.ok(/Meshy_AI_a_skateboard_0915212313_texture\.glb/.test(MI), 'MODEL_INDEX names the deck');
    assert.ok(/9\.8/.test(fs.readFileSync(__dirname + '/DOOR_HQ_BUILD_PLAN.md', 'utf8').slice(-400000)), 'the plan');
});


test('W follows the camera at cardinal and diagonal headings; A/D steer screen-left/right and the camera follows', () => {
    for (const yaw of [0, Math.PI / 4, Math.PI / 2, Math.PI, -Math.PI / 2, -2.4]) {
        for (const key of ['a', 'd']) {
            const c = sandbox(); c._hqRideToggle(true); c._hq.cam.yaw = yaw;
            c.step({ w: true }, 1 / 60, 20);
            const fx = Math.sin(yaw), fz = -Math.cos(yaw), rx = Math.cos(yaw), rz = Math.sin(yaw);
            assert.ok(c.pl.x * fx + c.pl.z * fz > 0.4, 'W moves into the view at ' + yaw);
            assert.ok(Math.abs(c.pl.x * rx + c.pl.z * rz) < 1e-8, 'no sideways drift');
            const oldX = c.pl.x, oldZ = c.pl.z;
            c.step({ [key]: true }, 1 / 60, 12);
            const side = (c.pl.x - oldX) * rx + (c.pl.z - oldZ) * rz;
            assert.ok(key === 'a' ? side < 0 : side > 0, key + ' turns the correct way');
            assert.ok(Math.abs(Math.sin(c.R().hd) - Math.sin(c._hq.cam.yaw)) < 1e-8);
            assert.ok(Math.abs(Math.cos(c.R().hd) + Math.cos(c._hq.cam.yaw)) < 1e-8);
        }
    }
});

test('camera preserves manual look offset, takes the short turn across a rail heading wrap, and ignores tricks', () => {
    const c = sandbox(); c._hqRideToggle(true);
    c.R().hd = Math.PI - 0.02; c._hq.cam.yaw = 0.42;
    c._hqRideTurn(c.R(), -Math.PI + 0.02);
    assert.ok(Math.abs(c._hq.cam.yaw - 0.38) < 1e-8, 'short turn preserves the 0.4 look offset');
    c.R().v = 4; c.pl.air = true; c.pl.y = c.pl.visY = 3; c.pl.vy = 3;
    const yaw = c._hq.cam.yaw;
    c.step({ a: true }, 1 / 60, 10);
    assert.equal(c._hq.cam.yaw, yaw, 'spin does not rotate the camera');
});

test('grinding updates the visible rider position and facing on curved rails', () => {
    const c = sandbox(); c._hqRideToggle(true);
    const rail = { arc: true, r: 5, a0: 0, a1: 90, y: 1 };
    const start = c._hqRailAt(rail, 1);
    c.R().hd = Math.atan2(start.tx, start.tz); c.R().v = 4;
    c.R().grind = { rail, s: 1, dir: 1, t: 0, pts: 0, drift: 0 };
    let position;
    c.pl.entry.group.position.set = (x, y, z) => { position = { x, y, z }; };
    c.step({}, 1 / 60, 1);
    assert.ok(position, 'the rendered position was updated');
    assert.equal(position.x, c.pl.x * 73); assert.equal(position.z, c.pl.z * 73);
    assert.equal(position.y, c.pl.visY * 73);
    assert.equal(c.pl.yaw, c.R().hd + c.R().stance);
});
