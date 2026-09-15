// hq-complex.test.js — THE COMPLEXES (HQ plan 9.2 stage 1 — 2026-09-15):
// a site that is several rooms. The first is THE HAUNTED HOUSE: Room 13's
// generated board room + four hand-authored parts (the hall, upstairs, the
// attic, the cellar) behind THE FRONT DOOR on the board room's north wall
// (siteRooms.backDoors.prebuilt_haunted, now an ARRAY). Guards: the sheet
// (site + part, no number, the register lists the house once), every door
// reversible and the complex connected from the board room, the production
// renderer's landing on every door (inside the walls, clear of every
// blocker, facing into the room), the front door's lane on the board room
// (the console, the signboard, the mast), the world-graph hooks (a
// { site, part } link end resolves only to an authored room; the refresh
// never accumulates), THE PARK RULE (a rail in every room, a stepped ramp
// in every big one) and the source sites (a part room never grows a board).
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { loadGameData } = require('./load-data');
const D = loadGameData(), HQ = D.DOOR_HQ;
const TERRAIN_RULES = vm.runInContext('TERRAIN_RULES', D);
const SITE = 'prebuilt_haunted';
const BOARD = 'site_prebuilt_haunted';
const PARTS = ['hall', 'upstairs', 'attic', 'cellar'];
const PART_IDS = PARTS.map(p => BOARD + '_' + p);
const renderer = fs.readFileSync(__dirname + '/three-renderer.js', 'utf8');
const dataSrc = fs.readFileSync(__dirname + '/data.js', 'utf8');
const at = (room, id) => (HQ.rooms[room].doors || []).find(d => d.id === id);

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
    c._hq.doors.push({ door, box: c._hqBoxWall(room, door.wall, door), y0: 0 });
    assert.equal(c._hqGoTo(door.id, true), true, room.label + '/' + door.id + ' lands');
    return c._hq;
}
/* a prop's footprint on the floor: the catalogue rect (room axes, unless the placement refuses it) or the foot disc */
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

test('the sheet: the Haunted House is a complex of the board room and four parts, each wearing site + part and no number; the register lists the house once', () => {
    assert.deepStrictEqual(D.hqSiteComplex(SITE).join(','), [BOARD].concat(PART_IDS).join(','), 'hqSiteComplex = the board room, then the parts in sheet order');
    assert.deepStrictEqual(D.hqSiteComplex(SITE + '_delta').join(','), [BOARD].concat(PART_IDS).join(','), 'a Δ id resolves to the site');
    assert.deepStrictEqual(D.hqComplexRooms().join(','), PART_IDS.join(','), 'the parts are the only complex rooms in the building today');
    for (const p of PARTS) {
        const id = D.hqComplexRoomId(SITE, p), r = HQ.rooms[id];
        assert.strictEqual(id, BOARD + '_' + p, 'hqComplexRoomId');
        assert.ok(r && r.kind === 'box' && r.site === SITE && r.part === p, id + ': a box room wearing site + part');
        assert.strictEqual(r.roomNo, undefined, id + ' wears no number of its own (7.0 rule 1: the number is the site\'s)');
        assert.strictEqual(r.fx, undefined, id + ' is not a board room (no fx: site)');
        assert.strictEqual(D.hqRoomNo(id), '13', id + ': hqRoomNo reads the threshold\'s 13 through site');
        assert.strictEqual(D.hqRoomSite(id), SITE, id + ': hqRoomSite');
        assert.strictEqual(D.hqRoomPart(id), p, id + ': hqRoomPart');
        assert.ok(/THE HAUNTED HOUSE/.test(r.label) && r.sub, id + ': ROOM № · name · function on the plate');
        for (const d of r.doors) if (!d.link) assert.strictEqual(D.hqDoorNo(d), '13', id + '/' + d.id + ': every plate in the house reads 13');
        for (const d of r.doors) if (d.link) assert.notStrictEqual(D.hqDoorNo(d), '13', id + '/' + d.id + ': a seam\'s plate reads the FAR site\'s number');
    }
    assert.strictEqual(D.hqRoomSite(BOARD), SITE, 'the board room is the site too');
    assert.strictEqual(D.hqRoomPart(BOARD), null, 'the board room is no part');
    /* the facility is SAFE by construction (9.4): no site on any of it */
    for (const id of ['foyer', 'central_egress', 'ring_g', 'ring_m', 'office', 'training', 'medical', 'records', 'garage', 'hwing_w', 'hwing_home', 'car']) assert.strictEqual(D.hqRoomSite(id), null, id + ' is not wild');
    const reg = D.hqRoomRegister();
    assert.strictEqual(reg.filter(r => r.mapId === SITE).length, 1, 'the register lists the house once');
    assert.ok(!reg.some(r => PART_IDS.includes(r.id) || PART_IDS.includes(r.room)), 'no part is a register entry');
});

test('the front door: the board room\'s back door row is an array, hangs west of the console on the north wall, clear of the signboard and the mast, and the hall\'s front door comes back', () => {
    const BD = HQ.siteRooms.backDoors[SITE];
    assert.ok(Array.isArray(BD) && BD.length === 1, 'an ARRAY of back-door rows (one row stays legal — the Backrooms keeps its single row)');
    assert.ok(!Array.isArray(HQ.siteRooms.backDoors.prebuilt_backrooms), 'the legacy single-row shape survives beside it');
    const room = HQ.rooms[BOARD], S = room.shell;
    assert.deepStrictEqual(room.doors.filter(d => !d.link).map(d => d.id).join(','), 'egress,house', 'the way in first, then the front door (the world-graph links append after — 9.3 rev 7)');
    const house = at(BOARD, 'house');
    assert.ok(house.wall === 'n' && house.x === -7.5 && house.leaf === 'leaf_wooden', 'the north wall, west of the console, the threshold\'s own leaf');
    assert.strictEqual(house.leaf, HQ.thresholds[SITE].leaf, 'the front door wears the site\'s catalogue leaf');
    assert.ok(house.action.room === BOARD + '_hall' && house.action.at === 'front', 'the front door walks into the hall');   // field-wise: a vm-realm object never deepStrictEquals
    assert.notStrictEqual(house.action, BD[0].action, 'the generator copies the action (never the sheet\'s object)');
    const front = at(BOARD + '_hall', 'front');
    assert.ok(front && front.wall === 's' && front.leaf === 'leaf_wooden' && front.action.room === BOARD && front.action.at === 'house', 'the hall\'s front door returns to the board room at the house door');
    assert.strictEqual(D.doorSiteState(house, null), 'open', 'a room door is never sector-gated (C-12)');
    /* the console desk on the north wall at x 0, the signboard at x 5 (4.8 wide), the mast in the corner */
    const console_ = room.counters.find(c => c.id === 'crossing');
    assert.ok(Math.abs(house.x - console_.x) > 2.5 + 1.25 + 1.0, 'the front door\'s panel is clear of the console');
    assert.ok(house.x + 1.25 + 2.2 < 5 - 2.4, 'and of the built-in north signboard');
    const h = landing(room, house), p = h.player;
    assert.ok(Math.abs(p.x) < S.w / 2 - 0.4 && Math.abs(p.z) < S.d / 2 - 0.4, 'the landing is inside the walls');
    assert.ok(Math.abs(p.z) > S.grid.cells * S.grid.cell / 2 + 0.4, 'off the battle board');
    assert.ok(Math.cos(h.cam.yaw) < -0.99, 'a north doorway faces south into the room');
    for (const q of [...room.props, ...room.npcSpots]) assert.ok(!propBlocks(room, q, p.x, p.z, 0.4), (q.key || q.race) + ' blocks the front door\'s landing');
    for (const m of S.lights || []) assert.ok(Math.hypot(p.x - m.x, p.z - m.z) > 1.2, 'a lamp mast stands on the landing');
});

test('every door in the house is reversible, every landing is a real door, the complex is connected from the board room, and nothing leaves the site but the two board-room doors', () => {
    const ROOMS = [BOARD].concat(PART_IDS);
    const seen = new Set([BOARD]), queue = [BOARD];
    while (queue.length) {
        const id = queue.shift();
        for (const d of HQ.rooms[id].doors) {
            const a = d.action || {};
            assert.ok(a.room && HQ.rooms[a.room], id + '/' + d.id + ' leads to a room');
            if (d.link) {
                /* a SEAM (9.3 `way`): a pair with the far site's own room, never walked here (the far site's doors are its own business) */
                assert.ok(HQ.links.some(l => l.id === d.link), id + '/' + d.id + ' leaves the site only through a DOOR_HQ.links row');
                const far = at(a.room, a.at);
                assert.ok(far && far.action.room === id && far.action.at === d.id && far.way === d.way, id + '/' + d.id + ' ⇄ ' + a.room + ' is a seam with the same object at both ends');
                continue;
            }
            if (HQ.rooms[a.room].kind === 'bay') { assert.strictEqual(id, BOARD, 'only the board room walks back to the bay (the ring comes back through its mission door)'); continue; }
            const back = at(a.room, a.at);
            assert.ok(back, id + '/' + d.id + ' lands on a door (' + a.room + '@' + a.at + ')');
            assert.ok(back.action.room === id && back.action.at === d.id, id + '/' + d.id + ' ⇄ ' + a.room + '/' + back.id + ' is a pair');
            assert.strictEqual(back.leaf, d.leaf, 'the same leaf (or the same opening) on both sides of ' + d.id);
            if (id !== BOARD && !d.link) assert.ok(ROOMS.includes(a.room), id + '/' + d.id + ' stays inside the site (a link to another site is a `links` row, never a door row)');
            if (d.link) assert.ok(HQ.links.some(l => l.id === d.link), id + '/' + d.id + ' leaves the site only through a DOOR_HQ.links row');
            if (!seen.has(a.room)) { seen.add(a.room); queue.push(a.room); }
        }
    }
    assert.deepStrictEqual(Array.from(seen).sort().join(','), ROOMS.slice().sort().join(','), 'every room of the complex is reachable from the board room');
    /* the shape the plan asked for: the hall → upstairs → the attic; the hall → the cellar */
    assert.ok(at(BOARD + '_hall', 'stairs').action.room === BOARD + '_upstairs' && at(BOARD + '_hall', 'cellar').action.room === BOARD + '_cellar', 'the hall has the stairs up and the cellar door');
    assert.ok(at(BOARD + '_upstairs', 'attic').action.room === BOARD + '_attic', 'the hatch is upstairs');
    assert.ok(at(BOARD + '_attic', 'hatch').leaf === null && at(BOARD + '_hall', 'stairs').leaf === null, 'the stairs and the hatch are openings, not leaves');
});

test('the production renderer lands every door of the house inside its room, clear of every blocker and native, facing into the room', () => {
    for (const id of PART_IDS) {
        const room = HQ.rooms[id], S = room.shell;
        for (const door of room.doors) {
            const h = landing(room, door), p = h.player;
            assert.ok(Math.abs(p.x) < S.w / 2 - 0.4 && Math.abs(p.z) < S.d / 2 - 0.4, id + '/' + door.id + ': inside the walls');
            const inward = door.wall === 'free' ? [Math.sin(door.face * Math.PI / 180), -Math.cos(door.face * Math.PI / 180)] : { n: [0, 1], s: [0, -1], e: [-1, 0], w: [1, 0] }[door.wall];
            const fx = Math.sin(h.cam.yaw), fz = -Math.cos(h.cam.yaw);   // the walker's forward
            assert.ok(fx * inward[0] + fz * inward[1] < -0.99 || fx * inward[0] + fz * inward[1] > 0.99, id + '/' + door.id + ': faces along the doorway\'s normal');
            assert.equal(p.air, false); assert.equal(p.y, 0);
            for (const q of [...room.props, ...room.npcSpots]) assert.ok(!propBlocks(room, q, p.x, p.z, 0.35), id + '/' + door.id + ': ' + (q.key || q.race) + ' blocks the landing');
            for (const other of room.doors) if (other.id !== door.id && other.wall === door.wall) {
                const k = (door.wall === 'n' || door.wall === 's') ? 'x' : 'z';
                assert.ok(Math.abs(other[k] - door[k]) > 2.6, id + ': ' + door.id + ' and ' + other.id + ' overlap on the ' + door.wall + ' wall');
            }
        }
        const sp = room.spawn;
        for (const q of [...room.props, ...room.npcSpots]) assert.ok(!propBlocks(room, q, sp.x, sp.z, 0.3), id + ': ' + (q.key || q.race) + ' blocks the spawn');
        for (const n of room.npcSpots) {
            assert.ok(D.AVAILABLE_RACES.includes(n.race), id + ': native race ' + n.race);
            for (const q of room.props) assert.ok(!propBlocks(room, q, n.x, n.z, 0.1), id + ': ' + q.key + ' stands on the ' + n.race);
        }
    }
});

test('THE PARK RULE (9.8): a rail in every room of the house, a stepped ramp in every big one; the house is lit by its own torches, candles and bulbs', () => {
    for (const id of PART_IDS) {
        const room = HQ.rooms[id], S = room.shell;
        assert.ok(room.props.some(p => p.key === 'railing_1m'), id + ': a rail to grind');
        if (S.w >= 12) assert.ok(room.props.some(p => /^riser_[123]$/.test(p.key)), id + ': a big room has a ramp (stepped, riser tiers — a slope waits on the 9.8 registry)');
        assert.ok(S.strips === false && S.mood && S.mood.ambient < 1 && Array.isArray(S.lights) && S.lights.length === 0, id + ': no facility strips or fluorescents — the house lights itself');
        assert.ok(room.props.some(p => /^(wall_torch|candle_ring|bare_bulb)$/.test(p.key)), id + ': a torch, the candles or a bulb');
        const lit = room.props.filter(p => (HQ.catalogue[p.key] || {}).light).length;
        assert.ok(lit >= 1 && lit <= 10, id + ': ' + lit + ' prop lights (HQ_PROP_LIGHT_MAX is 10)');
        for (const n of ['floor', 'wall', 'dado', 'trim', 'ceiling']) assert.ok(HQ.textures[S[n]] || TERRAIN_RULES[S[n]], id + ': texture ' + S[n] + ' (the kit or the terrain sheet)');
    }
    /* the seams the plan hangs on these rooms are SEAMS now (9.3 `way`, 2026-09-15 rev 6): the wardrobe upstairs (→ Camelot), the well in the cellar (→ Hollow Earth) — hq-world.test.js guards them */
    assert.ok(HQ.rooms[BOARD + '_upstairs'].doors.some(d => d.way === 'wardrobe' && d.wall === 'e'), 'THE WARDROBE stands upstairs');
    assert.ok(HQ.rooms[BOARD + '_cellar'].doors.some(d => d.way === 'well' && d.wall === 'free'), 'THE WELL stands in the cellar');
    assert.ok(HQ.rooms[BOARD + '_cellar'].props.some(p => p.key === 'boiler'), 'THE FURNACE is lit');
});

test('the world graph knows the parts: a { site, part } link end resolves only to an authored room, the graph carries every house door, and the link refresh never accumulates', () => {
    assert.strictEqual(D.hqLinkRoom({ site: SITE, part: 'cellar', wall: 'e', z: 0 }), BOARD + '_cellar', 'an authored part');
    assert.strictEqual(D.hqLinkRoom({ site: SITE, part: 'crypt', wall: 'e', z: 0 }), null, 'an unauthored part is never manufactured');
    assert.strictEqual(D.hqLinkRoom({ site: SITE, wall: 'n', x: 0 }), BOARD, 'no part = the board room');
    assert.strictEqual(D.hqLinkRoom({ room: BOARD + '_attic', wall: 'n', x: 0 }), BOARD + '_attic', 'an explicit room');
    const G = D.hqWorldGraph();
    for (const id of PART_IDS) {
        assert.ok(G.nodes.some(n => n.id === id && n.site === SITE), id + ' is a node wearing its site');
        for (const d of HQ.rooms[id].doors) assert.ok(G.edges.some(e => e.from === id && e.door === d.id && e.to === d.action.room && e.at === d.action.at), id + '/' + d.id + ' is an edge');
    }
    assert.ok(G.edges.some(e => e.from === BOARD && e.door === 'house' && e.to === BOARD + '_hall'), 'the front door is an edge');
    /* a temporary link with a part end: it appears on the part, disappears with the row, and repeated refreshes never stack doors */
    const before = PART_IDS.map(id => HQ.rooms[id].doors.length);
    HQ.links.push({ id: 'zz_probe', leaf: 'leaf_bulkhead', a: { site: SITE, part: 'cellar', wall: 'e', z: -3.0 }, b: { site: 'prebuilt_hollow_earth', wall: 'n', x: -6 } });
    try {
        D.hqRefreshComplexLinks(); D.hqRefreshComplexLinks();
        const cellar = HQ.rooms[BOARD + '_cellar'];
        assert.strictEqual(cellar.doors.filter(d => d.link === 'zz_probe').length, 1, 'one door per link end, however often the refresh runs');
        const ld = cellar.doors.find(d => d.link === 'zz_probe');
        assert.ok(ld.wall === 'e' && ld.z === -3.0 && ld.action.room === 'site_prebuilt_hollow_earth' && ld.action.at === 'link_zz_probe', 'the door hangs where the row says and lands at the twin');
        assert.strictEqual(D.hqDoorNo(ld), D.hqRoomNo('prebuilt_hollow_earth'), 'the plate reads the far site\'s number');
        assert.ok(D.hqLinkDoors('site_prebuilt_hollow_earth').some(d => d.link === 'zz_probe' && d.action.room === BOARD + '_cellar'), 'the far end comes back to the cellar');
    } finally {
        HQ.links.pop(); D.hqRefreshComplexLinks();
    }
    assert.deepStrictEqual(PART_IDS.map(id => HQ.rooms[id].doors.length).join(','), before.join(','), 'the probe left nothing behind');
});

test('source scan: the generator takes an array of back doors, a part room never grows a board or a setting, the plate reads the number through site, and the helpers are on window', () => {
    assert.match(dataSrc, /\(Array\.isArray\(BD\) \? BD : BD \? \[BD\] : \[\]\)\.forEach\(d => \{/, 'hqSiteRoom appends every back-door row');
    assert.match(dataSrc, /doors\.push\(\.\.\.hqLinkDoors\(hqSiteRoomId\(id\)\)\);/, 'the board room takes its link doors');
    assert.match(dataSrc, /\nhqRefreshComplexLinks\(\);\n/, 'the parts take theirs once at load');
    assert.match(dataSrc, /if \(end\.part\) \{ const pid = hqComplexRoomId\(end\.site, end\.part\); return \(DOOR_HQ\.rooms\[pid\] && DOOR_HQ\.rooms\[pid\]\.part === end\.part\) \? pid : null; \}/, 'a part end resolves by the authored room');
    assert.match(renderer, /if \(room\.fx === 'site'\) \{ try \{ _hqBuildSiteBoard\(room\); \}/, 'the board is built for fx: site only');
    assert.match(renderer, /if \(room\.fx === 'site' && S\.near\) \{ try \{ _hqBuildSetting\(room\); \}/, 'the setting too');
    assert.match(renderer, /\(room\.site && typeof hqRoomNo === 'function'\) \? \(hqRoomNo\(room\.site\) \|\| ''\) : ''/, 'the room plate reads the number through site');
    for (const fn of ['hqComplexRoomId', 'hqRoomSite', 'hqRoomPart', 'hqComplexRooms', 'hqSiteComplex', 'hqRefreshComplexLinks', 'hqLinkRoom', 'hqLinkDoors', 'hqWorldGraph']) assert.match(dataSrc, new RegExp('window\\.' + fn + ' = ' + fn + ';'), fn + ' on window');
});
