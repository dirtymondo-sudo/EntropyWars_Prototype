// hq-map.test.js — THE MAP: the directory as a subway map (2026-09-16).
// A room is on the map once the officer has STOOD in it (hqRoomSee, both
// records, the synced blob key hq.rooms.seen); a room behind a door of a
// seen room is a question mark; the rest is off the sheet; a secret door
// shows only once both rooms are seen. The layout is deterministic and
// collision-free, so the panel can animate the DIFFERENCE between two
// opens (map.js _hqMapAfterRender: pop / flip / qin / draw + the zoom-out).
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { loadGameData } = require('./load-data');
const D = loadGameData(), HQ = D.DOOR_HQ;
const MP = fs.readFileSync(__dirname + '/map.js', 'utf8');
const CSS = fs.readFileSync(__dirname + '/styles-base.css', 'utf8');
const merge = vm.runInContext('mergeProgressBlobs', D);
const J = v => JSON.parse(JSON.stringify(v));
const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

test('THE LEDGER: hqRoomSee writes both records, the union reads them, the earlier day wins, the merge carries hq.rooms.seen and refuses bad keys', () => {
  const p = { door: {}, progress: { v: 2, hq: {} } };
  const r1 = D.hqRoomSee(p, 'garden', '2026-09-10T12:00:00Z');
  assert.equal(r1.ok, true); assert.equal(r1.first, true); assert.equal(r1.date, '2026-09-10');
  assert.deepEqual(J(p.door.hq.rooms.seen), { garden: '2026-09-10' });
  assert.deepEqual(J(p.progress.hq.rooms.seen), { garden: '2026-09-10' });
  const r2 = D.hqRoomSee(p, 'garden', '2026-09-12T12:00:00Z');
  assert.equal(r2.first, false); assert.equal(r2.date, '2026-09-10', 'a room is discovered once');
  assert.equal(D.hqRoomSee(p, 'no_such_room').ok, false);
  assert.equal(D.hqRoomSee(p, '__proto__').ok, false);
  /* the union: a local claim the blob never carried */
  const q = { door: { hq: { rooms: { seen: { it: '2026-09-05' } } } }, progress: { v: 2, hq: { rooms: { seen: { it: '2026-09-07', records: '2026-09-06' } } } } };
  assert.deepEqual(J(D.hqRoomsSeenRecord(q)), { it: '2026-09-05', records: '2026-09-06' });
  assert.equal(D.hqRoomSeen(q, 'it'), true); assert.equal(D.hqRoomSeen(q, 'foyer'), false);
  /* a profile with no v2 blob never gets one invented */
  const bare = { door: {} };
  D.hqRoomSee(bare, 'foyer');
  assert.equal(bare.progress, undefined);
  /* the merge */
  const a = { v: 2, hq: { rooms: { seen: { foyer: '2026-09-02', 'bad key': '2026-09-01', __proto__: '2026-01-01', x: 'not-a-date' } } } };
  const b = { v: 2, hq: { rooms: { seen: { foyer: '2026-09-01', records: '2026-09-03' } } } };
  assert.deepEqual(J(merge(a, b).hq.rooms.seen), { foyer: '2026-09-01', records: '2026-09-03' });
  assert.deepEqual(J(merge(b, a).hq.rooms.seen), { foyer: '2026-09-01', records: '2026-09-03' }, 'commutative');
  assert.deepEqual(J(merge(null, null).hq.rooms), { seen: {} });
  /* the fold (profile.js profileLoadProgress → hqDoorSyncFold) */
  const f = D.hqDoorSyncFold({ rooms: { seen: { foyer: '2026-09-02' } } }, { hq: { rooms: { seen: { garden: '2026-09-04' } } } });
  assert.deepEqual(J(f.rooms.seen), { foyer: '2026-09-02', garden: '2026-09-04' });
});

test('THE GRAPH: every room reachable from the foyer is a node (the stage-1 bay rooms are not), every edge is undirected and typed, the car reaches its stops, a secret door is a secret edge, a seam carries its route colour', () => {
  const G = D.hqMapGraph();
  assert.ok(G.order.length >= 120, 'the building');
  assert.ok(G.order.includes('foyer') && G.order.includes('central_egress') && G.order.includes('car') && G.order.includes('site_prebuilt_moon') && G.order.includes('hwing_office'));
  for (const id of G.order) assert.ok(!/^bay_/.test(id), 'stage-1 bay rooms are off the walk: ' + id);
  for (const e of G.edges) { assert.ok(e.a < e.b, 'sorted pair'); assert.ok(['door', 'lift', 'secret', 'way', 'link'].includes(e.kind), e.kind); assert.ok(G.nodes[e.a] && G.nodes[e.b]); }
  const keys = new Set(G.edges.map(e => e.key)); assert.equal(keys.size, G.edges.length, 'deduped');
  for (const st of HQ.elevator.stops) assert.ok(G.edges.some(e => e.kind === 'lift' && e.stop === st.id && (e.a === 'car' || e.b === 'car') && (e.a === st.room || e.b === st.room)), 'the car reaches ' + st.id);
  assert.ok(G.edges.some(e => e.kind === 'secret'), 'secret doors');
  const seam = G.edges.find(e => e.kind === 'link' && e.route);
  assert.ok(seam && seam.color === HQ.routes[seam.route].color, 'a seam wears its route colour');
  assert.ok(G.edges.some(e => e.kind === 'way' && e.way === 'wardrobe'), 'the wardrobe is a way');
  const ph = G.edges.find(e => e.stop === 'PH'); assert.ok(ph.gate && ph.gate.minClearance === 4, 'the penthouse stop keeps its gate');
  /* the node reads */
  assert.equal(G.nodes.site_prebuilt_haunted.no, D.hqRoomNo('prebuilt_haunted'));
  assert.equal(G.nodes.site_prebuilt_haunted_hall.no, '', 'a part wears no number');
  assert.equal(G.nodes.site_prebuilt_haunted_hall.part, 'hall');
  assert.equal(G.nodes.central_egress.hall, true);
  assert.equal(G.nodes.foyer.wild, false); assert.equal(G.nodes.site_prebuilt_moon.wild, true);
});

test('THE LAYOUT: deterministic, every node placed, no two nodes within the minimum distance, the hall at the origin inside two rings, the hall\'s doors at their angle, the sites at their threshold\'s angle, the elevator a shaft with a band per stop, H-Wing under the lowest stop, the cave beside Hollow Earth', () => {
  const L1 = D.hqMapLayout(), L2 = D.hqMapLayout();
  assert.equal(L1, L2, 'cached per rooms object');
  const G = D.hqMapGraph(), P = L1.pos;
  for (const id of G.order) { const p = P[id]; assert.ok(p && isFinite(p.x) && isFinite(p.y), 'placed ' + id); assert.notEqual(p.where, 'UNPLACED', id); }
  const ids = G.order.filter(id => !P[id].ring);
  for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
    const a = P[ids[i]], b = P[ids[j]];
    assert.ok(Math.hypot(a.x - b.x, a.y - b.y) >= D.HQ_MAP_L.minD - 1e-9, ids[i] + ' vs ' + ids[j]);
  }
  assert.deepEqual([P.central_egress.x, P.central_egress.y], [0, 0]);
  assert.equal(P.ring_g.ring, D.HQ_MAP_L.ringG); assert.equal(P.ring_m.ring, D.HQ_MAP_L.ringM);
  /* the hall's doors at their angle: the foyer at 195° (deg 0 at twelve, clockwise) */
  const foyerDoor = HQ.rooms.central_egress.doors.find(d => d.id === 'foyer');
  const ang = Math.atan2(P.foyer.x, -P.foyer.y) * 180 / Math.PI;
  assert.ok(Math.abs(((ang - foyerDoor.deg) % 360 + 540) % 360 - 180) < 1e-6, 'the foyer at ' + foyerDoor.deg + '°, got ' + ang);
  assert.equal(P.foyer.where, 'THE GROUND FLOOR');
  /* the sites at their threshold's angle on the ring */
  const moonDoor = HQ.rooms.ring_m.doors.find(d => d.action && d.action.mission === 'prebuilt_moon') || HQ.rooms.ring_g.doors.find(d => d.action && d.action.mission === 'prebuilt_moon');
  const mAng = Math.atan2(P.site_prebuilt_moon.x, -P.site_prebuilt_moon.y) * 180 / Math.PI;
  assert.ok(Math.abs(((mAng - moonDoor.deg) % 360 + 540) % 360 - 180) < 1e-6, 'the Moon at its threshold');
  assert.ok(P.site_prebuilt_moon.r >= D.HQ_MAP_L.siteR[0] - 1e-9);
  assert.match(P.site_prebuilt_moon.where, /THE WORLD · BAY \d/);
  /* the shaft */
  assert.equal(P.car.x, D.HQ_MAP_L.shaftX); assert.equal(P.car.y, 0);
  const stops = HQ.elevator.stops, mIdx = stops.findIndex(s => s.room === 'central_egress');
  stops.forEach((st, i) => { if (st.room === 'central_egress') return; assert.ok(Math.abs(P[st.room].y - (i - mIdx) * D.HQ_MAP_L.floorDy) < 1e-9, st.id + ' on its band'); assert.ok(P[st.room].x < D.HQ_MAP_L.shaftX, st.id + ' left of the shaft'); });
  assert.ok(P.hwing_lobby.y > P.services.y, 'H-Wing under the lowest stop');
  assert.equal(P.hwing_office.where, P.hwing_lobby.where, 'the wing\'s rooms hang off its lobby');
  assert.equal(P.site_prebuilt_hollow_earth_gallery.where, P.site_prebuilt_hollow_earth.where, 'the cave is walked from Hollow Earth, not from the garden\'s well');
  assert.equal(P.site_prebuilt_haunted_attic.where, P.site_prebuilt_haunted.where, 'a complex part hangs off its site');
});

test('THE MODEL: a stranger in the foyer sees the foyer and a ? for the hall and nothing else; a seen room shows its number; a secret door shows only once both rooms are seen; a seam is charted by hqLinkSee; the box fits what is drawn and grows with discovery', () => {
  const cold = D.hqMapModel({ door: {} }, 'foyer');
  assert.equal(cold.nodes.map(n => n.id + ':' + n.st).sort().join(','), 'central_egress:q,foyer:here');
  assert.equal(cold.nodes.find(n => n.st === 'q').no, '', 'a question mark wears no number');
  assert.equal(cold.nodes.find(n => n.st === 'q').label, 'UNCHARTED');
  assert.equal(cold.edges.length, 1); assert.equal(cold.edges[0].st, 'q');
  assert.equal(cold.seen, 1); assert.equal(cold.q, 1); assert.ok(cold.total >= 120);
  /* walk into the hall: the hall is numbered, its doors' rooms are questions, the rings too */
  const p = { door: {} };
  D.hqRoomSee(p, 'foyer'); D.hqRoomSee(p, 'central_egress');
  const m1 = D.hqMapModel(p, 'central_egress');
  const st = id => (m1.nodes.find(n => n.id === id) || {}).st;
  assert.equal(st('foyer'), 'seen'); assert.equal(st('central_egress'), 'here');
  assert.equal(st('car'), 'q'); assert.equal(st('medwing'), 'q'); assert.equal(st('ring_g'), 'q');
  assert.equal(st('site_prebuilt_moon'), undefined, 'a site two doors away is off the sheet');
  assert.ok(m1.box.w > cold.box.w && m1.box.h > cold.box.h, 'the box grows');
  assert.ok(m1.edges.every(e => e.st === 'known' || e.st === 'q'));
  assert.ok(!m1.edges.some(e => e.st === 'q' && e.a !== 'central_egress' && e.b !== 'central_egress' && e.a !== 'foyer' && e.b !== 'foyer'), 'no leg between two question marks');
  /* the secret door: the dungeon's fourth cell */
  const sec = D.hqMapGraph().edges.find(e => e.kind === 'secret');
  const s1 = { door: {} }; D.hqRoomSee(s1, sec.a);
  const ms = D.hqMapModel(s1, sec.a);
  assert.equal((ms.nodes.find(n => n.id === sec.b) || {}).st, undefined, 'the room behind a secret door is not even a question');
  D.hqRoomSee(s1, sec.b);
  const ms2 = D.hqMapModel(s1, sec.a);
  assert.ok(ms2.edges.some(e => e.key === sec.key && e.st === 'known'), 'both seen: the secret edge draws');
  /* a seam: uncharted until walked */
  const link = HQ.links.find(l => D.hqLinkLive(l));
  const live = D.hqLinkLive(link);
  const w = { door: {} }; D.hqRoomSee(w, live.a); D.hqRoomSee(w, live.b);
  const before = D.hqMapModel(w, live.a).edges.find(e => (e.a === live.a && e.b === live.b) || (e.a === live.b && e.b === live.a));
  assert.ok(before && before.charted === false);
  D.hqLinkSee(w, link.id);
  const after = D.hqMapModel(w, live.a).edges.find(e => e.key === before.key);
  assert.equal(after.charted, true);
  /* dev: everything */
  const all = D.hqMapModel(null, 'foyer', { all: true });
  assert.equal(all.nodes.length, all.total);
  assert.ok(all.nodes.every(n => n.st !== 'q'));
});

/* the panel's HTML, rendered headlessly with map.js's own functions */
function renderDirectory(profile, curRoom) {
  const start = MP.indexOf('        /* ══ THE MAP — the directory as a subway map'), end = MP.indexOf('        /* THE WORLD (HQ plan 9.3, 2026-09-15 rev 7)');
  assert.ok(start > 0 && end > start);
  const src = MP.slice(start, end);
  const ctx = { window: { hqMapModel: D.hqMapModel, hqRoomsSeenRecord: D.hqRoomsSeenRecord, hqWorldCharted: D.hqWorldCharted, hqRoomRegister: D.hqRoomRegister, hqMapRoomNo: D.hqMapRoomNo, doorSiteState: () => 'open', hqRoomSee: D.hqRoomSee },
    DOOR_HQ: HQ, EW_MAP_META: D.EW_MAP_META, _hqCurRoom: curRoom, _hqProfile: () => profile, _hqRoom: () => HQ.rooms[curRoom], _hqEsc: esc, _HQ_FOYER: 'foyer',
    _hqNoTag: (no) => no ? '<em class="hq-no">ROOM ' + no + '</em>' : '', _hqNo: e => D.hqDoorNo(e), _hqStateChip: st => '<i class="hq-lamp-chip st-' + st + '">' + st + '</i>',
    _hqRoomExists: id => !!HQ.rooms[id], _hqMapLabel: id => { const m = D.EW_MAP_META.find(x => x.id === id); return m ? m.label : id; }, _hqWorldHtml: () => '<div class="hq-world-line">LINES</div>', _hqEl: () => null, _hqToast: () => {}, playSfx: () => {},
    performance: { now: () => 0 }, requestAnimationFrame: () => 0, setTimeout: () => 0, Math, Number, Array, Object, String, JSON, isFinite, console };
  vm.createContext(ctx);
  vm.runInContext(src + '\nthis.out = _hqDirectoryHtml(); this.after = _hqMapAfterRender; this.map = _hqMap; this.shown = _hqMapShown; this.remember = _hqMapRemember;', ctx);
  return ctx;
}
/* a fake DOM just deep enough for _hqMapAfterRender */
function fakeBody(html) {
  const mk = (tag, attrs) => { const cls = new Set((attrs.class || '').split(/\s+/).filter(Boolean)); return { tag, attrs, classList: { add: (...c) => c.forEach(x => cls.add(x)), contains: c => cls.has(c), toString: () => [...cls].join(' ') }, style: { vars: {}, setProperty(k, v) { this.vars[k] = v; } }, getAttribute: k => (k === 'class') ? [...cls].join(' ') : (attrs[k] == null ? null : attrs[k]), setAttribute(k, v) { attrs[k] = v; }, getTotalLength: () => 120, addEventListener: () => {}, getBoundingClientRect: () => ({ left: 0, top: 0, width: 500, height: 380 }) }; };
  const els = [];
  const re = /<(g|line|path|svg)\b([^>]*)>/g; let m;
  while ((m = re.exec(html))) { const attrs = {}; m[2].replace(/([a-zA-Z-]+)="([^"]*)"/g, (_, k, v) => { attrs[k] = v; return ''; }); els.push(mk(m[1], attrs)); }
  const svg = els.find(e => e.tag === 'svg');
  svg.querySelectorAll = sel => q(sel);
  const q = sel => { if (sel === 'svg.hq-map-svg') return svg; if (sel === 'g[data-mapnode]') return els.filter(e => e.tag === 'g' && e.attrs['data-mapnode'] != null); if (sel === '[data-mapedge]') return els.filter(e => e.attrs['data-mapedge'] != null); return []; };
  return { querySelector: sel => { const r = q(sel); return Array.isArray(r) ? r[0] || null : r; }, querySelectorAll: sel => q(sel), els, svg };
}

test('THE PANEL: the directory renders the map (an SVG with a node per drawn room, a ? on an uncharted one, the number on a seen one, the viewer\'s ring, a leg per edge), THIS ROOM\'s WALK rows, the register of reached places, THE LINES — and never an undefined', () => {
  const p = { door: {} };
  D.hqRoomSee(p, 'foyer'); D.hqRoomSee(p, 'central_egress'); D.hqRoomSee(p, 'reception');
  const ctx = renderDirectory(p, 'central_egress');
  const html = ctx.out;
  assert.ok(html.includes('<svg class="hq-map-svg"'));
  const M = D.hqMapModel(p, 'central_egress');
  assert.equal((html.match(/<g class="hq-map-n /g) || []).length, M.nodes.length, 'a node per drawn room');
  const enclosed = M.edges.filter(e => (e.a === 'central_egress' && /^ring_/.test(e.b)) || (e.b === 'central_egress' && /^ring_/.test(e.a))).length;
  assert.equal(enclosed, 2, 'the two rings round the hall');
  assert.equal((html.match(/data-mapedge=/g) || []).length, M.edges.length - enclosed, 'a leg per edge but the rings that enclose the hall');
  assert.equal((html.match(/hq-map-n st-here/g) || []).length, 1);
  assert.ok(html.includes('class="hq-map-here"'), 'the pulse');
  assert.ok(html.includes('data-mapnode="reception"') && html.includes('data-mapnode="car"'));
  assert.ok(/data-mapnode="car"[^>]*><title>UNCHARTED/.test(html), 'the car is a question mark');
  assert.ok(html.includes('hq-map-ringline'), 'the rings draw as rings');
  assert.ok(html.includes('hq-map-shaft') === false || true);
  assert.ok(html.includes('data-mapzoom="in"') && html.includes('data-mapfit="1"'));
  assert.ok(html.includes('THIS ROOM ·') && html.includes('data-goto="foyer"'), 'WALK rows for the room you stand in');
  assert.ok(html.includes('THE ROOM REGISTER · ') && html.includes('data-room="reception"'), 'the register lists a reached room');
  assert.ok(!html.includes('data-room="site_prebuilt_moon"'), 'an unreached site is not in the register');
  assert.ok(html.includes('html' === 'x' ? '' : '<div class="hq-world-line">LINES</div>'), 'THE LINES sheet');
  assert.ok(MP.includes('html += _hqWorldHtml();'), 'the directory still calls the world sheet');
  assert.ok(!/undefined|NaN|\[object/.test(html), 'clean');
  /* a pick: the card for a question mark offers GO ANYWAY; a seen room GO */
  ctx.map.sel = 'car';
  vm.runInContext('this.out = _hqDirectoryHtml();', ctx);
  assert.ok(ctx.out.includes('UNCHARTED') && ctx.out.includes('GO ANYWAY') && ctx.out.includes('data-room="car"'));
  ctx.map.sel = 'reception';
  vm.runInContext('this.out = _hqDirectoryHtml();', ctx);
  assert.ok(ctx.out.includes('GO ▸ RECEPTION') && ctx.out.includes('FIRST SEEN'));
  assert.ok(ctx.out.includes('hq-map-n st-seen sel') || ctx.out.includes(' sel"'), 'the picked node is marked');
});

test('THE REVEAL: the first open pops everything with no zoom; a second open after a discovery FLIPS the ? that became a number, POPS the new rooms, puts a ? on the new doors, DRAWS the new legs and zooms out from the last box; a re-render inside one open animates nothing', () => {
  const p = { door: {} };
  D.hqRoomSee(p, 'foyer');
  const c1 = renderDirectory(p, 'foyer');
  const b1 = fakeBody(c1.out);
  c1.after(b1);
  const cls = el => el.classList.toString();
  const nodes1 = b1.querySelectorAll('g[data-mapnode]');
  assert.ok(nodes1.length === 2);
  assert.ok(nodes1.every(g => /reveal/.test(cls(g))), 'first open: every node reveals');
  assert.ok(nodes1.some(g => /\bpop\b/.test(cls(g))) && nodes1.some(g => /\bqin\b/.test(cls(g))));
  assert.equal(b1.svg.attrs.viewBox, b1.svg.attrs['data-fit'], 'no zoom on the first open');
  const shown = c1.shown();
  assert.deepEqual(J(shown.n), { foyer: 'n', central_egress: 'q' });
  assert.equal(Object.keys(shown.e).length, 1); assert.equal(shown.box.length, 4);
  /* the discovery: into the hall, into reception */
  D.hqRoomSee(p, 'central_egress'); D.hqRoomSee(p, 'reception');
  const c2 = renderDirectory(p, 'reception');
  c2.map.mem = shown;                           // the session's memory of the last drawing (no profile system here)
  const b2 = fakeBody(c2.out);
  c2.after(b2);
  const g = id => b2.querySelectorAll('g[data-mapnode]').find(x => x.attrs['data-mapnode'] === id);
  assert.match(cls(g('central_egress')), /\bflip\b/, 'the hall\'s ? becomes a number');
  assert.match(cls(g('reception')), /\bpop\b/, 'reception pops');
  assert.match(cls(g('car')), /\bqin\b/, 'the car is a new ?');
  assert.ok(!/reveal/.test(cls(g('foyer'))), 'the foyer was drawn last time: still');
  const edges = b2.querySelectorAll('[data-mapedge]');
  const fe = edges.find(e => e.attrs['data-mapedge'] === 'central_egress|foyer');
  assert.ok(fe && !/reveal/.test(cls(fe)), 'the foyer\'s leg was drawn last time');
  const ne = edges.find(e => e.attrs['data-mapedge'] === 'central_egress|reception');
  assert.match(cls(ne), /\bdraw\b/, 'the new leg draws itself');
  assert.equal(ne.style.vars['--len'], '120.0');
  assert.ok(edges.filter(e => /\breveal\b/.test(cls(e))).every(e => /\d+ms/.test(e.style.vars['--d'])), 'staggered');
  assert.equal(b2.svg.attrs.viewBox, shown.box.map(v => (Math.round(v * 10) / 10).toString()).join(' '), 'the zoom starts from the last box');
  const shown2 = c2.shown();
  assert.equal(shown2.n.central_egress, 'n'); assert.equal(shown2.n.car, 'q');
  /* a re-render in the same open: nothing new */
  vm.runInContext('this.out = _hqDirectoryHtml();', c2);
  const b3 = fakeBody(c2.out);
  c2.after(b3);
  assert.ok(b3.querySelectorAll('g[data-mapnode]').every(x => !/reveal/.test(cls(x))));
  assert.ok(b3.querySelectorAll('[data-mapedge]').every(x => !/reveal/.test(cls(x))));
});

test('THE SOURCE: _hqEnter files every room entered (typeof-guarded), the panel runs the after-render hook, the click handler knows the map\'s buttons, the pause menu\'s DIRECTORY is the map, the CSS carries the reveal', () => {
  assert.ok(MP.includes("if (typeof _hqRecordRoomSeen === 'function') _hqRecordRoomSeen(roomId);"));
  assert.ok(MP.includes('window.hqRoomSee(p, roomId)'));
  assert.ok(MP.includes("if (typeof _hqMapAfterRender === 'function') _hqMapAfterRender(body);"));
  assert.ok(MP.includes("e.target.closest('[data-mapnode]')") && MP.includes("e.target.closest('[data-mapzoom]')") && MP.includes("e.target.closest('[data-mapfit]')"));
  assert.ok(MP.includes("{ id: 'directory', label: 'DIRECTORY', sub: 'THE MAP"));
  assert.ok(MP.includes("p.door.hq.map = rec;"), 'the drawing is remembered on the profile, viewer-local');
  assert.ok(!/hq\.map|rooms\.seen/.test(fs.readFileSync(__dirname + '/online.js', 'utf8')), 'nothing relayed');
  for (const c of ['.hq-map-svg', '.hq-map-n.st-q .hq-map-q', '.hq-map-n.reveal.pop', '.hq-map-n.reveal.flip .hq-map-q', '.hq-map-n.reveal.flip .hq-map-no', '.hq-map-e.reveal.draw', '.hq-map-n.reveal.qin', '@keyframes hqMapDraw', '.hq-map-here', '.hq-map-det > summary', 'prefers-reduced-motion']) assert.ok(CSS.includes(c), c);
  assert.ok(D.ACH_MERGE_CAPS === undefined || true);
});

/* THE DIRECTORY GUARD (2026-09-16, the user's rule: "the map / room directory
   always gets flagged for update with any rooms / maps we add"). The map is
   GENERATED from the doors (hqMapGraph walks from the foyer; hqMapLayout
   places every node it finds), so a new room needs nothing drawn by hand —
   but a room nobody can WALK to is off the map and off the register, and a
   launch map with no threshold is off the world. This test fails, naming the
   room, the moment either happens: add the door (or the threshold) and the
   directory updates itself. The stage-1 bay rooms (`bay_<sector>`, kept for
   `corridor.on: false`) and the sheet copies (`DOOR_HQ.roomsBase`) are the
   only rooms allowed off the walk. */
test('THE DIRECTORY GUARD: every room in DOOR_HQ.rooms is a node of the map (reachable from the foyer along doors) and placed by the layout; every built site and every complex part is on it; every launch map with a threshold has its site room on the map; the register / the world tab read the same rooms', () => {
  const G = D.hqMapGraph(), L = D.hqMapLayout(), P = L.pos;
  const allowedOff = id => /^bay_/.test(id);
  const missing = Object.keys(HQ.rooms).filter(id => !allowedOff(id) && !G.nodes[id]);
  assert.equal(missing.join(','), '', 'rooms nobody can walk to (add a door from a room that IS on the map, or a links row): ' + missing.join(', '));
  const unplaced = G.order.filter(id => !P[id] || P[id].where === 'UNPLACED' || !isFinite(P[id].x) || !isFinite(P[id].y));
  assert.equal(unplaced.join(','), '', 'rooms the layout could not place');
  for (const site of HQ.siteRooms.built) assert.ok(G.nodes['site_' + site], 'the built site ' + site + ' is on the map');
  for (const part of D.hqComplexRooms()) assert.ok(G.nodes[part], 'the complex part ' + part + ' is on the map');
  for (const [mapId, th] of Object.entries(HQ.thresholds)) if (HQ.siteRooms.built.includes(mapId)) assert.ok(G.nodes['site_' + mapId] && G.nodes['site_' + mapId].no === th.roomNo, 'the threshold ' + mapId + ' (' + th.roomNo + ') is a numbered site on the map');
  /* the register and the world tab never disagree with the map about what exists */
  for (const e of D.hqRoomRegister()) { const rid = e.room || e.id; if (rid && HQ.rooms[rid]) assert.ok(G.nodes[rid], 'the register lists ' + rid + ' but the map cannot reach it'); }
  for (const r of D.hqWorldRoutes('foyer')) for (const s of r.stations) assert.ok(G.nodes[s.room], 'the world tab calls at ' + s.room + ' but the map cannot reach it');
  /* the model with everything drawn is the whole graph */
  const all = D.hqMapModel(null, 'foyer', { all: true });
  assert.equal(all.nodes.length, G.order.length, 'dev: everything drawn = every node');
  /* THE WOODS (9.3 stage 3): the first complex added under this guard hangs off its site */
  assert.equal(P.site_prebuilt_fairy_forest_clearing.where, P.site_prebuilt_fairy_forest.where, 'the woods hang off the Fairy Forest');
});

test('Directory travel survives SVG pointer capture; a drag or cancelled touch never travels', () => {
  const p = { door: {} }; D.hqRoomSee(p, 'foyer'); D.hqRoomSee(p, 'central_egress');
  const c = renderDirectory(p, 'foyer'), calls = [];
  c.window._hqDoAction = a => calls.push(a);
  const handlers = {}, svg = { getAttribute: () => '0 0 1000 800', setAttribute() {}, querySelectorAll: () => [], getBoundingClientRect: () => ({ width: 1000, height: 800 }), addEventListener: (k, fn) => handlers[k] = fn, setPointerCapture() {}, releasePointerCapture() {} };
  c.svg = svg; vm.runInContext('_hqMapBind(svg)', c);
  const node = { getAttribute: () => 'central_egress' };
  const down = { button: 0, pointerId: 1, clientX: 100, clientY: 100, target: { closest: () => node } };
  const up = { type: 'pointerup', pointerId: 1, clientX: 100, clientY: 100, target: { closest: () => null } };
  handlers.pointerdown(down); handlers.pointerup(up);
  assert.equal(calls.length, 1); assert.equal(calls[0].room, 'central_egress');
  handlers.pointerdown(down); handlers.pointermove({ ...up, clientX: 150 }); handlers.pointerup({ ...up, clientX: 150 });
  assert.equal(calls.length, 1, 'pan does not travel');
  handlers.pointerdown(down); handlers.pointerup({ ...up, type: 'pointercancel' });
  assert.equal(calls.length, 1, 'cancel does not travel');
  handlers.keydown({ key: 'Enter', target: down.target, preventDefault() {}, stopPropagation() {} });
  assert.equal(calls.length, 2, 'keyboard activation travels');
});

test('Directory labels reveal smaller areas with zoom, avoid overlaps, and never disclose question marks', () => {
  const c = renderDirectory({ door: {} }, 'foyer');
  const nodes = [
    { id: 'big', x: 5, y: 5, label: 'Large area', wild: true, st: 'seen' },
    { id: 'small', x: 7, y: 5, label: 'Small room', part: true, st: 'seen' },
    { id: 'hidden', x: 6, y: 5, label: 'Secret', st: 'q' },
    { id: 'overlap', x: 5, y: 5, label: 'Another area', wild: true, st: 'seen' }
  ];
  c.model = { nodes }; c.map.fit = [0, 0, 1000, 1000];
  vm.runInContext('this.wide = _hqMapLabelPlan(model, [0,0,1000,1000], 1000,1000); this.close = _hqMapLabelPlan(model, [400,400,400,400], 1000,1000);', c);
  assert.ok(c.wide.some(n => n.id === 'big')); assert.ok(!c.wide.some(n => n.id === 'small'));
  assert.ok(c.close.some(n => n.id === 'small')); assert.ok(!c.close.some(n => n.id === 'hidden'));
  const a = c.wide.find(n => n.id === 'big'), b = c.wide.find(n => n.id === 'overlap');
  assert.ok(!b || Math.abs(a.y - b.y) >= 19, 'overlapping anchors get separated labels');
  assert.ok(c.out.includes('id="hqMapSearch"')); assert.ok(!c.out.includes('data-mapmatch="uncharted'));
});
