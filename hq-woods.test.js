// hq-woods.test.js — THE WOODS (HQ plan 9.3 stage 3 — 2026-09-16) on THE
// TERRAIN (stage 4 — 2026-09-17): the forest is a smooth height field now —
// the knoll, the stream and its plank, the crag the tape stands on, the
// switchbacks up the mountain trail, the redwoods' creek and root mound,
// the pasture's dry-stone fence the rider jumps onto, THE STAIRCASE up to
// its landing, the storm drain's channel and sump, the ritual mound and its
// stones. The ASCII grid (rev 11) is retired from every part.
// The SEVENTH complex, the Fairy Forest's: THE CLEARING (the crossroads)
// and six paths — THE MOUNTAIN TRAIL up to Shasta, THE REDWOOD TRAIL to the
// Grove, THE BACK PASTURE with the ranch's gate and THE DEAD TREE (the
// house's garden gate) in one fence, THE STAIRCASE whose door opens on the
// building's stairwell, DEAD MAN'S CAVE whose grate opens on THE TUNNEL and
// THE RITUAL GROUND whose circle is Room 333's and whose dead tree looks
// onto the Looking-Glass. THE HOLLOW TREE (the user's GLB) is the way in.
// G6 (WORLD_GEOGRAPHY_PLAN.md, 2026-09-28): the parts stand apart on THE
// LAND, each on its own pad — the trail and the pasture retired, the doors
// between the parts gone (the land is the way between them), the grove,
// Shasta and Camelot links gone (walked to over the land); Dead Man's Cave
// opens off the land (the storm drain's mouth).
// Guards: the sheet, every part reached (the hollow tree, the land, the
// cave's door off the land), the four links live, the production landing on every door,
// THE PARK RULE, THE WEENIES, the tapes, the staircase, the storm drain and
// the renderer's source sites.
'use strict';
const test = require('node:test');
const { heavy } = require('./test-heavy.js');   // 2026-09-18: the heavy geometry proofs run on `npm run test:full` / in CI
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { loadGameData } = require('./load-data');
const D = loadGameData(), HQ = D.DOOR_HQ;
const TERRAIN_RULES = vm.runInContext('TERRAIN_RULES', D);
const SITE = 'prebuilt_fairy_forest';
const BOARD = 'site_' + SITE;
const PARTS = ['clearing', 'redwoods', 'stair', 'deadmans', 'ritual'];
const PART_IDS = PARTS.map(p => BOARD + '_' + p);
const HUB = BOARD + '_clearing';
const SEWER = BOARD + '_deadmans';   // THE STORM DRAIN: the woods' one INDOOR part — a closed brick culvert, no sky
const STAIR = BOARD + '_stair';
const LINKS = { woods_stair: 'stair', woods_sewer: 'deadmans', woods_ritual: 'ritual', deadtree_lookingglass: 'ritual' };
const renderer = fs.readFileSync(__dirname + '/three-renderer.js', 'utf8');
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

test('the sheet: THE WOODS is the Fairy Forest’s complex — five parts, each site + part, none numbered, open under one sky (the storm drain closed), every one a terrain room, the register lists 420 once', () => {
    assert.deepEqual(D.hqSiteComplex(SITE).join(','), PART_IDS.join(','), 'the parts in sheet order (the board room is gone, 2026-09-27)');
    assert.ok(!HQ.rooms[BOARD] && D.hqSiteEntryOf(SITE).room === HUB, 'the clearing is the entry part');
    for (const p of PARTS) {
        const id = D.hqComplexRoomId(SITE, p), r = HQ.rooms[id];
        assert.ok(r && r.kind === 'box' && r.site === SITE && r.part === p, id + ': a box room wearing site + part');
        assert.equal(r.roomNo, undefined, id + ' wears no number of its own');
        assert.equal(D.hqRoomNo(id), '420', id + ': hqRoomNo reads the threshold’s number through site');
        assert.equal(D.hqRoomSite(id), SITE, id + ' is WILD');
        assert.ok(/THE WOODS/.test(r.label) && r.sub && r.spawn && Array.isArray(r.lines) && r.lines.length, id + ': plate, spawn, lines');
        assert.ok(r.terrain && !r.cave && D.hqTerrainInfo(id), id + ': a terrain room (the grid is retired)');
        assert.ok(r.shell.w > 0 && r.shell.d > 0, id + ': a shell sized by hand');
        if (id === SEWER) assert.ok(!r.shell.open && r.shell.wall === 'bricks_2', 'the storm drain is a closed brick culvert');
        else { assert.ok(r.shell.open && r.shell.edge === 'open' && r.shell.sky && r.shell.forest, id + ': open under the woods’ sky with a treeline past its edge'); assert.ok(D.hqTerrainInfo(id).trees.length >= 3, id + ': trees'); }
        for (const n of ['floor', 'wall', 'dado', 'trim']) assert.ok(HQ.textures[r.shell[n]] || TERRAIN_RULES[r.shell[n]], id + ': texture ' + r.shell[n]);
    }
    const reg = D.hqRoomRegister();
    assert.equal(reg.filter(r => r.mapId === SITE).length, 1, 'the register lists the forest once');
    assert.ok(!reg.some(r => PART_IDS.includes(r.id) || PART_IDS.includes(r.room)), 'no part is a register entry');
});

test('the woods are one piece on the land: THE HOLLOW TREE is the bay door, every open part stands on the land, Dead Man’s Cave opens off it, no door joins two parts', () => {
    const back = at(HUB, 'forest');
    assert.ok(back && back.way === 'hollowtree' && back.wall === 's' && back.entry === SITE, 'the way in is the hollow tree on the clearing’s south wall — the bay door');
    assert.ok(back.action.room === D.hqBayId(D.hqSectorOfMap(SITE)) && back.action.at === 'site_' + SITE, 'and it walks back to the threshold');
    assert.ok(!back.rankDoor && !back.minClearance && D.doorSiteState(back, null) === 'open', 'never gated');
    const Z = vm.runInContext('HQ_WORLD.zones.land', D);
    for (const id of PART_IDS) {
        if (id === SEWER) continue;
        assert.ok(Z.parts[id] && Z.parts[id].place && D.hqStagePart(id), id + ' stands on its place on the land');
    }
    const cave = at(SEWER, 'land'), mouth = at('land', 'deadmans');
    assert.ok(cave && cave.action.room === 'land' && cave.action.at === 'deadmans' && mouth && mouth.action.room === SEWER && mouth.action.at === 'land', 'the storm drain opens off the land');
    for (const id of PART_IDS) for (const d of HQ.rooms[id].doors) {
        const a = d.action || {};
        assert.ok(a.room && HQ.rooms[a.room], id + '/' + d.id + ' leads to a room');
        assert.ok(!PART_IDS.includes(a.room), id + '/' + d.id + ': no door between two parts (the land is the way)');
        if (d.link) assert.ok(HQ.links.some(l => l.id === d.link), id + '/' + d.id + ' is a links row');
    }
    assert.equal(HQ.rooms[HUB].doors.length, 1, 'the clearing keeps the hollow tree only');
});

test('THE PATHS: four live links — the stairwell behind the staircase’s door (on the landing), the tunnel behind the grate, Room 333 behind the circle, the Looking-Glass through the ritual ground’s dead tree; the grove, Shasta and Camelot are walked to over the land (G6)', () => {
    for (const old of ['haunted_skinwalker', 'skinwalker_grove', 'grove_fairy', 'woods_grove', 'woods_shasta', 'fairy_camelot', 'ranch_grove', 'ranch_haunted']) assert.ok(!HQ.links.some(l => l.id === old), old + ' is gone');
    for (const [id, part] of Object.entries(LINKS)) {
        const l = HQ.links.find(x => x.id === id);
        assert.ok(l && D.hqLinkLive(l), id + ' is live');
        assert.ok(l.why && l.why.length > 20 && l.note, id + ' explains itself');
        const end = (l.a.part === part && l.a.site === SITE) ? l.a : l.b, far = (end === l.a) ? l.b : l.a;
        assert.ok(end.site === SITE && end.part === part && end.sub, id + ': the woods end is the ' + part + ' with its own plate line');
        assert.equal(l.route, id === 'woods_sewer' ? 'subway' : id === 'deadtree_lookingglass' ? 'seams' : 'woods', id + ': the route');
        const room = D.hqLinkRoom(end), farRoom = D.hqLinkRoom(far);
        const d = at(room, 'link_' + id), b = at(farRoom, 'link_' + id);
        assert.ok(d && b && d.action.room === farRoom && b.action.room === room && d.action.at === b.id && b.action.at === d.id, id + ': both halves pair');
        assert.ok(!(HQ.catalogue[l.leaf] || {}).rank, id + ': never a rank leaf');
        if (l.way) assert.ok(d.way === l.way && b.way === l.way, id + ': the same object at both ends');
    }
    /* THE WOODS SPLIT (2026-09-18): the house's dead tree and the ranch's gate left the pasture for THE CORN FIELDS (hq-ranch.test.js) */
    assert.ok(!HQ.links.some(l => l.id === 'woods_haunted' || l.id === 'woods_skinwalker'), 'the pasture keeps no gate to the house or the ranch');
    assert.equal(D.hqLinkRoom(HQ.links.find(l => l.id === 'woods_stair').b), 'stairwell');
    assert.equal(D.hqLinkRoom(HQ.links.find(l => l.id === 'woods_sewer').b), 'tunnel');
    assert.equal(D.hqLinkRoom(HQ.links.find(l => l.id === 'woods_ritual').b), 'ritual');
    const dt = HQ.links.find(l => l.id === 'deadtree_lookingglass');
    assert.ok(dt.way === 'deadtree' && dt.a.wall === 'free' && dt.b.wall === 'free' && D.hqLinkRoom(dt.b) === 'site_prebuilt_lookingglass_garden', 'the ritual ground’s dead tree looks onto the Looking-Glass garden, free at both ends (THE AREAS, 2026-09-18)');
    /* the tiers: Shasta's frame on the top tier, the EXIT door on the landing (hqLinkDoors copies an end's y) */
    assert.equal(at(STAIR, 'link_woods_stair').y, 3.5, 'the EXIT door on the landing');
    assert.ok(!HQ.rooms.site_prebuilt_camelot, 'Camelot has no board room (every seam stands on a part)');
    const R = D.hqWorldRoutes('foyer'), woods = R.find(r => r.id === 'woods'), sub = R.find(r => r.id === 'subway'), seams = R.find(r => r.id === 'seams');
    assert.ok(woods.stations.some(s => s.site === SITE) && woods.stations.some(s => s.room === 'stairwell') && woods.stations.some(s => s.room === 'ritual'), 'THE WOODS line calls at the forest, the stairwell and Room 333');
    assert.ok(sub.stations.some(s => s.site === SITE), 'the storm drain is on the subway line');
    assert.ok(seams.stations.some(s => s.site === SITE) && seams.stations.some(s => s.site === 'prebuilt_lookingglass'), 'the dead tree puts the woods on THE SEAMS line');
    const G = D.hqWorldGraph();
    for (const id of Object.keys(LINKS)) {
        const l = HQ.links.find(x => x.id === id), a = D.hqLinkRoom(l.a), b = D.hqLinkRoom(l.b);
        assert.ok(G.edges.some(e => e.from === a && e.to === b && e.link === id) && G.edges.some(e => e.from === b && e.to === a && e.link === id), id + ': both edges');
    }
});

test('the production renderer lands every door inside its part, clear of every blocker, tree and native, facing along its doorway, at its sill on level ground', () => {
    for (const id of PART_IDS) {
        const room = HQ.rooms[id], S = room.shell, info = D.hqTerrainInfo(id);
        for (const door of room.doors) {
            const h = landing(room, door), p = h.player;
            assert.ok(Math.abs(p.x) < S.w / 2 - 0.4 && Math.abs(p.z) < S.d / 2 - 0.4, id + '/' + door.id + ': inside');
            const inward = door.wall === 'free' ? [Math.sin(door.face * Math.PI / 180), -Math.cos(door.face * Math.PI / 180)] : { n: [0, 1], s: [0, -1], e: [-1, 0], w: [1, 0] }[door.wall];
            const dot = Math.sin(h.cam.yaw) * inward[0] + (-Math.cos(h.cam.yaw)) * inward[1];
            assert.ok(dot < -0.99 || dot > 0.99, id + '/' + door.id + ': faces along the doorway’s normal');
            assert.equal(p.air, false);
            assert.equal(p.y, sill(room, door), id + '/' + door.id + ': lands at its sill');
            const feet = D.hqTerrainFeet(info, p.x, p.z, null);
            assert.ok(feet != null && Math.abs(feet - p.y) < 0.12 && D.hqTerrainSlope(info, p.x, p.z) < 0.3, id + '/' + door.id + ': the pad is level under the landing');
            for (const q of [...room.props, ...room.npcSpots]) assert.ok(!propBlocks(room, q, p.x, p.z, 0.35), id + '/' + door.id + ': ' + (q.key || q.race) + ' blocks the landing');
            for (const t of info.trees) assert.ok(Math.hypot(t.x - p.x, t.z - p.z) > t.r + 0.35, id + '/' + door.id + ': a tree stands on the landing');
            for (const q of info.scatter) assert.ok(Math.hypot(q.x - p.x, q.z - p.z) > q.r + 0.35, id + '/' + door.id + ': scattered ' + q.key + ' blocks the landing');
            for (const other of room.doors) if (other.id !== door.id && other.wall === door.wall && door.wall !== 'free') {
                const k = (door.wall === 'n' || door.wall === 's') ? 'x' : 'z';
                assert.ok(Math.abs(other[k] - door[k]) > 2.6, id + ': ' + door.id + ' and ' + other.id + ' overlap on the ' + door.wall + ' wall');
            }
        }
        const sp = room.spawn;
        for (const q of [...room.props, ...room.npcSpots]) assert.ok(!propBlocks(room, q, sp.x, sp.z, 0.3), id + ': ' + (q.key || q.race) + ' blocks the spawn');
        assert.ok(D.hqTerrainFeet(info, sp.x, sp.z, null) != null && !D.hqTerrainFluidAt(info, sp.x, sp.z), id + ': the spawn stands on dry ground');
        for (const n of room.npcSpots) { assert.ok(D.AVAILABLE_RACES.includes(n.race), id + ': native race ' + n.race); assert.ok(D.hqTerrainFeet(info, n.x, n.z, null) != null && !D.hqTerrainFluidAt(info, n.x, n.z), id + ': the ' + n.race + ' stands on dry ground'); }
        for (const p of room.props) { assert.ok(HQ.catalogue[p.key], id + ': prop ' + p.key); if ((p.y || 0) > 0.5 || p.wall || p.ceil) continue; assert.ok(D.hqTerrainFeet(info, p.x, p.z, null) != null, id + ': ' + p.key + ' stands in a hazard'); }
    }
});

test('THE PARK RULE and the woods’ own light: a rail and a real ramp or tier in every part (the staircase’s banisters are its rails), no facility strips or masts, torches under the prop-light cap; the graffiti in Dead Man’s Cave', () => {
    for (const id of PART_IDS) {
        const room = HQ.rooms[id], S = room.shell, info = D.hqTerrainInfo(id);
        assert.ok(info.rails.length >= 1, id + ': a rail to grind');
        assert.ok(room.terrain.features.some(f => f.k === 'ramp' || f.k === 'plateau'), id + ': a ramp or a tier to ride');
        assert.ok(S.strips === false && Array.isArray(S.lights) && S.lights.length === 0 && S.mood, id + ': no strips, no masts — the woods light themselves');
        const lit = room.props.filter(p => (HQ.catalogue[p.key] || {}).light).length;
        assert.ok(lit >= 1 && lit <= 10, id + ': ' + lit + ' point lights');
    }
    const stair = D.hqTerrainInfo(STAIR);
    assert.ok(stair.rails.filter(r => r.rail).length >= 4, 'the banisters and the landing’s rails');
    assert.ok(HQ.rooms[STAIR].props.filter(p => p.key === 'quarter_pipe').length === 2, 'two quarter pipes on the staircase’s floor');
    const dm = HQ.rooms[SEWER];
    assert.ok(dm.props.filter(p => p.key === 'graffiti_wall').length >= 3, 'paint on the brick');
    assert.ok(HQ.catalogue.graffiti_wall && HQ.catalogue.graffiti_wall.proc === 'graffiti_wall' && !HQ.catalogue.graffiti_wall.block, 'the catalogue row: a proc, nothing to bump into');
    assert.ok(/graffiti_wall: function \(U, p\)/.test(renderer), 'the renderer draws it');
});

test('THE WEENIES: one sky for the woods (hqWoodsShell), two landmarks on its horizon — Shasta to the north-north-west, Camelot to the south-south-east — and the renderer’s builders hang them still', () => {
    const LM = vm.runInContext('HQ_WOODS_LANDMARKS', D);
    assert.ok(Array.isArray(LM) && LM.length === 2, 'two landmarks');
    const peak = LM.find(l => l.kind === 'peak'), castle = LM.find(l => l.kind === 'castle');
    assert.ok(peak && peak.id === 'prebuilt_shasta' && peak.deg > 300 && peak.deg < 360, 'the mountain north-north-west');
    assert.ok(castle && castle.id === 'prebuilt_camelot' && castle.deg > 120 && castle.deg < 180, 'the castle south-south-east');
    for (const id of PART_IDS) {
        if (id === SEWER) continue;
        const sky = HQ.rooms[id].shell.sky;
        assert.ok(sky.landmarks && sky.landmarks.length === 2 && sky.landmarks.every((l, i) => l.kind === LM[i].kind && l.deg === LM[i].deg), id + ': the same two landmarks');
        assert.ok(sky.fog && typeof sky.fog.color === 'number' && sky.scenery && sky.tint != null, id + ': a full sky row');
    }
    assert.notEqual(HQ.rooms[PART_IDS[0]].shell.sky, HQ.rooms[PART_IDS[1]].shell.sky, 'every room owns its sky object');
    for (const k of ['peak', 'castle']) assert.ok(new RegExp('^        ' + k + ': function \\(U, o, rng\\)', 'm').test(renderer), 'a builder for ' + k);
    assert.ok(/function _hqBuildLandmarks\(H, list, discR\)/.test(renderer), 'the placer');
    assert.ok(/if \(Array\.isArray\(sky\.landmarks\) && sky\.landmarks\.length\) \{ try \{ _hqBuildLandmarks\(H, sky\.landmarks, 6000\); \}/.test(renderer), '_hqBuildSky hangs them');
});

test('THE RENDERER: the renderer plants the trees on a real kit and the treeline past an open edge', heavy, () => {
    const terr = renderer.slice(renderer.indexOf('    function _hqBuildTerrain('), renderer.indexOf('    function _hqBuildLandmarks('));
    assert.ok(/TK = _nrKit\(G, \{ ts: TM, bw: Math\.round\(S\.w \/ info\.tile\), bh: Math\.round\(S\.d \/ info\.tile\), rng: rng, hq: \{ w: 0, gap: 0, B: 1, tints: null \} \}, \{\}\)/.test(terr) && /tg\._ew_hqTree = true;/.test(terr), 'the trees are the near kit’s foliage on a REAL kit');
    assert.ok(/_hq\.blockers\.push\(\{ obj: blk, y: t\.y, top: null, rad: t\.r \|\| 0\.38, tree: true \}\)/.test(terr), 'a tree is a blocker');
    assert.ok(/if \(TK && S\.forest && S\.open && !_hqPartOnLand\(\)\) _hqPlantTreeline\(room, S, S\.w \/ 2, S\.d \/ 2, plantTree, rng\);/.test(terr), 'THE TREELINE past an open edge (G6: not on the land — its own forest stands there)');
    assert.ok(/if \(!S\.open && room\.terrain\.stalactites !== false\)/.test(terr), 'no stalactites under an open sky');
    for (const id of PART_IDS) assert.equal(D.hqFieldRoomOk(id), true, id + ': THE SEAMLESS FIELD (2026-09-22) — the encounter fights the woods\' own window on their own ground');
});

test('THE STAIRCASE + THE STORM DRAIN: the flight is a stair ramp (treads two samples deep) up to the landing (3.5 m) the EXIT door stands on, its banisters the rails, THE TOWER beside it no stair reaches; Dead Man’s Cave is a closed brick culvert 35 m long with THE CHANNEL waded down its middle, THE SUMP deep and never entered, the walkways dry either side, the grate at the east end', () => {
    const room = HQ.rooms[STAIR], info = D.hqTerrainInfo(STAIR);
    const flight = room.terrain.features.find(f => f.k === 'ramp' && f.stairs);
    assert.ok(flight && flight.h1 === 3.5 && flight.h0 === 0, 'one stair ramp from the floor to the landing');
    const treads = new Set(); for (let z = flight.z0 - 0.2; z >= flight.z1 + 0.2; z -= info.res / 2) treads.add(Math.round(D.hqTerrainHeight(info, 0, z) * 100));
    assert.ok(treads.size >= 8 && treads.size <= 44, 'the flight is treads, not a slope (' + treads.size + ' levels; G6: the island\'s edge ease touches the bottom tread by a centimetre)');
    let y = 0; for (let z = flight.z0 + 0.5; z >= flight.z1 - 0.3; z -= 0.25) { const f = D.hqTerrainFeet(info, 0, z, y); assert.ok(f != null, 'the stair climbed at z ' + z); y = f; }
    assert.ok(y > 3.3, 'the walker tops out on the landing');
    assert.equal(sill(room, at(STAIR, 'link_woods_stair')), 3.5, 'the door stands on the landing');
    const tower = room.terrain.features.find(f => f.k === 'plateau' && f.h >= 4.5);
    assert.ok(tower, 'THE TOWER');
    const L0 = D.hqTerrainDoorLanding(room, room.doors[0]), reach = D.hqTerrainReach(info, L0.x, L0.z);
    assert.ok(!reach.has(D.hqTerrainNodeKey(info, tower.x, tower.z)), 'no stair reaches the tower');
    /* the culvert */
    const sewer = HQ.rooms[SEWER], S = sewer.shell, si = D.hqTerrainInfo(SEWER);
    assert.ok(S.w === 35 && S.d <= 10.5 && S.h === 3.0 && !S.open, 'a long low box');
    const chan = sewer.terrain.features.find(f => f.k === 'stream'), sump = sewer.terrain.features.find(f => f.k === 'pool');
    assert.ok(chan && chan.pts[0][0] === -17.5 && chan.pts[1][0] === 17.5 && chan.key !== 'lava', 'the channel runs the length of the culvert');
    assert.ok(sump && sump.key === 'deep_water', 'the sump is deep');
    assert.equal(D.hqTerrainFeet(si, sump.x, sump.z, 0), null, 'never entered');
    assert.ok(D.hqTerrainFeet(si, -8, chan.pts[0][1], 0) != null && D.hqTerrainFeet(si, -8, chan.pts[0][1], 0) < -0.4, 'the channel is waded');
    for (const x of [-15, -6, 6, 15]) { assert.ok(D.hqTerrainFeet(si, x, -3.0, 0) != null && !D.hqTerrainFluidAt(si, x, -3.0), 'the north walkway is dry at ' + x); assert.ok(D.hqTerrainFeet(si, x, 4.4, 0) != null && !D.hqTerrainFluidAt(si, x, 4.4), 'the south walkway is dry at ' + x); }
    assert.ok(sewer.props.some(p => (HQ.catalogue[p.key] || {}).ceil && (HQ.catalogue[p.key] || {}).light), 'lit from the ceiling');
    assert.ok(!sewer.props.some(p => p.key === 'cave_torch'), 'no torch in a drain');
    assert.ok(sewer.props.filter(p => p.key === 'drain_grate').length === 2, 'the user’s grates in the brick');
    const grate = HQ.links.find(l => l.id === 'woods_sewer');
    assert.equal(grate.a.z, 0, 'the grate at the culvert’s east end');
    assert.ok(HQ.rooms[HUB].props.some(p => p.key === 'culvert_mouth' && p.wall === 'e'), 'the culvert mouth in the clearing’s crag');
});
