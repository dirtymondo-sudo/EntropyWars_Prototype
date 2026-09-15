// hwing.test.js — H-WING (HQ plan 5.5, stage 1 — 2026-09-14 rev 4).
//
// Guards the forbidden straight corridor beneath the facility: the eight
// rooms and their look, the H (two legs + the bar), the two ways in (the
// garage's stair, the room at the end's other wall), the fractal (one office
// behind eight doors whose way out is the first door; the east leg's far end
// opening onto the west leg's start; HOME's kitchen door opening onto its
// front door), the Backrooms crossing at the EXIT with the site room's BACK
// DOOR coming back, the two procs, the two by-id panels, the plates' blank
// register — and the pointer-lock fix that came with it (a door no longer
// opens the settings). Repo-only tooling — runs under `npm test`.

'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { loadGameData } = require('./load-data');

const D = loadGameData();
const HQ = D.DOOR_HQ;
const src = f => fs.readFileSync(path.join(__dirname, f), 'utf8');
const TR = src('three-renderer.js'), MP = src('map.js');

const ROOMS = ['hwing_lobby', 'hwing_w', 'hwing_bar', 'hwing_e', 'hwing_office', 'hwing_pool', 'hwing_break', 'hwing_home'];
const LOOK = { floor: 'carpet_4', wall: 'drywall', ceiling: 'ceiling' };
const at = (rid, did) => (HQ.rooms[rid].doors || []).find(d => d.id === did);

test('the wing: eight box rooms, the sheet names them, none wears a number, the register skips every one', () => {
    assert.deepStrictEqual(D.hqHWingRooms().join(','), ROOMS.join(','), 'DOOR_HQ.hwing.rooms is the wing in walking order');
    const reg = D.hqRoomRegister();
    for (const id of ROOMS) {
        const r = HQ.rooms[id];
        assert.ok(r && r.kind === 'box' && r.shell && r.shell.w > 0 && r.shell.d > 0 && r.shell.h >= 2.5, id + ': a box room');
        assert.ok(r.label && r.sub && r.spawn && Array.isArray(r.doors) && Array.isArray(r.props) && Array.isArray(r.lines), id + ': label, sub, spawn, doors, props, lines');
        assert.ok(r.roomNo == null, id + ' wears no number (a wing, 7.0 rule 2)');
        assert.strictEqual(D.hqRoomNo(id), '', id + ' reads no number');
        assert.ok(!reg.some(x => x.id === id || x.room === id), id + ' is not in the register');
        assert.ok(!r.shell.pipes, id + ': no conduits — drywall and ceiling tile');
    }
    /* the one look, everywhere but HOME (a house: its own carpet and wallpaper) */
    for (const id of ROOMS.filter(x => x !== 'hwing_home')) for (const [k, v] of Object.entries(LOOK)) assert.strictEqual(HQ.rooms[id].shell[k], v, id + ': ' + k);
    assert.strictEqual(HQ.rooms.hwing_home.shell.floor, 'carpet_2');
    assert.ok(HQ.rooms.hwing_home.shell.strips === false && HQ.rooms.hwing_home.shell.mood.ambient < 1, 'HOME is lit by its own bulb');
});

test('the H: two 48 m legs, straight, joined by the crossbar; every door in the wing lands on a real door', () => {
    const W = HQ.rooms.hwing_w, E = HQ.rooms.hwing_e, B = HQ.rooms.hwing_bar;
    assert.ok(W.shell.d === HQ.hwing.legM && E.shell.d === HQ.hwing.legM && W.shell.w === 3 && E.shell.w === 3, 'the legs: legM long, 3 m wide');
    assert.ok(B.shell.w === HQ.hwing.barM && B.shell.d === 3, 'the bar: barM long across');
    assert.ok(at('hwing_w', 'bar').wall === 'e' && at('hwing_w', 'bar').action.room === 'hwing_bar' && at('hwing_w', 'bar').action.at === 'west', 'the west leg opens east onto the bar');
    assert.ok(at('hwing_e', 'bar').wall === 'w' && at('hwing_e', 'bar').action.room === 'hwing_bar' && at('hwing_e', 'bar').action.at === 'east', 'the east leg opens west onto the bar');
    assert.ok(at('hwing_bar', 'west').wall === 'w' && at('hwing_bar', 'west').action.room === 'hwing_w' && at('hwing_bar', 'east').wall === 'e' && at('hwing_bar', 'east').action.room === 'hwing_e', 'the bar joins them');
    for (const id of ROOMS) for (const d of HQ.rooms[id].doors) {
        const a = d.action || {};
        assert.ok(a.room && HQ.rooms[a.room], id + '/' + d.id + ' leads to a room');
        assert.ok(a.at && ((HQ.rooms[a.room].doors || []).some(x => x.id === a.at) || (HQ.rooms[a.room].counters || []).some(x => x.id === a.at)), id + '/' + d.id + ' lands at a door or counter in ' + a.room);
        assert.ok(d.leaf !== 'leaf_hollow_core', id + '/' + d.id + ': never the L2 rank leaf');
        assert.ok(!d.minClearance && !d.requiresKeys, id + '/' + d.id + ': open for now (the gates come with the chapter)');
    }
});

test('the ways in: the garage’s stair (P2) and the room at the end’s other wall; the car never stops here', () => {
    const p2 = at('garage', 'p2');
    assert.ok(p2 && p2.wall === 'w' && p2.action.room === 'hwing_lobby' && p2.action.at === 'stair' && !p2.minClearance, 'THE STAIR down from P1, ungated');
    assert.ok(at('hwing_lobby', 'stair').action.room === 'garage' && at('hwing_lobby', 'stair').action.at === 'p2', 'and back up');
    const sd = at('deadend', 'hwing');
    assert.ok(sd && sd.secret === true && sd.leaf == null && sd.wall === 'w' && /DRAUGHT/.test(sd.label) && sd.action.room === 'hwing_e' && sd.action.at === 'deadend', 'the second wall that is not a wall');
    assert.ok(at('hwing_e', 'deadend').action.room === 'deadend' && at('hwing_e', 'deadend').action.at === 'hwing' && at('hwing_e', 'deadend').leaf === 'leaf_cell', 'a cell door from the wing side');
    assert.ok(D.hqSecretDoors().some(s => s.room === 'deadend' && s.id === 'hwing'), 'listed with the secrets');
    assert.strictEqual(D.hqHWingEntries().map(e => e.room + '/' + e.door).join(','), 'garage/p2,deadend/hwing');   // .join: a vm-realm array never deepStrictEquals
    assert.ok(!HQ.elevator.stops.some(s => /^H$/i.test(s.id) || /hwing/.test(s.room)), 'H is on no button');
    const el = at('hwing_lobby', 'elevator');
    assert.ok(el && el.proc === 'elevator' && el.action.room === 'car' && el.action.at === 'panel', 'the lobby’s elevator door still calls the car');
});

test('the fractal: one office behind eight doors, its way out the first door; the east leg’s end is the west leg’s start; the kitchen door is the front door', () => {
    const officeDoors = [];
    for (const leg of ['hwing_w', 'hwing_e']) for (const d of HQ.rooms[leg].doors) if (/^office_\d$/.test(d.id)) officeDoors.push(leg + '/' + d.id);
    assert.strictEqual(officeDoors.length, 8, 'eight office doors');
    for (const key of officeDoors) { const [leg, id] = key.split('/'); const d = at(leg, id); assert.ok(d.action.room === 'hwing_office' && d.action.at === 'corridor', key + ' → the office'); }
    assert.strictEqual(HQ.rooms.hwing_office.doors.length, 1, 'the office has one door');
    assert.ok(at('hwing_office', 'corridor').action.room === 'hwing_w' && at('hwing_office', 'corridor').action.at === 'office_1', 'its way out is the first door of the west leg');
    assert.ok(at('hwing_e', 'loop').wall === 'n' && at('hwing_e', 'loop').action.room === 'hwing_w' && at('hwing_e', 'loop').action.at === 'lobby', 'the east leg continues as the west leg');
    assert.ok(at('hwing_home', 'kitchen').action.room === 'hwing_home' && at('hwing_home', 'kitchen').action.at === 'hall', 'HOME’s kitchen door opens onto its own front door');
    assert.ok(at('hwing_bar', 'home').action.room === 'hwing_home' && at('hwing_home', 'hall').action.room === 'hwing_bar' && at('hwing_home', 'hall').action.at === 'home', 'HOME is on the bar');
    assert.ok(HQ.rooms.hwing_home.props.some(p => p.key === 'house_stairs') && HQ.rooms.hwing_home.counters.some(c => c.id === 'phone' && !c.action.fn && !c.action.overlay && !c.action.room), 'the stairs that end at the ceiling, the phone that rings');
});

test('the crossing: the EXIT at the end of the west leg walks into Room 90’s site room, whose back door comes back — and never through Bay 6', () => {
    const ex = at('hwing_w', 'exit');
    assert.ok(ex && ex.wall === 'n' && ex.leaf === 'leaf_exit' && ex.action.room === 'site_prebuilt_backrooms' && ex.action.at === 'hwing', 'EXIT → the Backrooms room');
    assert.strictEqual(D.doorSiteState(ex, null), 'open', 'a room door: the sealed sector never gates it');
    const site = HQ.rooms.site_prebuilt_backrooms;
    const back = site.doors.find(d => d.id === 'hwing');
    assert.ok(back && back.wall === 's' && back.leaf === 'leaf_exit' && back.action.room === 'hwing_w' && back.action.at === 'exit', 'the site room’s back door (siteRooms.backDoors) returns to the wing');
    assert.strictEqual(site.doors[0].id, 'egress', 'the way in is still first');
    assert.strictEqual(site.doors.filter(d => !d.link).length, 2, 'the way in and the back door (the world-graph links append after — 9.3 rev 7)');
    assert.ok(Math.abs(back.x) + 1.25 < site.shell.w / 2 && Math.abs(back.x) > 1.25 + 1.65, 'the back door fits the wall clear of the way in');
    assert.ok(HQ.sectors.quarantined.locked === true, 'Bay 6 stays sealed — H-Wing is the other way to Room 90 (C-12)');
    /* a back door is a full box-room door row; since 9.2 (2026-09-15) a map may carry an ARRAY of them (the Haunted House complex) — one row stays legal */
    for (const [id, bd] of Object.entries(HQ.siteRooms.backDoors)) { assert.ok(HQ.siteRooms.built.includes(id), id + ' is built'); for (const d of (Array.isArray(bd) ? bd : [bd])) assert.ok(d.id && d.wall && d.action && d.action.room && d.action.at, id + ': a door row'); }
    assert.match(TR, /a second door on the room \(H-WING, 2026-09-14 rev 4/, 'the setting keeps the back door’s lane clear');
    assert.match(TR, /if \(!d \|\| d\.id === 'egress' \|\| !d\.wall\) return;/);
});

test('the procs and the panels: the square cubicle and the house stairs are catalogued with builders and rects; the floor plan and the phone are by-id panels', () => {
    const block = TR.slice(TR.indexOf('Object.assign(_hqProcBuilders, {'), TR.indexOf('function _hqProcProp(name)'));
    for (const k of ['square_cubicle', 'house_stairs']) {
        const c = HQ.catalogue[k];
        assert.ok(c && c.proc === k && c.h > 0 && c.block && c.rect && c.rect.hw > 0 && c.rect.hd > 0, k + ': catalogued, a rect blocker');
        assert.match(block, new RegExp('^\\s+' + k + ': function \\(U', 'm'), k + ': a builder');
    }
    assert.strictEqual(HQ.rooms.hwing_pool.props.filter(p => p.key === 'square_cubicle').length, 6, 'six square cubicles');
    assert.strictEqual(HQ.rooms.hwing_pool.onlineSpots.length, 6, 'the shift at them');
    for (const id of ['wingplan', 'phone']) assert.match(MP, new RegExp("if \\(c\\.id === '" + id + "'\\) \\{"), id + ' has a panel');
    const wp = HQ.rooms.hwing_lobby.counters.find(c => c.id === 'wingplan');
    assert.ok(wp && !wp.action.fn && !wp.action.overlay && !wp.action.room && wp.desc && wp.verb, 'the floor plan is a panel');
    assert.match(MP, /if \(c\.id === 'phone'\) \{[\s\S]{0,1500}?<button class="hq-btn" disabled/, 'ANSWER waits (A14 Q5)');
    /* ONE HOME PER FUNCTION (C-27): the wing launches nothing */
    for (const id of ROOMS) for (const e of (HQ.rooms[id].doors || []).concat(HQ.rooms[id].counters || [])) assert.ok(!(e.action && (e.action.fn || e.action.overlay)), id + '/' + e.id + ' launches no screen');
});

test('THE DOOR THAT OPENED THE SETTINGS (2026-09-14 rev 4): a room-to-room rebuild never re-appends the locked canvas, and a lock loss inside the swap window is not the walker’s ESC', () => {
    assert.match(TR, /if \(canvas\.parentNode !== host\) host\.appendChild\(canvas\);/, 'the canvas is appended only when it is not there already');
    assert.match(TR, /if \(css2dRenderer\.domElement\.parentNode !== host\) host\.appendChild\(css2dRenderer\.domElement\);/, 'the CSS2D layer too');
    assert.match(TR, /var _hqRebuildAt = 0;/);
    assert.match(TR, /if \(_hq\) \{ _hqRebuildAt = performance\.now\(\); _hqKeepLock = true; try \{ _hqLeave\(\); \} finally \{ _hqKeepLock = false; \} \}/, 'the swap is stamped');
    assert.match(TR, /if \(esc && performance\.now\(\) - _hqRebuildAt < 2500\) esc = false;/, 'and the handler honours the stamp');
    /* the C-28 rule itself is untouched (hq-floors.test.js pins the line) */
    assert.match(TR, /var esc = _hqHadLock && !!_hq && !_hq\.paused && \(performance\.now\(\) - _hqLockStaleAt > 2500\);/);
});
