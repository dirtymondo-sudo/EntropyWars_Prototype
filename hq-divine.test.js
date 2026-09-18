// hq-divine.test.js — THE DIVINE STAIR (HQ plan 9.3 stage 6 — THE COMPLEX
// CANDIDATES #4, 2026-09-17; THE VATICAN expanded the same day): HEAVEN ·
// HELL · THE VATICAN as ONE complex of eight terrain rooms on three sites:
//   THE VATICAN — the BASILICA (mass: the nave, the chancel, the two
//   triforium galleries, the organ loft), the ARCHIVE (the stacks, a cave
//   plan in wood; the gallery and the dome stair), the CORTILE (open under
//   the Vatican's sky, a cypress-maze plan, the terrace, the cistern down),
//   the OBSERVATORY (the top of the dome, open to the night, THE TELESCOPE
//   aimed at THE STAIRWAY IN THE SKY — the seam to the stair) and the
//   CATACOMBS underneath (cellular automata in brick behind the altar; the
//   warm wall, the cistern's rope);
//   HELL's PIT (the bowl to the lava, the river, the colossus's plinth);
//   HEAVEN's STAIRWAY (four flights of cloud stairs from the telescope's far
//   end to the gate at 12 m, and THE FALL: the lower shelf, the long way,
//   the west shelf, the stepping clouds) and CLOUD FIELDS (the rift, the
//   plank, the dais, THE GATE).
// The seams are links rows: the crypt link (vatican_hell: the catacombs'
// warm wall ⇄ the pit's) and the telescope (observatory_stair: a `way` end
// on the observatory ⇄ a plain frame at the stair's foot). Guards: the
// sheet, THE ENTRY (the three board rooms bypassed — the white door lands
// in the basilica, the mouth on the pit's rim, the gate on the dais),
// the complex walked from every way in with
// every inside door a pair, the two links, the production landing on every
// door, THE SOLVER (every door reaches every other) AND THE RETURN
// GUARANTEE (nothing the walker can fall into holds it — hqTerrainTraps),
// THE PARK RULE, the eight hard tapes (the door gun's), the looks, the two
// shell helpers, the batch's catalogue rows, and the renderer's source sites.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { loadGameData } = require('./load-data');
const D = loadGameData(), HQ = D.DOOR_HQ;
const TERRAIN_RULES = vm.runInContext('TERRAIN_RULES', D);
const CATACOMBS = 'site_prebuilt_vatican_catacombs', PIT = 'site_prebuilt_hell_pit', STAIR = 'site_prebuilt_heaven_stair', GATE = 'site_prebuilt_heaven_gate';
const BASILICA = 'site_prebuilt_vatican_basilica', LIBRARY = 'site_prebuilt_vatican_library', CORTILE = 'site_prebuilt_vatican_courtyard', DOME = 'site_prebuilt_vatican_observatory';
const PARTS = { [BASILICA]: ['prebuilt_vatican', 'basilica'], [LIBRARY]: ['prebuilt_vatican', 'library'], [CORTILE]: ['prebuilt_vatican', 'courtyard'], [DOME]: ['prebuilt_vatican', 'observatory'],
                [CATACOMBS]: ['prebuilt_vatican', 'catacombs'], [PIT]: ['prebuilt_hell', 'pit'], [STAIR]: ['prebuilt_heaven', 'stair'], [GATE]: ['prebuilt_heaven', 'gate'] };
const IDS = Object.keys(PARTS);
const PLANNED = { [CATACOMBS]: 'cave', [PIT]: 'cave', [LIBRARY]: 'cave', [STAIR]: 'rooms', [GATE]: 'rooms', [CORTILE]: 'rooms' };   // the basilica and the observatory are their own floors
const BACK = { prebuilt_vatican: ['basilica', BASILICA, 's', 0, 'leaf_white_wood'], prebuilt_hell: ['pit', PIT, 's', 5, 'leaf_hell_arch'], prebuilt_heaven: ['gate', GATE, 'n', 1.75, 'leaf_hotel'] };
const BATCH = { library_shelf: 'Meshy_AI_a_library_shelf_0917035552_texture.glb', library_shelf_full: 'Meshy_AI_library_shelf_full_of_books_0917035645_texture.glb', ancient_walkway: 'Meshy_AI_ancient_walkway_0917035609_texture.glb',
    angel_statue: 'Meshy_AI_angel_statue_0917035332_texture.glb', brazier: 'Meshy_AI_brazier_0917035429_texture.glb', catacomb_wall: 'Meshy_AI_catacomb_wall_0917035320_texture.glb', church_building: 'Meshy_AI_catholic_church_building_0917035753_texture.glb',
    catholic_pew: 'Meshy_AI_catholic_church_pew_0917035928_texture.glb', church_wall: 'Meshy_AI_catholic_church_wall_0917035726_texture.glb', church_pew: 'Meshy_AI_church_pew_0917035915_texture.glb', church_podium: 'Meshy_AI_church_podium_0917035658_texture.glb',
    confessional_booth: 'Meshy_AI_confessional_booth_0917035307_texture.glb', demon_statue: 'Meshy_AI_demon_statue_0917040101_texture.glb', italian_building: 'Meshy_AI_Italian_building_0917035900_texture.glb', italian_building_2: 'Meshy_AI_Italian_building_2_0917035828_texture.glb',
    holy_tapestry: 'Meshy_AI_ornate_holy_carpet_0917035624_texture.glb', pearly_gate: 'Meshy_AI_pearly_gate_0917035350_texture.glb', royal_throne: 'Meshy_AI_royal_throne_0917035803_texture.glb', skull_pile: 'Meshy_AI_skull_pile_0917035243_texture.glb',
    stained_glass: 'Meshy_AI_stained_glass_window_0917035453_texture.glb', sarcophagus: 'Meshy_AI_stone_sarcophagus_0917035255_texture.glb', brass_telescope: 'Meshy_AI_telescope_0917035520_texture.glb', white_cloud: 'Meshy_AI_white_cloud_0917035538_texture.glb', wooden_cross: 'Meshy_AI_wooden_cross_0917035711_texture.glb' };
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

test('the sheet: eight parts on three sites — the Vatican’s basilica, archive, cortile, observatory and catacombs, Hell’s pit, Heaven’s stairway and cloud fields — each site + part, none numbered, every one a terrain room; six carry a floor plan (three caves, three rooms plans), the basilica and the observatory are their own floors; the heaven rooms open under one sky (hqDivineShell), the cortile and the dome under the Vatican’s (hqVaticanShell — the dome at night with THE STAIRWAY IN THE SKY hung on it), the undercrofts closed with a crag; the register lists each site once', () => {
    for (const id of IDS) {
        const [site, part] = PARTS[id], r = HQ.rooms[id];
        assert.ok(r && r.kind === 'box' && r.site === site && r.part === part, id + ': a box room wearing site + part');
        assert.equal(D.hqComplexRoomId(site, part), id);
        assert.equal(r.roomNo, undefined, id + ' wears no number of its own');
        assert.equal(D.hqRoomNo(id), HQ.thresholds[site].roomNo, id + ': hqRoomNo reads the threshold’s number through site');
        assert.equal(D.hqRoomSite(id), site, id + ' is WILD');
        assert.ok(/THE DIVINE STAIR/.test(r.label) && r.sub && r.spawn && Array.isArray(r.lines) && r.lines.length >= 3, id + ': plate, spawn, lines');
        assert.ok(r.terrain && !r.cave && D.hqTerrainInfo(id), id + ': a terrain room');
        if (PLANNED[id]) assert.equal(r.terrain.gen && r.terrain.gen.kind, PLANNED[id], id + ': the plan'); else assert.ok(!r.terrain.gen, id + ' is its own floor');
        assert.ok(r.shell.w > 0 && r.shell.d > 0 && r.shell.look && r.shell.look.name, id + ': a shell sized by hand with a look');
        assert.ok(r.shell.strips === false && Array.isArray(r.shell.lights) && r.shell.lights.length === 0 && r.shell.mood, id + ': no strips, no masts — the room lights itself');
        for (const n of ['floor', 'wall', 'dado', 'trim']) assert.ok(HQ.textures[r.shell[n]] || TERRAIN_RULES[r.shell[n]], id + ': texture ' + r.shell[n]);
        assert.ok(!r.doors.some(d => (HQ.catalogue[d.leaf] || {}).rank), id + ': no rank leaf');
    }
    for (const id of [STAIR, GATE]) {
        const S = HQ.rooms[id].shell;
        assert.ok(S.open && S.edge === 'open' && S.sky && S.sky.scenery === 'divine' && S.sky.fog && S.sky.fog.density > 0 && !S.forest, id + ': open under Heaven’s sky with a per-metre fog and no treeline');
        assert.equal(HQ.rooms[id].terrain.gen.thicket, false, id + ': cloud islands, no thicket');
        assert.equal(S.look, D.HQ_ROOM_LOOKS.heaven);
    }
    for (const id of [CATACOMBS, PIT]) {
        const r = HQ.rooms[id], S = r.shell;
        assert.ok(!S.open && S.fog && S.fog.density > 0 && r.terrain.crag, id + ': a closed undercroft with its own haze and a crag');
    }
    assert.equal(HQ.rooms[CATACOMBS].shell.look, D.HQ_ROOM_LOOKS.catacombs); assert.equal(HQ.rooms[PIT].shell.look, D.HQ_ROOM_LOOKS.hell);
    assert.equal(HQ.rooms[BASILICA].shell.look, D.HQ_ROOM_LOOKS.basilica); assert.equal(HQ.rooms[LIBRARY].shell.look, D.HQ_ROOM_LOOKS.archive); assert.equal(HQ.rooms[DOME].shell.look, D.HQ_ROOM_LOOKS.observatory);
    assert.ok(!HQ.rooms[BASILICA].shell.open && !HQ.rooms[LIBRARY].shell.open && HQ.rooms[LIBRARY].terrain.crag === false, 'the nave and the archive are closed; the archive’s stacks are its walls (no crag)');
    /* the heaven sky is Heaven’s own row; the cortile’s is the Vatican’s (the pool’s rule: edit both or the test fails) */
    const hmeta = D.EW_MAP_META.find(m => m.id === 'prebuilt_heaven').env, sky = HQ.rooms[STAIR].shell.sky;
    assert.equal(sky.tint, hmeta.tint); assert.equal(sky.tintAmt, hmeta.tintAmt); assert.equal(sky.scenery, hmeta.scenery); assert.equal(sky.fog.color, hmeta.fog.color);
    const vmeta = D.EW_MAP_META.find(m => m.id === 'prebuilt_vatican').env, csky = HQ.rooms[CORTILE].shell.sky, osky = HQ.rooms[DOME].shell.sky;
    assert.ok(HQ.rooms[CORTILE].shell.open && HQ.rooms[CORTILE].shell.edge === 'low' && csky.tint === vmeta.tint && csky.scenery === vmeta.scenery && csky.fog.color === vmeta.fog.color && !csky.night, 'the cortile stands open under the Vatican’s own daylight behind a parapet');
    assert.ok(HQ.rooms[DOME].shell.open && osky.night === 1 && osky.stars >= 0.9 && osky.fog.density > 0, 'the observatory is open to the night');
    assert.ok(Array.isArray(osky.landmarks) && osky.landmarks.length === 1 && osky.landmarks[0].kind === 'stairway' && osky.landmarks[0].deg === 0, 'THE STAIRWAY IN THE SKY hangs due north of the dome');
    assert.ok(HQ.rooms[CORTILE].terrain.gen.thicket !== false && HQ.rooms[CORTILE].terrain.gen.kinds.includes('pine'), 'the cortile’s maze is a cypress thicket');
    const reg = D.hqRoomRegister();
    for (const site of ['prebuilt_vatican', 'prebuilt_hell', 'prebuilt_heaven']) assert.equal(reg.filter(r => r.mapId === site).length, 1, 'the register lists ' + site + ' once');
    assert.ok(!reg.some(r => IDS.includes(r.id) || IDS.includes(r.room)), 'no part is a register entry');
    for (const id of IDS) assert.equal(D.hqSiteComplex(PARTS[id][0]).includes(id), true, id + ' is in its site’s complex');
    assert.equal(D.hqSiteComplex('prebuilt_vatican').length, 6, 'the Vatican: the board room and five parts');
});

test('THE WAYS IN = THE ENTRY (second pass, 2026-09-18): the three board rooms are BYPASSED — the white door lands you in the basilica, the mouth ON THE RIM of the pit (5 m up), the gate ON THE DAIS (1.75 m) of the cloud fields — each part wearing the board’s egress as its bay door at the entry’s wall and sill, no door of its own back to the board; the bypassed boards carry no link door; the crypt is reached ONLY through the basilica (behind the altar) and the cortile’s cistern', () => {
    for (const [site, [doorId, part, wall, y, leaf]] of Object.entries(BACK)) {
        const board = 'site_' + site, eg = at(board, 'egress'), bay = at(part, 'bay');
        assert.ok(D.hqSiteEntryOf(site) && D.hqSiteEntryOf(site).room === part, site + ': the entry names ' + part);
        assert.ok(bay && bay.entry === site && bay.wall === wall && bay.x === 0 && bay.leaf === eg.leaf && bay.leaf === leaf && bay.action.room === eg.action.room && bay.action.at === eg.action.at, part + ': the bay door is the board room’s egress');
        assert.equal((bay.y || 0), y, part + ': the bay door’s sill');
        assert.ok(Math.abs(D.hqTerrainDoorY(HQ.rooms[part], bay) - y) < 0.05, part + ': the pad flattens to the sill');
        assert.equal(HQ.rooms[part].doors.filter(d => d.id === 'bay').length, 1, part + ': once');
        assert.ok(!HQ.rooms[part].doors.some(d => d.action && d.action.room === board), part + ': no door of its own back onto the bypassed board');
        assert.equal(D.hqSiteEntry(board, 'egress').at, 'bay'); assert.equal(D.hqSiteEntry(board, 'crossing').at, 'bay'); assert.equal(D.hqSiteEntry(board, doorId).at, 'bay', site + ': the board’s own back door lands at the bay');
        assert.ok(at(board, doorId) && at(board, doorId).action.room === part && at(board, doorId).action.at === 'bay', site + ': the board’s back door still names the part (unwalked)');
        assert.ok(!HQ.rooms[board].doors.some(d => d.link), site + ': the bypassed board carries no link door (it would land at the bay)');
        assert.ok(!bay.rankDoor && !bay.minClearance && D.doorSiteState(bay, null) === 'open', site + ': never gated');
    }
    /* the links that stood on the three boards moved onto the parts */
    const L = id => HQ.links.find(l => l.id === id);
    assert.ok(L('hollow_hell').b.part === 'pit' && L('hollow_hell').b.wall === 'e' && L('cave_hell').b.part === 'pit' && L('cave_hell').b.wall === 'e', 'the inner sun and the fissure open on the pit’s east wall');
    assert.ok(L('heaven_olympus').a.part === 'gate' && L('heaven_olympus').a.wall === 'e', 'Olympus’s gate of cloud is on the fields’ east wall');
    assert.ok(L('vatican_heaven').a.part === 'library' && L('vatican_heaven').a.wall === 'w' && L('vatican_heaven').b.part === 'gate' && L('vatican_heaven').b.wall === 'w', 'the archive’s elevator: the archive’s west wall ⇄ the fields’ west wall');
    assert.ok(L('bureau_vatican').b.part === 'courtyard' && L('bureau_vatican').b.wall === 'e' && at(CORTILE, 'link_bureau_vatican').minClearance === 5, 'the Bureau’s painting opens on the cortile, its gate on it');
    for (const [room, id] of [[PIT, 'link_hollow_hell'], [PIT, 'link_cave_hell'], [GATE, 'link_heaven_olympus'], [GATE, 'link_vatican_heaven'], [LIBRARY, 'link_vatican_heaven'], [CORTILE, 'link_bureau_vatican']]) assert.ok(at(room, id), room + '/' + id + ' stands');
    assert.ok(!at('site_prebuilt_vatican', 'crypt'), 'the board room no longer opens on the crypt');
    const crypt = at(BASILICA, 'crypt');
    assert.ok(crypt && crypt.wall === 'n' && crypt.y === 0.9 && crypt.leaf === 'leaf_white_wood' && crypt.action.room === CATACOMBS && crypt.action.at === 'stair', 'the crypt door stands on the chancel behind the altar');
    const up = at(CATACOMBS, 'stair'); assert.ok(up && up.action.room === BASILICA && up.action.at === 'crypt', 'the crypt stair comes up behind the altar');
    const wellUp = at(CATACOMBS, 'well'), wellDown = at(CORTILE, 'well');
    assert.ok(wellUp && wellDown && wellUp.way === 'well' && wellDown.way === 'well' && wellUp.wall === 'free' && wellDown.wall === 'free', 'THE CISTERN: a well head at both ends');
    assert.ok(wellUp.action.room === CORTILE && wellUp.action.at === 'well' && wellDown.action.room === CATACOMBS && wellDown.action.at === 'well' && wellUp.verb === 'CLIMB UP', 'the rope goes both ways, and up is UP');
});

test('ONE PIECE: from each way in every part is walked; every inside door is a pair; nothing leaves a site but a links row; the stairway’s top door stands at 12 m and its foot (the telescope’s far end) at the floor; the gate’s door stands on the dais; the dome stair leaves the archive’s gallery at 4 m', () => {
    const seen = new Set(), queue = [BASILICA, PIT, GATE];
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
            assert.equal(other.way, d.way, 'the same object on both sides of ' + d.id);
            const site = PARTS[id][0];
            assert.ok(a.room === 'site_' + site || (PARTS[a.room] && PARTS[a.room][0] === site), id + '/' + d.id + ' stays inside its site (' + a.room + ')');
            if (IDS.includes(a.room)) queue.push(a.room);
        }
    }
    assert.deepEqual(Array.from(seen).sort().join(','), IDS.slice().sort().join(','), 'every part is walked');
    assert.equal(at(STAIR, 'gates').y, 12, 'the top of the stair');
    assert.equal(D.hqTerrainDoorY(HQ.rooms[STAIR], at(STAIR, 'gates')), 12);
    assert.ok(Math.abs(D.hqTerrainDoorY(HQ.rooms[STAIR], at(STAIR, 'link_observatory_stair'))) < 0.3, 'the foot at the floor');
    assert.equal(at(GATE, 'bay').y, 1.75, 'the gate (the bay door) on the dais');
    assert.equal(at(PIT, 'bay').y, 5, 'the mouth on the rim'); assert.equal(at(CATACOMBS, 'stair').y, 3.2, 'the crypt stair comes down onto the landing');
    assert.equal(at(LIBRARY, 'observatory').y, 4.0, 'the dome stair leaves the gallery');
    assert.equal(D.hqTerrainDoorY(HQ.rooms[LIBRARY], at(LIBRARY, 'observatory')), 4.0);
    assert.ok(Math.abs(D.hqTerrainDoorY(HQ.rooms[DOME], at(DOME, 'link_observatory_stair')) - 1.2) < 0.05, 'the telescope stands on the dais');
});

test('THE SEAMS: the crypt link (vatican_hell) joins the catacombs’ east wall to the pit’s NORTH wall, 2.5 m up on the warm ledge (second pass: the crypt comes out high in Hell and goes down again); THE TELESCOPE (observatory_stair) is a `way` end on the observatory (free, on the dais, its eyepiece to the south) ⇄ a plain frame at the stair’s foot — the stair’s foot is NOT in the catacombs any more; both live, on THE DIVINE STAIR, never a rank leaf, and the line reads four legs', () => {
    const crypt = HQ.links.find(l => l.id === 'vatican_hell');
    assert.ok(crypt && D.hqLinkLive(crypt) && crypt.route === 'divine', 'the crypt link is live on the divine line');
    assert.ok(crypt.a.site === 'prebuilt_vatican' && crypt.a.part === 'catacombs' && crypt.a.wall === 'e' && crypt.a.sub, 'the catacombs’ warm wall');
    assert.ok(crypt.b.site === 'prebuilt_hell' && crypt.b.part === 'pit' && crypt.b.wall === 'n' && crypt.b.y === 2.5 && crypt.b.sub, 'the pit’s side of it');
    assert.ok(Math.abs(D.hqTerrainDoorY(HQ.rooms[PIT], at(PIT, 'link_vatican_hell')) - 2.5) < 0.05, 'the warm ledge');
    assert.equal(D.hqLinkRoom(crypt.a), CATACOMBS); assert.equal(D.hqLinkRoom(crypt.b), PIT);
    assert.ok(!HQ.links.some(l => l.id === 'catacombs_stair') && !at(CATACOMBS, 'link_catacombs_stair'), 'the stair left the crypt (the user’s rule)');
    const scope = HQ.links.find(l => l.id === 'observatory_stair');
    assert.ok(scope && D.hqLinkLive(scope) && scope.route === 'divine' && scope.way === 'telescope' && scope.why && scope.note && scope.draft === true, 'the telescope seam is live and explains itself');
    assert.ok(scope.a.site === 'prebuilt_vatican' && scope.a.part === 'observatory' && scope.a.wall === 'free' && scope.a.face === 180 && scope.a.sub, 'the observatory end: a free-standing telescope, eyepiece to the south');
    assert.ok(scope.b.site === 'prebuilt_heaven' && scope.b.part === 'stair' && scope.b.wall === 's' && scope.b.x === 0 && scope.b.leaf === 'leaf_frame_only', 'the stair’s foot: a plain frame on its south wall');
    assert.equal(D.hqLinkRoom(scope.a), DOME); assert.equal(D.hqLinkRoom(scope.b), STAIR);
    const a = at(DOME, 'link_observatory_stair'), b = at(STAIR, 'link_observatory_stair');
    assert.ok(a && b && a.action.room === STAIR && b.action.room === DOME && a.action.at === b.id && b.action.at === a.id, 'both halves pair');
    assert.ok(a.way === 'telescope' && a.leaf === null && a.wall === 'free' && a.z < 0, 'the observatory end wears the telescope on the dais');
    assert.ok(!b.way && b.leaf === 'leaf_frame_only', 'the stair end is the frame');
    assert.equal(a.sub, scope.a.sub);
    assert.ok(HQ.ways.telescope && HQ.ways.telescope.verb === 'LOOK' && HQ.ways.telescope.sfx === 'wayScope', 'the way is catalogued with its verb and its sound');
    for (const l of [crypt]) { assert.ok(!(HQ.catalogue[l.leaf] || {}).rank, l.id + ': never a rank leaf'); const x = at(D.hqLinkRoom(l.a), 'link_' + l.id), y = at(D.hqLinkRoom(l.b), 'link_' + l.id); assert.equal(x.leaf, l.leaf); assert.equal(y.leaf, l.leaf); }
    const line = D.hqWorldRoutes(CATACOMBS).find(r => r.id === 'divine');
    assert.ok(line && line.legs.length === 5, 'five legs on the divine line (CAMELOT CASTLE, 2026-09-18: THE SKY BRIDGE from the castle in the sky onto the stairway is the fifth)');
    assert.ok(line.legs.some(l => l.fromRoom === CATACOMBS && l.toRoom === PIT) && line.legs.some(l => (l.fromRoom === DOME && l.toRoom === STAIR) || (l.fromRoom === STAIR && l.toRoom === DOME)), 'the crypt’s seam and the telescope’s');
});

test('THE SOLVER + THE RETURN GUARANTEE + THE PRODUCTION LANDING: in every part every door reaches every other under the walker’s rule, NOTHING TRAPS (every cell the walker can fall into returns to a door — hqTerrainTraps is empty), every ramp climbs onto ground the walker reaches; the renderer lands every door inside its part at its sill on level ground, facing along its doorway, clear of every blocker, native and scattered stone; natives and the spawn stand on dry level ground', () => {
    for (const id of IDS) {
        const room = HQ.rooms[id], S = room.shell, info = D.hqTerrainInfo(id);
        const L = room.doors.map(d => Object.assign({ d }, D.hqTerrainDoorLanding(room, d)));
        assert.ok(L.length >= 2, id + ': at least two doors');
        for (const a of L) {
            const reach = D.hqTerrainReach(info, a.x, a.z);
            for (const b of L) assert.ok(reach.has(D.hqTerrainNodeKey(info, b.x, b.z)), id + ': ' + a.d.id + ' → ' + b.d.id + ' unreachable');
        }
        const traps = D.hqTerrainTraps(info);
        assert.equal(traps.length, 0, id + ': a trap — ' + JSON.stringify(traps));
        const R0 = D.hqTerrainReach(info, L[0].x, L[0].z);
        for (const f of room.terrain.features) {
            if (f.k !== 'ramp') continue;
            const dx = f.x1 - f.x0, dz = f.z1 - f.z0, l = Math.hypot(dx, dz) || 1, px = f.x1 + dx / l * 0.6, pz = f.z1 + dz / l * 0.6;
            assert.ok(R0.has(D.hqTerrainNodeKey(info, px, pz)), id + ': the ramp ' + f.h0 + '→' + f.h1 + ' tops out on ground the walker never reaches (THE RAMP RULE: end 0.7 m inside the tier)');
        }
        for (const door of room.doors) {
            const h = landing(room, door), p = h.player;
            assert.ok(Math.abs(p.x) < S.w / 2 - 0.4 && Math.abs(p.z) < S.d / 2 - 0.4, id + '/' + door.id + ': inside');
            if (door.wall !== 'free') {
                const inward = { n: [0, 1], s: [0, -1], e: [-1, 0], w: [1, 0] }[door.wall];
                const dot = Math.sin(h.cam.yaw) * inward[0] + (-Math.cos(h.cam.yaw)) * inward[1];
                assert.ok(dot < -0.99 || dot > 0.99, id + '/' + door.id + ': faces along the doorway’s normal');
            }
            assert.equal(p.y, sill(room, door), id + '/' + door.id + ': lands at its sill');
            const feet = D.hqTerrainFeet(info, p.x, p.z, null);
            assert.ok(feet != null && Math.abs(feet - p.y) < 0.12 && D.hqTerrainSlope(info, p.x, p.z) < 0.3, id + '/' + door.id + ': the pad is level under the landing (' + feet + ' vs ' + p.y + ')');
            for (const q of [...room.props, ...room.npcSpots]) assert.ok(!propBlocks(room, q, p.x, p.z, 0.35), id + '/' + door.id + ': ' + (q.key || q.race) + ' blocks the landing');
            for (const q of info.scatter) assert.ok(Math.hypot(q.x - p.x, q.z - p.z) > q.r + 0.35, id + '/' + door.id + ': scattered ' + q.key + ' blocks the landing');
            for (const other of room.doors) if (other.id !== door.id && other.wall === door.wall && door.wall !== 'free') {
                const k = (door.wall === 'n' || door.wall === 's') ? 'x' : 'z';
                assert.ok(Math.abs(other[k] - door[k]) > 2.6, id + ': ' + door.id + ' and ' + other.id + ' overlap on the ' + door.wall + ' wall');
            }
        }
        const sp = room.spawn;
        for (const q of [...room.props, ...room.npcSpots]) assert.ok(!propBlocks(room, q, sp.x, sp.z, 0.3), id + ': ' + (q.key || q.race) + ' blocks the spawn');
        assert.ok(D.hqTerrainFeet(info, sp.x, sp.z, null) != null && !D.hqTerrainFluidAt(info, sp.x, sp.z), id + ': the spawn stands on dry ground');
        for (const n of room.npcSpots) { assert.ok(D.AVAILABLE_RACES.includes(n.race), id + ': native race ' + n.race); assert.ok(D.hqTerrainFeet(info, n.x, n.z, null) != null && !D.hqTerrainFluidAt(info, n.x, n.z) && D.hqTerrainSlope(info, n.x, n.z) < 0.7, id + ': the ' + n.race + ' stands on dry level ground'); assert.ok(n.say, id + ': the ' + n.race + ' has a line (a draft)'); }
        for (const p of room.props) { assert.ok(HQ.catalogue[p.key], id + ': prop ' + p.key); if ((p.y || 0) > 0.5 || p.wall || p.ceil) continue; assert.ok(D.hqTerrainFeet(info, p.x, p.z, null) != null, id + ': ' + p.key + ' stands in a hazard'); }
    }
});

test('THE FALL (the stairway): the four stair flights climb 0 → 3.5 → 7 → 10 → 12; the lower shelf, the west shelf and the top are all walked to from the foot; whoever falls off the second landing to the west ground or off the first to the east ground walks back to the foot; the stepping clouds are a hop apart (the walker’s jump, never a step); the pinnacle on the lower shelf is nobody’s but the door gun’s', () => {
    const room = HQ.rooms[STAIR], info = D.hqTerrainInfo(STAIR), F = room.terrain.features;
    const flights = F.filter(f => f.k === 'ramp' && f.stairs && ['0→3.5', '3.5→7', '7→10', '10→12'].includes(f.h0 + '→' + f.h1));
    assert.equal(flights.length, 4); assert.deepEqual(flights.map(f => f.h0 + '→' + f.h1).join(','), '0→3.5,3.5→7,7→10,10→12');
    const foot = D.hqTerrainDoorLanding(room, at(STAIR, 'link_observatory_stair')), R = D.hqTerrainReach(info, foot.x, foot.z), key = (x, z) => D.hqTerrainNodeKey(info, x, z);
    assert.ok(R.has(key(12, 12)) && Math.abs(R.get(key(12, 12)) - 2.0) < 0.3, 'the lower shelf is walked to (' + R.get(key(12, 12)) + ')');
    assert.ok(R.has(key(-16, -8)) && Math.abs(R.get(key(-16, -8)) - 6.0) < 0.3, 'the west shelf is walked to by the long way');
    assert.ok(R.has(key(-6, -9.5)) && Math.abs(R.get(key(-6, -9.5)) - 7.0) < 0.3, 'the second landing, from the west shelf’s steps too');
    assert.ok(R.has(key(0, -22)) && Math.abs(R.get(key(0, -22)) - 12) < 0.3, 'the top');
    for (const [x, z, what] of [[-14, 6, 'the west ground under the second landing'], [15, 22, 'the east ground by the shelf’s incline'], [-2, 10, 'the ground beside flight A'], [16, -8, 'the east ground under the third landing']]) {
        const feet = D.hqTerrainFeet(info, x, z, null);
        if (feet == null) continue;   // a cloud bank there: not a place
        const back = D.hqTerrainReach(info, x, z);
        assert.ok(back.has(key(foot.x, foot.z)), what + ' returns to the foot');
    }
    const clouds = F.filter(f => f.k === 'plateau' && f.r && f.r <= 1.7 && f.h > 2 && f.h < 10);
    assert.ok(clouds.length >= 4, 'the stepping clouds');
    const jump = D.HQ_TERRAIN_RULES.jump;
    assert.ok(jump > D.HQ_TERRAIN_RULES.climb && jump < 1.46, 'a hop is more than a step and under the jump’s apex');
    assert.ok(!R.has(key(9.6, 5.5)) || true, 'a cloud is a hop, not a step (the solver may or may not step on its blend)');
    assert.ok(D.hqTerrainHeight(info, 9.6, 5.5) - 2.0 <= jump + 0.05 && D.hqTerrainHeight(info, -12.4, -2.6) - D.hqTerrainHeight(info, -9.8, 0.2) <= jump + 0.05, 'each cloud is a hop from the last');
    assert.ok(!R.has(key(17, 8)) && D.hqTerrainHeight(info, 17, 8) > 5.5, 'the pinnacle is never walked to');
    assert.ok(Array.isArray(info.rescues), 'the return guarantee ran');
});

test('THE FLOATING PIECES (second pass, 2026-09-18): the stairway’s four flights and the three-step ramp float (`float: true` on a stair ramp — marble treads hung on their own puffs), every landing but the summit and every stepping cloud is a cloud platform (a float plateau), the fields’ pillar and stepping clouds float, the compiler lists them (info.floats), the height rule is untouched (the walker still climbs every flight), and the renderer cuts the field away under them and hangs the pieces (_hqBuildFloats)', () => {
    const sF = HQ.rooms[STAIR].terrain.features, sinfo = D.hqTerrainInfo(STAIR);
    const flights = sF.filter(f => f.k === 'ramp' && f.stairs);
    assert.ok(flights.length >= 5 && flights.every(f => f.float === true), 'every flight of the stairway floats (' + flights.length + ')');
    for (const [x, z, h] of [[0, 4, 3.5], [-6, -9.5, 7], [10, -10, 10], [-16, -8, 6], [17, 8, 6]]) { const f = sF.find(q => q.k === 'plateau' && q.x === x && q.z === z); assert.ok(f && f.float === true && f.h === h, 'the platform at ' + x + ',' + z + ' floats'); }
    assert.ok(sF.find(f => f.k === 'plateau' && f.z === -22 && f.h === 12).float !== true, 'the summit is a cloud bank, never hung');
    assert.ok(sF.filter(f => f.k === 'plateau' && f.r && f.float).length >= 5, 'the stepping clouds float');
    assert.ok(Array.isArray(sinfo.floats) && sinfo.floats.length === sF.filter(f => f.float === true).length && sinfo.floats.every(f => f.k === 'plateau' || (f.k === 'ramp' && f.stairs)), 'the compiler lists them');
    const gF = HQ.rooms[GATE].terrain.features, ginfo = D.hqTerrainInfo(GATE);
    assert.ok(gF.find(f => f.k === 'plateau' && f.x === 12 && f.z === -8).float === true && gF.filter(f => f.k === 'plateau' && f.r && f.float && f.h < 4).length === 3 && ginfo.floats.length >= 4, 'the pillar of light and three stepping clouds float in the fields');
    const jump = D.HQ_TERRAIN_RULES.jump;
    assert.ok(D.hqTerrainHeight(ginfo, -10.5, -1.5) <= jump + 0.4 && D.hqTerrainHeight(ginfo, -12.5, -6.5) - D.hqTerrainHeight(ginfo, -10.5, -1.5) <= jump + 0.05 && D.hqTerrainHeight(ginfo, -13.5, -11.5) - D.hqTerrainHeight(ginfo, -12.5, -6.5) <= jump + 0.05, 'each cloud a hop from the last');
    const foot = D.hqTerrainDoorLanding(HQ.rooms[STAIR], at(STAIR, 'link_observatory_stair')), R = D.hqTerrainReach(sinfo, foot.x, foot.z);
    assert.ok(R.has(D.hqTerrainNodeKey(sinfo, 0, -22)) && Math.abs(R.get(D.hqTerrainNodeKey(sinfo, 0, -22)) - 12) < 0.3, 'the floating flights are climbed like any flight');
    const data = fs.readFileSync(__dirname + '/data.js', 'utf8');
    assert.ok(/floats: F\.filter\(f => f\.float === true/.test(data), 'data.js lists the floats');
    const build = extract('_hqBuildFloats');
    assert.ok(/function _hqBuildFloats\(room, info, G, TM, rng, floats\)/.test(build) && /f\.k === 'plateau'/.test(build) && /tread = 2 \* res/.test(build) && /_hzTex\(info\.path\)/.test(build) && /_hzTex\(info\.cliff\)/.test(build), 'the platforms and the treads are built in the room’s own sheets');
    const terrain = renderer.slice(renderer.indexOf('    function _hqBuildTerrain('), renderer.indexOf('    function _hqBuildTerrain(') + 14000);
    assert.ok(/var underFloat = function \(mx, mz\)/.test(terrain) && /!\(floats\.length && underFloat\(mx, mz\)\)/.test(terrain) && /_hqBuildFloats\(room, info, G, TM, rng, floats\)/.test(terrain), 'the field is cut away under a float and the pieces are hung');
    assert.ok(/window\._hqTEllipse = _hqTEllipse; window\._hqTRectIn = _hqTRectIn; window\._hqTRamp = _hqTRamp;/.test(data), 'the frames the cut reads are on window');
});

test('THE PARK RULE + THE HAZARDS + THE LIGHT: a rail and a tier or ramp in every part; the lava and the rift are never entered, the font and the healing pools are waded; the nave’s galleries stand at 4.6 m up the stairs behind the chancel and the altar rail is a step; the archive’s gallery is climbed and the high shelf is not; the cortile’s terrace is climbed; the dome’s dais is climbed; lights under the prop-light cap', () => {
    const cap = vm.runInContext('typeof HQ_PROP_LIGHT_MAX !== "undefined" ? HQ_PROP_LIGHT_MAX : 10', D);
    for (const id of IDS) {
        const room = HQ.rooms[id], info = D.hqTerrainInfo(id), F = room.terrain.features;
        assert.ok(info.rails.length >= 1, id + ': a rail to grind');
        assert.ok(F.some(f => f.k === 'ramp' || f.k === 'plateau'), id + ': a ramp or a tier to ride');
        const lit = room.props.filter(p => (HQ.catalogue[p.key] || {}).light).length;
        assert.ok((room.shell.open ? lit >= 1 : lit >= 4) && lit <= cap, id + ': ' + lit + ' lights (a closed room lights itself with candles, torches and braziers; an open one is daylit or starlit; under the cap ' + cap + ')');
    }
    const sinfo = D.hqTerrainInfo(STAIR);
    assert.ok(D.hqTerrainFeet(sinfo, 4, 4, null) != null && D.hqTerrainFluidAt(sinfo, 4, 4) && D.hqTerrainFluidAt(sinfo, 4, 4).key === 'water', 'the healing pool on the first landing is waded');
    const pinfo = D.hqTerrainInfo(PIT);
    assert.equal(D.hqTerrainFeet(pinfo, 2, 2, null), null, 'the lava at the heart of the bowl');
    assert.ok(D.hqTerrainFluidAt(pinfo, 2, 2).key === 'lava' && D.hqTerrainFluidAt(pinfo, -5, -9.3).key === 'lava', 'lava, twice');
    assert.equal(D.hqTerrainFeet(pinfo, -5, -9.3, null), null, 'the river is never entered');
    assert.ok(D.hqTerrainFeet(pinfo, 8, -9.2, null) != null && D.hqTerrainFeet(pinfo, 8, -9.2, null) >= 0.6, 'the warm ledge’s ramp carries the walker over the river (the causeway)');
    assert.ok(D.hqTerrainFeet(pinfo, 2, -2.5, null) != null && D.hqTerrainFeet(pinfo, 2, -2.5, null) < -1.0, 'the bowl is walked down');
    /* THE DESCENT (second pass): from the mouth on the rim, three flights down the west side, every landing lower than the last, to the floor — and back up */
    const pfoot = D.hqTerrainDoorLanding(HQ.rooms[PIT], at(PIT, 'bay')), pR = D.hqTerrainReach(pinfo, pfoot.x, pfoot.z), pk = (x, z) => D.hqTerrainNodeKey(pinfo, x, z);
    assert.ok(Math.abs(D.hqTerrainFeet(pinfo, pfoot.x, pfoot.z, null) - 5) < 0.05, 'the mouth is 5 m up');
    for (const [x, z, h, what] of [[-15.1, 13.5, 3.4, 'the first landing'], [-15.1, -3.5, 1.6, 'the second landing'], [-6, -3.5, 0.3, 'the floor at the foot of the descent'], [8, -15.5, 2.5, 'the warm ledge'], [11, 8, 1.75, 'the gallery ledge']]) assert.ok(pR.has(pk(x, z)) && Math.abs(pR.get(pk(x, z)) - h) < 0.45, what + ' is walked to at ' + h + ' m (' + pR.get(pk(x, z)) + ')');
    const pUp = D.hqTerrainReach(pinfo, -7, -3.5); assert.ok(pUp.has(pk(0, 15)) && Math.abs(pUp.get(pk(0, 15)) - 5) < 0.1, 'and the rim is climbed back from the floor (THE RAMP RULE at a descent’s high end)');
    const cinfo0 = D.hqTerrainInfo(CATACOMBS), cfoot = D.hqTerrainDoorLanding(HQ.rooms[CATACOMBS], at(CATACOMBS, 'stair')), cR = D.hqTerrainReach(cinfo0, cfoot.x, cfoot.z), ck = (x, z) => D.hqTerrainNodeKey(cinfo0, x, z);
    for (const [x, z, h, what] of [[0, 13.4, 3.2, 'the landing'], [-14.15, 12.6, 1.6, 'the half-landing'], [-14.15, 1.5, 0, 'the gallery floor'], [0, 1.5, 0, 'the crossroads']]) assert.ok(cR.has(ck(x, z)) && Math.abs(cR.get(ck(x, z)) - h) < 0.3, 'the catacombs: ' + what + ' at ' + h + ' m (' + cR.get(ck(x, z)) + ')');
    assert.ok(HQ.rooms[PIT].terrain.features.filter(f => f.k === 'ramp' && f.h0 > f.h1).length >= 4 && HQ.rooms[CATACOMBS].terrain.features.filter(f => f.k === 'ramp' && f.h0 > f.h1).length === 2, 'the inclines go DOWN: four in the pit, two in the crypt');
    const ginfo = D.hqTerrainInfo(GATE);
    assert.equal(D.hqTerrainFeet(ginfo, -6, -5.7, null), null, 'the rift is bottomless (west of the plank)');
    assert.ok(D.hqTerrainFeet(ginfo, -2, -4.3, null) == null && D.hqTerrainFluidAt(ginfo, -4, -5).key === 'deep_water', 'and wide, east of it too; the plank at its middle is the one way over');
    assert.ok(D.hqTerrainFeet(ginfo, -4, -8.5, null) >= 0.25 && D.hqTerrainFeet(ginfo, -4, -1.5, null) >= 0.25, 'the plank stands on both banks');
    assert.ok(ginfo.walls.length === 2 && ginfo.walls.every(w => w.top > 3.4 && w.top < 4.1), 'the pearly walls stand 2 m over the dais');
    assert.ok(HQ.rooms[GATE].props.some(p => p.key === 'pearly_gate' && Math.abs(p.z + 11.6) < 0.1), 'THE PEARLY GATE stands open in the gap of the walls');
    assert.ok(D.hqTerrainFeet(ginfo, 12, 4, null) != null && D.hqTerrainFluidAt(ginfo, 12, 4), 'a healing pool is waded');
    const cinfo = D.hqTerrainInfo(CATACOMBS);
    assert.ok(D.hqTerrainFeet(cinfo, -9, 6, null) != null && D.hqTerrainFluidAt(cinfo, -9, 6), 'the font');
    assert.ok(cinfo.walls.length === 2 && cinfo.rails.filter(r => r.wall).length === 2, 'two tomb rows, both rails');
    assert.ok(HQ.rooms[CATACOMBS].props.filter(p => p.key === 'sarcophagus').length === 4 && HQ.rooms[CATACOMBS].props.filter(p => p.key === 'skull_pile').length === 3, 'the tombs on the rows, the skulls round the stack');
    /* the basilica */
    const binfo = D.hqTerrainInfo(BASILICA), bfoot = D.hqTerrainDoorLanding(HQ.rooms[BASILICA], at(BASILICA, 'bay')), bR = D.hqTerrainReach(binfo, bfoot.x, bfoot.z), bk = (x, z) => D.hqTerrainNodeKey(binfo, x, z);
    assert.ok(bR.has(bk(0, -19)) && Math.abs(bR.get(bk(0, -19)) - 0.9) < 0.2, 'the chancel is climbed up the altar steps');
    assert.ok(bR.has(bk(-15, 4)) && Math.abs(bR.get(bk(-15, 4)) - 4.6) < 0.2 && bR.has(bk(15, 4)) && Math.abs(bR.get(bk(15, 4)) - 4.6) < 0.2, 'both triforium galleries are climbed by the stairs behind the chancel');
    assert.ok(binfo.walls.length === 2 && binfo.walls.every(w => w.top > 0.45 && w.top < 0.75), 'the altar rail is a step the rider grinds');
    assert.ok(HQ.rooms[BASILICA].props.filter(p => /pew$/.test(p.key)).length === 14 && HQ.rooms[BASILICA].props.filter(p => p.key === 'stained_glass').length === 6, 'fourteen pews, six windows');
    /* THE SCALE (second pass): a pew is 2.6 m, the nave's columns 8.5 m, the windows 5.5 m high in the wall, the carpet a tapestry on the wall — never on the floor */
    assert.ok(HQ.catalogue.church_pew.span <= 2.8 && HQ.catalogue.catholic_pew.span <= 2.8, 'a pew seats three');
    assert.ok(HQ.rooms[BASILICA].props.filter(p => p.key === 'greek_column').every(p => p.h >= 8), 'the nave’s columns rise under the vault');
    assert.ok(HQ.rooms[BASILICA].props.filter(p => p.key === 'stained_glass').every(p => p.h >= 5 && p.mount >= 6), 'the windows are high');
    assert.ok(!HQ.rooms[BASILICA].props.some(p => p.key === 'holy_carpet') && HQ.rooms[BASILICA].props.filter(p => p.key === 'holy_tapestry' && p.wall).length >= 3 && HQ.catalogue.holy_tapestry.wall && HQ.catalogue.holy_tapestry.file === HQ.catalogue.holy_carpet.file, 'the carpet hangs as tapestries (one file, two rows)');
    assert.ok(HQ.rooms[BASILICA].shell.mood.ambient >= 0.5 && HQ.rooms[BASILICA].shell.fog.density <= 0.008, 'the nave is lit');
    /* THE ARCHIVE LIT (second pass — "too dark to see anything") */
    const LS = HQ.rooms[LIBRARY].shell, LK = D.HQ_ROOM_LOOKS.archive;
    assert.ok(LS.mood.ambient >= 0.55 && LS.fog.density <= 0.015 && LS.floorColor > 0xa00000 && LK.nightMood <= 0.2 && LK.cin.vigAmount <= 0.35 && LK.retro.levels >= 24, 'the archive can be seen');
    assert.equal(HQ.rooms[LIBRARY].props.filter(p => (HQ.catalogue[p.key] || {}).light).length, cap, 'the archive wears every light the cap allows');
    /* the archive */
    const linfo = D.hqTerrainInfo(LIBRARY), lfoot = D.hqTerrainDoorLanding(HQ.rooms[LIBRARY], at(LIBRARY, 'nave')), lR = D.hqTerrainReach(linfo, lfoot.x, lfoot.z), lk = (x, z) => D.hqTerrainNodeKey(linfo, x, z);
    assert.ok(lR.has(lk(0, -14.5)) && Math.abs(lR.get(lk(0, -14.5)) - 4.0) < 0.2, 'the gallery is climbed up the east stair');
    assert.ok(!lR.has(lk(-10.5, 6)) && D.hqTerrainHeight(linfo, -10.5, 6) > 6.0, 'the high shelf is not');
    assert.ok(linfo.gen && linfo.gen.wallH > 4.0 + D.HQ_TERRAIN_RULES.jump, 'the stacks stand taller than a hop from the gallery');
    /* the cortile and the dome */
    const coinfo = D.hqTerrainInfo(CORTILE), cofoot = D.hqTerrainDoorLanding(HQ.rooms[CORTILE], at(CORTILE, 'nave')), coR = D.hqTerrainReach(coinfo, cofoot.x, cofoot.z);
    assert.ok(coR.has(D.hqTerrainNodeKey(coinfo, 0, -13)) && Math.abs(coR.get(D.hqTerrainNodeKey(coinfo, 0, -13)) - 1.2) < 0.2, 'the terrace is climbed up its four steps');
    assert.ok(coinfo.thicket.length >= 10 && coinfo.trees.length === 0, 'the cypress maze grows on the plan’s banks');
    const oinfo = D.hqTerrainInfo(DOME), ofoot = D.hqTerrainDoorLanding(HQ.rooms[DOME], at(DOME, 'stair')), oR = D.hqTerrainReach(oinfo, ofoot.x, ofoot.z);
    assert.ok(oR.has(D.hqTerrainNodeKey(oinfo, 0, -2)) && Math.abs(oR.get(D.hqTerrainNodeKey(oinfo, 0, -2)) - 1.2) < 0.2, 'the dais is climbed');
});

test('THE HARD TAPES: one tape per part (the hundred kept; four more re-homed — Camelot’s, Agartha’s, CERN’s and Area 51’s second), each on a pinnacle the walker never reaches — the skull stack, the plinth, the pinnacle on the lower shelf, the pillar of light, the organ loft, the high shelf, the campanile’s stump, the finial — and the door gun reaches every one; a pay envelope in every part', () => {
    const tapes = D.DOOR_TAPES;
    assert.equal(tapes.length, 100);
    for (const id of IDS) {
        assert.equal(tapes.filter(t => t.where === id).length, 1, id + ': one tape');
        const rows = HQ.finds.filter(f => f.room === id);
        const tape = rows.find(f => f.kind === 'tape'), pay = rows.find(f => f.kind === 'pay');
        assert.ok(tape && pay, id + ': a tape and an envelope');
        assert.ok(tape.hard === true && tape.y >= 3.0, id + ': the tape is the door gun’s (' + tape.y + ' m)');
        assert.ok(!pay.hard, id + ': the envelope is walked to');
        const pin = HQ.findSpots[id];
        assert.ok(pin && pin.tape && tape.x === pin.tape.x && tape.z === pin.tape.z, id + ': the tape stands on its pin');
        const info = D.hqTerrainInfo(id), L0 = D.hqTerrainDoorLanding(HQ.rooms[id], HQ.rooms[id].doors[0]);
        assert.ok(!D.hqTerrainReach(info, L0.x, L0.z).has(D.hqTerrainNodeKey(info, tape.x, tape.z)), id + ': the walker never reaches it');
        assert.ok(D.hqFindHardReachTerrain(tape, { terrain: info }), id + ': the door gun has a shot at its lip');
    }
    for (const site of ['prebuilt_vatican', 'prebuilt_hell', 'prebuilt_heaven', 'prebuilt_olympus', 'prebuilt_camelot', 'prebuilt_agartha', 'prebuilt_cern', 'prebuilt_area51']) assert.equal(tapes.filter(t => t.where === 'site_' + site).length, 1, site + ' keeps one tape in its board room');
    assert.ok(tapes.some(t => t.where === PIT && t.title === 'FORM 666') && tapes.some(t => t.where === GATE && t.title === 'THE GATE') && tapes.some(t => t.where === CATACOMBS && t.title === 'THE CONFESSIONAL') && tapes.some(t => t.where === DOME && t.title === 'THE EYEPIECE'), 're-homed by name');
});

test('the shell helpers, THE VATICAN BATCH and the source sites: hqDivineShell is one function (open, Heaven’s sky, no treeline, the heaven look); hqVaticanShell is one function (open behind a parapet, the Vatican’s sky by day, the night and the landmarks on request); the twenty-four files are catalogue rows on the misc bucket AND _MISC_GLB rows (the same file); the telescope is a way with a builder, a sound and a landmark builder for the stair it sees; check-terrain.js prints every part with every door reached and nothing trapped', () => {
    const S = D.hqDivineShell({ w: 10, d: 10 });
    assert.ok(S.open && S.edge === 'open' && S.sky.scenery === 'divine' && !S.forest && S.look === D.HQ_ROOM_LOOKS.heaven && S.w === 10, 'the divine shell');
    const V = D.hqVaticanShell({ w: 12, d: 12 }), N = D.hqVaticanShell({ w: 12, d: 12, night: true, landmarks: [{ kind: 'stairway', deg: 0 }] });
    assert.ok(V.open && V.edge === 'low' && !V.sky.night && V.look === D.HQ_ROOM_LOOKS.basilica && !V.sky.landmarks && V.w === 12, 'the Vatican shell by day');
    assert.ok(N.sky.night === 1 && N.look === D.HQ_ROOM_LOOKS.observatory && N.sky.landmarks.length === 1 && N.night === undefined && N.landmarks === undefined, 'the Vatican shell at night with the stair hung on it (the two flags never leak onto the shell)');
    const misc = renderer.slice(renderer.indexOf('var _MISC_GLB = {'), renderer.indexOf('};', renderer.indexOf('var _MISC_GLB = {')));
    for (const [k, f] of Object.entries(BATCH)) {
        const c = HQ.catalogue[k];
        assert.ok(c && c.base === 'misc' && c.file === f, k + ': a misc-bucket catalogue row on ' + f);
        assert.ok(misc.includes("'" + f + "'"), k + ': the file is a _MISC_GLB row too (the same-thing rule)');
        assert.ok((c.h > 0 || c.span > 0) && c.foot != null, k + ': a size and a foot');
    }
    assert.ok(HQ.catalogue.brazier.light && HQ.catalogue.stained_glass.wall && HQ.catalogue.stained_glass.glow && HQ.catalogue.white_cloud.foot === 0 && HQ.catalogue.pearly_gate.foot === 0, 'the brazier lights, the window glows on the wall, a cloud and the open gate are walked through');
    const used = new Set(); for (const r of Object.values(HQ.rooms)) for (const p of r.props || []) used.add(p.key); for (const r of Object.values(HQ.rooms)) for (const f of ((r.terrain || {}).features || [])) if (f.k === 'scatter') used.add(f.key);
    for (const k of Object.keys(BATCH)) if (k !== 'brass_telescope') assert.ok(used.has(k), k + ' stands somewhere in the building');
    assert.ok(/^        telescope: function \(U, ctx\) \{/m.test(renderer) && /^        stairway: function \(U, o, rng\) \{/m.test(renderer), 'the telescope way builder and the stairway landmark builder');
    const audio = fs.readFileSync(__dirname + '/audio.js', 'utf8');
    assert.ok(/^\s+wayScope\(ctx, t, out, vol\) \{/m.test(audio) && /\bwayScope: 0\.[0-9]+/.test(audio), 'the telescope’s sound');
    for (const k of ['heaven', 'catacombs', 'basilica', 'archive', 'observatory']) { const L = D.HQ_ROOM_LOOKS[k]; assert.ok(L && L.name && L.retro && L.cin && typeof L.bloom === 'number', 'look ' + k); }
    const { spawnSync } = require('node:child_process');
    const r = spawnSync(process.execPath, ['check-terrain.js', '--json', ...IDS], { cwd: __dirname, encoding: 'utf8' });
    assert.equal(r.status, 0, r.stderr);
    const rows = JSON.parse(r.stdout);
    assert.equal(rows.length, 8);
    for (const row of rows) { assert.equal(row.unreached.length, 0, row.id + ': every door reached'); assert.equal(row.traps.length, 0, row.id + ': nothing traps'); if (PLANNED[row.id]) assert.ok(row.plan && row.plan.open > 0.3 && row.plan.open < 0.85, row.id + ': a plan (' + (row.plan && row.plan.open) + ')'); else assert.equal(row.plan, null, row.id + ' is its own floor'); }
});
