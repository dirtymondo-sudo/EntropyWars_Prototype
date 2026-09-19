// urban-pack.test.js — THE URBAN PACK (2026-09-17): the 320 tileables the user painted at 128 px = one battle tile,
// registered in sprites.js (URBAN_TEXTURES / URBAN_TEX_FAMILIES / urbanTexPick / urbanTexGlow), read by the renderer
// through the `urban:<Name>` key (_hzTex / _hqTex fall through), worn by Disaster City's streets (the asphalt IS the
// field's floor sheet; the paint, the kerbs, the manholes and the signs are _hqBuildRoadMarkings), by THE TEXTURED
// BUILDINGS on the lots (_hqTexBuilding: a facade grid of 1.75 m cells, two a storey), by the hoardings (yard walls in
// the corrugated sheet with the pack's plates) and by the other urban rooms' shells; THE ROADS OUT: a street's end is
// a `road` way (DOOR_HQ.ways.road — the asphalt runs on under a gantry) and the highway's links land on the streets.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs'), path = require('path'), vm = require('vm');
const { loadGameData } = require('./load-data.js');
const REPO = __dirname;
const D = loadGameData({ quiet: true }), HQ = D.DOOR_HQ;
const renderer = fs.readFileSync(path.join(REPO, 'three-renderer.js'), 'utf8');
const sprites = fs.readFileSync(path.join(REPO, 'sprites.js'), 'utf8');
const audio = fs.readFileSync(path.join(REPO, 'audio.js'), 'utf8');
const STREETS = 'site_prebuilt_downtown_streets', GRID = 'site_prebuilt_cyberpunk_streets';

/* sprites.js in a sandbox (the sheet needs Image / a canvas for its data URIs — stubbed) */
function loadSprites() {
    const c = { window: {}, console, Image: function () {}, document: { createElement: () => ({ getContext: () => null }) } };
    vm.createContext(c);
    vm.runInContext(sprites + ';this.__X = { U: URBAN_TEXTURES, F: URBAN_TEX_FAMILIES, pick: urbanTexPick, glow: urbanTexGlow, url: urbanTexUrl, key: urbanTexKey };', c);
    return c.__X;
}
const S = loadSprites();

test('THE REGISTRY: every file in the pack is a name → its R2 url under Assets/Sprites/terrain/urban/, grouped by family; the repo holds the same files', () => {
    const onDisk = new Set([...fs.readdirSync(path.join(REPO, 'textures')).filter(f => f.endsWith('.png')), ...fs.readdirSync(REPO).filter(f => f.endsWith('.png') && /^Tile(Subway|Marble)/.test(f))].map(f => f.slice(0, -4)));
    const names = Object.keys(S.U);
    assert.equal(names.length, 320, 'three hundred and twenty sheets');
    for (const n of names) { assert.equal(S.U[n], 'https://cdn.entropywars.net/Assets/Sprites/terrain/urban/' + n + '.png', n); assert.ok(onDisk.has(n), n + ' is in the repo'); }
    for (const f of onDisk) assert.ok(S.U[f], f + ' is registered');
    const inFam = Object.values(S.F).reduce((a, l) => a + l.length, 0);
    assert.equal(inFam, 320, 'every sheet in exactly one family');
    for (const fam of ['ConcreteStriped', 'PlasterWallPainted', 'PlasterWallStucco', 'MetalCorrugatedPainted', 'GlassWindowSquare', 'GlassWindowSquareBroken', 'GlassWindowTall', 'GlassWindowFactory', 'DecalWindowsResidential', 'DecalWindowsFactory', 'DoorPaintedHalf', 'DoorStorefrontHalf', 'DoorWoodenHalf', 'TileGeneric', 'TileMarble', 'TileSubway', 'MetalSubwayGrill', 'MetalTruss', 'RubberNonSlip', 'SignSpeed', 'SignDanger', 'SignCaution', 'DecalManholeCover', 'FibreCeilingTile']) assert.ok(S.F[fam] && S.F[fam].length >= 1, fam);
    assert.equal(S.key('TileMarble1a'), 'urban:TileMarble1a'); assert.equal(S.url('Nope'), null);
});

test('THE PICK + THE GLOW: a seeded pick is deterministic and filterable; a window sheet names its lit twin (a b / c variant lights like its a), a wall names none', () => {
    assert.equal(S.pick('TileMarble', 0.5), S.pick('TileMarble', 0.5));
    assert.ok(/^GlassWindowSquare\d[a-z]$/.test(S.pick('GlassWindowSquare', 0.2)));
    assert.ok(/^ConcreteStriped2/.test(S.pick('ConcreteStriped', 0.1, /^ConcreteStriped2/)));
    assert.ok(/Broken/.test(S.pick('GlassWindowSquareBroken', 0.9)));
    assert.equal(S.pick('GlassWindowSquare', 0.3, n => /Broken/.test(n)), null, 'an empty filter picks nothing');
    assert.equal(S.glow('GlassWindowSquare2a'), 'GlassWindowSquare2a-Glow'); assert.equal(S.glow('GlassWindowSquare2b'), 'GlassWindowSquare2a-Glow');
    assert.equal(S.glow('GlassWindowTall1a'), 'GlassWindowTall1a-Glow'); assert.equal(S.glow('DecalWindowsFactory2c'), 'DecalWindowsFactory2a-Glow');
    assert.equal(S.glow('DecalWindowsResidential2c'), 'DecalWindowsResidential-Glow2');
    assert.equal(S.glow('MetalTruss1a'), null); assert.equal(S.glow('GlassWindowSquare2a-Glow'), null);
});

test('THE KEY: the renderer\'s two sheet loaders fall through to URBAN_TEXTURES for `urban:<Name>`; TERRAIN_SPRITES never carries the pack', () => {
    assert.ok(/terrainKey\.indexOf\('urban:'\) === 0 && typeof URBAN_TEXTURES !== 'undefined'\) url = URBAN_TEXTURES\[terrainKey\.slice\(6\)\]/.test(renderer), '_hzTex');
    assert.ok(/name\.indexOf\('urban:'\) === 0 && typeof URBAN_TEXTURES !== 'undefined'\) url = URBAN_TEXTURES\[name\.slice\(6\)\]/.test(renderer), '_hqTex');
    const ts = sprites.slice(sprites.indexOf('const TERRAIN_SPRITES = {'), sprites.indexOf('\n};', sprites.indexOf('const TERRAIN_SPRITES = {')));
    assert.ok(!/urban\//.test(ts), 'no pack file in the terrain table');
});

test('THE STREETS IN THE PACK: the asphalt is the field\'s floor sheet, the pavement its path sheet, the yards its cliff sheet; the markings builder stands on it from the terrain build; the GLB tiles are opt-in; a city\'s outer ground is concrete', () => {
    const T = HQ.rooms[STREETS].terrain, G = HQ.rooms[GRID].terrain;
    assert.equal(T.floor, 'urban:PlasterWallPainted1b'); assert.equal(T.path, 'urban:TileGeneric1a'); assert.equal(T.cliff, 'urban:ConcreteStriped2a');
    assert.equal(G.floor, 'urban:PlasterWallPainted1b'); assert.ok(/^urban:/.test(G.path) && /^urban:/.test(G.cliff));
    for (const f of ['function _hqBuildRoadMarkings(room, info, G, TM)', "_hqRoadTexKey('kerb')", "_hqRoadTexKey('manhole')", 'THE CENTRE DASHES', 'THE EDGE LINES', 'THE KERB STONES', 'THE ZEBRA + THE STOP LINE', 'THE MANHOLES', 'THE SPEED SIGNS', "placePlate('SignProhibited1a'", 'window.EW_HQ_NO_ROAD_MARKS',
        "if (info.genPlan && info.genPlan.streets && info.gen && info.gen.kind === 'city') { try { _hqBuildRoadMarkings(room, info, G, TM); }",
        "window.EW_HQ_ROAD_TILES) { try { _hqBuildRoadTiles(room, info, G, TM); }",
        "if (info.gen && info.gen.kind === 'city') { var eo = Math.hypot(Math.max(0, Math.abs(px) - hx), Math.max(0, Math.abs(pz) - hz)), ek = eo / 2.5;"]) assert.ok(renderer.includes(f), f);
    /* the plate faces the road, never a lane's heading (a single-sided plate read mirrored from behind) */
    assert.ok(renderer.includes('yaw: Math.atan2(d.z * sdS, -d.x * sdS)') && renderer.includes('a grey back: a plate is read from its face only'), 'the plates face the road with a back');
    /* the plaza is pavement but the avenue keeps its kerb where the plan test samples it */
    const st = D.hqTerrainInfo(STREETS);
    assert.ok(D.hqTerrainHeight(st, 6.2, -20) - D.hqTerrainHeight(st, 0, -20) > 0.09, 'the kerb');
    assert.ok(T.features.some(f => f.k === 'path' && f.w >= 20 && Math.abs(f.pts[0][0]) < 0.01), 'the plaza path');
});

test('THE HOARDINGS: a city\'s yard walls wear the corrugated sheet one storey tall with the pack\'s plates on the street face (guarded for the stub scenes)', () => {
    for (const id of [STREETS, GRID]) { const g = HQ.rooms[id].terrain.gen; assert.ok(/^urban:MetalCorrugatedPainted/.test(g.fenceKey) && g.fenceH === 1.75, id + ': the hoarding'); const info = D.hqTerrainInfo(id); assert.ok(info.yardWalls.length >= 6 && info.yardWalls.every(w => w.key === g.fenceKey && w.h === 1.75), id + ': the rows'); }
    for (const f of ['function _hqHoardingSigns(w, L, yaw, hM, G, U, info)', "w.yard ? TM * ((typeof HZ_TEX_DENSITY !== 'undefined') ? HZ_TEX_DENSITY : 0.5) : TM", "typeof urbanTexPick !== 'function' || typeof _hzTex !== 'function' || typeof _mulberry32 !== 'function') return;"]) assert.ok(renderer.includes(f), f);
});

test('THE TEXTURED BUILDINGS: a gen.texP share of the lots (seeded per lot) and every low lot are composed from the pack in one batch per sheet; the styles name real families; the fronts skip a textured lot; the shares ride the compiled plan', () => {
    for (const id of [STREETS, GRID]) { const g = HQ.rooms[id].terrain.gen, info = D.hqTerrainInfo(id); assert.equal(g.texP, 0.5, id); assert.equal(info.gen.texP, 0.5, id + ': the share rides the plan'); assert.ok(info.gen.ruinP >= 0 && info.gen.ruinP <= 1); }
    assert.ok(HQ.rooms[STREETS].terrain.gen.ruinP > HQ.rooms[GRID].terrain.gen.ruinP, 'Disaster City is the ruined one');
    const fn = renderer.slice(renderer.indexOf('    var HQ_TEXB = {'), renderer.indexOf('    function _hqBuildCityLots(room, info, G, TM, rng, TK) {'));
    assert.ok(/cell: 1\.75, storey: 3\.5/.test(fn), 'one 128 px tile a cell, two a storey');
    const styles = fn.slice(fn.indexOf('var _HQ_TEX_STYLES = {'), fn.indexOf('};', fn.indexOf('var _HQ_TEX_STYLES = {')));
    for (const fam of styles.match(/'([A-Z][A-Za-z]+)'/g).map(x => x.slice(1, -1))) if (!/^(store|window)$/.test(fam)) assert.ok(S.F[fam] || S.U[fam], 'style family ' + fam);
    for (const f of ['function _hqTexPlan(lot, rng, gen)', 'function _hqTexBatch(G, U, neon)', 'function _hqTexBuilding(lot, info, batch, rng, gen, U)', 'urbanTexGlow(n)', "kind === 'over'", 'emissiveMap = gt', "if (lot.low || lr() < texP) {", 'if (batch) { var nb = batch.flush();', 'if (lot._tex) {', 'window.EW_HQ_NO_TEX_BUILDINGS']) assert.ok(renderer.includes(f), f);
    assert.ok(renderer.includes("texP: (gen.texP != null) ? gen.texP : 0, ruinP: (gen.ruinP != null) ? gen.ruinP : 0.3") || /texP: \(gen\.texP != null\)/.test(fs.readFileSync(path.join(REPO, 'data.js'), 'utf8')), 'the compiler copies the shares');
});

test('THE ROADS OUT: `road` is a catalogued way (wide, open, a pad the width of the street, a sound); the highway\'s four links are roads at both ends on the streets\' ends and the towns\' north lanes; the streets and the grid keep every door reachable', () => {
    const W = HQ.ways.road; assert.ok(W && W.verb && W.sub && W.sfx === 'wayRoad' && W.w >= 9 && W.h >= 4 && W.pad >= 9 && W.open === true, 'catalogued');
    assert.ok(/wayRoad\(ctx, t, out, vol\)/.test(audio) && /wayRoad: 0\.3/.test(audio), 'voiced');
    assert.ok(renderer.includes('        road: function (U, ctx) {') && renderer.includes("var LEN = (_hq && _hq.terrain) ? 40 : 13;") && renderer.includes('THE GANTRY over the mouth'), 'built');
    assert.ok(renderer.includes("cat: W, wx: grp.position.x / U, wz: grp.position.z / U, yaw: grp.rotation.y, y0: y0 })"), 'every way builder is handed its placed frame');
    const L = id => HQ.links.find(l => l.id === id);
    const exp = { downtown_strip: [STREETS, 'w', 0, 'site_prebuilt_strip_streets', 'e', 0], strip_cyberpunk: ['site_prebuilt_strip_streets', 'w', 0, GRID, 'e', 0], stadium_downtown: ['site_prebuilt_stadium_bowl', 'n', -5, STREETS, 'n', 0] };   // THE AREAS (2026-09-18): out of THE BOWL
    for (const [id, e] of Object.entries(exp)) {
        const l = L(id); assert.ok(l && l.way === 'road' && !l.leaf && l.route === 'highway' && D.hqLinkLive(l), id);
        const ra = D.hqLinkRoom(l.a), rb = D.hqLinkRoom(l.b);
        assert.equal(ra, e[0].startsWith('site_') ? e[0] : D.hqSiteRoomId(e[0]), id + ' a'); assert.equal(rb, e[3].startsWith('site_') ? e[3] : D.hqSiteRoomId(e[3]), id + ' b');
        assert.equal(l.a.wall, e[1]); assert.equal(l.b.wall, e[4]);
        const da = HQ.rooms[ra].doors.find(d => d.link === id), db = HQ.rooms[rb].doors.find(d => d.link === id);
        assert.ok(da && db && da.way === 'road' && db.way === 'road' && da.action.room === rb && db.action.room === ra && da.action.at === db.id && db.action.at === da.id, id + ': both ends wear the road and pair');
    }
    assert.ok(!L('streets_stadium'), 'Gate C retired');
    assert.equal(HQ.rooms[D.hqSiteRoomId('prebuilt_downtown')].doors.filter(d => d.link).length, 0, 'the board room\'s north wall is free');
    for (const id of [STREETS, GRID]) {
        const info = D.hqTerrainInfo(id), pads = info.pads;
        for (const d of HQ.rooms[id].doors.filter(d => d.way === 'road')) { const p = pads.find(q => q.door.id === d.id); assert.ok(p && Math.max(p.w, p.d) >= 10, id + '/' + d.id + ': the landing is the street'); }
        const reach = D.hqTerrainReach(info, pads[0].x, pads[0].z);
        for (const p of pads) assert.ok(reach.has(Math.round((p.x - info.x0) / info.res) + ',' + Math.round((p.z - info.z0) / info.res)), id + ': ' + p.door.id + ' is reached');
        assert.equal(D.hqTerrainTraps(info).length, 0, id + ': no trap');
    }
});

test('THE OTHER URBAN ROOMS wear the pack: the platform, the lobby, the casino, the chapel, the mall, the closet and the noodle bar name real sheets on real walls', () => {
    const rooms = { site_prebuilt_downtown_subway: ['TileSubway', 'TileGeneric', 'MetalSubwayGrill'], site_prebuilt_downtown_lobby: ['TileMarble', 'PlasterWallStucco', 'FibreCeilingTile'], site_prebuilt_strip_casino: ['TileMarble', 'PlasterWallPainted'], site_prebuilt_strip_chapel: ['PlasterWallStucco'], site_prebuilt_downtown_mall: ['TileMarble', 'PlasterWallPainted'], site_prebuilt_downtown_closet: ['TileGeneric'], site_prebuilt_cyberpunk_noodle: ['TileSubway', 'MetalCorrugatedPainted'] };
    for (const [id, fams] of Object.entries(rooms)) {
        const Sh = HQ.rooms[id].shell, keys = ['floor', 'wall', 'dado', 'ceiling'].map(k => Sh[k]).filter(Boolean);
        for (const k of keys) if (k.startsWith('urban:')) assert.ok(S.U[k.slice(6)], id + ': ' + k);
        for (const fam of fams) assert.ok(keys.some(k => k.startsWith('urban:' + fam)), id + ' wears ' + fam);
        assert.equal(Sh.ceilTile, 1.75, id + ': the ceiling tiles at the pack\'s density');
    }
});
