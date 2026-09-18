// hq-camelot.test.js — CAMELOT CASTLE (2026-09-18 — THE COMPLEX CANDIDATES #2:
// "the exterior (moats, gardens, the curtain wall) and an interior of several
// floors; possibly a castle in the sky"): five parts on Room i on THE CAVE /
// THE WOODS blueprint, three families in one complex — THE OUTER WARD (open
// under Camelot's own night, a `rooms` plan: the moat, the drawbridge, the
// gatehouse, the curtain wall whose top is THE PARAPET WALK, the bailey, THE
// KEEP TOWER = the tape), THE GREAT HALL (prefab, no plan: the round table,
// the dais, THE MINSTRELS' GALLERY, THE LOFT = the tape), THE KEEP (`halls`:
// the guardroom, THE GREAT STAIR to THE SOLAR and THE BATTLEMENTS, THE TOWER
// TOP = the tape, the sky's door at 9 m), MERLIN'S UNDERCROFT (`cave` in
// brick: the cistern, the gaoler's ledge, THE ORB, THE OSSUARY SHELF = the
// tape) and THE CASTLE IN THE SKY (open above the clouds: three floating
// flights, THE SPIRE = the tape, THE SKY BRIDGE onto the stairway to heaven).
// The board room is BYPASSED (siteRooms.entry): the portcullis lands you in the
// ward; the four seams that stood on the board moved onto the parts.
// Guards: the sheet, THE ENTRY + the seams, one piece + two ways out of every
// part, the plans, THE SOLVER + THE RETURN GUARANTEE + the production landing,
// the rooms (tiers climbed, tapes not), THE PARK RULE + the lights + the five
// hard tapes, the shell helper, the landmark, the four procs and the source sites.
'use strict';
const test = require('node:test');
const { heavy } = require('./test-heavy.js');   // 2026-09-18: the heavy geometry proofs run on `npm run test:full` / in CI
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { loadGameData } = require('./load-data');
const D = loadGameData(), HQ = D.DOOR_HQ;
const SITE = 'prebuilt_camelot', BOARD = 'site_prebuilt_camelot';
const WARD = BOARD + '_ward', HALL = BOARD + '_hall', KEEP = BOARD + '_keep', DUNGEON = BOARD + '_dungeon', SKY = BOARD + '_sky';
const PARTS = { [WARD]: 'ward', [HALL]: 'hall', [KEEP]: 'keep', [DUNGEON]: 'dungeon', [SKY]: 'sky' };
const IDS = Object.keys(PARTS);
const renderer = fs.readFileSync(__dirname + '/three-renderer.js', 'utf8');
const data = fs.readFileSync(__dirname + '/data.js', 'utf8');
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
const reachFrom = (id, doorId) => { const room = HQ.rooms[id], info = D.hqTerrainInfo(id), L = D.hqTerrainDoorLanding(room, at(id, doorId)); return [info, D.hqTerrainReach(info, L.x, L.z)]; };
const key = (info, x, z) => D.hqTerrainNodeKey(info, x, z);

test('the sheet: five parts on Room i — site + part, none numbered, every one a terrain room; the ward and the sky OPEN under their own skies (hqCastleShell), the hall / the keep / the undercroft closed and lit by their own fire; three families (rooms · none · halls · cave · rooms); the looks; the register lists the site once and its complex is six rooms', heavy, () => {
    for (const id of IDS) {
        const r = HQ.rooms[id];
        assert.ok(r && r.kind === 'box' && r.site === SITE && r.part === PARTS[id], id + ': a box room wearing site + part');
        assert.equal(D.hqComplexRoomId(SITE, PARTS[id]), id);
        assert.equal(r.roomNo, undefined, id + ' wears no number');
        assert.equal(D.hqRoomNo(id), HQ.thresholds[SITE].roomNo, id + ': hqRoomNo reads i through site');
        assert.equal(D.hqRoomSite(id), SITE, id + ' is WILD');
        assert.ok(/^CAMELOT · /.test(r.label) && r.sub && r.spawn && Array.isArray(r.lines) && r.lines.length >= 3, id + ': plate, spawn, lines');
        assert.ok(r.terrain && !r.cave && D.hqTerrainInfo(id), id + ': a terrain room');
        assert.ok(r.shell.look && r.shell.look.name && r.shell.strips === false && r.shell.mood && Array.isArray(r.shell.lights) && r.shell.lights.length === 0, id + ': a look, no strips, no fluorescents, its own mood');
        assert.ok(!r.doors.some(d => (HQ.catalogue[d.leaf] || {}).rank), id + ': no rank leaf');
        assert.ok(r.doors.length >= 2, id + ': two ways out (the cycle rule at the complex’s scale)');
    }
    assert.equal(HQ.rooms[WARD].terrain.gen.kind, 'rooms'); assert.equal(HQ.rooms[HALL].terrain.gen, undefined, 'the hall is prefab — no plan');
    assert.equal(HQ.rooms[KEEP].terrain.gen.kind, 'halls'); assert.equal(HQ.rooms[DUNGEON].terrain.gen.kind, 'cave'); assert.equal(HQ.rooms[SKY].terrain.gen.kind, 'rooms');
    assert.equal(HQ.rooms[SKY].terrain.gen.thicket, false, 'no trees in the sky');
    for (const id of [HALL, KEEP, DUNGEON]) { const S = HQ.rooms[id].shell; assert.ok(!S.open && S.fog && S.fog.density > 0 && S.ceilTile === 1.75, id + ': closed, a haze'); }
    const W = HQ.rooms[WARD].shell, meta = D.EW_MAP_META.find(m => m.id === SITE).env;
    assert.ok(W.open && W.edge === 'open' && W.sky && W.sky.night === 1 && W.forest && W.forest.depth > 0, 'the ward: open, Camelot’s night, a treeline past the field');
    assert.ok(W.sky.tint === meta.tint && W.sky.tintAmt === meta.tintAmt && W.sky.stars === meta.stars && W.sky.nebula === meta.nebula && W.sky.fog.color === meta.fog.color && W.sky.scenery === meta.scenery, 'the ward’s sky is the map row’s (edit both)');
    assert.ok(W.sky.fog.density > 0, 'a fog per metre');
    const K = HQ.rooms[SKY].shell;
    assert.ok(K.open && K.sky.night === 0 && !K.forest && K.sky.scenery === 'islands' && K.floor === 'cloud_2', 'the castle in the sky: dawn above the clouds, cloud underfoot, no treeline, the floating islands');
    assert.equal(HQ.rooms[WARD].shell.look, D.HQ_ROOM_LOOKS.camelot); assert.equal(HQ.rooms[HALL].shell.look, D.HQ_ROOM_LOOKS.greathall); assert.equal(HQ.rooms[KEEP].shell.look, D.HQ_ROOM_LOOKS.keep);
    assert.equal(HQ.rooms[DUNGEON].shell.look, D.HQ_ROOM_LOOKS.undercroft); assert.equal(HQ.rooms[SKY].shell.look, D.HQ_ROOM_LOOKS.skycastle);
    const reg = D.hqRoomRegister();
    assert.equal(reg.filter(r => r.mapId === SITE).length, 1, 'the register lists the site once');
    assert.ok(!reg.some(r => IDS.includes(r.id) || IDS.includes(r.room)), 'no part is a register entry');
    assert.equal(D.hqSiteComplex(SITE).length, 6, 'the board room and five parts');
});

test('THE WEENIES: THE CASTLE IN THE SKY hangs on the ward’s sky over the north-north-east, a third of the way up (a `skycastle` landmark the renderer builds off the castle); Camelot itself stands on the sky castle’s horizon below, facing back; THE KEEP TOWER stands beside the hall door at the end of the avenue; THE ORB is the one lit thing in the undercroft', () => {
    const W = HQ.rooms[WARD].shell.sky.landmarks, K = HQ.rooms[SKY].shell.sky.landmarks;
    assert.ok(W.length === 1 && W[0].kind === 'skycastle' && W[0].id === SITE && W[0].deg > 0 && W[0].deg < 60 && W[0].y >= 0.25, 'the sky castle over the ward');
    assert.ok(K.length === 1 && K[0].kind === 'castle' && K[0].id === SITE && K[0].deg === 180 && K[0].y < 0, 'Camelot below the sky castle');
    assert.ok(/        skycastle: function \(U, o, rng\) \{[\s\S]*?_hqLandmarkBuilders\.castle\(U, o, rng\)[\s\S]*?SphereGeometry/.test(renderer), 'three-renderer.js builds the sky castle off the castle builder, on a cloud');
    const tower = HQ.rooms[WARD].terrain.features.find(f => f.k === 'plateau' && f.r && f.h === 9), hall = at(WARD, 'hall');
    assert.ok(tower && Math.hypot(tower.x - hall.x, tower.z - (-HQ.rooms[WARD].shell.d / 2)) < 16, 'the keep tower beside the hall door');
    assert.ok(HQ.rooms[WARD].props.filter(p => p.key === 'brazier' && Math.hypot(p.x - tower.x, p.z - tower.z) < 5).length >= 2, 'lit');
    assert.ok(HQ.rooms[DUNGEON].props.some(p => p.key === 'floating_orb'), 'the orb');
});

test('THE ENTRY + THE SEAMS: the board room is bypassed — the portcullis lands you in THE OUTER WARD (the bay door on its south wall is the board’s egress); the spring’s pool surfaces on the moat’s bank, the wardrobe’s snow is in the trees outside the moat, the well stands free in the bailey, the Lodge opens off the great hall, THE SKY BRIDGE joins the castle in the sky to the stairway to heaven; the board carries no link door; the gatehouse arch on the board’s freed lane', () => {
    const eg = at(BOARD, 'egress'), bay = at(WARD, 'bay');
    assert.ok(D.hqSiteEntryOf(SITE) && D.hqSiteEntryOf(SITE).room === WARD);
    assert.ok(bay && bay.entry === SITE && bay.wall === 's' && bay.x === 0 && bay.leaf === eg.leaf && bay.label === eg.label && bay.action.room === eg.action.room && bay.action.at === eg.action.at, 'the bay door is the board’s egress');
    assert.equal(HQ.rooms[WARD].doors.filter(d => d.id === 'bay').length, 1, 'once');
    assert.equal(D.hqSiteEntry(BOARD, 'egress').at, 'bay'); assert.equal(D.hqSiteEntry(BOARD, 'crossing').at, 'bay'); assert.equal(D.hqSiteEntry(BOARD, 'hall').at, 'hall', 'an `at` the part has is kept');
    assert.ok(!HQ.rooms[BOARD].doors.some(d => d.link), 'the bypassed board carries no link door');
    const gh = at(BOARD, 'gatehouse');
    assert.ok(gh && gh.wall === 'n' && gh.x === -10 && gh.leaf === 'leaf_portcullis' && gh.action.room === WARD && gh.action.at === 'bay', 'the gatehouse arch walks into the ward');
    const ends = {
        fairy_camelot:   ['b', WARD, 'free', null, 'pool'],
        haunted_camelot: ['b', WARD, 'w', 28, 'wardrobe'],
        well_camelot:    ['a', WARD, 'free', null, 'well'],
        skycastle_stair: ['a', SKY, 'e', 8, null],
    };
    for (const [id, [side, room, wall, along, way]] of Object.entries(ends)) {
        const l = HQ.links.find(x => x.id === id);
        assert.ok(l && D.hqLinkLive(l), id + ' is live');
        assert.equal(D.hqLinkRoom(l[side]), room, id + '/' + side + ' resolves to ' + room);
        const d = at(room, 'link_' + id);
        assert.ok(d && d.wall === wall, id + ': the generated door on the ' + wall + ' wall');
        if (wall !== 'free') assert.equal(d[(wall === 'n' || wall === 's') ? 'x' : 'z'], along);
        if (way) assert.equal(d.way, way, id + ' wears the ' + way); else assert.ok(d.leaf, id + ' wears a leaf');
        const far = D.hqLinkRoom(l[side === 'a' ? 'b' : 'a']), fd = at(far, 'link_' + id);
        assert.ok(fd && fd.action.room === room && d.action.room === far, id + ': the pair');
    }
    assert.equal(at(SKY, 'link_skycastle_stair').leaf, 'leaf_frame_only', 'the sky bridge is a plain frame');
    const sb = HQ.links.find(l => l.id === 'skycastle_stair');
    assert.ok(sb.route === 'divine' && sb.b.site === 'prebuilt_heaven' && sb.b.part === 'stair' && sb.b.wall === 'w', 'onto the stairway’s west wall, on the divine line');
    const divine = D.hqWorldRoutes(SKY).find(r => r.id === 'divine');
    assert.ok(divine && divine.stations.some(s => s.site === SITE) && divine.legs.some(l => l.fromRoom === SKY || l.toRoom === SKY), 'the divine line calls at Camelot');
    assert.ok(D.hqWorldRoutes('foyer').find(r => r.id === 'woods').stations.some(s => s.site === SITE), 'the woods line still calls at Camelot (the spring)');
    assert.ok(!D.hqWorldRoutes('foyer').find(r => r.id === 'ley').stations.some(s => s.site === SITE), 'the ley line no longer calls at Camelot (the Lodge left for the ranch, 2026-09-18)');
    assert.ok(D.hqWorldRoutes('foyer').find(r => r.id === 'kingdom').stations.some(s => s.site === SITE), 'CAMELOT KINGDOM calls at Camelot (the North Pole)');
});

test('ONE PIECE: from the bay door every part is walked; every inside door is a pair with the same leaf; nothing leaves the site but a links row or the bay; the complex is a cycle (ward → hall → keep → ward; keep ⇄ undercroft ⇄ ward; keep ⇄ sky)', () => {
    const seen = new Set(), queue = [WARD];
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
    assert.equal(Array.from(seen).sort().join(','), IDS.slice().sort().join(','), 'every part is walked');
    assert.ok(at(WARD, 'hall').action.room === HALL && at(HALL, 'keep').action.room === KEEP && at(KEEP, 'ward').action.room === WARD, 'the loop');
    assert.ok(at(KEEP, 'dungeon').action.room === DUNGEON && at(DUNGEON, 'postern').action.room === WARD, 'the undercroft’s two ways');
    assert.ok(at(KEEP, 'sky').action.room === SKY && at(KEEP, 'sky').y === 9 && at(KEEP, 'sky').leaf === null && at(SKY, 'keep').leaf === null, 'the sky’s door stands on the battlements, an opening');
    for (const id of IDS) for (const d of HQ.rooms[id].doors) for (const o of HQ.rooms[id].doors) if (o !== d && o.wall === d.wall && d.wall !== 'free') assert.ok(Math.abs((d.x != null ? d.x : d.z) - (o.x != null ? o.x : o.z)) >= 4.4, id + ': ' + d.id + ' and ' + o.id + ' share a lane');
});

test('THE PLANS: the ward’s bailey and the sky’s deck are clearings with their authored pieces kept open (the moat, the drawbridge, the walls, the paths); the keep’s two chambers kept open, BSP rooms round them, THE CYCLE RULE, the mass to the ceiling, traced walls; the undercroft a brick cave', () => {
    const wi = D.hqTerrainInfo(WARD);
    assert.equal(wi.gen.kind, 'rooms'); assert.ok((wi.thicket || []).length >= 40, 'the orchard and the forest: the thicket (' + (wi.thicket || []).length + ')');
    for (const pt of [[0, 30], [0, 14], [0, 0], [0, -30], [-22, -30], [-14, -14], [-44, 0], [-28, -12], [28, -12]]) assert.ok(D.hqTerrainMaskAt(wi, pt[0], pt[1]) > 0.3, 'the ward open at ' + pt.join(','));
    assert.ok(wi.fluids.length === 1 && wi.fluids[0].key === 'deep_water', 'the moat is deep water');
    assert.equal(wi.walls.filter(w => w.h === 5.5).length, 4, 'the curtain wall’s four runs');
    const ki = D.hqTerrainInfo(KEEP), P = ki.genPlan, gen = HQ.rooms[KEEP].terrain.gen;
    for (const r of gen.rooms) for (const [dx, dz] of [[0, 0], [0.4, 0.4], [-0.4, -0.4], [0.4, -0.4], [-0.4, 0.4]]) assert.ok(D.hqTerrainMaskAt(ki, r.x + dx * r.w, r.z + dz * r.d) > 0.25, KEEP + ': ' + r.id + ' is open to its corners');
    assert.ok(P.rooms.filter(r => !r.authored).length >= 3, 'BSP rooms round the chambers (' + P.rooms.filter(r => !r.authored).length + ')');
    assert.equal(P.deadEnds.length, 0, 'THE CYCLE RULE');
    assert.ok(ki.gen.solidMass && ki.solidTop && ki.gen.wallH === HQ.rooms[KEEP].shell.h && ki.planWalls.length >= 20, 'the keep’s mass to the ceiling, traced walls');
    const di = D.hqTerrainInfo(DUNGEON);
    assert.ok(di.gen.kind === 'cave' && di.gen.wallH === HQ.rooms[DUNGEON].shell.h && HQ.rooms[DUNGEON].terrain.cliff === 'bricks_2', 'the undercroft: a cave bricked to the ceiling');
    const si = D.hqTerrainInfo(SKY);
    assert.ok(si.gen.kind === 'rooms' && (si.thicket || []).length === 0, 'no trees in the sky');
    for (const id of IDS) { const info = D.hqTerrainInfo(id); if (info.gen) assert.ok(info.gen.open >= (D.HQ_TERRAIN_GEN[info.gen.kind].minOpen || D.HQ_TERRAIN_GEN.minOpen), id + ': open share ' + info.gen.open); }
});

test('THE SOLVER + THE RETURN GUARANTEE + THE PRODUCTION LANDING: every door reaches every other under the walker’s rule, nothing traps, every ramp tops out on reached ground, every landing is inside, level, faces the doorway and stands clear of every prop and native; natives and props on walkable ground; a plan room hangs nothing on the shell', () => {
    for (const id of IDS) {
        const room = HQ.rooms[id], S = room.shell, info = D.hqTerrainInfo(id);
        const L = room.doors.map(d => Object.assign({ d }, D.hqTerrainDoorLanding(room, d)));
        for (const a of L) {
            const reach = D.hqTerrainReach(info, a.x, a.z);
            assert.ok(reach.size > 400, id + '/' + a.d.id + ': a landing the walker can leave');
            for (const b of L) assert.ok(reach.has(key(info, b.x, b.z)), id + ': ' + a.d.id + ' → ' + b.d.id + ' unreachable');
        }
        assert.equal(D.hqTerrainTraps(info).length, 0, id + ': a trap');
        const R0 = D.hqTerrainReach(info, L[0].x, L[0].z);
        for (const f of room.terrain.features) {
            if (f.k !== 'ramp') continue;
            const dx = f.x1 - f.x0, dz = f.z1 - f.z0, l = Math.hypot(dx, dz) || 1;
            assert.ok(R0.has(key(info, f.x1 + dx / l * 0.6, f.z1 + dz / l * 0.6)), id + ': the ramp ' + f.h0 + '→' + f.h1 + ' tops out on ground the walker never reaches');
            if (f.stairs) assert.ok(l >= 2.2 * Math.abs(f.h1 - f.h0) - 0.05, id + ': the stair ' + f.h0 + '→' + f.h1 + ' is steeper than a tread allows (L ' + l.toFixed(1) + ')');
        }
        for (const door of room.doors) {
            const h = landing(room, door), p = h.player;
            if (door.wall !== 'free') {
                assert.ok(Math.abs(p.x) < S.w / 2 - 0.4 && Math.abs(p.z) < S.d / 2 - 0.4, id + '/' + door.id + ': inside');
                const inward = { n: [0, 1], s: [0, -1], e: [-1, 0], w: [1, 0] }[door.wall];
                const dot = Math.sin(h.cam.yaw) * inward[0] + (-Math.cos(h.cam.yaw)) * inward[1];
                assert.ok(dot < -0.99 || dot > 0.99, id + '/' + door.id + ': faces along the doorway’s normal');
            }
            const feet = D.hqTerrainFeet(info, p.x, p.z, null);
            assert.ok(feet != null && Math.abs(feet - p.y) < 0.12 && D.hqTerrainSlope(info, p.x, p.z) < 0.3, id + '/' + door.id + ': the pad is level under the landing');
            for (const q of [...room.props, ...room.npcSpots]) assert.ok(!propBlocks(room, q, p.x, p.z, 0.35), id + '/' + door.id + ': ' + (q.key || q.race) + ' blocks the landing');
        }
        const sp = room.spawn;
        for (const q of [...room.props, ...room.npcSpots]) assert.ok(!propBlocks(room, q, sp.x, sp.z, 0.3), id + ': ' + (q.key || q.race) + ' blocks the spawn');
        assert.ok(D.hqTerrainFeet(info, sp.x, sp.z, null) != null && D.hqTerrainMaskAt(info, sp.x, sp.z) > 0.3, id + ': the spawn stands on open ground');
        for (const n of room.npcSpots) { assert.ok(D.AVAILABLE_RACES.includes(n.race), id + ': native race ' + n.race); assert.ok(Array.isArray(n.say) && n.say.length >= 1, id + ': a native says'); assert.ok(D.hqTerrainFeet(info, n.x, n.z, null) != null && D.hqTerrainMaskAt(info, n.x, n.z) > 0.2, id + ': native on open ground at ' + n.x + ',' + n.z); }
        for (const p of room.props) { assert.ok(HQ.catalogue[p.key], id + ': prop ' + p.key); if (p.wall || p.ceil || (HQ.catalogue[p.key] || {}).ceil) continue; assert.ok(D.hqTerrainFeet(info, p.x, p.z, null) != null, id + ': prop ' + p.key + ' on no ground at ' + p.x + ',' + p.z); }
        if (room.terrain.gen) assert.ok(!room.props.some(p => typeof p.wall === 'string'), id + ': a plan room hangs nothing on the shell');
    }
});

test('THE ROOMS: the parapet walk — the wall’s top is a floor once the terraces reach it, both long walls walked; the drawbridge is the way in and the moat is never entered; the towers, the loft, the tower top, the ossuary and the spire are the door gun’s; the gallery, the dais, the solar, the battlements, the ledge, the workshop and the three floating tiers are climbed; the cistern is waded', () => {
    const [wi, wR] = reachFrom(WARD, 'bay');
    for (const [x, z] of [[-28, -12], [28, -12]]) assert.ok(wR.has(key(wi, x, z)) && Math.abs(wR.get(key(wi, x, z)) - 5.5) < 0.2, 'the terrace at ' + x + ' is climbed');
    for (const [x, z] of [[-31, -25], [-31, -2], [-31, -38], [31, -30], [31, -2], [-20, 8], [20, 8], [10, 8]]) assert.ok(wR.has(key(wi, x, z)) && wR.get(key(wi, x, z)) > 5.0 && wR.get(key(wi, x, z)) < 6.5, 'THE PARAPET WALK at ' + x + ',' + z + ' (' + (wR.get(key(wi, x, z)) || 'NO') + ')');
    assert.ok(!wR.has(key(wi, -5.6, 8)) && !wR.has(key(wi, 5.6, 8)), 'the gatehouse towers are never climbed');
    assert.ok(wR.has(key(wi, 0, 14)) && Math.abs(wR.get(key(wi, 0, 14)) - 0.3) < 0.15, 'the drawbridge is walked');
    assert.equal(D.hqTerrainFeet(wi, 20, 14, null), null, 'the moat is never entered');
    assert.ok(!wR.has(key(wi, 12, -33)) && D.hqTerrainHeight(wi, 12, -33) > 8.5, 'THE KEEP TOWER is the door gun’s');
    assert.ok(wR.has(key(wi, -14, -14)) && wR.has(key(wi, 8, -18)) && wR.has(key(wi, -44, -10)) && wR.has(key(wi, -44, 28)) && wR.has(key(wi, -44, -30)), 'the sword’s knoll, the well, the bank, the snow, the sally port');
    const [hi, hR] = reachFrom(HALL, 'ward');
    assert.ok(hR.has(key(hi, 10.5, 2)) && Math.abs(hR.get(key(hi, 10.5, 2)) - 3.5) < 0.2, 'THE MINSTRELS’ GALLERY is climbed');
    assert.ok(hR.has(key(hi, 0, -22)) && Math.abs(hR.get(key(hi, 0, -22)) - 0.9) < 0.2, 'THE DAIS is climbed');
    assert.ok(!hR.has(key(hi, 10.5, -9)) && D.hqTerrainHeight(hi, 10.5, -9) > 7.5, 'THE LOFT is the door gun’s');
    assert.ok(HQ.rooms[HALL].props.some(p => p.key === 'round_table' && p.x === 0) && HQ.rooms[HALL].props.some(p => p.key === 'royal_throne') && HQ.rooms[HALL].props.filter(p => p.key === 'banner').length === 4, 'the round table, the throne, the banners');
    const [ki, kR] = reachFrom(KEEP, 'ward');
    assert.ok(kR.has(key(ki, -10, -13)) && Math.abs(kR.get(key(ki, -10, -13)) - 4.5) < 0.2, 'THE SOLAR is climbed');
    assert.ok(kR.has(key(ki, 10, -16)) && Math.abs(kR.get(key(ki, 10, -16)) - 9) < 0.2 && kR.has(key(ki, 10, -20)), 'THE BATTLEMENTS are climbed, to the sky’s door');
    assert.ok(!kR.has(key(ki, 15.4, -19)) && D.hqTerrainHeight(ki, 15.4, -19) > 12, 'THE TOWER TOP is the door gun’s');
    assert.equal(HQ.rooms[KEEP].props.filter(p => p.key === 'armour_stand').length, 3, 'the armour');
    const [di, dR] = reachFrom(DUNGEON, 'keep');
    assert.ok(dR.has(key(di, 14, -8)) && Math.abs(dR.get(key(di, 14, -8)) - 0.4) < 0.2, 'THE WORKSHOP’s floor is climbed');
    assert.ok(dR.has(key(di, -14, 10)) && Math.abs(dR.get(key(di, -14, 10)) - 1.6) < 0.2, 'THE GAOLER’S LEDGE is climbed');
    assert.ok(dR.has(key(di, 0, 6)) && dR.get(key(di, 0, 6)) < -0.5, 'THE CISTERN is waded');
    assert.ok(!dR.has(key(di, -14, -10)) && D.hqTerrainHeight(di, -14, -10) > 3.8, 'THE OSSUARY SHELF is the door gun’s');
    const [si, sR] = reachFrom(SKY, 'keep');
    for (const [x, z, h] of [[0, 8, 3], [-12, -4, 6.5], [10, -12, 10]]) assert.ok(sR.has(key(si, x, z)) && Math.abs(sR.get(key(si, x, z)) - h) < 0.2, 'the floating tier at ' + h + ' m is climbed');
    assert.ok(!sR.has(key(si, 14, -16)) && D.hqTerrainHeight(si, 14, -16) > 13.5, 'THE SPIRE is the door gun’s');
    assert.ok(sR.has(key(si, 30, 8)), 'the sky bridge’s frame is reached from the deck');
    const flights = HQ.rooms[SKY].terrain.features.filter(f => f.k === 'ramp' && f.stairs);
    assert.ok(flights.length === 3 && flights.every(f => f.float === true), 'three floating flights');
    assert.ok(HQ.rooms[SKY].terrain.features.filter(f => f.k === 'plateau' && f.float).length >= 4 && si.floats.length === 7, 'the court, the bailey, the keep and the spire float (' + si.floats.length + ' floats)');
    assert.equal(HQ.rooms[SKY].props.filter(p => p.key === 'demon_statue').length, 2, 'the gargoyles');
});

test('THE PARK RULE + THE LIGHT + THE HARD TAPES: a rail and a stair and a tier in every part; every part lights itself under the cap; one tape per part (five re-homed, the hundred kept, every donor keeps one) on a top the walker never reaches with a shot from reached ground; the board keeps THE ROUND TABLE; every part’s envelope is guarded', heavy, () => {
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
        assert.ok(tape && pay && pay.guard === true, id + ': a tape and a guarded envelope');
        assert.ok(tape.hard === true && tape.y >= 3.5, id + ': the tape is the door gun’s (' + tape.y + ' m)');
        const pin = HQ.findSpots[id];
        assert.ok(pin && pin.tape && tape.x === pin.tape.x && tape.z === pin.tape.z, id + ': the tape stands on its pin');
        const info = D.hqTerrainInfo(id), L0 = D.hqTerrainDoorLanding(HQ.rooms[id], HQ.rooms[id].doors[0]), reach = D.hqTerrainReach(info, L0.x, L0.z);
        assert.ok(!reach.has(key(info, tape.x, tape.z)), id + ': the walker never reaches it');
        assert.ok(D.hqFindHardReachTerrain(tape, { terrain: info, reach, S: HQ.rooms[id].shell }).ok, id + ': the door gun has a shot at its lip');
    }
    assert.equal(tapes.filter(t => t.where === BOARD).length, 1, 'THE ROUND TABLE stays on the board');
    for (const where of ['site_prebuilt_backrooms', 'site_prebuilt_atlantis_abyss', 'site_prebuilt_revenge', 'site_prebuilt_derelict', 'site_prebuilt_lookingglass']) assert.equal(tapes.filter(t => t.where === where).length, 1, where + ' gave its second tape');   // THE DEEP (2026-09-18): Atlantis's board is bypassed — its one tape sits in THE ABYSS
    for (const [id, title] of [[WARD, 'THE DRAWBRIDGE, DUSK'], [HALL, 'THE THIRTEENTH CHAIR'], [KEEP, 'THE WATCH'], [DUNGEON, 'MERLIN, BACKWARDS'], [SKY, 'THE CASTLE IN THE SKY']]) assert.ok(tapes.some(t => t.where === id && t.title === title), title);
});

test('the shell helper, the looks, the four procs, the landmark and the source sites; check-terrain solves all five', heavy, () => {
    const S = D.hqCastleShell({ w: 10, d: 12 }), K = D.hqCastleShell({ sky: true, w: 10, d: 12 });
    assert.ok(S.open && S.edge === 'open' && S.w === 10 && S.d === 12 && S.sky.night === 1 && S.sky.landmarks[0].kind === 'skycastle' && S.forest && S.lights.length === 0 && S.look === D.HQ_ROOM_LOOKS.camelot && S.mood.night === 1, 'hqCastleShell (the ward)');
    assert.ok(K.open && K.sky.night === 0 && K.sky.landmarks[0].kind === 'castle' && !K.forest && K.floor === 'cloud_2' && K.look === D.HQ_ROOM_LOOKS.skycastle && K.sky === undefined || K.sky.scenery === 'islands', 'hqCastleShell({ sky: true })');
    assert.ok(/window\.hqCastleShell = hqCastleShell;/.test(data), 'on window');
    for (const k of ['camelot', 'greathall', 'keep', 'undercroft', 'skycastle']) { const L = D.HQ_ROOM_LOOKS[k]; assert.ok(L && L.name && L.retro && L.cin && typeof L.bloom === 'number', 'look ' + k); }
    assert.equal(D.HQ_ROOM_LOOKS.skycastle.nightMood, 0, 'the castle in the sky has no night');
    for (const k of ['round_table', 'banner', 'armour_stand', 'sword_stone']) { const c = HQ.catalogue[k]; assert.ok(c && c.proc === k, 'catalogue ' + k); assert.ok(renderer.includes('        ' + k + ': function (U) {'), 'three-renderer.js builds ' + k); }
    assert.ok(HQ.catalogue.banner.wall === true && HQ.catalogue.round_table.block && HQ.catalogue.sword_stone.light && HQ.catalogue.sword_stone.glow, 'the banner hangs, the table blocks, the sword is lit');
    assert.ok(/round_table: function \(U\) \{[\s\S]*?for \(var i = 0; i < 12; i\+\+\)/.test(renderer), 'twelve chairs');
    const { spawnSync } = require('node:child_process');
    const r = spawnSync(process.execPath, ['check-terrain.js', '--json', ...IDS], { cwd: __dirname, encoding: 'utf8' });
    assert.equal(r.status, 0, r.stderr);
    const rows = JSON.parse(r.stdout);
    assert.equal(rows.length, 5);
    for (const row of rows) { assert.equal(row.unreached.length, 0, row.id + ': every door reached'); assert.equal(row.traps.length, 0, row.id + ': nothing traps'); if (row.plan && row.plan.kind === 'halls') assert.equal(row.plan.deadEnds, 0, row.id + ': no dead ends'); }
});
