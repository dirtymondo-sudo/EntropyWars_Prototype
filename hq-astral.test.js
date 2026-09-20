// hq-astral.test.js — THE ASTRAL REALM (2026-09-19 — THE COMPLEX CANDIDATES #10, the
// user: "Let's add another complex explorable area. The Astral Realm. It can connect the
// Dream Research, the Looking Glass, the Haunted House, etc. Make it the realm of all
// possibilities. The home of thought-forms. Where ideas exist before they are thought by
// human minds. Creativity is instantaneous in this realm, just like how your dreams are.
// But that means nightmares as well. Bizarre and nightmare fuel mixed with the beautiful
// and fantastical."): four parts on the Looking-Glass's site on THE CAVE / THE WOODS
// blueprint — THE WAITING ROOM (family B: chairs that face the wall, three clocks, NOW
// SERVING), THE SEA OF POSSIBILITY (family A': a `rooms` plan, the stream, the pool, the
// mirror lake, three floating thoughts up floating stairs, THE SPIRE = the tape, the hub),
// THE NIGHTMARE (family A: a `cave` plan in the flesh sheets, the maw and its fangs, the
// bed, the stage, the blood, THE SPINE = the tape) and THE LIBRARY OF UNTHOUGHT THINGS
// (family C': a `ley` plan whose stacks light themselves, THE TOP SHELF = the tape). Three
// SCREENS join it to the building (Room REM's dream screen, the D.U.M.B. ward's, the
// attic's home movies — route `astral`, a `screen` way at every end); the garden's second
// frame with nothing in it is a door PAIR (the same site). Four new procs and one landmark
// in the renderer (the thought-form, the eye that looks at you, the impossible stair, the
// bloom with teeth; THE WATCHER on the horizon).
// Guards: the sheet, THE SOLVER + THE RETURN GUARANTEE + the production landing, the pair
// + the seams + the route + the hub + the tapes + the hard tapes, THE PARK RULE + the
// lights + the families' features, the renderer's procs and landmark (source + a real
// build on a stub scene), check-terrain on all three fields.
'use strict';
const test = require('node:test');
const { heavy } = require('./test-heavy.js');   // 2026-09-18: the heavy geometry proofs run on `npm run test:full` / in CI
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');
const { loadGameData } = require('./load-data');
const D = loadGameData(), HQ = D.DOOR_HQ;
const SITE = 'prebuilt_lookingglass';
const WAITING = 'site_prebuilt_lookingglass_waiting', SEA = 'site_prebuilt_lookingglass_sea', NIGHTMARE = 'site_prebuilt_lookingglass_nightmare', LIBRARY = 'site_prebuilt_lookingglass_library', GARDEN = 'site_prebuilt_lookingglass_garden';
const IDS = [WAITING, SEA, NIGHTMARE, LIBRARY], FIELDS = [SEA, NIGHTMARE, LIBRARY];
const renderer = fs.readFileSync(__dirname + '/three-renderer.js', 'utf8');
const data = fs.readFileSync(__dirname + '/data.js', 'utf8');
const at = (room, id) => (HQ.rooms[room].doors || []).find(d => d.id === id);
const L = (id) => HQ.links.find(l => l.id === id);
const key = (info, x, z) => D.hqTerrainNodeKey(info, x, z);
const BLOCK = renderer.slice(renderer.indexOf('    /* ══ THE ASTRAL REALM — THE THOUGHT-FORMS'), renderer.indexOf('    /* ── per-frame ───'));

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
    const px = p.wall === 'w' ? -S.w / 2 : p.wall === 'e' ? S.w / 2 : (p.x || 0), pz = p.wall === 'n' ? -S.d / 2 : p.wall === 's' ? S.d / 2 : (p.z || 0);
    const rect = (p.rect === false) ? null : (p.rect || cat.rect);
    if (rect && !p.wall) return Math.abs(x - px) <= rect.hw + margin && Math.abs(z - pz) <= rect.hd + margin;
    const foot = (p.foot != null) ? p.foot : (cat.foot || 0);
    if (!(foot > 0) && !cat.block) return false;
    return Math.hypot(x - px, z - pz) <= Math.max(foot, 0.3) + margin;
}

test('the sheet: four parts on the Looking-Glass\'s site — site + part, no number, every plate THE ASTRAL REALM · <place>; the waiting room a prefab box (family B), the sea OPEN under its own violet night (the islands roster, THE WATCHER and the stair on its horizon) on a `rooms` plan with no thicket, the nightmare CLOSED on a `cave` plan in the flesh sheets, the library CLOSED on a `ley` plan whose walls are wood; a look each; the register lists the site once; the complex is five rooms', () => {
    for (const id of IDS) {
        const r = HQ.rooms[id];
        assert.ok(r && r.kind === 'box' && r.site === SITE && r.part, id + ': a box room wearing site + part');
        assert.equal(D.hqComplexRoomId(SITE, r.part), id);
        assert.equal(r.roomNo, undefined, id + ' wears no number');
        assert.equal(D.hqRoomNo(id), HQ.thresholds[SITE].roomNo, id + ': hqRoomNo reads E4 through site');
        assert.equal(D.hqRoomSite(id), SITE, id + ' is WILD');
        assert.match(r.label, /^THE ASTRAL REALM · /, id + ': ' + r.label);
        assert.ok(r.sub && r.spawn && Array.isArray(r.lines) && r.lines.length >= 3, id + ': plate, spawn, lines');
        assert.ok(r.shell.look && r.shell.look.name && r.shell.strips === false && Array.isArray(r.shell.lights) && r.shell.lights.length === 0, id + ': a look, no strips, no masts');
        assert.ok(!r.doors.some(d => (HQ.catalogue[d.leaf] || {}).rank), id + ': no rank leaf');
        assert.ok(r.npcSpots.length >= 2 && r.npcSpots.every(s => s.race && s.say), id + ': natives with lines');
    }
    assert.ok(!HQ.rooms[WAITING].terrain && !HQ.rooms[WAITING].cave, 'the waiting room is a prefab (family B)');
    for (const id of FIELDS) assert.ok(HQ.rooms[id].terrain && !HQ.rooms[id].cave && D.hqTerrainInfo(id), id + ': a terrain room');
    const sea = HQ.rooms[SEA].shell, nm = HQ.rooms[NIGHTMARE].shell, lib = HQ.rooms[LIBRARY].shell;
    assert.ok(sea.open && sea.edge === 'open' && sea.sky && sea.sky.night === 1 && sea.sky.scenery === 'islands' && sea.sky.stars >= 1 && sea.sky.nebula >= 1 && sea.sky.fog.density > 0, 'the sea: open under a violet night, the islands drifting past');
    assert.ok(sea.sky.landmarks.some(l => l.kind === 'eye' && l.label === 'THE WATCHER') && sea.sky.landmarks.some(l => l.kind === 'stairway'), 'THE WATCHER and the stair on the horizon');
    assert.equal(HQ.rooms[SEA].terrain.gen.kind, 'rooms'); assert.equal(HQ.rooms[SEA].terrain.gen.thicket, false);
    assert.ok(!nm.open && nm.fog && nm.fog.density > 0.03 && nm.mood.ambient < 0.3 && /^flesh/.test(nm.floor) && /^flesh/.test(nm.wall), 'the nightmare: closed, its own red-black haze, the dimmest mood, the flesh sheets');
    assert.equal(HQ.rooms[NIGHTMARE].terrain.gen.kind, 'cave');
    assert.ok(!lib.open && lib.fog && lib.fog.density > 0 && lib.wall === 'wood', 'the library: closed, an amber haze, wood');
    assert.equal(HQ.rooms[LIBRARY].terrain.gen.kind, 'ley'); assert.equal(HQ.rooms[LIBRARY].terrain.gen.wallKey, 'wood');
    assert.equal(sea.look, D.HQ_ROOM_LOOKS.astral); assert.equal(nm.look, D.HQ_ROOM_LOOKS.nightmare); assert.equal(lib.look, D.HQ_ROOM_LOOKS.unthought); assert.equal(HQ.rooms[WAITING].shell.look, D.HQ_ROOM_LOOKS.waiting);
    assert.ok(D.HQ_ROOM_LOOKS.nightmare.cin.vigAmount > D.HQ_ROOM_LOOKS.astral.cin.vigAmount && D.HQ_ROOM_LOOKS.nightmare.retro.ditherStrength > D.HQ_ROOM_LOOKS.astral.retro.ditherStrength, 'the nightmare is the harder grade');
    const reg = D.hqRoomRegister();
    assert.equal(reg.filter(r => r.mapId === SITE).length, 1);
    assert.ok(!reg.some(r => IDS.includes(r.id) || IDS.includes(r.room)), 'no part is a register entry');
    assert.equal(D.hqSiteComplex(SITE).length, 6, 'the board room, the garden and the four parts');
});

test('THE SOLVER + THE RETURN GUARANTEE + THE PRODUCTION LANDING: in every field every door reaches every other under the walker\'s rule, nothing traps, every sill is its pad\'s, every landing (the box room\'s too) is inside and clear of every prop and native; check-terrain agrees on all three', heavy, () => {
    for (const id of FIELDS) {
        const room = HQ.rooms[id], info = D.hqTerrainInfo(id);
        const Ls = room.doors.map(d => Object.assign({ d }, D.hqTerrainDoorLanding(room, d)));
        assert.ok(Ls.length >= 2, id + ': two ways at least');
        const R0 = D.hqTerrainReach(info, Ls[0].x, Ls[0].z);
        for (const b of Ls) assert.ok(R0.has(key(info, b.x, b.z)), id + ': ' + Ls[0].d.id + ' → ' + b.d.id + ' unreachable');
        assert.equal(D.hqTerrainTraps(info).length, 0, id + ': a trap');
        for (const a of Ls) {
            assert.equal(a.y, D.hqTerrainDoorY(room, a.d), id + '/' + a.d.id + ': the sill is the pad');
            const h = landing(room, a.d), p = h.player;
            assert.ok(Math.abs(p.x) < room.shell.w / 2 - 0.4 && Math.abs(p.z) < room.shell.d / 2 - 0.4, id + '/' + a.d.id + ': inside');
            assert.ok(D.hqTerrainFeet(info, p.x, p.z, null) != null, id + '/' + a.d.id + ': the landing is walkable');
            for (const q of [...(room.props || []), ...(room.npcSpots || [])]) assert.ok(!propBlocks(room, q, p.x, p.z, 0.35), id + '/' + a.d.id + ': ' + (q.key || q.race) + ' blocks the landing');
        }
    }
    /* the prefab: every door lands clear */
    const w = HQ.rooms[WAITING];
    for (const d of w.doors) {
        const h = landing(w, d), p = h.player;
        assert.ok(Math.abs(p.x) < w.shell.w / 2 - 0.4 && Math.abs(p.z) < w.shell.d / 2 - 0.4, WAITING + '/' + d.id + ': inside');
        for (const q of [...w.props, ...w.npcSpots]) assert.ok(!propBlocks(w, q, p.x, p.z, 0.35), WAITING + '/' + d.id + ': ' + (q.key || q.race) + ' blocks the landing');
    }
    const out = JSON.parse(execFileSync(process.execPath, ['check-terrain.js', '--json', ...FIELDS], { cwd: __dirname, encoding: 'utf8', maxBuffer: 1 << 26 }));
    for (const r of out) { assert.equal(r.unreached.length, 0, r.id + ': ' + r.unreached.join(',')); assert.equal(r.traps.length, 0, r.id + ' traps'); }
    assert.equal(out.find(r => r.id === SEA).plan.kind, 'rooms'); assert.equal(out.find(r => r.id === NIGHTMARE).plan.kind, 'cave'); assert.equal(out.find(r => r.id === LIBRARY).plan.kind, 'ley');
    assert.equal(out.find(r => r.id === LIBRARY).plan.deadEnds, 0, 'a niche is the design');
});

test('THE PAIR + THE SEAMS + THE ROUTE + THE HUB: the garden\'s second frame with nothing in it is a door PAIR into the waiting room (the same site — never a link); three screens on the astral line — Room REM\'s (a facility end, never gated) into the waiting room, the D.U.M.B. ward\'s into the library, the attic\'s home movies into the nightmare — every one a `screen` at BOTH ends, live, drafted; the closet with no back wall joins the sea and the nightmare from both sides; the four parts are one hub anchored on the sea; the map walks every part from the foyer', () => {
    const g = at(GARDEN, 'astral'), back = at(WAITING, 'garden');
    assert.ok(g && g.leaf === 'leaf_frame_only' && g.action.room === WAITING && g.action.at === 'garden' && !g.link, 'the garden\'s frame');
    assert.ok(back && back.leaf === 'leaf_frame_only' && back.action.room === GARDEN && back.action.at === 'astral', 'the pair comes back');
    assert.ok(!HQ.links.some(l => [l.a, l.b].every(e => e.site === SITE)), 'never a link inside one site');
    const SEAMS = { rem_astral: ['dreamlab', WAITING], dumb_astral: ['site_prebuilt_dumb_dreamlab', LIBRARY], attic_nightmare: ['site_prebuilt_haunted_attic', NIGHTMARE] };
    for (const [id, [ra, rb]] of Object.entries(SEAMS)) {
        const l = L(id); assert.ok(l && l.route === 'astral' && l.way === 'screen' && l.why && l.note && l.draft === true, id + ': a screen on the astral line, drafted');
        const live = D.hqLinkLive(l); assert.ok(live && live.a === ra && live.b === rb, id + ' is live between ' + ra + ' and ' + rb);
        const da = HQ.rooms[ra].doors.find(d => d.link === id), db = HQ.rooms[rb].doors.find(d => d.link === id);
        assert.ok(da && db && da.way === 'screen' && db.way === 'screen' && da.leaf === null && db.leaf === null, id + ': a screen at both ends');
        assert.ok(da.action.room === rb && da.action.at === db.id && db.action.room === ra && db.action.at === da.id, id + ': the ends come back to each other');
        assert.ok(!da.minClearance && !db.minClearance && !da.requiresKeys, id + ': never gated');
        for (const [room, door] of [[HQ.rooms[ra], da], [HQ.rooms[rb], db]]) {
            const h = landing(room, door), p = h.player, S = room.shell;
            assert.ok(Math.abs(p.x) < S.w / 2 - 0.4 && Math.abs(p.z) < S.d / 2 - 0.4, id + '/' + door.id + ': inside');
            for (const q of [...(room.props || []), ...(room.npcSpots || []), ...(room.agents || [])]) assert.ok(!propBlocks(room, q, p.x, p.z, 0.35), id + ' in ' + room.label + ': ' + (q.key || q.race || 'person') + ' blocks the landing');
            for (const c of room.counters || []) if (c.x != null) assert.ok(Math.hypot(p.x - c.x, p.z - c.z) > 0.9, id + ': the counter ' + c.id + ' stands on the landing');
            const wall = door.wall, half = (wall === 'n' || wall === 's') ? S.w / 2 : S.d / 2, along = door[(wall === 'n' || wall === 's') ? 'x' : 'z'];
            assert.ok(half - Math.abs(along) >= HQ.ways.screen.w / 2 + 0.3, id + ' in ' + room.label + ': the screen fits the wall');
            for (const o of room.doors) if (o.id !== door.id && o.wall === wall) assert.ok(Math.abs((o[(wall === 'n' || wall === 's') ? 'x' : 'z'] || 0) - along) > 2.2, id + ': crowds ' + o.id);
        }
    }
    assert.ok(!HQ.rooms.dreamlab.roomNo === false || HQ.rooms.dreamlab.roomNo === 'REM', 'Room REM is the facility end');
    assert.ok(HQ.rooms['site_prebuilt_haunted_attic'].shell.h >= 2.4 && HQ.rooms['site_prebuilt_haunted_attic'].props.some(p => p.key === 'picture_round_a' && p.wall === 'w' && Math.abs(p.z - 0.2) > 1.0), 'the attic\'s picture still faces the wall, clear of the screen');
    const closetA = at(SEA, 'nightmare'), closetB = at(NIGHTMARE, 'sea');
    assert.ok(closetA && closetB && closetA.way === 'closet' && closetB.way === 'closet' && closetA.leaf === null && closetB.leaf === null && closetA.action.room === NIGHTMARE && closetA.action.at === 'sea' && closetB.action.room === SEA && closetB.action.at === 'nightmare', 'the closet with no back wall, both sides');
    assert.ok(at(SEA, 'library').action.room === LIBRARY && at(LIBRARY, 'sea').action.room === SEA && at(SEA, 'waiting').action.room === WAITING && at(WAITING, 'sea').action.room === SEA, 'the frames pair up');
    const R = HQ.routes.astral; assert.ok(R && R.label && R.sub && R.color && R.dashed === true, 'THE ASTRAL PLANE is a dashed line');
    const line = D.hqWorldRoutes('foyer').find(r => r.id === 'astral');
    assert.ok(line && line.legs.length === 3 && line.stations.some(s => s.site === SITE) && line.stations.some(s => s.site === 'prebuilt_dumb') && line.stations.some(s => s.site === 'prebuilt_haunted') && line.stations.some(s => s.room === 'dreamlab'), 'three legs: E4, 555, 13 and REM');
    const H = HQ.hubs.astral;
    assert.ok(H && H.room === SEA && H.rooms.length === 4 && IDS.every(id => H.rooms.includes(id)) && !H.sites, 'THE ASTRAL REALM claims its four parts BY ID, anchored on the sea');
    for (const id of IDS) assert.equal((D.hqHubOf(id) || {}).id, 'astral', id + ' belongs to the hub');
    assert.notEqual((D.hqHubOf(GARDEN) || {}).id, 'astral', 'the garden is the Looking-Glass\'s, not the realm\'s');
    const G = D.hqMapGraph(); for (const id of IDS) assert.ok(G.nodes[id], id + ' is on the map');
    assert.equal(G.nodes[SEA].hub, 'astral'); assert.equal(G.nodes[NIGHTMARE].hubOf, 'astral');
});

test('THE TAPES + THE HARD TAPES: one tape per part (four re-homed — the hundred stays a hundred; the wards that gave one keep their board\'s own); THE SPIRE OF THE UNTHOUGHT (7.5 m), THE SPINE (4.6 m) and THE TOP SHELF (3.4 m under a 4.6 m ceiling) are pinned, hard, never walked to, with a door-gun shot from a reachable node; every envelope is guarded', heavy, () => {
    const T = D.DOOR_TAPES, F = HQ.finds;
    assert.equal(T.length, 100);
    for (const id of IDS) assert.equal(T.filter(t => t.where === id).length, 1, id + ': one tape');
    assert.equal(T.find(t => t.where === WAITING).title, 'NOW SERVING'); assert.equal(T.find(t => t.where === SEA).title, 'THE SPIRE'); assert.match(T.find(t => t.where === NIGHTMARE).title, /NIGHT TERROR/); assert.equal(T.find(t => t.where === LIBRARY).title, 'THE CARD CATALOGUE');
    for (const id of ['site_prebuilt_camelot_ward', 'site_prebuilt_hell_pit', 'site_prebuilt_cern_ring', 'site_prebuilt_vatican_basilica']) assert.equal(T.filter(t => t.where === id).length, 1, id + ' gave its second tape to the realm');
    assert.equal(T.filter(t => t.where === GARDEN).length, 1, 'the garden keeps THE TEA PARTY');
    const pins = { [SEA]: [20, -35, 7.5], [NIGHTMARE]: [32, -22, 4.6], [LIBRARY]: [-40, -20, 3.4] };
    for (const [id, [x, z, h]] of Object.entries(pins)) {
        const f = F.find(f => f.room === id && f.kind === 'tape'); assert.ok(f, id + ': the find');
        assert.ok(Math.abs(f.x - x) < 0.01 && Math.abs(f.z - z) < 0.01 && Math.abs(f.y - h) < 0.05 && f.hard === true, id + ': pinned on the weenie at ' + h + ' m, hard (' + f.x + ',' + f.z + ',' + f.y + ',' + f.hard + ')');
        const info = D.hqTerrainInfo(id), L0 = D.hqTerrainDoorLanding(HQ.rooms[id], HQ.rooms[id].doors[0]);
        assert.ok(!D.hqTerrainReach(info, L0.x, L0.z).has(key(info, f.x, f.z)), id + ': the walker never reaches it');
        assert.ok(D.hqFindHardReachTerrain(f, D.hqFindRoomInfo(id)).ok, id + ': the door gun has a shot');
        assert.ok(HQ.rooms[id].terrain.features.some(q => q.k === 'plateau' && Math.abs(q.x - x) < 0.01 && Math.abs(q.z - z) < 0.01 && q.h === h), id + ': the weenie is a tier');
        assert.ok(h < HQ.rooms[id].shell.h - 0.5, id + ': the tape stands under the ceiling');
    }
    const wt = F.find(f => f.room === WAITING && f.kind === 'tape'); assert.ok(wt && !wt.hard, 'the waiting room\'s tape is on the floor');
    for (const id of IDS) { const pay = F.find(f => f.room === id && f.kind === 'pay'); assert.ok(pay && pay.guard === true, id + ': a guarded envelope'); }
});

test('THE PARK RULE + THE LIGHT + THE FAMILIES: every field has a tier or a ramp AND a rail, every stair obeys L ≥ 2.2 h and every floating flight ends inside its floating tier; the sea wades its stream and its pool, never enters the mirror lake, and floats three thoughts; the nightmare\'s maw is ringed with fangs the walker never climbs, its blood is lava the walker never enters, its bed lies at the bottom; the library\'s stacks are traced walls in wood with a gallery up a stair; every room lights itself under the cap and the prefab wears the park rule and a bulb', heavy, () => {
    const R = D.HQ_TERRAIN_RULES || vm.runInContext('HQ_TERRAIN_RULES', D);
    for (const id of FIELDS) {
        const room = HQ.rooms[id], info = D.hqTerrainInfo(id), F = room.terrain.features;
        assert.ok(F.some(f => f.k === 'plateau' || f.k === 'ramp'), id + ': a tier or a ramp');
        assert.ok(info.rails.length >= 1, id + ': a rail');
        for (const f of F.filter(f => f.k === 'ramp' && f.stairs)) { const Lr = Math.hypot(f.x1 - f.x0, f.z1 - f.z0), rise = Math.abs(f.h1 - f.h0); assert.ok(Lr >= 2.2 * rise - 0.01, id + ': a stair ' + Lr.toFixed(1) + ' m for ' + rise + ' (L ≥ 2.2 h)'); }
        const lights = (room.props || []).filter(p => (HQ.catalogue[p.key] || {}).light).length;
        assert.ok(lights >= 2 && lights <= 10, id + ': ' + lights + ' lights (the room lights itself, under the cap)');
        for (const p of room.props || []) assert.ok(HQ.catalogue[p.key], id + ': ' + p.key + ' is catalogued');
        for (const s of F.filter(f => f.k === 'scatter')) assert.ok(HQ.catalogue[s.key], id + ': scatter ' + s.key + ' is catalogued');
    }
    /* the sea */
    const si = D.hqTerrainInfo(SEA), seaF = HQ.rooms[SEA].terrain.features;
    const floats = seaF.filter(f => f.k === 'plateau' && f.float), flights = seaF.filter(f => f.k === 'ramp' && f.float);
    assert.equal(floats.length, 3); assert.equal(flights.length, 3);
    assert.deepEqual(floats.map(f => f.h).join(','), '3,6,9');
    for (const f of flights) { const top = floats.find(p => p.h === f.h1); assert.ok(top && Math.hypot(f.x1 - top.x, f.z1 - top.z) <= top.r - 0.7 + 1e-9, 'flight to ' + f.h1 + ' ends 0.7 m inside its tier'); }
    const stream = seaF.find(f => f.k === 'stream'), pool = seaF.find(f => f.k === 'pool' && f.key === 'water'), lake = seaF.find(f => f.k === 'pool' && f.key === 'deep_water');
    assert.ok(stream && stream.depth <= R.wadeMax && pool && pool.depth <= R.wadeMax && lake && lake.depth > R.wadeMax, 'the stream and the pool are waded, the lake never');
    assert.ok(D.hqTerrainFeet(si, pool.x, pool.z, null) != null && D.hqTerrainFluidAt(si, pool.x, pool.z), 'the pool of ideas is up to your knees');
    assert.equal(D.hqTerrainFeet(si, lake.x, lake.z, null), null, 'the mirror lake refuses the walker');
    const top9 = floats.find(f => f.h === 9);
    assert.equal(D.hqTerrainFeet(si, top9.x, top9.z, 9), 9, 'the high thought is walked on');
    assert.ok(D.hqTerrainFeet(si, top9.x + top9.r + 0.2, top9.z, 0) < 1, 'beside it the walker stands on the ground — the field is cut away under a floating tier (the stairs are the only way up)');
    assert.ok(HQ.rooms[SEA].props.some(p => p.key === 'telescope' && p.y === 9) && HQ.rooms[SEA].props.some(p => p.key === 'impossible_stair') && HQ.rooms[SEA].props.some(p => p.key === 'carousel') && HQ.rooms[SEA].props.filter(p => p.key === 'dream_eye').length >= 2 && HQ.rooms[SEA].props.some(p => p.key === 'fish_school' && p.y > 1), 'the telescope on the high thought; the stair, the carousel, the eyes, the fish in the air');
    assert.equal(HQ.rooms[SEA].props.filter(p => p.key === 'quarter_pipe').length, 2, 'two pipes face each other');
    /* the nightmare */
    const ni = D.hqTerrainInfo(NIGHTMARE), nF = HQ.rooms[NIGHTMARE].terrain.features;
    const maw = nF.find(f => f.k === 'dip' && f.open), fangs = nF.filter(f => f.k === 'plateau' && f.r === 0.9 && f.h === 2.8);
    assert.ok(maw && maw.h >= 2 && fangs.length === 7, 'the maw and its fangs');
    const nL0 = D.hqTerrainDoorLanding(HQ.rooms[NIGHTMARE], HQ.rooms[NIGHTMARE].doors[0]), nReach = D.hqTerrainReach(ni, nL0.x, nL0.z);
    for (const f of fangs) { assert.ok(!nReach.has(key(ni, f.x, f.z)), 'a fang is never climbed'); assert.ok(Math.abs(Math.hypot(f.x - maw.x, f.z - maw.z) - 13) < 0.5, 'a fang on the rim'); }
    assert.ok(D.hqTerrainHeight(ni, 0, 0) < -1.8 && D.hqTerrainFeet(ni, 0, 0, null) != null, 'the bed lies at the bottom of the maw, walked to');
    const blood = nF.find(f => f.k === 'pool'); assert.ok(blood && blood.key === 'lava' && D.hqTerrainFeet(ni, blood.x, blood.z, null) === null, 'the blood is lava, never entered');
    assert.ok(HQ.rooms[NIGHTMARE].props.some(p => p.key === 'cot' && p.x === 0 && p.z === 0) && HQ.rooms[NIGHTMARE].props.filter(p => p.key === 'iso_tank').length === 3 && HQ.rooms[NIGHTMARE].props.some(p => p.key === 'demon_statue') && HQ.rooms[NIGHTMARE].props.filter(p => p.key === 'bare_bulb' && p.ceil).length >= 1, 'the bed, the tanks, the thing beside the spine, the bulb');
    assert.ok(HQ.rooms[NIGHTMARE].npcSpots.some(s => s.y === 1.6) && nF.some(f => f.k === 'plateau' && f.w === 14 && f.h === 1.6), 'the dreameater on the stage');
    /* the library */
    const li = D.hqTerrainInfo(LIBRARY), lF = HQ.rooms[LIBRARY].terrain.features;
    assert.ok(li.planWalls.length >= 40 && li.planWalls.every(w => w.key === 'wood') && li.genPlan.lines.length === 3 && li.genPlan.forks.length >= 6, 'the stacks are traced walls in wood; three lines; the forks');
    const gallery = lF.find(f => f.k === 'plateau' && f.w === 12), stair = lF.find(f => f.k === 'ramp' && f.stairs);
    assert.ok(gallery && stair && stair.h1 === gallery.h && D.hqTerrainFeet(li, gallery.x, gallery.z, 2) === 2, 'the gallery up its stair');
    assert.ok(HQ.rooms[LIBRARY].props.filter(p => p.key === 'lectern').length === 3 && HQ.rooms[LIBRARY].props.some(p => p.key === 'conference_table') && HQ.rooms[LIBRARY].props.some(p => p.key === 'dream_eye' && p.y === 2.0), 'three lecterns, the long table, the reader on the gallery');
    /* the prefab */
    const w = HQ.rooms[WAITING];
    assert.ok(w.props.some(p => p.key === 'railing_1m') && w.props.some(p => /^riser_/.test(p.key)), 'the queue rail and the step');
    assert.ok(w.props.some(p => p.key === 'bare_bulb' && p.ceil) && w.props.filter(p => p.key === 'wall_clock').length === 3 && w.props.some(p => p.key === 'now_serving') && w.props.filter(p => p.key === 'teal_chair').length >= 6 && w.props.filter(p => p.key === 'teal_chair').every(p => p.face === 270), 'the bulb, three clocks, NOW SERVING, the chairs facing the wall');
    for (const p of w.props) { const c = HQ.catalogue[p.key]; assert.ok(c, WAITING + ': ' + p.key + ' is catalogued'); if (!p.wall && !p.ceil && !c.ceil) assert.ok(Math.abs(p.x) < w.shell.w / 2 && Math.abs(p.z) < w.shell.d / 2, WAITING + ': ' + p.key + ' inside'); }
});

test('THE RENDERER: four procs (the thought-form breathes on a ticker, the eye tracks _hq.player and blinks, the impossible stair turns on its cloud, the bloom\'s teeth open and close) and THE WATCHER landmark, in one block before the per-frame section; every catalogue row is a proc with one size; the eye helper is shared; a real build on a stub scene returns a group for each', () => {
    assert.ok(BLOCK.length > 2000, 'the block');
    for (const k of ['thoughtform', 'dream_eye', 'impossible_stair', 'nightmare_bloom']) {
        const c = HQ.catalogue[k]; assert.ok(c && c.proc === k, k + ': catalogued as a proc');
        assert.equal(['h', 'span'].filter(s => typeof c[s] === 'number').length, 1, k + ': one size');
        assert.ok(new RegExp('^        ' + k + ': function \\(U\\)', 'm').test(BLOCK), k + ': a proc builder in THE ASTRAL REALM block');
    }
    assert.ok(HQ.catalogue.thoughtform.light && HQ.catalogue.nightmare_bloom.light && HQ.catalogue.dream_eye.glow && HQ.catalogue.impossible_stair.rect, 'the thought-form and the bloom are lights; the eye glows; the stair blocks a rect');
    assert.ok(/^        eye: function \(U, o, rng\)/m.test(BLOCK), 'the eye landmark');
    assert.ok(BLOCK.includes('function _hqAstralEye(R, tint, lidColor)') && (BLOCK.match(/_hqAstralEye\(/g) || []).length >= 3, 'one eye helper, used by the prop and the landmark');
    assert.ok(BLOCK.includes('eye.track(pl.x * U, (pl.y + 1.5) * U, pl.z * U') && BLOCK.includes('eye.blink('), 'the eye looks at the walker and blinks');
    assert.ok(BLOCK.includes('pos.needsUpdate = true; geo.computeVertexNormals();'), 'the thought-form deforms its own vertices');
    assert.ok((BLOCK.match(/_hq\.tickers\.push/g) || []).length >= 5, 'every one moves');
    assert.ok(!/\bstate\./.test(BLOCK) && !/_emit\(/.test(BLOCK), 'nothing on the match, nothing relayed (RULE #2)');
    /* a real build on a stub scene */
    const stub = {
        THREE: {
            Group: class { constructor() { this.children = []; this.position = V(); this.rotation = V(); this.scale = V(1); this.quaternion = { copy() {} }; this.parent = null; } add(o) { this.children.push(o); o.parent = this; return this; } localToWorld(v) { return v; } worldToLocal(v) { return v; } },
            Mesh: class { constructor(g, m) { this.geometry = g; this.material = m; this.position = V(); this.rotation = V(); this.scale = V(1); this.children = []; this.quaternion = { copy() {} }; } add(o) { this.children.push(o); o.parent = this; return this; } lookAt() {} },
            SphereGeometry: class { constructor(r, w, h) { const n = ((w || 8) + 1) * ((h || 6) + 1); this.attributes = { position: { array: new Float32Array(n * 3), count: n, setXYZ() {}, needsUpdate: false } }; } computeVertexNormals() {} },
            CircleGeometry: class {}, CylinderGeometry: class {}, TorusGeometry: class {}, ConeGeometry: class {}, BoxGeometry: class {},
            MeshPhongMaterial: class { constructor(o) { Object.assign(this, o || {}); } }, MeshBasicMaterial: class { constructor(o) { Object.assign(this, o || {}); } },
            Vector3: class { constructor(x, y, z) { this.x = x || 0; this.y = y || 0; this.z = z || 0; } set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; } copy(v) { this.x = v.x; this.y = v.y; this.z = v.z; return this; } sub(v) { this.x -= v.x; this.y -= v.y; this.z -= v.z; return this; } add(v) { this.x += v.x; this.y += v.y; this.z += v.z; return this; } normalize() { return this; } lerp() { return this; } clone() { return new this.constructor(this.x, this.y, this.z); } applyQuaternion() { return this; } },
            DoubleSide: 2, BackSide: 1, AdditiveBlending: 2,
        },
        _hqProcBuilders: {}, _hqLandmarkBuilders: {}, _hqProcSeed: 0, _hq: { tickers: [], player: { x: 0, y: 0, z: 0 } },
        _hqMat: (n, a, b, o) => Object.assign({ n }, o || {}), _hqBasic: (c, o) => Object.assign({ color: c }, o || {}),
        _hqBox: (w, h, d, m) => new (stub.THREE.Mesh)({}, m), _hzGlowSprite: () => ({ position: V(), material: { opacity: 0.2 } }),
        Math, Float32Array, Object, console, performance: { now: () => 0 },
    };
    function V(v) { return { x: v || 0, y: v || 0, z: v || 0, set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; }, setScalar(s) { this.x = this.y = this.z = s; return this; } }; }
    vm.createContext(stub); vm.runInContext(BLOCK, stub);
    for (const k of ['thoughtform', 'dream_eye', 'impossible_stair', 'nightmare_bloom']) { const g = stub._hqProcBuilders[k](73); assert.ok(g && g.children.length >= 2, k + ' builds'); }
    const eye = stub._hqLandmarkBuilders.eye(73, { s: 1 }, () => 0.5); assert.ok(eye && eye.children.length >= 3, 'the watcher builds');
    assert.equal(stub._hq.tickers.length, 5, 'five tickers');
    for (const t of stub._hq.tickers) t(0.016, 1000);   // every ticker runs once on the stub (the eye tracks the walker at the origin)
    /* the sky hangs the landmark; the ways the seams wear exist */
    assert.ok(/if \(Array\.isArray\(sky\.landmarks\) && sky\.landmarks\.length\) \{ try \{ _hqBuildLandmarks\(H, sky\.landmarks, 6000\); \}/.test(renderer), '_hqBuildSky hangs the watcher');
    assert.ok(/^        screen: function \(U, ctx\)/m.test(renderer) && /^        closet: function \(U, ctx\)/m.test(renderer), 'the screen and the closet builders');
    /* data.js: the shells, the looks, the spec doors, the pins */
    for (const s of ['function hqAstralShell(o)', 'function hqNightmareShell(o)', 'function hqUnthoughtShell(o)', "astral:     { name: 'THE SEA OF POSSIBILITY'", "nightmare:  { name: 'THE NIGHTMARE'", "site_prebuilt_lookingglass_sea: { tape: { x: 20, z: -35 } }", "action: { room: 'site_prebuilt_lookingglass_waiting', at: 'garden' }"]) assert.ok(data.includes(s), 'data.js: ' + s);
    assert.ok(/\?v=\d{8}[a-z0-9-]*-cors/.test(fs.readFileSync(__dirname + '/index.html', 'utf8')), 'a live token (RULE #1b — never pin the current token: every delivery bumps it)');
});
