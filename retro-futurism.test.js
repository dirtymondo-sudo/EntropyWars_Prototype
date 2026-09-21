'use strict';
/* retro-futurism.test.js — THE RETRO-FUTURIST PASS (2026-09-21)
   The user: "redesign some DOOR HQ areas to be more 1960s era retro futuristic —
   rounded offices, windows, curved walls and pathways, groovy curved
   architecture, lava lamps; DOOR HQ, the Mall, the Spaceship; don't be afraid to
   make rooms bigger". The kit: a box shell's `round` (filleted corners) and
   `cove` (the wall meeting the ceiling in a quarter-round) in three-renderer.js,
   thirteen procs (the lava lamp, the sputnik, the saucer, the discs, the mushroom,
   the egg and tulip chairs, the tulip table, the curved sofa, the porthole and the
   pod window, the 2001 console, the shag rug, the space divider, the pod bed), two
   looks; the rooms — the foyer, reception, Room 86, the three wing lobbies, the
   penthouse, the corner office, the hall's four floor lamps, the spaceship's three
   compartments, the mall's flight tube and lounge. */
const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm');
const { loadGameData } = require('./load-data');
const D = loadGameData(), HQ = D.DOOR_HQ;
const TR = fs.readFileSync(__dirname + '/three-renderer.js', 'utf8');
const KIT = ['lava_lamp', 'lava_lamp_floor', 'sputnik_lamp', 'saucer_pendant', 'disc_cluster', 'mushroom_lamp', 'egg_chair', 'tulip_chair', 'tulip_table', 'curved_sofa', 'porthole', 'pod_window', 'retro_console', 'shag_rug', 'space_divider', 'pod_bed'];
const ROUND_ROOMS = ['foyer', 'reception', 'cafeteria', 'medwing', 'recwing', 'execwing', 'executive', 'site_prebuilt_derelict_airlock', 'site_prebuilt_derelict_hold', 'site_prebuilt_derelict_bridge'];
const COVE_ROOMS = ROUND_ROOMS.concat(['corner', 'site_prebuilt_downtown_mall']);
const extract = (name) => { const a = TR.indexOf('    function ' + name + '('); assert.ok(a >= 0, name); return TR.slice(a, TR.indexOf('\n    }\n', a) + 6); };

test('THE KIT: every catalogue row is a proc the renderer builds, the lights are lights, the seats are seats, the wall panes hang on a wall', () => {
    const block = TR.slice(TR.indexOf('THE RETRO-FUTURIST KIT — THE PROCS'));
    for (const k of KIT) {
        const cat = HQ.catalogue[k];
        assert.ok(cat && cat.proc === k, k + ': a catalogue row wearing its own proc');
        assert.ok(new RegExp('\\n        ' + k + ': function \\(U').test(block), k + ': a builder in the kit block');
    }
    for (const k of ['sputnik_lamp', 'saucer_pendant', 'disc_cluster']) assert.ok(HQ.catalogue[k].ceil && HQ.catalogue[k].light && HQ.catalogue[k].foot === 0, k + ' hangs from the ceiling and lights the room');
    for (const k of ['lava_lamp', 'lava_lamp_floor', 'mushroom_lamp', 'retro_console']) assert.ok(HQ.catalogue[k].light && HQ.catalogue[k].glow, k + ' is a light');
    for (const k of ['egg_chair', 'tulip_chair', 'curved_sofa']) assert.ok(HQ.catalogue[k].seat > 0.4, k + ' is a seat (E sits)');
    for (const k of ['porthole', 'pod_window']) assert.ok(HQ.catalogue[k].wall && HQ.catalogue[k].mount > 0 && HQ.catalogue[k].glow, k + ' is a lit wall pane');
    for (const k of ['retro_console', 'space_divider', 'pod_bed']) assert.ok(HQ.catalogue[k].rect && HQ.catalogue[k].block, k + ' blocks as a turned rect');
    assert.ok(HQ.catalogue.shag_rug.foot === 0 && HQ.catalogue.tulip_table.block, 'the rug is walked over, the table is not');
    /* the tickers: the wax, the sky, the lamps */
    for (const fn of ['_hqLavaLampBuild', 'porthole: function', 'retro_console: function']) assert.ok(block.indexOf(fn) >= 0 && /_hq\.tickers\.push/.test(block.slice(block.indexOf(fn), block.indexOf(fn) + 6000)), fn + ' moves on a ticker');
    /* the doorhq light rule knows the kit's lamps (a strips:false room must name one) */
    const dq = fs.readFileSync(__dirname + '/doorhq.test.js', 'utf8');
    assert.match(dq, /lava_lamp\|lava_lamp_floor\|sputnik_lamp\|saucer_pendant\|disc_cluster\|mushroom_lamp\|retro_console/, 'doorhq counts a lava lamp / a sputnik / a saucer / the discs / a mushroom / a console as a room light');
});

test('THE CURVED SHELL: `round` fillets the corners for the walker, the air and the boom (one rule, data.js hqShellInFillet its twin), `cove` is built and blocks the boom, both are built from the box shell', () => {
    for (const fn of ['_hqSurface', '_hqAirOK', '_hqCamBlocked']) assert.match(extract(fn), /S\.round > 0 && _hqInFillet\(/, fn + ' reads the fillet');
    assert.match(extract('_hqCamBlocked'), /S\.cove > 0 && !S\.open && py > S\.h - S\.cove && _hqInCove\(/, 'the boom never enters the cove');
    assert.match(extract('_hqBuildBoxShell'), /if \(S\.round > 0\) _hqBuildFillets\(room, G, U,/, 'the fillets are built from the box shell');
    assert.match(extract('_hqBuildBoxShell'), /if \(S\.cove > 0\) _hqBuildCove\(room, G, U,/, 'the cove is built from the box shell');
    assert.match(extract('_hqBuildBoxShell'), /if \(!open && !room\.cave && !room\.terrain && edge === 'walls'\) \{\s*if \(S\.round > 0\)/, 'never on an open, a cave, a terrain or an edge room');
    for (const fn of ['_hqSweepStrip', '_hqShellCorners', '_hqBuildFillets', '_hqBuildCove', '_hqCoveProfile', '_hqInCove', '_hqInFillet']) assert.ok(TR.indexOf('    function ' + fn + '(') >= 0, fn + ' exists');
    /* the two rules agree: the renderer's _hqInFillet run in a vm against data.js's hqShellInFillet on a lattice */
    const c = {}; vm.createContext(c); vm.runInContext(extract('_hqInFillet'), c);
    const S = { w: 10, d: 6, round: 1.6 };
    let n = 0;
    for (let x = -5; x <= 5; x += 0.25) for (let z = -3; z <= 3; z += 0.25) { n++; assert.equal(c._hqInFillet(x, z, S, 0.3), D.hqShellInFillet(S, x, z, 0.3), 'agree at ' + x + ',' + z); }
    assert.ok(n > 900);
    assert.ok(D.hqShellInFillet(S, 4.9, 2.9, 0) && !D.hqShellInFillet(S, 3.4, 1.4, 0) && !D.hqShellInFillet(S, 0, 0, 0) && !D.hqShellInFillet({ w: 10, d: 6 }, 4.9, 2.9, 0), 'the corner is wall, the arc centre and the middle are floor, a square room has no fillet');
    /* the cove's solid: on the wall near the ceiling yes, in the middle of the room no, under the cove's height no */
    vm.runInContext(extract('_hqInCove'), c);
    const C = { w: 10, d: 6, h: 4, cove: 0.5, round: 0 };
    assert.ok(c._hqInCove(4.95, 0, 3.95, C, 0) && !c._hqInCove(0, 0, 3.95, C, 0) && !c._hqInCove(4.95, 0, 3.0, C, 0) && !c._hqInCove(4.4, 0, 3.55, C, 0), 'the quarter-round');
});

test('THE ROOMS: every round room keeps its doors, its wall props, its floor props, its people and its counters clear of the fillets; the looks are worn; the sizes grew', () => {
    const problems = [];
    for (const id of ROUND_ROOMS) {
        const r = HQ.rooms[id], S = r.shell;
        assert.ok(S.round > 0 && S.cove > 0 && !S.open && !r.terrain && !r.cave, id + ': a round, coved box room');
        assert.ok(S.round <= Math.min(S.w, S.d) / 2 - 0.5, id + ': the fillet fits the room');
        for (const d of r.doors || []) {
            if (d.wall === 'free' || !d.wall) continue;
            const half = d.wide ? 1.65 : 1.25, at = (d.wall === 'n' || d.wall === 's') ? (d.x || 0) : (d.z || 0);
            if (!D.hqShellDoorClearsFillet(S, d.wall, at, half, 0.4)) problems.push(id + '/' + d.id + ': the door stands in a fillet');
        }
        for (const p of r.props || []) {
            if (p.wall && p.wall !== 'free') {
                const at = (p.wall === 'n' || p.wall === 's') ? (p.x || 0) : (p.z || 0);
                /* the run along the wall: a spanned row's span, a pane's size, else a measured half-width per key (the catalogue carries no width for most wall procs) */
                const HALF = { notice_board: 0.6, lesson_plaque: 0.25, wall_clock: 0.25, filing_cabinet: 0.28, breaker_panel: 0.25, fire_extinguisher: 0.15, water_cooler: 0.3, radiation_sign: 0.25, keypad: 0.1, exit_sign: 0.3, metal_shelving: 0.8, hook_rail_long: 0.8, tanker_desk: 1.1, monitor_stack: 0.8, sun_viewport: 1.2, locker: 0.3, now_serving: 0.5, observation_window: 0.7, serving_line: 1.5, vending_machine: 0.5, floor_panel: 0.2, wall_plaques: 0.6, false_window: 0.6 };
                const cat = HQ.catalogue[p.key] || {};
                const half = cat.span ? cat.span / 2 : (p.size ? p.size / 2 : (cat.w ? cat.w / 2 : (HALF[p.key] != null ? HALF[p.key] : 0.5)));
                if (!D.hqShellDoorClearsFillet(S, p.wall, at, half, 0.05)) problems.push(id + ': wall prop ' + p.key + ' @' + at + ' hangs in a fillet');
            } else if (!p.ceil && p.x != null) {
                const foot = (HQ.catalogue[p.key] && HQ.catalogue[p.key].foot) || 0;
                if (D.hqShellInFillet(S, p.x, p.z, Math.min(foot, 0.4))) problems.push(id + ': prop ' + p.key + ' @' + p.x + ',' + p.z + ' stands in a fillet');
            }
        }
        for (const q of (r.npcSpots || []).concat(r.agents || [], r.onlineSpots || [], r.counters || [], r.spawn ? [r.spawn] : [])) if (q.x != null && D.hqShellInFillet(S, q.x, q.z, 0.34)) problems.push(id + ': a spot / a counter @' + q.x + ',' + q.z + ' is in a fillet');
    }
    assert.deepEqual(problems, []);
    for (const id of COVE_ROOMS) assert.ok(HQ.rooms[id].shell.cove > 0, id + ' wears a cove');
    for (const id of ['foyer', 'reception', 'cafeteria', 'medwing', 'recwing', 'execwing', 'executive', 'corner']) assert.equal(HQ.rooms[id].shell.look, D.HQ_ROOM_LOOKS.retro, id + ' wears the facility\'s retro look');
    for (const id of ['site_prebuilt_derelict_airlock', 'site_prebuilt_derelict_hold', 'site_prebuilt_derelict_bridge']) assert.equal(HQ.rooms[id].shell.look, D.HQ_ROOM_LOOKS.spaceship, id + ' wears the spaceship\'s look');
    assert.ok(D.HQ_ROOM_LOOKS.retro.nightMood === 0 && D.HQ_ROOM_LOOKS.mall.nightMood === 0 && D.HQ_ROOM_LOOKS.mall.retro.preset === 'dream', 'the daylight grades');
    /* bigger: Room 86, the three lobbies, the penthouse, the hold, the bridge */
    assert.ok(HQ.rooms.cafeteria.shell.w === 15 && HQ.rooms.cafeteria.shell.d === 12, 'Room 86 is 15 × 12');
    for (const id of ['medwing', 'recwing']) assert.ok(HQ.rooms[id].shell.w === 12 && HQ.rooms[id].shell.d === 8, id + ' is 12 × 8');
    assert.ok(HQ.rooms.executive.shell.w === 11 && HQ.rooms.executive.shell.d === 8 && HQ.rooms.execwing.shell.w === 11, 'the executive floor grew');
    assert.ok(HQ.rooms.site_prebuilt_derelict_hold.shell.w === 17.5 && HQ.rooms.site_prebuilt_derelict_bridge.shell.w === 16, 'the ship grew');
    /* the furniture: the ring in Room 86, the console bank on the bridge, the pods in the hold, the lava lamps in the hall */
    const has = (id, k) => (HQ.rooms[id].props || []).filter(p => p.key === k).length;
    assert.ok(has('cafeteria', 'curved_sofa') === 5 && has('cafeteria', 'tulip_table') === 1 && has('cafeteria', 'lava_lamp') === 1 && has('cafeteria', 'porthole') === 2 && has('cafeteria', 'sputnik_lamp') === 1, 'THE CONVERSATION RING');
    assert.ok(has('site_prebuilt_derelict_bridge', 'retro_console') === 4 && has('site_prebuilt_derelict_bridge', 'egg_chair') === 2, 'THE CONSOLE BANK');
    assert.ok(has('site_prebuilt_derelict_hold', 'pod_bed') === 3 && has('site_prebuilt_derelict_hold', 'iso_tank') === 1, 'THE CRYO ROW');
    assert.ok(has('central_egress', 'lava_lamp_floor') === 4, 'four lava lamps in the hall');
    for (const id of ['medwing', 'recwing', 'execwing', 'executive', 'foyer', 'reception']) assert.ok(has(id, 'lava_lamp') + has(id, 'lava_lamp_floor') >= 1, id + ' has a lava lamp');
    /* the bridge's nav console still stands at the desk (the room grew round it) */
    const nav = HQ.rooms.site_prebuilt_derelict_bridge.counters.find(c => c.id === 'nav'), crt = HQ.rooms.site_prebuilt_derelict_bridge.props.find(p => p.key === 'crt_terminal');
    assert.ok(nav && crt && Math.hypot(nav.x - crt.x, nav.z - crt.z) < nav.radius, 'the nav console reaches its screen');
    /* the finds never land in a fillet */
    const ri = D.hqFindRoomInfo('foyer');
    assert.equal(D.hqFindFree(ri, 4.6, 2.6), false, 'a corner of the foyer is wall to the finds');
});

test('THE MALL: THE FLIGHT TUBE is a bridge ring at the upper floor over the atrium\'s east, open at the west round the clock tower, walked from the street door; the lounge rings, the saucers, the white', () => {
    const MALL = 'site_prebuilt_downtown_mall', r = HQ.rooms[MALL], T = r.terrain, info = D.hqTerrainInfo(MALL);
    const tube = T.features.filter(f => f.k === 'bridge' && f.ring === 'flighttube');
    assert.ok(tube.length >= 18 && tube.length <= 24, 'a ring of chords (' + tube.length + ')');
    for (const b of tube) {
        assert.equal(b.y, 4.63, 'at the upper floor, 3 cm proud');
        const mx = (b.x0 + b.x1) / 2, mz = (b.z0 + b.z1) / 2, deg = ((Math.atan2(mx, -mz) * 180 / Math.PI) % 360 + 360) % 360;
        assert.ok(Math.abs(Math.hypot(mx, mz) - 21) < 1.2, 'on the circle');
        assert.ok(!(deg > 215 && deg < 325), 'never across the clock tower\'s west (' + deg.toFixed(0) + '°)');
    }
    const foot = D.hqTerrainDoorLanding(r, r.doors.find(d => d.id === 'street')), R = D.hqTerrainReach(info, foot.x, foot.z);
    for (const [x, z] of [[0, -21], [21, 0], [0, 21], [14.85, -14.85]]) {
        const k = D.hqTerrainNodeKey(info, x, z, 4.63);
        assert.ok(R.has(k) && Math.abs(R.get(k) - 4.63) < 0.1, 'the tube is walked at ' + x + ',' + z);
    }
    assert.equal(D.hqTerrainTraps(info).length, 0, 'nothing traps under or on it');
    assert.ok(r.shell.cove > 0 && r.shell.wallColor === 0xf4f2ec && T.floor === 'terrazzo', 'white plaster over terrazzo, a cove under the roof');
    const has = k => r.props.filter(p => p.key === k).length;
    assert.ok(has('curved_sofa') === 8 && has('tulip_table') === 6 && has('lava_lamp') === 2 && has('lava_lamp_floor') === 2 && has('saucer_pendant') === 6 && has('sputnik_lamp') === 3 && has('pod_window') === 4 && has('porthole') === 4, 'THE LOUNGE and the light');
    assert.ok(!r.props.some(p => p.key === 'flicker_tube' || p.key === 'bare_bulb' || p.key === 'office_chair'), 'the tubes, the bulbs and the office chairs are gone');
});
