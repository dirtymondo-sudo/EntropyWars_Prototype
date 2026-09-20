// hq-dumb.test.js — D.U.M.B. (HQ plan 9.3 stage 8 — THE COMPLEX CANDIDATES #5,
// 2026-09-17): the base under the base as ONE complex of seven terrain rooms
// on two sites, the first built on THE HALLS floor plan (EXPLORABLE_AREAS_GUIDE
// family C — rooms-and-hallways: BSP rooms + L-corridors round authored
// chambers, the walls a MASS traced into wall rows):
//   Room 555's MOTOR POOL (the tram hall, the platform, the bays; the tunnel
//   in from Area 51's hangar on its west wall and out to CERN on its east),
//   SUB-LEVEL 7 (the hub, THE TOWER, the four test chambers, the spokes),
//   DREAM RESEARCH (the ward, the range, the booth), CLONE RESEARCH (the vats
//   under the gantry, the furnace, THE OTHER ONE), THE WAR ROOM (a prefab —
//   its own floor: the pit, the galleries, the big board, the booth), THE
//   BUNKER (the great room, the loft, the pool, the cellar, the safe);
//   Room 999's RING (one authored loop hall, the detector hall, the control
//   room).
// Guards: the sheet, the two back doors on the freed lanes, the two tunnel
// links RE-POINTED onto the parts, the complex walked from every way in with
// every inside door a pair, THE HALLS plan itself (BSP rooms, L-corridors,
// authored rooms and halls kept, the mass rule, the traced walls, the
// tooth cleanup, determinism), THE SOLVER + THE RETURN GUARANTEE + the
// production landing on every door, THE PARK RULE, the seven hard tapes (the
// door gun's), the looks, the shell helper, the strip lights and the
// renderer's source sites.
'use strict';
const test = require('node:test');
const { heavy } = require('./test-heavy.js');   // 2026-09-18: the heavy geometry proofs run on `npm run test:full` / in CI
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { loadGameData } = require('./load-data');
const D = loadGameData(), HQ = D.DOOR_HQ;
const MOTOR = 'site_prebuilt_dumb_motorpool', SEVEN = 'site_prebuilt_dumb_sublevel7', DREAM = 'site_prebuilt_dumb_dreamlab', CLONE = 'site_prebuilt_dumb_clonevats';
const WAR = 'site_prebuilt_dumb_warroom', BUNKER = 'site_prebuilt_dumb_bunker', RING = 'site_prebuilt_cern_ring';
const PARTS = { [MOTOR]: ['prebuilt_dumb', 'motorpool'], [SEVEN]: ['prebuilt_dumb', 'sublevel7'], [DREAM]: ['prebuilt_dumb', 'dreamlab'], [CLONE]: ['prebuilt_dumb', 'clonevats'],
                [WAR]: ['prebuilt_dumb', 'warroom'], [BUNKER]: ['prebuilt_dumb', 'bunker'], [RING]: ['prebuilt_cern', 'ring'] };
const IDS = Object.keys(PARTS);
const PLANNED = IDS.filter(id => id !== WAR);
const renderer = fs.readFileSync(__dirname + '/three-renderer.js', 'utf8');
const SPRITES = fs.readFileSync(__dirname + '/sprites.js', 'utf8');
const at = (room, id) => (HQ.rooms[room].doors || []).find(d => d.id === id);
const G = D.HQ_TERRAIN_GEN;

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
    c._hq.doors.push({ door, box: c._hqBoxWall(room, door.wall, door), y0: sill(room, door) });
    assert.equal(c._hqGoTo(door.id, true), true, room.label + '/' + door.id + ' lands');
    return c._hq;
}
function sill(room, door) { return room.terrain ? D.hqTerrainDoorY(room, door) : 0; }
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

test('the sheet: seven parts on two sites — six on Room 555, the ring on Room 999 — each site + part, none numbered, every one a closed terrain room wearing the bunker shell (the pack: concrete, corrugated, rubber, the drop ceiling), six on a `halls` plan, the war room its own floor; the register lists each site once', heavy, () => {
    for (const id of IDS) {
        const [site, part] = PARTS[id], r = HQ.rooms[id];
        assert.ok(r && r.kind === 'box' && r.site === site && r.part === part, id + ': a box room wearing site + part');
        assert.equal(D.hqComplexRoomId(site, part), id);
        assert.equal(r.roomNo, undefined, id + ' wears no number of its own');
        assert.equal(D.hqRoomNo(id), HQ.thresholds[site].roomNo, id + ': hqRoomNo reads the threshold’s number through site');
        assert.equal(D.hqRoomSite(id), site, id + ' is WILD');
        assert.ok(/D\.U\.M\.B\.|CERN/.test(r.label) && r.sub && r.spawn && Array.isArray(r.lines) && r.lines.length >= 3, id + ': plate, spawn, lines');
        assert.ok(r.terrain && !r.cave && D.hqTerrainInfo(id), id + ': a terrain room');
        assert.ok(!r.shell.open && r.shell.strips === false && Array.isArray(r.shell.lights) && r.shell.lights.length === 0 && r.shell.mood && r.shell.fog && r.shell.fog.density > 0, id + ': closed, no strips, its own haze — the room lights itself');
        assert.ok(r.shell.look && r.shell.look.name && r.shell.ceilTile === 1.75, id + ': a look and the pack’s ceiling tile');
        for (const n of ['floor', 'wall', 'dado', 'ceiling']) assert.ok(/^urban:/.test(r.shell[n]) && SPRITES.includes("'" + r.shell[n].slice(6) + "'"), id + ': ' + n + ' is a pack sheet (' + r.shell[n] + ')');
        assert.equal(r.terrain.crag, false, id + ': no crag (the walls are the plan’s)');
        assert.ok(r.terrain.noise && r.terrain.noise.amp === 0, id + ': a level floor');
        if (PLANNED.includes(id)) assert.equal(r.terrain.gen.kind, 'halls', id + ': a halls plan'); else assert.ok(!r.terrain.gen, id + ' is its own floor');
        assert.ok(!r.doors.some(d => (HQ.catalogue[d.leaf] || {}).rank), id + ': no rank leaf');
    }
    assert.equal(HQ.rooms[MOTOR].shell.look, D.HQ_ROOM_LOOKS.dumb); assert.equal(HQ.rooms[SEVEN].shell.look, D.HQ_ROOM_LOOKS.dumb);
    assert.equal(HQ.rooms[WAR].shell.look, D.HQ_ROOM_LOOKS.warroom); assert.equal(HQ.rooms[BUNKER].shell.look, D.HQ_ROOM_LOOKS.bunker); assert.equal(HQ.rooms[RING].shell.look, D.HQ_ROOM_LOOKS.cern);
    assert.equal(HQ.rooms[RING].terrain.gen.bsp, false, 'the ring is authored halls alone');
    const reg = D.hqRoomRegister();
    for (const site of ['prebuilt_dumb', 'prebuilt_cern']) assert.equal(reg.filter(r => r.mapId === site).length, 1, 'the register lists ' + site + ' once');
    assert.ok(!reg.some(r => IDS.includes(r.id) || IDS.includes(r.room)), 'no part is a register entry');
    assert.equal(D.hqSiteComplex('prebuilt_dumb').length, 7, 'D.U.M.B.: the board room and six parts');
    assert.equal(D.hqSiteComplex('prebuilt_cern').length, 2, 'CERN: the board room and the ring');
});

test('THE WAYS IN = THE ENTRY (2026-09-18): the two board rooms are BYPASSED — the freight lift lands you in the motor pool, the blast door on the ring, each part wearing the board’s egress as its bay door; the tunnel links live on the parts (area51_dumb on the motor pool’s WEST wall from the hangar, dumb_cern EAST to the ring’s WEST, cern_backrooms on the ring, cave_dumb on SUB-LEVEL 7); THE RAMP joins the garage (P1) to the motor pool (P3)', () => {
    for (const [site, part, backId] of [['prebuilt_dumb', MOTOR, 'lift'], ['prebuilt_cern', RING, 'ring']]) {
        const board = 'site_' + site, eg = at(board, 'egress'), bay = at(part, 'bay');
        assert.ok(D.hqSiteEntryOf(site) && D.hqSiteEntryOf(site).room === part, site + ': the entry names ' + part);
        assert.ok(bay && bay.entry === site && bay.wall === 's' && bay.x === 0 && bay.leaf === eg.leaf && bay.action.room === eg.action.room && bay.action.at === eg.action.at, part + ': the bay door is the board room’s egress');
        assert.equal(HQ.rooms[part].doors.filter(d => d.id === 'bay').length, 1, part + ': once');
        assert.ok(!HQ.rooms[part].doors.some(d => d.action && d.action.room === board), part + ': no door of its own back onto the bypassed board');
        assert.equal(D.hqSiteEntry(board, 'egress').at, 'bay'); assert.equal(D.hqSiteEntry(board, 'crossing').at, 'bay'); assert.equal(D.hqSiteEntry(board, backId).at, 'bay', site + ': the board’s own back door lands at the bay');
        assert.ok(at(board, backId) && at(board, backId).action.room === part && at(board, backId).action.at === 'bay', site + ': the board’s back door still names the part (unwalked)');
        assert.ok(!HQ.rooms[board].doors.some(d => d.link), site + ': the bypassed board carries no link door (it would land at the bay)');
    }
    const L = id => HQ.links.find(l => l.id === id);
    const a51 = L('area51_dumb'), dc = L('dumb_cern'), cb = L('cern_backrooms'), cd = L('cave_dumb'), gm = L('garage_motorpool');
    assert.ok(a51 && D.hqLinkLive(a51) && a51.route === 'bases' && a51.a.site === 'prebuilt_area51' && a51.a.part === 'hangar' && a51.a.wall === 'e' && a51.b.part === 'motorpool' && a51.b.wall === 'w', 'the hangar’s floor lift ⇄ the motor pool’s west wall');
    assert.ok(dc && D.hqLinkLive(dc) && dc.route === 'bases' && dc.a.part === 'motorpool' && dc.a.wall === 'e' && dc.b.site === 'prebuilt_cern' && dc.b.part === 'ring' && dc.b.wall === 'w', 'the tunnel to the ring');
    assert.ok(cb && D.hqLinkLive(cb) && cb.a.site === 'prebuilt_cern' && cb.a.part === 'ring' && cb.a.wall === 'n' && cb.a.sub, 'the backrooms’ office door is on the ring');
    assert.ok(cd && D.hqLinkLive(cd) && cd.b.site === 'prebuilt_dumb' && cd.b.part === 'sublevel7' && cd.b.wall === 'n' && /LEVEL −6/.test(cd.b.sub), 'LEVEL −6 is the level that does not exist');
    assert.ok(gm && D.hqLinkLive(gm) && gm.route === 'bases' && gm.a.room === 'garage' && gm.a.wall === 'w' && gm.b.site === 'prebuilt_dumb' && gm.b.part === 'motorpool' && gm.b.wall === 's' && gm.why && gm.draft, 'THE RAMP: the garage ⇄ the motor pool');
    assert.ok(/P3/.test(HQ.rooms[MOTOR].label) && /MOTOR POOL/.test(HQ.rooms[MOTOR].sub) && /P3/.test(HQ.rooms.garage.why), 'the motor pool is LEVEL P3 under the garage');
    for (const [room, id, wall] of [[MOTOR, 'link_area51_dumb', 'w'], [MOTOR, 'link_dumb_cern', 'e'], [MOTOR, 'link_garage_motorpool', 's'], [RING, 'link_dumb_cern', 'w'], [RING, 'link_cern_backrooms', 'n'], [SEVEN, 'link_cave_dumb', 'n'], ['garage', 'link_garage_motorpool', 'w']]) {
        const d = at(room, id); assert.ok(d && d.wall === wall, room + '/' + id + ' on the ' + wall + ' wall');
        const far = at(d.action.room, d.action.at); assert.ok(far && far.link === d.link && far.action.room === room, room + '/' + id + ' pairs');
    }
    for (const l of [a51, dc, cb, cd, gm]) assert.ok(!(HQ.catalogue[l.leaf] || {}).rank, l.id + ': never a rank leaf');
    assert.ok(!at('garage', 'p2').minClearance && at('garage', 'link_garage_motorpool') && Math.abs(at('garage', 'p2').z - at('garage', 'link_garage_motorpool').z) > 4.4, 'the ramp door and the H-Wing stair share the west wall, lanes apart');
    const line = D.hqWorldRoutes(MOTOR).find(r => r.id === 'bases');
    assert.ok(line && line.legs.some(l => (l.fromRoom === MOTOR && l.toRoom === RING) || (l.fromRoom === RING && l.toRoom === MOTOR)) && line.legs.some(l => l.fromRoom === 'garage' || l.toRoom === 'garage'), 'the bases line runs through the motor pool and up the ramp');
});

test('ONE PIECE: from each way in every part is walked; every inside door is a pair with the same leaf; nothing leaves a site but a links row; the hub has the five spokes', () => {
    const seen = new Set(), queue = [MOTOR, RING];
    while (queue.length) {
        const id = queue.shift(); if (seen.has(id)) continue; seen.add(id);
        for (const d of HQ.rooms[id].doors) {
            const a = d.action || {};
            assert.ok(a.room && HQ.rooms[a.room], id + '/' + d.id + ' leads to a room');
            if (d.entry) { assert.ok(HQ.rooms[a.room].kind === 'bay', id + '/' + d.id + ' is the site’s bay door (siteRooms.entry, 2026-09-18)'); continue; }
            if (d.link) { assert.ok(HQ.links.some(l => l.id === d.link), id + '/' + d.id + ' is a links row'); const far = at(a.room, a.at); assert.ok(far && far.link === d.link, id + '/' + d.id + ': the far end pairs'); if (IDS.includes(a.room)) queue.push(a.room); continue; }
            const other = at(a.room, a.at);
            assert.ok(other && other.action.room === id && other.action.at === d.id, id + '/' + d.id + ' ⇄ ' + a.room + ' is a pair');
            assert.equal(other.leaf, d.leaf, 'the same opening on both sides of ' + d.id);
            const site = PARTS[id][0];
            assert.ok(a.room === 'site_' + site || (PARTS[a.room] && PARTS[a.room][0] === site), id + '/' + d.id + ' stays inside its site (' + a.room + ')');
            if (IDS.includes(a.room)) queue.push(a.room);
        }
    }
    assert.deepEqual(Array.from(seen).sort().join(','), IDS.slice().sort().join(','), 'every part is walked');
    assert.deepEqual(HQ.rooms[SEVEN].doors.map(d => d.id).sort().join(','), 'bunker,clone,dream,link_cave_dumb,motorpool,war', 'the hub’s five spokes + the cave’s blast door');
    /* THE LOOPS (2026-09-18 — the user: "too many rooms that don't connect anywhere else"): every department has TWO ways out */
    for (const id of [DREAM, CLONE, WAR, BUNKER]) assert.equal(HQ.rooms[id].doors.filter(d => !d.link).length, 2, id + ': two ways out (a seam — the dream lab\'s screen into THE ASTRAL REALM — is a links row on top)');
    assert.ok(at(DREAM, 'service').action.room === CLONE && at(CLONE, 'service').action.room === DREAM, 'THE SERVICE CORRIDOR: the ward ⇄ the vats');
    assert.ok(at(WAR, 'stair').action.room === BUNKER && at(WAR, 'stair').y === 3.0 && at(BUNKER, 'stair').action.room === WAR, 'THE PRIVATE STAIR: the war room’s south gallery ⇄ the bunker');
    for (const id of PLANNED) assert.equal(D.hqTerrainInfo(id).genPlan.deadEnds.length, 0, id + ': THE CYCLE RULE — no room with one way in');
});

test('THE HALLS PLAN: BSP rooms inside the shell, every authored room and hall kept open, the door pads joined, L-shaped corridors of right angles, the solid a MASS (refused by the mask, the air and the boom meeting the ceiling), the traced walls in the plan’s sheet with their faces on the boundary, no thicket, no teeth; deterministic and seeded', () => {
    for (const id of PLANNED) {
        const room = HQ.rooms[id], gen = room.terrain.gen, info = D.hqTerrainInfo(id), S = room.shell, P = info.genPlan;
        assert.ok(P && Array.isArray(P.rooms) && Array.isArray(P.corridors) && Array.isArray(P.halls), id + ': the plan record');
        for (const r of gen.rooms || []) {
            assert.ok(P.rooms.some(q => q.authored && q.x === r.x && q.z === r.z && q.w === r.w && q.d === r.d), id + ': authored room ' + r.id + ' kept');
            for (const [dx, dz] of [[0, 0], [0.4, 0.4], [-0.4, -0.4], [0.4, -0.4], [-0.4, 0.4]]) assert.ok(D.hqTerrainMaskAt(info, r.x + dx * r.w, r.z + dz * r.d) > 0.25, id + ': ' + r.id + ' is open to its corners');
        }
        for (const h of gen.halls || []) for (const pt of h.pts) if (Math.abs(pt[0]) < S.w / 2 - 2 && Math.abs(pt[1]) < S.d / 2 - 2) assert.ok(D.hqTerrainMaskAt(info, pt[0], pt[1]) > 1.0, id + ': hall ' + h.id + ' open at ' + pt.join(','));   // a spur's end at the shell wall stands in the door's lane
        if (gen.bsp !== false) assert.ok(P.rooms.filter(r => !r.authored).length >= (id === MOTOR ? 1 : 3), id + ': BSP rooms round the chambers (' + P.rooms.filter(r => !r.authored).length + ')');   // the motor pool's two chambers fill it: a store room or two beside them
        else assert.equal(P.rooms.filter(r => !r.authored).length, 0, id + ': no BSP room');
        for (const r of P.rooms) assert.ok(Math.abs(r.x) + r.w / 2 <= S.w / 2 - 0.5 && Math.abs(r.z) + r.d / 2 <= S.d / 2 - 0.5, id + ': a room inside the shell');
        for (const c of P.corridors) { assert.equal(c.pts.length, 3, id + ': an L of two legs'); const [a, e, b] = c.pts; assert.ok((a[0] === e[0] || a[1] === e[1]) && (e[0] === b[0] || e[1] === b[1]), id + ': right angles'); assert.ok(c.w >= G.halls.corridor[0] - 0.01 && c.w <= G.halls.corridor[1] + 0.01, id + ': corridor width ' + c.w); }
        assert.ok(info.gen.solidMass && info.gen.solidPad > 0 && info.solidTop && info.gen.wallH === S.h, id + ': the mass to the ceiling (' + info.gen.wallH + ' = ' + S.h + ')');
        /* the walker's rule: inside the solid the feet are refused, the air and the boom meet the wall's top */
        let solidCells = 0, ok = 0;
        for (let j = 2; j + 2 < info.nz; j += 3) for (let i = 2; i + 2 < info.nx; i += 3) {
            const x = info.x0 + i * info.res, z = info.z0 + j * info.res; if (Math.abs(x) > S.w / 2 - 1.5 || Math.abs(z) > S.d / 2 - 1.5) continue;
            if (D.hqTerrainMaskAt(info, x, z) > -0.6) continue;
            solidCells++;
            if (D.hqTerrainFeet(info, x, z, null) === null && !D.hqTerrainAir(info, x, z, 1.2) && D.hqTerrainCam(info, x, z, 2.0) && D.hqTerrainSolidTop(info, x, z) >= S.h - 0.01 && D.hqTerrainHeight(info, x, z) < 0.3) ok++;
        }
        assert.ok(solidCells >= 30 && ok === solidCells, id + ': the mass rule holds in ' + ok + ' of ' + solidCells + ' solid cells');
        /* the traced walls: rows in the plan's sheet, each face ON THE BOUNDARY (its inner side open within half a cell, its far side solid) */
        assert.ok(info.planWalls.length >= 20 && info.planWalls.length <= 400, id + ': traced walls ' + info.planWalls.length);
        let onLine = 0;
        for (const w of info.planWalls) {
            assert.equal(w.key, gen.wallKey, id + ': the wall’s sheet'); assert.ok(w.plan && w.top === info.gen.wallH && w.t === G.halls.wallT, id + ': a plan wall row');
            const L = Math.hypot(w.x1 - w.x0, w.z1 - w.z0), nx = -(w.z1 - w.z0) / L, nz = (w.x1 - w.x0) / L, mx = (w.x0 + w.x1) / 2, mz = (w.z0 + w.z1) / 2;
            const sIn = D.hqTerrainMaskAt(info, mx + nx * (w.t / 2 + 0.55), mz + nz * (w.t / 2 + 0.55)), sOut = D.hqTerrainMaskAt(info, mx - nx * (w.t / 2 + 0.55), mz - nz * (w.t / 2 + 0.55));
            if ((sIn > -0.6 && sOut < 0.2) || (sOut > -0.6 && sIn < 0.2)) onLine++;
        }
        assert.ok(onLine / info.planWalls.length > 0.9, id + ': ' + onLine + ' of ' + info.planWalls.length + ' walls stand on the boundary');
        assert.equal((info.thicket || []).length, 0, id + ': no thicket in a bunker');
        /* no single-cell tooth left on the mask (the cleanup) */
        let teeth = 0;
        for (let j = 1; j + 1 < info.nz; j++) for (let i = 1; i + 1 < info.nx; i++) { const k = j * info.nx + i; if (info.forced[k]) continue; const open = info.mask[k - 1] + info.mask[k + 1] + info.mask[k - info.nx] + info.mask[k + info.nx]; if ((!info.mask[k] && open >= 3 && Math.abs(info.x0 + i * info.res) < S.w / 2 - 0.7 && Math.abs(info.z0 + j * info.res) < S.d / 2 - 0.7) || (info.mask[k] && open <= 1)) teeth++; }
        assert.ok(teeth <= 4, id + ': teeth left on the mask: ' + teeth);
    }
    const room = HQ.rooms[DREAM];
    const a = D.hqTerrainCompile(room, DREAM), b = D.hqTerrainCompile(room, DREAM);
    assert.equal(Buffer.from(a.mask).toString('hex'), Buffer.from(b.mask).toString('hex'), 'the same plan twice');
    const copy = JSON.parse(JSON.stringify(Object.assign({}, room, { _terrainInfo: undefined })));
    copy.terrain.gen = Object.assign({}, copy.terrain.gen, { seed: 5 });
    const c = D.hqTerrainCompile(copy, DREAM);
    assert.notEqual(Buffer.from(a.mask).toString('hex'), Buffer.from(c.mask).toString('hex'), 'another seed, another maze');
    for (const r of room.terrain.gen.rooms) assert.ok(D.hqTerrainMaskAt(c, r.x, r.z) > 1, 'the authored rooms survive a reseed');
});

test('THE SOLVER + THE RETURN GUARANTEE + THE PRODUCTION LANDING: in every part every door reaches every other under the walker’s rule, NOTHING TRAPS, every ramp tops out on ground the walker reaches, every landing is 2.4 m in on level ground on nothing, every native, prop and the spawn on open dry ground', () => {
    for (const id of IDS) {
        const room = HQ.rooms[id], S = room.shell, info = D.hqTerrainInfo(id);
        const L = room.doors.map(d => Object.assign({ d }, D.hqTerrainDoorLanding(room, d)));
        assert.ok(L.length >= 1, id + ': doors');
        for (const a of L) {
            const reach = D.hqTerrainReach(info, a.x, a.z);
            assert.ok(reach.size > 400, id + '/' + a.d.id + ': a landing the walker can leave (' + reach.size + ')');
            for (const b of L) assert.ok(reach.has(D.hqTerrainNodeKey(info, b.x, b.z)), id + ': ' + a.d.id + ' → ' + b.d.id + ' unreachable');
        }
        assert.equal(D.hqTerrainTraps(info).length, 0, id + ': a trap');
        const R0 = D.hqTerrainReach(info, L[0].x, L[0].z);
        for (const f of room.terrain.features) {
            if (f.k !== 'ramp') continue;
            const dx = f.x1 - f.x0, dz = f.z1 - f.z0, l = Math.hypot(dx, dz) || 1, px = f.x1 + dx / l * 0.6, pz = f.z1 + dz / l * 0.6;
            assert.ok(R0.has(D.hqTerrainNodeKey(info, px, pz)), id + ': the ramp ' + f.h0 + '→' + f.h1 + ' tops out on ground the walker never reaches');
        }
        for (const door of room.doors) {
            const h = landing(room, door), p = h.player;
            assert.ok(Math.abs(p.x) < S.w / 2 - 0.4 && Math.abs(p.z) < S.d / 2 - 0.4, id + '/' + door.id + ': inside');
            const inward = { n: [0, 1], s: [0, -1], e: [-1, 0], w: [1, 0] }[door.wall];
            const dot = Math.sin(h.cam.yaw) * inward[0] + (-Math.cos(h.cam.yaw)) * inward[1];
            assert.ok(dot < -0.99 || dot > 0.99, id + '/' + door.id + ': faces along the doorway’s normal');
            assert.equal(p.y, sill(room, door), id + '/' + door.id + ': lands at its sill');
            const feet = D.hqTerrainFeet(info, p.x, p.z, null);
            assert.ok(feet != null && Math.abs(feet - p.y) < 0.12 && D.hqTerrainSlope(info, p.x, p.z) < 0.3, id + '/' + door.id + ': the pad is level under the landing');
            for (const q of [...room.props, ...room.npcSpots]) assert.ok(!propBlocks(room, q, p.x, p.z, 0.35), id + '/' + door.id + ': ' + (q.key || q.race) + ' blocks the landing');
            for (const other of room.doors) if (other.id !== door.id && other.wall === door.wall) { const k = (door.wall === 'n' || door.wall === 's') ? 'x' : 'z'; assert.ok(Math.abs(other[k] - door[k]) > 4.4, id + ': ' + door.id + ' and ' + other.id + ' share a lane'); }
        }
        const sp = room.spawn;
        for (const q of [...room.props, ...room.npcSpots]) assert.ok(!propBlocks(room, q, sp.x, sp.z, 0.3), id + ': ' + (q.key || q.race) + ' blocks the spawn');
        assert.ok(D.hqTerrainFeet(info, sp.x, sp.z, null) != null && !D.hqTerrainFluidAt(info, sp.x, sp.z) && D.hqTerrainMaskAt(info, sp.x, sp.z) > 0.3, id + ': the spawn stands on open dry ground');
        for (const n of room.npcSpots) { if (!n.clone) assert.ok(D.AVAILABLE_RACES.includes(n.race), id + ': native race ' + n.race); assert.ok(Array.isArray(n.say) && n.say.length >= 1, id + ': a native says'); assert.ok(D.hqTerrainFeet(info, n.x, n.z, null) != null && !D.hqTerrainFluidAt(info, n.x, n.z) && D.hqTerrainSlope(info, n.x, n.z) < 0.7 && D.hqTerrainMaskAt(info, n.x, n.z) > 0.3, id + ': a native at ' + n.x + ',' + n.z + ' stands in the solid / a hazard'); }
        for (const p of room.props) { assert.ok(HQ.catalogue[p.key], id + ': prop ' + p.key); if (p.wall || p.ceil || (HQ.catalogue[p.key] || {}).ceil) continue; assert.ok(D.hqTerrainFeet(info, p.x, p.z, null) != null && D.hqTerrainMaskAt(info, p.x, p.z) > 0, id + ': ' + p.key + ' at ' + p.x + ',' + p.z + ' stands in the solid'); }
        assert.ok(!room.props.some(p => typeof p.wall === 'string') || id === WAR, id + ': a plan room hangs nothing on the shell (every wall prop free-standing)');
    }
    assert.ok(HQ.rooms[CLONE].npcSpots.some(n => n.clone === true), 'THE OTHER ONE stands between the vats');
});

test('THE ROOMS: the motor pool’s platform is climbed by both stairs and the tram stands lit at its end; the hub’s tower is never walked to, THE DROP is climbed, THE CATWALK’s far tower is reached over the plank, THE PIT is walked down and out, OBSERVATION’s deck is climbed; the ward, the range and the booth; the gantry over the vats; the war room’s galleries; the bunker’s loft, its pool waded, its cellar; the ring walked right round with the gantry climbed', () => {
    const key = (info, x, z) => D.hqTerrainNodeKey(info, x, z), foot = (id, doorId) => { const r = HQ.rooms[id]; return D.hqTerrainDoorLanding(r, at(id, doorId)); };
    const mi = D.hqTerrainInfo(MOTOR), mf = foot(MOTOR, 'bay'), mR = D.hqTerrainReach(mi, mf.x, mf.z);
    assert.ok(mR.has(key(mi, -10, -14)) && Math.abs(mR.get(key(mi, -10, -14)) - 1.0) < 0.2 && mR.has(key(mi, 10, -14)), 'the platform, both ends');
    assert.ok(HQ.rooms[MOTOR].props.some(p => p.key === 'train_car' && p.x > 20) && HQ.rooms[MOTOR].props.filter(p => p.key === 'track_bed').length === 4, 'the tram at the east end of its rails');
    assert.ok(!mR.has(key(mi, -8, 6)) && D.hqTerrainHeight(mi, -8, 6) > 4, 'the signal gantry is the door gun’s');
    const si = D.hqTerrainInfo(SEVEN), sf = foot(SEVEN, 'motorpool'), sR = D.hqTerrainReach(si, sf.x, sf.z);
    assert.ok(!sR.has(key(si, 0, 0)) && D.hqTerrainHeight(si, 0, 0) > 6, 'THE TOWER is never walked to');
    assert.ok(sR.has(key(si, -30, -25)) && Math.abs(sR.get(key(si, -30, -25)) - 3.5) < 0.2, 'THE DROP is climbed');
    assert.ok(sR.has(key(si, 22, -25)) && Math.abs(sR.get(key(si, 22, -25)) - 4.0) < 0.2 && sR.has(key(si, 38, -25)) && Math.abs(sR.get(key(si, 38, -25)) - 4.0) < 0.2, 'both catwalk towers, the far one over the plank');
    assert.ok(sR.has(key(si, -30, 22)) && sR.get(key(si, -30, 22)) < -1.8, 'THE PIT is walked down');
    assert.ok(D.hqTerrainReach(si, -30, 22).has(key(si, sf.x, sf.z)), '… and out (the bowl returns to the door)');
    assert.ok(sR.has(key(si, 37, 20)) && Math.abs(sR.get(key(si, 37, 20)) - 2.4) < 0.2, 'OBSERVATION’s deck');
    const di = D.hqTerrainInfo(DREAM), df = foot(DREAM, 'seven'), dR = D.hqTerrainReach(di, df.x, df.z);
    assert.ok(dR.has(key(di, -10, 0)) && dR.has(key(di, 12, -8)) && dR.has(key(di, 13, 9)) && Math.abs(dR.get(key(di, 13, 9)) - 1.2) < 0.2, 'the ward, the range, the booth up its step');
    assert.ok(HQ.rooms[DREAM].props.some(p => p.key === 'floating_orb') && HQ.rooms[DREAM].props.filter(p => p.key === 'cot').length === 4, 'THE OBJECT and the four cots');
    const ci = D.hqTerrainInfo(CLONE), cf = foot(CLONE, 'seven'), cR = D.hqTerrainReach(ci, cf.x, cf.z);
    assert.ok(cR.has(key(ci, -8, -8)) && Math.abs(cR.get(key(ci, -8, -8)) - 2.8) < 0.2, 'the gantry over the vats');
    assert.ok(HQ.rooms[CLONE].props.filter(p => p.key === 'iso_tank').length === 6 && HQ.rooms[CLONE].props.some(p => p.key === 'door_furnace'), 'six vats and the furnace');
    const wi = D.hqTerrainInfo(WAR), wf = foot(WAR, 'seven'), wR = D.hqTerrainReach(wi, wf.x, wf.z);
    assert.ok(wR.has(key(wi, 0, -13)) && Math.abs(wR.get(key(wi, 0, -13)) - 3.0) < 0.2 && wR.has(key(wi, 0, 13)) && Math.abs(wR.get(key(wi, 0, 13)) - 3.0) < 0.2, 'both galleries are climbed');
    assert.ok(!wR.has(key(wi, 19, 0)) && D.hqTerrainHeight(wi, 19, 0) > 5, 'the projection booth is the door gun’s');
    assert.ok(HQ.rooms[WAR].props.filter(p => p.key === 'dream_screen' && p.wall === 'n').length === 3 && HQ.rooms[WAR].props.filter(p => p.key === 'conference_table').length === 2, 'THE BIG BOARD and the round table');
    const bi = D.hqTerrainInfo(BUNKER), bf = foot(BUNKER, 'seven'), bR = D.hqTerrainReach(bi, bf.x, bf.z);
    assert.ok(bR.has(key(bi, -20, -6)) && Math.abs(bR.get(key(bi, -20, -6)) - 2.6) < 0.2, 'the loft');
    assert.ok(D.hqTerrainFeet(bi, 14, -9, null) != null && D.hqTerrainFluidAt(bi, 14, -9) && D.hqTerrainFluidAt(bi, 14, -9).key === 'water' && bR.has(key(bi, 14, -9)), 'the pool is waded');
    assert.ok(bR.has(key(bi, 15, 9)) && !bR.has(key(bi, 20, 9)) && D.hqTerrainHeight(bi, 20, 9) > 3.5, 'the cellar, and the safe stack the door gun reaches');
    assert.equal(HQ.rooms[BUNKER].props.filter(p => p.key === 'false_window').length, 3, 'three windows that are screens');
    const ri = D.hqTerrainInfo(RING), rf = foot(RING, 'bay'), rR = D.hqTerrainReach(ri, rf.x, rf.z);
    for (const pt of HQ.rooms[RING].terrain.gen.halls[0].pts) assert.ok(rR.has(key(ri, pt[0], pt[1])), 'the ring is walked right round (' + pt.join(',') + ')');
    assert.ok(rR.has(key(ri, 42, -6)) && Math.abs(rR.get(key(ri, 42, -6)) - 3.2) < 0.2, 'the gantry over the detector');
    assert.ok(rR.has(key(ri, 0, -40)) && rR.has(key(ri, -48, 0)), 'the control room and the tunnel’s end');
    assert.ok(HQ.rooms[RING].props.some(p => p.key === 'floating_orb' && Math.abs(p.x - 40) < 1 && p.z === 0), 'THE BEAM on the ring’s east vertex');
});

test('THE PARK RULE + THE LIGHT + THE HARD TAPES: a rail and a tier or ramp in every part; every part lights itself under the cap; one tape per part (seven re-homed, the hundred kept) on a pinnacle the walker never reaches with a door gun shot at its lip; the envelope walked to', heavy, () => {
    const cap = vm.runInContext('typeof HQ_PROP_LIGHT_MAX !== "undefined" ? HQ_PROP_LIGHT_MAX : 10', D);
    for (const id of IDS) {
        const room = HQ.rooms[id], info = D.hqTerrainInfo(id), F = room.terrain.features;
        assert.ok(info.rails.length >= 1, id + ': a rail to grind');
        assert.ok(F.some(f => f.k === 'ramp' || f.k === 'plateau'), id + ': a ramp or a tier to ride');
        assert.ok(F.some(f => f.k === 'ramp' && f.stairs), id + ': a stair (Portal: the exit is up a stair you earn)');
        const lit = room.props.filter(p => (HQ.catalogue[p.key] || {}).light).length;
        assert.ok(lit >= 4 && lit <= cap, id + ': ' + lit + ' lights (the room lights itself, under the cap ' + cap + ')');
    }
    const tapes = D.DOOR_TAPES;
    assert.equal(tapes.length, 100);
    for (const id of IDS) {
        assert.ok([1, 2].includes(tapes.filter(t => t.where === id).length) && (tapes.filter(t => t.where === id).length === 1 || Object.values(HQ.siteRooms.entry || {}).some(e => e.room === id)), id + ': one tape (two on the part that stands for a bypassed board — THE AREAS, 2026-09-18)');
        const rows = HQ.finds.filter(f => f.room === id), tape = rows.find(f => f.kind === 'tape'), pay = rows.find(f => f.kind === 'pay');
        assert.ok(tape && pay, id + ': a tape and an envelope');
        assert.ok(tape.hard === true && tape.y >= 3.5, id + ': the tape is the door gun’s (' + tape.y + ' m)');
        assert.ok(!pay.hard, id + ': the envelope is walked to');
        const pin = HQ.findSpots[id];
        assert.ok(pin && pin.tape && tape.x === pin.tape.x && tape.z === pin.tape.z, id + ': the tape stands on its pin');
        const info = D.hqTerrainInfo(id), L0 = D.hqTerrainDoorLanding(HQ.rooms[id], HQ.rooms[id].doors[0]), reach = D.hqTerrainReach(info, L0.x, L0.z);
        assert.ok(!reach.has(D.hqTerrainNodeKey(info, tape.x, tape.z)), id + ': the walker never reaches it');
        assert.ok(D.hqFindHardReachTerrain(tape, { terrain: info, reach, S: HQ.rooms[id].shell }).ok, id + ': the door gun has a shot at its lip');
    }
    for (const site of ['prebuilt_cern', 'prebuilt_antarctica', 'prebuilt_northpole', 'prebuilt_singularity', 'prebuilt_mars', 'prebuilt_saturn', 'prebuilt_moon']) assert.equal(tapes.filter(t => t.where === 'site_' + site).length, 1, site + ' keeps one');   // THE LEY LINES (2026-09-18): Giza's board is bypassed — its tape is on the plateau (hq-leylines)
    assert.equal(tapes.filter(t => t.where === 'site_prebuilt_dumb').length, 1, 'the base keeps one on the board (THE BLAST DOOR went down the sewers, 2026-09-18)');
    assert.ok(tapes.some(t => t.where === MOTOR && t.title === 'THE TRAM, 00:00') && tapes.some(t => t.where === SEVEN && t.title === 'SUB-LEVEL 7') && tapes.some(t => t.where === WAR && t.title === 'THE HEXAGON') && tapes.some(t => t.where === BUNKER && t.title === 'EARTHRISE') && tapes.some(t => t.where === RING && t.title === 'BEAM ON'), 'the titles');
});

test('the shell helper, the looks, the generator table and the source sites: hqBunkerShell is one function (closed, the pack, no strips, the red lamp, a haze, the D.U.M.B. look); four looks; HQ_TERRAIN_GEN.halls; the renderer draws info.planWalls through the one wall path with a keyed material cache and hangs the strip lights; check-terrain solves all seven', heavy, () => {
    const S = D.hqBunkerShell({ w: 10, d: 12 });
    assert.ok(!S.open && S.w === 10 && S.d === 12 && S.strips === false && S.lights.length === 0 && S.mood.lamp === 0xff3838 && S.fog.density > 0 && S.look === D.HQ_ROOM_LOOKS.dumb && S.ceilTile === 1.75 && /^urban:/.test(S.wall), 'the bunker shell');
    const O = D.hqBunkerShell({ w: 4, d: 4, look: D.HQ_ROOM_LOOKS.cern, floor: 'urban:TileMarble1a' });
    assert.ok(O.look === D.HQ_ROOM_LOOKS.cern && O.floor === 'urban:TileMarble1a' && O.wall === S.wall, 'overrides');
    for (const k of ['dumb', 'warroom', 'bunker', 'cern']) { const L = D.HQ_ROOM_LOOKS[k]; assert.ok(L && L.name && L.retro && L.cin && typeof L.bloom === 'number', 'look ' + k); }
    const H = G.halls;
    assert.ok(H && H.leafMin > 0 && H.leafMax > H.leafMin && H.roomMin > 0 && H.corridor.length === 2 && H.wallT > 0 && H.simplify > 0 && H.solidPad > 0 && H.minOpen < G.minOpen && H.minDegree === 2, 'the halls row');
    for (const s of ["} else if (gen.kind === 'halls') {", 'function _hqTTraceMaskWalls(info, mask, o) {', 'function _hqTRdp(pts, i0, i1, tol, out) {', "|| gen.kind === 'halls' || gen.kind === 'ley';", 'info.planWalls = _hqTTraceMaskWalls(info, mask, {', "if (gen.kind === 'halls' || gen.kind === 'ley') for (let pass = 0; pass < 2; pass++) {"])
        assert.ok(fs.readFileSync(__dirname + '/data.js', 'utf8').includes(s), 'data.js: ' + s);
    for (const s of ['var drawWall = function (w) {', 'info.walls.forEach(drawWall);', '(info.planWalls || []).forEach(drawWall);', 'function _hqBuildHallsLights(room, info, G, TM, rng) {', "if (info.genPlan && info.gen && info.gen.kind === 'halls') { try { _hqBuildHallsLights(room, info, G, TM, rng); }", 'var keyedMat = function (key) {', "if (w.plan) { m._ew_hqPart = 'wall'; m._ew_hqPlanWall = true; }"])
        assert.ok(renderer.includes(s), 'three-renderer.js: ' + s);
    const { spawnSync } = require('node:child_process');
    const r = spawnSync(process.execPath, ['check-terrain.js', '--json', ...IDS], { cwd: __dirname, encoding: 'utf8' });
    assert.equal(r.status, 0, r.stderr);
    const rows = JSON.parse(r.stdout);
    assert.equal(rows.length, 7);
    for (const row of rows) { assert.equal(row.unreached.length, 0, row.id + ': every door reached'); assert.equal(row.traps.length, 0, row.id + ': nothing traps'); if (row.plan) assert.ok(row.plan.kind === 'halls' && row.plan.planWalls >= 20, row.id + ': the plan'); }
});
