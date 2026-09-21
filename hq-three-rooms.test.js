// hq-three-rooms.test.js — THE THREE ROOMS (2026-09-21): THE THIRTEENTH FLOOR
// (the facility, behind the crawlspace's second draught; the lift goes down
// only), THE NURSERY (the Haunted House's fifth bedroom, the door the lines
// call 237) and THE SHOWROOM (Disaster City, the tower lobby's ground-floor
// retail unit: six floor models wearing your face). Guards: the sheet (site +
// part + no number where a part; no number on the floor between), the doors
// (every one a pair with the same leaf; the draught secret at both ends; the
// lift a `proc: 'elevator'` door into the car), the clone spots, the nun who
// stays, the tapes (one per part; the hundred stays a hundred), the six procs
// (catalogued + built on a stub scene, the two text procs reading their row),
// the three by-id panels in map.js, the `each` variants of the floor between.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { loadGameData } = require('./load-data');
const D = loadGameData(), HQ = D.DOOR_HQ;
const TR = fs.readFileSync(__dirname + '/three-renderer.js', 'utf8');
const MP = fs.readFileSync(__dirname + '/map.js', 'utf8');
const at = (room, id) => (HQ.rooms[room].doors || []).find(d => d.id === id);
const FLOOR = 'thirteenth', NURSERY = 'site_prebuilt_haunted_nursery', SHOP = 'site_prebuilt_downtown_showroom';
const PROCS = ['directory_board', 'rocking_chair', 'crib_mobile', 'music_box', 'price_tag', 'sale_banner'];

test('the sheet: three box rooms; the nursery + the showroom wear site + part and no number, the floor between wears no number at all', () => {
    for (const id of [FLOOR, NURSERY, SHOP]) { const r = HQ.rooms[id]; assert.ok(r && r.kind === 'box', id + ' is a box room'); assert.ok(!r.roomNo, id + ' wears no number'); assert.ok(r.shell && r.shell.look && r.shell.strips === false && Array.isArray(r.shell.lights) && r.shell.lights.length === 0, id + ': its own light and a grade'); }
    assert.equal(HQ.rooms[NURSERY].site, 'prebuilt_haunted'); assert.equal(HQ.rooms[NURSERY].part, 'nursery');
    assert.equal(HQ.rooms[SHOP].site, 'prebuilt_downtown'); assert.equal(HQ.rooms[SHOP].part, 'showroom');
    assert.ok(!HQ.rooms[FLOOR].site, 'the floor between is the facility’s');
    assert.ok(D.hqSiteComplex('prebuilt_haunted').includes(NURSERY) && D.hqSiteComplex('prebuilt_downtown').includes(SHOP), 'both parts are on their complexes');
    assert.ok(!D.hqRoomRegister().some(r => [FLOOR, NURSERY, SHOP].includes(r.id)), 'none of the three is a numbered place in the register');
    for (const id of [FLOOR, NURSERY, SHOP]) { const r = HQ.rooms[id]; assert.ok(r.props.some(p => p.key === 'railing_1m'), id + ': THE PARK RULE (a rail)'); assert.ok(r.props.filter(p => (HQ.catalogue[p.key] || {}).light).length <= 10, id + ': ≤ 10 prop lights'); }
});

test('the doors: the crawlspace ⇄ the floor between is a draught at both ends; the lift goes DOWN into the car and lists the floor the panel has not got; the landing ⇄ the nursery and the lobby ⇄ the showroom are pairs on one leaf', () => {
    const a = at('crawlspace', 'thirteen'), b = at(FLOOR, 'crawl');
    assert.ok(a && b && a.secret === true && b.secret === true && a.leaf == null && b.leaf == null && /DRAUGHT/.test(a.label) && /DRAUGHT/.test(b.label), 'a draught at both ends');
    assert.ok(a.action.room === FLOOR && a.action.at === 'crawl' && b.action.room === 'crawlspace' && b.action.at === 'thirteen', 'the pair');
    const lift = at(FLOOR, 'elevator');
    assert.ok(lift && lift.proc === 'elevator' && lift.leaf == null && lift.action.room === 'car' && lift.action.at === 'panel', 'the lift is the car’s door');
    assert.deepEqual(lift.floors.join(','), '13', 'the panel lists the one floor the car has no button for');
    assert.ok(!(HQ.elevator.stops || []).some(st => st.room === FLOOR), 'the car never stops here — nothing comes back up this way');
    const up = at('site_prebuilt_haunted_upstairs', 'nursery'), dn = at(NURSERY, 'landing');
    assert.ok(up && dn && up.action.room === NURSERY && up.action.at === 'landing' && dn.action.room === 'site_prebuilt_haunted_upstairs' && dn.action.at === 'nursery' && up.leaf === dn.leaf && up.leaf === 'leaf_white_wood', 'the fifth door on the landing');
    assert.ok(up.wall === 'n' && Math.abs(up.x - at('site_prebuilt_haunted_upstairs', 'attic').x) > 2.6, 'clear of the hatch on the same wall');
    const lb = at('site_prebuilt_downtown_lobby', 'showroom'), sr = at(SHOP, 'lobby');
    assert.ok(lb && sr && lb.action.room === SHOP && lb.action.at === 'lobby' && sr.action.room === 'site_prebuilt_downtown_lobby' && sr.action.at === 'showroom' && lb.leaf === sr.leaf && lb.leaf === 'leaf_glass', 'the shop off the lobby');
    const rank = new Set(D.DOOR_TEXT.CLEARANCE.map(r => r.door));
    for (const id of [FLOOR, NURSERY, SHOP]) for (const d of HQ.rooms[id].doors) assert.ok(!rank.has(d.leaf), id + '/' + d.id + ': never a rank leaf');
    /* the map walks them: every one reachable from the foyer (the directory guard's rule) */
    const g = D.hqMapGraph();
    for (const id of [FLOOR, NURSERY, SHOP]) assert.ok(g.nodes.some ? g.nodes.some(n => (n.id || n) === id) : (g.nodes[id] || (g.rooms && g.rooms[id])), id + ' is on the map');
});

test('the people: the floor between and the showroom stand YOU there (clone spots); the nurse stays beside the chair; every spot has a line; every spot stands inside its walls', () => {
    const F = HQ.rooms[FLOOR], N = HQ.rooms[NURSERY], S = HQ.rooms[SHOP];
    assert.ok(F.npcSpots.length === 1 && F.npcSpots[0].clone === true && Array.isArray(F.npcSpots[0].say), 'THE OTHER ONE in the corner');
    assert.equal(S.npcSpots.filter(s => s.clone).length, 6, 'six floor models');
    assert.ok(S.npcSpots.some(s => s.race === 'politician' && s.stay === true), 'the floor manager at the till, never leaving it');
    assert.ok(N.npcSpots.length === 1 && N.npcSpots[0].race === 'nun' && N.npcSpots[0].stay === true, 'the nurse');
    assert.ok(D.AVAILABLE_RACES.includes('nun') && D.AVAILABLE_RACES.includes('politician'));
    for (const [id, r] of [[FLOOR, F], [NURSERY, N], [SHOP, S]]) for (const sp of r.npcSpots) {
        assert.ok(Array.isArray(sp.say) && sp.say.length, id + ': a spot without a line');
        assert.ok(Math.abs(sp.x) <= r.shell.w / 2 - 0.45 && Math.abs(sp.z) <= r.shell.d / 2 - 0.45, id + ': spot in a wall');
        assert.ok(!D.hqSpotRoams(id, r.npcSpots.indexOf(sp), sp), id + ': nobody in these rooms wanders off');
    }
    /* THE FLOOR BETWEEN's two `each` variants: the chairs turned + the other one in the middle; VACANT + the stain where it stood */
    assert.ok(F.variants && F.variants.turned && F.variants.vacant && F.variants.turned.when.each && F.variants.vacant.when.each, 'two variants rolled on every entry');
    assert.equal(F.variants.turned.npcSpots.length, 1); assert.equal(F.variants.vacant.npcSpots.length, 0);
    assert.ok(F.variants.vacant.add.some(p => p.key === 'floor_stain' && p.x === F.npcSpots[0].x && p.z === F.npcSpots[0].z), 'the stain is where it stood');
    const ids = Object.keys(F.variants); const seen = new Set();
    for (let n = 0; n < 12; n++) { const v = D.hqVariantRollEach(FLOOR, { door: { hq: { variantSeed: 7 } } }, n, null); if (v) seen.add(v); assert.ok(v == null || ids.includes(v)); }
    assert.ok(seen.size >= 1, 'the roll lands on a variant');
});

test('the tapes: one per part (THE FIFTH BEDROOM, FLOOR MODEL), the hundred stays a hundred, the Strip and the streets keep one each', () => {
    const T = D.DOOR_TAPES;
    assert.equal(T.length, 100);
    assert.ok(T.some(t => t.where === NURSERY && t.title === 'THE FIFTH BEDROOM'), 'the nursery’s tape');
    assert.ok(T.some(t => t.where === SHOP && t.title === 'FLOOR MODEL'), 'the showroom’s tape');
    assert.equal(T.filter(t => t.where === 'site_prebuilt_strip_streets').length, 1); assert.equal(T.filter(t => t.where === 'site_prebuilt_downtown_streets').length, 1);
    assert.ok(!T.some(t => t.where === FLOOR), 'the floor between has no tape (its purpose is the directory)');
    assert.ok(HQ.rooms[FLOOR].counters.some(c => c.id === 'thirteen' && c.action && !c.action.overlay && !c.action.fn), 'THE DIRECTORY is a by-id panel');
});

test('the six procs: catalogued (shaped), built on a stub scene, the movers push a ticker, the two text procs read their row', () => {
    for (const k of PROCS) { const c = HQ.catalogue[k]; assert.ok(c && c.proc === k, k + ' catalogued'); assert.match(TR, new RegExp('\\n        ' + k + ': function \\(U'), k + ' built'); }
    assert.ok(HQ.catalogue.rocking_chair.block && HQ.catalogue.rocking_chair.foot > 0, 'the chair blocks');
    assert.ok(HQ.catalogue.crib_mobile.ceil === true && HQ.catalogue.directory_board.wall === true && HQ.catalogue.sale_banner.wall === true, 'the mobile hangs; the board and the banner hang on a wall');
    const block = TR.slice(TR.indexOf('THE THREE ROOMS (2026-09-21'), TR.indexOf('/* ── THE LANDMARK: THE WATCHER'));
    for (const k of ['rocking_chair', 'crib_mobile', 'music_box']) { const b = block.slice(block.indexOf(k + ': function')); assert.match(b.slice(0, b.indexOf('\n        },')), /_hq\.tickers\.push\(/, k + ' moves on a ticker'); }
    assert.match(block, /price_tag: function \(U, p\)[\s\S]*?p\.text/, 'the tag reads its row');
    assert.match(block, /sale_banner: function \(U, p\)[\s\S]*?p\.text/, 'the banner reads its row');
    assert.ok(HQ.rooms[SHOP].props.filter(p => p.key === 'price_tag').every(p => Array.isArray(p.text)), 'every tag on the shop floor names its word');
    /* built: a stub THREE, the helpers the block reads, every builder returns a group with children */
    const stub = () => { const O = function () { this.children = []; this.position = { x: 0, y: 0, z: 0, set() {}, copy() {} }; this.rotation = { x: 0, y: 0, z: 0, set() {} }; this.scale = { set() {} }; this.userData = {}; }; O.prototype.add = function (c) { this.children.push(c); return this; }; O.prototype.getWorldPosition = function (v) { return v; }; O.prototype.traverse = function (f) { f(this); this.children.forEach(c => c.traverse && c.traverse(f)); }; return O; };
    const G = stub(), M = stub();
    const geo = function () { this.attributes = { position: { count: 3, getX: () => 0, getY: () => 0, setY() {} } }; this.computeVertexNormals = () => {}; };
    const THREE = { Group: G, Mesh: function (g, m) { M.call(this); this.geometry = g; this.material = m; this.isMesh = true; }, Vector3: function (x, y, z) { this.x = x || 0; this.y = y || 0; this.z = z || 0; },
        CylinderGeometry: geo, BoxGeometry: geo, SphereGeometry: geo, TorusGeometry: geo, PlaneGeometry: geo, ConeGeometry: geo, OctahedronGeometry: geo, CircleGeometry: geo, RingGeometry: geo,
        MeshPhongMaterial: function (o) { Object.assign(this, o); }, MeshLambertMaterial: function (o) { Object.assign(this, o); }, MeshBasicMaterial: function (o) { Object.assign(this, o); }, DoubleSide: 2 };
    THREE.Mesh.prototype = Object.create(M.prototype);
    const ctx = { THREE, window: {}, _hq: { tickers: [], player: { x: 0, z: 0 } }, _hqProcSeed: 0, _hqUnits: () => 100,
        _hqMat: (n, u, v, o) => Object.assign({ n }, o || {}), _hqBasic: c => ({ c }), _hqBox: (w, h, d, m) => new THREE.Mesh(new geo(), m), _hzGlowSprite: () => new THREE.Mesh(new geo(), {}), _hzTextTex: () => null, _hqProcBuilders: {}, Math };
    vm.createContext(ctx);
    vm.runInContext(block.slice(block.indexOf('Object.assign(_hqProcBuilders, {')), ctx);
    for (const k of PROCS) { const g = ctx._hqProcBuilders[k](100, { text: ['SOLD'], wall: k === 'sale_banner' ? 'n' : undefined }); assert.ok(g && g.children.length > 0, k + ' builds'); }
    assert.equal(ctx._hq.tickers.length, 3, 'three tickers: the chair, the mobile, the dancer');
    for (const t of ctx._hq.tickers) t(0.016, 1000);   // a tick throws nothing
});

test('the panels: THE DIRECTORY, THE TAG and THE RECEIPT are by-id panels in map.js; the lobby door still says there is no 13', () => {
    for (const id of ['thirteen', 'tag', 'receipt']) assert.match(MP, new RegExp("if \\(c\\.id === '" + id + "'\\) \\{"), id + ' panel');
    assert.match(MP, /hqPartyShifts\(prof\)/, 'the receipt itemises the party');
    assert.match(MP, /There is no 13\./, 'the lift door’s panel');
    for (const [room, cid] of [[FLOOR, 'thirteen'], [NURSERY, 'tag'], [SHOP, 'receipt']]) { const c = HQ.rooms[room].counters.find(x => x.id === cid); assert.ok(c && c.action && Object.keys(c.action).length === 0 && c.verb, room + '/' + cid + ': action {} — the panel by id'); }
});
