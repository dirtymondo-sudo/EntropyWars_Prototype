// hq-ring3.test.js — THE THIRD RING (HQ plan 8.4 / 9.3 "the crowding" —
// 2026-09-16): the rotunda's third level. `shell.ring3 = { h, inner, outer,
// thick, railH, stair: { from, to, rIn, steps } }` on the hall (data.js) is a
// second ring slab inside the upper drum, `h` above the mezzanine, reached
// by ONE curved flight off the mezzanine's walkway; doors / props / spots
// with `level: 2` stand on it. The renderer reads every rotunda level through
// _hqLevelY / _hqLevelR / _hqLevelOf and the ring is a LAYER of _hqSurface
// (_hqRing3At), a mass in the air (_hqRing3Air) and a wall to the boom
// (_hqRing3Cam). The four EXPLORATION doors (Arcane Engineering, IT, the
// Observatorium, the Executive Suite) rode up; the mezzanine keeps the bays
// and the elevator. Guards: the sheet, THE CLIMB (a walker on the mezzanine
// climbs the flight and walks the ring by the step rule alone), the walls
// (the rail from the slab side, the void, the mezzanine under the slab), the
// air and camera reads, the builder on a stub scene, the source sites.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { loadGameData } = require('./load-data');
const D = loadGameData(), HQ = D.DOOR_HQ;
const renderer = fs.readFileSync(__dirname + '/three-renderer.js', 'utf8');
const mapjs = fs.readFileSync(__dirname + '/map.js', 'utf8');
const ROOM = HQ.rooms.central_egress, S = ROOM.shell, R3 = S.ring3, ST = R3 && R3.stair;

function extract(name) {
    const start = renderer.indexOf('    function ' + name + '(');
    const end = renderer.indexOf('\n    }', start);
    assert.ok(start >= 0 && end > start, name);
    return renderer.slice(start, end + 6);
}
const STEP = +renderer.match(/var HQ_STEP_TOL = ([0-9.]+);/)[1], DROP = +renderer.match(/var HQ_DROP_MAX = ([0-9.]+);/)[1];
function sandbox() {
    const c = { console, Math };
    vm.createContext(c);
    vm.runInContext(['_hqNormDeg', '_hqDegDiff', '_hqWithinArc', '_hqLevelY', '_hqLevelR', '_hqLevelOf', '_hqRing3Tread', '_hqRing3At', '_hqRing3Air', '_hqRing3Cam'].map(extract).join('\n'), c);
    c._hq = { room: ROOM };
    return c;
}
const pol = (deg, r) => ({ x: Math.sin(deg * Math.PI / 180) * r, z: -Math.cos(deg * Math.PI / 180) * r });

test('the sheet: the hall wears the third ring — the same radii as the mezzanine, 3.3 m up, a flight off the mezzanine clear of every level-1 door and prop; the upper drum is tall enough; the four exploration doors stand on it, the bays and the elevator stay below', () => {
    assert.ok(R3 && R3.h === 3.3 && R3.inner === S.mezz.inner && R3.outer === S.mezz.outer && R3.thick > 0 && ST && ST.steps >= 18, 'the ring3 row');
    assert.ok(S.upperWallH - R3.h >= 3.0, 'headroom over the gallery under the drum top (' + (S.upperWallH - R3.h) + ' m)');
    assert.ok(R3.h - R3.thick >= 2.6, 'headroom over the mezzanine under the slab');
    assert.ok(R3.h / ST.steps <= STEP, 'a tread is a step (' + (R3.h / ST.steps).toFixed(3) + ' m)');
    assert.ok(ST.rIn > S.mezz.inner + 1.3 && ST.rIn < R3.outer - 1.2, 'the flight leaves the mezzanine\'s walkway open beside it and is wide enough');
    const lo = Math.min(ST.from, ST.to), hi = Math.max(ST.from, ST.to);
    for (const d of ROOM.doors.filter(d => (d.level || 0) === 1)) assert.ok(d.deg < lo - 6 || d.deg > hi + 6, d.id + ' (level 1) stands clear of the flight');
    for (const p of ROOM.props.filter(p => (p.level || 0) === 1 && p.r != null && p.r >= ST.rIn - 0.6)) assert.ok(p.deg < lo - 2 || p.deg > hi + 2, p.key + ' @' + p.deg + '° stands clear of the flight');
    const up = ROOM.doors.filter(d => (d.level || 0) === 2).map(d => d.id).sort();
    assert.equal(up.join(','), 'engineering,executive,it,observatorium', 'the exploration doors');
    for (const d of ROOM.doors.filter(d => (d.level || 0) === 1)) assert.ok(d.action.sector || d.id === 'elevator', d.id + ': the mezzanine keeps only the bays and the elevator');
    assert.ok(!ROOM.doors.some(d => (d.level || 0) === 2 && d.action.sector), 'no bay door on the third ring');
    for (const p of ROOM.props.filter(p => (p.level || 0) === 2 && p.r != null)) assert.ok(p.r >= R3.inner + 0.7 && p.r <= R3.outer - 0.3, p.key + ' stands on the ring');
    assert.ok(ROOM.agents.some(a => a.level === 2 && a.line), 'someone stands the gallery watch');
});

test('the level helpers: three floor heights, two drums, the level of any height', () => {
    const c = sandbox();
    assert.equal(c._hqLevelY(S, 0), 0); assert.equal(c._hqLevelY(S, 1), S.wallH); assert.equal(c._hqLevelY(S, 2), S.wallH + R3.h);
    assert.equal(c._hqLevelR(S, 0), S.radius); assert.equal(c._hqLevelR(S, 1), S.mezz.outer); assert.equal(c._hqLevelR(S, 2), S.mezz.outer);
    assert.equal(c._hqLevelOf(S, 0), 0); assert.equal(c._hqLevelOf(S, S.wallH), 1); assert.equal(c._hqLevelOf(S, S.wallH + R3.h), 2); assert.equal(c._hqLevelOf(S, S.wallH + 1.2), 1);
    const noRing = Object.assign({}, S, { ring3: null });
    assert.equal(c._hqLevelY(noRing, 2), S.wallH, 'a hall with no third ring reads level 2 as the mezzanine');
    assert.equal(c._hqLevelOf(noRing, 40), 1);
});

test('THE CLIMB: a walker on the mezzanine walks into the flight, up every tread and out onto the ring by the step rule alone; the ring carries them round to every exploration door\'s landing', () => {
    const c = sandbox();
    const rMid = (ST.rIn + R3.outer) / 2, top = S.wallH + R3.h, dir = ST.to > ST.from ? 1 : -1;
    let y = S.wallH, deg = ST.from - dir * 6;
    /* onto the flight: off the flight the layer is undefined (the mezzanine's) */
    assert.equal(c._hqRing3At(pol(deg, rMid).x, pol(deg, rMid).z, y), undefined, 'the mezzanine walkway before the flight is not the ring\'s');
    let climbed = 0;
    for (let i = 0; i <= 200; i++) {
        deg += dir * 0.25;
        const p = pol(deg, rMid), ny = c._hqRing3At(p.x, p.z, y);
        assert.notEqual(ny, null, 'a tread is never a wall (deg ' + deg.toFixed(2) + ')');
        if (ny === undefined) continue;
        assert.ok(ny - y <= STEP + 1e-9 && y - ny <= DROP, 'each tread is one step (deg ' + deg.toFixed(2) + ': ' + y + ' → ' + ny + ')');
        if (ny > y) climbed++;
        y = ny;
        if (Math.abs(y - top) < 1e-9 && _outOfFlight(deg)) break;
    }
    function _outOfFlight(d) { return dir > 0 ? d > ST.to + 0.5 : d < ST.to - 0.5; }
    assert.equal(y, top, 'the walker stands on the ring');
    assert.equal(climbed, ST.steps, 'every tread climbed once');
    /* round the ring at the doors' landing radius (Rw − 2.6, _hqGoTo) */
    const rLand = R3.outer - 2.6;
    for (let a = 0; a <= 360; a += 0.5) {
        const p = pol(ST.to + dir * a, rLand), ny = c._hqRing3At(p.x, p.z, top);
        assert.equal(ny, top, 'the ring is floor all the way round at r ' + rLand + ' (deg ' + (ST.to + dir * a) + ')');
    }
    for (const d of ROOM.doors.filter(d => (d.level || 0) === 2)) {
        const p = pol(d.deg, rLand);
        assert.equal(c._hqRing3At(p.x, p.z, top), top, d.id + '\'s landing spot is on the ring');
    }
});

test('the walls: the rail from the slab side, the void inside it, the strip beside the flight; from below the layer is the mezzanine\'s / the floor\'s; a free query is never the ring\'s', () => {
    const c = sandbox(), top = S.wallH + R3.h;
    const at = (deg, r, curY) => { const p = pol(deg, r); return c._hqRing3At(p.x, p.z, curY); };
    const off = ST.from - 20;
    assert.equal(at(off, R3.inner + 0.3, top), null, 'the rail band, from the slab');
    assert.equal(at(off, R3.inner - 0.5, top), undefined, 'over the void: the floor below decides (a railed balcony — the drop is refused there)');
    assert.equal(at(off, R3.inner + 0.3, S.wallH), undefined, 'the same band from the mezzanine is the mezzanine\'s');
    assert.equal(at(off, 23, S.wallH), undefined, 'the mezzanine under the slab');
    assert.equal(at(off, 23, null), undefined, 'a free query is never the ring\'s');
    assert.equal(at(off, 23, 0), undefined, 'the floor under both slabs');
    /* the strip beside the flight is the ring's for a walker up there, the walkway for one below */
    const mid = (ST.from + ST.to) / 2;
    assert.equal(at(mid, ST.rIn - 0.6, top), top, 'the strip inside the flight\'s band');
    assert.equal(at(mid, ST.rIn - 0.6, S.wallH), undefined, 'the walkway under the strip');
    assert.equal(at(mid, ST.rIn + 0.05, S.wallH), null, 'the flight\'s inner rail');
    assert.equal(at(mid, R3.outer - 0.05, S.wallH), null, 'the drum');
    assert.ok(at(mid, ST.rIn + 0.7, S.wallH) > S.wallH && at(mid, ST.rIn + 0.7, S.wallH) < top, 'a tread mid-flight, from either level');
});

test('the air and the boom: the slab is a mass, the rail a fence, the flight solid; the camera stops under the slab from below and at the rail from above', () => {
    const c = sandbox(), top = S.wallH + R3.h, off = ST.from - 30;
    const air = (deg, r, y) => { const p = pol(deg, r); return c._hqRing3Air(p.x, p.z, y); };
    assert.equal(air(off, 23, top - R3.thick / 2), false, 'inside the slab');
    assert.equal(air(off, 23, top + 0.5), true, 'over the slab');
    assert.equal(air(off, 23, S.wallH + 1.0), true, 'the mezzanine\'s air under it');
    assert.equal(air(off, R3.inner + 0.3, top + 0.5), false, 'the rail');
    assert.equal(air(off, R3.inner + 0.3, top + R3.railH + 0.5), true, 'over the rail');
    const mid = (ST.from + ST.to) / 2;
    assert.equal(air(mid, (ST.rIn + R3.outer) / 2, S.wallH + 0.2), false, 'inside the flight');
    const cam = (deg, r, py, walkerY) => { const p = pol(deg, r); return c._hqRing3Cam(p.x, p.z, py, walkerY); };
    assert.equal(cam(off, 23, top - 0.1, S.wallH), true, 'from the mezzanine the slab overhead stops the boom');
    assert.equal(cam(off, 23, S.wallH + 1.5, S.wallH), false, 'the mezzanine\'s own air');
    assert.equal(cam(off, 22, top + 0.1, top), true, 'from the ring the boom never sinks into the slab');
    assert.equal(cam(off, 22, top + 1.6, top), false, 'the ring\'s air');
    assert.equal(cam(off, R3.inner - 2, top - 1, top), false, 'the void inside the ring is open to the boom');
});

test('the builder runs on a stub scene: the slab (cut over the flight), its underside, the fascia, the inner rail, the strip rail, the treads; the ring\'s rail joins the skateboarding register', () => {
    const c = { console, Math, performance: { now: () => 0 } };
    vm.createContext(c);
    const counts = { sector: 0, band: 0, arc: 0, inst: 0, box: 0, bar: 0 };
    c.THREE = {
        Vector3: function (x, y, z) { this.x = x || 0; this.y = y || 0; this.z = z || 0; this.copy = function (v) { this.x = v.x; this.y = v.y; this.z = v.z; return this; }; this.clone = function () { return new c.THREE.Vector3(this.x, this.y, this.z); }; this.set = function (x, y, z) { this.x = x; this.y = y; this.z = z; return this; }; },
        Quaternion: function () { this.setFromEuler = function () { return this; }; },
        Euler: function () { this.set = function () { return this; }; },
        Matrix4: function () { this.compose = function () { return this; }; },
        BoxGeometry: function () {}, InstancedMesh: function (g, m, n) { counts.inst += n; this.setMatrixAt = function () {}; this.instanceMatrix = {}; },
        FrontSide: 0, BackSide: 1,
    };
    c._hq = { shellGroup: { add: function (m) { if (m && m.kind) counts[m.kind]++; } }, rails: [], ramps: [] };
    c._hqUnits = () => 1; c._hqMat = () => ({}); c._hqRad = d => d * Math.PI / 180;
    c._hqSectorMesh = () => ({ kind: 'sector' }); c._hqBand = () => ({ kind: 'band' }); c._hqRailArc = () => ({ kind: 'arc' });
    c._hqBox = () => ({ kind: 'box', position: new c.THREE.Vector3() }); c._hqBar = () => ({ kind: 'bar' });
    c._hqPolarW = (deg, r, y) => new c.THREE.Vector3(Math.sin(deg * Math.PI / 180) * r, y, -Math.cos(deg * Math.PI / 180) * r);
    vm.runInContext(extract('_hqBuildRing3'), c);
    c._hqBuildRing3(ROOM);
    assert.equal(counts.sector, 4, 'two slab sectors + their undersides (the full band off the flight, the strip over it)');
    assert.equal(counts.band, 1, 'the fascia');
    assert.equal(counts.arc, 4, 'the inner rail\'s two arcs + the strip rail\'s two');
    assert.ok(counts.inst >= ST.steps + 20, 'the treads and the rail posts are instanced (' + counts.inst + ')');
    assert.ok(counts.bar >= 5, 'the flight\'s sloped rail');
    assert.ok(c._hq.rails.some(r => r.arc && r.level === 2 && r.a0 === 0 && r.a1 === 360 && Math.abs(r.y - (S.wallH + R3.h + R3.railH)) < 1e-9), 'the ring\'s rail is a grind (SKATEBOARDING 9.8)');
});

test('the source sites: every rotunda level reader goes through the helpers; _hqSurface / _hqAirOK / _hqCamBlocked / _hqFindTarget read the ring; the shell builds it; the directory names it', () => {
    const fn = extract;
    assert.ok(/if \(S\.ring3\) \{ var r3 = _hqRing3At\(x, z, curY\); if \(r3 === null\) return null; if \(r3 !== undefined\) y = r3; \}/.test(fn('_hqSurface')), '_hqSurface: the layer at the top of the rotunda branch');
    assert.ok(fn('_hqSurface').indexOf('_hqRing3At') < fn('_hqSurface').indexOf('var stairs = room.stairs || [];'), 'read before the ground flights');
    assert.ok(/if \(S\.ring3 && !_hqRing3Air\(x, z, y\)\) return false;/.test(fn('_hqAirOK')), '_hqAirOK');
    assert.ok(/var wallR = _hqLevelR\(S, _hqLevelOf\(S, y\)\);/.test(fn('_hqAirOK')), '_hqAirOK: the drum by level');
    assert.ok(/if \(S\.ring3 && _hqRing3Cam\(px, pz, py, pl \? pl\.y : 0\)\) return true;/.test(fn('_hqCamBlocked')), '_hqCamBlocked');
    assert.ok(/var lvl = _hqLevelOf\(S, pl\.y\);/.test(fn('_hqFindTarget')), '_hqFindTarget: the level of the walker');
    assert.ok(/return _hqLevelR\(S, level\);/.test(fn('_hqWallR')), '_hqWallR');
    assert.ok(/if \(S\.ring3\) _hqBuildRing3\(room\);/.test(fn('_hqBuildShell')), 'the shell builds the ring after the mezzanine rail');
    assert.ok(/var y0 = level \? _hqLevelY\(S, level\) : _hqDoorFloorY\(room, door\);/.test(fn('_hqBuildDoors')), 'a door\'s floor by level');
    assert.ok(/var level = c\.level \|\| 0, y0 = _hqLevelY\(S, level\);/.test(fn('_hqBuildCounters')), 'a counter\'s floor by level');
    assert.ok(/var level = p\.level \|\| 0, y0 = _hqLevelY\(S, level\);/.test(fn('_hqPlaceProps')), 'a prop\'s floor by level');
    assert.ok(/var y = _hqLevelY\(S, spec\.level \|\| 0\) \+ \(spec\.y \|\| 0\);/.test(fn('_hqSpawnCharacter')), 'a character\'s floor by level');
    assert.ok(!/level \? S\.wallH/.test(renderer) && !/\? \(S\.wallH \|\| 0\) : 0/.test(renderer), 'no bare "level ? S.wallH" reader survives');
    assert.ok(/level: _hqLevelOf\(H\.room\.shell, pl\.y\)/.test(renderer), 'the debug readout');
    assert.ok(/d\.level >= 2 \? 'THE GALLERY · '/.test(mapjs) && /c\.level >= 2 \? 'THE GALLERY · '/.test(mapjs), 'the directory names the third ring');
});
