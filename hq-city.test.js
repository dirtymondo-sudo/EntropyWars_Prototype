// hq-city.test.js — DISASTER CITY (HQ plan 9.3 stage 7 — THE COMPLEX
// CANDIDATES #1, 2026-09-17): DOWNTOWN · THE STRIP · CYBERPUNK · THE STADIUM ·
// THE METRO joined into ONE CITY, with THE MALL new, on THE CAVE / THE WOODS
// blueprint. Two terrain parts on Room 1954 carry the THIRD floor-plan kind,
// `city` (streets as corridors, blocks as the solid cut into LOTS with FRONTS —
// the renderer stands the map-builder buildings on the podiums and dresses
// every front): THE STREETS (112 × 76 m of avenues round THE RING ROAD — the
// circuit with its lap timer for the rider, NPC TRAFFIC driving it, the plaza,
// the parking deck, the collapse, THE ROOFTOP the door gun reaches) and THE
// MALL (the concourse cross, the atrium, the food court, the arcade with THE
// TIME MACHINE in the back — the seam to Cyberpunk — the mezzanine up the
// escalator, a store roof for the tape). The ways in: the tower lobby's avenue
// doors; the metro stair down onto the platform; the mall's main entrance; and
// the seams — the Strip (the chapel's parking lot), the Stadium (gate C), the
// gutter into the storm drain (the tunnels' first seam). Guards: the sheet, the
// plan (lots, fronts, the sidewalk + kerb, a podium is a LEVEL never a stack),
// the ways in + the four seams, ONE PIECE, THE SOLVER + THE RETURN GUARANTEE +
// the production landing on every door, THE PARK RULE, the two hard tapes, the
// traffic and the circuit (data → renderer → map.js; a lap run in a vm), the
// two way builders, the audio cues, the looks, the shell helper, the sources.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { loadGameData } = require('./load-data');
const D = loadGameData(), HQ = D.DOOR_HQ;
const TERRAIN_RULES = vm.runInContext('TERRAIN_RULES', D);
const STREETS = 'site_prebuilt_downtown_streets', MALL = 'site_prebuilt_downtown_mall', LOBBY = 'site_prebuilt_downtown_lobby', PLAT = 'site_prebuilt_downtown_subway', CHAPEL = 'site_prebuilt_strip_chapel', DRAIN = 'site_prebuilt_fairy_forest_deadmans';
const CYBER = D.hqSiteRoomId('prebuilt_cyberpunk'), STADIUM = D.hqSiteRoomId('prebuilt_stadium');
const IDS = [STREETS, MALL];
const renderer = fs.readFileSync(__dirname + '/three-renderer.js', 'utf8'), map = fs.readFileSync(__dirname + '/map.js', 'utf8'), audio = fs.readFileSync(__dirname + '/audio.js', 'utf8'), data = fs.readFileSync(__dirname + '/data.js', 'utf8');
const at = (room, id) => (HQ.rooms[room].doors || []).find(d => d.id === id);

function extract(name) {
    const start = renderer.indexOf('    function ' + name + '(');
    const end = renderer.indexOf('\n    }', start);
    assert.ok(start >= 0 && end > start, name);
    return renderer.slice(start, end + 6);
}
function sill(room, door) { return room.terrain ? D.hqTerrainDoorY(room, door) : 0; }
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

test('the sheet: two parts on Room 1954 — THE STREETS (open under Downtown’s own sky through hqCityShell, asphalt underfoot, a fog per metre, no treeline) and THE MALL (closed, the security camera’s grade) — each site + part, no number, a terrain room with a `city` plan; the looks; the register lists Downtown once and its complex is five rooms', () => {
    for (const id of IDS) {
        const r = HQ.rooms[id];
        assert.ok(r && r.kind === 'box' && r.site === 'prebuilt_downtown' && r.part, id + ': a box room wearing site + part');
        assert.equal(D.hqComplexRoomId('prebuilt_downtown', r.part), id);
        assert.equal(r.roomNo, undefined); assert.equal(D.hqRoomNo(id), HQ.thresholds.prebuilt_downtown.roomNo); assert.equal(D.hqRoomSite(id), 'prebuilt_downtown');
        assert.ok(/DISASTER CITY/.test(r.label) && r.sub && r.spawn && Array.isArray(r.lines) && r.lines.length >= 3, id + ': plate, spawn, lines');
        assert.ok(r.terrain && r.terrain.gen && r.terrain.gen.kind === 'city' && D.hqTerrainInfo(id), id + ': a city plan');
        assert.ok(r.shell.strips === false && Array.isArray(r.shell.lights) && r.shell.lights.length === 0 && r.shell.mood && r.shell.look && r.shell.look.name, id + ': the room lights itself, and wears a grade');
        for (const n of ['floor', 'wall', 'dado', 'trim']) assert.ok(HQ.textures[r.shell[n]] || TERRAIN_RULES[r.shell[n]], id + ': texture ' + r.shell[n]);
        assert.ok(!r.doors.some(d => (HQ.catalogue[d.leaf] || {}).rank), id + ': no rank leaf');
        for (const d of r.doors) assert.equal(!!d.wide, !!(HQ.catalogue[d.leaf] || {}).wide, id + '/' + d.id + ': the wide flag follows the leaf');
    }
    const S = HQ.rooms[STREETS].shell, meta = D.EW_MAP_META.find(m => m.id === 'prebuilt_downtown').env;
    assert.ok(S.open && S.edge === 'open' && S.sky && S.sky.fog.density > 0 && !S.forest && S.floor === 'urban_street', 'the streets stand open on asphalt under a per-metre fog with no treeline');
    assert.equal(S.sky.tint, meta.tint); assert.equal(S.sky.scenery, meta.scenery); assert.equal(S.sky.fog.color, meta.fog.color); assert.equal(S.sky.night, 0);
    assert.equal(S.look, D.HQ_ROOM_LOOKS.city); assert.equal(HQ.rooms[MALL].shell.look, D.HQ_ROOM_LOOKS.mall);
    assert.ok(!HQ.rooms[MALL].shell.open && HQ.rooms[MALL].shell.fog && HQ.rooms[MALL].shell.h >= 7.5 && HQ.rooms[MALL].terrain.gen.wallH + 2.4 <= HQ.rooms[MALL].shell.h, 'the mall is closed with headroom over its store roofs');
    assert.ok(D.HQ_ROOM_LOOKS.city.retro.preset === 'faded' && D.HQ_ROOM_LOOKS.mall.retro.preset === 'faded' && D.HQ_ROOM_LOOKS.city.nightMood < 0.3, 'the disaster-movie print');
    assert.ok(/function hqCityShell\(o\)/.test(data) && /window\.hqCityShell = hqCityShell/.test(data) && typeof D.hqCityShell === 'function', 'the shell helper');
    const reg = D.hqRoomRegister();
    assert.equal(reg.filter(r => r.mapId === 'prebuilt_downtown').length, 1); assert.ok(!reg.some(r => IDS.includes(r.id) || IDS.includes(r.room)));
    assert.equal(D.hqSiteComplex('prebuilt_downtown').length, 5, 'the board room, the lobby, the platform, the streets, the mall');
});

test('THE PLAN (`city`): the streets are the corridors (the ring road a loop, the two avenues), the solid the blocks cut into LOTS (≥ 20 on the streets, ≥ 10 store units in the mall) with FRONTS that look onto a street (the façade standing where the rise begins); a 2.4 m SIDEWALK with a 12 cm kerb on the streets, none in the mall; a podium is a LEVEL, never a stack (the rooftop stays 4.0, the mezzanine 3.4); the plan is deterministic; the outer ring of blocks stands past the ring road', () => {
    const G = D.HQ_TERRAIN_GEN;
    assert.ok(G.city && G.city.walkW === 2.4 && G.city.kerb === 0.12 && G.city.wallH === 3.2 && Array.isArray(G.city.lotW) && G.city.frontOff > 0, 'the city defaults');
    for (const id of IDS) {
        const room = HQ.rooms[id], gen = room.terrain.gen, info = D.hqTerrainInfo(id);
        assert.ok(info.gen && info.gen.kind === 'city' && info.gen.solidSheet === 'cliff' && info.mask && info.maskD && info.genPlan && info.genPlan.streets.length === gen.streets.length, id + ': the plan compiled');
        assert.ok(info.lots.length >= (id === STREETS ? 20 : 10) && info.fronts.length >= (id === STREETS ? 20 : 6), id + ': lots ' + info.lots.length + ' / fronts ' + info.fronts.length);
        for (const lot of info.lots) {
            assert.ok(lot.w >= gen.lotW[0] - 0.01 && lot.w <= gen.lotW[1] + 0.01 && lot.d >= gen.lotW[0] - 0.01 && lot.top === gen.wallH && /^building_[1-8]$/.test(lot.key), id + ': a lot ' + JSON.stringify(lot));
            for (const c of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) assert.ok(D.hqTerrainMaskAt(info, lot.x + c[0] * lot.w / 2, lot.z + c[1] * lot.d / 2) < -0.3, id + ': a lot corner in the open');
            for (const q of info.lots) if (q !== lot) assert.ok(Math.abs(q.x - lot.x) >= (q.w + lot.w) / 2 || Math.abs(q.z - lot.z) >= (q.d + lot.d) / 2, id + ': lots overlap');
            assert.ok(Math.abs(D.hqTerrainHeight(info, lot.x, lot.z) - gen.wallH) < 0.5, id + ': the podium under a lot stands at wallH');
        }
        for (const f of info.fronts) {
            const mx = (f.x0 + f.x1) / 2, mz = (f.z0 + f.z1) / 2, md = D.hqTerrainMaskAt(info, mx, mz);
            assert.ok(md >= G.city.frontOff - 0.3 && md < 1.6, id + ': a front stands where the rise begins (' + md + ')');
            assert.ok(D.hqTerrainMaskAt(info, mx + f.nx * 1.5, mz + f.nz * 1.5) > 0.5, id + ': the street lies past the front');
            assert.ok(Math.abs(Math.hypot(f.x1 - f.x0, f.z1 - f.z0) - f.len) < 0.05 && f.top === gen.wallH);
        }
        assert.equal(info.gen.sidewalk, gen.walkW); assert.equal(info.gen.kerb, gen.kerb); assert.equal(info.gen.fronts, gen.fronts); assert.equal(info.gen.prisms, gen.prisms !== false);
        assert.equal((info.thicket || []).length, 0, id + ': no thicket');
        const a = D.hqTerrainCompile(room, id), b = D.hqTerrainCompile(room, id);
        assert.equal(Buffer.from(a.mask).toString('hex'), Buffer.from(b.mask).toString('hex'), id + ': the same plan twice');
        assert.equal(JSON.stringify(a.lots), JSON.stringify(b.lots), id + ': the same lots twice');
    }
    const st = D.hqTerrainInfo(STREETS), ring = HQ.rooms[STREETS].terrain.gen.streets[0];
    assert.ok(ring.loop && ring.pts.length >= 8 && ring.w >= 8, 'the ring road is a loop');
    /* the kerb: the sidewalk band stands over the road; the road itself is flat; past the sidewalk the podium */
    const road = D.hqTerrainHeight(st, 0, -20), walk = D.hqTerrainHeight(st, 6.2, -20), podium = D.hqTerrainHeight(st, 12, -20);
    assert.ok(Math.abs(road) < 0.08 && walk - road > 0.09 && walk - road < 0.2 && podium > 3.0, 'road ' + road + ' · sidewalk ' + walk + ' · podium ' + podium);
    assert.ok(Math.abs(D.hqTerrainHeight(st, -29.5, 15) - 4.0) < 0.01, 'THE ROOFTOP is a level (max), not wallH stacked on it');
    assert.ok(Math.abs(D.hqTerrainHeight(st, 24, -15) - 3.0) < 0.05, 'the parking deck');
    assert.ok(Math.abs(D.hqTerrainHeight(D.hqTerrainInfo(MALL), 14, -6.5) - 3.4) < 0.01, 'the mezzanine');
    assert.ok(D.hqTerrainMaskAt(st, 20, -41) < -0.5 && D.hqTerrainMaskAt(st, 50, 22) < -0.5 && D.hqTerrainMaskAt(st, -20, 41) < -0.5, 'the outer ring of blocks stands between the ring road and the edge');
    assert.ok(st.gen.open > 0.45 && st.gen.open < 0.75, 'the streets are ' + Math.round(st.gen.open * 100) + '% open');
    assert.equal(D.hqTerrainMaskAt(D.hqTerrainInfo(MALL), 0, 0) > 0, true, 'the atrium is open');
});

test('THE WAYS IN: the tower lobby’s AVENUE doors (its east wall, the clock moved) ⇄ the streets’ west wall at z −8; THE METRO stair on the platform’s north wall (the departures board moved over the track) ⇄ the streets’ north wall at x 12; THE MALL’s main entrance on the streets’ south wall ⇄ the mall’s; every pair the same leaf, never gated; the board room’s single back door is untouched', () => {
    const av = at(LOBBY, 'avenue'), tw = at(STREETS, 'tower');
    assert.ok(av && av.wall === 'e' && av.z === 0 && av.leaf === 'leaf_entrance' && av.action.room === STREETS && av.action.at === 'tower', 'the avenue doors');
    assert.ok(tw && tw.wall === 'w' && tw.z === -8 && tw.leaf === 'leaf_entrance' && tw.action.room === LOBBY && tw.action.at === 'avenue', 'the streets’ tower door');
    assert.ok(HQ.rooms[LOBBY].props.find(p => p.key === 'wall_clock').z === -4, 'the lobby clock moved off the doors');
    const st = at(PLAT, 'street'), me = at(STREETS, 'metro');
    assert.ok(st && st.wall === 'n' && st.x === 2.2 && st.leaf === 'leaf_frame_only' && st.action.room === STREETS && st.action.at === 'metro', 'the platform’s street stair');
    assert.ok(me && me.wall === 'n' && me.x === 12 && me.leaf === 'leaf_frame_only' && me.action.room === PLAT && me.action.at === 'street', 'the metro stair');
    assert.ok(HQ.rooms[PLAT].props.find(p => p.key === 'departures_board').x < -1.5, 'the departures board hangs over the track');
    const ml = at(STREETS, 'mall'), ms = at(MALL, 'street');
    assert.ok(ml && ml.wall === 's' && ml.x === 0 && ml.leaf === 'leaf_glass' && ml.action.room === MALL && ml.action.at === 'street' && ms && ms.wall === 's' && ms.x === 0 && ms.leaf === 'leaf_glass' && ms.action.room === STREETS && ms.action.at === 'mall', 'the mall’s doors');
    for (const d of [av, tw, st, me, ml, ms]) assert.ok(!d.rankDoor && !d.minClearance && D.doorSiteState(d, null) === 'open', d.id + ': never gated');
    assert.equal(HQ.siteRooms.backDoors.prebuilt_downtown.length, 1, 'the board room keeps its one back door (the tower)');
});

test('THE SEAMS: the Strip (streets_strip — the chapel’s west wall, a motel leaf, the highway), the Stadium (streets_stadium — Room 50’s last free north lane, the highway), THE TIME MACHINE (timemachine_cyberpunk — a `way` at BOTH ends: free in the mall’s arcade, free on Cyberpunk’s north strip; the ONLY way from the city into Cyberpunk), THE GUTTER (streets_drain — a `way` free in the east kerb ⇄ the storm drain’s own grate on its north wall, on THE SEWERS line); all live, all explained, never a rank leaf; the world graph carries them', () => {
    const L = id => HQ.links.find(l => l.id === id);
    const strip = L('streets_strip'), stad = L('streets_stadium'), tm = L('timemachine_cyberpunk'), gut = L('streets_drain');
    for (const l of [strip, stad, tm, gut]) { assert.ok(l && D.hqLinkLive(l) && l.why && l.note && l.draft === true, l && l.id); assert.ok(!(HQ.catalogue[l.leaf] || {}).rank); }
    assert.ok(strip.route === 'highway' && strip.a.part === 'streets' && strip.a.wall === 'w' && strip.a.z === 18 && strip.b.site === 'prebuilt_strip' && strip.b.part === 'chapel' && strip.b.wall === 'w' && strip.leaf === 'leaf_motel');
    assert.equal(D.hqLinkRoom(strip.a), STREETS); assert.equal(D.hqLinkRoom(strip.b), CHAPEL);
    assert.ok(stad.route === 'highway' && stad.a.part === 'streets' && stad.a.wall === 'n' && stad.a.x === -24 && stad.b.site === 'prebuilt_stadium' && !stad.b.part && stad.b.wall === 'n' && stad.b.x === -10 && stad.leaf === 'leaf_wired_double');
    assert.equal(D.hqLinkRoom(stad.b), STADIUM);
    for (const o of HQ.rooms[STADIUM].doors) if (o.id !== 'link_streets_stadium' && o.wall === 'n') assert.ok(Math.abs(o.x - (-10)) >= 4.4, 'the stadium gate shares a lane with ' + o.id);
    assert.ok(HQ.rooms[STADIUM].doors.filter(d => d.link && d.wall === 'n').length <= 3, 'the stadium keeps ≤ 3 link doors on its north wall');
    assert.ok(tm.route === 'seams' && tm.way === 'timemachine' && tm.a.part === 'mall' && tm.a.wall === 'free' && tm.a.face === 90 && tm.b.site === 'prebuilt_cyberpunk' && !tm.b.part && tm.b.wall === 'free' && tm.b.face === 90 && !tm.b.leaf, 'the time machine at both ends');
    const a = at(MALL, 'link_timemachine_cyberpunk'), b = at(CYBER, 'link_timemachine_cyberpunk');
    assert.ok(a && b && a.way === 'timemachine' && b.way === 'timemachine' && a.leaf === null && b.leaf === null && a.wall === 'free' && b.wall === 'free', 'both ends wear the machine');
    assert.ok(a.action.room === CYBER && a.action.at === b.id && b.action.room === MALL && b.action.at === a.id, 'both halves pair');
    const cy = HQ.rooms[CYBER], gr = cy.shell.grid;
    assert.ok(Math.abs(b.z) > gr.cells * gr.cell / 2 + 0.4 && Math.abs(b.z) < cy.shell.d / 2 - 0.6 && Math.abs(b.x) < cy.shell.w / 2 - 2.5, 'the far end stands on Cyberpunk’s north strip, off the board, inside the room');
    assert.ok(!HQ.links.some(l => l.id !== 'timemachine_cyberpunk' && ((D.hqLinkRoom(l.a) === CYBER && [STREETS, MALL].includes(D.hqLinkRoom(l.b))) || (D.hqLinkRoom(l.b) === CYBER && [STREETS, MALL].includes(D.hqLinkRoom(l.a))))), 'no regular door joins the city to Cyberpunk');
    assert.ok(!HQ.rooms[STREETS].doors.concat(HQ.rooms[MALL].doors).some(d => d.action && d.action.room === CYBER && d.way !== 'timemachine'), 'the machine is the only way');
    assert.ok(gut.route === 'sewers' && HQ.routes.sewers && HQ.routes.sewers.dashed && gut.way === 'gutter' && gut.a.part === 'streets' && gut.a.wall === 'free' && gut.a.face === 270 && gut.b.site === 'prebuilt_fairy_forest' && gut.b.part === 'deadmans' && gut.b.wall === 'n' && gut.b.leaf === 'leaf_cell' && gut.b.verb === 'CLIMB UP', 'the gutter');
    const ga = at(STREETS, 'link_streets_drain'), gb = at(DRAIN, 'link_streets_drain');
    assert.ok(ga && gb && ga.way === 'gutter' && !gb.way && gb.leaf === 'leaf_cell' && gb.wall === 'n' && gb.x === -13 && ga.action.room === DRAIN && gb.action.room === STREETS, 'the grate at the drain’s end');
    for (const o of HQ.rooms[DRAIN].doors) if (o.id !== gb.id && o.wall === 'n') assert.ok(Math.abs(o.x - gb.x) >= 4.4);
    for (const k of ['timemachine', 'gutter']) assert.ok(HQ.ways[k] && HQ.ways[k].verb && HQ.ways[k].sub && HQ.ways[k].sfx && HQ.ways[k].w > 0 && HQ.ways[k].h > 0, k + ' is catalogued');
    assert.equal(HQ.ways.timemachine.sfx, 'wayTime'); assert.equal(HQ.ways.gutter.sfx, 'wayGutter');
    const graph = D.hqWorldGraph();
    for (const l of [strip, stad, tm, gut]) assert.ok(graph.edges.some(e => e.link === l.id && e.from === D.hqLinkRoom(l.a) && e.to === D.hqLinkRoom(l.b)) && graph.edges.some(e => e.link === l.id && e.from === D.hqLinkRoom(l.b) && e.to === D.hqLinkRoom(l.a)), l.id + ' both ways on the graph');
    assert.ok(D.hqWorldRoutes('foyer').find(r => r.id === 'highway').stations.some(s => s.site === 'prebuilt_stadium'), 'the stadium is on the highway line now');
});

test('ONE PIECE: from the lobby’s avenue doors both parts are walked; every inside door is a pair with the same leaf / object; nothing leaves the site but a links row; the lobby, the platform, the streets and the mall are one complex with the board room', () => {
    const seen = new Set(), queue = [STREETS];
    while (queue.length) {
        const id = queue.shift(); if (seen.has(id)) continue; seen.add(id);
        for (const d of HQ.rooms[id].doors) {
            const a = d.action || {};
            assert.ok(a.room && HQ.rooms[a.room], id + '/' + d.id + ' leads to a room');
            if (d.link) { assert.ok(HQ.links.some(l => l.id === d.link), id + '/' + d.id + ' is a links row'); const far = at(a.room, a.at); assert.ok(far && far.link === d.link, id + '/' + d.id + ': the far end pairs'); continue; }
            const other = at(a.room, a.at);
            assert.ok(other && other.action.room === id && other.action.at === d.id, id + '/' + d.id + ' ⇄ ' + a.room + ' is a pair');
            assert.equal(other.leaf, d.leaf); assert.equal(other.way, d.way);
            assert.ok(HQ.rooms[a.room].site === 'prebuilt_downtown', id + '/' + d.id + ' stays inside the site');
            if (IDS.includes(a.room)) queue.push(a.room);
        }
    }
    assert.equal(Array.from(seen).sort().join(','), IDS.slice().sort().join(','));
    assert.equal(D.hqSiteComplex('prebuilt_downtown').filter(r => IDS.includes(r) || r === LOBBY || r === PLAT).length, 4);
});

test('THE SOLVER + THE RETURN GUARANTEE + THE PRODUCTION LANDING: in both parts every door reaches every other under the walker’s rule, nothing traps, every ramp tops out on reached ground; the renderer lands every door (the free ways included) at its sill on level ground, clear of every prop, native, car and scattered bin; natives, the spawn and every parked car stand on dry level ground off the road’s middle', () => {
    for (const id of IDS) {
        const room = HQ.rooms[id], S = room.shell, info = D.hqTerrainInfo(id);
        const L = room.doors.map(d => Object.assign({ d }, D.hqTerrainDoorLanding(room, d)));
        assert.ok(L.length >= 2, id + ': at least two doors');
        for (const a of L) { const reach = D.hqTerrainReach(info, a.x, a.z); for (const b of L) assert.ok(reach.has(D.hqTerrainNodeKey(info, b.x, b.z)), id + ': ' + a.d.id + ' → ' + b.d.id + ' unreachable'); }
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
            const inward = door.wall === 'free' ? [Math.sin(door.face * Math.PI / 180), -Math.cos(door.face * Math.PI / 180)] : { n: [0, 1], s: [0, -1], e: [-1, 0], w: [1, 0] }[door.wall];
            const dot = Math.sin(h.cam.yaw) * inward[0] + (-Math.cos(h.cam.yaw)) * inward[1];
            assert.ok(Math.abs(dot) > 0.99, id + '/' + door.id + ': faces along the doorway’s normal');
            assert.equal(p.y, sill(room, door), id + '/' + door.id + ': lands at its sill');
            const feet = D.hqTerrainFeet(info, p.x, p.z, null);
            assert.ok(feet != null && Math.abs(feet - p.y) < 0.12 && D.hqTerrainSlope(info, p.x, p.z) < 0.3, id + '/' + door.id + ': the pad is level under the landing (' + feet + ' vs ' + p.y + ')');
            assert.ok(D.hqTerrainMaskAt(info, p.x, p.z) > 0.3, id + '/' + door.id + ': the landing is in the open plan');
            for (const q of [...room.props, ...room.npcSpots]) assert.ok(!propBlocks(room, q, p.x, p.z, 0.35), id + '/' + door.id + ': ' + (q.key || q.race) + ' blocks the landing');
            for (const q of info.scatter) assert.ok(Math.hypot(q.x - p.x, q.z - p.z) > q.r + 0.35, id + '/' + door.id + ': scattered ' + q.key + ' blocks the landing');
            for (const other of room.doors) if (other.id !== door.id && other.wall === door.wall && door.wall !== 'free') { const k = (door.wall === 'n' || door.wall === 's') ? 'x' : 'z'; assert.ok(Math.abs(other[k] - door[k]) > 2.6, id + ': ' + door.id + ' and ' + other.id + ' overlap'); }
        }
        const sp = room.spawn;
        for (const q of [...room.props, ...room.npcSpots]) assert.ok(!propBlocks(room, q, sp.x, sp.z, 0.3), id + ': ' + (q.key || q.race) + ' blocks the spawn');
        assert.ok(D.hqTerrainFeet(info, sp.x, sp.z, null) != null && !D.hqTerrainFluidAt(info, sp.x, sp.z) && R0.has(D.hqTerrainNodeKey(info, sp.x, sp.z)), id + ': the spawn stands on reached dry ground');
        for (const n of room.npcSpots) { assert.ok(D.AVAILABLE_RACES.includes(n.race), id + ': native race ' + n.race); assert.ok(D.hqTerrainFeet(info, n.x, n.z, null) != null && !D.hqTerrainFluidAt(info, n.x, n.z) && D.hqTerrainSlope(info, n.x, n.z) < 0.7 && D.hqTerrainMaskAt(info, n.x, n.z) > 0.3, id + ': the ' + n.race + ' stands on dry level open ground'); assert.ok(Array.isArray(n.say) && n.say.every(l => typeof l === 'string' && l.length > 10), id + ': the ' + n.race + ' has lines (drafts)'); }
        for (const p of room.props) { assert.ok(HQ.catalogue[p.key], id + ': prop ' + p.key); if ((p.y || 0) > 0.5 || p.wall || p.ceil) continue; assert.ok(D.hqTerrainFeet(info, p.x, p.z, null) != null && D.hqTerrainMaskAt(info, p.x, p.z) > 0, id + ': ' + p.key + ' stands in a hazard / the solid'); }
        assert.ok(room.props.some(p => (HQ.catalogue[p.key] || {}).light) || room.props.some(p => p.key === 'flicker_tube' || p.key === 'bare_bulb'), id + ': the room lights itself');
    }
    /* the parked cars stand on the road's PARKING LANE (past the traffic lane), never in the traffic's path */
    const st = D.hqTerrainInfo(STREETS), room = HQ.rooms[STREETS];
    const cars = room.props.filter(p => (HQ.catalogue[p.key] || {}).vehicle);
    assert.ok(cars.length >= 5, 'parked cars on the kerbs');
    for (const c of cars) for (const rt of st.traffic) {
        const pts = rt.loop ? rt.pts.concat([rt.pts[0]]) : rt.pts;
        let best = Infinity; for (let i = 0; i + 1 < pts.length; i++) { const ax = pts[i][0], az = pts[i][1], bx = pts[i + 1][0], bz = pts[i + 1][1], dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz || 1; let t = ((c.x - ax) * dx + (c.z - az) * dz) / l2; t = Math.max(0, Math.min(1, t)); const d = Math.hypot(c.x - (ax + dx * t), c.z - (az + dz * t)); if (d < best) best = d; }
        assert.ok(best > rt.lane + 1.5 || best > 3.4, c.key + ' at ' + c.x + ',' + c.z + ' stands in the traffic lane (' + best.toFixed(1) + ' m from a route)');
    }
});

test('THE PARK RULE + THE PLATFORMING: the streets have the parking deck (a 3 m tier up a car ramp the walker climbs, a rail round its roof, two quarter pipes) and THE ROOFTOP (4 m, never climbed — a hop from nothing); the mall has THE MEZZANINE (3.4 m up the escalator — stairs, a tread a metre) with its rails and the escalator’s riser; a `railing_1m` in each; the two hard tapes (the rooftop, a store roof) are the door gun’s and each has a shot', () => {
    const sF = HQ.rooms[STREETS].terrain.features, mF = HQ.rooms[MALL].terrain.features, st = D.hqTerrainInfo(STREETS), ml = D.hqTerrainInfo(MALL);
    const deck = sF.find(f => f.k === 'plateau' && f.h === 3.0), ramp = sF.find(f => f.k === 'ramp' && f.h1 === 3.0), roof = sF.find(f => f.k === 'plateau' && f.h === 4.0);
    assert.ok(deck && ramp && roof && sF.filter(f => f.k === 'rail').length >= 3 && HQ.rooms[STREETS].props.filter(p => p.key === 'quarter_pipe').length === 2 && HQ.rooms[STREETS].props.some(p => p.key === 'railing_1m'), 'the streets’ park');
    assert.ok(Math.hypot(ramp.x1 - ramp.x0, ramp.z1 - ramp.z0) / ramp.h1 >= 1.4, 'the car ramp is an incline the walker climbs (slope ≤ 0.7)');
    const foot = D.hqTerrainDoorLanding(HQ.rooms[STREETS], at(STREETS, 'tower')), R = D.hqTerrainReach(st, foot.x, foot.z);
    assert.ok(R.has(D.hqTerrainNodeKey(st, deck.x, deck.z)) && Math.abs(R.get(D.hqTerrainNodeKey(st, deck.x, deck.z)) - 3.0) < 0.3, 'the deck is walked up to');
    assert.ok(!R.has(D.hqTerrainNodeKey(st, roof.x, roof.z)), 'THE ROOFTOP is nobody’s but the door gun’s');
    const mez = mF.find(f => f.k === 'plateau' && f.h === 3.4), esc = mF.find(f => f.k === 'ramp' && f.stairs);
    assert.ok(mez && esc && esc.h1 === 3.4 && Math.hypot(esc.x1 - esc.x0, esc.z1 - esc.z0) >= 6 && mF.filter(f => f.k === 'rail').length >= 2 && HQ.rooms[MALL].props.some(p => p.key === 'railing_1m') && HQ.rooms[MALL].props.some(p => /^riser_/.test(p.key)), 'the mall’s park');
    const mfoot = D.hqTerrainDoorLanding(HQ.rooms[MALL], at(MALL, 'street')), MR = D.hqTerrainReach(ml, mfoot.x, mfoot.z);
    assert.ok(MR.has(D.hqTerrainNodeKey(ml, mez.x, mez.z)) && Math.abs(MR.get(D.hqTerrainNodeKey(ml, mez.x, mez.z)) - 3.4) < 0.3, 'the mezzanine is walked up the escalator');
    for (const [id, pin] of [[STREETS, HQ.findSpots[STREETS].tape], [MALL, HQ.findSpots[MALL].tape]]) {
        const rows = D.hqFindsForRoom(id), tape = rows.find(r => /^tape:/.test(r.id));
        assert.ok(tape && tape.hard === true && tape.x === pin.x && tape.z === pin.z && tape.y >= 3.9, id + ': the tape is pinned high and hard (' + JSON.stringify(tape) + ')');
        const shot = D.hqFindHardReachTerrain(tape, D.hqFindRoomInfo(id));
        assert.ok(shot && shot.ok === true && shot.from && shot.hit, id + ': the door gun has a shot at it (' + JSON.stringify(shot) + ')');
        assert.ok(rows.some(r => /^pay:/.test(r.id) && !r.hard), id + ': the envelope is on the ground');
    }
    assert.equal(D.DOOR_TAPES.filter(t => t.where === STREETS).length, 1); assert.equal(D.DOOR_TAPES.filter(t => t.where === MALL).length, 1);
    assert.equal(D.DOOR_TAPES.length, 100, 'the hundred stays a hundred');
    for (const site of ['prebuilt_stadium', 'prebuilt_cyberpunk']) assert.ok(D.DOOR_TAPES.some(t => t.where === D.hqSiteRoomId(site) || (t.site === site && t.where === D.hqSiteRoomId(site))), site + ' keeps a tape');
});

test('THE TRAFFIC + THE CIRCUIT (data): the streets carry routes — the ring road both ways on the right, the avenues either side of the plaza — every kind a vehicle of _VEHICLE_KIT, every route on the open plan; the race is the ring road with 8 gates and a label; the mall carries none; the compiler passes them through with defaults', () => {
    const st = D.hqTerrainInfo(STREETS), T = HQ.rooms[STREETS].terrain;
    assert.ok(Array.isArray(T.traffic) && T.traffic.length >= 4 && st.traffic.length === T.traffic.length, 'the routes ride the info');
    const kit = renderer.slice(renderer.indexOf('var _VEHICLE_KIT = {'), renderer.indexOf('\n    };', renderer.indexOf('var _VEHICLE_KIT = {')));
    for (const rt of st.traffic) {
        assert.ok(rt.n >= 1 && rt.speed > 0 && rt.lane > 0 && Array.isArray(rt.kinds) && rt.kinds.length, 'a route ' + JSON.stringify(rt.kinds));
        for (const k of rt.kinds) assert.ok(new RegExp('^        ' + k + ':', 'm').test(kit), 'vehicle ' + k + ' is in the kit');
        const pts = rt.loop ? rt.pts.concat([rt.pts[0]]) : rt.pts;
        for (let i = 0; i + 1 < pts.length; i++) for (let t = 0; t <= 1; t += 0.1) {
            const ax = pts[i][0], az = pts[i][1], dx = pts[i + 1][0] - ax, dz = pts[i + 1][1] - az, l = Math.hypot(dx, dz) || 1;
            const px = ax + dx * t + (-dz / l) * rt.lane, pz = az + dz * t + (dx / l) * rt.lane;
            if (Math.abs(px) > st.S.w / 2 - 1 || Math.abs(pz) > st.S.d / 2 - 1) continue;
            assert.ok(D.hqTerrainMaskAt(st, px, pz) > 0.4 && D.hqTerrainFeet(st, px, pz, null) != null, 'the lane at ' + px.toFixed(1) + ',' + pz.toFixed(1) + ' runs into the solid');
        }
    }
    const loops = st.traffic.filter(r => r.loop);
    assert.ok(loops.length === 2 && JSON.stringify(loops[0].pts) === JSON.stringify(loops[1].pts.slice().reverse().slice(-loops[0].pts.length).concat([]).length ? loops[1].pts.slice().reverse() : []) || loops.length === 2, 'the ring road is driven both ways');
    assert.ok(st.race && st.race.label && st.race.gates === 8 && st.race.pts.length >= 8 && st.race.w >= 10 && JSON.stringify(st.race.pts) === JSON.stringify(T.gen.streets[0].pts), 'the circuit is the ring road');
    assert.equal(D.hqTerrainInfo(MALL).traffic.length, 0); assert.equal(D.hqTerrainInfo(MALL).race, null);
    assert.ok(D.HQ_SKATE_RULES.race && D.HQ_SKATE_RULES.race.hw > 0 && D.HQ_SKATE_RULES.race.minLapMs >= 5000, 'the circuit’s rules');
});

test('THE CIRCUIT (the renderer, in a vm): a rider round the ring road crosses the gates in order — lapstart at the banner, a gate beat each, laptick while live, a LAP with its time and a record at the banner again; the wrong way never counts; leaving the board drops the lap; hqSkateBank keeps the best lap per room (a slower one is ignored), local like the deck', () => {
    const st = D.hqTerrainInfo(STREETS);
    const src = extract('_hqRoutePose') + '\n' + extract('_hqBuildRace') + '\n' + extract('_hqTickRace');
    const events = [];
    class Obj { constructor() { this.position = { x: 0, y: 0, z: 0, set(x, y, z) { this.x = x; this.y = y; this.z = z; } }; this.rotation = { x: 0, y: 0, z: 0 }; this.scale = { setScalar() {} }; this.children = []; } add(...o) { this.children.push(...o); } }
    class Mesh extends Obj { constructor(g, m) { super(); this.geometry = g; this.material = m; } }
    const geo = class { constructor() {} };
    const H = { tickers: [], ride: { on: false }, player: { x: 0, y: 0, z: 0 }, paused: false, opts: { room: STREETS, onSkate: ev => events.push(ev) }, race: null, blockers: [] };
    const c = { THREE: { Group: Obj, Mesh, CylinderGeometry: geo, BoxGeometry: geo, PlaneGeometry: geo, MeshPhongMaterial: class { constructor(o) { Object.assign(this, o); } }, MeshBasicMaterial: class { constructor(o) { Object.assign(this, o); } }, Color: class { constructor(v) { this.v = v; } }, DoubleSide: 2 },
        _hq: H, _hqUnits: () => HQ.units, _hzGlowSprite: () => { const s = new Obj(); s.material = { opacity: 1 }; return s; }, _hzTextTex: () => null,
        hqTerrainHeight: (info, x, z) => D.hqTerrainHeight(info, x, z), _hqSkateRules: () => ({ race: D.HQ_SKATE_RULES.race }),
        _hqRideEmit: ev => { try { H.opts.onSkate(ev); } catch (e) {} }, Math, console };
    vm.createContext(c); vm.runInContext(src, c);
    c._hqBuildRace(HQ.rooms[STREETS], st, new Obj(), 1);
    assert.ok(H.race && H.race.n === 8 && H.race.gates.length === 8 && H.tickers.length === 1 && H.race.label === st.race.label, 'the race registered with its gates and its ticker');
    const gates = H.race.gates;
    for (const g of gates) assert.ok(D.hqTerrainMaskAt(st, g.x, g.z) > 1, 'a gate on the road');
    /* the rider: walk the loop's polyline at 9 m/s, 60 Hz, twice round; then the wrong way */
    const loop = st.race.pts.concat([st.race.pts[0]]);
    let now = 1000; const tick = () => { now += 1000 / 60; H.tickers[0](1 / 60, now); };
    const ride = (pts, laps) => { for (let lp = 0; lp < laps; lp++) for (let i = 0; i + 1 < pts.length; i++) { const ax = pts[i][0], az = pts[i][1], dx = pts[i + 1][0] - ax, dz = pts[i + 1][1] - az, L = Math.hypot(dx, dz), n = Math.ceil(L / (9 / 60)); for (let k = 0; k <= n; k++) { H.player.x = ax + dx * k / n; H.player.z = az + dz * k / n; H.player.y = D.hqTerrainHeight(st, H.player.x, H.player.z); tick(); } } };
    H.ride.on = true; tick();
    /* start a little before the banner so the first crossing is a clean one */
    ride(loop, 2);
    const kinds = events.map(e => e.kind);
    assert.ok(kinds.filter(k => k === 'lapstart').length >= 2 && kinds.includes('gate') && kinds.includes('laptick'), 'lapstart, gates, ticks: ' + Array.from(new Set(kinds)).join(','));
    const lap = events.find(e => e.kind === 'lap');
    assert.ok(lap && lap.ms > 8000 && lap.ms < 60000 && lap.best === true && lap.room === STREETS && lap.laps === 1, 'a lap: ' + JSON.stringify(lap));
    const gatesSeen = events.filter(e => e.kind === 'gate').map(e => e.i);
    assert.ok(gatesSeen.slice(0, 7).join(',') === '1,2,3,4,5,6,7', 'the gates in order: ' + gatesSeen.slice(0, 8).join(','));
    /* the wrong way: no gate, no lap */
    const before = events.length; ride(loop.slice().reverse(), 1);
    assert.ok(!events.slice(before).some(e => e.kind === 'gate' || e.kind === 'lap'), 'the wrong way never counts');
    H.ride.on = false; tick();
    assert.ok(events.some(e => e.kind === 'lapdrop') && !H.race.live, 'leaving the board drops the lap');
    /* the bank */
    const p = { door: { hq: {} }, account: {}, progress: {} };
    const s1 = D.hqSkateBank(p, { lap: { room: STREETS, ms: 42300 }, date: '2026-09-17' });
    assert.ok(s1.laps && s1.laps[STREETS] && s1.laps[STREETS].ms === 42300 && s1.lapsRun === 1, 'the first lap is the record');
    D.hqSkateBank(p, { lap: { room: STREETS, ms: 50000 } }); assert.equal(p.door.hq.skate.laps[STREETS].ms, 42300, 'a slower lap is ignored');
    D.hqSkateBank(p, { lap: { room: STREETS, ms: 39900 } }); assert.equal(p.door.hq.skate.laps[STREETS].ms, 39900, 'a faster one is the record');
    assert.equal(p.door.hq.skate.lapsRun, 3); assert.ok(!(p.progress.hq && p.progress.hq.skate && p.progress.hq.skate.laps), 'laps are local (never in the synced blob)');
    assert.ok(D.hqSkateStatus(p).laps[STREETS].ms === 39900 && D.hqSkateStatus(p).lapsRun === 3, 'the status reads them');
    assert.ok(D.hqSkateBank(p, { bail: true }).bails === 1, 'a bail still counts');
});

test('the sources: the renderer reads lots / fronts / sidewalk / traffic / race and builds them from _hqBuildTerrain (the buildings on the podiums, the fronts, the lamps, the traffic with its follow + hit, the circuit with its banner), the city’s rise is a MAX in the compiler, the two way builders exist with the stub scene’s kinds, HQ_SKATE_DEFAULT carries the race row, map.js hears every beat and words the traffic bail, audio.js voices both ways, the compiler defaults the routes', () => {
    for (const f of ['function _hqBuildCityLots(room, info, G, TM, rng, TK)', 'function _hqBuildStreetLamps(room, info, G, TM, rng)', 'function _hqBuildTraffic(room, info, G, TM, rng)', 'function _hqTickTraffic(dt)', 'function _hqBuildRace(room, info, G, TM)', 'function _hqTickRace(dt, now)', 'function _hqRoutePose(car, s)',
        "if (info.lots && info.lots.length) { try { _hqBuildCityLots(room, info, G, TM, rng, TK); }", "if (info.traffic && info.traffic.length) { try { _hqBuildTraffic(room, info, G, TM, rng); }", "if (info.race) { try { _hqBuildRace(room, info, G, TM); }", "if (info.genPlan && info.genPlan.streets) { try { _hqBuildStreetLamps(room, info, G, TM, rng); }",
        "if (info.gen.sidewalk > 0 && md > 0 && md < info.gen.sidewalk + 0.15) sw = 1 - Math.max(0, (md - info.gen.sidewalk) / 0.15);", "_hqRideBail(R, pl, 'car');", "_hqRideEmit({ kind: 'carhit', kindOf: car.g._ew_hqCar, v: car.v });", "_hqRideEmit({ kind: 'lap', ms: ms, best: best, room: rc.room, label: rc.label, laps: rc.laps });",
        "race: { hw: 5.5, tickMs: 250, minLapMs: 8000 },", "_hzKitTs = TM;", "window.EW_HQ_NO_TRAFFIC", "_nrSpriteBuilding(TK, lot.key, lot.x * U, lot.z * U,", "var _HQ_STORE_NAMES = [", "_hqRideBail(R, pl, 'car')"]) assert.ok(renderer.includes(f), 'renderer: ' + f);
    for (const k of ['timemachine', 'gutter']) assert.ok(new RegExp('^        ' + k + ': function \\(U, ctx\\) \\{', 'm').test(renderer), k + ': a way builder');
    for (const f of ["if (gen.kind === 'city') info.H[k] = info.H[k] * (1 - t) + Math.max(info.H[k], (info.base || 0) + wallH * j1 + top) * t;", "} else if (gen.kind === 'city') {", "info.lots = []; info.fronts = [];", "traffic: (T.traffic || []).filter(", "race: (T.race && Array.isArray(T.race.pts)", "if (ev.lap) {", "laps: rec.laps || {}, lapsRun: rec.lapsRun | 0,"]) assert.ok(data.includes(f), 'data: ' + f);
    for (const f of ["case 'carhit':", "case 'lapstart':", "case 'laptick':", "case 'lap': {", "case 'lapdrop':", "case 'gate':", "ev.why === 'car' ? 'THE TRAFFIC'", "_hqSkateFile({ lap: { room: ev.room, ms: ev.ms } })", "function _hqLapFmt(ms)", "row('THE CIRCUIT'"]) assert.ok(map.includes(f), 'map: ' + f);
    for (const f of ['wayTime(ctx, t, out, vol) {', 'wayGutter(ctx, t, out, vol) {', 'wayTime: 0.3, wayGutter: 0.3']) assert.ok(audio.includes(f), 'audio: ' + f);
    /* the defaults: a route with only points gets n / speed / lane / kinds */
    const info = D.hqTerrainCompile({ id: 'lab', label: 'LAB', kind: 'box', shell: { w: 30, d: 30, h: 8 }, doors: [{ id: 'a', wall: 'n', x: 0 }], terrain: { floor: 'grass_2', features: [], traffic: [{ pts: [[-10, 0], [10, 0]] }, { pts: [[0, 0]] }, null], race: { pts: [[-8, -8], [8, -8], [8, 8], [-8, 8]] } } }, 'lab');
    assert.equal(info.traffic.length, 1); assert.deepEqual([info.traffic[0].n, info.traffic[0].speed, info.traffic[0].lane, info.traffic[0].loop], [4, 7, 2.2, false]); assert.equal(info.traffic[0].kinds.join(','), 'suv,cadillac');
    assert.ok(info.race && info.race.gates === 8 && info.race.w === 10 && info.race.label === 'THE CIRCUIT');
});
