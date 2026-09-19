// hq-cave.test.js — THE WELLS AND THE CAVE (HQ plan 9.3, 2026-09-15 rev 10)
// on THE TERRAIN (stage 4, 2026-09-17): every chamber a smooth height field —
// tiers, ramps, the sump, the lava rift, the river and its plank, the needle
// the tape stands on — solved with the walker's own rule (data.js
// hqTerrainReach), every door at its pad's sill, the wells on their tiers.
// The ASCII grid (rev 11) is retired from every chamber.
//
// Every well in the world drops into ONE cave: the SECOND complex
// (site_prebuilt_hollow_earth_*, Hollow Earth's, wild by construction) —
// THE WELL ROOM with one head per well, THE CAVERN, four EXIT chambers
// (Hell · D.U.M.B. · Agartha · Hollow Earth's own board room) and THE
// OUBLIETTE, whose back wall is Room 24601's (the eighth secret door).
// Guards: the sheet (site + part, no number, the register lists 180 once),
// the wells (one head each, no two heads within 1.6 m, an end's own plate
// line and verb, the heads on their tiers), the exits (a live pair each, a
// lane on the far site's north wall; the tier doors carry their height),
// the complex connected from the mouth, THE UNDERCROFT route, the
// production landing on every door and head, THE PARK RULE, the field
// (every door reached, THE NEEDLE the tape's), and the facility's one seam
// into it (the dungeon's fourth cell).
'use strict';
const test = require('node:test');
const { heavy } = require('./test-heavy.js');   // 2026-09-18: the heavy geometry proofs run on `npm run test:full` / in CI
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { loadGameData } = require('./load-data');
const D = loadGameData(), HQ = D.DOOR_HQ;
const TERRAIN_RULES = vm.runInContext('TERRAIN_RULES', D);
const SITE = 'prebuilt_hollow_earth';
const BOARD = 'site_' + SITE;
const PARTS = ['shaft', 'gallery', 'vent', 'blast', 'adit', 'mouth', 'oubliette'];
const PART_IDS = PARTS.map(p => BOARD + '_' + p);
const SHAFT = BOARD + '_shaft';
const renderer = fs.readFileSync(__dirname + '/three-renderer.js', 'utf8');
const at = (room, id) => (HQ.rooms[room].doors || []).find(d => d.id === id);
const WELLS = HQ.links.filter(l => l.way === 'well');
const EXITS = HQ.links.filter(l => l.route === 'undercroft' && !l.way);

function extract(name) {
    const start = renderer.indexOf('    function ' + name + '(');
    const end = renderer.indexOf('\n    }', start);
    assert.ok(start >= 0 && end > start, name);
    return renderer.slice(start, end + 6);
}
/* the production landing: _hqBoxWall + _hqGoTo on a stub scene (the hq-world.test.js harness) */
function landing(room, door) {
    const c = { _hq: { room, player: {}, cam: {}, doors: [], counters: [] },
        _hqUnits: () => HQ.units, _hqRad: n => n * Math.PI / 180,
        _hqHeadingOf: (x, z) => Math.atan2(x, -z) * 180 / Math.PI,
        _hqHeadingYaw: n => (180 - n) * Math.PI / 180,
        HQ_WALLS: { n: { nx: 0, nz: 1, yaw: 0 }, s: { nx: 0, nz: -1, yaw: Math.PI }, e: { nx: -1, nz: 0, yaw: -Math.PI / 2 }, w: { nx: 1, nz: 0, yaw: Math.PI / 2 } },
        THREE: { Vector3: class { constructor(x, y, z) { Object.assign(this, { x, y, z }); } } } };
    vm.createContext(c); vm.runInContext(extract('_hqBoxWall') + '\n' + extract('_hqGoTo'), c);
    c._hq.doors.push({ door, box: c._hqBoxWall(room, door.wall, door), y0: sill(room, door) });
    assert.equal(c._hqGoTo(door.id, true), true, room.label + '/' + door.id + ' lands');
    return c._hq;
}
/* a door's SILL in a terrain room: the production read (data.js hqTerrainDoorY — the renderer's _hqDoorFloorY) */
function sill(room, door) { return room.terrain ? D.hqTerrainDoorY(room, door) : (room.cave ? D.hqCaveDoorY(room, door) : 0); }
function propBlocks(room, p, x, z, margin) {
    const S = room.shell, cat = HQ.catalogue[p.key] || {};
    if (p.ceil || cat.ceil || (p.y || 0) > 0.5) return false;
    const px = p.wall === 'w' ? -S.w / 2 : p.wall === 'e' ? S.w / 2 : (p.x || 0);
    const pz = p.wall === 'n' ? -S.d / 2 : p.wall === 's' ? S.d / 2 : (p.z || 0);
    const rect = (p.rect === false) ? null : (p.rect || cat.rect);
    if (rect && !p.wall) return Math.abs(x - px) <= rect.hw + margin && Math.abs(z - pz) <= rect.hd + margin;
    const foot = (p.foot != null) ? p.foot : (cat.foot || 0);
    if (!(foot > 0) && !cat.block) return false;
    return Math.hypot(x - px, z - pz) <= Math.max(foot, 0.3) + margin;
}

test('the sheet: the cave is Hollow Earth’s complex — seven parts, each site + part, none numbered, the register still lists 180 once; every chamber a terrain room, none a grid', heavy, () => {
    assert.deepStrictEqual(D.hqSiteComplex(SITE).join(','), [BOARD].concat(PART_IDS, [BOARD + '_innersun']).join(','), 'the board room, then the parts in sheet order (+ THE INNER SUN, the area — THE AREAS, 2026-09-18)');
    for (const p of PARTS) {
        const id = D.hqComplexRoomId(SITE, p), r = HQ.rooms[id];
        assert.strictEqual(id, BOARD + '_' + p);
        assert.ok(r && r.kind === 'box' && r.site === SITE && r.part === p, id + ': a box room wearing site + part');
        assert.strictEqual(r.roomNo, undefined, id + ' wears no number of its own (the number is the site’s)');
        assert.strictEqual(r.fx, undefined, id + ' is not a board room');
        assert.strictEqual(D.hqRoomNo(id), '180', id + ': hqRoomNo reads the threshold’s 180 through site');
        assert.strictEqual(D.hqRoomSite(id), SITE, id + ' is WILD (9.4)');
        assert.ok(/THE CAVE/.test(r.label) && r.sub && r.spawn && Array.isArray(r.lines) && r.lines.length, id + ': plate, spawn, lines');
        for (const n of ['floor', 'wall', 'dado', 'trim', 'ceiling']) assert.ok(HQ.textures[r.shell[n]] || TERRAIN_RULES[r.shell[n]], id + ': texture ' + r.shell[n]);
        assert.ok(r.terrain && !r.cave && D.hqTerrainInfo(id), id + ': a terrain room (the grid is retired)');
        assert.ok(!r.shell.open && r.terrain.crag, id + ': a closed chamber with a crag at its walls');
    }
    const reg = D.hqRoomRegister();
    assert.strictEqual(reg.filter(r => r.mapId === SITE).length, 1, 'the register lists Hollow Earth once');
    assert.ok(!reg.some(r => PART_IDS.includes(r.id) || PART_IDS.includes(r.room)), 'no part is a register entry');
});

test('THE WELLS: six of them, every one a live `way: well` link into the well room, one head each, no two heads within 1.6 m, an end’s own plate line and CLIMB UP; the heads stand on their tiers', () => {
    assert.deepStrictEqual(WELLS.map(l => l.id).sort().join(','), 'well_camelot,well_cellar,well_garden,well_gobekli,well_skinwalker', 'the garden, the cellar, Camelot, the ranch, Nuketown, Göbekli');
    const heads = [];
    for (const l of WELLS) {
        assert.ok(D.hqLinkLive(l), l.id + ' is held back');
        assert.strictEqual(l.route, 'undercroft', l.id + ' rides THE UNDERCROFT');
        assert.ok(l.why && l.why.length > 20 && l.note && l.draft === true, l.id + ': a why, a note, a draft flag (A15)');
        const far = l.b;
        assert.ok(far.part === 'shaft' && far.wall === 'free' && Number.isFinite(far.face), l.id + ': the far end is a free head in the well room');
        assert.ok(far.sub && /CLIMB UP/.test(far.sub) && far.verb === 'CLIMB UP', l.id + ': the head’s plate says which well it is the bottom of, and reads CLIMB UP');
        heads.push(far);
        for (const [rid, end] of [[D.hqLinkRoom(l.a), l.a], [SHAFT, l.b]]) {
            const door = at(rid, 'link_' + l.id);
            assert.ok(door && door.way === 'well' && door.leaf === null, rid + ' wears the well');
            const back = at(door.action.room, door.action.at);
            assert.ok(back && back.action.room === rid && back.action.at === door.id && back.way === 'well', l.id + ': the same object at the far end');
            assert.strictEqual(D.doorSiteState(door, {}), 'open', l.id + ': a seam is never sector-gated (C-12)');
            if (end.wall !== 'free') assert.ok(end.wall === 'n' && end.x <= -0.2, l.id + ': a site-room end hangs in a lane on the north wall');   // the ranch well is FREE in the corn fields since the woods split (2026-09-18)
        }
    }
    const shaft = HQ.rooms[SHAFT], wells = shaft.doors.filter(d => d.way === 'well');
    assert.strictEqual(wells.length, WELLS.length, 'one head per well row and no more');
    for (const a of heads) for (const b of heads) if (a !== b) assert.ok(Math.hypot(a.x - b.x, a.z - b.z) >= 1.6, 'two heads stand within 1.6 m');
    /* THE TIERS (2026-09-17): the cellar and garden wells on THE NORTH SHELF, the castle well and the cistern on THE CRAG, the other two on the floor */
    const tier = id => sill(shaft, at(SHAFT, 'link_' + id));
    assert.ok(Math.abs(tier('well_cellar') - 1.75) < 0.01 && Math.abs(tier('well_garden') - 1.75) < 0.01, 'the north shelf');
    assert.ok(Math.abs(tier('well_camelot') - 3.5) < 0.01 && Math.abs(tier('well_gobekli') - 3.5) < 0.01, 'the crag');
    assert.ok(tier('well_skinwalker') < 0.6, 'the floor (Nuketown\'s wishing well retired with the site, 2026-09-18)');
    assert.ok(!HQ.links.some(l => l.id === 'haunted_hollow'), 'the old cellar ⇄ Hollow Earth pipe is gone');
    const cellarWell = at('site_prebuilt_haunted_cellar', 'link_well_cellar');
    assert.ok(cellarWell && cellarWell.wall === 'free', 'the cellar keeps its well, where it stood');
    assert.strictEqual(cellarWell.action.room, SHAFT, 'and it drops into the well room now');
    const gw = at('garden', 'link_well_garden');
    assert.ok(gw && gw.way === 'well' && gw.wall === 'free', 'the garden’s well stands free on the gravel ring');
    assert.strictEqual(D.hqRoomSite('garden'), null, 'the garden is facility (safe); the cave it drops into is wild');
    const g = landing(HQ.rooms.garden, gw), gp = g.player;
    for (const q of [...HQ.rooms.garden.props, ...HQ.rooms.garden.npcSpots, ...HQ.rooms.garden.onlineSpots, ...HQ.rooms.garden.agents]) assert.ok(!propBlocks(HQ.rooms.garden, q, gp.x, gp.z, 0.4), (q.key || q.label || 'person') + ' blocks the garden well’s landing');
    assert.ok(Math.hypot(gp.x, gp.z) > 2.4, 'the landing is clear of the fountain');
});

test('THE FOUR EXITS: a live pair each into Hell (the pit’s east wall since 2026-09-18), D.U.M.B., Agartha and Hollow Earth’s own board room, every far end a legal lane; the fissure’s, LEVEL −6’s and the mouth’s doors stand on their tiers', () => {
    assert.deepStrictEqual(EXITS.map(l => l.id).sort().join(','), 'cave_agartha,cave_dumb,cave_hell,cave_hollow');
    const want = { cave_hell: 'prebuilt_hell', cave_dumb: 'prebuilt_dumb', cave_agartha: 'prebuilt_agartha', cave_hollow: SITE };
    const tier = { cave_hell: 1.75, cave_dumb: 1.75, cave_hollow: 1.75, cave_agartha: null };
    for (const l of EXITS) {
        assert.ok(D.hqLinkLive(l), l.id + ' is held back');
        assert.strictEqual(l.b.site, want[l.id], l.id + ' leads where the plan says');
        assert.ok(HQ.catalogue[l.leaf] && HQ.catalogue[l.leaf].leaf, l.id + ': a catalogue leaf');
        assert.ok(l.why && l.note && l.draft === true, l.id + ': a why, a note, a draft flag');
        const here = D.hqLinkRoom(l.a), there = D.hqLinkRoom(l.b);
        assert.ok(PART_IDS.includes(here), l.id + ': the near end is a cave chamber');
        const door = at(here, 'link_' + l.id), back = at(there, 'link_' + l.id);
        assert.ok(door && back && door.action.room === there && back.action.room === here, l.id + ': two-way');
        assert.strictEqual(back.leaf, door.leaf, l.id + ': the same leaf both sides');
        assert.strictEqual(D.hqDoorNo(door), D.hqRoomNo(there), l.id + ': the plate reads the far number');
        assert.strictEqual(D.doorSiteState(door, {}), 'open');
        if (tier[l.id] != null) { assert.strictEqual(door.y, tier[l.id], l.id + ': the end carries its tier (hqLinkDoors copies y)'); assert.strictEqual(sill(HQ.rooms[here], door), tier[l.id], l.id + ': the sill is the tier'); }
        else assert.ok(door.y === undefined && sill(HQ.rooms[here], door) < 1.0, l.id + ': on the floor');
        const room = HQ.rooms[there], half = room.shell.w / 2;
        /* THE DIVINE STAIR, second pass (2026-09-18): Hell's board is BYPASSED — the fissure comes out on THE PIT's EAST wall (a part; the lane rule is the part's own: inside the wall, lanes apart) */
        if (l.id === 'cave_hell') {
            assert.strictEqual(there, 'site_prebuilt_hell_pit', 'the fissure opens on the pit'); assert.strictEqual(back.wall, 'e');
            assert.ok(Math.abs(back.z) < room.shell.d / 2 - 2.2, l.id + ': the far lane is inside the wall');
            for (const o of room.doors.filter(d => d.link && d !== back && d.wall === 'e')) assert.ok(Math.abs(o.z - back.z) >= 4.4, l.id + ': the far lane crowds ' + o.id);
            continue;
        }
        assert.strictEqual(back.wall, 'n');
        assert.ok(back.x > -(half - (room.shell.open ? 2.6 : 1.4)) && back.x < 0.4, l.id + ': the far lane is inside the wall');
        for (const o of room.doors.filter(d => d.link && d !== back && d.wall === 'n')) assert.ok(Math.abs(o.x - back.x) >= 4.4, l.id + ': the far lane crowds ' + o.id);   // AREA CONTENT D3 (2026-09-19): the same wall only — a side-wall draught (the polar opening on the crystal city's west wall) has no x
    }
});

test('the cave is one piece: from the mouth every chamber is walked, every inside door is a pair, and nothing leaves the complex but a links row', () => {
    const seen = new Set([BOARD + '_mouth']), queue = [BOARD + '_mouth'];
    while (queue.length) {
        const id = queue.shift();
        for (const d of HQ.rooms[id].doors) {
            const a = d.action || {};
            assert.ok(a.room && HQ.rooms[a.room], id + '/' + d.id + ' leads to a room');
            if (d.link) { assert.ok(HQ.links.some(l => l.id === d.link), id + '/' + d.id + ' is a links row'); continue; }
            if (d.secret) { assert.strictEqual(a.room, 'dungeon', 'the only secret door out of the cave is the dungeon’s'); continue; }
            const back = at(a.room, a.at);
            assert.ok(back && back.action.room === id && back.action.at === d.id, id + '/' + d.id + ' ⇄ ' + a.room + ' is a pair');
            assert.strictEqual(back.leaf, d.leaf, 'the same leaf (or opening) on both sides of ' + d.id);
            assert.ok(PART_IDS.includes(a.room), id + '/' + d.id + ' stays inside the complex');
            if (!seen.has(a.room)) { seen.add(a.room); queue.push(a.room); }
        }
    }
    assert.deepStrictEqual(Array.from(seen).sort().join(','), PART_IDS.slice().sort().join(','), 'every chamber is reachable from the mouth');
    const g = HQ.rooms[BOARD + '_gallery'];
    for (const id of ['shaft', 'vent', 'blast', 'adit', 'mouth', 'oubliette']) assert.ok(at(BOARD + '_gallery', id), 'the gallery has the ' + id + ' door');
    assert.strictEqual(g.doors.filter(d => !d.link).length, 6, 'six ways off the gallery');
    assert.strictEqual(at(BOARD + '_gallery', 'blast').y, 5.25, 'LEVEL −6’s bulkhead stands on THE HIGH TIER');
    assert.strictEqual(at(BOARD + '_gallery', 'vent').y, 3.5, 'THE FISSURE’s arch stands on THE HOT SHELF');
});

test('THE UNDERCROFT: a dashed line whose every leg is a well or an exit, all converging on HOLLOW EARTH, and the world graph carries both halves', () => {
    const R = D.hqWorldRoutes('garden').find(r => r.id === 'undercroft');
    assert.ok(R && R.dashed && R.label && R.sub, 'the route is catalogued and dashed');
    assert.strictEqual(R.legs.length, WELLS.length + EXITS.length, 'ten legs');
    assert.ok(R.legs.every(l => l.from === BOARD || l.to === BOARD), 'every leg touches HOLLOW EARTH — the wells and the exits are one hub');
    assert.ok(R.stations.some(s => s.no === '180'), 'the hub is a station');
    assert.ok(R.stations.find(s => s.room === 'garden').here, 'the viewer in the garden is filled');
    for (const s of R.stations) assert.ok(!/undefined|NaN/.test(s.label + s.no), 'a station reads');
    const G = D.hqWorldGraph();
    for (const l of WELLS.concat(EXITS)) {
        const a = D.hqLinkRoom(l.a), b = D.hqLinkRoom(l.b);
        assert.ok(G.edges.some(e => e.from === a && e.to === b && e.link === l.id), l.id + ': the edge out');
        assert.ok(G.edges.some(e => e.from === b && e.to === a && e.link === l.id), l.id + ': the edge back');
    }
});

test('the production renderer lands every door and every well head inside its chamber, at its sill, clear of every blocker and native, facing into the room', () => {
    for (const id of PART_IDS) {
        const room = HQ.rooms[id], S = room.shell, info = D.hqTerrainInfo(id);
        for (const door of room.doors) {
            const h = landing(room, door), p = h.player;
            assert.ok(Math.abs(p.x) < S.w / 2 - 0.4 && Math.abs(p.z) < S.d / 2 - 0.4, id + '/' + door.id + ': inside the walls');
            const inward = door.wall === 'free' ? [Math.sin(door.face * Math.PI / 180), -Math.cos(door.face * Math.PI / 180)] : { n: [0, 1], s: [0, -1], e: [-1, 0], w: [1, 0] }[door.wall];
            const fx = Math.sin(h.cam.yaw), fz = -Math.cos(h.cam.yaw);
            const dot = fx * inward[0] + fz * inward[1];
            assert.ok(dot < -0.99 || dot > 0.99, id + '/' + door.id + ': faces along the doorway’s normal');
            assert.equal(p.air, false);
            assert.equal(p.y, sill(room, door), id + '/' + door.id + ': lands at the door’s own sill (a door on a tier lands on the tier)');
            const feet = D.hqTerrainFeet(info, p.x, p.z, null);
            assert.ok(feet != null && Math.abs(feet - p.y) < 0.12, id + '/' + door.id + ': the pad under the landing is level with the sill');
            for (const q of [...room.props, ...room.npcSpots]) assert.ok(!propBlocks(room, q, p.x, p.z, 0.35), id + '/' + door.id + ': ' + (q.key || q.race) + ' blocks the landing');
            for (const q of info.scatter) assert.ok(Math.hypot(q.x - p.x, q.z - p.z) > q.r + 0.35, id + '/' + door.id + ': scattered ' + q.key + ' blocks the landing');
            for (const other of room.doors) if (other.id !== door.id && other.wall === door.wall && door.wall !== 'free') {
                const k = (door.wall === 'n' || door.wall === 's') ? 'x' : 'z';
                assert.ok(Math.abs(other[k] - door[k]) > 2.6, id + ': ' + door.id + ' and ' + other.id + ' overlap on the ' + door.wall + ' wall');
            }
            for (const other of room.doors) if (other !== door && other.wall === 'free') assert.ok(Math.hypot(p.x - other.x, p.z - other.z) > 1.0, id + ': ' + other.id + ' stands on ' + door.id + '’s landing');
        }
        const sp = room.spawn;
        for (const q of [...room.props, ...room.npcSpots]) assert.ok(!propBlocks(room, q, sp.x, sp.z, 0.3), id + ': ' + (q.key || q.race) + ' blocks the spawn');
        for (const n of room.npcSpots) assert.ok(D.AVAILABLE_RACES.includes(n.race), id + ': native race ' + n.race);
    }
});

test('THE PARK RULE and the cave’s own light: a rail (a rail, a wall’s top or a deck’s rope) and a real ramp in every chamber, no facility strips, torches and crystals under the prop-light cap', () => {
    for (const id of PART_IDS) {
        const room = HQ.rooms[id], S = room.shell, info = D.hqTerrainInfo(id);
        assert.ok(info.rails.length >= 1, id + ': a rail to grind');
        assert.ok(room.terrain.features.some(f => f.k === 'ramp'), id + ': a real ramp to ride');
        assert.ok(S.strips === false && Array.isArray(S.lights) && S.lights.length === 0 && S.mood, id + ': no facility strips — the cave lights itself');
        const lava = info.fluids.some(f => f.key === 'lava') ? 1 : 0;   // _hqBuildTerrain: one point light per room with lava
        const lit = room.props.filter(p => (HQ.catalogue[p.key] || {}).light).length + lava;
        assert.ok(lit >= 1 && lit <= 10, id + ': ' + lit + ' point lights (HQ_PROP_LIGHT_MAX is 10, the lava’s counted)');
    }
});

test('THE FIELD: every chamber is solvable from every door; the cavern climbs to 5.25 m and drops from it; THE NEEDLE and THE PINNACLE carry the tapes the walker cannot reach; the lava rift is crossed on its span; the river is deep but for the ford and the plank', heavy, () => {
    for (const id of PART_IDS) {
        const room = HQ.rooms[id], info = D.hqTerrainInfo(id);
        const L = room.doors.map(d => D.hqTerrainDoorLanding(room, d));
        for (const a of L) { const reach = D.hqTerrainReach(info, a.x, a.z); for (const b of L) assert.ok(reach.has(D.hqTerrainNodeKey(info, b.x, b.z)), id + ': a door unreached'); }
    }
    const gal = D.hqTerrainInfo(BOARD + '_gallery');
    let hi = 0; for (let i = 0; i < gal.H.length; i++) hi = Math.max(hi, gal.H[i]);
    assert.ok(hi >= 5.9, 'the needle is the top of the cavern (' + hi + ')');
    assert.ok(Math.abs(D.hqTerrainHeight(gal, -15, -17.5) - 5.25) < 0.05, 'THE HIGH TIER');
    const needle = D.DOOR_HQ.finds.find(f => f.room === BOARD + '_gallery' && f.kind === 'tape');
    assert.ok(needle && needle.hard && needle.y > 5.5, 'the cavern’s tape stands on the needle, out of reach');
    const pin = D.DOOR_HQ.finds.find(f => f.room === SHAFT && f.kind === 'tape');
    assert.ok(pin && pin.hard && pin.y > 4.0, 'the well room’s tape stands on the pinnacle');
    /* the rift */
    const vent = D.hqTerrainInfo(BOARD + '_vent');
    assert.equal(D.hqTerrainFeet(vent, -3, -0.7, 0), null, 'lava is never entered');
    assert.ok(D.hqTerrainFeet(vent, 1.2, -1.0, 0.85) != null, 'the obsidian span crosses it');
    /* the river */
    assert.equal(D.hqTerrainFeet(gal, 14, 12.2, 0), null, 'the river is deep');
    assert.ok(D.hqTerrainFeet(gal, 13.5, 14.5, 0.15) != null, 'the plank crosses it');
    assert.ok(D.hqTerrainFeet(gal, 19.5, 9.3, 0) != null, 'the ford crosses it');
});

test('THE FOURTH CELL NOBODY COUNTS: the oubliette and Room 24601 share a secret wall — eight secret doors, a pair, on no plate, and the dungeon’s cells moved off the panel', () => {
    const secrets = D.hqSecretDoors().filter(s => !/^link_/.test(s.id));   // THE AREAS (2026-09-18): the links' draughts (vatican_hell, cern_backrooms) are hq-areas.test.js's
    assert.strictEqual(secrets.length, 12, 'the seventh and eighth secret doors (twelve in all since THE CARGO HATCH and THE CAPTAIN’S SKYLIGHT — AREA CONTENT D3, 2026-09-19; hq-floors.test.js keeps the count)');
    const a = at('dungeon', 'oubliette'), b = at(BOARD + '_oubliette', 'dungeon');
    for (const d of [a, b]) assert.ok(d && d.secret === true && d.leaf == null && !d.proc && /DRAUGHT/.test(d.label), 'a secret door: no leaf, no plate, a draught');
    assert.ok(a.action.room === BOARD + '_oubliette' && a.action.at === 'dungeon' && b.action.room === 'dungeon' && b.action.at === 'oubliette', 'the pair closes');
    assert.strictEqual(D.hqRoomSite('dungeon'), null, 'Room 24601 stays facility; the oubliette is wild');
    const cells = HQ.rooms.dungeon.props.filter(p => p.key === 'cell_bars');
    assert.strictEqual(cells.length, 3, 'three cells, still');
    for (const c of cells) assert.ok(Math.abs(c.z - a.z) > 1.0, 'a cell stands on the fourth cell’s panel');
    const h = landing(HQ.rooms.dungeon, a), p = h.player;
    for (const q of [...HQ.rooms.dungeon.props, ...HQ.rooms.dungeon.npcSpots, ...HQ.rooms.dungeon.agents]) assert.ok(!propBlocks(HQ.rooms.dungeon, q, p.x, p.z, 0.35), (q.key || q.label || 'person') + ' blocks the fourth cell’s landing');
});
