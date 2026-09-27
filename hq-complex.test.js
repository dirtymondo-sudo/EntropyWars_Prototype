// hq-complex.test.js — THE COMPLEXES (HQ plan 9.2 stage 1 — 2026-09-15):
// a site that is several rooms. The first is THE HAUNTED HOUSE: hand-authored
// parts (the hall, upstairs, the attic, the nursery, the cellar) behind THE
// FRONT DOOR on THE GROUNDS — the site's entry part since the generated board
// rooms were deleted (2026-09-27; `site_prebuilt_haunted` is only an alias).
// Guards: the sheet (site + part, no number, the register lists the house
// once), every door reversible and the complex connected from the grounds,
// the production renderer's landing on every door (inside the walls, clear
// of every blocker, facing into the room), the world-graph hooks (a
// { site, part } link end resolves only to an authored room; the refresh
// never accumulates) and THE PARK RULE (a rail in every room, a stepped ramp
// in every big one).
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
const PARTS = ['hall', 'upstairs', 'attic', 'nursery', 'cellar'];   // THE THREE ROOMS (2026-09-21): THE NURSERY, the fifth bedroom off the landing
const PART_IDS = PARTS.map(p => BOARD + '_' + p);
const GROUNDS = BOARD + '_grounds';   // THE ENTRY PART: the board room is gone (2026-09-27) — `site_prebuilt_haunted` is an alias for THE GROUNDS
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
    vm.createContext(c); vm.runInContext(extract('_hqBoxWall') + '\n' + extract('_hqGoTo') + '\n' + extract('_hqDoorFloorY'), c);
    /* THE GALLERY (9.2 stage 2): a door on the gallery's wall stands on the slab — the production height read */
    c._hq.doors.push({ door, box: c._hqBoxWall(room, door.wall, door), y0: c._hqDoorFloorY(room, door) });
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

test('the sheet: the Haunted House is a complex of its parts, each wearing site + part and no number; the register lists the house once', () => {
    const ALL = PART_IDS.concat([GROUNDS]);   // THE AREAS (2026-09-18): THE GROUNDS, the generated area the front door stands on (hq-areas.test.js)
    assert.deepStrictEqual(D.hqSiteComplex(SITE).join(','), ALL.join(','), 'hqSiteComplex = the parts in sheet order');
    assert.deepStrictEqual(D.hqSiteComplex(SITE + '_delta').join(','), ALL.join(','), 'a Δ id resolves to the site');
    assert.deepStrictEqual(D.hqComplexRooms().filter(id => D.hqRoomSite(id) === SITE).join(','), ALL.join(','), 'the house\u2019s parts');
    assert.ok(D.hqComplexRooms().some(id => D.hqRoomSite(id) === 'prebuilt_hollow_earth'), 'the cave is the second complex (hq-cave.test.js guards it)');
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
    assert.ok(!HQ.rooms[BOARD], 'no generated board room — the id is an alias');
    assert.strictEqual(D.hqSiteEntryOf(SITE).room, GROUNDS, 'the alias lands on THE GROUNDS');
    /* the facility is SAFE by construction (9.4): no site on any of it */
    for (const id of ['foyer', 'central_egress', 'ring_g', 'ring_m', 'office', 'training', 'medical', 'records', 'garage', 'hwing_w', 'hwing_home', 'car']) assert.strictEqual(D.hqRoomSite(id), null, id + ' is not wild');
    const reg = D.hqRoomRegister();
    assert.strictEqual(reg.filter(r => r.mapId === SITE).length, 1, 'the register lists the house once');
    assert.ok(!reg.some(r => PART_IDS.includes(r.id) || PART_IDS.includes(r.room)), 'no part is a register entry');
});

test('the front door: THE GROUNDS (the entry part) carries the house door on its north wall and the bay door on its south; the hall\'s front door comes back', () => {
    const room = HQ.rooms[GROUNDS];
    const house = at(GROUNDS, 'house');
    assert.ok(house && house.wall === 'n' && house.leaf === 'leaf_wooden', 'the north wall, the threshold\'s own leaf');
    assert.strictEqual(house.leaf, HQ.thresholds[SITE].leaf, 'the front door wears the site\'s catalogue leaf');
    assert.ok(house.action.room === BOARD + '_hall' && house.action.at === 'front', 'the front door walks into the hall');   // field-wise: a vm-realm object never deepStrictEquals
    const front = at(BOARD + '_hall', 'front');
    assert.ok(front && front.wall === 's' && front.leaf === 'leaf_wooden' && front.action.room === GROUNDS && front.action.at === 'house', 'the hall\'s front door returns to the grounds at the house door');
    assert.strictEqual(D.doorSiteState(house, null), 'open', 'a room door is never sector-gated (C-12)');
    const bay = room.doors.find(d => d.entry === SITE);
    assert.ok(bay && bay.id === D.hqSiteEntryOf(SITE).door.id && bay.action.room === D.hqBayId(D.hqSectorOfMap(SITE)) && bay.action.at === 'site_' + SITE, 'the grounds wear the bay door back to the threshold');
});

test('every door in the house is reversible, every landing is a real door, the complex is connected from the grounds, and nothing leaves the site but the bay door and the seams', () => {
    const ROOMS = [GROUNDS].concat(PART_IDS);
    const seen = new Set([GROUNDS]), queue = [GROUNDS];
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
            if (HQ.rooms[a.room].kind === 'bay') { assert.ok(id === GROUNDS && d.entry === SITE, 'only the grounds\' bay door walks back to the bay (the ring comes back through its mission door)'); continue; }
            const back = at(a.room, a.at);
            assert.ok(back, id + '/' + d.id + ' lands on a door (' + a.room + '@' + a.at + ')');
            assert.ok(back.action.room === id && back.action.at === d.id, id + '/' + d.id + ' ⇄ ' + a.room + '/' + back.id + ' is a pair');
            assert.strictEqual(back.leaf, d.leaf, 'the same leaf (or the same opening) on both sides of ' + d.id);
            if (!d.link) assert.ok(ROOMS.includes(a.room), id + '/' + d.id + ' stays inside the site (a link to another site is a `links` row, never a door row)');
            if (d.link) assert.ok(HQ.links.some(l => l.id === d.link), id + '/' + d.id + ' leaves the site only through a DOOR_HQ.links row');
            if (!seen.has(a.room)) { seen.add(a.room); queue.push(a.room); }
        }
    }
    assert.deepStrictEqual(Array.from(seen).sort().join(','), ROOMS.slice().sort().join(','), 'every room of the complex is reachable from the grounds');
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
            assert.equal(p.air, false);
            const gal = S.gallery;
            if (gal && door.wall === gal.side) {
                /* THE GALLERY (9.2 stage 2): the landing is ON THE SLAB — at its height, 2.4 m in (inside the slab's depth), clear of the flight */
                assert.equal(p.y, gal.h, id + '/' + door.id + ': lands at the gallery\'s height');
                assert.ok(2.4 < gal.w - 0.3, id + '/' + door.id + ': the slab is deep enough for the landing');
                const along = (gal.side === 'n' || gal.side === 's') ? door.x + S.w / 2 : door.z + S.d / 2, len = (gal.side === 'n' || gal.side === 's') ? S.w : S.d;
                const run = Math.ceil(gal.h / 0.25) * 0.28;
                if (gal.stairAt === 'end') assert.ok(along < len - run - 0.8, id + '/' + door.id + ': clear of the flight at the end');
                else if (gal.stairAt) assert.ok(along > run + 0.8, id + '/' + door.id + ': clear of the flight at the start');
            } else assert.equal(p.y, 0);
            for (const q of [...room.props, ...room.npcSpots]) if (!(gal && (q.y || 0) >= gal.h - 0.01) === !(gal && p.y >= gal.h - 0.01)) assert.ok(!propBlocks(room, Object.assign({}, q, { y: 0 }), p.x, p.z, 0.35), id + '/' + door.id + ': ' + (q.key || q.race) + ' blocks the landing');
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
        /* THE GALLERY (9.2 stage 2): its banister is a rail, its flight is the ramp (the renderer registers both in _hq.rails / _hq.ramps) */
        const gal = S.gallery;
        assert.ok(room.props.some(p => p.key === 'railing_1m') || (gal && gal.rail !== false), id + ': a rail to grind');
        if (S.w >= 12) assert.ok(room.props.some(p => /^riser_[123]$/.test(p.key)) || (gal && gal.stairAt), id + ': a big room has a ramp (stepped, riser tiers — a slope waits on the 9.8 registry)');
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
    assert.strictEqual(D.hqLinkRoom({ site: SITE, wall: 'n', x: 0 }), GROUNDS, 'no part = the entry part (the board room is gone)');
    assert.strictEqual(D.hqLinkRoom({ room: BOARD + '_attic', wall: 'n', x: 0 }), BOARD + '_attic', 'an explicit room');
    const G = D.hqWorldGraph();
    for (const id of PART_IDS) {
        assert.ok(G.nodes.some(n => n.id === id && n.site === SITE), id + ' is a node wearing its site');
        for (const d of HQ.rooms[id].doors) { const ent = D.hqSiteEntry(d.action.room, d.action.at), to = ent ? ent.room : d.action.room, at = ent ? ent.at : d.action.at; assert.ok(G.edges.some(e => e.from === id && e.door === d.id && e.to === to && e.at === at), id + '/' + d.id + ' is an edge'); }   // THE AREAS (2026-09-18): a door into the bypassed board is an edge to THE GROUNDS
    }
    assert.ok(G.edges.some(e => e.from === GROUNDS && e.door === 'house' && e.to === BOARD + '_hall'), 'the front door is an edge');
    /* a temporary link with a part end: it appears on the part, disappears with the row, and repeated refreshes never stack doors */
    const before = PART_IDS.map(id => HQ.rooms[id].doors.length);
    HQ.links.push({ id: 'zz_probe', leaf: 'leaf_bulkhead', a: { site: SITE, part: 'cellar', wall: 'e', z: -3.0 }, b: { site: 'prebuilt_hollow_earth', wall: 'n', x: -6 } });
    try {
        D.hqRefreshComplexLinks(); D.hqRefreshComplexLinks();
        const cellar = HQ.rooms[BOARD + '_cellar'], he = D.hqLinkRoom({ site: 'prebuilt_hollow_earth', wall: 'n', x: -6 });
        assert.ok(he && HQ.rooms[he], 'a bare site end resolves to the far site\'s entry part');
        assert.strictEqual(cellar.doors.filter(d => d.link === 'zz_probe').length, 1, 'one door per link end, however often the refresh runs');
        const ld = cellar.doors.find(d => d.link === 'zz_probe');
        assert.ok(ld.wall === 'e' && ld.z === -3.0 && ld.action.room === he && ld.action.at === 'link_zz_probe', 'the door hangs where the row says and lands at the twin');
        assert.strictEqual(D.hqDoorNo(ld), D.hqRoomNo('prebuilt_hollow_earth'), 'the plate reads the far site\'s number');
        assert.ok(D.hqLinkDoors(he).some(d => d.link === 'zz_probe' && d.action.room === BOARD + '_cellar'), 'the far end comes back to the cellar');
    } finally {
        HQ.links.pop(); D.hqRefreshComplexLinks();
    }
    assert.deepStrictEqual(PART_IDS.map(id => HQ.rooms[id].doors.length).join(','), before.join(','), 'the probe left nothing behind');
});

test('source scan: the parts take their link doors, a part end resolves by the authored room, the plate reads the number through site, and the helpers are on window', () => {
    assert.match(dataSrc, /\nhqRefreshComplexLinks\(\);\n/, 'the parts take theirs once at load');
    assert.match(dataSrc, /if \(end\.part\) \{ const pid = hqComplexRoomId\(end\.site, end\.part\); return \(DOOR_HQ\.rooms\[pid\] && DOOR_HQ\.rooms\[pid\]\.part === end\.part\) \? pid : null; \}/, 'a part end resolves by the authored room');
    assert.match(renderer, /\(room\.site && typeof hqRoomNo === 'function'\) \? \(hqRoomNo\(room\.site\) \|\| ''\) : ''/, 'the room plate reads the number through site');
    for (const fn of ['hqComplexRoomId', 'hqRoomSite', 'hqRoomPart', 'hqComplexRooms', 'hqSiteComplex', 'hqRefreshComplexLinks', 'hqLinkRoom', 'hqLinkDoors', 'hqWorldGraph']) assert.match(dataSrc, new RegExp('window\\.' + fn + ' = ' + fn + ';'), fn + ' on window');
});
