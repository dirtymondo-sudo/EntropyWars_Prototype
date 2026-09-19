// hq-ranch.test.js — THE MAPS / ROOMS CLEANUP (2026-09-18, the user): Nuketown
// retired; Antarctica on THE LUNAR ROUTE (docked on the Spaceship's collar);
// the North Pole on CAMELOT KINGDOM (a new route); Camelot and the Lodge off
// THE LEY LINE; THE WOODS split into THE WOODS and THE RANCH — THE CORN FIELDS
// (a terrain part on Room 512, the ranch's hub: the corn maze, the circles,
// the mesa, THE BUTTE = the tape) with the Haunted House's dead tree, the
// Lodge's saloon door, the grove's back gate (the way to the woods, through
// Bohemian Grove) and the ranch well; the Graveyard and the Western map wait
// as HELD links; THE HUBS on the map (DOOR_HQ.hubs → hqHubOf → the graph /
// the model → map.js's big ringed nodes); THE PLATE READS THE ROOM THROUGH
// THE DOOR (hqDoorThrough / hqDoorPlateLabel / hqReplateDoors + hqLinkDoors).
'use strict';
const test = require('node:test');
const { heavy } = require('./test-heavy.js');   // 2026-09-18: the heavy geometry proofs run on `npm run test:full` / in CI
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { loadGameData } = require('./load-data');
const D = loadGameData(), HQ = D.DOOR_HQ;
const SITE = 'prebuilt_skinwalker', BOARD = 'site_prebuilt_skinwalker', FIELDS = BOARD + '_fields';
const at = (room, id) => (HQ.rooms[room].doors || []).find(d => d.id === id);
const L = id => HQ.links.find(l => l.id === id);
const map = fs.readFileSync(__dirname + '/map.js', 'utf8');
const css = fs.readFileSync(__dirname + '/styles-base.css', 'utf8');
const server = fs.readFileSync(__dirname + '/server.js', 'utf8');
const renderer = fs.readFileSync(__dirname + '/three-renderer.js', 'utf8');

test('NUKETOWN IS RETIRED: no launch map, no threshold, no bay seat, no site room, no link, no tape row, no server pool row, no near builder', () => {
    assert.ok(!D.EW_MAP_META.some(m => /nuketown/.test(m.id)), 'no meta row');
    assert.ok(!D.hqSiteBoard('prebuilt_nuketown') && !D.EW_MAP_META.some(m => m.id === 'prebuilt_nuketown_delta'), 'no board');
    assert.ok(!HQ.thresholds.prebuilt_nuketown, 'no threshold');
    for (const s of Object.keys(HQ.sectors)) assert.ok(!(HQ.sectors[s].maps || []).includes('prebuilt_nuketown'), s + ' seats it');
    assert.ok(!HQ.siteRooms.built.includes('prebuilt_nuketown') && !HQ.rooms.site_prebuilt_nuketown, 'no site room');
    assert.ok(!HQ.links.some(l => [l.a, l.b].some(e => e && e.site === 'prebuilt_nuketown')), 'no link stands on it');
    assert.ok(!D.DOOR_TAPES.some(t => /nuketown/.test(t.where) || /nuketown/.test(t.id)), 'no tape row');
    assert.equal(D.DOOR_TAPES.length, 100, 'the hundred stays a hundred');
    assert.ok(!/nuketown/i.test(server), 'no server pool row');
    assert.ok(!/_NR_BUILDERS\.nuketown/.test(renderer), 'no near builder');
    assert.ok(!HQ.siteRooms.near.nuketown && !HQ.siteRooms.shells.prebuilt_nuketown && !(HQ.siteRooms.flavour || {}).prebuilt_nuketown);
});

test('ANTARCTICA IS ON THE LUNAR ROUTE: docked on the Spaceship\'s one collar — a third course on the nav console', () => {
    const l = L('antarctica_derelict');
    assert.ok(l && l.route === 'lunar' && D.hqLinkLive(l), 'live, lunar');
    assert.ok(l.b.door === 'collar' && l.b.part === 'airlock' && l.a.site === 'prebuilt_antarctica' && l.a.wall === 'n' && l.a.x === -0.2);
    const dests = D.hqShipDestinations();
    assert.deepEqual(dests.map(d => d.link).sort().join(','), 'antarctica_derelict,derelict_saturn,mars_derelict,moon_derelict', 'four courses (THE AREAS, 2026-09-18: Mars docked)');
    assert.ok(dests.find(d => d.link === 'antarctica_derelict').label === 'ANTARCTICA');
    const d = at('site_prebuilt_antarctica_station', 'link_antarctica_derelict');   // THE AREAS (2026-09-18): on THE STATION
    assert.ok(d && d.action.room === 'site_prebuilt_derelict_airlock' && d.action.at === 'collar', 'the far end lands AT the collar');
    assert.ok(!at('site_prebuilt_derelict_airlock', 'link_antarctica_derelict'), 'no door generated at the docked end');
});

test('CAMELOT KINGDOM: the North Pole joins Camelot on a new route; the Lodge and Camelot left THE LEY LINE', () => {
    assert.ok(HQ.routes.kingdom && HQ.routes.kingdom.label === 'CAMELOT KINGDOM' && HQ.routes.kingdom.color, 'the route');
    const l = L('northpole_camelot');
    assert.ok(l && l.route === 'kingdom' && D.hqLinkLive(l));
    assert.equal(D.hqLinkRoom(l.b), 'site_prebuilt_camelot_ward', 'the sleigh road ends at the outer ward');
    assert.ok(!L('camelot_lodge'), 'the Lodge\'s door off the great hall is gone');
    const ley = HQ.links.filter(x => x.route === 'ley');
    assert.ok(ley.length === 4 && !ley.some(x => [x.a, x.b].some(e => e.site === 'prebuilt_camelot' || e.site === 'prebuilt_lodge')), 'the ley line is the stones alone');
    assert.ok(!at('site_prebuilt_camelot_hall', 'link_camelot_lodge'), 'no Lodge door on the hall');
    const routes = D.hqWorldRoutes('foyer');
    assert.ok(routes.find(r => r.id === 'kingdom') && routes.find(r => r.id === 'ranch'), 'the world tab lists the kingdom and the ranch');
});

test('THE RANCH: THE CORN FIELDS is a terrain part on Room 512, the board is bypassed, the plan solves from every door and nothing traps', () => {
    const r = HQ.rooms[FIELDS];
    assert.ok(r && r.site === SITE && r.part === 'fields' && r.kind === 'box' && !r.roomNo, 'the part');
    assert.ok(r.shell.open && r.shell.edge === 'open' && r.shell.sky && r.shell.sky.scenery === 'eyes' && r.shell.look === D.HQ_ROOM_LOOKS.ranch, 'open under the ranch\'s own night, the ranch look');
    assert.ok(r.terrain && r.terrain.gen && r.terrain.gen.kind === 'rooms', 'a rooms plan (the corn is the solid)');
    const ent = D.hqSiteEntryOf(SITE); assert.ok(ent && ent.room === FIELDS, 'the stable door lands in the fields');
    const bay = at(FIELDS, 'bay'); assert.ok(bay && bay.entry === SITE && bay.wall === 's' && bay.x === 0, 'the bay door is the board\'s egress');
    assert.ok(!HQ.rooms[BOARD].doors.some(d => d.link), 'the bypassed board carries no link door');
    const info = D.hqTerrainInfo(FIELDS);
    assert.ok(info && info.maskD, 'compiled with a plan');
    const doors = r.doors.filter(d => d.action && d.action.room);
    assert.ok(doors.length >= 5, 'the bay, the tree, the saloon door, the grove gate, the well: ' + doors.map(d => d.id).join(','));
    for (const a of doors) for (const b of doors) if (a !== b) assert.ok(D.hqTerrainReach(info, a, b), a.id + ' → ' + b.id);
    assert.equal(D.hqTerrainTraps(info).length, 0, 'nothing traps');
    assert.ok(info.rails.length >= 1 && r.props.some(p => p.key === 'railing_1m') && r.props.some(p => /^riser_/.test(p.key)), 'the park rule');
    assert.ok(r.terrain.features.filter(f => f.k === 'path' && f.pts.length >= 16).length >= 3, 'three crop circles');
    assert.ok(r.npcSpots.filter(s => s.race === 'scarecrow').length >= 3, 'the scarecrows');
    assert.ok(r.shell.sky.landmarks && r.shell.sky.landmarks[0].kind === 'peak', 'Shasta on the horizon (the weenie)');
    const lit = r.props.filter(p => (HQ.catalogue[p.key] || {}).light).length;
    assert.ok(lit >= 1 && lit <= 10 && Array.isArray(r.shell.lights) && r.shell.lights.length === 0, 'lights itself');
});

test('THE RANCH\'S GATES: the house\'s dead tree, the Lodge\'s saloon door, the grove\'s back gate and the well stand on the fields; the Graveyard and the Western map wait on their sites', heavy, () => {
    const ends = { ranch_haunted: ['site_prebuilt_haunted_grounds', 'n', -16, 'deadtree'], ranch_lodge: ['site_prebuilt_lodge_halls', 'n', -4, null], ranch_grove: ['site_prebuilt_bohemian_grove_grove', 'n', 8, null] };   // THE AREAS (2026-09-18): the far ends are the areas
    for (const [id, [far, wall, along, way]] of Object.entries(ends)) {
        const l = L(id); assert.ok(l && l.route === 'ranch' && D.hqLinkLive(l), id + ' live on THE RANCH');
        assert.equal(D.hqLinkRoom(l.a), far); assert.equal(D.hqLinkRoom(l.b), FIELDS);
        const d = at(FIELDS, 'link_' + id), b = at(far, 'link_' + id);
        assert.ok(d && b && d.wall === wall && d.x === along && d.action.room === far && b.action.room === FIELDS, id + ': the pair');
        if (way) assert.ok(d.way === way && b.way === way, id + ' wears the ' + way);
        assert.ok(!(HQ.catalogue[l.leaf] || {}).rank, id + ': never a rank leaf');
    }
    const well = L('well_skinwalker');
    assert.ok(well.a.part === 'fields' && well.a.wall === 'free' && at(FIELDS, 'link_well_skinwalker').way === 'well', 'the well is free in the farmyard');
    assert.ok(!L('woods_haunted') && !L('woods_skinwalker'), 'the pasture\'s two gates are gone');
    assert.ok(L('woods_grove') && D.hqLinkLive(L('woods_grove')) && L('woods_grove').route === 'woods', 'the grove keeps its owl\'s gate onto the redwood trail — the interchange');
    assert.ok(!L('ranch_graveyard') && !L('ranch_western'), 'the graveyard and the western map wait on their sites (no held rows — every link on the sheet is live)');
    assert.ok(!HQ.rooms[FIELDS].doors.some(d => d.wall === 'e'), 'the east wall is kept for them');
    /* the tape on THE BUTTE: pinned, hard, reachable by the gun */
    const tape = D.DOOR_TAPES.find(t => t.where === FIELDS);
    assert.ok(tape && /SCARECROWS/.test(tape.title), 'Nuketown\'s tape re-homed on the fields');
    const finds = HQ.finds.filter(f => f.room === FIELDS);
    const tf = finds.find(f => /^tape:/.test(f.id));
    assert.ok(tf && tf.hard === true, 'the butte\'s tape is hard');
});

test('THE HUBS: every hub names a room that exists and gathers its rooms; the graph marks the anchor and the members; the model carries them; map.js draws the ring and the halo', () => {
    const H = HQ.hubs;
    assert.deepEqual(Object.keys(H).sort().join(','), 'cavern,city,deep,divine,dumb,hq,kingdom,ley,ranch,underworld,woods');   // + THE LEY LINES (2026-09-18)   // + THE UNDERWORLD (2026-09-18) + THE DEEP (2026-09-18) (2026-09-18: a hub that claims its rooms BY ID)
    for (const id of Object.keys(H)) {
        assert.ok(HQ.rooms[H[id].room], id + ': the anchor room exists');
        const a = D.hqHubOf(H[id].room); assert.ok(a && a.id === id && a.anchor, id + ': the anchor knows its hub');
        const claimed = rid => Object.keys(H).some(k => k !== id && (H[k].rooms || []).includes(rid));   // THE UNDERWORLD (2026-09-18): a room another hub claims BY ID is that hub's (the underworld's four parts under the city)
        for (const s of H[id].sites || []) for (const rid of D.hqSiteComplex(s)) if (!claimed(rid)) assert.equal((D.hqHubOf(rid) || {}).id, id, rid + ' is in ' + id);
    }
    assert.equal((D.hqHubOf('foyer') || {}).id, 'hq'); assert.equal(D.hqHubOf('ring_g'), null); assert.equal(D.hqHubOf('site_prebuilt_lodge'), null);
    const G = D.hqMapGraph();
    assert.equal(G.nodes.site_prebuilt_hollow_earth_gallery.hub, 'cavern'); assert.equal(G.nodes.site_prebuilt_hollow_earth_adit.hubOf, 'cavern'); assert.equal(G.nodes.site_prebuilt_hollow_earth_adit.hub, null);
    const M = D.hqMapModel({}, 'foyer', { all: true });
    assert.equal(M.nodes.filter(n => n.hub).length, 11, 'eleven hubs drawn (THE UNDERWORLD, THE DEEP, THE LEY LINES — 2026-09-18)');
    const Q = D.hqMapModel({}, 'foyer', {});
    assert.ok(Q.nodes.every(n => n.st !== 'q' || (!n.hub && !n.hubOf && !n.hubLabel)), 'a question mark gives no hub away');
    assert.ok(/hq-map-hubring/.test(map) && /hq-map-halo/.test(map) && /n\.hub \? String\(n\.hubLabel/.test(map), 'map.js draws the hub');
    assert.ok(/\.hq-map-n \.hq-map-hubring/.test(css) && /\.hq-map-n\.in-hub \.hq-map-dot/.test(css));
});

test('THE PLATE READS THE ROOM THROUGH THE DOOR: every room door wears the label of the room its action lands in (a bay door keeps its segment), the entry part for a bypassed site, and a link door the far room\'s own', () => {
    let checked = 0;
    for (const rid of Object.keys(HQ.rooms)) for (const d of HQ.rooms[rid].doors || []) {
        const to = D.hqDoorThrough(d); if (!to || d.plate === 'own' || d.secret) continue;
        if (HQ.rooms[to].kind === 'bay') continue;
        assert.equal(d.label, String(HQ.rooms[to].label).toUpperCase(), rid + '/' + d.id + ' → ' + to); checked++;
    }
    assert.ok(checked > 300, 'checked ' + checked);
    assert.equal(at('ring_g', 'site_prebuilt_skinwalker').label, 'THE RANCH · THE CORN FIELDS', 'the ring\'s stable door names the fields');
    assert.equal(at('ring_m', 'site_prebuilt_camelot').label, 'CAMELOT · THE OUTER WARD');
    assert.equal(at('central_egress', 'medical').label, 'THE MEDICAL WING');
    assert.equal(at('site_prebuilt_fairy_forest', 'woods').label, 'THE WOODS · THE CLEARING'); assert.equal(at('site_prebuilt_fairy_forest', 'woods')._own, 'THE WOODS');
    assert.equal(at('site_prebuilt_fairy_forest_clearing', 'link_fairy_camelot').label, 'CAMELOT · THE OUTER WARD', 'a link door reads the part, not the site');   // THE AREAS (2026-09-18): the spring stands in the clearing
    assert.equal(at('site_prebuilt_lodge_halls', 'link_ranch_lodge').label, 'THE RANCH · THE CORN FIELDS');   // THE AREAS (2026-09-18): off THE HALLS
    assert.equal(D.hqDoorThrough({ action: { fn: '_goToShop' } }), null); assert.equal(D.hqDoorThrough({ action: { mission: 'prebuilt_camelot' } }), 'site_prebuilt_camelot_ward'); assert.equal(D.hqDoorThrough({ action: { mission: 'prebuilt_lodge' } }), 'site_prebuilt_lodge_halls');   // THE AREAS (2026-09-18)
    assert.ok(/^hqReplateDoors\(\);/m.test(fs.readFileSync(__dirname + '/data.js', 'utf8')), 'the pass runs at load');
});
