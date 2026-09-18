// hq-area51.test.js — AREA 51 (2026-09-18 — the user: "still need to add the
// Area 51 with the hangar and white padded rooms and other stuff"): three parts
// on Room 51 on THE HALLS blueprint (D.U.M.B.'s) — HANGAR 18 (the floor the
// BSP wraps with offices, THE RIG with the saucer, THE CATWALK, THE CRANE
// HOOK, the floor lift = the tunnel to the D.U.M.B.), THE WHITE ROOMS (a fine
// BSP of cells and closets, the dayroom, the station, two padded cells, THE
// OBSERVATION DECK, THE CAGE) and THE FLIGHT LINE (open under the base's own
// night on a `rooms` plan with no thicket — the aprons between blast berms,
// RUNWAY 33, THE TOWER, THE MAST, the pens). The board room is BYPASSED
// (siteRooms.entry): the man-door lands you in the hangar.
// Guards: the sheet, THE ENTRY + the tunnel on the hangar, one piece + two
// ways out of every part, the plans (the cycle rule), THE SOLVER + THE RETURN
// GUARANTEE + the production landing, THE PARK RULE + the lights + the three
// hard tapes, the shell helper, the two procs and the source sites.
'use strict';
const test = require('node:test');
const { heavy } = require('./test-heavy.js');   // 2026-09-18: the heavy geometry proofs run on `npm run test:full` / in CI
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { loadGameData } = require('./load-data');
const D = loadGameData(), HQ = D.DOOR_HQ;
const HANGAR = 'site_prebuilt_area51_hangar', WARD = 'site_prebuilt_area51_ward', LINE = 'site_prebuilt_area51_flightline', BOARD = 'site_prebuilt_area51';
const PARTS = { [HANGAR]: 'hangar', [WARD]: 'ward', [LINE]: 'flightline' };
const IDS = Object.keys(PARTS);
const renderer = fs.readFileSync(__dirname + '/three-renderer.js', 'utf8');
const SPRITES = fs.readFileSync(__dirname + '/sprites.js', 'utf8');
const at = (room, id) => (HQ.rooms[room].doors || []).find(d => d.id === id);

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
    c._hq.doors.push({ door, box: c._hqBoxWall(room, door.wall, door), y0: D.hqTerrainDoorY(room, door) });
    assert.equal(c._hqGoTo(door.id, true), true, room.label + '/' + door.id + ' lands');
    return c._hq;
}
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

test('the sheet: three parts on Room 51 — site + part, none numbered, every one a terrain room with a plan; the hangar and the ward closed in the bunker shell (the pack), the flight line OPEN under the base’s own sky (hqAirbaseShell); the register lists the site once', () => {
    for (const id of IDS) {
        const r = HQ.rooms[id];
        assert.ok(r && r.kind === 'box' && r.site === 'prebuilt_area51' && r.part === PARTS[id], id + ': a box room wearing site + part');
        assert.equal(D.hqComplexRoomId('prebuilt_area51', PARTS[id]), id);
        assert.equal(r.roomNo, undefined, id + ' wears no number');
        assert.equal(D.hqRoomNo(id), HQ.thresholds.prebuilt_area51.roomNo, id + ': hqRoomNo reads 51 through site');
        assert.equal(D.hqRoomSite(id), 'prebuilt_area51', id + ' is WILD');
        assert.ok(/AREA 51/.test(r.label) && r.sub && r.spawn && Array.isArray(r.lines) && r.lines.length >= 3, id + ': plate, spawn, lines');
        assert.ok(r.terrain && r.terrain.gen && !r.cave && D.hqTerrainInfo(id), id + ': a planned terrain room');
        assert.ok(r.shell.look && r.shell.look.name && r.shell.strips === false && r.shell.mood, id + ': a look, no strips, its own mood');
        assert.ok(!r.doors.some(d => (HQ.catalogue[d.leaf] || {}).rank), id + ': no rank leaf');
        assert.ok(r.doors.length >= 2, id + ': two ways out (the cycle rule at the complex’s scale)');
    }
    for (const id of [HANGAR, WARD]) {
        const S = HQ.rooms[id].shell;
        assert.ok(!S.open && S.fog && S.fog.density > 0 && S.ceilTile === 1.75 && Array.isArray(S.lights) && S.lights.length === 0, id + ': closed, a haze, the pack’s tile');
        for (const n of ['floor', 'wall', 'dado', 'ceiling']) assert.ok(/^urban:/.test(S[n]) && SPRITES.includes("'" + S[n].slice(6) + "'"), id + ': ' + n + ' is a pack sheet');
        assert.equal(HQ.rooms[id].terrain.gen.kind, 'halls', id + ': a halls plan');
    }
    const F = HQ.rooms[LINE].shell;
    assert.ok(F.open && F.edge === 'open' && F.sky && F.sky.night === 1 && F.sky.scenery === 'orbs' && F.lights.length === 0 && Array.isArray(F.sky.landmarks) && F.sky.landmarks[0].kind === 'peak', 'the flight line: open, the base’s night, the range on the sky, no fluorescents');
    const meta = D.EW_MAP_META.find(m => m.id === 'prebuilt_area51').env;
    assert.ok(F.sky.tint === meta.tint && F.sky.tintAmt === meta.tintAmt && F.sky.stars === meta.stars && F.sky.nebula === meta.nebula && F.sky.fog.color === meta.fog.color, 'the sky is the map row’s (edit both)');
    assert.equal(HQ.rooms[LINE].terrain.gen.kind, 'rooms'); assert.equal(HQ.rooms[LINE].terrain.gen.thicket, false, 'aprons between berms, no thicket');
    assert.equal(HQ.rooms[HANGAR].shell.look, D.HQ_ROOM_LOOKS.hangar); assert.equal(HQ.rooms[WARD].shell.look, D.HQ_ROOM_LOOKS.white); assert.equal(HQ.rooms[LINE].shell.look, D.HQ_ROOM_LOOKS.flightline);
    const reg = D.hqRoomRegister();
    assert.equal(reg.filter(r => r.mapId === 'prebuilt_area51').length, 1, 'the register lists the site once');
    assert.ok(!reg.some(r => IDS.includes(r.id) || IDS.includes(r.room)), 'no part is a register entry');
    assert.equal(D.hqSiteComplex('prebuilt_area51').length, 4, 'the board room and three parts');
});

test('THE ENTRY + THE TUNNEL: the board room is bypassed — the man-door lands you in HANGAR 18 (the bay door on its south wall is the board’s egress); area51_dumb lives on the hangar’s EAST wall and lands on the motor pool’s WEST; the board carries no link door', () => {
    const eg = at(BOARD, 'egress'), bay = at(HANGAR, 'bay');
    assert.ok(D.hqSiteEntryOf('prebuilt_area51') && D.hqSiteEntryOf('prebuilt_area51').room === HANGAR);
    assert.ok(bay && bay.entry === 'prebuilt_area51' && bay.wall === 's' && bay.x === 0 && bay.leaf === eg.leaf && bay.label === eg.label && bay.action.room === eg.action.room && bay.action.at === eg.action.at, 'the bay door is the board’s egress');
    assert.equal(HQ.rooms[HANGAR].doors.filter(d => d.id === 'bay').length, 1, 'once');
    assert.equal(D.hqSiteEntry(BOARD, 'egress').at, 'bay'); assert.equal(D.hqSiteEntry(BOARD, 'crossing').at, 'bay'); assert.equal(D.hqSiteEntry(BOARD, 'white').at, 'white', 'an `at` the part has is kept');
    assert.ok(!HQ.rooms[BOARD].doors.some(d => d.link), 'the bypassed board carries no link door');
    const a51 = HQ.links.find(l => l.id === 'area51_dumb');
    assert.ok(a51 && D.hqLinkLive(a51) && a51.a.site === 'prebuilt_area51' && a51.a.part === 'hangar' && a51.a.wall === 'e' && a51.a.z === 0 && a51.a.sub, 'the floor lift on the hangar’s east wall');
    const d = at(HANGAR, 'link_area51_dumb'), far = at('site_prebuilt_dumb_motorpool', 'link_area51_dumb');
    assert.ok(d && d.wall === 'e' && far && far.wall === 'w' && d.action.room === 'site_prebuilt_dumb_motorpool' && far.action.room === HANGAR, 'the generated doors pair');
    assert.equal(D.hqDoorNo(d), D.hqRoomNo('site_prebuilt_dumb_motorpool'), 'the plate reads 555');
    const line = D.hqWorldRoutes(HANGAR).find(r => r.id === 'bases');
    assert.ok(line && line.legs.some(l => l.fromRoom === HANGAR || l.toRoom === HANGAR), 'the bases line runs through the hangar');
});

test('ONE PIECE: from the bay door every part is walked; every inside door is a pair with the same leaf; nothing leaves the site but a links row or the bay; the three parts form a loop (hangar ⇄ ward ⇄ flight line ⇄ hangar)', () => {
    const seen = new Set(), queue = [HANGAR];
    while (queue.length) {
        const id = queue.shift(); if (seen.has(id)) continue; seen.add(id);
        for (const d of HQ.rooms[id].doors) {
            const a = d.action || {};
            assert.ok(a.room && HQ.rooms[a.room], id + '/' + d.id + ' leads to a room');
            if (d.entry) { assert.ok(HQ.rooms[a.room].kind === 'bay', id + '/' + d.id + ' is the bay door'); continue; }
            if (d.link) { assert.ok(HQ.links.some(l => l.id === d.link), id + '/' + d.id + ' is a links row'); const f = at(a.room, a.at); assert.ok(f && f.link === d.link, id + '/' + d.id + ': the far end pairs'); continue; }
            const other = at(a.room, a.at);
            assert.ok(other && other.action.room === id && other.action.at === d.id, id + '/' + d.id + ' ⇄ ' + a.room + ' is a pair');
            assert.equal(other.leaf, d.leaf, 'the same opening on both sides of ' + d.id);
            assert.ok(IDS.includes(a.room), id + '/' + d.id + ' stays inside the site');
            queue.push(a.room);
        }
    }
    assert.deepEqual(Array.from(seen).sort().join(','), IDS.slice().sort().join(','), 'every part is walked');
    assert.ok(at(HANGAR, 'white').action.room === WARD && at(WARD, 'yard').action.room === LINE && at(LINE, 'hangar').action.room === HANGAR, 'the loop');
    assert.ok(at(LINE, 'hangar').wall === 's' && at(LINE, 'ward').wall === 's' && Math.abs(at(LINE, 'hangar').x - at(LINE, 'ward').x) > 4.4, 'two doors on the flight line’s south wall, lanes apart');
});

test('THE PLANS: the hangar floor and the ward’s rooms kept open, BSP rooms round them, no room with one way in (THE CYCLE RULE), the mass to the ceiling, traced walls; the flight line’s aprons joined with no thicket and the berms low', () => {
    for (const id of [HANGAR, WARD]) {
        const room = HQ.rooms[id], gen = room.terrain.gen, info = D.hqTerrainInfo(id), S = room.shell, P = info.genPlan;
        for (const r of gen.rooms) for (const [dx, dz] of [[0, 0], [0.4, 0.4], [-0.4, -0.4], [0.4, -0.4], [-0.4, 0.4]]) assert.ok(D.hqTerrainMaskAt(info, r.x + dx * r.w, r.z + dz * r.d) > 0.25, id + ': ' + r.id + ' is open to its corners');
        assert.ok(P.rooms.filter(r => !r.authored).length >= 3, id + ': BSP rooms round the chambers (' + P.rooms.filter(r => !r.authored).length + ')');
        assert.equal(P.deadEnds.length, 0, id + ': THE CYCLE RULE');
        for (let i = 0; i < P.rooms.length; i++) assert.ok(P.edges.filter(e => e[0] === i || e[1] === i).length >= 2 || P.rooms.length < 2, id + ': room ' + i + ' has two ways out');
        assert.ok(info.gen.solidMass && info.solidTop && info.gen.wallH === S.h && info.planWalls.length >= 20, id + ': the mass to the ceiling, traced walls');
        assert.equal((info.thicket || []).length, 0, id + ': no thicket');
    }
    const li = D.hqTerrainInfo(LINE);
    assert.ok(li.gen && li.gen.kind === 'rooms' && (li.thicket || []).length === 0 && li.gen.wallH === 1.6, 'the berms: 1.6 m, no trees');
    for (const pt of [[-40, 10], [0, 10], [40, 10], [18, 20], [-30, 20]]) assert.ok(D.hqTerrainMaskAt(li, pt[0], pt[1]) > 0.5, 'the runway / the taxiways open at ' + pt.join(','));
    assert.ok(li.gen.open >= D.HQ_TERRAIN_GEN.rooms.minOpen || li.gen.open >= D.HQ_TERRAIN_GEN.minOpen, 'the aprons are most of the field');
});

test('THE SOLVER + THE RETURN GUARANTEE + THE PRODUCTION LANDING: every door reaches every other under the walker’s rule, nothing traps, every ramp tops out on reached ground, every landing is inside, level, faces the doorway and stands clear of every prop and native; natives and props on walkable ground', () => {
    for (const id of IDS) {
        const room = HQ.rooms[id], S = room.shell, info = D.hqTerrainInfo(id);
        const L = room.doors.map(d => Object.assign({ d }, D.hqTerrainDoorLanding(room, d)));
        for (const a of L) {
            const reach = D.hqTerrainReach(info, a.x, a.z);
            assert.ok(reach.size > 400, id + '/' + a.d.id + ': a landing the walker can leave');
            for (const b of L) assert.ok(reach.has(D.hqTerrainNodeKey(info, b.x, b.z)), id + ': ' + a.d.id + ' → ' + b.d.id + ' unreachable');
        }
        assert.equal(D.hqTerrainTraps(info).length, 0, id + ': a trap');
        const R0 = D.hqTerrainReach(info, L[0].x, L[0].z);
        for (const f of room.terrain.features) {
            if (f.k !== 'ramp') continue;
            const dx = f.x1 - f.x0, dz = f.z1 - f.z0, l = Math.hypot(dx, dz) || 1;
            assert.ok(R0.has(D.hqTerrainNodeKey(info, f.x1 + dx / l * 0.6, f.z1 + dz / l * 0.6)), id + ': the ramp ' + f.h0 + '→' + f.h1 + ' tops out on ground the walker never reaches');
        }
        for (const door of room.doors) {
            const h = landing(room, door), p = h.player;
            assert.ok(Math.abs(p.x) < S.w / 2 - 0.4 && Math.abs(p.z) < S.d / 2 - 0.4, id + '/' + door.id + ': inside');
            const inward = { n: [0, 1], s: [0, -1], e: [-1, 0], w: [1, 0] }[door.wall];
            const dot = Math.sin(h.cam.yaw) * inward[0] + (-Math.cos(h.cam.yaw)) * inward[1];
            assert.ok(dot < -0.99 || dot > 0.99, id + '/' + door.id + ': faces along the doorway’s normal');
            const feet = D.hqTerrainFeet(info, p.x, p.z, null);
            assert.ok(feet != null && Math.abs(feet - p.y) < 0.12 && D.hqTerrainSlope(info, p.x, p.z) < 0.3, id + '/' + door.id + ': the pad is level under the landing');
            for (const q of [...room.props, ...room.npcSpots]) assert.ok(!propBlocks(room, q, p.x, p.z, 0.35), id + '/' + door.id + ': ' + (q.key || q.race) + ' blocks the landing');
        }
        const sp = room.spawn;
        for (const q of [...room.props, ...room.npcSpots]) assert.ok(!propBlocks(room, q, sp.x, sp.z, 0.3), id + ': ' + (q.key || q.race) + ' blocks the spawn');
        assert.ok(D.hqTerrainFeet(info, sp.x, sp.z, null) != null && D.hqTerrainMaskAt(info, sp.x, sp.z) > 0.3, id + ': the spawn stands on open ground');
        for (const n of room.npcSpots) { assert.ok(D.AVAILABLE_RACES.includes(n.race), id + ': native race ' + n.race); assert.ok(Array.isArray(n.say) && n.say.length >= 1, id + ': a native says'); assert.ok(D.hqTerrainFeet(info, n.x, n.z, null) != null && D.hqTerrainMaskAt(info, n.x, n.z) > 0.2, id + ': native on open ground at ' + n.x + ',' + n.z); }
        for (const p of room.props) { assert.ok(HQ.catalogue[p.key], id + ': prop ' + p.key); if (p.wall || p.ceil || (HQ.catalogue[p.key] || {}).ceil) continue; assert.ok(D.hqTerrainFeet(info, p.x, p.z, null) != null, id + ': prop ' + p.key + ' on no ground at ' + p.x + ',' + p.z); }
        assert.ok(!room.props.some(p => typeof p.wall === 'string'), id + ': a plan room hangs nothing on the shell');
    }
});

test('THE ROOMS: the rig and the catwalk are climbed and the crane hook is not; the deck is climbed and the cage is not; the tower is climbed, the mast is not; the saucer, the padding, the runway, the beacon', () => {
    const key = (info, x, z) => D.hqTerrainNodeKey(info, x, z), foot = (id, doorId) => D.hqTerrainDoorLanding(HQ.rooms[id], at(id, doorId));
    const hi = D.hqTerrainInfo(HANGAR), hf = foot(HANGAR, 'bay'), hR = D.hqTerrainReach(hi, hf.x, hf.z);
    assert.ok(hR.has(key(hi, -12, -2)) && Math.abs(hR.get(key(hi, -12, -2)) - 1.2) < 0.2, 'THE RIG is climbed');
    assert.ok(hR.has(key(hi, -8, -14)) && Math.abs(hR.get(key(hi, -8, -14)) - 5.5) < 0.2, 'THE CATWALK is climbed');
    assert.ok(!hR.has(key(hi, 8, 6)) && D.hqTerrainHeight(hi, 8, 6) > 7.5, 'THE CRANE HOOK is the door gun’s');
    assert.ok(HQ.rooms[HANGAR].props.some(p => p.key === 'saucer_rig' && p.x === -12 && p.z === -2) && HQ.rooms[HANGAR].props.filter(p => p.key === 'iso_tank').length === 2, 'the saucer on the rig, the tanks');
    const wi = D.hqTerrainInfo(WARD), wf = foot(WARD, 'hangar'), wR = D.hqTerrainReach(wi, wf.x, wf.z);
    assert.ok(wR.has(key(wi, -10, -3.5)) && Math.abs(wR.get(key(wi, -10, -3.5)) - 2.2) < 0.2, 'THE DECK is climbed');
    assert.ok(!wR.has(key(wi, 6, 0)) && D.hqTerrainHeight(wi, 6, 0) > 3.5, 'THE CAGE is the door gun’s');
    assert.ok(wR.has(key(wi, -16, -9)) && wR.has(key(wi, 14, 8)) && wR.has(key(wi, -10, 4)) && wR.has(key(wi, 12, -6)), 'both cells, the dayroom, the station');
    assert.equal(HQ.rooms[WARD].props.filter(p => p.key === 'wall_padding').length, 6, 'the padding, three walls a cell');
    assert.ok(HQ.rooms[WARD].props.filter(p => p.key === 'wall_padding').every(p => typeof p.x === 'number' && typeof p.face === 'number' && !p.wall), 'free-standing on the plan walls');
    const li = D.hqTerrainInfo(LINE), lf = foot(LINE, 'hangar'), lR = D.hqTerrainReach(li, lf.x, lf.z);
    assert.ok(lR.has(key(li, -10, -16)) && Math.abs(lR.get(key(li, -10, -16)) - 4.5) < 0.2, 'THE TOWER is climbed');
    assert.ok(!lR.has(key(li, -8, -17.5)) && D.hqTerrainHeight(li, -8, -17.5) > 7.5, 'THE MAST is the door gun’s');
    for (const x of [-44, -20, 0, 20, 44]) assert.ok(lR.has(key(li, x, 10)), 'the runway walked end to end at x ' + x);
    assert.ok(lR.has(key(li, 30, 22)) && lR.get(key(li, 30, 22)) < -1.4, 'the crater walked down');
    assert.ok(HQ.rooms[LINE].props.some(p => p.key === 'floating_orb') && HQ.rooms[LINE].props.filter(p => p.key === 'flood_mast').length === 4 && HQ.rooms[LINE].props.filter(p => p.key === 'quarter_pipe').length === 2, 'the beacon, four masts, the half pipe');
});

test('THE PARK RULE + THE LIGHT + THE HARD TAPES: a rail and a stair in every part; every part lights itself under the cap; one tape per part (three re-homed, the hundred kept) on a pinnacle the walker never reaches with a shot from the ground; the board keeps THE BADGE PHOTO', heavy, () => {
    const cap = vm.runInContext('typeof HQ_PROP_LIGHT_MAX !== "undefined" ? HQ_PROP_LIGHT_MAX : 10', D);
    for (const id of IDS) {
        const room = HQ.rooms[id], info = D.hqTerrainInfo(id), F = room.terrain.features;
        assert.ok(info.rails.length >= 1 && room.props.some(p => p.key === 'railing_1m'), id + ': a rail to grind');
        assert.ok(F.some(f => f.k === 'ramp' && f.stairs) && F.some(f => f.k === 'plateau'), id + ': a stair and a tier');
        const lit = room.props.filter(p => (HQ.catalogue[p.key] || {}).light).length;
        assert.ok(lit >= 4 && lit <= cap, id + ': ' + lit + ' lights');
    }
    const tapes = D.DOOR_TAPES;
    assert.equal(tapes.length, 100);
    for (const id of IDS) {
        assert.equal(tapes.filter(t => t.where === id).length, 1, id + ': one tape');
        const rows = HQ.finds.filter(f => f.room === id), tape = rows.find(f => f.kind === 'tape'), pay = rows.find(f => f.kind === 'pay');
        assert.ok(tape && pay, id + ': a tape and an envelope');
        assert.ok(tape.hard === true && tape.y >= 3.5, id + ': the tape is the door gun’s (' + tape.y + ' m)');
        const pin = HQ.findSpots[id];
        assert.ok(pin && pin.tape && tape.x === pin.tape.x && tape.z === pin.tape.z, id + ': the tape stands on its pin');
        const info = D.hqTerrainInfo(id), L0 = D.hqTerrainDoorLanding(HQ.rooms[id], HQ.rooms[id].doors[0]), reach = D.hqTerrainReach(info, L0.x, L0.z);
        assert.ok(!reach.has(D.hqTerrainNodeKey(info, tape.x, tape.z)), id + ': the walker never reaches it');
        assert.ok(D.hqFindHardReachTerrain(tape, { terrain: info, reach, S: HQ.rooms[id].shell }).ok, id + ': the door gun has a shot at its lip');
    }
    assert.equal(tapes.filter(t => t.where === BOARD).length, 1, 'THE BADGE PHOTO stays on the board');
    for (const where of ['site_prebuilt_gobekli_tell', 'site_prebuilt_bermuda_sea']) assert.equal(tapes.filter(t => t.where === where).length, 1, where + ' gave its second tape');   // THE DEEP (2026-09-18): the Triangle's board is bypassed — its one tape sits on THE OPEN SEA   // THE LEY LINES (2026-09-18): Göbekli's board is bypassed — its tape sits on the tell
    assert.ok(tapes.some(t => t.where === HANGAR && t.title === 'HANGAR 18, 03:00') && tapes.some(t => t.where === WARD && t.title === 'ROOM 5150-B') && tapes.some(t => t.where === LINE && t.title === 'RUNWAY 33'), 'the titles');
});

test('the shell helper, the looks, the two procs and the source sites', heavy, () => {
    const S = D.hqAirbaseShell({ w: 10, d: 12 });
    assert.ok(S.open && S.edge === 'open' && S.w === 10 && S.d === 12 && S.sky.night === 1 && S.sky.landmarks.length === 1 && S.lights.length === 0 && S.look === D.HQ_ROOM_LOOKS.flightline && S.mood.night === 1, 'hqAirbaseShell');
    for (const k of ['hangar', 'white', 'flightline']) { const L = D.HQ_ROOM_LOOKS[k]; assert.ok(L && L.name && L.retro && L.cin && typeof L.bloom === 'number', 'look ' + k); }
    assert.equal(D.HQ_ROOM_LOOKS.white.nightMood, 0, 'the white rooms have no night');
    for (const k of ['saucer_rig', 'flood_mast']) { const c = HQ.catalogue[k]; assert.ok(c && c.proc === k && c.light && c.glow && c.block, 'catalogue ' + k); assert.ok(renderer.includes('        ' + k + ': function (U) {'), 'three-renderer.js builds ' + k); }
    assert.ok(/saucer_rig: function \(U\) \{[\s\S]*_hq\.tickers\.push/.test(renderer), 'the saucer breathes');
    const { spawnSync } = require('node:child_process');
    const r = spawnSync(process.execPath, ['check-terrain.js', '--json', ...IDS], { cwd: __dirname, encoding: 'utf8' });
    assert.equal(r.status, 0, r.stderr);
    const rows = JSON.parse(r.stdout);
    assert.equal(rows.length, 3);
    for (const row of rows) { assert.equal(row.unreached.length, 0, row.id + ': every door reached'); assert.equal(row.traps.length, 0, row.id + ': nothing traps'); assert.equal(row.plan.deadEnds, 0, row.id + ': no dead ends'); }
});
