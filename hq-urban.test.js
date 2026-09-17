// hq-urban.test.js — THE URBAN BLOCK (HQ plan 9.2 stage 4 — 2026-09-16): the
// FIFTH and SIXTH complexes in one delivery. Room 21's generated board room
// stays THE BOULEVARD; THE CHAPEL's motel door on its north wall
// (siteRooms.backDoors.prebuilt_strip) walks into the drive-through chapel,
// whose saloon door opens onto THE CASINO FLOOR. Room 1954's board room stays
// THE INTERSECTION; THE TOWER's lobby door on its EAST wall (its north wall
// carries the highway's three link doors) walks into the collapsed tower's
// ground floor, and the stair off the lobby goes down to THE PLATFORM — the
// subway route's third station (DOOR_HQ.links subway_downtown: the train
// stands FREE on the platform's track; its far end is a plain stair mouth on
// Cyberpunk's street, an end that names its own leaf). Guards: the sheets
// (site + part, no number, each site listed once), both back doors' lanes,
// every door a pair and both complexes connected, the subway link and its
// plain-door far end, the production landing on every door, THE PARK RULE,
// the rooms lighting themselves, the two new procs, and the tapes (one per
// part, the hundred still a hundred; the platform's finds pinned off the
// track).
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { loadGameData } = require('./load-data');
const D = loadGameData(), HQ = D.DOOR_HQ;
const TERRAIN_RULES = vm.runInContext('TERRAIN_RULES', D);
const SITES = {
    prebuilt_strip:    { no: '21',   board: 'site_prebuilt_strip',    parts: ['chapel', 'casino'], back: { id: 'chapel', wall: 'n', x: -0.2, leaf: 'leaf_motel', into: 'chapel', at: 'street' } },
    prebuilt_downtown: { no: '1954', board: 'site_prebuilt_downtown', parts: ['lobby', 'subway', 'streets', 'mall', 'closet'], back: { id: 'tower', wall: 'e', z: 0, leaf: 'leaf_entrance', into: 'lobby', at: 'street' } },   // DISASTER CITY (2026-09-17): THE STREETS + THE MALL hang off the lobby's avenue doors (hq-city.test.js owns them)
};
const PART_IDS = [].concat(...Object.entries(SITES).map(([s, S]) => S.parts.map(p => S.board + '_' + p)));
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

test('the sheets: the Strip and Downtown are complexes of a board room and two parts each, every part wearing site + part and no number; the register lists each site once', () => {
    for (const [site, S] of Object.entries(SITES)) {
        const ids = S.parts.map(p => S.board + '_' + p);
        assert.strictEqual(D.hqSiteComplex(site).join(','), [S.board].concat(ids).join(','), site + ': hqSiteComplex = the board room, then the parts in sheet order');
        assert.strictEqual(D.hqComplexRooms().filter(id => D.hqRoomSite(id) === site).join(','), ids.join(','), site + '’s parts');
        for (const p of S.parts) {
            const id = D.hqComplexRoomId(site, p), r = HQ.rooms[id];
            assert.ok(r && r.kind === 'box' && r.site === site && r.part === p, id + ': a box room wearing site + part');
            assert.strictEqual(r.roomNo, undefined, id + ' wears no number of its own');
            assert.strictEqual(r.fx, undefined, id + ' is not a board room (no board, no setting)');
            assert.strictEqual(D.hqRoomNo(id), S.no, id + ': hqRoomNo reads the threshold’s ' + S.no + ' through site');
            assert.ok(r.label && r.sub, id + ': ROOM № · name · function on the plate');
            for (const d of r.doors) if (!d.link) assert.strictEqual(D.hqDoorNo(d), S.no, id + '/' + d.id + ': every plate inside reads ' + S.no);
            for (const d of r.doors) assert.notStrictEqual(d.leaf, 'leaf_hollow_core', id + '/' + d.id + ': never the rank leaf');
            assert.ok(D.hqEncounterRoomOk(id), id + ' is WILD (9.4)');
        }
        const reg = D.hqRoomRegister();
        assert.strictEqual(reg.filter(r => r.mapId === site).length, 1, 'the register lists ' + site + ' once');
        assert.ok(!reg.some(r => ids.includes(r.id) || ids.includes(r.room)), 'no part is a register entry');
    }
    assert.ok(D.hqComplexRooms().length >= 21, 'six complexes now (the house, the cave, the ship, the Dutchman, the Strip, Downtown)');
});

test('the back doors: the chapel’s motel door takes the Strip’s one free north lane; the tower’s lobby door hangs on Downtown’s EAST wall because its north wall carries the highway’s three doors; both wear the site’s own leaf and both come back', () => {
    for (const [site, S] of Object.entries(SITES)) {
        const BD = HQ.siteRooms.backDoors[site];
        assert.ok(Array.isArray(BD) && BD.length === 1, site + ': an ARRAY of one back-door row');
        const room = HQ.rooms[S.board], Sh = room.shell, B = S.back;
        assert.strictEqual(room.doors.filter(d => !d.link).map(d => d.id).join(','), 'egress,' + B.id, site + ': the way in, then the back door (links append after)');
        const bd = at(S.board, B.id);
        assert.strictEqual(bd.wall, B.wall, site + ': the wall');
        if (B.wall === 'n') assert.strictEqual(bd.x, B.x); else assert.strictEqual(bd.z, B.z);
        assert.strictEqual(bd.leaf, B.leaf); assert.strictEqual(bd.leaf, HQ.thresholds[site].leaf, site + ': the back door wears the site’s catalogue leaf');
        assert.strictEqual(!!bd.wide, !!HQ.catalogue[bd.leaf].wide, site + ': the wide flag follows the leaf');
        assert.ok(bd.action.room === S.board + '_' + B.into && bd.action.at === B.at, site + ': walks into the ' + B.into);
        assert.notStrictEqual(bd.action, BD[0].action, 'the generator copies the action');
        const back = at(S.board + '_' + B.into, B.at);
        assert.ok(back && back.leaf === B.leaf && back.action.room === S.board && back.action.at === B.id, site + ': the way back returns to the board room at the back door');
        assert.strictEqual(back.wall, { n: 's', s: 'n', e: 'w', w: 'e' }[B.wall], site + ': the way back is on the opposite wall');
        assert.strictEqual(D.doorSiteState(bd, null), 'open', 'a room door is never sector-gated (C-12)');
        /* the lanes: a north door ≥ 4.4 m from every link door and clear of the x 5 signboard; an east door clear of the corner masts */
        const links = room.doors.filter(d => d.link);
        if (B.wall === 'n') {
            for (const l of links) if (l.wall === 'n') assert.ok(Math.abs(l.x - bd.x) >= 4.4, site + ': ' + B.id + ' shares a lane with ' + l.id);
            assert.ok(bd.x + 2.2 < 5 - 2.4, site + ': clear of the built-in north signboard');
        } else {
            assert.strictEqual(links.filter(d => d.wall === 'n').length, 3, site + ': the north wall is FULL — three link doors — which is why the tower door is on the east wall');
        }
        const h = landing(room, bd), p = h.player;
        assert.ok(Math.abs(p.x) < Sh.w / 2 - 0.4 && Math.abs(p.z) < Sh.d / 2 - 0.4, site + ': the landing is inside the walls');
        assert.ok(Math.max(Math.abs(p.x), Math.abs(p.z)) > Sh.grid.cells * Sh.grid.cell / 2 + 0.4, site + ': off the board — on the walkway');
        for (const q of [...room.props, ...room.npcSpots]) assert.ok(!propBlocks(room, q, p.x, p.z, 0.4), site + ': ' + (q.key || q.race) + ' blocks the back door’s landing');
        for (const m of Sh.lights || []) assert.ok(Math.hypot(p.x - m.x, p.z - m.z) > 1.2, site + ': a lamp mast stands on the landing');
        const c = room.counters.find(x => x.id === 'crossing');
        assert.ok(Math.hypot(p.x - c.x, p.z - c.z) > 3, site + ': the console is clear of the landing');
    }
});

test('THE SUBWAY’s third station: Downtown’s platform stands its train FREE on its own track (a link end on a complex part), the far end is a plain stair mouth on Cyberpunk’s last free north lane, both ends pair, the line reads tunnel — Cyberpunk — Downtown', () => {
    const link = HQ.links.find(l => l.id === 'subway_downtown');
    assert.ok(link && link.route === 'subway' && link.way === 'train' && link.draft === true && link.why && link.note, 'the row');
    assert.ok(link.a.site === 'prebuilt_downtown' && link.a.part === 'subway' && link.a.wall === 'free' && link.a.face === 90 && Number.isFinite(link.a.x) && Number.isFinite(link.a.z), 'the near end: FREE on the platform, facing east onto it');
    /* THE SECOND PASS (2026-09-17): the stair comes up on CYBERPUNK CITY's grid (a complex part), no longer the board room's strip */
    assert.ok(link.b.site === 'prebuilt_cyberpunk' && link.b.part === 'streets' && link.b.wall === 'n' && link.b.x === 12 && link.b.leaf === 'leaf_frame_only' && !link.b.way, 'the far end: a plain door back on the grid\'s north wall, x 12');
    const live = D.hqLinkLive(link);
    assert.ok(live && live.a === 'site_prebuilt_downtown_subway' && live.b === 'site_prebuilt_cyberpunk_streets', 'live, both ends resolved');
    assert.ok(live.wearA.way === 'train' && live.wearB.leaf === 'leaf_frame_only', 'the train at one end, a frame at the other (hqLinkEndWear)');
    const plat = HQ.rooms.site_prebuilt_downtown_subway, tr = plat.doors.find(d => d.link === 'subway_downtown');
    assert.ok(tr && tr.way === 'train' && tr.leaf === null && tr.wall === 'free' && tr.x === -1.5 && tr.z === 3 && tr.face === 90, 'the platform wears the train');
    assert.strictEqual(tr.sub, link.a.sub); assert.strictEqual(tr.action.room, 'site_prebuilt_cyberpunk_streets');
    /* the train stands ON the track: the way's local +Z is the door's face (east), the body behind the plane over the track bed at x -2.8 */
    const bed = plat.props.find(p => p.key === 'track_bed'), edge = plat.props.find(p => p.key === 'platform_edge');
    assert.ok(bed && edge && bed.x < tr.x && tr.x < edge.x + 0.1, 'the doorway plane stands between the track bed and the platform edge');
    assert.ok(tr.x - 2.4 > -plat.shell.w / 2, 'the body (2.4 m behind the plane) fits inside the west wall');
    /* the body runs local ±X = room z: x −9..15.4 from the mark — inside the 30 m room; the arrival comes from off the north end */
    assert.ok(tr.z + 9 < plat.shell.d / 2 && tr.z - 15.4 > -plat.shell.d / 2, 'the whole train (front car + cart) stands inside the platform’s length');
    /* nothing of the platform stands in the train’s body: every floor prop and native is east of the platform edge */
    for (const q of [...plat.props, ...plat.npcSpots, ...plat.onlineSpots]) if (!q.wall && !q.ceil && q.key !== 'track_bed' && q.key !== 'platform_edge') assert.ok((q.x || 0) > -1.0, (q.key || q.race || 'seat') + ' stands on the track');
    const cy = HQ.rooms.site_prebuilt_cyberpunk_streets, st = cy.doors.find(d => d.link === 'subway_downtown');
    assert.ok(st && st.way === undefined && st.leaf === 'leaf_frame_only' && st.wall === 'n' && st.x === 12 && st.verb === 'GO DOWN', 'the grid wears the stair mouth');
    assert.ok(st.action.room === 'site_prebuilt_downtown_subway' && st.action.at === tr.id && tr.action.at === st.id, 'the pair');
    assert.strictEqual(D.hqDoorNo(st), '1954', 'the stair’s plate reads Downtown’s number');
    assert.strictEqual(D.hqDoorNo(tr), '2047', 'the train’s plate reads Cyberpunk’s number');
    assert.strictEqual(cy.doors.filter(d => d.link).length, 2, 'the grid carries the stair on its north wall and the tunnel\'s train FREE at its station (the second pass)');
    assert.strictEqual(HQ.rooms.site_prebuilt_cyberpunk.doors.filter(d => d.link).length, 1, 'the board room keeps the highway alone (the train, the stair and the machine moved into the city)');
    assert.strictEqual(cy.doors.filter(d => d.link && d.wall === 'n').length, 1, 'one on the wall');
    for (const o of cy.doors) if (o !== st && o.wall === 'n') assert.ok(Math.abs(o.x - st.x) >= 4.4, 'the stair shares a lane with ' + o.id);
    const sub = D.hqWorldRoutes('foyer').find(r => r.id === 'subway');
    assert.strictEqual(sub.stations.map(s => s.room).join(' — '), 'site_prebuilt_fairy_forest — tunnel — site_prebuilt_cyberpunk — site_prebuilt_downtown', 'the line is walked from its end — THE WOODS\' storm drain (9.3 stage 3) — through the tunnel; the last stop is Downtown');
    assert.strictEqual(sub.legs.length, 3);   // THE WOODS (9.3 stage 3): the storm drain is the third leg
    const here = D.hqWorldRoutes('site_prebuilt_downtown_subway').find(r => r.id === 'subway').stations.find(s => s.room === 'site_prebuilt_downtown');
    assert.ok(here && here.here, 'standing on the platform counts as standing in Downtown');
    assert.ok(D.hqWorldRoutes('foyer').find(r => r.id === 'highway').stations.some(s => s.site === 'prebuilt_downtown'), 'Downtown is an interchange: the highway and the subway');
});

test('every door in both complexes is reversible, each complex is connected from its board room, and nothing leaves a site but the board room’s egress and the platform’s train', () => {
    for (const [site, S] of Object.entries(SITES)) {
        const ROOMS = [S.board].concat(S.parts.map(p => S.board + '_' + p));
        const seen = new Set([S.board]), queue = [S.board];
        while (queue.length) {
            const id = queue.shift();
            for (const d of HQ.rooms[id].doors) {
                const a = d.action || {};
                assert.ok(a.room && HQ.rooms[a.room], id + '/' + d.id + ' leads to a room');
                if (d.link) {
                    if (id === S.board) continue;   // the highway's doors on the board room (hq-world.test.js guards them)
                    /* the platform's train, and since DISASTER CITY (2026-09-17) the streets' seams (the Strip, the Stadium, the gutter), the mall's time machine and the chapel's parking lot — every one a links row that pairs */
                    assert.ok(HQ.links.some(l => l.id === d.link), id + '/' + d.id + ' is a links row');
                    const far = at(a.room, a.at);
                    assert.ok(far && far.action.room === id && far.action.at === d.id, id + '/' + d.id + ' ⇄ ' + a.room + ' is a pair');
                    continue;
                }
                if (HQ.rooms[a.room].kind === 'bay') { assert.strictEqual(id, S.board, 'only the board room walks back to the bay'); continue; }
                const back = at(a.room, a.at);
                assert.ok(back && back.action.room === id && back.action.at === d.id, id + '/' + d.id + ' ⇄ ' + a.room + '/' + (back && back.id) + ' is a pair');
                assert.strictEqual(back.leaf, d.leaf, 'the same leaf on both sides of ' + d.id);
                assert.ok(ROOMS.includes(a.room), id + '/' + d.id + ' stays inside the site');
                if (!seen.has(a.room)) { seen.add(a.room); queue.push(a.room); }
            }
        }
        assert.strictEqual(Array.from(seen).sort().join(','), ROOMS.slice().sort().join(','), site + ': every part is reachable from the board room');
    }
    assert.ok(at('site_prebuilt_strip_chapel', 'casino').action.room === 'site_prebuilt_strip_casino', 'boulevard → chapel → the casino floor');
    assert.strictEqual(HQ.rooms.site_prebuilt_strip_casino.doors.length, 1, 'the casino floor has ONE door you can see — no clock, no window, the exit through the chapel');
    assert.ok(at('site_prebuilt_downtown_lobby', 'subway').action.room === 'site_prebuilt_downtown_subway', 'intersection → lobby → the platform');
    assert.strictEqual(HQ.rooms.site_prebuilt_downtown_subway.doors.filter(d => !d.link).length, 2, 'the platform has two stairs (the lobby\'s, and the street\'s since DISASTER CITY 2026-09-17) and one train');
});

test('the production renderer lands every door inside its room, clear of every blocker and native, facing along the doorway; every native is a real race standing on the floor', () => {
    for (const id of PART_IDS) {
        const room = HQ.rooms[id], S = room.shell;
        for (const door of room.doors) {
            const h = landing(room, door), p = h.player;
            assert.ok(Math.abs(p.x) < S.w / 2 - 0.4 && Math.abs(p.z) < S.d / 2 - 0.4, id + '/' + door.id + ': inside the walls');
            const inward = door.wall === 'free' ? [Math.sin(door.face * Math.PI / 180), -Math.cos(door.face * Math.PI / 180)] : { n: [0, 1], s: [0, -1], e: [-1, 0], w: [1, 0] }[door.wall];
            const fx = Math.sin(h.cam.yaw), fz = -Math.cos(h.cam.yaw);
            assert.ok(Math.abs(fx * inward[0] + fz * inward[1]) > 0.99, id + '/' + door.id + ': faces along the doorway’s normal');
            assert.equal(p.air, false); assert.equal(p.y, 0);
            for (const q of [...room.props, ...room.npcSpots]) assert.ok(!propBlocks(room, q, p.x, p.z, 0.35), id + '/' + door.id + ': ' + (q.key || q.race) + ' blocks the landing');
            if (door.wall === 'free') continue;
            for (const other of room.doors) if (other.id !== door.id && other.wall === door.wall) {
                const k = (door.wall === 'n' || door.wall === 's') ? 'x' : 'z';
                assert.ok(Math.abs(other[k] - door[k]) > 2.6, id + ': ' + door.id + ' and ' + other.id + ' overlap');
            }
            const along = (door.wall === 'n' || door.wall === 's') ? [door.x, S.w / 2] : [door.z, S.d / 2];
            assert.ok(along[1] - Math.abs(along[0]) >= ((door.wide ? 3.3 : 2.5) / 2) + 0.2, id + '/' + door.id + ': the panel fits the wall');
        }
        const sp = room.spawn;
        for (const q of [...room.props, ...room.npcSpots]) assert.ok(!propBlocks(room, q, sp.x, sp.z, 0.3), id + ': ' + (q.key || q.race) + ' blocks the spawn');
        for (const n of room.npcSpots) {
            assert.ok(D.AVAILABLE_RACES.includes(n.race), id + ': native race ' + n.race);
            for (const q of room.props) assert.ok(!propBlocks(room, q, n.x, n.z, 0.1), id + ': ' + q.key + ' stands on the ' + n.race);
        }
        for (const q of room.props) assert.ok(HQ.catalogue[q.key], id + ': catalogue key ' + q.key);
        for (const q of room.props) if (!q.wall && !q.ceil) assert.ok(Math.abs(q.x || 0) < S.w / 2 && Math.abs(q.z || 0) < S.d / 2, id + ': ' + q.key + ' is in a wall');
    }
});

test('THE PARK RULE + the light + the procs: a rail in every room, a stepped ramp in every big one; each room lights itself; the machines and the gates are catalogued procs with builders; one tape per part, the hundred still a hundred, the platform’s finds pinned off the track', () => {
    for (const id of PART_IDS) {
        const room = HQ.rooms[id], S = room.shell;
        assert.ok(room.props.some(p => p.key === 'railing_1m'), id + ': a rail to grind');
        if (S.w >= 12 || S.d >= 12) assert.ok(room.props.some(p => /^riser_[123]$/.test(p.key)), id + ': a big room has a ramp (stepped)');
        assert.ok(S.strips === false && S.mood && S.mood.ambient < 1 && Array.isArray(S.lights) && S.lights.length === 0, id + ': no facility strips — the room lights itself');
        const lit = room.props.filter(p => (HQ.catalogue[p.key] || {}).light).length;
        assert.ok(lit >= 1 && lit <= 10, id + ': ' + lit + ' prop lights (HQ_PROP_LIGHT_MAX is 10)');
        for (const n of ['floor', 'wall', 'dado', 'trim', 'ceiling']) assert.ok(HQ.textures[S[n]] || TERRAIN_RULES[S[n]], id + ': texture ' + S[n]);
        assert.strictEqual(D.DOOR_TAPES.filter(t => t.where === id).length, 1, id + ': one tape');
        for (const n of room.npcSpots) for (const l of n.say || []) assert.ok(typeof l === 'string' && l.length > 10, id + ': a said line');
    }
    assert.strictEqual(D.DOOR_TAPES.length, 100, 'the hundred stays a hundred');
    for (const rid of ['garage', 'kitchen', 'coldroom', 'dungeon']) assert.strictEqual(D.DOOR_TAPES.filter(t => t.where === rid).length, 0, rid + ' gave its tape to the urban block');
    /* the casino is lit by its machines — eight, no clock, no window */
    const cas = HQ.rooms.site_prebuilt_strip_casino;
    assert.strictEqual(cas.props.filter(p => p.key === 'slot_machine').length, 8, 'eight machines');
    assert.ok(!cas.props.some(p => p.key === 'wall_clock' || p.key === 'false_window'), 'no clock, no window on the casino floor');
    assert.ok(cas.props.filter(p => p.key === 'security_camera').length >= 2, 'the eye in the sky');
    /* the chapel: the altar against the north wall on its dais behind the rail, the register, the drive-through window */
    const ch = HQ.rooms.site_prebuilt_strip_chapel;
    assert.ok(ch.props.some(p => p.key === 'stone_altar' && p.z < -5) && ch.props.some(p => p.key === 'riser_1') && ch.props.some(p => p.key === 'lectern'), 'the altar, the dais, the register');
    assert.ok(ch.props.some(p => p.key === 'false_window' && p.wall === 'w'), 'THE DRIVE-THROUGH WINDOW');
    assert.ok(ch.props.filter(p => p.key === 'park_bench').length === 6, 'six pews');
    /* the lobby: the clock at 1954, the cordon before the stair that is gone */
    const lb = HQ.rooms.site_prebuilt_downtown_lobby;
    assert.ok(lb.props.some(p => p.key === 'wall_clock') && lb.props.some(p => p.key === 'warning_tape') && lb.props.filter(p => p.key === 'concrete_pillar').length === 2, 'the clock, the tape, the columns');
    /* the platform: the gates at the foot of the stair, the board, the map */
    const pl = HQ.rooms.site_prebuilt_downtown_subway;
    assert.strictEqual(pl.props.filter(p => p.key === 'turnstile').length, 3, 'three gates');
    assert.ok(pl.props.some(p => p.key === 'departures_board') && pl.props.some(p => p.key === 'tube_map'), 'the departures board and the map');
    assert.ok(!pl.props.some(p => p.key === 'train_car'), 'the train_car prop is retired — THE TRAIN is the way on the track');
    /* the two new procs: catalogued, built, the machine lit and blocking, the gate blocking */
    for (const k of ['slot_machine', 'turnstile']) {
        const c = HQ.catalogue[k];
        assert.ok(c && c.proc === k && c.block && !c.file, k + ': a blocking proc row');
        assert.ok(new RegExp('^        ' + k + ': function \\(U\\)', 'm').test(renderer), k + ' has a builder in _hqProcBuilders');
    }
    assert.ok(HQ.catalogue.slot_machine.light && HQ.catalogue.slot_machine.glow, 'a machine lights the floor');
    assert.ok(/reels\[i\]\.rotation\.x \+= dt \* 14/.test(renderer), 'the reels spin on a ticker');
    assert.ok(/tri\.rotation\.x = turn/.test(renderer), 'the tripod turns');
    /* the finds: the platform's tape and envelope are PINNED onto the platform — the train's body (a way's blockers, laid at build) lies over the track where the generator would otherwise put the far corner */
    const pins = HQ.findSpots.site_prebuilt_downtown_subway;
    assert.ok(pins && pins.tape && pins.pay, 'the platform’s finds are pinned');
    for (const f of HQ.finds.filter(f => f.room === 'site_prebuilt_downtown_subway')) assert.ok(f.x > -1.0 && Math.abs(f.z) < 15 - 0.4, f.id + ' stands on the platform, off the track');
    for (const id of PART_IDS) assert.ok(HQ.finds.some(f => f.room === id && f.kind === 'tape') && HQ.finds.some(f => f.room === id && f.kind === 'pay'), id + ': a tape and an envelope');
    /* the source: the back-door rows and the link */
    assert.match(dataSrc, /prebuilt_strip: \[\n\s+\{ id: 'chapel', wall: 'n', x: -0\.2, leaf: 'leaf_motel',/, 'the Strip’s back-door row');
    assert.match(dataSrc, /prebuilt_downtown: \[\n\s+\{ id: 'tower', wall: 'e', z: 0, leaf: 'leaf_entrance',/, 'Downtown’s back-door row');
    assert.match(dataSrc, /\{ id: 'subway_downtown', route: 'subway', way: 'train',/, 'the link row');
});
