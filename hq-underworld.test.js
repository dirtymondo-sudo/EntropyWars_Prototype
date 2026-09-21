// hq-underworld.test.js — THE UNDERWORLD (2026-09-18 — THE COMPLEX CANDIDATES #3:
// "every subway tunnel, the sewer system (the storm drain), the dungeons (24601,
// the oubliette) joined into one underworld"): four parts on Room 1954 (under
// Disaster City) on THE CAVE / THE WOODS blueprint — THE SEWERS (`halls` with
// bsp off: the authored culverts with waded channels, THE JUNCTION, THE
// INSPECTION GALLERY, THE CISTERN + its plank, THE PUMP ROOM, THE OUTFALL SHAFT
// = the tape), THE RUNNING TUNNELS (`halls`, bsp off: THE LOOP LINE, THE
// CROSSOVER, THE CROSSING + THE SIGNAL GANTRY = the tape, THE DEPOT with the lit
// train, THE GHOST STATION with its platform; the rails are low walls), THE
// HOLDING CELLS (`halls`, bsp off, minDegree 1: six authored cells off one
// corridor, THE GUARDROOM + THE CATWALK + THE VENT STACK = the tape, THE DRUNK
// TANK, THE PROPERTY ROOM) and THE OLD WORKINGS (`cave` in brick, flooded: THE
// FLOOD waded, THE SUMP never, THE PUMP LEDGE, THE CHIMNEY = the tape).
// The seams: THE PUMPING STATION on Downtown's east wall (a pair), the Strip's
// gutter (a `way`), the storm drain, the Works' platform + Downtown's platform
// (the subway is one tunnel), Room 24601 + the oubliette (THE DUNGEONS line).
// THE UNDERWORLD is a hub that claims its rooms BY ID (DOOR_HQ.hubs.underworld).
// Guards: the sheet, the weenies, the seams + the routes, one piece + the cycle,
// the plans, THE SOLVER + THE RETURN GUARANTEE + the production landing, the
// rooms (climbed / waded / never), THE PARK RULE + the lights + the four hard
// tapes, the hub, the shell helper + the looks + check-terrain on all four.
'use strict';
const test = require('node:test');
const { heavy } = require('./test-heavy.js');   // 2026-09-18: the heavy geometry proofs run on `npm run test:full` / in CI
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { loadGameData } = require('./load-data');
const D = loadGameData(), HQ = D.DOOR_HQ;
const SITE = 'prebuilt_downtown', BOARD = 'site_prebuilt_downtown';
const SEWERS = BOARD + '_sewers', TUNNELS = BOARD + '_tunnels', CELLS = BOARD + '_cells', WORKINGS = BOARD + '_workings';
const STREETS = BOARD + '_streets', PLAT = BOARD + '_subway', DRAIN = 'site_prebuilt_fairy_forest_deadmans', OUB = 'site_prebuilt_hollow_earth_oubliette', STRIP = 'site_prebuilt_strip_streets';
const PARTS = { [SEWERS]: 'sewers', [TUNNELS]: 'tunnels', [CELLS]: 'cells', [WORKINGS]: 'workings' };
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
    c._hq.doors.push({ door, box: c._hqBoxWall(room, door.wall, door), y0: room.terrain ? D.hqTerrainDoorY(room, door) : 0 });
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

test('the sheet: four parts on Room 1954 — site + part, none numbered, every one a CLOSED terrain room wearing the underworld shell (hqSewerShell: brick, no strips, its own haze, a look), three on a `halls` plan with the BSP off (the culverts, the loop, the cell block are AUTHORED), the workings a `cave`; every plate reads DISASTER CITY · <place>; the register lists Downtown once and its complex is ten rooms', heavy, () => {
    for (const id of IDS) {
        const r = HQ.rooms[id];
        assert.ok(r && r.kind === 'box' && r.site === SITE && r.part === PARTS[id], id + ': a box room wearing site + part');
        assert.equal(D.hqComplexRoomId(SITE, PARTS[id]), id);
        assert.equal(r.roomNo, undefined, id + ' wears no number');
        assert.equal(D.hqRoomNo(id), HQ.thresholds[SITE].roomNo, id + ': hqRoomNo reads 1954 through site');
        assert.equal(D.hqRoomSite(id), SITE, id + ' is WILD');
        assert.ok(/^DISASTER CITY · /.test(r.label) && r.sub && r.spawn && Array.isArray(r.lines) && r.lines.length >= 3, id + ': plate, spawn, lines');
        assert.ok(r.terrain && !r.cave && D.hqTerrainInfo(id), id + ': a terrain room');
        const S = r.shell;
        assert.ok(!S.open && S.strips === false && Array.isArray(S.lights) && S.lights.length === 0 && S.mood && S.fog && S.fog.density > 0 && S.ceilTile === 1.75, id + ': closed, no strips, no fluorescents, a haze — the room lights itself');
        assert.ok(S.look && S.look.name, id + ': a look');
        assert.equal(r.terrain.crag, false, id + ': no crag (the walls are the plan’s / the brick’s)');
        assert.ok(!r.doors.some(d => (HQ.catalogue[d.leaf] || {}).rank), id + ': no rank leaf');
        assert.ok(r.doors.length >= 2, id + ': two ways out (the cycle rule at the complex’s scale)');
        for (const d of r.doors) for (const o of r.doors) if (o !== d && o.wall === d.wall && d.wall !== 'free') assert.ok(Math.abs((d.x != null ? d.x : d.z) - (o.x != null ? o.x : o.z)) >= 4.4, id + ': ' + d.id + ' and ' + o.id + ' share a lane');
    }
    for (const id of [SEWERS, TUNNELS, CELLS]) { const g = HQ.rooms[id].terrain.gen; assert.ok(g.kind === 'halls' && g.bsp === false && g.halls.length >= 1 && g.rooms.length >= 3, id + ': authored halls + rooms, the BSP off'); }
    assert.equal(HQ.rooms[WORKINGS].terrain.gen.kind, 'cave'); assert.equal(HQ.rooms[WORKINGS].terrain.cliff, 'bricks_2', 'a cave somebody bricked');
    assert.equal(HQ.rooms[CELLS].terrain.gen.minDegree, 1, 'a cell has one door');
    assert.equal(HQ.rooms[SEWERS].shell.look, D.HQ_ROOM_LOOKS.sewers); assert.equal(HQ.rooms[TUNNELS].shell.look, D.HQ_ROOM_LOOKS.tunnels);
    assert.equal(HQ.rooms[CELLS].shell.look, D.HQ_ROOM_LOOKS.cells); assert.equal(HQ.rooms[WORKINGS].shell.look, D.HQ_ROOM_LOOKS.workings);
    const reg = D.hqRoomRegister();
    assert.equal(reg.filter(r => r.mapId === SITE).length, 1, 'the register lists Downtown once');
    assert.ok(!reg.some(r => IDS.includes(r.id) || IDS.includes(r.room)), 'no part is a register entry');
    assert.equal(D.hqSiteComplex(SITE).length, 11, 'the board room, six city parts (the showroom since 2026-09-21) and the four underworld parts');
});

test('THE WEENIES: THE OUTFALL SHAFT at the main culvert’s east end wears the bulb (the one lit thing down the culvert); the lit train stands in THE DEPOT at the hatch’s end; THE SIGNAL GANTRY stands at the crossing; the bulb over THE CHIMNEY is the workings’ daylight; THE VENT STACK stands in the guardroom', () => {
    const shaft = HQ.rooms[SEWERS].terrain.features.find(f => f.k === 'plateau' && f.r && f.h === 4.4);
    assert.ok(shaft && HQ.rooms[SEWERS].props.some(p => p.key === 'bare_bulb' && p.x === shaft.x && p.z === shaft.z), 'the outfall shaft, lit from above');
    const main = HQ.rooms[SEWERS].terrain.gen.halls.find(h => h.id === 'main'), end = main.pts[main.pts.length - 1];
    assert.ok(Math.hypot(shaft.x - end[0], shaft.z - end[1]) < 9, 'at the main culvert’s east end');
    const trains = HQ.rooms[TUNNELS].props.filter(p => p.key === 'train_car'), depot = HQ.rooms[TUNNELS].terrain.gen.rooms.find(r => r.id === 'depot');
    assert.ok(trains.length === 2 && trains.every(t => Math.abs(t.x - depot.x) < depot.w / 2 && Math.abs(t.z - depot.z) < depot.d / 2) && HQ.catalogue.train_car.glow, 'two cars in the depot, lit');
    const gantry = HQ.rooms[TUNNELS].terrain.features.find(f => f.k === 'plateau' && f.r && f.h === 5.2);
    assert.ok(gantry && gantry.x === 0 && gantry.z === 0 && HQ.rooms[TUNNELS].terrain.gen.rooms.some(r => r.id === 'crossing' && r.x === 0 && r.z === 0), 'the gantry at the crossing');
    const chimney = HQ.rooms[WORKINGS].terrain.features.find(f => f.k === 'plateau' && f.r && f.h === 3.9);
    assert.ok(chimney && HQ.rooms[WORKINGS].props.some(p => p.key === 'bare_bulb' && p.x === chimney.x && p.z === chimney.z), 'daylight down the chimney');
    const stack = HQ.rooms[CELLS].terrain.features.find(f => f.k === 'plateau' && f.r && f.h === 3.6), guard = HQ.rooms[CELLS].terrain.gen.rooms.find(r => r.id === 'guard');
    assert.ok(stack && Math.abs(stack.x - guard.x) < guard.w / 2 && Math.abs(stack.z - guard.z) < guard.d / 2, 'the vent stack in the guardroom');
});

test('THE SEAMS + THE ROUTES: THE PUMPING STATION on Downtown’s east wall pairs with the sewers’ pump door (its alley a path); the Strip’s gutter drops into the sewers (a `way`, free on the back lane’s east kerb; the far end a barred grate); the sewers open on the storm drain; the running tunnels join the Works’ platform and Downtown’s platform past their track ends; the cells open on Room 24601 and the workings on the oubliette; every link live, explained, on its line; the sewers line, the subway line and the undercroft call at Downtown', () => {
    const pump = at(STREETS, 'sewer'), back = at(SEWERS, 'pump');
    assert.ok(pump && pump.wall === 'e' && pump.z === -20 && pump.wide === true && pump.action.room === SEWERS && pump.action.at === 'pump', 'the pumping station');
    assert.ok(back && back.wall === 'n' && back.x === -20 && back.action.room === STREETS && back.action.at === 'sewer' && back.leaf === pump.leaf, 'the pair');
    assert.ok(HQ.rooms[STREETS].terrain.features.some(f => f.k === 'path' && f.pts[0][0] === 40 && f.pts[0][1] === -20 && f.pts[f.pts.length - 1][0] >= 112 && f.pts[f.pts.length - 1][1] === -20), 'the alley to it');   // AREA CONTENT D2 (2026-09-19): the alley doglegs to the east wall (R3)
    const ends = {
        strip_sewer:        ['a', STRIP, 'free', null, 'gutter', 'b', SEWERS, 'w', 20],
        sewers_drain:       ['a', SEWERS, 'e', -12, null, 'b', DRAIN, 's', -10],
        tunnels_works:      ['a', TUNNELS, 'w', -16, null, 'b', 'tunnel', 'w', -16],
        tunnels_platform:   ['a', TUNNELS, 'e', -14, null, 'b', PLAT, 'w', -13.5],
        cells_dungeon:      ['a', CELLS, 'w', -11, null, 'b', 'dungeon', 's', -2.8],
        workings_oubliette: ['a', WORKINGS, 'w', 0, null, 'b', OUB, 'e', 0],
    };
    for (const [id, [sa, ra, wa, xa, way, sb, rb, wb, xb]] of Object.entries(ends)) {
        const l = HQ.links.find(x => x.id === id);
        assert.ok(l && D.hqLinkLive(l) && l.why && l.route, id + ' is live and explained');
        assert.ok(['sewers', 'subway', 'dungeons'].includes(l.route), id + ' on the sewers / subway / dungeons line');
        assert.equal(D.hqLinkRoom(l[sa]), ra); assert.equal(D.hqLinkRoom(l[sb]), rb);
        const da = at(ra, 'link_' + id), db = at(rb, 'link_' + id);
        assert.ok(da && da.wall === wa && db && db.wall === wb, id + ': both doors generated');
        if (wa !== 'free') assert.equal(da[(wa === 'n' || wa === 's') ? 'x' : 'z'], xa);
        assert.equal(db[(wb === 'n' || wb === 's') ? 'x' : 'z'], xb);
        if (way) { assert.equal(da.way, way, id + ' wears the ' + way); assert.ok(db.leaf && !db.way, id + ': the far end a plain door (the storm drain’s rule)'); }
        else if (l.secret) assert.ok(da.secret && db.secret && da.leaf == null && db.leaf == null, id + ': a draught at both ends (AREA CONTENT D4)');
        else assert.ok(da.leaf === db.leaf && da.leaf, id + ': one leaf both sides');
        assert.ok(da.action.room === rb && db.action.room === ra, id + ': the pair');
        assert.ok(!(HQ.catalogue[da.leaf] || {}).rank && !(HQ.catalogue[db.leaf] || {}).rank, id + ': never a rank leaf');
    }
    assert.ok(at(STRIP, 'link_strip_sewer').x === 42.2 && at(STRIP, 'link_strip_sewer').face === 270, 'the gutter on the back lane’s east kerb, facing the lane');
    assert.ok(at(SEWERS, 'link_strip_sewer').verb === 'CLIMB UP' && at(SEWERS, 'link_strip_sewer').leaf === 'leaf_cell');
    const R = D.hqWorldRoutes('foyer');
    assert.ok(R.find(r => r.id === 'sewers').stations.some(s => s.site === SITE) && R.find(r => r.id === 'sewers').stations.some(s => s.site === 'prebuilt_strip'), 'THE SEWERS calls at Downtown and the Strip');
    const sub = R.find(r => r.id === 'subway');
    assert.ok(sub.legs.some(l => l.fromRoom === TUNNELS || l.toRoom === TUNNELS) && sub.legs.filter(l => l.fromRoom === TUNNELS || l.toRoom === TUNNELS).length === 2, 'the subway line runs through the running tunnels twice (the Works, the platform)');
    const uc = R.find(r => r.id === 'dungeons');
    assert.ok(uc && uc.legs.length === 2 && uc.legs.some(l => l.fromRoom === CELLS || l.toRoom === CELLS) && uc.legs.some(l => l.fromRoom === WORKINGS || l.toRoom === WORKINGS), 'THE DUNGEONS line calls at the cells and the workings');
    assert.ok(!R.find(r => r.id === 'undercroft').legs.some(l => [CELLS, WORKINGS].includes(l.fromRoom) || [CELLS, WORKINGS].includes(l.toRoom)), 'never on THE UNDERCROFT (every leg of that line touches Hollow Earth)');
    assert.ok(!HQ.rooms[BOARD].doors.some(d => d.link), 'the bypassed board still carries no link door');
});

test('ONE PIECE + THE CYCLE: from the pumping station every part is walked; every inside door is a pair with the same opening; nothing leaves the site but a links row or the pumping station; sewers → tunnels; sewers → cells → workings → sewers', () => {
    const seen = new Set(), queue = [SEWERS];
    while (queue.length) {
        const id = queue.shift(); if (seen.has(id)) continue; seen.add(id);
        for (const d of HQ.rooms[id].doors) {
            const a = d.action || {};
            assert.ok(a.room && HQ.rooms[a.room], id + '/' + d.id + ' leads to a room');
            if (d.link) { assert.ok(HQ.links.some(l => l.id === d.link), id + '/' + d.id + ' is a links row'); const f = at(a.room, a.at); assert.ok(f && f.link === d.link, id + '/' + d.id + ': the far end pairs'); continue; }
            const other = at(a.room, a.at);
            assert.ok(other && other.action.room === id && other.action.at === d.id, id + '/' + d.id + ' ⇄ ' + a.room + ' is a pair');
            assert.equal(other.leaf, d.leaf, 'the same opening on both sides of ' + d.id);
            if (a.room === STREETS) { assert.equal(d.id, 'pump'); continue; }
            assert.ok(IDS.includes(a.room), id + '/' + d.id + ' stays inside the underworld');
            queue.push(a.room);
        }
    }
    assert.equal(Array.from(seen).sort().join(','), IDS.slice().sort().join(','), 'every part is walked');
    assert.ok(at(SEWERS, 'hatch').action.room === TUNNELS && at(TUNNELS, 'sewers').action.room === SEWERS, 'sewers ⇄ tunnels');
    assert.ok(at(SEWERS, 'drain').action.room === CELLS && at(CELLS, 'trap').action.room === WORKINGS && at(WORKINGS, 'sewers').action.room === SEWERS, 'the cycle: sewers → cells → workings → sewers');
});

test('THE PLANS: the sewers’ four chambers and seven culverts are open (a channel down every culvert’s middle, waded, the walkways dry), the cistern deep, THE PLANK over it; the loop line, the crossover and the three rooms of the tunnels open, the rails low walls; six cells each with ONE corridor (the readout lists the six cells as dead ends — and any room whose tree edge is a stub onto a hall inside it; the halls carry the ways), the guardroom, the tank and the property room joined; the mass to the ceiling, traced walls; the workings a brick cave, the flood waded, the sump never', () => {
    const si = D.hqTerrainInfo(SEWERS), sg = HQ.rooms[SEWERS].terrain.gen;
    for (const r of sg.rooms) for (const [dx, dz] of [[0, 0], [0.4, 0.4], [-0.4, -0.4], [0.4, -0.4], [-0.4, 0.4]]) assert.ok(D.hqTerrainMaskAt(si, r.x + dx * r.w, r.z + dz * r.d) > 0.25, SEWERS + ': ' + r.id + ' is open to its corners');
    for (const h of sg.halls) for (const pt of h.pts) assert.ok(D.hqTerrainMaskAt(si, pt[0], pt[1]) > 0.3, SEWERS + ': the ' + h.id + ' culvert open at ' + pt.join(','));
    assert.ok(si.gen.solidMass && si.solidTop && si.gen.wallH === HQ.rooms[SEWERS].shell.h && si.planWalls.length >= 60, 'the sewers’ mass to the ceiling, traced walls');
    assert.equal(si.fluids.filter(f => f.key === 'deep_water').length, 1, 'one deep pool: the cistern');
    assert.ok(si.fluids.length >= 6, 'the channels and the basins');
    assert.equal(si.genPlan.deadEnds.length, 0, 'THE CYCLE RULE in the sewers');
    const [, sR] = reachFrom(SEWERS, 'pump');
    assert.ok(D.hqTerrainFeet(si, -30, 8, null) != null && D.hqTerrainFeet(si, -30, 8, null) < -0.5, 'the main channel is waded');
    assert.ok(D.hqTerrainFeet(si, -30, 5.2, null) != null && D.hqTerrainFeet(si, -30, 5.2, null) > -0.2, 'the walkway beside it is dry');
    assert.equal(D.hqTerrainFeet(si, 27, 20, null), null, 'the cistern is never entered (beside the plank)');
    assert.ok(sR.has(key(si, 24, 20)) && sR.get(key(si, 24, 20)) > -0.2, 'THE PLANK is walked over it');
    const ti = D.hqTerrainInfo(TUNNELS), tg = HQ.rooms[TUNNELS].terrain.gen;
    for (const r of tg.rooms) assert.ok(D.hqTerrainMaskAt(ti, r.x, r.z) > 0.25, TUNNELS + ': ' + r.id + ' open');
    for (const h of tg.halls) for (const pt of h.pts) assert.ok(D.hqTerrainMaskAt(ti, pt[0], pt[1]) > 0.3, TUNNELS + ': ' + h.id + ' open at ' + pt.join(','));
    assert.equal(ti.walls.filter(w => w.h === 0.14).length, 12, 'twelve rails');
    assert.ok(ti.gen.solidMass && ti.planWalls.length >= 60 && ti.genPlan.deadEnds.length === 0, 'the tunnels’ mass, traced walls, no dead ends');
    const ci = D.hqTerrainInfo(CELLS), cg = HQ.rooms[CELLS].terrain.gen;
    const cells = cg.rooms.filter(r => /^c\d$/.test(r.id));
    assert.equal(cells.length, 6);
    for (const c of cells) assert.ok(D.hqTerrainMaskAt(ci, c.x, c.z) > 0.25 && D.hqTerrainMaskAt(ci, c.x, c.z - 1.5) > 0.2, CELLS + ': ' + c.id + ' open');
    assert.ok(ci.genPlan.deadEnds.length >= 6 && ci.genPlan.deadEnds.length <= cg.rooms.length, 'the tree’s dead ends are the six cells (one door each, by design) and whichever other rooms took a stub onto a hall inside them — the halls carry the ways (' + ci.genPlan.deadEnds.length + ')');
    for (const c of cells) assert.ok(ci.genPlan.deadEnds.includes(ci.genPlan.rooms.findIndex(r => r.id === c.id)), c.id + ' is a dead end');
    const guard = cg.rooms.find(r => r.id === 'guard'), inGuard = pt => Math.abs(pt[0] - guard.x) <= guard.w / 2 && Math.abs(pt[1] - guard.z) <= guard.d / 2;
    assert.equal(cg.halls.filter(h => h.pts.some(inGuard)).length, 3, 'the guardroom is the hub: the west passage, the east passage and the stair all end inside it');
    const deg = new Array(ci.genPlan.rooms.length).fill(0); ci.genPlan.edges.forEach(e => { if (e[0] < deg.length) deg[e[0]]++; if (e[1] < deg.length) deg[e[1]]++; });
    ci.genPlan.rooms.forEach((r, i) => { if (/^c\d$/.test(r.id)) assert.equal(deg[i], 1, r.id + ' has one corridor'); });
    assert.ok(cg.halls.length === 4 && cg.loops === 0, 'the loop is the two authored side halls, never the generator’s (it would join two adjacent cells)');
    for (const h of cg.halls) for (const pt of h.pts) assert.ok(D.hqTerrainMaskAt(ci, pt[0], pt[1]) > 0.3, CELLS + ': ' + h.id + ' open at ' + pt.join(','));
    assert.ok(ci.gen.solidMass && ci.planWalls.length >= 40, 'the cells’ mass, traced walls');
    const wi = D.hqTerrainInfo(WORKINGS);
    assert.ok(wi.gen.kind === 'cave' && wi.gen.wallH === HQ.rooms[WORKINGS].shell.h, 'the workings: a cave bricked to the ceiling');
    assert.ok(D.hqTerrainFeet(wi, 6, 3, null) != null && D.hqTerrainFeet(wi, 6, 3, null) < -0.5, 'THE FLOOD is waded');
    assert.equal(D.hqTerrainFeet(wi, -14, 9, null), null, 'THE SUMP is never entered');
    for (const id of IDS) { const info = D.hqTerrainInfo(id); assert.ok(info.gen.open >= (D.HQ_TERRAIN_GEN[info.gen.kind].minOpen || D.HQ_TERRAIN_GEN.minOpen), id + ': open share ' + info.gen.open); }
});

test('THE SOLVER + THE RETURN GUARANTEE + THE PRODUCTION LANDING: every door reaches every other under the walker’s rule, nothing traps, every ramp tops out on reached ground under the tread rule, every landing is inside, level, faces the doorway and stands clear of every prop and native; natives and props on open ground; a plan room hangs nothing on the shell', heavy, () => {
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
        assert.ok(D.hqTerrainFeet(info, sp.x, sp.z, null) != null && D.hqTerrainMaskAt(info, sp.x, sp.z) > 0.3 && R0.has(key(info, sp.x, sp.z)), id + ': the spawn stands on open, reached ground');
        for (const n of room.npcSpots) { assert.ok(D.AVAILABLE_RACES.includes(n.race), id + ': native race ' + n.race); assert.ok(Array.isArray(n.say) && n.say.length >= 1, id + ': a native says'); assert.ok(D.hqTerrainFeet(info, n.x, n.z, null) != null && D.hqTerrainMaskAt(info, n.x, n.z) > 0.2, id + ': native on open ground at ' + n.x + ',' + n.z); }
        for (const p of room.props) { assert.ok(HQ.catalogue[p.key], id + ': prop ' + p.key); if (p.wall || p.ceil || (HQ.catalogue[p.key] || {}).ceil) continue; assert.ok(D.hqTerrainFeet(info, p.x, p.z, null) != null, id + ': prop ' + p.key + ' on no ground at ' + p.x + ',' + p.z); }
        assert.ok(!room.props.some(p => typeof p.wall === 'string'), id + ': a plan / cave room hangs nothing on the shell');
    }
    /* the far ends of the seams stand on their own rooms’ floors: the storm drain’s south wall, the Works’ and Downtown’s platforms past their track ends, the dungeon’s south wall, the oubliette’s east wall */
    for (const [room, id] of [[DRAIN, 'link_sewers_drain'], ['tunnel', 'link_tunnels_works'], [PLAT, 'link_tunnels_platform'], ['dungeon', 'link_cells_dungeon'], [OUB, 'link_workings_oubliette'], [STREETS, 'sewer'], [STRIP, 'link_strip_sewer']]) {
        const r = HQ.rooms[room], door = at(room, id); assert.ok(door, room + '/' + id);
        const h = landing(r, door), p = h.player;
        if (door.wall !== 'free') assert.ok(Math.abs(p.x) < r.shell.w / 2 - 0.4 && Math.abs(p.z) < r.shell.d / 2 - 0.4, room + '/' + id + ': inside');
        for (const q of [...(r.props || []), ...(r.npcSpots || [])]) assert.ok(!propBlocks(r, q, p.x, p.z, 0.35), room + '/' + id + ': ' + (q.key || q.race) + ' blocks the landing');
        if (r.terrain) { const info = D.hqTerrainInfo(room); const feet = D.hqTerrainFeet(info, p.x, p.z, null); assert.ok(feet != null && Math.abs(feet - p.y) < 0.12, room + '/' + id + ': the pad is level'); }
    }
});

test('THE ROOMS: the gallery over the confluence is climbed, the outfall shaft never; the ghost station’s platform is climbed, the gantry never; the catwalk is climbed, the vent stack never; the pump ledge is climbed, the chimney never; the cells are walked into', () => {
    const [si, sR] = reachFrom(SEWERS, 'pump');
    assert.ok(sR.has(key(si, 0, -8.4)) && Math.abs(sR.get(key(si, 0, -8.4)) - 1.6) < 0.2, 'THE INSPECTION GALLERY is climbed');
    assert.ok(!sR.has(key(si, 55, -18)) && D.hqTerrainHeight(si, 55, -18) > 4.2, 'THE OUTFALL SHAFT is the door gun’s');
    assert.ok(sR.has(key(si, -40, 22)) && sR.has(key(si, 52, -8)) && sR.has(key(si, -40, -10)), 'the pump room, the outfall basin’s edge, the cross drain');
    const [ti, tR] = reachFrom(TUNNELS, 'sewers');
    assert.ok(tR.has(key(ti, 0, 35)) && Math.abs(tR.get(key(ti, 0, 35)) - 1.0) < 0.2, 'THE GHOST STATION’s platform is climbed');
    assert.ok(!tR.has(key(ti, 0, 0)) && D.hqTerrainHeight(ti, 0, 0) > 5.0, 'THE SIGNAL GANTRY is the door gun’s');
    assert.ok(tR.has(key(ti, 0, -38)) && tR.has(key(ti, -52, 0)) && tR.has(key(ti, 52, 0)) && tR.has(key(ti, -20, -13.6)), 'the depot, both long legs, the crossover');
    assert.ok(tR.has(key(ti, 0, -30.5)) && Math.abs(tR.get(key(ti, 0, -30.5)) - 0.14) < 0.05 && tR.has(key(ti, 0, -30)) && tR.get(key(ti, 0, -30)) < 0.05, 'the rails are stepped over, not walls (0.14 on the rail, the floor between)');
    const [ci, cR] = reachFrom(CELLS, 'sewers');
    assert.ok(cR.has(key(ci, 8, -1)) && Math.abs(cR.get(key(ci, 8, -1)) - 2.2) < 0.2, 'THE CATWALK is climbed');
    assert.ok(!cR.has(key(ci, -6, -2)) && D.hqTerrainHeight(ci, -6, -2) > 3.4, 'THE VENT STACK is the door gun’s');
    for (const c of HQ.rooms[CELLS].terrain.gen.rooms.filter(r => /^c\d$/.test(r.id))) assert.ok(cR.has(key(ci, c.x, c.z)), c.id + ' is walked into');
    assert.ok(cR.has(key(ci, -20, 14)) && cR.has(key(ci, 18, 14)), 'the tank and the property room');
    const [wi, wR] = reachFrom(WORKINGS, 'trap');
    assert.ok(wR.has(key(wi, -14, -10)) && Math.abs(wR.get(key(wi, -14, -10)) - 1.4) < 0.2, 'THE PUMP LEDGE is climbed');
    assert.ok(!wR.has(key(wi, 16, -10)) && D.hqTerrainHeight(wi, 16, -10) > 3.7, 'THE CHIMNEY is the door gun’s');
    assert.ok(wR.has(key(wi, 6, 3)) && wR.get(key(wi, 6, 3)) < -0.5, 'THE FLOOD is waded through');
});

test('THE PARK RULE + THE LIGHT + THE HARD TAPES: a rail, a stair and a tier in every part; every part lights itself under the cap; one tape per part (four re-homed, the hundred kept, every donor keeps one) on a top the walker never reaches with a shot from reached ground; every envelope guarded', heavy, () => {
    const cap = vm.runInContext('typeof HQ_PROP_LIGHT_MAX !== "undefined" ? HQ_PROP_LIGHT_MAX : 10', D);
    for (const id of IDS) {
        const room = HQ.rooms[id], info = D.hqTerrainInfo(id), F = room.terrain.features;
        assert.ok(info.rails.length >= 1 && room.props.some(p => p.key === 'railing_1m'), id + ': a rail to grind');
        assert.ok(F.some(f => f.k === 'ramp' && f.stairs) && F.some(f => f.k === 'plateau'), id + ': a stair and a tier');
        const lit = room.props.filter(p => (HQ.catalogue[p.key] || {}).light).length;
        assert.ok(lit >= 4 && lit <= cap, id + ': ' + lit + ' lights');
    }
    assert.ok(HQ.rooms[SEWERS].props.some(p => p.key === 'quarter_pipe') && HQ.rooms[TUNNELS].props.some(p => p.key === 'quarter_pipe'), 'a quarter pipe in the pump room and the depot');
    const tapes = D.DOOR_TAPES;
    assert.equal(tapes.length, 100);
    for (const id of IDS) {
        assert.ok([1, 2].includes(tapes.filter(t => t.where === id).length) && (tapes.filter(t => t.where === id).length === 1 || Object.values(HQ.siteRooms.entry || {}).some(e => e.room === id)), id + ': one tape (two on the part that stands for a bypassed board — THE AREAS, 2026-09-18)');
        const rows = HQ.finds.filter(f => f.room === id), tape = rows.find(f => f.kind === 'tape'), pay = rows.find(f => f.kind === 'pay');
        assert.ok(tape && pay && pay.guard === true, id + ': a tape and a guarded envelope');
        assert.ok(tape.hard === true && tape.y >= 3.5, id + ': the tape is the door gun’s (' + tape.y + ' m)');
        const pin = HQ.findSpots[id];
        assert.ok(pin && pin.tape && tape.x === pin.tape.x && tape.z === pin.tape.z, id + ': the tape stands on its pin');
        const info = D.hqTerrainInfo(id), L0 = D.hqTerrainDoorLanding(HQ.rooms[id], HQ.rooms[id].doors[0]), reach = D.hqTerrainReach(info, L0.x, L0.z);
        assert.ok(!reach.has(key(info, tape.x, tape.z)), id + ': the walker never reaches it');
        assert.ok(D.hqFindHardReachTerrain(tape, { terrain: info, reach, S: HQ.rooms[id].shell }).ok, id + ': the door gun has a shot at its lip');
    }
    for (const site of ['prebuilt_dumb', 'prebuilt_hollow_earth', 'prebuilt_haunted', 'prebuilt_lodge']) assert.equal(tapes.filter(t => t.where === 'site_' + site).length, 1, site + ' gave its second tape');
    for (const [id, title] of [[SEWERS, 'THE OUTFALL'], [TUNNELS, 'THE HEADLIGHT'], [CELLS, 'THE DRUNK TANK'], [WORKINGS, 'THE WELL, FROM UNDER']]) assert.ok(tapes.some(t => t.where === id && t.title === title), title);
});

test('THE HUB: THE UNDERWORLD claims its four rooms BY ID (an explicit `rooms` list beats the site rule — the city keeps the streets, the lobby, the platform, the mall and the closet); the sewers are the anchor; the graph and the model carry it; a question mark gives no hub away', () => {
    const H = HQ.hubs.underworld;
    assert.ok(H && H.room === SEWERS && H.rooms.length === 4 && IDS.every(id => H.rooms.includes(id)) && !H.sites && H.color, 'the hub row');
    for (const id of IDS) { const h = D.hqHubOf(id); assert.ok(h && h.id === 'underworld' && h.anchor === (id === SEWERS), id + ' is the underworld’s'); }
    for (const id of [STREETS, PLAT, BOARD + '_lobby', BOARD + '_mall', BOARD + '_closet']) assert.equal(D.hqHubOf(id).id, 'city', id + ' stays the city’s');
    assert.equal(D.hqHubOf(DRAIN).id, 'woods'); assert.equal(D.hqHubOf(OUB).id, 'cavern'); assert.equal(D.hqHubOf('dungeon').id, 'hq');
    const G = D.hqMapGraph();
    assert.equal(G.nodes[SEWERS].hub, 'underworld'); assert.equal(G.nodes[TUNNELS].hubOf, 'underworld'); assert.equal(G.nodes[STREETS].hubOf, 'city');
    for (const id of IDS) assert.ok(G.nodes[id], id + ' is on the map (reached from the foyer along doors)');
    const M = D.hqMapModel(null, 'foyer', { all: true });
    assert.ok(M.nodes.some(n => n.id === SEWERS && n.hub), 'the anchor drawn big');
});

test('the shell helper, the looks, the source sites; check-terrain solves all four', heavy, () => {
    const S = D.hqSewerShell({ w: 10, d: 12 });
    assert.ok(!S.open && S.w === 10 && S.d === 12 && S.wall === 'bricks_2' && S.strips === false && S.lights.length === 0 && S.fog.density > 0 && S.ceilTile === 1.75 && S.look === D.HQ_ROOM_LOOKS.sewers, 'hqSewerShell');
    assert.ok(/window\.hqSewerShell = hqSewerShell;/.test(data), 'on window');
    for (const k of ['sewers', 'tunnels', 'cells', 'workings']) { const L = D.HQ_ROOM_LOOKS[k]; assert.ok(L && L.name && L.retro && L.cin && typeof L.bloom === 'number', 'look ' + k); }
    assert.ok(/for \(const id of Object\.keys\(H\)\) \{ const h = H\[id\]; if \(\(h\.rooms \|\| \[\]\)\.indexOf\(roomId\) >= 0\)/.test(data), 'hqHubOf reads `rooms` first');
    const { spawnSync } = require('node:child_process');
    const r = spawnSync(process.execPath, ['check-terrain.js', '--json', ...IDS], { cwd: __dirname, encoding: 'utf8' });
    assert.equal(r.status, 0, r.stderr);
    const rows = JSON.parse(r.stdout);
    assert.equal(rows.length, 4);
    for (const row of rows) { assert.equal(row.unreached.length, 0, row.id + ': every door reached'); assert.equal(row.traps.length, 0, row.id + ': nothing traps'); if (row.plan && row.plan.kind === 'halls' && row.id !== CELLS) assert.equal(row.plan.deadEnds, 0, row.id + ': no dead ends'); }
});
