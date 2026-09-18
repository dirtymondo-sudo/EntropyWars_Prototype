'use strict';
/* disaster-city-3.test.js — DISASTER CITY, THE THIRD PASS (2026-09-17)
   The user's notes on the mall and the streets: the video settings must still
   adjust the graphics under a map's look; the mall a two-floor skating playground
   with SHOPFRONTS instead of store-unit masses, nothing on the escalator,
   nothing floating; the textured buildings darker; street furniture on the
   kerbs; kerbs and lines mitred at corners; CYBERPUNK CITY IS THE GRID and THE
   STRIP its own area — DISASTER CITY the larger area that holds them. */
const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm');
const { loadGameData } = require('./load-data');
const D = loadGameData(), HQ = D.DOOR_HQ;
const rendererSrc = fs.readFileSync(__dirname + '/three-renderer.js', 'utf8'), mapSrc = fs.readFileSync(__dirname + '/map.js', 'utf8'), postSrc = fs.readFileSync(__dirname + '/three-post.js', 'utf8'), uiSrc = fs.readFileSync(__dirname + '/ui.js', 'utf8');
const MALL = 'site_prebuilt_downtown_mall', STREETS = 'site_prebuilt_downtown_streets', GRID = 'site_prebuilt_cyberpunk_streets', STRIP = 'site_prebuilt_strip_streets', CHAPEL = 'site_prebuilt_strip_chapel';
const at = (id, did) => (HQ.rooms[id].doors || []).find(d => d.id === did);
const extract = (name) => { const a = rendererSrc.indexOf('    function ' + name + '('); assert.ok(a >= 0, name); return rendererSrc.slice(a, rendererSrc.indexOf('\n    }\n', a) + 6); };
const ramp = (px, pz, f) => { const dx = f.x1 - f.x0, dz = f.z1 - f.z0, L = Math.hypot(dx, dz); return { t: ((px - f.x0) * dx + (pz - f.z0) * dz) / (L * L), v: (-(px - f.x0) * dz + (pz - f.z0) * dx) / L }; };

test('THE ENTRY: Cyberpunk City IS the grid, the Strip its own streets, Downtown its streets — every landing in a bypassed board room lands in the part (an `at` the part has is kept, the rest land at the bay door), the part wears the board room\'s egress as its bay door, the grid\'s tenement door is gone, map.js redirects at the one entry point', () => {
    const E = HQ.siteRooms.entry;
    assert.deepEqual(Object.keys(E).sort().join(','), 'prebuilt_area51,prebuilt_camelot,prebuilt_cern,prebuilt_cyberpunk,prebuilt_downtown,prebuilt_dumb,prebuilt_heaven,prebuilt_hell,prebuilt_skinwalker,prebuilt_strip,prebuilt_vatican');   // + CAMELOT CASTLE (2026-09-18: hq-camelot owns it)   // + THE BASES (2026-09-18: hq-area51 / hq-dumb own those three) + THE DIVINE STAIR (2026-09-18: hq-divine owns those three)
    for (const [site, part] of [['prebuilt_cyberpunk', GRID], ['prebuilt_strip', STRIP], ['prebuilt_downtown', STREETS]]) {
        const board = HQ.rooms['site_' + site], eg = board.doors.find(d => d.id === 'egress'), bay = at(part, 'bay');
        assert.ok(bay && bay.entry === site && bay.leaf === eg.leaf && bay.label === eg.label && bay.action.room === eg.action.room && bay.action.at === eg.action.at && bay.wall === E[site].door.wall, part + ': the bay door is the board room\'s egress');
        assert.equal(at(part, 'bay') && HQ.rooms[part].doors.filter(d => d.id === 'bay').length, 1, 'once, never accumulating');
        const e1 = D.hqSiteEntry('site_' + site, 'egress'), e2 = D.hqSiteEntry('site_' + site, 'crossing'), e3 = D.hqSiteEntry('site_' + site, { x: 1, z: 2, face: 90 });
        assert.ok(e1.room === part && e1.at === 'bay' && e2.at === 'bay' && e3.at.x === 1, site + ': egress / crossing / a free spot');
        assert.equal(D.hqSiteEntryOf(site).room, part);
    }
    assert.equal(D.hqSiteEntry('site_prebuilt_downtown', 'tower').at, 'tower', 'the lobby\'s street door lands at the streets\' tower door');
    assert.equal(D.hqSiteEntry('site_prebuilt_moon', 'egress'), null, 'a site without an entry keeps its board room');
    assert.ok(!at(GRID, 'board'), 'the tenement\'s back gate is gone');
    assert.ok(at(CHAPEL, 'street').action.room === STRIP && at(CHAPEL, 'street').action.at === 'chapel' && at(STRIP, 'chapel').action.room === CHAPEL && at(STRIP, 'chapel').action.at === 'street', 'the chapel ⇄ the Strip\'s streets');
    assert.ok(mapSrc.includes("window.hqSiteEntry(roomId, opts.at)") && mapSrc.includes("roomId = ent.room; opts.at = ent.at;") && mapSrc.includes("_hqRecordRoomSeen(roomId);\n                    if (_hqLastRoom === roomId) _hqLastRoom = ent.room;"), 'map.js _hqEnter redirects and marks the board room seen');
    assert.ok(D.hqRoomSite(STRIP) === 'prebuilt_strip' && HQ.rooms[STRIP].part === 'streets', 'the Strip\'s streets are a WILD part of Room 21');
});

test('THE LABELS: Disaster City is the larger area — every part of Downtown, the Strip and Cyberpunk City reads DISASTER CITY · <place>', () => {
    for (const id of Object.keys(HQ.rooms)) {
        const r = HQ.rooms[id]; if (!r.site || !r.part) continue;
        if (!/^prebuilt_(downtown|strip|cyberpunk)$/.test(r.site)) continue;
        assert.match(String(r.label), /^DISASTER CITY · /, id + ': ' + r.label);
    }
    assert.equal(HQ.rooms[GRID].label, 'DISASTER CITY · CYBERPUNK CITY'); assert.equal(HQ.rooms[STRIP].label, 'DISASTER CITY · THE STRIP'); assert.equal(HQ.rooms[STREETS].label, 'DISASTER CITY · DOWNTOWN');
});

test('THE STRIP: a city plan on the Strip\'s own night (hqCityShell strip, the strip look), the boulevard\'s two ends the roads out (downtown_strip east, strip_cyberpunk west — docked on the part, live), every door reached and nothing traps, THE MARQUEE ROOF the hard tape with a shot, the circuit + the traffic, the tape re-homed', () => {
    const r = HQ.rooms[STRIP], S = r.shell, info = D.hqTerrainInfo(STRIP);
    assert.ok(S.open && S.sky && S.sky.night === 1 && S.look === D.HQ_ROOM_LOOKS.strip && S.mood.night === 1, 'the Strip\'s night');
    assert.ok(info.gen && info.gen.kind === 'city' && r.terrain.gen.neon && info.lots.length >= 10 && info.fronts.length >= 6 && info.gen.sidewalk === 3.0, 'the plan: lots ' + info.lots.length);
    const a = HQ.links.find(l => l.id === 'downtown_strip'), b = HQ.links.find(l => l.id === 'strip_cyberpunk');
    assert.ok(a.b.part === 'streets' && a.b.wall === 'e' && b.a.part === 'streets' && b.a.wall === 'w' && a.way === 'road' && b.way === 'road', 'the roads out');
    assert.ok(D.hqLinkLive(a) && D.hqLinkLive(b), 'both live');
    assert.ok(at(STRIP, 'link_downtown_strip') && at(STRIP, 'link_strip_cyberpunk') && at(STRIP, 'bay') && at(STRIP, 'chapel'), 'four doors');
    const foot = D.hqTerrainDoorLanding(r, at(STRIP, 'chapel')), R = D.hqTerrainReach(info, foot.x, foot.z);
    for (const d of r.doors) { const l = D.hqTerrainDoorLanding(r, d); assert.ok(R.has(D.hqTerrainNodeKey(info, l.x, l.z)), d.id + ' reached'); }
    assert.equal(D.hqTerrainTraps(info).length, 0, 'nothing traps');
    const deck = r.terrain.features.find(f => f.k === 'plateau' && f.h === 2.4);
    assert.ok(R.has(D.hqTerrainNodeKey(info, deck.x, deck.z)) && Math.abs(R.get(D.hqTerrainNodeKey(info, deck.x, deck.z)) - 2.4) < 0.3, 'THE VALET DECK is walked up to');
    const rows = D.hqFindsForRoom(STRIP), tape = rows.find(x => /^tape:/.test(x.id)), pin = HQ.findSpots[STRIP].tape;
    assert.ok(tape && tape.hard === true && tape.x === pin.x && tape.z === pin.z && tape.y >= 4.4, 'the tape is high and hard');
    assert.ok(!R.has(D.hqTerrainNodeKey(info, pin.x, pin.z)), 'THE MARQUEE ROOF is the door gun\'s');
    const shot = D.hqFindHardReachTerrain(tape, D.hqFindRoomInfo(STRIP)); assert.ok(shot && shot.ok === true, JSON.stringify(shot));
    assert.ok(info.race && info.race.gates === 6 && info.traffic.length === 3 && info.traffic.every(t => t.kinds.length), 'the circuit + the traffic');
    assert.equal(D.DOOR_TAPES.filter(t => t.where === STRIP).length, 1); assert.equal(D.DOOR_TAPES.filter(t => t.where === D.hqSiteRoomId('prebuilt_strip')).length, 1); assert.equal(D.DOOR_TAPES.length, 100);
    assert.ok(r.props.some(p => p.key === 'railing_1m') && r.props.filter(p => p.key === 'quarter_pipe').length === 2 && r.props.some(p => /^riser_/.test(p.key)), 'the park rule');
    for (const p of r.props) if (!p.wall && !p.ceil) assert.ok(!D.hqTerrainSolidAt(info, p.x, p.z, 0) || /^car_/.test(p.key) === false, p.key + ' stands in the open');
    assert.ok(!D.hqTerrainSolidAt(info, r.spawn.x, r.spawn.z, 0.3) && D.hqTerrainFeet(info, r.spawn.x, r.spawn.z, null) !== null && Math.abs(r.spawn.z) > 7, 'the spawn stands off the boulevard\'s lanes');
});

test('THE MALL: one open box (96 × 64 × 12), no floor plan and no store-unit mass, TWO FLOORS — the galleries at 4.6 m and the east bridge reached up both escalators and both stairs from the street door — the fun box, the grind ledges, the half pipe, THE CLOCK TOWER hard with a shot, eleven shopfront runs, nothing on a ramp, nothing floating', () => {
    const r = HQ.rooms[MALL], S = r.shell, T = r.terrain, info = D.hqTerrainInfo(MALL);
    assert.ok(S.w === 96 && S.d === 64 && S.h === 12 && !S.open && S.look === D.HQ_ROOM_LOOKS.mall, 'the box');
    assert.ok(!T.gen && !info.gen && !(info.lots || []).length && !info.maskD, 'no plan, no mass');
    const galleries = T.features.filter(f => f.k === 'plateau' && f.h === 4.6);
    assert.equal(galleries.length, 5, 'four galleries + the bridge');
    const foot = D.hqTerrainDoorLanding(r, at(MALL, 'street')), R = D.hqTerrainReach(info, foot.x, foot.z);
    for (const g of galleries) assert.ok(R.has(D.hqTerrainNodeKey(info, g.x, g.z)) && Math.abs(R.get(D.hqTerrainNodeKey(info, g.x, g.z)) - 4.6) < 0.3, 'the upper floor is walked (' + g.x + ',' + g.z + ')');
    const esc = T.features.filter(f => f.k === 'ramp' && f.escalator), stairs = T.features.filter(f => f.k === 'ramp' && f.stairs);
    assert.ok(esc.length === 2 && stairs.length === 2 && esc.every(f => f.h1 === 4.6 && Math.hypot(f.x1 - f.x0, f.z1 - f.z0) >= 9), 'two escalators, two stairs');
    for (const f of esc.concat(stairs)) assert.ok(R.has(D.hqTerrainNodeKey(info, f.x1, f.z1)) && Math.abs(R.get(D.hqTerrainNodeKey(info, f.x1, f.z1)) - 4.6) < 0.35, 'the top of each is reached');
    assert.ok(R.has(D.hqTerrainNodeKey(info, at(MALL, 'closet').x || 0, -30)) && D.hqTerrainReach(info, foot.x, foot.z).size > 15000, 'the north wing at ground level');
    assert.equal(D.hqTerrainTraps(info).length, 0, 'nothing traps');
    assert.ok(T.features.some(f => f.k === 'plateau' && f.h === 0.9) && T.features.filter(f => f.k === 'wall' && f.h === 0.45).length === 2 && T.features.filter(f => f.k === 'rail').length >= 9 && r.props.filter(p => p.key === 'quarter_pipe').length === 2, 'the park');
    const box = T.features.find(f => f.k === 'plateau' && f.h === 0.9); assert.ok(Math.abs(R.get(D.hqTerrainNodeKey(info, box.x, box.z)) - 0.9) < 0.2, 'the fun box is walked');
    const tape = D.hqFindsForRoom(MALL).find(x => /^tape:/.test(x.id)), pin = HQ.findSpots[MALL].tape;
    assert.ok(tape.hard && tape.x === pin.x && tape.z === pin.z && tape.y >= 8 && !R.has(D.hqTerrainNodeKey(info, pin.x, pin.z)), 'THE CLOCK TOWER');
    assert.ok(D.hqFindHardReachTerrain(tape, D.hqFindRoomInfo(MALL)).ok === true, 'the door gun has a shot');
    assert.equal(info.shops.length, 11); assert.ok(info.shops.every(s => Math.hypot(s.nx, s.nz) > 0.99 && (s.lip === 4.6 || s.wall)), 'every run faces a way and dresses a lip or a wall');
    for (const s of info.shops.filter(s => s.lip)) { const mx = s.x0 + (s.x1 - s.x0) * 0.15, mz = s.z0 + (s.z1 - s.z0) * 0.15;   /* clear of the stairs and the escalators */ assert.ok(Math.abs(D.hqTerrainHeight(info, mx - s.nx * 0.6, mz - s.nz * 0.6) - 4.6) < 0.05 && D.hqTerrainHeight(info, mx + s.nx * 0.8, mz + s.nz * 0.8) < 0.1, 'a lip run stands on a 4.6 m face (' + mx + ',' + mz + ')'); }
    /* nothing on a ramp, nothing on a slope, nothing in the water */
    const ramps = T.features.filter(f => f.k === 'ramp');
    for (const q of info.scatter) {
        for (const f of ramps) { const L = ramp(q.x, q.z, f); assert.ok(!(L.t > -0.15 && L.t < 1.15 && Math.abs(L.v) < f.w / 2 + q.r + 0.7), q.key + ' on a ramp at ' + q.x + ',' + q.z); }
        assert.ok(D.hqTerrainSlope(info, q.x, q.z) <= 0.25 && !D.hqTerrainFluidAt(info, q.x, q.z), q.key + ' on flat dry ground');
    }
    assert.ok(info.scatter.length >= 20, 'the furniture landed (' + info.scatter.length + ')');
    const nb = r.props.find(p => p.key === 'notice_board'); assert.ok(nb && nb.wall && nb.mount, 'the directory hangs on a wall');
    for (const p of r.props) if (!p.wall && !p.ceil) for (const f of ramps) { const L = ramp(p.x, p.z, f); assert.ok(!(L.t > -0.1 && L.t < 1.1 && Math.abs(L.v) < f.w / 2 + 0.6), p.key + ' stands on a ramp'); }
    assert.ok(r.npcSpots.every(n => D.hqTerrainFeet(info, n.x, n.z, null) !== null) && D.hqTerrainFeet(info, r.spawn.x, r.spawn.z, null) === 0, 'the natives and the spawn stand');
    assert.equal(D.DOOR_TAPES.filter(t => t.where === MALL).length, 1);
});

test('THE KERB RULE: in a city plan the seeded street furniture (bins, hydrants, cones, signposts, benches) stands on the SIDEWALK — never in the roadway, never deep in a yard, never on a ramp — on the streets, the grid and the Strip; a row with its own centre (the collapse\'s rubble) keeps its ground', () => {
    for (const id of [STREETS, GRID, STRIP]) {
        const r = HQ.rooms[id], info = D.hqTerrainInfo(id), walk = info.gen.sidewalk;
        const seeded = r.terrain.features.filter(f => f.k === 'scatter' && !(f.x != null && f.r)).map(f => f.key);
        let n = 0;
        for (const q of info.scatter) {
            if (!seeded.includes(q.key)) continue;
            const md = D.hqTerrainMaskAt(info, q.x, q.z);
            assert.ok(md <= walk - q.r * 0.5 + 1e-6 && md >= q.r + 0.35 - 1e-6, id + ': ' + q.key + ' at ' + q.x + ',' + q.z + ' maskD ' + md.toFixed(2));
            assert.ok(D.hqTerrainSlope(info, q.x, q.z) <= 0.25, id + ': ' + q.key + ' on a slope');
            n++;
        }
        assert.ok(n >= 10, id + ': ' + n + ' pieces on the kerbs');
        for (const f of r.terrain.features.filter(f => f.k === 'ramp')) for (const q of info.scatter) { const L = ramp(q.x, q.z, f); assert.ok(!(L.t > -0.15 && L.t < 1.15 && Math.abs(L.v) < f.w / 2 + q.r + 0.7), id + ': ' + q.key + ' on a ramp'); }
    }
    const st = D.hqTerrainInfo(STREETS); assert.ok(st.scatter.some(q => q.key === 'cave_stone') && st.scatter.some(q => q.key === 'cinder_block'), 'the collapse keeps its rubble');
    assert.ok(rendererSrc.includes("m.color = new THREE.Color(neon ? HQ_TEXB.tintNeon : HQ_TEXB.tint);") && /tint: 0x[0-9a-f]{6}, tintNeon: 0x[0-9a-f]{6}/.test(rendererSrc), 'the textured buildings wear one tint each');
    const m = rendererSrc.match(/tint: 0x([0-9a-f]{6}), tintNeon: 0x([0-9a-f]{6})/); assert.ok(parseInt(m[1], 16) < 0xb8b8b8 && parseInt(m[2], 16) < 0x8c8ca4, 'darker than white / than the old neon tint');
});

test('THE LOOK YIELDS: a scene look fills in only the settings still at their factory default — a slider the player moved wins over it (retro, cinematic, bloom, exposure, night mood, dof); the hint says so', () => {
    const a = postSrc.indexOf('    var _look = null;'), b = postSrc.indexOf('    function setSceneLook(look)');
    assert.ok(a > 0 && b > a);
    const RETRO = { enabled: true, preset: 'dream', pixelSize: 2.0, ditherStrength: 0.2, grain: 0.006, levels: 28.0, tintAmount: 0.45 };
    const mkCtx = (retro, cin, nums) => {
        const c = { Math, RETRO_PRESETS: { dream: { levels: 28, tintAmount: 0.45 }, faded: { levels: 20, tintAmount: 0.35 }, amber: { levels: 22, tintAmount: 0.42 } },
            _retro: Object.assign({}, RETRO, retro || {}), _RETRO_FACTORY: Object.assign({}, RETRO), _cin: Object.assign({ vignette: true, vigAmount: 0.35, vigSize: 0.275 }, cin || {}), _CIN_FACTORY: { vignette: true, vigAmount: 0.35, vigSize: 0.275 },
            EXPOSURE_FACTORY: 1.0, BLOOM_FACTORY: 0.05, DOF_FACTORY: 0.65, NIGHT_FACTORY: 0.4, _exposureUser: (nums && nums.exposure) || 1.0, BLOOM_USER_STRENGTH: (nums && nums.bloom) || 0.05, _dofStrength: (nums && nums.dof) || 0.65, _nightMood: (nums && nums.night) || 0.4 };
        vm.createContext(c); vm.runInContext(postSrc.slice(a, b), c); return c;
    };
    const look = { retro: { preset: 'faded', ditherStrength: 0.4, grain: 0.04 }, cin: { vigAmount: 0.55 }, bloom: 0.14, nightMood: 0.15 };
    let c = mkCtx(); c._look = look;
    assert.equal(c._lkRetro().preset, 'faded'); assert.equal(c._lkRetro().levels, 20); assert.equal(c._lkRetro().ditherStrength, 0.4); assert.equal(c._lkCin().vigAmount, 0.55); assert.equal(c._lkNum('bloom', 0.05), 0.14); assert.equal(c._lkNum('nightMood', 0.4), 0.15);
    assert.equal(c._lkNum('exposure', 1.0), 1.0, 'a key the look does not name stays the player\'s');
    c = mkCtx({ preset: 'amber', ditherStrength: 0.6 }, { vigAmount: 0.1 }, { bloom: 0.8, night: 0.9 }); c._look = look;
    assert.equal(c._lkRetro().preset, 'amber', 'the player chose a preset'); assert.equal(c._lkRetro().levels, 28, 'the look\'s preset re-seeds nothing once the player owns the preset'); assert.equal(c._lkRetro().ditherStrength, 0.6); assert.equal(c._lkRetro().grain, 0.04, 'an untouched slider still takes the look');
    assert.equal(c._lkCin().vigAmount, 0.1); assert.equal(c._lkNum('bloom', 0.8), 0.8); assert.equal(c._lkNum('nightMood', 0.9), 0.9);
    assert.equal(Array.from(c.getSceneLookOwned()).sort().join(','), 'bloom,cin.vigAmount,nightMood,retro.ditherStrength,retro.preset');
    c = mkCtx(); c._look = null; assert.equal(c._lkRetro(), c._retro); assert.equal(c._lkCin(), c._cin);
    assert.ok(postSrc.includes('getSceneLookOwned: getSceneLookOwned,') && uiSrc.includes('a slider you move wins'), 'exported, and the hint says it');
});

test('THE SHOPFRONTS + THE BALUSTRADES (the renderer on a stub scene): every run of the mall becomes bays — glazing or a shutter, a door, a sign per bay, pilasters — merged per sheet, a lip run gets its balcony fascia and edge quad; an escalator wears two side panels from below the floor to a metre over the treads', () => {
    const geos = [], meshes = [];
    class Vec { constructor() { this.x = 0; this.y = 0; this.z = 0; } set(x, y, z) { this.x = x; this.y = y; this.z = z; } }
    class Group { constructor() { this.position = new Vec(); this.rotation = new Vec(); this.scale = new Vec(); this.children = []; this.visible = true; } add(n) { this.children.push(n); } }
    class Geo { constructor() { this.attrs = {}; geos.push(this); } setAttribute(k, a) { this.attrs[k] = a; } setIndex(i) { this.index = i; } computeVertexNormals() {} }
    class Attr { constructor(arr, n) { this.array = arr; this.itemSize = n; } }
    class Mesh extends Group { constructor(g, m) { super(); this.geometry = g; this.material = m; meshes.push(this); } }
    class Mat { constructor(o) { Object.assign(this, o || {}); } }
    class Color { constructor(v) { this.v = v; } }
    const c = { Math, console, window: {}, THREE: { Group, Mesh, BufferGeometry: Geo, Float32BufferAttribute: Attr, MeshLambertMaterial: Mat, MeshPhongMaterial: Mat, MeshBasicMaterial: Mat, Color, DoubleSide: 2, BoxGeometry: class {}, GLTFLoader: function () {} },
        _hqUnits: () => 1, _hzTex: () => null, _hzTextTex: (k) => ({ key: k }), _mulberry32: (s) => () => 0.5, _HQ_STORE_NAMES: ['A', 'B'], hqTerrainHeight: () => 0, urbanTexGlow: () => null, urbanTexPick: () => null, _hzKitTs: 0, _hzMiscKit: () => new Group() };
    vm.createContext(c);
    vm.runInContext(rendererSrc.slice(rendererSrc.indexOf('    var HQ_SHOP = {'), rendererSrc.indexOf('    /* The escalator replaces the visible terrain ramp.')), c);
    vm.runInContext(extract('_hqBuildEscalators'), c);
    const room = HQ.rooms[MALL], info = D.hqTerrainInfo(MALL), G = new Group();
    c._hqBuildShopfronts(room, info, G, 1.75, () => 0.5);
    const shopMeshes = meshes.filter(m => m._ew_hqShop);
    const bays = info.shops.reduce((n, r) => n + Math.max(1, Math.round(Math.hypot(r.x1 - r.x0, r.z1 - r.z0) / c.HQ_SHOP.bay)), 0);
    assert.ok(bays >= 60 && shopMeshes.length === bays + 5 - (shopMeshes.some(m => m.material.map === null && m.geometry.attrs.position.array.length === 0) ? 1 : 0) || shopMeshes.length >= bays + 3, 'a sign mesh per bay + the merged sheets (' + shopMeshes.length + ' for ' + bays + ' bays)');
    assert.ok(shopMeshes.every(m => m._ew_hqPart === 'wall'), 'every piece is a wall part (the room in the battle drops it by part)');
    /* the lip runs: the balcony's edge quad lies at 4.62 and spans from the rect line to the panel plane */
    const floorMesh = shopMeshes.find(m => m.material && m.material.color === room.shell.floorColor);
    assert.ok(floorMesh, 'the edge quads share the floor sheet');
    const P = floorMesh.geometry.attrs.position.array; let minY = Infinity, maxY = -Infinity; for (let i = 1; i < P.length; i += 3) { minY = Math.min(minY, P[i]); maxY = Math.max(maxY, P[i]); }
    assert.ok(Math.abs(minY - (4.62 + 0.3)) < 1e-6 && Math.abs(maxY - (4.62 + 0.3)) < 1e-6, 'flat at the lip (' + minY + ')');
    assert.equal(P.length / 12, info.shops.filter(r => r.lip).length, 'one edge quad per lip run');
    /* the glazing never stands past the panel plane; the wall pieces reach the lip */
    const wallMesh = shopMeshes.find(m => m.material && m.material.color === room.shell.wallColor); const W = wallMesh.geometry.attrs.position.array; let wMax = -Infinity; for (let i = 1; i < W.length; i += 3) wMax = Math.max(wMax, W[i]);
    assert.ok(Math.abs(wMax - (4.6 + c.HQ_SHOP.glassTop + c.HQ_SHOP.fasciaH + 0.25 + 0.3)) < 1e-6, 'the upper floor\'s pilasters reach their tops (' + wMax + ')');
    /* the balustrades */
    const S2 = new Group(); c._hqBuildEscalators(room, info, S2, 1.75);
    assert.equal(S2.children.length, 2, 'two escalators');
    for (const g of S2.children) {
        const bal = g.children.find(m => m._ew_hqBalustrade); assert.ok(bal, 'a balustrade');
        const A = bal.geometry.attrs.position.array; let lo = Infinity, hi = -Infinity, xs = new Set(); for (let i = 0; i < A.length; i += 3) { lo = Math.min(lo, A[i + 1]); hi = Math.max(hi, A[i + 1]); xs.add(Math.round(Math.abs(A[i]) * 100)); }
        assert.ok(lo < 0 && Math.abs(hi - (4.6 + 1.0)) < 1e-6 && xs.has(Math.round((2.4 / 2 + 0.55) * 100)), 'from below the floor to a metre over the top, 0.55 m outside the treads');
    }
    assert.ok(rendererSrc.includes("try { _hqEscalatorBalustrades(group, f, U); }") && rendererSrc.includes("_hqBuildShopfronts(room, info, G, TM, rng)"), 'wired');
});

test('THE MITRE: at a same-street right angle the two segments\' kerb stones meet at the outer corner (a kerb quad covers the corner square) and the inner kerbs stop short of each other; an open end is untouched', () => {
    const bk = [];
    class Vec { constructor() { this.x = 0; this.y = 0; this.z = 0; } set(x, y, z) { this.x = x; this.y = y; this.z = z; } }
    class Group { constructor() { this.position = new Vec(); this.rotation = new Vec(); this.children = []; } add(n) { this.children.push(n); } }
    class Geo { setAttribute(k, a) { this[k] = a; } setIndex(i) { this.index = i; } computeVertexNormals() {} }
    class Attr { constructor(arr) { this.array = arr; } }
    class Mesh extends Group { constructor(g, m) { super(); this.geometry = g; this.material = m; } }
    class Mat { constructor(o) { Object.assign(this, o || {}); } }
    const c = { Math, console, window: {}, THREE: { Group, Mesh, Object3D: Group, BufferGeometry: Geo, Float32BufferAttribute: Attr, MeshLambertMaterial: Mat, MeshPhongMaterial: Mat, Color: class { constructor(v) { this.v = v; } }, CylinderGeometry: class {}, PlaneGeometry: class {} },
        _hqUnits: () => 1, _hzTex: () => null, _hqRoadTexKey: () => '', hqTerrainHeight: () => 0, hqTerrainMaskAt: () => 1, _hqTPolyDist: D._hqTPolyDist, _hq: { blockers: [] } };
    vm.createContext(c);
    vm.runInContext(rendererSrc.slice(rendererSrc.indexOf('    var HQ_ROAD = {'), rendererSrc.indexOf('    /* THE STREET LAMPS:')), c);
    const G = new Group(), w = 8, kOff = w / 2 + c.HQ_ROAD.kerbW / 2;
    c._hqBuildRoadMarkings({}, { genPlan: { streets: [{ pts: [[0, 0], [20, 0], [20, 20], [0, 20], [0, 0]], w, loop: true }], walkW: 2.4 }, gen: { neon: false }, halfW: 60, halfD: 60, pads: [] }, G, 1.75);
    const kerb = G.children.find(m => m.material && m.material.shininess === 4); assert.ok(kerb, 'the kerb mesh');
    const P = kerb.geometry.position.array, quads = []; for (let i = 0; i + 11 < P.length; i += 12) quads.push([[P[i], P[i + 2]], [P[i + 3], P[i + 5]], [P[i + 6], P[i + 8]], [P[i + 9], P[i + 11]]]);
    const inQuad = (q, x, z) => { let s = 0; for (let i = 0; i < 4; i++) { const a = q[i], b = q[(i + 1) % 4], cr = (b[0] - a[0]) * (z - a[1]) - (b[1] - a[1]) * (x - a[0]); if (Math.abs(cr) < 1e-9) continue; if (!s) s = Math.sign(cr); else if (Math.sign(cr) !== s) return false; } return true; };
    /* the loop [0,0]→[20,0]→[20,20]→[0,20]: the outer kerbs run at z −kOff (north leg), x 20 + kOff (east), z 20 + kOff, x −kOff; the outer corner square at (20 + kOff·0.5, −kOff·0.5) must be under a kerb; the inner corner at (20 − w/2 − 0.6, w/2 + 0.6) must NOT */
    assert.ok(quads.some(q => inQuad(q, 20 + kOff, -kOff)), 'the outer corner is kerbed');
    assert.ok(quads.some(q => inQuad(q, -kOff, -kOff)), 'and the first corner (the loop\'s seam)');
    assert.ok(!quads.some(q => inQuad(q, 20 - kOff + 1.0, kOff)), 'the inner kerbs stop short of the crossing');
    assert.ok(!quads.some(q => inQuad(q, 20 - kOff * 0.5, 20 - kOff * 0.5)), 'no kerb inside the road at the far inner corner');
    /* an open street: no extension past its end */
    const G2 = new Group(); c._hqBuildRoadMarkings({}, { genPlan: { streets: [{ pts: [[0, 0], [20, 0]], w }], walkW: 2.4 }, gen: {}, halfW: 60, halfD: 60, pads: [] }, G2, 1.75);
    const k2 = G2.children.find(m => m.material && m.material.shininess === 4), P2 = k2.geometry.position.array; let xmin = Infinity, xmax = -Infinity; for (let i = 0; i < P2.length; i += 3) { xmin = Math.min(xmin, P2[i]); xmax = Math.max(xmax, P2[i]); }
    assert.ok(xmin >= -1e-6 && xmax <= 20 + 1e-6, 'an open end runs 0..L (' + xmin + '..' + xmax + ')');
    assert.ok(rendererSrc.includes('var mitre = function (vi, sd, off, dOwn)') && rendererSrc.includes('for (var u = -mA; u <= L + mB; u += 0.5)') && rendererSrc.includes('for (var u2 = -kA; u2 <= L + kB; u2 += 0.5)'), 'the edge lines and the kerbs both read the mitre');
});
