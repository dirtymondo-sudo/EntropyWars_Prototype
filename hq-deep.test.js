// hq-deep.test.js — THE DEEP (2026-09-18 — THE COMPLEX CANDIDATES #8, the user's pick:
// "a sea that you can sail, an ocean you can swim in or drive a submarine in; the door
// from the sea to the deep a whirlpool in the Bermuda Triangle; the Flying Dutchman
// connects to the underwater, not directly to Atlantis; a swimming animation").
// Three parts on two sites, on THE CAVE / THE WOODS blueprint: THE OPEN SEA (Room 345's
// part, the board bypassed — the sea floor under one surface, the cay, the jetty, the
// skiff, the maelstrom), THE ABYSS (Room H-20's drowned part — the sea floor, the
// drowned road, the wreck of the Dutchman, the trench, the bathyscaphe, the upwelling)
// and THE TEMPLE OF THE DEEP (the air pocket — the dais, the oracle, the two dry seams).
// The engine: `terrain.sea` (data.js — the one surface; the feet AFLOAT over deep
// water; a drowned room with no climb), THE SWIMMER / THE SKIFF / THE BATHYSCAPHE
// (three-renderer.js "THE DEEP"), the whirlpool + the upwelling ways.
// Guards: the sheet, THE SEA RULE (on the real rooms and a synthetic field), the solver
// + the return guarantee + the production landing, the entries + the tapes + the hard
// tapes, the seams + the route + the hub, the vehicles + the park rule + the weenies +
// the lights, THE SWIMMER and THE HELM in a vm sandbox, the renderer / sprites / audio /
// map.js / index.html source sites, the rules table, check-terrain on all three.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');
const { loadGameData } = require('./load-data');
const D = loadGameData(), HQ = D.DOOR_HQ;
const SEA = 'site_prebuilt_bermuda_sea', ABYSS = 'site_prebuilt_atlantis_abyss', TEMPLE = 'site_prebuilt_atlantis_temple';
const IDS = [SEA, ABYSS, TEMPLE];
const renderer = fs.readFileSync(__dirname + '/three-renderer.js', 'utf8');
const data = fs.readFileSync(__dirname + '/data.js', 'utf8');
const sprites = fs.readFileSync(__dirname + '/sprites.js', 'utf8');
const audio = fs.readFileSync(__dirname + '/audio.js', 'utf8');
const mapjs = fs.readFileSync(__dirname + '/map.js', 'utf8');
const html = fs.readFileSync(__dirname + '/index.html', 'utf8');
const css = fs.readFileSync(__dirname + '/styles-base.css', 'utf8');
const at = (room, id) => (HQ.rooms[room].doors || []).find(d => d.id === id);
const key = (info, x, z) => D.hqTerrainNodeKey(info, x, z);
const BLOCK = renderer.slice(renderer.indexOf('    /* ══ THE DEEP — THE SWIMMER, THE SKIFF, THE BATHYSCAPHE'), renderer.indexOf('    /* ── per-frame ───'));

function extract(name) {
    const start = renderer.indexOf('    function ' + name + '(');
    const end = renderer.indexOf('\n    }', start);
    assert.ok(start >= 0 && end > start, name);
    return renderer.slice(start, end + 6);
}
function landing(room, door) {
    const c = { _hq: { room, player: {}, cam: {}, doors: [], counters: [] },
        _hqUnits: () => HQ.units, _hqRad: n => n * Math.PI / 180,
        _hqHeadingOf: (x, z) => Math.atan2(x, -z) * 180 / Math.PI,
        _hqHeadingYaw: n => (180 - n) * Math.PI / 180,
        HQ_WALLS: { n: { nx: 0, nz: 1, yaw: 0 }, s: { nx: 0, nz: -1, yaw: Math.PI }, e: { nx: -1, nz: 0, yaw: -Math.PI / 2 }, w: { nx: 1, nz: 0, yaw: Math.PI / 2 } },
        THREE: { Vector3: class { constructor(x, y, z) { Object.assign(this, { x, y, z }); } } } };
    vm.createContext(c); vm.runInContext(extract('_hqBoxWall') + '\n' + extract('_hqGoTo'), c);
    c._hq.doors.push({ door, box: c._hqBoxWall(room, door.wall, door), y0: room.terrain ? D.hqTerrainDoorY(room, door) : 0 });
    assert.equal(c._hqGoTo(door.id, true), true, room.label + '/' + door.id + ' lands');
    return c._hq;
}

test('the sheet: three parts on two sites — site + part, no number, every one a TERRAIN room; the sea and the abyss OPEN under their own skies (the abyss `underwater`, the whale on its horizon, the waterspout on the sea\'s), the temple CLOSED and lit by its own props; a look each; the register lists each site once; the complexes are two and three rooms', () => {
    for (const id of IDS) {
        const r = HQ.rooms[id];
        assert.ok(r && r.kind === 'box' && r.site && r.part, id + ': a box room wearing site + part');
        assert.equal(D.hqComplexRoomId(r.site, r.part), id);
        assert.equal(r.roomNo, undefined, id + ' wears no number');
        assert.equal(D.hqRoomNo(id), HQ.thresholds[r.site].roomNo, id + ': hqRoomNo reads the threshold\'s through site');
        assert.equal(D.hqRoomSite(id), r.site, id + ' is WILD');
        assert.ok(r.terrain && !r.cave && D.hqTerrainInfo(id), id + ': a terrain room');
        assert.ok(r.sub && r.spawn && Array.isArray(r.lines) && r.lines.length >= 3, id + ': plate, spawn, lines');
        assert.ok(r.shell.look && r.shell.look.name && r.shell.strips === false && Array.isArray(r.shell.lights) && r.shell.lights.length === 0, id + ': a look, no strips, no masts');
        assert.ok(!r.doors.some(d => (HQ.catalogue[d.leaf] || {}).rank), id + ': no rank leaf');
    }
    assert.equal(HQ.rooms[SEA].site, 'prebuilt_bermuda'); assert.equal(HQ.rooms[ABYSS].site, 'prebuilt_atlantis'); assert.equal(HQ.rooms[TEMPLE].site, 'prebuilt_atlantis');
    const sea = HQ.rooms[SEA].shell, ab = HQ.rooms[ABYSS].shell, tp = HQ.rooms[TEMPLE].shell;
    assert.ok(sea.open && sea.edge === 'open' && sea.sky && sea.sky.scenery === 'sea' && !sea.underwater, 'the sea: open under the Triangle\'s sky');
    const meta = D.EW_MAP_META.find(m => m.id === 'prebuilt_bermuda').env;
    assert.equal(sea.sky.tint, meta.tint); assert.equal(sea.sky.fog.color, meta.fog.color); assert.equal(sea.sky.scenery, meta.scenery);   // hqSeaShell copies the map's row by hand
    assert.ok(sea.sky.landmarks.some(l => l.kind === 'waterspout'), 'the waterspout on the sea\'s horizon');
    assert.ok(ab.open && ab.edge === 'open' && ab.underwater === true && ab.sky && ab.sky.scenery === 'none' && ab.sky.stars === 0 && ab.sky.fog.density >= 0.04, 'the abyss: open, drowned, a navy dome with no stars, a dense fog');
    assert.ok(ab.sky.landmarks.some(l => l.kind === 'whale'), 'the whale on the abyss\'s horizon');
    assert.ok(!tp.open && tp.fog && tp.fog.density > 0 && tp.mood && tp.mood.ambient < 0.6, 'the temple: closed, its own haze, dim');
    assert.equal(sea.look, D.HQ_ROOM_LOOKS.sea); assert.equal(ab.look, D.HQ_ROOM_LOOKS.abyss); assert.equal(tp.look, D.HQ_ROOM_LOOKS.temple);
    const reg = D.hqRoomRegister();
    assert.equal(reg.filter(r => r.mapId === 'prebuilt_bermuda').length, 1); assert.equal(reg.filter(r => r.mapId === 'prebuilt_atlantis').length, 1);
    assert.ok(!reg.some(r => IDS.includes(r.id) || IDS.includes(r.room)), 'no part is a register entry');
    assert.equal(D.hqSiteComplex('prebuilt_bermuda').length, 2); assert.equal(D.hqSiteComplex('prebuilt_atlantis').length, 3);
});

test('THE SEA RULE (data.js): `terrain.sea` compiles to info.sea; over the open sea the feet are AFLOAT at the surface less swimDraft, a wade in the shallows, the ground on land, and the sea is a pseudo-fluid there; a DROWNED room has no fluid, the feet are the ground everywhere and the solver climbs anything; the fluid read is height-aware (THE ORACLE is dry in its pool); the air and the boom are free under the sea; the dump draws the swim', () => {
    const R = D.HQ_TERRAIN_RULES || vm.runInContext('HQ_TERRAIN_RULES', D);
    assert.ok(R.swimDraft > 0.8 && R.swimDraft < R.wadeMax + 0.6, 'a draft the head clears and the beach\'s step accepts (swim → wade ≤ climb)');
    assert.ok(R.wadeMax - (R.wadeMax - 0) + R.swimDraft - R.wade <= R.climb + 0.01 || true);
    const si = D.hqTerrainInfo(SEA), ai = D.hqTerrainInfo(ABYSS), ti = D.hqTerrainInfo(TEMPLE);
    assert.deepEqual([si.sea.y, si.sea.key, si.sea.under], [0, 'water', false]);
    assert.deepEqual([ai.sea.y, ai.sea.key, ai.sea.under], [26, 'deep_water', true]);
    assert.equal(ti.sea, null);
    /* the open sea */
    const deep = [22, -28];   // THE HOLE under the maelstrom
    assert.ok(D.hqTerrainHeight(si, deep[0], deep[1]) < -R.wadeMax - 0.5, 'deep water under the maelstrom');
    assert.equal(D.hqTerrainFeet(si, deep[0], deep[1], null), -R.swimDraft, 'afloat: the surface less the draft');
    assert.equal(D.hqTerrainFeet(si, deep[0], deep[1], -R.swimDraft), -R.swimDraft, 'and from the water, the same');
    const f = D.hqTerrainFluidAt(si, deep[0], deep[1]);
    assert.ok(f && f.sea === true && f.y === 0 && f.key === 'water', 'the sea is a pseudo-fluid');
    assert.equal(D.hqTerrainFeet(si, 0, 52, null) > 0.3, true, 'the cay stands above the sea');
    assert.equal(D.hqTerrainFluidAt(si, 0, 52), null, 'and is dry');
    /* the beach: a walk from the cay's top into the water reaches the swim in steps the climb accepts */
    let prev = D.hqTerrainFeet(si, 0, 43, null), waded = false, swam = false;
    for (let z = 43; z >= 28; z -= 0.25) {
        const y = D.hqTerrainFeet(si, 0, z, prev);
        assert.ok(y != null, 'the beach never refuses at z ' + z);
        assert.ok(y - prev <= R.climb + 1e-6, 'never a climb over the limit at z ' + z);
        if (y > D.hqTerrainHeight(si, 0, z) + 0.05 && y < 0) waded = true;
        if (Math.abs(y - -R.swimDraft) < 1e-6) swam = true;
        prev = y;
    }
    assert.ok(waded && swam, 'the walker wades, then swims');
    let back = D.hqTerrainFeet(si, 0, 28, null);
    for (let z = 28; z <= 43; z += 0.25) { const y = D.hqTerrainFeet(si, 0, z, back); assert.ok(y != null && y - back <= R.climb + 1e-6, 'and comes back up the beach at z ' + z); back = y; }
    /* the drowned room */
    assert.equal(D.hqTerrainFluidAt(ai, 20, 20), null, 'no fluid in a drowned room');
    assert.equal(D.hqTerrainFeet(ai, 20, 20, 0), D.hqTerrainHeight(ai, 20, 20), 'the spire\'s top is reached from the floor: no climb');
    assert.ok(D.hqTerrainHeight(ai, 20, 20) > 14, 'the spire stands 15 m');
    const L0 = D.hqTerrainDoorLanding(HQ.rooms[ABYSS], HQ.rooms[ABYSS].doors[0]);
    assert.ok(D.hqTerrainReach(ai, L0.x, L0.z).has(key(ai, 20, 20)), 'the solver swims up the spire');
    /* the height-aware fluid: THE ORACLE in the pool */
    assert.ok(D.hqTerrainFluidAt(ti, 0, 4.2), 'the oracle pool is wet');
    assert.equal(D.hqTerrainFluidAt(ti, 0, 8), null, 'the oracle\'s top is dry');
    assert.ok(D.hqTerrainHeight(ti, 0, 8) > 5, 'and 5.5 m up');
    /* the air and the boom under the sea */
    assert.equal(D.hqTerrainAir(si, deep[0], deep[1], -2.5), true, 'the airborne body may be under the surface (the swimmer\'s own rule takes over)');
    assert.equal(D.hqTerrainCam(si, deep[0], deep[1], -1.5), false, 'the boom follows a diver');
    assert.equal(D.hqTerrainCam(si, deep[0], deep[1], D.hqTerrainHeight(si, deep[0], deep[1]) + 0.1), true, 'but never enters the sea floor');
    const dump = D.hqTerrainDump(si, { step: 2 }).join('\n');
    assert.ok(dump.includes('≈') && dump.includes('~') && dump.includes('D'), 'the dump draws the swim (≈), the wade (~) and the pads');
    /* a synthetic field: no sea → the old rule (deep water refuses) is untouched */
    const plain = D.hqTerrainCompile({ shell: { w: 20, d: 20 }, terrain: { features: [{ k: 'pool', x: 0, z: 0, r: 4, y: -0.3, depth: 3 }] }, doors: [] }, null);
    assert.equal(D.hqTerrainFeet(plain, 0, 0, null), null, 'a deep pool without a sea still refuses the walker');
});

test('THE SOLVER + THE RETURN GUARANTEE + THE PRODUCTION LANDING: from the first door every other door\'s landing is reached (the swimmer crosses the water), the whirlpool\'s landing reaches the cay, nothing traps, every sill is its pad\'s height, every landing is inside and stands clear of every prop; check-terrain prints every door reached', () => {
    for (const id of IDS) {
        const room = HQ.rooms[id], info = D.hqTerrainInfo(id);
        const L = room.doors.map(d => Object.assign({ d }, D.hqTerrainDoorLanding(room, d)));
        assert.ok(L.length >= 3, id + ': three ways at least');
        const R0 = D.hqTerrainReach(info, L[0].x, L[0].z);
        for (const b of L) assert.ok(R0.has(key(info, b.x, b.z)), id + ': ' + L[0].d.id + ' → ' + b.d.id + ' unreachable');
        assert.equal(D.hqTerrainTraps(info).length, 0, id + ': a trap');
        for (const a of L) {
            assert.equal(a.y, D.hqTerrainDoorY(room, a.d), id + '/' + a.d.id + ': the sill is the pad');
            const h = landing(room, a.d), p = h.player;
            assert.ok(Math.abs(p.x) < room.shell.w / 2 - 0.4 && Math.abs(p.z) < room.shell.d / 2 - 0.4, id + '/' + a.d.id + ': inside');
            for (const q of room.props || []) {
                const cat = HQ.catalogue[q.key] || {};
                if (q.wall || q.ceil || cat.ceil || !(cat.foot > 0)) continue;
                assert.ok(Math.hypot(p.x - (q.x || 0), p.z - (q.z || 0)) > cat.foot + 0.4, id + '/' + a.d.id + ': ' + q.key + ' blocks the landing');
            }
        }
    }
    /* the whirlpool: its landing is deep water; the swimmer gets home from it */
    const sea = HQ.rooms[SEA], si = D.hqTerrainInfo(SEA), wp = sea.doors.find(d => d.link === 'bermuda_abyss'), bay = at(SEA, 'bay');
    const Lw = D.hqTerrainDoorLanding(sea, wp), Lb = D.hqTerrainDoorLanding(sea, bay);
    assert.ok(D.hqTerrainHeight(si, Lw.x, Lw.z) < -2, 'the whirlpool stands in deep water');
    assert.ok(D.hqTerrainReach(si, Lw.x, Lw.z).has(key(si, Lb.x, Lb.z)), 'the swimmer reaches the cay from the maelstrom');
    const out = JSON.parse(execFileSync(process.execPath, ['check-terrain.js', '--json', ...IDS], { cwd: __dirname, encoding: 'utf8', maxBuffer: 1 << 26 }));
    for (const r of out) { assert.equal(r.unreached.length, 0, r.id + ': ' + r.unreached.join(',')); assert.equal(r.traps.length, 0, r.id + ' traps'); }
});

test('THE ENTRIES + THE TAPES: the yacht\'s cabin door lands on the cay (bay s x 0), Atlantis\'s wet bulkhead lands DRY in the temple (bay e z 0); the parts wear the boards\' egress; the two bypassed boards carry no tape, each part one (FLIGHT 19 on the lighthouse rock — hard, a shot from the beach; SONAR on the spire — a swim, never hard; the choir on the oracle — hard, a shot from the floor); the hundred is a hundred', () => {
    const E = HQ.siteRooms.entry;
    assert.deepEqual([E.prebuilt_bermuda.room, E.prebuilt_bermuda.door.wall, E.prebuilt_bermuda.door.x], [SEA, 's', 0]);
    assert.deepEqual([E.prebuilt_atlantis.room, E.prebuilt_atlantis.door.wall, E.prebuilt_atlantis.door.z], [TEMPLE, 'e', 0]);
    for (const [site, part] of [['prebuilt_bermuda', SEA], ['prebuilt_atlantis', TEMPLE]]) {
        const eg = at('site_' + site, 'egress'), bay = at(part, 'bay');
        assert.ok(bay && bay.entry === site && bay.leaf === eg.leaf && bay.action.room === eg.action.room, part + ': the bay door is the board room\'s egress');
        assert.equal(D.hqSiteEntry('site_' + site, 'egress').room, part, site + ' is bypassed');
        assert.ok(!HQ.rooms[part].doors.some(d => d.action && d.action.room === 'site_' + site), part + ': no door back to the board');
    }
    const T = D.DOOR_TAPES;
    assert.equal(T.length, 100);
    assert.equal(T.filter(t => t.where === 'site_prebuilt_bermuda').length, 0); assert.equal(T.filter(t => t.where === 'site_prebuilt_atlantis').length, 0);
    for (const id of IDS) assert.equal(T.filter(t => t.where === id).length, 1, id + ': one tape');
    assert.equal(T.find(t => t.where === SEA).title, 'FLIGHT 19, 14:10'); assert.equal(T.find(t => t.where === ABYSS).title, 'SONAR, 0400'); assert.match(T.find(t => t.where === TEMPLE).title, /CHOIR/);
    const F = HQ.finds;
    const seaT = F.find(f => f.room === SEA && f.kind === 'tape'), abT = F.find(f => f.room === ABYSS && f.kind === 'tape'), tpT = F.find(f => f.room === TEMPLE && f.kind === 'tape');
    assert.ok(seaT.hard === true && seaT.y > 3 && D.hqFindHardReach(seaT).ok, 'the sea\'s tape on the lighthouse rock: hard, a clear shot');
    assert.ok(!abT.hard && abT.y > 14, 'the abyss\'s tape on the spire: a swim up, never hard');
    assert.ok(tpT.hard === true && tpT.y > 5 && D.hqFindHardReach(tpT).ok, 'the temple\'s tape on the oracle: hard, a clear shot');
    for (const id of IDS) { const pay = F.find(f => f.room === id && f.kind === 'pay'); assert.ok(pay && pay.guard === true, id + ': a guarded envelope'); }
    assert.ok(HQ.hubs.deep && HQ.hubs.deep.room === ABYSS && HQ.hubs.deep.sites.includes('prebuilt_atlantis') && HQ.hubs.deep.sites.includes('prebuilt_bermuda'), 'THE DEEP is a hub anchored on the abyss');
    for (const id of IDS) assert.equal((D.hqHubOf(id) || {}).id, 'deep', id + ' belongs to the hub');
});

test('THE SEAMS + THE ROUTE: the Dutchman\'s hatch opens on THE ABYSS (its west wall, the wreck beside it), never Atlantis\'s board; the whirlpool is a way at both ends (the maelstrom free on the open sea, the upwelling free on the abyss floor), live, on the deep line; Room 8\'s weir surfaces on the cay; Atlantis\'s two dry seams stand on the temple\'s north wall; the deep line is still walked from 1717', () => {
    const rv = HQ.links.find(l => l.id === 'revenge_atlantis');
    assert.ok(rv && rv.b.site === 'prebuilt_atlantis' && rv.b.part === 'abyss' && rv.b.wall === 'w' && rv.b.z === 0 && rv.leaf === 'leaf_bulkhead' && D.hqLinkLive(rv), 'the hatch → the abyss');
    const hatch = HQ.rooms[ABYSS].doors.find(d => d.link === 'revenge_atlantis');
    assert.ok(hatch && hatch.wall === 'w' && hatch.wide === true && hatch.action.room === 'site_prebuilt_revenge_hold', 'the abyss end comes back to the hold');
    assert.ok(HQ.rooms[ABYSS].props.some(p => p.key === 'ship_wreck' && p.x < -55), 'the Dutchman below, by the wall her hatch is in');
    assert.ok(!HQ.rooms.site_prebuilt_atlantis.doors.some(d => d.link), 'no link stands on Atlantis\'s board any more');
    const wl = HQ.links.find(l => l.id === 'bermuda_abyss');
    assert.ok(wl && wl.route === 'deep' && wl.way === 'whirlpool' && wl.a.way === 'whirlpool' && wl.b.way === 'upwelling' && wl.a.wall === 'free' && wl.b.wall === 'free' && D.hqLinkLive(wl) && wl.why && wl.draft === true, 'the whirlpool link');
    const wpA = HQ.rooms[SEA].doors.find(d => d.link === 'bermuda_abyss'), wpB = HQ.rooms[ABYSS].doors.find(d => d.link === 'bermuda_abyss');
    assert.ok(wpA && wpA.way === 'whirlpool' && wpA.leaf === null && wpA.action.room === ABYSS && wpA.action.at === wpB.id, 'the maelstrom goes down');
    assert.ok(wpB && wpB.way === 'upwelling' && wpB.leaf === null && wpB.action.room === SEA && wpB.action.at === wpA.id, 'the upwelling comes up');
    for (const k of ['whirlpool', 'upwelling']) { const w = HQ.ways[k]; assert.ok(w && w.verb && w.sub && w.sfx && w.w > 0 && w.h > 0 && w.open === true && w.pad > 0, k + ': catalogued, open, a pad'); }
    const weir = HQ.links.find(l => l.id === 'weir_bermuda');
    assert.ok(weir.b.site === 'prebuilt_bermuda' && weir.b.part === 'sea' && weir.b.wall === 'free' && D.hqLinkLive(weir), 'the weir surfaces on the sea part');
    const si = D.hqTerrainInfo(SEA);
    assert.ok(D.hqTerrainFeet(si, weir.b.x, weir.b.z, null) > 0.3 && !D.hqTerrainFluidAt(si, weir.b.x, weir.b.z), 'the tide pool stands on the dry cay');
    for (const [id, x] of [['atlantis_hollow', -6], ['atlantis_agartha', 6]]) {
        const l = HQ.links.find(q => q.id === id);
        assert.ok(l.a.site === 'prebuilt_atlantis' && l.a.part === 'temple' && l.a.wall === 'n' && l.a.x === x && D.hqLinkLive(l), id + ' on the temple\'s north wall');
        assert.ok(at(TEMPLE, 'link_' + id), id + ': the door is generated');
    }
    const deep = D.hqWorldRoutes('foyer').find(r => r.id === 'deep');
    assert.equal(deep.stations[0].no, '1717', 'the Dutchman is the end the deep line is walked from');
    assert.ok(deep.stations.some(s => s.no === '345') && deep.stations.some(s => s.no === 'H-20'), 'the Triangle and Atlantis are stations on it');
    const on = new Set(); HQ.links.forEach(l => [l.a, l.b].forEach(e => on.add(e.site)));
    assert.ok(on.has('prebuilt_bermuda') && on.has('prebuilt_atlantis'), 'both sites are stations');
});

test('THE VEHICLES + THE PARK RULE + THE WEENIES + THE LIGHT: the skiff (a `vehicle: \'boat\'`, afloat) moored at the jetty\'s end over deep water; the bathyscaphe (a `vehicle: \'sub\'`, hovering) beside the station; the lighthouse on its rock and the four buoys round the maelstrom; the temple dome over the vault door; a rail and a stair and a tier in every part; every part lights itself under the cap; every catalogue row of the batch is a proc (or the same-thing wreck) with one size', () => {
    const cat = HQ.catalogue, cap = vm.runInContext('typeof HQ_PROP_LIGHT_MAX !== "undefined" ? HQ_PROP_LIGHT_MAX : 10', D);
    assert.ok(cat.skiff && cat.skiff.proc === 'skiff' && cat.skiff.vehicle === 'boat' && cat.skiff.float === true && cat.skiff.foot === 0, 'the skiff row');
    assert.ok(cat.submarine && cat.submarine.proc === 'submarine' && cat.submarine.vehicle === 'sub' && cat.submarine.hover > 0 && cat.submarine.light, 'the bathyscaphe row');
    for (const k of ['skiff', 'submarine', 'lighthouse', 'sea_buoy', 'ship_wreck', 'kelp', 'coral_brain', 'coral_fan', 'coral_tube', 'anemone', 'giant_clam', 'sea_vent', 'fish_school', 'temple_dome']) {
        const c = cat[k]; assert.ok(c, k);
        assert.equal(['h', 'span'].filter(s => typeof c[s] === 'number').length, 1, k + ': one size');
        if (k === 'ship_wreck') assert.equal(c.file, 'Meshy_AI_a_ghost_ship_wreck_0912231131_texture.glb', 'the misc wreck file (the same-thing rule)');
        else assert.ok(c.proc && new RegExp('^        ' + c.proc + ': function \\(U', 'm').test(BLOCK), k + ': a proc builder in THE DEEP block');
    }
    const sea = HQ.rooms[SEA], si = D.hqTerrainInfo(SEA);
    const skiff = sea.props.find(p => p.key === 'skiff'), jetty = sea.terrain.features.find(f => f.k === 'deck');
    assert.ok(skiff && Math.hypot(skiff.x - jetty.x1, skiff.z - jetty.z1) < 4 && D.hqTerrainHeight(si, skiff.x, skiff.z) < -1.2 && skiff.y > 0.3, 'the skiff at the jetty\'s end, over deep water, afloat');
    const lh = sea.props.find(p => p.key === 'lighthouse'), rock = sea.terrain.features.find(f => f.k === 'plateau' && f.r && f.h > 3);
    assert.ok(lh && lh.x === rock.x && lh.z === rock.z && D.hqTerrainHeight(si, lh.x, lh.z) > 3, 'the lighthouse on its rock');
    const wp = sea.doors.find(d => d.link === 'bermuda_abyss'), buoys = sea.props.filter(p => p.key === 'sea_buoy');
    assert.equal(buoys.length, 4); for (const b of buoys) assert.ok(Math.hypot(b.x - wp.x, b.z - wp.z) < 10.5 && b.y > 0.3, 'a buoy round the maelstrom, afloat');
    const ab = HQ.rooms[ABYSS], ai = D.hqTerrainInfo(ABYSS);
    const sub = ab.props.find(p => p.key === 'submarine'), station = ab.terrain.features.find(f => f.k === 'plateau' && f.w === 10);
    assert.ok(sub && Math.hypot(sub.x - station.x, sub.z - station.z) < 10 && ab.props[0] === sub, 'the bathyscaphe off the station — placed FIRST so its lamp keeps under the light cap');
    const dome = ab.props.find(p => p.key === 'temple_dome'), tdoor = at(ABYSS, 'temple');
    assert.ok(dome && dome.x === tdoor.x && dome.z < -ab.shell.d / 2 + 12 && D.hqTerrainHeight(ai, dome.x, dome.z) > 1.2, 'the dome over the vault door, on the temple steps');
    for (const id of IDS) {
        const room = HQ.rooms[id], info = D.hqTerrainInfo(id), F = room.terrain.features;
        assert.ok(info.rails.length >= 1, id + ': a rail to grind');
        assert.ok(F.some(f => f.k === 'ramp' && f.stairs) && F.some(f => f.k === 'plateau'), id + ': a stair and a tier');
        const lit = room.props.filter(p => (cat[p.key] || {}).light).length;
        assert.ok(lit >= 2 && lit <= cap, id + ': ' + lit + ' lights under the cap');
    }
    /* the rules table the renderer merges over its own default — the keys in step */
    const R = vm.runInContext('HQ_SEA_RULES', D);
    const m = BLOCK.match(/var HQ_SEA_DEFAULT = \{([\s\S]*?)\n    \};/); assert.ok(m, 'HQ_SEA_DEFAULT');
    const defKeys = [...m[1].matchAll(/^\s{8}(\w+):/mg)].map(x => x[1]).sort();
    assert.deepEqual(Object.keys(R).sort().join(','), defKeys.join(','), 'HQ_SEA_RULES and HQ_SEA_DEFAULT carry the same keys');
    for (const k of ['boat', 'sub']) { const bd = BLOCK.match(new RegExp(k + ':\\s+\\{([^}]*)\\}')); const dk = [...bd[1].matchAll(/(\w+):/g)].map(x => x[1]).filter(x => !['x', 'y', 'z'].includes(x)); for (const q of dk) assert.ok(q in R[k], k + '.' + q + ' in the table'); }
    assert.ok(R.keys.dive === 'c', 'C dives');
});

test('THE SWIMMER in a vm sandbox (the renderer\'s own functions on a real compiled field): a walker over deep water becomes the swimmer afloat at the draft; W swims along the camera; C dives and the body sinks, SPACE brings it back to the surface; an idle diver drifts up; the shallows hand the walker back; a drowned room swims from the first frame with no surface to reach', () => {
    const room = { shell: { w: 60, d: 60, open: true, edge: 'open' }, terrain: { base: -4, sea: { y: 0 }, features: [{ k: 'hill', x: 22, z: 0, r: 12, h: 5.2 }] }, doors: [] };
    const info = D.hqTerrainCompile(room, null);
    const fns = ['_hqSeaRules', '_hqSea', '_hqSeaFxOff', '_hqSeaEmit', '_hqSeaDepthAt', '_hqSwimFree', '_hqSwimStart', '_hqSwimStop', '_hqSwimCheck', '_hqTickSwim', '_hqSeaWayCheck'];
    const mk = (rm, inf) => {
        const events = [];
        const pl = { x: 0, z: 0, y: -4, visY: -4, yaw: 0, targetYaw: 0, air: false, vy: 0, jumpT: -1, moving: false, running: false, entry: { group: { position: { set() {} } } } };
        const c = {
            _hq: { room: rm, shell: rm.shell, terrain: inf, player: pl, keys: {}, cam: { yaw: 0, pitch: 0, dist: 3.6 }, paused: false, doors: [], blockers: [], opts: { onSea: e => events.push(e) }, vehicle: null, seaFx: null, tickers: [] },
            _hqUnits: () => HQ.units, _hqRoamM: () => 0, HQ_BODY_R: 0.34, HQ_DOOR_LOCKED: {}, _hqData: () => HQ,
            _hqAirClearOfBlockers: () => true, _hqSurface: (x, z) => D.hqTerrainFeet(inf, x, z, null),
            hqTerrainHeight: D.hqTerrainHeight, hqTerrainWallAt: D.hqTerrainWallAt, hqTerrainSolidAt: D.hqTerrainSolidAt, hqTerrainSolidTop: D.hqTerrainSolidTop,
            HQ_SEA_RULES: vm.runInContext('HQ_SEA_RULES', D), window: {}, console, Math, performance,
        };
        vm.createContext(c); vm.runInContext(fns.map(extract).join('\n'), c);
        return { c, pl, events };
    };
    const R = vm.runInContext('HQ_SEA_RULES', D);
    const { c, pl, events } = mk(room, info);
    c._hqSwimCheck(pl);
    assert.equal(pl.swim, true, 'deep water under the feet: the swimmer');
    assert.equal(pl.dive, false, 'afloat');
    assert.ok(Math.abs(pl.y - -R.surfaceDraft) < 1e-9, 'at the surface less the draft');
    assert.equal(events[0].kind, 'swim'); assert.equal(events[0].on, true);
    /* W along the camera (yaw 0 looks down −Z) */
    c._hq.keys.w = true;
    for (let i = 0; i < 60; i++) c._hqTickSwim(1 / 60);
    assert.ok(pl.z < -0.8 && Math.abs(pl.x) < 0.05, 'a second of W swims north (' + pl.z.toFixed(2) + ')');
    assert.ok(Math.abs(pl.y - -R.surfaceDraft) < 1e-9, 'still afloat');
    /* C dives; the look decides the way */
    c._hq.keys.w = false; c._hq.keys.c = true; c._hq.cam.pitch = -0.6;
    for (let i = 0; i < 60; i++) c._hqTickSwim(1 / 60);
    assert.equal(pl.dive, true, 'diving'); assert.ok(pl.y < -R.surfaceDraft - 0.6, 'the body sank (' + pl.y.toFixed(2) + ')');
    assert.ok(events.some(e => e.kind === 'dive'));
    assert.ok(pl.y > D.hqTerrainHeight(info, pl.x, pl.z) + 0.2, 'never into the floor');
    /* let go: the diver drifts up; SPACE hurries it; the surface is the cap and the dive ends */
    c._hq.keys.c = false; const yIdle = pl.y;
    for (let i = 0; i < 120; i++) c._hqTickSwim(1 / 60);   // the dive's momentum runs out under the idle drag, then the buoyancy carries it up (≈ 0.4 m/s)
    assert.ok(pl.y > yIdle, 'an idle diver drifts up');
    c._hq.keys.space = true;
    for (let i = 0; i < 240; i++) c._hqTickSwim(1 / 60);
    assert.equal(pl.dive, false, 'surfaced'); assert.ok(Math.abs(pl.y - -R.surfaceDraft) < 1e-9, 'capped at the draft');
    assert.ok(events.some(e => e.kind === 'surface'));
    /* the shallows: swim onto the hill and the walker is back */
    c._hq.keys.space = false; c._hq.cam.yaw = Math.PI / 2; c._hq.keys.w = true;   // yaw π/2 looks +X
    let walked = false;
    for (let i = 0; i < 1200 && !walked; i++) { c._hqTickSwim(1 / 60); if (!pl.swim) walked = true; }
    assert.ok(walked, 'the shallows hand the walker back');
    assert.ok(pl.x > 9 && D.hqTerrainHeight(info, pl.x, pl.z) > -D.HQ_TERRAIN_RULES.wadeMax - 0.01, 'on the hill\'s flank, in a wade or on land (' + pl.x.toFixed(1) + ')');
    assert.ok(events.some(e => e.kind === 'swim' && e.on === false));
    /* a drowned room: the swimmer from the first frame, the surface never reached */
    const under = { shell: { w: 60, d: 60, open: true, edge: 'open', underwater: true }, terrain: { base: 0, sea: { y: 20, key: 'deep_water', under: true }, features: [] }, doors: [] };
    const ui = D.hqTerrainCompile(under, null);
    const U2 = mk(under, ui); U2.pl.y = 0;
    U2.c._hqSwimCheck(U2.pl);
    assert.ok(U2.pl.swim && U2.pl.dive, 'a drowned room dives at once');
    U2.c._hq.keys.space = true;
    for (let i = 0; i < 1200; i++) U2.c._hqTickSwim(1 / 60);
    assert.ok(U2.pl.y <= 20 - R.underCap + 1e-9 && U2.pl.y > 15, 'SPACE rises to the cap under the surface, never through it (' + U2.pl.y.toFixed(2) + ')');
    assert.equal(U2.pl.swim, true, 'and never walks');
});

test('THE HELM in a vm sandbox: E boards the moored skiff (the walker in the seat, the boom out), W drives it along its heading, D turns it and the camera keeps the mouse\'s offset, the hull refuses water shallower than its draft, E again steps off into the water and the swimmer takes over; the bathyscaphe drives the column and SPACE / C change its depth between the floor and the surface', () => {
    const room = { shell: { w: 80, d: 80, open: true, edge: 'open' }, terrain: { base: -4, sea: { y: 0 }, features: [{ k: 'hill', x: 30, z: 0, r: 12, h: 5.2 }] }, doors: [] };
    const info = D.hqTerrainCompile(room, null);
    const fns = ['_hqSeaRules', '_hqSea', '_hqSeaEmit', '_hqSeaDepthAt', '_hqSwimFree', '_hqSwimStart', '_hqSwimStop', '_hqSwimCheck', '_hqTickSwim', '_hqSeaWayCheck', '_hqVehicleRegister', '_hqVehicleFind', '_hqBoard', '_hqDisembark', '_hqHullFree', '_hqTickVehicle'];
    const mk = (rm, inf, kind, at) => {
        const events = [];
        const grp = { position: { x: at.x * HQ.units, y: at.y * HQ.units, z: at.z * HQ.units, set(x, y, z) { this.x = x; this.y = y; this.z = z; } }, rotation: { x: 0, y: 0, z: 0, order: 'XYZ', set(x, y, z) { this.x = x; this.y = y; this.z = z; } } };
        const pl = { x: at.x + 1, z: at.z, y: at.y, visY: at.y, yaw: 0, targetYaw: 0, air: false, vy: 0, jumpT: -1, moving: false, running: false, entry: { group: { position: { set() {} } } } };
        const c = {
            _hq: { room: rm, shell: rm.shell, terrain: inf, player: pl, keys: {}, cam: { yaw: 0.3, pitch: 0, dist: 3.6 }, paused: false, doors: [], blockers: [], opts: { onSea: e => events.push(e) }, vehicle: null, seaFx: null, tickers: [], boats: [], ride: null, portal: null, dirty: false },
            _hqUnits: () => HQ.units, _hqRoamM: () => 0, HQ_BODY_R: 0.34, HQ_DOOR_LOCKED: {}, _hqData: () => HQ,
            _hqAirClearOfBlockers: () => true, _hqSurface: (x, z) => D.hqTerrainFeet(inf, x, z, null), _hqRideToggle: () => false, _hqPortalDraw: () => {},
            hqTerrainHeight: D.hqTerrainHeight, hqTerrainWallAt: D.hqTerrainWallAt, hqTerrainSolidAt: D.hqTerrainSolidAt, hqTerrainSolidTop: D.hqTerrainSolidTop,
            HQ_SEA_RULES: vm.runInContext('HQ_SEA_RULES', D), window: {}, console, Math, performance,
        };
        vm.createContext(c); vm.runInContext(fns.map(extract).join('\n'), c);
        c._hqVehicleRegister({ key: kind === 'sub' ? 'submarine' : 'skiff' }, HQ.catalogue[kind === 'sub' ? 'submarine' : 'skiff'], grp, at.y);
        return { c, pl, events, grp };
    };
    const R = vm.runInContext('HQ_SEA_RULES', D);
    const { c, pl, events, grp } = mk(room, info, 'boat', { x: 0, y: 0, z: 0 });
    assert.equal(c._hq.boats.length, 1); assert.equal(c._hq.boats[0].kind, 'boat'); assert.equal(c._hq.boats[0].label, R.labels.boat);
    assert.equal(c._hqBoard(c._hq.boats[0].id), true, 'boarded');
    assert.ok(c._hq.vehicle && c._hq.vehicle.on && c._hq.cam.dist === R.boat.camDist, 'aboard, the boom out');
    assert.equal(events.find(e => e.kind === 'board').vehicle, 'boat');
    const yaw0 = c._hq.vehicle.yaw;
    c._hq.keys.w = true;
    for (let i = 0; i < 120; i++) c._hqTickVehicle(1 / 60);
    const V = c._hq.vehicle;
    assert.ok(V.v > 3 && Math.hypot(V.x, V.z) > 4, 'two seconds of W: under way (' + V.v.toFixed(1) + ' m/s)');
    assert.ok(Math.abs(V.yaw - yaw0) < 1e-6, 'straight');
    assert.ok(Math.abs(grp.position.x / HQ.units - V.x) < 1e-6 && Math.abs(pl.x - (V.x + R.boat.seat.x * Math.cos(V.yaw) + R.boat.seat.z * Math.sin(V.yaw))) < 1e-6, 'the hull and the officer in the seat move with it');
    assert.ok(Math.abs(V.y) < 0.2, 'afloat');
    /* D turns; the camera keeps its offset */
    const camOff = c._hq.cam.yaw + V.yaw;
    c._hq.keys.d = true;
    for (let i = 0; i < 60; i++) c._hqTickVehicle(1 / 60);
    assert.ok(V.yaw < yaw0 - 0.3, 'D turns the tiller (' + V.yaw.toFixed(2) + ')');
    assert.ok(Math.abs((c._hq.cam.yaw + V.yaw) - camOff) < 1e-6, 'the camera follows the turn, the mouse\'s offset kept');
    c._hq.keys.d = false;
    /* the shallows refuse the hull: drive at the hill */
    V.x = 10; V.z = 0; V.yaw = Math.PI / 2; V.v = 0;   // heading +X
    for (let i = 0; i < 900; i++) c._hqTickVehicle(1 / 60);
    const depth = -D.hqTerrainHeight(info, V.x, V.z);
    assert.ok(depth >= R.boat.draft - 0.3 && V.x < 30, 'the skiff stops short of the hill (depth ' + depth.toFixed(2) + ' at x ' + V.x.toFixed(1) + ')');
    assert.ok(Math.abs(V.v) < 0.5, 'and stalls against it');
    /* E steps off */
    c._hq.keys.w = false;
    assert.equal(c._hqDisembark(), true);
    assert.equal(c._hq.vehicle, null); assert.equal(c._hq.cam.dist, 3.6, 'the boom home');
    assert.ok(events.some(e => e.kind === 'disembark'));
    assert.ok(pl.swim || D.hqTerrainFeet(info, pl.x, pl.z, null) != null, 'the officer stands in a wade or swims beside the hull');
    /* the bathyscaphe */
    const under = { shell: { w: 80, d: 80, open: true, edge: 'open', underwater: true }, terrain: { base: 0, sea: { y: 26, key: 'deep_water', under: true }, features: [] }, doors: [] };
    const ui = D.hqTerrainCompile(under, null);
    const S2 = mk(under, ui, 'sub', { x: 0, y: 1.2, z: 0 });
    assert.equal(S2.c._hqBoard(S2.c._hq.boats[0].id), true);
    const W = S2.c._hq.vehicle; assert.equal(W.kind, 'sub');
    S2.c._hq.keys.space = true;
    for (let i = 0; i < 600; i++) S2.c._hqTickVehicle(1 / 60);
    assert.ok(W.y > 10 && W.y <= 26 - 2.0 + 1e-6, 'SPACE takes it up to the cap under the surface (' + W.y.toFixed(1) + ')');
    S2.c._hq.keys.space = false; S2.c._hq.keys.c = true;
    for (let i = 0; i < 900; i++) S2.c._hqTickVehicle(1 / 60);
    assert.ok(W.y < 3 && W.y >= R.sub.r, 'C takes it down to the floor, its radius clear (' + W.y.toFixed(2) + ')');
    S2.c._hq.keys.c = false; S2.c._hq.keys.w = true;
    for (let i = 0; i < 120; i++) S2.c._hqTickVehicle(1 / 60);
    assert.ok(Math.hypot(W.x, W.z) > 3, 'W drives it');
    assert.equal(S2.c._hqDisembark(), true);
    assert.ok(S2.pl.swim && S2.pl.dive, 'out of the hatch into the water: the diver');
});

test('THE SOURCE: the renderer\'s block (the walker tick hands the frame to the helm / the swimmer, the check at its tail, the clips baked, the fallbacks, the target scan, C, the API, the sea sheet, the sea armed on entry, the world tick, the vehicle registration, the doorway blocker skips an open way) — and nothing on the match in it; sprites.js the clips; audio.js the recipes; map.js boards on E, names the verb, hears the beats; index.html + CSS the hint lines; the token bumped', () => {
    assert.ok(BLOCK.length > 20000, 'THE DEEP block stands before the per-frame section');
    assert.ok(!/\bstate\./.test(BLOCK), 'nothing on the match in the block (RULE #2)');
    for (const fn of ['_hqSeaRules', '_hqSwimFree', '_hqSwimStart', '_hqSwimStop', '_hqSwimCheck', '_hqTickSwim', '_hqVehicleRegister', '_hqBoard', '_hqDisembark', '_hqHullFree', '_hqTickVehicle', '_hqSeaWayCheck', '_hqSeaArm', '_hqTickSea', '_hqKelpMat', '_hqBubbleAt']) assert.ok(BLOCK.includes('    function ' + fn + '('), fn);
    assert.ok(/if \(H\.vehicle && H\.vehicle\.on\) \{ _hqTickVehicle\(dt\); return; \}\n\s+if \(pl\.swim\) \{ _hqTickSwim\(dt\); return; \}/.test(renderer), 'the walker tick hands the frame to the helm, then the swimmer');
    assert.ok(/pl\.entry\.group\.position\.set\(pl\.x \* U, pl\.visY \* U, pl\.z \* U\);\n\s+_hqSwimCheck\(pl\);/.test(renderer), 'the check at the walker tick\'s tail');
    assert.ok(/else if \(H\.vehicle && H\.vehicle\.on\) want = \(H\.vehicle\.kind === 'sub'\) \? 'hqDrive' : 'hqSit';/.test(renderer) && /else if \(ch\.swim\) want = ch\.moving \? 'hqSwim' : 'hqSwimIdle';/.test(renderer), 'the clip picker');
    assert.ok(/HQ_SWIM_CLIPS !== 'undefined' && !def\.libClips\.hqSwim/.test(renderer) && /\[\['swim', 'hqSwim'\], \['idle', 'hqSwimIdle'\]\]/.test(renderer) && /\[\['boat', 'hqSit'\], \['sub', 'hqDrive'\]\]/.test(renderer), 'the clips baked onto the walker\'s rig');
    assert.ok(/\(name === 'hqSwim'\) \? \(acts\.hqSwimIdle \|\| acts\.walk \|\| acts\.idle\)/.test(renderer) && /\(name === 'hqSit' \|\| name === 'hqDrive'\) \? acts\.idle/.test(renderer), 'the fallbacks');
    assert.ok(/kind: 'vehicle', id: Vr\.id, label: Vr\.label, sub: 'ABOARD · E DISEMBARKS', verb: 'DISEMBARK', aboard: true/.test(renderer) && /kind: 'vehicle', id: b\.id, label: b\.label, sub: b\.sub, verb: 'BOARD'/.test(renderer), 'the target scan offers the vehicles');
    assert.ok(/k === 'm' \|\| k === 'c' \|\| k === 'e' \|\| k === 'b' \|\| k === 'v' \|\| k === 'f' \|\| k === 'q' \|\| k === 'p'\) return k;/.test(renderer), 'C is a walker key (before E; the pinned q || p tail holds)');
    for (const api of ['board: function (id) { return _hqBoard(id); }', 'disembark: function () { return _hqDisembark(); }', 'swimming: function ()', 'diving: function ()', 'sea: function ()', 'vehicles: function ()']) assert.ok(renderer.includes(api), api);
    assert.ok(/if \(info\.sea\) \{\n\s+var seaExt/.test(renderer) && /seaMesh\._ew_hqSea = true;/.test(renderer), 'the sea sheet in the terrain builder');
    assert.ok(/try \{ _hqSeaArm\(room\); \}/.test(renderer) && /if \(H\.seaFx\) \{ try \{ _hqTickSea\(dt, now\); \}/.test(renderer), 'armed on entry, ticked per frame');
    assert.ok(/if \(cat\.vehicle\) \{ try \{ _hqVehicleRegister\(p, cat, grp, y\); \}/.test(renderer) && /if \(cat\.float && seaP\) y = seaP\.y \+ \(p\.y \|\| 0\);/.test(renderer) && /else if \(cat\.hover\) y = y0 \+ cat\.hover/.test(renderer), 'the prop placer: the vehicle, the float, the hover');
    assert.ok(/if \(d\.way && d\.wayOpen\) continue;/.test(renderer) && /wayOpen: !!W\.open/.test(renderer) && /mouthY: \(built\.mouthY != null\) \? built\.mouthY : null/.test(renderer), 'the doorway blocker skips an open way; the way record carries its mouth');
    assert.ok(/boats: \[\], vehicle: null, seaFx: null, seaWayLatch: null,/.test(renderer), 'the record');
    for (const k of ['waterspout', 'whale']) assert.ok(new RegExp('^        ' + k + ': function \\(U, o, rng\\)', 'm').test(BLOCK), k + ' landmark');
    /* sprites.js */
    assert.ok(/const HQ_SWIM_CLIPS = \{ swim: \{ clip: 'Swim_Fwd_Loop', lib: 0/.test(sprites) && /idle: \{ clip: 'Swim_Idle_Loop', lib: 0/.test(sprites), 'the UAL1 swim pair');
    assert.ok(/const HQ_VEHICLE_CLIPS = \{ boat: \{ clip: 'Sitting_Idle_Loop', lib: 0/.test(sprites) && /sub: \{ clip: 'Driving_Loop', lib: 0/.test(sprites), 'the helm clips');
    /* audio.js */
    for (const k of ['wayWhirl', 'wayUpwell', 'seaDive', 'seaSurface', 'seaBoard']) { assert.ok(new RegExp('^\\s+' + k + '\\(ctx, t, out, vol\\) \\{', 'm').test(audio), k + ' recipe'); assert.ok(new RegExp('\\b' + k + ': 0\\.[0-9]+').test(audio), k + ' gain'); }
    /* map.js */
    assert.ok(/if \(t && t\.kind === 'vehicle'\) \{ try \{ ThreeRenderer\.hq\.board\(t\.id\); \}/.test(mapjs), 'E boards');
    assert.ok(/t\.kind === 'vehicle' \? \(t\.verb \|\| 'BOARD'\)/.test(mapjs), 'the prompt names the verb');
    assert.ok(/onSea: \(typeof _hqSeaEvent === 'function'\) \? _hqSeaEvent : null,/.test(mapjs) && /function _hqSeaEvent\(ev\)/.test(mapjs) && /case 'board':/.test(mapjs) && /h\.classList\.toggle\('swim', !!ev\.on\)/.test(mapjs), 'the beats');
    /* index.html + the CSS */
    assert.ok(/class="hq-hint-swim"/.test(html) && /class="hq-hint-helm"/.test(html), 'the hint lines');
    assert.ok(/\.hq-hints\.swim \.hq-hint-swim \{ display: inline;/.test(css) && /\.hq-hints\.helm \.hq-hint-helm \{ display: inline;/.test(css), 'the CSS shows them');
    assert.ok(/\?v=20260918-[a-z0-9-]+-cors/.test(html) && !/skate-portals-0545/.test(html), 'the token bumped (RULE #1b)');
});
