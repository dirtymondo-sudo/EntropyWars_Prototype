// hq-population.test.js — THE POPULATION + THE ROUNDS (2026-09-19): every area inhabited by the proper
// units (the tags the game already keeps — DOOR_TEXT.POINT_OF_ENTRY + the RACE_PROFILES / EW_MAP_META
// `biomes`), Disaster City and D.O.O.R. HQ the most diverse, and the people WALK routed loops through
// the room's doors, into the next room (the traveller ledger). data.js: HQ_POPULATION_RULES,
// hqSiteResidents, hqRoomPopulation, hqSpotRoams. three-renderer.js "THE ROUNDS": the nav lattice
// off the walker's own surface rule, A*, the stops, the loop, the exit + the return, the ledger.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { loadGameData } = require('./load-data');
const D = loadGameData(), HQ = D.DOOR_HQ, R = D.HQ_POPULATION_RULES;
const TR = fs.readFileSync(__dirname + '/three-renderer.js', 'utf8');

function extract(name) {
    const start = TR.indexOf('    function ' + name + '(');
    const end = TR.indexOf('\n    }', start);
    assert.ok(start >= 0 && end > start, name);
    return TR.slice(start, end + 6);
}

test('THE RULES: the table, the residents by the tags — natives first, then the biome-tagged, never the agency', () => {
    assert.ok(R.perM2 > 50 && R.max >= 4 && R.cityMax > R.max && R.walkSpeed > 0.5 && R.walkSpeed < 2.4, 'the table');
    assert.equal(R.wildWeights.length, 3); assert.equal(R.cityWeights.length, 3);
    const rs = D.hqSiteResidents('prebuilt_haunted');
    assert.deepEqual(rs.slice(0, rs.natives).sort().join(','), D.doorSiteCrossings('The Haunted House').sort().join(','), 'the natives lead');
    assert.ok(rs.natives >= 3 && rs.length > rs.natives, 'then the tagged');
    for (const r of rs) { assert.ok(rs.tiers[r], r); assert.notEqual(r, 'men in black'); }
    const tagged = rs.filter(r => rs.tiers[r] === 'biome');
    for (const r of tagged) assert.ok((D.RACE_PROFILES[r].biomes || []).some(b => ['gothic', 'clandestine'].indexOf(b) >= 0), r + ' wears the site\'s biome');
    assert.equal(D.hqSiteResidents('nope').length, 0);
});

test('EVERY WILD ROOM is inhabited by its own: the first draw is a TRUE native, the crowd is sized by the floor, seeded by the day', () => {
    const rooms = Object.keys(HQ.rooms).filter(k => HQ.rooms[k].site && HQ.rooms[k].part && HQ.rooms[k].kind === 'box');
    assert.ok(rooms.length > 60, rooms.length);
    let checked = 0;
    for (const id of rooms) {
        const p = D.hqRoomPopulation(id, null, { date: '2026-09-19' });
        assert.ok(p.kind === 'wild' || p.kind === 'city', id + ' ' + p.kind);
        assert.ok(p.pool.length >= 3, id + ' pool ' + p.pool.length);
        assert.ok(p.n >= (HQ.rooms[id].quiet ? 1 : R.min) && p.n <= R.cityMax, id + ' n=' + p.n);
        const meta = D.EW_MAP_META.find(m => m.id === p.site);
        if (p.kind === 'wild') {
            const natives = D.doorSiteCrossings(meta.label);
            if (natives.length) assert.ok(natives.indexOf(p.draw[0].race) >= 0, id + ': the first draw is a native (' + p.draw[0].race + ')');
        }
        for (const d of p.draw) assert.ok(p.pool.indexOf(d.race) >= 0 && /^hq-roam-\d+$/.test(d.id), id);
        assert.equal(JSON.stringify(D.hqRoomPopulation(id, null, { date: '2026-09-19' }).draw), JSON.stringify(p.draw), id + ' holds for the day');
        checked++;
    }
    assert.ok(checked > 60);
    const q = D.hqRoomPopulation('site_prebuilt_derelict_airlock', null); assert.ok(HQ.rooms.site_prebuilt_derelict_airlock.quiet && q.n <= R.quietN, 'a quiet room keeps one');
});

test('DISASTER CITY and D.O.O.R. HQ are the most diverse: the streets a crowd of many kinds from three cities + ordinary people, the hall the roster passing through', () => {
    for (const id of ['site_prebuilt_downtown_streets', 'site_prebuilt_strip_streets', 'site_prebuilt_cyberpunk_streets']) {
        const p = D.hqRoomPopulation(id, null, { date: '2026-09-19' });
        assert.equal(p.kind, 'city'); assert.equal(p.hub, 'city');
        assert.ok(p.n >= 10, id + ' n=' + p.n);
        const kinds = new Set(p.draw.map(d => d.race));
        assert.ok(kinds.size >= 7, id + ' ' + kinds.size + ' kinds');
        const tiers = new Set(p.draw.map(d => d.tier));
        assert.ok(tiers.has('people') || tiers.has('city'), id + ' has people from beyond the site');
        assert.ok(p.pool.some(r => (D.RACE_PROFILES[r].types || []).indexOf('human') >= 0), 'ordinary people on the street');
    }
    const u = D.hqRoomPopulation('site_prebuilt_downtown_sewers', null);
    assert.equal(u.hub, 'underworld'); for (const d of u.draw) assert.ok(R.underworld.indexOf(d.race) >= 0, 'the sewers: ' + d.race);
    const h = D.hqRoomPopulation('central_egress', null, { date: '2026-09-19' });
    assert.equal(h.kind, 'facility'); assert.ok(h.n >= 7 && h.n <= R.hqMax, 'the hall n=' + h.n);
    assert.ok(new Set(h.draw.map(d => d.race)).size >= 6, 'the hall is diverse');
    const prof = { account: { unlockedUnits: ['knight', 'nun'] } };
    const hp = D.hqRoomPopulation('central_egress', prof, { date: '2026-09-19' });
    for (const d of hp.draw) assert.ok(['knight', 'nun'].indexOf(d.race) >= 0, 'the officer\'s own roster: ' + d.race);
    assert.equal(D.hqRoomPopulation('car', null).n, 0, 'the car carries nobody extra');
    assert.ok(D.hqRoomPopulation('ring_m', null).n >= 1, 'the rings');
    assert.ok(D.hqSpotRoams('x', 0, { x: 0, z: 0, roam: true }) && !D.hqSpotRoams('x', 0, { pose: 'hqSit' }) && !D.hqSpotRoams('x', 0, { stay: true }) && !D.hqSpotRoams('x', 0, { clone: true }));
});

/* THE ROUNDS in a sandbox: a flat 20 × 20 box with a wall across the middle (a gap at the east end), two doors */
function sandbox() {
    const c = { console, Math, performance: { now: () => c._now }, _now: 1000, window: {}, HQ_POPULATION_RULES: R, THREE: {}, Map, Set, Float32Array };
    vm.createContext(c);
    const fns = ['_hqRoundsRules', '_hqRoundsOff', '_hqDefWalks', '_hqRoundsRng', '_hqRoundsRange', '_hqNavBounds', '_hqNavStart', '_hqNavStatics', '_hqNavQuery', '_hqNavBuild', '_hqNavCellOf', '_hqNavY', '_hqNavStep', '_hqNavSnap',
        '_hqNavPath', '_hqNavClear', '_hqNavSmooth', '_hqNavRandom', '_hqRoundsExits', '_hqRoundsDoorLanding', '_hqRoundsStops', '_hqRoundsAssign', '_hqRoundsPath', '_hqRoundsNext', '_hqRoundsSetVisible', '_hqRoundsSwing', '_hqRoundsArrive', '_hqRoundsReturn', '_hqTickRoamer', '_hqTickRounds'];
    const consts = TR.match(/    var HQ_NAV_CELL = [^\n]+\n    var HQ_ROUNDS_DEFAULT = [^\n]+\n    var _hqTravellers = \[\];/)[0];
    vm.runInContext(consts + '\n' + fns.map(extract).join('\n') + `
        var HQ_STEP_TOL = 0.62, HQ_DOOR_LOCKED = { sealed: 1, clearance: 1, off: 1 };
        function _hqRad(d) { return d * Math.PI / 180; }
        function _hqUnits() { return 73; }
        function _hqHeadingYaw(face) { return Math.PI - _hqRad(face); }
        function _hqNormDeg(d) { d = d % 360; if (d < 0) d += 360; return d; }
        function _hqHeadingOf(vx, vz) { return _hqNormDeg(Math.atan2(vx, -vz) * 180 / Math.PI); }
        function _hqLevelY() { return 0; }
        function _hqRoamM() { return 0; }
        function _hqHasGround() { return false; }
        function _hqCaveTop() { return null; }
        function _hqPolarW(deg, r, y) { var a = _hqRad(deg); return { x: Math.sin(a) * r * 73, y: (y || 0) * 73, z: -Math.cos(a) * r * 73 }; }
        function _hqData() { return { rooms: { A: { label: 'ROOM A' } } }; }
        /* the wall: z in [-0.4, 0.4] for x < 7 (the gap at the east end); NPC bodies are blockers with npc: true */
        function _hqSurface(x, z, curY, ig) {
            if (Math.abs(x) > 9.7 || Math.abs(z) > 9.7) return null;
            if (Math.abs(z) < 0.45 && x < 7) return null;
            if (!ig) for (var i = 0; i < _hq.blockers.length; i++) { var b = _hq.blockers[i]; if (Math.hypot(b.obj.position.x / 73 - x, b.obj.position.z / 73 - z) < b.rad + 0.34) return null; }
            return 0;
        }
        function hqWorldGraph() { return { edges: [{ from: 'A', door: 'north', to: 'B', at: 'south' }] }; }
        function mkGroup(x, z) { return { position: { x: x * 73, y: 0, z: z * 73, set: function (a, b, c) { this.x = a; this.y = b; this.z = c; } }, visible: true }; }
        var _hq = { opts: { room: 'A' }, room: { kind: 'box', shell: { w: 20, d: 20 }, npcSpots: [{ x: -6, z: 6, face: 90 }], spawn: { x: 0, z: 8, face: 0 } }, blockers: [], chars: [], counters: [], player: { x: 50, z: 50, y: 0 }, paused: false,
                   doors: [{ door: { id: 'north' }, box: { wx: 0, wz: -10, nx: 0, nz: 1 }, y0: 0, state: 'open', motion: {} }, { door: { id: 'west' }, box: { wx: -10, wz: 5, nx: 1, nz: 0 }, y0: 0, state: 'open', motion: {} }] };
        function mkChar(id, x, z) { var g = mkGroup(x, z); var ch = { id: id, kind: 'npc', race: 'ghost', gender: 'male', entry: { group: g, actions: {} }, x: x, z: z, y: 0, visY: 0, yaw: 0, targetYaw: 0, moving: false, def: { libClips: {} } }; _hq.chars.push(ch); _hq.blockers.push({ obj: g, rad: 0.42, y: 0, top: 2.6, npc: true }); return ch; }
    `, c);
    return c;
}
test('THE NAV: the lattice off the surface rule leaves the people out of the furniture; A* routes round the wall through the gap; a straight line is pulled straight', () => {
    const c = sandbox();
    vm.runInContext('mkChar("hq-roam-0", 3, 3); _hqNavStart(); while (!_hqNavBuild(1000)) {}', c);
    const N = vm.runInContext('_hq.nav', c);
    assert.ok(N.done && N.walk > 600 && N.walk < N.nx * N.nz, 'walk ' + N.walk + ' of ' + (N.nx * N.nz));
    assert.ok(isFinite(vm.runInContext('_hqNavY(_hqNavCellOf(3, 3).i, _hqNavCellOf(3, 3).j)', c)), 'the cell under a person is walkable for another person');
    assert.ok(!isFinite(vm.runInContext('_hqNavY(_hqNavCellOf(0, 0).i, _hqNavCellOf(0, 0).j)', c)), 'the wall is not');
    const path = vm.runInContext('_hqNavPath(0, 5, 0, -5)', c);
    assert.ok(path && path.length >= 2, 'a path across the wall exists');
    assert.ok(path.some(p => p.x > 6.5), 'it goes through the gap at the east end: ' + JSON.stringify(path.map(p => [+p.x.toFixed(1), +p.z.toFixed(1)])));
    assert.equal(path[path.length - 1].x, 0); assert.equal(path[path.length - 1].z, -5);
    const straight = vm.runInContext('_hqNavPath(-8, 5, 8, 5)', c);
    assert.equal(straight.length, 1, 'one straight leg on open floor: ' + JSON.stringify(straight));
    assert.equal(vm.runInContext('_hqNavPath(0, 5, 0, 5)', c).length, 1);
});

test('THE LOOP: the stops (two doors, a spot, the spawn), a walker walks its loop, goes OUT through the door that leads somewhere, files the ledger and comes back in by the other door', () => {
    const c = sandbox();
    vm.runInContext('var ch = mkChar("hq-roam-0", 3, 3); _hq.rounds = [ch]; _hqNavStart(); while (!_hqNavBuild(1000)) {}', c);
    const stops = vm.runInContext('_hqRoundsStops().map(function (s) { return s.kind + (s.doorId ? ":" + s.doorId : "") + (s.exit ? "!" : ""); })', c);
    assert.deepEqual(stops.sort().join(','), 'door:north!,door:west,spawn,spot', stops.join(','));
    vm.runInContext('ch.rounds = { stops: [_hqRoundsStops()[0], _hqRoundsStops()[2]], i: -1, path: null, pi: 0, state: "pause", until: 0, rng: _hqRoundsRng(7), stuck: 0, hold: 0, repathed: false, faceYaw: 0, leftBy: null }', c);
    const north = vm.runInContext('_hqRoundsStops()[0]', c); assert.equal(north.doorId, 'north'); assert.equal(north.exit.to, 'B');
    let seen = { walk: false, away: false, back: false }, maxT = 0;
    for (let f = 0; f < 4000; f++) {
        vm.runInContext('_now += 33; _hqTickRounds(1 / 30)', c);
        const st = vm.runInContext('ch.rounds.state', c), moving = vm.runInContext('ch.moving', c);
        if (st === 'walk' && moving) seen.walk = true;
        if (st === 'away') { seen.away = true; assert.equal(vm.runInContext('ch.entry.group.visible', c), false, 'hidden while away'); assert.equal(vm.runInContext('_hq.blockers[0].rad', c), 0, 'its body folded'); }
        if (seen.away && st !== 'away') { seen.back = true; break; }
    }
    assert.ok(seen.walk && seen.away && seen.back, JSON.stringify(seen));
    assert.equal(vm.runInContext('ch.entry.group.visible', c), true); assert.equal(vm.runInContext('_hq.blockers[0].rad', c), 0.42);
    assert.ok(vm.runInContext('Math.hypot(ch.x - (-10 + 1.7), ch.z - 5) < 0.6', c), 'back in by the WEST door: ' + vm.runInContext('[ch.x, ch.z]', c));
    const L = vm.runInContext('_hqTravellers', c);
    assert.equal(L.length, 1); assert.equal(L[0].to, 'B'); assert.equal(L[0].at, 'south'); assert.equal(L[0].race, 'ghost'); assert.equal(L[0].from, 'A');
    assert.ok(vm.runInContext('_hq.doors[0].npcOpenUntil > 0', c), 'the leaf swung');
    /* the panel freezes the room */
    vm.runInContext('_hq.paused = true; var bx = ch.x, bz = ch.z; for (var i = 0; i < 60; i++) { _now += 33; _hqTickRounds(1 / 30); } var frozen = (bx === ch.x && bz === ch.z); _hq.paused = false;', c);
    assert.ok(vm.runInContext('frozen', c), 'paused = frozen');
});

test('THE YIELD: the officer standing in the way holds a walker; EW_HQ_NO_ROUNDS stops everyone', () => {
    const c = sandbox();
    vm.runInContext('var ch = mkChar("hq-roam-0", -8, 5); _hq.rounds = [ch]; _hqNavStart(); while (!_hqNavBuild(1000)) {} ch.rounds = { stops: [{ kind: "cell", x: 8, z: 5, y: 0, face: 0 }, { kind: "cell", x: -8, z: 5, y: 0, face: 0 }], i: -1, path: null, pi: 0, state: "pause", until: 0, rng: _hqRoundsRng(3), stuck: 0, hold: 0, repathed: false, faceYaw: 0 }; _hq.player = { x: -5, z: 5, y: 0 };', c);
    for (let f = 0; f < 90; f++) vm.runInContext('_now += 33; _hqTickRounds(1 / 30)', c);
    assert.ok(vm.runInContext('ch.x', c) < -5.5, 'held short of the officer: ' + vm.runInContext('ch.x', c));
    vm.runInContext('_hq.player = { x: 50, z: 50, y: 0 }', c);
    for (let f = 0; f < 90; f++) vm.runInContext('_now += 33; _hqTickRounds(1 / 30)', c);
    assert.ok(vm.runInContext('ch.x', c) > -4, 'and walks on once the way is clear');
    vm.runInContext('window.EW_HQ_NO_ROUNDS = true; var x0 = ch.x; for (var i = 0; i < 30; i++) { _now += 33; _hqTickRounds(1 / 30); } var still = x0 === ch.x; window.EW_HQ_NO_ROUNDS = false;', c);
    assert.ok(vm.runInContext('still', c));
});

test('THE SITES: the spawn hook, the frame tick, the door swing, the walk clip, the hidden walker, the API, the patrols, the exports', () => {
    assert.ok(/try \{ _hqSpawnRounds\(room, opts\); \}/.test(extract('_hqSpawnPopulation')), 'the population spawns the rounds');
    assert.ok(/_hqTickRounds\(dt\);/.test(extract('_hqFrame')), 'the frame ticks them before the characters');
    assert.ok(extract('_hqFrame').indexOf('_hqTickRounds(dt);') < extract('_hqFrame').indexOf('_hqTickChars(dt);'));
    assert.ok(/d\.npcOpenUntil && d\.npcOpenUntil > performance\.now\(\)/.test(extract('_hqTickDoors')), 'a walker swings the leaf');
    assert.ok(/if \(ch\.rounds && ch\.kind !== 'player'\) \{ want = ch\.moving \? 'walk' : 'idle';/.test(extract('_hqTickChars')), 'the walk clip');
    assert.ok(/ch\.kind === 'player' \|\| ch\.away/.test(extract('_hqFindTarget')) && /ch\.away \|\| !okFn\(ch\)/.test(extract('_hqEncounterAim')), 'an away walker is neither E\'s nor the strike\'s');
    assert.ok(/spot: spec\.spot \|\| null, spotIndex:/.test(extract('_hqSpawnCharacter')) && /patrol: !!ag\.patrol && !ag\.pose/.test(extract('_hqSpawnPopulation')), 'the spot + the patrol ride the character');
    assert.ok(/roamers: function \(\)/.test(TR) && /nav: function \(\) \{ var N = _hq && _hq\.nav;/.test(TR) && /travellers: function \(\) \{ return _hqTravellers\.slice\(\); \}/.test(TR), 'the API');
    assert.ok(/EW_HQ_NO_ROUNDS/.test(extract('_hqRoundsOff')));
    assert.ok(HQ.rooms.central_egress.agents.filter(a => a.patrol).length >= 2, 'two hall agents patrol');
    const DJ = fs.readFileSync(__dirname + '/data.js', 'utf8');
    assert.ok(/window\.hqRoomPopulation = hqRoomPopulation; window\.hqSpotRoams = hqSpotRoams;/.test(DJ), 'the exports');
    /* the renderer's default keys agree with the table */
    const def = vm.runInContext('(' + TR.match(/    var HQ_ROUNDS_DEFAULT = (\{[^\n]+\});/)[1] + ')', vm.createContext({}));
    for (const k of Object.keys(def)) assert.ok(R[k] != null, 'HQ_POPULATION_RULES.' + k);
    /* nothing on state, nothing relayed (RULE #2) */
    const a = TR.indexOf('/* ══ THE ROUNDS — THE POPULATION WALKS'), b = TR.indexOf('/* ══ SKATEBOARDING — THE RIDER', a);
    assert.ok(a > 0 && b > a); const block = TR.slice(a, b);
    assert.ok(!/\bstate\./.test(block) && !/_emit\(/.test(block), 'viewer-local');
});
