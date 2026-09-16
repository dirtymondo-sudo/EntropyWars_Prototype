// hq-woods.test.js — THE WOODS (HQ plan 9.3 stage 3 — 2026-09-16): the
// forest on the cave grid. The SEVENTH complex, the Fairy Forest's: THE
// CLEARING (the crossroads) and six paths — THE MOUNTAIN TRAIL up to Shasta,
// THE REDWOOD TRAIL to the Grove, THE BACK PASTURE with the ranch's gate and
// the house's garden gate in one fence, THE STAIRCASE whose door opens on the
// building's stairwell, DEAD MAN'S CAVE whose grate opens on THE TUNNEL (the
// subway's fourth station) and THE RITUAL GROUND whose circle is Room 333's.
// Guards: the sheet (site + part, no number, the register lists 420 once),
// the TREE cell (a wall to the walker, rock to the field's raster, planted by
// the renderer), every grid solvable from every door with no isolated cell,
// the complex connected from the forest's back door and every door a pair,
// the eight links live with the rev-7 gates re-pointed, the production
// landing on every door, THE PARK RULE, THE WEENIES (one sky, two landmarks,
// the renderer's builders), the tapes (one per part, the hundred kept) and
// the renderer's source sites.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { loadGameData } = require('./load-data');
const D = loadGameData(), HQ = D.DOOR_HQ;
const TERRAIN_RULES = vm.runInContext('TERRAIN_RULES', D);
const SITE = 'prebuilt_fairy_forest';
const BOARD = 'site_' + SITE;
const PARTS = ['clearing', 'trail', 'redwoods', 'pasture', 'stair', 'deadmans', 'ritual'];
const PART_IDS = PARTS.map(p => BOARD + '_' + p);
const HUB = BOARD + '_clearing';
const SEWER = BOARD + '_deadmans';   // THE STORM DRAIN (2026-09-16): the woods' one INDOOR part — a closed brick culvert, no sky
const STAIR = BOARD + '_stair';
const LINKS = { woods_haunted: 'pasture', woods_skinwalker: 'pasture', woods_grove: 'redwoods', woods_shasta: 'trail', woods_stair: 'stair', woods_sewer: 'deadmans', woods_ritual: 'ritual' };
const renderer = fs.readFileSync(__dirname + '/three-renderer.js', 'utf8');
const dataSrc = fs.readFileSync(__dirname + '/data.js', 'utf8');
const at = (room, id) => (HQ.rooms[room].doors || []).find(d => d.id === id);
const CELL = D.HQ_CAVE_CELL;

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
function landingCell(id, door) {
    const room = HQ.rooms[id], info = D.hqCaveInfo(id), S = room.shell;
    let px, pz;
    if (door.wall === 'free') { const f = (door.face || 0) * Math.PI / 180; px = door.x + Math.sin(f) * 2.4; pz = door.z - Math.cos(f) * 2.4; }
    else if (door.wall === 'n') { px = door.x; pz = -S.d / 2 + 2.4; }
    else if (door.wall === 's') { px = door.x; pz = S.d / 2 - 2.4; }
    else if (door.wall === 'e') { px = S.w / 2 - 2.4; pz = door.z; }
    else { px = -S.w / 2 + 2.4; pz = door.z; }
    return D.hqCaveCellAt(info, px, pz);
}

test('the sheet: THE WOODS is the Fairy Forest’s complex — seven parts, each site + part, none numbered, open under one sky, the register lists 420 once', () => {
    for (const id of PART_IDS) {
        const r = HQ.rooms[id];
        assert.ok(r && r.kind === 'box' && r.site === SITE && r.part === id.slice(BOARD.length + 1), id + ': a box part of the forest');
        assert.equal(r.roomNo, undefined, id + ': a part wears no number');
        assert.equal(D.hqRoomNo(id), '420', id + ': the number is the threshold’s, read through the site');
        assert.equal(D.hqRoomSite(id), SITE, id + ': wild');
        assert.ok(/^THE WOODS · /.test(r.label) && r.sub && r.spawn && Array.isArray(r.lines) && r.lines.length, id + ': plate, spawn, lines');
        if (id === SEWER) assert.ok(r.shell.open !== true && !r.shell.sky && r.shell.h <= 3.2 && r.cave.stalactites === false && r.shell.strips === false, id + ': the storm drain is a closed culvert — a ceiling, no sky, no stalactites of concrete');
        else assert.ok(r.shell.open === true && r.shell.edge === 'open' && r.shell.sky && r.shell.sky.night === 1 && r.shell.forest && r.shell.forest.depth >= 8, id + ': an open room under the woods’ dusk, the forest past its grid');
        assert.ok(r.cave && Array.isArray(r.cave.rows), id + ': a cave grid');
    }
    assert.deepEqual(D.hqSiteComplex(SITE).join(','), [BOARD].concat(PART_IDS).join(','), 'the complex in sheet order (ids)');
    assert.equal(D.hqRoomRegister().filter(e => e.no === '420').length, 1, 'the register lists the forest once');
    assert.deepEqual(D.hqCaveRooms().filter(id => id.indexOf(BOARD + '_') === 0).sort().join(','), PART_IDS.slice().sort().join(','), 'every part is a grid');
});

test('THE TREE CELL: T / D / R in the standard legend, a wall to the walker (never a hazard), the floor under it at its level, rock to the field’s raster wearing the forest sheet', () => {
    const STD = D.HQ_CAVE_STD;
    for (const [ch, kind] of [['T', 'tree'], ['D', 'tree_5'], ['R', 'tree_4']]) assert.ok(STD[ch] && STD[ch].tree === kind && STD[ch].lvl === 0 && !STD[ch].rock, 'tree ' + ch);
    assert.equal(STD.R.tall, true, 'a redwood is tall');
    const info = D.hqCaveCompile({ rows: ['TTT', 'T.T', 'TDT'], legend: { 'Q': { lvl: 2, tree: 'tree' } } }, 9);
    const t = info.cells[0][0], f = info.cells[1][1];
    assert.ok(t.tree === 'tree' && t.walk === false && !t.rock && !t.fluid && t.top === 0 && t.key === info.floor, 'a tree cell: unwalkable, not rock, the floor sheet at level 0');
    assert.equal(D.hqCaveFeet(info, t, 0, 0), null, 'the walker never stands on it');
    assert.ok(f.walk && D.hqCaveReach(info, 1, 1).size === 1, 'a cell ringed by trees is walled in');
    const raised = D.hqCaveCompile({ rows: ['Q'], legend: { 'Q': { lvl: 2, tree: 'tree' } } }, 9).cells[0][0];
    assert.ok(raised.tree && raised.lvl === 2 && Math.abs(raised.top - 2 * D.HQ_CAVE_LEVEL) < 1e-9, 'a legend may raise a tree onto a tier');
    /* the field's raster (hqFieldRasterCave): a tree is rock, in the forest sheet */
    const R = D.hqFieldRaster(HUB, 0, 0);
    const tc = R.cells[0][0];
    assert.ok(tc.rock === true && tc.in === false && tc.key === 'forest', 'a tree cell is a rock column wearing forest in the fight');
    assert.match(dataSrc, /if \(!src \|\| src\.rock \|\| src\.tree\)/, 'hqFieldRasterCave reads the tree flag');
});

test('THE DUNGEON RULES hold in the woods: every grid the shell fits, the border trees or rock but at the lanes, every legend char known, every sheet real, no isolated walkable cell, every door reaches every other under the walker’s own step rule', () => {
    for (const id of PART_IDS) {
        const room = HQ.rooms[id], info = D.hqCaveInfo(id), S = room.shell;
        assert.ok(info.w >= 12 && info.h >= 12, id + ': a grid at least 12 × 12');
        assert.ok(room.cave.rows.every(r => r.length === info.w), id + ': every row the same width');
        assert.equal(S.w, Math.round(info.w * CELL * 100) / 100, id + ': the shell is as wide as the grid');
        assert.equal(S.d, Math.round(info.h * CELL * 100) / 100, id + ': the shell is as deep as the grid');
        assert.equal(S.wallH, S.h, id + ': wallH is the height');
        const lanes = room.doors.filter(d => d.wall !== 'free');
        for (let y = 0; y < info.h; y++) for (let x = 0; x < info.w; x++) {
            if (x > 0 && y > 0 && x < info.w - 1 && y < info.h - 1) continue;
            const c = info.cells[y][x]; if (c.rock || c.tree) continue;
            const cx = (x + 0.5) * CELL - info.halfW, cz = (y + 0.5) * CELL - info.halfD;
            const lane = lanes.some(d => (d.wall === 'n' && y === 0 && Math.abs(cx - d.x) <= CELL * 1.6) || (d.wall === 's' && y === info.h - 1 && Math.abs(cx - d.x) <= CELL * 1.6) || (d.wall === 'w' && x === 0 && Math.abs(cz - d.z) <= CELL * 1.6) || (d.wall === 'e' && x === info.w - 1 && Math.abs(cz - d.z) <= CELL * 1.6));
            assert.ok(lane, id + ': the border cell ' + x + ',' + y + ' (' + c.ch + ') is open but no door’s lane reaches it');
        }
        for (const row of room.cave.rows) for (const ch of row) assert.ok(D.HQ_CAVE_STD[ch] || (room.cave.legend || {})[ch], id + ': the legend has no ' + JSON.stringify(ch));
        const keys = new Set(); info.cells.forEach(r => r.forEach(c => { keys.add(c.key); if (c.under) keys.add(c.under.key); }));
        for (const k of keys) assert.ok(HQ.textures[k] || TERRAIN_RULES[k], id + ': cell sheet ' + k);
        if (id !== SEWER) assert.ok(info.cells.some(r => r.some(c => c.tree)), id + ': trees');
        /* the solver: from every door, every other door — and every walkable cell (no pocket a walker can see but never reach) */
        const cells = room.doors.map(d => ({ d, c: landingCell(id, d) }));
        for (const x of cells) assert.ok(x.c && x.c.walk, id + '/' + x.d.id + ': the landing cell is walkable');
        for (const a of cells) {
            const seen = D.hqCaveReach(info, a.c.x, a.c.y);
            for (const b of cells) assert.ok(seen.has(b.c.x + ',' + b.c.y), id + ': ' + a.d.id + ' never reaches ' + b.d.id);
            info.cells.forEach(r => r.forEach(c => { if (c.walk) assert.ok(seen.has(c.x + ',' + c.y), id + ': the cell ' + c.x + ',' + c.y + ' (' + c.ch + ') is walkable but unreachable'); }));
        }
        /* a link door on a tier is a door you climb to (the mountain's, the staircase's) */
        for (const d of room.doors) assert.equal(D.hqCaveDoorY(room, d), sill(room, d));
    }
    assert.ok(D.hqCaveDoorY(HQ.rooms[BOARD + '_trail'], at(BOARD + '_trail', 'link_woods_shasta')) > 3, 'the mountain’s door stands on the top tier');
    assert.ok(D.hqCaveDoorY(HQ.rooms[BOARD + '_stair'], at(BOARD + '_stair', 'link_woods_stair')) > 3, 'the staircase’s door stands on the landing');
});

test('the woods are one piece: from the forest’s back door every part is walked, every inside door is a pair with the same opening on both sides, nothing leaves the complex but a links row, THE CLEARING has seven ways', () => {
    const back = at(BOARD, 'woods');
    assert.ok(back && back.wall === 'n' && back.x === -10 && back.leaf === null && back.action.room === HUB && back.action.at === 'forest', 'the path in on the forest’s north-west lane');
    assert.ok(!back.rankDoor && !back.minClearance && D.doorSiteState(back, null) === 'open', 'never gated');
    const seen = new Set([HUB]), queue = [HUB];
    while (queue.length) {
        const id = queue.shift();
        for (const d of HQ.rooms[id].doors) {
            const a = d.action || {};
            assert.ok(a.room && HQ.rooms[a.room], id + '/' + d.id + ' leads to a room');
            if (d.link) { assert.ok(HQ.links.some(l => l.id === d.link), id + '/' + d.id + ' is a links row'); continue; }
            const other = at(a.room, a.at);
            assert.ok(other && other.action.room === id && other.action.at === d.id, id + '/' + d.id + ' ⇄ ' + a.room + ' is a pair');
            assert.equal(other.leaf, d.leaf, 'the same opening on both sides of ' + d.id);
            assert.ok(PART_IDS.includes(a.room) || a.room === BOARD, id + '/' + d.id + ' stays inside the complex');
            if (!seen.has(a.room)) { seen.add(a.room); if (a.room !== BOARD) queue.push(a.room); }   // the board room is the way out: its own doors are the bay's
        }
    }
    assert.deepEqual(Array.from(seen).sort().join(','), PART_IDS.concat([BOARD]).sort().join(','), 'every part is reachable from the clearing');
    const hub = HQ.rooms[HUB];
    for (const id of ['forest', 'trail', 'stair', 'redwoods', 'deadmans', 'pasture', 'ritual']) assert.ok(at(HUB, id), 'the clearing has the ' + id + ' door');
    assert.equal(hub.doors.filter(d => !d.link).length, 7, 'seven ways off the clearing');
    assert.equal(hub.doors.filter(d => d.link).length, 0, 'no seam on the crossroads itself — the paths carry them');
});

test('THE PATHS: eight live links — the three rev-7 gates re-pointed onto the parts (the house and the ranch in the pasture’s fence, the grove at the redwoods’ end), Shasta at the top of the trail, the stairwell behind the staircase’s door, the tunnel behind the grate (the subway’s fourth station), Room 333 behind the circle, Camelot through the spring — every one two-way and explained', () => {
    for (const old of ['haunted_skinwalker', 'skinwalker_grove', 'grove_fairy']) assert.ok(!HQ.links.some(l => l.id === old), old + ' was re-pointed and renamed (one row edit)');
    for (const [id, part] of Object.entries(LINKS)) {
        const l = HQ.links.find(x => x.id === id);
        assert.ok(l && D.hqLinkLive(l), id + ' is live');
        assert.ok(l.why && l.why.length > 20 && l.note, id + ' explains itself');
        const end = (l.a.part === part) ? l.a : l.b, far = (end === l.a) ? l.b : l.a;
        assert.ok(end.site === SITE && end.part === part && end.sub, id + ': the woods end is the ' + part + ' with its own plate line');
        assert.equal(l.route, id === 'woods_sewer' ? 'subway' : 'woods', id + ': the route');
        const room = D.hqLinkRoom(end), farRoom = D.hqLinkRoom(far);
        const d = at(room, 'link_' + id), b = at(farRoom, 'link_' + id);
        assert.ok(d && b && d.action.room === farRoom && b.action.room === room && d.action.at === b.id && b.action.at === d.id, id + ': both halves pair');
        assert.ok(!(HQ.catalogue[l.leaf] || {}).rank, id + ': never a rank leaf');
    }
    assert.equal(D.hqLinkRoom(HQ.links.find(l => l.id === 'woods_haunted').a), 'site_prebuilt_haunted');
    assert.equal(D.hqLinkRoom(HQ.links.find(l => l.id === 'woods_skinwalker').a), 'site_prebuilt_skinwalker');
    assert.equal(D.hqLinkRoom(HQ.links.find(l => l.id === 'woods_grove').a), 'site_prebuilt_bohemian_grove');
    assert.equal(D.hqLinkRoom(HQ.links.find(l => l.id === 'woods_shasta').b), 'site_prebuilt_shasta');
    assert.equal(D.hqLinkRoom(HQ.links.find(l => l.id === 'woods_stair').b), 'stairwell');
    assert.equal(D.hqLinkRoom(HQ.links.find(l => l.id === 'woods_sewer').b), 'tunnel');
    assert.equal(D.hqLinkRoom(HQ.links.find(l => l.id === 'woods_ritual').b), 'ritual');
    /* the spring: the forest leads to Camelot — a pool seam, both ends free (the castle's north wall has no lane left) */
    const sp = HQ.links.find(l => l.id === 'fairy_camelot');
    assert.ok(sp && sp.way === 'pool' && sp.a.wall === 'free' && sp.b.wall === 'free' && D.hqLinkLive(sp), 'the spring is a live pool seam');
    assert.ok(at(BOARD, 'link_fairy_camelot') && at('site_prebuilt_camelot', 'link_fairy_camelot'), 'both pools stand');
    assert.equal(HQ.rooms.site_prebuilt_camelot.doors.filter(d => d.link && d.wall === 'n').length, 3, 'Camelot’s north wall keeps its three (the spring is on the strip)');
    /* the world: the woods line, the house still an interchange, the subway's fourth station */
    const R = D.hqWorldRoutes('foyer'), woods = R.find(r => r.id === 'woods'), sub = R.find(r => r.id === 'subway');
    assert.ok(woods.stations.some(s => s.site === SITE) && woods.stations.some(s => s.site === 'prebuilt_shasta') && woods.stations.some(s => s.room === 'stairwell') && woods.stations.some(s => s.room === 'ritual'), 'THE WOODS line calls at the forest, the mountain, the stairwell and Room 333');
    assert.ok(sub.stations.some(s => s.site === SITE), 'the storm drain is on the subway line');
    const G = D.hqWorldGraph();
    for (const id of Object.keys(LINKS).concat(['fairy_camelot'])) {
        const l = HQ.links.find(x => x.id === id), a = D.hqLinkRoom(l.a), b = D.hqLinkRoom(l.b);
        assert.ok(G.edges.some(e => e.from === a && e.to === b && e.link === id) && G.edges.some(e => e.from === b && e.to === a && e.link === id), id + ': both edges');
    }
});

test('the production renderer lands every door inside its part, clear of every blocker and native, facing along its doorway, at its sill; the back door lands on the forest’s walkway clear of the masts', () => {
    for (const id of PART_IDS) {
        const room = HQ.rooms[id], S = room.shell;
        for (const door of room.doors) {
            const h = landing(room, door), p = h.player;
            assert.ok(Math.abs(p.x) < S.w / 2 - 0.4 && Math.abs(p.z) < S.d / 2 - 0.4, id + '/' + door.id + ': inside');
            const inward = { n: [0, 1], s: [0, -1], e: [-1, 0], w: [1, 0] }[door.wall];
            const dot = Math.sin(h.cam.yaw) * inward[0] + (-Math.cos(h.cam.yaw)) * inward[1];
            assert.ok(dot < -0.99 || dot > 0.99, id + '/' + door.id + ': faces along the doorway’s normal');
            assert.equal(p.air, false);
            assert.equal(p.y, sill(room, door), id + '/' + door.id + ': lands at its sill');
            for (const q of [...room.props, ...room.npcSpots]) assert.ok(!propBlocks(room, q, p.x, p.z, 0.35), id + '/' + door.id + ': ' + (q.key || q.race) + ' blocks the landing');
            for (const other of room.doors) if (other.id !== door.id && other.wall === door.wall) {
                const k = (door.wall === 'n' || door.wall === 's') ? 'x' : 'z';
                assert.ok(Math.abs(other[k] - door[k]) > 2.6, id + ': ' + door.id + ' and ' + other.id + ' overlap on the ' + door.wall + ' wall');
            }
        }
        const sp = room.spawn, info = D.hqCaveInfo(id);
        for (const q of [...room.props, ...room.npcSpots]) assert.ok(!propBlocks(room, q, sp.x, sp.z, 0.3), id + ': ' + (q.key || q.race) + ' blocks the spawn');
        const sc = D.hqCaveCellAt(info, sp.x, sp.z); assert.ok(sc && sc.walk, id + ': the spawn stands on a walkable cell');
        for (const n of room.npcSpots) { assert.ok(D.AVAILABLE_RACES.includes(n.race), id + ': native race ' + n.race); const nc = D.hqCaveCellAt(info, n.x, n.z); assert.ok(nc && nc.walk, id + ': the ' + n.race + ' stands on a walkable cell'); }
        for (const p of room.props) { assert.ok(HQ.catalogue[p.key], id + ': prop ' + p.key); if ((p.y || 0) > 0.5) continue; const pc = D.hqCaveCellAt(info, p.x, p.z); assert.ok(pc && !pc.rock, id + ': ' + p.key + ' stands in rock'); }
    }
    const forest = HQ.rooms[BOARD], back = at(BOARD, 'woods'), h = landing(forest, back), p = h.player;
    assert.ok(Math.abs(p.z) > forest.shell.grid.cells * forest.shell.grid.cell / 2 + 0.4, 'off the battle board');
    for (const m of forest.shell.lights) assert.ok(Math.hypot(p.x - m.x, p.z - m.z) > 0.5, 'a mast blocks the path in');
    assert.ok(back.x + 2.2 < 5 - 2.4, 'the path is clear of the signboard');
    for (const other of forest.doors) if (other.id !== back.id && other.wall === 'n') assert.ok(Math.abs(other.x - back.x) >= 4.4, 'the path shares a lane with ' + other.id);
});

test('THE PARK RULE and the woods’ own light: a rail and a real ramp cell in every part, no facility strips or masts, torches under the prop-light cap; the graffiti stands against rock in Dead Man’s Cave', () => {
    for (const id of PART_IDS) {
        const room = HQ.rooms[id], S = room.shell, info = D.hqCaveInfo(id);
        assert.ok(room.props.some(p => p.key === 'railing_1m'), id + ': a rail to grind');
        assert.ok(info.cells.some(r => r.some(c => c.slope)), id + ': a real ramp (a slope cell) to ride');
        assert.ok(S.strips === false && Array.isArray(S.lights) && S.lights.length === 0 && S.mood, id + ': no strips, no masts — the woods light themselves');
        const lit = room.props.filter(p => (HQ.catalogue[p.key] || {}).light).length;
        assert.ok(lit >= 1 && lit <= 10, id + ': ' + lit + ' point lights');
    }
    const dm = HQ.rooms[BOARD + '_deadmans'], info = D.hqCaveInfo(BOARD + '_deadmans');
    const tags = dm.props.filter(p => p.key === 'graffiti_wall');
    assert.ok(tags.length >= 3, 'paint on the rock');
    for (const t of tags) {
        const f = (t.face || 0) * Math.PI / 180, behind = D.hqCaveCellAt(info, t.x - Math.sin(f) * 0.5, t.z + Math.cos(f) * 0.5);
        assert.ok(behind && behind.rock, 'the graffiti at ' + t.x + ',' + t.z + ' stands against rock');
    }
    assert.ok(HQ.catalogue.graffiti_wall && HQ.catalogue.graffiti_wall.proc === 'graffiti_wall' && !HQ.catalogue.graffiti_wall.block, 'the catalogue row: a proc, nothing to bump into');
    assert.ok(/graffiti_wall: function \(U, p\)/.test(renderer), 'the renderer draws it');
});

test('THE WEENIES: one sky for the woods (hqWoodsShell), two landmarks on its horizon — Shasta to the north-north-west, Camelot to the south-south-east — and the renderer’s builders hang them still', () => {
    const LM = vm.runInContext('HQ_WOODS_LANDMARKS', D);
    assert.ok(Array.isArray(LM) && LM.length === 2, 'two landmarks');
    const peak = LM.find(l => l.kind === 'peak'), castle = LM.find(l => l.kind === 'castle');
    assert.ok(peak && peak.id === 'prebuilt_shasta' && peak.deg > 300 && peak.deg < 360, 'the mountain north-north-west');
    assert.ok(castle && castle.id === 'prebuilt_camelot' && castle.deg > 120 && castle.deg < 180, 'the castle south-south-east');
    for (const id of PART_IDS) {
        if (id === SEWER) continue;   // underground: no sky, no weenies
        const sky = HQ.rooms[id].shell.sky;
        assert.ok(sky.landmarks && sky.landmarks.length === 2 && sky.landmarks.every((l, i) => l.kind === LM[i].kind && l.deg === LM[i].deg), id + ': the same two landmarks');
        assert.ok(sky.fog && typeof sky.fog.color === 'number' && sky.scenery && sky.tint != null, id + ': a full sky row');
    }
    assert.notEqual(HQ.rooms[PART_IDS[0]].shell.sky, HQ.rooms[PART_IDS[1]].shell.sky, 'every room owns its sky object (a variant may edit it)');
    for (const k of ['peak', 'castle']) assert.ok(new RegExp('^        ' + k + ': function \\(U, o, rng\\)', 'm').test(renderer), 'a builder for ' + k);
    assert.ok(/function _hqBuildLandmarks\(H, list, discR\)/.test(renderer), 'the placer');
    assert.ok(/if \(Array\.isArray\(sky\.landmarks\) && sky\.landmarks\.length\) \{ try \{ _hqBuildLandmarks\(H, sky\.landmarks, 6000\); \}/.test(renderer), '_hqBuildSky hangs them');
    assert.ok(/var x = Math\.sin\(a\) \* rad, z = -Math\.cos\(a\) \* rad/.test(renderer), 'deg 0 at north, clockwise — the star chart’s rule');
    assert.ok(/H\.sky\.landmarks = group;/.test(renderer) && !/floaters\.push\(\{ obj: m,/.test(renderer.slice(renderer.indexOf('function _hqBuildLandmarks'), renderer.indexOf('function _hqBuildSky'))), 'a landmark never drifts');
});

test('THE TAPES: one per part, the hundred kept, seven re-homed (the garden’s tree and six sites’ second tapes); the renderer plants the trees, hangs no stalactite under an open sky, and the field reads the woods like a cave', () => {
    const T = D.DOOR_TAPES;
    assert.equal(T.length, 100);
    for (const id of PART_IDS) assert.equal(T.filter(t => t.where === id).length, 1, id + ': one tape');
    assert.equal(T.filter(t => t.where === 'garden').length, 0, 'the garden’s tree moved to the clearing');
    for (const site of ['prebuilt_shasta', 'prebuilt_skinwalker', 'prebuilt_fairy_forest', 'prebuilt_bohemian_grove', 'prebuilt_babel', 'prebuilt_downtown']) assert.equal(T.filter(t => t.where === 'site_' + site).length, 1, site + ' gave its second tape');
    assert.ok(T.some(t => t.where === HUB && t.title === '1618'), 'the names are carved in the old tree');
    for (const id of PART_IDS) assert.ok(D.DOOR_HQ.finds.some(f => f.room === id && f.kind === 'tape') && D.DOOR_HQ.finds.some(f => f.room === id && f.kind === 'pay'), id + ': a tape and an envelope');
    /* the renderer */
    const cave = renderer.slice(renderer.indexOf('    function _hqBuildCave('), renderer.indexOf('    function _hqBuildSiteBoard('));
    assert.ok(/if \(c\.tree\) trees\.push/.test(cave) && /TK = _nrKit\(G, \{ ts: CM, bw: W, bh: Hh, rng: rng, hq: \{ w: 0, gap: 0, B: 1, tints: null \} \}, \{\}\)/.test(cave) && /tg\._ew_hqTree = true;/.test(cave), 'a tree cell is planted with the near kit’s foliage on a REAL kit (a bare { ts, rng } threw in the stand-in and no tree was ever planted)');
    assert.ok(/if \(TK && S\.forest && S\.open\)/.test(cave) && /if \(inLane\(px, pz, ro\)\) continue;/.test(cave), 'THE TREELINE: the forest past the grid, the door lanes kept clear');
    assert.ok(/if \(s\.c\.stair && typeof _buildStairMesh === 'function'\)/.test(cave) && /_buildStairMesh\(0, 0, CM, L \* U,/.test(cave), 'a stair cell is the board’s own barrier_passage flight');
    assert.ok(/var nSt = \(S\.open \|\| \(room\.cave && room\.cave\.stalactites === false\)\) \? 0 :/.test(cave), 'no stalactites under an open sky, none in a culvert that says so');
    /* the field: every window from every door landing is legal (the stage-D guarantee, run on the woods alone) */
    for (const id of PART_IDS) {
        const room = HQ.rooms[id];
        assert.ok(D.hqFieldRoomOk(id), id + ': a field room');
        for (const d of room.doors) {
            const c = landingCell(id, d), info = D.hqCaveInfo(id);
            const wp = { x: (c.x + 0.5) * CELL - info.halfW, z: (c.y + 0.5) * CELL - info.halfD };
            const W = D.hqFieldWindow(id, wp, { x: wp.x + CELL, z: wp.z });
            assert.ok(W && W.raster && W.board && W.board.cave, id + '/' + d.id + ': a window');
            assert.equal(W.site, SITE);
        }
    }
});

test('THE STAIRS + THE STORM DRAIN (2026-09-16): the flight is four STAIR cells (the board’s barrier_passage flight in wood, one level each, never terrain blocks) up to the landing the door stands on; Dead Man’s Cave is a NARROW enclosed culvert — a 3-cell corridor in brick with the channel down its middle, the sump halfway, the grate at the far end', () => {
    const info = D.hqCaveInfo(STAIR), room = HQ.rooms[STAIR];
    const flight = [];
    info.cells.forEach(r => r.forEach(c => { if (c.stair) flight.push(c); }));
    assert.equal(flight.length, 4, 'four stair cells');
    flight.sort((a, b) => a.lvl - b.lvl).forEach((c, i) => {
        assert.ok(c.slope === 'n' && c.lvl === i && c.stair === 'wood_planks' && c.stairSide === 'wood' && c.walk, 'riser ' + i + ' climbs north one level in wood');
        assert.ok(Math.abs(D.hqCaveFeet(info, c, (c.x + 0.5) * CELL - info.halfW, (c.y + 0.5) * CELL - info.halfD) - (i + 0.5) * D.HQ_CAVE_LEVEL) < 1e-9, 'the walker stands mid-riser at its middle');
    });
    assert.ok(flight.every(c => c.x === flight[0].x), 'one straight flight');
    assert.ok(!info.cells.some(r => r.some(c => !c.stair && c.key === 'wood_planks' && c.lvl < 4)), 'no plank block below the landing');
    assert.ok(D.hqCaveDoorY(room, at(STAIR, 'link_woods_stair')) > 3, 'the door stands on the landing');
    assert.match(dataSrc, /stair: d\.stair \|\| null, stairSide: d\.stairSide \|\| null/, 'the compiler carries the stair sheet');
    /* the culvert */
    const S = D.hqCaveInfo(SEWER), sewer = HQ.rooms[SEWER];
    let widest = 0, narrow = 0;
    for (let x = 0; x < S.w; x++) { let n = 0; for (let y = 0; y < S.h; y++) if (!S.cells[y][x].rock) n++; widest = Math.max(widest, n); if (n === 3) narrow++; }
    assert.ok(widest <= 5, 'the sump is at most five cells across (' + widest + ')');
    assert.ok(narrow >= S.w / 2, 'the corridor is three cells wide for at least half its length');
    assert.ok(S.cells[6].slice(1, S.w - 1).every(c => c.fluid === 'water' && c.walk), 'the channel runs the length of the culvert, waded');
    assert.ok(S.cells[0].every(c => c.rock) && S.cells[S.h - 1].every(c => c.rock) && S.rock === 'bricks_2', 'brick to the ceiling either side');
    assert.equal(S.rockH, sewer.shell.h, 'the brick reaches the ceiling');
    assert.ok(sewer.props.some(p => (HQ.catalogue[p.key] || {}).ceil && (HQ.catalogue[p.key] || {}).light), 'lit from the ceiling');
    assert.ok(!sewer.props.some(p => p.key === 'cave_torch'), 'no torch in a drain');
    const grate = HQ.links.find(l => l.id === 'woods_sewer');
    assert.equal(grate.a.z, 0, 'the grate at the culvert’s east end, on the channel’s row');
});
