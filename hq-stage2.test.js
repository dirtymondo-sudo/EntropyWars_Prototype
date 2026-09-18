// hq-stage2.test.js — PHASE 8 STAGE 2: TWO MORE FLOORS (HQ plan §8.6, 2026-09-15).
//
// 2 · THE WORKS (the lobby, the door works with its belts and arms, the
// incinerator, the autopsy room, the door garden, the control room, the lost
// and found, THE STAIRWELL that loops, THE TUNNEL, THE MIDWAY at the end of
// the line) and 4 · THE LABS (the lobby, the dream lab and its tank, THE
// MANDELA ROOM that is a different room every time you enter, the upside-
// down room, SUPPLY CLOSET 4B behind its blast door, CLONE DISPOSAL).
//
// Guards: the eighteen rooms and their numbers (lobbies, the stair, the
// tunnel and the closet wear none); the two new elevator stops; the loop
// (the stairwell's bottom door lands on its own top landing, six metres up,
// on a platform the steps actually reach one step at a time); the tunnel's
// three ends; the blast door's gate (L6) is on the BLAST DOOR, never on the
// vestibule; the Mandela room's per-entry variants (never twice the same,
// never in the visit roll); ROOM DIALOGUE (`say` on a spot — the conspiracy
// theorist at the sink); the flipped props; every new proc has a builder and
// every new counter a panel; ONE HOME PER FUNCTION (C-27) and no rank leaf;
// THE PARK RULE; the production landing on the raised door; the renderer
// rules (door.y, flip, the raised-blocker step rule, say / clone, the car
// panel lit from the stops). Repo-only tooling — runs under `npm test`.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { loadGameData } = require('./load-data');
const D = loadGameData(), HQ = D.DOOR_HQ;
const TR = fs.readFileSync(__dirname + '/three-renderer.js', 'utf8');
const MP = fs.readFileSync(__dirname + '/map.js', 'utf8');
const DJ = fs.readFileSync(__dirname + '/data.js', 'utf8');

const FLOORS = D.hqStage2Rooms();
const ALL = [].concat(FLOORS['2'], FLOORS['4']);
const NUMBERED = { warehouse: '1000', incinerator: '-1', autopsy: 'Y', doorgarden: '½', control: '24/7', lostfound: '?', carnival: '1893',
    dreamlab: 'REM', tank: '0dB', mandela: '*', upsidedown: '9', closet4b: '4B', disposal: 'II' };
const UNNUMBERED = ['works', 'stairwell', 'tunnel', 'labs', 'supply'];
const NEW_PROCS = ['conveyor', 'conveyor_z', 'robot_arm', 'door_stack', 'door_furnace', 'radiation_sign', 'autopsy_table', 'door_xray', 'planter', 'door_vine', 'grow_lamp',
    'monitor_stack', 'lost_shelf', 'stair_step', 'stair_step_x', 'stair_landing', 'stair_landing_sq', 'track_bed', 'platform_edge', 'train_car', 'departures_board', 'tube_map',
    'bigtop', 'ferris_wheel', 'carousel', 'fortune_tent', 'high_striker', 'ticket_booth', 'popcorn_cart', 'festoon', 'eeg_rack', 'dream_screen', 'iso_tank', 'evac_button',
    'warning_tape', 'lone_gun', 'garbage_chute'];
const PANELS = { warehouse: 'line', incinerator: 'manifest', autopsy: 'parts', doorgarden: 'bed', control: 'feeds', lostfound: 'claims', tunnel: 'departures', carnival: 'booth',
    dreamlab: 'log', tank: 'lid', mandela: 'frame', upsidedown: 'note', closet4b: 'evac', disposal: 'chute' };
const door = (room, id) => (HQ.rooms[room].doors || []).find(d => d.id === id);

test('the eighteen rooms exist as box rooms; the numbered ones wear their numbers once in the register, the lobbies / the stair / the tunnel / the closet none', () => {
    assert.equal(FLOORS['2'].length, 10); assert.equal(FLOORS['4'].length, 8);
    for (const id of ALL) {
        const r = HQ.rooms[id];
        assert.ok(r && r.kind === 'box' && r.shell && r.shell.w > 0 && r.shell.d > 0 && r.shell.h >= 2.5, id + ': a box room');
        assert.ok(r.label && r.sub && r.spawn && Array.isArray(r.doors) && Array.isArray(r.props) && Array.isArray(r.lines) && r.lines.length, id + ': label, sub, spawn, doors, props, lines');
        if (NUMBERED[id]) { assert.equal(String(r.roomNo), NUMBERED[id], id + ': the number'); assert.ok(r.why, id + ': a why'); assert.equal(D.hqRoomNo(id), NUMBERED[id]); }
        else { assert.ok(UNNUMBERED.includes(id), id + ' is un-numbered by design'); assert.ok(r.roomNo == null, id + ' wears no number'); }
    }
    const reg = D.hqRoomRegister();
    for (const [id, no] of Object.entries(NUMBERED)) { const rows = reg.filter(r => r.no === no); assert.equal(rows.length, 1, no + ' once in the register'); assert.equal(rows[0].id, id); }
    for (const id of UNNUMBERED) assert.ok(!reg.some(r => r.id === id), id + ' is not in the register');
});

test('every door lands on a real door in a real room, and comes back; the tunnel has three ends; the garage grew its service hatch', () => {
    for (const id of ALL) for (const d of HQ.rooms[id].doors) {
        const to = HQ.rooms[d.action.room];
        assert.ok(to, id + '/' + d.id + ' → ' + d.action.room);
        assert.ok(to.doors.some(x => x.id === d.action.at) || (to.counters || []).some(x => x.id === d.action.at), id + '/' + d.id + ' lands on ' + d.action.room + '@' + d.action.at);
        if (d.action.room !== 'car' && !(id === 'stairwell' && d.id === 'down')) {
            const back = to.doors.find(x => x.id === d.action.at);
            assert.ok(back && back.action.room === id, id + '/' + d.id + ' comes back from ' + d.action.room + '@' + d.action.at);
        }
    }
    const T = HQ.rooms.tunnel;
    assert.equal(T.doors.map(d => d.id + '→' + d.action.room).sort().join(','), 'carnival→carnival,garage→garage,link_tunnel_cyberpunk→site_prebuilt_cyberpunk_streets,link_tunnels_works→site_prebuilt_downtown_tunnels,link_woods_sewer→site_prebuilt_fairy_forest_deadmans,stairwell→stairwell');   // + THE UNDERWORLD (2026-09-18): the running tunnels' loop opens on the Works' tunnel room   // THE WOODS (9.3 stage 3): Dead Man's Cave's grate on the east wall   // .join: a vm-realm array never deep-equals
    const g = door('garage', 'tunnel');
    assert.ok(g && g.wall === 'e' && g.action.room === 'tunnel' && g.action.at === 'garage', 'the garage: a service hatch down to the platform');
    assert.ok(door('carnival', 'mirrors').action.room === 'mandela' && door('mandela', 'mirrors').action.room === 'carnival', 'the hall of mirrors joins the midway to the Mandela room');
});

test('THE CAR: 2 · THE WORKS and 4 · THE LABS are stops; every lobby’s elevator door leads back into the car; the car’s plate names seven', () => {
    const ids = HQ.elevator.stops.map(s => s.id);
    assert.equal(ids.join(','), 'PH,4,3,2,M,G,B');
    for (const st of HQ.elevator.stops.filter(s => s.id === '2' || s.id === '4')) {
        const room = HQ.rooms[st.room];
        assert.ok(room.doors.some(d => d.id === st.at && d.proc === 'elevator' && d.action.room === 'car' && d.action.at === 'panel'), st.id + ': the lobby’s elevator door leads back into the car');
        assert.ok(!st.minClearance && !st.requiresKeys, st.id + ' is ungated');
    }
    const rows = D.hqElevatorStops(null, 'labs');
    assert.ok(rows.find(r => r.id === '4').here && !rows.find(r => r.id === '2').here, 'YOU ARE HERE on the floor the car was boarded from');
    assert.match(HQ.rooms.car.counters[0].sub, /2 · 3 · 4/, 'the car’s plate names the new floors');
    assert.match(TR, /stops\.forEach\(function \(st\) \{ lit\[st\.id\] = 1; \}\)/, 'the car panel lights the stops data.js lists');
    assert.match(TR, /\['4', 1\], \['3', 1\], \['2', 1\]/, 'the shaft window paints the new landings lit');
});

test('THE STAIRWELL LOOPS: you come in at the top landing six metres up, the steps go down one tread at a time to the floor, and DOWN at the bottom opens onto the top landing', () => {
    const S = HQ.rooms.stairwell;
    const top = door('stairwell', 'landing'), down = door('stairwell', 'down');
    assert.ok(top && top.y === 6.0 && top.wall === 'n' && top.action.room === 'works', 'the top landing door stands six metres up and leads to the works');
    assert.ok(down && !down.y && down.wall === 'n' && down.action.room === 'stairwell' && down.action.at === 'landing', 'DOWN lands on the same room’s top landing');
    assert.ok(door('works', 'stairwell').action.at === 'landing', 'the works door lands on the top landing');
    /* the platform under the raised door: a stair_landing whose top is the door's floor */
    const landing = S.props.find(p => p.key === 'stair_landing');
    const cat = HQ.catalogue;
    assert.ok(landing && Math.abs(landing.y + cat.stair_landing.h - top.y) < 1e-9, 'the landing’s top is the door’s floor');
    assert.ok(Math.abs(top.x - landing.x) <= cat.stair_landing.rect.hw - 0.3 && (landing.z + cat.stair_landing.rect.hd) - (-S.shell.d / 2 + 2.4) >= 0.3, 'the landing spot 2.4 m in front of the door is on the platform');
    /* the flights: every step's top is within one step (HQ_STEP_TOL 0.62) of the next, from the landing to the floor */
    const tops = S.props.filter(p => /^stair_(step|step_x|landing_sq)$/.test(p.key)).map(p => +(p.y + cat[p.key].h).toFixed(3));
    const chain = [top.y].concat(tops).concat([0]);
    for (let i = 1; i < chain.length; i++) assert.ok(chain[i - 1] - chain[i] > 0 && chain[i - 1] - chain[i] <= 0.62, 'step ' + i + ': ' + chain[i - 1] + ' → ' + chain[i] + ' is one tread down');
    assert.ok(tops.length >= 20, 'three flights');
    /* the steps stand inside the walls and never share a footprint (each x,z is under one tread) */
    const steps = S.props.filter(p => /^stair_/.test(p.key));
    for (const p of steps) { const r = cat[p.key].rect; assert.ok(Math.abs(p.x) + r.hw <= S.shell.w / 2 + 1e-9 && Math.abs(p.z) + r.hd <= S.shell.d / 2 + 1e-9, p.key + ' @' + p.x + ',' + p.z + ' inside the walls'); }
    for (let i = 0; i < steps.length; i++) for (let j = i + 1; j < steps.length; j++) {
        const a = steps[i], b = steps[j], ra = cat[a.key].rect, rb = cat[b.key].rect;
        const overlap = Math.abs(a.x - b.x) < ra.hw + rb.hw - 1e-6 && Math.abs(a.z - b.z) < ra.hd + rb.hd - 1e-6;
        assert.ok(!overlap, a.key + '@' + a.x + ',' + a.z + ' overlaps ' + b.key + '@' + b.x + ',' + b.z);
    }
    assert.ok(S.shell.h > top.y + 1.5, 'headroom over the top landing');
});

test('the renderer: a box door carries its own floor (`y`), a blocker knows its own base, a raised blocker is a wall only when you are not on it, flipped props hang from the ceiling with no blocker', () => {
    assert.match(TR, /if \(door && typeof door\.y === 'number'\) return Math\.max\(0, door\.y\);/, '_hqDoorFloorY reads door.y (an explicit 0 is the floor under a gallery — 9.2 stage 2)');
    assert.match(TR, /var y0 = level \? _hqLevelY\(S, level\) : _hqDoorFloorY\(room, door\);/, 'the door build stands at that floor');
    assert.match(TR, /spot = new THREE\.Vector3\(\(d\.box\.wx \+ d\.box\.nx \* 2\.4\) \* U, d\.y0 \* U/, 'the landing spot takes the door’s floor');
    assert.equal((TR.match(/y: y0 \+ \(p\.y \|\| 0\), top:/g) || []).length, 2, 'both blocker sites carry the prop’s own base');
    assert.match(TR, /if \(b\.y != null && b\.y > y \+ 1\.2 && \(curY == null \|\| b\.y > curY \+ 1\.2\)\) continue;/, 'a raised blocker is skipped only when it is above the floor AND above the walker');
    assert.match(TR, /var flip = !!p\.flip;/); assert.match(TR, /if \(flip\) grp\.rotation\.z = Math\.PI;/); assert.match(TR, /if \(!flip && cat\.foot > 0/, 'a flipped prop never blocks');
    const U = HQ.rooms.upsidedown;
    assert.ok(U.props.filter(p => p.flip).length >= 12, 'the office is on the ceiling');
    assert.ok(U.props.some(p => p.key === 'fluorescent' && p.flip && !p.ceil), 'the strip light stands on the floor');
    assert.ok(U.props.some(p => p.key === 'railing_1m' && !p.flip), 'the one rail the right way up');
    assert.equal(U.shell.floor, 'ceiling'); assert.equal(U.shell.ceiling, 'carpet');
});

test('ROOM DIALOGUE: a spot’s `say` rides the character as its line (before any roster line); the conspiracy theorist is at the sink; the clone is you', () => {
    assert.match(TR, /var sayOf = function \(spot\) \{ var s = spot && spot\.say;/, 'the say reader');
    assert.match(TR, /line: sayOf\(spot\) \}\);/, 'a native says the room’s line');
    assert.match(TR, /face: spots\[k\]\.face \|\| 0, line: sayOf\(spots\[k\]\) \}\);/, 'a roster draw says the room’s line too');
    assert.match(TR, /if \(spot\.clone && av\.race\) \{[\s\S]{0,600}?race: av\.race, gender: av\.gender \|\| 'male', appearance: av\.appearance \|\| undefined/, 'clone: true spawns the walker’s own vessel');
    assert.match(MP, /let line = t\.line;/, 'the panel reads the character’s line first');
    const sink = HQ.rooms.bathroom.npcSpots[0];
    assert.equal(sink.race, 'conspiracy theorist'); assert.ok(Array.isArray(sink.say) && sink.say.length >= 2 && /filter/i.test(sink.say[0]), 'they really need a filter');
    const said = new Set();
    for (const id of ALL) for (const s of HQ.rooms[id].npcSpots || []) { if (s.say) { said.add(id); const arr = Array.isArray(s.say) ? s.say : [s.say]; for (const l of arr) assert.ok(typeof l === 'string' && l.length > 10, id + ': a line'); } if (s.race) assert.ok(D.AVAILABLE_RACES.includes(s.race), id + ': ' + s.race + ' is a race'); }
    for (const id of ['warehouse', 'incinerator', 'autopsy', 'doorgarden', 'control', 'lostfound', 'tunnel', 'carnival', 'dreamlab', 'upsidedown', 'disposal', 'labs', 'works']) assert.ok(said.has(id), id + ' has room dialogue');
    const dl = HQ.rooms.dreamlab.npcSpots.map(s => s.race);
    for (const r of ['succubus', 'mad scientist', 'dreameater', 'voidweaver']) assert.ok(dl.includes(r), 'the dream lab has the ' + r);
    assert.ok(HQ.rooms.disposal.npcSpots.some(s => s.clone === true && s.say), 'the other one of you is in Room II');
});

test('THE MANDELA ROOM: three per-entry variants, never twice the same in a row, never in the visit roll; the visit roll leaves it out; the plate on the door changes with it', () => {
    const base = D.hqRoomBase('mandela');
    const ids = Object.keys(base.variants);
    assert.equal(ids.slice().sort().join(','), 'library,nursery,office');
    for (const v of ids) { const vd = base.variants[v]; assert.ok(vd.when && vd.when.each === true && vd.door && vd.door.sub && vd.sub && Array.isArray(vd.add) && vd.add.length && Array.isArray(vd.drop), v + ': a per-entry variant with a plate'); }
    const prof = { door: { hq: { variantSeed: 7 } } };
    assert.equal(D.hqVariantRoll('mandela', prof, {}), null, 'the visit roll never stands a per-entry variant');
    const out = D.hqRollRoomVariants(prof, {});
    assert.ok(!('mandela' in out), 'the visit roll leaves the Mandela room alone');
    let last = null, seen = new Set();
    for (let n = 1; n <= 24; n++) { const v = D.hqVariantRollEach('mandela', prof, n, last); assert.notEqual(v, last, 'entry ' + n + ' differs from the last'); assert.ok(v === null || ids.includes(v)); seen.add(v); last = v; }
    assert.ok(seen.size >= 3, 'the room is several rooms over a visit');
    assert.equal(D.hqVariantRollEach('cafeteria', prof, 1, null), null, 'a room with only visit variants has no per-entry roll');
    /* apply + restore: the plate into the room changes, the number and the doors stay */
    D.hqApplyRoomVariant('mandela', 'library');
    assert.match(door('labs', 'mandela').sub, /LIBRARY/); assert.equal(HQ.rooms.mandela.roomNo, '*'); assert.equal(HQ.rooms.mandela.doors.length, 2);
    assert.ok(HQ.rooms.mandela.props.some(p => p.key === 'globe_lamp') && !HQ.rooms.mandela.props.some(p => p.key === 'water_cooler'), 'the library has a globe and no cooler');
    D.hqApplyRoomVariant('mandela', null);
    assert.match(door('labs', 'mandela').sub, /AS YOU REMEMBER IT/); assert.ok(HQ.rooms.mandela.props.some(p => p.key === 'water_cooler'));
    assert.match(MP, /_hqEachN\[roomId\] = \(_hqEachN\[roomId\] \|\| 0\) \+ 1;[\s\S]{0,700}?window\.hqVariantRollEach\(roomId, _hqProfile\(\), _hqEachN\[roomId\], last\)[\s\S]{0,400}?window\.hqApplyRoomVariant\(roomId, vid\);[\s\S]{0,200}?window\._hqMandelaLast = /, 'map.js rolls it on every entry and files what you remember');
    assert.match(DJ, /if \(w\.each\) continue;/, 'the visit roll skips per-entry variants');
});

test('SUPPLY CLOSET 4B: the gate (L6) is on the BLAST DOOR, the vestibule is open, two armed guards, the warnings, the button clears the building to the foyer; behind the door, a closet', () => {
    const v = HQ.rooms.closet4b, blast = door('closet4b', 'blast');
    assert.ok(!door('closet4b', 'labs').minClearance && !door('labs', 'closet4b').minClearance, 'the vestibule is open to everyone');
    assert.equal(blast.minClearance, 6); assert.equal(blast.leaf, 'leaf_vault'); assert.equal(blast.action.room, 'supply');
    assert.ok(door('supply', 'blast').action.room === 'closet4b' && !door('supply', 'blast').minClearance, 'the way out is never gated');
    assert.equal(v.agents.filter(a => a.label === 'ARMED GUARD').length, 2);
    assert.ok(v.props.filter(p => p.key === 'radiation_sign').length >= 4 && v.props.some(p => p.key === 'evac_button') && v.props.some(p => p.key === 'warning_tape'));
    assert.ok(v.counters.some(c => c.id === 'evac' && !c.action.fn));
    assert.match(MP, /if \(c\.id === 'evac'\) \{[\s\S]{0,900}?data-room="foyer" data-at="street" data-evac="1"/, 'EVACUATE walks you to the foyer (a room move, never a second home for the exit)');
    assert.match(MP, /if \(e\.target\.closest\('\[data-evac\]'\)\)/, 'the button rings the bells');
    const S = HQ.rooms.supply;
    assert.ok(S.props.filter(p => p.key === 'toilet_paper').length >= 3 && S.props.some(p => p.key === 'mop'), 'supplies');
    assert.ok(HQ.catalogue.leaf_vault.wide && S.shell.w >= 3.4, 'the blast door fits the closet’s wall');
});

test('every new proc is catalogued and has a builder; every new counter has a by-id panel; nothing on the two floors launches a screen (C-27); no rank leaf', () => {
    const rankKeys = new Set(D.DOOR_TEXT.CLEARANCE.map(r => r.door));
    for (const k of NEW_PROCS) {
        const c = HQ.catalogue[k];
        assert.ok(c && c.proc === k, k + ' catalogued as a proc');
        assert.ok(new RegExp('\\n        ' + k + ': function \\(U\\)').test(TR), k + ' has a builder');
        if (c.wall) assert.ok(c.depth > 0, k + ': a wall proc has a depth');
        if (c.rect) assert.ok(c.block, k + ': a rect is a blocker');
    }
    assert.match(TR, /function _hqMiniDoor\(U, w, h, mat, knobSide\)/, 'the stand-in panel');
    /* THE WORKS WEAR THE KIT (2026-09-16): every leaf a proc handles is a catalogue GLB leaf cloned from the door kit; the panel is the stand-in only */
    assert.match(TR, /function _hqWorksLeaf\(U, w, h, i, knobSide\)/, 'the kit leaf');
    const works = TR.slice(TR.indexOf('function _hqWorksLeaf('), TR.indexOf('/* THE STAIRWELL: a step'));
    assert.equal((works.match(/_hqMiniDoor\(/g) || []).length, 1, 'no proc builds a panel of its own — the one call is the stand-in inside _hqWorksLeaf');
    assert.ok((works.match(/_hqWorksLeaf\(U, /g) || []).length >= 7, 'the belt, the arm, the pallet, the furnace, the vine and the shelf all take the kit leaf');
    const leavesSrc = TR.match(/var _HQ_WORKS_LEAVES = \[([^\]]+)\]/)[1].replace(/[\s']/g, '').split(',');
    for (const k of leavesSrc) { const c = HQ.catalogue[k]; assert.ok(c && c.leaf && c.file, k + ': a catalogue leaf with a file'); assert.ok(!(c.rank > 0), k + ': never a rank leaf'); }
    assert.ok(works.indexOf("typeof THREE.GLTFLoader !== 'function'") >= 0 && works.indexOf('stand.visible = false') >= 0, 'GLB-first, the stand-in hidden when the file lands');
    for (const [room, cid] of Object.entries(PANELS)) {
        const c = HQ.rooms[room].counters.find(x => x.id === cid);
        assert.ok(c && c.action && !c.action.fn && !c.action.overlay && !c.action.room && c.desc && c.radius > 0, room + '/' + cid + ': a by-id panel counter');
        assert.ok(new RegExp("if \\(c\\.id === '" + cid + "'\\) \\{").test(MP), cid + ' has a panel in map.js');
    }
    for (const id of ALL) {
        for (const d of HQ.rooms[id].doors) { assert.ok(!d.action.fn, id + '/' + d.id + ' launches nothing'); assert.ok(!rankKeys.has(d.leaf), id + '/' + d.id + ' wears no rank leaf'); }
        for (const c of HQ.rooms[id].counters || []) assert.ok(!c.action.fn && !c.action.overlay, id + '/' + c.id + ' launches nothing');
    }
    for (const fn of ['hqVariantRollEach', 'hqStage2Rooms', 'hqSecurityFeeds', 'hqClaimsBook', 'hqDoorParts', 'hqWorksTally']) assert.match(DJ, new RegExp('window\\.' + fn + ' = ' + fn + ';'), fn + ' on window');
    const feeds = D.hqSecurityFeeds('control');
    assert.ok(feeds.length === D.hqRoomRegister().length && feeds.filter(f => f.st === 'live').length === 1 && feeds.some(f => f.st === 'dead'), 'the feeds: one per numbered room, this one live, some dead');
    const claims = D.hqClaimsBook({ username: 'agent' }, new Date(2026, 8, 15));
    assert.ok(claims.length === 7 && claims[6].yours && /SOCK/.test(claims[6].item) && claims[6].who === 'AGENT', 'the claims book: your sock');
    assert.ok(D.hqDoorParts().length === 11 && D.hqDoorParts().some(p => /missing/i.test(p.tag)), 'the parts, one missing');
    const tally = D.hqWorksTally();
    assert.ok(tally.register >= 38 && tally.built === tally.register && tally.today === 1000, 'the line');
});

test('THE PARK RULE: a rail and a step in every room; every prop and door inside the walls; every native on a rigged race hint or a plain spot', () => {
    for (const id of ALL) {
        const r = HQ.rooms[id];
        assert.ok(r.props.some(p => p.key === 'railing_1m'), id + ': a rail');
        assert.ok(r.props.some(p => /^riser_[123]$|^stair_step/.test(p.key)), id + ': a step');
    }
});

/* the production landing: _hqBoxWall + _hqGoTo on a stub scene (the hq-suites.test.js harness), the door's own y0 */
function extract(name) { const start = TR.indexOf('    function ' + name + '('); const end = TR.indexOf('\n    }', start); assert.ok(start >= 0 && end > start, name); return TR.slice(start, end + 6); }
function landing(room, d) {
    const c = { _hq: { room, player: {}, cam: {}, doors: [], counters: [] }, _hqUnits: () => HQ.units, _hqRad: n => n * Math.PI / 180,
        _hqHeadingOf: (x, z) => Math.atan2(x, -z) * 180 / Math.PI, _hqHeadingYaw: n => (180 - n) * Math.PI / 180,
        HQ_WALLS: { n: { nx: 0, nz: 1, yaw: 0 }, s: { nx: 0, nz: -1, yaw: Math.PI }, e: { nx: -1, nz: 0, yaw: -Math.PI / 2 }, w: { nx: 1, nz: 0, yaw: Math.PI / 2 } },
        THREE: { Vector3: class { constructor(x, y, z) { Object.assign(this, { x, y, z }); } } } };
    vm.createContext(c); vm.runInContext(extract('_hqBoxWall') + '\n' + extract('_hqGoTo'), c);
    c._hq.doors.push({ door: d, box: c._hqBoxWall(room, d.wall, d), y0: (typeof d.y === 'number') ? d.y : 0 });
    assert.equal(c._hqGoTo(d.id, true), true, room.label + '/' + d.id + ' lands');
    return c._hq.player;
}
test('the production landing: every new door lands inside its room; the stairwell’s top door lands ON the platform six metres up, the bottom door on the floor under it', () => {
    for (const id of ALL) for (const d of HQ.rooms[id].doors) {
        const r = HQ.rooms[id], pl = landing(r, d);
        assert.ok(Math.abs(pl.x) < r.shell.w / 2 - 0.3 && Math.abs(pl.z) < r.shell.d / 2 - 0.3, id + '/' + d.id + ' lands inside the walls (' + pl.x.toFixed(2) + ', ' + pl.z.toFixed(2) + ')');
    }
    const S = HQ.rooms.stairwell, cat = HQ.catalogue;
    const top = landing(S, door('stairwell', 'landing')), bottom = landing(S, door('stairwell', 'down'));
    assert.equal(top.y, 6.0, 'the walker stands at the door’s floor');
    const L = S.props.find(p => p.key === 'stair_landing');
    assert.ok(Math.abs(top.x - L.x) < cat.stair_landing.rect.hw - 0.12 && Math.abs(top.z - L.z) < cat.stair_landing.rect.hd - 0.12, 'the top landing spot is over the platform (' + top.x.toFixed(2) + ', ' + top.z.toFixed(2) + ')');
    assert.equal(bottom.y, 0, 'the bottom door lands on the floor');
    assert.ok(!S.props.some(p => /^stair_(step|step_x|landing_sq)$/.test(p.key) && p.y < 1.3 && Math.abs(p.x - bottom.x) < cat[p.key].rect.hw + 0.4 && Math.abs(p.z - bottom.z) < cat[p.key].rect.hd + 0.4), 'no low step in the bottom door’s lane');
});

test('index.html was cache-busted with the delivery', () => {
    const ix = fs.readFileSync(__dirname + '/index.html', 'utf8');
    assert.ok(!/\?v=20260915-hq-portal-01-cors/.test(ix), 'the previous token is gone');
});
