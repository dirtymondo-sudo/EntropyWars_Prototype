// hq-floors.test.js — THE EXPLORATION FLOORS (HQ plan Phase 8, 2026-09-14).
//
// Guards the building's new graph: THE CAR and its stops, the three new
// floors (B · SERVICES, G · THE GARAGE, 3 · THE ANNEX), the undercroft on
// no button, the secret doors, every door's landing resolving, ONE HOME PER
// FUNCTION (no two counters / doors launch the same screen), the catalogue's
// procs having builders, and the pause fix (P + the eaten ESC) in every
// file it touches. Repo-only tooling — runs under `npm test`.

'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { loadGameData } = require('./load-data');

const D = loadGameData();
const HQ = D.DOOR_HQ;
const src = f => fs.readFileSync(path.join(__dirname, f), 'utf8');
const TR = src('three-renderer.js'), MP = src('map.js'), BT = src('battle.js'), UI = src('ui.js'), IX = src('index.html');

const NEW_ROOMS = ['car', 'garage', 'dock', 'services', 'kitchen', 'coldroom', 'laundry', 'corridor_a', 'boiler', 'corridor_b', 'deadend', 'server',
    'dungeon', 'ritual', 'sacrifice', 'orb', 'annex', 'classroom', 'cubicles', 'bathroom', 'crawlspace', 'locker', 'natatorium', 'garden'];
const NUMBERED = { garage: 'P1', kitchen: '350', coldroom: '-18', laundry: '60', boiler: '451', server: '127', dungeon: '24601', ritual: '333', sacrifice: '322', orb: 'X',
    classroom: '314', cubicles: '9-5', bathroom: 'WC', locker: '26', natatorium: '50M', garden: '1618' };
const LOBBIES = ['car', 'dock', 'services', 'corridor_a', 'corridor_b', 'deadend', 'annex', 'crawlspace'];

test('the twenty-four rooms exist as box rooms; the numbered ones wear their numbers, the lobbies and corridors none', () => {
    for (const id of NEW_ROOMS) {
        const r = HQ.rooms[id];
        assert.ok(r && r.kind === 'box' && r.shell && r.shell.w > 0 && r.shell.d > 0 && r.shell.h >= 2.5, id + ': a box room with a shell the doors fit under');
        assert.ok(r.label && r.sub && r.spawn && Array.isArray(r.doors) && Array.isArray(r.props) && Array.isArray(r.lines), id + ': label, sub, spawn, doors, props, lines');
        if (NUMBERED[id]) { assert.strictEqual(String(r.roomNo), NUMBERED[id], id + ': the number'); assert.ok(r.why, id + ': a why'); assert.strictEqual(D.hqRoomNo(id), NUMBERED[id]); }
        else assert.ok(r.roomNo == null, id + ' is a lobby / corridor and wears no number');
    }
    const reg = D.hqRoomRegister();
    for (const [id, no] of Object.entries(NUMBERED)) { const rows = reg.filter(r => r.no === no); assert.strictEqual(rows.length, 1, no + ' once in the register'); assert.strictEqual(rows[0].id, id); }
    for (const id of LOBBIES) assert.ok(!reg.some(r => r.id === id), id + ' is not in the register');
});

test('every door in the building lands somewhere that exists: the room, and a door or counter with the `at` id in it', () => {
    const problems = [];
    for (const [rid, room] of Object.entries(HQ.rooms)) {
        for (const d of room.doors || []) {
            const a = d.action || {};
            if (!a.room) continue;
            const to = HQ.rooms[a.room];
            if (!to) { problems.push(rid + '/' + d.id + ' → ' + a.room + ' (no such room)'); continue; }   // the Bureau's room shipped 2026-09-15 (plan 4.4): no exception left
            if (a.at && !(to.doors || []).some(x => x.id === a.at) && !(to.counters || []).some(x => x.id === a.at)) problems.push(rid + '/' + d.id + ' → ' + a.room + '@' + a.at + ' (no such landing)');
        }
    }
    assert.deepStrictEqual(problems, []);
});

test('THE CAR: the mezzanine elevator opens into it for everyone, every lobby’s elevator door leads back to it, its panel is the ride, and the stops are what data.js says', () => {
    const car = HQ.rooms.car;
    assert.ok(car && car.doors.length === 0 && car.counters.some(c => c.id === 'panel' && !c.action.fn && !c.action.overlay && !c.action.room), 'the car has no doors: the panel (a by-id panel) is the way out');
    assert.ok(car.props.some(p => p.key === 'car_panel' && p.wall === 's') && car.props.some(p => p.key === 'shaft_window' && p.wall === 'n'), 'the buttons by the door, the shaft window at the back');
    const eg = HQ.rooms.central_egress.doors.find(d => d.id === 'elevator');
    assert.ok(eg && eg.action.room === 'car' && eg.action.at === 'panel' && !eg.minClearance && !eg.requiresKeys && Array.isArray(eg.floors) && !eg.floors.includes('13'), 'the hall door: into the car, ungated, the sixteen buttons without 13');
    const stops = HQ.elevator.stops;
    assert.deepStrictEqual(stops.map(s => s.id).join(','), 'PH,4,3,2,M,G,B', 'seven stops, top to bottom (2 · THE WORKS and 4 · THE LABS since Phase 8 stage 2, 2026-09-15)');
    for (const st of stops) {
        const room = HQ.rooms[st.room];
        assert.ok(room, st.id + ' → ' + st.room);
        assert.ok(room.doors.some(d => d.id === st.at && d.proc === 'elevator' && d.action.room === 'car' && d.action.at === 'panel'), st.id + ': the lobby’s elevator door leads back into the car');
        assert.ok(eg.floors.includes(st.id), st.id + ' is on the sixteen-button panel');
    }
    assert.ok(!stops.some(s => /^B2$|undercroft|dungeon/i.test(s.id + s.room)), 'the undercroft is on no button');
    const ph = stops.find(s => s.id === 'PH');
    assert.ok(ph.minClearance === 4 && ph.requiresKeys === 12, 'PH wears the old door gate');
    /* hqElevatorStops: the verdicts, YOU ARE HERE */
    const rows = D.hqElevatorStops(null, 'garage');
    assert.ok(rows.find(r => r.id === 'PH').locked && rows.find(r => r.id === 'PH').gate.includes('12 KEYS'), 'PH locked without a card, the gate named');
    assert.ok(rows.find(r => r.id === 'G').here && !rows.find(r => r.id === 'B').here, 'the floor the car was boarded from is marked');
    assert.ok(rows.every(r => r.id === 'PH' || !r.locked), 'the other six are open to a recruit');
    assert.ok(!D.hqElevatorStops({ door: { clearance: 4, hq: { keys: 12 } } }).find(r => r.id === 'PH').locked, 'a KEYHOLDER with twelve Keys rides to PH');
});

test('the secret doors: six panels on no plate, each pointing at a real door on the far side, none in the hall', () => {
    const secrets = D.hqSecretDoors();
    assert.strictEqual(secrets.length, 8, 'eight secret doors (the cave\u2019s oubliette shares a wall with Room 24601 — 2026-09-15 rev 10)');
    for (const s of secrets) {
        const d = HQ.rooms[s.room].doors.find(x => x.id === s.id);
        assert.ok(d.secret === true && d.leaf == null && !d.proc && d.action.room && d.action.at, s.room + '/' + s.id + ': secret, no leaf, a landing');
        assert.ok(HQ.rooms[d.action.room] && HQ.rooms[d.action.room].doors.some(x => x.id === d.action.at), s.room + '/' + s.id + ' lands at a door');
        assert.ok(/DRAUGHT/.test(d.label), 'a secret door reads as a draught on the prompt');
    }
    assert.ok(!HQ.rooms.central_egress.doors.some(d => d.secret), 'nothing secret in the hall');
    /* the loops the secret doors close: the cold room ⇄ corridor B, the end of corridor B → the dungeon AND → H-Wing's east leg, the bathroom stall ⇄ the crawlspace */
    const pairs = secrets.map(s => s.room + '→' + s.to).sort().join(' ');
    assert.strictEqual(pairs, 'bathroom→crawlspace coldroom→corridor_b corridor_b→coldroom crawlspace→bathroom deadend→dungeon deadend→hwing_e dungeon→site_prebuilt_hollow_earth_oubliette site_prebuilt_hollow_earth_oubliette→dungeon');
});

test('the shortcuts and the loops: the training stair, the kitchen stair, the dock, the server stair, the ladder, the garden gate', () => {
    const at = (rid, did) => HQ.rooms[rid].doors.find(d => d.id === did);
    assert.ok(at('training', 'stairs').action.room === 'services' && at('services', 'stairs').action.room === 'training', 'Room 64 ⇄ B');
    assert.ok(at('cafeteria', 'kitchen').action.room === 'kitchen' && at('kitchen', 'service').action.room === 'cafeteria', 'Room 86 ⇄ Room 350');
    assert.ok(at('garage', 'dock').action.room === 'dock' && at('dock', 'laundry').action.room === 'laundry' && at('laundry', 'dock').action.room === 'dock', 'G ⇄ the dock ⇄ Room 60');
    assert.ok(at('it', 'server').action.room === 'server' && at('server', 'it').action.room === 'it' && at('server', 'corridor').action.room === 'corridor_b', 'Room 1337 ⇄ Room 127 ⇄ corridor B');
    assert.ok(at('sacrifice', 'hatch').action.room === 'crawlspace' && at('crawlspace', 'hatch').action.room === 'sacrifice', 'the ladder: Room 322 ⇄ the crawlspace');
    assert.ok(at('garden', 'gate').minClearance === 5 && at('garden', 'gate').action.room === 'orb' && at('orb', 'gate').minClearance === 5 && at('orb', 'gate').action.room === 'garden', 'the garden gate: an L5 both ways');
    assert.ok(at('natatorium', 'garden').action.room === 'garden' && at('garden', 'pool').action.room === 'natatorium', 'the pool ⇄ the garden (the annex loop)');
    assert.strictEqual(D.doorSiteState(at('garden', 'gate'), null), 'clearance', 'the gate is red to a recruit');
    assert.strictEqual(D.doorSiteState(at('garden', 'gate'), { door: { clearance: 5 } }), 'open', 'and opens at L5');
});

test('ONE HOME PER FUNCTION: no screen is launched from two places in the building', () => {
    const homes = {};
    for (const [rid, room] of Object.entries(HQ.rooms)) {
        const add = (kind, e) => { const a = e.action || {}; const key = a.fn ? 'fn:' + a.fn : (a.overlay ? 'overlay:' + a.overlay : null); if (!key) return; (homes[key] = homes[key] || []).push(rid + '/' + kind + ':' + e.id); };
        (room.doors || []).forEach(d => add('door', d)); (room.counters || []).forEach(c => add('counter', c));
        /* a variant's counters stand in for the sheet's, never beside them */
    }
    const allowed = { 'overlay:crossing': Infinity, 'overlay:training': Infinity, 'overlay:dispatch': Infinity, 'overlay:directory': Infinity, 'overlay:codered': Infinity };
    const dupes = Object.entries(homes).filter(([k, v]) => v.length > (allowed[k] || 1)).map(([k, v]) => k + ' ← ' + v.join(', '));
    assert.deepStrictEqual(dupes, [], 'every launch has one home');
    for (const fn of ['_mountReactProfile', '_mountReactTrophies', '_mountLeaderboard', '_goToShop', '_goToCampaign', '_goToCodex', '_mountReactCreator']) assert.strictEqual((homes['fn:' + fn] || []).length, 1, fn + ' has exactly one home');
    assert.deepStrictEqual(homes['fn:_mountReactProfile'], ['reception/counter:window'], 'the ID card opens at Reception’s window only');
    assert.deepStrictEqual(homes['fn:_mountLeaderboard'], ['central_egress/counter:board'], 'the standings are the hall’s board only');
    assert.deepStrictEqual(homes['overlay:intray'], ['office/counter:intray'], 'the case file is Room 101’s tray only');
    /* the panels' shortcut buttons: YOUR CARD is gone from the promotion, the barber, the tray and the window; SIGN IN AT THE WINDOW (Reception's own) stays */
    const cardBtns = (MP.match(/data-fn="_mountReactProfile"/g) || []).length;
    assert.ok(cardBtns <= 3 && cardBtns >= 1, 'the profile button survives only where it points home (Reception), got ' + cardBtns);
    assert.doesNotMatch(MP, /YOUR CARD ▸ PROFILE|>YOUR CARD<|THE CARD ▸ PROFILE/, 'no YOUR CARD shortcut in any panel');
    assert.doesNotMatch(MP, /if \(c\.id === 'edge'\) \{[\s\S]{0,2000}?_mountLeaderboard/, 'the pool’s edge panel does not launch the leaderboard');
});

test('the catalogue: every Phase 8 proc has a builder, the lights and rects are shaped, the sedan is the garage’s car, no utility box in a room', () => {
    const procs = ['car_panel', 'shaft_window', 'concrete_pillar', 'parking_bay', 'parked_car', 'garage_ramp', 'roller_shutter', 'kitchen_range', 'range_hood', 'pot_rack', 'meat_hook', 'washer', 'dryer',
        'laundry_cart', 'flicker_tube', 'bare_bulb', 'boiler', 'cell_bars', 'wall_chains', 'stocks', 'wall_torch', 'candle_ring', 'ritual_circle', 'stone_altar', 'floor_stain', 'floating_orb',
        'chalkboard', 'lectern', 'riser_1', 'riser_2', 'riser_3', 'school_desk', 'toilet_stall', 'urinal', 'sink_row', 'hand_dryer', 'locker_bench', 'shower_stall', 'lap_pool', 'lifeguard_chair',
        'garden_ring', 'fountain', 'park_bench', 'garden_tree'];
    const block = TR.slice(TR.indexOf('Object.assign(_hqProcBuilders, {'), TR.indexOf('function _hqProcProp(name)'));
    for (const k of procs) {
        const c = HQ.catalogue[k];
        assert.ok(c && c.proc === k && (c.h != null || c.span != null), k + ': catalogued with a size');
        assert.match(block, new RegExp('^\\s+' + k + ': function \\(U', 'm'), k + ': a builder');
        if (c.light) assert.ok(c.light.color != null && c.light.intensity > 0 && c.light.dist > 0, k + ': a shaped light');
        if (c.rect) assert.ok(c.rect.hw > 0 && c.rect.hd > 0 && c.block, k + ': a rect blocker blocks');
        if (c.wall && c.proc) assert.ok(c.depth > 0, k + ': a wall proc has a depth');
    }
    for (const k of ['riser_1', 'riser_2', 'riser_3']) assert.ok(HQ.catalogue[k].h <= 0.9 && HQ.catalogue[k].h - (HQ.catalogue['riser_' + (Number(k.slice(-1)) - 1)] || { h: 0 }).h <= 0.62, k + ': one step the walker climbs (HQ_STEP_TOL)');
    assert.match(block, /parked_car: function \(U\) \{[\s\S]{0,900}?getRace3DModel\('honda civic', 'male'\)/, 'the parked car is the Sedan (the honda civic GLB, as the main menu)');
    for (const [rid, room] of Object.entries(HQ.rooms)) for (const p of room.props || []) assert.ok(p.key !== 'utility_box', rid + ' places a utility box (a board / horizon piece)');
    /* the tickers, the prop lights, the dimmed rooms, the strips that are off */
    assert.match(TR, /tickers: \[\], propLights: 0,/, 'the HQ record carries tickers and the light budget');
    assert.match(TR, /for \(var tk = 0; tk < H\.tickers\.length; tk\+\+\)/, 'the tickers run in the world tick');
    assert.match(TR, /if \(cat\.light && _hq\.propLights < HQ_PROP_LIGHT_MAX\)/, 'a proc’s catalogue light is placed, capped');
    assert.match(TR, /var amb = \(S\.mood && S\.mood\.ambient != null\) \? S\.mood\.ambient : 1;/, 'mood.ambient dims a box room');
    assert.match(TR, /if \(open \|\| S\.strips === false\) lightsAt = \[\];/, 'strips: false = no fluorescent strip');
    for (const id of ['dungeon', 'ritual', 'sacrifice', 'orb', 'coldroom', 'corridor_a', 'corridor_b', 'deadend', 'boiler', 'crawlspace']) assert.ok(HQ.rooms[id].shell.strips === false && HQ.rooms[id].shell.mood && HQ.rooms[id].shell.mood.ambient < 1, id + ' is a dim room lit by its own props');
});

test('the secret door in the renderer: no leaf, no lamp, no plate, a wall slab on a hinge flush with the wall', () => {
    const doors = TR.slice(TR.indexOf('function _hqBuildDoors(room)'), TR.indexOf('function _hqBuildCounters(room)'));
    assert.match(doors, /var secret = !!door\.secret;/);
    assert.match(doors, /if \(secret\) \{ leafKey = null; leafCat = null; \}/, 'no leaf');
    assert.match(doors, /if \(secret\) \{ housing\.visible = lens\.visible = glow\.visible = false;/, 'no lamp');
    assert.match(doors, /if \(secret\) el\.style\.display = 'none';/, 'no plate');
    assert.match(doors, /if \(secret\) \{\s*\/\* the panel[\s\S]{0,400}?motion = \{ mode: 'swing', pivot: new THREE\.Group\(\), dir: -1, angle: 1\.35, ow: ow \};/, 'a swinging wall slab');
    assert.match(doors, /var wallMatS = secret \? _hqMat\(S\.wall \|\| 'stone', 1\.2, 1\.4, \{ color: \(S\.wallColor != null\)/, 'the slab and its frame wear the shell’s tinted wall');
});

test('THE PAUSE: P opens the settings in the building and the pause menu in a battle; an unrequested pointer-lock loss is the ESC the browser ate, in both', () => {
    assert.match(TR, /k === 'q' \|\| k === 'p'\) return k;/, 'the walker knows P');
    assert.match(TR, /if \(k === 'p'\) \{ e\.preventDefault\(\); e\.stopPropagation\(\); if \(H\.opts\.onEscape\) H\.opts\.onEscape\(\); return; \}/, 'P = ESC in the building');
    assert.match(TR, /var _hqHadLock = false;/);
    assert.match(TR, /var esc = _hqHadLock && !!_hq && !_hq\.paused && \(performance\.now\(\) - _hqLockStaleAt > 2500\);/, 'a lock loss the walker did not ask for opens the settings');
    assert.match(BT, /let _strikeLockReleasedAt = 0;/);
    assert.match(BT, /if \(wasLocked && !locked && _enabled\(\) && _owns\(\) && performance\.now\(\) - _strikeLockReleasedAt > 1500/, 'Strike Mode: a lock loss it did not cause opens the pause menu');
    assert.strictEqual((BT.match(/_strikeLockReleasedAt = performance\.now\(\);/g) || []).length, 2, 'both of Strike Mode’s own releases are stamped');
    assert.match(UI, /if \(\(e\.key === 'p' \|\| e\.key === 'P'\) && !e\.ctrlKey && !e\.metaKey && !e\.altKey && !state\.uiDialog\s*&& state\.phase === 'battle' && !state\.winner/, 'P = the pause menu in a battle');
    assert.match(IX, /ESC \/ P menu/, 'the hints say so (THE PAUSE MENU, 2026-09-15: ESC / P is the menu now)');
});

test('the panels by id in map.js: the floor panel, the booth, the board, the object, the altar, the notice board, the bar, the plaques', () => {
    for (const id of ['booth', 'board', 'object', 'altar', 'notice', 'bar', 'plaques']) assert.match(MP, new RegExp("if \\(c\\.id === '" + id + "'\\) \\{"), id + ' has a panel');
    assert.match(MP, /if \(c\.id === 'panel' \|\| c\.id === 'floorpanel'\) return _hqFloorPanelHtml\(c, html\);/);
    assert.match(MP, /if \(roomId === 'car' && _hqCurRoom && _hqCurRoom !== 'car'\) window\._hqCarFrom = _hqCurRoom;/, 'the car remembers the floor it was boarded from');
    assert.match(MP, /if \(c\.id === 'board'\) \{[\s\S]{0,600}?TYPE_CHART/, 'the lesson reads the type wheel');
    assert.match(MP, /if \(c\.id === 'altar'\) \{[\s\S]{0,700}?hqIntakeCard/, 'the waiver has your callsign on it');
    for (const [rid, cid] of [['garage', 'booth'], ['classroom', 'board'], ['orb', 'object'], ['sacrifice', 'altar'], ['cafeteria', 'notice'], ['corner', 'plaques'], ['car', 'panel'], ['executive', 'floorpanel']]) {
        const c = HQ.rooms[rid].counters.find(x => x.id === cid);
        assert.ok(c && c.action && !c.action.fn && !c.action.overlay && !c.action.room && c.desc, rid + '/' + cid + ' is a by-id panel with a desc');
    }
});
