// hq-terrain.test.js — THE TERRAIN ROOMS (HQ plan 9.3 stage 4, 2026-09-17)
//
// The user, on the cave grid: "make the exploratory areas more complex with
// different smooth elevations like ridges and ledges and winding pathways and
// inclines and hills and dips and walls … 3D platforming for door gun puzzles
// and ramp-like obstacles and tall platforms for skateboarding tricks and big
// huge jumps. Difficult to get to / hard to see areas for the VHS tapes."
// So a box room may carry `terrain` — a smooth HEIGHT FIELD composed from
// features (data.js hqTerrainCompile) that the renderer draws as one mesh and
// the walker walks by the SAME samples (hqTerrainFeet: no climbing a cliff, any
// drop taken, water waded, a wall solid until you stand on it).
// Guards: the rules ↔ the renderer's constants, every room compiles on real
// sheets, THE SOLVER (from every door every other door is reached), the sills,
// THE PARK RULE (a tier or a ramp AND a rail in every room), the hard tapes
// (`hard` exactly when the walker's reach never gets there — the door gun's),
// props / natives / the spawn on dry walkable ground, the walker's rule on a
// synthetic field, the renderer's sites, the tool.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');
const { loadGameData } = require('./load-data');
const D = loadGameData(), HQ = D.DOOR_HQ;
const TR_RULES = vm.runInContext('TERRAIN_RULES', D);
const renderer = fs.readFileSync(__dirname + '/three-renderer.js', 'utf8');
const ROOMS = D.hqTerrainRooms();
const KINDS = ['hill', 'dip', 'ridge', 'plateau', 'ramp', 'deck', 'pool', 'stream', 'wall', 'rail', 'path', 'tree', 'grove', 'scatter'];
const SPRITES_SRC = fs.readFileSync(require('node:path').join(__dirname, 'sprites.js'), 'utf8');
const sheetOk = k => !!(HQ.textures[k] || TR_RULES[k] || (typeof k === 'string' && k.startsWith('urban:') && SPRITES_SRC.includes("'" + k.slice(6) + "'")));   // THE URBAN PACK (2026-09-17): `urban:<Name>` is a sheet too
const num = re => { const m = re.exec(renderer); assert.ok(m, String(re)); return parseFloat(m[1]); };

test('THE RULES agree with the renderer\'s walker: climb = HQ_STEP_TOL, wade = HQ_WADE_M, body = HQ_BODY_R, a drop is unlimited', () => {
    const R = D.HQ_TERRAIN_RULES;
    assert.equal(R.climb, num(/var HQ_STEP_TOL = ([\d.]+);/));
    assert.equal(R.wade, num(/var HQ_WADE_M = ([\d.]+);/));
    assert.equal(R.bodyR, num(/var HQ_BODY_R = ([\d.]+);/));
    assert.ok(R.dropMax >= 20 && R.maxSlope >= 0.9 && R.wadeMax > R.wade, 'platforming: any drop; a 45° slope is the limit; deep water past the wade');
});

test('the sheet: eighteen terrain rooms — the cave\'s seven, the woods\' seven and the divine stair\'s four — no room wears `cave` any more, every one compiles on real sheets with known feature kinds and a shell of its own', () => {
    assert.equal(ROOMS.length, 36, ROOMS.join(','));   // + AREA 51's three (2026-09-18)   // + D.U.M.B.'s seven (2026-09-17: six parts on Room 555, the ring on Room 999)   // + DISASTER CITY · THE STRIP's streets (2026-09-17)   // + THE VATICAN's four (2026-09-17), + DISASTER CITY's streets and mall (2026-09-17), + CYBERPUNK CITY's grid (the second pass, 2026-09-17)
    assert.equal(D.hqCaveRooms().length, 0, 'the ASCII grid is retired from every room');
    for (const id of ROOMS) {
        const room = HQ.rooms[id], T = room.terrain, info = D.hqTerrainInfo(id);
        assert.ok(room.kind === 'box' && room.shell.w > 0 && room.shell.d > 0, id + ': a box with a size (the grid no longer fits it)');
        assert.ok(info && info.nx > 10 && info.nz > 10 && info.H.length === info.nx * info.nz, id + ': a sampled field');
        assert.ok(sheetOk(info.floor) && sheetOk(info.cliff) && sheetOk(info.path), id + ': the three sheets are real (' + [info.floor, info.cliff, info.path].join(' ') + ')');
        for (const f of T.features) assert.ok(KINDS.includes(f.k), id + ': feature kind ' + f.k);
        for (const f of T.features) if (f.k === 'scatter') assert.ok(HQ.catalogue[f.key], id + ': scatter key ' + f.key);
        for (const q of info.scatter) assert.ok(HQ.catalogue[q.key], id + ': scattered ' + q.key);
        assert.ok(isFinite(info.H[0]) && info.H.every(h => isFinite(h)), id + ': every height finite');
    }
});

test('THE SOLVER: in every room, from every door\'s landing every other door\'s landing is reached under the walker\'s own rule; every sill is its pad\'s height; a door that carries y stands at y', () => {
    for (const id of ROOMS) {
        const room = HQ.rooms[id], info = D.hqTerrainInfo(id), doors = room.doors || [];
        assert.ok(doors.length >= 1, id + ': doors');
        const L = doors.map(d => Object.assign({ d }, D.hqTerrainDoorLanding(room, d)));
        for (const a of L) {
            const reach = D.hqTerrainReach(info, a.x, a.z);
            assert.ok(reach.size > 200, id + '/' + a.d.id + ': a landing the walker can leave (' + reach.size + ')');
            for (const b of L) assert.ok(reach.has(D.hqTerrainNodeKey(info, b.x, b.z)), id + ': ' + a.d.id + ' → ' + b.d.id + ' unreachable');
            const feet = D.hqTerrainFeet(info, a.x, a.z, null);
            assert.ok(feet != null && Math.abs(feet - a.y) < 0.12, id + '/' + a.d.id + ': the landing stands at the sill (' + feet + ' vs ' + a.y + ')');
            if (typeof a.d.y === 'number') assert.equal(D.hqTerrainDoorY(room, a.d), a.d.y, id + '/' + a.d.id + ' at its y');
        }
    }
});

test('THE PARK RULE + THE PLATFORMING: every room has a tier or a ramp AND a rail (a rail, a wall\'s top, a deck\'s rope); every woods room has trees; every closed cave room has a crag; at least five tiers stand higher than a jump', () => {
    let tall = 0;
    for (const id of ROOMS) {
        const room = HQ.rooms[id], T = room.terrain, info = D.hqTerrainInfo(id);
        const F = T.features;
        assert.ok(F.some(f => f.k === 'plateau' || f.k === 'ramp'), id + ': a tier or a ramp');
        assert.ok(info.rails.length >= 1, id + ': a rail to grind (the park rule)');
        if (room.shell.open) { if (room.site === 'prebuilt_fairy_forest') assert.ok(info.trees.length >= 3, id + ': trees in the open'); }   // the woods; heaven's open parts grow none (THE DIVINE STAIR, 2026-09-17)
        else assert.ok(T.crag || T.crag === false || !T.gen || T.gen.kind === 'city' || id.includes('deadmans'), id + ': a closed chamber wears a crag (the storm drain is brick; the archive opts out — its stacks are the walls; a room that is its own floor has none; a mall\'s walls are its store units — DISASTER CITY 2026-09-17)');
        tall += F.filter(f => f.k === 'plateau' && f.h > 1.5).length;
    }
    assert.ok(tall >= 5, 'tall platforms: ' + tall);
});

test('THE HARD TAPES: every find in a terrain room wears its ground height, and `hard` exactly when the walker\'s reach from the first door never gets there; at least six hard tapes stand on pinnacles the door gun reaches', () => {
    let hard = 0, seen = 0;
    for (const f of D.DOOR_HQ.finds) {
        const room = HQ.rooms[f.room]; if (!room || !room.terrain) continue;
        seen++;
        const info = D.hqTerrainInfo(f.room);
        assert.ok(typeof f.y === 'number', f.id + ': a height');
        const L0 = D.hqTerrainDoorLanding(room, room.doors[0]);
        const reach = D.hqTerrainReach(info, L0.x, L0.z);
        const reached = reach.has(D.hqTerrainNodeKey(info, f.x, f.z));
        assert.equal(!!f.hard, !reached, f.id + ': hard ⇔ unreachable');
        if (f.hard) { hard++; assert.ok(f.y >= 2.0, f.id + ': a hard find stands high (' + f.y + ')'); }
        else assert.ok(D.hqTerrainFeet(info, f.x, f.z, null) != null, f.id + ': on walkable ground');
    }
    assert.ok(seen >= 14, 'finds in the terrain rooms: ' + seen);
    assert.ok(hard >= 6, 'hard tapes: ' + hard);
});

test('every floor prop, native, agent and the spawn of a terrain room stands on dry walkable ground (or on a tier it names with y)', () => {
    for (const id of ROOMS) {
        const room = HQ.rooms[id], info = D.hqTerrainInfo(id);
        for (const p of room.props || []) {
            if (p.wall || p.ceil || (HQ.catalogue[p.key] || {}).ceil) continue;
            assert.ok(D.hqTerrainFeet(info, p.x || 0, p.z || 0, null) != null, id + ': ' + p.key + ' at ' + p.x + ',' + p.z + ' stands in a hazard / a wall');
            assert.ok(!D.hqTerrainFluidAt(info, p.x || 0, p.z || 0) || (p.y || 0) > 0.3, id + ': ' + p.key + ' stands in the water');
        }
        for (const q of (room.npcSpots || []).concat(room.agents || [], [room.spawn])) if (q && q.x != null) {
            assert.ok(D.hqTerrainFeet(info, q.x, q.z, null) != null && !D.hqTerrainFluidAt(info, q.x, q.z), id + ': a body at ' + q.x + ',' + q.z + ' stands in a hazard');
            assert.ok(D.hqTerrainSlope(info, q.x, q.z) < 0.7, id + ': a body on a slope at ' + q.x + ',' + q.z);
        }
        for (const t of info.trees) assert.ok(!D.hqTerrainFluidAt(info, t.x, t.z), id + ': a tree in the water');
    }
});

test('THE WALKER\'S RULE on a synthetic field: a plateau is dropped off and never climbed, a ramp is climbed, a low wall is solid below its top and a floor on it, water is waded, deep water and lava are never entered, a pad meets its door', () => {
    const room = { id: 'lab', label: 'LAB', kind: 'box', shell: { w: 30, d: 30, h: 8 }, doors: [{ id: 'a', wall: 'n', x: 0 }, { id: 'b', wall: 's', x: 0, y: 2.0 }, { id: 'w', wall: 'free', x: -10, z: 10, face: 90 }],
        terrain: { floor: 'grass_2', cliff: 'rock_wall_1', features: [
            { k: 'plateau', x: 8, z: 0, w: 6, d: 6, h: 2.5 },
            { k: 'ramp', x0: -8, z0: 6, x1: -8, z1: -2, w: 2, h0: 0, h1: 2.0 },
            { k: 'wall', x0: -2, z0: 8, x1: 2, z1: 8, h: 0.9 },
            { k: 'pool', x: 0, z: -8, r: 2.5, y: -0.2, depth: 0.6 },
            { k: 'pool', x: -9, z: -9, r: 2, y: -0.2, depth: 1.8 },
            { k: 'pool', x: 9, z: -9, r: 2, y: 0.3, depth: 0.6, key: 'lava' },
        ] } };
    const info = D.hqTerrainCompile(room, 'lab');
    const feet = (x, z, cur) => D.hqTerrainFeet(info, x, z, cur);
    assert.ok(Math.abs(feet(8, 0, null) - 2.5) < 0.05, 'the plateau top');
    assert.equal(feet(5.2, 0, 0), null, 'the cliff is not climbed from the floor (the foot of it is stood on)');
    assert.ok(feet(4.9, 0, 2.5) != null && feet(3.0, 0, 2.5) != null && feet(3.0, 0, 2.5) < 0.3, 'the drop off it is taken');
    const r1 = feet(-8, 5, 0); assert.ok(r1 != null && r1 < 0.6, 'the ramp\'s foot');
    let y = 0; for (let z = 5.5; z >= -1.75; z -= 0.25) { const f = feet(-8, z, y); assert.ok(f != null, 'the ramp climbed at z ' + z); y = f; }
    assert.ok(y > 1.85, 'the ramp reaches its top (' + y + ')');
    assert.equal(feet(0, 8, 0), null, 'the wall is solid from the floor');
    assert.ok(Math.abs(feet(0, 8, 0.9) - 0.9) < 0.05, 'and a floor once the feet are at its top');
    assert.ok(Math.abs(feet(0, 8, null) - 0.9) < 0.05, 'a free query stands on the wall');
    assert.ok(Math.abs(feet(0, -8, 0) - (-0.2 - D.HQ_TERRAIN_RULES.wade)) < 0.05, 'the pond is waded at the wade depth');
    assert.equal(feet(-9, -9, 0), null, 'deep water is never entered');
    assert.equal(feet(9, -9, 0), null, 'lava is never entered');
    assert.equal(D.hqTerrainAir(info, 9, -9, 0.5), false, 'nor overflown low');
    assert.equal(D.hqTerrainDoorY(room, room.doors[1]), 2.0, 'the door that carries y');
    assert.ok(Math.abs(D.hqTerrainDoorLanding(room, room.doors[1]).y - 2.0) < 0.001 && Math.abs(feet(0, 15 - 2.4, null) - 2.0) < 0.03, 'its pad meets it');
    assert.ok(Math.abs(feet(-10, 10, null) - D.hqTerrainDoorY(room, room.doors[2])) < 0.03, 'a free way stands on its own pad');
    const dump = D.hqTerrainDump(info, { step: 1 });
    assert.ok(dump.length === 30 && dump.some(l => /\^/.test(l)) && dump.some(l => /~/.test(l)) && dump.some(l => /L/.test(l)) && dump.some(l => /#/.test(l)), 'the dump shows the cliff, the water, the lava, the wall');
});

test('THE RENDERER: the field is built on entry, the walker\'s surface / air / camera / sills read the data rules, the landing reads the height, the box shell draws no floor under it, the scatter is placed as props, the treeline is shared; the field refuses a terrain room (the encounter fights the site\'s Δ)', () => {
    ['function _hqBuildTerrain(room) {', "if (room.terrain) { try { _hqBuildTerrain(room); }", "if (_hq.terrain) { var tt = hqTerrainFeet(_hq.terrain, x, z, curY); if (tt === null) return null; y = tt; }",
     "if (_hq.terrain && !hqTerrainAir(_hq.terrain, x, z, y)) return false;", "if (_hq.terrain) return hqTerrainCam(_hq.terrain, px, pz, py);",
     "if (room && room.terrain && typeof hqTerrainDoorY === 'function') return hqTerrainDoorY(room, door);", "land = _hq.terrain ? hqTerrainHeight(_hq.terrain, pl.x, pl.z) :",
     "if (room.cave || room.terrain) {", ".concat(_hq.terrainScatter || [])", "function _hqPlantTreeline(room, S, halfX, halfZ, plantTree, rng)", "_hq.terrain ? _hq.terrain.rules.dropMax : 0",
     "function _hqHasGround() { return !!(_hq && ((_hq.site && _hq.site.cave) || _hq.terrain)); }", "function _hqTerrainMat(info, S) {", "attribute vec2 aBlend;", "_hq.rails.push.apply(_hq.rails, info.rails);",
     "function _hqTreeWay(U, ctx, dead) {", "hollowtree: function (U, ctx) { return _hqTreeWay(U, ctx, false); },", "deadtree: function (U, ctx) { return _hqTreeWay(U, ctx, true); },"]
        .forEach(f => assert.ok(renderer.includes(f), f));
    assert.equal(renderer.split('land = _hq.terrain ? hqTerrainHeight(').length, 3, 'both landing sites (the walker and the rider)');
    for (const id of ROOMS) assert.equal(D.hqFieldRoomOk(id), false, id + ': no field window on a smooth field');
    assert.ok(HQ.ways.hollowtree && HQ.ways.deadtree && HQ.catalogue.hollow_tree && HQ.catalogue.hollow_dead_tree, 'the two trees with holes in them');
    assert.ok(HQ.rooms.site_prebuilt_fairy_forest_clearing.doors.find(d => d.id === 'forest').way === 'hollowtree', 'the clearing\'s way back is the hollow tree');
    assert.ok(D.hqSiteRoom('prebuilt_fairy_forest').doors.find(d => d.id === 'woods').way === 'hollowtree', 'and so is the forest\'s way in');
    assert.ok(HQ.links.find(l => l.id === 'woods_haunted').way === 'deadtree' && HQ.links.find(l => l.id === 'deadtree_lookingglass').way === 'deadtree', 'the dead tree leads to the house and to the Looking-Glass');
});

test('the tool: check-terrain.js prints every room with every door reached and exits 0', () => {
    const out = execFileSync(process.execPath, [__dirname + '/check-terrain.js', '--json'], { encoding: 'utf8', timeout: 120000 });
    const rows = JSON.parse(out);
    assert.equal(rows.length, ROOMS.length);
    for (const r of rows) assert.equal(r.unreached.length, 0, r.id + ': ' + r.unreached.join(','));
});

test('THE RENDERER on a stub scene: _hqBuildTerrain builds every terrain room — the field mesh with its blend attribute, the sheets, the decks, the walls, the rails on the register, the trees as blockers, the scatter handed to the prop placer — without an error', () => {
    const a = renderer.indexOf('    function _hqTerrainMat(info, S) {'), b = renderer.indexOf('    function _hqBuildSiteBoard(room) {');
    assert.ok(a > 0 && b > a, 'the terrain block stands before _hqBuildSiteBoard');
    const src = renderer.slice(a, b);
    class Obj { constructor() { this.position = { x: 0, y: 0, z: 0, set(x, y, z) { this.x = x; this.y = y; this.z = z; }, copy(p) { this.x = p.x; this.y = p.y; this.z = p.z; } }; this.rotation = { x: 0, y: 0, z: 0, set(x, y, z) { this.x = x; this.y = y; this.z = z; } }; this.scale = { x: 1, y: 1, z: 1, set(x, y, z) { this.x = x; this.y = y; this.z = z; }, setScalar(s) { this.x = this.y = this.z = s; } }; this.children = []; this.parent = null; this.renderOrder = 0; } add(...o) { for (const c of o) { this.children.push(c); c.parent = this; } } }
    class Mesh extends Obj { constructor(g, m) { super(); this.geometry = g; this.material = m; this.isMesh = true; } }
    class Geo { constructor() { this.attributes = {}; } setAttribute(k, v) { this.attributes[k] = v; } setIndex(i) { this.index = i; } computeVertexNormals() { this.normals = true; } translate() {} }
    class Mat { constructor(o) { Object.assign(this, o || {}); this.color = { clone: () => ({ multiplyScalar: () => ({}) }), multiply: () => {} }; this.emissive = null; this.opacity = 1; } }
    const D2 = vm.createContext({ console, window: { EW_HQ_DEBUG: false },
        THREE: { Group: Obj, Mesh, Object3D: Obj, BufferGeometry: Geo, BufferAttribute: class { constructor(a, n) { this.array = a; this.itemSize = n; } }, Float32BufferAttribute: class { constructor(a, n) { this.array = a; this.itemSize = n; } },
                 MeshPhongMaterial: Mat, MeshBasicMaterial: Mat, Color: class { constructor(c) { this.c = c; } }, CircleGeometry: Geo, BoxGeometry: Geo, CylinderGeometry: Geo, ConeGeometry: Geo, PointLight: class extends Obj {}, DoubleSide: 2 },
        hqTerrainInfo: D.hqTerrainInfo, hqTerrainCompile: D.hqTerrainCompile, hqTerrainHeight: D.hqTerrainHeight, hqTerrainSlope: D.hqTerrainSlope, _hqTPolyDist: D._hqTPolyDist,
        _hzKitTs: 0, _hzMiscKit: () => new Obj(), _hzTextTex: () => null, hqTerrainDoorY: D.hqTerrainDoorY,
        _hqBoxWall: (r, wall, d) => { const n = { n:[0,1], s:[0,-1], e:[-1,0], w:[1,0] }[wall] || [0,1]; return { wx:d.x || 0, wz:d.z || 0, nx:n[0], nz:n[1], yaw:0 }; },
        _hqUnits: () => HQ.units, _mulberry32: () => () => 0.5, _hzTex: () => null, _buildFluidTopMat: () => { throw new Error('no shader'); }, _hzGlowSprite: () => { const s = new Obj(); s.material = { opacity: 1 }; return s; },
        _hqBox: () => new Mesh(new Geo(), new Mat()), _hzTileUV: () => {}, _hzBoxUV: () => {}, HQ_PROP_LIGHT_MAX: 10 });
    vm.runInContext(src + '\nthis.build = _hqBuildTerrain;', D2);
    for (const id of ROOMS) {
        const room = HQ.rooms[id];
        const hq = { shellGroup: new Obj(), opts: { room: id }, rails: [], ramps: [], blockers: [], fxPulse: [], propLights: 0, tickers: [] };
        D2._hq = hq;
        D2.build(room);
        const info = D.hqTerrainInfo(id);
        const field = hq.shellGroup.children.find(c => c._ew_hqTerrain);
        assert.ok(field && field.geometry.attributes.aBlend && field.geometry.attributes.position.array.length === info.nx * info.nz * 3 && field.geometry.normals, id + ': the field mesh');
        assert.ok(hq.terrain === info, id + ': the walker reads the same samples');
        assert.equal(hq.blockers.filter(bk => bk.tree).length, info.trees.length, id + ': every tree a blocker');
        assert.ok(hq.rails.length >= info.rails.length && hq.ramps.length === room.terrain.features.filter(f => f.k === 'ramp').length, id + ': the park registers');
        assert.equal((hq.terrainScatter || []).length, info.scatter.length, id + ': the scatter for the placer');
        assert.ok(hq.terrainScatter.every(q => q.rect === false), 'a scattered prop refuses the catalogue rect');
        if (info.fluids.length) assert.ok(hq.fxPulse.length >= 1, id + ': the water sheets pulse without the shader');
    }
});
