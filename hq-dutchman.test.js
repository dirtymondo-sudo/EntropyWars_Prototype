// hq-dutchman.test.js — THE FLYING DUTCHMAN COMPLEX (HQ plan 9.2 stage 3 — 2026-09-15 rev 19):
// the FOURTH complex. Room 1717's generated board room stays THE MAIN DECK on
// its quay; THE COMPANIONWAY on its north wall (siteRooms.backDoors.
// prebuilt_revenge) goes below decks into three hand-authored rooms — the gun
// deck, the captain's cabin aft, the hold (with THE DEEP's hatch to Atlantis,
// moved off the deck below the waterline). Guards: the sheet (site + part, no
// number, the register lists the ship once), the companionway's lane on the
// deck, every door a pair and the complex connected, the deep route's end IN
// the hold (and no link door left on the deck), the production landing on
// every door (inside the walls, clear of every blocker and native), THE PARK
// RULE, the ship lighting itself, the misc-kit props, and the tapes (one per
// deck, the hundred still a hundred).
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { loadGameData } = require('./load-data');
const D = loadGameData(), HQ = D.DOOR_HQ;
const TERRAIN_RULES = vm.runInContext('TERRAIN_RULES', D);
const SITE = 'prebuilt_revenge';
const BOARD = 'site_prebuilt_revenge';
const PARTS = ['gundeck', 'cabin', 'hold'];
const PART_IDS = PARTS.map(p => BOARD + '_' + p);
const renderer = fs.readFileSync(__dirname + '/three-renderer.js', 'utf8');
const dataSrc = fs.readFileSync(__dirname + '/data.js', 'utf8');
const at = (room, id) => (HQ.rooms[room].doors || []).find(d => d.id === id);

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
    c._hq.doors.push({ door, box: c._hqBoxWall(room, door.wall, door), y0: 0 });
    assert.equal(c._hqGoTo(door.id, true), true, room.label + '/' + door.id + ' lands');
    return c._hq;
}
/* a prop's footprint on the floor: the catalogue rect (room axes, unless the placement refuses it) or the foot disc */
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

test('the sheet: the Dutchman is a complex of the main deck and three decks below, each wearing site + part and no number; the register lists the ship once', () => {
    assert.strictEqual(D.hqSiteComplex(SITE).join(','), [BOARD].concat(PART_IDS).join(','), 'hqSiteComplex = the deck, then the decks below in sheet order');
    assert.strictEqual(D.hqComplexRooms().filter(id => D.hqRoomSite(id) === SITE).join(','), PART_IDS.join(','), 'the ship’s parts');
    for (const p of PARTS) {
        const id = D.hqComplexRoomId(SITE, p), r = HQ.rooms[id];
        assert.ok(r && r.kind === 'box' && r.site === SITE && r.part === p, id + ': a box room wearing site + part');
        assert.strictEqual(r.roomNo, undefined, id + ' wears no number of its own');
        assert.strictEqual(r.fx, undefined, id + ' is not a board room');
        assert.strictEqual(D.hqRoomNo(id), '1717', id + ': hqRoomNo reads the threshold’s 1717 through site');
        assert.ok(/THE FLYING DUTCHMAN/.test(r.label) && r.sub, id + ': ROOM № · name · function on the plate');
        for (const d of r.doors) if (!d.link) assert.strictEqual(D.hqDoorNo(d), '1717', id + '/' + d.id + ': every plate below decks reads 1717');
        for (const d of r.doors) if (d.link) assert.notStrictEqual(D.hqDoorNo(d), '1717', id + '/' + d.id + ': the hatch’s plate reads the FAR site’s number');
        for (const d of r.doors) assert.notStrictEqual(d.leaf, 'leaf_hollow_core', id + '/' + d.id + ': never the rank leaf');
    }
    const reg = D.hqRoomRegister();
    assert.strictEqual(reg.filter(r => r.mapId === SITE).length, 1, 'the register lists the ship once');
    assert.ok(!reg.some(r => PART_IDS.includes(r.id) || PART_IDS.includes(r.room)), 'no deck is a register entry');
    for (const id of PART_IDS) assert.ok(D.hqEncounterRoomOk(id), id + ' is WILD (9.4)');
});

test('the companionway: the deck’s back door hangs on the north wall in the old Atlantis-hatch lane, wears the site’s own leaf, clear of the console lane, the signboard and the masts; the gun deck’s way up comes back', () => {
    const BD = HQ.siteRooms.backDoors[SITE];
    assert.ok(Array.isArray(BD) && BD.length === 1, 'an ARRAY of one back-door row');
    const room = HQ.rooms[BOARD], S = room.shell;
    assert.strictEqual(room.doors.filter(d => !d.link).map(d => d.id).join(','), 'egress,companionway', 'the way in, then the companionway');
    assert.strictEqual(room.doors.filter(d => d.link).length, 0, 'NO link door is left on the deck — the hatch moved into the hold');
    const cw = at(BOARD, 'companionway');
    assert.ok(cw.wall === 'n' && cw.x === -5 && cw.leaf === 'leaf_shabby_wood', 'the north wall, the Atlantis hatch’s old lane, the threshold’s own leaf');
    assert.strictEqual(cw.leaf, HQ.thresholds[SITE].leaf, 'the companionway wears the site’s catalogue leaf');
    assert.ok(!cw.wide && !HQ.catalogue[cw.leaf].wide, 'a single leaf');
    assert.ok(cw.action.room === BOARD + '_gundeck' && cw.action.at === 'deck', 'the companionway walks down onto the gun deck');
    assert.notStrictEqual(cw.action, BD[0].action, 'the generator copies the action');
    const up = at(BOARD + '_gundeck', 'deck');
    assert.ok(up && up.wall === 's' && up.leaf === 'leaf_shabby_wood' && up.action.room === BOARD && up.action.at === 'companionway', 'the way up returns to the deck at the companionway');
    assert.strictEqual(D.doorSiteState(cw, null), 'open', 'a room door is never sector-gated (C-12)');
    assert.ok(cw.x + 1.25 + 2.2 < 5 - 2.4, 'clear of the built-in north signboard');
    const h = landing(room, cw), p = h.player;
    assert.ok(Math.abs(p.x) < S.w / 2 - 0.4 && Math.abs(p.z) < S.d / 2 - 0.4, 'the landing is inside the walls');
    assert.ok(Math.abs(p.z) > S.grid.cells * S.grid.cell / 2 + (S.moat ? S.moat.gap : 0) + 0.4, 'off the board and the moat — on the quay');
    for (const q of [...room.props, ...room.npcSpots]) assert.ok(!propBlocks(room, q, p.x, p.z, 0.4), (q.key || q.race) + ' blocks the companionway’s landing');
    for (const m of S.lights || []) assert.ok(Math.hypot(p.x - m.x, p.z - m.z) > 1.2, 'a lamp mast stands on the landing');
});

test('THE DEEP goes below the waterline: the Atlantis link’s Dutchman end names the hold part on its port wall, the hatch hangs there wide with its own plate line, Atlantis comes back to it, and the line is still walked from 1717', () => {
    const link = HQ.links.find(l => l.id === 'revenge_atlantis');
    assert.ok(link.a.site === SITE && link.a.part === 'hold' && link.a.wall === 'w' && typeof link.a.z === 'number', 'the Dutchman end is the hold’s port wall');
    assert.strictEqual(D.hqLinkRoom(link.a), BOARD + '_hold');
    assert.ok(D.hqLinkLive(link), 'the link is live');
    const hold = HQ.rooms[BOARD + '_hold'];
    const dh = hold.doors.find(d => d.link === 'revenge_atlantis');
    assert.ok(dh && dh.wall === 'w' && dh.wide === true && dh.leaf === 'leaf_bulkhead' && dh.action.room === 'site_prebuilt_atlantis' && /BELOW THE WATERLINE/.test(dh.sub), 'the hatch: a wide bulkhead below the waterline, its own plate line');
    assert.ok(hold.shell.d / 2 - Math.abs(dh.z) >= 1.65, 'a wide panel needs 1.65 m of wall each side');
    assert.ok(D.hqLinkDoors('site_prebuilt_atlantis').some(d => d.link === 'revenge_atlantis' && d.action.room === BOARD + '_hold' && d.action.at === dh.id), 'Atlantis’s end comes back to the hold');
    const deep = D.hqWorldRoutes('foyer').find(r => r.id === 'deep');
    assert.strictEqual(deep.stations[0].no, '1717', 'the Dutchman is still the end the deep line is walked from — a station is a SITE');
    assert.strictEqual(deep.stations[0].room, BOARD, 'and its station is the board room');
    const here = D.hqWorldRoutes(BOARD + '_hold').find(r => r.id === 'deep').stations[0];
    assert.ok(here.here, 'standing in the hold counts as standing on the ship');
    for (const o of hold.doors) if (o !== dh && o.wall === dh.wall) assert.ok(Math.abs(o.z - dh.z) > 2.9, 'a door shares the hatch’s wall');
});

test('every door below decks is reversible, the complex is connected from the main deck, and nothing leaves the site but the deck’s egress and the hatch', () => {
    const ROOMS = [BOARD].concat(PART_IDS);
    const seen = new Set([BOARD]), queue = [BOARD];
    while (queue.length) {
        const id = queue.shift();
        for (const d of HQ.rooms[id].doors) {
            const a = d.action || {};
            assert.ok(a.room && HQ.rooms[a.room], id + '/' + d.id + ' leads to a room');
            if (d.link) {
                assert.strictEqual(id, BOARD + '_hold', 'only the hold leaves the site through a links row');
                const far = at(a.room, a.at);
                assert.ok(far && far.action.room === id && far.action.at === d.id, id + '/' + d.id + ' ⇄ ' + a.room + ' is a pair');
                continue;
            }
            if (HQ.rooms[a.room].kind === 'bay') { assert.strictEqual(id, BOARD, 'only the main deck walks back to the bay'); continue; }
            const back = at(a.room, a.at);
            assert.ok(back && back.action.room === id && back.action.at === d.id, id + '/' + d.id + ' ⇄ ' + a.room + '/' + (back && back.id) + ' is a pair');
            assert.strictEqual(back.leaf, d.leaf, 'the same leaf on both sides of ' + d.id);
            assert.ok(ROOMS.includes(a.room), id + '/' + d.id + ' stays inside the site');
            if (!seen.has(a.room)) { seen.add(a.room); queue.push(a.room); }
        }
    }
    assert.strictEqual(Array.from(seen).sort().join(','), ROOMS.slice().sort().join(','), 'every deck is reachable from the main deck');
    assert.ok(at(BOARD + '_gundeck', 'cabin').action.room === BOARD + '_cabin' && at(BOARD + '_gundeck', 'hold').action.room === BOARD + '_hold', 'deck → gun deck → the cabin aft / the hold below');
    assert.strictEqual(HQ.rooms[BOARD + '_cabin'].doors.length, 1, 'the cabin is the end of the ship — the stern windows are the only other way out');
    assert.strictEqual(HQ.rooms[BOARD + '_hold'].doors.filter(d => !d.link).length, 1, 'the hold has one ladder and one hatch');
});

test('the production renderer lands every door inside its deck, clear of every blocker and native, facing along the doorway', () => {
    for (const id of PART_IDS) {
        const room = HQ.rooms[id], S = room.shell;
        for (const door of room.doors) {
            const h = landing(room, door), p = h.player;
            assert.ok(Math.abs(p.x) < S.w / 2 - 0.4 && Math.abs(p.z) < S.d / 2 - 0.4, id + '/' + door.id + ': inside the walls');
            const inward = { n: [0, 1], s: [0, -1], e: [-1, 0], w: [1, 0] }[door.wall];
            const fx = Math.sin(h.cam.yaw), fz = -Math.cos(h.cam.yaw);
            assert.ok(Math.abs(fx * inward[0] + fz * inward[1]) > 0.99, id + '/' + door.id + ': faces along the doorway’s normal');
            assert.equal(p.air, false); assert.equal(p.y, 0);
            for (const q of [...room.props, ...room.npcSpots]) assert.ok(!propBlocks(room, q, p.x, p.z, 0.35), id + '/' + door.id + ': ' + (q.key || q.race) + ' blocks the landing');
            for (const other of room.doors) if (other.id !== door.id && other.wall === door.wall) {
                const k = (door.wall === 'n' || door.wall === 's') ? 'x' : 'z';
                assert.ok(Math.abs(other[k] - door[k]) > 2.6, id + ': ' + door.id + ' and ' + other.id + ' overlap');
            }
            const along = (door.wall === 'n' || door.wall === 's') ? [door.x, S.w / 2] : [door.z, S.d / 2];
            assert.ok(along[1] - Math.abs(along[0]) >= ((door.wide ? 3.3 : 2.5) / 2) + 0.2, id + '/' + door.id + ': the panel fits the wall');
        }
        const sp = room.spawn;
        for (const q of [...room.props, ...room.npcSpots]) assert.ok(!propBlocks(room, q, sp.x, sp.z, 0.3), id + ': ' + (q.key || q.race) + ' blocks the spawn');
        for (const n of room.npcSpots) {
            assert.ok(D.AVAILABLE_RACES.includes(n.race), id + ': native race ' + n.race);
            for (const q of room.props) assert.ok(!propBlocks(room, q, n.x, n.z, 0.1), id + ': ' + q.key + ' stands on the ' + n.race);
        }
        for (const q of room.props) assert.ok(HQ.catalogue[q.key], id + ': catalogue key ' + q.key);
        for (const q of room.props) if (!q.wall && !q.ceil) assert.ok(Math.abs(q.x || 0) < S.w / 2 && Math.abs(q.z || 0) < S.d / 2, id + ': ' + q.key + ' is in a wall');
    }
});

test('THE PARK RULE + the light + the kit: a rail on every deck, a stepped ramp on every big one; the ship lights itself; the guns, the chests, the anchor and the lanterns are the misc bucket’s own GLBs; one tape per deck and the hundred is still a hundred', () => {
    for (const id of PART_IDS) {
        const room = HQ.rooms[id], S = room.shell;
        assert.ok(room.props.some(p => p.key === 'railing_1m'), id + ': a rail to grind');
        if (S.w >= 12) assert.ok(room.props.some(p => /^riser_[123]$/.test(p.key)), id + ': a big deck has a ramp (stepped)');
        assert.ok(S.strips === false && S.mood && S.mood.ambient < 1 && Array.isArray(S.lights) && S.lights.length === 0, id + ': no facility strips — the ship lights itself');
        const lit = room.props.filter(p => (HQ.catalogue[p.key] || {}).light).length;
        assert.ok(lit >= 1 && lit <= 10, id + ': ' + lit + ' prop lights');
        for (const n of ['floor', 'wall', 'dado', 'trim', 'ceiling']) assert.ok(HQ.textures[S[n]] || TERRAIN_RULES[S[n]], id + ': texture ' + S[n]);
        assert.strictEqual(S.floor, 'wood_planks', id + ': a wooden ship');
        assert.strictEqual(D.DOOR_TAPES.filter(t => t.where === id).length, 1, id + ': one tape');
    }
    assert.strictEqual(D.DOOR_TAPES.length, 100);
    /* the misc-kit rows: the same files _MISC_GLB names (the same-thing rule, MODEL_INDEX §9) */
    const misc = renderer.slice(renderer.indexOf('var _MISC_GLB = {'), renderer.indexOf('};', renderer.indexOf('var _MISC_GLB = {')));
    for (const [key, mk] of [['ship_cannon', 'cannon'], ['sea_chest', 'chest'], ['ship_anchor', 'anchor'], ['ship_lantern', 'lantern']]) {
        const c = HQ.catalogue[key];
        assert.ok(c && c.base === 'misc' && c.file, key + ': a misc-bucket catalogue row');
        assert.ok(misc.includes("'" + c.file + "'"), key + ': the file is _MISC_GLB.' + mk + '’s');
        assert.ok(new RegExp(mk + ':\\s*\'' + c.file.replace(/\./g, '\\.') + '\'').test(misc), key + ' names the same file as ' + mk);
        assert.ok(fs.readFileSync(__dirname + '/MODEL_INDEX.md', 'utf8').includes('`' + key + '`'), key + ' is in MODEL_INDEX.md');
    }
    assert.ok(HQ.catalogue.ship_cannon.block && HQ.catalogue.ship_cannon.foot >= 0.8, 'a gun blocks');
    assert.ok(HQ.catalogue.ship_lantern.ceil && HQ.catalogue.ship_lantern.light, 'a lantern hangs and lights');
    assert.strictEqual(HQ.rooms[BOARD + '_gundeck'].props.filter(p => p.key === 'ship_cannon').length, 4, 'four guns on the gun deck');
    assert.ok(HQ.rooms[BOARD + '_gundeck'].props.filter(p => p.key === 'ship_cannon').every(p => p.face === (p.x < 0 ? 0 : 180)), 'every gun runs out through its own side');
    assert.ok(HQ.rooms[BOARD + '_cabin'].props.some(p => p.key === 'false_window' && p.wall === 'w'), 'THE STERN WINDOWS look aft');
    assert.ok(HQ.rooms[BOARD + '_hold'].props.some(p => p.key === 'ship_anchor'), 'the spare anchor is stowed in the hold');
    assert.ok(HQ.rooms[BOARD + '_hold'].props.filter(p => p.key === 'floor_drain').length >= 2, 'the bilge');
    assert.match(dataSrc, /prebuilt_revenge: \[\n\s+\{ id: 'companionway', wall: 'n', x: -5, leaf: 'leaf_shabby_wood',/, 'the back-door row');
    assert.match(dataSrc, /a: \{ site: 'prebuilt_revenge', part: 'hold', wall: 'w', z: 0, sub: 'THE HATCH BELOW THE WATERLINE · TO ATLANTIS' \}/, 'the link end');
});
