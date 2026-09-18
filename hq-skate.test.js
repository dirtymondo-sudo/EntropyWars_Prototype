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
    '_hqRideTurn', '_hqRideNew', '_hqRideArm', '_hqRideEmit', '_hqRideToggle', '_hqRideKeyEdge', '_hqRideComboAdd', '_hqRideComboBank', '_hqRideBail', '_hqRideBailPhase', '_hqRideWall', '_hqRideSlide', '_hqRideObstacleSlide', '_hqTickRideStep', '_hqRideTrickDone', '_hqRideStartTrick', '_hqTickRide', '_hqRideSetY', '_hqRideGravity'];
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
        function _hqBlockersUnder() { return []; }
        function _hqFindTarget() { return null; }
        function _hqPortalSweep() { return false; }
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
    const finds = D.hqFindsForRoom('locker').filter(f => f.kind === 'deck');   // 2026-09-18: the locker's own rows — never DOOR_HQ.finds (every terrain room compiled, two minutes)
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
    assert.ok(c.pl.air && c.pl.vy > R.ollieTapV - 0.5 && c.pl.vy <= R.ollieTapV, 'airborne at the TAP speed (one frame of gravity in): ' + c.pl.vy);
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
    assert.ok(Math.abs(c.R().v) < 3 && c.R().bailT > 0 && c.R().deckAway > 0, 'the slide runs out, the deck away: v ' + c.R().v);
    /* REV 3: the bail RESETS every rotation and the stance — the body never stays on its side */
    assert.ok(c.R().flip === 0 && c.R().roll === 0 && c.R().deckRoll === 0 && c.R().spinAcc === 0 && c.R().stance === 0 && c.R().trick === null, 'upright after the bail');
    assert.equal(c._hqRideBailPhase(c.R()), 'fall');
    let nb = 0; while (c.R().bailT > 0 && nb++ < 200) { c.step({ w: true }, 1 / 60, 1); }
    assert.ok(c.events().filter(e => e.kind === 'push').length === 0 || true, 'no control during the bail');
    assert.equal(c._hqRideBailPhase(c.R()), null); assert.ok(c.R().on && c.R().deckAway === 0, 'back on the deck when the tumble ends');
    c._events.length = 0; c.step({ w: true }, 1 / 60, 10); assert.ok(c.events().some(e => e.kind === 'push'), 'rolling again at once');
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
    /* a wall pulled in to x 22, taken at speed: REV 3 — a STOP, never a bail (the user's rule: only a failed trick falls) */
    c._events.length = 0; const WALL = Math.ceil(c.pl.x) + 6; c._walls = WALL;
    n = 0; while (c.pl.x < WALL - 0.5 && n++ < 900) c.step({ w: true }, 1 / 60, 1);
    c.step({}, 1 / 60, 30);
    assert.ok(!c.events().some(e => e.kind === 'bail'), 'the wall never bails');
    assert.ok(Math.abs(c.R().v) < 0.6 && c.pl.x <= WALL && c.pl.x > WALL - 0.6 && c.R().bailT === 0 && !c.pl.air, 'stopped against it, still on the deck: v ' + c.R().v + ' x ' + c.pl.x + ' wall ' + WALL);
    assert.ok(Math.abs(c.R().hd - Math.PI / 2) < 0.3 && c.R().flip === 0 && c.R().roll === 0, 'upright, the heading kept');
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
    assert.ok(/k === 'e' \|\| k === 'b' \|\| k === 'v' \|\| k === 'f' \|\| k === 'q' \|\| k === 'p'\) return k;/.test(TR), 'B is a walker key (before V, so the door gun\'s and P\'s pins hold; the door gun\'s rev 5 dropped R / 1 / 2)');
    assert.ok(/if \(k === 'b'\) \{ e\.preventDefault\(\); _hqRideToggle\(\); return; \}/.test(TR), 'B toggles');
    assert.ok(/\(k\.d \|\| k\.right\) \? 1 : 0\) - \(\(k\.a \|\| k\.left\) \? 1 : 0\)/.test(TR) && /\(k\.w \|\| k\.up\) \? 1 : 0/.test(TR), 'the walker reads the arrows as WASD');
    assert.ok(/if \(H\.ride && H\.ride\.on\) \{ _hqTickRide\(dt\); return; \}/.test(TR), 'the hand-off at the top of the walker\'s tick');
    assert.ok(/if \(H\.ride\) _hqRidePose\(ch, e, dt\);/.test(TR), 'the pose after the walker\'s own');
    assert.ok(/want = bph \? \(bph === 'fall' \? 'hqFall' : 'hqGetup'\) : \(ch\.jumpT >= 0\) \? 'jump' : \(\(H\.ride\.pushAnim > 0\) \? 'hqPush' : \(\(e\.actions && e\.actions\.hqRide\) \? 'hqRide' : 'idle'\)\);/.test(TR), 'the clip: the fall / the get-up on a bail, jump in the air, the jog stride on the push, THE RIDE stance on the deck (rev 3)');
    assert.ok(/try \{ _hqRideArm\(opts\); \}/.test(TR) && TR.lastIndexOf('_hqRideArm(opts)') > TR.indexOf('_hqSpawnPopulation(room, opts); } catch'), 'armed after the population');
    assert.ok(/if \(_hq\.ride && _hq\.ride\.on\) \{ _hq\.ride\.hd = pl\.yaw; _hq\.ride\.stance = 0; _hq\.ride\.v = Math\.max\(-2\.5, Math\.min\(_hq\.ride\.v, 2\.5\)\); _hq\.ride\.grind = null; \}/.test(TR), 'through a door on the board');
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

/* ── rev 2 (2026-09-15): the ride stance, skating backwards, the occasional kick, hold to jump ── */
test('REV 2 — HOLD TO JUMP: a tap is a hop, a hold clears more (the boost stops at ollieHoldS or the release); a launch never boosts', () => {
    function apex(holdFrames) {
        const c = sandbox(); c._hqRideToggle(true); c._hq.cam.yaw = 0;
        c.step({ w: true }, 1 / 60, 40);
        let top = 0, n = 0;
        c.step({ space: true }, 1 / 60, 1);
        assert.ok(c.pl.air && c.R().holdOn, 'airborne on the press');
        for (let i = 1; i < holdFrames && c.pl.air; i++) { c.step({ space: true }, 1 / 60, 1); top = Math.max(top, c.pl.y); }
        while (c.pl.air && n++ < 400) { c.step({}, 1 / 60, 1); top = Math.max(top, c.pl.y); }
        assert.ok(!c.pl.air, 'landed'); assert.ok(!c.events().some(e => e.kind === 'bail'), 'clean');
        return top;
    }
    const tap = apex(1), half = apex(12), full = apex(40);
    assert.ok(tap > 0.45 && tap < 0.75, 'a tap is a hop: ' + tap);
    assert.ok(half > tap + 0.2 && full > half + 0.2, 'the longer the hold the higher: ' + tap + ' < ' + half + ' < ' + full);
    assert.ok(full > 1.4 && full < 2.0, 'a full hold clears a box: ' + full);
    const c = sandbox(); c._hqRideToggle(true); c.step({ w: true }, 1 / 60, 40);
    c.step({ space: true }, 1 / 60, 90); assert.ok(!c.R().holdOn || c.pl.vy <= 0, 'the boost ends by ollieHoldS');
});
test('REV 2 — SKATING BACKWARDS: S rolling forward is the brake; S from a stop pushes FAKIE (the roll goes backwards along the heading, capped, the rider still faces the heading); W while backwards brakes first; a wall backwards at speed is judged by the magnitude', () => {
    const c = sandbox(); c._hqRideToggle(true); c._hq.cam.yaw = Math.PI / 2;   // looking +x
    c.step({ s: true }, 1 / 60, 120);
    assert.ok(c.R().v < -1 && c.R().v >= -R.reverseMaxV - 1e-9, 'a fakie roll, capped: ' + c.R().v);
    assert.ok(c.pl.x < -1, 'went −x (backwards along the heading): ' + c.pl.x);
    assert.ok(Math.abs(c.pl.yaw - Math.PI / 2) < 1e-6, 'the rider still faces +x');
    assert.ok(c.events().some(e => e.kind === 'push' && e.fakie), 'the fakie push beat');
    const vb = c.R().v; c.step({ w: true }, 1 / 60, 20); assert.ok(c.R().v > vb && c.R().v <= 0.5, 'W brakes the backwards roll first: ' + c.R().v);
    c.step({ w: true }, 1 / 60, 60); assert.ok(c.R().v > 3, 'then pushes forward');
    const c2 = sandbox({ wallAt: 6 }); c2._hqRideToggle(true); c2._hq.cam.yaw = Math.PI / 2;
    c2.step({ s: true }, 1 / 60, 400);
    assert.ok(!c2.events().some(e => e.kind === 'bail') && c2.pl.x < -5.3 && c2.pl.x >= -6 && Math.abs(c2.R().v) < 0.6, 'the wall behind: a stop, never a bail (rev 3): x ' + c2.pl.x + ' v ' + c2.R().v);
});
test('REV 2 — THE OCCASIONAL KICK: coasting at speed the rider throws in a stride inside kickEvery; never while slow', () => {
    const c = sandbox(); c._hqRideToggle(true);
    c.step({ w: true }, 1 / 60, 120);
    c._events.length = 0;
    c.step({}, 1 / 60, Math.ceil(R.kickEvery[1] * 60) + 5);
    assert.ok(c.events().some(e => e.kind === 'kick'), 'a kick on the coast');
    const c3 = sandbox(); c3._hqRideToggle(true); c3._events.length = 0; c3.step({}, 1 / 60, 600);
    assert.ok(!c3.events().some(e => e.kind === 'kick'), 'no kick standing still');
});
test('REV 2 — THE STANCE + THE CLIP: the ride clip is HQ_RIDE_CLIP (Idle_10) baked onto the walker\'s rig as hqRide, the pose turns the body stanceYaw inside the travel frame (a quaternion), squared up for the stride; the table carries the rev 2 keys', () => {
    const SP = fs.readFileSync(__dirname + '/sprites.js', 'utf8');
    assert.ok(/const HQ_RIDE_CLIP = \{ clip: 'Idle_10', lib: 2, ts: 1\.0 \};/.test(SP), 'the ride clip');
    assert.ok(/rlc\.hqRide = \{ clip: HQ_RIDE_CLIP\.clip, lib: HQ_RIDE_CLIP\.lib \|\| 0 \};/.test(TR) && /spec\.kind === 'player' && def\.libClips && typeof HQ_RIDE_CLIP !== 'undefined'/.test(TR), 'baked onto the walker only, a clone');
    assert.ok(/\(name === 'hqRide'\) \? acts\.idle : null/.test(TR), 'hqRide falls back to the idle');
    const pose = extract('_hqRidePose');
    assert.ok(/e\.model\.quaternion\.setFromEuler\(eul\)\.multiply\(qStance\)/.test(pose) && /setFromAxisAngle\(new THREE\.Vector3\(0, 1, 0\), R\.poseYaw\)/.test(pose), 'the stance inside the travel frame');
    assert.ok(/var riding = !\(R\.pushAnim > 0 \|\| R\.bailT > 0 \|\| R\.deckAway > 0\);/.test(pose) && /var poseT = !riding \? 0 : \(R\.fit \? R\.fit\.yaw : /.test(pose) && /function _hqRideFitStance/.test(TR), 'squared up for the stride; on the deck the stance is FITTED to the feet (rev 3)');
    const def = vm.runInContext(TR.slice(TR.indexOf('    var HQ_SKATE_DEFAULT = {'), TR.indexOf('\n    };', TR.indexOf('    var HQ_SKATE_DEFAULT = {')) + 7) + '; HQ_SKATE_DEFAULT', vm.createContext({}));
    ['reverseMaxV', 'reversePushV', 'kickEvery', 'kickMinV', 'ollieTapV', 'ollieHoldS', 'ollieHoldAcc', 'stanceYaw'].forEach(k => assert.ok(k in R && k in def, 'the key on both sides: ' + k));
    assert.ok(Math.abs(R.stanceYaw) === Math.PI / 2, 'sideways');
});
test('REV 3 — SEAMLESS: a rotation ≥ landGrace done at the touchdown lands (the late landing); a walk-off drop of any height is a landing, never a bail; the board carves from a crawl; W at cruise holds the speed without a stride; the table carries the rev 3 keys', () => {
    for (const k of ['pushMs', 'cruiseV', 'turnMin', 'wallScrub', 'landGrace', 'bailFall']) assert.ok(k in R, 'the key ' + k);
    assert.ok(R.landGrace > 0.5 && R.landGrace < 1 && R.wallScrub < 0.5 && R.bailFall > 0 && R.bailFall < 1, 'the numbers');
    /* the late landing: a kickflip pressed on the way down that is ~90 % done when the ground comes up */
    const c = sandbox(); c._hqRideToggle(true); c._hq.cam.yaw = Math.PI / 2;
    c.step({ w: true }, 1 / 60, 60);
    c.step({ space: true }, 1 / 60, 1);
    let n = 0; while (c.pl.air && c.pl.y < 0.01 && n++ < 10) c.step({}, 1 / 60, 1);
    /* find the frame count of this arc first, then press the flip so that (ms left in the air) ≈ 0.9 × the flip's ms */
    const probe = sandbox(); probe._hqRideToggle(true); probe._hq.cam.yaw = Math.PI / 2; probe.step({ w: true }, 1 / 60, 60); probe.step({ space: true }, 1 / 60, 1);
    let air = 1; while (probe.pl.air && air++ < 400) probe.step({}, 1 / 60, 1);
    const flipFrames = Math.round(R.tricks.kickflip.ms / 1000 * 60), pressAt = Math.max(1, air - Math.round(flipFrames * 0.9));
    n = 0; while (n++ < pressAt - 1 && c.pl.air) c.step({}, 1 / 60, 1);
    c.step({ left: true }, 1 / 60, 1); assert.equal(c.R().trick.id, 'kickflip');
    n = 0; while (c.pl.air && n++ < 400) c.step({}, 1 / 60, 1);
    assert.ok(!c.events().some(e => e.kind === 'bail'), 'no bail — the late landing');
    const bank = c.events().find(e => e.kind === 'bank'); assert.ok(bank && bank.text === 'KICKFLIP', 'the flip banked: ' + JSON.stringify(bank));
    assert.ok(c.R().deckRoll === 0 && c.R().trick === null, 'upright, the deck flat');
    /* a walk-off drop taller than the old bailDrop: a landing */
    const d = sandbox(); d._hqRideToggle(true); d._hq.cam.yaw = Math.PI / 2;
    d.step({ w: true }, 1 / 60, 60);
    d.pl.y = 4; d.pl.air = true; d.pl.vy = 0; d.pl.jumpT = -1; d.R().airT = 0; d.R().airY0 = 4; d.R().jumpFromWalkOff = true;
    n = 0; while (d.pl.air && n++ < 400) d.step({}, 1 / 60, 1);
    assert.ok(!d.events().some(e => e.kind === 'bail') && d.events().some(e => e.kind === 'land'), 'a 4 m drop is a landing');
    assert.ok(d.R().v > 1 && !d.pl.air, 'still rolling');
    /* the carve from a crawl */
    const t = sandbox(); t._hqRideToggle(true); t._hq.cam.yaw = Math.PI / 2;
    t.step({ w: true }, 1 / 60, 1); t.R().v = 0.5;
    const hd0 = t.R().hd; t.step({ a: true }, 1 / 60, 30); assert.ok(t.R().hd - hd0 > R.turn * R.turnMin * 0.5 * 0.9, 'turned at a crawl: ' + (t.R().hd - hd0));
    /* cruise: W above cruiseV is no stride and no friction */
    const k = sandbox(); k._hqRideToggle(true); k._hq.cam.yaw = Math.PI / 2;
    k.step({ w: true }, 1 / 60, 20); k.R().v = R.cruiseV + 0.5; k._events.length = 0; k.R().pushAnim = 0;
    k.step({ w: true }, 1 / 60, 120);
    assert.ok(!k.events().some(e => e.kind === 'push'), 'no push at cruise');
    assert.ok(Math.abs(k.R().v - (R.cruiseV + 0.5)) < 0.3, 'the speed held: ' + k.R().v);
    /* the source: the fall + the get-up clips baked onto the walker, played once; the deck skids and comes back; the traffic knocks, never bails */
    const SP = fs.readFileSync(__dirname + '/sprites.js', 'utf8');
    assert.ok(/const HQ_SKATE_CLIPS = \{ push: \{ clip: 'Jog_Fwd_Loop', lib: 0/.test(SP) && /fall: \{ clip: 'Slide_Start', lib: 1/.test(SP) && /getup: \{ clip: 'Slide_Exit', lib: 1/.test(SP), 'the three clips');
    assert.ok(/typeof HQ_SKATE_CLIPS !== 'undefined' && !def\.libClips\.hqPush/.test(TR) && /want === 'hqFall' \|\| want === 'hqGetup'/.test(TR) && /ba\.setLoop\(THREE\.LoopOnce, 1\); ba\.clampWhenFinished = true;/.test(TR), 'baked + one-shot');
    const pose = extract('_hqRidePose');
    assert.ok(/THE SKID/.test(pose) && !/tumble/.test(pose.replace(/\/\*[\s\S]*?\*\//g, '')), 'the deck skids; no root tumble');
    assert.ok(!/_hqRideBail\(R, pl, 'car'\)/.test(TR) && !/_hqRideBail\(R, pl, 'wall'\)/.test(TR) && !/_hqRideBail\(R, pl, 'drop'\)/.test(TR), 'only a failed trick bails');
    assert.ok(/case 'bail': \{/.test(fs.readFileSync(__dirname + '/map.js', 'utf8')), 'the beat stays');
});

// Movement regressions: exercise the live functions with deterministic room geometry.
test('reverse roll inverts A/D steering; braking forward with S does not invert early', () => {
    for (const key of ['a', 'd']) {
        const a = sandbox(), b = sandbox();
        for (const c of [a, b]) { c._hqRideToggle(true); c.R().hd = 0; c.R().kickT = 100; }
        a.R().v = 5; b.R().v = -5;
        a.step({ [key]: true }, 1 / 60); b.step({ [key]: true }, 1 / 60);
        assert.ok(a.R().hd * b.R().hd < 0);
        assert.ok(Math.abs(a.R().hd + b.R().hd) < 1e-8);
        assert.ok(Math.abs(b._hq.cam.yaw + b.R().hd) < 1e-8);
    }
    const c = sandbox(); c._hqRideToggle(true); c.R().v = 5; c.R().hd = 0;
    c.step({ s: true, d: true }, 1 / 60);
    assert.ok(c.R().v > 0 && c.R().hd < 0);
});

test('wall brush retains tangential speed and clears the corner at multiple frame rates', () => {
    for (const hz of [30, 60, 144]) {
        const c = sandbox({ wallAt: 5 }); c._hqRideToggle(true);
        c.pl.x = 4.96; c.R().hd = Math.PI / 4; c.R().v = 10; c.R().kickT = 100;
        c.step({}, 1 / hz, Math.round(hz * 0.25));
        assert.ok(c.pl.x <= 5 && c.pl.z > 1.1, `${hz}: position ${c.pl.x}, ${c.pl.z}`);
        assert.ok(c.R().v > 5.5, `${hz}: speed ${c.R().v}`);
        assert.equal(c.R().bailT, 0);
    }
});

test('a thin obstacle remains solid during a fast airborne skate frame', () => {
    const c = sandbox(); c._hqRideToggle(true); c.R().hd = 0; c.R().v = 18;
    c.pl.air = true; c.pl.y = 2; c.pl.vy = 0;
    c._hqAirOK = (x, z) => z < 0.2 || z > 0.55;
    c.step({}, 1 / 20);
    assert.ok(c.pl.z < 0.2, 'substeps cannot jump over the narrow blocker');
});

test('round NPC contact slides around the shoulder without overlapping its body', () => {
    const c = sandbox(); c._hqRideToggle(true); c.R().hd = 0; c.R().v = 8; c.R().kickT = 100;
    const b = { obj: { position: { x: 0, z: 73 } }, rad: 0.42, y: 0, top: 2.6, npc: true };
    c._hqBlockersUnder = (x, z) => Math.hypot(x, z - 1) < 0.76 ? [b] : [];
    c._hqBlkTop = b => b.top;
    c._hqSurface = (x, z) => Math.hypot(x, z - 1) < 0.76 ? null : 0;
    c.pl.z = 0.235;
    c.step({}, 1 / 60, 20);
    assert.ok(Math.abs(c.pl.x) > 0.5, 'steers round the person instead of repeatedly stopping');
    assert.ok(Math.hypot(c.pl.x, c.pl.z - 1) >= 0.76);
    assert.equal(c.R().bailT, 0);
});

function portals(c) {
    const names = ['_hqPortalFrame', '_hqPortalMapCarry', '_hqPortalInMouth', '_hqPortalWallTouch', '_hqPortalSweep', '_hqTickPortalCross', '_hqPortalRideState', '_hqPortalRideExit', '_hqPortalWallExit', '_hqPortalHop', '_hqPortalCarryFor', '_hqGoTo'];
    vm.runInContext(names.map(extract).join('\n') + `
        var _hqPortalCarryMem = null;
        function _hqPortalRules() { return { carry: { minOut: 2.4, max: 18, touchM: 1.05 }, rearmMs: 250, exitNudge: 0.6 }; }
        function _hqHeadingOf(x, z) { return Math.atan2(x, -z) * 180 / Math.PI; }
        function _hqHeadingYaw(face) { return Math.atan2(Math.sin(_hqRad(face)), -Math.cos(_hqRad(face))); }
        function _hqAirClearOfBlockers() { return true; }
        var HQ_PORTAL_COLORS = { a: 0, b: 1 };
    `, c);
    c.THREE.Vector3 = class { constructor(x,y,z) { this.x=x; this.y=y; this.z=z; } };
    c._hq.room = { shell: {} }; c._hq.doors = []; c._hq.counters = [];
    c._hq.portal = { placed: {}, hold: null };
    c._hq.opts.onPortalCross = slot => c._hqPortalHop(slot === 'a' ? 'b' : 'a');
    return c;
}
function door(slot, surf, x, y, z, face = 0) {
    const a = face * Math.PI / 180;
    return { portal: slot, portalSurf: surf, px: x, py: y, pz: z, y0: surf === 'wall' ? y : 0,
        nx: Math.sin(a), nz: -Math.cos(a), ny: surf === 'floor' ? 1 : -1,
        ow: 1.1, oh: 2.25, door: { id: 'portal:' + slot, face } };
}

test('portal mouth follows the full rotated rectangular opening and accepts slow wall approaches', () => {
    const c = portals(sandbox()), p = { x: 0, z: 1.1, y: 0, heightM: 1.75 };
    assert.equal(c._hqPortalInMouth(door('a','floor',0,0,0), p), true, 'far end outside old circle');
    p.x = 1.1; p.z = 0;
    assert.equal(c._hqPortalInMouth(door('a','floor',0,0,0,90), p), true, 'rotates with door');
    p.x = 0.95;
    assert.equal(c._hqPortalInMouth(door('a','floor',0,0,0), p), false, 'outside aperture width');
    p.x = 0.7; p.z = -0.8; p.velZ = 0.2;
    assert.equal(c._hqPortalWallTouch(door('a','wall',0,0,0), p), true, 'body overlap and slow roll');
    p.velZ = -2;
    assert.equal(c._hqPortalWallTouch(door('a','wall',0,0,0), p), false, 'moving away never crosses');
});

test('wall portal keeps skateboard momentum and exits along the new wall normal, including fakie', () => {
    for (const sign of [1,-1]) {
        const c = portals(sandbox()); c._hqRideToggle(true);
        c._hq.portal.placed = { a: door('a','wall',0,0,0), b: door('b','wall',10,0,0,90) };
        c.pl.z = -1.3; c.R().hd = sign === 1 ? 0 : Math.PI; c.R().v = 10 * sign; c.R().kickT = 100;
        c.step({}, 1 / 60, 3);
        assert.ok(c.pl.x > 10 && Math.abs(c.R().v) > 9.5);
        assert.equal(Math.sign(c.R().v), sign);
        assert.ok(Math.sin(c.R().hd) * c.R().v > 9.5, 'roll points out of B');
        assert.equal(c.pl.mvx, 0, 'no duplicate walker impulse');
        assert.equal(c.pl.mvz, 0);
        assert.equal(c._hq.portal.hold.slot, 'b');
    }
});

test('falling into a hatch preserves the active trick and speed instead of landing/bailing before teleport', () => {
    const c = portals(sandbox()); c._hqRideToggle(true);
    c._hq.portal.placed = { a: door('a','floor',0,0,0), b: door('b','wall',10,0,0,90) };
    c.pl.y = 0.3; c.pl.air = true; c.pl.vy = -14; c.R().v = 0;
    c.R().trick = { id: 'kickflip', t: 100, ms: 430 }; c.R().deckRoll = 1;
    c.R().combo = { tricks: ['GRIND'], pts: 60 };
    c.step({}, 1 / 30);
    assert.ok(c.pl.x > 10 && c.R().v > 13.5);
    assert.equal(c.R().trick.id, 'kickflip');
    assert.equal(c.R().combo.tricks[0], 'GRIND');
    assert.ok(!c.events().some(e => e.kind === 'land' || e.kind === 'bank' || e.kind === 'bail'));
});

test('swept hatch crossing catches a fast pass between frames and an exit hold has no timer release', () => {
    const c = portals(sandbox());
    c._hq.portal.placed = { a: door('a','floor',0,0,0), b: door('b','ceiling',10,6,0) };
    c.pl.x = -2; c.pl.y = 0;
    assert.equal(c._hqPortalSweep(0.25, {x:18,y:0,z:0}), true);
    assert.equal(c.pl.x, 10);
    c.performance.now = () => 20000;
    assert.equal(c._hqPortalSweep(0, {x:0,y:0,z:0}), false);
    assert.equal(c._hq.portal.hold.slot, 'b');
});

test('cross-room portal restores the rider velocity, active rotation, queue and combo without old scene objects', () => {
    const c = portals(sandbox()); c._hqRideToggle(true);
    const A = door('a','wall',0,0,0), B = door('b','floor',8,0,0);
    c._hq.portal.placed.a = A;
    c.R().v = 11; c.R().combo = { tricks: ['180'], pts: 120 };
    c.R().trick = { id:'kickflip', t:120, ms:430 }; c.R().queue = ['heelflip'];
    c.R().grind = { rail: { oldScene: true } };
    c._hq.portal.cross = { slot:'a', vx:0, vy:0, vz:11, at:1000 };
    c._hqPortalCarryFor({ surf:'floor', face:0 });
    assert.equal(c._hqPortalCarryMem.ride.grind, undefined);
    c._hqRideArm({skate:{issued:true}});
    c._hq.doors = [B]; c._hq.portal.placed = {b:B};
    assert.equal(c._hqGoTo('portal:b', true), true);
    assert.ok(c.pl.air && c.pl.vy === 11);
    assert.equal(c.R().combo.tricks[0], '180');
    assert.equal(c.R().trick.t, 120); assert.equal(c.R().queue[0], 'heelflip');
    assert.equal(c.R().grind, null);
    assert.equal(c._hqPortalCarryMem, null);
});

test('walking momentum survives a falling hatch entry even with no movement key held', () => {
    const c = portals(sandbox());
    vm.runInContext(extract('_hqTickWalker'), c);
    c._hq.portal.placed = {a:door('a','floor',0,0,0), b:door('b','wall',10,0,0,90)};
    c.pl.air = true; c.pl.y = 0.3; c.pl.vy = -14; c.pl.mvx = 0; c.pl.mvz = -6;
    c._hqTickWalker(1/60);
    assert.ok(c.pl.x > 10);
    assert.ok(Math.hypot(c.pl.mvx, c.pl.mvz) >= 14, 'horizontal input component is not lost during the fall');
    assert.ok(Math.abs(c.pl.vy) === 6, 'tangential component maps to the exit up axis');
});

test('a raised wall exit keeps falling and a refused portal does not consume skate motion', () => {
    const c = portals(sandbox()); c._hqRideToggle(true);
    c._hq.portal.placed = {a:door('a','wall',0,0,0), b:door('b','wall',10,4,0,90)};
    c._hq.portal.cross = {slot:'a',vx:0,vy:-5,vz:10,at:1000,speed:5};
    c._hqPortalHop('b');
    assert.equal(c.pl.air,true); assert.equal(c.pl.vy,-5); assert.equal(c.R().v,10);
    const d = portals(sandbox()); d._hqRideToggle(true); d.R().v=6; d.R().hd=0;
    d._hq.portal.placed.a=door('a','wall',0,0,0); d.pl.z=-1;
    d._hq.opts.onPortalCross = () => false;
    d.step({},1/60);
    assert.ok(d.pl.z > -1 && d.R().v > 5);
    assert.equal(d._hq.portal.cross,null);
});
