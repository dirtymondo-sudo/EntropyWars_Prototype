// hq-divine.test.js — THE DIVINE STAIR (HQ plan 9.3 stage 6 — THE COMPLEX
// CANDIDATES #4, 2026-09-17): HEAVEN · HELL · THE VATICAN joined by THE
// CATACOMBS and THE STAIRWAY, built on THE CAVE / THE WOODS blueprint —
// four terrain rooms with generated floor plans on three sites:
//   the Vatican's CATACOMBS (cellular automata in brick under the crypt
//   stair; the ossuary shelf, the sunken chapel, the skull stack), Hell's
//   PIT (the bowl to the lava, the river and its causeway, the colossus's
//   plinth), Heaven's STAIRWAY (four flights of cloud stairs from the
//   catacombs' door at the floor to the gate at 12 m) and Heaven's CLOUD
//   FIELDS (cloud islands, the rift and its plank, the dais and THE GATE).
// The seams are links rows: the crypt link (vatican_hell) RE-POINTED onto
// the catacombs' warm wall ⇄ the pit's; the stair's foot (catacombs_stair).
// Guards: the sheet, the three back doors on the freed lanes, the complex
// walked from every way in with every inside door a pair, the two links,
// the production landing on every door, THE SOLVER (every door reaches
// every other), THE PARK RULE, the four hard tapes (the door gun's), the
// looks, the shell helper, and the renderer's source sites.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { loadGameData } = require('./load-data');
const D = loadGameData(), HQ = D.DOOR_HQ;
const TERRAIN_RULES = vm.runInContext('TERRAIN_RULES', D);
const CATACOMBS = 'site_prebuilt_vatican_catacombs', PIT = 'site_prebuilt_hell_pit', STAIR = 'site_prebuilt_heaven_stair', GATE = 'site_prebuilt_heaven_gate';
const PARTS = { [CATACOMBS]: ['prebuilt_vatican', 'catacombs'], [PIT]: ['prebuilt_hell', 'pit'], [STAIR]: ['prebuilt_heaven', 'stair'], [GATE]: ['prebuilt_heaven', 'gate'] };
const IDS = Object.keys(PARTS);
const BACK = { prebuilt_vatican: ['crypt', CATACOMBS, 'stair', 'leaf_white_wood'], prebuilt_hell: ['pit', PIT, 'mouth', 'leaf_hell_arch'], prebuilt_heaven: ['gate', GATE, 'heaven', 'leaf_hotel'] };
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

test('the sheet: four parts on three sites (the Vatican’s catacombs, Hell’s pit, Heaven’s stairway and cloud fields), each site + part, none numbered, every one a terrain room with a floor plan; the two heaven rooms open under one sky (hqDivineShell), the two undercrofts closed with a crag; the register lists each site once', () => {
    for (const id of IDS) {
        const [site, part] = PARTS[id], r = HQ.rooms[id];
        assert.ok(r && r.kind === 'box' && r.site === site && r.part === part, id + ': a box room wearing site + part');
        assert.equal(D.hqComplexRoomId(site, part), id);
        assert.equal(r.roomNo, undefined, id + ' wears no number of its own');
        assert.equal(D.hqRoomNo(id), HQ.thresholds[site].roomNo, id + ': hqRoomNo reads the threshold’s number through site');
        assert.equal(D.hqRoomSite(id), site, id + ' is WILD');
        assert.ok(/THE DIVINE STAIR/.test(r.label) && r.sub && r.spawn && Array.isArray(r.lines) && r.lines.length >= 3, id + ': plate, spawn, lines');
        assert.ok(r.terrain && r.terrain.gen && !r.cave && D.hqTerrainInfo(id), id + ': a terrain room with a floor plan');
        assert.ok(r.shell.w > 0 && r.shell.d > 0 && r.shell.look && r.shell.look.name, id + ': a shell sized by hand with a look');
        assert.ok(r.shell.strips === false && Array.isArray(r.shell.lights) && r.shell.lights.length === 0 && r.shell.mood, id + ': no strips, no masts — the room lights itself');
        for (const n of ['floor', 'wall', 'dado', 'trim']) assert.ok(HQ.textures[r.shell[n]] || TERRAIN_RULES[r.shell[n]], id + ': texture ' + r.shell[n]);
        assert.ok(!r.doors.some(d => (HQ.catalogue[d.leaf] || {}).rank), id + ': no rank leaf');
    }
    for (const id of [STAIR, GATE]) {
        const S = HQ.rooms[id].shell;
        assert.ok(S.open && S.edge === 'open' && S.sky && S.sky.scenery === 'divine' && S.sky.fog && S.sky.fog.density > 0 && !S.forest, id + ': open under Heaven’s sky with a per-metre fog and no treeline');
        assert.equal(HQ.rooms[id].terrain.gen.kind, 'rooms'); assert.equal(HQ.rooms[id].terrain.gen.thicket, false, id + ': cloud islands, no thicket');
        assert.equal(S.look, D.HQ_ROOM_LOOKS.heaven);
    }
    for (const id of [CATACOMBS, PIT]) {
        const r = HQ.rooms[id], S = r.shell;
        assert.ok(!S.open && S.fog && S.fog.density > 0 && r.terrain.crag, id + ': a closed undercroft with its own haze and a crag');
        assert.equal(r.terrain.gen.kind, 'cave', id + ': cellular automata');
    }
    assert.equal(HQ.rooms[CATACOMBS].shell.look, D.HQ_ROOM_LOOKS.catacombs); assert.equal(HQ.rooms[PIT].shell.look, D.HQ_ROOM_LOOKS.hell);
    /* the sky is Heaven’s own row (the pool’s rule: edit both or the test fails) */
    const meta = D.EW_MAP_META.find(m => m.id === 'prebuilt_heaven').env, sky = HQ.rooms[STAIR].shell.sky;
    assert.equal(sky.tint, meta.tint); assert.equal(sky.tintAmt, meta.tintAmt); assert.equal(sky.scenery, meta.scenery); assert.equal(sky.fog.color, meta.fog.color);
    const reg = D.hqRoomRegister();
    for (const site of ['prebuilt_vatican', 'prebuilt_hell', 'prebuilt_heaven']) assert.equal(reg.filter(r => r.mapId === site).length, 1, 'the register lists ' + site + ' once');
    assert.ok(!reg.some(r => IDS.includes(r.id) || IDS.includes(r.room)), 'no part is a register entry');
    for (const id of IDS) assert.equal(D.hqSiteComplex(PARTS[id][0]).includes(id), true, id + ' is in its site’s complex');
});

test('THE WAYS IN: three back doors on the freed lanes — the Vatican’s crypt stair (n x −10), Hell’s mouth (n x −10), Heaven’s gate (n x −0.2) — each a pair with the part’s way out, the same leaf both sides, never gated; every board room keeps ≤ 3 link doors on its north wall', () => {
    for (const [site, [doorId, part, backId, leaf]] of Object.entries(BACK)) {
        const board = 'site_' + site, d = at(board, doorId);
        assert.ok(d && d.wall === 'n' && d.leaf === leaf && d.action.room === part && d.action.at === backId, site + ': the back door into ' + part);
        assert.equal(d.x, site === 'prebuilt_heaven' ? -0.2 : -10, site + ': the lane');
        const b = at(part, backId);
        assert.ok(b && b.leaf === leaf && b.action.room === board && b.action.at === doorId, part + ': the way back is the same door');
        assert.ok(!d.rankDoor && !d.minClearance && D.doorSiteState(d, null) === 'open', site + ': never gated');
        const links = HQ.rooms[board].doors.filter(x => x.link);
        assert.ok(links.length <= 3 && links.every(x => x.wall === 'n'), site + ': ≤ 3 link doors, all on the north wall');
        for (const o of HQ.rooms[board].doors) if (o.id !== d.id && o.wall === 'n') assert.ok(Math.abs(o.x - d.x) >= 4.4, site + ': the back door shares a lane with ' + o.id);
    }
});

test('ONE PIECE: from each way in every part is walked; every inside door is a pair; nothing leaves a site but a links row; the stairway’s top door stands at 12 m and its foot at the floor; the gate’s door stands on the dais', () => {
    const seen = new Set(), queue = [CATACOMBS, PIT, GATE];
    while (queue.length) {
        const id = queue.shift(); if (seen.has(id)) continue; seen.add(id);
        for (const d of HQ.rooms[id].doors) {
            const a = d.action || {};
            assert.ok(a.room && HQ.rooms[a.room], id + '/' + d.id + ' leads to a room');
            if (d.link) { assert.ok(HQ.links.some(l => l.id === d.link), id + '/' + d.id + ' is a links row'); const far = at(a.room, a.at); assert.ok(far && far.link === d.link, id + '/' + d.id + ': the far end pairs'); if (IDS.includes(a.room)) queue.push(a.room); continue; }
            const other = at(a.room, a.at);
            assert.ok(other && other.action.room === id && other.action.at === d.id, id + '/' + d.id + ' ⇄ ' + a.room + ' is a pair');
            assert.equal(other.leaf, d.leaf, 'the same opening on both sides of ' + d.id);
            const site = PARTS[id][0];
            assert.ok(a.room === 'site_' + site || (PARTS[a.room] && PARTS[a.room][0] === site), id + '/' + d.id + ' stays inside its site (' + a.room + ')');
            if (IDS.includes(a.room)) queue.push(a.room);
        }
    }
    assert.deepEqual(Array.from(seen).sort().join(','), IDS.slice().sort().join(','), 'every part is walked');
    assert.equal(at(STAIR, 'gates').y, 12, 'the top of the stair');
    assert.equal(D.hqTerrainDoorY(HQ.rooms[STAIR], at(STAIR, 'gates')), 12);
    assert.ok(Math.abs(D.hqTerrainDoorY(HQ.rooms[STAIR], at(STAIR, 'link_catacombs_stair'))) < 0.3, 'the foot at the floor');
    assert.equal(at(GATE, 'heaven').y, 1.75, 'the gate on the dais');
});

test('THE SEAMS: the crypt link (vatican_hell) is RE-POINTED onto the parts — the catacombs’ east wall ⇄ the pit’s west wall, the id kept, both board lanes freed; the stair’s foot (catacombs_stair) joins the catacombs to the stairway; both live, on THE DIVINE STAIR, never a rank leaf, and the line reads four legs', () => {
    const crypt = HQ.links.find(l => l.id === 'vatican_hell');
    assert.ok(crypt && D.hqLinkLive(crypt) && crypt.route === 'divine', 'the crypt link is live on the divine line');
    assert.ok(crypt.a.site === 'prebuilt_vatican' && crypt.a.part === 'catacombs' && crypt.a.wall === 'e' && crypt.a.sub, 'the catacombs’ warm wall');
    assert.ok(crypt.b.site === 'prebuilt_hell' && crypt.b.part === 'pit' && crypt.b.wall === 'w' && crypt.b.sub, 'the pit’s side of it');
    assert.equal(D.hqLinkRoom(crypt.a), CATACOMBS); assert.equal(D.hqLinkRoom(crypt.b), PIT);
    assert.ok(!at('site_prebuilt_vatican', 'link_vatican_hell') && !at('site_prebuilt_hell', 'link_vatican_hell'), 'the board rooms no longer carry it');
    const foot = HQ.links.find(l => l.id === 'catacombs_stair');
    assert.ok(foot && D.hqLinkLive(foot) && foot.route === 'divine' && foot.why && foot.note, 'the stair’s foot is live and explains itself');
    assert.equal(D.hqLinkRoom(foot.a), CATACOMBS); assert.equal(D.hqLinkRoom(foot.b), STAIR);
    for (const l of [crypt, foot]) {
        assert.ok(!(HQ.catalogue[l.leaf] || {}).rank, l.id + ': never a rank leaf');
        const a = at(D.hqLinkRoom(l.a), 'link_' + l.id), b = at(D.hqLinkRoom(l.b), 'link_' + l.id);
        assert.ok(a && b && a.action.room === D.hqLinkRoom(l.b) && b.action.room === D.hqLinkRoom(l.a) && a.action.at === b.id && b.action.at === a.id, l.id + ': both halves pair');
        assert.equal(a.leaf, l.leaf); assert.equal(b.leaf, l.leaf);
    }
    const line = D.hqWorldRoutes(CATACOMBS).find(r => r.id === 'divine');
    assert.ok(line && line.legs.length === 4, 'four legs on the divine line');
    assert.ok(line.legs.some(l => l.fromRoom === CATACOMBS && l.toRoom === PIT) && line.legs.some(l => l.fromRoom === CATACOMBS && l.toRoom === STAIR), 'the crypt’s two seams');
});

test('THE SOLVER + THE PRODUCTION LANDING: in every part every door reaches every other under the walker’s rule; the renderer lands every door inside its part at its sill on level ground, facing along its doorway, clear of every blocker, native and scattered stone; natives and the spawn stand on dry level ground', () => {
    for (const id of IDS) {
        const room = HQ.rooms[id], S = room.shell, info = D.hqTerrainInfo(id);
        const L = room.doors.map(d => Object.assign({ d }, D.hqTerrainDoorLanding(room, d)));
        assert.ok(L.length >= 2, id + ': at least two doors');
        for (const a of L) {
            const reach = D.hqTerrainReach(info, a.x, a.z);
            for (const b of L) assert.ok(reach.has(D.hqTerrainNodeKey(info, b.x, b.z)), id + ': ' + a.d.id + ' → ' + b.d.id + ' unreachable');
        }
        for (const door of room.doors) {
            const h = landing(room, door), p = h.player;
            assert.ok(Math.abs(p.x) < S.w / 2 - 0.4 && Math.abs(p.z) < S.d / 2 - 0.4, id + '/' + door.id + ': inside');
            const inward = { n: [0, 1], s: [0, -1], e: [-1, 0], w: [1, 0] }[door.wall];
            const dot = Math.sin(h.cam.yaw) * inward[0] + (-Math.cos(h.cam.yaw)) * inward[1];
            assert.ok(dot < -0.99 || dot > 0.99, id + '/' + door.id + ': faces along the doorway’s normal');
            assert.equal(p.y, sill(room, door), id + '/' + door.id + ': lands at its sill');
            const feet = D.hqTerrainFeet(info, p.x, p.z, null);
            assert.ok(feet != null && Math.abs(feet - p.y) < 0.12 && D.hqTerrainSlope(info, p.x, p.z) < 0.3, id + '/' + door.id + ': the pad is level under the landing');
            for (const q of [...room.props, ...room.npcSpots]) assert.ok(!propBlocks(room, q, p.x, p.z, 0.35), id + '/' + door.id + ': ' + (q.key || q.race) + ' blocks the landing');
            for (const q of info.scatter) assert.ok(Math.hypot(q.x - p.x, q.z - p.z) > q.r + 0.35, id + '/' + door.id + ': scattered ' + q.key + ' blocks the landing');
            for (const other of room.doors) if (other.id !== door.id && other.wall === door.wall) {
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

test('THE PARK RULE + THE HAZARDS + THE LIGHT: a rail and a tier or ramp in every part (the sarcophagus rows and the basalt wall and the pearly walls are walls the rider rides, the stairway’s four flights are stair ramps); the lava and the rift are never entered, the font and the healing pools are waded; lights under the prop-light cap', () => {
    const cap = vm.runInContext('typeof HQ_PROP_LIGHT_MAX !== "undefined" ? HQ_PROP_LIGHT_MAX : 10', D);
    for (const id of IDS) {
        const room = HQ.rooms[id], info = D.hqTerrainInfo(id), F = room.terrain.features;
        assert.ok(info.rails.length >= 1, id + ': a rail to grind');
        assert.ok(F.some(f => f.k === 'ramp' || f.k === 'plateau'), id + ': a ramp or a tier to ride');
        const lit = room.props.filter(p => (HQ.catalogue[p.key] || {}).light).length;
        assert.ok((room.shell.open ? lit >= 1 : lit >= 4) && lit <= cap, id + ': ' + lit + ' lights (an undercroft lights itself with candles and torches; heaven is daylit, the fountain its one lamp; under the cap ' + cap + ')');
    }
    /* the stairway: four stair flights climbing 0 → 3.5 → 7 → 10 → 12 */
    const flights = HQ.rooms[STAIR].terrain.features.filter(f => f.k === 'ramp');
    assert.equal(flights.length, 4); assert.ok(flights.every(f => f.stairs), 'every flight has treads');
    assert.deepEqual(flights.map(f => f.h0 + '→' + f.h1).join(','), '0→3.5,3.5→7,7→10,10→12');
    const sinfo = D.hqTerrainInfo(STAIR);
    assert.ok(D.hqTerrainFeet(sinfo, 4, 2, null) != null && D.hqTerrainFluidAt(sinfo, 4, 2) && D.hqTerrainFluidAt(sinfo, 4, 2).key === 'water', 'the healing pool on the first landing is waded');
    /* the pit: the lava at the bowl’s heart and the river are never entered; the causeway crosses the river */
    const pinfo = D.hqTerrainInfo(PIT);
    assert.equal(D.hqTerrainFeet(pinfo, 2, -3, null), null, 'the lava at the heart of the bowl');
    assert.ok(D.hqTerrainFluidAt(pinfo, 2, -3).key === 'lava' && D.hqTerrainFluidAt(pinfo, -8, 8).key === 'lava', 'lava, twice');
    assert.equal(D.hqTerrainFeet(pinfo, -8, 8, null), null, 'the river is never entered');
    assert.ok(D.hqTerrainFeet(pinfo, 0, 9.5, null) != null && D.hqTerrainFeet(pinfo, 0, 9.5, null) >= 0.2, 'the causeway carries the walker over the river');
    assert.ok(D.hqTerrainFeet(pinfo, 2, -7.5, null) != null && D.hqTerrainFeet(pinfo, 2, -7.5, null) < -1.0, 'the bowl is walked down');
    /* the fields: the rift is never entered; the plank crosses it; the walls stand on the dais */
    const ginfo = D.hqTerrainInfo(GATE);
    assert.equal(D.hqTerrainFeet(ginfo, -6, -5.7, null), null, 'the rift is bottomless (west of the plank)');
    assert.ok(D.hqTerrainFeet(ginfo, -2, -4.3, null) == null && D.hqTerrainFluidAt(ginfo, -4, -5).key === 'deep_water', 'and wide, east of it too; the plank at its middle is the one way over');
    assert.ok(D.hqTerrainFeet(ginfo, -4, -8.5, null) >= 0.25 && D.hqTerrainFeet(ginfo, -4, -1.5, null) >= 0.25, 'the plank stands on both banks');
    assert.ok(ginfo.walls.length === 2 && ginfo.walls.every(w => w.top > 3.4 && w.top < 4.1), 'the pearly walls stand 2 m over the dais');
    assert.ok(D.hqTerrainFeet(ginfo, 12, 4, null) != null && D.hqTerrainFluidAt(ginfo, 12, 4), 'a healing pool is waded');
    /* the catacombs: the font is waded, the sarcophagus rows are walls the rider grinds */
    const cinfo = D.hqTerrainInfo(CATACOMBS);
    assert.ok(D.hqTerrainFeet(cinfo, -9, 6, null) != null && D.hqTerrainFluidAt(cinfo, -9, 6), 'the font');
    assert.ok(cinfo.walls.length === 2 && cinfo.rails.filter(r => r.wall).length === 2, 'two tomb rows, both rails');
});

test('THE HARD TAPES: one tape per part (the hundred kept; Hell’s FORM 666, Heaven’s THE GATE, the Vatican’s THE CONFESSIONAL and Olympus’s second re-homed), each on a pinnacle the walker never reaches — the skull stack, the plinth, the stairway’s pinnacle, the pillar of light — and the door gun reaches every one; a pay envelope in every part', () => {
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
    for (const site of ['prebuilt_vatican', 'prebuilt_hell', 'prebuilt_heaven', 'prebuilt_olympus']) assert.equal(tapes.filter(t => t.where === 'site_' + site).length, 1, site + ' keeps one tape in its board room');
    assert.ok(tapes.some(t => t.where === PIT && t.title === 'FORM 666') && tapes.some(t => t.where === GATE && t.title === 'THE GATE') && tapes.some(t => t.where === CATACOMBS && t.title === 'THE CONFESSIONAL'), 're-homed by name');
});

test('the shell helper and the source sites: hqDivineShell is one function (open, Heaven’s sky, no treeline, the heaven look); the catalogue’s greek_column is the board’s greekcol file (the same-thing rule); the looks are rows of HQ_ROOM_LOOKS; check-terrain.js prints every part with every door reached', () => {
    const S = D.hqDivineShell({ w: 10, d: 10 });
    assert.ok(S.open && S.edge === 'open' && S.sky.scenery === 'divine' && !S.forest && S.look === D.HQ_ROOM_LOOKS.heaven && S.w === 10, 'the divine shell');
    assert.ok(HQ.catalogue.greek_column && HQ.catalogue.greek_column.base === 'misc' && HQ.catalogue.greek_column.block, 'the column is catalogued');
    assert.ok(renderer.includes("greekcol:  'Meshy_AI_greek_column_0727195651_texture.glb'") && HQ.catalogue.greek_column.file === 'Meshy_AI_greek_column_0727195651_texture.glb', 'the same file as the board’s greekcol monument');
    for (const k of ['heaven', 'catacombs']) { const L = D.HQ_ROOM_LOOKS[k]; assert.ok(L && L.name && L.retro && L.cin && typeof L.bloom === 'number', 'look ' + k); }
    const { spawnSync } = require('node:child_process');
    const r = spawnSync(process.execPath, ['check-terrain.js', '--json', ...IDS], { cwd: __dirname, encoding: 'utf8' });
    assert.equal(r.status, 0, r.stderr);
    const rows = JSON.parse(r.stdout);
    assert.equal(rows.length, 4);
    for (const row of rows) { assert.equal(row.unreached.length, 0, row.id + ': every door reached'); assert.ok(row.plan && row.plan.open > 0.3 && row.plan.open < 0.85, row.id + ': a plan (' + (row.plan && row.plan.open) + ')'); }
});
