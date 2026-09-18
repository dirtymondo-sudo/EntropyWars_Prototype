// hq-city-2.test.js — DISASTER CITY, THE SECOND PASS + CYBERPUNK CITY (2026-09-17).
// The user's three: "the buildings should be street level, not on raised
// plateaus" (STREET LEVEL: the compiler's TERRACE — contiguous lots along every
// street face, each building standing on the sidewalk's own ground with the
// plan's rise INSIDE it; the renderer's ground-level w × d prisms), "the
// cyberpunk city is another big area, basically a reskin of disaster city"
// (CYBERPUNK CITY · THE GRID: the same `city` plan on Room 2047 through
// hqCityShell({ neon: true }) with `gen.neon`, THE NEON GRAND PRIX, THE
// SKYWAY, THE BILLBOARD ROOF, THE STATION where the tunnel's train arrives,
// the Downtown platform's stair; THE NOODLE BAR's back room), "the time
// machine should be in a random basement or supply closet of the mall" (THE
// SUPPLY CLOSET off the north wing ⇄ the noodle bar — the ONLY way over), and
// the user's city batch on R2 Assets/misc/ wired: the bins (city / mall), the
// taxi and the truck in the traffic, the crashed cars, the time machine and
// the street drain under the two ways, the escalator on the mezzanine, the
// storefronts over the fronts, the Vatican dome GLB-first, the road tiles laid
// along every street. Guards: the terrace, the grid's sheet + plan + park +
// solver + landings, the closet + the noodle bar + the seam, the trains, the
// catalogue ↔ _MISC_GLB, the vehicle kit, the renderer sites, the docs.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { loadGameData } = require('./load-data');
const D = loadGameData(), HQ = D.DOOR_HQ;
const STREETS = 'site_prebuilt_downtown_streets', MALL = 'site_prebuilt_downtown_mall', CLOSET = 'site_prebuilt_downtown_closet';
const GRID = 'site_prebuilt_cyberpunk_streets', NOODLE = 'site_prebuilt_cyberpunk_noodle', CYBER = D.hqSiteRoomId('prebuilt_cyberpunk');
const renderer = fs.readFileSync(__dirname + '/three-renderer.js', 'utf8'), data = fs.readFileSync(__dirname + '/data.js', 'utf8'), index = fs.readFileSync(__dirname + '/MODEL_INDEX.md', 'utf8');
const at = (room, id) => (HQ.rooms[room].doors || []).find(d => d.id === id);
const BATCH = {
    city_bin: 'Meshy_AI_a_city_bin_0917065144_texture.glb', city_trash_bin: 'Meshy_AI_a_city_trash_bin_0917065157_texture.glb', taxi: 'Meshy_AI_a_city_taxi_0917065634_texture.glb', truck: 'Meshy_AI_a_truck_0917065131_texture.glb',
    crashed_car: 'Meshy_AI_a_crashed_car_0917065033_texture.glb', crashed_car_2: 'Meshy_AI_a_crashed_car_2_0917065052_texture.glb', time_machine: 'Meshy_AI_a_retro_time_machine_0917064610_texture.glb',
    road_straight: 'Meshy_AI_a_straight_city_road_0917064651_texture.glb', road_turn: 'Meshy_AI_a_road_turn_quarter_0917065230_texture.glb', street_drain: 'Meshy_AI_a_round_street_drain__0917064638_texture.glb',
    escalator: 'Meshy_AI_an_escalator_0917064623_texture.glb', bus_shelter: 'Meshy_AI_bus_shelter_0917064913_texture.glb', cinder_block: 'Meshy_AI_cinder_block_0917064959_texture.glb', fire_hydrant: 'Meshy_AI_fire_hydrant_0917064858_texture.glb',
    storefront: 'Meshy_AI_storefront_0917064551_texture.glb', storefront_unit: 'Meshy_AI_storefront_unit_0917064533_texture.glb', vatican_dome: 'Meshy_AI_the_Vatican_dome_0917061915_texture.glb',
    traffic_barrel: 'Meshy_AI_traffic_barrel_0917064936_texture.glb', traffic_cone: 'Meshy_AI_traffic_cone_0917064925_texture.glb',
};
const CAT_KEYS = { city_bin: 'city_bin', city_trash_bin: 'mall_bin', taxi: 'car_taxi', truck: 'car_truck', crashed_car: 'crashed_car', crashed_car_2: 'crashed_car_2', time_machine: 'time_machine', street_drain: 'street_drain', escalator: 'escalator', bus_shelter: 'bus_shelter', cinder_block: 'cinder_block', fire_hydrant: 'fire_hydrant', traffic_barrel: 'traffic_barrel', traffic_cone: 'traffic_cone' };
function section(src, a, b) { const i = src.indexOf(a); assert.ok(i >= 0, a); const j = src.indexOf(b, i + a.length); assert.ok(j > i, b); return src.slice(i, j); }

test('STREET LEVEL: the compiler rule — the city\'s rise begins riseIn inside the line, a lot\'s face stands frontOut outside it and its base is the sidewalk\'s; the renderer stands every prism FROM THE GROUND (yAbs = the base), w × d, turned to its face, and the low lot is a box from the ground — never a podium', () => {
    const G = D.HQ_TERRAIN_GEN.city;
    assert.ok(G.riseIn > 0 && G.riseIn < G.edge && G.frontOut > G.riseIn, 'the face stands outside the line, the rise inside it');
    assert.ok(/const d0 = \(gen\.kind === 'city'\) \? -\(\(gen\.riseIn != null\) \? gen\.riseIn : K\.riseIn\) : 0\.2;/.test(data) && data.includes('if (solidMass) return;'), 'the rise starts inside on a podium city and is skipped on a mass city');
    for (const id of [STREETS, GRID]) {
        const info = D.hqTerrainInfo(id), gen = HQ.rooms[id].terrain.gen;
        for (const lot of info.lots) {
            /* the ground at the face's middle, a stride out onto the sidewalk: the kerb band, never the rise */
            const c = Math.cos(lot.rot), s = Math.sin(lot.rot), fx = lot.x + s * lot.d / 2, fz = lot.z + c * lot.d / 2;
            const out = D.hqTerrainHeight(info, fx + s * 1.0, fz + c * 1.0);
            assert.ok(out < 0.3 && Math.abs(out - lot.base) < 0.2, id + ': the sidewalk in front of lot ' + lot.i + ' is at ' + out.toFixed(2) + ' (base ' + lot.base + ')');
            /* and 1.5 m inside the face the MASS stands (STREET LEVEL rev 2: no rise — the walker is refused, the ground stays the street's) */
            assert.ok(D.hqTerrainFeet(info, fx - s * 1.5, fz - c * 1.5, null) === null && D.hqTerrainHeight(info, fx - s * 1.5, fz - c * 1.5) < 0.3, id + ': the mass is inside lot ' + lot.i);
        }
    }
    const fn = section(renderer, 'function _hqBuildCityLots(room, info, G, TM, rng, TK)', '\n    /* THE ROAD TILES');
    for (const f of ["var base = (lot.base || 0) * U + 0.3, yaw = lot.rot || 0;", "d: (lot.d - 0.16) / info.tile, stack: lot.storeys, yAbs: base,", "ry: yaw", "new THREE.BoxGeometry((lot.w - 0.1) * U, lot.top * U, (lot.d - 0.1) * U), lowMat)", "g.position.set((f.x0 + f.x1) / 2 * U, ((f.base || 0)) * U + 0.3, (f.z0 + f.z1) / 2 * U);"]) assert.ok(fn.includes(f) || renderer.includes(f), 'renderer: ' + f);
    assert.ok(!/lot\.top \* U \+ 0\.3;\s*\n\s*if \(prisms/.test(renderer), 'no prism stands on the podium top any more');
    const sb = section(renderer, 'function _nrSpriteBuilding(K, key, x, z, o)', '\n    }');
    assert.ok(/dd = \(o\.d \? o\.d : \(o\.w \|\| 2\)\) \* ts/.test(sb) && /var fw = d\[2\] \? w : dd;/.test(sb) && /K\.box\(w - inset \* 2, roofY, dd - inset \* 2, coreMat, 0\.5\)/.test(sb), 'the prism takes a depth');
});

test('CYBERPUNK CITY · THE GRID: a terrain part on Room 2047 wearing hqCityShell({ neon: true }) — Cyberpunk\'s night, the neon look, the neon mood — and a `city` plan with `neon`; THE LOOP is the circuit with 8 gates and a label, the traffic drives it with taxis and trucks; THE SKYWAY (4.5 m up a car ramp, three rails, two quarter pipes), THE BILLBOARD ROOF (5 m, never climbed — the hard tape with a shot), THE PUDDLE waded, THE MARKET, no thicket; the board room\'s back gate pairs; every door reaches every other, nothing traps', () => {
    const r = HQ.rooms[GRID], S = r.shell, gen = r.terrain.gen, info = D.hqTerrainInfo(GRID), meta = D.EW_MAP_META.find(m => m.id === 'prebuilt_cyberpunk').env;
    assert.ok(r.kind === 'box' && r.site === 'prebuilt_cyberpunk' && r.part === 'streets' && r.roomNo === undefined && /CYBERPUNK CITY/.test(r.label) && r.lines.length >= 3 && r.spawn, 'the sheet');
    assert.equal(D.hqRoomNo(GRID), '2047'); assert.equal(D.hqRoomSite(GRID), 'prebuilt_cyberpunk');
    assert.ok(S.open && S.edge === 'open' && S.sky.night === 1 && S.sky.tint === meta.tint && S.sky.nebula === meta.nebula && S.sky.fog.density > 0 && S.look === D.HQ_ROOM_LOOKS.neon && S.mood.night === 1 && S.mood.lamp === 0xff3ad8 && S.floor === 'urban_street', 'the reskin: the night, the neon look, the neon mood');
    assert.ok(D.HQ_ROOM_LOOKS.neon.nightMood >= 0.8 && D.HQ_ROOM_LOOKS.neon.bloom >= 0.4, 'the neon grade');
    const day = D.hqCityShell({ w: 10, d: 10 }), night = D.hqCityShell({ w: 10, d: 10, neon: true });
    assert.ok(day.sky.night === 0 && day.look === D.HQ_ROOM_LOOKS.city && night.neon === undefined && day.neon === undefined && night.w === 10, 'one shell helper, the flag never leaks');
    assert.ok(gen.kind === 'city' && gen.neon === true && info.gen.kind === 'city' && info.lots.length >= 24 && info.fronts.length >= 24 && (info.thicket || []).length === 0, 'the plan: ' + info.lots.length + ' lots');
    assert.ok(gen.streets[0].loop && r.terrain.race && r.terrain.race.gates === 8 && /NEON/.test(r.terrain.race.label) && JSON.stringify(r.terrain.race.pts) === JSON.stringify(gen.streets[0].pts), 'THE NEON GRAND PRIX on the loop');
    const kit = section(renderer, 'var _VEHICLE_KIT = {', '\n    };');
    for (const rt of info.traffic) for (const k of rt.kinds) assert.ok(new RegExp('^        ' + k + ':', 'm').test(kit), 'vehicle ' + k);
    assert.ok(info.traffic.some(rt => rt.kinds.includes('taxi')) && info.traffic.some(rt => rt.kinds.includes('truck')) && info.traffic.some(rt => rt.kinds.includes('cybercar')), 'taxis, trucks and cybercars');
    const F = r.terrain.features, sky = F.find(f => f.k === 'plateau' && f.h === 4.5), ramp = F.find(f => f.k === 'ramp' && f.h1 === 4.5), roof = F.find(f => f.k === 'plateau' && f.h === 5.0), pool = F.find(f => f.k === 'pool');
    assert.ok(sky && ramp && roof && pool && F.filter(f => f.k === 'rail').length >= 3 && r.props.filter(p => p.key === 'quarter_pipe').length === 2 && r.props.some(p => p.key === 'railing_1m'), 'the park');
    assert.ok(Math.hypot(ramp.x1 - ramp.x0, ramp.z1 - ramp.z0) / ramp.h1 >= 1.3, 'the car ramp is an incline');
    const L = r.doors.map(d => Object.assign({ d }, D.hqTerrainDoorLanding(r, d)));
    assert.ok(L.length >= 4, 'four ways in: the gate, the noodle bar, the station, the stair');
    for (const a of L) { const reach = D.hqTerrainReach(info, a.x, a.z); for (const b of L) assert.ok(reach.has(D.hqTerrainNodeKey(info, b.x, b.z)), a.d.id + ' → ' + b.d.id); }
    assert.equal(D.hqTerrainTraps(info).length, 0, 'a trap');
    const R = D.hqTerrainReach(info, L[0].x, L[0].z);
    assert.ok(R.has(D.hqTerrainNodeKey(info, sky.x, sky.z)) && Math.abs(R.get(D.hqTerrainNodeKey(info, sky.x, sky.z)) - 4.5) < 0.3, 'the skyway is walked up to');
    assert.ok(!R.has(D.hqTerrainNodeKey(info, roof.x, roof.z)), 'THE BILLBOARD ROOF is nobody\'s but the door gun\'s');
    const rows = D.hqFindsForRoom(GRID), tape = rows.find(x => /^tape:/.test(x.id)), pin = HQ.findSpots[GRID].tape;
    assert.ok(tape && tape.hard === true && tape.x === pin.x && tape.z === pin.z && tape.y >= 4.9, 'the tape on the roof: ' + JSON.stringify(tape));
    const shot = D.hqFindHardReachTerrain(tape, D.hqFindRoomInfo(GRID));
    assert.ok(shot && shot.ok === true, 'the door gun has a shot: ' + JSON.stringify(shot));
    assert.ok(rows.some(x => /^pay:/.test(x.id) && !x.hard), 'the envelope on the ground');
    /* the board room's back gate: the lane the train stood on */
    const back = at(CYBER, 'street'), gate = at(GRID, 'bay');   // THE THIRD PASS (2026-09-17): the grid IS Cyberpunk City — the board room is bypassed (siteRooms.entry) and the grid's south door is the bay's
    assert.ok(back && back.wall === 'n' && back.x === -10 && back.leaf === 'leaf_holographic' && back.action.room === GRID && back.action.at === 'bay', 'the back gate on the board room lands at the grid\'s bay door');
    assert.ok(gate && gate.wall === 's' && gate.leaf === back.leaf && gate.entry === 'prebuilt_cyberpunk' && HQ.rooms[gate.action.room].kind === 'bay' && !at(GRID, 'board'), 'the bay door stands where the tenement gate stood');
    for (const o of HQ.rooms[CYBER].doors) if (o !== back && o.wall === 'n') assert.ok(Math.abs(o.x - back.x) >= 4.4, 'the gate shares a lane with ' + o.id);
    assert.ok(!r.doors.some(d => (HQ.catalogue[d.leaf] || {}).rank), 'no rank leaf');
    assert.ok(r.npcSpots.every(n => D.AVAILABLE_RACES.includes(n.race)), 'the natives are races');
    assert.equal(D.hqSiteComplex('prebuilt_cyberpunk').length, 3, 'the board room, the grid, the noodle bar');
});

test('THE TRAINS ARRIVE IN THE CITY: the tunnel\'s train stands FREE at THE STATION on the grid\'s siding (a link end on a complex part), the Downtown platform\'s stair comes up on the grid\'s north wall; the subway line still reads the drain — the tunnel — Cyberpunk — Downtown; the board room keeps the highway alone', () => {
    const tun = HQ.links.find(l => l.id === 'tunnel_cyberpunk'), sub = HQ.links.find(l => l.id === 'subway_downtown');
    assert.ok(tun.b.site === 'prebuilt_cyberpunk' && tun.b.part === 'streets' && tun.b.wall === 'free' && tun.b.face === 90 && D.hqLinkLive(tun).b === GRID, 'the tunnel\'s far end');
    assert.ok(sub.b.part === 'streets' && sub.b.wall === 'n' && sub.b.x === 12 && sub.b.leaf === 'leaf_frame_only' && D.hqLinkLive(sub).b === GRID, 'the platform\'s far end');
    const tr = at(GRID, 'link_tunnel_cyberpunk'), st = at(GRID, 'link_subway_downtown');
    assert.ok(tr && tr.way === 'train' && tr.wall === 'free' && st && !st.way && st.leaf === 'leaf_frame_only' && st.wall === 'n', 'the grid wears both');
    /* the station's siding is a street of the plan; the train's body (local x −9..15.4 along room z for face 90) stands on it */
    const info = D.hqTerrainInfo(GRID), siding = HQ.rooms[GRID].terrain.gen.streets.find(s => s.pts[0][0] === -42);
    assert.ok(siding && siding.pts[0][1] <= tr.z - 15.4 && siding.pts[1][1] >= tr.z + 9, 'the siding runs the whole train');
    for (const z of [tr.z + 9, tr.z, tr.z - 15]) assert.ok(D.hqTerrainMaskAt(info, tr.x, z) > 0.5, 'the siding is open under the train at z ' + z);
    const line = D.hqWorldRoutes('foyer').find(r => r.id === 'subway');
    assert.equal(line.stations.map(s => s.room).join(' — '), 'site_prebuilt_fairy_forest — tunnel — site_prebuilt_cyberpunk — site_prebuilt_downtown');
    /* THE ROADS OUT (2026-09-17): the Strip's road lands on the GRID's cross street (its east end, a `road` way) — the board room's north wall carries no link at all now */
    assert.equal(HQ.rooms[CYBER].doors.filter(d => d.link).length, 0); const rd = at(GRID, 'link_strip_cyberpunk'); assert.ok(rd && rd.way === 'road' && rd.wall === 'e' && rd.z === 0, 'the road out east');
    assert.ok(!at(CYBER, 'link_tunnel_cyberpunk') && !at(CYBER, 'link_subway_downtown') && !at(CYBER, 'link_timemachine_cyberpunk'), 'the board room\'s strip is clear');
});

test('THE SUPPLY CLOSET ⇄ THE NOODLE BAR: two small box rooms (four cells a side — THE FIELD\'s lattice flush), each a part with no number, lit by their own bulbs, THE TIME MACHINE free in each (the only way over, set for the other\'s year), the closet off the mall\'s north wing, the noodle bar off the market alley; both land at production; the tapes came off three sites and the hundred stays a hundred', () => {
    for (const [id, site, part, doorId, into, back] of [[CLOSET, 'prebuilt_downtown', 'closet', 'mall', MALL, 'closet'], [NOODLE, 'prebuilt_cyberpunk', 'noodle', 'alley', GRID, 'noodle']]) {
        const r = HQ.rooms[id];
        assert.ok(r.kind === 'box' && r.site === site && r.part === part && r.roomNo === undefined && r.shell.strips === false && r.shell.lights.length === 0 && r.shell.w <= 9 && r.shell.d <= 8, id + ': the sheet');
        assert.ok(Math.abs(r.shell.w / 1.75 - Math.round(r.shell.w / 1.75)) < 1e-9 && Math.abs(r.shell.d / 1.75 - Math.round(r.shell.d / 1.75)) < 1e-9, id + ': whole cells');
        assert.ok(r.props.some(p => p.key === 'bare_bulb' || p.key === 'flicker_tube') && r.props.some(p => p.key === 'railing_1m'), id + ': its own light, the park rule\'s rail');
        const d = at(id, doorId), o = at(into, back);
        assert.ok(d && o && d.action.room === into && d.action.at === back && o.action.room === id && o.action.at === doorId && d.leaf === o.leaf && !(HQ.catalogue[d.leaf] || {}).rank, id + ': the way in pairs');
        const tm = at(id, 'link_timemachine_cyberpunk');
        assert.ok(tm && tm.way === 'timemachine' && tm.wall === 'free' && tm.leaf === null && /SET FOR (1954|2047)/.test(tm.sub), id + ': the machine');
        assert.equal(D.DOOR_TAPES.filter(t => t.where === id).length, 1, id + ': a tape');
        assert.ok(r.npcSpots.every(n => D.AVAILABLE_RACES.includes(n.race)));
    }
    assert.ok(at(CLOSET, 'link_timemachine_cyberpunk').action.room === NOODLE && at(NOODLE, 'link_timemachine_cyberpunk').action.room === CLOSET, 'the pair');
    assert.ok(at(MALL, 'closet').wall === 'n' && at(MALL, 'closet').x === 0, 'the closet\'s door at the end of the north wing');
    assert.equal(D.DOOR_TAPES.length, 100, 'the hundred');
    for (const site of ['prebuilt_technoticlan', 'prebuilt_flatlands']) assert.equal(D.DOOR_TAPES.filter(t => t.site === site && t.where === D.hqSiteRoomId(site)).length, 1, site + ' keeps one');   // THE LEY LINES (2026-09-18): Stonehenge's board is bypassed — its tape is on the plain (hq-leylines)
    assert.ok(!HQ.rooms[MALL].doors.some(d => d.way === 'timemachine'), 'the arcade gave the machine up');
});

test('THE CITY BATCH: every file is in _MISC_GLB under its key once and named once in the renderer; the catalogue rows read the same files (base: misc); the taxi and the truck have _VEHICLE_KIT rows and drive the streets; the bins are placed (city_bin outside, mall_bin inside); the crashed cars, the shelters, the cones, the hydrants stand; the escalator on the mezzanine faces up-ramp; the time machine and the drain are read by the two way builders; the dome is GLB-first with a stand-in and a landmark builder; MODEL_INDEX names every key', () => {
    const table = section(renderer, 'var _MISC_GLB = {', '\n    };');
    for (const [k, f] of Object.entries(BATCH)) {
        assert.match(table, new RegExp('\\n\\s*' + k + ':\\s*\'' + f.replace(/\./g, '\\.') + '\''), k);
        assert.equal(renderer.split(f).length - 1, 1, f + ' named once in the renderer');
        assert.ok(index.includes(k) && index.includes(f), 'MODEL_INDEX names ' + k);
    }
    for (const [k, ck] of Object.entries(CAT_KEYS)) { const c = HQ.catalogue[ck]; assert.ok(c && c.base === 'misc' && c.file === BATCH[k] && (c.h > 0 || c.span > 0), ck + ' is a catalogue row on the misc bucket'); }
    const kit = section(renderer, 'var _VEHICLE_KIT = {', '\n    };');
    for (const k of ['taxi', 'truck']) assert.match(kit, new RegExp('\\n\\s*' + k + ':\\s*\\{ m: [0-9.]+, yaw: [^,]+, foot: [0-9.]+, w: [0-9.]+, h: [0-9.]+, color: 0x[0-9a-f]{6}, lift: [0-9.]+'), k);
    const st = HQ.rooms[STREETS], ml = HQ.rooms[MALL];
    assert.ok(st.terrain.traffic.some(rt => rt.kinds.includes('taxi')) && st.terrain.traffic.some(rt => rt.kinds.includes('truck')), 'the taxi and the truck drive Disaster City');
    assert.ok(st.terrain.features.some(f => f.k === 'scatter' && f.key === 'city_bin') && !st.terrain.features.some(f => f.k === 'scatter' && f.key === 'trash_bin') && ml.terrain.features.some(f => f.k === 'scatter' && f.key === 'mall_bin') && !ml.terrain.features.some(f => f.k === 'scatter' && f.key === 'trash_bin'), 'the bins: outside / inside');
    assert.ok(st.props.filter(p => /^crashed_car/.test(p.key)).length >= 3 && st.props.filter(p => p.key === 'bus_shelter').length === 2 && st.terrain.features.some(f => f.key === 'traffic_cone') && st.terrain.features.some(f => f.key === 'fire_hydrant') && st.terrain.features.some(f => f.key === 'cinder_block') && st.terrain.features.some(f => f.key === 'street_drain'), 'the kerb kit on the streets');
    const ramp = ml.terrain.features.find(f => f.k === 'ramp' && f.escalator);
    assert.ok(ramp && !ramp.stairs && ramp.h1 === 4.6 && ml.terrain.features.filter(f => f.k === 'ramp' && f.escalator).length === 2 && !ml.props.some(p => p.key === 'escalator'), 'two fitted escalators replace the stepped terrain and the duplicate prop (THE THIRD PASS: 4.6 m up to the galleries)');
    const tm = section(renderer, '        timemachine: function (U, ctx) {', '\n        },'), gut = section(renderer, '        gutter: function (U, ctx) {', '\n        },');
    assert.ok(/catalogue \|\| \{\}\)\.time_machine\)/.test(tm) && /cage\.forEach\(function \(m\) \{ m\.visible = false; \}\)/.test(tm), 'the time machine GLB over the cage');
    assert.ok(/catalogue \|\| \{\}\)\.street_drain\)/.test(gut) && /grateBits\.forEach/.test(gut), 'the drain GLB over the grate');
    assert.ok(/function _hzBasilicaDome\(rng\) \{\s*\n\s*if \(typeof _hzMiscKit === 'function'\) return _hzMiscKit\('vatican_dome'/.test(renderer) && /function _hzBasilicaDomeProc\(rng\)/.test(renderer) && /_nrProp\(K, _hzBasilicaDome, K\.CX/.test(renderer), 'the dome GLB-first in the Vatican setting');
    assert.ok(/^        dome: function \(U, o, rng\) \{/m.test(renderer), 'the dome landmark builder');
    assert.ok(/_hzMiscKit\('storefront_unit', \{ metres: L - 0\.3, fit: 'span'/.test(renderer) && /_hzMiscKit\('storefront', \{ metres: Math\.min\(L - 0\.3, 8\), fit: 'span'/.test(renderer), 'the storefront GLBs over the fronts');
});

test('THE ROAD TILES: laid along every street of a sidewalked city plan from _hqBuildTerrain — a straight tile every street width along each segment, a quarter tile on every right-angle vertex (its runs stop half a width short), nothing inside another street\'s corridor; fitted by span, squashed to a kerb; the kill-switches', () => {
    const fn = section(renderer, 'function _hqBuildRoadTiles(room, info, G, TM)', '\n    }');
    for (const f of ["_hzMiscKit(key, { metres: w, fit: 'span'", "grp.scale.y = 0.035 * U /", "window.EW_HQ_NO_ROAD_TILES", "place('road_turn', pts[i][0], pts[i][1], th, w);", "place('road_straight', px, pz, Math.atan2(d.x, d.z), w);", "if (inOther(px, pz, si, w)) continue;", "var s0 = c0 === 'turn' ? w / 2"]) assert.ok(fn.includes(f), f);
    assert.ok(renderer.includes("if (info.genPlan && info.genPlan.streets && info.gen && info.gen.kind === 'city' && info.gen.sidewalk > 0 && typeof window !== 'undefined' && window.EW_HQ_ROAD_TILES) { try { _hqBuildRoadTiles(room, info, G, TM); }"), 'called from the terrain build (the streets, the grid — never the mall), opt-in since THE URBAN PACK (2026-09-17)');
    /* the corner rule, replayed: for a right turn d1 → d2 the tile's +X is −d1 and +Z is d2 (else the mirror) — both assignments land the road on the two adjacent edges */
    const turn = (d1, d2) => { let th = Math.atan2(d2[0], d2[1]); if (Math.abs(Math.cos(th) + d1[0]) > 0.1 || Math.abs(-Math.sin(th) + d1[1]) > 0.1) th = Math.atan2(-d1[0], -d1[1]); const X = [Math.cos(th), -Math.sin(th)], Z = [Math.sin(th), Math.cos(th)]; return { X, Z }; };
    for (const [d1, d2] of [[[1, 0], [0, 1]], [[1, 0], [0, -1]], [[-1, 0], [0, 1]], [[0, 1], [1, 0]], [[0, -1], [-1, 0]], [[0, 1], [-1, 0]]]) {
        const t = turn(d1, d2), okA = Math.abs(t.X[0] + d1[0]) < 1e-9 && Math.abs(t.X[1] + d1[1]) < 1e-9 && Math.abs(t.Z[0] - d2[0]) < 1e-9 && Math.abs(t.Z[1] - d2[1]) < 1e-9;
        const okB = Math.abs(t.X[0] - d2[0]) < 1e-9 && Math.abs(t.X[1] - d2[1]) < 1e-9 && Math.abs(t.Z[0] + d1[0]) < 1e-9 && Math.abs(t.Z[1] + d1[1]) < 1e-9;
        assert.ok(okA || okB, 'the turn ' + d1 + ' → ' + d2 + ' lands on two adjacent edges');
    }
});
