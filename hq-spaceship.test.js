// hq-spaceship.test.js — THE SPACESHIP COMPLEX (HQ plan 9.2 stage 2 — 2026-09-15 rev 18):
// the THIRD complex. Room 426's generated board room stays THE DORSAL DECK;
// THE AIRLOCK on its north wall (siteRooms.backDoors.prebuilt_derelict) cycles
// into three hand-authored compartments — the airlock (with the Lunar route's
// two docking collars, moved off the deck), the cargo hold, the bridge. Guards:
// the sheet (site + part, no number, the register lists the ship once), the
// airlock door's lane on the deck, every door a pair and the complex connected,
// the Lunar route's ends IN the airlock (and no link door left on the deck),
// the production landing on every door (inside the walls, clear of every
// blocker and native), THE PARK RULE, the ship lighting itself, and the tapes
// (one per compartment, the hundred still a hundred).
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { loadGameData } = require('./load-data');
const D = loadGameData(), HQ = D.DOOR_HQ;
const TERRAIN_RULES = vm.runInContext('TERRAIN_RULES', D);
const SITE = 'prebuilt_derelict';
const BOARD = 'site_prebuilt_derelict';
const PARTS = ['airlock', 'hold', 'bridge'];
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

test('the sheet: the Spaceship is a complex of the deck and three compartments, each wearing site + part and no number; the register lists the ship once', () => {
    assert.strictEqual(D.hqSiteComplex(SITE).join(','), [BOARD].concat(PART_IDS).join(','), 'hqSiteComplex = the deck, then the compartments in sheet order');
    assert.strictEqual(D.hqComplexRooms().filter(id => D.hqRoomSite(id) === SITE).join(','), PART_IDS.join(','), 'the ship’s parts');
    for (const p of PARTS) {
        const id = D.hqComplexRoomId(SITE, p), r = HQ.rooms[id];
        assert.ok(r && r.kind === 'box' && r.site === SITE && r.part === p, id + ': a box room wearing site + part');
        assert.strictEqual(r.roomNo, undefined, id + ' wears no number of its own');
        assert.strictEqual(r.fx, undefined, id + ' is not a board room');
        assert.strictEqual(D.hqRoomNo(id), '426', id + ': hqRoomNo reads the threshold’s 426 through site');
        assert.ok(/THE SPACESHIP/.test(r.label) && r.sub, id + ': ROOM № · name · function on the plate');
        for (const d of r.doors) if (!d.link && !(d.action && d.action.ship)) assert.strictEqual(D.hqDoorNo(d), '426', id + '/' + d.id + ': every plate in the ship reads 426');
        for (const d of r.doors) if (d.link) assert.notStrictEqual(D.hqDoorNo(d), '426', id + '/' + d.id + ': a link door’s plate reads the FAR site’s number');
        for (const d of r.doors) if (d.action && d.action.ship) {   // THE SHIP'S ONE DOOR: the collar's plate reads the course's number, nothing without one
            D.hqShipApplyCourse({ door: {} }); assert.strictEqual(D.hqDoorNo(d), '', id + '/' + d.id + ': no course, no number');
            D.hqShipApplyCourse(null, { force: 'moon_derelict' }); assert.strictEqual(D.hqDoorNo(d), D.hqRoomNo('prebuilt_moon'), id + '/' + d.id + ': the Moon laid in, the Moon’s number');
            D.hqShipApplyCourse({ door: {} });
        }
        for (const d of r.doors) assert.notStrictEqual(d.leaf, 'leaf_hollow_core', id + '/' + d.id + ': never the rank leaf');
    }
    const reg = D.hqRoomRegister();
    assert.strictEqual(reg.filter(r => r.mapId === SITE).length, 1, 'the register lists the ship once');
    assert.ok(!reg.some(r => PART_IDS.includes(r.id) || PART_IDS.includes(r.room)), 'no compartment is a register entry');
    assert.ok(D.hqEncounterRoomOk(BOARD + '_hold'), 'the hold is WILD (9.4)');
});

test('the airlock: the deck’s back door hangs on the north wall in the old Moon-collar lane, clear of the console lane, the signboard and the masts; the airlock’s inner hatch comes back', () => {
    const BD = HQ.siteRooms.backDoors[SITE];
    assert.ok(Array.isArray(BD) && BD.length === 1, 'an ARRAY of one back-door row');
    const room = HQ.rooms[BOARD], S = room.shell;
    assert.strictEqual(room.doors.filter(d => !d.link).map(d => d.id).join(','), 'egress,airlock', 'the way in, then the airlock');
    assert.strictEqual(room.doors.filter(d => d.link).length, 0, 'NO link door is left on the deck — the collars moved into the airlock (9.3 stage 1’s promise)');
    const air = at(BOARD, 'airlock');
    assert.ok(air.wall === 'n' && air.x === -6 && air.leaf === 'leaf_bulkhead', 'the north wall, the Moon collar’s old lane, the threshold’s own leaf');
    assert.strictEqual(air.leaf, HQ.thresholds[SITE].leaf, 'the airlock wears the site’s catalogue leaf');
    assert.ok(air.action.room === BOARD + '_airlock' && air.action.at === 'deck', 'the airlock door walks into the airlock');
    assert.notStrictEqual(air.action, BD[0].action, 'the generator copies the action');
    const deck = at(BOARD + '_airlock', 'deck');
    assert.ok(deck && deck.wall === 's' && deck.leaf === 'leaf_bulkhead' && deck.action.room === BOARD && deck.action.at === 'airlock', 'the inner hatch returns to the deck at the airlock door');
    assert.strictEqual(D.doorSiteState(air, null), 'open', 'a room door is never sector-gated (C-12)');
    assert.ok(air.x + 1.25 + 2.2 < 5 - 2.4, 'clear of the built-in north signboard');
    const h = landing(room, air), p = h.player;
    assert.ok(Math.abs(p.x) < S.w / 2 - 0.4 && Math.abs(p.z) < S.d / 2 - 0.4, 'the landing is inside the walls');
    assert.ok(Math.abs(p.z) > S.grid.cells * S.grid.cell / 2 + 0.4, 'off the battle board');
    for (const q of [...room.props, ...room.npcSpots]) assert.ok(!propBlocks(room, q, p.x, p.z, 0.4), (q.key || q.race) + ' blocks the airlock’s landing');
    for (const m of S.lights || []) assert.ok(Math.hypot(p.x - m.x, p.z - m.z) > 1.2, 'a lamp mast stands on the landing');
});

test('THE SHIP\'S ONE DOOR (2026-09-16): both Lunar-route ends are DOCKED on the airlock\'s single collar, the collar opens on the course the nav console laid in, the far ends land at the collar, and the line still runs Mars → Moon → Spaceship → Saturn → the Singularity', () => {
    const moon = HQ.links.find(l => l.id === 'moon_derelict'), sat = HQ.links.find(l => l.id === 'derelict_saturn');
    const AIR = BOARD + '_airlock';
    assert.ok(moon.b.site === SITE && moon.b.part === 'airlock' && moon.b.door === 'collar' && !moon.b.wall, 'the Moon end docks on the collar');
    assert.ok(sat.a.site === SITE && sat.a.part === 'airlock' && sat.a.door === 'collar' && !sat.a.wall, 'the Saturn end docks on the same collar');
    assert.strictEqual(D.hqLinkRoom(moon.b), AIR); assert.strictEqual(D.hqLinkRoom(sat.a), AIR);
    assert.ok(D.hqLinkLive(moon) && D.hqLinkLive(sat), 'both links are live');
    assert.strictEqual([HQ.ship.room, HQ.ship.door, HQ.ship.bridge, HQ.ship.counter].join('|'), [AIR, 'collar', BOARD + '_bridge', 'nav'].join('|'), 'DOOR_HQ.ship names the collar and the console');
    const air = HQ.rooms[AIR];
    assert.strictEqual(air.doors.filter(d => d.link).length, 0, 'no generated link door in the airlock — the collar is the one door');
    const collar = air.doors.find(d => d.id === 'collar');
    assert.ok(collar && collar.wall === 'w' && collar.action && collar.action.ship === true && collar.leaf === 'leaf_bulkhead' && collar.wide === true, 'ONE collar on the port wall, a ship door');
    assert.strictEqual(D.hqShipDoor(), collar);
    assert.ok(D.hqLinkDoors('site_prebuilt_moon').some(d => d.link === 'moon_derelict' && d.action.room === AIR && d.action.at === 'collar'), 'the Moon\'s end comes back to the collar');
    assert.ok(D.hqLinkDoors('site_prebuilt_saturn').some(d => d.link === 'derelict_saturn' && d.action.room === AIR && d.action.at === 'collar'), 'Saturn\'s end too');
    /* the destinations = every link docked on the collar, in sheet order */
    const dests = D.hqShipDestinations();
    assert.strictEqual(dests.map(d => d.link).join(','), 'moon_derelict,derelict_saturn,antarctica_derelict');
    assert.strictEqual(dests[0].room, 'site_prebuilt_moon'); assert.strictEqual(dests[0].at, 'link_moon_derelict'); assert.strictEqual(dests[0].label, 'MOON');
    assert.strictEqual(dests[1].room, 'site_prebuilt_saturn'); assert.strictEqual(dests[1].at, 'link_derelict_saturn'); assert.strictEqual(dests[1].label, 'SATURN');
    assert.ok(dests.every(d => d.no), 'every destination carries its site number');
    /* the course: nothing on file → the collar opens on nothing; SET COURSE → the collar opens there; an unknown port is refused; the plate follows */
    const p = { door: {} };
    assert.strictEqual(D.hqShipCourse(p), null); assert.strictEqual(D.hqShipResolve(p), null);
    assert.strictEqual(D.hqShipApplyCourse(p), null); assert.match(collar.sub, /NO COURSE/);
    const bad = D.hqShipSetCourse(p, 'nowhere'); assert.ok(bad.ok === false && bad.reason === 'unknown' && bad.link === 'nowhere', 'an unknown port is refused');
    assert.ok(D.hqShipSetCourse(p, 'derelict_saturn').ok); assert.strictEqual(p.door.hq.ship.dest, 'derelict_saturn');
    const r = D.hqShipResolve(p);
    assert.ok(r && r.room === 'site_prebuilt_saturn' && r.at === 'link_derelict_saturn' && r.link === 'derelict_saturn');
    assert.ok(D.hqShipApplyCourse(p)); assert.match(collar.sub, /COURSE LAID IN · ROOM 6 · SATURN/);
    assert.ok(D.hqShipSetCourse(p, 'moon_derelict').ok); assert.strictEqual(D.hqShipResolve(p).room, 'site_prebuilt_moon');
    assert.ok(D.hqShipSetCourse(p, 'none').ok); assert.strictEqual(D.hqShipResolve(p), null);
    D.hqShipApplyCourse(p); assert.match(collar.sub, /NO COURSE/);
    assert.strictEqual(D.hqShipResolve(p, { force: 'moon_derelict' }).room, 'site_prebuilt_moon', 'a dev force beats the file');
    /* the bridge's nav console */
    const bridge = HQ.rooms[BOARD + '_bridge'];
    const nav = (bridge.counters || []).find(c => c.id === 'nav');
    assert.ok(nav && nav.action && nav.action.overlay === 'nav', 'THE NAV CONSOLE on the bridge lays the course in');
    /* the world graph: the collar is every destination's edge; the map still reaches both planets from the ship */
    const edges = D.hqWorldGraph().edges.filter(e => e.from === AIR && e.door === 'collar');
    assert.strictEqual(edges.map(e => e.to).sort().join(','), 'site_prebuilt_antarctica,site_prebuilt_moon,site_prebuilt_saturn');
    assert.ok(edges.every(e => e.link), 'each edge carries its link');
    const lunar = D.hqWorldRoutes('foyer').find(r => r.id === 'lunar' || r.route === 'lunar');
    const st = (lunar.stations || []).map(s => s.site);
    assert.strictEqual(st.join(','), 'prebuilt_antarctica,prebuilt_derelict,prebuilt_moon,prebuilt_mars,prebuilt_saturn,prebuilt_singularity', 'the stations are SITES: the ship is one station');
    /* the source sites */
    const mapSrc = fs.readFileSync(__dirname + '/map.js', 'utf8');
    for (const needle of ['if (act.ship) {', 'hqShipResolve(_hqProfile())', "act.overlay === 'nav'", 'function _hqNavHtml', 'window._hqSetCourse = function', "closest('[data-course]')", 'hqShipApplyCourse(_hqProfile())', "_hqRecordVisit(act.link ? ('link_' + act.link) : from.id)"]) assert.ok(mapSrc.includes(needle), 'map.js: ' + needle);
    for (const needle of ['function hqShipDestinations', 'function hqShipSetCourse', 'function hqShipApplyCourse', 'function hqLinkDockedDoor', 'if (end.door) return;']) assert.ok(dataSrc.includes(needle), 'data.js: ' + needle);
});

test('every hatch in the ship is reversible, the complex is connected from the deck, and nothing leaves the site but the deck’s egress and the one collar', () => {
    const ROOMS = [BOARD].concat(PART_IDS);
    const seen = new Set([BOARD]), queue = [BOARD];
    while (queue.length) {
        const id = queue.shift();
        for (const d of HQ.rooms[id].doors) {
            const a = d.action || {};
            if (a.ship) {   // THE SHIP'S ONE DOOR: the collar leaves the site through every docked link, each a pair back to it
                assert.strictEqual(id, BOARD + '_airlock', 'only the airlock carries the collar');
                const dests = D.hqShipDestinations(id, d.id);
                assert.ok(dests.length >= 2, 'the collar has ports on file');
                for (const dst of dests) {
                    const far = (HQ.rooms[dst.room].doors || []).find(x => x.id === dst.at);
                    assert.ok(far && far.action.room === id && far.action.at === d.id, id + '/' + d.id + ' ⇄ ' + dst.room + ' is a pair');
                    assert.strictEqual(far.leaf, d.leaf, 'the same leaf on both sides of the collar');
                }
                continue;
            }
            assert.ok(a.room && HQ.rooms[a.room], id + '/' + d.id + ' leads to a room');
            if (d.link) {
                assert.strictEqual(id, BOARD + '_airlock', 'only the airlock leaves the site through a links row');
                const far = at(a.room, a.at);
                assert.ok(far && far.action.room === id && far.action.at === d.id, id + '/' + d.id + ' ⇄ ' + a.room + ' is a pair');
                continue;
            }
            if (HQ.rooms[a.room].kind === 'bay') { assert.strictEqual(id, BOARD, 'only the deck walks back to the bay'); continue; }
            const back = at(a.room, a.at);
            assert.ok(back && back.action.room === id && back.action.at === d.id, id + '/' + d.id + ' ⇄ ' + a.room + '/' + (back && back.id) + ' is a pair');
            assert.strictEqual(back.leaf, d.leaf, 'the same leaf on both sides of ' + d.id);
            assert.ok(ROOMS.includes(a.room), id + '/' + d.id + ' stays inside the site');
            if (!seen.has(a.room)) { seen.add(a.room); queue.push(a.room); }
        }
    }
    assert.strictEqual(Array.from(seen).sort().join(','), ROOMS.slice().sort().join(','), 'every compartment is reachable from the deck');
    assert.ok(at(BOARD + '_airlock', 'hold').action.room === BOARD + '_hold' && at(BOARD + '_hold', 'bridge').action.room === BOARD + '_bridge', 'deck → airlock → hold → bridge');
    assert.strictEqual(HQ.rooms[BOARD + '_bridge'].doors.length, 1, 'the bridge is the end of the ship — the rest of it is not there');
});

test('the production renderer lands every hatch inside its compartment, clear of every blocker and native, facing along the doorway', () => {
    for (const id of PART_IDS) {
        const room = HQ.rooms[id], S = room.shell;
        for (const door of room.doors) {
            const h = landing(room, door), p = h.player;
            assert.ok(Math.abs(p.x) < S.w / 2 - 0.4 && Math.abs(p.z) < S.d / 2 - 0.4, id + '/' + door.id + ': inside the walls');
            const inward = { n: [0, 1], s: [0, -1], e: [-1, 0], w: [1, 0] }[door.wall];
            const fx = Math.sin(h.cam.yaw), fz = -Math.cos(h.cam.yaw);
            assert.ok(Math.abs(fx * inward[0] + fz * inward[1]) > 0.99, id + '/' + door.id + ': faces along the doorway’s normal');
            assert.equal(p.air, false); assert.equal(p.y, 0);
            for (const q of [...room.props, ...room.npcSpots]) assert.ok(!propBlocks(room, q, p.x, p.z, 0.35), id + '/' + door.id + ': ' + (q.key || q.race) + ' blocks the landing');
            for (const other of room.doors) if (other.id !== door.id && other.wall === door.wall) {
                const k = (door.wall === 'n' || door.wall === 's') ? 'x' : 'z';
                assert.ok(Math.abs(other[k] - door[k]) > 2.6, id + ': ' + door.id + ' and ' + other.id + ' overlap');
            }
        }
        const sp = room.spawn;
        for (const q of [...room.props, ...room.npcSpots]) assert.ok(!propBlocks(room, q, sp.x, sp.z, 0.3), id + ': ' + (q.key || q.race) + ' blocks the spawn');
        for (const n of room.npcSpots) {
            assert.ok(D.AVAILABLE_RACES.includes(n.race), id + ': native race ' + n.race);
            for (const q of room.props) assert.ok(!propBlocks(room, q, n.x, n.z, 0.1), id + ': ' + q.key + ' stands on the ' + n.race);
        }
        for (const q of room.props) assert.ok(HQ.catalogue[q.key], id + ': catalogue key ' + q.key);
    }
});

test('THE PARK RULE + the light: a rail in every compartment, a stepped ramp in every big one; the ship lights itself; every sheet key is real; one tape per compartment and the hundred is still a hundred', () => {
    for (const id of PART_IDS) {
        const room = HQ.rooms[id], S = room.shell;
        assert.ok(room.props.some(p => p.key === 'railing_1m'), id + ': a rail to grind');
        if (S.w >= 12) assert.ok(room.props.some(p => /^riser_[123]$/.test(p.key)), id + ': a big compartment has a ramp (stepped)');
        assert.ok(S.strips === false && S.mood && S.mood.ambient < 1 && Array.isArray(S.lights) && S.lights.length === 0, id + ': no facility strips — the ship lights itself');
        const lit = room.props.filter(p => (HQ.catalogue[p.key] || {}).light).length;
        assert.ok(lit >= 1 && lit <= 10, id + ': ' + lit + ' prop lights');
        for (const n of ['floor', 'wall', 'dado', 'trim', 'ceiling']) assert.ok(HQ.textures[S[n]] || TERRAIN_RULES[S[n]], id + ': texture ' + S[n]);
        assert.strictEqual(D.DOOR_TAPES.filter(t => t.where === id).length, 1, id + ': one tape');
    }
    assert.strictEqual(D.DOOR_TAPES.length, 100);
    assert.ok(HQ.rooms[BOARD + '_hold'].props.some(p => p.key === 'iso_tank'), 'THE CRYO POD is still running');
    assert.ok(HQ.rooms[BOARD + '_bridge'].props.some(p => (p.key === 'sun_viewport' || p.key === 'false_window') && p.wall === 'n'), 'THE VIEWPORT looks forward');   // D7 (Phase 9 Delivery 4): the sun in the viewport
    assert.match(dataSrc, /prebuilt_derelict: \[\n\s+\{ id: 'airlock', wall: 'n', x: -6, leaf: 'leaf_bulkhead',/, 'the back-door row');
});
