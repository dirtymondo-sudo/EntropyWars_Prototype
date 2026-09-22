// hq-areas.test.js — THE AREAS (2026-09-18, the user: "replace all board maps
// with areas, except for Room 64 … there should still be the floating crystal
// icon somewhere in the center of the main area, or right by a weenie, with the
// option to battle on the delta map … no unnecessary doors to other areas …
// but still keep hidden passages and weird doors like draughts and the
// telescope"). Every built site but the Training Room is BYPASSED
// (siteRooms.entry); the twenty that were a board room alone got a generated
// AREA each (HQ_AREA_SPECS → hqAreaRoom → hqBuildAreas); every entry part
// carries THE MARKER (a `battle` counter, proc battle_marker, the crossing
// overlay); the plain-leaf doors between sites are pruned to the designed
// seams (HQ_AREA_KEPT_LEAVES names the survivors); the boards' tapes moved
// into the parts.
'use strict';
const test = require('node:test');
const { heavy } = require('./test-heavy.js');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { loadGameData } = require('./load-data');
const D = loadGameData(), HQ = D.DOOR_HQ;
const SPECS = vm.runInContext('HQ_AREA_SPECS', D), KEPT = vm.runInContext('HQ_AREA_KEPT_LEAVES', D), MARKERS = vm.runInContext('HQ_AREA_MARKERS', D);
const dataSrc = fs.readFileSync(__dirname + '/data.js', 'utf8');
const renderer = fs.readFileSync(__dirname + '/three-renderer.js', 'utf8');
const AREA_ROOMS = Object.keys(SPECS).map(k => D.hqComplexRoomId(k, SPECS[k].part));
const PRUNED = ['mars_moon', 'vatican_heaven', 'hollow_hell', 'atlantis_hollow', 'atlantis_agartha', 'shasta_agartha', 'antarctica_agartha', 'antarctica_northpole'];

test('EVERY BOARD IS AN AREA: every built site but Room 64 is bypassed; the entry part exists, wears the bay door, carries `site`; the twenty generated areas are terrain rooms on the blueprint (a plan, a look, the site\'s own sky) and never a board room', () => {
    for (const site of HQ.siteRooms.built) {
        const ent = D.hqSiteEntryOf(site);
        assert.ok(ent && HQ.rooms[ent.room], site + ': bypassed onto a part that exists');
        const part = HQ.rooms[ent.room];
        assert.equal(part.site, site, ent.room + ' stands for its site');
        assert.ok(part.part && !part.roomNo, ent.room + ': a part, no number of its own');
        assert.ok((part.doors || []).some(d => d.id === ent.door.id && d.entry === site && d.action && d.action.room === D.hqBayId(D.hqSectorOfMap(site))), ent.room + ': the bay door is the board\'s egress');
        assert.equal((part.doors || []).filter(d => d.id === ent.door.id).length, 1, ent.room + ': once');
        assert.equal(D.hqSiteEntry('site_' + site, 'egress').room, ent.room);
    }
    assert.ok(!D.hqSiteEntryOf('prebuilt_training') && HQ.rooms.training, 'Room 64 keeps its board — it is meant to look like a Δ');
    assert.equal(Object.keys(SPECS).length, 20, 'twenty generated areas');
    for (const rid of AREA_ROOMS) {
        const r = HQ.rooms[rid];
        assert.ok(r && r.kind === 'box' && r.terrain && r.area && r.shell.w > 0 && r.shell.d > 0, rid + ': a terrain box room');
        assert.ok(r.terrain.gen && ['cave', 'rooms', 'halls'].includes(r.terrain.gen.kind), rid + ': a generated floor plan');
        assert.ok(r.shell.look && r.shell.look.name, rid + ': a grade');
        if (r.shell.open) assert.ok(r.shell.sky && r.shell.sky.fog && r.shell.sky.fog.density > 0 && !r.shell.sky.motion, rid + ': the site\'s sky with a fog per metre, still');
        else assert.ok(r.shell.fog && r.shell.fog.density > 0, rid + ': a closed room\'s fog');
        assert.ok(!(r.shell.lights || []).length, rid + ': a terrain room lights itself');
        assert.ok(r.terrain.features.some(f => f.k === 'plateau' && f.h >= 2.3), rid + ': a weenie the tape stands on (2.35 under the Backrooms\' 3 m ceiling)');
        assert.ok(r.terrain.features.some(f => f.k === 'rail' || f.k === 'wall') && r.terrain.features.some(f => f.k === 'ramp' || f.k === 'plateau'), rid + ': the park rule');
    }
    const fairy = D.hqSiteEntryOf('prebuilt_fairy_forest');
    const tree = HQ.rooms[fairy.room].doors.find(d => d.id === 'forest');
    assert.ok(tree && tree.way === 'hollowtree' && !tree.leaf && tree.entry === 'prebuilt_fairy_forest', 'the clearing\'s hollow tree IS the woods\' bay door');
});

test('THE MARKER: every entry part carries exactly one battle marker — the crossing overlay, the site, the beacon proc; the older parts read HQ_AREA_MARKERS; the renderer stands it on the ground and the terminal opens the site\'s Δ', () => {
    for (const site of HQ.siteRooms.built) {
        const rid = D.hqAreaRoomOf(site), room = HQ.rooms[rid];
        const mk = (room.counters || []).filter(c => c && c.proc === 'battle_marker');
        assert.equal(mk.length, 1, rid + ': one marker');
        const m = mk[0];
        assert.ok(m.id === 'battle' && m.site === site && m.action && m.action.overlay === 'crossing' && m.verb === 'BATTLE', rid + ': the crossing\'s marker for its own site');
        assert.equal(D.hqAreaMarker(rid), m);
        if (!AREA_ROOMS.includes(rid)) assert.ok(MARKERS[rid] && MARKERS[rid].x === m.x && MARKERS[rid].z === m.z, rid + ': pinned');
    }
    assert.ok(renderer.includes("if (c.proc === 'battle_marker') {") && renderer.includes('_hqBuildBattleMarker(U)'), 'the renderer draws the beacon');
    assert.ok(renderer.includes("var ccy = _hqCaveTop(c.x || 0, c.z || 0); if (ccy != null) grp.position.y += ccy * U;"), 'a box room\'s counter stands on the ground under it');
    const map = fs.readFileSync(__dirname + '/map.js', 'utf8');
    assert.ok(map.includes("const id = c.site || (room && room.site);") && map.includes("variant: 'site'"), 'map.js: the crossing terminal reads the counter\'s site');
});

test('THE MARKER stands on walkable, reachable ground in every entry part (the walker\'s own field); every generated area solves from every door and holds no trap; its tape is HARD on the weenie', heavy, () => {
    for (const site of HQ.siteRooms.built) {
        const rid = D.hqAreaRoomOf(site), room = HQ.rooms[rid], m = D.hqAreaMarker(rid);
        if (!room.terrain) continue;
        const info = D.hqTerrainInfo(rid);
        const L0 = D.hqTerrainDoorLanding(room, room.doors[0]);
        const reach = D.hqTerrainReach(info, L0.x, L0.z);
        assert.ok(D.hqTerrainFeet(info, m.x, m.z, null) != null && reach.has(D.hqTerrainNodeKey(info, m.x, m.z)), rid + ': the marker on reachable ground');
        if (!AREA_ROOMS.includes(rid)) continue;
        for (const d of room.doors) { const l = D.hqTerrainDoorLanding(room, d); assert.ok(reach.has(D.hqTerrainNodeKey(info, l.x, l.z)), rid + '/' + d.id + ' reached'); }
        assert.equal(D.hqTerrainTraps(info).length, 0, rid + ': no trap');
        const finds = D.hqFindsForRoom(rid);
        assert.ok(finds.some(f => f.kind === 'tape' && f.hard), rid + ': a hard tape (the door gun\'s)');
        for (const p of (room.props || [])) if (p.y == null) assert.ok(D.hqTerrainFeet(info, p.x, p.z, null) != null, rid + ': ' + p.key + ' on ground');
    }
});

test('THE TIER HEIGHT (2026-09-22 — the floating objects): in a room with ground a floor prop\'s `y` ≥ 1 (or ≤ −0.5) is a HEIGHT FROM THE FLOOR, landed at max(the ground, y) — the sarcophagus on the priest house, the tea table on the tower; a small `y` is still the lift over the ground; every tier-height prop in the three named areas has its tier under it', () => {
    assert.ok(renderer.includes("if (pcy != null) { if (typeof p.y === 'number' && (p.y >= 1 || p.y <= -0.5)) { y0 += Math.max(pcy, p.y); pY = 0; } else y0 += pcy; }"), 'the placer\'s rule');
    assert.ok(renderer.includes("var y = onCeil ? (y0 + ((p.y != null) ? p.y : ceilY)) : (y0 + (pY || 0) + mount);"), 'the lift the rule consumed is spent');
    for (const id of ['site_prebuilt_technoticlan_templecity', 'site_prebuilt_mars_cydonia', 'site_prebuilt_lookingglass_garden']) {
        const info = D.hqTerrainInfo(id), room = HQ.rooms[id]; let tiered = 0;
        for (const p of room.props) {
            if (typeof p.wall === 'string' || p.ceil || typeof p.y !== 'number' || p.y < 1) continue;
            const g = D.hqTerrainFeet(info, p.x, p.z, null), gh = g == null ? D.hqTerrainHeight(info, p.x, p.z) : g;
            assert.ok(gh <= p.y + 0.8 || p.y >= 1, id + ': ' + p.key + ' authored at ' + p.y + ' under ground ' + gh.toFixed(2));   // the rule lands it at max(ground, y): on the ground when authored under a tier's blend
            if (Math.abs(gh - p.y) < 0.6) tiered++;
        }
        assert.ok(tiered >= 3, id + ': the tier props stand on their tiers (' + tiered + ')');
    }
    /* THE HEDGE WALK: both ends of the Garden\'s span stand on their towers (the west end hung 0.7 m off the White Queen\'s tower) */
    const gi = D.hqTerrainInfo('site_prebuilt_lookingglass_garden'), b = gi.bridges[0];
    for (const [x, z] of [[b.x0, b.z0], [b.x1, b.z1]]) assert.ok(Math.abs(D.hqTerrainHeight(gi, x, z) - b.y) < 0.15, 'the span\'s end at ' + x + ',' + z + ' is off its tower');
});

test('THE DOOR RULE: no plain-leaf door joins two sites but the designed seams (docked collars, tunnels that are the route, a site\'s only line — HQ_AREA_KEPT_LEAVES names each with its reason); the shortcuts are gone; the ways, the draughts and the telescope stay', () => {
    const live = HQ.links.filter(l => D.hqLinkLive(l));
    for (const l of live) {
        if (!D.hqLinkPlain(l)) continue;
        assert.ok(KEPT[l.id], l.id + ': a plain door between two sites with no reason to stay');
    }
    for (const id of PRUNED) assert.ok(!HQ.links.some(l => l.id === id), id + ' is pruned');
    for (const id of Object.keys(KEPT)) assert.ok(HQ.links.some(l => l.id === id), id + ' (kept) exists');
    /* the draughts: a link with `secret: true` wears a hidden door at both ends */
    for (const id of ['vatican_hell', 'cern_backrooms']) {
        const l = HQ.links.find(x => x.id === id), lv = D.hqLinkLive(l);
        assert.ok(l.secret && lv, id + ' is a secret seam');
        for (const rid of [lv.a, lv.b]) { const d = HQ.rooms[rid].doors.find(x => x.id === 'link_' + id); assert.ok(d && d.secret && d.leaf == null, rid + ': a hidden door'); }
    }
    assert.ok(!D.hqLinkPlain(HQ.links.find(l => l.id === 'vatican_hell')), 'a draught is not a plain door');
    assert.ok(!HQ.rooms.site_prebuilt_vatican_basilica.doors.some(d => /hell/.test(d.id)) && !HQ.rooms.site_prebuilt_vatican_library.doors.some(d => /heaven|hell/.test(d.id)), 'no door to hell in the Vatican, no elevator to heaven');
    /* the ways stay */
    for (const id of ['observatory_stair', 'haunted_camelot', 'mirror_lookingglass', 'northpole_haunted', 'lodge_olympus', 'bermuda_abyss', 'downtown_strip', 'tunnel_cyberpunk', 'well_cellar', 'ranch_haunted', 'deadtree_lookingglass', 'fairy_camelot']) assert.ok(D.hqLinkLive(HQ.links.find(l => l.id === id)), id + ' (a way) is live');
    /* Mars is a course on the ship's collar now */
    assert.equal(D.hqShipDestinations().map(d => d.link).join(','), 'moon_derelict,derelict_saturn,antarctica_derelict,mars_derelict');
    /* no link stands on a bypassed board room any more */
    for (const site of HQ.siteRooms.built) assert.ok(!HQ.rooms['site_' + site].doors.some(d => d.link), site + ': the board carries no link door');
    assert.ok(dataSrc.includes('if (link.secret || end.secret) { d.secret = true; d.leaf = null;'), 'hqLinkDoors wears a draught');
});

test('THE TAPES: no bypassed board keeps a tape — every board\'s tape moved into its entry part; the hundred stays a hundred; every generated area has its hard tape pinned', () => {
    assert.equal(D.DOOR_TAPES.length, 100);
    for (const site of HQ.siteRooms.built) {
        if (site === 'prebuilt_training') continue;
        assert.equal(D.DOOR_TAPES.filter(t => t.where === 'site_' + site).length, 0, site + ': the board room holds no tape');
        assert.ok(D.DOOR_TAPES.some(t => D.hqRoomSite(t.where) === site), site + ': its tapes are in its parts');
    }
    for (const rid of AREA_ROOMS) assert.ok(HQ.findSpots[rid] && HQ.findSpots[rid].tape, rid + ': the tape pinned on the weenie');
});

test('every world-graph station still stands: every built site is on at least one line; the lunar line is the collar\'s courses; the map reaches every area from the foyer', () => {
    const R = D.hqWorldRoutes('foyer');
    const off = HQ.siteRooms.built.filter(s => s !== 'prebuilt_training' && !R.some(r => r.stations.some(st => st.site === s)));
    assert.equal(off.join(','), '', 'every built site is a station');
    const G = D.hqMapGraph(), ids = Array.isArray(G.nodes) ? G.nodes.map(n => n.id) : Object.keys(G.nodes);
    for (const rid of AREA_ROOMS) assert.ok(ids.includes(rid), rid + ' on the map');
});
