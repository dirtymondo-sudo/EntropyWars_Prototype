// hq-cave.test.js — THE WELLS AND THE CAVE (HQ plan 9.3, 2026-09-15 rev 10)
// + THE DUNGEON (stage 2, rev 11: every chamber a CAVE GRID — rock, floor at
// levels, ramps, bridges, water, lava — solved with the walker's own step
// rule, every door at its lane's level, the wells on their tiers).
//
// Every well in the world drops into ONE cave: the SECOND complex
// (site_prebuilt_hollow_earth_*, Hollow Earth's, wild by construction) —
// THE WELL ROOM with one head per well, THE GALLERY, four EXIT chambers
// (Hell · D.U.M.B. · Agartha · Hollow Earth's own board room) and THE
// OUBLIETTE, whose back wall is Room 24601's (the eighth secret door).
// Guards: the sheet (site + part, no number, the register lists 180 once),
// the wells (one head each, no two heads within 1.6 m, an end's own plate
// line and verb), the exits (a live pair each, a lane on the far site's
// north wall), the complex connected from the mouth, THE UNDERCROFT route,
// the production landing on every door and head, THE PARK RULE, and the
// facility's one seam into it (the dungeon's fourth cell).
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { loadGameData } = require('./load-data');
const D = loadGameData(), HQ = D.DOOR_HQ;
const TERRAIN_RULES = vm.runInContext('TERRAIN_RULES', D);
const SITE = 'prebuilt_hollow_earth';
const BOARD = 'site_' + SITE;
const PARTS = ['shaft', 'gallery', 'vent', 'blast', 'adit', 'mouth', 'oubliette'];
const PART_IDS = PARTS.map(p => BOARD + '_' + p);
const SHAFT = BOARD + '_shaft';
const renderer = fs.readFileSync(__dirname + '/three-renderer.js', 'utf8');
const at = (room, id) => (HQ.rooms[room].doors || []).find(d => d.id === id);
const WELLS = HQ.links.filter(l => l.way === 'well');
const EXITS = HQ.links.filter(l => l.route === 'undercroft' && !l.way);

function extract(name) {
    const start = renderer.indexOf('    function ' + name + '(');
    const end = renderer.indexOf('\n    }', start);
    assert.ok(start >= 0 && end > start, name);
    return renderer.slice(start, end + 6);
}
/* the production landing: _hqBoxWall + _hqGoTo on a stub scene (the hq-world.test.js harness) */
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
/* a door's SILL in a cave room: the production read (data.js hqCaveDoorY — the renderer's _hqDoorFloorY) */
function sill(room, door) { return room.cave ? D.hqCaveDoorY(room, door) : 0; }
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

test('the sheet: the cave is Hollow Earth’s complex — seven parts, each site + part, none numbered, the register still lists 180 once', () => {
    assert.deepStrictEqual(D.hqSiteComplex(SITE).join(','), [BOARD].concat(PART_IDS).join(','), 'the board room, then the parts in sheet order');
    for (const p of PARTS) {
        const id = D.hqComplexRoomId(SITE, p), r = HQ.rooms[id];
        assert.strictEqual(id, BOARD + '_' + p);
        assert.ok(r && r.kind === 'box' && r.site === SITE && r.part === p, id + ': a box room wearing site + part');
        assert.strictEqual(r.roomNo, undefined, id + ' wears no number of its own (the number is the site’s)');
        assert.strictEqual(r.fx, undefined, id + ' is not a board room');
        assert.strictEqual(D.hqRoomNo(id), '180', id + ': hqRoomNo reads the threshold’s 180 through site');
        assert.strictEqual(D.hqRoomSite(id), SITE, id + ' is WILD (9.4)');
        assert.ok(/THE CAVE/.test(r.label) && r.sub && r.spawn && Array.isArray(r.lines) && r.lines.length, id + ': plate, spawn, lines');
        for (const n of ['floor', 'wall', 'dado', 'trim', 'ceiling']) assert.ok(HQ.textures[r.shell[n]] || TERRAIN_RULES[r.shell[n]], id + ': texture ' + r.shell[n]);
    }
    const reg = D.hqRoomRegister();
    assert.strictEqual(reg.filter(r => r.mapId === SITE).length, 1, 'the register lists Hollow Earth once');
    assert.ok(!reg.some(r => PART_IDS.includes(r.id) || PART_IDS.includes(r.room)), 'no part is a register entry');
});

test('THE WELLS: six of them, every one a live `way: well` link into the well room, one head each, no two heads within 1.6 m, an end’s own plate line and CLIMB UP', () => {
    assert.deepStrictEqual(WELLS.map(l => l.id).sort().join(','), 'well_camelot,well_cellar,well_garden,well_gobekli,well_nuketown,well_skinwalker', 'the garden, the cellar, Camelot, the ranch, Nuketown, Göbekli');
    const heads = [];
    for (const l of WELLS) {
        assert.ok(D.hqLinkLive(l), l.id + ' is held back');
        assert.strictEqual(l.route, 'undercroft', l.id + ' rides THE UNDERCROFT');
        assert.ok(l.why && l.why.length > 20 && l.note && l.draft === true, l.id + ': a why, a note, a draft flag (A15)');
        const far = l.b;
        assert.ok(far.part === 'shaft' && far.wall === 'free' && Number.isFinite(far.face), l.id + ': the far end is a free head in the well room');
        assert.ok(far.sub && /CLIMB UP/.test(far.sub) && far.verb === 'CLIMB UP', l.id + ': the head’s plate says which well it is the bottom of, and reads CLIMB UP');
        heads.push(far);
        /* both halves exist, wear the well, and come back to each other */
        for (const [rid, end] of [[D.hqLinkRoom(l.a), l.a], [SHAFT, l.b]]) {
            const door = at(rid, 'link_' + l.id);
            assert.ok(door && door.way === 'well' && door.leaf === null, rid + ' wears the well');
            const back = at(door.action.room, door.action.at);
            assert.ok(back && back.action.room === rid && back.action.at === door.id && back.way === 'well', l.id + ': the same object at the far end');
            assert.strictEqual(D.doorSiteState(door, {}), 'open', l.id + ': a seam is never sector-gated (C-12)');
            if (end.wall !== 'free') assert.ok(end.wall === 'n' && end.x <= -0.2, l.id + ': a site-room end hangs in a lane on the north wall');
        }
    }
    const shaft = HQ.rooms[SHAFT], wells = shaft.doors.filter(d => d.way === 'well');
    assert.strictEqual(wells.length, WELLS.length, 'one head per well row and no more');
    for (const a of heads) for (const b of heads) if (a !== b) assert.ok(Math.hypot(a.x - b.x, a.z - b.z) >= 1.6, 'two heads stand within 1.6 m');
    /* the cellar's well was RE-POINTED (rev 6 → rev 10), not duplicated */
    assert.ok(!HQ.links.some(l => l.id === 'haunted_hollow'), 'the old cellar ⇄ Hollow Earth pipe is gone');
    const cellarWell = at('site_prebuilt_haunted_cellar', 'link_well_cellar');
    assert.ok(cellarWell && cellarWell.wall === 'free', 'the cellar keeps its well, where it stood');
    assert.strictEqual(cellarWell.action.room, SHAFT, 'and it drops into the well room now');
    /* the garden's well: a FACILITY room at one end (the H-Wing precedent), and the room took its link door */
    const gw = at('garden', 'link_well_garden');
    assert.ok(gw && gw.way === 'well' && gw.wall === 'free', 'the garden’s well stands free on the gravel ring');
    assert.strictEqual(D.hqRoomSite('garden'), null, 'the garden is facility (safe); the cave it drops into is wild');
    const g = landing(HQ.rooms.garden, gw), gp = g.player;
    for (const q of [...HQ.rooms.garden.props, ...HQ.rooms.garden.npcSpots, ...HQ.rooms.garden.onlineSpots, ...HQ.rooms.garden.agents]) assert.ok(!propBlocks(HQ.rooms.garden, q, gp.x, gp.z, 0.4), (q.key || q.label || 'person') + ' blocks the garden well’s landing');
    assert.ok(Math.hypot(gp.x, gp.z) > 2.4, 'the landing is clear of the fountain');
});

test('THE FOUR EXITS: a live pair each into Hell, D.U.M.B., Agartha and Hollow Earth’s own board room, every far end a legal north-wall lane', () => {
    assert.deepStrictEqual(EXITS.map(l => l.id).sort().join(','), 'cave_agartha,cave_dumb,cave_hell,cave_hollow');
    const want = { cave_hell: 'prebuilt_hell', cave_dumb: 'prebuilt_dumb', cave_agartha: 'prebuilt_agartha', cave_hollow: SITE };
    for (const l of EXITS) {
        assert.ok(D.hqLinkLive(l), l.id + ' is held back');
        assert.strictEqual(l.b.site, want[l.id], l.id + ' leads where the plan says');
        assert.ok(HQ.catalogue[l.leaf] && HQ.catalogue[l.leaf].leaf, l.id + ': a catalogue leaf');
        assert.ok(l.why && l.note && l.draft === true, l.id + ': a why, a note, a draft flag');
        const here = D.hqLinkRoom(l.a), there = D.hqLinkRoom(l.b);
        assert.ok(PART_IDS.includes(here), l.id + ': the near end is a cave chamber');
        const door = at(here, 'link_' + l.id), back = at(there, 'link_' + l.id);
        assert.ok(door && back && door.action.room === there && back.action.room === here, l.id + ': two-way');
        assert.strictEqual(back.leaf, door.leaf, l.id + ': the same leaf both sides');
        assert.strictEqual(D.hqDoorNo(door), D.hqRoomNo(there), l.id + ': the plate reads the far number');
        assert.strictEqual(D.doorSiteState(door, {}), 'open');
        const room = HQ.rooms[there], half = room.shell.w / 2;
        assert.strictEqual(back.wall, 'n');
        assert.ok(back.x > -(half - (room.shell.open ? 2.6 : 1.4)) && back.x < 0.4, l.id + ': the far lane is inside the wall');
        for (const o of room.doors.filter(d => d.link && d !== back)) assert.ok(Math.abs(o.x - back.x) >= 4.4, l.id + ': the far lane crowds ' + o.id);
    }
});

test('the cave is one piece: from the mouth every chamber is walked, every inside door is a pair, and nothing leaves the complex but a links row', () => {
    const seen = new Set([BOARD + '_mouth']), queue = [BOARD + '_mouth'];
    while (queue.length) {
        const id = queue.shift();
        for (const d of HQ.rooms[id].doors) {
            const a = d.action || {};
            assert.ok(a.room && HQ.rooms[a.room], id + '/' + d.id + ' leads to a room');
            if (d.link) { assert.ok(HQ.links.some(l => l.id === d.link), id + '/' + d.id + ' is a links row'); continue; }
            if (d.secret) { assert.strictEqual(a.room, 'dungeon', 'the only secret door out of the cave is the dungeon’s'); continue; }
            const back = at(a.room, a.at);
            assert.ok(back && back.action.room === id && back.action.at === d.id, id + '/' + d.id + ' ⇄ ' + a.room + ' is a pair');
            assert.strictEqual(back.leaf, d.leaf, 'the same leaf (or opening) on both sides of ' + d.id);
            assert.ok(PART_IDS.includes(a.room), id + '/' + d.id + ' stays inside the complex');
            if (!seen.has(a.room)) { seen.add(a.room); queue.push(a.room); }
        }
    }
    assert.deepStrictEqual(Array.from(seen).sort().join(','), PART_IDS.slice().sort().join(','), 'every chamber is reachable from the mouth');
    /* the shape: the gallery is the crossroads */
    const g = HQ.rooms[BOARD + '_gallery'];
    for (const id of ['shaft', 'vent', 'blast', 'adit', 'mouth', 'oubliette']) assert.ok(at(BOARD + '_gallery', id), 'the gallery has the ' + id + ' door');
    assert.strictEqual(g.doors.filter(d => !d.link).length, 6, 'six ways off the gallery');
});

test('THE UNDERCROFT: a dashed line whose every leg is a well or an exit, all converging on HOLLOW EARTH, and the world graph carries both halves', () => {
    const R = D.hqWorldRoutes('garden').find(r => r.id === 'undercroft');
    assert.ok(R && R.dashed && R.label && R.sub, 'the route is catalogued and dashed');
    assert.strictEqual(R.legs.length, WELLS.length + EXITS.length, 'ten legs');
    assert.ok(R.legs.every(l => l.from === BOARD || l.to === BOARD), 'every leg touches HOLLOW EARTH — the wells and the exits are one hub');
    assert.ok(R.stations.some(s => s.no === '180'), 'the hub is a station');
    assert.ok(R.stations.find(s => s.room === 'garden').here, 'the viewer in the garden is filled');
    for (const s of R.stations) assert.ok(!/undefined|NaN/.test(s.label + s.no), 'a station reads');
    const G = D.hqWorldGraph();
    for (const l of WELLS.concat(EXITS)) {
        const a = D.hqLinkRoom(l.a), b = D.hqLinkRoom(l.b);
        assert.ok(G.edges.some(e => e.from === a && e.to === b && e.link === l.id), l.id + ': the edge out');
        assert.ok(G.edges.some(e => e.from === b && e.to === a && e.link === l.id), l.id + ': the edge back');
    }
});

test('the production renderer lands every door and every well head inside its chamber, clear of every blocker and native, facing into the room', () => {
    for (const id of PART_IDS) {
        const room = HQ.rooms[id], S = room.shell;
        for (const door of room.doors) {
            const h = landing(room, door), p = h.player;
            assert.ok(Math.abs(p.x) < S.w / 2 - 0.4 && Math.abs(p.z) < S.d / 2 - 0.4, id + '/' + door.id + ': inside the walls');
            const inward = door.wall === 'free' ? [Math.sin(door.face * Math.PI / 180), -Math.cos(door.face * Math.PI / 180)] : { n: [0, 1], s: [0, -1], e: [-1, 0], w: [1, 0] }[door.wall];
            const fx = Math.sin(h.cam.yaw), fz = -Math.cos(h.cam.yaw);
            const dot = fx * inward[0] + fz * inward[1];
            assert.ok(dot < -0.99 || dot > 0.99, id + '/' + door.id + ': faces along the doorway’s normal');
            assert.equal(p.air, false);
            assert.equal(p.y, sill(room, door), id + '/' + door.id + ': lands at the door’s own sill (a door on a ledge lands on the ledge)');
            for (const q of [...room.props, ...room.npcSpots]) assert.ok(!propBlocks(room, q, p.x, p.z, 0.35), id + '/' + door.id + ': ' + (q.key || q.race) + ' blocks the landing');
            for (const other of room.doors) if (other.id !== door.id && other.wall === door.wall && door.wall !== 'free') {
                const k = (door.wall === 'n' || door.wall === 's') ? 'x' : 'z';
                assert.ok(Math.abs(other[k] - door[k]) > 2.6, id + ': ' + door.id + ' and ' + other.id + ' overlap on the ' + door.wall + ' wall');
            }
            /* a head never stands on another head's landing */
            for (const other of room.doors) if (other !== door && other.wall === 'free') assert.ok(Math.hypot(p.x - other.x, p.z - other.z) > 1.0, id + ': ' + other.id + ' stands on ' + door.id + '’s landing');
        }
        const sp = room.spawn;
        for (const q of [...room.props, ...room.npcSpots]) assert.ok(!propBlocks(room, q, sp.x, sp.z, 0.3), id + ': ' + (q.key || q.race) + ' blocks the spawn');
        for (const n of room.npcSpots) assert.ok(D.AVAILABLE_RACES.includes(n.race), id + ': native race ' + n.race);
    }
});

test('THE PARK RULE and the cave’s own light: a rail in every chamber, a real ramp in every one, no facility strips, torches and crystals under the prop-light cap', () => {
    for (const id of PART_IDS) {
        const room = HQ.rooms[id], S = room.shell;
        assert.ok(room.props.some(p => p.key === 'railing_1m'), id + ': a rail to grind');
        /* the ramp is a SLOPE CELL of the grid now (rev 11 — 9.8's `_hq.ramps` reads them), not the lecture hall's risers */
        const info = D.hqCaveInfo(id);
        assert.ok(info && info.cells.some(r => r.some(c => c.slope)), id + ': a real ramp (a slope cell) to ride');
        assert.ok(S.strips === false && Array.isArray(S.lights) && S.lights.length === 0 && S.mood, id + ': no facility strips — the cave lights itself');
        const lava = D.hqCaveInfo(id).cells.some(r => r.some(c => c.fluid === 'lava' || (c.under && c.under.fluid === 'lava'))) ? 1 : 0;   // _hqBuildCave: one point light per lava lake
        const lit = room.props.filter(p => (HQ.catalogue[p.key] || {}).light).length + lava;
        assert.ok(lit >= 1 && lit <= 10, id + ': ' + lit + ' point lights (HQ_PROP_LIGHT_MAX is 10, the lava’s counted)');
    }
});

/* ── THE DUNGEON (stage 2, rev 11) ─────────────────────────────────────── */
const CELL = D.HQ_CAVE_CELL, LEVEL = D.HQ_CAVE_LEVEL;
/* the cell a door's landing (2.4 m inside the wall) falls in, and the walker's feet there */
function landingCell(room, door) {
    const info = D.hqCaveInfo(room.id), S = room.shell;
    let px, pz;
    if (door.wall === 'free') { const f = (door.face || 0) * Math.PI / 180; px = door.x + Math.sin(f) * 2.4; pz = door.z - Math.cos(f) * 2.4; }
    else if (door.wall === 'n') { px = door.x || 0; pz = -S.d / 2 + 2.4; }
    else if (door.wall === 's') { px = door.x || 0; pz = S.d / 2 - 2.4; }
    else if (door.wall === 'e') { px = S.w / 2 - 2.4; pz = door.z || 0; }
    else { px = -S.w / 2 + 2.4; pz = door.z || 0; }
    const c = D.hqCaveCellAt(info, px, pz);
    return { c, feet: c ? D.hqCaveFeet(info, c, px, pz) : null, px, pz };
}

test('THE DUNGEON: every chamber is a cave grid the shell fits, one level is half a tile, the standard legend has the ramps and the bridges', () => {
    assert.strictEqual(CELL, 1.75); assert.strictEqual(LEVEL, 0.875);
    const STD = D.HQ_CAVE_STD;
    for (const [ch, want] of [['a', { lvl: 0, slope: 'n' }], ['f', { lvl: 5, slope: 'n' }], ['g', { lvl: 0, slope: 's' }], ['m', { lvl: 0, slope: 'e' }], ['s', { lvl: 0, slope: 'w' }], ['x', { lvl: 5, slope: 'w' }]])
        assert.deepStrictEqual({ lvl: STD[ch].lvl, slope: STD[ch].slope }, want, 'ramp ' + ch);
    assert.ok(STD['='].bridge && STD.B.bridge && STD.H.bridge && STD.P.fluid === 'water' && STD.Y.fluid === 'lava' && STD.W.fluid === 'deep_water' && STD.L.fluid === 'lava' && STD['#'].rock, 'the bridges, the pool, the lake, the deeps, the rock');
    assert.deepStrictEqual(D.hqCaveRooms().filter(id => id.indexOf(BOARD + '_') === 0).sort().join(','), PART_IDS.slice().sort().join(','), 'every cave chamber is a cave grid, and only they (THE WOODS, 9.3 stage 3, is the other grid complex — hq-woods.test.js)');
    for (const id of PART_IDS) {
        const room = HQ.rooms[id], info = D.hqCaveInfo(id), S = room.shell;
        assert.ok(info && info.w >= 8 && info.h >= 8, id + ': a grid at least 8 × 8');
        assert.ok(room.cave.rows.every(r => r.length === info.w), id + ': every row the same width');
        assert.strictEqual(S.w, Math.round(info.w * CELL * 100) / 100, id + ': the shell is as wide as the grid');
        assert.strictEqual(S.d, Math.round(info.h * CELL * 100) / 100, id + ': the shell is as deep as the grid');
        assert.strictEqual(S.wallH, S.h, id + ': wallH is the ceiling (a ledge is never a mezzanine)');
        assert.strictEqual(info.rockH, S.h, id + ': the rock reaches the ceiling');
        /* the rock border: every perimeter cell is rock unless a door's lane opens it */
        const lanes = room.doors.filter(d => d.wall !== 'free');
        for (let y = 0; y < info.h; y++) for (let x = 0; x < info.w; x++) {
            if (x > 0 && y > 0 && x < info.w - 1 && y < info.h - 1) continue;
            const c = info.cells[y][x]; if (c.rock) continue;
            const cx = (x + 0.5) * CELL - info.halfW, cz = (y + 0.5) * CELL - info.halfD;
            const lane = lanes.some(d => (d.wall === 'n' && y === 0 && Math.abs(cx - d.x) <= CELL * 1.6) || (d.wall === 's' && y === info.h - 1 && Math.abs(cx - d.x) <= CELL * 1.6) || (d.wall === 'w' && x === 0 && Math.abs(cz - d.z) <= CELL * 1.6) || (d.wall === 'e' && x === info.w - 1 && Math.abs(cz - d.z) <= CELL * 1.6));
            assert.ok(lane, id + ': the border cell ' + x + ',' + y + ' (' + c.ch + ') is open but no door’s lane reaches it');
        }
        /* every cell the legend does not know is a bug, not rock */
        for (const row of room.cave.rows) for (const ch of row) assert.ok(D.HQ_CAVE_STD[ch] || (room.cave.legend || {})[ch], id + ': the legend has no ' + JSON.stringify(ch));
        /* every sheet a cell wears exists */
        const keys = new Set(); info.cells.forEach(r => r.forEach(c => { keys.add(c.key); if (c.under) keys.add(c.under.key); }));
        for (const k of keys) assert.ok(HQ.textures[k] || TERRAIN_RULES[k], id + ': cell sheet ' + k);
    }
});

test('THE DUNGEON is solvable and never trivial: from every door every other door is reached under the walker’s own step rule, every lane is level with its sill, and a ledge door is a door you climb to', () => {
    let ledgeDoors = 0, ramps = 0, bridges = 0, waters = 0, lavas = 0;
    for (const id of PART_IDS) {
        const room = Object.assign({ id }, HQ.rooms[id]), info = D.hqCaveInfo(id);
        const cells = room.doors.map(d => Object.assign({ d, y: sill(room, d) }, landingCell(room, d)));
        for (const x of cells) {
            assert.ok(x.c && x.c.walk && !x.c.fluid && !x.c.slope && !x.c.rock, id + '/' + x.d.id + ': the landing is a dry, level cell');
            assert.ok(Math.abs(x.feet - x.y) < 0.02, id + '/' + x.d.id + ': the landing (' + x.feet + ') is level with the sill (' + x.y + ')');
            /* the three cells of the lane at the wall are the sill's level too */
            if (x.d.wall !== 'free') {
                const along = (x.d.wall === 'n' || x.d.wall === 's') ? x.d.x : x.d.z;
                for (let k = -1; k <= 1; k++) {
                    const ax = along + k * CELL * 0.9;
                    const p = x.d.wall === 'n' ? [ax, -room.shell.d / 2 + 0.3] : x.d.wall === 's' ? [ax, room.shell.d / 2 - 0.3] : x.d.wall === 'e' ? [room.shell.w / 2 - 0.3, ax] : [-room.shell.w / 2 + 0.3, ax];
                    const lc = D.hqCaveCellAt(info, p[0], p[1]);
                    assert.ok(lc && lc.walk && !lc.fluid && !lc.slope, id + '/' + x.d.id + ': the lane cell at the wall (' + k + ') is dry floor');
                    assert.ok(Math.abs(D.hqCaveFeet(info, lc, p[0], p[1]) - x.y) < 0.02, id + '/' + x.d.id + ': the lane cell at the wall (' + k + ') is at the sill’s level');
                }
            }
            if (x.y > 0.5) ledgeDoors++;
        }
        const from = cells[0];
        const reach = D.hqCaveReach(info, from.c.x, from.c.y);
        for (const x of cells) assert.ok(reach.has(x.c.x + ',' + x.c.y), id + ': ' + x.d.id + ' cannot be reached from ' + from.d.id + ' (the dungeon must be solvable)');
        /* the spawn and every native stand on a walkable cell */
        const sp = D.hqCaveCellAt(info, room.spawn.x, room.spawn.z);
        assert.ok(sp && sp.walk && !sp.fluid && reach.has(sp.x + ',' + sp.y), id + ': the spawn stands on a reachable dry cell');
        for (const n of room.npcSpots) { const nc = D.hqCaveCellAt(info, n.x, n.z); assert.ok(nc && nc.walk && !nc.fluid && !nc.slope && reach.has(nc.x + ',' + nc.y), id + ': the ' + n.race + ' stands on a reachable dry cell'); }
        /* a floor prop stands on a walkable cell (a rail on a ledge, a torch on the terrace — never in rock, never in the lava) */
        for (const p of room.props) {
            if (typeof p.wall === 'string' || p.ceil || (HQ.catalogue[p.key] || {}).ceil) continue;
            const pc = D.hqCaveCellAt(info, p.x, p.z);
            assert.ok(pc && !pc.rock && pc.walk, id + ': ' + p.key + ' at ' + p.x + ',' + p.z + ' stands in rock or a hazard');
        }
        info.cells.forEach(r => r.forEach(c => { if (c.slope) ramps++; if (c.bridge) bridges++; if (c.fluid === 'water' || c.fluid === 'deep_water') waters++; if (c.fluid === 'lava' || (c.under && c.under.fluid === 'lava')) lavas++; }));
    }
    assert.ok(ledgeDoors >= 3, 'doors on ledges: LEVEL −6 and the fissure off the cavern, the mouth’s lip — ' + ledgeDoors);
    assert.ok(ramps >= 12 && bridges >= 8 && waters >= 40 && lavas >= 30, 'ramps ' + ramps + ', bridges ' + bridges + ', water ' + waters + ', lava ' + lavas + ' — the dungeon has its terrain');
    /* THE CAVERN has its routes: the terrace's ramps, the hall's stair, the ford, the plank bridge, the long ramp, the causeway */
    const cav = D.hqCaveInfo(BOARD + '_gallery');
    const chars = cav.cells.map(r => r.map(c => c.ch).join('')).join('\n');
    assert.ok(/B{4,}/.test(chars) && /H{5,}/.test(chars) && /P/.test(chars) && /Y/.test(chars) && /=/.test(chars) && /~/.test(chars) && /W/.test(chars) && /6/.test(chars) && /4/.test(chars) && /2/.test(chars), 'the cavern wears the rope bridge, the obsidian bridge, the pool, the lava lake, the planks, the ford, the deeps and three tiers');
    /* THE WELLS stand on three tiers */
    const shaft = HQ.rooms[SHAFT], sills = shaft.doors.filter(d => d.way === 'well').map(d => sill(shaft, d));
    assert.deepStrictEqual(Array.from(new Set(sills)).sort((a, b) => a - b).join(','), '0,1.75,3.5', 'the well heads stand at the floor, the shelf and the crag');
});

test('THE DUNGEON’s renderer: the cave builder, the walker’s feet, the doors at their sills, the props and natives on their cells, the fluids ticked per key', () => {
    const tr = renderer;
    assert.ok(/function _hqBuildCave\(room\)/.test(tr) && /if \(room\.cave\) \{ try \{ _hqBuildCave\(room\); \}/.test(tr), 'a box room with `cave` builds its grid');
    assert.ok(/function _hqSiteFloorY\(sc, x, z\)/.test(tr) && /hqCaveFeet\(st\.info, sc, x, z\)/.test(tr), 'the ONE feet read: a ramp interpolates, a pool wades, a ledge stands');
    assert.ok(/var siteL = _hq\.site \? \(_hq\.site\.L \|\| _hq\.site\.C\) : 0;/.test(tr), 'the step rule climbs one LEVEL (a cave’s half tile), not one tile');
    assert.ok(/var y0 = level \? _hqLevelY\(S, level\) : _hqDoorFloorY\(room, door\);/.test(tr), 'a door stands at its lane’s level');
    assert.ok(/y0 \+= pcy;/.test(tr) && /y \+= chy;/.test(tr) && /grp\.position\.y \+= ccy \* U;/.test(tr), 'props, natives and counters stand on their cells');
    assert.ok(/if \(room\.cave\) \{ \/\* THE CAVE \(rev 11\)/.test(tr), 'no floor plane under a cave grid');
    assert.ok(/\(mt\.keys \|\| \[mt\.key\]\)\.forEach/.test(tr), 'water and lava are ticked in one room');
    assert.ok(/if \(sc\.rock\) return py < sc\.top;/.test(tr), 'the boom never enters the rock');
    assert.ok(/cave_torch: function \(U\)/.test(tr) && /crystal_cluster: function \(U\)/.test(tr), 'the stake torch and the crystal are procs');
    for (const k of ['cave_torch', 'crystal_cluster']) assert.ok(HQ.catalogue[k] && HQ.catalogue[k].proc === k && HQ.catalogue[k].light && HQ.catalogue[k].glow, k + ' is catalogued with a light');
    /* the wedge: a ramp cell's prism rises toward its side */
    const c = { THREE: require('./load-data').makeSandbox().THREE || null };
    const src = tr.slice(tr.indexOf('    function _hqCaveWedge('), tr.indexOf('    function _hqBuildCave('));
    const vm2 = require('node:vm');
    const ctx = { THREE: { BufferGeometry: class { setAttribute(n, a) { this[n] = a; } computeVertexNormals() { this.normals = true; } }, Float32BufferAttribute: class { constructor(a, n) { this.array = a; this.itemSize = n; } } } };
    vm2.createContext(ctx); vm2.runInContext(src + '\nthis.w = _hqCaveWedge;', ctx);
    const g = ctx.w(1.75, 0, 0.875, 'n', 1);
    const pos = g.position.array, ys = [];
    for (let i = 1; i < pos.length; i += 3) ys.push(pos[i]);
    assert.strictEqual(pos.length / 3, 6 + 4 * 6, '5 faces, 30 vertices');
    assert.ok(Math.max(...ys) === 0.875 && Math.min(...ys) === 0 && g.normals, 'the top rises to one level; normals computed');
    /* the north face is high, the south face is at the base */
    const zs = []; for (let i = 2; i < pos.length; i += 3) zs.push(pos[i]);
    let northMax = 0, southMax = 0;
    for (let i = 0; i < ys.length; i++) { if (zs[i] < 0) northMax = Math.max(northMax, ys[i]); else southMax = Math.max(southMax, ys[i]); }
    assert.ok(northMax === 0.875 && southMax === 0, 'rising north: the north edge is up, the south edge is down');
});

test('THE FOURTH CELL NOBODY COUNTS: the oubliette and Room 24601 share a secret wall — eight secret doors, a pair, on no plate, and the dungeon’s cells moved off the panel', () => {
    const secrets = D.hqSecretDoors();
    assert.strictEqual(secrets.length, 8, 'the seventh and eighth secret doors');
    const a = at('dungeon', 'oubliette'), b = at(BOARD + '_oubliette', 'dungeon');
    for (const d of [a, b]) assert.ok(d && d.secret === true && d.leaf == null && !d.proc && /DRAUGHT/.test(d.label), 'a secret door: no leaf, no plate, a draught');
    assert.ok(a.action.room === BOARD + '_oubliette' && a.action.at === 'dungeon' && b.action.room === 'dungeon' && b.action.at === 'oubliette', 'the pair closes');
    assert.strictEqual(D.hqRoomSite('dungeon'), null, 'Room 24601 stays facility; the oubliette is wild');
    const cells = HQ.rooms.dungeon.props.filter(p => p.key === 'cell_bars');
    assert.strictEqual(cells.length, 3, 'three cells, still');
    for (const c of cells) assert.ok(Math.abs(c.z - a.z) > 1.0, 'a cell stands on the fourth cell’s panel');
    const h = landing(HQ.rooms.dungeon, a), p = h.player;
    for (const q of [...HQ.rooms.dungeon.props, ...HQ.rooms.dungeon.npcSpots, ...HQ.rooms.dungeon.agents]) assert.ok(!propBlocks(HQ.rooms.dungeon, q, p.x, p.z, 0.35), (q.key || q.label || 'person') + ' blocks the fourth cell’s landing');
});
