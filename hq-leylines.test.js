// hq-leylines.test.js — THE LEY LINES (2026-09-18 — THE COMPLEX CANDIDATES #9,
// the user: "this weird impossible underground tunnel system, not completely
// cave and natural, but not completely man-made either. Was it made by humans?
// Giants? Aliens? Ant people? Was it always there? Amber tone. Long straight
// claustrophobic corridors that fork off. Also work on making better areas for
// the ancient sites."): five parts on four sites on THE CAVE / THE WOODS
// blueprint — THE LEY LINES (the new `ley` floor-plan kind: four authored
// straight lines between the stations, generated forks at ley angles, a
// chamber at every crossing, an antechamber behind every station, a niche at
// every dead end; the solid a mass to a 3.2 m ceiling, traced into amber-lit
// walls; THE OMPHALOS = the tape), STONEHENGE · THE PLAIN, GÖBEKLI TEPE · THE
// TELL, GIZA · THE PLATEAU and BABEL · THE TOWER (four `rooms` plans with no
// thicket; the boards bypassed; a hard tape on each site's weenie). THE LEY
// LINE (routes.ley) is the same four links re-pointed onto the parts; the tell
// and the tunnels are one site (a door pair). THE LEY LINES is a hub.
// Guards: the sheet, the generator (lines · forks · chambers · niches · the
// mass · the traced walls · determinism), THE SOLVER + THE RETURN GUARANTEE +
// the production landing, the entries + the re-pointed links + the route +
// the hub, the weenies + the hard tapes, THE PARK RULE + the lights, the
// renderer's veins + the T-pillar + the catalogue, check-terrain on all five.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');
const { loadGameData } = require('./load-data');
const D = loadGameData(), HQ = D.DOOR_HQ;
const LEY = 'site_prebuilt_gobekli_leylines', HENGE = 'site_prebuilt_stonehenge_henge', TELL = 'site_prebuilt_gobekli_tell', PLATEAU = 'site_prebuilt_giza_plateau', TOWER = 'site_prebuilt_babel_tower';
const PARTS = { [LEY]: ['prebuilt_gobekli', 'leylines'], [HENGE]: ['prebuilt_stonehenge', 'henge'], [TELL]: ['prebuilt_gobekli', 'tell'], [PLATEAU]: ['prebuilt_giza', 'plateau'], [TOWER]: ['prebuilt_babel', 'tower'] };
const IDS = Object.keys(PARTS), SITES = ['prebuilt_stonehenge', 'prebuilt_gobekli', 'prebuilt_giza', 'prebuilt_babel'];
const renderer = fs.readFileSync(__dirname + '/three-renderer.js', 'utf8');
const data = fs.readFileSync(__dirname + '/data.js', 'utf8');
const at = (room, id) => (HQ.rooms[room].doors || []).find(d => d.id === id);
const L = (id) => HQ.links.find(l => l.id === id);
const key = (info, x, z) => D.hqTerrainNodeKey(info, x, z);

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

test('the sheet: five parts on four ancient sites — site + part, no number, every one a TERRAIN room; the tunnels a CLOSED room three metres high on the `ley` plan wearing the ley shell (no strips, no lamps, its own amber haze, the leylines look); the four sites OPEN under their own skies (the EW_MAP_META row by hand) on `rooms` plans with no thicket, each with its own look; the register lists each site once', () => {
    for (const id of IDS) {
        const r = HQ.rooms[id], [site, part] = PARTS[id];
        assert.ok(r && r.kind === 'box' && r.site === site && r.part === part, id + ': a box room wearing site + part');
        assert.equal(D.hqComplexRoomId(site, part), id);
        assert.equal(r.roomNo, undefined, id + ' wears no number');
        assert.equal(D.hqRoomNo(id), HQ.thresholds[site].roomNo, id + ': hqRoomNo reads the site\'s number through');
        assert.equal(D.hqRoomSite(id), site, id + ' is WILD');
        assert.ok(r.sub && r.spawn && Array.isArray(r.lines) && r.lines.length >= 3 && (r.npcSpots || []).length >= 3, id + ': plate, spawn, lines, natives');
        assert.ok(r.terrain && !r.cave && D.hqTerrainInfo(id), id + ': a terrain room');
        assert.ok(r.shell.look && r.shell.look.name && r.shell.strips === false && Array.isArray(r.shell.lights) && r.shell.lights.length === 0, id + ': a look; the room lights itself');
        assert.ok(!r.doors.some(d => (HQ.catalogue[d.leaf] || {}).rank), id + ': no rank leaf');
    }
    const ley = HQ.rooms[LEY];
    assert.ok(!ley.shell.open && ley.shell.h === 3.2 && ley.shell.fog && ley.shell.fog.density > 0 && ley.shell.look === D.HQ_ROOM_LOOKS.leylines && ley.terrain.gen.kind === 'ley' && ley.terrain.crag === false, 'the tunnels: closed, low, hazed, amber, a ley plan');
    assert.equal(ley.shell.mood.strip, 0xffb347, 'the veins\' amber');
    const meta = (id) => D.EW_MAP_META.find(m => m.id === id).env;
    for (const [id, look] of [[HENGE, 'henge'], [TELL, 'tell'], [PLATEAU, 'plateau'], [TOWER, 'babel']]) {
        const S = HQ.rooms[id].shell, env = meta(PARTS[id][0]);
        assert.ok(S.open && S.edge === 'open' && S.sky && S.look === D.HQ_ROOM_LOOKS[look], id + ': open under a sky, the ' + look + ' look');
        assert.equal(S.sky.tint, env.tint, id + ': the site\'s own tint'); assert.equal(S.sky.fog.color, env.fog.color, id + ': the site\'s own fog'); assert.equal(S.sky.scenery, env.scenery, id + ': the site\'s own roster');
        assert.ok(S.sky.fog.density > 0 && !S.sky.motion, id + ': a fog per metre; the room stands still');
        assert.ok(HQ.rooms[id].terrain.gen.kind === 'rooms' && HQ.rooms[id].terrain.gen.thicket === false, id + ': a rooms plan, the banks the solid, no thicket');
    }
    const reg = D.hqRoomRegister();
    for (const site of SITES) { assert.equal(reg.filter(r => r.mapId === site).length, 1, 'the register lists ' + site + ' once'); assert.ok(!reg.some(r => r.id && IDS.includes(r.id)), 'no part is a register entry'); }
    assert.equal(D.hqSiteComplex('prebuilt_gobekli').length, 3, 'Göbekli: the board room, the tell, the tunnels');
});

test('THE GENERATOR (HQ_TERRAIN_GEN.ley): four authored straight lines, generated forks at ley angles that join, run to the rim or end in a niche, a chamber at every crossing and behind every station, the solid a MASS to the ceiling traced into walls; deterministic and seeded; every fork leaves a line at a listed angle and is narrower than a line', () => {
    const G = D.HQ_TERRAIN_GEN.ley;
    assert.ok(G && G.forkDeg.length >= 4 && G.forkW[1] < G.w && G.minOpen < 0.1 && G.minDegree === 0, 'the table: forks narrower than the lines, a mostly-solid open share, no cycle rule (a niche is the design)');
    const info = D.hqTerrainInfo(LEY), P = info.genPlan;
    assert.equal(P.lines.length, 4); assert.ok(P.forks.length >= 10 && P.forks.length <= 40, 'forks: ' + P.forks.length);
    assert.ok(P.chambers.filter(c => c.cross).length >= 2, 'crossing chambers: ' + P.chambers.filter(c => c.cross).length);
    assert.equal(P.chambers.filter(c => c.pad).length, HQ.rooms[LEY].doors.length, 'an antechamber behind every station');
    assert.ok(P.niches.length >= 1 && P.niches.every(n => P.forks.some(f => f.id === n.fork && f.end === 'len')), 'every niche ends a fork that ran out');
    assert.equal(P.deadEnds.length, 0, 'no dead-end readout (the niches are the design)');
    const ends = new Set(P.forks.map(f => f.end)); assert.ok(ends.has('join'), 'forks join');
    for (const f of P.forks) {
        assert.ok(f.w >= G.forkW[0] - 0.01 && f.w <= G.forkW[1] + 0.01 && f.w < G.w, f.id + ': ' + f.w + ' wide');
        const parent = P.lines.concat(P.forks).find(l => l.id === f.parent); assert.ok(parent, f.id + ' has a parent');
        /* the first leg leaves the parent at one of the ley angles (the parent's nearest segment's bearing, either side) */
        const q = D._hqTPolyDist(f.pts[0][0], f.pts[0][1], parent.pts), A = parent.pts[q.seg], B = parent.pts[q.seg + 1];
        const bear = Math.atan2(B[1] - A[1], B[0] - A[0]), ang = Math.atan2(f.pts[1][1] - f.pts[0][1], f.pts[1][0] - f.pts[0][0]);
        let d = Math.abs(((ang - bear) * 180 / Math.PI + 540) % 360 - 180);
        assert.ok(G.forkDeg.some(a => Math.abs(d - a) < 2.5 || Math.abs(d - (180 - a)) < 2.5), f.id + ' leaves at ' + d.toFixed(1) + '°');
        assert.ok(q.d < 0.6, f.id + ' leaves from its parent');
        assert.ok(f.pts.length <= 3, f.id + ': straight, or one turn');
    }
    assert.ok(info.gen.solidMass && info.gen.solidPad > 0 && info.solidTop && info.planWalls.length >= 40 && info.planWalls.every(w => w.plan && w.key === 'rock_wall_1'), 'the mass and its traced walls in the rock sheet');
    assert.ok(info.gen.open >= G.minOpen && info.gen.open < 0.3, 'a mostly-solid room: open ' + info.gen.open.toFixed(3));
    /* the mass is never stood in, the air / the boom meet it at the ceiling */
    let solid = 0, inside = 0;
    for (const c of P.chambers.filter(c => c.cross)) { assert.ok(D.hqTerrainFeet(info, c.x, c.z, null) != null, c.id + ' stands open'); }
    for (let x = -95; x <= 95; x += 5) for (let z = -70; z <= 70; z += 5) { if (D.hqTerrainMaskAt(info, x, z) < -1) { solid++; if (D.hqTerrainFeet(info, x, z, null) !== null) inside++; assert.ok(D.hqTerrainSolidTop(info, x, z) >= 3.0, 'the solid reaches the ceiling at ' + x + ',' + z); } }
    assert.ok(solid > 200 && inside === 0, 'the solid refuses the walker (' + inside + ' of ' + solid + ')');
    /* determinism: the same plan twice, another seed another plan */
    const room = HQ.rooms[LEY], a = D.hqTerrainCompile(room, LEY), b = D.hqTerrainCompile(room, LEY);
    assert.equal(Buffer.from(a.mask).toString('hex'), Buffer.from(b.mask).toString('hex'), 'the same tunnels twice');
    const copy = JSON.parse(JSON.stringify(Object.assign({}, room, { _terrainInfo: undefined }))); copy.terrain.gen = Object.assign({}, copy.terrain.gen, { seed: 7 });
    const c = D.hqTerrainCompile(copy, LEY);
    assert.notEqual(Buffer.from(a.mask).toString('hex'), Buffer.from(c.mask).toString('hex'), 'another seed, other forks');
    const CL = copy.doors.map(d => D.hqTerrainDoorLanding(copy, d)); const R = D.hqTerrainReach(c, CL[0].x, CL[0].z);
    for (const q of CL) assert.ok(R.has(key(c, q.x, q.z)), 'the reseeded tunnels still join every station');
});

test('THE SOLVER + THE RETURN GUARANTEE + THE PRODUCTION LANDING: in every part every door reaches every other under the walker\'s rule, nothing traps, every sill is its pad\'s, every landing is inside and clear of every prop; check-terrain agrees on all five', () => {
    for (const id of IDS) {
        const room = HQ.rooms[id], info = D.hqTerrainInfo(id);
        const Ls = room.doors.map(d => Object.assign({ d }, D.hqTerrainDoorLanding(room, d)));
        assert.ok(Ls.length >= 2, id + ': two ways at least');
        const R0 = D.hqTerrainReach(info, Ls[0].x, Ls[0].z);
        for (const b of Ls) assert.ok(R0.has(key(info, b.x, b.z)), id + ': ' + Ls[0].d.id + ' → ' + b.d.id + ' unreachable');
        assert.equal(D.hqTerrainTraps(info).length, 0, id + ': a trap');
        for (const a of Ls) {
            assert.equal(a.y, D.hqTerrainDoorY(room, a.d), id + '/' + a.d.id + ': the sill is the pad');
            const h = landing(room, a.d), p = h.player;
            assert.ok(Math.abs(p.x) < room.shell.w / 2 - 0.4 && Math.abs(p.z) < room.shell.d / 2 - 0.4, id + '/' + a.d.id + ': inside');
            assert.ok(D.hqTerrainFeet(info, p.x, p.z, null) != null, id + '/' + a.d.id + ': the landing is walkable');
            for (const q of room.props || []) {
                const cat = HQ.catalogue[q.key] || {};
                if (q.wall || q.ceil || cat.ceil || !(cat.foot > 0)) continue;
                assert.ok(Math.hypot(p.x - (q.x || 0), p.z - (q.z || 0)) > cat.foot + 0.4, id + '/' + a.d.id + ': ' + q.key + ' blocks the landing');
            }
        }
    }
    const out = JSON.parse(execFileSync(process.execPath, ['check-terrain.js', '--json', ...IDS], { cwd: __dirname, encoding: 'utf8', maxBuffer: 1 << 26 }));
    for (const r of out) { assert.equal(r.unreached.length, 0, r.id + ': ' + r.unreached.join(',')); assert.equal(r.traps.length, 0, r.id + ' traps'); }
    assert.equal(out.find(r => r.id === LEY).plan.kind, 'ley');
});

test('THE ENTRIES + THE LINE + THE HUB: the four boards are bypassed (the frame lands on the plain, the tomb door on the plateau, the barn door at the tower, the first doorway on the tell — bay s x 0), the parts wear the boards\' egress, no part has a door back to its board; the four ley links keep their ids and stand on the parts (Technoticlan\'s on its board as before), every one live on THE LEY LINE, a star with Göbekli at every leg; the tell and the tunnels are a door pair; THE LEY LINES is a hub over the four sites', () => {
    const E = HQ.siteRooms.entry;
    for (const [site, part] of [['prebuilt_stonehenge', HENGE], ['prebuilt_gobekli', TELL], ['prebuilt_giza', PLATEAU], ['prebuilt_babel', TOWER]]) {
        assert.deepEqual([E[site].room, E[site].door.wall, E[site].door.x], [part, 's', 0]);
        const eg = at('site_' + site, 'egress'), bay = at(part, 'bay');
        assert.ok(bay && bay.entry === site && bay.leaf === eg.leaf && bay.action.room === eg.action.room, part + ': the bay door is the board room\'s egress');
        assert.equal(D.hqSiteEntry('site_' + site, 'egress').room, part, site + ' is bypassed');
        assert.ok(!HQ.rooms[part].doors.some(d => d.action && d.action.room === 'site_' + site), part + ': no door back to the board');
        assert.ok(!HQ.rooms['site_' + site].doors.some(d => d.link), site + ': the bypassed board carries no link door');
    }
    const ends = {
        stonehenge_gobekli:  ['a', HENGE, 'n', -10, 'b', LEY, 'w', -40],
        gobekli_giza:        ['a', LEY, 's', -30, 'b', PLATEAU, 'n', -10],
        giza_babel:          ['a', LEY, 'n', 50, 'b', TOWER, 'n', -10],
        babel_technoticlan:  ['a', LEY, 'e', 20, 'b', 'site_prebuilt_technoticlan', 'n', -5],
    };
    const ley = HQ.links.filter(l => l.route === 'ley');
    assert.equal(ley.length, 4, 'four ley links (the ids kept)');
    for (const [id, e] of Object.entries(ends)) {
        const l = L(id); assert.ok(l && l.route === 'ley' && l.why && !l.draft === false, id);
        const live = D.hqLinkLive(l); assert.ok(live, id + ' live');
        assert.equal(live.a, e[1], id + ' a'); assert.equal(live.b, e[5], id + ' b');
        for (const [rid, wall, at2] of [[e[1], e[2], e[3]], [e[5], e[6], e[7]]]) {
            const d = at(rid, 'link_' + id); assert.ok(d && d.wall === wall && ((wall === 'n' || wall === 's') ? d.x : d.z) === at2, id + ' door on ' + rid);
            assert.ok(d.label && !/PREBUILT/.test(d.label) && d.sub, id + ' plated on ' + rid);
        }
    }
    const R = D.hqWorldRoutes('foyer').find(r => r.id === 'ley');
    assert.ok(R && R.legs.length === 4 && R.stations.length === 5, 'the line: four legs, five stations');
    assert.ok(R.legs.every(l => l.from === 'site_prebuilt_gobekli' || l.to === 'site_prebuilt_gobekli'), 'a star: every leg is Göbekli\'s');
    assert.ok(R.stations.map(s => s.no).sort().join(',') === ['56', '9600', '444', '11', HQ.thresholds.prebuilt_technoticlan.roomNo].sort().join(','), 'the five numbers');
    const tellDoor = at(TELL, 'ley'), back = at(LEY, 'tell');
    assert.ok(tellDoor && tellDoor.action.room === LEY && tellDoor.action.at === 'tell' && !tellDoor.link && back && back.action.room === TELL && back.action.at === 'ley' && !back.link, 'the tell ⇄ the tunnels: a pair, never a link');
    const hub = HQ.hubs.ley;
    assert.ok(hub && hub.room === LEY && hub.sites.length === 4 && SITES.every(s => hub.sites.includes(s)), 'the hub');
    for (const id of IDS) assert.equal((D.hqHubOf(id) || {}).id, 'ley', id + ' is in the hub');
    assert.ok(D.hqMapModel({}, 'foyer', { all: true }).nodes.find(n => n.id === LEY && n.hub), 'the anchor is drawn');
});

test('THE WEENIES + THE HARD TAPES: THE OMPHALOS in the nexus (2.3 m under the 3.2 m ceiling), THE GREAT TRILITHON, THE SENTINEL in enclosure D, THE SPHINX\'s head, THE LOAD over the tower\'s top — a pinned tape on each, hard, high, with a door-gun shot from a reachable node; every board of the four is bare, every part carries exactly one tape (the tunnels\' came off Cyberpunk\'s bypassed board); the hundred stays a hundred', () => {
    const T = D.DOOR_TAPES, F = HQ.finds;
    assert.equal(T.length, 100);
    for (const site of SITES) assert.equal(T.filter(t => t.where === 'site_' + site).length, 0, site + '\'s board is bare');
    assert.equal(T.filter(t => t.where === 'site_prebuilt_cyberpunk').length, 0, 'Cyberpunk\'s bypassed board gave its tape');
    const pins = { [LEY]: [-50, -25, 2.3, 'THE SURVEY'], [HENGE]: [0, 5.6, 6.6, 'SOLSTICE, FROM THE BANK'], [TELL]: [18.5, 8, 5.4, 'THE PILLARS'], [PLATEAU]: [37, 26, 6.8, 'THE SHAFT'], [TOWER]: [3, -5.5, 18.0, 'ONE VOICE'] };
    for (const [id, [x, z, h, title]] of Object.entries(pins)) {
        const tapes = T.filter(t => t.where === id); assert.equal(tapes.length, 1, id + ': one tape'); assert.equal(tapes[0].title, title);
        const f = F.find(f => f.room === id && f.kind === 'tape'); assert.ok(f, id + ': the find');
        assert.ok(Math.abs(f.x - x) < 0.01 && Math.abs(f.z - z) < 0.01 && Math.abs(f.y - h) < 0.05 && f.hard === true, id + ': pinned on the weenie at ' + h + ' m, hard (' + f.x + ',' + f.z + ',' + f.y + ',' + f.hard + ')');
        const info = D.hqTerrainInfo(id), L0 = D.hqTerrainDoorLanding(HQ.rooms[id], HQ.rooms[id].doors[0]);
        assert.ok(!D.hqTerrainReach(info, L0.x, L0.z).has(key(info, f.x, f.z)), id + ': the walker never reaches it');
        assert.ok(D.hqFindHardReachTerrain(f, D.hqFindRoomInfo(id)).ok, id + ': the door gun has a shot');
        assert.ok(HQ.rooms[id].terrain.features.some(q => q.k === 'plateau' && Math.abs(q.x - x) < 0.01 && Math.abs(q.z - z) < 0.01 && q.h === h), id + ': the weenie is a tier');
    }
    assert.ok(HQ.rooms[LEY].terrain.features.some(f => f.k === 'dip' && f.x === -50 && f.z === -25 && f.open), 'the nexus is sunk (the bowl)');
    assert.ok(HQ.rooms[LEY].terrain.gen.chambers.some(c => c.id === 'nexus' && c.x === -50 && c.z === -25), 'the nexus is an authored chamber where the great line crosses the tell\'s');
});

test('THE PARK RULE + THE LIGHT + THE STONES: every part has a ramp or a tier and a rail (the sarsens and the brick stacks are grinds; the pyramid and the tower are climbed on stairs that obey THE RAMP RULE); every room lights itself under the cap; the henge\'s circle is walls in the rock sheet, the trilithon GLB stands twice, the tell\'s enclosures wear ring walls and T-pillars, the plateau\'s obelisks and the tower\'s crane stand on the catalogue', () => {
    for (const id of IDS) {
        const room = HQ.rooms[id], info = D.hqTerrainInfo(id), F = room.terrain.features;
        assert.ok(F.some(f => f.k === 'plateau' || f.k === 'ramp'), id + ': a tier or a ramp');
        assert.ok(info.rails.length >= 1, id + ': a rail');
        const lights = (room.props || []).filter(p => (HQ.catalogue[p.key] || {}).light).length;
        assert.ok(lights >= 2 && lights <= 10, id + ': ' + lights + ' lights (the room lights itself, under the cap)');
        for (const p of room.props || []) assert.ok(HQ.catalogue[p.key], id + ': ' + p.key + ' is catalogued');
        for (const f of F.filter(f => f.k === 'ramp' && f.stairs)) { const Lr = Math.hypot(f.x1 - f.x0, f.z1 - f.z0), rise = Math.abs(f.h1 - f.h0); assert.ok(Lr >= 2.2 * rise - 0.01, id + ': a stair ' + Lr.toFixed(1) + ' m for ' + rise + ' (L ≥ 2.2 h)'); }
    }
    assert.ok(HQ.rooms[HENGE].terrain.features.filter(f => f.k === 'wall' && f.h >= 4 && f.key === 'rock_wall_1').length >= 12, 'the sarsen circle and the horseshoe as walls');
    assert.equal(HQ.rooms[HENGE].props.filter(p => p.key === 'trilithon').length, 2); assert.ok(HQ.rooms[HENGE].props.filter(p => p.key === 'sarsen').length >= 5, 'the bluestones');
    assert.ok(HQ.rooms[TELL].terrain.features.filter(f => f.k === 'wall' && f.h < 2).length >= 16 && HQ.rooms[TELL].terrain.features.filter(f => f.k === 'dip' && f.dome).length === 4, 'four enclosures ringed with low walls');
    assert.ok(HQ.rooms[TELL].props.filter(p => p.key === 't_pillar').length >= 16, 'the T-pillars');
    assert.equal(HQ.rooms[PLATEAU].terrain.features.filter(f => f.k === 'ramp').length, 4, 'the north stair: four flights');
    assert.equal(HQ.rooms[PLATEAU].props.filter(p => p.key === 'obelisk').length, 2);
    assert.equal(HQ.rooms[TOWER].terrain.features.filter(f => f.k === 'ramp').length, 4, 'the spiral: four ramps');
    const crane = HQ.rooms[TOWER].props.find(p => p.key === 'babel_crane'); assert.ok(crane && crane.y === 14.0, 'the crane on the top');
    assert.ok(D.hqTerrainFeet(D.hqTerrainInfo(TOWER), -4.3, -8, null) === 14 && D.hqTerrainFeet(D.hqTerrainInfo(PLATEAU), -30, -22, null) === 14, 'both tops are walked to at 14 m');
    for (const k of ['trilithon', 'sarsen', 'obelisk', 'babel_crane']) assert.ok(HQ.catalogue[k] && HQ.catalogue[k].base === 'misc' && HQ.catalogue[k].file, k + ' reads the misc bucket');
    assert.ok(HQ.catalogue.t_pillar && HQ.catalogue.t_pillar.proc === 't_pillar', 'the T-pillar is a proc');
});

test('THE RENDERER: the ley veins builder (a strip along the foot and the lintel of every traced wall on its open face, a glow per chamber and niche, a keystone in every crossing chamber, one breathing material) hooked where the halls\' lights are; the T-pillar proc reads its row\'s h; the generator\'s hooks (the tooth cleanup, the mass, the wall height, the trace) name the ley kind', () => {
    assert.ok(renderer.includes("function _hqBuildLeyVeins(room, info, G, TM, rng) {") && renderer.includes("if (info.genPlan && info.gen && info.gen.kind === 'ley') { try { _hqBuildLeyVeins(room, info, G, TM, rng); }"), 'the builder and its hook');
    const fn = renderer.slice(renderer.indexOf('function _hqBuildLeyVeins('), renderer.indexOf('THE FLOATING PIECES (THE DIVINE STAIR, second pass'));
    assert.ok(fn.includes('(info.planWalls || []).forEach') && fn.includes('w.base + 0.3 + 0.22') && fn.includes('w.top - 0.34') && fn.includes('hqTerrainMaskAt(info, mx + nx *'), 'two veins per wall on the open face');
    assert.ok(fn.includes("(plan.chambers || []).concat(plan.niches || [])") && fn.includes('return c.cross;') && fn.includes('_hq.tickers.push'), 'the glows, the keystones, the breathing');
    assert.ok(fn.includes('EW_HQ_NO_LEY_VEINS') && fn.includes('HQ_LEY_VEIN_MAX'), 'the kill-switch and the cap');
    assert.ok(!/state\./.test(fn) && !/_emit\(/.test(fn), 'nothing on state, nothing relayed');
    assert.ok(renderer.includes("        t_pillar: function (U, p) {") && /t_pillar: function \(U, p\) \{[\s\S]{0,200}\(p && p\.h\) \|\| 4\.6/.test(renderer), 'the T-pillar proc reads p.h');
    for (const f of ["if (gen.kind === 'halls' || gen.kind === 'ley') for (let pass = 0; pass < 2; pass++) {", "|| gen.kind === 'halls' || gen.kind === 'ley';", "if (gen.kind === 'halls' || gen.kind === 'ley') {\n        const tops", "} else if (gen.kind === 'ley') {"]) assert.ok(data.includes(f), 'data.js: ' + f.slice(0, 50));
    assert.ok(data.includes("function hqLeyShell(o) {") && data.includes("function hqAncientShell(o) {"), 'the two shells');
});
